const { runScenario, validateScenario, loadConfig } = require('../../../../court/lib/scenario.js');
const fs = require('fs');

async function test(scenarioPath, url, rev) {
  const scenario = JSON.parse(fs.readFileSync(scenarioPath, 'utf8'));
  const config = loadConfig();
  const v = validateScenario(scenario, config);
  if (v.errors.length) throw new Error(v.errors.join(', '));
  const result = await runScenario({ scenario, siteUrl: url, siteRev: rev, config });
  return result;
}

(async () => {
  const c1Base = await test('reports/TASK-ES-588/scenarios/c1-guest-settings.json', 'http://court-123456.test:3002', 'base');
  const c1Work = await test('reports/TASK-ES-588/scenarios/c1-guest-settings.json', 'http://court-123456.test:3003', 'work');
  const c2Base = await test('reports/TASK-ES-588/scenarios/c2-guest-features.json', 'http://court-123456.test:3002', 'base');
  const c2Work = await test('reports/TASK-ES-588/scenarios/c2-guest-features.json', 'http://court-123456.test:3003', 'work');

  const out = {
    c1: { base: c1Base, work: c1Work },
    c2: { base: c2Base, work: c2Work }
  };
  let t = JSON.stringify(out, null, 2);
  t = t.replace(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, 'HIDDEN_JWT');
  fs.writeFileSync('reports/TASK-ES-588/scenario-local.json', t, 'utf8');
  console.log("Wrote scenario-local.json");
  process.exit(0);
})();
