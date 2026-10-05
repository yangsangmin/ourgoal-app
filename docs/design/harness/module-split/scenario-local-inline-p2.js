'use strict';
// 인라인 세포화 구역 P2(#TASK-ES-438 ~) 화면 시나리오 로컬 실행(2차 scenario-local-inline-split-2.js #TASK-ES-432 와 같은 방식) — 법정 실행기(court/lib/scenario.js runScenario · static-server · 법정 전용 호스트 이름)를 읽기만 해서
// 기준 트리와 작업 트리에 이 작업의 시나리오 전부를 돌린다(court/** 변경 0). 판정이 아니라 제출 전 자기 점검이다.
// 사용: node scenario-local-inline-p2.js <기준 트리> <작업 트리> <시나리오 폴더> <out.json>
const fs = require('fs'), path = require('path');
const [BASE, WORK, DIR, OUT] = process.argv.slice(2);
const C = p => require(path.resolve(WORK, 'court', 'lib', p));
const { runScenario, validateScenario, loadConfig } = C('scenario.js');
const server = C('static-server.js');
const siteHostLib = C('site-host.js');
(async () => {
  const cfg = JSON.parse(fs.readFileSync(path.resolve(WORK, 'court', 'config.json'), 'utf8'));
  const config = loadConfig(path.resolve(WORK, 'court', 'config.json'));
  const host = siteHostLib.pickSiteHost(cfg);
  const out = { scenarios: {} };
  let allOk = true;
  for (const f of fs.readdirSync(DIR).filter(n => n.endsWith('.json')).sort()) {
    const scenario = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
    const v = validateScenario(scenario, config);
    const rec = { valid: v, runs: {} };
    for (const [label, dir] of [['base', BASE], ['work', WORK]]) {
      const srv = await server.start(path.resolve(dir), cfg.denyServePrefixes);
      const r = await runScenario({ scenario, siteUrl: siteHostLib.siteUrlFor(host, srv.port), siteRev: label, outDir: null, config });
      rec.runs[label] = { passed: r.passed, provesBehavior: r.provesBehavior, nonVacuousExpects: r.nonVacuousExpects, vacuousExpects: r.vacuousExpects, failedStep: r.failedStep, failKind: r.failKind, failReason: r.failReason, toolError: r.toolError, exceptions: r.exceptions, steps: r.steps.map(s => ({ ok: s.ok, detail: s.detail })) };
      try { await srv.close(); } catch (e) {}
    }
    rec.ok = v.errors.length === 0 && v.weaknesses.length === 0 && rec.runs.base.passed && rec.runs.work.passed && rec.runs.work.provesBehavior;
    allOk = allOk && rec.ok;
    out.scenarios[scenario.id] = rec;
    console.log(JSON.stringify({ id: scenario.id, errors: v.errors, weaknesses: v.weaknesses, base: rec.runs.base.passed, work: rec.runs.work.passed, provesBehavior: rec.runs.work.provesBehavior, baseFail: rec.runs.base.failedStep, workFail: rec.runs.work.failedStep }));
  }
  out.allOk = allOk;
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
  process.exit(allOk ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
