'use strict';
// 통계 세포 쪼개기 3차(#TASK-ES-405 — 2차 test-compare-stats-2.js 와 같은 방식) 시험 전후 비교: 기준 트리(git worktree --detach 기준 커밋 — git 을 읽는 시험 줄도 같게)와 작업 트리에서
//  ① npm test 를 돌려 smoke 통과·실패 수, 무결성 게이트, 버튼 배선, 셀 수, 모듈 가드 ①~⑤ 를 뽑아 맞대고 smoke 검사 제목 목록을 맞댄다
//  ② tests/*.test.js 전부 + scripts/test-universal-stats-ux.js + scripts/test-universal-import.js 를 하나씩 돌려 종료 코드·정규화한 출력을 맞댄다
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node test-compare-stats-3.js <기준 트리> <작업 트리> <out.json>
const { spawnSync } = require('child_process');
const fs = require('fs'), path = require('path');
const [BASE, WORK, OUT] = process.argv.slice(2);
const env = Object.assign({}, process.env, { NODE_PATH: process.env.NODE_PATH || 'C:/dev/ourgoal-app/node_modules' });
const sh = (cwd, cmd, args) => { const r = spawnSync(cmd, args, { cwd, env, encoding: 'utf8', shell: process.platform === 'win32', maxBuffer: 64 * 1024 * 1024, timeout: 300000 }); return { code: r.status, out: (r.stdout || '') + (r.stderr || '') }; };
function npmNumbers(out) {
  const m = (re) => { const x = re.exec(out); return x ? x.slice(1).map(Number) : null; };
  return {
    smoke: m(/(\d+)개 통과, (\d+)개 실패/),
    integrity: m(/총 (\d+)개 검사 중 (\d+)개 통과 \((\d+)개 실패\)/),
    buttons: m(/엄밀 핸들러 배선 확인 버튼: (\d+)개 \/ (\d+)개/),
    shipyardModularFiles: (m(/Checked (\d+) modular files/) || [null])[0],
    moduleGuard: m(/\[모듈 가드\] ① (\d+) · ② (\d+) · ③ (\d+) · ④ (\d+) · ⑤ (\d+)/),
  };
}
const smokeTitles = out => out.split(/\r?\n/).filter(l => /^\s+[✓✗×]/.test(l)).map(l => l.trim());
const normalize = (s, root) => s.split(root).join('<root>').split(root.replace(/\//g, '\\')).join('<root>')
  .replace(/:\d+:\d+\)/g, ':<l>:<c>)').replace(/\d+(\.\d+)?\s?ms\b/g, '<ms>').replace(/duration_ms["':\s]+[\d.]+/g, 'duration_ms <n>').split('(root: ' + path.basename(root) + ')').join('(root: <root>)')
  .replace(/\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?Z/g, '<iso>');
function runAll(root) {
  const npm = sh(root, 'npm', ['test']);
  const files = fs.readdirSync(path.join(root, 'tests')).filter(n => n.endsWith('.test.js')).sort().map(n => 'tests/' + n).concat(['scripts/test-universal-stats-ux.js', 'scripts/test-universal-import.js']);
  const tests = {};
  for (const f of files) { const r = sh(root, 'node', [f]); tests[f] = { code: r.code, out: normalize(r.out, path.resolve(root)) }; }
  return { npm: { code: npm.code, numbers: npmNumbers(npm.out), titles: smokeTitles(npm.out) }, tests };
}
const b = runAll(BASE), w = runAll(WORK);
const files = Object.keys(b.tests);
const sameFileList = JSON.stringify(files) === JSON.stringify(Object.keys(w.tests));
const exitDiff = files.filter(f => !w.tests[f] || b.tests[f].code !== w.tests[f].code);
const outDiff = files.filter(f => !w.tests[f] || b.tests[f].out !== w.tests[f].out);
const report = {
  task: 'TASK-ES-405',
  what: '기준 트리(git worktree --detach) 대 작업 트리 — npm test 수치·smoke 검사 제목, tests 출력 비교',
  base: { npmExit: b.npm.code, npmTest: b.npm.numbers }, work: { npmExit: w.npm.code, npmTest: w.npm.numbers },
  sameNumbers: JSON.stringify(b.npm.numbers) === JSON.stringify(w.npm.numbers) && b.npm.code === w.npm.code,
  smokeTitleCount: [b.npm.titles.length, w.npm.titles.length],
  smokeTitlesIdentical: JSON.stringify(b.npm.titles) === JSON.stringify(w.npm.titles),
  tests: { files: files.length, sameFileList, exitCodesSame: exitDiff.length === 0, exitDiff, outputDiffAfterNormalize: outDiff, outputsSame: outDiff.length === 0,
    failingInBaseAndAfter: files.filter(f => b.tests[f].code !== 0 && w.tests[f] && w.tests[f].code !== 0).map(f => path.basename(f)),
    normalize: '경로·트리 폴더 이름(root: …)·스택 줄 번호·ms·duration_ms·ISO 시각' },
};
fs.writeFileSync(OUT, JSON.stringify(report, null, 1));
console.log(JSON.stringify({ base: report.base, work: report.work, sameNumbers: report.sameNumbers, smokeTitleCount: report.smokeTitleCount, smokeTitlesIdentical: report.smokeTitlesIdentical, files: files.length, exitDiff, outDiff }, null, 1));
process.exitCode = report.sameNumbers && report.smokeTitlesIdentical && sameFileList && exitDiff.length === 0 && outDiff.length === 0 ? 0 : 1;
