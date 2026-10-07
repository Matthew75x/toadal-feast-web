from pathlib import Path
import json,re,shutil
p=Path(r'C:\Users\Metarator\.codex\visualizations\2026\10\06\01a112c4-59eb-7f80-a3b5-4d5b10ea925c\game-challenge-directions.html')
assets=json.loads(Path('work/share-decoration-assets/preview-encodings/inline-assets.json').read_text())
s=p.read_text(encoding='utf-8')
backup=Path('work/original-share-card-before-native-assortment.html')
if not backup.exists(): shutil.copyfile(p,backup)
poses=[
('pizza',-3,3,74,-16),('apple',9,-2,71,9),('grapes',21,8,73,-10),('donut',33,0,70,13),('strawberry',45,8,65,-9),('cookie',57,-2,77,16),('banana',69,9,74,-12),('fries',81,0,75,12),('orange',94,9,76,-13),('blueberry',104,-1,55,7),
('hot_dog',-2,33,76,-20),('cupcake',10,27,70,9),('macaron',24,38,69,-14),('orange',36,27,74,18),('burger',49,37,80,-7),('blueberry',62,27,56,12),('pizza',75,37,77,16),('apple',88,29,73,-14),('donut',102,40,71,17),
('grapes',3,65,75,12),('cookie',16,54,73,-15),('banana',29,68,76,13),('fries',43,57,73,-17),('cupcake',55,65,72,14),('hot_dog',67,54,74,-14),('strawberry',79,65,66,12),('macaron',91,56,70,16),('burger',103,71,78,-9),
('strawberry',-2,96,67,-11),('apple',10,88,74,13),('pizza',23,99,76,-13),('grapes',37,88,73,12),('donut',49,99,71,-17),('orange',62,88,75,11),('cookie',74,101,75,-14),('banana',86,90,76,16),('fries',100,98,74,-12)]
variables='#tf-share-directions{'+''.join('--tf-food-'+k+':url('+v['uri']+');' for k,v in assets['foods'].items())+'}\n'
css='''
#tf-share-directions .tf-card:before{content:none}
#tf-share-directions .tf-food-backdrop{position:absolute;inset:0;z-index:-1;pointer-events:none;opacity:var(--tf-decor-strength,.64);mask-image:linear-gradient(90deg,#000b,#000b 44%,#000 64%)}
#tf-share-directions .tf-food{position:absolute;left:var(--food-x);top:var(--food-y);width:var(--food-box);aspect-ratio:1;background-image:var(--food-art);background-repeat:no-repeat;background-size:contain;transform:translate(-50%,-50%) rotate(var(--food-angle))}
#tf-share-directions .tf-card h2{ text-shadow:0 2px 3px #180a22,1px 0 #180a22,-1px 0 #180a22}
#tf-share-directions .tf-kicker,#tf-share-directions .tf-card p,#tf-share-directions .tf-challenge-footer>span:first-child{text-shadow:0 1px 4px #100619,0 0 7px #100619}
#tf-share-directions .tf-footnote,#tf-share-directions .tf-phone-card .tf-footnote{display:none}
@media(max-width:599px){
#tf-share-directions .tf-food-backdrop{mask-image:linear-gradient(#000a,#000c 42%,#000 65%)}
#tf-share-directions .tf-food{left:var(--food-mobile-x);top:var(--food-mobile-y);width:var(--food-mobile-box)}
}
'''
start=s.index('#tf-share-directions{--tf-food-apple:')
end=s.index('</style>',start)
s=s[:start]+variables+css+s[end:]
pose_objects=[]
for i,(key,x,y,size,angle) in enumerate(poses):
 frac=assets['foods'][key]['visibleFraction']
 row,col=divmod(i,5)
 mx=3+col*23+(5 if row%2 else 0)+[-2,1,-1,2,0][col]
 my=2+row*13.5+[-1,2,-2,1,0][col]
 pose_objects.append({'food':key,'x':x,'y':y,'box':round(size/690/frac*100,3),'angle':angle,'mx':mx,'my':my,'mobileBox':round((size*.78)/frac,3)})
mascot_urls={k:v['uri'] for k,v in assets['mascots'].items()}
setup='''
const foodPoses = FOOD_POSES;
for (const card of root.querySelectorAll('.tf-card')) {
 const backdrop=document.createElement('div'); backdrop.className='tf-food-backdrop'; backdrop.setAttribute('aria-hidden','true');
 for(const p of foodPoses){const food=document.createElement('span');food.className='tf-food';food.dataset.food=p.food;
 food.style.setProperty('--food-art',`var(--tf-food-${p.food})`);food.style.setProperty('--food-x',`${p.x}%`);food.style.setProperty('--food-y',`${p.y}%`);food.style.setProperty('--food-box',`${p.box}%`);food.style.setProperty('--food-angle',`${p.angle}deg`);food.style.setProperty('--food-mobile-x',`${p.mx}%`);food.style.setProperty('--food-mobile-y',`${p.my}%`);food.style.setProperty('--food-mobile-box',`${p.mobileBox}px`);backdrop.append(food);}
 card.prepend(backdrop);
}
const mascot=root.querySelector('.tf-mascot');
const mascotArtUrls={default:mascot.getAttribute('src'),...MASCOT_URLS};
const savedMascot=window.openai?.widgetState?.modelContent?.mascotArt;
function rememberArtwork(){if(window.openai?.setWidgetState)window.openai.setWidgetState({modelContent:{mascotArt:phoneState.art},privateContent:null}).catch(()=>{});}
'''.replace('FOOD_POSES',json.dumps(pose_objects,separators=(',',':'))).replace('MASCOT_URLS',json.dumps(mascot_urls,separators=(',',':')))
s=s.replace('const phoneState = { angle: 3, score: 12480, backdrop: .48 };',setup+"\nconst phoneState = { angle: 3, score: 12480, backdrop: .64, art: Object.hasOwn(mascotArtUrls,savedMascot) ? savedMascot : 'default' };")
s=s.replace('const desktopState = { score: 1594, backdrop: .38 };','const desktopState = { score: 1594, backdrop: .58 };')
s=s.replace('const astroState = { frame: true, backdrop: .36 };','const astroState = { frame: true, backdrop: .52 };')
s=s.replace("function renderPhone() { phone.style.transform", "function renderPhone() { mascot.src=mascotArtUrls[phoneState.art]||mascotArtUrls.default; mascot.dataset.mascotArt=phoneState.art; phone.style.transform")
s=s.replace('renderPhone(); renderDesktop(); renderAstro();',"renderPhone(); renderDesktop(); renderAstro();\nwindow.addEventListener('openai:set_globals',event=>{const next=event.detail?.globals?.widgetState?.modelContent?.mascotArt;if(Object.hasOwn(mascotArtUrls,next)){phoneState.art=next;renderPhone();}});")
s=s.replace('onChange: renderPhone','onChange: () => {renderPhone();rememberArtwork();}')
s=s.replace("mobileTweak.addSlider(phoneState, 'angle'", "mobileTweak.addSelect(phoneState,'art',{label:'Mascot artwork',options:[{label:'Original Froggy',value:'default'},{label:'Crowned adventurer',value:'golden_crown'},{label:'Burger feast',value:'burger_feast'}]});\nmobileTweak.addSlider(phoneState, 'angle'")
s=s.replace("label:'Food backdrop',min:0,max:.7,step:.05", "label:'Food backdrop',min:.2,max:.85,step:.05")
assert len(s.encode('utf-8'))<1_000_000,len(s.encode('utf-8'))
assert 'tf-card:before{background-size:43%' not in s
assert 'food-collage-background' not in s
p.write_text(s,encoding='utf-8')
Path('work/share-decoration-assets/native-assortment/placements.json').write_text(json.dumps(pose_objects,indent=2),encoding='utf-8')
print(json.dumps({'bytes':len(s.encode('utf-8')),'nativeFoodTypes':len(assets['foods']),'placementsPerCard':len(poses),'strawberryApparentPxAt690':[p[3] for p in poses if p[0]=='strawberry'],'mascotChoices':3,'usesGeneratedBackdrop':False}))
