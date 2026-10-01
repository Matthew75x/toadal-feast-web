import fs from 'node:fs';

const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('./styles.css',import.meta.url),'utf8');
const js=fs.readFileSync(new URL('./app.js',import.meta.url),'utf8');

const requiredPages=['home','play','world','stories','media','feast-pass','news','support'];
const failures=[];

for(const page of requiredPages){
  if(!html.includes(`data-page="${page}"`)) failures.push(`missing page: ${page}`);
  if(!html.includes(`href="#${page}"`)) failures.push(`missing navigation: ${page}`);
}
if(!html.includes('data-guide=')) failures.push('missing contextual guide targets');
if(!js.includes('pointerover')||!js.includes('focusin')) failures.push('helper does not cover hover + keyboard focus');
if(!css.includes('@media(max-width:900px)')||!css.includes('@media(max-width:650px)')) failures.push('responsive breakpoints missing');
if(!css.includes('prefers-reduced-motion')) failures.push('reduced-motion handling missing');
if(!html.includes('WO-003')) failures.push('Arcade integration boundary missing');
if(/<img\b/i.test(html)) failures.push('unexpected image introduced before approved asset wiring');

if(failures.length){
  console.error('CONVERGENCE SMOKE: FAIL');
  failures.forEach(x=>console.error('- '+x));
  process.exit(1);
}
console.log('CONVERGENCE SMOKE: PASS');
console.log('pages:',requiredPages.length);
console.log('contextual helper: present');
console.log('responsive breakpoints: present');
console.log('approved-art boundary: preserved');
