import fs from 'node:fs';
import path from 'node:path';
import { createOwnerNativeProjector } from './lib/owner-native-projection.mjs';

const root=process.cwd();
const pagesDir=path.join(root,'studio-project','toadal-feast-website','pages');
const index=JSON.parse(fs.readFileSync(path.join(pagesDir,'index.json'),'utf8'));
const errors=[];
const projector=await createOwnerNativeProjector();
const expected=[
  ['account','/account/'],
  ['community','/community/'],
  ['store','/store/'],
  ['contact','/contact/'],
  ['about','/about/'],
  ['coming-soon','/coming-soon/'],
  ['legal','/legal/'],
];
const routes=new Map(index.pages.map(p=>[p.id,p.route]));

for(const [slug,route] of expected){
  const id='page.'+slug;
  if(routes.get(id)!==route) errors.push(id+' missing or wrong route: '+routes.get(id));
  const src=path.join(pagesDir,slug+'.json');
  const out=path.join(root,'dist',slug,'index.html');
  if(!fs.existsSync(src)) errors.push('missing source page '+src);
  if(!fs.existsSync(out)) errors.push('missing dist page '+out);
  if(fs.existsSync(src)){
    const page=JSON.parse(fs.readFileSync(src,'utf8'));
    if(page.publicationState!=='noindex') errors.push(slug+' must remain noindex on this review candidate');
    if(page.route!==route) errors.push(slug+' source route mismatch');
  }
}

function source(slug){
  const page=JSON.parse(fs.readFileSync(path.join(pagesDir,slug+'.json'),'utf8'));
  return projector.projectComponentHtml(path.dirname(pagesDir),page.components[0]);
}

const account=source('account');
if(!/Sign up and login are not live/.test(account)) errors.push('Account must state sign up/login are not live.');
if((account.match(/\bdisabled\b/g)||[]).length<2) errors.push('Account sign-up/login controls must be disabled.');
if(!/Continue without an account/.test(account)) errors.push('Account must preserve continue-as-guest path.');

const community=source('community');
if(!/Submission system not connected/.test(community)) errors.push('Community must state submission is not connected.');
if(/<form\b/i.test(community)) errors.push('Community must not expose a posting form.');

const store=source('store');
if(!/no public products, prices, or checkout flows/i.test(store)) errors.push('Store must explicitly deny live products/prices/checkout.');
if(/<form\b/i.test(store)) errors.push('Store must not expose checkout forms.');
if(/href=['\"][^'\"]*(checkout|cart|buy|payment)/i.test(store)) errors.push('Store must not link to checkout/cart/buy/payment.');

const contact=source('contact');
if(!/No submission endpoint/.test(contact)) errors.push('Contact must state no submission endpoint.');
if(!/type='submit' disabled/.test(contact)) errors.push('Contact submit control must be disabled.');
const formTag=(contact.match(/<form\b[^>]*>/i)||[''])[0];
if(/\saction=['\"][^'\"]+/.test(formTag)) errors.push('Contact form must not define a submission action.');
if(!/Nothing entered here is sent anywhere/.test(contact)) errors.push('Contact must state entered data is not sent.');

const about=source('about');
if(!/TOADAL GAMES is the studio identity/.test(about)) errors.push('About must keep the studio identity factual.');
if(!/public experience remains TOADAL FEAST-first/.test(about)) errors.push('About must keep TOADAL FEAST first.');

const coming=source('coming-soon');
if(!/No release promise is implied/.test(coming)) errors.push('Coming Soon must explicitly avoid release promises.');
if(/\b20\d{2}\b/.test(coming)) errors.push('Coming Soon must not contain invented year/date.');

const legal=source('legal');
if((legal.match(/NOT PUBLISHED/g)||[]).length<2) errors.push('Legal must mark both Privacy Policy and Terms not published.');
if(!/does not substitute generated copy for a legal Privacy Policy/.test(legal)) errors.push('Legal must refuse generated legal copy.');
if(!/not a replacement for a privacy policy/.test(legal)) errors.push('Product facts must be distinguished from legal policy.');

const supportPage=JSON.parse(fs.readFileSync(path.join(pagesDir,'support.json'),'utf8'));
const support=projector.projectComponentHtml(path.dirname(pagesDir),supportPage.components[0]);
if(/does not offer account sync or saved progression/.test(support)) errors.push('Support still contains stale no-saved-progression claim.');
if(!/Feast Pass progress can persist locally on this browser/.test(support)) errors.push('Support must explain current browser-local progress.');
if(!/href='\/contact\/'/.test(support) || !/href='\/legal\/'/.test(support)) errors.push('Support must route to Contact and Legal previews.');

console.log('Gated route records: '+expected.length);
if(errors.length){
  console.error('GATED ECOSYSTEM VERIFY: FAIL');
  for(const e of errors) console.error('- '+e);
  process.exit(1);
}
console.log('GATED ECOSYSTEM VERIFY: PASS');
