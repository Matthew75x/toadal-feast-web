// Result/reward artwork only. Never used as gameplay animation or unlock data.
const ArcadeReactionArt = (() => {
  const ROOT = 'assets/images/characters/reactions-v1/';
  const PRINCESS_ROOT = 'assets/images/characters/curated-highres/princess/';
  const PRINCESS_IDLE = PRINCESS_ROOT + 'lilly_idle_1f_512_2026-09-08.png';
  const PRINCESS_HURT = PRINCESS_ROOT + 'lilly_hurt_1f_512_2026-09-08.png';
  const IDS = Object.freeze(['classic','fire','pelican','bob','count']);
  // Flytrap's supplied finish images contain a semi-transparent full-frame
  // olive backdrop rather than a clean character cutout. Keep those source
  // files quarantined for traceability and fail back to the transparent
  // canonical gameplay portrait until an approved transparent derivative is
  // available. Gulper, Royal, and Chomper likewise remain fallback-only until
  // dedicated reaction art is approved.
  const FALLBACK_ONLY_IDS = Object.freeze(['gulper','royal','chomper','flytrap']);
  const sessions = new Map();
  function reduced() { return (typeof SETTINGS !== 'undefined' && SETTINGS.reduceMotion) || globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches; }
  function resolve(characterId, tone = 'neutral') {
    const id = String(characterId || '');
    const character = typeof CHARACTER_DATA !== 'undefined' ? CHARACTER_DATA.find(c => c.id === id) : null;
    const state = tone === 'celebrate' ? 'celebrate'
      : tone === 'dizzy' || tone === 'hurt_dizzy' ? (id === 'pelican' ? 'hurt_dizzy' : 'sad')
        : tone === 'sad' || tone === 'disappointed' ? 'sad' : 'happy';
    // Princess Lily's old reactions-v1 derivatives predate the approved September
    // replacement family. Until owner-approved modern reaction derivatives exist,
    // use current Lily frames rather than reviving the obsolete pink_princess design.
    const princessSrc = id === 'princess' ? (state === 'sad' ? PRINCESS_HURT : PRINCESS_IDLE) : '';
    // Bird's supplied negative pose is hurt/dizzy, not an approved sad pose.
    const specialized = !princessSrc && IDS.includes(id) && !(id === 'pelican' && state === 'sad');
    return Object.freeze({ characterId:id, characterName:character?.name || 'Character', tone, state,
      src:princessSrc || (specialized ? ROOT + id + '/' + state + '.png' : character?.src || ''),
      fallbackSrc:id === 'princess' ? PRINCESS_IDLE : character?.src || '', specialized, frames:specialized && id === 'bob' ? 4 : 1,
      frameWidth:543, frameHeight:724,
      alt:(character?.name || 'Character') + ' — ' + (princessSrc ? 'current Lily portrait' : specialized ? state.replace('_',' / ') : 'result portrait') });
  }
  function toneForResult(payload = {}, outcome = {}) {
    if (outcome.checkpoint || payload.feastVictory || payload.isNewBest || outcome.newHighScore || payload.badge === 'victory') return 'celebrate';
    if (payload.voluntaryQuit || payload.badge === 'cashout' || payload.endCause === 'cashout' || payload.badge === 'timer') return 'neutral';
    if (outcome.tone === 'dizzy') return 'dizzy';
    // The evaluator uses `neutral` for an ordinary completion and `proud`
    // for a good run/order. Those are positive/default result states and
    // should use the canonical happy art. Only explicit failure tones map to
    // sad; otherwise an unknown future positive tone fails toward happy.
    if (outcome.tone === 'determined' || outcome.tone === 'sad'
      || payload.badge === 'miss' || payload.badge === 'hazard'
      || payload.endCause === 'miss' || payload.endCause === 'hazard'
      || outcome.hazard === true) return 'sad';
    return 'happy';
  }
  function clear(image) {
    const session = sessions.get(image);
    if (!session) return;
    cancelAnimationFrame(session.raf);
    session.source.onload = null; session.source.onerror = null;
    session.canvas?.remove(); image.style.display = session.display;
    image.onerror = null;
    sessions.delete(image);
  }
  function clearAll() { for (const image of sessions.keys()) clear(image); }
  function present(image, descriptor) {
    if (!image) return;
    clear(image);
    const d = descriptor;
    image.alt = d.alt; image.dataset.specialized = String(d.specialized);
    image.dataset.reactionState = d.state;
    image.dataset.reactionTone = d.tone;
    const reducedMotion = reduced();
    image.dataset.reducedMotion = String(reducedMotion);
    image.closest?.('.go-character-portrait')?.setAttribute('data-reduced-motion', String(reducedMotion));
    image.style.filter = 'none';
    const session = { raf:0, canvas:null, source:image, display:image.style.display, elapsed:0, last:0, frame:-1 };
    sessions.set(image, session);
    const fallback = () => {
      if (sessions.get(image) !== session) return;
      clear(image); image.dataset.specialized = 'false';
      image.onerror = () => { image.onerror = null; image.style.visibility = 'hidden'; };
      image.src = d.fallbackSrc; image.alt = d.characterName + ' result portrait';
    };
    image.style.visibility = '';
    if (d.frames !== 4) { image.onerror = fallback; image.src = d.src; return; }
    const canvas = document.createElement('canvas');
    canvas.width = d.frameWidth; canvas.height = d.frameHeight;
    canvas.className = image.className; canvas.dataset.reactionTone = d.tone;
    canvas.dataset.reducedMotion = String(reducedMotion);
    canvas.setAttribute('role','img'); canvas.setAttribute('aria-label',d.alt);
    canvas.style.objectFit = 'contain'; canvas.style.filter = 'none';
    session.canvas = canvas; session.source = new Image();
    const paint = now => {
      if (sessions.get(image) !== session) return;
      if (!image.isConnected || !canvas.getClientRects().length) { clear(image); return; }
      if (!document.hidden) session.elapsed += session.last ? Math.min(0.1,(now-session.last)/1000) : 0;
      session.last = now;
      const calm = reduced(), celebrate = d.state === 'celebrate', fps = celebrate ? 8 : 5;
      const frame = calm ? (celebrate ? 3 : 0) : celebrate ? Math.min(7,Math.floor(session.elapsed*fps)) % 4 : Math.floor(session.elapsed*fps) % 4;
      if (frame !== session.frame) {
        const ctx = canvas.getContext('2d'); ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.drawImage(session.source,frame*d.frameWidth,0,d.frameWidth,d.frameHeight,0,0,canvas.width,canvas.height);
        session.frame = frame;
      }
      if (!calm && !(celebrate && session.elapsed >= 1)) session.raf = requestAnimationFrame(paint);
    };
    session.source.onload = () => {
      if (sessions.get(image) !== session) return;
      image.style.display = 'none'; image.after(canvas); session.raf = requestAnimationFrame(paint);
    };
    session.source.onerror = fallback; session.source.src = d.src;
  }
  if (typeof EventBus !== 'undefined') EventBus.on('gameStarted',clearAll);
  return Object.freeze({ resolve, present, toneForResult, clear, clearAll, ids:IDS, fallbackOnlyIds:FALLBACK_ONLY_IDS });
})();
globalThis.ArcadeReactionArt = ArcadeReactionArt;
