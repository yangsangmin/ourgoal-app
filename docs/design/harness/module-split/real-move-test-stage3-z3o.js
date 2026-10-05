// #TASK-ES-527: 시험지 선행 실측 — 시험지마다 기준 시험지·새 시험지를 기준 제품(origin/main git archive)과 실제 이동 제품(Z3·기관 설정 inline-stage3-z3.json·inline-stage3-organ.json 을 생성기로 돌린 사본)에서 돌려 종료 코드·출력 줄 수·첫 오류를 맞댄다(판정 아님).
// real-move-test-organ-482.js(#TASK-ES-489)와 같은 4칸 측정을 시험지 여러 개로 넓혔다.
// 사용: node real-move-test-stage3-z3o.js <기준 트리> <이동 트리> <새 시험지가 있는 트리> <out.json> <tests/a.test.js> [tests/b.test.js ...]
const { spawnSync } = require('child_process'); const fs = require('fs'); const path = require('path');
const [BASE, MOVED, NEWROOT, OUT, ...TESTS] = process.argv.slice(2);
const run = (root, T, src) => { const f = path.join(root, T); const keep = fs.readFileSync(f, 'utf8'); fs.writeFileSync(f, src); const r = spawnSync(process.execPath, [T], { cwd: root, encoding: 'utf8' }); fs.writeFileSync(f, keep); const out = (r.stdout || '') + (r.stderr || ''); return { code: r.status, lines: out.split('\n').length, firstError: (out.match(/AssertionError[^\n]*/) || [null])[0] }; };
const same = (a, b) => a.code === b.code && a.lines === b.lines && a.firstError === b.firstError;
const per = {};
for (const T of TESTS) {
  const oldSrc = fs.readFileSync(path.join(BASE, T), 'utf8'); const newSrc = fs.readFileSync(path.join(NEWROOT, T), 'utf8');
  const res = { oldOnBase: run(BASE, T, oldSrc), newOnBase: run(BASE, T, newSrc), oldOnMoved: run(MOVED, T, oldSrc), newOnMoved: run(MOVED, T, newSrc) };
  per[T] = { results: res, newTestSameOnBaseProduct: same(res.oldOnBase, res.newOnBase), baseTestBreaksOnMoved: res.oldOnMoved.code !== 0, newTestSameOnMoved: same(res.newOnMoved, res.oldOnBase) };
}
const out = {
  what: '시험지 ' + TESTS.join(', ') + ' — 기준 시험지/새 시험지 × 기준 제품(origin/main git archive)/이동 제품(인라인 3단계 Z3·기관 설정으로 생성기를 돌린 사본)',
  tests: TESTS, per,
  newTestSameOnBaseProduct: TESTS.every(T => per[T].newTestSameOnBaseProduct),
  baseTestBreaksOnMoved: TESTS.filter(T => per[T].baseTestBreaksOnMoved),
  newTestSameOnMoved: TESTS.every(T => per[T].newTestSameOnMoved),
};
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n'); console.log(JSON.stringify(out, null, 1));
