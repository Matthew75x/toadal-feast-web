// GENERATED FILE — DO NOT EDIT.
// Run: npm run theme:generate
// Source: validated Theme Pack v2 source + Content Target Registry
(function registerThemeCoverageRegistry(global) {
  'use strict';
  const data = {
  "schemaVersion": 1,
  "phase": "13.5.1",
  "defaultThemeId": "froggy-feast",
  "generatedBy": "scripts/themes/generate-theme-coverage.js",
  "policy": {
    "precedence": "player equipment where selectionPolicy permits to active theme default content to native/default content to renderer fallback",
    "targetSafety": "Only supported Content Target Registry IDs can be selected as published theme defaults.",
    "missingAssetBehavior": "Asset-needed, blocked, invalid, unloaded, or unavailable theme content always preserves the existing native/approved fallback.",
    "commercialClaim": "A theme is not commercial-release-ready when a launch-critical surface is asset-needed or blocked."
  },
  "themes": [
    {
      "id": "froggy-feast",
      "label": "Froggy Feast (base theme)",
      "status": "supported",
      "composition": {
        "contentDefaults": {},
        "visualBindings": {
          "playerCharacter": {
            "targetId": "arcade.player.sprite-character",
            "contentItemId": null,
            "status": "native-default",
            "selectionPolicy": "player-customizable"
          },
          "primaryCollectible": {
            "targetId": "arcade.falling.food.apple",
            "contentItemId": null,
            "status": "native-default",
            "selectionPolicy": "player-customizable"
          },
          "hazard": {
            "targetId": "arcade.falling.hazard.bomb",
            "contentItemId": null,
            "status": "native-default",
            "selectionPolicy": "player-customizable"
          },
          "health": {
            "targetId": "arcade.falling.heart.red",
            "contentItemId": null,
            "status": "native-default",
            "selectionPolicy": "player-customizable"
          },
          "colonyUnit": {
            "targetId": "infinite.colony.unit",
            "contentItemId": null,
            "status": "native-default",
            "selectionPolicy": "native-only"
          },
          "colonyCollectible": {
            "targetId": "infinite.colony.collectible",
            "contentItemId": null,
            "status": "native-default",
            "selectionPolicy": "native-only"
          },
          "colonyBiome": {
            "targetId": "infinite.colony.biome",
            "contentItemId": null,
            "status": "native-default",
            "selectionPolicy": "native-only"
          },
          "colonyStation": {
            "targetId": "infinite.colony.station",
            "contentItemId": null,
            "status": "native-default",
            "selectionPolicy": "native-only"
          }
        }
      },
      "summary": {
        "counts": {
          "asset-needed": 0,
          "blocked": 4,
          "fallback-approved": 4,
          "native-default": 24,
          "ready": 0
        },
        "commercialReleaseReady": true,
        "artCompleteFourModeReady": false,
        "launchBlockerIds": [],
        "artCompleteBlockerIds": [
          "visual.colonyBiome",
          "visual.colonyCollectible",
          "visual.colonyStation",
          "visual.colonyUnit"
        ]
      },
      "surfaces": [
        {
          "id": "audio.collect",
          "family": "audio",
          "label": "collect",
          "status": "fallback-approved",
          "launchCritical": false,
          "artCompleteCritical": false,
          "fallback": "native-approved-audio",
          "note": "Native audio is explicitly approved until a themed audio asset is supplied."
        },
        {
          "id": "audio.hazard",
          "family": "audio",
          "label": "hazard",
          "status": "fallback-approved",
          "launchCritical": false,
          "artCompleteCritical": false,
          "fallback": "native-approved-audio",
          "note": "Native audio is explicitly approved until a themed audio asset is supplied."
        },
        {
          "id": "audio.menuMusic",
          "family": "audio",
          "label": "menuMusic",
          "status": "fallback-approved",
          "launchCritical": false,
          "artCompleteCritical": false,
          "fallback": "native-approved-audio",
          "note": "Native audio is explicitly approved until a themed audio asset is supplied."
        },
        {
          "id": "audio.uiConfirm",
          "family": "audio",
          "label": "uiConfirm",
          "status": "fallback-approved",
          "launchCritical": false,
          "artCompleteCritical": false,
          "fallback": "native-approved-audio",
          "note": "Native audio is explicitly approved until a themed audio asset is supplied."
        },
        {
          "id": "branding.appIcon",
          "family": "branding",
          "label": "Application icon",
          "status": "native-default",
          "launchCritical": false,
          "artCompleteCritical": false,
          "fallback": "native-product-branding",
          "note": "Base product branding remains native."
        },
        {
          "id": "branding.favicon",
          "family": "branding",
          "label": "Browser favicon",
          "status": "native-default",
          "launchCritical": false,
          "artCompleteCritical": false,
          "fallback": "native-product-branding",
          "note": "Base product branding remains native."
        },
        {
          "id": "branding.logo",
          "family": "branding",
          "label": "Brand logo",
          "status": "native-default",
          "launchCritical": false,
          "artCompleteCritical": false,
          "fallback": "native-product-branding",
          "note": "Base product branding remains native."
        },
        {
          "id": "branding.wordmark",
          "family": "branding",
          "label": "Brand wordmark",
          "status": "native-default",
          "launchCritical": false,
          "artCompleteCritical": false,
          "fallback": "native-product-branding",
          "note": "Base product branding remains native."
        },
        {
          "id": "mode.arcade.background",
          "family": "mode-presentation",
          "label": "arcade Entry background",
          "modeId": "arcade",
          "status": "native-default",
          "launchCritical": false,
          "artCompleteCritical": false,
          "fallback": "native-mode-presentation",
          "note": "Native mode presentation remains active until a theme asset is supplied."
        },
        {
          "id": "mode.arcade.entryCard",
          "family": "mode-presentation",
          "label": "arcade Entry card art",
          "modeId": "arcade",
          "status": "native-default",
          "launchCritical": false,
          "artCompleteCritical": false,
          "fallback": "native-mode-presentation",
          "note": "Native mode presentation remains active until a theme asset is supplied."
        },
        {
          "id": "mode.arcade.thumbnail",
          "family": "mode-presentation",
          "label": "arcade Entry thumbnail",
          "modeId": "arcade",
          "status": "native-default",
          "launchCritical": false,
          "artCompleteCritical": false,
          "fallback": "native-mode-presentation",
          "note": "Native mode presentation remains active until a theme asset is supplied."
        },
        {
          "id": "mode.feastfall.background",
          "family": "mode-presentation",
          "label": "feastfall Entry background",
          "modeId": "feastfall",
          "status": "native-default",
          "launchCritical": false,
          "artCompleteCritical": false,
          "fallback": "native-mode-presentation",
          "note": "Native mode presentation remains active until a theme asset is supplied."
        },
        {
          "id": "mode.feastfall.entryCard",
          "family": "mode-presentation",
          "label": "feastfall Entry card art",
          "modeId": "feastfall",
          "status": "native-default",
          "launchCritical": false,
          "artCompleteCritical": false,
          "fallback": "native-mode-presentation",
          "note": "Native mode presentation remains active until a theme asset is supplied."
        },
        {
          "id": "mode.feastfall.thumbnail",
          "family": "mode-presentation",
          "label": "feastfall Entry thumbnail",
          "modeId": "feastfall",
          "status": "native-default",
          "launchCritical": false,
          "artCompleteCritical": false,
          "fallback": "native-mode-presentation",
          "note": "Native mode presentation remains active until a theme asset is supplied."
        },
        {
          "id": "mode.infinite.background",
          "family": "mode-presentation",
          "label": "infinite Entry background",
          "modeId": "infinite",
          "status": "native-default",
          "launchCritical": false,
          "artCompleteCritical": false,
          "fallback": "native-mode-presentation",
          "note": "Native mode presentation remains active until a theme asset is supplied."
        },
        {
          "id": "mode.infinite.entryCard",
          "family": "mode-presentation",
          "label": "infinite Entry card art",
          "modeId": "infinite",
          "status": "native-default",
          "launchCritical": false,
          "artCompleteCritical": false,
          "fallback": "native-mode-presentation",
          "note": "Native mode presentation remains active until a theme asset is supplied."
        },
        {
          "id": "mode.infinite.thumbnail",
          "family": "mode-presentation",
          "label": "infinite Entry thumbnail",
          "modeId": "infinite",
          "status": "native-default",
          "launchCritical": false,
          "artCompleteCritical": false,
          "fallback": "native-mode-presentation",
          "note": "Native mode presentation remains active until a theme asset is supplied."
        },
        {
          "id": "mode.puzzle.background",
          "family": "mode-presentation",
          "label": "puzzle Entry background",
          "modeId": "puzzle",
          "status": "native-default",
          "launchCritical": false,
          "artCompleteCritical": false,
          "fallback": "native-mode-presentation",
          "note": "Native mode presentation remains active until a theme asset is supplied."
        },
        {
          "id": "mode.puzzle.entryCard",
          "family": "mode-presentation",
          "label": "puzzle Entry card art",
          "modeId": "puzzle",
          "status": "native-default",
          "launchCritical": false,
          "artCompleteCritical": false,
          "fallback": "native-mode-presentation",
          "note": "Native mode presentation remains active until a theme asset is supplied."
        },
        {
          "id": "mode.puzzle.thumbnail",
          "family": "mode-presentation",
          "label": "puzzle Entry thumbnail",
          "modeId": "puzzle",
          "status": "native-default",
          "launchCritical": false,
          "artCompleteCritical": false,
          "fallback": "native-mode-presentation",
          "note": "Native mode presentation remains active until a theme asset is supplied."
        },
        {
          "id": "scene.arcade",
          "family": "mode-scene",
          "label": "Arcade scene",
          "targetIds": [
            "arcade.player.sprite-character",
            "arcade.falling.food.apple",
            "arcade.falling.hazard.bomb",
            "arcade.falling.heart.red"
          ],
          "status": "native-default",
          "launchCritical": false,
          "artCompleteCritical": false,
          "fallback": "native-mode-scene",
          "note": "Base native scene art remains the approved default."
        },
        {
          "id": "scene.feastfall",
          "family": "mode-scene",
          "label": "Feastfall scene",
          "targetIds": [
            "connect3.tile.fruit",
            "connect3.hud.heart",
            "connect3.character.pedestal"
          ],
          "status": "native-default",
          "launchCritical": false,
          "artCompleteCritical": false,
          "fallback": "native-mode-scene",
          "note": "Base native scene art remains the approved default."
        },
        {
          "id": "scene.infinite",
          "family": "mode-scene",
          "label": "Infinite Feasts colony scene",
          "targetIds": [
            "infinite.colony.unit",
            "infinite.colony.collectible",
            "infinite.colony.biome",
            "infinite.colony.station"
          ],
          "status": "native-default",
          "launchCritical": false,
          "artCompleteCritical": false,
          "fallback": "native-mode-scene",
          "note": "Base native scene art remains the approved default."
        },
        {
          "id": "scene.puzzle",
          "family": "mode-scene",
          "label": "Puzzle scene",
          "targetIds": [
            "puzzle.frog.avatar",
            "puzzle.tile.fruit",
            "puzzle.tile.bomb",
            "puzzle.tile.door"
          ],
          "status": "native-default",
          "launchCritical": false,
          "artCompleteCritical": false,
          "fallback": "native-mode-scene",
          "note": "Base native scene art remains the approved default."
        },
        {
          "id": "visual.colonyBiome",
          "family": "content-target",
          "label": "colonyBiome",
          "role": "colonyBiome",
          "targetId": "infinite.colony.biome",
          "targetStatus": "planned",
          "rendererAdapter": null,
          "modeIds": [
            "infinite"
          ],
          "status": "blocked",
          "selectionPolicy": "native-only",
          "contentItemId": null,
          "launchCritical": false,
          "artCompleteCritical": true,
          "fallback": {
            "type": "nativeInfiniteSprite",
            "assetRoot": "assets/infinite/biomes/"
          },
          "note": "This target has no production-ready adapter/fallback contract for themed replacement."
        },
        {
          "id": "visual.colonyCollectible",
          "family": "content-target",
          "label": "colonyCollectible",
          "role": "colonyCollectible",
          "targetId": "infinite.colony.collectible",
          "targetStatus": "planned",
          "rendererAdapter": null,
          "modeIds": [
            "infinite"
          ],
          "status": "blocked",
          "selectionPolicy": "native-only",
          "contentItemId": null,
          "launchCritical": false,
          "artCompleteCritical": true,
          "fallback": {
            "type": "nativeInfiniteSprite",
            "assetRoot": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/"
          },
          "note": "This target has no production-ready adapter/fallback contract for themed replacement."
        },
        {
          "id": "visual.colonyStation",
          "family": "content-target",
          "label": "colonyStation",
          "role": "colonyStation",
          "targetId": "infinite.colony.station",
          "targetStatus": "planned",
          "rendererAdapter": null,
          "modeIds": [
            "infinite"
          ],
          "status": "blocked",
          "selectionPolicy": "native-only",
          "contentItemId": null,
          "launchCritical": false,
          "artCompleteCritical": true,
          "fallback": {
            "type": "nativeInfiniteSprite",
            "assetRoot": "assets/infinite/buildings/"
          },
          "note": "This target has no production-ready adapter/fallback contract for themed replacement."
        },
        {
          "id": "visual.colonyUnit",
          "family": "content-target",
          "label": "colonyUnit",
          "role": "colonyUnit",
          "targetId": "infinite.colony.unit",
          "targetStatus": "planned",
          "rendererAdapter": null,
          "modeIds": [
            "infinite"
          ],
          "status": "blocked",
          "selectionPolicy": "native-only",
          "contentItemId": null,
          "launchCritical": false,
          "artCompleteCritical": true,
          "fallback": {
            "type": "nativeInfiniteSprite",
            "assetRoot": "assets/infinite/frogs/"
          },
          "note": "This target has no production-ready adapter/fallback contract for themed replacement."
        },
        {
          "id": "visual.hazard",
          "family": "content-target",
          "label": "hazard",
          "role": "hazard",
          "targetId": "arcade.falling.hazard.bomb",
          "targetStatus": "supported",
          "rendererAdapter": "content.arcade.fallingEntity",
          "modeIds": [
            "arcade"
          ],
          "status": "native-default",
          "selectionPolicy": "player-customizable",
          "contentItemId": null,
          "launchCritical": false,
          "artCompleteCritical": true,
          "fallback": {
            "type": "nativeHazardMap",
            "assetKey": "hazard_bomb",
            "hazardId": "bomb",
            "visualKind": "bomb"
          },
          "note": "No theme content is selected; native renderer art remains active."
        },
        {
          "id": "visual.health",
          "family": "content-target",
          "label": "health",
          "role": "health",
          "targetId": "arcade.falling.heart.red",
          "targetStatus": "supported",
          "rendererAdapter": "content.arcade.fallingEntity",
          "modeIds": [
            "arcade"
          ],
          "status": "native-default",
          "selectionPolicy": "player-customizable",
          "contentItemId": null,
          "launchCritical": false,
          "artCompleteCritical": true,
          "fallback": {
            "type": "nativeVector",
            "visualKind": "heart-red",
            "assetKey": "pickup_heart_red"
          },
          "note": "No theme content is selected; native renderer art remains active."
        },
        {
          "id": "visual.playerCharacter",
          "family": "content-target",
          "label": "playerCharacter",
          "role": "playerCharacter",
          "targetId": "arcade.player.sprite-character",
          "targetStatus": "supported",
          "rendererAdapter": "content.arcade.classicCharacter",
          "modeIds": [
            "arcade"
          ],
          "status": "native-default",
          "selectionPolicy": "player-customizable",
          "contentItemId": null,
          "launchCritical": false,
          "artCompleteCritical": true,
          "fallback": {
            "type": "nativeCharacter",
            "characterId": "classic"
          },
          "note": "No theme content is selected; native renderer art remains active."
        },
        {
          "id": "visual.primaryCollectible",
          "family": "content-target",
          "label": "primaryCollectible",
          "role": "primaryCollectible",
          "targetId": "arcade.falling.food.apple",
          "targetStatus": "supported",
          "rendererAdapter": "content.arcade.fallingEntity",
          "modeIds": [
            "arcade"
          ],
          "status": "native-default",
          "selectionPolicy": "player-customizable",
          "contentItemId": null,
          "launchCritical": false,
          "artCompleteCritical": true,
          "fallback": {
            "type": "nativeFoodMap",
            "assetKey": "food_apple",
            "itemId": "food.apple",
            "visualKind": "apple"
          },
          "note": "No theme content is selected; native renderer art remains active."
        }
      ]
    }
  ]
};
  const freeze = value => {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      Object.values(value).forEach(freeze);
      Object.freeze(value);
    }
    return value;
  };
  const frozen = freeze(data);
  const byId = new Map(frozen.themes.map(theme => [theme.id, theme]));
  global.FROGGY_THEME_COVERAGE_REGISTRY = frozen;
  global.ThemeCoverageRegistry = Object.freeze({
    schemaVersion: frozen.schemaVersion,
    list: () => frozen.themes.slice(),
    get: themeId => byId.get(String(themeId || '')) || byId.get(frozen.defaultThemeId) || null,
    defaultThemeId: frozen.defaultThemeId,
  });
})(typeof globalThis !== 'undefined' ? globalThis : window);
