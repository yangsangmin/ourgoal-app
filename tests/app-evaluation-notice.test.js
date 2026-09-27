'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

function runTest() {
  console.log('[TEST] #TASK-ES-317: 아워골 평가해주기 창 밑 상시 평가 안내 문구 검증 시작');

  // 1. index.html 파일 정적 분석
  const indexPath = path.resolve(__dirname, '../index.html');
  const indexHtml = fs.readFileSync(indexPath, 'utf8');

  // 1-1. 모달 하단 상시 평가 안내 문구 검증
  assert(indexHtml.includes('id="evalModalAlwaysNotice"'), 'evalModalAlwaysNotice id가 index.html에 있어야 합니다.');
  assert(indexHtml.includes('언제 얼마든지 평가해주실 수 있습니다'), 'index.html에 "언제 얼마든지 평가해주실 수 있습니다" 문구가 포함되어야 합니다.');
  assert(indexHtml.includes('한 번 평가하면 끝이 아니며'), '1회성 오해 해소 문구가 모달 하단에 있어야 합니다.');

  // 1-2. 모달 상단 서두 안내 문구 검증
  const modalHeaderIntroRegex = /여러분의 솔직한 피드백이 아워골을 더 훌륭하게 만듭니다[\s\S]*?언제 얼마든지 평가해주실 수 있습니다/;
  assert(modalHeaderIntroRegex.test(indexHtml), '모달 본문 서두에 상시 평가 안내 문구가 포함되어야 합니다.');

  // 1-3. 홈탭 고정 배너 하단 캡션 검증
  assert(indexHtml.includes('id="homeEvalBannerAlwaysNotice"'), 'homeEvalBannerAlwaysNotice id가 index.html에 있어야 합니다.');
  const bannerNoticeRegex = /id="homeEvalBannerAlwaysNotice"[\s\S]*?언제 얼마든지 평가해주실 수 있습니다[\s\S]*?상시 반복 평가 환영/;
  assert(bannerNoticeRegex.test(indexHtml), '홈탭 고정 배너에 상시 평가 환영 안내 문구가 포함되어야 합니다.');

  // 1-4. 평가 제출 후 피드백 토스트 문구 검증
  assert(indexHtml.includes('소중한 평가가 접수되었습니다. 언제 얼마든지 다시 평가해주실 수 있습니다!'), '제출 완료 토스트에 재평가 가능 안내가 포함되어야 합니다.');

  // 2. js/components.js 내 직통 핸들러 동작 검증
  const components = require('../js/components.js');
  assert(typeof components.handle홈탭_Item66Action === 'function', 'handle홈탭_Item66Action 함수가 export 되어야 합니다.');

  // 모의 DOM 및 전역 객체 세팅
  let vibrateMs = null;
  let homeRendered = false;
  let goalsRendered = false;
  let recordsRendered = false;
  let calendarRendered = false;
  let allRendered = false;
  let toastMsg = null;
  let cachedPayload = null;

  global.window = {
    navigator: {
      vibrate: (ms) => { vibrateMs = ms; }
    },
    state: {
      profile: {
        id: 'test_user_66',
        name: '상민님',
        settings: {}
      }
    },
    localStorage: {
      setItem: (key, val) => {
        if (key === 'og_task-66_cache') {
          cachedPayload = JSON.parse(val);
        }
      }
    },
    toast: (msg) => { toastMsg = msg; },
    renderHome: () => { homeRendered = true; },
    renderGoalsScreen: () => { goalsRendered = true; },
    renderRecordsScreen: () => { recordsRendered = true; },
    renderCalendar: () => { calendarRendered = true; },
    renderAll: () => { allRendered = true; }
  };

  // 실행 검증
  return components.handle홈탭_Item66Action(null, { testRun: true })
    .then(result => {
      assert.strictEqual(vibrateMs, 12, '12ms 햅틱 반응이 실행되어야 합니다.');
      assert.strictEqual(result.task_id, 'TASK-ES-317', 'task_id는 TASK-ES-317 이어야 합니다.');
      assert.strictEqual(result.recurring_evaluation_guaranteed, true, '상시 평가 보장 플래그가 true 이어야 합니다.');
      assert(cachedPayload && cachedPayload.task_id === 'TASK-ES-317', '로컬 스토리지 og_task-66_cache에 캐시가 영속화되어야 합니다.');
      assert.strictEqual(homeRendered, true, 'renderHome이 호출되어야 합니다.');
      assert.strictEqual(goalsRendered, true, 'renderGoalsScreen이 호출되어야 합니다.');
      assert.strictEqual(recordsRendered, true, 'renderRecordsScreen이 호출되어야 합니다.');
      assert.strictEqual(calendarRendered, true, 'renderCalendar가 호출되어야 합니다.');
      assert(toastMsg && toastMsg.includes('언제 얼마든지 평가해주실 수 있습니다'), '안내 토스트 메시지가 정상 출력되어야 합니다.');

      console.log('✔ [TEST] #TASK-ES-317 모든 단언문 무결점 통과!');
    });
}

try {
  runTest().catch(err => {
    console.error('❌ [TEST FAIL]', err);
    throw err;
  });
} catch (err) {
  console.error('❌ [TEST FAIL]', err);
  throw err;
}
