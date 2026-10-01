# Web Beta Analytics Extension — Arcade + Conversion

Date: 2026-09-30  
Status: vendor-neutral planning authority.

## Goal

Measure whether the web beta is doing its job without turning analytics into a release dependency or sending unnecessary personal data.

The existing minimal event contract remains authoritative. This document adds Arcade-specific events and a small beta decision framework.

## Arcade events

Add through the same internal analytics adapter:

- `arcade_preview_view`
- `arcade_experience_select`
- `arcade_run_start`
- `arcade_run_complete`
- `arcade_run_end`
- `arcade_personal_best`
- `arcade_character_unlock`
- `arcade_character_select`
- `arcade_replay_select`
- `arcade_exit`
- `arcade_runtime_error`

Do not emit high-frequency per-frame/per-catch telemetry.

## Properties

Allowed bounded properties:

- `experienceId`: standard | fmf | zen
- `characterId`: toadal | classic | pelican | chomper | princess
- `runOutcome`: completed | game_over | exit | error
- `scoreBucket`: coarse bucket rather than unnecessarily precise telemetry if exact score is not needed
- `durationBucket`: e.g. <30s, 30–119s, 2–4m, >4m
- `unlockedCount`: 1–3
- `publicState`: PREVIEW
- `viewportClass`
- `inputClass`: touch | keyboard | pointer | mixed
- `sourceCampaign` when already available from coarse acquisition routing

Do not send:
- mobile save data;
- account identifiers;
- raw localStorage;
- precise device fingerprint;
- arbitrary user-entered text;
- per-food event streams.

## Funnel

Primary beta funnel:

`page_view -> play_view -> game_card_select -> arcade_run_start -> arcade_run_end -> arcade_replay_select / app_cta_select`

Supporting product-quality metrics:

- launch success rate
- first-run completion/end rate
- replay rate
- character-unlock rate
- experience-switch rate
- runtime error rate
- app CTA selection after meaningful play

## Provisional beta decision thresholds

Do not judge from tiny samples.

Use the first **100 qualified web-play sessions** as a minimum directional sample unless a severe technical failure appears earlier.

A qualified session:
- is not obvious bot/QA traffic;
- reaches Play or a player route;
- is not an internal test session when test filtering is available.

### CONTINUE / APPROVE DIRECTION

Directional signal is healthy when:
- Arcade launch success >= 95%;
- >= 35% of players who start a Standard run start another run OR choose another Arcade experience in the same session;
- >= 10% of players who complete meaningful play select the app CTA.

This does not mean the product is permanently optimized; it means the beta is worth continuing.

### ITERATE

Iterate the web loop when:
- launch success remains >= 90%;
- but replay/experience-switch engagement is 15–34%;
- or app CTA after meaningful play is 3–9%;
- or mobile abandonment materially exceeds desktop.

Prioritize onboarding, run pacing, results/unlock presentation, load time and CTA timing before expanding scope.

### STOP / HOLD EXPANSION

Do not expand the beta footprint when:
- launch success < 90%;
- runtime error rate > 5%;
- or replay/experience-switch engagement remains < 15% after obvious technical issues are removed.

“Stop” means hold additional feature expansion and repair the core loop; it does not mean delete the website.

## Guardrails

- Never delay navigation because analytics failed.
- Do not add invasive tracking to improve metric precision.
- Internal QA traffic should be identifiable/excludable if practical.
- Measure the web sampler as a product experience, not as an ad impression funnel.
- Do not weaken the game to inflate CTA clicks.

## Review cadence

Review after:
- first 100 qualified sessions;
- then first 500;
- then after any major Arcade/onboarding change.

Avoid reacting to day-to-day noise at tiny volume.
