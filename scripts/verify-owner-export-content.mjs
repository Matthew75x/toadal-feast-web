import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const [firstInput,secondInput,reportInput]=process.argv.slice(2);
if(!firstInput||!secondInput)throw Error('Pass two absolute export directories and optional report path');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function ledger(root){const files=[];function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const file=path.join(dir,entry.name);if(entry.isSymbolicLink())throw Error('Symlink rejected: '+file);if(entry.isDirectory())walk(file);else if(entry.isFile()){const bytes=fs.readFileSync(file);files.push({path:path.relative(root,file).replaceAll('\\','/'),bytes:bytes.length,sha256:hash(bytes)});}}}walk(root);return files.sort((a,b)=>a.path.localeCompare(b.path));}
const first=path.resolve(firstInput),second=path.resolve(secondInput),a=ledger(first),b=ledger(second),exact=JSON.stringify(a)===JSON.stringify(b);
const keys=new Set([...a,...b].map(x=>x.path)),changes=[...keys].filter(key=>JSON.stringify(a.find(x=>x.path===key))!==JSON.stringify(b.find(x=>x.path===key)));
const report={schema:'toadal-feast.owner-export-content-parity.v1',status:exact?'PASS':'FAIL',first,second,firstFiles:a.length,secondFiles:b.length,indexPresent:a.some(x=>x.path==='index.html'),notFoundPresent:a.some(x=>x.path==='404.html'),firstLedgerSha256:hash(JSON.stringify(a)),secondLedgerSha256:hash(JSON.stringify(b)),changes,files:a};
if(reportInput)fs.writeFileSync(path.resolve(reportInput),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,files:undefined},null,2));if(!exact||!report.indexPresent||!report.notFoundPresent)process.exitCode=1;
