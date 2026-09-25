// tests/routine-tab-scheduler.test.js
// TASK-ES-270: 목표탭 상단 '루틴' 탭 신설 및 요일별 반복·교대근무 가변 스케줄러 단위 테스트

const fs = require('fs');
const path = require('path');
const assert = require('assert');

function runTest() {
  const indexPath = path.join(__dirname, '..', 'index.html');
  const uiCssPath = path.join(__dirname, '..', 'ui.css');

  assert.ok(fs.existsSync(indexPath), 'index.html 파일이 존재해야 합니다.');
  assert.ok(fs.existsSync(uiCssPath), 'ui.css 파일이 존재해야 합니다.');

  const indexSrc = fs.readFileSync(indexPath, 'utf8');
  const uiCss = fs.readFileSync(uiCssPath, 'utf8');

  // 1. 목표 탭 상단 서브탭에서 '루틴'이 '개인' 왼쪽에 배치되었는지 검증
  const routineSubtabIdx = indexSrc.indexOf("['routine', '루틴']");
  const personalSubtabIdx = indexSrc.indexOf("['personal', '개인']");
  assert.ok(routineSubtabIdx !== -1, "subtabsList 내 ['routine', '루틴'] 존재");
  assert.ok(personalSubtabIdx !== -1, "subtabsList 내 ['personal', '개인'] 존재");
  assert.ok(routineSubtabIdx < personalSubtabIdx, "목표 탭 상단 서브탭에서 '루틴'이 '개인'보다 앞(왼쪽)에 배치됨");

  // 2. #routineGoalsView 내 #routineDayFilterBar 및 .routine-day-chip 마크업 검증
  assert.ok(indexSrc.includes('id="routineDayFilterBar"'), 'routineDayFilterBar 컨테이너 존재');
  assert.ok(indexSrc.includes('routine-day-chip'), 'routine-day-chip 클래스 존재');
  assert.ok(indexSrc.includes("data-rday"), '요일 칩 data-rday 속성 존재');
  assert.ok(indexSrc.includes('state.routineFilterDay'), 'state.routineFilterDay 상태 바인딩 존재');
  assert.ok(indexSrc.includes('displayedRoutines'), 'displayedRoutines 동적 필터링 배열 존재');

  // 3. 교대근무 4종 캡슐 버튼에 applyShiftWorkRoutines 1초 치환 배선 검증
  assert.ok(indexSrc.includes("applyShiftWorkRoutines('day', true)"), '주간조 1초 치환 연동');
  assert.ok(indexSrc.includes("applyShiftWorkRoutines('night', true)"), '야간조 1초 치환 연동');
  assert.ok(indexSrc.includes("applyShiftWorkRoutines('duty', true)"), '당직/비번 1초 치환 연동');
  assert.ok(indexSrc.includes("applyShiftWorkRoutines('off', true)"), '휴무 1초 치환 연동');

  // 4. 일일 루틴 전수 완주 시 +10 EXP 지급 배선 검증
  assert.ok(indexSrc.includes("awardXP(10, '일일 루틴 전수 완수 (+10 EXP)')"), '전수 완주 시 10 EXP 지급 배선');
  assert.ok(indexSrc.includes("routineLastExpAwardDate"), '당일 중복 지급 방지 날짜 검증');

  // 5. ui.css 스타일 검증
  assert.ok(uiCss.includes('.routine-day-bar'), 'ui.css 내 .routine-day-bar 스타일 존재');
  assert.ok(uiCss.includes('.routine-day-chip'), 'ui.css 내 .routine-day-chip 스타일 존재');

  // 6. 요일별 필터링 비즈니스 로직 시뮬레이션
  const mockRoutines = [
    { id: 'r1', title: '월수금 헬스', days: [1, 3, 5], completedDates: [] },
    { id: 'r2', title: '화목 필라테스', days: [2, 4], completedDates: [] },
    { id: 'r3', title: '주말 독서', days: [6, 7], completedDates: [] },
    { id: 'r4', title: '매일 명상', days: [1, 2, 3, 4, 5, 6, 7], completedDates: [] }
  ];

  function filterByDay(routines, filterDay, currentDayOfWeek) {
    return routines.filter(function(r) {
      if (filterDay === 'all') return true;
      if (filterDay === 'today') return !r.days || r.days.indexOf(currentDayOfWeek) !== -1;
      const dNum = parseInt(filterDay, 10);
      return !r.days || r.days.indexOf(dNum) !== -1;
    });
  }

  // 월요일(1) 기준
  const monRoutines = filterByDay(mockRoutines, '1', 1);
  assert.strictEqual(monRoutines.length, 2, '월요일 루틴은 r1, r4 2개');
  assert.strictEqual(monRoutines.map(r => r.id).join(','), 'r1,r4');

  // 화요일(2) 기준
  const tueRoutines = filterByDay(mockRoutines, '2', 1);
  assert.strictEqual(tueRoutines.length, 2, '화요일 루틴은 r2, r4 2개');
  assert.strictEqual(tueRoutines.map(r => r.id).join(','), 'r2,r4');

  // 전체(all) 기준
  const allRoutines = filterByDay(mockRoutines, 'all', 1);
  assert.strictEqual(allRoutines.length, 4, '전체 루틴은 4개');

  // 7. 교대근무 비파괴 1초 치환 시뮬레이션 (개인 루틴 보존 검증)
  let routinesState = [
    { id: 'user_personal_1', title: '개인 영어 공부', isShiftRoutine: false },
    { id: 'user_personal_2', title: '영양제 복용', isShiftRoutine: undefined },
    { id: 'rt_shift_day_old', title: '주간 업무 몰입', isShiftRoutine: true }
  ];

  const shiftPresets = {
    night: {
      label: '야간조',
      routines: [
        { title: '야간 근무 투입 전 수면', time: '17:00', days: [1,2,3,4,5,6,7] },
        { title: '야간 집중 업무', time: '22:00', days: [1,2,3,4,5,6,7] },
        { title: '퇴근 후 암막 커튼 숙면', time: '08:30', days: [1,2,3,4,5,6,7] }
      ]
    }
  };

  function simulateApplyShift(mode, isReplace) {
    if (isReplace) {
      routinesState = routinesState.filter(function(r) {
        const isShift = r.isShiftRoutine === true || (r.id && r.id.indexOf('rt_shift_') !== -1);
        return !isShift;
      });
    }
    shiftPresets[mode].routines.forEach(function(rTpl) {
      routinesState.push({
        id: 'rt_shift_' + mode + '_' + Math.random().toString(36).substring(2,7),
        title: rTpl.title,
        time: rTpl.time,
        days: rTpl.days.slice(),
        isShiftRoutine: true,
        completedDates: []
      });
    });
  }

  simulateApplyShift('night', true);

  // 개인 루틴 2개는 무손실 보존되어야 함
  assert.ok(routinesState.some(r => r.id === 'user_personal_1'), '개인 영어 공부 보존');
  assert.ok(routinesState.some(r => r.id === 'user_personal_2'), '영양제 복용 보존');
  // 이전 주간조 교대 루틴은 제거되어야 함
  assert.ok(!routinesState.some(r => r.id === 'rt_shift_day_old'), '이전 주간 교대 루틴 제거');
  // 새로운 야간조 루틴 3종이 추가되어야 함
  assert.strictEqual(routinesState.length, 5, '개인 2개 + 야간 루틴 3개 = 총 5개');
}

runTest();
