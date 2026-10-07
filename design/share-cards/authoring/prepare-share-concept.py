from pathlib import Path
from PIL import Image
from io import BytesIO
import base64,re
root=Path(r'C:\Users\Metarator\Documents\Codex\2026-10-06\using-all-the-resources-available-to')
fragment=Path(r'C:\Users\Metarator\.codex\visualizations\2026\10\06\01a112c4-59eb-7f80-a3b5-4d5b10ea925c\game-challenge-directions.html')
text=fragment.read_text(encoding='utf-8')
assets=root/'work/share-cards-checkout/services/share-cards/assets'
images=root/'work/share-cards-checkout/studio-project/toadal-feast-website/reference/assets/images'
mapping={'BRAND':(assets/'toadal-feast-header.png',650),'MASCOT':(assets/'toadal-victory.png',240),'ASTRO':(assets/'astro-score-frame.png',640),'ARCADE':(images/'app/arcade-real-gameplay.webp',360),'WICKED':(images/'games/wicked-bites-v5.5-preview.webp',844),'PUZZLE':(images/'app/puzzle-real-gameplay.webp',640)}
for key,(path,width) in mapping.items():
    im=Image.open(path)
    im.thumbnail((width,1200))
    buf=BytesIO()
    im.save(buf,format='WEBP',quality=86,method=6)
    text=text.replace('@@'+key+'@@','data:image/webp;base64,'+base64.b64encode(buf.getvalue()).decode('ascii'))
text=text.replace('@@FONT@@','data:font/ttf;base64,'+base64.b64encode((assets/'LilitaOne-Latin.ttf').read_bytes()).decode('ascii'))
assert '@@' not in text
assert len(text.encode('utf-8'))<1000000
assert '\\"' not in text and '\\n' not in text
assert len(re.findall('data-variant=',text))==3
fragment.write_text(text,encoding='utf-8')
print({'bytes':len(text.encode('utf-8')),'variants':3,'image_tags':text.count('<img'),'literal_markup':text.startswith('<div'),'closing_script':text.rstrip().endswith('</script>')})
