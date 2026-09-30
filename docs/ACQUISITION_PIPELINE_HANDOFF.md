# TOADAL FEAST acquisition pipeline handoff

Date: 2026-09-30
Status: scaffolded, not production-activated

## Android 1.2.9 contract

- App QR: `https://toadalfeast.com/?ref=app_qr`
- Native Share / Copy Link: `https://toadalfeast.com/?ref=app_share`

These are already supported by the routing scaffold and should remain backward-compatible.

## Website routing

- Contract: `docs/QR_ATTRIBUTION_ROUTING_CONTRACT.md`
- Shared resolver: `studio-project/routing-scaffold/router.mjs`
- Netlify Edge scaffold: `netlify/edge-functions/acquisition-router.ts`
- Unit witness: `studio-project/routing-scaffold/test-router.mjs`
- Netlify witness: `studio-project/routing-scaffold/test-netlify-edge.mjs`

Current default behavior sends QR/share traffic to the TOADAL FEAST website first. Optional direct Android/iOS store routing is disabled unless `TOADAL_ROUTE_TO_STORES=true` is explicitly configured.

## Netlify staging

Existing project: `toadal-v13-site-preview`

Site ID:
`7c0d4199-59d8-4461-9fd9-fb3d07dc1fb4`

The project currently requires Netlify team SSO. No access-control change or live deployment was made as part of this scaffold.

Before activation, connect the authoritative website build to this project or its final replacement, then verify the Edge Function in a deploy preview before production.

## Figma / FigJam reference

Editable acquisition architecture:
https://www.figma.com/board/ITFqdxmnamIex8gIiCkuos

It documents app QR/share, public campaign QR, the TOADAL domain, campaign registry, website landing fallback, optional store routing, and asynchronous attribution.

## Canva campaign workspace

Existing campaign folder:
`TOADAL FEAST - October Campaign`

New subfolder:
`QR & Guerrilla Marketing`

A safe working copy of the existing acquisition-oriented Instagram design was placed there. The approved originals were not modified.

## Activation checklist

1. Finish/freeze the website implementation.
2. Decide final Google Play and App Store destination URLs.
3. Configure final Netlify project/environment variables.
4. Deploy routing to a non-production preview.
5. Verify `app_qr`, `app_share`, `/go/app-qr`, `/go/app-share`, unknown-code fallback, Android, iOS, and desktop behavior.
6. Connect analytics transport without making navigation depend on analytics success.
7. Lock public campaign codes.
8. Generate final QR images from TOADAL-controlled URLs.
9. Camera-scan and decode every production QR before print/export.
10. Replace campaign placeholders in Canva and export final print/social assets.

## Current QA

Verified on ASSIGNATOR:

- `node studio-project/routing-scaffold/test-router.mjs` -> PASS
- `node studio-project/routing-scaffold/test-netlify-edge.mjs` -> PASS

Nothing in the live website `dist/` was changed by this work.
