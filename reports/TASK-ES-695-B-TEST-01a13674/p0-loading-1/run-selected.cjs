'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process'), crypto = require('crypto'), vm = require('vm');
const root = path.resolve(__dirname, '../../..'), base = '9cfb8574e3acb62f259b9991df5ef2f84bb506ca';
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const git = args => cp.execFileSync('git', ['-c', 'core.longpaths=true', '-c', 'core.autocrlf=false', ...args], { cwd: root });
const create = (name, value) => fs.writeFileSync(path.join(__dirname, name), JSON.stringify(value, null, 2) + '\n', { encoding: 'utf8', flag: 'wx' });
const directFile = 'tests/direct-login-guard.test.js', p0File = 'tests/local-keep-p0.test.js';
const beforeDirect = git(['show', base + ':' + directFile]).toString('utf8'), afterDirect = fs.readFileSync(path.join(root, directFile), 'utf8');
const extractorSource = afterDirect.slice(afterDirect.indexOf('function extractFunction('), afterDirect.indexOf('/* ---------- 메모리 localStorage'));
const extract = vm.runInNewContext(extractorSource + '\nextractFunction');
const outside = (src, header) => src.replace(extract(src, header), '[UNCHANGED_READER_BOUNDARY]');
const assertionLines = src => src.split('\n').filter(line => /\bassert\./.test(line)).join('\n');
const beforeP0 = git(['show', base + ':' + p0File]).toString('utf8'), afterP0 = fs.readFileSync(path.join(root, p0File), 'utf8');
const normalizeDirect = src => src.replace("var rawHtml = fs.readFileSync(HTML_PATH, 'utf8');\nvar html = require('./helpers/inline-bundle').withInlineCells(rawHtml);", "var html = require('./helpers/inline-bundle').withInlineCells(fs.readFileSync(HTML_PATH, 'utf8'));");
const markers = ['function defaultProfile(', 'async function sha256Hex(', 'async function saveProfile(', 'async function migrateGuestDataToUser(', 'async function performLogout(', 'async function loginWithDirectIdentifier('];
const originalEight = "  var names = ['function defaultProfile(', 'async function sha256Hex(', 'async function ensureUserRow(', 'async function loadProfile(', 'async function saveProfile(', 'async function migrateGuestDataToUser(', 'async function performLogout(', 'async function loginWithDirectIdentifier('];";
const rawHTML = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const protectedFiles = ['js/core/device-save.js', 'js/core/home-cockpit.js', 'js/core/profile-load.js', 'js/core/local-keep.js', 'js/core/virtual-user-helpers.js', 'js/tabs/settings/account-actions.js', 'js/core/capabilities.js', 'js/record-ledger.js', 'js/account-isolation.js', 'js/direct-login-guard.js', 'index.html', 'docs/architecture/modules.json', 'reports/TASK-ES-695-B-01a13674/claims.json', 'tests/account-switch-isolation.test.js', 'tests/record-ledger-sync.test.js', 'tests/helpers/inline-bundle.js'];
const pins = protectedFiles.map(file => { const before = git(['show', base + ':' + file]), disk = fs.readFileSync(path.join(root, file)); return { file, baselineSHA256: sha(before), diskSHA256: sha(disk), byteIdentical: before.equals(disk) }; });
const ciDir = 'C:/Users/HP/기업화/01a13674/PR982-CI-38514502201', ciRaw = fs.readFileSync(ciDir + '/first.log'), ciMetadata = fs.readFileSync(ciDir + '/metadata.json');
const meta = JSON.parse(ciMetadata), ciCount = /local-keep-p0: ([0-9]+)\/([0-9]+)/.exec(meta.selected.join('\n'));
if (sha(ciRaw) !== '940e133457d4dfde8d05cb7c63a057c85296d9cd7bbb4db55bf685a0cc6191bc') throw Error('ORIGINAL_CI_RAW_CHANGED');
const proof = {
  base, originalCI: { run: meta.run, head: meta.head, rawPath: ciDir + '/first.log', rawSHA256: sha(ciRaw), metadataSHA256: sha(ciMetadata), passed: ciCount ? Number(ciCount[1]) : null, total: ciCount ? Number(ciCount[2]) : null, requestTypeErrors: (ciRaw.toString('utf8').match(/Cannot read properties of undefined \(reading 'request'\)/g) || []).length, rawCopied: false, rawPrinted: false },
  p0: { beforeSHA256: sha(beforeP0), afterSHA256: sha(afterP0), outsideBootIdentical: outside(beforeP0, 'function boot(') === outside(afterP0, 'function boot('), assertionLinesIdentical: assertionLines(beforeP0) === assertionLines(afterP0), assertionCount: afterP0.split('\n').filter(line => /\bassert\./.test(line)).length, allConditions: [...afterP0.matchAll(/^check(?:Async)?\('/gm)].length, selectedCoupled: [...afterP0.matchAll(/^checkAsync\('/gm)].length, directConditionsNotRerun: [...afterP0.matchAll(/^check\('/gm)].length },
  direct: { beforeSHA256: sha(beforeDirect), afterSHA256: sha(afterDirect), outsideMakeBrowserAndRawReadIdentical: outside(beforeDirect, 'function makeBrowser(') === outside(normalizeDirect(afterDirect), 'function makeBrowser('), fixtureScenarioSuffixIdentical: beforeDirect.slice(beforeDirect.indexOf('/* 이메일 로그인 진입')) === afterDirect.slice(afterDirect.indexOf('/* 이메일 로그인 진입')), assertionLinesIdentical: assertionLines(beforeDirect) === assertionLines(afterDirect), assertionCount: afterDirect.split('\n').filter(line => /\bassert\./.test(line)).length, allConditions: [...afterDirect.matchAll(/await check\('/g)].length, legacyOriginalEightHeadersIdentical: beforeDirect.includes(originalEight) && afterDirect.includes(originalEight), defaultRawHasProfileHeader: rawHTML.includes('async function ensureUserRow(') || rawHTML.includes('async function loadProfile('), remainingSixHeaders: markers, actualFailureBeforeCorrection: null },
  protectedPins: pins, recentCommits: git(['log', '-3', '--format=%H %s', '--', p0File, 'js/core/profile-load.js']).toString('utf8').trim().split('\n'),
  sourceReadOnlyOther: { recordLedgerSync: 'line222 is string inclusion assertion, no PL runtime loader; unchanged', directCause: 'makeBrowser183 flattened lexical profile-load, actual call in case6 317/320; baseline failure observation null' },
  inheritedCourtAtAssignment: { readyTrigger: '38514755117', statusAtAssignment: 'running', refreshed: null, syncRun: '38514500405', syncRunCancelledIsVerdict: false, first68BAReturnCount: 1, normalMerge: false },
  actualCI: null, Court: null, use: null, effect: null, auth: false, API: false, DB: false, browser: false, remote: false
};
create('SOURCE-PRESERVATION.json', proof);
if (!proof.p0.outsideBootIdentical || !proof.p0.assertionLinesIdentical || !proof.direct.outsideMakeBrowserAndRawReadIdentical || !proof.direct.fixtureScenarioSuffixIdentical || !proof.direct.assertionLinesIdentical || !proof.direct.legacyOriginalEightHeadersIdentical || proof.direct.defaultRawHasProfileHeader || pins.some(v => !v.byteIdentical)) throw Error('ORIGINAL_SOURCE_CONTRACT_NOT_PRESERVED');
create('SINGLE-SELECTED-RUN.json', { startedAt: new Date().toISOString(), selected: ['p0-four', 'direct-sixth'], runsEach: 1, source: base });
fs.mkdirSync(__dirname + '/.private', { recursive: true });
const observations = ['p0-four', 'direct-sixth'].map(selection => {
  const started = Date.now(), result = cp.spawnSync(process.execPath, [path.join(__dirname, 'selected-module.cjs'), selection, '--json'], { cwd: root, encoding: 'utf8', timeout: 15000, maxBuffer: 2 * 1024 * 1024 });
  const output = (result.stdout || '') + (result.stderr || '');
  fs.writeFileSync(__dirname + '/.private/' + selection + '-first.log', output, { encoding: 'utf8', flag: 'wx' });
  const jsonLines = (result.stdout || '').split(/\r?\n/).filter(line => line.startsWith('{')).map(line => { try { return JSON.parse(line); } catch { return null; } }).filter(v => v && typeof v.total === 'number');
  const counts = jsonLines.at(-1);
  return { selection, runs: 1, childPID: result.pid || null, startedAt: new Date(started).toISOString(), elapsedMs: Date.now() - started, exitCode: result.status, signal: result.signal, errorCode: result.error?.code || null, total: counts?.total ?? null, passed: counts?.passed ?? null, failed: counts?.failed ?? null, results: counts?.results?.map(v => ({ scenario: v.name, measured: v.ok, error: v.error || v.err || null })) || null, rawPath: '.private/' + selection + '-first.log', rawSHA256: sha(output), scopedL1: true, fullOriginalSuiteRun: false };
});
const result = { source: base, observations, originalP0Total: proof.p0.allConditions, originalDirectTotal: proof.direct.allConditions, originalDirect22Repeated: false, originalOtherFiveRepeated: false, originalAccountSixRepeated: false, actualCI: null, Court: null, use: null, effect: null, actualAccount: false, auth: false, SDKNetwork: false, API: false, DB: false, browser: false, photoPreservationAuthority: null };
create('FIRST-SELECTED-RESULT.json', result);
console.log(JSON.stringify({ observations: observations.map(v => ({ selection: v.selection, total: v.total, passed: v.passed, failed: v.failed, exitCode: v.exitCode, ownPID: v.childPID })), originalP0Total: proof.p0.allConditions, originalDirectTotal: proof.direct.allConditions, sourceSHA256: { p0: proof.p0.afterSHA256, direct: proof.direct.afterSHA256 }, firstResultSHA256: sha(fs.readFileSync(__dirname + '/FIRST-SELECTED-RESULT.json')) }));
if (observations.some(v => v.exitCode !== 0 || v.failed !== 0)) process.exitCode = 1;
