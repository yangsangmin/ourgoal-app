'use strict';
// #TASK-ES-447 시험지 선행 확인: 시험지 4개를 (가) 기준 시험지·기준 제품, (나) 새 시험지·기준 제품, (다) 기준 시험지·모의 이전 제품, (라) 새 시험지·모의 이전 제품 에서 돌려 종료 코드와 통과 수를 적는다.
// 모의 이전 제품 = 기준 사본에 gen-inline-p2.js + mock-move-inline-p2.config.js 를 돌린 것(저장소 제품 코드는 바꾸지 않는다).
// 사용: NODE_PATH=... node mock-move-inline-p2.js <작업 트리> <모의 이전 트리> <out.json>
const { spawnSync } = require('child_process'); const fs = require('fs'), path = require('path');
const [WORK, MOCK, OUT] = process.argv.slice(2);
const TESTS = ['tests/stopwatch-lap-inputs.test.js', 'tests/stopwatch-table-hint.test.js', 'tests/guest-null-client-es377.test.js', 'tests/desktop-widget-suite.test.js'];
const run = (root, testSrcRoot, t) => {
  // 시험지 파일을 잠시 그 트리에 덮어 쓴 뒤 돌리고 되돌린다(helpers 포함)
  const dst = path.join(root, t), orig = fs.readFileSync(dst, 'utf8');
  fs.writeFileSync(dst, fs.readFileSync(path.join(testSrcRoot, t), 'utf8'));
  const r = spawnSync(process.execPath, [t], { cwd: root, encoding: 'utf8', env: process.env });
  fs.writeFileSync(dst, orig);
  const out = (r.stdout || '') + (r.stderr || '');
  const lines = out.split(/\r?\n/);
  return { code: r.status, passedLines: lines.filter(l => /^\s*(ok\b|\d+\.\s.*(통과|완료))/.test(l)).length,
    firstError: (lines.find(l => /AssertionError|Error:|\[TEST ERROR\]/.test(l)) || '').trim().slice(0, 200) };
};
const BASE_TESTS = path.join(MOCK, '__base_tests'); fs.mkdirSync(path.join(BASE_TESTS, 'tests', 'helpers'), { recursive: true });
for (const t of TESTS) fs.copyFileSync(path.join(MOCK, t), path.join(BASE_TESTS, t));
const rows = {};
for (const t of TESTS) rows[t] = { baseTestBaseProduct: run(WORK, BASE_TESTS, t), newTestBaseProduct: run(WORK, WORK, t), baseTestMockMoved: run(MOCK, BASE_TESTS, t), newTestMockMoved: run(MOCK, WORK, t) };
const report = { task: 'TASK-ES-447', tests: rows,
  newTestsSameOnBaseProduct: TESTS.every(t => rows[t].newTestBaseProduct.code === rows[t].baseTestBaseProduct.code),
  baseTestsBreakOnMockMoved: TESTS.filter(t => rows[t].baseTestMockMoved.code !== rows[t].baseTestBaseProduct.code),
  newTestsSameOnMockMoved: TESTS.every(t => rows[t].newTestMockMoved.code === rows[t].baseTestBaseProduct.code && rows[t].newTestMockMoved.passedLines === rows[t].baseTestBaseProduct.passedLines && rows[t].newTestMockMoved.firstError === rows[t].baseTestBaseProduct.firstError) };
fs.writeFileSync(OUT, JSON.stringify(report, null, 1));
console.log(JSON.stringify({ same: report.newTestsSameOnBaseProduct, breaks: report.baseTestsBreakOnMockMoved, fixed: report.newTestsSameOnMockMoved }));
for (const t of TESTS) console.log(t, JSON.stringify(Object.fromEntries(Object.entries(rows[t]).map(([k, v]) => [k, v.code]))));
