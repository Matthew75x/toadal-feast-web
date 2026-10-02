#!/usr/bin/env python3
"""Focused before/after visual evidence for the owner-visual acceptance pass.

This is an evidence harness, not a release gate. It captures a bounded route set,
records browser/network/layout checks, and never edits site source or dist.
"""
from __future__ import annotations

import argparse
import json
import os
import threading
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

from playwright.sync_api import sync_playwright


BASE_PATH = "/toadal-feast-web/"
CAPTURES = [
    {"name": "home-1920x1080", "route": "/", "width": 1920, "height": 1080},
    {"name": "home-1366x768", "route": "/", "width": 1366, "height": 768},
    {"name": "home-390x844", "route": "/", "width": 390, "height": 844},
    {"name": "app-1440x900", "route": "/app/", "width": 1440, "height": 900},
    {"name": "app-390x844", "route": "/app/", "width": 390, "height": 844},
    {"name": "world-1440x900", "route": "/world/", "width": 1440, "height": 900},
    {"name": "world-390x844", "route": "/world/", "width": 390, "height": 844},
    {"name": "characters-gully-1440x900", "route": "/characters/", "width": 1440, "height": 900, "gully": True},
    {"name": "characters-gully-390x844", "route": "/characters/", "width": 390, "height": 844, "gully": True},
    {"name": "media-1440x900", "route": "/media/", "width": 1440, "height": 900},
    {"name": "play-390x844", "route": "/play/", "width": 390, "height": 844},
    {"name": "stories-390x844", "route": "/stories/", "width": 390, "height": 844},
    {"name": "feast-pass-390x844", "route": "/feast-pass/", "width": 390, "height": 844},
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", required=True, type=Path)
    parser.add_argument("--dist", required=True, type=Path)
    parser.add_argument("--stage", required=True, choices=("before", "after"))
    parser.add_argument("--report-dir", required=True, type=Path)
    parser.add_argument("--live-base", help="Optional public base URL, e.g. https://host/project/")
    parser.add_argument("--home-full-only", action="store_true", help="Refresh only the 1366px Home full-page capture; preserve any existing route records in the report.")
    return parser.parse_args()


def start_dist_server(dist: Path) -> tuple[ThreadingHTTPServer, str]:
    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(dist), **kwargs)

        def translate_path(self, path: str) -> str:
            parsed = urlparse(path)
            url_path = unquote(parsed.path)
            if not url_path.startswith(BASE_PATH):
                return str(dist / "__not_found__")
            relative = url_path[len(BASE_PATH):].lstrip("/")
            candidate = (dist / relative).resolve()
            if candidate != dist and dist not in candidate.parents:
                return str(dist / "__not_found__")
            if url_path.endswith("/") or (candidate.exists() and candidate.is_dir()):
                candidate = candidate / "index.html"
            return str(candidate)

        def log_message(self, _format: str, *args) -> None:
            pass

    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server, f"http://127.0.0.1:{server.server_port}{BASE_PATH}"


def run_companion_interactions(browser, base: str, screenshot_dir: Path) -> tuple[list[dict], list[dict]]:
    """Exercise the companion with real browser mouse/touch/pointer capture."""
    results: list[dict] = []
    failures: list[dict] = []
    position_key = "toadal:site:companion:position:v1"

    def record(name: str, passed: bool, detail: dict) -> None:
        row = {"name": name, "status": "PASS" if passed else "FAIL", "detail": detail}
        results.append(row)
        if not passed:
            failures.append({"interaction": name, "detail": detail})

    def state(page) -> dict:
        return page.evaluate("""key => {const r=document.querySelector('[data-companion]'),b=r?.querySelector('[data-companion-toggle]'),i=r?.querySelector('[data-companion-image]'),p=r?.querySelector('[data-companion-panel]'),rect=r?.getBoundingClientRect();let saved=null;try{saved=JSON.parse(localStorage.getItem(key)||'null')}catch{}return {docked:r?.getAttribute('data-mobile-docked'),manual:saved?.manual===true,saved,expanded:b?.getAttribute('aria-expanded'),panelVisible:!!p&&!p.hidden&&getComputedStyle(p).display!=='none',reaction:r?.getAttribute('data-companion-current-reaction'),image:i?.getAttribute('src'),imageHeight:i?.getBoundingClientRect().height,rect:rect?{left:rect.left,top:rect.top,right:rect.right,bottom:rect.bottom}:null};}""", position_key)

    # Desktop remains a free-floating companion. Hovering real World content
    # should select its reaction/artwork; a real mouse drag persists on reload.
    desktop = browser.new_context(viewport={"width": 1366, "height": 768}, device_scale_factor=1)
    page = desktop.new_page()
    try:
        page.goto(base, wait_until="load", timeout=45000)
        page.wait_for_timeout(650)
        initial = state(page)
        record("desktop-default-free-float", initial["docked"] is None and initial["rect"] is not None, initial)
        page.locator("#world h3").hover(timeout=5000)
        page.wait_for_function("""() => {const r=document.querySelector('[data-companion]'),i=r?.querySelector('[data-companion-image]');return r?.getAttribute('data-companion-current-reaction')==='curious'&&/world-map\\.webp/.test(i?.getAttribute('src')||'');}""", timeout=5000)
        world_context = state(page)
        copy = page.locator("[data-companion-speech]").inner_text()
        record("desktop-world-hover-context-reaction", world_context["reaction"] == "curious" and "canonical environment art" in copy.lower() and "world-map.webp" in (world_context["image"] or ""), {"state": world_context, "speech": copy})
        page.mouse.move(4, 4)
        page.wait_for_function("""() => {const b=document.querySelector('[data-companion-toggle]'),p=document.querySelector('[data-companion-panel]');return b?.getAttribute('aria-expanded')==='false'&&p.hidden;}""", timeout=5000)
        toggle = page.locator("[data-companion-toggle]")
        toggle.click()
        page.wait_for_function("""() => document.querySelector('[data-companion-toggle]')?.getAttribute('aria-expanded')==='true'""")
        opened = state(page)
        toggle.click()
        page.wait_for_function("""() => document.querySelector('[data-companion-toggle]')?.getAttribute('aria-expanded')==='false'""")
        closed = state(page)
        record("desktop-bubble-click-open-close", opened["panelVisible"] and not closed["panelVisible"], {"opened": opened, "closed": closed})

        button = page.locator("[data-companion-toggle]")
        box = button.bounding_box()
        start = {"x": box["x"] + box["width"] / 2, "y": box["y"] + box["height"] / 2}
        origin = state(page)["rect"]
        page.mouse.move(start["x"], start["y"])
        page.mouse.down()
        page.mouse.move(start["x"] + 96, start["y"] + 64, steps=8)
        page.mouse.up()
        page.wait_for_timeout(180)
        dragged = state(page)
        moved = dragged["rect"] and (abs(dragged["rect"]["left"] - origin["left"]) > 20 or abs(dragged["rect"]["top"] - origin["top"]) > 20)
        record("desktop-real-mouse-drag-persists-manual-position", bool(moved and dragged["manual"] and dragged["docked"] is None), {"origin": origin, "afterDrag": dragged})
        page.screenshot(path=str(screenshot_dir / "companion-desktop-after-drag.png"), full_page=False, animations="disabled")
        page.reload(wait_until="load")
        page.wait_for_timeout(350)
        reloaded = state(page)
        same_position = reloaded["rect"] and dragged["rect"] and abs(reloaded["rect"]["left"] - dragged["rect"]["left"]) <= 2 and abs(reloaded["rect"]["top"] - dragged["rect"]["top"]) <= 2
        record("desktop-manual-position-survives-reload", bool(same_position and reloaded["manual"]), {"beforeReload": dragged, "afterReload": reloaded})

        # A pre-manual-state legacy automatic corner must be recognized as
        # automatic and migrate to the new default, not be frozen as user intent.
        legacy_auto = page.evaluate("""key => {const r=document.querySelector('[data-companion]'),b=r.getBoundingClientRect(),saved={version:1,x:innerWidth-b.width-12,y:innerHeight-b.height-12-180};localStorage.setItem(key,JSON.stringify(saved));return {saved,rect:{left:b.left,top:b.top,width:b.width,height:b.height}};}""", position_key)
        page.reload(wait_until="load")
        page.wait_for_timeout(350)
        migrated = state(page)
        record("legacy-automatic-desktop-corner-migrates-as-neutral", not migrated["manual"] and migrated["docked"] is None, {"legacy": legacy_auto, "afterMigration": migrated})
    except Exception as error:
        failures.append({"interaction": "desktop-companion-sequence", "detail": {"error": str(error)}})
        results.append({"name": "desktop-companion-sequence", "status": "FAIL", "detail": {"error": str(error)}})
    finally:
        desktop.close()

    # On mobile, verify the header-gap dock, touch-driven context and bubble,
    # then exercise actual pointercancel and lostpointercapture restoration.
    mobile = browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=1, is_mobile=True, has_touch=True)
    page = mobile.new_page()
    mobile_step = "mobile-load"
    lost_capture_debug = None
    try:
        page.goto(base, wait_until="load", timeout=45000)
        page.wait_for_timeout(650)
        initial = state(page)
        record("mobile-default-header-gap-dock-390", initial["docked"] == "true" and abs((initial["imageHeight"] or 0) - 52) <= 1, initial)

        mobile_step = "mobile-desktop-mobile-resize"
        page.set_viewport_size({"width": 1366, "height": 768})
        page.wait_for_timeout(250)
        desktop_size = state(page)
        page.set_viewport_size({"width": 390, "height": 844})
        page.wait_for_timeout(300)
        back_to_mobile = state(page)
        neutral_roundtrip = back_to_mobile["docked"] == "true" and not back_to_mobile["manual"] and abs(back_to_mobile["rect"]["left"] - initial["rect"]["left"]) <= 2 and abs(back_to_mobile["rect"]["top"] - initial["rect"]["top"]) <= 2
        record("mobile-desktop-mobile-restores-neutral-dock-coordinates", bool(desktop_size["docked"] is None and not desktop_size["manual"] and neutral_roundtrip), {"mobileStart": initial, "desktop": desktop_size, "mobileReturn": back_to_mobile})

        mobile_step = "mobile-menu-open-close"
        menu = page.locator(".nav-toggle")
        menu.tap()
        page.wait_for_function("""() => document.querySelector('.nav-toggle')?.getAttribute('aria-expanded')==='true'&&[...document.querySelectorAll('.site-links a')].some(a=>getComputedStyle(a).display!=='none'&&a.getBoundingClientRect().width>0)""", timeout=5000)
        menu_open = page.evaluate("""() => ({expanded:document.querySelector('.nav-toggle')?.getAttribute('aria-expanded'),visibleLinks:[...document.querySelectorAll('.site-links a')].filter(a=>getComputedStyle(a).display!=='none'&&a.getBoundingClientRect().width>0).length})""")
        menu.tap()
        page.wait_for_function("""() => document.querySelector('.nav-toggle')?.getAttribute('aria-expanded')==='false'""", timeout=5000)
        menu_closed = page.evaluate("""() => ({expanded:document.querySelector('.nav-toggle')?.getAttribute('aria-expanded'),linksHidden:document.querySelector('.site-links')?.hidden})""")
        record("mobile-menu-open-close-smoke", menu_open["expanded"] == "true" and menu_open["visibleLinks"] > 0 and menu_closed["expanded"] == "false" and menu_closed["linksHidden"], {"opened": menu_open, "closed": menu_closed})

        mobile_step = "mobile-world-context-touch"
        page.locator("#world h3").tap(timeout=5000)
        page.wait_for_function("""() => {const r=document.querySelector('[data-companion]'),i=r?.querySelector('[data-companion-image]');return r?.getAttribute('data-companion-current-reaction')==='curious'&&/world-map\\.webp/.test(i?.getAttribute('src')||'')&&i.complete&&i.naturalWidth>0;}""", timeout=5000)
        touch_context = state(page)
        touch_copy = page.locator("[data-companion-speech]").inner_text()
        record("mobile-touch-world-context-reaction", touch_context["reaction"] == "curious" and "canonical environment art" in touch_copy.lower(), {"state":touch_context,"speech":touch_copy})
        # Context is deliberately transient for touch. Let the site's own
        # three-second touch-context lease expire before testing the toggle.
        mobile_step = "mobile-context-lease-expiry"
        page.wait_for_timeout(3200)
        page.wait_for_function("""() => {const b=document.querySelector('[data-companion-toggle]'),p=document.querySelector('[data-companion-panel]');return b?.getAttribute('aria-expanded')==='false'&&p.hidden;}""", timeout=5000)
        mobile_step = "mobile-companion-bubble-toggle"
        toggle = page.locator("[data-companion-toggle]")
        toggle.tap(timeout=5000)
        page.wait_for_function("""() => {const b=document.querySelector('[data-companion-toggle]'),p=document.querySelector('[data-companion-panel]');return b?.getAttribute('aria-expanded')==='true'&&p&&!p.hidden;}""", timeout=5000)
        opened = state(page)
        toggle.tap(timeout=5000)
        page.wait_for_function("""() => {const b=document.querySelector('[data-companion-toggle]'),p=document.querySelector('[data-companion-panel]');return b?.getAttribute('aria-expanded')==='false'&&p.hidden;}""", timeout=5000)
        closed = state(page)
        record("mobile-touch-bubble-opens-and-closes", opened["panelVisible"] and not closed["panelVisible"], {"opened": opened, "closed": closed})
        page.screenshot(path=str(screenshot_dir / "companion-mobile-header-dock-390.png"), full_page=False, animations="disabled")

        mobile_step = "mobile-touchcancel-setup"
        cdp = mobile.new_cdp_session(page)
        cdp.send("Runtime.evaluate", {"expression": "window.__companionPointerEvents=[];const b=document.querySelector('[data-companion-toggle]');for(const n of ['pointerdown','pointermove','pointerup','pointercancel','lostpointercapture'])b.addEventListener(n,e=>{window.__companionPointerEvents.push({type:e.type,id:e.pointerId,isPrimary:e.isPrimary});if(e.type==='pointerdown')window.__companionPointerId=e.pointerId;},true);"})

        def touch_point(x: float, y: float, pointer_id: int = 1) -> dict:
            return {"x": x, "y": y, "radiusX": 3, "radiusY": 3, "force": 1, "id": pointer_id}

        def start_and_move_touch() -> tuple[dict, dict, dict]:
            rect = page.locator("[data-companion-toggle]").bounding_box()
            point = {"x": rect["x"] + rect["width"] / 2, "y": rect["y"] + rect["height"] / 2}
            before = state(page)
            cdp.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [touch_point(point["x"], point["y"]) ]})
            cdp.send("Input.dispatchTouchEvent", {"type": "touchMove", "touchPoints": [touch_point(point["x"] + 74, point["y"] + 58)]})
            page.wait_for_function("""() => document.querySelector('[data-companion]')?.getAttribute('data-dragging')==='true'""", timeout=5000)
            return before, state(page), point

        mobile_step = "mobile-pointercancel-gesture"
        before_cancel, moving_cancel, _cancel_point = start_and_move_touch()
        cdp.send("Input.dispatchTouchEvent", {"type": "touchCancel", "touchPoints": []})
        page.wait_for_function("""() => {const r=document.querySelector('[data-companion]');return r?.getAttribute('data-mobile-docked')==='true'&&!r.hasAttribute('data-dragging');}""", timeout=5000)
        after_cancel = state(page)
        cancel_events = page.evaluate("window.__companionPointerEvents")
        cancel_seen = any(e["type"] == "pointercancel" for e in cancel_events)
        neutral_cancel = after_cancel["docked"] == "true" and not after_cancel["manual"] and abs(after_cancel["rect"]["left"] - before_cancel["rect"]["left"]) <= 2 and abs(after_cancel["rect"]["top"] - before_cancel["rect"]["top"]) <= 2
        record("mobile-real-touchcancel-restores-default-dock", bool(cancel_seen and neutral_cancel), {"before": before_cancel, "during": moving_cancel, "after": after_cancel, "pointerEvents": cancel_events})

        mobile_step = "mobile-lostpointercapture-gesture"
        before_lost, moving_lost, lost_point = start_and_move_touch()
        mobile_step = "mobile-lostpointercapture-release"
        lost_capture_debug = page.evaluate("""() => {const b=document.querySelector('[data-companion-toggle]'),id=window.__companionPointerId;const result={pointerId:id,hasCapture:!!b&&Number.isFinite(id)&&b.hasPointerCapture(id),events:window.__companionPointerEvents.slice()};if(result.hasCapture)b.releasePointerCapture(id);return result;}""")
        # Pointer capture release is delivered at the next pointer event; move
        # the active touch again so the browser emits lostpointercapture.
        cdp.send("Input.dispatchTouchEvent", {"type":"touchMove","touchPoints":[touch_point(lost_point["x"]+82,lost_point["y"]+66)]})
        page.wait_for_function("""() => {const r=document.querySelector('[data-companion]');return r?.getAttribute('data-mobile-docked')==='true'&&!r.hasAttribute('data-dragging');}""", timeout=5000)
        after_lost = state(page)
        lost_events = page.evaluate("window.__companionPointerEvents")
        lost_seen = any(e["type"] == "lostpointercapture" for e in lost_events)
        neutral_lost = after_lost["docked"] == "true" and not after_lost["manual"] and abs(after_lost["rect"]["left"] - before_lost["rect"]["left"]) <= 2 and abs(after_lost["rect"]["top"] - before_lost["rect"]["top"]) <= 2
        record("mobile-lostpointercapture-restores-default-dock", bool(lost_seen and neutral_lost), {"before": before_lost, "during": moving_lost, "after": after_lost, "pointerEvents": lost_events})
        mobile_step = "mobile-post-cancel-reload"
        cdp.send("Input.dispatchTouchEvent", {"type": "touchCancel", "touchPoints": []})
        page.wait_for_timeout(100)
        page.reload(wait_until="load")
        page.wait_for_timeout(350)
        after_reload = state(page)
        record("mobile-cancelled-dock-survives-reload", after_reload["docked"] == "true" and not after_reload["manual"], after_reload)
        page.screenshot(path=str(screenshot_dir / "companion-mobile-after-cancel-390.png"), full_page=False, animations="disabled")
        cdp.detach()

        # Seed the old, untagged bottom-corner coordinate on a fresh mobile
        # context; the current runtime must classify it as automatic and dock.
        mobile_step = "legacy-mobile-auto-migration"
        legacy_context = browser.new_context(viewport={"width":390,"height":844},device_scale_factor=1,is_mobile=True,has_touch=True)
        legacy_page = legacy_context.new_page()
        legacy_page.goto(base, wait_until="load", timeout=45000)
        legacy_page.wait_for_timeout(250)
        legacy_mobile = legacy_page.evaluate("""key => {const r=document.querySelector('[data-companion]');r.removeAttribute('data-mobile-docked');r.removeAttribute('style');const b=r.getBoundingClientRect(),old={version:1,x:innerWidth-b.width-12,y:innerHeight-b.height-12-180};localStorage.setItem(key,JSON.stringify(old));return {legacy:old,legacyCssRect:{left:b.left,top:b.top,width:b.width,height:b.height}};}""", position_key)
        legacy_page.reload(wait_until="load")
        legacy_page.wait_for_timeout(300)
        migrated_mobile = state(legacy_page)
        record("legacy-mobile-automatic-corner-migrates-to-header-dock", migrated_mobile["docked"] == "true" and not migrated_mobile["manual"] and (abs(migrated_mobile["rect"]["left"] - legacy_mobile["legacy"]["x"]) > 10 or abs(migrated_mobile["rect"]["top"] - legacy_mobile["legacy"]["y"]) > 10), {"legacy":legacy_mobile,"afterMigration":migrated_mobile})
        legacy_page.evaluate("""key => localStorage.setItem(key,JSON.stringify({version:1,x:1202,y:434}))""", position_key)
        legacy_page.reload(wait_until="load")
        legacy_page.wait_for_timeout(300)
        cross_viewport = state(legacy_page)
        record("legacy-desktop-coordinates-migrate-to-mobile-header-dock", cross_viewport["docked"] == "true" and not cross_viewport["manual"], cross_viewport)
        legacy_context.close()

        # User-intended touch drag removes the default dock and survives reload.
        mobile_step = "mobile-manual-drag-reload"
        manual_context = browser.new_context(viewport={"width":390,"height":844},device_scale_factor=1,is_mobile=True,has_touch=True)
        manual_page = manual_context.new_page()
        manual_page.goto(base, wait_until="load", timeout=45000)
        manual_page.wait_for_timeout(300)
        manual_cdp = manual_context.new_cdp_session(manual_page)
        manual_start = state(manual_page)
        manual_point = manual_page.locator("[data-companion-toggle]").bounding_box()
        px, py = manual_point["x"]+manual_point["width"]/2, manual_point["y"]+manual_point["height"]/2
        manual_cdp.send("Input.dispatchTouchEvent", {"type":"touchStart","touchPoints":[touch_point(px,py)]})
        manual_cdp.send("Input.dispatchTouchEvent", {"type":"touchMove","touchPoints":[touch_point(px+68,py+52)]})
        manual_page.wait_for_function("""() => document.querySelector('[data-companion]')?.getAttribute('data-dragging')==='true'""",timeout=5000)
        manual_cdp.send("Input.dispatchTouchEvent", {"type":"touchEnd","touchPoints":[]})
        manual_page.wait_for_function("""() => {const r=document.querySelector('[data-companion]');return !r.hasAttribute('data-dragging')&&r.getAttribute('data-mobile-docked')!=='true';}""",timeout=5000)
        manual_after_drag = state(manual_page)
        manual_page.reload(wait_until="load")
        manual_page.wait_for_timeout(300)
        manual_after_reload = state(manual_page)
        manual_same = manual_after_reload["rect"] and manual_after_drag["rect"] and abs(manual_after_reload["rect"]["left"]-manual_after_drag["rect"]["left"])<=2 and abs(manual_after_reload["rect"]["top"]-manual_after_drag["rect"]["top"])<=2
        record("mobile-deliberate-touch-drag-overrides-dock-and-persists", bool(manual_after_drag["manual"] and manual_after_drag["docked"] is None and manual_same and manual_after_reload["manual"]), {"before":manual_start,"afterDrag":manual_after_drag,"afterReload":manual_after_reload})
        manual_page.screenshot(path=str(screenshot_dir / "companion-mobile-after-manual-drag-390.png"),full_page=False,animations="disabled")
        manual_cdp.detach()
        manual_context.close()
    except Exception as error:
        diagnostic = {"step":mobile_step,"error":str(error),"lostPointerCapture":lost_capture_debug}
        try: diagnostic["stateAtFailure"] = state(page)
        except Exception: pass
        failures.append({"interaction": "mobile-companion-sequence", "detail": diagnostic})
        results.append({"name": "mobile-companion-sequence", "status": "FAIL", "detail": diagnostic})
    finally:
        mobile.close()

    return results, failures


def main() -> int:
    args = parse_args()
    repo = args.repo.resolve()
    dist = args.dist.resolve()
    report_dir = args.report_dir.resolve()
    report_path = report_dir / "owner-visual-acceptance-qa.json"
    if not dist.is_dir() or not (dist / "index.html").is_file():
        raise SystemExit(f"--dist must be a rendered site directory containing index.html: {dist}")
    if args.live_base and not args.live_base.endswith("/"):
        raise SystemExit("--live-base must end with '/'.")
    report_dir.mkdir(parents=True, exist_ok=True)
    screenshot_dir = report_dir / "screenshots"
    screenshot_dir.mkdir(parents=True, exist_ok=True)

    local_server = None
    local_base = None
    if not args.live_base:
        local_server, local_base = start_dist_server(dist)

    report = {
        "schema": "toadal-feast.owner-visual-acceptance-qa.v1",
        "stage": args.stage,
        "repo": str(repo),
        "dist": str(dist),
        "liveBase": args.live_base,
        "localBase": local_base,
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "captures": [],
        "companionGeometry": [],
        "companionInteractions": [],
        "additionalScreenshots": [],
        "summary": {"status": "PASS", "captures": len(CAPTURES), "failedChecks": 0},
    }
    failures = []

    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(
                executable_path=os.environ.get("CHROME_PATH", r"C:\Program Files\Google\Chrome\Application\chrome.exe"),
                headless=True,
            )
            capture_plan = [spec for spec in CAPTURES if spec["name"] == "home-1366x768"] if args.home_full_only else CAPTURES
            for spec in capture_plan:
                context = browser.new_context(
                    viewport={"width": spec["width"], "height": spec["height"]},
                    device_scale_factor=1,
                    is_mobile=spec["width"] <= 600,
                    has_touch=spec["width"] <= 600,
                )
                page = context.new_page()
                page.add_init_script("""document.addEventListener('DOMContentLoaded', () => {
                  const image=document.querySelector('[data-companion-image]');
                  window.__companionImageHistory=[];
                  if(!image)return;
                  const remember=()=>window.__companionImageHistory.push(image.src);
                  remember();new MutationObserver(remember).observe(image,{attributes:true,attributeFilter:['src']});
                });""")
                bad_responses: list[dict] = []
                request_failures: list[dict] = []
                page_errors: list[str] = []
                console_errors: list[str] = []
                page.on("response", lambda response: bad_responses.append({"status": response.status, "url": response.url}) if response.status >= 400 and "favicon.ico" not in response.url else None)
                page.on("requestfailed", lambda request: request_failures.append({"url": request.url, "failure": request.failure}))
                page.on("pageerror", lambda error: page_errors.append(str(error)))
                page.on("console", lambda message: console_errors.append(message.text) if message.type == "error" else None)

                base = args.live_base or local_base
                target = base + spec["route"].lstrip("/")
                response = page.goto(target, wait_until="domcontentloaded", timeout=45000)
                page.wait_for_load_state("load", timeout=45000)
                page.wait_for_timeout(700)

                if spec.get("gully"):
                    locator = page.locator("img[src*='characters/gully.webp']").first
                    if locator.count():
                        locator.evaluate("img => { img.loading='eager'; img.scrollIntoView({block:'center', behavior:'instant'}); }")
                        locator.evaluate("img => img.decode().catch(() => {})")
                        page.wait_for_timeout(250)

                checks = page.evaluate("""() => {
                  const visible = e => { const r=e.getBoundingClientRect(),s=getComputedStyle(e); return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'&&r.bottom>0&&r.top<innerHeight; };
                  const imgs=[...document.images].filter(visible);
                  const intersects = (a,b) => Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top))>0;
                  const cta=[...document.querySelectorAll('main a[href],main button,[role=main] a[href],[role=main] button')].filter(e => { const r=e.getBoundingClientRect(),s=getComputedStyle(e); return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'&&!e.disabled; });
                  const gully=[...document.images].find(i => (i.getAttribute('src')||i.currentSrc||'').includes('characters/gully.webp'));
                  const root=document.querySelector('[data-companion]'), toggle=root?.querySelector('[data-companion-toggle]'), image=root?.querySelector('[data-companion-image]');
                  const imageRect=image?.getBoundingClientRect();
                  const header=document.querySelector('header.site-header, .site-header, header');
                  const headerRect=header?.getBoundingClientRect(), headerStyle=header?getComputedStyle(header):null;
                  const stickyHeaderBottom=header&&headerRect&&headerStyle&&['fixed','sticky'].includes(headerStyle.position)&&headerRect.top<=1&&headerRect.bottom>0?Math.min(innerHeight,headerRect.bottom):0;
                  const homeLayout=location.pathname==='/'||location.pathname==='/toadal-feast-web/'?{documentHeight:document.documentElement.scrollHeight,sections:Object.fromEntries(['today','interactive-discovery','discovery','app'].map(id=>{const e=document.getElementById(id);if(!e)return [id,null];const r=e.getBoundingClientRect();return [id,{top:r.top+scrollY,left:r.left+scrollX,right:r.right+scrollX,bottom:r.bottom+scrollY,width:r.width,height:r.height}];}))}:null;
                  const homeHeroAlpha=innerWidth===390&&(location.pathname==='/'||location.pathname==='/toadal-feast-web/')?(()=>{const art=document.querySelector('.home-hero__toadal img'),actions=[...document.querySelectorAll('.home-hero .home-actions a')];if(!art||!art.complete||!art.naturalWidth||!actions.length)return {available:false,reason:'hero image or primary actions unavailable'};const box=art.getBoundingClientRect(),canvas=document.createElement('canvas');canvas.width=art.naturalWidth;canvas.height=art.naturalHeight;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(art,0,0);const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;return {available:true,art:{src:art.currentSrc||art.src,naturalWidth:art.naturalWidth,naturalHeight:art.naturalHeight,rect:{left:box.left,top:box.top,right:box.right,bottom:box.bottom}},actions:actions.map(e=>{const r=e.getBoundingClientRect(),l=Math.max(box.left,r.left),t=Math.max(box.top,r.top),right=Math.min(box.right,r.right),bottom=Math.min(box.bottom,r.bottom);let opaqueOverlapPixels=0;if(right>l&&bottom>t){const x0=Math.max(0,Math.floor((l-box.left)*art.naturalWidth/box.width)),x1=Math.min(art.naturalWidth,Math.ceil((right-box.left)*art.naturalWidth/box.width)),y0=Math.max(0,Math.floor((t-box.top)*art.naturalHeight/box.height)),y1=Math.min(art.naturalHeight,Math.ceil((bottom-box.top)*art.naturalHeight/box.height));for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(pixels[(y*art.naturalWidth+x)*4+3]>32)opaqueOverlapPixels++;}return {text:e.innerText.trim(),rect:{left:r.left,top:r.top,right:r.right,bottom:r.bottom},opaqueOverlapPixels};})};})():null;
                  const appStoreTruth=(location.pathname.endsWith('/app/')||location.pathname==='/app/')?(()=>{const buttons=[...document.querySelectorAll('.store-badge')];return {buttonCount:buttons.length,allDisabled:buttons.length>=2&&buttons.every(b=>b.disabled),labels:buttons.map(b=>b.innerText.replace(/\\s+/g,' ').trim())};})():null;
                  const mobileDockGeometry=(() => {
                    if(innerWidth>600||!root||!image||!imageRect)return null;
                    const imageBox={left:imageRect.left,top:imageRect.top,right:imageRect.right,bottom:imageRect.bottom};
                    const targets=[...document.querySelectorAll('main a[href],main button,main h1,main h2,main h3,main p,main img')].filter(e=>!root.contains(e)&&visible(e));
                    const intersections=targets.map(e=>{const r=e.getBoundingClientRect(),clipped={left:Math.max(0,r.left),right:Math.min(innerWidth,r.right),top:Math.max(stickyHeaderBottom,r.top),bottom:Math.min(innerHeight,r.bottom)};return {tag:e.tagName.toLowerCase(),text:(e.innerText||e.alt||'').trim().slice(0,100),rect:{left:r.left,top:r.top,right:r.right,bottom:r.bottom},visibleBelowHeaderRect:clipped,intersectsCompanionImage:clipped.right>clipped.left&&clipped.bottom>clipped.top&&intersects(imageBox,clipped)};}).filter(e=>e.intersectsCompanionImage);
                    const headerTargets=[...document.querySelectorAll('.site-brand,[class*="brand-crown"],[class*="brand-mark"],.nav-toggle,.site-nav .site-links a')].filter(visible).map(e=>{const r=e.getBoundingClientRect();return {selector:e.className?.baseVal||e.className||e.tagName.toLowerCase(),text:(e.innerText||e.getAttribute('aria-label')||'').trim().slice(0,80),rect:{left:r.left,top:r.top,right:r.right,bottom:r.bottom},intersectsCompanionImage:intersects(imageBox,r)};});
                    return {image:{src:image.currentSrc||image.src,rect:imageBox,renderedHeight:imageRect.height},stickyHeaderBottom,intersections,headerTargets,headerOverlaps:headerTargets.filter(e=>e.intersectsCompanionImage),rootDocked:root.getAttribute('data-mobile-docked'),imageLoaded:image.complete&&image.naturalWidth>0};
                  })();
                  return {
                    title: document.title,
                    homeLayout,
                    homeHeroAlpha,
                    appStoreTruth,
                    horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
                    brokenImages: imgs.filter(i => i.complete && i.naturalWidth===0).map(i=>i.currentSrc||i.src),
                    primaryCtaCount: cta.length,
                    primaryCtaLoaded: cta.length>0,
                    gully: gully ? {src:gully.currentSrc||gully.src, complete:gully.complete, naturalWidth:gully.naturalWidth, naturalHeight:gully.naturalHeight, loaded:gully.complete&&gully.naturalWidth>0} : null,
                    companion: (() => { if(!root||!toggle)return null; const r=toggle.getBoundingClientRect(),d=root.getBoundingClientRect(); return {present:true, minimized:toggle.getAttribute('aria-expanded')==='false',root:{left:d.left,top:d.top,right:d.right,bottom:d.bottom,width:d.width,height:d.height},toggle:{left:r.left,top:r.top,right:r.right,bottom:r.bottom},withinViewport:d.left>=-1&&d.right<=innerWidth+1&&d.top>=-1&&d.bottom<=innerHeight+1}; })(),
                    mobileDockGeometry
                  };
                }""")

                companion_interaction = None
                companion_interaction_issues = []
                if spec["route"] == "/app/":
                    original_url = page.url
                    original_pages = len(context.pages)
                    stores = page.locator(".store-badge")
                    for store in stores.all():
                        box = store.bounding_box()
                        if box:
                            page.mouse.click(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
                    page.wait_for_timeout(120)
                    checks["appStoreClickSmoke"] = {"count":stores.count(),"noNavigation":page.url==original_url,"noPopup":len(context.pages)==original_pages}
                if args.stage == "after" and spec.get("gully") and spec["width"] == 390:
                    toggle = page.locator("[data-companion] [data-companion-toggle]")
                    before_state = page.evaluate("""() => { const r=document.querySelector('[data-companion]'),b=r?.querySelector('[data-companion-toggle]'),p=r?.querySelector('[data-companion-panel]'),i=r?.querySelector('[data-companion-image]'); return {docked:r?.getAttribute('data-mobile-docked'),expanded:b?.getAttribute('aria-expanded'),panelVisible:!!p&&!p.hidden&&getComputedStyle(p).display!=='none',imageHeight:i?.getBoundingClientRect().height}; }""")
                    if before_state["docked"] != "true": companion_interaction_issues.append("mobile-companion-not-docked")
                    if before_state["expanded"] != "false" or before_state["panelVisible"]: companion_interaction_issues.append("mobile-companion-not-initially-closed")
                    if abs((before_state["imageHeight"] or 0) - 52) > 1: companion_interaction_issues.append("mobile-companion-image-not-52px")
                    toggle.tap(timeout=5000)
                    page.wait_for_function("""() => { const b=document.querySelector('[data-companion-toggle]'),p=document.querySelector('[data-companion-panel]'); return b?.getAttribute('aria-expanded')==='true'&&p&&!p.hidden&&getComputedStyle(p).display!=='none'; }""", timeout=5000)
                    opened_state = page.evaluate("""() => {const p=document.querySelector('[data-companion-panel]');return {expanded:document.querySelector('[data-companion-toggle]')?.getAttribute('aria-expanded'),panelVisible:!!p&&!p.hidden&&getComputedStyle(p).display!=='none'};}""")
                    toggle.tap(timeout=5000)
                    page.wait_for_function("""() => { const b=document.querySelector('[data-companion-toggle]'),p=document.querySelector('[data-companion-panel]'); return b?.getAttribute('aria-expanded')==='false'&&(!p||p.hidden||getComputedStyle(p).display==='none'); }""", timeout=5000)
                    closed_state = page.evaluate("""() => {const p=document.querySelector('[data-companion-panel]');return {expanded:document.querySelector('[data-companion-toggle]')?.getAttribute('aria-expanded'),panelVisible:!!p&&!p.hidden&&getComputedStyle(p).display!=='none'};}""")
                    companion_interaction = {"input": "Playwright touch tap", "before": before_state, "opened": opened_state, "closed": closed_state}
                    if opened_state != {"expanded": "true", "panelVisible": True}: companion_interaction_issues.append("mobile-companion-tap-open-failed")
                    if closed_state != {"expanded": "false", "panelVisible": False}: companion_interaction_issues.append("mobile-companion-tap-close-failed")

                if spec.get("gully"):
                    page.wait_for_timeout(150)
                # Capture a viewport screenshot; Gully captures are deliberately
                # scrolled to the Gully card to make the subject and companion visible together.
                screenshot = screenshot_dir / f"{spec['name']}.png"
                page.screenshot(path=str(screenshot), full_page=False, animations="disabled")
                if spec["route"] == "/" and spec["width"] == 1366 and spec["height"] == 768:
                    # Traverse the real page so native lazy-loading triggers,
                    # decode content images, then restore the comparison origin.
                    page.evaluate("window.scrollTo({top:0,behavior:'instant'})")
                    page.wait_for_timeout(150)
                    page_height = page.evaluate("document.documentElement.scrollHeight")
                    stride = max(250, spec["height"] - 150)
                    for scroll_y in range(0, page_height, stride):
                        page.evaluate("y => window.scrollTo({top:y,behavior:'instant'})", scroll_y)
                        page.wait_for_timeout(150)
                    image_load_summary = page.evaluate("""async () => {
                      const images=[...document.images];images.forEach(i=>i.loading='eager');
                      const decoded=await Promise.all(images.map(async i=>{
                        const loaded=await Promise.race([i.decode().then(()=>true,()=>false),new Promise(r=>setTimeout(()=>r(false),2500))]);
                        return {src:i.currentSrc||i.src,loaded};
                      }));
                      return {imageCount:images.length,decoded:decoded.filter(x=>x.loaded).length,failed:decoded.filter(x=>!x.loaded)};
                    }""")
                    page.evaluate("window.scrollTo({top:0,behavior:'instant'})")
                    page.wait_for_timeout(150)
                    checks["homeLayout"] = page.evaluate("""() => ({documentHeight:document.documentElement.scrollHeight,sections:Object.fromEntries(['today','interactive-discovery','discovery','app'].map(id=>{const e=document.getElementById(id);if(!e)return [id,null];const r=e.getBoundingClientRect();return [id,{top:r.top+scrollY,left:r.left+scrollX,right:r.right+scrollX,bottom:r.bottom+scrollY,width:r.width,height:r.height}];}))})""")
                    full_page_screenshot = screenshot_dir / "home-1366x768-full-page.png"
                    page.screenshot(path=str(full_page_screenshot), full_page=True, animations="disabled")
                    report["additionalScreenshots"].append({"name":"home-1366x768-full-page","path":str(full_page_screenshot),"viewport":{"width":1366,"height":768},"documentHeight":checks["homeLayout"]["documentHeight"],"scrollStride":stride,"lazyImageDecode":image_load_summary,"description":"Full-page Home composition after real viewport-step scrolling, lazy-image decoding, and return to document top."})
                # A replaced companion reaction may cancel its previous fetch.
                # Classify only observed superseded image sources, never arbitrary
                # character assets, and require the current replacement to decode.
                replacement_state = page.evaluate("""async () => {
                  const image=document.querySelector('[data-companion-image]');
                  let decoded=false;if(image){decoded=await Promise.race([image.decode().then(()=>true,()=>false),new Promise(r=>setTimeout(()=>r(false),2500))]);}
                  return {current:image?.src,decoded,history:window.__companionImageHistory||[]};
                }""")
                benign_aborts = [entry for entry in request_failures if
                    "ERR_ABORTED" in (entry.get("failure") or "") and
                    replacement_state["decoded"] and entry["url"] != replacement_state["current"] and
                    entry["url"] in replacement_state["history"]]
                fatal_request_failures = [entry for entry in request_failures if entry not in benign_aborts]
                item = {
                    **spec,
                    "url": target,
                    "httpStatus": response.status if response else None,
                    "checks": checks,
                    "companionInteraction": companion_interaction,
                    "badResponses": bad_responses,
                    "requestFailures": request_failures,
                    "benignAbortedImageReplacements": benign_aborts,
                    "companionImageReplacements": replacement_state,
                    "pageErrors": page_errors,
                    "consoleErrors": console_errors,
                    "screenshot": str(screenshot),
                }
                if spec["width"] <= 600 and checks.get("mobileDockGeometry"):
                    geometry_entry = {"capture": spec["name"], **checks["mobileDockGeometry"]}
                    report["companionGeometry"].append(geometry_entry)
                    item["companionGeometryIndex"] = len(report["companionGeometry"]) - 1
                report["captures"].append(item)

                problems = []
                if item["httpStatus"] is None or item["httpStatus"] >= 400: problems.append("page-http-status")
                if bad_responses: problems.append("http-error-resources")
                if fatal_request_failures: problems.append("failed-requests")
                if page_errors or console_errors: problems.append("javascript-errors")
                if checks["horizontalOverflow"]: problems.append("horizontal-overflow")
                if checks["brokenImages"]: problems.append("broken-images")
                if spec["name"] == "home-1366x768" and image_load_summary["failed"]: problems.append("full-page-image-decode-failure")
                if not checks["primaryCtaLoaded"]: problems.append("primary-cta-not-found")
                if checks.get("homeHeroAlpha") is not None and (not checks["homeHeroAlpha"]["available"] or any(action["opaqueOverlapPixels"] > 0 for action in checks["homeHeroAlpha"]["actions"])): problems.append("hero-opaque-pixels-over-primary-cta")
                if args.stage == "after" and checks.get("appStoreTruth") and not checks["appStoreTruth"]["allDisabled"]: problems.append("app-store-controls-not-disabled")
                if checks.get("appStoreClickSmoke") and not (checks["appStoreClickSmoke"]["count"] == 2 and checks["appStoreClickSmoke"]["noNavigation"] and checks["appStoreClickSmoke"]["noPopup"]): problems.append("unconfigured-store-action-not-noop")
                if spec.get("gully") and not (checks.get("gully") and checks["gully"]["loaded"]): problems.append("gully-not-loaded")
                if checks.get("companion") and not checks["companion"]["withinViewport"]: problems.append("companion-out-of-viewport")
                problems.extend(companion_interaction_issues)
                if args.stage == "after" and checks.get("mobileDockGeometry"):
                    dock = checks["mobileDockGeometry"]
                    if dock["rootDocked"] != "true": problems.append("mobile-companion-not-docked")
                    if not dock["imageLoaded"]: problems.append("mobile-companion-image-not-loaded")
                    if abs(dock["image"]["renderedHeight"] - 52) > 1: problems.append("mobile-companion-image-not-52px")
                    if dock["intersections"]: problems.append("mobile-companion-overlaps-meaningful-content")
                    if dock["headerOverlaps"]: problems.append("mobile-companion-overlaps-header-brand-or-menu")
                item["issues"] = problems
                if problems:
                    failures.append({"capture": spec["name"], "issues": problems})
                context.close()
            interactions, interaction_failures = run_companion_interactions(browser, local_base or args.live_base, screenshot_dir) if args.stage == "after" and not args.home_full_only else ([], [])
            report["companionInteractions"] = interactions
            failures.extend(interaction_failures)
            browser.close()
    finally:
        if local_server:
            local_server.shutdown()

    if args.home_full_only and report_path.is_file():
        previous = json.loads(report_path.read_text(encoding="utf-8"))
        refreshed = {capture["name"]: capture for capture in report["captures"]}
        report["captures"] = [refreshed.get(capture["name"], capture) for capture in previous.get("captures", [])]
        report["captures"].extend(capture for name, capture in refreshed.items() if name not in {old["name"] for old in previous.get("captures", [])})
        for field in ("companionGeometry", "companionInteractions"):
            if previous.get(field) and not report.get(field): report[field] = previous[field]
        if previous.get("companionGeometry"):
            report["companionGeometry"] = previous["companionGeometry"]
        failures.extend(failure for failure in previous.get("failures", []) if failure.get("capture") not in refreshed)
    report["summary"] = {
        "status": "FAIL" if failures else "PASS",
        "captures": len(report["captures"]),
        "passedCaptures": sum(not capture.get("issues") for capture in report["captures"]),
        "companionInteractions": len(report["companionInteractions"]),
        "passedCompanionInteractions": sum(check["status"] == "PASS" for check in report["companionInteractions"]),
        "failedChecks": len(failures),
    }
    report["failures"] = failures
    report_path = report_dir / "owner-visual-acceptance-qa.json"
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report["summary"], indent=2))
    print(f"Report: {report_path}")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
