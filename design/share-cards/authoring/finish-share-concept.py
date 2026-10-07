from pathlib import Path
p=Path(r'C:\Users\Metarator\.codex\visualizations\2026\10\06\01a112c4-59eb-7f80-a3b5-4d5b10ea925c\game-challenge-directions.html')
s=p.read_text(encoding='utf-8')
s=s.replace('Can you beat <span','Can you beat <br><span')
css='''
@media(min-width:600px){
#tf-share-directions .tf-desktop-card{min-height:390px}
#tf-share-directions .tf-challenge-heading{position:absolute;left:30px;top:96px;margin:0;width:37%}
#tf-share-directions .tf-challenge-heading h2{font-size:31px}
#tf-share-directions .tf-score{font-size:58px}
#tf-share-directions .tf-laptop{position:absolute;right:24px;top:100px;width:53%;margin:0}
#tf-share-directions .tf-challenge-footer{position:absolute;left:30px;bottom:48px;margin:0;flex-direction:column;align-items:flex-start;gap:10px}
}
'''
s=s.replace('</style>',css+'</style>')
p.write_text(s,encoding='utf-8')
print('Finished computer challenge layout.')
