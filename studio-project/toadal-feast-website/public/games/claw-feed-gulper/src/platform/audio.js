const clips={grab:'assets/audio/crumb.wav',eat:'assets/audio/savory.wav',perfect:'assets/audio/premium.wav',miss:'assets/audio/rice.wav',special:'assets/audio/sugar.wav',bomb:'assets/audio/rice.wav',level:'assets/audio/juice.wav',ui:'assets/audio/crumb.wav'};
const cache=new Map();
let musicTimer=null,musicCtx=null,musicStep=0,musicVolume=.55,musicEnabled=false,musicPaused=false,intensity=0,musicScene='menu';
const SCENES={
  menu:{melody:[523.25,659.25,783.99,659.25,587.33,698.46,783.99,659.25],roots:[130.81,146.83,174.61,146.83],gain:.82,air:.35},
  campaign:{melody:[523.25,659.25,783.99,880,783.99,698.46,659.25,587.33],roots:[130.81,174.61,146.83,196],gain:1,air:.5},
  challenge:{melody:[587.33,698.46,880,698.46,659.25,783.99,932.33,783.99],roots:[146.83,174.61,196,164.81],gain:1.06,air:.66},
  gamer:{melody:[659.25,783.99,987.77,880,698.46,880,1046.5,987.77],roots:[164.81,196,146.83,220],gain:1.08,air:.75},
  longdrop:{melody:[493.88,587.33,698.46,783.99,698.46,587.33,523.25,659.25],roots:[123.47,146.83,174.61,130.81],gain:.98,air:.52},
  flight:{melody:[783.99,0,698.46,0,659.25,0,587.33,0],roots:[123.47,0,130.81,0],gain:.62,air:.22},
  danger:{melody:[698.46,880,783.99,987.77,880,1046.5,987.77,1174.66],roots:[174.61,196,220,196],gain:1.12,air:.9},
  result:{melody:[523.25,659.25,783.99,1046.5,783.99,659.25,698.46,880],roots:[130.81,174.61,196,261.63],gain:.9,air:.46}
};
function audio(name){let a=cache.get(name);if(!a){a=new Audio(clips[name]||clips.grab);a.preload='auto';cache.set(name,a);}return a;}
export function playSfx(name,enabled=true,volume=.72,pitch=1){
  if(!enabled)return;
  try{const base=audio(name),a=base.cloneNode(true);const mul=name==='eat'?.60:name==='bomb'?.78:name==='perfect'?.86:.66;a.volume=Math.max(0,Math.min(1,volume*mul));a.playbackRate=Math.max(.72,Math.min(1.28,Number(pitch)||1));a.play().catch(()=>{});}catch{}
}
function note(freq,duration=.24,gain=.022,type='triangle',offset=0){
  if(!musicCtx||!freq)return;const t=musicCtx.currentTime+offset,o=musicCtx.createOscillator(),g=musicCtx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,gain*musicVolume),t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g).connect(musicCtx.destination);o.start(t);o.stop(t+duration+.02);
}
function musicTick(){
  if(!musicCtx||!musicEnabled||musicPaused)return;
  const scene=SCENES[musicScene]||SCENES.campaign,m=scene.melody[musicStep%scene.melody.length],root=scene.roots[Math.floor(musicStep/4)%scene.roots.length];
  const pulse=.020*scene.gain*(.88+intensity*.22);note(m,.18,pulse,'sine');
  if(musicStep%2===0&&m)note(m/2,.12,.009*scene.gain,'triangle',.04);
  if(musicStep%4===0)note(root,.34,.012*scene.gain,'sine',.01);
  if(scene.air>.5&&musicStep%2===1&&m)note(m*1.5,.07,.0045*scene.air*(.5+intensity*.8),'sine',.08);
  if(intensity>.72&&musicStep%4===3&&m)note(m*2,.05,.0035,'square',.12);
  musicStep++;
}
export function stopMusic(){if(musicTimer){clearInterval(musicTimer);musicTimer=null;}if(musicCtx){try{musicCtx.close()}catch{}musicCtx=null;}musicPaused=false;}
export function startMusic(enabled=true,volume=.55){musicEnabled=!!enabled;musicVolume=Math.max(0,Math.min(1,Number(volume)||0));if(!musicEnabled||musicTimer)return;try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;musicCtx=new AC();musicStep=0;musicTick();musicTimer=setInterval(musicTick,260);}catch{}}
export function setMusic(enabled,volume=musicVolume){musicEnabled=!!enabled;musicVolume=Math.max(0,Math.min(1,Number(volume)||0));stopMusic();if(musicEnabled)startMusic(true,musicVolume);}
export function setMusicVolume(volume){musicVolume=Math.max(0,Math.min(1,Number(volume)||0));}
export function setMusicIntensity(v){intensity=Math.max(0,Math.min(1,Number(v)||0));}
export function setMusicScene(scene){if(SCENES[scene])musicScene=scene;}
export function getMusicScene(){return musicScene;}
export function setMusicPaused(paused){musicPaused=!!paused;if(!musicCtx)return;try{const op=musicPaused?musicCtx.suspend():musicCtx.resume();op?.catch?.(()=>{});}catch{}}
