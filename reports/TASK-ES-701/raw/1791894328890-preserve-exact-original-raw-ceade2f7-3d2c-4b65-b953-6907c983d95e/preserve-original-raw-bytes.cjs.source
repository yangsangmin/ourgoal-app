'use strict';
const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'product-manifest.json'),'utf8'));
const differing=manifest.artifacts.filter(r=>r.file.endsWith('.bin')).map(row=>{const bytes=fs.readFileSync(path.join(root,row.file));return {row,bytes};}).filter(x=>sha(x.bytes)!==x.row.sha256);
fs.writeFileSync(path.join(__dirname,'original-raw-byte-envelope.json'),JSON.stringify({source:manifest.productSource,reason:'Git 자동 줄바꿈 정규화가 고정 blob의 두 Windows stderr를 LF로 저장했다. 고정 blob은 변경하지 않고 아직 남은 실제 원시 바이트를 별도 봉인한다.',items:differing.map(x=>({file:x.row.file,frozenGitSHA256:x.row.sha256,originalDiskSHA256:sha(x.bytes),originalBytes:x.bytes.length,base64:x.bytes.toString('base64')})),claim:'원 stdout/stderr 실행은 재실행하지 않았다',sourceMutations:0},null,2)+'\n',{encoding:'utf8',flag:'wx'});
console.log(JSON.stringify({originalByteEnvelopes:differing.length}));
