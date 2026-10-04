import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {stripTypeScriptTypes} from 'node:module';

// Only the reviewed native presentation dependency is bundled. This is not a
// generic executable component/package loader or an arbitrary import resolver.
export function buildReviewedOwnerRenderer(studioRoot) {
  const sourceName = 'packages/owner-authoring/src/index.ts';
  const dependencyName = 'packages/owner-authoring/src/presentation.ts';
  const source = fs.readFileSync(path.join(studioRoot, sourceName));
  const dependency = fs.readFileSync(path.join(studioRoot, dependencyName));
  const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
  const stripped = stripTypeScriptTypes(source.toString('utf8'), {mode: 'strip'});
  const importLine = /import\s*\{validatePresentationValues,presentationStyle,responsivePresentationProps\}\s*from\s*['"]\.\/presentation\.ts['"];?/;
  if (!importLine.test(stripped)) throw new Error('Review native renderer dependency topology before regenerating the SDK');
  const body = stripped.replace(importLine, '');
  if (/^\s*import\s/m.test(body)) throw new Error('Unreviewed owner renderer dependency');
  const presentation = stripTypeScriptTypes(dependency.toString('utf8'), {mode: 'strip'});
  if (/^\s*import\s/m.test(presentation)) throw new Error('Unreviewed presentation dependency');
  const generated = presentation + '\n' + body;
  return {generated, sourceSha256: hash(source), dependencies: [{source: dependencyName, sourceSha256: hash(dependency)}], generatedSha256: hash(generated)};
}

export function buildReviewedPublicExportProjection(studioRoot) {
  const sourceName='packages/export-manager/src/public-runtime.ts';
  const source=fs.readFileSync(path.join(studioRoot,sourceName));
  const generated=stripTypeScriptTypes(source.toString('utf8'),{mode:'strip'})+'\nexport {rewriteHtml as projectPublicHtml};\n';
  if(!/function rewriteHtml\(html/.test(generated))throw new Error('Review public export projection topology');
  const imports=[...generated.matchAll(/from\s*['"]([^'"]+)['"]/g)].map(m=>m[1]);
  if(JSON.stringify(imports)!==JSON.stringify(['node:fs','node:path','node:crypto']))throw new Error('Unreviewed public export dependency');
  const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
  return {source:sourceName,sourceSha256:hash(source),generated,generatedSha256:hash(generated)};
}
