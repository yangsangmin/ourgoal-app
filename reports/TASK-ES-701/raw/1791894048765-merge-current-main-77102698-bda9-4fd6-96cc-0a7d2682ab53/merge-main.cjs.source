'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'../..');
const git=args=>cp.spawnSync('git',['-c','core.longpaths=true',...args],{cwd:root,env:{...process.env,NODE_PATH:'C:/dev/ourgoal-app/node_modules'},encoding:'utf8',maxBuffer:16*1024*1024});
const current=git(['rev-parse','origin/main']);
if(current.stdout.trim()!=='f0ac1158c23c4729b0ce0b1d2637a3895c604d2b')throw Error('허용한 main source 변경');
const r=git(['-c','core.attributesFile=C:/dev/ourgoal-app/.git/info/attributes','merge','--no-edit','origin/main']);
fs.writeFileSync(path.join(__dirname,'main-merge.json'),JSON.stringify({from:'3aad63bfa315ee5752426a042159063fd9850891',originMain:current.stdout.trim(),childPid:r.pid,exit:r.status,stdout:r.stdout,stderr:r.stderr,operatingDeployment:false},null,2)+'\n',{encoding:'utf8',flag:'wx'});
console.log(JSON.stringify({childPid:r.pid,exit:r.status,head:git(['rev-parse','HEAD']).stdout.trim(),conflicts:git(['diff','--name-only','--diff-filter=U']).stdout.trim()}));process.exitCode=r.status||0;
