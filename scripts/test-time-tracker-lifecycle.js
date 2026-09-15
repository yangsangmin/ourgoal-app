const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('⏱️ [시간기록 라이프사이클 시뮬레이션 검증]');

// Mock DOM 환경 구축
const elements = {};
function createMockElement(id, tag = 'div') {
  const el = {
    id: id || '',
    tagName: tag.toUpperCase(),
    className: '',
    classList: {
      _classes: new Set(),
      add: function(c) { el.classList._classes.add(c); el.className = Array.from(el.classList._classes).join(' '); },
      remove: function(c) { el.classList._classes.delete(c); el.className = Array.from(el.classList._classes).join(' '); },
      contains: function(c) { return el.classList._classes.has(c); }
    },
    style: {},
    _innerHTML: '',
    get innerHTML() { return el._innerHTML; },
    set innerHTML(html) {
      el._innerHTML = html;
      // HTML 내부의 id="..." 태그들 자동 등록
      const matches = [...html.matchAll(/id=["']([^"']+)["']/g)];
      matches.forEach(m => {
        if (!elements[m[1]]) {
          elements[m[1]] = createMockElement(m[1]);
        }
      });
    },
    textContent: '',
    value: '',
    dataset: {},
    children: [],
    setAttribute: function(k, v) { el[k] = v; },
    getAttribute: function(k) { return el[k]; },
    appendChild: function(child) {
      el.children.push(child);
      if (child.id) elements[child.id] = child;
      return child;
    },
    focus: function() {},
    scrollTop: 0,
    querySelectorAll: function(sel) {
      return Object.values(elements).filter(e => {
        if (sel === '.tt-lap-input') return e.classList.contains('tt-lap-input');
        if (sel === '.tt-preset-chip') return e.classList.contains('tt-preset-chip');
        if (sel === '[data-tsec]') return e.dataset && e.dataset.tsec !== undefined;
        return false;
      });
    }
  };
  if (id) elements[id] = el;
  return el;
}

// innerHTML에 포함된 button, input 등 자식 태그들 파싱 보강
const origCreateMockElement = createMockElement;
function createMockElementWithParser(id, tag = 'div') {
  const el = origCreateMockElement(id, tag);
  const origSetInner = Object.getOwnPropertyDescriptor(el, 'innerHTML').set;
  Object.defineProperty(el, 'innerHTML', {
    get: function() { return el._innerHTML; },
    set: function(html) {
      el._innerHTML = html;
      // id 태그 파싱
      const idMatches = [...html.matchAll(/id=["']([^"']+)["']/g)];
      idMatches.forEach(m => {
        if (!elements[m[1]]) {
          elements[m[1]] = origCreateMockElement(m[1]);
        }
      });
      // data-tsec 버튼 태그 파싱
      const chipMatches = [...html.matchAll(/<button[^>]*class=["']([^"']*tt-preset-chip[^"']*)["'][^>]*data-tsec=["']([^"']+)["'][^>]*>([^<]*)<\/button>/g)];
      chipMatches.forEach(m => {
        const chipEl = origCreateMockElement(null, 'button');
        chipEl.className = m[1];
        m[1].split(/\s+/).forEach(c => c && chipEl.classList.add(c));
        chipEl.dataset.tsec = m[2];
        chipEl.textContent = m[3];
        // 중복 방지 키
        const dummyId = 'preset_' + m[2] + '_' + Math.random().toString(36).substring(2, 5);
        elements[dummyId] = chipEl;
      });
    }
  });
  return el;
}

const mockDoc = {
  getElementById: function(id) { return elements[id] || null; },
  createElement: function(tag) { return createMockElementWithParser(null, tag); },
  body: {
    appendChild: function(child) {
      if (child.id) elements[child.id] = child;
      return child;
    }
  },
  querySelectorAll: function() { return []; }
};

const mockWindow = {
  innerWidth: 1080,
  innerHeight: 1920,
  addEventListener: function() {},
  removeEventListener: function() {},
  requestAnimationFrame: function(cb) { return 1; },
  cancelAnimationFrame: function(id) {}
};

// 전역 Mock 주입
global.document = mockDoc;
global.window = mockWindow;
global.state = {
  profile: {
    id: 'user_test',
    nickname: '상민님',
    records: [
      { id: 'rec_prev_1', text: '기존 기록 보존 확인용', startAt: '2026-09-14T10:00:00.000Z' }
    ]
  }
};
global.saveProfile = function() { global.saveProfileCalled = true; };
global.renderRecordsScreen = function() { global.renderRecordsCalled = true; };
global.renderHome = function() { global.renderHomeCalled = true; };
global.toast = function(msg) { global.lastToast = msg; };

// time-tracker.js 로드 및 실행
const code = fs.readFileSync(path.join(__dirname, '..', 'js', 'time-tracker.js'), 'utf8');
eval(code);

assert.ok(mockWindow.OurgoalTimeTracker, 'OurgoalTimeTracker 전역 객체가 노출되어야 함');
console.log('  ✓ OurgoalTimeTracker 모듈 로드 성공');

// 1. 모달 열기 시뮬레이션
mockWindow.OurgoalTimeTracker.open();
const overlay = mockDoc.getElementById('timeTrackerOverlay');
assert.ok(overlay, 'timeTrackerOverlay가 DOM에 생성되어야 함');
assert.ok(!overlay.classList.contains('hidden'), '오버레이가 화면에 표시되어야 함');
console.log('  ✓ 1. 모달 열기 성공');

// 2. 스톱워치 시작
const startBtn = mockDoc.getElementById('btnTtActionStart');
assert.ok(startBtn, '시작 버튼이 존재해야 함');
startBtn.onclick();
let trState = mockWindow.OurgoalTimeTracker.getState();
assert.strictEqual(trState.state, 'running', '스톱워치 상태가 running이어야 함');
console.log('  ✓ 2. 스톱워치 시작 성공');

// 3. 구간기록(Lap) 2회 생성
const lapBtn = mockDoc.getElementById('btnTtActionLap');
assert.ok(lapBtn, '구간기록 버튼이 활성화되어야 함');
lapBtn.onclick();
lapBtn.onclick();
assert.strictEqual(trState.laps.length, 2, '구간기록 2개가 생성되어야 함');
console.log('  ✓ 3. 구간기록 2회 생성 성공 (Lap 1, Lap 2)');

// 4. 일시중지 & 계속하기
const pauseBtn = mockDoc.getElementById('btnTtActionPause');
assert.ok(pauseBtn, '일시중지 버튼이 존재해야 함');
pauseBtn.onclick();
assert.strictEqual(trState.state, 'paused', '상태가 paused로 변경되어야 함');
const resumeBtn = mockDoc.getElementById('btnTtActionResume');
assert.ok(resumeBtn, '계속하기 버튼이 노출되어야 함');
resumeBtn.onclick();
assert.strictEqual(trState.state, 'running', '다시 running으로 복구되어야 함');
console.log('  ✓ 4. 일시중지 및 재개(계속하기) 성공');

// 5. 전체중지 및 기록하기
const stopBtn = mockDoc.getElementById('btnTtActionStopRecord');
assert.ok(stopBtn, '전체중지 및 기록하기 버튼이 존재해야 함');
trState.elapsedBeforePause = 15000;
stopBtn.onclick();
assert.strictEqual(mockDoc.getElementById('ttReviewView').style.display, 'flex', '기록 작성 뷰로 전환되어야 함');
console.log('  ✓ 5. 전체중지 및 기록하기 뷰 전환 성공');

// 6. 취소 버튼 클릭 시 2중 안전 경고 팝업 검증
const cancelBtn = mockDoc.getElementById('btnTtCancelReview');
cancelBtn.onclick();
const confirmDialog = mockDoc.getElementById('ttCancelConfirmDialog');
assert.ok(!confirmDialog.classList.contains('hidden'), '취소 경고 모달이 팝업되어야 함');
const confirmNoBtn = mockDoc.getElementById('btnTtCancelNo');
confirmNoBtn.onclick();
assert.ok(confirmDialog.classList.contains('hidden'), '취소 안함 클릭 시 경고 팝업이 닫혀야 함');
console.log('  ✓ 6. 취소 시 2중 안전 경고 팝업("정말 취소하시겠습니까?") 동작 성공');

// 7. 활동 내용 작성 및 내 기록 저장
const activityTitle = mockDoc.getElementById('ttActivityTitle');
activityTitle.value = '아워골 시간기록 신기능 개발';
const saveBtn = mockDoc.getElementById('btnTtSaveRecord');
saveBtn.onclick();

// 검증: 기존 레코드 보존 및 신규 레코드 추가 확인
assert.strictEqual(global.state.profile.records.length, 2, '기존 1개 + 신규 1개로 총 2개여야 함 (데이터 무손실)');
const savedRec = global.state.profile.records[0];
assert.strictEqual(savedRec.type, 'time_record', '타입이 time_record여야 함');
assert.strictEqual(savedRec.title, '아워골 시간기록 신기능 개발', '제목이 정확히 저장되어야 함');
assert.ok(savedRec.laps.length >= 2, '구간기록이 무손실 저장되어야 함');
assert.ok(global.saveProfileCalled, 'saveProfile이 호출되어야 함');
assert.ok(global.renderRecordsCalled, 'renderRecordsScreen이 호출되어 뷰가 즉시 갱신되어야 함');
assert.ok(overlay.classList.contains('hidden'), '저장 완료 후 오버레이가 닫혀야 함');
console.log('  ✓ 7. 내 기록 무손실 저장 및 화면 전파 성공 (Zero Data Loss)');

// 8. 타이머 모드 시뮬레이션
console.log('\n⏳ [타이머 모드 라이프사이클 시뮬레이션]');
mockWindow.OurgoalTimeTracker.open();
const tabTimerBtn = mockDoc.getElementById('ttTabTimer');
assert.ok(tabTimerBtn, '타이머 탭 버튼(ttTabTimer)이 존재해야 함');
tabTimerBtn.onclick();
trState = mockWindow.OurgoalTimeTracker.getState();
assert.strictEqual(trState.mode, 'timer', '모드가 timer로 변경되어야 함');
console.log('  ✓ 8-1. 타이머 모드 탭 전환 성공');

// 8-2. 기본 타이머 초기값 검증 (25분 = 1500초)
trState = mockWindow.OurgoalTimeTracker.getState();
assert.strictEqual(trState.timerTargetSeconds, 1500, '타이머 기본 설정 시간이 25분(1500초)이어야 함');
console.log('  ✓ 8-2. 25분 뽀모도로 기본 프리셋 확인 성공');

// 8-3. 시간 증감 조절기 버튼 테스트 (분 +1분 x 5회 = +5분)
const minUpBtn = mockDoc.getElementById('btnTtTimerMinUp');
assert.ok(minUpBtn, '분 증가 버튼이 존재해야 함');
for (let i = 0; i < 5; i++) {
  minUpBtn.onclick();
}
assert.strictEqual(trState.timerTargetSeconds, 1800, '5분 증가 후 30분(1800초)이어야 함');
console.log('  ✓ 8-3. 타이머 분 증가 버튼(+5분) 성공');

// 8-4. 타이머 카운트다운 시작
const timerStartBtn = mockDoc.getElementById('btnTtActionStart');
assert.ok(timerStartBtn, '시작 버튼이 존재해야 함');
timerStartBtn.onclick();
trState = mockWindow.OurgoalTimeTracker.getState();
assert.strictEqual(trState.state, 'running', '타이머 카운트다운 running 상태 확인');
console.log('  ✓ 8-4. 타이머 카운트다운 시작 성공');

// 8-5. 타이머 랩 기록
lapBtn.onclick();
assert.strictEqual(trState.laps.length, 1, '타이머 모드에서도 구간기록 1개 생성 확인');
console.log('  ✓ 8-5. 타이머 구간기록(Lap) 생성 성공');

// 8-6. 타이머 일시중지 & 계속하기
pauseBtn.onclick();
assert.strictEqual(trState.state, 'paused', '타이머 paused 상태 확인');
resumeBtn.onclick();
assert.strictEqual(trState.state, 'running', '타이머 running 복귀 확인');
console.log('  ✓ 8-6. 타이머 일시중지 및 재개 성공');

// 8-7. 타이머 기록하기 및 저장
trState.startTime = Date.now() - (10 * 60 * 1000); // 10분 전 시작 시뮬레이션
trState.timerRemainingBeforePause = 1800 * 1000;
const currentStopBtn = mockDoc.getElementById('btnTtActionStopRecord');
assert.ok(currentStopBtn, '타이머 동작 중 전체중지 및 기록하기 버튼이 존재해야 함');
currentStopBtn.onclick();
assert.strictEqual(mockDoc.getElementById('ttReviewView').style.display, 'flex', '타이머 완료/중지 후 리뷰 화면 전환');
activityTitle.value = '타이머 집중 독서 세션';
saveBtn.onclick();
assert.strictEqual(global.state.profile.records.length, 3, '기존 2개 + 타이머 1개로 총 3개여야 함');
const timerSavedRec = global.state.profile.records[0];
assert.strictEqual(timerSavedRec.mode, 'timer', '저장된 모드가 timer여야 함');
assert.strictEqual(timerSavedRec.title, '타이머 집중 독서 세션', '타이머 제목 정확히 저장');
console.log('  ✓ 8-7. 타이머 활동 기록 정상 저장 및 데이터 무손실 확인');

console.log('\n✨ [ALL PASS] 스톱워치 & 타이머 듀얼 엔진 라이프사이클이 100% 정상 작동함을 확인했습니다.');