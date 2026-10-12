'use strict';
const cp=require('child_process'),fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'../../../..');
const r=cp.spawnSync(process.env.ComSpec||'C:/Windows/System32/cmd.exe',['/d','/s','/c','npm test'],{cwd:root,encoding:'utf8',env:{...process.env,NODE_PATH:'C:/dev/ourgoal-app/node_modules'},windowsHide:true,maxBuffer:20*1024*1024});
fs.writeFileSync(path.join(__dirname,'npm-test.stdout.log'),r.stdout||'','utf8');fs.writeFileSync(path.join(__dirname,'npm-test.stderr.log'),r.stderr||'','utf8');
const out={command:'npm test',exitCode:r.status,error:r.error?String(r.error):null,source:'summary.json sourceFiles SHA256',scope:'new followup worker preliminary check; not verdict'};fs.writeFileSync(path.join(__dirname,'npm-test.json'),JSON.stringify(out,null,2)+'\n','utf8');console.log(JSON.stringify(out));process.exitCode=r.status===0?0:1;
