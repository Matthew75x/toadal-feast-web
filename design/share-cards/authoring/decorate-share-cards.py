from pathlib import Path
import base64,hashlib,json
p=Path(r'C:\Users\Metarator\.codex\visualizations\2026\10\06\01a112c4-59eb-7f80-a3b5-4d5b10ea925c\game-challenge-directions.html')
root=Path(r'C:\Users\Metarator\Documents\Codex\2026-10-06\using-all-the-resources-available-to')
sources=Path(r'C:\Users\Metarator\Documents\Codex\2026-09-10\files-mentioned-by-the-user-toadal\work\Toadal-Feast-Development-main\assets\themes\froggy-feast\arcade-runtime-food-v1\max-256')
expected={'apple':'9531c49c59f1269555fe2d644a812f29999f3cfd','strawberry':'3243339a1d2dc5a5ca825a8087009167db47b354','banana':'a4741e820088f4be0740d892e8262df229260d50','orange':'5a0d9a6dc71b65d48cc8da084799ea12c9bb7ab7','cookie':'37983e09e2c8416f7a7c5977370f6e9bf832293b'}
asset_dir=root/'work/share-decoration-assets'
asset_dir.mkdir(exist_ok=True)
records=[]
variables=[]
for name,blob in expected.items():
    filename='food_'+name+'.png'
    data=(sources/filename).read_bytes()
    actual=hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()
    assert actual==blob,(name,actual,blob)
    (asset_dir/filename).write_bytes(data)
    records.append({'asset':filename,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'gitBlob':blob,'sourcePath':'assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/'+filename})
    variables.append('--tf-food-'+name+':url(data:image/png;base64,'+base64.b64encode(data).decode()+');')
manifest={'sourceRepository':'Matthew75x/Toadal-Feast-Development','sourceCommit':'c7ba1f978a89f5976cd6f02af4beb1e7dba2f372','use':'Local share-card design background; original native runtime derivatives','assets':records}
(asset_dir/'provenance.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
s=p.read_text(encoding='utf-8')
css='#tf-share-directions{'+''.join(variables)+'}\n'+'''
#tf-share-directions .tf-card:before{content:'';position:absolute;inset:0;z-index:-1;pointer-events:none;background-image:var(--tf-food-strawberry),var(--tf-food-cookie),var(--tf-food-banana),var(--tf-food-orange),var(--tf-food-apple);background-repeat:no-repeat;background-size:25% auto,22% auto,21% auto,28% auto,23% auto;background-position:54% -35px,calc(100% + 28px) 26%,49% 52%,78% calc(100% + 34px),-29px calc(100% - 9px);opacity:var(--tf-decor-strength,.42);filter:saturate(.92);mask-image:linear-gradient(90deg,rgba(0,0,0,.48),rgba(0,0,0,.65) 34%,#000 56%)}
#tf-share-directions .tf-astro:before{filter:saturate(.85);background-position:50% -32px,calc(100% + 31px) 16%,40% 71%,75% calc(100% + 39px),-25px calc(100% - 11px)}
#tf-share-directions .tf-footnote{display:none}
#tf-share-directions .tf-phone-card .tf-footnote{display:none}
@media(max-width:599px){
#tf-share-directions .tf-card:before{background-size:43% auto,34% auto,37% auto,45% auto,39% auto;background-position:calc(100% + 22px) -26px,calc(100% + 29px) 34%,0 63%,64% calc(100% + 37px),-38px calc(100% - 36px);mask-image:linear-gradient(#0009,#000 55%);opacity:calc(var(--tf-decor-strength,.42) * .85)}
#tf-share-directions .tf-astro:before{background-position:calc(100% + 22px) -26px,calc(100% + 28px) 38%,0 67%,64% calc(100% + 40px),-38px calc(100% - 33px)}
}
'''
s=s.replace('</style>',css+'</style>')
s=s.replace('const phoneState = { angle: 3, score: 12480 };','const phoneState = { angle: 3, score: 12480, backdrop: .48 };')
s=s.replace('const desktopState = { score: 1594 };','const desktopState = { score: 1594, backdrop: .38 };')
s=s.replace('const astroState = { frame: true };','const astroState = { frame: true, backdrop: .36 };')
s=s.replace("root.querySelector('.tf-mobile-score').textContent = Math.round(phoneState.score).toLocaleString('en-US');", "root.querySelector('.tf-mobile-score').textContent = Math.round(phoneState.score).toLocaleString('en-US'); root.querySelector('.tf-phone-card').style.setProperty('--tf-decor-strength',phoneState.backdrop);")
s=s.replace("desktop.querySelector('.tf-score').textContent = Math.round(desktopState.score).toLocaleString('en-US');", "desktop.querySelector('.tf-score').textContent = Math.round(desktopState.score).toLocaleString('en-US'); desktop.style.setProperty('--tf-decor-strength',desktopState.backdrop);")
s=s.replace("astro.querySelector('.tf-astro-callout img').style.visibility = astroState.frame ? 'visible' : 'hidden';", "astro.querySelector('.tf-astro-callout img').style.visibility = astroState.frame ? 'visible' : 'hidden'; astro.style.setProperty('--tf-decor-strength',astroState.backdrop);")
s=s.replace("mobileTweak.addSlider(phoneState,'score',{label:'Example score',min:0,max:99999,step:1});", "mobileTweak.addSlider(phoneState,'score',{label:'Example score',min:0,max:99999,step:1});\nmobileTweak.addSlider(phoneState,'backdrop',{label:'Food backdrop',min:0,max:.7,step:.05});")
s=s.replace("desktopTweak.addSlider(desktopState,'score',{label:'Example score',min:0,max:99999,step:1});", "desktopTweak.addSlider(desktopState,'score',{label:'Example score',min:0,max:99999,step:1});\ndesktopTweak.addSlider(desktopState,'backdrop',{label:'Food backdrop',min:0,max:.7,step:.05});")
s=s.replace("astroTweak.addToggle(astroState,'frame',{label:'Astro HUD accent'});", "astroTweak.addToggle(astroState,'frame',{label:'Astro HUD accent'});\nastroTweak.addSlider(astroState,'backdrop',{label:'Food backdrop',min:0,max:.7,step:.05});")
assert len(s.encode('utf-8'))<1000000
assert '\\"' not in s and '\\n' not in s
p.write_text(s,encoding='utf-8')
print(json.dumps({'fragmentBytes':len(s.encode('utf-8')),'nativeFoodAssets':len(records),'matchedPinnedGitBlobs':True}))
