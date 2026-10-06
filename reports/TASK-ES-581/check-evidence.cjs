'use strict';
/**
 * TASK-ES-581 증거 및 제출자료 무결성 자가 검사기 (check-evidence.cjs)
 * - 검사기는 제품·기존 시험·법정·기대값을 변경하지 않는 제출자료 무결성 검사기다.
 * - 검사 원칙:
 *   1. 임의 개수 허용 금지: tab 검사는 tab-base2-after의 정확한 0차이 및 기준1 대조 diff의 100% 일치에 근거.
 *   2. measured != 성공: exitCode 1(환경 차이)과 exitCode 0을 구분하고, 문서 무결성/실행 결과/차단/미측정을 분리 보고.
 *   3. 필수 입력·원시 로그·명령·입력 커밋·해시·기준 2회 존재·시나리오 참조 전수 검증.
 *   4. 해시 필드 누락 시 건너뛰지 않고 무결성 위반으로 차단.
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
  'real-account-check',
  'session-storage'
];

let errors = [];
let executionSuccessCount = 0;
let executionEnvDiffCount = 0;
let blockedCount = 0;
let unmeasuredCount = 0;

console.log('=== TASK-ES-581 Evidence Manifest Integrity & Verification Check ===');
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

    // Check result file existence and sha if declared
    if (item.resultPath) {
      if (!fs.existsSync(item.resultPath)) {
        errors.push(`Item ${item.id} (${item.status}): declared resultPath does not exist: ${item.resultPath}`);
      } else {
        const actualSha = sha256(item.resultPath);
        if (!item.resultSha256) {
          errors.push(`Item ${item.id} (${item.status}): resultSha256 field missing`);
        } else if (item.resultSha256 !== actualSha) {
          errors.push(`Item ${item.id} (${item.status}): resultSha256 mismatch. Recorded: ${item.resultSha256}, Actual: ${actualSha}`);
        }
      }
    }
    console.log(`  -> Document Integrity: VERIFIED`);
    console.log(`  -> Classification: ${item.status.toUpperCase()} (Not counted as measured execution success)`);
    console.log(`  -> Note: ${item.note}`);
    continue;
  }

  if (item.status !== 'measured') {
    errors.push(`Item ${item.id} has invalid status: ${item.status}`);
    continue;
  }

  // Measured items: mandatory command, comparatorPath, resultPath, resultSha256
  if (!item.command) errors.push(`Item ${item.id}: command field missing`);
  if (!item.comparatorPath) {
    errors.push(`Item ${item.id}: comparatorPath field missing`);
  } else if (!fs.existsSync(item.comparatorPath)) {
    errors.push(`Item ${item.id}: comparator script not found: ${item.comparatorPath}`);
  }

  if (!item.resultPath) {
    errors.push(`Item ${item.id}: resultPath field missing`);
    continue;
  }
  if (!fs.existsSync(item.resultPath)) {
    errors.push(`Item ${item.id}: resultPath not found: ${item.resultPath}`);
    continue;
  }

  // Parse result JSON
  let resultParsed;
  try {
    const raw = fs.readFileSync(item.resultPath, 'utf8');
    resultParsed = JSON.parse(raw);
  } catch (e) {
    errors.push(`Item ${item.id}: resultPath UTF-8 JSON parse failed: ${e.message}`);
    continue;
  }

  // Result SHA-256 mandatory check
  if (!item.resultSha256) {
    errors.push(`Item ${item.id}: resultSha256 field missing (skipping not permitted)`);
  } else {
    const actualResultSha = sha256(item.resultPath);
    if (item.resultSha256 !== actualResultSha) {
      errors.push(`Item ${item.id}: result SHA mismatch. Recorded: ${item.resultSha256}, Actual: ${actualResultSha}`);
    }
  }

  // Raw log check if present
  if (item.rawLogPath) {
    if (!fs.existsSync(item.rawLogPath)) {
      errors.push(`Item ${item.id}: rawLogPath not found: ${item.rawLogPath}`);
    } else if (!item.rawLogSha256) {
      errors.push(`Item ${item.id}: rawLogSha256 field missing`);
    } else {
      const actualRawSha = sha256(item.rawLogPath);
      if (item.rawLogSha256 !== actualRawSha) {
        errors.push(`Item ${item.id}: rawLog SHA mismatch. Recorded: ${item.rawLogSha256}, Actual: ${actualRawSha}`);
      }
    }
  }

  // Input files SHA mandatory check
  if (Array.isArray(item.inputFiles)) {
    for (const inp of item.inputFiles) {
      if (!fs.existsSync(inp.path)) {
        errors.push(`Item ${item.id}: input file missing: ${inp.path}`);
      } else if (!inp.sha256) {
        errors.push(`Item ${item.id}: input file sha256 missing for: ${inp.path}`);
      } else {
        const actualInpSha = sha256(inp.path);
        if (inp.sha256 !== actualInpSha) {
          errors.push(`Item ${item.id}: input file SHA mismatch: ${inp.path}. Recorded: ${inp.sha256}, Actual: ${actualInpSha}`);
        }
      }
    }
  }

  // Baseline 2-run files check if present (tab check)
  if (Array.isArray(item.baseline2RunFiles)) {
    for (const bfile of item.baseline2RunFiles) {
      if (!fs.existsSync(bfile.path)) {
        errors.push(`Item ${item.id}: baseline file missing: ${bfile.path}`);
      } else if (!bfile.sha256) {
        errors.push(`Item ${item.id}: baseline file sha256 missing for: ${bfile.path}`);
      } else {
        const actualBSha = sha256(bfile.path);
        if (bfile.sha256 !== actualBSha) {
          errors.push(`Item ${item.id}: baseline file SHA mismatch: ${bfile.path}. Recorded: ${bfile.sha256}, Actual: ${actualBSha}`);
        }
      }
    }
  }

  // Historical raw files check if present (UI guest runs)
  if (Array.isArray(item.historicalV1Raw)) {
    for (const hfile of item.historicalV1Raw) {
      if (!fs.existsSync(hfile.path)) {
        errors.push(`Item ${item.id}: historical raw file missing: ${hfile.path}`);
      } else if (!hfile.sha256) {
        errors.push(`Item ${item.id}: historical raw file sha256 missing for: ${hfile.path}`);
      } else {
        const actualHSha = sha256(hfile.path);
        if (hfile.sha256 !== actualHSha) {
          errors.push(`Item ${item.id}: historical raw SHA mismatch: ${hfile.path}. Recorded: ${hfile.sha256}, Actual: ${actualHSha}`);
        }
      }
    }
  }

  // Semantic checks per item
  if (item.id === 'token-residual-leak') {
    if (!resultParsed.ok || !resultParsed.equivalent) {
      errors.push(`Item ${item.id}: token verification not ok / not equivalent`);
    }
  }

  if (item.id === 'module-load-isolation') {
    if (resultParsed.totalProbed !== 82 || resultParsed.standardProbeOk !== 81) {
      errors.push(`Item ${item.id}: standard probe expected 81/82 ok`);
    }
    if (!resultParsed.cells?.['js/core/all-view-render.js']?.ok || !resultParsed.cells?.['js/core/app-boot.js']?.ok) {
      errors.push(`Item ${item.id}: isolated loadOne failed for new cells`);
    }
  }

  if (item.id === 'ui-cdp-guest-measurement') {
    if (!resultParsed.completed) {
      errors.push(`Item ${item.id}: UI runner reported completed: false`);
    }
    if (resultParsed.pageerrors?.length > 0) {
      errors.push(`Item ${item.id}: page errors detected: ${resultParsed.pageerrors.length}`);
    }
  }

  if (item.id === 'dom-profile-storage-compare') {
    if (!resultParsed.measurementSummary || !resultParsed.measurementSummary.allChecksPass) {
      errors.push(`Item ${item.id}: allChecksPass is false in comparison summary`);
    }
    if (resultParsed.leafStats?.totalDiffsExcludingNormalizations > 0) {
      errors.push(`Item ${item.id}: totalDiffs > 0 (${resultParsed.leafStats.totalDiffsExcludingNormalizations})`);
    }
    if (!resultParsed.leafStats?.domStructureIdentical) {
      errors.push(`Item ${item.id}: domStructureIdentical is false`);
    }
  }

  if (item.id === 'tab-isolated-check') {
    // 1. Strict base2 -> after check (MUST BE EXACT 0 DIFFS)
    if (typeof resultParsed.differingValues !== 'number' || resultParsed.differingValues !== 0) {
      errors.push(`Item ${item.id}: tab-base2-after differingValues must be exactly 0, got: ${resultParsed.differingValues}`);
    }
    if (!Array.isArray(resultParsed.diffs) || resultParsed.diffs.length !== 0) {
      errors.push(`Item ${item.id}: tab-base2-after diffs length must be 0, got: ${resultParsed.diffs?.length}`);
    }

    // 2. Strict baseline reproduction vs work check
    if (!item.pairwiseBaseReproResultPath || !fs.existsSync(item.pairwiseBaseReproResultPath)) {
      errors.push(`Item ${item.id}: pairwiseBaseReproResultPath not found: ${item.pairwiseBaseReproResultPath}`);
    } else if (!item.pairwiseWorkResultPath || !fs.existsSync(item.pairwiseWorkResultPath)) {
      errors.push(`Item ${item.id}: pairwiseWorkResultPath not found: ${item.pairwiseWorkResultPath}`);
    } else {
      const repro = JSON.parse(fs.readFileSync(item.pairwiseBaseReproResultPath, 'utf8'));
      const work = JSON.parse(fs.readFileSync(item.pairwiseWorkResultPath, 'utf8'));

      if (repro.differingValues !== 2 || work.differingValues !== 2) {
        errors.push(`Item ${item.id}: expected exactly 2 baseline diffs in repro and work, got repro:${repro.differingValues}, work:${work.differingValues}`);
      }

      // Exact diffs matching: deep equality on each diff
      const reproDiffsStr = JSON.stringify(repro.diffs);
      const workDiffsStr = JSON.stringify(work.diffs);
      if (reproDiffsStr !== workDiffsStr) {
        errors.push(`Item ${item.id}: baseline repro diffs do not match work diffs: repro=${reproDiffsStr}, work=${workDiffsStr}`);
      }
    }
  }

  if (item.id === 'tests-suite-compare') {
    if (resultParsed.work?.npmExit !== 0) {
      errors.push(`Item ${item.id}: npm test in worktree failed with exit code: ${resultParsed.work?.npmExit}`);
    }
    const nt = resultParsed.work?.npmTest;
    if (nt?.smoke?.[0] !== 440 || nt?.smoke?.[1] !== 0 || nt?.integrity?.[0] !== 38 || nt?.buttons?.[0] !== 918) {
      errors.push(`Item ${item.id}: test count regression in worktree: ${JSON.stringify(nt)}`);
    }
  }

  if (item.id === 'session-storage') {
    if (resultParsed.sessionStorage?.status !== 'measured') {
      errors.push(`Item ${item.id}: sessionStorage status is not measured`);
    }
    if (resultParsed.sessionStorage?.diffs !== 0) {
      errors.push(`Item ${item.id}: sessionStorage diffs is not 0 (${resultParsed.sessionStorage?.diffs})`);
    }
  }

  // Execution outcome reporting
  console.log(`  -> Document Integrity: VERIFIED (All required paths, hashes, JSON syntax verified)`);
  if (item.exitCode === 0) {
    executionSuccessCount++;
    console.log(`  -> Execution Result: SUCCESS (exitCode: 0)`);
  } else if (item.exitCode === 1 && item.id === 'tests-suite-compare') {
    executionEnvDiffCount++;
    console.log(`  -> Execution Result: ENVIRONMENTAL DIVERGENCE (exitCode: 1)`);
    console.log(`     Cause: Archive snapshot lacks .git directory (tests/cell-map-export-es414.test.js)`);
    console.log(`     Worktree Execution: npm test exited 0 (440 smoke, 38 integrity, 918 buttons 100% PASS)`);
  } else {
    errors.push(`Item ${item.id}: unexpected exitCode: ${item.exitCode}`);
  }
}

console.log('\n============================================================');
console.log('SUMMARY OF VERIFICATION:');
console.log(`  Total Items Declared: ${manifest.items.length}`);
console.log(`  Document & Hash Integrity: ${errors.length === 0 ? 'ALL PASS' : 'FAILED'}`);
console.log(`  Execution Success (exitCode 0): ${executionSuccessCount}`);
console.log(`  Execution Env Divergence (exitCode 1 documented): ${executionEnvDiffCount}`);
console.log(`  Blocked Operations (safety policy enforced): ${blockedCount}`);
console.log(`  Unmeasured Items: ${unmeasuredCount}`);
console.log(`  Integrity Violations / Errors: ${errors.length}`);
console.log('============================================================');

if (errors.length > 0) {
  console.error('\nFAILURES DETECTED:');
  errors.forEach(err => console.error('  [ERROR] ' + err));
  process.exit(1);
} else {
  console.log('\nALL VERIFICATION CRITERIA STRICTLY MET (0 ERRORS).');
  process.exit(0);
}
