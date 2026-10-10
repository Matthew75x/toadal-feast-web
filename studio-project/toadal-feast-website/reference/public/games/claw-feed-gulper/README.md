# CLAW: Feed Gulper website preview cartridge

This is website preview build `2.5.1-web-preview.4`, derived from the exact upstream player source at `Matthew75x/claw-feed-gulper@91f9b600b5d05c0b37ff49a9db615c9c1c38342e`. The in-game Credits show the upstream game version and short source revision. This website adaptation removes a decorative queen glyph from the mastery badge; it does not change gameplay, art, scoring, or saves. `cartridge.json` and `ORIGINAL_SOURCE_FILE_SHA256.json` record the upstream entry identity; the archive digest and per-file ledger record this website adapter revision.

The packaged `runtime.bundle.js` is the website-only `toadal.game.v1` adapter. It is not the signed TCS bridge. TCS features are empty and TCS admission has not run. This build has no public release, rights, publisher, trusted-score, account-sync, or real-device approval.

The game keeps its own `toadal:game:claw-feed-gulper:v1:` browser-local save namespace. Account sync is disabled. The TOADAL FEAST host must run this entry in its sandboxed player; opaque iframe storage may fall back to memory.

`poster.webp` is the owner-requested promotional title image for this game. Its exact registered source and poster hashes appear in `card-authority.json`. Status is `OWNER_DESIGNATED`; visual acceptance is **PENDING**. It makes no claim to show gameplay and does not authorize release.

This package is noindex and PREVIEW only. Keep the original source archive and this immutable website preview as separate artifacts. Do not represent this preview as a public launch or trusted gameplay result.
