(function () {
  'use strict';

  if (window.self !== window.top) return;

  var POSITION_KEY = 'toadal:site:companion:position:v1';
  var DRAG_THRESHOLD = 8;
  var DOUBLE_TAP_WINDOW = 320;
  var DOUBLE_TAP_DISTANCE = 24;
  var TAP_MAX_DURATION = 350;
  var EDGE_GAP = 12;
  var DEFAULT_BOTTOM_GAP = 180;

  function readSafeInset(name) {
    var value = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--toadal-safe-' + name));
    return Number.isFinite(value) ? value : 0;
  }

  function init() {
    var root = document.querySelector('[data-companion]');
    var button = root && root.querySelector('[data-companion-toggle]');
    var image = root && root.querySelector('[data-companion-image]');
    var panel = root && root.querySelector('[data-companion-panel]');
    if (!root || !button || !image || !panel || root.getAttribute('data-position-ready') === 'true') return;
    if (root.parentElement !== document.body) document.body.appendChild(root);

    var x = 0;
    var y = 0;
    var drag = null;
    var suppressClick = false;
    var suppressTimer = null;
    var moveFrame = 0;
    var queuedPosition = null;
    var manualPosition = false;
    var lastTouchTap = null;

    function mobileDock() {
      if (manualPosition || window.innerWidth > 600) return null;
      var nav = document.querySelector('.site-nav');
      var brand = nav && nav.querySelector('.site-brand');
      var menu = nav && nav.querySelector('.nav-toggle');
      if (!brand || !menu || getComputedStyle(menu).display === 'none') return null;
      var a = brand.getBoundingClientRect();
      var b = menu.getBoundingClientRect();
      // Use the same exclusion margin as collision checks, plus rounding slack.
      var dockGap = EDGE_GAP + 1;
      var gap = b.left - a.right - 2 * dockGap;
      if (gap < 52) return null;
      var width = Math.min(window.innerWidth <= 360 ? 92 : 102, gap);
      return { x: a.right + dockGap + (gap - width) / 2, y: Math.max(4, a.top + (a.height - 52) / 2), width: width };
    }

    function setDock(dock) {
      if (dock) {
        root.setAttribute('data-mobile-docked', 'true');
        root.style.setProperty('--toadal-dock-width', dock.width + 'px');
      } else root.removeAttribute('data-mobile-docked');
    }

    function viewport() {
      var visual = window.visualViewport;
      return {
        left: visual ? visual.offsetLeft : 0,
        top: visual ? visual.offsetTop : 0,
        width: visual ? visual.width : window.innerWidth,
        height: visual ? visual.height : window.innerHeight
      };
    }

    function clampPosition(nextX, nextY, width, height) {
      var view = viewport();
      width = width || root.offsetWidth || button.offsetWidth;
      height = height || root.offsetHeight || button.offsetHeight;
      var minX = Math.ceil(view.left + readSafeInset('left') + EDGE_GAP);
      var minY = Math.ceil(view.top + readSafeInset('top') + EDGE_GAP);
      var maxX = Math.max(minX, Math.floor(view.left + view.width - readSafeInset('right') - EDGE_GAP - width));
      var maxY = Math.max(minY, Math.floor(view.top + view.height - readSafeInset('bottom') - EDGE_GAP - height));
      return {
        x: Math.round(Math.max(minX, Math.min(maxX, nextX))),
        y: Math.round(Math.max(minY, Math.min(maxY, nextY)))
      };
    }

    function persistPosition() {
      try {
        window.localStorage.setItem(POSITION_KEY, JSON.stringify({ version: 1, x: x, y: y, manual: manualPosition }));
      } catch (error) { /* Keep the in-memory position when storage is unavailable. */ }
    }

    function panelVisible() {
      return !panel.hidden && getComputedStyle(panel).display !== 'none';
    }

    function placePanel() {
      if (!panelVisible()) return;
      var view = viewport();
      var safeLeft = readSafeInset('left') + EDGE_GAP;
      var safeRight = readSafeInset('right') + EDGE_GAP;
      var safeTop = readSafeInset('top') + EDGE_GAP;
      var safeBottom = readSafeInset('bottom') + EDGE_GAP;
      var viewRight = view.left + view.width - safeRight;
      var viewBottom = view.top + view.height - safeBottom;
      var anchor = button.getBoundingClientRect();
      var panelWidth = Math.max(1, Math.min(250, view.width - safeLeft - safeRight));

      panel.style.setProperty('position', 'fixed', 'important');
      panel.style.setProperty('width', panelWidth + 'px', 'important');
      panel.style.setProperty('left', safeLeft + 'px', 'important');
      panel.style.setProperty('top', safeTop + 'px', 'important');
      panel.style.setProperty('right', 'auto', 'important');
      panel.style.setProperty('bottom', 'auto', 'important');

      var panelRect = panel.getBoundingClientRect();
      var panelHeight = panelRect.height;
      var roomAbove = anchor.top - safeTop;
      var roomBelow = viewBottom - anchor.bottom;
      var vertical = roomAbove >= panelHeight + EDGE_GAP ? 'above' :
        roomBelow >= panelHeight + EDGE_GAP ? 'below' :
          roomAbove > roomBelow ? 'above' : 'below';
      var top = vertical === 'above' ? anchor.top - panelHeight - EDGE_GAP : anchor.bottom + EDGE_GAP;
      top = Math.max(safeTop, Math.min(viewBottom - panelHeight, top));

      var rightSpace = viewRight - anchor.right;
      var leftSpace = anchor.left - (view.left + safeLeft);
      var side = rightSpace >= panelWidth + EDGE_GAP ? 'right' :
        leftSpace >= panelWidth + EDGE_GAP ? 'left' :
          rightSpace > leftSpace ? 'right' : 'left';
      var left = side === 'right' ? anchor.right + EDGE_GAP : anchor.left - panelWidth - EDGE_GAP;
      left = Math.max(view.left + safeLeft, Math.min(viewRight - panelWidth, left));

      // The visible bubble, not just its character anchor, must leave navigation usable.
      var preferred = { x: Math.round(left), y: Math.round(top) };
      var next = avoidControls(preferred, panelWidth, panelHeight, controlRects(true).concat([anchor]));
      panel.style.setProperty('left', next.x + 'px', 'important');
      panel.style.setProperty('top', next.y + 'px', 'important');
      panel.setAttribute('data-bubble-placement', vertical + '-' + side +
        (next.x !== preferred.x || next.y !== preferred.y ? '-safe' : ''));
    }

    function applyPosition(nextX, nextY, persist) {
      // A hidden character has no measurable box. Keep its saved placement intact.
      if (root.hidden) return;
      var dock = !drag || !drag.moved ? mobileDock() : null;
      setDock(dock);
      var next = dock ? { x: Math.round(dock.x), y: Math.round(dock.y) } : clampPosition(nextX, nextY);
      // Main controls can scroll behind the opaque sticky header. They must
      // not dislodge its automatic dock into the visible page content.
      var safe = dock ? avoidControls(next, dock.width, 52, controlRects(false, true)) : avoidControls(next);
      if (dock && (safe.x !== next.x || safe.y !== next.y)) {
        setDock(null);
        safe = avoidControls(clampPosition(safe.x, safe.y));
      }
      next = safe;
      x = next.x;
      y = next.y;
      root.style.setProperty('--toadal-companion-x', x + 'px');
      root.style.setProperty('--toadal-companion-y', y + 'px');
      root.style.setProperty('left', x + 'px', 'important');
      root.style.setProperty('top', y + 'px', 'important');
      root.setAttribute('data-position-x', String(x));
      root.setAttribute('data-position-y', String(y));
      placePanel();
      if (persist) persistPosition();
    }

    function controlRects(includeNavigation, headerOnly) {
      var header = headerOnly ? document.querySelector('.site-header') : null;
      var view = viewport();
      var selectors = 'a[href], button, input, select, textarea, [role="button"], iframe, [data-player-frame-wrap], .detail-breadcrumb, dialog[open], [role="dialog"]';
      if (includeNavigation) selectors += ', .site-header, [role="navigation"]';
      return Array.from(document.querySelectorAll(selectors)).filter(function (control) {
        if (root.contains(control)) return false;
        if (headerOnly && (!header || !header.contains(control))) return false;
        var style = getComputedStyle(control);
        var rect = control.getBoundingClientRect();
        return style.visibility !== 'hidden' && style.display !== 'none' && style.opacity !== '0' &&
          rect.width > 0 && rect.height > 0 && rect.bottom > view.top && rect.top < view.top + view.height &&
          rect.right > view.left && rect.left < view.left + view.width;
      }).map(function (control) { return control.getBoundingClientRect(); });
    }

    function avoidControls(preferred, width, height, controls) {
      var view = viewport();
      width = width || root.offsetWidth || button.offsetWidth;
      height = height || root.offsetHeight || button.offsetHeight;
      controls = controls || controlRects(false);
      function collisionArea(position) {
        return controls.reduce(function (area, rect) {
          var overlapWidth = Math.max(0, Math.min(position.x + width + EDGE_GAP, rect.right) - Math.max(position.x - EDGE_GAP, rect.left));
          var overlapHeight = Math.max(0, Math.min(position.y + height + EDGE_GAP, rect.bottom) - Math.max(position.y - EDGE_GAP, rect.top));
          return area + overlapWidth * overlapHeight;
        }, 0);
      }
      if (collisionArea(preferred) === 0) return preferred;
      // Rectangle edges enumerate free regions without a screenshot-specific offset.
      var xs = [preferred.x, view.left + EDGE_GAP, view.left + view.width - width - EDGE_GAP];
      var ys = [preferred.y, view.top + EDGE_GAP, view.top + view.height - height - EDGE_GAP];
      controls.forEach(function (rect) {
        xs.push(Math.floor(rect.left - width - EDGE_GAP), Math.ceil(rect.right + EDGE_GAP));
        ys.push(Math.floor(rect.top - height - EDGE_GAP), Math.ceil(rect.bottom + EDGE_GAP));
      });
      var best = preferred;
      var bestArea = collisionArea(preferred);
      var bestDistance = Infinity;
      Array.from(new Set(xs)).forEach(function (left) {
        Array.from(new Set(ys)).forEach(function (top) {
          var candidate = clampPosition(left, top, width, height);
          var area = collisionArea(candidate);
          var distance = Math.pow(candidate.x - preferred.x, 2) + Math.pow(candidate.y - preferred.y, 2);
          if (area < bestArea || (area === bestArea && distance < bestDistance)) {
            best = candidate;
            bestArea = area;
            bestDistance = distance;
          }
        });
      });
      return best;
    }

    function defaultPosition() {
      var view = viewport();
      return {
        x: view.left + view.width - root.offsetWidth - EDGE_GAP,
        y: view.top + view.height - root.offsetHeight - EDGE_GAP - DEFAULT_BOTTOM_GAP
      };
    }

    function loadPosition() {
      var saved = null;
      try { saved = JSON.parse(window.localStorage.getItem(POSITION_KEY) || 'null'); } catch (error) { saved = null; }
      if (saved && saved.version === 1 && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
        // Legacy records cannot distinguish a default from a deliberate drag.
        // Migrate them once to safe defaults, regardless of the old viewport.
        manualPosition = saved.manual === true;
        if (manualPosition) return { x: saved.x, y: saved.y };
      }
      return defaultPosition();
    }

    function schedulePosition(nextX, nextY, persist) {
      queuedPosition = { x: nextX, y: nextY, persist: persist };
      if (moveFrame) return;
      moveFrame = window.requestAnimationFrame(function () {
        moveFrame = 0;
        var next = queuedPosition;
        queuedPosition = null;
        if (next) applyPosition(next.x, next.y, next.persist);
      });
    }

    function onPointerDown(event) {
      if (!event.isPrimary || event.button !== 0 || event.target.closest('[data-companion-panel]')) return;
      if (suppressTimer) window.clearTimeout(suppressTimer);
      suppressTimer = null;
      suppressClick = false;
      var rect = root.getBoundingClientRect();
      drag = {
        pointerId: event.pointerId,
        pointerType: event.pointerType,
        startedAt: event.timeStamp,
        startX: event.clientX,
        startY: event.clientY,
        originX: rect.left,
        originY: rect.top,
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top,
        manual: manualPosition,
        moved: false
      };
      try { button.setPointerCapture(event.pointerId); } catch (error) { /* Window listeners still provide cleanup. */ }
    }

    function onPointerMove(event) {
      if (!drag || drag.pointerId !== event.pointerId) return;
      var dx = event.clientX - drag.startX;
      var dy = event.clientY - drag.startY;
      if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      if (!drag.moved) {
        lastTouchTap = null;
        manualPosition = true;
        setDock(null);
      }
      drag.moved = true;
      root.setAttribute('data-dragging', 'true');
      if (event.cancelable) event.preventDefault();
      schedulePosition(event.clientX - drag.offsetX, event.clientY - drag.offsetY, false);
    }

    function finishPointer(event, cancelled) {
      if (!drag || (event && drag.pointerId !== event.pointerId)) return;
      var ended = drag;
      drag = null;
      root.removeAttribute('data-dragging');
      if (cancelled) {
        lastTouchTap = null;
        manualPosition = ended.manual;
        if (moveFrame) window.cancelAnimationFrame(moveFrame);
        moveFrame = 0;
        queuedPosition = null;
        applyPosition(ended.originX, ended.originY, false);
        if (ended.moved) {
          suppressClick = true;
          suppressTimer = window.setTimeout(function () { suppressClick = false; suppressTimer = null; }, 500);
        }
        return;
      }
      if (ended.moved) {
        lastTouchTap = null;
        if (moveFrame) window.cancelAnimationFrame(moveFrame);
        moveFrame = 0;
        var finalPosition = queuedPosition || { x: x, y: y };
        queuedPosition = null;
        applyPosition(finalPosition.x, finalPosition.y, true);
        suppressClick = true;
        suppressTimer = window.setTimeout(function () { suppressClick = false; suppressTimer = null; }, 500);
      } else if (ended.pointerType === 'touch' && event && event.timeStamp - ended.startedAt <= TAP_MAX_DURATION) {
        var now = event.timeStamp;
        var previous = lastTouchTap;
        var closeEnough = previous && Math.hypot(event.clientX - previous.x, event.clientY - previous.y) <= DOUBLE_TAP_DISTANCE;
        if (previous && now - previous.at <= DOUBLE_TAP_WINDOW && closeEnough) {
          lastTouchTap = null;
          // Hide on pointerup and consume the following compatibility click.
          // A single tap still toggles immediately; a drag never counts as a tap.
          suppressClick = true;
          suppressTimer = window.setTimeout(function () { suppressClick = false; suppressTimer = null; }, 500);
          if (event.cancelable) event.preventDefault();
          root.dispatchEvent(new CustomEvent('toadal:companion-hide-request', { detail: { input: 'touch-double-tap' } }));
        } else lastTouchTap = { at: now, x: event.clientX, y: event.clientY };
      } else lastTouchTap = null;
    }

    button.addEventListener('pointerdown', onPointerDown);
    button.addEventListener('pointermove', onPointerMove, { passive: false });
    button.addEventListener('pointerup', function (event) { finishPointer(event, false); });
    button.addEventListener('pointercancel', function (event) { finishPointer(event, true); });
    button.addEventListener('lostpointercapture', function (event) { finishPointer(event, true); });
    button.addEventListener('click', function (event) {
      if (!suppressClick) return;
      suppressClick = false;
      if (suppressTimer) window.clearTimeout(suppressTimer);
      suppressTimer = null;
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);
    button.addEventListener('keydown', function (event) {
      var step = event.shiftKey ? 36 : 12;
      var nextX = x;
      var nextY = y;
      if (event.key === 'ArrowLeft') nextX -= step;
      else if (event.key === 'ArrowRight') nextX += step;
      else if (event.key === 'ArrowUp') nextY -= step;
      else if (event.key === 'ArrowDown') nextY += step;
      else return;
      event.preventDefault();
      manualPosition = true;
      setDock(null);
      applyPosition(nextX, nextY, true);
    });
    root.addEventListener('touchstart', function (event) {
      event.stopPropagation();
    }, { passive: true });

    function clampAfterViewportChange() {
      if (root.hidden) return;
      // Automatic mobile header coordinates must not become a desktop preference.
      setDock(mobileDock());
      var next = manualPosition ? { x: x, y: y } : defaultPosition();
      applyPosition(next.x, next.y, true);
    }
    window.addEventListener('resize', clampAfterViewportChange, { passive: true });
    window.addEventListener('orientationchange', clampAfterViewportChange, { passive: true });
    root.addEventListener('toadal:companion-visibility', function (event) {
      lastTouchTap = null;
      if (!event.detail || !event.detail.hidden) clampAfterViewportChange();
    });
    window.addEventListener('scroll', function () {
      if (!drag) schedulePosition(x, y, false);
    }, { passive: true });
    window.addEventListener('load', function () {
      if (!manualPosition && !drag) schedulePosition(x, y, false);
    }, { once: true });
    if (window.ResizeObserver) {
      var layoutObserver = new ResizeObserver(function () {
        if (!drag) schedulePosition(x, y, false);
      });
      var main = document.querySelector('main');
      if (main) layoutObserver.observe(main);
    }
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', clampAfterViewportChange, { passive: true });
      window.visualViewport.addEventListener('scroll', clampAfterViewportChange, { passive: true });
    }
    var panelWasVisible = panelVisible();
    var panelObserver = new MutationObserver(function () {
      var visible = panelVisible();
      if (visible !== panelWasVisible) {
        panelWasVisible = visible;
        if (!drag) {
          // Opening the bubble scales the companion. Re-evaluate its hit area
          // against the current page controls after the expanded state lands.
          // Preserve deliberate owner placement; use the default anchor again
          // when a non-manual companion is minimized.
          var preferred = !visible && !manualPosition ? defaultPosition() : { x: x, y: y };
          applyPosition(preferred.x, preferred.y, false);
        } else placePanel();
      } else placePanel();
    });
    panelObserver.observe(panel, { attributes: true, attributeFilter: ['hidden'], childList: true, characterData: true, subtree: true });

    var initial = loadPosition();
    x = initial.x;
    y = initial.y;
    applyPosition(initial.x, initial.y, true);
    root.setAttribute('data-position-ready', 'true');
    button.setAttribute('aria-keyshortcuts', 'ArrowUp ArrowDown ArrowLeft ArrowRight Shift+ArrowUp Shift+ArrowDown Shift+ArrowLeft Shift+ArrowRight');
    if (image.complete) placePanel();
    else image.addEventListener('load', placePanel, { once: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();

/* Website-only manifest adapters. The Studio inline code and cartridge bytes stay frozen. */
(function () {
  'use strict';
  if (window.self !== window.top) return;
  function loadManifestShell() {
    var brand = document.querySelector('.site-brand');
    if (!brand || document.querySelector('[data-manifest-shell-loader]')) return;
    var home = new URL(brand.href, window.location.href);
    if (home.origin !== window.location.origin) return;
    var base = home.pathname === '/' ? '' : home.pathname.replace(/\/+$/, '');
    var script = document.createElement('script');
    script.src = base + '/assets/js/manifest-shell.js';
    script.setAttribute('data-manifest-shell-loader', '');
    script.async = false;
    document.head.appendChild(script);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadManifestShell, { once: true });
  else loadManifestShell();
})();
