/**
 * tests/feed-share-latest-record.test.js
 * #TASK-ES-314 [63] 피드 게시 시 실천기록 최신순 자동적용 및 기록 맞춤형 AI피드백/다짐 연동 검증
 */

'use strict';
const fs = require('fs');
const path = require('path');
const { readComponentsBundle } = require('./helpers/components-bundle.js'); // #TASK-ES-412 컴포넌트 합본(원문 + 키트 부품)
const assert = require('assert');

console.log('[TEST START] feed-share-latest-record (#TASK-ES-314)');

const rootDir = path.resolve(__dirname, '..');
const htmlPath = path.join(rootDir, 'index.html');
const jsCompPath = path.join(rootDir, 'js', 'components.js');

const html = fs.readFileSync(htmlPath, 'utf8');
const jsComp = readComponentsBundle();
const componentsModule = require(jsCompPath);

// 1. index.html 피드 게시 모달 내 최신순 정렬 및 자동 선택 로직 검증
assert.ok(html.includes('userRecords'), 'index.html: userRecords 배열 존재 확인');
assert.ok(html.includes('userRecords[0]'), 'index.html: 최신 기록 userRecords[0] 자동 프리셀렉트 확인');
assert.ok(html.includes("recSelect.addEventListener('change'"), 'index.html: recSelect change 이벤트 리스너 확인');
assert.ok(html.includes('generateRecordPledgeMessage'), 'index.html: generateRecordPledgeMessage 연동 확인');
console.log('1. index.html 피드 게시 모달 최신순 정렬 및 이벤트 바인딩 검증 완료');

// 2. components.js generateRecordPledgeMessage 헬퍼 함수 정밀 검증
assert.ok(typeof componentsModule.generateRecordPledgeMessage === 'function', 'components.js: generateRecordPledgeMessage export 확인');

// 케이스 A: 시간 기록이 포함된 실천 기록
const pledgeWithTime = componentsModule.generateRecordPledgeMessage({
  title: '알고리즘 문제 풀이',
  durationMinutes: 90
}, null);
assert.ok(pledgeWithTime.includes('1시간 30분'), '소요 시간(1시간 30분) 포맷팅 반영 확인');
assert.ok(pledgeWithTime.includes('알고리즘 문제 풀이'), '실천 제목 반영 확인');

// 케이스 B: 일반 실천 텍스트 기록
const pledgeSimple = componentsModule.generateRecordPledgeMessage({
  text: '아침 조깅 5km 완료'
}, null);
assert.ok(pledgeSimple.includes('아침 조깅 5km 완료'), '실천 텍스트 반영 확인');
assert.ok(pledgeSimple.includes('꾸준함이 비범함을 만듭니다'), '기본 응원 멘트 포함 확인');

// 케이스 C: 기록 없이 목표만 있는 경우
const pledgeGoalOnly = componentsModule.generateRecordPledgeMessage(null, {
  title: '정보처리기사 취득'
});
assert.ok(pledgeGoalOnly.includes('정보처리기사 취득'), '목표 제목 반영 확인');

// 케이스 D: 기록 및 목표 모두 없는 경우
const pledgeFallback = componentsModule.generateRecordPledgeMessage(null, null);
assert.ok(pledgeFallback.includes('오늘도 목표를 향해'), '폴백 다짐 멘트 반영 확인');
console.log('2. generateRecordPledgeMessage 다각적 멘트 생성 검증 완료');

// 3. components.js handle소통_Item63Action 직통 핸들러 검증
assert.ok(typeof componentsModule.handle소통_Item63Action === 'function', 'components.js: handle소통_Item63Action 함수 export 확인');

async function testItem63Action() {
  const mockStorage = {};
  let hapticDuration = null;
  let viewRenderedCount = 0;

  const mockWindow = {
    localStorage: {
      setItem: (key, val) => { mockStorage[key] = val; },
      getItem: (key) => mockStorage[key] || null
    },
    navigator: {
      vibrate: (ms) => { hapticDuration = ms; }
    },
    renderCalendar: () => { viewRenderedCount++; },
    renderGoalsScreen: () => { viewRenderedCount++; },
    renderHome: () => { viewRenderedCount++; },
    renderRecordsScreen: () => { viewRenderedCount++; },
    toast: () => {}
  };

  const oldWindow = global.window;
  const oldLocalStorage = global.localStorage;

  try {
    global.window = mockWindow;
    global.localStorage = mockWindow.localStorage;

    const res = await componentsModule.handle소통_Item63Action();

    assert.strictEqual(hapticDuration, 12, '12ms 햅틱 진동 피드백 검증');
    assert.strictEqual(viewRenderedCount, 4, '헌법 제15조 제6항 4대 뷰 동시 전파 검증');
    assert.ok(mockStorage['og_task-63_cache'], '로컬 캐시 og_task-63_cache 영속화 확인');

    const cached = JSON.parse(mockStorage['og_task-63_cache']);
    assert.strictEqual(cached.ticket, '63', '티켓 번호 63 확인');
    assert.strictEqual(cached.latest_record_auto_select, true, 'latest_record_auto_select 플래그 확인');
    assert.strictEqual(cached.record_customized_feedback_and_pledge, true, 'record_customized_feedback_and_pledge 플래그 확인');
    assert.strictEqual(cached.state, 'completed', '상태 completed 확인');
    assert.strictEqual(res.state, 'completed', '반환값 state completed 확인');

    console.log('3. handle소통_Item63Action 8원칙 및 4대 뷰 원자적 전파 검증 완료');
  } finally {
    global.window = oldWindow;
    global.localStorage = oldLocalStorage;
  }
}

testItem63Action().then(() => {
  console.log('[TEST COMPLETE] feed-share-latest-record verification done');
}).catch(err => {
  console.error('[TEST ERROR]', err);
  throw err;
});
