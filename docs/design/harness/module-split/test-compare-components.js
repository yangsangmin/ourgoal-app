'use strict';
// 공통 UI 컴포넌트 세포 쪼개기(#TASK-ES-411) · 시험지 선행(#TASK-ES-412) 시험 전후 비교 — test-compare-stats-2.js 와 같은 방식:
//  ① 두 트리에서 npm test 를 돌려 smoke 통과·실패 수, 무결성 게이트, 버튼 배선, 모듈 가드 ①~⑤ 를 뽑아 맞대고 smoke 검사 제목(결과 표시 포함) 목록을 맞댄다
//  ② tests/*.test.js 전부를 하나씩 돌려 종료 코드·정규화한 출력을 맞댄다
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node test-compare-components.js <기준 트리> <작업 트리> <out.json> [작업 이름]
const { spawnSync } = require('child_process');
const fs = require('fs'), path = require('path');
const [BASE, WORK, OUT, TASK] = process.argv.slice(2);
const env = Object.assign({}, process.env, { NODE_PATH: process.env.NODE_PATH || 'C:/dev/ourgoal-app/node_modules' });
const sh = (cwd, cmd, args) => { const r = spawnSync(cmd, args, { cwd, env, encoding: 'utf8', shell: process.platform === 'win32', maxBuffer: 64 * 1024 * 1024, timeout: 300000 }); return { code: r.status, out: (r.stdout || '') + (r.stderr || '') }; };
function npmNumbers(out) {
  const m = (re) => { const x = re.exec(out); return x ? x.slice(1).map(Number) : null; };
  return {
    smoke: m(/(\d+)개 통과, (\d+)개 실패/),
    integrity: (m(/총 (\d+)개 검사 중 (\d+)개 통과/) || null),
    buttons: m(/엄밀 핸들러 배선 확인 버튼: (\d+)개 \/ (\d+)개/),
    shipyardModularFiles: (m(/Checked (\d+) modular files/) || [null])[0],
    moduleGuard: m(/\[모듈 가드\] ① (\d+) · ② (\d+) · ③ (\d+) · ④ (\d+) · ⑤ (\d+)/),
  };
}
const smokeLines = out => out.split(/\r?\n/).filter(l => /^\s+[\u2713\u2717\u00d7]/.test(l)).map(l => l.trim());
const smokeTitle = l => l.replace(/^[\u2713\u2717\u00d7]\s*/, '');
const smokeFailed = out => smokeLines(out).filter(l => !/^\u2713/.test(l)).map(smokeTitle);
const normalize = (s, root) => s.split(root).join('<root>').split(root.replace(/\//g, '\\')).join('<root>').split(root.split('\\').join('\\\\')).join('<root>')
  .replace(/:\d+:\d+\)/g, ':<l>:<c>)').replace(/\.js:\d+(:\d+)?/g, '.js:<l>').replace(/\d+(\.\d+)?\s?ms\b/g, '<ms>').replace(/duration_ms["':\s]+[\d.]+/g, 'duration_ms <n>').split('(root: ' + path.basename(root) + ')').join('(root: <root>)')
  .replace(/\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?Z/g, '<iso>');
function runAll(root) {
  const npm = sh(root, 'npm', ['test']);
  const files = fs.readdirSync(path.join(root, 'tests')).filter(n => n.endsWith('.test.js')).sort().map(n => 'tests/' + n);
  const tests = {};
  for (const f of files) { const r = sh(root, 'node', [f]); tests[f] = { code: r.code, out: normalize(r.out, path.resolve(root)) }; }
  return { npm: { code: npm.code, numbers: npmNumbers(npm.out), lines: smokeLines(npm.out), failed: smokeFailed(npm.out) }, tests };
}
const b = runAll(BASE), w = runAll(WORK);
const files = Object.keys(b.tests);
const sameFileList = JSON.stringify(files) === JSON.stringify(Object.keys(w.tests));
const exitDiff = files.filter(f => !w.tests[f] || b.tests[f].code !== w.tests[f].code);
const outDiff = files.filter(f => !w.tests[f] || b.tests[f].out !== w.tests[f].out);
const report = {
  task: TASK || 'TASK-ES-411',
  what: '기준 트리 대 작업 트리 — npm test 수치·smoke 검사 제목·결과, tests 종료 코드·정규화 출력 비교',
  base: { npmTestExit: b.npm.code, npmTest: b.npm.numbers, smokeFailed: b.npm.failed },
  work: { npmTestExit: w.npm.code, npmTest: w.npm.numbers, smokeFailed: w.npm.failed },
  sameNumbers: JSON.stringify(b.npm.numbers) === JSON.stringify(w.npm.numbers) && b.npm.code === w.npm.code,
  smokeTitleCount: [b.npm.lines.length, w.npm.lines.length],
  smokeTitlesIdentical: JSON.stringify(b.npm.lines.map(smokeTitle)) === JSON.stringify(w.npm.lines.map(smokeTitle)),
  smokeResultsIdentical: JSON.stringify(b.npm.lines) === JSON.stringify(w.npm.lines),
  testsRun: files.length,
  testsExitCodesIdentical: sameFileList && exitDiff.length === 0,
  testsExitCodeDiff: exitDiff,
  testsOutputDiffAfterNormalize: outDiff,
  testsFailingInBoth: files.filter(f => b.tests[f].code !== 0 && w.tests[f] && w.tests[f].code !== 0).map(f => path.basename(f)),
  normalize: '경로·트리 폴더 이름(root: …)·스택 줄 번호(.js:줄[:칸] — 시험지에 require 한 줄을 더해 실패 위치 줄 번호가 1 밀림)·ms·duration_ms·ISO 시각',
};
fs.writeFileSync(OUT, JSON.stringify(report, null, 1));
console.log(JSON.stringify({ base: report.base, work: report.work, sameNumbers: report.sameNumbers, smokeTitleCount: report.smokeTitleCount, smokeTitlesIdentical: report.smokeTitlesIdentical, smokeResultsIdentical: report.smokeResultsIdentical, files: files.length, exitDiff, outDiff }, null, 1));
process.exitCode = report.sameNumbers && report.smokeResultsIdentical && report.testsExitCodesIdentical ? 0 : 1;
