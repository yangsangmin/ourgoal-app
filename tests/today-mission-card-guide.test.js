/**
 * [#TASK-ES-262] 오늘의 미션 추천카드 내 안내멘트 생성 (‘뭘 할지 모르겠을 때 도움돼요’) 단위 검증
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const SUITE_TASK = 'TASK-ES-262';

console.log('[TEST] today-mission-card-guide.test.js: starting execution for ' + SUITE_TASK + '...');

const indexPath = path.join(__dirname, '..', 'index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf8');
const uiCssPath = path.join(__dirname, '..', 'ui.css');
const uiCss = fs.readFileSync(uiCssPath, 'utf8');

// 1. 홈 탭 오늘의 미션 카드 헤더 마크업 및 안내멘트 텍스트 검증
{
  assert(indexHtml.includes('class="mission-card"'), 'mission-card 컨테이너가 렌더링에 존재해야 합니다.');
  assert(indexHtml.includes('오늘의 카드'), '오늘의 카드 레이블이 존재해야 합니다.');
  assert(indexHtml.includes('class="today-card-guide-hint"'), 'today-card-guide-hint 클래스가 마크업에 존재해야 합니다.');
  assert(indexHtml.includes('뭘 할지 모르겠을 때 도움돼요(내 목표기반)'), '상민님 원문 지정 안내멘트가 존재해야 합니다.');
}

// 2. CSS 스타일 검증 (1pt 축소 폰트 규격 및 모바일 375px 반응형 미디어 쿼리)
{
  assert(uiCss.includes('.today-card-guide-hint {') || uiCss.includes('.today-card-guide-hint{'), 'ui.css에 .today-card-guide-hint 클래스가 정의되어야 합니다.');
  assert(uiCss.includes('font-size: 0.6875rem;') || uiCss.includes('font-size:.6875rem;'), '0.6875rem (11px, 1pt 축소) 폰트 규격이 명시되어야 합니다.');
  assert(uiCss.includes('.today-card-guide-hint'), '375px 미디어 쿼리 내 또는 반응형으로 정의되어야 합니다.');
  assert(uiCss.includes('white-space: nowrap;') || uiCss.includes('white-space:nowrap;'), '줄바꿈 방지 white-space: nowrap 속성이 지정되어야 합니다.');
}

// 3. 비즈니스 로직 및 4대 뷰 무결성 검증
{
  assert(indexHtml.includes('renderTodayMissionCard'), 'renderTodayMissionCard 함수가 온전히 보존되어야 합니다.');
  assert(indexHtml.includes('btnToggleMissionAccordion'), '아코디언 토글 버튼이 보존되어야 합니다.');
  assert(indexHtml.includes('missionRowHtml'), '미션 행 렌더러가 정상 작동해야 합니다.');
}

console.log('[TEST] today-mission-card-guide.test.js: all assertions completed successfully for ' + SUITE_TASK);
