import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
export const isProtectedGameArtifact = file => /(?:^|\/)(?:public\/games|game-packages|cartridges)\//i.test(String(file).replaceAll('\\','/'));
export function verifyProtectedGameArtifacts(dist, project) {
  const reference=path.join(project,'reference'), rows=[], errors=[];
  const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
  function walk(dir) {if(!fs.existsSync(dir))return;for(const e of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,e.name);if(e.isSymbolicLink()){errors.push('Protected artifact symlink: '+full);continue;}if(e.isDirectory())walk(full);else if(e.isFile()){const file=path.relative(reference,full).replaceAll('\\','/');if(!isProtectedGameArtifact(file))continue;const published=path.join(dist,file);if(!fs.existsSync(published)){errors.push('Protected artifact missing: '+file);continue;}const sourceHash=sha(fs.readFileSync(full)),exportHash=sha(fs.readFileSync(published));rows.push({file,sourceHash,exportHash});if(sourceHash!==exportHash)errors.push('Protected artifact bytes changed: '+file);}}}
  walk(reference);
  function exported(dir){if(!fs.existsSync(dir))return;for(const e of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,e.name);if(e.isDirectory())exported(full);else if(e.isFile()){const file=path.relative(dist,full).replaceAll('\\','/');if(isProtectedGameArtifact(file)&&!rows.some(r=>r.file===file))errors.push('Unaccounted protected output: '+file);}}}
  exported(dist);
  return {valid:errors.length===0,files:rows,errors};
}
