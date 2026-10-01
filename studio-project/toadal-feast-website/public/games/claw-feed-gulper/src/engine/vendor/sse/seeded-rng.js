const LCG_MULTIPLIER = 1664525n;
const LCG_INCREMENT = 1013904223n;
const UINT32_MODULUS = 0x100000000n;

function normalizeSeed(value, fallback = 0x12345678) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? (numeric >>> 0) : (fallback >>> 0);
}

export function createSeededRng(seed = 0x12345678) {
  let state = normalizeSeed(seed);

  function rng() {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 0x100000000;
  }

  rng.getState = () => state >>> 0;
  rng.setState = nextState => {
    state = normalizeSeed(nextState, state);
    return rng;
  };
  rng.advance = count => {
    let delta = BigInt(Math.max(0, Math.floor(Number(count) || 0)));
    let accMultiplier = 1n;
    let accIncrement = 0n;
    let currentMultiplier = LCG_MULTIPLIER;
    let currentIncrement = LCG_INCREMENT;

    while (delta > 0n) {
      if (delta & 1n) {
        accMultiplier = (accMultiplier * currentMultiplier) % UINT32_MODULUS;
        accIncrement = (accIncrement * currentMultiplier + currentIncrement) % UINT32_MODULUS;
      }
      currentIncrement = ((currentMultiplier + 1n) * currentIncrement) % UINT32_MODULUS;
      currentMultiplier = (currentMultiplier * currentMultiplier) % UINT32_MODULUS;
      delta >>= 1n;
    }

    state = Number((accMultiplier * BigInt(state) + accIncrement) % UINT32_MODULUS);
    return rng;
  };

  return rng;
}
