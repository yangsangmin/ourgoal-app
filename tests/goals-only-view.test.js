/**
 * [#TASK-ES-261] 목표탭 ‘목표만’ 버튼 이격 배치 및 하위 마일스톤형 확인 UI 단위 검증
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const SUITE_TASK = 'TASK-ES-261';

console.log('[TEST] goals-only-view.test.js: starting execution for ' + SUITE_TASK + '...');

const indexPath = path.join(__dirname, '..', 'index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf8');
const uiCssPath = path.join(__dirname, '..', 'ui.css');
const uiCss = fs.readFileSync(uiCssPath, 'utf8');

// 1. 목표 뷰 토글(msViewToggle) 마크업 및 4대 옵션 텍스트 검증
{
  assert(indexHtml.includes('id="msViewToggle"'), 'msViewToggle 컨테이너가 존재해야 합니다.');
  
  // 기본, 마일스톤, 할일 세그먼트 옵션 텍스트 단정화 검증
  assert(indexHtml.includes('data-msview="default"') && indexHtml.includes('>기본</div>'), 'data-msview="default"의 레이블은 "기본"이어야 합니다.');
  assert(indexHtml.includes('data-msview="milestones_only"') && indexHtml.includes('>마일스톤</div>'), 'data-msview="milestones_only"의 레이블은 "마일스톤"이어야 합니다.');
  assert(indexHtml.includes('data-msview="tasks_only"') && indexHtml.includes('>할일</div>'), 'data-msview="tasks_only"의 레이블은 "할일"이어야 합니다.');
  
  // 우측 분리된 목표만 버튼 검증
  assert(indexHtml.includes('data-msview="goals_only"') && indexHtml.includes('목표만</div>'), 'data-msview="goals_only"의 레이블에 "목표만"이 포함되어야 합니다.');
}

// 2. 우측 이격 마진 규격 검증 (상단 상세-전체접기 간격 4px 일치)
{
  // 상단 상세-전체접기 영역 gap: 4px 검증
  assert(indexHtml.includes('gap:4px;flex-shrink:0;') && indexHtml.includes('id="msCollapseAllBtn"'), '상단 상세-전체접기 영역의 간격 규격이 4px이어야 합니다.');
  
  // 하단 msViewToggle gap: 4px 및 goals-only-wrap margin-left: 4px 검증
  assert(indexHtml.includes('id="msViewToggle" style="display:flex;align-items:center;justify-content:space-between;gap:4px;'), 'msViewToggle의 flex gap이 4px로 통일되어야 합니다.');
  assert(indexHtml.includes('class="format-toggle seg-compact goals-only-wrap" style="flex-shrink:0;margin-left:4px;"'), 'goals-only-wrap의 margin-left가 4px로 지정되어야 합니다.');
  
  // ui.css 내 .goals-only-wrap 스타일 검증
  assert(uiCss.includes('.goals-only-wrap'), 'ui.css에 .goals-only-wrap 클래스가 정의되어야 합니다.');
  assert(uiCss.includes('margin-left: 4px;'), 'ui.css에 .goals-only-wrap의 margin-left: 4px 규격이 정의되어야 합니다.');
}

// 3. goals_only 선택 시 하위 마일스톤형 카드 UI 렌더링 검증
{
  assert(indexHtml.includes("var msHtml = (gView === 'goals_only')"), 'goals_only 뷰 렌더러 분기가 존재해야 합니다.');
  assert(indexHtml.includes('goal-milestone-overview-card'), '목표 요약 카드 클래스가 존재해야 합니다.');
  assert(indexHtml.includes('goal-sub-milestones-container'), '하위 마일스톤 컨테이너 클래스가 존재해야 합니다.');
  assert(indexHtml.includes('goal-sub-milestone-item'), '개별 하위 마일스톤형 카드 클래스가 존재해야 합니다.');
  
  // 상태 배지(완료/진행중/대기) 및 진척률 렌더링 검증
  assert(indexHtml.includes('완료</span>') && indexHtml.includes('진행중</span>') && indexHtml.includes('대기</span>'), '마일스톤 상태별 배지 렌더링 코드가 포함되어야 합니다.');
}

// 4. 모바일 375px 반응형 스타일 및 호버 효과 검증
{
  assert(uiCss.includes('.goal-sub-milestone-item'), 'ui.css에 .goal-sub-milestone-item 스타일이 존재해야 합니다.');
  assert(uiCss.includes('@media (max-width: 375px)'), '375px 반응형 미디어 쿼리가 존재해야 합니다.');
  assert(uiCss.includes('#msViewToggle .format-opt'), '모바일에서 msViewToggle 토글 옵션의 패딩 및 폰트 크기 반응형 규칙이 존재해야 합니다.');
}

// 5. 회귀 방지: 이벤트 리스너 및 타 뷰 바인딩 검증
{
  assert(indexHtml.includes("state.goalViewMode = opt.dataset.msview;"), 'msViewToggle의 뷰 모드 전환 이벤트가 보존되어야 합니다.');
  assert(indexHtml.includes("renderGoalsScreen();"), '뷰 전환 시 renderGoalsScreen이 정상 호출되어야 합니다.');
}

console.log('[TEST] goals-only-view.test.js: all assertions completed successfully for ' + SUITE_TASK);
