'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),base='db8b7ebbd8a9104cd2e3c10f1602d2ae32bf0d6c',folder=fs.mkdtempSync(path.join(os.tmpdir(),'es701-ingress-baseline-'));
const files=['tests/comm-post-feed-button-fix.test.js','index.html','ui.css','js/team-invite-comm.js','js/team-recruit.js','js/team-share.js','js/team-chat.js','js/team-templates.js','js/team-dm-inbox.js','js/team-dm-room.js','js/team-profile.js','js/team-companion-search.js','js/team-companions.js','js/team-auto-actions.js','js/core/toast.js','js/core/confirm.js'];
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),pins=[];
for(let i=0;i<files.length;i++){
 const text=cp.execFileSync('git',['-c','core.longpaths=true','cat-file','-p',base+':'+files[i]],{cwd:root,maxBuffer:8*1024*1024}).toString('utf8');
 for(const m of text.matchAll(/require\(['"](\.[^'"]+)['"]\)/g)){
  let rel=path.posix.normalize(path.posix.join(path.posix.dirname(files[i]),m[1]));if(!path.posix.extname(rel))rel+='.js';
  if(!files.includes(rel))files.push(rel);
 }
}
for(const file of files){const b=cp.execFileSync('git',['-c','core.longpaths=true','cat-file','-p',base+':'+file],{cwd:root,maxBuffer:8*1024*1024});const target=path.join(folder,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,b,{flag:'wx'});pins.push({file,sha256:sha(b)});}
const child=cp.spawnSync(process.execPath,[path.join(folder,files[0])],{cwd:folder,env:{...process.env,NODE_PATH:'C:/dev/ourgoal-app/node_modules'},encoding:'utf8'});
fs.writeFileSync(path.join(__dirname,'ingress-baseline-recursive-dependencies.json'),JSON.stringify({base,folder,pins,childPid:child.pid,exit:child.status,stdout:child.stdout,stderr:child.stderr,testsChanged:0},null,2)+'\n',{encoding:'utf8',flag:'wx'});
console.log(JSON.stringify({base,childPid:child.pid,exit:child.status,assertion:(child.stderr||'').includes('renderCalendar must be called')}));process.exitCode=child.status||0;
