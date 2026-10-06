#!/usr/bin/env node
'use strict';
// Fixtures exercise this new CLI only. They never stand in for product E2E/accounts.
const { fs, path, sha, stable, hashFile, write, json } = require('./common');
const { spawnSync, spawn } = require('node:child_process');
const repo = path.resolve(__dirname, '../../../..');
const reports = path.join(repo, 'reports/TASK-ES-584');
const runId = String(Date.now());
const sandbox = path.join(reports, 'unit-fixtures', runId);
const rawRoot = path.join(reports,'raw',runId);
const source = path.join(sandbox, 'source');
const cli = path.join(__dirname, 'cli.js');
const registry = path.join(repo, 'docs/agents/shared-learning');
const results = [];
let seq = 0;
function run(name, argv, expectedExit) {
  const r = spawnSync(process.execPath, [cli,...argv], {encoding:'utf8',cwd:repo});
  const entry = {name,command:process.execPath,args:[cli,...argv],exitCode:r.status,stdout:r.stdout,stderr:r.stderr,expectedExit,matched:r.status===expectedExit};
  write(path.join(rawRoot,String(++seq).padStart(2,'0')+'-'+name+'.json'),entry);
  results.push({name,exitCode:r.status,expectedExit,matched:entry.matched});
  if (!entry.matched) throw Error(name+': '+r.stdout+r.stderr);
  return r;
}
function flags(event) {
  return ['--event',event,'--source-root',source,'--repo-root',repo,'--registry-root',registry];
}
function clone(value) { return JSON.parse(JSON.stringify(value)); }
async function main() {
  fs.mkdirSync(sandbox,{recursive:true});
  const lessons = [{id:'L001',분야:'보고',규칙:'전체 정본과 측정 증거를 연결하라.',어떻게:'전체 파일을 읽고 SHA를 기록.',출처PR:[841],대상:['claude','codex','antigravity']}];
  write(path.join(source,'lessons.json'),lessons);
  write(path.join(source,'WORK-REFERENCE.md'),'# 참고\n기준 PR #841 · 경험칙 1개\n**L001. 전체 정본과 측정 증거를 연결하라.**\n');
  const rootsFile = path.join(sandbox,'read-roots.json'); write(rootsFile,[repo,source]);
  const inputPath = 'docs/design/harness/shared-learning/cli.js';
  const inputs = [{path:inputPath,sha256:hashFile(path.join(repo,inputPath))}];
  const inputProductSha = sha(stable(inputs));
  let event;
  for (const [name,tools] of [['claude-agy',['claude','antigravity']],['codex-generic',['codex','unknown-new-tool']]]) {
    const participants=tools.map((tool,i)=>({tool,role:i?'worker':'coordinator',worktree:repo,owns:['docs/design/harness/shared-learning/**'],allowedActions:['read','unit-check']}));
    const participantFile=path.join(sandbox,name+'-participants.json'); write(participantFile,participants);
    const out=path.join(sandbox,name+'-bootstrap.json'); const brief=path.join(sandbox,name+'-brief.md');
    run(name+'-bootstrap',['bootstrap','--source-root',source,'--repo-root',repo,'--registry-root',registry,'--playbook-root',source,'--participants',participantFile,'--task-id','TASK-ES-584','--task-kind','shared-learning','--tool',tools[0],'--out',out,'--brief',brief],0);
    const boot=json(out);
    const raw=path.join(sandbox,name+'-measurement.json');
    const envelope={command:process.execPath,args:[cli,'bootstrap'],inputProductSha,exitCode:0,scope:'tool-unit',sourceTask:'TASK-ES-584',measuredAt:new Date().toISOString(),result:{bootstrapExit:0,participants:tools,commandsExecuted:0}};
    write(raw,envelope);
    event={eventId:name,taskId:'TASK-ES-584',taskKind:'shared-learning',participants,readReceipt:boot.readReceipt,appliedLessons:boot.appliedLessons,evidence:[{...envelope,checkerId:'submission-integrity',inputFiles:inputs,rawPath:path.relative(repo,raw),rawSha256:hashFile(raw),publishedPath:path.relative(repo,raw),publishedSha256:hashFile(raw),redaction:{mode:'none',transforms:[]},status:'measured'}],outcome:{courtUrl:null,measurementOnly:true,unmeasured:[],regressions:[]},lessonCandidates:[{id:'candidate-linkage',proposal:'브리프/검사/증거 연결'}],effectFollowup:boot.effectFollowup,requiredChecks:['submission-integrity'],inputProductSha,briefPath:path.relative(repo,brief),createdAt:new Date().toISOString()};
    const file=path.join(sandbox,name+'-event.json'); write(file,event);
    run(name+'-validate',['validate',...flags(file),'--read-roots',rootsFile],0);
  }
  const file=path.join(sandbox,'mutation-event.json');
  function bad(name,mutate,code=2) { const copy=clone(event); mutate(copy);write(file,copy);run(name,['validate',...flags(file),'--read-roots',rootsFile],code); }
  bad('missing-evidence',e=>e.evidence[0].rawPath='reports/TASK-ES-584/does-not-exist.json');
  bad('changed-sha',e=>e.evidence[0].rawSha256='0'.repeat(64));
  bad('other-task-after',e=>{e.evidence[0].sourceTask='TASK-OTHER';e.evidence[0].scope='work-after';});
  bad('missing-brief-rule',e=>e.appliedLessons[0].briefSection='absent-section');
  bad('missing-required-check',e=>e.requiredChecks.push('missing-check'));
  bad('measured-declaration-only',e=>{e.evidence[0].inputFiles=[];});
  bad('changed-input',e=>e.evidence[0].inputFiles[0].sha256='0'.repeat(64));
  bad('duplicate-evidence',e=>e.evidence.push(clone(e.evidence[0])));
  bad('applied-without-evidence',e=>e.appliedLessons[0].disposition='applied');
  bad('outside-root',e=>e.evidence[0].rawPath='C:/Windows/System32/drivers/etc/hosts');
  const good=path.join(sandbox,'codex-generic-event.json');
  const store=path.join(sandbox,'collected');
  // Each run gets its own store; old test evidence remains intact.
  const runStore=path.join(store,String(Date.now()));
  const expected=hashFile(path.join(source,'lessons.json'));
  const collectFlags=[...flags(good),'--read-roots',rootsFile,'--store-root',runStore,'--expected-source-hash',expected];
  run('collect-first',['collect',...collectFlags],0);
  run('collect-identical',['collect',...collectFlags],0);
  const conflict=clone(event);conflict.lessonCandidates.push({id:'different',proposal:'different'});write(file,conflict);
  run('collect-conflict',['collect',...flags(file),'--read-roots',rootsFile,'--store-root',runStore,'--expected-source-hash',expected],1);
  run('source-cas-conflict',['collect',...collectFlags.slice(0,-1),'0'.repeat(64)],1);
  run('canonical-store-forbidden',['collect',...flags(good),'--read-roots',rootsFile,'--store-root',source,'--expected-source-hash',expected],1);
  const sourceBefore=hashFile(path.join(source,'lessons.json'));
  const concurrentStore=path.join(store,'race-'+Date.now());
  const racingEvent=clone(event);racingEvent.eventId='race';const raceFile=path.join(sandbox,'race-event.json');write(raceFile,racingEvent);
  const raceArgs=['collect',...flags(raceFile),'--read-roots',rootsFile,'--store-root',concurrentStore,'--expected-source-hash',expected];
  fs.mkdirSync(concurrentStore,{recursive:true}); fs.writeFileSync(path.join(concurrentStore,'.collect.lock'),'active','utf8');
  run('exclusive-lock',['collect',...raceArgs],1);
  fs.unlinkSync(path.join(concurrentStore,'.collect.lock'));
  const parallel=await Promise.all([1,2].map(()=>new Promise(resolve=>{const p=spawn(process.execPath,[cli,...raceArgs],{cwd:repo});let stdout='',stderr='';p.stdout.on('data',d=>stdout+=d);p.stderr.on('data',d=>stderr+=d);p.on('close',code=>resolve({code,stdout,stderr}));})));
  write(path.join(rawRoot,'cas-parallel.json'),parallel);
  const files=fs.readdirSync(path.join(concurrentStore,'TASK-ES-584')).filter(f=>!f.endsWith('.pending.json'));
  results.push({name:'cas-parallel',matched:files.length===1&&parallel.every(r=>r.code===0||r.stderr.includes('COLLECT_LOCKED')),outputs:parallel.map(r=>r.code)});
  results.push({name:'canonical-unchanged',matched:hashFile(path.join(source,'lessons.json'))===sourceBefore});
  const summary={measurementOnly:true,productVerdict:null,rawRoot:path.relative(repo,rawRoot),fixturePurpose:'new-cli-unit-only; no product E2E',cases:results,total:results.length,matched:results.filter(r=>r.matched).length,unmatched:results.filter(r=>!r.matched),effectImprovement:null,measuredAt:new Date().toISOString()};
  write(path.join(reports,'cli-check.json'),summary);console.log(JSON.stringify(summary,null,2));
  if(summary.unmatched.length)process.exitCode=2;
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
