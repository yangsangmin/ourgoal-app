// #TASK-ES-475: 시험지 선행 실측 — 기준 시험지·새 시험지를 기준 제품(origin/main git archive)과 실제 이동 제품(#TASK-ES-467 작업 트리)에서 돌려 종료 코드·출력 줄 수·첫 오류를 맞댄다(판정 아님).
// 사용: node real-move-test-h3.js <기준 트리> <이동 트리> <새 시험지 파일> <out.json>
const {spawnSync}=require('child_process');const fs=require('fs');const path=require('path');
const [BASE,MOVED,NEWTEST,OUT]=process.argv.slice(2);const T='tests/achievement-graph-multiset.test.js';
const oldSrc=fs.readFileSync(path.join(BASE,T),'utf8');const newSrc=fs.readFileSync(NEWTEST,'utf8');
const run=(root,src)=>{const f=path.join(root,T);const keep=fs.readFileSync(f,'utf8');fs.writeFileSync(f,src);const r=spawnSync(process.execPath,[T],{cwd:root,encoding:'utf8'});fs.writeFileSync(f,keep);const out=(r.stdout||'')+(r.stderr||'');return {code:r.status,lines:out.split('\n').length,firstError:(out.match(/AssertionError[^\n]*/)||[null])[0]};};
const res={oldOnBase:run(BASE,oldSrc),newOnBase:run(BASE,newSrc),oldOnMoved:run(MOVED,oldSrc),newOnMoved:run(MOVED,newSrc)};
const same=(a,b)=>a.code===b.code&&a.lines===b.lines&&a.firstError===b.firstError;
const out={what:'시험지 '+T+' — 기준 시험지/새 시험지 × 기준 제품(origin/main git archive)/이동 제품(#TASK-ES-467 작업 트리)',test:T,results:res,newTestSameOnBaseProduct:same(res.oldOnBase,res.newOnBase),baseTestBreaksOnMoved:res.oldOnMoved.code!==0?[T]:[],newTestSameOnMoved:same(res.newOnMoved,res.oldOnBase)};
fs.writeFileSync(OUT,JSON.stringify(out,null,1)+'\n');console.log(JSON.stringify(out,null,1));
