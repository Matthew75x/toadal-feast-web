(function (root, factory) {
  'use strict';

  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document) api.start(root.document, root);
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  var NEWS_TAXONOMY = [
    { id: 'announcements', label: 'Announcements' },
    { id: 'development', label: 'Development notes' },
    { id: 'games', label: 'Games' },
    { id: 'world-stories', label: 'World & stories' }
  ];
  var ROADMAP_STATUSES = [
    { id: 'available-now', label: 'Available Now' },
    { id: 'in-development', label: 'In Development' },
    { id: 'coming-soon', label: 'Coming Soon' },
    { id: 'exploring', label: 'Exploring' }
  ];

  // Static defaults are empty; runtime rendering fetches the registry projection.
  var NEWS_RECORDS = [];
  var ROADMAP_RECORDS = [];

  function normalize(value) {
    return String(value || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, ' ').trim();
  }

  function isObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  function validSlug(value) {
    return typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
  }

  function validInternalRoute(value) {
    return typeof value === 'string' && /^\/(?!\/)/.test(value) && !/[\\\s]/.test(value) && !/(?:^|\/)\.\.(?:\/|$)/.test(value);
  }

  function validDate(value) {
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  }

  function cleanSlugs(value, excludedSlug) {
    if (!Array.isArray(value)) return [];
    var seen = new Set();
    return value.filter(function (slug) {
      if (!validSlug(slug) || slug === excludedSlug || seen.has(slug)) return false;
      seen.add(slug);
      return true;
    });
  }

  function projectPullQuote(value) {
    if (!isObject(value) || typeof value.text !== 'string' || !value.text.trim()) return null;
    return {
      text: value.text.trim(),
      attribution: typeof value.attribution === 'string' ? value.attribution.trim() : ''
    };
  }

  function projectPublishedNews(records) {
    var categories = new Set(NEWS_TAXONOMY.map(function (item) { return item.id; }));
    return (Array.isArray(records) ? records : []).filter(function (record) {
      return isObject(record) && record.publicationState === 'PUBLISHED' && validSlug(record.slug) &&
        typeof record.title === 'string' && record.title.trim() &&
        typeof record.summary === 'string' && record.summary.trim() &&
        categories.has(record.category) && validDate(record.publishedAt);
    }).map(function (record) {
      return {
        slug: record.slug,
        title: record.title.trim(),
        summary: record.summary.trim(),
        category: record.category,
        publishedAt: record.publishedAt,
        featured: record.featured === true,
        tags: Array.isArray(record.tags) ? record.tags.filter(function (tag) { return typeof tag === 'string'; }) : [],
        body: Array.isArray(record.body) ? record.body.filter(function (paragraph) { return typeof paragraph === 'string' && paragraph.trim(); }) : [],
        pullQuote: projectPullQuote(record.pullQuote),
        relatedSlugs: cleanSlugs(record.relatedSlugs, record.slug),
        image: typeof record.image === 'string' && /^\/assets\/[a-zA-Z0-9_./-]+$/.test(record.image) && !record.image.includes('..') ? record.image : '',
        imageAlt: typeof record.imageAlt === 'string' ? record.imageAlt : ''
      };
    }).sort(function (a, b) { return b.publishedAt.localeCompare(a.publishedAt) || a.slug.localeCompare(b.slug); });
  }

  function filterNews(records, options) {
    var settings = options || {};
    var category = settings.category || 'all';
    var query = normalize(settings.query);
    var tokens = query ? query.split(/\s+/).filter(Boolean) : [];
    return projectPublishedNews(records).filter(function (record) {
      if (category !== 'all' && record.category !== category) return false;
      var haystack = normalize([record.title, record.summary, record.category, record.tags.join(' '), record.body.join(' ')].join(' '));
      return tokens.every(function (token) { return haystack.includes(token); });
    });
  }

  function projectRelatedNews(record, records) {
    if (!record) return [];
    var published = projectPublishedNews(records);
    var bySlug = new Map(published.map(function (item) { return [item.slug, item]; }));
    return cleanSlugs(record.relatedSlugs, record.slug).map(function (slug) { return bySlug.get(slug); }).filter(Boolean);
  }

  function projectRoadmap(records) {
    var statuses = new Set(ROADMAP_STATUSES.map(function (item) { return item.id; }));
    return (Array.isArray(records) ? records : []).filter(function (record) {
      return isObject(record) && record.publicationState === 'PUBLISHED' && statuses.has(record.status) &&
        validSlug(record.slug) && typeof record.title === 'string' && record.title.trim() &&
        typeof record.summary === 'string' && record.summary.trim() && validInternalRoute(record.route) &&
        ['PREVIEW', 'COMING_SOON', 'PLANNED'].indexOf(record.publicStatus) !== -1;
    }).map(function (record) {
      return {
        slug: record.slug,
        title: record.title.trim(),
        summary: record.summary.trim(),
        status: record.status,
        publicStatus: record.publicStatus,
        route: record.route,
        relatedDevlogSlugs: cleanSlugs(record.relatedDevlogSlugs)
      };
    });
  }

  function projectRoadmapDevlogs(roadmapRecords, newsRecords) {
    var roadmap = projectRoadmap(roadmapRecords);
    var published = new Map(projectPublishedNews(newsRecords).map(function (item) { return [item.slug, item]; }));
    var seen = new Set();
    return roadmap.reduce(function (related, item) {
      item.relatedDevlogSlugs.forEach(function (slug) {
        var article = published.get(slug);
        if (!article || seen.has(slug)) return;
        seen.add(slug);
        related.push({ roadmapTitle: item.title, article: article });
      });
      return related;
    }, []);
  }

  function baseRoot(document) {
    var brand = document.querySelector('.site-brand');
    if (!brand) return '';
    var path = new URL(brand.href, document.location.href).pathname;
    return path === '/' ? '' : path.replace(/\/+$/, '');
  }

  function element(document, tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function renderNews(document, records, options) {
    var root = document.querySelector('[data-editorial-news]');
    if (!root) return;
    var filters = root.querySelector('[data-news-filters]');
    var query = root.querySelector('[data-news-query]');
    var list = root.querySelector('[data-news-list]');
    var featuredList = root.querySelector('[data-news-featured-list]');
    var featuredEmpty = root.querySelector('[data-news-featured-empty]');
    var status = root.querySelector('[data-news-status]');
    if (!filters || !query || !list || !featuredList || !featuredEmpty || !status) return;
    var base = baseRoot(document);
    var published = projectPublishedNews(records);
    var featured = published.filter(function (record) { return record.featured; });
    featuredList.replaceChildren();
    featured.forEach(function (record) {
      featuredList.appendChild(newsCard(document, record, base, true));
    });
    featuredEmpty.hidden = featured.length > 0;
    var selected = options && options.category || 'all';
    var taxonomy = [{ id: 'all', label: 'All updates' }].concat(NEWS_TAXONOMY);
    if (!taxonomy.some(function (item) { return item.id === selected; })) selected = 'all';
    var empty = root.querySelector('[data-news-empty]');
    if (empty && !empty.__toadalUnpublishedCopy) {
      empty.__toadalUnpublishedCopy = empty.textContent.trim() || 'No public news updates have been published yet.';
    }
    var controls = Array.from(filters.querySelectorAll('[data-news-category]'));
    // Native category objects retain their authored labels and order. Legacy pages get a fallback.
    if (!controls.length) {
      filters.replaceChildren();
      taxonomy.forEach(function (item) {
        var button = element(document, 'button', 'button-link button-link--secondary', item.label);
        button.type = 'button';
        button.setAttribute('data-news-category', item.id);
        filters.appendChild(button);
        controls.push(button);
      });
    }
    controls.forEach(function (button) {
      if (button.__toadalNewsCategoryHandler) button.removeEventListener('click', button.__toadalNewsCategoryHandler);
      button.__toadalNewsCategoryHandler = function () {
        var category = button.getAttribute('data-news-category');
        if (!taxonomy.some(function (item) { return item.id === category; })) return;
        selected = category;
        renderList();
      };
      button.addEventListener('click', button.__toadalNewsCategoryHandler);
    });
    function renderList() {
      var results = filterNews(records, { category: selected, query: query.value });
      list.replaceChildren();
      results.forEach(function (record) {
        list.appendChild(newsCard(document, record, base, false));
      });
      var emptyCopy = published.length && (query.value.trim() || selected !== 'all') ?
        'No published updates match these filters. Clear the search or choose All updates.' :
        (empty && empty.__toadalUnpublishedCopy || 'No public news updates have been published yet.');
      if (empty) {
        empty.textContent = emptyCopy;
        empty.hidden = results.length > 0;
      }
      // Exactly one status is visible and announced: either the empty state or the result count.
      status.hidden = !!empty && results.length === 0;
      status.textContent = results.length ? results.length + ' published update' + (results.length === 1 ? '' : 's') + ' shown.' : emptyCopy;
      controls.forEach(function (button) {
        button.setAttribute('aria-pressed', button.getAttribute('data-news-category') === selected ? 'true' : 'false');
      });
    }
    if (query.__toadalNewsQueryHandler) query.removeEventListener('input', query.__toadalNewsQueryHandler);
    query.__toadalNewsQueryHandler = renderList;
    query.addEventListener('input', renderList);
    renderList();
  }

  function newsCard(document, record, base, isFeatured) {
    var card = element(document, 'article', 'detail-fact news-card');
    var category = NEWS_TAXONOMY.find(function (item) { return item.id === record.category; });
    card.appendChild(element(document, 'p', 'section-kicker', (isFeatured ? 'Featured · ' : '') + (category ? category.label : 'Update') + ' · ' + record.publishedAt));
    var heading = element(document, 'h2');
    var link = element(document, 'a', '', record.title);
    link.href = base + '/news/devlog/?article=' + encodeURIComponent(record.slug);
    heading.appendChild(link);
    card.append(heading, element(document, 'p', '', record.summary));
    return card;
  }

  function renderArticle(document, records) {
    var root = document.querySelector('[data-editorial-article]');
    if (!root) return;
    var items = projectPublishedNews(records);
    var slug = new URL(document.location.href).searchParams.get('article') || '';
    var record = items.find(function (item) { return item.slug === slug; });
    var content = root.querySelector('[data-article-content]');
    var title = root.querySelector('[data-article-title]');
    var date = root.querySelector('[data-article-date]');
    var state = root.querySelector('[data-article-state]');
    var quoteFigure = root.querySelector('[data-article-quote]');
    var quoteText = root.querySelector('[data-article-quote-text]');
    var quoteAttribution = root.querySelector('[data-article-quote-attribution]');
    var relatedSection = root.querySelector('[data-article-related]');
    var relatedList = root.querySelector('[data-article-related-list]');
    var relatedEmpty = root.querySelector('[data-article-related-empty]');
    if (!content || !title || !date || !state || !quoteFigure || !quoteText || !quoteAttribution || !relatedSection || !relatedList || !relatedEmpty) return;
    content.replaceChildren();
    quoteFigure.hidden = true;
    quoteText.textContent = '';
    quoteAttribution.textContent = '';
    quoteAttribution.hidden = true;
    relatedList.replaceChildren();
    if (!record) {
      title.textContent = 'News & devlog';
      date.textContent = '';
      state.textContent = 'AWAITING PUBLICATION';
      content.appendChild(element(document, 'p', '', 'There are no published articles available here yet. Drafts stay private until an approved article is published.'));
      relatedEmpty.hidden = false;
      return;
    }
    title.textContent = record.title;
    date.textContent = record.publishedAt;
    state.textContent = 'PUBLISHED';
    record.body.forEach(function (paragraph) { content.appendChild(element(document, 'p', '', paragraph)); });
    if (!record.body.length) content.appendChild(element(document, 'p', '', record.summary));
    if (record.image) {
      var figure = element(document, 'figure');
      var image = element(document, 'img');
      image.src = baseRoot(document) + record.image;
      image.alt = record.imageAlt;
      image.loading = 'lazy';
      figure.appendChild(image);
      content.appendChild(figure);
    }
    if (record.pullQuote) {
      quoteText.textContent = record.pullQuote.text;
      quoteAttribution.textContent = record.pullQuote.attribution;
      quoteAttribution.hidden = !record.pullQuote.attribution;
      quoteFigure.hidden = false;
    }
    var related = projectRelatedNews(record, records);
    related.forEach(function (item) {
      var link = element(document, 'a', 'button-link button-link--secondary', item.title);
      link.href = '?article=' + encodeURIComponent(item.slug);
      relatedList.appendChild(link);
    });
    relatedEmpty.hidden = related.length > 0;
    var index = items.indexOf(record);
    var navigation = root.querySelector('[data-article-neighbors]');
    if (navigation) {
      navigation.replaceChildren();
      [items[index + 1], items[index - 1]].forEach(function (neighbor, position) {
        if (!neighbor) return;
        var link = element(document, 'a', 'button-link button-link--secondary', (position === 0 ? 'Previous: ' : 'Next: ') + neighbor.title);
        link.href = '?article=' + encodeURIComponent(neighbor.slug);
        navigation.appendChild(link);
      });
    }
  }

  function renderRoadmap(document, records, newsRecords) {
    var root = document.querySelector('[data-editorial-roadmap]');
    if (!root) return;
    var items = projectRoadmap(records);
    ROADMAP_STATUSES.forEach(function (status) {
      var column = root.querySelector('[data-roadmap-status="' + status.id + '"]');
      if (!column) return;
      var list = column.querySelector('[data-roadmap-items]');
      if (!list) return;
      list.replaceChildren();
      var matching = items.filter(function (item) { return item.status === status.id; });
      matching.forEach(function (item) {
        var card = element(document, 'article', 'detail-fact');
        var heading = element(document, 'h3', '', item.title);
        var badgeText = item.publicStatus === 'PREVIEW' ? 'PREVIEW — available on this review website' :
          item.publicStatus === 'COMING_SOON' ? 'COMING SOON' : 'PLANNED — timing not announced';
        var badge = element(document, 'p', 'roadmap-status', badgeText);
        var summary = element(document, 'p', '', item.summary);
        var link = element(document, 'a', 'text-link', 'Explore ' + item.title);
        link.href = baseRoot(document) + item.route;
        card.append(heading, badge, summary, link);
        list.appendChild(card);
      });
      var empty = column.querySelector('[data-roadmap-empty]');
      if (empty) {
        empty.hidden = matching.length > 0;
        if (!matching.length && status.id === 'in-development') empty.textContent = 'Nothing is publicly classified here yet.';
      }
    });
    var relatedSection = root.querySelector('[data-roadmap-related-devlogs]');
    var relatedList = root.querySelector('[data-roadmap-devlog-list]');
    var relatedEmpty = root.querySelector('[data-roadmap-devlog-empty]');
    if (relatedSection && relatedList && relatedEmpty) {
      var related = projectRoadmapDevlogs(records, newsRecords);
      relatedList.replaceChildren();
      related.forEach(function (item) {
        var card = element(document, 'article', 'detail-fact');
        card.appendChild(element(document, 'p', 'section-kicker', 'Related to ' + item.roadmapTitle));
        var link = element(document, 'a', '', item.article.title);
        link.href = baseRoot(document) + '/news/devlog/?article=' + encodeURIComponent(item.article.slug);
        card.appendChild(link);
        relatedList.appendChild(card);
      });
      relatedEmpty.hidden = related.length > 0;
    }
  }

  function renderMediaFilters(document) {
    var page = document.querySelector('.discovery-media');
    if (!page) return;
    var controls = page.querySelector('[data-media-filters]');
    if (controls && controls.__toadalMediaFiltersBound) return;
    var gameplay = document.getElementById('gameplay');
    var world = document.getElementById('world-art');
    var characters = document.getElementById('character-art');
    var videoHeading = document.getElementById('media-video-title');
    var video = videoHeading && videoHeading.closest('section');
    var groups = [
      { id: 'all', label: 'All media', section: null },
      { id: 'video', label: 'Video', section: video },
      { id: 'gameplay', label: 'Gameplay', section: gameplay },
      { id: 'world-art', label: 'World art', section: world },
      { id: 'character-art', label: 'Character art', section: characters }
    ].filter(function (item) { return item.id === 'all' || !!item.section; });
    var needsInsertion = !controls;
    if (!controls) {
      controls = element(document, 'nav', 'media-filter-controls');
      controls.setAttribute('data-media-filters', '');
      controls.setAttribute('aria-label', 'Filter media previews');
    }
    controls.__toadalMediaFiltersBound = true;
    groups.forEach(function (group) {
      var button = controls.querySelector('[data-media-filter="' + group.id + '"]');
      if (!button) {
        button = element(document, 'button', 'button-link button-link--secondary', group.label);
        button.type = 'button';
        button.setAttribute('data-media-filter', group.id);
        controls.appendChild(button);
      }
      button.setAttribute('aria-pressed', group.id === 'all' ? 'true' : 'false');
      button.addEventListener('click', function () {
        groups.slice(1).forEach(function (candidate) {
          candidate.section.hidden = group.id !== 'all' && candidate.id !== group.id;
        });
        controls.querySelectorAll('[data-media-filter]').forEach(function (control) {
          control.setAttribute('aria-pressed', control === button ? 'true' : 'false');
        });
      });
    });
    if (needsInsertion) {
      var heading = page.querySelector('.wo002-detail-hero');
      if (heading) heading.insertAdjacentElement('afterend', controls);
    }
  }

  function start(document, root) {
    var brand = document.querySelector('.site-brand');
    var source = (brand ? baseRoot(document) : '') + '/assets/data/manifest-public-content.json';
    var fetcher = root && typeof root.fetch === 'function' ? root.fetch.bind(root) : null;
    function render(data) {
      var news = data && Array.isArray(data.news) ? data.news : NEWS_RECORDS;
      var roadmap = data && Array.isArray(data.roadmap) ? data.roadmap : ROADMAP_RECORDS;
      if (document.querySelector('[data-editorial-news]')) renderNews(document, news);
      if (document.querySelector('[data-editorial-article]')) renderArticle(document, news);
      if (document.querySelector('[data-editorial-roadmap]')) renderRoadmap(document, roadmap, news);
      renderMediaFilters(document);
    }
    if (!fetcher) { render(null); return; }
    fetcher(source, { credentials: 'same-origin' }).then(function (response) {
      if (!response.ok) throw new Error('Public content registry projection unavailable.');
      return response.json();
    }).then(render).catch(function () { render(null); });
  }

  return {
    NEWS_RECORDS: NEWS_RECORDS,
    NEWS_TAXONOMY: NEWS_TAXONOMY,
    ROADMAP_RECORDS: ROADMAP_RECORDS,
    ROADMAP_STATUSES: ROADMAP_STATUSES,
    filterNews: filterNews,
    projectPublishedNews: projectPublishedNews,
    projectRelatedNews: projectRelatedNews,
    projectRoadmap: projectRoadmap,
    projectRoadmapDevlogs: projectRoadmapDevlogs,
    renderArticle: renderArticle,
    renderMediaFilters: renderMediaFilters,
    renderNews: renderNews,
    renderRoadmap: renderRoadmap,
    start: start
  };
});
