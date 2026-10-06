import { writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const output = pathToFileURL(resolve(process.argv[2] || 'evidence/cards') + '/');
await mkdir(output, { recursive: true });
for(const [name,kind,theme,score] of [['feast-invitation','invite','feast'],['astro-invitation','invite','astro'],['feast-personal-score','score','feast',12480],['astro-personal-score','score','astro',12480],['astro-large-score','score','astro',999999999]]) {
 const payload={schemaVersion:1,kind,theme,gameId:kind==='score'?'wicked-bites':'toadal-feast',...(kind==='score'?{score}:{})};
 const response=await fetch('http://127.0.0.1:8787/api/preview',{method:'POST',headers:{Origin:'http://127.0.0.1:8787','Content-Type':'application/json'},body:JSON.stringify(payload)});
 if(!response.ok)throw new Error(await response.text());
 await writeFile(new URL(name+'.png',output),new Uint8Array(await response.arrayBuffer()));
 console.log(name, response.status);
}
