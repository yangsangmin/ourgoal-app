'use strict';
const fs=require('fs'),cp=require('child_process'),crypto=require('crypto'),path=require('path'),run=process.argv[2],kind=process.argv[3]||'first';
const raw=cp.execFileSync('gh',['run','view',run,'--log-failed'],{encoding:'utf8'});
fs.writeFileSync(path.join(__dirname,'.private','CI-gate-'+kind+'.log'),raw,{encoding:'utf8',flag:'wx'});
const lines=raw.split('\n').filter(x=>/✖|block|ERROR|Error:|NO_TAG|HARDCODED|ticket|금지|승인|fail/i.test(x)).map(x=>x.replace(/eyJ[A-Za-z0-9_.-]+/g,'[key-redacted]').replace(/(apikey|token|key)=([^\s'"&]+)/gi,'credential=[redacted]'));
const v={at:new Date().toISOString(),run,originalLogSHA256:crypto.createHash('sha256').update(raw).digest('hex'),originalLocalOnly:'.private/CI-gate-'+kind+'.log',lines};
fs.writeFileSync(path.join(__dirname,'CI-gate-'+kind+'-metadata.json'),JSON.stringify(v,null,2)+'\n',{encoding:'utf8',flag:'wx'});console.log(JSON.stringify(v));
