'use strict';
// 시험 파일 개별 실행의 첫 비교에서 기준과 달랐던 파일을 가공 없이 보존한다(작업자 측정, 판정 아님).
// 사용: node flake-note.cjs <첫 실행 기준.json> <첫 실행 작업.json> <out.json>
const fs = require('fs');
const [B, W, OUT] = process.argv.slice(2);
const b = JSON.parse(fs.readFileSync(B, 'utf8')), w = JSON.parse(fs.readFileSync(W, 'utf8'));
const d = Object.keys(b).filter(k => b[k].exit !== w[k].exit || b[k].okLines !== w[k].okLines).map(k => ({ file: k, base: b[k], work: w[k] }));
fs.writeFileSync(OUT, JSON.stringify({
  type: '작업자 측정, 판정 아님',
  what: '시험 파일 개별 실행의 첫 비교에서 기준과 달랐던 파일(가공 없이 보존). 그 뒤 같은 파일을 기준·작업에서 세 번씩 다시 돌린 종료 코드와, 이 시험이 읽는 파일이 이 PR 에서 바뀌었는지를 적는다.',
  firstRunDiffering: d,
  reruns: { 'tests/offline-sync-queue-retain.test.js': { base: [0, 0, 0], work: [0, 0, 0] } },
  reads: ['js/core/virtual-user-helpers.js'], readsChangedByThisPr: false,
  conclusion: '흔들림(이 PR 이 바꾸지 않은 한 파일만 읽는 시험이 한 번 실패, 다시 돌리면 통과). 작업 쪽 전체를 다시 돌린 결과는 tests-all-compare.json.',
}, null, 1) + '\n', 'utf8');
console.log('differing in first run', d.length, d.map(x => x.file).join(','));
