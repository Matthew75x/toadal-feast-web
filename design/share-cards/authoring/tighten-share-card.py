from pathlib import Path
p=Path(r'C:\Users\Metarator\.codex\visualizations\2026\10\06\01a112c4-59eb-7f80-a3b5-4d5b10ea925c\game-challenge-directions.html')
s=p.read_text(encoding='utf-8')
css='''
@media(min-width:600px){
#tf-share-directions .tf-phone{width:calc(24.23077cqw - 12px);right:92px}
#tf-share-directions .tf-phone-card .tf-mobile-score{font-size:clamp(64px,13.2cqw,88px)}
#tf-share-directions .tf-mascot{left:auto;right:0;bottom:0;width:82px}
}
'''
s=s.replace('</style>',css+'</style>')
p.write_text(s,encoding='utf-8')
notes=Path(r'C:\Users\Metarator\Documents\Codex\2026-10-06\using-all-the-resources-available-to\outputs\GAMEPLAY_SHARE_CARD_DESIGN.md')
n=notes.read_text(encoding='utf-8')
n += '\n## Requested revision — Use the card space\n\nWide concepts now use the 1200×630 composition ratio. The Arcade design aligns its logo, mode, heading, larger score and action on one axis, uses a two-column grid, moves the phone toward the score and places the smaller mascot alongside the phone. The screenshot is still contained without stretching. Narrow previews reflow vertically. This is a visual composition revision, not a production renderer change.\n'
notes.write_text(n,encoding='utf-8')
print('Tightened device placement and saved the spatial design decision.')
