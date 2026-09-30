(function (root) {
  'use strict';

  class FeastGenieGuide {
    constructor(options = {}) {
      this.options = options;
      this.active = null;
      this.timer = null;
      this.context = null;
      this.speakerIndex = 0;
      this.sequenceSpeakers = new Map();
      this.lifecycle = { suspended:false, timerRemaining:null };
      this._lifecycleObserver = null;
      this._lifecycleNodes = [];
      this._ensureLifecycleObserver();
    }

    request(step, context = {}) { return this._start(step, context, false); }
    manual(step, context = {}) { return this._start(step, context, true); }
    attach(context = {}) {
      this.context = context;
      return () => { if (this.context === context) this.context = null; this.dismiss('detach'); };
    }
    present(payload, context = {}) {
      const input = payload?.step || payload;
      const step = { ...input, mode:payload?.mode || input?.mode || this.context?.mode };
      return this._start(step, { ...this.context, ...context, payload }, !!payload?.manual);
    }

    _speaker(step) {
      if (step.speaker && step.speaker !== 'rotating') return step.speaker;
      const sequence = String(step.sequence || `${step.mode || 'global'}:default`);
      if (this.sequenceSpeakers.has(sequence)) return this.sequenceSpeakers.get(sequence);
      const list = root.FeastGenieRegistry?.speakers || ['sweet','fruity','savoury'];
      const speaker = list[this.speakerIndex % list.length];
      this.speakerIndex += 1;
      this.sequenceSpeakers.set(sequence, speaker);
      return speaker;
    }

    _start(step, context, manual) {
      if (!step?.id) return false;
      const guidance = root.FeastGenieGuidance;
      const now = Date.now();
      if (!manual && guidance) {
        if (guidance.preference() === 'off') return false;
        if (step.mastery && guidance.mastered(step.mastery)) {
          if (this.active?.step?.id === step.id) this.dismiss('complete');
          return false;
        }
      }
      // Re-presenting the same unresolved step is a refresh, not a new
      // interruption. Do this before budget/recent checks so an owning mode can
      // safely resync without accidentally falling back to a duplicate coach.
      if (this.active?.step?.id === step.id) {
        this.active.step = { ...this.active.step, ...step };
        this.active.context = { ...this.active.context, ...context };
        if (this.active.level === 'hint' || this.active.level === 'spotlight') this._renderCard(this.active.level);
        return true;
      }
      if (!manual && guidance) {
        if (guidance.suppressed(step.id)) return false;
        if (!guidance.automaticBudget(now)) return false;
        if (guidance.recentVisible(now, Number(step.minInterruptionGapMs) || 30000)) return false;
      }
      this.dismiss('replace');
      this.active = {
        step, context, manual,
        level:'discovery',
        speaker:this._speaker(step),
        visibleRecorded:false,
      };
      this.lifecycle.suspended = false;
      this.lifecycle.timerRemaining = null;
      const delays = step.delays || {};
      const scale = !manual && guidance?.preference?.() === 'full' ? .6 : 1;
      const startLevel = manual ? 'hint' : String(step.startLevel || 'discovery');
      if (startLevel === 'hint' || startLevel === 'spotlight') {
        this._schedule(() => this._show(startLevel), 0);
      } else {
        const cueAt = Math.max(0, Number(delays.cue ?? 6000) * scale);
        this._schedule(() => this._show('cue'), cueAt);
      }
      return true;
    }

    _recordVisible() {
      if (!this.active || this.active.manual || this.active.visibleRecorded) return;
      this.active.visibleRecorded = true;
      root.FeastGenieGuidance?.recordVisibleAutomatic?.();
    }

    _renderCard(level) {
      const step = this.active.step;
      const card = this._card();
      card.hidden = false;
      // A blocking card is a dialog, so the accessibility layer makes it inert
      // while hidden. The same node is reused for later nonblocking guidance;
      // restore its input and accessibility state before presenting it again.
      if ('inert' in card) card.inert = false;
      card.removeAttribute('aria-hidden');
      card.dataset.level = level;
      if (step.blocking === true) {
        card.setAttribute('role', 'dialog');
        card.setAttribute('aria-modal', 'true');
      } else {
        card.setAttribute('role', 'status');
        card.removeAttribute('aria-modal');
      }
      card.querySelector('[data-genie-message]').textContent = step.message || '';
      card.querySelector('[data-genie-speaker]').textContent = `${this.active.speaker || 'sweet'} · Feast Genie`;
      const art = root.FeastGenieRegistry?.resolve?.(this.active.speaker, step.pose || (step.target ? 'target' : 'explaining'));
      const portrait = card.querySelector('[data-genie-portrait]');
      if (art) {
        portrait.hidden = false;
        portrait.style.backgroundImage = `url("${art.asset}")`;
        portrait.style.backgroundPosition = art.backgroundPosition;
      } else portrait.hidden = true;

      const primary = card.querySelector('[data-genie-primary]');
      if (typeof step.onAction === 'function') {
        primary.hidden = false;
        primary.textContent = step.actionLabel || 'Continue';
        primary.onclick = event => {
          event.preventDefault();
          event.stopPropagation();
          try { step.onAction({ step, context:this.active?.context, guide:this }); } catch (error) { console.error('[FeastGenieGuide] primary action failed', error); }
        };
      } else {
        primary.hidden = true;
        primary.onclick = null;
      }
      root.FeastGenieTarget?.trackCard?.(card, step.target, { side:step.side, avoidSelectors:step.avoidSelectors });
      if (step.blocking === true && !primary.hidden) requestAnimationFrame(() => primary.focus?.({ preventScroll:true }));
      this.options.announce?.(step.message || '');
      return card;
    }

    _show(level) {
      if (!this.active || this.lifecycle.suspended) return false;
      clearTimeout(this.timer); this.timer = null;
      root.FeastGenieTarget?.clearCue?.();
      this.active.level = level;
      const step = this.active.step;
      const scale = !this.active.manual && root.FeastGenieGuidance?.preference?.() === 'full' ? .6 : 1;

      if (level === 'cue') {
        const cue = root.FeastGenieTarget?.cue?.(step.target);
        // A cue without a currently resolvable target is not visible. Fall
        // through to the card so the player still receives actionable help and
        // the interruption budget reflects a real presentation.
        if (!cue) return this._show('hint');
        this._recordVisible();
        const cueDelay = Number(step.delays?.cue ?? 6000);
        const hintDelay = Number(step.delays?.hint ?? 12000);
        this._schedule(() => this._show('hint'), Math.max(500, (hintDelay - cueDelay) * scale));
        return true;
      }

      if (level === 'hint') {
        // Escalation can be requested by a live mode event while a spotlight
        // is active. Remove its mask/gates before rendering the less intrusive
        // card level.
        root.FeastGenieTarget?.clearSpotlight?.();
        this._renderCard(level);
        this._recordVisible();
        const targetAvailable = step.target && root.FeastGenieTarget?.resolve?.(step.target);
        if (step.maxLevel === 'spotlight' && targetAvailable) {
          const hintDelay = Number(step.delays?.hint ?? 12000);
          const spotDelay = Number(step.delays?.spotlight ?? 18000);
          this._schedule(() => this._show('spotlight'), Math.max(800, (spotDelay - hintDelay) * scale));
        }
        return true;
      }

      if (level === 'spotlight') {
        this._renderCard(level);
        this._recordVisible();
        const result = root.FeastGenieTarget?.spotlight?.(step.target, {
          blocking:!!step.blocking,
          allowTargetInteraction:step.allowTargetInteraction === true,
          onUnavailable:() => { if (this.active) this._show('hint'); },
        });
        return !!result;
      }
      return false;
    }

    escalate(level = 'hint') { return this.active ? this._show(level) : false; }

    updateActive(patch = {}) {
      if (!this.active) return false;
      this.active.step = { ...this.active.step, ...patch };
      if (this.active.level === 'hint' || this.active.level === 'spotlight') this._renderCard(this.active.level);
      return true;
    }

    _card() {
      let card = document.querySelector('[data-feast-genie-card]');
      if (!card) {
        card = document.createElement('section');
        card.dataset.feastGenieCard = '';
        // The card is body-level floating guidance. Keep it outside the shared
        // modal background sweep; blocking lessons use their own pointer and
        // keyboard gate while the live mode shell (including Pause) remains
        // physically touchable on mobile.
        card.dataset.a11yPersistent = 'true';
        card.setAttribute('role', 'status');
        card.setAttribute('aria-live', 'polite');
        card.innerHTML = '<span class="feast-genie-portrait" data-genie-portrait aria-hidden="true"></span>'
          + '<div class="feast-genie-copy"><span class="feast-genie-speaker" data-genie-speaker></span>'
          + '<p class="feast-genie-message" data-genie-message></p><div class="feast-genie-actions">'
          + '<button type="button" class="feast-genie-primary" data-genie-primary hidden>Continue</button>'
          + '<button type="button" data-genie-dismiss>Skip this</button>'
          + '<button type="button" data-genie-off>Turn off Genie tips</button></div></div>';
        card.querySelector('[data-genie-dismiss]').onclick = () => this.dismiss('user');
        card.querySelector('[data-genie-off]').onclick = () => {
          root.FeastGenieGuidance?.setPreference?.('off');
          this.dismiss('user');
        };
        document.body.appendChild(card);
      }
      return card;
    }

    _releaseCardFocus(card) {
      const active = document.activeElement;
      if (!card?.contains(active)) return false;
      try { active.blur?.(); } catch (_) {}
      return !card.contains(document.activeElement);
    }

    dismiss(reason = 'user') {
      if (reason && typeof reason === 'object') reason = reason.reason || 'user';
      clearTimeout(this.timer); this.timer = null;
      root.FeastGenieTarget?.clear?.();
      const card = document.querySelector('[data-feast-genie-card]');
      if (card) {
        this._releaseCardFocus(card);
        card.hidden = true;
        card.removeAttribute('data-level');
        card.removeAttribute('data-placement');
      }
      if (this.active && (reason === 'user' || reason === 'settings-off' || reason === 'replace') && !this.active.manual) {
        if (reason === 'user') root.FeastGenieGuidance?.recordDismissal?.(this.active.step.id);
        try { this.active.step.onDismiss?.({ reason, step:this.active.step, context:this.active.context }); } catch (_) {}
      }
      this.active = null;
      this.lifecycle.suspended = false;
      this.lifecycle.timerRemaining = null;
    }

    complete(result = {}) {
      const requested = String(result?.mastery || result?.id || '');
      if (requested) root.FeastGenieGuidance?.markMastery?.(requested);
      if (!this.active) return false;
      const expectedMastery = String(this.active.step.mastery || '');
      const expectedId = String(this.active.step.id || '');
      const matches = result?.force === true || !requested || requested === expectedMastery || requested === expectedId || String(result?.id || '') === expectedId;
      if (matches) this.dismiss('complete');
      return matches;
    }

    markMastery(id) { return root.FeastGenieGuidance?.markMastery?.(id) === true; }
    resetSequenceSpeakers() { this.sequenceSpeakers.clear(); return true; }
    destroy() { this.dismiss('destroy'); }
    state() {
      return this.active ? {
        id:this.active.step.id,
        mastery:this.active.step.mastery || null,
        level:this.active.level,
        manual:this.active.manual,
        speaker:this.active.speaker,
        placement:document.querySelector('[data-feast-genie-card]')?.dataset?.placement || null,
        suspended:this.lifecycle.suspended === true,
      } : null;
    }

    _schedule(callback, delay) {
      clearTimeout(this.timer);
      const wait = Math.max(0, Number(delay) || 0);
      this.lifecycle.timerRemaining = wait;
      this._timerStartedAt = Date.now();
      this.timer = setTimeout(() => {
        this.timer = null;
        this.lifecycle.timerRemaining = null;
        callback();
      }, wait);
    }

    _lifecycleSuppressed() {
      const body = document.body;
      if (!body) return false;
      if (body.classList.contains('panel-open') || body.classList.contains('shared-pause-open') || body.classList.contains('mode-owned-pause-open') || body.classList.contains('puzzle-pause-open')) return true;
      return ['panelSettings', 'pauseOverlay', 'pauseModal', 'planningModal', 'puzzle-planning']
        .some(id => { const node = document.getElementById(id); return !!node && !node.classList.contains('hidden') && node.getAttribute('aria-hidden') !== 'true'; });
    }

    _ensureLifecycleObserver() {
      if (this._lifecycleObserver || typeof document === 'undefined' || typeof MutationObserver === 'undefined') return;
      const sync = () => this._syncLifecycle();
      this._lifecycleObserver = new MutationObserver(sync);
      const observe = () => {
        if (!document.body) return false;
        this._lifecycleObserver.observe(document.body, { attributes:true, attributeFilter:['class'] });
        this._lifecycleNodes = ['panelSettings','pauseOverlay','pauseModal','planningModal','puzzle-planning']
          .map(id => document.getElementById(id)).filter(Boolean);
        this._lifecycleNodes.forEach(node => this._lifecycleObserver.observe(node, { attributes:true, attributeFilter:['class','aria-hidden'] }));
        sync();
        return true;
      };
      if (!observe()) document.addEventListener('DOMContentLoaded', observe, { once:true });
    }

    _syncLifecycle() {
      if (!this.active) return;
      const suppressed = this._lifecycleSuppressed();
      if (suppressed === this.lifecycle.suspended) {
        if (!suppressed && (this.active.level === 'hint' || this.active.level === 'spotlight')) root.FeastGenieTarget?.trackCard?.(document.querySelector('[data-feast-genie-card]'), this.active.step.target, { side:this.active.step.side, avoidSelectors:this.active.step.avoidSelectors });
        return;
      }
      if (suppressed) {
        this.lifecycle.suspended = true;
        if (this.timer) {
          const elapsed = Math.max(0, Date.now() - (this._timerStartedAt || Date.now()));
          this.lifecycle.timerRemaining = Math.max(0, Number(this.lifecycle.timerRemaining || 0) - elapsed);
          clearTimeout(this.timer); this.timer = null;
        }
        root.FeastGenieTarget?.clear?.();
        const card = document.querySelector('[data-feast-genie-card]');
        if (card) {
          this._releaseCardFocus(card);
          card.hidden = true;
        }
        return;
      }
      this.lifecycle.suspended = false;
      const remaining = this.lifecycle.timerRemaining;
      if (remaining !== null && this.active.level === 'discovery') this._schedule(() => this._show('cue'), remaining);
      else if (this.active.level === 'hint' || this.active.level === 'spotlight') this._renderCard(this.active.level);
      else if (this.active.level === 'cue') this._show('cue');
    }
  }

  const shared = new FeastGenieGuide();
  ['attach','present','request','manual','dismiss','complete','markMastery','resetSequenceSpeakers','escalate','updateActive','destroy','state']
    .forEach(name => { FeastGenieGuide[name] = (...args) => shared[name](...args); });
  root.FeastGenieGuide = FeastGenieGuide;
  root.FeastGenieGuideShared = shared;
})(typeof globalThis !== 'undefined' ? globalThis : window);
