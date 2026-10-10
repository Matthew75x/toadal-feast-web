import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repo = path.resolve(import.meta.dirname, '..');
const about = JSON.parse(fs.readFileSync(path.join(repo,
  'studio-project/toadal-feast-website/pages/about.json'), 'utf8'));
const css = fs.readFileSync(path.join(repo,
  'studio-project/toadal-feast-website/reference/assets/css/site.css'), 'utf8');

function collect(value) {
  return Array.isArray(value) ? value.flatMap(collect) : value && typeof value === 'object' ?
    [value, ...Object.values(value).flatMap(collect)] : [];
}

test('About intro-to-Mission spacing reuses the next grid gap without changing other gated pages', () => {
  assert.equal(about.components[0].props.variant, 'gated-about');
  assert.equal(about.components[1].props.variant, 'about-mission-philosophy-stories');

  const intro = collect(about.components[0]).find(value => value.props?.className === 'gated-page');
  const introGrid = collect(about.components[0]).find(value => value.props?.className === 'gated-grid');
  const missionGrid = collect(about.components[1]).find(value => value.props?.className === 'gated-grid');
  assert.ok(intro && introGrid && missionGrid, 'the two authored About grids remain present');
  assert.match(css, /\.gated-page\s*\{[^}]*padding:\s*clamp\(20px,\s*3vw,\s*40px\)\s+var\(--page-gutter\)\s+clamp\(44px,\s*6vw,\s*72px\)/s,
    'the shared gated-page rule remains available to other pages');
  assert.match(css, /\.gated-grid\s*\{[^}]*margin-top:\s*clamp\(18px,\s*3vw,\s*32px\)/s,
    'the Mission grid retains its existing responsive top spacing');

  const aboutOnly = css.match(/\.studio-rich-text\.shell\.section\[data-studio-variant="gated-about"\]\s*>\s*\.gated-page\s*\{([^}]*)\}/s);
  assert.ok(aboutOnly, 'the smaller bottom inset applies only to About’s intro wrapper');
  assert.match(aboutOnly[1], /padding-block-end:\s*clamp\(16px,\s*2vw,\s*24px\)/);
  assert.doesNotMatch(aboutOnly[1], /padding(?:-block)?\s*:/,
    'the scoped correction changes only the duplicated lower spacing');
});
