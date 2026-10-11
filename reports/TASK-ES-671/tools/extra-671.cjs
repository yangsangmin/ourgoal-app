'use strict';
// measurement.json 에 덧붙이는 측정(작업자 측정, 판정 아님): 바뀐 파일 분류 · 기준선 기록 · 통로 접근자 탐침 결과 · 상태 이전 미리 보기(저장소 밖 사본에 생성기 unstate 를 이름 하나씩 — 이 PR 은 상태 이전을 하지 않는다).
// 사용: node extra-671.cjs <작업 트리> <기준 작업 폴더>
const fs = require('fs'), path = require('path'), cp = require('child_process'), os = require('os');
const [WORK_ARG, BASE] = process.argv.slice(2);
const WORK = path.resolve(WORK_ARG), DIR = path.join(WORK, 'reports', 'TASK-ES-671');
const rj = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const git = (d, a) => cp.execFileSync('git', a, { cwd: d, encoding: 'utf8' }).trim();
const node = (cwd, args, env) => cp.spawnSync(process.execPath, args, { cwd, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, env: Object.assign({}, process.env, env || {}) });
const m = rj(path.join(DIR, 'measurement.json'));
const baseHead = git(BASE, ['rev-parse', 'HEAD']);
const changed = [...new Set(git(WORK, ['diff', '--name-only', baseHead]).split('\n').filter(Boolean).concat(git(WORK, ['ls-files', '--others', '--exclude-standard']).split('\n').filter(Boolean)))].sort();
const product = changed.filter(f => f === 'index.html' || f.startsWith('js/') || /^ui\.(js|css)$/.test(f) || f === 'sw.js');
m.changed = { all: changed, productFiles: product, productIsIndexPlusNewCell: JSON.stringify(product) === JSON.stringify(['index.html', 'js/core/boot-app-handles.js']), testsChanged: changed.filter(f => f.startsWith('tests/')),
  vaultChanged: changed.filter(f => /^(court\/|\.github\/|\.githooks\/|AGENTS\.md|CLAUDE\.md|GEMINI\.md|01_OURGOAL|package\.json|vercel\.json|scripts\/(essence-gate|verify-integrity-gate)\.js|docs\/rules\/(OURGOAL_ABSOLUTE|CONSTITUTION_VERSIONS|ESSENCE_OURGOAL|rules)|docs\/directives\/)/.test(f)),
  generatorChanged: changed.filter(f => f.startsWith('docs/design/harness/')), generatedMapsChanged: changed.filter(f => /docs\/architecture\/(cell-map\.json|inline-script-map\.json|INLINE-SCRIPT-MAP\.md)/.test(f)) };
const baseline = rj(path.join(WORK, 'docs', 'architecture', 'module-baseline.json')), last = baseline.history[baseline.history.length - 1];
m.baseline = { historyLength: baseline.history.length, lastInlineScriptLines: last.metrics.inlineScriptLines, recordedEqualsMeasured: last.metrics.inlineScriptLines === m.metrics.inlineScriptLines[1] };
const ap = fs.existsSync(path.join(DIR, 'accessor-probe.json')) ? rj(path.join(DIR, 'accessor-probe.json')) : null;
m.accessorProbe = ap && { ok: ap.ok, readNames: ap.static.readNames, assignedNames: ap.static.assignedNames, newGetters: ap.static.newGetters, missingOnScope: ap.dynamic && ap.dynamic.missingOnScope, byOwner: ap.dynamic && ap.dynamic.byOwner };
// 상태 이전 미리 보기
const GEN = path.join(WORK, 'docs', 'design', 'harness', 'module-split', 'gen-inline-hard.js');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'unstate-671-'));
const tryOne = (tree, n, tag) => { const d = path.join(tmp, tag + '-' + n); fs.mkdirSync(d); fs.copyFileSync(path.join(tree, 'index.html'), path.join(d, 'index.html'));
  const c = path.join(d, 'c.json'); fs.writeFileSync(c, JSON.stringify({ task: 'TASK-ES-671-MOCK', slot: 'HO', mode: 'unstate', cells: [{ file: 'js/core/app-state.js' }], unstate: { names: [n] } }), { encoding: 'utf8' });
  const r = node(WORK, [GEN, d, c], { MODULE_SPLIT_OUT: d });
  return r.status === 0 ? { moves: true, reason: null } : { moves: false, reason: (((r.stderr || '').split(/\r?\n/).find(l => /^Error: /.test(l)) || '').replace(/^Error: /, '')).slice(0, 160) }; };
m.unstatePreview = { what: '저장소 밖 사본에 생성기 unstate 를 이름 하나씩 돌려 본 것이다. 이 PR 은 상태 이전을 하지 않는다 — 풀렸는지만 본다.',
  names: Object.fromEntries(['sb', 'state'].map(n => [n, { base: tryOne(path.resolve(BASE), n, 'b'), work: tryOne(WORK, n, 'w') }])) };
m.unstatePreview.sbUnlocked = m.unstatePreview.names.sb.base.moves === false && m.unstatePreview.names.sb.work.moves === true;
try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) { /* 임시 폴더 정리 실패는 결과에 영향 없음 */ }
m.ok = m.ok === true && m.changed.productIsIndexPlusNewCell && m.changed.testsChanged.length === 0 && m.changed.vaultChanged.length === 0 && m.changed.generatorChanged.length === 0 && m.baseline.recordedEqualsMeasured && !!ap && ap.ok === true;
fs.writeFileSync(path.join(DIR, 'measurement.json'), JSON.stringify(m, null, 1) + '\n', { encoding: 'utf8' });
console.log(JSON.stringify({ ok: m.ok, changed: { product, tests: m.changed.testsChanged, vault: m.changed.vaultChanged, gen: m.changed.generatorChanged, maps: m.changed.generatedMapsChanged }, baseline: m.baseline, accessor: m.accessorProbe, unstate: m.unstatePreview.names }));
