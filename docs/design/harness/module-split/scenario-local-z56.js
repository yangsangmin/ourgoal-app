'use strict';
// #TASK-ES-541 화면 시나리오 로컬 실행(scenario-local-stats-4.js 와 같은 방식, 여러 시나리오) — 법정 실행기(court/lib/scenario.js runScenario · static-server · 법정 전용 호스트 이름)를
// 읽기만 해서 기준 트리와 작업 트리에 같은 시나리오들을 돌린다(court/** 변경 0). 판정이 아니라 제출 전 자기 점검이다.
// 사용: node scenario-local-z56.js <기준 트리> <작업 트리> <out.json> <시나리오.json...>
const fs = require('fs'), path = require('path');
const [BASE, WORK, OUT, ...SCS] = process.argv.slice(2);
const C = p => require(path.resolve(WORK, 'court', 'lib', p));
const { runScenario, validateScenario, loadConfig } = C('scenario.js');
const server = C('static-server.js');
const siteHostLib = C('site-host.js');
(async () => {
  const cfg = JSON.parse(fs.readFileSync(path.resolve(WORK, 'court', 'config.json'), 'utf8'));
  const config = loadConfig(path.resolve(WORK, 'court', 'config.json'));
  const host = siteHostLib.pickSiteHost(cfg);
  const out = { tool: 'docs/design/harness/module-split/scenario-local-z56.js', scenarios: {} };
  for (const sc of SCS) {
    const scenario = JSON.parse(fs.readFileSync(sc, 'utf8'));
    const v = validateScenario(scenario, config);
    const row = { valid: v, runs: {} };
    for (const [label, dir] of [['base', BASE], ['work', WORK]]) {
      const srv = await server.start(path.resolve(dir), cfg.denyServePrefixes);
      const r = await runScenario({ scenario, siteUrl: siteHostLib.siteUrlFor(host, srv.port), siteRev: label, outDir: null, config });
      row.runs[label] = { passed: r.passed, failedStep: r.failedStep, failKind: r.failKind, failReason: r.failReason, toolError: r.toolError, exceptions: r.exceptions, nonVacuousExpects: r.nonVacuousExpects };
      try { srv.close ? srv.close() : srv.server && srv.server.close(); } catch (e) {}
    }
    out.scenarios[scenario.id] = row;
    console.log(scenario.id, JSON.stringify({ base: row.runs.base.passed, work: row.runs.work.passed, baseFail: row.runs.base.failedStep, workFail: row.runs.work.failedStep }));
  }
  const rows = Object.values(out.scenarios);
  out.allPassedBoth = rows.length > 0 && rows.every(r => r.runs.base.passed && r.runs.work.passed);
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', 'utf8');
  process.exit(out.allPassedBoth ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
