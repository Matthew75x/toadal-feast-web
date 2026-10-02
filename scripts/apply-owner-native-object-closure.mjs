import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {closeOwnerNativeObjectPages} from './owner-native-object-closure.mjs';
const [manifestInput,studioInput,apply]=process.argv.slice(2);
if(!manifestInput||!studioInput||!path.isAbsolute(manifestInput)||!path.isAbsolute(studioInput))throw new Error('Pass absolute project.json and Studio paths, optionally --apply');
const manifest=path.resolve(manifestInput),studio=path.resolve(studioInput);
const {loadProject}=await import(pathToFileURL(path.join(studio,'packages/project-kernel/src/loader.ts')));
const {validateProject}=await import(pathToFileURL(path.join(studio,'packages/project-kernel/src/validate.ts')));
const {readPageWithRevision,writePageWithRevision}=await import(pathToFileURL(path.join(studio,'packages/project-kernel/src/mutations.ts')));
const {transact}=await import(pathToFileURL(path.join(studio,'packages/editor-state/src/persistent-history.ts')));
const b=loadProject(manifest),home=readPageWithRevision(manifest,'page.home'),world=readPageWithRevision(manifest,b.pages.find(p=>p.route==='/world/').id);
const changed=closeOwnerNativeObjectPages({home:home.value,world:world.value,games:b.games,assets:b.assets});
const proposed=new Map([[home.value.id,changed.home],[world.value.id,changed.world]]),validation=validateProject({...b,pages:b.pages.map(p=>proposed.get(p.id)||p)});
if(!validation.valid)throw new Error('Object closure fails validation: '+JSON.stringify(validation.errors));
if(apply==='--apply'){
 for(const snapshot of [home,world])if(readPageWithRevision(manifest,snapshot.value.id).revision!==snapshot.revision)throw new Error('Project changed during closure; no writes made');
 transact(manifest,'Expose Home game-card objects and World whole-card navigation',()=>{for(const snapshot of [home,world])writePageWithRevision(manifest,snapshot.value.id,proposed.get(snapshot.value.id),snapshot.revision);});
}else if(apply)throw new Error('Unknown argument; only --apply writes');
console.log(JSON.stringify({mode:apply==='--apply'?'applied':'dry-run',pages:[...proposed.keys()],validation},null,2));
