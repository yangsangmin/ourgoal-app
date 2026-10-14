const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const root = path.resolve(__dirname, '../../..');
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const git = args => cp.execFileSync('git', ['-c', 'core.longpaths=true', '-c', 'core.autocrlf=false', ...args], { cwd: root });
const source = git(['rev-parse', 'HEAD']).toString('utf8').trim();
const seal = JSON.parse(fs.readFileSync(path.join(__dirname, 'SOURCE-SEAL.json'), 'utf8'));
const proof = JSON.parse(fs.readFileSync(path.join(__dirname, 'SOURCE-PROOF.json'), 'utf8'));
const result = JSON.parse(fs.readFileSync(path.join(__dirname, 'L1-FIRST-RESULT.json'), 'utf8'));
const model = JSON.parse(fs.readFileSync(path.join(__dirname, 'MODEL-PROCESS.json'), 'utf8'));
const sourceReadback = seal.files.map(v => ({ file: v.file, identical: hash(git(['show', source + ':' + v.file])) === v.SHA256 && hash(fs.readFileSync(path.join(root, v.file))) === v.SHA256 }));
if (sourceReadback.some(v => !v.identical)) throw new Error('SOURCE_READBACK_MISMATCH');
const remaining = [result.processPID, model.sealPID].filter(pid => { try { process.kill(pid, 0); return true; } catch (error) { if (error.code !== 'ESRCH') throw error; return false; } });
if (remaining.length) throw new Error('OWN_PROCESS_REMAINS');
const plan = path.join(root, '.claude/plan-K18-B-test-html-compat.md');
fs.writeFileSync(plan, fs.readFileSync(plan, 'utf8').replace('- [ ] 정상 hook/source 봉인 및 종료', '- [x] 정상 hook/source 봉인 및 종료') + '\n마지막 측정: COMMIT-CLOSE.json은 정상 hook source의 모든 seal 항목 되읽기와 L1/seal PID 잔류0을 기록한다. source plan hash는 source commit 판을 가리키며 마지막 체크표시만 이후 closure에서 추가했다. 최종 HEAD/clean은 closure commit 뒤 stdout ACK로 확인한다. 실제 CI/Court/사용/효과는 미확인이다.\n', { encoding: 'utf8' });
const closure = {
  sourceHead: source, sourceSealSHA256: hash(fs.readFileSync(path.join(__dirname, 'SOURCE-SEAL.json'))), sourceReadback,
  sourceReadbackAllMatched: true, testSHA256: proof.testSHA256,
  originalPinsIdentical: proof.protectedPins.length, assertionsUnchanged: proof.assertions.afterCount, originalScenarioCount: proof.scenarioCount,
  L1Runs: result.runs, L1Conditions: result.conditions, L1AllMatched: result.allMatched, defaultGuard: proof.defaultRawGuard,
  originalSixRerun: false, productChanged: false, originalHelperChanged: false, originalReportsChanged: false,
  intermediateReportCorrection: '첫 중간 메시지의 보호 pin 수24는 수기오류였다. 실제 SOURCE-PROOF/seal 출력은23이며 parent에 정정했다. 원 메시지는 덮지 않았다.',
  hooks: { preCommitExit: 0, commitMsgExit: 0, bypass: false, wholeTestRerun: false },
  ownProcesses: [result.processPID, model.sealPID].map(pid => ({ pid, residual: 0 })), closePID: process.pid,
  planComplete: true, usability: null, effect: null, actualCI: null, officialCourt: null, auth: false, API: false, browser: false, database: false, remote: false,
  task_id: 'TASK-CC-CELL-UNWIRE-RUN-309dca5d', centralWriter: 'root', centralLeafRegistered: null,
  sourcePlanVersion: 'SOURCE-SEAL hash is sourceHead plan; closure changes only measured final checkbox and its source note.',
  unfinished: ['원 --html ROOT 의존성은 유지: 과거 HTML 전체의 독립 실행 가능성 미측정', '최종 B 제품+시험 통합/독립검토/새 CI/Court는 root 후속', '실사용/효과 미확인'],
  nextAction: 'root가 exact test source와 별도 B 제품 교정을 통합하여 ops 별도 검토를 배정한다.'
};
fs.writeFileSync(path.join(__dirname, 'COMMIT-CLOSE.json'), JSON.stringify(closure, null, 2) + '\n', { encoding: 'utf8', flag: 'wx' });
process.stdout.write(JSON.stringify({ source, closePID: process.pid, ownProcessesRemaining: remaining.length, closureSHA256: hash(fs.readFileSync(path.join(__dirname, 'COMMIT-CLOSE.json'))) }) + '\n');
