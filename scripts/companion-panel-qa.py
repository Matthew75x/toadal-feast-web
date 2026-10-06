#!/usr/bin/env python3
"""Bounded real-browser checks for docked companion panel safety and phone navigation."""
from __future__ import annotations
import argparse
import importlib.util
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('companion_server', ROOT / 'scripts/v1-companion-controls-qa.py')
helper = importlib.util.module_from_spec(spec)
spec.loader.exec_module(helper)

STATE = '''() => {
 const root=document.querySelector('[data-companion]'),panel=root.querySelector('[data-companion-panel]'),toggle=root.querySelector('[data-companion-toggle]');
 const rect=node=>{const r=node.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
 const visible=node=>{const r=node.getBoundingClientRect(),s=getComputedStyle(node);return !node.closest('[hidden]')&&s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight;};
 const overlap=(selector,box)=>[...document.querySelectorAll(selector)].filter(node=>!root.contains(node)&&visible(node)).map(node=>{const r=node.getBoundingClientRect();return {tag:node.tagName,text:node.textContent.trim().slice(0,70),area:Math.max(0,Math.min(box.right,r.right)-Math.max(box.left,r.left))*Math.max(0,Math.min(box.bottom,r.bottom)-Math.max(box.top,r.top))};}).filter(item=>item.area>0);
 const p=rect(panel),r=rect(root),shown=!panel.hidden&&getComputedStyle(panel).visibility!=='hidden';
 return {panelShown:shown,panel:p,character:r,docked:root.getAttribute('data-mobile-docked'),minimized:root.getAttribute('data-minimized'),suppressed:root.getAttribute('data-bubble-suppressed'),panelAriaHidden:panel.getAttribute('aria-hidden'),expanded:toggle.getAttribute('aria-expanded'),heroOverlap:shown?overlap('main h1,main .wo002-detail-copy',p):[],panelControlOverlap:shown?overlap('a[href],button,input,select,textarea,summary',p):[],headerOverlap:overlap('.site-header a[href],.site-header button',r),menuExpanded:document.querySelector('.nav-toggle').getAttribute('aria-expanded'),menuFocused:document.activeElement===document.querySelector('.nav-toggle'),preferences:{hidden:localStorage.getItem('toadal:site:companion:hidden:v1'),minimized:localStorage.getItem('toadal:site:companion:minimized:v1'),position:JSON.parse(localStorage.getItem('toadal:site:companion:position:v1')||'{}')}};
}'''


def settled(page):
    page.evaluate('() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))')


def ready(page, base, route):
    page.goto(base + route + '/', wait_until='networkidle', timeout=10000)
    page.wait_for_selector('[data-companion][data-position-ready="true"]')


def hero_case(page, base, route, result):
    ready(page, base, route)
    initial=page.evaluate(STATE)
    query='[data-support-search]' if route=='support' else '[data-news-query]'
    page.locator(query).focus()
    page.evaluate('scrollTo(0,0)')
    settled(page)
    tip=page.evaluate(STATE)
    assert tip['panelShown'] and tip['docked']=='true'
    assert not tip['heroOverlap'], 'Automatic tip must leave the hero copy readable'
    assert not tip['panelControlOverlap'] and not tip['headerOverlap']
    assert tip['preferences']['position']==initial['preferences']['position'], 'Panel avoidance must not move or persist a different character position'
    page.locator('[data-companion-toggle]').press('Enter')
    page.locator('.nav-toggle').press('Enter')
    settled(page)
    opened=page.evaluate(STATE)
    assert opened['menuExpanded']=='true' and not opened['headerOverlap']
    assert not opened['panelControlOverlap'] and not opened['heroOverlap']
    page.keyboard.press('Tab')
    assert page.evaluate("document.activeElement.closest('.site-links') !== null"), 'Keyboard Tab must reach the open menu links'
    page.keyboard.press('Escape')
    settled(page)
    closed=page.evaluate(STATE)
    assert closed['menuExpanded']=='false' and closed['menuFocused']
    assert closed['docked']=='true' and not closed['headerOverlap'] and not closed['panelControlOverlap']
    result.update(initial=initial,focusedAtTop=tip,menuOpen=opened,menuClosed=closed)


def faq_case(page, base, _route, result):
    ready(page, base, 'support')
    page.locator('[data-support-search]').focus()
    summary=page.locator('[data-support-article] > summary').first
    summary.evaluate('(el)=>scrollTo(0,scrollY+el.getBoundingClientRect().top-114)')
    page.wait_for_function("document.querySelector('[data-companion]').getAttribute('data-bubble-suppressed') === 'true'")
    blocked=page.evaluate(STATE)
    assert not blocked['panelShown'] and blocked['panelAriaHidden']=='true' and blocked['expanded']=='false'
    assert blocked['minimized']=='true' and blocked['docked']=='true'
    assert not page.locator('[data-companion]').evaluate('(el)=>el.hidden')
    assert blocked['preferences']['hidden'] is None and blocked['preferences']['minimized'] is None
    summary.tap()
    assert summary.evaluate('(el)=>el.parentElement.open'), 'The formerly covered FAQ must receive a real touch tap'
    summary.press('Enter')
    assert summary.evaluate('(el)=>!el.parentElement.open'), 'Native FAQ keyboard activation must remain usable'
    page.evaluate('scrollTo(0,0)')
    page.wait_for_function("document.querySelector('[data-companion]').getAttribute('data-bubble-suppressed') === 'false'")
    restored=page.evaluate(STATE)
    assert restored['panelShown'] and restored['panelAriaHidden'] is None and restored['expanded']=='true'
    assert restored['preferences']==blocked['preferences'], 'Suppression and restore must not change hide, minimize, or placement preferences'
    assert not restored['heroOverlap'] and not restored['panelControlOverlap']
    summary.evaluate('(el)=>scrollTo(0,scrollY+el.getBoundingClientRect().top-114)')
    page.wait_for_function("document.querySelector('[data-companion]').getAttribute('data-bubble-suppressed') === 'true'")
    page.locator('[data-companion-toggle]').tap()
    settled(page)
    explicit=page.evaluate(STATE)
    assert explicit['minimized']=='false' and explicit['panelShown'] and explicit['suppressed']=='false', 'An explicit expansion must keep its existing behavior'
    page.locator('[data-companion-toggle]').press('ArrowDown')
    settled(page)
    manual=page.evaluate(STATE)
    assert manual['preferences']['position']['manual'] is True and manual['docked'] is None
    assert manual['suppressed']=='false', 'A deliberate position must not receive automatic-tip suppression'
    page.reload(wait_until='networkidle',timeout=10000)
    page.wait_for_selector('[data-companion][data-position-ready="true"]')
    reloaded=page.evaluate(STATE)
    assert reloaded['preferences']['position']['manual'] is True and reloaded['docked'] is None
    assert reloaded['preferences']['minimized']=='false' and reloaded['panelShown']
    result.update(suppressed=blocked,restored=restored,explicit=explicit,manual=manual,reloaded=reloaded)


def run():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--dist',type=Path,default=ROOT/'dist')
    parser.add_argument('--base-url')
    parser.add_argument('--source-runtime',action='store_true',help='Serve the owned source runtime in place of the export for pre-export verification.')
    parser.add_argument('--report-dir',type=Path,default=ROOT/'docs/review/obvious-fixes-20261005/companion-panel')
    args=parser.parse_args()
    args.report_dir.mkdir(parents=True,exist_ok=True)
    server=None
    if args.base_url:base=args.base_url.rstrip('/')+'/'
    else:server,base=helper.start_dist_server(args.dist)
    source=(ROOT/'studio-project/toadal-feast-website/reference/assets/js/companion-position.js').read_text(encoding='utf-8')
    cases=[]
    try:
        with sync_playwright() as playwright:
            browser=playwright.chromium.launch(executable_path=os.environ.get('CHROME_PATH',r'C:\Program Files\Google\Chrome\Application\chrome.exe'),headless=True,timeout=10000)
            for width in [320,390]:
                for name,route,action in [('support-hero-navigation','support',hero_case),('news-hero-navigation','news',hero_case),('faq-transient-tip','support',faq_case)]:
                    context=browser.new_context(viewport={'width':width,'height':844},is_mobile=True,has_touch=True)
                    page=context.new_page();page.set_default_timeout(6000)
                    if args.source_runtime:page.route('**/assets/js/companion-position.js',lambda route:route.fulfill(status=200,content_type='application/javascript',body=source))
                    result={'name':name+'-'+str(width),'width':width}
                    try:
                        action(page,base,route,result)
                        result['status']='PASS'
                    except Exception as error:result.update(status='FAIL',error=str(error))
                    page.screenshot(path=str(args.report_dir/(result['name']+'.png')))
                    cases.append(result);context.close()
            browser.close()
    finally:
        if server:server.shutdown();server.server_close()
    report={'schema':'toadal-feast.companion-panel-qa.v1','sourceRuntime':args.source_runtime,'baseUrl':base,'cases':cases,'summary':{'passed':sum(c['status']=='PASS' for c in cases),'cases':len(cases),'status':'PASS' if all(c['status']=='PASS' for c in cases) else 'FAIL'}}
    (args.report_dir/'report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(report['summary']))
    for case in cases:
        if case['status']=='FAIL':print(case['name']+': '+case['error'])
    return 0 if report['summary']['status']=='PASS' else 1

if __name__=='__main__':raise SystemExit(run())
