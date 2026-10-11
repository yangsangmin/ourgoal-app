#!/usr/bin/env node
'use strict';
// B3a: npm test 경로를 끝까지 따로 돌려 실패한 검사를 전부 모은다(작업자 측정 도구, 판정 아님).
// npm test 는 `a && b && c && d` 라 첫 실패에서 멈추고, scripts/test-shipyard-modular.js 도 첫 실패 시험 파일에서 멈춘다 — 모의 철거 사본에서 「무엇이 깨지는지」를 전부 보려면 따로 돌려야 한다.
//   · package.json scripts.test 의 각 스크립트를 따로 실행(종료 코드 · ✗ 줄)
//   · tests/ 아래 *.test.js 를 하나씩 따로 실행(종료 코드) — npm test 경로에 없는 시험 파일도 포함되므로 기준 트리 결과와 맞대어 본다
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node reports/TASK-ES-614/run-tests-each.cjs <트리> <out.json>
const fs = require('fs'), path = require('path'), cp = require('child_process');
const TREE = path.resolve(process.argv[2]), OUT = path.resolve(process.argv[3]);
const pkg = JSON.parse(fs.readFileSync(path.join(TREE, 'package.json'), 'utf8'));
const scripts = pkg.scripts.test.split('&&').map(s => s.trim().replace(/^node\s+/, ''));
const run = rel => { const r = cp.spawnSync(process.execPath, [rel], { cwd: TREE, encoding: 'utf8', env: process.env, maxBuffer: 256 * 1024 * 1024 }); return { exit: r.status, out: (r.stdout || '') + (r.stderr || '') }; };
const norm = s => s.trim().replace(/\d+(\.\d+)?\s?ms\b/g, 'Nms');
const out = { tool: 'reports/TASK-ES-614/run-tests-each.cjs', type: '작업자 측정, 판정 아님', tree: TREE, measuredAt: new Date().toISOString(), scripts: [], testFiles: [] };
for (const s of scripts) {
  const r = run(s), L = r.out.split(/\r?\n/);
  const fails = [];
  L.forEach((l, i) => { if (/^\s*(✗|✖|not ok)/.test(l)) fails.push({ check: norm(l).slice(0, 200), detail: norm(L[i + 1] || '').slice(0, 200) }); });
  out.scripts.push({ script: s, exit: r.exit, ok: L.filter(l => /^\s*✓ /.test(l)).length, okDot: L.filter(l => /^\s*ok · /.test(l)).length, fails });
}
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const files = walk(path.join(TREE, 'tests')).filter(f => /\.test\.js$/.test(f)).map(f => path.relative(TREE, f).replace(/\\/g, '/')).sort();
for (const f of files) { const r = run(f); out.testFiles.push({ file: f, exit: r.exit, tail: r.exit === 0 ? null : norm(r.out.split(/\r?\n/).filter(l => /AssertionError|Error:|✗|not ok|expected|actual/.test(l)).slice(0, 4).join(' | ')).slice(0, 500) }); }
out.summary = { scripts: out.scripts.map(s => ({ script: s.script, exit: s.exit, ok: s.ok, okDot: s.okDot, fails: s.fails.length })), testFiles: files.length, testFilesFailed: out.testFiles.filter(t => t.exit !== 0).map(t => t.file) };
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', 'utf8');
console.log(JSON.stringify(out.summary));
