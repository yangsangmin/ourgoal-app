const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cp = require('child_process');
const root = path.resolve(__dirname, '../..');
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const create = (name, obj) => fs.writeFileSync(path.join(__dirname, name), JSON.stringify(obj, null, 2) + '\n', { encoding: 'utf8', flag: 'wx' });
const log = 'C:/Users/HP/.codex/sessions/2026/10/14/rollout-2026-10-14T03-51-20-01a1369a-d8ba-7633-94e5-eff0c9f3b3fa.jsonl';
let context = null;
for (const line of fs.readFileSync(log, 'utf8').split('\n')) {
  if (!line) continue;
  const item = JSON.parse(line);
  if (item.type === 'turn_context') context = item;
}
const actual = { thread: process.env.CODEX_THREAD_ID || null, log, timestamp: context && context.timestamp, model: context && context.payload.model, effort: context && context.payload.effort };
if (actual.thread !== '01a1369a-d8ba-7633-94e5-eff0c9f3b3fa') throw new Error('OWN_THREAD_MISMATCH');
const p = JSON.parse(fs.readFileSync(path.join(__dirname, 'SOURCE-PRESERVATION.json'), 'utf8'));
const m = JSON.parse(fs.readFileSync(path.join(__dirname, 'SELECTED-RESULT.json'), 'utf8'));
const workReference = 'C:/dev/agent-knowledge/WORK-REFERENCE.md';
const firstLine = fs.readFileSync(workReference, 'utf8').split(/\r?\n/)[0];
const tracked = cp.execFileSync('git', ['-c', 'core.longpaths=true', '-c', 'core.autocrlf=false', 'diff', '--name-only'], { cwd: root, encoding: 'utf8' }).trim().split('\n').filter(Boolean);
if (tracked.length !== 1 || tracked[0] !== 'tests/account-switch-isolation.test.js') throw new Error('TRACKED_SCOPE_REJECTED');
const intake = {
  task_id: 'TASK-CC-CELL-UNWIRE-RUN-309dca5d', leaf: 'TASK-ES-695-B-TEST-01a13674', centralLinkWriter: 'root', centralLeafRegistered: null,
  requestedModel: 'gpt-6.1-sol', requestedEffort: 'high', actual, selectionReason: '제품과 시험의 lexical 의존성 및 원단언 보존을 구분하는 정확도가 중요하므로 기존 요청 모델과 high를 유지했다. 추가 소환 없이 한 책임을 직접 교정했다.',
  workReference: { path: workReference, firstLine, SHA256: sha(workReference) },
  exactBase: p.baseline, productSource: p.productSource, rootBranch: 'fix/enterprise-b-test-loading-01a13674',
  writer: 'handover_review', allowedChanges: ['tests/account-switch-isolation.test.js::makeBrowser actual four IIFE loading and accurate component-level header', '.claude/plan-K18-B-test-loading.md', 'reports/TASK-ES-695-B-TEST-01a13674/**'],
  extraLoaderHelper: false, trackedChangedFiles: tracked,
  readonlySourceLookupFailures: [...p.sourceLookupFailures, { code: 'POWERSHELL_NODE_EVAL_QUOTE_SYNTAX', resolved: 'own rollout parsed from this UTF8 script; no auth or test re-execution' }],
  originalCI: p.originalCI, componentResult: m,
  remotePush: false, PRWrite: false, mainWrite: false, realAuth: false, realAPI: false, browserLaunch: false, databaseMutation: false,
  SQL3: false, firstMetric: false, oneWriteTrial: false, Notion: false, operating: false, media: false,
  planComplete: null, usability: null, effect: null, officialCourt: null,
  sourceCause: { file: 'tests/account-switch-isolation.test.js', function: 'makeBrowser', oldLoaderLines: '175-179', lexicalOwner: 'js/core/profile-load.js:17-23', missing: ['loadGeneration', 'readForLoad', 'ownRows', 'storage.device.pending provider'], binding: 'window.OurgoalAppScope.scope = existing ctx; original OurgoalUiHelpers exports; raw four IIFEs' }
};
create('INTAKE.json', intake);
const ticket = {
  id: 'TASK-ES-695-B-TEST-01a13674', parent: 'TASK-CC-CELL-UNWIRE-RUN-309dca5d', essence: 'FIX', requirement: '제품을 바꾸지 않고 원 계정격리 시험을 actual profile-load 클로저/능력 계약으로 로드한다.',
  source: { PR: 982, head: p.baseline, product: p.productSource, CI: p.originalCI, sourcePreservation: 'SOURCE-PRESERVATION.json' },
  owner: 'handover_review 단독 시험 로드 writer; root 통합; operations 제품 독립검토',
  prerequisite: 'exact0e785 고정 및 makeBrowser four IIFE/context scope root ACK',
  scope: intake.allowedChanges,
  completionCriteria: '원제품 bytes·22단언·6시나리오·suffix 동일, 해당시험1회 raw 및 정상 hook commit/source pin',
  verification: { source: 'SOURCE-PRESERVATION.json', result: 'SELECTED-RESULT.json', raw: m.rawPath, rawSHA256: m.rawSHA256, successfulScenarios: m.successfulScenarios, totalScenarios: m.totalScenarios },
  status: '한정 작성·부품 측정 기록; 공식 판정 아님',
  unfinished: ['새 CI 미실행', 'Court 미확인', '실계정 UI/사용/효과 미확인', '중앙 leaf 등록 미확인', '후속 B 제품교정 미배정'],
  nextAction: 'root가 exact 교정 commit을 비교·통합하고 원 PR982/제품 독립검토와 구별해 CI/Court 후속을 담당한다.'
};
if (Object.keys(ticket).length !== 13) throw new Error('TICKET_FIELDS_NOT_13');
create('TICKET-13.json', ticket);
const plan = path.join(root, '.claude/plan-K18-B-test-loading.md');
let text = fs.readFileSync(plan, 'utf8');
text = text.replace('- [ ] 원CI/source/계약 인수', '- [x] 원CI/source/계약 인수').replace('- [ ] 시험 로드 최소 보정', '- [x] 시험 로드 최소 보정').replace('- [ ] 해당시험 1회·불변 확인', '- [x] 해당시험 1회·불변 확인');
text += '\n실측: SOURCE-PRESERVATION.json은 원제품/loader 10 pins byte동일, 단언22/시나리오6 및 suffix SHA동일을 기록했다. SELECTED-RESULT.json의 단일 실행은 exit0·6/6·loadGeneration오류0이다. 실제CI/Court/사용/효과는 미확인이다. 마지막 항목은 정상 hook commit과 clean/PID 종료 뒤 별도 closure로 측정한다.\n';
fs.writeFileSync(plan, text, { encoding: 'utf8' });
const handoff = `# PR982 한정 시험 로드 인계\n\n계획은 마지막 정상 hook/source 고정 항목을 진행 중이다. 원 해당 부품 시험은 ${m.successfulScenarios}/${m.totalScenarios}, exit${m.exitCode}로 측정했다. 실제 CI·사용 가능·효과·Court는 미확인이다.\n\nmakeBrowser에서 잘라온 profile-load 함수가 실제 IIFE의 lexical loadGeneration/readForLoad/ownRows와 storage.device.pending 능력을 잃었다. 원 capabilities/device-save/local-keep/profile-load bytes를 기존 VM ctx의 live scope에 결박하고 실제 OurgoalUiHelpers exports를 사용했다. 나머지 네 함수는 기존 추출 그대로이며 추가 helper·제품·fixture·단언·기대값·검사 폐기 변경은 없다.\n\nSOURCE-PRESERVATION.json: 원 시나리오 suffix SHA 동일, 단언 ${p.assertions.currentCount}줄 및 시나리오 ${p.scenarios.currentCount}개 동일, 제품/원 loader ${p.productPins.length}개 byte 동일. tracked 변경은 tests/account-switch-isolation.test.js 하나다. 원 CI38509224519의 loadGeneration 오류 ${p.originalCI.missingLoadGenerationOccurrences}개 및 private raw SHA ${p.originalCI.rawSHA256}는 원위치 그대로이며 전문/URL 키를 복제하거나 출력하지 않았다.\n\nSELECTED-RESULT.json과 새 .private/selected-test-first.log는 해당시험 한 번의 원출력이다. 새 raw SHA ${m.rawSHA256}, child PID ${m.childPID}. 기존 메모리 가짜브라우저/가짜 Supabase 시험을 실행한 것뿐이다. 실제 API·로그인·브라우저·SQL·운영·원격 쓰기는 0이다.\n\nINTAKE.json은 actual ${actual.model}/${actual.effort}와 자기 turn_context를 결박한다. TICKET-13.json은 13칸과 root 공통 task 관계를 기록하지만 중앙 leaf 등록을 주장하지 않는다. 기존 B source ${p.productSource}와 PRhead ${p.baseline} 고정, 후속 제품교정은 미배정이다. root는 새 commit을 통합한 뒤 CI와 제품 독립검토를 각각 판단한다. 원 성적표·의견·Court를 새 긍정으로 덮지 않는다.\n`;
fs.writeFileSync(path.join(__dirname, 'HANDOFF.md'), handoff, { encoding: 'utf8', flag: 'wx' });
const names = ['tests/account-switch-isolation.test.js', '.claude/plan-K18-B-test-loading.md', ...['REQ.md', 'run-selected.cjs', 'seal.cjs', 'SOURCE-PRESERVATION.json', 'SELECTED-RESULT.json', 'SINGLE-SELECTED-RUN.json', 'INTAKE.json', 'TICKET-13.json', 'HANDOFF.md', '.private/selected-test-first.log'].map(n => 'reports/TASK-ES-695-B-TEST-01a13674/' + n)];
create('SOURCE-SEAL.json', { baseline: p.baseline, createdAt: new Date().toISOString(), files: names.map(file => ({ file, SHA256: sha(path.join(root, file)) })), usability: null, effect: null, officialCourt: null });
process.stdout.write(JSON.stringify({ actual, sourceSealSHA256: sha(path.join(__dirname, 'SOURCE-SEAL.json')), tracked, ticketFieldCount: Object.keys(ticket).length }) + '\n');
