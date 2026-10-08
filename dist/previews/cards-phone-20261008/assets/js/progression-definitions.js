/* Starter configuration only. These values are editable and are not canonical economy decisions. */
(function (root, factory) {
  const definitions = factory();
  if (typeof module === 'object' && module.exports) module.exports = definitions;
  if (root) root.ToadalProgressionDefinitions = definitions;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  return {
    configStatus: 'starter-config-editable-not-canonical',
    schemaVersion: 1,
    xpPerLevel: 100,
    knownSiteRoutes: ['/feast-pass/', '/feast-pass/quests/', '/feast-pass/rewards/', '/profile/', '/world/', '/stories/', '/characters/'],
    dailyCheckIn: {
      enabled: true,
      period: 'UTC-day',
      xp: 5,
      sparks: 1
    },
    quests: [
      {
        id: 'visit-world',
        group: 'exploration',
        title: 'Explore the World',
        description: 'Visit the World page.',
        route: '/world/',
        event: 'route-visit',
        target: 1,
        reward: { xp: 10, sparks: 1 }
      },
      {
        id: 'visit-stories',
        group: 'exploration',
        title: 'Visit Stories',
        description: 'Visit the Stories page.',
        route: '/stories/',
        event: 'route-visit',
        target: 1,
        reward: { xp: 10, sparks: 1 }
      },
      {
        id: 'find-feast-treats',
        group: 'exploration',
        title: 'Find the Feast Treats',
        description: 'Collect the three Treats already hidden in the Home discovery interaction.',
        event: 'treat-collect',
        href: '/#interactive-discovery',
        target: 3,
        reward: { xp: 15, sparks: 2 }
      }
    ],
    treats: [
      { id: 'portal-candy', collectibleId: 'treat-home-blue', title: 'Portal Candy', description: 'A little blue Feast candy found in the Home portal.', source: 'home-interactive-discovery' },
      { id: 'lower-page-candy', collectibleId: 'treat-home-green', title: 'Story Candy', description: 'A Feast candy tucked into the existing mobile-app story panel.', source: 'home-interactive-discovery' },
      { id: 'golden-block-candy', collectibleId: 'treat-home-purple', title: 'Golden Block Candy', description: 'The candy revealed by completing the existing Golden Block interaction.', source: 'home-interactive-discovery' }
    ],
    rewards: [
      { id: 'starter-feaster-badge', title: 'First Feast', description: 'A small marker for beginning a guest-local Feast Pass journey.', type: 'badge', awardId: 'first-feast', level: 1, entitlement: false, localOnly: true },
      { id: 'curious-feaster-title', title: 'Curious Feaster', description: 'A website-local profile title for an exploring guest.', type: 'title', awardId: 'curious-feaster', level: 2, entitlement: false, localOnly: true },
      { id: 'feast-pass-sticker', title: 'Feast Pass Sticker', description: 'A website-local collectible marker for this browser profile.', type: 'collectible', awardId: 'feast-pass-sticker', level: 3, entitlement: false, localOnly: true }
    ],
    discoveries: [
      { id: 'world-page-preview', title: 'Visited the World preview', description: 'A visit to the World page preview.', route: '/world/', event: 'route-visit' },
      { id: 'stories-page-preview', title: 'Visited the Stories preview', description: 'A visit to the Stories page preview.', route: '/stories/', event: 'route-visit' },
      ...[
        ['toadal', 'Toadal'], ['princess-lily', 'Princess Lily'], ['genie-sweet', 'Sweet Genie'],
        ['genie-fruity', 'Fruity Genie'], ['genie-savoury', 'Savoury Genie'], ['gulper', 'Gulper'], ['gully', 'Gully']
      ].map(([characterId, name]) => ({
        id: 'character-artwork-' + characterId, characterId, event: 'character-view',
        title: name + ' artwork discovered',
        description: 'Viewed approved character artwork on this website. Browser-local only; not game, story, or canon completion.'
      }))
    ],
    levelMilestones: [
      { level: 1, title: 'Feast journey started', entitlement: false },
      { level: 2, title: 'Growing explorer', entitlement: false },
      { level: 5, title: 'Seasoned explorer', entitlement: false }
    ]
  };
});
