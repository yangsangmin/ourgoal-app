'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const root=path.resolve(__dirname,'../..'),file=path.join(root,'docs/rules/TICKETS.md'),before=fs.readFileSync(file),gate=require(path.join(root,'scripts/essence-gate')),rules=gate.loadRules(),prior=gate.checkTicketFile(rules,'TASK-ES-703');
if(prior.exists)throw Error('TICKET_ALREADY_REGISTERED');
const message=path.join(__dirname,'g0-message.txt');fs.writeFileSync(message,'[E3] #TASK-ES-703 docs: 피드 개인정보 교정 일반 티켓 등록\n',{encoding:'utf8',flag:'wx'});
function check(){const r=cp.spawnSync(process.execPath,[path.join(root,'scripts/essence-gate.js'),'--commit-msg',message],{cwd:root,encoding:'utf8',windowsHide:true});return {exit:r.status,stdout:r.stdout,stderr:r.stderr};}
const old=check(),line='- #TASK-ES-703 | E3 | 피드 개인정보 범위 교정(D22 직접 승인) — 체감 가설: 조언·사유 원문은 본인만 보고 작성자·추천은 집계만 받는다. 설정 값만 공개하고 운영 actor/reason audit는 비공개. 기존 행·값·크레딧 기능 보존, 지급 호출·노출로그·추가 첫 지표 0. 두 UI 안내와 동일 서버 계약을 맞춤. 근거: 직접 승인 D-2026-10-13-22 · TASK-ES-702 독점 담당 인계 · 한 번의 실제 catalog metadata · 별도 고정 소스 검토 대상 | docs/specs/REQ-TASK-ES-703.md · docs/sql/2026-10-13-feed-private-stage2.sql · reports/TASK-ES-703/claims.json · reports/TASK-OG-FEED-PRIVATE-STAGE2-INSTALL-01a1310c/manifest.json | 고정 소스 검토 준비·서버 교정 적용 미실행';
fs.appendFileSync(file,(before.at(-1)===10?'':'\r\n')+line+'\r\n','utf8');
const after=fs.readFileSync(file);if(!after.subarray(0,before.length).equals(before))throw Error('ORIGINAL_TICKET_BYTES_CHANGED');
const current=gate.checkTicketFile(rules,'TASK-ES-703'),next=check();
if(!current.exists||current.source!=='docs/rules/TICKETS.md'||next.exit!==0||/티켓.*없음/.test(next.stderr))throw Error('REGISTRATION_READBACK');
const result={schema:'feed-private-g0-registration/1',PID:process.pid,task:'TASK-ES-703',prior,after:current,beforeSHA:sha(before),afterSHA:sha(after),originalPrefixBytesPreserved:true,beforeHook:old,afterHook:next,localFileRegistered:true,NotionRegistered:null,NotionRequired:false,queueSynced:null,productSQLSource:'eff3ae6bd4a927e513b931d8422fe83145b852de',productSQLChanged:0,serverMutation:0};
fs.writeFileSync(path.join(__dirname,'g0-registration.json'),JSON.stringify(result,null,2)+'\n',{encoding:'utf8',flag:'wx'});console.log(JSON.stringify({PID:process.pid,beforeRegistered:prior.exists,afterRegistered:current.exists,source:current.source,beforeWarning:old.stderr.trim(),afterWarning:next.stderr.trim(),originalPrefixBytesPreserved:true,serverMutation:0}));
