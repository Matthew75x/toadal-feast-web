# TOADAL FEAST — Static Routing / GitHub Pages Contract
**Purpose:** prevent a technically correct local site from breaking when hosted at the GitHub Pages project subpath.

## Hosting reality
Development staging is a GitHub **project** Pages site, not the domain root.

Current project base:
`/toadal-feast-web/`

Production may later use a custom domain/root path. Therefore routing and assets must be base-path aware.

## Required implementation
Prefer a static multi-page export:
- `dist/index.html`
- `dist/play/index.html`
- `dist/world/index.html`
- etc.
- `dist/404.html`

Do not depend on a server-side SPA fallback that GitHub Pages does not provide.

Dynamic-looking routes such as game/story detail pages must be materialized as actual static directories during export for known content.

## URL helper
All route links and asset URLs must use one central base-path resolver.

Do not scatter:
- `/assets/...`
- `/play/...`
- hard-coded GitHub Pages URLs

through templates.

The build must support at least:
- local/root preview base `/`
- GitHub Pages base `/toadal-feast-web/`
- future custom-domain base `/`

## 404
`dist/404.html` must:
- retain TOADAL FEAST shell/identity;
- provide Home / Play / World / Stories / Search recovery;
- avoid JS dependency for core recovery links.

## Verification
For every accepted batch:
1. export with the GitHub Pages base;
2. scan generated HTML for broken root-absolute links;
3. serve `dist/` under a matching subpath locally when practical;
4. confirm nested pages resolve CSS/JS/images correctly.

## Stop condition
A batch is not Pages-ready if it only works at localhost root.
