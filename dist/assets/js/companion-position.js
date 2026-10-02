(function () {
  'use strict';

  if (window.self !== window.top) return;

  var POSITION_KEY = 'toadal:site:companion:position:v1';
  var DRAG_THRESHOLD = 8;
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

    function mobileDock() {
      if (manualPosition || window.innerWidth > 600) return null;
      var nav = document.querySelector('.site-nav');
      var brand = nav && nav.querySelector('.site-brand');
      var menu = nav && nav.querySelector('.nav-toggle');
      if (!brand || !menu || getComputedStyle(menu).display === 'none') return null;
      var a = brand.getBoundingClientRect();
      var b = menu.getBoundingClientRect();
      var gap = b.left - a.right - 16;
      if (gap < 52) return null;
      var width = Math.min(window.innerWidth <= 360 ? 92 : 102, gap);
      return { x: a.right + 8 + (gap - width) / 2, y: Math.max(4, a.top + (a.height - 52) / 2), width: width };
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

    function clampPosition(nextX, nextY) {
      var view = viewport();
      var width = root.offsetWidth || button.offsetWidth;
      var height = root.offsetHeight || button.offsetHeight;
      var minX = view.left + readSafeInset('left') + EDGE_GAP;
      var minY = view.top + readSafeInset('top') + EDGE_GAP;
      var maxX = Math.max(minX, view.left + view.width - readSafeInset('right') - EDGE_GAP - width);
      var maxY = Math.max(minY, view.top + view.height - readSafeInset('bottom') - EDGE_GAP - height);
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

      panel.style.setProperty('left', Math.round(left) + 'px', 'important');
      panel.style.setProperty('top', Math.round(top) + 'px', 'important');
      panel.setAttribute('data-bubble-placement', vertical + '-' + side);
    }

    function applyPosition(nextX, nextY, persist) {
      var dock = !drag || !drag.moved ? mobileDock() : null;
      setDock(dock);
      var next = dock ? { x: Math.round(dock.x), y: Math.round(dock.y) } : clampPosition(nextX, nextY);
      if (!dock && !manualPosition && !drag) next = avoidControls(next);
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

    function avoidControls(preferred) {
      var view = viewport();
      var width = root.offsetWidth || button.offsetWidth;
      var height = root.offsetHeight || button.offsetHeight;
      var header = document.querySelector('.site-header');
      var contentTop = header ? Math.max(view.top, header.getBoundingClientRect().bottom) : view.top;
      var controls = Array.from(document.querySelectorAll('a[href], button, input, select, textarea, [role="button"]')).filter(function (control) {
        if (root.contains(control)) return false;
        var style = getComputedStyle(control);
        var rect = control.getBoundingClientRect();
        return style.visibility !== 'hidden' && style.display !== 'none' && style.opacity !== '0' &&
          rect.width > 0 && rect.height > 0 && rect.bottom > contentTop && rect.top < view.top + view.height &&
          rect.right > view.left && rect.left < view.left + view.width;
      }).map(function (control) { return control.getBoundingClientRect(); });
      function collisionArea(position) {
        return controls.reduce(function (area, rect) {
          var overlapWidth = Math.max(0, Math.min(position.x + width + 8, rect.right) - Math.max(position.x - 8, rect.left));
          var overlapHeight = Math.max(0, Math.min(position.y + height + 8, rect.bottom) - Math.max(position.y - 8, rect.top, contentTop));
          return area + overlapWidth * overlapHeight;
        }, 0);
      }
      if (collisionArea(preferred) === 0) return preferred;
      var right = view.left + view.width - width - EDGE_GAP;
      var left = view.left + EDGE_GAP;
      var bottom = view.top + view.height - height - EDGE_GAP;
      var top = contentTop + EDGE_GAP;
      var candidates = [preferred, { x: right, y: bottom }, { x: left, y: bottom }, { x: right, y: top }, { x: left, y: top }];
      var best = preferred;
      var bestArea = collisionArea(preferred);
      for (var i = 1; i < candidates.length; i += 1) {
        var candidate = clampPosition(candidates[i].x, candidates[i].y);
        var area = collisionArea(candidate);
        if (area < bestArea) { best = candidate; bestArea = area; }
        if (bestArea === 0) break;
      }
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
        if (moveFrame) window.cancelAnimationFrame(moveFrame);
        moveFrame = 0;
        var finalPosition = queuedPosition || { x: x, y: y };
        queuedPosition = null;
        applyPosition(finalPosition.x, finalPosition.y, true);
        suppressClick = true;
        suppressTimer = window.setTimeout(function () { suppressClick = false; suppressTimer = null; }, 500);
      }
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
      // Automatic mobile header coordinates must not become a desktop preference.
      setDock(mobileDock());
      var next = manualPosition ? { x: x, y: y } : defaultPosition();
      applyPosition(next.x, next.y, true);
    }
    window.addEventListener('resize', clampAfterViewportChange, { passive: true });
    window.addEventListener('orientationchange', clampAfterViewportChange, { passive: true });
    window.addEventListener('scroll', function () {
      if (!manualPosition && !drag) schedulePosition(x, y, false);
    }, { passive: true });
    window.addEventListener('load', function () {
      if (!manualPosition && !drag) schedulePosition(x, y, false);
    }, { once: true });
    if (window.ResizeObserver) {
      var layoutObserver = new ResizeObserver(function () {
        if (!manualPosition && !drag) schedulePosition(x, y, false);
      });
      var main = document.querySelector('main');
      if (main) layoutObserver.observe(main);
    }
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', clampAfterViewportChange, { passive: true });
      window.visualViewport.addEventListener('scroll', clampAfterViewportChange, { passive: true });
    }
    var panelObserver = new MutationObserver(placePanel);
    panelObserver.observe(panel, { attributes: true, attributeFilter: ['hidden'], childList: true, characterData: true, subtree: true });

    var initial = loadPosition();
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
