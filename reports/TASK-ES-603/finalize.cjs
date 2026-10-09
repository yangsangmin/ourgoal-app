'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { isDeepStrictEqual: same } = require('util');
const root = path.resolve(__dirname, '../..');
const report = 'reports/TASK-ES-603';
const raw = report + '/raw';
const abs = p => path.join(root, p);
const read = p => fs.readFileSync(abs(p), 'utf8').replace(/^\uFEFF/, '');
const json = p => JSON.parse(read(p));
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const ref = p => ({ path: p, sha256: hash(fs.readFileSync(abs(p))) });
const save = (p, v) => fs.writeFileSync(abs(p), JSON.stringify(v, null, 2) + '\n', 'utf8');
const st = json(report + '/execution-state.json');
const get = label => { const e = st.executions.filter(x => x.label === label && x.exitCode !== null).at(-1); if (!e) throw new Error('missing native execution: ' + label); return e; };
const stdout = label => read(get(label).stdout.path);
const stderr = label => read(get(label).stderr.path);
const dataFiles = ['docs/architecture/modules.json', 'docs/architecture/module-baseline.json', 'docs/architecture/cell-descriptions.json', 'docs/architecture/cell-map.json', 'docs/architecture/inline-script-map.json', 'docs/architecture/INLINE-SCRIPT-MAP.md'];
const reqFile = 'docs/specs/REQ-TASK-ES-603-CELL-REGISTRY.md';
const ids = ['goals/goal-rescale', 'records/quick-checkin'];
const preservation = json(raw + '/preservation.json');
const beforeHashes = json(st.trackedBefore.path);
const trackedCompared = Object.entries(beforeHashes).map(([file, beforeSha256]) => ({ file, beforeSha256, afterSha256: fs.existsSync(abs(file)) ? ref(file).sha256 : null }));
const shaChanged = trackedCompared.filter(x => x.beforeSha256 !== x.afterSha256).map(x => x.file).sort();
const diffPaths = stdout('diff-name-only').trim().split(/\r?\n/).filter(Boolean).sort();
if (!same(shaChanged, diffPaths)) throw new Error('git diff / byte change disagreement: ' + JSON.stringify({ shaChanged, diffPaths }));
const vault = json('court/vault.json');
function glob(pattern, file) { return new RegExp('^' + pattern.split(/(\*\*|\*)/).map(s => s === '**' ? '.*' : s === '*' ? '[^/]*' : s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('') + '$').test(file); }
const statusLabel = st.executions.some(e => e.label === 'final-status') ? 'final-status' : 'status-after';
const statusPaths = stdout(statusLabel).split(/\r?\n/).filter(Boolean).map(s => s.slice(3).replace(/^"|"$/g, ''));
const isAllowed = f => dataFiles.includes(f) || f === reqFile || f === '.claude/plan-TASK-ES-603.md' || f === '.task-links/01a11bfe.json' || f.startsWith(report + '/') || f.startsWith('.yangvis-inputs/');
const scope = {
  trackedFileComparison: trackedCompared,
  changedTrackedFiles: shaChanged,
  gitDiffPaths: diffPaths,
  byteChangesAgreeWithGitDiff: same(shaChanged, diffPaths),
  untrackedOrChangedPaths: statusPaths,
  outsideAllowed: statusPaths.filter(f => !isAllowed(f)),
  productCodeChanged: shaChanged.filter(f => f === 'index.html' || f.startsWith('js/') || vault.product.some(p => glob(p, f))),
  testsChanged: shaChanged.filter(f => f.startsWith('tests/') || vault.baseTests.some(p => glob(p, f))),
  vaultChanged: shaChanged.filter(f => vault.frozen.some(p => glob(p, f)) || Object.hasOwn(vault.frozenJsonKeys, f)),
  normsChanged: shaChanged.filter(f => /^(norms\/|docs\/rules\/|docs\/directives\/|AGENTS|CLAUDE|GEMINI|\.githooks\/|\.github\/)/.test(f)),
  gitDiffCheckExitCode: get('diff-check').exitCode
};
scope.productCodeChangeCount = scope.productCodeChanged.length;
scope.testChangeCount = scope.testsChanged.length;
scope.vaultChangeCount = scope.vaultChanged.length;
scope.normChangeCount = scope.normsChanged.length;
save(raw + '/scope-check.json', scope);
if (scope.outsideAllowed.length || scope.productCodeChangeCount || scope.testChangeCount || scope.vaultChangeCount || scope.normChangeCount || scope.gitDiffCheckExitCode !== 0) throw new Error('scope mismatch');
const spec = json(dataFiles[0]); const desc = json(dataFiles[2]); const map = json(dataFiles[3]); const inline = json(dataFiles[4]);
const snapshot = { sourceCommit: st.input.head, registry: spec, descriptions: desc, baseline: json(dataFiles[1]), cellMap: map, inlineMap: inline, inlineMarkdown: read(dataFiles[5]) };
save(raw + '/final-generated-snapshot.json', snapshot);
const probe = stdout('nested-process-probe').trim().split(/\r?\n/).map(l => JSON.parse(l));
const npmOut = stdout('npm-test'); const npmErr = stderr('npm-test');
const npmSummary = /([0-9]+)개 통과, ([0-9]+)개 실패/.exec(npmOut);
const tests = {
  npmTest: get('npm-test'),
  parsedSmokeSummary: npmSummary ? { successfulAssertions: Number(npmSummary[1]), failedAssertions: Number(npmSummary[2]), source: get('npm-test').stdout } : null,
  npmFailureLines: npmErr.split(/\r?\n/).filter(l => /compliance|test-account-purge|null !== 0/.test(l)),
  npmCompletedNativeProcess: get('npm-test').exitCode !== null,
  nestedProcessProbe: { execution: get('nested-process-probe'), results: probe },
  directAccountPurge: get('account-purge-direct'),
  integrityAfter: get('integrity-after'),
  clicksAfter: get('clicks-after'),
  shipyardAfter: get('shipyard-after'),
  shipyardFailureLines: stderr('shipyard-after').split(/\r?\n/).filter(l => /module-guard|exit null|null !== 0/.test(l)),
  fullNpmExitZero: get('npm-test').exitCode === 0,
  explanation: 'npm test는 smoke의 test-account-purge 하위 실행 status=null에서 exit1. 직접 시험 exit0 및 하위 프로세스 EPERM 탐침을 별도 보존했다. npm 성공으로 대체하지 않는다. 조선소 시험도 하위 module-guard status=null에서 exit1. 직접 module-guard exit0은 별도 측정이다.'
};
const limitations = {
  remoteFetch: { execution: st.fetch, refreshed: false, reason: '공유 Git FETCH_HEAD 쓰기 Permission denied' },
  internalGit: { probe: get('nested-process-probe'), gitAvailableToGenerator: false, generatedMapSource: map.source, generatedBaselineCommit: snapshot.baseline.history.at(-1).commit, missingHistory: '기존 생성기의 Git 불가 fallback에서 prs가 빈 배열로 생성됨. 입력 코드·설명 측정과 분리한다.', rootNextAction: '권한이 허용된 root 실행 환경에서 기존 생성기를 재실행하여 Git 출처·이력을 복원하고 npm test 전체를 다시 실행한다. TASK-ES-602 새 일곱 설명도 보존한다.' },
  runtime: { productionCalls: null, serverVerification: null, realAccounts: null, mobile: null },
  courtVerdict: null,
  courtRun: false, merge: false, deployment: false, commit: false, push: false, pullRequest: false, externalSync: false
};
const allExistingKeys = preservation.descriptionComparisons.map(s => ({ section: s.section, comparedEntries: s.entries.length, addedKeys: s.addedKeys, removedKeys: s.removedKeys, unequal: s.entries.filter(e => !e.exists || !e.valueEqual) }));
const measurement = {
  schema: 'ourgoal.task-es-603.measurement/1', taskId: 'TASK-ES-603', type: '작업자 측정, 판정 아님',
  input: { ...st.input, remoteMainRead: st.executions.filter(e => e.label === 'remote-main-read').at(-1) || null },
  guidelines: ['C:/Users/HP/.codex/AGENTS.md', abs('AGENTS.md'), 'C:/dev/agent-knowledge/WORK-REFERENCE.md'].map(p => ({ path: p, sha256: hash(fs.readFileSync(p)) })),
  workReferenceBasis: 'PR #847 (eed37224)',
  providedBeforeChecks: st.beforeInputChecks,
  sourceFiles: st.sourceFiles,
  sourcesUnchangedAgainstHeadNormalizedText: st.sourceFiles.every(s => s.headTextNormalizedSha256 === s.currentTextNormalizedSha256),
  executions: st.executions,
  initialGuard: st.initialGuard,
  initialFailures: stderr('module-guard-before').split(/\r?\n/).filter(l => l.includes('신고서 없는 세포:')),
  finalGuard: get('module-guard-after'),
  reqIntegrity: { documentInspection: ref(raw + '/req-plan-integrity.json'), execution: st.reqIntegrity },
  preservation: { detail: ref(raw + '/preservation.json'), existingCellsCompared: preservation.previousCellCount, handFields: preservation.handFields, existingHandMismatchCount: preservation.existingHandMismatchCount, descriptionMismatchCount: preservation.descriptionMismatchCount, descriptionSections: allExistingKeys, onlyTwoNewDescriptions: preservation.onlyTwoNewDescriptions, descriptionMetadataPreserved: preservation.descriptionMetadataPreserved, addedIds: preservation.addedIds, removedIds: preservation.removedIds, baseline: preservation.baseline },
  newCells: preservation.newCells.map(c => ({ id: c.id, name: c.name, does: c.does, source: c.source, registry: c.registry, generatedCell: map.cells.find(x => x.id === c.id) })),
  generatorIdentity: { detail: ref(raw + '/generator-identity.json'), result: st.generatorIdentity },
  scope: { detail: ref(raw + '/scope-check.json'), changedTrackedFiles: scope.changedTrackedFiles, productCodeChangeCount: scope.productCodeChangeCount, testChangeCount: scope.testChangeCount, vaultChangeCount: scope.vaultChangeCount, normChangeCount: scope.normChangeCount, outsideAllowed: scope.outsideAllowed, byteChangesAgreeWithGitDiff: scope.byteChangesAgreeWithGitDiff, gitDiffCheckExitCode: scope.gitDiffCheckExitCode },
  outputs: dataFiles.map(ref),
  immutableGeneratedSnapshot: ref(raw + '/final-generated-snapshot.json'),
  tests, limitations,
  outOfScopeReports: [
    { source: ref('js/tabs/goals/goal-rescale.js'), finding: 'scaleRatio 지정 뒤 기한 계산에서 사용하지 않음', fixed: false },
    { source: ref('js/tabs/records/quick-checkin.js'), finding: '미사용 보존 함수에 L.MOCK_GROUPS 참조 및 team_pings 실패를 삼키는 경로가 있음', fixed: false },
    { taskId: 'TASK-ES-602', finding: '별도 일곱 설명 보충은 이 작업에서 수행·청구하지 않음', fixed: false }
  ],
  nextAction: limitations.internalGit.rootNextAction
};
save(report + '/measurement.json', measurement);
const claims = [];
function claim(req, statement, file, check) { claims.push({ id: 'C' + String(claims.length + 1).padStart(2, '0'), req, kind: 'static', domain: 'config', statement, touches: [file], check: { file, ...check } }); }
function jp(req, statement, file, dotted, equals) { claim(req, statement, file, { type: 'jsonPath', path: dotted, equals }); }
function contains(req, statement, file, text) { claim(req, statement, file, { type: 'codeContains', text }); }
function notContains(req, statement, file, text) { claim(req, statement, file, { type: 'codeNotContains', text }); }
function registryText(cell) { return JSON.stringify(cell, null, 2).split('\n').map(l => '    ' + l).join('\n'); }
for (let i = 0; i < ids.length; i++) {
  const id = ids[i]; const r = i === 0 ? 'R1' : 'R2'; const c = spec.cells.find(c => c.id === id);
  contains(r, '신고서에 ' + id + '의 실제 경로·tab 종류·small 크기·책임과 생성 필드가 기록되어 있다.', dataFiles[0], registryText(c));
  jp('R3', '설명 파일에 ' + id + ' 이름이 기록되어 있다.', dataFiles[2], 'names.' + id, desc.names[id]);
  jp('R3', '설명 파일에 ' + id + '의 담당 설명이 기록되어 있다.', dataFiles[2], 'cells.' + id, desc.cells[id]);
  const mapCell = map.cells.find(c => c.id === id);
  const mapPrefix = Object.fromEntries(Object.entries(mapCell).slice(0, Object.keys(mapCell).indexOf('doesSource') + 1));
  const mapText = JSON.stringify(mapPrefix, null, 1).split('\n').map(l => '  ' + l).join('\n').replace(/\n  }$/, ',');
  contains('R4', '생성 지도에 ' + id + '의 이름과 담당 설명 및 hand 출처가 기록되어 있다.', dataFiles[3], mapText);
}
jp('R4', '기준선 파일의 생성 자료 형식이 유지되어 있다.', dataFiles[1], 'schema', snapshot.baseline.schema);
contains('R4', '기준선에 생성기가 추가한 하향 측정 이력의 날짜가 기록되어 있다.', dataFiles[1], '"date": "' + snapshot.baseline.history.at(-1).date + '"');
jp('R4', '인라인 JSON 지도는 index.html을 입력으로 기록한다.', dataFiles[4], 'source.file', 'index.html');
for (const n of ['rescaleGoal', 'buildCheckinRecord', 'saveQuickCheckin']) {
  notContains('R4', '인라인 JSON 생성 지도에 이전된 ' + n + ' 이름이 없다.', dataFiles[4], n);
  notContains('R4', '인라인 Markdown 생성 지도에 이전된 ' + n + ' 이름이 없다.', dataFiles[5], n);
}
const mf = report + '/measurement.json';
jp('R3', '측정 보고에 기존 신고 손 필드 전수 대조의 불일치 수가 기록되어 있다.', mf, 'preservation.existingHandMismatchCount', measurement.preservation.existingHandMismatchCount);
jp('R3', '측정 보고에 기존 설명 전수 대조의 불일치 수가 기록되어 있다.', mf, 'preservation.descriptionMismatchCount', measurement.preservation.descriptionMismatchCount);
jp('R3', '측정 보고에 새 두 설명만 추가한 대조 결과가 기록되어 있다.', mf, 'preservation.onlyTwoNewDescriptions', measurement.preservation.onlyTwoNewDescriptions);
jp('R4', '측정 보고에 생성 표준 출력과 재실행 바이트 동일성 대조가 기록되어 있다.', mf, 'generatorIdentity.result.byteChecks', measurement.generatorIdentity.result.byteChecks);
jp('R4', '측정 보고에 기준선 하향 비교의 증가 목록이 기록되어 있다.', mf, 'preservation.baseline.comparison.failures', measurement.preservation.baseline.comparison.failures);
jp('R5', '측정 보고에 최초 가드의 실제 종료코드가 기록되어 있다.', mf, 'initialGuard.exitCode', measurement.initialGuard.exitCode);
jp('R5', '측정 보고에 최종 직접 가드의 실제 종료코드가 기록되어 있다.', mf, 'finalGuard.exitCode', measurement.finalGuard.exitCode);
jp('R5', '측정 보고에 npm 전경 실행의 실제 종료코드가 기록되어 있다.', mf, 'tests.npmTest.exitCode', measurement.tests.npmTest.exitCode);
jp('R5', '측정 보고에 제품 파일 변경 수 대조가 기록되어 있다.', mf, 'scope.productCodeChangeCount', measurement.scope.productCodeChangeCount);
jp('R5', '측정 보고에 시험 파일 변경 수 대조가 기록되어 있다.', mf, 'scope.testChangeCount', measurement.scope.testChangeCount);
jp('R5', '측정 보고에 금고 파일 변경 수 대조가 기록되어 있다.', mf, 'scope.vaultChangeCount', measurement.scope.vaultChangeCount);
jp('R5', '측정 보고에 규범 파일 변경 수 대조가 기록되어 있다.', mf, 'scope.normChangeCount', measurement.scope.normChangeCount);
jp('R6', '측정 보고는 작업자 기록임을 명시한다.', mf, 'type', measurement.type);
jp('R6', '측정 보고의 법정 판정 칸은 미측정으로 기록되어 있다.', mf, 'limitations.courtVerdict', null);
const doc = { task: 'TASK-ES-603', requirementsSource: reqFile, requirements: [
  { id: 'R1', text: '기존 목표 일정 재계산 세포 등록 복구' },
  { id: 'R2', text: '미사용 보존 빠른 체크인 세포 등록 복구' },
  { id: 'R3', text: '기존 HAND_FIELDS·names/cells 전수 보존과 새 두 설명 보충' },
  { id: 'R4', text: '기존 생성기로 하향 기준선·세포지도·인라인 지도 갱신 및 동일성 측정' },
  { id: 'R5', text: '기존 실패·REQ 검사·전경 npm 실행·제품/시험/금고 무변경 원시와 실제 결과 보존' },
  { id: 'R6', text: '실제 설정 내용과 보고 기록 주장 분리 및 미측정·root 인계 명시' }
], claims, outOfScopeReports: measurement.outOfScopeReports, limitations, retire: [] };
save(report + '/claims.json', doc);
// 법정 판정을 호출하지 않는다. jsonPath와 코드 문자열의 제출값만 직접 대조한다.
const contentChecks = claims.map(c => {
  const k = c.check; const text = read(k.file);
  const value = k.type === 'jsonPath' ? k.path.split('.').reduce((o, key) => o && typeof o === 'object' ? o[key] : undefined, JSON.parse(text)) : null;
  const matches = k.type === 'jsonPath' ? JSON.stringify(value) === JSON.stringify(k.equals) : k.type === 'codeContains' ? text.includes(k.text) : !text.includes(k.text);
  return { id: c.id, requirement: c.req, type: k.type, file: ref(k.file), matchesSubmittedText: matches };
});
save(raw + '/claims-content-check.json', { source: '작업자 제출값 대조, 법정 판정 아님', checks: contentChecks, mismatchCount: contentChecks.filter(c => !c.matchesSubmittedText).length, missingRequirements: doc.requirements.filter(r => !claims.some(c => c.req === r.id)).map(r => r.id), missingChangedDataClaims: dataFiles.filter(f => !claims.some(c => c.check.file === f)) });
if (contentChecks.some(c => !c.matchesSubmittedText)) throw new Error('claim text mismatch');
const manifestPaths = [...new Set([st.trackedBefore.path, ...st.beforeInputChecks.map(c => c.providedBefore.path), ...Object.values(st.beforeData).map(r => r.path), ...Object.values(st.firstGenerated).map(r => r.path), ...st.executions.flatMap(e => [e.stdout.path, e.stderr.path]), raw + '/preservation.json', raw + '/generator-identity.json', raw + '/scope-check.json', raw + '/claims-content-check.json', raw + '/final-generated-snapshot.json', raw + '/req-plan-integrity.json', raw + '/fetch-tool-result.json', ...dataFiles, reqFile, '.claude/plan-TASK-ES-603.md', '.task-links/01a11bfe.json', report + '/measurement.json', report + '/claims.json', report + '/measure.cjs', report + '/record-native.cjs', report + '/finalize.cjs'])];
save(report + '/evidence-manifest.json', { taskId: doc.task, files: manifestPaths.map(ref), executionRawHashesAgree: st.executions.every(e => [e.stdout, e.stderr].every(r => ref(r.path).sha256 === r.sha256)), note: '파일 실재·SHA 대조만이며 결과 판정 아님' });
console.log(JSON.stringify({ task: doc.task, addedIds: preservation.addedIds, existingHandMismatchCount: preservation.existingHandMismatchCount, descriptionMismatchCount: preservation.descriptionMismatchCount, byteIdentical: st.generatorIdentity.byteChecks.every(c => c.byteIdentical), moduleGuardExitCode: get('module-guard-after').exitCode, npmTestExitCode: tests.npmTest.exitCode, scope: measurement.scope, claims: claims.length, generatedSourceCommit: map.source.commit, courtVerdict: null, nextAction: measurement.nextAction }, null, 2));
