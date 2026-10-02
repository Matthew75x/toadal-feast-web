import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description='Bounded frozen/native visual and geometry comparison; no source mutation.')
parser.add_argument('--report-dir', default='docs/authoring/visual-comparison')
args = parser.parse_args()
out = ROOT / args.report_dir
out.mkdir(parents=True, exist_ok=True)
cases = []
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe')
    for route, slug in [('', 'home'), ('characters/', 'characters'), ('world/', 'world'), ('app/', 'app')]:
        for label, width, height in [('desktop', 1440, 900), ('tablet', 900, 900), ('mobile', 390, 844)]:
            pair = {}
            for version, port in [('frozen', 4333), ('native', 4332)]:
                context = browser.new_context(viewport={'width': width, 'height': height}, reduced_motion='reduce')
                page = context.new_page()
                errors = []
                page.on('pageerror', lambda error: errors.append(str(error)))
                response = page.goto('http://127.0.0.1:' + str(port) + '/toadal-feast-web/' + route, wait_until='networkidle')
                assert response.status == 200
                page.locator('h1').first.wait_for(state='visible')
                page.locator('img').evaluate_all("images => Promise.all(images.map(image => { image.loading = 'eager'; return image.decode().catch(() => {}); }))")
                metrics = page.evaluate('''() => ({
                    width: innerWidth, overflow: document.documentElement.scrollWidth > innerWidth,
                    broken: [...document.images].filter(i => i.offsetWidth && (!i.complete || !i.naturalWidth)).map(i => i.src),
                    heading: [...document.querySelectorAll('h1')].map(e => ({text: e.textContent.trim(),font: getComputedStyle(e).fontSize})),
                    homeSections: [...document.querySelectorAll('main > section')].map(e => ({id:e.id,height:Math.round(e.getBoundingClientRect().height*100)/100})),
                    gully: [...document.images].filter(e => /gully/i.test(e.alt)).map(e => ({alt:e.alt,src:new URL(e.src).pathname,fit:getComputedStyle(e).objectFit}))
                })''')
                assert not metrics['overflow'], version + route + label + ': overflow'
                assert not metrics['broken'], version + route + label + ': broken assets'
                assert not errors, version + route + label + ': page errors'
                filename = slug + '-' + label + '-' + version + '.jpg'
                page.screenshot(path=str(out / filename), full_page=True, type='jpeg', quality=75)
                pair[version] = {'metrics': metrics, 'screenshot': str((out / filename).relative_to(ROOT)), 'errors': errors}
                context.close()
            assert pair['frozen']['metrics']['heading'] == pair['native']['metrics']['heading'], 'Heading visual/copy regression: ' + route + label
            section_parity = pair['frozen']['metrics']['homeSections'] == pair['native']['metrics']['homeSections']
            cases.append({'route':'/' + route, 'viewport':[width,height], 'label':label, 'pair':pair, 'homeSectionGeometryEqual':section_parity})
    browser.close()
report = {'schema':'toadal-feast.owner-native-visual-comparison.v1','status':'PASS','cases':cases,'count':len(cases),'scope':'Read-only frozen and migrated routes, reduced motion; geometry recorded and screenshots require integrator inspection.'}
(out / 'visual-comparison.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'status':'PASS','cases':len(cases),'report':str(out / 'visual-comparison.json')}, indent=2))
