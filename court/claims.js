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
// 주장의 세기. 법정이 직접 돌려 보는 종류(behavior·static)가 "강한 판"이다. 강한 판을 약한 종류로 바꾸면 법정은 옛 판을 다시 돌려 본다(judge.js).
const KIND_RANK = { behavior: 2, static: 1, unverified: 0, withdrawn: 0 };
const CHANGES = ['fix', 'new'];
const UNVERIFIED_REASONS = {
  'needs-real-device': '진짜 폰이 있어야 확인할 수 있다',
  'needs-two-accounts': '진짜 계정 2개가 있어야 확인할 수 있다',
  'needs-live-server': '실서버·실DB 가 있어야 확인할 수 있다',
  'tool-cannot-measure': '법정 도구로는 잴 수 없는 종류다',
};
// 법정이 PC 화면에서 눌러 볼 수 있는 종류인데도 "못 쟀다"고 낼 수 있는 사유의 닫힌 목록. 여기에 없는 사유로는 "확인 못 함"을 낼 수 없다(잴 수 있는데 재지 않음 = 돌려보냄).
const CANNOT_BECAUSE = {
  'needs-login': '로그인한 뒤에만 보이는 화면이다(법정은 외부 통신을 막아 로그인할 수 없다)',
  'file-attach': '파일·사진을 골라 붙이는 동작이다',
  'native-dialog': '브라우저나 운영체제가 띄우는 창(권한 요청·공유 창 등)이다',
  'camera-mic-share': '카메라·마이크·화면 공유가 있어야 한다',
  'push-notification': '푸시 알림이 실제로 와야 확인된다',
  'payment-window': '결제 창이 떠야 확인된다',
  'external-page': '다른 사이트로 넘어가야 확인된다(법정은 외부 통신을 막는다)',
  'long-duration': '오래 기다려야 확인된다(법정의 시험 한 번은 3분까지다)',
  'visual-quality': '보기 좋은지·어색하지 않은지는 사람 눈으로 봐야 한다',
};
// 판정서 둘째 줄에 쓰는 짧은 이름("법정 도구 한계로 못 잰 것 N건(로그인 뒤 화면 2 · 파일 첨부 1)").
const CANNOT_BECAUSE_SHORT = {
  'needs-login': '로그인 뒤 화면', 'file-attach': '파일 첨부', 'native-dialog': '기기·브라우저가 띄우는 창', 'camera-mic-share': '카메라·마이크·화면 공유',
  'push-notification': '푸시 알림', 'payment-window': '결제 창', 'external-page': '다른 사이트로 이동', 'long-duration': '오래 걸리는 동작', 'visual-quality': '보기 좋은지(사람 눈)',
};
const STATIC_TYPES = ['jsonPath', 'fileExists', 'codeContains', 'codeNotContains'];
const MEASURABLE_TOP = 'L3'; // 법정이 직접 잴 수 있는 가장 높은 수준(PC 화면에서 눌러 봄)

// 판정 결과 값(상민님용 쉬운 말)
const OUTCOME = {
  CONFIRMED: '확인됨',              // 고치기 전엔 안 되고 고친 뒤엔 됨 / 새 동작이 실제로 됨
  NOTHING_TO_FIX: '고칠 게 없었음',  // 고치기 전에도 정상이었음
  NOT_WORKING: '아직 안 됨',
  BROKE: '되던 기능이 고장 남',
  TEXT_ONLY: '글자만 확인',
  UNVERIFIED: '확인 못 함',
  NO_TEST: '시험 미제출',            // 주장은 있는데 법정이 돌릴 시험이 없거나 비어 있음 / 잴 수 있는데 재지 않음
  WITHDRAWN: '철회',
  CANNOT_JUDGE: '심사 못 함',
  UNSTABLE: '시험이 흔들림',        // 같은 시험을 여러 번 돌렸더니 결과가 갈림 — 확인된 것으로 세지 않는다
};
const STABILITY_RUNS = 3; // 기준·작업 커밋의 결과가 갈릴 때(=판정을 좌우할 때)는 양쪽 모두 이만큼 돌려 전부 같아야 인정한다(재실행으로 "확인됨"을 뽑는 길을 막는다)
// 주장 심사 전체에 쓸 수 있는 시간(기본 25분, court/config.json 의 claimBudgetMs 로 바꾼다). 화면에서 돌려 보는 주장 하나는 수십 초가 든다.
// 예산을 넘긴 뒤의 화면 주장은 돌리지 않고 "확인 못 함(시간 부족)"으로 내린다 — 시간 제한에 걸려 판정서 없이 끝나는 것보다 낫다.
const DEFAULT_CLAIM_BUDGET_MS = 25 * 60 * 1000;

function pastDeadline(ctx) { return typeof ctx.deadline === 'number' && Date.now() > ctx.deadline; }
// 시간이 모자라 돌려 보지 못한 주장. 된 것도 안 된 것도 아니다 — 확인 못 함이다(지어내지 않는다).
function timeShort(out, why) {
  out.outcome = OUTCOME.UNVERIFIED; out.timeShort = true; out.achieved = 'L0'; out.meetsFloor = false;
  out.notes.push('시간 부족: ' + why + ' 주장을 여러 PR 로 나눠 내면 전부 돌려 볼 수 있다');
  return out;
}

function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }

// 저장소 안의 상대 경로만 받는다(.. · 절대 경로 · 역슬래시 금지).
function isRepoPath(p) { return typeof p === 'string' && /^[^\\:*?"<>|]+$/.test(p) && !p.startsWith('/') && !p.split('/').includes('..') && p.trim() === p && p.length > 0 && p.length <= 300; }

// 주장 하나의 형식 오류. reqIds 가 없으면(이력에서 꺼낸 옛 판을 다시 돌릴 때) req 대조만 건너뛴다.
function claimErrors(c, label, reqIds) {
  const errors = [];
  const at = '주장 ' + label + ': ';
  if (!c || typeof c !== 'object') return [at + '객체가 아니다'];
  if (typeof c.id !== 'string' || !/^[A-Za-z0-9_-]{1,24}$/.test(c.id)) errors.push(at + 'id 형식 오류');
  if (!KINDS.includes(c.kind)) { errors.push(at + 'kind 는 ' + KINDS.join('·') + ' 중 하나'); return errors; }
  if (typeof c.statement !== 'string' || c.statement.trim().length < 6) errors.push(at + 'statement(무엇이 어떻게 되는지 한 문장) 누락');
  if (c.kind !== 'withdrawn') {
    if (reqIds && !reqIds.has(c.req)) errors.push(at + 'req 가 requirements 에 없다');
    if (typeof c.domain !== 'string') errors.push(at + 'domain 누락');
    if (!Array.isArray(c.touches) || !c.touches.length || !c.touches.every(t => typeof t === 'string')) errors.push(at + 'touches(이 주장이 걸린 파일) 누락');
  } else if (reqIds && c.req !== undefined && !reqIds.has(c.req)) errors.push(at + 'req 가 requirements 에 없다');
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
    // 검사하는 파일은 "이 주장이 걸린 파일"에 들어 있어야 한다. 빼고 적으면 그 파일의 경로 하한(화면 코드는 화면에서 봐야 한다)을 피해 갈 수 있다.
    if (k && typeof k.file === 'string' && Array.isArray(c.touches) && !c.touches.includes(k.file)) errors.push(at + 'check.file(' + k.file + ') 이 touches 에 없다 — 검사하는 파일은 이 주장이 걸린 파일이어야 한다');
  }
  if (c.kind === 'unverified') {
    const u = c.unverified;
    if (!u || !UNVERIFIED_REASONS[u.reason]) errors.push(at + 'unverified.reason 은 ' + Object.keys(UNVERIFIED_REASONS).join('·') + ' 중 하나');
    if (!u || typeof u.who !== 'string' || !u.who.trim()) errors.push(at + 'unverified.who(누가·무엇으로 잴 수 있는가) 누락');
    if (!u || !Array.isArray(u.how) || !u.how.length) errors.push(at + 'unverified.how(재는 순서) 누락');
    if (u && u.cannotBecause !== undefined && !Object.prototype.hasOwnProperty.call(CANNOT_BECAUSE, u.cannotBecause)) errors.push(at + 'unverified.cannotBecause 는 ' + Object.keys(CANNOT_BECAUSE).join('·') + ' 중 하나');
  }
  if (c.kind === 'withdrawn' && (typeof c.withdrawnReason !== 'string' || !c.withdrawnReason.trim())) errors.push(at + 'withdrawnReason 누락');
  for (const banned of ['grade', 'verdict', 'outcome', 'passed', 'level']) if (Object.prototype.hasOwnProperty.call(c, banned)) errors.push(at + '"' + banned + '" 는 작업자가 적을 수 없다 — 등급과 판정은 법정이 낸다');
  return errors;
}

function validateClaims(doc) {
  const errors = [];
  if (!doc || typeof doc !== 'object') return ['claims.json 이 객체가 아니다'];
  if (typeof doc.task !== 'string' || !/^[A-Za-z0-9_-]{3,40}$/.test(doc.task)) errors.push('task 누락 또는 형식 오류');
  // 제품 코드를 안 바꾸는 변경(문서·규범)도 기존 검사를 깨뜨릴 수 있다(예: 조항 제목을 바꾸면 그 제목 글자를 찾던 검사가 깨진다).
  // 그때는 주장 없이 폐기 사유(retire)만 적은 문서를 낼 수 있다. 제품 코드를 바꿨는데 주장이 없으면 법정(judge)이 돌려보낸다.
  const retireOnly = Array.isArray(doc.retire) && doc.retire.length > 0 && Array.isArray(doc.claims) && doc.claims.length === 0 && Array.isArray(doc.requirements) && doc.requirements.length === 0;
  if (!retireOnly && (!Array.isArray(doc.requirements) || !doc.requirements.length)) errors.push('requirements(상민님 지시 항목) 가 비어 있다 — 보고서의 분모는 주장 수가 아니라 지시 항목 수다');
  const reqIds = new Set();
  for (const r of doc.requirements || []) {
    if (!r || typeof r.id !== 'string' || typeof r.text !== 'string' || !r.text.trim()) { errors.push('requirements 항목은 {id, text}'); continue; }
    if (reqIds.has(r.id)) errors.push('requirements id 중복: ' + r.id);
    reqIds.add(r.id);
  }
  // 지시 원문이 적힌 문서의 경로(선택). 적었으면 작업 커밋에 실제로 있어야 한다(있는지는 judge 가 커밋된 트리에서 본다).
  if (doc.requirementsSource !== undefined && !isRepoPath(doc.requirementsSource)) errors.push('requirementsSource 는 저장소 안의 문서 경로(예: docs/specs/REQ-….md)');
  // 법정 이의(선택). 법정이 틀렸다고 보면 무엇이 틀렸는지와 그것을 보이는 재현을 적는다. 재현 없는 이의는 이의가 아니다. 이의는 재심 의무를 멈추지 않는다.
  if (doc.objection !== undefined) {
    const o = doc.objection;
    if (!o || typeof o !== 'object' || Array.isArray(o) || typeof o.finding !== 'string' || !o.finding.trim() || typeof o.repro !== 'string' || o.repro.trim().length < 20) errors.push('objection 은 {finding(법정의 어느 판단이 틀렸는가), repro(그것을 보이는 재현 — 두 커밋·시험·기대와 실제, 20자 이상)}');
  }
  if (doc.retire !== undefined) {
    if (!Array.isArray(doc.retire)) errors.push('retire 는 배열');
    else for (const r of doc.retire) if (!r || typeof r.file !== 'string' || typeof r.check !== 'string' || typeof r.reason !== 'string' || r.reason.trim().length < 6) errors.push('retire 항목은 {file, check(검사 제목 그대로), reason(왜 더는 맞지 않는가)}');
  }
  if (!Array.isArray(doc.claims)) { errors.push('claims 배열 누락'); return errors; }
  const ids = new Set();
  doc.claims.forEach((c, i) => {
    const label = c && c.id ? c.id : '#' + (i + 1);
    errors.push(...claimErrors(c, label, reqIds));
    if (c && typeof c === 'object') { if (ids.has(c.id)) errors.push('주장 ' + label + ': id 중복'); ids.add(c.id); }
  });
  return errors;
}

// 유효 하한 = max(선언 분야의 하한, 걸린 파일·검사하는 파일의 경로에서 유도한 하한, 주장 문장 키워드에서 유도한 하한). 분야를 낮게 적거나 파일을 빼고 적어 하한을 피하는 길을 막는다.
function effectiveFloor(claim, floors) {
  const cands = [{ floor: grade.floorFor(claim.domain, floors), why: '분야 ' + claim.domain }];
  const files = (claim.touches || []).slice();
  if (claim.check && typeof claim.check.file === 'string' && !files.includes(claim.check.file)) files.push(claim.check.file);
  for (const rule of floors.pathFloors || []) {
    const re = new RegExp(rule.pattern);
    const hit = files.find(t => re.test(t));
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
    const u = claim.unverified;
    out.unverified = { reason: u.reason, reasonText: UNVERIFIED_REASONS[u.reason], who: u.who, how: u.how, cannotBecause: null, cannotBecauseText: null };
    out.outcome = OUTCOME.UNVERIFIED;
    // 필요한 확인 수준이 "PC 화면에서 눌러 봄" 이하면 법정이 직접 잴 수 있는 종류다. 그런 주장은 닫힌 목록의 사유가 있을 때만 "확인 못 함"으로 받는다.
    if (grade.rank(ef.floor) <= grade.rank(MEASURABLE_TOP)) {
      const listed = u.reason === 'tool-cannot-measure' && typeof u.cannotBecause === 'string' && Object.prototype.hasOwnProperty.call(CANNOT_BECAUSE, u.cannotBecause);
      if (listed) {
        out.toolLimit = u.cannotBecause;
        out.unverified.cannotBecause = u.cannotBecause; out.unverified.cannotBecauseText = CANNOT_BECAUSE[u.cannotBecause];
        out.notes.push('법정 도구 한계로 못 잰 것: ' + CANNOT_BECAUSE[u.cannotBecause]);
      } else {
        out.outcome = OUTCOME.NO_TEST; out.measurableNotMeasured = true;
        out.notes.push('잴 수 있는데 재지 않음: 이 종류는 법정이 PC 화면에서 직접 눌러 볼 수 있다. 시나리오를 내거나, 법정 도구로 정말 못 재는 것이면 unverified.reason 을 tool-cannot-measure 로 하고 cannotBecause 에 정해진 사유(' + Object.keys(CANNOT_BECAUSE).join('·') + ') 중 하나를 적어야 한다');
      }
    }
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
  // 시험이 무효·공허한지는 시간이 없어도 위에서 말해 준다. 여기부터가 시간이 드는 일(화면에서 돌려 보기)이다.
  // 예산은 시험을 시작하기 전에만 본다: 이미 시작한 시험은 끝까지(결과가 갈리면 다시 돌려 보는 것까지) 마친다 — 돌리다 만 결과로 판정하지 않는다.
  if (pastDeadline(ctx)) return timeShort(out, '주장 심사에 쓸 수 있는 시간이 다 돼서 이 시험은 돌려 보지 못했다.');
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

// 지시 항목(REQ) 단위 집계. 분모는 주장 수가 아니라 지시 항목 수다(지시 항목은 작업자가 적어 낸 것이다 — 법정은 그 목록이 지시 원문과 같은지 알지 못한다).
// reheard: 철회·종류 변경·삭제된 주장의 옛 판을 법정이 다시 돌려 본 결과(judge.js). 여전히 안 되면 그 지시는 "안 됨"으로 남는다.
function rollup(doc, judged, reheard) {
  const seenFp = new Map();
  for (const j of judged) if (j.fingerprint) { if (seenFp.has(j.fingerprint)) { j.duplicateOf = seenFp.get(j.fingerprint); j.notes.push('같은 시험을 제목만 바꿔 다시 냈다(' + j.duplicateOf + ' 와 동일) — 집계에서 1건으로 센다'); } else seenFp.set(j.fingerprint, j.id); }
  const failed = o => o === OUTCOME.BROKE || o === OUTCOME.NOT_WORKING;
  const reqs = doc.requirements.map(r => {
    const mine = judged.filter(j => j.req === r.id && !j.duplicateOf);
    const old = (reheard || []).filter(h => h.req === r.id);
    const live = mine.filter(j => j.outcome !== OUTCOME.WITHDRAWN);
    let bucket, note = null;
    if (mine.some(j => failed(j.outcome)) || old.some(h => failed(h.outcome))) bucket = '안 됨';
    else if (!mine.length) bucket = '확인 못 함';
    else if (mine.some(j => j.outcome === OUTCOME.CANNOT_JUDGE)) bucket = '심사 못 함';
    else if (!live.length) { bucket = '확인 못 함'; note = '작업자가 철회함'; }
    // 시간이 모자라 돌려 보지 못한 주장이 하나라도 걸린 지시는, 같은 지시의 다른 주장이 확인됐어도 확인된 것으로 세지 않는다(돌려 보지 않은 시험이 안 되는 것이었을 수 있다).
    else if (live.some(j => j.timeShort)) { bucket = '확인 못 함'; note = '시간 부족'; }
    else if (live.every(j => j.outcome === OUTCOME.NOTHING_TO_FIX)) bucket = '고칠 게 없었음';
    else if (live.some(j => j.outcome === OUTCOME.CONFIRMED && j.meetsFloor)) bucket = '화면에서 눌러 확인';
    else if (live.some(j => j.outcome === OUTCOME.CONFIRMED)) bucket = '확인 부족';
    else if (live.some(j => j.outcome === OUTCOME.TEXT_ONLY)) bucket = live.some(j => j.outcome === OUTCOME.TEXT_ONLY && j.meetsFloor) ? '글자만 확인(이 종류는 그걸로 충분)' : '코드만 확인(화면에서는 안 봄)';
    else { bucket = '확인 못 함'; if (live.every(j => j.toolLimit)) note = '법정 도구 한계'; }
    // 이 지시에 필요한 확인 수준 = 걸린 주장들의 유효 하한 중 가장 높은 것. 주장이 없으면 알 수 없다(null).
    let floor = null;
    for (const j of mine.concat(old)) if (j.floor && (floor === null || grade.rank(j.floor) > grade.rank(floor))) floor = j.floor;
    return { id: r.id, text: r.text, bucket, note, floor, claims: mine.map(j => j.id) };
  });
  const counts = {};
  for (const r of reqs) counts[r.bucket] = (counts[r.bucket] || 0) + 1;
  return { reqs, counts, total: reqs.length };
}

module.exports = { validateClaims, claimErrors, judgeClaim, rollup, effectiveFloor, judgeStatic, isRepoPath, OUTCOME, KINDS, KIND_RANK, UNVERIFIED_REASONS, CANNOT_BECAUSE, CANNOT_BECAUSE_SHORT, STATIC_TYPES, DEFAULT_CLAIM_BUDGET_MS, readJson };
