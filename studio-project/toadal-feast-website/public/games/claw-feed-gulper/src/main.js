import {
  createRun, stepRun, evaluateGrab, commitGrab, feedHeldFood, evaluateDelivery, discardHeldItem, starRating, objectiveProgress,
  dailySeedFromDate, LEVELS, FOOD_IDS, SPECIAL_IDS, LOGICAL_WIDTH, LOGICAL_HEIGHT,
  CAMPAIGN_LEVEL_COUNT, GULPER_STAGE_THRESHOLDS, growthProgress, nextStageAt, CHALLENGES, REAL_GAMER_MODE, LONG_DROP_MODE, longDropFallTime,
  predictGulperX, trackDelivery, averageDeliveryErrorMs
} from './game/claw-core.js';
import {
  loadSave, storeSave, resetSave, exportSave, importSave,
  recordCampaign, recordEndless, recordDaily, recordChallenge, recordRealGamer, recordLongDrop, recordRunStats
} from './platform/save.js';
import { playSfx, startMusic, setMusic, setMusicVolume, setMusicIntensity, setMusicScene, setMusicPaused } from './platform/audio.js';
import { preloadAssets, loadAsset, retainGulperEatingStages, foodPath, specialPath, gulperStagePath, gulperBlinkPath, gulperEatPath, uiPath } from './render/assets.js';

const $=id=>document.getElementById(id);
const canvas=$('gameCanvas'),ctx=canvas.getContext('2d',{alpha:false,desynchronized:true})||canvas.getContext('2d');
const screens={menu:$('menu'),levels:$('levelSelect'),challenges:$('challengeSelect'),collection:$('collection'),play:$('gameWrap'),result:$('result')};
const CHAPTERS={
  1:{name:'FIRST FEAST',subtitle:'Learn the machine',theme:'berry'},
  2:{name:'TRICKY TREATS',subtitle:'Bombs and second chances',theme:'bakery'},
  3:{name:'JEWELED CABINET',subtitle:'Master the Ability Candies',theme:'candy'},
  4:{name:'SPEED FEAST',subtitle:'Precision under pressure',theme:'night'},
  5:{name:'GRAND APPETITE',subtitle:'The final buffet',theme:'royal'}
};
const ACHIEVEMENTS={
  firstBite:['First Bite','Feed Gulper once.'],bottomless:['Bottomless','Feed 50 lifetime meals.'],feedingFrenzy:['Feeding Frenzy','Feed 250 lifetime meals.'],
  centerClaw:['Center Claw','Land 25 PERFECT grabs.'],deadCenter:['Dead Center','Land 100 PERFECT grabs.'],hotStreak:['Hot Streak','Reach a 10x streak.'],
  unbroken:['Unbroken','Reach a 20x streak.'],grandGulper:['Grand Gulper','Reach growth stage 8.'],starFeeder:['Star Feeder','Earn 45 campaign stars.'],
  starMaster:['Star Master','Earn 75 campaign stars.'],foodCollector:['Pantry Full','Discover every food.'],specialist:['Cabinet Expert','Capture every special item.'],campaignComplete:['The Grand Feast','Finish level 30.'],
  challengeAccepted:['Challenge Accepted','Clear any Challenge cabinet.'],challengeMaster:['Cabinet Master','Clear all six Challenge cabinets.'],
  realGamer:['REAL GAMER','Clear REAL GAMER MODE.'],movingTargetMaster:['Moving Target Master','Reach a 15x streak in REAL GAMER MODE.'],
  longDrop:['LONG DROP','Clear LONG DROP MODE.'],dropMaster:['Drop Master','Land 20 long-drop meals in one run.']
};

let save=loadSave(),assets=new Map(),run=null,mode='menu',paused=false,resultRecorded=false,lastUnlocked=save.unlockedLevel;
let anim={phase:'idle',t:0,item:null,dropX:LOGICAL_WIDTH/2,grade:null,gulperScale:.82,reaction:'',reactionT:0,shake:0,stageUp:false,stageDown:false,cameraX:0,deliveryHit:false};
let last=performance.now(),renderLast=performance.now(),accumulator=0,viewport={scale:1,offsetX:0,offsetY:0},particles=[],floaters=[],toastTimer=null,modalResume=false,countdownRemaining=0,briefingReturn='menu',briefingReturnRun=null,briefingReturnRecorded=false,coachActive=false;
const FIXED=1/60,MAX_STEPS=5;
const todayKey=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const pretty=s=>String(s).replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
const INTERACTIVE_KEY_SELECTOR='button,input,select,textarea,a,summary,[role=\"button\"]';
const img=src=>assets.get(src);
const safeShowModal=dialog=>{if(dialog&&!dialog.open){dialog.scrollTop=0;try{dialog.showModal();dialog.scrollTop=0}catch{}}};
const safeCloseDialog=dialog=>{if(dialog?.open)dialog.close()};
const keyTargetsControl=target=>target instanceof Element&&!!target.closest(INTERACTIVE_KEY_SELECTOR);
const runAccuracy=()=>run?run.grabs/(run.grabs+run.misses||1):0;
const sfx=(name,pitch=1)=>playSfx(name,save.settings.sfx,save.settings.sfxVolume,pitch);

function activateAudio(){if(save.settings.music)startMusic(true,save.settings.musicVolume)}
function applyVisualSettings(){document.body.classList.toggle('high-contrast',!!save.settings.highContrast);document.body.classList.toggle('color-assist',!!save.settings.colorAssist);document.body.classList.toggle('reduced-motion',!!save.settings.reducedMotion)}
function haptic(pattern=10){if(save.settings.haptics&&navigator.vibrate)navigator.vibrate(pattern)}
function toast(text){const el=$('toast');el.textContent=text;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),1450)}
function resize(){
  const r=canvas.getBoundingClientRect(),cap=r.width<=340?1.35:r.width<=480?1.5:2,dpr=Math.min(window.devicePixelRatio||1,cap);
  canvas.width=Math.max(1,Math.floor(r.width*dpr));canvas.height=Math.max(1,Math.floor(r.height*dpr));
  const s=Math.min(canvas.width/LOGICAL_WIDTH,canvas.height/LOGICAL_HEIGHT);
  viewport={scale:s,offsetX:(canvas.width-LOGICAL_WIDTH*s)/2,offsetY:(canvas.height-LOGICAL_HEIGHT*s)/2};
}
window.addEventListener('resize',resize,{passive:true});window.visualViewport?.addEventListener('resize',resize,{passive:true});

function setMode(next){
  mode=next;Object.entries(screens).forEach(([k,el])=>el.hidden=k!==next);if(next!=='play'){countdownRemaining=0;$('coachHint').hidden=true;$('countdown').classList.remove('show');$('countdown').textContent='';clearTimeout(toastTimer);$('toast').classList.remove('show');$('toast').textContent='';}
  if(next==='menu'){setMusicScene('menu');renderMenu()}if(next==='levels')renderLevels();if(next==='challenges')renderChallenges();if(next==='collection')renderCollection();if(next==='result')setMusicScene('result');
  $('gameWrap').classList.toggle('challenge-active',next==='play'&&!!run?.challenge);$('gameWrap').classList.toggle('gamer-active',next==='play'&&!!run?.realGamer);$('gameWrap').classList.toggle('long-drop-active',next==='play'&&!!run?.longDrop);
  requestAnimationFrame(resize);
}
function currentCampaignChapter(){return Math.min(5,Math.ceil(Math.min(CAMPAIGN_LEVEL_COUNT,save.unlockedLevel)/6))}
function renderMenu(){
  const menuStage=Math.min(7,Math.floor((save.stats?.meals||0)/32));$('menuGulper').src=gulperStagePath(menuStage);
  $('menuStars').textContent=save.totalStars;$('menuLevel').textContent=Math.min(CAMPAIGN_LEVEL_COUNT,save.unlockedLevel);$('menuChapter').textContent=currentCampaignChapter();
  const next=Math.min(CAMPAIGN_LEVEL_COUNT,save.unlockedLevel),finished=!!save.levels[`claw${String(CAMPAIGN_LEVEL_COUNT).padStart(3,'0')}`]?.stars;
  $('continueBtn').textContent=finished?'REPLAY GRAND GULPER':`CONTINUE · LEVEL ${next}`;
  const ch=CHAPTERS[currentCampaignChapter()];$('menuCampaignTitle').textContent=finished?'CAMPAIGN COMPLETE':ch.name;
  const pct=Math.round((save.totalStars/(CAMPAIGN_LEVEL_COUNT*3))*100);$('menuCampaignPct').textContent=`${pct}%`;$('menuCampaignBar').style.width=`${pct}%`;
  const d=save.daily.date===todayKey()?save.daily:null;$('dailyStatus').textContent=d?.completed?`BEST ${d.bestScore}`:'NEW CHALLENGE';$('endlessStatus').textContent=`BEST ${save.endless.highScore}`;
  const cleared=CHALLENGES.filter(c=>(save.challenge?.records?.[c.id]?.wins||0)>0).length;$('challengeStatus').textContent=cleared?`${cleared}/6 CLEARED · MIXED-SKILL TRIALS`:'6 TRIALS · MASTER THE BASE CABINET';
  if($('realGamerStatus'))$('realGamerStatus').textContent=(save.realGamer?.wins||0)?`CLEARED ×${save.realGamer.wins} · BEST ${save.realGamer.bestScore}`:`1080 WIDE · 2-TAP INTERCEPT`;
  if($('longDropStatus'))$('longDropStatus').textContent=(save.longDrop?.wins||0)?`CLEARED ×${save.longDrop.wins} · BEST ${save.longDrop.bestScore}`:`620 DROP · PREDICT IMPACT`;  
  $('collectionMenuStatus').textContent=`${Object.keys(save.collection.foods).length} / ${FOOD_IDS.length} FOODS`;
  applyVisualSettings();
}
function openLevels(){setMode('levels')}
function renderLevels(){
  const holder=$('levelButtons');holder.innerHTML='';
  $('campaignSummary').textContent=`${save.totalStars}/${CAMPAIGN_LEVEL_COUNT*3} stars · ${Math.min(CAMPAIGN_LEVEL_COUNT,save.unlockedLevel)}/${CAMPAIGN_LEVEL_COUNT} levels unlocked`;
  $('campaignStarsBig').textContent=save.totalStars;$('campaignLevelsBig').textContent=Math.min(CAMPAIGN_LEVEL_COUNT,save.unlockedLevel);$('campaignOverviewBar').style.width=`${Math.round(save.totalStars/(CAMPAIGN_LEVEL_COUNT*3)*100)}%`;
  for(let chapter=1;chapter<=5;chapter++){
    const levels=LEVELS.filter(l=>l.chapter===chapter),earned=levels.reduce((sum,l)=>sum+(save.levels[l.id]?.stars||0),0),max=levels.length*3;
    const head=document.createElement('div');head.className='chapter-head';head.innerHTML=`<div><b>CHAPTER ${chapter} · ${CHAPTERS[chapter].name}</b><small>${CHAPTERS[chapter].subtitle}</small></div><span class="chapter-stars">★ ${earned}/${max}</span>`;holder.appendChild(head);
    for(const l of levels){
      const i=LEVELS.indexOf(l),unlocked=i<save.unlockedLevel,rec=save.levels[l.id]||{},stars=rec.stars||0,b=document.createElement('button');
      b.className='level-card'+(i===save.unlockedLevel-1?' current':'')+(!unlocked?' locked-copy':'');b.disabled=!unlocked;
      const fav=l.favorite?`<img class="favorite-mini" src="${foodPath(l.favorite)}" alt="${pretty(l.favorite)}">`:'';
      const difficulty='◆'.repeat(Math.max(1,Math.min(5,l.difficulty||1)))+'◇'.repeat(Math.max(0,5-(l.difficulty||1)));
      b.innerHTML=`<span class="level-num">${i+1}</span><span><strong>${l.name}</strong><small>${l.description}</small><span class="level-meta">${fav}<small class="difficulty">${difficulty}</small></span></span><span class="stars">${unlocked?'★'.repeat(stars)+'☆'.repeat(3-stars):'LOCKED'}</span>`;
      b.addEventListener('click',()=>{activateAudio();startRun({levelId:l.id},true,'levels')});holder.appendChild(b);
    }
  }
}
function renderChallenges(){
  const holder=$('challengeButtons');holder.innerHTML='';
  const cleared=CHALLENGES.filter(c=>(save.challenge?.records?.[c.id]?.wins||0)>0).length;
  $('challengeSummary').textContent=`${cleared}/6 cleared · master fast rails, timers, bombs, shrink syringes, and precision objectives`;
  const icons={speed:'time',time:'time',bomb:'bomb',shrink:'syringe',precision:'magnet',gauntlet:'bomb'};
  for(const c of CHALLENGES){
    const rec=save.challenge?.records?.[c.id]||{},b=document.createElement('button');b.className='challenge-card';
    const tags=[`${c.time}s`,`SPEED ${c.sweepSpeed.toFixed(2)}x`,c.specialRates?.bomb?'BOMBS':null,c.specialRates?.syringe?'SHRINK':null,c.perfectTarget?`${c.perfectTarget} PERFECT`:null].filter(Boolean);
    b.innerHTML=`<img src="${specialPath(icons[c.id]||'bomb')}" alt=""><div class="challenge-copy"><span class="challenge-kicker">${c.kicker}</span><strong>${c.name}</strong><p>${c.description}</p><div class="challenge-tags">${tags.map(x=>`<span>${x}</span>`).join('')}</div></div><div class="challenge-best"><span>${rec.wins?`CLEARED ×${rec.wins}`:'UNCLEARED'}</span><b>BEST ${rec.bestScore||0}</b></div>`;
    b.addEventListener('click',()=>{activateAudio();startRun({challengeId:c.id},true,'challenges')});holder.appendChild(b);
  }
}

function renderCollection(){
  const discovered=Object.keys(save.collection.foods).length,achieved=Object.keys(ACHIEVEMENTS).filter(k=>save.achievements[k]).length;
  $('collectionSummary').textContent=`${discovered}/${FOOD_IDS.length} foods · ${achieved}/${Object.keys(ACHIEVEMENTS).length} achievements · max growth ${Math.min(8,(save.stats.maxStage||0)+1)}/8`;
  const campaignDone=!!save.levels.claw030?.stars,challengeDone=CHALLENGES.every(c=>(save.challenge?.records?.[c.id]?.wins||0)>0),gamerDone=(save.realGamer?.wins||0)>0,dropDone=(save.longDrop?.wins||0)>0;
  const mastery=[
    ['LEARN','CAMPAIGN',campaignDone,`${save.totalStars}/90 stars`],['MASTERY I','CHALLENGE',challengeDone,`${CHALLENGES.filter(c=>(save.challenge?.records?.[c.id]?.wins||0)>0).length}/6 cleared`],
    ['MASTERY II','HORIZONTAL',gamerDone,gamerDone?`best ${save.realGamer.bestScore}`:'moving target'],['MASTERY III','VERTICAL',dropDone,dropDone?`best ${save.longDrop.bestScore}`:'predict impact']
  ];
  $('masteryPath').innerHTML=mastery.map(([axis,name,done,detail])=>`<div class="mastery-step${done?' complete':''}">${done?'<i class="crown">♛</i>':''}<span class="axis">${axis}</span><b>${name}</b><small>${detail}</small><span>${done?'MASTERED':'NEXT SKILL'}</span></div>`).join('');
  $('growthGallery').innerHTML='';for(let stage=0;stage<8;stage++){const on=(save.stats.maxStage||0)>=stage||stage===0,d=document.createElement('div');d.className='growth-card'+(on?'':' locked');d.innerHTML=`<img src="${gulperStagePath(stage)}" alt="Gulper growth stage ${stage+1}"><b>STAGE ${stage+1}</b><small>${stage===7?'MAXIMUM':`${GULPER_STAGE_THRESHOLDS[Math.min(7,stage)]} meals`}</small>`;$('growthGallery').appendChild(d)}
  $('achievementGrid').innerHTML='';for(const [id,[name,desc]] of Object.entries(ACHIEVEMENTS)){const on=!!save.achievements[id],d=document.createElement('div');d.className='achievement'+(on?'':' locked');d.innerHTML=`<b>${on?'★':'☆'} ${name}</b><span>${desc}</span>`;$('achievementGrid').appendChild(d)}
  $('foodCollection').innerHTML='';FOOD_IDS.forEach(id=>{const count=save.collection.foods[id]||0,d=document.createElement('div');d.className='collection-item'+(count?'':' locked');d.innerHTML=`<img src="${foodPath(id)}" alt="${pretty(id)}"><strong>${pretty(id)}</strong><small>${count?`fed ${count}`:'undiscovered'}</small>`;$('foodCollection').appendChild(d)});
  $('specialCollection').innerHTML='';SPECIAL_IDS.forEach(id=>{const count=save.collection.specials[id]||0,d=document.createElement('div');d.className='collection-item'+(count?'':' locked');d.innerHTML=`<img src="${specialPath(id)}" alt="${pretty(id)}"><strong>${pretty(id)}</strong><small>${count?`captured ${count}`:'undiscovered'}</small>`;$('specialCollection').appendChild(d)});
  const s=save.stats,stats=[['Meals',s.meals],['Perfects',s.perfects],['Best streak','x'+s.bestCombo],['Runs',s.runs],['Wins',s.wins],['Challenge wins',s.challengeWins||0],['REAL GAMER wins',s.gamerWins||0],['LONG DROP wins',s.longDropWins||0],['Safe dumps',s.safeDumps||0],['Delivery misses',s.deliveryMisses||0],['Best accuracy',Math.round((s.bestAccuracy||0)*100)+'%'],['Score',s.totalScore],['Bombs',s.bombs],['Shrinks',s.syringes||0]];$('lifetimeStats').innerHTML=stats.map(([a,b])=>`<div class="stat-card"><b>${b}</b><small>${a.toUpperCase()}</small></div>`).join('');
}

function populateBriefing(){
  if(!run)return;const l=run.level,n=LEVELS.findIndex(x=>x.id===l.id)+1;
  $('briefingKicker').textContent=run.longDrop?'MASTERY III · VERTICAL':run.realGamer?'MASTERY II · HORIZONTAL':run.challenge?`MASTERY I · ${l.kicker}`:run.daily?'DAILY FEED':run.endless?'ENDLESS FEED':`LEVEL ${n} · CHAPTER ${l.chapter}`;
  $('briefingTitle').textContent=l.name;$('briefingDescription').textContent=l.description;
  const fw=$('briefingFavoriteImg').parentElement,isCampaign=!(run.endless||run.daily||run.challenge||run.realGamer||run.longDrop);
  if(l.favorite&&isCampaign){fw.hidden=false;$('briefingFavoriteImg').src=foodPath(l.favorite);$('briefingFavoriteImg').alt=pretty(l.favorite);$('briefingFavoriteName').textContent=`${pretty(l.favorite)} · +25% SCORE`}else fw.hidden=true;
  const objective=[],bonus=[];
  objective.push(run.endless?'SURVIVE':`${l.targetMeals} MEALS`);
  if(l.perfectTarget)(isCampaign?bonus:objective).push(`${l.perfectTarget} PERFECT`);
  if(l.comboTarget)(isCampaign?bonus:objective).push(`x${l.comboTarget} STREAK`);
  if(l.favoriteTarget)(isCampaign?bonus:objective).push(isCampaign?`${l.favoriteTarget} FAVORITES`:`${l.favoriteTarget} ${pretty(l.favorite).toUpperCase()} FAV`);
  const cabinet=[];
  if(l.specialRates?.bomb)cabinet.push('BOMBS');
  if(l.specialRates?.syringe)cabinet.push(`SHRINK -${l.shrinkMeals||4}`);
  if(l.specialRates?.candy)cabinet.push('JEWELED CANDIES');
  if(l.specialRates?.heart)cabinet.push('HEARTS');
  const goals=[];
  if(run.longDrop){
    goals.push(['2','2 TAPS · grab → lead-release from high above']);
    goals.push(['↓',`${l.dropDistance} UNIT DROP · ${l.fallTime.toFixed(2)}s FLIGHT · GULPER KEEPS MOVING`]);
  }else if(run.realGamer){
    goals.push(['2','2 TAPS · grab → release over moving Gulper']);
    goals.push(['↔','1080-WIDE ARENA · dump hazards when Gulper is away']);
  }else{
    goals.push(['1','ONE TAP · grab food; the claw auto-feeds Gulper']);
  }
  goals.push(['✓',`${isCampaign?'CLEAR · ':run.endless?'':'REQUIRED · '}${objective.join(' · ')}`]);
  if(bonus.length)goals.push(['★',`STAR BONUS · ${bonus.join(' · ')}`]);
  if(Number.isFinite(l.time))goals.push(['T',`${l.time}s CLOCK · ${l.hearts} HEART${l.hearts===1?'':'S'}`]);
  else goals.push(['♥',`${l.hearts} HEARTS · survive as long as you can`]);
  if(cabinet.length)goals.push(['!',cabinet.join(' · ')]);
  $('briefingGoals').innerHTML=goals.map(([i,t])=>`<div class="briefing-goal"><i>${i}</i><span>${t}</span></div>`).join('');
  $('briefingTip').textContent=l.tip||'Time the center of the food.';
  $('briefingStart').textContent=run.longDrop?'START VERTICAL MASTERY':run.realGamer?'START HORIZONTAL MASTERY':run.challenge?'START MASTERY TRIAL':run.endless?'START ENDLESS':run.daily?'START DAILY':'START FEEDING';
}
function startRun({levelId='claw001',endless=false,daily=false,challengeId=null,realGamer=false,longDrop=false,seed:seedOverride=null}={},showBriefing=true,returnMode='menu'){
  const seed=daily?dailySeedFromDate(todayKey()):(Number.isInteger(seedOverride)?seedOverride>>>0:((Date.now()^Math.floor(Math.random()*0xffffffff))>>>0));lastUnlocked=save.unlockedLevel;briefingReturn=returnMode;
  briefingReturnRun=returnMode==='result'?run:null;briefingReturnRecorded=returnMode==='result'?resultRecorded:false;
  run=createRun({levelId,seed,endless,daily,challengeId,realGamer,longDrop,campaignAssist:save.settings.campaignAssist});run.personalBestTimingMs=longDrop?save.longDrop?.bestTimingErrorMs:realGamer?save.realGamer?.bestTimingErrorMs:null;paused=showBriefing;resultRecorded=false;particles=[];floaters=[];countdownRemaining=0;coachActive=longDrop?!save.longDropTutorialSeen:realGamer?!save.gamerTutorialSeen:!save.tutorialSeen;anim={phase:'idle',t:0,item:null,dropX:run.worldWidth/2,grade:null,gulperScale:.82,reaction:'',reactionT:0,shake:0,stageUp:false,stageDown:false,cameraX:0,deliveryHit:false};
  retainGulperEatingStages(assets,[run.stage,Math.min(7,run.stage+1)]);loadAsset(assets,gulperEatPath(run.stage));
  canvas.setAttribute('aria-label',run.longDrop?'LONG DROP CLAW. Tap once to grab, then tap again to release early and lead moving Gulper through the long fall.':run.realGamer?'REAL GAMER CLAW. Tap once to grab food, then tap again to release over moving Gulper.':'CLAW Feed Gulper game. Tap or press Space to drop the claw.');
  setMode('play');updateHud();last=performance.now();accumulator=0;
  $('coachHint').hidden=true;
  if(showBriefing){populateBriefing();safeShowModal($('briefingDialog'))}else beginRun();
}
function beginRun(){
  safeCloseDialog($('briefingDialog'));paused=false;setMusicPaused(false);setMusicScene(run.longDrop?'longdrop':run.realGamer?'gamer':run.challenge?'challenge':'campaign');countdownRemaining=2.25;last=performance.now();renderLast=last;accumulator=0;activateAudio();
  if(coachActive){$('coachHint').textContent='CENTER THE CLAW OVER FOOD · TAP TO DROP';$('coachHint').hidden=false}
}
function updateHud(){
  if(!run)return;$('hudScore').textContent=run.score;$('hudCombo').textContent=`x${Math.max(1,run.combo)}`;
  if(run.stage<7&&nextStageAt(run.meals)-run.meals<=1)loadAsset(assets,gulperEatPath(run.stage+1));
  $('hudHearts').textContent='♥'.repeat(run.hearts)+'♡'.repeat(Math.max(0,Math.max(3,run.level.hearts)-run.hearts));$('hudTimer').textContent=Number.isFinite(run.remaining)?Math.ceil(run.remaining)+'s':'∞';$('hudTimer').classList.toggle('timer-danger',Number.isFinite(run.remaining)&&run.remaining<=15);$('levelName').textContent=run.level.name;
  const urgent=Number.isFinite(run.remaining)&&run.remaining<=10,hazard=!!(run.level.specialRates?.bomb||run.level.specialRates?.syringe),manual=run.realGamer||run.longDrop,finalRelease=manual&&anim.phase==='delivery-wait'&&run.remaining<=0;$('dropHint').textContent=run.longDrop&&anim.phase==='freefall'?'FALLING · TRACK GULPER':finalRelease?'FINAL RELEASE · TAP NOW':run.longDrop&&anim.phase==='delivery-wait'?'2ND TAP · LEAD THE LANDING':run.longDrop?'1ST TAP · GRAB FOOD':run.realGamer&&anim.phase==='delivery-wait'?'2ND TAP · RELEASE OVER GULPER':run.realGamer?'1ST TAP · GRAB FOOD':urgent?'HURRY · TAP TO DROP':hazard?'CENTER IT · AVOID HAZARDS':'TAP ANYWHERE TO DROP';
  $('objectiveText').textContent=objectiveProgress(run).join(' · ');
  const e=run.effects,p=[];if(e.magnetDrops)p.push(`MAGNET ${e.magnetDrops}`);if(e.shield)p.push(`SHIELD ${e.shield}`);if(e.royalMeals)p.push(`ROYAL ×2 · ${e.royalMeals}`);if(run.campaignAssist&&run.assistBonus>0)p.push(`TRAINING +${Math.round(run.assistBonus)}`);$('effectPills').innerHTML=p.map(x=>`<span class="effect-pill">${x}</span>`).join('');
  $('growthStageLabel').textContent=`GROWTH ${run.stage+1} / 8`;$('growthBar').style.width=`${Math.round(growthProgress(run.meals)*100)}%`;const n=nextStageAt(run.meals);$('growthNext').textContent=run.stage>=7?'MAX SIZE':`${Math.max(0,n-run.meals)} TO GROW`;
  setMusicIntensity(Math.max(Math.min(1,(run.combo||0)/12),Number.isFinite(run.remaining)&&run.remaining<=15?Math.min(1,(15-run.remaining)/8):0));setMusicScene(anim.phase==='freefall'?'flight':Number.isFinite(run.remaining)&&run.remaining<=10?'danger':run.longDrop?'longdrop':run.realGamer?'gamer':run.challenge?'challenge':'campaign');
}
function drop(){
  if(!run||paused||countdownRemaining>0||run.result!=='playing'||document.querySelector('dialog[open]'))return;
  if((run.realGamer||run.longDrop)&&anim.phase==='delivery-wait')return releaseManualDelivery();
  if(anim.phase!=='idle')return;run.state='busy';anim.phase='dropping';anim.t=0;anim.dropX=run.clawX;haptic(7);sfx('ui');updateHud();
}
function releaseManualDelivery(){
  if(!(run?.realGamer||run?.longDrop)||!run.heldItem||anim.phase!=='delivery-wait')return;
  if(run.longDrop){run.state='freefall';anim.phase='freefall';anim.t=0;anim.deliveryHit=false;sfx('ui');haptic(8);updateHud();return;}
  const d=trackDelivery(run,evaluateDelivery(run,anim.dropX)),item=run.heldItem,hazard=item.kind==='bomb'||item.kind==='syringe';anim.deliveryHit=d.hit;run.gulperFrozen=true;anim.t=0;
  if(!d.hit){discardHeldItem(run,{safeHazard:hazard});anim.reaction=hazard?'SAFE DUMP!':'MISSED MOUTH!';anim.reactionT=0;toast(hazard?`${item.kind.toUpperCase()} DUMPED SAFELY`:`MISSED GULPER · ${Math.round(d.timingErrorMs)}ms OFF · HEART -1`);sfx(hazard?'special':'miss');haptic(hazard?[7,14,7]:[18,14,18]);anim.phase='delivery-miss';anim.item=item;updateHud();return;}
  anim.phase='release';sfx('ui');haptic(8);updateHud();
}
function resolveLongDropImpact(){
  if(!run?.longDrop||!run.heldItem)return;const d=trackDelivery(run,evaluateDelivery(run,anim.dropX)),item=run.heldItem,hazard=item.kind==='bomb'||item.kind==='syringe';anim.deliveryHit=d.hit;run.gulperFrozen=true;anim.t=0;
  if(!d.hit){discardHeldItem(run,{safeHazard:hazard});anim.reaction=hazard?'SAFE DUMP!':'MISSED LANDING!';anim.reactionT=0;toast(hazard?`${item.kind.toUpperCase()} DUMPED SAFELY`:`MISSED GULPER · ${Math.round(d.timingErrorMs)}ms OFF · HEART -1`);sfx(hazard?'special':'miss');haptic(hazard?[7,14,7]:[18,14,18]);anim.phase='delivery-miss';anim.item=item;updateHud();return;}
  anim.phase='feeding';sfx('perfect');haptic([8,18,8]);updateHud();
}
function resolveGrab(){
  const ev=evaluateGrab(run);commitGrab(run,ev);anim.grade=ev.grade;
  if(ev.hit){anim.item=ev.item;sfx(ev.grade==='PERFECT'?'perfect':'grab');haptic(ev.grade==='PERFECT'?[8,22,8]:8);anim.phase='rising';if(coachActive){$('coachHint').textContent=run.longDrop?'LEAD GULPER · RELEASE BEFORE HE REACHES THE LANDING':run.realGamer?'NOW TIME GULPER · TAP AGAIN TO RELEASE':'NICE · THE CLAW AUTO-FEEDS GULPER'}}
  else{sfx('miss');haptic([18,20,18]);anim.reaction=run.lastFeedEvent?.kind==='shield-save'?'SHIELD!':'OOPS!';anim.reactionT=0;if(run.lastFeedEvent?.kind==='shield-save')toast('SHIELD SAVED IT');if(coachActive)$('coachHint').textContent="AIM FOR THE FOOD'S CENTER · TRY AGAIN";anim.phase='rising-miss';}
  anim.t=0;updateHud();
}
function spawnBurst(kind,count=22){
  if(save.settings.reducedMotion)return;const budget=innerWidth<=480?Math.min(count,14):count;
  for(let i=0;i<budget;i++)particles.push({x:(run?.realGamer||run?.longDrop)?run.gulperX:LOGICAL_WIDTH/2,y:640,vx:(Math.random()-.5)*260,vy:-90-Math.random()*180,t:0,life:.48+Math.random()*.42,kind});
  if(particles.length>64)particles=particles.slice(-64);
}
function spawnFloater(text,x,y,tone='score'){
  if(save.settings.reducedMotion)return;floaters.push({text:String(text),x,y,t:0,life:.82,tone});if(floaters.length>12)floaters=floaters.slice(-12);
}
function finishFeed(){
  const beforeStage=run.stage,beforeMeals=run.meals;feedHeldFood(run);const ev=run.lastFeedEvent||{kind:'food'};spawnBurst(ev.kind,ev.kind==='food'?24:18);anim.stageUp=run.stage>beforeStage;anim.stageDown=run.stage<beforeStage;
  retainGulperEatingStages(assets,[run.stage,Math.min(7,run.stage+1)]);loadAsset(assets,gulperEatPath(run.stage));
  if(ev.kind==='bomb'||ev.kind==='shield-bomb'){
    sfx('bomb');haptic([30,20,45]);anim.shake=.28;anim.reaction=ev.kind==='shield-bomb'?'BLOCKED!':'BURP!';toast(ev.kind==='shield-bomb'?'SHIELD BLOCKED BOMB':'BOMB!');anim.phase='burst';
  } else if(ev.kind==='syringe'||ev.kind==='shield-syringe'){
    sfx(ev.kind==='syringe'?'miss':'special');haptic(ev.kind==='syringe'?[18,15,18]:[8,15,8]);anim.shake=ev.kind==='syringe'?.16:0;anim.reaction=ev.kind==='shield-syringe'?'BLOCKED!':'SHRUNK!';anim.reactionT=0;
    toast(ev.kind==='shield-syringe'?'SHIELD BLOCKED SHRINK':`SHRINK · -${ev.loss||Math.max(0,beforeMeals-run.meals)} MEALS`);anim.phase='burst';
  } else {
    const eatPitch=Math.max(.78,1.04-run.stage*.035);sfx(ev.kind==='food'?'eat':'special',ev.kind==='food'?eatPitch:1);
    const reactions={heart:'HEALED!',magnet:'MAGNET!',time:'+8 SEC!',shield:'SHIELDED!',royal:'ROYAL!'};
    anim.reaction=ev.kind==='food'?(ev.favorite?'FAVORITE!':ev.royal?'ROYAL x2!':run.combo>=10?'FEASTING!':run.lastGrade==='PERFECT'?'PERFECT BITE!':'CHOMP!'):(reactions[ev.kind]||'NICE!');anim.reactionT=0;
    if(ev.kind==='food'){const gx=(run.realGamer||run.longDrop)?run.gulperX:LOGICAL_WIDTH/2;spawnFloater(`+${ev.scoreGain||0}`,gx,610,ev.favorite?'favorite':run.lastGrade==='PERFECT'?'perfect':'score');if(ev.favorite)spawnFloater('FAVORITE +25%',gx,650,'favorite');if(run.lastGrade==='PERFECT'){anim.shake=Math.max(anim.shake,.07);haptic([7,12,7])}if(anim.stageUp){anim.shake=Math.max(anim.shake,.14);spawnFloater(`STAGE ${run.stage+1}!`,gx,685,'stage')}}
    if(ev.kind==='heart')toast('HEART +1');if(ev.kind==='magnet')toast('MAGNET · 3 DROPS');if(ev.kind==='time')toast('+8 SECONDS');if(ev.kind==='shield')toast('SHIELD READY');if(ev.kind==='royal')toast('ROYAL · DOUBLE MEALS');if(ev.kind==='food'&&ev.royal)toast('ROYAL x2');if(anim.stageUp)toast(`GULPER GREW · STAGE ${run.stage+1}`);
    anim.phase='eating';
  }
  if(coachActive&&ev.kind==='food'){coachActive=false;if(run.longDrop)save.longDropTutorialSeen=true;else if(run.realGamer)save.gamerTutorialSeen=true;else save.tutorialSeen=true;storeSave(save);setTimeout(()=>{if($('coachHint'))$('coachHint').hidden=true},1250)}
  anim.t=0;updateHud();
}
function finishCycle(){if(run){run.state='idle';run.gulperFrozen=false;}anim.phase='idle';anim.t=0;anim.item=null;anim.grade=null;anim.stageUp=false;anim.stageDown=false;if(run.result!=='playing')showResult()}
function renderResultStars(stars){$('resultStars').innerHTML='';for(let i=0;i<3;i++){const im=document.createElement('img');im.src=uiPath(i<stars?'star-fill.png':'star-empty.png');im.alt=i<stars?'earned star':'empty star';$('resultStars').appendChild(im)}}
function showResult(){
  if(!run||mode==='result')return;
  const stars=(run.endless||run.challenge||run.realGamer||run.longDrop?0:starRating(run)),wasLevel=run.level.id,prevRec=save.levels[wasLevel]||{},prevChallenge=run.challenge?{...(save.challenge?.records?.[run.challengeId]||{})}:null,prevEndless={...save.endless},prevGamer={...save.realGamer},prevLongDrop={...save.longDrop};
  if(!resultRecorded){
    if(run.longDrop)recordLongDrop(save,run);else if(run.realGamer)recordRealGamer(save,run);else if(run.endless)recordEndless(save,run);else if(run.daily)recordDaily(save,run,todayKey(),stars);else if(run.challenge)recordChallenge(save,run);else if(run.result==='complete')recordCampaign(save,run,stars);else recordRunStats(save,run);resultRecorded=true;
  }
  const complete=run.result==='complete';
  $('resultEyebrow').textContent=run.longDrop?'LONG DROP RESULT':run.realGamer?'REAL GAMER RESULT':run.challenge?'CHALLENGE RESULT':run.daily?'DAILY RESULT':run.endless?'ENDLESS RESULT':'CAMPAIGN RESULT';
  $('resultTitle').textContent=complete?(run.longDrop?'LONG DROP CLEARED!':run.realGamer?'REAL GAMER CLEARED!':run.challenge?'CHALLENGE CLEARED!':'GULPER FED!'):run.longDrop?'DROP RUN OVER':run.realGamer?'GAMER RUN OVER':run.endless?'ENDLESS OVER':run.challenge?'CHALLENGE FAILED':'SO CLOSE!';
  $('resultGulper').src=gulperStagePath(run.stage);$('resultScore').textContent=run.score;$('resultGrowth').textContent=`GROWTH STAGE ${run.stage+1} / 8`;
  const hideCampaignStars=run.endless||run.challenge||run.realGamer||run.longDrop;$('result').classList.toggle('mastery-result',!!(run.challenge||run.realGamer||run.longDrop));$('resultStars').hidden=hideCampaignStars;if(hideCampaignStars)$('resultStars').innerHTML='';else renderResultStars(stars);
  const isEndlessBest=run.endless&&run.score>(prevEndless?.highScore||0),isChallengeBest=run.challenge&&run.score>(prevChallenge?.bestScore||0),isGamerBest=run.realGamer&&run.score>(prevGamer?.bestScore||0),isLongDropBest=run.longDrop&&run.score>(prevLongDrop?.bestScore||0);
  $('resultBest').textContent=isLongDropBest&&run.score>0?'★ NEW LONG DROP BEST':isGamerBest&&run.score>0?'★ NEW REAL GAMER BEST':isEndlessBest&&run.score>0?'★ NEW ENDLESS BEST':isChallengeBest?'★ NEW CHALLENGE BEST':complete&&!run.challenge&&stars===3?'★ THREE-STAR FEAST':' ';
  const resultMetrics=[['MEALS',run.meals],['ACCURACY',Math.round(runAccuracy()*100)+'%'],['PERFECT',run.perfects],['BEST STREAK','x'+run.bestCombo]];
  if(run.level.favorite)resultMetrics.push(['FAVORITES',run.favorites]);
  if(run.realGamer||run.longDrop){resultMetrics.push(['AVG ERROR',Math.round(averageDeliveryErrorMs(run))+'ms']);resultMetrics.push(['BEST ERROR',run.bestDeliveryErrorMs==null?'—':Math.round(run.bestDeliveryErrorMs)+'ms']);resultMetrics.push([run.longDrop?'LANDINGS':'SAFE DUMPS',run.longDrop?run.longDropLandings:run.safeDumps]);}
  $('resultStats').innerHTML=resultMetrics.map(([label,value])=>`<span><b>${value}</b>${label}</span>`).join('');
  const unlock=$('resultUnlock');unlock.hidden=true;
  if(run.longDrop&&complete){unlock.hidden=false;unlock.textContent=`LONG DROP CLEARED · ${Math.ceil(run.remaining)}s LEFT · AVG ${Math.round(averageDeliveryErrorMs(run))}ms`}
  else if(run.realGamer&&complete){unlock.hidden=false;unlock.textContent=`REAL GAMER CLEARED · ${Math.ceil(run.remaining)}s LEFT · AVG ${Math.round(averageDeliveryErrorMs(run))}ms`}
  else if(run.challenge&&complete){unlock.hidden=false;unlock.textContent=`${run.level.name.toUpperCase()} CLEARED · ${Math.ceil(run.remaining)}s LEFT`}
  else if(!run.endless&&!run.daily&&!run.challenge&&!run.realGamer&&!run.longDrop&&complete&&save.unlockedLevel>lastUnlocked){unlock.hidden=false;unlock.textContent=Number(run.level.id.slice(-3))>=CAMPAIGN_LEVEL_COUNT?'CAMPAIGN COMPLETE · GRAND GULPER!':`LEVEL ${save.unlockedLevel} UNLOCKED`}
  else if(!run.endless&&!run.daily&&!run.challenge&&!run.realGamer&&!run.longDrop&&stars>(prevRec.stars||0)){unlock.hidden=false;unlock.textContent=`NEW BEST · ${stars} STARS`}
  $('resultPrimary').textContent=run.longDrop?'DROP AGAIN':run.realGamer?'RUN IT BACK':run.challenge?(complete&&CHALLENGES.findIndex(x=>x.id===run.challengeId)<CHALLENGES.length-1?'NEXT CHALLENGE':'RETRY CHALLENGE'):run.endless?'PLAY AGAIN':run.daily?'DAILY AGAIN':complete&&Number(run.level.id.slice(-3))<CAMPAIGN_LEVEL_COUNT?'NEXT LEVEL':'RETRY';
  setMode('result');sfx(complete?'level':'miss');
}

function themePalette(){
  const t=run?.level?.theme||'berry';
  return {
    berry:['#37466d','#19233a','#ff6a91','#59dbc8'],bakery:['#594056','#291f36','#f3a85d','#ffd96a'],candy:['#493a68','#201d43','#b789ff','#59dbc8'],
    night:['#26304d','#10172a','#72a8ff','#ff6a91'],royal:['#4d355e','#21152f','#ffd96a','#ff6a91'],daily:['#2f5260','#142a34','#59dbc8','#ffd96a'],endless:['#3a2b50','#171427','#ff6a91','#8b9aff'],
    'challenge-speed':['#4d2844','#1f152b','#ff7b87','#ffd96a'],'challenge-time':['#30455c','#121c2d','#69d7ff','#ffd96a'],'challenge-bomb':['#552f36','#22131a','#ff6969','#ffb05f'],'challenge-shrink':['#4a355f','#1d162d','#ca8cff','#59dbc8'],'challenge-precision':['#283e54','#101b29','#59dbc8','#c9a5ff'],'challenge-gauntlet':['#50263e','#1b1322','#ff5d86','#ca8cff'],gamer:['#222744','#090d1b','#ff3f66','#56e3d0'],'long-drop':['#17334d','#081521','#73cfff','#ffd96a']
  }[t]||['#37466d','#19233a','#ff6a91','#59dbc8'];
}
function logicalCtx(){
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);
  const bg=img(uiPath('background.webp'));if(bg){const s=Math.max(canvas.width/bg.width,canvas.height/bg.height),w=bg.width*s,h=bg.height*s;ctx.globalAlpha=.22;ctx.drawImage(bg,(canvas.width-w)/2,(canvas.height-h)/2,w,h);ctx.globalAlpha=1;ctx.fillStyle='#101322cc';ctx.fillRect(0,0,canvas.width,canvas.height)}else{ctx.fillStyle='#151a2d';ctx.fillRect(0,0,canvas.width,canvas.height)}
  ctx.translate(viewport.offsetX,viewport.offsetY);ctx.scale(viewport.scale,viewport.scale);if(anim.shake>0&&!save.settings.reducedMotion){ctx.translate((Math.random()-.5)*18*anim.shake,(Math.random()-.5)*12*anim.shake)}
}
function roundedRect(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function drawMachine(now){
  const [top,bottom,accent,accent2]=themePalette(),bg=img(uiPath('background.webp'));
  if(bg){ctx.save();ctx.globalAlpha=.18;ctx.drawImage(bg,0,0,LOGICAL_WIDTH,LOGICAL_HEIGHT);ctx.restore()}
  ctx.fillStyle='#0d0e18ee';roundedRect(12,10,696,880,34);ctx.fill();ctx.strokeStyle='#ffffff24';ctx.lineWidth=4;ctx.stroke();
  const side=ctx.createLinearGradient(0,0,LOGICAL_WIDTH,0);side.addColorStop(0,'#171a2d');side.addColorStop(.08,top);side.addColorStop(.5,'#111423');side.addColorStop(.92,top);side.addColorStop(1,'#171a2d');ctx.fillStyle=side;roundedRect(26,22,668,856,28);ctx.fill();
  const marquee=ctx.createLinearGradient(0,30,0,112);marquee.addColorStop(0,accent);marquee.addColorStop(.45,top);marquee.addColorStop(1,bottom);ctx.fillStyle=marquee;roundedRect(40,34,640,82,22);ctx.fill();ctx.strokeStyle='#ffffff35';ctx.lineWidth=2;ctx.stroke();
  ctx.textAlign='center';ctx.fillStyle='#fff';ctx.font='950 23px system-ui';ctx.fillText(run?.longDrop?"LONG DROP · VERTICAL SHAFT":run?.realGamer?"REAL GAMER · WIDE ARENA":run?.challenge?"GULPER'S DANGER CABINET":"GULPER'S FEED-O-MATIC",LOGICAL_WIDTH/2,72);ctx.fillStyle='#ffffffb8';ctx.font='800 10px system-ui';ctx.fillText(run?.longDrop?'GRAB · LEAD GULPER · RELEASE EARLY':run?.realGamer?'GRAB · TRACK GULPER · TAP AGAIN TO RELEASE':run?.challenge?`${run.level.kicker} · ${run.level.time}s · STAY SHARP`:'TIME THE CLAW · DROP THE FEAST',LOGICAL_WIDTH/2,94);
  for(let i=0;i<18;i++){ctx.fillStyle=i%2?accent2:accent;ctx.globalAlpha=.78+.22*Math.sin(now*.004+i);ctx.beginPath();ctx.arc(58+i*35.5,49,3.4,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;
  const g=ctx.createLinearGradient(0,125,0,830);g.addColorStop(0,top);g.addColorStop(.62,bottom);g.addColorStop(1,'#0c1020');ctx.fillStyle=g;roundedRect(42,126,636,704,24);ctx.fill();ctx.strokeStyle='#ffffff1d';ctx.lineWidth=3;ctx.stroke();
  const glass=ctx.createLinearGradient(45,130,675,760);glass.addColorStop(0,'#ffffff12');glass.addColorStop(.22,'#ffffff02');glass.addColorStop(.7,'#ffffff00');glass.addColorStop(1,'#ffffff0c');ctx.fillStyle=glass;roundedRect(54,138,612,680,19);ctx.fill();
  if(run?.longDrop){ctx.save();ctx.strokeStyle='#73cfff38';ctx.lineWidth=2;ctx.setLineDash([10,12]);for(const x of [170,360,550]){ctx.beginPath();ctx.moveTo(x,205);ctx.lineTo(x,700);ctx.stroke()}ctx.setLineDash([]);for(const [y,label] of [[270,'HIGH RELEASE'],[470,'LONG FALL'],[670,'LANDING ZONE']]){ctx.fillStyle='#73cfff16';roundedRect(84,y-14,552,28,14);ctx.fill();ctx.fillStyle='#d9f1ffb5';ctx.font='900 8px system-ui';ctx.fillText(label,LOGICAL_WIDTH/2,y+3)}ctx.restore()}
  // Rail and moving-light strip.
  ctx.fillStyle='#aab0c5';roundedRect(66,151,588,22,11);ctx.fill();ctx.fillStyle='#747b91';roundedRect(72,158,576,8,4);ctx.fill();
  for(let i=0;i<20;i++){ctx.fillStyle=i%3===0?accent:i%2?accent2:'#fff1b2';ctx.beginPath();ctx.arc(82+i*29.2,162,2.8,0,Math.PI*2);ctx.fill()}
  // Cabinet floor and Gulper feeding plate.
  const floor=ctx.createLinearGradient(0,700,0,823);floor.addColorStop(0,'#10162922');floor.addColorStop(1,'#090c16aa');ctx.fillStyle=floor;roundedRect(58,680,604,132,18);ctx.fill();
  ctx.fillStyle='#090d18c9';roundedRect(218,748,284,52,20);ctx.fill();ctx.strokeStyle=accent+'66';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#ffffff12';roundedRect(240,760,240,25,13);ctx.fill();
  ctx.fillStyle='#ffffff9c';ctx.font='900 10px system-ui';ctx.fillText(`GROWTH STAGE ${run?run.stage+1:1}`,LOGICAL_WIDTH/2,810);
  // Decorative side bolts.
  for(const x of [39,681])for(const y of [145,330,520,705]){ctx.fillStyle='#c9c9d2';ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fill();ctx.fillStyle='#646477';ctx.fillRect(x-3,y-.7,6,1.4)}
}
function itemImage(item){return item.kind==='food'?img(foodPath(item.id)):img(specialPath(item.id))}
function drawItems(now){
  if(!run)return;for(const item of run.items){const im=itemImage(item);if(!im)continue;const bob=save.settings.reducedMotion?0:Math.sin(now*.0025+item.bobPhase)*5,size=78+(item.width-38)*.62,y=item.y+bob;
    ctx.save();ctx.translate(item.x,y);
    if(item.kind==='food'&&item.id===run.level.favorite){ctx.strokeStyle='#ffd96ab8';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,size*.52+7,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#ffd96a';ctx.font='950 14px system-ui';ctx.textAlign='center';ctx.fillText('★',0,-size*.55-9)}
    if(item.kind!=='food'){const color=item.kind==='bomb'?'#ff6969':item.kind==='syringe'?'#ca8cff':'#59dbc8';ctx.globalAlpha=.18+.08*Math.sin(now*.008+item.bobPhase);ctx.fillStyle=color;ctx.beginPath();ctx.arc(0,0,size*.62,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1}
    if(item.kind==='bomb'&&!save.settings.reducedMotion){ctx.globalAlpha=.84+.16*Math.sin(now*.012)}ctx.drawImage(im,-size/2,-size/2,size,size);ctx.globalAlpha=1;
    ctx.fillStyle='#00000036';ctx.beginPath();ctx.ellipse(0,size*.45,size*.32,6,0,0,Math.PI*2);ctx.fill();
    if(item.kind==='bomb'||item.kind==='syringe'){ctx.fillStyle=item.kind==='bomb'?'#ff8b8b':'#ddb3ff';ctx.strokeStyle='#141020';ctx.lineWidth=4;ctx.font='950 10px system-ui';ctx.textAlign='center';const label=item.kind==='bomb'?'BOMB':'SHRINK';ctx.strokeText(label,0,-size*.58-7);ctx.fillText(label,0,-size*.58-7)}
    ctx.restore();
  }
}
function clawPose(){let x=run?.clawX||LOGICAL_WIDTH/2,y=174,arm=54;if(anim.phase==='dropping'){const p=Math.min(1,anim.t/.48);x=anim.dropX;arm=54+p*300}else if(['rising','rising-miss'].includes(anim.phase)){const p=Math.min(1,anim.t/.44);x=anim.dropX;arm=354-p*300}else if(anim.phase==='centering'){const p=Math.min(1,anim.t/.34);x=anim.dropX+(LOGICAL_WIDTH/2-anim.dropX)*p}else if((run?.realGamer||run?.longDrop)&&['delivery-wait','freefall','release','feeding','delivery-miss'].includes(anim.phase))x=anim.dropX;else if(['release','feeding','eating','burst'].includes(anim.phase))x=LOGICAL_WIDTH/2;return{x,y,arm}}
function drawClaw(){
  if(!run)return;const {x,y,arm}=clawPose(),hy=y+arm;ctx.save();
  ctx.strokeStyle='#eef1fa';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(x,y-12);ctx.lineTo(x,hy);ctx.stroke();ctx.strokeStyle='#858ba0';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+4,y-12);ctx.lineTo(x+4,hy);ctx.stroke();
  const head=ctx.createLinearGradient(x-35,hy-18,x+35,hy+25);head.addColorStop(0,'#ff9ab2');head.addColorStop(.48,'#ff5d86');head.addColorStop(1,'#be345d');ctx.fillStyle=head;roundedRect(x-34,hy-15,68,39,15);ctx.fill();ctx.strokeStyle='#ffffff55';ctx.lineWidth=2;ctx.stroke();
  ctx.fillStyle='#2c2031';ctx.beginPath();ctx.arc(x-11,hy+1,3.6,0,Math.PI*2);ctx.arc(x+11,hy+1,3.6,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#d9deeb';ctx.lineWidth=8;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x-19,hy+15);ctx.lineTo(x-34,hy+44);ctx.moveTo(x+19,hy+15);ctx.lineTo(x+34,hy+44);ctx.stroke();ctx.strokeStyle='#7f879c';ctx.lineWidth=2;ctx.stroke();ctx.lineCap='butt';
  if(anim.item&&['rising','centering','delivery-wait','release'].includes(anim.phase)){const im=itemImage(anim.item);if(im)ctx.drawImage(im,x-38,hy+28,76,76)}ctx.restore();
}
function eatDuration(){return .56+(run?.stage||0)*.032}
function drawGulper(now){
  if(!run)return;anim.gulperScale+=(run.targetScale-anim.gulperScale)*.10;const stage=run.stage,baseX=(run.realGamer||run.longDrop)?run.gulperX:LOGICAL_WIDTH/2,y=785,held=run.heldItem||anim.item;
  let lean=0,rotation=0;if(held&&['centering','delivery-wait','freefall','release','feeding'].includes(anim.phase)&&!save.settings.reducedMotion){const dir=Math.sign(anim.dropX-baseX)||1,hazard=held.kind==='bomb'||held.kind==='syringe',favorite=held.kind==='food'&&held.id===run.level.favorite;lean=(hazard?-1:1)*dir*(favorite?15:hazard?12:7);rotation=(hazard?-1:1)*dir*.025}
  const x=baseX+lean,dur=eatDuration();let scale=anim.gulperScale;if(anim.phase==='eating'&&!save.settings.reducedMotion)scale*=1+Math.sin(Math.min(1,anim.t/dur)*Math.PI)*(.075+stage*.004);const size=330*scale;
  ctx.save();ctx.globalAlpha=.35;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(x,y-7,size*.33,size*.07,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;ctx.translate(x,y-size*.42);ctx.rotate(rotation);
  if(anim.phase==='eating'){const sheet=img(gulperEatPath(stage));if(sheet){const frame=Math.min(7,Math.floor(anim.t/dur*8));ctx.drawImage(sheet,frame*450,0,450,450,-size/2,-size*.41,size,size);ctx.restore();return}}
  const blink=!save.settings.reducedMotion&&Math.sin(now/510)>.991,im=img(blink?gulperBlinkPath(stage):gulperStagePath(stage));if(im)ctx.drawImage(im,-size/2,-size*.41,size,size);ctx.restore();
}
function drawGulperMood(now){
  if(!run||save.settings.reducedMotion)return;const held=run.heldItem||anim.item;if(!held||!['centering','delivery-wait','freefall'].includes(anim.phase))return;const x=(run.realGamer||run.longDrop)?run.gulperX:LOGICAL_WIDTH/2,y=545+Math.sin(now/170)*4;let symbol='',fill='#fff5e7';
  if(held.kind==='food'&&held.id===run.level.favorite){symbol='♥';fill='#ffd96a'}else if(held.kind==='bomb'||held.kind==='syringe'){symbol='!';fill='#ff8b8b'}else if(held.kind==='food'){symbol='•';fill='#73e6d2'}else return;
  ctx.save();ctx.globalAlpha=.88;ctx.fillStyle='#171224cc';ctx.beginPath();ctx.arc(x,y,18,0,Math.PI*2);ctx.fill();ctx.fillStyle=fill;ctx.font='950 18px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(symbol,x,y+1);ctx.restore();
}
function drawFeedingDrop(){if(!anim.item||!['feeding','delivery-miss','freefall'].includes(anim.phase))return;const im=itemImage(anim.item);if(!im)return;if(anim.phase==='freefall'){const dur=longDropFallTime(run),p=Math.min(1,anim.t/dur),ease=p*p,y=205+(700-205)*ease,s=82*(1-p*.18);ctx.save();ctx.strokeStyle='#73cfff55';ctx.lineWidth=3;ctx.setLineDash([8,12]);ctx.beginPath();ctx.moveTo(anim.dropX,205);ctx.lineTo(anim.dropX,y-18);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=.35+.65*Math.min(1,p*2);ctx.drawImage(im,anim.dropX-s/2,y-s/2,s,s);ctx.restore();return;}const dur=anim.phase==='delivery-miss'?.46:.32,p=Math.min(1,anim.t/dur),y=265+((anim.phase==='delivery-miss'?760:635)-265)*(p*p),s=78*(1-p*.28);ctx.save();if(p>.65)ctx.globalAlpha=Math.max(.35,1-(p-.65)*1.2);const fx=(run?.realGamer||run?.longDrop)?anim.dropX:LOGICAL_WIDTH/2;ctx.drawImage(im,fx-s/2,y-s/2,s,s);ctx.restore()}
function drawBurst(){if(anim.phase!=='burst')return;const p=Math.min(1,anim.t/.46);ctx.save();ctx.strokeStyle=`rgba(255,100,90,${1-p})`;ctx.lineWidth=14*(1-p)+2;ctx.beginPath();ctx.arc((run?.realGamer||run?.longDrop)?run.gulperX:LOGICAL_WIDTH/2,620,35+p*125,0,Math.PI*2);ctx.stroke();ctx.restore()}
function drawFeedback(){
  if(anim.grade&&anim.phase!=='idle'){ctx.save();ctx.textAlign='center';ctx.font='950 30px system-ui';ctx.fillStyle=anim.grade==='PERFECT'?'#ffe17a':anim.grade==='GREAT'?'#69e3d0':anim.grade==='MISS'?'#d0c8da':'#fff';ctx.strokeStyle='#111827';ctx.lineWidth=6;ctx.strokeText(anim.grade,LOGICAL_WIDTH/2,245);ctx.fillText(anim.grade,LOGICAL_WIDTH/2,245);ctx.restore()}
  if(anim.reaction&&anim.reactionT<1.05){const p=anim.reactionT/1.05,gx=run?.realGamer?run.gulperX-anim.cameraX:(run?.gulperX||LOGICAL_WIDTH/2),bx=Math.max(92,Math.min(LOGICAL_WIDTH-92,gx+120));ctx.save();ctx.globalAlpha=Math.min(1,(1-p)*1.6);ctx.translate(bx,620-p*28);ctx.fillStyle='#fff5e7';roundedRect(-72,-22,144,44,18);ctx.fill();ctx.fillStyle='#2c2031';ctx.font='950 17px system-ui';ctx.textAlign='center';ctx.fillText(anim.reaction,0,6);ctx.restore()}
}
function updateParticles(dt){for(const p of particles){p.t+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=360*dt}particles=particles.filter(p=>p.t<p.life)}
function drawParticles(){for(const p of particles){ctx.save();ctx.globalAlpha=Math.max(0,1-p.t/p.life);ctx.fillStyle=p.kind==='bomb'?'#ff6969':p.kind==='syringe'?'#ca8cff':p.kind==='food'?'#ffd96a':'#59dbc8';ctx.beginPath();ctx.arc(p.x,p.y,4,0,Math.PI*2);ctx.fill();ctx.restore()}}
function updateFloaters(dt){for(const f of floaters)f.t+=dt;floaters=floaters.filter(f=>f.t<f.life)}
function drawFloaters(){for(const f of floaters){const p=f.t/f.life;ctx.save();ctx.globalAlpha=Math.max(0,1-p);ctx.font=f.tone==='stage'?'950 22px system-ui':'950 16px system-ui';ctx.textAlign='center';ctx.fillStyle=f.tone==='favorite'?'#ffd96a':f.tone==='perfect'?'#fff2a4':f.tone==='stage'?'#73e6d2':'#fff';ctx.strokeStyle='#111827';ctx.lineWidth=4;const y=f.y-p*58;ctx.strokeText(f.text,f.x,y);ctx.fillText(f.text,f.x,y);ctx.restore()}}
function drawLongDropPrediction(){if(!run?.longDrop||anim.phase!=='delivery-wait'||(save.longDrop?.wins||0)>0)return;const x=predictGulperX(run,longDropFallTime(run));ctx.save();ctx.globalAlpha=.48+.16*Math.sin(performance.now()/180);ctx.strokeStyle='#73cfff';ctx.lineWidth=3;ctx.setLineDash([7,7]);ctx.beginPath();ctx.ellipse(x,714,58+run.stage*5,15,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#dff5ff';ctx.font='900 9px system-ui';ctx.textAlign='center';ctx.fillText('PREDICTED LANDING',x,690);ctx.restore()}
function drawMasteryGhost(){if(!(run?.realGamer||run?.longDrop)||!run.lastDeliveryFeedback||anim.reactionT>1.05)return;const d=run.lastDeliveryFeedback;ctx.save();ctx.globalAlpha=Math.max(.18,1-anim.reactionT/1.05);ctx.lineWidth=3;ctx.strokeStyle=d.hit?'#73e6d2':'#ff8b8b';ctx.beginPath();ctx.moveTo(d.releaseX,680);ctx.lineTo(d.releaseX,735);ctx.stroke();ctx.fillStyle='#73e6d2';ctx.beginPath();ctx.arc(d.gulperX,718,7,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.font='900 10px system-ui';ctx.textAlign='center';ctx.fillText(`${Math.round(d.timingErrorMs)}ms`,(d.releaseX+d.gulperX)/2,665);if(run.personalBestTimingMs!=null){ctx.font='800 7px system-ui';ctx.fillStyle='#ffd96a';ctx.fillText(`PB ${Math.round(run.personalBestTimingMs)}ms`,(d.releaseX+d.gulperX)/2,678)}ctx.restore()}
function cameraTarget(){if(!run?.realGamer)return 0;const focus=anim.phase==='delivery-wait'||['release','feeding','delivery-miss','eating','burst'].includes(anim.phase)?(anim.dropX+run.gulperX)/2:run.clawX;return Math.max(0,Math.min(run.worldWidth-LOGICAL_WIDTH,focus-LOGICAL_WIDTH/2))}
function applyWorldCamera(renderDt=FIXED){if(!run?.realGamer)return;const target=cameraTarget(),alpha=1-Math.exp(-7.7*Math.max(0,Math.min(.05,renderDt)));anim.cameraX+=(target-anim.cameraX)*alpha;ctx.translate(-anim.cameraX,0)}
function drawGamerMiniMap(){if(!run?.realGamer)return;const x=92,y=132,w=536;ctx.save();ctx.fillStyle='#080b15cc';roundedRect(x,y,w,24,12);ctx.fill();ctx.strokeStyle='#ffffff2f';ctx.stroke();const pos=v=>x+10+(v/run.worldWidth)*(w-20);ctx.fillStyle='#ff5d86';ctx.beginPath();ctx.arc(pos(anim.phase==='delivery-wait'?anim.dropX:run.clawX),y+12,5,0,Math.PI*2);ctx.fill();ctx.fillStyle='#59dbc8';ctx.beginPath();ctx.arc(pos(run.gulperX),y+12,6,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.font='800 7px system-ui';ctx.textAlign='center';ctx.fillText('CLAW',pos(anim.phase==='delivery-wait'?anim.dropX:run.clawX),y-3);ctx.fillText('GULPER',pos(run.gulperX),y-3);ctx.restore()}
function drawLongDropMeter(){if(!run?.longDrop)return;const x=650,y=212,h=470;ctx.save();ctx.fillStyle='#07121dcc';roundedRect(x-16,y-10,34,h+20,17);ctx.fill();ctx.strokeStyle='#73cfff55';ctx.stroke();ctx.strokeStyle='#ffffff25';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+h);ctx.stroke();const p=anim.phase==='freefall'?Math.min(1,anim.t/longDropFallTime(run)):anim.phase==='delivery-wait'?0:1;ctx.fillStyle='#ffd96a';ctx.beginPath();ctx.arc(x,y+h*p,6,0,Math.PI*2);ctx.fill();ctx.fillStyle='#dff5ff';ctx.font='900 7px system-ui';ctx.textAlign='right';ctx.fillText(`${run.level.dropDistance} DROP`,x-22,y+6);ctx.restore()}
function render(now,renderDt){logicalCtx();drawMachine(now);ctx.save();applyWorldCamera(renderDt);drawItems(now);drawLongDropPrediction();drawGulper(now);drawGulperMood(now);drawFeedingDrop();drawClaw();drawBurst();drawParticles();drawFloaters();drawMasteryGhost();ctx.restore();drawGamerMiniMap();drawLongDropMeter();drawFeedback()}

function simulate(dt){
  if(!run||paused||mode!=='play')return;
  if(countdownRemaining>0){countdownRemaining=Math.max(0,countdownRemaining-dt);const text=countdownRemaining>1.55?'3':countdownRemaining>1.0?'2':countdownRemaining>.45?'1':'FEED!';$('countdown').textContent=text;$('countdown').classList.add('show');if(countdownRemaining===0){$('countdown').classList.remove('show');$('countdown').textContent='';last=performance.now()}return}else{$('countdown').classList.remove('show');$('countdown').textContent='';}
  stepRun(run,dt);anim.t+=dt;anim.reactionT+=dt;anim.shake=Math.max(0,anim.shake-dt*1.6);updateParticles(dt);updateFloaters(dt);
  if(anim.phase==='dropping'&&anim.t>=.48)resolveGrab();else if(anim.phase==='rising'&&anim.t>=.44){if(run.realGamer||run.longDrop){anim.phase='delivery-wait';run.state='delivery';anim.t=0;updateHud()}else{anim.phase='centering';anim.t=0}}else if(anim.phase==='rising-miss'&&anim.t>=.44)finishCycle();else if(anim.phase==='centering'&&anim.t>=.34){anim.phase='release';anim.t=0}else if(anim.phase==='freefall'&&anim.t>=longDropFallTime(run))resolveLongDropImpact();else if(anim.phase==='release'&&anim.t>=.13){anim.phase='feeding';anim.t=0}else if(anim.phase==='feeding'&&anim.t>=.32)finishFeed();else if(anim.phase==='delivery-miss'&&anim.t>=.46)finishCycle();else if(anim.phase==='eating'&&anim.t>=eatDuration())finishCycle();else if(anim.phase==='burst'&&anim.t>=.46)finishCycle();
  if(run.result!=='playing'&&anim.phase==='idle')showResult();updateHud();
}
function frame(now){const dt=Math.min(.1,(now-last)/1000),renderDt=Math.min(.05,Math.max(0,(now-renderLast)/1000));last=now;renderLast=now;accumulator+=dt;let steps=0;while(accumulator>=FIXED&&steps<MAX_STEPS){simulate(FIXED);accumulator-=FIXED;steps++}if(mode==='play')render(now,renderDt);requestAnimationFrame(frame)}

function pauseGame(){if(!run||mode!=='play'||paused)return;paused=true;setMusicPaused(true);$('pauseObjective').textContent=objectiveProgress(run).join(' · ');safeShowModal($('pauseDialog'))}
function resumeGame(){safeCloseDialog($('pauseDialog'));paused=false;setMusicPaused(false);last=performance.now();renderLast=last}
function restartRun(){const opts={levelId:run.level.id,endless:run.endless,daily:run.daily,challengeId:run.challengeId,realGamer:run.realGamer,longDrop:run.longDrop,seed:run.seed};safeCloseDialog($('pauseDialog'));setMusicPaused(false);startRun(opts,false,'menu')}
function quitToMenu(){safeCloseDialog($('pauseDialog'));paused=false;setMusicPaused(false);run=null;$('coachHint').hidden=true;setMode('menu')}
function openSettings(returnMode=false){modalResume=returnMode&&mode==='play'?returnMode:false;if(modalResume){paused=true;setMusicPaused(true)}syncSettings();safeShowModal($('settingsDialog'))}
function closeSettings(){safeCloseDialog($('settingsDialog'));if(modalResume==='pause'&&mode==='play'){paused=true;safeShowModal($('pauseDialog'))}else if(modalResume==='resume'&&mode==='play'){paused=false;setMusicPaused(false);last=performance.now();renderLast=last}modalResume=false}
function syncSettings(){
  applyVisualSettings();
  $('musicToggle').checked=save.settings.music;$('sfxToggle').checked=save.settings.sfx;$('hapticsToggle').checked=save.settings.haptics;$('motionToggle').checked=save.settings.reducedMotion;$('contrastToggle').checked=save.settings.highContrast;$('colorAssistToggle').checked=save.settings.colorAssist;$('campaignAssistToggle').checked=save.settings.campaignAssist;$('musicVolume').value=Math.round(save.settings.musicVolume*100);$('sfxVolume').value=Math.round(save.settings.sfxVolume*100)
}
function saveSettings(){
  const musicWas=save.settings.music;
  save.settings.music=$('musicToggle').checked;save.settings.sfx=$('sfxToggle').checked;save.settings.haptics=$('hapticsToggle').checked;save.settings.reducedMotion=$('motionToggle').checked;save.settings.highContrast=$('contrastToggle').checked;save.settings.colorAssist=$('colorAssistToggle').checked;save.settings.campaignAssist=$('campaignAssistToggle').checked;save.settings.musicVolume=Number($('musicVolume').value)/100;save.settings.sfxVolume=Number($('sfxVolume').value)/100;storeSave(save);applyVisualSettings();setMusicVolume(save.settings.musicVolume);if(musicWas!==save.settings.music)setMusic(save.settings.music,save.settings.musicVolume);if(modalResume&&mode==='play')setMusicPaused(true);renderMenu();
}
function openHelp(returnMode=false){modalResume=returnMode&&mode==='play'?returnMode:false;if(modalResume){paused=true;setMusicPaused(true)}safeShowModal($('helpDialog'))}
function closeHelp(){safeCloseDialog($('helpDialog'));if(modalResume==='resume'&&mode==='play'){paused=false;setMusicPaused(false);last=performance.now();renderLast=last}else if(modalResume==='pause'&&mode==='play'){paused=true;safeShowModal($('pauseDialog'))}modalResume=false}
function downloadSave(){const blob=new Blob([exportSave(save)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='CLAW_FEED_GULPER_SAVE.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),800);toast('SAVE EXPORTED')}
async function handleImport(file){try{if(file.size>1_000_000)throw new Error('save-too-large');save=importSave(await file.text());syncSettings();setMusic(save.settings.music,save.settings.musicVolume);renderMenu();toast('SAVE IMPORTED')}catch{toast('INVALID SAVE FILE')}}

$('gameWrap').addEventListener('pointerdown',e=>{if(e.button!==undefined&&e.button!==0)return;if(keyTargetsControl(e.target))return;e.preventDefault();drop()},{passive:false});
// Route Escape through exactly one topmost modal transition; do not let native dialog cancellation cascade.
document.addEventListener('keydown',e=>{
  if(e.code!=='Escape')return;
  const open=[...document.querySelectorAll('dialog[open]')];if(!open.length)return;
  e.preventDefault();e.stopImmediatePropagation();const top=open.at(-1);
  if(top===$('confirmResetDialog'))return safeCloseDialog(top);
  if(top===$('settingsDialog'))return closeSettings();
  if(top===$('helpDialog'))return closeHelp();
  if(top===$('creditsDialog'))return safeCloseDialog(top);
  if(top===$('pauseDialog'))return resumeGame();
  if(top===$('briefingDialog'))return $('briefingBack').click();
},{capture:true});
document.addEventListener('keydown',e=>{
  const dialogOpen=!!document.querySelector('dialog[open]');
  if((e.code==='Space'||e.code==='Enter')&&mode==='play'&&!dialogOpen&&!keyTargetsControl(e.target)){e.preventDefault();drop()}
  if(e.code==='Escape'&&mode==='play'&&!dialogOpen){e.preventDefault();pauseGame()}
});
$('pauseBtn').addEventListener('click',pauseGame);$('resumeBtn').addEventListener('click',resumeGame);$('restartBtn').addEventListener('click',restartRun);$('quitBtn').addEventListener('click',quitToMenu);$('pauseSettingsBtn').addEventListener('click',()=>{safeCloseDialog($('pauseDialog'));openSettings('pause')});
$('helpBtn').addEventListener('click',()=>openHelp('resume'));$('helpMenuBtn').addEventListener('click',()=>openHelp(false));$('helpClose').addEventListener('click',closeHelp);
$('settingsBtn').addEventListener('click',()=>openSettings(false));$('settingsClose').addEventListener('click',closeSettings);['musicToggle','sfxToggle','hapticsToggle','motionToggle','contrastToggle','colorAssistToggle','campaignAssistToggle','musicVolume','sfxVolume'].forEach(id=>$(id).addEventListener('change',()=>{saveSettings();if(id==='sfxVolume'&&save.settings.sfx)sfx('ui')}));$('musicVolume').addEventListener('input',()=>setMusicVolume(Number($('musicVolume').value)/100));
$('campaignBtn').addEventListener('click',()=>{activateAudio();openLevels()});$('backLevelBtn').addEventListener('click',()=>setMode('menu'));$('challengeBtn').addEventListener('click',()=>{activateAudio();setMode('challenges')});$('realGamerBtn').addEventListener('click',()=>{activateAudio();startRun({realGamer:true},true,'menu')});$('longDropBtn').addEventListener('click',()=>{activateAudio();startRun({longDrop:true},true,'menu')});$('backChallengeBtn').addEventListener('click',()=>setMode('menu'));$('collectionBtn').addEventListener('click',()=>setMode('collection'));$('backCollectionBtn').addEventListener('click',()=>setMode('menu'));
$('continueBtn').addEventListener('click',()=>{activateAudio();const n=Math.min(CAMPAIGN_LEVEL_COUNT,save.unlockedLevel);startRun({levelId:`claw${String(n).padStart(3,'0')}`},true,'menu')});$('endlessBtn').addEventListener('click',()=>{activateAudio();startRun({endless:true},true,'menu')});$('dailyBtn').addEventListener('click',()=>{activateAudio();startRun({daily:true},true,'menu')});
$('resultMenu').addEventListener('click',()=>setMode('menu'));$('resultReplay').addEventListener('click',()=>run&&startRun({levelId:run.level.id,endless:run.endless,daily:run.daily,challengeId:run.challengeId,realGamer:run.realGamer,longDrop:run.longDrop},false,'result'));$('resultPrimary').addEventListener('click',()=>{if(!run)return;if(run.longDrop)return startRun({longDrop:true},false,'result');if(run.realGamer)return startRun({realGamer:true},false,'result');if(run.challenge){const i=CHALLENGES.findIndex(x=>x.id===run.challengeId);if(run.result==='complete'&&i>=0&&i<CHALLENGES.length-1)return startRun({challengeId:CHALLENGES[i+1].id},true,'result');return startRun({challengeId:run.challengeId},false,'result')}if(run.endless)return startRun({endless:true},false,'result');if(run.daily)return startRun({daily:true},false,'result');const idx=LEVELS.findIndex(x=>x.id===run.level.id);if(run.result==='complete'&&idx<LEVELS.length-1)return startRun({levelId:LEVELS[idx+1].id},true,'result');startRun({levelId:run.level.id},false,'result')});
$('briefingStart').addEventListener('click',beginRun);$('briefingBack').addEventListener('click',()=>{safeCloseDialog($('briefingDialog'));paused=false;$('coachHint').hidden=true;if(briefingReturn==='result'&&briefingReturnRun){run=briefingReturnRun;resultRecorded=briefingReturnRecorded;briefingReturnRun=null;briefingReturnRecorded=false;setMode('result')}else{run=null;briefingReturnRun=null;briefingReturnRecorded=false;setMode(briefingReturn)}});
$('creditsBtn').addEventListener('click',()=>safeShowModal($('creditsDialog')));$('creditsClose').addEventListener('click',()=>safeCloseDialog($('creditsDialog')));
$('exportSaveBtn').addEventListener('click',downloadSave);$('importSaveBtn').addEventListener('click',()=>$('importSaveFile').click());$('importSaveFile').addEventListener('change',e=>{const f=e.target.files?.[0];if(f)handleImport(f);e.target.value='' });
$('resetProgressBtn').addEventListener('click',()=>safeShowModal($('confirmResetDialog')));$('cancelResetBtn').addEventListener('click',()=>safeCloseDialog($('confirmResetDialog')));$('confirmResetBtn').addEventListener('click',()=>{save=resetSave();safeCloseDialog($('confirmResetDialog'));safeCloseDialog($('settingsDialog'));syncSettings();setMusic(save.settings.music,save.settings.musicVolume);setMode('menu');toast('PROGRESS RESET')});
// Native dialog Esc/cancel must route through the same state transitions as visible buttons.
$('briefingDialog').addEventListener('cancel',e=>{e.preventDefault();$('briefingBack').click()});
$('pauseDialog').addEventListener('cancel',e=>{e.preventDefault();resumeGame()});
$('settingsDialog').addEventListener('cancel',e=>{e.preventDefault();closeSettings()});
$('helpDialog').addEventListener('cancel',e=>{e.preventDefault();closeHelp()});
$('creditsDialog').addEventListener('cancel',e=>{e.preventDefault();safeCloseDialog($('creditsDialog'))});
$('confirmResetDialog').addEventListener('cancel',e=>{e.preventDefault();safeCloseDialog($('confirmResetDialog'))});

document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='play'&&run){setMusicPaused(true);if(!paused){paused=true;if(!document.querySelector('dialog[open]'))safeShowModal($('pauseDialog'))}}});

(async function init(){
  assets=await preloadAssets(FOOD_IDS,SPECIAL_IDS);resize();setMode('menu');syncSettings();requestAnimationFrame(frame);
  if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(()=>{});
})();
