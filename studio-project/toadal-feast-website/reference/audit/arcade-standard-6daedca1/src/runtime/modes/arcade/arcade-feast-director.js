// ============================================================
// arcade-feast-director.js — Living Feast Director Lite
// ============================================================
// Standard Arcade presentation and wave-identity coordinator.
// It generates one deterministic plan per wave, exposes a restrained forecast
// food preference, owns visual chapter transitions, and emits presentation-only
// milestone events. It does not award score, coins, mission progress, lives, or
// alter collision geometry.

const ArcadeLivingFeastDirector = (() => {
  const FORECASTS = Object.freeze({
    CALM: 'calm-course',
    FAVOURITE: 'favourite-rush',
    FORMATION: 'feast-formation',
    HAZARD: 'hazard-warning',
  });
  const FORMATIONS = Object.freeze({
    NORMAL: 'normal',
    FOOD_TRAIN: 'food-train',
    TWIN_STREAMS: 'twin-streams',
    GRAND_FEAST: 'grand-feast',
  });
  const CHAPTERS = Object.freeze({
    MORNING: 'morning-pond',
    SUNSET: 'sunset-picnic',
    MOONLIT: 'moonlit-festival',
    GRAND: 'grand-feast',
    DREAM: 'dream-feast',
  });

  const LEGACY_CHARACTER_FAVOURITES = Object.freeze({
    classic: Object.freeze({ label:'Fruit Bloom', itemIds:Object.freeze([]), categories:Object.freeze(['fruit']) }),
    fire: Object.freeze({ label:'Hot Plate Rush', itemIds:Object.freeze(['food.pizza','food.burger','food.fries','food.fried-chicken','food.steak']), categories:Object.freeze(['meal']) }),
    ocean: Object.freeze({ label:'Tropical Tide', itemIds:Object.freeze(['food.coconut','food.pineapple','food.mango','food.watermelon-slice']), categories:Object.freeze(['fruit']) }),
    royal: Object.freeze({ label:'Royal Dessert Parade', itemIds:Object.freeze([]), categories:Object.freeze(['dessert']) }),
    ninja: Object.freeze({ label:'Sushi Current', itemIds:Object.freeze(['food.maki-roll','food.salmon-nigiri','food.shrimp-nigiri']), categories:Object.freeze([]) }),
    golden: Object.freeze({ label:'Golden Treat Rush', itemIds:Object.freeze(['food.donut','food.cupcake']), categories:Object.freeze(['dessert','breakfast']) }),
    princess: Object.freeze({ label:'Candy Drizzle', itemIds:Object.freeze(['food.hard-candy','food.chocolate','food.donut','food.cookie','food.cupcake']), categories:Object.freeze(['dessert']) }),
    chomper: Object.freeze({ label:'Drive-Thru Rush', itemIds:Object.freeze(['food.burger','food.fries','food.pizza','food.fried-chicken','food.pretzel','food.cheese']), categories:Object.freeze(['meal','snack']) }),
    hippo: Object.freeze({ label:'Big Fruit Bowl', itemIds:Object.freeze(['food.watermelon-slice','food.pineapple','food.coconut']), categories:Object.freeze(['fruit']) }),
    chameleon: Object.freeze({ label:'Colour Feast', itemIds:Object.freeze(['food.strawberry','food.blueberry','food.lemon','food.avocado']), categories:Object.freeze(['fruit','veg']) }),
    gully: Object.freeze({ label:'Boardwalk Bites', itemIds:Object.freeze(['food.fries','food.pretzel','food.maki-roll']), categories:Object.freeze(['snack','meal']) }),
    pelican: Object.freeze({ label:'Boardwalk Bites', itemIds:Object.freeze(['food.fries','food.pretzel','food.maki-roll']), categories:Object.freeze(['snack','meal']) }),
    count: Object.freeze({ label:'Midnight Sweets', itemIds:Object.freeze(['food.strawberry','food.cherry','food.red-velvet-cake']), categories:Object.freeze(['dessert','fruit']) }),
    flytrap: Object.freeze({ label:'Garden Harvest', itemIds:Object.freeze(['food.carrot','food.broccoli','food.tomato','food.chili-pepper']), categories:Object.freeze(['veg']) }),
    bob: Object.freeze({ label:'Picnic Basket', itemIds:Object.freeze(['food.apple','food.pear','food.pretzel','food.cheese']), categories:Object.freeze(['fruit','snack']) }),
    gulper: Object.freeze({ label:'Giant Feast', itemIds:Object.freeze(['food.watermelon-slice','food.pizza','food.burger']), categories:Object.freeze(['fruit','meal']) }),
  });
  const CHARACTER_FAVOURITES = typeof ARCADE_CHARACTER_FAVOURITE_PROFILES !== 'undefined'
    ? ARCADE_CHARACTER_FAVOURITE_PROFILES
    : LEGACY_CHARACTER_FAVOURITES;

  const favouriteFoodPools = new WeakMap();

  const state = {
    seed: 1,
    characterId: 'classic',
    plans: new Map(),
    currentPlan: null,
    previousChapter: CHAPTERS.MORNING,
    currentChapter: CHAPTERS.MORNING,
    chapterBlend: 1,
    announcementElapsed: 99,
    recordPulse: 0,
    orderPulse: 0,
    priorBestScore: 0,
    recordCelebrated: false,
    orderDecoration: false,
    encoreActive: false,
  };

  const presentationView = Object.freeze({
    // Presentation consumers may use the run seed for deterministic visual
    // variation. It is deliberately read-only and never feeds gameplay RNG.
    get seed() { return state.seed; },
    get currentChapter() { return state.currentChapter; },
    get previousChapter() { return state.previousChapter; },
    get chapterBlend() { return state.chapterBlend; },
    get recordPulse() { return state.recordPulse; },
    get orderPulse() { return state.orderPulse; },
    get orderDecoration() { return state.orderDecoration; },
    get currentPlan() { return state.currentPlan; },
    get encoreActive() { return state.encoreActive; },
  });

  const announcementView = Object.freeze({
    get title() { return state.currentPlan?.title || ''; },
    get subtitle() { return state.currentPlan?.subtitle || ''; },
    get icon() { return state.currentPlan?.icon || ''; },
    get alpha() {
      const elapsed = state.announcementElapsed;
      return elapsed < 0.18 ? elapsed / 0.18 : elapsed > 1.05 ? Math.max(0, (1.35 - elapsed) / 0.30) : 1;
    },
    get milestone() { return state.currentPlan?.milestone || null; },
    get forecast() { return state.currentPlan?.forecast || null; },
  });

  function safeInt(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : fallback;
  }

  function hashString(value) {
    let hash = 2166136261;
    const text = String(value || '');
    for (let index = 0; index < text.length; index++) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function makeRng(seed) {
    let value = (safeInt(seed, 1) || 1) >>> 0;
    return () => {
      value += 0x6D2B79F5;
      let t = value;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function chapterForWave(wave, encoreActive = false) {
    if (encoreActive || wave > 10) return CHAPTERS.DREAM;
    if (wave >= 10) return CHAPTERS.GRAND;
    if (wave >= 7) return CHAPTERS.MOONLIT;
    if (wave >= 4) return CHAPTERS.SUNSET;
    return CHAPTERS.MORNING;
  }

  function favouriteProfile(characterId) {
    if (typeof getArcadeFavouriteProfile === 'function') return getArcadeFavouriteProfile(characterId);
    return CHARACTER_FAVOURITES[String(characterId || '')] || CHARACTER_FAVOURITES.classic;
  }

  function forecastPresentation(forecast, characterId, milestone) {
    const favourite = favouriteProfile(characterId);
    if (milestone === 'halfway-feast') {
      return Object.freeze({ title:'HALFWAY FEAST', subtitle:`${favourite.label} is arriving.`, icon:'5' });
    }
    if (milestone === 'grand-feast') {
      return Object.freeze({ title:'GRAND FEAST', subtitle:'The final course begins!', icon:'10' });
    }
    if (forecast === FORECASTS.FAVOURITE) {
      return Object.freeze({ title:favourite.label.toUpperCase(), subtitle:'Favourite foods are more likely this wave.', icon:'FAV' });
    }
    if (forecast === FORECASTS.FORMATION) {
      return Object.freeze({ title:'FEAST FORMATION', subtitle:'Watch the pattern and choose your catches.', icon:'FORM' });
    }
    if (forecast === FORECASTS.HAZARD) {
      return Object.freeze({ title:'HAZARD WARNING', subtitle:'Bombs are slightly more active. Stay sharp.', icon:'!' });
    }
    return Object.freeze({ title:'CALM COURSE', subtitle:'A steady mixed course before the next rush.', icon:'' });
  }

  function makePlan({ wave, chapter, forecast, formation, milestone = null, seed, characterId, encore = false }) {
    const presentation = forecastPresentation(forecast, characterId, milestone);
    const favourite = favouriteProfile(characterId);
    return Object.freeze({
      wave,
      seed: seed >>> 0,
      chapter,
      forecast,
      formation,
      milestone,
      encore,
      title: presentation.title,
      subtitle: presentation.subtitle,
      icon: presentation.icon,
      featuredItemIds: forecast === FORECASTS.FAVOURITE ? favourite.itemIds : Object.freeze([]),
      featuredCategories: forecast === FORECASTS.FAVOURITE ? favourite.categories : Object.freeze([]),
      forecastFoodChance: forecast === FORECASTS.FAVOURITE ? 0.30 : 0,
      hazardMultiplier: forecast === FORECASTS.HAZARD ? 1.20 : 1,
    });
  }

  function chooseForecast(rng, context) {
    const options = [FORECASTS.CALM, FORECASTS.FORMATION];
    if (context.hazardCount < 2) options.push(FORECASTS.HAZARD);
    const mayUseFavourite = context.favouriteCount < 2
      && !(context.wave < 5 && context.favouriteCount >= 1)
      && context.wave !== 4;
    if (mayUseFavourite) options.push(FORECASTS.FAVOURITE);
    let filtered = options.filter(candidate => {
      if (candidate === FORECASTS.HAZARD && (context.lastForecast === FORECASTS.HAZARD || context.wave <= 2)) return false;
      if (candidate === FORECASTS.FAVOURITE && context.lastForecast === FORECASTS.FAVOURITE) return false;
      return true;
    });
    if (!filtered.length) filtered = [FORECASTS.CALM];
    // Calm receives a little more weight so intense waves naturally breathe.
    const weighted = [];
    filtered.forEach(candidate => {
      weighted.push(candidate);
      if (candidate === FORECASTS.CALM) weighted.push(candidate);
    });
    return weighted[Math.floor(rng() * weighted.length)] || FORECASTS.CALM;
  }

  function chooseFormation(rng, forecast, lastFormation, repeatedCount, wave) {
    if (forecast === FORECASTS.CALM || forecast === FORECASTS.HAZARD) return FORMATIONS.NORMAL;
    const candidates = forecast === FORECASTS.FORMATION
      ? [FORMATIONS.FOOD_TRAIN, FORMATIONS.TWIN_STREAMS]
      : [FORMATIONS.NORMAL, FORMATIONS.FOOD_TRAIN, FORMATIONS.TWIN_STREAMS];
    let filtered = repeatedCount >= 2 ? candidates.filter(item => item !== lastFormation) : candidates;
    if (!filtered.length) filtered = [FORMATIONS.NORMAL];
    return filtered[(Math.floor(rng() * filtered.length) + wave) % filtered.length] || FORMATIONS.NORMAL;
  }

  function buildRunPlan(seed, characterId = 'classic') {
    const runSeed = (safeInt(seed, 1) || 1) >>> 0;
    const rng = makeRng((runSeed ^ hashString(characterId)) >>> 0);
    const plans = [];
    let lastForecast = null;
    let lastFormation = null;
    let repeatedFormation = 0;
    let favouriteCount = 0;
    let hazardCount = 0;

    for (let wave = 1; wave <= 10; wave++) {
      let forecast;
      let formation;
      let milestone = null;
      if (wave === 1) {
        forecast = FORECASTS.CALM;
        formation = FORMATIONS.NORMAL;
      } else if (wave === 5) {
        forecast = FORECASTS.FAVOURITE;
        formation = lastFormation === FORMATIONS.FOOD_TRAIN && repeatedFormation >= 2
          ? FORMATIONS.TWIN_STREAMS
          : FORMATIONS.FOOD_TRAIN;
        milestone = 'halfway-feast';
      } else if (wave === 10) {
        forecast = FORECASTS.FORMATION;
        formation = FORMATIONS.GRAND_FEAST;
        milestone = 'grand-feast';
      } else {
        forecast = chooseForecast(rng, { wave, lastForecast, favouriteCount, hazardCount });
        formation = chooseFormation(rng, forecast, lastFormation, repeatedFormation, wave);
      }
      if (forecast === FORECASTS.FAVOURITE) favouriteCount++;
      if (forecast === FORECASTS.HAZARD) hazardCount++;
      repeatedFormation = formation === lastFormation ? repeatedFormation + 1 : 1;
      const plan = makePlan({
        wave,
        chapter: chapterForWave(wave, false),
        forecast,
        formation,
        milestone,
        seed: runSeed ^ Math.imul(wave, 2654435761),
        characterId,
      });
      plans.push(plan);
      lastForecast = forecast;
      lastFormation = formation;
    }
    return Object.freeze(plans);
  }

  function buildEncorePlan(wave, seed = state.seed, characterId = state.characterId) {
    const safeWave = Math.max(11, safeInt(wave, 11));
    const rng = makeRng((seed ^ Math.imul(safeWave, 2246822519)) >>> 0);
    const sequence = [FORECASTS.FORMATION, FORECASTS.FAVOURITE, FORECASTS.CALM, FORECASTS.HAZARD];
    const forecast = sequence[(safeWave + Math.floor(rng() * sequence.length)) % sequence.length];
    const formation = forecast === FORECASTS.HAZARD || forecast === FORECASTS.CALM
      ? FORMATIONS.NORMAL
      : (rng() < 0.5 ? FORMATIONS.FOOD_TRAIN : FORMATIONS.TWIN_STREAMS);
    return makePlan({
      wave: safeWave,
      chapter: CHAPTERS.DREAM,
      forecast,
      formation,
      seed: seed ^ Math.imul(safeWave, 3266489917),
      characterId,
      encore: true,
    });
  }

  function deriveRunSeed() {
    const dateKey = new Date().toISOString().slice(0, 10);
    const charId = String(typeof getCharDef === 'function' ? getCharDef()?.id || 'classic' : state.characterId);
    const entropy = `${dateKey}:${charId}:${Date.now()}:${Math.floor(Math.random() * 1e9)}`;
    return hashString(entropy) || 1;
  }

  function applyPlan(plan, { announce = true } = {}) {
    if (!plan) return null;
    const chapterChanged = state.currentChapter !== plan.chapter;
    state.previousChapter = chapterChanged ? state.currentChapter : plan.chapter;
    state.currentChapter = plan.chapter;
    state.chapterBlend = chapterChanged && !(typeof SETTINGS !== 'undefined' && SETTINGS.reduceMotion) ? 0 : 1;
    state.currentPlan = plan;
    state.plans.set(plan.wave, plan);
    if (announce) state.announcementElapsed = 0;
    if (typeof EventBus !== 'undefined') EventBus.emit('livingFeastWavePlan', plan);
    if (plan.milestone && typeof EventBus !== 'undefined') EventBus.emit('livingFeastMilestone', plan);
    return plan;
  }

  function startRun(options = {}) {
    state.seed = (safeInt(options.seed, 0) || deriveRunSeed()) >>> 0;
    state.characterId = String(options.characterId || (typeof getCharDef === 'function' ? getCharDef()?.id : '') || 'classic');
    state.plans.clear();
    state.currentPlan = null;
    state.encoreActive = false;
    state.recordPulse = 0;
    state.orderPulse = 0;
    state.recordCelebrated = false;
    state.orderDecoration = false;
    state.priorBestScore = safeInt(options.priorBestScore, typeof SaveManager !== 'undefined' ? SaveManager.get()?.bestScore : 0);
    const runPlans = buildRunPlan(state.seed, state.characterId);
    runPlans.forEach(plan => state.plans.set(plan.wave, plan));
    state.currentChapter = CHAPTERS.MORNING;
    state.previousChapter = CHAPTERS.MORNING;
    state.chapterBlend = 1;
    return applyWave(safeInt(options.wave, 1) || 1, { announce: options.announce !== false });
  }

  function applyWave(wave, options = {}) {
    const safeWave = Math.max(1, safeInt(wave, 1));
    const encore = options.encore === true || state.encoreActive || safeWave > 10;
    if (encore) state.encoreActive = true;
    const plan = encore
      ? buildEncorePlan(safeWave, state.seed, state.characterId)
      : (state.plans.get(safeWave) || buildRunPlan(state.seed, state.characterId)[safeWave - 1]);
    if (state.currentPlan
      && state.currentPlan.wave === plan?.wave
      && state.currentPlan.seed === plan?.seed
      && state.currentPlan.encore === plan?.encore) {
      return state.currentPlan;
    }
    return applyPlan(plan, options);
  }

  function update(dt) {
    if (typeof GameState !== 'undefined' && GameState.currentMode !== 'standard') return;
    const delta = Math.max(0, Math.min(0.1, Number(dt) || 0));
    state.announcementElapsed += delta;
    state.chapterBlend = typeof SETTINGS !== 'undefined' && SETTINGS.reduceMotion
      ? 1
      : Math.min(1, state.chapterBlend + delta / 1.25);
    state.recordPulse = Math.max(0, state.recordPulse - delta);
    state.orderPulse = Math.max(0, state.orderPulse - delta);

    if (!state.recordCelebrated && typeof GameState !== 'undefined' && Number(GameState.score) > state.priorBestScore && state.priorBestScore > 0) {
      state.recordCelebrated = true;
      state.recordPulse = 1.4;
      if (typeof EventBus !== 'undefined') EventBus.emit('livingFeastRecordBroken', { score:GameState.score, previousBest:state.priorBestScore });
    }
  }

  function getPlan(wave = null) {
    if (wave == null && state.currentPlan) return state.currentPlan;
    const targetWave = wave == null
      ? (typeof GameState !== 'undefined' ? safeInt(GameState.level, 1) : 1)
      : Math.max(1, safeInt(wave, 1));
    if (state.currentPlan?.wave === targetWave) return state.currentPlan;
    if (targetWave > 10 || state.encoreActive) return buildEncorePlan(targetWave, state.seed, state.characterId);
    return state.plans.get(targetWave) || null;
  }

  function getAnnouncement() {
    if (!state.currentPlan || state.announcementElapsed > 1.35) return null;
    return announcementView;
  }

  function getPresentationState() {
    return presentationView;
  }

  function validFoodIds(plan) {
    if (!plan || plan.forecast !== FORECASTS.FAVOURITE || typeof ARCADE_FOOD_DEFINITIONS === 'undefined') return Object.freeze([]);
    const cached = favouriteFoodPools.get(plan);
    if (cached) return cached;
    const exact = new Set(Array.isArray(plan.featuredItemIds) ? plan.featuredItemIds : []);
    const categories = new Set(Array.isArray(plan.featuredCategories) ? plan.featuredCategories : []);
    const pool = Object.freeze(ARCADE_FOOD_DEFINITIONS
      .filter(food => exact.has(food.itemId) || categories.has(food.category))
      .map(food => food.itemId));
    favouriteFoodPools.set(plan, pool);
    return pool;
  }

  function pickForecastFoodId(characterId, fallbackPicker = null, rng = Math.random) {
    const fallback = typeof fallbackPicker === 'function'
      ? fallbackPicker
      : () => (typeof randomArcadeFoodId === 'function' ? randomArcadeFoodId() : 'food.apple');
    const plan = getPlan();
    if (!plan || plan.forecast !== FORECASTS.FAVOURITE) return fallback();
    const roll = Math.max(0, Math.min(0.999999999, Number(rng()) || 0));
    if (roll >= plan.forecastFoodChance) return fallback();
    const pool = validFoodIds(plan);
    if (!pool.length) return fallback();
    const index = Math.floor(Math.max(0, Math.min(0.999999999, Number(rng()) || 0)) * pool.length);
    return pool[index] || fallback();
  }

  function adjustHazardChance(baseChance) {
    const base = Math.max(0, Math.min(0.5, Number(baseChance) || 0));
    const plan = getPlan();
    if (!plan || plan.forecast !== FORECASTS.HAZARD) return base;
    return Math.min(0.38, base * plan.hazardMultiplier);
  }

  function isActive() {
    return typeof GameState !== 'undefined' && GameState.currentMode === 'standard';
  }

  function bind() {
    if (typeof EventBus === 'undefined') return;
    EventBus.on('gameStarted', () => {
      if (typeof GameState === 'undefined' || GameState.currentMode !== 'standard') {
        state.currentPlan = null;
        return;
      }
      startRun({ characterId:typeof getCharDef === 'function' ? getCharDef()?.id : GameState.selectedCharacterId, wave:GameState.level, announce:true });
    });
    EventBus.on('levelUp', payload => {
      if (typeof GameState === 'undefined' || GameState.currentMode !== 'standard') return;
      applyWave(payload?.level || GameState.level, { announce:true });
    });
    EventBus.on('encoreStarted', () => {
      state.encoreActive = true;
      applyWave(Math.max(11, typeof GameState !== 'undefined' ? safeInt(GameState.level, 10) + 1 : 11), { announce:true, encore:true });
    });
    EventBus.on('feastOrderCompleted', () => {
      state.orderDecoration = true;
      state.orderPulse = 1.2;
    });
  }

  bind();

  return Object.freeze({
    FORECASTS,
    FORMATIONS,
    CHAPTERS,
    buildRunPlan,
    buildEncorePlan,
    startRun,
    applyWave,
    update,
    getPlan,
    getAnnouncement,
    getPresentationState,
    pickForecastFoodId,
    adjustHazardChance,
    favouriteProfile,
    chapterForWave,
    isActive,
    snapshot: () => Object.freeze({ seed:state.seed, characterId:state.characterId, plans:Object.freeze([...state.plans.values()]), ...getPresentationState() }),
  });
})();

if (typeof globalThis !== 'undefined') globalThis.ArcadeLivingFeastDirector = ArcadeLivingFeastDirector;
