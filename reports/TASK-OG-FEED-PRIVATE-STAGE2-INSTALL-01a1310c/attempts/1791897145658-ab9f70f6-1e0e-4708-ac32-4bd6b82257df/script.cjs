'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const file=path.join(__dirname,'FINAL-PREPARED.json'),bytes=fs.readFileSync(file),m=JSON.parse(bytes),s=fs.readFileSync(path.join(__dirname,m.sqlFile),'utf8');
fs.writeFileSync(path.join(__dirname,'FINAL-PREPARED-before-body-rebind.json'),bytes,{flag:'wx'});
m.functions=[...s.matchAll(/create or replace function public\.(\w+)\([\s\S]*?as \$fn\$([\s\S]*?)\$fn\$;/g)].map(x=>({name:x[1],bodyMD5:crypto.createHash('md5').update(x[2]).digest('hex'),sqlSHA:crypto.createHash('sha256').update(x[0]).digest('hex')}));
if(m.functions.length!==13)throw Error('FIXED_FUNCTION_COUNT');
fs.writeFileSync(file,JSON.stringify(m,null,2)+'\n','utf8');console.log(JSON.stringify({fixedFunctions:m.functions.length,SQLApplied:0,rebindReason:'actual fixed SQL LF bodies, not pre-normalization generator bodies'}));
