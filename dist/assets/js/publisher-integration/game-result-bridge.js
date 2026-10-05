(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ToadalGameResultBridge=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function normalizeScore(v){return Number.isSafeInteger(v)&&v>=0?v:null;}
function attach(root,controller){
  const shell=root?.document?.querySelector?.('[data-player-shell]'),frame=shell?.querySelector?.('[data-player-frame]');
  if(!shell||!frame||shell.getAttribute('data-game-id')!=='wicked-bites')return{attached:false};
  const seen=new Set();
  const handler=event=>{
    const d=event?.detail;
    if(!d||d.gameId!=='wicked-bites'||d.frame!==frame||!frame.isConnected||d.source!=='website-preview-session'||typeof d.completionId!=='string'||!/^website-run-[1-9][0-9]*$/.test(d.completionId)||seen.has(d.completionId))return;
    const score=normalizeScore(d.score);if(score===null||!Number.isSafeInteger(d.durationMs)||d.durationMs<0||d.durationMs>86400000)return;
    seen.add(d.completionId);if(seen.size>1000)seen.delete(seen.values().next().value);
    Promise.resolve().then(()=>controller.track('arcade_run_completed',{score,durationMs:d.durationMs})).catch(()=>{});
    const mode=controller?.config?.leaderboardModes?.[d.gameId];
    if(mode && controller.permits('globalLeaderboardsSubmit'))Promise.resolve().then(()=>controller.submitScore({mode,score},{eligible:true,source:'validated-game-complete'})).catch(()=>{});
  };
  root.addEventListener('toadal:validated-game-complete',handler);
  return{attached:true,detach:()=>root.removeEventListener('toadal:validated-game-complete',handler)};
}
return{attach,normalizeScore};});
