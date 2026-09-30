// ============================================================
// src/runtime/modes/arcade/arcade-sprite-runtime.js — Arcade standalone sprite pack boot
// ============================================================
// The full game gets sprite-pack wiring from main-boot.js. The Arcade
// standalone deliberately does not load src/runtime/app/main-boot.js, so it needs this small
// bridge to load the approved gameplay sprite sheets and expose the same
// renderer hooks consumed by src/runtime/rendering/draw-characters-3.js and game-loop.js.

const ArcadeSpriteRuntime = (() => {
  const PACK_PATHS = Object.freeze({
    default: 'assets/packs/default/manifest.json',
    'dark-theme': 'assets/packs/dark-theme/manifest.json',
  });

  // WO-003 preview profile: one canonical character, standard Arcade only.
  // The source donor remains unchanged; this package-local initializer avoids
  // loading unrelated character art and skips the optional JSON theme-pack
  // fetch that cannot succeed from the required opaque-origin sandbox.
  const PREVIEW_CHARACTER_IDS = Object.freeze(['toadal']);

  let currentAssetTheme = 'default';
  let initPromise = null;

  function isSpriteRenderedCharacter(characterId) {
    if (characterId === 'chameleon') return false;
    return Boolean(getArcadeCharacterBehaviorProfile(characterId));
  }

  function getSelectedSpriteCharacterId(characterId = null) {
    if (characterId) return characterId;
    if (typeof getCharDef === 'function') {
      const charDef = getCharDef();
      if (charDef && charDef.id) return charDef.id;
    }
    if (typeof GameState !== 'undefined' && GameState.selectedCharacterId) {
      return GameState.selectedCharacterId;
    }
    return 'classic';
  }

  function getActiveAssetPackName() {
    return typeof AssetPackLoader !== 'undefined' && typeof AssetPackLoader.getActivePack === 'function'
      ? AssetPackLoader.getActivePack()
      : currentAssetTheme;
  }

  function pickSpriteFrameAlias(frames, candidates, fallback) {
    for (const candidate of candidates) {
      if (frames[candidate]) return frames[candidate];
    }
    return fallback;
  }

  function normalizeCharacterSpriteFrames(character) {
    const frames = Object.assign({}, character?.frames || {});
    const firstFrame = Object.values(frames)[0] || 'idle';
    frames.idle = frames.idle || firstFrame;
    frames.eating = frames.eating || pickSpriteFrameAlias(frames, [
      'feeding', 'catching', 'chomping', 'happy', 'diving',
      'lunging', 'cloning', 'tongue_extended', 'leaning', 'sparkle',
    ], frames.idle);
    frames.moving = frames.moving || pickSpriteFrameAlias(frames, [
      'walking', 'flying', 'diving', 'lunging', 'jumping',
      'tongue_extended', 'dreaming', 'cooldown',
    ], frames.idle);
    return frames;
  }

  function buildCharacterSpriteDefinition(characterId) {
    if (typeof ASSET_REGISTRY === 'undefined') return null;
    if (!isSpriteRenderedCharacter(characterId)) return null;
    const character = ASSET_REGISTRY.characters && ASSET_REGISTRY.characters[characterId];
    if (!character) return null;
    const activePack = getActiveAssetPackName();
    return Object.assign({}, character, {
      id: characterId,
      spriteSheet: `${activePack}:${character.spriteSheet}`,
      frames: normalizeCharacterSpriteFrames(character),
    });
  }

  function initAvailableCharacterSpriteRenderers() {
    if (typeof SpriteRenderer === 'undefined' || typeof ASSET_REGISTRY === 'undefined') return 0;
    const activePack = getActiveAssetPackName();
    let initialized = 0;
    PREVIEW_CHARACTER_IDS.forEach(characterId => {
      const spriteDef = buildCharacterSpriteDefinition(characterId);
      if (!spriteDef) return;
      SpriteRenderer.initCharacter(`char_${characterId}`, spriteDef, activePack);
      initialized++;
    });
    return initialized;
  }

  function initPlayerSpriteRenderer(characterId = null) {
    if (typeof SpriteRenderer === 'undefined' || typeof ASSET_REGISTRY === 'undefined') return false;
    const selectedId = getSelectedSpriteCharacterId(characterId);
    const spriteDef = buildCharacterSpriteDefinition(selectedId);
    if (!spriteDef) return false;
    SpriteRenderer.initCharacter('player', spriteDef, getActiveAssetPackName());
    return true;
  }

  function finalizeThemeSwitch(target) {
    currentAssetTheme = PACK_PATHS[target] ? target : 'default';
    initAvailableCharacterSpriteRenderers();
    initPlayerSpriteRenderer();
  }

  async function switchTheme(themeName = 'default') {
    // AssetPackLoader's default manifest is optional and falls back to an
    // empty default pack when unavailable. In an opaque-origin iframe, fetch
    // of that same-site JSON is blocked by CORS; use the identical empty-pack
    // baseline directly rather than issue a guaranteed failing request.
    // Alternate themes are outside this single-character preview profile.
    void themeName;
    finalizeThemeSwitch('default');
    return true;
  }

  function requestedTheme() {
    try {
      const fromUrl = new URLSearchParams(location.search).get('theme');
      if (PACK_PATHS[fromUrl]) return fromUrl;
    } catch (_) {}
    try {
      const saved = typeof SettingsManager !== 'undefined' ? SettingsManager.get('assetTheme') : null;
      if (PACK_PATHS[saved]) return saved;
    } catch (_) {}
    return 'default';
  }

  function init() {
    if (initPromise) return initPromise;
    initPromise = switchTheme(requestedTheme());
    return initPromise;
  }

  return Object.freeze({
    init,
    switchTheme,
    isSpriteRenderedCharacter,
    initAvailableCharacterSpriteRenderers,
    initPlayerSpriteRenderer,
    getActiveAssetPackName,
  });
})();

if (typeof globalThis !== 'undefined') {
  globalThis.ArcadeSpriteRuntime = ArcadeSpriteRuntime;
  globalThis.isSpriteRenderedCharacter = ArcadeSpriteRuntime.isSpriteRenderedCharacter;
  globalThis.initAvailableCharacterSpriteRenderers = ArcadeSpriteRuntime.initAvailableCharacterSpriteRenderers;
  globalThis.initPlayerSpriteRenderer = ArcadeSpriteRuntime.initPlayerSpriteRenderer;
  globalThis.getActiveAssetPackName = ArcadeSpriteRuntime.getActiveAssetPackName;
  globalThis.switchArcadeStandaloneTheme = ArcadeSpriteRuntime.switchTheme;
}
