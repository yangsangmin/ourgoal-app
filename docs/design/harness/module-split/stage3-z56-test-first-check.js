'use strict';
// #TASK-ES-524 시험지 선행 실측(작업자 보조, 판정 아님) — 인라인 3단계 구역 Z5+Z6(표준 T 묶음)
// 모의 이전 사본(git archive 로 푼 origin/main 에 inline-stage3-z56-pr1~6.json 을 생성기로 차례로 적용한 것)에서
// 시험지마다 ① 옛 시험지(origin/main 판) ② 새 시험지(이 작업 트리 판)를 돌려 종료 코드를 적고, 기준 사본(이전 전)에서도 새 시험지를 돌린다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node stage3-z56-test-first-check.js <기준 사본> <모의 이전 사본> <작업 트리> <out.json> <시험지...>
//   시험지가 scripts/smoke-test.js 이면 smoke 통과·실패 수도 적는다.
const fs = require('fs'), path = require('path'), cp = require('child_process');
const [BASE, MOCK, WORK, OUT, ...FILES] = process.argv.slice(2);
const env = Object.assign({}, process.env, { NODE_PATH: process.env.NODE_PATH || 'C:/dev/ourgoal-app/node_modules' });
function run(root, file, src) {
  const target = path.join(root, file);
  const keep = fs.readFileSync(target);
  fs.writeFileSync(target, src);
  try {
    const r = cp.spawnSync('node', [file], { cwd: root, env, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 300000 });
    const out = (r.stdout || '') + (r.stderr || '');
    const m = /(\d+)개 통과, (\d+)개 실패/.exec(out);
    return { code: r.status, smoke: m ? [+m[1], +m[2]] : undefined };
  } finally { fs.writeFileSync(target, keep); }
}
const rows = {};
for (const f of FILES) {
  const oldSrc = fs.readFileSync(path.join(BASE, f));
  const newSrc = fs.readFileSync(path.join(WORK, f));
  rows[f] = { mockOld: run(MOCK, f, oldSrc), mockNew: run(MOCK, f, newSrc), baseNew: run(BASE, f, newSrc), workNew: run(WORK, f, newSrc) };
  console.log(f, JSON.stringify(rows[f]));
}
const vals = Object.values(rows);
const report = {
  task: 'TASK-ES-524', what: '시험지 선행 — 모의 이전 사본에서 옛 시험지는 깨지고 새 시험지는 통과하는가, 기준 사본·작업 트리에서도 새 시험지가 통과하는가(작업자 측정, 판정 아님)',
  files: rows,
  mockOldFailing: vals.filter(r => r.mockOld.code !== 0).length,
  mockNewFailing: vals.filter(r => r.mockNew.code !== 0).length,
  baseNewFailing: vals.filter(r => r.baseNew.code !== 0).length,
  workNewFailing: vals.filter(r => r.workNew.code !== 0).length,
};
fs.writeFileSync(OUT, JSON.stringify(report, null, 1) + '\n', 'utf8');
console.log(JSON.stringify({ mockOldFailing: report.mockOldFailing, mockNewFailing: report.mockNewFailing, baseNewFailing: report.baseNewFailing, workNewFailing: report.workNewFailing }));
