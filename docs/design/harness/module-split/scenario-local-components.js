'use strict';
// #TASK-ES-411 화면 시나리오 로컬 실행 — 법정 실행기(court/lib/scenario.js runScenario · static-server · 법정 전용 호스트 이름)를 읽기만 해서
// 기준 트리와 작업 트리에 같은 시나리오를 돌린다(court/** 변경 0). 판정이 아니라 제출 전 자기 점검이다.
// 사용: node scenario-local-components.js <기준 트리> <작업 트리> <시나리오.json> <out.json>
const fs = require('fs'), path = require('path');
const [BASE, WORK, SC, OUT] = process.argv.slice(2);
const C = p => require(path.resolve(WORK, 'court', 'lib', p));
const { runScenario, validateScenario, loadConfig } = C('scenario.js');
const server = C('static-server.js');
const siteHostLib = C('site-host.js');
(async () => {
  const cfg = JSON.parse(fs.readFileSync(path.resolve(WORK, 'court', 'config.json'), 'utf8'));
  const config = loadConfig(path.resolve(WORK, 'court', 'config.json'));
  const scenario = JSON.parse(fs.readFileSync(SC, 'utf8'));
  const v = validateScenario(scenario, config);
  const host = siteHostLib.pickSiteHost(cfg);
  const out = { scenario: scenario.id, valid: v, runs: {} };
  for (const [label, dir] of [['base', BASE], ['work', WORK]]) {
    const srv = await server.start(path.resolve(dir), cfg.denyServePrefixes);
    const r = await runScenario({ scenario, siteUrl: siteHostLib.siteUrlFor(host, srv.port), siteRev: label, outDir: null, config });
    out.runs[label] = { passed: r.passed, invalid: r.invalid, errors: r.errors, failedStep: r.failedStep, failKind: r.failKind, failReason: r.failReason, toolError: r.toolError, exceptions: r.exceptions, nonVacuousExpects: r.nonVacuousExpects, steps: r.steps };
    try { srv.close ? srv.close() : srv.server && srv.server.close(); } catch (e) {}
  }
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
  console.log(JSON.stringify({ valid: v, base: out.runs.base.passed, work: out.runs.work.passed, baseFail: out.runs.base.failedStep, workFail: out.runs.work.failedStep }));
  process.exit(out.runs.base.passed && out.runs.work.passed ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
