import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { externalizeAdvancedRuntime } from './lib/externalize-advanced-runtime.mjs';
import { rewriteCss } from './wo001-pages-basepath.mjs';

const sha=v=>crypto.createHash('sha256').update(v).digest('hex');
function fixture(t){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'toadal-adv-runtime-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const project=path.join(root,'project'),site=path.join(root,'site');
  fs.mkdirSync(path.join(project,'collections'),{recursive:true});
  fs.mkdirSync(path.join(site,'assets','css'),{recursive:true});
  fs.mkdirSync(path.join(site,'assets','js'),{recursive:true});
  const css=".x{background:url('/assets/images/x.webp')}\n";
  const js="(()=>{window.__ADV_TEST__=(window.__ADV_TEST__||0)+1;})();\n";
  fs.writeFileSync(path.join(project,'collections','advanced-code.json'),JSON.stringify({css,javascript:js},null,2));
  const html=(name='A')=>'<!doctype html><html><head><style data-toadal-advanced-code>'+css+'</style></head><body><h1>'+name+'</h1><script data-toadal-advanced-code>'+js+'</script></body></html>';
  fs.writeFileSync(path.join(site,'index.html'),html('Home'));
  fs.mkdirSync(path.join(site,'world'));fs.writeFileSync(path.join(site,'world','index.html'),html('World'));
  fs.mkdirSync(path.join(site,'public','games','fixture'),{recursive:true});
  fs.writeFileSync(path.join(site,'public','games','fixture','index.html'),'<script>game()</script>');
  return {root,project,site,css,js,html};
}
test('externalizes exact authored CSS/JS once and leaves protected game HTML alone',t=>{
  const f=fixture(t),result=externalizeAdvancedRuntime(f.site,f.project,'/toadal-feast-web/');
  assert.equal(result.pages,2);
  assert.equal(result.source.cssSha256,sha(f.css));
  assert.equal(result.source.javascriptSha256,sha(f.js));
  const normalizedCss=rewriteCss(f.css,'/toadal-feast-web/').value;
  assert.equal(fs.readFileSync(path.join(f.site,result.derived.css.path),'utf8'),normalizedCss);
  assert.equal(fs.readFileSync(path.join(f.site,result.derived.javascript.path),'utf8'),f.js);
  for(const name of ['index.html','world/index.html']){
    const html=fs.readFileSync(path.join(f.site,name),'utf8');
    assert.doesNotMatch(html,/<style\s+data-toadal-advanced-code>/);
    assert.doesNotMatch(html,/<script\s+data-toadal-advanced-code>/);
    assert.equal(html.includes(result.derived.css.url),true);
    assert.equal(html.includes(result.derived.javascript.url),true);
    assert.ok(html.indexOf('data-toadal-advanced-code href')<html.indexOf('<h1>'));
    assert.ok(html.indexOf('data-toadal-advanced-code src')>html.indexOf('<h1>'));
  }
  assert.equal(fs.readFileSync(path.join(f.site,'public/games/fixture/index.html'),'utf8'),'<script>game()</script>');
  assert.ok(result.duplicatedSourceBytesRemoved>0);
});
test('content hashes change when authored runtime changes',t=>{
  const f=fixture(t),a=externalizeAdvancedRuntime(f.site,f.project,'/toadal-feast-web/');
  const other=fixture(t);const p=path.join(other.project,'collections','advanced-code.json'),j=JSON.parse(fs.readFileSync(p));const before=j.javascript;j.javascript+='// next\n';fs.writeFileSync(p,JSON.stringify(j,null,2));
  for(const rel of ['index.html','world/index.html']){const file=path.join(other.site,rel);fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace(before,j.javascript));}
  const b=externalizeAdvancedRuntime(other.site,other.project,'/toadal-feast-web/');
  assert.notEqual(a.derived.javascript.path,b.derived.javascript.path);
  assert.equal(a.derived.css.path,b.derived.css.path);
});
test('mismatched page refuses before changing any HTML',t=>{
  const f=fixture(t),world=path.join(f.site,'world/index.html');
  const beforeHome=fs.readFileSync(path.join(f.site,'index.html'),'utf8');
  fs.writeFileSync(world,fs.readFileSync(world,'utf8').replace(f.js,'different()'));
  const beforeWorld=fs.readFileSync(world,'utf8');
  assert.throws(()=>externalizeAdvancedRuntime(f.site,f.project,'/toadal-feast-web/'),/differs from Studio source/);
  assert.equal(fs.readFileSync(path.join(f.site,'index.html'),'utf8'),beforeHome);
  assert.equal(fs.readFileSync(world,'utf8'),beforeWorld);
  assert.equal(fs.readdirSync(path.join(f.site,'assets/js')).length,0);
  assert.equal(fs.readdirSync(path.join(f.site,'assets/css')).length,0);
});
test('missing or duplicate inline runtime fails closed',t=>{
  const f=fixture(t),home=path.join(f.site,'index.html');
  fs.writeFileSync(home,fs.readFileSync(home,'utf8').replace('</script>','</script><script data-toadal-advanced-code>'+f.js+'</script>'));
  assert.throws(()=>externalizeAdvancedRuntime(f.site,f.project,'/toadal-feast-web/'),/exactly one inline advanced JavaScript/);
});
test('stale derived runtime asset in raw export is refused',t=>{
  const f=fixture(t);fs.writeFileSync(path.join(f.site,'assets/js','advanced-code.aaaaaaaaaaaa.js'),'old');
  assert.throws(()=>externalizeAdvancedRuntime(f.site,f.project,'/toadal-feast-web/'),/unexpectedly already contains/);
});
test('invalid base path is refused by the existing base-path authority',t=>{
  const f=fixture(t);
  assert.throws(()=>externalizeAdvancedRuntime(f.site,f.project,'../bad'),/Base path/);
});
