#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const repo = path.resolve(process.argv[2] || '.');
const project = path.join(repo, 'studio-project', 'toadal-feast-website');
const pagesIndex = JSON.parse(fs.readFileSync(path.join(project, 'pages', 'index.json'), 'utf8'));
const nav = JSON.parse(fs.readFileSync(path.join(project, 'collections', 'navigation.json'), 'utf8'));
const home = JSON.parse(fs.readFileSync(path.join(project, 'pages', 'home.json'), 'utf8'));

const implemented = new Set((pagesIndex.pages || []).map(p => p.route));
const homeIds = new Set();
for (const item of home.components || []) {
  if (item?.props?.anchorId) homeIds.add(item.props.anchorId);
  const markup = item?.props?.html || '';
  for (const match of markup.matchAll(/\bid\s*=\s*["']([^"']+)["']/giu)) homeIds.add(match[1]);
}
const normalize = (href) => {
  if (!href) return null;
  if (/^(?:https?:|mailto:|tel:)/i.test(href)) return null;
  const route = href.split(/[?#]/u, 1)[0];
  if (!route || route === '.' || route === './' || route === '/') return '/';
  let x = route.replace(/^\.\//, '');
  if (!x.startsWith('/')) x = '/' + x;
  if (!x.endsWith('/') && !/\.[a-z0-9]+$/i.test(x)) x += '/';
  return x;
};

const violations = [];
for (const group of ['primary', 'footer']) {
  for (const item of nav[group] || []) {
    const route = normalize(item.href);
    if (route && !implemented.has(route)) {
      violations.push({ group, id: item.id, label: item.label, href: item.href, normalizedRoute: route, reason: 'route-not-implemented' });
    }
    if (item.href && !/^(?:https?:|mailto:|tel:)/i.test(item.href)) {
      const hashAt = item.href.indexOf('#');
      const fragment = hashAt < 0 ? '' : decodeURIComponent(item.href.slice(hashAt + 1));
      const pathPart = hashAt < 0 ? item.href : item.href.slice(0, hashAt);
      if (fragment && (!pathPart || pathPart === '.' || pathPart === './' || pathPart === '/') && !homeIds.has(fragment)) {
        violations.push({ group, id: item.id, label: item.label, href: item.href, normalizedRoute: '/', fragment, reason: 'fragment-not-implemented-on-home' });
      }
    }
  }
}
console.log(JSON.stringify({
  schema: 'toadal-feast.navigation-truth-check.v2',
  implementedRoutes: [...implemented].sort(),
  implementedHomeFragments: [...homeIds].sort(),
  violations,
  summary: {
    implemented: implemented.size,
    navTargetsChecked: (nav.primary || []).length + (nav.footer || []).length,
    unresolvedTargets: violations.length
  }
}, null, 2));

if (violations.length) process.exitCode = 1;
