const KEY='toadal.claw.feed-gulper.v7';
const LEGACY_KEYS=['toadal.claw.feed-gulper.v6','toadal.claw.feed-gulper.v5','toadal.claw.feed-gulper.v4','toadal.claw.feed-gulper.v3','toadal.claw.feed-gulper.v2','toadal.claw.feed-gulper.v1'];
export const SAVE_VERSION=7;
const SAVE_CAMPAIGN_LEVEL_COUNT=30;
const SAVE_FOOD_IDS=new Set(['strawberry','blueberry','orange','mango','pear','grapes','watermelon','pineapple_wedge','cookie','cupcake','gummy_bears','wrapped_candy_mix','pizza','burger','fries','pretzel','salmon_steak','shrimp_skewer','lemon','candy_corn']);
const SAVE_SPECIAL_IDS=new Set(['heart','bomb','syringe','magnet','time','shield','royal']);
const SAVE_CHALLENGE_IDS=new Set(['speed','time','bomb','shrink','precision','gauntlet']);
const SAVE_ACHIEVEMENT_IDS=new Set(['firstBite','bottomless','feedingFrenzy','centerClaw','deadCenter','hotStreak','unbroken','grandGulper','starFeeder','starMaster','foodCollector','specialist','campaignComplete','challengeAccepted','challengeMaster','realGamer','movingTargetMaster','longDrop','dropMaster']);

export const DEFAULT_SAVE=()=>({
  version:SAVE_VERSION,unlockedLevel:1,totalStars:0,levels:{},
  endless:{highScore:0,bestCombo:0,maxMeals:0},
  daily:{date:null,bestScore:0,stars:0,completed:false},
  challenge:{records:{}},
  realGamer:{wins:0,bestScore:0,bestMeals:0,bestCombo:0,bestAccuracy:0,bestRemaining:0,safeDumps:0,bestTimingErrorMs:null},
  longDrop:{wins:0,bestScore:0,bestMeals:0,bestCombo:0,bestAccuracy:0,bestRemaining:0,bestLandings:0,bestTimingErrorMs:null},
  stats:{runs:0,wins:0,challengeWins:0,gamerWins:0,longDropWins:0,totalScore:0,meals:0,grabs:0,perfects:0,greats:0,misses:0,deliveryMisses:0,safeDumps:0,bestCombo:0,maxStage:0,bombs:0,syringes:0,candies:0,bestAccuracy:0},
  collection:{foods:{},specials:{}},achievements:{},
  settings:{music:true,sfx:true,musicVolume:.55,sfxVolume:.72,reducedMotion:false,haptics:true,highContrast:false,colorAssist:false,campaignAssist:true},
  tutorialSeen:false,gamerTutorialSeen:false,longDropTutorialSeen:false,lastPlayedLevel:'claw001',createdAt:Date.now(),updatedAt:Date.now()
});
function number(v,fallback=0){v=Number(v);return Number.isFinite(v)?v:fallback}
function saveClamp(v,lo,hi,fallback=lo){return Math.max(lo,Math.min(hi,number(v,fallback)))}
function whole(v,lo=0,hi=Number.MAX_SAFE_INTEGER,fallback=0){return Math.floor(saveClamp(v,lo,hi,fallback))}
function bool(v,fallback=false){return typeof v==='boolean'?v:fallback}
function optionalMetric(v,lo=0,hi=60_000){if(v===null||v===undefined||v==='')return null;const n=Number(v);return Number.isFinite(n)?Math.max(lo,Math.min(hi,n)):null}
function readStorage(key){try{return localStorage.getItem(key)}catch{return null}}
function removeStorage(key){try{localStorage.removeItem(key)}catch{}}
function countMap(input,allowed){const out={};if(!input||typeof input!=='object')return out;for(const [k,v] of Object.entries(input)){if(typeof k!=='string'||!allowed.has(k))continue;const n=whole(v,0,1_000_000,0);if(n)out[k]=n}return out}
function normalizeLevelRecords(input){
  const out={};if(!input||typeof input!=='object')return out;
  for(const [id,r] of Object.entries(input)){
    const m=/^claw(\d{3})$/.exec(id);if(!m)continue;const n=Number(m[1]);if(n<1||n>SAVE_CAMPAIGN_LEVEL_COUNT||!r||typeof r!=='object')continue;
    out[id]={stars:whole(r.stars,0,3,0),bestScore:whole(r.bestScore,0,1_000_000_000,0),bestCombo:whole(r.bestCombo,0,1_000_000,0),bestMeals:whole(r.bestMeals,0,1_000_000,0),bestAccuracy:saveClamp(r.bestAccuracy,0,1,0)};
  }return out;
}
function normalizeChallengeRecords(input){
  const out={};if(!input||typeof input!=='object')return out;
  for(const [id,r] of Object.entries(input)){if(typeof id!=='string'||!SAVE_CHALLENGE_IDS.has(id)||!r||typeof r!=='object')continue;out[id]={wins:whole(r.wins,0,1_000_000,0),bestScore:whole(r.bestScore,0,1_000_000_000,0),bestMeals:whole(r.bestMeals,0,1_000_000,0),bestCombo:whole(r.bestCombo,0,1_000_000,0),bestAccuracy:saveClamp(r.bestAccuracy,0,1,0),bestRemaining:saveClamp(r.bestRemaining,0,86_400,0)}}return out;
}
export function normalizeSave(p){
  const d=DEFAULT_SAVE();p=p&&typeof p==='object'&&!Array.isArray(p)?p:{};
  const settingsIn=p.settings&&typeof p.settings==='object'?p.settings:{};
  const settings={...d.settings,music:bool(settingsIn.music,d.settings.music),sfx:bool(settingsIn.sfx,d.settings.sfx),haptics:bool(settingsIn.haptics,d.settings.haptics),reducedMotion:bool(settingsIn.reducedMotion,d.settings.reducedMotion),highContrast:bool(settingsIn.highContrast,d.settings.highContrast),colorAssist:bool(settingsIn.colorAssist,d.settings.colorAssist),campaignAssist:bool(settingsIn.campaignAssist,d.settings.campaignAssist),musicVolume:saveClamp(settingsIn.musicVolume,0,1,d.settings.musicVolume),sfxVolume:saveClamp(settingsIn.sfxVolume,0,1,d.settings.sfxVolume)};
  const st=p.stats&&typeof p.stats==='object'?p.stats:{};const stats={...d.stats};for(const k of ['runs','wins','challengeWins','gamerWins','longDropWins','totalScore','meals','grabs','perfects','greats','misses','deliveryMisses','safeDumps','bestCombo','maxStage','bombs','syringes','candies'])stats[k]=whole(st[k],0,k==='maxStage'?7:1_000_000_000,d.stats[k]);stats.bestAccuracy=saveClamp(st.bestAccuracy,0,1,d.stats.bestAccuracy);
  const en=p.endless&&typeof p.endless==='object'?p.endless:{};const endless={highScore:whole(en.highScore,0,1_000_000_000,0),bestCombo:whole(en.bestCombo,0,1_000_000,0),maxMeals:whole(en.maxMeals,0,1_000_000,0)};
  const di=p.daily&&typeof p.daily==='object'?p.daily:{};const daily={date:typeof di.date==='string'&&di.date.length<=32?di.date:null,bestScore:whole(di.bestScore,0,1_000_000_000,0),stars:whole(di.stars,0,3,0),completed:bool(di.completed,false)};
  const levels=normalizeLevelRecords(p.levels),challenge={records:normalizeChallengeRecords(p.challenge?.records)};
  const rg=p.realGamer&&typeof p.realGamer==='object'?p.realGamer:{};const realGamer={wins:whole(rg.wins,0,1_000_000,0),bestScore:whole(rg.bestScore,0,1_000_000_000,0),bestMeals:whole(rg.bestMeals,0,1_000_000,0),bestCombo:whole(rg.bestCombo,0,1_000_000,0),bestAccuracy:saveClamp(rg.bestAccuracy,0,1,0),bestRemaining:saveClamp(rg.bestRemaining,0,86_400,0),safeDumps:whole(rg.safeDumps,0,1_000_000,0),bestTimingErrorMs:optionalMetric(rg.bestTimingErrorMs)};
  const ld=p.longDrop&&typeof p.longDrop==='object'?p.longDrop:{};const longDrop={wins:whole(ld.wins,0,1_000_000,0),bestScore:whole(ld.bestScore,0,1_000_000_000,0),bestMeals:whole(ld.bestMeals,0,1_000_000,0),bestCombo:whole(ld.bestCombo,0,1_000_000,0),bestAccuracy:saveClamp(ld.bestAccuracy,0,1,0),bestRemaining:saveClamp(ld.bestRemaining,0,86_400,0),bestLandings:whole(ld.bestLandings,0,1_000_000,0),bestTimingErrorMs:optionalMetric(ld.bestTimingErrorMs)};
  const collection={foods:countMap(p.collection?.foods,SAVE_FOOD_IDS),specials:countMap(p.collection?.specials,SAVE_SPECIAL_IDS)};
  const achievements={};if(p.achievements&&typeof p.achievements==='object')for(const [k,v] of Object.entries(p.achievements))if(SAVE_ACHIEVEMENT_IDS.has(k)&&v===true)achievements[k]=true;
  const totalStars=Object.values(levels).reduce((a,x)=>a+x.stars,0);let derivedUnlock=1;for(const [id,r] of Object.entries(levels))if(r.stars>0)derivedUnlock=Math.max(derivedUnlock,Math.min(SAVE_CAMPAIGN_LEVEL_COUNT,Number(id.slice(-3))+1));
  const unlockedLevel=Math.max(derivedUnlock,whole(p.unlockedLevel,1,SAVE_CAMPAIGN_LEVEL_COUNT,1));
  const createdAt=whole(p.createdAt,0,Number.MAX_SAFE_INTEGER,Date.now());
  return {version:SAVE_VERSION,unlockedLevel,totalStars,levels,endless,daily,challenge,realGamer,longDrop,stats,collection,achievements,settings,tutorialSeen:bool(p.tutorialSeen,false),gamerTutorialSeen:bool(p.gamerTutorialSeen,false),longDropTutorialSeen:bool(p.longDropTutorialSeen,false),lastPlayedLevel:(()=>{const v=String(p.lastPlayedLevel||''),m=/^claw(\d{3})$/.exec(v);return m&&Number(m[1])>=1&&Number(m[1])<=SAVE_CAMPAIGN_LEVEL_COUNT?v:'claw001'})(),createdAt,updatedAt:Date.now()};
}
export function loadSave(){
  const raw=readStorage(KEY);
  if(raw){try{return normalizeSave(JSON.parse(raw))}catch{removeStorage(KEY)}}
  for(const key of LEGACY_KEYS){
    const legacy=readStorage(key);if(!legacy)continue;
    try{const s=normalizeSave(JSON.parse(legacy));storeSave(s);return s}catch{}
  }
  return DEFAULT_SAVE();
}
export function storeSave(save){try{save.updatedAt=Date.now();localStorage.setItem(KEY,JSON.stringify(normalizeSave(save)));return true;}catch{return false;}}
export function resetSave(){const s=DEFAULT_SAVE();storeSave(s);return s;}
export function exportSave(save){return JSON.stringify(normalizeSave(save),null,2)}
export function importSave(text){const parsed=JSON.parse(text);const s=normalizeSave(parsed);storeSave(s);return s}
function trackCollection(save,run){
  for(const [id,count] of Object.entries(run.capturedFoods||{})) save.collection.foods[id]=(save.collection.foods[id]||0)+count;
  for(const [id,count] of Object.entries(run.specials||{})) if(count) save.collection.specials[id]=(save.collection.specials[id]||0)+count;
}
export function recordRunStats(save,run){
  const s=save.stats;s.runs++;if(run.result==='complete')s.wins++;s.totalScore+=run.score;s.meals+=run.meals;s.grabs+=run.grabs;s.perfects+=run.perfects;s.greats+=run.greats;s.misses+=run.misses;s.deliveryMisses+=(run.deliveryMisses||0);s.safeDumps+=(run.safeDumps||0);s.bestCombo=Math.max(s.bestCombo,run.bestCombo);s.maxStage=Math.max(s.maxStage,run.stage);s.bombs+=run.specials?.bomb||0;s.syringes+=run.specials?.syringe||0;s.candies+=['magnet','time','shield','royal'].reduce((a,k)=>a+(run.specials?.[k]||0),0);const acc=run.grabs/(run.grabs+run.misses||1);s.bestAccuracy=Math.max(s.bestAccuracy,acc);trackCollection(save,run);unlockAchievements(save);storeSave(save);
}
export function recordCampaign(save,run,stars){
  const id=run.level.id,prev=save.levels[id]||{stars:0,bestScore:0,bestCombo:0,bestAccuracy:0};
  const accuracy=run.grabs/(run.grabs+run.misses||1);
  save.levels[id]={stars:Math.max(prev.stars||0,stars),bestScore:Math.max(prev.bestScore||0,run.score),bestCombo:Math.max(prev.bestCombo||0,run.bestCombo),bestMeals:Math.max(prev.bestMeals||0,run.meals),bestAccuracy:Math.max(prev.bestAccuracy||0,accuracy)};
  const n=Number(id.replace('claw',''))||1;save.unlockedLevel=Math.max(save.unlockedLevel,Math.min(SAVE_CAMPAIGN_LEVEL_COUNT,n+1));save.lastPlayedLevel=id;save.totalStars=Object.values(save.levels).reduce((a,x)=>a+(x.stars||0),0);recordRunStats(save,run);
}
export function recordEndless(save,run){save.endless.highScore=Math.max(save.endless.highScore,run.score);save.endless.bestCombo=Math.max(save.endless.bestCombo,run.bestCombo);save.endless.maxMeals=Math.max(save.endless.maxMeals,run.meals);recordRunStats(save,run);}
export function recordDaily(save,run,dateKey,stars){
  if(save.daily.date!==dateKey)save.daily={date:dateKey,bestScore:0,stars:0,completed:false};
  save.daily.bestScore=Math.max(save.daily.bestScore,run.score);save.daily.stars=Math.max(save.daily.stars,stars);save.daily.completed=save.daily.completed||run.result==='complete';recordRunStats(save,run);
}
export function recordChallenge(save,run){
  const id=run.challengeId||run.level.id,prev=save.challenge.records[id]||{wins:0,bestScore:0,bestMeals:0,bestCombo:0,bestAccuracy:0,bestRemaining:0};
  const accuracy=run.grabs/(run.grabs+run.misses||1),complete=run.result==='complete';
  save.challenge.records[id]={wins:prev.wins+(complete?1:0),bestScore:Math.max(prev.bestScore||0,run.score),bestMeals:Math.max(prev.bestMeals||0,run.meals),bestCombo:Math.max(prev.bestCombo||0,run.bestCombo),bestAccuracy:Math.max(prev.bestAccuracy||0,accuracy),bestRemaining:Math.max(prev.bestRemaining||0,Number.isFinite(run.remaining)?run.remaining:0)};
  if(complete)save.stats.challengeWins=(save.stats.challengeWins||0)+1;
  recordRunStats(save,run);
}
export function recordRealGamer(save,run){
  const r=save.realGamer||{wins:0,bestScore:0,bestMeals:0,bestCombo:0,bestAccuracy:0,bestRemaining:0,safeDumps:0},complete=run.result==='complete',accuracy=run.grabs/(run.grabs+run.misses||1);
  r.wins+=(complete?1:0);r.bestScore=Math.max(r.bestScore||0,run.score);r.bestMeals=Math.max(r.bestMeals||0,run.meals);r.bestCombo=Math.max(r.bestCombo||0,run.bestCombo);r.bestAccuracy=Math.max(r.bestAccuracy||0,accuracy);r.bestRemaining=Math.max(r.bestRemaining||0,Number.isFinite(run.remaining)?run.remaining:0);r.safeDumps=Math.max(r.safeDumps||0,run.safeDumps||0);if(run.bestDeliveryErrorMs!=null)r.bestTimingErrorMs=r.bestTimingErrorMs==null?run.bestDeliveryErrorMs:Math.min(r.bestTimingErrorMs,run.bestDeliveryErrorMs);save.realGamer=r;if(complete)save.stats.gamerWins=(save.stats.gamerWins||0)+1;recordRunStats(save,run);
}
export function recordLongDrop(save,run){
  const r=save.longDrop||{wins:0,bestScore:0,bestMeals:0,bestCombo:0,bestAccuracy:0,bestRemaining:0,bestLandings:0},complete=run.result==='complete',accuracy=run.grabs/(run.grabs+run.misses||1);
  r.wins+=(complete?1:0);r.bestScore=Math.max(r.bestScore||0,run.score);r.bestMeals=Math.max(r.bestMeals||0,run.meals);r.bestCombo=Math.max(r.bestCombo||0,run.bestCombo);r.bestAccuracy=Math.max(r.bestAccuracy||0,accuracy);r.bestRemaining=Math.max(r.bestRemaining||0,Number.isFinite(run.remaining)?run.remaining:0);r.bestLandings=Math.max(r.bestLandings||0,run.longDropLandings||0);if(run.bestDeliveryErrorMs!=null)r.bestTimingErrorMs=r.bestTimingErrorMs==null?run.bestDeliveryErrorMs:Math.min(r.bestTimingErrorMs,run.bestDeliveryErrorMs);save.longDrop=r;if(complete)save.stats.longDropWins=(save.stats.longDropWins||0)+1;recordRunStats(save,run);
}
export function unlockAchievements(save){
  const a=save.achievements,s=save.stats;
  if(s.meals>=1)a.firstBite=true;if(s.meals>=50)a.bottomless=true;if(s.meals>=250)a.feedingFrenzy=true;
  if(s.perfects>=25)a.centerClaw=true;if(s.perfects>=100)a.deadCenter=true;
  if(s.bestCombo>=10)a.hotStreak=true;if(s.bestCombo>=20)a.unbroken=true;if(s.maxStage>=7)a.grandGulper=true;
  if(save.totalStars>=45)a.starFeeder=true;if(save.totalStars>=75)a.starMaster=true;
  if(Object.keys(save.collection.foods).length>=SAVE_FOOD_IDS.size)a.foodCollector=true;
  if(Object.keys(save.collection.specials).length>=SAVE_SPECIAL_IDS.size)a.specialist=true;
  if(save.levels.claw030?.stars)a.campaignComplete=true;
  const challengeRecords=Object.values(save.challenge?.records||{});if(challengeRecords.some(x=>(x.wins||0)>0))a.challengeAccepted=true;if(challengeRecords.filter(x=>(x.wins||0)>0).length>=6)a.challengeMaster=true;if((save.realGamer?.wins||0)>0)a.realGamer=true;if((save.realGamer?.bestCombo||0)>=15)a.movingTargetMaster=true;if((save.longDrop?.wins||0)>0)a.longDrop=true;if((save.longDrop?.bestLandings||0)>=20)a.dropMaster=true;
}
