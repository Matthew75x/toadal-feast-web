// Froggy Feast transition controller — readiness-driven in-shell mode changes with a legacy navigation fallback.
(() => {
  'use strict';
  const PARAMS=Object.freeze({active:'ffTransition',mode:'ffTransitionMode',direction:'ffTransitionDirection',wait:'ffTransitionWait'});
  const MODES=Object.freeze({
    standard:Object.freeze({kicker:'TOADAL FEAST! · Arcade',title:'Opening Classic Arcade',subtitle:'Catch falling food, dodge hazards, and chase a high score.',status:'Preparing the feast…'}),
    tc:Object.freeze({kicker:'TOADAL FEAST! · Arcade',title:'Opening FEAST FRENZY',subtitle:'Gulper grows with every meal while misses stay safe.',status:'Stacking the supper rush…'}),
    fmf:Object.freeze({kicker:'TOADAL FEAST! · Arcade',title:'Opening 5 Minute Feast',subtitle:'A five-minute blitz against a score-spike deck.',status:'Starting the feast timer…'}),
    zen:Object.freeze({kicker:'TOADAL FEAST! · Arcade',title:'Opening Zen Garden',subtitle:'A calm royal garden that brightens as the kingdom returns.',status:'Letting the garden settle…'}),
    puzzle:Object.freeze({kicker:'TOADAL FEAST! · Puzzle',title:'Setting the Puzzle Pond',subtitle:'Plan the route, manage energy, and clear the board.',status:'Placing the next challenge…'}),
    feastfall:Object.freeze({kicker:'TOADAL FEAST! · Feastfall',title:'Calling the Feastfall Chorus',subtitle:'Connect matching foods and keep the rhythm growing.',status:'Gathering the chorus…'}),
    infinite:Object.freeze({kicker:'TOADAL FEAST! · Infinite Feasts',title:'Opening the Overrun Lands',subtitle:'Assign friends, reclaim plots, and expand carefully.',status:'Unrolling the marsh map…'}),
    return:Object.freeze({kicker:'TOADAL FEAST!',title:'Returning to the Pond',subtitle:'Saving your progress and restoring the full game.',status:'Bringing everything back together…'}),
    default:Object.freeze({kicker:'TOADAL FEAST!',title:'Preparing the Next Feast',subtitle:'The next part of the pond is almost ready.',status:'Making a smooth hop…'})
  });
  const SAFE_RETURN_TARGETS=new Set(['index.html','tools/dev-hosts/full/index.html']);
  const CHARACTER_ASSET='assets/images/characters/curated-highres/classic/idle.png';
  const CLASSIC_POSTER_ASSET='assets/themes/froggy-feast/loading/classic-arcade-poster.jpg';
  const MODE_SCENES=Object.freeze({
    standard:Object.freeze({layout:'classic-poster',character:CHARACTER_ASSET,emblem:'burger',stages:Object.freeze(['Preparing the feast…','Polishing the lily pads…','Calling in the food rush…','Almost ready to play…'])}),
    tc:Object.freeze({layout:'supper-rush',character:'assets/images/characters/runtime-select/gulper.png',emblem:'burger',stages:Object.freeze(['Stacking the supper rush…','Warming the heavy plates…','Setting the clean-eat streak…','Gulper is ready to feast…'])}),
    fmf:Object.freeze({layout:'sugar-sprint',character:'assets/images/characters/runtime-select/fire.png',emblem:'donut',stages:Object.freeze(['Starting the feast timer…','Charging the score sprint…','Shuffling the bonus deck…','Five minutes are almost live…'])}),
    zen:Object.freeze({layout:'garden-bounty',character:'assets/images/characters/curated-highres/princess/lilly_idle_1f_512_2026-09-08.png',emblem:'raspberry',stages:Object.freeze(['Letting the garden settle…','Arranging the garden treats…','Warming the royal lights…','The peaceful kingdom is ready…'])}),
    puzzle:Object.freeze({layout:'puzzle-pantry',character:CHARACTER_ASSET,emblem:'jewel_candy',stages:Object.freeze(['Placing the next challenge…','Sorting the pantry pieces…','Checking keys, doors, and energy…','The board is nearly ready…'])}),
    feastfall:Object.freeze({layout:'candy-cascade',character:CHARACTER_ASSET,emblem:'lollipop',stages:Object.freeze(['Gathering the chorus…','Stacking the candy cascade…','Tuning the matching rhythm…','The first chain is ready…'])}),
    infinite:Object.freeze({layout:'overrun-horizon',character:'assets/images/characters/runtime-select/pelican.png',emblem:'golden_apple',stages:Object.freeze(['Unrolling the marsh map…','Stocking the colony pantry…','Calling the next expedition…','The overrun lands are ready…'])}),
    return:Object.freeze({layout:'homecoming-feast',character:CHARACTER_ASSET,emblem:'strawberry',stages:Object.freeze(['Bringing everything back together…','Saving the latest feast…','Restoring the pond menus…','Welcome back to TOADAL FEAST!…'])}),
    default:Object.freeze({layout:'mixed-feast',character:CHARACTER_ASSET,emblem:'apple',stages:Object.freeze(['Making a smooth hop…','Gathering the next treats…','Setting the stage…','Almost ready…'])})
  });
  const FOOD_ASSET_ROOT='assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/';
  const FOOD_RUNTIME_ALIASES=Object.freeze({chocolate:'brownie'});
  const MODE_FOOD_ASSETS=Object.freeze({
    standard:Object.freeze(['apple','strawberry','watermelon_slice','mango','grapes','raspberry','burger','pizza','hot_dog','donut','cupcake','cookie','lollipop','gummy_bear','jelly_beans','cotton_candy','milkshake','jewel_candy']),
    tc:Object.freeze(['burger','pizza','hot_dog','fries','chicken_nuggets','taco','nachos','onion_rings','ramen','candycorn','cinnamon_roll','cheesecake','donut','meat','milkshake','curry','watermelon_slice','fruit_bowl']),
    fmf:Object.freeze(['donut','cupcake','cheesecake','cookie','brownie','chocolate','cinnamon_roll','macaron','mochi','milkshake','marshmallow','lollipop','gummy_bear','jelly_beans','jewel_candy','cotton_candy','strawberry','mango']),
    zen:Object.freeze(['raspberry','strawberry','grapes','kiwi','peach','mango','dragon_fruit','watermelon_slice','coconut','avocado','fruit_bowl','mochi','macaron','jewel_candy','lemon','orange','apple','golden_apple']),
    puzzle:Object.freeze(['golden_apple','apple','raspberry','strawberry','avocado','chili_pepper','coconut','cheesecake','maki_roll','salmon_nigiri','shrimp_nigiri','cookie','chocolate','jewel_candy','gummy_bear','watermelon_slice','mango','grapes']),
    feastfall:Object.freeze(['chocolate','lollipop','gummy_bear','jelly_beans','jewel_candy','marshmallow','cotton_candy','donut','cupcake','cookie','macaron','mochi','strawberry','raspberry','watermelon_slice','mango','grapes','orange']),
    infinite:Object.freeze(['fruit_bowl','apple','mango','strawberry','raspberry','watermelon_slice','coconut','burger','pizza','ramen','taco','salmon_nigiri','donut','cheesecake','milkshake','jewel_candy','golden_apple','dragon_fruit']),
    return:Object.freeze(['apple','strawberry','mango','watermelon_slice','raspberry','grapes','donut','cupcake','cookie','jewel_candy','lollipop','gummy_bear','pizza','burger','fries','milkshake','fruit_bowl','golden_apple']),
    default:Object.freeze(['apple','strawberry','mango','watermelon_slice','raspberry','grapes','donut','cupcake','cookie','jewel_candy','lollipop','gummy_bear','pizza','burger','fries','milkshake','fruit_bowl','golden_apple'])
  });
  const FOOD_LAYOUT=Object.freeze([
    ['5%','9%','74px','-14deg'],['16%','4%','92px','8deg'],['29%','8%','68px','-5deg'],['42%','3%','86px','12deg'],['56%','7%','70px','-8deg'],['70%','3%','94px','9deg'],['84%','7%','72px','-12deg'],['96%','12%','86px','8deg'],
    ['3%','35%','92px','9deg'],['13%','30%','70px','-11deg'],['27%','34%','88px','7deg'],['45%','30%','70px','-7deg'],['61%','34%','92px','11deg'],['76%','30%','74px','-9deg'],['89%','35%','94px','8deg'],['98%','43%','82px','-7deg'],
    ['3%','65%','96px','-10deg'],['15%','62%','76px','8deg'],['31%','67%','94px','-8deg'],['49%','62%','78px','10deg'],['66%','67%','98px','-10deg'],['82%','62%','82px','9deg'],['97%','68%','94px','-8deg'],
    ['5%','91%','104px','-8deg'],['20%','94%','118px','10deg'],['39%','90%','104px','-10deg'],['59%','94%','118px','8deg'],['78%','90%','108px','-9deg'],['95%','93%','112px','8deg']
  ]);
  const MIN_VISIBLE_MS=560,SLOW_AFTER_MS=9000,ASSET_READY_TIMEOUT_MS=3200,VISUAL_READY_TIMEOUT_MS=4200;
  let root=null,shownAt=0,slowTimer=0,hideTimer=0,finishTimer=0,progressTimer=0,navigationStarted=false,arrivalOptions=null,generation=0,readyGeneration=0,previousFocus=null,visualProgress=0,assetSwapSequence=0,visualReadyPromise=Promise.resolve({ready:true,results:[]});
  const decodedImageCache=new Map();
  const reducedMotion=()=>typeof DeviceCapability!=='undefined'?DeviceCapability.effectiveReducedMotion():globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches===true;
  const touchPrimary=()=>Boolean((Number(globalThis.navigator?.maxTouchPoints)||0)>0||globalThis.matchMedia?.('(pointer: coarse)')?.matches===true);
  // Transition art is presentation-only. Touch devices use the stable compact
  // composition regardless of flagship hardware so short handoffs do not spin
  // the high-refresh GPU or reveal many independently decoded images.
  const lightweightEffects=()=>reducedMotion()||touchPrimary()||globalThis.navigator?.connection?.saveData===true||(Number(globalThis.navigator?.deviceMemory)||4)<=4;
  const normalizeMode=value=>Object.prototype.hasOwnProperty.call(MODES,String(value||'').toLowerCase())?String(value||'').toLowerCase():'default';
  const configFor=mode=>MODES[normalizeMode(mode)]||MODES.default;
  const sceneFor=(mode,direction='enter')=>MODE_SCENES[direction==='return'?'return':normalizeMode(mode)]||MODE_SCENES.default;
  const progressStage=(scene,progress)=>{const stages=scene?.stages||MODE_SCENES.default.stages;const index=progress>=96?3:progress>=66?2:progress>=32?1:0;return stages[Math.min(index,stages.length-1)]||stages[0]};
  function safeReturnTarget(){const raw=new URLSearchParams(location.search).get('return')||'index.html';const base=String(raw).split(/[?#]/)[0].split('/').pop();return SAFE_RETURN_TARGETS.has(base)?base:'index.html'}
  function dispatch(name,detail={}){try{window.dispatchEvent(new CustomEvent(name,{detail}))}catch(_){}}
  function el(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=String(text);return node}
  function image(className,src=''){const node=el('img',className);node.alt='';node.decoding='async';node.loading='eager';node.draggable=false;node.hidden=true;try{node.fetchPriority='high'}catch(_){}if(src)node.src=src;return node}
  function foodAssets(mode,direction){const key=direction==='return'?'return':normalizeMode(mode);return MODE_FOOD_ASSETS[key]||MODE_FOOD_ASSETS.default}
  function foodAsset(name){const runtimeName=FOOD_RUNTIME_ALIASES[name]||name;return `${FOOD_ASSET_ROOT}food_${runtimeName}.png`}
  // Asset paths intentionally resolve through the runtime alias map; the
  // historical contract name food_${name}.png remains a documented shape.
  function withTimeout(promise,timeoutMs,label='Operation'){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error(`${label} timed out after ${timeoutMs}ms.`)),timeoutMs);Promise.resolve(promise).then(value=>{clearTimeout(timer);resolve(value)},error=>{clearTimeout(timer);reject(error)})})}
  function waitForImageLoad(img){if(img.complete)return img.naturalWidth>0?Promise.resolve(img):Promise.reject(new Error(`Image failed to load: ${img.currentSrc||img.src}`));return new Promise((resolve,reject)=>{const cleanup=()=>{img.removeEventListener('load',onLoad);img.removeEventListener('error',onError)},onLoad=()=>{cleanup();img.naturalWidth>0?resolve(img):reject(new Error(`Image has no drawable pixels: ${img.currentSrc||img.src}`))},onError=()=>{cleanup();reject(new Error(`Image failed to load: ${img.currentSrc||img.src}`))};img.addEventListener('load',onLoad,{once:true});img.addEventListener('error',onError,{once:true})})}
  async function ensureDecoded(img,timeoutMs=ASSET_READY_TIMEOUT_MS){await withTimeout(waitForImageLoad(img),timeoutMs,'Image load');if(typeof img.decode==='function')await withTimeout(img.decode(),timeoutMs,'Image decode');if(!img.complete||img.naturalWidth<=0)throw new Error(`Image is not drawable: ${img.currentSrc||img.src}`);return img}
  function loadDecodedImage(src){if(!src)return Promise.reject(new Error('Missing image source.'));if(decodedImageCache.has(src))return decodedImageCache.get(src);const task=(async()=>{const probe=new Image();probe.alt='';probe.decoding='async';try{probe.fetchPriority='high'}catch(_){}probe.src=src;await ensureDecoded(probe);return probe})();decodedImageCache.set(src,task);task.catch(()=>decodedImageCache.delete(src));return task}
  function warmImage(src){if(!src)return Promise.resolve(false);return loadDecodedImage(src).then(()=>true,()=>false)}
  async function commitDecodedSource(imgEl,src,token){if(imgEl.dataset.pendingToken!==token)return false;const previousSrc=imgEl.getAttribute('src')||'';imgEl.hidden=true;imgEl.src=src;try{await ensureDecoded(imgEl);if(imgEl.dataset.pendingToken!==token)return false;imgEl.hidden=false;return true}catch(error){if(imgEl.dataset.pendingToken===token&&previousSrc&&previousSrc!==src){imgEl.src=previousSrc;try{await ensureDecoded(imgEl,1000);imgEl.hidden=false}catch(_){imgEl.hidden=true}}throw error}}
  async function swapWhenReady(imgEl,nextSrc,options={}){if(!imgEl||!nextSrc)return false;const token=String(++assetSwapSequence);imgEl.dataset.pendingToken=token;imgEl.dataset.pendingSrc=nextSrc;const candidates=[nextSrc];if(options.fallbackSrc&&options.fallbackSrc!==nextSrc)candidates.push(options.fallbackSrc);for(const candidate of candidates){try{await loadDecodedImage(candidate);if(imgEl.dataset.pendingToken!==token)return false;const committed=await commitDecodedSource(imgEl,candidate,token);if(!committed)return false;delete imgEl.dataset.pendingSrc;delete imgEl.dataset.pendingToken;options.onSuccess?.({requestedSrc:nextSrc,committedSrc:candidate,usedFallback:candidate!==nextSrc});return true}catch(_){}}if(imgEl.dataset.pendingToken===token){delete imgEl.dataset.pendingSrc;delete imgEl.dataset.pendingToken;imgEl.hidden=true;options.onError?.({requestedSrc:nextSrc})}return false}
  function prefetchDocument(url){if(!(url instanceof URL)||!document.head)return false;let baseOrigin;try{baseOrigin=new URL(document.baseURI||location.href).origin}catch(_){baseOrigin=location.origin}if(url.origin!==baseOrigin)return false;const href=url.href;if([...document.querySelectorAll('link[data-ff-transition-prefetch]')].some(link=>link.dataset.ffTransitionPrefetch===href))return true;const link=document.createElement('link');link.rel='prefetch';link.as='document';link.href=href;link.dataset.ffTransitionPrefetch=href;document.head.append(link);return true}
  function createRoot(){
    if(root?.isConnected)return root;if(!document.body)return null;
    root=el('div','ff-transition-overlay');root.id='ffGameTransition';root.hidden=true;root.inert=true;root.setAttribute('role','status');root.setAttribute('aria-live','polite');root.setAttribute('aria-atomic','true');
    const card=el('section','ff-transition-card'),poster=el('div','ff-transition-poster'),posterImage=image('ff-transition-poster-image'),posterMask=el('span','ff-transition-poster-bar-mask'),posterTrack=el('span','ff-transition-poster-track'),posterFill=el('span','ff-transition-poster-fill'),posterSpark=el('span','ff-transition-poster-spark'),feast=el('div','ff-transition-feast'),kicker=el('p','ff-transition-kicker');kicker.dataset.ffTransitionKicker='';feast.setAttribute('aria-hidden','true');poster.setAttribute('aria-hidden','true');poster.dataset.ffTransitionPoster='';posterImage.dataset.ffTransitionPosterImage='';posterFill.dataset.ffTransitionPosterFill='';posterSpark.dataset.ffTransitionPosterSpark='';posterTrack.append(posterFill);poster.append(posterImage,posterMask,posterTrack,posterSpark);
    FOOD_LAYOUT.forEach((layout,index)=>{const food=image('ff-transition-food');food.dataset.ffTransitionFood=String(index);food.style.setProperty('--food-x',layout[0]);food.style.setProperty('--food-y',layout[1]);food.style.setProperty('--food-size',layout[2]);food.style.setProperty('--food-rotate',layout[3]);food.style.setProperty('--food-delay',`${-(index%6)*0.27}s`);feast.append(food)});
    const scene=el('div','ff-transition-scene');scene.setAttribute('aria-hidden','true');
    const glow=el('span','ff-transition-character-glow'),frog=image('ff-transition-character');frog.dataset.ffTransitionCharacter='';scene.append(glow,frog);
    const copy=el('div','ff-transition-copy'),emblem=image('ff-transition-emblem'),title=el('h1','ff-transition-title'),subtitle=el('p','ff-transition-subtitle');emblem.dataset.ffTransitionEmblem='';title.dataset.ffTransitionTitle='';subtitle.dataset.ffTransitionSubtitle='';copy.append(emblem,title,subtitle);
    const progress=el('div','ff-transition-progress'),track=el('div','ff-transition-track'),status=el('p','ff-transition-status');track.setAttribute('aria-hidden','true');status.dataset.ffTransitionStatus='';progress.append(track,status);
    const actions=el('div','ff-transition-actions'),retry=el('button','ff-transition-action ff-transition-action--primary','Try again'),back=el('button','ff-transition-action','Return to menu');retry.type='button';retry.dataset.ffTransitionRetry='';retry.addEventListener('click',()=>location.reload());back.type='button';back.dataset.ffTransitionBack='';back.addEventListener('click',()=>location.assign(new URL(safeReturnTarget(),location.href).href));actions.append(retry,back);
    card.append(poster,feast,kicker,scene,copy,progress,actions);root.append(card);document.body.prepend(root);return root;
  }
  function applyCopy(options={},currentGeneration=generation){
    const mode=normalizeMode(options.mode||arrivalOptions?.mode),direction=String(options.direction||arrivalOptions?.direction||'enter')==='return'?'return':'enter',base=direction==='return'?MODES.return:configFor(mode),scene=sceneFor(mode,direction),active=root||createRoot();
    if(!active)return null;
    active.dataset.mode=direction==='return'?'return':mode;
    active.dataset.direction=direction;
    active.dataset.effects=lightweightEffects()?'lite':'full';
    active.dataset.presentation=options.compact===true?'compact':(direction==='enter'&&mode==='standard'?'poster':'immersive');
    active.dataset.layout=scene.layout;
    active.dataset.visuals='loading';
    const posterImage=active.querySelector('[data-ff-transition-poster-image]'),frog=active.querySelector('[data-ff-transition-character]'),emblem=active.querySelector('[data-ff-transition-emblem]'),nextCharacter=String(options.characterAsset||scene.character||CHARACTER_ASSET),foods=foodAssets(mode,direction),nextEmblem=foodAsset(scene.emblem||MODE_SCENES.default.emblem),critical=[],decorative=[];
    if(posterImage){
      if(active.dataset.presentation==='poster')critical.push(swapWhenReady(posterImage,CLASSIC_POSTER_ASSET,{onError:()=>{if(currentGeneration===generation)active.dataset.posterError='true'},onSuccess:()=>{if(currentGeneration===generation)delete active.dataset.posterError}}));
      else posterImage.hidden=true;
    }
    if(frog){
      const sceneEl=frog.closest('.ff-transition-scene');
      if(sceneEl)delete sceneEl.dataset.characterError;
      critical.push(swapWhenReady(frog,nextCharacter,{fallbackSrc:CHARACTER_ASSET,onError:()=>{if(currentGeneration===generation&&sceneEl)sceneEl.dataset.characterError='true'},onSuccess:()=>{if(currentGeneration===generation&&sceneEl)delete sceneEl.dataset.characterError}}));
    }
    if(emblem)critical.push(swapWhenReady(emblem,nextEmblem,{fallbackSrc:foodAsset(MODE_SCENES.default.emblem)}));
    const maxDecorative=active.dataset.presentation==='compact'?0:(active.dataset.effects==='lite'?10:FOOD_LAYOUT.length);
    active.querySelectorAll('[data-ff-transition-food]').forEach((food,index)=>{
      if(index>=maxDecorative){food.hidden=true;return;}
      const next=foodAsset(foods[index%foods.length]);
      decorative.push(swapWhenReady(food,next));
    });
    active.querySelector('[data-ff-transition-kicker]').textContent=options.kicker||base.kicker;
    active.querySelector('[data-ff-transition-title]').textContent=options.title||base.title;
    active.querySelector('[data-ff-transition-subtitle]').textContent=options.subtitle||base.subtitle;
    active.querySelector('[data-ff-transition-status]').textContent=options.status||progressStage(scene,0);
    active.dataset.progressMode=options.progressMode==='real'?'real':'simulated';
    const visualReady=withTimeout(Promise.all([...critical,...decorative]),VISUAL_READY_TIMEOUT_MS,'Transition visuals').then(results=>{
      const criticalResults=results.slice(0,critical.length),ready=criticalResults.every(Boolean);
      if(currentGeneration===generation){
        active.dataset.visuals=ready?'ready':'fallback';
        dispatch('froggyfeast:transition-visuals-ready',{mode:active.dataset.mode,direction:active.dataset.direction,ready,results,criticalCount:critical.length,decorativeCount:decorative.length});
      }
      return{ready,results};
    }).catch(error=>{
      if(currentGeneration===generation){
        active.dataset.visuals='fallback';
        dispatch('froggyfeast:transition-visuals-ready',{mode:active.dataset.mode,direction:active.dataset.direction,ready:false,timedOut:true,message:String(error?.message||error)});
      }
      return{ready:false,results:[],timedOut:true};
    });
    return{active,visualReady};
  }
  function clearTimers(){clearTimeout(slowTimer);clearTimeout(hideTimer);clearTimeout(finishTimer);clearInterval(progressTimer);slowTimer=hideTimer=finishTimer=progressTimer=0}
  function focusRecovery(){const focus=()=>root?.querySelector('[data-ff-transition-retry]')?.focus?.({preventScroll:true});focus();if(typeof requestAnimationFrame==='function')requestAnimationFrame(focus);else setTimeout(focus,0)}
  function setProgress(value){
    visualProgress=Math.max(0,Math.min(100,Number(value)||0));
    if(!root)return visualProgress;
    root.style.setProperty('--ff-transition-progress',`${visualProgress}%`);
    const fill=root.querySelector('[data-ff-transition-poster-fill]'),spark=root.querySelector('[data-ff-transition-poster-spark]');
    if(fill)fill.style.width=`${visualProgress}%`;
    if(spark){spark.style.left=`${visualProgress}%`;spark.style.opacity=visualProgress>1.5&&visualProgress<99?'1':'0'}
    if(root.dataset.state!=='slow'&&root.dataset.state!=='error'){
      const status=root.querySelector('[data-ff-transition-status]'),scene=sceneFor(root.dataset.mode,root.dataset.direction);
      if(status)status.textContent=progressStage(scene,visualProgress);
    }
    root.setAttribute('aria-valuemin','0');root.setAttribute('aria-valuemax','100');root.setAttribute('aria-valuenow',String(Math.round(visualProgress)));
    return visualProgress;
  }
  function startProgress(){clearInterval(progressTimer);setProgress(8);if(reducedMotion())return;progressTimer=setInterval(()=>{if(!root||root.hidden||root.dataset.state==='leaving'||root.dataset.state==='error'){clearInterval(progressTimer);progressTimer=0;return}const ceiling=root.dataset.state==='slow'?94:88;if(visualProgress>=ceiling)return;const remaining=ceiling-visualProgress;setProgress(visualProgress+Math.max(.45,remaining*.075))},180)}
  function beginSlowTimer(){clearTimeout(slowTimer);const current=generation;slowTimer=setTimeout(()=>{if(current!==generation||!root||root.hidden||root.dataset.state==='leaving')return;root.dataset.state='slow';setProgress(Math.max(visualProgress,92));const status=root.querySelector('[data-ff-transition-status]');if(status)status.textContent='This is taking longer than expected. You can retry or return safely.';root.setAttribute('role','alert');focusRecovery()},SLOW_AFTER_MS)}
  function show(options={}){const active=createRoot();if(!active){document.addEventListener('DOMContentLoaded',()=>show(options),{once:true});return false}generation+=1;readyGeneration=0;clearTimers();const applied=applyCopy(options,generation);if(!applied)return false;visualReadyPromise=applied.visualReady;previousFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;shownAt=performance.now();active.hidden=false;active.inert=false;active.removeAttribute('aria-hidden');active.dataset.state='visible';active.setAttribute('role','status');document.body.setAttribute('aria-busy','true');document.documentElement.dataset.ffTransitionActive='true';if(options.progressMode==='real')setProgress(Number(options.initialProgress)||6);else startProgress();beginSlowTimer();const detail={mode:active.dataset.mode,direction:active.dataset.direction};dispatch('froggyfeast:transition-shown',detail);dispatch('froggyfeast:transition-audio-cue',{...detail,cue:'depart'});return true}
  function hide(options={}){if(!root||root.hidden)return false;clearTimeout(slowTimer);const current=generation,elapsed=performance.now()-shownAt,minimum=reducedMotion()?80:Number(options.minimumMs??MIN_VISIBLE_MS),delay=Math.max(0,minimum-elapsed);clearTimeout(hideTimer);hideTimer=setTimeout(()=>{if(current!==generation||!root)return;root.dataset.state='leaving';finishTimer=setTimeout(()=>{if(current!==generation||!root)return;root.hidden=true;root.inert=true;root.setAttribute('aria-hidden','true');root.dataset.state='hidden';document.body?.removeAttribute('aria-busy');delete document.documentElement.dataset.ffTransitionActive;dispatch('froggyfeast:transition-hidden',options.detail||{});if(previousFocus?.isConnected)previousFocus.focus?.({preventScroll:true});previousFocus=null},reducedMotion()?90:240)},delay);return true}
  function finishReady(detail,current){if(current!==generation||!root||root.hidden||root.dataset.state==='error')return false;setProgress(100);dispatch('froggyfeast:transition-ready',detail);dispatch('froggyfeast:transition-audio-cue',{...detail,cue:'arrive'});clearInterval(progressTimer);progressTimer=0;setTimeout(()=>hide({detail,minimumMs:Math.max(MIN_VISIBLE_MS,720)}),reducedMotion()?0:140);return true}
  function markReady(detail={}){if(!root||root.hidden||root.dataset.state==='error')return false;const current=generation;if(readyGeneration===current)return true;readyGeneration=current;clearInterval(progressTimer);progressTimer=0;setProgress(Math.max(visualProgress,96));const status=root.querySelector('[data-ff-transition-status]');if(status)status.textContent='Finishing the scene…';Promise.resolve(visualReadyPromise).catch(()=>({ready:false,results:[]})).then(()=>finishReady(detail,current));return true}
  function markError(message='The next screen could not finish loading.'){const active=root||createRoot();if(!active)return false;if(active.hidden)show(arrivalOptions||{});generation+=1;readyGeneration=0;visualReadyPromise=Promise.resolve({ready:false,results:[]});clearTimers();active.hidden=false;active.inert=false;active.removeAttribute('aria-hidden');active.dataset.state='error';active.dataset.presentation='immersive';setProgress(100);active.setAttribute('role','alert');active.querySelector('[data-ff-transition-title]').textContent='The hop was interrupted';active.querySelector('[data-ff-transition-subtitle]').textContent=String(message||'The next screen could not finish loading.');active.querySelector('[data-ff-transition-status]').textContent='Your saved progress is safe.';focusRecovery();dispatch('froggyfeast:transition-error',{message:String(message||'')});dispatch('froggyfeast:transition-audio-cue',{cue:'error'});return true}
  function decorateTarget(target,options={}){const url=target instanceof URL?new URL(target.href):new URL(String(target),document.baseURI||location.href);url.searchParams.set(PARAMS.active,'1');url.searchParams.set(PARAMS.mode,normalizeMode(options.mode));url.searchParams.set(PARAMS.direction,options.direction==='return'?'return':'enter');url.searchParams.set(PARAMS.wait,options.wait==='explicit'?'explicit':'auto');return url}
  function prepare(target,options={}){const url=decorateTarget(target,options);prefetchDocument(url);const mode=normalizeMode(options.mode),direction=options.direction==='return'?'return':'enter',scene=sceneFor(mode,direction);if(direction==='enter'&&mode==='standard')warmImage(CLASSIC_POSTER_ASSET);else{warmImage(String(options.characterAsset||scene.character||CHARACTER_ASSET));warmImage(foodAsset(scene.emblem||MODE_SCENES.default.emblem));foodAssets(mode,direction).forEach(name=>warmImage(foodAsset(name)))}return url.href}
  function navigate(target,options={}){if(navigationStarted)return false;navigationStarted=true;const url=decorateTarget(target,options);prepare(url,options);show(options);const delay=reducedMotion()?90:Math.max(180,Number(options.departureMs||360));setTimeout(()=>location.assign(url.href),delay);return url.href}

  async function runTask(options={},task){
    if(typeof task!=='function')throw new TypeError('GameTransitionOverlay.runTask requires a task function.');
    const showAfter=Math.max(0,Number(options.showAfterMs??220));
    const minimum=Math.max(0,Number(options.minimumMs??120));
    let shown=false,finished=false,showTimer=0;
    const report=update=>{
      const info=typeof update==='string'?{label:update}:(update||{});
      if(!shown||!root||root.hidden)return info;
      if(Number.isFinite(Number(info.progress)))setProgress(Number(info.progress));
      const status=root.querySelector('[data-ff-transition-status]');
      if(status&&info.label)status.textContent=String(info.label);
      dispatch('froggyfeast:transition-task-progress',{mode:root.dataset.mode,stage:info.stage||'',label:info.label||'',progress:visualProgress});
      return info;
    };
    const reveal=()=>{
      if(finished||shown)return;
      shown=show({...options,progressMode:'real',compact:options.compact!==false});
      if(shown)report({stage:'preparing',label:options.status||'Preparing the next mode…',progress:Number(options.initialProgress)||6});
    };
    showTimer=setTimeout(reveal,showAfter);
    try{
      const result=await task(report);
      finished=true;clearTimeout(showTimer);
      if(shown){report({stage:'ready',label:'Ready',progress:100});hide({detail:{source:'task',mode:options.mode},minimumMs:minimum});}
      return result;
    }catch(error){
      clearTimeout(showTimer);
      if(!shown){finished=false;reveal();}
      finished=true;
      markError(error?.message||String(error));
      throw error;
    }
  }

  function scrubTransitionParams(){if(!history.replaceState)return;const url=new URL(location.href);let changed=false;Object.values(PARAMS).forEach(name=>{if(url.searchParams.has(name)){url.searchParams.delete(name);changed=true}});if(changed){try{history.replaceState(history.state,'',`${url.pathname}${url.search}${url.hash}`)}catch(_){}}}
  function bootstrapArrival(){const params=new URLSearchParams(location.search);if(params.get(PARAMS.active)!=='1')return;arrivalOptions={mode:normalizeMode(params.get(PARAMS.mode)),direction:params.get(PARAMS.direction)==='return'?'return':'enter',wait:params.get(PARAMS.wait)==='explicit'?'explicit':'auto'};const begin=()=>{show(arrivalOptions);scrubTransitionParams();if(arrivalOptions.wait==='auto'){if(document.readyState==='complete')setTimeout(()=>markReady({source:'window-load'}),0);else window.addEventListener('load',()=>markReady({source:'window-load'}),{once:true})}};if(document.body)begin();else document.addEventListener('DOMContentLoaded',begin,{once:true})}
  const api=Object.freeze({show,hide,markReady,markError,prepare,navigate,runTask,decorateTarget,setProgress,whenVisualReady:()=>visualReadyPromise,get progress(){return visualProgress},get active(){return!!root&&!root.hidden},get arrival(){return arrivalOptions?{...arrivalOptions}:null}});globalThis.GameTransitionOverlay=api;bootstrapArrival();
})();
