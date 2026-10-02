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
    knownSiteRoutes: ['/feast-pass/', '/feast-pass/quests/', '/feast-pass/rewards/', '/profile/', '/world/', '/stories/', '/leaderboards/'],
    dailyCheckIn: {
      enabled: true,
      period: 'UTC-day',
      xp: 5,
      sparks: 1
    },
    quests: [
      {
        id: 'visit-world',
        title: 'Explore the World',
        description: 'Visit the World page.',
        route: '/world/',
        event: 'route-visit',
        category: 'exploration',
        target: 1,
        reward: { xp: 10, sparks: 1 }
      },
      {
        id: 'visit-stories',
        title: 'Visit Stories',
        description: 'Visit the Stories page.',
        route: '/stories/',
        event: 'route-visit',
        category: 'story',
        target: 1,
        reward: { xp: 10, sparks: 1 }
      },
      {
        id: 'find-a-treat',
        title: 'Find a Treat',
        description: 'Collect one of the three Home candies.',
        event: 'treat-collected',
        category: 'exploration',
        target: 1,
        reward: { xp: 5, sparks: 1 }
      },
      {
        id: 'complete-wicked-bites-preview',
        title: 'Complete a Wicked Bites preview',
        description: 'Complete a browser preview run recorded by the website player.',
        event: 'game-completed',
        gameId: 'wicked-bites',
        category: 'game',
        target: 1,
        reward: { xp: 15, sparks: 2 }
      }
    ],
    treats: [
      {
        id: 'treat-home-blue',
        title: 'Blue Feast Treat',
        description: 'A browser-local collectible found at the Home portal.',
        sourceInteractionId: 'portal-candy',
        assetId: 'asset.home.interaction.candy-blue',
        localOnly: true,
        entitlement: false
      },
      {
        id: 'treat-home-green',
        title: 'Green Feast Treat',
        description: 'A browser-local collectible found near the app story on Home.',
        sourceInteractionId: 'lower-page-candy',
        assetId: 'asset.home.interaction.candy-green',
        localOnly: true,
        entitlement: false
      },
      {
        id: 'treat-home-purple',
        title: 'Purple Feast Treat',
        description: 'A browser-local collectible revealed by the Golden Block.',
        sourceInteractionId: 'golden-block-candy',
        assetId: 'asset.home.interaction.candy-purple',
        localOnly: true,
        entitlement: false
      }
    ],
    rewards: [
      {
        id: 'first-treat-found',
        title: 'First Treat Found',
        description: 'A local recognition marker for finding one approved Home candy.',
        type: 'local-badge',
        badgeId: 'first-treat-found',
        condition: { type: 'treat-count', minimum: 1 },
        entitlement: false
      },
      {
        id: 'home-treat-collection',
        title: 'Home Treat Collection',
        description: 'A local recognition marker for finding all three approved Home candies.',
        type: 'local-badge',
        badgeId: 'home-treat-collection',
        condition: { type: 'treat-count', minimum: 3 },
        entitlement: false
      },
      {
        id: 'first-quest-complete',
        title: 'Quest Starter',
        description: 'A local recognition marker for completing a configured quest.',
        type: 'local-badge',
        badgeId: 'first-quest-complete',
        condition: { type: 'quest-count', minimum: 1 },
        entitlement: false
      },
      {
        id: 'world-and-stories-explorer',
        title: 'World & Stories Explorer',
        description: 'A local recognition marker for visiting both preview pages.',
        type: 'local-badge',
        badgeId: 'world-and-stories-explorer',
        condition: { type: 'discovery-ids', ids: ['world-page-preview', 'stories-page-preview'] },
        entitlement: false
      }
    ],
    discoveries: [
      { id: 'world-page-preview', title: 'Visited the World preview', description: 'A visit to the World page preview.', route: '/world/', event: 'route-visit' },
      { id: 'stories-page-preview', title: 'Visited the Stories preview', description: 'A visit to the Stories page preview.', route: '/stories/', event: 'route-visit' }
    ],
    levelMilestones: [
      { level: 1, title: 'Feast journey started', entitlement: false },
      { level: 2, title: 'Growing explorer', entitlement: false },
      { level: 5, title: 'Seasoned explorer', entitlement: false }
    ]
  };
});
