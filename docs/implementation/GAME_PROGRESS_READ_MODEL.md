# Sourced game progress read model

Status: website contract implemented; real cross-system end-to-end proof still gated.

This is the EC-03 website/consumer contract. Feast Pass remains a read-only consumer of per-game progress and does not become a second canonical progression ledger.

## Independent dimensions

- Availability: playable-preview, launch-held, concept, unknown.
- Capability: launch-only, local-personal-progress, account-linked-personal-progress.
- Connection: not-linked, local, host-linked, account-linked.
- Data state: not-linked, no-data, zero, recorded, pending, stale, unavailable, synchronized.
- Confidence: none, source-reported-local, policy-accepted-personal, independently-verified.
- Persistence: none, session-only, browser-local, awaiting-delivery, account-synced.

These dimensions are deliberately independent. Not linked and no data are never displayed as zero. Zero requires an actual source metric. Pending requires awaiting-delivery. Synchronized requires account linkage, account persistence and policy-accepted-or-better confidence.

## Current website adapters

Wicked Bites is the only current local-personal-progress registration. Its existing validated website score adapter feeds browser-local completed scores. The read model labels that source as source-reported/local. It does not grant website XP, Sparks, Treats, rewards, global rank, account sync or independently verified gameplay.

CLAW: Feed Gulper remains launch-held and not linked for progress. Froggy Fruity Bash and TOADAL Tower Defense remain concept listings and not linked for progress. Package evidence or catalogue visibility does not create a progress connection.

## Future external projections

The exported normalizeExternalGameProjection function is the bounded future-source entry point. It accepts only a registered game, explicit source identity/kind, capability, connection, data state, confidence, persistence, timestamp and a small structured metric.

Current metric kinds are score and count. Count exists so a future accepted accomplishment source can report a bounded personal count without inventing a universal percentage.

Controlled tests cover pending, stale, unavailable and synchronized states. Those fixtures prove the model can represent the states; they are not evidence that an account/native source is connected.

## Feast Pass consumer

The four native Studio cards show availability, progress state, source, connection, save state and claim confidence. Existing game-detail/history actions remain. Runtime refreshes update text/attributes in place and do not replace card/link nodes.

## Trust boundary

- Games do not write website XP or global entitlements through this contract.
- Package qualification and release authorization do not prove a player result.
- A synchronized personal claim is not automatically anti-cheat verified.
- No account service, microservice, event bus, new save key, reward rule or protected cartridge byte is introduced here.

Real cartridge-to-account progression remains a later EC-05/EC-08 witness using actual accepted sources.