#!/usr/bin/env python3
"""ARC-QUAL-01 security protocol checks for the isolated Arcade preview host.

Compatible with Python 3.7 and Playwright's synchronous Python API. The script
does not start a web server; the caller must serve qualification-harness.html.
It launches the explicitly pinned Chrome executable and writes stable JSON
evidence (without timestamps or session secrets) to the WO-003 evidence folder.

This checks message isolation and protocol validation. It does not claim to
protect against arbitrary script execution inside the trusted cartridge.
"""

from __future__ import print_function

import argparse
import json
import os
import sys
import traceback
from urllib.parse import urlsplit


CHROME_EXE = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
DEFAULT_URL = "http://127.0.0.1:8899/cartridge/qualification-harness.html"
EVIDENCE_RELATIVE_PATH = os.path.join(
    "docs", "review", "WO-003", "arc-qual-01", "security.json"
)
PROTOCOL = "toadal.game.v1"
GAME_ID = "toadal-feast-arcade-preview"


def _repo_root():
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _write_evidence(evidence):
    output_path = os.path.join(_repo_root(), EVIDENCE_RELATIVE_PATH)
    output_dir = os.path.dirname(output_path)
    if not os.path.isdir(output_dir):
        os.makedirs(output_dir)
    rendered = json.dumps(evidence, indent=2, sort_keys=True, ensure_ascii=False) + "\n"
    temporary_path = output_path + ".tmp"
    with open(temporary_path, "w", encoding="utf-8", newline="\n") as handle:
        handle.write(rendered)
    os.replace(temporary_path, output_path)
    sys.stdout.write(rendered)
    return output_path


def _envelope(message_type, payload, session_id=None, protocol=PROTOCOL,
              game_id=GAME_ID, include_session=True):
    message = {
        "protocol": protocol,
        "gameId": game_id,
        "type": message_type,
        "payload": payload,
    }
    if include_session:
        message["sessionId"] = session_id
    return message


def _cartridge_frame(page):
    for frame in page.frames:
        if frame.parent_frame == page.main_frame:
            return frame
    raise RuntimeError("cartridge iframe was not found")


def _audit_count(page):
    return page.evaluate(
        "() => Array.isArray(window.__wo003HostMessageAudit) "
        "? window.__wo003HostMessageAudit.length : -1"
    )


def _wait_for_audit(page, start_count, message_type, source):
    page.wait_for_function(
        "arg => { const audit = window.__wo003HostMessageAudit; "
        "return Array.isArray(audit) && audit.length > arg.count && "
        "audit.slice(arg.count).some(item => item.type === arg.type && item.source === arg.source); }",
        arg={"count": start_count, "type": message_type, "source": source},
        timeout=8000,
    )
    return page.evaluate(
        "arg => { const audit = window.__wo003HostMessageAudit || []; "
        "for (let index = audit.length - 1; index >= arg.count; index -= 1) { "
        "const item = audit[index]; "
        "if (item.type === arg.type && item.source === arg.source) "
        "return { type: item.type, decision: item.decision, reason: item.reason, "
        "source: item.source, origin: item.origin }; } return null; }",
        {"count": start_count, "type": message_type, "source": source},
    )


SNAPSHOT_JS = r"""() => {
  const frame = document.querySelector('[data-arcade-preview-frame]');
  const status = document.querySelector('[data-arcade-preview-status]');
  const result = document.querySelector('[data-arcade-preview-result]');
  const experience = document.querySelector('[data-arcade-preview-experience]');
  const character = document.querySelector('[data-arcade-preview-character]');
  const start = document.querySelector('[data-arcade-preview-start]');
  const host = window.ToadalArcadePreviewHost;
  let stored = null;
  try { stored = host ? localStorage.getItem(host.storageKey) : null; } catch (_) {}
  const state = host && host.state ? JSON.parse(JSON.stringify(host.state)) : null;
  const sent = (window.__wo003HostMessages || []).map(item => ({
    type: item.type,
    payload: item.payload,
  }));
  return {
    iframeConnected: Boolean(frame && frame.isConnected),
    iframeHidden: Boolean(frame && frame.hidden),
    iframeSource: frame ? frame.getAttribute('src') : null,
    statusText: status ? status.textContent : null,
    resultHidden: result ? result.hidden : null,
    resultText: result ? result.textContent : null,
    experienceValue: experience ? experience.value : null,
    experienceDisabled: experience ? experience.disabled : null,
    characterValue: character ? character.value : null,
    characterDisabled: character ? character.disabled : null,
    startDisabled: start ? start.disabled : null,
    hostState: state,
    hostStorage: stored,
    hostSentMessages: sent,
    fullscreenActive: Boolean(document.fullscreenElement),
    fullscreenRequestCount: Number(window.__wo003FullscreenRequestCount || 0),
  };
}"""


def _snapshot(page):
    return page.evaluate(SNAPSHOT_JS)


def _changed_fields(before, after):
    keys = sorted(set(before.keys()) | set(after.keys()))
    return [key for key in keys if before.get(key) != after.get(key)]


def _case_result(case_id, description, expected, actual, before, after):
    changed = _changed_fields(before, after)
    matches = actual is not None and all(
        actual.get(key) == value for key, value in expected.items()
    )
    no_side_effects = not changed
    return {
        "id": case_id,
        "description": description,
        "expected": expected,
        "actual": actual,
        "no_side_effects": no_side_effects,
        "changed_fields": changed,
        "status": "PASS" if matches and no_side_effects else "FAIL",
    }


def _run_message_case(page, case_id, description, sender, message,
                      message_type, expected_reason):
    before = _snapshot(page)
    count = _audit_count(page)
    if sender == "sibling":
        page.evaluate(
            "async message => { await window.__wo003SiblingPost(message); }",
            message,
        )
        audit_source = "other"
    else:
        _cartridge_frame(page).evaluate(
            "message => window.parent.postMessage(message, '*')", message
        )
        audit_source = "cartridge"
    actual = _wait_for_audit(page, count, message_type, audit_source)
    after = _snapshot(page)
    return _case_result(
        case_id,
        description,
        {
            "decision": "rejected",
            "reason": expected_reason,
            "source": audit_source,
            "origin": "null",
        },
        actual,
        before,
        after,
    )


def _wait_for_initial_session(page):
    page.wait_for_function(
        "() => { const frame = document.querySelector('[data-arcade-preview-frame]'); "
        "const session = window.__wo003Session && window.__wo003Session(); "
        "return Boolean(frame && session && window.__wo003HostMessageAudit); }",
        timeout=45000,
    )
    page.wait_for_function(
        "() => { const session = window.__wo003Session(); "
        "return Boolean(session && (window.__wo003Messages || []).some(message => "
        "message.type === 'game:ready' && message.sessionId === session)); }",
        timeout=60000,
    )


def _wait_for_remount(page, previous_session):
    page.wait_for_function(
        "previous => { const session = window.__wo003Session(); "
        "return Boolean(session && session !== previous && "
        "(window.__wo003Messages || []).some(message => "
        "message.type === 'game:ready' && message.sessionId === session)); }",
        arg=previous_session,
        timeout=60000,
    )
    return page.evaluate("() => window.__wo003Session()")


def _run_qualification(url):
    evidence = {
        "format": "arc-qual-01-security-v1",
        "evidence_file": EVIDENCE_RELATIVE_PATH.replace(os.sep, "/"),
        "target_url": url,
        "browser_executable": CHROME_EXE,
        "scope_note": "Message isolation/protocol validation only; not protection against arbitrary script execution inside the trusted cartridge.",
        "cases": [],
        "status": "BLOCKED",
    }

    if sys.version_info < (3, 7):
        evidence["blocked_stage"] = "python-version"
        evidence["exception_type"] = "PythonVersionUnsupported"
        return evidence
    if not os.path.isfile(CHROME_EXE):
        evidence["blocked_stage"] = "chrome-executable"
        evidence["exception_type"] = "ChromeExecutableNotFound"
        return evidence

    try:
        from playwright.sync_api import sync_playwright
    except Exception as error:
        evidence["blocked_stage"] = "playwright-import"
        evidence["exception_type"] = error.__class__.__name__
        return evidence

    target = urlsplit(url)
    target_origin = "{}://{}".format(target.scheme, target.netloc)
    fatal_stage = None
    browser = None
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(
                executable_path=CHROME_EXE,
                headless=True,
                args=["--no-first-run", "--no-default-browser-check"],
            )
            context = browser.new_context(
                viewport={"width": 1280, "height": 900},
                service_workers="block",
            )

            def block_external(route):
                request_url = urlsplit(route.request.url)
                if request_url.scheme in ("http", "https"):
                    request_origin = "{}://{}".format(request_url.scheme, request_url.netloc)
                    if request_origin != target_origin:
                        route.abort()
                        return
                route.continue_()

            page = context.new_page()
            page.route("**/*", block_external)
            fatal_stage = "navigate"
            page.goto(url, wait_until="domcontentloaded", timeout=45000)
            fatal_stage = "host-ready"
            _wait_for_initial_session(page)
            page.evaluate(
                """() => {
                  window.__wo003FullscreenRequestCount = 0;
                  Object.defineProperty(Element.prototype, 'requestFullscreen', {
                    configurable: true,
                    writable: true,
                    value: function () {
                      window.__wo003FullscreenRequestCount += 1;
                      return Promise.resolve();
                    },
                  });
                }"""
            )

            # Start a real host-owned run first. This makes spoofed exit, score,
            # completion, and fullscreen messages observable against live state.
            page.locator("[data-arcade-preview-experience]").select_option("standard")
            page.locator("[data-arcade-preview-character]").select_option("toadal")
            page.locator("[data-arcade-preview-start]").click()
            page.wait_for_function(
                "() => { const frame=document.querySelector('[data-arcade-preview-frame]'); "
                "return frame && !frame.hidden && (window.__wo003Messages||[]).some(message => "
                "message.type === 'game:started' && message.sessionId === window.__wo003Session()); }",
                timeout=30000,
            )
            live_start = _cartridge_frame(page).evaluate(
                "() => ({mode:GameState?.mode, experience:GameState?.currentMode, character:getCharDef?.()?.id})"
            )
            status_after_start = page.locator("[data-arcade-preview-status]").text_content()
            initial_start_audit = page.evaluate(
                """() => [...(window.__wo003HostMessageAudit||[])].reverse().find(item =>
                  item.type === 'game:started' && item.source === 'cartridge') || null"""
            )
            evidence["legitimate_start_accepted"] = bool(
                initial_start_audit and initial_start_audit.get("decision") == "accepted"
                and live_start == {"mode":"playing","experience":"standard","character":"toadal"}
                and status_after_start == "standard is playing as toadal."
            )
            evidence["live_run"] = {"state":live_start,"host_status":status_after_start}
            if not evidence["legitimate_start_accepted"]:
                raise RuntimeError("The host did not establish the expected live Standard/Toadal run: {}".format(
                    json.dumps(evidence["live_run"], sort_keys=True)
                ))
            page.locator("[data-arcade-preview-pause]").click()
            page.wait_for_function(
                "() => document.querySelector('[data-arcade-preview-status]')?.textContent === 'Game paused.'",
                timeout=10000,
            )

            session = page.evaluate("() => window.__wo003Session()")
            score_payload = {
                "score": 999999,
                "level": 9,
                "mode": "standard",
                "characterId": "toadal",
                "elapsedMs": 12345,
            }
            complete_payload = {
                "score": 999999,
                "level": 9,
                "mode": "standard",
                "characterId": "toadal",
                "elapsedMs": 12345,
                "voluntaryQuit": False,
                "bankedEarly": False,
                "badge": "forged qualification result",
                "endCause": "attacker",
                "reason": "spoofed completion",
            }

            sibling_cases = [
                ("sibling_preview_state", "valid-looking preview-state from sibling", "game:preview-state", {"state": {"score": 999999}}, "source"),
                ("sibling_request_exit", "valid exit request from sibling", "game:request-exit", {"reason": "user-exit"}, "source"),
                ("sibling_request_fullscreen", "valid fullscreen request from sibling", "game:request-fullscreen", {}, "source"),
                ("sibling_score", "valid-looking score from sibling", "game:score", score_payload, "source"),
                ("sibling_result", "valid-looking completion result from sibling", "game:complete", complete_payload, "source"),
            ]
            fatal_stage = "sibling-attacks"
            for case_id, description, message_type, payload, reason in sibling_cases:
                message = _envelope(message_type, payload, session)
                try:
                    evidence["cases"].append(
                        _run_message_case(
                            page, case_id, description, "sibling", message,
                            message_type, reason,
                        )
                    )
                except Exception as error:
                    evidence["cases"].append({
                        "id": case_id,
                        "description": description,
                        "status": "BLOCKED",
                        "exception_type": error.__class__.__name__,
                        "exception": str(error),
                        "traceback": traceback.format_exc(),
                    })

            fatal_stage = "iframe-remount"
            previous_session = page.evaluate("() => window.__wo003Session()")
            page.locator("iframe[data-arcade-preview-frame]").evaluate(
                "frame => { frame.src = frame.src.split('?')[0] + '?arcQualRemount=' + Date.now(); }"
            )
            current_session = _wait_for_remount(page, previous_session)
            evidence["remount"] = {
                "session_changed": current_session != previous_session,
                "stale_session_rejected": None,
            }
            current_session = page.evaluate("() => window.__wo003Session()")

            source_cases = [
                (
                    "legitimate_missing_session",
                    "legitimate cartridge source with missing session id",
                    _envelope("game:paused", {"mode": "standard"}, include_session=False),
                    "game:paused",
                    "session",
                ),
                (
                    "legitimate_wrong_session",
                    "legitimate cartridge source with wrong session id",
                    _envelope("game:paused", {"mode": "standard"}, "wrong-session-id"),
                    "game:paused",
                    "session",
                ),
                (
                    "legitimate_stale_session_after_remount",
                    "legitimate source replaying pre-remount session id",
                    _envelope("game:paused", {"mode": "standard"}, previous_session),
                    "game:paused",
                    "session",
                ),
                (
                    "legitimate_wrong_protocol",
                    "legitimate cartridge source using wrong protocol",
                    _envelope("game:paused", {"mode": "standard"}, current_session, protocol="toadal.game.v0"),
                    "game:paused",
                    "envelope",
                ),
                (
                    "legitimate_wrong_game_id",
                    "legitimate cartridge source using wrong cartridge id",
                    _envelope("game:paused", {"mode": "standard"}, current_session, game_id="attacker-cartridge"),
                    "game:paused",
                    "envelope",
                ),
                (
                    "legitimate_malformed_payload",
                    "legitimate cartridge source with malformed score payload",
                    _envelope("game:score", [], current_session),
                    "game:score",
                    "schema",
                ),
            ]
            fatal_stage = "legitimate-source-negative-cases"
            for case_id, description, message, message_type, reason in source_cases:
                try:
                    result = _run_message_case(
                        page, case_id, description, "cartridge", message,
                        message_type, reason,
                    )
                    evidence["cases"].append(result)
                    if case_id == "legitimate_stale_session_after_remount":
                        evidence["remount"]["stale_session_rejected"] = result["status"] == "PASS"
                except Exception as error:
                    evidence["cases"].append({
                        "id": case_id,
                        "description": description,
                        "status": "BLOCKED",
                        "exception_type": error.__class__.__name__,
                        "exception": str(error),
                        "traceback": traceback.format_exc(),
                    })

            fatal_stage = "legitimate-positive-control"
            ready_payload = page.evaluate(
                """session => {
                  const ready = (window.__wo003Messages||[]).find(message =>
                    message.type === 'game:ready' && message.sessionId === session);
                  return ready ? ready.payload : null;
                }""",
                current_session,
            )
            if not ready_payload:
                raise RuntimeError("The remounted legitimate cartridge did not send game:ready for its current session")
            positive_audit_start = _audit_count(page)
            _cartridge_frame(page).evaluate(
                """argument => window.parent.postMessage({protocol:'toadal.game.v1',
                  gameId:'toadal-feast-arcade-preview',type:'game:ready',sessionId:argument.sessionId,
                  payload:argument.payload}, '*')""",
                {"sessionId":current_session,"payload":ready_payload},
            )
            actual = _wait_for_audit(page, positive_audit_start, "game:ready", "cartridge")
            positive_effect = actual is not None and actual.get("decision") == "accepted"
            matches = actual is not None and all(
                actual.get(key) == value for key, value in {
                    "decision": "accepted",
                    "reason": "",
                    "source": "cartridge",
                    "origin": "null",
                }.items()
            )
            evidence["cases"].append({
                "id": "legitimate_current_session_positive_control",
                "description": "real post-remount game:ready message with the current session is accepted",
                "expected": {
                    "decision": "accepted",
                    "reason": "",
                    "source": "cartridge",
                    "origin": "null",
                    "message_type": "game:ready",
                },
                "actual": actual,
                "handled_effect_observed": positive_effect,
                "status": "PASS" if matches and positive_effect else "FAIL",
            })

            blocked_cases = [item for item in evidence["cases"] if item.get("status") == "BLOCKED"]
            failed_cases = [item for item in evidence["cases"] if item.get("status") == "FAIL"]
            if blocked_cases:
                evidence["status"] = "BLOCKED"
            elif (failed_cases or not evidence["remount"]["session_changed"]
                  or not evidence.get("legitimate_start_accepted")):
                evidence["status"] = "FAIL"
            else:
                evidence["status"] = "PASS"
            evidence.pop("blocked_stage", None)
            fatal_stage = None
            context.close()
    except Exception as error:
        evidence["status"] = "BLOCKED"
        evidence["blocked_stage"] = fatal_stage or "browser-execution"
        evidence["exception_type"] = error.__class__.__name__
        evidence["exception"] = str(error)
        evidence["traceback"] = traceback.format_exc()
    finally:
        if browser is not None:
            try:
                browser.close()
            except Exception:
                pass
    return evidence


def main():
    parser = argparse.ArgumentParser(
        description="Qualify the isolated Arcade preview host message security protocol."
    )
    parser.add_argument("--url", default=DEFAULT_URL, help="URL of qualification-harness.html")
    args = parser.parse_args()
    evidence = _run_qualification(args.url)
    _write_evidence(evidence)
    return 0 if evidence.get("status") == "PASS" else 1


if __name__ == "__main__":
    sys.exit(main())
