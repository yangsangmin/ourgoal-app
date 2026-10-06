#!/usr/bin/env node
'use strict';
// Captures the actual CLI-unit command, inputs and raw result; never issues a verdict.
const { fs, path, stable, sha, hashFile, write, json } = require('./common');
const { spawnSync } = require('node:child_process');
const repo = path.resolve(__dirname,'../../../..');
const report = path.join(repo,'reports/TASK-ES-584');
const files = fs.readdirSync(__dirname).filter(f=>f.endsWith('.js')).map(f=>'docs/design/harness/shared-learning/'+f);
const inputFiles = files.map(p=>({path:p,sha256:hashFile(path.join(repo,p))})).sort((a,b)=>a.path.localeCompare(b.path));
const inputProductSha = sha(stable(inputFiles));
const args = ['docs/design/harness/shared-learning/check.js'];
const run = spawnSync(process.execPath,args,{cwd:repo,encoding:'utf8'});
const measuredAt = new Date().toISOString();
const raw = 'reports/TASK-ES-584/raw/measurement-'+Date.now()+'.json';
const envelope = {command:process.execPath,args,inputProductSha,exitCode:run.status,scope:'tool-unit',sourceTask:'TASK-ES-584',measuredAt,result:{stdout:run.stdout,stderr:run.stderr}};
write(path.join(repo,raw),envelope);
const boot=json(path.join(report,'bootstrap.json'));
const event={eventId:'TASK-ES-584-'+Date.now(),taskId:'TASK-ES-584',taskKind:'shared-learning',participants:boot.participants,readReceipt:boot.readReceipt,appliedLessons:boot.appliedLessons,evidence:[{...envelope,checkerId:'submission-integrity',inputFiles,rawPath:raw,rawSha256:hashFile(path.join(repo,raw)),publishedPath:raw,publishedSha256:hashFile(path.join(repo,raw)),redaction:{mode:'none',transforms:[]},status:'measured'}],outcome:{courtUrl:null,measurementOnly:true,unmeasured:[],regressions:[]},lessonCandidates:[{id:'proposal-evidence-linkage',proposal:'전체 읽기와 실제 적용/증거를 분리 연결하는 유형. 원장 자동승격 없음.',sourceTask:'TASK-ES-584'}],effectFollowup:boot.effectFollowup,requiredChecks:['submission-integrity'],inputProductSha,briefPath:'reports/TASK-ES-584/brief.md',createdAt:measuredAt};
const lesson=event.appliedLessons.find(l=>l.id==='L054');
if(lesson){lesson.disposition='applied';lesson.checkerId='submission-integrity';lesson.evidenceRefs=['submission-integrity'];}
write(path.join(report,'learning-event.json'),event);
console.log(JSON.stringify({measurementOnly:true,exitCode:run.status,raw,inputProductSha,result:json(path.join(report,'cli-check.json'))},null,2));
process.exitCode=run.status || 0;
