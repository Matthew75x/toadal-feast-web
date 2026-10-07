# Link-preview sizing and decorated card decision

Verified 2026-10-07 using current primary documentation.

## Decision

Keep 1200×630 as the default exported image. It is a defensible high-resolution 1.91:1 default, not a universal mandatory size. The receiving app controls the physical preview size and framing. Lowering the source pixel dimensions does not give the sender control of the recipient's message bubble. Reduce image bytes through encoding and keep the composition readable when scaled down.

## Verified guidance

- Meta, Images in Link Shares: recommends at least 1200×630 for high-resolution devices; at least 600×315 for larger link images; minimum allowed 200×200; as close to 1.91:1 as possible; image file maximum 8 MB. The current official page was read directly with HTTP 200.
  https://developers.facebook.com/documentation/sharing/webmasters/images
- Apple, TN3156: preview images should be at least 900px wide. Context/device change their displayed size; Apple advises graphical images and metadata for text. Metadata must be available without client JavaScript. The current official documentation JSON was read with HTTP 200.
  https://developer.apple.com/documentation/technotes/tn3156-create-rich-previews-for-messages
- LinkedIn sharing module: minimum 1200×627; recommended 1.91:1; maximum 5 MB. This concerns its sharing module, not every ad/post placement.
  https://www.linkedin.com/help/linkedin/answer/a521928/making-your-website-shareable-on-linkedin?lang=en
- Open Graph defines image URLs, width, height and alternative text, without prescribing one universal pixel size.
  https://ogp.me/

The old X large-image-card documentation URLs now redirect to an overview. Current official dimensional guidance was not found; legacy figures were not used as verified standards. Actual preview behavior across channels still requires channel-specific launch qualification.

## Composition adaptation

The three local concepts retain the wide composition and add existing strawberry, orange, banana, apple and cookie artwork as large subdued background accents. Keep text and the complete game screen in front. Fine-print labels are removed from the illustrated surface; example labels remain outside the concepts, and actual game/score/trust meaning should also be in link metadata. Score typography remains large because it is central to a challenge card.

The interactive narrow layouts are authoring previews, not a prediction that a PNG link image reflows inside Messages. The exported PNG/JPEG files remain 1200×630 and will be scaled/cropped by the destination app.

## Asset authority

The five local 256×256 RGBA PNGs exactly match committed native TOADAL blobs at Matthew75x/Toadal-Feast-Development c7ba1f978a89f5976cd6f02af4beb1e7dba2f372. Source directory: assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/.

Exact source paths, Git blob hashes and SHA-256 hashes are recorded in work/share-decoration-assets/provenance.json. These are available native runtime derivatives. New glossy master paths referenced in manifests do not currently have available image blobs, so they were not treated as usable assets. Local pizza differed from the pinned version and was not used.

Integration should register these selected assets in the website/share-service authority manifests and expose only fixed approved assets to the renderer. This evaluation does not change the production renderer, the protected game sandbox, screenshot ingestion or draft PR30.

## Full-resolution design exports

All six exports are 1200×630. JPEG encoding quality is 88.

| Example | PNG bytes | JPEG bytes |
| --- | ---: | ---: |
| Arcade | 765696 | 136642 |
| Wicked Bites | 505498 | 103397 |
| Puzzle Astro | 689841 | 130869 |

The JPEG examples reduce file weight by roughly 80% while preserving the full source resolution. These are design examples, not verified player results. The existing service still renders PNGs; adopting JPEG serving would be a separate implementation choice. Its current 2 MB image cap remains stricter than the verified platform ceilings.
