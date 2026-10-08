/* Thin adapters over the qualified website. No cartridge or backend authority. */
(function (root) {
  'use strict';
  var document = root.document;
  if (!document || root.self !== root.top || root.__toadalManifestShell) return;
  root.__toadalManifestShell = true;
  var brand = document.querySelector('.site-brand');
  if (!brand) return;
  var home = new URL(brand.href, root.location.href);
  var base = home.pathname === '/' ? '' : home.pathname.replace(/\/+$/, '');
  var route = root.location.pathname.slice(base.length) || '/';
  if (route.length > 1 && !route.endsWith('.html')) route = route.replace(/\/+$/, '') + '/';
  var loads = new Map();

  function load(file) {
    if (loads.has(file)) return loads.get(file);
    var promise = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = base + '/assets/js/' + file;
      script.async = false;
      script.onload = resolve;
      script.onerror = function () { reject(new Error('Website adapter unavailable: ' + file)); };
      document.head.appendChild(script);
    });
    loads.set(file, promise);
    return promise;
  }
  function storageUnavailable() {
    document.querySelectorAll('[data-progression-storage-status]').forEach(function (element) {
      element.textContent = 'Local journey tools are unavailable. Your existing progress has not been changed.';
    });
  }
  function ensureProgression() {
    if (root.ToadalGuestProgression) return Promise.resolve();
    if (root.__toadalGuestProgressionLoading) return new Promise(function (resolve, reject) {
      var timeout = root.setTimeout(function () { reject(new Error('Guest progression did not load.')); }, 10000);
      root.addEventListener('toadal:guest-progression-ready', function () { root.clearTimeout(timeout); resolve(); }, { once: true });
      if (root.ToadalGuestProgression) { root.clearTimeout(timeout); resolve(); }
    });
    root.__toadalGuestProgressionLoading = true;
    return load('progression-definitions.js').then(function () { return load('guest-progression.js'); }).then(function () {
      root.__toadalGuestProgressionLoading = false;
      root.__toadalGuestProgressionLoaded = true;
    }, function (error) { root.__toadalGuestProgressionLoading = false; throw error; });
  }

  // Disabled service controls remain disabled; separate explanations are keyboard/touch usable.
  document.querySelectorAll('[data-unavailable-action]').forEach(function (button, index) {
    var copy = button.getAttribute('data-unavailable-copy') || 'This feature is not available yet. You can continue exploring the Feast.';
    button.setAttribute('data-companion-context', 'under-construction');
    button.setAttribute('data-companion-action', 'true');
    button.setAttribute('data-companion-action-copy', copy);
    button.setAttribute('data-companion-reaction', 'construction');
    var status = document.createElement('p');
    status.className = 'manifest-unavailable-status';
    status.id = 'manifest-unavailable-' + index;
    status.setAttribute('role', 'status');
    status.hidden = true;
    button.insertAdjacentElement('afterend', status);
    button.setAttribute('aria-controls', status.id);
    button.addEventListener('click', function () {
      status.replaceChildren(document.createTextNode(copy + ' '));
      var destination = button.getAttribute('data-unavailable-destination') || '/play/';
      if (!/^\/(?!\/)/.test(destination) || /[\\\u0000-\u001f]/.test(destination)) destination = '/play/';
      var link = document.createElement('a');
      link.href = base + destination;
      link.textContent = button.getAttribute('data-unavailable-link-label') || 'Explore available content';
      status.appendChild(link);
      status.hidden = false;
      button.setAttribute('aria-expanded', 'true');
    });
  });

  if (route === '/play/' && document.querySelector('[data-catalogue-root]')) {
    load('play-catalogue.js').catch(function () {
      var status = document.querySelector('[data-catalogue-status]');
      if (status) status.textContent = 'Catalogue filters could not load. All existing listings, labels and game-detail links remain available below.';
      var area = document.querySelector('[data-catalogue-root]');
      if (area) area.setAttribute('data-catalogue-state', 'unavailable');
    });
  }

  // These are website-local bridges; untouched iframe games never receive these modules.
  var needsProgress = document.querySelector('[data-progression-page]') ||
    ['/', '/world/', '/characters/', '/characters/toadal/', '/stories/', '/play/', '/games/wicked-bites/', '/player/wicked-bites/', '/leaderboards/', '/account/'].includes(route);
  var ready = needsProgress ? ensureProgression() : Promise.resolve();
  ready.catch(storageUnavailable);
  if (['/play/', '/games/wicked-bites/', '/player/wicked-bites/', '/leaderboards/', '/profile/'].includes(route)) {
    ready.then(function () { return load('website-score-adapter.js'); }).catch(storageUnavailable);
  }
  if (['/media/', '/news/', '/news/devlog/', '/roadmap/', '/support/'].includes(route)) {
    load('editorial-manifest.js').catch(function () {
      document.querySelectorAll('[data-editorial-status]').forEach(function (element) { element.textContent = 'The preview tools are unavailable. No content was published or changed.'; });
    });
  }
  if (['/world/', '/characters/', '/characters/toadal/'].includes(route)) {
    ready.then(function () { return load('world-discovery.js'); }).catch(storageUnavailable);
  }
})(window);
