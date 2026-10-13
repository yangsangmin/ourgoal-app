'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),source='f4dd6c834fe30e2cbd1b7ea22791a40c96462c6a',base='reports/TASK-ES-701-PRODUCT-REVIEW/',sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const git=p=>cp.execFileSync('git',['-c','core.longpaths=true','cat-file','-p',source+':'+p],{cwd:root,maxBuffer:32*1024*1024});
const manifest=git(base+'manifest.json');if(sha(manifest)!=='3728a0dd8317457025d0074257103d302aa1a6e880dac1c9b579d87396071176')throw Error('원 제품 의견 manifest 불일치');
const out=path.join(__dirname,'original-product-review');fs.mkdirSync(out,{recursive:true});
const pins=[];for(const name of ['과정-원독립의견.md','본질-원독립의견.md','HANDOFF.md','manifest.json','measurement.json','seal.json']){const b=git(base+name);fs.writeFileSync(path.join(out,name),b,{flag:'wx'});pins.push({file:base+name,sha256:sha(b),bytes:b.length});}
fs.writeFileSync(path.join(out,'source-pins.json'),JSON.stringify({source,originalOpinion:'fe555317f8c0f04ecb854f3435b20e2301ea1db5',originalProduct:'bc61afd18534623859f0cba60131c8babb52a45b',pins,rawSource:source+':'+base+'raw/',originalBytesChanged:0,repeatedReview:false},null,2)+'\n',{encoding:'utf8',flag:'wx'});
console.log(JSON.stringify({source,opinionPins:pins.length}));
