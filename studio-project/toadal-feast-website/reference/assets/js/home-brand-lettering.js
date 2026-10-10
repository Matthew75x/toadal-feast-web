/* TOADAL FEAST shared navigation wordmark: decorative canvas over the editable site brand text. */
(function () {
  'use strict';
  if (typeof document === 'undefined') return;

  var brand = document.querySelector('.site-brand');
  if (!brand || !brand.appendChild) return;
  if (['pending', 'ready', 'image-ready', 'fallback'].indexOf(brand.dataset.homeBrandLettering) !== -1) return;
  brand.dataset.homeBrandLettering = 'pending';
  var image = brand.querySelector && brand.querySelector('.site-brand__image');
  var imageReady = false;
  var repaint = null;

  function isManagedImage() {
    if (!image || image.parentNode !== brand) return false;
    try {
      var source = new URL(image.getAttribute('src') || image.src, window.location.href);
      var page = new URL(window.location.href);
      var prefix = baseRoot() + '/assets/studio/';
      return source.origin === page.origin && source.pathname.indexOf(prefix) === 0 &&
        source.pathname.length > prefix.length;
    } catch (error) {
      return false;
    }
  }

  function restoreImageFallback() {
    imageReady = false;
    brand.classList.remove('site-brand--image-ready');
    if (repaint) repaint();
  }

  function showManagedImage() {
    // Re-check the managed path on every load, including a later src change.
    if (!isManagedImage() || !image.naturalWidth || !image.naturalHeight) {
      restoreImageFallback();
      return;
    }
    imageReady = true;
    brand.classList.add('site-brand--image-ready');
    brand.dataset.homeBrandLettering = 'image-ready';
  }

  if (image) {
    image.addEventListener('load', showManagedImage);
    image.addEventListener('error', restoreImageFallback);
    if (image.complete) showManagedImage();
  }

  var wordmark = document.createElement('span');
  wordmark.className = 'site-brand__wordmark';
  wordmark.setAttribute('aria-hidden', 'true');

  var toadalCanvas = document.createElement('canvas');
  var feastCanvas = document.createElement('canvas');
  var lastSignature = '';
  toadalCanvas.className = 'site-brand__lettering site-brand__lettering--toadal';
  feastCanvas.className = 'site-brand__lettering site-brand__lettering--feast';
  wordmark.appendChild(toadalCanvas);
  wordmark.appendChild(feastCanvas);
  brand.appendChild(wordmark);

  function baseRoot() {
    var homePath = new URL(brand.href, window.location.href).pathname;
    return homePath === '/' ? '' : homePath.replace(/\/+$/, '');
  }

  function letteringScript() {
    return Array.from(document.scripts).find(function (candidate) {
      if (!candidate.src) return false;
      try {
        return new URL(candidate.src, window.location.href).pathname.endsWith('/assets/js/toadal-lettering.js');
      } catch (error) {
        return false;
      }
    });
  }

  function brandWords() {
    var text = String(brand.textContent || '').replace(/\s+/g, ' ').trim();
    if (!text || text.length > 24) return null;
    var words = text.split(' ');
    if (words.length !== 2 || !words.every(function (word) { return /^[A-Za-z0-9]{1,10}$/.test(word); })) return null;
    return words;
  }

  function embeddedFontReady() {
    var fonts = document.fonts;
    if (!fonts) return false;
    try {
      return Array.from(fonts).some(function (face) {
        return String(face.family || '').replace(/["']/g, '').trim().toLowerCase() === 'lilita one' &&
          face.status === 'loaded';
      });
    } catch (error) {
      return false;
    }
  }

  function clearCanvas(canvas) {
    try {
      var context = canvas.getContext && canvas.getContext('2d');
      if (context) context.clearRect(0, 0, canvas.width, canvas.height);
    } catch (error) {
      // A missing 2D context means there are no pixels to retain.
    }
  }

  function showNativeFallback() {
    brand.classList.remove('site-brand--lettering-ready');
    clearCanvas(toadalCanvas);
    clearCanvas(feastCanvas);
    brand.dataset.homeBrandLettering = imageReady ? 'image-ready' : 'fallback';
    lastSignature = '';
  }

  function renderWithLettering() {
    var renderer = typeof TOADAL === 'undefined' ? null : TOADAL;
    if (!renderer || typeof renderer.whenReady !== 'function' || typeof renderer.paint !== 'function') {
      showNativeFallback();
      return;
    }

    var framePending = false;
    function paint() {
      framePending = false;
      if (!brand.isConnected || imageReady) return;
      if (wordmark.parentNode !== brand) brand.appendChild(wordmark);

      var words = brandWords();
      var toadalRect = toadalCanvas.getBoundingClientRect();
      var feastRect = feastCanvas.getBoundingClientRect();
      if (!words || !toadalRect.width || !toadalRect.height || !feastRect.width || !feastRect.height ||
        !embeddedFontReady()) {
        showNativeFallback();
        return;
      }

      var signature = words.join('\u0000') + '\u0000' +
        [toadalRect.width, toadalRect.height, feastRect.width, feastRect.height].join(':');
      if (signature === lastSignature && brand.dataset.homeBrandLettering === 'ready') return;

      try {
        var shared = {
          tightness: 100,
          endBoost: 8,
          lineScale: 80,
          outlineWidth: 2.5,
          shine: 65,
          bounce: 0,
          glossOn: true,
          glow: false
        };
        var toadalReady = renderer.paint(toadalCanvas, Object.assign({}, shared, {
          w: toadalRect.width,
          h: toadalRect.height,
          letterText: words[0],
          paletteMode: 'single',
          accent: '#ffe982',
          accent2: '#efa51b'
        })) === true;
        var feastReady = toadalReady && renderer.paint(feastCanvas, Object.assign({}, shared, {
          w: feastRect.width,
          h: feastRect.height,
          letterText: words[1],
          paletteMode: 'rainbow'
        })) === true;

        if (!toadalReady || !feastReady) {
          showNativeFallback();
          return;
        }

        lastSignature = signature;
        brand.classList.add('site-brand--lettering-ready');
        brand.dataset.homeBrandLettering = 'ready';
      } catch (error) {
        showNativeFallback();
      }
    }

    function schedule() {
      if (framePending) return;
      framePending = true;
      window.requestAnimationFrame(paint);
    }

    repaint = schedule;

    try {
      renderer.whenReady(schedule);
      if (typeof ResizeObserver !== 'undefined') new ResizeObserver(schedule).observe(wordmark);
      if (typeof MutationObserver !== 'undefined') {
        new MutationObserver(schedule).observe(brand, { childList: true, characterData: true, subtree: true });
      }
      if (document.fonts && typeof document.fonts.addEventListener === 'function') {
        document.fonts.addEventListener('loadingdone', schedule);
        document.fonts.addEventListener('loadingerror', schedule);
      }
      window.addEventListener('resize', schedule, { passive: true });
    } catch (error) {
      showNativeFallback();
    }
  }

  function startRenderer() {
    if (typeof TOADAL !== 'undefined') {
      renderWithLettering();
      return;
    }

    var existing = letteringScript();
    if (existing) {
      existing.addEventListener('load', renderWithLettering, { once: true });
      existing.addEventListener('error', showNativeFallback, { once: true });
      return;
    }

    var script = document.createElement('script');
    script.src = baseRoot() + '/assets/js/toadal-lettering.js';
    script.async = true;
    script.addEventListener('load', renderWithLettering, { once: true });
    script.addEventListener('error', showNativeFallback, { once: true });
    document.head.appendChild(script);
  }

  startRenderer();
})();
