'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto'), cp = require('child_process');
const root = path.resolve(__dirname, '../../..'), sha = b => crypto.createHash('sha256').update(b).digest('hex');
const proof = JSON.parse(fs.readFileSync(__dirname + '/SOURCE-PRESERVATION.json', 'utf8')), result = JSON.parse(fs.readFileSync(__dirname + '/FIRST-SELECTED-RESULT.json', 'utf8'));
const pids = result.observations.map(v => v.childPID);
if (!pids.every(Number.isSafeInteger)) throw Error('FINITE_OWN_PIDS_REQUIRED');
const processText = cp.execFileSync('powershell.exe', ['-NoProfile', '-Command', "$ErrorActionPreference='Stop'; Get-Process | Where-Object { $_.Id -in @(" + pids.join(',') + ') } | Select-Object Id,ProcessName | ConvertTo-Json -Compress'], { encoding: 'utf8' }).trim();
const processes = processText ? [].concat(JSON.parse(processText)) : [];
if (processes.some(v => /^node(?:64)?$/i.test(v.ProcessName))) throw Error('FORMER_OWN_NODE_IDENTITY_RECHECK_REQUIRED');
const log = 'C:/Users/HP/.codex/sessions/2026/10/14/rollout-2026-10-14T03-51-20-01a1369a-d8ba-7633-94e5-eff0c9f3b3fa.jsonl';
let turn = null;
for (const line of fs.readFileSync(log, 'utf8').split('\n')) { if (line) { const v = JSON.parse(line); if (v.type === 'turn_context') turn = v; } }
const model = { request: { model: 'gpt-6.1-sol', effort: 'high' }, actual: { thread: process.env.CODEX_THREAD_ID || null, timestamp: turn?.timestamp || null, model: turn?.payload?.model || null, effort: turn?.payload?.effort || null }, log, reason: '두 reader의 서로 다른 lexical/registry 의존성 누락과 원단언·legacy 선택 의미를 정확히 보존하기 위해 요청된6.1-sol/high를 유지했다. 추가소환 없이 동일 writer 책임으로 처리했다.' };
if (model.actual.thread !== '01a1369a-d8ba-7633-94e5-eff0c9f3b3fa') throw Error('OWN_THREAD_MISMATCH');
const referenceFile = 'C:/dev/agent-knowledge/WORK-REFERENCE.md', reference = fs.readFileSync(referenceFile), ref = /기준 PR #([0-9]+)\*\* \(([a-f0-9]{40})\)/.exec(reference.toString('utf8'));
if (!ref) throw Error('WORK_REFERENCE_BASIS_REQUIRED');
const intake = {
  base: proof.base, scope: ['tests/local-keep-p0.test.js::boot cache/require', 'tests/direct-login-guard.test.js::makeBrowser two profile source selection/live dependency with original rawheader contract', 'self plan and p0-loading-1 packet'],
  model, reference: { path: referenceFile, SHA256: sha(reference), basisPR: Number(ref[1]), basisCommit: ref[2], classification: '표준', reason: '기성 actual IIFE/ability를 원reader에 연결하는 로드수정이며 제품/단언/조건을 바꾸지 않는다.' },
  originalCI: proof.originalCI, directBaselineFailure: null, directBaselineFailureReason: 'source 확인만 인수; 실제 원 실패 실행0',
  originalP0Total: proof.p0.allConditions, originalP0AssertionLines: proof.p0.assertionCount, originalDirectTotal: proof.direct.allConditions, originalDirectAssertionLines: proof.direct.assertionCount,
  protectedPins: proof.protectedPins.length, selected: result.observations.map(v => ({ selection: v.selection, total: v.total, passed: v.passed, failed: v.failed, runs: v.runs, rawSHA256: v.rawSHA256 })),
  processObservations: pids.map(pid => ({ pid, ownNodeResidual: 0, numericPIDVacant: !processes.some(v => v.Id === pid), differentProcessAtPID: processes.find(v => v.Id === pid)?.ProcessName || null, processMutation: false })), sealPID: process.pid,
  skipped: { originalDirectP0: proof.p0.directConditionsNotRerun, otherDirectLogin: proof.direct.allConditions - 1, accountSix: true, fullP0: true, fullDirectLogin: true },
  sourceOtherReader: proof.sourceReadOnlyOther, inheritedCourtAtAssignment: proof.inheritedCourtAtAssignment,
  task_id: 'TASK-CC-CELL-UNWIRE-RUN-309dca5d', leaf: 'TASK-ES-695-B-TEST-01a13674/p0-loading-1', centralWriter: 'root', centralLeafRegistered: null,
  actualCI: null, Court: null, use: null, effect: null, photoPreservationAuthority: null, actualAccount: false, auth: false, API: false, DB: false, browser: false, operating: false, remote: false, SQL3: false, firstMetric: false, trial: false
};
const write = (name, value) => fs.writeFileSync(__dirname + '/' + name, JSON.stringify(value, null, 2) + '\n', { encoding: 'utf8', flag: 'wx' });
write('INTAKE.json', intake);
const ticket = {
  id: intake.leaf, parent: intake.task_id, essence: 'FIX', requirement: '원 P0 및 직접입장 reader를 actual profile capability/lexical 의존성으로 로드한다.',
  source: { PR: 982, head: proof.base, originalCI: proof.originalCI, source: 'SOURCE-PRESERVATION.json' }, owner: 'handover_review 두시험 reader 단독writer; root통합/CI; ops 독립검토',
  prerequisite: 'exact9cf 제품 고정 및 root direct-login 추가writer ACK', scope: intake.scope,
  completionCriteria: '원제품six/claims/26및6cases/단언불변, 선택4및⑥ 각1회, normalhook/source seal/PID/clean',
  verification: { source: 'SOURCE-PRESERVATION.json', first: 'FIRST-SELECTED-RESULT.json', firstSHA256: sha(fs.readFileSync(__dirname + '/FIRST-SELECTED-RESULT.json')), scopedL1: true },
  status: '한정 reader 보정·선정부품 측정; 실제 CI/Court판정 아님', unfinished: ['새 통합CI/Court 미확인', '원직접22/다른5/전체69는이번회차실행0', '실사진/실기기/실계정/DB/UI/use/effect 미확인', '중앙leaf등록미확인'],
  nextAction: 'root가 exact 두시험 교정을 고정제품과 합쳐 새head에서 필수CI/Court를 확인한다. writer추가push0.'
};
if (Object.keys(ticket).length !== 13) throw Error('TICKET_NOT_13_FIELDS');
write('TICKET-13.json', ticket);
const handoff = `# PR982 두 reader 로드 인계\n\n작성·선정 부품 측정은 끝났고 정상hook/source·closure를 진행한다. 실제CI·Court·사용·효과·새사진보존권위는 미확인이다.\n\nP0 boot는 profile-load의 실제 IIFE를 이미 읽지만 registry/pending provider가 없었다. 원global.window/localStorage/appScope 설정뒤 actualcapabilities→device-save를 require하고 두파일도 perbootcache목록에서 지운다. direct-login은 두profile 함수본문을 잘라 lexical loadGeneration/readForLoad/ownRows 및 provider를 잃었다. rawHTML에 두header중하나라도있으면 기존8extract 그대로, 둘다없을때만 actual4IIFE/live ctx와 원나머지6extract를 사용한다. 기존Ledger/guard/iso는 그대로이고 stub/추가provider0이다. 두원인을 구분하며 direct 원실패관측은null로보존한다.\n\n원P0 ${proof.p0.allConditions}조건/${proof.p0.assertionCount}단언줄·direct ${proof.direct.allConditions}조건/${proof.direct.assertionCount}단언줄은 불변이다. fixtures/body/outside-reader/suffix를 source로대조했다. 제품six·claims·기존계정/record/helper 포함 ${proof.protectedPins.length}pins byte동일. record-ledger-sync는loadProfile의문자열단언만읽으므로변경0이다.\n\nFIRST-SELECTED-RESULT.json은원선언+맞물림4 섹션을byte그대로선택해4/4, 원direct⑥ callback만선택해1/1을각1회측정했다. 원P0직접22/원direct다른5/계정6/전체26·6·69는반복0이다. 선정하네스는원filename의NodeModule로컴파일해 require가같은제품을읽으며원fixture/단언본문을바꾸지않는다. scopedL1뿐이며실계정·실DB·사진보존UI/E2E가아니다. 원CI ${proof.originalCI.run}의${proof.originalCI.passed}/${proof.originalCI.total}, raw ${proof.originalCI.rawSHA256}는원위치에그대로며전문출력/복제0이다.\n\nactual ${model.actual.model}/${model.actual.effort}와자기turn_context/WORKREFERENCE기준PR${intake.reference.basisPR}는INTAKE에결박했다. selected child ${pids.join('/')} ownNode잔류0이고숫자PID재사용은구분한다. rootcommon309d/중앙leaf는root단독,pending/null이며claims/TICKETS/root/운영/원격수정0이다. Court ready-trigger/sync cancelled/원68BA반려1은배정당시인수상태만이며새판정으로승격하지않는다. root가새통합head에서필수CI를담당하고worker추가push0이다.\n`;
fs.writeFileSync(__dirname + '/HANDOFF.md', handoff, { encoding: 'utf8', flag: 'wx' });
const plan = path.join(root, '.claude/plan-K18-B-p0-test-loading.md');
let planText = fs.readFileSync(plan, 'utf8').replace('- [ ] source/CI/범위 인수', '- [x] source/CI/범위 인수').replace('- [ ] 확인된 두 reader 로드 최소교정', '- [x] 확인된 두 reader 로드 최소교정').replace('- [ ] 새 맞물림4/직접입장⑥ 선정 L1 각각1회', '- [x] 새 맞물림4/직접입장⑥ 선정 L1 각각1회');
planText += '\n측정은 SOURCE-PRESERVATION/FIRST-SELECTED-RESULT/INTAKE를따른다. P0선정4/4·direct⑥1/1 각1회, 원조건26/6·단언/제품six/claims불변·선정밖반복0이다. 마지막hook/source/closure는commit/PID/clean후기록하며실제CI/Court/use/effect는null이다.\n';
fs.writeFileSync(plan, planText, { encoding: 'utf8' });
function walk(dir) { return fs.readdirSync(dir).flatMap(name => { const file = path.join(dir, name); return fs.statSync(file).isDirectory() ? walk(file) : [file]; }); }
const files = [path.join(root, 'tests/local-keep-p0.test.js'), path.join(root, 'tests/direct-login-guard.test.js'), plan, ...walk(__dirname)].map(file => ({ file: path.relative(root, file).split(path.sep).join('/'), SHA256: sha(fs.readFileSync(file)) }));
write('SOURCE-SEAL.json', { base: proof.base, files, selectedScopeOnly: true, fullOriginalSuitesRepeated: false, productChanged: false, actualCI: null, Court: null, use: null, effect: null });
console.log(JSON.stringify({ model: model.actual, originalCounts: { p0: proof.p0.allConditions, p0Assertions: proof.p0.assertionCount, direct: proof.direct.allConditions, directAssertions: proof.direct.assertionCount }, protectedPins: proof.protectedPins.length, sourceSealSHA256: sha(fs.readFileSync(__dirname + '/SOURCE-SEAL.json')), sealPID: process.pid }));
