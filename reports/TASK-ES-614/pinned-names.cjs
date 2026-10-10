#!/usr/bin/env node
'use strict';
// B3a: 시험이 「배선 글자」를 단언하는 이름 찾기(작업자 측정 도구, 판정 아님). 시험은 고치지 않는다 — 그 이름을 철거 대상에서 빼기 위한 목록이다.
// 등록된 이름 N 마다, npm test 경로의 시험 소스(scripts/smoke-test.js · scripts/verify-*.js · scripts/test-*.js · tests/**/*.js)에 아래 글자가 있는지 본다(정규식 소스의 `\.`·`\s*` 꼴 포함):
//   window: `window.N` 뒤에 `=` 가 오는 꼴(`window.N = …` · `window\.N\s*=` …)      — window 대입 줄을 지우면 깨질 수 있다
//   getter: `get N(`                                                              — 통로 getter 줄을 지우면 깨질 수 있다
//   import: `var N = _` · `N = _xxxKit.N`                                          — 가져오기 줄을 지우면 깨질 수 있다
// 글자가 있다고 반드시 깨지는 것은 아니다(넓게 잡는다 — 덜 지우는 쪽이 안전하다). 실제로 깨지는지는 모의 철거 사본의 npm test 가 잰다.
// 사용: node reports/TASK-ES-614/pinned-names.cjs <저장소 루트> <등록 계획.json> <out.json> [--extra <names.json>]
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(process.argv[2]), PLAN = JSON.parse(fs.readFileSync(path.resolve(process.argv[3]), 'utf8')), OUT = path.resolve(process.argv[4]);
const extraArg = process.argv.indexOf('--extra') >= 0 ? process.argv[process.argv.indexOf('--extra') + 1] : null;
const walk = d => fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]) : [];
const files = walk(path.join(ROOT, 'tests')).filter(f => /\.(js|cjs|mjs)$/.test(f))
  .concat(fs.readdirSync(path.join(ROOT, 'scripts')).filter(f => /^(smoke-test|verify-.*|test-.*)\.js$/.test(f)).map(f => path.join(ROOT, 'scripts', f)));
const src = files.map(f => ({ file: path.relative(ROOT, f).replace(/\\/g, '/'), text: fs.readFileSync(f, 'utf8') }));
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const pinned = {};
for (const r of PLAN.registered) {
  const N = esc(r.name);
  const res = {
    window: new RegExp('window\\\\?\\.' + N + '(?![A-Za-z0-9_$])[^\\n]{0,24}?=(?!=)'),
    getter: new RegExp('get\\s+' + N + '\\\\?\\('),
    import: new RegExp('(var\\s+' + N + '\\s*=\\s*_|' + N + '\\s*=\\s*_\\w+Kit\\\\?\\.' + N + '(?![A-Za-z0-9_$]))'),
  };
  for (const s of src) for (const k of Object.keys(res)) {
    const m = res[k].exec(s.text);
    if (m) (pinned[r.name] = pinned[r.name] || []).push({ file: s.file, kind: k, text: m[0].slice(0, 80) });
  }
}
if (extraArg) { const ex = JSON.parse(fs.readFileSync(path.resolve(extraArg), 'utf8')); for (const n of Object.keys(ex)) (pinned[n] = pinned[n] || []).push({ file: ex[n].file || null, kind: 'measured', text: ex[n].why || String(ex[n]) }); }
const out = { tool: 'reports/TASK-ES-614/pinned-names.cjs', type: '작업자 측정, 판정 아님', measuredAt: new Date().toISOString(), scannedFiles: src.length, registered: PLAN.registered.length,
  pinnedCount: Object.keys(pinned).length, byKind: ['window', 'getter', 'import', 'measured'].reduce((a, k) => { a[k] = Object.keys(pinned).filter(n => pinned[n].some(x => x.kind === k)).length; return a; }, {}),
  byFile: Object.entries(Object.values(pinned).flat().reduce((a, x) => { a[x.file] = (a[x.file] || 0) + 1; return a; }, {})).sort((a, b) => b[1] - a[1]).map(([file, hits]) => ({ file, hits })),
  pinned };
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', 'utf8');
// mock-unwire.cjs --exclude 입력(이름 → true)
fs.writeFileSync(OUT.replace(/\.json$/, '.exclude.json'), JSON.stringify(Object.keys(pinned).sort().reduce((a, n) => { a[n] = true; return a; }, {}), null, 1) + '\n', 'utf8');
console.log('시험 소스', src.length, '· 배선 글자가 걸린 이름', out.pinnedCount, JSON.stringify(out.byKind));
out.byFile.slice(0, 12).forEach(x => console.log('  ', x.hits, x.file));
