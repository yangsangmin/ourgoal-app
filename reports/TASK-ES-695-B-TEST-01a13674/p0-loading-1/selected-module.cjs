'use strict';
// Original fixture declarations and original selected callbacks, never the full suites.
const fs = require('fs'), path = require('path'), Module = require('module');
const root = path.resolve(__dirname, '../../..'), selection = process.argv[2];
let file, code;
if (selection === 'p0-four') {
  file = path.join(root, 'tests/local-keep-p0.test.js');
  const source = fs.readFileSync(file, 'utf8'), direct = source.indexOf('/* ============ 1. 부품:'), coupled = source.indexOf('/* ============ 2. 맞물림:');
  if (direct < 0 || coupled <= direct) throw Error('EXACT_P0_SECTIONS_REQUIRED');
  code = source.slice(0, direct) + source.slice(coupled);
} else if (selection === 'direct-sixth') {
  file = path.join(root, 'tests/direct-login-guard.test.js');
  const source = fs.readFileSync(file, 'utf8'), main = source.indexOf('(async function main() {'), sixth = source.indexOf("  await check('⑥ 추가 범위(#680 발견):"), end = source.indexOf('\n  var failed = results.filter', sixth);
  if (main < 0 || sixth <= main || end <= sixth) throw Error('EXACT_DIRECT_SIXTH_REQUIRED');
  code = source.slice(0, main) + '(async function selectedOnly(){var m={};\n' + source.slice(sixth, end) + '\nvar failed=results.filter(r=>!r.ok);console.log(JSON.stringify({total:results.length,passed:results.length-failed.length,failed:failed.length,results}));if(failed.length)process.exitCode=1;})().catch(e=>{console.error(e);process.exitCode=1;});';
} else throw Error('CLOSED_SELECTION_REQUIRED');
const selected = new Module(file, module); selected.filename = file; selected.paths = Module._nodeModulePaths(path.dirname(file));
selected._compile(code, file);
