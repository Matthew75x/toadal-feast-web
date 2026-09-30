# Routing scaffold

This folder is isolated plumbing for TOADAL FEAST acquisition routing. It is not wired into the live website or `dist/`.

## What is ready

- Supports the Android 1.2.9 placeholder query routes:
  - `?ref=app_qr`
  - `?ref=app_share`
- Supports future pretty routes such as `/go/app-qr`.
- Central campaign registry.
- Android/iOS/website destination selection.
- Unknown campaigns fail safely to the website.
- No player identifier, advertising ID, fingerprinting, or production analytics dependency.

## What remains intentionally unset

- Final Google Play URL.
- Final App Store URL.
- Analytics provider/event transport.
- Production edge/server integration.
- Final campaign inventory.

## Run the contract test

```bash
node studio-project/routing-scaffold/test-router.mjs
```

The test uses placeholder store URLs only. They are not production configuration.

When the real website project is connected, port `router.mjs` into its server/edge routing layer rather than duplicating the mappings in visual components.
