// Tie actual HTTP bytes to a frozen Git commit, without injecting a circular build SHA.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
const [sha, baseInput, reportInput] = process.argv.slice(2);
if (!/^[a-f0-9]{40}$/.test(sha||'') || !baseInput || !reportInput) throw new Error('Usage: node scripts/v1-release-byte-probe.mjs <SHA> <BASE_URL> <REPORT_JSON>');
const base = new URL(baseInput.endsWith('/') ? baseInput : baseInput+'/');
if (!['http:','https:'].includes(base.protocol)) throw new Error('HTTP(S) base required');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const files = ['index.html','play/index.html','games/wicked-bites/index.html','player/wicked-bites/index.html',
  'world/index.html','characters/index.html','stories/index.html','media/index.html','feast-pass/index.html',
  'app/index.html','search/index.html','404.html','robots.txt','assets/css/site.css','assets/js/companion-position.js',
  'assets/js/home-interactive-discovery.js','assets/js/guest-progression.js','public/games/wicked-bites/index.html',
  'public/games/wicked-bites/toadal-bridge.js','public/games/wicked-bites/cartridge.json',
  'assets/images/characters/gully.webp','assets/images/characters/toadal-victory.webp'];
const checks = [];
for (const file of files) {
  const git = spawnSync('git',['show',`${sha}:dist/${file}`],{maxBuffer:8*1024*1024});
  if (git.status !== 0) throw new Error(`Frozen file missing: ${file}`);
  const url = new URL(file,base);
  url.searchParams.set('v1',sha.slice(0,12));
  const response = await fetch(url,{signal:AbortSignal.timeout(30000)});
  const bytes = Buffer.from(await response.arrayBuffer());
  const expected = hash(git.stdout), actual = hash(bytes);
  checks.push({file,url:url.href,httpStatus:response.status,expectedSha256:expected,actualSha256:actual,
    bytes:bytes.length,pass:response.status===200&&expected===actual,contentType:response.headers.get('content-type'),
    cacheControl:response.headers.get('cache-control'),contentEncoding:response.headers.get('content-encoding')});
}
const missing = new URL(`__v1_missing_${sha.slice(0,8)}__/`,base);
const missingResponse = await fetch(missing,{signal:AbortSignal.timeout(30000)});
const missingBytes = Buffer.from(await missingResponse.arrayBuffer());
const frozen404 = spawnSync('git',['show',`${sha}:dist/404.html`],{maxBuffer:8*1024*1024}).stdout;
checks.push({file:'missing-route',url:missing.href,httpStatus:missingResponse.status,expectedSha256:hash(frozen404),
  actualSha256:hash(missingBytes),pass:missingResponse.status===404&&hash(missingBytes)===hash(frozen404)});
const report = {schema:'toadal-feast.v1-deployed-byte-probe.v1',sha,base:base.href,generatedAt:new Date().toISOString(),
  status:checks.every(x=>x.pass)?'PASS':'FAIL',passed:checks.filter(x=>x.pass).length,total:checks.length,checks};
const output=path.resolve(reportInput); fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,passed:report.passed,total:report.total,failures:checks.filter(x=>!x.pass)},null,2));
if (report.status!=='PASS') process.exitCode=1;
