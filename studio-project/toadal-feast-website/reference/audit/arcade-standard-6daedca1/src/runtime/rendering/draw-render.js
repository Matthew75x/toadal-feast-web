// ============================================================
// src/runtime/rendering/draw-render.js — Main render() orchestrator
// Top-level per-frame render() that calls into the other draw-*.js modules. Split from game-draw.js for modularity.
// ============================================================
// ------------------------------------------------------------
// Arcade presentation camera — repair for Issue #114.
//
// The authored Arcade character sheets are considerably wider than the logical
// gameplay box (CONFIG.FROG_W). PR #99 deliberately keeps ordinary horizontal
// movement at the logical extrema, so at frog.x = 26 / 454 the approved body,
// wings, cape and hat overhang the 480px render surface and Chromium crops
// them. The authored footprint was already computed by
// arcadePresentationFootprintHalfWidth(), but nothing in the renderer consumed
// it.
//
// ArcadePresentationCamera is that consumer. It is a presentation camera: one uniform
// affine transform applied to the whole Arcade actor layer (props, food, the
// character body, cosmetics, tongue, clone, eating finish, particles and
// floating text). Because every actor shares the single transform, they stay
// mutually attached — the tongue still meets the mouth, cosmetics still sit on
// the head, reactions still track the body, and food still lands where the
// character visibly catches it. Only the painted backdrop and the HUD stay
// outside, and neither has any per-pixel alignment contract with the actors.
//
// Hard boundary: the camera is presentation-only. It never reads or writes
// gameplay state. frog.x, collision geometry, catch radii, tongue reach,
// movement speed, input, scoring, RNG and balance are untouched, and the
// protected ordinary movement range [26, 454] is preserved exactly.
// ------------------------------------------------------------
const ArcadePresentationCamera = (() => {
  // Safety floor only; current authored presentation must remain contained.
  // Maximum Toadal Consumption uses a ~4.472x complete-body frame and needs
  // roughly 0.415x camera scale at its governed dynamic edge. The former 0.6
  // floor overrode the containment equation and cropped that legitimate state.
  // 0.4 stays below the current governed requirement without permitting a
  // pathological future asset to collapse the actor layer toward zero.
  const MIN_SCALE = 0.4;

  let depth = 0;
  const scaleCache = new Map();

  function canvasWidth() {
    return typeof CONFIG !== 'undefined' && Number(CONFIG.CANVAS_W) > 0 ? Number(CONFIG.CANVAS_W) : 480;
  }

  function canvasHeight() {
    return typeof CONFIG !== 'undefined' && Number(CONFIG.CANVAS_H) > 0 ? Number(CONFIG.CANVAS_H) : 800;
  }

  function anchorX() {
    return canvasWidth() / 2;
  }

  // The gameplay ground baseline. Anchoring the vertical axis here keeps every
  // character standing on exactly the same painted ground pixels as before, so
  // the backdrop needs no change at all.
  function anchorY() {
    return canvasHeight() - 80;
  }

  // The widest excursion from centre that the gameplay rule permits for this
  // character. The camera reads the movement authority; it never writes to it.
  // For every ordinary character this is the protected PR #99 range, so the
  // camera scale is constant for a whole run. For the dynamic Toadal
  // Consumption / Gulper growth case the legal range legitimately narrows as
  // the body grows, and reading the same authority keeps the reservation
  // proportional instead of permanently over-reserving for a size the
  // character has not reached.
  function legalTravel(charDef) {
    const logicalHalf = typeof CONFIG !== 'undefined' && Number(CONFIG.FROG_W) > 0
      ? Number(CONFIG.FROG_W) / 2
      : 24;
    let gameplayHalf = logicalHalf;
    if (typeof arcadeGameplayMovementHalfWidth === 'function') {
      try {
        const value = Number(arcadeGameplayMovementHalfWidth(charDef));
        if (Number.isFinite(value) && value > 0) gameplayHalf = value;
      } catch (_) { gameplayHalf = logicalHalf; }
    }
    return Math.max(1, anchorX() - (gameplayHalf + 2));
  }

  function footprintHalfWidth(charDef, behavior) {
    if (typeof arcadePresentationFootprintHalfWidth !== 'function') return null;
    try {
      const value = Number(arcadePresentationFootprintHalfWidth(charDef, behavior));
      return Number.isFinite(value) && value > 0 ? value : null;
    } catch (_) {
      return null;
    }
  }

  // Screen position of the character at a legal extremum is
  //   anchorX - legalTravel * scale
  // and its drawn half-width is footprint * scale, so full containment needs
  //   anchorX >= (legalTravel + footprint) * scale.
  function scaleFor(charDef, behavior) {
    const footprint = footprintHalfWidth(charDef, behavior);
    if (footprint == null) return 1;
    const travel = legalTravel(charDef);
    const key = `${String(charDef?.id || 'unknown')}|${canvasWidth()}|${footprint}|${travel}`;
    const cached = scaleCache.get(key);
    if (cached !== undefined) return cached;
    const required = travel + footprint;
    const scale = required > 0
      ? Math.max(MIN_SCALE, Math.min(1, anchorX() / required))
      : 1;
    scaleCache.set(key, scale);
    return scale;
  }

  function currentScale() {
    if (typeof getCharDef !== 'function') return 1;
    let charDef = null;
    try { charDef = getCharDef(); } catch (_) { return 1; }
    if (!charDef) return 1;
    let behavior = null;
    try {
      behavior = typeof getArcadeCharacterBehaviorProfile === 'function'
        ? getArcadeCharacterBehaviorProfile(charDef)
        : null;
    } catch (_) { behavior = null; }
    return scaleFor(charDef, behavior);
  }

  // Re-entrancy safe. render() opens the camera once around the whole actor
  // layer; drawFrog() opens it too so that any isolated entry point — the
  // Issue #114 QA witness calls drawFrog() directly on a bare DPR transform —
  // renders in the same presentation space. Only the outermost begin() applies
  // the transform, so the frame render never double-applies it.
  function begin(target) {
    const context = target || (typeof ctx !== 'undefined' ? ctx : null);
    if (!context) return false;
    depth += 1;
    if (depth > 1) return false;
    const scale = currentScale();
    context.save();
    if (scale !== 1) {
      context.translate(anchorX(), anchorY());
      context.scale(scale, scale);
      context.translate(-anchorX(), -anchorY());
    }
    return true;
  }

  function end(target) {
    const context = target || (typeof ctx !== 'undefined' ? ctx : null);
    if (!context) return;
    if (depth <= 0) return;
    depth -= 1;
    if (depth === 0) context.restore();
  }

  function snapshot() {
    return {
      scale: currentScale(),
      anchorX: anchorX(),
      anchorY: anchorY(),
      legalTravel: (() => { try { return legalTravel(getCharDef()); } catch (_) { return null; } })(),
      depth,
      minScale: MIN_SCALE,
    };
  }

  return Object.freeze({ scaleFor, currentScale, begin, end, snapshot });
})();

if (typeof globalThis !== 'undefined') {
  globalThis.ArcadePresentationCamera = ArcadePresentationCamera;
}

// Puzzle Mode keeps its animation clock local so the protected game loop remains unchanged.
let _puzzleRenderFrame = 0;
let _puzzleRenderErrorLogged = false;
let _puzzleHudRenderErrorLogged = false;
let _infiniteRenderFrame = 0;

function drawPuzzleRenderFallback(ctx, error) {
  const width = typeof PUZZLE_CANVAS !== 'undefined' ? PUZZLE_CANVAS.WIDTH : CONFIG.CANVAS_W;
  const height = typeof PUZZLE_CANVAS !== 'undefined' ? PUZZLE_CANVAS.HEIGHT : CONFIG.CANVAS_H;
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.filter = 'none';
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#12351f';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#f4ffe9';
  ctx.font = '900 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Puzzle Mode renderer paused safely', width / 2, 206);
  ctx.fillStyle = 'rgba(244,255,233,0.82)';
  ctx.font = '700 12px sans-serif';
  const message = error?.message || 'Unknown render error';
  ctx.fillText(message.slice(0, 74), width / 2, 232);
  ctx.fillText('Check the console, then retry this level.', width / 2, 252);
  ctx.restore();
}

function render() {
  // The premium Feastfall shell owns every visible pixel while active. Return
  // before touching the legacy gameCanvas at all; even a clearRect on the
  // clipped high-DPR backing store is real raster work and was previously paid
  // 60 times per second for a surface the player cannot see.
  if (typeof CONNECT3_MODE_STATE !== 'undefined'
    && GameState.currentMode === 'connect3'
    && GameState.mode === CONNECT3_MODE_STATE
    && typeof document !== 'undefined'
    && document.body?.classList?.contains('feastfall-premium-active')) {
    return;
  }

  // Rendering must never inherit alpha, transforms, compositing, or filters
  // from a previous frame. This prevents apparent after-images if any draw
  // helper exits with a non-default canvas state.
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.filter = 'none';
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
  ctx.clearRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);

  // Puzzle Mode is a self-contained canvas renderer. The branch is deliberately
  // early so no arcade entities, world art, or HUD can leak into its board.
  if (typeof PUZZLE_MODE_STATE !== 'undefined'
    && typeof drawPuzzleGrid === 'function'
    && typeof drawPuzzleHUD === 'function'
    && GameState.currentMode === 'puzzle'
    && GameState.mode === PUZZLE_MODE_STATE) {
    try {
      ctx.save();
      drawPuzzleGrid(ctx, _puzzleRenderFrame++);
    } catch (error) {
      if (!_puzzleRenderErrorLogged) {
        console.error('Puzzle Mode grid render failed', error);
        _puzzleRenderErrorLogged = true;
      }
      drawPuzzleRenderFallback(ctx, error);
    } finally {
      ctx.restore();
    }

    try {
      drawPuzzleHUD(ctx);
    } catch (error) {
      if (!_puzzleHudRenderErrorLogged) {
        console.error('Puzzle Mode HUD render failed', error);
        _puzzleHudRenderErrorLogged = true;
      }
    }
    return;
  }

  if (typeof INFINITE_MODE_STATE !== 'undefined'
    && GameState.currentMode === 'infinite'
    && GameState.mode === INFINITE_MODE_STATE
    && typeof InfiniteGameHost !== 'undefined') {
    InfiniteGameHost.render(ctx, _infiniteRenderFrame++);
    return;
  }

  if (typeof CONNECT3_MODE_STATE !== 'undefined'
    && typeof drawConnect3 === 'function'
    && GameState.currentMode === 'connect3'
    && GameState.mode === CONNECT3_MODE_STATE) {
    // The premium Feastfall host is the visible board authority. Rendering the
    // legacy gameCanvas underneath a 1px clipped surface duplicates virtually
    // all board shadow/image work for zero visible benefit. Skip only that
    // hidden render; simulation/update authority remains untouched.
    const premiumVisible = typeof document !== 'undefined' && document.body?.classList?.contains('feastfall-premium-active');
    if (!premiumVisible) drawConnect3(ctx, _connect3RenderFrame++);
    return;
  }

  ctx.save();
  if (RuntimeState.shakeTime > 0 && GameState.mode === GAME_MODES.PLAYING) {
    ctx.translate((Math.random()-0.5)*5*RuntimeState.shakeTime, (Math.random()-0.5)*5*RuntimeState.shakeTime);
  }
  // Painted backdrop layer. It has no per-pixel alignment contract with the
  // actors, spans the full surface, and is deliberately left outside the
  // Issue #114 presentation camera so it renders exactly as before.
  drawBackground();
  drawZenCastle();
  drawFlytrapDirtGround();

  // Arcade actor layer. Every actor shares one presentation camera so the
  // approved character body stays fully inside the render surface at the
  // protected movement extrema while remaining attached to its own tongue,
  // cosmetics, reactions, props, food, effects and text. Logical gameplay
  // coordinates are untouched.
  const _presentationCamera = typeof ArcadePresentationCamera !== 'undefined' ? ArcadePresentationCamera : null;
  if (_presentationCamera) _presentationCamera.begin(ctx);
  try {
    drawBobChest();
    drawFoods();
    if (typeof ArcadeToadalMechanics !== 'undefined') ArcadeToadalMechanics.drawWorld(ctx);
    ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';
    drawFlytrapRootBed();
    // Authored action frames supply the open mouth for Classic, Fire, Ocean,
    // Royal, and Princess. Golden/Ninja receive only a shallow smile-aligned
    // aperture. The foreground lip pass hides the tongue insertion edge, so no
    // separate circular cavity or exposed root bulb is visible.
    drawFrog();
    drawFlytrapForegroundSoil();
    drawFlytrapCloneCharge();
    drawTongueMouthCavity(getCharDef());
    drawTongue();
    drawTongueMouthOverlay(getCharDef());
    drawClone();
    if (typeof ArcadeEatingFinish !== 'undefined') ArcadeEatingFinish.draw(ctx);
    drawParticles();
    drawFloatingTexts();
  } finally {
    if (_presentationCamera) _presentationCamera.end(ctx);
  }
  ctx.restore();
  ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'; 
  if (GameState.mode === 'playing' || GameState.mode === 'paused' || GameState.mode === 'dead') drawHUD();
}
