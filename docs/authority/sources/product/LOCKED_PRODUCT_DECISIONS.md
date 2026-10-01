# Locked Product Decisions

## Product identity
The website should feel like entering the TOADAL FEAST world: colorful cartoon food kingdoms, overwhelming food, adventure, characters, exploration, and the recurring idea that food/feasting helps save or celebrate the world. TOADAL FEAST is the flagship/current Android/iPhone game, but the website is broader than a web port of that game.

TOADAL GAMES is the studio identity. It can appear in footer/about/business contexts, but the public experience is visually TOADAL FEAST first.

## Main visitor journey
1. Play something free immediately.
2. Discover TOADAL FEAST characters/world/story.
3. Consume media: videos, art, manga/comics, lore, news.
4. Earn lightweight Feast Pass progression.
5. Create an account later to preserve/sync progress and unlock fuller progression/reward capability.
6. Convert interested visitors to the complete TOADAL FEAST mobile app.

## Browser games
Primary examples: Wicked Bites, TOADAL Tower Defense / Feast Defense, Froggy Fruity Bash, CLAW: Feed Gulper, future spin-offs, and eventually a deliberately limited TOADAL FEAST Arcade preview.
Not every browser game has to be directly from the flagship game, but the website's world/brand atmosphere should remain TOADAL FEAST.

The full TOADAL FEAST mobile game is NOT to be represented as fully playable on the website right now. The old interactive four-mode web console is on ice. The App page can showcase Arcade, Puzzle, Feastfall, and Infinite through screenshots/video/explanation.

## Stories / manga / content publishing
The site needs plumbing for manga/comics, chapters/issues, page reader, covers, thumbnails, tags, character/world links, previous/next navigation, reading progress, videos, art/gallery, lore, news/devlogs, and related content.

## Reactive Toadal companion
Major signature feature. Toadal should feel like a site companion, not a static mascot. Context should come from route, hovered/focused semantic object, click/action events, rewards, quests, food/treat collection, support, privacy, account, settings, sound, construction, store, community, media, stories, games, downloads, errors, etc.

Use authoritative high-resolution reaction assets. Different situations should use context-appropriate poses/accessories. Support mouse, keyboard focus, touch equivalents, and reduced-motion behavior. Reduced motion should remove animation, NOT remove state changes. Allow minimize/show-hide where appropriate.

## Feast Pass
Working name: Feast Pass (can be refined later). The concept is an adventure/passport inspired by Toadal's travels as King of Feasts. The visitor is following in his footsteps and becoming a more accomplished/certified Feaster.

Guest-first behavior:
- Start earning immediately with no account.
- Persist guest progress locally using durable browser storage (not fragile HTTP cache semantics).
- Encourage account creation to lock in/save progress, sync devices, raise/remove guest ceilings, and unlock fuller rewards/identity features.
- Exact guest cap/economy is TBD; do not invent permanent values into architecture.

Progression may include XP/level, Sparks, Treats, streaks, daily rewards, quests, badges, discoveries, collectibles, titles, world progress, and game high-score related objectives.

## Playful website layer
Keep/salvage good earlier systems where they add delight without clutter:
- hidden collectible foods/Treats;
- Toadal reaction to collected food;
- environmental motion/parallax (respect reduced motion);
- daily reward;
- quests/challenges;
- optional/toggleable Feast Pass HUD;
- intuitive mobile bottom navigation plus full drawer if useful;
- search, sound, appearance/settings.

## Future/unavailable systems
Account, Community, Store, future games/worlds/features should be visible when useful, with truthful Coming Soon / Under Construction states. Clicking an unfinished destination should lead to a polished branded construction experience, not a dead end.

## Version-control rule
After consolidation, stop creating disconnected ZIP-only versions. Establish one Git-backed source of truth with branches/tags/checkpoints. Preserve historical archives outside the active code path as references.
