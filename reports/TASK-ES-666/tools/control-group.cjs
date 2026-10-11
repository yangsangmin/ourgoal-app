#!/usr/bin/env node
'use strict';
// #TASK-ES-666 대조군(작업자 측정, 판정 아님) — 넓힌 단언·규칙이 가짜로 통과하지 않는지를 잰다.
// 네 PR 을 얹고 흉내의 한계를 걷어 낸 모의본 (나)+등록 트리(저장소 밖)에서, 「옮겨 간 자리」의 대상을 하나씩 깨뜨리고
// 그 대상을 붙잡는 시험지만 「던지지 않는 단언」으로 다시 돌려, 깨뜨리기 전에는 실패하지 않던 줄 가운데 새로 실패한 줄을 적는다.
// 변형마다 파일을 고친 뒤 반드시 원래 글자로 되돌린다(끝나면 트리는 처음과 같다 — 마지막에 git 상태로 확인한다).
// 사용: NODE_PATH=… node control-group.cjs <트리> <out.json>
const fs = require('fs'), path = require('path'), cp = require('child_process'), os = require('os');
const TREE = path.resolve(process.argv[2]), OUT = path.resolve(process.argv[3]);
const PRELOAD = path.join(__dirname, '..', '..', 'TASK-ES-620', 'soft-assert-preload.cjs');
const NL = String.fromCharCode(10);
const P = rel => path.join(TREE, rel);
const read = rel => fs.readFileSync(P(rel), 'utf8');
const write = (rel, text) => fs.writeFileSync(P(rel), text, { encoding: 'utf8' });

function failing(entries) {
  const rows = [];
  for (const entry of entries) {
    const rec = path.join(os.tmpdir(), 'es666-ctl-' + process.pid + '-' + Math.random().toString(36).slice(2) + '.jsonl');
    const env = Object.assign({}, process.env, { ES620_SOFT_OUT: rec, ES620_SOFT_ROOT: TREE, NODE_OPTIONS: ((process.env.NODE_OPTIONS || '') + ' --require ' + JSON.stringify(PRELOAD.replace(/\\/g, '/'))).trim() });
    cp.spawnSync(process.execPath, [entry], { cwd: TREE, encoding: 'utf8', env, maxBuffer: 512 * 1024 * 1024, timeout: 600000 });
    let lines = [];
    try { lines = fs.readFileSync(rec, 'utf8').split(NL).filter(Boolean).map(l => JSON.parse(l)); } catch (e) { /* 기록 없음 = 실패한 단언 없음 */ }
    try { fs.unlinkSync(rec); } catch (e) { /* 무시 */ }
    for (const x of lines) if (x.kind === 'assert' && x.at) rows.push(x.at.file + ':' + x.at.line);
  }
  return [...new Set(rows)].sort();
}
// 단언 줄 번호는 글자로 찾는다(줄 번호를 손으로 적지 않는다)
function lineOf(rel, needle) {
  const L = read(rel).split(/\r?\n/); const hits = [];
  L.forEach((l, i) => { if (l.includes(needle)) hits.push(i + 1); });
  if (hits.length !== 1) throw new Error('단언 줄을 한 곳으로 찾지 못했다(' + hits.length + '곳): ' + rel + ' :: ' + needle);
  return rel + ':' + hits[0];
}
function replaceOnce(rel, a, b) { const s = read(rel); const n = s.split(a).length - 1; if (n !== 1) throw new Error('바꿀 글자가 꼭 한 번 있어야 한다(' + n + '회): ' + rel + ' :: ' + a.slice(0, 60)); return s.replace(a, () => b); }
function dropLineWith(rel, needle) { const s = read(rel), eol = s.includes('\r\n') ? '\r\n' : NL; const L = s.split(eol); const idx = L.map((l, i) => (l.includes(needle) ? i : -1)).filter(i => i >= 0); if (idx.length !== 1) throw new Error('지울 줄이 꼭 한 줄이어야 한다(' + idx.length + '): ' + rel + ' :: ' + needle); L.splice(idx[0], 1); return L.join(eol); }
function dropTag(src) { return replaceOnce('index.html', '<script src="' + src + '"></script>', ''); }
const bundle = require(P('tests/helpers/inline-bundle.js'));
const bundleFiles = () => ['index.html'].concat(bundle.inlineCellFiles().map(f => path.relative(TREE, f).replace(/\\/g, '/')));
// 합본이 읽는 파일 전부에서 그 글자를 지운다: { 파일: 새 글자 }
function eraseEverywhere(texts) { const out = {}; for (const rel of bundleFiles()) { const s = read(rel); let t = s; for (const x of texts) t = t.split(x).join('/* 대조군이 지움 */'); if (t !== s) out[rel] = t; } return out; }
const occurrences = texts => { const o = {}; for (const x of texts) o[x] = bundleFiles().filter(rel => read(rel).includes(x)).length; return o; };

const A_AVATAR = lineOf('tests/avatar-10slots-growth.test.js', "textOrFunctionDefined(indexHtml, 'filterHarmfulWords', 'filterHarmfulWords')");
const A_SMOKE = lineOf('scripts/smoke-test.js', "MOVED.textOrFunctionStartsWith(indexHtml, '(#TASK-ES-315, 64: 구형 창 영구 제거 및 무해화)'");
const A_LEGACY = lineOf('tests/goal-template-legacy-cleanup.test.js', "textOrFunctionStartsWith(indexHtml, '(#TASK-ES-315, 64: 구형 창 영구 제거 및 무해화)'");
const A_GATE = lineOf('scripts/verify-integrity-gate.js', "textOrStateDefined(indexHtml, '_promptEncyclopediaOpen = false;'), '");
const A_GCAL = lineOf('tests/gcal-login-reconnect-fix.test.js', "windowExposed(indexHtml, 'window.saveGoogleToken = saveGoogleToken;')");
const A_GOALS_ONLY = lineOf('tests/goals-only-view.test.js', 'withInlineCells(indexHtml).includes("renderGoalsScreen();")');
const A_GOALS_SYNC = lineOf('tests/goals-schedule-sync.test.js', "withInlineCells(indexHtml).includes('renderGoalsScreen();')");
const A_TRIO = lineOf('tests/trio-es143-es145.test.js', "'관심 카테고리 칩 선택 토글이 안정적으로 배선되어야 함'");
const A_SHIP_GUARD = lineOf('scripts/test-shipyard-modular.js', '} must pass (exit ${r.status})'); // runNode(…) 의 단언 줄 — 이 줄이 scripts/module-guard.js 의 종료 코드를 본다
const A_GUARD_TEST = lineOf('tests/module-guard.test.js', "assert.strictEqual(r.status, 0, '가드가 통과해야 한다:");
const A_ES507_NOW = lineOf('tests/cross-tab-inline-owned-es507.test.js', "assert.strictEqual(metrics.crossTabRefs(path.join(__dirname, '..')).length, 0);");
const A_ES502_NOW = lineOf('tests/cross-tab-guarded-init-es502.test.js', "assert.strictEqual(metrics.crossTabRefs(path.join(__dirname, '..')).length, 0);");
const A_GUARD_TEST_OUT = lineOf('tests/module-guard.test.js', "assert.ok(/모듈 가드 통과/.test(r.stdout));");
const A_NEWMOD = lineOf('tests/new-module.test.js', '새 세포를 더해도 모듈 가드 통과');

const GUARD_ENTRIES = ['scripts/test-shipyard-modular.js', 'tests/cross-tab-inline-owned-es507.test.js', 'tests/cross-tab-guarded-init-es502.test.js', 'tests/module-guard.test.js', 'tests/new-module.test.js'];
const MOCK_CORE = 'js/core/zz-mock-boot-rest.js', AVATAR = 'js/tabs/settings/avatar-levelup-modal.js', LEGACY = 'js/creator-templates-legacy.js';
const DEF = "window.OurgoalAppState.defineVar('_promptEncyclopediaOpen', false);", FIRST = "if(!window.__FORCE_LEGACY_TEMPLATES_CARD) return '';";
const variants = [
  { id: 'F1', pr: 666, what: '세포 ' + AVATAR + ' 의 함수 선언 이름을 filterHarmfulWords → filterHarmfulWordsGone 으로 바꿈(그 이름의 함수 선언이 사라짐)', entries: ['tests/avatar-10slots-growth.test.js'], expect: [A_AVATAR],
    edits: () => ({ [AVATAR]: replaceOnce(AVATAR, 'function filterHarmfulWords(', 'function filterHarmfulWordsGone(') }) },
  { id: 'F2', pr: 666, what: 'index.html 에서 ' + AVATAR + ' 의 <script src> 태그를 뺌(읽지 않는 파일은 세포가 아니다)', entries: ['tests/avatar-10slots-growth.test.js'], expect: [A_AVATAR],
    edits: () => ({ 'index.html': dropTag(AVATAR) }) },
  { id: 'F3', pr: 666, what: '세포 ' + AVATAR + ' 의 함수 선언 이름을 바꾸고 옛 이름은 주석 안에만 남김(주석 안의 글자는 선언이 아니다)', entries: ['tests/avatar-10slots-growth.test.js'], expect: [A_AVATAR],
    edits: () => ({ [AVATAR]: replaceOnce(AVATAR, 'function filterHarmfulWords(', 'function filterHarmfulWordsGone(/* function filterHarmfulWords( */') }) },
  { id: 'S1', pr: 666, what: LEGACY + ' 의 templatesHtml 첫 문(무해화 반환문)을 다른 문으로 바꿈', entries: ['scripts/smoke-test.js', 'tests/goal-template-legacy-cleanup.test.js'], expect: [A_SMOKE, A_LEGACY],
    edits: () => ({ [LEGACY]: replaceOnce(LEGACY, FIRST, 'var controlGroupChangedThis = 1;') }) },
  { id: 'S2', pr: 666, what: LEGACY + ' 의 templatesHtml 첫 문 앞에 다른 문을 끼움(무해화 반환문이 둘째 문이 됨)', entries: ['scripts/smoke-test.js', 'tests/goal-template-legacy-cleanup.test.js'], expect: [A_SMOKE, A_LEGACY],
    edits: () => ({ [LEGACY]: replaceOnce(LEGACY, FIRST, 'var controlGroupRanFirst = 1; ' + FIRST) }) },
  { id: 'G1', pr: 669, what: "구역 세포(모의)에서 상태 기관 호출 줄 defineVar('_promptEncyclopediaOpen', false) 를 지움", entries: ['scripts/verify-integrity-gate.js'], expect: [A_GATE],
    edits: () => ({ [MOCK_CORE]: dropLineWith(MOCK_CORE, DEF) }) },
  { id: 'G2', pr: 669, what: '상태 기관 호출의 초기값을 false → true 로 바꿈', entries: ['scripts/verify-integrity-gate.js'], expect: [A_GATE],
    edits: () => ({ [MOCK_CORE]: replaceOnce(MOCK_CORE, DEF, DEF.replace('false', 'true')) }) },
  { id: 'G3', pr: 669, what: '상태 기관 호출의 이름을 다른 이름으로 바꿈', entries: ['scripts/verify-integrity-gate.js'], expect: [A_GATE],
    edits: () => ({ [MOCK_CORE]: replaceOnce(MOCK_CORE, DEF, DEF.replace('_promptEncyclopediaOpen', '_promptEncyclopediaOpenGone')) }) },
  { id: 'G4', pr: 669, what: '호출을 주석으로 바꿈(주석 안의 호출 글자는 상태 선언이 아니다)', entries: ['scripts/verify-integrity-gate.js'], expect: [A_GATE],
    edits: () => ({ [MOCK_CORE]: replaceOnce(MOCK_CORE, DEF, '/* ' + DEF + ' */') }) },
  { id: 'G5', pr: 669, what: 'index.html 에서 상태 기관(js/core/app-state.js)의 <script src> 태그를 뺌(기관을 읽지 않으면 호출은 값을 만들지 못한다)', entries: ['scripts/verify-integrity-gate.js'], expect: [A_GATE],
    edits: () => ({ 'index.html': dropTag('js/core/app-state.js') }) },
  { id: 'R1', pr: 666, what: '세포 js/core/gcal-token-save.js 의 등록 블록 window 목록에서 saveGoogleToken 을 뺌(등록을 되돌림)', entries: ['tests/gcal-login-reconnect-fix.test.js'], expect: [A_GCAL],
    edits: () => { const rel = 'js/core/gcal-token-save.js', s = read(rel), k = "'saveGoogleToken'"; const i = s.lastIndexOf(k); if (i < 0) throw new Error('등록 목록의 이름을 찾지 못했다'); return { [rel]: s.slice(0, i) + "'saveGoogleTokenGone'" + s.slice(i + k.length) }; } },
  { id: 'B1', pr: 666, what: '합본이 읽는 파일 전부(index.html + 인라인에서 옮겨 간 세포)에서 글자 renderGoalsScreen(); 을 지움', entries: ['tests/goals-only-view.test.js', 'tests/goals-schedule-sync.test.js'], expect: [A_GOALS_ONLY, A_GOALS_SYNC], texts: ['renderGoalsScreen();'],
    edits: () => eraseEverywhere(['renderGoalsScreen();']) },
  { id: 'B2', pr: 666, what: "합본이 읽는 파일 전부에서 글자 b.classList.add('active') · b.classList.remove('active') 를 지움", entries: ['tests/trio-es143-es145.test.js'], expect: [A_TRIO], texts: ["b.classList.add('active')", "b.classList.remove('active')"],
    edits: () => eraseEverywhere(["b.classList.add('active')", "b.classList.remove('active')"]) },
  { id: 'B3', pr: 666, what: '옮겨 간 함수의 세포(모의 탭 세포)에서만 글자 renderGoalsScreen(); 을 지움 — 다른 세포에도 그 글자가 있으면 단언은 참으로 남는다(기대: 새로 실패 0)', entries: ['tests/goals-only-view.test.js', 'tests/goals-schedule-sync.test.js'], expect: [], texts: ['renderGoalsScreen();'],
    edits: () => { const out = {}; for (const rel of fs.readdirSync(P('js/tabs/records')).filter(n => n.indexOf('zz-mock-moved-functions') === 0).map(n => 'js/tabs/records/' + n)) { const s0 = read(rel), s1 = s0.split('renderGoalsScreen();').join('/* 대조군이 지움 */'); if (s1 !== s0) out[rel] = s1; } if (!Object.keys(out).length) throw new Error('모의 탭 세포에 그 글자가 없다'); return out; } },
  { id: 'M1', pr: 667, what: '구역 세포(모의)에서 기관이 window 에 다는 줄 window.SHARED_GROUPS_LOADED = false 를 지움(기관이 주인이 아니게 됨 → ⑤ 가 다시 1)', entries: GUARD_ENTRIES, expect: [A_SHIP_GUARD, A_ES507_NOW, A_ES502_NOW, A_NEWMOD, A_GUARD_TEST, A_GUARD_TEST_OUT],
    edits: () => ({ [MOCK_CORE]: dropLineWith(MOCK_CORE, 'window.SHARED_GROUPS_LOADED = false;') }) },
  { id: 'M2', pr: 667, what: '그 줄을 방어 초기화 꼴(if(!window.X) window.X = false)로 바꿈 — 없으면 채우기는 주인이 아니다(⑤ 가 다시 1)', entries: GUARD_ENTRIES, expect: [A_SHIP_GUARD, A_ES507_NOW, A_ES502_NOW, A_NEWMOD, A_GUARD_TEST, A_GUARD_TEST_OUT],
    edits: () => ({ [MOCK_CORE]: replaceOnce(MOCK_CORE, "if(typeof window !== 'undefined'){ window.SHARED_GROUPS_LOADED = false; }", 'if(!window.SHARED_GROUPS_LOADED) window.SHARED_GROUPS_LOADED = false;') }) },
  { id: 'M3', pr: 667, what: '그 줄을 js/core 밖의 옛 파일(js/zz-control-legacy.js)로 옮김 — 기관이 아닌 파일이 다는 이름은 주인이 아니다(⑤ 가 다시 1)', entries: GUARD_ENTRIES, expect: [A_SHIP_GUARD, A_ES507_NOW, A_ES502_NOW, A_NEWMOD, A_GUARD_TEST, A_GUARD_TEST_OUT],
    edits: () => ({ [MOCK_CORE]: dropLineWith(MOCK_CORE, 'window.SHARED_GROUPS_LOADED = false;'), 'js/zz-control-legacy.js': "(function(){ if(typeof window !== 'undefined'){ window.SHARED_GROUPS_LOADED = false; } })();" + NL }) },
];

const baselineCache = new Map();
const out = { tool: 'reports/TASK-ES-666/tools/control-group.cjs', type: '작업자 측정, 판정 아님', tree: TREE, treeNote: '네 PR 을 얹고 흉내의 한계(신고서·800줄)를 걷어 낸 모의본 (나)+등록', variants: [] };
for (const v of variants) {
  const key = v.entries.join('|');
  if (!baselineCache.has(key)) baselineCache.set(key, failing(v.entries));
  const before = baselineCache.get(key);
  const occ = v.texts ? occurrences(v.texts) : null;
  const edits = v.edits();
  const saved = {};
  let after;
  try {
    for (const rel of Object.keys(edits)) { saved[rel] = fs.existsSync(P(rel)) ? read(rel) : null; write(rel, edits[rel]); }
    after = failing(v.entries);
  } finally {
    for (const rel of Object.keys(saved)) { if (saved[rel] === null) fs.unlinkSync(P(rel)); else write(rel, saved[rel]); }
  }
  const newly = after.filter(x => !before.includes(x));
  const expectedAllFailed = v.expect.every(x => newly.includes(x));
  const extra = newly.filter(x => !v.expect.includes(x));
  const asExpected = v.expect.length ? expectedAllFailed : newly.length === 0;
  out.variants.push({ id: v.id, pr: v.pr, what: v.what, entries: v.entries, filesTouched: Object.keys(edits).length, textOccurrencesInBundleFiles: occ, failingBefore: before.length, newlyFailing: newly, expected: v.expect, expectedAllFailed, extraNewlyFailing: extra, asExpected });
  console.log(v.id + ' (#' + v.pr + ') 새로 실패 ' + newly.length + '줄 · 기대 ' + v.expect.length + '줄 · 기대대로 ' + asExpected + (extra.length ? ' · 기대 밖 ' + extra.join(' ') : ''));
}
out.summary = { variants: out.variants.length, allAsExpected: out.variants.every(v => v.asExpected), byPr: [666, 667, 669].map(pr => ({ pr, variants: out.variants.filter(v => v.pr === pr).length, asExpected: out.variants.filter(v => v.pr === pr && v.asExpected).length })), extraLines: out.variants.reduce((n, v) => n + v.extraNewlyFailing.length, 0) };
const st = cp.spawnSync('git', ['status', '--porcelain'], { cwd: TREE, encoding: 'utf8' }).stdout.split(NL).filter(l => l && !/^[MADR] {2}/.test(l));
out.treeRestored = { unstagedOrUntrackedAfter: st };
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + NL, { encoding: 'utf8' });
console.log('대조군 ' + out.summary.variants + '개 · 전부 기대대로 ' + out.summary.allAsExpected + ' · 끝난 뒤 트리에 남은 변경 ' + st.length + '건');
