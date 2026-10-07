import zipfile, pathlib, json, hashlib, io, collections
from PIL import Image
ROOT=pathlib.Path(__file__).resolve().parent
OUT=ROOT/"share-decoration-assets"/"preferred-foods"
CAND=OUT/"candidates"
SOURCES=[("labeled",pathlib.Path(r"D:\toadal bloat\FroggyFeast_Food_Assets_Labeled.zip")),("lean",pathlib.Path(r"D:\toadal bloat\TOADAL_FEAST_EXTRACTED_NEW_ASSETS_LEAN.zip"))]
EXCLUDED={"glossy_purple_gold_game_ui_assets","glossy_gold_and_purple_game_icon_sheet","glossy_purple_gold_casino_ui_kit"}
OUT.resolve().relative_to(ROOT.resolve())
records=[]; excluded=[]; sources=[]
for source,path in SOURCES:
    archive_hash=hashlib.sha256(path.read_bytes()).hexdigest()
    with zipfile.ZipFile(path) as z:
        manifest=json.loads(z.read("TOADAL_FEAST_EXTRACTED_NEW_ASSETS/manifest.json")) if source=="lean" else None
        bypath={i["filename"]:i for i in manifest["items"]} if manifest else {}
        sources.append(dict(id=source,path=str(path),sha256=archive_hash,totalPngs=sum(n.endswith(".png") for n in z.namelist()),manifestSummary=manifest["summary"] if manifest else None))
        for n in z.namelist():
            if not n.endswith(".png"): continue
            parts=pathlib.PurePosixPath(n).parts
            if source=="lean":
                group=parts[2]
                if group in EXCLUDED:
                    excluded.append(dict(source=source,zipMember=n,reason="Explicit UI/reward/casino sheet; not chosen as food"))
                    continue
                rel=pathlib.Path("lean")/group/parts[-1]
                md=bypath[n.split("/",1)[1]]
            else:
                group=parts[1]
                if group not in {"01_Fruity_Main","02_Sweet_Main","03_Savory_Main","04_Bonus_Extras"}:
                    excluded.append(dict(source=source,zipMember=n,reason="Preview sheet or alternate visual variant; main subjects retained"))
                    continue
                rel=pathlib.Path("labeled")/group/parts[-1]
                md=None
            data=z.read(n)
            dest=CAND/rel
            dest.resolve().relative_to(CAND.resolve())
            dest.parent.mkdir(parents=True,exist_ok=True)
            if dest.exists() and dest.read_bytes()!=data: raise ValueError("Refusing different existing file "+str(dest))
            dest.write_bytes(data)
            with Image.open(io.BytesIO(data)) as im:
                hasalpha="A" in im.getbands()
                alpha=im.getchannel("A") if hasalpha else None
                visible=alpha.point(lambda x:255 if x>=16 else 0).getbbox() if hasalpha else (0,0,*im.size)
                records.append(dict(id=source+"/"+group+"/"+parts[-1],sourceId=source,sourceZip=str(path),sourceZipSha256=archive_hash,zipMember=n,localPath=str(dest),
                    sourceManifestItem=md,group=group,filename=parts[-1],sha256=hashlib.sha256(data).hexdigest(),bytes=len(data),width=im.width,height=im.height,mode=im.mode,
                    alphaExtrema=list(alpha.getextrema()) if hasalpha else None,alphaBoundsNonzeroPx=list(alpha.getbbox()) if hasalpha else None,alphaBounds16Px=list(visible),
                    transparent=bool(hasalpha and alpha.getextrema()[0]<255)))
report=dict(schemaVersion=1,purpose="Unchanged owner-supplied food candidates for semantic and visual review; not all candidates are accepted collage assets",sources=sources,
    authorityNotes=["Archives supplied and approved for this design by owner in current conversation","Lean manifest maps crops to source sheets and crop bounds but gives no semantic food labels","Labeled archive is byte-identical to earlier C: owner archive","No AI generation, pixel edits or resampling performed","Original source sheets for the lean extraction are described, not included in this lean archive"],
    alphaBoundsConvention="[left,top,right-exclusive,bottom-exclusive]; 16 threshold for visible bounds",assets=records,excluded=excluded)
OUT.mkdir(parents=True,exist_ok=True)
(OUT/"candidate-provenance.json").write_text(json.dumps(report,indent=2)+"\n",encoding="utf-8")
print(json.dumps(dict(directory=str(OUT),candidateCount=len(records),groups=dict(collections.Counter(r["sourceId"]+"/"+r["group"] for r in records)),opaqueCandidates=[r["id"] for r in records if not r["transparent"]],excludedCount=len(excluded)),indent=2))

