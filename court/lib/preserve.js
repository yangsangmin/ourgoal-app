const fs = require('fs');
const path = require('path');

function resolveProofFile(dir, p) {
  if (!p) return null;
  const abs = path.resolve(dir, p);
  if (abs.startsWith(path.resolve(dir)) && fs.existsSync(abs)) return abs;
  return null;
}

function readJsonSafe(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch(e) { return null; }
}

function verifyCellSplitProof(ctx, proof, claimsDir) {
  if (!proof || !proof.proofs) return { ok: false, reason: '증명 객체 누락' };

  // 1. Helper interface for AST token validation
  try {
    const { recomputeSplit } = require('./preserve-source.js');
    let changedFiles = [];
    try {
      if (ctx.base && ctx.base.sha && ctx.head && ctx.head.sha) {
        const { execSync } = require('child_process');
        changedFiles = execSync('git diff --name-only ' + ctx.base.sha + ' ' + ctx.head.sha, { encoding: 'utf8' }).trim().split('\n').map(x => x.trim()).filter(Boolean);
      }
    } catch(e) { }
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
  if (!ctx.scenarioResults || !ctx.scenarioResults.H || !ctx.scenarioResults.B) {
    return { ok: false, reason: '시나리오 측정 결과 누락' };
  }
  const H = ctx.scenarioResults.H;
  const B = ctx.scenarioResults.B;
  const B2 = ctx.scenarioResults.B2;

  if (!H.captures || !B.captures || !B2 || !B2.captures) {
    return { ok: false, reason: '캡처 객체 누락' };
  }
  if (H.captures.length === 0 || H.captures.length !== B.captures.length || H.captures.length !== B2.captures.length) {
    return { ok: false, reason: '조작 단계별 캡처 수 불일치 또는 0건' };
  }

  for (let i = 0; i < B.captures.length; i++) {
    if (B.captures[i].dom !== B2.captures[i].dom) {
       return { ok: false, reason: 'B2 흔들림 감지' };
    }
  }

  for (let i = 0; i < H.captures.length; i++) {
    const hCap = H.captures[i];
    const bCap = B.captures[i];
    if (hCap.dom !== bCap.dom) return { ok: false, reason: '단계 ' + i + ' DOM 불일치' };
    if (hCap.localStorage !== bCap.localStorage) return { ok: false, reason: '단계 ' + i + ' localStorage 불일치' };
    if (hCap.sessionStorage !== bCap.sessionStorage) return { ok: false, reason: '단계 ' + i + ' sessionStorage 불일치' };
    if (hCap.toast !== bCap.toast) return { ok: false, reason: '단계 ' + i + ' 토스트 상태 불일치' };
    if (hCap.err !== bCap.err) return { ok: false, reason: '단계 ' + i + ' 오류 상태 불일치' };
    if (hCap.modal !== bCap.modal) return { ok: false, reason: '단계 ' + i + ' 모달 상태 불일치' };
  }

  const mutatorPassed = typeof proof.mutatorSensitivity === 'object' && proof.mutatorSensitivity.ok === true && typeof proof.mutatorSensitivity.detectedMutations === 'number' && proof.mutatorSensitivity.detectedMutations > 0;
  if (!mutatorPassed) {
    return { ok: false, reason: '뮤테이터 민감도 감지 미통과: 변조 방어 미검증' };
  }

  // 3. Strict proofs requirements (moduleLoad, testSuiteCompare, tabIsolatedWork)
  if (!proof.proofs.moduleLoad) return { ok: false, reason: 'moduleLoad 증거 누락' };
  const mlFile = resolveProofFile(claimsDir, proof.proofs.moduleLoad);
  if (!mlFile) return { ok: false, reason: 'moduleLoad 증거 파일 없음' };
  const mlData = readJsonSafe(mlFile);
  if (!mlData) return { ok: false, reason: 'moduleLoad 파싱 실패' };
  if (typeof mlData.newRegressionCount === 'number' && mlData.newRegressionCount > 0) {
    return { ok: false, reason: '모듈 단독 로드 신규 파괴 발생: ' + mlData.newRegressionCount + '건' };
  }

  if (!proof.proofs.testSuiteCompare) return { ok: false, reason: 'testSuiteCompare 증거 누락' };
  const tcFile = resolveProofFile(claimsDir, proof.proofs.testSuiteCompare);
  if (!tcFile) return { ok: false, reason: 'testSuiteCompare 증거 파일 없음' };
  const tcData = readJsonSafe(tcFile);
  if (!tcData) return { ok: false, reason: 'testSuiteCompare 파싱 실패' };
  const regCount = (tcData.tests && typeof tcData.tests.regressionCount === 'number') ? tcData.tests.regressionCount : (typeof tcData.regressionCount === 'number' ? tcData.regressionCount : null);
  if (regCount !== null && regCount > 0) {
    return { ok: false, reason: '테스트 스위트 비교 신규 파괴 발생: ' + regCount + '건' };
  }

  if (!proof.proofs.tabIsolatedWork && !proof.proofs.tabCompare) return { ok: false, reason: 'tabIsolatedWork 증거 누락' };
  const tabFile = resolveProofFile(claimsDir, proof.proofs.tabIsolatedWork || proof.proofs.tabCompare);
  if (!tabFile) return { ok: false, reason: 'tabIsolatedWork 증거 파일 없음' };
  const tabData = readJsonSafe(tabFile);
  if (!tabData) return { ok: false, reason: 'tabIsolatedWork 파싱 실패' };
  if (typeof tabData.differingValues === 'number' && tabData.differingValues > 0) {
    return { ok: false, reason: '탭 격리 비교 값 차이 발생: ' + tabData.differingValues + '건' };
  }

  // 4. SHA Validation
  const commitSha = proof.productMeasurementCommit || proof.baseCommitAtTaskStart || proof.baseSha;
  if (!commitSha || typeof commitSha !== 'string' || !/^[0-9a-f]{40}$/i.test(commitSha)) {
    return { ok: false, reason: '유효하지 않은 커밋 SHA 제시: ' + commitSha };
  }
  if (ctx.base && ctx.base.sha && commitSha !== ctx.base.sha) {
    return { ok: false, reason: '입력 SHA 불일치 (base): ' + commitSha + ' vs ' + ctx.base.sha };
  }
  const headSha = proof.headSha;
  if (headSha && ctx.head && ctx.head.sha && headSha !== ctx.head.sha) {
    return { ok: false, reason: '입력 SHA 불일치 (head): ' + headSha + ' vs ' + ctx.head.sha };
  }

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
