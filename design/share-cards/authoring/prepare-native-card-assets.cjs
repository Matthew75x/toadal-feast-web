const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');
const {chromium}=require('./share-cards-checkout/services/share-cards/node_modules/playwright');
(async()=>{
const native=JSON.parse(fs.readFileSync('work/share-decoration-assets/native-assortment/provenance.json','utf8'));
const dir='work/share-decoration-assets/preview-encodings';fs.mkdirSync(dir,{recursive:true});
const inputs=native.assets.map(a=>({key:a.filename.replace('food_','').replace('.png',''),source:a.localPath,visibleFraction:a.visibleLongestDimensionFraction,maxEdge:256}));
inputs.push({key:'golden_crown',source:'C:/Users/Metarator/Downloads/image-gen-6(2).png',maxEdge:384},{key:'burger_feast',source:'C:/Users/Metarator/Downloads/Crowned Frog Devours a Burger.png',maxEdge:384});
const browser=await chromium.launch({headless:true});const page=await browser.newPage();const output={foods:{},mascots:{},provenance:[]};
for(const input of inputs){
const bytes=fs.readFileSync(input.source);const uri='data:image/png;base64,'+bytes.toString('base64');
const encoded=await page.evaluate(async({uri,maxEdge})=>{
const im=new Image();im.src=uri;await im.decode();const scale=Math.min(1,maxEdge/Math.max(im.naturalWidth,im.naturalHeight));
const c=document.createElement('canvas');c.width=Math.round(im.naturalWidth*scale);c.height=Math.round(im.naturalHeight*scale);c.getContext('2d').drawImage(im,0,0,c.width,c.height);
return {uri:c.toDataURL('image/webp',.92),width:c.width,height:c.height,sourceWidth:im.naturalWidth,sourceHeight:im.naturalHeight};
},{uri,maxEdge:input.maxEdge});
const file=path.join(dir,input.key+'.webp');fs.writeFileSync(file,Buffer.from(encoded.uri.split(',')[1],'base64'));
const group=input.visibleFraction?'foods':'mascots';output[group][input.key]={uri:encoded.uri,visibleFraction:input.visibleFraction||null,path:path.resolve(file)};
output.provenance.push({key:input.key,source:input.source,sourceSha256:crypto.createHash('sha256').update(bytes).digest('hex'),encoding:'WebP quality .92; same artwork and transparency; food256px, mascot<=384px for preview only',width:encoded.width,height:encoded.height,encodedPath:path.resolve(file),encodedSha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),encodedBytes:fs.statSync(file).size});
}
fs.writeFileSync(path.join(dir,'inline-assets.json'),JSON.stringify(output));
fs.writeFileSync(path.join(dir,'provenance.json'),JSON.stringify(output.provenance,null,2));
await browser.close();console.log(JSON.stringify({foods:Object.keys(output.foods).length,mascots:Object.keys(output.mascots).length,encodedBytes:output.provenance.reduce((sum,a)=>sum+a.encodedBytes,0)}));
})();
