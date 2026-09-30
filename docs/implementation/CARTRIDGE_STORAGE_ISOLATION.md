# Arcade Web Preview — Storage Isolation Contract
**Status:** BLOCKER for PUBLIC cartridge promotion

## Finding
The current Arcade standalone is built for the TOADAL FEAST product runtime, not for a same-origin website cartridge.

Its runtime uses storage keys including:
- `froggyFeast` through SaveManager;
- `froggyFeast.arcade.modeSettings.v1`;
- `froggyFeast.arcadeHostContext.v1`;
- `froggyFeast.mobileControls.*`;
- `froggyFeast.characterAnimationTiming.v2`;
- `froggyFeast.runtimeFeatures.v1`.

A cartridge hosted under the same website origin shares origin-wide `localStorage`. URL path does **not** isolate storage.

Therefore the current standalone must not be published unchanged as a website cartridge.

## Required web namespace
The public preview owns:

`toadal:game:toadal-feast-arcade-preview:v1:`

No preview write may silently mutate the mobile/full-game logical storage namespace.

## Preferred implementation
Use an explicit web-cartridge storage adapter/build profile.

The adapter must provide namespaced equivalents for:
- main SaveManager persistence;
- Arcade mode settings;
- mobile control preferences used by the cartridge;
- runtime feature preferences if retained.

Do not perform a global blind text replacement of every "froggyFeast" string because that namespace also appears in event names, diagnostics and non-storage product vocabulary.

## ThemeSaveResolver note
The game already contains a strong save-isolation concept through `ThemeSaveResolver`.

However the current default `froggy-feast` save policy is:
`shared-presentation`.

For the website derivative, using a cartridge-specific isolated save-policy is appropriate for SaveManager, but direct `localStorage` keys outside ThemeSaveResolver still require explicit namespacing.

## Website progression
Cartridge-internal score/save data is distinct from website Feast Pass state.

Website state:
`toadal:web:v1:...`

Cartridge state:
`toadal:game:toadal-feast-arcade-preview:v1:...`

Do not transfer rewards/coins/progression between them until a deliberate bridge is designed and tested.

## Migration
No migration from mobile/full-game saves is required for the first preview.

The preview starts in its own local namespace.

## Promotion gate
Before cartridge state becomes `PUBLIC`, prove:
1. a clean browser origin has no writes to legacy `froggyFeast*` keys;
2. a pre-populated legacy/full-game storage set is unchanged after preview play;
3. preview state survives reload in its own namespace;
4. reset/clear only removes preview-owned keys;
5. multiple tabs do not corrupt the preview save.
