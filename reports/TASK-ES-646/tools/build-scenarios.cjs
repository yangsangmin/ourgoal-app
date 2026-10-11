'use strict';
// 안전망 시나리오 묶음을 한 곳에서 조립해 reports/TASK-ES-646/scenarios/*.json 으로 쓴다(같은 진입 단계를 손으로 되풀이해 적지 않기 위한 조립기).
// 어휘는 법정 실행기(court/lib/scenario.js)의 닫힌 어휘뿐이다. 사용: node reports/TASK-ES-646/tools/build-scenarios.cjs
// 원칙: 단언은 「행동이 만든 변화」(보임/사라짐 · 다시 그린 칸의 value 속성 · 글자 · 개수)만 잰다. 2.2초 뒤 사라지는 토스트는 단언하지 않는다(L077).
const fs = require('fs'), path = require('path');
const OUT = path.resolve(__dirname, '..', 'scenarios');
fs.mkdirSync(OUT, { recursive: true });

const cell = (r, c) => '.pro-tpl-cell-input[data-row="' + r + '"][data-col="' + c + '"]';
const click = selector => ({ do: 'click', selector });
const type = (selector, text, clear) => (clear ? { do: 'type', selector, text, clear: true } : { do: 'type', selector, text });
const visible = selector => ({ expect: 'visible', selector });
const notVisible = selector => ({ expect: 'notVisible', selector });
const count = (selector, equals) => ({ expect: 'count', selector, equals });
const text = (selector, t) => ({ expect: 'textContains', selector, text: t });
const textEq = (selector, t) => ({ expect: 'textEquals', selector, text: t });
const attrVal = (selector, v) => ({ expect: 'attr', selector, name: 'value', equals: v });
const hasClass = (selector, className) => ({ expect: 'hasClass', selector, className });
const notHasClass = (selector, className) => ({ expect: 'notHasClass', selector, className });
const waitFor = (selector, timeoutMs) => ({ do: 'waitFor', selector, timeoutMs: timeoutMs || 10000 });
const NOEX = { expect: 'noExceptions' };

// 게스트로 들어가기(#btnLandingPreviewDirect) → 인사 창 닫기
const ENTER = [
  { do: 'setViewport', width: 430, height: 932 },
  { do: 'goto', path: '/index.html' },
  waitFor('#btnLandingPreviewDirect'), click('#btnLandingPreviewDirect'),
  waitFor('#btnAvatarGreetClose'), click('#btnAvatarGreetClose'), notVisible('#btnAvatarGreetClose'),
];
// 기록 탭 → 「📋 템플릿」 독 단추로 카드 펼치기
const TO_CARD = [
  waitFor('.navbtn[data-tab="records"]'), click('.navbtn[data-tab="records"]'),
  waitFor('#recQuickDockBar > button:nth-child(4)', 15000), click('#recQuickDockBar > button:nth-child(4)'),
  waitFor('#recOpenProTemplateBtn'),
];
// 카드의 여는 단추(#recOpenProTemplateBtn)로 창 열기
const OPEN = [notVisible('#proTable'), click('#recOpenProTemplateBtn'), visible('#proTable')];
const REOPEN = [click('#recOpenProTemplateBtn'), visible('#proTable')];
const PRE = ENTER.concat(TO_CARD, OPEN);

const S = [];
const add = (id, title, steps) => S.push({ id, title, steps });

add('s01-open-close', '게스트로 기록 탭의 템플릿 카드에서 전문 템플릿 기록 창을 열면 헬스 표(4행)가 뜨고 「취소」로 닫히며, 빠른 칩 「공부」로 열면 공부 표(2행)로 뜬다 (창 틀 — 열기·닫기·처음 고른 템플릿)', PRE.concat([
  text('#modalSheet h3', '전문(맞춤) 템플릿 기록'),
  text('.pro-tpl-badge', '헬스'),
  count('#proTableBody tr', 4),
  click('#proCancelBtn'),
  notVisible('#proTable'),
  click('#recQuickTemplateChips [data-quicktpl="study"]'),
  visible('#proTable'),
  text('.pro-tpl-badge', '공부'),
  count('#proTableBody tr', 2),
  attrVal(cell(0, 1), '영어 토익'),
  click('#proCancelBtn'),
  notVisible('#proTable'),
  NOEX,
]));

add('s02-hub-entry-back', '게스트로 일정 탭 날짜 허브의 「맞춤기록 작성」으로 창을 열면 돌아가기 줄이 보이고, 「돌아가기」·「취소」·「일반저장」 모두 날짜 허브로 돌아온다 (창 틀 — 날짜를 받아 열린 창의 닫기 길)', ENTER.concat([
  waitFor('.navbtn[data-tab="calendar"]'), click('.navbtn[data-tab="calendar"]'),
  waitFor('#calOpenHubBtn', 15000), click('#calOpenHubBtn'),
  visible('#hubAddProRecBtn'),
  click('#hubAddProRecBtn'),
  visible('#proRecBackToHubBtn'),
  text('#proRecBackToHubBtn', '일정 목록으로 돌아가기'),
  click('#proRecBackToHubBtn'),
  notVisible('#proTable'),
  visible('#hubAddProRecBtn'),
  click('#hubAddProRecBtn'),
  visible('#proTable'),
  click('#proCancelBtn'),
  notVisible('#proTable'),
  visible('#hubAddProRecBtn'),
  click('#hubAddProRecBtn'),
  visible('#proTable'),
  click('#proGeneralSaveBtn'),
  notVisible('#proTable'),
  visible('#hubAddProRecBtn'),
  NOEX,
]));

add('s03-table-edit', '창에서 행을 추가하고 칸에 값을 넣으면 실시간 분석 띠의 합계가 바뀌고, 행을 지우면 번호가 다시 매겨지며, 마지막 한 행을 지우면 빈 행으로 돌아간다 (표 편집 — 행 추가·칸 입력·행 삭제)', PRE.concat([
  count('#proTableBody tr', 4),
  text('#proAnalyticsWrap', '18 세트'),
  click('#proAddRowBtn'),
  count('#proTableBody tr', 5),
  type(cell(4, 1), '플랭크'),
  type(cell(4, 2), '3세트'),
  text('#proAnalyticsWrap', '21 세트'),
  click('#proAddRowBtn2'),
  count('#proTableBody tr', 6),
  attrVal(cell(4, 1), '플랭크'),
  attrVal(cell(4, 2), '3세트'),
  click('.pro-tpl-row-del[data-delrow="5"]'),
  count('#proTableBody tr', 5),
  click('.pro-tpl-row-del[data-delrow="0"]'),
  count('#proTableBody tr', 4),
  attrVal(cell(0, 1), '스쿼트'),
  attrVal(cell(3, 1), '플랭크'),
  text('#proAnalyticsWrap', '16 세트'),
  click('.pro-tpl-row-del[data-delrow="3"]'),
  click('.pro-tpl-row-del[data-delrow="2"]'),
  click('.pro-tpl-row-del[data-delrow="1"]'),
  count('#proTableBody tr', 1),
  attrVal(cell(0, 1), '스쿼트'),
  click('.pro-tpl-row-del[data-delrow="0"]'),
  count('#proTableBody tr', 1),
  attrVal(cell(0, 1), ''),
  attrVal(cell(0, 0), '1'),
  NOEX,
]));

add('s04-template-change', '창에서 템플릿을 「공부」로 바꾸면 이름표·표 머리·기본 행·추이 차트 제목이 공부용으로 바뀌고, 「영업」·「헬스」로 다시 바꿔도 그 템플릿의 기본 행으로 바뀐다 (도구 — 템플릿 변경)', PRE.concat([
  text('.pro-tpl-badge', '헬스'),
  { do: 'select', selector: '#proTplSelect', value: 'study' },
  text('.pro-tpl-badge', '공부'),
  count('#proTableBody tr', 2),
  text('#proTable thead', '공부시간(분)'),
  text('#proTrendChartWrap', '순공 시간'),
  attrVal(cell(0, 1), '영어 토익'),
  type(cell(0, 1), '바꾼과목', true),
  { do: 'select', selector: '#proTplSelect', value: 'business' },
  text('.pro-tpl-badge', '영업'),
  attrVal(cell(0, 1), '(주)에이비씨'),
  text('#proTable thead', '계약가능성(%)'),
  { do: 'select', selector: '#proTplSelect', value: 'health' },
  text('.pro-tpl-badge', '헬스'),
  count('#proTableBody tr', 4),
  attrVal(cell(0, 1), '벤치프레스'),
  text('#proTrendChartWrap', '총 볼륨'),
  NOEX,
]));

add('s05-tool-windows-a', '창의 도구 단추 「AI 코치」·「Notion 연동」·「스마트워치」는 각자의 창을 열고 닫기로 닫히며, 「CSV 가져오기」는 붙여넣은 글을 「반영」하면 창이 닫힌다 (도구 — 창이 뜨는 단추 1: 열고 닫기만, 전송·연동 실행 없음)', PRE.concat([
  click('#proCoachBtn'),
  visible('#coachCloseBtn'),
  click('#coachCloseBtn'),
  notVisible('#coachCloseBtn'),
], REOPEN, [
  click('#proNotionExportBtn'),
  visible('#notionCloseBtn'),
  click('#notionCloseBtn'),
  notVisible('#notionCloseBtn'),
], REOPEN, [
  click('#proWearableSyncBtn'),
  visible('#wearableCancelBtn'),
  click('#wearableCancelBtn'),
  notVisible('#wearableCancelBtn'),
], REOPEN, [
  click('#proCsvImportBtn'),
  visible('#csvApplyBtn'),
  type('#csvTextInput', '1,가져온종목,3세트,10회,5분,-,70점'),
  click('#csvApplyBtn'),
  notVisible('#csvApplyBtn'),
  NOEX,
]));

add('s06-tool-windows-b', '창의 도구 단추 「마켓」·「AI 사진 인식」은 각자의 창을 열고 닫기로 닫히고, 「표 속성 편집」은 열을 하나 더해 「표에 적용」하면 닫히며, 「+ 새 템플릿」으로 저장한 템플릿은 다시 연 창의 템플릿 목록에 보이고, 「음성 입력」은 음성 창을 연다 (도구 — 창이 뜨는 단추 2: 복제·AI 분석·음성 인식 실행 없음)', PRE.concat([
  click('#proTplMarketBtn'),
  visible('#mktModalCloseBtn'),
  click('#mktModalCloseBtn'),
  notVisible('#mktModalCloseBtn'),
], REOPEN, [
  click('#proVisionOcrBtn'),
  visible('#visionModalCloseBtn'),
  click('#visionModalCloseBtn'),
  notVisible('#visionModalCloseBtn'),
], REOPEN, [
  click('#proEditColsBtn'),
  visible('#colEditConfirm'),
  count('.col-edit-input', 7),
  click('#addColActionBtn'),
  count('.col-edit-input', 8),
  click('#colEditConfirm'),
  notVisible('#colEditConfirm'),
], REOPEN, [
  click('#proCreateTplBtn'),
  visible('#customTplSave'),
  type('#customTplTitle', '안전망 템플릿'),
  click('#customTplSave'),
  notVisible('#customTplSave'),
], REOPEN, [
  text('#proTplSelect', '안전망 템플릿'),
  click('#proVoiceInputBtn'),
  visible('#voiceCloseBtn'),
  NOEX,
]));

add('s07-quick-load', '첫 행 종목을 고쳐 「일반저장」한 뒤 새로 연 창에서 「루틴 불러오기」를 누르면 방금 저장한 기록의 행이 표에 들어온다 (도구 — 지난 루틴 불러오기)', PRE.concat([
  type(cell(0, 1), '안전망스쿼트', true),
  click('#proGeneralSaveBtn'),
  notVisible('#proTable'),
], REOPEN, [
  attrVal(cell(0, 1), '벤치프레스'),
  click('#proQuickLoadBtn'),
  attrVal(cell(0, 1), '안전망스쿼트'),
  count('#proTableBody tr', 4),
  NOEX,
]));

add('s08-trend-chart', '성장 추이 차트의 기간 칩 「30일」·「전체」를 누르면 그 칩이 선택 표시가 되고, 템플릿을 바꿔 차트가 다시 그려져도 고른 기간이 유지되며 칩이 계속 눌린다 (성장 추이 차트 — 기간 칩)', PRE.concat([
  hasClass('.pro-trend-filter-chip[data-period="7"]', 'active'),
  click('.pro-trend-filter-chip[data-period="30"]'),
  hasClass('.pro-trend-filter-chip[data-period="30"]', 'active'),
  notHasClass('.pro-trend-filter-chip[data-period="7"]', 'active'),
  click('.pro-trend-filter-chip[data-period="all"]'),
  hasClass('.pro-trend-filter-chip[data-period="all"]', 'active'),
  notHasClass('.pro-trend-filter-chip[data-period="30"]', 'active'),
  { do: 'select', selector: '#proTplSelect', value: 'study' },
  text('#proTrendChartWrap', '순공 시간'),
  hasClass('.pro-trend-filter-chip[data-period="all"]', 'active'),
  click('.pro-trend-filter-chip[data-period="7"]'),
  hasClass('.pro-trend-filter-chip[data-period="7"]', 'active'),
  notHasClass('.pro-trend-filter-chip[data-period="all"]', 'active'),
  NOEX,
]));

add('s09-stopwatch', '스톱워치를 시작·랩·정지·리셋하고 모드 칩으로 60초 휴식을 고르면 표시가 그에 맞게 바뀌며, 칸을 누른 뒤 랩의 「기입」을 누르면 그 칸과 종목 칸에 랩 시간·메모가 들어가고, 누른 칸이 없으면 비어 있는 첫 시간 칸에 들어가며, 「표에 시간 기입」은 누른 칸에 지금 시간을 넣는다 (스톱워치·인터벌 타이머 — 시작·랩·정지·리셋·모드·표 기입)', PRE.concat([
  textEq('#swDisplay', '00:00.0'),
  click('#swStartPauseBtn'),
  textEq('#swStartPauseBtn', '일시정지'),
  { do: 'wait', ms: 700 },
  click('#swLapBtn'),
  count('.sw-lap-row', 1),
  click('#swStartPauseBtn'),
  textEq('#swStartPauseBtn', '▶ 시작'),
  click('#swResetBtn'),
  textEq('#swDisplay', '00:00.0'),
  notVisible('.sw-lap-row'),
  click('.pro-sw-mode-chip[data-swmode="rest60"]'),
  textEq('#swDisplay', '01:00.0'),
  hasClass('.pro-sw-mode-chip[data-swmode="rest60"]', 'active'),
  click('.pro-sw-mode-chip[data-swmode="stopwatch"]'),
  textEq('#swDisplay', '00:00.0'),
  click('#swLapBtn'),
  textEq('.sw-lap-time', '00:00.0'),
  click('#proAddRowBtn'),
  count('#proTableBody tr', 5),
  click(cell(4, 4)),
  type('.sw-lap-memo-input', '랩메모'),
  click('.sw-lap-inject-btn'),
  click('#proAddRowBtn2'),
  count('#proTableBody tr', 6),
  attrVal(cell(4, 4), '00:00'),
  attrVal(cell(4, 1), '랩메모'),
  click('.pro-tpl-row-del[data-delrow="0"]'),
  count('#proTableBody tr', 5),
  attrVal(cell(4, 4), ''),
  click('.sw-lap-inject-btn'),
  click('#proAddRowBtn'),
  count('#proTableBody tr', 6),
  attrVal(cell(4, 4), '00:00'),
  attrVal(cell(4, 1), '랩메모'),
  click(cell(5, 3)),
  click('#swInjectBtn'),
  click('#proAddRowBtn2'),
  count('#proTableBody tr', 7),
  attrVal(cell(5, 3), '00:00'),
  NOEX,
]));

add('s10-save-reopen-reload', '첫 행 종목과 메모를 적어 「일반저장」하면 창이 닫히고 기록 카드가 하나 생기며, 카드의 수정으로 다시 열면 같은 값이 들어 있고, 한 칸을 더 고쳐 저장해도 카드는 하나이며, 새로 고침한 뒤 다시 열어도 두 값과 메모가 그대로 남아 있다 (저장 — 저장·다시 열기·수정 저장·새로 고침 뒤 유지)', PRE.concat([
  type(cell(0, 1), '안전망스쿼트', true),
  type('#proRecMemo', '안전망 메모'),
  click('#proGeneralSaveBtn'),
  notVisible('#proTable'),
  count('.rec-card [data-recedit]', 1),
  click('.rec-card [data-recedit]'),
  visible('#proTable'),
  text('#modalSheet h3', '전문 템플릿 기록 수정'),
  attrVal(cell(0, 1), '안전망스쿼트'),
  attrVal('#proRecMemo', '안전망 메모'),
  type(cell(1, 1), '수정런지', true),
  click('#proGeneralSaveBtn'),
  notVisible('#proTable'),
  count('.rec-card [data-recedit]', 1),
  { do: 'goto', path: '/index.html' },
  waitFor('.navbtn[data-tab="records"]', 15000), click('.navbtn[data-tab="records"]'),
  waitFor('.rec-card [data-recedit]', 15000),
  count('.rec-card [data-recedit]', 1),
  click('.rec-card [data-recedit]'),
  visible('#proTable'),
  attrVal(cell(0, 1), '안전망스쿼트'),
  attrVal(cell(1, 1), '수정런지'),
  attrVal('#proRecMemo', '안전망 메모'),
  count('#proTableBody tr', 4),
  NOEX,
]));

add('s11-calendar-save', '「일정연동저장」을 누르면 창이 닫히고 일정 탭 날짜 허브에 그 기록으로 가는 일정이 하나 생기며, 그 기록을 수정해 다시 일정연동저장해도 일정은 하나이고, 새로 고침한 뒤에도 일정이 하나 남아 있다 (저장 — 일정 연동 저장·같은 일정 갱신·새로 고침 뒤 유지)', PRE.concat([
  type(cell(0, 1), '일정연동종목', true),
  click('#proCalendarSaveBtn'),
  notVisible('#proTable'),
  waitFor('.navbtn[data-tab="calendar"]'), click('.navbtn[data-tab="calendar"]'),
  waitFor('#calOpenHubBtn', 15000), click('#calOpenHubBtn'),
  visible('#hubAddProRecBtn'),
  count('[data-hubrec]', 1),
  text('#modalSheet .sched-title', '헬스(#record='),
  click('.modal-sheet-close'),
  notVisible('#hubAddProRecBtn'),
  click('.navbtn[data-tab="records"]'),
  waitFor('.rec-card [data-recedit]', 15000),
  click('.rec-card [data-recedit]'),
  visible('#proTable'),
  attrVal(cell(0, 1), '일정연동종목'),
  type('#proRecMemo', '일정 다시 저장'),
  click('#proCalendarSaveBtn'),
  notVisible('#proTable'),
  click('.navbtn[data-tab="calendar"]'),
  waitFor('#calOpenHubBtn', 15000), click('#calOpenHubBtn'),
  visible('#hubAddProRecBtn'),
  count('[data-hubrec]', 1),
  { do: 'goto', path: '/index.html' },
  waitFor('.navbtn[data-tab="calendar"]', 15000), click('.navbtn[data-tab="calendar"]'),
  waitFor('#calOpenHubBtn', 15000), click('#calOpenHubBtn'),
  visible('#hubAddProRecBtn'),
  count('[data-hubrec]', 1),
  NOEX,
]));

const WAIT63 = []; for (let k = 0; k < 21; k++) WAIT63.push({ do: 'wait', ms: 3000 });
add('s12-interval-finish', '모드 칩 「60초 휴식」을 고르고 시작하면 60초 뒤 타이머가 스스로 멈춰 단추가 「▶ 시작」으로 돌아오고 표시가 00:00.0 이 된다 (스톱워치·인터벌 타이머 — 정해 둔 시간이 다 되면 끝남)', PRE.concat([
  click('.pro-sw-mode-chip[data-swmode="rest60"]'),
  textEq('#swDisplay', '01:00.0'),
  click('#swStartPauseBtn'),
  textEq('#swStartPauseBtn', '일시정지'),
], WAIT63, [
  textEq('#swStartPauseBtn', '▶ 시작'),
  textEq('#swDisplay', '00:00.0'),
  NOEX,
]));

for (const s of S) {
  if (s.steps.length > 60) throw new Error(s.id + ' 단계 수 ' + s.steps.length + ' > 60');
  fs.writeFileSync(path.join(OUT, s.id + '.json'), JSON.stringify(s, null, 2) + '\n', { encoding: 'utf8' });
  console.log(s.id, s.steps.length + '단계');
}
console.log('시나리오 ' + S.length + '개 →', path.relative(process.cwd(), OUT));
