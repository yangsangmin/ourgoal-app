'use strict';
// TASK-ES-603 로컬 측정 도구. 판정·외부 sync·commit/push를 수행하지 않는다.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const { isDeepStrictEqual: same } = require('util');
const root = path.resolve(__dirname, '../..');
const report = 'reports/TASK-ES-603';
const raw = report + '/raw';
const stateFile = report + '/execution-state.json';
const specFile = 'docs/architecture/modules.json';
const descFile = 'docs/architecture/cell-descriptions.json';
const baseFile = 'docs/architecture/module-baseline.json';
const mapFile = 'docs/architecture/cell-map.json';
const inlineFiles = ['docs/architecture/inline-script-map.json', 'docs/architecture/INLINE-SCRIPT-MAP.md'];
const dataFiles = [specFile, baseFile, descFile, mapFile, ...inlineFiles];
const reqFile = 'docs/specs/REQ-TASK-ES-603-CELL-REGISTRY.md';
const planFile = '.claude/plan-TASK-ES-603.md';
const ids = ['goals/goal-rescale', 'records/quick-checkin'];
const sources = ['js/tabs/goals/goal-rescale.js', 'js/tabs/records/quick-checkin.js'];
const roles = [
  '목표 일정 재계산 — rescaleGoal로 미완료 마일스톤·할 일·목표 기한을 현재 날짜 기준으로 갱신하고 재계산 횟수·날짜를 남기는 기존 보존 함수',
  '미사용 빠른 체크인 보존 함수 — buildCheckinRecord로 비공개 기록 객체를 만들고 saveQuickCheckin에 기록 추가·EXP·프로필 저장·신호·뷰 갱신·팀 인증·계측 경로를 보존(운영 호출·서버 검증 미측정)'
];
const names = ['목표 일정 재계산', '빠른 체크인(미사용 보존)'];
const does = [
  '목표 일정 재계산 — 미완료 마일스톤·할 일과 목표 기한을 현재 날짜 기준으로 다시 정하고 재계산 횟수·날짜를 남기는 보존 함수. 운영 호출·서버 검증은 이번 업무에서 측정하지 않았다.',
  '빠른 체크인(미사용 보존) — 글·목표로 비공개 기록 객체를 만들고 기록 추가·EXP·프로필 저장·신호·뷰 갱신·팀 인증·계측 경로가 담긴 미사용 보존 함수. 운영 호출·서버 검증은 이번 업무에서 측정하지 않았다.'
];
const abs = p => path.join(root, p);
const read = p => fs.readFileSync(abs(p), 'utf8');
const json = p => JSON.parse(read(p));
const write = (p, text) => { fs.mkdirSync(path.dirname(abs(p)), { recursive: true }); fs.writeFileSync(abs(p), text, 'utf8'); };
const writeJson = (p, doc) => write(p, JSON.stringify(doc, null, 2) + '\n');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const shaFile = p => sha(fs.readFileSync(abs(p)));
const ref = p => ({ path: p, sha256: shaFile(p) });
const env = { ...process.env, NODE_PATH: 'C:/dev/ourgoal-app/node_modules' };
let st = fs.existsSync(abs(stateFile)) ? json(stateFile) : { taskId: 'TASK-ES-603', executions: [] };
function persist() { writeJson(stateFile, st); }
function run(label, exe, args, expected = 0) {
  // 실제 명령은 도구의 PowerShell 전경 실행으로 기록한다. 기존 생성기를 대체하지 않는다.
  const entry = st.executions.filter(e => e.label === label && e.exitCode !== null).at(-1);
  if (!entry) throw new Error('native execution evidence required: ' + label);
  const stdout = read(entry.stdout.path).replace(/^\uFEFF/, '');
  const stderr = read(entry.stderr.path).replace(/^\uFEFF/, '');
  if (expected !== null && entry.exitCode !== expected) throw new Error(label + ' unexpected exit ' + entry.exitCode + ': ' + stderr.slice(-2000));
  return { entry, stdout, stderr, status: entry.exitCode };
}
const node = (label, script, args = [], expected = 0) => run(label, process.execPath, [script, ...args], expected);
const git = (label, args) => run(label, 'git', args);
function snapshotData(label) {
  const refs = {};
  for (const f of dataFiles) { const p = raw + '/' + label + '/' + path.basename(f); write(p, read(f)); refs[f] = ref(p); }
  return refs;
}
function lintDocument(f) {
  const text = read(f); const issues = [];
  const symbols = [...'①②③④⑤⑥⑦⑧'];
  symbols.forEach((s, i) => { if (!text.includes('## ' + (i + 1) + '. [원칙 ' + s + ']')) issues.push('missing independent header ' + s); });
  const step2 = text.split('## 2.')[1]?.split('## 3.')[0] || '';
  for (const w of ['본질', '원인', '중심', '핵심']) if (!step2.includes(w)) issues.push('missing ' + w);
  if (!/## 6\.[^\n]*재검증/.test(text)) issues.push('missing revalidation');
  for (const w of ['반론1', '반론2']) if (!text.includes(w)) issues.push('missing ' + w);
  return { file: ref(f), issues };
}
function verifyPreservation() {
  const before = JSON.parse(read(st.beforeData[specFile].path));
  const after = json(specFile);
  const scriptText = read('scripts/module-specs.js');
  const handFields = [...scriptText.match(/const HAND_FIELDS = \[([^\]]+)\]/)[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
  const comparisons = before.cells.map(old => {
    const fresh = after.cells.find(c => c.id === old.id);
    return { id: old.id, exists: !!fresh, fields: handFields.map(field => ({ field, keyPresenceEqual: !!fresh && Object.hasOwn(old, field) === Object.hasOwn(fresh, field), valueEqual: !!fresh && same(old[field], fresh[field]) })) };
  });
  const bDesc = JSON.parse(read(st.beforeData[descFile].path)); const aDesc = json(descFile);
  const descComparisons = ['names', 'cells'].map(section => ({ section, entries: Object.entries(bDesc[section]).map(([key, value]) => ({ key, exists: Object.hasOwn(aDesc[section], key), valueEqual: same(value, aDesc[section][key]) })), addedKeys: Object.keys(aDesc[section]).filter(k => !Object.hasOwn(bDesc[section], k)).sort(), removedKeys: Object.keys(bDesc[section]).filter(k => !Object.hasOwn(aDesc[section], k)) }));
  const added = after.cells.filter(c => !before.cells.some(b => b.id === c.id));
  const removed = before.cells.filter(c => !after.cells.some(a => a.id === c.id)).map(c => c.id);
  const newChecks = ids.map((id, i) => { const c = after.cells.find(c => c.id === id); const code = require(abs('scripts/module-specs.js')).actualOf(root, sources[i]); return { id, registry: c, name: aDesc.names[id], does: aDesc.cells[id], source: ref(sources[i]), kindAndSizeMatch: c?.kind === 'tab' && c?.size === 'small', automaticFieldsMatch: ['emits', 'listens', 'domRoot', 'ownerKeys', 'dependsOn'].every(k => same(c[k], code[k])), noInventedContracts: ['provides', 'requires', 'owns', 'contributes', 'capabilities', 'spans'].every(k => same(c[k], [])) && same(c.planned, { provides: [], contributes: [] }), literalKExportsPresent: (i === 0 ? ['K.rescaleGoal = rescaleGoal;'] : ['K.buildCheckinRecord = buildCheckinRecord;', 'K.saveQuickCheckin = saveQuickCheckin;']).every(t => read(sources[i]).includes(t)) }; });
  const bBase = JSON.parse(read(st.beforeData[baseFile].path)); const aBase = json(baseFile);
  const guard = require(abs('scripts/module-guard.js'));
  const baseline = { priorHistoryPreserved: same(bBase.history, aBase.history.slice(0, bBase.history.length)), previous: bBase.history.at(-1), current: aBase.history.at(-1), comparison: guard.compareToBaseline(bBase.history.at(-1).metrics, aBase.history.at(-1).metrics), currentEqualsMeasured: same(aBase.history.at(-1).metrics, guard.snapshot(require(abs('scripts/module-metrics.js')).measure(root))) };
  const result = { handFields, previousCellCount: before.cells.length, currentCellCount: after.cells.length, addedIds: added.map(c => c.id).sort(), removedIds: removed, existingHands: comparisons, descriptionComparisons: descComparisons, descriptionMetadataPreserved: Object.keys(bDesc).filter(k => !['names', 'cells'].includes(k)).every(k => same(bDesc[k], aDesc[k])), newCells: newChecks, baseline };
  result.existingHandMismatchCount = comparisons.flatMap(c => c.fields.filter(f => !f.keyPresenceEqual || !f.valueEqual)).length;
  result.descriptionMismatchCount = descComparisons.flatMap(s => s.entries.filter(e => !e.exists || !e.valueEqual)).length;
  result.onlyTwoNewDescriptions = descComparisons.every(s => same(s.addedKeys, ids.slice().sort()) && s.removedKeys.length === 0);
  writeJson(raw + '/preservation.json', result);
  if (result.existingHandMismatchCount || result.descriptionMismatchCount || !result.onlyTwoNewDescriptions || !result.descriptionMetadataPreserved || removed.length || !same(result.addedIds, ids.slice().sort()) || newChecks.some(c => !c.kindAndSizeMatch || !c.automaticFieldsMatch || !c.noInventedContracts || !c.literalKExportsPresent) || !baseline.priorHistoryPreserved || baseline.comparison.failures.length || !baseline.currentEqualsMeasured) throw new Error('preservation mismatch; see raw/preservation.json');
  return result;
}
const stage = process.argv[2];
if (stage === 'preflight') {
  if (st.beforeData) throw new Error('preflight already captured');
  const head = git('head', ['rev-parse', 'HEAD']).stdout.trim();
  const origin = git('origin-main', ['rev-parse', 'origin/main']).stdout.trim();
  const request = json('.yangvis-inputs/request.json');
  st.input = { request: ref('.yangvis-inputs/request.json'), instructions: ['.yangvis-inputs/prompt.md', '.yangvis-inputs/prompt-v2.md'].map(ref), requestedSourceCommit: request.sourceCommit, head, originMainAtRead: origin, sourceCommitMatch: head === request.sourceCommit && origin === head };
  if (!st.input.sourceCommitMatch) throw new Error('provided source mismatch');
  st.beforeData = snapshotData('before');
  st.beforeInputChecks = dataFiles.map(f => ({ file: f, currentSha256: shaFile(f), providedBefore: ref('.yangvis-inputs/before/' + f), equalsProvidedBefore: shaFile(f) === shaFile('.yangvis-inputs/before/' + f) }));
  if (st.beforeInputChecks.some(c => !c.equalsProvidedBefore)) throw new Error('provided before mismatch');
  const tracked = git('tracked-file-list', ['ls-files', '-z']).stdout.split('\0').filter(Boolean);
  const hashes = Object.fromEntries(tracked.filter(f => fs.existsSync(abs(f)) && fs.statSync(abs(f)).isFile()).map(f => [f, shaFile(f)]));
  writeJson(raw + '/tracked-before-sha256.json', hashes);
  st.trackedBefore = ref(raw + '/tracked-before-sha256.json');
  st.sourceFiles = sources.map(f => { const headText = git('source-head-' + path.basename(f, '.js'), ['show', head + ':' + f]).stdout.replace(/\r\n/g, '\n').trimEnd(); return { ...ref(f), bytes: fs.statSync(abs(f)).size, headTextNormalizedSha256: sha(headText), currentTextNormalizedSha256: sha(read(f).replace(/\r\n/g, '\n').trimEnd()) }; });
  const fetchCapture = { command: ['git', '-C', 'C:/dev/ourgoal-app', 'fetch', 'origin', '-q'], cwd: root, exitCode: 1, rawCombinedToolOutput: "error: cannot open '.git/FETCH_HEAD': Permission denied\n", source: '초기 tools.exec_command 반환 실물, stdout/stderr 분리는 도구 출력에 없음', stdout: null, stderr: null };
  writeJson(raw + '/fetch-tool-result.json', fetchCapture);
  st.fetch = ref(raw + '/fetch-tool-result.json');
  git('remote-directives', ['-C', 'C:/dev/ourgoal-app', 'show', 'origin/main:docs/directives/ACTIVE.md']);
  git('initial-status', ['status', '--short', '--untracked-files=all']);
  for (const f of [...sources, ...dataFiles]) git('history-' + path.basename(f).replace(/\W/g, '-'), ['log', '-3', '--format=%H %s', '--', f]);
  for (const f of ['reports/TASK-ES-600/claims.json', 'reports/TASK-ES-601/claims.json']) { write(raw + '/prior-' + path.basename(path.dirname(f)) + '-claims.json', read(f)); }
  const r = node('module-guard-before', 'scripts/module-guard.js', [], 1);
  st.initialGuard = r.entry; persist();
} else if (stage === 'lint') {
  const lint = [reqFile, planFile].map(lintDocument); writeJson(raw + '/req-plan-integrity.json', lint);
  if (lint.some(x => x.issues.length)) throw new Error('REQ/PLAN integrity mismatch');
  st.reqIntegrity = node('req-integrity-gate', 'scripts/verify-integrity-gate.js').entry; persist();
} else if (stage === 'prepare-registration') {
  if (!st.initialGuard || !st.reqIntegrity || st.reqIntegrity.exitCode !== 0) throw new Error('preflight/lint required');
  const spec = json(specFile); const desc = json(descFile);
  ids.forEach((id, i) => {
    if (spec.cells.some(c => c.id === id) || Object.hasOwn(desc.names, id) || Object.hasOwn(desc.cells, id)) throw new Error('already exists ' + id);
    // 자동 필드는 이 도구가 쓰지 않는다. --write가 소스에서 추출한다.
    spec.cells.push({ id, file: sources[i], kind: 'tab', size: 'small', role: roles[i] });
    desc.names[id] = names[i]; desc.cells[id] = does[i];
  });
  writeJson(specFile, spec); writeJson(descFile, desc);
} else if (stage === 'generate') {
  node('module-specs-write', 'scripts/module-specs.js', ['--write']);
  const guard = require(abs('scripts/module-guard.js'));
  const current = guard.snapshot(require(abs('scripts/module-metrics.js')).measure(root));
  const preUpdate = guard.compareToBaseline(JSON.parse(read(st.beforeData[baseFile].path)).history.at(-1).metrics, current);
  writeJson(raw + '/baseline-pre-update.json', { current, comparison: preUpdate });
  if (preUpdate.failures.length) throw new Error('baseline increase prohibited');
  node('module-guard-update', 'scripts/module-guard.js', ['--update']);
  node('cell-map-export', 'scripts/cell-map-export.js');
  node('inline-script-map-write', 'scripts/inline-script-map.js', ['--write']);
  st.firstGenerated = snapshotData('generated');
  verifyPreservation(); persist();
} else if (stage === 'verify') {
  verifyPreservation();
  const specOut = node('module-specs-stdout', 'scripts/module-specs.js');
  const mapOut = node('cell-map-stdout', 'scripts/cell-map-export.js', ['--stdout']);
  const stdoutChecks = [{ file: specFile, equalsStdout: same(JSON.parse(read(specFile)), JSON.parse(specOut.stdout)) }, { file: mapFile, equalsStdout: same(JSON.parse(read(mapFile)), JSON.parse(mapOut.stdout)) }];
  node('module-specs-repeat', 'scripts/module-specs.js', ['--write']);
  node('module-guard-update-repeat', 'scripts/module-guard.js', ['--update']);
  node('cell-map-repeat', 'scripts/cell-map-export.js');
  node('inline-script-map-repeat', 'scripts/inline-script-map.js', ['--write']);
  const byteChecks = dataFiles.map(file => ({ file, first: st.firstGenerated[file].sha256, repeated: shaFile(file), byteIdentical: st.firstGenerated[file].sha256 === shaFile(file) }));
  const map = json(mapFile); const generatedCells = ids.map(id => { const c = map.cells.find(c => c.id === id); return { id, cell: c, agreesWithDescription: !!c && c.name === json(descFile).names[id] && c.does === json(descFile).cells[id] && c.doesSource === 'hand' }; });
  st.generatorIdentity = { stdoutChecks, byteChecks, generatedCells };
  writeJson(raw + '/generator-identity.json', st.generatorIdentity); persist();
  if (stdoutChecks.some(c => !c.equalsStdout) || byteChecks.some(c => !c.byteIdentical) || generatedCells.some(c => !c.agreesWithDescription)) throw new Error('generator identity mismatch');
  node('module-specs-check', 'scripts/module-specs.js', ['--check']);
  node('cell-map-check', 'scripts/cell-map-export.js', ['--check']);
  st.finalGuard = node('module-guard-after', 'scripts/module-guard.js').entry; persist();
} else if (stage === 'test') {
  // 子プロセスを detach しない。npm全実行の終了までこの native プロセスが同期で待つ。
  st.npmTest = run('npm-test', process.env.ComSpec || 'C:/Windows/System32/cmd.exe', ['/d', '/s', '/c', 'npm test'], null).entry; persist();
} else {
  throw new Error('unknown stage ' + stage);
}
