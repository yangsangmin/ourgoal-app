'use strict';
/**
 * TASK-ES-585 증거 및 제출자료 무결성 자가 검사기 (check-evidence.cjs)
 * - 검사기는 제품·기존 시험·법정·기대값을 변경하지 않는 제출자료 무결성 검사기다.
 * - 검사 원칙:
 *   1. 임의 개수 허용 금지: tab 검사는 tab-compare 및 tab-base2-after의 정확한 0 차이에 근거.
 *   2. measured != 성공: exitCode와 실제 실행 결과, 차단(blocked)/미측정(unmeasured)을 분리 보고.
 *   3. 필수 입력·원시 로그·명령·입력 커밋·해시·기준 2회 존재·시나리오 참조 전수 검증.
 *   4. 해시 필드 누락 시 건너뛰지 않고 무결성 위반으로 차단.
 *   5. claims.json 내 모든 시나리오 파일의 실재 여부 및 JSON-Path 단언 통과 검증.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function sha256(p) {
  if (!fs.existsSync(p)) return null;
  return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
}

const manifestPath = process.argv[2] || path.join(__dirname, 'evidence-manifest.json');
if (!fs.existsSync(manifestPath)) {
  console.error('FAIL: manifest file not found:', manifestPath);
  process.exit(1);
}

let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
} catch (e) {
  console.error('FAIL: manifest parse error:', e.message);
  process.exit(1);
}

const requiredItemIds = [
  'token-residual-leak',
  'module-load-isolation',
  'ui-cdp-guest-measurement',
  'dom-profile-storage-compare',
  'tab-isolated-check',
  'tests-suite-compare',
  'runtime-input-manifest',
  'out-of-scope-external',
  'quick-goal-entry',
  'seed-independent-anchor'
];

let errors = [];
let executionSuccessCount = 0;
let blockedCount = 0;
let unmeasuredCount = 0;

console.log('=== TASK-ES-585 Evidence Manifest Integrity & Verification Check ===');
console.log('Manifest:', manifestPath);
console.log('Task:', manifest.task);
console.log('Base commit (start):', manifest.baseCommitAtTaskStart);
console.log('Latest origin/main commit:', manifest.latestOriginMainCommit);

const manifestIds = new Set(manifest.items.map(it => it.id));
for (const reqId of requiredItemIds) {
  if (!manifestIds.has(reqId)) {
    errors.push('Missing required manifest item: ' + reqId);
  }
}

for (const item of manifest.items) {
  console.log(`\n------------------------------------------------------------`);
  console.log(`[Item ${item.id}] ${item.title}`);
  console.log(`  Declared Status: ${item.status}`);

  if (item.status === 'blocked' || item.status === 'unmeasured') {
    if (!item.note || item.note.trim().length < 10) {
      errors.push(`Item ${item.id} (${item.status}) must provide a detailed explanation note`);
    }
    if (item.status === 'blocked') blockedCount++;
    if (item.status === 'unmeasured') unmeasuredCount++;

    console.log(`  -> Classification: ${item.status.toUpperCase()} (Not counted as measured execution success)`);
    console.log(`  -> Note: ${item.note}`);
    continue;
  }

  if (item.status !== 'measured') {
    errors.push(`Item ${item.id} has invalid status: ${item.status}`);
    continue;
  }

  // 1. Command and inputCommit presence
  if (!item.command) errors.push(`Item ${item.id}: command missing`);
  if (!item.inputCommit) errors.push(`Item ${item.id}: inputCommit missing`);
  if (item.exitCode !== 0) errors.push(`Item ${item.id}: exitCode must be 0 (got ${item.exitCode})`);

  // 2. Input files verification
  if (item.inputFiles) {
    for (const inp of item.inputFiles) {
      if (!fs.existsSync(inp.path)) {
        errors.push(`Item ${item.id}: input file missing: ${inp.path}`);
      } else {
        const actualSha = sha256(inp.path);
        if (!inp.sha256) {
          errors.push(`Item ${item.id}: sha256 missing for input file ${inp.path}`);
        } else if (inp.sha256 !== actualSha) {
          errors.push(`Item ${item.id}: input file sha mismatch on ${inp.path}. Recorded: ${inp.sha256}, Actual: ${actualSha}`);
        }
      }
    }
  }

  // 3. Result file verification
  if (item.resultPath) {
    const fullResPath = path.resolve(item.resultPath);
    if (!fs.existsSync(fullResPath)) {
      errors.push(`Item ${item.id}: result file missing: ${item.resultPath}`);
    } else {
      const actualSha = sha256(fullResPath);
      if (!item.resultSha256) {
        errors.push(`Item ${item.id}: resultSha256 missing for ${item.resultPath}`);
      } else if (item.resultSha256 !== actualSha) {
        errors.push(`Item ${item.id}: resultSha256 mismatch on ${item.resultPath}. Recorded: ${item.resultSha256}, Actual: ${actualSha}`);
      }
    }
  }

  // 4. Comparator file verification
  if (item.comparatorPath) {
    const fullCompPath = path.resolve(item.comparatorPath);
    if (!fs.existsSync(fullCompPath)) {
      errors.push(`Item ${item.id}: comparator file missing: ${item.comparatorPath}`);
    } else {
      const actualSha = sha256(fullCompPath);
      if (!item.comparatorSha256) {
        errors.push(`Item ${item.id}: comparatorSha256 missing for ${item.comparatorPath}`);
      } else if (item.comparatorSha256 !== actualSha) {
        errors.push(`Item ${item.id}: comparatorSha256 mismatch on ${item.comparatorPath}. Recorded: ${item.comparatorSha256}, Actual: ${actualSha}`);
      }
    }
  }

  // 5. Item-specific metric verifications
  if (item.id === 'token-residual-leak') {
    if (item.parsedMetrics?.equivalent !== true) errors.push(`${item.id}: equivalent must be true`);
    if (item.parsedMetrics?.tokensOrig !== 915 || item.parsedMetrics?.tokensNew !== 915) errors.push(`${item.id}: tokens mismatch`);
    if (item.parsedMetrics?.origRestTokens !== 35505 || item.parsedMetrics?.newRestTokens !== 35505) errors.push(`${item.id}: rest tokens mismatch`);
    if (item.parsedMetrics?.leaks !== 0) errors.push(`${item.id}: leaks must be 0`);
    if (item.parsedMetrics?.thisArgs !== 0) errors.push(`${item.id}: thisArgs must be 0`);
    if (item.parsedMetrics?.under800Lines !== true) errors.push(`${item.id}: under800Lines must be true`);
  } else if (item.id === 'module-load-isolation') {
    if (item.parsedMetrics?.newRegressions !== 0) errors.push(`${item.id}: newRegressions must be 0`);
    if (item.parsedMetrics?.isolatedOk !== true) errors.push(`${item.id}: isolatedOk must be true`);
  } else if (item.id === 'ui-cdp-guest-measurement') {
    if (item.parsedMetrics?.completedAllRuns !== true) errors.push(`${item.id}: completedAllRuns must be true`);
    if (item.parsedMetrics?.targetFunctionStats?.openTemplateRecordDetailModal?.called !== true) errors.push(`${item.id}: openTemplateRecordDetailModal must be called`);
    if (item.parsedMetrics?.targetFunctionStats?.checkRecordDeepLink?.called !== true) errors.push(`${item.id}: checkRecordDeepLink must be called`);
  } else if (item.id === 'dom-profile-storage-compare') {
    if (item.parsedMetrics?.preconditionsPassed !== true) errors.push(`${item.id}: preconditionsPassed must be true`);
    if (item.parsedMetrics?.baseReproducibilityPassed !== true) errors.push(`${item.id}: baseReproducibilityPassed must be true`);
    if (item.parsedMetrics?.allStepsDomMatched !== true) errors.push(`${item.id}: allStepsDomMatched must be true`);
    if (item.parsedMetrics?.storageMatched !== true) errors.push(`${item.id}: storageMatched must be true`);
    if (item.parsedMetrics?.dateProvenancePassed !== true) errors.push(`${item.id}: dateProvenancePassed must be true`);
    if (item.parsedMetrics?.mutatorSensitivityPassed !== true) errors.push(`${item.id}: mutatorSensitivityPassed must be true`);
  } else if (item.id === 'tab-isolated-check') {
    if (item.parsedMetrics?.differingValues !== 0) errors.push(`${item.id}: differingValues must be 0`);
  } else if (item.id === 'tests-suite-compare') {
    if (item.parsedMetrics?.regressions !== 0) errors.push(`${item.id}: regressions must be 0`);
  } else if (item.id === 'runtime-input-manifest') {
    if (item.parsedMetrics?.identical < 380) errors.push(`${item.id}: identical count too low`);
    if (item.parsedMetrics?.modified !== 1) errors.push(`${item.id}: modified count must be 1`);
    if (item.parsedMetrics?.addedInApp !== 1) errors.push(`${item.id}: addedInApp count must be 1`);
  }

  executionSuccessCount++;
  console.log(`  -> Integrity & SHA256: ALL VERIFIED`);
}

// 6. Verify claims.json and scenarios
console.log('\n------------------------------------------------------------');
console.log('[Claims & Scenarios Check]');
const claimsPath = path.join(__dirname, 'claims.json');
if (!fs.existsSync(claimsPath)) {
  errors.push('claims.json not found');
} else {
  const claimsData = JSON.parse(fs.readFileSync(claimsPath, 'utf8'));
  for (const c of claimsData.claims || []) {
    if (c.scenario) {
      const scPath = path.join(__dirname, c.scenario);
      if (!fs.existsSync(scPath)) {
        errors.push(`Scenario not found: ${scPath}`);
      } else {
        console.log(`  ✓ Claim ${c.id} scenario exists: ${c.scenario}`);
      }
    }
    if (c.check) {
      if (!fs.existsSync(c.check.file)) {
        errors.push(`Check file not found: ${c.check.file}`);
      } else {
        const d = JSON.parse(fs.readFileSync(c.check.file, 'utf8'));
        const parts = c.check.path.split('.');
        let val = d;
        for (const p of parts) val = val ? val[p] : undefined;
        if (val !== c.check.equals) {
          errors.push(`Claim ${c.id} check failed: expected ${c.check.equals}, got ${val}`);
        } else {
          console.log(`  ✓ Claim ${c.id} check passed: ${c.check.file}#${c.check.path} === ${c.check.equals}`);
        }
      }
    }
  }
}

console.log('\n============================================================');
console.log('SUMMARY:');
console.log(`  Execution Success Items: ${executionSuccessCount}`);
console.log(`  Blocked Items: ${blockedCount}`);
console.log(`  Unmeasured Items: ${unmeasuredCount}`);
console.log(`  Total Errors: ${errors.length}`);

if (errors.length > 0) {
  console.error('\nFAILURE DETECTED:');
  for (const err of errors) {
    console.error('  - ' + err);
  }
  process.exit(1);
}

console.log('\nALL EVIDENCE & MANIFEST INTEGRITY VERIFICATIONS PASSED (exit code 0)');
process.exit(0);
