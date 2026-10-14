'use strict';
const fs=require('fs'),crypto=require('crypto');const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
fs.mkdirSync(__dirname+'/public',{recursive:true});
const projections=[];
for(const name of ['C2-before.json','C2-after.json','C2-final.json']){
  const raw=fs.readFileSync(__dirname+'/'+name),projection=JSON.parse(raw.toString('utf8'));let redacted=0;
  for(const error of projection.consoleErrors||[]){if(typeof error.text==='string')error.text=error.text.replace(/([?&]apikey=)[^&'"\s]+/g,(_match,prefix)=>{redacted++;return prefix+'[public SDK credential omitted]';});}
  projection.redaction={scope:'consoleErrors URL credential only; steps/assertions/result/product pins unchanged',rawLocalFile:name,rawSHA256:hash(raw),rawBytes:raw.length,redactedURLs:redacted,rawPublished:false};
  const dest=__dirname+'/public/'+name;fs.writeFileSync(dest,JSON.stringify(projection,null,2)+'\n','utf8');
  projections.push({rawLocalFile:name,rawSHA256:hash(raw),rawBytes:raw.length,publicFile:'public/'+name,publicSHA256:hash(fs.readFileSync(dest)),redactedURLs:redacted});
}
fs.writeFileSync(__dirname+'/C2-public-projection.json',JSON.stringify({scope:'secret-bearing raw excluded from Git; source/steps/results immutable',projections},null,2)+'\n','utf8');
console.log(JSON.stringify(projections));
