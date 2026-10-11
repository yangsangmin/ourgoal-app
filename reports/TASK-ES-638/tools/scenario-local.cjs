'use strict';
// 법정 실행기(court/lib/scenario.js runScenario · static-server · site-host)를 읽기만 써서 시나리오를 기준 2회·작업 1회 돌린다(법정의 보존 심사와 같은 횟수).
// 작업자 PC 예비 점검 — 판정이 아니다. 사용: node scenario-local.js <기준 트리> <작업 트리> <out.json> <시나리오.json...>
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
  const out = { tool: 'court/lib/scenario.js runScenario(preserveOnly) — 기준 2회 · 작업 1회 (읽기 전용 사용)', type: '작업자 PC 예비 점검 — 판정 아님', scenarios: {} };
  for (const sc of SCS) {
    const scenario = JSON.parse(fs.readFileSync(sc, 'utf8'));
    const v = validateScenario(scenario, config);
    const row = { file: path.basename(sc), valid: v, runs: {} };
    for (const [label, dir] of [['base', BASE], ['base2', BASE], ['work', WORK]]) {
      const srv = await server.start(path.resolve(dir), cfg.denyServePrefixes);
      const r = await runScenario({ scenario, siteUrl: siteHostLib.siteUrlFor(host, srv.port), siteRev: label, outDir: null, config, preserveOnly: true });
      row.runs[label] = { passed: r.passed, provesBehavior: r.provesBehavior, failedStep: r.failedStep, failKind: r.failKind, failReason: r.failReason, toolError: r.toolError, exceptions: r.exceptions, nonVacuousExpects: r.nonVacuousExpects, steps: (r.steps || []).length };
      try { srv.close ? srv.close() : srv.server && srv.server.close(); } catch (e) {}
    }
    out.scenarios[scenario.id] = row;
    console.log(scenario.id, JSON.stringify({ base: row.runs.base.passed, base2: row.runs.base2.passed, work: row.runs.work.passed, proves: [row.runs.base.provesBehavior, row.runs.base2.provesBehavior, row.runs.work.provesBehavior] }));
  }
  const rows = Object.values(out.scenarios);
  out.allPassedBoth = rows.length > 0 && rows.every(r => r.runs.base.passed && r.runs.base2.passed && r.runs.work.passed);
  out.allProveBehavior = rows.length > 0 && rows.every(r => r.runs.base.provesBehavior && r.runs.base2.provesBehavior && r.runs.work.provesBehavior);
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', 'utf8');
  process.exit(0);
})();
