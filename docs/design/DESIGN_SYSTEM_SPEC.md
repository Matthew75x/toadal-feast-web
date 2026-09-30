# TOADAL FEAST Website — Production Design System Specification

## Authority
Approved Home visual + selected 30-page best-reference set.
Mockups control layout/composition; canonical production assets override generated mascot/logo variants.

## Brand hierarchy
- TOADAL FEAST = primary visitor-facing identity.
- TOADAL GAMES = studio identity, subordinate except About/business/press/legal.
- Mobile app = full flagship adventure.
- Web = browser games, discovery, stories/comics/media, guest progression, news, app conversion.

## Visual language
- dark chocolate navigation
- warm cream/parchment panels
- vivid pink primary CTAs
- gold/crown reward accents
- deep navy headings
- lush food-fantasy environments visible around UI
- dense but organized game-style information
- route-specific environmental art
- contextual canonical Toadal

## Provisional tokens
- chocolate: #1e100d / #2c1710 / #422416
- cream: #fffdf6 / #fff9e9 / #fff0cf
- navy: #10165b / #292d7e
- pink: #d90055 / #f50961 / #ff267a
- gold: #a86606 / #de8d09 / #ffb823 / #ffd45b
- spacing: 4,8,12,16,20,24,32,40,48,64 px
- card radius: 12–16 px
- panel radius: 18–24 px
- desktop max width: about 1640 px
- desktop outer gutter: 28–48 px

## Typography
Final fonts remain TBD. Use one playful readable display family and one highly legible UI/body sans.
Do not bake important text into illustration.

## Global components
SiteHeader, SiteFooter, HeroBand, CreamPanel, DarkFeaturePanel, SectionHeading,
PrimaryButton, SecondaryButton, StatusChip, CategoryTabs, GameCard, CharacterCard,
WorldCard, StorySeriesCard, MediaCard, NewsCard, QuestCard, RewardCard,
LeaderboardTable, ProgressBar, FeastPassSummary, SearchField, SearchResultGroup,
EmptyState, ComingSoonState, ToadalCompanion, ProductEvidenceGallery, FormField, LegalToc.

## Toadal rule
Generated Toadal inside a mockup is composition reference only unless separately approved.
Prefer clean environment background + canonical transparent Toadal overlay.
Canonical identity: golden-yellow, crown, red scarf, established face/proportions, explorer / King-of-Feasts personality.
Never substitute a generic green frog.

## Public states
PUBLIC / PREVIEW / PLANNED / COMING_SOON / DISABLED.
Unavailable account, leaderboard, community and commerce systems must never appear live.

## Route families
Hub: Home, Play, World, Characters, Stories, Media, Community.
Entity detail: Game Detail, Character Profile, Manga Series.
Runtime: Game Player, Comic Reader.
Progression: Feast Pass, Quests, Rewards, Leaderboards, Profile.
Editorial: News, Devlog, Roadmap.
Conversion/account: App, Account.
Utility/support: Search, Support, Contact, About.
System/truth: Coming Soon, Legal, 404.

## Anti-regression
Do not replace canonical art with generated substitutes, fake product screenshots, hard-code mockup economy,
ship raster mockups as UI, or let one page family drift into a different design language.
