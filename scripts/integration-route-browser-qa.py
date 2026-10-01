#!/usr/bin/env python3
"""Bounded Chromium quality matrix for every public route in a TOADAL page index."""

from __future__ import annotations

import argparse
import http.server
import json
import os
import socketserver
import sys
import threading
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit

from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from playwright.sync_api import sync_playwright


VIEWPORTS = ((1440, 900), (768, 1024), (390, 844), (320, 800))
LOAD_TIMEOUT_MS = 12000
FOCUS_TAB_LIMIT = 48


def fail(message: str) -> None:
    raise SystemExit(f"ERROR: {message}")


def normalize_base_path(value: str) -> str:
    if not value.startswith("/") or "\\" in value or "?" in value or "#" in value:
        fail("--base-path must be an absolute URL path (for example /toadal-feast-web/)")
    parts = [part for part in value.split("/") if part]
    if any(part in (".", "..") for part in parts):
        fail("--base-path cannot contain dot segments")
    return "/" + "/".join(parts) + ("/" if parts else "")


def load_routes(manifest_path: Path) -> list[dict[str, str]]:
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    index_path = (manifest_path.parent / manifest["pageIndex"]).resolve()
    index = json.loads(index_path.read_text(encoding="utf-8"))
    records = index.get("pages")
    if not isinstance(records, list) or not records:
        fail(f"pageIndex has no registered pages: {index_path}")
    routes: dict[str, dict[str, str]] = {}
    for record in records:
        if not isinstance(record, dict) or not isinstance(record.get("route"), str):
            fail("pageIndex contains a malformed public route record")
        route = record["route"]
        if not route.startswith("/") or ".." in Path(route).parts:
            fail(f"unsafe route in pageIndex: {route!r}")
        if route in routes:
            fail(f"duplicate route in pageIndex: {route}")
        routes[route] = {"id": str(record.get("id", "")), "route": route}
    if "/404.html" not in routes:
        fail("pageIndex must include the registered /404.html route")
    return [routes[key] for key in sorted(routes)]


def chrome_executable() -> str | None:
    candidates = [
        os.environ.get("CHROME_PATH"),
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        "/usr/bin/google-chrome",
        "/usr/bin/chromium",
        "/usr/bin/chromium-browser",
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    ]
    return next((str(Path(item)) for item in candidates if item and Path(item).is_file()), None)


class QuietServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True

    def handle_error(self, _request, _client_address) -> None:
        if isinstance(sys.exc_info()[1], (BrokenPipeError, ConnectionAbortedError, ConnectionResetError)):
            return
        super().handle_error(_request, _client_address)


def make_handler(dist: Path, base_path: str):
    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(dist), **kwargs)

        def translate_path(self, request_path: str) -> str:
            parsed = urlsplit(request_path)
            path = unquote(parsed.path)
            if not path.startswith(base_path):
                return str(dist / "__outside_base_path__")
            relative = path[len(base_path):].lstrip("/")
            candidate = (dist / relative).resolve()
            if candidate != dist and dist not in candidate.parents:
                return str(dist / "__outside_base_path__")
            if path.endswith("/"):
                candidate = candidate / "index.html"
            elif candidate.is_dir():
                candidate = candidate / "index.html"
            return str(candidate)

        def log_message(self, _format, *_args):
            pass

    return Handler


class IdCollector(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.ids: set[str] = set()

    def handle_starttag(self, _tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        for name in ("id", "name"):
            if values.get(name):
                self.ids.add(values[name] or "")


def audit_internal_link(dist: Path, base_path: str, origin: str, current_url: str, href: str) -> dict | None:
    target = urlsplit(urljoin(current_url, href))
    if f"{target.scheme}://{target.netloc}" != origin:
        return None
    if not target.path.startswith(base_path):
        return {"href": href, "reason": "same-origin link escapes the configured Pages base path"}

    relative = unquote(target.path[len(base_path):]).lstrip("/")
    candidate = (dist / relative).resolve()
    if candidate != dist and dist not in candidate.parents:
        return {"href": href, "reason": "link path escapes the static export"}
    if target.path.endswith("/") or candidate.is_dir() or (not candidate.exists() and not candidate.suffix):
        candidate = candidate / "index.html"
    if not candidate.is_file():
        return {"href": href, "reason": f"local target is missing: {candidate.relative_to(dist) if dist in candidate.parents else candidate}"}
    if target.fragment and candidate.suffix.lower() == ".html":
        parser = IdCollector()
        try:
            parser.feed(candidate.read_text(encoding="utf-8"))
        except (OSError, UnicodeError) as exc:
            return {"href": href, "reason": f"HTML target could not be inspected: {exc}"}
        fragment = unquote(target.fragment)
        if fragment not in parser.ids:
            return {"href": href, "reason": f"fragment #{fragment} is missing from {candidate.relative_to(dist)}"}
    return None


def inspect_document(page, origin: str, target_url: str, dist: Path, base_path: str) -> dict:
    page_errors: list[str] = []
    console_errors: list[str] = []
    bad_responses: list[dict[str, object]] = []
    failed_requests: list[dict[str, str]] = []
    external_requests: list[str] = []
    page.on("pageerror", lambda exc: page_errors.append(str(exc)))
    page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
    page.on("request", lambda req: external_requests.append(req.url)
            if not req.url.startswith(origin) and urlsplit(req.url).scheme in ("http", "https") else None)
    page.on("response", lambda res: bad_responses.append({"status": res.status, "url": res.url})
            if res.status >= 400 and res.url.startswith(origin) else None)
    page.on("requestfailed", lambda req: failed_requests.append({"url": req.url, "failure": req.failure or "unknown"})
            if req.url.startswith(origin) and req.failure != "net::ERR_ABORTED" else None)

    try:
        response = page.goto(target_url, wait_until="domcontentloaded", timeout=LOAD_TIMEOUT_MS)
        if response is None:
            load_status = None
            load_error = "navigation produced no main-document response"
        else:
            load_status = response.status
            load_error = None
        page.wait_for_timeout(250)
    except PlaywrightTimeoutError as exc:
        load_status = None
        load_error = f"navigation timeout: {str(exc).splitlines()[0]}"
    except Exception as exc:  # keep a complete report even when an individual route fails
        load_status = None
        load_error = f"navigation error: {type(exc).__name__}: {exc}"

    metrics = page.evaluate("""async () => {
      const text = el => (el.innerText || el.textContent || '').replace(/\\s+/g, ' ').trim();
      const accessibleName = el => {
        const labelledby = (el.getAttribute('aria-labelledby') || '').split(/\\s+/).filter(Boolean);
        const refs = labelledby.map(id => document.getElementById(id)).filter(Boolean).map(text).join(' ').trim();
        const labels = el.labels ? Array.from(el.labels).map(text).filter(Boolean).join(' ').trim() : '';
        const imageNames = Array.from(el.querySelectorAll('img[alt]')).map(img => img.alt.trim()).filter(Boolean).join(' ');
        const name = refs || el.getAttribute('aria-label') || labels || el.getAttribute('alt') ||
          el.getAttribute('title') || text(el) || imageNames;
        return (name || '').trim();
      };
      const imageNodes = Array.from(document.images).filter(img =>
        !!(img.getAttribute('src') || '').trim() && !img.closest('[hidden]'));
      imageNodes.forEach(img => { img.loading = 'eager'; });
      await Promise.race([
        Promise.all(imageNodes.map(img => img.decode().catch(() => null))),
        new Promise(resolve => setTimeout(resolve, 5000)),
      ]);
      const imgs = imageNodes.map(img => ({
        src: img.currentSrc || img.src, alt: img.hasAttribute('alt') ? img.alt : null,
        decoded: img.complete && img.naturalWidth > 0,
      }));
      const namedControls = Array.from(document.querySelectorAll('a[href],button,input,select,textarea,[role="button"],[role="link"]'))
        .map(el => ({tag: el.tagName.toLowerCase(), type: el.getAttribute('type') || '',
          id: el.id || '', name: accessibleName(el), disabled: !!el.disabled}))
        .filter(item => !item.name);
      const ids = Array.from(document.querySelectorAll('[id]')).map(el => el.id);
      const duplicateIds = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))].sort();
      const fragments = Array.from(document.querySelectorAll('a[href^="#"]')).map(a => {
        const id = decodeURIComponent((a.getAttribute('href') || '').slice(1));
        return {href: a.getAttribute('href'), targetExists: !id || !!document.getElementById(id) ||
          !!document.querySelector(`[name="${CSS.escape(id)}"]`)};
      }).filter(item => !item.targetExists);
      const links = Array.from(document.querySelectorAll('a[href]')).map(a => a.href);
      const focusables = Array.from(document.querySelectorAll('a[href],button,input,select,textarea,[tabindex]'))
        .filter(el => !el.disabled && el.tabIndex >= 0 && !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length));
      const main = Array.from(document.querySelectorAll('main'));
      const h1 = Array.from(document.querySelectorAll('h1')).filter(el => text(el) &&
        el.getAttribute('aria-hidden') !== 'true' && el.getClientRects().length > 0);
      const companion = Array.from(document.querySelectorAll('[data-companion]')).map(el => {
        const r = el.getBoundingClientRect();
        return {left: Math.round(r.left), top: Math.round(r.top), right: Math.round(r.right),
          bottom: Math.round(r.bottom), withinViewport: r.left >= -1 && r.top >= -1 &&
          r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1};
      });
      const viewport = document.querySelector('meta[name="viewport"]');
      const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const cssTimeMs = value => Math.max(0, ...String(value).split(',').map(token => {
        const trimmed = token.trim(), number = parseFloat(trimmed);
        return Number.isFinite(number) ? number * (trimmed.endsWith('ms') ? 1 : 1000) : 0;
      }));
      const reducedMotionTiming = reducedMotion ? Array.from(document.querySelectorAll('html, body *'))
        .reduce((maximum, el) => {
          const style = getComputedStyle(el);
          maximum.animationMs = Math.max(maximum.animationMs, cssTimeMs(style.animationDuration));
          maximum.transitionMs = Math.max(maximum.transitionMs, cssTimeMs(style.transitionDuration));
          return maximum;
        }, {animationMs: 0, transitionMs: 0}) : null;
      return {url: location.href, title: document.title.trim(), lang: document.documentElement.lang || '',
        viewport: viewport ? viewport.content : '', innerWidth, scrollWidth: document.documentElement.scrollWidth,
        horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
        h1Count: h1.length, mainCount: main.length, imageCount: imgs.length, images: imgs,
        missingImageAlt: imgs.filter(img => img.alt === null).map(img => img.src),
        undecodedImages: imgs.filter(img => !img.decoded).map(img => img.src), duplicateIds,
        unnamedControls: namedControls, brokenFragments: fragments,
        links,
        companionBounds: companion, focusableCount: focusables.length,
        reducedMotion, reducedMotionScrollBehavior: reducedMotion ? getComputedStyle(document.documentElement).scrollBehavior : null,
        reducedMotionTiming};
    }""")

    focused: list[dict[str, object]] = []
    seen_focus_stops: set[tuple[object, ...]] = set()
    focus_error = None
    focus_limit_reached = False
    page.evaluate("""() => {
      const frame = document.querySelector('[data-player-frame]');
      if (frame) {
        frame.addEventListener('focus', () => frame.dataset.qaFocusEvent = 'focus', true);
        frame.addEventListener('blur', () => frame.dataset.qaFocusEvent = 'blur', true);
        window.addEventListener('blur', () => frame.dataset.qaWindowBlurEvent = 'blur');
        window.addEventListener('focus', () => frame.dataset.qaWindowFocusEvent = 'focus');
        document.addEventListener('focusin', event => {
          if (event.target === frame) frame.dataset.qaDocumentFocusEvent = 'focusin';
        });
        document.addEventListener('focusout', event => {
          if (event.target === frame) frame.dataset.qaDocumentFocusEvent = 'focusout';
        });
      }
      document.body.tabIndex = -1;
      document.body.focus();
    }""")
    for _ in range(FOCUS_TAB_LIMIT):
        try:
            page.keyboard.press("Tab")
            detail = page.evaluate("""() => {
              const el = document.activeElement;
              if (!el || el === document.body || el === document.documentElement) return null;
              const r = el.getBoundingClientRect(), s = getComputedStyle(el);
              const outline = s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0;
              const shadow = s.boxShadow !== 'none';
              const host = el.tagName.toLowerCase() === 'iframe' ? el.closest('.wo002-player-frame-wrap') : null;
              const hostStyle = host ? getComputedStyle(host) : null;
              const hostIndicator = !!host &&
                (host.matches(':focus-within') || host.classList.contains('wo002-player-frame-focused')) &&
                hostStyle.outlineStyle !== 'none' && parseFloat(hostStyle.outlineWidth) > 0;
              const visible = r.width > 0 && r.height > 0 && s.visibility !== 'hidden' &&
                s.display !== 'none' && (outline || shadow || el.matches(':focus-visible') || hostIndicator);
              return {tag: el.tagName.toLowerCase(), id: el.id || '', name: el.getAttribute('aria-label') ||
                el.innerText || el.textContent || el.getAttribute('title') || '', visible,
                focus: el.matches(':focus'), focusVisible: el.matches(':focus-visible'),
                rect: {width: r.width, height: r.height}, display: s.display, visibility: s.visibility,
                rectPosition: {left: Math.round(r.left), top: Math.round(r.top)},
                outlineStyle: s.outlineStyle, outlineWidth: s.outlineWidth, boxShadow: s.boxShadow,
                hostFocusWithin: host ? host.matches(':focus-within') : false,
                hostFrameFocusClass: host ? host.classList.contains('wo002-player-frame-focused') : false,
                hostOutlineStyle: hostStyle ? hostStyle.outlineStyle : null,
                hostOutlineWidth: hostStyle ? hostStyle.outlineWidth : null,
                hostFocusEvent: el.dataset.qaFocusEvent || null,
                windowBlurEvent: el.dataset.qaWindowBlurEvent || null,
                windowFocusEvent: el.dataset.qaWindowFocusEvent || null,
                documentFocusEvent: el.dataset.qaDocumentFocusEvent || null};
            }""")
            if not detail:
                break
            signature = (detail["tag"], detail["id"], detail["name"],
                         detail["rectPosition"]["left"], detail["rectPosition"]["top"])
            if signature in seen_focus_stops:
                break
            seen_focus_stops.add(signature)
            focused.append(detail)
            if detail["tag"] == "iframe":
                # The iframe boundary is the host document's focus stop; input
                # traversal inside the sandboxed cartridge is qualified separately.
                break
            if len(focused) >= metrics.get("focusableCount", 0):
                break
        except Exception as exc:
            focus_error = f"{type(exc).__name__}: {exc}"
            break
    else:
        focus_limit_reached = True
    focus_result = {"tabStopsChecked": len(focused), "unseenFocus": [item for item in focused if not item["visible"]],
                    "limitReached": focus_limit_reached, "error": focus_error}
    link_issues = []
    links = metrics.pop("links", [])
    for href in links:
        issue = audit_internal_link(dist, base_path, origin, target_url, href)
        if issue:
            link_issues.append(issue)
    return {"httpStatus": load_status, "loadError": load_error,
            "browserErrors": sorted(set(console_errors)), "pageErrors": sorted(set(page_errors)),
            "externalRequests": sorted(set(external_requests)),
            "failedSameOriginAssets": sorted(bad_responses, key=lambda x: (x["url"], x["status"])),
            "failedSameOriginRequests": sorted(failed_requests, key=lambda x: x["url"]),
            "internalLinkCount": len(links), "internalLinkIssues": link_issues,
            "document": metrics, "keyboardFocus": focus_result}


def case_passed(case: dict) -> bool:
    result = case["result"]
    doc = result.get("document") or {}
    return bool(result.get("httpStatus") == 200 and not result.get("loadError") and
                not result.get("browserErrors") and not result.get("pageErrors") and
                not result.get("externalRequests") and
                not result.get("failedSameOriginAssets") and not result.get("failedSameOriginRequests") and
                not result.get("internalLinkIssues") and
                doc.get("title") and doc.get("lang") and doc.get("viewport") and
                doc.get("h1Count", 0) == 1 and doc.get("mainCount", 0) == 1 and
                not doc.get("horizontalOverflow") and not doc.get("missingImageAlt") and
                not doc.get("undecodedImages") and not doc.get("duplicateIds") and
                not doc.get("unnamedControls") and not doc.get("brokenFragments") and
                all(item.get("withinViewport") for item in doc.get("companionBounds", [])) and
                not result.get("keyboardFocus", {}).get("unseenFocus") and
                not result.get("keyboardFocus", {}).get("limitReached") and
                not result.get("keyboardFocus", {}).get("error") and
                (doc.get("focusableCount", 0) == 0 or result.get("keyboardFocus", {}).get("tabStopsChecked", 0) > 0))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project-manifest", required=True, type=Path)
    parser.add_argument("--dist", required=True, type=Path)
    parser.add_argument("--base-path", required=True)
    parser.add_argument("--report", required=True, type=Path)
    parser.add_argument("--route", help="Optionally isolate one registered route during diagnosis.")
    args = parser.parse_args()
    manifest = args.project_manifest.resolve()
    dist = args.dist.resolve()
    report_path = args.report.resolve()
    base_path = normalize_base_path(args.base_path)
    if not manifest.is_file():
        fail(f"project manifest not found: {manifest}")
    if not dist.is_dir():
        fail(f"dist directory not found: {dist}")
    routes = load_routes(manifest)
    if args.route:
        routes = [route for route in routes if route["route"] == args.route]
        if not routes:
            fail(f"--route is not registered in pageIndex: {args.route}")
    chrome = chrome_executable()
    if not chrome:
        fail("Chrome executable not found; set CHROME_PATH")

    server = QuietServer(("127.0.0.1", 0), make_handler(dist, base_path))
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    origin = f"http://127.0.0.1:{server.server_port}"
    cases = []
    reduced_cases = []
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True, executable_path=chrome)
            for route in routes:
                path = route["route"]
                url_path = base_path + (path.lstrip("/") if path != "/" else "")
                if path.endswith("/") or path == "/":
                    url_path = url_path or base_path
                for width, height in VIEWPORTS:
                    context = browser.new_context(viewport={"width": width, "height": height}, reduced_motion="no-preference")
                    page = context.new_page()
                    case = {"routeId": route["id"], "route": path, "viewport": {"width": width, "height": height}}
                    try:
                        case["result"] = inspect_document(page, origin, origin + url_path, dist, base_path)
                    except Exception as exc:
                        case["result"] = {"httpStatus": None, "loadError": f"{type(exc).__name__}: {exc}",
                                          "browserErrors": [], "pageErrors": [], "failedSameOriginAssets": [],
                                          "failedSameOriginRequests": [], "externalRequests": [],
                                          "document": {}, "keyboardFocus": {}}
                    case["status"] = "PASS" if case_passed(case) else "FAIL"
                    cases.append(case)
                    context.close()
                    if (path in ("/", "/stories/", "/reader/") and width == 1440):
                        reduced_context = browser.new_context(viewport={"width": width, "height": height}, reduced_motion="reduce")
                        reduced_page = reduced_context.new_page()
                        try:
                            reduced = inspect_document(reduced_page, origin, origin + url_path, dist, base_path)
                            doc = reduced.get("document", {})
                            timing = doc.get("reducedMotionTiming") or {}
                            reduced_ok = reduced.get("httpStatus") == 200 and doc.get("reducedMotion") is True and \
                                doc.get("reducedMotionScrollBehavior") == "auto" and \
                                timing.get("animationMs", float("inf")) <= 0.011 and \
                                timing.get("transitionMs", float("inf")) <= 0.011 and \
                                not reduced.get("browserErrors") and not reduced.get("pageErrors") and \
                                not reduced.get("externalRequests") and \
                                not reduced.get("failedSameOriginAssets") and not reduced.get("failedSameOriginRequests")
                            reduced_cases.append({"route": path, "viewport": {"width": width, "height": height},
                                                  "status": "PASS" if reduced_ok else "FAIL", "reducedMotion": reduced})
                        except Exception as exc:
                            reduced_cases.append({"route": path, "viewport": {"width": width, "height": height},
                                                  "status": "FAIL", "error": f"{type(exc).__name__}: {exc}"})
                        reduced_context.close()
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=2)

    result = {"schemaVersion": 1, "status": "PASS" if all(c["status"] == "PASS" for c in cases + reduced_cases) else "FAIL",
              "projectManifest": str(manifest), "dist": str(dist), "basePath": base_path,
              "browser": {"name": "Chrome", "executable": chrome},
              "routes": routes, "viewports": [{"width": w, "height": h} for w, h in VIEWPORTS],
              "caseCount": len(cases), "cases": cases, "reducedMotionCases": reduced_cases}
    encoded = json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    with report_path.open("w", encoding="utf-8", newline="\n") as report_file:
        report_file.write(encoded)
    summary = {
        "status": result["status"],
        "caseCount": result["caseCount"],
        "passed": sum(case["status"] == "PASS" for case in cases),
        "failed": sum(case["status"] == "FAIL" for case in cases),
        "reducedMotion": {"passed": sum(case["status"] == "PASS" for case in reduced_cases),
                          "failed": sum(case["status"] == "FAIL" for case in reduced_cases)},
        "report": str(report_path),
        "failures": [{"route": case["route"], "viewport": case["viewport"],
                      "focus": case.get("result", {}).get("keyboardFocus", {}).get("unseenFocus", [])}
                     for case in cases if case["status"] == "FAIL"],
    }
    sys.stdout.write(json.dumps(summary, ensure_ascii=False, indent=2) + "\n")
    return 0 if result["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
