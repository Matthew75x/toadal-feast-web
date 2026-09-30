# TOADAL FEAST — QA Acceptance Matrix

Every implementation batch must show:

## Source
- correct work branch
- correct starting commit
- no out-of-scope changes
- clean git status after commit
- no secrets/private material

## Studio/build
- Studio validation PASS
- static export PASS
- required tests PASS
- manifest/content validation PASS where applicable

## Browser
- no unexpected console errors
- no broken required navigation
- loading/error/empty states work
- actual hosted asset paths are correct

## Accessibility
- keyboard navigation
- visible focus
- semantic landmarks
- labels for controls/forms
- reduced motion
- no color-only information

## Responsive
At minimum:
390×844, 430×932, 768×1024, 1366×768, 1600×900, 1920×1080.
Runtime/map/reader routes may require extra orientation checks.

## Visual
- follows approved reference family
- canonical mascot/characters
- no retired logo treatment
- no sterile SaaS drift
- route-specific composition retained

## Product truth
- no fake screenshot
- no fake account sync
- no fake global rankings
- no fake social posting
- no fake checkout
- no invented release date
- no mockup filler hardened into permanent product rule

## Merge gate
Only PASS may merge to main.
