#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const repo = path.resolve(process.argv[2] || '.');
const project = path.join(repo, 'studio-project', 'toadal-feast-website');
const pagesIndex = JSON.parse(fs.readFileSync(path.join(project, 'pages', 'index.json'), 'utf8'));
const nav = JSON.parse(fs.readFileSync(path.join(project, 'collections', 'navigation.json'), 'utf8'));

const implemented = new Set((pagesIndex.pages || []).map(p => p.route));
const normalize = (href) => {
  if (!href || href === './' || href === '/') return '/';
  if (/^(?:https?:|mailto:|tel:|#)/i.test(href)) return null;
  let x = href.replace(/^\.\//, '');
  if (!x.startsWith('/')) x = '/' + x;
  if (!x.endsWith('/') && !/\.[a-z0-9]+$/i.test(x)) x += '/';
  return x;
};

const violations = [];
for (const group of ['primary', 'footer']) {
  for (const item of nav[group] || []) {
    const route = normalize(item.href);
    if (route && !implemented.has(route)) {
      violations.push({ group, id: item.id, label: item.label, href: item.href, normalizedRoute: route });
    }
  }
}
console.log(JSON.stringify({
  schema: 'toadal-feast.navigation-truth-check.v1',
  implementedRoutes: [...implemented].sort(),
  violations,
  summary: {
    implemented: implemented.size,
    navTargetsChecked: (nav.primary || []).length + (nav.footer || []).length,
    unresolvedTargets: violations.length
  }
}, null, 2));

if (violations.length) process.exitCode = 1;
