import json
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
BASE = 'http://127.0.0.1:4173/toadal-feast-web/'
CHROME = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
EVIDENCE = ROOT / 'docs/review/STORIES_PUBLISHING_STACK_2026-10-01/evidence'
FIXTURE = {
    'schemaVersion': 1,
    'series': [{
        'id': 'fixture-series', 'slug': 'fixture-series', 'title': 'Browser QA Fixture',
        'publicationState': 'PUBLISHED', 'readingDirection': 'ltr',
        'chapterIds': ['fixture-chapter'], 'summary': 'Test-only browser fixture.',
    }],
    'arcs': [],
    'chapters': [{
        'id': 'fixture-chapter', 'slug': 'fixture-chapter', 'seriesId': 'fixture-series',
        'title': 'Fixture Chapter', 'publicationState': 'PUBLISHED', 'pageIds': ['page-one', 'page-two'],
    }],
    'pages': [
        {'id': 'page-one', 'chapterId': 'fixture-chapter', 'assetId': 'asset-one', 'order': 1,
         'publicationState': 'PUBLISHED', 'alt': 'Test-only first page'},
        {'id': 'page-two', 'chapterId': 'fixture-chapter', 'assetId': 'asset-two', 'order': 2,
         'publicationState': 'PUBLISHED', 'alt': 'Test-only second page'},
    ],
    'assets': {
        'asset-one': '/assets/images/world/candyland-calm.webp',
        'asset-two': '/assets/images/world/candy-kingdom.webp',
    },
}


def page_watch(page):
    failures = {'console': [], 'page': [], 'http': []}
    requests = []
    page.on('console', lambda message: failures['console'].append(message.text) if message.type == 'error' else None)
    page.on('pageerror', lambda error: failures['page'].append(str(error)))
    page.on('request', lambda request: requests.append(request.url))
    page.on('response', lambda response: failures['http'].append((response.status, response.url)) if response.status >= 400 else None)
    return failures, requests


def assert_clean(failures, label):
    assert not failures['console'], label + ' console errors: ' + repr(failures['console'])
    assert not failures['page'], label + ' page errors: ' + repr(failures['page'])
    assert not failures['http'], label + ' HTTP errors: ' + repr(failures['http'])


def main():
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    checks = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        for width, height, device in [(1366, 900, 'desktop'), (390, 844, 'mobile'), (320, 800, 'narrow-mobile')]:
            for route, slug in [('stories/', 'stories'), ('manga/', 'manga'), ('reader/', 'reader')]:
                context = browser.new_context(viewport={'width': width, 'height': height}, reduced_motion='reduce')
                page = context.new_page()
                failures, requests = page_watch(page)
                response = page.goto(BASE + route, wait_until='networkidle')
                assert response and response.status == 200, route + ' did not return 200'
                page.locator('h1').first.wait_for(state='visible')
                page.wait_for_function('window.TFStoriesPublishing !== undefined')
                page.wait_for_function("document.querySelector('[data-companion-image]') && document.querySelector('[data-companion-image]').src.endsWith('/assets/images/characters/companion/runtime-v1/stories-media-thinking.webp')")
                page.wait_for_timeout(100)
                metrics = page.evaluate('''() => ({
                    width: window.innerWidth,
                    scrollWidth: document.documentElement.scrollWidth,
                    h1: document.querySelector('h1') && document.querySelector('h1').textContent.trim(),
                    storyRuntime: !!window.TFStoriesPublishing,
                    dataPath: document.querySelector('[data-story-index]') && document.querySelector('[data-story-index]').getAttribute('data-story-index'),
                    storageKeys: Object.keys(localStorage),
                    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches
                })''')
                assert metrics['scrollWidth'] <= metrics['width'], route + ' horizontal overflow at ' + str(width)
                assert metrics['storyRuntime'] and metrics['reducedMotion'], route + ' runtime/media query missing'
                assert any(url.startswith(BASE) and url.endswith('/assets/js/stories-publishing.js') for url in requests), route + ' story runtime request did not use the Pages base path'
                assert any(url.startswith(BASE) and url.endswith('/assets/data/story-content.json') for url in requests), route + ' story registry request did not use the Pages base path'
                if route == 'stories/':
                    body = page.locator('body').inner_text()
                    assert 'no published stories' in body.lower(), 'Stories page must expose its truthful empty state'
                    assert page.locator('a[href="/toadal-feast-web/characters/"]').count() > 0, 'Stories page must retain its safe Characters link'
                    assert page.locator('a[href="/toadal-feast-web/world/"]').count() > 0, 'Stories page must retain its safe World link'
                elif route == 'manga/':
                    assert 'PREVIEW · NOT PUBLISHED' in page.locator('body').inner_text(), 'Manga shell must be visibly unpublished'
                    assert page.locator('[data-story-continue]').is_disabled(), 'Continue Reading must be disabled without a public chapter'
                else:
                    assert 'No published chapter is available' in page.locator('[data-reader-state]').inner_text()
                    for selector in ['[data-reader-save]', '[data-reader-previous]', '[data-reader-next]', '[data-reader-previous-chapter]', '[data-reader-next-chapter]']:
                        assert page.locator(selector).is_disabled(), selector + ' must be disabled in the empty reader'
                    companion = page.locator('[data-companion]')
                    assert companion.get_attribute('data-minimized') == 'true', 'reader companion must default to minimized'
                    assert companion.get_attribute('data-panel-visible') == 'false', 'reader companion must not cover the empty reader by default'
                    if device != 'narrow-mobile':
                        page.screenshot(path=str(EVIDENCE / (slug + '-' + device + '-empty.png')), full_page=True)
                    full = page.locator('[data-reader-fullscreen]')
                    assert full.get_attribute('aria-label') == 'Enter reader fullscreen'
                    full.click()
                    page.wait_for_function('document.fullscreenElement !== null', timeout=5000)
                    assert full.get_attribute('aria-label') == 'Exit reader fullscreen', 'fullscreen accessible name must follow state'
                    page.evaluate('document.exitFullscreen()')
                    page.wait_for_function("document.querySelector('[data-reader-fullscreen]').getAttribute('aria-label') === 'Enter reader fullscreen'")
                if route != 'reader/' and device != 'narrow-mobile':
                    page.screenshot(path=str(EVIDENCE / (slug + '-' + device + '-empty.png')), full_page=True)
                assert_clean(failures, route + ' at ' + str(width))
                checks.append({'route': '/' + route, 'viewport': [width, height], 'status': response.status, 'overflow': False, 'runtimeAndRegistryBasePath': True})
                context.close()

        context = browser.new_context(viewport={'width': 1366, 'height': 900})
        page = context.new_page()
        failures, requests = page_watch(page)
        page.add_init_script("""(() => {
            localStorage.setItem('toadal:web:v1:quests', 'fixture-quests');
            localStorage.setItem('toadal:web:v1:feast-pass', 'fixture-pass');
            localStorage.setItem('toadal:web:v1:profile', 'fixture-profile');
        })()""")
        page.route('**/assets/data/story-content.json', lambda route: route.fulfill(status=200, content_type='application/json', body=json.dumps(FIXTURE)))
        response = page.goto(BASE + 'manga/?series=fixture-series', wait_until='networkidle')
        assert response and response.status == 200
        page.get_by_role('heading', name='Browser QA Fixture').wait_for()
        assert page.locator('[data-story-chapter-list] a').count() == 1
        assert not page.locator('[data-story-continue]').is_disabled()

        page.goto(BASE + 'reader/?series=fixture-series&chapter=fixture-chapter', wait_until='networkidle')
        page.locator('[data-reader-page]').wait_for(state='visible')
        assert page.locator('[data-reader-page-number]').inner_text() == '1'
        assert page.locator('[data-reader-page-total]').inner_text() == '2'
        page.locator('[data-reader-viewer]').focus()
        page.keyboard.press('ArrowRight')
        assert page.locator('[data-reader-page-number]').inner_text() == '2', 'keyboard next-page action did not update the real reader'
        assert page.locator('[data-reader-page]').get_attribute('alt') == 'Test-only second page'
        page.keyboard.press('ArrowLeft')
        assert page.locator('[data-reader-page-number]').inner_text() == '1', 'keyboard previous-page action did not update the real reader'
        page.locator('[data-reader-next]').click()
        assert page.locator('[data-reader-page-number]').inner_text() == '2', 'next-page control did not update the real reader'
        page.locator('[data-reader-save]').click()
        saved = page.evaluate('''() => ({
            bookmark: JSON.parse(localStorage.getItem('toadal:web:v1:reader-progress')),
            guest: {
              quests: localStorage.getItem('toadal:web:v1:quests'),
              pass: localStorage.getItem('toadal:web:v1:feast-pass'),
              profile: localStorage.getItem('toadal:web:v1:profile')
            }
        })''')
        assert saved['bookmark']['entries']['fixture-chapter']['pageId'] == 'page-two'
        assert saved['guest'] == {'quests': 'fixture-quests', 'pass': 'fixture-pass', 'profile': 'fixture-profile'}
        assert_clean(failures, 'fixture reader')
        checks.append({'route': '/reader/?series=fixture-series&chapter=fixture-chapter', 'keyboardPages': '1→2→1', 'save': 'stable IDs persisted', 'fixturePublicOutput': False})
        context.close()

        context = browser.new_context(viewport={'width': 1366, 'height': 900})
        page = context.new_page()
        failures, requests = page_watch(page)
        response = page.goto(BASE, wait_until='networkidle')
        assert response and response.status == 200
        assert not any(url.endswith('/assets/js/stories-publishing.js') for url in requests), 'Stories runtime must stay off non-story routes'
        assert not page.evaluate('!!window.TFStoriesPublishing'), 'Stories runtime must stay off Home'
        assert_clean(failures, 'Home isolation')
        checks.append({'route': '/', 'storyRuntimeLoaded': False})
        context.close()
        browser.close()

    print(json.dumps({'result': 'PASS', 'checks': checks, 'screenshots': sorted(str(path.relative_to(ROOT)) for path in EVIDENCE.glob('*-empty.png'))}, indent=2))


if __name__ == '__main__':
    main()
