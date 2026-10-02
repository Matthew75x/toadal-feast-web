#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const repo = path.resolve(process.argv[2] || '.');
const manifest = path.resolve(process.argv[3] || path.join(repo, 'studio-project/toadal-feast-website/project.json'));
const studioRoot = path.resolve(process.argv[4] || process.env.TOADAL_STUDIO_ROOT || '');
if (!studioRoot || !fs.existsSync(path.join(studioRoot, 'packages/ai-bridge/src/index.ts'))) {
  throw new Error('Pass the audited Studio 1.4.2 root as argument 3 or TOADAL_STUDIO_ROOT.');
}
process.env.TOADAL_PROJECT = manifest;
const { createBridge } = await import(pathToFileURL(path.join(studioRoot, 'packages/ai-bridge/src/index.ts')).href);
const { createMcpProtocol } = await import(pathToFileURL(path.join(studioRoot, 'apps/mcp/protocol.ts')).href);
const protocol = createMcpProtocol(createBridge(manifest));
let id = 0;
async function call(name, args = {}) {
  const response = await protocol.handle({ jsonrpc: '2.0', id: ++id, method: 'tools/call', params: { name, arguments: args } });
  if (response.error) throw new Error(name + ': ' + JSON.stringify(response.error));
  const result = response.result;
  if (!result || result.isError) throw new Error(name + ': ' + JSON.stringify(result));
  return result.structuredContent ?? result;
}

const inspected = await call('toadal.inspect', { scope: 'workspace' });
const appPage = await call('toadal.inspect', { scope: 'page', id: 'page.app' });
const homePage = await call('toadal.inspect', { scope: 'page', id: 'page.home' });
const wickedPage = await call('toadal.inspect', { scope: 'page', id: 'page.game-wicked-bites' });
const graph = await call('toadal.graph', { include_edges: true });
const rendered = await call('toadal.render');
const exported = await call('toadal.export', { kind: 'static' });
const checkpoint = await call('toadal.checkpoint', {
  mode: 'verify',
  label: 'visual-asset-gameplay-convergence',
  task: 'Qualify owner-preview visual asset authority and real gameplay convergence from the exact 40e4437 baseline.',
  notes: 'Validated neutral Gully provenance, hash-verified mobile app QA captures, Home/App device framing, and Wicked Bites gameplay detail. Local export only; no website deployment.'
});

const summary = {
  schema: 'toadal-feast.visual-asset-gameplay-studio-flow.v1',
  projectManifest: manifest,
  studio: { name: inspected.server?.name, version: inspected.server?.version },
  project: inspected.project,
  counts: inspected.counts,
  validationAtInspect: inspected.validation,
  graph: { nodes: graph.nodes, edges: graph.edges, dangling: graph.dangling, nodeTypes: graph.nodeTypes },
  inspectedPages: [homePage, appPage, wickedPage].map((page) => ({ id: page.value?.id, route: page.value?.route, title: page.value?.title, componentCount: page.value?.components?.length })),
  render: rendered,
  staticExport: exported,
  checkpoint
};
const reportDir = path.join(repo, 'docs/review/visual-asset-gameplay-convergence-20261001');
fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(path.join(reportDir, 'studio-flow.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify({
  schema: summary.schema,
  projectManifest: summary.projectManifest,
  studio: summary.studio,
  project: summary.project,
  validationAtInspect: summary.validationAtInspect,
  graph: summary.graph,
  inspectedPages: summary.inspectedPages,
  render: summary.render,
  staticExport: summary.staticExport,
  checkpoint: summary.checkpoint,
  report: 'docs/review/visual-asset-gameplay-convergence-20261001/studio-flow.json'
}, null, 2));
if (!inspected.validation?.valid || checkpoint.ok === false || checkpoint.validation?.ok === false) process.exitCode = 1;
