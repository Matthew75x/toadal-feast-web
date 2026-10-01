import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(.:)/, '$1'));
const repo = path.resolve(here, '..');
const project = path.join(repo, 'studio-project', 'toadal-feast-website');
const dist = path.join(repo, 'dist');
const read = p => JSON.parse(fs.readFileSync(path.join(project, p), 'utf8'));

const pagesIndex = read('pages/index.json');
const nav = read('collections/navigation.json');
const symbols = read('collections/symbols.json');
const assets = read('assets/index.json');
const gamesIndex = read('games/index.json');
const symbolMap = new Map(symbols.items.map(x => [x.id, x]));
const assetMap = new Map(assets.assets.map(x => [x.id, x]));
const gameMap = new Map(gamesIndex.games.map(x => [x.id, read(x.file)]));

fs.rmSync(dist, {recursive:true, force:true});
fs.mkdirSync(dist, {recursive:true});
fs.cpSync(path.join(project,'reference','assets'), path.join(dist,'assets'), {recursive:true});
fs.writeFileSync(path.join(dist,'.nojekyll'),'');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fix = html => html
  .replaceAll("href='/#", "href='./#")
  .replaceAll('href="/#', 'href="./#')
  .replaceAll("href='/'", "href='./'")
  .replaceAll('href="/"', 'href="./"');

function gameCard(id) {
  const g = gameMap.get(id);
  if (!g) return '';
  const asset = assetMap.get(g.artAsset);
  const src = asset?.source?.replace(/^reference\//,'') || 'assets/images/world/candy-kingdom.webp';
  return `<article class="studio-game-card module" data-studio-component="${esc(id)}">
    <img src="${esc(src)}" alt="${esc(g.name)} preview artwork" loading="lazy">
    <span class="chip preview">${esc(g.statusLabel || 'PREVIEW')}</span>
    <h3>${esc(g.name)}</h3><p>${esc(g.web?.shortDescription || g.summary || '')}</p>
    <span class="button-link button-link--secondary" aria-disabled="true">Preview</span>
  </article>`;
}

function richText(c) {
  const p = c.props || {};
  const s = symbolMap.get(p.symbolId);
  const q = s?.props || p;
  const html = p.html ? fix(p.html) : (q?.html ? fix(q.html) : '');
  const anchor = p.anchorId ? ` id="${esc(p.anchorId)}"` : '';
  const variant = esc(p.variant || q?.variant || 'default');
  return `<section${anchor} class="studio-rich-text shell section" data-studio-variant="${variant}">${html}</section>`;
}
function renderComponent(c) {
  const p = c.props || {};
  if (c.type === 'core.rich-text') return richText(c);
  if (c.type === 'layout.grid') {
    const body = (p.children || []).map(ch => ch.type === 'game.card' ? gameCard(ch.props?.gameId) : renderComponent(ch)).join('');
    return `<section id="${esc(p.anchorId||'')}" class="studio-layout-grid variant-${esc(p.variant||'default')}">${body}</section>`;
  }
  if (c.type === 'core.content-section') {
    const s = symbolMap.get(p.symbolId);
    const q = s?.props || p;
    return `<section class="home-section-inner"><div class="route-card"><h${q.headingLevel||2}>${esc(q.heading||'')}</h${q.headingLevel||2}><p>${esc(q.body||'')}</p></div></section>`;
  }
  if (c.type === 'core.button') {
    const s = symbolMap.get(p.symbolId);
    const q = {...s?.props, ...p};
    return `<a class="button-link button-link--${esc(q.kind||'secondary')}" href="${esc(q.href||'./')}">${esc(q.label||'Continue')}</a>`;
  }
  return '';
}

function header(pageId) {
  const links = nav.primary.map(n => {
    const current = pageId === `page.${n.id}` || (pageId==='page.home' && n.id==='home');
    return `<a class="${current?'is-current':''}" href="${esc(n.href)}">${esc(n.label)}</a>`;
  }).join('');
  return `<header class="site-header" data-global-shell><nav class="site-nav" aria-label="Primary navigation">
    <a class="site-brand" href="./" aria-label="TOADAL FEAST home"><span>TOADAL FEAST</span></a>
    <button class="nav-toggle site-nav-toggle" type="button" aria-expanded="false" aria-controls="sitePrimaryLinks"><span aria-hidden="true">☰</span><span class="sr-only">Menu</span></button>
    <div class="site-links" id="sitePrimaryLinks">${links}</div>
    <div class="site-utilities"><span class="guest-chip">Guest</span></div>
  </nav></header>`;
}
function footer() {
  const links = nav.footer.map(n => `<a href="${esc(n.href)}">${esc(n.label)}</a>`).join('');
  return `<footer class="site-footer"><div class="site-footer-inner"><div class="studio-signoff"><strong>TOADAL GAMES</strong><small>Home of TOADAL FEAST</small></div><nav class="site-footer-links" aria-label="Footer">${links}</nav></div></footer>`;
}

const behavior = `<script>
const toggle=document.querySelector('.site-nav-toggle'),links=document.querySelector('#sitePrimaryLinks');
toggle?.addEventListener('click',()=>{const v=toggle.getAttribute('aria-expanded')==='true';toggle.setAttribute('aria-expanded',String(!v));links?.classList.toggle('is-open',!v)});
const speech=document.querySelector('[data-companion-speech]'),ct=document.querySelector('[data-companion-toggle]');
function apply(el){if(!speech||!el)return;const host=el.closest('[data-companion-copy]');if(host?.dataset.companionCopy)speech.textContent=host.dataset.companionCopy}
document.addEventListener('pointerover',e=>apply(e.target));document.addEventListener('focusin',e=>apply(e.target));
ct?.addEventListener('click',()=>{const panel=document.querySelector('[data-companion-panel]');const hidden=panel?.hasAttribute('hidden');if(hidden)panel.removeAttribute('hidden');else panel?.setAttribute('hidden','');ct.setAttribute('aria-expanded',String(hidden))});
</script>`;

for (const meta of pagesIndex.pages) {
  const page = read(meta.file);
  const body = (page.components||[]).map(renderComponent).join('\n');
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#2c1710"><title>${esc(page.seo?.title||page.title)}</title><meta name="description" content="${esc(page.seo?.description||page.description||'')}"><link rel="stylesheet" href="assets/css/site.css"></head><body><a class="skip-link" href="#main-content">Skip to content</a>${header(page.id)}<main id="main-content">${body}</main>${footer()}${behavior}</body></html>`;
  const file = meta.route==='/' ? 'index.html' : meta.route.replace(/^\//,'');
  fs.mkdirSync(path.dirname(path.join(dist,file)),{recursive:true});
  fs.writeFileSync(path.join(dist,file), html);
}
console.log(JSON.stringify({pages:pagesIndex.pages.length,dist},null,2));
