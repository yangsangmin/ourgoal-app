/**
 * tests/goal-export-hub.test.js
 * [TASK-ES-328]: [77] 목표탭 '현 상태로 데이터 받기' 최하단 재배치 및 AI 데이터분석 허브 고도화 단위 테스트
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

async function runTests() {
  // 1. 소스 파일 정적 분석 검증 [TASK-ES-328]
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const uiCss = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');
  const componentsJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'components.js'), 'utf8');

  // R1 & C1: personalGoalsView 내 goalAnalysisHubSlot 독립 슬롯 탑재 확인
  assert.ok(indexHtml.includes('id="goalAnalysisHubSlot"'), '[TASK-ES-328] index.html 내 goalAnalysisHubSlot 독립 슬롯 존재');
  assert.ok(indexHtml.includes('goalAnalysisHubSlot'), '[TASK-ES-328] goalAnalysisHubSlot 참조 식별자 확인');

  // R2 & C2: AI 분석용 목표 데이터 내보내기 명칭 및 가치 설명 확인
  assert.ok(indexHtml.includes('AI 분석용 목표 데이터 내보내기'), '[TASK-ES-328] AI 분석용 목표 데이터 내보내기 명칭 탑재 확인');

  // R3 & C3: 모바일 1초 텍스트 복사 버튼 goalExportCopyBtn 확인
  assert.ok(indexHtml.includes('goalExportCopyBtn'), '[TASK-ES-328] goalExportCopyBtn 복사 버튼 탑재 확인');

  // R4 & C4, C5: 기존 개별 목표 및 전체 받기 버튼 보존 확인
  assert.ok(indexHtml.includes('goalExportBtn'), '[TASK-ES-328] goalExportBtn 개별 목표 다운로드 버튼 보존 확인');
  assert.ok(indexHtml.includes('goalExportAllBtn'), '[TASK-ES-328] goalExportAllBtn 전체 목표 다운로드 버튼 보존 확인');

  // R5 & C6: 마일스톤 편집 모드 시 자동 은폐 로직 확인
  assert.ok(indexHtml.includes('analysisHub.style.display'), '[TASK-ES-328] analysisHub.style.display 편집 모드 토글 로직 확인');

  // R6: CSS 스타일링 확인 (터치타겟 44px 및 모던 카드)
  assert.ok(uiCss.includes('.goal-analysis-hub-slot'), '[TASK-ES-328] ui.css 내 .goal-analysis-hub-slot 스타일 정의 확인');
  assert.ok(uiCss.includes('.goal-export-card'), '[TASK-ES-328] ui.css 내 .goal-export-card 스타일 정의 확인');
  assert.ok(uiCss.includes('min-height:44px;') || uiCss.includes('min-height: 44px;'), '[TASK-ES-328] 최소 터치 높이 44px 규격 충족 확인');

  // R7 & C7, C8: js/components.js 직통 핸들러 및 캐시 키 확인
  assert.ok(componentsJs.includes('handle목표탭_Item77Action'), '[TASK-ES-328] js/components.js 내 handle목표탭_Item77Action 직통 핸들러 확인');
  assert.ok(componentsJs.includes('og_task-77_cache'), '[TASK-ES-328] js/components.js 내 og_task-77_cache 로컬 캐시 키 확인');

  // 2. 가상 환경 모의 동작 검증 [TASK-ES-328]
  const storage = {};
  let hapticDuration = 0;
  let viewRefreshes = { goals: 0, home: 0, records: 0, settings: 0, all: 0 };

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
        id: 'usr_test_77',
        settings: {}
      }
    },
    renderGoalsScreen: function() { viewRefreshes.goals++; },
    renderHome: function() { viewRefreshes.home++; },
    renderRecordsScreen: function() { viewRefreshes.records++; },
    renderSettingsScreen: function() { viewRefreshes.settings++; },
    renderAll: function() { viewRefreshes.all++; },
    toast: function(msg) {}
  };

  const originalWindow = global.window;
  global.window = winMock;

  try {
    const components = require('../js/components.js');
    assert.strictEqual(typeof components.handle목표탭_Item77Action, 'function', '[TASK-ES-328] handle목표탭_Item77Action export 함수 검증');

    // 3. handle목표탭_Item77Action 기본 실행 검증
    const payload = await components.handle목표탭_Item77Action(null, {
      ticket: '77'
    });

    assert.strictEqual(hapticDuration, 12, '[TASK-ES-328] 12ms 햅틱 피드백 트리거 확인');
    assert.ok(winMock.state.profile.settings.task77GoalExportHubActive, '[TASK-ES-328] 프로필 설정 플래그 영속화 확인');
    assert.ok(storage['og_task-77_cache'], '[TASK-ES-328] 로컬 스토리지 og_task-77_cache 영속화 확인');
    assert.ok(viewRefreshes.goals > 0, '[TASK-ES-328] 목표 뷰 갱신 전파 확인');
    assert.ok(viewRefreshes.all > 0, '[TASK-ES-328] 4대 뷰 전체 전파 확인');
    assert.strictEqual(payload.state, 'completed', '[TASK-ES-328] 상태 완료 반환 확인');
    assert.strictEqual(payload.goal_export_hub_relocated, true, '[TASK-ES-328] 데이터분석 허브 재배치 플래그 확인');
  } finally {
    global.window = originalWindow;
  }
}

runTests().then(() => {
  // Silent success as per court rules
}).catch(err => {
  console.error('[TASK-ES-328] 테스트 실패:', err);
  throw err;
});
