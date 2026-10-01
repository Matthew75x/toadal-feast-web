# TOADAL FEAST — Branch and Deployment Policy

## main
- reviewed baseline; not a GitHub Pages deployment source
- no experimental development directly on main

## staging/live-visual
- dedicated public GitHub Pages staging branch
- the only branch that triggers deployment; manual workflow dispatch is also guarded to this ref
- commit the validated Studio source and its rendered, base-path-adjusted `dist/` export here
- staging URL: <https://matthew75x.github.io/toadal-feast-web/>
- the workflow uploads committed `dist/`; it does not build/render Studio

## work branches
Format:
`work/WO-###-short-scope`

Codex:
- works locally on the assigned branch
- runs tests locally
- commits only the bounded work order
- pushes when evidence is ready
- never merges main

## Review
ChatGPT reviews:
- diff
- tests
- screenshots
- public truth
- visual reference adherence

Classification:
PASS / FIX / REJECT.

## Pages quota discipline
Branches other than `staging/live-visual` do not trigger Pages. Each push to the staging branch can deploy; batch accepted changes and review the hosted result after the deployment completes. Manual dispatch is limited to that same branch.

## Production
GitHub Pages at the URL above is development/staging only. Neither `main` nor this workflow is a production deployment target. No production DNS/cutover without explicit owner approval.
