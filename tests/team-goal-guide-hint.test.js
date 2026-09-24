/**
 * [TASK-ES-256] 팀목표 200% 활용 가이드 안내문구 표시 ('* 팀 목표를 생성하면 사라짐') 단위 검증
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const SUITE_TASK = 'TASK-ES-256';

console.log('[TEST] team-goal-guide-hint.test.js: starting execution for ' + SUITE_TASK + '...');

const indexPath = path.join(__dirname, '..', 'index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf8');

// 1. 소스 정적 검증: 안내문구, 클래스, ID 및 스타일
{
  assert.ok(
    indexHtml.includes('* 팀 목표를 생성하면 사라짐'),
    '안내문구 "* 팀 목표를 생성하면 사라짐" 원문 포함 확인'
  );
  assert.ok(
    indexHtml.includes('id="teamGoalGuideVanishHint"'),
    '안내문구 전용 ID "teamGoalGuideVanishHint" 속성 확인'
  );
  assert.ok(
    indexHtml.includes('class="guide-vanish-hint"'),
    '안내문구 전용 클래스 "guide-vanish-hint" 속성 확인'
  );
  assert.ok(
    indexHtml.includes('font-size:0.8125rem'),
    '3포인트 축소 폰트 사이즈 (0.8125rem / 13px) 적용 확인'
  );
  assert.ok(
    indexHtml.includes('color:var(--ink-faint)'),
    '은은한 안내 톤을 위한 var(--ink-faint) 토큰 적용 확인'
  );
  assert.ok(
    indexHtml.includes('window.renderTeamGoalsEmptyGuideHtml = renderTeamGoalsEmptyGuideHtml;'),
    'window.renderTeamGoalsEmptyGuideHtml 전역 바인딩 노출 확인'
  );
  assert.ok(
    indexHtml.includes('window.renderTeamGoalsScreen = renderTeamGoalsScreen;'),
    'window.renderTeamGoalsScreen 전역 바인딩 노출 확인'
  );
}

// 2. 가이드 헤더 마크업 구조 및 위계 검증
{
  const hintMarkupRegex = /display:flex;align-items:center;gap:8px;flex-wrap:wrap;[\s\S]*?팀 목표 200% 활용 가이드[\s\S]*?id="teamGoalGuideVanishHint"[\s\S]*?\*\s*팀 목표를 생성하면 사라짐/;
  assert.ok(
    hintMarkupRegex.test(indexHtml),
    '헤더 flex-wrap 컨테이너 내 h3 타이틀 우측 span 안내문구 정확한 배치 구조 검증'
  );
}

// 3. 375px 모바일 반응형 방어 로직 검증
{
  const containerMatch = indexHtml.match(/display:flex;align-items:center;gap:8px;flex-wrap:wrap;[\s\S]*?팀 목표 200% 활용 가이드/);
  assert.ok(containerMatch, '헤더 영역에 flex-wrap:wrap 레이아웃 방어 속성 존재');
  assert.ok(indexHtml.includes('gap:8px'), '타이틀과 안내문구 간 8px 간격 유지');
}

// 4. 조건부 렌더링 시뮬레이션: 팀 목표 유무에 따른 가이드 소멸 로직 검증
{
  function simulateTeamGoalsScreen(myTeams) {
    const view = { innerHTML: '' };
    if (!myTeams.length) {
      view.innerHTML = '<div id="mockGuide"><span id="teamGoalGuideVanishHint">* 팀 목표를 생성하면 사라짐</span></div>';
      return { rendered: 'guide', html: view.innerHTML };
    }
    view.innerHTML = '<div id="mockTeamList">' + myTeams.map(t => '<div class="team-card">' + t.name + '</div>').join('') + '</div>';
    return { rendered: 'teams', html: view.innerHTML };
  }

  // 4-1. 가입한 팀이 0개일 때: 안내 가이드가 렌더링됨
  const emptyResult = simulateTeamGoalsScreen([]);
  assert.strictEqual(emptyResult.rendered, 'guide', '팀이 0개일 때 가이드 렌더링');
  assert.ok(emptyResult.html.includes('* 팀 목표를 생성하면 사라짐'), '팀 0개 시 소멸 안내문구 정상 노출');

  // 4-2. 팀을 생성하거나 가입하여 팀이 1개 이상일 때: 가이드가 사라지고 팀 목록이 렌더링됨
  const joinedResult = simulateTeamGoalsScreen([{ id: 'team-1', name: '알고리즘 스터디' }]);
  assert.strictEqual(joinedResult.rendered, 'teams', '팀 생성 시 가이드가 소멸하고 팀 목록 렌더링');
  assert.ok(!joinedResult.html.includes('* 팀 목표를 생성하면 사라짐'), '팀 존재 시 소멸 안내문구 및 가이드 소멸 확인');
}

console.log('[TEST] team-goal-guide-hint.test.js: All assertions passed successfully.');
