(function (root, factory) {
  'use strict';

  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.TFStoriesPublishing = api;
    if (root.document) api.start(root.document, root);
  }
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  var STORAGE_KEY = 'toadal:web:v1:reader-progress';

  function byId(records) {
    var map = new Map();
    (Array.isArray(records) ? records : []).forEach(function (record) {
      if (record && typeof record.id === 'string') map.set(record.id, record);
    });
    return map;
  }

  function isPublic(record) {
    return !!record && (record.publicationState === 'PUBLISHED' ||
      (record.publicationState === 'PREVIEW' && record.publicPreview === true));
  }

  function getPages(registry, chapter) {
    var pageMap = byId(registry && registry.pages);
    var assetMap = registry && registry.assets && typeof registry.assets === 'object' ? registry.assets : {};
    var ids = chapter && Array.isArray(chapter.pageIds) ? chapter.pageIds : [];
    if (!ids.length || new Set(ids).size !== ids.length) return { error: 'This chapter does not have a valid ordered page manifest.' };
    var pages = [];
    for (var i = 0; i < ids.length; i += 1) {
      var page = pageMap.get(ids[i]);
      if (!isPublic(page) || page.chapterId !== chapter.id || !assetMap[page.assetId]) {
        return { error: 'This chapter is not available because a page or its approved artwork is missing.' };
      }
      pages.push(page);
    }
    return { pages: pages, assets: assetMap };
  }

  function resolveChapter(registry, seriesKey, chapterKey) {
    var series = (registry && registry.series || []).find(function (entry) {
      return entry && (entry.id === seriesKey || entry.slug === seriesKey);
    });
    if (!isPublic(series)) return { error: 'That series is not publicly available.' };
    var chapter = (registry && registry.chapters || []).find(function (entry) {
      return entry && entry.seriesId === series.id && (entry.id === chapterKey || entry.slug === chapterKey);
    });
    if (!isPublic(chapter)) return { error: 'That chapter is not publicly available.' };
    var result = getPages(registry, chapter);
    if (result.error) return result;
    return { series: series, chapter: chapter, pages: result.pages, assets: result.assets };
  }

  function loadProgress(storage) {
    if (!storage) return { entries: {}, corrupt: false, unavailable: true };
    try {
      var raw = storage.getItem(STORAGE_KEY);
      if (!raw) return { entries: {}, corrupt: false };
      var parsed = JSON.parse(raw);
      if (!parsed || parsed.schemaVersion !== 1 || !parsed.entries || typeof parsed.entries !== 'object' || Array.isArray(parsed.entries)) {
        return { entries: {}, corrupt: true };
      }
      var validEntries = Object.keys(parsed.entries).every(function (chapterId) {
        var entry = parsed.entries[chapterId];
        return !!entry && typeof entry === 'object' && !Array.isArray(entry) &&
          entry.chapterId === chapterId && typeof entry.seriesId === 'string' && entry.seriesId.length > 0 &&
          typeof entry.pageId === 'string' && entry.pageId.length > 0 &&
          typeof entry.updatedAt === 'string' && entry.updatedAt.length > 0;
      });
      if (!validEntries) return { entries: {}, corrupt: true };
      return { entries: parsed.entries, corrupt: false };
    } catch (error) {
      return { entries: {}, corrupt: true };
    }
  }

  function saveProgress(storage, record) {
    if (!storage || !record || !record.seriesId || !record.chapterId || !record.pageId) return false;
    var current = loadProgress(storage);
    if (current.corrupt) return false;
    current.entries[record.chapterId] = {
      seriesId: record.seriesId,
      chapterId: record.chapterId,
      pageId: record.pageId,
      updatedAt: record.updatedAt || new Date().toISOString()
    };
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 1, entries: current.entries }));
      return true;
    } catch (error) {
      return false;
    }
  }

  function safeStorage(root) {
    try { return root.localStorage; } catch (error) { return null; }
  }

  function chapterIdsForSeries(registry, series) {
    var chapters = byId(registry && registry.chapters);
    var arcs = byId(registry && registry.arcs);
    var explicit = [];
    if (Array.isArray(series.chapterIds) && series.chapterIds.length) explicit = series.chapterIds.slice();
    else if (Array.isArray(series.arcIds) && series.arcIds.length) {
      series.arcIds.forEach(function (arcId) {
        var arc = arcs.get(arcId);
        if (arc && Array.isArray(arc.chapterIds)) explicit = explicit.concat(arc.chapterIds);
      });
    }
    if (!explicit.length) {
      explicit = (registry && registry.chapters || []).filter(function (chapter) {
        return chapter && chapter.seriesId === series.id;
      }).slice().sort(function (a, b) {
        return (Number(a.order) || 0) - (Number(b.order) || 0);
      }).map(function (chapter) { return chapter.id; });
    }
    return explicit.map(function (id) { return chapters.get(id); }).filter(function (chapter) {
      return chapter && chapter.seriesId === series.id && isPublic(chapter);
    });
  }

  function resolveBaseRoot(document) {
    var brand = document.querySelector('.site-brand');
    if (!brand) return '';
    try {
      var path = new URL(brand.href, document.location.href).pathname;
      return path === '/' ? '' : path.replace(/\/+$/, '');
    } catch (error) {
      return '';
    }
  }

  function localHref(baseRoot, route, query) {
    var url = baseRoot + route;
    if (query) url += '?' + new URLSearchParams(query).toString();
    return url;
  }

  function create(tag, className, text) {
    var element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function publicSeries(registry) {
    return (registry && registry.series || []).filter(isPublic);
  }

  function latestPublishedChapter(registry, series) {
    return chapterIdsForSeries(registry, series).filter(function (chapter) {
      return chapter.publicationState === 'PUBLISHED';
    }).slice(-1)[0] || null;
  }

  function readRouteKeys(document) {
    var params = new URLSearchParams(document.location.search || '');
    var seriesKey = params.get('series') || '';
    var chapterKey = params.get('chapter') || '';
    if (!seriesKey || !chapterKey) {
      var path = document.location.pathname || '';
      var brand = document.querySelector('.site-brand');
      if (brand) {
        try {
          var homePath = new URL(brand.href, document.location.href).pathname;
          var baseRoot = homePath === '/' ? '' : homePath.replace(/\/+$/, '');
          if (baseRoot && path.indexOf(baseRoot + '/') === 0) path = path.slice(baseRoot.length);
        } catch (error) {}
      }
      var match = path.match(/^\/stories\/([^/]+)\/([^/]+)\/read\/?$/);
      if (match) {
        try { seriesKey = seriesKey || decodeURIComponent(match[1]); } catch (error) {}
        try { chapterKey = chapterKey || decodeURIComponent(match[2]); } catch (error) {}
      }
    }
    return { seriesKey: seriesKey, chapterKey: chapterKey };
  }

  function keyboardPageDelta(direction, key) {
    if (key === 'ArrowLeft') return direction === 'rtl' ? 1 : -1;
    if (key === 'ArrowRight') return direction === 'rtl' ? -1 : 1;
    return 0;
  }

  function swipePageDelta(direction, dx, dy) {
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.25) return 0;
    var forward = direction === 'rtl' ? dx > 0 : dx < 0;
    return forward ? 1 : -1;
  }

  async function fetchRegistry(document, root, pageRoot) {
    if (root && root.__TOADAL_STORY_TEST_REGISTRY__) return root.__TOADAL_STORY_TEST_REGISTRY__;
    var baseRoot = resolveBaseRoot(document);
    var rawPath = pageRoot.getAttribute('data-story-index') || '/assets/data/story-content.json';
    var path = rawPath.charAt(0) === '/' ? baseRoot + rawPath : rawPath;
    var response = await root.fetch(path, { credentials: 'same-origin', cache: 'no-cache' });
    if (!response.ok) throw new Error('Story registry request failed with ' + response.status);
    return response.json();
  }

  function renderHub(document, root, registry) {
    var baseRoot = resolveBaseRoot(document);
    var list = document.querySelector('[data-story-series-list]');
    if (list) {
      list.replaceChildren();
      var series = publicSeries(registry);
      if (!series.length) {
        list.appendChild(create('div', 'story-empty-card', 'No approved public series are available yet.'));
      } else {
        series.forEach(function (entry) {
          var card = create('article', 'story-series-card');
          var heading = create('h3', '', entry.title || 'Untitled series');
          var summary = create('p', '', entry.summary || 'Series description is not available.');
          var state = create('span', 'story-status', entry.publicationState === 'PREVIEW' ? 'PREVIEW' : 'PUBLISHED');
          var link = create('a', 'story-text-link', 'Open series →');
          link.href = localHref(baseRoot, '/manga/', { series: entry.slug });
          card.append(state, heading, summary, link);
          list.appendChild(card);
        });
      }
    }

    var latest = document.querySelector('[data-story-latest]');
    if (latest) {
      latest.replaceChildren();
      var chapters = publicSeries(registry).map(function (series) {
        var chapter = latestPublishedChapter(registry, series);
        return chapter ? { series: series, chapter: chapter } : null;
      }).filter(Boolean);
      if (!chapters.length) latest.appendChild(create('p', 'story-empty-copy', 'No chapter is marked PUBLISHED, so there is no latest chapter to show.'));
      else chapters.forEach(function (entry) {
        var card = create('div', 'story-latest-card');
        card.append(create('p', 'story-kicker', entry.series.title || 'TOADAL FEAST Manga'), create('h3', '', entry.chapter.title || entry.chapter.displayLabel || 'Published chapter'));
        var link = create('a', 'story-button story-button-primary', 'Read chapter →');
        link.href = localHref(baseRoot, '/reader/', { series: entry.series.slug, chapter: entry.chapter.slug });
        card.appendChild(link);
        latest.appendChild(card);
      });
    }

    renderProgressSummary(document, root, registry, publicSeries(registry));
  }

  function renderProgressSummary(document, root, registry, seriesList) {
    var progressRoots = document.querySelectorAll('[data-story-progress]');
    if (!progressRoots.length) return;
    var state = loadProgress(safeStorage(root));
    progressRoots.forEach(function (target) {
      target.replaceChildren();
      if (state.corrupt) {
        target.appendChild(create('p', 'story-empty-copy', 'Saved reading position could not be read. Other site progress was not changed.'));
        return;
      }
      if (state.unavailable) {
        target.appendChild(create('p', 'story-empty-copy', 'Local reading bookmarks are unavailable in this browser. Other site progress was not changed.'));
        return;
      }
      var match = null;
      Object.keys(state.entries).some(function (chapterId) {
        var saved = state.entries[chapterId];
        var series = seriesList.find(function (entry) { return entry.id === saved.seriesId; });
        if (!series) return false;
        var chapter = chapterIdsForSeries(registry, series).find(function (entry) { return entry.id === chapterId; });
        if (!chapter) return false;
        var pageIndex = (chapter.pageIds || []).indexOf(saved.pageId);
        if (pageIndex < 0) return false;
        match = { series: series, chapter: chapter, pageIndex: pageIndex };
        return true;
      });
      if (!match) {
        target.appendChild(create('div', 'story-progress-empty', 'There is nothing to resume yet. Reading progress appears after you open an available chapter.'));
        return;
      }
      var link = create('a', 'story-button story-button-primary', 'Resume ' + (match.chapter.title || match.chapter.displayLabel || 'reading') + ' · page ' + (match.pageIndex + 1));
      link.href = localHref(resolveBaseRoot(document), '/reader/', { series: match.series.slug, chapter: match.chapter.slug });
      target.appendChild(link);
    });
  }

  function renderSeriesPage(document, root, registry, pageRoot) {
    var params = new URLSearchParams(document.location.search || '');
    var key = params.get('series') || pageRoot.getAttribute('data-series-id') || '';
    var series = publicSeries(registry).find(function (entry) { return entry.id === key || entry.slug === key; });
    if (!series) return;
    var baseRoot = resolveBaseRoot(document);
    var title = document.querySelector('.manga-series-copy h1');
    var summary = document.querySelector('.manga-series-summary');
    var status = document.querySelector('.manga-series-copy > .story-status');
    var chaptersRoot = document.querySelector('[data-story-chapter-list]');
    if (title) title.textContent = series.title;
    if (summary) summary.textContent = series.summary || 'No approved series synopsis is available.';
    if (status) status.textContent = series.publicationState === 'PREVIEW' ? 'PREVIEW · NOT PUBLISHED' : 'PUBLISHED';
    var cover = document.querySelector('.manga-series-art > img');
    var caption = document.querySelector('.manga-series-art figcaption');
    if (cover && series.coverAssetId && registry.assets && registry.assets[series.coverAssetId]) {
      cover.src = baseRoot + registry.assets[series.coverAssetId];
      cover.alt = series.coverAlt || 'Approved cover artwork for ' + series.title + '.';
      if (caption) caption.textContent = 'Published series cover';
    }
    var continueButton = document.querySelector('[data-story-continue]');
    var latest = series.publicationState === 'PUBLISHED' ? latestPublishedChapter(registry, series) : null;
    if (continueButton) {
      if (latest) {
        continueButton.disabled = false;
        continueButton.removeAttribute('aria-disabled');
        continueButton.textContent = 'Continue reading →';
        continueButton.addEventListener('click', function () {
          root.location.assign(localHref(baseRoot, '/reader/', { series: series.slug, chapter: latest.slug }));
        });
      } else {
        continueButton.disabled = true;
        continueButton.setAttribute('aria-disabled', 'true');
        continueButton.textContent = 'Continue reading · no published chapter';
      }
    }
    if (chaptersRoot) {
      chaptersRoot.replaceChildren();
      var chapters = chapterIdsForSeries(registry, series);
      if (!chapters.length) chaptersRoot.appendChild(create('p', 'story-empty-copy', 'No public chapters are available.'));
      else chapters.forEach(function (chapter) {
        var row = create('div', 'story-chapter-row');
        row.append(create('span', '', chapter.displayLabel || 'Chapter'), create('strong', '', chapter.title || 'Title not available'));
        if (chapter.publicationState === 'PUBLISHED') {
          var link = create('a', 'story-text-link', 'Read →');
          link.href = localHref(baseRoot, '/reader/', { series: series.slug, chapter: chapter.slug });
          row.appendChild(link);
        } else row.appendChild(create('span', 'story-status story-status-muted', 'Preview'));
        chaptersRoot.appendChild(row);
      });
    }
    var synopsisStatus = document.querySelector('.manga-synopsis-panel .story-status');
    if (synopsisStatus) synopsisStatus.textContent = series.publicationState === 'PREVIEW' ? 'Preview metadata' : 'Series metadata';
    var chapterCount = document.querySelector('.manga-chapters-panel .story-status');
    if (chapterCount) chapterCount.textContent = String(chapterIdsForSeries(registry, series).length) + ' public';
    renderProgressSummary(document, root, registry, [series]);
  }

  function renderReader(document, root, registry, pageRoot) {
    var baseRoot = resolveBaseRoot(document);
    var route = readRouteKeys(document);
    var seriesKey = route.seriesKey || pageRoot.getAttribute('data-series-id') || '';
    var chapterKey = route.chapterKey || pageRoot.getAttribute('data-chapter-id') || '';
    var titleNode = document.querySelector('[data-reader-title]');
    var labelNode = document.querySelector('[data-reader-chapter-label]');
    var stateNode = document.querySelector('[data-reader-state]');
    var messageNode = document.querySelector('[data-reader-message]');
    var emptyNode = document.querySelector('[data-reader-empty]');
    var figure = document.querySelector('[data-reader-page-figure]');
    var image = document.querySelector('[data-reader-page]');
    var altNode = document.querySelector('[data-reader-page-alt]');
    var errorNode = document.querySelector('[data-reader-error]');
    var progressBar = document.querySelector('[data-reader-progress-bar]');
    var pageNumber = document.querySelector('[data-reader-page-number]');
    var pageTotal = document.querySelector('[data-reader-page-total]');
    var thumbnails = document.querySelector('[data-reader-thumbnails]');
    var thumbnailLabel = document.querySelector('[data-reader-thumbnail-label]');
    var saveButton = document.querySelector('[data-reader-save]');
    var previousButton = document.querySelector('[data-reader-previous]');
    var nextButton = document.querySelector('[data-reader-next]');
    var previousChapterButton = document.querySelector('[data-reader-previous-chapter]');
    var nextChapterButton = document.querySelector('[data-reader-next-chapter]');
    var retryButton = document.querySelector('[data-reader-retry]');
    var viewer = document.querySelector('[data-reader-viewer]');
    var fullscreenButton = document.querySelector('[data-reader-fullscreen]');
    var context = resolveChapter(registry, seriesKey, chapterKey);

    if (fullscreenButton) fullscreenButton.addEventListener('click', function () {
      var target = document.querySelector('[data-reader-shell]');
      if (!target) return;
      if (document.fullscreenElement) {
        if (document.exitFullscreen) document.exitFullscreen().catch(function () {});
      } else if (target.requestFullscreen) target.requestFullscreen().catch(function () {
        if (messageNode) messageNode.textContent = 'Fullscreen is unavailable in this browser.';
      });
      else if (messageNode) messageNode.textContent = 'Fullscreen is unavailable in this browser.';
    });
    document.addEventListener('fullscreenchange', function () {
      if (fullscreenButton) {
        var isFullscreen = !!document.fullscreenElement;
        fullscreenButton.textContent = isFullscreen ? 'Exit fullscreen' : 'Fullscreen';
        fullscreenButton.setAttribute('aria-label', isFullscreen ? 'Exit reader fullscreen' : 'Enter reader fullscreen');
      }
    });

    if (!seriesKey && !chapterKey) {
      if (stateNode) stateNode.textContent = 'No published chapter is available';
      if (messageNode) messageNode.textContent = 'This reader will show approved comic pages when a chapter is published. No sample pages are included.';
      return;
    }
    if (context.error) {
      if (stateNode) stateNode.textContent = 'This chapter is not available';
      if (messageNode) messageNode.textContent = context.error + ' Browse the published story library instead.';
      return;
    }

    var series = context.series;
    var chapter = context.chapter;
    var pages = context.pages;
    var assets = context.assets;
    var direction = series.readingDirection || chapter.readingDirection || 'ltr';
    var currentIndex = 0;
    var storage = safeStorage(root);
    var readState = loadProgress(storage);
    if (!readState.corrupt && readState.entries[chapter.id]) {
      var savedIndex = pages.findIndex(function (page) { return page.id === readState.entries[chapter.id].pageId; });
      if (savedIndex >= 0) currentIndex = savedIndex;
    }

    if (titleNode) titleNode.textContent = series.title || 'TOADAL FEAST Manga';
    if (labelNode) labelNode.textContent = chapter.displayLabel || chapter.title || 'Chapter';
    if (stateNode) stateNode.textContent = series.publicationState === 'PREVIEW' || chapter.publicationState === 'PREVIEW' ? 'Public preview chapter' : 'Published chapter';
    if (messageNode) messageNode.textContent = chapter.summary || 'Use the page controls, keyboard arrows, or a swipe to move through this published chapter.';
    if (document.querySelector('[data-reader-info-title]')) document.querySelector('[data-reader-info-title]').textContent = series.title || 'TOADAL FEAST Manga';
    if (document.querySelector('[data-reader-info-status]')) document.querySelector('[data-reader-info-status]').textContent = series.publicationState === 'PREVIEW' ? 'Series publication state: Preview' : 'Series publication state: Published';
    if (document.querySelector('[data-reader-info-summary]')) document.querySelector('[data-reader-info-summary]').textContent = series.summary || 'No approved series synopsis is available.';
    var seriesLink = document.querySelector('[data-reader-series-link]');
    if (seriesLink) seriesLink.href = localHref(baseRoot, '/manga/', { series: series.slug });
    if (emptyNode) emptyNode.hidden = true;
    if (figure) figure.hidden = false;
    if (saveButton) {
      saveButton.disabled = false;
      saveButton.removeAttribute('aria-disabled');
    }
    if (previousButton) previousButton.disabled = false;
    if (nextButton) nextButton.disabled = false;
    if (previousChapterButton) previousChapterButton.disabled = false;
    if (nextChapterButton) nextChapterButton.disabled = false;
    if (thumbnailLabel) thumbnailLabel.textContent = pages.length + (pages.length === 1 ? ' page' : ' pages');

    var orderedChapters = chapterIdsForSeries(registry, series);
    var chapterIndex = orderedChapters.findIndex(function (entry) { return entry.id === chapter.id; });
    function setDisabled(button, disabled) {
      if (!button) return;
      button.disabled = disabled;
      if (disabled) button.setAttribute('aria-disabled', 'true');
      else button.removeAttribute('aria-disabled');
    }
    function writePage() {
      var page = pages[currentIndex];
      if (!page) return;
      var assetPath = assets[page.assetId];
      if (image) {
        image.onload = function () {
          if (errorNode) errorNode.hidden = true;
        };
        image.onerror = function () {
          if (errorNode) errorNode.hidden = false;
        };
        image.alt = page.alt || 'Comic page ' + (currentIndex + 1);
        image.loading = 'eager';
        image.src = baseRoot + assetPath;
      }
      if (altNode) altNode.textContent = page.alt || '';
      if (pageNumber) pageNumber.textContent = String(currentIndex + 1);
      if (pageTotal) pageTotal.textContent = String(pages.length);
      if (progressBar) progressBar.style.width = ((currentIndex + 1) / pages.length * 100) + '%';
      setDisabled(previousButton, currentIndex === 0);
      setDisabled(nextButton, currentIndex === pages.length - 1);
      if (thumbnails) {
        thumbnails.querySelectorAll('[data-page-index]').forEach(function (button) {
          if (Number(button.getAttribute('data-page-index')) === currentIndex) button.setAttribute('aria-current', 'page');
          else button.removeAttribute('aria-current');
        });
      }
      saveProgress(storage, { seriesId: series.id, chapterId: chapter.id, pageId: page.id });
      preloadAdjacent(currentIndex);
    }
    function preloadAdjacent(index) {
      [index - 1, index + 1].forEach(function (neighbor) {
        if (neighbor < 0 || neighbor >= pages.length) return;
        var nextPage = pages[neighbor];
        var nextAsset = assets[nextPage.assetId];
        if (!nextAsset) return;
        var preloaded = new root.Image();
        preloaded.src = baseRoot + nextAsset;
      });
    }
    function selectPage(index) {
      if (!Number.isInteger(index) || index < 0 || index >= pages.length) return;
      currentIndex = index;
      writePage();
    }
    function movePage(directionStep) {
      selectPage(currentIndex + directionStep);
    }
    function chapterHref(target) {
      return localHref(baseRoot, '/reader/', { series: series.slug, chapter: target.slug });
    }

    if (thumbnails) {
      thumbnails.replaceChildren();
      pages.forEach(function (page, index) {
        var item = create('li', 'reader-thumbnail-item');
        var button = create('button', 'reader-thumbnail-button');
        button.type = 'button';
        button.setAttribute('data-page-index', String(index));
        button.setAttribute('aria-label', 'Go to page ' + (index + 1));
        var thumb = create('img', '');
        thumb.alt = '';
        thumb.loading = 'lazy';
        thumb.decoding = 'async';
        thumb.src = baseRoot + (assets[page.thumbnailAssetId] || assets[page.assetId]);
        button.appendChild(thumb);
        button.appendChild(create('span', '', String(index + 1)));
        button.addEventListener('click', function () { selectPage(index); });
        item.appendChild(button);
        thumbnails.appendChild(item);
      });
    }
    if (previousButton) previousButton.addEventListener('click', function () { movePage(-1); });
    if (nextButton) nextButton.addEventListener('click', function () { movePage(1); });
    if (saveButton) saveButton.addEventListener('click', function () {
      if (saveProgress(storage, { seriesId: series.id, chapterId: chapter.id, pageId: pages[currentIndex].id })) {
        saveButton.textContent = 'Position saved';
      } else if (messageNode) messageNode.textContent = 'The reading position could not be saved. Your other site progress was not changed.';
    });
    if (retryButton) retryButton.addEventListener('click', function () {
      if (!image) return;
      var source = baseRoot + assets[pages[currentIndex].assetId];
      image.src = source + (source.indexOf('?') < 0 ? '?' : '&') + 'retry=' + Date.now();
    });
    if (previousChapterButton) previousChapterButton.addEventListener('click', function () {
      if (chapterIndex > 0) root.location.assign(chapterHref(orderedChapters[chapterIndex - 1]));
    });
    if (nextChapterButton) nextChapterButton.addEventListener('click', function () {
      if (chapterIndex >= 0 && chapterIndex < orderedChapters.length - 1) root.location.assign(chapterHref(orderedChapters[chapterIndex + 1]));
    });
    setDisabled(previousChapterButton, chapterIndex <= 0);
    setDisabled(nextChapterButton, chapterIndex < 0 || chapterIndex >= orderedChapters.length - 1);
    if (viewer) {
      viewer.addEventListener('keydown', function (event) {
        if (event.altKey || event.ctrlKey || event.metaKey || event.target.closest('button, a, input, textarea, select')) return;
        var delta = keyboardPageDelta(direction, event.key);
        if (delta) {
          event.preventDefault();
          movePage(delta);
        }
      });
      var pointerStart = null;
      viewer.addEventListener('pointerdown', function (event) {
        if (event.pointerType === 'mouse' || event.target.closest('button, a')) return;
        pointerStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
        if (viewer.setPointerCapture) viewer.setPointerCapture(event.pointerId);
      });
      viewer.addEventListener('pointerup', function (event) {
        if (!pointerStart || pointerStart.id !== event.pointerId) return;
        var dx = event.clientX - pointerStart.x;
        var dy = event.clientY - pointerStart.y;
        pointerStart = null;
        var delta = swipePageDelta(direction, dx, dy);
        if (delta) movePage(delta);
      });
      viewer.addEventListener('pointercancel', function () { pointerStart = null; });
    }
    var chapterList = document.querySelector('[data-reader-chapter-list]');
    if (chapterList) {
      chapterList.replaceChildren();
      orderedChapters.forEach(function (entry) {
        var row = create('a', 'reader-chapter-link', (entry.displayLabel || entry.title || 'Chapter') + (entry.id === chapter.id ? ' · Current' : ''));
        row.href = chapterHref(entry);
        chapterList.appendChild(row);
      });
    }
    writePage();
  }

  function start(document, root) {
    var hub = document.querySelector('[data-stories-hub]');
    var seriesPage = document.querySelector('[data-manga-series-page]');
    var reader = document.querySelector('[data-comic-reader]');
    if (!hub && !seriesPage && !reader) return;
    var pageRoot = reader || seriesPage || hub;
    fetchRegistry(document, root, pageRoot).then(function (registry) {
      if (!registry || registry.schemaVersion !== 1) throw new Error('Story registry schema version is not supported.');
      if (hub) renderHub(document, root, registry);
      if (seriesPage) renderSeriesPage(document, root, registry, seriesPage);
      if (reader) renderReader(document, root, registry, reader);
    }).catch(function () {
      var message = document.querySelector('[data-reader-message]') || document.querySelector('[data-story-latest]');
      if (message) message.textContent = 'Story information could not be loaded. No reader or publication data was changed.';
    });
  }

  return {
    STORAGE_KEY: STORAGE_KEY,
    chapterIdsForSeries: chapterIdsForSeries,
    getPages: getPages,
    isPublic: isPublic,
    keyboardPageDelta: keyboardPageDelta,
    loadProgress: loadProgress,
    readRouteKeys: readRouteKeys,
    resolveChapter: resolveChapter,
    saveProgress: saveProgress,
    swipePageDelta: swipePageDelta,
    start: start
  };
});
