const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const root = path.resolve(__dirname, '../../..');
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const create = (name, obj) => fs.writeFileSync(path.join(__dirname, name), JSON.stringify(obj, null, 2) + '\n', { encoding: 'utf8', flag: 'wx' });
const proof = JSON.parse(fs.readFileSync(path.join(__dirname, 'SOURCE-PROOF.json'), 'utf8'));
const result = JSON.parse(fs.readFileSync(path.join(__dirname, 'L1-FIRST-RESULT.json'), 'utf8'));
const log = 'C:/Users/HP/.codex/sessions/2026/10/14/rollout-2026-10-14T03-51-20-01a1369a-d8ba-7633-94e5-eff0c9f3b3fa.jsonl';
let context = null;
for (const line of fs.readFileSync(log, 'utf8').split('\n')) {
  if (!line) continue;
  const row = JSON.parse(line);
  if (row.type === 'turn_context') context = row;
}
const actual = { requestedModel: 'gpt-6.1-sol', requestedEffort: 'high', thread: process.env.CODEX_THREAD_ID || null, log, timestamp: context && context.timestamp, model: context && context.payload.model, effort: context && context.payload.effort, selectionReason: '원 extract source 선택과 새 lexical 로드의 의미를 동시에 보존해야 하므로 기존 6.1/high를 유지했다. 한 책임을 직접 처리하며 추가 소환은 하지 않았다.' };
if (actual.thread !== '01a1369a-d8ba-7633-94e5-eff0c9f3b3fa') throw new Error('OWN_THREAD_MISMATCH');
let childAlive = false;
try { process.kill(result.processPID, 0); childAlive = true; } catch (error) { if (error.code !== 'ESRCH') throw error; }
if (childAlive) throw new Error('L1_PROCESS_REMAINS');
create('MODEL-PROCESS.json', { actual, L1PID: result.processPID, L1Residual: 0, sealPID: process.pid, realAPI: false, browser: false, remote: false, actualCI: null, officialCourt: null, usability: null, effect: null });
const ticket = {
  id: 'TASK-ES-695-B-TEST-01a13674/html-compat-1', parent: 'TASK-CC-CELL-UNWIRE-RUN-309dca5d', essence: 'FIX', requirement: '기존 --html 인라인 두 함수 source 선택과 default 실제 IIFE 의존성 로드를 함께 보존한다.',
  source: { base: proof.base, originalCode: '9e49bb3b34a1c5c5fb71037b50f7ae8226f11968', originalCLI: '../CLI-SOURCE-SCOPE.md', firstOriginalCI: '../SOURCE-PRESERVATION.json', firstOriginalSix: '../SELECTED-RESULT.json' },
  owner: 'handover_review 단독 test source 선택 writer; root 통합; ops 별도 최종 제품+시험 검토', prerequisite: '원 CLI 제한 ACK와 root의 좁은 관측 회귀 보정 배정',
  scope: ['tests/account-switch-isolation.test.js source 선택만', '.claude/plan-K18-B-test-html-compat.md', 'reports/TASK-ES-695-B-TEST-01a13674/html-compat-1/**'],
  completionCriteria: '원22단언/6case/suffix/pins 동일, defaultfalse 및 원IIFE 동일, 실제 makeBrowser legacy 선택 3조건 L1 한 번, 정상 hook/source봉인/PIDclose',
  verification: { proof: 'SOURCE-PROOF.json', firstL1: 'L1-FIRST-RESULT.json', conditions: result.conditions, allMatched: result.allMatched, originalSixRerun: false },
  status: '선택 경계의 부품 측정과 source 보존 주장', unfinished: ['새 CI/Court 미확인', '다른 HTML 실제 함수 전체 실행/E2E 미확인', '중앙 leaf 등록 미확인', '별도 B 제품 source 미통합'],
  nextAction: 'root가 exact test+별도 제품 source를 통합하고 operations가 최종 exact source를 독립 확인한다.'
};
if (Object.keys(ticket).length !== 13) throw new Error('TICKET_NOT_13_FIELDS');
create('TICKET-13.json', ticket);
const plan = path.join(root, '.claude/plan-K18-B-test-html-compat.md');
let planText = fs.readFileSync(plan, 'utf8');
planText = planText.replace('- [ ] exact 원 source/범위 인수', '- [x] exact 원 source/범위 인수').replace('- [ ] source 선택 최소교정', '- [x] source 선택 최소교정').replace('- [ ] L1 선택 조건 1검증', '- [x] L1 선택 조건 1검증');
planText += '\nSOURCE-PROOF.json/L1-FIRST-RESULT.json이 원단언22·원case6·suffix·보존pins ' + proof.protectedPins.length + '개 및 legacy 선택 3조건 일치를 측정했다. default guardfalse이며 actualIIFE 블록은 indent 제외 동일하다. 원 여섯 시나리오는 반복하지 않았다. 최종 hook/source/PID/clean은 closure로 기록한다.\n';
fs.writeFileSync(plan, planText, { encoding: 'utf8' });
const handoff = `# --html 선택 경계 교정 인계\n\n작성과 L1 측정은 끝났고 정상 hook/source 및 closure를 진행한다. 실제 CI·Court·사용·효과는 미확인이다.\n\n원 raw HTML의 ensureUserRow/loadProfile header 중 하나라도 있으면 기존 names6/extract 첫선언 선택을 사용한다. 둘 다 없는 default만 기존 actual4IIFE+나머지4extract를 그대로 쓴다. --html parse·원 extractor·ROOT inline-bundle/iso/Ledger는 불변이며 AST/임의 정규화는 추가하지 않았다. 하나만 있는 혼합의 기존 lexical 한계도 새로 보충하지 않는다.\n\nSOURCE-PROOF.json: 기본 guardfalse, actualIIFE 블록 indent 제외 동일, 원 extractor 동일, 원22단언·6case·suffix SHA 동일, 원제품/helper/전체기존보고 ${proof.protectedPins.length}개 pin byte동일. 새 L1은 실제 makeBrowser 함수에서 두 함수 모두/ensure만/load만 세 조건을 한 번 측정해 원 여섯 함수의 첫선언 선택을 모두 확인했다. 이 때 actual 함수 몸체는 호출하지 않았고 IIFE provider read0·실 API/DB/브라우저0이다. 메모리 합성 HTML은 선택 계약의 부품이고 전체 함수 실행·E2E·양성 UI가 아니다.\n\n첫9e49/6of6 raw 및 원CI 실패·CLI-SOURCE-SCOPE 제한 문서는 모두 그대로 보존했다. 원6을 다시 실행하지 않았고 기대값/단언/fixture/원helper/제품/Court/claims/중앙metadata/원격0변경이다. L1 PID ${result.processPID} 잔류0, actual ${actual.model}/${actual.effort}는 MODEL-PROCESS.json의 자기 turn_context에 결박했다.\n\nroot가 최종 제품+시험 exact source 통합과 ops 별도 검토를 담당한다. 기존 --html이 다른 의존성을 ROOT에서 읽는 계약은 유지하므로 과거 HTML 전체의 독립 실행 가능성은 미확인이다. leaf는 TICKET-13의 자기 기록이며 중앙 등록완료 주장이 아니다.\n`;
fs.writeFileSync(path.join(__dirname, 'HANDOFF.md'), handoff, { encoding: 'utf8', flag: 'wx' });
const ownPrefix = 'reports/TASK-ES-695-B-TEST-01a13674/html-compat-1/';
const files = ['tests/account-switch-isolation.test.js', '.claude/plan-K18-B-test-html-compat.md', ...['REQ.md', 'check-selection.cjs', 'seal.cjs', 'SOURCE-PROOF.json', 'SINGLE-L1.json', 'L1-FIRST-RESULT.json', 'MODEL-PROCESS.json', 'TICKET-13.json', 'HANDOFF.md'].map(f => ownPrefix + f)];
create('SOURCE-SEAL.json', { base: proof.base, files: files.map(file => ({ file, SHA256: sha(path.join(root, file)) })), originalSourceReportPins: proof.protectedPins.length, originalSixRerun: false, realAPI: false, officialCourt: null, usability: null, effect: null });
process.stdout.write(JSON.stringify({ actual, protectedPins: proof.protectedPins.length, testSHA256: proof.testSHA256, sourceSealSHA256: sha(path.join(__dirname, 'SOURCE-SEAL.json')), ownL1Residual: 0, sealPID: process.pid }) + '\n');
