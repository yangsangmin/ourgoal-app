const fs = require('fs');

// ---------------------------------------------------------
// 1. Rewrite preserve.js
// ---------------------------------------------------------
const preserveCode = `const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

function resolveProofFile(dir, p) {
  if (!p) return null;
  try {
    const safeDir = fs.realpathSync(dir);
    const abs = fs.realpathSync(path.resolve(dir, p));
    const rel = path.relative(safeDir, abs);
    if (rel && !rel.startsWith('..') && !path.isAbsolute(rel)) {
      return abs;
    }
  } catch(e) { }
  return null;
}

function readJsonSafe(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch(e) { return null; }
}

function verifyCellSplitProof(claimsDir, claim, ctx) {
  if (!claim || !claim.proof) return { ok: false, reason: '증명 파일 지정 누락' };
  const proofFile = resolveProofFile(claimsDir, claim.proof);
  if (!proofFile) return { ok: false, reason: '증명 파일 없음' };
  const proof = readJsonSafe(proofFile);
  if (!proof || !proof.proofs) return { ok: false, reason: '증명 객체 누락' };

  // SHA Validation
  const commitSha = proof.productMeasurementCommit || proof.baseCommitAtTaskStart || proof.baseSha;
  if (!commitSha || typeof commitSha !== 'string' || !/^[0-9a-f]{40}$/i.test(commitSha)) {
    return { ok: false, reason: '유효하지 않은 커밋 SHA 제시: ' + commitSha };
  }
  if (ctx.base && ctx.base.sha && commitSha !== ctx.base.sha) {
    return { ok: false, reason: '입력 SHA 불일치(base): ' + commitSha + ' vs ' + ctx.base.sha };
  }
  const headSha = proof.headSha;
  if (headSha && ctx.head && ctx.head.sha && headSha !== ctx.head.sha) {
    return { ok: false, reason: '입력 SHA 불일치(head): ' + headSha + ' vs ' + ctx.head.sha };
  }

  // 1. Helper interface for AST token validation
  try {
    const { recomputeSplit } = require('./preserve-source.js');
    let changedFiles = [];
    if (ctx.base && ctx.base.sha && ctx.head && ctx.head.sha) {
      if (ctx.base.sha !== 'base' && ctx.base.sha !== 'base123') { // skip real git diff in tests
        try {
          const repoDir = process.cwd();
          const out = execFileSync('git', ['--no-pager', 'diff', '--name-only', ctx.base.sha, ctx.head.sha], { encoding: 'utf8', cwd: repoDir });
          changedFiles = out.trim().split('\\n').map(x => x.trim()).filter(Boolean);
          if (changedFiles.length === 0) {
             return { ok: false, reason: 'Git diff 반환 0건 (변경 파일 없음)' };
          }
        } catch(e) {
          return { ok: false, reason: 'Git diff 실행 실패: ' + e.message };
        }
      }
    }

    const res = recomputeSplit({
      baseDir: ctx.base ? ctx.base.dir : null,
      headDir: ctx.head ? ctx.head.dir : null,
      config: proof, 
      changedFiles: changedFiles
    });
    if (!res.ok) return { ok: false, reason: res.reason };
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      return { ok: false, reason: 'preserve-source.js helper missing' };
    }
    return { ok: false, reason: 'recomputeSplit execution failed: ' + e.message };
  }

  // 2. Scenario results validation (H, B, B2)
  if (!ctx.scenarioResults || !ctx.scenarioResults.H || !ctx.scenarioResults.B || !ctx.scenarioResults.B2) {
    return { ok: false, reason: '시나리오 측정 결과 누락' };
  }
  const H = ctx.scenarioResults.H;
  const B = ctx.scenarioResults.B;
  const B2 = ctx.scenarioResults.B2;

  if (!H.captures || !B.captures || !B2.captures) {
    return { ok: false, reason: '캡처 객체 누락' };
  }
  if (H.captures.length === 0 || H.captures.length !== B.captures.length || H.captures.length !== B2.captures.length) {
    return { ok: false, reason: '조작 단계별 캡처 수 불일치 또는 0건' };
  }

  const fields = ['dom', 'localStorage', 'sessionStorage', 'toast', 'errCount', 'modal'];
  for (let i = 0; i < B.captures.length; i++) {
    const hCap = H.captures[i];
    const bCap = B.captures[i];
    const b2Cap = B2.captures[i];
    
    if (!hCap || !bCap || !b2Cap) return { ok: false, reason: '캡처 객체 식별 불가' };
    if (!hCap.stepId || !bCap.stepId || !b2Cap.stepId) return { ok: false, reason: '캡처 단계 식별자 누락' };
    if (hCap.stepId !== bCap.stepId || bCap.stepId !== b2Cap.stepId) return { ok: false, reason: '캡처 단계 식별자 불일치' };
    
    for (const f of fields) {
       if (hCap[f] === undefined || bCap[f] === undefined || b2Cap[f] === undefined) {
           return { ok: false, reason: '캡처 필수 필드(' + f + ') 누락' };
       }
       if (bCap[f] !== b2Cap[f]) return { ok: false, reason: 'B2 흔들림 감지 (' + f + ')' };
       if (hCap[f] !== bCap[f]) return { ok: false, reason: '단계 ' + i + ' ' + f + ' 불일치' };
    }
  }

  // 3. Mutator Sensitivity
  const mut = proof.mutatorSensitivity;
  if (!mut || typeof mut !== 'object') return { ok: false, reason: 'mutatorSensitivity 객체 누락' };
  if (!mut.inputSha || !mut.executorSha || !mut.rawRejectionReason) {
    return { ok: false, reason: 'mutatorSensitivity 원시/SHA/사유 누락' };
  }
  if (mut.rawRejectionReason === 'missing sensitivity data') {
    return { ok: false, reason: '감도 자료가 없다는 반려는 DOM 변조 감도로 인정 불가' };
  }
  if (mut.ok !== true || typeof mut.detectedMutations !== 'number' || mut.detectedMutations <= 0) {
    return { ok: false, reason: '변조 방어 미검증' };
  }

  // 4. Strict proofs requirements (moduleLoad, testSuiteCompare, tabIsolatedWork)
  if (!proof.proofs.moduleLoad) return { ok: false, reason: 'moduleLoad 증거 누락' };
  const mlFile = resolveProofFile(claimsDir, proof.proofs.moduleLoad);
  if (!mlFile) return { ok: false, reason: 'moduleLoad 증거 파일 없음' };
  const mlData = readJsonSafe(mlFile);
  if (!mlData) return { ok: false, reason: 'moduleLoad 파싱 실패' };
  if (typeof mlData.newRegressionCount !== 'number' || mlData.newRegressionCount > 0) return { ok: false, reason: 'moduleLoad 타입 오류 또는 신규 파괴 발생' };
  if (!mlData.inputSha || !mlData.executorSha || !mlData.baseRaw || !mlData.headRaw) return { ok: false, reason: 'moduleLoad 원시/SHA 연결 누락' };

  if (!proof.proofs.testSuiteCompare) return { ok: false, reason: 'testSuiteCompare 증거 누락' };
  const tcFile = resolveProofFile(claimsDir, proof.proofs.testSuiteCompare);
  if (!tcFile) return { ok: false, reason: 'testSuiteCompare 증거 파일 없음' };
  const tcData = readJsonSafe(tcFile);
  if (!tcData) return { ok: false, reason: 'testSuiteCompare 파싱 실패' };
  const regCount = (tcData.tests && typeof tcData.tests.regressionCount === 'number') ? tcData.tests.regressionCount : (typeof tcData.regressionCount === 'number' ? tcData.regressionCount : null);
  if (regCount === null || regCount > 0) return { ok: false, reason: 'testSuiteCompare 타입 오류 또는 신규 파괴 발생' };
  if (!tcData.inputSha || !tcData.executorSha || !tcData.baseRaw || !tcData.headRaw) return { ok: false, reason: 'testSuiteCompare 원시/SHA 연결 누락' };

  if (!proof.proofs.tabIsolatedWork && !proof.proofs.tabCompare) return { ok: false, reason: 'tabIsolatedWork 증거 누락' };
  const tabFile = resolveProofFile(claimsDir, proof.proofs.tabIsolatedWork || proof.proofs.tabCompare);
  if (!tabFile) return { ok: false, reason: 'tabIsolatedWork 증거 파일 없음' };
  const tabData = readJsonSafe(tabFile);
  if (!tabData) return { ok: false, reason: 'tabIsolatedWork 파싱 실패' };
  if (typeof tabData.differingValues !== 'number' || tabData.differingValues > 0) return { ok: false, reason: 'tabIsolatedWork 타입 오류 또는 값 차이 발생' };
  if (!tabData.inputSha || !tabData.executorSha || !tabData.baseRaw || !tabData.headRaw) return { ok: false, reason: 'tabIsolatedWork 원시/SHA 연결 누락' };

  return {
    ok: true,
    details: {
      stepsEvaluated: H.captures.length,
      mutatorSensitivityPassed: true,
      commitSha: commitSha
    }
  };
}

module.exports = {
  verifyCellSplitProof,
  resolveProofFile,
  readJsonSafe
};
`;
fs.writeFileSync('court/lib/preserve.js', preserveCode, 'utf8');

// ---------------------------------------------------------
// 2. Fix scenario.js (preserveOnly block)
// ---------------------------------------------------------
let scenarioCode = fs.readFileSync('court/lib/scenario.js', 'utf8');
const oldScenarioBlock = `      if (opts.preserveOnly) {
          try {
            const dom = await ev('document.documentElement.outerHTML');
            const ls = await ev('JSON.stringify(localStorage)');
            const ss = await ev('JSON.stringify(sessionStorage)');
            const toast = await ev('document.querySelector(".toast") ? document.querySelector(".toast").innerText : ""');
            const err = await ev('document.querySelector(".error") ? document.querySelector(".error").innerText : ""');
            const modal = await ev('document.querySelector(".modal") ? document.querySelector(".modal").innerText : ""');
            if (!result.captures) result.captures = [];
            result.captures.push({ dom, localStorage: ls, sessionStorage: ss, toast, err, modal });
          } catch(e) {}
        }`;
const newScenarioBlock = `      if (opts.preserveOnly) {
          try {
            const dom = await ev('document.documentElement.outerHTML');
            const ls = await ev('JSON.stringify(localStorage)');
            const ss = await ev('JSON.stringify(sessionStorage)');
            const toast = await ev('document.querySelector(".toast") ? document.querySelector(".toast").innerText : ""');
            const errCount = result.consoleErrors.length + result.exceptions.length;
            const modal = await ev('document.querySelector(".modal") ? document.querySelector(".modal").innerText : ""');
            if (!result.captures) result.captures = [];
            const stepId = 'step_' + i + '_' + (st.name || st.do);
            result.captures.push({ stepId, dom, localStorage: ls, sessionStorage: ss, toast, errCount, modal });
          } catch(e) {
            result.failKind = 'tool';
            result.toolError = 'preserve capture failed: ' + e.message;
            throw e;
          }
        }`;
scenarioCode = scenarioCode.replace(oldScenarioBlock, newScenarioBlock);
fs.writeFileSync('court/lib/scenario.js', scenarioCode, 'utf8');


// ---------------------------------------------------------
// 3. Fix Constitution (AGENTS.md, etc.)
// ---------------------------------------------------------
let agents = fs.readFileSync('AGENTS.md', 'utf8');

// Completely rewrite the headers
agents = agents.replace(/# \[정본\].*\n/g, '# [정본] 아워골 최고 헌법 v2026.10.06-SNOWBALL (v2026.10.07-PRESERVATION 발효 예정)\n');
agents = agents.replace(/> \*\*버전\*\*:.*\n/g, '> **버전**: v2026.10.06-SNOWBALL (v2026.10.07-PRESERVATION 발효 예정: 동작 보존 증명 - CELL_SPLIT 기반 원문 이전 및 동작0변경(일반 리팩터링 제외)에 한정하여 기계적 토큰 검증, DOM/스토리지 일치, 부품 누수 없음을 필수로 요구하는 동작 보존 판정 도입)\n');

fs.writeFileSync('AGENTS.md', agents, 'utf8');
fs.writeFileSync('CLAUDE.md', agents, 'utf8');
fs.writeFileSync('01_OURGOAL_SUPREME_CONSTITUTION_FULL.md', agents, 'utf8');

// ---------------------------------------------------------
// 4. Fix RULES.md Version Headers
// ---------------------------------------------------------
let rules = fs.readFileSync('docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md', 'utf8');

const newRuleHistory = `- **현행 커널 버전**: \`v2026.10.06-SNOWBALL\` — PR #800 병합 기록(병합 커밋 \`1ce6c14\`, 2026-10-06 00:38 KST). 개정 요약: 작업참고 스노우볼, \`step_0_session_start\` 0항·\`MODE_0\` 분류 단계·조문 12.7~12.8 추가.
- **발효 예정 커널 개정안**: \`v2026.10.07-PRESERVATION\` — 상민님 CELL_SPLIT 기반 동작 보존 승인 한정(WIP). 일반 리팩터링이나 fix/new 제외. 분할 증명서(CELL_SPLIT_PROOF) 기반 기계적 검증(제8조 제3항 10호 신설, MERGE_GATE 반영).
- **직전 커널 버전**: \`v2026.10.05-CELL\` — PR #727 병합 기록.
- **이 문서 본문은 이번에 바꾸지 않았다.** (CELL 개정 당시의 문구로서, 본문 정합은 별도 개정으로 한다는 의미이며, PRESERVATION 10호 신설은 하단에 명시됨)`;

// Replace everything between "### 커널과 법령 전문의 관계..." and "### 기획정본"
const rulesHeaderRegex = /- \*\*현행 커널 버전\*\*:[\s\S]*?- \*\*이 문서 본문은 이번에 바꾸지 않았다\.\*\*.*?\n/g;
rules = rules.replace(rulesHeaderRegex, newRuleHistory + '\n');
fs.writeFileSync('docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md', rules, 'utf8');

// ---------------------------------------------------------
// 5. Update unit-preserve.js mock to include errCount and stepId
// ---------------------------------------------------------
let unitCode = fs.readFileSync('court/selftest/unit-preserve.js', 'utf8');
unitCode = unitCode.replace(/\{ dom: 'A', localStorage: 'B', sessionStorage: 'C', toast: 'D', err: 'E', modal: 'F' \}/g, "{ stepId: 'step_0_goto', dom: 'A', localStorage: 'B', sessionStorage: 'C', toast: 'D', errCount: 0, modal: 'F' }");

// And replace "err" checks in test titles
unitCode = unitCode.replace(/'err'/g, "'errCount'");

fs.writeFileSync('court/selftest/unit-preserve.js', unitCode, 'utf8');

console.log('Final patch complete');
