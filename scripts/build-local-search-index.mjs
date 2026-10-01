import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const site=path.join(root,'studio-project','toadal-feast-website');
const pagesIndex=JSON.parse(fs.readFileSync(path.join(site,'pages','index.json'),'utf8'));
const registry=JSON.parse(fs.readFileSync(path.join(site,'content','registry.json'),'utf8'));
const entries=[];
const seen=new Set();

function add(entry){
  if(!entry.id||!entry.title||!entry.route||seen.has(entry.id)) return;
  seen.add(entry.id);
  entries.push(entry);
}
function pageGroup(route){
  if(route.startsWith('/characters/')) return 'Characters';
  if(route.startsWith('/media/')) return 'Media';
  if(route.startsWith('/news/')) return 'News';
  if(route.startsWith('/support/')) return 'Help';
  if(route.startsWith('/roadmap/')) return 'Roadmap';
  return 'Pages';
}

for(const record of pagesIndex.pages||[]){
  if(!record.route||record.route.includes(':')||record.route==='/404.html'||record.route==='/search/'||record.route.startsWith('/player/')) continue;
  const file=path.join(site,record.file);
  if(!fs.existsSync(file)) continue;
  const page=JSON.parse(fs.readFileSync(file,'utf8'));
  if(page.searchable===false||String(page.publicationState||'').toUpperCase()==='DRAFT') continue;
  add({id:'page:'+page.id,title:page.title||record.title||record.id,summary:page.description||'',route:page.route||record.route,group:pageGroup(page.route||record.route),kind:'page',publicationState:'SURFACE'});
}

function allowed(x){
  const state=String(x.publicationState||'').toUpperCase();
  return state==='PUBLISHED'||(state==='PREVIEW'&&x.searchable===true);
}
for(const x of registry.characters||[]) if(allowed(x)) add({id:'character:'+x.id,title:x.displayName,summary:x.summary||'',route:x.profileRoute||'/characters/',group:'Characters',kind:'character',publicationState:x.publicationState});
for(const x of registry.media||[]) if(allowed(x)) add({id:'media:'+x.id,title:x.title,summary:x.caption||'',route:x.route||'/media/',group:'Media',kind:x.kind||'media',publicationState:x.publicationState});
for(const x of registry.supportArticles||[]) if(allowed(x)) add({id:'support:'+x.id,title:x.title,summary:x.body||'',route:x.route||'/support/',group:'Help',kind:'support',publicationState:x.publicationState,category:x.category||''});
for(const x of registry.roadmapItems||[]) if(allowed(x)) add({id:'roadmap:'+x.id,title:x.title,summary:x.description||'',route:x.route||'/#whats-next',group:'Roadmap',kind:'roadmap',publicationState:x.publicationState,status:x.publicStatus||''});
for(const x of registry.news||[]) if(allowed(x)) add({id:'news:'+x.id,title:x.title,summary:x.excerpt||'',route:x.route||('/news/'+x.slug+'/'),group:'News',kind:'news',publicationState:x.publicationState});

entries.sort((a,b)=>a.group.localeCompare(b.group)||a.title.localeCompare(b.title));
const output={schema:'toadal-feast.local-search.v1',generatedFrom:['pages/index.json','content/registry.json'],entries};
for(const target of [path.join(site,'reference','assets','data','local-search-index.json'),path.join(root,'dist','assets','data','local-search-index.json')]){
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target,JSON.stringify(output,null,2)+'\n');
}
console.log(`LOCAL SEARCH INDEX: ${entries.length} entries`);
console.log(JSON.stringify(entries.reduce((m,x)=>(m[x.group]=(m[x.group]||0)+1,m),{})));
