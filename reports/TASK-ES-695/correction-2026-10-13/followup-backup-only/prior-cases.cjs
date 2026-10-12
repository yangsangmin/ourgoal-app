'use strict';
const fs=require('fs'),path=require('path'),cp=require('child_process'),assert=require('assert');
const root=path.resolve(__dirname,'../../../..'),parent=path.dirname(__dirname),snapshot=path.join(__dirname,'after-snapshot'),toolDir=path.join(snapshot,'reports/TASK-ES-695/correction-2026-10-13');
const rows=[];
function run(name,cwd,file){const r=cp.spawnSync(process.execPath,[file],{cwd,encoding:'utf8',env:{...process.env,NODE_PATH:'C:/dev/ourgoal-app/node_modules'}});fs.writeFileSync(path.join(__dirname,name+'.stdout.log'),r.stdout||'','utf8');fs.writeFileSync(path.join(__dirname,name+'.stderr.log'),r.stderr||'','utf8');rows.push({name,exitCode:r.status,error:r.error?String(r.error):null});assert.strictEqual(r.status,0);}
const independentDir=path.join(__dirname,'prior-independent');fs.mkdirSync(path.join(independentDir,'head/js/core'),{recursive:true});fs.mkdirSync(path.join(independentDir,'evidence'),{recursive:true});
fs.copyFileSync(path.join(root,'js/core/local-keep.js'),path.join(independentDir,'head/js/core/local-keep.js'));
for(const tool of ['countercases.cjs','comparative.cjs']){fs.copyFileSync(path.join(parent,'after',tool),path.join(independentDir,tool));run(tool,independentDir,tool);}
fs.copyFileSync(path.join(parent,'sequence-probe.cjs'),path.join(toolDir,'sequence-probe.cjs'));run('prior-sequence',toolDir,'sequence-probe.cjs');
const counter=JSON.parse(fs.readFileSync(path.join(independentDir,'evidence/independent-countercases.json'),'utf8'));
const keys=['uniquePreviousStillAnywhere','brokenRawRetained','oldKeptRetained','feedbackAfterNextSave','uniqueCurrentRetained','uniquePreviousRetained','concurrentNewRetained'];
const originalCountercasesRetained=counter.cases.every(c=>!c.error&&keys.filter(k=>typeof c[k]==='boolean').every(k=>c[k]));assert.ok(originalCountercasesRetained);
const sequence=JSON.parse(fs.readFileSync(path.join(toolDir,'sequence-probe.json'),'utf8'));assert.strictEqual(sequence.assertionsNotHeld,0);
const output={rows,originalCountercasesRetained,sequence:{total:sequence.total,assertionsNotHeld:sequence.assertionsNotHeld,boundary:sequence.boundary},scope:'prior probes copied without editing; product snapshot; no operating requests'};
fs.writeFileSync(path.join(__dirname,'prior-cases.json'),JSON.stringify(output,null,2)+'\n','utf8');console.log(JSON.stringify(output));
