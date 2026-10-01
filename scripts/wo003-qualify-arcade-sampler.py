#!/usr/bin/env python
"""Continuation witness for the isolated WO-003 Standard/FMF/Zen sampler."""

import argparse
import json
import sys
import time
from pathlib import Path
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright


CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
STATE_KEY = "toadal:game:toadal-feast-arcade-preview:v1:state"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="http://127.0.0.1:8899/qualification-harness.html")
    parser.add_argument("--output", default="docs/review/WO-003/continuation-20260930")
    parser.add_argument("--standard-active-seconds", type=int, default=145)
    parser.add_argument("--completion-wait-seconds", type=int, default=75)
    parser.add_argument("--headed", action="store_true", help="run visible Chrome so lifecycle focus tests use a real foreground window")
    args = parser.parse_args()
    output = Path(args.output).resolve()
    output.mkdir(parents=True, exist_ok=True)

    report = {
        "schema": "toadal-feast.wo003.arcade-sampler-runtime-qualification.v1",
        "url": args.url,
        "python": sys.version,
        "checks": [], "failures": [], "profiles": [], "gameplay": {},
        "persistence": {}, "network": {"requests": [], "responses": [], "failures": [], "consoleErrors": [], "pageErrors": []},
        "screenshots": [],
    }

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
            "url": request.url, "method": request.method, "type": request.resource_type,
        }))
        page.on("response", lambda response: report["network"]["responses"].append({
            "url": response.url, "status": response.status, "type": response.request.resource_type,
        }))
        page.on("requestfailed", lambda request: report["network"]["failures"].append({
            "url": request.url, "failure": request.failure, "type": request.resource_type,
        }))
        page.on("console", lambda message: report["network"]["consoleErrors"].append({
            "type": message.type, "text": message.text, "location": message.location,
        }) if message.type == "error" else None)
        page.on("pageerror", lambda error: report["network"]["pageErrors"].append(str(error)))

    def game_frame(page):
        return next(frame for frame in page.frames if frame.url.endswith("/arcade-standalone.html"))

    def wait_message(page, kind, count=1, timeout=30000):
        page.wait_for_function(
            "([type,count]) => (window.__wo003Messages || []).filter(m => m.type === type).length >= count",
            arg=[kind, count], timeout=timeout,
        )

    def message_count(page, kind):
        return page.evaluate("type => (window.__wo003Messages || []).filter(m => m.type === type).length", kind)

    def wait_frame(frame, predicate, timeout=20000):
        deadline = time.time() + timeout / 1000.0
        while time.time() < deadline:
            if frame.evaluate(predicate):
                return
            frame.wait_for_timeout(100)
        raise AssertionError("Timed out waiting for frame predicate: " + predicate)

    def start(page, frame, experience, character="toadal"):
        page.locator("[data-arcade-preview-experience]").select_option(experience)
        if experience == "standard":
            page.locator("[data-arcade-preview-character]").select_option(character)
        started = message_count(page, "game:started")
        frame.evaluate("""() => {
          if (window.__wo003FocusTrace) return;
          window.__wo003FocusTrace = [];
          const record = name => window.__wo003FocusTrace.push({name, at:performance.now(), mode:GameState?.mode, hidden:document.hidden, focused:document.hasFocus()});
          window.addEventListener('blur', () => record('blur'), true);
          window.addEventListener('focus', () => record('focus'), true);
          document.addEventListener('visibilitychange', () => record('visibility:' + document.visibilityState));
          window.addEventListener('pagehide', () => record('pagehide'), true);
          window.addEventListener('pageshow', () => record('pageshow'), true);
          window.__wo003LifecycleTrace = [];
          window.__wo003PauseTrace = [];
          const originalEmit = EventBus.emit;
          EventBus.emit = function(name, payload) {
            if (['lifecycleInterruption', 'lifecycleResume', 'arcadeLifecyclePaused', 'gamePaused', 'gameResumed', 'gameStarted'].includes(name)) {
              const entry = {name, at:performance.now(), mode:GameState?.mode, hidden:document.hidden, focused:document.hasFocus(), payload};
              if (name === 'gamePaused') {
                entry.stack = (new Error()).stack;
                window.__wo003PauseTrace.push(entry);
              }
              window.__wo003LifecycleTrace.push(entry);
            }
            return originalEmit.call(this, name, payload);
          };
        }""")
        page.bring_to_front()
        page.locator("[data-arcade-preview-start]").click()
        page.wait_for_function(
            "() => { const f = document.querySelector('[data-arcade-preview-frame]'); return f && !f.hidden; }",
            timeout=10000,
        )
        try:
            wait_frame(frame, "() => typeof GameState !== 'undefined' && GameState.mode === 'playing'", timeout=20000)
        except Exception:
            diagnostic = {
                "requested": {"experience": experience, "character": character},
                "child": frame.evaluate("() => ({mode:GameState?.mode, experience:GameState?.currentMode, selected:GameState?.selectedCharacterId, actual:getCharDef?.()?.id, profile:globalThis.ToadalArcadePreview?.getActiveProfile?.(), focusTrace:window.__wo003FocusTrace, pauseTrace:window.__wo003PauseTrace})"),
                "host": page.evaluate("() => ({status:document.querySelector('[data-arcade-preview-status]')?.textContent, visibility:document.visibilityState, hostState:window.ToadalArcadePreviewHost?.state, sent:window.__wo003HostMessages?.slice(-12), received:window.__wo003Messages.slice(-12)})"),
            }
            print("START DIAGNOSTIC " + json.dumps(diagnostic, default=str), flush=True)
            raise
        wait_message(page, "game:started", started + 1, timeout=20000)
        frame.wait_for_timeout(250)
        coach = frame.locator("button").filter(has_text="Got it")
        if coach.count() and coach.first.is_visible():
            coach.first.click(timeout=5000)
        frame.locator("#gameCanvas").click(timeout=10000)
        try:
            wait_frame(frame, "() => GameState.mode === 'playing'", timeout=5000)
        except Exception:
            diagnostic = {
                "requested": {"experience": experience, "character": character},
                "child": frame.evaluate("() => ({mode:GameState?.mode, experience:GameState?.currentMode, selected:GameState?.selectedCharacterId, actual:getCharDef?.()?.id, profile:globalThis.ToadalArcadePreview?.getActiveProfile?.(), focusTrace:window.__wo003FocusTrace, pauseTrace:window.__wo003PauseTrace})"),
                "host": page.evaluate("() => ({status:document.querySelector('[data-arcade-preview-status]')?.textContent, visibility:document.visibilityState, hostState:window.ToadalArcadePreviewHost?.state, sent:window.__wo003HostMessages?.slice(-12), received:window.__wo003Messages.slice(-12)})"),
            }
            print("PLAY DIAGNOSTIC " + json.dumps(diagnostic, default=str), flush=True)
            raise

    def state(frame):
        return frame.evaluate("""() => ({
          mode: GameState.mode, experience: GameState.currentMode,
          score: Number(GameState.score || 0), level: Number(GameState.level || 1),
          character: String(getCharDef()?.id || GameState.selectedCharacterId || ''),
          x: Number(frog.x || 0), lives: Number(GameState.lives || 0),
          fmfTimeLeft: Number(GameState.fmfTimeLeft || 0)
        })""")

    def close_run(page, frame):
        current = frame.evaluate("GameState.mode")
        if current == "playing":
            page.locator("[data-arcade-preview-pause]").click()
            wait_frame(frame, "() => GameState.mode === 'paused'", timeout=10000)
        page.locator("[data-arcade-preview-exit]").click()
        page.wait_for_function("() => document.querySelector('[data-arcade-preview-frame]').hidden", timeout=10000)
        if current in ("playing", "paused"):
            wait_frame(frame, "() => GameState.mode === 'menu'", timeout=10000)
        frame.wait_for_timeout(750)

    def catch_bot(page, frame, duration, allow_direct=True):
        started = time.time()
        peak = 0
        hop_attempted = False
        while time.time() - started < duration and state(frame)["mode"] == "playing":
            snapshot = frame.evaluate("""() => ({
              x: Number(frog.x || 0),
              foods: (entities.foods || []).filter(f => f.itemId && !f.isHazard && !f.isBomb && !f.isPowerUp && !f.isHeart)
                .map(f => ({x:Number(f.x), y:Number(f.y), itemId:f.itemId}))
            })""")
            if snapshot["foods"]:
                target = max(snapshot["foods"], key=lambda food: food["y"])
                dx = target["x"] - snapshot["x"]
                if abs(dx) > 20:
                    key = "ArrowRight" if dx > 0 else "ArrowLeft"
                    page.keyboard.down(key)
                    page.wait_for_timeout(min(110, max(40, int(abs(dx) / 4))))
                    page.keyboard.up(key)
                # Let a low item hit the frog's body for real Golden Charge;
                # use the ordinary tongue input for items outside body range.
                if target["y"] < 665 or (not allow_direct and abs(dx) > 34):
                    page.keyboard.press("Space")
            else:
                page.keyboard.press("Space")
            # These are ordinary keyboard actions; the witness only counts the
            # resulting live gameplay state/counters, never emitted inputs.
            char_id = state(frame)["character"]
            if char_id == "toadal":
                mechanics = frame.evaluate("ArcadeToadalMechanics.snapshot()")
                if not hop_attempted and mechanics["grounded"] and state(frame)["lives"] > 0:
                    hop_attempted = True
                    page.keyboard.down("ArrowDown")
                    page.wait_for_timeout(950)
                    page.keyboard.up("ArrowDown")
                    page.wait_for_timeout(100)
                if mechanics["charge"] >= 100 and mechanics["blockCount"] == 0 and not mechanics["buildActive"]:
                    can_build = frame.evaluate("ArcadeToadalMechanics.placementCandidate().ok")
                    if can_build:
                        page.keyboard.press("KeyE")
                        page.wait_for_timeout(600)
                elif mechanics["charge"] >= 45 and not mechanics["throwActive"] and mechanics["diagnostics"]["throwChargeSpent"] == 0:
                    page.keyboard.press("KeyQ")
                    page.wait_for_timeout(500)
            page.wait_for_timeout(90)
            current = state(frame)
            peak = max(peak, current["score"])
        return {"elapsedMs": int((time.time() - started) * 1000), "peakScore": peak, "state": state(frame)}

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=not args.headed, executable_path=CHROME)
        report["browser"] = {"version": browser.version, "executable": CHROME, "headless": not args.headed}
        context = browser.new_context(viewport={"width": 1366, "height": 768})
        page = context.new_page()
        attach(page)
        page.goto(args.url, wait_until="load", timeout=60000)
        wait_message(page, "game:profile-ready", timeout=30000)
        frame = game_frame(page)
        frame_attrs = page.locator("[data-arcade-preview-frame]").evaluate("e => ({sandbox:e.getAttribute('sandbox'), allow:e.getAttribute('allow')})")
        check("opaque-origin-sandbox-policy", "allow-same-origin" not in (frame_attrs["sandbox"] or "") and "allow-scripts" in (frame_attrs["sandbox"] or ""), frame_attrs)
        check("child-opaque-origin", frame.evaluate("self.origin") == "null", frame.evaluate("self.origin"))
        check("host-storage-initialized", page.evaluate("key => localStorage.getItem(key) !== null", STATE_KEY), page.evaluate("Object.keys(localStorage).filter(k => k.startsWith('toadal:game:toadal-feast-arcade-preview:v1:'))"))

        start(page, frame, "standard", "toadal")
        initial = state(frame)
        check("standard-starts-as-toadal", initial["experience"] == "standard" and initial["character"] == "toadal", initial)

        # A full, bounded real Standard run. The browser inputs move toward live
        # food and use the game's real action bindings; no state is injected.
        run_started_at = time.time()
        run_start_score = state(frame)["score"]
        run_start_level = state(frame)["level"]
        run_start_lives = state(frame)["lives"]
        run_start_complete_count = message_count(page, "game:complete")
        diagnostics_start = frame.evaluate("ArcadeToadalMechanics.snapshot().diagnostics")
        active = catch_bot(page, frame, args.standard_active_seconds, allow_direct=True)
        # If still alive, release all controls and allow the canonical game
        # rules to end the run; do not set lives or call gameOver directly.
        for key in ("ArrowLeft", "ArrowRight", "Space", "ArrowDown", "KeyS"):
            try:
                page.keyboard.up(key)
            except Exception:
                pass
        deadline = time.time() + args.completion_wait_seconds
        while time.time() < deadline and state(frame)["mode"] == "playing":
            page.wait_for_timeout(250)
        final = state(frame)
        diagnostics_end = frame.evaluate("ArcadeToadalMechanics.snapshot().diagnostics")
        complete_count = message_count(page, "game:complete")
        elapsed_ms = int((time.time() - run_started_at) * 1000)
        completion_messages = page.evaluate("window.__wo003Messages.filter(m => m.type === 'game:complete')")
        report["gameplay"]["standardToadal"] = {
            "elapsedMs": elapsed_ms, "activePlayMs": active["elapsedMs"],
            "startScore": run_start_score, "peakScore": active["peakScore"],
            "score": final["score"], "startLevel": run_start_level,
            "level": final["level"], "startLives": run_start_lives,
            "lives": final["lives"], "finalMode": final["mode"],
            "completion": completion_messages[-1:] if completion_messages else [],
            "mechanicsBefore": diagnostics_start, "mechanicsAfter": diagnostics_end,
        }
        # The original continuation check treated any natural game-over as
        # meaningful. That would incorrectly pass the explicitly rejected
        # ~16-second/level-1 smoke. Require later-level progress or a natural
        # completion after at least one minute of real active play.
        meaningful_completion = (
            complete_count > run_start_complete_count
            and active["elapsedMs"] >= 60_000
        )
        meaningful = final["level"] > 1 or meaningful_completion
        report["screenshots"].append(str(output / "standard-toadal-start.png"))
        page.screenshot(path=str(output / "standard-toadal-start.png"), full_page=True)
        check("standard-meaningful-live-gameplay", active["peakScore"] > 0 and meaningful, report["gameplay"]["standardToadal"])
        report["gameplay"]["standardToadal"]["naturalCompletionQualification"] = {
            "minimumActivePlayMs": 60_000,
            "completedNaturally": complete_count > run_start_complete_count,
            "activePlayMs": active["elapsedMs"],
            "qualifies": meaningful_completion or final["level"] > 1,
        }
        check("standard-natural-completion-or-progression", meaningful, report["gameplay"]["standardToadal"]["naturalCompletionQualification"])
        check("toadal-direct-catch-witness", diagnostics_end["directFoodCatches"] > diagnostics_start["directFoodCatches"], {"before": diagnostics_start["directFoodCatches"], "after": diagnostics_end["directFoodCatches"]})
        check("toadal-charged-hop-witness", diagnostics_end["chargedHops"] > diagnostics_start["chargedHops"], {"before": diagnostics_start["chargedHops"], "after": diagnostics_end["chargedHops"]})
        check("toadal-golden-throw-witness", diagnostics_end["throwChargeSpent"] > diagnostics_start["throwChargeSpent"], {"before": diagnostics_start["throwChargeSpent"], "after": diagnostics_end["throwChargeSpent"]})
        check("toadal-golden-block-witness", diagnostics_end["blockChargeSpent"] > diagnostics_start["blockChargeSpent"], {"before": diagnostics_start["blockChargeSpent"], "after": diagnostics_end["blockChargeSpent"]})
        check("toadal-golden-throw-food-catch", diagnostics_end["throwFoodCatches"] > diagnostics_start["throwFoodCatches"], {"before": diagnostics_start["throwFoodCatches"], "after": diagnostics_end["throwFoodCatches"]})
        check("toadal-golden-block-food-catch", diagnostics_end["blockFoodCatches"] > diagnostics_start["blockFoodCatches"], {"before": diagnostics_start["blockFoodCatches"], "after": diagnostics_end["blockFoodCatches"]})

        if state(frame)["mode"] in ("playing", "paused"):
            close_run(page, frame)

        # The host persists only the sampler contract and reloads it under the
        # dedicated website-origin key. Child storage remains inaccessible.
        persisted_raw = page.evaluate("key => localStorage.getItem(key)", STATE_KEY)
        persisted = json.loads(persisted_raw) if persisted_raw else {}
        expected_fields = sorted(["bestScoreOverall", "bestScoreByCharacter", "completedStandardRuns", "unlockedCharacterIds", "selectedCharacterId", "selectedExperienceId", "previewSettings"])
        report["persistence"] = {"key": STATE_KEY, "fields": sorted(persisted.keys()), "state": persisted}
        check("host-owned-namespaced-persistence", sorted(persisted.keys()) == expected_fields and persisted.get("bestScoreOverall", 0) >= active["peakScore"], report["persistence"])
        check("opaque-child-storage-denied", frame.evaluate("() => { try { localStorage.getItem('toadal:game:toadal-feast-arcade-preview:v1:state'); return false; } catch (e) { return e.name === 'SecurityError'; } }"), {"origin": frame.evaluate("self.origin")})

        # Try the other three Standard choices from persisted sampler unlocks.
        # If a natural run did not unlock both, record a separate seeded fixture
        # later rather than pretending game progression did so.
        for character in ("classic", "pelican"):
            if character not in persisted.get("unlockedCharacterIds", []):
                continue
            if state(frame)["mode"] == "playing":
                close_run(page, frame)
            start(page, frame, "standard", character)
            actual = state(frame)
            check("standard-character-" + character, actual["experience"] == "standard" and actual["character"] == character, actual)
            char_diag = frame.evaluate("ArcadeToadalMechanics.snapshot().diagnostics")
            report["profiles"].append({"experience":"standard", "character":character, "runtime":actual, "diagnostics":char_diag})
            char_shot = output / ("standard-" + character + "-start.png")
            page.screenshot(path=str(char_shot), full_page=True)
            report["screenshots"].append(str(char_shot))
            close_run(page, frame)

        # FMF and Zen use the exact same isolated cartridge. Verify actual
        # forced character/mode, live scoring behavior and mode-specific config.
        for experience, character in (("fmf", "chomper"), ("zen", "princess")):
            start(page, frame, experience)
            before = state(frame)
            mode_config = frame.evaluate("""experience => ({
              mode: GameState.currentMode,
              character: getCharDef()?.id,
              fmfTimerSetupSource: String(GameModeRegistry.fmf?.onStart || ''),
              fmfTickSource: String(GameModeRegistry.fmf?.onTick || ''),
              fmfRemaining: Number(GameState.fmfTimeLeft || 0),
              zenSpeed: Number(GAME_BALANCE.zen?.foodSpeedMult),
              zenSpawnInterval: Number(GAME_BALANCE.zen?.spawnIntervalMult),
              princess: ASSET_REGISTRY.characters.princess && {
                spriteSheet: ASSET_REGISTRY.characters.princess.spriteSheet,
                firstFrame: Object.values(ASSET_REGISTRY.characters.princess.frames || {})[0]
              },
              activePack: ArcadeSpriteRuntime.getActiveAssetPackName()
            })""", experience)
            scored = catch_bot(page, frame, 15, allow_direct=False)
            after = state(frame)
            runtime_diagnostics = frame.evaluate("""() => ({
              focus: window.__wo003FocusTrace || [],
              lifecycle: window.__wo003LifecycleTrace || [],
              pauses: window.__wo003PauseTrace || [],
              sessionGuard: globalThis.ArcadeSessionGuard?.snapshot?.(),
              visibility: document.visibilityState,
              origin: self.origin
            })""")
            if experience == "fmf":
                timer_decreased = (
                    299 <= before["fmfTimeLeft"] <= 300
                    and after["fmfTimeLeft"] < before["fmfTimeLeft"]
                    and "fmfTimeLeft = 300" in mode_config["fmfTimerSetupSource"]
                    and "GameState.fmfTimeLeft -= dt" in mode_config["fmfTickSource"]
                )
            else:
                timer_decreased = True
            profile_ok = before["experience"] == experience and before["character"] == character
            report["profiles"].append({"experience":experience, "character":character, "start":before, "after":after, "config":mode_config, "controlledPlay":scored, "runtimeDiagnostics":runtime_diagnostics})
            check(experience + "-forced-mode-character", profile_ok, {"runtime":before, "config":mode_config})
            check(experience + "-real-score-and-pacing", after["score"] > 0 and timer_decreased and (experience != "zen" or (mode_config["zenSpeed"] == 0.58 and mode_config["zenSpawnInterval"] == 1.6)), {"runtime":after, "config":mode_config, "scoreRun":scored})
            shot = output / (experience + "-running.png")
            page.screenshot(path=str(shot), full_page=True)
            report["screenshots"].append(str(shot))
            close_run(page, frame)

        # Same browser profile/page context: reload and reopen a tab, then verify
        # the host state survives. The cartridge itself stays opaque throughout.
        expected_best = persisted.get("bestScoreOverall", 0)
        page.reload(wait_until="load", timeout=60000)
        wait_message(page, "game:profile-ready", timeout=30000)
        frame = game_frame(page)
        reopened = json.loads(page.evaluate("key => localStorage.getItem(key)", STATE_KEY))
        report["persistence"]["afterReload"] = reopened
        check("host-persistence-survives-reload", reopened.get("bestScoreOverall", 0) >= expected_best and frame.evaluate("self.origin") == "null", reopened)

        unique = sorted(set(item["url"] for item in report["network"]["requests"]))
        host = urlparse(args.url).netloc
        report["network"]["uniqueRequests"] = len(unique)
        report["network"]["externalRequests"] = [url for url in unique if urlparse(url).scheme in ("http", "https") and urlparse(url).netloc != host]
        report["network"]["badResponses"] = [item for item in report["network"]["responses"] if item["status"] >= 400]
        report["network"]["failedResourceCount"] = len(report["network"]["failures"])
        report["pass"] = (
            not report["failures"] and not report["network"]["externalRequests"]
            and not report["network"]["badResponses"] and not report["network"]["failures"]
            and not report["network"]["pageErrors"]
        )
        context.close()
        browser.close()

    report_path = output / "runtime-qualification.json"
    report["reportPath"] = str(report_path)
    report_path.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({
        "pass": report["pass"], "checks": len(report["checks"]), "failures": report["failures"],
        "gameplay": report["gameplay"], "profiles": report["profiles"],
        "network": {key: report["network"][key] for key in ("uniqueRequests", "externalRequests", "failedResourceCount", "badResponses", "pageErrors")},
        "reportPath": str(report_path),
    }, indent=2, sort_keys=True))
    return 0 if report["pass"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
