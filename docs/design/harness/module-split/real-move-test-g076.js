'use strict';
// #TASK-ES-454 시험지 선행 확인(인라인 G076 「캘린더 날짜 일정 수정/관리 허브 모달」 세포 이동 #TASK-ES-448 의 선행):
//  ① 바꾼 시험지(schedule-notification-setting)를 (가) 기준 시험지·기준 제품 (나) 새 시험지·기준 제품 (다) 기준 시험지·이동 제품 (라) 새 시험지·이동 제품 에서 돌린다
//  ② tests/*.test.js 전부를 기준 제품(기준 시험지)과 이동 제품(새 시험지 덮어씀)에서 돌려 종료 코드가 다른 시험지를 모은다 — 다른 단독 index.html 읽기 시험이 또 깨지는지
// 이동 제품 = #TASK-ES-448 브랜치의 git archive 사본(모의가 아닌 실제 이동). 기준 제품 = 이 PR 기준 main 의 git archive 사본. 저장소 제품 코드는 바꾸지 않는다.
// 사용: NODE_PATH=... node real-move-test-g076.js <기준 사본> <이동 사본> <새 시험지가 있는 작업 트리> <out.json>
const { spawnSync } = require('child_process'); const fs = require('fs'), path = require('path');
const [BASE, MOVED, WORK, OUT] = process.argv.slice(2);
const CHANGED = ['tests/schedule-notification-setting.test.js'];
const run = (root, testSrcRoot, t) => {
  const dst = path.join(root, t), orig = fs.readFileSync(dst, 'utf8');
  fs.writeFileSync(dst, fs.readFileSync(path.join(testSrcRoot, t), 'utf8'));
  const r = spawnSync(process.execPath, [t], { cwd: root, encoding: 'utf8', env: process.env, timeout: 300000 });
  fs.writeFileSync(dst, orig);
  const lines = ((r.stdout || '') + (r.stderr || '')).split(/\r?\n/);
  return { code: r.status, outLines: lines.filter(l => l.trim()).length, firstError: (lines.find(l => /AssertionError|Error:/.test(l)) || '').trim().slice(0, 200) };
};
const rows = {};
for (const t of CHANGED) rows[t] = { baseTestBaseProduct: run(BASE, BASE, t), newTestBaseProduct: run(BASE, WORK, t), baseTestMoved: run(MOVED, BASE, t), newTestMoved: run(MOVED, WORK, t) };
const all = fs.readdirSync(path.join(BASE, 'tests')).filter(n => n.endsWith('.test.js')).sort().map(n => 'tests/' + n);
const exitDiffOnMoved = [];
for (const t of all) {
  const src = CHANGED.includes(t) ? WORK : MOVED;
  const a = run(BASE, BASE, t).code, b = run(MOVED, src, t).code;
  if (a !== b) exitDiffOnMoved.push({ test: t, base: a, moved: b });
}
const report = { task: 'TASK-ES-454', base: 'main 사본', moved: '#TASK-ES-448 이동 사본', tests: rows,
  newTestSameOnBaseProduct: CHANGED.every(t => rows[t].newTestBaseProduct.code === rows[t].baseTestBaseProduct.code && rows[t].newTestBaseProduct.outLines === rows[t].baseTestBaseProduct.outLines),
  baseTestBreaksOnMoved: CHANGED.filter(t => rows[t].baseTestMoved.code !== rows[t].baseTestBaseProduct.code),
  newTestSameOnMoved: CHANGED.every(t => rows[t].newTestMoved.code === rows[t].baseTestBaseProduct.code && rows[t].newTestMoved.outLines === rows[t].baseTestBaseProduct.outLines && rows[t].newTestMoved.firstError === rows[t].baseTestBaseProduct.firstError),
  testsRun: all.length, exitDiffOnMovedWithNewTests: exitDiffOnMoved };
fs.writeFileSync(OUT, JSON.stringify(report, null, 1) + '\n');
console.log(JSON.stringify({ same: report.newTestSameOnBaseProduct, breaks: report.baseTestBreaksOnMoved, fixed: report.newTestSameOnMoved, n: all.length, diff: exitDiffOnMoved }));
