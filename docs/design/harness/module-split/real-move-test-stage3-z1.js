'use strict';
// #TASK-ES-518: 시험지 선행 실측(인라인 3단계 Z1 로그인·계정) — 시험지 여러 개를 기준 시험지·새 시험지 × 기준 제품(origin/main git archive)·실제 이동 제품(Z1 묶음을 생성기로 옮긴 사본)에서
// 돌려 종료 코드·출력 줄 수·첫 오류를 맞댄다(작업자 측정, 판정 아님). real-move-test-organ-482.js(#TASK-ES-489)를 시험지 여러 개로 넓힌 것이다.
// 사용: NODE_PATH=<node_modules> node real-move-test-stage3-z1.js <기준 트리> <이동 트리> <새 시험지가 있는 트리> <out.json> tests/a.test.js,tests/b.test.js
const { spawnSync } = require('child_process'); const fs = require('fs'); const path = require('path');
const [BASE, MOVED, NEWROOT, OUT, LIST] = process.argv.slice(2);
const tests = LIST.split(',').filter(Boolean);
const run = (root, T, src) => { const f = path.join(root, T); const keep = fs.readFileSync(f, 'utf8'); fs.writeFileSync(f, src); const r = spawnSync(process.execPath, [T], { cwd: root, encoding: 'utf8', env: process.env }); fs.writeFileSync(f, keep); const out = (r.stdout || '') + (r.stderr || ''); return { code: r.status, lines: out.split('\n').length, firstError: (out.match(/AssertionError[^\n]*|\[실패\][^\n]*/) || [null])[0] }; };
const same = (a, b) => a.code === b.code && a.lines === b.lines && a.firstError === b.firstError;
const out = { what: 'Z1 시험지 선행 — 기준 시험지/새 시험지 × 기준 제품(origin/main git archive)/이동 제품(Z1 묶음 7개를 gen-inline-hard.js 로 옮긴 사본)', tests: {}, baseTestBreaksOnMoved: [], newTestSameOnBaseProduct: true, newTestSameOnMoved: true };
for (const T of tests) {
  const oldSrc = fs.readFileSync(path.join(BASE, T), 'utf8'); const newSrc = fs.readFileSync(path.join(NEWROOT, T), 'utf8');
  const r = { oldOnBase: run(BASE, T, oldSrc), newOnBase: run(BASE, T, newSrc), oldOnMoved: run(MOVED, T, oldSrc), newOnMoved: run(MOVED, T, newSrc) };
  r.newTestSameOnBaseProduct = same(r.oldOnBase, r.newOnBase); r.newTestSameOnMoved = same(r.newOnMoved, r.oldOnBase);
  out.tests[T] = r;
  if (r.oldOnMoved.code !== 0) out.baseTestBreaksOnMoved.push(T);
  out.newTestSameOnBaseProduct = out.newTestSameOnBaseProduct && r.newTestSameOnBaseProduct;
  out.newTestSameOnMoved = out.newTestSameOnMoved && r.newTestSameOnMoved;
}
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', 'utf8'); console.log(JSON.stringify({ breaks: out.baseTestBreaksOnMoved, sameBase: out.newTestSameOnBaseProduct, sameMoved: out.newTestSameOnMoved }));
