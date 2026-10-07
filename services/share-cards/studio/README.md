# Native HUD Maker design handoff

These are editable design seeds for the accepted TOADAL Studio HUD Maker. They make the existing authoring resources available for future card design work. The running share service continues to use its fixed, reviewed server templates; it never loads these JSON files.

## Included seeds

| Editor document | Starting design | Editable layers |
| --- | --- | --- |
| `feast-invite.hud.json` | Anonymous invitation with the actual Feast lettering header and canonical toad PNG | Invitation headline, body, game name, CTA and supporting copy |
| `astro-personal-score.hud.json` | Personal score with the actual Astro frame PNG and Feast lettering header | Score, game name, headline, CTA and supporting copy |

Both use native schema `toadal-hud-authoring`, version 2, a 1200 × 630 canvas, `motionMode: reduced`, and no animation. Fixed decorative panels and PNG image layers are locked. Text layers remain editable. The Astro score layer has `bindingKey: share.score`; its value `1,240` is a layout placeholder, not a real or verified score. The seeds do not grant a binding access to game state.

## Designer workflow

1. Import the Editor JSON into the accepted native HUD Designer. Work on a copy of the seed. Inspect the composition at 1200 × 630 and at small preview sizes.
2. Edit the native text and layout. Keep the personal score qualification visible. Keep the card static. The lettering header is a flattened, approved file 20 treatment; changing its text requires a separately approved raster asset.
3. Save the proposed Editor JSON and export a PNG proof. Review text contrast, wrapping, image crops, and score values including 0 and 999,999,999 against the production card proofs.
4. Submit the design as a candidate for a fixed server template change. A designer edit needs review and approval of the specific server template version. Implement the approved design in the server renderer, increment the template version, and complete its rendering and sharing checks before publishing.

There is no automatic synchronization between HUD Maker and the production renderer. User uploaded Editor JSON, URLs, assets, and arbitrary templates must not be served or rendered by the share service. These seeds do not change cartridge admission, the host bridge, score confidence, progression, or analytics.

## Rendering difference and qualification limits

The native seeds deliberately use editable `rounded` text, which resolves through the accepted HUD implementation's native system font treatment. The production share renderer uses the bundled Lilita One font. Native text sizing, padding, gradients, and alignment are not guaranteed to match the production SVG renderer. These are layout starting points, not pixel matching production exports.

The actual header, canonical toad, and Astro frame PNGs are embedded as data URLs so the design documents have no remote asset dependency. Asset provenance and license notices remain in `../assets/`.

Both documents passed the exact accepted package's `normalizeHudDocument` and `validateHudDocument` with zero errors and zero warnings. This confirms native document schema validity. Native Designer browser import/export, visual acceptance, and a production template change have not been qualified by this check. See `validation-receipt.json` for the seed and asset SHA-256 hashes.

## Reproduce schema validation

Validation authority:

- Repository: `Matthew75x/toadal-studio`
- Accepted commit: `ffebf68559c0866e8e68b3de1470fa89ee654013`
- Source: `packages/hud-authoring/src/index.ts`
- Git blob SHA-1: `f4f4a146b3a043dd858860e63b5d54aab2e89d90`
- Source SHA-256: `dde191d63834afb8ebbc49863430bbd5ed4200219a7b8583a44bc30b72a7341e`
- Source byte length: 41,813

Fetch that exact source into a temporary work directory, preserving its UTF-8 bytes. From the service directory run:

```powershell
node studio/build-design-seeds.mjs <absolute-path-to-temporary-source>/index.ts
```

The script verifies the Git blob hash before compiling the accepted source with Node's `module.stripTypeScriptTypes`. It writes its temporary JavaScript beside the temporary source, imports the native normalization and validation functions, and generates these seed documents and their receipt. Node 22.23.2 was used. This syntax compilation is not a new qualification of the whole Studio package. The accepted Studio runtime source is not vendored into this service or sent to browsers.

Current production template version at this handoff: `1`. The seeds are design references only and do not become serving authority through this receipt.