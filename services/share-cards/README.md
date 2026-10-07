# TOADAL share cards — review candidate

A working local card composer and a separately deployable Cloudflare Worker.
The review configuration does **not** publish or enable cloud creation.

## Run locally

Node 22 or newer. From this directory:

    npm ci --ignore-scripts
    npm run dev

Open http://127.0.0.1:8787. Local links work on this computer only.
The default is an anonymous card with analytics and public names off.
Local records/images persist in .local-data/ across server restarts.

    npm test
    npm run check
    npm run verify:assets
    npm run build:worker

The build command is a dry run, not a deployment. The TypeScript check verifies
the actual Worker entry point and generated bindings; imported JavaScript is
covered by executable tests rather than a full strict typing conversion.

For Chromium qualification:

    npx playwright install chromium
    npm run test:browser

The optional SHARE_REVIEW_OUTPUT environment variable chooses the evidence
directory. Native sharing and clipboard are explicitly stubbed in those checks.
For local Worker qualification, see the deployment document.

## What is here

- Fixed Feast/Astro PNG templates at 1200×630; real TOADAL lettering, Astro v2
  artwork and the website's selected mascot.
- Invitation and personal, player-submitted score cards.
- Prepare-before-Share, copy fallback, download and tab-held removal access.
- Initial HTML Open Graph/X metadata, unique canonical URLs, GET/HEAD images.
- Atomic creation keys, separate removal authority, expiry and direct-image
  revocation, persistent local and R2 adapters.
- A shared anonymous 5/minute burst pool and conservative 100/day creation,
  300/day rendering budgets for the Worker. These contain no people/device keys.
- Native HUD Maker authoring seeds under studio/; see their validation limits.

No analytics endpoint, account identity, reward, verified rank, install
attribution, room membership, arbitrary uploaded template or remote-image
fetcher is enabled.

## Integration and launch

Read ../../docs/implementation/SHARE_CARDS_AND_INVITES.md.

Website page integration must go through the accepted native Studio source and
pinned exporter. The standalone package does not change the sealed Pages payload.
The accepted host-snapshot adapter is a seam for the existing validated
Wicked Bites completion path; it is not wired into the live player yet.

The public hostname, hosting account/budget, launch access policy, retention
and real Facebook/Messages preview qualification require a launch decision.
