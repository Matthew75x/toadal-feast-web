import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {buildReviewedPublicExportProjection} from './owner-renderer-build.mjs';
const vendor=path.resolve(import.meta.dirname,'../vendor');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
export function verifyPublicProjection(studioRoot){
  const provenance=JSON.parse(fs.readFileSync(path.join(vendor,'public-export-projection.provenance.json'),'utf8'));
  const bytes=fs.readFileSync(path.join(vendor,'public-export-projection.mjs'));
  if(hash(bytes)!==provenance.generatedSha256)throw Error('Public export projection generated-byte drift');
  if(studioRoot){const live=buildReviewedPublicExportProjection(studioRoot);if(live.sourceSha256!==provenance.sourceSha256||!bytes.equals(Buffer.from(live.generated)))throw Error('Public export projection source drift');}
  return {provenance,sourceChecked:!!studioRoot};
}
export async function createPublicProjector(studioRoot=process.env.TOADAL_STUDIO_ROOT){
  verifyPublicProjection(studioRoot);
  return (await import(pathToFileURL(path.join(vendor,'public-export-projection.mjs')))).projectPublicHtml;
}
