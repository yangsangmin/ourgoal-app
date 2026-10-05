// #TASK-ES-515 숨김 기능 6건 정리 — index.html·ui.css 에 같은 지움을 다시 적용(앵커로 찾음, 못 찾거나 모양이 다르면 멈춤)
// 쓰는 법: node apply-es515-cleanup.js <index.html> <ui.css>
// main 을 합치다 index.html·ui.css 가 충돌하면 main 판을 입력으로 이 스크립트를 다시 돌린다(손 충돌 풀기 금지, L010).
'use strict';
const fs = require('fs');
const [, , indexPath, cssPath] = process.argv;
if (!indexPath || !cssPath) throw new Error('쓰는 법: node apply-es515-cleanup.js <index.html> <ui.css>');

/* ---------------- index.html ---------------- */
// 작업 트리는 core.autocrlf 로 CRLF 일 수 있다 — 줄 끝을 알아 두고 같은 줄 끝으로 다시 쓴다
const rawHtml = fs.readFileSync(indexPath, 'utf8');
const eolH = rawHtml.includes('\r\n') ? '\r\n' : '\n';
let L = rawHtml.split(/\r?\n/);
const find = (pred, what) => { const i = L.findIndex(pred); if (i < 0) throw new Error('없음: ' + what); return i; };
const once = (pred, what) => { const hits = L.reduce((a, l, i) => (pred(l) ? a.concat(i) : a), []); if (hits.length !== 1) throw new Error(what + ' 줄 수 ' + hits.length + ' (1 이어야 함)'); return hits[0]; };
const cutUntil = (startPred, stopPred, what, mustHave, mustNot) => {
  const a = find(startPred, what); let b = a;
  while (!stopPred(L[b + 1], b + 1)) { b++; if (b >= L.length - 1) throw new Error('끝 없음: ' + what); }
  const block = L.slice(a, b + 1).join('\n');
  (mustHave || []).forEach(k => { if (!block.includes(k)) throw new Error(what + ' 구간에 ' + k + ' 없음'); });
  (mustNot || []).forEach(k => { if (block.includes(k)) throw new Error(what + ' 구간에 ' + k + ' 섞임'); });
  L.splice(a, b - a + 1);
  return b - a + 1;
};

// ⑩-a 상단바 #topbarActions(안에 #topHomeLayoutBtn 하나뿐) — 같은 줄의 주석과 함께
{
  const i = once(l => l.includes('id="topHomeLayoutBtn"'), 'topHomeLayoutBtn');
  const re = /<!-- \[#TASK-ES-282\] 전 탭 상위 중복 홈구성 버튼\(#topHomeLayoutBtn, #topbarActions\) 완전 소거\/은폐 --><div class="topbar-actions" id="topbarActions" style="display:none !important;"><button type="button" class="btn btn-ghost btn-xs topbar-action-btn" id="topHomeLayoutBtn"[^>]*>⚙️ 홈구성<\/button><\/div>/;
  if (!re.test(L[i])) throw new Error('topbarActions 모양 다름');
  L[i] = L[i].replace(re, '');
}
// ⑩-b 홈 머리 「나만의 홈 구성」 단추 칸(#btnCustomHomeLayout + 「필요없는 창 지우기」 글)
{
  const i = once(l => l.includes('id="btnCustomHomeLayout"'), 'btnCustomHomeLayout');
  if (!L[i - 1].includes('<div style="display:flex;flex-direction:column;align-items:flex-end;gap:2px;">')) throw new Error('홈 머리 칸 시작 모양 다름');
  if (!L[i + 1].includes('필요없는 창 지우기') || L[i + 2].trim() !== '</div>') throw new Error('홈 머리 칸 끝 모양 다름');
  L.splice(i - 1, 4);
}
// ⑨ 첫 화면 「이메일로 가입하기」 #landStartWrap/#landStartBtn
{
  const i = once(l => l.includes('id="landStartWrap"'), 'landStartWrap');
  if (L[i].trim() !== '<span class="land-login-link" id="landStartWrap" style="display:none;" aria-hidden="true"><b id="landStartBtn">이메일로 가입하기</b></span>') throw new Error('landStartWrap 모양 다름');
  L.splice(i, 1);
}
// ④ 루틴 매트릭스 마크업
{
  const i = once(l => l.includes('id="routineMatrixGrid"'), 'routineMatrixGrid');
  if (!L[i - 1].includes('<!-- [#UIUX-38] 루틴 요일별 실천 매트릭스 그리드 뷰 -->')) throw new Error('루틴 매트릭스 주석 모양 다름');
  L.splice(i - 1, 2);
}
// ①② 기록 탭 달력 융합 칩 + 빠른 스톱워치 바 + (융합 칩만 쓰던) 인라인 달력 슬롯 — 다음 「이번 주 몰입 요약」 주석 앞 빈 줄까지
cutUntil(l => l.includes('<!-- [#UIUX-42] [CALENDAR-MERGE] 캘린더 ↔ 기록 타임라인 1초 공간 융합 스위처 -->'),
  (l) => l.includes('<!-- [TOSS RECORDS TAB INNOVATION] 이번 주 몰입 요약 원카드'),
  '융합 칩·스톱워치 마크업', ['id="recCalFuseSwitcher"', 'id="quickStopwatchBar"', 'id="recInlineCalendarSlot"'], ['recHeroCard', 'recFeedbackSlot']);
// 위에서 빈 줄까지 지웠으므로 「recFeedbackSlot」 뒤 빈 줄 하나가 남아 있어야 한다
{
  const i = once(l => l.includes('<!-- [TOSS RECORDS TAB INNOVATION] 이번 주 몰입 요약 원카드'), 'TOSS 주석');
  if (L[i - 1].trim() !== '' || !L[i - 2].includes('id="recFeedbackSlot"')) throw new Error('융합 구간 뒤 모양 다름');
}
// ⑥ 기록 세그먼트 막대 #recSegmentBar — 「VIEW 1: FEED」 주석 앞 빈 줄까지
cutUntil(l => l.includes('<!-- 3분할 세그먼트 바 (내 기록 / 성취 통계 / 보관함) -->'),
  (l) => l.includes('<!-- [VIEW 1: FEED] 내 기록 뷰 -->'),
  '세그먼트 막대 마크업', ['id="recSegmentBar"', 'id="recSegFeedBtn"', 'id="recSegCount"'], ['recViewFeed']);
// 가져오기·getter·로드 중 호출 줄
for (const [needle, what] of [
  ['    get renderRoutineMatrixGrid(){ return renderRoutineMatrixGrid; },', 'getter renderRoutineMatrixGrid'],
  ['  var bindLandStartBtn = _settingsKit.bindLandStartBtn;', 'import bindLandStartBtn'],
  ['  var bindRecSegmentBar = _recordsKit.bindRecSegmentBar;', 'import bindRecSegmentBar'],
  ['  var openHomeCustomizer = _recordsKit.openHomeCustomizer;', 'import openHomeCustomizer'],
]) { const i = once(l => l === needle, what); L.splice(i, 1); }
for (const [prefix, what] of [
  ['  bindLandStartBtn(); /* [#TASK-ES-476]', 'call bindLandStartBtn'],
  ['  bindRecSegmentBar(); /* [#TASK-ES-474]', 'call bindRecSegmentBar'],
  ['  /* [#TASK-ES-483] openHomeCustomizer → js/tabs/records/external-import.js 로 옮김', 'openHomeCustomizer 이전 주석'],
  ["  var topBtnCustomHome = document.getElementById('topHomeLayoutBtn');", 'topBtnCustomHome 등록'],
]) { const i = once(l => l.startsWith(prefix), what); L.splice(i, 1); }
// #btnCustomHomeLayout 등록 줄 — #TASK-ES-531(#810)이 이중 처리기 한 벌을 지우며 그 자리에 설명 주석을 남겼다. 둘 중 있는 쪽을 지운다(단추가 사라지므로 설명도 무효)
{
  const i = once(l => l.startsWith("  var btnCustomHome = document.getElementById('btnCustomHomeLayout');") || l.startsWith('  /* [#TASK-ES-531] #btnCustomHomeLayout 의 addEventListener(openHomeCustomizer) 줄을 지움'), 'btnCustomHome 등록 또는 ES-531 주석');
  L.splice(i, 1);
}
// ④ 함수 renderRoutineMatrixGrid ~ window.toggleRoutineStamp (+ 뒤 빈 줄)
{
  const a = once(l => l === '  function renderRoutineMatrixGrid(){', 'fn renderRoutineMatrixGrid');
  const b = once(l => l === '  window.toggleRoutineStamp = toggleRoutineStamp;', 'window toggleRoutineStamp');
  const block = L.slice(a, b + 1).join('\n');
  if (b <= a || (block.match(/\n  function /g) || []).length !== 1 || !block.includes('window.renderRoutineMatrixGrid = renderRoutineMatrixGrid;')) throw new Error('루틴 매트릭스 함수 구간 이상');
  L.splice(a, b - a + 1 + (L[b + 1].trim() === '' ? 1 : 0));
}
// ① 함수 switchRecFusionMode ~ window.switchRecFusionMode
{
  const a = once(l => l === '  function switchRecFusionMode(mode){', 'fn switchRecFusionMode');
  const b = once(l => l === '  window.switchRecFusionMode = switchRecFusionMode;', 'window switchRecFusionMode');
  const block = L.slice(a, b + 1).join('\n');
  if (b <= a || (block.match(/\n  function /g) || []).length !== 0) throw new Error('융합 함수 구간 이상');
  L.splice(a, b - a + 1);
}
// ② 빠른 스톱워치 전역 3줄 ~ window.handleQuickStopwatchSaveRecord (+ 뒤 빈 줄)
{
  const a = once(l => l === '  window._quickStopwatchRunning = false;', '_quickStopwatchRunning 초기화');
  const b = once(l => l === '  window.handleQuickStopwatchSaveRecord = handleQuickStopwatchSaveRecord;', 'window handleQuickStopwatchSaveRecord');
  const block = L.slice(a, b + 1).join('\n');
  if (b <= a || (block.match(/\n  function /g) || []).length !== 2 || block.includes('exportRecordsCsv')) throw new Error('스톱워치 함수 구간 이상');
  L.splice(a, b - a + 1 + (L[b + 1].trim() === '' ? 1 : 0));
}
const outHtml = L.join(eolH);
for (const k of ['recCalFuseSwitcher', 'switchRecFusionMode', 'btnRecViewSwitch', 'recInlineCalendarSlot', 'recInlineCalGridSlot', 'recordsFusionMode',
  'quickStopwatchBar', 'handleQuickStopwatchToggle', 'handleQuickStopwatchSaveRecord', '_quickStopwatch', 'btnFastStopwatch', 'quickStopwatchDisplay',
  'renderRoutineMatrixGrid', 'toggleRoutineStamp', 'routineMatrixGrid', 'routine-matrix', 'routine-stamp',
  'recSegmentBar', 'recSegFeedBtn', 'recSegStatsBtn', 'recSegArchiveBtn', 'recSegCount', 'bindRecSegmentBar', 'rec-seg-btn',
  'landStartWrap', 'landStartBtn', 'bindLandStartBtn',
  'btnCustomHomeLayout', 'topHomeLayoutBtn', 'topbarActions', 'topbar-actions', 'openHomeCustomizer']) {
  if (outHtml.includes(k)) throw new Error('index.html 흔적 남음: ' + k);
}
for (const k of ['id="landGuestBtn"', 'id="homeLayoutOpenBtn"', 'id="recAddBtn"', 'id="btnOpenAvatarModal"', 'id="levelBadgeRow"', 'id="signupForm"', 'id="routineGoalsView"', 'id="recViewFeed"', 'id="og-task-31-action-btn"'])
  if (!outHtml.includes(k)) throw new Error('지우면 안 되는 것이 사라짐: ' + k);
fs.writeFileSync(indexPath, outHtml, 'utf8');

/* ---------------- ui.css ---------------- */
const rawCss = fs.readFileSync(cssPath, 'utf8');
const eolC = rawCss.includes('\r\n') ? '\r\n' : '\n';
let C = rawCss.split(/\r?\n/);
const cfind = (pred, what) => { const hits = C.reduce((a, l, i) => (pred(l) ? a.concat(i) : a), []); if (hits.length !== 1) throw new Error('ui.css ' + what + ' 줄 수 ' + hits.length); return hits[0]; };
// (가) 여러 선택자 규칙: 지운 id 를 가리키는 선택자 줄만 목록에서 뺀다(선언·다른 선택자 글자 그대로 — 규칙을 쪼개지 않는다)
const dropSelectorLine = (exact) => {
  const i = cfind(l => l === exact, exact);
  if (exact.endsWith(',')) { C.splice(i, 1); return; }
  // 마지막 선택자({ 로 끝남) — 앞 줄의 쉼표를 { 로 바꾼다
  if (!exact.endsWith(' {') || !C[i - 1].endsWith(',')) throw new Error('선택자 끝 모양 다름: ' + exact);
  C[i - 1] = C[i - 1].slice(0, -1) + ' {';
  C.splice(i, 1);
};
dropSelectorLine('#btnCustomHomeLayout,');
dropSelectorLine('[data-theme="focus-sanctuary"] #recSegmentBar,');
dropSelectorLine('[data-theme="black"] #recSegmentBar,');
dropSelectorLine('[data-theme="white"] #recSegmentBar,');
dropSelectorLine('[data-theme="urban-city"] #recSegmentBar {');
dropSelectorLine('#screen-records #quickStopwatchBar,');
dropSelectorLine('#screen-records #recCalFuseSwitcher,');
// (나) 선택자가 모두 지운 것뿐인 규칙·단일 선택자 규칙: 통째로 지운다
const dropRule = (startExact, what) => {
  const a = cfind(l => l === startExact, what);
  let b = a; while (!/^\s*}\s*$/.test(C[b])) { b++; if (b - a > 40) throw new Error('규칙 끝 없음: ' + what); }
  const block = C.slice(a, b + 1).join('\n');
  if ((block.match(/{/g) || []).length !== 1) throw new Error('규칙 안 중첩: ' + what);
  // 바로 앞 줄이 이 규칙만 설명하는 주석이면 함께 지운다(호출 측이 지정)
  C.splice(a, b - a + 1);
  return a;
};
const dropOneLine = (exact) => { const i = cfind(l => l === exact, exact); C.splice(i, 1); return i; };
// ⑩ #topHomeLayoutBtn·#topbarActions 숨김 규칙(두 선택자 모두 지운 요소) + 머리 주석 3줄
{
  const a = cfind(l => l === '#topHomeLayoutBtn,', '#topHomeLayoutBtn,');
  if (C[a + 1] !== '#topbarActions {' || C[a + 2].trim() !== 'display: none !important;' || C[a + 3] !== '}') throw new Error('topbarActions 규칙 모양 다름');
  if (!C[a - 2].includes("#TASK-ES-282: 전 탭 상위 중복 '홈구성' 버튼 제거") || !C[a - 3].startsWith('/* ====') || !C[a - 1].startsWith('   ====')) throw new Error('ES-282 머리 주석 모양 다름');
  C.splice(a - 3, 3 + 4 + (C[a + 4] === '' ? 1 : 0));
}
// ⑩ .topbar-actions 단일 선택자 규칙(한 줄짜리 1개 + 모바일 미디어 안 1개) — 그 클래스를 쓰던 요소는 지운 #topbarActions 하나뿐.
//    .topbar-action-btn 규칙은 남긴다: 남는 #topHomeGuideBtn 이 같은 클래스를 쓴다.
dropOneLine('.topbar-actions{display:flex;align-items:center;gap:4px;}');
dropRule('  .topbar-actions {', '미디어 .topbar-actions');
// ⑥ .rec-segment-bar·.rec-seg-btn·.rec-seg-count 한 줄 규칙 5개 + 성소 테마 2개
for (const p of ['.rec-segment-bar{', '.rec-seg-btn{', '.rec-seg-btn.active{', '.rec-seg-count{', '.rec-seg-btn.active .rec-seg-count{']) {
  const i = cfind(l => l.startsWith(p), p); C.splice(i, 1);
}
{
  const a = dropRule('html[data-theme="focus-sanctuary"] .rec-segment-bar {', '성소 .rec-segment-bar');
  if (C[a] === '') C.splice(a, 1);
  const b = dropRule('html[data-theme="focus-sanctuary"] .rec-seg-btn.active {', '성소 .rec-seg-btn.active');
  if (C[b] === '') C.splice(b, 1);
  // 「5. 기록/통계 탭 (Tab 4) - 세그먼트 & 365일 연간 히트맵」 주석은 뒤 캐러셀·히트맵 규칙도 덮으므로 그대로 둔다
}
// ④ 루틴 매트릭스 규칙 7개 + 머리 주석
{
  const h = cfind(l => l === '/* 6. [#UIUX-38] [ROUTINE-TRACKER] 루틴/습관 요일별 실천 매트릭스 그리드 뷰 */', '루틴 매트릭스 주석');
  C.splice(h, 1);
  for (const s of ['.routine-matrix-grid {', '.routine-matrix-header {', '.routine-matrix-row {', '.routine-name-cell {', '.routine-stamp-cell {', '.routine-stamp-cell.stamp-done {', '.routine-stamp-cell.stamp-today {']) dropRule(s, s);
  if (C[h] === '' && C[h - 1] === '') C.splice(h, 1);
}
// ① 융합 칩 규칙 4개 + 머리 주석
{
  const h = cfind(l => l === '/* 2. [#UIUX-42] [CALENDAR-MERGE] 캘린더 ↔ 기록 타임라인 1초 공간 융합 스위처 */', '융합 칩 주석');
  C.splice(h, 1);
  for (const s of ['.rec-cal-fuse-switcher {', '.rec-fuse-chip {', '.rec-fuse-chip:hover {', '.rec-fuse-chip.active {']) dropRule(s, s);
  if (C[h] === '' && C[h - 1] === '') C.splice(h, 1);
}
// ② 빠른 스톱워치 규칙 5개 + 머리 주석
{
  const h = cfind(l => l === '/* 6. [#UIUX-46] [TIMER-INSPECTION] 초정밀 스톱워치 퀵 측정 바 */', '스톱워치 주석');
  C.splice(h, 1);
  for (const s of ['.quick-stopwatch-bar {', '.quick-stopwatch-time {', '.btn-quick-stopwatch {', '.btn-quick-stopwatch.start {', '.btn-quick-stopwatch.save {']) dropRule(s, s);
  if (C[h] === '' && C[h - 1] === '') C.splice(h, 1);
}
const outCss = C.join(eolC);
for (const k of ['btnCustomHomeLayout', 'topHomeLayoutBtn', 'topbarActions', '.topbar-actions', 'recSegmentBar', '.rec-segment-bar', '.rec-seg-btn', '.rec-seg-count',
  'quickStopwatchBar', 'quick-stopwatch', 'recCalFuseSwitcher', 'rec-cal-fuse', 'rec-fuse-chip', 'routine-matrix', 'routine-stamp', 'routine-name-cell']) {
  if (outCss.includes(k)) throw new Error('ui.css 흔적 남음: ' + k);
}
// 여러 선택자 규칙에 묶인 클래스 선택자는 남긴다(규칙을 쪼개지 않음): .topbar-action-btn, #topHomeGuideBtn
if (!outCss.includes('.topbar-action-btn, #topHomeGuideBtn {')) throw new Error('여러 선택자 규칙이 바뀜');
if ((outCss.match(/{/g) || []).length !== (outCss.match(/}/g) || []).length) throw new Error('ui.css 괄호 짝 안 맞음');
fs.writeFileSync(cssPath, outCss, 'utf8');
console.log('ok');
