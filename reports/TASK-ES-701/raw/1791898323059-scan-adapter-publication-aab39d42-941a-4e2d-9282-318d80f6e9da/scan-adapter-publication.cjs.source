'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const names=cp.execFileSync('git',['-c','core.longpaths=true','diff','--cached','--name-only','-z'],{cwd:root}).toString('utf8').split('\0').filter(Boolean);
const files=[],findings=[];
for(const file of names){const bytes=cp.execFileSync('git',['-c','core.longpaths=true','show',':'+file],{cwd:root,maxBuffer:32*1024*1024}),text=bytes.toString('utf8');let detected=false;
 if(/\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/.test(text))detected=true;
 for(const hit of text.matchAll(/[?&](?:apikey|api_key|access_token|refresh_token|token)=([^\s&'"<>]+)/gi))if(!hit[1].startsWith('[정보'))detected=true;
 if(detected)findings.push({file,reason:'게시 credential 문자열 발견; 값 출력하지 않음'});
 files.push({file,sha256:sha(bytes),bytes:bytes.length});
}
const result={taskId:'TASK-ES-701',scope:'0573 이후 새 게시 index blob 전량; production/legacy fixture 전수검사 아님',files,findings,credentialValuesPrinted:false,credentialRawPublished:false,observationOriginalsPrivate:true,thirdPushHeld:true};
fs.writeFileSync(path.join(__dirname,'scenario-adapter-publication-scan.json'),JSON.stringify(result,null,2)+'\n',{encoding:'utf8',flag:'wx'});
console.log(JSON.stringify({filesChecked:files.length,findings,thirdPushHeld:true}));process.exitCode=findings.length?1:0;
