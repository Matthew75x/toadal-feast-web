(function () {
  'use strict';

  function initNavigation() {
    var nav = document.querySelector('.site-nav');
    var links = nav && nav.querySelector('.site-links');
    if (!nav || !links) return;

    var currentPath = window.location.pathname || '/';
    var homeAnchor = links.querySelector('a');
    var homePath = homeAnchor ? new URL(homeAnchor.href, window.location.href).pathname : '/';
    var baseRoot = homePath === '/' ? '' : homePath.replace(/\/+$/, '');
    var currentRelative = !baseRoot ? currentPath : currentPath === baseRoot || currentPath.indexOf(baseRoot + '/') === 0 ? currentPath.slice(baseRoot.length) || '/' : currentPath;
    links.querySelectorAll('a').forEach(function (link) {
      var targetPath = new URL(link.href, window.location.href).pathname;
      var targetRelative = !baseRoot ? targetPath : targetPath === baseRoot || targetPath.indexOf(baseRoot + '/') === 0 ? targetPath.slice(baseRoot.length) || '/' : targetPath;
      var isPlayLink = /^\/play\/?$/.test(targetRelative);
      var isCurrent = targetRelative === '/' ? currentRelative === '/' : currentRelative === targetRelative || currentRelative.indexOf(targetRelative) === 0;
      if (isPlayLink && (/^\/games\//.test(currentRelative) || /^\/player\//.test(currentRelative))) isCurrent = true;
      if (isCurrent) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });

    if (nav.getAttribute('data-menu-enhanced') === 'true') return;

    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'nav-toggle';
    button.textContent = 'Menu';
    button.setAttribute('aria-label', 'Open navigation');
    button.setAttribute('aria-expanded', 'false');

    var linksId = links.id;
    if (!linksId) {
      linksId = 'site-links-menu';
      var suffix = 1;
      while (document.getElementById(linksId)) linksId = 'site-links-menu-' + suffix++;
      links.id = linksId;
    }
    button.setAttribute('aria-controls', linksId);

    var media = window.matchMedia ? window.matchMedia('(max-width: 960px)') : null;
    var mobile = !!(media && media.matches);
    var open = false;

    function sync() {
      if (media) mobile = media.matches;
      button.hidden = !mobile;
      links.hidden = mobile && !open;
      button.setAttribute('aria-expanded', open && mobile ? 'true' : 'false');
      button.setAttribute('aria-label', open && mobile ? 'Close navigation' : 'Open navigation');
    }
    function setOpen(value, returnFocus) {
      open = !!value;
      sync();
      if (returnFocus && mobile) button.focus();
      // Re-evaluate the existing floating companion after navigation changes size.
      window.requestAnimationFrame(function () { window.dispatchEvent(new Event('resize')); });
    }

    try {
      button.addEventListener('click', function () { setOpen(!open, false); });
      nav.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && mobile && open) {
          event.preventDefault();
          setOpen(false, true);
        }
      });
      links.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () { if (mobile) setOpen(false, false); });
      });
      window.addEventListener('resize', sync);
      nav.insertBefore(button, links);
      sync();
      nav.setAttribute('data-menu-enhanced', 'true');
    } catch (error) {
      if (button.parentNode) button.parentNode.removeChild(button);
      nav.removeAttribute('data-menu-enhanced');
      links.hidden = false;
    }
  }

  function initGameFilters() {
    var group = document.querySelector('.game-tabs');
    var section = document.getElementById('browser-games');
    if (!group || !section) return;

    var filters = Array.prototype.slice.call(group.querySelectorAll('[data-game-tab]'));
    var cards = Array.prototype.slice.call(section.querySelectorAll('.studio-game-card'));
    if (!filters.length || filters.some(function (button) { return button.tagName.toLowerCase() !== 'button'; })) return;

    var initiallySelected = filters.find(function (button) { return button.getAttribute('aria-pressed') === 'true'; }) ||
      filters.find(function (button) { return button.getAttribute('aria-selected') === 'true'; }) ||
      filters.find(function (button) { return filterFor(button) === 'all'; }) || filters[0];

    group.removeAttribute('role');
    group.setAttribute('role', 'group');
    if (!group.hasAttribute('aria-label')) group.setAttribute('aria-label', 'Filter browser games');

    if (section.getAttribute('role') === 'tabpanel') section.removeAttribute('role');
    var filterIds = filters.map(function (button) { return button.id; }).filter(Boolean);
    var labelledBy = (section.getAttribute('aria-labelledby') || '').trim().split(/\s+/);
    if (labelledBy.some(function (id) { return filterIds.indexOf(id) !== -1; })) section.removeAttribute('aria-labelledby');

    var empty = document.querySelector('[data-game-empty], .game-empty');
    function filterFor(button) {
      var filter = (button.getAttribute('data-game-tab') || 'all').trim().toLowerCase();
      return filter === 'preview' || filter === 'public' ? filter : 'all';
    }
    function selectFilter(selected) {
      var filter = filterFor(selected);
      var visibleCount = 0;
      filters.forEach(function (button) {
        button.type = 'button';
        button.removeAttribute('role');
        button.removeAttribute('aria-selected');
        button.removeAttribute('tabindex');
        button.setAttribute('aria-controls', section.id);
        button.setAttribute('aria-pressed', button === selected ? 'true' : 'false');
      });
      cards.forEach(function (card) {
        var matches = filter === 'all' ||
          (filter === 'preview' && !!card.querySelector('.chip.preview')) ||
          (filter === 'public' && !!card.querySelector('.chip.public'));
        card.hidden = !matches;
        if (matches) visibleCount += 1;
      });
      if (empty) empty.hidden = visibleCount !== 0;
    }

    filters.forEach(function (button) {
      button.type = 'button';
      button.removeAttribute('role');
      button.removeAttribute('aria-selected');
      button.removeAttribute('tabindex');
      button.setAttribute('aria-controls', section.id);
      button.addEventListener('click', function () { selectFilter(button); });
    });
    selectFilter(initiallySelected);
  }

  function initCompanion() {
    var root = document.querySelector('[data-companion]');
    if (!root) {
      var brand = document.querySelector('.site-brand');
      var homePath = brand ? new URL(brand.href, window.location.href).pathname : '/';
      var siteRoot = homePath === '/' ? '' : homePath.replace(/\/+$/, '');
      root = document.createElement('aside');
      root.className = 'toadal-companion';
      root.setAttribute('data-companion', '');
      root.setAttribute('data-zone', 'global');
      root.setAttribute('aria-label', 'Toadal contextual helper');

      var panel = document.createElement('div');
      panel.className = 'companion-panel';
      panel.id = 'toadal-companion-panel-global';
      panel.setAttribute('data-companion-panel', '');
      var label = document.createElement('p');
      label.className = 'companion-label';
      label.textContent = 'TOADAL SAYS';
      var speech = document.createElement('p');
      speech.className = 'companion-message';
      speech.setAttribute('data-companion-speech', '');
      speech.setAttribute('aria-live', 'polite');
      speech.setAttribute('aria-atomic', 'true');
      speech.textContent = 'Drag me anywhere on the screen. Tap to minimize or restore me.';
      panel.append(label, speech);

      var toggle = document.createElement('button');
      toggle.className = 'companion-toggle';
      toggle.type = 'button';
      toggle.setAttribute('data-companion-toggle', '');
      toggle.setAttribute('aria-controls', panel.id);
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Show Toadal companion');
      var image = document.createElement('img');
      image.className = 'companion-image';
      image.setAttribute('data-companion-image', '');
      image.src = siteRoot + '/assets/images/characters/toadal-victory.png';
      image.alt = '';
      image.width = 611;
      image.height = 640;
      image.loading = 'lazy';
      image.decoding = 'async';
      var hiddenLabel = document.createElement('span');
      hiddenLabel.className = 'sr-only';
      hiddenLabel.textContent = 'Show Toadal companion';
      toggle.append(image, hiddenLabel);
      root.append(panel, toggle);
      document.body.appendChild(root);
    }
    var image = root.querySelector('[data-companion-image]');
    var speech = root.querySelector('[data-companion-speech]');
    var toggle = root.querySelector('[data-companion-toggle]');
    var panel = root.querySelector('[data-companion-panel]');
    if (!image || !speech || !toggle || !panel) return;

    var storageKey = 'toadal:site:companion:minimized:v1';
    var hiddenKey = 'toadal:site:companion:hidden:v1';
    var companionHidden = false;
    var hiddenPreferenceState = 'persistent';
    try {
      var hiddenStored = window.localStorage.getItem(hiddenKey);
      if (hiddenStored === 'true') companionHidden = true;
      else if (hiddenStored !== null && hiddenStored !== 'false') hiddenPreferenceState = 'invalid';
    } catch (error) { hiddenPreferenceState = 'temporary'; }
    if (!root.id) root.id = 'toadal-companion-global';
    var hideButton = root.querySelector('[data-companion-hide]');
    if (!hideButton) {
      hideButton = document.createElement('button');
      hideButton.type = 'button';
      hideButton.className = 'companion-hide';
      hideButton.setAttribute('data-companion-hide', '');
      hideButton.setAttribute('aria-label', 'Hide Toadal companion');
      hideButton.setAttribute('title', 'Hide Toadal');
      hideButton.textContent = 'Hide Toadal';
      panel.appendChild(hideButton);
    }
    var restoreButton = document.querySelector('[data-companion-restore]');
    if (!restoreButton) {
      restoreButton = document.createElement('button');
      restoreButton.type = 'button';
      restoreButton.className = 'companion-restore';
      restoreButton.setAttribute('data-companion-restore', '');
      restoreButton.setAttribute('aria-controls', root.id);
      restoreButton.textContent = 'Show Toadal';
      var restoreContainer = document.querySelector('.site-footer-inner') || document.querySelector('.site-footer') || document.body;
      restoreContainer.appendChild(restoreButton);
    }
    var navLinks = document.querySelector('.site-links');
    var navVisibilityButton = navLinks && navLinks.querySelector('[data-companion-nav-visibility]');
    if (!navVisibilityButton && navLinks) {
      navVisibilityButton = document.createElement('button');
      navVisibilityButton.type = 'button';
      navVisibilityButton.className = 'companion-nav-visibility';
      navVisibilityButton.setAttribute('data-companion-nav-visibility', '');
      navVisibilityButton.setAttribute('aria-controls', root.id);
      navLinks.appendChild(navVisibilityButton);
    }
    toggle.setAttribute('title', 'Tap to show or minimize. Double-tap to hide; Show/Hide Toadal in the navigation menu or Show Toadal in the footer restores me.');
    var defaultCopy = speech.textContent || '';
    var media = window.matchMedia ? window.matchMedia('(max-width: 960px)') : null;
    var stored = null;
    try { stored = window.localStorage.getItem(storageKey); } catch (error) { stored = null; }
    var hasStoredPreference = stored === 'true' || stored === 'false';
    var minimized = hasStoredPreference ? stored === 'true' : true;
    var focused = null;
    var hovered = null;
    var touched = null;
    var hero = document.querySelector('[data-companion-context=hero]');
    var currentSection = hero;
    var action = null;
    var actionTimer = null;
    var touchTimer = null;
    var ratios = new Map();
    var lastInput = 'pointer';
    var defaultCompanionImage = image.getAttribute('src') || '';
    var brandLink = document.querySelector('.site-brand');
    var brandPath = brandLink ? new URL(brandLink.href, window.location.href).pathname : '/';
    var siteRoot = brandPath === '/' ? '' : brandPath.replace(/\/+$/, '');
    var companionArtwork = {
      world: siteRoot + '/assets/images/characters/companion/runtime-v1/world-map.webp',
      support: siteRoot + '/assets/images/characters/companion/runtime-v1/support-help.webp',
      app: siteRoot + '/assets/images/characters/companion/runtime-v1/app-mobile.webp',
      storiesMedia: siteRoot + '/assets/images/characters/companion/runtime-v1/stories-media-thinking.webp',
      settings: siteRoot + '/assets/images/characters/companion/runtime-v2/settings.webp',
      search: siteRoot + '/assets/images/characters/companion/runtime-v2/search.webp',
      contact: siteRoot + '/assets/images/characters/companion/runtime-v2/contact.webp',
      news: siteRoot + '/assets/images/characters/companion/runtime-v2/news.webp',
      maintenance: siteRoot + '/assets/images/characters/companion/runtime-v2/maintenance.webp',
      privacy: siteRoot + '/assets/images/characters/companion/runtime-v2/privacy.webp',
      account: siteRoot + '/assets/images/characters/companion/runtime-v2/account.webp',
      notifications: siteRoot + '/assets/images/characters/companion/runtime-v2/notifications.webp',
      mute: siteRoot + '/assets/images/characters/companion/runtime-v2/mute.webp',
      register: siteRoot + '/assets/images/characters/companion/runtime-v2/register.webp',
      deleteAccount: siteRoot + '/assets/images/characters/companion/runtime-v2/delete-account.webp',
      rating: siteRoot + '/assets/images/characters/companion/runtime-v2/rating.webp',
      survey: siteRoot + '/assets/images/characters/companion/runtime-v2/survey.webp',
      thumbsUp: siteRoot + '/assets/images/characters/companion/runtime-v2/thumbs-up.webp',
      thumbsDown: siteRoot + '/assets/images/characters/companion/runtime-v2/thumbs-down.webp',
      aiDisclosure: siteRoot + '/assets/images/characters/companion/runtime-v2/ai-disclosure.webp',
      partnership: siteRoot + '/assets/images/characters/companion/runtime-v2/partnership.webp',
      community: siteRoot + '/assets/images/characters/companion/runtime-v2/community.webp',
      merch: siteRoot + '/assets/images/characters/companion/runtime-v2/merch.webp',
      reward: siteRoot + '/assets/images/characters/companion/runtime-v2/reward.webp',
      download: siteRoot + '/assets/images/characters/companion/runtime-v2/download.webp'
    };
    var artworkRequest = 0;
    var currentArtwork = defaultCompanionImage;

    function companionSemantic(element) {
      if (!element || !element.getAttribute) return '';
      var explicit = element.getAttribute('data-companion-context');
      if (explicit) return explicit.toLowerCase();
      return [
        element.getAttribute('href'),
        element.getAttribute('aria-label'),
        element.getAttribute('placeholder'),
        element.getAttribute('name'),
        element.getAttribute('id'),
        element.getAttribute('class'),
        element.hasAttribute('data-player-sound') ? 'sound mute' : '',
        element.textContent
      ].filter(Boolean).join(' ').toLowerCase();
    }

    function companionState(element) {
      var semantic = companionSemantic(element);
      if (!semantic) return '';
      if (/social[- ](?:impact|cause)/.test(semantic)) return '';
      if (/delete[- ]?account|remove[- ]?account/.test(semantic)) return 'delete-account';
      if (/support[- ]?contact|contact|mail/.test(semantic)) return 'contact';
      if (/settings|preferences|gear|controls/.test(semantic)) return 'settings';
      if (/mute|unmute|sound/.test(semantic)) return 'mute';
      if (/notification|subscribe|bell/.test(semantic)) return 'notifications';
      if (/register|sign[- ]?up|create[- ]?account/.test(semantic)) return 'register';
      if (/privacy|security/.test(semantic)) return 'privacy';
      if (/account|login|profile/.test(semantic)) return 'account';
      if (/search|find|magnifier/.test(semantic)) return 'search';
      if (/download/.test(semantic)) return 'download';
      if (/whats[- ]?next|what.?s next|maintenance|under[- ]?construction/.test(semantic)) return 'maintenance';
      if (/news|blog|devlog|announcement/.test(semantic)) return 'news';
      if (/rating|five[- ]?stars|review/.test(semantic)) return 'rating';
      if (/thumbs[- ]?up|positive[- ]?feedback/.test(semantic)) return 'thumbs-up';
      if (/thumbs[- ]?down|negative[- ]?feedback/.test(semantic)) return 'thumbs-down';
      if (/survey|feedback/.test(semantic)) return 'survey';
      if (/ai[- ]?disclosure|artificial intelligence/.test(semantic)) return 'ai-disclosure';
      if (/partnership|licensing|business/.test(semantic)) return 'partnership';
      if (/community|social/.test(semantic)) return 'community';
      if (/merch/.test(semantic)) return 'merch';
      if (/^app(?:-|$)|\/app\/|mobile/.test(semantic)) return 'app';
      if (/^support(?:-|$)|\/support\/|help|faq/.test(semantic)) return 'support';
      if (/stories|story|media|\/stories\/|\/media\//.test(semantic)) return 'stories-media';
      if (/^world(?:-|$)|\/world\/|map|adventure/.test(semantic)) return 'world';
      return '';
    }

    function artworkForContext(element) {
      var state = companionState(element);
      if (state === 'world') return companionArtwork.world;
      if (state === 'support') return companionArtwork.support;
      if (state === 'app') return companionArtwork.app;
      if (state === 'stories-media') return companionArtwork.storiesMedia;
      if (state === 'settings') return companionArtwork.settings;
      if (state === 'search') return companionArtwork.search;
      if (state === 'contact') return companionArtwork.contact;
      if (state === 'news') return companionArtwork.news;
      if (state === 'maintenance') return companionArtwork.maintenance;
      if (state === 'privacy') return companionArtwork.privacy;
      if (state === 'account') return companionArtwork.account;
      if (state === 'notifications') return companionArtwork.notifications;
      if (state === 'mute') return companionArtwork.mute;
      if (state === 'register') return companionArtwork.register;
      if (state === 'delete-account') return companionArtwork.deleteAccount;
      if (state === 'rating') return companionArtwork.rating;
      if (state === 'survey') return companionArtwork.survey;
      if (state === 'thumbs-up') return companionArtwork.thumbsUp;
      if (state === 'thumbs-down') return companionArtwork.thumbsDown;
      if (state === 'ai-disclosure') return companionArtwork.aiDisclosure;
      if (state === 'partnership') return companionArtwork.partnership;
      if (state === 'community') return companionArtwork.community;
      if (state === 'merch') return companionArtwork.merch;
      if (state === 'reward') return companionArtwork.reward;
      if (state === 'download') return companionArtwork.download;
      return defaultCompanionImage;
    }

    function reactionForContext(element) {
      var state = companionState(element);
      if (state === 'world') return 'curious';
      if (state === 'support') return 'friendly';
      if (state === 'app') return 'present';
      if (state === 'stories-media') return 'thinking';
      if (state === 'maintenance') return 'construction';
      return state || null;
    }

    function applyArtwork(src) {
      var next = src || defaultCompanionImage;
      if (!next || next === currentArtwork || image.getAttribute('src') === next) {
        artworkRequest += 1;
        currentArtwork = next || currentArtwork;
        return;
      }
      var request = ++artworkRequest;
      var preload = new Image();
      preload.onload = function () {
        if (request !== artworkRequest) return;
        image.setAttribute('src', next);
        image.removeAttribute('srcset');
        image.removeAttribute('width');
        image.removeAttribute('height');
        image.setAttribute('data-companion-artwork', next === defaultCompanionImage ? 'default' : 'contextual');
        currentArtwork = next;
      };
      preload.src = next;
    }

    var speechRole = speech.getAttribute('role');
    if (speechRole === 'status' || speechRole === 'alert' || speechRole === 'log') speech.removeAttribute('role');
    speech.setAttribute('aria-live', 'off');

    if (!panel.id) {
      var panelId = 'toadal-companion-panel';
      var suffix = 1;
      while (document.getElementById(panelId)) panelId = 'toadal-companion-panel-' + suffix++;
      panel.id = panelId;
    }
    toggle.setAttribute('aria-controls', panel.id);

    function contextElement(target) {
      if (!target || !target.closest) return null;
      var interactive = target.closest('a, button, input, select, textarea, [aria-label]');
      if (interactive && companionState(interactive)) return interactive;
      return target.closest('[data-companion-context]');
    }
    function contextValue(element) {
      if (!element) return null;
      return {
        copy: element.getAttribute('data-companion-copy'),
        reaction: element.getAttribute('data-companion-reaction') || reactionForContext(element),
        artwork: artworkForContext(element)
      };
    }
    function selectContextValue(actionValue, focusValue, hoverValue, touchValue, sectionValue, heroValue, inputMode) {
      return actionValue || (inputMode === 'keyboard' && focusValue) ||
        (inputMode === 'touch' ? touchValue : hoverValue || touchValue) || sectionValue || heroValue;
    }
    function enterHoverContext(nextContext, pointerType) {
      if (pointerType === 'touch' || !nextContext) return false;
      var changed = lastInput !== 'pointer' || hovered !== nextContext;
      lastInput = 'pointer';
      if (hovered !== nextContext) { clearTouchedContext(); hovered = nextContext; }
      return changed;
    }
    function leaveHoverContext(oldContext, nextContext, pointerType) {
      if (pointerType === 'touch' || !oldContext || oldContext !== hovered) return false;
      var changed = lastInput !== 'pointer' || nextContext !== oldContext;
      lastInput = 'pointer';
      if (nextContext !== oldContext) hovered = nextContext || null;
      return changed;
    }
    function clearTouchedContext() {
      if (touchTimer !== null) window.clearTimeout(touchTimer);
      touchTimer = null;
      touched = null;
    }
    function syncVisibilityControls() {
      restoreButton.hidden = !companionHidden;
      if (!navVisibilityButton) return;
      navVisibilityButton.textContent = companionHidden ? 'Show Toadal' : 'Hide Toadal';
      navVisibilityButton.setAttribute('aria-label', companionHidden ? 'Show Toadal companion' : 'Hide Toadal companion');
      navVisibilityButton.setAttribute('aria-pressed', companionHidden ? 'false' : 'true');
      navVisibilityButton.setAttribute('data-companion-visibility-state', companionHidden ? 'hidden' : (minimized ? 'minimized' : 'visible'));
      navVisibilityButton.setAttribute('data-companion-persistence', hiddenPreferenceState);
      var temporary = hiddenPreferenceState === 'temporary';
      var invalid = hiddenPreferenceState === 'invalid';
      navVisibilityButton.setAttribute('title', temporary ?
        (companionHidden ? 'Show Toadal for this page. Browser storage is unavailable.' : 'Hide Toadal for this page. Browser storage is unavailable.') :
        invalid ? 'The saved Toadal visibility preference was unreadable. Choose Show or Hide to replace it safely.' :
          (companionHidden ? 'Show Toadal' : 'Hide Toadal'));
    }
    function render(announce) {
      var transientContext = !!(action || focused || hovered || touched);
      // Context still changes canonical reaction art while minimized.
      // Opening speech is deliberate, so pointer position during scrolling cannot cover content.
      var panelVisible = !companionHidden && !minimized;
      root.hidden = companionHidden;
      root.setAttribute('data-companion-hidden', companionHidden ? 'true' : 'false');
      root.setAttribute('data-hidden', companionHidden ? 'true' : 'false');
      if (companionHidden) {
        root.setAttribute('aria-hidden', 'true');
        root.setAttribute('inert', '');
      } else {
        root.removeAttribute('aria-hidden');
        root.removeAttribute('inert');
      }
      syncVisibilityControls();
      speech.setAttribute('aria-live', announce && panelVisible ? 'polite' : 'off');
      root.setAttribute('data-minimized', minimized ? 'true' : 'false');
      root.setAttribute('data-panel-visible', panelVisible ? 'true' : 'false');
      toggle.setAttribute('aria-expanded', panelVisible ? 'true' : 'false');
      toggle.setAttribute('aria-label', minimized ? 'Expand Toadal companion' : 'Minimize Toadal companion');
      panel.hidden = !panelVisible;
      if (companionHidden) {
        artworkRequest += 1;
        root.removeAttribute('data-companion-current-reaction');
        return;
      }

      var value = selectContextValue(action, contextValue(focused), contextValue(hovered),
        contextValue(touched), contextValue(currentSection), contextValue(hero), lastInput);
      applyArtwork(value && value.artwork ? value.artwork : defaultCompanionImage);
      if (value && value.reaction) root.setAttribute('data-companion-current-reaction', value.reaction);
      else root.removeAttribute('data-companion-current-reaction');
      if (!panelVisible) return;

      var fallbackValue = contextValue(currentSection) || contextValue(hero);
      var copy = value && value.copy != null && value.copy !== '' ? value.copy :
        fallbackValue && fallbackValue.copy != null && fallbackValue.copy !== '' ? fallbackValue.copy : defaultCopy;
      if (speech.textContent !== copy) speech.textContent = copy;
    }
    function persistPreference() {
      try { window.localStorage.setItem(storageKey, minimized ? 'true' : 'false'); } catch (error) {}
    }

    function setHidden(value, returnFocus, focusTarget) {
      companionHidden = !!value;
      if (companionHidden) {
        clearTouchedContext();
        focused = null;
        hovered = null;
        action = null;
        if (actionTimer !== null) window.clearTimeout(actionTimer);
        actionTimer = null;
      }
      try {
        window.localStorage.setItem(hiddenKey, companionHidden ? 'true' : 'false');
        hiddenPreferenceState = 'persistent';
      } catch (error) { hiddenPreferenceState = 'temporary'; }
      render(false);
      root.dispatchEvent(new CustomEvent('toadal:companion-visibility', { detail: { hidden: companionHidden } }));
      if (returnFocus) (focusTarget || (companionHidden ? restoreButton : toggle)).focus({ preventScroll: true });
    }
    hideButton.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      setHidden(true, event.detail === 0);
    });
    restoreButton.addEventListener('click', function () { setHidden(false, true); });
    if (navVisibilityButton) navVisibilityButton.addEventListener('click', function () {
      setHidden(!companionHidden, true, navVisibilityButton);
    });
    root.addEventListener('toadal:companion-hide-request', function () { setHidden(true, false); });
    toggle.addEventListener('dblclick', function (event) {
      event.preventDefault();
      setHidden(true, false);
    });
    toggle.addEventListener('click', function () {
      minimized = !minimized;
      hasStoredPreference = true;
      persistPreference();
      render(false);
    });

    document.addEventListener('keydown', function () { lastInput = 'keyboard'; }, true);
    document.addEventListener('pointerdown', function (event) { lastInput = event.pointerType === 'touch' ? 'touch' : 'pointer'; }, true);
    document.addEventListener('focusin', function (event) {
      if (companionHidden) return;
      clearTouchedContext();
      focused = contextElement(event.target);
      render(lastInput === 'keyboard');
    });
    document.addEventListener('focusout', function (event) {
      if (companionHidden) return;
      var oldContext = contextElement(event.target);
      var nextContext = contextElement(event.relatedTarget);
      if (oldContext && focused === oldContext) focused = nextContext;
      render(lastInput === 'keyboard');
    });
    document.addEventListener('pointerover', function (event) {
      if (companionHidden || event.pointerType === 'touch') return;
      var next = contextElement(event.target);
      if (enterHoverContext(next, event.pointerType)) render(false);
    });
    document.addEventListener('pointerout', function (event) {
      if (companionHidden || event.pointerType === 'touch') return;
      var oldContext = contextElement(event.target);
      if (!oldContext || oldContext !== hovered) return;
      var nextContext = contextElement(event.relatedTarget);
      if (leaveHoverContext(oldContext, nextContext, event.pointerType)) render(false);
    });
    document.addEventListener('touchstart', function (event) {
      if (companionHidden) return;
      lastInput = 'touch';
      clearTouchedContext();
      var next = contextElement(event.target);
      if (next) {
        touched = next;
        touchTimer = window.setTimeout(function () {
          touched = null;
          touchTimer = null;
          render(false);
        }, 3000);
      }
      render(false);
    }, { passive: true });
    document.addEventListener('click', function (event) {
      if (companionHidden) return;
      var target = event.target && event.target.closest ? event.target.closest('[data-companion-action]') : null;
      if (!target) return;
      var copy = target.getAttribute('data-companion-action-copy');
      if (copy == null || copy.trim() === '') return;
      if (actionTimer !== null) window.clearTimeout(actionTimer);
      var actionContext = contextElement(target);
      action = {
        copy: copy,
        reaction: target.getAttribute('data-companion-reaction') || reactionForContext(actionContext),
        artwork: artworkForContext(actionContext)
      };
      render(event.detail === 0);
      actionTimer = window.setTimeout(function () {
        action = null;
        actionTimer = null;
        render(lastInput === 'keyboard' && !!focused);
      }, 2500);
    });

    // Confirmed website-local outcomes, never a mere Pass visit or button dispatch.
    // Read-only projection of the existing local store across independent Home surfaces.
    function syncLocalStatus() {
      if (!window.ToadalGuestProgression) return;
      try {
        var snapshot = window.ToadalGuestProgression.createStore({ storage: window.localStorage }).getSnapshot();
        var values = { level: snapshot.pass.level, xp: snapshot.pass.xp, sparks: snapshot.pass.sparks, treats: snapshot.pass.treats, 'xp-to-next': snapshot.xpToNext == null ? '—' : snapshot.xpToNext };
        document.querySelectorAll('.home-feast-pass-panel [data-progression-stat]').forEach(function (node) {
          var key = node.getAttribute('data-progression-stat');
          if (Object.prototype.hasOwnProperty.call(values, key)) node.textContent = String(values[key]);
        });
      } catch (error) { /* Existing runtime owns failure/storage disclosure. */ }
    }
    window.addEventListener('toadal:guest-progression-ready', syncLocalStatus);
    function celebrateLocalOutcome(copy, reaction) {
      window.setTimeout(function () {
        if (actionTimer !== null) window.clearTimeout(actionTimer);
        syncLocalStatus();
        if (companionHidden) return;
        action = { copy: copy, reaction: reaction || 'reward-earned', artwork: companionArtwork.reward };
        render(lastInput === 'keyboard');
        window.dispatchEvent(new Event('resize'));
        actionTimer = window.setTimeout(function () { action = null; actionTimer = null; render(false); window.dispatchEvent(new Event('resize')); }, 3200);
      }, 0);
    }
    window.addEventListener('toadal:daily-checkin-claimed', function () {
      celebrateLocalOutcome('Daily check-in saved! Your starter XP and Spark stay in this browser, not the mobile game.');
    });
    window.addEventListener('toadal:candy-found', function (event) {
      if (!event.detail || !event.detail.id) return;
      celebrateLocalOutcome('A Home Treat was found and saved locally. Open Quests to see your discovery progress.');
    });
    document.querySelectorAll('[data-progression-storage-status]').forEach(function (status) {
      var previous = status.textContent;
      new MutationObserver(function () {
        var message = status.textContent;
        if (message === previous) return;
        previous = message;
        // These exact success strings are produced only after the existing result handlers return ok.
        if (message === 'Quest reward claimed.') celebrateLocalOutcome('Quest complete! The configured reward was claimed in this browser.');
        else if (message === 'A website-local reward was added to this guest profile.') celebrateLocalOutcome('Your local collection was updated. Starter markers are not game achievements or transferable items.', 'collection-updated');
      }).observe(status, { childList: true, characterData: true, subtree: true });
    });

    var sections = Array.prototype.slice.call(document.querySelectorAll('[data-companion-context]'))
      .filter(function (element) {
        return element !== root && !element.matches('a, button') && element.getAttribute('role') !== 'tab' &&
          !element.closest('.site-nav, .site-links, [data-companion]');
      });
    if ('IntersectionObserver' in window && sections.length) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { ratios.set(entry.target, entry.isIntersecting ? entry.intersectionRatio : 0); });
        var best = null;
        var bestRatio = 0;
        ratios.forEach(function (ratio, element) {
          if (ratio > bestRatio) { best = element; bestRatio = ratio; }
        });
        currentSection = best || hero;
        if (!companionHidden) render(false);
      }, { rootMargin: '-15% 0px -55% 0px', threshold: [0, 0.15, 0.35, 0.6] });
      sections.forEach(function (element) { observer.observe(element); });
    }

    window.addEventListener('scroll', function () {
      if (!companionHidden && touched) {
        clearTouchedContext();
        render(false);
      }
    }, { passive: true });

    if (media) window.addEventListener('resize', function () {
      if (!companionHidden) render(false);
    });

    render(false);
  }

  function initFooterIdentity() {
    var shell = document.querySelector('.site-footer .site-footer-inner');
    if (!shell || shell.querySelector('[data-toadal-games-identity]')) return;

    var label = document.createElement('p');
    label.className = 'site-footer-subbrand';
    label.setAttribute('data-toadal-games-identity', '');
    label.setAttribute('aria-live', 'off');
    label.textContent = 'TOADAL GAMES';

    var brand = shell.querySelector('.site-footer strong');
    if (brand && brand.parentElement === shell) brand.insertAdjacentElement('afterend', label);
    else shell.appendChild(label);
  }

  function initSkipLink() {
    var path = window.location.pathname || '/';
    var is404 = /\/404(?:\.html)?\/?$/i.test(path);
    var isHome = path === '/' || path.endsWith('/') || /\/index\.html$/i.test(path);
    if (!isHome && !is404 || !document.body) return;

    function removeEmptyRichText(wrapper) {
      if (!wrapper || !wrapper.parentNode) return;
      var hasMeaningfulElement = wrapper.querySelector('img, button, input, select, textarea, iframe, video, audio, svg, canvas');
      if (!wrapper.textContent.trim() && !hasMeaningfulElement) wrapper.parentNode.removeChild(wrapper);
    }

    var links = Array.prototype.slice.call(document.querySelectorAll('a.skip-to-main'));
    var link = links[0] || document.createElement('a');
    var wrappers = [];

    if (!links.length) {
      link.className = 'skip-to-main';
      link.textContent = 'Skip to main content';
    }
    links.slice(1).forEach(function (duplicate) {
      var wrapper = duplicate.closest('.studio-rich-text');
      if (wrapper) wrappers.push(wrapper);
      if (duplicate.parentNode) duplicate.parentNode.removeChild(duplicate);
    });

    var originalWrapper = link.closest('.studio-rich-text');
    if (originalWrapper) wrappers.push(originalWrapper);
    link.setAttribute('href', '#main-content');
    if (!link.textContent.trim()) link.textContent = 'Skip to main content';
    document.body.insertBefore(link, document.body.firstChild);
    wrappers.forEach(removeEmptyRichText);
  }

  function initBrowserPlayer() {
    var shell = document.querySelector('[data-player-shell]');
    if (!shell) return;
    var frame = shell.querySelector('[data-player-frame]');
    var wrap = shell.querySelector('[data-player-frame-wrap]');
    function setFrameFocusIndicator() { if (wrap) wrap.classList.add('wo002-player-frame-focused'); }
    function clearFrameFocusIndicator() { if (wrap) wrap.classList.remove('wo002-player-frame-focused'); }
    window.addEventListener('blur', function () { if (document.activeElement === frame) setFrameFocusIndicator(); });
    window.addEventListener('focus', clearFrameFocusIndicator);
    document.addEventListener('focusin', function (event) { if (event.target !== frame) clearFrameFocusIndicator(); });
    var status = shell.querySelector('[data-player-status]');
    var errorPanel = shell.querySelector('[data-player-error]');
    var errorCopy = shell.querySelector('[data-player-error-copy]');
    var retry = shell.querySelector('[data-player-retry]');
    var pauseButton = shell.querySelector('[data-player-pause]');
    var resumeButton = shell.querySelector('[data-player-resume]');
    var soundButton = shell.querySelector('[data-player-sound]');
    var fullButton = shell.querySelector('[data-player-fullscreen]');
    var fullscreenExit = shell.querySelector('[data-player-fullscreen-exit]');
    if (fullscreenExit) {
      fullscreenExit.setAttribute('aria-label', 'Exit full screen');
      fullscreenExit.setAttribute('title', 'Exit full screen');
    }
    var fullscreenRail = shell.querySelector('[data-player-fullscreen-rail]');
    var exitLink = shell.querySelector('[data-player-exit]');
    var postplay = shell.querySelector('[data-player-postplay]');
    var gameId = shell.getAttribute('data-game-id') || '';
    var protocol = 'toadal.game.v1';
    var allowed = ['game:ready', 'game:started', 'game:paused', 'game:resumed', 'game:score', 'game:complete', 'game:error', 'game:request-exit', 'game:request-fullscreen'];
    var frameLoaded = false;
    var gameReady = false;
    var loadTimer = null;
    var visibilityPaused = false;
    var lastGameState = 'idle';
    var resettingFrame = false;
    var initialSrc = frame && frame.getAttribute('src');
    if (!frame || !wrap || !initialSrc) return;

    function setStatus(message) {
      if (status) status.textContent = message;
    }
    function clearLoadTimer() {
      if (loadTimer !== null) window.clearTimeout(loadTimer);
      loadTimer = null;
    }
    function showError(message) {
      clearLoadTimer();
      frameLoaded = false;
      gameReady = false;
      lastGameState = 'error';
      if (errorCopy && message) errorCopy.textContent = message;
      if (errorPanel) errorPanel.hidden = false;
      frame.hidden = true;
      setStatus('Preview could not be loaded.');
      if (pauseButton) pauseButton.disabled = true;
      if (resumeButton) resumeButton.disabled = true;
    }
    function expectedFrameSource() {
      try {
        var actual = new URL(frame.src, window.location.href);
        var expected = new URL(initialSrc, window.location.href);
        return actual.origin === window.location.origin && actual.pathname === expected.pathname;
      } catch (_) { return false; }
    }
    function send(type, payload) {
      if (!frameLoaded || !expectedFrameSource()) return false;
      try {
        frame.contentWindow.postMessage({ protocol: protocol, gameId: gameId, type: type, payload: payload || {} }, '*');
        return true;
      } catch (_) { return false; }
    }
    function armReadyTimeout(delay) {
      clearLoadTimer();
      loadTimer = window.setTimeout(function () {
        if (!gameReady) showError('The preview opened but did not complete its readiness check. Retry or return to the game details.');
      }, delay);
    }
    function onFrameLoad() {
      if (resettingFrame && frame.src === 'about:blank') return;
      if (!expectedFrameSource()) {
        showError('The preview did not load from its registered package route.');
        return;
      }
      frameLoaded = true;
      frame.hidden = false;
      if (errorPanel) errorPanel.hidden = true;
      if (!gameReady) {
        setStatus('Preview loaded. Verifying the isolated game…');
        armReadyTimeout(15000);
        send('host:init', { protocol: protocol, gameId: gameId, visibility: document.hidden ? 'hidden' : 'visible' });
      }
    }
    function requestFullscreen() {
      if (document.fullscreenElement) {
        if (document.exitFullscreen) document.exitFullscreen().catch(function () {});
        return;
      }
      if (wrap.requestFullscreen) wrap.requestFullscreen().catch(function () { setStatus('Fullscreen is unavailable in this browser.'); });
      else setStatus('Fullscreen is unavailable in this browser.');
    }

    frame.addEventListener('load', onFrameLoad);
    frame.addEventListener('error', function () { showError('The preview package could not be reached. Retry or return to game details.'); });
    armReadyTimeout(45000);

    window.addEventListener('message', function (event) {
      if (event.source !== frame.contentWindow || event.origin !== 'null') return;
      var message = event.data;
      if (!message || typeof message !== 'object' || message.protocol !== protocol || !allowed.includes(message.type)) return;
      if (message.gameId !== gameId) return;
      var payload = message.payload && typeof message.payload === 'object' ? message.payload : {};
      if (gameId === 'claw-feed-gulper' && message.version === 1 &&
          (message.type === 'game:score' || message.type === 'game:complete')) {
        if (!Number.isSafeInteger(message.score) || message.score < 0) return;
        payload = { score: message.score };
      }
      if (message.type === 'game:ready') {
        gameReady = true;
        clearLoadTimer();
        setStatus('Preview ready. Use the game’s own menu to begin. Game progress stays in this preview session. Completed scores can save in this browser; account sync is unavailable.');
      } else if (message.type === 'game:started') {
        if (postplay) postplay.hidden = true;
        lastGameState = 'playing';
        setStatus('Game started. Game progress stays in this preview session. Completed scores can save in this browser; account sync is unavailable.');
        if (pauseButton) pauseButton.disabled = false;
        if (resumeButton) resumeButton.disabled = true;
      } else if (message.type === 'game:paused') {
        lastGameState = 'paused';
        setStatus('Game paused.');
        if (pauseButton) pauseButton.disabled = true;
        if (resumeButton) resumeButton.disabled = false;
      } else if (message.type === 'game:resumed') {
        lastGameState = 'playing';
        setStatus('Game resumed.');
        if (pauseButton) pauseButton.disabled = false;
        if (resumeButton) resumeButton.disabled = true;
      } else if (message.type === 'game:score') {
        lastGameState = 'playing';
        setStatus('Game in progress. Current score: ' + String(payload.score || '0'));
      } else if (message.type === 'game:complete') {
        if (postplay) postplay.hidden = false;
        lastGameState = 'complete';
        setStatus('Run complete. Score: ' + String(payload.score || '—') + '.');
        if (pauseButton) pauseButton.disabled = true;
        if (resumeButton) resumeButton.disabled = true;
      } else if (message.type === 'game:error') {
        showError('The game reported a runtime error. You can retry or return to details.');
      } else if (message.type === 'game:request-exit') {
        if (exitLink) window.location.assign(exitLink.href);
      } else if (message.type === 'game:request-fullscreen') {
        requestFullscreen();
      }
    });

    if (pauseButton) pauseButton.addEventListener('click', function () { send('host:pause', { reason: 'player-control' }); });
    if (resumeButton) resumeButton.addEventListener('click', function () { send('host:resume', { reason: 'player-control' }); });
    if (soundButton) soundButton.addEventListener('click', function () {
      var muted = soundButton.getAttribute('aria-pressed') !== 'true';
      soundButton.setAttribute('aria-pressed', muted ? 'true' : 'false');
      soundButton.textContent = muted ? 'Request unmute' : 'Request mute';
      send(muted ? 'host:mute' : 'host:unmute', { reason: 'player-control' });
      setStatus(muted ? 'Mute request sent to the game.' : 'Unmute request sent to the game.');
    });
    if (fullButton) fullButton.addEventListener('click', requestFullscreen);
    if (fullscreenExit) fullscreenExit.addEventListener('click', function () {
      if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(function () {});
    });
    if (retry) retry.addEventListener('click', function () {
      clearLoadTimer();
      frameLoaded = false;
      gameReady = false;
      lastGameState = 'idle';
      visibilityPaused = false;
      frame.hidden = false;
      if (errorPanel) errorPanel.hidden = true;
      if (postplay) postplay.hidden = true;
      setStatus('Retrying preview…');
      resettingFrame = true;
      frame.src = 'about:blank';
      window.setTimeout(function () {
        resettingFrame = false;
        frame.src = initialSrc;
        armReadyTimeout(45000);
      }, 60);
    });
    document.addEventListener('visibilitychange', function () {
      send('host:visibility', { visibility: document.hidden ? 'hidden' : 'visible' });
      if (document.hidden) {
        if (lastGameState === 'playing') {
          visibilityPaused = true;
          send('host:pause', { reason: 'page-hidden' });
        }
      } else if (visibilityPaused) {
        visibilityPaused = false;
        send('host:resume', { reason: 'page-visible' });
      }
    });
    window.addEventListener('pagehide', function () {
      if (lastGameState === 'playing') send('host:pause', { reason: 'pagehide' });
    });
    document.addEventListener('fullscreenchange', function () {
      var active = document.fullscreenElement === wrap;
      if (fullButton) fullButton.textContent = active ? 'Exit full screen' : 'Full screen';
      if (fullscreenExit) fullscreenExit.hidden = !active;
      if (fullscreenRail) fullscreenRail.hidden = !active;
      if (fullButton) fullButton.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function initGuestProgressionLoader() {
    var currentPath = window.location.pathname || '/';
    var brand = document.querySelector('.site-brand');
    var homePath = brand ? new URL(brand.href, window.location.href).pathname : '/';
    var baseRoot = homePath === '/' ? '' : homePath.replace(/\/+$/, '');
    var currentRelative = !baseRoot ? currentPath :
      (currentPath === baseRoot || currentPath.indexOf(baseRoot + '/') === 0
        ? currentPath.slice(baseRoot.length) || '/'
        : currentPath);
    if (currentRelative.length > 1) currentRelative = currentRelative.replace(/\/+$/, '') + '/';
    var eligibleRoutes = [
      '/feast-pass/',
      '/feast-pass/quests/',
      '/feast-pass/rewards/',
      '/profile/',
      '/world/',
      '/stories/',
      '/'
    ];
    if (eligibleRoutes.indexOf(currentRelative) === -1 || window.__toadalGuestProgressionLoading ||
        window.__toadalGuestProgressionLoaded) return;

    window.__toadalGuestProgressionLoading = true;
    function fail() {
      window.__toadalGuestProgressionLoading = false;
      var status = document.querySelector('[data-progression-storage-status]');
      if (status) status.textContent = 'Guest progress is unavailable right now. Your local starter data was not changed.';
    }
    var definitions = document.createElement('script');
    definitions.src = baseRoot + '/assets/js/progression-definitions.js';
    definitions.onload = function () {
      var runtime = document.createElement('script');
      runtime.src = baseRoot + '/assets/js/guest-progression.js';
      runtime.onload = function () {
        window.__toadalGuestProgressionLoading = false;
        window.__toadalGuestProgressionLoaded = true;
      };
      runtime.onerror = fail;
      document.head.appendChild(runtime);
    };
    definitions.onerror = fail;
    document.head.appendChild(definitions);
  }

  function initStoriesPublishingLoader() {
    var page = document.querySelector('[data-stories-hub], [data-manga-series-page], [data-comic-reader]');
    if (!page || window.__toadalStoriesPublishingLoading || window.__toadalStoriesPublishingLoaded) return;
    var brand = document.querySelector('.site-brand');
    var homePath = brand ? new URL(brand.href, window.location.href).pathname : '/';
    var baseRoot = homePath === '/' ? '' : homePath.replace(/\/+$/, '');
    window.__toadalStoriesPublishingLoading = true;
    var script = document.createElement('script');
    script.src = baseRoot + '/assets/js/stories-publishing.js';
    script.async = false;
    script.onload = function () {
      window.__toadalStoriesPublishingLoading = false;
      window.__toadalStoriesPublishingLoaded = true;
    };
    script.onerror = function () {
      window.__toadalStoriesPublishingLoading = false;
      var status = document.querySelector('[data-reader-message], [data-story-latest]');
      if (status) status.textContent = 'The story tools could not load. No publication or reading data was changed.';
    };
    document.head.appendChild(script);
  }

  function initLocalSearchLoader() {
    var currentPath = window.location.pathname || '/';
    var brand = document.querySelector('.site-brand');
    var homePath = brand ? new URL(brand.href, window.location.href).pathname : '/';
    var baseRoot = homePath === '/' ? '' : homePath.replace(/\/+$/, '');
    var relative = !baseRoot ? currentPath : (currentPath === baseRoot || currentPath.indexOf(baseRoot + '/') === 0 ? currentPath.slice(baseRoot.length) || '/' : currentPath);
    if (relative.length > 1) relative = relative.replace(/\/+$/, '') + '/';
    if (['/search/', '/support/'].indexOf(relative) === -1 || window.__toadalSearchLoading || window.__toadalSearchLoaded) return;
    window.__toadalSearchLoading = true;
    var script = document.createElement('script');
    script.src = baseRoot + '/assets/js/site-search.js';
    script.onload = function () { window.__toadalSearchLoading = false; window.__toadalSearchLoaded = true; };
    script.onerror = function () { window.__toadalSearchLoading = false; };
    document.head.appendChild(script);
  }

  function start() {
    if (window.self !== window.top) return;
    try { initStoriesPublishingLoader(); } catch (error) {}
    try { initGuestProgressionLoader(); } catch (error) {}
    try { initLocalSearchLoader(); } catch (error) {}
    try { initSkipLink(); } catch (error) {}
    try { initNavigation(); } catch (error) {}
    try { initGameFilters(); } catch (error) {}
    try { initBrowserPlayer(); } catch (error) {}
    try { initCompanion(); } catch (error) {}
    try { initFooterIdentity(); } catch (error) {}
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
(function () {
  'use strict';
  if (window.self !== window.top) return;
  var brand = document.querySelector('.site-brand');
  var homePath = brand ? new URL(brand.href, window.location.href).pathname : '/';
  var baseRoot = homePath === '/' ? '' : homePath.replace(/\/+$/, '');
  var script = document.createElement('script');
  script.src = baseRoot + '/assets/js/companion-position.js';
  script.async = false;
  document.head.appendChild(script);
})();
/* BEGIN NATIVE GAME PREVIEW V1 */
/* Native Studio game-preview pattern v1. Images remain ordinary managed images. */
(function () {
  'use strict';
  function enhance(root, environment = window) {
    if (root.dataset.gamePreviewBound === 'true') return;
    const cover = root.querySelector('[data-game-preview-cover]');
    const gameplay = root.querySelector('[data-game-preview-gameplay]');
    const toggle = root.querySelector('[data-game-preview-toggle]');
    const link = root.querySelector('[data-game-preview-link]');
    const status = root.querySelector('[data-game-preview-status]');
    if (!cover || !toggle || !link) return;
    root.dataset.gamePreviewBound = 'true';
    const hoverQuery = environment.matchMedia('(hover: hover) and (pointer: fine)');
    let hovered = false, focused = false, pinned = null, suppressed = false;
    let available = Boolean(gameplay && gameplay.complete && gameplay.naturalWidth > 0);
    const showLabel = toggle.querySelector('[data-game-preview-show-label]');
    const hideLabel = toggle.querySelector('[data-game-preview-hide-label]');
    function render() {
      const showing = available && !suppressed && (pinned === null ? hovered || focused : pinned);
      root.dataset.gamePreviewShowing = showing ? 'gameplay' : 'cover';
      toggle.hidden = false;
      toggle.disabled = !available;
      toggle.setAttribute('aria-pressed', String(Boolean(showing)));
      if (showLabel) showLabel.hidden = Boolean(showing);
      if (hideLabel) hideLabel.hidden = !showing;
      cover.setAttribute('aria-hidden', String(Boolean(showing)));
      if (gameplay) gameplay.setAttribute('aria-hidden', String(!showing));
    }
    function loaded() { available = gameplay.naturalWidth > 0; if (status) status.textContent = ''; render(); }
    function failed() {
      available = false; pinned = null;
      if (status) status.textContent = 'Gameplay image unavailable. You can still open the game details.';
      render();
    }
    if (gameplay) { gameplay.addEventListener('load', loaded); gameplay.addEventListener('error', failed); }
    cover.addEventListener('error', () => { root.dataset.gamePreviewCoverFailed = 'true'; });
    root.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'mouse' || !hoverQuery.matches) return;
      hovered = true; suppressed = false; render();
    });
    root.addEventListener('pointerleave', event => {
      if (event.pointerType !== 'mouse') return;
      hovered = false; pinned = null; suppressed = false; render();
    });
    // Only the ordinary navigation link auto-previews on keyboard focus. The
    // toggle never changes its own state merely because it received focus.
    link.addEventListener('focus', () => { focused = link.matches(':focus-visible'); suppressed = false; render(); });
    link.addEventListener('blur', () => { focused = false; render(); });
    toggle.addEventListener('click', () => {
      if (!available) return;
      pinned = root.dataset.gamePreviewShowing !== 'gameplay'; suppressed = false; render();
    });
    root.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      pinned = null; suppressed = true; render();
    });
    hoverQuery.addEventListener?.('change', () => { hovered = false; render(); });
    environment.document?.addEventListener('visibilitychange', () => {
      if (environment.document.hidden) { hovered = false; focused = false; pinned = null; suppressed = true; render(); }
    });
    if (gameplay?.complete && !gameplay.naturalWidth) failed(); else render();
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { enhance };
  if (typeof document !== 'undefined') {
    const start = () => document.querySelectorAll('[data-game-preview]').forEach(root => enhance(root));
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
    else start();
  }
})();

/* END NATIVE GAME PREVIEW V1 */

/* Home presentation labels only. The pinned guest-progression runtime and its
   UTC-day/storage/reward rules remain unchanged. Unknown/error text is retained. */
(function () {
  'use strict';
  if (window.self !== window.top) return;
  function conciseDailyCopy(status) {
    var copy = status.textContent;
    if (copy === 'A starter-config UTC-day check-in is available. Progress is local to this browser.') {
      var ready = status.getAttribute('data-daily-ready-copy');
      if (ready) status.textContent = ready;
    } else if (copy === 'Today’s UTC check-in is already claimed.') {
      var claimed = status.getAttribute('data-daily-claimed-copy');
      if (claimed) status.textContent = claimed;
    }
  }
  function start() {
    document.querySelectorAll('.today-panel [data-daily-reward-status][data-daily-ready-copy]').forEach(function (status) {
      conciseDailyCopy(status);
      new MutationObserver(function () { conciseDailyCopy(status); }).observe(status, { childList:true, characterData:true, subtree:true });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();

/* Framed Feast Pass v1: native semantic headings remain the sole text authority.
   Fixed visual preset; no custom SDK component, HTML field or economy state. */
(function () {
  'use strict';
  function isLetteringFont(face) {
    const family = String(face && face.family || '').replace(/['"]/g,'').trim().toLowerCase();
    return family === 'lilita one';
  }
  function rasterSignature(settings, devicePixelRatio, fontRevision, fontReady) {
    return JSON.stringify({settings, devicePixelRatio, fontRevision, fontReady});
  }
  function start() {
    const headings = Array.from(document.querySelectorAll('.framed-feast-pass .feast-pass-lettering'));
    if (!headings.length) return;
    const brand = document.querySelector('.site-brand');
    const home = brand ? new URL(brand.href, location.href).pathname : '/';
    const base = home === '/' ? '' : home.replace(/\/+$/, '');
    const script = document.createElement('script');
    script.src = base + '/assets/js/toadal-lettering.js';
    script.onload = () => {
      if (typeof TOADAL === 'undefined') return;
      headings.forEach(heading => {
        let lastSuccessfulRasterSignature = '';
        let fontRevision = 0;
        // A decorative sibling preserves the native text node and Studio's text editor.
        const canvas = document.createElement('canvas');
        canvas.className = 'feast-pass-lettering-canvas';
        canvas.setAttribute('aria-hidden', 'true');
        canvas.hidden = true;
        heading.after(canvas);
        function settings() {
          const text = heading.textContent.trim();
          const r = heading.getBoundingClientRect();
          if (!heading.isConnected || !r.width || !r.height || text.length > 32 || /[^A-Za-z0-9 !?.'’&-]/.test(text)) return null;
          return {w:r.width, h:r.height, letterText:text, paletteMode:'rainbow', tightness:100, endBoost:8, lineScale:80, outlineWidth:4, shine:65, bounce:0, glossOn:true, glow:false};
        }
        function render() {
          const current = settings();
          // whenReady also resolves after font failure. Require the actual loaded face.
          const loaded = document.fonts && Array.from(document.fonts).some(f => isLetteringFont(f) && f.status === 'loaded');
          if (!loaded || !current) {
            heading.classList.remove('feast-pass-lettering-ready'); canvas.hidden = true;
            return;
          }
          // Keep placement current even when the raster itself is unchanged.
          canvas.style.width = current.w + 'px'; canvas.style.height = current.h + 'px';
          canvas.style.left = heading.offsetLeft + 'px'; canvas.style.top = heading.offsetTop + 'px';
          const signature = rasterSignature(current, window.devicePixelRatio || 1, fontRevision, loaded);
          if (signature !== lastSuccessfulRasterSignature) {
            if (TOADAL.paint(canvas, current) !== true) {
              lastSuccessfulRasterSignature = '';
              heading.classList.remove('feast-pass-lettering-ready'); canvas.hidden = true;
              return;
            }
            lastSuccessfulRasterSignature = signature;
          }
          canvas.hidden = false; heading.classList.add('feast-pass-lettering-ready');
        }
        let pending = false;
        function schedule() { if (pending) return; pending = true; requestAnimationFrame(() => { pending = false; render(); }); }
        function fontChanged(event) {
          let faces;
          try { faces = event && event.fontfaces != null ? Array.from(event.fontfaces) : null; } catch { faces = null; }
          if (!faces || faces.some(isLetteringFont)) fontRevision++;
          schedule();
        }
        TOADAL.whenReady(schedule);
        new MutationObserver(schedule).observe(heading, {childList:true, characterData:true, subtree:true});
        if (typeof ResizeObserver !== 'undefined') new ResizeObserver(schedule).observe(heading);
        window.addEventListener('resize', schedule, {passive:true});
        if (document.fonts && typeof document.fonts.addEventListener === 'function') {
          document.fonts.addEventListener('loadingdone', fontChanged);
          document.fonts.addEventListener('loadingerror', fontChanged);
        }
      });
    };
    // Failure leaves selectable semantic text visible. No alternate network dependency.
    document.head.appendChild(script);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true}); else start();
})();

/* Shared navigation wordmark loader. site.json brand text remains editable and is the failure fallback. */
(function () {
  'use strict';
  function start() {
    var brand = document.querySelector('.site-brand');
    if (!brand || !window.location || !window.location.href) return;
    var homePath = new URL(brand.href, window.location.href).pathname;
    var baseRoot = homePath === '/' ? '' : homePath.replace(/\/+$/, '');
    var script = document.createElement('script');
    script.src = baseRoot + '/assets/js/home-brand-lettering.js';
    script.async = true;
    document.head.appendChild(script);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
