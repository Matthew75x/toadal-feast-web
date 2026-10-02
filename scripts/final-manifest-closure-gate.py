#!/usr/bin/env python3
from __future__ import annotations
import argparse, json, subprocess, sys, time
from pathlib import Path

def run_step(name: str, cmd: list[str], cwd: Path) -> dict:
    started = time.time()
    proc = subprocess.run(
        cmd, cwd=str(cwd), text=True, capture_output=True,
        encoding="utf-8", errors="replace"
    )
    return {
        "name": name,
        "command": cmd,
        "exitCode": proc.returncode,
        "status": "PASS" if proc.returncode == 0 else "FAIL",
        "seconds": round(time.time() - started, 2),
        "stdout": proc.stdout[-16000:],
        "stderr": proc.stderr[-16000:]
    }

def main() -> int:
    ap = argparse.ArgumentParser(description="TOADAL FEAST final manifest-completion gate.")
    ap.add_argument("--repo", type=Path, default=Path("."))
    ap.add_argument("--base-path", default="/toadal-feast-web/")
    ap.add_argument("--source-only", action="store_true")
    ap.add_argument("--skip-browser", action="store_true")
    ap.add_argument("--report-dir", type=Path, default=Path("docs/review/final-manifest-closure"))
    args = ap.parse_args()

    repo = args.repo.resolve()
    report_dir = (repo / args.report_dir).resolve() if not args.report_dir.is_absolute() else args.report_dir.resolve()
    report_dir.mkdir(parents=True, exist_ok=True)

    node = "node"
    py = sys.executable
    steps: list[dict] = []

    source_commands = [
        ("final-manifest-surfaces", [node, "scripts/verify-final-manifest-surfaces.mjs"]),
        ("final-interaction-truth", [node, "scripts/verify-final-interaction-truth.mjs", "."]),
        ("final-product-contracts", [node, "scripts/verify-final-product-contracts.mjs", "."]),
        ("navigation-truth", [node, "scripts/verify-navigation-truth.mjs", "."]),
        ("character-registry", [node, "scripts/verify-character-content-registry.mjs", "."]),
        ("gated-ecosystem", [node, "scripts/verify-gated-ecosystem-routes.mjs", "."]),
        ("search-discovery", [node, "scripts/verify-search-discovery.mjs"]),
        ("nonhome-truth", [node, "scripts/verify-nonhome-truth.mjs", "."]),
        ("visual-asset-authority", [node, "scripts/verify-visual-asset-authority.mjs", "."]),
        ("manifest-ledger", [node, "scripts/verify-manifest-compliance-ledger.mjs"]),
        ("core-node-tests", [
            node, "--test",
            "scripts/stories-publishing.test.mjs",
            "scripts/story-content.test.mjs",
            "scripts/wo001-pages-basepath.test.mjs",
            "scripts/wo002-contract.test.mjs",
            "scripts/guest-progression.test.mjs"
        ]),
        ("cartridge-storage-isolation", [node, "scripts/verify-cartridge-storage-isolation.mjs", "."]),
        ("canonical-gully-authority", [node, "scripts/verify-canonical-gully-gameplay-authority.mjs", "."])
    ]

    for name, cmd in source_commands:
        steps.append(run_step(name, cmd, repo))

    if not args.source_only:
        rendered_commands = [
            ("render-freshness", [node, "scripts/verify-owner-preview-render-freshness.mjs", ".", "dist"]),
            ("pages-basepath", [node, "scripts/verify-pages-basepath.mjs", "dist", args.base_path]),
            ("static-links", [node, "scripts/verify-static-links.mjs", "dist", args.base_path]),
            ("staging-robots", [node, "scripts/verify-staging-robots.mjs", "dist", "staging"])
        ]
        for name, cmd in rendered_commands:
            steps.append(run_step(name, cmd, repo))

        if not args.skip_browser:
            browser_report = report_dir / "browser-matrix.json"
            steps.append(run_step("browser-matrix", [
                node, "scripts/owner-preview-browser-matrix.mjs",
                ".", "dist", args.base_path, str(browser_report)
            ], repo))

    status = "PASS" if all(step["status"] == "PASS" for step in steps) else "FAIL"
    summary = {
        "schema": "toadal-feast.final-manifest-closure-gate.v1",
        "status": status,
        "repo": str(repo),
        "sourceOnly": args.source_only,
        "basePath": args.base_path,
        "passed": sum(step["status"] == "PASS" for step in steps),
        "failed": sum(step["status"] == "FAIL" for step in steps),
        "steps": [{k: step[k] for k in ("name", "status", "exitCode", "seconds")} for step in steps]
    }

    (report_dir / "final-manifest-closure-gate.json").write_text(
        json.dumps({"summary": summary, "details": steps}, indent=2) + "\n",
        encoding="utf-8"
    )

    lines = [
        "# TOADAL FEAST — Final Manifest Closure Gate",
        "",
        f"**Result: {status}**",
        "",
        f"- Passed: {summary['passed']}",
        f"- Failed: {summary['failed']}",
        f"- Source-only: {args.source_only}",
        "",
        "| Gate | Result | Time |",
        "|---|---:|---:|"
    ]
    lines += [f"| {step['name']} | {step['status']} | {step['seconds']}s |" for step in steps]

    if status == "FAIL":
        lines += ["", "## Blocking gates"]
        for step in steps:
            if step["status"] != "FAIL":
                continue
            tail = (step["stderr"] or step["stdout"]).strip().splitlines()[-14:]
            lines += ["", f"### {step['name']}"]
            lines += ["    " + line for line in tail]

    (report_dir / "FINAL_MANIFEST_CLOSURE_GATE.md").write_text(
        "\n".join(lines) + "\n", encoding="utf-8"
    )

    print(json.dumps(summary, indent=2))
    return 0 if status == "PASS" else 1

if __name__ == "__main__":
    raise SystemExit(main())
