from pathlib import Path
p=Path(r'C:\Users\Metarator\.codex\visualizations\2026\10\06\01a112c4-59eb-7f80-a3b5-4d5b10ea925c\game-challenge-directions.html')
s=p.read_text(encoding='utf-8')
s=s.replace('Arcade phone invitation','Arcade iPhone challenge')
s=s.replace('Example Arcade invitation with representative gameplay','Example Arcade score challenge with representative gameplay')
s=s.replace('ARCADE · INVITATION','ARCADE · PERSONAL SCORE')
s=s.replace("You've been <br>invited to <br>the feast.", 'Score to beat <br><span class="tf-mobile-score">12,480</span>')
s=s.replace('Catch a little chaos. <br>Bring a friend.', 'Can you top it?')
s=s.replace('JOIN THE FEAST','TAKE THE CHALLENGE')
s=s.replace('GAMEPLAY PREVIEW</span>\n</article>\n<span class="tf-example-label">Design example · existing gameplay capture','EXAMPLE PERSONAL SCORE · POINTS</span>\n</article>\n<span class="tf-example-label">Design example · representative gameplay capture')
s=s.replace('Generic portrait phone with an uncropped Arcade preview','iPhone-inspired portrait device with an uncropped Arcade preview')
s=s.replace('Can you beat <br><span class="tf-score">1,594</span>?','Score to beat <br><span class="tf-score">1,594</span>')
s=s.replace('width:137px;padding:7px;border:1px solid #59525c;border-radius:25px;background:#17161e;box-shadow:0 15px 24px #08060d80;', 'width:151px;padding:5px;border:1px solid #9a989d;border-radius:29px;background:#08090b;box-shadow:0 0 0 1px #45434a,inset 0 0 0 1px #c7c2c8,inset 0 0 0 3px #141418,0 18px 26px #08060d80;')
s=s.replace('border-radius:18px;overflow:hidden;background:#092d2c;', 'border-radius:24px;overflow:hidden;background:#090a0d;')
s=s.replace('top:7px;left:50%;width:30px;height:5px;border-radius:10px;background:#18151c;', 'top:9px;left:50%;width:46px;height:13px;border-radius:12px;background:radial-gradient(circle at 82% 50%,#273449 0 2px,#08090d 3px);box-shadow:inset 0 0 0 1px #25252c;')
s=s.replace('.tf-screen-caption{position:absolute;bottom:8px;', '.tf-screen-caption{position:absolute;bottom:22px;')
css='''
#tf-share-directions .tf-phone:before{content:'';position:absolute;left:-3px;top:57px;width:3px;height:20px;border-radius:2px;background:linear-gradient(90deg,#48454e,#b3afb8);box-shadow:0 29px 0 #aaa6af,0 57px 0 #aaa6af}
#tf-share-directions .tf-phone:after{content:'';position:absolute;right:-3px;top:90px;width:3px;height:39px;border-radius:2px;background:linear-gradient(90deg,#b3afb8,#48454e)}
#tf-share-directions .tf-phone-screen:after{content:'';position:absolute;bottom:8px;left:33%;width:34%;height:3px;border-radius:3px;background:#eceaf0;opacity:.85}
#tf-share-directions .tf-mobile-score{display:block;font-size:60px;line-height:1.18;color:#ffdf7c;font-variant-numeric:tabular-nums}
#tf-share-directions .tf-phone-card .tf-invite-copy h2{font-size:33px}
#tf-share-directions .tf-phone-card .tf-invite-copy p{margin-top:11px;margin-bottom:22px}
#tf-share-directions .tf-phone-card{min-height:390px}
@media(max-width:599px){
#tf-share-directions .tf-mobile-score{font-size:58px}
#tf-share-directions .tf-phone-card .tf-invite-copy h2 br{display:initial}
#tf-share-directions .tf-phone-scene{height:350px}
}
'''
s=s.replace('</style>',css+'</style>')
s=s.replace('const phoneState = { angle: 4 };','const phoneState = { angle: 4, score: 12480 };')
s=s.replace('phone.style.transform = `rotate(${phoneState.angle}deg)`;', "phone.style.transform = `rotate(${phoneState.angle}deg)`; root.querySelector('.tf-mobile-score').textContent = Math.round(phoneState.score).toLocaleString('en-US');")
s=s.replace("mobileTweak.addSlider(phoneState, 'angle', {label:'Phone angle',min:-6,max:6,step:1,unit:'deg'});", "mobileTweak.addSlider(phoneState, 'angle', {label:'Phone angle',min:-6,max:6,step:1,unit:'deg'});\nmobileTweak.addSlider(phoneState,'score',{label:'Example score',min:0,max:99999,step:1});")
assert 'Score to beat' in s and 'tf-mobile-score' in s
assert 'Can you beat <br>' not in s
assert len(s.encode('utf-8'))<1000000
p.write_text(s,encoding='utf-8')
notes=Path(r'C:\Users\Metarator\Documents\Codex\2026-10-06\using-all-the-resources-available-to\outputs\GAMEPLAY_SHARE_CARD_DESIGN.md')
n=notes.read_text(encoding='utf-8')
n += '\n## Requested revision — Score to beat / iPhone appearance\n\nThe Arcade phone concept now uses “Score to beat” above an example personal score and “Can you top it?” below. The Wicked Bites challenge uses the same heading. The portrait frame has an iPhone-inspired silhouette, metallic edge, thin bezel, capsule cutout, side buttons and home indicator. The existing gameplay image remains uncropped, with decorative hardware details kept in its letterbox areas. This is a local design revision; it makes no model, Apple affiliation or iOS release claim.\n'
notes.write_text(n,encoding='utf-8')
print('Updated challenge wording and iPhone-inspired device treatment; preserved embedded gameplay assets.')
