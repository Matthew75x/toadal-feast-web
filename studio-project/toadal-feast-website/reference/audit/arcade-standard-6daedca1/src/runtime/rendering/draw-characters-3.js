// ============================================================
// src/runtime/rendering/draw-characters-3.js — Character rendering (set 3)
// Approved character asset rendering, drawFrog, and drawTongue.
// IMPORTANT: never tint a character by filling a rectangle with source-atop on
// the main scene canvas. The pond background is already opaque, so that method
// paints the whole frame rectangle. Damage feedback must use animation/transform
// feedback or an isolated sprite buffer, never a main-canvas rectangular fill.
// ============================================================



// Gulper uses owner-approved complete-body frames at every growth stage.
// Toadal Consumption adds a bottom-anchored 0.25x-to-sqrt(20)x 140-meal curve while
// preserving intact hands, feet, fingers, toes, and stage-specific feeding art.
const GulperArcadeAnimationRenderer = (() => {
  const basePath = 'assets/images/characters/gulper-arcade/';
  // Authored stage geometry uses the original 900px coordinate system,
  // while the compact runtime feeding sheets contain 450px source frames.
  // Keeping these values separate prevents one source crop from spanning two
  // adjacent Gulper frames (the duplicate/tiny-Gulper failure).
  const designFrameSize = 900;
  const feedingFrameSize = 450;
  const centerX = 450;
  const groundLineY = 796;
  const baseDrawSize = 154;
  const footOffset = 26;
  const eatDuration = 0.58;
  const maxStage = 7;
  const toadalVisualScales = Object.freeze([0.25, 0.3774672637, 0.5699261405, 0.8605138430, 1.2992632226, 1.9617173336, 2.9619362959, 4.4721359550]);
  const definitions = Object.freeze({
    idle: Object.freeze({ frames:1, sourceFrames:[0], fps:1, loop:true, category:'movement', approval:'owner-approved-coherent-gulper-2026-07-30' }),
    blink: Object.freeze({ frames:1, sourceFrames:[0], fps:1, loop:false, category:'movement', approval:'owner-approved-sprite-sequencer-large-toadal-2026-08-01' }),
    open: Object.freeze({ frames:1, sourceFrames:[1], fps:1, loop:true, category:'action', approval:'owner-approved-coherent-gulper-2026-07-30' }),
    eat: Object.freeze({ frames:8, sourceFrames:[0,1,2,3,4,5,6,7], fps:13.8, loop:false, category:'action', approval:'owner-approved-coherent-gulper-2026-07-30' }),
    growth: Object.freeze({ frames:8, sourceFrames:[0,1,2,3,4,5,6,7], fps:4, loop:false, category:'state', approval:'controlled-complete-body-growth-2026-07-30' }),
    max: Object.freeze({ frames:1, sourceFrames:[0], fps:1, loop:true, category:'state', approval:'owner-approved-coherent-gulper-2026-07-30' }),
  });
  const stageFiles = Object.freeze(Array.from({ length:8 }, (_, index) => `stages/gulper_stage_${index}.png`));
  const feedingFiles = Object.freeze(Array.from({ length:8 }, (_, index) => `feeding/gulper_stage_${index}_eat_8f_450.png`));
  const blinkFiles = Object.freeze(Array.from({ length:8 }, (_, index) => `stages/gulper_stage_${index}_blink.png`));
  const openMouthBlinkFiles = Object.freeze(Array.from({ length:8 }, (_, index) => index >= 4 ? `stages/gulper_stage_${index}_blink_open.png` : null));
  const blinkMinimumBodyStage = 4;
  const blinkMinimumMeals = 80;
  const blinkMinimumVisualScale = 1.25;
  const blinkCycleSeconds = 5.4;
  const blinkClosedSeconds = 0.18;
  const images = Object.create(null);
  const failed = Object.create(null);
  let forcedAnimation = null;
  let forcedBlinkClosed = null;

  function shouldUse(charDef) { return Boolean(charDef && charDef.id === 'gulper'); }
  function getImage(file) {
    if (images[file] || failed[file] || typeof Image === 'undefined') return images[file] || null;
    const image = new Image();
    image.decoding = 'async';
    image.onerror = () => { failed[file] = true; images[file] = null; };
    image.src = basePath + file;
    images[file] = image;
    return image;
  }
  function preload() {
    stageFiles.forEach(getImage);
    blinkFiles.forEach(getImage);
    openMouthBlinkFiles.filter(Boolean).forEach(getImage);
    feedingFiles.forEach(getImage);
  }
  function state() {
    if (typeof GameState === 'undefined') return {};
    return GameState.isTC ? (GameState.toadalConsumption || {}) : (GameState.charState?.gulper || {});
  }
  // Body frame, not growth stage: only maxStage+1 bodies were authored, while the
  // growth progression is finer-grained. Indexing the sheets by growth stage would
  // run off the end of the authored art.
  function rawStage() {
    if (typeof GameState === 'undefined' || !GameState.isTC) return 0;
    const meals = Number(state().foodsEaten || 0);
    const maxMeals = typeof GULPER_TOADAL_MAX_MEALS === 'number' ? GULPER_TOADAL_MAX_MEALS : 140;
    return typeof getGulperToadalBodyIndex === 'function'
      ? getGulperToadalBodyIndex(meals)
      : Math.max(0, Math.min(maxStage, Math.floor((Math.max(0, Math.min(maxMeals, meals)) / maxMeals) * maxStage)));
  }
  function stageIndex() {
    if (typeof GameState === 'undefined' || !GameState.isTC) return 0;
    const current = state();
    const meals = Math.max(0, Number(current.foodsEaten || 0));
    const stage = rawStage();
    const maxMeals = typeof GULPER_TOADAL_MAX_MEALS === 'number' ? GULPER_TOADAL_MAX_MEALS : 140;
    const priorStage = typeof getGulperToadalBodyIndex === 'function'
      ? getGulperToadalBodyIndex(Math.max(0, meals - 1))
      : Math.max(0, Math.min(maxStage, Math.floor((Math.max(0, Math.min(maxMeals, meals - 1)) / maxMeals) * maxStage)));
    // Only hold the previous body when the latest meal actually crosses an
    // authored body milestone. Ordinary meals increase scale gradually without
    // snapping back to an earlier body during every bite.
    if (priorStage < stage && Number(current.eatAnimTimer || 0) > eatDuration * 0.34) return priorStage;
    return stage;
  }
  function eatProgress() {
    const timer = Math.max(0, Math.min(eatDuration, Number(state().eatAnimTimer || 0)));
    return timer > 0 ? Math.max(0, Math.min(1, (eatDuration - timer) / eatDuration)) : -1;
  }
  function mouthHeld() {
    const current = state();
    if (forcedAnimation === 'open') return true;
    if (typeof GameState !== 'undefined' && GameState.isTC) return !current.mouthClosed;
    return Boolean(current.mouthHeld);
  }
  function visualScaleForStage(stage) {
    return toadalVisualScales[Math.max(0, Math.min(maxStage, Number(stage) || 0))];
  }
  function visualScale() {
    if (typeof GameState === 'undefined' || !GameState.isTC) return 1;
    const current = state();
    const fallback = visualScaleForStage(stageIndex());
    return Math.max(GULPER_TOADAL_MIN_SCALE || 0.25, Math.min(GULPER_TOADAL_MAX_SCALE || Math.sqrt(20), Number(current.size ?? fallback)));
  }
  function targetVisualScale() {
    if (typeof GameState === 'undefined' || !GameState.isTC) return 1;
    return visualScaleForStage(rawStage());
  }
  function animationSeconds() {
    if (typeof ArcadeAnimationClock !== 'undefined' && typeof ArcadeAnimationClock.getElapsed === 'function') {
      return Math.max(0, Number(ArcadeAnimationClock.getElapsed()) || 0);
    }
    return Math.max(0, Number(state().breatheTime || 0) / 2.2);
  }
  function blinkEligible() {
    if (typeof GameState === 'undefined' || !GameState.isTC) return false;
    const current = state();
    if (Math.max(0, Number(current.foodsEaten || 0)) < blinkMinimumMeals) return false;
    if (stageIndex() < blinkMinimumBodyStage) return false;
    return visualScale() >= blinkMinimumVisualScale;
  }
  function blinkClosed() {
    if (!blinkEligible()) return false;
    if (eatProgress() >= 0 || forcedAnimation === 'eat' || forcedAnimation === 'growth') return false;
    if (forcedBlinkClosed != null) return Boolean(forcedBlinkClosed);
    const phase = (animationSeconds() + 1.35) % blinkCycleSeconds;
    return phase >= blinkCycleSeconds - blinkClosedSeconds;
  }
  function movementPose(drawSize) {
    const moving = Boolean(typeof frog !== 'undefined' && frog && (frog.moveDir !== 0 || frog.isMoving));
    if (!moving || eatProgress() >= 0) return { moving:false, step:0, rock:0, bob:0, pivotOffsetX:0 };
    const phase = Number(frog.stepCycle || animationSeconds() * 10);
    const step = Math.sin(phase);
    const facing = Number(frog.facing || frog.moveDir || 1) < 0 ? -1 : 1;
    return {
      moving:true,
      step,
      rock:step * 0.018 * facing,
      bob:Math.abs(step) * Math.max(0.55, Math.min(2.4, Number(drawSize || baseDrawSize) * 0.009)),
      pivotOffsetX:(step >= 0 ? -1 : 1) * Number(drawSize || baseDrawSize) * 0.15,
    };
  }
  function frameIndex() {
    if (forcedAnimation === 'eat') {
      const manual = typeof CharacterAnimationTuning !== 'undefined' ? CharacterAnimationTuning.getManualFrame?.('gulper','eat') : null;
      if (manual != null) return Math.max(0, Math.min(7, Number(manual) || 0));
      const fps = typeof CharacterAnimationTuning !== 'undefined' ? CharacterAnimationTuning.getFps?.('gulper','eat',13.8) : 13.8;
      return Math.floor(((typeof ArcadeAnimationClock !== 'undefined' ? ArcadeAnimationClock.getElapsed() : 0) * Number(fps || 13.8)) % 8);
    }
    const progress = eatProgress();
    if (progress >= 0) return Math.min(7, Math.floor(progress * 8));
    return mouthHeld() ? 1 : -1;
  }
  function draw(ctx, charDef) {
    if (!shouldUse(charDef)) return false;
    preload();
    let stage = forcedAnimation === 'max' ? maxStage : stageIndex();
    if (forcedAnimation === 'growth') {
      const manual = typeof CharacterAnimationTuning !== 'undefined' ? CharacterAnimationTuning.getManualFrame?.('gulper','growth') : null;
      const fps = typeof CharacterAnimationTuning !== 'undefined' ? CharacterAnimationTuning.getFps?.('gulper','growth',4) : 4;
      stage = manual != null
        ? Math.max(0, Math.min(maxStage, Number(manual) || 0))
        : Math.min(maxStage, Math.floor((typeof ArcadeAnimationClock !== 'undefined' ? ArcadeAnimationClock.getElapsed() : 0) * Number(fps || 4)) % 8);
    }

    const eatFrame = frameIndex();
    const isFeedingFrame = eatFrame >= 0;
    const isActiveFeeding = eatProgress() >= 0 || forcedAnimation === 'eat';
    const wantsBlink = !isActiveFeeding && blinkClosed();
    const openMouthIdle = !isActiveFeeding && isFeedingFrame && eatFrame === 1;
    const blinkFile = wantsBlink ? (openMouthIdle ? openMouthBlinkFiles[stage] : blinkFiles[stage]) : null;
    const blinkImage = blinkFile ? getImage(blinkFile) : null;
    const usingBlinkImage = Boolean(blinkImage && blinkImage.complete && blinkImage.naturalWidth);
    const file = isFeedingFrame ? feedingFiles[stage] : stageFiles[stage];
    const image = usingBlinkImage ? blinkImage : getImage(file);
    if (!image || !image.complete || !image.naturalWidth) return false;

    const current = state();
    const scale = forcedAnimation === 'growth' || forcedAnimation === 'max'
      ? (typeof GameState !== 'undefined' && GameState.isTC ? visualScaleForStage(stage) : 1)
      : visualScale();
    const drawSize = baseDrawSize * scale;
    const imageScale = drawSize / designFrameSize;
    const bottomY = Math.round(frog.y + footOffset);
    const originX = frog.x - centerX * imageScale;
    const originY = bottomY - groundLineY * imageScale;
    const progress = eatProgress();
    const growthPulse = progress >= .66 ? Math.sin(Math.PI * Math.min(1, (progress - .66) / .34)) : 0;
    const pose = movementPose(drawSize);
    const breathAmplitude = pose.moving ? 0.004 : 0.012;
    const breath = progress < 0 ? Math.sin(Number(current.breatheTime || 0)) * breathAmplitude : 0;
    const sx = 1 + growthPulse * .045 - breath * .38 + (pose.moving ? Math.abs(pose.step) * .003 : 0);
    const sy = 1 - growthPulse * .030 + breath - (pose.moving ? Math.abs(pose.step) * .0025 : 0);
    const pivotX = frog.x + pose.pivotOffsetX;

    ctx.save();
    if (pose.moving) {
      ctx.translate(pivotX, bottomY - pose.bob);
      ctx.rotate(pose.rock);
      ctx.translate(-pivotX, -bottomY);
    }
    ctx.translate(frog.x, bottomY);
    ctx.scale(sx, sy);
    ctx.translate(-frog.x, -bottomY);
    if (isFeedingFrame && !usingBlinkImage) {
      ctx.drawImage(image, eatFrame * feedingFrameSize, 0, feedingFrameSize, feedingFrameSize, originX, originY, drawSize, drawSize);
    } else {
      ctx.drawImage(image, originX, originY, drawSize, drawSize);
    }
    ctx.restore();
    return true;
  }
  function setForcedAnimation(animationId = null) {
    forcedAnimation = ['idle','open','eat','growth','max'].includes(animationId) ? animationId : null;
    return forcedAnimation;
  }
  function setForcedBlinkClosed(value = null) {
    forcedBlinkClosed = value == null ? null : Boolean(value);
    return forcedBlinkClosed;
  }
  function catchHalfWidth() { return Math.max(24, 44 * visualScale()); }
  function catchHalfHeight() { return Math.max(14, 18 * visualScale()); }
  function mouthCenterY() {
    const bottomY = Math.round(frog.y + footOffset);
    return bottomY - 61 * visualScale();
  }
  function mouthOffsetFor() { return Math.max(4, frog.y - mouthCenterY()); }
  function catchScale() { return visualScale(); }
  return Object.freeze({
    draw, shouldUse, preload, setForcedAnimation, setForcedBlinkClosed, stageIndex, rawStage,
    visualScale, targetVisualScale, visualScaleForStage, mouthOffsetFor,
    mouthCenterY, catchHalfWidth, catchHalfHeight, catchScale, definitions,
    blinkEligible, blinkClosed, movementPose,
    toadalVisualScales,
    get drawSize(){ return baseDrawSize * visualScale(); },
    get baseDrawSize(){ return baseDrawSize; },
  });
})();

const BobArcadeAnimationRenderer = (() => {
  const animationProfile = ArcadeAnimationRegistry.character('bob');
  const basePath = animationProfile.basePath;
  const frameSize = animationProfile.frameSize;
  const drawSize = animationProfile.drawSize;
  const anchorFrameX = animationProfile.anchorX;
  const anchorFrameY = animationProfile.anchorY;
  const footOffset = animationProfile.footOffset;
  const definitions = animationProfile.clips;
  const images = Object.create(null);
  const failed = Object.create(null);
  let activeAnimationId = animationProfile.defaultClip || 'idle_breathing';
  let activeAnimationStartedAt = 0;
  let forcedAnimationId = null;
  const basketPropFiles = Object.freeze(Array.from({ length:6 }, (_, index) => `props/bob_basket_fill_${index}.png`));
  const propImages = Object.create(null);
  const propFailures = Object.create(null);

  function shouldUse(charDef) {
    return Boolean(charDef && charDef.id === 'bob');
  }

  function getImage(animationId) {
    const id = definitions[animationId] ? animationId : 'idle_breathing';
    const def = definitions[id];
    if (images[id] || failed[id] || typeof Image === 'undefined') return images[id] || null;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {};
    img.onerror = () => { failed[id] = true; images[id] = null; };
    img.src = basePath + def.file;
    images[id] = img;
    return img;
  }

  function getPropImage(file) {
    if (propImages[file] || propFailures[file] || typeof Image === 'undefined') return propImages[file] || null;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {};
    img.onerror = () => { propFailures[file] = true; propImages[file] = null; };
    img.src = basePath + file;
    propImages[file] = img;
    return img;
  }

  function preloadBasketProps() {
    basketPropFiles.forEach(getPropImage);
  }

  function drawBasketProp(ctx, animationId, frame, scale) {
    const bobState = (typeof GameState !== 'undefined' && GameState.charState?.bob) ? GameState.charState.bob : {};
    const count = Math.max(0, Math.min(5, Array.isArray(bobState.basketItems) ? bobState.basketItems.length : 0));
    const file = basketPropFiles[count];
    const img = getPropImage(file);
    if (!img || !img.complete || !img.naturalWidth) return false;

    // The canonical Bob manifest owns the hand/basket anchor. The independent
    // basket stays bottom-center stable while small state-local adjustments keep
    // it aligned with authored walking and lean poses.
    let sourceX = 158;
    let sourceY = 159;
    if (animationId === 'lean_ready') sourceX += 12 * Math.max(0, Math.min(1, Number(bobState.leanAmt || 0)));
    if (animationId === 'walking') {
      const frameCount = Math.max(1, Number(definitions.walking?.frames || 1));
      sourceY += Math.sin((frame / frameCount) * Math.PI * 2) * 1.5;
    }
    const centerX = (sourceX - anchorFrameX) * scale;
    const centerY = (sourceY - anchorFrameY) * scale;
    const width = 44;
    const height = width * (192 / 256);
    ctx.drawImage(img, centerX - width / 2, centerY - height / 2, width, height);
    return true;
  }

  function nowSeconds() {
    if (typeof ArcadeAnimationClock !== 'undefined') return ArcadeAnimationClock.getElapsed();
    return typeof RuntimeState !== 'undefined' ? Number(RuntimeState.frogAnim || 0) / 3 : 0;
  }

  function isResultMode() {
    if (typeof GameState === 'undefined') return false;
    if (typeof GAME_MODES !== 'undefined' && GameState.mode === GAME_MODES.DEAD) return true;
    return String(GameState.mode || '') === 'dead';
  }

  function resultClip() {
    if (!isResultMode()) return null;
    const tone = typeof ArcadeResultUI !== 'undefined'
      ? String(ArcadeResultUI.lastOutcome?.tone || '')
      : '';
    return ['celebrate', 'proud'].includes(tone) ? 'happy_celebrate' : 'game_over_sad';
  }

  function pickAnimation() {
    if (forcedAnimationId && definitions[forcedAnimationId]) return forcedAnimationId;
    const result = resultClip();
    if (result) return result;
    const cs = (typeof GameState !== 'undefined' && GameState.charState && GameState.charState.bob)
      ? GameState.charState.bob
      : {};
    if (typeof RuntimeState !== 'undefined' && Number(RuntimeState.ghostTime || 0) > 0.08) return 'hit_hurt';
    const moving = Boolean(frog && (frog.moveDir !== 0 || frog.isMoving));
    if (Number(cs.leanAmt || 0) > 0.3) return 'lean_ready';
    if (moving) return 'walking';
    const blinkDef = definitions.blink;
    const blinkDuration = blinkDef ? Number(blinkDef.frames || blinkDef.sourceFrames?.length || 0) / Number(blinkDef.fps || 12) : 0;
    const blinkPhase = nowSeconds() % 5.2;
    if (blinkDef && blinkPhase < blinkDuration) return 'blink';
    return 'idle_breathing';
  }

  function animationElapsed(animationId) {
    const now = nowSeconds();
    if (activeAnimationId !== animationId) {
      activeAnimationId = animationId;
      activeAnimationStartedAt = now;
    }
    return Math.max(0, now - activeAnimationStartedAt);
  }

  function frameIndexFor(animationId) {
    return ArcadeAnimationRuntime.frameIndexFor('bob', animationId || 'idle_breathing', animationElapsed(animationId));
  }

  function draw(ctx, charDef) {
    if (!shouldUse(charDef)) return false;
    preloadBasketProps();
    const animationId = pickAnimation();
    const def = definitions[animationId] || definitions.idle_breathing;
    const img = getImage(animationId);
    if (!img || !img.complete || !img.naturalWidth) return false;
    const frame = frameIndexFor(animationId);
    const availableFrames = Math.floor((img.naturalWidth || img.width || 0) / frameSize);
    if (!availableFrames || frame < 0 || frame >= availableFrames) return false;
    const scale = drawSize / frameSize;
    const bottomY = Math.round(frog.y + footOffset);
    const drawX = Math.round(frog.x);
    const facing = frog && frog.facing < 0 ? -1 : 1;
    ctx.save();
    ctx.translate(drawX, bottomY);
    ctx.scale(facing, 1);
    ctx.drawImage(
      img,
      frame * frameSize, 0, frameSize, frameSize,
      -anchorFrameX * scale, -anchorFrameY * scale,
      drawSize, drawSize
    );
    drawBasketProp(ctx, animationId, frame, scale);
    ctx.restore();
    return true;
  }

  function setForcedAnimation(animationId = null) {
    forcedAnimationId = animationId && definitions[animationId] ? animationId : null;
    activeAnimationId = forcedAnimationId || 'idle_breathing';
    activeAnimationStartedAt = nowSeconds();
    return forcedAnimationId;
  }

  // WO-003's canonical-Toadal package does not expose Bob. Keep Bob's
  // character-specific animation lazy: draw() resolves it only after
  // shouldUse() confirms that Bob is the active character. The donor's eager
  // module-load requests otherwise fetch Bob art for every isolated game.

  return Object.freeze({
    draw,
    shouldUse,
    pickAnimation,
    frameIndexFor,
    setForcedAnimation,
    definitions,
    drawBasketProp,
    preloadBasketProps,
    get drawSize() { return drawSize; },
    get anchorFrameX() { return anchorFrameX; },
    get anchorFrameY() { return anchorFrameY; },
  });
})();


const ChomperArcadeAnimationRenderer = (() => {
  const animationProfile = ArcadeAnimationRegistry.character('chomper');
  const basePath = animationProfile.basePath;
  const frameSize = animationProfile.frameSize;
  const drawSize = animationProfile.drawSize;
  const anchorFrameY = animationProfile.anchorY;
  const footOffset = animationProfile.footOffset;
  const definitions = animationProfile.clips;
  const chompDefinition = definitions.chomp;
  const moveDefinition = definitions.move;
  const catchVisualDuration = chompDefinition.frames / chompDefinition.fps;
  const moveCycleDuration = moveDefinition.frames / moveDefinition.fps;
  let activeAnimationId = animationProfile.defaultClip;
  let activeAnimationStartedAt = 0;
  let movementWasActive = false;
  let moveVisualUntil = 0;
  const images = Object.create(null);
  const failed = Object.create(null);

  function shouldUse(charDef) {
    return Boolean(charDef && charDef.id === 'chomper');
  }

  function getImage(animationId) {
    const def = definitions[animationId] || definitions[animationProfile.defaultClip];
    if (images[animationId] || failed[animationId] || typeof Image === 'undefined') return images[animationId] || null;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {};
    img.onerror = () => { failed[animationId] = true; images[animationId] = null; };
    img.src = basePath + def.file;
    images[animationId] = img;
    return img;
  }

  function nowSeconds() {
    if (typeof ArcadeAnimationClock !== 'undefined') return ArcadeAnimationClock.getElapsed();
    return typeof RuntimeState !== 'undefined' ? Number(RuntimeState.frogAnim || 0) / 3 : 0;
  }

  function chomperState() {
    return (typeof GameState !== 'undefined' && GameState.charState && GameState.charState.chomper)
      ? GameState.charState.chomper
      : {};
  }

  function pickAnimation() {
    const cs = chomperState();
    const now = nowSeconds();
    if (Number(cs.chompAnimTimer || 0) > 0 || cs.chomping) {
      // A real bite has visual priority and cancels any stale walk carry. Once
      // the chomp finishes, Chomper should recover from the current input,
      // never resume a half-finished step that predates the bite.
      movementWasActive = false;
      moveVisualUntil = 0;
      return 'chomp';
    }
    const moving = Boolean(frog && (frog.moveDir !== 0 || frog.isMoving));
    if (moving) {
      movementWasActive = true;
      moveVisualUntil = 0;
      return 'move';
    }
    if (movementWasActive && activeAnimationId === 'move') {
      movementWasActive = false;
      const elapsed = Math.max(0, now - activeAnimationStartedAt);
      const phase = elapsed % moveCycleDuration;
      const epsilon = 1 / Math.max(30, moveDefinition.fps * 2);
      const remainder = phase <= epsilon || moveCycleDuration - phase <= epsilon
        ? 0
        : moveCycleDuration - phase;
      moveVisualUntil = now + remainder;
    } else if (movementWasActive) {
      movementWasActive = false;
      moveVisualUntil = 0;
    }
    if (moveVisualUntil > now) return 'move';
    moveVisualUntil = 0;
    return 'idle_static';
  }

  function animationElapsed(animationId) {
    if (animationId === 'chomp') {
      const remaining = Math.max(0, Math.min(catchVisualDuration, Number(chomperState().chompAnimTimer || 0)));
      return Math.max(0, catchVisualDuration - remaining);
    }
    const now = nowSeconds();
    if (activeAnimationId !== animationId) {
      activeAnimationId = animationId;
      activeAnimationStartedAt = now;
    }
    return Math.max(0, now - activeAnimationStartedAt);
  }

  function frameIndexFor(animationId) {
    return ArcadeAnimationRuntime.frameIndexFor('chomper', animationId, animationElapsed(animationId));
  }

  function draw(ctx, charDef, bob = 0) {
    if (!shouldUse(charDef)) return false;
    const animationId = pickAnimation();
    const def = definitions[animationId] || definitions[animationProfile.defaultClip];
    const img = getImage(animationId);
    if (!img || !img.complete || !img.naturalWidth) return false;
    const frame = frameIndexFor(animationId);
    const availableFrames = Math.floor((img.naturalWidth || img.width || 0) / frameSize);
    if (!availableFrames || frame < 0 || frame >= availableFrames) return false;
    const facing = frog && frog.facing ? frog.facing : 1;
    // Living idle is presentation-only: keep the approved one-frame body and
    // breathe around its authored foot anchor. Movement/chomp bypass it, and
    // Reduce Motion resolves to the exact static pose.
    const reduceMotion = typeof SETTINGS !== 'undefined' && SETTINGS.reduceMotion;
    const idlePhase = animationId === 'idle_static' && !reduceMotion
      ? Math.sin(nowSeconds() * Math.PI * 2 / 3.6)
      : 0;
    const idleScaleX = 1 + idlePhase * 0.004;
    const idleScaleY = 1 - idlePhase * 0.008;
    // All three sheets share one crop, scale, center, and foot baseline. Do not
    // stack generic frog bob/tilt/squash on this authored dino animation.
    const bottomY = Math.round(frog.y + footOffset);
    const drawX = Math.round(frog.x);
    const anchorY = drawSize * (anchorFrameY / frameSize);
    ctx.save();
    ctx.translate(drawX, bottomY);
    ctx.scale(facing * idleScaleX, idleScaleY);
    ctx.drawImage(
      img,
      frame * frameSize, 0, frameSize, frameSize,
      -drawSize / 2, -anchorY,
      drawSize, drawSize
    );
    ctx.restore();
    return true;
  }

  return Object.freeze({
    draw,
    shouldUse,
    pickAnimation,
    definitions,
    get drawSize() { return drawSize; },
    get anchorFrameY() { return anchorFrameY; },
    get catchVisualDuration() { return catchVisualDuration; },
    get moveCycleDuration() { return moveCycleDuration; },
  });
})();

const ChameleonArcadeAnimationRenderer = (() => {
  const animationProfile = ArcadeAnimationRegistry.character('chameleon');
  // Phase 27 removes the shelved Chameleon animation package entirely while
  // retaining save-migration identity data. Keep a fail-closed renderer shape
  // so shared drawing code can load without reviving or requesting purged art.
  if (!animationProfile) {
    return Object.freeze({
      draw: () => false,
      shouldUse: () => false,
      pickAnimation: () => null,
      frameIndexFor: () => -1,
      mouthOffsetFor: () => null,
      setForcedAnimation: () => null,
      setCamouflageMode: () => false,
      definitions: Object.freeze({}),
      paletteModes: Object.freeze({}),
      get drawSize() { return 0; },
      get anchorFrameX() { return 0; },
      get anchorFrameY() { return 0; },
      get mouthFrameY() { return 0; },
      get footOffset() { return 0; },
      get catchVisualDuration() { return 0; },
      get camouflageMode() { return false; },
    });
  }
  const basePath = animationProfile.basePath;
  const frameSize = animationProfile.frameSize;
  const drawSize = animationProfile.drawSize;
  const anchorFrameX = animationProfile.anchorX;
  const anchorFrameY = animationProfile.anchorY;
  const mouthFrameY = animationProfile.mouthY;
  const footOffset = animationProfile.footOffset;
  const catchVisualDuration = 0.78;
  const definitions = animationProfile.clips;
  const paletteModes = animationProfile.paletteModes || {
    normal: { mouth_closed: 0, mouth_open: 1 },
    camouflage: { mouth_closed: 2, mouth_open: 3 },
  };
  const images = Object.create(null);
  const failed = Object.create(null);
  let forcedPoseId = null;
  let camouflageMode = false;

  function shouldUse(charDef) {
    return Boolean(charDef && charDef.id === 'chameleon');
  }

  function getImage(poseId) {
    const def = definitions[poseId] || definitions.mouth_closed;
    const key = String(def.file || '');
    if (images[key] || failed[key] || typeof Image === 'undefined') return images[key] || null;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {};
    img.onerror = () => { failed[key] = true; images[key] = null; };
    img.src = basePath + key;
    images[key] = img;
    return img;
  }

  function mouthIsOpen() {
    if (forcedPoseId) return forcedPoseId === 'mouth_open';
    if (typeof tongue === 'undefined') return false;
    return Boolean(tongue.active || Number(tongue.swallowTimer || 0) > 0);
  }

  function pickAnimation() {
    return mouthIsOpen() ? 'mouth_open' : 'mouth_closed';
  }

  function frameIndexFor(poseId = pickAnimation()) {
    const paletteId = camouflageMode ? 'camouflage' : 'normal';
    const palette = paletteModes[paletteId] || paletteModes.normal;
    const frame = Number(palette?.[poseId]);
    if (Number.isInteger(frame) && frame >= 0) return frame;
    const def = definitions[poseId] || definitions.mouth_closed;
    return Number(def?.sourceFrames?.[0] || 0);
  }

  function draw(ctx, charDef) {
    if (!shouldUse(charDef)) return false;
    const poseId = pickAnimation();
    const img = getImage(poseId);
    if (!img) return false;
    // The dedicated two-pose renderer owns Chameleon from the first frame.
    // While its approved sheet is decoding, report the route as pending-owned
    // rather than falling through to a retired generic facial-state atlas.
    if (!img.complete || !img.naturalWidth) return true;
    const frame = frameIndexFor(poseId);
    const availableFrames = Math.floor((img.naturalWidth || img.width || 0) / frameSize);
    if (!availableFrames || frame < 0 || frame >= availableFrames) return false;
    const scale = drawSize / frameSize;
    const bottomY = Math.round(frog.y + footOffset);
    const drawX = Math.round(frog.x);
    const locomotion = GameState.charState.specialLocomotion || {};
    const behavior = typeof getArcadeCharacterBehaviorProfile === 'function' ? getArcadeCharacterBehaviorProfile(charDef) : null;
    const usesFrontSpecialMotion = behavior?.locomotionFamily === 'front-special' && locomotion.characterId === charDef.id;
    const lean = usesFrontSpecialMotion ? Number(locomotion.lean || 0) : 0;
    const step = usesFrontSpecialMotion ? Math.sin(Number(locomotion.bobPhase || 0)) * Number(locomotion.locomotion || 0) : 0;
    ctx.save();
    ctx.translate(drawX + lean * 2.5, bottomY + step * 1.2);
    ctx.rotate?.(lean * 0.055);
    ctx.drawImage(
      img,
      frame * frameSize, 0, frameSize, frameSize,
      -anchorFrameX * scale, -anchorFrameY * scale,
      drawSize, drawSize
    );
    ctx.restore();
    return true;
  }

  function mouthOffsetFor(charDef) {
    if (!shouldUse(charDef)) return null;
    return Math.round((anchorFrameY - mouthFrameY) * (drawSize / frameSize) - footOffset);
  }

  function setForcedAnimation(poseId = null) {
    forcedPoseId = poseId && definitions[poseId] ? poseId : null;
    return forcedPoseId;
  }

  function setCamouflageMode(enabled = false) {
    camouflageMode = Boolean(enabled);
    return camouflageMode;
  }

  return Object.freeze({
    draw,
    shouldUse,
    pickAnimation,
    frameIndexFor,
    mouthOffsetFor,
    setForcedAnimation,
    setCamouflageMode,
    definitions,
    paletteModes,
    get drawSize() { return drawSize; },
    get anchorFrameX() { return anchorFrameX; },
    get anchorFrameY() { return anchorFrameY; },
    get mouthFrameY() { return mouthFrameY; },
    get footOffset() { return footOffset; },
    get catchVisualDuration() { return catchVisualDuration; },
    get camouflageMode() { return camouflageMode; },
  });
})();


const FlytrapArcadeAnimationRenderer = (() => {
  const animationProfile = ArcadeAnimationRegistry.character('flytrap');
  const basePath = animationProfile.basePath;
  const frameSize = animationProfile.frameSize;
  const drawSize = animationProfile.drawSize;
  const anchorFrameX = animationProfile.anchorX;
  const anchorFrameY = animationProfile.anchorY;
  const mouthFrameY = animationProfile.mouthY;
  const footOffset = animationProfile.footOffset;
  const rootEmbedFramePixels = 18;
  const catchVisualDuration = 0.72;
  const cloneActionDuration = 0.52;
  const catchSegments = Object.freeze({
    jaw_snap: Object.freeze({ start: 0.72, end: 0.48 }),
    catch_hold: Object.freeze({ start: 0.48, end: 0.26 }),
    chew_swallow: Object.freeze({ start: 0.26, end: 0 }),
  });
  let activeAnimationId = 'idle_rooted';
  let activeAnimationStartedAt = 0;
  let forcedAnimationId = null;

  const definitions = animationProfile.clips;
  const images = Object.create(null);
  const failed = Object.create(null);

  function shouldUse(charDef) {
    return Boolean(charDef && charDef.id === 'flytrap');
  }

  function getImage(animationId) {
    const def = definitions[animationId] || definitions.idle_rooted;
    if (images[animationId] || failed[animationId] || typeof Image === 'undefined') return images[animationId] || null;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {};
    img.onerror = () => { failed[animationId] = true; images[animationId] = null; };
    img.src = basePath + def.file;
    images[animationId] = img;
    return img;
  }

  function nowSeconds() {
    if (typeof ArcadeAnimationClock !== 'undefined') return ArcadeAnimationClock.getElapsed();
    return typeof RuntimeState !== 'undefined' ? Number(RuntimeState.frogAnim || 0) / 3 : 0;
  }

  function flytrapState() {
    return (typeof GameState !== 'undefined' && GameState.charState && GameState.charState.flytrap)
      ? GameState.charState.flytrap
      : {};
  }

  function isResultMode() {
    if (typeof GameState === 'undefined') return false;
    if (typeof GAME_MODES !== 'undefined' && GameState.mode === GAME_MODES.DEAD) return true;
    return String(GameState.mode || '') === 'dead';
  }

  function resultClip() {
    if (!isResultMode()) return null;
    const tone = typeof ArcadeResultUI !== 'undefined'
      ? String(ArcadeResultUI.lastOutcome?.tone || '')
      : '';
    return ['celebrate', 'proud'].includes(tone) ? 'victory_bloom' : 'game_over_wilt';
  }

  function hasWideCatchPower() {
    if (typeof StatusEffectSystem === 'undefined' || typeof StatusEffectSystem.has !== 'function') return false;
    return Boolean(StatusEffectSystem.has('vacuum') || StatusEffectSystem.has('magnet'));
  }

  function nearestApproachingFoodRatio(charDef) {
    if (typeof entities === 'undefined' || !Array.isArray(entities.foods) || !frog) return Infinity;
    const radius = Math.max(1, Number(charDef?.stats?.catchRadius || 65));
    let nearest = Infinity;
    for (const food of entities.foods) {
      if (!food || food.isBomb || food.isSun) continue;
      const dx = Number(food.x || 0) - Number(frog.x || 0);
      const dy = Number(food.y || 0) - Number(frog.y || 0);
      // Only react to food above or entering the mouth zone, not objects that
      // have already fallen past the rooted plant.
      if (dy > radius * 0.55) continue;
      const ratio = Math.hypot(dx, dy) / radius;
      if (ratio < nearest) nearest = ratio;
    }
    return nearest;
  }

  function pickAnimation(charDef = (typeof getCharDef === 'function' ? getCharDef() : null)) {
    if (forcedAnimationId && definitions[forcedAnimationId]) return forcedAnimationId;

    const result = resultClip();
    if (result) return result;

    const cs = flytrapState();
    if (typeof RuntimeState !== 'undefined' && Number(RuntimeState.ghostTime || 0) > 0.08) return 'hurt_wilt';

    // Clone readiness is rendered as an independent below-ground indicator.
    // Never place the baby/charge on the adult plant's head or swap the adult
    // into the legacy clone-held/pickup/plant presentation during gameplay.
    if (Number(cs.cloneActionTimer || 0) > 0) return 'idle_rooted';

    if (Number(cs.rareAnimTimer || 0) > 0) return 'rare_food_reaction';
    if (Number(cs.catchAnimTimer || 0) > catchSegments.jaw_snap.end) return 'jaw_snap';
    if (Number(cs.catchAnimTimer || 0) > catchSegments.catch_hold.end) return 'catch_hold';
    if (Number(cs.catchAnimTimer || 0) > 0) return 'chew_swallow';

    if (hasWideCatchPower()) return 'power_up_wide_catch';

    const approachRatio = nearestApproachingFoodRatio(charDef);
    if (approachRatio <= 1.45) return 'jaw_charge';
    if (approachRatio <= 2.5) return 'target_tracking';

    return typeof frog !== 'undefined' && frog && (frog.moveDir !== 0 || frog.isMoving)
      ? 'root_shuffle'
      : 'idle_rooted';
  }

  function timerProgressElapsed(animationId, remaining, duration, start, end = 0) {
    const span = Math.max(0.001, start - end);
    const progress = Math.max(0, Math.min(1, (start - remaining) / span));
    return progress * duration;
  }

  function animationElapsed(animationId) {
    const cs = flytrapState();
    if (catchSegments[animationId]) {
      const segment = catchSegments[animationId];
      const duration = ArcadeAnimationRuntime.durationSeconds('flytrap', animationId);
      return timerProgressElapsed(animationId, Number(cs.catchAnimTimer || 0), duration, segment.start, segment.end);
    }
    if ((animationId === 'clone_pickup' || animationId === 'clone_plant') && Number(cs.cloneActionTimer || 0) > 0) {
      const duration = ArcadeAnimationRuntime.durationSeconds('flytrap', animationId);
      return timerProgressElapsed(animationId, Number(cs.cloneActionTimer || 0), duration, cloneActionDuration, 0);
    }
    if (animationId === 'rare_food_reaction' && Number(cs.rareAnimTimer || 0) > 0) {
      return Math.max(0, 1.1 - Number(cs.rareAnimTimer || 0));
    }

    const now = nowSeconds();
    if (activeAnimationId !== animationId) {
      activeAnimationId = animationId;
      activeAnimationStartedAt = now;
    }
    return Math.max(0, now - activeAnimationStartedAt);
  }

  function frameIndexFor(animationId) {
    const elapsed = animationElapsed(animationId);
    return ArcadeAnimationRuntime.frameIndexFor('flytrap', animationId || 'idle_rooted', elapsed);
  }

  function drawFrameAt(ctx, animationId, frame, x, bottomY, size, alpha = 1) {
    const def = definitions[animationId] || definitions.idle_rooted;
    const img = getImage(animationId);
    if (!img || !img.complete || !img.naturalWidth) return false;
    const availableFrames = Math.floor((img.naturalWidth || img.width || 0) / frameSize);
    if (!availableFrames || frame < 0 || frame >= availableFrames) return false;
    const scale = size / frameSize;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(Math.round(x), Math.round(bottomY));
    ctx.drawImage(
      img,
      frame * frameSize, 0, frameSize, frameSize,
      -anchorFrameX * scale, -anchorFrameY * scale,
      size, size
    );
    ctx.restore();
    return true;
  }

  function draw(ctx, charDef) {
    if (!shouldUse(charDef)) return false;
    const animationId = pickAnimation(charDef);
    const frame = frameIndexFor(animationId);
    const locomotion = GameState.charState.specialLocomotion || {};
    const behavior = typeof getArcadeCharacterBehaviorProfile === 'function' ? getArcadeCharacterBehaviorProfile(charDef) : null;
    const usesFrontSpecialMotion = behavior?.locomotionFamily === 'front-special' && locomotion.characterId === charDef.id;
    const lean = usesFrontSpecialMotion ? Number(locomotion.lean || 0) : 0;
    // The Flytrap is rooted. Locomotion may lean the upper silhouette, but the
    // authored root baseline must remain fixed instead of bobbing/floating.
    const groundY = mainGroundY();
    ctx.save();
    ctx.translate(frog.x, groundY);
    ctx.rotate?.(lean * 0.018);
    ctx.translate(-frog.x, -groundY);
    const ok = drawFrameAt(ctx, animationId, frame, frog.x + lean * 0.8, groundY, drawSize, 1);
    ctx.restore();
    return ok;
  }

  function cloneFrame(snapAmount = 0) {
    const snapping = Number(snapAmount || 0) > 0;
    const animationId = snapping ? 'clone_snap' : 'clone_idle';
    const def = definitions[animationId];
    const frame = snapping
      ? Math.min(def.frames - 1, Math.max(0, Math.floor((1 - Math.max(0, Math.min(1, Number(snapAmount)))) * def.frames)))
      : ArcadeAnimationRuntime.frameIndexFor('flytrap', animationId, nowSeconds());
    return { animationId, frame };
  }

  function drawClone(ctx, charDef, x, y, snapAmount = 0, alpha = 0.96, cloneScale = 2 / 3) {
    if (!shouldUse(charDef)) return false;
    const selection = cloneFrame(snapAmount);
    return drawFrameAt(ctx, selection.animationId, selection.frame, x, cloneGroundY(y, cloneScale), drawSize * cloneScale, alpha);
  }

  function drawCloneCharge(ctx, charDef, x, bottomY, alpha = 0.96, cloneScale = 2 / 3) {
    if (!shouldUse(charDef)) return false;
    const selection = cloneFrame(0);
    return drawFrameAt(ctx, selection.animationId, selection.frame, x, bottomY, drawSize * cloneScale, alpha);
  }

  function mainGroundY() {
    const embed = rootEmbedFramePixels * (drawSize / frameSize);
    return typeof frog !== 'undefined' && frog ? Number(frog.y || 0) + footOffset + embed : footOffset + embed;
  }

  function cloneGroundY(y, cloneScale = 2 / 3) {
    const scale = Number(cloneScale || (2 / 3));
    return Number(y || 0) + (footOffset + rootEmbedFramePixels * (drawSize / frameSize)) * scale;
  }

  function mouthOffsetFor(charDef) {
    if (!shouldUse(charDef)) return null;
    return Math.round((anchorFrameY - mouthFrameY) * (drawSize / frameSize) - footOffset);
  }

  function setForcedAnimation(animationId = null) {
    forcedAnimationId = animationId && definitions[animationId] ? animationId : null;
    activeAnimationId = forcedAnimationId || 'idle_rooted';
    activeAnimationStartedAt = nowSeconds();
    return forcedAnimationId;
  }

  return Object.freeze({
    draw,
    drawClone,
    drawCloneCharge,
    mainGroundY,
    cloneGroundY,
    shouldUse,
    pickAnimation,
    frameIndexFor,
    mouthOffsetFor,
    setForcedAnimation,
    definitions,
    get drawSize() { return drawSize; },
    get anchorFrameX() { return anchorFrameX; },
    get anchorFrameY() { return anchorFrameY; },
    get mouthFrameY() { return mouthFrameY; },
    get catchVisualDuration() { return catchVisualDuration; },
  });
})();



const GullyArcadeAnimationRenderer = (() => {
  const animationProfile = ArcadeAnimationRegistry.character('pelican');
  const basePath = animationProfile.basePath;
  const frameSize = animationProfile.frameSize;
  const drawSize = animationProfile.drawSize;
  const anchorFrameX = animationProfile.anchorX;
  const anchorFrameY = animationProfile.anchorY;
  const mouthFrameY = animationProfile.mouthY;
  const footOffset = animationProfile.footOffset;
  const definitions = animationProfile.clips;
  const sideFacingAnimations = new Set(
    Object.entries(definitions)
      .filter(([, def]) => def.facingMode === 'crossfade' || def.facingMode === 'mirror')
      .map(([id]) => id),
  );
  const images = Object.create(null);
  const failed = Object.create(null);
  const controller = ArcadeAnimationRuntime.createController('pelican', animationProfile.defaultClip);
  let forcedAnimationId = null;

  function shouldUse(charDef) {
    return Boolean(charDef && charDef.id === 'pelican');
  }

  function nowSeconds() {
    if (typeof ArcadeAnimationClock !== 'undefined') return ArcadeAnimationClock.getElapsed();
    return typeof RuntimeState !== 'undefined' ? Number(RuntimeState.frogAnim || 0) / 3 : 0;
  }

  function getImage(animationId) {
    const def = definitions[animationId] || definitions[animationProfile.defaultClip];
    if (images[animationId] || failed[animationId] || typeof Image === 'undefined') return images[animationId] || null;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {};
    img.onerror = () => { failed[animationId] = true; images[animationId] = null; };
    img.src = basePath + def.file;
    images[animationId] = img;
    return img;
  }

  function requestedAnimation() {
    return 'flap_flight';
  }

  function pickAnimation() {
    if (forcedAnimationId && definitions[forcedAnimationId]) return forcedAnimationId;
    const affinityClip = typeof ArcadeAffinityPresentation !== 'undefined'
      ? ArcadeAffinityPresentation.preferredClip('pelican', definitions)
      : null;
    if (affinityClip) {
      controller.request(affinityClip, { now: nowSeconds(), force: true, reason: 'rare-food-reaction' });
      return affinityClip;
    }
    controller.request(requestedAnimation(), { now: nowSeconds() });
    return controller.snapshot(nowSeconds()).activeId;
  }

  function frameIndexFor(animationId = null) {
    const now = nowSeconds();
    if (animationId && animationId !== controller.snapshot(now).activeId) {
      controller.request(animationId, { now, force: true, reason: 'frame-query' });
    }
    const state = controller.snapshot(now);
    return ArcadeAnimationRuntime.frameIndexFor('pelican', state.activeId, state.elapsed);
  }

  function drawFacing(ctx, img, frame, sign, alpha, dx, dy) {
    if (alpha <= 0.001) return;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.scale(sign < 0 ? -1 : 1, 1);
    ctx.drawImage(
      img,
      frame * frameSize, 0, frameSize, frameSize,
      dx, dy, drawSize, drawSize,
    );
    ctx.restore();
  }

  function facingBlend(pelican, now) {
    const duration = Math.max(0.01, Number(GAME_BALANCE?.pelican?.flight?.turnCrossfadeSeconds || 0.11));
    const from = Number(pelican.facingFrom || pelican.facingSign || 1) < 0 ? -1 : 1;
    const to = Number(pelican.facingTo || pelican.facingSign || 1) < 0 ? -1 : 1;
    const raw = Math.max(0, Math.min(1, (now - Number(pelican.facingBlendStartedAt || 0)) / duration));
    const eased = raw * raw * (3 - 2 * raw);
    return { from, to, blend: from === to ? 1 : eased };
  }

  function draw(ctx, charDef) {
    if (!shouldUse(charDef)) return false;
    const animationId = pickAnimation();
    const def = definitions[animationId] || definitions[animationProfile.defaultClip];
    const state = controller.snapshot(nowSeconds());
    const frame = ArcadeAnimationRuntime.frameIndexFor('pelican', animationId, state.elapsed);
    const img = getImage(animationId);
    if (!img || !img.complete || !img.naturalWidth) return false;
    const availableFrames = Math.floor((img.naturalWidth || img.width || 0) / frameSize);
    if (!availableFrames || frame < 0 || frame >= availableFrames) return false;

    const scale = drawSize / frameSize;
    const dx = -anchorFrameX * scale;
    const dy = -anchorFrameY * scale;
    const pelican = (typeof GameState !== 'undefined' && GameState.charState?.pelican)
      ? GameState.charState.pelican : {};
    const facingMode = def.facingMode || 'front';
    const blend = facingBlend(pelican, nowSeconds());
    const reduceMotion = typeof SETTINGS !== 'undefined' && SETTINGS.reduceMotion;
    const bank = reduceMotion ? 0 : Math.max(-0.24, Math.min(0.24, Number(pelican.bank || 0)));
    // Gully already owns an approved six-frame flight-flap loop. At true rest,
    // add only a tiny visual hover/body settle; gameplay x/y and flight velocity
    // remain untouched, and Reduce Motion removes the extra transform entirely.
    const idleStill = Math.abs(Number(pelican.flightVx || 0)) < 0.4
      && Math.abs(Number(pelican.flightVy || 0)) < 0.4
      && Number(frog?.moveDir || 0) === 0
      && Number(frog?.moveY || 0) === 0;
    const idlePhase = idleStill && !reduceMotion
      ? Math.sin(nowSeconds() * Math.PI * 2 / 3.8)
      : 0;
    const idleHover = idlePhase * 1.1;
    const idleSettleY = 1 - idlePhase * 0.006;

    ctx.save();
    ctx.translate(Math.round(frog.x), Math.round(frog.y + footOffset + idleHover));
    if (idleSettleY !== 1) ctx.scale(1, idleSettleY);
    if (bank && typeof ctx.rotate === 'function') ctx.rotate(bank);
    if (facingMode === 'crossfade') {
      if (blend.from === blend.to || blend.blend >= 0.999) {
        drawFacing(ctx, img, frame, blend.to, 1, dx, dy);
      } else {
        drawFacing(ctx, img, frame, blend.from, 1 - blend.blend, dx, dy);
        drawFacing(ctx, img, frame, blend.to, blend.blend, dx, dy);
      }
    } else if (facingMode === 'mirror') {
      drawFacing(ctx, img, frame, blend.to, 1, dx, dy);
    } else {
      ctx.drawImage(
        img,
        frame * frameSize, 0, frameSize, frameSize,
        dx, dy, drawSize, drawSize,
      );
    }
    ctx.restore();
    return true;
  }

  function mouthOffsetFor(charDef) {
    if (!shouldUse(charDef)) return null;
    return Math.round((anchorFrameY - mouthFrameY) * (drawSize / frameSize) - footOffset);
  }

  function setForcedAnimation(animationId = null) {
    forcedAnimationId = animationId && definitions[animationId] ? animationId : null;
    if (forcedAnimationId) controller.force(forcedAnimationId);
    else controller.reset(requestedAnimation());
    return forcedAnimationId;
  }

  function reset() {
    forcedAnimationId = null;
    controller.reset(animationProfile.defaultClip);
  }

  if (typeof EventBus !== 'undefined') EventBus.on('gameStarted', reset);
  if (typeof window !== 'undefined') {
    window.addEventListener('character-animation-tuning-change', event => {
      if (event.detail?.characterId === 'pelican') controller.force(controller.snapshot().activeId);
    });
  }

  return Object.freeze({
    draw,
    shouldUse,
    pickAnimation,
    frameIndexFor,
    mouthOffsetFor,
    setForcedAnimation,
    reset,
    controller,
    definitions,
    sideFacingAnimations,
    durationFor: clipId => ArcadeAnimationRuntime.durationSeconds('pelican', clipId),
    get drawSize() { return drawSize; },
    get anchorFrameX() { return anchorFrameX; },
    get anchorFrameY() { return anchorFrameY; },
    get mouthFrameY() { return mouthFrameY; },
    get catchVisualDuration() { return ArcadeAnimationRuntime.durationSeconds('pelican', 'catch_swallow'); },
    get takeoffVisualDuration() { return ArcadeAnimationRuntime.durationSeconds('pelican', 'takeoff_launch'); },
  });
})();

if (typeof CharacterAnimationTuning !== 'undefined') {
  CharacterAnimationTuning.register('gulper', GulperArcadeAnimationRenderer.definitions, 'Gulper');
  CharacterAnimationTuning.registerRenderer('gulper', GulperArcadeAnimationRenderer);
  CharacterAnimationTuning.registerRenderer('chomper', ChomperArcadeAnimationRenderer);
  CharacterAnimationTuning.registerRenderer('chameleon', ChameleonArcadeAnimationRenderer);
  CharacterAnimationTuning.registerRenderer('flytrap', FlytrapArcadeAnimationRenderer);
  CharacterAnimationTuning.registerRenderer('pelican', GullyArcadeAnimationRenderer);
}


// Curated high-resolution renderer for roster identities promoted from the
// archived production work. These assets preserve the locked front-facing
// masters and only animate authored regions/states. Gameplay collision and
// procedural tongue reach remain owned by the existing gameplay systems.
const CuratedHighResAnimationRenderer = (() => {
  const supportedIds = new Set(['classic', 'fire', 'royal', 'princess', 'count']);
  const images = Object.create(null);
  const failed = Object.create(null);
  const active = Object.create(null);
  const lastPose = Object.create(null);

  // Authored head-top attachment points measured from the approved Classic
  // Frog source frames. These are source-pixel coordinates, not screen
  // guesses, so headwear follows the same frame, baseline, lean, tilt and
  // squash transform as the character art. The small y inset seats the hat
  // into the outline instead of leaving a visible gap.
  const CLASSIC_HEAD_TOP_POINTS = Object.freeze({
    idle: Object.freeze({
      x: Object.freeze([125.5,124.5,124.5,125,125.5,126.5,126.5,125.5,125.5,125.5,126,126.5,125.5,124.5,125.5,125.5]),
      y: Object.freeze([39,38,37,36,38,38,40,40,38,37,36,38,38,38,39,38]),
    }),
    move: Object.freeze({
      x: Object.freeze([255.5,254,253.5,253.5,254,255,256.5,258,258.5,258.5,258,257]),
      y: Object.freeze([58,58,58,58,58,58,58,58,58,58,58,58]),
    }),
    catch_open: Object.freeze({ x: Object.freeze([256,256,256,256,256,256,256,256,256,256]), y: Object.freeze([58,58,58,58,58,58,58,58,58,58]) }),
    blink: Object.freeze({ x: Object.freeze([256,256,256,256,256,256,256,256,256]), y: Object.freeze([58,58,58,58,58,58,58,58,58]) }),
  });

  function clamp(value, min, max) {
    const n = Number(value);
    if (!Number.isFinite(n)) return min;
    return Math.max(min, Math.min(max, n));
  }

  function profileFor(charDef) {
    if (!charDef || !supportedIds.has(charDef.id) || typeof ArcadeAnimationRegistry === 'undefined') return null;
    const profile = ArcadeAnimationRegistry.character(charDef.id);
    return profile?.spriteFamily === 'curated-highres' ? profile : null;
  }

  // CharacterAnimationTuning is the effective registration boundary used by
  // the naturalness authority. The generated profile remains the source of
  // identity/base-path data, while effective clips may add a separately
  // scheduled blink or normalize a cropped sheet's presentation geometry.
  function clipsFor(charDef, profile) {
    const raw = profile?.clips || {};
    const entries = typeof CharacterAnimationTuning !== 'undefined'
      && typeof CharacterAnimationTuning.listCharacters === 'function'
      ? CharacterAnimationTuning.listCharacters()
      : [];
    const tuned = entries.find(entry => entry.id === charDef?.id)?.definitions || null;
    return tuned ? { ...raw, ...tuned } : raw;
  }

  function clipFor(charDef, profile, clipId) {
    return clipsFor(charDef, profile)?.[clipId] || null;
  }

  function shouldUse(charDef) {
    return Boolean(profileFor(charDef));
  }

  function nowSeconds() {
    if (typeof ArcadeAnimationClock !== 'undefined') return ArcadeAnimationClock.getElapsed();
    return typeof RuntimeState !== 'undefined' ? Number(RuntimeState.frogAnim || 0) / 3 : 0;
  }

  function tongueExtensionRatio(charDef) {
    if (typeof tongue === 'undefined' || !tongue?.active) return 0;
    const reach = Math.max(1, Number(CONFIG?.TONGUE_MAX || 320) + Number(charDef?.stats?.reachBonus || 0));
    return clamp((Number(tongue.y || 0) - Number(tongue.tip || 0)) / reach, 0, 1);
  }

  function getImage(charDef, clipId) {
    const profile = profileFor(charDef);
    const def = clipFor(charDef, profile, clipId) || clipFor(charDef, profile, profile?.defaultClip);
    if (!profile || !def?.file || typeof Image === 'undefined') return null;
    const key = `${charDef.id}:${def.file}`;
    if (images[key] || failed[key]) return images[key] || null;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {};
    img.onerror = () => { failed[key] = true; images[key] = null; };
    img.src = profile.basePath + def.file;
    images[key] = img;
    return img;
  }

  function pickAnimation(charDef) {
    const profile = profileFor(charDef);
    if (!profile) return null;
    const clips = clipsFor(charDef, profile);
    const behavior = typeof getArcadeCharacterBehaviorProfile === 'function'
      ? getArcadeCharacterBehaviorProfile(charDef)
      : null;
    const presentation = behavior?.presentationContract || {};
    const candidates = { action:null, move:null, blink:null, neutral:profile.defaultClip || 'idle' };

    // Mechanic-critical visuals always win. Gameplay remains authoritative;
    // the renderer only mirrors the current tongue/feed state.
    if (charDef.id === 'princess' && typeof RuntimeState !== 'undefined'
      && Number(RuntimeState.ghostTime || 0) > 0.08 && clips.hurt) {
      candidates.action = 'hurt';
    } else if (charDef.id === 'count') {
      const countState = typeof GameState !== 'undefined' ? (GameState.charState?.count || {}) : {};
      if ((Number(countState.bloodAnim || 0) > 0 || Number(countState.hissAnim || 0) > 0) && clips.catch_open) {
        candidates.action = 'catch_open';
      }
    } else if (typeof tongue !== 'undefined' && tongue?.active && clips.catch_open) {
      const holdRatio = clamp(Number(presentation.catchHoldRatio ?? 0.88), 0, 1);
      if (clips.catch_hold && tongueExtensionRatio(charDef) >= holdRatio) candidates.action = 'catch_hold';
      else candidates.action = 'catch_open';
    } else if (typeof tongue !== 'undefined' && Number(tongue?.swallowTimer || 0) > 0) {
      // Classic has no separately authored swallow strip. Keep its recovered
      // catch sheet in control through the short visual recovery instead of
      // snapping directly from an open mouth to walk/idle. Characters that do
      // own a dedicated swallow clip continue to use it unchanged.
      if (clips.chew_swallow) candidates.action = 'chew_swallow';
      else if (charDef.id === 'classic' && clips.catch_open) candidates.action = 'catch_open';
    }

    const moving = Boolean(typeof frog !== 'undefined' && frog && (frog.moveDir !== 0 || frog.isMoving));
    if (moving && clips.move) candidates.move = 'move';

    // Neutral is intentionally static. Blink is the only authored idle motion.
    if (clips.blink) {
      const now = nowSeconds();
      const delay = Math.max(0, Number(presentation.blinkDelaySeconds ?? 1.8));
      const interval = Math.max(1, Number(presentation.blinkIntervalSeconds ?? 5.4));
      const duration = Math.max(0.05, Math.min(interval, Number(presentation.blinkDurationSeconds ?? 0.72)));
      if (now >= delay && ((now - delay) % interval) < duration) {
        const cycle = Math.floor((now - delay) / interval);
        candidates.blink = clips.wink && cycle % 4 === 3 ? 'wink' : 'blink';
      }
    }

    const priority = Array.isArray(presentation.statePriority)
      ? presentation.statePriority
      : ['action', 'move', 'blink', 'neutral'];
    for (const state of priority) {
      if (candidates[state]) return candidates[state];
    }
    return candidates.neutral;
  }

  function animationElapsed(characterId, animationId) {
    const now = nowSeconds();
    const state = active[characterId] || (active[characterId] = { id: '', startedAt: now });
    if (state.id !== animationId) {
      state.id = animationId;
      state.startedAt = now;
    }
    return Math.max(0, now - state.startedAt);
  }

  function frameIndexFor(charDef, animationId, profile) {
    const clips = clipsFor(charDef, profile);
    const def = clips?.[animationId] || clips?.[profile?.defaultClip];
    const frameCount = Math.max(1, Number(def?.frames || def?.sourceFrames?.length || 1));
    if (frameCount <= 1) return 0;

    if (animationId === 'catch_open' && charDef.id !== 'count' && typeof tongue !== 'undefined'
      && (tongue?.active || Number(tongue?.swallowTimer || 0) > 0)) {
      // Recovered Classic/Frog-family sheets may contain five-frame action
      // clips while older masters contain ten or more. Keep the mouth-open
      // presentation progressive for both layouts. Active extension keeps at
      // least one authored open-mouth frame; recovery is allowed to close all
      // the way back to frame zero before returning to movement/idle.
      const minimumOpenFrame = tongue.active
        ? Math.min(frameCount - 1, Math.max(1, Math.ceil((frameCount - 1) * 0.25)))
        : 0;
      const actionProgress = tongue.active
        ? tongueExtensionRatio(charDef)
        : clamp(Number(tongue.swallowTimer || 0) / 0.14, 0, 1);
      return Math.min(frameCount - 1, Math.max(minimumOpenFrame, Math.round(actionProgress * (frameCount - 1))));
    }

    if (animationId === 'chew_swallow' && typeof tongue !== 'undefined') {
      const progress = 1 - clamp(Number(tongue?.swallowTimer || 0) / 0.14, 0, 1);
      return Math.min(frameCount - 1, Math.round(progress * (frameCount - 1)));
    }

    const elapsed = animationElapsed(charDef.id, animationId);
    if (typeof ArcadeAnimationRuntime !== 'undefined' && typeof ArcadeAnimationRuntime.frameIndexFor === 'function') {
      return ArcadeAnimationRuntime.frameIndexFor(charDef.id, animationId, elapsed);
    }
    const fps = Math.max(1, Number(def?.fps || 10));
    const raw = Math.floor(elapsed * fps);
    return def?.loop ? raw % frameCount : Math.min(frameCount - 1, raw);
  }

  function mouthOffsetFor(charDef) {
    const profile = profileFor(charDef);
    return profile ? Number(profile.mouthOffset || 0) || null : null;
  }

  function preload(charDef) {
    const profile = profileFor(charDef);
    if (!profile) return Promise.resolve([]);
    const clips = clipsFor(charDef, profile);
    const preferred = ['idle', 'move', 'catch_open', 'catch_hold', 'chew_swallow', 'blink', 'wink', 'hurt'];
    const assets = [...new Set(preferred.filter(id => clips?.[id]).map(id => getImage(charDef, id)).filter(Boolean))];
    return Promise.allSettled(assets.map(img => typeof img.decode === 'function' ? img.decode().catch(() => undefined) : Promise.resolve()));
  }

  function resetRuntimeState() {
    for (const key of Object.keys(active)) delete active[key];
    for (const key of Object.keys(lastPose)) delete lastPose[key];
  }

  function classicHeadTopFor(animationId, frame, frameWidth, frameCount = 1) {
    const table = CLASSIC_HEAD_TOP_POINTS[animationId] || CLASSIC_HEAD_TOP_POINTS.idle;
    const xCount = Array.isArray(table.x) ? table.x.length : 0;
    const yCount = Array.isArray(table.y) ? table.y.length : 0;
    const index = Math.max(0, Math.min(Math.max(xCount, yCount, 1) - 1, Number(frame) || 0));
    // The Sep. 8 polished idle/catch crops changed source width and frame
    // cardinality. Old X measurements must never be reinterpreted in the new
    // coordinate space. Only use measured X when the table still matches the
    // active clip exactly; otherwise fail closed to that clip's own center.
    const measuredXMatchesClip = xCount === Math.max(1, Number(frameCount) || 1);
    return {
      x: measuredXMatchesClip ? Number(table.x?.[index] ?? frameWidth / 2) : frameWidth / 2,
      y: Number(table.y?.[Math.min(Math.max(0, yCount - 1), index)] ?? 58),
    };
  }

  function equippedClassicImageHat(charDef) {
    if (charDef?.id !== 'classic' || typeof SaveManager === 'undefined' || typeof COSMETIC_DATA === 'undefined') return null;
    const save = SaveManager.get?.();
    const hatId = save?.equippedCosmetics?.classic?.hat;
    if (!hatId) return null;
    const item = COSMETIC_DATA.find(candidate => candidate?.id === hatId) || null;
    if (!item || item.slot !== 'hat') return null;
    const presentation = typeof cosmeticPresentationForItem === 'function'
      ? cosmeticPresentationForItem(item)
      : (item.presentation || {});
    if (!presentation.assetSrc || presentation.imageOnly !== true) return null;
    return { item, presentation };
  }

  function ownsAttachedCosmetics(charDef) {
    return Boolean(equippedClassicImageHat(charDef));
  }

  function drawAttachedCosmetics(ctx, charDef) {
    const equipped = equippedClassicImageHat(charDef);
    const pose = lastPose[charDef?.id];
    if (!equipped || !pose || typeof ArcadeVisuals === 'undefined' || typeof ArcadeVisuals.drawCosmeticOverlay !== 'function') return false;
    ctx.save();
    ctx.translate(pose.originX, pose.originY);
    if (pose.rotation) ctx.rotate(pose.rotation);
    ctx.scale(pose.scaleX, pose.scaleY);
    ctx.translate(pose.headX, pose.headY);
    ctx.shadowColor = 'rgba(0,0,0,0.42)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetY = 2;
    const drawn = ArcadeVisuals.drawCosmeticOverlay(ctx, equipped.item, {
      size: equipped.presentation.targetWidth,
      slot: 'hat',
      presentation: equipped.presentation,
    });
    ctx.restore();
    return Boolean(drawn);
  }

  function cosmeticPose(characterId = 'classic') {
    const pose = lastPose[String(characterId || '')];
    return pose ? Object.freeze({ ...pose }) : null;
  }

  function draw(ctx, charDef, bob = 0) {
    const profile = profileFor(charDef);
    if (!profile) return false;
    const clips = clipsFor(charDef, profile);
    const animationId = pickAnimation(charDef);
    const def = clips?.[animationId] || clips?.[profile.defaultClip];
    const img = getImage(charDef, animationId);
    if (!def || !img || !img.complete || !img.naturalWidth) return false;

    // Geometry may be overridden per clip. This lets compact optimized idle
    // strips coexist with the existing 512px action masters without changing
    // gameplay scale, anchors or collision geometry.
    const frameWidth = Number(def.frameWidth || profile.frameWidth || profile.frameSize || 0);
    const frameHeight = Number(def.frameHeight || profile.frameHeight || profile.frameSize || 0);
    const scale = Number(def.drawScale || profile.drawScale || 1);
    if (!(frameWidth > 0) || !(frameHeight > 0) || !(scale > 0)) return false;

    const row = Math.max(0, Number(def.row || 0));
    const frame = frameIndexFor(charDef, animationId, profile);
    const frameCount = Math.max(1, Number(def.frames || def.sourceFrames?.length || 1));
    const availableCols = Math.floor((img.naturalWidth || img.width || 0) / frameWidth);
    const availableRows = Math.floor((img.naturalHeight || img.height || 0) / frameHeight);
    if (!availableCols || !availableRows || row >= availableRows || frame >= availableCols) return false;

    const motion = typeof GameState !== 'undefined' && GameState.charState?.standardFrogMotion?.characterId === charDef.id
      ? GameState.charState.standardFrogMotion : null;
    const moving = Boolean(typeof frog !== 'undefined' && frog && (frog.moveDir !== 0 || frog.isMoving));
    const step = motion
      ? Math.sin(Number(motion.bobPhase || 0)) * Number(motion.locomotion || 0)
      : (moving ? Math.sin(Number(frog.stepCycle || 0)) : 0);
    const lean = motion ? clamp(Number(motion.lean || 0), -1, 1) : 0;
    const tilt = motion ? clamp(lean * 0.045, -0.045, 0.045) : (moving ? clamp(step * 0.035, -0.035, 0.035) : 0);
    const behavior = typeof getArcadeCharacterBehaviorProfile === 'function'
      ? getArcadeCharacterBehaviorProfile(charDef)
      : null;
    const allowBodyScalePulse = behavior?.presentationContract?.allowBodyScalePulse !== false;
    const squashX = allowBodyScalePulse && motion ? 1 + Math.abs(step) * 0.012 : 1;
    const squashY = allowBodyScalePulse && motion ? 1 - Math.abs(step) * 0.010 : 1;
    const royalBelly = charDef.id === 'royal'
      ? clamp(Number(GameState?.charState?.royal?.belly || 0), 0, 25) : 0;
    const actionScale = 1 + royalBelly * 0.006;

    const drawWidth = frameWidth * scale;
    const drawHeight = frameHeight * scale;
    const anchorX = Number(def.anchorX ?? profile.anchorX ?? frameWidth / 2) * scale;
    const anchorY = Number(def.anchorY ?? profile.anchorY ?? frameHeight) * scale;
    const bottomY = Math.round(frog.y + bob + Number(profile.footOffset || 0));
    const originX = Math.round(frog.x + lean * 2.0);
    const originY = bottomY + step * 1.15;
    if (charDef.id === 'classic') {
      const head = classicHeadTopFor(animationId, frame, frameWidth, frameCount);
      lastPose[charDef.id] = Object.freeze({
        characterId: charDef.id,
        animationId,
        frame,
        originX,
        originY,
        rotation: tilt,
        scaleX: squashX * actionScale,
        scaleY: squashY * actionScale,
        headX: head.x * scale - anchorX,
        headY: head.y * scale - anchorY,
        sourceScale: scale,
        frameWidth,
        frameHeight,
      });
    }

    ctx.save();
    ctx.translate(originX, originY);
    ctx.rotate(tilt);
    ctx.scale(squashX * actionScale, squashY * actionScale);
    // All curated standard-frog masters are front-facing. Do not mirror their
    // facial/accessory geometry while moving left/right.
    ctx.drawImage(
      img,
      frame * frameWidth, row * frameHeight, frameWidth, frameHeight,
      -anchorX, -anchorY,
      drawWidth, drawHeight
    );
    ctx.restore();
    return true;
  }

  if (typeof EventBus !== 'undefined') EventBus.on('gameStarted', resetRuntimeState);

  return Object.freeze({
    draw, shouldUse, pickAnimation, frameIndexFor, mouthOffsetFor, preload, resetRuntimeState,
    ownsAttachedCosmetics, drawAttachedCosmetics, cosmeticPose,
  });
})();

if (typeof CharacterAnimationTuning !== 'undefined') {
  for (const id of ['classic', 'fire', 'royal', 'princess', 'count']) {
    CharacterAnimationTuning.registerRenderer(id, CuratedHighResAnimationRenderer);
  }
}


// Selected production-quality mouth/tongue sheets for the four standard frogs
// whose supplied art matches the current roster identity. The full-body sheet
// remains the gameplay body for those characters, while the procedural tongue
// still owns collision-accurate reach. This avoids stretching a short art-only
// launch pose to the 320px gameplay reach and keeps presentation separate from
// gameplay balance/collision.
const StandardFrogTongueAnimationRenderer = (() => {
  const supportedIds = new Set(['ocean']);
  const images = Object.create(null);
  const overlays = Object.create(null);
  const failed = Object.create(null);
  const overlayFailed = Object.create(null);

  function clamp(value, min, max) {
    const n = Number(value);
    if (!Number.isFinite(n)) return min;
    return Math.max(min, Math.min(max, n));
  }

  function profileFor(charDef) {
    if (!charDef || !supportedIds.has(charDef.id) || typeof ArcadeAnimationRegistry === 'undefined') return null;
    const profile = ArcadeAnimationRegistry.character(charDef.id);
    return profile?.spriteFamily === 'standard-frog-tongue' ? profile : null;
  }

  function shouldUse(charDef) {
    return Boolean(profileFor(charDef));
  }

  function getImage(charDef, clipId = null) {
    const profile = profileFor(charDef);
    if (!profile || typeof Image === 'undefined') return null;
    const resolvedClipId = clipId && profile.clips?.[clipId] ? clipId : profile.defaultClip;
    const clip = profile.clips?.[resolvedClipId];
    if (!clip?.file) return null;
    const key = `${charDef.id}:${clip.file}`;
    if (images[key] || failed[key]) return images[key] || null;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {};
    img.onerror = () => { failed[key] = true; images[key] = null; };
    img.src = profile.basePath + clip.file;
    images[key] = img;
    return img;
  }

  function getOverlay(charDef) {
    const profile = profileFor(charDef);
    if (!profile?.staticOverlay || typeof Image === 'undefined') return null;
    const key = charDef.id;
    if (overlays[key] || overlayFailed[key]) return overlays[key] || null;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {};
    img.onerror = () => { overlayFailed[key] = true; overlays[key] = null; };
    img.src = profile.basePath + profile.staticOverlay;
    overlays[key] = img;
    return img;
  }

  function mouthOffsetFor(charDef) {
    const profile = profileFor(charDef);
    return profile ? Number(profile.mouthOffset || 0) || null : null;
  }

  function preload(charDef) {
    const profile = profileFor(charDef);
    const assets = [
      getImage(charDef, profile?.clips?.idle ? 'idle' : profile?.defaultClip),
      getImage(charDef, profile?.clips?.tongue_cycle ? 'tongue_cycle' : profile?.defaultClip),
      getOverlay(charDef),
    ].filter(Boolean);
    return Promise.allSettled([...new Set(assets)].map(img => typeof img.decode === 'function' ? img.decode().catch(() => undefined) : Promise.resolve()));
  }

  function frameIndexFor(charDef, profile, clipId) {
    const clip = profile?.clips?.[clipId] || profile?.clips?.[profile.defaultClip];
    const frameCount = Math.max(1, Number(clip?.frames || clip?.sourceFrames?.length || 1));
    if (clipId === 'tongue_cycle' && typeof tongue !== 'undefined'
      && (tongue?.active || Number(tongue?.swallowTimer || 0) > 0)) {
      // The supplied Ocean cycle contains its own short tongue in the later
      // frames. The shared authored-stage rig now owns the visible tongue, so
      // keep Ocean on its clean mouth-open frames (8-10) and never double-draw
      // the baked tongue. The mouth still parts immediately and follows the
      // extension/retraction progress.
      const reach = Math.max(1, Number(CONFIG?.TONGUE_MAX || 320) + Number(charDef?.stats?.reachBonus || 0));
      const extension = tongue.active
        ? clamp((Number(tongue.y || 0) - Number(tongue.tip || 0)) / reach, 0, 1)
        : 0;
      const mouthOpenProgress = tongue.active
        ? clamp(extension / 0.16, 0, 1)
        : clamp(Number(tongue.swallowTimer || 0) / 0.14, 0, 1);
      return Math.min(frameCount - 1, 8 + Math.round(mouthOpenProgress * 2));
    }
    const elapsed = typeof ArcadeAnimationClock !== 'undefined'
      ? ArcadeAnimationClock.getElapsed()
      : (typeof RuntimeState !== 'undefined' ? Number(RuntimeState.frogAnim || 0) / 3 : 0);
    if (typeof ArcadeAnimationRuntime !== 'undefined' && typeof ArcadeAnimationRuntime.frameIndexFor === 'function') {
      return ArcadeAnimationRuntime.frameIndexFor(charDef.id, clipId, elapsed);
    }
    const fps = Math.max(1, Number(clip?.fps || 8));
    return clip?.loop ? Math.floor(elapsed * fps) % frameCount : Math.min(frameCount - 1, Math.floor(elapsed * fps));
  }

  function draw(ctx, charDef, bob = 0) {
    const profile = profileFor(charDef);
    if (!profile) return false;
    const animationId = typeof tongue !== 'undefined'
      && (tongue?.active || Number(tongue?.swallowTimer || 0) > 0)
      && profile.clips?.tongue_cycle
      ? 'tongue_cycle'
      : (profile.clips?.idle ? 'idle' : profile.defaultClip);
    const clip = profile.clips?.[animationId] || profile.clips?.[profile.defaultClip];
    const img = getImage(charDef, animationId);
    if (!img || !img.complete || !img.naturalWidth) return false;

    const frameWidth = Number(clip?.frameWidth || profile.frameWidth || profile.frameSize || 0);
    const frameHeight = Number(clip?.frameHeight || profile.frameHeight || profile.frameSize || 0);
    const scale = Number(clip?.drawScale || profile.drawScale || 1);
    if (!(frameWidth > 0) || !(frameHeight > 0) || !(scale > 0)) return false;

    const frame = frameIndexFor(charDef, profile, animationId);
    const availableFrames = Math.floor((img.naturalWidth || img.width || 0) / frameWidth);
    if (!availableFrames || frame >= availableFrames) return false;

    const motion = GameState.charState.standardFrogMotion?.characterId === charDef.id
      ? GameState.charState.standardFrogMotion : null;
    const moving = Boolean(frog && (frog.moveDir !== 0 || frog.isMoving));
    const step = motion
      ? Math.sin(Number(motion.bobPhase || 0)) * Number(motion.locomotion || 0)
      : (moving ? Math.sin(Number(frog.stepCycle || 0)) : 0);
    const lean = motion ? clamp(Number(motion.lean || 0), -1, 1) : 0;
    const tilt = motion ? clamp(lean * 0.065, -0.065, 0.065) : (moving ? clamp(step * 0.055, -0.055, 0.055) : 0);
    const squashX = motion ? 1 + Math.abs(step) * 0.018 : (moving ? 1.02 : 1);
    const squashY = motion ? 1 - Math.abs(step) * 0.014 : (moving ? 0.985 : 1);
    const facingTo = motion ? Number(motion.facingTo || 1) : 1;
    const facingFrom = motion ? Number(motion.facingFrom || facingTo) : facingTo;
    const facingBlend = motion ? clamp(Number(motion.facingBlend || 0), 0, 1) : 1;
    const royalBelly = charDef.id === 'royal' ? clamp(Number(GameState.charState.royal?.belly || 0), 0, 25) : 0;
    const actionScale = 1 + royalBelly * 0.006;
    const bottomY = Math.round(frog.y + bob + Number(profile.footOffset || 0));
    const drawWidth = frameWidth * scale;
    const drawHeight = frameHeight * scale;
    const anchorX = Number(clip?.anchorX ?? profile.anchorX ?? frameWidth / 2) * scale;
    const anchorY = Number(clip?.anchorY ?? profile.anchorY ?? frameHeight) * scale;
    const overlay = animationId === 'tongue_cycle' ? getOverlay(charDef) : null;

    const drawFacing = (sign, alpha = 1) => {
      ctx.save();
      ctx.globalAlpha *= alpha;
      ctx.scale(sign, 1);
      ctx.drawImage(
        img,
        frame * frameWidth, 0, frameWidth, frameHeight,
        -anchorX, -anchorY,
        drawWidth, drawHeight
      );
      if (overlay && overlay.complete && overlay.naturalWidth) {
        ctx.drawImage(overlay, -anchorX, -anchorY, drawWidth, drawHeight);
      }
      ctx.restore();
    };

    ctx.save();
    ctx.translate(Math.round(frog.x + lean * 2.5), bottomY + step * 1.5);
    ctx.rotate(tilt);
    ctx.scale(squashX * actionScale, squashY * actionScale);
    const behavior = typeof getArcadeCharacterBehaviorProfile === 'function'
      ? getArcadeCharacterBehaviorProfile(charDef)
      : null;
    const allowFlip = behavior?.presentationContract?.allowHorizontalFlip !== false;
    if (!allowFlip) {
      drawFacing(1, 1);
    } else if (motion && facingBlend < 1 && facingFrom !== facingTo) {
      drawFacing(facingFrom, 1 - facingBlend);
      drawFacing(facingTo, facingBlend);
    } else {
      drawFacing(facingTo, 1);
    }
    ctx.restore();
    return true;
  }

  return Object.freeze({ draw, shouldUse, mouthOffsetFor, frameIndexFor, preload });
})();

if (typeof CharacterAnimationTuning !== 'undefined') {
  CharacterAnimationTuning.registerRenderer('ocean', StandardFrogTongueAnimationRenderer);
}

// Only the selected character's heavy gameplay art is eagerly decoded. This
// keeps mobile memory bounded without allowing a first-catch decode hitch.
const ArcadeCharacterAssetPreloader = (() => {
  // AssetManager owns the canonical portrait image whenever it is available.
  // The local cache supports non-standard hosts that do not load AssetManager.
  // It always loads the selected character's own approved portrait.
  const localPortraitCache = Object.create(null);
  const pending = Object.create(null);
  const states = Object.create(null);

  function characterFor(id) {
    return typeof CHARACTER_DATA !== 'undefined'
      ? CHARACTER_DATA.find(character => character.id === String(id || '')) || null
      : null;
  }

  function preload(characterOrId) {
    const charDef = typeof characterOrId === 'object' ? characterOrId : characterFor(characterOrId);
    if (!charDef) return Promise.resolve([]);
    if (pending[charDef.id]) return pending[charDef.id];
    if (states[charDef.id]?.settled) return Promise.resolve(states[charDef.id].results || []);
    states[charDef.id] = { attempted:true, pending:true, settled:false, results:null };
    const tasks = [];
    if (typeof AssetManager !== 'undefined' && charDef.assetKey && AssetManager.hasSource?.(charDef.assetKey)) {
      tasks.push(AssetManager.load(charDef.assetKey));
    } else if (typeof Image !== 'undefined' && charDef.src) {
      const portrait = localPortraitCache[charDef.id] || (localPortraitCache[charDef.id] = new Image());
      portrait.decoding = 'async';
      if (!portrait.src) portrait.src = charDef.src;
      tasks.push(typeof portrait.decode === 'function' ? portrait.decode().catch(() => undefined) : Promise.resolve());
    }
    const renderer = typeof CharacterAnimationTuning !== 'undefined'
      ? CharacterAnimationTuning.getRenderer(charDef.id)
      : null;
    if (renderer?.preload) tasks.push(Promise.resolve(renderer.preload(charDef)));
    const job = Promise.allSettled(tasks).then(results => {
      states[charDef.id] = { attempted:true, pending:false, settled:true, results };
      return results;
    }).finally(() => { delete pending[charDef.id]; });
    pending[charDef.id] = job;
    return job;
  }

  function status(characterOrId) {
    const id = typeof characterOrId === 'object' ? characterOrId?.id : characterOrId;
    const state = states[String(id || '')];
    return state ? Object.freeze({ attempted:Boolean(state.attempted), pending:Boolean(state.pending), settled:Boolean(state.settled) })
      : Object.freeze({ attempted:false, pending:false, settled:false });
  }

  if (typeof EventBus !== 'undefined') {
    EventBus.on('gameStarted', () => preload(typeof GameState !== 'undefined' ? GameState.selectedCharacterId : 'classic'));
  }

  return Object.freeze({ preload, status });
})();


const CharacterSelectRuntimeRenderer = (() => {
  // Gameplay bodies must match the owned character-select portraits. Every
  // playable Arcade character enters gameplay through this renderer first.
  // Every character is fail-closed: only its own approved portrait or sprite
  // may render. Missing or undecoded art never substitutes another model.
  const portraitIds = new Set([
    'gulper', 'classic', 'fire', 'ocean', 'royal', 'ninja', 'golden',
    'hippo', 'chameleon', 'pelican', 'flytrap', 'count', 'bob', 'chomper', 'princess',
  ]);
  const crops = Object.freeze({
    gulper:    Object.freeze({ x: 36, y: 68,  width: 406, height: 403, drawHeight: 82, footOffset: 26, mouthOffset: 35 }),
    classic:   Object.freeze({ x: 46, y: 74,  width: 420, height: 363, drawHeight: 73, footOffset: 25, mouthOffset: 32 }),
    fire:      Object.freeze({ x: 46, y: 75,  width: 417, height: 361, drawHeight: 73, footOffset: 25, mouthOffset: 32 }),
    ocean:     Object.freeze({ x: 46, y: 82,  width: 420, height: 347, drawHeight: 72, footOffset: 25, mouthOffset: 32 }),
    royal:     Object.freeze({ x: 46, y: 64,  width: 412, height: 384, drawHeight: 77, footOffset: 26, mouthOffset: 34 }),
    ninja:     Object.freeze({ x: 46, y: 78,  width: 420, height: 355, drawHeight: 72, footOffset: 25, mouthOffset: 32 }),
    golden:    Object.freeze({ x: 46, y: 78,  width: 391, height: 356, drawHeight: 74, footOffset: 25, mouthOffset: 33 }),
    hippo:     Object.freeze({ x: 46, y: 87,  width: 420, height: 338, drawHeight: 73, footOffset: 26, mouthOffset: 27 }),
    chameleon: Object.freeze({ x: 33, y: 169, width: 447, height: 307, drawHeight: 82, footOffset: 24, mouthOffset: 17 }),
    pelican:   Object.freeze({ x: 46, y: 85,  width: 420, height: 342, drawHeight: 70, footOffset: 23, mouthOffset: 28 }),
    flytrap:   Object.freeze({ x: 46, y: 92,  width: 420, height: 327, drawHeight: 73, footOffset: 24, mouthOffset: 25 }),
    count:     Object.freeze({ x: 46, y: 76,  width: 420, height: 360, drawHeight: 75, footOffset: 25, mouthOffset: 30 }),
    bob:       Object.freeze({ x: 46, y: 59,  width: 420, height: 393, drawHeight: 77, footOffset: 26, mouthOffset: 29 }),
    chomper:   Object.freeze({ x: 46, y: 76,  width: 420, height: 359, drawHeight: 76, footOffset: 25, mouthOffset: 28 }),
    princess:  Object.freeze({ x: 46, y: 61,  width: 420, height: 373, drawHeight: 78, footOffset: 26, mouthOffset: 34 }),
  });
  const images = Object.create(null);
  const failed = Object.create(null);
  const canonicalClassicDefinition = Object.freeze({
    id: 'classic',
    visualAssetId: 'classic',
    assetKey: 'char_classic',
    src: 'assets/images/characters/runtime-select/classic.png',
    bodyColor: '#3aaa3a',
    color: '#4cc94c',
    bellyColor: '#a8eea8',
  });

  function visualIdentityId(charDef) {
    return String(charDef?.visualAssetId || charDef?.id || '');
  }

  function clamp(value, min, max) {
    const n = Number(value);
    if (!Number.isFinite(n)) return min;
    return Math.max(min, Math.min(max, n));
  }

  function shouldUse(charDef) {
    return Boolean(charDef && portraitIds.has(visualIdentityId(charDef)) && charDef.src);
  }

  function mouthOffsetFor(charDef) {
    const crop = charDef && crops[visualIdentityId(charDef)];
    return crop ? crop.mouthOffset : null;
  }

  function getImage(charDef) {
    if (!shouldUse(charDef) || typeof Image === 'undefined') return null;
    if (typeof AssetManager !== 'undefined' && charDef.assetKey && AssetManager.hasSource?.(charDef.assetKey)) {
      // getImage starts a lazy request if needed and returns the shared decoded
      // image only when ready. Until then, the character route remains unresolved.
      return AssetManager.getImage(charDef.assetKey);
    }
    const key = visualIdentityId(charDef);
    if (images[key] || failed[key]) return images[key] || null;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {};
    img.onerror = () => { failed[key] = true; images[key] = null; };
    img.src = charDef.src;
    images[key] = img;
    return img;
  }

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

  function actionTransform(charDef) {
    const cs = (typeof GameState !== 'undefined' && GameState.charState) ? GameState.charState : {};
    const facing = frog && frog.facing ? frog.facing : 1;
    const behavior = typeof getArcadeCharacterBehaviorProfile === 'function' ? getArcadeCharacterBehaviorProfile(charDef) : null;
    const out = { offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 1, scale: 1, rotate: 0, tint: null, tintAlpha: 0 };

    switch (behavior?.specialState) {
      case 'gulper-growth': {
        const gulper = cs.gulper || {};
        out.scale *= clamp((gulper.size || 0.6) / 0.6, 0.88, 1.7);
        if (gulper.mouthHeld || gulper.chomping || frog.mouthOpen > 0.25) {
          out.scaleX *= 1.04;
          out.scaleY *= 1.035;
          out.offsetY -= 2;
        }
        break;
      }
      case 'royal-belly-streak': {
        const belly = Number((cs.royal && cs.royal.belly) || 0);
        out.scale *= 1 + clamp(belly, 0, 25) * 0.006;
        break;
      }
      case 'ninja-jump':
        if (cs.ninja && cs.ninja.jumping) {
          out.rotate += -0.04 * facing;
          out.offsetY -= 4;
        }
        break;
      case 'bob-basket': {
        const lean = Number((cs.bob && cs.bob.leanAmt) || 0);
        out.offsetX += lean * 12 * facing;
        out.rotate += lean * 0.05 * facing;
        if (cs.bob && Array.isArray(cs.bob.basketItems) && cs.bob.basketItems.length) {
          out.scaleY *= 1 + cs.bob.basketItems.length * 0.006;
        }
        break;
      }
      case 'hippo-lunge': {
        const hippo = cs.hippo || {};
        const mouth = Number(hippo.mouthOpen || frog.mouthOpen || 0);
        out.offsetX += mouth * 18 * facing;
        out.scaleX *= 1 + mouth * 0.045;
        out.scaleY *= 1 + mouth * 0.02;
        break;
      }
      case 'chomper-chomp': {
        const chomper = cs.chomper || {};
        if (chomper.chomping || frog.mouthOpen > 0.25) {
          out.scaleX *= 1.04;
          out.scaleY *= 1.035;
          out.rotate += 0.025 * facing;
        }
        break;
      }
      case 'flytrap-clone': {
        const snap = Math.max(Number(frog.mouthOpen || 0), Number((cs.flytrap && cs.flytrap.cloneSnapAnim) || 0));
        out.scaleX *= 1 + snap * 0.035;
        out.scaleY *= 1 + snap * 0.025;
        out.offsetY -= snap * 2;
        break;
      }
      case 'gully-flight': {
        const pelican = cs.pelican || {};
        out.offsetY += Math.sin(Number(pelican.wingCycle || 0)) * 2;
        out.rotate += Number(frog.moveY || 0) * 0.04;
        if (pelican.pouchFull > 0) out.scaleY *= 1 + pelican.pouchFull * 0.035;
        break;
      }
      case 'count-feed': {
        const blood = Number((cs.count && cs.count.bloodAnim) || 0);
        const hiss = Number((cs.count && cs.count.hissAnim) || 0);
        out.tint = '#ff3344';
        out.tintAlpha = clamp(blood * 0.18 + hiss * 0.08, 0, 0.24);
        out.scale *= 1 + blood * 0.025;
        break;
      }
      default:
        break;
    }
    return out;
  }

  function draw(ctx, charDef, bob = 0) {
    if (!shouldUse(charDef)) return false;
    const crop = crops[visualIdentityId(charDef)] || crops.classic;
    const img = getImage(charDef);
    if (!img || !img.complete || !img.naturalWidth) return false;

    const drawHeight = crop.drawHeight;
    const drawWidth = drawHeight * (crop.width / crop.height);
    const bottomY = frog.y + bob + crop.footOffset;
    const behavior = typeof getArcadeCharacterBehaviorProfile === 'function' ? getArcadeCharacterBehaviorProfile(charDef) : null;
    const motion = behavior?.locomotionFamily === 'standard-frog' && GameState.charState.standardFrogMotion?.characterId === charDef.id
      ? GameState.charState.standardFrogMotion : null;
    const specialMotion = behavior?.locomotionFamily === 'front-special' && GameState.charState.specialLocomotion?.characterId === charDef.id
      ? GameState.charState.specialLocomotion : null;
    const moving = Boolean(frog && (frog.moveDir !== 0 || frog.isMoving));
    const step = motion ? Math.sin(Number(motion.bobPhase || 0)) * Number(motion.locomotion || 0) : (moving ? Math.sin(frog.stepCycle || 0) : 0);
    const tilt = motion ? clamp(Number(motion.lean || 0) * 0.065, -0.065, 0.065)
      : specialMotion ? clamp(Number(specialMotion.lean || 0) * 0.05, -0.05, 0.05)
      : (moving ? clamp(step * 0.055, -0.055, 0.055) : 0);
    const squashX = motion ? 1 + Math.abs(step) * 0.018 : (moving ? 1.02 : 1);
    const squashY = motion ? 1 - Math.abs(step) * 0.014 : (moving ? 0.985 : 1);
    const action = actionTransform(charDef);
    const mirrorsHorizontally = behavior?.facingPolicy === 'horizontal-side-profile' || behavior?.facingPolicy === 'airborne-crossfade';
    const facing = motion ? Number(motion.facingTo || 1) : (mirrorsHorizontally ? (frog.facing || 1) : 1);

    ctx.save();
    ctx.translate(frog.x + action.offsetX + (motion ? Number(motion.lean || 0) * 2.5 : specialMotion ? Number(specialMotion.lean || 0) * 2 : 0), bottomY + action.offsetY + step * 1.5);
    ctx.rotate(tilt + action.rotate);
    ctx.scale(squashX * action.scaleX * action.scale, squashY * action.scaleY * action.scale);
    const drawFacing = (sign, alpha = 1) => {
      ctx.save();
      ctx.globalAlpha *= alpha;
      ctx.scale(sign, 1);
      ctx.drawImage(
        img,
        crop.x, crop.y, crop.width, crop.height,
        -drawWidth / 2, -drawHeight,
        drawWidth, drawHeight
      );
      ctx.restore();
    };
    const facingBlend = motion ? clamp(Number(motion.facingBlend || 0), 0, 1) : 1;
    if (motion && facingBlend < 1 && motion.facingFrom !== motion.facingTo) {
      drawFacing(Number(motion.facingFrom || 1), 1 - facingBlend);
      drawFacing(Number(motion.facingTo || 1), facingBlend);
    } else {
      drawFacing(facing, 1);
    }
    ctx.restore();
    return true;
  }

return Object.freeze({ draw, shouldUse, mouthOffsetFor });
})();



// Frozen Toadal Arcade renderer. Gameplay state is owned by
// ArcadeToadalMechanics; this renderer only selects authored visual states.
const ToadalArcadeAnimationRenderer = (() => {
  const images = Object.create(null);
  const failed = Object.create(null);
  let activeAnimationId = 'idle';
  let activeAnimationStartedAt = 0;
  let lastGrounded = true;
  let landingStartedAt = -1;
  const LANDING_SECONDS = 0.12;

  function profile() {
    return typeof ArcadeAnimationRegistry !== 'undefined'
      ? ArcadeAnimationRegistry.character('toadal')
      : null;
  }
  function definitions() { return profile()?.clips || {}; }
  function shouldUse(charDef) { return Boolean(charDef?.id === 'toadal' && profile()); }
  function nowSeconds() {
    if (typeof ArcadeAnimationClock !== 'undefined') return ArcadeAnimationClock.getElapsed();
    return typeof RuntimeState !== 'undefined' ? Number(RuntimeState.frogAnim || 0) / 3 : 0;
  }
  function state() {
    return typeof GameState !== 'undefined' ? GameState.charState?.toadal || {} : {};
  }
  function getImage(animationId) {
    const p = profile();
    const defs = p?.clips || {};
    const id = defs[animationId] ? animationId : p?.defaultClip || 'idle';
    const def = defs[id];
    if (!p || !def?.file || typeof Image === 'undefined') return null;
    if (images[id] || failed[id]) return images[id] || null;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {};
    img.onerror = () => { failed[id] = true; images[id] = null; };
    img.src = p.basePath + def.file;
    images[id] = img;
    return img;
  }
  function isVictoryPresentation() {
    try {
      if (typeof ArcadeFeastVictory !== 'undefined' && ArcadeFeastVictory.isAwaitingChoice?.()) return true;
      const dead = typeof GAME_MODES !== 'undefined' && typeof GameState !== 'undefined' && GameState.mode === GAME_MODES.DEAD;
      if (!dead) return false;
      const tone = typeof ArcadeResultUI !== 'undefined' ? String(ArcadeResultUI.lastOutcome?.tone || '') : '';
      return ['celebrate','proud'].includes(tone);
    } catch (_) { return false; }
  }
  function trackLanding() {
    const s = state();
    const grounded = Boolean(s.grounded);
    const now = nowSeconds();
    if (!lastGrounded && grounded) landingStartedAt = now;
    lastGrounded = grounded;
    return landingStartedAt >= 0 && now - landingStartedAt < LANDING_SECONDS;
  }
  function pickAnimation() {
    const s = state();
    const landing = trackLanding();
    if (isVictoryPresentation()) return 'victory';
    if (Number(s.hurtAnimTimer || 0) > 0 || (typeof RuntimeState !== 'undefined' && Number(RuntimeState.ghostTime || 0) > 0.08)) return 'hurt';
    if (s.buildAction?.active) return 'golden_block';
    if (s.throwAction?.active) return 'golden_throw';
    if (typeof tongue !== 'undefined' && tongue?.active) return 'tongue_catch';
    if (Number(s.eatAnimTimer || 0) > 0) return 'swallow';
    if (s.crouchHeld || !s.grounded || landing) return 'jump';
    if (typeof frog !== 'undefined' && frog && (frog.moveDir !== 0 || frog.isMoving)) return 'move';
    return 'idle';
  }
  function animationElapsed(animationId) {
    const now = nowSeconds();
    if (activeAnimationId !== animationId) {
      activeAnimationId = animationId;
      activeAnimationStartedAt = now;
    }
    return Math.max(0, now - activeAnimationStartedAt);
  }
  function phaseJumpFrame() {
    const s = state();
    const now = nowSeconds();
    // Frame 0 is now an authored held crouch.  The frog does not leave the
    // ground until Down/S is released, fixing the old visual mismatch where
    // the crouch pose appeared after upward physics had already started.
    if (Boolean(s.grounded) && Boolean(s.crouchHeld)) return 0;
    if (Boolean(s.grounded) && landingStartedAt >= 0 && now - landingStartedAt < LANDING_SECONDS) {
      return now - landingStartedAt < LANDING_SECONDS * 0.5 ? 6 : 7;
    }
    const vy = Number(s.velocityY || 0);
    if (vy < -300) return 1;
    if (vy < -90) return 2;
    if (vy <= 90) return 3;
    if (vy < 300) return 4;
    return 5;
  }
  function tongueCatchFrame() {
    if (typeof tongue === 'undefined' || !tongue?.active) return 0;
    const extension = typeof getTongueExtensionRatio === 'function'
      ? Math.max(0, Math.min(1, Number(getTongueExtensionRatio(getCharDef())) || 0))
      : 0;
    if (tongue.phase === 'contact') return 4;
    if (tongue.phase === 'retracting' || tongue.catching) {
      return Math.max(5, Math.min(7, 5 + Math.floor((1 - extension) * 3)));
    }
    return Math.max(0, Math.min(4, Math.floor(extension * 5)));
  }
  function frameIndexFor(animationId) {
    const p = profile();
    const def = p?.clips?.[animationId] || p?.clips?.[p?.defaultClip];
    const count = Math.max(1, Number(def?.frames || def?.sourceFrames?.length || 1));
    if (animationId === 'jump') return Math.min(count - 1, phaseJumpFrame());
    if (animationId === 'tongue_catch') return Math.min(count - 1, tongueCatchFrame());
    const s = state();
    let progress = null;
    if (animationId === 'golden_throw' && s.throwAction?.active) {
      progress = Number(s.throwAction.elapsed || 0) / Math.max(0.001, Number(globalThis.ArcadeToadalMechanics?.CONFIG?.throwDuration || 0.34));
    } else if (animationId === 'golden_block' && s.buildAction?.active) {
      progress = Number(s.buildAction.elapsed || 0) / Math.max(0.001, Number(globalThis.ArcadeToadalMechanics?.CONFIG?.buildDuration || 0.46));
    } else if (animationId === 'hurt' && Number(s.hurtAnimTimer || 0) > 0) {
      progress = 1 - Math.min(1, Number(s.hurtAnimTimer || 0) / 0.56);
    } else if (animationId === 'swallow' && Number(s.eatAnimTimer || 0) > 0) {
      progress = 1 - Math.min(1, Number(s.eatAnimTimer || 0) / 0.30);
    }
    if (progress != null) return Math.max(0, Math.min(count - 1, Math.floor(progress * count)));
    const elapsed = animationElapsed(animationId);
    if (typeof ArcadeAnimationRuntime !== 'undefined' && typeof ArcadeAnimationRuntime.frameIndexFor === 'function') {
      return ArcadeAnimationRuntime.frameIndexFor('toadal', animationId, elapsed);
    }
    const fps = Math.max(1, Number(def?.fps || 8));
    return def?.loop ? Math.floor(elapsed * fps) % count : Math.min(count - 1, Math.floor(elapsed * fps));
  }
  function draw(ctx, charDef) {
    if (!shouldUse(charDef)) return false;
    const p = profile();
    const animationId = pickAnimation();
    const def = p.clips?.[animationId] || p.clips?.[p.defaultClip];
    const img = getImage(animationId);
    if (!img || !img.complete || !img.naturalWidth || !def) return false;
    const frameSize = Number(def.frameWidth || p.frameSize || 256);
    const frameHeight = Number(def.frameHeight || p.frameSize || 256);
    const frame = frameIndexFor(animationId);
    const sourceFrames = Array.isArray(def.sourceFrames) && def.sourceFrames.length ? def.sourceFrames : null;
    const sourceFrame = sourceFrames ? Number(sourceFrames[Math.min(frame, sourceFrames.length - 1)] || 0) : frame;
    const available = Math.floor((img.naturalWidth || img.width || 0) / frameSize);
    if (!available || sourceFrame < 0 || sourceFrame >= available) return false;
    const drawSize = Number(def.drawSize || p.drawSize || 118);
    const drawHeight = drawSize * frameHeight / frameSize;
    const scale = drawSize / frameSize;
    const anchorX = Number.isFinite(Number(def.anchorX)) ? Number(def.anchorX) : Number(p.anchorX || frameSize / 2);
    const anchorY = Number.isFinite(Number(def.anchorY)) ? Number(def.anchorY) : Number(p.anchorY || frameHeight);
    const bottomY = Math.round(Number(frog.y || 0) + Number(p.footOffset || 0));
    const facing = frog?.facing < 0 ? -1 : 1;
    ctx.save();
    ctx.translate(Math.round(frog.x), bottomY);
    ctx.scale(facing, 1);
    ctx.drawImage(
      img,
      sourceFrame * frameSize, 0, frameSize, frameHeight,
      -anchorX * scale, -anchorY * scale,
      drawSize, drawHeight,
    );
    ctx.restore();
    return true;
  }
  function mouthOffsetFor(charDef) {
    if (!shouldUse(charDef)) return null;
    return Number(profile()?.mouthOffset || 45);
  }
  function preload() {
    const defs = definitions();
    const assets = Object.keys(defs).filter(id => id !== 'tongue_catch_archive').map(getImage).filter(Boolean);
    return Promise.allSettled(assets.map(img => typeof img.decode === 'function' ? img.decode().catch(() => undefined) : Promise.resolve()));
  }
  getImage('idle');
  return Object.freeze({ draw, shouldUse, pickAnimation, frameIndexFor, mouthOffsetFor, preload });
})();

if (typeof CharacterAnimationTuning !== 'undefined') {
  CharacterAnimationTuning.registerRenderer('toadal', ToadalArcadeAnimationRenderer);
}

function isCharacterSelectRuntimeCharacter(charDef) {
  return CharacterSelectRuntimeRenderer.shouldUse(charDef);
}

function characterSelectRuntimeMouthOffset(charDef) {
  const visualCharDef = typeof resolveArcadeVisualCharacterDefinition === 'function'
    ? resolveArcadeVisualCharacterDefinition(charDef)
    : charDef;
  const chameleonOffset = ChameleonArcadeAnimationRenderer.mouthOffsetFor(charDef);
  const flytrapOffset = FlytrapArcadeAnimationRenderer.mouthOffsetFor(charDef);
  const gullyOffset = GullyArcadeAnimationRenderer.mouthOffsetFor(charDef);
  const curatedHighResOffset = CuratedHighResAnimationRenderer.mouthOffsetFor(charDef);
  const standardTongueOffset = StandardFrogTongueAnimationRenderer.mouthOffsetFor(charDef);
  return chameleonOffset || flytrapOffset || gullyOffset || curatedHighResOffset || standardTongueOffset || CharacterSelectRuntimeRenderer.mouthOffsetFor(visualCharDef);
}



function drawPlayerSpriteBody(charDef, bob) {
  if (!charDef || typeof isSpriteRenderedCharacter !== 'function' || !isSpriteRenderedCharacter(charDef.id)) return false;
  if (typeof SpriteRenderer === 'undefined' || typeof SpriteSheetManager === 'undefined') return false;
  let state = SpriteRenderer.getCharacterState('player');
  if ((!state || !state.definition || state.definition.id !== charDef.id)
    && (typeof initPlayerSpriteRenderer !== 'function' || !initPlayerSpriteRenderer(charDef.id))) {
    return false;
  }
  state = SpriteRenderer.getCharacterState('player');
  if (!state || !state.definition) return false;
  if (!SpriteSheetManager.isReady(state.definition.spriteSheet)) return false;
  if (typeof syncPlayerSpriteState === 'function') syncPlayerSpriteState(bob);
  state = SpriteRenderer.getCharacterState('player');
  if (typeof ContentRendererAdapters !== 'undefined'
    && typeof ContentRendererAdapters.drawArcadeClassicFrog === 'function'
    && ContentRendererAdapters.drawArcadeClassicFrog(ctx, { charDef, bob, spriteState: state })) {
    return true;
  }
  return SpriteRenderer.drawCharacter(ctx, 'player', 1 / 60);
}

const ArcadeCharacterRenderRouter = (() => {
  let lastResult = Object.freeze({ characterId: '', drawn: false, mode: 'asset', stage: 'not-drawn' });
  const dedicatedRenderers = Object.freeze({
    gulper: GulperArcadeAnimationRenderer,
    bob: BobArcadeAnimationRenderer,
    chameleon: ChameleonArcadeAnimationRenderer,
    flytrap: FlytrapArcadeAnimationRenderer,
    pelican: GullyArcadeAnimationRenderer,
    chomper: ChomperArcadeAnimationRenderer,
    toadal: ToadalArcadeAnimationRenderer,
    'curated-highres': CuratedHighResAnimationRenderer,
    'standard-frog-tongue': StandardFrogTongueAnimationRenderer,
  });
  const warned = new Set();

  function behaviorFor(characterId) {
    const behavior = typeof getArcadeCharacterBehaviorProfile === 'function'
      ? getArcadeCharacterBehaviorProfile(characterId)
      : null;
    if (!behavior) throw new Error(`Missing Arcade renderer behavior profile for ${characterId || 'unknown character'}.`);
    return behavior;
  }

  function policyFor(characterId) {
    return behaviorFor(characterId).rendererPolicy;
  }

  function priorityFor(characterId) {
    return behaviorFor(characterId).rendererPriority;
  }

  function dedicatedFor(characterId) {
    const behavior = behaviorFor(characterId);
    const key = behavior?.dedicatedRendererKey || characterId;
    return dedicatedRenderers[key] || null;
  }

  function safeDedicatedDraw(renderer, characterId, charDef, bob) {
    if (!renderer) return false;
    try {
      return Boolean(renderer.draw(ctx, charDef, bob));
    } catch (error) {
      if (!warned.has(characterId) && typeof console !== 'undefined') {
        warned.add(characterId);
        console.warn(`[arcade] ${characterId} renderer failed; trying the next approved same-character route.`, error);
      }
      return false;
    }
  }

  function remember(characterId, result) {
    lastResult = Object.freeze({ characterId: String(characterId || ''), ...result });
    return result;
  }

  function draw(charDef, bob) {
    if (!charDef) return remember('', Object.freeze({ drawn: false, mode: 'asset', stage: 'unresolved' }));
    const mode = policyFor(charDef.id);
    const dedicatedEnabled = typeof GAME_BALANCE === 'undefined'
      || GAME_BALANCE?.arcadeAnimationRuntime?.enabled !== false;
    const routes = priorityFor(charDef.id);

    for (const stage of routes) {
      let drawn = false;
      let attachedCosmeticsOwned = false;
      if (stage === 'dedicated-sprite') {
        const renderer = dedicatedFor(charDef.id);
        drawn = dedicatedEnabled && safeDedicatedDraw(renderer, charDef.id, charDef, bob);
        if (drawn && renderer && typeof renderer.ownsAttachedCosmetics === 'function'
          && renderer.ownsAttachedCosmetics(charDef)) {
          attachedCosmeticsOwned = true;
          if (typeof renderer.drawAttachedCosmetics === 'function') {
            try { renderer.drawAttachedCosmetics(ctx, charDef); }
            catch (error) {
              if (typeof console !== 'undefined') console.warn('[arcade] Approved attached cosmetic draw failed closed.', error);
            }
          }
        }
      } else if (stage === 'portrait-hybrid') {
        drawn = CharacterSelectRuntimeRenderer.draw(ctx, charDef, bob);
      } else if (stage === 'generic-sprite') {
        drawn = drawPlayerSpriteBody(charDef, bob);
      }
      if (drawn) return remember(charDef.id, Object.freeze({ drawn: true, mode, stage, attachedCosmeticsOwned }));
    }
    return remember(charDef.id, Object.freeze({ drawn: false, mode, stage: 'unresolved' }));
  }

  function snapshot() { return lastResult; }

  return Object.freeze({ draw, policyFor, priorityFor, snapshot });
})();

function drawFrogActorLayer() {
  const charDef = getCharDef();
  const visualCharDef = typeof resolveArcadeVisualCharacterDefinition === 'function'
    ? resolveArcadeVisualCharacterDefinition(charDef)
    : charDef;
  const behavior = typeof getArcadeCharacterBehaviorProfile === 'function' ? getArcadeCharacterBehaviorProfile(charDef) : null;
  const bob = Math.sin(RuntimeState.frogAnim) * 2;
  const _presentationConfig = GAME_BALANCE.arcadePresentation || {};
  const _sizeClass = behavior?.presentationContract?.sizeClass || 'standard';
  const _sizeClassMultipliers = _presentationConfig.characterSizeClassMultipliers || {};
  const _presentationVisualScale = Math.max(0.1,
    Number(_presentationConfig.characterBaseScale || 1) * Number(_sizeClassMultipliers[_sizeClass] || 1));
  const _tongueBodyTransform = typeof TongueRigPresentation !== 'undefined'
    ? TongueRigPresentation.bodyTransform(charDef)
    : { scaleX:1, scaleY:1, offsetY:0 };
  ctx.save();
    const _feedbackTransform = typeof ArcadePresentationFeedback !== 'undefined'
    ? ArcadePresentationFeedback.transform(charDef?.id)
    : { scaleX:1, scaleY:1, offsetX:0, offsetY:0, rotation:0, alpha:1 };
  const _affinityTransform = typeof ArcadeAffinityPresentation !== 'undefined'
    ? ArcadeAffinityPresentation.transform(charDef?.id)
    : { scaleX:1, scaleY:1, offsetY:0, rotation:0 };
  const _combinedTransform = {
    scaleX: Number(_feedbackTransform.scaleX || 1) * Number(_affinityTransform.scaleX || 1),
    scaleY: Number(_feedbackTransform.scaleY || 1) * Number(_affinityTransform.scaleY || 1),
    offsetX: Number(_feedbackTransform.offsetX || 0),
    offsetY: Number(_feedbackTransform.offsetY || 0) + Number(_affinityTransform.offsetY || 0),
    rotation: Number(_feedbackTransform.rotation || 0) + Number(_affinityTransform.rotation || 0),
    alpha: Number(_feedbackTransform.alpha ?? 1),
  };
  ctx.translate(frog.x + _combinedTransform.offsetX, frog.y + _combinedTransform.offsetY);
  if (_combinedTransform.rotation) ctx.rotate(_combinedTransform.rotation);
  ctx.scale(_combinedTransform.scaleX, _combinedTransform.scaleY);
  ctx.translate(-frog.x, -frog.y);
  ctx.globalAlpha *= _combinedTransform.alpha;
  if (_tongueBodyTransform.scaleX !== 1 || _tongueBodyTransform.scaleY !== 1 || _tongueBodyTransform.offsetY) {
    ctx.translate(frog.x, frog.y + _tongueBodyTransform.offsetY);
    ctx.scale(_tongueBodyTransform.scaleX, _tongueBodyTransform.scaleY);
    ctx.translate(-frog.x, -frog.y);
  }
  // Visual-only presentation scale. Scaling around frog.y keeps the character
  // grounded on the existing gameplay baseline while leaving collision and
  // movement geometry untouched.
  if (_presentationVisualScale !== 1) {
    ctx.translate(frog.x, frog.y);
    ctx.scale(_presentationVisualScale, _presentationVisualScale);
    ctx.translate(-frog.x, -frog.y);
  }
  if (behavior?.specialState === 'gulper-growth' && charDef?.id !== 'gulper') {
    const _gulperGrowthState = GameState.isTC ? GameState.toadalConsumption : GameState.charState.gulper;
    const _gulperVisualScale = Math.max(1, Number(_gulperGrowthState?.size || 0.6) / 0.6);
    const _gulperPulse = Number(_gulperGrowthState?.growthPulse || 0) > 0
      ? Math.sin(Math.PI * Math.min(1, _gulperGrowthState.growthPulse / 0.24))
      : 0;
    const _gulperShrink = Number(_gulperGrowthState?.shrinkPulse || 0) > 0
      ? Math.sin(Math.PI * Math.min(1, _gulperGrowthState.shrinkPulse / 0.28))
      : 0;
    ctx.translate(frog.x, frog.y);
    ctx.scale(_gulperVisualScale * (1 + _gulperPulse * 0.04 - _gulperShrink * 0.03), _gulperVisualScale * (1 - _gulperPulse * 0.025 + _gulperShrink * 0.04));
    ctx.translate(-frog.x, -frog.y);
  }
  const _ms = GAME_BALANCE.modelScale || 1.0;
  if (_ms !== 1.0) { ctx.translate(frog.x, frog.y); ctx.scale(_ms, _ms); ctx.translate(-frog.x, -frog.y); }
  if (GameState.isFMF) {
    ctx.translate(frog.x, frog.y);
    ctx.scale(1.22, 1.22);
    ctx.translate(-frog.x, -frog.y);
  }
  if (behavior?.locomotionFamily !== 'airborne-gully') {
    const isRootedFlytrap = charDef?.id === 'flytrap';
    const isScaledGulper = charDef?.id === 'gulper' && GameState.isTC && typeof GulperArcadeAnimationRenderer !== 'undefined';
    const gulperScale = isScaledGulper ? GulperArcadeAnimationRenderer.visualScale() : 1;
    const shadowY = isRootedFlytrap && typeof FlytrapArcadeAnimationRenderer !== 'undefined'
      ? FlytrapArcadeAnimationRenderer.mainGroundY() + 2
      : isScaledGulper ? frog.y + 28 : frog.y + 28;
    ctx.beginPath();
    ctx.ellipse(
      frog.x,
      shadowY,
      isRootedFlytrap ? 42 : isScaledGulper ? Math.max(8, 22 * gulperScale) : 22,
      isRootedFlytrap ? 7 : isScaledGulper ? Math.max(3, 7 * gulperScale) : 7,
      0, 0, Math.PI*2
    );
    ctx.fillStyle = isRootedFlytrap ? 'rgba(37,22,12,0.32)' : 'rgba(0,0,0,0.3)';
    ctx.fill();
  } else {
    const groundY = CONFIG.CANVAS_H - 50;
    const shadowScale = 0.4 + 0.6 * ((frog.y - 65) / (CONFIG.CANVAS_H - 125));
    ctx.beginPath(); ctx.ellipse(frog.x, groundY, 20 * shadowScale, 5 * shadowScale, 0, 0, Math.PI*2);
    ctx.fillStyle = `rgba(0,0,0,${0.08 + 0.12 * shadowScale})`; ctx.fill();
  }
  const renderResult = ArcadeCharacterRenderRouter.draw(visualCharDef, bob);
  if (!renderResult.drawn && typeof console !== 'undefined') {
    const preloadStatus = typeof ArcadeCharacterAssetPreloader !== 'undefined'
      ? ArcadeCharacterAssetPreloader.status(charDef)
      : { attempted:false, pending:false, settled:false };
    // A newly selected character may need one decode turn before its approved
    // sheet can draw. Start/continue that owned preload without misreporting a
    // normal asynchronous decode as missing art. Once the preload settles, an
    // unresolved route is a genuine fail-closed asset error.
    if (!preloadStatus.attempted && typeof ArcadeCharacterAssetPreloader !== 'undefined') {
      ArcadeCharacterAssetPreloader.preload(charDef);
    } else if (!preloadStatus.pending) {
      const assetFailureKey = `character:${String(charDef?.id || 'unknown')}`;
      if (!drawFrog._assetFailures) drawFrog._assetFailures = new Set();
      if (!drawFrog._assetFailures.has(assetFailureKey)) {
        drawFrog._assetFailures.add(assetFailureKey);
        console.error(`[arcade] Approved character art unavailable for ${String(charDef?.id || 'unknown')}; rendering is fail-closed.`);
      }
    }
  }

  ctx.restore();

  ctx.save();
  ctx.translate(frog.x + _combinedTransform.offsetX, frog.y + _combinedTransform.offsetY);
  if (_combinedTransform.rotation) ctx.rotate(_combinedTransform.rotation);
  ctx.scale(_combinedTransform.scaleX, _combinedTransform.scaleY);
  if (_presentationVisualScale !== 1) ctx.scale(_presentationVisualScale, _presentationVisualScale);
  if (behavior?.specialState === 'gulper-growth' && charDef?.id !== 'gulper') {
    const _gulperCosmeticState = GameState.isTC ? GameState.toadalConsumption : GameState.charState.gulper;
    const _gulperCosmeticScale = Math.max(1, Number(_gulperCosmeticState?.size || 0.6) / 0.6);
    ctx.scale(_gulperCosmeticScale, _gulperCosmeticScale);
  }
  if (_tongueBodyTransform.offsetY) ctx.translate(0, _tongueBodyTransform.offsetY);
  if (_tongueBodyTransform.scaleX !== 1 || _tongueBodyTransform.scaleY !== 1) {
    ctx.scale(_tongueBodyTransform.scaleX, _tongueBodyTransform.scaleY);
  }
  // Match every character-space scale used by the base model so approved
  // cosmetic images stay attached instead of floating or changing size.
  const _cosmeticModelScale = GAME_BALANCE.modelScale || 1.0;
  if (_cosmeticModelScale !== 1.0) ctx.scale(_cosmeticModelScale, _cosmeticModelScale);
  if (GameState.isFMF) ctx.scale(1.22, 1.22);
  ctx.translate(-frog.x, -frog.y);
  ctx.globalAlpha *= _combinedTransform.alpha;
  drawEquippedCosmetics(charDef, frog.x, frog.y, frog.isMoving, frog.stepCycle, frog.facing);
  ctx.restore();
  if (typeof ArcadePresentationFeedback !== 'undefined') ArcadePresentationFeedback.draw(ctx, frog.x, frog.y, visualCharDef.color || charDef.color || '#ffffff');
  if (typeof ArcadeAffinityPresentation !== 'undefined') ArcadeAffinityPresentation.drawReaction(ctx, frog.x, frog.y);

  if (GAME_BALANCE.showHitboxes) {
    ctx.save();
    ctx.setLineDash([4,3]); ctx.lineWidth = 2;

    if (GameState.isTC && behavior?.specialState === 'gulper-growth') {
      const tc = GameState.toadalConsumption;
      const mouthActive = !tc.mouthClosed;
      if (mouthActive) {
        const mouthW = GulperArcadeAnimationRenderer.catchHalfWidth();
        const mouthCY = GulperArcadeAnimationRenderer.mouthCenterY();
        const mouthH = GulperArcadeAnimationRenderer.catchHalfHeight();
        ctx.strokeStyle = 'rgba(0,255,100,0.85)'; ctx.fillStyle = 'rgba(0,255,100,0.10)';
        ctx.strokeRect(frog.x - mouthW, mouthCY - mouthH, mouthW * 2, mouthH * 2);
        ctx.fillRect(frog.x - mouthW, mouthCY - mouthH, mouthW * 2, mouthH * 2);
      }
    }
    if (behavior?.catchMechanism === 'hippo-lunge-rect') {
      const cs = GameState.charState.hippo;
      const hw = (charDef.stats.catchRadius || 56) + cs.mouthOpen * 80;
      const lungeX = frog.x + (frog.facing * (charDef.stats.lungeDistance || 140) * cs.mouthOpen);
      ctx.strokeStyle='rgba(255,140,0,0.9)'; ctx.fillStyle='rgba(255,140,0,0.08)';
      ctx.strokeRect(lungeX-hw, frog.y-60, hw*2, 80); ctx.fillRect(lungeX-hw, frog.y-60, hw*2, 80);
    }
    if (behavior?.catchMechanism === 'chomper-mouth-rect') {
      const hw = charDef.stats.catchRadius || 58;
      ctx.strokeStyle='rgba(200,100,255,0.9)'; ctx.fillStyle='rgba(200,100,255,0.08)';
      ctx.strokeRect(frog.x-hw, frog.y-60, hw*2, 80); ctx.fillRect(frog.x-hw, frog.y-60, hw*2, 80);
    }
    if (behavior?.catchMechanism === 'flytrap-snap-circle') {
      const r = charDef.stats.catchRadius || 70;
      ctx.strokeStyle='rgba(80,255,80,0.9)'; ctx.fillStyle='rgba(80,255,80,0.06)';
      ctx.beginPath(); ctx.arc(frog.x, frog.y, r, 0, Math.PI*2); ctx.stroke(); ctx.fill();
    }
    if (behavior?.catchMechanism === 'gully-pouch-circle') {
      const r = charDef.stats.catchRadius || 52;
      ctx.strokeStyle='rgba(100,200,255,0.9)'; ctx.fillStyle='rgba(100,200,255,0.06)';
      ctx.beginPath(); ctx.arc(frog.x, frog.y, r, 0, Math.PI*2); ctx.stroke(); ctx.fill();
    }
    if (behavior?.catchMechanism === 'count-feed-circle') {
      const r = charDef.stats.catchRadius || 34;
      ctx.strokeStyle='rgba(180,0,255,0.9)'; ctx.fillStyle='rgba(180,0,255,0.06)';
      ctx.beginPath(); ctx.arc(frog.x, frog.y, r, 0, Math.PI*2); ctx.stroke(); ctx.fill();
    }
    if (behavior?.catchMechanism === 'bob-basket-rect') {
      const cs = GameState.charState.bob;
      const hw = (charDef.stats.catchRadius || 52) + cs.leanAmt * (charDef.stats.basketLeanBonus || 55);
      ctx.strokeStyle='rgba(255,220,50,0.9)'; ctx.fillStyle='rgba(255,220,50,0.08)';
      ctx.strokeRect(frog.x-hw, frog.y-60, hw*2, 60); ctx.fillRect(frog.x-hw, frog.y-60, hw*2, 60);
    }
    ctx.setLineDash([]); ctx.restore();
  }

  if (GAME_BALANCE.showTouchZone && GameState.isTC) {
    const tc = GameState.toadalConsumption;
    const halfW = GulperArcadeAnimationRenderer.catchHalfWidth();
    const zoneY = GulperArcadeAnimationRenderer.mouthCenterY();
    const halfH = GulperArcadeAnimationRenderer.catchHalfHeight();
    ctx.save();
    ctx.strokeStyle = 'rgba(255,200,0,0.9)'; ctx.lineWidth = 2; ctx.setLineDash([5,3]);
    ctx.strokeRect(frog.x - halfW, zoneY - halfH, halfW * 2, halfH * 2);
    ctx.fillStyle = 'rgba(255,200,0,0.08)';
    ctx.fillRect(frog.x - halfW, zoneY - halfH, halfW * 2, halfH * 2);
    ctx.setLineDash([]); ctx.font = '10px monospace'; ctx.fillStyle = 'rgba(255,220,0,0.9)';
    ctx.textAlign = 'center'; ctx.fillText('TOUCH ZONE', frog.x, zoneY - halfH - 4);
    ctx.restore();
  }
}

// Issue #114 repair. Every entry point into the Arcade character presentation
// renders through the shared presentation camera, including isolated QA and
// diagnostic calls that drive drawFrog() directly on a bare DPR transform. The
// camera is re-entrancy safe, so the ordinary frame render — which already
// opens it around the whole actor layer — never applies it twice.
function drawFrog() {
  const camera = typeof ArcadePresentationCamera !== 'undefined' ? ArcadePresentationCamera : null;
  if (camera) camera.begin(ctx);
  try {
    drawFrogActorLayer();
  } finally {
    if (camera) camera.end(ctx);
  }
}

const TongueRigPresentation = (() => {
  const supportedStyles = new Set(["classic","fire","ocean","royal","ninja","golden","princess"]);
  // Every compatible frog owns an exact pre-rendered palette. Runtime tinting
  // is deliberately avoided so glossy highlights, outlines, alpha edges, and
  // file:// delivery remain deterministic.
  const assetPaths = Object.freeze({
    classic: Object.freeze({
      stages:'assets/images/tongue-rig/classic_stages.png',
      shaft:'assets/images/tongue-rig/classic_shaft.png',
      tip:'assets/images/tongue-rig/classic_tip.png',
    }),
    fire: Object.freeze({
      stages:'assets/images/tongue-rig/fire_stages.png',
      shaft:'assets/images/tongue-rig/fire_shaft.png',
      tip:'assets/images/tongue-rig/fire_tip.png',
    }),
    ocean: Object.freeze({
      stages:'assets/images/tongue-rig/ocean_stages.png',
      shaft:'assets/images/tongue-rig/ocean_shaft.png',
      tip:'assets/images/tongue-rig/ocean_tip.png',
    }),
    royal: Object.freeze({
      stages:'assets/images/tongue-rig/royal_stages.png',
      shaft:'assets/images/tongue-rig/royal_shaft.png',
      tip:'assets/images/tongue-rig/royal_tip.png',
    }),
    ninja: Object.freeze({
      stages:'assets/images/tongue-rig/ninja_stages.png',
      shaft:'assets/images/tongue-rig/ninja_shaft.png',
      tip:'assets/images/tongue-rig/ninja_tip.png',
    }),
    golden: Object.freeze({
      stages:'assets/images/tongue-rig/golden_stages.png',
      shaft:'assets/images/tongue-rig/golden_shaft.png',
      tip:'assets/images/tongue-rig/golden_tip.png',
    }),
    princess: Object.freeze({
      stages:'assets/images/tongue-rig/princess_stages.png',
      shaft:'assets/images/tongue-rig/princess_shaft.png',
      tip:'assets/images/tongue-rig/princess_tip.png',
    }),
  });
  const images = Object.create(null);
  const failed = Object.create(null);
  const palettes = Object.freeze({
    classic: Object.freeze({ outline:'rgba(70,12,30,0.96)', body:'#ff667e', lip:'#7b1737' }),
    fire: Object.freeze({ outline:'rgba(86,19,4,0.96)', body:'#f64218', lip:'#8a2d0d' }),
    ocean: Object.freeze({ outline:'rgba(4,63,69,0.96)', body:'#23cacf', lip:'#146b70' }),
    royal: Object.freeze({ outline:'rgba(45,12,84,0.96)', body:'#803ed6', lip:'#4c1a72' }),
    ninja: Object.freeze({ outline:'rgba(55,7,42,0.96)', body:'#a22679', lip:'#51143e' }),
    golden: Object.freeze({ outline:'rgba(92,50,4,0.96)', body:'#f5a91c', lip:'#82450b' }),
    princess: Object.freeze({ outline:'rgba(91,20,56,0.96)', body:'#ff89bb', lip:'#8d2e5a' }),
  });
  const stageAtlases = Object.freeze({
    classic: Object.freeze({ cellWidth:72, cellHeight:360, bottomMargin:6, stages:Object.freeze([[36,39],[38,86],[48,119],[46,153],[50,187],[41,218],[62,262]]) }),
    fire: Object.freeze({ cellWidth:72, cellHeight:360, bottomMargin:6, stages:Object.freeze([[36,39],[38,86],[48,119],[46,153],[50,187],[41,218],[62,262]]) }),
    ocean: Object.freeze({ cellWidth:72, cellHeight:360, bottomMargin:6, stages:Object.freeze([[42,38],[53,88],[57,118],[51,148],[53,180],[45,211],[62,250]]) }),
    royal: Object.freeze({ cellWidth:72, cellHeight:360, bottomMargin:6, stages:Object.freeze([[40,65],[47,107],[48,138],[48,175],[60,206],[42,235],[41,252]]) }),
    ninja: Object.freeze({ cellWidth:72, cellHeight:360, bottomMargin:6, stages:Object.freeze([[40,65],[47,107],[48,138],[48,175],[60,206],[42,235],[41,252]]) }),
    golden: Object.freeze({ cellWidth:72, cellHeight:360, bottomMargin:6, stages:Object.freeze([[53,154],[57,206],[49,237],[65,259],[58,286],[60,316],[56,338]]) }),
    princess: Object.freeze({ cellWidth:72, cellHeight:360, bottomMargin:6, stages:Object.freeze([[36,39],[38,86],[48,119],[46,153],[50,187],[41,218],[62,262]]) }),
  });

  function clamp(value, min, max) {
    const n = Number(value);
    if (!Number.isFinite(n)) return min;
    return Math.max(min, Math.min(max, n));
  }

  function smoothstep(value) {
    const t = clamp(value, 0, 1);
    return t * t * (3 - 2 * t);
  }

  function styleFor(charDef) {
    const behavior = typeof getArcadeCharacterBehaviorProfile === 'function'
      ? getArcadeCharacterBehaviorProfile(charDef)
      : null;
    const requested = String(behavior?.presentationContract?.tongueStyle || 'classic');
    return supportedStyles.has(requested) ? requested : 'classic';
  }

  function getImage(style, part) {
    if (typeof Image === 'undefined') return null;
    const key = `${style}:${part}`;
    if (images[key] || failed[key]) return images[key] || null;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {};
    img.onerror = () => { failed[key] = true; images[key] = null; };
    const source = assetPaths[style]?.[part];
    if (!source) {
      failed[key] = true;
      return null;
    }
    img.src = source;
    images[key] = img;
    return img;
  }

  function characterVisualScale(charDef) {
    const behavior = typeof getArcadeCharacterBehaviorProfile === 'function'
      ? getArcadeCharacterBehaviorProfile(charDef)
      : null;
    const config = GAME_BALANCE.arcadePresentation || {};
    const sizeClass = behavior?.presentationContract?.sizeClass || 'standard';
    const multipliers = config.characterSizeClassMultipliers || {};
    return Math.max(0.1, Number(config.characterBaseScale || 1) * Number(multipliers[sizeClass] || 1));
  }

  function visualStartY(charDef) {
    const scale = characterVisualScale(charDef);
    const transform = bodyTransform(charDef);
    const cavityLocalY = Number(tongue.y || frog.y) - 2;
    const cavityVisualY = frog.y
      + Number(transform.offsetY || 0)
      + Number(transform.scaleY || 1) * scale * (cavityLocalY - frog.y);
    return cavityVisualY + 7;
  }

  function visualGeometry(charDef) {
    if (typeof getTongueCenterline === 'function') {
      return getTongueCenterline(charDef, visualStartY(charDef));
    }
    const root = { x:tongue.x, y:visualStartY(charDef) - 7 };
    const tip = { x:tongue.x, y:tongue.tip };
    return { root, tip, extension:0, points:[root, tip] };
  }

  function drawSegmentTexture(ctx, img, a, b, width) {
    if (!img || !img.complete || !img.naturalWidth) return false;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = Math.max(1, Math.hypot(dx, dy) + 2);
    const angle = Math.atan2(dy, dx);
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(angle + Math.PI / 2);
    ctx.drawImage(img, 3, 3, Math.max(1, img.naturalWidth - 6), Math.max(1, img.naturalHeight - 6), -width / 2, -length, width, length + 2);
    ctx.restore();
    return true;
  }

  function drawCapturedFood(ctx, geometry) {
    if (!tongue.capturedFood || typeof drawArcadeFoodEntityVisual !== 'function') return;
    const extension = clamp(geometry.extension, 0, 1);
    const mouthFade = clamp(extension / 0.11, 0, 1);
    const contact = clamp(Number(tongue.contactTimer || 0) / 0.035, 0, 1);
    const scale = (0.76 + extension * 0.18) * (1 + contact * 0.04);
    drawArcadeFoodEntityVisual(tongue.capturedFood, {
      x: geometry.tip.x,
      y: geometry.tip.y - 5,
      scaleMultiplier: scale,
      rotationOffset: Math.sin(Number(RuntimeState.tongueWobble || 0) * 0.55) * 0.08,
      alpha: mouthFade,
      allowGlow: false,
      freezeWobble: true,
      surface: 'falling-food',
    });
  }

  function drawAtlasStage(ctx, atlasImage, atlas, stageIndex, alpha, paintRoot, tip, width, length) {
    if (!atlasImage || !atlasImage.complete || !atlasImage.naturalWidth || alpha <= 0) return false;
    const stage = atlas.stages[stageIndex];
    if (!stage) return false;
    const contentWidth = stage[0];
    const contentHeight = stage[1];
    const sourceX = stageIndex * atlas.cellWidth + Math.floor((atlas.cellWidth - contentWidth) / 2);
    const sourceY = atlas.cellHeight - Number(atlas.bottomMargin || 0) - contentHeight;
    const dx = tip.x - paintRoot.x;
    const dy = tip.y - paintRoot.y;
    const angle = Math.atan2(dy, dx) + Math.PI / 2;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(paintRoot.x, paintRoot.y);
    ctx.rotate(angle);
    ctx.drawImage(
      atlasImage,
      sourceX, sourceY, contentWidth, contentHeight,
      -width / 2, -length, width, length + 1,
    );
    ctx.restore();
    return true;
  }

  function apertureFor(charDef) {
    const behavior = typeof getArcadeCharacterBehaviorProfile === 'function'
      ? getArcadeCharacterBehaviorProfile(charDef)
      : null;
    const presentation = behavior?.presentationContract || {};
    return presentation.mouthAperture || {};
  }

  function drawAuthoredProgression(ctx, charDef, style, geometry, impact) {
    const atlasImage = getImage(style, 'stages');
    const atlas = stageAtlases[style];
    if (!atlasImage || !atlasImage.complete || !atlasImage.naturalWidth || !atlas) return false;

    const extension = clamp(geometry.extension, 0, 1);
    const stagePosition = extension * (atlas.stages.length - 1);
    const lower = Math.floor(stagePosition);
    const upper = Math.min(atlas.stages.length - 1, lower + 1);
    const blend = smoothstep(stagePosition - lower);
    const aperture = apertureFor(charDef);
    const visualScale = characterVisualScale(charDef);
    const insertionDepth = Math.max(3, Number(aperture.insertionDepth || 7)) * visualScale;
    const paintRoot = { x:geometry.root.x, y:geometry.root.y + insertionDepth };
    const length = Math.max(5, Math.hypot(geometry.tip.x - paintRoot.x, geometry.tip.y - paintRoot.y));
    const nearWidth = Math.max(8, Number(aperture.tongueWidthNear || 13.5)) * visualScale;
    const farWidth = Math.max(6, Number(aperture.tongueWidthFar || 8.8)) * visualScale;
    const width = (nearWidth + (farWidth - nearWidth) * smoothstep(extension)) * (1 + impact * 0.07);

    drawAtlasStage(ctx, atlasImage, atlas, lower, upper === lower ? 1 : 1 - blend, paintRoot, geometry.tip, width, length);
    if (upper !== lower) drawAtlasStage(ctx, atlasImage, atlas, upper, blend, paintRoot, geometry.tip, width, length);
    return true;
  }

  function drawProceduralFallback(ctx, charDef, style, geometry, impact) {
    const palette = palettes[style];
    const aperture = apertureFor(charDef);
    const visualScale = characterVisualScale(charDef);
    const shaftImage = getImage(style, 'shaft');
    const tipImage = getImage(style, 'tip');
    const extension = clamp(geometry.extension, 0, 1);
    const nearWidth = Math.max(7, Number(aperture.tongueWidthNear || 13.5)) * visualScale;
    const farWidth = Math.max(5, Number(aperture.tongueWidthFar || 8.8)) * visualScale;
    const shaftWidth = nearWidth + (farWidth - nearWidth) * smoothstep(extension);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = palette.outline;
    ctx.lineWidth = shaftWidth + 2.4;
    ctx.beginPath();
    ctx.moveTo(geometry.points[0].x, geometry.points[0].y);
    for (let i = 1; i < geometry.points.length; i++) ctx.lineTo(geometry.points[i].x, geometry.points[i].y);
    ctx.stroke();

    let textured = true;
    for (let i = 1; i < geometry.points.length; i++) {
      textured = drawSegmentTexture(ctx, shaftImage, geometry.points[i - 1], geometry.points[i], shaftWidth) && textured;
    }
    if (!textured) {
      ctx.strokeStyle = palette.body;
      ctx.lineWidth = shaftWidth;
      ctx.beginPath();
      ctx.moveTo(geometry.points[0].x, geometry.points[0].y);
      for (let i = 1; i < geometry.points.length; i++) ctx.lineTo(geometry.points[i].x, geometry.points[i].y);
      ctx.stroke();
    }

    const previous = geometry.points[Math.max(0, geometry.points.length - 2)];
    const tipAngle = Math.atan2(geometry.tip.y - previous.y, geometry.tip.x - previous.x) + Math.PI / 2;
    const tipWidth = Math.max(14, shaftWidth * 1.65) * (1 + impact * 0.14);
    const tipHeight = Math.max(17, shaftWidth * 1.95) * (1 - impact * 0.10);
    if (tipImage && tipImage.complete && tipImage.naturalWidth) {
      ctx.save();
      ctx.translate(geometry.tip.x, geometry.tip.y);
      ctx.rotate(tipAngle);
      ctx.drawImage(tipImage, 3, 3, Math.max(1, tipImage.naturalWidth - 6), Math.max(1, tipImage.naturalHeight - 6), -tipWidth / 2, -tipHeight * 0.58, tipWidth, tipHeight);
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.ellipse(geometry.tip.x, geometry.tip.y, tipWidth * 0.38, tipHeight * 0.34, 0, 0, Math.PI * 2);
      ctx.fillStyle = palette.body;
      ctx.fill();
      ctx.strokeStyle = palette.outline;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  function drawTongue(ctx, charDef) {
    const style = styleFor(charDef);
    const geometry = visualGeometry(charDef);
    const impact = clamp(Number(tongue.impact || 0), 0, 1);
    ctx.save();
    if (!drawAuthoredProgression(ctx, charDef, style, geometry, impact)) {
      drawProceduralFallback(ctx, charDef, style, geometry, impact);
    }
    drawCapturedFood(ctx, geometry);
    ctx.restore();
    return geometry;
  }

  function mouthMetrics(charDef) {
    const behavior = typeof getArcadeCharacterBehaviorProfile === 'function'
      ? getArcadeCharacterBehaviorProfile(charDef)
      : null;
    if (behavior?.catchMechanism !== 'tongue-tip') return null;
    if (!tongue.active && Number(tongue.swallowTimer || 0) <= 0) return null;

    const presentation = behavior.presentationContract || {};
    const aperture = presentation.mouthAperture || {};
    const style = styleFor(charDef);
    const extension = typeof getTongueExtensionRatio === 'function' ? getTongueExtensionRatio(charDef) : 0;
    const swallow = clamp(Number(tongue.swallowTimer || 0) / 0.14, 0, 1);
    const open = tongue.active ? clamp(0.42 + extension * 0.58, 0, 1) : swallow * 0.58;
    const geometry = visualGeometry(charDef);
    const visualScale = characterVisualScale(charDef);
    const transform = bodyTransform(charDef);
    const width = Math.max(16, Number(aperture.width || 30))
      * visualScale * Number(transform.scaleX || 1);
    const height = Math.max(3, Number(aperture.maxHeight || 7))
      * open * visualScale * Number(transform.scaleY || 1);
    return {
      style,
      palette: palettes[style],
      aperture,
      mode: String(aperture.mode || 'authored-body'),
      open,
      width,
      height,
      x: Number(geometry.root?.x || tongue.x || frog.x) + Number(aperture.xOffset || 0) * visualScale,
      y: Number(geometry.root?.y || tongue.y || frog.y - 10) + Number(aperture.yOffset || 0) * visualScale,
      visualScale,
    };
  }

  function drawMouthCavity(ctx, charDef) {
    const metrics = mouthMetrics(charDef);
    if (!metrics) return false;
    const { x, y, width, height, open, aperture, mode } = metrics;

    // Curated action frames and Ocean's clean mouth-open frame already contain
    // the mouth interior. Drawing another cavity created the rejected black
    // circle. Only characters without authored mouth art receive this shallow
    // smile-shaped aperture.
    if (mode === 'authored-body' || mode === 'authored-ocean') return false;

    const halfW = width / 2;
    const halfH = Math.max(1.2, height / 2);
    ctx.save();
    ctx.globalAlpha *= clamp(open * 1.12, 0, 1);
    const fill = ctx.createLinearGradient(x, y - halfH, x, y + halfH);
    fill.addColorStop(0, String(aperture.interiorColor || '#32131f'));
    fill.addColorStop(1, String(aperture.edgeColor || 'rgba(54,12,28,0.88)'));
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(x - halfW, y);
    ctx.quadraticCurveTo(x, y - halfH * 0.86, x + halfW, y);
    ctx.quadraticCurveTo(x, y + halfH * 1.12, x - halfW, y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    return true;
  }

  function drawMouthOverlay(ctx, charDef) {
    const metrics = mouthMetrics(charDef);
    if (!metrics) return false;
    const { x, y, width, height, open, aperture, mode, visualScale } = metrics;
    const lipDepth = Math.max(1.5, Number(aperture.lowerLipDepth || 3.2) * visualScale);
    const tongueNearWidth = Math.max(8, Number(aperture.tongueWidthNear || 13.5) * visualScale);
    const occlusionHalfW = Math.max(tongueNearWidth * 0.72, width * (mode === 'under-mask' ? 0.34 : 0.29));
    const insertionDepth = Math.max(3, Number(aperture.insertionDepth || 7) * visualScale);
    const lipY = y + insertionDepth - lipDepth * 0.82;

    ctx.save();
    ctx.globalAlpha *= clamp(open * 1.25, 0, 1);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // A compact foreground lip patch hides the flat base of the authored
    // tongue. It is deliberately much narrower than the smile, so it reads as
    // the tongue passing behind the lip rather than as a new mouth object.
    ctx.fillStyle = String(aperture.lowerLipColor || '#e7d557');
    ctx.beginPath();
    ctx.moveTo(x - occlusionHalfW, lipY);
    ctx.quadraticCurveTo(x, lipY + lipDepth * 1.08, x + occlusionHalfW, lipY);
    ctx.quadraticCurveTo(x, lipY + lipDepth * 0.28, x - occlusionHalfW, lipY);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = String(aperture.edgeColor || 'rgba(54,12,28,0.82)');
    ctx.lineWidth = Math.max(0.8, 1.15 * visualScale);
    ctx.beginPath();
    ctx.moveTo(x - occlusionHalfW, lipY);
    ctx.quadraticCurveTo(x, lipY + lipDepth * 1.08, x + occlusionHalfW, lipY);
    ctx.stroke();

    const highlight = String(aperture.lowerLipHighlight || 'rgba(255,245,160,0.36)');
    if (highlight && highlight !== 'transparent') {
      ctx.globalAlpha *= 0.62;
      ctx.strokeStyle = highlight;
      ctx.lineWidth = Math.max(0.55, 0.72 * visualScale);
      ctx.beginPath();
      ctx.moveTo(x - occlusionHalfW * 0.70, lipY + lipDepth * 0.34);
      ctx.quadraticCurveTo(x, lipY + lipDepth * 0.69, x + occlusionHalfW * 0.70, lipY + lipDepth * 0.34);
      ctx.stroke();
    }

    // Overlay-only characters need a subtle upper edge to connect the slit to
    // the existing smile/mask. Authored mouth frames already provide this edge.
    if (mode === 'overlay-slit' || mode === 'under-mask') {
      ctx.globalAlpha = clamp(open * 0.92, 0, 0.92);
      ctx.strokeStyle = String(aperture.edgeColor || 'rgba(54,12,28,0.82)');
      ctx.lineWidth = Math.max(0.8, 1.05 * visualScale);
      ctx.beginPath();
      ctx.moveTo(x - width * 0.43, y - height * 0.02);
      ctx.quadraticCurveTo(x, y - height * 0.44, x + width * 0.43, y - height * 0.02);
      ctx.stroke();
    }

    ctx.restore();
    return true;
  }

  function bodyTransform(charDef) {
    const behavior = typeof getArcadeCharacterBehaviorProfile === 'function'
      ? getArcadeCharacterBehaviorProfile(charDef)
      : null;
    if (behavior?.catchMechanism !== 'tongue-tip') return { scaleX:1, scaleY:1, offsetY:0 };
    const allowBodyScalePulse = behavior?.presentationContract?.allowBodyScalePulse !== false;
    const reduceMotion = typeof SETTINGS !== 'undefined' && SETTINGS.reduceMotion;
    const strength = reduceMotion ? 0.35 : 1;
    const extension = typeof getTongueExtensionRatio === 'function' ? getTongueExtensionRatio(charDef) : 0;
    const initialCompression = tongue.active && !tongue.catching ? clamp(1 - extension * 4, 0, 1) : 0;
    const impact = clamp(Number(tongue.impact || 0), 0, 1);
    const swallow = clamp(Number(tongue.swallowTimer || 0) / 0.14, 0, 1);
    return {
      scaleX: allowBodyScalePulse ? 1 + strength * (initialCompression * 0.025 + impact * 0.012 + swallow * 0.008) : 1,
      scaleY: allowBodyScalePulse ? 1 - strength * (initialCompression * 0.022 - impact * 0.006 + swallow * 0.005) : 1,
      offsetY: strength * (initialCompression * 1.4 - impact * 0.8 + swallow * 0.45),
    };
  }

  function preload(charDef) {
    const style = styleFor(charDef);
    return Promise.allSettled(['stages', 'shaft', 'tip'].map(part => {
      const img = getImage(style, part);
      return img && typeof img.decode === 'function' ? img.decode().catch(() => undefined) : Promise.resolve();
    }));
  }

  if (typeof EventBus !== 'undefined') EventBus.on('gameStarted', () => preload(typeof getCharDef === 'function' ? getCharDef() : null));

  return Object.freeze({ drawTongue, drawMouthCavity, drawMouthOverlay, bodyTransform, preload, styleFor, visualGeometry });
})();

function drawTongueMouthCavity(charDef) {
  return TongueRigPresentation.drawMouthCavity(ctx, charDef);
}

function drawTongueMouthOverlay(charDef) {
  return TongueRigPresentation.drawMouthOverlay(ctx, charDef);
}

function drawTongue() {
  if (!tongue.active) return;
  const charDef = getCharDef();
  const behavior = typeof getArcadeCharacterBehaviorProfile === 'function'
    ? getArcadeCharacterBehaviorProfile(charDef)
    : null;
  const catchMechanism = behavior?.catchMechanism || 'tongue-tip';
  const presentationConfig = GAME_BALANCE.arcadePresentation || {};
  const sizeClass = behavior?.presentationContract?.sizeClass || 'standard';
  const sizeClassMultipliers = presentationConfig.characterSizeClassMultipliers || {};
  const characterVisualScale = Math.max(0.1,
    Number(presentationConfig.characterBaseScale || 1) * Number(sizeClassMultipliers[sizeClass] || 1));
  // Keep gameplay physics at tongue.y while aligning the painted root to the
  // visually scaled character mouth.
  const visualTongueStartY = frog.y - (frog.y - tongue.y) * characterVisualScale;
  const wobble = Math.sin(RuntimeState.tongueWobble) * 3;
  ctx.save();
  if (charDef?.id === 'toadal') {
    // Toadal uses the authored short tongue body strip plus a compact matching
    // extension.  Do not fall through to the Classic 320px tongue rig: the
    // source manifest explicitly defines this as a short upward catch.
    const extension = typeof getTongueExtensionRatio === 'function'
      ? Math.max(0, Math.min(1, Number(getTongueExtensionRatio(charDef)) || 0))
      : 0;
    const rootY = visualTongueStartY - 12;
    const tipX = tongue.x + wobble * extension * 0.22;
    const tipY = tongue.tip;
    const width = 7.5 + extension * 1.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#f25772';
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(tongue.x, rootY);
    ctx.quadraticCurveTo(tongue.x + wobble * 0.25, (rootY + tipY) * 0.5, tipX, tipY);
    ctx.stroke();
    ctx.fillStyle = '#ff7890';
    ctx.beginPath();
    ctx.ellipse(tipX, tipY, 7.5, 5.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8b2841';
    ctx.lineWidth = 1.35;
    ctx.stroke();
    if (GAME_BALANCE.showHitboxes) {
      ctx.beginPath();
      ctx.arc(tipX, tipY, CONFIG.FOOD_H / 2, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.setLineDash([3,2]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
    return;
  }
  if (catchMechanism === 'hippo-lunge-rect') { ctx.restore(); return; }
  if (catchMechanism === 'hooked-tongue') {
    ctx.lineWidth=5; ctx.strokeStyle='#ff6b8f'; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(tongue.x,visualTongueStartY-10);
    const midY=(visualTongueStartY+tongue.tip)/2, hookX=tongue.x+10+wobble*2.2;
    ctx.quadraticCurveTo(tongue.x+wobble*1.7,midY,hookX,tongue.tip); ctx.stroke();
    ctx.strokeStyle='#ffd37a'; ctx.lineWidth=2.5;
    ctx.beginPath(); ctx.arc(hookX-2,tongue.tip,7,-0.6,1.8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(hookX-1,tongue.tip+6); ctx.lineTo(hookX+5,tongue.tip+2); ctx.stroke();
    ctx.restore(); return;
  }
  if (catchMechanism === 'gully-pouch-circle') {
    ctx.lineWidth=12; ctx.strokeStyle='#f4d7a1'; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(tongue.x,visualTongueStartY-6);
    const mid=(visualTongueStartY+tongue.tip)/2;
    ctx.quadraticCurveTo(tongue.x+wobble*0.6,mid,tongue.x+wobble*0.2,tongue.tip); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(tongue.x+wobble*0.2,tongue.tip,18,10,0,0,Math.PI*2);
    ctx.fillStyle='rgba(247,230,191,0.88)'; ctx.fill(); ctx.strokeStyle='#d6a65b'; ctx.lineWidth=2; ctx.stroke();
    ctx.restore(); return;
  }
  if (catchMechanism === 'flytrap-snap-circle') {
    ctx.lineWidth=5; ctx.strokeStyle='#52b85f'; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(tongue.x,visualTongueStartY-8);
    const mid=(visualTongueStartY+tongue.tip)/2;
    ctx.quadraticCurveTo(tongue.x+wobble*0.4,mid,tongue.x,tongue.tip); ctx.stroke();
    const snap=0.5+0.2*Math.sin(RuntimeState.tongueWobble*1.8);
    ctx.save(); ctx.translate(tongue.x,tongue.tip); ctx.rotate(-snap);
    ctx.fillStyle='#39a85a'; ctx.beginPath(); ctx.ellipse(-6,0,10,6,0,0,Math.PI*2); ctx.fill(); ctx.restore();
    ctx.save(); ctx.translate(tongue.x,tongue.tip); ctx.rotate(snap);
    ctx.fillStyle='#6fdc6f'; ctx.beginPath(); ctx.ellipse(6,0,10,6,0,0,Math.PI*2); ctx.fill(); ctx.restore();
    ctx.restore(); return;
  }

  const geometry = TongueRigPresentation.drawTongue(ctx, charDef);

  if (GAME_BALANCE.showHitboxes) {
    const points = geometry?.points || [
      { x:tongue.x, y:tongue.y },
      { x:tongue.x, y:(tongue.tip + tongue.y) * 0.5 },
      { x:tongue.x, y:tongue.tip },
    ];
    points.forEach((point, index) => {
      ctx.beginPath(); ctx.arc(point.x, point.y, index === points.length - 1 ? 5 : 3.5, 0, Math.PI*2);
      ctx.fillStyle = index === points.length - 1 ? 'rgba(0,255,255,0.9)' : 'rgba(0,200,255,0.45)';
      ctx.fill();
      ctx.strokeStyle = 'white'; ctx.lineWidth = 1; ctx.stroke();
    });
    const tip = geometry?.tip || { x:tongue.x, y:tongue.tip };
    ctx.beginPath(); ctx.arc(tip.x, tip.y, CONFIG.FOOD_H / 2, 0, Math.PI*2);
    ctx.strokeStyle = 'rgba(0,255,255,0.5)'; ctx.lineWidth = 1.5; ctx.setLineDash([3,2]);
    ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.restore();
}
