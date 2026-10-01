import { createSeededRng } from '../engine/vendor/sse/seeded-rng.js';
import { LEVELS, CHALLENGES, REAL_GAMER_MODE, LONG_DROP_MODE } from '../generated/runtime-content.js';

export { LEVELS, CHALLENGES, REAL_GAMER_MODE, LONG_DROP_MODE };
export const LOGICAL_WIDTH = 720;
export const LOGICAL_HEIGHT = 900;
export const REAL_GAMER_WORLD_WIDTH = REAL_GAMER_MODE.worldWidth;
export const STANDARD_WORLD_WIDTH = LOGICAL_WIDTH;
export const REAL_GAMER_DELIVERY_GRACE = 1.25;
export const LONG_DROP_DELIVERY_GRACE = 1.25;
export const CAMPAIGN_LEVEL_COUNT = LEVELS.length;
export const GULPER_STAGE_THRESHOLDS = Object.freeze([0, 2, 4, 7, 10, 14, 19, 25]);
export const FOOD_IDS = Object.freeze([
  'strawberry','blueberry','orange','mango','pear','grapes','watermelon','pineapple_wedge',
  'cookie','cupcake','gummy_bears','wrapped_candy_mix','pizza','burger','fries','pretzel',
  'salmon_steak','shrimp_skewer','lemon','candy_corn'
]);
export const SPECIAL_IDS = Object.freeze(['heart','bomb','syringe','magnet','time','shield','royal']);
export const CAMPAIGN_ASSIST_MAX = 8;

const SMALL = new Set(['blueberry','lemon','candy_corn']);
const LARGE = new Set(['pizza','burger','watermelon']);
const CANDIES = ['magnet','time','shield','royal'];
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));

export function stageForMeals(meals){
  let stage=0;
  for(let i=1;i<GULPER_STAGE_THRESHOLDS.length;i++) if(meals>=GULPER_STAGE_THRESHOLDS[i]) stage=i;
  return stage;
}
export function nextStageAt(meals){
  for(const n of GULPER_STAGE_THRESHOLDS) if(n>meals) return n;
  return GULPER_STAGE_THRESHOLDS.at(-1);
}
export function growthProgress(meals){
  const stage=stageForMeals(meals);
  if(stage>=GULPER_STAGE_THRESHOLDS.length-1)return 1;
  const lo=GULPER_STAGE_THRESHOLDS[stage],hi=GULPER_STAGE_THRESHOLDS[stage+1];
  return clamp((meals-lo)/(hi-lo),0,1);
}
export function targetScaleForMeals(meals){ return clamp(.82+meals*.016,.82,1.34); }
export function dailySeedFromDate(dateKey){
  let h=2166136261>>>0;
  for(const ch of String(dateKey)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}
  return h>>>0;
}
function dynamicLevel(kind,challengeId){
  if(kind==='gamer') return REAL_GAMER_MODE;
  if(kind==='long-drop') return LONG_DROP_MODE;
  if(kind==='daily') return {id:'daily',name:'Daily Feed',chapter:0,targetMeals:16,time:92,hearts:3,sweepSpeed:1.30,tolerance:30,favorite:'strawberry',perfectTarget:4,comboTarget:6,favoriteTarget:2,specialRates:{bomb:.08,syringe:.035,heart:.04,candy:.10},theme:'daily',difficulty:4,shrinkMeals:3,description:'A fresh seeded challenge for today.',tip:'Everyone gets the same cabinet seed today.'};
  if(kind==='challenge') return CHALLENGES.find(x=>x.id===challengeId)||CHALLENGES[0];
  return {id:'endless',name:'Endless Feed',chapter:0,targetMeals:Infinity,time:Infinity,hearts:3,sweepSpeed:.94,tolerance:37,favorite:null,specialRates:{bomb:.055,syringe:.035,heart:.035,candy:.07},theme:'endless',difficulty:2,shrinkMeals:4,description:'Keep feeding until the cabinet wins.',tip:'Speed and danger climb every seven meals.'};
}
function rollItemKind(rng,level){
  const rates=level.specialRates||{};
  const r=rng();
  const bomb=Number(rates.bomb||0), syringe=Number(rates.syringe||0), heart=Number(rates.heart||0), candy=Number(rates.candy||0);
  if(r<bomb) return 'bomb';
  if(r<bomb+syringe) return 'syringe';
  if(r<bomb+syringe+heart) return 'heart';
  if(r<bomb+syringe+heart+candy) return CANDIES[Math.floor(rng()*CANDIES.length)];
  return 'food';
}
function makeFoodItem(rng,index,level,forcedId=null){
  const id=forcedId||FOOD_IDS[Math.floor(rng()*FOOD_IDS.length)];
  const width=SMALL.has(id)?32:LARGE.has(id)?46:38,worldWidth=Number(level.worldWidth||LOGICAL_WIDTH),margin=68;
  return {uid:`food-${index}-${Math.floor(rng()*1e8)}`,kind:'food',id,x:margin+rng()*Math.max(100,worldWidth-margin*2),y:365+rng()*128,width,value:100,bobPhase:rng()*Math.PI*2};
}
function makeItem(rng,index,level){
  const kind=rollItemKind(rng,level);
  if(kind==='food') return makeFoodItem(rng,index,level);
  const worldWidth=Number(level.worldWidth||LOGICAL_WIDTH),margin=68;return {uid:`item-${index}-${Math.floor(rng()*1e8)}`,kind,id:kind,x:margin+rng()*Math.max(100,worldWidth-margin*2),y:365+rng()*128,width:kind==='bomb'?44:kind==='syringe'?42:40,value:kind==='bomb'||kind==='syringe'?0:125,bobPhase:rng()*Math.PI*2};
}
function spreadItems(run){
  const ordered=[...run.items].sort((a,b)=>a.x-b.x);
  for(let i=1;i<ordered.length;i++){
    const minGap=58;
    if(ordered[i].x-ordered[i-1].x<minGap)ordered[i].x=Math.min((run.worldWidth||LOGICAL_WIDTH)-68,ordered[i-1].x+minGap);
  }
  for(let i=ordered.length-2;i>=0;i--) if(ordered[i+1].x-ordered[i].x<52)ordered[i].x=Math.max(68,ordered[i+1].x-52);
}
function ensureCabinet(run){
  const foodCount=run.items.filter(x=>x.kind==='food').length;
  for(let i=foodCount;i<4;i++){
    const idx=run.items.findIndex(x=>x.kind!=='food');if(idx<0)break;run.items[idx]=makeFoodItem(run.rng,run.spawnSerial++,run.level);
  }
  if(run.level.favoriteTarget&&run.favorites<run.level.favoriteTarget&&!run.items.some(x=>x.kind==='food'&&x.id===run.level.favorite)){
    const idx=run.items.findIndex(x=>x.kind==='food'&&x.id!==run.level.favorite);
    if(idx>=0)run.items[idx]=makeFoodItem(run.rng,run.spawnSerial++,run.level,run.level.favorite);
  }
  spreadItems(run);
}
function refill(run){run.items.push(makeItem(run.rng,run.spawnSerial++,run.level));ensureCabinet(run);}

export function createRun({levelId='claw001',seed=0xC1A0,endless=false,daily=false,challengeId=null,realGamer=false,longDrop=false,campaignAssist=true}={}){
  const challenge=!!challengeId;
  const level=longDrop?dynamicLevel('long-drop'):realGamer?dynamicLevel('gamer'):endless?dynamicLevel('endless'):daily?dynamicLevel('daily'):challenge?dynamicLevel('challenge',challengeId):(LEVELS.find(l=>l.id===levelId)||LEVELS[0]);
  const rng=createSeededRng(seed>>>0);
  const run={
    level,seed:seed>>>0,rng,endless,daily,challenge,realGamer,longDrop,challengeId:challenge?level.id:null,worldWidth:Number(level.worldWidth||LOGICAL_WIDTH),elapsed:0,timeBonus:0,remaining:level.time,deliveryOvertime:0,
    score:0,meals:0,hearts:level.hearts,combo:0,bestCombo:0,perfects:0,greats:0,grabs:0,misses:0,favorites:0,
    stage:0,targetScale:targetScaleForMeals(0),clawX:Number(level.worldWidth||LOGICAL_WIDTH)/2,sweepPhase:rng()*Math.PI*2,state:'idle',result:'playing',
    gulperX:Number(level.worldWidth||LOGICAL_WIDTH)/2,gulperDir:rng()>.5?1:-1,gulperFrozen:false,deliveryMisses:0,safeDumps:0,longDropLandings:0,
    campaignAssist:!!campaignAssist&&!endless&&!daily&&!challenge&&!realGamer&&!longDrop,assistBonus:0,assistNearMisses:0,
    deliveryAttempts:0,deliveryErrorTotalMs:0,bestDeliveryErrorMs:null,lastDeliveryFeedback:null,
    items:Array.from({length:7},(_,i)=>makeItem(rng,i,level)),spawnSerial:7,heldItem:null,lastGrade:null,lastFeedEvent:null,
    effects:{magnetDrops:0,shield:0,royalMeals:0},specials:{heart:0,bomb:0,syringe:0,magnet:0,time:0,shield:0,royal:0},capturedFoods:{}
  };ensureCabinet(run);return run;
}
export function currentGulperSpeed(run){
  if(!(run?.realGamer||run?.longDrop))return 0;
  const stageSlow=Math.max(.58,1-run.stage*.055),rush=run.longDrop?1:(1+Math.min(.30,run.combo*.018));
  return Number(run.level.gulperSpeed||180)*stageSlow*rush;
}
export function predictGulperX(run,seconds){
  if(!(run?.realGamer||run?.longDrop))return run?.gulperX??LOGICAL_WIDTH/2;
  let x=Number(run.gulperX),dir=run.gulperDir>=0?1:-1,remaining=Math.max(0,Number(seconds)||0),speed=currentGulperSpeed(run),margin=82+run.stage*4,lo=margin,hi=run.worldWidth-margin;
  for(let guard=0;guard<12&&remaining>1e-7;guard++){const boundary=dir>0?hi:lo,dist=Math.abs(boundary-x),t=dist/Math.max(1e-6,speed);if(t>=remaining){x+=dir*speed*remaining;remaining=0}else{x=boundary;remaining-=t;dir*=-1}}
  return clamp(x,lo,hi);
}
export function sweepSpeed(run){
  if(!run.endless) return run.level.sweepSpeed;
  return Math.min(2.28,run.level.sweepSpeed+Math.floor(run.meals/7)*.095);
}
export function tolerance(run){
  let t=run.endless?Math.max(17,run.level.tolerance-Math.floor(run.meals/7)*1.45):run.level.tolerance;
  if(run.effects.magnetDrops>0) t+=18;
  if(run.campaignAssist) t+=Math.min(CAMPAIGN_ASSIST_MAX,Math.max(0,run.assistBonus||0));
  return t;
}
export function stepRun(run,dt){
  if(run.result!=='playing') return run;
  run.elapsed+=dt;
  if(Number.isFinite(run.level.time)){
    run.remaining=Math.max(0,run.level.time+run.timeBonus-run.elapsed);
    if(run.remaining<=0&&!levelComplete(run)){
      if(run.state==='delivery'){
        run.deliveryOvertime+=dt;
        const grace=run.longDrop?LONG_DROP_DELIVERY_GRACE:REAL_GAMER_DELIVERY_GRACE;
        if(run.deliveryOvertime>=grace) run.result='failed';
      } else if(run.state==='idle') run.result='failed';
    } else run.deliveryOvertime=0;
  }
  if((run.realGamer||run.longDrop)&&!run.gulperFrozen){
    const speed=currentGulperSpeed(run);
    run.gulperX+=run.gulperDir*speed*dt;const margin=82+run.stage*4;
    if(run.gulperX<=margin){run.gulperX=margin;run.gulperDir=1}else if(run.gulperX>=run.worldWidth-margin){run.gulperX=run.worldWidth-margin;run.gulperDir=-1}
  }
  if(run.state==='idle'){
    run.sweepPhase+=dt*sweepSpeed(run);
    const half=run.worldWidth/2,amp=Math.max(292,half-68);run.clawX=half+amp*Math.sin(run.sweepPhase);
  }
  return run;
}
export function evaluateGrab(run){
  const tol=tolerance(run); let best=null,dist=Infinity,nearest=Infinity;
  for(const item of run.items){
    const d=Math.abs(item.x-run.clawX), effective=tol+item.width*.20;nearest=Math.min(nearest,d);
    if(d<=effective&&d<dist){best=item;dist=d;}
  }
  if(!best) return {hit:false,grade:'MISS',distance:Infinity,nearestDistance:nearest,item:null,food:null};
  const ratio=dist/Math.max(1,tol); const grade=ratio<=.22?'PERFECT':ratio<=.55?'GREAT':'GRAB';
  return {hit:true,grade,distance:dist,nearestDistance:nearest,item:best,food:best};
}
export function commitGrab(run,evaluation){
  if(run.result!=='playing') return run;
  if(run.effects.magnetDrops>0) run.effects.magnetDrops--;
  if(!evaluation.hit){
    run.misses++;run.combo=0;run.lastGrade='MISS';
    if(run.campaignAssist&&Number.isFinite(evaluation.nearestDistance)&&evaluation.nearestDistance<=Math.max(54,tolerance(run)*1.65)){run.assistNearMisses++;run.assistBonus=Math.min(CAMPAIGN_ASSIST_MAX,(run.assistBonus||0)+2);}
    if(run.effects.shield>0){run.effects.shield--;run.lastFeedEvent={kind:'shield-save'};return run;}
    run.hearts=Math.max(0,run.hearts-1);run.lastFeedEvent={kind:'miss'};
    if(run.hearts<=0) run.result='failed';
    return run;
  }
  if(run.campaignAssist&&run.assistBonus>0)run.assistBonus=Math.max(0,run.assistBonus-1);
  const item=evaluation.item;
  run.heldItem=item;run.items=run.items.filter(x=>x.uid!==item.uid);run.lastGrade=evaluation.grade;
  run.grabs++;run.combo++;run.bestCombo=Math.max(run.bestCombo,run.combo);
  if(evaluation.grade==='PERFECT')run.perfects++; if(evaluation.grade==='GREAT')run.greats++;
  return run;
}
export function gulperCatchRadius(run){if(run.longDrop)return Math.min(150,70+run.stage*11);return run.realGamer?Math.min(150,62+run.stage*12):150}

export function longDropFallTime(run){return run?.longDrop?Number(run.level.fallTime||1.18):0}
export function longDropDistance(run){return run?.longDrop?Number(run.level.dropDistance||620):0}

export function evaluateDelivery(run,releaseX=run.clawX){
  const radius=gulperCatchRadius(run),distance=Math.abs(Number(releaseX)-run.gulperX),speed=Math.max(1,currentGulperSpeed(run)),timingErrorMs=(run.realGamer||run.longDrop)?distance/speed*1000:0;
  return {hit:distance<=radius,distance,radius,gulperX:run.gulperX,releaseX:Number(releaseX),timingErrorMs};
}
export function trackDelivery(run,evaluation){
  if(!(run?.realGamer||run?.longDrop)||!evaluation)return evaluation;
  const ms=Math.max(0,Number(evaluation.timingErrorMs)||0);run.deliveryAttempts++;run.deliveryErrorTotalMs+=ms;run.bestDeliveryErrorMs=run.bestDeliveryErrorMs==null?ms:Math.min(run.bestDeliveryErrorMs,ms);
  run.lastDeliveryFeedback={hit:!!evaluation.hit,distance:evaluation.distance,radius:evaluation.radius,timingErrorMs:ms,releaseX:evaluation.releaseX,gulperX:evaluation.gulperX};return evaluation;
}
export function averageDeliveryErrorMs(run){return run?.deliveryAttempts?run.deliveryErrorTotalMs/run.deliveryAttempts:0}
export function discardHeldItem(run,{safeHazard=false}={}){
  const item=run.heldItem;if(!item)return run;const hazard=item.kind==='bomb'||item.kind==='syringe';
  if(hazard&&safeHazard){run.specials[item.kind]++;run.safeDumps++;run.score+=90;run.lastFeedEvent={kind:'safe-dump',id:item.kind};}
  else {run.deliveryMisses++;run.misses++;run.combo=0;if(run.effects.shield>0){run.effects.shield--;run.lastFeedEvent={kind:'shield-delivery'};}else{run.hearts=Math.max(0,run.hearts-1);run.lastFeedEvent={kind:'delivery-miss'};if(run.hearts<=0)run.result='failed';}}
  run.heldItem=null;refill(run);return run;
}
export function feedHeldFood(run){
  const item=run.heldItem;if(!item)return run;
  run.lastFeedEvent=null;
  if(item.kind==='bomb'){
    run.specials.bomb++;run.combo=0;
    if(run.effects.shield>0){run.effects.shield--;run.lastFeedEvent={kind:'shield-bomb'};}
    else {run.hearts=Math.max(0,run.hearts-1);run.lastFeedEvent={kind:'bomb'};if(run.hearts<=0)run.result='failed';}
  } else if(item.kind==='syringe'){
    run.specials.syringe++;run.combo=0;
    if(run.effects.shield>0){run.effects.shield--;run.lastFeedEvent={kind:'shield-syringe'};}
    else {
      const before=run.meals,loss=Math.min(before,Math.max(1,run.level.shrinkMeals||4));
      run.meals=Math.max(0,before-loss);run.stage=stageForMeals(run.meals);run.targetScale=targetScaleForMeals(run.meals);run.score=Math.max(0,run.score-150);
      run.lastFeedEvent={kind:'syringe',loss};
    }
  } else if(item.kind==='heart'){
    run.specials.heart++;run.hearts=Math.min(Math.max(3,run.level.hearts),run.hearts+1);run.score+=150;run.lastFeedEvent={kind:'heart'};
  } else if(CANDIES.includes(item.kind)){
    run.specials[item.kind]++;run.score+=200;run.lastFeedEvent={kind:item.kind};
    if(item.kind==='magnet')run.effects.magnetDrops+=3;
    if(item.kind==='time'&&Number.isFinite(run.remaining)){run.timeBonus+=8;run.remaining+=8;}
    if(item.kind==='shield')run.effects.shield=Math.min(2,run.effects.shield+1);
    if(item.kind==='royal')run.effects.royalMeals+=3;
  } else {
    const gradeMul=run.lastGrade==='PERFECT'?1.8:run.lastGrade==='GREAT'?1.35:1;
    const comboMul=1+Math.min(1.6,Math.max(0,run.combo-1)*.10);
    const royal=run.effects.royalMeals>0?2:1;if(run.effects.royalMeals>0)run.effects.royalMeals--;
    const favorite=item.id===run.level.favorite,favoriteMul=favorite?1.25:1,scoreGain=Math.round(item.value*gradeMul*comboMul*royal*favoriteMul);
    run.score+=scoreGain;run.meals+=royal;
    if(favorite)run.favorites++;if(run.longDrop)run.longDropLandings++;run.capturedFoods[item.id]=(run.capturedFoods[item.id]||0)+1;
    run.stage=stageForMeals(run.meals);run.targetScale=targetScaleForMeals(run.meals);run.lastFeedEvent={kind:'food',id:item.id,royal:royal>1,favorite,favoriteBonus:favorite,scoreGain,mealGain:royal,grade:run.lastGrade,combo:run.combo};
  }
  run.heldItem=null;refill(run);
  if(!run.endless&&levelComplete(run))run.result='complete';
  return run;
}
export function levelComplete(run){
  const l=run.level;
  if(run.meals<l.targetMeals)return false;
  // Campaign is the learnable path: meals clear the level; authored skill goals earn stars.
  // Daily and every mastery mode are strict exams and require every listed objective.
  const strict=!!(run.daily||run.challenge||run.realGamer||run.longDrop);
  if(!strict)return true;
  if(l.perfectTarget&&run.perfects<l.perfectTarget)return false;
  if(l.comboTarget&&run.bestCombo<l.comboTarget)return false;
  if(l.favoriteTarget&&run.favorites<l.favoriteTarget)return false;
  return true;
}
export function objectiveProgress(run){
  const l=run.level,isCampaign=!(run.endless||run.daily||run.challenge||run.realGamer||run.longDrop);
  const meal=`${run.meals}/${Number.isFinite(l.targetMeals)?l.targetMeals:'∞'} meals`;
  if(!isCampaign){
    const bits=[meal];
    if(l.perfectTarget)bits.push(`${run.perfects}/${l.perfectTarget} perfect`);
    if(l.comboTarget)bits.push(`best x${run.bestCombo}/${l.comboTarget}`);
    if(l.favoriteTarget)bits.push(`${run.favorites}/${l.favoriteTarget} favorite`);
    return bits;
  }
  const bonus=[];
  if(l.perfectTarget)bonus.push(`${run.perfects}/${l.perfectTarget} perfect`);
  if(l.comboTarget)bonus.push(`x${run.bestCombo}/${l.comboTarget}`);
  if(l.favoriteTarget)bonus.push(`${run.favorites}/${l.favoriteTarget} fav`);
  return [`CLEAR ${meal}`,...(bonus.length?[`STAR BONUS ${bonus.join(' / ')}`]:[])];
}
export function starRating(run){
  if(run.result!=='complete')return 0;
  const l=run.level,accuracy=run.grabs/(run.grabs+run.misses||1),checks=[];
  if(l.perfectTarget)checks.push(run.perfects>=l.perfectTarget);
  if(l.comboTarget)checks.push(run.bestCombo>=l.comboTarget);
  if(l.favoriteTarget)checks.push(run.favorites>=l.favoriteTarget);
  if(!checks.length){
    let stars=1;
    if(accuracy>=.78&&run.bestCombo>=Math.min(4,l.targetMeals))stars++;
    if(accuracy>=.92&&run.perfects>=Math.max(2,Math.ceil(l.targetMeals*.25)))stars++;
    return stars;
  }
  const met=checks.filter(Boolean).length;
  let stars=1;
  if(met>=Math.ceil(checks.length/2))stars=2;
  if(met===checks.length&&accuracy>=.85)stars=3;
  return stars;
}
export function snapshot(run){
  return {levelId:run.level.id,challengeId:run.challengeId,realGamer:run.realGamer,longDrop:run.longDrop,seed:run.seed,score:run.score,meals:run.meals,hearts:run.hearts,combo:run.combo,bestCombo:run.bestCombo,perfects:run.perfects,greats:run.greats,grabs:run.grabs,misses:run.misses,deliveryMisses:run.deliveryMisses,safeDumps:run.safeDumps,longDropLandings:run.longDropLandings,favorites:run.favorites,stage:run.stage,gulperX:Number(run.gulperX.toFixed(3)),worldWidth:run.worldWidth,result:run.result,remaining:Number.isFinite(run.remaining)?Number(run.remaining.toFixed(3)):null,deliveryOvertime:Number((run.deliveryOvertime||0).toFixed(3)),assistBonus:run.assistBonus||0,deliveryAttempts:run.deliveryAttempts||0,averageDeliveryErrorMs:Number(averageDeliveryErrorMs(run).toFixed(2)),bestDeliveryErrorMs:run.bestDeliveryErrorMs==null?null:Number(run.bestDeliveryErrorMs.toFixed(2)),effects:{...run.effects},rngState:run.rng.getState()};
}
