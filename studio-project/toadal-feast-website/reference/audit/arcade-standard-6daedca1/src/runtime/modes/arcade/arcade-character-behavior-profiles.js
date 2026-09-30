// ============================================================
// src/runtime/modes/arcade/arcade-character-behavior-profiles.js
// Authoritative Arcade behavior/presentation contract for every roster entry.
// Loaded after src/runtime/shared/characters.js and before gameplay/render consumers.
// Gameplay balance remains in CHARACTER_DATA/GAME_BALANCE; this file owns
// topology, input intent, collision policy, renderer routing, and diagnostics.
// ============================================================

const ArcadeCharacterBehaviorProfiles = (() => {
  const schemaVersion = 1;

  const RENDER_PRIORITY = Object.freeze({
    hybrid: Object.freeze(['dedicated-sprite', 'portrait-hybrid']),
    classic: Object.freeze(['dedicated-sprite', 'portrait-hybrid']),
  });

  const REQUIRED_FIELDS = Object.freeze([
    'locomotionFamily',
    'facingPolicy',
    'catchMechanism',
    'heldActionBehavior',
    'collisionShape',
    'presentationOverlays',
    'specialState',
    'mobileControlRequirements',
    'rendererPriority',
    'diagnosticFields',
    'playerGuide',
    'presentationContract',
  ]);

  function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
    return value;
  }

  const PRESENTATION_DEFAULTS = Object.freeze({
    statePriority: Object.freeze(['action', 'move', 'blink', 'neutral']),
    sizeClass: 'standard',
    allowHorizontalFlip: true,
    tongueOrigin: Object.freeze({ xOffset: 0, yOffset: null }),
    tongueStyle: 'classic',
    mouthSocket: Object.freeze({ xOffset: 0, yOffset: 10, width: 28, height: 12 }),
    mouthAperture: Object.freeze({
      mode: 'authored-body',
      xOffset: 0,
      yOffset: 0,
      width: 30,
      maxHeight: 7,
      insertionDepth: 7,
      lowerLipDepth: 3.2,
      interiorColor: '#32131f',
      edgeColor: 'rgba(54,12,28,0.82)',
      lowerLipColor: '#e7d557',
      lowerLipHighlight: 'rgba(255,245,160,0.42)',
      tongueWidthNear: 13.5,
      tongueWidthFar: 8.8,
    }),
    catchHoldRatio: 0.88,
    blinkDelaySeconds: 1.8,
    blinkIntervalSeconds: 5.4,
    blinkDurationSeconds: 0.72,
    preloadPolicy: 'selected-character',
    resultsPortraitPolicy: 'canonical-sad-treatment',
  });

  function profile(id, definition) {
    const presentationInput = definition?.presentationContract || {};
    const presentationContract = {
      ...PRESENTATION_DEFAULTS,
      ...presentationInput,
      statePriority: Array.isArray(presentationInput.statePriority)
        ? [...presentationInput.statePriority]
        : [...PRESENTATION_DEFAULTS.statePriority],
      tongueOrigin: {
        ...PRESENTATION_DEFAULTS.tongueOrigin,
        ...(presentationInput.tongueOrigin || {}),
      },
      mouthSocket: {
        ...PRESENTATION_DEFAULTS.mouthSocket,
        ...(presentationInput.mouthSocket || {}),
      },
      mouthAperture: {
        ...PRESENTATION_DEFAULTS.mouthAperture,
        ...(presentationInput.mouthAperture || {}),
      },
    };
    return deepFreeze({
      id,
      locomotionFamily: 'grounded-direct',
      facingPolicy: 'horizontal',
      catchMechanism: 'tongue-tip',
      catchTrigger: 'press',
      catchHandlerAbility: null,
      activeMouthOpen: 0.9,
      heldActionBehavior: 'none',
      collisionShape: { kind: 'tongue-points', radiusStat: 'catchRadius' },
      presentationOverlays: [],
      specialState: 'none',
      mobileControlRequirements: ['horizontal', 'primary-action'],
      rendererPolicy: 'hybrid',
      rendererPriority: RENDER_PRIORITY.hybrid,
      dedicatedRendererKey: null,
      spriteStateFamily: 'generic',
      diagnosticFields: ['locomotionFamily', 'facingPolicy', 'catchMechanism', 'rendererPolicy'],
      playerGuide: { movement: 'Move left / right', action: 'Press Space', catch: 'Shoot tongue' },
      ...definition,
      presentationContract,
    });
  }

  const definitions = {
    gulper: profile('gulper', {
      facingPolicy: 'front-locked',
      catchMechanism: 'gulper-mouth-rect',
      catchTrigger: 'hold',
      catchHandlerAbility: 'gulperCatch',
      activeMouthOpen: 0.72,
      heldActionBehavior: 'gulper-mouth',
      collisionShape: { kind: 'growth-scaled-rect', centerYOffset: -28, baseHalfWidth: 44, baseHalfHeight: 18 },
      presentationOverlays: ['growth-scale', 'growth-pulse'],
      specialState: 'gulper-growth',
      mobileControlRequirements: ['horizontal', 'hold-primary'],
      rendererPolicy: 'hybrid',
      rendererPriority: RENDER_PRIORITY.hybrid,
      dedicatedRendererKey: 'gulper',
      spriteStateFamily: 'gulper-complete-body-growth',
      diagnosticFields: ['catchMechanism', 'heldActionBehavior', 'specialState', 'foodsEaten', 'eatAnimTimer', 'mouthHeld'],
      playerGuide: { movement: 'Move left / right', action: 'Hold Space', catch: 'Classic: hold to open · FEAST FRENZY: hold to close' },
      presentationContract: { sizeClass:'large' },
    }),
    classic: profile('classic', {
      locomotionFamily: 'standard-frog',
      rendererPolicy: 'auto',
      rendererPriority: RENDER_PRIORITY.classic,
      dedicatedRendererKey: 'curated-highres',
      spriteStateFamily: 'classic-sheet',
      presentationContract: {
        allowHorizontalFlip:false,
        // Classic's authored body should remain steady during ordinary
        // presentation feedback. Catch, damage, movement, and tongue pulses
        // retain their positional/readability cues without inflating the
        // whole character between animation states.
        allowBodyScalePulse:false,
        tongueStyle:'classic',
        tongueOrigin:{ xOffset:0, yOffset:32 },
        mouthAperture:{ mode:'authored-body', width:31, maxHeight:7, insertionDepth:7, lowerLipColor:'#e6d34e', edgeColor:'rgba(49,78,16,0.78)' },
      },
    }),
    fire: profile('fire', {
      locomotionFamily: 'standard-frog',
      dedicatedRendererKey: 'curated-highres',
      presentationContract: {
        allowHorizontalFlip: false,
        tongueStyle:'fire',
        tongueOrigin: { xOffset: 0, yOffset: 32 },
        catchHoldRatio: 0.88,
        mouthAperture:{ mode:'authored-body', width:31, maxHeight:7, insertionDepth:7, lowerLipColor:'#ffe07c', edgeColor:'rgba(92,28,7,0.82)' },
      },
    }),
    ocean: profile('ocean', {
      locomotionFamily: 'standard-frog',
      dedicatedRendererKey: 'standard-frog-tongue',
      presentationContract: {
        allowHorizontalFlip: false,
        tongueStyle:'ocean',
        tongueOrigin: { xOffset: 0, yOffset: 32 },
        mouthAperture:{ mode:'authored-ocean', width:31, maxHeight:7, insertionDepth:7, lowerLipColor:'#c8f5ed', edgeColor:'rgba(6,49,78,0.82)' },
      },
    }),
    royal: profile('royal', {
      locomotionFamily: 'standard-frog',
      dedicatedRendererKey: 'curated-highres',
      presentationOverlays: ['belly-growth'],
      specialState: 'royal-belly-streak',
      diagnosticFields: ['catchMechanism', 'specialState', 'belly', 'streak', 'multiplier'],
      presentationContract: {
        allowHorizontalFlip:false, tongueStyle:'royal', tongueOrigin:{ xOffset:0, yOffset:34 },
        mouthAperture:{ mode:'authored-body', width:31, maxHeight:7, insertionDepth:7, lowerLipColor:'#f5e37e', edgeColor:'rgba(64,15,91,0.82)' },
      },
    }),
    ninja: profile('ninja', {
      locomotionFamily: 'standard-frog',
      heldActionBehavior: 'ninja-jump',
      presentationOverlays: ['jump-arc'],
      specialState: 'ninja-jump',
      mobileControlRequirements: ['horizontal', 'primary-action', 'hold-primary-jump'],
      diagnosticFields: ['catchMechanism', 'heldActionBehavior', 'jumping', 'jumpT', 'jumpCatchBonus'],
      playerGuide: { movement: 'Move left / right', action: 'Press or hold Space', catch: 'Tongue catch or jump' },
      presentationContract: {
        allowHorizontalFlip:false, tongueStyle:'ninja', tongueOrigin:{ xOffset:0, yOffset:32 },
        mouthAperture:{ mode:'under-mask', yOffset:1, width:20, maxHeight:5.5, insertionDepth:6, lowerLipDepth:2.4, interiorColor:'#160d19', edgeColor:'rgba(3,3,6,0.88)', lowerLipColor:'#25262b', lowerLipHighlight:'rgba(130,140,140,0.18)', tongueWidthNear:11.5, tongueWidthFar:7.8 },
      },
    }),
    golden: profile('golden', {
      locomotionFamily: 'standard-frog',
      presentationContract: {
        allowHorizontalFlip: false,
        tongueStyle:'golden',
        tongueOrigin: { xOffset: 0, yOffset: 32 },
        mouthAperture:{ mode:'overlay-slit', yOffset:0, width:30, maxHeight:7, insertionDepth:7, interiorColor:'#6e3208', edgeColor:'rgba(101,50,5,0.82)', lowerLipColor:'#e1a625', lowerLipHighlight:'rgba(255,232,104,0.44)' },
      },
    }),
    hippo: profile('hippo', {
      locomotionFamily: 'grounded-heavy',
      facingPolicy: 'horizontal-side-profile',
      catchMechanism: 'hippo-lunge-rect',
      catchTrigger: 'hold',
      catchHandlerAbility: 'heavyMovement',
      activeMouthOpen: 1.45,
      heldActionBehavior: 'hippo-lunge',
      collisionShape: { kind: 'facing-lunge-rect', radiusStat: 'catchRadius', distanceStat: 'lungeDistance', halfHeight: 40 },
      presentationOverlays: ['lunge'],
      specialState: 'hippo-lunge',
      mobileControlRequirements: ['horizontal', 'hold-primary'],
      diagnosticFields: ['catchMechanism', 'heldActionBehavior', 'lunging', 'mouthOpen', 'catchCooldown'],
      playerGuide: { movement: 'Move left / right', action: 'Hold Space', catch: 'Lunge and bite' },
      presentationContract: { sizeClass:'large' },
    }),
    chameleon: profile('chameleon', {
      locomotionFamily: 'front-special',
      facingPolicy: 'front-locked-lean',
      catchMechanism: 'hooked-tongue',
      activeMouthOpen: 0.25,
      collisionShape: { kind: 'hooked-tongue-points', radiusStat: 'catchRadius' },
      presentationOverlays: ['hooked-tongue'],
      specialState: 'chameleon-shot',
      dedicatedRendererKey: 'chameleon',
      diagnosticFields: ['catchMechanism', 'specialState', 'caughtThisShot', 'catchAnimTimer', 'missAnimTimer'],
      playerGuide: { movement: 'Move left / right', action: 'Press Space', catch: 'Fire hooked tongue' },
      presentationContract: { sizeClass:'compact' },
    }),
    pelican: profile('pelican', {
      locomotionFamily: 'airborne-gully',
      facingPolicy: 'airborne-crossfade',
      catchMechanism: 'gully-pouch-circle',
      catchTrigger: 'passive',
      catchHandlerAbility: 'flyingCatch',
      activeMouthOpen: 1.1,
      collisionShape: { kind: 'circle', radiusStat: 'catchRadius' },
      presentationOverlays: ['air-shadow', 'pouch-full'],
      specialState: 'gully-flight',
      mobileControlRequirements: ['four-direction'],
      dedicatedRendererKey: 'pelican',
      diagnosticFields: ['catchMechanism', 'specialState', 'flightVx', 'flightVy', 'facingBlend', 'pouchFull'],
      playerGuide: { movement: 'Fly in 4 directions', action: 'No action button', catch: 'Scoop food in flight' },
      presentationContract: { sizeClass:'compact' },
    }),
    flytrap: profile('flytrap', {
      locomotionFamily: 'front-special',
      facingPolicy: 'front-locked-lean',
      catchMechanism: 'flytrap-snap-circle',
      catchTrigger: 'passive',
      catchHandlerAbility: 'snapJaw',
      activeMouthOpen: 1.15,
      collisionShape: { kind: 'circle', radiusStat: 'catchRadius' },
      presentationOverlays: ['independent-clone'],
      specialState: 'flytrap-clone',
      mobileControlRequirements: ['horizontal', 'clone-pickup', 'clone-place'],
      dedicatedRendererKey: 'flytrap',
      diagnosticFields: ['catchMechanism', 'specialState', 'cloneHeld', 'cloneX', 'cloneY', 'cloneAction'],
      playerGuide: { movement: 'Move left / right', action: 'Up: pick up · Down: plant', catch: 'Snap with both plants' },
      presentationContract: { sizeClass:'special' },
    }),
    count: profile('count', {
      locomotionFamily: 'standard-frog',
      dedicatedRendererKey: 'curated-highres',
      catchMechanism: 'count-feed-circle',
      catchTrigger: 'passive',
      catchHandlerAbility: 'vampireFeed',
      collisionShape: { kind: 'circle', radiusStat: 'catchRadius', includeJumpBonus: true },
      presentationOverlays: ['blood-feed'],
      specialState: 'count-feed',
      mobileControlRequirements: ['horizontal'],
      diagnosticFields: ['catchMechanism', 'specialState', 'lives', 'combo'],
      playerGuide: { movement: 'Move left / right', action: 'No action button', catch: 'Catch hearts, avoid food' },
      presentationContract: { allowHorizontalFlip:false, tongueOrigin:{ xOffset:0, yOffset:30 } },
    }),
    bob: profile('bob', {
      locomotionFamily: 'front-special',
      facingPolicy: 'front-locked-lean',
      catchMechanism: 'bob-basket-rect',
      catchTrigger: 'passive',
      catchHandlerAbility: 'basketCatch',
      heldActionBehavior: 'bob-lean',
      collisionShape: { kind: 'lean-rect', radiusStat: 'catchRadius', leanBonusStat: 'basketLeanBonus', halfHeight: 30 },
      presentationOverlays: ['basket-load', 'bank-chest'],
      specialState: 'bob-basket',
      mobileControlRequirements: ['horizontal', 'hold-primary'],
      dedicatedRendererKey: 'bob',
      diagnosticFields: ['catchMechanism', 'heldActionBehavior', 'leanAmt', 'basketItems', 'bankedItems', 'chestAnim'],
      playerGuide: { movement: 'Move left / right', action: 'Hold Space', catch: 'Lean basket forward' },
      presentationContract: { sizeClass:'large' },
    }),
    chomper: profile('chomper', {
      facingPolicy: 'horizontal-side-profile',
      catchMechanism: 'chomper-mouth-rect',
      catchTrigger: 'passive',
      catchHandlerAbility: 'chomperCatch',
      collisionShape: { kind: 'rect', radiusStat: 'catchRadius', halfHeight: 40, centerYOffset: -20 },
      presentationOverlays: ['short-chomp'],
      specialState: 'chomper-chomp',
      mobileControlRequirements: ['horizontal'],
      dedicatedRendererKey: 'chomper',
      diagnosticFields: ['catchMechanism', 'specialState', 'chomping', 'chompTimer', 'chompAnimTimer'],
      playerGuide: { movement: 'Move left / right', action: 'Automatic', catch: 'Bite falling food' },
      presentationContract: { sizeClass:'compact' },
    }),
    toadal: profile('toadal', {
      locomotionFamily: 'standard-frog',
      facingPolicy: 'horizontal',
      catchMechanism: 'toadal-contact-circle',
      catchTrigger: 'passive',
      catchHandlerAbility: 'toadalPassiveEat',
      activeMouthOpen: 0.7,
      heldActionBehavior: 'none',
      collisionShape: { kind: 'circle', radiusStat: 'catchRadius', centerYOffset: -46 },
      presentationOverlays: ['toadal-golden-charge', 'toadal-blocks', 'toadal-projectiles'],
      specialState: 'toadal-golden-kit',
      mobileControlRequirements: ['horizontal', 'toadal-crouch-hop', 'toadal-tongue', 'toadal-throw', 'toadal-block'],
      dedicatedRendererKey: 'toadal',
      spriteStateFamily: 'toadal-arcade',
      diagnosticFields: ['catchMechanism', 'specialState', 'charge', 'grounded', 'crouchHeld', 'crouchChargeRatio', 'lastHopSpeed', 'supportBlockId', 'blockCount', 'projectileCount', 'throwActive', 'buildActive'],
      playerGuide: { movement: 'Move left / right · Hold Down/S, release to spring', action: 'Space tongue · Q Throw · E Block', catch: 'Body catches build Golden Charge · Tongue reaches farther without charge' },
      presentationContract: { sizeClass:'standard', allowHorizontalFlip:true, tongueOrigin:{ xOffset:0, yOffset:45 } },
    }),
    princess: profile('princess', {
      locomotionFamily: 'standard-frog',
      dedicatedRendererKey: 'curated-highres',
      presentationOverlays: ['zen-transform', 'sparkle'],
      specialState: 'princess-zen',
      diagnosticFields: ['catchMechanism', 'specialState', 'transformTier', 'sparkle'],
      presentationContract: {
        allowHorizontalFlip:false, tongueStyle:'princess', tongueOrigin:{ xOffset:0, yOffset:34 },
        mouthAperture:{ mode:'authored-body', width:31, maxHeight:7, insertionDepth:7, lowerLipColor:'#f3e49a', edgeColor:'rgba(92,17,58,0.82)' },
      },
    }),
  };

  const profiles = deepFreeze({ ...definitions });
  const profileIds = deepFreeze(Object.keys(profiles));

  function normalizeId(characterOrId) {
    if (characterOrId && typeof characterOrId === 'object') return String(characterOrId.id || '');
    return String(characterOrId || '');
  }

  function get(characterOrId) {
    return profiles[normalizeId(characterOrId)] || null;
  }

  function requireProfile(characterOrId) {
    const resolved = get(characterOrId);
    if (!resolved) throw new Error(`Missing Arcade behavior profile for "${normalizeId(characterOrId)}".`);
    return resolved;
  }

  function list() {
    return Object.values(profiles);
  }

  function ids() {
    return profileIds;
  }

  function validateRoster(roster) {
    const source = Array.isArray(roster) ? roster : [];
    const rosterIds = source.map(character => String(character?.id || '')).filter(Boolean);
    const profileIds = Object.keys(profiles);
    const missing = rosterIds.filter(id => !profiles[id]);
    const extra = profileIds.filter(id => !rosterIds.includes(id));
    const incomplete = profileIds.flatMap(id => REQUIRED_FIELDS.filter(field => profiles[id][field] === undefined).map(field => `${id}.${field}`));
    const duplicateRosterIds = rosterIds.filter((id, index) => rosterIds.indexOf(id) !== index);
    return deepFreeze({
      ok: missing.length === 0 && extra.length === 0 && incomplete.length === 0 && duplicateRosterIds.length === 0,
      rosterCount: rosterIds.length,
      profileCount: profileIds.length,
      missing,
      extra,
      incomplete,
      duplicateRosterIds: [...new Set(duplicateRosterIds)],
    });
  }

  function playerGuide(characterOrId) {
    return requireProfile(characterOrId).playerGuide;
  }

  function diagnostics(characterOrId, state = {}) {
    const resolved = requireProfile(characterOrId);
    const values = Object.fromEntries(resolved.diagnosticFields.map(field => [field, state?.[field]]));
    return deepFreeze({
      characterId: resolved.id,
      locomotionFamily: resolved.locomotionFamily,
      facingPolicy: resolved.facingPolicy,
      catchMechanism: resolved.catchMechanism,
      rendererPolicy: resolved.rendererPolicy,
      values,
    });
  }

  const rosterValidation = validateRoster(typeof CHARACTER_DATA !== 'undefined' ? CHARACTER_DATA : []);
  if (!rosterValidation.ok && typeof CHARACTER_DATA !== 'undefined') {
    throw new Error(`Arcade behavior profile roster mismatch: ${JSON.stringify(rosterValidation)}`);
  }

  return deepFreeze({
    schemaVersion,
    requiredFields: REQUIRED_FIELDS,
    get,
    require: requireProfile,
    list,
    ids,
    validateRoster,
    diagnostics,
    playerGuide,
    rosterValidation,
  });
})();

function getArcadeCharacterBehaviorProfile(characterOrId) {
  return ArcadeCharacterBehaviorProfiles.get(characterOrId);
}
