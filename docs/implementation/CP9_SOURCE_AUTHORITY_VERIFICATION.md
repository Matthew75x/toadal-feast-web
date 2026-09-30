# CP9 Cartridge Source-Authority Verification

Date: 2026-09-30

The two CP9 cartridges that were actually qualified in staging are not orphaned binaries. Their exact source references still resolve in the connected GitHub repositories.

## Wicked Bites

Repository:
`Matthew75x/feast-crossing-wicked-bites`

CP9 source commit:
`6fff3c89605092ba5c5e122565cb98415c8ab5e5`

Commit resolves in GitHub.

Declared donor artifact:
`dist/PLAY_FEAST_CROSSING_WICKED_BITES_V5_5_MOTION_JUICE.html`

Git blob SHA:
`1433d67f17bf93c81fa4347402331999168a1fc8`

That blob SHA exactly matches the CP9 cartridge manifest source authority.

CP9 cartridge version: 5.5  
CP9 qualification: PASS  
CP9 deployment qualification: PASS
## CLAW: Feed Gulper

Repository:
`Matthew75x/claw-feed-gulper`

CP9 source commit:
`7c49d1bf70ebf6503fde3b533a1acd356d12c77c`

Commit resolves in GitHub.

Declared release hash file:
`RELEASE_FILE_HASHES.sha256`

Git blob SHA:
`e7c8b8da8fd04e36ff455d91122cd59e5f1f03fc`

That blob SHA exactly matches the CP9 cartridge manifest source authority.

CP9 release tree:
`7a55e0e637790418e121f9c29c0ea3b420e7107c`

CP9 cartridge version: 2.5.1  
CP9 qualification: PASS  
CP9 deployment qualification: PASS
## Consequence for WO-002

Do not describe Wicked Bites or CLAW as source-missing.

The correct next step is **current-environment requalification and integration**, using these exact source authorities as the starting point.

Do not rebuild either game from scratch unless the original source is proven incompatible with the current player/cartridge contract.

This verification does not itself mark either game PUBLIC in the new Studio site; current-environment qualification still controls publication state.
