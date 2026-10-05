'use strict';
// #TASK-ES-412 시험지 선행 — 모의 이전 측정: 공통 UI 컴포넌트 쪼개기(ES-411) 산출물을 얹은 스크래치 트리(git archive + 생성기 + module-specs/guard)에서
//  ① 기준 시험지(scripts/smoke-test.js · tests/*.test.js, 기준 커밋 글자)는 깨지고 ② 새 시험지(이 PR 글자)는 통과하는지 잰다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node mock-move-components.js <모의 이전 트리> <기준 트리> <새 시험지 트리> <out.json>
const { spawnSync } = require('child_process');
const fs = require('fs'), path = require('path');
const [MOCK, BASE, NEW, OUT] = process.argv.slice(2);
const env = Object.assign({}, process.env, { NODE_PATH: process.env.NODE_PATH || 'C:/dev/ourgoal-app/node_modules' });
const sh = (cwd, cmd, args) => { const r = spawnSync(cmd, args, { cwd, env, encoding: 'utf8', shell: process.platform === 'win32', maxBuffer: 64 * 1024 * 1024, timeout: 600000 }); return { code: r.status, out: (r.stdout || '') + (r.stderr || '') }; };
const smokeNums = out => { const m = /(\d+)개 통과, (\d+)개 실패/.exec(out); return m ? [Number(m[1]), Number(m[2])] : null; };
const failed = out => out.split(/\r?\n/).filter(l => /^\s+\u2717/.test(l)).map(l => l.trim().replace(/^\u2717\s*/, ''));
const SHEETS = ['scripts/smoke-test.js', ...fs.readdirSync(path.join(NEW, 'tests')).filter(n => n.endsWith('.test.js')).map(n => 'tests/' + n), 'tests/helpers/components-bundle.js'];
function useSheets(from) {
  for (const rel of SHEETS) {
    const src = path.join(from, rel), dst = path.join(MOCK, rel);
    if (fs.existsSync(src)) { fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(src, dst); } else if (fs.existsSync(dst)) fs.unlinkSync(dst);
  }
}
function measure() {
  const smoke = sh(MOCK, 'node', ['scripts/smoke-test.js']);
  const tests = {};
  for (const n of fs.readdirSync(path.join(MOCK, 'tests')).filter(n => n.endsWith('.test.js')).sort()) tests['tests/' + n] = sh(MOCK, 'node', ['tests/' + n]).code;
  return { smoke: smokeNums(smoke.out), smokeExit: smoke.code, smokeFailed: failed(smoke.out), testsFailing: Object.keys(tests).filter(k => tests[k] !== 0), tests };
}
useSheets(BASE);
const oldSheet = measure();
const baseTests = {};
for (const k of Object.keys(oldSheet.tests)) baseTests[k] = sh(BASE, 'node', [k]).code;
useSheets(NEW);
const newSheet = measure();
newSheet.npmTestExit = sh(MOCK, 'npm', ['test']).code;
const report = {
  task: 'TASK-ES-412',
  what: '모의 이전 트리(ES-411 생성기 산출물)에서 기준 시험지 대 새 시험지 — smoke 통과·실패 수, 실패 검사 제목, tests 종료 코드',
  mockSource: 'git archive 기준 커밋 + docs/design/harness/module-split/gen-components.js(ES-411) + module-specs --write · spec-components · module-guard --update',
  oldSheet: { smoke: oldSheet.smoke, smokeFailedCount: oldSheet.smokeFailed.length, smokeFailed: oldSheet.smokeFailed, testsFailingNotFailingOnBase: oldSheet.testsFailing.filter(k => baseTests[k] === 0) },
  newSheet: { smoke: newSheet.smoke, smokeFailed: newSheet.smokeFailed, npmTestExit: newSheet.npmTestExit, testsFailingNotFailingOnBase: newSheet.testsFailing.filter(k => baseTests[k] === 0) },
  testsExitSameAsBaseWithNewSheet: Object.keys(baseTests).every(k => newSheet.tests[k] === baseTests[k]),
};
fs.writeFileSync(OUT, JSON.stringify(report, null, 1));
console.log(JSON.stringify(Object.assign({}, report, { oldSheet: Object.assign({}, report.oldSheet, { smokeFailed: report.oldSheet.smokeFailed.length }) }), null, 1));
process.exitCode = report.newSheet.smoke && report.newSheet.smoke[1] === 0 && report.newSheet.npmTestExit === 0 && report.testsExitSameAsBaseWithNewSheet ? 0 : 1;
