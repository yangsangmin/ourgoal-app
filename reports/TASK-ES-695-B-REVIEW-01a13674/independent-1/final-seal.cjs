'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const files=fs.readdirSync(__dirname).filter(n=>fs.statSync(path.join(__dirname,n)).isFile()).map(n=>({file:n,sha256:sha(fs.readFileSync(path.join(__dirname,n)))}));
const out={schema:'K18-B-independent-final-packet/1',at:new Date().toISOString(),frozenSource:'0e785c9d55f157435970bd73c0ff32bf538fe656',firstOpinionRef:files.find(r=>r.file==='FIRST-OPINION.md'),files,firstOpinionImmutable:true,productChanges:0,operatingChanges:0,actualPrivateUse:null,Court:null,effect:null};
const file=__dirname+'/final-packet-seal.json',s=JSON.stringify(out,null,2)+'\n';fs.writeFileSync(file,s,{encoding:'utf8',flag:'wx'});assert.equal(fs.readFileSync(file,'utf8'),s);console.log(JSON.stringify({file,sha256:sha(Buffer.from(s)),firstOpinionRef:out.firstOpinionRef}));
