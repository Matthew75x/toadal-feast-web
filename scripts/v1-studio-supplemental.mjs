// Preserve Windows bridge failures honestly, then run the identical commands directly.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
const repo = path.resolve(process.argv[2] || '.');
const studio = path.resolve(process.argv[3]);
const manifest = path.join(repo, 'studio-project/toadal-feast-website/project.json');
process.env.TOADAL_PROJECT = manifest;
delete process.env.TOADAL_PREVIEW;
const {createBridge} = await import(pathToFileURL(path.join(studio, 'packages/ai-bridge/src/index.ts')));
const bridge = createBridge(manifest);
const qa = bridge.qa('full');
const checkpoint = bridge.checkpoint({mode:'full', label:'v1-release-full', task:'Final V1 supplemental qualification', notes:'Windows npm.cmd wrapper failures remain recorded. Direct unmodified canonical fixture suite and exact-project doctor are run separately.'});
const fixtureEnv = {...process.env};
delete fixtureEnv.TOADAL_PROJECT;
delete fixtureEnv.TOADAL_PREVIEW;
function direct(command, env) {
  const result = spawnSync('powershell.exe', ['-NoProfile','-ExecutionPolicy','Bypass','-Command',command], {cwd:studio, env, encoding:'utf8', timeout:180000, maxBuffer:8*1024*1024});
  return {command, status:result.status, ok:result.status===0, stdout:result.stdout, stderr:result.stderr, error:result.error?.message||null};
}
const packageTests = direct('npm test', fixtureEnv);
const doctor = direct('npm run ai:doctor', {...process.env, TOADAL_PROJECT:manifest});
const report = {schema:'toadal-feast.v1-studio-supplemental.v1', manifest, qa, checkpoint, packageFixture:'Studio canonical fixture; TOADAL_PROJECT/TOADAL_PREVIEW unset only in fixture child', packageTests, doctor};
const output = path.resolve(repo,process.argv[4] || 'docs/review/v1-release-20261002/studio-supplemental.json');
fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({fullQaWrapper:qa.tests, fullCheckpointOk:checkpoint.ok, packageTests:{ok:packageTests.ok,tail:packageTests.stdout?.slice(-320)}, doctor:doctor.ok, report:output},null,2));
if (!packageTests.ok || !doctor.ok || !qa.validation.valid) process.exitCode=1;
