# TOADAL FEAST — Minimal Web Analytics Event Contract
**Purpose:** measure the beta funnel without coupling page implementation to a vendor.

## Vendor-neutral events
- `page_view`
- `nav_select`
- `game_card_view`
- `game_card_select`
- `game_launch_attempt`
- `game_launch_success`
- `app_cta_select`
- `feast_pass_open`
- `quest_open`
- `story_open`
- `chapter_open`
- `search_submit`
- `search_result_select`
- `companion_interaction`
- `coming_soon_select`

## Common properties
- route id
- content id when applicable
- public feature state
- viewport class
- session-local anonymous identifier if analytics configuration permits

Do not send:
- raw form message bodies
- passwords/auth tokens
- comic page contents
- precise personal data

## Implementation rule
Frontend code calls one internal analytics adapter.
Vendor selection/configuration is outside page components.

If analytics is unavailable, the adapter fails silently without breaking the experience.
