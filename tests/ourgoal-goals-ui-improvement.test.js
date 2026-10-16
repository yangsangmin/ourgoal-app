/**
 * [PLAN-OURGOAL-GOALS-UI-4022560a] 목표 탭(#screen-goals) UI/UX 개편 통합 검증 테스트
 *
 * - T-GOALS-01: 상단 Sanctuary ↔ 하단 상세 카드 단방향(One-Way) 동기화 · 필터/정렬/달성률 산식 통일
 * - T-GOALS-02: 목표 0개 빈 상태에서도 1초 빠른 추가(#goalFastAddBox) 상시 노출 · 신규 목표 goalOrder 선두 고정
 * - T-GOALS-03: 통합 목표 요약 바(.goal-result-row.goal-unified-summary-strip) · #goalsPrivacyBadge 중복 ID 분리 · 리스너 누수 차단
 * - T-GOALS-04: 산악 트레일 접기/펼치기(#sTrailCollapseChip) 토글 · 마일스톤 행 슬림화
 * - T-GOALS-05: 우측 상세 서랍 달성률 보정 · 4테마 토큰 및 360px 반응형 CSS
 */
'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var fs = require('node:fs');
var path = require('node:path');

var ROOT = path.resolve(__dirname, '..');

function readFile(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

test('T-GOALS-01: sanctuary-v3-engine.js 와 sanctuary-goal-trail.js 가 필터·정렬·달성률·단방향 동기화를 준수한다', function() {
  var engineSrc = readFile('js/sanctuary-v3-engine.js');
  var trailSrc = readFile('js/sanctuary-goal-trail.js');
  var renderSrc = readFile('js/tabs/goals/render.js');

  assert.ok(
    engineSrc.includes('!g.archivedAt && !g.teamLinked'),
    'sanctuary-v3-engine.js should filter out archived and teamLinked goals'
  );
  assert.ok(
    engineSrc.includes('sortGoalsByOrder'),
    'sanctuary-v3-engine.js should sort goals using sortGoalsByOrder'
  );
  assert.ok(
    engineSrc.includes('window.renderGoalsScreen()'),
    'sanctuary-v3-engine.js pill click should trigger renderGoalsScreen()'
  );
  assert.ok(
    trailSrc.includes('window.goalAchievement(activeGoal)'),
    'sanctuary-goal-trail.js should use goalAchievement(activeGoal) for unified progress %'
  );
  assert.ok(
    renderSrc.includes('global.OurgoalSanctuaryV3.renderSanctuaryGoals()'),
    'render.js should trigger one-way sync to OurgoalSanctuaryV3.renderSanctuaryGoals()'
  );
});

test('T-GOALS-02: 목표 0개일 때 #personalGoalsView 상시 노출 및 신규 목표 goalOrder 선두 고정', function() {
  var renderSrc = readFile('js/tabs/goals/render.js');
  var fastAddSrc = readFile('js/tabs/goals/goal-fast-add.js');
  var iaActionsSrc = readFile('js/tabs/goals/goals-ia-actions.js');

  assert.ok(
    renderSrc.includes("pv.style.display = isPersonal ? '' : 'none';"),
    'render.js should keep #personalGoalsView visible in personal subtab even when goals.length === 0'
  );
  assert.ok(
    fastAddSrc.includes('_isSavingFastGoal') && fastAddSrc.includes('L.state.profile.settings.goalOrder.unshift(newGoal.id)'),
    'goal-fast-add.js should prevent duplicate clicks and unshift newGoal.id to goalOrder'
  );
  assert.ok(
    iaActionsSrc.includes('L.state.profile.settings.goalOrder.unshift(newGoal.id)'),
    'goals-ia-actions.js adoptTemplateAsMyGoal should unshift newGoal.id to goalOrder'
  );
});

test('T-GOALS-03: 통합 목표 요약 바(.goal-unified-summary-strip), 중복 ID 분리, 리스너 중첩 방어', function() {
  var detailSrc = readFile('js/tabs/goals/goal-detail.js');
  var eventsSrc = readFile('js/tabs/goals/goal-detail-events.js');

  assert.ok(
    detailSrc.includes('class="goal-result-row goal-unified-summary-strip" id="goalResultRow"'),
    'goal-detail.js should render #goalResultRow with goal-unified-summary-strip class'
  );
  assert.ok(
    detailSrc.includes('id="goalHeroPrivacyBadge"') && detailSrc.includes('id="goalDetailPrivacyBadge"'),
    'goal-detail.js should separate #goalHeroPrivacyBadge and #goalDetailPrivacyBadge to avoid duplicate #goalsPrivacyBadge'
  );
  assert.ok(
    !detailSrc.includes('id="goalsPrivacyBadge"'),
    'goal-detail.js should not duplicate id="goalsPrivacyBadge" from index.html header'
  );
  assert.ok(
    eventsSrc.includes('privBadge.dataset.privacyBound') && eventsSrc.includes("privBadge.addEventListener('click'"),
    'goal-detail-events.js should guard privBadge listener with dataset.privacyBound while preserving addEventListener signature'
  );
});

test('T-GOALS-04 & T-GOALS-05: 트레일 접기 칩(#sTrailCollapseChip), 우측 드로어 달성률 보정, 4테마/모바일 반응형 CSS', function() {
  var trailSrc = readFile('js/sanctuary-goal-trail.js');
  var drawerSrc = readFile('js/tabs/goals/goal-detail-drawer.js');
  var cssSrc = readFile('ui.css');

  assert.ok(
    trailSrc.includes('id="sTrailCollapseChip"') && trailSrc.includes('trailCollapsed'),
    'sanctuary-goal-trail.js should include collapsible trail chip #sTrailCollapseChip'
  );
  assert.ok(
    drawerSrc.includes('L.goalAchievement(g)'),
    'goal-detail-drawer.js should compute progress via L.goalAchievement(g)'
  );
  assert.ok(
    cssSrc.includes('#screen-goals .goal-result-row.goal-unified-summary-strip') &&
    cssSrc.includes('@media (max-width: 420px)'),
    'ui.css should define unified summary strip and mobile responsive rules for #screen-goals'
  );
});

test('T-GOALS-TOPBAR-UNIFY: 6등분 언더라인 서브탭 바, 목표 스위처 달성률 배지(.s-goal-pill-pct) 및 전체 펼치기(#sToggleGoalPillsWrap)', function() {
  var engineSrc = readFile('js/sanctuary-v3-engine.js');
  var cssSrc = readFile('ui.css');

  assert.ok(
    engineSrc.includes('s-goal-pill-pct') && engineSrc.includes('id="sToggleGoalPillsWrap"'),
    'sanctuary-v3-engine.js should render live % badge (.s-goal-pill-pct) and expand toggle (#sToggleGoalPillsWrap)'
  );
  assert.ok(
    cssSrc.includes('grid-template-columns: repeat(6, minmax(0, 1fr)) !important;'),
    'ui.css should style .goals-sticky-subnav as a 6-column full-width grid tab bar'
  );
});

test('Part 1 (T-GOALS-PERSONAL-EDIT-DRAWER): 개인 목표 편집 모드 7대 결함 수리 및 우측 상세 서랍 4테마·연결 루틴 복구', function() {
  var detailSrc = readFile('js/tabs/goals/goal-detail.js');
  var eventsSrc = readFile('js/tabs/goals/goal-detail-events.js');
  var editUxSrc = readFile('js/goal-edit-ux.js');
  var drawerSrc = readFile('js/tabs/goals/goal-detail-drawer.js');
  var orderSrc = readFile('js/tabs/goals/goal-order.js');
  var engineSrc = readFile('js/sanctuary-v3-engine.js');

  assert.ok(
    detailSrc.includes('edit-mode-due') && detailSrc.includes('edit-mode-input'),
    'goal-detail.js should render 2-row edit-mode-due and edit-mode-input in edit mode'
  );
  assert.ok(
    eventsSrc.includes('if(L.state.goalEditMode){') && eventsSrc.includes('편집 모드에서는 제목과 순서를 수정할 수 있어요'),
    'goal-detail-events.js should lock milestone and task completion toggles during goalEditMode'
  );
  assert.ok(
    editUxSrc.includes('id="goalIconInput"') && editUxSrc.includes('id="goalTopicInput"'),
    'goal-edit-ux.js should render icon and category selectors alongside goalTitleInput'
  );
  assert.ok(
    drawerSrc.includes('연결된 데일리 루틴') && drawerSrc.includes('✏️ 목표 편집'),
    'goal-detail-drawer.js should display linked routines summary and goal edit button'
  );
  assert.ok(
    orderSrc.includes('!g.archivedAt && !g.teamLinked') && engineSrc.includes('data-sgoalshiftleft'),
    'goal-order.js and sanctuary-v3-engine.js should support personal goal order shifting'
  );
});

test('Part 2 (T-GOALS-ROUTINE-UX-FUSION): 교대근무 기본 접힘, 요일 필터/교대 버튼 잘림 제로화, 인라인 루틴 편집 및 상위 목표 배지', function() {
  var routineSrc = readFile('js/tabs/goals/routine-screen.js');
  var modalSrc = readFile('js/tabs/goals/routine-detail-modal.js');

  assert.ok(
    routineSrc.includes('id="shiftWorkRoutineBody"') && routineSrc.includes('id="btnToggleShiftSectionHeader"'),
    'routine-screen.js should collapse #shiftWorkRoutineBody by default with toggle header'
  );
  assert.ok(
    routineSrc.includes('data-rtinput=') && routineSrc.includes('id="btnRoutineEditDoneInline"'),
    'routine-screen.js should support inline routine title/time editing and completion button in routineEditMode'
  );
  assert.ok(
    routineSrc.includes('data-rtgotogoal=') && modalSrc.includes('padding-right:36px;'),
    'routine-screen.js should render linked goal badge and routine-detail-modal.js should prevent close button overlap'
  );
});

test('Part 3 (T-GOALS-TEAM-AND-LINKED-FIX): 팀연계/팀목표 세로 파손·겹침 해소 및 편집 모드 고도화', function() {
  var tlScreenSrc = readFile('js/team-linked-goals-screen.js');
  var tlGoalsSrc = readFile('js/team-linked-goals.js');
  var visSrc = readFile('js/team-visibility-levels.js');
  var teamScreenSrc = readFile('js/tabs/goals/team-goals-screen.js');

  assert.ok(
    tlScreenSrc.includes('id="tlGoalDueInput"') && tlScreenSrc.includes('data-tlmsup='),
    'team-linked-goals-screen.js should support inline dueDate and milestone reorder in editMode'
  );
  assert.ok(
    tlGoalsSrc.includes('tg-participant-row') && visSrc.includes('data-tgmprio='),
    'team-linked-goals.js and team-visibility-levels.js should use 2-row participant/milestone layouts'
  );
  assert.ok(
    teamScreenSrc.split('\n').length <= 800,
    'team-goals-screen.js must remain within the 800-line module ceiling'
  );
});

test('Part 4 (T-GOALS-TEMPLATE-STATS-HUB): 템플릿 백과사전 페이지네이션/배지 보호 및 성취통계 통합 성장 리포트', function() {
  var tplSrc = readFile('js/tabs/goals/template-encyclopedia.js');
  var statsSrc = readFile('js/tabs/goals/goals-ia-actions.js');

  assert.ok(
    tplSrc.includes('id="btnLoadMoreTemplates"') && tplSrc.split('\n').length <= 800,
    'template-encyclopedia.js should implement load-more pagination and stay under 800 lines'
  );
  assert.ok(
    statsSrc.includes('통합 성장 리포트') && statsSrc.includes('id="btnStatsCopyAiPrompt"') && statsSrc.includes('id="btnStatsExportJson"'),
    'goals-ia-actions.js should render period-aware unified growth stats and AI/JSON export hub'
  );
});


