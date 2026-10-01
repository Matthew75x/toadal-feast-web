#!/usr/bin/env python
"""Real multi-touch mobile-input qualification for the isolated WO-003 Arcade.

The browser input is sent through Chrome DevTools Input.dispatchTouchEvent.
The evidence gates on runtime movement and a real tongue-state transition,
never on pointer/touch dispatch alone. This script is intentionally external
to the cartridge and is not included in package bytes.
"""

import argparse
import json
import sys
import time
from pathlib import Path


CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
DEFAULT_URL = "http://127.0.0.1:8899/cartridge/qualification-harness.html"
ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs" / "review" / "WO-003" / "arc-qual-01" / "mobile.json"


def add_check(report, name, passed, evidence=None):
    item = {"name": name, "pass": bool(passed)}
    if evidence is not None:
        item["evidence"] = evidence
    report["checks"].append(item)
    if not passed:
        report["failures"].append(name)
    print(("PASS " if passed else "FAIL ") + name, flush=True)


def touch_point(pointer_id, x, y):
    return {
        "id": int(pointer_id),
        "x": float(x),
        "y": float(y),
        "radiusX": 8,
        "radiusY": 8,
        "force": 1,
    }


def dispatch_touch(cdp, event_type, points):
    cdp.send("Input.dispatchTouchEvent", {
        "type": event_type,
        "touchPoints": points,
        "modifiers": 0,
    })


def wait_until(target, expression, timeout_ms=30000, arg=None):
    deadline = time.monotonic() + timeout_ms / 1000.0
    while time.monotonic() < deadline:
        if target.evaluate(expression, arg):
            return True
        target.wait_for_timeout(50)
    raise AssertionError("Timed out polling browser predicate: " + expression)


def wait_for_neutral(frame, timeout_ms=2500):
    wait_until(frame,
        """() => {
          const axis = InputManager.getVirtualAxis();
          return !FroggyMobileControls.isActive
            && Math.abs(Number(axis.x) || 0) < 0.01
            && Math.abs(Number(axis.y) || 0) < 0.01
            && !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].some(key => InputManager.isDown(key))
            && !document.getElementById('mobJoystick')?.classList.contains('is-active')
            && !document.getElementById('mobShoot')?.classList.contains('mob-btn-pressed');
        }""",
        timeout_ms,
    )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", default=DEFAULT_URL, help="URL of the running local qualification harness")
    args = parser.parse_args()

    report = {
        "schema": "toadal-feast.arc-qual-01-mobile.v1",
        "url": args.url,
        "browser": {"executable": CHROME, "touchInput": "CDP Input.dispatchTouchEvent"},
        "emulation": {"viewport": {"width": 430, "height": 900}, "isMobile": True, "hasTouch": True},
        "profile": {},
        "geometry": {},
        "checks": [],
        "failures": [],
        "gameplay": {"samples": [], "events": []},
        "pointerTrace": [],
        "error": None,
        "result": "BLOCKED",
    }
    browser = None
    context = None
    page = None
    cdp = None
    playwright_context = None
    live_touch_ids = []

    try:
        from playwright.sync_api import sync_playwright

        playwright_context = sync_playwright()
        playwright = playwright_context.__enter__()
        browser = playwright.chromium.launch(
            executable_path=CHROME,
            headless=False,
        )
        report["browser"]["version"] = browser.version
        context = browser.new_context(
            viewport={"width": 430, "height": 900},
            device_scale_factor=1,
            is_mobile=True,
            has_touch=True,
        )
        page = context.new_page()
        page.set_default_timeout(12000)
        page.goto(args.url, wait_until="load", timeout=60000)
        wait_until(page, "() => (window.__wo003Messages || []).some(message => message.type === 'game:ready')", 30000)
        page.locator("[data-arcade-preview-experience]").select_option("standard")
        page.locator("[data-arcade-preview-character]").select_option("toadal")

        frame_element = page.locator("iframe[data-arcade-preview-frame]")
        frame = next(item for item in page.frames if item.url.endswith("/arcade-standalone.html"))

        runtime_setup = frame.evaluate("""() => {
          const controls = typeof FroggyMobileControls !== 'undefined' ? FroggyMobileControls : null;
          if (!controls) return { available:false };
          const before = {
            mode: controls.mode,
            controlStyle: controls.controlStyle,
            visibilityMode: controls.visibilityMode,
            actionStyle: controls.actionStyle,
          };
          // WO-003 defaults to invisible controls. Use the public preference
          // API to reveal the same live joystick and action controls a player
          // may choose in Settings; input still travels through the runtime.
          controls.setVisibilityMode('full');
          controls.setVisualMode('visible');
          return {
            available:true,
            before,
            after:{ mode:controls.mode, controlStyle:controls.controlStyle,
              visibilityMode:controls.visibilityMode, actionStyle:controls.actionStyle },
          };
        }""")
        report["profile"]["mobileControlsSetup"] = runtime_setup
        add_check(report, "runtime-mobile-control-api-available", runtime_setup.get("available"), runtime_setup)

        page.bring_to_front()
        page.locator("[data-arcade-preview-start]").click()
        wait_until(page,
            "() => { const frame = document.querySelector('[data-arcade-preview-frame]'); return frame && !frame.hidden; }",
            15000,
        )
        wait_until(frame,
            "() => typeof GameState !== 'undefined' && GameState.mode === 'playing' && getCharDef()?.id === 'toadal'",
            25000,
        )
        wait_until(page, "() => (window.__wo003Messages || []).some(message => message.type === 'game:started')", 15000)
        coach = frame.locator(".arcade-first-run-coach__skip")
        if coach.count() and coach.first.is_visible():
            coach.first.click()
        wait_until(frame,
            """() => {
              const root = document.getElementById('mobileControls');
              const stick = document.getElementById('mobJoystick');
              const action = document.getElementById('mobShoot');
              return GameState.mode === 'playing' && root?.classList.contains('visible')
                && stick && !stick.hidden && action && !action.hidden
                && getComputedStyle(stick).display !== 'none'
                && getComputedStyle(action).display !== 'none';
            }""",
            12000,
        )
        profile = frame.evaluate("""() => ({
          mode:GameState.mode,
          experience:String(GameState.currentMode || ''),
          character:String(getCharDef()?.id || ''),
          touchPoints:Number(navigator.maxTouchPoints || 0),
          coarsePointer:matchMedia('(pointer: coarse)').matches,
          mobileViewport:{width:innerWidth,height:innerHeight},
          visibilityMode:FroggyMobileControls.visibilityMode,
          controlStyle:FroggyMobileControls.controlStyle,
        })""")
        report["profile"].update(profile)
        add_check(
            report,
            "standard-toadal-playing-with-touch-controls",
            profile["mode"] == "playing" and profile["experience"] == "standard"
            and profile["character"] == "toadal" and profile["touchPoints"] > 0
            and profile["coarsePointer"] and profile["visibilityMode"] == "full",
            profile,
        )

        frame.evaluate("""() => {
          const state = () => {
            const axis = InputManager.getVirtualAxis();
            return {
              mode:String(GameState.mode),
              character:String(getCharDef()?.id || ''),
              frog:{x:Number(frog.x || 0),y:Number(frog.y || 0)},
              axis:{x:Number(axis.x || 0),y:Number(axis.y || 0)},
              keys:{left:InputManager.isDown('ArrowLeft'),right:InputManager.isDown('ArrowRight'),
                up:InputManager.isDown('ArrowUp'),down:InputManager.isDown('ArrowDown')},
              tongue:{active:Boolean(tongue.active),phase:String(tongue.phase || ''),shotId:Number(tongue.shotId || 0)},
              joystickActive:Boolean(FroggyMobileControls.isActive),
              joystickClass:document.getElementById('mobJoystick')?.classList.contains('is-active') || false,
              actionPressed:document.getElementById('mobShoot')?.classList.contains('mob-btn-pressed') || false,
            };
          };
          window.__arcQualState = state;
          window.__arcQualPointerTrace = [];
          window.__arcQualGameplayTrace = [];
          window.__arcQualActivePointerIds = new Set();
          window.__arcQualStartAt = performance.now();
          const controlTarget = target => {
            if (!(target instanceof Element)) return '';
            const node = target.closest('#mobJoystick,#mobShoot,#mobActionSecondary,#mobActionTertiary,#mobHop');
            return node ? node.id : '';
          };
          ['pointerdown','pointermove','pointerup','pointercancel','lostpointercapture'].forEach(type => {
            document.addEventListener(type, event => {
              const targetId = controlTarget(event.target);
              if (!targetId || event.pointerType !== 'touch') return;
              if (type === 'pointerdown') window.__arcQualActivePointerIds.add(event.pointerId);
              const current = state();
              window.__arcQualPointerTrace.push({
                atMs:Math.round(performance.now() - window.__arcQualStartAt),
                type,targetId,pointerId:Number(event.pointerId),pointerType:event.pointerType,
                activePointerIds:[...window.__arcQualActivePointerIds].map(Number).sort((a,b)=>a-b),
                activePointerCount:window.__arcQualActivePointerIds.size,
                state:current,
              });
              if (type === 'pointerup' || type === 'pointercancel' || type === 'lostpointercapture') {
                window.__arcQualActivePointerIds.delete(event.pointerId);
              }
            }, true);
          });
          ['shootPressed','spaceDown','spaceUp','foodCaught'].forEach(name => {
            EventBus.on(name, payload => window.__arcQualGameplayTrace.push({
              atMs:Math.round(performance.now() - window.__arcQualStartAt),
              name,
              payload:payload && typeof payload === 'object'
                ? {catchSource:payload.catchSource || null,score:Number(payload.score || 0)} : null,
              activePointerCount:window.__arcQualActivePointerIds.size,
              state:state(),
            }));
          });
        }""")

        metrics = frame.evaluate("""() => {
          const viewport = {width:innerWidth,height:innerHeight};
          const rect = selector => {
            const node = document.querySelector(selector);
            if (!node) return null;
            const r = node.getBoundingClientRect();
            return {x:r.x,y:r.y,width:r.width,height:r.height,hidden:Boolean(node.hidden)};
          };
          return {
            viewport,
            joystick:rect('#mobJoystick'),
            action:rect('#mobShoot'),
            actionCenterHit:(() => {
              const r=document.querySelector('#mobShoot').getBoundingClientRect();
              const top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
              return top?.closest?.('#mobShoot')?.id || top?.id || '';
            })(),
          };
        }""")
        report["geometry"]["child"] = metrics
        frame_element.scroll_into_view_if_needed(timeout=10000)
        page.wait_for_timeout(120)
        iframe_box = frame_element.bounding_box()
        if not iframe_box:
            raise RuntimeError("The active Arcade iframe has no browser bounding box")
        scale_x = iframe_box["width"] / float(metrics["viewport"]["width"])
        scale_y = iframe_box["height"] / float(metrics["viewport"]["height"])

        def to_host_viewport(child_x, child_y):
            return (
                round(iframe_box["x"] + child_x * scale_x, 2),
                round(iframe_box["y"] + child_y * scale_y, 2),
            )

        joystick_x = metrics["viewport"]["width"] * 0.19
        joystick_y = metrics["viewport"]["height"] * 0.72
        hit = frame.evaluate("""([x,y]) => {
          const target=document.elementFromPoint(x,y);
          return target?.closest?.('#mobJoystick')?.id || target?.id || '';
        }""", [joystick_x, joystick_y])
        if hit != "mobJoystick":
            candidates = [
                (0.16, 0.62), (0.20, 0.55), (0.28, 0.70), (0.12, 0.78),
                (0.34, 0.58), (0.40, 0.70),
            ]
            for x_ratio, y_ratio in candidates:
                candidate_x = metrics["viewport"]["width"] * x_ratio
                candidate_y = metrics["viewport"]["height"] * y_ratio
                candidate_hit = frame.evaluate("""([x,y]) => {
                  const target=document.elementFromPoint(x,y);
                  return target?.closest?.('#mobJoystick')?.id || target?.id || '';
                }""", [candidate_x, candidate_y])
                if candidate_hit == "mobJoystick":
                    joystick_x, joystick_y, hit = candidate_x, candidate_y, candidate_hit
                    break
        if hit != "mobJoystick":
            raise RuntimeError("Could not find a touch point whose hit target is the live joystick: " + str(hit))

        action_rect = metrics["action"]
        if not action_rect or action_rect["hidden"] or metrics["actionCenterHit"] != "mobShoot":
            raise RuntimeError("Primary action control is not visible/hit-testable: " + json.dumps(metrics))
        action_x = action_rect["x"] + action_rect["width"] / 2
        action_y = action_rect["y"] + action_rect["height"] / 2
        joystick_screen = to_host_viewport(joystick_x, joystick_y)
        action_screen = to_host_viewport(action_x, action_y)
        report["geometry"]["selected"] = {
            "joystickChildCss": {"x":round(joystick_x, 2),"y":round(joystick_y, 2),"hitTarget":hit},
            "actionChildCss": {"x":round(action_x, 2),"y":round(action_y, 2),"hitTarget":metrics["actionCenterHit"]},
            "joystickHostCss": {"x":joystick_screen[0],"y":joystick_screen[1]},
            "actionHostCss": {"x":action_screen[0],"y":action_screen[1]},
            "iframeHostCss": iframe_box,
        }

        cdp = context.new_cdp_session(page)
        before = frame.evaluate("() => window.__arcQualState()")
        report["gameplay"]["before"] = before
        touch_id_move = 11
        touch_id_action = 22
        start_point = touch_point(touch_id_move, *joystick_screen)
        dispatch_touch(cdp, "touchStart", [start_point])
        live_touch_ids = [touch_id_move]
        frame.wait_for_timeout(100)
        joystick_pointerdown = frame.evaluate("""() => (window.__arcQualPointerTrace || []).find(
          item => item.type === 'pointerdown' && item.targetId === 'mobJoystick') || null""")
        add_check(report, "real-touch-joystick-pointerdown", joystick_pointerdown is not None, joystick_pointerdown)

        direction = -1 if before["frog"]["x"] > float(frame.evaluate("CONFIG.CANVAS_W")) * 0.72 else 1
        move_offsets = [14, 28, 42, 54, 60]
        movement_samples = []
        move_point = start_point
        for offset in move_offsets:
            move_point = touch_point(touch_id_move, joystick_screen[0] + direction * offset, joystick_screen[1])
            dispatch_touch(cdp, "touchMove", [move_point])
            frame.wait_for_timeout(95)
            movement_samples.append(frame.evaluate("() => window.__arcQualState()"))
        frame.wait_for_timeout(260)
        movement_samples.append(frame.evaluate("() => window.__arcQualState()"))
        report["gameplay"]["samples"].extend(movement_samples)
        joystick_moves = frame.evaluate("""() => (window.__arcQualPointerTrace || []).filter(
          item => item.type === 'pointermove' && item.targetId === 'mobJoystick')""")
        movement_after = movement_samples[-1]
        movement_delta = round(movement_after["frog"]["x"] - before["frog"]["x"], 3)
        add_check(report, "joystick-delivered-multiple-real-pointermoves", len(joystick_moves) >= 5, {
            "observedMoveEvents":len(joystick_moves),
            "pointerId":joystick_pointerdown.get("pointerId") if joystick_pointerdown else None,
            "sampleCount":len(movement_samples),
        })
        movement_active = bool(movement_after["joystickActive"] and abs(movement_after["axis"]["x"]) > 0.15)
        actual_movement = abs(movement_delta) >= 6
        add_check(report, "real-gameplay-movement-while-joystick-held", movement_active and actual_movement, {
            "before":before,
            "after":movement_after,
            "frogXDelta":movement_delta,
            "movementAxisWasActive":movement_active,
        })

        action_baseline = frame.evaluate("() => window.__arcQualState()")
        action_point = touch_point(touch_id_action, *action_screen)
        dispatch_touch(cdp, "touchStart", [move_point, action_point])
        live_touch_ids = [touch_id_move, touch_id_action]
        deadline = time.monotonic() + 2.0
        action_state = action_baseline
        while time.monotonic() < deadline:
            frame.wait_for_timeout(40)
            action_state = frame.evaluate("() => window.__arcQualState()")
            if action_state["tongue"]["shotId"] > action_baseline["tongue"]["shotId"]:
                break
        pointer_trace = frame.evaluate("() => window.__arcQualPointerTrace || []")
        action_down = next((item for item in pointer_trace
                            if item["type"] == "pointerdown" and item["targetId"] == "mobShoot"), None)
        shoot_events = frame.evaluate("""() => (window.__arcQualGameplayTrace || []).filter(
          item => item.name === 'shootPressed')""")
        report["gameplay"]["actionBaseline"] = action_baseline
        report["gameplay"]["actionAfter"] = action_state
        report["gameplay"]["events"].extend(shoot_events)
        concurrent_action = bool(
            action_down and action_down["activePointerCount"] >= 2
            and abs(action_down["state"]["axis"]["x"]) > 0.15
            and action_down["state"]["joystickActive"]
            and joystick_pointerdown
            and action_down["pointerId"] != joystick_pointerdown["pointerId"]
            and joystick_pointerdown["pointerId"] in action_down["activePointerIds"]
            and action_down["pointerId"] in action_down["activePointerIds"]
        )
        add_check(report, "second-touch-action-while-movement-pointer-remains-active", concurrent_action, {
            "actionPointerDown":action_down,
            "movementPointerId":joystick_pointerdown.get("pointerId") if joystick_pointerdown else None,
        })
        action_runtime_event = next((item for item in shoot_events
                                     if item["activePointerCount"] >= 2
                                     and item["state"]["joystickActive"]
                                     and abs(item["state"]["axis"]["x"]) > 0.15
                                     and item["state"]["tongue"]["shotId"] > action_baseline["tongue"]["shotId"]), None)
        actual_action = bool(
            action_state["tongue"]["shotId"] > action_baseline["tongue"]["shotId"]
            and action_runtime_event
        )
        add_check(report, "real-gameplay-action-state-changed", actual_action, {
            "before":action_baseline["tongue"],
            "after":action_state["tongue"],
            "shootPressedEvents":len(shoot_events),
            "overlappingRuntimeEvent":action_runtime_event,
            "observedRuntimeStateTransition":actual_action,
        })

        # End only pointer 22. Chrome's CDP touchEnd takes the changed (lifted)
        # touch point; the still-active movement pointer remains in the browser.
        dispatch_touch(cdp, "touchEnd", [action_point])
        live_touch_ids = [touch_id_move]
        frame.wait_for_timeout(160)
        after_action_up = frame.evaluate("() => window.__arcQualState()")
        pointer_trace = frame.evaluate("() => window.__arcQualPointerTrace || []")
        action_up = next((item for item in pointer_trace
                          if item["type"] == "pointerup" and item["targetId"] == "mobShoot"), None)
        add_check(report, "action-pointerup-preserves-active-movement-pointer", bool(
            action_up and after_action_up["joystickActive"]
            and abs(after_action_up["axis"]["x"]) > 0.15
            and action_down and action_up["pointerId"] == action_down["pointerId"]
            and joystick_pointerdown and joystick_pointerdown["pointerId"] != action_up["pointerId"]
        ), {"actionPointerUp":action_up,"stateAfterActionUp":after_action_up})

        dispatch_touch(cdp, "touchEnd", [])
        live_touch_ids = []
        frame.wait_for_timeout(180)
        wait_for_neutral(frame)
        neutral_after_up = frame.evaluate("() => window.__arcQualState()")
        pointer_trace = frame.evaluate("() => window.__arcQualPointerTrace || []")
        movement_up = next((item for item in pointer_trace
                            if item["type"] == "pointerup" and item["targetId"] == "mobJoystick"), None)
        add_check(report, "movement-pointerup-observed", movement_up is not None, movement_up)
        movement_pointerup_matches_down = bool(
            joystick_pointerdown and movement_up
            and movement_up["pointerId"] == joystick_pointerdown["pointerId"]
            and movement_up["pointerId"] != (action_down or {}).get("pointerId")
        )
        add_check(report, "movement-pointerup-matches-original-joystick-pointer", movement_pointerup_matches_down, {
            "joystickPointerDown":joystick_pointerdown,"movementPointerUp":movement_up,
            "actionPointerDown":action_down,
        })
        neutral_up_ok = (
            not neutral_after_up["joystickActive"]
            and abs(neutral_after_up["axis"]["x"]) < 0.01
            and abs(neutral_after_up["axis"]["y"]) < 0.01
            and not any(neutral_after_up["keys"].values())
            and not neutral_after_up["joystickClass"]
            and not neutral_after_up["actionPressed"]
        )
        add_check(report, "all-controls-neutral-after-pointerup", neutral_up_ok, neutral_after_up)

        # A fresh touch is cancelled at the browser input layer. This exercises
        # the runtime's interruption cleanup and pointer-capture release path.
        cancel_start = touch_point(33, *joystick_screen)
        dispatch_touch(cdp, "touchStart", [cancel_start])
        live_touch_ids = [33]
        frame.wait_for_timeout(80)
        cancel_move = touch_point(33, joystick_screen[0] + direction * 46, joystick_screen[1])
        dispatch_touch(cdp, "touchMove", [cancel_move])
        frame.wait_for_timeout(120)
        cancel_active = frame.evaluate("() => window.__arcQualState()")
        cancel_pointerdown = frame.evaluate("""() => (window.__arcQualPointerTrace || []).find(
          item => item.type === 'pointerdown' && item.targetId === 'mobJoystick') || null""")
        dispatch_touch(cdp, "touchCancel", [])
        live_touch_ids = []
        frame.wait_for_timeout(180)
        wait_for_neutral(frame)
        neutral_after_cancel = frame.evaluate("() => window.__arcQualState()")
        pointer_trace = frame.evaluate("() => window.__arcQualPointerTrace || []")
        cancel_events = [item for item in pointer_trace
                         if item["type"] in ("pointercancel", "lostpointercapture")
                         and item["targetId"] == "mobJoystick"
                         and cancel_pointerdown
                         and item["pointerId"] == cancel_pointerdown["pointerId"]]
        cancel_neutral_ok = (
            not neutral_after_cancel["joystickActive"]
            and abs(neutral_after_cancel["axis"]["x"]) < 0.01
            and abs(neutral_after_cancel["axis"]["y"]) < 0.01
            and not any(neutral_after_cancel["keys"].values())
            and not neutral_after_cancel["joystickClass"]
            and not neutral_after_cancel["actionPressed"]
        )
        add_check(report, "browser-touchcancel-reaches-pointercancel-or-lost-capture", bool(cancel_active["joystickActive"] and cancel_events), {
            "activeBeforeCancel":cancel_active,
            "cancelEvents":cancel_events,
        })
        add_check(report, "all-controls-neutral-after-touchcancel", cancel_neutral_ok, neutral_after_cancel)

        report["pointerTrace"] = pointer_trace
        report["gameplay"]["neutralAfterPointerUp"] = neutral_after_up
        report["gameplay"]["neutralAfterTouchCancel"] = neutral_after_cancel
        report["result"] = "PASS" if not report["failures"] else "BLOCKED"

    except Exception as error:
        report["error"] = {
            "type":type(error).__name__,
            "message":str(error),
        }
        if not any(item["name"] == "qualification-execution-completed" for item in report["checks"]):
            add_check(report, "qualification-execution-completed", False, report["error"])
        report["result"] = "BLOCKED"
        print("BLOCKED " + type(error).__name__ + ": " + str(error), file=sys.stderr, flush=True)
    finally:
        if cdp is not None and live_touch_ids:
            try:
                dispatch_touch(cdp, "touchCancel", [])
            except Exception:
                pass
        if browser is not None:
            try:
                browser.close()
            except Exception:
                pass
        if playwright_context is not None:
            try:
                playwright_context.__exit__(None, None, None)
            except Exception:
                pass
        OUTPUT.parent.mkdir(parents=True, exist_ok=True)
        OUTPUT.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
        print("Evidence: " + str(OUTPUT), flush=True)

    return 0 if report["result"] == "PASS" else 1


if __name__ == "__main__":
    sys.exit(main())
