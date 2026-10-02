// One bounded, history-aware Studio correction; no asset bytes or tests changed.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const repo = path.resolve(process.argv[2] || '.');
const studio = path.resolve(process.argv[3]);
const manifest = path.join(repo, 'studio-project/toadal-feast-website/project.json');
process.env.TOADAL_PROJECT = manifest;
const {createBridge} = await import(pathToFileURL(path.join(studio, 'packages/ai-bridge/src/index.ts')));
const {createMcpProtocol} = await import(pathToFileURL(path.join(studio, 'apps/mcp/protocol.ts')));
const protocol = createMcpProtocol(createBridge(manifest));
let id = 0;
async function call(name, args) {
  const response = await protocol.handle({jsonrpc:'2.0', id:++id, method:'tools/call', params:{name, arguments:args}});
  if (response.error || response.result?.isError) throw new Error(JSON.stringify(response));
  return response.result.structuredContent;
}
await call('toadal.inspect', {scope:'workspace'});
const code = await call('toadal.content', {kind:'collection', action:'read', name:'advancedCode'});
const initial = "image.src = siteRoot + '/assets/images/characters/toadal-victory.png';";
const fallback = "var defaultCompanionImage = image.getAttribute('src') || '';";
const source = code.value.javascript;
const trialInitial = "image.src = siteRoot + '/assets/images/characters/toadal-victory.webp';";
const trialFallback = "var defaultCompanionImage = siteRoot + '/assets/images/characters/toadal-victory.webp';";
const revertedSharedTrial = source.includes(trialInitial);
if (revertedSharedTrial) {
  if (source.split(trialInitial).length !== 2 || source.split(trialFallback).length !== 2) throw new Error('Unexpected trial state; aborting bounded correction.');
  const value = {...code.value, javascript:source.replace(trialInitial, initial).replace(trialFallback, fallback)};
  await call('toadal.content', {kind:'collection', action:'write', name:'advancedCode', value, expected_revision:code.revision});
}
const component = await call('toadal.component', {action:'read', page_id:'page.home', component_id:'component.home.companion'});
const html = component.component.props.html;
const old = "data-companion-image src='assets/images/characters/toadal-victory.png'";
const replacement = "data-companion-image srcset='assets/images/characters/toadal-victory.webp 611w' sizes='142px' src='assets/images/characters/toadal-victory.png'";
if (!html.includes(replacement)) {
  if (html.split(old).length !== 2) throw new Error('Unexpected Home companion markup; aborting bounded correction.');
  await call('toadal.component', {action:'update', page_id:'page.home', component_id:'component.home.companion', props:{html:html.replace(old,replacement)}, expected_revision:component.revision});
}
const report = {schema:'toadal-feast.v1-delivery-correction.v1', project:manifest,
  changes:['Home companion uses the already-loaded approved WebP srcset, preserving the canonical PNG fallback.'],
  revertedSharedTrial, rationale:'Shared advanced-code must remain byte-identical so the frozen cartridge export is unchanged. The Home-only markup correction avoids the initial PNG transfer without changing contextual art handling.',
  assetsChanged:false, testsChanged:false};
const output = path.join(repo, 'docs/review/v1-release-20261002/delivery/correction.json');
fs.mkdirSync(path.dirname(output), {recursive:true});
fs.writeFileSync(output, JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
