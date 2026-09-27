/**
 * tests/goal-template-legacy-cleanup.test.js
 * #TASK-ES-315: [64] 기존 'AI 추천 목표템플릿 예시 60선' 창 영구 제거 (목표탭·소통탭 템플릿백과사전 일원화) 단위 테스트
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

async function runTests() {
  // 1. 소스 파일 정적 분석 검증
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const teamInviteJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'team-invite-comm.js'), 'utf8');
  const componentsJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'components.js'), 'utf8');

  // 목표탭 내 템플릿백과사전 버튼 유지
  assert.ok(indexHtml.includes('id="btnGoalTemplateEncyclopedia"'), '목표 탭 내 템플릿백과사전 버튼 탑재 확인');
  assert.ok(indexHtml.includes('id="templateEncyclopediaModal"'), '템플릿백과사전 전체화면 모달 마크업 탑재 확인');

  // goalsTemplateAccordionSlot 빈 슬롯 및 display:none 확인
  assert.ok(indexHtml.includes('id="goalsTemplateAccordionSlot" style="display:none;"'), 'goalsTemplateAccordionSlot 비노출 슬롯 보존 확인');
  assert.ok(indexHtml.includes('// [#TASK-ES-315, 64] 목표탭 내 기존 60선 창 영구 제거 (템플릿백과사전 일원화)'), 'renderGoalsScreen 내 60선 창 제거 주석 및 로직 확인');

  // 소통탭 templatesHtml 빈 문자열 반환 확인
  assert.ok(indexHtml.includes('(#TASK-ES-315, 64: 구형 창 영구 제거 및 무해화)'), 'index.html 내 templatesHtml 무해화 확인');

  // team-invite-comm.js renderTemplatesAccordionHtml 빈 문자열 반환 확인
  assert.ok(teamInviteJs.includes('// [#TASK-ES-315, 64] 목표탭 및 소통탭 구형 60선 창 영구 제거 (템플릿백과사전 일원화)'), 'team-invite-comm.js 내 60선 아코디언 무해화 확인');

  // 2. 가상 환경 모의 동작 검증
  const storage = {};
  let hapticDuration = 0;
  let viewRefreshes = { calendar: 0, goals: 0, home: 0, records: 0, comm: 0, all: 0 };
  let modalOpened = false;

  const winMock = {
    navigator: {
      vibrate: function(ms) {
        hapticDuration = ms;
        return true;
      }
    },
    localStorage: {
      setItem: function(k, v) { storage[k] = v; },
      getItem: function(k) { return storage[k] || null; }
    },
    state: {
      profile: {
        id: 'usr_test_64',
        settings: {}
      }
    },
    openGoalTemplateEncyclopediaModal: function() {
      modalOpened = true;
    },
    renderCalendar: function() { viewRefreshes.calendar++; },
    renderGoalsScreen: function() { viewRefreshes.goals++; },
    renderHome: function() { viewRefreshes.home++; },
    renderRecordsScreen: function() { viewRefreshes.records++; },
    renderCommScreen: function() { viewRefreshes.comm++; },
    renderAll: function() { viewRefreshes.all++; }
  };

  const originalWindow = global.window;
  global.window = winMock;

  try {
    const components = require('../js/components.js');
    winMock.openGoalTemplateEncyclopediaModal = function() { modalOpened = true; };
    assert.strictEqual(typeof components.handle목표탭_Item64Action, 'function', 'handle목표탭_Item64Action export 함수 검증');

    // 3. handle목표탭_Item64Action 기본 실행 검증
    const payload = await components.handle목표탭_Item64Action(null, {
      ticket: '64',
      openEncyclopedia: true
    });

    assert.strictEqual(hapticDuration, 12, '12ms 햅틱 피드백 트리거 확인');
    assert.ok(winMock.state.profile.settings.task64LegacyTemplatesCleaned, '프로필 설정 플래그 영속화 확인');
    assert.ok(storage['og_task-64_cache'], '로컬 스토리지 og_task-64_cache 영속화 확인');
    assert.strictEqual(modalOpened, true, '템플릿백과사전 모달 호출 연계 확인');
    assert.ok(viewRefreshes.goals > 0, '목표 뷰 갱신 전파 확인');
    assert.ok(viewRefreshes.all > 0, '4대 뷰 전체 전파 확인');
    assert.strictEqual(payload.state, 'completed', '상태 완료 반환 확인');

    // 4. OurgoalTeamInviteComm.renderTemplatesAccordionHtml 반환값 검증
    const teamInviteComm = require('../js/team-invite-comm.js');
    if (typeof teamInviteComm.renderTemplatesAccordionHtml === 'function') {
      const renderedHtml = teamInviteComm.renderTemplatesAccordionHtml();
      assert.strictEqual(renderedHtml, '', 'renderTemplatesAccordionHtml은 빈 문자열을 반환하여 구형 60선 창 렌더링 차단');
    }
  } finally {
    global.window = originalWindow;
  }
}

runTests().then(() => {
  // Silent success as per court rules
}).catch(err => {
  throw err;
});
