// Specialized pooled presentation effect. No wallet, inventory, scoring, or RNG authority.
const RewardCoinCelebration = (() => {
  const PRESETS = Object.freeze({ SMALL_REWARD:{count:16,rain:0,duration:1.4}, NORMAL_REWARD:{count:30,rain:.25,duration:1.9},
    BIG_REWARD:{count:54,rain:.4,duration:2.4}, JACKPOT:{count:90,rain:.48,duration:3.2} });
  class Emitter {
    constructor(capacity=120) {
      this.pool=Array.from({length:Math.max(1,Math.min(120,capacity))},()=>({active:false,x:0,y:0,vx:0,vy:0,gravity:0,scale:1,
        rotationZ:0,spinPhase:0,spinHz:0,age:0,lifetime:0,alpha:1,depthTier:1,delay:0,rain:false}));
      this.active=false;this.elapsed=0;this.duration=0;this.width=480;this.height=800;this.seed=1;this.callback=null;this.reduced=false;this.avoidRects=[];
    }
    random(){let x=this.seed;x^=x<<13;x^=x>>>17;x^=x<<5;this.seed=x>>>0;return this.seed/4294967296;}
    play(name,x,y,options={}) {
      this.stopAll();
      const preset=PRESETS[name]||PRESETS.NORMAL_REWARD;
      this.width=Math.max(1,Number(options.width)||480);this.height=Math.max(1,Number(options.height)||800);
      x=Math.max(0,Math.min(this.width,Number(x)||0));y=Math.max(0,Math.min(this.height,Number(y)||0));
      this.seed=(Number(options.seed)>>>0)||((Date.now()^0x9e3779b9)>>>0)||1;
      this.reduced=!!options.reducedMotion;this.elapsed=0;this.duration=this.reduced?.65:preset.duration;
      this.avoidRects=Array.isArray(options.avoidRects)?options.avoidRects:[];
      this.callback=typeof options.onComplete==='function'?options.onComplete:null;
      const quality=Math.max(.25,Math.min(1,Number(options.quality)||1));
      const count=Math.min(this.pool.length,Math.round(preset.count*(this.reduced?.22:quality)));
      const rainCount=this.reduced?0:Math.round(count*preset.rain),burstCount=count-rainCount;
      const unit=Math.min(this.width/480,this.height/800,1.5);
      for(let i=0;i<count;i++) {
        const p=this.pool[i],tier=this.random(),depth=tier<.25?0:tier<.85||quality<=.5?1:2;
        p.active=true;p.age=0;p.depthTier=depth;p.rain=i>=burstCount;
        p.scale=(depth===0?.45+this.random()*.25:depth===1?.7+this.random()*.3:1.05+this.random()*.3)*unit;
        p.alpha=depth===0?.82:1;p.rotationZ=(this.random()-.5)*.7;
        p.spinPhase=this.random()*Math.PI*2;p.spinHz=this.reduced?0:1.5+this.random()*3;
        p.delay=p.rain?.38+(i-burstCount)/Math.max(1,rainCount-1)*.7:0;
        p.lifetime=this.duration-p.delay;
        p.x=p.rain?24+(this.width-48)*this.random():x+(this.random()-.5)*(this.reduced?36:120)*unit;
        p.y=p.rain?-30*unit:y+(this.random()-.5)*24*unit;
        p.vx=this.reduced?0:(this.random()-.5)*(p.rain?180:700)*unit;
        p.vy=this.reduced?0:(p.rain?220+this.random()*260:-500-this.random()*400)*unit;
        p.gravity=this.reduced?0:(p.rain?250+this.random()*400:900+this.random()*500)*unit;
      }
      this.active=count>0;return count;
    }
    update(dt) {
      if(!this.active)return;
      const delta=Math.max(0,Math.min(.05,Number(dt)||0));this.elapsed+=delta;
      for(const p of this.pool) {
        if(!p.active||this.elapsed<p.delay)continue;
        const step=Math.min(delta,this.elapsed-p.delay);p.age+=step;
        p.vy+=p.gravity*step;p.x+=p.vx*step;p.y+=p.vy*step;
        if(p.age>=p.lifetime||p.y>this.height+80||p.x< -100||p.x>this.width+100)p.active=false;
      }
      if(this.elapsed>=this.duration)this.stopAll();
    }
    render(ctx,image) {
      if(!this.active||!image?.naturalWidth)return;
      for(let depth=0;depth<3;depth++)for(const p of this.pool) {
        if(!p.active||p.depthTier!==depth||this.elapsed<p.delay)continue;
        const size=32*p.scale,edge=this.reduced?1:Math.max(.13,Math.abs(Math.cos(p.spinPhase+p.age*p.spinHz*Math.PI*2)));
        const left=p.x-size*edge*.5,right=p.x+size*edge*.5,top=p.y-size*.5,bottom=p.y+size*.5;
        if(this.avoidRects.some(rect=>right>rect.left&&left<rect.right&&bottom>rect.top&&top<rect.bottom))continue;
        ctx.save();ctx.globalAlpha=p.alpha*Math.min(1,(p.lifetime-p.age)/.2);
        ctx.translate(p.x,p.y);ctx.rotate(p.rotationZ);ctx.drawImage(image,-size*edge/2,-size/2,size*edge,size);ctx.restore();
      }
    }
    stopAll(){this.active=false;this.avoidRects=[];for(const p of this.pool)p.active=false;const fn=this.callback;this.callback=null;if(fn)try{fn();}catch(_){} }
    reset(){this.stopAll();this.elapsed=0;}
    snapshot(){return {active:this.active,count:this.pool.filter(p=>p.active).length,capacity:this.pool.length,elapsed:this.elapsed};}
  }
  const emitter=new Emitter(typeof navigator!=='undefined'&&navigator.maxTouchPoints>0?72:120);
  let canvas=null,ctx=null,host=null,raf=0,last=0,frameAverage=16.7,resizeObserver=null,resizePending=false;
  let pendingRunCoins=0;
  const image=typeof Image==='function'?new Image():null;
  const ARCADE_MODES=new Set(['standard','tc','fmf','zen']);
  // These are the only durable coin grants that belong to an Arcade reward
  // presentation. Keeping this allow-list explicit prevents shared economy
  // events (daily goals, puzzle rewards, commerce, etc.) from leaking into
  // the Arcade surface while still covering every Arcade-owned payout path.
  const ARCADE_REWARD_REASONS=new Set([
    'scoreConversion',
    'giftBox',
    'giftBoxFallback',
    'feastOrderComplete',
    'feastStampPlate',
    'arcadeRevengeComplete',
    'achievement',
  ]);
  function isArcadeContext(){
    // GameState is a classic-script lexical binding in the main build, so it
    // is not guaranteed to be an own property of globalThis.
    const mode=String(typeof GameState!=='undefined' ? GameState.currentMode : globalThis.GameState?.currentMode || '').toLowerCase();
    if(!ARCADE_MODES.has(mode)) return false;
    const state=typeof GameState!=='undefined' ? GameState.mode : globalThis.GameState?.mode;
    const playing=typeof GAME_MODES!=='undefined' ? GAME_MODES.PLAYING : 'playing';
    const paused=typeof GAME_MODES!=='undefined' ? GAME_MODES.PAUSED : 'paused';
    const dead=typeof GAME_MODES!=='undefined' ? GAME_MODES.DEAD : 'dead';
    return state===playing||state===paused||state===dead;
  }
  if(image){image.decoding='async';image.src='assets/images/effects/crown-coin.png';}
  function reduced(){return (typeof SETTINGS!=='undefined'&&SETTINGS.reduceMotion)||globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;}
  function criticalRects(target,rect){
    return [...target?.querySelectorAll?.('.go-title,.go-sub,.go-score,.arcade-result-title,.arcade-result-subtitle,.arcade-result-rules')||[]]
      .map(el=>{const r=el.getBoundingClientRect();return {left:r.left-rect.left-4,top:r.top-rect.top-4,right:r.right-rect.left+4,bottom:r.bottom-rect.top+4};})
      .filter(r=>r.right>0&&r.bottom>0&&r.left<canvas.width&&r.top<canvas.height);
  }
  function resizeActiveLayer(){
    if(!canvas||!host?.isConnected)return;
    const rect=host.getBoundingClientRect(),nextW=Math.max(1,Math.round(rect.width)),nextH=Math.max(1,Math.round(rect.height));
    if(nextW===canvas.width&&nextH===canvas.height)return;
    const sx=nextW/canvas.width,sy=nextH/canvas.height;
    canvas.width=nextW;canvas.height=nextH;emitter.width=nextW;emitter.height=nextH;
    for(const p of emitter.pool)if(p.active){p.x*=sx;p.y*=sy;}
    emitter.avoidRects=criticalRects(host,rect);
  }
  function stopAll(){cancelAnimationFrame(raf);raf=0;last=0;resizeObserver?.disconnect?.();resizeObserver=null;resizePending=false;emitter.stopAll();canvas?.remove();canvas=null;ctx=null;host=null;}
  function syncCanvasSize(){
    if(!resizePending||!canvas||!host)return;
    resizePending=false;
    const rect=host.getBoundingClientRect();
    const width=Math.max(1,Math.round(rect.width)),height=Math.max(1,Math.round(rect.height));
    if(width===canvas.width&&height===canvas.height)return;
    const sx=canvas.width>0?width/canvas.width:1,sy=canvas.height>0?height/canvas.height:1;
    canvas.width=width;canvas.height=height;
    emitter.width=width;emitter.height=height;
    for(const p of emitter.pool){if(!p.active)continue;p.x*=sx;p.y*=sy;p.vx*=sx;p.vy*=sy;p.gravity*=sy;}
    emitter.avoidRects=criticalRects(host,rect);
  }
  function frame(now){
    if(!host?.isConnected||host.hidden||host.classList.contains('hidden')){stopAll();return;}
    syncCanvasSize();
    if(document.hidden || (host.id==='canvasWrapper'&&typeof GameState!=='undefined'&&GameState.mode===GAME_MODES.PAUSED)){
      last=0;raf=requestAnimationFrame(frame);return;
    }
    const elapsed=last?Math.max(0,now-last):0;last=now;
    if(elapsed>0)frameAverage=frameAverage*.9+Math.min(100,elapsed)*.1;
    if(reduced()&&!emitter.reduced){stopAll();return;}
    emitter.update(elapsed/1000);ctx.clearRect(0,0,canvas.width,canvas.height);emitter.render(ctx,image);
    if(emitter.active)raf=requestAnimationFrame(frame);else stopAll();
  }
  function play(name,x,y,options={}){
    try {
      stopAll();host=options.layer||document.getElementById('canvasWrapper');if(!host)return false;
      canvas=document.createElement('canvas');canvas.className='reward-coin-layer';canvas.setAttribute('aria-hidden','true');
      const rect=host.getBoundingClientRect();canvas.width=Math.max(1,Math.round(rect.width));canvas.height=Math.max(1,Math.round(rect.height));
      canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;';
      host.prepend(canvas);ctx=canvas.getContext('2d');if(!ctx){stopAll();return false;}
      resizePending=false;
      if(typeof ResizeObserver==='function'){
        resizeObserver=new ResizeObserver(()=>{resizePending=true;});
        resizeObserver.observe(host);
      }
      const budget=globalThis.FroggyEnginePerformance?.budgetForMode?.('arcade');
      const quality=Math.min(Number(budget?.particleScale)||1,frameAverage>28?.5:frameAverage>20?.75:1);
      const critical=criticalRects(host,rect);
      emitter.play(name,x==null?canvas.width/2:x,y==null?canvas.height*.65:y,
        {width:canvas.width,height:canvas.height,seed:options.seed,reducedMotion:options.reducedMotion??reduced(),quality,avoidRects:critical,onComplete:options.onComplete});
      raf=requestAnimationFrame(frame);return true;
    }catch(_){stopAll();return false;}
  }
  if(typeof window!=='undefined')window.addEventListener('resize',resizeActiveLayer,{passive:true});
  function playAtCanvas(name,sourceCtx,x,y){
    const source=sourceCtx.canvas,layer=document.getElementById('canvasWrapper');if(!source||!layer)return false;
    const rect=source.getBoundingClientRect(),outer=layer.getBoundingClientRect();
    const matrix=sourceCtx.getTransform?.();
    const px=matrix?matrix.a*x+matrix.c*y+matrix.e:x,py=matrix?matrix.b*x+matrix.d*y+matrix.f:y;
    return play(name,rect.left-outer.left+px/source.width*rect.width,rect.top-outer.top+py/source.height*rect.height,{layer});
  }
  function showBanked(layer){
    const amount=pendingRunCoins;pendingRunCoins=0;
    if(amount<=0)return;
    const hostLayer=layer||document.getElementById('canvasWrapper');
    const target=hostLayer?.querySelector?.('.go-coins,.arcade-result-payout');
    let x=null,y=null;
    if(target&&hostLayer){
      const a=target.getBoundingClientRect(),b=hostLayer.getBoundingClientRect();
      x=a.left+a.width*.5-b.left;y=a.top+a.height*.5-b.top;
    }
    play(amount>=100?'BIG_REWARD':'NORMAL_REWARD',x,y,{layer:hostLayer});
  }
  if(typeof EventBus!=='undefined'){
    EventBus.on('coinsAwarded',payload=>{
      // Economy events are shared by Puzzle, Feastfall, and Arcade. The shower
      // belongs only to the Arcade presentation surface and never becomes an
      // alternate reward authority.
      const reason=String(payload?.reason||'');
      if(!isArcadeContext()||!ARCADE_REWARD_REASONS.has(reason)) return;
      const amount=Math.max(0,Math.floor(Number(payload?.amount)||0));
      if(amount<=0) return;
      const state=typeof GameState!=='undefined' ? GameState.mode : globalThis.GameState?.mode;
      const dead=typeof GAME_MODES!=='undefined' ? GAME_MODES.DEAD : 'dead';
      // Terminal payouts (score conversion, achievement, revenge completion)
      // are queued until the result card is visible so the shower stays in
      // front of the result UI and reflects one durable settlement.
      if(reason==='scoreConversion'||state===dead){
        pendingRunCoins=Math.min(9999,pendingRunCoins+amount);
        return;
      }
      play(amount>=100?'BIG_REWARD':'NORMAL_REWARD');
    });
    EventBus.on('gameStarted',()=>{pendingRunCoins=0;stopAll();});
    EventBus.on('lifecycleInterruption',()=>{last=0;});
  }
  return Object.freeze({Emitter,PRESETS,play,playAtCanvas,showBanked,stopAll,reset:stopAll,snapshot:()=>emitter.snapshot()});
})();
globalThis.RewardCoinCelebration=RewardCoinCelebration;
