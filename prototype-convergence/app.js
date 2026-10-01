const pages=[...document.querySelectorAll('[data-page]')];
const nav=[...document.querySelectorAll('.site-nav a')];
const guide=document.querySelector('#guide-copy');
const navBox=document.querySelector('#site-nav');
const menu=document.querySelector('.menu-toggle');

function route(){
  const wanted=(location.hash||'#home').slice(1);
  const exists=pages.some(p=>p.dataset.page===wanted);
  const name=exists?wanted:'home';
  pages.forEach(p=>p.classList.toggle('active',p.dataset.page===name));
  nav.forEach(a=>a.setAttribute('aria-current',a.getAttribute('href')==='#'+name?'page':'false'));
  navBox.classList.remove('open');
  menu?.setAttribute('aria-expanded','false');
  window.scrollTo({top:0,behavior:'instant'});
  const active=pages.find(p=>p.dataset.page===name);
  const title=active?.querySelector('h1')?.textContent||'TOADAL FEAST';
  document.title=title+' — TOADAL FEAST';
}
addEventListener('hashchange',route);
route();

menu?.addEventListener('click',()=>{
  const open=navBox.classList.toggle('open');
  menu.setAttribute('aria-expanded',String(open));
});

const defaultGuide='Explore the page — I’ll explain what you’re looking at.';
document.addEventListener('pointerover',e=>{
  const target=e.target.closest('[data-guide]');
  if(target) guide.textContent=target.dataset.guide;
});
document.addEventListener('focusin',e=>{
  const target=e.target.closest('[data-guide]');
  if(target) guide.textContent=target.dataset.guide;
});
document.addEventListener('pointerout',e=>{
  const from=e.target.closest?.('[data-guide]');
  const to=e.relatedTarget?.closest?.('[data-guide]');
  if(from && !to) guide.textContent=defaultGuide;
});