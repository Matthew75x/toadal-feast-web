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
    knownSiteRoutes: ['/feast-pass/', '/feast-pass/quests/', '/feast-pass/rewards/', '/profile/', '/world/', '/stories/'],
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
        target: 1,
        reward: { xp: 10, sparks: 1 }
      },
      {
        id: 'visit-stories',
        title: 'Visit Stories',
        description: 'Visit the Stories page.',
        route: '/stories/',
        event: 'route-visit',
        target: 1,
        reward: { xp: 10, sparks: 1 }
      }
    ],
    treats: [],
    rewards: [],
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
