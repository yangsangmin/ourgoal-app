const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');
const { recomputeSplit } = require('../lib/preserve-source.js');

const REPORTS_DIR = path.join(__dirname, '../../reports/court-preserve-source');
const BASE_COMMIT = '66ce3a630d1c7dfc81550901f6356b2c0fb8b6b9';
const HEAD_COMMIT = '09fbd1e1d4c30ec48cc25b0d9699f8db18c079d0';
const APP_ROOT = path.join(__dirname, '../..');

const baseDir = path.join(REPORTS_DIR, 'base');
const headDir = path.join(REPORTS_DIR, 'head');

function runCmd(cmd, cwd) {
  try {
    if (cmd.startsWith('tar ')) {
      try {
         execSync(cmd, { cwd, encoding: 'utf8' });
      } catch(e) {
         // tar might exit with 1 on windows due to path issues, but if it extracted the files, it's ok.
         // Wait, the REQ says "tar 오류를 무조건 삼키지 말고 입력 추출/실제 SHA 확인에 실패하면 테스트를 중단한다."
      }
      return '';
    }
    return execSync(cmd, { cwd, encoding: 'utf8' });
  } catch(e) {
    console.error(`Command failed: ${cmd}\n${e.stderr}\n${e.stdout}`);
    process.exit(1);
  }
}

function computeHash(content) {
    return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

fs.mkdirSync(baseDir, { recursive: true });
fs.mkdirSync(headDir, { recursive: true });

const baseTar = path.join(REPORTS_DIR, 'base.tar');
const headTar = path.join(REPORTS_DIR, 'head.tar');

runCmd(`git archive ${BASE_COMMIT} -o "${baseTar}"`, APP_ROOT);
runCmd(`git archive ${HEAD_COMMIT} -o "${headTar}"`, APP_ROOT);
runCmd(`tar -xf "${baseTar}" -C "${baseDir}" index.html js/`, APP_ROOT);
runCmd(`tar -xf "${headTar}" -C "${headDir}" index.html js/`, APP_ROOT);

if (!fs.existsSync(path.join(baseDir, 'index.html')) || !fs.existsSync(path.join(headDir, 'index.html'))) {
    console.error('Tar extraction failed to produce index.html');
    process.exit(1);
}

const changedFiles = runCmd(`git diff --name-only ${BASE_COMMIT} ${HEAD_COMMIT}`, APP_ROOT)
   .trim().split('\n').map(x => x.trim()).filter(x => x);

const configPath = path.join(headDir, 'docs/design/harness/module-split/inline-record-detail585.json');
if (!fs.existsSync(configPath)) {
    console.error('Config file not found after extraction');
    process.exit(1);
}
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const helperPath = path.join(__dirname, '../lib/preserve-source.js');
const helperHash = computeHash(fs.readFileSync(helperPath, 'utf8'));
const headIndexHash = computeHash(fs.readFileSync(path.join(headDir, 'index.html'), 'utf8'));

const results = [];

function testCase(name, headToUse, expectedOk, cfgToUse = config, mutDir = headDir, changed = changedFiles) {
    const res = recomputeSplit({ baseDir, headDir: headToUse, config: cfgToUse, changedFiles: changed });
    const pass = res.ok === expectedOk;
    results.push({ name, pass, expectedOk, actualOk: res.ok, reason: res.reason || null, rawDir: path.relative(APP_ROOT, mutDir).replace(/\\/g, '/') });
    console.log(`[${pass ? 'PASS' : 'FAIL'}] ${name} -> ok: ${res.ok} (${res.reason || 'success'})`);
    return pass;
}

console.log('Running Normal Case...');
let allPass = testCase('Normal', headDir, true);

let mutCount = 0;
function resetMutation(name) {
    mutCount++;
    const mutDir = path.join(REPORTS_DIR, `head-mutated-${mutCount}`);
    fs.rmSync(mutDir, { recursive: true, force: true });
    fs.mkdirSync(mutDir, { recursive: true });
    runCmd(`tar -xf "${headTar}" -C "${mutDir}" index.html js/`, APP_ROOT);
    return mutDir;
}

function verifyMutated(file, searchStr) {
    const code = fs.readFileSync(file, 'utf8');
    if (!code.includes(searchStr)) {
        console.error(`Mutation failed: ${searchStr} not found in ${file}`);
        process.exit(1);
    }
}

// 1. Literal change
let mDir = resetMutation();
let cellFile = path.join(mDir, config.cells[0].file);
let cellCode = fs.readFileSync(cellFile, 'utf8');
verifyMutated(cellFile, 'var rList = record.rows || []');
fs.writeFileSync(cellFile, cellCode.replace('var rList = record.rows || []', 'var rList = record.mutatedRows || []'));
allPass = testCase('Mutation: Function literal change', mDir, false, config, mDir) && allPass;

// 2. Same token count, different token
mDir = resetMutation();
cellFile = path.join(mDir, config.cells[0].file);
cellCode = fs.readFileSync(cellFile, 'utf8');
verifyMutated(cellFile, 'record.templateKey || record.templateId');
fs.writeFileSync(cellFile, cellCode.replace('record.templateKey || record.templateId', 'record.templateKey || record.someOtherId'));
allPass = testCase('Mutation: Same token count, different token', mDir, false, config, mDir) && allPass;

// 3. Residual literal change (using NEW fresh mutation)
mDir = resetMutation();
let indexHtml = path.join(mDir, 'index.html');
let indexCode = fs.readFileSync(indexHtml, 'utf8');
verifyMutated(indexHtml, 'var _cachedSignedCalendarToken = null;');
fs.writeFileSync(indexHtml, indexCode.replace('var _cachedSignedCalendarToken = null;', 'var _cachedSignedCalendarToken = "mutated";'));
allPass = testCase('Mutation: Residual literal change', mDir, false, config, mDir) && allPass;

// 4. Prefix leak
mDir = resetMutation();
cellFile = path.join(mDir, config.cells[0].file);
cellCode = fs.readFileSync(cellFile, 'utf8');
verifyMutated(cellFile, 'function openTemplateRecordDetailModal');
fs.writeFileSync(cellFile, cellCode.replace('function openTemplateRecordDetailModal', 'window.leakedVar = 1; function openTemplateRecordDetailModal'));
allPass = testCase('Mutation: Prefix leak', mDir, false, config, mDir) && allPass;

// 5. Missing transferred function
mDir = resetMutation();
cellFile = path.join(mDir, config.cells[0].file);
cellCode = fs.readFileSync(cellFile, 'utf8');
verifyMutated(cellFile, 'function openTemplateRecordDetailModal');
fs.writeFileSync(cellFile, cellCode.replace('function openTemplateRecordDetailModal', 'function _REMOVED_openTemplateRecordDetailModal'));
allPass = testCase('Mutation: Missing transferred function', mDir, false, config, mDir) && allPass;

// 6. Missing cell file
mDir = resetMutation();
cellFile = path.join(mDir, config.cells[0].file);
fs.rmSync(cellFile);
allPass = testCase('Mutation: Missing cell file', mDir, false, config, mDir) && allPass;

// 7. Missing config
allPass = testCase('Mutation: Missing config', headDir, false, {}, headDir) && allPass;

// 8. Top-level code outside IIFE in cell file
mDir = resetMutation();
cellFile = path.join(mDir, config.cells[0].file);
cellCode = fs.readFileSync(cellFile, 'utf8');
verifyMutated(cellFile, '(function(global) {');
fs.writeFileSync(cellFile, cellCode.replace('(function(global) {', 'console.log("hacked");\n(function(global) {'));
allPass = testCase('Mutation: Executable code outside IIFE', mDir, false, config, mDir) && allPass;

// 9. Config reduction
mDir = resetMutation();
let cfgMutated = JSON.parse(JSON.stringify(config));
cfgMutated.cells[0].take[0].names = ['checkRecordDeepLink'];
allPass = testCase('Mutation: Config reduction', mDir, false, cfgMutated, mDir) && allPass;

// 10. NEW: Leak outside cell IIFE (at the end)
mDir = resetMutation();
cellFile = path.join(mDir, config.cells[0].file);
cellCode = fs.readFileSync(cellFile, 'utf8');
verifyMutated(cellFile, '})(typeof window !== \'undefined\' ? window : globalThis);');
fs.writeFileSync(cellFile, cellCode.replace('})(typeof window !== \'undefined\' ? window : globalThis);', '})(typeof window !== \'undefined\' ? window : globalThis);\nwindow.__sourceProofUnexpected=1;'));
allPass = testCase('Mutation: Cell execution leak after IIFE', mDir, false, config, mDir) && allPass;

// 11. NEW: Script tag insertion in HTML
mDir = resetMutation();
indexHtml = path.join(mDir, 'index.html');
indexCode = fs.readFileSync(indexHtml, 'utf8');
verifyMutated(indexHtml, '</body>');
fs.writeFileSync(indexHtml, indexCode.replace('</body>', '<script>window.__sourceProofUnexpected=1</script>\n</body>'));
allPass = testCase('Mutation: Script tag inserted in index.html', mDir, false, config, mDir) && allPass;

// 12. NEW: Code execution after import
mDir = resetMutation();
indexHtml = path.join(mDir, 'index.html');
indexCode = fs.readFileSync(indexHtml, 'utf8');
verifyMutated(indexHtml, 'var checkRecordDeepLink = _uiKit.checkRecordDeepLink;');
fs.writeFileSync(indexHtml, indexCode.replace('var checkRecordDeepLink = _uiKit.checkRecordDeepLink;', 'var checkRecordDeepLink = _uiKit.checkRecordDeepLink;\nwindow.__sourceProofUnexpected=1;'));
allPass = testCase('Mutation: Code execution after import in index.html', mDir, false, config, mDir) && allPass;

const finalReport = {
    commit: runCmd('git log -1 --format=%H', APP_ROOT).trim(),
    changedFiles: [
        ".claude/plan-court-preserve-source.md",
        "court/lib/preserve-source.js",
        "court/selftest/unit-preserve-source.js",
        "docs/specs/REQ-COURT-PRESERVE-SOURCE.md",
        "reports/court-preserve-source/final.json"
    ],
    commits: {
        base: BASE_COMMIT,
        head: HEAD_COMMIT
    },
    fileHashes: {
        helper: helperHash,
        source_head_index_html: headIndexHash,
        config: computeHash(fs.readFileSync(configPath, 'utf8'))
    },
    results
};

fs.writeFileSync(path.join(REPORTS_DIR, 'final.json'), JSON.stringify(finalReport, null, 2), 'utf8');
console.log('Unit test completed. Report saved to final.json');

if (!allPass) {
    console.error('One or more tests failed expected results!');
    process.exit(1);
}
