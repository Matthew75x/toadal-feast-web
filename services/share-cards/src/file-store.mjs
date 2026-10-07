import { mkdir, readFile, writeFile, rename, link, unlink, readdir } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
export class FileStore {
  constructor(root) { this.root = resolve(root); }
  file(key) { if (!/^[a-zA-Z0-9/_-]+$/.test(key)) throw new Error('Invalid storage key.'); const path = resolve(this.root, key); if (!path.startsWith(this.root + sep)) throw new Error('Invalid storage path.'); return path; }
  async get(key) { try { return new Uint8Array(await readFile(this.file(key))); } catch (e) { if (e.code === 'ENOENT') return null; throw e; } }
  async create(key, data) {
    const path = this.file(key), dir = resolve(path, '..'); await mkdir(dir, { recursive: true });
    const temp = join(dir, '.tmp-' + crypto.randomUUID()); await writeFile(temp, data, { flag: 'wx', mode: 0o600 });
    try { await link(temp, path); return true; } catch(e) { if (e.code === 'EEXIST') return false; throw e; } finally { await unlink(temp); }
  }
  async put(key, data) {
    const path = this.file(key); await mkdir(resolve(path, '..'), { recursive: true });
    const temp = join(resolve(path, '..'), '.tmp-' + crypto.randomUUID()); await writeFile(temp, data, { mode: 0o600 });
    try { for(let attempt = 0; ; attempt++) { try { await rename(temp, path); break; } catch(e) { if(!['EPERM','EACCES','EBUSY'].includes(e.code) || attempt >= 19) throw e; await new Promise(done => setTimeout(done,10)); } } } finally { await unlink(temp).catch(e => { if(e.code !== 'ENOENT') throw e; }); }
  }
  async delete(key) { await unlink(this.file(key)).catch(e => { if(e.code !== 'ENOENT') throw e; }); }
  async listKeys(prefix) {
    const result = [];
    const walk = async (dir, relative = '') => {
      let items; try { items = await readdir(dir, { withFileTypes: true }); } catch(e) { if(e.code === 'ENOENT') return; throw e; }
      for(const item of items) { if(item.name.startsWith('.')) continue; const key = relative + item.name; if(item.isDirectory()) await walk(join(dir,item.name),key+'/'); else if(key.startsWith(prefix)) result.push(key); }
    };
    await walk(this.root); return result;
  }
  async list(prefix) { return Promise.all((await this.listKeys(prefix)).map(async key => ({ key, data: await this.get(key) }))); }
}
