from pathlib import Path
p=Path(r'C:\Users\Metarator\.codex\visualizations\2026\10\06\01a112c4-59eb-7f80-a3b5-4d5b10ea925c\game-challenge-directions.html')
s=p.read_text(encoding='utf-8')
s=s.replace('Score to beat <br><span class="tf-mobile-score">','Score to beat <span class="tf-mobile-score">')
s=s.replace('const phoneState = { angle: 4, score: 12480 };','const phoneState = { angle: 3, score: 12480 };')
s=s.replace('phone.style.transform = `rotate(${phoneState.angle}deg)`;', 'phone.style.transform = `translateY(-50%) rotate(${phoneState.angle}deg)`;')
css='''
#tf-share-directions .tf-stage{min-height:440px;padding:14px 4px;gap:12px}
#tf-share-directions .tf-phone-card{container-type:inline-size}
#tf-share-directions .tf-phone-card .tf-brand{position:relative;left:auto;top:auto;width:min(100%,305px)}
#tf-share-directions .tf-phone-card .tf-invite-copy{margin:0;width:auto}
#tf-share-directions .tf-phone-card .tf-mobile-score{font-size:clamp(62px,12cqw,84px);line-height:1.02;letter-spacing:-1px}
#tf-share-directions .tf-phone-card .tf-invite-copy h2{font-size:clamp(25px,4.4cqw,31px);line-height:1.06}
#tf-share-directions .tf-phone-card .tf-kicker{font-size:11px;letter-spacing:1.2px;margin-bottom:8px}
#tf-share-directions .tf-phone-card .tf-invite-copy p{margin:11px 0 16px}
#tf-share-directions .tf-phone-card .tf-cta{font-size:13px;padding:11px 17px}
#tf-share-directions .tf-phone-scene{position:relative;top:auto;right:auto;width:100%;height:100%;margin:0}
#tf-share-directions .tf-phone{width:calc(24.23077cqw - 24.923px);right:22px;top:50%;transform:translateY(-50%) rotate(3deg)}
#tf-share-directions .tf-mascot{width:82px;left:5px;bottom:12px}
@media(min-width:600px){
#tf-share-directions .tf-card{aspect-ratio:1200 / 630;min-height:0}
#tf-share-directions .tf-phone-card{padding:23px 28px 29px;display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);grid-template-rows:auto minmax(0,1fr);column-gap:14px;row-gap:13px}
#tf-share-directions .tf-phone-card .tf-brand{grid-column:1;grid-row:1}
#tf-share-directions .tf-phone-card .tf-invite-copy{grid-column:1;grid-row:2;align-self:center}
#tf-share-directions .tf-phone-card .tf-phone-scene{grid-column:2;grid-row:1 / 3}
#tf-share-directions .tf-phone-card .tf-footnote{left:28px;bottom:12px}
#tf-share-directions .tf-challenge-heading{top:83px}
#tf-share-directions .tf-challenge-heading h2{font-size:29px}
#tf-share-directions .tf-score{font-size:66px;line-height:1.04}
#tf-share-directions .tf-laptop{top:86px;right:27px;width:51%}
#tf-share-directions .tf-challenge-footer{bottom:44px}
#tf-share-directions .tf-puzzle-heading{margin-top:87px}
#tf-share-directions .tf-puzzle-heading h2{font-size:36px}
#tf-share-directions .tf-puzzle-card .tf-tablet{top:62px;width:46%}
#tf-share-directions .tf-astro-callout{bottom:97px;width:215px}
}
@media(max-width:599px){
#tf-share-directions .tf-stage{min-height:750px;padding:12px 4px}
#tf-share-directions .tf-phone-card{display:block;aspect-ratio:auto;min-height:0;padding:22px 21px 25px}
#tf-share-directions .tf-phone-card .tf-brand{width:min(100%,275px)}
#tf-share-directions .tf-phone-card .tf-invite-copy{margin:19px 0 0}
#tf-share-directions .tf-phone-card .tf-invite-copy h2{font-size:30px}
#tf-share-directions .tf-phone-card .tf-mobile-score{font-size:62px;letter-spacing:0}
#tf-share-directions .tf-phone-card .tf-phone-scene{width:min(100%,260px);height:354px;margin:16px auto 0}
#tf-share-directions .tf-phone{width:142px;right:6px}
#tf-share-directions .tf-mascot{width:70px;left:1px;bottom:13px}
#tf-share-directions .tf-phone-card .tf-footnote{position:relative;left:auto;bottom:auto;display:block;margin-top:16px;font-size:11px;letter-spacing:.3px}
}
'''
s=s.replace('</style>',css+'</style>')
assert '\\"' not in s and '\\n' not in s
assert len(s.encode('utf-8'))<1000000
p.write_text(s,encoding='utf-8')
print('Rebalanced the cards to the intended wide preview ratio; enlarged score and reduced mascot overlap.')
