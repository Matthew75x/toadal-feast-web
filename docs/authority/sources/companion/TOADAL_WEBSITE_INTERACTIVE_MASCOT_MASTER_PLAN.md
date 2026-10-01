# TOADAL WEBSITE INTERACTIVE MASCOT MASTER PLAN v1.0

## Executive decision
The website should **not** solve brand personality by scattering dozens of static Toadal illustrations across every page. The stronger direction is a **persistent interactive Toadal companion** that reacts to the user's pointer/touch context, changes pose/expression for semantic UI states, and participates in a lightweight falling-food interaction.

The final TOADAL FEAST logo remains **paused** until the wider visual identity is fully locked. The current verified logo family includes the golden TOADAL wordmark with the pink bitten-donut O containing Toadal's head and multicolored FEAST lettering.

## Character identity lock
Toadal is the cheeky golden frog mascot. The identity should be recognizable from face, color, crown, and silhouette, not from repeating every accessory.

**Always:** golden-yellow body; cream muzzle/belly; large amber-brown eyes; gold crown; established face/proportions; premium glossy cartoon rendering.

**Usually:** red scarf.

**Optional/contextual:** star medallion and brown backpack. The backpack is useful for travel, exploration, mail, adventure, and some community contexts, but should be removed when it creates visual clutter or makes a business/support/privacy state feel costume-heavy.

## Expression rule
Winking and the wide-open grin are **not defaults**. Expression must follow semantic intent. Use a broader grammar: neutral-friendly, attentive, curious, thoughtful, pleased, excited, concerned, serious, skeptical, surprised, celebratory, and only occasionally cheeky/winking.

## Interactive companion proposal
- Keep the normal browser pointer for precision and accessibility.
- Render Toadal as a small **pointer companion** offset from the cursor with a subtle spring/delay.
- Use `pointer-events:none` on the mascot layer so he never blocks controls.
- Hovered elements emit semantic states such as `settings`, `privacy`, `rating`, `ai-disclosure`, `register`, `merch`, etc.
- A state manager chooses the appropriate expression/asset based on priority.
- Toadal returns to a neutral/idle pose when the pointer leaves the semantic target.
- Large static mascot illustrations should be reserved for the homepage hero, major campaigns, game pages, and major storytelling moments.

## Falling food interaction
Food should appear sparsely, not as constant visual noise. Toadal first looks toward a nearby food item, then the user can guide the pointer-companion toward it. When the food reaches a small mouth collision zone, Toadal triggers a short eat animation and the item disappears with a small crumb/sparkle/reward response.

Recommended priority: critical modal/account state > active click/action > contextual hover > food interaction > idle.

## Mobile/tablet adaptation
There is no persistent pointer, so the same system becomes a small edge companion that reacts to taps, focus, scroll context, and selected controls. Food can be tapped or dragged toward him. Reduced-motion users get static state swaps instead of follow-motion or falling-food loops.

## Performance and accessibility
- Native cursor always remains available.
- Mascot never carries essential meaning by itself.
- Use `prefers-reduced-motion` and a website setting to disable/limit motion.
- Pause food/motion when the page is hidden.
- Limit simultaneous food objects and particle effects.
- Use WebP/AVIF derivatives for runtime; retain transparent PNG masters.
- Lazy-load low-priority reaction assets and prefetch only states near the current page context.

## Asset organization
See `ASSET_REGISTRY.csv`, `EXPRESSION_AUDIT.csv`, and `INTERACTION_STATE_MAP.csv` for the authoritative mapping.

## Production recommendation
Phase 1 should use the existing raster assets as state swaps with CSS motion. Once the interaction proves itself, animate a small core set (idle, look, eat, point, celebrate, think, serious) using a rigged system such as Rive/Spine or carefully authored sprite loops. Do **not** attempt to animate every one-off page asset.

## Social Cause / Impact
Create a dedicated individual asset: Toadal with a sincere warm expression, both eyes open, interacting with a simple globe/heart/community-help motif. Avoid partisan or issue-specific symbolism so the asset can represent general charitable/community outreach. It should feel supportive and earnest rather than promotional or comedic.
