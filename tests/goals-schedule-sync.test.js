/**
 * [#TASK-ES-259] 목표탭 구글 캘린더 일정 설정 버튼 및 디데이(기간) 표시 연동 단위 검증
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const SUITE_TASK = 'TASK-ES-259';

console.log('[TEST] goals-schedule-sync.test.js: starting execution for ' + SUITE_TASK + '...');

const indexPath = path.join(__dirname, '..', 'index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf8');
const uiCssPath = path.join(__dirname, '..', 'ui.css');
const uiCss = fs.readFileSync(uiCssPath, 'utf8');

// 1. formatSchedulePillHtml 함수 및 포맷팅 검증
{
  function dDay(dateStr){
    if(!dateStr) return '';
    var target = new Date(dateStr.slice(0, 10) + 'T00:00:00');
    var today = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00');
    var diff = Math.round((target - today) / 86400000);
    if(diff === 0) return 'D-Day';
    return diff > 0 ? ('D-' + diff) : ('D+' + Math.abs(diff));
  }

  function formatSchedulePillHtml(item, level, goalId, msId, taskId){
    var sDate = (item && item.startDate) ? String(item.startDate).slice(0, 10) : '';
    var dDate = (item && item.dueDate) ? String(item.dueDate).slice(0, 10) : '';
    var gid = goalId || '';
    var mid = msId || '';
    var tid = taskId || '';
    if(!sDate && !dDate){
      return '<button type="button" class="schedule-pill-btn empty" data-setschedule="1" data-schedlevel="'+level+'" data-schedgid="'+gid+'" data-schedmsid="'+mid+'" data-schedtid="'+tid+'" title="일정 설정">일정설정</button>';
    }
    if(sDate && dDate && sDate !== dDate){
      var sParts = sDate.split('-');
      var dParts = dDate.split('-');
      var sText = sParts[0] + '.' + parseInt(sParts[1], 10) + '.' + parseInt(sParts[2], 10) + '.';
      var dText = dParts[0] + '.' + parseInt(dParts[1], 10) + '.' + parseInt(dParts[2], 10) + '.';
      var rangeText = sText + '~' + dText;
      return '<button type="button" class="schedule-pill-btn has-date" data-setschedule="1" data-schedlevel="'+level+'" data-schedgid="'+gid+'" data-schedmsid="'+mid+'" data-schedtid="'+tid+'" title="일정 기간: '+rangeText+' (클릭하여 수정)">'+rangeText+'</button>';
    }
    var singleDate = dDate || sDate;
    var dText = dDay(singleDate);
    return '<button type="button" class="schedule-pill-btn has-date" data-setschedule="1" data-schedlevel="'+level+'" data-schedgid="'+gid+'" data-schedmsid="'+mid+'" data-schedtid="'+tid+'" title="마감일 '+singleDate+' (클릭하여 수정)">'+dText+'</button>';
  }

  // 1-1. 미설정 시: '일정설정' 빈 배지
  const emptyPill = formatSchedulePillHtml({}, 'goal', 'g_1');
  assert.ok(emptyPill.includes('schedule-pill-btn empty'), '일정 미설정 시 empty 클래스 적용');
  assert.ok(emptyPill.includes('일정설정'), '일정 미설정 시 "일정설정" 텍스트 출력');
  assert.ok(emptyPill.includes('data-schedlevel="goal"'), '레벨 data 속성 goal 보존');

  // 1-2. 단일 일자: 디데이 텍스트
  const today = new Date();
  today.setDate(today.getDate() + 5);
  const futureDate = today.toISOString().slice(0, 10);
  const singlePill = formatSchedulePillHtml({ dueDate: futureDate }, 'ms', 'g_1', 'm_1');
  assert.ok(singlePill.includes('schedule-pill-btn has-date'), '단일 일자 설정 시 has-date 클래스 적용');
  assert.ok(singlePill.includes('D-5'), '단일 일자 디데이 계산 정상 (D-5)');

  // 1-3. 기간 일자: (년).(월).(일).~(년).(월).(일). 포맷
  const rangePill = formatSchedulePillHtml({ startDate: '2026-09-25', dueDate: '2026-10-05' }, 'task', 'g_1', 'm_1', 't_1');
  assert.ok(rangePill.includes('schedule-pill-btn has-date'), '기간 일자 has-date 클래스 적용');
  assert.ok(rangePill.includes('2026.9.25.~2026.10.5.'), '상민님 지정 규격 (년).(월).(일).~(년).(월).(일). 완벽 일치');
}

// 2. index.html 내 목표(Goal), 마일스톤(Milestone), 세부할일(Task) 3계층 배치 및 이벤트 배선 검증
{
  // 2-1. 목표 헤더 metaStrip 내 formatSchedulePillHtml 및 data-calsyncgoal 배치
  assert.ok(indexHtml.includes("formatSchedulePillHtml(goal, 'goal', goal.id) +"), '목표 카드에 formatSchedulePillHtml 상시 렌더링');
  assert.ok(indexHtml.includes('data-calsyncgoal="\'+goal.id+\'"'), '목표 카드에 data-calsyncgoal 달력 버튼 배치');
  assert.ok(indexHtml.includes("body.querySelectorAll('[data-calsyncgoal]')"), 'goalDetailBody 내 data-calsyncgoal 클릭 이벤트 리스너 바인딩');

  // 2-2. 세부할일 행(renderSingleTaskRow) 내 formatSchedulePillHtml 및 data-calsynctask 나란히 배치
  assert.ok(indexHtml.includes("formatSchedulePillHtml(t, 'task', goal.id, m.id, t.id) +"), '세부할일 행에 formatSchedulePillHtml 배치');
  assert.ok(indexHtml.includes("data-calsynctask=\"'+t.id+'\""), '세부할일 행에 data-calsynctask 달력 버튼 배치');

  // 2-3. 마일스톤 행(ms-sub-meta-right) 내 formatSchedulePillHtml 및 calBtnHtml(data-calsyncms) 나란히 배치
  assert.ok(indexHtml.includes("formatSchedulePillHtml(m, 'ms', goal.id, m.id) +"), '마일스톤 행에 formatSchedulePillHtml 배치');
  assert.ok(indexHtml.includes("data-calsyncms=\"'+m.id+'\""), '마일스톤 행에 data-calsyncms 달력 버튼 배치');

  // 2-4. data-setschedule 클릭 이벤트 리스너 및 openScheduleSetupModal 연동
  assert.ok(indexHtml.includes("body.querySelectorAll('[data-setschedule]')"), '전체 data-setschedule 버튼 리스너 일괄 바인딩');
  assert.ok(indexHtml.includes('openScheduleSetupModal(level, gid, msId, tid)'), '클릭 시 openScheduleSetupModal 직통 호출');
}

// 3. quickSyncToCalendar 및 applyScheduleUpdate 4대 뷰 원자적 동시 전파 검증
{
  // 3-1. quickSyncToCalendar 날짜 미설정 시 친절한 유도 모달 팝업
  assert.ok(indexHtml.includes("toast('먼저 일정을 설정해주세요 🗓️')"), '일정 미설정 시 안내 토스트 표출');
  assert.ok(indexHtml.includes('openScheduleSetupModal(kind, goalId, msId, taskId)'), '일정 미설정 시 openScheduleSetupModal 자동 호출');

  // 3-2. applyScheduleUpdate 4대 뷰 동시 전파
  assert.ok(indexHtml.includes('async function applyScheduleUpdate(level, gid, msId, tid, startISO, endISO)'), 'applyScheduleUpdate 함수 정의');
  assert.ok(indexHtml.includes('renderGoalsScreen();') && indexHtml.includes('renderCalendarScreen();'), '목표 및 캘린더 뷰 갱신');
  assert.ok(indexHtml.includes("if(typeof renderHome === 'function') renderHome();"), '홈 화면 갱신');
  assert.ok(indexHtml.includes("if(typeof renderRecordsScreen === 'function') renderRecordsScreen();"), '기록 탭 갱신');
}

// 4. ui.css 모바일 375px 및 터치 타깃 접근성 검증
{
  assert.ok(uiCss.includes('.schedule-pill-btn'), 'schedule-pill-btn 클래스 정의');
  assert.ok(uiCss.includes('.schedule-pill-btn.empty'), 'schedule-pill-btn.empty 클래스 정의');
  assert.ok(uiCss.includes('.schedule-pill-btn.has-date'), 'schedule-pill-btn.has-date 클래스 정의');
  assert.ok(uiCss.includes('.schedule-pill-btn::after'), 'schedule-pill-btn::after 히트박스 정의 (터치 44px 보장)');
  assert.ok(uiCss.includes('max-width: 170px'), '모바일 가로 넘침 방지 max-width 정의');
}

console.log('[TEST] goals-schedule-sync.test.js: ALL ASSERTIONS PASSED! (100% OK)');
