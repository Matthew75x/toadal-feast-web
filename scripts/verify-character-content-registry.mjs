import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const registry=JSON.parse(fs.readFileSync(path.join(root,'studio-project/toadal-feast-website/content/registry.json'),'utf8'));
const assets=JSON.parse(fs.readFileSync(path.join(root,'studio-project/toadal-feast-website/assets/index.json'),'utf8'));
const pages=JSON.parse(fs.readFileSync(path.join(root,'studio-project/toadal-feast-website/pages/index.json'),'utf8'));
const errors=[];
const allowed=new Set(['DRAFT','PREVIEW','PUBLISHED','ARCHIVED']);

for(const key of ['games','characters','worlds','locations','storySeries','chapters','media','news','supportArticles','roadmapItems','legalDocuments']){
  if(!Array.isArray(registry[key])) errors.push('Missing required registry array: '+key);
}
if(registry.schemaVersion!==1) errors.push('schemaVersion must be 1.');

const ids=new Set(), slugs=new Set();
for(const c of registry.characters||[]){
  if(!/^[a-z0-9][a-z0-9-]*$/.test(c.id)) errors.push('Invalid character id: '+c.id);
  if(!/^[a-z0-9][a-z0-9-]*$/.test(c.slug)) errors.push('Invalid character slug: '+c.slug);
  if(ids.has(c.id)) errors.push('Duplicate character id: '+c.id); else ids.add(c.id);
  if(slugs.has(c.slug)) errors.push('Duplicate character slug: '+c.slug); else slugs.add(c.slug);
  if(!allowed.has(c.publicationState)) errors.push('Invalid publicationState for '+c.id);
  if(!c.displayName) errors.push('Missing displayName for '+c.id);
}
const assetIds=new Set((assets.assets||[]).map(a=>a.id));
for(const c of registry.characters||[]){
  for(const a of c.assetIds||[]) if(!assetIds.has(a)) errors.push('Unknown asset '+a+' for '+c.id);
}
const routes=new Set((pages.pages||[]).map(p=>p.route));
for(const route of ['/characters/','/characters/toadal/']) if(!routes.has(route)) errors.push('Missing route '+route);
for(const rel of ['dist/characters/index.html','dist/characters/toadal/index.html']){
  if(!fs.existsSync(path.join(root,rel))) errors.push('Missing export '+rel);
}
const toadal=(registry.characters||[]).find(c=>c.id==='toadal');
if(!toadal?.profileRoute || toadal.profileRoute!=='/characters/toadal/') errors.push('Toadal profileRoute mismatch.');
if((registry.characters||[]).length!==7) errors.push('Expected 7 currently approved character-art records.');

console.log(JSON.stringify({
 schema:'toadal-feast.character-content-check.v1',
 characters:(registry.characters||[]).map(c=>({id:c.id,state:c.publicationState,assets:c.assetIds||[]})),
 routes:['/characters/','/characters/toadal/'],
 errors
},null,2));
if(errors.length) process.exit(1);
console.log('CHARACTER CONTENT REGISTRY CHECK PASS');
