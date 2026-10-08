(function (root, factory) {
  'use strict';

  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document) api.start(root.document, root);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function hasWorldVisit(snapshot) {
    return !!snapshot && Array.isArray(snapshot.discoveries) && snapshot.discoveries.some(function (item) {
      return item && item.id === 'world-page-preview';
    });
  }

  function getVisitProgress(snapshot) {
    if (!snapshot || !Array.isArray(snapshot.discoveries)) {
      return { value: 0, max: 1, available: false, message: 'Guest discovery progress is unavailable in this browser.' };
    }
    if (hasWorldVisit(snapshot)) {
      return { value: 1, max: 1, available: true, message: 'World preview visit recorded in this browser · 1 of 1 available site discoveries.' };
    }
    if (snapshot.storage && snapshot.storage.available === false) {
      return { value: 0, max: 1, available: false, message: 'Guest discovery storage is unavailable; this preview stays open and no location unlocks were changed.' };
    }
    return { value: 0, max: 1, available: true, message: 'The World preview is the one available site discovery. Environment previews do not create separate location unlocks.' };
  }

  function renderProgress(snapshot, status, meter) {
    var progress = getVisitProgress(snapshot);
    if (status) status.textContent = progress.message;
    if (meter) {
      meter.max = progress.max;
      meter.value = progress.value;
      meter.setAttribute('aria-valuetext', progress.value + ' of ' + progress.max + ' available site discoveries');
    }
    return progress;
  }

  function start(document, root) {
    var map = document.querySelector('[data-world-map]');
    if (!map || map.dataset.discoveryReady === 'true') return;
    map.dataset.discoveryReady = 'true';

    function update() {
      var status = map.querySelector('[data-world-visit-status]');
      var meter = map.querySelector('[data-world-visit-meter]');
      var api = root && root.ToadalGuestProgression;
      if (!api || typeof api.createStore !== 'function') {
        renderProgress(null, status, meter);
        return;
      }
      var store;
      try {
        store = api.createStore({ storage: root.localStorage });
      } catch (_) {
        renderProgress({ discoveries: [], storage: { available: false } }, status, meter);
        return;
      }
      if (typeof store.recordEvent === 'function') store.recordEvent('route:/world/');
      renderProgress(store.getSnapshot(), status, meter);
    }

    update();
    if (root && root.addEventListener) root.addEventListener('toadal:guest-progression-ready', update);
  }

  return { getVisitProgress: getVisitProgress, hasWorldVisit: hasWorldVisit, renderProgress: renderProgress, start: start };
});
