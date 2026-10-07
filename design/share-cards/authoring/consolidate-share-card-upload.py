from pathlib import Path
from datetime import datetime,timezone
import shutil,hashlib,json
workspace=Path.cwd().resolve()
checkout=(workspace/'work/share-cards-checkout').resolve()
bundle=(checkout/'design/share-cards').resolve()
assert checkout in bundle.parents
bundle=Path('\\\\?\\'+str(bundle))
bundle.mkdir(parents=True,exist_ok=True)
source_records=[]
def copy_file(src,relative,role):
 src=Path(src).resolve();src=Path('\\\\?\\'+str(src)) if not str(src).startswith('\\\\?\\') else src;dst=bundle/relative;dst.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dst)
 source_records.append({'path':str(dst.relative_to(bundle)).replace('\\','/'),'sourceName':src.name,'role':role})
def copy_tree(src,relative,role,skip_parts=()):
 src=Path(src)
 for f in sorted(src.rglob('*')):
  if f.is_file() and not any(part in skip_parts for part in f.relative_to(src).parts):copy_file(f,Path(relative)/f.relative_to(src),role)
archives=[
(Path(r'C:\Users\Metarator\Downloads')/'files (16).zip','Original supplied lettering/authoring archive'),
(Path(r'C:\Users\Metarator\Downloads')/'files (16)(1).zip','Supplied duplicate archive; kept with original name'),
(Path(r'C:\Users\Metarator\Downloads')/'files (19).zip','Supplied Astro HUD source archive'),
(Path(r'C:\Users\Metarator\Downloads')/'files (20).zip','Supplied newer font/lettering source archive'),
(Path(r'D:\toadal bloat')/'FroggyFeast_Star_Assets_FX_Pack_2026-09-23(1).zip','Preferred star/FX source pack'),
(Path(r'D:\toadal bloat')/'FroggyFeast_Food_Assets_Labeled.zip','Preferred labeled food source pack'),
(Path(r'D:\toadal bloat')/'TOADAL_FEAST_EXTRACTED_NEW_ASSETS_LEAN.zip','Preferred newer transparent asset crop pack')]
pack_records=[]
for src,role in archives:
 assert src.is_file(),src
 assert src.stat().st_size<100*1024*1024,(src,src.stat().st_size)
 copy_file(src,Path('source-packs')/src.name,role)
 pack_records.append({'path':'source-packs/'+src.name,'bytes':src.stat().st_size,'sha256':hashlib.sha256(src.read_bytes()).hexdigest(),'purpose':role})
for p in sorted((workspace/'outputs').iterdir()):
 if p.is_file():
  relative=Path('explorations/rejected-generated-backgrounds')/p.name if p.name.startswith('food-collage-background') else Path('outputs')/p.name
  copy_file(p,relative,'Rejected generated experiment; not current card artwork' if p.name.startswith('food-collage-background') else 'Existing task deliverable or review record')
copy_tree(workspace/'work/share-decoration-assets','assets/decorations','Existing asset/candidate or preview encoding with provenance')
copy_tree(workspace/'work/share-assets','assets/astro-and-lettering','Authored/copy asset and provenance',('font-decoder-deps','__pycache__'))
for name in ['astro-review','lettering-review','share-native-hud-validation','share-cards-browser']:
 copy_tree(workspace/'work'/name,Path('reviews')/name,'Preserved earlier review evidence')
copy_file(Path(r'C:\Users\Metarator\.codex\visualizations\2026\10\06\01a112c4-59eb-7f80-a3b5-4d5b10ea925c\game-challenge-directions.html'),'preview/game-challenge-directions.html','Current editable concept fragment')
copy_file(workspace/'work/game-challenge-directions-preview.html','preview/game-challenge-directions-preview.html','Current standalone concept preview')
copy_file(workspace/'work/original-share-card-before-native-assortment.html','preview/original-share-card-before-native-assortment.html','Original layout snapshot before native food revision')
for f in sorted((workspace/'work').iterdir()):
 if f.is_file() and f.suffix in ['.py','.cjs']:copy_file(f,Path('authoring')/f.name,'Task authoring/inspection script snapshot')
 elif f.is_file() and f.name.startswith('share-concept-') and f.suffix=='.png':copy_file(f,Path('preview/current-inspection')/f.name,'Current native backdrop visual inspection')
 elif f.is_file() and (f.name.startswith('share-cards-') and f.suffix in ['.txt','.md']):copy_file(f,Path('reviews/logs')/f.name,'Earlier implementation review log or PR description snapshot')
for name in ['image-gen-6(2).png','Crowned Frog Devours a Burger.png']:
 copy_file(Path(r'C:\Users\Metarator\Downloads')/name,Path('assets/mascot-originals')/name,'Supplied alternate mascot original; no generation or modification')
copy_file(Path(r'C:\Users\METARA~1\AppData\Local\Temp\codex-clipboard-d0308b88-aa1d-4f46-a316-f848c04813cc.png'),'references/website-device-montage.png','User supplied website device montage reference')
(bundle/'.gitattributes').write_text('# Preserve exact snapshot bytes for integrity manifests.\n* -text\n',encoding='utf-8')
(bundle/'source-pack-index.json').write_text(json.dumps({'schemaVersion':1,'packs':pack_records,'duplicateNote':'files (16).zip and files (16)(1).zip are byte-identical; both supplied filenames are preserved.'},indent=2)+'\n',encoding='utf-8')
readme='''# TOADAL FEAST sharing-card handoff

This folder consolidates the current work, supplied original source ZIPs, assets, concepts and review evidence on the same branch as PR #30. Design work stopped at the owner's explicit request on 2026-10-07.

## Current design snapshot

- Original 1200 x 630 card layout, Score to beat, representative gameplay and iPhone-inspired frame are retained.
- Current local concept uses 14 existing native repository food types in 37 fixed placements per card. The strawberry is normalized by its visible alpha bounds to match the surrounding foods.
- Original Froggy is the default. The two supplied crowned-adventurer and burger-feast pictures are selectable mascot choices through the concept's Mascot artwork design control.
- Preview changes are local design work. The existing production service in services/share-cards does not yet implement the new game-specific device, gameplay-capture, dense-food or mascot-selection concepts.
- No new image generation is authorized. The two generated food background experiments were rejected and are preserved only under explorations/rejected-generated-backgrounds; neither is used in the current card.

## Entry points

- [Standalone current preview](preview/game-challenge-directions-preview.html) - download and open in a browser. Host design controls require the Codex conversation surface; the default card and variant navigation are standalone.
- [Editable concept fragment](preview/game-challenge-directions.html)
- [Current desktop/narrow inspection images](preview/current-inspection/)
- [Sharing architecture and implementation plan](outputs/SHARE_CARDS_AND_INVITES.md)
- [Gameplay/device design notes](outputs/GAMEPLAY_SHARE_CARD_DESIGN.md)
- [Verified link-preview sizing guidance](outputs/LINK_PREVIEW_SIZING.md)
- [All supplied source ZIPs](source-packs/)
- [Source-pack sizes and hashes](source-pack-index.json)
- [Asset/candidate provenance](assets/decorations/)
- [Supplied mascot originals](assets/mascot-originals/)
- [Astro/font resources](assets/astro-and-lettering/)

## Preferred packs at the stop point

The three preferred D: packs are all included unchanged, along with the four earlier ZIP attachments. The labeled food pack is byte-identical to the earlier C: copy; the preferred D: file is the archived source.

300 existing food candidates and five static star sheets have been extracted with source-member/hash metadata. These candidates have not received a final semantic/style selection and are not all present in the current card. Some crops are duplicate variants, UI-like objects or white-matted artwork and require review before use. The complete originals preserve every supplied item, including members not selected for candidate extraction.

## Mascot variation contract for the implementation

Use an allowlisted art ID (original, crowned-adventurer, burger-feast), keeping original as the default. A player choice is cosmetic. An optional surprise choice should resolve once when creating a card, and the resolved ID and asset version must remain fixed with that card's immutable public image. Rendering or crawler requests must not re-randomize it. Automatic high-score selection needs explicit game/mode-specific rules; these images do not themselves assert a verified rank or earned reward. The current concept demonstrates manual selection only.

## Review evidence and integrity

Outputs and review logs preserve their original timing/scope. Earlier service validation does not certify later visual concepts or unfinished preferred-asset selections. No new implementation tests, merge, deployment or production configuration change was performed for this archival upload.

upload-manifest.json records every consolidated file's size and SHA256, excluding its own recursive entry. Original images/ZIP bytes are preserved. Snapshot scripts may retain local execution paths. Installed dependency caches, browser profiles and unrelated checkouts are outside this task handoff; the service's dependency declarations are already in the same branch.
'''
(bundle/'README.md').write_text(readme,encoding='utf-8')
files=[p for p in sorted(bundle.rglob('*')) if p.is_file() and p.name!='upload-manifest.json']
manifest={'schemaVersion':1,'createdAt':datetime.now(timezone.utc).isoformat(),'targetRepository':'Matthew75x/toadal-feast-web','targetBranch':'work/share-cards-v1-20261006','pullRequest':'https://github.com/Matthew75x/toadal-feast-web/pull/30','designStatus':'Stopped by owner; current native concept preserved; preferred-asset selection unfinished','files':[{'path':str(p.relative_to(bundle)).replace('\\','/'),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in files],'sourceRecords':source_records}
(bundle/'upload-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'bundle':str(bundle),'files':len(files)+1,'bytes':sum(p.stat().st_size for p in bundle.rglob('*') if p.is_file()),'sourceZipCount':len(pack_records),'largest':sorted([(p.stat().st_size,str(p.relative_to(bundle))) for p in files],reverse=True)[:8]}))
