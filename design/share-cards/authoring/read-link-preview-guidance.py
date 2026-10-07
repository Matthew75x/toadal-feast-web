from urllib.request import urlopen,Request
import re,html,json
from pathlib import Path
urls=[('Meta','https://developers.facebook.com/documentation/sharing/webmasters/images'),('Apple','https://developer.apple.com/tutorials/data/documentation/technotes/tn3156-create-rich-previews-for-messages.json')]
for name,url in urls:
    try:
        req=Request(url,headers={'User-Agent':'Mozilla/5.0'})
        with urlopen(req,timeout=25) as r:
            data=r.read().decode('utf-8'); print(name,'HTTP',r.status,r.geturl())
        if name=='Meta':
            for term in ['1200','600','1.91','8 MB']:
                at=data.find(term)
                if at>=0: print(html.unescape(re.sub('<[^>]+>',' ',data[max(0,at-130):at+210])))
        else:
            j=json.loads(data)
            strings=[]
            def walk(x):
                if isinstance(x,dict):
                    if x.get('type')=='text' and 'text' in x: strings.append(x['text'])
                    for value in x.values(): walk(value)
                elif isinstance(x,list):
                    for value in x: walk(value)
            walk(j)
            text=' '.join(strings)
            for term in ['900','Avoid text','1 MB']:
                at=text.find(term)
                if at>=0: print(text[max(0,at-100):at+230])
    except Exception as e: print(name,type(e).__name__,str(e))
