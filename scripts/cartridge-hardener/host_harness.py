#!/usr/bin/env python3
from __future__ import annotations
import argparse, json, re, sys
from pathlib import Path
from playwright.sync_api import sync_playwright, Error as PlaywrightError

def main():
    ap=argparse.ArgumentParser(description='Virtual-origin TOADAL cartridge host lifecycle harness')
    ap.add_argument('--cartridge',required=True);ap.add_argument('--profile',required=True);ap.add_argument('--output',required=True)
    a=ap.parse_args();root=Path(a.cartridge).resolve();profile=json.loads(Path(a.profile).read_text());game=profile['game'];html=(root/'index.html').read_text()
    origin='https://toadal-harness.test';game_url=f'{origin}/public/games/{game["id"]}/index.html?debug=1';host_url=origin+'/player/'
    events=[];errors=[];checks=[]
    def check(name,fn):
        try:v=fn();assert v is not False;checks.append({'name':name,'passed':True,'detail':v});print('PASS',name,flush=True)
        except Exception as e:checks.append({'name':name,'passed':False,'error':str(e)});print('FAIL',name,e,flush=True)
    host='''<!doctype html><meta charset=utf-8><title>TOADAL host harness</title><iframe id=g sandbox="allow-scripts" allow="autoplay; fullscreen" src="GAME_URL"></iframe><script>const f=document.getElementById('g');window.events=[];window.addEventListener('message',e=>{const m=e.data;if(!m||m.protocol!=='toadal.game.v1'||m.gameId!=='GAME_ID')return;events.push(m);if(m.type==='game:ready')f.contentWindow.postMessage({protocol:'toadal.game.v1',gameId:'GAME_ID',type:'host:resume',payload:{}},'*');});f.addEventListener('load',()=>f.contentWindow.postMessage({protocol:'toadal.game.v1',gameId:'GAME_ID',type:'host:init',payload:{capabilities:{modeResults:true}}},'*'));window.send=(type,payload={})=>f.contentWindow.postMessage({protocol:'toadal.game.v1',gameId:'GAME_ID',type,payload},'*');</script>'''.replace('GAME_URL',game_url).replace("'GAME_ID'",json.dumps(game['id']))
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
        page=browser.new_page(viewport={'width':1366,'height':900});page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
        def route(route):
            u=route.request.url
            if u.startswith(game_url.split('?')[0]):route.fulfill(status=200,content_type='text/html',body=html)
            elif u.startswith(host_url):route.fulfill(status=200,content_type='text/html',body=host)
            else:route.abort()
        page.route('**/*',route)
        try:
            page.goto(host_url,wait_until='load')
        except PlaywrightError as e:
            if 'ERR_BLOCKED_BY_ADMINISTRATOR' in str(e):
                out={'method':'Virtual HTTPS origin routed entirely from local bytes.','status':'BLOCKED_ENVIRONMENT','reason':'Chromium policy blocked synthetic URL navigation; no policy bypass attempted.','checks':checks,'passed':0,'failed':0,'errors':[str(e)],'events':[]}
                Path(a.output).write_text(json.dumps(out,indent=2)+'\n');browser.close();print('BLOCKED host harness: browser policy',flush=True);return 2
            raise
        page.wait_for_function("events.some(e=>e.type==='game:ready')",timeout=15000)
        check('Handshake emits game:ready',lambda:page.evaluate("events.some(e=>e.type==='game:ready')"))
        check('No initial browser errors',lambda:not errors)
        outer=page.frame(url=re.compile(r'/public/games/'+re.escape(game['id'])+r'/index\.html'))
        if outer is None: raise RuntimeError('Cartridge iframe not found')
        frame=outer
        selectors=profile.get('hostHarness',{}).get('modeStartSelectors',[])
        for item in selectors:
            label=item['name'];selector=item['selector'];frame.locator(selector).click();page.wait_for_function("events.some(e=>e.type==='game:started'&&e.payload&&e.payload.modeId===arguments[0])",arg=item.get('modeId'),timeout=18000)
            check(label+' starts',lambda mid=item.get('modeId'):page.evaluate("mid=>events.some(e=>e.type==='game:started'&&e.payload&&e.payload.modeId===mid)",mid))
            page.evaluate("send('host:pause')");page.wait_for_timeout(120);check(label+' host pause acknowledged',lambda:page.evaluate("events.some(e=>e.type==='game:paused')"))
            page.evaluate("send('host:resume')");page.wait_for_timeout(120);check(label+' host resume acknowledged',lambda:page.evaluate("events.some(e=>e.type==='game:resumed')"))
            outer.locator('#modes-button').click();page.wait_for_timeout(60)
            try:outer.locator('#confirm-leave').click();page.wait_for_timeout(900)
            except:pass
            frame=outer
        if profile.get('hostHarness',{}).get('fullscreenSelector'):
            frame.locator(profile['hostHarness']['fullscreenSelector']).first.click();page.wait_for_timeout(120);check('Fullscreen request emitted',lambda:page.evaluate("events.some(e=>e.type==='game:request-fullscreen')"))
        if profile.get('hostHarness',{}).get('exitSelector'):
            frame.locator(profile['hostHarness']['exitSelector']).click();page.wait_for_timeout(120);check('Exit request emitted',lambda:page.evaluate("events.some(e=>e.type==='game:request-exit')"));page.evaluate("send('host:exit-confirmed')")
        check('No browser/page errors',lambda:not errors)
        events=page.evaluate('events');browser.close()
    out={'method':'Virtual HTTPS origin routed entirely from local bytes. Outer iframe sandbox=allow-scripts. This is a host-contract harness, not the real website or a physical device.','checks':checks,'passed':sum(x['passed'] for x in checks),'failed':sum(not x['passed'] for x in checks),'errors':errors,'events':events[-80:]}
    Path(a.output).write_text(json.dumps(out,indent=2)+'\n');raise SystemExit(any(not x['passed'] for x in checks))
if __name__=='__main__':
    code=main()
    if isinstance(code,int): raise SystemExit(code)
