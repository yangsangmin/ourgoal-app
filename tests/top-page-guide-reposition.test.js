// tests/top-page-guide-reposition.test.js
// TASK-ES-266: 전 탭 ‘이 페이지 활용법’ 우측 최상단 이름 왼쪽 배치 검증

const fs = require('fs');
const path = require('path');
const assert = require('assert');

function runTest() {
  const htmlPath = path.join(__dirname, '..', 'index.html');
  const cssPath = path.join(__dirname, '..', 'ui.css');

  assert.ok(fs.existsSync(htmlPath), 'index.html 파일이 존재해야 합니다.');
  assert.ok(fs.existsSync(cssPath), 'ui.css 파일이 존재해야 합니다.');

  const html = fs.readFileSync(htmlPath, 'utf8');
  const css = fs.readFileSync(cssPath, 'utf8');

  // 1. #topHomeGuideBtn 요소 존재 검증
  assert.ok(html.includes('id="topHomeGuideBtn"'), '#topHomeGuideBtn 버튼이 index.html에 존재해야 합니다.');

  // 2. 버튼 텍스트가 지시 원문 그대로 "💡 이 페이지 활용법"인지 검증
  const guideBtnMatch = html.match(/<button[^>]*id="topHomeGuideBtn"[^>]*>([\s\S]*?)<\/button>/);
  assert.ok(guideBtnMatch, '#topHomeGuideBtn 엘리먼트 정규식 매칭 성공');
  assert.ok(guideBtnMatch[1].includes('💡 이 페이지 활용법'), '버튼 텍스트가 "💡 이 페이지 활용법"이어야 합니다.');

  // 3. 물리적 순서 검증: topbar-right 내에서 [topNotifBtn] -> [topHomeGuideBtn] -> [topUserChip] (이름 표시 왼쪽)
  const topbarRightStart = html.indexOf('<div class="topbar-right">');
  assert.ok(topbarRightStart !== -1, '.topbar-right 영역이 존재해야 합니다.');
  // topbar-right 블록 (약 1500자)
  const topbarRightHtml = html.substring(topbarRightStart, topbarRightStart + 2000);

  const idxNotif = topbarRightHtml.indexOf('id="topNotifBtn"');
  const idxGuide = topbarRightHtml.indexOf('id="topHomeGuideBtn"');
  const idxUserChip = topbarRightHtml.indexOf('id="topUserChip"');

  assert.ok(idxNotif !== -1, '#topNotifBtn이 .topbar-right 내에 존재해야 합니다.');
  assert.ok(idxGuide !== -1, '#topHomeGuideBtn이 .topbar-right 내에 존재해야 합니다.');
  assert.ok(idxUserChip !== -1, '#topUserChip이 .topbar-right 내에 존재해야 합니다.');

  assert.ok(idxNotif < idxGuide, '알림 벨(#topNotifBtn)이 가이드 버튼(#topHomeGuideBtn)보다 왼쪽에 위치해야 합니다.');
  assert.ok(idxGuide < idxUserChip, '가이드 버튼(#topHomeGuideBtn)이 유저 칩(#topUserChip, 이름 표시) 바로 왼쪽에 위치해야 합니다.');

  // 4. 클릭 이벤트 및 showTabUsageGuide 연동 검증
  assert.ok(html.includes('showTabUsageGuide(window.state && window.state.activeTab || \'home\')'), '버튼 클릭 시 showTabUsageGuide에 현재 활성 탭이 전달되어야 합니다.');

  // 5. setTab 함수 내 탭별 타이틀 동적 동기화 검증
  assert.ok(html.includes('guideTabLabels'), 'setTab 내 가이드 라벨 맵핑이 존재해야 합니다.');
  assert.ok(html.includes("topGuideBtn.title = '이 페이지 활용법 (' + guideLabel + ')'"), 'setTab 내 title 동기화 로직이 존재해야 합니다.');

  // 6. ui.css 모바일 375px 오버플로우 방어 스타일 검증
  assert.ok(css.includes('.topbar-guide-btn'), 'ui.css에 .topbar-guide-btn 스타일이 정의되어야 합니다.');
  assert.ok(css.includes('#topUserName'), 'ui.css에 #topUserName 스타일이 정의되어야 합니다.');
  assert.ok(css.includes('text-overflow:ellipsis') || css.includes('text-overflow: ellipsis'), '#topUserName에 text-overflow: ellipsis가 적용되어야 합니다.');
}

runTest();
