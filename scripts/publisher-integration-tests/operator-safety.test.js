const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
test('website integration test runner only starts the local Node test suite',()=>{
 const s=fs.readFileSync(path.join(root,'scripts/run-publisher-integration-tests.cjs'),'utf8');
 assert.match(s,/spawnSync\(process\.execPath,\['--test',\.\.\.tests\]/);
 assert.match(s,/shell:false/);
 const forbidden=[/fs\.(?:writeFile|appendFile|rm|unlink|rename)/,/Restart-Service/i,/Stop-Service/i,/Start-Service/i,/Set-Service/i,/git\s+(?:fetch|reset|clean|checkout)/i,/schtasks/i];
 for(const rx of forbidden)assert.equal(rx.test(s),false,String(rx));
});
test('actual dist loader absence/error leaves qualified UI text untouched',()=>{
 const s=fs.readFileSync(path.join(root,'dist/assets/js/publisher-integration-loader.js'),'utf8');
 assert.match(s,/Fail closed and leave the qualified local\/truthful UI untouched/);
 assert.doesNotMatch(s,/Connected services are unavailable right now/);
});
test('actual Studio and dist trees contain the same fourteen runtime modules and GameServices seam',()=>{
 const studio=path.join(root,'studio-project/toadal-feast-website/reference/assets/js/publisher-integration');
 const dist=path.join(root,'dist/assets/js/publisher-integration');
 const src=fs.readdirSync(studio).filter(x=>x.endsWith('.js')).sort();
 const dst=fs.readdirSync(dist).filter(x=>x.endsWith('.js')).sort();
 assert.equal(src.length,14);assert.deepEqual(dst,src);
 for(const f of src)assert.deepEqual(fs.readFileSync(path.join(studio,f)),fs.readFileSync(path.join(dist,f)),f+' bytes');
 assert.ok(src.includes('game-services.js'));
});
