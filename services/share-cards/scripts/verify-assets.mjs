import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root = new URL('../assets/',import.meta.url);
const manifest = JSON.parse(await readFile(new URL('provenance.json',root),'utf8'));
for(const asset of manifest.assets) {
  const bytes=await readFile(new URL(asset.path,root));
  if(bytes.length!==asset.bytes || createHash('sha256').update(bytes).digest('hex')!==asset.sha256)throw new Error('Asset differs from reviewed input: '+asset.path);
}
console.log('PASS: '+manifest.assets.length+' licensed/provenance-pinned asset files.');
