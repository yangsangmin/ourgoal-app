#!/usr/bin/env node
'use strict';
// #TASK-ES-620 측정 도구(작업자 측정, 판정 아님) — 고친 시험지가 법정의 격리 실행(권한 제한 + 감시 미리 읽기) 안에서도 끝까지 도는지 잰다.
// 이 PR 이 병합되면 고친 smoke-test.js 가 「기준 커밋의 시험지」가 되어, 뒤따르는 배선 철거 PR 의 제품을 법정이 이 시험지로 채점한다.
// 그때 등록 블록을 읽는 갈래(@babel/parser)가 권한 제한에 막히면 철거 PR 이 전부 막히므로, 법정의 실행 함수를 그대로 불러(읽기만 — court/ 변경 0) 미리 돌려 본다.
//   court/probes/base-tests.js 의 runOne(treeDir, runner, nodeModules, scratchTmp, watch) — 법정이 기준 시험지를 돌릴 때 쓰는 그 함수다.
// 사용: node reports/TASK-ES-620/court-sandbox-run.cjs <법정이 있는 저장소> <돌릴 트리> <node_modules> <out.json> [--label 글자]
const fs = require('fs'), os = require('os'), path = require('path');
const REPO = path.resolve(process.argv[2]), TREE = path.resolve(process.argv[3]), NM = path.resolve(process.argv[4]), OUT = path.resolve(process.argv[5]);
const label = process.argv.indexOf('--label') >= 0 ? process.argv[process.argv.indexOf('--label') + 1] : null;
const { runOne } = require(path.join(REPO, 'court', 'probes', 'base-tests.js'));
const vault = JSON.parse(fs.readFileSync(path.join(REPO, 'court', 'vault.json'), 'utf8'));
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'es620-court-sandbox-'));
const scratchTmp = path.join(work, 'tmp'); fs.mkdirSync(scratchTmp, { recursive: true });
const resultDir = path.join(work, 'watch'); fs.mkdirSync(resultDir, { recursive: true });
const sheets = fs.readdirSync(path.join(TREE, 'scripts')).filter(n => /^(smoke-test|verify-integrity-gate|verify-all-clicks|test-.*)\.js$/.test(n)).map(n => 'scripts/' + n);
const out = { tool: 'reports/TASK-ES-620/court-sandbox-run.cjs', type: '작업자 측정, 판정 아님 — 법정의 실행 함수(court/probes/base-tests.js runOne)를 작업자 PC 에서 부른 것', label, tree: TREE, measuredAt: new Date().toISOString(), node: process.version, runners: [] };
try {
  for (const runner of vault.baseTestRunners) {
    const r = runOne(TREE, runner, NM, scratchTmp, { sheets, resultDir });
    out.runners.push({ file: runner.file, ran: r.ran, exit: r.exit === undefined ? null : r.exit, isolated: r.isolated === undefined ? null : r.isolated, watched: r.watched === undefined ? null : r.watched,
      passed: r.passed ? r.passed.length : null, failed: r.failed ? r.failed.length : null, failedTitles: r.failed || [], foreignLines: r.foreignLines ? r.foreignLines.length : null, foreignExits: r.foreignExits ? r.foreignExits.length : null,
      death: r.death || null, reason: r.reason || null });
  }
} finally { try { fs.rmSync(work, { recursive: true, force: true }); } catch (e) { /* 무시 */ } }
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', 'utf8');
console.log(JSON.stringify(out.runners.map(r => ({ file: r.file, exit: r.exit, isolated: r.isolated, watched: r.watched, passed: r.passed, failed: r.failed, death: r.death && r.death.line }))));
