'use strict';
// 법정(court) — 보고서 생성기. 보고서는 판정 결과(verdict)에서 기계가 만든다. 작업자가 쓴 글자는 "작업자 주장" 칸에만 들어간다.
// 첫 4줄은 고정이다: ① 판정 ② 상민님이 하실 일 ③ 지시 항목 기준 분포 ④ 무엇을 어디서 심사했는가.
const grade = require('./lib/grade');

const VERDICT_TEXT = {
  '통과': '통과',
  '확인 부족': '확인 부족(막지는 않지만, 확인 못 한 채 나가는 것이 있습니다)',
  '돌려보냄': '돌려보냄(다시 해야 함)',
  '심사 못 함': '심사 못 함(법정 도구 고장 — 통과가 아닙니다)',
};

function q(s) { return '“' + clean(s) + '”'; }

// 작업자가 쓴 글자(주장 문장·지시 내용·사유·선택자)는 판정서에 그대로 싣지 않는다. 한 줄로 펴고, 제목·굵은 글씨·표·HTML·멘션으로 읽힐 기호를 무력화한다.
// 이유: 주장 칸에 줄바꿈과 "**판정: 통과**"를 넣어 법정이 쓴 줄처럼 보이게 하는 위조를 막는다. 법정이 쓴 줄과 작업자가 쓴 글자는 눈으로도 구분돼야 한다.
// 줄바꿈으로 읽히는 모든 문자(CR·LF·탭·유니코드 줄/문단 구분자). 보이지 않는 문자를 소스에 글자 그대로 두지 않으려고 코드 번호로 만든다.
const LINE_BREAKS = new RegExp('[\\r\\n\\t' + String.fromCharCode(0x2028, 0x2029, 0x0085, 0x000b, 0x000c) + ']+', 'g');

function clean(s, max) {
  const flat = String(s === undefined || s === null ? '' : s).split(LINE_BREAKS).join(' ').replace(/\s{2,}/g, ' ').trim()
    .replace(/[<>]/g, c => (c === '<' ? '‹' : '›')).replace(/\|/g, '/').replace(/\*/g, '∗').replace(/`/g, 'ˋ').replace(/^#+/g, '').replace(/@/g, '＠').replace(/판정\s*:/g, '판정 ː');
  return max && flat.length > max ? flat.slice(0, max) + '…' : flat;
}

// 닫힌 어휘 시나리오를 한국어 문장으로. 실행 기록이 있으면 실제로 누른 화면 글자를 쓴다.
function describeSteps(steps, run) {
  const out = [];
  (steps || []).forEach((st, i) => {
    const rec = run && run.steps ? run.steps[i] : null;
    const seen = rec && /"(.*?)"/.exec(rec.detail || '');
    const target = seen && seen[1] ? '화면 글자 ' + q(seen[1]) : (st.selector ? q(st.selector) : '');
    if (st.capture) return;
    if (st.do === 'goto') out.push('앱 열기');
    else if (st.do === 'waitFor') { if (!out.some(x => x.includes('기다림'))) out.push('화면이 뜰 때까지 기다림'); }
    else if (st.do === 'click') out.push(target + (st.position === 'top' ? ' 의 위쪽(어두운 배경)' : '') + ' 누르기');
    else if (st.do === 'type') out.push(target + ' 에 ' + q(st.text) + (st.clear ? ' 로 고쳐 쓰기' : ' 입력'));
    else if (st.do === 'select') out.push(q(st.selector) + ' 에서 ' + q(st.value) + ' 고르기');
    else if (st.do === 'fill') out.push(q(st.selector) + ' 값을 ' + q(st.value) + ' 로 넣기');
    else if (st.do === 'check') out.push(target + (st.on ? ' 체크하기' : ' 체크 풀기'));
    else if (st.do === 'key') out.push(st.key + ' 키 누르기');
    else if (st.do === 'back') out.push('뒤로가기');
    else if (st.do === 'setViewport') out.push('화면 크기 ' + st.width + '×' + st.height);
    else if (st.do === 'setOffline') out.push(st.offline ? '통신 끊기' : '통신 다시 연결');
    else if (st.do === 'seedLocalStorage') out.push('금고의 시작 상태 ' + q(st.fixture) + ' 로 시작');
    else if (st.do === 'wait') return;
    else if (st.expect === 'visible') out.push(q(st.selector) + ' 가 보여야 함');
    else if (st.expect === 'notVisible') out.push(q(st.selector) + ' 가 사라져야 함');
    else if (st.expect === 'neverVisible') out.push((st.text ? q(st.text) + ' 글자가' : q(st.selector) + ' 가') + ' 나타나면 안 됨');
    else if (st.expect === 'textContains' || st.expect === 'textEquals') out.push(q(st.selector) + ' 에 ' + q(st.text) + ' 글자가 있어야 함');
    else if (st.expect === 'hasClass') out.push(q(st.selector) + ' 가 ' + q(st.className) + ' 상태여야 함');
    else if (st.expect === 'notHasClass') out.push(q(st.selector) + ' 가 ' + q(st.className) + ' 상태가 아니어야 함');
    else if (st.expect === 'count') out.push(q(st.selector) + ' 개수 확인');
    else if (st.expect === 'rect') out.push(q(st.selector) + ' 크기가 기준 이상이어야 함');
    else if (st.expect === 'noHorizontalOverflow') out.push('화면이 가로로 넘치지 않아야 함');
    else if (st.expect === 'noExceptions') out.push('오류가 없어야 함');
    else if (st.expect === 'stillInApp') out.push('앱을 벗어나지 않아야 함');
    else if (st.expect) out.push(st.expect + ' 확인');
  });
  return out.join(' → ');
}

function distributionLine(rollup) {
  if (!rollup) return '지시 항목 기준 분포: 없음(작업자가 주장을 내지 않았습니다)';
  const order = ['화면에서 눌러 확인', '글자만 확인(이 종류는 그걸로 충분)', '확인 부족', '코드만 확인(화면에서는 안 봄)', '확인 못 함', '고칠 게 없었음', '안 됨', '심사 못 함'];
  const parts = order.filter(k => rollup.counts[k]).map(k => k + ' ' + rollup.counts[k]);
  return '상민님 지시 ' + rollup.total + '건 중: ' + (parts.join(' · ') || '해당 없음');
}

function firstLines(v) {
  const l1 = '판정: ' + (VERDICT_TEXT[v.verdict] || clean(v.verdict)) + (v.headline ? ' — ' + clean(v.headline) : '');
  const l2 = '상민님이 하실 일: ' + clean(v.todo);
  const l3 = distributionLine(v.rollup);
  const l4 = '심사 대상 커밋 ' + (v.head.sha || '?').slice(0, 7) + ' (기준 ' + (v.base.sha || '?').slice(0, 7) + (v.baseSource === 'manual' ? ', 비표준 기준점 — 손으로 지정됨' : '') + ') · 판정번호 ' + v.verdictId + ' · ' + v.whereText;
  return [l1, l2, l3, l4];
}

function render(v) {
  const L = [];
  L.push('# 법정 판정서' + (v.task ? ' — ' + v.task : ''));
  L.push('');
  if (v.where !== 'ci') { L.push('> **이 출력은 작업자 PC 에서 돌린 예비 점검입니다. 판정 효력이 없습니다.** 판정은 GitHub 의 법정(작업자가 고칠 수 없는 곳)에서 나온 것만 인정됩니다.'); L.push(''); }
  for (const line of firstLines(v)) L.push('**' + line + '**  ');
  L.push('');
  const rejects = v.findings.filter(f => f.severity === 'reject');
  if (rejects.length) {
    L.push('## 돌려보낸 이유');
    rejects.forEach((f, i) => L.push((i + 1) + '. **' + clean(f.title) + '** — ' + clean(f.text)));
    L.push('');
  }
  const warns = v.findings.filter(f => f.severity === 'warn');
  if (warns.length) { L.push('## 알아 두실 것'); warns.forEach(f => L.push('- **' + clean(f.title) + '** — ' + clean(f.text))); L.push(''); }

  L.push('## 지시 항목별 결과');
  if (v.rollup) {
    L.push('| 지시 | 상민님 지시 내용 | 결과 |'); L.push('| :-- | :-- | :-- |');
    for (const r of v.rollup.reqs) L.push('| ' + clean(r.id, 24) + ' | ' + clean(r.text, 140) + ' | **' + r.bucket + '** |');
  } else L.push('주장 파일(claims.json)이 없어 지시 항목별 결과를 낼 수 없습니다.');
  L.push('');

  if (v.claims && v.claims.length) {
    L.push('## 주장별 판정');
    L.push('아래 "작업자 주장" 칸은 작업자의 말이며 확인된 것이 아닙니다. "법정이 한 일"과 "판정"만 법정이 쓴 것입니다.');
    L.push('');
    for (const c of v.claims) {
      L.push('### ' + clean(c.id, 24) + ' · ' + c.outcome + (c.req ? ' (' + clean(c.req, 24) + ')' : ''));
      L.push('- 작업자 주장: ' + clean(c.statement, 300));
      if (c.evidence && c.evidence.type === 'scenario') {
        L.push('- 법정이 한 일: ' + describeSteps(c.evidence.steps, c.evidence.head));
        L.push('- 고치기 전(기준 커밋): ' + (c.evidence.base.passed ? '같은 시험 통과' : '단계 ' + c.evidence.base.failedStep + ' 에서 멈춤') + ' / 고친 뒤(작업 커밋): ' + (c.evidence.head.passed ? '통과' : '단계 ' + c.evidence.head.failedStep + ' 에서 멈춤'));
        for (const cap of (c.evidence.head.captures || [])) L.push('- 법정이 찍은 화면: ' + clean(cap.file) + ' (sha256 ' + cap.sha256.slice(0, 12) + ') — ' + clean(cap.caption, 300));
      } else if (c.evidence && c.evidence.type === 'static') L.push('- 법정이 한 일: 커밋된 파일을 읽음 — ' + clean(c.evidence.detail, 300));
      if (c.floor) L.push('- 확인 수준: ' + grade.label(c.achieved) + ' / 이 종류에 필요한 수준: ' + grade.label(c.floor) + ' (' + c.floorWhy + ')');
      if (c.unverified) { L.push('- 왜 못 쟀나: ' + c.unverified.reasonText); L.push('- 누가 잴 수 있나: ' + clean(c.unverified.who, 200)); L.push('- 재는 순서: ' + c.unverified.how.map((h, i) => (i + 1) + ') ' + clean(h, 200)).join(' ')); }
      for (const n of c.notes || []) L.push('- 참고: ' + clean(n, 400));
      L.push('');
    }
  }

  L.push('## 주장과 무관하게 법정이 직접 본 것');
  if (v.modules) L.push('- 부품 로드 점검: 작업 커밋 ' + v.modules.counts.headOk + '/' + v.modules.counts.head + '개 로드됨 (기준 커밋 ' + v.modules.counts.baseOk + '/' + v.modules.counts.base + ')' + (v.modules.insufficient.length ? ' · 점검 환경 한계로 못 본 부품 ' + v.modules.insufficient.length + '개: ' + v.modules.insufficient.map(x => x.file).join(', ') : ''));
  for (const r of (v.baseTests && v.baseTests.runners) || []) L.push('- 기준 시험지 채점(' + r.file + '): 기준 커밋의 검사 ' + r.base.passed + '개 중 작업 커밋에서 ' + (r.base.passed - r.head.failed) + '개 통과' + (r.head.failed ? ' · **' + r.head.failed + '개 깨짐**' : '') + ' — 작업자가 고친 테스트는 판정에 쓰지 않았습니다');
  if (v.browserSkipped) L.push('- 화면 점검: 하지 않음(' + v.browserSkipped + ')');
  if (v.boot && v.boot.boot) L.push('- 앱 띄우기: 기준 커밋 ' + (v.boot.boot.base.passed ? '뜸' : '안 뜸') + ' / 작업 커밋 ' + (v.boot.boot.head.passed ? '뜸' : '안 뜸') + ' · 띄울 때 난 오류 ' + v.boot.boot.base.exceptions.length + '건 → ' + v.boot.boot.head.exceptions.length + '건');
  for (const s of (v.boot && v.boot.std) || []) L.push('- 표준 점검 ' + q(s.title) + ': 기준 ' + (s.base.passed ? '통과' : '실패') + ' / 작업 ' + (s.head.passed ? '통과' : '**실패**(' + clean(s.head.detail, 300) + ')'));
  if (v.quick) L.push('- (빠른 점검 모드: 화면 점검은 하지 않았습니다 — 이 결과로는 통과를 말할 수 없습니다)');
  L.push('');

  L.push('## git 사실 (법정이 git 에서 직접 읽음)');
  const f = v.facts || {};
  L.push('- 작업 커밋: `' + (v.head.sha || '') + '` / 기준 커밋: `' + (v.base.sha || '') + '`');
  L.push('- GitHub 에 올라가 있는가: ' + (f.pushed ? '예 (' + f.onRemoteBranches.join(', ') + ')' : '**아니오 — 이 PC 에만 있는 커밋입니다**'));
  if (f.aheadOfRemoteMain !== null && f.aheadOfRemoteMain !== undefined) L.push('- GitHub main 대비: ' + f.aheadOfRemoteMain + '커밋 앞섬 / ' + f.behindRemoteMain + '커밋 뒤짐');
  if (v.headIsWorktree === false && f.dirtyTrackedFiles) L.push('- 주의: 작업 폴더에 커밋 안 된 변경 ' + f.dirtyTrackedFiles + '개 — 법정은 커밋된 것만 심사했습니다');
  if (v.vault) L.push('- 바뀐 파일 ' + v.vault.counts.total + '개: 제품 코드 ' + v.vault.counts.product + ' · 채점 기준(금고) ' + v.vault.counts.frozen + ' · 테스트 ' + v.vault.counts.appendOnly + ' · 그 밖 ' + v.vault.counts.other);
  if (v.coverage) L.push('- 바뀐 제품 파일 ' + v.coverage.productFiles + '개 중 주장이 걸린 파일 ' + v.coverage.claimed + '개' + (v.coverage.unclaimed.length ? ' — 주장 없는 변경: ' + v.coverage.unclaimed.slice(0, 8).map(x => clean(x, 80)).join(', ') : ''));
  L.push('');
  L.push('---');
  L.push('법정 도구: node ' + v.tool.node + (v.tool.chromeVersion ? ' · ' + v.tool.chromeVersion : '') + ' · 소요 ' + Math.round(v.tool.durationMs / 1000) + '초 · 이 문서는 기계가 만들었습니다.');
  return L.join('\n') + '\n';
}

module.exports = { render, firstLines, describeSteps, distributionLine, clean, VERDICT_TEXT };
