#!/usr/bin/env node
'use strict';
// #TASK-ES-620 측정 도구(작업자 측정, 판정 아님) — 한 트리에서 시험을 있는 그대로(미리 읽기 없이) 돌려 종료 코드와 검사 수를 적는다.
//   · `npm test` 전경 실행 1회(종료 코드 — package.json 의 `a && b && c && d` 그대로라 첫 실패에서 멈춘다)
//   · scripts.test 의 스크립트를 하나씩 따로(종료 코드 · ✓ 줄 수 · ok 줄 수 · ✗ 제목)
//   · 그 밖의 scripts/test-*.js 와 tests/ 아래 *.test.js 를 하나씩 따로(종료 코드)
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node reports/TASK-ES-620/run-plain.cjs <트리> <out.json> [--label 글자]
const fs = require('fs'), path = require('path'), cp = require('child_process');
const TREE = path.resolve(process.argv[2]), OUT = path.resolve(process.argv[3]);
const label = process.argv.indexOf('--label') >= 0 ? process.argv[process.argv.indexOf('--label') + 1] : null;
const pkg = JSON.parse(fs.readFileSync(path.join(TREE, 'package.json'), 'utf8'));
const npmScripts = pkg.scripts.test.split('&&').map(s => s.trim().replace(/^node\s+/, ''));
const run = rel => { const r = cp.spawnSync(process.execPath, [rel], { cwd: TREE, encoding: 'utf8', env: process.env, maxBuffer: 512 * 1024 * 1024, timeout: 600000 }); return { exit: r.status, out: (r.stdout || '') + '\n' + (r.stderr || '') }; };
const norm = s => s.trim().replace(/\d+(\.\d+)?\s?ms\b/g, 'Nms');
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const out = { tool: 'reports/TASK-ES-620/run-plain.cjs', type: '작업자 측정, 판정 아님', label, tree: TREE, measuredAt: new Date().toISOString(), node: process.version };

// npm test 전경 실행(셸을 거쳐 package.json 의 명령 그대로)
{
  const r = cp.spawnSync('npm test', { cwd: TREE, encoding: 'utf8', env: process.env, shell: true, maxBuffer: 512 * 1024 * 1024, timeout: 900000 });
  const L = ((r.stdout || '') + '\n' + (r.stderr || '')).split(/\r?\n/);
  out.npmTest = { command: 'npm test', exit: r.status, checkLines: L.filter(l => /^\s*✓ /.test(l)).length, okLines: L.filter(l => /^\s*ok · /.test(l)).length, failLines: L.filter(l => /^\s*(✗|✖|not ok)/.test(l)).map(l => norm(l).slice(0, 220)) };
}
out.scripts = npmScripts.map(s => {
  const r = run(s), L = r.out.split(/\r?\n/), fails = [];
  L.forEach((l, i) => { if (/^\s*(✗|✖|not ok)/.test(l)) fails.push({ check: norm(l).slice(0, 220), detail: norm(L[i + 1] || '').slice(0, 220) }); });
  return { script: s, exit: r.exit, checkLines: L.filter(l => /^\s*✓ /.test(l)).length, okLines: L.filter(l => /^\s*ok · /.test(l)).length, fails };
});
const tailOf = o => norm(o.split(/\r?\n/).filter(l => /AssertionError|Error:|✗|not ok/.test(l)).slice(0, 2).join(' | ')).slice(0, 300);
// --npm-only: npm test 경로만 잰다(그 밖의 시험 파일은 돌리지 않는다 — 결과 칸은 빈 목록이 아니라 「돌리지 않음」으로 남긴다)
const NPM_ONLY = process.argv.includes('--npm-only');
const other = NPM_ONLY ? [] : fs.readdirSync(path.join(TREE, 'scripts')).filter(n => /^test-.*\.js$/.test(n)).map(n => 'scripts/' + n).filter(s => !npmScripts.includes(s)).sort();
out.otherScripts = other.map(s => { const r = run(s); return { script: s, exit: r.exit, tail: r.exit === 0 ? null : tailOf(r.out) }; });
const files = NPM_ONLY ? [] : walk(path.join(TREE, 'tests')).filter(f => /\.test\.js$/.test(f)).map(f => path.relative(TREE, f).replace(/\\/g, '/')).sort();
out.testFiles = files.map(f => { const r = run(f); return { file: f, exit: r.exit, tail: r.exit === 0 ? null : tailOf(r.out) }; });
if (NPM_ONLY) { out.scope = 'npm test 경로만(그 밖의 scripts/test-*.js · tests/*.test.js 는 돌리지 않음)'; out.otherScripts = null; out.testFiles = null; }
out.summary = {
  npmTestExit: out.npmTest.exit, npmTestCheckLines: out.npmTest.checkLines, npmTestOkLines: out.npmTest.okLines,
  scripts: out.scripts.map(s => ({ script: s.script, exit: s.exit, checkLines: s.checkLines, okLines: s.okLines, fails: s.fails.length })),
  otherScripts: NPM_ONLY ? null : other.length, otherScriptsFailed: NPM_ONLY ? null : out.otherScripts.filter(t => t.exit !== 0).map(t => t.script),
  testFiles: NPM_ONLY ? null : files.length, testFilesExit0: NPM_ONLY ? null : out.testFiles.filter(t => t.exit === 0).length, testFilesFailed: NPM_ONLY ? null : out.testFiles.filter(t => t.exit !== 0).map(t => t.file),
};
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', 'utf8');
console.log(JSON.stringify(out.summary));
