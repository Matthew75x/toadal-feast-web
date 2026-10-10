import test from 'node:test';
import assert from 'node:assert/strict';
import {requireCompleteExactEngine,convergencePreflight} from './studio-convergence-preflight.mjs';
const expected={commit:'a'.repeat(40)};
const good={...expected,completeWorkingTree:true,missingTrackedFiles:0};
test('source-bound qualification requires complete exact source, not equivalent or partial checkout',()=>{
 assert.equal(requireCompleteExactEngine(good,expected),good);
 assert.throws(()=>requireCompleteExactEngine({...good,commit:'b'.repeat(40)},expected),/exact reviewed/);
 assert.throws(()=>requireCompleteExactEngine({...good,completeWorkingTree:false,missingTrackedFiles:1},expected),/complete tracked/);
 assert.throws(()=>requireCompleteExactEngine({...good,missingTrackedFiles:1},expected),/complete tracked/);
});
test('source-bound qualification rejects reproduction runtimes before touching source',()=>{
 assert.throws(()=>convergencePreflight({engineRoot:'/missing',nodeVersion:'24.19.0'}),/not required Node/);
});
test('explicit archival exclusion mode permits only reviewed missing docs, never missing executable source',()=>{
 const expectedArchive={...expected,reviewedArchivalExclusions:['docs/v51/evidence/old.png']};
 const partial={...good,completeWorkingTree:false,missingTrackedFiles:1,missingTrackedPaths:['docs/v51/evidence/old.png']};
 assert.throws(()=>requireCompleteExactEngine(partial,expectedArchive),/complete tracked/);
 assert.equal(requireCompleteExactEngine(partial,expectedArchive,{allowArchivalDocs:true}),partial);
 for(const p of ['packages/renderer/src/index.ts','package-lock.json','tests/required.ts','docs/unreviewed.png','docs/v51/evidence/runner.mjs'])assert.throws(()=>requireCompleteExactEngine({...partial,missingTrackedPaths:[p]},expectedArchive,{allowArchivalDocs:true}),/complete tracked/);
});

import {normalizeConvergenceHtml} from './lib/convergence-html-parity.mjs';
test('CSS URL quote parity normalizes only paired quotes inside a single-quoted style attribute',()=>{
 const raw=`<div style='background-image:url("/a b.webp")'>`,encoded=`<div style='background-image:url(&quot;/a b.webp&quot;)'>`;
 assert.equal(normalizeConvergenceHtml(raw),encoded);
 for(const changed of [encoded.replace('/a b.webp','/other.webp'),encoded.replace('background-image','mask-image'),encoded.replace('<div','<section')])assert.notEqual(normalizeConvergenceHtml(raw),normalizeConvergenceHtml(changed));
 assert.equal(normalizeConvergenceHtml('<script>url("/x")</script>'),'<script>url("/x")</script>');
 assert.equal(normalizeConvergenceHtml(`<div style='background:url("/x)'>`),`<div style='background:url("/x)'>`);
});
test('parity parser preserves style-like text in scripts, comments and unrelated attributes',()=>{
 for(const source of [`<script>const x=\`<div style='url("/x")'>\`</script>`,`<!-- <div style='url("/x")'> -->`,`<div data-example="style='url(&quot;/x&quot;)'">`])assert.equal(normalizeConvergenceHtml(source),source);
});
