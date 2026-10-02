import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
const root = path.resolve(process.argv[2] || 'dist');
const base = '/toadal-feast-web/';
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = http.createServer((request, response) => {
  let file;
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (!pathname.startsWith(base)) throw new Error('outside base');
    file = path.resolve(root, pathname.slice(base.length));
    if (file !== root && !file.startsWith(root + path.sep)) throw new Error('outside dist');
    if (pathname.endsWith('/') || fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) throw new Error('not found');
    response.writeHead(200, { 'content-type': mime[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
  } catch (_) {
    file = path.join(root, '404.html');
    response.writeHead(404, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
  }
  fs.createReadStream(file).pipe(response);
});
server.listen(Number(process.argv[3] || 8147), '127.0.0.1', () => console.log('http://127.0.0.1:' + server.address().port + base));
process.on('SIGINT', () => server.close(() => process.exit(0)));
