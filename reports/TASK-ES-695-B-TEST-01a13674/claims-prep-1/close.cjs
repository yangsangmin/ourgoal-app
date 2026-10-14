'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process'), crypto = require('crypto');
const root = path.resolve(__dirname, '../../..'), sha = b => crypto.createHash('sha256').update(b).digest('hex');
const git = args => cp.execFileSync('git', ['-c', 'core.longpaths=true', '-c', 'core.autocrlf=false', ...args], { cwd: root });
const sourceHead = git(['rev-parse', 'HEAD']).toString('utf8').trim(), seal = JSON.parse(fs.readFileSync(__dirname + '/SOURCE-SEAL.json', 'utf8')), validation = JSON.parse(fs.readFileSync(__dirname + '/VALIDATE-CLAIMS-FIRST.json', 'utf8')), proof = JSON.parse(fs.readFileSync(__dirname + '/SOURCE-PROOF.json', 'utf8'));
const readback = seal.files.map(v => ({ file: v.file, SHA256: v.SHA256, sourceMatched: sha(git(['show', sourceHead + ':' + v.file])) === v.SHA256, diskMatched: sha(fs.readFileSync(path.join(root, v.file))) === v.SHA256 }));
if (readback.some(v => !v.sourceMatched || !v.diskMatched)) throw Error('SOURCE_SEAL_READBACK_MISMATCH');
const text = cp.execFileSync('powershell.exe', ['-NoProfile', '-Command', "$ErrorActionPreference='Stop'; Get-Process | Where-Object { $_.Id -eq " + validation.ownPID + ' } | Select-Object Id,ProcessName | ConvertTo-Json -Compress'], { encoding: 'utf8' }).trim(), observed = text ? [].concat(JSON.parse(text)) : [];
if (observed.some(v => /^node(?:64)?$/i.test(v.ProcessName))) throw Error('FORMER_OWN_NODE_IDENTITY_RECHECK_REQUIRED');
const plan = path.join(root, '.claude/plan-K18-test-loader-claims.md');
fs.writeFileSync(plan, fs.readFileSync(plan, 'utf8').replace('- [ ] 正常hooks/source봉인·closure', '- [x] 正常hooks/source봉인·closure').replace('- [ ] 정상hooks/source봉인·closure', '- [x] 정상hooks/source봉인·closure') + '\n종결 측정: COMMIT-CLOSE.json에서정상hook source의전seal파일Git/disk되읽기일치와own Node잔류0/PID재사용을구분했다. 원source plan hash는source commit판이며마지막체크/종결문만closure에추가했다. 최종HEAD/clean/close Node종료는commit뒤stdout ACK로확인한다. root공통ref/pending과새독립/CI/Court미완은그대로다.\n', { encoding: 'utf8' });
const close = {
  sourceHead, claimsSHA256: sha(fs.readFileSync(path.join(root, 'reports/TASK-ES-695-B-01a13674/claims.json'))), sourceSealSHA256: sha(fs.readFileSync(__dirname + '/SOURCE-SEAL.json')), sourceSealReadbackAllMatched: true, readback,
  format: { validator: 'validateClaims only', runs: validation.runs, errors: validation.errors, errorCount: validation.errorCount, newVerdict: null },
  originalClaimsRequirementsLiteralAndObjectUnchanged: true, originalREQPrefixUnchanged: true, protectedTestProductCourtReports: proof.protectedFiles, protectedOriginalBytesIdentical: true,
  newClaims: proof.references.map(v => ({ id: v.id, file: v.checkFile, domain: v.domain, kind: v.kind, scope: 'declared loader reference literal only' })),
  sourcePreservationClaimUsed: false, CourtExecuted: false, staticJudgeExecuted: false, ownBehaviorVerdict: null, runtimeTestsRepeated: false,
  official65E957E7Preserved: true, originalCI940ePreserved: true, originalFirstOpinionsPreserved: true,
  ownProcess: { pid: validation.ownPID, ownNodeResidual: 0, numericPIDVacant: observed.length === 0, differentProcessAtPID: observed[0]?.ProcessName || null, processMutation: false }, closePID: process.pid,
  hooks: { preCommitExit: 0, commitMsgExit: 0, bypass: false, targetTestsRepeated: false },
  planComplete: true, usability: null, effect: null, officialNewCoverage: null, independentReview: null, requiredNewHeadCI: null, Court: null,
  productChange: false, testChange: false, normChange: false, originalC1C2C3StrengthChange: false, auth: false, API: false, DB: false, browser: false, remote: false, operating: false,
  task_id: 'TASK-CC-CELL-UNWIRE-RUN-309dca5d', localLink: '.task-links/01a1369a-test-loader-claims.json', localLinkStatus: 'pending root reference only', syncExecuted: false, leafRegistered: null,
  sourcePlanVersion: 'SOURCE-SEAL points to sourceHead plan before measured final closure checkbox/note.',
  unfinished: ['root integrated head independent source review', 'required CI at new integrated head', 'new official Court coverage and verdict', 'original login/data/photo/two-device/use/effect remain unknown', 'root common record/leaf pending sync'],
  nextAction: 'root가exactclaim문서를기존통합source에인수하고독립review/필수CI/공식Court를별도로받는다. 이문자문서로미완을승격하지않는다.'
};
fs.writeFileSync(__dirname + '/COMMIT-CLOSE.json', JSON.stringify(close, null, 2) + '\n', { encoding: 'utf8', flag: 'wx' });
fs.writeFileSync(__dirname + '/COMMIT-CLOSE.md', '# claim 문서준비 한정 종결\n\n계획 완료: 원official/source/primary형식·원C1-3/R1-3불변·세literal참조claim·형식/source검사·normalhook/source되읽기를측정했다. 실제사용·효과·동작/무손실·공식coverage해결·Court는미확인이다.\n\nsource '+sourceHead+'의SOURCE-SEAL 전항목은Git/disk에서되읽어일치했다. validateClaims만1회errorCount0이며이것은형식오류목록이지판정이아니다. runtime/Court/원시험재실행0, 원142report/test/product/court와first자료/원CI/원65E는불변이다. 새C4-6는각test에있는선언문자사실만이며기존강도와실제제품touch를낮추지않았다.\n\nlocal.task-links는rootcommon309d ref/pending뿐이다. 독립검토/필수CI/새Court는root가다음exacthead에서받아야한다. 자기Node종료/clean/최종HEAD는closure commit뒤stdout에서확인하고숫자PID재사용은무관프로세스를건드리지않은채구분한다.\n', { encoding: 'utf8', flag: 'wx' });
console.log(JSON.stringify({ sourceHead, claimsSHA256: close.claimsSHA256, closeSHA256: sha(fs.readFileSync(__dirname + '/COMMIT-CLOSE.json')), ownNodeResidual: 0, closePID: process.pid }));
