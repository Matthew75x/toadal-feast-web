// ============================================================
// src/runtime/rendering/draw-hud.js — HUD rendering
// Mode HUD widgets, drawHUD, drawActiveEffects, drawStreakIndicator. Split from game-draw.js for modularity.
// ============================================================


function themeHudText(key, fallback) {
  return typeof themeText === 'function' ? themeText(key, fallback) : fallback;
}

function themeHudFormat(key, values, fallback) {
  if (typeof ThemeSystem !== 'undefined' && ThemeSystem?.format) return ThemeSystem.format(key, values, fallback);
  return Object.entries(values || {}).reduce(
    (result, [name, value]) => result.split(`{{${name}}}`).join(String(value)),
    fallback,
  );
}

function arcadeLivesHudText(lives, maxLives) {
  const capacity = Math.max(1, Math.floor(Number(maxLives) || Number(GAME_BALANCE?.lives?.defaultMax) || 1));
  const current = Math.max(0, Math.min(capacity, Math.floor(Number(lives) || 0)));
  if (capacity >= 8) return `${current}/${capacity}`;
  return `${current} Heart${current === 1 ? '' : 's'}`;
}

// ── HUD presentation config — single tuning point for the lives display ──────
// The canvas HUD cannot be styled by CSS, so its presentation primitives live
// here as data instead of magic numbers scattered through render code. Changing
// the lives display — where it collapses, the icon size, the collapse style,
// the colors — is now a one-line edit here, not a hunt through the renderer.
// This mirrors, for canvas surfaces, what presentation-tokens.css does for DOM.
const HUD_HEALTH_PRESENTATION = {
  iconMaxCount: 10,          // show one heart icon per life up to this many...
  collapseStyle: 'counter',  // ...then collapse to a single heart + count ('counter' | 'stack')
  iconSizePx: 18,
  iconGapPx: 1,
  counterGapPx: 3,
  counterFont: '900 14px system-ui, sans-serif',
  labelFont: '900 16px system-ui, sans-serif',
  missingAssetFont: '800 13px system-ui, sans-serif',
  colorNormal: '#ff5b68',
  colorLow: '#ff4444',
  lowWarnAt: 2,
};

function drawArcadeLivesHud(rightX, topY) {
  const cfg = HUD_HEALTH_PRESENTATION;
  const capacity = Math.max(1, Math.floor(Number(GameState.maxLives) || Number(GAME_BALANCE?.lives?.defaultMax) || 1));
  const current = Math.max(0, Math.min(capacity, Math.floor(Number(GameState.lives) || 0)));
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillStyle = current <= cfg.lowWarnAt ? cfg.colorLow : cfg.colorNormal;

  const heart = typeof AssetManager !== 'undefined' && typeof AssetManager.getImage === 'function'
    ? AssetManager.getImage('arcade_heart_red')
    : null;

  // Fail closed to the approved text form when the heart raster is unavailable
  // or there are no lives to show — never a native heart glyph.
  if (!heart || current <= 0) {
    ctx.font = heart ? cfg.labelFont : cfg.missingAssetFont;
    ctx.fillText(arcadeLivesHudText(current, capacity), rightX, topY + 2);
    return;
  }

  const size = cfg.iconSizePx;
  const gap = cfg.iconGapPx;

  // Above the threshold, collapse to a single heart icon + count so the HUD
  // never grows an unbounded row of hearts. Icon stays an approved asset.
  if (current > cfg.iconMaxCount && cfg.collapseStyle === 'counter') {
    const countText = String(current);
    ctx.font = cfg.counterFont;
    const countW = ctx.measureText(countText).width;
    ctx.fillText(countText, rightX, topY + 3);
    ctx.drawImage(heart, rightX - countW - cfg.counterGapPx - size, topY - 1, size, size);
    return;
  }

  // Otherwise draw one heart icon per life, right-aligned.
  for (let index = 0; index < current; index += 1) {
    const x = rightX - size - index * (size + gap);
    ctx.drawImage(heart, x, topY - 1, size, size);
  }
}

function hudWidgetTC() {
  const tc = GameState.toadalConsumption || { foodsEaten:0, mouthClosed:false };
  const maxMeals = typeof GULPER_TOADAL_MAX_MEALS === 'number' ? GULPER_TOADAL_MAX_MEALS : 140;
  const meals = Math.max(0, Math.min(maxMeals, Math.floor(Number(tc.foodsEaten || 0))));
  const stageCount = typeof GULPER_TOADAL_STAGE_COUNT === 'number' ? GULPER_TOADAL_STAGE_COUNT : 20;
  const stage = typeof getGulperToadalStage === 'function'
    ? getGulperToadalStage(meals)
    : Math.min(stageCount - 1, Math.floor((meals / maxMeals) * stageCount));
  const fill = meals / maxMeals;
  // Warn tint enters near the top of the progression rather than at a fixed body index.
  const color = meals >= maxMeals ? '#ffd75e' : stage >= Math.round(stageCount * 0.7) ? '#ff9d5c' : '#88eeff';
  const mouthText = tc.mouthClosed
    ? themeHudText('hud.mouthClosed', 'CLOSED · RELEASE TO EAT')
    : themeHudText('hud.mouthOpen', 'OPEN · HOLD SPACE TO CLOSE');
  ctx.font='bold 10px sans-serif'; ctx.fillStyle='#90b890'; ctx.textAlign='center';
  ctx.fillText(mouthText, CONFIG.CANVAS_W/2, 7);
  // The oversized meal counter that used to sit here read as a debug overlay in the
  // middle of the playfield. Growth is already communicated by the frog scaling, the
  // progress bar, and the stage line, so the raw meal tally is not drawn.
  ctx.font='800 8px sans-serif'; ctx.fillStyle='#d9eed5';
  ctx.fillText(themeHudFormat('hud.growthStage', { current: stage + 1, total: stageCount }, 'GROWTH STAGE ' + (stage + 1) + ' / ' + stageCount), CONFIG.CANVAS_W/2, 24);
  const barW=74, barH=4, barX=CONFIG.CANVAS_W/2-barW/2, barY=29;
  ctx.fillStyle='rgba(255,255,255,0.12)'; ctx.fillRect(barX,barY,barW,barH);
  ctx.fillStyle=color; ctx.fillRect(barX,barY,barW*fill,barH);
}

function hudWidgetFMF() {
  const _mm = Math.floor(GameState.fmfTimeLeft / 60);
  const _ss = String(Math.floor(GameState.fmfTimeLeft % 60)).padStart(2,'0');
  const _tc = GameState.fmfTimeLeft <= 30 ? '#ff4444'
            : GameState.fmfTimeLeft <= 60 ? '#ffaa00' : '#cc88ff';
  const cx = CONFIG.CANVAS_W / 2;
  const cfg = getCurrentLevelConfig();
  const eaten = ProgressionState.foodsEaten;
  const total = cfg.foodsToEat;
  ctx.font='bold 10px sans-serif'; ctx.fillStyle='#90b890'; ctx.textAlign='center';
  ctx.fillText(themeHudText('hud.time', 'TIME'), cx, 8);
  ctx.font='bold 18px sans-serif'; ctx.fillStyle=_tc;
  ctx.fillText(_mm+':'+_ss, cx, 20);
  ctx.font='800 8px sans-serif'; ctx.fillStyle='#d9eed5';
  ctx.fillText(themeHudFormat('hud.arcadeCatchGoal', { current: eaten, target: total }, `CATCH ${eaten}/${total}`), cx, 30);

  const fill = Math.min(eaten / total, 1);
  const barW = 72, barH = 4, barX = cx - barW / 2, barY = 36;
  ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = fill >= 1 ? '#ffd700' : '#cc88ff';
  ctx.fillRect(barX, barY, barW * fill, barH);
}

function hudWidgetStandard() {
  const cfg = getCurrentLevelConfig();
  const eaten = ProgressionState.foodsEaten;
  const total = cfg.foodsToEat;
  const cx = CONFIG.CANVAS_W / 2;

  if (ProgressionState.transitioning) {
    ctx.font = 'bold 11px sans-serif'; ctx.fillStyle = '#ffd700'; ctx.textAlign = 'center';
    ctx.fillText(themeHudText('hud.waveClear', 'WAVE CLEAR!'), cx, 9);
    // game-core.js owns this predicate; never re-implement it inline here.
    const remaining = countActiveWaveDrainObjects();
    const startedWith = Math.max(1, Number(ProgressionState.drainStartCount || remaining || 1));
    const drainFill = Math.max(0, Math.min(1, remaining / startedWith));
    const barW = 72, barH = 4, barX = cx - barW / 2, barY = 27;
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = '#ffd700'; ctx.fillRect(barX, barY, barW * drainFill, barH);
    return;
  }

  const encoreActive = typeof ArcadeFeastVictory !== 'undefined' && ArcadeFeastVictory.isEncoreActive();
  ctx.font = 'bold 10px sans-serif'; ctx.fillStyle = encoreActive ? '#ffe36b' : '#90b890'; ctx.textAlign = 'center';
  const goalWave = typeof ArcadeFeastVictory !== 'undefined' ? ArcadeFeastVictory.GOAL_WAVE : 10;
  const goalLabel = encoreActive
    ? themeHudFormat('hud.arcadeEncoreGoal', { level:GameState.level, current:eaten, target:total }, `ENCORE · WAVE ${GameState.level} · CATCH ${eaten}/${total}`)
    : themeHudFormat('hud.arcadeGoal', { level:Math.min(GameState.level, goalWave), current:eaten, target:total, goalWave }, `FEAST GOAL ${Math.min(GameState.level, goalWave)}/${goalWave} · CATCH ${eaten}/${total}`);
  ctx.fillText(goalLabel, cx, 9);
  ctx.font = 'bold 13px sans-serif'; ctx.fillStyle = encoreActive ? '#ffe36b' : '#7edd54';
  ctx.fillText(themeHudFormat('hud.arcadeCatchProgress', { current: eaten, target: total }, `${eaten} / ${total}`), cx, 22);
  const barW = 72, barH = 4, barX = cx - barW / 2, barY = 27;
  ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(barX, barY, barW, barH);
  const fill = Math.min(eaten / total, 1);
  ctx.fillStyle = fill >= 1 ? '#ffd700' : '#7edd54';
  ctx.fillRect(barX, barY, barW * fill, barH);
}

function hudWidgetZen() {
  const bal      = GAME_BALANCE.zen;
  const cx       = CONFIG.CANVAS_W / 2;
  const rooms    = ZenState.roomsRevealed;
  const roomFrac = ZenState.roomFraction;
  const tierName = rooms < bal.rooms
    ? (bal.roomTiers[rooms] || bal.roomTiers[bal.rooms - 1]).label
    : 'Complete!';

  ctx.font = 'bold 11px sans-serif';
  ctx.fillStyle = '#ccaaff';
  ctx.textAlign = 'center';
  ctx.fillText(tierName, cx, 9);

  const dotR = 4, dotGap = 14;
  const dotsW = (bal.rooms - 1) * dotGap;
  for (let i = 0; i < bal.rooms; i++) {
    const dx = cx - dotsW / 2 + i * dotGap;
    ctx.beginPath(); ctx.arc(dx, 21, dotR, 0, Math.PI * 2);
    ctx.fillStyle = i < rooms ? '#cc88ff' : 'rgba(255,255,255,0.15)';
    ctx.fill();
    if (i === rooms && !ZenState.complete) {
      ctx.beginPath(); ctx.arc(dx, 21, dotR * roomFrac, 0, Math.PI * 2);
      ctx.fillStyle = '#cc88ff';
      ctx.fill();
    }
  }

  const barW = 70, barH = 3, barX = cx - barW / 2, barY = 30;
  ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = ZenState.complete ? '#ffd700' : '#cc88ff';
  ctx.fillRect(barX, barY, barW * ZenState.totalProgress, barH);
}

const HUD_CENTER_WIDGETS = {
  tc:       hudWidgetTC,
  fmf:      hudWidgetFMF,
  standard: hudWidgetStandard,
  zen:      hudWidgetZen,
};

function drawHUDCenter() {
  const mode = GameState.currentMode;
  (HUD_CENTER_WIDGETS[mode] || hudWidgetStandard)();
}

function drawToadalGoldenChargeHud() {
  let charDef = null;
  try { charDef = typeof getCharDef === 'function' ? getCharDef() : null; } catch (_) {}
  if (charDef?.id !== 'toadal' || typeof ArcadeToadalMechanics === 'undefined') return;
  const snapshot = ArcadeToadalMechanics.snapshot?.();
  if (!snapshot?.active) return;
  const rules = ArcadeToadalMechanics.CONFIG || {};
  const value = Math.max(0, Math.min(Number(rules.maxCharge || 100), Number(snapshot.charge || 0)));
  const max = Math.max(1, Number(rules.maxCharge || 100));
  const throwCost = Number(rules.throwCost || 45);
  const blockCost = Number(rules.blockCost || 100);
  // Keep the resource row below the standard catch bar. At the responsive
  // 1.6x canvas scale used by the normal 1423x1280 viewport, y=38 placed the
  // GOLD label directly against the green catch progress line.
  const barW = 100, barH = 6, x = CONFIG.CANVAS_W / 2 - barW / 2, y = 45;
  const fill = value / max;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.font = '900 8px sans-serif';
  ctx.fillStyle = value >= blockCost ? '#fff4b5' : value >= throwCost ? '#ffe26b' : '#d8c67b';
  ctx.fillText(`GOLDEN ${Math.round(value)}/${Math.round(max)}`, CONFIG.CANVAS_W / 2, y - 2);
  ctx.fillStyle = 'rgba(26,20,4,0.42)';
  ctx.fillRect(x, y, barW, barH);
  ctx.fillStyle = value >= blockCost ? '#fff09a' : value >= throwCost ? '#ffd44f' : '#d5aa25';
  ctx.fillRect(x, y, barW * fill, barH);
  const throwX = x + barW * Math.max(0, Math.min(1, throwCost / max));
  ctx.fillStyle = value >= throwCost ? '#fff7c6' : 'rgba(255,255,255,0.45)';
  ctx.fillRect(throwX - 0.5, y - 1, 1, barH + 2);
  ctx.strokeStyle = value >= blockCost ? '#fff7c6' : 'rgba(255,225,96,0.52)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 0.5, y - 0.5, barW + 1, barH + 1);
  ctx.restore();
}

function drawActiveEffects() {
  const active = StatusEffectSystem.list();
  if (active.length === 0) return;

  const pillW = 68, pillH = 22, gap = 6;
  const totalW = active.length * pillW + (active.length - 1) * gap;
  const startX = (CONFIG.CANVAS_W - totalW) / 2;
  const y = 50;

  ctx.save();
  active.forEach((entry, i) => {
    const x = startX + i * (pillW + gap);
    const pct = Math.max(0, entry.remaining / entry.duration);

    ctx.fillStyle = 'rgba(0,0,0,0.60)';
    ctx.beginPath(); ctx.roundRect(x, y, pillW, pillH, 5); ctx.fill();

    const fillColor = pct < 0.3 ? '#ff5555' : pct < 0.6 ? '#ffaa22' : '#7edd54';
    ctx.fillStyle = fillColor + '55';
    ctx.beginPath(); ctx.roundRect(x, y, pillW * pct, pillH, 5); ctx.fill();

    ctx.strokeStyle = fillColor + 'aa';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(x, y, pillW, pillH, 5); ctx.stroke();

    const secs = Math.ceil(entry.remaining);
    if (typeof ArcadeVisuals !== 'undefined') {
      ctx.save();
      ctx.translate(x + 13, y + pillH / 2);
      ArcadeVisuals.drawFallingEntity(ctx, { isPowerUp:true, powerUpEffect:entry.id }, { width:15, height:15 });
      ctx.restore();
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x + 13, y + pillH / 2, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 4;
    ctx.fillText(`${secs}s`, x + 45, y + pillH / 2);
    ctx.shadowBlur = 0;
  });
  ctx.restore();
}

function drawLivingFeastForecast() {
  if (typeof ArcadeLivingFeastDirector === 'undefined' || GameState.currentMode !== 'standard') return;
  // The first-run coach already explains Wave 1. Never draw a forecast card
  // through that teaching surface; the announcement remains available once
  // the coach clears after the first successful catch.
  if (typeof ArcadeFirstRunCoach !== 'undefined' && ArcadeFirstRunCoach.isVisible?.()) return;
  const announcement = ArcadeLivingFeastDirector.getAnnouncement();
  if (!announcement || announcement.alpha <= 0) return;
  const title = String(announcement.title || 'NEXT COURSE');
  const subtitle = String(announcement.subtitle || '');
  ctx.save();
  ctx.font = '900 13px sans-serif';
  const width = Math.min(CONFIG.CANVAS_W - 28, Math.max(220, ctx.measureText(title).width + 74));
  ctx.restore();
  const x = (CONFIG.CANVAS_W - width) / 2;
  const y = 72;
  ctx.save();
  ctx.globalAlpha = announcement.alpha;
  ctx.fillStyle = announcement.forecast === 'hazard-warning'
    ? 'rgba(91,25,31,0.92)'
    : announcement.milestone
      ? 'rgba(83,55,20,0.94)'
      : 'rgba(13,39,30,0.92)';
  ctx.beginPath(); ctx.roundRect(x, y, width, 47, 12); ctx.fill();
  ctx.strokeStyle = announcement.forecast === 'hazard-warning'
    ? '#ff7b72'
    : announcement.milestone ? '#ffe36b' : '#8be39a';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = announcement.forecast === 'hazard-warning' ? '#ffd6d1' : '#fff5ca';
  ctx.font = '900 13px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(`${announcement.icon || ''}  ${title}`.trim(), CONFIG.CANVAS_W / 2, y + 17, width - 20);
  ctx.fillStyle = 'rgba(245,250,238,0.90)';
  ctx.font = '700 9px sans-serif';
  ctx.fillText(subtitle, CONFIG.CANVAS_W / 2, y + 34, width - 18);
  ctx.restore();
}

// Arcade HUD skins share the same authoritative game state. The visual option
// changes only the presentation; the classic renderer below stays intact.
let luminousScoreDisplay = null;
let luminousScoreFrom = 0;
let luminousScoreTarget = 0;
let luminousScoreStarted = 0;
let luminousBonusUntil = 0;
let luminousBonusAmount = 0;

function arcadeHudTheme() {
  const choice = typeof SETTINGS !== 'undefined' ? SETTINGS?.modes?.arcade?.hudTheme : null;
  return choice === 'garden' || choice === 'luminous' || choice === 'astro' ? choice : 'classic';
}

let astroHudScoreTarget = null;
let astroHudScoreFrom = 0;
let astroHudScoreDisplay = 0;
let astroHudScoreStarted = 0;
let astroHudBonusUntil = 0;
let astroHudBonusAmount = 0;
let astroHudComboValue = null;
let astroHudHealthKey = '';
let astroHudProgressKey = '';
let astroHudPreviousLives = null;
let astroHudPreviousLifeCapacity = null;
let astroHudPauseBound = false;
let astroHudPreviousTheme = 'classic';
let astroHudPreviousRunId = null;

function astroHudObjectiveData() {
  const mode = GameState.currentMode;
  if (mode === 'tc') {
    const current = Math.max(0, Number(GameState.toadalConsumption?.foodsEaten) || 0);
    const target = Math.max(1, Number(typeof GULPER_TOADAL_MAX_MEALS === 'number' ? GULPER_TOADAL_MAX_MEALS : 140));
    return { label:'GROWTH', value:`${current} / ${target}`, current, target };
  }
  if (mode === 'zen') {
    const target = Math.max(1, Number(GAME_BALANCE?.zen?.rooms) || 1);
    const current = Math.max(0, Number(ZenState.roomsRevealed) || 0);
    return {
      label:'ZEN GARDEN', value:`${current} / ${target}`,
      current, target, ratio:Math.max(0, Math.min(1, Number(ZenState.totalProgress) || 0)),
    };
  }
  const cfg = getCurrentLevelConfig();
  const current = Math.max(0, Number(ProgressionState.foodsEaten) || 0);
  const target = Math.max(1, Number(cfg.foodsToEat) || 1);
  if (mode === 'fmf') {
    const remaining = Math.max(0, Number(GameState.fmfTimeLeft) || 0);
    return {
      label:`TIME ${Math.floor(remaining / 60)}:${String(Math.floor(remaining % 60)).padStart(2, '0')}`,
      value:`CATCH ${current} / ${target}`, current, target,
    };
  }
  if (ProgressionState.transitioning) {
    const remaining = typeof countActiveWaveDrainObjects === 'function'
      ? Math.max(0, Number(countActiveWaveDrainObjects()) || 0) : 0;
    const started = Math.max(1, Number(ProgressionState.drainStartCount) || remaining || 1);
    return { label:'WAVE CLEAR', value:`${remaining} LEFT`, current:started - remaining, target:started };
  }
  const encoreActive = typeof ArcadeFeastVictory !== "undefined" && ArcadeFeastVictory.isEncoreActive();
  const goalWave = typeof ArcadeFeastVictory !== "undefined" ? ArcadeFeastVictory.GOAL_WAVE : 10;
  const label = encoreActive
    ? `ENCORE · WAVE ${GameState.level}`
    : `FEAST GOAL ${Math.min(GameState.level, goalWave)}/${goalWave}`;
  return { label, value:`${current} / ${target}`, current, target };
}

let astroHudPauseCaptureBound = false;
let astroHudPauseSuppressClickUntil = 0;
function astroHudActivatePause() {
  if (typeof ArcadeShellHost !== 'undefined' && ArcadeShellHost.handleEscape?.()) return;
  if (GameState.mode === GAME_MODES.PLAYING) pauseGame();
  else if (GameState.mode === GAME_MODES.PAUSED) resumeGame();
}

function astroHudEnsurePauseAction() {
  const button = document.getElementById('astroHudPause');
  if (!button || astroHudPauseBound) return;
  button.addEventListener('click', () => {
    if (Date.now() < astroHudPauseSuppressClickUntil) { astroHudPauseSuppressClickUntil = 0; return; }
    astroHudActivatePause();
  });
  astroHudPauseBound = true;
  if (!astroHudPauseCaptureBound) {
    document.addEventListener('pointerdown', event => {
      const rect = button.getBoundingClientRect();
      const x = Number(event.clientX), y = Number(event.clientY);
      if (!rect.width || x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) return;
      event.preventDefault();
      event.stopPropagation();
      astroHudPauseSuppressClickUntil = Date.now() + 300;
      astroHudActivatePause();
    }, true);
    astroHudPauseCaptureBound = true;
  }
}

function astroHudSync(now) {
  const hud = document.getElementById('astroArcadeHud');
  if (!hud) return;
  const isArcade = ['standard', 'fmf', 'zen', 'tc'].includes(GameState.currentMode);
  const theme = arcadeHudTheme();
  const runId = String(GameState.arcadeRunId || '');
  if (astroHudPreviousRunId !== runId || astroHudPreviousTheme !== theme) {
    astroHudScoreTarget = null;
    astroHudScoreFrom = 0;
    astroHudScoreDisplay = 0;
    astroHudBonusUntil = 0;
    astroHudBonusAmount = 0;
    astroHudComboValue = null;
    astroHudHealthKey = '';
    astroHudProgressKey = '';
    astroHudPreviousLives = null;
    astroHudPreviousLifeCapacity = null;
  }
  astroHudPreviousRunId = runId;
  astroHudPreviousTheme = theme;
  const enabled = theme === 'astro' && isArcade
    && [GAME_MODES.PLAYING, GAME_MODES.PAUSED].includes(GameState.mode);
  hud.hidden = !enabled;
  hud.setAttribute('aria-hidden', enabled ? 'false' : 'true');
  if (!enabled) return;
  astroHudEnsurePauseAction();

  astroHudPreviousTheme = 'astro';
  const scoreNode = hud.querySelector('[data-astro-score]');
  const bonusNode = hud.querySelector('[data-astro-bonus]');
  const comboNode = hud.querySelector('[data-astro-combo]');
  const score = Math.floor(Number(GameState.score) || 0);
  if (astroHudScoreTarget === null) {
    astroHudScoreTarget = score;
    astroHudScoreFrom = score;
    astroHudScoreDisplay = score;
    astroHudScoreStarted = now;
  } else if (score !== astroHudScoreTarget) {
    astroHudScoreFrom = astroHudScoreDisplay;
    astroHudBonusAmount = 0;
    astroHudBonusUntil = 0;
    astroHudScoreTarget = score;
    astroHudScoreStarted = now;
  }
  const progressFraction = (typeof SETTINGS !== 'undefined' && SETTINGS.reduceMotion)
    || globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true
    ? 1 : Math.min(1, Math.max(0, now - astroHudScoreStarted) / 300);
  const eased = 1 - Math.pow(1 - progressFraction, 3);
  astroHudScoreDisplay = Math.round(astroHudScoreFrom + (astroHudScoreTarget - astroHudScoreFrom) * eased);
  if (scoreNode) {
    const next = astroHudScoreDisplay.toLocaleString('en-US');
    if (scoreNode.textContent !== next) scoreNode.textContent = next;
  }
  if (bonusNode) {
    const showBonus = astroHudBonusAmount > 0 && now < astroHudBonusUntil;
    const text = showBonus ? `+${astroHudBonusAmount.toLocaleString('en-US')}` : '';
    if (bonusNode.textContent !== text) bonusNode.textContent = text;
    if (bonusNode.dataset.visible !== String(showBonus)) bonusNode.dataset.visible = String(showBonus);
  }

  const combo = GameState.currentMode === 'zen' ? 0 : Math.max(0, Number(GameState.combo) || 0);
  if (comboNode && combo !== astroHudComboValue) {
    astroHudComboValue = combo;
    const tierSize = Math.max(1, Number(GAME_BALANCE?.royal?.streakTier) || 1);
    const tier = Math.floor(combo / tierSize);
    const remaining = tierSize - (combo % tierSize || tierSize);
    const label = combo <= 0 ? '' : tier > 0
      ? `STREAK ${combo} · TIER ${tier}`
      : `STREAK ${combo} · ${remaining} TO TIER`;
    comboNode.textContent = label;
    comboNode.dataset.visible = String(combo > 0);
    comboNode.dataset.tier = tier >= 3 ? 'high' : tier >= 1 ? 'mid' : 'low';
  }

  const objective = astroHudObjectiveData();
  const labelNode = hud.querySelector('[data-astro-objective-label]');
  const valueNode = hud.querySelector('[data-astro-objective-value]');
  const fillNode = hud.querySelector('[data-astro-objective-fill]');
  if (labelNode && labelNode.textContent !== objective.label) labelNode.textContent = objective.label;
  if (valueNode && valueNode.textContent !== objective.value) valueNode.textContent = objective.value;
  const ratio = Math.max(0, Math.min(1, Number(objective.ratio ?? (objective.current / objective.target)) || 0));
  const progressKey = `${objective.label}|${objective.value}|${ratio.toFixed(4)}`;
  if (fillNode && progressKey !== astroHudProgressKey) {
    astroHudProgressKey = progressKey;
    fillNode.style.setProperty('--progress', String(ratio));
  }
  const objectiveNode = hud.querySelector('[data-astro-objective]');
  objectiveNode?.setAttribute('aria-label', `${objective.label}, ${objective.value}`);
  const objectiveTrack = hud.querySelector('.astro-hud__track');
  const ariaProgress = String(Math.round(ratio * 100));
  if (objectiveTrack?.getAttribute('aria-valuenow') !== ariaProgress) objectiveTrack?.setAttribute('aria-valuenow', ariaProgress);

  const capacity = Math.max(1, Math.floor(Number(GameState.maxLives) || Number(GAME_BALANCE?.lives?.defaultMax) || 1));
  const current = Math.max(0, Math.min(capacity, Math.floor(Number(GameState.lives) || 0)));
  const heartsNode = hud.querySelector('[data-astro-hearts]');
  const healthKey = `${current}/${capacity}:${GameState.currentMode === 'zen'}`;
  if (heartsNode && healthKey !== astroHudHealthKey) {
    const changedIndex = astroHudPreviousLives === null || astroHudPreviousLifeCapacity !== capacity
      ? -1
      : current < astroHudPreviousLives ? current
        : current > astroHudPreviousLives ? current - 1 : -1;
    astroHudHealthKey = healthKey;
    const changedClass = current < (astroHudPreviousLives ?? current) ? 'is-damage' : 'is-heal';
    heartsNode.setAttribute('aria-label', GameState.currentMode === 'zen' ? 'Zen mode, misses are safe' : `${current} of ${capacity} lives`);
    heartsNode.innerHTML = GameState.currentMode === 'zen' ? '<span class="astro-hud__safe">SAFE</span>'
      : capacity > 5 ? `<span class="astro-hud__life-count">${current}<small>/${capacity}</small></span>`
      : Array.from({ length:capacity }, (_, index) => `<svg class="astro-hud__heart${index < current ? ' is-full' : ''}${index === changedIndex ? ` ${changedClass}` : ''}" viewBox="0 0 64 64" aria-hidden="true"><path d="M32 55C21 47 8 38 8 24c0-8 6-14 14-14 5 0 9 2 10 6 2-4 6-6 11-6 8 0 13 6 13 14 0 14-13 23-24 31z"/></svg>`).join('');
    astroHudPreviousLives = current;
    astroHudPreviousLifeCapacity = capacity;
  }

  const resourceNode = hud.querySelector('[data-astro-resource]');
  const resourceFill = hud.querySelector('[data-astro-resource-fill]');
  let resource = null;
  try {
    if (getCharDef()?.id === 'toadal') {
      const snapshot = ArcadeToadalMechanics?.snapshot?.();
      const maximum = Math.max(1, Number(ArcadeToadalMechanics?.CONFIG?.maxCharge) || 100);
      if (snapshot?.active) resource = { current:Math.max(0, Number(snapshot.charge) || 0), maximum };
    }
  } catch (_) {}
  if (resourceNode) {
    if (resourceNode.hidden === Boolean(resource)) resourceNode.hidden = !resource;
    if (resource) {
      const resourceValue = resourceNode.querySelector('[data-astro-resource-value]');
      const label = `GOLDEN ${Math.round(resource.current)} / ${Math.round(resource.maximum)}`;
      if (resourceValue && resourceValue.textContent !== label) resourceValue.textContent = label;
      const fill = String(Math.max(0, Math.min(1, resource.current / resource.maximum)));
      if (resourceFill?.style.getPropertyValue('--progress') !== fill) resourceFill?.style.setProperty('--progress', fill);
    }
  }
  const pauseButton = hud.querySelector('#astroHudPause');
  const pauseLabel = GameState.mode === GAME_MODES.PAUSED ? 'Resume game' : 'Pause game';
  if (pauseButton?.getAttribute('aria-label') !== pauseLabel) pauseButton?.setAttribute('aria-label', pauseLabel);
}

function luminousHudMotionReduced() {
  return (typeof SETTINGS !== 'undefined' && SETTINGS.reduceMotion)
    || globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;
}

function drawLuminousPanel(x, y, width, height, accent) {
  const fill = ctx.createLinearGradient(x, y, x, y + height);
  fill.addColorStop(0, 'rgba(8,17,36,0.77)');
  fill.addColorStop(1, 'rgba(7,12,27,0.58)');
  ctx.fillStyle = fill;
  ctx.beginPath(); ctx.roundRect(x, y, width, height, 15); ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(245,251,255,0.16)';
  ctx.beginPath(); ctx.roundRect(x + 2, y + 2, width - 4, height - 4, 13); ctx.stroke();
}

function drawLuminousScore(now, theme) {
  const score = Math.floor(Number(GameState.score) || 0);
  if (luminousScoreDisplay === null) {
    luminousScoreDisplay = score;
    luminousScoreTarget = score;
  } else if (score !== luminousScoreTarget) {
    luminousScoreFrom = luminousScoreDisplay;
    luminousBonusAmount = Math.max(0, score - luminousScoreTarget);
    luminousBonusUntil = luminousBonusAmount > 0 ? now + 850 : 0;
    luminousScoreTarget = score;
    luminousScoreStarted = now;
  }
  if (luminousHudMotionReduced() || score < luminousScoreFrom) {
    luminousScoreDisplay = score;
  } else if (luminousScoreDisplay !== score) {
    const fraction = Math.min(1, (now - luminousScoreStarted) / 320);
    const eased = 1 - Math.pow(1 - fraction, 3);
    luminousScoreDisplay = Math.round(luminousScoreFrom + (score - luminousScoreFrom) * eased);
  }

  if (theme === 'luminous') drawLuminousPanel(7, 4, 144, 42, 'rgba(255,204,101,0.57)');
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillStyle = theme === 'garden' ? '#f3edd0' : '#bce8f5'; ctx.font = '800 10px system-ui,sans-serif';
  ctx.fillText(themeHudText('hud.score', 'SCORE'), 18, 9);
  ctx.fillStyle = score < 0 ? '#ff8d96' : theme === 'garden' ? '#fff0a6' : '#ffe498';
  ctx.font = '900 23px ui-monospace,Consolas,monospace';
  ctx.fillText(Math.round(luminousScoreDisplay).toLocaleString('en-US'), 18, 20, 125);
  if (luminousBonusUntil > now) {
    const alpha = Math.min(1, (luminousBonusUntil - now) / 180);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(20,30,49,0.88)';
    ctx.beginPath(); ctx.roundRect(13, 50, 72, 17, 8); ctx.fill();
    ctx.strokeStyle = 'rgba(255,214,123,0.7)'; ctx.stroke();
    ctx.fillStyle = '#ffe49b'; ctx.font = '800 10px system-ui,sans-serif';
    ctx.fillText(`+${luminousBonusAmount.toLocaleString('en-US')}`, 22, 52);
    ctx.globalAlpha = 1;
  }
}

function luminousCenterData() {
  const mode = GameState.currentMode;
  if (mode === 'tc') {
    const current = Math.max(0, Number(GameState.toadalConsumption?.foodsEaten) || 0);
    const target = typeof GULPER_TOADAL_MAX_MEALS === 'number' ? GULPER_TOADAL_MAX_MEALS : 140;
    return { label:'GROWTH', current, target, value:`${current} / ${target}` };
  }
  if (mode === 'zen') {
    const current = Math.max(0, Number(ZenState.roomsRevealed) || 0);
    const target = Math.max(1, Number(GAME_BALANCE.zen.rooms) || 1);
    return { label:'ZEN GARDEN', current, target, value:`${current} / ${target}` };
  }
  const cfg = getCurrentLevelConfig();
  const current = Math.max(0, Number(ProgressionState.foodsEaten) || 0);
  const target = Math.max(1, Number(cfg.foodsToEat) || 1);
  if (mode === 'fmf') {
    const remaining = Math.max(0, Number(GameState.fmfTimeLeft) || 0);
    const time = `${Math.floor(remaining / 60)}:${String(Math.floor(remaining % 60)).padStart(2, '0')}`;
    return { label:`TIME ${time}`, current, target, value:`CATCH ${current} / ${target}` };
  }
  if (ProgressionState.transitioning) {
    const remaining = typeof countActiveWaveDrainObjects === 'function'
      ? Math.max(0, Number(countActiveWaveDrainObjects()) || 0) : 0;
    const started = Math.max(1, Number(ProgressionState.drainStartCount) || remaining || 1);
    return { label:'WAVE CLEAR', current:started - remaining, target:started, value:`${remaining} LEFT` };
  }
  return {
    label:`LEVEL ${GameState.level}`,
    current, target, value:`${current} / ${target}`,
  };
}

function drawLuminousCenter(theme) {
  const data = luminousCenterData();
  const ratio = Math.max(0, Math.min(1, data.current / data.target));
  if (theme === 'luminous') drawLuminousPanel(155, 4, 141, 42, 'rgba(79,221,255,0.60)');
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillStyle = theme === 'garden' ? '#f9f5d6' : '#d6f4ff'; ctx.font = '800 14px system-ui,sans-serif';
  ctx.fillText(data.label, 225.5, 7, 132);
  ctx.fillStyle = theme === 'garden' ? 'rgba(240,235,192,0.28)' : 'rgba(84,147,184,0.39)';
  ctx.beginPath(); ctx.roundRect(166, 24, 119, 6, 3); ctx.fill();
  if (ratio > 0) {
    const glow = ctx.createLinearGradient(166, 0, 285, 0);
    glow.addColorStop(0, theme === 'garden' ? '#d6e974' : '#3fd9ff');
    glow.addColorStop(1, theme === 'garden' ? '#79d99c' : '#66efad');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.roundRect(166, 24, Math.max(4, 119 * ratio), 6, 3); ctx.fill();
  }
  ctx.fillStyle = theme === 'garden' ? '#f5f3d8' : '#ecfaff'; ctx.font = '800 12px system-ui,sans-serif';
  ctx.fillText(data.value, 225.5, 33, 132);
}

function drawLuminousEmptyHeart(x, y, size) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,170,197,0.68)';
  ctx.fillStyle = 'rgba(18,16,37,0.74)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + size / 2, y + size);
  ctx.bezierCurveTo(x - size * 0.17, y + size * 0.48, x + size * 0.02, y - size * 0.1, x + size / 2, y + size * 0.21);
  ctx.bezierCurveTo(x + size * 0.98, y - size * 0.1, x + size * 1.17, y + size * 0.48, x + size / 2, y + size);
  ctx.fill(); ctx.stroke();
  ctx.restore();
}

function drawLuminousHealth(theme) {
  if (theme === 'luminous') drawLuminousPanel(300, 4, 90, 42, 'rgba(236,100,190,0.57)');
  if (GameState.currentMode === 'zen') {
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#f9d7e8'; ctx.font = '800 10px system-ui,sans-serif';
    ctx.fillText(themeHudText('hud.zenMisses', 'MISSES'), 345, 9);
    ctx.fillStyle = '#b8f3ae'; ctx.font = '900 15px system-ui,sans-serif';
    ctx.fillText(themeHudText('hud.zenSafe', 'SAFE'), 345, 22);
    return;
  }
  const capacity = Math.max(1, Math.floor(Number(GameState.maxLives) || Number(GAME_BALANCE?.lives?.defaultMax) || 1));
  const current = Math.max(0, Math.min(capacity, Math.floor(Number(GameState.lives) || 0)));
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillStyle = '#f9d7e8'; ctx.font = '800 10px system-ui,sans-serif';
  ctx.fillText(themeHudText('hud.lives', 'LIVES'), 345, 9);
  const heart = typeof AssetManager !== 'undefined' && typeof AssetManager.getImage === 'function'
    ? AssetManager.getImage('arcade_heart_red') : null;
  if (capacity > 5 || !heart) {
    if (heart && current > 0) ctx.drawImage(heart, 313, 22, 16, 16);
    ctx.fillStyle = '#fff1f8'; ctx.font = '900 13px system-ui,sans-serif';
    ctx.fillText(`${current}/${capacity}`, 351, 23, 55);
    return;
  }
  const size = 16;
  const gap = 2;
  const start = 345 - (capacity * size + (capacity - 1) * gap) / 2;
  for (let i = 0; i < capacity; i += 1) {
    const x = start + i * (size + gap);
    if (i < current) ctx.drawImage(heart, x, 22, size, size);
    else drawLuminousEmptyHeart(x, 22, size);
  }
}

function drawLuminousArcadeHeader(theme) {
  const now = globalThis.performance?.now?.() || Date.now();
  if (theme === 'garden') {
    ctx.fillStyle = 'rgba(19,24,17,0.49)';
    ctx.beginPath(); ctx.roundRect(7, 4, 383, 42, 15); ctx.fill();
    ctx.strokeStyle = 'rgba(244,239,192,0.48)'; ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = 'rgba(249,247,204,0.21)';
    ctx.fillRect(153, 10, 1, 31); ctx.fillRect(297, 10, 1, 31);
  }
  drawLuminousScore(now, theme);
  drawLuminousCenter(theme);
  drawLuminousHealth(theme);
  drawToadalGoldenChargeHud();
}

function drawHUD() {
  const pad=14, barH=46;
  ctx.save();
  const theme = arcadeHudTheme();
  if (theme === 'astro') {
    luminousScoreDisplay = null;
    luminousBonusUntil = 0;
    astroHudSync(globalThis.performance?.now?.() || Date.now());
  } else if (theme !== 'classic') {
    astroHudPreviousTheme = theme;
    const astroHud = document.getElementById('astroArcadeHud');
    if (astroHud) { astroHud.hidden = true; astroHud.setAttribute('aria-hidden', 'true'); }
    drawLuminousArcadeHeader(theme);
  } else {
  astroHudPreviousTheme = 'classic';
  const astroHud = document.getElementById('astroArcadeHud');
  if (astroHud) { astroHud.hidden = true; astroHud.setAttribute('aria-hidden', 'true'); }
  luminousScoreDisplay = null;
  luminousBonusUntil = 0;
  ctx.fillStyle='rgba(0,0,0,0.45)'; ctx.fillRect(0,0,CONFIG.CANVAS_W,barH);

  if (GAME_BALANCE.showHitboxes && GameState.currentMode === 'standard') {
    const dda = DDAManager.getDebug();
    ctx.font='10px monospace'; ctx.fillStyle='rgba(255,255,255,0.5)';
    ctx.textAlign='left'; ctx.fillText(`DDA: ${dda.adjustment.toFixed(2)} | C:${dda.catches} M:${dda.misses}`, pad, 42);
  }
  ctx.font='bold 13px sans-serif'; ctx.fillStyle='#90b890'; ctx.textAlign='left'; ctx.textBaseline='top';
  ctx.fillText(themeHudText('hud.score', 'SCORE'),pad,8); ctx.font='bold 22px sans-serif'; ctx.fillStyle=GameState.score < 0 ? '#ff4444' : '#ffd700'; ctx.fillText(GameState.score,pad,22);
  ctx.font='bold 13px sans-serif'; ctx.fillStyle='#90b890'; ctx.textAlign='center';
  drawHUDCenter();
  drawToadalGoldenChargeHud();
  ctx.font='bold 13px sans-serif'; ctx.fillStyle='#90b890'; ctx.textAlign='right';
  const pauseNeedsHudSpace = document.body?.classList.contains('arcade-mobile-controls-visible')
    && document.body?.dataset?.arcadePausePlacement === 'hud-reserved';
  const pauseReserveCssPx = pauseNeedsHudSpace ? 58 : 0;
  const canvasScale = Math.max(0.05, Number(window._canvasScale) || 1);
  const hudRight = CONFIG.CANVAS_W - pad - Math.ceil(pauseReserveCssPx / canvasScale);
  if (GameState.currentMode === 'zen') {
    ctx.fillText(themeHudText('hud.zenMisses', 'MISSES'), hudRight, 8);
    ctx.font='900 16px sans-serif'; ctx.fillStyle='#a8f7a0';
    ctx.fillText(themeHudText('hud.zenSafe', 'SAFE'), hudRight, 22);
  } else {
    ctx.fillText(themeHudText('hud.lives', 'LIVES'), hudRight, 8);
    drawArcadeLivesHud(hudRight, 20);
  }
  }

  // ── Game Clock overlay ────────────────────────────────────────
  if (GAME_BALANCE.showGameClock) {
    const clkTxt = GameClock.format();
    const cx = CONFIG.CANVAS_W / 2;
    const cy = barH + 6;
    ctx.font = 'bold 11px monospace';
    const tw = ctx.measureText(clkTxt).width;
    const pillW = tw + 18, pillH = 18, pillX = cx - pillW / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath(); ctx.roundRect(pillX, cy, pillW, pillH, 5); ctx.fill();
    ctx.fillStyle = '#aaffcc';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(themeHudFormat('hud.timePill', { time: clkTxt }, 'Time ' + clkTxt), cx, cy + pillH / 2);
  }

  // ── FPS counter (Settings.showFPS) ───────────────────────────
  if (typeof SETTINGS !== 'undefined' && SETTINGS.showFPS) {
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = LiveStats.fps < 40 ? '#ff6666' : '#88ff88';
    ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
    ctx.fillText(Math.round(LiveStats.fps) + ' fps', CONFIG.CANVAS_W - 4, CONFIG.CANVAS_H - 4);
  }

  // ── Ghost-frame flash (Settings.ghostFrames) ──────────────────
  // A brief white-border pulse around the canvas edge signals invincibility.
  if (typeof RuntimeState !== 'undefined' && RuntimeState.ghostTime > 0) {
    const alpha = Math.min(0.35, RuntimeState.ghostTime * 0.6);
    ctx.strokeStyle = `rgba(180,220,255,${alpha})`;
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, CONFIG.CANVAS_W - 6, CONFIG.CANVAS_H - 6);
  }

  // ── Unified Revenge Challenge tracker ─────────────────────────
  const revengeHud = typeof ArcadeRevengeChallenges !== 'undefined'
    ? ArcadeRevengeChallenges.getHudStatus()
    : null;
  if (revengeHud) {
    ctx.save();
    const label = revengeHud.progress;
    ctx.font = 'bold 10px sans-serif';
    const width = Math.min(CONFIG.CANVAS_W - 20, ctx.measureText(label).width + 18);
    const x = (CONFIG.CANVAS_W - width) / 2;
    const y = 43;
    ctx.fillStyle = revengeHud.hazardHit ? 'rgba(118,24,36,0.9)' : 'rgba(68,20,84,0.86)';
    ctx.beginPath();
    ctx.roundRect(x, y, width, 19, 8);
    ctx.fill();
    ctx.strokeStyle = revengeHud.hazardHit ? '#ff6a72' : '#ff8bd8';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#fff4fb';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, CONFIG.CANVAS_W / 2, y + 9.5, width - 10);
    ctx.restore();
  }

  drawLivingFeastForecast();
  ctx.restore();

  if (theme !== 'astro') drawStreakIndicator();
  drawActiveEffects();
}

function drawStreakIndicator() {
  // Zen uses combo only to shape the rising catch tone; its score is driven by
  // room depth and affinity, so the normal SCORE TIER strip would be false UI.
  if (GameState.currentMode === 'zen') return;
  const combo = GameState.combo;
  if (combo <= 0) return;

  const maxDots   = 9;
  const dotR      = 5;
  const dotGap    = 14;
  const tierSize  = Math.max(1, Number(GAME_BALANCE.royal.streakTier) || 1);
  const shown     = Math.min(combo, maxDots);
  const totalW    = shown * dotGap - (dotGap - dotR * 2);
  const startX    = CONFIG.CANVAS_W / 2 - totalW / 2 + dotR;
  const y         = CONFIG.CANVAS_H - 22;
  const now       = Date.now();

  ctx.save();
  const tier = Math.floor(combo / tierSize);
  const remaining = tierSize - (combo % tierSize || tierSize);
  const streakText = tier > 0
    ? themeHudFormat('hud.streakTierActive', { count: combo, tier }, `STREAK ${combo} · SCORE TIER ${tier}`)
    : themeHudFormat('hud.streakToTier', { count: combo, remaining }, `STREAK ${combo} · ${remaining} TO SCORE TIER`);
  ctx.font = '800 9px sans-serif';
  ctx.fillStyle = tier > 0 ? '#ffe7a0' : 'rgba(236, 247, 232, 0.90)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.72)';
  ctx.shadowBlur = 4;
  ctx.fillText(streakText, CONFIG.CANVAS_W / 2, y - 13);
  ctx.shadowBlur = 0;
  for (let i = 0; i < shown; i++) {
    const tier     = Math.floor((i + 1) / tierSize);
    const isMax    = combo >= maxDots;
    const pulse    = 1 + Math.sin(now / 180 + i * 0.6) * 0.3;
    const x        = startX + i * dotGap;

    let color;
    if (isMax)        color = `rgba(255,80,80,${0.55 + pulse * 0.2})`;
    else if (tier > 0) color = `rgba(255,215,0,${0.5 + pulse * 0.25})`;
    else               color = `rgba(180,180,180,0.35)`;

    const glowSize = tier > 0 ? dotR * 2.8 * pulse : dotR * 1.6;
    const glowColor = isMax ? 'rgba(255,80,80,0.18)' : tier > 0 ? 'rgba(255,215,0,0.15)' : 'transparent';
    if (tier > 0 || isMax) {
      ctx.beginPath();
      ctx.arc(x, y, glowSize, 0, Math.PI * 2);
      ctx.fillStyle = glowColor;
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(x, y, dotR * (tier > 0 ? pulse * 0.9 : 0.85), 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    if ((i + 1) % tierSize === 0 && i < shown - 1) {
      ctx.beginPath();
      ctx.arc(x + dotGap * 0.5, y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fill();
    }
  }
  ctx.restore();
}
