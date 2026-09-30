// ============================================================
// arcade-wave-formations.js — Living Feast formation positioning
// ============================================================
// Provides only X-position instructions. Spawn cadence, item type, speed,
// collision, scoring, and food/hazard ownership remain in SpawnManager.

const ArcadeWaveFormations = (() => {
  const state = {
    wave: 0,
    formation: 'normal',
    step: 0,
    hazardSide: 0,
  };

  const TRAIN_LANES = Object.freeze([0.16, 0.30, 0.44, 0.58, 0.72, 0.84, 0.72, 0.58, 0.44, 0.30]);
  const TWIN_LANES = Object.freeze([0.28, 0.72]);

  function clampX(normalized) {
    const pad = (typeof CONFIG !== 'undefined' ? CONFIG.FOOD_W : 36) / 2;
    const width = typeof CONFIG !== 'undefined' ? CONFIG.CANVAS_W : 480;
    return Math.max(pad, Math.min(width - pad, Math.max(0, Math.min(1, Number(normalized) || 0.5)) * width));
  }

  function isHazard(item) {
    return !!(item?.isBomb || item?.isHazard || item?.hazardId);
  }

  function resetForPlan(plan) {
    state.wave = Math.max(0, Math.floor(Number(plan?.wave) || 0));
    state.formation = String(plan?.formation || 'normal');
    state.step = 0;
    state.hazardSide = 0;
  }

  function ensurePlan(plan) {
    const wave = Math.max(0, Math.floor(Number(plan?.wave) || 0));
    const formation = String(plan?.formation || 'normal');
    if (wave !== state.wave || formation !== state.formation) resetForPlan(plan);
  }

  function formationAtGrandStep(step) {
    const phase = step % 18;
    if (phase < 5) return 'normal';
    if (phase < 11) return 'food-train';
    return 'twin-streams';
  }

  function safeHazardX(plannedNormalized) {
    // Hazards are kept away from the food lane they follow so a player is not
    // visually baited into an unavoidable overlapping catch.
    state.hazardSide = state.hazardSide ? 0 : 1;
    if (plannedNormalized < 0.42) return state.hazardSide ? 0.86 : 0.72;
    if (plannedNormalized > 0.58) return state.hazardSide ? 0.14 : 0.28;
    return state.hazardSide ? 0.12 : 0.88;
  }

  function resolveSpawnX(plan, item, rng = Math.random) {
    if (!plan) return null;
    ensurePlan(plan);
    let formation = String(plan.formation || 'normal');
    if (formation === 'grand-feast') formation = formationAtGrandStep(state.step);

    let normalized = null;
    if (formation === 'food-train') {
      normalized = TRAIN_LANES[state.step % TRAIN_LANES.length];
    } else if (formation === 'twin-streams') {
      normalized = TWIN_LANES[state.step % TWIN_LANES.length];
    } else {
      // Preserve normal random spawning. Grand Feast's normal phase remains
      // slightly inset so the finale feels composed without becoming rigid.
      if (String(plan.formation || '') === 'grand-feast') normalized = 0.14 + Math.max(0, Math.min(0.999999999, Number(rng()) || 0)) * 0.72;
      else {
        state.step++;
        return null;
      }
    }

    if (isHazard(item)) normalized = safeHazardX(normalized);
    state.step++;
    return clampX(normalized);
  }

  function snapshot() {
    return Object.freeze({ ...state });
  }

  if (typeof EventBus !== 'undefined') EventBus.on('livingFeastWavePlan', resetForPlan);

  return Object.freeze({
    resetForPlan,
    resolveSpawnX,
    snapshot,
  });
})();

if (typeof globalThis !== 'undefined') globalThis.ArcadeWaveFormations = ArcadeWaveFormations;
