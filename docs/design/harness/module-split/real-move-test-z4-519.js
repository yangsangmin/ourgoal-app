// #TASK-ES-519: 시험지 선행 실측 — 기준 시험지·새 시험지를 기준 제품(origin/main git archive)과 모의 이동 제품(같은 사본에 gen-inline-hard.js 로
// renderMultiMetricSvg · collapseAllTeamGoalAccordions 만 세포로 옮긴 것, 커밋 안 함)에서 돌려 종료 코드·출력 줄 수·첫 오류를 맞댄다(판정 아님).
// 새 시험지는 작업 트리의 tests/<시험지> 와 tests/helpers/inline-bundle.js 를 사본에 잠깐 덮어써 돌리고 되돌린다.
// 사용: (1) git archive origin/main 을 두 사본(기준·이동)에 푼다 (2) NODE_PATH=<node_modules> node gen-inline-hard.js <이동 사본> docs/design/harness/module-split/mock-move-z4-519.json (3) NODE_PATH=<node_modules> node real-move-test-z4-519.js <기준 사본> <이동 사본> <작업 트리> <out.json> <시험지 상대경로...>
const { spawnSync } = require('child_process'); const fs = require('fs'); const path = require('path');
const [BASE, MOVED, WORK, OUT, ...TESTS] = process.argv.slice(2);
const HELPER = 'tests/helpers/inline-bundle.js';
const run = (root, files) => (T) => {
  const keep = {}; for (const [rel, src] of Object.entries(files)) { const f = path.join(root, rel); keep[rel] = fs.readFileSync(f, 'utf8'); fs.writeFileSync(f, src); }
  try { const r = spawnSync(process.execPath, [T], { cwd: root, encoding: 'utf8' }); const out = (r.stdout || '') + (r.stderr || ''); return { code: r.status, lines: out.split('\n').length, firstError: (out.match(/AssertionError[^\n]*/) || [null])[0] }; }
  finally { for (const [rel, src] of Object.entries(keep)) fs.writeFileSync(path.join(root, rel), src); }
};
const same = (a, b) => a.code === b.code && a.lines === b.lines && a.firstError === b.firstError;
const results = {}; const baseTestBreaksOnMoved = []; let newTestSameOnBaseProduct = true, newTestSameOnMoved = true; const newTestPassesWithoutExposure = [];
for (const T of TESTS) {
  const oldFiles = { [T]: fs.readFileSync(path.join(BASE, T), 'utf8'), [HELPER]: fs.readFileSync(path.join(BASE, HELPER), 'utf8') };
  const newFiles = { [T]: fs.readFileSync(path.join(WORK, T), 'utf8'), [HELPER]: fs.readFileSync(path.join(WORK, HELPER), 'utf8') };
  const r = { oldOnBase: run(BASE, oldFiles)(T), newOnBase: run(BASE, newFiles)(T), oldOnMoved: run(MOVED, oldFiles)(T), newOnMoved: run(MOVED, newFiles)(T) };
  // 검사 세기: 이동 제품에서 원래 자리 노출 줄을 지우면 새 시험지가 실패해야 한다(노출 줄을 원문에서 찾는다는 뜻)
  const movedHtml = fs.readFileSync(path.join(MOVED, 'index.html'), 'utf8');
  const negHtml = movedHtml.replace(/^  window\.(renderMultiMetricSvg|collapseAllTeamGoalAccordions) = \1;(\r?)$/mg, '  // (실측용으로 지움)$2');
  r.newOnMovedWithoutExposure = run(MOVED, Object.assign({ 'index.html': negHtml }, newFiles))(T);
  if (r.newOnMovedWithoutExposure.code === 0) newTestPassesWithoutExposure.push(T);
  results[T] = r;
  if (!same(r.oldOnBase, r.newOnBase)) newTestSameOnBaseProduct = false;
  if (r.oldOnMoved.code !== 0) baseTestBreaksOnMoved.push(T);
  if (!same(r.newOnMoved, r.oldOnBase)) newTestSameOnMoved = false;
}
const out = { what: '시험지 선행 4칸 — 기준/새 시험지 × 기준 제품(origin/main git archive)/모의 이동 제품(renderMultiMetricSvg·collapseAllTeamGoalAccordions 세포 이전)', tests: TESTS, results, newTestSameOnBaseProduct, baseTestBreaksOnMoved, newTestSameOnMoved, newTestPassesWithoutExposure };
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n'); console.log(JSON.stringify(out, null, 1));
