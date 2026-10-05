'use strict';
// #TASK-ES-456 게스트 조작 비교 단계(dom-compare-inline-p1.js 가 읽는다): 옮긴 openCalendarDayEditHubModal(일정 수정/관리 허브 창)이 불리는 곳을 차례로 누른다.
//   일정 탭: 오늘 칸 고르기 → 「📅 허브」(window.openCalendarDayEditHubModal) → 「새 일정 추가」(openCalendarManualEditModal) → 제목 넣고 저장(허브 다시 그림)
//   → 목록 연필(data-hubedit) → 「취소」(허브로) → 완료 동그라미(data-hubtogglesched → toggleScheduleDone → 허브 다시 그림) → 「‹ 일정 목록으로」 경로 → 「닫기」
const val = (sel, text) => ({ evalFn: '(function(){ var el = document.querySelector(' + JSON.stringify(sel) + '); if(!el) return "missing"; el.value = ' + JSON.stringify(text) + '; el.dispatchEvent(new Event("input", { bubbles: true })); return "value"; })()' });
exports.globals = ['openCalendarDayEditHubModal', 'openCalendarManualEditModal'];
const HUB = '#screen-calendar button[title="누르면: 이 날짜의 타임라인, 메모, 할 일을 한 번에 관리합니다"]';
exports.steps = ({ click, clickIn }) => [
  ['cal-enter', { goTab: 'calendar' }, 3000],
  ['cal-today', click('#screen-calendar .s-cal-day-cell.today'), 800],
  ['hub-open', click(HUB), 800],
  ['hub-add', clickIn('#hubAddNewBtn'), 800],
  ['edit-type', val('#calEditTitle', '허브 비교 일정')],
  ['edit-save', clickIn('#calEditSaveBtn'), 1500],
  ['hub-edit0', clickIn('[data-hubedit="0"]'), 800],
  ['edit-cancel', clickIn('#calEditCancelBtn'), 800],
  ['hub-toggle', clickIn('[data-hubtogglesched]'), 1500],
  ['hub-toggle-back', clickIn('[data-hubtogglesched]'), 1500],
  ['hub-close', clickIn('#hubCloseBtn'), 600],
  ['hub-reopen', click(HUB), 800],
  ['hub-close2', { closeModal: true }],
  ['tab-roundtrip', { tabRoundTrip: true }],
];
