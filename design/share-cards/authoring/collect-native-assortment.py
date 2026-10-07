"""Copy pinned existing repository art; generate no artwork."""
import base64, concurrent.futures, hashlib, io, json, pathlib, subprocess
from datetime import datetime, timezone
from PIL import Image
ROOT = pathlib.Path(__file__).resolve().parent
OUT = ROOT / "share-decoration-assets" / "native-assortment"
REPO = "Matthew75x/Toadal-Feast-Development"
COMMIT = "c7ba1f978a89f5976cd6f02af4beb1e7dba2f372"
PREFIX = "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256"
NAMES = ["apple","banana","orange","strawberry","cookie","grapes","blueberry","donut","cupcake","macaron","burger","pizza","fries","hot_dog"]
def api(path):
    return json.loads(subprocess.run(["gh","api",path],check=True,capture_output=True).stdout)
def describe(name):
    filename = "food_" + name + ".png"
    path = PREFIX + "/" + filename
    record = api("repos/" + REPO + "/contents/" + path + "?ref=" + COMMIT)
    data = base64.b64decode(record["content"])
    blob = hashlib.sha1(b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest()
    if blob != record["sha"] or len(data) != record["size"]:
        raise ValueError("Repository byte verification failed: " + filename)
    with Image.open(io.BytesIO(data)) as im:
        if im.format != "PNG" or im.mode != "RGBA": raise ValueError("Expected RGBA PNG: " + filename)
        alpha = im.getchannel("A")
        visible = alpha.point(lambda x: 255 if x >= 16 else 0).getbbox()
        w,h = im.size
        longest = max(visible[2]-visible[0],visible[3]-visible[1])
        info = dict(name=name.replace("_"," "),filename=filename,localPath=str(OUT / filename),
            sourceRepository=REPO,sourceCommit=COMMIT,sourcePath=path,
            sourceUrl="https://github.com/" + REPO + "/blob/" + COMMIT + "/" + path,
            gitBlobSha1=blob,sha256=hashlib.sha256(data).hexdigest(),bytes=len(data),
            width=w,height=h,mode=im.mode,alphaExtrema=list(alpha.getextrema()),
            alphaBoundsNonzeroPx=list(alpha.getbbox()),alphaBounds16Px=list(visible),
            visibleLongestDimensionPx=longest,visibleLongestDimensionFraction=longest/max(w,h),
            boxSizeFor100PxApparent=round(100*max(w,h)/longest,3))
    return filename,data,info
OUT.resolve().relative_to(ROOT.resolve())
main_commit = api("repos/" + REPO + "/branches/main")["commit"]["sha"]
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool: records = list(pool.map(describe,NAMES))
OUT.mkdir(parents=True,exist_ok=True)
apple = records[0][2]["visibleLongestDimensionPx"]
for filename,data,info in records:
    target = OUT / filename
    if target.exists() and target.read_bytes() != data: raise ValueError("Refusing to replace different file: " + str(target))
    target.write_bytes(data)
    info["boxScaleRelativeToApple"] = round(apple/info["visibleLongestDimensionPx"],6)
manifest = dict(schemaVersion=1,purpose="Exact copies of existing native repository food art for share-card decoration review",
    retrievedAt=datetime.now(timezone.utc).isoformat(),sourceRepository=REPO,sourceCommit=COMMIT,
    observedMainCommit=main_commit,selection="Fourteen distinct native foods from one pinned runtime pack; no generation or transformation",
    sourceAuthorityNotes=[
        "The v1 runtime folder name does not indicate old master art; current presentation registry maps much of this pack to approved glossy-sticker-food-v2 masters.",
        "Some foods are approved runtime derivatives. Owner repository presence is provenance, not an independent public licensing declaration.",
        "See content/generated/food-presentation-registry.js and glossy-sticker batch manifests at the same commit for per-food authority."],
    alphaBoundsConvention="[left, top, right-exclusive, bottom-exclusive]; threshold16 defines visible-size normalization excluding faint fringe pixels",
    normalization="CSS square box size = target apparent longest edge / visibleLongestDimensionFraction; preserve original aspect ratio and alpha margins",
    assets=[info for _,_,info in records])
(OUT / "provenance.json").write_text(json.dumps(manifest,indent=2)+"\n",encoding="utf-8")
print(json.dumps(dict(directory=str(OUT),pin=COMMIT,observedMainCommit=main_commit,
    assets=[{k:info[k] for k in ["filename","width","height","alphaBounds16Px","boxScaleRelativeToApple"]} for _,_,info in records]),indent=2))

