'use strict';
// 인라인 3단계 Z4: tests/*.test.js 를 기준 트리·작업 트리에서 하나씩 돌려 종료 코드만 맞댄다(작업자 측정, 판정 아님).
// test-compare-inline-split-2.js 는 같은 실행 안에서 npm test 를 먼저 돌리는데, 그 뒤 작업 쪽 tests/offline-sync-queue-retain.test.js 가 두 번 종료 1 이었다
// (따로 돌리면 기준·작업 모두 종료 0 — 그 시험은 index.html 을 읽지 않는다). 그래서 종료 코드 비교만 npm test 없이 따로 낸다. 다른 파일의 출력 차이는 그 도구의 결과 파일을 본다.
// 사용: NODE_PATH=<node_modules> node tests-exit-compare-z4.js <기준 트리> <작업 트리> <out.json> [반복 수=1]
const { spawnSync } = require('child_process'); const fs = require('fs'), path = require('path');
const [BASE, WORK, OUT, REP] = process.argv.slice(2); const N = Number(REP) || 1;
const env = Object.assign({}, process.env, { NODE_PATH: process.env.NODE_PATH || 'C:/dev/ourgoal-app/node_modules' });
const list = d => fs.readdirSync(path.join(d, 'tests')).filter(f => f.endsWith('.test.js')).sort().map(f => 'tests/' + f);
const files = list(WORK); const baseFiles = list(BASE);
const run = (root, f) => spawnSync(process.execPath, [f], { cwd: root, env, encoding: 'utf8', timeout: 300000 }).status;
const res = {}; const exitDiff = [];
for (const f of files) {
  const b = [], w = [];
  for (let i = 0; i < N; i++) { b.push(run(BASE, f)); w.push(run(WORK, f)); }
  res[f] = { base: b, work: w };
  if (JSON.stringify(b) !== JSON.stringify(w)) exitDiff.push(f);
}
const out = { what: 'tests/*.test.js 종료 코드 — 기준 트리 대 작업 트리(npm test 없이, 파일마다 번갈아)', files: files.length, sameFileList: JSON.stringify(files) === JSON.stringify(baseFiles), repeat: N, exitDiff, exitCodesSame: exitDiff.length === 0 && JSON.stringify(files) === JSON.stringify(baseFiles), results: res };
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n');
console.log(JSON.stringify({ files: out.files, exitDiff, exitCodesSame: out.exitCodesSame }));
