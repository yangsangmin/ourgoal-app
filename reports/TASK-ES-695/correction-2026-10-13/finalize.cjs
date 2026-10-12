'use strict';
// 원시 자료에서 표·수치를 산출한다. 기존 measurement.json·주장 기대값은 덮지 않는다.
const fs = require('fs'), path = require('path'), cp = require('child_process'), crypto = require('crypto');
const dir = __dirname, root = path.resolve(dir, '../../..');
const read = f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
const hash = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const run = (file, args) => {
  const r = cp.spawnSync(process.execPath, [file, ...(args || [])], { cwd: root, encoding: 'utf8', env: { ...process.env, NODE_PATH: 'C:/dev/ourgoal-app/node_modules' } });
  return { exitCode: r.status, stdout: r.stdout || '', stderr: r.stderr || '', error: r.error ? String(r.error) : null };
};
const unitRun = run('tests/local-keep-p0.test.js', ['--json']);
fs.writeFileSync(path.join(dir, 'unit.stdout.log'), unitRun.stdout, 'utf8'); fs.writeFileSync(path.join(dir, 'unit.stderr.log'), unitRun.stderr, 'utf8');
const unit = JSON.parse(unitRun.stdout.trim().split('\n').filter(x => x.startsWith('{')).pop());
const guards = {};
for (const file of ['scripts/module-guard.js', 'scripts/verify-integrity-gate.js']) {
  const r = run(file); const name = path.basename(file, '.js');
  fs.writeFileSync(path.join(dir, name + '.stdout.log'), r.stdout, 'utf8'); fs.writeFileSync(path.join(dir, name + '.stderr.log'), r.stderr, 'utf8');
  guards[name] = { exitCode: r.exitCode, error: r.error };
}
const before = read('before/evidence/independent-countercases.json').cases, after = read('after/evidence/independent-countercases.json').cases;
const retentionKeys = ['uniquePreviousStillAnywhere', 'brokenRawRetained', 'oldKeptRetained', 'feedbackAfterNextSave', 'uniqueCurrentRetained', 'uniquePreviousRetained', 'concurrentNewRetained'];
const pick = c => Object.fromEntries(retentionKeys.filter(k => typeof c[k] === 'boolean').map(k => [k, c[k]]));
const independent = after.map((c, i) => ({ name: c.name, before: pick(before[i]), after: pick(c), error: c.error || null, result: c.result || null }));
const seq = read('sequence-probe.json'), calls = read('direct-calls.json');
const browserDirect = Object.fromEntries(['before', 'after'].map(label => [label, read('browser/' + label + '/direct-results.json')]));
const records = read('browser/after/raw/07-p0-records-correction.json');
const goals = read('browser/after/raw/07-p0-goal-correction.json');
const quota = read('browser/after/raw/07-p0-quota-correction.json');
const rich = (records.afterReload.device.backup || []).find(r => r.text.includes('재현P0사진기록')) || null;
const summary = {
  schema: 'ourgoal.p0-correction/1', measuredAt: new Date().toISOString(), sourceState: 'worktree source SHA256, before fixed correction commit',
  sourceFiles: ['js/core/local-keep.js', 'js/core/server-records-sync.js', 'js/tabs/settings/guest-migration.js'].map(file => ({ file, sha256: hash(path.join(root, file)), lines: fs.readFileSync(path.join(root, file), 'utf8').split('\n').length })),
  unit: { total: unit.total, passed: unit.passed, failed: unit.failed, exitCode: unitRun.exitCode }, guards,
  independent: { cases: independent, count: independent.length, allRetained: independent.every(c => !c.error && Object.values(c.after).every(Boolean)), quotaComparison: read('after/evidence/comparative-regression.json') },
  sequences: { count: seq.total, assertionsNotHeld: seq.assertionsNotHeld, source: 'sequence-probe.json', initialFailureSource: 'sequence-probe.initial-failed.json' },
  directCalls: { comparisons: calls.comparisons, source: 'direct-calls.json', requestStateRenderUnchanged: calls.comparisons.every(c => c.serverSame && c.stateSame && c.renderSame) },
  browserDirect: Object.fromEntries(Object.entries(browserDirect).map(([label, data]) => [label, { entered: data.entered, error: data.error || null, exceptions: data.exceptions, scenarios: data.scenarios.map(s => ({ which: s.which, failing: s.failing, result: s.result, originalFieldsPreserved: s.originalFieldsPreserved, uniqueEditedFeedbackRetained: s.uniqueEditedFeedbackRetained })) }])),
  browserReopen: { source: 'browser/after/raw/07-p0-records-correction.json', error: records.error || null, cardPhoto: records.afterReload.cardPhoto.hasImg, cardFeedback: records.afterReload.cardPhoto.hasFeedbackText, deviceRecord: rich, nextSavePhoto: records.afterNextSave.cardPhoto.hasImg, manualSyncPhoto: records.afterManualSync.cardPhoto.hasImg, manualSyncFeedback: records.afterManualSync.cardPhoto.hasFeedbackText, secondReopenPhoto: records.afterReload2.cardPhoto.hasImg, rollbackRawEqual: records.rollback.backupEqualsBeforeReload, rollbackOk: records.rollback.result.ok, swapBackOk: records.rollback.swapBack.ok, unsentOnServer: records.afterManualSync.serverHasUnsent },
  browserGoals: { source: 'browser/after/raw/07-p0-goal-correction.json', error: goals.error || null, kept: goals.afterReload.device.gKept, unsentOnServer: goals.afterNextSave.serverHasGoal, previousRawEqual: goals.afterReload.prevEqualsBackupBeforeReload },
  browserQuota: { source: 'browser/after/raw/07-p0-quota-correction.json', error: quota.error || null, originalUnchanged: quota.afterReloadFull.backupUnchanged, unsentStillInBackup: quota.afterNextSaveFull.backupStillHasUnsent, freedKept: quota.afterReloadFreed.device.kept, stage: quota.afterReloadFull.device.keepStatus.records.last.stage, storageErrors: quota.afterReloadFull.device.keepStatus.notes },
  boundary: { ...calls.boundary, correctionInjection: seq.boundary },
  unmeasured: ['operating server', 'real accounts', 'native device', 'actual abrupt browser termination', 'physical partial storage write', 'all browser tabs race interleavings', 'service worker and installation'],
  planCompleted: false, originalUserUseAvailable: null, longTermEffectConfirmed: null, operatingServerRequests: 0,
  note: 'worker measurement only; independent review report preserved separately; Court verdict from new fixed head is pending'
};
fs.writeFileSync(path.join(dir, 'summary.json'), JSON.stringify(summary, null, 2) + '\n', 'utf8');
const table = independent.map(x => '| ' + x.name + ' | ' + JSON.stringify(x.before) + ' | ' + JSON.stringify(x.after) + ' |').join('\n');
const md = '# P0 보완 작업자 측정(법정 판정 아님)\n\n과정 → 본질 → 결과 순으로 읽는다. 수치는 finalize.cjs가 원시 JSON·명령 결과에서 뽑았다. 첫 측정과 기존 measurement.json은 그대로 보존한다.\n\n## 과정\n\n고정 PR 머리의 독립 반례를 글자 그대로 before/after 사본에서 실행했다(independent-manifest.json). 종료·읽기 실패·다음 저장은 sequence-probe.json, 두 함수 직접 호출은 direct-calls.json과 browser/before·after/direct-results.json에 있다. 첫 추가 순서 실패와 목표 fixture 누락은 별도 원시 파일로 보존했다.\n\n## 본질\n\n기기 고유 자료를 다른 탭의 옛 값 복구로 지우지 않는다. 사본 고유 자료를 먼저 보관하고, 현재 원문을 보관한 뒤 복원하며 둘째 쓰기 실패를 성공으로 표시하지 않는다. 본문 차이·깨진 원문 보관 실패는 다음 저장의 백업 교체도 멈춘다. 서버 요청·화면 상태·렌더 순서는 고정 VM 직접 호출 대조에서 같았다.\n\n## 결과\n\n| 독립 반례 | 첫 구현 | 보완 뒤 |\n|---|---|---|\n' + table + '\n\n원래 부품 시험: ' + JSON.stringify(summary.unit) + '. 추가 순서 단언: ' + JSON.stringify(summary.sequences) + '. 직접 호출 비교: ' + JSON.stringify(summary.directCalls.comparisons) + '.\n\n브라우저 정상 저장·다시 열기·용량 부족은 summary.json의 browserReopen/browserGoals/browserQuota를 읽는다. 실제 앱과 Chrome을 썼지만 세션·응답은 가짜이고 바깥망은 차단했다. 직접 함수 호출을 실클릭 E2E로 부르지 않는다. 기존 정상 UI 도구의 실제 마우스·직접 호출 섞임은 원시 도구에 그대로 드러난다.\n\n## 남는 경계와 미측정\n\n' + JSON.stringify(summary.boundary) + '\n\n마지막 read→setItem 사이 경합은 원래 main과 보완 뒤 모두 자료를 남기지 못했다. 새 회귀 수정과 전체 두 탭 저장 안전은 다르다. 한 탭 작성자의 직렬화는 B 범위다. P0 조건 전체 충족·저장 안전 완료로 일반화하지 않는다.\n\n미측정: ' + summary.unmeasured.join(', ') + '. 계획 완료는 커밋·연계 검사 뒤에만 기록한다. 사용자 실제 사용 가능·장기 효과 확인은 미확인이다. 운영 서버 요청은 이 재현의 구조상 0이다. 새 독립 검토·법정 판정은 root가 고정 머리로 받는다.\n';
const caveats = '\n기기 용량 재현의 원문 전체 동일은 ' + summary.browserQuota.originalUnchanged + '이다. 첫 구현 raw-after/07-p0-quota-after.json도 false였다: 보관 실패 직후의 commit은 원래 백업을 유지하지만 부팅 뒤 기존 saveProfile이 화면 자료+held 누락id를 쓰므로 서버 칸·배열 순서가 달라질 수 있다. 고유 미전송 기록 보존과 원문 전체 동일을 같은 뜻으로 쓰지 않는다.\n\n복원 전에 현재 자료를 restore-current로 글자째 보관하므로 성공 복원도 보관 공간을 더 쓴다. 같은 원문은 중복하지 않지만 삭제 정책은 없다. 공간이 없으면 복원을 멈춘다. 설정·전체 프로필의 기타 쓰기에 대한 실제 공간 영향은 미측정이다.\n';
fs.writeFileSync(path.join(dir, 'worker-measurements.md'), md + caveats, 'utf8');
console.log(JSON.stringify({ unit: summary.unit, independent: summary.independent.allRetained, sequences: summary.sequences, directCalls: summary.directCalls.requestStateRenderUnchanged, reopen: summary.browserReopen, quota: summary.browserQuota }));
