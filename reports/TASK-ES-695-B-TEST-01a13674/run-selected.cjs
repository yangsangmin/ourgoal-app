const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cp = require('child_process');
const root = path.resolve(__dirname, '../..');
const base = '0e785c9d55f157435970bd73c0ff32bf538fe656';
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const git = args => cp.execFileSync('git', ['-c', 'core.longpaths=true', '-c', 'core.autocrlf=false', ...args], { cwd: root });
const create = (name, value) => fs.writeFileSync(path.join(__dirname, name), JSON.stringify(value, null, 2) + '\n', { encoding: 'utf8', flag: 'wx' });
const file = 'tests/account-switch-isolation.test.js';
const before = git(['show', base + ':' + file]).toString('utf8');
const after = fs.readFileSync(path.join(root, file), 'utf8');
const marker = '/* 앱의 이메일 로그인 진입';
if (!before.includes(marker) || !after.includes(marker)) throw new Error('SCENARIO_MARKER_MISSING');
const suffix = s => s.slice(s.indexOf(marker));
const assertions = s => s.split('\n').filter(l => /\bassert\./.test(l)).join('\n');
const checks = s => [...s.matchAll(/await check\('([^']+)'/g)].map(m => m[1]);
const productFiles = ['index.html', 'js/core/capabilities.js', 'js/core/device-save.js', 'js/core/local-keep.js', 'js/core/profile-load.js', 'js/core/home-cockpit.js', 'js/core/server-records-sync.js', 'js/tabs/settings/device-session.js', 'js/tabs/settings/guest-migration.js', 'tests/helpers/inline-bundle.js'];
const pins = productFiles.map(file => {
  const original = git(['show', base + ':' + file]);
  const disk = fs.readFileSync(path.join(root, file));
  return { file, baselineSHA256: hash(original), diskSHA256: hash(disk), byteIdentical: original.equals(disk) };
});
const ciRaw = 'C:/dev/wt/eg18implb-01a13674/reports/TASK-ES-695-B-01a13674/implementation-1/.private/CI-gate-first.log';
const ciMetadata = ciRaw.replace('.private/CI-gate-first.log', 'CI-gate-first-metadata.json');
const raw = fs.readFileSync(ciRaw);
const preservation = {
  baseline: base, productSource: 'e38c65925c51a0d43195e842b3a1c27eda6c76b2',
  beforeSHA256: hash(before), afterSHA256: hash(after),
  scenarioSuffix: { baselineSHA256: hash(suffix(before)), currentSHA256: hash(suffix(after)), identical: suffix(before) === suffix(after) },
  assertions: { baselineCount: before.split('\n').filter(l => /\bassert\./.test(l)).length, currentCount: after.split('\n').filter(l => /\bassert\./.test(l)).length, baselineSHA256: hash(assertions(before)), currentSHA256: hash(assertions(after)), identical: assertions(before) === assertions(after) },
  scenarios: { baselineCount: checks(before).length, currentCount: checks(after).length, identical: JSON.stringify(checks(before)) === JSON.stringify(checks(after)) },
  productPins: pins,
  originalCI: { run: '38509224519', rawPath: ciRaw, rawSHA256: hash(raw), metadataPath: ciMetadata, metadataSHA256: hash(fs.readFileSync(ciMetadata)), missingLoadGenerationOccurrences: (raw.toString('utf8').match(/loadGeneration is not defined/g) || []).length, rawPrinted: false, rawCopied: false },
  recentCommits: git(['log', '-3', '--format=%H %s', '--', file, 'js/core/profile-load.js']).toString('utf8').trim().split('\n'),
  inheritedClaimsSHA256: hash(fs.readFileSync(path.join(root, 'reports/TASK-ES-695-B-01a13674/claims.json'))),
  inheritedREQSHA256: hash(fs.readFileSync(path.join(root, 'docs/specs/REQ-TASK-ES-695-B-01a13674.md'))),
  sourceLookupFailures: [{ code: 'INVALID_LITERAL_GLOB_PATH', resolved: 'rg search from reports directory' }, { code: 'ASSUMED_PROFILE_SAVE_PATH_ABSENT', resolved: 'saveProfile found in js/core/home-cockpit.js:187' }],
  parentScope: 'Same makeBrowser actual four IIFE/context binding; remaining four function extraction unchanged; scenarios/assertions/expectations/product unchanged.'
};
create('SOURCE-PRESERVATION.json', preservation);
if (!preservation.scenarioSuffix.identical || !preservation.assertions.identical || !preservation.scenarios.identical || pins.some(p => !p.byteIdentical)) throw new Error('SOURCE_PRESERVATION_REJECTED');
if (preservation.originalCI.rawSHA256 !== '0b673be518fa04608234118832e2ec0a3b40f7c7a780becb71a4da18eee4816c') throw new Error('ORIGINAL_CI_SHA_MISMATCH');
fs.writeFileSync(path.join(__dirname, 'SINGLE-SELECTED-RUN.json'), JSON.stringify({ baseline: base, startedAt: new Date().toISOString(), scope: file, maxRuns: 1 }) + '\n', { encoding: 'utf8', flag: 'wx' });
const started = Date.now();
const result = cp.spawnSync(process.execPath, [file], { cwd: root, encoding: 'utf8', timeout: 60000, maxBuffer: 4 * 1024 * 1024 });
const output = (result.stdout || '') + (result.stderr || '');
fs.mkdirSync(path.join(__dirname, '.private'), { recursive: true });
fs.writeFileSync(path.join(__dirname, '.private/selected-test-first.log'), output, { encoding: 'utf8', flag: 'wx' });
const count = /결과: (\d+)\/(\d+) 통과/.exec(output);
const measurement = {
  startedAt: new Date(started).toISOString(), finishedAt: new Date().toISOString(), elapsedMs: Date.now() - started,
  command: 'node tests/account-switch-isolation.test.js', runs: 1, childPID: result.pid || null,
  exitCode: result.status, signal: result.signal, errorCode: result.error ? result.error.code : null,
  successfulScenarios: count ? Number(count[1]) : null, totalScenarios: count ? Number(count[2]) : null,
  missingLoadGenerationOccurrences: (output.match(/loadGeneration is not defined/g) || []).length,
  rawPath: '.private/selected-test-first.log', rawSHA256: hash(output),
  componentOnly: true, actualHTTP: null, realAccounts: null, actualCI: null, officialCourt: null, usability: null, effect: null
};
create('SELECTED-RESULT.json', measurement);
process.stdout.write(JSON.stringify(measurement, null, 2) + '\n');
process.exitCode = result.status === 0 ? 0 : 1;
