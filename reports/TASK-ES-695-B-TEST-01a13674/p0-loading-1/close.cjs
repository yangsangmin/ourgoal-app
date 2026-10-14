'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process'), crypto = require('crypto');
const root = path.resolve(__dirname, '../../..'), sha = b => crypto.createHash('sha256').update(b).digest('hex');
const git = args => cp.execFileSync('git', ['-c', 'core.longpaths=true', '-c', 'core.autocrlf=false', ...args], { cwd: root });
const sourceHead = git(['rev-parse', 'HEAD']).toString('utf8').trim(), seal = JSON.parse(fs.readFileSync(__dirname + '/SOURCE-SEAL.json', 'utf8')), intake = JSON.parse(fs.readFileSync(__dirname + '/INTAKE.json', 'utf8'));
const files = seal.files.map(v => ({ file: v.file, SHA256: v.SHA256, sourceCommitMatched: sha(git(['show', sourceHead + ':' + v.file])) === v.SHA256, diskMatched: sha(fs.readFileSync(path.join(root, v.file))) === v.SHA256 }));
if (files.some(v => !v.sourceCommitMatched || !v.diskMatched)) throw Error('SOURCE_SEAL_READBACK_MISMATCH');
const pids = [...intake.processObservations.map(v => v.pid), intake.sealPID];
if (!pids.every(Number.isSafeInteger)) throw Error('FINITE_OWN_PIDS_REQUIRED');
const text = cp.execFileSync('powershell.exe', ['-NoProfile', '-Command', "$ErrorActionPreference='Stop'; Get-Process | Where-Object { $_.Id -in @(" + pids.join(',') + ') } | Select-Object Id,ProcessName | ConvertTo-Json -Compress'], { encoding: 'utf8' }).trim(), observed = text ? [].concat(JSON.parse(text)) : [];
if (observed.some(v => /^node(?:64)?$/i.test(v.ProcessName))) throw Error('FORMER_OWN_NODE_IDENTITY_RECHECK_REQUIRED');
const plan = path.join(root, '.claude/plan-K18-B-p0-test-loading.md');
fs.writeFileSync(plan, fs.readFileSync(plan, 'utf8').replace('- [ ] 정상hook/source freeze/closure', '- [x] 정상hook/source freeze/closure') + '\n종결 측정: COMMIT-CLOSE.json은 정상hook source의전 SOURCE-SEAL파일을git/disk되읽어일치함과own Node잔류0/숫자PID재사용구분을기록한다. 마지막계획표시와종결주석만closure에서추가했고원source plan hash는source commit판을가리킨다. 최종HEAD/clean/close Node종료는commit뒤stdout ACK로측정하며실제CI/Court/use/effect/사진권위는미확인이다.\n', { encoding: 'utf8' });
const close = {
  sourceHead, sourceSealSHA256: sha(fs.readFileSync(__dirname + '/SOURCE-SEAL.json')), sourceSealReadbackAllMatched: true, files,
  selected: intake.selected, originalCounts: { P0: intake.originalP0Total, P0AssertionLines: intake.originalP0AssertionLines, directLogin: intake.originalDirectTotal, directAssertionLines: intake.originalDirectAssertionLines }, assertionCountKind: 'source lines containing assert; not dynamic execution count',
  originalCI: intake.originalCI, directOriginalFailureObservation: null, protectedPins: intake.protectedPins, productsClaimsOriginalCasesUnchanged: true,
  originalDirect22Repeated: false, originalOtherFiveRepeated: false, originalAccountSixRepeated: false, wholeSuitesRepeated: false,
  hooks: { preCommitExit: 0, commitMsgExit: 0, bypass: false, originalTargetFullRerun: false },
  ownProcesses: pids.map(pid => ({ pid, ownNodeResidual: 0, numericPIDVacant: !observed.some(v => v.Id === pid), differentProcessAtPID: observed.find(v => v.Id === pid)?.ProcessName || null, processMutation: false })), closePID: process.pid,
  planComplete: true, usability: null, effect: null, actualCI: null, Court: null, photoPreservationAuthority: null,
  auth: false, actualAccount: false, API: false, DB: false, browser: false, remote: false, operating: false, cleanup: false,
  task_id: intake.task_id, leaf: intake.leaf, centralWriter: 'root', centralLeafRegistered: null,
  sourcePlanVersion: 'SOURCE-SEAL hashes sourceHead plan; final closure checkbox/note written later.',
  unfinished: ['new integrated required CI/Court', 'original skipped suites not rerun in this scoped L1', 'actual device/photo/account/UI/database preservation and use/effect unknown', 'central leaf registration unknown'],
  nextAction: 'root가 exact두reader source를고정제품과통합해 다음공개head 필수CI/Court를확인한다. writer push/PR/main0.'
};
fs.writeFileSync(__dirname + '/COMMIT-CLOSE.json', JSON.stringify(close, null, 2) + '\n', { encoding: 'utf8', flag: 'wx' });
fs.writeFileSync(__dirname + '/COMMIT-CLOSE.md', '# 한정 reader 종결\n\n계획 완료: source 인수·두reader 로드·선정4및⑥ 각1회·normalhook source되읽기를측정했다. 실제 CI/Court/사용/효과/사진보존권위는 미확인이다.\n\nsource '+sourceHead+'의SOURCE-SEAL 전항목을Git/disk로되읽어일치했다. 선정은scopedL1이고원26/6cases·단언/fixtures·제품six/claims를그대로뒀다. 원CI22/26/requestTypeError와direct실패실측null은불변이다. 원22/다른5/계정6/whole26·6·69는반복0이다.\n\nCOMMIT-CLOSE.json이own Node프로세스와PID재사용을구분한다. 자기plan 마지막표시만closure에추가했으며final clean/HEAD/close Node종료는commit뒤stdout에서측정한다. 제품·원claims·Court/gate/규범/TICKETS/root/계정/DB/API/browser/remote/SQL/운영쓰기0이다. root의공용연계/새headCI후속과미완을남겼다.\n', { encoding: 'utf8', flag: 'wx' });
console.log(JSON.stringify({ sourceHead, closeSHA256: sha(fs.readFileSync(__dirname + '/COMMIT-CLOSE.json')), ownNodeResidual: 0, numericPIDReused: observed, closePID: process.pid }));
