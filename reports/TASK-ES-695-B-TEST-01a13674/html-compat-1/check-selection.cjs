const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const vm = require('vm');
const crypto = require('crypto');
const root = path.resolve(__dirname, '../../..');
const base = 'e16de9fb35b924323510bd8521d6ba9361585fef';
const test = 'tests/account-switch-isolation.test.js';
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const git = args => cp.execFileSync('git', ['-c', 'core.longpaths=true', '-c', 'core.autocrlf=false', ...args], { cwd: root });
const create = (name, obj) => fs.writeFileSync(path.join(__dirname, name), JSON.stringify(obj, null, 2) + '\n', { encoding: 'utf8', flag: 'wx' });
const before = git(['show', base + ':' + test]).toString('utf8');
const after = fs.readFileSync(path.join(root, test), 'utf8');
const raw = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const bundle = require(path.join(root, 'tests/helpers/inline-bundle.js'));
const actualCombined = bundle.withInlineCells(raw);
const extractSource = after.slice(after.indexOf('function extractFunction('), after.indexOf('/* ---------- 메모리 localStorage'));
const extractor = vm.runInNewContext(extractSource + '\nextractFunction');
const memSource = after.slice(after.indexOf('function MemStorage('), after.indexOf('/* ---------- 가짜 Supabase'));
const browserSource = extractor(after, 'function makeBrowser(');
const hasLegacy = html => html.indexOf('async function ensureUserRow(') >= 0 || html.indexOf('async function loadProfile(') >= 0;
const block = src => {
  const start = src.indexOf('// The profile loader owns lexical');
  const end = src.indexOf('ctx.loadProfile = win.OurgoalUiHelpers.loadProfile;', start);
  if (start < 0 || end < 0) throw new Error('ACTUAL_IIFE_BLOCK_MISSING');
  return src.slice(start, end + 'ctx.loadProfile = win.OurgoalUiHelpers.loadProfile;'.length).split('\n').map(l => l.trim()).join('\n');
};
const marker = '/* 앱의 이메일 로그인 진입';
const suffix = src => src.slice(src.indexOf(marker));
const asserts = src => src.split('\n').filter(l => /\bassert\./.test(l));
const oldFiles = git(['ls-tree', '-r', '--name-only', base, 'reports/TASK-ES-695-B-TEST-01a13674']).toString('utf8').trim().split('\n').filter(Boolean);
const protectedFiles = ['index.html', 'tests/helpers/inline-bundle.js', 'js/account-isolation.js', 'js/record-ledger.js', 'js/core/capabilities.js', 'js/core/device-save.js', 'js/core/local-keep.js', 'js/core/profile-load.js', ...oldFiles];
const pins = protectedFiles.map(file => {
  const old = git(['show', base + ':' + file]);
  const disk = fs.readFileSync(path.join(root, file));
  return { file, baselineSHA256: hash(old), diskSHA256: hash(disk), identical: old.equals(disk) };
});
const proof = {
  base, testSHA256: hash(after), defaultRawGuard: hasLegacy(raw),
  actualIIFEBlockIdenticalIgnoringIndent: block(before) === block(after),
  originalExtractorIdentical: extractor(before, 'function extractFunction(') === extractor(after, 'function extractFunction('),
  originalHtmlParseUnchanged: before.includes("var HTML_PATH = htmlArg > -1 ? path.resolve(process.argv[htmlArg + 1]) : path.join(ROOT, 'index.html');") && after.includes("var HTML_PATH = htmlArg > -1 ? path.resolve(process.argv[htmlArg + 1]) : path.join(ROOT, 'index.html');"),
  scenarioSuffix: { beforeSHA256: hash(suffix(before)), afterSHA256: hash(suffix(after)), identical: suffix(before) === suffix(after) },
  assertions: { beforeCount: asserts(before).length, afterCount: asserts(after).length, identical: JSON.stringify(asserts(before)) === JSON.stringify(asserts(after)) },
  scenarioCount: [...after.matchAll(/await check\('/g)].length, protectedPins: pins,
  originalSixRerun: false, productChanged: false, helperChanged: false
};
create('SOURCE-PROOF.json', proof);
if (proof.defaultRawGuard || !proof.actualIIFEBlockIdenticalIgnoringIndent || !proof.originalExtractorIdentical || !proof.originalHtmlParseUnchanged || !proof.scenarioSuffix.identical || !proof.assertions.identical || pins.some(p => !p.identical)) throw new Error('SOURCE_PROOF_REJECTED');
create('SINGLE-L1.json', { startedAt: new Date().toISOString(), scope: 'legacy source selection only', runs: 1 });
const cases = [
  { name: 'BOTH_INLINE', ensure: true, load: true },
  { name: 'ENSURE_ONLY', ensure: true, load: false },
  { name: 'LOAD_ONLY', ensure: false, load: true }
];
const observations = cases.map(item => {
  const syntheticRaw = (item.ensure ? "async function ensureUserRow() { return 'L1_INLINE_ENSURE'; }\n" : '') + (item.load ? "async function loadProfile() { return 'L1_INLINE_LOAD'; }\n" : '');
  const combined = bundle.withInlineCells(syntheticRaw);
  const providerReads = [];
  const context = {
    rawHtml: syntheticRaw, html: combined, ROOT: root, fs: { readFileSync: file => { providerReads.push(file); throw new Error('LEGACY_PROVIDER_READ_FORBIDDEN'); } }, path, vm,
    Ledger: {}, isolationSrc: null, browserClient: () => ({}), serverDb: {}, session: { uid: null }, fakeFetch: () => { throw new Error('NO_API'); },
    setTimeout, clearInterval, console
  };
  vm.createContext(context);
  vm.runInContext(extractSource + '\n' + memSource + '\n' + browserSource + '\nthis.selected = makeBrowser();', context, { filename: 'actual test makeBrowser L1 source only' });
  const api = context.selected.api;
  const names = ['ensureUserRow', 'loadProfile', 'saveProfile', 'syncServerRecords', 'migrateGuestDataToUser', 'performLogout'];
  const selected = names.map(name => ({ function: name, originalFirstDeclarationIdentical: api[name].toString() === extractor(combined, 'async function ' + name + '(') }));
  return { condition: item.name, guard: hasLegacy(syntheticRaw), originalFirstDeclarationsAllMatched: selected.every(v => v.originalFirstDeclarationIdentical), selected, providerReads: providerReads.length, actualFunctionsCalled: false, API: false, database: false };
});
const result = { createdAt: new Date().toISOString(), processPID: process.pid, runs: 1, conditions: observations.length, observations, allMatched: observations.every(v => v.guard && v.originalFirstDeclarationsAllMatched && v.providerReads === 0), componentOnly: true, browser: false, remote: false, originalSixRerun: false, actualCI: null, officialCourt: null, usability: null, effect: null };
create('L1-FIRST-RESULT.json', result);
process.stdout.write(JSON.stringify({ conditions: result.conditions, allMatched: result.allMatched, defaultGuard: proof.defaultRawGuard, originalSixRerun: false, ownPID: process.pid, testSHA256: proof.testSHA256 }) + '\n');
if (!result.allMatched) process.exitCode = 1;
