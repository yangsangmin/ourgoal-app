#!/usr/bin/env node
'use strict';
// #TASK-ES-636 시험이 「상태 배선 글자」를 붙잡는 이름 찾기(작업자 측정 도구, 판정 아님). 시험은 고치지 않는다 — 그 이름을 이전 계획에서 빼기 위한 목록이다.
//   1) 실측: 전 대상 모의 이전 사본의 시험 결과(tests-mock-all.json)를 기준(tests-base.json)과 맞대 새로 깨진 검사(스크립트의 ✗ 줄 · 기준에서는 통과하던 시험 파일)를 뽑는다.
//   2) 그 검사가 든 시험 소스에서, 옮길 수 있는 이름 N 의 배선 글자(`N = …` · `N=…` · `get N(` · `set N(` · `var N`)가 있는 줄을 찾는다 → 그 이름을 제외 목록에 올린다.
//   3) 참고: 깨지지 않은 시험 소스까지 넓혀 같은 글자가 있는 이름도 따로 적는다(글자는 있지만 깨지지 않음 — 제외하지 않는다).
// 제외가 충분한지는 그 이름을 뺀 모의 이전 사본의 시험 결과(tests-mock.json)가 잰다.
// 사용: node reports/TASK-ES-636/pinned-state.cjs <저장소 루트> <mock-unstate-all.json> <tests-base.json> <tests-mock-all.json> <out.json>
const fs = require('fs'), path = require('path');
const [ROOT_ARG, ALL, TB, TM, OUT] = process.argv.slice(2);
const ROOT = path.resolve(ROOT_ARG);
const rj = f => JSON.parse(fs.readFileSync(path.resolve(f), 'utf8'));
const all = rj(ALL), tb = rj(TB), tm = rj(TM);
const names = all.movable;
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const walk = d => fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]) : [];
const testFiles = walk(path.join(ROOT, 'tests')).filter(f => /\.(js|cjs|mjs)$/.test(f)).concat(fs.readdirSync(path.join(ROOT, 'scripts')).filter(f => /^(smoke-test|verify-.*|test-.*)\.js$/.test(f)).map(f => path.join(ROOT, 'scripts', f)))
  .map(f => path.relative(ROOT, f).replace(/\\/g, '/'));
let vj = {}; try { vj = JSON.parse(fs.readFileSync(path.join(ROOT, 'court', 'vault.json'), 'utf8')); } catch (_) { vj = {}; }
const glob = (pat, f) => pat === f || (pat.endsWith('/**') && f.startsWith(pat.slice(0, -2))) || (pat.includes('*') && new RegExp('^' + pat.split('*').map(x => x.replace(/[.+^${}()|[\]\\]/g, '\\$&')).join('[^/]*') + '$').test(f));
const APPENDIX3 = ['scripts/essence-gate.js', 'scripts/verify-integrity-gate.js']; // 헌법 별표 3(동결 금고 목록)에 이름이 적힌 스크립트 — court/vault.json 과 다르면 넓은 쪽을 동결로 본다
const classOf = f => (vj.frozen || []).some(x => glob(x, f)) ? 'court/vault.json frozen' : (vj.baseTests || []).some(x => glob(x, f)) ? 'court/vault.json baseTests(기준 시험지)' : '그 밖의 시험 파일';
const inVault = f => (vj.frozen || []).some(x => glob(x, f)) || APPENDIX3.includes(f); // 금고(넓은 쪽)
// 새로 깨진 검사
const newFails = [];
for (const s of tm.scripts) { const b = tb.scripts.find(x => x.script === s.script) || { fails: [], exit: null }; const had = new Set(b.fails.map(x => x.check)); for (const f of s.fails) if (!had.has(f.check)) newFails.push({ file: s.script, check: f.check, detail: f.detail, exit: [b.exit, s.exit] }); }
const baseFailed = new Set(tb.testFiles.filter(x => x.exit !== 0).map(x => x.file));
for (const t of tm.testFiles) if (t.exit !== 0 && !baseFailed.has(t.file)) newFails.push({ file: t.file, check: '(시험 파일 종료 코드 ' + t.exit + ')', detail: t.tail, exit: [0, t.exit] });
const failingFiles = [...new Set(newFails.map(x => x.file))];
const sites = (file, N) => { // 그 파일에서 이름 N 의 배선 글자가 있는 줄
  const res = [new RegExp('(^|[^A-Za-z0-9_$.])' + esc(N) + '\\s*=(?!=)'), new RegExp('get\\s+' + esc(N) + '\\\\?\\('), new RegExp('set\\s+' + esc(N) + '\\\\?\\('), new RegExp('var(\\s+|\\\\s[+*])' + esc(N) + '(?![A-Za-z0-9_$])')];
  const out = []; const L = fs.readFileSync(path.join(ROOT, file), 'utf8').split(/\r?\n/);
  L.forEach((l, i) => { if (res.some(r => r.test(l))) out.push({ line: i + 1, text: l.trim().slice(0, 220) }); });
  return out;
};
const pinned = {}, textOnly = {};
for (const N of names) {
  for (const f of testFiles) {
    const s = sites(f, N); if (!s.length) continue;
    const row = { file: f, vault: inVault(f), class: classOf(f) + (APPENDIX3.includes(f) ? ' · 헌법 별표 3 금고 목록' : ''), sites: s };
    if (failingFiles.includes(f)) (pinned[N] = pinned[N] || []).push(row); else (textOnly[N] = textOnly[N] || []).push(row);
  }
}
const out = { tool: 'reports/TASK-ES-636/pinned-state.cjs', type: '작업자 측정, 판정 아님', measuredAt: new Date().toISOString(), scannedTestSources: testFiles.length, movableNames: names.length,
  newFailingChecks: newFails, failingFiles: failingFiles.map(f => ({ file: f, vault: inVault(f), class: classOf(f) + (APPENDIX3.includes(f) ? ' · 헌법 별표 3 금고 목록' : '') })),
  pinnedCount: Object.keys(pinned).length, pinned, textOnlyCount: Object.keys(textOnly).length, textOnly,
  unexplainedFailingFiles: failingFiles.filter(f => !Object.values(pinned).some(rows => rows.some(r => r.file === f))),
  note: 'pinned = 새로 깨진 검사가 든 시험 소스에 배선 글자가 있는 이름(이전 계획에서 뺀다). textOnly = 깨지지 않은 시험 소스에 같은 글자가 있는 이름(빼지 않는다 — 실제로 깨지지 않았다).' };
fs.writeFileSync(path.resolve(OUT), JSON.stringify(out, null, 1) + '\n', 'utf8');
fs.writeFileSync(path.resolve(OUT).replace(/\.json$/, '.exclude.json'), JSON.stringify(Object.keys(pinned).sort().reduce((a, n) => { a[n] = true; return a; }, {}), null, 1) + '\n', 'utf8');
console.log(JSON.stringify({ newFailingChecks: newFails.length, failingFiles, pinned: Object.keys(pinned), textOnly: Object.keys(textOnly), unexplained: out.unexplainedFailingFiles }));
