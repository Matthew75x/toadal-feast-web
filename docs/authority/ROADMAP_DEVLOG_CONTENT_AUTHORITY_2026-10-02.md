# TOADAL FEAST — Roadmap / Devlog Content Authority Note

**Date:** 2026-10-02  
**Source:** `studio-project/toadal-feast-website/content/registry.json`

## Devlog / News authority

Current registry:

```json
"news": []
```

There are **zero published news/devlog records** in the structured content authority.

Therefore the final Devlog/article family must be a reusable editorial template with an honest empty/unpublished state.

Do not invent:
- article title/date/byline;
- screenshots or quotes presented as a published devlog;
- previous/next article records;
- trending counts.

The News hub may expose the Devlog family and explain that no public entry is published yet.

## Roadmap authority

Current structured roadmap records:

### Browser game previews
- publicStatus: `PREVIEW`
- description: four browser-game listings remain preview/concept; none is PUBLIC
- route: Home What's Next

### Guest Feast Pass
- publicStatus: `PREVIEW`
- browser-local Feast Pass/quests/rewards/profile available on review candidate
- no account sync

### Community
- publicStatus: `COMING_SOON`
- curated area prepared
- posting/social services not live

### Store
- publicStatus: `COMING_SOON`
- store preview exists
- no products/prices/cart/checkout

### Account sync
- publicStatus: `PLANNED`
- guest progress remains browser-local
- sign-in/cross-device sync planned

No roadmap record contains a release date.

## Mapping to manifest visual groups

The manifest requires these visible group headings:
- Available Now
- In Development
- Coming Soon
- Exploring

Those headings are a **presentation taxonomy**, not permission to rewrite the registry's factual status.

Safe V1 mapping:

### Available Now
Use only current usable review-site capabilities, and label the scope clearly.

Examples:
- Guest Feast Pass — **PREVIEW available on this website candidate**
- Browser game previews — **PREVIEW listings available**, with none marked PUBLIC

Do not shorten these to an unqualified "released" or "public now".

### In Development
No registry item currently has an explicit `IN_DEVELOPMENT` public status.

Render a designed empty state such as:
“Nothing is publicly classified here yet.”

Do not infer internal work orders into public roadmap commitments.

### Coming Soon
Use the two explicit `COMING_SOON` records:
- Community
- Store

Retain their actual limitations.

### Exploring
The current Account sync record is `PLANNED`, not `COMING_SOON`.

It may be shown in the lowest-commitment future group only if its card visibly retains **PLANNED** wording, e.g.:
“Planned future capability — timing not announced.”

Do not silently relabel it as committed development.

If the visual taxonomy would obscure that distinction, leave Exploring empty and show Account sync in a separate “Planned capability” treatment.

## No fake dates

The Roadmap must not include:
- quarter;
- month;
- countdown;
- ETA;
- percentage complete;
- launch ordering;
- implied release sequence.

unless a future owner-approved registry record supplies it.

## Cross-links

Roadmap should link:
- PREVIEW items to their existing usable route;
- Community -> `/community/`;
- Store -> `/store/`;
- Account sync -> `/account/`;
- Devlog -> `/news/devlog/` as the editorial family, with empty state when no article exists;
- News -> `/news/`.

This preserves useful discovery without inventing publication content.
