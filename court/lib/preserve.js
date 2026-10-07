'use strict';
const path = require('node:path');
const fs = require('node:fs');
const grade = require('./grade');

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
  if (!proof) return { ok: false, reason: '증명 객체 누락' };

  try {
    const { recomputeSplit } = require('./preserve-source.js');
    let changedFiles = [];
    if (ctx.base && ctx.base.sha && ctx.head && ctx.head.sha) {
      if (ctx.gitDiff) {
        changedFiles = ctx.gitDiff(ctx.base.sha, ctx.head.sha);
      } else {
        const { execFileSync } = require('node:child_process');
        try {
          const out = execFileSync('git', ['--no-pager', 'diff', '--name-only', ctx.base.sha, ctx.head.sha], { encoding: 'utf8', cwd: ctx.repoDir });
          changedFiles = out.trim().split('\n').map(x => x.trim()).filter(Boolean);
        } catch(e) {
          return { ok: false, reason: 'Git diff 실행 실패: ' + e.message };
        }
      }
      if (changedFiles.length === 0) {
        return { ok: false, reason: 'Git diff 반환 0건 (변경 파일 없음)' };
      }
    }

    const res = recomputeSplit({
      repoDir: ctx.repoDir,
      baseSha: ctx.base ? ctx.base.sha : null,
      headSha: ctx.head ? ctx.head.sha : null,
      config: proof, 
      changedFiles: changedFiles,
      mockOverrides: ctx.mockOverrides
    });
    if (!res.ok) return { ok: false, reason: res.reason };
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      return { ok: false, reason: 'preserve-source.js helper missing' };
    }
    return { ok: false, reason: 'recomputeSplit execution failed: ' + e.message };
  }

  const H = ctx.scenarioResults.H;
  return {
    ok: true,
    details: {
      stepsEvaluated: H.states.length
    }
  };
}

function compareObjects(o1, o2, oB1, oB2) {
  const diffs = [];
  const ignored = [];
  const keys = new Set([...Object.keys(o1), ...Object.keys(o2)]);
  for (const k of keys) {
    if (oB1[k] !== oB2[k]) {
      ignored.push(k);
      continue;
    }
    if (o1[k] !== o2[k]) {
      diffs.push(k);
    }
  }
  return { diffs, ignored };
}

function compareDom(hDom, b1Dom, b2Dom) {
  if (b1Dom !== b2Dom) {
    // If base1 and base2 DOM differs, we cannot just skip the whole DOM.
    // However, string matching is hard. If they differ, and hDom also differs in the same way, we could say ok?
    // The instruction says: "기준1!==기준2 이면 그 단계의 dom 필드 전체를 무시한다 → 너무 느슨하다... 무시는 최소 단위로 하고, 한 단계라도 dom 비교가 통째로 빠지면 확인 부족."
    // In this basic string-based DOM, it's hard to do a minimum diff without a DOM parser. But since we stripped scripts, what changes? Dates, times.
    // If we just check `hDom === b1Dom`, it will fail if time changes.
    // To implement "한 단계라도 dom 비교가 통째로 빠지면 확인 부족", we can just return { diffs: ['dom-unstable'], ignored: [] } if b1!=b2.
    // Wait, the prompt says "정규화 후 차이 부분". We can do simple regex normalization if we wanted, but the simplest is to return a diff if they don't match, and flag UNVERIFIED.
    return { diffs: ['dom'], ignored: [] };
  }
  if (hDom !== b1Dom) return { diffs: ['dom'], ignored: [] };
  return { diffs: [], ignored: [] };
}

async function judgePreserve(ctx, claim, out) {
  const claimsLib = require('../claims');
  const { validateScenario, isHollow, runScenario } = require('./scenario');
  
  const v = validateScenario(ctx.scenario);
  if (v.weaknesses && isHollow(v.weaknesses)) {
    out.outcome = claimsLib.OUTCOME.NO_TEST;
    out.notes.push('공허한 시나리오입니다.');
    return out;
  }
  if (ctx.scenario.steps.length === 0) {
    out.outcome = claimsLib.OUTCOME.NO_TEST;
    out.notes.push('공허한 시나리오입니다.');
    return out;
  }

  const H = await runScenario({ scenario: ctx.scenario, siteUrl: ctx.head.url, siteRev: ctx.head.sha, outDir: ctx.outDir ? path.join(ctx.outDir, 'head') : null, config: ctx.config, preserveOnly: true });
  const B = await runScenario({ scenario: ctx.scenario, siteUrl: ctx.base.url, siteRev: ctx.base.sha, outDir: ctx.outDir ? path.join(ctx.outDir, 'base1') : null, config: ctx.config, preserveOnly: true });
  const B2 = await runScenario({ scenario: ctx.scenario, siteUrl: ctx.base.url, siteRev: ctx.base.sha, outDir: ctx.outDir ? path.join(ctx.outDir, 'base2') : null, config: ctx.config, preserveOnly: true });

  const slim = r => ({ passed: r.passed, failedStep: r.failedStep, failKind: r.failKind, provesBehavior: r.provesBehavior, exceptions: r.exceptions });
  out.evidence = { type: 'scenario', scenarioId: ctx.scenario.id, title: ctx.scenario.title, steps: ctx.scenario.steps, head: slim(H), base: slim(B), base2: slim(B2) };

  if (H.failKind === 'tool' || B.failKind === 'tool' || B2.failKind === 'tool') {
    out.outcome = claimsLib.OUTCOME.CANNOT_JUDGE;
    out.notes.push('도구 오류: ' + (H.toolError || B.toolError || B2.toolError || ''));
    return out;
  }

  if (B.passed !== B2.passed || B.failedStep !== B2.failedStep) {
    out.outcome = claimsLib.OUTCOME.UNSTABLE;
    out.notes.push('기준 2회 실행 결과가 다릅니다.');
    return out;
  }

  if (!B.passed) {
    out.outcome = claimsLib.OUTCOME.UNVERIFIED;
    out.notes.push('기준 커밋에서 실패했습니다.');
    return out;
  }
  if (!H.passed) {
    out.outcome = claimsLib.OUTCOME.NOT_WORKING;
    out.notes.push('작업 커밋에서 실패했습니다.');
    return out;
  }

  if (!H.provesBehavior || !B.provesBehavior || !B2.provesBehavior) {
    out.outcome = claimsLib.OUTCOME.NO_TEST;
    out.notes.push('행동을 증명하지 못했습니다.');
    return out;
  }

  const achievedGrade = H.hardwareDevice ? 'L5' : (H.multiActor ? 'L4' : 'L3');
  const ef = claimsLib.effectiveFloor(claim, ctx.floors);
  const meetsFloor = grade.meets(achievedGrade, ef.floor);
  if (!meetsFloor) {
    out.outcome = claimsLib.OUTCOME.UNVERIFIED;
    out.notes.push('하한을 충족하지 못했습니다.');
    return out;
  }

  const sH = H.states || [];
  const sB1 = B.states || [];
  const sB2 = B2.states || [];
  
  if (sH.length !== sB1.length || sB1.length !== sB2.length) {
    out.outcome = claimsLib.OUTCOME.UNVERIFIED;
    out.notes.push('상태 캡처 개수가 다릅니다.');
    return out;
  }

  const ignoredKeys = new Set();
  let domSkippedCount = 0;

  for (let i = 0; i < sB1.length; i++) {
    const stH = sH[i], stB1 = sB1[i], stB2 = sB2[i];
    if (!stH || !stB1 || !stB2 || !stH.stepId || !stB1.stepId || !stB2.stepId) {
      out.outcome = claimsLib.OUTCOME.UNVERIFIED; out.notes.push('캡처 단계 식별자 누락'); return out;
    }
    
    // DOM compare
    if (stB1.dom !== stB2.dom) {
      domSkippedCount++;
    } else if (stH.dom !== stB1.dom) {
      out.outcome = claimsLib.OUTCOME.NOT_WORKING;
      out.notes.push(`상태 불일치 (단계 ${stB1.stepId}, 속성 dom)`);
      return out;
    }

    // localStorage
    const ls = compareObjects(JSON.parse(stH.localStorage||'{}'), JSON.parse(stB1.localStorage||'{}'), JSON.parse(stB1.localStorage||'{}'), JSON.parse(stB2.localStorage||'{}'));
    if (ls.diffs.length > 0) { out.outcome = claimsLib.OUTCOME.NOT_WORKING; out.notes.push(`상태 불일치 (단계 ${stB1.stepId}, localStorage: ${ls.diffs.join(',')})`); return out; }
    ls.ignored.forEach(k => ignoredKeys.add(`localStorage.${k}@${stB1.stepId}`));

    // sessionStorage
    const ss = compareObjects(JSON.parse(stH.sessionStorage||'{}'), JSON.parse(stB1.sessionStorage||'{}'), JSON.parse(stB1.sessionStorage||'{}'), JSON.parse(stB2.sessionStorage||'{}'));
    if (ss.diffs.length > 0) { out.outcome = claimsLib.OUTCOME.NOT_WORKING; out.notes.push(`상태 불일치 (단계 ${stB1.stepId}, sessionStorage: ${ss.diffs.join(',')})`); return out; }
    ss.ignored.forEach(k => ignoredKeys.add(`sessionStorage.${k}@${stB1.stepId}`));

    // other scalar fields
    for (const k of ['toast', 'errCount', 'modal']) {
      if (stB1[k] !== stB2[k]) {
        ignoredKeys.add(k + '@' + stB1.stepId);
        continue;
      }
      if (stB1[k] !== stH[k]) {
        out.outcome = claimsLib.OUTCOME.NOT_WORKING;
        out.notes.push(`상태 불일치 (단계 ${stB1.stepId}, 속성 ${k})`);
        return out;
      }
    }
  }

  if (domSkippedCount > 0) {
    out.outcome = claimsLib.OUTCOME.UNVERIFIED;
    out.notes.push('기준 2회차 DOM 불일치로 DOM 검증이 누락되었습니다.');
    return out;
  }

  if (ignoredKeys.size > 0) {
    out.notes.push('무시된 동적 값: ' + Array.from(ignoredKeys).join(', '));
  }

  ctx.scenarioResults = { H, B, B2 };
  const res = module.exports.verifyCellSplitProof(ctx.claimsDir, claim, ctx);
  if (!res.ok) {
    out.outcome = claimsLib.OUTCOME.NOT_WORKING;
    out.notes.push('분열 증명 검증 실패: ' + res.reason);
    return out;
  }

  out.outcome = claimsLib.OUTCOME.PRESERVED;
  out.achieved = achievedGrade;
  out.meetsFloor = true;
  return out;
}

module.exports = { judgePreserve, verifyCellSplitProof, resolveProofFile, readJsonSafe };
