#!/usr/bin/env python3
from __future__ import annotations
import argparse, json, subprocess, sys, time
from pathlib import Path

def run_step(name: str, cmd: list[str], cwd: Path) -> dict:
    started=time.time()
    proc=subprocess.run(cmd,cwd=str(cwd),text=True,capture_output=True,encoding="utf-8",errors="replace")
    return {"name":name,"command":cmd,"exitCode":proc.returncode,"status":"PASS" if proc.returncode==0 else "FAIL",
            "seconds":round(time.time()-started,2),"stdout":proc.stdout[-12000:],"stderr":proc.stderr[-12000:]}

def main():
    ap=argparse.ArgumentParser(description="One-command owner-preview qualification gate.")
    ap.add_argument("--repo",type=Path,default=Path("."))
    ap.add_argument("--base-path",default="/toadal-feast-web/")
    ap.add_argument("--report-dir",type=Path,default=Path("docs/review/owner-preview-gate-20261001"))
    ap.add_argument("--skip-browser",action="store_true")
    args=ap.parse_args()
    repo=args.repo.resolve()
    report_dir=(repo/args.report_dir).resolve() if not args.report_dir.is_absolute() else args.report_dir.resolve()
    report_dir.mkdir(parents=True,exist_ok=True)
    py=sys.executable
    node="node"
    steps=[]
    def fingerprint():
        return json.loads(subprocess.check_output(
            [node, "scripts/fingerprint-site-inputs.mjs", str(repo)], cwd=str(repo), text=True))
    input_fingerprint=fingerprint()

    steps.append(run_step("integrated-node-48",[
      node,"--test",
      "scripts/stories-publishing.test.mjs","scripts/story-content.test.mjs",
      "scripts/wo001-pages-basepath.test.mjs","scripts/wo002-contract.test.mjs",
      "scripts/guest-progression.test.mjs",
      "scripts/manifest-runtime-regressions.test.mjs",
      "scripts/manifest-audit-utility.test.mjs",
      "scripts/manifest-profile-discovery.test.mjs",
      "scripts/editorial-manifest.test.mjs"],repo))

    commands=[
      ("home-visual-contract",[node,"scripts/verify-home-visual-contract.mjs","."]),
      ("navigation-truth",[node,"scripts/verify-navigation-truth.mjs","."]),
      ("character-registry",[node,"scripts/verify-character-content-registry.mjs","."]),
      ("gated-ecosystem",[node,"scripts/verify-gated-ecosystem-routes.mjs","."]),
      ("manifest",[node,"scripts/verify-manifest-compliance-ledger.mjs"]),
      ("search-discovery",[node,"scripts/verify-search-discovery.mjs"]),
      ("nonhome-truth",[node,"scripts/verify-nonhome-truth.mjs"]),
      ("visual-asset-authority",[node,"scripts/verify-visual-asset-authority.mjs","."]),
      ("nonhome-layout-closure",[node,"scripts/verify-nonhome-layout-closure.mjs","."]),
      ("cartridge-isolation",[node,"scripts/verify-cartridge-storage-isolation.mjs","."]),
      ("render-freshness",[node,"scripts/verify-owner-preview-render-freshness.mjs",".","dist"]),
      ("pages-basepath",[node,"scripts/verify-pages-basepath.mjs","dist",args.base_path]),
      ("static-links",[node,"scripts/verify-static-links.mjs","dist",args.base_path]),
      ("staging-robots",[node,"scripts/verify-staging-robots.mjs","dist","staging"]),
    ]
    for name,cmd in commands:
        steps.append(run_step(name,cmd,repo))

    if not args.skip_browser:
        broad_report=report_dir/"browser-matrix.json"
        steps.append(run_step("browser-matrix",[
          node,"scripts/owner-preview-browser-matrix.mjs",".","dist",args.base_path,str(broad_report)],repo))

    stable=input_fingerprint==fingerprint()
    status="PASS" if stable and all(s["status"]=="PASS" for s in steps) else "FAIL"
    summary={"schema":"toadal-feast.owner-preview-gate.v1","status":status,
             "repo":str(repo),"basePath":args.base_path,
             "steps":[{k:s[k] for k in ("name","status","exitCode","seconds")} for s in steps],
             "passed":sum(s["status"]=="PASS" for s in steps),
             "failed":sum(s["status"]=="FAIL" for s in steps)}
    summary["inputFingerprint"]=input_fingerprint
    summary["inputsUnchangedDuringGate"]=stable
    (report_dir/"owner-preview-gate.json").write_text(json.dumps({"summary":summary,"details":steps},indent=2)+"\n",encoding="utf-8")
    lines=["# Owner Preview Gate","",f"**Result: {status}**","",
           f"- Passed: {summary['passed']}","- Failed: "+str(summary["failed"]),"",
           "| Gate | Result | Time |","|---|---:|---:|"]
    lines += [f"| {s['name']} | {s['status']} | {s['seconds']}s |" for s in steps]
    if status=="FAIL":
        lines += ["","## Blocking gates"]
        for s in steps:
            if s["status"]=="FAIL":
                tail=(s["stderr"] or s["stdout"]).strip().splitlines()[-8:]
                lines += ["",f"### {s['name']}"] + ["    "+line for line in tail]
    (report_dir/"OWNER_PREVIEW_GATE.md").write_text("\n".join(lines)+"\n",encoding="utf-8")
    print(json.dumps(summary,indent=2))
    return 0 if status=="PASS" else 1

if __name__=="__main__":
    raise SystemExit(main())
