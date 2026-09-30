#!/usr/bin/env python
"""Bounded browser qualification for the WO-003 audit-only Arcade cartridge."""

import argparse
import json
import os
import sys
import time
from pathlib import Path
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright


CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PROTOCOL = "toadal.game.v1"
GAME_ID = "toadal-feast-arcade-preview"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="http://127.0.0.1:8899/qualification-harness.html")
    parser.add_argument("--output", default="docs/review/WO-003/arcade-package")
    args = parser.parse_args()
    output = Path(args.output).resolve()
    output.mkdir(parents=True, exist_ok=True)

    report = {
        "schema": "toadal-feast.wo003.arcade-runtime-qualification.v1",
        "url": args.url,
        "browser": {},
        "python": sys.version,
        "playwright": "unknown",
        "checks": [],
        "failures": [],
        "isolation": {},
        "controls": {},
        "viewports": [],
        "network": {"requests": [], "responses": [], "failures": [], "consoleErrors": [], "pageErrors": [], "downloads": 0},
        "screenshots": [],
    }

    def check(name, passed, detail=None):
        item = {"name": name, "pass": bool(passed)}
        if detail is not None:
            item["detail"] = detail
        report["checks"].append(item)
        print(("PASS " if passed else "FAIL ") + name, flush=True)
        if not passed:
            report["failures"].append(name)

    def wait_message(page, kind, count=1, timeout=15000):
        page.wait_for_function(
            "([type, count]) => (window.__wo003Messages || []).filter(m => m.type === type).length >= count",
            arg=[kind, count], timeout=timeout,
        )

    def count_message(page, kind):
        return page.evaluate("type => (window.__wo003Messages || []).filter(m => m.type === type).length", kind)

    def wait_frame(frame, predicate, timeout=15000):
        deadline = time.time() + timeout / 1000.0
        while time.time() < deadline:
            if frame.evaluate("() => " + predicate):
                return
            frame.wait_for_timeout(100)
        raise AssertionError("Timed out waiting for frame predicate: " + predicate)

    def get_game_frame(page):
        return next(frame for frame in page.frames if frame.url.endswith("/arcade-standalone.html"))

    def attach_telemetry(page):
        page.on("console", lambda msg: report["network"]["consoleErrors"].append({"type": msg.type, "text": msg.text}) if msg.type == "error" else None)
        page.on("pageerror", lambda error: report["network"]["pageErrors"].append(str(error)))
        page.on("request", lambda request: report["network"]["requests"].append({
            "url": request.url, "method": request.method, "resourceType": request.resource_type,
        }))
        page.on("response", lambda response: report["network"]["responses"].append({
            "url": response.url, "status": response.status, "resourceType": response.request.resource_type,
        }))
        page.on("requestfailed", lambda request: report["network"]["failures"].append({
            "url": request.url, "failure": request.failure,
        }))
        page.on("download", lambda download: report["network"].__setitem__("downloads", report["network"]["downloads"] + 1))

    def open_harness(browser, viewport, mobile=False):
        context = browser.new_context(viewport=viewport, is_mobile=mobile, has_touch=mobile)
        page = context.new_page()
        attach_telemetry(page)
        page.goto(args.url, wait_until="load", timeout=60000)
        wait_message(page, "game:ready", timeout=30000)
        return context, page, get_game_frame(page)

    def start_game(page, frame):
        start = frame.locator('[data-standalone-action="play-standard"]')
        start.click(timeout=15000)
        wait_frame(frame, "typeof GameState !== 'undefined' && GameState.mode === 'playing'", timeout=15000)
        wait_message(page, "game:started", timeout=15000)
        # The tutorial coach is mounted a short time after the gameplay state
        # transition; wait for it before viewport screenshots and touch probes.
        frame.wait_for_timeout(350)
        coach_dismiss = frame.locator("button").filter(has_text="Got it")
        if coach_dismiss.count() and coach_dismiss.first.is_visible():
            coach_dismiss.first.click(timeout=10000)

    with sync_playwright() as playwright:
        report["playwright"] = getattr(playwright, "_impl_obj", None) and "Python sync API" or "Python sync API"
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        report["browser"]["version"] = browser.version
        report["browser"]["executable"] = CHROME

        # Desktop handshake, profile, security, host controls, real gameplay.
        context, page, frame = open_harness(browser, {"width": 1366, "height": 768})
        profile = frame.evaluate("""() => ({
          origin: self.origin, referrer: document.referrer,
          stateBinding: typeof GameState, eventBusBinding: typeof EventBus,
          stateOnGlobal: typeof globalThis.GameState, busOnGlobal: typeof globalThis.EventBus,
          selectedCharacter: GameState.selectedCharacterId,
          startLabel: document.getElementById('arcadeStandaloneStartTitle')?.textContent,
          helpVisible: !!document.querySelector('[data-standalone-action="open-help"]') && getComputedStyle(document.querySelector('[data-standalone-action="open-help"]')).display !== 'none',
          variantVisible: !!document.querySelector('.launch-variants') && getComputedStyle(document.querySelector('.launch-variants')).display !== 'none',
          selectorVisible: !!document.querySelector('[data-standalone-action="open-characters"]') && getComputedStyle(document.querySelector('[data-standalone-action="open-characters"]')).display !== 'none',
          shopVisible: !!document.querySelector('[data-standalone-action="open-shop"]') && getComputedStyle(document.querySelector('[data-standalone-action="open-shop"]')).display !== 'none',
          sessionBestLabel: document.querySelector('.launch-score-window--best .launch-score-label')?.textContent
        })""")
        report["profile"] = profile
        check("opaque-origin", profile["origin"] == "null", profile["origin"])
        check("referrer-derived-host-origin", urlparse(profile["referrer"]).netloc == urlparse(args.url).netloc, profile["referrer"])
        check("classic-script-lexical-state-access", profile["stateBinding"] == "object" and profile["eventBusBinding"] == "object" and profile["stateOnGlobal"] == "undefined" and profile["busOnGlobal"] == "undefined", profile)
        check("canonical-Toadal-standard-profile", profile["selectedCharacter"] == "toadal" and profile["startLabel"] == "Standard Arcade", profile)
        check("help-remains-accessible", profile["helpVisible"], profile)
        check("unrelated-modes-and-selector-hidden", not profile["variantVisible"] and not profile["selectorVisible"] and not profile["shopVisible"], profile)
        check("session-only-best-label", "session" in (profile["sessionBestLabel"] or "").lower(), profile["sessionBestLabel"])

        # Parent-owned sentinel must never be readable through the opaque frame.
        page.evaluate("localStorage.setItem('wo003-host-sentinel', 'website-private-value')")
        isolation = frame.evaluate("""async () => {
          const result = { origin: self.origin };
          for (const [name, read] of [
            ['localStorage', () => localStorage.getItem('wo003-host-sentinel')],
            ['cookie', () => document.cookie],
            ['parentDOM', () => parent.document.body.textContent],
            ['parentStorage', () => parent.localStorage.getItem('wo003-host-sentinel')],
            ['serviceWorker', () => navigator.serviceWorker],
            ['topLocationRead', () => top.location.href],
          ]) {
            try { result[name] = { accessible: true, value: String(read()).slice(0, 80) }; }
            catch (error) { result[name] = { accessible: false, name: error.name }; }
          }
          try {
            const request = indexedDB.open('wo003-opaque-probe-' + Date.now());
            result.indexedDB = await new Promise(resolve => {
              const timer = setTimeout(() => resolve({ accessible: false, name: 'timeout' }), 1500);
              request.onerror = () => { clearTimeout(timer); resolve({ accessible: false, name: request.error?.name || 'error' }); };
              request.onsuccess = () => { clearTimeout(timer); request.result.close(); indexedDB.deleteDatabase(request.result.name); resolve({ accessible: true }); };
            });
          } catch (error) { result.indexedDB = { accessible: false, name: error.name }; }
          const popup = window.open('https://example.org/wo003-popup-probe', '_blank');
          result.popup = popup === null ? 'blocked' : 'opened';
          try {
            const anchor = document.createElement('a');
            anchor.href = 'data:text/plain,wo003-download-probe';
            anchor.download = 'wo003-probe.txt';
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            result.downloadAttempted = true;
          } catch (error) { result.downloadAttempted = false; result.downloadError = error.name; }
          try { top.location.href = 'https://example.org/wo003-top-navigation-probe'; result.topNavigationAssignment = 'returned'; }
          catch (error) { result.topNavigationAssignment = error.name; }
          return result;
        }""")
        report["isolation"] = isolation
        check("localStorage-denied", isolation["localStorage"].get("accessible") is False, isolation["localStorage"])
        check("cookie-access-denied", isolation["cookie"].get("accessible") is False, isolation["cookie"])
        check("parent-DOM-denied", isolation["parentDOM"].get("accessible") is False, isolation["parentDOM"])
        check("website-storage-denied", isolation["parentStorage"].get("accessible") is False, isolation["parentStorage"])
        check("IndexedDB-denied", isolation["indexedDB"].get("accessible") is False, isolation["indexedDB"])
        check("service-worker-denied", isolation["serviceWorker"].get("accessible") is False, isolation["serviceWorker"])
        check("popup-blocked", isolation["popup"] == "blocked", isolation["popup"])
        check("no-download-event", report["network"]["downloads"] == 0, report["network"]["downloads"])
        check("top-navigation-contained", page.url.endswith("/qualification-harness.html"), isolation["topNavigationAssignment"])

        # Help is a user-visible feature, not a second mode or external route.
        help_button = frame.locator('[data-standalone-action="open-help"]')
        help_button.click(timeout=10000)
        page.wait_for_timeout(100)
        help_state = frame.evaluate("""() => ({
          visible: (() => { const el = document.querySelector('[data-standalone-view="help"]'); return !!el && !el.hidden && getComputedStyle(el).display !== 'none'; })(),
          view: document.querySelector('#arcadeStandaloneMenu')?.getAttribute('data-current-view') || ''
        })""")
        report["controls"]["help"] = help_state
        check("help-open", help_state["visible"] or "help" in help_state["view"].lower(), help_state)
        back = frame.locator('[data-standalone-view="help"] [data-standalone-action="back-home"]')
        if back.count():
            back.click(timeout=10000)
            page.wait_for_timeout(100)

        start_game(page, frame)
        wait_message(page, "game:score", timeout=10000)
        state = lambda: frame.evaluate("({mode: GameState.mode, currentMode: GameState.currentMode, characterId: GameState.selectedCharacterId, score: GameState.score, level: GameState.level})")
        check("cold-launch-enters-standard-game", state()["mode"] == "playing" and state()["currentMode"] == "standard" and state()["characterId"] == "toadal", state())

        # A same-origin sibling can spoof event.origin but not the host WindowProxy.
        paused_before = count_message(page, "game:paused")
        page.evaluate("window.__wo003SpoofPause()")
        page.wait_for_timeout(350)
        check("postMessage-source-validation", state()["mode"] == "playing" and count_message(page, "game:paused") == paused_before, {"state": state(), "pausedMessages": count_message(page, "game:paused") - paused_before})

        page.evaluate("window.__wo003Send('host:pause', {reason:'qualification'})")
        wait_message(page, "game:paused", paused_before + 1)
        check("host-pause", state()["mode"] == "paused", state())
        resumed_before = count_message(page, "game:resumed")
        page.evaluate("window.__wo003Send('host:resume', {reason:'qualification'})")
        wait_message(page, "game:resumed", resumed_before + 1)
        check("host-resume", state()["mode"] == "playing", state())

        paused_before = count_message(page, "game:paused")
        page.evaluate("window.__wo003Send('host:visibility', {visibility:'hidden'})")
        wait_message(page, "game:paused", paused_before + 1)
        resumed_before = count_message(page, "game:resumed")
        page.evaluate("window.__wo003Send('host:visibility', {visibility:'visible'})")
        wait_message(page, "game:resumed", resumed_before + 1)
        check("visibility-pause-resume", state()["mode"] == "playing", state())

        paused_before = count_message(page, "game:paused")
        focus_probe = context.new_page()
        focus_probe.goto("about:blank")
        focus_probe.bring_to_front()
        wait_message(page, "game:paused", paused_before + 1)
        resumed_before = count_message(page, "game:resumed")
        page.bring_to_front()
        page.evaluate("window.__wo003FocusReturn()")
        wait_message(page, "game:resumed", resumed_before + 1)
        wait_frame(frame, "GameState.mode === 'playing'", timeout=10000)
        check("focus-loss-recovery", state()["mode"] == "playing", state())
        focus_probe.close()

        audio_state = frame.evaluate("StandaloneAudio.getState().muted")
        page.evaluate("window.__wo003Send('host:mute')")
        page.wait_for_function("() => { const f = document.getElementById('arcade-cartridge'); return f && window.__wo003Messages.length >= 1; }")
        page.wait_for_timeout(100)
        muted = frame.evaluate("StandaloneAudio.getState().muted")
        page.evaluate("window.__wo003Send('host:unmute')")
        page.wait_for_timeout(100)
        unmuted = frame.evaluate("StandaloneAudio.getState().muted")
        report["controls"]["audio"] = {"initialMuted": audio_state, "afterMute": muted, "afterUnmute": unmuted}
        check("host-mute-unmute", muted is True and unmuted is False, report["controls"]["audio"])

        # Restart from the host menu; the score is runtime-only in this opaque profile.
        started_before = count_message(page, "game:started")
        if state()["mode"] == "playing":
            paused_before = count_message(page, "game:paused")
            page.evaluate("window.__wo003Send('host:pause', {reason:'restart-test'})")
            wait_message(page, "game:paused", paused_before + 1)
        frame.locator('[data-standalone-pause-action="restart"]').click(timeout=10000)
        wait_frame(frame, "GameState.mode === 'playing'", timeout=15000)
        wait_message(page, "game:started", started_before + 1)
        check("restart-retry", state()["mode"] == "playing", state())

        # Exit while live (not after game-over): the cartridge asks and the
        # website host confirms, returning it to the menu without top navigation.
        if state()["mode"] == "playing":
            paused_before = count_message(page, "game:paused")
            page.evaluate("window.__wo003Send('host:pause', {reason:'exit-test'})")
            wait_message(page, "game:paused", paused_before + 1)
        exit_before = count_message(page, "game:request-exit")
        quit_button = frame.locator('[data-standalone-pause-action="quit"]')
        if quit_button.is_visible():
            quit_button.click(timeout=10000)
            wait_message(page, "game:request-exit", exit_before + 1)
            page.evaluate("window.__wo003Send('host:exit-confirmed')")
            wait_frame(frame, "GameState.mode === 'menu'", timeout=15000)
            check("host-owned-exit-return", True, "live pause quit requested; host confirmation returned the cartridge to menu")
        else:
            check("host-owned-exit-return", False, "quit control was not visible in the live pause menu")

        start_game(page, frame)

        # Bounded real-play: keyboard movement, jump and Toadal tongue actions.
        score_seen = 0
        gameplay_started = time.time()
        frame.locator('#gameCanvas').click(timeout=10000)
        while time.time() - gameplay_started < 16 and state()["mode"] == "playing":
            snapshot = frame.evaluate("""() => ({
              x: frog.x,
              score: GameState.score,
              foods: entities.foods.filter(food => food.itemId && !food.isHazard).map(food => ({x:food.x,y:food.y,itemId:food.itemId}))
            })""")
            score_seen = max(score_seen, snapshot["score"])
            target = min(snapshot["foods"], key=lambda food: abs(food["y"] - 600)) if snapshot["foods"] else None
            if target:
                dx = target["x"] - snapshot["x"]
                if abs(dx) > 18:
                    key = "ArrowRight" if dx > 0 else "ArrowLeft"
                    page.keyboard.down(key)
                    page.wait_for_timeout(min(180, max(50, int(abs(dx) / 1.8))))
                    page.keyboard.up(key)
                if 430 < target["y"] < 730:
                    page.keyboard.press("Space")
            else:
                page.keyboard.press("Space")
            page.wait_for_timeout(100)
            snapshot = state()
            score_seen = max(score_seen, snapshot["score"])
        gameplay_ms = round((time.time() - gameplay_started) * 1000)
        actual_messages = page.evaluate("window.__wo003Messages.filter(m => ['game:score','game:complete','game:error'].includes(m.type))")
        toadal_diagnostics = frame.evaluate("ArcadeToadalMechanics.snapshot().diagnostics")
        report["controls"]["realGameplay"] = {"score": state()["score"], "peakObservedScore": score_seen, "level": state()["level"], "mode": state()["mode"], "elapsedMs": gameplay_ms, "toadalDiagnostics": toadal_diagnostics, "messages": actual_messages[-30:]}
        check("real-catch-scoring-progression", score_seen > 0 and any(m["type"] == "game:score" and (m.get("payload") or {}).get("score", 0) > 0 for m in actual_messages), report["controls"]["realGameplay"])
        desktop_shot = output / "arcade-running-desktop-1366x768.png"
        page.screenshot(path=str(desktop_shot), full_page=True)
        report["screenshots"].append(str(desktop_shot))

        # Exercise actual website-owned fullscreen permission and recovery.
        page.locator('#host-fullscreen').click(timeout=10000)
        page.wait_for_function("!!document.fullscreenElement", timeout=10000)
        fullscreen_state = page.evaluate("({active: !!document.fullscreenElement, width: innerWidth, height: innerHeight})")
        full_shot = output / "arcade-fullscreen-desktop.png"
        page.screenshot(path=str(full_shot))
        report["screenshots"].append(str(full_shot))
        page.evaluate("document.exitFullscreen()")
        page.wait_for_function("!document.fullscreenElement", timeout=10000)
        check("host-fullscreen-enter-exit", fullscreen_state["active"] and not page.evaluate("!!document.fullscreenElement"), fullscreen_state)

        # Controlled error dispatch validates the cartridge -> host error channel.
        frame.evaluate("window.dispatchEvent(new ErrorEvent('error', {message:'WO-003 controlled error-channel probe'}))")
        wait_message(page, "game:error", timeout=5000)
        check("game-error-channel", True, page.evaluate("window.__wo003Messages.filter(m => m.type === 'game:error').slice(-1)"))

        # Reload clears runtime-only score; a fresh context is the close/reopen case.
        page.reload(wait_until="load", timeout=60000)
        wait_message(page, "game:ready", timeout=30000)
        frame = get_game_frame(page)
        reload_state = frame.evaluate("({mode:GameState.mode, score:GameState.score, characterId:GameState.selectedCharacterId})")
        check("reload-recovers-with-no-persisted-score", reload_state["mode"] == "menu" and reload_state["score"] == 0 and reload_state["characterId"] == "toadal", reload_state)
        context.close()

        # Required responsive matrix; phone has touch, tablet has touch, desktop pointer.
        for label, dimensions, mobile in [
            ("phone-portrait", {"width": 390, "height": 844}, True),
            ("tablet", {"width": 768, "height": 1024}, True),
            ("desktop", {"width": 1366, "height": 768}, False),
            ("large-desktop", {"width": 1920, "height": 1080}, False),
        ]:
            case_context, case_page, case_frame = open_harness(browser, dimensions, mobile=mobile)
            start_game(case_page, case_frame)
            if mobile:
                case_page.wait_for_timeout(250)
                canvas_box = case_frame.locator('#gameCanvas').bounding_box()
                touched = False
                case_frame.evaluate("window.__wo003TouchActions = 0; EventBus.on('shootPressed', () => window.__wo003TouchActions++)")
                if canvas_box:
                    x = canvas_box["x"] + canvas_box["width"] * 0.5
                    y = canvas_box["y"] + canvas_box["height"] * 0.75
                    case_page.touchscreen.tap(x, y)
                    touched = True
                case_page.wait_for_timeout(120)
                before_x = case_frame.evaluate("frog.x")
                case_frame.evaluate("""() => {
                  const control = document.getElementById('mobJoystick');
                  const rect = control.getBoundingClientRect();
                  const pointerId = 71;
                  const x = rect.width * 0.28;
                  const y = rect.height * 0.7;
                  const dispatch = (type, clientX) => control.dispatchEvent(new PointerEvent(type, {
                    bubbles:true, cancelable:true, pointerId, pointerType:'touch', clientX, clientY:y,
                    buttons:type === 'pointerup' ? 0 : 1
                  }));
                  dispatch('pointerdown', x);
                  dispatch('pointermove', x + 90);
                  window.__wo003SyntheticTouchPointer = { pointerId, clientX:x + 90, clientY:y };
                }""")
                case_page.wait_for_timeout(300)
                during_x = case_frame.evaluate("frog.x")
                case_frame.evaluate("""() => {
                  const control = document.getElementById('mobJoystick');
                  const pointer = window.__wo003SyntheticTouchPointer;
                  control.dispatchEvent(new PointerEvent('pointerup', {
                    bubbles:true, cancelable:true, pointerId:pointer.pointerId, pointerType:'touch',
                    clientX:pointer.clientX, clientY:pointer.clientY, buttons:0
                  }));
                }""")
                case_page.wait_for_timeout(150)
                touch_events = case_frame.evaluate("""() => ({
                  controlsVisible: getComputedStyle(document.getElementById('mobileControls')).display !== 'none',
                  joystickAvailable: !document.getElementById('mobJoystick').hidden,
                  joystickBounds: document.getElementById('mobJoystick').getBoundingClientRect().toJSON(),
                  shootActionVisible: !document.getElementById('mobShoot').hidden,
                  active: GameState.mode === 'playing'
                })""")
                touch_action_count = case_frame.evaluate("window.__wo003TouchActions")
                check(label + "-touch-controls", touched and during_x != before_x and touch_events["controlsVisible"] and touch_events["joystickAvailable"] and touch_events["active"], {"tapDispatched": touched, "shootPressedEvents": touch_action_count, "frogXBefore": before_x, "frogXDuring": during_x, "controls": touch_events})
                if label == "phone-portrait":
                    mobile_shot = output / "arcade-running-mobile-390x844.png"
                    case_page.screenshot(path=str(mobile_shot), full_page=True)
                    report["screenshots"].append(str(mobile_shot))
            metrics = case_frame.evaluate("""() => ({
              viewport: {width: innerWidth, height: innerHeight},
              document: {clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth},
              canvas: (() => { const r = document.getElementById('gameCanvas').getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height}; })(),
              mode: GameState.currentMode, characterId: GameState.selectedCharacterId
            })""")
            metrics["label"] = label
            metrics["outerViewport"] = dimensions
            metrics["noHorizontalOverflow"] = metrics["document"]["scrollWidth"] <= metrics["document"]["clientWidth"]
            report["viewports"].append(metrics)
            check(label + "-responsive-no-overflow", metrics["noHorizontalOverflow"] and metrics["canvas"]["width"] > 0 and metrics["canvas"]["height"] > 0, metrics)
            if label == "phone-portrait":
                case_page.set_viewport_size({"width": 844, "height": 390})
                case_page.wait_for_timeout(500)
                case_frame = get_game_frame(case_page)
                landscape = case_frame.evaluate("""() => ({
                  viewport: {width: innerWidth, height: innerHeight},
                  document: {clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth},
                  canvas: (() => { const r = document.getElementById('gameCanvas').getBoundingClientRect(); return {width:r.width,height:r.height}; })(),
                  mode: GameState.mode
                })""")
                landscape["noHorizontalOverflow"] = landscape["document"]["scrollWidth"] <= landscape["document"]["clientWidth"]
                report["viewports"].append({"label":"phone-landscape-after-resize", **landscape})
                check("phone-orientation-resize-recovery", landscape["noHorizontalOverflow"] and landscape["canvas"]["width"] > 0 and landscape["canvas"]["height"] > 0 and landscape["mode"] == "playing", landscape)
            case_context.close()

        # New browser context models close/reopen with no host-origin persistence.
        reopen_context, reopen_page, reopen_frame = open_harness(browser, {"width": 1366, "height": 768})
        reopen_state = reopen_frame.evaluate("({mode:GameState.mode, score:GameState.score, characterId:GameState.selectedCharacterId})")
        check("close-reopen-resets-session-only-state", reopen_state["mode"] == "menu" and reopen_state["score"] == 0 and reopen_state["characterId"] == "toadal", reopen_state)
        reopen_context.close()

        # Summarize only the normal, non-probe static-resource traffic.
        unique_urls = sorted(set(request["url"] for request in report["network"]["requests"]))
        report["network"]["uniqueRequests"] = len(unique_urls)
        report["network"]["externalRequests"] = [url for url in unique_urls if urlparse(url).scheme in ("http", "https") and urlparse(url).netloc != urlparse(args.url).netloc]
        report["network"]["failedResourceCount"] = len(report["network"]["failures"])
        report["network"]["badResponses"] = [response for response in report["network"]["responses"] if response["status"] >= 400]
        expected_console_markers = (
            "Blocked opening 'https://example.org/wo003-popup-probe'",
            "Unsafe attempt to initiate navigation for frame",
            "WO-003 controlled error-channel probe",
        )
        report["network"]["expectedProbeConsoleErrors"] = [entry for entry in report["network"]["consoleErrors"] if any(marker in entry["text"] for marker in expected_console_markers)]
        report["network"]["unexpectedConsoleErrors"] = [entry for entry in report["network"]["consoleErrors"] if entry not in report["network"]["expectedProbeConsoleErrors"]]
        report["pass"] = len(report["failures"]) == 0 and not report["network"]["externalRequests"] and report["network"]["failedResourceCount"] == 0 and not report["network"]["badResponses"] and not report["network"]["pageErrors"] and not report["network"]["unexpectedConsoleErrors"]
        browser.close()

    report_path = output / "runtime-qualification.json"
    report["reportPath"] = str(report_path)
    report_path.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    summary = {
        "pass": report["pass"],
        "checkCount": len(report["checks"]),
        "failedChecks": report["failures"],
        "network": {key: report["network"][key] for key in ("uniqueRequests", "externalRequests", "failedResourceCount", "badResponses", "expectedProbeConsoleErrors", "unexpectedConsoleErrors", "pageErrors", "downloads")},
        "realGameplay": report["controls"].get("realGameplay"),
        "viewports": report["viewports"],
        "screenshots": report["screenshots"],
        "reportPath": str(report_path),
    }
    print(json.dumps(summary, indent=2, sort_keys=True))
    return 0 if report["pass"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
