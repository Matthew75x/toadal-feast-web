#!/usr/bin/env python3
"""Bounded pointer-interaction checks for companion/control overlap on current dist."""
from __future__ import annotations

import argparse
import json
import os
import threading
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from playwright.sync_api import sync_playwright


BASE_PATH = "/toadal-feast-web/"
CASE_TIMEOUT_SECONDS = 30


def parse_args() -> argparse.Namespace:
    root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", type=Path, default=root)
    parser.add_argument("--dist", type=Path, default=root / "dist")
    parser.add_argument(
        "--report-dir",
        type=Path,
        default=root / "docs/review/v1-release-20261002/overlap-after",
    )
    return parser.parse_args()


def start_dist_server(dist: Path) -> tuple[ThreadingHTTPServer, str]:
    dist = dist.resolve()

    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(dist), **kwargs)

        def translate_path(self, path: str) -> str:
            url_path = unquote(urlparse(path).path)
            if not url_path.startswith(BASE_PATH):
                return str(dist / "__not_found__")
            candidate = (dist / url_path[len(BASE_PATH):].lstrip("/")).resolve()
            if candidate != dist and dist not in candidate.parents:
                return str(dist / "__not_found__")
            if url_path.endswith("/") or (candidate.exists() and candidate.is_dir()):
                candidate /= "index.html"
            return str(candidate)

        def log_message(self, _format: str, *args) -> None:
            pass

    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server, f"http://127.0.0.1:{server.server_port}{BASE_PATH}"


GEOMETRY_JS = r"""selector => {
  const target = document.querySelector(selector);
  const companion = document.querySelector('[data-companion]');
  const parts = companion ? [...companion.querySelectorAll('.companion-toggle,.companion-panel')] : [];
  const visible = e => { const r=e.getBoundingClientRect(),s=getComputedStyle(e); return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'; };
  const rect = e => { const r=e.getBoundingClientRect(); return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}; };
  const tr=target?.getBoundingClientRect();
  const intersections=parts.filter(visible).map(e=>{
    const r=e.getBoundingClientRect();
    const width=Math.max(0,Math.min(r.right,tr.right)-Math.max(r.left,tr.left));
    const height=Math.max(0,Math.min(r.bottom,tr.bottom)-Math.max(r.top,tr.top));
    return {part:e.className,area:width*height,rect:rect(e)};
  });
  const x=tr.left+tr.width/2,y=tr.top+tr.height/2,top=document.elementFromPoint(x,y);
  return {target:rect(target),targetLabel:(target?.innerText||target?.getAttribute('aria-label')||'').trim(),intersections,
    center:{x,y,topTag:top?.tagName||null,topClass:top?.className?.baseVal||top?.className||'',isTarget:!!target&&(top===target||target.contains(top)),inCompanion:!!top?.closest('[data-companion]')},
    companionRect:companion?rect(companion):null,docked:companion?.getAttribute('data-mobile-docked')||null};
}"""


def remaining_ms(started: float) -> int:
    remaining = CASE_TIMEOUT_SECONDS - (time.monotonic() - started)
    if remaining <= 0:
        raise TimeoutError(f"Case exceeded {CASE_TIMEOUT_SECONDS}s bound")
    return max(1, int(remaining * 1000))


def run() -> int:
    args = parse_args()
    repo = args.repo.resolve()
    dist = args.dist.resolve()
    report_dir = args.report_dir.resolve()
    report_dir.mkdir(parents=True, exist_ok=True)
    if not dist.is_dir():
        raise SystemExit(f"dist directory does not exist: {dist}")

    server, base = start_dist_server(dist)
    cases: list[dict] = []
    failures: list[str] = []
    chrome = os.environ.get(
        "CHROME_PATH", r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    )
    specs = [
        ("play-desktop", "play/", 1440, 900, False, '[data-catalogue-filter="held"], [data-game-tab="public"]'),
        ("search-tablet", "search/", 768, 1024, True, 'form[data-site-search] button[type="submit"]'),
    ]

    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(executable_path=chrome, headless=True, timeout=10000)
            for name, route, width, height, mobile, selector in specs:
                started = time.monotonic()
                item: dict = {"name": name, "route": "/" + route, "viewport": {"width": width, "height": height}}
                context = browser.new_context(
                    viewport={"width": width, "height": height},
                    device_scale_factor=1,
                    is_mobile=mobile,
                    has_touch=mobile,
                )
                try:
                    page = context.new_page()
                    page.set_default_timeout(5000)
                    page.goto(base + route, wait_until="domcontentloaded", timeout=10000)
                    page.wait_for_load_state("load", timeout=remaining_ms(started))
                    modern_catalogue = name == "play-desktop" and page.locator("[data-catalogue-root]").count() > 0
                    if modern_catalogue:
                        page.wait_for_function("() => document.querySelector('[data-catalogue-root]')?.getAttribute('data-catalogue-state')==='ready'", timeout=remaining_ms(started))
                    target = page.locator(selector).first
                    target.wait_for(state="visible", timeout=remaining_ms(started))
                    if name == "search-tablet":
                        page.locator("[data-search-input]").fill("Toadal", timeout=remaining_ms(started))
                        page.wait_for_function(
                            "() => /\\d+ local results for/.test(document.querySelector('[data-search-status]')?.innerText||'')",
                            timeout=remaining_ms(started),
                        )

                    target.scroll_into_view_if_needed(timeout=remaining_ms(started))
                    item["beforeClick"] = page.evaluate(GEOMETRY_JS, selector)
                    item["beforeClickScreenshot"] = str(report_dir / f"{name}.png")
                    page.screenshot(path=item["beforeClickScreenshot"], full_page=False, timeout=remaining_ms(started))
                    geometry = item["beforeClick"]
                    if not geometry["center"]["isTarget"] or geometry["center"]["inCompanion"]:
                        failures.append(f"{name}: target center is not hit-testable before any drag")
                    if any(intersection["area"] > 0 for intersection in geometry["intersections"]):
                        failures.append(f"{name}: companion interactive surface overlaps target")

                    target_box = target.bounding_box(timeout=remaining_ms(started))
                    if not target_box:
                        raise AssertionError("target control has no rendered box")
                    page.mouse.click(target_box["x"] + target_box["width"] / 2, target_box["y"] + target_box["height"] / 2)
                    if name == "play-desktop":
                        # Keep the current-dist smoke usable after the availability UI
                        # replaced ambiguous release-only buttons. Old snapshots retain
                        # their Public-filter witness; current source witnesses Held.
                        selected = '[data-catalogue-filter="held"]' if modern_catalogue else '[data-game-tab="public"]'
                        expected = 1 if modern_catalogue else 0
                        page.wait_for_function(
                            "({selector,expected}) => document.querySelector(selector)?.getAttribute('aria-pressed')==='true' && [...document.querySelectorAll('#browser-games .studio-game-card')].filter(e=>!e.hidden&&getComputedStyle(e).display!=='none').length===expected",
                            arg={"selector": selected, "expected": expected}, timeout=remaining_ms(started),
                        )
                        item["actionAfterClick"] = page.evaluate(
                            "selector => ({pressed:document.querySelector(selector)?.getAttribute('aria-pressed'),visibleGames:[...document.querySelectorAll('#browser-games .studio-game-card')].filter(e=>!e.hidden&&getComputedStyle(e).display!=='none').length,emptyVisible:!document.querySelector('[data-game-empty]')?.hidden})", selected
                        )
                        if item["actionAfterClick"] != {"pressed": "true", "visibleGames": expected, "emptyVisible": expected == 0}:
                            failures.append("play-desktop: selected catalogue filter did not show its expected population")
                        if modern_catalogue and page.locator('#browser-games .studio-game-card:not([hidden])').get_attribute("data-game-id") != "claw-feed-gulper":
                            failures.append("play-desktop: Held filter did not isolate the existing held listing")
                    else:
                        page.wait_for_function(
                            "() => new URLSearchParams(location.search).get('q')==='Toadal' && /\\d+ local results for/.test(document.querySelector('[data-search-status]')?.innerText||'') && document.querySelectorAll('.search-result-card').length>0",
                            timeout=remaining_ms(started),
                        )
                        item["actionAfterClick"] = page.evaluate(
                            "() => ({url:location.href,status:document.querySelector('[data-search-status]')?.innerText,resultCards:document.querySelectorAll('.search-result-card').length})"
                        )
                        if item["actionAfterClick"]["resultCards"] < 1 or "Toadal" not in item["actionAfterClick"]["url"]:
                            failures.append("search-tablet: physical Search click did not submit the query and show results")

                    item["elapsedSeconds"] = round(time.monotonic() - started, 3)
                    item["status"] = "PASS" if not any(f.startswith(name + ":") for f in failures) else "FAIL"
                except Exception as error:
                    item["status"] = "FAIL"
                    item["error"] = f"{type(error).__name__}: {error}"
                    item["elapsedSeconds"] = round(time.monotonic() - started, 3)
                    failures.append(f"{name}: {item['error']}")
                finally:
                    context.close()
                cases.append(item)

            # Separate desktop session: drag occurs only after both target controls
            # above have been tested by physical pointer clicks without prior drag.
            started = time.monotonic()
            item = {"name": "manual-drag-preservation", "route": "/play/", "viewport": {"width": 1440, "height": 900}}
            context = browser.new_context(viewport=item["viewport"], device_scale_factor=1)
            try:
                page = context.new_page()
                page.set_default_timeout(5000)
                page.goto(base + "play/", wait_until="domcontentloaded", timeout=10000)
                page.wait_for_load_state("load", timeout=remaining_ms(started))
                page.locator("[data-companion-toggle]").wait_for(state="visible", timeout=remaining_ms(started))
                toggle = page.locator("[data-companion-toggle]")
                box = toggle.bounding_box(timeout=remaining_ms(started))
                assert box, "companion toggle has no rendered box"
                page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
                page.mouse.down()
                page.mouse.move(170, 180, steps=10)
                page.mouse.up()
                page.wait_for_function(
                    "() => JSON.parse(localStorage.getItem('toadal:site:companion:position:v1')||'{}').manual===true",
                    timeout=remaining_ms(started),
                )
                before = page.evaluate("""() => {
                  const r=document.querySelector('[data-companion]').getBoundingClientRect();
                  const p=JSON.parse(localStorage.getItem('toadal:site:companion:position:v1')||'{}');
                  return {rect:{left:r.left,top:r.top,right:r.right,bottom:r.bottom},saved:{x:p.x,y:p.y,manual:p.manual}};
                }""")
                if before["saved"]["manual"] is not True or abs(before["rect"]["left"] - before["saved"]["x"]) > 2 or abs(before["rect"]["top"] - before["saved"]["y"]) > 2:
                    failures.append("manual-drag-preservation: saved manual position does not match rendered position")
                page.set_viewport_size({"width": 1441, "height": 900})
                page.wait_for_timeout(150)
                page.set_viewport_size({"width": 1440, "height": 900})
                page.wait_for_timeout(150)
                page.evaluate("window.dispatchEvent(new Event('scroll'))")
                page.wait_for_timeout(150)
                after = page.evaluate("""() => {
                  const r=document.querySelector('[data-companion]').getBoundingClientRect();
                  const p=JSON.parse(localStorage.getItem('toadal:site:companion:position:v1')||'{}');
                  return {rect:{left:r.left,top:r.top,right:r.right,bottom:r.bottom},saved:{x:p.x,y:p.y,manual:p.manual}};
                }""")
                item.update({"beforeInvalidation": before, "afterResizeAndScroll": after})
                if after["saved"]["manual"] is not True or abs(after["rect"]["left"] - before["rect"]["left"]) > 2 or abs(after["rect"]["top"] - before["rect"]["top"]) > 2:
                    failures.append("manual-drag-preservation: automatic invalidation moved or reset the manual placement")
                item["screenshot"] = str(report_dir / "manual-drag-preserved.png")
                page.screenshot(path=item["screenshot"], full_page=False, timeout=remaining_ms(started))
                item["status"] = "PASS" if not any(f.startswith("manual-drag-preservation:") for f in failures) else "FAIL"
                item["elapsedSeconds"] = round(time.monotonic() - started, 3)
            except Exception as error:
                item["status"] = "FAIL"
                item["error"] = f"{type(error).__name__}: {error}"
                item["elapsedSeconds"] = round(time.monotonic() - started, 3)
                failures.append(f"manual-drag-preservation: {item['error']}")
            finally:
                context.close()
            cases.append(item)
            browser.close()
    finally:
        server.shutdown()
        server.server_close()

    report = {
        "schema": "toadal-feast.v1-companion-controls-qa.v1",
        "dist": str(dist),
        "basePath": BASE_PATH,
        "caseTimeoutSeconds": CASE_TIMEOUT_SECONDS,
        "cases": cases,
        "failures": failures,
        "summary": {"status": "FAIL" if failures else "PASS", "cases": len(cases), "passed": sum(case.get("status") == "PASS" for case in cases), "failed": sum(case.get("status") != "PASS" for case in cases)},
    }
    (report_dir / "report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report["summary"], indent=2))
    for failure in failures:
        print(f"FAIL: {failure}")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(run())
