(function (root) {
  'use strict';

  let active = null;
  let cueActive = null;
  let placementActive = null;
  const DEFAULT_AVOID = Object.freeze([
    '.mob-joystick-ring', '#mobJoystickKnob', '#mobShoot', '#mobActionSecondary', '#mobActionTertiary', '#mobPause',
    '[data-vf-pause]', '#btnPause', '#btnSettings', '[data-vf-help-pause]', '[data-vf-settings-pause]',
    '[data-vf-restart]', '[data-vf-pause-exit]',
    '#puzzle-top-undo-btn', '#puzzle-top-retry-btn', '#puzzle-top-bomb-speed-btn', '#puzzle-top-bomb-skip-btn',
  ]);

  function viewport() {
    const vv = root.visualViewport;
    return {
      left: Number(vv?.offsetLeft) || 0,
      top: Number(vv?.offsetTop) || 0,
      width: Number(vv?.width) || root.innerWidth || document.documentElement.clientWidth || 0,
      height: Number(vv?.height) || root.innerHeight || document.documentElement.clientHeight || 0,
    };
  }

  function resolve(target) {
    let element = null;
    try {
      element = typeof target === 'function' ? target()
        : typeof target === 'string' ? document.querySelector(target)
          : target;
    } catch (_) { return null; }
    if (!element || !element.isConnected) return null;
    const style = root.getComputedStyle ? root.getComputedStyle(element) : null;
    const rect = element.getBoundingClientRect?.();
    const view = viewport();
    if (!rect || rect.width <= 0 || rect.height <= 0 || rect.bottom <= view.top || rect.right <= view.left
      || rect.top >= view.top + view.height || rect.left >= view.left + view.width
      || style?.display === 'none' || style?.visibility === 'hidden') return null;
    return { element, rect };
  }

  function clearCue() {
    if (!cueActive) return;
    cueActive.element?.classList?.remove('feast-genie-cue-target');
    cueActive.element?.removeAttribute?.('data-feast-genie-cue');
    cueActive = null;
  }

  function cue(target) {
    clearCue();
    const resolved = resolve(target);
    if (!resolved) return null;
    resolved.element.classList.add('feast-genie-cue-target');
    resolved.element.setAttribute('data-feast-genie-cue', 'true');
    cueActive = { element:resolved.element };
    return { element:resolved.element, clear:clearCue };
  }

  function clearSpotlight() {
    if (!active) return;
    active.resize?.disconnect?.();
    active.cleanup?.();
    if (active.gate) document.removeEventListener('pointerdown', active.gate, true);
    if (active.keyGate) document.removeEventListener('keydown', active.keyGate, true);
    active.node?.remove();
    active = null;
  }

  function clearPlacement() {
    if (!placementActive) return;
    placementActive.resize?.disconnect?.();
    placementActive.cleanup?.();
    placementActive = null;
  }

  function clear() {
    clearCue();
    clearSpotlight();
    clearPlacement();
  }

  function spotlight(target, options = {}) {
    clearCue();
    clearSpotlight();
    const initial = resolve(target);
    if (!initial) { options.onUnavailable?.(); return null; }

    const node = document.createElement('div');
    node.className = 'feast-genie-spotlight';
    node.setAttribute('aria-hidden', 'true');
    node.style.position = 'fixed';
    node.style.inset = '0';
    node.style.zIndex = String(options.zIndex || 9998);
    node.style.pointerEvents = 'none';

    const panels = ['top','right','bottom','left'].map(side => {
      const panel = document.createElement('div');
      panel.className = `feast-genie-spotlight__panel feast-genie-spotlight__panel--${side}`;
      panel.style.position = 'fixed';
      panel.style.background = 'rgba(20,27,25,.52)';
      panel.style.pointerEvents = 'none';
      node.appendChild(panel);
      return panel;
    });
    const ring = document.createElement('div');
    ring.className = 'feast-genie-spotlight__ring';
    ring.style.position = 'fixed';
    ring.style.pointerEvents = 'none';
    node.appendChild(ring);
    document.body.appendChild(node);

    const pad = Math.max(4, Number(options.padding) || 7);
    const paint = () => {
      const current = resolve(target);
      if (!current) { clearSpotlight(); options.onUnavailable?.(); return; }
      const view = viewport();
      const r = current.rect;
      const left = Math.max(view.left, r.left - pad);
      const top = Math.max(view.top, r.top - pad);
      const right = Math.min(view.left + view.width, r.right + pad);
      const bottom = Math.min(view.top + view.height, r.bottom + pad);
      const fullRight = view.left + view.width;
      const fullBottom = view.top + view.height;
      Object.assign(panels[0].style, { left:`${view.left}px`, top:`${view.top}px`, width:`${view.width}px`, height:`${Math.max(0,top-view.top)}px` });
      Object.assign(panels[1].style, { left:`${right}px`, top:`${top}px`, width:`${Math.max(0,fullRight-right)}px`, height:`${Math.max(0,bottom-top)}px` });
      Object.assign(panels[2].style, { left:`${view.left}px`, top:`${bottom}px`, width:`${view.width}px`, height:`${Math.max(0,fullBottom-bottom)}px` });
      Object.assign(panels[3].style, { left:`${view.left}px`, top:`${top}px`, width:`${Math.max(0,left-view.left)}px`, height:`${Math.max(0,bottom-top)}px` });
      Object.assign(ring.style, { left:`${left}px`, top:`${top}px`, width:`${Math.max(0,right-left)}px`, height:`${Math.max(0,bottom-top)}px` });
    };

    let raf = 0;
    const schedule = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; paint(); }); };
    root.addEventListener?.('scroll', schedule, true);
    root.addEventListener?.('resize', schedule);
    root.visualViewport?.addEventListener?.('resize', schedule);
    root.visualViewport?.addEventListener?.('scroll', schedule);
    const resize = root.ResizeObserver ? new ResizeObserver(schedule) : null;
    resize?.observe(initial.element);

    const gate = options.blocking ? event => {
      const current = resolve(target)?.element;
      const card = document.querySelector('[data-feast-genie-card]');
      if (card?.contains(event.target)) return;
      if (options.allowTargetInteraction === true && current?.contains(event.target)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    } : null;
    const keyGate = options.blocking ? event => {
      const card = document.querySelector('[data-feast-genie-card]');
      if (!card || card.hidden) return;
      const focusables = [...card.querySelectorAll('button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')];
      if (event.key === 'Tab' && focusables.length) {
        const first = focusables[0], last = focusables[focusables.length-1];
        const activeElement = document.activeElement;
        if (event.shiftKey && (activeElement === first || !card.contains(activeElement))) { event.preventDefault(); last.focus(); return; }
        if (!event.shiftKey && (activeElement === last || !card.contains(activeElement))) { event.preventDefault(); first.focus(); return; }
      }
      if (!card.contains(event.target) && !(options.allowTargetInteraction === true && resolve(target)?.element?.contains(event.target))) {
        // Prevent keyboard activation of controls underneath a modal tutorial.
        if (['Enter',' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key)) {
          event.preventDefault(); event.stopImmediatePropagation();
        }
      }
    } : null;
    if (gate) document.addEventListener('pointerdown', gate, true);
    if (keyGate) document.addEventListener('keydown', keyGate, true);

    const cleanup = () => {
      if (raf) cancelAnimationFrame(raf);
      root.removeEventListener?.('scroll', schedule, true);
      root.removeEventListener?.('resize', schedule);
      root.visualViewport?.removeEventListener?.('resize', schedule);
      root.visualViewport?.removeEventListener?.('scroll', schedule);
    };
    active = { node, resize, gate, keyGate, cleanup };
    paint();
    return { element:initial.element, clear:clearSpotlight };
  }

  function overlapArea(a, b) {
    if (!a || !b) return 0;
    const w = Math.max(0, Math.min(a.right,b.right) - Math.max(a.left,b.left));
    const h = Math.max(0, Math.min(a.bottom,b.bottom) - Math.max(a.top,b.top));
    return w*h;
  }

  function visibleAvoidRects(extra = []) {
    const selectors = [...DEFAULT_AVOID, ...extra];
    const rects = [];
    for (const selector of selectors) {
      let elements = [];
      try { elements = [...document.querySelectorAll(selector)]; } catch (_) {}
      for (const element of elements) {
        const resolved = resolve(element);
        if (resolved) rects.push(resolved.rect);
      }
    }
    return rects;
  }

  function placeCard(card, target, options = {}) {
    if (!card || card.hidden) return null;
    const view = viewport();
    const margin = Math.max(8, Number(options.margin) || 12);
    const cardRect = card.getBoundingClientRect();
    const w = Math.min(cardRect.width || 320, Math.max(120, view.width - margin*2));
    const h = cardRect.height || 110;
    const targetRect = resolve(target)?.rect || null;
    const mobile = view.width <= 700 || view.height <= 500 || document.getElementById('mobileControls')?.getAttribute('aria-hidden') === 'false';
    const controlAvoid = visibleAvoidRects(options.avoidSelectors || []);
    if (mobile && options.avoidTopHud !== false) {
      const hudDepth = Math.min(120, Math.max(58, view.height * .13));
      controlAvoid.push({ left:view.left, top:view.top, right:view.left + view.width, bottom:view.top + hudDepth });
    }

    const clamp = (value,min,max) => Math.max(min,Math.min(max,value));
    const candidates = [];
    const add = (name,left,top,priority=0) => {
      left = clamp(left, view.left + margin, view.left + view.width - w - margin);
      top = clamp(top, view.top + margin, view.top + view.height - h - margin);
      const rect = { left, top, right:left+w, bottom:top+h };
      // Covering the thing being explained is much worse than ordinary visual
      // crowding.  Control overlap is next-most expensive.  The small priority
      // term only breaks ties between otherwise safe placements.
      const targetOverlap = targetRect ? overlapArea(rect,targetRect) : 0;
      const controlOverlap = controlAvoid.reduce((sum,r) => sum + overlapArea(rect,r), 0);
      candidates.push({
        name,left,top,rect,targetOverlap,controlOverlap,
        score:(targetOverlap * 1000) + (controlOverlap * 25) + priority,
      });
    };

    if (targetRect) {
      add('above', targetRect.left + targetRect.width/2 - w/2, targetRect.top - h - 14, mobile ? 35 : 0);
      add('below', targetRect.left + targetRect.width/2 - w/2, targetRect.bottom + 14, mobile ? 35 : 0);
      add('left', targetRect.left - w - 14, targetRect.top + targetRect.height/2 - h/2, mobile ? 90 : 20);
      add('right', targetRect.right + 14, targetRect.top + targetRect.height/2 - h/2, mobile ? 90 : 20);
    }

    // The Arcade canvas intentionally preserves its portrait playfield in short
    // landscape viewports. When that creates a genuine side gutter, prefer it
    // for guidance instead of covering the center of the game. Control overlap
    // scoring still decides between left/right, so this remains safe for two-hand UI.
    if (mobile && view.width > view.height * 1.35) {
      const stageRect = resolve('#gameCanvas')?.rect || null;
      if (stageRect) {
        const leftGutter = stageRect.left - view.left;
        const rightGutter = (view.left + view.width) - stageRect.right;
        const gutterTop = view.top + Math.max(margin, (view.height - h) / 2);
        if (leftGutter >= w + margin * 2) add('stage-left-gutter', view.left + margin, gutterTop, -120);
        if (rightGutter >= w + margin * 2) add('stage-right-gutter', stageRect.right + margin, gutterTop, -120);
      }
    }
    // Mobile layouts can have both the movement pad and an action cluster along
    // the bottom.  Include neutral safe-zone candidates so a card is never
    // forced on top of a control merely because it cannot fit directly next to
    // the highlighted target.
    add('top', view.left + (view.width-w)/2, view.top + (mobile ? Math.min(150, Math.max(72, view.height*.16)) : Math.max(margin, Math.min(86, view.height*.08))), mobile ? 0 : 90);
    add('upper', view.left + (view.width-w)/2, view.top + view.height*.24 - h/2, mobile ? 12 : 100);
    add('middle', view.left + (view.width-w)/2, view.top + view.height*.46 - h/2, mobile ? 24 : 110);
    add('lower', view.left + (view.width-w)/2, view.top + view.height*.68 - h/2, mobile ? 48 : 90);
    add('bottom', view.left + (view.width-w)/2, view.top + view.height - h - margin, mobile ? 140 : 40);

    candidates.sort((a,b) => a.score-b.score);
    const best = candidates[0];
    Object.assign(card.style, {
      left:`${Math.round(best.left)}px`, top:`${Math.round(best.top)}px`, right:'auto', bottom:'auto', transform:'none',
    });
    card.dataset.placement = best.name;
    return best;
  }

  function trackCard(card, target, options = {}) {
    clearPlacement();
    if (!card) return null;
    let raf = 0;
    const paint = () => placeCard(card,target,options);
    const schedule = () => { if (!raf) raf = requestAnimationFrame(() => { raf=0; paint(); }); };
    root.addEventListener?.('resize', schedule);
    root.addEventListener?.('scroll', schedule, true);
    root.visualViewport?.addEventListener?.('resize', schedule);
    root.visualViewport?.addEventListener?.('scroll', schedule);
    const targetElement = resolve(target)?.element;
    const resize = root.ResizeObserver ? new ResizeObserver(schedule) : null;
    if (targetElement) resize?.observe(targetElement);
    resize?.observe(card);
    const cleanup = () => {
      if (raf) cancelAnimationFrame(raf);
      root.removeEventListener?.('resize', schedule);
      root.removeEventListener?.('scroll', schedule, true);
      root.visualViewport?.removeEventListener?.('resize', schedule);
      root.visualViewport?.removeEventListener?.('scroll', schedule);
    };
    placementActive = { resize, cleanup };
    paint();
    return { clear:clearPlacement };
  }

  root.FeastGenieTarget = Object.freeze({ resolve, cue, spotlight, placeCard, trackCard, clearCue, clearSpotlight, clearPlacement, clear });
})(typeof globalThis !== 'undefined' ? globalThis : window);
