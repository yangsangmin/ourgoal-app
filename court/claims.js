'use strict';
// 법정(court) — 주장 판정기.
// 작업자는 "주장"만 쓴다(reports/<TASK>/claims.json). 법정이 그 주장을 기준 커밋(base)과 작업 커밋(head) 양쪽에서 다시 실행해 판정한다.
// 등급·판정은 전부 여기서 나온다. claims.json 의 어떤 필드도 등급을 올리지 못한다.
const fs = require('node:fs');
const path = require('node:path');
const grade = require('./lib/grade');
const { stripByExt } = require('./lib/strip');
const { validateScenario, isHollow, scenarioFingerprint, runScenario } = require('./lib/scenario');

const KINDS = ['behavior', 'static', 'unverified', 'withdrawn'];
const CHANGES = ['fix', 'new'];
const UNVERIFIED_REASONS = {
  'needs-real-device': '진짜 폰이 있어야 확인할 수 있다',
  'needs-two-accounts': '진짜 계정 2개가 있어야 확인할 수 있다',
  'needs-live-server': '실서버·실DB 가 있어야 확인할 수 있다',
  'tool-cannot-measure': '법정 도구로는 잴 수 없는 종류다',
};
const STATIC_TYPES = ['jsonPath', 'fileExists', 'codeContains', 'codeNotContains'];

// 판정 결과 값(상민님용 쉬운 말)
const OUTCOME = {
  CONFIRMED: '확인됨',              // 고치기 전엔 안 되고 고친 뒤엔 됨 / 새 동작이 실제로 됨
  NOTHING_TO_FIX: '고칠 게 없었음',  // 고치기 전에도 정상이었음
  NOT_WORKING: '아직 안 됨',
  BROKE: '되던 기능이 고장 남',
  TEXT_ONLY: '글자만 확인',
  UNVERIFIED: '확인 못 함',
  NO_TEST: '시험 미제출',            // 주장은 있는데 법정이 돌릴 시험이 없거나 비어 있음
  WITHDRAWN: '철회',
  CANNOT_JUDGE: '심사 못 함',
  UNSTABLE: '시험이 흔들림',        // 같은 시험을 여러 번 돌렸더니 결과가 갈림 — 확인된 것으로 세지 않는다
};
const STABILITY_RUNS = 3; // 기준·작업 커밋의 결과가 갈릴 때(=판정을 좌우할 때)는 양쪽 모두 이만큼 돌려 전부 같아야 인정한다(재실행으로 "확인됨"을 뽑는 길을 막는다)

function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }

function validateClaims(doc) {
  const errors = [];
  if (!doc || typeof doc !== 'object') return ['claims.json 이 객체가 아니다'];
  if (typeof doc.task !== 'string' || !/^[A-Za-z0-9_-]{3,40}$/.test(doc.task)) errors.push('task 누락 또는 형식 오류');
  if (!Array.isArray(doc.requirements) || !doc.requirements.length) errors.push('requirements(상민님 지시 항목) 가 비어 있다 — 보고서의 분모는 주장 수가 아니라 지시 항목 수다');
  const reqIds = new Set();
  for (const r of doc.requirements || []) {
    if (!r || typeof r.id !== 'string' || typeof r.text !== 'string' || !r.text.trim()) { errors.push('requirements 항목은 {id, text}'); continue; }
    if (reqIds.has(r.id)) errors.push('requirements id 중복: ' + r.id);
    reqIds.add(r.id);
  }
  if (doc.retire !== undefined) {
    if (!Array.isArray(doc.retire)) errors.push('retire 는 배열');
    else for (const r of doc.retire) if (!r || typeof r.file !== 'string' || typeof r.check !== 'string' || typeof r.reason !== 'string' || r.reason.trim().length < 6) errors.push('retire 항목은 {file, check(검사 제목 그대로), reason(왜 더는 맞지 않는가)}');
  }
  if (!Array.isArray(doc.claims)) { errors.push('claims 배열 누락'); return errors; }
  const ids = new Set();
  doc.claims.forEach((c, i) => {
    const at = '주장 ' + (c && c.id ? c.id : '#' + (i + 1)) + ': ';
    if (!c || typeof c !== 'object') { errors.push(at + '객체가 아니다'); return; }
    if (typeof c.id !== 'string' || !/^[A-Za-z0-9_-]{1,24}$/.test(c.id)) errors.push(at + 'id 형식 오류');
    if (ids.has(c.id)) errors.push(at + 'id 중복'); ids.add(c.id);
    if (!KINDS.includes(c.kind)) { errors.push(at + 'kind 는 ' + KINDS.join('·') + ' 중 하나'); return; }
    if (typeof c.statement !== 'string' || c.statement.trim().length < 6) errors.push(at + 'statement(무엇이 어떻게 되는지 한 문장) 누락');
    if (c.kind !== 'withdrawn') {
      if (!reqIds.has(c.req)) errors.push(at + 'req 가 requirements 에 없다');
      if (typeof c.domain !== 'string') errors.push(at + 'domain 누락');
      if (!Array.isArray(c.touches) || !c.touches.length || !c.touches.every(t => typeof t === 'string')) errors.push(at + 'touches(이 주장이 걸린 파일) 누락');
    }
    if (c.kind === 'behavior') {
      if (typeof c.scenario !== 'string' || !/^[A-Za-z0-9_./-]+\.json$/.test(c.scenario) || c.scenario.includes('..')) errors.push(at + 'scenario 는 claims.json 기준 상대 경로의 .json');
      if (!CHANGES.includes(c.change)) errors.push(at + 'change 는 fix(있던 결함을 고침)·new(새 동작) 중 하나');
      if (c.change === 'fix' && !Number.isInteger(c.symptom)) errors.push(at + 'fix 주장은 symptom(고치기 전에 거짓이어야 하는 확인 단계 번호)이 필수다');
    }
    if (c.kind === 'static') {
      const k = c.check;
      if (!k || !STATIC_TYPES.includes(k.type) || typeof k.file !== 'string' || k.file.includes('..')) errors.push(at + 'check 는 {type: ' + STATIC_TYPES.join('|') + ', file}');
      else if (k.type === 'jsonPath' && (typeof k.path !== 'string' || !Object.prototype.hasOwnProperty.call(k, 'equals'))) errors.push(at + 'jsonPath 는 path·equals 필요');
      else if ((k.type === 'codeContains' || k.type === 'codeNotContains') && (typeof k.text !== 'string' || k.text.length < 4)) errors.push(at + 'codeContains 는 text(4자 이상) 필요');
    }
    if (c.kind === 'unverified') {
      const u = c.unverified;
      if (!u || !UNVERIFIED_REASONS[u.reason]) errors.push(at + 'unverified.reason 은 ' + Object.keys(UNVERIFIED_REASONS).join('·') + ' 중 하나');
      if (!u || typeof u.who !== 'string' || !u.who.trim()) errors.push(at + 'unverified.who(누가·무엇으로 잴 수 있는가) 누락');
      if (!u || !Array.isArray(u.how) || !u.how.length) errors.push(at + 'unverified.how(재는 순서) 누락');
    }
    if (c.kind === 'withdrawn' && (typeof c.withdrawnReason !== 'string' || !c.withdrawnReason.trim())) errors.push(at + 'withdrawnReason 누락');
    for (const banned of ['grade', 'verdict', 'outcome', 'passed', 'level']) if (Object.prototype.hasOwnProperty.call(c, banned)) errors.push(at + '"' + banned + '" 는 작업자가 적을 수 없다 — 등급과 판정은 법정이 낸다');
  });
  return errors;
}

// 유효 하한 = max(선언 분야의 하한, 걸린 파일 경로에서 유도한 하한, 주장 문장 키워드에서 유도한 하한). 분야를 낮게 적어 하한을 피하는 길을 막는다.
function effectiveFloor(claim, floors) {
  const cands = [{ floor: grade.floorFor(claim.domain, floors), why: '분야 ' + claim.domain }];
  for (const rule of floors.pathFloors || []) {
    const re = new RegExp(rule.pattern);
    const hit = (claim.touches || []).find(t => re.test(t));
    if (hit) cands.push({ floor: rule.floor, why: '걸린 파일 ' + hit });
  }
  for (const rule of floors.keywordFloors || []) {
    const re = new RegExp(rule.pattern, 'i');
    if (re.test(claim.statement || '')) cands.push({ floor: rule.floor, why: '문장에 "' + rule.label + '"' });
  }
  let best = cands[0];
  for (const c of cands) if (grade.rank(c.floor) > grade.rank(best.floor)) best = c;
  return { floor: best.floor, why: best.why, declaredFloor: cands[0].floor, raised: best !== cands[0] };
}

function getPath(obj, dotted) { return dotted.split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), obj); }

function judgeStatic(claim, headDir) {
  const k = claim.check;
  const fp = path.join(headDir, k.file);
  const exists = fs.existsSync(fp) && fs.statSync(fp).isFile();
  if (k.type === 'fileExists') return { ok: exists, detail: k.file + (exists ? ' 있음' : ' 없음') + ' (커밋된 트리 기준)' };
  if (!exists) return { ok: false, detail: k.file + ' 없음 (커밋된 트리 기준)' };
  const src = fs.readFileSync(fp, 'utf8');
  if (k.type === 'jsonPath') {
    let j; try { j = JSON.parse(src); } catch (e) { return { ok: false, detail: k.file + ' JSON 파싱 실패' }; }
    const v = getPath(j, k.path);
    return { ok: JSON.stringify(v) === JSON.stringify(k.equals), detail: k.path + ' = ' + JSON.stringify(v) + ' (기대 ' + JSON.stringify(k.equals) + ', 값을 파싱해서 비교)' };
  }
  const code = stripByExt(k.file, src);
  const n = code.split(k.text).length - 1;
  if (k.type === 'codeContains') return { ok: n > 0, detail: '주석을 걷어낸 코드에서 ' + n + '회' };
  return { ok: n === 0, detail: '주석을 걷어낸 코드에서 ' + n + '회(0이어야 함)' };
}

// 법정이 주장 하나를 판정한다. base·head 는 {dir, url, sha}. behavior 는 두 커밋에서 같은 시나리오를 돌린다.
async function judgeClaim(ctx, claim) {
  const { claimsDir, base, head, floors, config, outDir } = ctx;
  const out = { id: claim.id, req: claim.req || null, kind: claim.kind, change: claim.change || null, statement: claim.statement, domain: claim.domain || null, touches: claim.touches || [], outcome: null, achieved: 'L0', floor: null, floorWhy: null, floorRaised: false, meetsFloor: false, notes: [], evidence: null };
  if (claim.kind === 'withdrawn') { out.outcome = OUTCOME.WITHDRAWN; out.notes.push('철회 사유: ' + claim.withdrawnReason); return out; }
  const ef = effectiveFloor(claim, floors);
  out.floor = ef.floor; out.floorWhy = ef.why; out.floorRaised = ef.raised;
  if (ef.raised) out.notes.push('분야 하향 표기: 선언한 분야의 하한은 ' + grade.label(ef.declaredFloor) + ' 이지만 ' + ef.why + ' 때문에 ' + grade.label(ef.floor) + ' 로 본다');

  if (claim.kind === 'unverified') {
    out.outcome = OUTCOME.UNVERIFIED;
    out.unverified = { reason: claim.unverified.reason, reasonText: UNVERIFIED_REASONS[claim.unverified.reason], who: claim.unverified.who, how: claim.unverified.how };
    if (grade.rank(ef.floor) <= grade.rank('L3')) out.notes.push('법정이 잴 수 있는 종류인데 재지 않았다(잴 수 있는데 안 잼)');
    return out;
  }
  if (claim.kind === 'static') {
    const r = judgeStatic(claim, head.dir);
    out.evidence = { type: 'static', detail: r.detail };
    out.achieved = r.ok ? 'L1' : 'L0';
    out.outcome = r.ok ? OUTCOME.TEXT_ONLY : OUTCOME.NOT_WORKING;
    out.meetsFloor = r.ok && grade.meets('L1', ef.floor);
    return out;
  }
  // behavior
  const scFile = path.resolve(claimsDir, claim.scenario);
  if (!scFile.startsWith(path.resolve(claimsDir) + path.sep) || !fs.existsSync(scFile)) { out.outcome = OUTCOME.NO_TEST; out.notes.push('시나리오 파일이 없다: ' + claim.scenario); return out; }
  let scenario; try { scenario = readJson(scFile); } catch (e) { out.outcome = OUTCOME.NO_TEST; out.notes.push('시나리오 JSON 파싱 실패'); return out; }
  const v = validateScenario(scenario, config);
  if (v.errors.length) { out.outcome = OUTCOME.NO_TEST; out.notes.push('시나리오 무효: ' + v.errors.slice(0, 3).join(' / ')); return out; }
  if (isHollow(v.weaknesses)) { out.outcome = OUTCOME.NO_TEST; out.notes.push('공허한 시나리오: ' + v.weaknesses.filter(w => /^W[123]/.test(w)).join(' / ')); return out; }
  out.fingerprint = scenarioFingerprint(scenario);
  const H = await runScenario({ scenario, siteUrl: head.url, siteRev: head.sha, outDir: outDir ? path.join(outDir, 'head') : null, config });
  const B = await runScenario({ scenario, siteUrl: base.url, siteRev: base.sha, outDir: outDir ? path.join(outDir, 'base') : null, config });
  out.evidence = { type: 'scenario', scenarioId: scenario.id, title: scenario.title, steps: scenario.steps, head: slim(H), base: slim(B) };
  if (H.failKind === 'tool' || B.failKind === 'tool') { out.outcome = OUTCOME.CANNOT_JUDGE; out.notes.push('도구 오류: ' + (H.toolError || B.toolError || '')); return out; }
  // 두 커밋의 결과가 갈리면 그 차이가 판정을 좌우한다. 우연(화면 전환 타이밍 등)이 아닌지 양쪽을 더 돌려 확인한다.
  if (H.passed !== B.passed) {
    const sig = r => (r.passed ? 'pass' : 'fail@' + r.failedStep + ':' + r.failKind);
    const runs = { head: [sig(H)], base: [sig(B)] };
    for (let i = 1; i < STABILITY_RUNS; i++) {
      runs.head.push(sig(await runScenario({ scenario, siteUrl: head.url, siteRev: head.sha, outDir: null, config })));
      runs.base.push(sig(await runScenario({ scenario, siteUrl: base.url, siteRev: base.sha, outDir: null, config })));
    }
    out.evidence.stability = runs;
    if (new Set(runs.head).size > 1 || new Set(runs.base).size > 1) {
      out.outcome = OUTCOME.UNSTABLE;
      out.notes.push('같은 시험을 ' + STABILITY_RUNS + '번씩 돌렸더니 결과가 갈렸다 — 기준 [' + runs.base.join(', ') + '] / 작업 [' + runs.head.join(', ') + ']');
      return out;
    }
  }
  if (!H.passed) {
    if (B.passed) { out.outcome = OUTCOME.BROKE; out.notes.push('기준 커밋에서는 통과하던 시험이 작업 커밋에서 실패: 단계 ' + H.failedStep + ' ' + detailOf(H)); }
    else { out.outcome = OUTCOME.NOT_WORKING; out.notes.push('작업 커밋에서 실패: 단계 ' + H.failedStep + ' ' + detailOf(H)); }
    return out;
  }
  if (!H.provesBehavior) { out.outcome = OUTCOME.NO_TEST; out.notes.push('통과는 했지만 "행동이 만든 변화"를 확인한 단언이 없다(전부 행동 전에도 참이던 확인)'); return out; }
  if (B.passed) { out.outcome = OUTCOME.NOTHING_TO_FIX; out.achieved = 'L3'; out.notes.push('기준 커밋에서도 같은 시험이 통과한다 — 이 작업이 만든 변화가 아니다'); return out; }
  if (claim.change === 'fix') {
    const symptomOk = B.failKind === 'expect' && B.failedStep === claim.symptom;
    if (!symptomOk) { out.outcome = OUTCOME.NO_TEST; out.notes.push('기준 커밋에서 결함이 재현되지 않았다: 시험이 지정한 증상 단계(' + claim.symptom + ')가 아니라 단계 ' + B.failedStep + '(' + (B.failKind === 'action' ? '행동 자체가 안 됨' : '다른 확인') + ')에서 멈췄다 — "고치기 전에 그 결함이 있었다"는 근거가 없다'); return out; }
  }
  out.outcome = OUTCOME.CONFIRMED; out.achieved = 'L3';
  out.meetsFloor = grade.meets('L3', ef.floor);
  if (!out.meetsFloor) out.notes.push('확인 부족: 이 종류는 ' + grade.label(ef.floor) + ' 수준으로 봐야 하는데 PC 화면까지만 봤다');
  if (H.fixtures.length) out.notes.push('금고 fixture 사용: ' + H.fixtures.join(', '));
  return out;
}

function detailOf(r) { const s = r.failedStep ? r.steps[r.failedStep - 1] : null; return s ? '(' + s.name + ') ' + s.detail : ''; }
function slim(r) { return { passed: r.passed, failedStep: r.failedStep, failKind: r.failKind, provesBehavior: r.provesBehavior, nonVacuousExpects: r.nonVacuousExpects, vacuousExpects: r.vacuousExpects, steps: r.steps, exceptions: r.exceptions, captures: r.captures, fixtures: r.fixtures, siteRev: r.siteRev, chromeVersion: r.chromeVersion }; }

// 지시 항목(REQ) 단위 집계. 분모는 주장 수가 아니라 지시 항목 수다.
function rollup(doc, judged) {
  const seenFp = new Map();
  for (const j of judged) if (j.fingerprint) { if (seenFp.has(j.fingerprint)) { j.duplicateOf = seenFp.get(j.fingerprint); j.notes.push('같은 시험을 제목만 바꿔 다시 냈다(' + j.duplicateOf + ' 와 동일) — 집계에서 1건으로 센다'); } else seenFp.set(j.fingerprint, j.id); }
  const reqs = doc.requirements.map(r => {
    const mine = judged.filter(j => j.req === r.id && !j.duplicateOf);
    let bucket;
    if (!mine.length) bucket = '확인 못 함';
    else if (mine.some(j => j.outcome === OUTCOME.BROKE || j.outcome === OUTCOME.NOT_WORKING)) bucket = '안 됨';
    else if (mine.some(j => j.outcome === OUTCOME.CANNOT_JUDGE)) bucket = '심사 못 함';
    else if (mine.every(j => j.outcome === OUTCOME.NOTHING_TO_FIX)) bucket = '고칠 게 없었음';
    else if (mine.some(j => j.outcome === OUTCOME.CONFIRMED && j.meetsFloor)) bucket = '화면에서 눌러 확인';
    else if (mine.some(j => j.outcome === OUTCOME.CONFIRMED)) bucket = '확인 부족';
    else if (mine.some(j => j.outcome === OUTCOME.TEXT_ONLY)) bucket = mine.some(j => j.outcome === OUTCOME.TEXT_ONLY && j.meetsFloor) ? '글자만 확인(이 종류는 그걸로 충분)' : '코드만 확인(화면에서는 안 봄)';
    else bucket = '확인 못 함';
    return { id: r.id, text: r.text, bucket, claims: mine.map(j => j.id) };
  });
  const counts = {};
  for (const r of reqs) counts[r.bucket] = (counts[r.bucket] || 0) + 1;
  return { reqs, counts, total: reqs.length };
}

module.exports = { validateClaims, judgeClaim, rollup, effectiveFloor, judgeStatic, OUTCOME, KINDS, UNVERIFIED_REASONS, STATIC_TYPES, readJson };
