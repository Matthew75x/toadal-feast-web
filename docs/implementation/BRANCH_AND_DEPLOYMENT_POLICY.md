# TOADAL FEAST — Branch and Deployment Policy

## main
- stable reviewed staging snapshot
- GitHub Pages deploys from main only
- no experimental development directly on main

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
Feature branches do not trigger Pages.
Merge an accepted batch once; deploy once; review hosted result once.
Additional deployment only for accepted fixes or explicit review checkpoint.

## Production
GitHub Pages is development/staging.
No production DNS/cutover without explicit owner approval.
