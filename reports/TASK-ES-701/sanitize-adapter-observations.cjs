'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),sourceRoot=path.join(__dirname,'scenario-adapter-observations');
const privateRoot='C:/Users/HP/handover/2026-10-13-claude-309dca5d/private-recovery/TASK-ES-701-scenario-adapter-raw';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const names=['post-failure-retention','frozen-caption-preview','cancel-after-failure'],rows=[];
fs.mkdirSync(privateRoot,{recursive:true});
for(const name of names){
 const dirs=fs.readdirSync(sourceRoot).filter(d=>d.startsWith(name+'-'));if(dirs.length!==1)throw new Error('원 1회 실행 자료 경계');
 const source=path.resolve(sourceRoot,dirs[0],'observation.json'),target=path.resolve(privateRoot,dirs[0]+'.json');
 if(!source.startsWith(sourceRoot+path.sep)||!target.startsWith(path.resolve(privateRoot)+path.sep))throw new Error('이동 경로 경계');
 const bytes=fs.readFileSync(source),original=JSON.parse(bytes.toString('utf8'));let redactions=0;
 function redact(value){
  if(typeof value==='string')return value.replace(/([?&](?:apikey|api_key|access_token|refresh_token|token)=)[^\s&'"<>]+/gi,(_,key)=>{redactions++;return key+'[정보 제거]';}).replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,()=>{redactions++;return '[정보 제거]';}).replace(/\bBearer\s+[A-Za-z0-9._-]+/gi,()=>{redactions++;return '[정보 제거]';});
  if(Array.isArray(value))return value.map(redact);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,redact(item)]));
  return value;
 }
 const safe=redact(original),out=path.join(path.dirname(source),'observation.sanitized.json');
 fs.writeFileSync(target,bytes,{flag:'wx'});if(!fs.readFileSync(target).equals(bytes))throw new Error('원시 private 되읽기 불일치');
 fs.writeFileSync(out,JSON.stringify({derivation:{kind:'작업자 원시의 자격정보 제거 파생본',originalSha256:sha(bytes),redactions,privateOriginal:target.replace(/\\/g,'/'),originalModified:false},...safe},null,2)+'\n',{encoding:'utf8',flag:'wx'});
 fs.unlinkSync(source);
 const safeBytes=fs.readFileSync(out);
 rows.push({name,privateOriginal:target.replace(/\\/g,'/'),originalSha256:sha(bytes),originalBytes:bytes.length,publishedFile:path.relative(root,out).replace(/\\/g,'/'),publishedSha256:sha(safeBytes),redactions,privateReadbackEqual:true});
}
fs.renameSync(path.join(__dirname,'scenario-adapter-manifest.json'),path.join(__dirname,'scenario-adapter-initial-seal.json'));
fs.writeFileSync(path.join(__dirname,'scenario-adapter-redaction.json'),JSON.stringify({taskId:'TASK-ES-701',reason:'커밋 HARDCODED_SECRET 거절로 WebSocket query와 token을 게시 제외',originalProbeRepeated:false,rootApprovedProductChanged:false,rows},null,2)+'\n',{encoding:'utf8',flag:'wx'});
console.log(JSON.stringify({rows,originalProbeRepeated:false}));
