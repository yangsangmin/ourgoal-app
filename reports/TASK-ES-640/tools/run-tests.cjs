'use strict';
// 사본 하나에서 tests/*.test.js 전부와 npm test 네 단계를 차례로 돌려 종료 코드를 적는다(작업자 측정).
const fs = require('fs'), path = require('path'), cp = require('child_process');
const APP = path.resolve(process.argv[2]), OUT = process.argv[3];
const env = Object.assign({}, process.env, { NODE_PATH: process.argv[4] || process.env.NODE_PATH || '' });
const files = fs.readdirSync(path.join(APP, 'tests')).filter(f => f.endsWith('.test.js')).sort().map(f => 'tests/' + f)
  .concat(['scripts/smoke-test.js', 'scripts/verify-integrity-gate.js', 'scripts/verify-all-clicks.js', 'scripts/test-shipyard-modular.js', 'scripts/module-guard.js']);
const res = {};
for (const f of files) {
  const r = cp.spawnSync(process.execPath, [f], { cwd: APP, env, encoding: 'utf8', timeout: 180000, maxBuffer: 64 * 1024 * 1024 });
  const out = (r.stdout || '') + (r.stderr || '');
  res[f] = { exit: r.status, signal: r.signal || null, okLines: (out.match(/^\s*(✓|ok\b)/gm) || []).length, tail: out.trim().split('\n').slice(-3).join(' | ').slice(0, 300) };
}
fs.writeFileSync(OUT, JSON.stringify(res, null, 1), 'utf8');
console.log('done', files.length, 'nonzero', Object.keys(res).filter(k => res[k].exit !== 0).length);
