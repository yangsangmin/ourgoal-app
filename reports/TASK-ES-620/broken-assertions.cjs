#!/usr/bin/env node
'use strict';
// #TASK-ES-620 조사 도구(작업자 측정, 판정 아님) — 「모의 철거 사본에서만 실패하는 단언」 표.
// run-asserts.cjs 를 같은 시험지로 두 트리(현재 main · 모의 철거 사본)에서 돌린 결과를 맞대어, 모의 철거 사본에서만 실패하는 단언 줄을 파일·줄·단언 글자·붙잡는 이름 단위로 적는다.
// 붙잡는 이름은 단언 줄과 그 앞뒤 두 줄의 글자에서 `window.이름 = 이름` 꼴을 찾아 읽는다(정규식 리터럴 안의 `window\.이름\s*=` 꼴도 본다).
// 사용: node reports/TASK-ES-620/broken-assertions.cjs <main 결과.json> <모의 철거 결과.json> <시험지를 읽을 트리> <out.json> [--pinned <pinned-names.json>]
const fs = require('fs'), path = require('path');
const A = JSON.parse(fs.readFileSync(path.resolve(process.argv[2]), 'utf8')), M = JSON.parse(fs.readFileSync(path.resolve(process.argv[3]), 'utf8'));
const TREE = path.resolve(process.argv[4]), OUT = path.resolve(process.argv[5]);
const pinnedArg = process.argv.indexOf('--pinned') >= 0 ? process.argv[process.argv.indexOf('--pinned') + 1] : null;
const key = f => f.file + ':' + f.line + ':' + f.message;
const inMain = new Set(A.failedAssertsUnique.map(key)), inMock = new Set(M.failedAssertsUnique.map(key));
const only = M.failedAssertsUnique.filter(f => !inMain.has(key(f)));
const cache = {};
const linesOf = f => (cache[f] = cache[f] || fs.readFileSync(path.join(TREE, f), 'utf8').split(/\r?\n/));
const STR = /(['"])(\s*window\.([A-Za-z_$][\w$]*)\s*=\s*([A-Za-z_$][\w$]*);?)\1/;
const RE = /\/[^/\n]*window\\?\.([A-Za-z_$][\w$]*)[^/\n]*=[^/\n]*\//;
const rows = only.map(f => {
  const L = linesOf(f.file);
  // 단언 줄 자신 → 다음 두 줄(여러 줄 단언) → 앞 두 줄(끝 지점을 계산하는 줄) 순서로 옛 배선 글자를 찾는다
  let hit = null;
  for (const i of [f.line, f.line + 1, f.line + 2, f.line - 1, f.line - 2]) {
    const t = L[i - 1] || '';
    const s = STR.exec(t), r = s ? null : RE.exec(t);
    if (s) { hit = { line: i, form: /\.indexOf\(/.test(t) ? '문자열(indexOf — 함수 잘라 읽기의 끝 지점)' : '문자열(includes)', name: s[3], from: s[4], legacyText: s[2] }; break; }
    if (r) { hit = { line: i, form: '정규식', name: r[1], from: null, legacyText: r[0] }; break; }
  }
  return { file: f.file, line: f.line, check: f.check, message: f.message, assertion: (L[f.line - 1] || '').trim().slice(0, 300),
    pinnedTextLine: hit ? hit.line : null, form: hit ? hit.form : '못 읽음', name: hit ? hit.name : null, from: hit ? hit.from : null, legacyText: hit ? hit.legacyText : null };
});
const count = (list, f) => list.reduce((a, x) => { const k = f(x); a[k] = (a[k] || 0) + 1; return a; }, {});
const out = { tool: 'reports/TASK-ES-620/broken-assertions.cjs', type: '작업자 측정, 판정 아님', measuredAt: new Date().toISOString(),
  inputs: { main: { tree: A.tree, failedAssertLines: A.failedAssertsUnique.length }, mock: { tree: M.tree, failedAssertLines: M.failedAssertsUnique.length } },
  summary: { brokenAssertLines: rows.length, onlyInMain: A.failedAssertsUnique.filter(f => !inMock.has(key(f))).length, byFile: count(rows, r => r.file), byForm: count(rows, r => r.form),
    names: [...new Set(rows.map(r => r.name))].sort(), nameCount: new Set(rows.map(r => r.name)).size, aliasNames: [...new Set(rows.filter(r => r.from && r.from !== r.name).map(r => r.name + ' = ' + r.from))].sort(),
    smokeChecks: new Set(rows.filter(r => r.file === 'scripts/smoke-test.js').map(r => r.check)).size, unread: rows.filter(r => !r.name).length },
  onlyInMain: A.failedAssertsUnique.filter(f => !inMock.has(key(f))).map(f => ({ file: f.file, line: f.line, message: f.message, note: '모의 철거 사본에서는 실패하지 않은 줄 — 배선 글자 때문일 수 없다(배선이 있는 쪽에서만 실패). 실행마다 갈리는 시험인지 따로 본다' })),
  broken: rows };
if (pinnedArg) {
  const P = JSON.parse(fs.readFileSync(path.resolve(pinnedArg), 'utf8'));
  const brokenNames = new Set(rows.map(r => r.name));
  out.pinnedScan = { tool: P.tool, pinnedCount: P.pinnedCount, pinnedButNotBroken: Object.keys(P.pinned).filter(n => !brokenNames.has(n)).sort().map(n => ({ name: n, hits: P.pinned[n] })), brokenButNotPinned: [...brokenNames].filter(n => n && !P.pinned[n]).sort() };
}
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', 'utf8');
console.log(JSON.stringify(out.summary));
if (out.pinnedScan) console.log('붙잡혔지만 깨지지 않은 이름:', out.pinnedScan.pinnedButNotBroken.map(x => x.name).join(' '), '· 깨졌는데 넓은 목록에 없던 이름:', out.pinnedScan.brokenButNotPinned.join(' ') || '없음');
