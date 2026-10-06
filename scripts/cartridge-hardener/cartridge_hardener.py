#!/usr/bin/env python3
from __future__ import annotations
import argparse, base64, hashlib, html.parser, json, mimetypes, os, re, shutil, subprocess, sys, textwrap, zipfile
from pathlib import Path
from typing import Any
from PIL import Image
import jsonschema

HERE=Path(__file__).resolve().parent
SCHEMA=json.loads((HERE/'schemas/game-cartridge.schema.json').read_text())
REQ_OUTBOUND=['game:ready','game:started','game:paused','game:resumed','game:score','game:complete','game:error']
REQ_INBOUND=['host:init','host:pause','host:resume','host:mute','host:unmute','host:visibility']
OPTIONAL_OUTBOUND=['game:request-exit','game:request-fullscreen']
CONDITIONAL_INBOUND={'game:request-exit':'host:exit-confirmed'}
NETWORK_PATTERNS=[r'\bfetch\s*\(',r'\bXMLHttpRequest\b',r'\bWebSocket\s*\(',r'\bEventSource\s*\(',r'\bnavigator\.sendBeacon\s*\(']
DANGEROUS_PATTERNS=[r'\bdocument\.domain\b',r'\beval\s*\(',r'\bnew\s+Function\s*\(']
ABS_URL=re.compile(r'(?:(?:src|href)\s*=\s*["\']|url\(\s*["\']?)(https?://|//)',re.I)
ROOT_URL=re.compile(r'(?:src|href)\s*=\s*["\']/(?!/)',re.I)

class RefParser(html.parser.HTMLParser):
    def __init__(self): super().__init__(); self.refs=[]; self.ids=[]
    def handle_starttag(self,tag,attrs):
        d=dict(attrs)
        if 'id' in d:self.ids.append(d['id'])
        for k in ('src','href','data-src'):
            if k in d:self.refs.append((tag,k,d[k]))

def sha(path:Path)->str:
    h=hashlib.sha256()
    with path.open('rb') as f:
        for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
    return h.hexdigest()

def write_webp(src:Path,dst:Path,max_size=(1600,1000),quality=88):
    with Image.open(src) as im:
        im=im.convert('RGB'); im.thumbnail(max_size,Image.Resampling.LANCZOS); im.save(dst,'WEBP',quality=quality,method=6)

def run_command(source:Path, item:dict[str,Any]):
    argv=item.get('argv'); name=item.get('name',' '.join(argv or []))
    if not isinstance(argv,list) or not argv or not all(isinstance(x,str) for x in argv): return {'name':name,'passed':False,'error':'Invalid argv'}
    timeout=int(item.get('timeoutSeconds',180))
    try:
        r=subprocess.run(argv,cwd=source,capture_output=True,text=True,timeout=timeout)
        return {'name':name,'passed':r.returncode==0,'returncode':r.returncode,'stdout':r.stdout[-12000:],'stderr':r.stderr[-12000:]}
    except Exception as e:return {'name':name,'passed':False,'error':str(e)}

TEXT_EXT={'.html','.htm','.js','.mjs','.cjs','.css','.json','.webmanifest','.txt','.md'}
IGNORED_URI_PREFIXES=('data:','#','blob:','mailto:','tel:','javascript:')
GENERATED_RUNTIME_NAMES={'cartridge.json','cartridge.integrity.json','poster.webp','screenshot.webp'}

def _safe_runtime_ref(base:Path,root:Path,uri:str):
    clean=re.sub(r'[?#].*$','',str(uri or '').strip()).replace('\\','/')
    if not clean or clean.startswith(IGNORED_URI_PREFIXES): return None
    if re.match(r'^(https?:)?//',clean,re.I) or clean.startswith('/'): return False
    target=(base/clean).resolve()
    try: target.relative_to(root)
    except ValueError: return False
    return target.is_file()

def scan_runtime(entry:Path,profile:dict[str,Any],runtime_root:Path|None=None):
    root=(runtime_root or entry.parent).resolve();entry=entry.resolve()
    texts={}
    for file in sorted(root.rglob('*')):
        if file.is_file() and file.suffix.lower() in TEXT_EXT:
            try:texts[file]=file.read_text(errors='replace')
            except Exception:pass
    txt=texts.get(entry,entry.read_text(errors='replace'));parser=RefParser();parser.feed(txt)
    findings=[]
    if len(parser.ids)!=len(set(parser.ids)): findings.append(('FAIL','duplicate-html-ids','Duplicate DOM ids in entry HTML'))
    unresolved=[]
    for file,body in texts.items():
        rel=file.relative_to(root).as_posix()
        if ABS_URL.search(body): findings.append(('FAIL','external-url',f'Absolute external URL reference detected in {rel}'))
        if ROOT_URL.search(body): findings.append(('FAIL','root-path',f'Root-absolute runtime reference detected in {rel}'))
        for pat in NETWORK_PATTERNS:
            if re.search(pat,body): findings.append(('FAIL','network-api',f'Runtime network API pattern detected in {rel}: {pat}'))
        for pat in DANGEROUS_PATTERNS:
            if re.search(pat,body): findings.append(('WARN','dangerous-pattern',f'Review dynamic-code/coupling pattern in {rel}: {pat}'))
        if file.suffix.lower() in {'.html','.htm'}:
            hp=RefParser();hp.feed(body)
            for _tag,_key,uri in hp.refs:
                ok=_safe_runtime_ref(file.parent,root,uri)
                if ok is False: unresolved.append(f'{rel} -> {uri}')
        if file.suffix.lower()=='.css':
            for uri in re.findall(r"url\(\s*([^)]+?)\s*\)",body,re.I):
                uri=uri.strip().strip('"').strip("'")
                ok=_safe_runtime_ref(file.parent,root,uri)
                if ok is False: unresolved.append(f'{rel} -> {uri}')
    if unresolved: findings.append(('FAIL','nonclosed-entry',f'Package-local HTML/CSS reference missing or escaping root: {sorted(set(unresolved))[:20]}'))
    body='\n'.join(texts.values())
    for token in REQ_OUTBOUND+REQ_INBOUND:
        if token not in body: findings.append(('FAIL','protocol-token',f'Missing required protocol token: {token}'))
    for request,response in CONDITIONAL_INBOUND.items():
        if request in body and response not in body:
            findings.append(('FAIL','protocol-conditional',f'{response} is required when {request} is implemented'))
    if 'game:request-fullscreen' in body and profile['game'].get('fullscreen') is False:
        findings.append(('FAIL','fullscreen-contract','Runtime requests fullscreen while manifest declares fullscreen false'))
    protocol=profile['game']['protocol'];proto_string=f"{protocol['name']}.v{protocol['version']}"
    if proto_string not in body: findings.append(('FAIL','protocol-id',f'Missing protocol identifier {proto_string}'))
    storage=profile['game']['storage'];namespace=storage['namespace']
    if storage.get('persistence')!='none' and namespace not in body: findings.append(('FAIL','storage-namespace',f'Manifest namespace not found in runtime: {namespace}'))
    if storage.get('persistence')=='none' and ('localStorage' in body or 'indexedDB' in body):
        findings.append(('WARN','storage-runtime-mismatch','Runtime references browser storage while manifest declares persistence none; verify opaque/session fallback behavior'))
    if 'toadal:web:v1:' in body: findings.append(('FAIL','website-storage','Website-owned storage namespace referenced by game'))
    return findings

def scan_html(entry:Path,profile:dict[str,Any]):
    return scan_runtime(entry,profile,None)

def validate_tcs_manifest(game:dict[str,Any], manifest:dict[str,Any]):
    if not isinstance(manifest,dict): return False,'tcsManifest must be an object'
    checks=[
      (manifest.get('schemaVersion')=='1.0.0','schemaVersion must be 1.0.0'),
      (manifest.get('id')==game.get('id'),'id must match game id'),
      (manifest.get('version')==game.get('version'),'version must match game version'),
      (manifest.get('title')==game.get('displayName'),'title must match displayName'),
      (manifest.get('entrypoint')=='index.html','entrypoint must be index.html'),
      (manifest.get('bridge',{}).get('protocol')=='tcs.bridge/1','bridge.protocol must be tcs.bridge/1'),
      (isinstance(manifest.get('runtime',{}).get('externalConnectOrigins'),list),'runtime.externalConnectOrigins must be an array'),
    ]
    for ok,msg in checks:
        if not ok:return False,msg
    return True,'identity and bounded intake fields consistent'

def copy_runtime_tree(package_root:Path,runtime:Path,tcs_supplied:bool):
    copied=[]
    for src in sorted(package_root.rglob('*')):
        if src.is_symlink(): raise SystemExit(f'Symlink forbidden in runtime package: {src}')
        if not src.is_file(): continue
        rel=src.relative_to(package_root)
        if any(part.lower() in {'.git','node_modules','__pycache__'} for part in rel.parts): continue
        relposix=rel.as_posix()
        if relposix in GENERATED_RUNTIME_NAMES: continue
        if tcs_supplied and relposix in {'tcs1.json','manifest.tcs1.json'}: continue
        dst=runtime/rel;dst.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dst);copied.append(dst)
    return copied

def ledger(files:list[Path],root:Path):
    rows=[]
    for p in sorted(files,key=lambda x:str(x.relative_to(root)).replace('\\','/')):
        rel=str(p.relative_to(root)).replace('\\','/');rows.append((rel,sha(p),p.stat().st_size))
    raw=''.join(f'{rel}\t{digest}\n' for rel,digest,_ in rows).encode()
    return rows,hashlib.sha256(raw).hexdigest()

def harden(args):
    source=Path(args.source).resolve();out=Path(args.output).resolve();profile=json.loads(Path(args.profile).read_text())
    game=profile['game'];entry=(source/game['entrySource']).resolve()
    if not entry.is_file(): raise SystemExit(f'Entry not found: {entry}')
    if not entry.is_relative_to(source): raise SystemExit('Entry escapes source root')
    runtime_cfg=profile.get('runtimePackage',{});runtime_mode=runtime_cfg.get('mode','single')
    if runtime_mode not in {'single','tree'}: raise SystemExit('runtimePackage.mode must be single or tree')
    package_root=entry.parent
    if runtime_mode=='tree':
        package_root=(source/runtime_cfg.get('root','')).resolve()
        if not package_root.is_dir() or not package_root.is_relative_to(source): raise SystemExit('runtimePackage.root must be a source-owned directory')
        if not entry.is_relative_to(package_root) or entry.relative_to(package_root).as_posix()!='index.html':
            raise SystemExit('Tree runtime entrySource must resolve to root index.html')
    out.mkdir(parents=True,exist_ok=True);runtime=out/'public'/'games'/game['id'];shutil.rmtree(runtime,ignore_errors=True);runtime.mkdir(parents=True)
    checks=[]
    def add(name,passed,detail='',severity='mandatory'): checks.append({'name':name,'passed':bool(passed),'detail':detail,'severity':severity})
    add('G0 identity id',bool(re.fullmatch(r'[a-z0-9][a-z0-9-]*',game['id'])),game['id'])
    add('G0 source entry exists',True,str(entry.relative_to(source)))
    entry_hash=sha(entry)
    expected_hash=profile.get('checks',{}).get('expectedEntrySha256')
    if expected_hash:
        add('G0 immutable entry hash',entry_hash==expected_hash,f'expected {expected_hash}; actual {entry_hash}')
    findings=scan_runtime(entry,profile,package_root if runtime_mode=='tree' else None)
    for sev,code,detail in findings:add(f'{sev} {code}',sev!='FAIL',detail,'mandatory' if sev=='FAIL' else 'advisory')
    add('G1 runtime dependency closure',not any(c['name'].startswith('FAIL nonclosed-entry') for c in checks),f'{runtime_mode} runtime package')
    command_results=[]
    if args.run_commands:
        for item in profile.get('checks',{}).get('commands',[]):
            cr=run_command(source,item);command_results.append(cr);add('G4 '+cr['name'],cr['passed'],'returncode='+str(cr.get('returncode','n/a')))
    else:
        for item in profile.get('checks',{}).get('commands',[]):add('G4 '+item.get('name','project command'),False,'not run in this invocation','external')
    evidence_results=[]
    for item in profile.get('checks',{}).get('evidenceReports',[]):
        rp=(source/item['path']).resolve();name=item.get('name',item['path'])
        try:
            if not rp.is_relative_to(source) or not rp.is_file(): raise FileNotFoundError(rp)
            d=json.loads(rp.read_text());passed=int(d.get('passed',0));failed=int(d.get('failed',0));ok=passed>=int(item.get('minPassed',1)) and failed==0
            er={'name':name,'path':item['path'],'passed':ok,'passedCount':passed,'failedCount':failed};evidence_results.append(er);add('G4 evidence '+name,ok,f'{passed} passed / {failed} failed')
        except Exception as e:
            er={'name':name,'path':item.get('path'),'passed':False,'error':str(e)};evidence_results.append(er);add('G4 evidence '+name,False,str(e))
    tcs_manifest=profile.get('tcsManifest')
    if runtime_mode=='tree':
        payload=copy_runtime_tree(package_root,runtime,tcs_manifest is not None)
    else:
        shutil.copy2(entry,runtime/'index.html');payload=[runtime/'index.html']
    evidence=profile.get('evidence',{})
    poster=(source/evidence['poster']).resolve();shot=(source/evidence['screenshot']).resolve()
    if not poster.is_file() or not shot.is_file(): raise SystemExit('Evidence poster/screenshot missing')
    write_webp(poster,runtime/'poster.webp');write_webp(shot,runtime/'screenshot.webp')
    add('G5 real-build poster evidence',True,str(poster.relative_to(source)))
    add('G5 real-build screenshot evidence',True,str(shot.relative_to(source)))
    payload=[p for p in payload if p.name not in {'poster.webp','screenshot.webp'}]+[runtime/'poster.webp',runtime/'screenshot.webp']
    if tcs_manifest is not None:
        tcs_ok,tcs_detail=validate_tcs_manifest(game,tcs_manifest)
        add('G7 TCS manifest identity',tcs_ok,tcs_detail)
        if tcs_ok:
            (runtime/'tcs1.json').write_text(json.dumps(tcs_manifest,indent=2)+'\n')
            payload.append(runtime/'tcs1.json')
    rows,pkg_hash=ledger(payload,runtime);pkg_bytes=sum(x[2] for x in rows)
    integrity={'schemaVersion':1,'hashMethod':'SHA-256 of sorted path<TAB>sha256 ledger; cartridge.json and integrity file excluded from runtime package hash to avoid self-reference.','runtimeLedgerSha256':pkg_hash,'files':[{'path':r,'sha256':h,'bytes':b} for r,h,b in rows]}
    (runtime/'cartridge.integrity.json').write_text(json.dumps(integrity,indent=2)+'\n')
    manifest={
      'schemaVersion':1,'id':game['id'],'displayName':game['displayName'],'version':game['version'],'publicState':game.get('publicState','PREVIEW'),'entry':'index.html','poster':'poster.webp','orientation':game['orientation'],'inputs':game['inputs'],'storage':game['storage'],'fullscreen':bool(game.get('fullscreen',True)),'mobileSupport':bool(game.get('mobileSupport',True)),'protocol':game['protocol'],
      'source':{'repository':game['source']['repository'],'ref':game['source']['ref'],'entrySource':game['entrySource'],'sourceHash':entry_hash},
      'knownLimitations':game.get('knownLimitations',[]),'package':{'files':len(rows),'bytes':pkg_bytes,'sha256':pkg_hash},'packageHashMethod':integrity['hashMethod']
    }
    try:jsonschema.validate(manifest,SCHEMA);schema_ok=True;schema_error=''
    except Exception as e:schema_ok=False;schema_error=str(e)
    add('G7 cartridge.json schema',schema_ok,schema_error or 'schema v1 valid')
    (runtime/'cartridge.json').write_text(json.dumps(manifest,indent=2)+'\n')
    for pth in [runtime/'poster.webp',runtime/'screenshot.webp']:
        try:
            with Image.open(pth) as im: im.verify(); ok=True
        except Exception as e:ok=False
        add('G7 image decodes '+pth.name,ok,pth.name)
    mandatory_fail=[c for c in checks if c['severity']=='mandatory' and not c['passed']]
    command_items=profile.get('checks',{}).get('commands',[])
    command_qa=bool(command_items) and args.run_commands and all(x['passed'] for x in command_results)
    evidence_qa=bool(evidence_results) and all(x['passed'] for x in evidence_results) and (not expected_hash or entry_hash==expected_hash)
    if mandatory_fail: level=0; disposition='FAIL'
    else:
        level=3
        if command_qa or evidence_qa: level=4
        disposition='PREVIEW_CANDIDATE' if level>=4 else 'HARDENED_NOT_QA_QUALIFIED'
    report={'standard':'TOADAL Browser Game Cartridge Hardening Standard v1','gameId':game['id'],'version':game['version'],'hardeningLevel':level,'disposition':disposition,'publicState':manifest['publicState'],'entrySha256':entry_hash,'runtimeLedgerSha256':pkg_hash,'checks':checks,'commandResults':command_results,'evidenceResults':evidence_results,'externalGates':{'realWebsiteHost':'NOT_RUN','physicalDevice':'NOT_RUN','publicDecision':'BLOCKED_UNTIL_EXTERNAL_GATES'}}
    (out/'HARDENING_REPORT.json').write_text(json.dumps(report,indent=2)+'\n')
    shutil.copy2(args.profile,out/'profile.json')
    zip_path=out/(game['id']+'-cartridge.zip')
    with zipfile.ZipFile(zip_path,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
        for p in sorted((out/'public').rglob('*')):
            if not p.is_file():
                continue
            rel=str(p.relative_to(out)).replace('\\','/')
            info=zipfile.ZipInfo(rel,date_time=(1980,1,1,0,0,0))
            info.compress_type=zipfile.ZIP_DEFLATED
            info.create_system=3
            info.external_attr=(0o100644 & 0xFFFF) << 16
            z.writestr(info,p.read_bytes(),compress_type=zipfile.ZIP_DEFLATED,compresslevel=9)
    with zipfile.ZipFile(zip_path) as z:bad=z.testzip()
    add('G7 ZIP integrity',bad is None,'PASS' if bad is None else str(bad))
    report['checks']=checks;report['zip']={'path':zip_path.name,'sha256':sha(zip_path),'bytes':zip_path.stat().st_size,'crcPass':bad is None}
    (out/'HARDENING_REPORT.json').write_text(json.dumps(report,indent=2)+'\n')
    md=[f"# Cartridge hardening report — {game['displayName']} {game['version']}",'',f"**Disposition:** `{disposition}`  ",f"**Cartridge Hardening Level:** CHL-{level}  ",f"**Declared public state:** `{manifest['publicState']}`  ",f"**Runtime ledger SHA-256:** `{pkg_hash}`",'', '## Automated checks','']
    for c in checks:md.append(f"- {'PASS' if c['passed'] else ('NOT RUN' if c['severity']=='external' else 'FAIL')}: **{c['name']}** — {c['detail']}")
    md += ['', '## External gates still required','', '- Real TOADAL website player/iframe lifecycle: **NOT RUN by this hardener invocation**.', '- Physical-device acceptance/performance: **NOT RUN**.', '- PUBLIC promotion: **not authorized by local hardening alone**.','']
    (out/'HARDENING_REPORT.md').write_text('\n'.join(md))
    print(json.dumps({'disposition':disposition,'hardeningLevel':level,'output':str(out),'cartridgeZip':str(zip_path),'zipSha256':sha(zip_path),'runtimeLedgerSha256':pkg_hash,'mandatoryFailures':len(mandatory_fail)},indent=2))
    return 1 if mandatory_fail else 0

def main():
    ap=argparse.ArgumentParser(description='TOADAL Cartridge Hardener v1')
    sub=ap.add_subparsers(dest='cmd',required=True)
    h=sub.add_parser('harden');h.add_argument('--profile',required=True);h.add_argument('--source',required=True);h.add_argument('--output',required=True);h.add_argument('--run-commands',action='store_true')
    a=ap.parse_args();sys.exit(harden(a) if a.cmd=='harden' else 2)
if __name__=='__main__':main()
