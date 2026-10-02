import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const project = path.join(repo, 'studio-project', 'toadal-feast-website');
const registry = JSON.parse(fs.readFileSync(path.join(project, 'content', 'registry.json'), 'utf8'));

const news = (Array.isArray(registry.news) ? registry.news : []).filter((item) => item?.publicationState === 'PUBLISHED');
const statusMap = { PREVIEW: 'available-now', COMING_SOON: 'coming-soon', PLANNED: 'exploring' };
const roadmap = (Array.isArray(registry.roadmapItems) ? registry.roadmapItems : [])
  .filter((item) => item?.publicationState === 'PREVIEW' && statusMap[item.publicStatus])
  .map((item) => ({ slug: item.slug, title: item.title, summary: item.description, status: statusMap[item.publicStatus], publicStatus: item.publicStatus, route: item.route, publicationState: 'PUBLISHED' }));

const output = path.join(project, 'reference', 'assets', 'data', 'manifest-public-content.json');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify({ schema: 'toadal.manifest-public-content.v1', news, roadmap }, null, 2)}\n`);
console.log(JSON.stringify({ output: path.relative(repo, output), news: news.length, roadmap: roadmap.length, statuses: [...new Set(roadmap.map((item) => item.status))] }, null, 2));
