#!/usr/bin/env python
"""ARC-QUAL-01 live runtime checks against the isolated WO-003 candidate."""

import argparse
import ctypes
from ctypes import wintypes
import hashlib
import json
import time
from pathlib import Path

from playwright.sync_api import sync_playwright


CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
STATE_KEY = "toadal:game:toadal-feast-arcade-preview:v1:state"


def sha256(path):
    digest = hashlib.sha256()
    with open(path, "rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest().upper()


def foreground_chrome_window():
    """Bring the headed qualification tab to the real Windows foreground."""
    try:
        user32 = ctypes.windll.user32
        target = [None]
        enum_type = ctypes.WINFUNCTYPE(wintypes.BOOL, wintypes.HWND, wintypes.LPARAM)

        @enum_type
        def visit(hwnd, _param):
            if not user32.IsWindowVisible(hwnd):
                return True
            length = user32.GetWindowTextLengthW(hwnd)
            if not length:
                return True
            title = ctypes.create_unicode_buffer(length + 1)
            user32.GetWindowTextW(hwnd, title, length + 1)
            if "wo-003 arcade sampler qualification harness" in title.value.lower():
                target[0] = hwnd
                return False
            return True

        user32.EnumWindows(visit, 0)
        hwnd = target[0]
        if not hwnd:
            return {"found":False,"foreground":False,"title":""}
        target_pid = wintypes.DWORD()
        target_thread = user32.GetWindowThreadProcessId(hwnd, ctypes.byref(target_pid))
        current_foreground = user32.GetForegroundWindow()
        foreground_thread = user32.GetWindowThreadProcessId(current_foreground, None) if current_foreground else 0
        current_thread = ctypes.windll.kernel32.GetCurrentThreadId()
        attached = []
        for thread_id in (foreground_thread, target_thread):
            if thread_id and thread_id != current_thread and user32.AttachThreadInput(current_thread, thread_id, True):
                attached.append(thread_id)
        user32.ShowWindow(hwnd, 9)
        user32.BringWindowToTop(hwnd)
        user32.SetForegroundWindow(hwnd)
        for thread_id in reversed(attached):
            user32.AttachThreadInput(current_thread, thread_id, False)
        title = ctypes.create_unicode_buffer(512)
        user32.GetWindowTextW(hwnd, title, 512)
        return {"found":True,"foreground":user32.GetForegroundWindow()==hwnd,"title":title.value,
                "processId":int(target_pid.value)}
    except Exception as error:
        return {"found":False,"foreground":False,"error":str(error)}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="http://127.0.0.1:8899/cartridge/qualification-harness.html")
    parser.add_argument("--bot-url", default="http://127.0.0.1:8899/qa/arcade-bot.js")
    parser.add_argument("--bot", required=True, help="Path to the external QA-only Arcade bot; it is not included in the cartridge package.")
    parser.add_argument("--output", default="docs/review/WO-003/arc-qual-01/runtime.json")
    parser.add_argument("--max-standard-seconds", type=int, default=25)
    parser.add_argument("--headed", action="store_true", default=True)
    args = parser.parse_args()

    output = Path(args.output).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    bot_path = Path(args.bot).resolve()
    report = {
        "schema": "toadal-feast.arc-qual-01.runtime.v1",
        "url": args.url,
        "browser": {},
        "externalQaDriver": {"path": str(bot_path), "sha256": sha256(bot_path) if bot_path.is_file() else None,
                             "includedInCandidate": False},
        "checks": [],
        "failures": [],
        "profiles": [],
        "gameplay": {},
        "mechanics": {},
        "network": {"requests": [], "responses": [], "failures": [], "consoleErrors": [], "pageErrors": [], "decodeErrors": []},
    }
    current_profile = ["bootstrap"]

    def check(name, passed, evidence=None):
        entry = {"name": name, "pass": bool(passed)}
        if evidence is not None:
            entry["evidence"] = evidence
        report["checks"].append(entry)
        if not passed:
            report["failures"].append(name)
        print(("PASS " if passed else "FAIL ") + name, flush=True)

    def attach(page):
        page.on("request", lambda request: report["network"]["requests"].append({
            "profile": current_profile[0], "url": request.url, "method": request.method, "type": request.resource_type,
        }))
        page.on("response", lambda response: report["network"]["responses"].append({
            "profile": current_profile[0], "url": response.url, "status": response.status,
            "type": response.request.resource_type,
        }))
        page.on("requestfailed", lambda request: report["network"]["failures"].append({
            "profile": current_profile[0], "url": request.url, "failure": request.failure,
            "type": request.resource_type,
        }))
        page.on("console", lambda message: report["network"]["consoleErrors"].append({
            "profile": current_profile[0], "text": message.text, "location": message.location,
        }) if message.type == "error" else None)
        page.on("pageerror", lambda error: report["network"]["pageErrors"].append({
            "profile": current_profile[0], "error": str(error),
        }))

    def game_frame(page):
        return next(frame for frame in page.frames if "/arcade-standalone.html" in frame.url)

    def state(frame):
        return frame.evaluate("""() => {
          const ch = getCharDef?.();
          const ps = ch?.id === 'pelican' ? GameState.charState?.pelican : null;
          const ts = ch?.id === 'toadal' ? ArcadeToadalMechanics?.snapshot?.() : null;
          return {
            mode:GameState?.mode, experience:GameState?.currentMode,
            score:Number(GameState?.score||0), level:Number(GameState?.level||1), lives:Number(GameState?.lives||0),
            character:String(ch?.id||GameState?.selectedCharacterId||''), x:Number(frog?.x||0), y:Number(frog?.y||0),
            visible:!document.hidden, focused:document.hasFocus(),
            tongue:typeof tongue!=='undefined' ? {active:Boolean(tongue?.active),phase:String(tongue?.phase||''),
              shotId:Number(tongue?.shotId||0),swallowTimer:Number(tongue?.swallowTimer||0)} : null,
            pelican:ps ? {flightMode:ps.flightMode||null, grounded:ps.grounded===true, y:Number(ps.y||frog?.y||0),
              vx:Number(ps.flightVx||0), vy:Number(ps.flightVy||0), pouchFull:ps.pouchFull===true,
              catchAnimTimer:Number(ps.catchAnimTimer||0)} : null,
            renderer:typeof ArcadeCharacterRenderRouter!=='undefined' ? ArcadeCharacterRenderRouter.snapshot() : null,
            pelicanAnimation:ch?.id==='pelican' && typeof GullyArcadeAnimationRenderer!=='undefined'
              ? GullyArcadeAnimationRenderer.controller.snapshot().activeId : null,
            toadal:ts ? {charge:Number(ts.charge||0), grounded:ts.grounded===true, blocks:(ts.blocks||[]).length,
              diagnostics:ts.diagnostics} : null,
            fmfTimeLeft:Number(GameState?.fmfTimeLeft||0)
          };
        }""")

    def wait_playing(frame, timeout=30000):
        wait_until(frame, "() => GameState?.mode === 'playing'", timeout)

    def wait_until(target, expression, timeout_ms=30000, arg=None):
        deadline = time.monotonic() + timeout_ms / 1000.0
        while time.monotonic() < deadline:
            if target.evaluate(expression, arg):
                return True
            target.wait_for_timeout(50)
        raise AssertionError("Timed out polling browser predicate: " + expression)

    def start(page, frame, experience, character=None):
        page.locator("[data-arcade-preview-experience]").select_option(experience)
        if experience == "standard" and character:
            page.locator("[data-arcade-preview-character]").select_option(character)
        if page.locator("[data-arcade-preview-start]").is_disabled():
            wait_until(page, "() => !document.querySelector('[data-arcade-preview-start]').disabled", 10000)
        before = page.evaluate("() => (window.__wo003Messages||[]).filter(m=>m.type==='game:started').length")
        page.bring_to_front()
        report["browser"].setdefault("foregroundAttempts", []).append(foreground_chrome_window())
        page.locator("[data-arcade-preview-start]").click()
        wait_until(page, "() => {const f=document.querySelector('[data-arcade-preview-frame]');return f&&!f.hidden}", 10000)
        wait_playing(frame)
        wait_until(page, "n => (window.__wo003Messages||[]).filter(m=>m.type==='game:started').length > n", 20000, before)
        page.wait_for_timeout(200)
        coach = frame.locator("button").filter(has_text="Got it")
        if coach.count() and coach.first.is_visible():
            coach.first.click(timeout=5000)
        frame.locator("#gameCanvas").click(timeout=10000)
        page.bring_to_front()
        report["browser"]["foregroundAttempts"].append(foreground_chrome_window())
        frame.evaluate("() => window.focus()")
        wait_playing(frame, 5000)
        return state(frame)

    def close_preview(page, frame):
        if not page.locator("[data-arcade-preview-frame]").is_hidden():
            page.locator("[data-arcade-preview-exit]").click()
            wait_until(page, "() => document.querySelector('[data-arcade-preview-frame]').hidden", 10000)
        frame.wait_for_timeout(150)

    def install_probe(frame):
        frame.evaluate("""() => {
          window.__arcQualEvents = [];
          window.__arcQualDecodeErrors = [];
          const names = [
            'gameStarted','gameOver','foodCaught','shootPressed','toadalChargeChanged','toadalCrouchStarted',
            'toadalChargedHopStarted','toadalLanded','toadalGoldenThrowReleased','toadalBlockCreated',
            'toadalTongueStarted','gullyTakeoff','pelicanTakeoff','gullyLanding','pelicanLanding'
          ];
          for (const name of names) EventBus.on(name, payload => {
            let clean = {};
            try { clean = JSON.parse(JSON.stringify(payload || {})); } catch (_) {}
            const pelican = GameState?.charState?.pelican;
            const characterId = getCharDef?.()?.id || null;
            window.__arcQualEvents.push({name, at:performance.now(), payload:clean,
              stateAtEvent:{characterId,
                mode:GameState?.mode, score:Number(GameState?.score||0), frogX:Number(frog?.x||0), frogY:Number(frog?.y||0),
                flightMode:pelican?.flightMode||null, grounded:pelican?.grounded===true,
                pouchFull:Number(pelican?.pouchFull||0), catchAnimTimer:Number(pelican?.catchAnimTimer||0),
                pelicanAnimation:characterId==='pelican' && typeof GullyArcadeAnimationRenderer!=='undefined'
                  ? GullyArcadeAnimationRenderer.controller.snapshot().activeId : null,
                tongueActive:typeof tongue!=='undefined' ? Boolean(tongue?.active) : null,
                tongueShotId:typeof tongue!=='undefined' ? Number(tongue?.shotId||0) : null,
                swallowTimer:typeof tongue!=='undefined' ? Number(tongue?.swallowTimer||0) : null
              }});
          });
          window.addEventListener('error', event => {
            if (event.target && (event.target.tagName === 'IMG' || event.target.tagName === 'IMAGE')) {
              window.__arcQualDecodeErrors.push({src:event.target.src||event.target.href||'', message:event.message||'image load/decode error'});
            }
          }, true);
          window.__gullyTrace = [];
          const trace = label => {
            const p = GameState?.charState?.pelican;
            window.__gullyTrace.push({label, at:performance.now(), mode:GameState?.mode, character:getCharDef?.()?.id,
              frogX:Number(frog?.x||0), frogY:Number(frog?.y||0),
              flightMode:p?.flightMode||null, grounded:p?.grounded===true, y:Number(p?.y||0),
              vx:Number(p?.flightVx||0), vy:Number(p?.flightVy||0), pouchFull:p?.pouchFull===true,
              catchAnimTimer:Number(p?.catchAnimTimer||0)});
          };
          EventBus.on('gameStarted', () => trace('gameStarted'));
          window.__gullyTraceInterval = setInterval(() => { if (getCharDef?.()?.id === 'pelican') trace('sample'); }, 50);
        }""")

    def events(frame, name=None):
        return frame.evaluate("name => (window.__arcQualEvents||[]).filter(e=>!name||e.name===name)", name)

    def spawn_physical_food(frame, center_y_offset):
        return frame.evaluate("""offset => {
          if (GameState?.mode !== 'playing' || typeof EntityFactory === 'undefined' || !Array.isArray(entities?.foods)) return null;
          const item = EntityFactory.createFood('food.apple', false, false, 34);
          item.x = Number(frog.x);
          item.y = Number(frog.y) + Number(offset);
          item.vx = 0; item.vy = 0; item.scale = 1; item.wobble = 0; item.rotation = 0;
          item.qaDeterministicTarget = true;
          item.arcQualCreatedAt = performance.now();
          entities.foods.push(item);
          return {itemId:item.itemId, x:item.x, y:item.y, frogX:Number(frog.x), frogY:Number(frog.y),
            scoreBefore:Number(GameState.score||0), chargeBefore:Number(GameState.charState?.toadal?.charge||0)};
        }""", center_y_offset)

    def run_standard_bot_retry(page, frame, profile_name, max_seconds=25):
        current_profile[0] = profile_name
        start_state = start(page, frame, "standard", "toadal")
        if not frame.evaluate("() => Boolean(window.FroggyArcadeQABot)"):
            frame.add_script_tag(url=args.bot_url)
        bot_start = frame.evaluate("() => ({started:FroggyArcadeQABot.start(),snapshot:FroggyArcadeQABot.snapshot()})")
        event_offset = len(events(frame))
        attempt_started = time.monotonic()
        active_started = None
        longest_active = 0.0
        max_level = start_state["level"]
        max_score = start_state["score"]
        samples = []
        while time.monotonic() - attempt_started < max_seconds:
            page.wait_for_timeout(500)
            snapshot = state(frame)
            now = time.monotonic()
            if snapshot["mode"] == "playing":
                if active_started is None:
                    active_started = now
                longest_active = max(longest_active, now - active_started)
            elif active_started is not None:
                longest_active = max(longest_active, now - active_started)
                active_started = None
            max_level = max(max_level, snapshot["level"])
            max_score = max(max_score, snapshot["score"])
            if len(samples) < 8 and (not samples or now - attempt_started >= samples[-1]["elapsedSec"] + 4):
                samples.append({"elapsedSec":round(now-attempt_started,2), **snapshot})
            attempt_events = events(frame)[event_offset:]
            positive = [event for event in attempt_events if event["name"]=="foodCaught"
                and float(event["payload"].get("points",0) or 0)>0]
            if max_level >= 2 and positive and max_score > start_state["score"]:
                break
            if snapshot["mode"] == "dead":
                break
            if snapshot["mode"] == "paused":
                page.bring_to_front()
                report["browser"].setdefault("foregroundAttempts",[]).append(foreground_chrome_window())
                frame.evaluate("() => window.focus()")
                page.locator("[data-arcade-preview-resume]").click()
                wait_playing(frame,5000)
        if active_started is not None:
            longest_active = max(longest_active,time.monotonic()-active_started)
        bot_before_stop = frame.evaluate("() => FroggyArcadeQABot.snapshot()")
        bot_after_stop = frame.evaluate("() => FroggyArcadeQABot.stop()")
        final_state = state(frame)
        attempt_events = events(frame)[event_offset:]
        positive = [event for event in attempt_events if event["name"]=="foodCaught"
            and float(event["payload"].get("points",0) or 0)>0]
        catches = [event for event in attempt_events if event["name"]=="foodCaught"]
        natural = any(event["name"]=="gameOver" for event in attempt_events) and final_state["mode"]=="dead"
        qualifies = max_level>=2 or (natural and longest_active>=60) or (
            longest_active>=60 and len(catches)>=2 and len(positive)>=2 and max_score>start_state["score"])
        return {"start":start_state,"final":final_state,"botStart":bot_start,
            "botEnd":{"before":bot_before_stop,"after":bot_after_stop},
            "wallDurationSec":round(time.monotonic()-attempt_started,2),
            "longestUninterruptedPlayingSec":round(longest_active,2),
            "maxObservedLevel":max_level,"maxObservedScore":max_score,
            "realFoodCaughtEvents":len(catches),"positiveFoodCaughtEvents":len(positive),
            "naturalGameOver":natural,"samples":samples,"eventTail":attempt_events[-25:],
            "qualifies":qualifies}

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=not args.headed, executable_path=CHROME)
        report["browser"] = {"version": browser.version, "executable": CHROME, "headless": not args.headed}
        context = browser.new_context(viewport={"width": 1366, "height": 768}, device_scale_factor=1)
        page = context.new_page()
        attach(page)
        page.goto(args.url, wait_until="load", timeout=60000)
        report["browser"]["initialForeground"] = foreground_chrome_window()
        wait_until(page, "() => (window.__wo003Messages||[]).some(m=>m.type==='game:profile-ready')", 30000)
        frame = game_frame(page)
        install_probe(frame)
        frame_attrs = page.locator("[data-arcade-preview-frame]").evaluate("e=>({sandbox:e.getAttribute('sandbox'),allow:e.getAttribute('allow')})")
        check("opaque-origin-policy-retained", "allow-same-origin" not in (frame_attrs["sandbox"] or "")
              and frame.evaluate("self.origin") == "null", {"attributes":frame_attrs,"origin":frame.evaluate("self.origin")})
        check("session-id-issued", len(page.evaluate("window.__wo003Session()")) >= 32,
              {"length":len(page.evaluate("window.__wo003Session()"))})

        # Standard / Toadal sustained play using the authoritative QA-only bot.
        current_profile[0] = "standard-toadal-sustained"
        start_state = start(page, frame, "standard", "toadal")
        frame.add_script_tag(url=args.bot_url)
        bot_start = frame.evaluate("() => ({started:FroggyArcadeQABot.start(), snapshot:FroggyArcadeQABot.snapshot()})")
        samples = []
        run_started = time.monotonic()
        active_started = None
        longest_active = 0.0
        max_level = start_state["level"]
        max_score = start_state["score"]
        game_over_seen = False
        while time.monotonic() - run_started < args.max_standard_seconds:
            page.wait_for_timeout(1000)
            snapshot = state(frame)
            now = time.monotonic()
            max_level = max(max_level, snapshot["level"])
            max_score = max(max_score, snapshot["score"])
            positive_catches = [e for e in events(frame, "foodCaught") if float(e["payload"].get("points", 0) or 0) > 0]
            # Level 2 is an explicit qualification threshold. Stop as soon as
            # the real run reaches it with score progression; do not soak.
            if max_level >= 2 and len(positive_catches) >= 2 and max_score > start_state["score"]:
                break
            if snapshot["mode"] != "playing" and active_started is not None:
                longest_active = max(longest_active, now - active_started)
                active_started = None
            if snapshot["mode"] == "playing":
                if active_started is None:
                    active_started = now
                longest_active = max(longest_active, now - active_started)
            else:
                if active_started is not None:
                    longest_active = max(longest_active, now - active_started)
                    active_started = None
                if snapshot["mode"] == "dead":
                    game_over_seen = True
                    break
                if snapshot["mode"] == "paused":
                    page.bring_to_front()
                    report["browser"]["foregroundAttempts"].append(foreground_chrome_window())
                    frame.evaluate("() => window.focus()")
                    page.locator("[data-arcade-preview-resume]").click()
                    wait_playing(frame, 5000)
            if len(samples) < 30 and (not samples or now - run_started >= samples[-1]["elapsedSec"] + 4):
                samples.append({"elapsedSec":round(now-run_started,2), **snapshot})
            positive_catches = [e for e in events(frame, "foodCaught") if float(e["payload"].get("points", 0) or 0) > 0]
            if longest_active >= 60 and max_level >= 2 and len(positive_catches) >= 2 and max_score > start_state["score"]:
                break
        if active_started is not None:
            longest_active = max(longest_active, time.monotonic() - active_started)
        bot_end = frame.evaluate("() => {const before=FroggyArcadeQABot.snapshot(); const after=FroggyArcadeQABot.stop(); return {before,after};}")
        final_state = state(frame)
        standard_events = events(frame)
        positive_catches = [e for e in standard_events if e["name"] == "foodCaught" and float(e["payload"].get("points",0) or 0) > 0]
        real_catches = [e for e in standard_events if e["name"] == "foodCaught"]
        natural_completed = any(e["name"] == "gameOver" for e in standard_events) and final_state["mode"] == "dead"
        qualifies_sustained = max_level >= 2 or (natural_completed and longest_active >= 60) or (
            longest_active >= 60 and len(real_catches) >= 2 and len(positive_catches) >= 2 and max_score > start_state["score"]
        )
        report["gameplay"]["standardToadal"] = {
            "start":start_state,"final":final_state,"botStart":bot_start,"botEnd":bot_end,
            "wallDurationSec":round(time.monotonic()-run_started,2),"longestUninterruptedPlayingSec":round(longest_active,2),
            "maxObservedLevel":max_level,"maxObservedScore":max_score,"realFoodCaughtEvents":len(real_catches),
            "positiveFoodCaughtEvents":len(positive_catches),"naturalGameOver":natural_completed,
            "samples":samples,"eventTail":standard_events[-40:],"qualifies":qualifies_sustained,
        }
        report["profiles"].append({"experience":"standard","character":"toadal","phase":"sustained-attempt-1"})
        selected_standard = report["gameplay"]["standardToadal"]
        standard_attempts = [selected_standard]
        if not qualifies_sustained:
            for attempt_number in range(2,4):
                close_preview(page, frame)
                retry = run_standard_bot_retry(page, frame,
                    "standard-toadal-sustained-retry-{}".format(attempt_number), max_seconds=22)
                standard_attempts.append(retry)
                report["profiles"].append({"experience":"standard","character":"toadal",
                    "phase":"sustained-attempt-{}".format(attempt_number)})
                if retry["qualifies"]:
                    selected_standard = retry
                    qualifies_sustained = True
                    break
        report["gameplay"]["standardToadal"] = dict(selected_standard, qualificationAttempts=standard_attempts)
        check("standard-toadal-qualified-sustained-real-play", qualifies_sustained,
              report["gameplay"]["standardToadal"])
        selected_bot_end = selected_standard.get("botEnd",{}).get("after",{})
        check("standard-toadal-bot-drove-live-path", selected_standard.get("botStart",{}).get("started") is True
              and selected_bot_end.get("scoreGain",0) > 0
              and selected_standard.get("realFoodCaughtEvents",0) > 0,
              {"driver":selected_bot_end.get("driver"),"snapshot":selected_bot_end,
               "foodCaughtEvents":selected_standard.get("realFoodCaughtEvents",0)})

        # Start mechanics qualification from a clean live run. The sustained bot run can
        # legitimately leave charge capped at 100, which would hide the direct-catch
        # charge-change witness even though the physical collision and score path work.
        close_preview(page, frame)
        current_profile[0] = "standard-toadal-mechanics"
        start_state = start(page, frame, "standard", "toadal")
        if not frame.evaluate("() => window.FroggyArcadeQABot?.stop?.()"):
            pass

        # Catch one factory-created, normal food object through the real body collision path.
        diag_before = frame.evaluate("ArcadeToadalMechanics.snapshot().diagnostics")
        caught_before = len([e for e in events(frame,"foodCaught") if e["payload"].get("catchSource")=="toadal-direct"])
        charge_event_count_before = len(events(frame,"toadalChargeChanged"))
        food = spawn_physical_food(frame, -46)
        try:
            wait_until(frame, "n => ArcadeToadalMechanics.snapshot().diagnostics.directFoodCatches > n",
                       6000, diag_before["directFoodCatches"])
        except Exception:
            try:
                wait_until(frame, "n => ArcadeToadalMechanics.snapshot().diagnostics.directFoodCatches > n",
                           6000, diag_before["directFoodCatches"])
            except Exception:
                pass
        # Re-read after the first bounded wait; if it did not catch, retry at the collision center.
        diag_after = frame.evaluate("ArcadeToadalMechanics.snapshot().diagnostics")
        if diag_after["directFoodCatches"] <= diag_before["directFoodCatches"]:
            offset = frame.evaluate("() => Number(getArcadeCharacterBehaviorProfile(getCharDef())?.collisionShape?.centerYOffset ?? -46)")
            food = spawn_physical_food(frame, offset)
            try:
                wait_until(frame, "n => ArcadeToadalMechanics.snapshot().diagnostics.directFoodCatches > n",
                           7000, diag_before["directFoodCatches"])
            except Exception:
                pass
        direct_events = [e for e in events(frame,"foodCaught") if e["payload"].get("catchSource")=="toadal-direct"]
        charge_events = [e for e in events(frame,"toadalChargeChanged") if e["payload"].get("reason") in ("direct-food","airborne-food")]
        diag_after = frame.evaluate("ArcadeToadalMechanics.snapshot().diagnostics")
        direct_pass = (diag_after["directFoodCatches"] > diag_before["directFoodCatches"]
                       and len(direct_events) > caught_before and len(events(frame,"toadalChargeChanged")) > charge_event_count_before
                       and len(charge_events) > 0)
        report["mechanics"]["directCatch"] = {"createdBy":"EntityFactory.createFood('food.apple')","food":food,
            "before":diag_before,"after":diag_after,"directFoodCaughtEvents":direct_events[-3:],"chargeEvents":charge_events[-3:],"pass":direct_pass}
        check("toadal-direct-physical-catch", direct_pass, report["mechanics"]["directCatch"])

        # Charged Royal Hop is initiated only through real keyboard keydown/up.
        hop_before = len(events(frame,"toadalChargedHopStarted"))
        grounded_before = state(frame)["toadal"]
        if grounded_before and grounded_before["grounded"]:
            page.bring_to_front()
            page.keyboard.down("ArrowDown")
            page.wait_for_timeout(1050)
            page.keyboard.up("ArrowDown")
            try:
                wait_until(frame, "n => (window.__arcQualEvents||[]).filter(e=>e.name==='toadalChargedHopStarted').length > n",
                           4000, hop_before)
            except Exception:
                pass
        hop_events = events(frame,"toadalChargedHopStarted")
        hop_after = frame.evaluate("ArcadeToadalMechanics.snapshot().diagnostics")
        hop_pass = len(hop_events) > hop_before and hop_after["chargedHops"] > diag_after["chargedHops"]
        report["mechanics"]["chargedRoyalHop"] = {"groundedBefore":grounded_before,"events":hop_events[hop_before:],
            "diagnosticsAfter":hop_after,"pass":hop_pass}
        check("toadal-charged-royal-hop", hop_pass, report["mechanics"]["chargedRoyalHop"])
        try:
            wait_until(frame, "() => GameState.mode !== 'playing' || ArcadeToadalMechanics.snapshot().grounded === true", 6000)
        except Exception:
            pass

        # Earn charge exclusively via normal factory-created food objects and body collisions.
        charge_attempts = []
        for _ in range(24):
            current = frame.evaluate("() => ({mode:GameState.mode,charge:Number(GameState.charState?.toadal?.charge||0),direct:ArcadeToadalMechanics.snapshot().diagnostics.directFoodCatches})")
            if current["mode"] != "playing" or current["charge"] >= 100:
                break
            item = spawn_physical_food(frame, -46)
            try:
                wait_until(frame, "n => ArcadeToadalMechanics.snapshot().diagnostics.directFoodCatches > n", 2000, current["direct"])
            except Exception:
                pass
            charge_attempts.append({"item":item,"after":frame.evaluate("() => ({charge:GameState.charState.toadal.charge,direct:ArcadeToadalMechanics.snapshot().diagnostics.directFoodCatches,score:GameState.score})")})
        charge_for_throw = frame.evaluate("() => Number(GameState.charState?.toadal?.charge||0)")
        throw_before = frame.evaluate("ArcadeToadalMechanics.snapshot().diagnostics.throwChargeSpent")
        throw_event_before = len(events(frame,"toadalGoldenThrowReleased"))
        if charge_for_throw >= 45 and state(frame)["mode"] == "playing":
            page.bring_to_front()
            page.keyboard.press("q")
            try:
                wait_until(frame, "n => (window.__arcQualEvents||[]).filter(e=>e.name==='toadalGoldenThrowReleased').length > n",
                           4000, throw_event_before)
            except Exception:
                pass
        throw_events = events(frame,"toadalGoldenThrowReleased")
        throw_after = frame.evaluate("ArcadeToadalMechanics.snapshot().diagnostics.throwChargeSpent")
        throw_pass = throw_after > throw_before and len(throw_events) > throw_event_before
        report["mechanics"]["goldenThrow"] = {"earnedCharge":charge_for_throw,"chargeAttempts":charge_attempts,
            "events":throw_events[throw_event_before:],"chargeSpentBefore":throw_before,"chargeSpentAfter":throw_after,"pass":throw_pass}
        check("toadal-golden-throw", throw_pass, report["mechanics"]["goldenThrow"])

        for _ in range(24):
            current = frame.evaluate("() => ({mode:GameState.mode,charge:Number(GameState.charState?.toadal?.charge||0),direct:ArcadeToadalMechanics.snapshot().diagnostics.directFoodCatches})")
            if current["mode"] != "playing" or current["charge"] >= 100:
                break
            item = spawn_physical_food(frame, -46)
            try:
                wait_until(frame, "n => ArcadeToadalMechanics.snapshot().diagnostics.directFoodCatches > n", 2000, current["direct"])
            except Exception:
                pass
            charge_attempts.append({"item":item,"after":frame.evaluate("() => ({charge:GameState.charState.toadal.charge,direct:ArcadeToadalMechanics.snapshot().diagnostics.directFoodCatches,score:GameState.score})")})
        placement = frame.evaluate("ArcadeToadalMechanics.placementCandidate()")
        block_charge = frame.evaluate("() => Number(GameState.charState?.toadal?.charge||0)")
        block_before = frame.evaluate("ArcadeToadalMechanics.snapshot().diagnostics.blockChargeSpent")
        block_event_before = len(events(frame,"toadalBlockCreated"))
        if block_charge >= 100 and placement.get("ok") and state(frame)["mode"] == "playing":
            page.bring_to_front()
            page.keyboard.press("e")
            try:
                wait_until(frame, "n => (window.__arcQualEvents||[]).filter(e=>e.name==='toadalBlockCreated').length > n",
                           4000, block_event_before)
            except Exception:
                pass
        block_events = events(frame,"toadalBlockCreated")
        block_after = frame.evaluate("ArcadeToadalMechanics.snapshot().diagnostics.blockChargeSpent")
        block_state = frame.evaluate("ArcadeToadalMechanics.snapshot()")
        block_pass = block_after > block_before and len(block_events) > block_event_before and block_state.get("blockCount",0) > 0
        report["mechanics"]["goldenBlock"] = {"earnedCharge":block_charge,"placement":placement,"events":block_events[block_event_before:],
            "chargeSpentBefore":block_before,"chargeSpentAfter":block_after,"state":block_state,"pass":block_pass}
        check("toadal-golden-block", block_pass, report["mechanics"]["goldenBlock"])

        # Earn the Standard completion needed to unlock Classic even when the sustained
        # Standard run already crossed the score threshold that unlocks Gully.
        completed = page.evaluate("() => ToadalArcadePreviewHost.state.completedStandardRuns")
        best = page.evaluate("() => ToadalArcadePreviewHost.state.bestScoreOverall")
        unlock_runs = []
        while (completed < 1 or (completed < 3 and best < 600)) and len(unlock_runs) < 4:
            close_preview(page, frame)
            current_profile[0] = "standard-natural-unlock-run"
            before_count = page.evaluate("() => (window.__wo003Messages||[]).filter(m=>m.type==='game:complete').length")
            start(page, frame, "standard", "toadal")
            run_start = time.monotonic()
            while time.monotonic() - run_start < 25:
                page.wait_for_timeout(500)
                unlock_state = state(frame)
                if unlock_state["mode"] == "dead":
                    break
                if unlock_state["mode"] == "paused":
                    page.bring_to_front()
                    report["browser"]["foregroundAttempts"].append(foreground_chrome_window())
                    frame.evaluate("() => window.focus()")
                    page.locator("[data-arcade-preview-resume]").click()
                    wait_playing(frame, 5000)
            complete_count = page.evaluate("() => (window.__wo003Messages||[]).filter(m=>m.type==='game:complete').length")
            natural = state(frame)["mode"] == "dead" and complete_count > before_count
            unlock_runs.append({"durationSec":round(time.monotonic()-run_start,2),"final":state(frame),"naturalGameOver":natural})
            completed = page.evaluate("() => ToadalArcadePreviewHost.state.completedStandardRuns")
            best = page.evaluate("() => ToadalArcadePreviewHost.state.bestScoreOverall")
        report["gameplay"]["unlockRuns"] = {"runs":unlock_runs,"completedStandardRuns":completed,"bestScoreOverall":best,
            "classicUnlocked":completed>=1,"gullyUnlocked":best>=600 or completed>=3}

        # Standard / Classic: all active required sheets must load and gameplay must move/catch.
        if completed >= 1:
            close_preview(page, frame)
            current_profile[0] = "standard-classic"
            classic_start = start(page, frame, "standard", "classic")
            page.wait_for_timeout(900)
            idle_state = state(frame)
            x_before = idle_state["x"]
            page.keyboard.down("ArrowRight")
            page.wait_for_timeout(700)
            page.keyboard.up("ArrowRight")
            movement_state = state(frame)
            movement = {"xBefore":x_before,"xAfter":movement_state["x"],"delta":movement_state["x"]-x_before,
                        "renderer":movement_state["renderer"]}
            catch_before = len(events(frame,"foodCaught"))
            tongue_shot_before = state(frame)["tongue"]["shotId"]
            tongue_target = spawn_physical_food(frame, -150)
            page.keyboard.press("Space")
            try:
                wait_until(frame, "arg => (window.__arcQualEvents||[]).slice(arg.offset).some(e=>e.name==='foodCaught' && e.payload.itemId===arg.itemId && e.stateAtEvent?.characterId==='classic' && e.stateAtEvent?.tongueActive===true && e.stateAtEvent?.tongueShotId>arg.shotId)",
                           5000, {"offset":catch_before,"itemId":tongue_target["itemId"] if tongue_target else "","shotId":tongue_shot_before})
            except Exception:
                pass
            catch_events = events(frame,"foodCaught")[catch_before:]
            tongue_catch_events = [e for e in catch_events if tongue_target
                and e.get("payload",{}).get("itemId")==tongue_target["itemId"]
                and (e.get("stateAtEvent") or {}).get("characterId")=="classic"
                and (e.get("stateAtEvent") or {}).get("tongueActive") is True
                and (e.get("stateAtEvent") or {}).get("tongueShotId",0)>tongue_shot_before]
            tongue_catch = tongue_catch_events[-1] if tongue_catch_events else None
            page.wait_for_timeout(250)
            catch_renderer = state(frame)["renderer"]
            frame.add_script_tag(url=args.bot_url)
            bot_classic = frame.evaluate("() => ({started:FroggyArcadeQABot.start(),driver:FroggyArcadeQABot.snapshot().driver})")
            page.wait_for_timeout(12000)
            bot_classic_end = frame.evaluate("() => FroggyArcadeQABot.stop()")
            catch_events = events(frame,"foodCaught")[catch_before:]
            classic_responses = [r for r in report["network"]["responses"] if r["profile"]=="standard-classic" and "/assets/images/characters/curated-highres/classic/" in r["url"]]
            classic_asset_failures = [r for r in report["network"]["failures"] if r["profile"]=="standard-classic" and "/assets/images/characters/curated-highres/classic/" in r["url"]]
            classic_asset_errors = [r for r in classic_responses if r["status"]>=400] + classic_asset_failures
            effective_wanted = ["idle.png","idle_blink_16f_256.png","walk_12f.png","catch_open_10f.png"]
            requested_names = [Path(r["url"].split("?")[0]).name for r in classic_responses]
            required_assets_ok = all(name in requested_names and all(r["status"]==200 for r in classic_responses if Path(r["url"].split("?")[0]).name==name) for name in effective_wanted)
            decoded_errors = frame.evaluate("() => window.__arcQualDecodeErrors||[]")
            asset_root = Path(__file__).resolve().parents[1] / "studio-project" / "toadal-feast-website" / "reference" / "audit" / "arcade-standard-6daedca1" / "assets" / "images" / "characters"
            audited_asset_paths = [
                asset_root / "runtime-select" / "classic.png",
                asset_root / "curated-highres" / "classic" / "idle_blink_5f_polished_2026-09-08.png",
                asset_root / "curated-highres" / "classic" / "walk_12f.png",
                asset_root / "curated-highres" / "classic" / "catch_open_5f_polished_2026-09-08.png",
            ]
            source_assets = {str(path.relative_to(asset_root)).replace("\\","/"):{"present":path.is_file(),"sha256":sha256(path) if path.is_file() else None} for path in audited_asset_paths}
            source_assets_ok = all(item["present"] for item in source_assets.values())
            renderer_states_ok = all((value or {}).get("stage")=="dedicated-sprite" for value in (idle_state.get("renderer"), movement.get("renderer"), catch_renderer))
            classic_pass = classic_start["character"]=="classic" and abs(movement["delta"])>4 and tongue_catch is not None and renderer_states_ok and source_assets_ok and not classic_asset_errors and required_assets_ok and not decoded_errors
            report["profiles"].append({"experience":"standard","character":"classic","phase":"idle-move-catch"})
            report["gameplay"]["standardClassic"] = {"start":classic_start,"idle":idle_state,"movement":movement,
                "bot":bot_classic,"botEnd":bot_classic_end,"foodCaughtEvents":catch_events[-12:],
                "tongueCatchTarget":tongue_target,"tongueCatchEvent":tongue_catch,"catchRenderer":catch_renderer,
                "rendererStatesOk":renderer_states_ok,"auditedSourceAssets":source_assets,"sourceAssetsOk":source_assets_ok,
                "requiredAssetResponses":classic_responses,"requiredAssetNamesRequested":requested_names,
                "effectiveRuntimeAssetNamesRequired":effective_wanted,"decodeErrors":decoded_errors,
                "assetErrors":classic_asset_errors,"pass":classic_pass}
            check("classic-idle-movement-catch-and-assets", classic_pass, report["gameplay"]["standardClassic"])
        else:
            check("classic-idle-movement-catch-and-assets", False, {"reason":"no real completed Standard run unlocked Classic", **report["gameplay"]["unlockRuns"]})

        # Standard / Gully: record initial ground, flight transitions, 2-axis motion, catch/swallow and landing.
        gully_unlock = report["gameplay"].get("unlockRuns",{}).get("gullyUnlocked",False)
        if gully_unlock:
            close_preview(page, frame)
            current_profile[0] = "standard-gully"
            gully_start = start(page, frame, "standard", "pelican")
            initial_trace = frame.evaluate("() => (window.__gullyTrace||[]).filter(x=>x.character==='pelican').slice(0,3)")
            g0 = state(frame)
            page.keyboard.down("ArrowRight")
            page.keyboard.down("ArrowUp")
            page.wait_for_timeout(1200)
            diagonal = state(frame)
            page.keyboard.up("ArrowRight")
            page.keyboard.up("ArrowUp")
            two_axis = {"start":{"x":g0["x"],"y":g0["y"],"pelican":g0["pelican"]},
                        "end":{"x":diagonal["x"],"y":diagonal["y"],"pelican":diagonal["pelican"]}}
            gully_events_before = len(events(frame,"foodCaught"))
            food = spawn_physical_food(frame, -20)
            try:
                wait_until(frame, "() => (window.__arcQualEvents||[]).some(e=>e.name==='foodCaught')", 5000)
            except Exception:
                pass
            page.wait_for_timeout(400)
            gully_catches = events(frame,"foodCaught")[gully_events_before:]
            catch_state = state(frame)["pelican"]
            catch_event = next((event for event in gully_catches if event.get("payload",{}).get("characterId")=="pelican"),None)
            catch_event_state = (catch_event or {}).get("stateAtEvent") or {}
            page.keyboard.down("ArrowDown")
            page.wait_for_timeout(2200)
            page.keyboard.up("ArrowDown")
            page.wait_for_timeout(800)
            landing_state = state(frame)
            trace = frame.evaluate("() => (window.__gullyTrace||[]).slice(-60)")
            frame.evaluate("() => clearInterval(window.__gullyTraceInterval)")
            ground_proven = any((x.get("grounded") is True or x.get("flightMode")=="ground") for x in initial_trace+trace)
            takeoff_proven = any(x.get("flightMode")=="takeoff" for x in trace) or (
                ground_proven and any(x.get("flightMode")=="airborne" for x in trace))
            two_axis_proven = abs(two_axis["end"]["x"]-two_axis["start"]["x"])>5 and abs(two_axis["end"]["y"]-two_axis["start"]["y"])>5
            catch_proven = bool(catch_event and catch_event_state.get("pouchFull",0)>=1
                and catch_event_state.get("catchAnimTimer",0)>0
                and catch_event_state.get("score",0)>0)
            catch_swallow_animation_proven = catch_event_state.get("pelicanAnimation")=="catch_swallow"
            landing_proven = any((x.get("grounded") is True or x.get("flightMode")=="ground" or x.get("flightMode")=="landing") for x in trace[-30:])
            gully_pass = ground_proven and takeoff_proven and two_axis_proven and catch_proven and landing_proven
            report["profiles"].append({"experience":"standard","character":"pelican","phase":"ground-takeoff-flight-catch-land"})
            report["gameplay"]["standardGully"] = {"start":gully_start,"initialTrace":initial_trace,"twoAxisMotion":two_axis,
                "factoryFood":food,"catchEvents":gully_catches[-10:],"catchEvent":catch_event,
                "catchEventState":catch_event_state,"catchStateAt400ms":catch_state,
                "catchSwallowAnimationProven":catch_swallow_animation_proven,"landingState":landing_state,
                "trace":trace,"groundProven":ground_proven,"takeoffProven":takeoff_proven,"twoAxisProven":two_axis_proven,
                "catchSwallowProven":catch_proven,"landingProven":landing_proven,"pass":gully_pass}
            check("gully-ground-takeoff-2axis-catch-land", gully_pass, report["gameplay"]["standardGully"])
        else:
            check("gully-ground-takeoff-2axis-catch-land", False, {"reason":"Gully unlock rule not reached through natural Standard progression"})

        # FMF / Chomper and Zen / Princess smoke the final session-bound bridge with live score.
        for experience, forced_character in (("fmf","chomper"),("zen","princess")):
            close_preview(page, frame)
            current_profile[0] = experience + "-" + forced_character
            mode_start = start(page, frame, experience)
            mode_before = state(frame)
            frame.add_script_tag(url=args.bot_url)
            bot_mode = frame.evaluate("() => ({started:FroggyArcadeQABot.start(),driver:FroggyArcadeQABot.snapshot().driver})")
            page.wait_for_timeout(15000)
            bot_mode_end = frame.evaluate("() => FroggyArcadeQABot.stop()")
            mode_after = state(frame)
            mode_pass = mode_start["character"]==forced_character and mode_after["character"]==forced_character and mode_after["score"]>mode_before["score"]
            report["profiles"].append({"experience":experience,"character":forced_character,"phase":"live-score-smoke"})
            report["gameplay"][experience] = {"start":mode_start,"before":mode_before,"after":mode_after,
                "bot":bot_mode,"botEnd":bot_mode_end,"pass":mode_pass}
            check(experience+"-forced-character-live-score", mode_pass, report["gameplay"][experience])

        host_state = page.evaluate("() => JSON.parse(JSON.stringify(ToadalArcadePreviewHost.state))")
        report["persistence"] = {"key":STATE_KEY,"state":host_state,
            "storage":page.evaluate("key=>localStorage.getItem(key)",STATE_KEY)}
        report["network"]["externalRequests"] = [r for r in report["network"]["requests"] if not r["url"].startswith("http://127.0.0.1:8899/")]
        report["network"]["failedResponses"] = [r for r in report["network"]["responses"] if r["status"]>=400]
        check("no-external-network", len(report["network"]["externalRequests"])==0, report["network"]["externalRequests"])
        check("no-fatal-page-errors", len(report["network"]["pageErrors"])==0, report["network"]["pageErrors"])
        report["status"] = "PASS" if not report["failures"] else "BLOCKED"
        context.close()
        browser.close()

    output.write_text(json.dumps(report, indent=2, sort_keys=True), encoding="utf-8")
    print("RESULT " + json.dumps({"status":report["status"],"output":str(output),"checks":len(report["checks"]),
          "failures":report["failures"],"networkFailures":len(report["network"].get("failedResponses",[]))}, sort_keys=True), flush=True)
    return 0 if report["status"] == "PASS" else 2


if __name__ == "__main__":
    raise SystemExit(main())
