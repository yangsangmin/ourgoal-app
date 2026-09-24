/**
 * [TASK-ES-258] 팀목표 시인성 개선, 아코디언 및 통합/목표별 수준관리 분리 단위 검증
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const SUITE_TASK = 'TASK-ES-258';

console.log('[TEST] team-level-management.test.js: starting execution for ' + SUITE_TASK + '...');

const teamVisModule = require('../js/team-visibility-levels.js');
const indexPath = path.join(__dirname, '..', 'index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf8');
const uiCssPath = path.join(__dirname, '..', 'ui.css');
const uiCss = fs.readFileSync(uiCssPath, 'utf8');

// 1. 모듈 인터페이스 및 노출 검증
{
  assert.ok(teamVisModule, 'OurgoalTeamVisibilityLevels 모듈 로드 성공');
  assert.strictEqual(typeof teamVisModule.init, 'function', 'init 함수 존재');
  assert.strictEqual(typeof teamVisModule.getGoalLevelGoals, 'function', 'getGoalLevelGoals 함수 존재');
  assert.strictEqual(typeof teamVisModule.copyTeamLevelsToGoal, 'function', 'copyTeamLevelsToGoal 함수 존재');
  assert.strictEqual(typeof teamVisModule.openLevelGroupDetailModal, 'function', 'openLevelGroupDetailModal 함수 존재');
  assert.strictEqual(typeof teamVisModule.renderTeamCardContent, 'function', 'renderTeamCardContent 함수 존재');
  assert.strictEqual(typeof teamVisModule.bindEvents, 'function', 'bindEvents 함수 존재');
}

// 2. 단일 대표 목표 선별 및 칩 스위처 렌더링 검증
{
  const mockGroup = {
    id: 'team_alpha',
    name: '알파 러닝팀',
    teamGoals: [
      {
        id: 'tg_1',
        title: '하프마라톤 완주',
        dueDate: '2026-10-31',
        milestones: [
          { id: 'm_1_1', title: '10km 달리기', status: 'done', tasks: [] },
          { id: 'm_1_2', title: '15km 달리기', status: 'doing', tasks: [] }
        ]
      },
      {
        id: 'tg_2',
        title: '매일 아침 3km 조깅',
        dueDate: '2026-11-30',
        milestones: [
          { id: 'm_2_1', title: '주 5회 달리기', status: 'todo', tasks: [] }
        ]
      }
    ]
  };

  const mockState = {
    profile: {
      settings: {}
    }
  };

  // 2-1. 복수 목표 시 칩 스위처(.tg-goal-switcher)와 대표 1개 목표 카드(.tg-compact-goal-card)만 렌더링 확인
  const html = teamVisModule.renderTeamCardContent(mockGroup, true, mockState);
  assert.ok(html.includes('class="tg-goal-switcher"'), '복수 목표 시 상단 칩 스위처 렌더링');
  assert.ok(html.includes('data-tgselectgoal="team_alpha:tg_1"'), '목표 1 선택 칩 포함');
  assert.ok(html.includes('data-tgselectgoal="team_alpha:tg_2"'), '목표 2 선택 칩 포함');
  assert.ok(html.includes('class="tg-compact-goal-card"'), '대표 1개 목표 컴팩트 카드 렌더링');
  assert.ok(html.includes('하프마라톤 완주'), '진행 중인 첫 번째 목표(하프마라톤)가 기본 활성 목표로 선별');
  assert.ok(mockState.activeTeamGoalId['team_alpha'] === 'tg_1', 'activeTeamGoalId가 tg_1로 자동 설정됨');

  // 2-2. 마일스톤 기본 접힘 (unfoldMsList 미지정 시 display:none)
  assert.ok(html.includes('data-tgmslist="tg_1" style="display:none;"'), '마일스톤 목록 기본 접힘(display:none) 확인');
  assert.ok(html.includes('마일스톤 펼치기 ▼'), '기본 버튼 텍스트가 [마일스톤 펼치기 ▼]로 렌더링');

  // 2-3. unfoldMsList가 true일 때 펼침 상태 보존 확인
  mockState.profile.settings.unfoldMsList = { tg_1: true };
  const htmlUnfolded = teamVisModule.renderTeamCardContent(mockGroup, true, mockState);
  assert.ok(htmlUnfolded.includes('data-tgmslist="tg_1" style=""'), 'unfoldMsList[tg_1]=true 시 마일스톤 목록 펼침 확인');
  assert.ok(htmlUnfolded.includes('마일스톤 접기 ▲'), '펼침 상태 시 버튼 텍스트 [마일스톤 접기 ▲]로 렌더링');
}

// 3. 수준별 목표 관리 2계층 아코디언 및 듀얼 모드 검증
{
  const mockGroup = {
    id: 'team_alpha',
    name: '알파 러닝팀',
    teamGoals: [{ id: 'tg_1', title: '하프마라톤 완주', milestones: [] }]
  };

  const mockState = {
    profile: {
      settings: {
        foldLevelSection: { team_alpha: true } // 기본 접힘
      }
    }
  };

  // 3-1. 수준별 섹션 기본 접힘 검증
  const html = teamVisModule.renderTeamCardContent(mockGroup, true, mockState);
  assert.ok(html.includes('class="tg-accordion-section"'), '수준별 목표 아코디언 섹션 존재');
  assert.ok(html.includes('data-tglevelbody="team_alpha" style="display:none;"'), 'foldLevelSection이 true일 때 섹션 바디 숨김');
  assert.ok(html.includes('class="tg-level-dual-tabs"'), '듀얼 탭 세그먼트 스위처 포함');
  assert.ok(html.includes('data-tglevelmode="team_alpha:goal"'), '목표별 수준관리 탭 포함');
  assert.ok(html.includes('data-tglevelmode="team_alpha:team"'), '팀 통합 수준관리 탭 포함');

  // 3-2. foldLevelSection이 false일 때 펼침 검증
  mockState.profile.settings.foldLevelSection.team_alpha = false;
  const htmlOpened = teamVisModule.renderTeamCardContent(mockGroup, true, mockState);
  assert.ok(htmlOpened.includes('data-tglevelbody="team_alpha" style="display:block;"'), 'foldLevelSection이 false일 때 섹션 바디 노출');
}

// 4. '팀 통합 수준관리' vs '목표별 수준관리' 데이터 모델 분리 및 원터치 복사 검증
{
  const testState = {
    profile: {
      settings: {
        groupLevelGoals: {
          'team_1': [
            {
              id: 'lg_1',
              name: 'A조 (초급)',
              goals: [
                {
                  id: 'g_1',
                  title: '5km 완주',
                  milestones: [
                    { id: 'm_1', title: '1km 걷뛰', status: 'todo', tasks: [{ id: 't_1', title: '운동화 끈 매기', done: false }] }
                  ]
                }
              ]
            }
          ]
        },
        goalLevelGoals: {}
      }
    }
  };

  teamVisModule.init({
    getState: () => testState,
    getProfile: () => testState.profile,
    saveProfile: async () => {},
    toast: () => {},
    triggerHaptic: () => {},
    MOCK_GROUPS: [{ id: 'team_1', teamGoals: [{ id: 'goal_101', title: '마라톤', levelGoals: [] }] }]
  });

  // 4-1. 초기 상태: goalLevelGoals['goal_101']은 비어있음
  const initialGoalLevels = teamVisModule.getGoalLevelGoals('team_1', 'goal_101');
  assert.strictEqual(initialGoalLevels.length, 0, '목표별 수준은 처음에 비어있음');

  // 4-2. 팀 통합 수준을 특정 목표로 복사 실행
  const clonedLevels = teamVisModule.copyTeamLevelsToGoal('team_1', 'goal_101');
  assert.strictEqual(clonedLevels.length, 1, '복사된 조의 개수는 1개');
  assert.strictEqual(clonedLevels[0].name, 'A조 (초급)', '조 이름 보존');
  assert.ok(clonedLevels[0].id.includes('goal_101'), '신규 고유 ID에 목표 ID 결속 확인');
  assert.ok(clonedLevels[0].goals[0].id.includes('goal_101'), '신규 목표 ID에 목표 ID 결속 확인');
  assert.ok(clonedLevels[0].goals[0].milestones[0].id.includes('goal_101'), '신규 마일스톤 ID 결속 확인');
  assert.ok(clonedLevels[0].goals[0].milestones[0].tasks[0].id.includes('goal_101'), '신규 태스크 ID 결속 확인');

  // 4-3. 목표별 수준 변경 시 팀 통합 수준 불변(격리성) 검증
  clonedLevels[0].name = 'A조 (마라톤 특화)';
  assert.strictEqual(testState.profile.settings.groupLevelGoals['team_1'][0].name, 'A조 (초급)', '목표별 조 변경이 팀 통합 조에 영향 주지 않음(격리 보장)');
}

// 5. index.html 배선 및 ui.css 스타일 정적 검증
{
  assert.ok(indexHtml.includes('js/team-visibility-levels.js'), 'index.html에 team-visibility-levels.js 스크립트 로드 태그 존재');
  assert.ok(indexHtml.includes('OurgoalTeamVisibilityLevels.renderTeamCardContent(g, canManage, state)'), 'renderTeamCardContent 위임 호출 배선 확인');
  assert.ok(indexHtml.includes('OurgoalTeamVisibilityLevels.bindEvents(view)'), 'bindEvents 위임 호출 배선 확인');
  assert.ok(indexHtml.includes('p.settings.unfoldMsList[id] = isHidden;'), 'data-tgfoldlist 클릭 시 unfoldMsList 영구 저장 배선 확인');

  assert.ok(uiCss.includes('.tg-goal-switcher'), 'ui.css 내 .tg-goal-switcher 스타일 정의 확인');
  assert.ok(uiCss.includes('.tg-goal-chip'), 'ui.css 내 .tg-goal-chip 스타일 정의 확인');
  assert.ok(uiCss.includes('.tg-compact-goal-card'), 'ui.css 내 .tg-compact-goal-card 스타일 정의 확인');
  assert.ok(uiCss.includes('.tg-level-dual-tabs'), 'ui.css 내 .tg-level-dual-tabs 스타일 정의 확인');
  assert.ok(uiCss.includes('.tg-accordion-section'), 'ui.css 내 .tg-accordion-section 스타일 정의 확인');
  assert.ok(uiCss.includes('.tg-lg-accordion-row'), 'ui.css 내 .tg-lg-accordion-row 스타일 정의 확인');
}

console.log('[TEST] team-level-management.test.js: All assertions passed successfully.');
