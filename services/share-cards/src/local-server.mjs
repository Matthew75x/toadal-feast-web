import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { initWasm, Resvg } from '@resvg/resvg-wasm';
import { createRenderer, dataPng } from './renderer.mjs';
import { createService } from './service.mjs';
import { FileStore } from './file-store.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const port = Number(process.env.PORT || 8787), origin = 'http://127.0.0.1:' + port;
await initWasm(await readFile(new URL('../node_modules/@resvg/resvg-wasm/index_bg.wasm', import.meta.url)));
const bytes = async name => new Uint8Array(await readFile(resolve(root, 'assets', name)));
const assets = { header: dataPng(await bytes('toadal-feast-header.png')), frame: dataPng(await bytes('astro-score-frame.png')), toad: dataPng(await bytes('toadal-victory.png')) };
const renderer = createRenderer(Resvg, assets, await bytes('LilitaOne-Latin.ttf'));
const store = new FileStore(resolve(root, process.env.SHARE_DATA_DIR || '.local-data'));
const service = createService({ store, render: renderer, origin, allowedOrigins: [origin, 'http://localhost:' + port], creationEnabled: true, aliasAllowed: process.env.ALLOW_PUBLIC_ALIAS === 'true', maxDailyCreates: 100, maxDailyRenders: 300 });
const staticFiles = { '/': ['index.html','text/html; charset=utf-8'], '/styles.css': ['styles.css','text/css; charset=utf-8'], '/composer.mjs': ['composer.mjs','text/javascript; charset=utf-8'], '/share-client.mjs': ['share-client.mjs','text/javascript; charset=utf-8'] };
const server = createServer(async (req,res) => {
  try {
    const path = new URL(req.url,origin).pathname;
    if(staticFiles[path] && ['GET','HEAD'].includes(req.method)) {
      const [file,type] = staticFiles[path], body = await readFile(resolve(root,'public',file));
      res.writeHead(200,{ 'Content-Type':type, 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff', 'Referrer-Policy':'no-referrer', 'Content-Security-Policy':"default-src 'self'; img-src 'self' blob:; style-src 'self'; script-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'" }); res.end(req.method === 'HEAD' ? undefined : body); return;
    }
    const chunks=[]; let size=0;
    for await(const chunk of req) { size+=chunk.length; if(size>4096) { res.writeHead(413);res.end('Payload too large');return; } chunks.push(chunk); }
    const request = new Request(origin + req.url,{ method:req.method, headers:req.headers, ...(!['GET','HEAD'].includes(req.method) ? { body:Buffer.concat(chunks) } : {}) });
    const response = await service.fetch(request);
    res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
  } catch { res.writeHead(503,{ 'Cache-Control':'no-store' });res.end('Temporarily unavailable'); }
});
server.requestTimeout = 10000; server.headersTimeout = 10000;
server.listen(port,'127.0.0.1',()=>console.log('Share-card studio: '+origin+' (local only; analytics off)'));
const timer=setInterval(()=>{ void service.cleanup().catch(()=>console.error('Local cleanup needs attention')); },60000);timer.unref();
process.on('SIGINT',()=>{clearInterval(timer);server.close();});
