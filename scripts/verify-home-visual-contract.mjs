#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const repo = path.resolve(process.argv[2] || '.');
const project = path.join(repo, 'studio-project', 'toadal-feast-website');
const read = (rel) => fs.readFileSync(path.join(project, rel), 'utf8');
const home = JSON.parse(read(path.join('pages', 'home.json')));
const nav = JSON.parse(read(path.join('collections', 'navigation.json')));
const advanced = JSON.parse(read(path.join('collections', 'advanced-code.json')));
const css = read(path.join('reference', 'assets', 'css', 'site.css'));
const template = read(path.join('reference', 'home-template.html'));
const html = home.components?.map(c => c?.props?.html || '').join('\n') || '';

const checks = [];
const check = (id, ok, detail, severity='FAIL') =>
  checks.push({ id, ok: Boolean(ok), severity, detail });
const has = (text, pattern) => pattern instanceof RegExp ? pattern.test(text) : text.includes(pattern);

check('hero-headline', has(html, 'Play the<br><span>Feast World</span><br>for Free.'), 'Locked Home hero message is present.');
check('browser-games', has(html, 'id="browser-games"'), 'Immediate browser-game discovery exists.');
check('feast-pass', has(html, 'id="feast-pass-preview"'), 'Feast Pass surface exists.');
check('app-conversion', has(html, 'id="mobile-app"'), 'Flagship app conversion exists.');
check('future-state', has(html, 'id="whats-next"'), 'Truthful future-state surface exists.');
check('canonical-toadal', /toadal-(?:victory|portrait)\.png/i.test(html), 'Canonical Toadal image is referenced.');
check('retired-lily-absent', !/(walk_12f|idle_blink_16f_256|catch_open_10f|curated-highres\/princess\/idle\.png)/i.test(html+css), 'Retired Princess Lily assets are absent.');
check('desktop-search-field',
  /type=["']search["']/i.test(template+html) || /class=["'][^"']*(?:search-box|search-field)[^"']*["']/i.test(template+html),
  'Approved desktop search-field treatment exists; icon-only search is not sufficient.');
check('today-surface',
  /id=["'][^"']*(?:today|current-adventure)[^"']*["']/i.test(html) || /class=["'][^"']*(?:today|current-adventure)[^"']*["']/i.test(html),
  'Dedicated Today/current-adventure surface exists.');
check('contextual-companion-source', /data-companion-message=/i.test(html), 'Sections expose contextual companion messages.');
check('contextual-companion-pointer', has(advanced.javascript || '', "pointerenter"), 'Companion reacts to pointer hover/focus context.');
check('contextual-companion-focus', has(advanced.javascript || '', "focusin"), 'Companion reacts to keyboard focus.');
check('companion-minimize-persistence', /localStorage\.setItem\(MIN_KEY/i.test(advanced.javascript || ''), 'Companion minimize state persists.');
check('reduced-motion', /prefers-reduced-motion\s*:\s*reduce/i.test(css), 'Reduced-motion behavior exists.');
check('mobile-breakpoint', /@media\(max-width:430px\)/i.test(css), 'Small-phone breakpoint exists.');
check('preview-truth', /data-state=["']preview["']/i.test(html) && /disabled>Preview coming soon/i.test(html), 'Preview games are not falsely exposed as playable.');
check('store-link-truth', /App Store · link pending/i.test(html) && /Google Play · link pending/i.test(html), 'Store destinations remain visibly pending rather than fabricated.');

const requiredNav = ['Home','Play','World','Stories','Media','Feast Pass','App'];
const navLabels = new Set((nav.primary || []).map(x => x.label));
check('core-navigation', requiredNav.every(x => navLabels.has(x)), 'Core approved navigation labels are present.');

const failures = checks.filter(c => !c.ok && c.severity === 'FAIL');
const warnings = checks.filter(c => !c.ok && c.severity === 'WARN');
console.log(JSON.stringify({
  schema: 'toadal-feast.home-visual-contract-check.v1',
  repo,
  checks,
  summary: { total: checks.length, pass: checks.filter(c=>c.ok).length, fail: failures.length, warn: warnings.length }
}, null, 2));
if (failures.length) process.exitCode = 1;
