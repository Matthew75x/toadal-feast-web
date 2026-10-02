#!/usr/bin/env python3
"""Bounded live-release smoke checks for TOADAL FEAST V1.

Read-only against the target website. Uses a fresh ephemeral browser context and
writes only screenshots plus a JSON report to --report-dir.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin, urlparse

from playwright.sync_api import sync_playwright


ROUTES = [
    ("home", "/", 1366, 900),
    ("play", "/play/", 1366, 900),
    ("public-game-entry", "/games/wicked-bites/", 1366, 900),
    ("world", "/world/", 390, 844),
    ("characters", "/characters/", 390, 844),
    ("stories", "/stories/", 390, 844),
    ("media", "/media/", 1366, 900),
    ("feast-pass", "/feast-pass/", 390, 844),
    ("app", "/app/", 390, 844),
    ("search", "/search/", 390, 844),
]
REQUIRED_NAV = {
    "home": "/", "play": "/play/", "world": "/world/", "stories": "/stories/",
    "media": "/media/", "feast pass": "/feast-pass/", "app": "/app/", "search": "/search/",
}


def arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", required=True, help="Public site base URL, including any deployment prefix.")
    parser.add_argument("--report-dir", required=True, type=Path)
    parser.add_argument("--expected-robots", required=True, choices=("staging", "production"))
    parser.add_argument("--expected-sha", help="Optional expected build identity; checked against page metadata/HTML.")
    return parser.parse_args()


def record(report: dict, name: str, passed: bool, detail=None) -> None:
    report["checks"].append({"name": name, "status": "PASS" if passed else "FAIL", "detail": detail})
    if not passed:
        report["status"] = "FAIL"


def main() -> int:
    args = arguments()
    base = args.base_url.rstrip("/") + "/"
    parsed_base = urlparse(base)
    if parsed_base.scheme not in ("https", "http") or not parsed_base.netloc:
        raise SystemExit("--base-url must be an absolute HTTP(S) URL")
    prefix = parsed_base.path.rstrip("/")
    report_dir = args.report_dir.resolve()
    screenshots = report_dir / "screenshots"
    screenshots.mkdir(parents=True, exist_ok=True)
    report = {
        "schema": "toadal-feast.v1-release-live-smoke.v1",
        "status": "PASS", "generatedAt": datetime.now(timezone.utc).isoformat(),
        "baseUrl": base, "expectedRobots": args.expected_robots,
        "expectedSha": args.expected_sha, "checks": [], "routes": [],
        "screenshots": [], "limitations": ["This is a bounded route/release smoke, not full gameplay, visual-parity, or historical browser-matrix qualification."],
    }
    chrome = os.environ.get("CHROME_PATH") or r"C:\Program Files\Google\Chrome\Application\chrome.exe"

    with sync_playwright() as playwright:
        launch_args = {"headless": True}
        if Path(chrome).is_file():
            launch_args["executable_path"] = chrome
        browser = playwright.chromium.launch(**launch_args)
        context = browser.new_context(viewport={"width": 1366, "height": 900}, device_scale_factor=1)
        # The isolated context is discarded at the end; any local progress or
        # companion preferences exercised here cannot persist into a user profile.
        for name, route, width, height in ROUTES:
            page = context.new_page()
            page.set_viewport_size({"width": width, "height": height})
            errors = {"console": [], "page": [], "http": [], "requestFailures": []}
            page.on("console", lambda msg, bucket=errors: bucket["console"].append(msg.text) if msg.type == "error" else None)
            page.on("pageerror", lambda exc, bucket=errors: bucket["page"].append(str(exc)))
            page.on("response", lambda response, bucket=errors: bucket["http"].append({"status": response.status, "url": response.url}) if response.status >= 400 else None)
            page.on("requestfailed", lambda request, bucket=errors: bucket["requestFailures"].append({"url": request.url, "failure": request.failure}))
            url = urljoin(base, route.lstrip("/"))
            status = None
            title = ""
            body_text = ""
            route_checks = []
            try:
                response = page.goto(url, wait_until="networkidle", timeout=45000)
                status = response.status if response else None
                page.wait_for_timeout(250)
                title = page.title()
                body_text = page.locator("body").inner_text(timeout=10000)
                route_checks.append({"name": "http-200", "pass": status == 200, "detail": status})
                route_checks.append({"name": "document-title", "pass": bool(title.strip()), "detail": title})

                layout = page.evaluate("""() => {const images=[...document.images].map(i=>{const r=i.getBoundingClientRect(),visible=r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight;return {src:i.currentSrc||i.src,loaded:i.complete&&i.naturalWidth>0,failed:i.complete&&i.naturalWidth===0&&!!(i.currentSrc||i.src),visible,loading:i.loading||'eager'};});return {width:innerWidth,documentWidth:document.documentElement.scrollWidth,overflow:document.documentElement.scrollWidth>innerWidth+1,images,visibleImages:images.filter(i=>i.visible),companionCount:document.querySelectorAll('[data-companion]').length,companionImage:(()=>{const i=document.querySelector('[data-companion-image]');return i?{src:i.currentSrc||i.src,loaded:i.complete&&i.naturalWidth>0}:null})()}}""")
                route_checks.append({"name": "no-horizontal-overflow", "pass": not layout["overflow"], "detail": {"viewport": layout["width"], "document": layout["documentWidth"]}})
                broken_images = [image for image in layout["images"] if image["failed"]]
                pending_lazy = [image["src"] for image in layout["images"] if not image["loaded"] and not image["failed"] and image["loading"] == "lazy"]
                route_checks.append({"name": "no-decoded-image-failures", "pass": not broken_images, "detail": {"failures": broken_images, "unrequestedLazyImages": pending_lazy}})
                route_checks.append({"name": "companion-single-and-art-loaded", "pass": layout["companionCount"] == 1 and bool(layout["companionImage"] and layout["companionImage"]["loaded"]), "detail": {"count": layout["companionCount"], "image": layout["companionImage"]}})

                nav_links = page.locator(".site-links a").evaluate_all("els => els.map(a=>({text:(a.innerText||'').trim().toLowerCase(),href:a.getAttribute('href')}))")
                normalized = {link["text"]: link["href"] for link in nav_links}
                nav_detail = {label: normalized.get(label) for label in REQUIRED_NAV}
                nav_ok = all(href and (urlparse(href).path == prefix + expected or (not prefix and urlparse(href).path == expected)) for label, expected in REQUIRED_NAV.items() if (href := nav_detail[label])) and all(nav_detail.values())
                route_checks.append({"name": "global-navigation-routes", "pass": nav_ok, "detail": nav_detail})

                if width <= 600:
                    menu = page.locator(".nav-toggle")
                    menu_exists = menu.count() == 1 and menu.is_visible()
                    opened = False
                    if menu_exists:
                        menu.click()
                        opened = page.locator(".nav-toggle").get_attribute("aria-expanded") == "true" and page.locator(".site-links a").first.is_visible()
                        if opened:
                            page.locator(".nav-toggle").click()
                    route_checks.append({"name": "mobile-menu-opens-and-closes", "pass": menu_exists and opened and page.locator(".nav-toggle").get_attribute("aria-expanded") == "false", "detail": {"found": menu_exists, "opened": opened}})

                if route == "/app/":
                    store_buttons = page.locator(".store-badge").evaluate_all("els=>els.map(b=>({text:(b.innerText||'').trim(),disabled:b.disabled,href:b.getAttribute('href')}))")
                    route_checks.append({"name": "app-store-availability-truth", "pass": len(store_buttons) >= 2 and all(b["disabled"] and not b["href"] for b in store_buttons), "detail": store_buttons})
                if route == "/games/wicked-bites/":
                    truth = re.search(r"\b(session.only|isolated|preview|not public)\b", body_text, re.I) is not None
                    route_checks.append({"name": "game-entry-truth-label", "pass": truth, "detail": "Visible page copy identifies preview/session/isolated status." if truth else "No preview/isolated truth language found."})

                # A reversible companion open/close smoke on the disposable context.
                toggle = page.locator("[data-companion-toggle]")
                if toggle.count() == 1:
                    initial = toggle.get_attribute("aria-expanded")
                    toggle.click()
                    opened = toggle.get_attribute("aria-expanded") == ("false" if initial == "true" else "true")
                    toggle.click()
                    restored = toggle.get_attribute("aria-expanded") == initial
                    route_checks.append({"name": "companion-toggle-open-close", "pass": opened and restored, "detail": {"initial": initial, "opened": opened, "restored": restored}})

                screenshot_path = screenshots / f"{name}-{width}x{height}.png"
                page.screenshot(path=str(screenshot_path), full_page=False, animations="disabled")
                report["screenshots"].append(str(screenshot_path))
            except Exception as exc:  # Capture route-level failure and continue through bounded route set.
                route_checks.append({"name": "route-navigation-and-smoke", "pass": False, "detail": f"{type(exc).__name__}: {exc}"})

            record(report, f"{name}:checks", all(item["pass"] for item in route_checks), route_checks)
            route_result = {"name": name, "path": route, "url": url, "viewport": {"width": width, "height": height}, "httpStatus": status, "title": title, "checks": route_checks, "errors": errors}
            report["routes"].append(route_result)
            record(report, f"{name}:no-browser-errors-or-http-404", not errors["page"] and not errors["console"] and not errors["http"] and not errors["requestFailures"], errors)
            page.close()

        # Focused release certification beyond the route inventory. Each probe
        # uses the same disposable context and closes its page after evidence.
        def certification_page(label: str, viewport: tuple[int, int]):
            page = context.new_page()
            page.set_viewport_size({"width": viewport[0], "height": viewport[1]})
            errors = {"console": [], "page": [], "http": [], "requestFailures": []}
            page.on("console", lambda msg, bucket=errors: bucket["console"].append(msg.text) if msg.type == "error" else None)
            page.on("pageerror", lambda exc, bucket=errors: bucket["page"].append(str(exc)))
            page.on("response", lambda response, bucket=errors: bucket["http"].append({"status": response.status, "url": response.url}) if response.status >= 400 else None)
            page.on("requestfailed", lambda request, bucket=errors: bucket["requestFailures"].append({"url": request.url, "failure": request.failure}))
            return page, errors

        home_mobile, mobile_errors = certification_page("home-mobile-cta", (390, 844))
        mobile_home_response = home_mobile.goto(base, wait_until="networkidle", timeout=45000)
        home_mobile.screenshot(path=str(screenshots / "home-390x844-cta.png"), full_page=False, animations="disabled")
        report["screenshots"].append(str(screenshots / "home-390x844-cta.png"))
        mobile_primary = home_mobile.locator(".home-actions a.button-link--primary")
        primary_href = mobile_primary.get_attribute("href") if mobile_primary.count() == 1 else None
        mobile_primary.click(timeout=10000)
        home_cta_ok = urlparse(home_mobile.url).path.rstrip("/") == (prefix + "/play").rstrip("/") and "play" in home_mobile.locator("main").inner_text().lower()
        record(report, "certification:home-390-primary-cta-to-play", bool(mobile_home_response and mobile_home_response.status == 200 and primary_href and home_cta_ok), {"screenshot": str(screenshots / "home-390x844-cta.png"), "ctaHref": primary_href, "landedUrl": home_mobile.url})
        record(report, "certification:home-mobile-no-browser-errors", not any(mobile_errors.values()), mobile_errors)
        home_mobile.close()

        search_tablet, search_errors = certification_page("search-768", (768, 900))
        search_tablet.goto(urljoin(base, "search/"), wait_until="networkidle", timeout=45000)
        search_input = search_tablet.locator("form[data-site-search] input[name='q']")
        search_input.fill("Toadal")
        search_tablet.locator("form[data-site-search] button[type='submit']").click()
        search_tablet.wait_for_function("""() => Number(document.querySelectorAll('[data-search-results] .search-result-card').length)>0 && /result/i.test(document.querySelector('[data-search-status]')?.textContent||'')""", timeout=15000)
        search_state = search_tablet.evaluate("""() => ({query:new URLSearchParams(location.search).get('q'),resultCount:document.querySelectorAll('[data-search-results] .search-result-card').length,status:document.querySelector('[data-search-status]')?.textContent||''})""")
        search_tablet.screenshot(path=str(screenshots / "search-768x900-submitted.png"), full_page=False, animations="disabled")
        report["screenshots"].append(str(screenshots / "search-768x900-submitted.png"))
        record(report, "certification:search-768-real-form-toadal-results", search_state["query"] == "Toadal" and search_state["resultCount"] > 0, search_state)
        record(report, "certification:search-no-browser-errors", not any(search_errors.values()), search_errors)
        search_tablet.close()

        player_page, player_errors = certification_page("wicked-bites-player", (1366, 900))
        player_page.goto(urljoin(base, "play/"), wait_until="networkidle", timeout=45000)
        game_entry = player_page.locator("a[href$='/games/wicked-bites/']").first
        game_entry.wait_for(state="visible", timeout=10000)
        game_entry.click()
        player_page.wait_for_url(re.compile(re.escape(prefix + "/games/wicked-bites/") + r"/?$"), timeout=15000)
        launch_cta = player_page.locator("a[href$='/player/wicked-bites/']").filter(has_text=re.compile("open staging preview", re.I))
        launch_cta.wait_for(state="visible", timeout=10000)
        launch_href = launch_cta.get_attribute("href")
        launch_cta.click()
        player_page.wait_for_url(re.compile(re.escape(prefix + "/player/wicked-bites/") + r"/?$"), timeout=15000)
        frame = player_page.frame_locator("iframe[data-player-frame]")
        frame.locator("#wbCanvas").wait_for(state="visible", timeout=30000)
        frame.locator("#wbPlay").wait_for(state="visible", timeout=15000)
        frame.locator("#wbPlay").click()
        player_page.wait_for_function("""() => /game started/i.test(document.querySelector('[data-player-status]')?.textContent||'')""", timeout=15000)
        player_screenshot = screenshots / "wicked-bites-player-started.png"
        player_page.screenshot(path=str(player_screenshot), full_page=False, animations="disabled")
        report["screenshots"].append(str(player_screenshot))
        player_identity = player_page.locator("iframe[data-player-frame]").get_attribute("src")
        record(report, "certification:real-play-entry-to-mounted-gameplay-start", bool(launch_href and player_identity and "public/games/wicked-bites/index.html" in player_identity), {"launchHref": launch_href, "iframeSrc": player_identity, "status": player_page.locator("[data-player-status]").inner_text(), "screenshot": str(player_screenshot), "gameplayStarted": True})
        record(report, "certification:player-no-browser-errors-or-http-failures", not any(player_errors.values()), player_errors)
        player_page.close()

        missing_page, missing_errors = certification_page("missing-route-404", (1366, 900))
        missing_url = urljoin(base, "__v1-release-smoke-route-that-does-not-exist-7f3a9c/")
        missing_response = missing_page.goto(missing_url, wait_until="networkidle", timeout=45000)
        fallback = missing_page.locator("main#main-content")
        fallback_text = fallback.inner_text(timeout=10000) if fallback.count() else ""
        missing_screenshot = screenshots / "missing-route-visible-404.png"
        missing_page.screenshot(path=str(missing_screenshot), full_page=False, animations="disabled")
        report["screenshots"].append(str(missing_screenshot))
        record(report, "certification:missing-route-http-404-visible-fallback", bool(missing_response and missing_response.status == 404 and fallback.is_visible() and fallback_text.strip()), {"url": missing_url, "httpStatus": missing_response.status if missing_response else None, "fallbackText": fallback_text[:500], "screenshot": str(missing_screenshot)})
        fallback_asset_errors = {**missing_errors, "http": [item for item in missing_errors["http"] if item["url"].rstrip("/") != missing_url.rstrip("/")]}
        record(report, "certification:404-fallback-assets-have-no-browser-errors", not any(fallback_asset_errors.values()), fallback_asset_errors)
        missing_page.close()

        robots_url = urljoin(base, "robots.txt")
        try:
            robots_response = context.request.get(robots_url, timeout=20000)
            robots_text = robots_response.text()
            home_response = context.request.get(base, timeout=20000)
            home_html = home_response.text()
            robots_meta = re.search(r'<meta[^>]+name=["\']robots["\'][^>]+content=["\']([^"\']+)', home_html, re.I)
            disallow_all = re.search(r"(?im)^\s*Disallow:\s*/\s*$", robots_text) is not None
            noindex = bool(robots_meta and "noindex" in robots_meta.group(1).lower())
            if args.expected_robots == "staging":
                robots_ok = robots_response.status == 200 and (noindex or disallow_all)
            else:
                robots_ok = robots_response.status == 200 and not noindex and not disallow_all
            record(report, "robots-policy", robots_ok, {"url": robots_url, "status": robots_response.status, "meta": robots_meta.group(1) if robots_meta else None, "disallowAll": disallow_all, "expected": args.expected_robots})
            if args.expected_sha:
                identity = args.expected_sha.lower()
                sha_meta = re.search(r'<meta[^>]+(?:name|property)=["\'](?:build-sha|commit-sha|release-sha)["\'][^>]+content=["\']([^"\']+)', home_html, re.I)
                marked = sha_meta.group(1).lower() if sha_meta else None
                identity_present = identity in home_html.lower()
                record(report, "expected-build-identity", identity_present and (marked is None or marked == identity), {"expected": args.expected_sha, "meta": marked, "foundInHomeHtml": identity_present})
            else:
                report["checks"].append({"name": "expected-build-identity", "status": "NOT_REQUESTED", "detail": None})
        except Exception as exc:
            record(report, "robots-and-build-identity-probe", False, f"{type(exc).__name__}: {exc}")

        context.close()
        browser.close()

    report_path = report_dir / "v1-release-live-smoke.json"
    report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"status": report["status"], "report": str(report_path), "screenshots": len(report["screenshots"]), "failedChecks": [c for c in report["checks"] if c["status"] == "FAIL"]}, indent=2))
    return 0 if report["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
