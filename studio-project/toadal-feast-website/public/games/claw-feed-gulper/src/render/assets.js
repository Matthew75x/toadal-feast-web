export const foodPath=id=>`assets/foods/${id}.png`;
export const gulperStagePath=stage=>`assets/gulper/stages/gulper_stage_${stage}.png`;
export const gulperEatPath=stage=>`assets/gulper/feeding/gulper_stage_${stage}_eat_8f_450.png`;
export const gulperBlinkPath=stage=>`assets/gulper/stages/gulper_stage_${stage}_blink.png`;
export const specialPath=id=>`assets/specials/${id}.png`;
export const uiPath=id=>`assets/ui/${id}`;
const pendingLoads=new Map();
export function loadAsset(map,src){
  if(map.has(src))return Promise.resolve(map.get(src));
  let pending=pendingLoads.get(src);
  if(!pending){
    pending=new Promise(resolve=>{const img=new Image();img.decoding='async';img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=src;}).finally(()=>pendingLoads.delete(src));
    pendingLoads.set(src,pending);
  }
  return pending.then(img=>{if(img)map.set(src,img);return img});
}

export function retainGulperEatingStages(map,stages=[]){
  const keep=new Set(stages.filter(Number.isInteger).filter(x=>x>=0&&x<8).map(gulperEatPath));
  for(const key of [...map.keys()]) if(key.includes('/gulper/feeding/')&&!keep.has(key)) map.delete(key);
}

export async function preloadAssets(foodIds,specialIds=[]){
  // Mobile memory lock: preload the cabinet and static Gulper frames, but decode eating sheets lazily per growth stage.
  const paths=[...foodIds.map(foodPath),...specialIds.map(specialPath),...Array.from({length:8},(_,i)=>gulperStagePath(i)),...Array.from({length:8},(_,i)=>gulperBlinkPath(i)),gulperEatPath(0),uiPath('background.webp'),uiPath('star-fill.png'),uiPath('star-empty.png')];
  const map=new Map();await Promise.all(paths.map(src=>loadAsset(map,src)));return map;
}
