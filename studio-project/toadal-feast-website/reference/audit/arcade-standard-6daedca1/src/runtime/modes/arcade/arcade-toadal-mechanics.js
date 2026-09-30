'use strict';

// Toadal-specific Arcade mechanics.
// Standard Arcade remains authoritative for spawning, generic entity outcomes,
// scoring hooks, lives, wave progression, pause, saves, and run lifecycle.
const ArcadeToadalMechanics = (() => {
  const RULES = Object.freeze({
    maxCharge: 100,
    directFoodCharge: 12,
    airborneFoodBonus: 4,
    throwCost: 45,
    blockCost: 100,
    throwDuration: 0.34,
    throwCommitSeconds: 0.34 * (5 / 8),
    buildDuration: 0.46,
    buildCommitSeconds: 0.46 * (4 / 8),
    projectileSpeed: 760,
    projectileRadius: 11,
    // Charged Royal Hop: hold Down/S (or the mobile stick down) while grounded,
    // then release.  The former fixed 480 px/s Hop now lives inside this curve.
    hopSpeed: 480, // retained as the historical nominal value for diagnostics/compatibility
    hopMinSpeed: 400,
    hopMaxSpeed: 660,
    hopFullChargeSeconds: 0.90,
    crouchMoveScale: 0.28,
    // Toadal's active tongue is intentionally a short reach tool rather than a
    // replacement for his body-contact Golden Charge loop.
    tongueReach: 82,
    tongueSpeed: 480,
    gravity: 1650,
    blockWidth: 58,
    blockHeight: 58,
    maxBlocks: 8,
    blockScoreFactor: 0.5,
    blockBreakBonus: 10,
    protectedTopY: 118,
    buildForwardOffset: 72,
    columnSnapDistance: 34,
  });

  const BLOCK_IMAGE_SRC = 'assets/images/characters/toadal-arcade/effects/golden_block_world.png';
  const PROJECTILE_IMAGE_SRC = 'assets/images/characters/toadal-arcade/effects/golden_projectile_cube.png';
  let blockImage = null;
  let projectileImage = null;
  let entityIds = new WeakMap();
  let nextEntityId = 1;
  let lastBuildReadinessKey = '';
  let qa = null;

  function freshDiagnostics() {
    return {
      elapsedSeconds:0, elevatedSeconds:0, stationaryElevatedSeconds:0, horizontalDistance:0, lastX:null,
      directFoodCatches:0, airborneDirectFoodCatches:0, tongueFoodCatches:0, throwFoodCatches:0, blockFoodCatches:0,
      chargedHops:0, fullChargeHops:0, lastHopChargeRatio:0, lastHopSpeed:0,
      throwChargeSpent:0, blockChargeSpent:0,
    };
  }
  qa = freshDiagnostics();

  function characterId() {
    try { return String(getCharDef()?.id || ''); } catch (_) { return ''; }
  }
  function active() {
    return characterId() === 'toadal'
      && typeof GameState !== 'undefined'
      && GameState.mode === GAME_MODES.PLAYING;
  }
  function state() {
    return typeof GameState !== 'undefined' ? GameState.charState?.toadal || null : null;
  }
  function groundSurfaceY() { return Number(CONFIG.CANVAS_H || 800) - 50; }
  function groundFrogY() { return Number(CONFIG.CANVAS_H || 800) - 80; }
  function supportOffsetY() { return groundSurfaceY() - groundFrogY(); }
  function blockSupportY(block) { return Number(block.y) - supportOffsetY(); }
  function entityId(entity) {
    if (!entity || typeof entity !== 'object') return 0;
    if (!entityIds.has(entity)) entityIds.set(entity, nextEntityId++);
    return entityIds.get(entity);
  }
  function isHazard(food) {
    return Boolean(food?.isBomb || food?.isHazard || food?.isSun);
  }
  function isHeart(food) {
    return Boolean(food?.isHeart || food?.isBlueHeart);
  }
  function isNormalFood(food) {
    return Boolean(food)
      && !isHazard(food)
      && !isHeart(food)
      && !food.isSyringe
      && !food.isPowerUp
      && !food.isGiftBox;
  }
  function isPositiveSpecial(food) {
    return Boolean(food) && !isHazard(food) && !isNormalFood(food);
  }
  function clampCharge(value) {
    return Math.max(0, Math.min(RULES.maxCharge, Math.round(Number(value) || 0)));
  }
  function emit(name, payload = {}) {
    try { EventBus?.emit?.(name, payload); } catch (_) {}
  }
  function feedback(label, color = '#ffe16b', x = null, y = null) {
    try {
      FXManager?.spawnFloatingText?.(
        entities,
        Number.isFinite(Number(x)) ? Number(x) : frog.x,
        Number.isFinite(Number(y)) ? Number(y) : frog.y - 92,
        label,
        color,
      );
    } catch (_) {}
  }
  function denied(label) {
    feedback(label, '#c9d0d8');
    try { if (navigator?.vibrate) navigator.vibrate(8); } catch (_) {}
    emit('toadalActionDenied', { label, charge: state()?.charge || 0 });
  }
  function clearAction(action) {
    if (!action) return;
    action.active = false;
    action.elapsed = 0;
    action.committed = false;
    action.reservedCharge = 0;
  }
  function addCharge(amount, reason = 'direct-food') {
    const s = state();
    if (!s) return 0;
    const before = clampCharge(s.charge);
    s.charge = clampCharge(before + Number(amount || 0));
    if (s.charge !== before) {
      emit('toadalChargeChanged', { before, charge: s.charge, delta: s.charge - before, reason });
    }
    if (before < RULES.maxCharge && s.charge >= RULES.maxCharge) {
      feedback('GOLDEN CHARGE FULL', '#ffe66d');
      emit('toadalChargeFull', { charge: s.charge });
    }
    return s.charge;
  }
  function spendCharge(amount, reason) {
    const s = state();
    if (!s) return false;
    const cost = Math.max(0, Number(amount) || 0);
    if (Number(s.charge || 0) < cost) return false;
    const before = Number(s.charge || 0);
    s.charge = clampCharge(before - cost);
    if (reason === 'golden-throw') qa.throwChargeSpent += cost;
    if (reason === 'golden-block') qa.blockChargeSpent += cost;
    emit('toadalChargeChanged', { before, charge: s.charge, delta: s.charge - before, reason });
    return true;
  }
  function reset() {
    const s = state();
    if (!s) return false;
    Object.assign(s, {
      charge: 0,
      grounded: true,
      supportBlockId: null,
      velocityY: 0,
      hopActive: false,
      crouchInputHeld: false,
      crouchHeld: false,
      crouchChargeSeconds: 0,
      crouchChargeRatio: 0,
      lastHopChargeRatio: 0,
      lastHopSpeed: 0,
      pendingTongueSwallow: false,
      eatAnimTimer: 0,
      hurtAnimTimer: 0,
      projectiles: [],
      blocks: [],
      nextOwnedEntityId: 1,
      lastCatchSource: '',
      lastBlockOutcome: '',
      throwAction: { active: false, elapsed: 0, committed: false, reservedCharge: 0 },
      buildAction: { active: false, elapsed: 0, committed: false, reservedCharge: 0 },
    });
    entityIds = new WeakMap();
    nextEntityId = 1;
    lastBuildReadinessKey = '';
    qa = freshDiagnostics();
    qa.lastX = Number(frog.x || 0);
    return true;
  }

  // Direct physical eating is the only source of Golden Charge.
  function onDirectContact(food) {
    const s = state();
    if (!s || !isNormalFood(food)) return false;
    const amount = RULES.directFoodCharge + (s.grounded ? 0 : RULES.airborneFoodBonus);
    addCharge(amount, s.grounded ? 'direct-food' : 'airborne-food');
    s.eatAnimTimer = Math.max(Number(s.eatAnimTimer || 0), 0.30);
    s.lastCatchSource = 'toadal-direct';
    qa.directFoodCatches += 1;
    if (!s.grounded) qa.airborneDirectFoodCatches += 1;
    if (!s.grounded && RULES.airborneFoodBonus > 0) {
      feedback(`AIR +${RULES.airborneFoodBonus}`, '#ffe985');
    }
    return true;
  }

  // One authoritative direct-catch transaction is shared by the ordinary
  // passive overlap path, swept-contact recovery, and magnet/vacuum arrivals.
  function handleDirectCatch(food, charDef = getCharDef()) {
    const normal = isNormalFood(food);
    onDirectContact(food);
    handleFoodCaught(food, charDef, {
      catchSource: 'toadal-direct',
      playEatReaction: normal,
    });
    return true;
  }

  // Tongue catches deliberately do NOT grant Golden Charge.  They are a safer
  // reach option; body contact remains the only way to fuel Throw/Block.
  function onTongueCatch(food) {
    const s = state();
    if (!s) return false;
    s.lastCatchSource = 'toadal-tongue';
    if (isNormalFood(food)) {
      qa.tongueFoodCatches += 1;
      // The authored source manifest says swallow follows an accepted tongue
      // catch. Defer it until retraction finishes so the full swallow strip is
      // visible instead of spending its timer behind the tongue animation.
      s.pendingTongueSwallow = true;
    }
    emit('toadalTongueCatch', { itemId:String(food?.itemId || ''), charge:Number(s.charge || 0) });
    return true;
  }
  function onTongueRetracted() {
    const s = state();
    if (!s?.pendingTongueSwallow) return false;
    s.pendingTongueSwallow = false;
    s.eatAnimTimer = Math.max(Number(s.eatAnimTimer || 0), 0.30);
    emit('toadalTongueSwallowStarted', { duration:0.30 });
    return true;
  }

  function directCatchGeometry(charDef) {
    let shape = null;
    try {
      shape = typeof getActiveArcadeBehaviorProfile === 'function'
        ? getActiveArcadeBehaviorProfile(charDef)?.collisionShape
        : null;
    } catch (_) {}
    const radiusStat = String(shape?.radiusStat || 'catchRadius');
    const radius = Number(charDef?.stats?.[radiusStat] || charDef?.stats?.catchRadius || 38);
    const centerYOffset = Number.isFinite(Number(shape?.centerYOffset)) ? Number(shape.centerYOffset) : -46;
    return { x:Number(frog.x || 0), y:Number(frog.y || 0) + centerYOffset, radius };
  }

  function segmentCircleImpactT(x0, y0, x1, y1, cx, cy, radius) {
    const dx = x1 - x0, dy = y1 - y0;
    const fx = x0 - cx, fy = y0 - cy;
    const rr = radius * radius;
    if (fx * fx + fy * fy <= rr) return 0;
    const a = dx * dx + dy * dy;
    if (a <= 1e-9) return null;
    const b = 2 * (fx * dx + fy * dy);
    const c = fx * fx + fy * fy - rr;
    const disc = b * b - 4 * a * c;
    if (disc < 0) return null;
    const root = Math.sqrt(disc);
    const t0 = (-b - root) / (2 * a);
    const t1 = (-b + root) / (2 * a);
    if (t0 >= 0 && t0 <= 1) return t0;
    if (t1 >= 0 && t1 <= 1) return t1;
    return null;
  }

  function directImpactT(food, charDef) {
    const geometry = directCatchGeometry(charDef);
    const x0 = Number.isFinite(Number(food.__toadalPrevX)) ? Number(food.__toadalPrevX) : Number(food.x);
    const y0 = Number.isFinite(Number(food.__toadalPrevY)) ? Number(food.__toadalPrevY) : Number(food.y);
    return segmentCircleImpactT(
      x0, y0, Number(food.x), Number(food.y),
      geometry.x, geometry.y, geometry.radius,
    );
  }

  function blockById(id) {
    return state()?.blocks?.find(block => block.id === id) || null;
  }
  function playerOverlapsBlockX(block) {
    return Math.abs(Number(frog.x || 0) - (Number(block.x) + Number(block.w) / 2))
      <= Number(block.w) / 2 + 18;
  }
  function refreshGroundSupport() {
    const s = state();
    if (!s || s.supportBlockId == null) return;
    const support = blockById(s.supportBlockId);
    if (!support || !playerOverlapsBlockX(support)) {
      s.supportBlockId = null;
      s.grounded = false;
      s.hopActive = true;
      s.velocityY = Math.max(0, Number(s.velocityY || 0));
    } else if (s.grounded) {
      frog.y = blockSupportY(support);
    }
  }
  function smoothHopRatio(value) {
    const t = Math.max(0, Math.min(1, Number(value) || 0));
    return t * t * (3 - 2 * t);
  }
  function hopSpeedForRatio(value) {
    return RULES.hopMinSpeed + (RULES.hopMaxSpeed - RULES.hopMinSpeed) * smoothHopRatio(value);
  }
  function hopRatioForSpeed(speed) {
    const target = Math.max(RULES.hopMinSpeed, Math.min(RULES.hopMaxSpeed, Number(speed) || RULES.hopMinSpeed));
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) * 0.5;
      if (hopSpeedForRatio(mid) < target) lo = mid;
      else hi = mid;
    }
    return (lo + hi) * 0.5;
  }
  function cancelCrouch(reason = 'cancelled') {
    const s = state();
    if (!s) return false;
    const wasHeld = Boolean(s.crouchHeld || s.crouchInputHeld || Number(s.crouchChargeSeconds || 0) > 0);
    s.crouchInputHeld = false;
    s.crouchHeld = false;
    s.crouchChargeSeconds = 0;
    s.crouchChargeRatio = 0;
    if (wasHeld) emit('toadalCrouchCancelled', { reason });
    return wasHeld;
  }
  function beginCrouch() {
    if (!active()) return false;
    const s = state();
    if (!s?.grounded || Number(s.hurtAnimTimer || 0) > 0 || s.throwAction?.active || s.buildAction?.active) return false;
    s.crouchInputHeld = true;
    if (!s.crouchHeld) {
      s.crouchHeld = true;
      s.crouchChargeSeconds = 0;
      s.crouchChargeRatio = 0;
      emit('toadalCrouchStarted', { x:frog.x, y:frog.y });
    }
    return true;
  }
  function releaseChargedHop() {
    if (!active()) return false;
    const s = state();
    if (!s?.crouchHeld) return false;
    s.crouchInputHeld = false;
    if (!s.grounded || Number(s.hurtAnimTimer || 0) > 0) {
      cancelCrouch('airborne-or-hurt');
      return false;
    }
    const ratio = Math.max(0, Math.min(1, Number(s.crouchChargeRatio || 0)));
    const speed = hopSpeedForRatio(ratio);
    s.crouchHeld = false;
    s.crouchChargeSeconds = 0;
    s.crouchChargeRatio = 0;
    s.lastHopChargeRatio = ratio;
    s.lastHopSpeed = speed;
    s.grounded = false;
    s.supportBlockId = null;
    s.hopActive = true;
    s.velocityY = -speed;
    qa.chargedHops += 1;
    if (ratio >= 0.999) qa.fullChargeHops += 1;
    qa.lastHopChargeRatio = ratio;
    qa.lastHopSpeed = speed;
    emit('toadalChargedHopStarted', { x:frog.x, y:frog.y, chargeRatio:ratio, speed });
    // Compatibility event name for telemetry/listeners that previously watched
    // the fixed Royal Hop without owning its input binding.
    emit('toadalHopStarted', { x:frog.x, y:frog.y, chargeRatio:ratio, speed, charged:true });
    return true;
  }
  function setCrouchInput(held) {
    if (!active()) return false;
    const s = state();
    if (!s) return false;
    const next = Boolean(held);
    if (next === Boolean(s.crouchInputHeld) && (!next || s.crouchHeld)) return next;
    if (next) return beginCrouch();
    s.crouchInputHeld = false;
    return s.crouchHeld ? releaseChargedHop() : false;
  }
  function requestHop() {
    // Backward-compatible programmatic helper only. Player input no longer calls
    // this directly; preserve the historical 480 px/s Hop exactly on the new curve.
    if (!active()) return false;
    const nominalRatio = hopRatioForSpeed(RULES.hopSpeed);
    const s = state();
    if (!s?.grounded || s.throwAction?.active || s.buildAction?.active) return false;
    s.crouchHeld = true;
    s.crouchChargeRatio = nominalRatio;
    s.crouchChargeSeconds = s.crouchChargeRatio * RULES.hopFullChargeSeconds;
    return releaseChargedHop();
  }
  function findLanding(prevY, nextY) {
    const s = state();
    if (!s || nextY < prevY) return null;
    const candidates = [];
    for (const block of s.blocks) {
      if (!playerOverlapsBlockX(block)) continue;
      const supportY = blockSupportY(block);
      if (prevY <= supportY + 0.01 && nextY >= supportY - 0.01) {
        const denom = nextY - prevY;
        const t = denom > 0.00001 ? Math.max(0, Math.min(1, (supportY - prevY) / denom)) : 0;
        candidates.push({ t, block, supportY });
      }
    }
    candidates.sort((a, b) => a.t - b.t || a.block.id - b.block.id);
    return candidates[0] || null;
  }
  function updateMovement(dt) {
    if (!active()) return;
    const s = state();
    if (!s) return;
    refreshGroundSupport();
    const safeDt = Math.max(0, Math.min(0.05, Number(dt) || 0));
    if (!s.grounded && s.crouchHeld) cancelCrouch('left-support');
    if (s.grounded && s.crouchHeld) {
      s.crouchChargeSeconds = Math.min(RULES.hopFullChargeSeconds, Number(s.crouchChargeSeconds || 0) + safeDt);
      s.crouchChargeRatio = Math.max(0, Math.min(1, s.crouchChargeSeconds / Math.max(0.001, RULES.hopFullChargeSeconds)));
    }
    const currentX = Number(frog.x || 0);
    const priorX = Number.isFinite(Number(qa.lastX)) ? Number(qa.lastX) : currentX;
    const moved = Math.abs(currentX - priorX);
    qa.elapsedSeconds += safeDt;
    qa.horizontalDistance += moved;
    if (s.supportBlockId != null && s.grounded) {
      qa.elevatedSeconds += safeDt;
      if (moved < 0.35) qa.stationaryElevatedSeconds += safeDt;
    }
    qa.lastX = currentX;
    if (s.grounded) return;
    const prevY = Number(frog.y || groundFrogY());
    s.velocityY = Number(s.velocityY || 0) + RULES.gravity * safeDt;
    let nextY = prevY + s.velocityY * safeDt;
    if (s.velocityY >= 0) {
      const landing = findLanding(prevY, nextY);
      if (landing) {
        frog.y = landing.supportY;
        s.velocityY = 0;
        s.grounded = true;
        s.hopActive = false;
        s.supportBlockId = landing.block.id;
        emit('toadalLanded', { support: 'block', blockId: landing.block.id, y: frog.y });
        return;
      }
      const floorY = groundFrogY();
      if (nextY >= floorY) {
        nextY = floorY;
        s.velocityY = 0;
        s.grounded = true;
        s.hopActive = false;
        s.supportBlockId = null;
        emit('toadalLanded', { support: 'ground', y: nextY });
      }
    }
    frog.y = nextY;
  }

  function placementCandidate() {
    const s = state();
    if (!s) return { ok: false, reason: 'NO STATE' };
    if (!s.grounded) return { ok: false, reason: 'GROUND ONLY' };
    if (s.blocks.length >= RULES.maxBlocks) return { ok: false, reason: 'MAX BLOCKS' };

    const w = RULES.blockWidth;
    const h = RULES.blockHeight;
    const facing = Number(frog.facing || 1) < 0 ? -1 : 1;
    let centerX = Number(frog.x || CONFIG.CANVAS_W / 2) + facing * RULES.buildForwardOffset;
    centerX = Math.max(w / 2 + 6, Math.min(Number(CONFIG.CANVAS_W || 480) - w / 2 - 6, centerX));

    const nearby = s.blocks
      .filter(block => Math.abs((block.x + block.w / 2) - centerX) <= RULES.columnSnapDistance)
      .sort((a, b) => a.y - b.y || a.id - b.id);

    if (nearby.length) centerX = nearby[0].x + nearby[0].w / 2;
    const y = nearby.length ? Math.min(...nearby.map(block => block.y)) - h : groundSurfaceY() - h;
    const x = centerX - w / 2;
    if (y < RULES.protectedTopY) return { ok: false, reason: 'TOO HIGH' };

    const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    const candidate = { x, y, w, h };
    const playerRect = { x: Number(frog.x) - 24, y: Number(frog.y) - 74, w: 48, h: 92 };
    if (overlap(candidate, playerRect)) return { ok: false, reason: 'NO ROOM' };
    for (const block of s.blocks) {
      const exactlyStacked = Math.abs(block.x - x) < 1 && Math.abs((block.y - h) - y) < 1;
      if (!exactlyStacked && overlap(candidate, block)) return { ok: false, reason: 'BLOCKED' };
    }
    return { ok: true, x, y, w, h };
  }

  function requestThrow() {
    if (!active()) return false;
    const s = state();
    if (!s || Number(s.hurtAnimTimer || 0) > 0 || s.crouchHeld || s.throwAction.active || s.buildAction.active) {
      if (s?.crouchHeld) denied('CHARGING HOP');
      return false;
    }
    if (Number(s.charge || 0) < RULES.throwCost) {
      denied(`${RULES.throwCost} CHARGE`);
      return false;
    }
    Object.assign(s.throwAction, { active: true, elapsed: 0, committed: false, reservedCharge: RULES.throwCost });
    emit('toadalThrowStarted', { charge: s.charge });
    return true;
  }
  function requestBuild() {
    if (!active()) return false;
    const s = state();
    if (!s || Number(s.hurtAnimTimer || 0) > 0 || s.crouchHeld || s.throwAction.active || s.buildAction.active) {
      if (s?.crouchHeld) denied('CHARGING HOP');
      return false;
    }
    if (Number(s.charge || 0) < RULES.blockCost) {
      denied(`${RULES.blockCost} CHARGE`);
      return false;
    }
    const placement = placementCandidate();
    if (!placement.ok) {
      denied(placement.reason);
      return false;
    }
    Object.assign(s.buildAction, { active: true, elapsed: 0, committed: false, reservedCharge: RULES.blockCost });
    emit('toadalBuildStarted', { charge: s.charge, placement });
    return true;
  }
  function spawnProjectile() {
    const s = state();
    if (!s) return null;
    const projectile = {
      id: s.nextOwnedEntityId++,
      x: Number(frog.x || 0),
      y: Number(frog.y || 0) - 66,
      prevY: Number(frog.y || 0) - 66,
      radius: RULES.projectileRadius,
      active: true,
    };
    s.projectiles.push(projectile);
    emit('toadalGoldenThrowReleased', { projectileId: projectile.id, x: projectile.x, y: projectile.y });
    return projectile;
  }
  function commitBuild() {
    const s = state();
    const placement = placementCandidate();
    if (!s || !placement.ok) return false;
    if (!spendCharge(s.buildAction.reservedCharge, 'golden-block')) return false;
    const block = {
      id: s.nextOwnedEntityId++,
      x: placement.x,
      y: placement.y,
      w: placement.w,
      h: placement.h,
    };
    s.blocks.push(block);
    emit('toadalBlockCreated', { blockId: block.id, x: block.x, y: block.y, blockCount: s.blocks.length });
    return true;
  }
  function updateBuildReadiness() {
    const s = state();
    if (!s) return;
    const placement = placementCandidate();
    const key = `${Boolean(placement.ok)}:${String(placement.reason || '')}:${Number(s.blocks.length)}`;
    if (key === lastBuildReadinessKey) return;
    lastBuildReadinessKey = key;
    emit('toadalBuildReadinessChanged', { ok:Boolean(placement.ok), reason:String(placement.reason || ''), blockCount:s.blocks.length });
  }

  function updateActions(dt) {
    if (!active()) return;
    const s = state();
    if (!s) return;
    const safeDt = Math.max(0, Math.min(0.05, Number(dt) || 0));
    s.eatAnimTimer = Math.max(0, Number(s.eatAnimTimer || 0) - safeDt);
    s.hurtAnimTimer = Math.max(0, Number(s.hurtAnimTimer || 0) - safeDt);

    const throwAction = s.throwAction;
    if (throwAction.active) {
      throwAction.elapsed += safeDt;
      if (!throwAction.committed && throwAction.elapsed >= RULES.throwCommitSeconds) {
        if (spendCharge(throwAction.reservedCharge, 'golden-throw')) {
          throwAction.committed = true;
          throwAction.reservedCharge = 0;
          spawnProjectile();
        } else {
          clearAction(throwAction);
        }
      }
      if (throwAction.active && throwAction.elapsed >= RULES.throwDuration) {
        clearAction(throwAction);
        emit('toadalActionEnded', { action:'throw' });
      }
    }

    const buildAction = s.buildAction;
    if (buildAction.active) {
      buildAction.elapsed += safeDt;
      if (!buildAction.committed && buildAction.elapsed >= RULES.buildCommitSeconds) {
        if (commitBuild()) {
          buildAction.committed = true;
          buildAction.reservedCharge = 0;
        } else {
          clearAction(buildAction);
          denied('BLOCKED');
        }
      }
      if (buildAction.active && buildAction.elapsed >= RULES.buildDuration) {
        clearAction(buildAction);
        emit('toadalActionEnded', { action:'block' });
      }
    }

    // Piercing Golden Throw has no TTL. It dies only at the top of the playfield
    // or when it collides with a canonical hazard.
    for (let index = s.projectiles.length - 1; index >= 0; index--) {
      const projectile = s.projectiles[index];
      projectile.prevY = projectile.y;
      projectile.y -= RULES.projectileSpeed * safeDt;
      if (!projectile.active || projectile.y < -CONFIG.FOOD_H) s.projectiles.splice(index, 1);
    }
    updateBuildReadiness();
  }

  function beforeFoodUpdate() {
    if (!active()) return;
    for (const food of entities.foods) {
      entityId(food);
      food.__toadalPrevX = Number(food.x || 0);
      food.__toadalPrevY = Number(food.y || 0);
    }
  }
  function projectileImpactT(projectile, food) {
    const halfH = Number(CONFIG.FOOD_H || 36) / 2 + Number(projectile.radius || RULES.projectileRadius);
    const p0 = Number(projectile.prevY);
    const p1 = Number(projectile.y);
    const f0 = Number.isFinite(Number(food.__toadalPrevY)) ? Number(food.__toadalPrevY) : Number(food.y);
    const f1 = Number(food.y);
    const d0 = f0 - p0;
    const d1 = f1 - p1;
    const rel = d1 - d0;
    let t = null;
    if (Math.abs(d0) <= halfH) t = 0;
    else if (Math.abs(rel) > 0.000001) {
      const enter = (-halfH - d0) / rel;
      const exit = (halfH - d0) / rel;
      const lo = Math.max(0, Math.min(enter, exit));
      const hi = Math.min(1, Math.max(enter, exit));
      if (lo <= hi) t = lo;
    }
    if (t == null || t < 0 || t > 1) return null;
    const fx0 = Number.isFinite(Number(food.__toadalPrevX)) ? Number(food.__toadalPrevX) : Number(food.x);
    const fx = fx0 + (Number(food.x) - fx0) * t;
    const halfW = Number(CONFIG.FOOD_W || 36) / 2 + Number(projectile.radius || RULES.projectileRadius);
    return Math.abs(fx - Number(projectile.x)) <= halfW ? t : null;
  }
  function exposedBlocks() {
    const s = state();
    if (!s) return [];
    return s.blocks.filter(block => !s.blocks.some(other =>
      other.id !== block.id
      && Math.abs(other.x - block.x) < 1
      && Math.abs((other.y + other.h) - block.y) < 1
    ));
  }
  function blockImpactT(block, food) {
    const halfH = Number(CONFIG.FOOD_H || 36) / 2;
    const prevY = Number.isFinite(Number(food.__toadalPrevY)) ? Number(food.__toadalPrevY) : Number(food.y);
    const currY = Number(food.y);
    const prevBottom = prevY + halfH;
    const currBottom = currY + halfH;
    if (currBottom < prevBottom || prevBottom > block.y || currBottom < block.y) return null;
    const denom = currBottom - prevBottom;
    const t = denom > 0.000001 ? Math.max(0, Math.min(1, (block.y - prevBottom) / denom)) : 0;
    const prevX = Number.isFinite(Number(food.__toadalPrevX)) ? Number(food.__toadalPrevX) : Number(food.x);
    const x = prevX + (Number(food.x) - prevX) * t;
    const halfW = Number(CONFIG.FOOD_W || 36) / 2;
    return x + halfW >= block.x && x - halfW <= block.x + block.w ? t : null;
  }
  function removeFood(food) {
    const index = entities.foods.indexOf(food);
    if (index >= 0) entities.foods.splice(index, 1);
    return index >= 0;
  }
  function removeBlock(block) {
    const s = state();
    if (!s) return false;
    const index = s.blocks.findIndex(item => item.id === block.id);
    if (index < 0) return false;
    s.blocks.splice(index, 1);
    if (s.supportBlockId === block.id) {
      s.supportBlockId = null;
      s.grounded = false;
      s.hopActive = true;
      s.velocityY = Math.max(0, Number(s.velocityY || 0));
    }
    emit('toadalBlockRemoved', { blockId: block.id, blockCount: s.blocks.length });
    return true;
  }

  // Golden Throw collects every positive object it intersects. Normal foods are
  // separate catches, so one shot can advance the combo multiple times. It does
  // not self-fuel Golden Charge. Hearts/power-ups/gifts use canonical outcomes.
  function resolveThrowCollectible(food, charDef, projectile) {
    if (!removeFood(food)) return false;
    const comboBefore = Number(GameState.combo || 0);
    handleFoodCaught(food, charDef, {
      catchSource: 'toadal-golden-throw',
      grantCharacterResource: false,
      playEatReaction: false,
      advanceCombo: true,
      grantFavouriteAffinity: true,
      grantRareFoodBonus: true,
      allowComboScoreModifiers: true,
    });
    const s = state();
    if (s) s.lastCatchSource = 'toadal-golden-throw';
    if (isNormalFood(food)) qa.throwFoodCatches += 1;
    emit('toadalGoldenThrowCatch', {
      projectileId: projectile.id,
      itemId: String(food.itemId || ''),
      normalFood: isNormalFood(food),
      comboBefore,
      comboAfter: Number(GameState.combo || 0),
    });
    return true;
  }
  function neutralizeHazard(food, projectile) {
    if (!removeFood(food)) return false;
    projectile.active = false;
    const hazard = typeof getHazardDef === 'function' ? getHazardDef(food.hazardType) : null;
    try {
      FXManager.spawnParticles(entities, food.x, food.y, '#ffd85a', 16);
      FXManager.spawnParticles(entities, food.x, food.y, hazard?.color || '#ff6666', 8);
      FXManager.spawnFloatingText(entities, food.x, food.y, 'DEFUSED!', '#ffe66d');
      AudioManager.catch();
    } catch (_) {}
    emit('toadalGoldenThrowHazard', {
      projectileId: projectile.id,
      hazardId: String(hazard?.id || food.hazardType || 'hazard'),
    });
    return true;
  }
  function resolveBlockClaim(food, block, charDef) {
    if (!removeFood(food) || !removeBlock(block)) return false;
    const s = state();
    if (!s) return false;
    if (isHazard(food)) {
      s.lastBlockOutcome = 'hazard';
      const hazard = typeof getHazardDef === 'function' ? getHazardDef(food.hazardType) : null;
      try {
        FXManager.spawnParticles(entities, block.x + block.w / 2, block.y + block.h / 2, hazard?.color || '#ff6666', 12);
        FXManager.spawnFloatingText(entities, block.x + block.w / 2, block.y - 10, 'BLOCKED!', '#ffe16b');
      } catch (_) {}
      emit('toadalBlockOutcome', { type: 'hazard', blockId: block.id, hazardId: String(hazard?.id || food.hazardType || 'hazard') });
      return true;
    }

    const normal = isNormalFood(food);
    handleFoodCaught(food, charDef, {
      catchSource: 'toadal-block',
      scoreFactor: normal ? RULES.blockScoreFactor : 1,
      advanceCombo: false,
      grantCharacterResource: false,
      playEatReaction: false,
      grantFavouriteAffinity: false,
      grantRareFoodBonus: false,
      allowComboScoreModifiers: false,
    });
    if (normal) {
      GameState.score += RULES.blockBreakBonus;
      try {
        FXManager.spawnFloatingText(entities, block.x + block.w / 2, block.y - 12, `BLOCK +${RULES.blockBreakBonus}`, '#ffe16b');
      } catch (_) {}
      s.lastBlockOutcome = 'food';
      qa.blockFoodCatches += 1;
      emit('toadalBlockOutcome', { type: 'food', blockId: block.id, bonus: RULES.blockBreakBonus, scoreFactor: RULES.blockScoreFactor });
    } else if (isHeart(food)) {
      s.lastBlockOutcome = 'heart';
      emit('toadalBlockOutcome', { type: 'heart', blockId: block.id });
    }
    return true;
  }
  function afterFoodUpdate() {
    if (!active()) return;
    const s = state();
    if (!s) return;
    const charDef = getCharDef();
    const claims = [];
    const exposed = exposedBlocks();

    for (const food of entities.foods) {
      const eid = entityId(food);
      const directT = directImpactT(food, charDef);
      if (directT != null) claims.push({ type:'direct', t:directT, entityId:eid, food, priority:isHazard(food) ? 1 : 0 });
      for (const projectile of s.projectiles) {
        if (!projectile.active) continue;
        const t = projectileImpactT(projectile, food);
        if (t != null) claims.push({ type:'projectile', t, entityId:eid, food, projectile, priority:isHazard(food) ? 0 : 1 });
      }
      // Positive special objects pass through Blocks; food/hearts/hazards claim them.
      if (isNormalFood(food) || isHeart(food) || isHazard(food)) {
        for (const block of exposed) {
          const t = blockImpactT(block, food);
          if (t != null) claims.push({ type:'block', t, entityId:eid, food, block, priority:2 });
        }
      }
    }

    claims.sort((a, b) => a.t - b.t
      || a.priority - b.priority
      || a.entityId - b.entityId
      || Number(a.projectile?.id || a.block?.id || 0) - Number(b.projectile?.id || b.block?.id || 0));

    const claimedEntities = new Set();
    const claimedBlocks = new Set();
    for (const claim of claims) {
      if (claimedEntities.has(claim.food) || !entities.foods.includes(claim.food)) continue;
      if (claim.type === 'direct') {
        if (!removeFood(claim.food)) continue;
        claimedEntities.add(claim.food);
        handleDirectCatch(claim.food, charDef);
      } else if (claim.type === 'projectile') {
        if (!claim.projectile.active || !s.projectiles.includes(claim.projectile)) continue;
        claimedEntities.add(claim.food);
        if (isHazard(claim.food)) neutralizeHazard(claim.food, claim.projectile);
        else resolveThrowCollectible(claim.food, charDef, claim.projectile);
      } else {
        if (claimedBlocks.has(claim.block.id) || !s.blocks.some(block => block.id === claim.block.id)) continue;
        claimedEntities.add(claim.food);
        claimedBlocks.add(claim.block.id);
        resolveBlockClaim(claim.food, claim.block, charDef);
      }
    }

    for (let index = s.projectiles.length - 1; index >= 0; index--) {
      if (!s.projectiles[index].active || s.projectiles[index].y < -CONFIG.FOOD_H) s.projectiles.splice(index, 1);
    }
  }

  function getImage(slot, src) {
    if (slot === 'block') {
      if (blockImage || typeof Image === 'undefined') return blockImage;
      blockImage = new Image();
      blockImage.decoding = 'async';
      blockImage.src = src;
      return blockImage;
    }
    if (projectileImage || typeof Image === 'undefined') return projectileImage;
    projectileImage = new Image();
    projectileImage.decoding = 'async';
    projectileImage.src = src;
    return projectileImage;
  }
  function drawWorld(targetCtx) {
    if (characterId() !== 'toadal' || !targetCtx) return false;
    const s = state();
    if (!s) return false;
    const blockAsset = getImage('block', BLOCK_IMAGE_SRC);
    const projectileAsset = getImage('projectile', PROJECTILE_IMAGE_SRC);
    const blockReady = blockAsset?.complete && blockAsset?.naturalWidth;
    const projectileReady = projectileAsset?.complete && projectileAsset?.naturalWidth;

    for (const block of s.blocks) {
      if (blockReady) targetCtx.drawImage(blockAsset, block.x, block.y, block.w, block.h);
      else {
        targetCtx.save();
        targetCtx.fillStyle = '#e7b91e';
        targetCtx.fillRect(block.x, block.y, block.w, block.h);
        targetCtx.restore();
      }
    }
    for (const projectile of s.projectiles) {
      if (!projectile.active) continue;
      const size = 24;
      if (projectileReady) targetCtx.drawImage(projectileAsset, projectile.x - size / 2, projectile.y - size / 2, size, size);
      else {
        targetCtx.save();
        targetCtx.fillStyle = '#ffe45c';
        targetCtx.fillRect(projectile.x - size / 2, projectile.y - size / 2, size, size);
        targetCtx.restore();
      }
    }
    return Boolean(s.blocks.length || s.projectiles.length);
  }

  function snapshot() {
    const s = state();
    if (!s) return Object.freeze({ active: false });
    return Object.freeze({
      active: characterId() === 'toadal',
      charge: Number(s.charge || 0),
      grounded: Boolean(s.grounded),
      supportBlockId: s.supportBlockId,
      velocityY: Number(s.velocityY || 0),
      crouchInputHeld: Boolean(s.crouchInputHeld),
      crouchHeld: Boolean(s.crouchHeld),
      crouchChargeSeconds: Number(s.crouchChargeSeconds || 0),
      crouchChargeRatio: Number(s.crouchChargeRatio || 0),
      lastHopChargeRatio: Number(s.lastHopChargeRatio || 0),
      lastHopSpeed: Number(s.lastHopSpeed || 0),
      pendingTongueSwallow: Boolean(s.pendingTongueSwallow),
      blockCount: s.blocks.length,
      blockIds: s.blocks.map(block => block.id),
      projectileCount: s.projectiles.length,
      throwActive: Boolean(s.throwAction.active),
      throwCommitted: Boolean(s.throwAction.committed),
      buildActive: Boolean(s.buildAction.active),
      buildCommitted: Boolean(s.buildAction.committed),
      lastCatchSource: String(s.lastCatchSource || ''),
      lastBlockOutcome: String(s.lastBlockOutcome || ''),
      diagnostics: Object.freeze({ ...qa }),
    });
  }

  if (typeof EventBus !== 'undefined') {
    EventBus.on('toadalHopPressed', () => requestHop()); // compatibility only; no player binding
    EventBus.on('toadalCrouchDown', () => setCrouchInput(true));
    EventBus.on('toadalCrouchUp', () => setCrouchInput(false));
    EventBus.on('toadalThrowPressed', () => requestThrow());
    EventBus.on('toadalBlockPressed', () => requestBuild());
    EventBus.on('playerDamaged', () => {
      if (characterId() !== 'toadal') return;
      const s = state();
      if (!s) return;
      s.hurtAnimTimer = Math.max(Number(s.hurtAnimTimer || 0), 0.56);
      cancelCrouch('hurt');
      if (s.throwAction.active && !s.throwAction.committed) { clearAction(s.throwAction); emit('toadalActionEnded', { action:'throw', reason:'hurt-precommit' }); }
      if (s.buildAction.active && !s.buildAction.committed) { clearAction(s.buildAction); emit('toadalActionEnded', { action:'block', reason:'hurt-precommit' }); }
    });
    EventBus.on('gameStarted', () => {
      if (characterId() === 'toadal') reset();
    });
    const cleanupRunObjects = (reason) => {
      if (characterId() !== 'toadal') return;
      const s = state();
      if (!s) return;
      s.projectiles.length = 0;
      s.blocks.length = 0;
      s.supportBlockId = null;
      s.grounded = false;
      s.pendingTongueSwallow = false;
      cancelCrouch(reason);
      clearAction(s.throwAction);
      clearAction(s.buildAction);
      emit('toadalRunObjectsCleared', { reason });
    };
    EventBus.on('gameOver', () => cleanupRunObjects('game-over'));
    EventBus.on('arcadeRunEnded', () => cleanupRunObjects('mode-exit'));
  }

  return Object.freeze({
    CONFIG: RULES,
    active,
    state,
    reset,
    snapshot,
    isHazard,
    isHeart,
    isNormalFood,
    isPositiveSpecial,
    onDirectContact,
    handleDirectCatch,
    onTongueCatch,
    onTongueRetracted,
    addCharge,
    beginCrouch,
    setCrouchInput,
    releaseChargedHop,
    cancelCrouch,
    hopSpeedForRatio,
    hopRatioForSpeed,
    requestHop,
    requestThrow,
    requestBuild,
    updateMovement,
    updateActions,
    beforeFoodUpdate,
    afterFoodUpdate,
    drawWorld,
    placementCandidate,
  });
})();

if (typeof globalThis !== 'undefined') globalThis.ArcadeToadalMechanics = ArcadeToadalMechanics;
