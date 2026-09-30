# TOADAL FEAST — Branch and Deployment Policy
main = stable reviewed staging snapshot; Pages deploys only from main.
Work branch format: work/WO-###-scope.
Codex works locally, tests locally, commits bounded scope, pushes evidence, never merges main.
ChatGPT reviews diff/tests/screenshots/truth/reference adherence: PASS/FIX/REJECT.
Feature branches do not trigger Pages. Accepted batch merges once, deploys once, hosted review once.
Production DNS/cutover requires explicit owner approval.
