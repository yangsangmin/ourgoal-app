const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const root = path.resolve(__dirname, '../..');
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const git = args => cp.execFileSync('git', ['-c', 'core.longpaths=true', '-c', 'core.autocrlf=false', ...args], { cwd: root });
const sourceHead = git(['rev-parse', 'HEAD']).toString('utf8').trim();
const s = JSON.parse(fs.readFileSync(path.join(__dirname, 'SOURCE-SEAL.json'), 'utf8'));
const m = JSON.parse(fs.readFileSync(path.join(__dirname, 'SELECTED-RESULT.json'), 'utf8'));
const sealed = s.files.map(v => ({ file: v.file, SHA256: v.SHA256, sourceCommitSHA256: hash(git(['show', sourceHead + ':' + v.file])), diskSHA256: hash(fs.readFileSync(path.join(root, v.file))) }));
if (sealed.some(v => v.SHA256 !== v.sourceCommitSHA256 || v.SHA256 !== v.diskSHA256)) throw new Error('SOURCE_SEAL_READBACK_MISMATCH');
let childAlive = false;
try { process.kill(m.childPID, 0); childAlive = true; } catch (e) { if (e.code !== 'ESRCH') throw e; }
if (childAlive) throw new Error('OWN_TEST_PID_STILL_PRESENT');
const plan = path.join(root, '.claude/plan-K18-B-test-loading.md');
fs.writeFileSync(plan, fs.readFileSync(plan, 'utf8').replace('- [ ] 정상hookcommit/source봉인·closure', '- [x] 정상hookcommit/source봉인·closure') + '\n종결 측정: COMMIT-CLOSE.json은 source commit의 SOURCE-SEAL 전체 되읽기 일치와 own child46860 잔류0을 기록한다. 최종 clean/HEAD는 closure commit 뒤 git status/rev-parse stdout에서 확인하며, 사용/효과/CI/Court를 완료로 승격하지 않는다.\n', { encoding: 'utf8' });
const closure = {
  sourceHead, sourceSealSHA256: hash(fs.readFileSync(path.join(__dirname, 'SOURCE-SEAL.json'))),
  sourceSealReadbackAllMatched: true, sourceCommitFiles: sealed,
  testSHA256: hash(fs.readFileSync(path.join(root, 'tests/account-switch-isolation.test.js'))),
  selectedResultSHA256: hash(fs.readFileSync(path.join(__dirname, 'SELECTED-RESULT.json'))),
  originalCIPreservedSHA256: '0b673be518fa04608234118832e2ec0a3b40f7c7a780becb71a4da18eee4816c',
  runs: m.runs, successfulScenarios: m.successfulScenarios, totalScenarios: m.totalScenarios, testExitCode: m.exitCode,
  sourceCommitHooks: { preCommitExit: 0, commitMsgExit: 0, bypass: false, repeatedTargetTest: false },
  ownChildPID: m.childPID, ownChildResidual: 0, collectorPID: process.pid, browserPID: null,
  sourcePlanVersion: 'SOURCE-SEAL plan hash applies to sourceHead; final plan only marks measured closure and records its source.',
  planItemsMeasured: true, planComplete: true, usability: null, effect: null, actualCI: null, officialCourt: null,
  task_id: 'TASK-CC-CELL-UNWIRE-RUN-309dca5d', centralTaskWriter: 'root', centralLeafRegistered: null,
  remotePush: false, PRWrite: false, mainWrite: false, auth: false, realAPI: false, databaseMutation: false,
  unfinished: ['새 CI 및 공식 Court 미확인', '실계정 UI/사용/효과 미확인', '중앙 leaf 등록 미확인', '후속 B 제품교정 미배정'],
  nextAction: 'root가 sourceHead와 closureHead를 인수해 원 PR982의 제품 독립검토와 구분하여 통합한다.'
};
fs.writeFileSync(path.join(__dirname, 'COMMIT-CLOSE.json'), JSON.stringify(closure, null, 2) + '\n', { encoding: 'utf8', flag: 'wx' });
fs.writeFileSync(path.join(__dirname, 'COMMIT-CLOSE.md'), '# 한정 종결\n\n계획 완료: 자기 계획 네 항목의 실물을 측정했다. 사용 가능·효과 확인·CI·Court는 미확인이다.\n\n정상 hook source commit: ' + sourceHead + '. SOURCE-SEAL 전체 항목은 이 commit과 디스크에서 되읽어 일치했다. 그 뒤 자기 계획의 마지막 closure 항목만 표시했다. 시험 코드/source/result/raw는 불변이다.\n\n원 해당시험은 한 번만 실행했고 6/6·exit0이다. own child46860 잔류0. close.cjs 역시 종료 후 별도 PID 관측을 인수한다. 최종 closure HEAD와 clean은 commit 뒤 stdout ACK가 정본이다. 원격 push·PR·main·제품·실계정·API·DB·운영 변경0이다.\n', { encoding: 'utf8', flag: 'wx' });
process.stdout.write(JSON.stringify({ sourceHead, ownChildResidual: closure.ownChildResidual, collectorPID: process.pid, closeSHA256: hash(fs.readFileSync(path.join(__dirname, 'COMMIT-CLOSE.json'))) }) + '\n');
