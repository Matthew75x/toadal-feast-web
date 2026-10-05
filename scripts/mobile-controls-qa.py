#!/usr/bin/env python3
"""Bounded touch companion and fullscreen-rail regression checks against an export."""
from __future__ import annotations
import argparse
import importlib.util
import json
import os
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
helper_spec = importlib.util.spec_from_file_location("companion_controls_server", ROOT / "scripts/v1-companion-controls-qa.py")
helper = importlib.util.module_from_spec(helper_spec)
helper_spec.loader.exec_module(helper)


def run() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dist", type=Path, default=ROOT / "dist")
    parser.add_argument("--report-dir", type=Path, default=ROOT / "docs/review/staging-completion-20261005/mobile-controls")
    args = parser.parse_args()
    args.report_dir.mkdir(parents=True, exist_ok=True)
    server, base = helper.start_dist_server(args.dist)
    cases = []
    chrome = os.environ.get("CHROME_PATH", r"C:\Program Files\Google\Chrome\Application\chrome.exe")
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(executable_path=chrome, headless=True, timeout=10000)
            context = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
            page = context.new_page()
            page.set_default_timeout(6000)
            for name, action in [("touch-hide-persistence-and-drag", touch_case), ("explicit-hide-and-restore", explicit_case), ("fullscreen-rail", fullscreen_case), ("default-news-scroll-dock", news_dock_case), ("default-news-scroll-dock-320", news_dock_320_case)]:
                started = time.monotonic()
                result = {"name": name}
                try:
                    action(page, context, base, result)
                    result["status"] = "PASS"
                except Exception as error:
                    result.update(status="FAIL", error=f"{type(error).__name__}: {error}")
                result["elapsedSeconds"] = round(time.monotonic() - started, 3)
                if result["elapsedSeconds"] > 30:
                    result.update(status="FAIL", error="Case exceeded 30-second bound")
                cases.append(result)
            context.close()
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
    report = {"schema": "toadal-feast.mobile-controls-qa.v1", "dist": str(args.dist.resolve()), "viewport": {"width": 390, "height": 844}, "cases": cases,
              "summary": {"status": "PASS" if all(case["status"] == "PASS" for case in cases) else "FAIL", "passed": sum(case["status"] == "PASS" for case in cases), "cases": len(cases)}}
    (args.report_dir / "report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report["summary"]))
    for case in cases:
        if case["status"] != "PASS":
            print(f"FAIL: {case['name']}: {case['error']}")
    return 0 if report["summary"]["status"] == "PASS" else 1


def center(page):
    box = page.locator("[data-companion-toggle]").bounding_box()
    assert box, "Companion toggle must have a visible box"
    return box["x"] + box["width"] / 2, box["y"] + box["height"] / 2


def ready(page):
    page.wait_for_function("() => document.querySelector('[data-companion]')?.getAttribute('data-position-ready') === 'true'")


def touch_case(page, context, base, result):
    page.goto(base, wait_until="load", timeout=10000)
    page.evaluate("localStorage.removeItem('toadal:site:companion:hidden:v1'); localStorage.removeItem('toadal:site:companion:minimized:v1'); localStorage.removeItem('toadal:site:companion:position:v1')")
    page.reload(wait_until="load", timeout=10000)
    ready(page)
    # The second physical tap uses exactly the first tap's coordinates.
    x, y = center(page)
    double_tap_coordinates = {"x": x, "y": y}
    page.touchscreen.tap(x, y)
    page.touchscreen.tap(x, y)
    page.wait_for_function("() => document.querySelector('[data-companion]')?.hidden && localStorage.getItem('toadal:site:companion:hidden:v1') === 'true'")
    saved_before_reload = page.evaluate("localStorage.getItem('toadal:site:companion:position:v1')")
    minimized_before_reload = page.evaluate("localStorage.getItem('toadal:site:companion:minimized:v1')")
    page.reload(wait_until="load", timeout=10000)
    ready(page)
    assert page.locator("[data-companion]").evaluate("node => node.hidden"), "Full hide must survive reload"
    assert page.evaluate("localStorage.getItem('toadal:site:companion:position:v1')") == saved_before_reload, "Hidden layout must not overwrite placement with a zero-size box"
    page.locator("[data-companion-restore]").click()
    assert page.locator("[data-companion]").evaluate("node => !node.hidden")
    assert page.evaluate("localStorage.getItem('toadal:site:companion:minimized:v1')") == minimized_before_reload, "Restoring must preserve the minimized preference"
    page.evaluate("scrollTo(0, 0)")
    page.wait_for_timeout(100)
    x, y = center(page)
    old_minimized = page.evaluate("localStorage.getItem('toadal:site:companion:minimized:v1')")
    page.touchscreen.tap(x, y)
    page.wait_for_function("old => localStorage.getItem('toadal:site:companion:minimized:v1') !== old", arg=old_minimized)
    assert not page.locator("[data-companion]").evaluate("node => node.hidden"), "A single tap must only show/minimize"
    page.wait_for_timeout(400)
    x, y = center(page)
    cdp = context.new_cdp_session(page)
    cdp.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [{"x": x, "y": y}]})
    cdp.send("Input.dispatchTouchEvent", {"type": "touchMove", "touchPoints": [{"x": max(50, x - 80), "y": min(740, y + 130)}]})
    cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
    page.wait_for_function("() => JSON.parse(localStorage.getItem('toadal:site:companion:position:v1') || '{}').manual === true")
    manual = page.evaluate("JSON.parse(localStorage.getItem('toadal:site:companion:position:v1'))")
    x, y = center(page)
    page.touchscreen.tap(x, y)
    page.wait_for_timeout(400)
    assert not page.locator("[data-companion]").evaluate("node => node.hidden"), "A drag followed by one tap must not hide"
    page.reload(wait_until="load", timeout=10000)
    ready(page)
    after = page.evaluate("JSON.parse(localStorage.getItem('toadal:site:companion:position:v1'))")
    assert after["manual"] is True, "Manual placement must survive reload"
    result.update(doubleTapCoordinates=double_tap_coordinates, savedManual=manual, reloadedManual=after, hiddenPreference="true persisted then restored")
    cdp.detach()


def explicit_case(page, _context, base, result):
    page.goto(base + "support/", wait_until="load", timeout=10000)
    ready(page)
    if page.locator("[data-companion]").evaluate("node => node.hidden"):
        page.locator("[data-companion-restore]").click()
    if not page.locator("[data-companion-panel]").is_visible():
        page.locator("[data-companion-toggle]").press("Enter")
    page.locator("[data-companion-hide]").press("Enter")
    assert page.locator("[data-companion]").evaluate("node => node.hidden")
    assert page.locator("[data-companion-restore]").is_visible()
    page.locator("[data-companion-restore]").press("Enter")
    assert page.locator("[data-companion-toggle]").evaluate("node => document.activeElement === node"), "Keyboard restore must return focus to the character"
    assert page.locator("[data-companion]").evaluate("node => !node.hidden")
    result.update(keyboardHide=True, keyboardRestore=True)


def fullscreen_case(page, _context, base, result):
    page.goto(base + "player/wicked-bites/", wait_until="domcontentloaded", timeout=10000)
    page.locator("[data-player-fullscreen]").click()
    page.wait_for_function("() => document.fullscreenElement === document.querySelector('[data-player-frame-wrap]')")
    page.locator("[data-player-fullscreen-exit]").wait_for(state="visible")
    geometry = page.evaluate("""() => {
      const box = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}; };
      const exit = document.querySelector('[data-player-fullscreen-exit]'), r = exit.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return {exit:box('[data-player-fullscreen-exit]'),rail:box('[data-player-fullscreen-rail]'),frame:box('[data-player-frame]'),label:exit.getAttribute('aria-label'),hit:hit === exit || exit.contains(hit), viewport:{width:innerWidth,height:innerHeight}};
    }""")
    result["geometry"] = geometry
    assert geometry["exit"]["height"] <= 40, "Exit control must be discreet"
    assert geometry["exit"]["bottom"] <= geometry["frame"]["top"] + 1, "Exit control must sit outside gameplay"
    assert geometry["rail"]["bottom"] <= geometry["frame"]["top"] + 1
    assert geometry["frame"]["bottom"] <= geometry["viewport"]["height"] + 1
    assert geometry["hit"], "Exit must be touch hit-testable"
    assert geometry["label"] == "Exit full screen"
    page.locator("[data-player-fullscreen-exit]").click()
    page.wait_for_function("() => !document.fullscreenElement")
    assert not page.locator("[data-player-fullscreen-rail]").is_visible()
    result.update(geometry=geometry, exited=True)



def news_dock_case(page, _context, base, result):
    page.goto(base + "news/", wait_until="load", timeout=10000)
    page.evaluate("localStorage.removeItem('toadal:site:companion:hidden:v1'); localStorage.removeItem('toadal:site:companion:minimized:v1'); localStorage.removeItem('toadal:site:companion:position:v1')")
    page.reload(wait_until="load", timeout=10000)
    ready(page)
    state_js = """() => {
      const root = document.querySelector('[data-companion]'), header = document.querySelector('.site-header');
      const rect = node => { const r=node.getBoundingClientRect(); return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}; };
      const r = root.getBoundingClientRect();
      const controls = [...header.querySelectorAll('a[href],button')].filter(node => !node.closest('[hidden]') && getComputedStyle(node).display !== 'none');
      const overlaps = controls.flatMap(node => { const q=node.getBoundingClientRect(); const area=Math.max(0,Math.min(r.right,q.right)-Math.max(r.left,q.left))*Math.max(0,Math.min(r.bottom,q.bottom)-Math.max(r.top,q.top)); return area ? [{label:node.textContent.trim(),area}] : []; });
      return {scrollY,docked:root.getAttribute('data-mobile-docked'),root:rect(root),header:rect(header),saved:JSON.parse(localStorage.getItem('toadal:site:companion:position:v1') || '{}'),overlaps};
    }"""
    initial = page.evaluate(state_js)
    assert initial["docked"] == "true" and initial["saved"]["manual"] is False
    page.locator("[data-news-query]").evaluate("node => node.scrollIntoView({block:'center',behavior:'instant'})")
    page.wait_for_timeout(150)
    scrolled = page.evaluate(state_js)
    assert scrolled["scrollY"] > 0
    assert scrolled["docked"] == "true", "Main links behind the sticky header must not undock the automatic companion"
    assert scrolled["root"]["bottom"] <= scrolled["header"]["bottom"]
    assert not scrolled["overlaps"], "The automatic dock must keep every visible header control usable"
    page.locator(".nav-toggle").click()
    page.wait_for_timeout(100)
    menu_open = page.evaluate(state_js)
    assert not menu_open["overlaps"], "Opening navigation must preserve usable header controls"
    page.locator(".nav-toggle").click()
    page.wait_for_timeout(100)
    menu_closed = page.evaluate(state_js)
    assert menu_closed["docked"] == "true" and not menu_closed["overlaps"]
    assert menu_closed["saved"]["manual"] is False
    result.update(initial=initial, afterQueryScroll=scrolled, afterMenuOpen=menu_open, afterMenuClose=menu_closed)

def news_dock_320_case(_page, context, base, result):
    narrow_context = context.browser.new_context(viewport={"width": 320, "height": 800}, is_mobile=True, has_touch=True)
    try:
        narrow_page = narrow_context.new_page()
        narrow_page.set_default_timeout(6000)
        news_dock_case(narrow_page, narrow_context, base, result)
        result["viewport"] = {"width": 320, "height": 800}
    finally:
        narrow_context.close()

if __name__ == "__main__":
    raise SystemExit(run())