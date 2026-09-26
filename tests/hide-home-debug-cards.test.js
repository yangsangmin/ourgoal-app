'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const SUITE_NAME = 'hide-home-debug-cards';

function runTests() {
  console.log(`[TEST START] ${SUITE_NAME}`);

  const rootDir = path.resolve(__dirname, '..');
  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  const uiCss = fs.readFileSync(path.join(rootDir, 'ui.css'), 'utf8');

  // 1. index.html 내 비노출 슬롯 검증
  assert(indexHtml.includes('id="ogTaskWireSlot"'), 'index.html must contain #ogTaskWireSlot');
  assert(indexHtml.includes('<div id="ogTaskWireSlot" style="display:none;" aria-hidden="true">'), '#ogTaskWireSlot must have display:none and aria-hidden');

  // 2. 홈화면 주요 위젯의 최상단 도달성 및 존재 검증
  assert(indexHtml.includes('id="levelBadgeRow"'), 'index.html must maintain #levelBadgeRow');
  assert(indexHtml.includes('id="todayMissionCard"'), 'index.html must maintain #todayMissionCard');
  assert(indexHtml.includes('id="homeGrassSummaryCard"'), 'index.html must maintain #homeGrassSummaryCard');
  assert(indexHtml.includes('id="captureCardBox"'), 'index.html must maintain #captureCardBox');

  // 3. 23종의 배선 컨테이너 및 액션 버튼 무결성 보존 검증 (스모크/Court 하위 호환)
  const taskNumbers = [26, 31, 32, 33, 34, 35, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53];
  for (const num of taskNumbers) {
    assert(indexHtml.includes(`id="og-task-${num}-container"`), `index.html must preserve #og-task-${num}-container`);
    assert(indexHtml.includes(`id="og-task-${num}-action-btn"`), `index.html must preserve #og-task-${num}-action-btn`);
  }

  // 4. ui.css 내 전역 은폐 규칙 검증
  assert(uiCss.includes('#ogTaskWireSlot'), 'ui.css must contain #ogTaskWireSlot');
  assert(uiCss.includes('.og-feature-card'), 'ui.css must contain .og-feature-card hiding rule');
  assert(uiCss.includes('display: none !important;'), 'ui.css must enforce display: none !important');

  console.log(`[TEST PASS] ${SUITE_NAME} - All assertions succeeded!`);
}

try {
  runTests();
} catch (err) {
  console.error(`[TEST FAILED] ${SUITE_NAME}:`, err);
  throw err;
}
