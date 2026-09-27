'use strict';

/**
 * [TASK-ES-327] 프로필 내 동네(Region) 시군구 설정 및 저장 작동 오류 수정 및 쾌속 스마트 탐색 UX 단위 테스트
 * 규칙 준수: 프로세스를 강제 종료하지 않고 예외 발생 시 throw 처리
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// 1. 파일 무결성 및 구문 검사
const indexPath = path.join(__dirname, '..', 'index.html');
const cssPath = path.join(__dirname, '..', 'ui.css');
const componentsPath = path.join(__dirname, '..', 'js', 'components.js');

const htmlContent = fs.readFileSync(indexPath, 'utf8');
const cssContent = fs.readFileSync(cssPath, 'utf8');
const componentsContent = fs.readFileSync(componentsPath, 'utf8');

// [검증 1] 스모크 테스트 필수 시그니처 보존
assert.ok(htmlContent.includes("wireRegionPicker(sheet, 'pvRegion', regionRef);"), "[TASK-ES-327] wireRegionPicker(sheet, 'pvRegion', regionRef); 시그니처 100% 보존");

// [검증 2] 상단 요약 바, 초기화 버튼, 스마트 검색창 마크업 확인
assert.ok(htmlContent.includes("pv-region-summary-bar"), "[TASK-ES-327] 요약 바 클래스 존재");
assert.ok(htmlContent.includes("pv-region-clear-btn"), "[TASK-ES-327] 초기화 버튼 클래스 존재");
assert.ok(htmlContent.includes("pv-region-search-input"), "[TASK-ES-327] 1초 스마트 검색창 클래스 존재");
assert.ok(htmlContent.includes("pv-region-search-results"), "[TASK-ES-327] 검색 결과 슬롯 클래스 존재");

// [검증 3] CSS 44px 터치타겟 및 스타일 정의
assert.ok(cssContent.includes(".pv-region-summary-bar"), "[TASK-ES-327] CSS에 .pv-region-summary-bar 정의됨");
assert.ok(cssContent.includes(".pv-region-clear-btn"), "[TASK-ES-327] CSS에 .pv-region-clear-btn 정의됨");
assert.ok(cssContent.includes(".pv-region-search-input"), "[TASK-ES-327] CSS에 .pv-region-search-input 정의됨");
assert.ok(cssContent.includes("min-height: 44px"), "[TASK-ES-327] CSS에 44px 터치타겟 정의됨");

// [검증 4] 직통 액션 핸들러 handle프로필_Item76Action 존재
assert.ok(componentsContent.includes("handle프로필_Item76Action"), "[TASK-ES-327] js/components.js에 handle프로필_Item76Action 정의됨");
assert.ok(componentsContent.includes("og_task-76_cache"), "[TASK-ES-327] task-76 로컬 캐시 키 존재");

// [검증 5] 가상 환경 모의 및 handle프로필_Item76Action 실행 테스트
let mockVibrate = null;
let mockLocalStorage = {};
let viewRenderCounts = { profile: 0, settings: 0, home: 0, comm: 0 };

global.window = {
  navigator: {
    vibrate: function(ms) {
      mockVibrate = ms;
    }
  },
  localStorage: {
    getItem: function(k) { return mockLocalStorage[k] || null; },
    setItem: function(k, v) { mockLocalStorage[k] = String(v); },
    removeItem: function(k) { delete mockLocalStorage[k]; }
  },
  renderProfileCard: function() { viewRenderCounts.profile++; },
  renderSettingsScreen: function() { viewRenderCounts.settings++; },
  renderHome: function() { viewRenderCounts.home++; },
  renderCommScreen: function() { viewRenderCounts.comm++; },
  showToast: function() {},
  toast: function() {},
  state: {
    profile: {
      id: 'user_test_76',
      displayName: '홍길동',
      region: '서울 강남구',
      regionPublic: true
    }
  }
};

const Components = require(componentsPath);

// handle프로필_Item76Action 동작 검증
(async function runActionTest() {
  // 1. 동네 변경
  const res1 = await Components.handle프로필_Item76Action({ action: 'set_region', region: '부산 해운대구' });
  assert.strictEqual(res1.region, '부산 해운대구', '동네 설정이 부산 해운대구로 반영되어야 함');
  assert.strictEqual(global.window.state.profile.region, '부산 해운대구', 'state.profile.region도 갱신되어야 함');
  assert.strictEqual(mockVibrate, 12, '12ms 햅틱 반응이 발생해야 함');
  assert.ok(viewRenderCounts.profile > 0, '4대 뷰가 전파되어야 함');

  // 2. 동네 초기화
  const res2 = await Components.handle프로필_Item76Action({ action: 'clear_region' });
  assert.strictEqual(res2.region, '', '초기화 시 region은 빈 문자열이어야 함');
  assert.strictEqual(global.window.state.profile.region, '', 'state.profile.region도 빈 문자열이어야 함');

  // 캐시 확인
  const cached = JSON.parse(mockLocalStorage['og_task-76_cache']);
  assert.strictEqual(cached.ticket, '76', '캐시 티켓 번호 76');
  assert.strictEqual(cached.region, '', '캐시 region도 초기화 상태');

  console.log('✅ [TASK-ES-327] 모든 프로필 내 동네 단위 테스트 통과');
})().catch(function(err) {
  console.error('❌ 테스트 실패:', err);
  throw err;
});
