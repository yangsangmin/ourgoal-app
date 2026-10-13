'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),ticket=/task-es-703(?:\D|$)/i;
function run(exe,args){const r=cp.spawnSync(exe,args,{cwd:root,encoding:'utf8',windowsHide:true,maxBuffer:4*1024*1024,timeout:30000});if(r.status!==0)throw Error(exe+' '+r.status);return r.stdout;}
const list=run('gh',['pr','list','--repo','yangsangmin/ourgoal-app','--state','all','--limit','1000','--json','number,title,headRefName,state']),prs=JSON.parse(list),remote=run('git',['-c','core.longpaths=true','ls-remote','origin']);
if(prs.length>=1000)throw Error('PR_REGISTRY_PAGINATION_REQUIRED');
const hits=prs.filter(r=>ticket.test(r.title)||ticket.test(r.headRefName)),refs=remote.split('\n').filter(s=>ticket.test(s));
fs.writeFileSync(path.join(__dirname,'ticket-registry-read.json'),JSON.stringify({ticket:'TASK-ES-703',at:new Date().toISOString(),PID:process.pid,PRStates:'all',limit:1000,listedPRs:prs.length,allStateHits:hits,remoteHits:refs,remoteSHA:sha(remote),listSHA:sha(list),reservationRun:false},null,2)+'\n',{encoding:'utf8',flag:'wx'});
if(hits.length||refs.length)throw Error('TICKET_OCCUPIED');
const target='refs/heads/feat/task-es-703-feed-private-stage2-01a1310c',push=run('git',['-c','core.longpaths=true','push','origin','HEAD:'+target]);
const actual=run('git',['-c','core.longpaths=true','ls-remote','origin',target]);
const r={ticket:'TASK-ES-703',target,sourceCommit:run('git',['-c','core.longpaths=true','rev-parse','HEAD']).trim(),actualRef:actual.trim(),pushStdoutSHA:sha(push),reservationRun:true,onlyAlreadyPublicBasePushed:true};
fs.writeFileSync(path.join(__dirname,'ticket-reservation.json'),JSON.stringify(r,null,2)+'\n',{encoding:'utf8',flag:'wx'});console.log(JSON.stringify(r));
