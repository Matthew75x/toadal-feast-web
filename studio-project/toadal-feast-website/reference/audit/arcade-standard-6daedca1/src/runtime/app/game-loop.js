// ============================================================
// src/runtime/app/game-loop.js — Per-frame update logic & main loop
// Input actions, updateFrog/Tongue/Foods, catch handlers, update()/gameLoop(). Split from game.js for modularity.
// ============================================================

// The high-speed debug control fast-forwards simulation time.  These helpers
// keep that fast-forward safe without changing production behavior (prod stays
// at 1× because its safety override resets TWEAK.gameSpeedMult).
let _queuedTongueShot = false;
function getDebugGameSpeedMult() {
  const speed = (typeof TWEAK !== 'undefined') ? Number(TWEAK.gameSpeedMult) : 1;
  return Number.isFinite(speed) && speed > 0 ? speed : 1;
}
function getDebugCatchAssist() {
  // A small DEV fast-forward assist keeps manual test shots viable at 3×–10×.
  // It is zero at normal speed and therefore never changes shipped balance.
  return Math.min(54, Math.max(0, getDebugGameSpeedMult() - 1) * 6);
}

function getActiveArcadeBehaviorProfile(charDef = getCharDef()) {
  const profile = typeof getArcadeCharacterBehaviorProfile === 'function'
    ? getArcadeCharacterBehaviorProfile(charDef)
    : null;
  if (!profile) throw new Error(`Missing Arcade behavior profile for ${charDef?.id || 'unknown character'}.`);
  return profile;
}

function getTongueMaxReach(charDef = getCharDef()) {
  if (charDef?.id === 'toadal' && typeof ArcadeToadalMechanics !== 'undefined') {
    return Math.max(1, Number(ArcadeToadalMechanics.CONFIG?.tongueReach || 82));
  }
  return Math.max(1, Number(CONFIG.TONGUE_MAX || 320) + Number(charDef?.stats?.reachBonus || 0) + Number(tongue?.reachCompensation || 0));
}

function getTongueSpeed(charDef = getCharDef()) {
  if (charDef?.id === 'toadal' && typeof ArcadeToadalMechanics !== 'undefined') {
    return Math.max(1, Number(ArcadeToadalMechanics.CONFIG?.tongueSpeed || 480));
  }
  return Math.max(1, Number(CONFIG.TONGUE_SPEED || 680) + Number(charDef?.stats?.tongueBonus || 0));
}

function getTongueExtensionRatio(charDef = getCharDef()) {
  if (!tongue?.active) return 0;
  const reach = getTongueMaxReach(charDef);
  return Math.max(0, Math.min(1, (Number(tongue.y || 0) - Number(tongue.tip || 0)) / reach));
}

// One authoritative centerline feeds both collision and rendering. The curve
// remains deliberately restrained so the tongue still reads as the player's
// existing straight-up Arcade tool rather than silently becoming auto-aim.
function getTongueCenterline(charDef = getCharDef(), startY = tongue.y) {
  const extension = getTongueExtensionRatio(charDef);
  const root = { x: Number(tongue.x || 0), y: Number(startY || tongue.y) - 7 };
  const wobble = Math.sin(Number(RuntimeState.tongueWobble || 0));
  const curveX = root.x + wobble * (1.5 + extension * 2.5);
  const tipX = root.x + wobble * extension * 1.8;
  const tip = { x: tipX, y: Number(tongue.tip || root.y) };
  const control = { x: curveX, y: (root.y + tip.y) * 0.5 };
  const points = [];
  const segments = 5;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const inv = 1 - t;
    points.push({
      x: inv * inv * root.x + 2 * inv * t * control.x + t * t * tip.x,
      y: inv * inv * root.y + 2 * inv * t * control.y + t * t * tip.y,
    });
  }
  return { root, control, tip, points, extension };
}

function _distanceSqToPolyline(px, py, points) {
  let nearest = Infinity;
  for (let i = 1; i < points.length; i++) {
    nearest = Math.min(nearest, _distanceSqToSegment(
      px, py,
      points[i - 1].x, points[i - 1].y,
      points[i].x, points[i].y,
    ));
  }
  return nearest;
}

function _canVisuallyRetrieveFood(food, behavior) {
  if (!food || behavior?.catchMechanism !== 'tongue-tip') return false;
  // Explosive/scorching hazards resolve at the point of impact, and a syringe
  // should never be presented as something the frog visibly swallows.
  return !food.isBomb && !food.isSun && !food.isSyringe;
}

function _snapshotCapturedFood(food) {
  return {
    ...food,
    x: 0,
    y: 0,
    rotation: Number(food?.rotation || 0),
    wobbleTime: Number(food?.wobbleTime || 0),
    scale: Number(food?.scale || 1),
  };
}

function getArcadeFeastFoodIdentity(food) {
  const definition = typeof getArcadeFoodDef === 'function' ? getArcadeFoodDef(food?.itemId) : null;
  return {
    itemId: String(food?.itemId || definition?.itemId || ''),
    category: String(definition?.category || food?.category || ''),
    label: String(definition?.label || food?.label || 'Food'),
  };
}

function getFeastAffinityBonus(charDef, food, basePoints) {
  if (typeof FeastOrdersManager === 'undefined') return 0;
  return FeastOrdersManager.getAffinityScoreBonus(charDef?.id, food?.itemId, basePoints);
}

function spawnArcadeFoodCatchFeedback(food) {
  if (!food?.itemId || typeof getArcadeFoodEffectProfile !== 'function') return null;
  const profile = getArcadeFoodEffectProfile(food.itemId);
  const family = typeof getArcadeFoodEffectFamily === 'function'
    ? getArcadeFoodEffectFamily(food.itemId)
    : 'savory';
  const reducedMotion = typeof SETTINGS !== 'undefined' && SETTINGS.reduceMotion;
  const particleCount = Math.max(3, Math.round(Number(profile.particleCount || 12) * (reducedMotion ? 0.4 : 1)));
  const palette = Array.isArray(profile.palette) && profile.palette.length ? profile.palette : ['#ffd27a'];
  palette.forEach((color, index) => {
    const count = Math.floor(particleCount / palette.length) + (index < particleCount % palette.length ? 1 : 0);
    if (count > 0) FXManager.spawnParticles(entities, food.x, food.y, color, count);
  });
  const payload = Object.freeze({
    itemId:String(food.itemId),
    family,
    accent:String(profile.accent || ''),
    x:Number(food.x || 0),
    y:Number(food.y || 0),
    particleCount,
    reducedMotion,
  });
  EventBus.emit('arcadeFoodCatchFeedback', payload);
  return payload;
}

function recordArcadeFeastCatch(food, charDef, scoreBonus = 0, catchContext = {}) {
  const feedback = spawnArcadeFoodCatchFeedback(food);
  const identity = getArcadeFeastFoodIdentity(food);
  const payload = {
    ...identity,
    characterId: String(charDef?.id || ''),
    isFavourite: typeof isArcadeFavouriteFood === 'function'
      ? isArcadeFavouriteFood(charDef?.id, food?.itemId)
      : Number(scoreBonus) > 0,
    isRare: Boolean((typeof getArcadeFoodDef === 'function' ? getArcadeFoodDef(food?.itemId)?.rare : false)
      || (typeof ARCADE_RARE_FOOD_IDS !== 'undefined' && ARCADE_RARE_FOOD_IDS.includes(String(food?.itemId || '')))),
    level: Number(GameState?.level || 1),
    score: Number(GameState?.score || 0),
    scoreBonus: Math.max(0, Math.floor(Number(scoreBonus) || 0)),
    effectFamily: feedback?.family || '',
    catchSource: String(catchContext.catchSource || 'direct'),
  };
  const result = typeof FeastOrdersManager !== 'undefined'
    ? FeastOrdersManager.recordCatch(payload)
    : null;
  EventBus.emit('arcadeFoodCaught', payload);
  return result;
}

function tryShootTongue() {
  const charDef = getCharDef();
  const behavior = getActiveArcadeBehaviorProfile(charDef);
  const toadalTongue = charDef?.id === 'toadal' && behavior.specialState === 'toadal-golden-kit';
  if (behavior.catchTrigger !== 'press' && !toadalTongue) return;
  if (toadalTongue) {
    const snap = typeof ArcadeToadalMechanics !== 'undefined' ? ArcadeToadalMechanics.snapshot() : null;
    if (snap?.crouchHeld || snap?.buildActive || snap?.throwActive) return;
  }
  if (tongue.active) {
    // Preserve one deliberate late press instead of dropping it during the
    // final fraction of contact/retraction. This is especially important on
    // touch screens, where a player cannot time a tap to a single render frame.
    // The buffer is short and never steers the tongue or selects a target.
    const tongueSpd = getTongueSpeed(charDef);
    const retractDistance = Math.max(0, Number(tongue.y || 0) - Number(tongue.tip || 0));
    const retractSeconds = retractDistance / (tongueSpd * 1.4);
    const lateContact = tongue.phase === 'contact' && Number(tongue.contactTimer || 0) <= 0.08;
    const lateRetraction = tongue.phase === 'retracting' && retractSeconds <= 0.12;
    if (lateContact || lateRetraction || getDebugGameSpeedMult() > 1) _queuedTongueShot = true;
    return;
  }
  _queuedTongueShot = false;
  const nextShotId = Number(tongue.shotId || 0) + 1;
  resetTongueAttackState();
  tongue.active = true;
  tongue.phase = 'extending';
  tongue.shotId = nextShotId;
  if (behavior.catchMechanism === 'hooked-tongue' && GameState.charState.chameleon) {
    GameState.charState.chameleon.caughtThisShot = false;
    GameState.charState.chameleon.missAnimTimer = 0;
  }
  const presentation = behavior.presentationContract || {};
  const configuredOrigin = presentation.tongueOrigin || {};
  const runtimeMouthOffset = (typeof characterSelectRuntimeMouthOffset === 'function' && characterSelectRuntimeMouthOffset(charDef)) || ((charDef?.species === 'frog') ? 54 : CONFIG.FROG_H / 2);
  const legacyOriginYOffset = Number.isFinite(Number(configuredOrigin.yOffset)) ? Number(configuredOrigin.yOffset) : runtimeMouthOffset;
  const configuredSocket = presentation.mouthSocket || {};
  const useMouthSocket = behavior.catchMechanism === 'tongue-tip';
  const socketYOffset = Number.isFinite(Number(configuredSocket.yOffset)) ? Number(configuredSocket.yOffset) : legacyOriginYOffset;
  const socketXOffset = Number.isFinite(Number(configuredSocket.xOffset)) ? Number(configuredSocket.xOffset) : Number(configuredOrigin.xOffset || 0);
  const originYOffset = useMouthSocket ? socketYOffset : legacyOriginYOffset;
  const originXOffset = useMouthSocket ? socketXOffset : (Number.isFinite(Number(configuredOrigin.xOffset)) ? Number(configuredOrigin.xOffset) : 0);
  tongue.originXOffset = originXOffset;
  tongue.originYOffset = originYOffset;
  // Moving the authoritative root down to the actual mouth must not shorten
  // the established top reach. Add back the legacy root delta as travel.
  tongue.reachCompensation = useMouthSocket ? Math.max(0, legacyOriginYOffset - originYOffset) : 0;
  tongue.x = frog.x + originXOffset;
  tongue.y = frog.y - originYOffset;
  tongue.tip = tongue.y;
  tongue.catching = false;
  RuntimeState.tongueWobble = 0;
  frog.mouthOpen = Number(behavior.activeMouthOpen || 0.9);
  AudioManager.tongue();
  // Mastery/help systems must observe a tongue that actually started, not a
  // raw button press that may have been rejected while crouching or busy.
  if (toadalTongue) EventBus.emit('toadalTongueStarted', { shotId:nextShotId });
}

function tryClonePickup() {
  const charDef = getCharDef();
  if (getActiveArcadeBehaviorProfile(charDef).specialState !== 'flytrap-clone') return;
  const cs = GameState.charState;
  if (!cs.flytrap.cloneHeld) {
    cs.flytrap.cloneHeld = true;
    cs.flytrap.cloneX = -1;
    cs.flytrap.cloneY = -1;
    cs.flytrap.cloneAction = 'pickup';
    cs.flytrap.cloneActionTimer = 0.52;
  }
}

function tryClonePlace() {
  const charDef = getCharDef();
  if (getActiveArcadeBehaviorProfile(charDef).specialState !== 'flytrap-clone') return;
  const cs = GameState.charState;
  cs.flytrap.cloneHeld = false;
  cs.flytrap.cloneX = frog.x;
  cs.flytrap.cloneY = CONFIG.CANVAS_H - 80;
  cs.flytrap.cloneAction = 'plant';
  cs.flytrap.cloneActionTimer = 0.52;
}

function updateClone(dt) {
  const charDef = getCharDef();
  if (getActiveArcadeBehaviorProfile(charDef).specialState !== 'flytrap-clone') return;
  const cs = GameState.charState;
  if (cs.flytrap.cloneSnapAnim > 0) cs.flytrap.cloneSnapAnim = Math.max(0, cs.flytrap.cloneSnapAnim - dt * 3);
  cs.flytrap.catchAnimTimer = Math.max(0, Number(cs.flytrap.catchAnimTimer || 0) - dt);
  cs.flytrap.rareAnimTimer = Math.max(0, Number(cs.flytrap.rareAnimTimer || 0) - dt);
  cs.flytrap.cloneActionTimer = Math.max(0, Number(cs.flytrap.cloneActionTimer || 0) - dt);
  if (cs.flytrap.cloneActionTimer <= 0) cs.flytrap.cloneAction = null;

  if (cs.flytrap.cloneX < 0) return;
  const catchR = Number(charDef.stats.cloneCatchRadius || (charDef.stats.catchRadius || 66) * (2 / 3));
  for (let i = entities.foods.length - 1; i >= 0; i--) {
    const f = entities.foods[i];
    if (f.y < cs.flytrap.cloneY - catchR) continue;
    const dx = f.x - cs.flytrap.cloneX, dy = f.y - cs.flytrap.cloneY;
    if (dx*dx + dy*dy < catchR * catchR) {
      entities.foods.splice(i, 1);
      cs.flytrap.cloneSnapAnim = 1;
      if (f.isBomb) {
        AudioManager.bomb();
        FXManager.spawnParticles(entities, f.x, f.y, '#ff4444', 10);
        FXManager.spawnFloatingText(entities, cs.flytrap.cloneX, cs.flytrap.cloneY - 30, 'Clone hit!', '#ff8888');
        cs.flytrap.cloneX = -1; cs.flytrap.cloneY = -1; cs.flytrap.cloneHeld = true;
      } else if (f.isHeart) {
        GameState.lives = Math.min(GameState.lives + GAME_BALANCE.lives.heartHealAmount, GameState.maxLives || GAME_BALANCE.lives.defaultMax);
        AudioManager.catch(); AudioManager.heart();
        FXManager.spawnParticles(entities, f.x, f.y, '#ff69b4', 14);
        FXManager.spawnFloatingText(entities, cs.flytrap.cloneX, cs.flytrap.cloneY - 30, '+1 Life!', '#ff69b4');
      } else {
        GameState.combo++;
        const basePts = calcScorePerCatch(charDef);
        const affinityBonus = getFeastAffinityBonus(charDef, f, basePts);
        const premiumBonus = f.isRareFood ? basePts * 2 : 0;
        const pts = basePts + affinityBonus + premiumBonus;
        GameState.score += pts;
        AudioManager.catchForCombo(GameState.combo);
        FXManager.spawnFloatingText(entities, cs.flytrap.cloneX, cs.flytrap.cloneY - 30, `+${pts}`, '#a8f7a0');
        if (affinityBonus > 0) FXManager.spawnFloatingText(entities, cs.flytrap.cloneX, cs.flytrap.cloneY - 52, `Favourite +${affinityBonus}`, charDef.color || '#6fda73');
        if (premiumBonus > 0) cs.flytrap.rareAnimTimer = 1.1;
        recordArcadeFeastCatch(f, charDef, affinityBonus + premiumBonus);
        if (typeof ArcadeEatingFinish !== 'undefined') ArcadeEatingFinish.capture(f, charDef, { targetX:cs.flytrap.cloneX, targetY:cs.flytrap.cloneY - 18 });
        EventBus.emit('foodCaught', { score:GameState.score, level:GameState.level, itemId:f.itemId, characterId:charDef.id, affinityBonus, premiumBonus, points:pts, combo:GameState.combo, isRare:Boolean(f.isRareFood), catchSource:'flytrap-clone' });
        if (!ProgressionState.transitioning) {
          ProgressionState.foodsEaten++;
          if (ProgressionState.foodsEaten >= getCurrentLevelConfig().foodsToEat) triggerWaveComplete();
        }
      }
      break;
    }
  }
}


function _arcadeExpFollow(current, target, rate, dt) {
  const alpha = 1 - Math.exp(-Math.max(0, Number(rate) || 0) * Math.max(0, Number(dt) || 0));
  return current + (target - current) * alpha;
}

function _gullyAnimationNow() {
  return typeof ArcadeAnimationClock !== 'undefined'
    ? ArcadeAnimationClock.getElapsed()
    : (typeof RuntimeState !== 'undefined' ? Number(RuntimeState.frogAnim || 0) / 3 : 0);
}

function _requestGullyFacing(pelican, desiredSign, now, flight) {
  const sign = desiredSign < 0 ? -1 : 1;
  if (!Number.isFinite(pelican.facingSign)) pelican.facingSign = 1;
  if (!Number.isFinite(pelican.facingFrom)) pelican.facingFrom = pelican.facingSign;
  if (!Number.isFinite(pelican.facingTo)) pelican.facingTo = pelican.facingSign;
  if (!Number.isFinite(pelican.facingBlendStartedAt)) pelican.facingBlendStartedAt = now;

  const blendDuration = Math.max(0.01, Number(flight.turnCrossfadeSeconds) || 0.11);
  const blend = Math.max(0, Math.min(1, (now - pelican.facingBlendStartedAt) / blendDuration));
  if (blend >= 1) {
    pelican.facingSign = pelican.facingTo;
    pelican.facingFrom = pelican.facingTo;
  }
  if (sign !== pelican.facingTo) {
    pelican.facingFrom = blend >= 0.5 ? pelican.facingTo : pelican.facingFrom;
    pelican.facingTo = sign;
    pelican.facingBlendStartedAt = now;
  }
}

// PR #99 gameplay authority: the legal horizontal range of frog.x is a gameplay
// rule, derived only from the logical gameplay box (CONFIG.FROG_W) plus the
// pre-existing dynamic Toadal Consumption / Gulper special case. Authored sprite
// geometry, anchors, draw scales and bank rotation are presentation facts and
// must never narrow where the player is allowed to stand.
function arcadeGameplayMovementHalfWidth(charDef = getCharDef()) {
  const requested = GameState.isTC && typeof GulperArcadeAnimationRenderer !== 'undefined'
    ? Math.max(8, (CONFIG.FROG_W / 2) * GulperArcadeAnimationRenderer.visualScale())
    : CONFIG.FROG_W / 2;
  return Math.min(Math.max(8, CONFIG.CANVAS_W / 2 - 4), requested);
}

// Presentation-only footprint. Renderer clipping, culling, diagnostics and QA
// reporting may consult authored sprite geometry, but this value is deliberately
// NOT wired into frog.x, catch radii, tongue reach, movement speed or input.
function arcadePresentationFootprintHalfWidth(charDef = getCharDef(), behavior = null) {
  const logicalHalf = Math.max(8, Number(CONFIG.FROG_W || 48) / 2);
  let visualHalf = logicalHalf;

  try {
    const entry = typeof ArcadeAnimationRegistry !== 'undefined'
      ? ArcadeAnimationRegistry.character?.(charDef?.id)
      : null;
    if (entry) {
      const specs = [entry, ...Object.values(entry.clips || {})];
      for (const spec of specs) {
        if (!spec) continue;
        if (entry.renderMode === 'complete-body-growth-scale') continue;
        const frameWidth = Number(spec.frameWidth || entry.frameWidth || entry.frameSize || 0);
        const drawScale = Number(spec.drawScale || entry.drawScale || 0);
        const drawSize = Number(spec.drawSize || entry.drawSize || 0);
        const scale = drawScale > 0 ? drawScale : (frameWidth > 0 && drawSize > 0 ? drawSize / frameWidth : 0);
        if (!(frameWidth > 0) || !(scale > 0)) continue;
        const anchorX = Number.isFinite(Number(spec.anchorX))
          ? Number(spec.anchorX)
          : (Number.isFinite(Number(entry.anchorX)) ? Number(entry.anchorX) : frameWidth / 2);
        visualHalf = Math.max(visualHalf, anchorX * scale, (frameWidth - anchorX) * scale);
      }
    }
  } catch (_) {}

  if (charDef?.id === 'gulper' && typeof GulperArcadeAnimationRenderer !== 'undefined') {
    visualHalf = Math.max(visualHalf, Number(GulperArcadeAnimationRenderer.drawSize || 0) / 2);
    visualHalf += Math.max(0, Number(GulperArcadeAnimationRenderer.drawSize || 0) * 0.15);
  }

  const activeBehavior = behavior || (() => {
    try { return getActiveArcadeBehaviorProfile(charDef); } catch (_) { return null; }
  })();
  if (activeBehavior?.locomotionFamily === 'airborne-gully') {
    const bank = Math.max(0, Math.min(Math.PI / 4, Number(GAME_BALANCE?.pelican?.flight?.bankMaxRadians || 0.18)));
    visualHalf *= Math.abs(Math.cos(bank)) + Math.abs(Math.sin(bank));
  }

  const safety = 4;
  // Presentation footprint is allowed to exceed half the canvas: this function
  // reports the actor's true authored overhang so ArcadePresentationCamera can
  // choose the containment transform. Gameplay movement has its own independent
  // half-canvas clamp in arcadeGameplayMovementHalfWidth() above and is unchanged.
  return Math.max(8, Math.ceil(Math.max(logicalHalf, visualHalf) + safety));
}

// Diagnostics/QA surface. Presentation footprint is published for renderer
// clipping, culling and reporting only; gameplay movement stays PR #99 logical.
if (typeof globalThis !== 'undefined') {
  globalThis.FroggyArcadeBounds = Object.freeze({
    gameplayMovementHalfWidth: arcadeGameplayMovementHalfWidth,
    presentationFootprintHalfWidth: arcadePresentationFootprintHalfWidth,
  });
}

function updateGullyFlight(dt, charDef, frogSpd, touchVector = { x: 0, y: 0 }, analogAxis = { x:0, y:0 }) {
  const pelican = GameState.charState.pelican;
  const flight = GAME_BALANCE.pelican.flight;
  const now = _gullyAnimationNow();
  const floorY = Number(flight.floorY || flight.groundY || CONFIG.CANVAS_H - 88);
  const spawnY = Number(flight.spawnY || CONFIG.CANVAS_H - 170);
  const ceilingY = Number(flight.ceilingY);
  const leftHeld = InputManager.isDown('ArrowLeft');
  const rightHeld = InputManager.isDown('ArrowRight');
  const upHeld = InputManager.isDown('ArrowUp');
  const downHeld = InputManager.isDown('ArrowDown');
  const digitalX = (rightHeld ? 1 : 0) - (leftHeld ? 1 : 0);
  const digitalY = (downHeld ? 1 : 0) - (upHeld ? 1 : 0);
  const inputX = Math.abs(Number(analogAxis.x || 0)) > 0.04 ? Number(analogAxis.x || 0) : digitalX;
  const inputY = Math.abs(Number(analogAxis.y || 0)) > 0.04 ? Number(analogAxis.y || 0) : digitalY;

  if (!Number.isFinite(pelican.y)) pelican.y = spawnY;
  if (!Number.isFinite(pelican.flightVx)) pelican.flightVx = 0;
  if (!Number.isFinite(pelican.flightVy)) pelican.flightVy = 0;
  if (!Number.isFinite(pelican.bank)) pelican.bank = 0;
  pelican.flightMode = 'airborne';
  pelican.grounded = false;

  // Compatibility countdowns remain available for lightweight catch/rare
  // feedback, but they no longer own Gully's body animation.
  if (Number(pelican.catchAnimTimer || 0) > 0 && Number(pelican.catchAnimUntil || 0) <= 0) {
    pelican.catchAnimUntil = now + Number(pelican.catchAnimTimer || 0);
  }
  if (Number(pelican.rareAnimTimer || 0) > 0 && Number(pelican.rareAnimUntil || 0) <= 0) {
    pelican.rareAnimUntil = now + Number(pelican.rareAnimTimer || 0);
  }
  pelican.catchAnimTimer = Math.max(0, Number(pelican.catchAnimUntil || 0) - now);
  pelican.rareAnimTimer = Math.max(0, Number(pelican.rareAnimUntil || 0) - now);

  const maxHorizontal = Math.max(
    Number(flight.horizontalMinMaxSpeed || 120),
    frogSpd * Number(flight.horizontalMaxSpeedMult || 0.82),
  );
  const climbSpeed = Math.max(120, Number(charDef.stats.climbSpeed || GAME_BALANCE.pelican.climbSpeed));
  const diveSpeed = Math.max(climbSpeed, Number(charDef.stats.diveSpeed || GAME_BALANCE.pelican.diveSpeed));

  // Touch contributes momentum only; it never teleports the body. Keyboard,
  // controller, and touch therefore share the same flight model.
  if (InputManager.isTouchDragging()) {
    const impulse = Number(flight.touchImpulsePerPixel || 18);
    pelican.flightVx += Number(touchVector.x || 0) * impulse;
    pelican.flightVy += Number(touchVector.y || 0) * impulse;
  }

  const xRate = inputX
    ? Number(flight.horizontalAcceleration || 6.2)
    : Number(flight.horizontalReleaseDrag || 4.1);
  pelican.flightVx = _arcadeExpFollow(pelican.flightVx, inputX * maxHorizontal, xRate, dt);
  pelican.flightVx = Math.max(-maxHorizontal, Math.min(maxHorizontal, pelican.flightVx));
  if (!inputX && Math.abs(pelican.flightVx) < 0.4) pelican.flightVx = 0;

  const targetVy = inputY < 0 ? -climbSpeed : inputY > 0 ? diveSpeed : 0;
  const verticalRate = inputY
    ? Number(flight.verticalAcceleration || 6.4)
    : Number(flight.verticalReleaseDrag || 4.4);
  pelican.flightVy = _arcadeExpFollow(pelican.flightVy, targetVy, verticalRate, dt);
  pelican.flightVy = Math.max(-climbSpeed, Math.min(diveSpeed, pelican.flightVy));
  if (!inputY && Math.abs(pelican.flightVy) < 0.4) pelican.flightVy = 0;

  pelican.y += pelican.flightVy * dt;
  if (pelican.y <= ceilingY) {
    pelican.y = ceilingY;
    if (pelican.flightVy < 0) pelican.flightVy = 0;
  }
  if (pelican.y >= floorY) {
    pelican.y = floorY;
    if (pelican.flightVy > 0) pelican.flightVy = 0;
  }

  frog.x += pelican.flightVx * dt;
  // PR #99 authority: Gully's horizontal flight extrema use the logical gameplay
  // width. Bank rotation is presentation and must not shrink the flight lane.
  const minX = CONFIG.FROG_W / 2 + 2;
  const maxX = CONFIG.CANVAS_W - CONFIG.FROG_W / 2 - 2;
  if (frog.x <= minX) { frog.x = minX; if (pelican.flightVx < 0) pelican.flightVx = 0; }
  if (frog.x >= maxX) { frog.x = maxX; if (pelican.flightVx > 0) pelican.flightVx = 0; }

  const facingThreshold = Number(flight.facingVelocityThreshold || 20);
  if (pelican.flightVx > facingThreshold) _requestGullyFacing(pelican, 1, now, flight);
  else if (pelican.flightVx < -facingThreshold) _requestGullyFacing(pelican, -1, now, flight);
  else _requestGullyFacing(pelican, pelican.facingTo || pelican.facingSign || 1, now, flight);

  frog.facing = pelican.facingTo || pelican.facingSign || 1;
  frog.y = pelican.y;
  frog.moveDir = Math.abs(pelican.flightVx) > 8 ? Math.sign(pelican.flightVx) : 0;
  frog.moveY = Math.abs(pelican.flightVy) > 8 ? Math.sign(pelican.flightVy) : 0;

  const bankTarget = Math.max(
    -Number(flight.bankMaxRadians || 0.18),
    Math.min(Number(flight.bankMaxRadians || 0.18), (pelican.flightVx / maxHorizontal) * Number(flight.bankMaxRadians || 0.18)),
  );
  pelican.bank = _arcadeExpFollow(pelican.bank, bankTarget, Number(flight.bankSmoothing || 7), dt);
  pelican.wingCycle += dt * (2.5 + Math.hypot(pelican.flightVx / maxHorizontal, pelican.flightVy / diveSpeed) * 3.5);
  if (pelican.pouchFull > 0) pelican.pouchFull = Math.max(0, pelican.pouchFull - dt * 2);
}

function updateFrog(dt) {
  const charDef = getCharDef();
  const behavior = getActiveArcadeBehaviorProfile(charDef);
  let bellyPenalty = 0;
  if (hasAbility(charDef, 'growingBelly')) {
    const max = charDef.stats.bellyGrowthMax || 25;
    const penaltyMax = charDef.stats.bellySpeedPenaltyMax || 280;
    bellyPenalty = ((GameState.charState.royal && GameState.charState.royal.belly) || 0) / max * penaltyMax;
  }
  if (behavior.specialState === 'bob-basket') {
    bellyPenalty = (GameState.charState.bob.basketItems.length / GAME_BALANCE.bob.basketMax) * GAME_BALANCE.bob.carrySlowMax;
  }
  let frogSpd = Math.max(GAME_BALANCE.royal.bellySpeedFloor, CONFIG.FROG_SPEED + (charDef.stats.speedBonus || 0) - bellyPenalty);
  if (typeof AbilitySystem.hasHook !== 'function' || AbilitySystem.hasHook('onSpeedCalc')) frogSpd = AbilitySystem.modify('onSpeedCalc', charDef, frogSpd, { dt });
  if (typeof StatusEffectSystem.hasActiveHook !== 'function' || StatusEffectSystem.hasActiveHook('onSpeedCalc')) frogSpd = StatusEffectSystem.modify('onSpeedCalc', frogSpd, { dt });
  frog.lastX = frog.x; frog.moveDir = 0; frog.moveY = 0;

  const isFlyingCharacter = behavior.locomotionFamily === 'airborne-gully';
  const touchVector = typeof InputManager.consumeTouchVector === 'function'
    ? InputManager.consumeTouchVector()
    : { x: InputManager.consumeTouchDelta(), y: 0 };
  const analogAxis = typeof InputManager.getVirtualAxis === 'function'
    ? InputManager.getVirtualAxis()
    : { x:0, y:0 };

  if (behavior.specialState === 'toadal-golden-kit' && typeof ArcadeToadalMechanics !== 'undefined') {
    const crouchInput = Boolean(
      InputManager.isDown('ArrowDown')
      || InputManager.isDown('KeyS')
      || Number(analogAxis.y || 0) > 0.58
    );
    ArcadeToadalMechanics.setCrouchInput(crouchInput);
    if (ArcadeToadalMechanics.snapshot()?.crouchHeld) {
      frogSpd *= Number(ArcadeToadalMechanics.CONFIG?.crouchMoveScale || 0.28);
    }
  }

  if (isFlyingCharacter) {
    updateGullyFlight(dt, charDef, frogSpd, touchVector, analogAxis);
  } else {
    const analogX = Math.abs(Number(analogAxis.x || 0)) > 0.04 ? Number(analogAxis.x || 0) : 0;
    if (analogX) {
      frog.x += frogSpd * analogX * dt;
      frog.moveDir = analogX < 0 ? -1 : 1;
      frog.facing = frog.moveDir;
    } else {
      const toadalKeys = charDef.id === 'toadal';
      if (InputManager.isDown('ArrowLeft') || (toadalKeys && InputManager.isDown('KeyA')))  { frog.x -= frogSpd * dt; frog.moveDir = -1; frog.facing = -1; }
      if (InputManager.isDown('ArrowRight') || (toadalKeys && InputManager.isDown('KeyD'))) { frog.x += frogSpd * dt; frog.moveDir =  1; frog.facing =  1; }
    }
    if (InputManager.isTouchDragging() && Number(touchVector.x || 0) !== 0) {
      frog.x += Number(touchVector.x || 0);
      frog.moveDir = touchVector.x < 0 ? -1 : 1;
      frog.facing = frog.moveDir;
    }
  }

  if (behavior.specialState === 'toadal-golden-kit' && typeof ArcadeToadalMechanics !== 'undefined') {
    ArcadeToadalMechanics.updateMovement(dt);
  }

  if (behavior.specialState === 'ninja-jump' && GameState.charState.ninja.jumping) {
    const cs    = GameState.charState;
    const dur   = charDef.stats.jumpDuration || 0.45;
    const h     = charDef.stats.jumpHeight   || 90;
    cs.ninja.jumpT += dt;
    const t      = Math.min(1, cs.ninja.jumpT / dur);
    const arc    = Math.sin(t * Math.PI);          
    frog.y       = cs.ninja.jumpY - arc * h;        
    cs.ninja.jumpCatchBonus = arc > 0.5 ? 14 : 0;
    if (t >= 1) {
      cs.ninja.jumping = false;
      frog.y          = cs.ninja.jumpY;
      cs.ninja.jumpCatchBonus = 0;
    }
  }

  const movementHalfWidth = arcadeGameplayMovementHalfWidth(charDef);
  const movementMinX = movementHalfWidth + 2;
  const movementMaxX = CONFIG.CANVAS_W - movementHalfWidth - 2;
  frog.x = movementMinX <= movementMaxX
    ? Math.max(movementMinX, Math.min(movementMaxX, frog.x))
    : CONFIG.CANVAS_W / 2;
  frog.isMoving = frog.moveDir !== 0;
  if (frog.isMoving) frog.stepCycle += dt * 10;
  updateStandardFrogPresentation(dt, charDef);
  if (!GameState.isTC) {
    const activeActionFloor = typeof tongue !== 'undefined' && tongue.active ? 0.22 : 0;
    frog.mouthOpen = Math.max(activeActionFloor, frog.mouthOpen - dt * 4.2);
  }
  if (GameState.charState.chameleon) {
    const chameleonState = GameState.charState.chameleon;
    chameleonState.catchAnimTimer = Math.max(0, Number(chameleonState.catchAnimTimer || 0) - dt);
    chameleonState.missAnimTimer = Math.max(0, Number(chameleonState.missAnimTimer || 0) - dt);
    chameleonState.rareAnimTimer = Math.max(0, Number(chameleonState.rareAnimTimer || 0) - dt);
  }
  if (GameState.isTC) frog.y = CONFIG.CANVAS_H - 80;
}

function updateStandardFrogPresentation(dt, charDef) {
  const state = GameState.charState.standardFrogMotion;
  const behavior = charDef ? getActiveArcadeBehaviorProfile(charDef) : null;
  if (!state || !charDef || behavior.locomotionFamily !== 'standard-frog') {
    updateSpecialLocomotionPresentation(dt, charDef);
    return false;
  }
  const safeDt = Math.max(0, Math.min(0.1, Number(dt) || 0));
  if (state.characterId !== charDef.id) {
    Object.assign(state, {
      characterId:charDef.id, velocityX:0, facingSign:frog.facing || 1,
      requestedFacing:frog.facing || 1, facingFrom:frog.facing || 1,
      facingTo:frog.facing || 1, facingBlend:1, hysteresisTime:0,
      lean:0, locomotion:0, bobPhase:0,
    });
  }

  const measuredVelocity = safeDt > 0 ? (frog.x - frog.lastX) / safeDt : 0;
  const velocityAlpha = 1 - Math.exp(-14 * safeDt);
  state.velocityX += (measuredVelocity - state.velocityX) * velocityAlpha;
  const threshold = 18;
  const desired = state.velocityX > threshold ? 1 : state.velocityX < -threshold ? -1 : state.requestedFacing;
  if (desired !== state.requestedFacing) {
    state.requestedFacing = desired;
    state.hysteresisTime = 0;
  } else if (desired !== state.facingTo) {
    state.hysteresisTime += safeDt;
    if (state.hysteresisTime >= 0.055) {
      state.facingFrom = state.facingTo;
      state.facingTo = desired;
      state.facingBlend = 0;
      state.hysteresisTime = 0;
    }
  } else {
    state.hysteresisTime = 0;
  }

  state.facingBlend = Math.min(1, state.facingBlend + safeDt / 0.11);
  if (state.facingBlend >= 1) state.facingSign = state.facingTo;
  const speedRatio = Math.min(1, Math.abs(state.velocityX) / Math.max(1, CONFIG.FROG_SPEED + (charDef.stats.speedBonus || 0)));
  const leanTarget = (state.velocityX < 0 ? -1 : state.velocityX > 0 ? 1 : 0) * speedRatio;
  state.lean += (leanTarget - state.lean) * (1 - Math.exp(-10 * safeDt));
  state.locomotion += (speedRatio - state.locomotion) * (1 - Math.exp(-12 * safeDt));
  state.bobPhase = (state.bobPhase + safeDt * (2.4 + state.locomotion * 5.2)) % (Math.PI * 2);
  frog.facing = state.facingTo;
  return true;
}

function updateSpecialLocomotionPresentation(dt, charDef) {
  const state = GameState.charState.specialLocomotion;
  const behavior = charDef ? getActiveArcadeBehaviorProfile(charDef) : null;
  if (!state || !charDef || behavior.locomotionFamily !== 'front-special') return false;
  const safeDt = Math.max(0, Math.min(0.1, Number(dt) || 0));
  if (state.characterId !== charDef.id) {
    Object.assign(state, { characterId:charDef.id, velocityX:0, lean:0, locomotion:0, bobPhase:0 });
  }
  const measuredVelocity = safeDt > 0 ? (frog.x - frog.lastX) / safeDt : 0;
  state.velocityX += (measuredVelocity - state.velocityX) * (1 - Math.exp(-12 * safeDt));
  const speedRatio = Math.min(1, Math.abs(state.velocityX) / Math.max(1, CONFIG.FROG_SPEED + (charDef.stats.speedBonus || 0)));
  const leanTarget = Math.sign(state.velocityX) * speedRatio;
  state.lean += (leanTarget - state.lean) * (1 - Math.exp(-9 * safeDt));
  state.locomotion += (speedRatio - state.locomotion) * (1 - Math.exp(-11 * safeDt));
  state.bobPhase = (state.bobPhase + safeDt * (2.1 + state.locomotion * 4.6)) % (Math.PI * 2);
  return true;
}

function _distanceSqToSegment(px, py, ax, ay, bx, by) {
  const abx = bx - ax;
  const aby = by - ay;
  const lenSq = abx * abx + aby * aby;
  if (lenSq <= 0.0001) {
    const dx = px - ax, dy = py - ay;
    return dx * dx + dy * dy;
  }
  const t = Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / lenSq));
  const cx = ax + abx * t;
  const cy = ay + aby * t;
  const dx = px - cx, dy = py - cy;
  return dx * dx + dy * dy;
}

function _tongueHitsFood(food, charDef, piercing) {
  const behavior = getActiveArcadeBehaviorProfile(charDef);
  const magnetBonus = StatusEffectSystem.modify('onCatchRadiusBonus', 0, {});
  const baseRadius = charDef?.id === 'toadal'
    ? Math.min(22, Number(charDef.stats.catchRadius || 38))
    : Number(charDef.stats.catchRadius || 32);
  const radius = baseRadius
    + (charDef?.id === 'toadal' ? 0 : (GameState.charState.ninja.jumpCatchBonus || 0))
    + magnetBonus
    + (piercing ? 10 : 0)
    + getDebugCatchAssist();

  if (behavior.catchMechanism === 'hooked-tongue') {
    const hookX = tongue.x + 10 + Math.sin(RuntimeState.tongueWobble) * 7;
    const checkPts = [{ x: hookX, y: tongue.tip }, { x: tongue.x + 6, y: (tongue.tip + tongue.y) * 0.5 }, { x: tongue.x, y: tongue.y - 24 }];
    return checkPts.some(pt => {
      const dx = pt.x - food.x, dy = pt.y - food.y;
      return dx * dx + dy * dy < radius * radius;
    });
  }

  const geometry = getTongueCenterline(charDef, tongue.y);
  const tipDx = geometry.tip.x - food.x;
  const tipDy = geometry.tip.y - food.y;
  if (tipDx * tipDx + tipDy * tipDy < radius * radius) return true;

  // Piercing intentionally uses the full rendered centerline. Standard shots
  // retain their old forgiving shaft catch, but now the forgiving geometry is
  // the same curve the player sees rather than three disconnected sample dots.
  const shaftRadius = radius;
  return _distanceSqToPolyline(food.x, food.y, geometry.points) < shaftRadius * shaftRadius;
}

function updateTongue(dt) {
  tongue.swallowTimer = Math.max(0, Number(tongue.swallowTimer || 0) - dt);
  tongue.impact = Math.max(0, Number(tongue.impact || 0) - dt * 8);
  if (!tongue.active) return;
  const charDef = getCharDef();
  const behavior = getActiveArcadeBehaviorProfile(charDef);
  // Toadal's tongue is intentionally one short precision catch.  Golden Throw
  // remains his authored multi-catch/piercing tool.
  const piercing = charDef?.id === 'toadal' ? false : StatusEffectSystem.has('piercing');
  RuntimeState.tongueWobble += dt * 20;
  const tongueSpd = getTongueSpeed(charDef);

  // Keep the root welded to the live mouth while the player moves or Ninja
  // jumps. The tip remains in world space, naturally stretching the shaft.
  tongue.x = frog.x + Number(tongue.originXOffset || 0);
  tongue.y = frog.y - Number(tongue.originYOffset || 0);

  if (!tongue.catching) {
    tongue.phase = 'extending';
    tongue.tip -= tongueSpd * dt;
    const maxReach = tongue.y - getTongueMaxReach(charDef);
    if (tongue.tip <= maxReach) {
      tongue.tip = maxReach;
      tongue.catching = true;
      tongue.phase = 'retracting';
    }

    for (let i = entities.foods.length - 1; i >= 0; i--) {
      const food = entities.foods[i];
      // Piercing is a collection buff, not hazard immunity. Bombs and suns
      // remain dangerous and are not swept up by the beam.
      if (piercing && (food.isBomb || food.isSun)) continue;
      if (!_tongueHitsFood(food, charDef, piercing)) continue;

      const capturedVisual = _canVisuallyRetrieveFood(food, behavior)
        ? _snapshotCapturedFood(food)
        : null;
      entities.foods.splice(i, 1);
      if (behavior.catchMechanism === 'hooked-tongue' && GameState.charState.chameleon) {
        GameState.charState.chameleon.caughtThisShot = true;
      }
      if (charDef?.id === 'toadal' && typeof ArcadeToadalMechanics !== 'undefined') {
        ArcadeToadalMechanics.onTongueCatch?.(food);
        handleFoodCaught(food, charDef, {
          catchSource:'toadal-tongue',
          grantCharacterResource:false,
          playEatReaction:false,
        });
      } else {
        handleFoodCaught(food, charDef);
      }

      if (!piercing) {
        tongue.catching = true;
        tongue.phase = 'contact';
        tongue.contactTimer = capturedVisual ? 0.035 : 0.018;
        tongue.capturedFood = capturedVisual;
        tongue.captureRotation = Number(food.rotation || 0);
        tongue.impact = 1;
        // A fatal catch may transition modes immediately. In that case the
        // game-over flow owns cleanup and the attack must not linger.
        if (GameState.mode !== GAME_MODES.PLAYING) resetTongueAttackState();
        break;
      }
    }
  } else {
    if (tongue.contactTimer > 0) {
      tongue.contactTimer = Math.max(0, tongue.contactTimer - dt);
      tongue.phase = 'contact';
      return;
    }
    tongue.phase = 'retracting';
    tongue.tip += tongueSpd * 1.4 * dt;
    if (tongue.tip >= tongue.y) {
      const completedRetrieval = Boolean(tongue.capturedFood);
      tongue.tip = tongue.y;
      tongue.active = false;
      tongue.catching = false;
      tongue.phase = completedRetrieval ? 'swallowing' : 'idle';
      tongue.capturedFood = null;
      tongue.contactTimer = 0;
      tongue.swallowTimer = completedRetrieval ? 0.14 : 0.06;
      frog.mouthOpen = Math.max(Number(frog.mouthOpen || 0), completedRetrieval ? 0.62 : 0.28);
      if (charDef?.id === 'toadal' && typeof ArcadeToadalMechanics !== 'undefined') {
        ArcadeToadalMechanics.onTongueRetracted?.();
      }
      if (behavior.catchMechanism === 'hooked-tongue' && GameState.charState.chameleon && !GameState.charState.chameleon.caughtThisShot) {
        GameState.charState.chameleon.missAnimTimer = 0.56;
      }
      if (_queuedTongueShot || (getDebugGameSpeedMult() > 1 && InputManager.isDown('Space'))) {
        _queuedTongueShot = false;
        tryShootTongue();
      }
    }
  }
}

function handleFoodCaught(food, charDef, catchContext = {}) {
  const behavior = getActiveArcadeBehaviorProfile(charDef);
  const context = Object.freeze({
    catchSource: String(catchContext.catchSource || 'direct'),
    scoreFactor: Number.isFinite(Number(catchContext.scoreFactor)) ? Math.max(0, Number(catchContext.scoreFactor)) : 1,
    advanceCombo: catchContext.advanceCombo !== false,
    grantCharacterResource: catchContext.grantCharacterResource !== false,
    playEatReaction: catchContext.playEatReaction !== false,
    grantFavouriteAffinity: catchContext.grantFavouriteAffinity !== false,
    grantRareFoodBonus: catchContext.grantRareFoodBonus !== false,
    allowComboScoreModifiers: catchContext.allowComboScoreModifiers !== false,
  });
  const hasAuthoredTongueRetrieval = Boolean(
    typeof tongue !== 'undefined'
    && tongue.active
    && !StatusEffectSystem.has('piercing')
    && (behavior.catchMechanism === 'tongue-tip' || behavior.catchMechanism === 'hooked-tongue')
  );
  if (context.playEatReaction && !hasAuthoredTongueRetrieval && behavior.catchMechanism !== 'bob-basket-rect' && typeof ArcadeEatingFinish !== 'undefined') {
    ArcadeEatingFinish.capture(food, charDef);
  }
  AbilitySystem.trigger('onFoodCaught', charDef, { food, catchContext:context });
  if (behavior.catchMechanism === 'hooked-tongue' && GameState.charState.chameleon && !food.isBomb && !food.isSun) {
    const chameleonState = GameState.charState.chameleon;
    chameleonState.catchAnimTimer = 0.78;
    chameleonState.missAnimTimer = 0;
    if (food.isGiftBox || food.isPowerUp || food.isHeart || food.isBlueHeart) {
      chameleonState.rareAnimTimer = 1.1;
    }
  }
  const modeConfig = getModeConfig();
  const modeHandled = modeConfig.onFoodCaught(food, charDef);
  if (modeHandled) return;

  // ── Gift Box ────────────────────────────────────────────────────────
  if (food.isGiftBox) {
    AudioManager.heart();
    FXManager.spawnParticles(entities, food.x, food.y, '#ffd700', 22);
    FXManager.spawnParticles(entities, food.x, food.y, '#ff69b4', 10);
    frog.mouthOpen = 1.1;
    if (typeof ProgressionManager !== 'undefined') {
      const result = ProgressionManager.openGiftBox();
      FXManager.spawnFloatingText(entities, food.x, food.y, result.label || 'Gift opened!', '#ffd700');
      if (result.type === 'coins' && result.amount) {
        FXManager.spawnFloatingText(entities, food.x, food.y - 28, `+${result.amount} Coins`, '#ffe066');
      }
    } else {
      FXManager.spawnFloatingText(entities, food.x, food.y, 'Gift opened!', '#ffd700');
    }
    EventBus.emit('foodCaught', { score: GameState.score, level: GameState.level, catchSource:context.catchSource });
    return;
  }

  if (food.isPowerUp) {
    StatusEffectSystem.apply(food.powerUpEffect, food.powerUpDuration);
    // Each power-up has an independently editable procedural placeholder
    // in Sound Lab. Real audio files can replace these later without changing gameplay.
    AudioManager.powerup(food.powerUpEffect);
    const effectDef = StatusEffectSystem.get(food.powerUpEffect);
    const shopItem = typeof ITEM_SHOP_DATA !== 'undefined'
      ? ITEM_SHOP_DATA.find(s => s.id === food.powerUpEffect + '_pu' || s.id === food.powerUpEffect)
      : null;
    const label = (effectDef && effectDef.def && effectDef.def.label)
      || (shopItem ? shopItem.label : food.powerUpEffect);
    FXManager.spawnParticles(entities, food.x, food.y, '#ffe066', 18);
    FXManager.spawnFloatingText(entities, food.x, food.y, label + '!', '#ffe066');
    frog.mouthOpen = 1.0;
    EventBus.emit('foodCaught', { score: GameState.score, level: GameState.level, catchSource:context.catchSource });
    return;
  }

  if (food.isSyringe) {
    LiveStats.heartsCaught++;
    const tc = GameState.toadalConsumption;
    tc.foodsEaten = Math.max(0, Math.min(GULPER_TOADAL_MAX_MEALS, Number(tc.foodsEaten || 0) - 1));
    tc.pendingTargetSize = null;
    tc.targetSize = getGulperToadalVisualScale(tc.foodsEaten);
    tc.size = Math.max(getGulperToadalVisualScale(0), Math.min(Number(tc.size || getGulperToadalVisualScale(0)), tc.targetSize + 0.06));
    tc.shrinkPulse = Math.max(tc.shrinkPulse, 0.28);
    AudioManager.heart();
    FXManager.spawnParticles(entities, food.x, food.y, '#88eeff', 14);
    FXManager.spawnFloatingText(entities, food.x, food.y, 'Shrink!', '#88eeff');
    frog.mouthOpen = 0.4;
    EventBus.emit('foodCaught', { score: GameState.score, level: GameState.level, catchSource:context.catchSource });
    return;
  }
  
  if (food.isBomb) {
    LiveStats.bombsCaught++;
    const hazard = typeof getHazardDef === 'function'
      ? getHazardDef(food.hazardType)
      : { id: 'bomb', label: 'Bomb', color: '#ff4444', caughtText: '-1 Life!', gameOverTitle: 'Boom!', gameOverSub: 'Caught a bomb!' };
    if (hazard.id === 'fire') {
      SaveManager.set(d => { d._lifetimeFireCaught = (d._lifetimeFireCaught || 0) + 1; });
    }
    AudioManager.bomb();
    if (!GAME_BALANCE.invincible && !StatusEffectSystem.has('shield')) GameState.lives = Math.max(0, GameState.lives - 1);
    if (typeof SETTINGS === 'undefined' || !SETTINGS.reduceMotion) RuntimeState.shakeTime = 0.3;
    if (typeof SETTINGS !== 'undefined' && SETTINGS.ghostFrames) RuntimeState.ghostTime = 0.8;
    if (typeof Haptic !== 'undefined') Haptic.miss();
    FXManager.spawnParticles(entities, food.x, food.y, hazard.color || '#ff4444', 16);
    FXManager.spawnFloatingText(entities, food.x, food.y, hazard.caughtText || '-1 Life!', hazard.color || '#ff4444');
    frog.mouthOpen = hasAbility(charDef,'wideCatch') ? 1.5 : 1.2;
    GameState.combo = 0;
    if (hasAbility(charDef, 'streakMultiplier')) {
      GameState.charState.royal.streak = 0;
      GameState.charState.royal.multiplier = 1;
      FXManager.spawnFloatingText(entities, food.x, food.y - 30, 'Streak lost!', '#cc88ff');
    }
    EventBus.emit('playerDamaged', { source: `hazard:${hazard.id || 'bomb'}` });
    if (GameState.lives <= 0) {
      triggerGameOver(hazard.gameOverTitle || 'Boom!', hazard.gameOverSub || 'Caught a hazard!', 'hazard', false, { hazardId:hazard.id || 'bomb', hazardLabel:hazard.label || 'hazard' });
      return;
    }
  } else if (food.isSun) {
    LiveStats.bombsCaught++;
    AudioManager.bomb();
    if (!GAME_BALANCE.invincible && !StatusEffectSystem.has('shield')) GameState.lives = Math.max(0, GameState.lives - 5);
    if (typeof SETTINGS === 'undefined' || !SETTINGS.reduceMotion) RuntimeState.shakeTime = 0.6;
    if (typeof SETTINGS !== 'undefined' && SETTINGS.ghostFrames) RuntimeState.ghostTime = 1.0;
    if (typeof Haptic !== 'undefined') Haptic.miss();
    FXManager.spawnParticles(entities, food.x, food.y, '#ffcc00', 24);
    FXManager.spawnFloatingText(entities, food.x, food.y, '-5 Lives!', '#ff8800');
    frog.mouthOpen = 1.5; GameState.combo = 0;
    if (hasAbility(charDef, 'streakMultiplier')) { GameState.charState.royal.streak = 0; GameState.charState.royal.multiplier = 1; FXManager.spawnFloatingText(entities, food.x, food.y - 30, 'Streak lost!', '#cc88ff'); }
    if (GameState.lives <= 0) {
      triggerGameOver('Scorched!', 'The sun was too powerful!', 'sun');
      return;
    }
    EventBus.emit('playerDamaged', { source:'sun' });
  } else if (food.isHeart) {
    LiveStats.heartsCaught++;
    if (behavior.catchMechanism === 'count-feed-circle') {
      const heartPts = charDef.stats.heartScoreBonus || GAME_BALANCE.count.heartPoints;
      GameState.score += heartPts;
      const prevLives = GameState.lives;
      GameState.lives = Math.min(GameState.lives + GAME_BALANCE.lives.heartHealAmount, GameState.maxLives || GAME_BALANCE.count.maxLives);
      const healText = GameState.lives > prevLives ? `+${heartPts} Life` : `+${heartPts}!`;
      GameState.charState.count.bloodAnim = 0.8;
      AudioManager.catch(); AudioManager.heart();
      FXManager.spawnParticles(entities, food.x, food.y, '#cc0000', 28);
      FXManager.spawnParticles(entities, food.x, food.y, '#ff69b4', 10);
      FXManager.spawnFloatingText(entities, food.x, food.y, healText, '#cc0000');
      frog.mouthOpen = 1.4;
      GameState.combo = 0; 
      EventBus.emit('foodCaught', { score: GameState.score, level: GameState.level, catchSource:context.catchSource });
      EventBus.emit('heartCaught');
      if (!ProgressionState.transitioning) {
        ProgressionState.foodsEaten++;
        if (ProgressionState.foodsEaten >= getCurrentLevelConfig().foodsToEat) triggerWaveComplete();
      }
    } else if (food.isBlueHeart) {
      GameState.maxLives = Math.min(GameState.maxLives + 1, GAME_BALANCE.lives.absoluteMax);
      GameState.lives    = Math.min(GameState.lives + 1, GameState.maxLives);
      AudioManager.catch(); AudioManager.heart();
      FXManager.spawnParticles(entities, food.x, food.y, '#44aaff', 28);
      FXManager.spawnParticles(entities, food.x, food.y, '#aaddff', 12);
      FXManager.spawnFloatingText(entities, food.x, food.y, '+Max HP!', '#44aaff');
      frog.mouthOpen = hasAbility(charDef,'wideCatch') ? 1.35 : 1.0;
      EventBus.emit('heartCaught');
    } else {
      GameState.lives = Math.min(GameState.lives + GAME_BALANCE.lives.heartHealAmount, GameState.maxLives || GAME_BALANCE.lives.defaultMax);
      AudioManager.catch(); AudioManager.heart();
      FXManager.spawnParticles(entities, food.x, food.y, '#ff69b4', 20);
      FXManager.spawnFloatingText(entities, food.x, food.y, '+1 Life!', '#ff69b4');
      frog.mouthOpen = hasAbility(charDef,'wideCatch') ? 1.35 : 1.0;
      EventBus.emit('heartCaught');
    }
    return; 
  } else {
    LiveStats.foodsCaught++;

    if (behavior.catchMechanism === 'count-feed-circle') {
      GameState.combo = Math.min(0, GameState.combo - 1);
      const negCombo = Math.abs(GameState.combo);
      const penaltyBase = charDef.stats.foodScorePenalty || 50;
      const penalty = Math.round(penaltyBase * (1 + negCombo * 0.15));
      GameState.score -= penalty;  
      GameState.charState.count.hissAnim = 0.5;
      FXManager.spawnParticles(entities, food.x, food.y, '#7a4a00', 8);
      const comboTag = negCombo > 2 ? ` x${negCombo}!` : '';
      FXManager.spawnFloatingText(entities, food.x, food.y, `-${penalty} pts${comboTag}`, '#ff6666');
      frog.mouthOpen = 0.6;
      recordArcadeFeastCatch(food, charDef, 0);
      EventBus.emit('foodCaught', { score: GameState.score, level: GameState.level, itemId: food.itemId, characterId: charDef.id, points:-penalty, combo:GameState.combo, isRare:Boolean(food.isRareFood), catchSource:context.catchSource });
      if (!ProgressionState.transitioning) {
        ProgressionState.foodsEaten++;
        if (ProgressionState.foodsEaten >= getCurrentLevelConfig().foodsToEat) triggerWaveComplete();
      }
    } else {
      if (context.advanceCombo && hasAbility(charDef, 'streakMultiplier')) {
        const royal = GameState.charState.royal;
        const bellyMax = charDef.stats.bellyGrowthMax || 40;
        royal.streak++;
        if (royal.streak > 0 && royal.streak % GAME_BALANCE.royal.streakTier === 0) {
          royal.multiplier = Math.min(GAME_BALANCE.royal.multiplierMax, royal.multiplier + 1);
          if (hasAbility(charDef, 'growingBelly')) royal.belly = Math.min(bellyMax, royal.belly + 8);
        }
      }
      if (context.advanceCombo) GameState.combo++;
      const basePts = calcScorePerCatch(charDef, {
        allowComboScoreModifiers:context.allowComboScoreModifiers,
        catchSource:context.catchSource,
      });
      const affinityBonus = context.grantFavouriteAffinity ? getFeastAffinityBonus(charDef, food, basePts) : 0;
      const premiumBonus = context.grantRareFoodBonus && food.isRareFood ? basePts * 2 : 0;
      const pts = Math.round((basePts + affinityBonus + premiumBonus) * context.scoreFactor);
      GameState.score += pts;
      if (context.advanceCombo) AudioManager.catchForCombo(GameState.combo); else AudioManager.catch();
      FXManager.spawnParticles(entities, food.x, food.y, charDef.color || '#7edd54');
      FXManager.spawnFloatingText(entities, food.x, food.y, `+${pts}`, '#ffd700');
      if (affinityBonus > 0) FXManager.spawnFloatingText(entities, food.x, food.y - 25, `Favourite +${affinityBonus}`, charDef.color || '#ff9bd3');
      if (premiumBonus > 0) {
        FXManager.spawnParticles(entities, food.x, food.y, '#ffe16b', 22);
        FXManager.spawnFloatingText(entities, food.x, food.y - 48, `RARE +${premiumBonus}`, '#fff1a8');
      }
      if (context.playEatReaction) frog.mouthOpen = hasAbility(charDef,'wideCatch') ? 1.4 : 1.0;
      recordArcadeFeastCatch(food, charDef, affinityBonus + premiumBonus, context);
      EventBus.emit('foodCaught', { score: GameState.score, level: GameState.level, itemId: food.itemId, characterId: charDef.id, affinityBonus, premiumBonus, points:pts, combo:GameState.combo, isRare:Boolean(food.isRareFood), catchSource:context.catchSource });
      
      if (!ProgressionState.transitioning) {
        ProgressionState.foodsEaten++;
        if (ProgressionState.foodsEaten >= getCurrentLevelConfig().foodsToEat) {
          triggerWaveComplete();
        }
      }
    }
  }
}


// Seconds an item may wait for its approved image before the verified fallback
// identity is forced. The wait must always terminate: a held item is pinned
// off-screen, and Wave Clear now drains the live playfield instead of purging
// it, so an endless wait would stall wave progression outright.
const FOOD_VISUAL_WAIT_FALLBACK = 4;
const FOOD_VISUAL_WAIT_HARD_LIMIT = 10;

function arcadeFoodVisualReady(food, dt) {
  if (!food || food.isBomb || food.isHazard || food.isHeart || food.isSun || food.isSyringe || food.isPowerUp || food.isGiftBox) return true;
  if (typeof ArcadeAssetBindings === 'undefined' || typeof AssetManager === 'undefined') return true;
  const binding = ArcadeAssetBindings.getForItem?.(food.itemId);
  const assetKey = binding?.runtimeAssetKey || binding?.assetKey || food.assetKey;
  if (assetKey && AssetManager.isReady?.(assetKey)) {
    food.assetKey = assetKey;
    delete food.visualWaitSeconds;
    return true;
  }
  if (assetKey) AssetManager.load?.(assetKey);
  food.visualWaitSeconds = Math.max(0, Number(food.visualWaitSeconds) || 0) + Math.max(0, Number(dt) || 0);
  // Keep the entity outside the visible area. It is not counted as a miss and
  // cannot be caught until its approved runtime image is actually drawable.
  food.y = Math.min(Number(food.y) || -CONFIG.FOOD_H, -CONFIG.FOOD_H);
  // An unbindable item, or an image that never resolves and never reports a
  // failure, must still reach the fallback instead of waiting forever.
  const unresolvable = !assetKey
    || Boolean(AssetManager.listFailures?.().some(item => item.assetKey === assetKey))
    || food.visualWaitSeconds >= FOOD_VISUAL_WAIT_HARD_LIMIT;
  if (food.visualWaitSeconds >= FOOD_VISUAL_WAIT_FALLBACK && unresolvable) {
    // A verified approved apple is the fail-safe identity. Update both gameplay
    // identity and artwork together so the player is never shown the wrong food.
    const fallback = typeof getArcadeFoodDef === 'function' ? getArcadeFoodDef('food.apple') : null;
    if (fallback?.itemId && fallback?.assetKey && fallback.assetKey !== assetKey) {
      food.itemId = fallback.itemId;
      food.assetKey = fallback.assetKey;
      food.visualWaitSeconds = 0;
      AssetManager.load?.(fallback.assetKey);
    } else {
      // Even the verified fallback cannot render. Retire the entity rather than
      // holding it off-screen forever: it was never visible, never catchable,
      // and never scoreable, so dropping it removes nothing from live play.
      food.visualRetired = true;
    }
  }
  return false;
}

function updateFoods(dt) {
  const _foodSpeedScale = typeof StatusEffectSystem.hasActiveHook !== 'function' || StatusEffectSystem.hasActiveHook('onFoodSpeedScale')
    ? StatusEffectSystem.modify('onFoodSpeedScale', 1.0, {})
    : 1.0;
  const _magnetDef      = StatusEffectSystem.get('magnet');
  const _magnetActive   = !!_magnetDef;
  const _vacuumActive   = StatusEffectSystem.has('vacuum');
  const charDef         = getCharDef();

  for (let i = entities.foods.length - 1; i >= 0; i--) {
    // Stop processing if game ended mid-loop (bomb catch, etc.)
    if (GameState.mode === GAME_MODES.DEAD) break;
    const f = entities.foods[i];

    if (!arcadeFoodVisualReady(f, dt)) {
      if (f.visualRetired) entities.foods.splice(i, 1);
      continue;
    }

    // ── Magnet: home positive items toward frog ────────────────
    if (_magnetActive && _magnetDef && _magnetDef.def && typeof _magnetDef.def.onFoodUpdate === 'function') {
      _magnetDef.def.onFoodUpdate(f, dt, frog.x, frog.y);
      // After homing movement, check if item is close enough to auto-catch
      if (!f.isBomb && !f.isSun) {
        const dx = f.x - frog.x, dy = f.y - frog.y;
        const catchR = (charDef.stats.catchRadius || 32) + 18; // a little generous on auto-catch
        if (dx*dx + dy*dy < catchR*catchR) {
          entities.foods.splice(i, 1);
          if (charDef.id === 'toadal') handleToadalCatch(f, charDef);
          else handleFoodCaught(f, charDef);
          continue;
        }
      }
    } else if (_vacuumActive && !f.isBomb && !f.isSun && f.y <= frog.y - CONFIG.FROG_H * 0.18) {
      // ── Vacuum: only draw eligible items that are above the frog. ──────
      // The target is the mouth/top of the model, so the player still needs
      // to move under falling items instead of collecting everything nearby.
      const mouthX = frog.x;
      const mouthY = frog.y - CONFIG.FROG_H * 0.42;
      const vdx = mouthX - f.x, vdy = mouthY - f.y;
      const vdist = Math.hypot(vdx, vdy) || 1;
      const vStrength = 520;
      f.x += (vdx / vdist) * vStrength * dt;
      f.y += (vdy / vdist) * vStrength * dt;
      const cdx = f.x - mouthX, cdy = f.y - mouthY;
      const catchR = (charDef.stats.catchRadius || 32) + 16;
      if (cdx*cdx + cdy*cdy < catchR*catchR) {
        entities.foods.splice(i, 1);
        if (charDef.id === 'toadal') handleToadalCatch(f, charDef);
        else handleFoodCaught(f, charDef);
        continue;
      }
    } else {
      // Pattern formations keep their exact X positions while approaching the
      // reveal line, then hold there briefly. Without this, a correct launch
      // schedule can still look unreadable because wobble and immediate falling
      // pull the completed shape apart in the same second it forms.
      let heldByPattern = false;
      if (Number.isFinite(f.patternTargetY)) {
        if (!f.patternReached) {
          const nextY = f.y + f.speed * _foodSpeedScale * dt;
          if (nextY >= f.patternTargetY) {
            f.y = f.patternTargetY;
            f.patternReached = true;
            f.patternHoldRemaining = Math.max(0, Number(f.patternHoldRemaining ?? f.patternHoldDuration) || 0);
          } else {
            f.y = nextY;
          }
          heldByPattern = true;
        } else if (f.patternHoldRemaining > 0) {
          f.patternHoldRemaining = Math.max(0, f.patternHoldRemaining - dt);
          heldByPattern = true;
        } else {
          // Formation phase is complete; this item resumes normal gameplay
          // movement and any existing effects continue to work as before.
          delete f.patternTargetY;
          delete f.patternReached;
          delete f.patternHoldRemaining;
          delete f.patternHoldDuration;
        }
      }
      if (!heldByPattern) {
        // Normal movement only when magnet isn't pulling this item
        f.y += f.speed * _foodSpeedScale * dt;
        f.wobbleTime += dt;
        f.x += Math.sin(f.wobbleTime*1.5 + f.wobble*10) * f.wobble * 30 * dt;
      }
    }

    f.scale = Math.min(1, f.scale + dt * 4);

    if (f.y > CONFIG.CANVAS_H + CONFIG.FOOD_H) {
      entities.foods.splice(i, 1);
      
      if (!f.isBomb && !f.isHeart && !f.isSun && !f.isSyringe && !f.isPowerUp && !f.isGiftBox) {
        LiveStats.misses++;
        AbilitySystem.trigger('onFoodMissed', getCharDef(), { food: f });
        DDAManager.recordMiss(); // Feed difficulty director on every miss, regardless of mode
        // `missPenalty` controls damage/score punishment, not whether the mode
        // is informed that a food escaped. No-damage modes (Zen/FMF) still
        // rely on onFoodMissed for presentation and combo/streak cleanup.
        const modeConfig = getModeConfig();
        const _cd = getCharDef();
        if (getMissPenaltyEnabled() && hasAbility(_cd, 'vampireFeed')) {
          const penalty = _cd.stats.foodScorePenalty || 50;
          GameState.score -= penalty;
          AudioManager.miss();
          FXManager.spawnFloatingText(entities, f.x, CONFIG.CANVAS_H - 40, `-${penalty} pts`, '#ff6666');
          GameState.combo = Math.min(0, GameState.combo - 1);
        } else if (modeConfig.onFoodMissed) {
          modeConfig.onFoodMissed(f);
        }
      }
    }
  }
}

function updateLevelProgression(dt) {
  if (!ProgressionState.transitioning) return;

  ProgressionState.transitionTimer += dt;
  // game-core.js owns this predicate. Do not re-implement it here; a divergent
  // inline copy is what previously let held items be counted as live food.
  const activeFoods = countActiveWaveDrainObjects();

  const minDisplay = Math.max(0, Number(ProgressionState.MIN_TRANSITION_DISPLAY || 0));
  // Do not advance on a timer while edible objects are still falling. The spawn
  // manager is already closed during this state, so the finite in-flight set can
  // be caught or miss naturally without the wave being wiped or overlapped.
  const readyToAdvance = ProgressionState.transitionTimer >= minDisplay && activeFoods === 0;
  if (readyToAdvance) {
    if (typeof ArcadeFeastVictory !== 'undefined' && ArcadeFeastVictory.interceptBeforeAdvance()) return;
    advanceToNextLevel();
  }
}

function updateFX(dt) {
  for (let i = entities.particles.length-1; i>=0; i--) {
    const p = entities.particles[i];
    p.x += p.vx*dt; p.y += p.vy*dt; p.vy += 300*dt; p.life -= dt;
    if (p.life <= 0) entities.particles.splice(i,1);
  }
  for (let i = entities.floatingTexts.length-1; i>=0; i--) {
    const t = entities.floatingTexts[i];
    t.y += t.vy*dt; t.life -= dt;
    if (t.life <= 0) entities.floatingTexts.splice(i,1);
  }
  if (RuntimeState.shakeTime > 0) RuntimeState.shakeTime -= dt;
  if (RuntimeState.ghostTime  > 0) RuntimeState.ghostTime  -= dt;
  if (typeof ArcadePresentationFeedback !== 'undefined') ArcadePresentationFeedback.tick(dt);
  if (typeof ArcadeAffinityPresentation !== 'undefined') ArcadeAffinityPresentation.tick(dt);
  if (typeof ArcadeEatingFinish !== 'undefined') ArcadeEatingFinish.tick(dt);
}

function circleCatch(food, x, y, radius) {
  const dx = food.x - x, dy = food.y - y;
  return dx*dx + dy*dy <= radius*radius;
}
function rectCatch(food, x, y, halfW, halfH) {
  return Math.abs(food.x - x) <= halfW &&
         food.y >= y - halfH && food.y <= y + halfH;
}

const CHOMPER_CHOMP_VISUAL_SECONDS = 26 / 30;

function handleToadalCatch(food, charDef) {
  if (typeof ArcadeToadalMechanics !== 'undefined' && typeof ArcadeToadalMechanics.handleDirectCatch === 'function') {
    return ArcadeToadalMechanics.handleDirectCatch(food, charDef);
  }
  const normal = !(food?.isBomb || food?.isHazard || food?.isSun || food?.isHeart || food?.isSyringe || food?.isPowerUp || food?.isGiftBox);
  handleFoodCaught(food, charDef, { catchSource:'toadal-direct', playEatReaction:normal });
  return true;
}

function handleChomperCatch(food, charDef) {
  const cs = GameState.charState.chomper;
  cs.chompTimer     = 0.18;
  cs.chompAnimTimer = CHOMPER_CHOMP_VISUAL_SECONDS;
  cs.chomping       = true;
  frog.mouthOpen    = 0.5;
  handleFoodCaught(food, charDef);
  return true;
}
function handleHippoCatch(food, charDef) {
  const cs = GameState.charState.hippo;
  if (cs.catchCooldown > 0) return false;
  cs.chompTimer = 0.18;
  // A held lunge remains visually and physically active. This short repeat
  // gate limits duplicate catches without starting a timed lunge sequence.
  cs.catchCooldown = Math.min(0.18, charDef.stats.lungeCooldown || 0.18);
  frog.mouthOpen = 1.45;
  handleFoodCaught(food, charDef);
  return true;
}
function handleFlytrapCatch(food, charDef) {
  frog.mouthOpen = 1.15;
  const cs = GameState.charState.flytrap;
  if (cs) {
    cs.catchAnimTimer = 0.72;
    if (food && (food.isGiftBox || food.isPowerUp || food.isHeart || food.isBlueHeart)) {
      cs.rareAnimTimer = 1.1;
    }
  }
  handleFoodCaught(food, charDef);
  return true;
}
function handlePelicanCatch(food, charDef) {
  frog.mouthOpen = 1.0;
  const cs = GameState.charState.pelican;
  const now = _gullyAnimationNow();
  cs.pouchFull = 1;
  cs.catchAnimUntil = Math.max(Number(cs.catchAnimUntil || 0), now + 0.18);
  cs.catchAnimTimer = Math.max(0, cs.catchAnimUntil - now);
  if (food && (food.isGiftBox || food.isPowerUp || food.isHeart || food.isBlueHeart)) {
    cs.rareAnimUntil = Math.max(Number(cs.rareAnimUntil || 0), now + 0.45);
    cs.rareAnimTimer = Math.max(0, cs.rareAnimUntil - now);
  }
  handleFoodCaught(food, charDef);
  return true;
}
function handleGulperCatch(food, charDef) {
  frog.mouthOpen = 1.2;
  const state = GameState.isTC ? GameState.toadalConsumption : GameState.charState.gulper;
  const duration = Math.max(0.1, Number(state.eatAnimDuration || 0.58));
  state.chomping = true;
  state.chompTime = duration;
  state.eatAnimTimer = duration;
  // Standard Arcade intentionally does not mutate Gulper's size or authored
  // body stage. The eating animation still plays, but growth is exclusive to
  // Toadal Consumption and is owned by that mode's onFoodCaught hook.
  if (!GameState.isTC) {
    state.foodsEaten = 0;
    state.size = 1;
    state.targetSize = 1;
    state.pendingTargetSize = null;
    state.growthPulse = 0;
  }
  handleFoodCaught(food, charDef);
  return true;
}
function handleCountCatch(food, charDef) {
  handleFoodCaught(food, charDef);
  return true;
}
function handleBobCatch(food, charDef) {
  const cs = GameState.charState.bob;
  if (food.isBomb) {
    const hazard = typeof getHazardDef === 'function'
      ? getHazardDef(food.hazardType)
      : { id: 'bomb', label: 'Bomb', color: '#ff4444' };
    LiveStats.bombsCaught++;
    AudioManager.bomb();
    if (!GAME_BALANCE.invincible && !StatusEffectSystem.has('shield')) GameState.lives = Math.max(0, GameState.lives - 1);
    if (typeof SETTINGS === 'undefined' || !SETTINGS.reduceMotion) RuntimeState.shakeTime = 0.3;
    if (typeof SETTINGS !== 'undefined' && SETTINGS.ghostFrames) RuntimeState.ghostTime = 0.8;
    if (typeof Haptic !== 'undefined') Haptic.miss();
    FXManager.spawnParticles(entities, food.x, food.y, hazard.color || '#ff4444', 16);
    FXManager.spawnFloatingText(entities, food.x, food.y, 'Basket spilled!', hazard.color || '#ff4444');
    cs.basketItems = [];
    frog.mouthOpen = 0.3;
    GameState.combo = 0;
    if (GameState.lives <= 0) triggerGameOver(hazard.gameOverTitle || 'Game Over!', hazard.gameOverSub || 'Caught a hazard!', 'hazard', false, { hazardId:hazard.id || 'bomb', hazardLabel:hazard.label || 'hazard' });
    EventBus.emit('playerDamaged', { source: `hazard:${hazard.id || 'bomb'}` });
    return true;
  }
  if (food.isHeart) {
    LiveStats.heartsCaught++;
    GameState.lives = Math.min(GameState.lives + GAME_BALANCE.lives.heartHealAmount, GameState.maxLives);
    AudioManager.catch(); AudioManager.heart();
    FXManager.spawnParticles(entities, food.x, food.y, '#ff69b4', 14);
    FXManager.spawnFloatingText(entities, food.x, food.y, '+1 Life!', '#ff69b4');
    frog.mouthOpen = 0.3;
    return true;
  }
  if (cs.basketItems.length < GAME_BALANCE.bob.basketMax) {
    cs.basketItems.push(food.itemId);
    AudioManager.catch();
    recordArcadeFeastCatch(food, charDef, 0);
    FXManager.spawnFloatingText(entities, food.x, food.y, cs.basketItems.length + '/5', '#f4c17a');
    frog.mouthOpen = 0.4;
  } else {
    if (!food.bobBasketFullNotified) {
      food.bobBasketFullNotified = true;
      AudioManager.miss();
      RuntimeState.shakeTime = 0.08;
      FXManager.spawnFloatingText(entities, food.x, food.y, 'Basket Full!', '#ffaa00');
    }
    return false;
  }
  return true;
}

const CatchHandlers = {
  toadalPassiveEat: handleToadalCatch,
  basketCatch:   handleBobCatch,
  chomperCatch:  handleChomperCatch,
  gulperCatch:   handleGulperCatch,
  flyingCatch:   handlePelicanCatch,
  snapJaw:       handleFlytrapCatch,
  heavyMovement: handleHippoCatch,
  vampireFeed:   handleCountCatch,
};

function processCharacterCatch(food) {
  const charDef = getCharDef();
  const handlerKey = getActiveArcadeBehaviorProfile(charDef).catchHandlerAbility;
  const handler = handlerKey ? CatchHandlers[handlerKey] : null;
  return handler ? handler(food, charDef) : false;
}

function updatePassiveCatch(dt) {
  const charDef = getCharDef();
  const behavior = getActiveArcadeBehaviorProfile(charDef);
  const mechanism = behavior.catchMechanism;
  const isHippo = mechanism === 'hippo-lunge-rect';
  const isChomper = mechanism === 'chomper-mouth-rect';
  const isFlytrap = mechanism === 'flytrap-snap-circle';
  const isBob = mechanism === 'bob-basket-rect';
  const isPelican = mechanism === 'gully-pouch-circle';
  const isCount = mechanism === 'count-feed-circle';
  const isGulper = mechanism === 'gulper-mouth-rect';
  const isToadal = mechanism === 'toadal-contact-circle';

  if (behavior.catchTrigger !== 'passive' && behavior.catchTrigger !== 'hold') return;

  if (isGulper) {
    const state = GameState.isTC ? GameState.toadalConsumption : GameState.charState.gulper;
    const safeDt = Math.max(0, Math.min(0.1, Number(dt) || 0));
    if (!GameState.isTC) {
      state.size = 1;
      state.targetSize = 1;
      state.foodsEaten = 0;
      state.pendingTargetSize = null;
      state.growthPulse = 0;
      state.shrinkPulse = 0;
      state.breatheTime = (Number(state.breatheTime || 0) + safeDt * 2.2) % (Math.PI * 2);
    }
    const cs = GameState.charState.gulper;
    if (Number(state.chompTime || 0) > 0) {
      state.chompTime = Math.max(0, Number(state.chompTime || 0) - safeDt);
      if (state.chompTime <= 0) state.chomping = false;
    }
    if (!GameState.isTC) state.eatAnimTimer = Math.max(0, Number(state.eatAnimTimer || 0) - safeDt);
    const mouthActive = GameState.isTC ? !state.mouthClosed : Boolean(cs.mouthHeld || state.chomping);
    frog.mouthOpen = mouthActive ? 0.72 : 0.12;
    if (mouthActive) {
      const visualScale = GameState.isTC
        ? Math.max(GULPER_TOADAL_MIN_SCALE || 0.25, Math.min(GULPER_TOADAL_MAX_SCALE || Math.sqrt(20), Number(state.size || getGulperToadalVisualScale(state.foodsEaten))))
        : 1;
      const mouthW = GameState.isTC && typeof GulperArcadeAnimationRenderer !== 'undefined'
        ? GulperArcadeAnimationRenderer.catchHalfWidth()
        : Math.max(24, 44 * visualScale);
      const mouthCY = GameState.isTC && typeof GulperArcadeAnimationRenderer !== 'undefined'
        ? GulperArcadeAnimationRenderer.mouthCenterY()
        : (frog.y + 26) - 61 * visualScale;
      const mouthH = GameState.isTC && typeof GulperArcadeAnimationRenderer !== 'undefined'
        ? GulperArcadeAnimationRenderer.catchHalfHeight()
        : Math.max(14, 18 * visualScale);
      for (let i = entities.foods.length - 1; i >= 0; i--) {
        const f = entities.foods[i];
        if (rectCatch(f, frog.x, mouthCY, mouthW, mouthH)) {
          entities.foods.splice(i, 1);
          handleGulperCatch(f, charDef);
        }
      }
    }
  }

  if (isBob) {
    const cs         = GameState.charState.bob;
    const leanTarget = cs.leaning ? 1 : 0;
    const leanSpd    = leanTarget > cs.leanAmt ? 14 : 8;
    cs.leanAmt      += (leanTarget - cs.leanAmt) * Math.min(1, dt * leanSpd);
  }

  if (isHippo) {
    const cs = GameState.charState.hippo;
    if (cs.catchCooldown > 0) cs.catchCooldown = Math.max(0, cs.catchCooldown - dt);
    if (cs.chompTimer > 0) {
      cs.chompTimer -= dt;
      cs.mouthOpen   = Math.min(1, cs.mouthOpen + dt * 18);
    } else {
      const target = cs.lunging ? 1 : 0;
      const speed  = target > cs.mouthOpen ? 16 : 7;
      cs.mouthOpen += (target - cs.mouthOpen) * Math.min(1, dt * speed);
    }
    frog.mouthOpen = cs.mouthOpen * 1.45;
  }

  if (isChomper) {
    const cs = GameState.charState.chomper;
    if (cs.chompTimer > 0) {
      cs.chompTimer -= dt;
      if (cs.chompTimer <= 0) { cs.chomping = false; cs.chompTimer = 0; }
    }
    if (cs.chompAnimTimer > 0) cs.chompAnimTimer = Math.max(0, cs.chompAnimTimer - dt);
    frog.mouthOpen = (cs.chomping || cs.chompAnimTimer > 0.06) ? 0.55 : 0.15;
  }

  for (let i = entities.foods.length - 1; i >= 0; i--) {
    const f = entities.foods[i];
    let caught = false;

    if (isHippo) {
      const cs    = GameState.charState.hippo;
      if (cs.lunging && cs.mouthOpen > 0.08 && cs.catchCooldown <= 0) {
        const halfW = (charDef.stats.catchRadius || 48) + cs.mouthOpen * 60;
        const lungeX = frog.x + (frog.facing * (charDef.stats.lungeDistance || 140) * cs.mouthOpen);
        caught = rectCatch(f, lungeX, frog.y - 20, halfW, 40);
      }
    }
    if (!caught && isChomper) {
      const cs = GameState.charState.chomper;
      if (cs.chompTimer <= 0) {
        caught = rectCatch(f, frog.x, frog.y - 20, charDef.stats.catchRadius || 48, 40);
      }
    }
    if (!caught && isFlytrap) {
      caught = circleCatch(f, frog.x, frog.y, charDef.stats.catchRadius || 70);
    }
    if (!caught && isPelican) {
      caught = circleCatch(f, frog.x, frog.y, charDef.stats.catchRadius || 52);
    }
    if (!caught && isCount) {
      const bonus = (GameState.charState.ninja && GameState.charState.ninja.jumpCatchBonus) || 0;
      caught = circleCatch(f, frog.x, frog.y, (charDef.stats.catchRadius || 34) + bonus);
    }
    if (!caught && isToadal) {
      const shape = behavior.collisionShape || {};
      const centerYOffset = Number.isFinite(Number(shape.centerYOffset)) ? Number(shape.centerYOffset) : -46;
      const radiusStat = String(shape.radiusStat || 'catchRadius');
      const radius = Number(charDef.stats?.[radiusStat] || charDef.stats.catchRadius || 38);
      caught = circleCatch(f, frog.x, frog.y + centerYOffset, radius);
    }
    if (!caught && isBob) {
      const cs    = GameState.charState.bob;
      const bonus = cs.leanAmt * (charDef.stats.basketLeanBonus || 55);
      caught = rectCatch(f, frog.x, frog.y - 30, (charDef.stats.catchRadius || 52) + bonus, 30);
    }

    if (caught) {
      const consumed = processCharacterCatch(f);
      if (consumed !== false) entities.foods.splice(i, 1);
    }
  }
}

const BOB_CHEST = {
  // Keep Bob's semantic chest inside the shared foreground-floor corridor.
  // At the former extreme-right anchor the authored chapter art can resolve to
  // flowers/water-edge instead of walkable ground, making the chest appear to
  // float even though its gameplay Y is valid. This inset remains comfortably
  // reachable inside Bob's normal horizontal movement range.
  x: CONFIG.CANVAS_W - 96,
  y: CONFIG.CANVAS_H - 95,
  w: 52,
  h: 40,
  get triggerX() { return this.x; },
};

function updateBobChest(dt) {
  const charDef = getCharDef();
  if (getActiveArcadeBehaviorProfile(charDef).specialState !== 'bob-basket') return;
  const cs = GameState.charState;

  if (cs.bob.chestAnim  > 0) cs.bob.chestAnim  -= dt;
  if (cs.bob.depositAnim > 0) cs.bob.depositAnim -= dt;
  if (!cs.bob.coinBurst || typeof cs.bob.coinBurst !== 'object') cs.bob.coinBurst = { time:0, count:0 };
  if (cs.bob.coinBurst.time > 0) cs.bob.coinBurst.time = Math.max(0, cs.bob.coinBurst.time - dt);

  if (cs.bob.basketItems.length === 0) return;
  const nearChest = Math.abs(frog.x - BOB_CHEST.x) < GAME_BALANCE.bob.chestTriggerDist && frog.y > CONFIG.CANVAS_H - 120;
  if (!nearChest) return;

  const items = [...cs.bob.basketItems];
  cs.bob.basketItems = [];
  cs.bob.bankedItems = Math.max(0, Number(cs.bob.bankedItems || 0)) + items.length;
  cs.bob.chestAnim  = 0.6;
  cs.bob.depositAnim = 0.8;
  cs.bob.coinBurst = { time:1.2, count:Math.max(6, Math.min(14, items.length + 5)) };
  let totalPts = 0;
  let totalAffinityBonus = 0;
  let totalPremiumBonus = 0;
  const scoredItems = items.map(itemId => {
    const definition = typeof getArcadeFoodDef === 'function' ? getArcadeFoodDef(itemId) : { itemId };
    const food = { itemId, category:definition?.category || '', isRareFood:definition?.rare === true };
    const basePts = calcScorePerCatch(charDef);
    const affinityBonus = getFeastAffinityBonus(charDef, food, basePts);
    const premiumBonus = food.isRareFood ? basePts * 2 : 0;
    totalAffinityBonus += affinityBonus;
    totalPremiumBonus += premiumBonus;
    totalPts += basePts + affinityBonus + premiumBonus;
    return { itemId, affinityBonus, premiumBonus, points:basePts + affinityBonus + premiumBonus, combo:GameState.combo, isRare:Boolean(food.isRareFood) };
  });
  GameState.score += totalPts;
  AudioManager.levelUp && [660, 880, 1100].forEach((f, i) => _safeTimeout(() => AudioManager.catch(), i * 55));
  FXManager.spawnParticles(entities, BOB_CHEST.x, BOB_CHEST.y, '#ffd700', 20);
  FXManager.spawnFloatingText(entities, BOB_CHEST.x, BOB_CHEST.y - 30, `+${totalPts} Coins`, '#ffd700');
  if (totalAffinityBonus > 0) FXManager.spawnFloatingText(entities, BOB_CHEST.x, BOB_CHEST.y - 54, `Favourite +${totalAffinityBonus}`, '#f4c17a');
  if (totalPremiumBonus > 0) FXManager.spawnFloatingText(entities, BOB_CHEST.x, BOB_CHEST.y - 76, `RARE +${totalPremiumBonus}`, '#fff1a8');
  scoredItems.forEach(item => EventBus.emit('foodCaught', { score:GameState.score, level:GameState.level, characterId:charDef.id, catchSource:'bob-bank', ...item }));
  if (!ProgressionState.transitioning) {
    const requirement = Math.max(1, Math.floor(Number(getCurrentLevelConfig().foodsToEat) || 1));
    const nextTotal = Math.max(0, Math.floor(Number(ProgressionState.foodsEaten) || 0)) + items.length;
    ProgressionState.foodsEaten = nextTotal;
    if (nextTotal >= requirement) {
      ProgressionState.foodCarryover = Math.max(0, nextTotal - requirement);
      triggerWaveComplete();
    }
  }
}


function updateModeTick(dt) {
  const modeConfig = getModeConfig();
  if (modeConfig.onTick) {
    modeConfig.onTick(dt);
  }
}

function syncPlayerSpriteState(yOffset = 0) {
  if (typeof SpriteRenderer === 'undefined' || !frog || typeof getCharDef !== 'function') return false;
  const charDef = getCharDef();
  if (!charDef || typeof isSpriteRenderedCharacter !== 'function' || !isSpriteRenderedCharacter(charDef.id)) return false;
  let state = SpriteRenderer.getCharacterState('player');
  if ((!state || !state.definition || state.definition.id !== charDef.id)
    && (typeof initPlayerSpriteRenderer !== 'function' || !initPlayerSpriteRenderer(charDef.id))) {
    return false;
  }
  state = SpriteRenderer.getCharacterState('player');
  if (!state) return false;
  const behavior = getActiveArcadeBehaviorProfile(charDef);
  const spriteIsMoving = frog.moveDir !== 0 || Math.abs(frog.moveY || 0) > 0 || frog.isMoving;
  let currentState = spriteIsMoving ? 'moving' : 'idle';
  if (behavior.spriteStateFamily === 'classic-sheet') {
    if (typeof tongue !== 'undefined' && tongue.active) currentState = 'tongueExtend';
    else if (spriteIsMoving) currentState = frog.facing < 0 ? 'moveLeft' : 'moveRight';
  }
  SpriteRenderer.updateCharacter('player', {
    x: frog.x,
    y: frog.y + yOffset,
    currentState,
    flipX: behavior.facingPolicy === 'front-locked' || behavior.spriteStateFamily === 'classic-sheet'
      ? false
      : frog.facing < 0,
  });
  return true;
}

function update(dt) {
  if (typeof bgStars !== 'undefined') for (const s of bgStars) s.twinkle += 0.02;
  if (typeof INFINITE_MODE_STATE !== 'undefined'
    && GameState.currentMode === 'infinite'
    && GameState.mode === INFINITE_MODE_STATE) {
    if (typeof InfiniteGameHost !== 'undefined') InfiniteGameHost.update(dt);
    return;
  }
  if (typeof CONNECT3_MODE_STATE !== 'undefined'
    && GameState.currentMode === 'connect3'
    && GameState.mode === CONNECT3_MODE_STATE) {
    if (typeof connect3Update === 'function') connect3Update(dt);
    return;
  }
  if (GameState.mode !== GAME_MODES.PLAYING) return;
  GameClock.tick(dt);
  updateModeTick(dt);
  if (typeof ArcadeLivingFeastDirector !== 'undefined') ArcadeLivingFeastDirector.update(dt);
  if (GameState.mode !== GAME_MODES.PLAYING) return; 
  if (GameState.charState.count.bloodAnim > 0) GameState.charState.count.bloodAnim -= dt * 1.5;
  if (GameState.charState.count.hissAnim  > 0) GameState.charState.count.hissAnim  -= dt * 2;
  updateFrog(dt);
  if (typeof ArcadeToadalMechanics !== 'undefined') ArcadeToadalMechanics.updateActions(dt);
  syncPlayerSpriteState();
  updateTongue(dt);
  updatePassiveCatch(dt);
  updateBobChest(dt);
  updateClone(dt);
  SpawnManager.update(dt, entities);
  if (typeof ArcadeToadalMechanics !== 'undefined') ArcadeToadalMechanics.beforeFoodUpdate();
  updateFoods(dt);
  if (typeof ArcadeToadalMechanics !== 'undefined') ArcadeToadalMechanics.afterFoodUpdate();
  updateLevelProgression(dt);
  if (typeof LivingFeastBackgroundRenderer !== 'undefined') LivingFeastBackgroundRenderer.update(dt);
  updateFX(dt);
  StatusEffectSystem.update(dt);
  if (typeof AbilitySystem.hasHook !== 'function' || AbilitySystem.hasHook('onTick')) AbilitySystem.trigger('onTick', getCharDef(), { dt });
}


let rafId = null;

// Fixed simulation steps prevent high debug multipliers from skipping past
// tongue/catch collisions. Rendering remains once per browser frame, while the
// world is advanced in small deterministic slices.

// Shared presentation cadence owner for Arcade, Puzzle and Infinite.
// The legacy mobile DPR/FPS adaptation path below remains Arcade-only until E4.
const EngineFrameScheduler = (() => {
  let targetFps=0,lastAcceptedAt=0,nextAcceptedAt=0,acceptedFrames=0,skippedFrames=0,statsStartedAt=performance.now(),boundMode='',lastAcceptedIntendedFps=0,lastAcceptedPhase='idle';
  const EMPTY_PRESSURE_WINDOW=Object.freeze({elapsedMs:0,acceptedFrames:0,skippedFrames:0,acceptedFps:0,skipPercentage:0,desiredFps:0,deliveryRatio:1});
  function activeGameplayMode(){if(typeof GameState==='undefined')return false;const mode=GameState.mode;if(mode===GAME_MODES.PLAYING)return true;return(typeof INFINITE_MODE_STATE!=='undefined'&&mode===INFINITE_MODE_STATE)||(typeof PUZZLE_MODE_STATE!=='undefined'&&mode===PUZZLE_MODE_STATE)||(typeof CONNECT3_MODE_STATE!=='undefined'&&mode===CONNECT3_MODE_STATE);}
  function boundModeId(){if(typeof GameState==='undefined')return'arcade';if(GameState.currentMode==='connect3'||GameState.screen==='feastfall')return'feastfall';if(GameState.currentMode==='puzzle')return'puzzle';if(GameState.currentMode==='infinite')return'infinite';return'arcade';}
  function modeBudget(modeId=boundMode||boundModeId()){return globalThis.FroggyEnginePerformance?.budgetForMode?.(modeId)||Object.freeze({targetFps:60,idleFps:30,renderDprCap:3,profile:'fallback'});}
  function renderScaleController(){return typeof globalThis!=='undefined'?globalThis.FroggyRenderScaleController:null;}
  function publishTarget(){document.documentElement.dataset.engineTargetFps=String(targetFps||0);document.documentElement.dataset.engineBudgetMode=String(boundMode||'arcade');if(boundMode==='arcade')document.documentElement.dataset.arcadeTargetFps=String(targetFps||0);}
  function refreshBudget(modeId=boundMode||boundModeId(),reason='engine-budget-refresh'){const nextMode=String(modeId||'arcade');if(boundMode&&nextMode!==boundMode)return false;const budget=modeBudget(nextMode);targetFps=Math.max(1,Number(budget.targetFps)||60);renderScaleController()?.setBudgetCap?.(Math.max(1,Number(budget.renderDprCap)||3),`${reason}:${nextMode}`);publishTarget();return true;}
  function rebaseCadence(timestamp){lastAcceptedAt=timestamp;nextAcceptedAt=0;lastAcceptedIntendedFps=0;lastAcceptedPhase='idle';}
  function bindMode(modeId,timestamp=performance.now()){const next=String(modeId||'arcade');if(next===boundMode)return false;boundMode=next;acceptedFrames=0;skippedFrames=0;statsStartedAt=timestamp;rebaseCadence(timestamp);refreshBudget(next,'mode-budget');return true;}
  function syncBoundMode(timestamp=performance.now()){return bindMode(boundModeId(),timestamp);}
  function activeGameplayTargetFps(){const modeId=boundMode||boundModeId();const authority=globalThis.FroggyEnginePerformance;const designTarget=Math.max(1,Number(modeBudget(modeId).targetFps)||60);if(modeId==='infinite'&&typeof InfinitePerformance!=='undefined'&&InfinitePerformance?.current){const userPreference=Math.max(0,Number(InfinitePerformance.current().targetFps)||0);return Math.max(1,Number(authority?.targetFpsForMode?.('infinite',userPreference))||(userPreference>0?Math.min(designTarget,userPreference):designTarget));}return Math.max(1,Number(authority?.targetFpsForMode?.(modeId))||designTarget);}
  function desiredFps(){if(document.hidden)return 0;const modeId=boundMode||boundModeId();if(activeGameplayMode())return activeGameplayTargetFps();return Math.max(1,Number(modeBudget(modeId).idleFps)||30);}
  function accept(timestamp){syncBoundMode(timestamp);const fps=desiredFps();const phase=activeGameplayMode()?'active':'idle';if(document.hidden){skippedFrames+=1;return false;}const minFrameMs=1000/fps;if(!nextAcceptedAt)nextAcceptedAt=timestamp;if(timestamp+0.75<nextAcceptedAt){skippedFrames+=1;return false;}lastAcceptedAt=timestamp;lastAcceptedIntendedFps=fps;lastAcceptedPhase=phase;acceptedFrames+=1;nextAcceptedAt+=minFrameMs;if(nextAcceptedAt<timestamp-minFrameMs)nextAcceptedAt=timestamp+minFrameMs;return true;}
  function reset(timestamp=performance.now()){boundMode=boundModeId();acceptedFrames=0;skippedFrames=0;statsStartedAt=timestamp;rebaseCadence(timestamp);refreshBudget(boundMode,'scheduler-reset');}
  function snapshot(timestamp=performance.now()){const elapsedMs=Math.max(1,Number(timestamp)-Number(statsStartedAt||timestamp));const scale=renderScaleController()?.snapshot?.()||null;const budget=modeBudget(boundMode||boundModeId());return Object.freeze({boundMode,targetFps:targetFps||0,effectiveTargetFps:desiredFps()||0,renderDpr:scale?.currentDpr||(typeof DPR!=='undefined'?DPR:1),renderDprStage:scale?.stage||0,renderDprCap:Number(budget.renderDprCap)||null,budgetProfile:String(budget.profile||''),frameP95Ms:0,acceptedFrames,skippedFrames,acceptedFps:Math.round((acceptedFrames*100000)/elapsedMs)/100,skipPercentage:Math.round((skippedFrames*10000)/Math.max(1,acceptedFrames+skippedFrames))/100,pressureWindow:EMPTY_PRESSURE_WINDOW,elapsedMs:Math.round(elapsedMs)});}
  return Object.freeze({accept,reset,bindMode,syncBoundMode,refreshBudget,snapshot,get targetFps(){return targetFps;},get boundMode(){return boundMode;},get observationIntendedFps(){return lastAcceptedIntendedFps;},get observationPhase(){return lastAcceptedPhase;}});
})();
if (typeof globalThis !== 'undefined') {
  globalThis.FroggyEngineFrameScheduler = EngineFrameScheduler;
  // Compatibility alias for existing diagnostics. The shared game loop never
  // routes Puzzle or Infinite through the Arcade-named surface.
  globalThis.FroggyArcadeFrameGovernor = EngineFrameScheduler;
}
if (typeof globalThis !== 'undefined' && typeof globalThis.addEventListener === 'function') {
  globalThis.addEventListener('froggy-engine-performance-change', event => { const detail=event?.detail||{}; if(detail.mode!==EngineFrameScheduler.boundMode)return; EngineFrameScheduler.refreshBudget(detail.mode,'engine-authority-change'); });
}

const SIM_STEP_SECONDS = 1 / 120;
const MAX_REAL_FRAME_SECONDS = 0.05;
const MAX_SIMULATION_SECONDS = 0.30;
function runSimulationSafely(scaledDt) {
  const frameIntegratedMode = typeof GameState !== 'undefined' && (
    (typeof PUZZLE_MODE_STATE !== 'undefined' && GameState.currentMode === 'puzzle' && GameState.mode === PUZZLE_MODE_STATE)
    || (typeof CONNECT3_MODE_STATE !== 'undefined' && GameState.currentMode === 'connect3' && GameState.mode === CONNECT3_MODE_STATE)
  );
  // Puzzle and Feastfall already integrate motion using elapsed-time values and
  // do not need Arcade's collision substeps. Feeding them a single 1/120 step
  // per accepted frame made their timers/falling run at a fraction of real
  // time in the full-game shell even though standalone mode was correct.
  if (frameIntegratedMode) {
    update(Math.min(Math.max(0, scaledDt), MAX_SIMULATION_SECONDS));
    return;
  }

  let remaining = Math.min(Math.max(0, scaledDt), MAX_SIMULATION_SECONDS);
  let steps = 0;
  const maxSteps = Math.ceil(MAX_SIMULATION_SECONDS / SIM_STEP_SECONDS);
  while (remaining > 0.000001 && steps < maxSteps) {
    const step = Math.min(SIM_STEP_SECONDS, remaining);
    update(step);
    remaining -= step;
    steps++;
    const keepsSimulationActive = GameState.mode === GAME_MODES.PLAYING
      || (typeof INFINITE_MODE_STATE !== 'undefined'
        && GameState.currentMode === 'infinite'
        && GameState.mode === INFINITE_MODE_STATE);
    if (!keepsSimulationActive) break;
  }
}

const FeastfallFrameGovernor = (() => {
  let nextAcceptedAt = 0;
  let acceptedFrames = 0;
  let skippedFrames = 0;
  function active() {
    const id = typeof CONNECT3_MODE_ID !== 'undefined' ? CONNECT3_MODE_ID : 'connect3';
    const state = typeof CONNECT3_MODE_STATE !== 'undefined' ? CONNECT3_MODE_STATE : 'connect3';
    return typeof GameState !== 'undefined'
      && (GameState.currentMode === id || GameState.mode === state || GameState.screen === 'feastfall');
  }
  function targetFps() {
    const authority=globalThis.FroggyEnginePerformance;
    const budgetTarget=Math.max(20,Math.min(60,Number(authority?.budgetForMode?.('feastfall')?.targetFps)||60));
    return Math.max(20,Math.min(60,Number(authority?.targetFpsForMode?.('feastfall'))||budgetTarget));
  }
  function accept(timestamp) {
    if (!active()) return null;
    const fps = targetFps();
    const interval = 1000 / fps;
    if (!nextAcceptedAt || timestamp + 0.5 >= nextAcceptedAt) {
      // Advance from the intended deadline, not the actual rAF timestamp.
      // This distributes 45 accepted frames across a 60 Hz display instead of
      // degrading to every-other-frame 30 fps behavior.
      if (!nextAcceptedAt || timestamp - nextAcceptedAt > interval * 4) {
        nextAcceptedAt = timestamp + interval;
      } else {
        do { nextAcceptedAt += interval; } while (nextAcceptedAt <= timestamp - 0.5);
      }
      acceptedFrames += 1;
      document.documentElement.dataset.feastfallTargetFps = String(fps);
      return true;
    }
    skippedFrames += 1;
    return false;
  }
  function reset() { nextAcceptedAt = 0; acceptedFrames = 0; skippedFrames = 0; }
  function snapshot() { return Object.freeze({ targetFps:targetFps(), acceptedFrames, skippedFrames }); }
  if (typeof EventBus !== 'undefined') {
    EventBus.on('connect3Started', reset);
    EventBus.on('gameStarted', () => { if (!active()) reset(); });
  }
  return Object.freeze({ accept, reset, snapshot, active, get targetFps(){ return targetFps(); } });
})();
if (typeof globalThis !== 'undefined') globalThis.FeastfallFrameGovernor = FeastfallFrameGovernor;

function enginePerformanceModeId() {
  if (typeof GameState === 'undefined') return 'arcade';
  if (GameState.currentMode === 'connect3' || GameState.screen === 'feastfall') return 'feastfall';
  if (GameState.currentMode === 'puzzle') return 'puzzle';
  if (GameState.currentMode === 'infinite') return 'infinite';
  return 'arcade';
}

// Observation lifecycle ownership is separate from the temporary legacy
// quality governor. This path runs on the shared recursive rAF owner, so full-game
// mode transitions are reported even when Feastfall owns its own presentation.
let engineObservationMode = '';
function syncEngineObservationMode(timestamp) {
  const next = enginePerformanceModeId();
  if (next === engineObservationMode) return next;
  const authority = globalThis.FroggyEnginePerformance;
  if (engineObservationMode) authority?.noteLifecycle?.('mode-exit', timestamp, engineObservationMode);
  authority?.noteLifecycle?.('mode-enter', timestamp, next);
  engineObservationMode = next;
  return next;
}

function gameLoop(timestamp) {
  rafId = requestAnimationFrame(gameLoop);
  const observationMode = syncEngineObservationMode(timestamp);
  const feastfallDecision = FeastfallFrameGovernor.accept(timestamp);
  const frameAccepted = feastfallDecision === null
    ? EngineFrameScheduler.accept(timestamp)
    : feastfallDecision;
  if (!frameAccepted) {
    // Preserve elapsed time across intentionally skipped high-refresh display ticks.
    // Reset only while hidden so resume cannot simulate the entire background gap.
    if (document.hidden) RuntimeState.lastTime = timestamp;
    return;
  }
  
  if ((typeof SETTINGS !== 'undefined' && SETTINGS.showFPS)
    || (typeof GAME_BALANCE !== 'undefined' && GAME_BALANCE.showLiveStats)
    || document.body?.dataset?.runtimeProfile !== 'player') {
    updateLiveStatsFps(timestamp);
  }

  const rawDt = (timestamp - RuntimeState.lastTime) / 1000;
  RuntimeState.lastTime = timestamp;
  if (typeof ArcadeAnimationClock !== 'undefined') ArcadeAnimationClock.tick(rawDt);
  const speedMult = getDebugGameSpeedMult();
  const dt = Math.min(Math.max(0, rawDt), MAX_REAL_FRAME_SECONDS) * speedMult;
  if (!isFinite(dt) || dt <= 0) {
    render();
    if (feastfallDecision === null) globalThis.FroggyEnginePerformance?.notePresented?.(observationMode, timestamp, EngineFrameScheduler.observationIntendedFps, EngineFrameScheduler.observationPhase);
    return;
  }
  runSimulationSafely(dt);
  render();
  // Premium Feastfall owns a separate presentation loop; that host reports its
  // own presented frames so the engine never double-counts a no-op main canvas.
  if (feastfallDecision === null) globalThis.FroggyEnginePerformance?.notePresented?.(observationMode, timestamp, EngineFrameScheduler.observationIntendedFps, EngineFrameScheduler.observationPhase);
}
