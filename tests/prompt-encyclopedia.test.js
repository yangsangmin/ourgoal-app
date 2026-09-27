/**
 * tests/prompt-encyclopedia.test.js
 * [TASK-ES-329]: [78] 목표 데이터받기·기록 내보내기 하단 '데이터분석 프롬프트 백과사전' 신설 단위 테스트
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

async function runTests() {
  // 1. 소스 파일 정적 분석 검증 [TASK-ES-329]
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const uiCss = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');
  const componentsJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'components.js'), 'utf8');

  // R1 & C1: 기록 탭 내 recordPromptEncyclopediaSlot 독립 슬롯 탑재 확인
  assert.ok(indexHtml.includes('id="recordPromptEncyclopediaSlot"'), '[TASK-ES-329] index.html 내 recordPromptEncyclopediaSlot 독립 슬롯 존재');
  assert.ok(indexHtml.includes('recordPromptEncyclopediaSlot'), '[TASK-ES-329] recordPromptEncyclopediaSlot 참조 식별자 확인');

  // R2 & C2: 핵심 안내 배너 문구 확인
  assert.ok(indexHtml.includes('프롬프트를 복사해서 외부 AI를 활용하세요!'), '[TASK-ES-329] 핵심 안내 배너 문구 탑재 확인');

  // R3 & C3: 듀얼 탭 선택 버튼 클래스 확인
  assert.ok(indexHtml.includes('btn-prompt-tab'), '[TASK-ES-329] btn-prompt-tab 듀얼 탭 버튼 클래스 확인');

  // R4 & C4, C5: 기록 특화 프롬프트 프리셋 확인
  assert.ok(indexHtml.includes('preset_rec_real_0'), '[TASK-ES-329] preset_rec_real_0 기록 실사용 프리셋 확인');
  assert.ok(indexHtml.includes('preset_rec_ai_0'), '[TASK-ES-329] preset_rec_ai_0 아워골 AI 기록 프리셋 확인');

  // R5 & C6: 복사 버튼 및 안내 문구 확인
  assert.ok(indexHtml.includes('btn-copy-prompt'), '[TASK-ES-329] btn-copy-prompt 복사 버튼 클래스 확인');
  assert.ok(indexHtml.includes('프롬프트가 복사되었습니다!'), '[TASK-ES-329] 복사 성공 토스트 문구 확인');

  // R6 & C7, C8: ui.css 스타일링 확인
  assert.ok(uiCss.includes('.record-prompt-encyclopedia-slot'), '[TASK-ES-329] ui.css 내 .record-prompt-encyclopedia-slot 스타일 확인');
  assert.ok(uiCss.includes('.prompt-hero-banner'), '[TASK-ES-329] ui.css 내 .prompt-hero-banner 스타일 확인');
  assert.ok(uiCss.includes('btn-prompt-tab'), '[TASK-ES-329] ui.css 내 .btn-prompt-tab 스타일 확인');

  // R7 & C9, C10, C11: js/components.js 직통 핸들러 및 캐시 키 확인
  assert.ok(componentsJs.includes('handle기록_Item78Action'), '[TASK-ES-329] js/components.js 내 handle기록_Item78Action 직통 핸들러 확인');
  assert.ok(componentsJs.includes('handle프롬프트백과사전_Item78Action'), '[TASK-ES-329] js/components.js 내 handle프롬프트백과사전_Item78Action 별칭 핸들러 확인');
  assert.ok(componentsJs.includes('og_task-78_cache'), '[TASK-ES-329] js/components.js 내 og_task-78_cache 로컬 캐시 키 확인');

  // 2. 가상 환경 모의 동작 검증 [TASK-ES-329]
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
        id: 'usr_test_78',
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
    assert.strictEqual(typeof components.handle기록_Item78Action, 'function', '[TASK-ES-329] handle기록_Item78Action export 함수 검증');
    assert.strictEqual(typeof components.handle프롬프트백과사전_Item78Action, 'function', '[TASK-ES-329] handle프롬프트백과사전_Item78Action export 함수 검증');

    // 3. handle기록_Item78Action 기본 실행 검증
    const payload = await components.handle기록_Item78Action(null, {
      ticket: '78'
    });

    assert.strictEqual(hapticDuration, 12, '[TASK-ES-329] 12ms 햅틱 피드백 트리거 확인');
    assert.ok(winMock.state.profile.settings.task78PromptEncyclopediaActive, '[TASK-ES-329] 프로필 설정 플래그 영속화 확인');
    assert.ok(storage['og_task-78_cache'], '[TASK-ES-329] 로컬 스토리지 og_task-78_cache 영속화 확인');
    assert.ok(viewRefreshes.records > 0, '[TASK-ES-329] 기록 뷰 갱신 전파 확인');
    assert.ok(viewRefreshes.goals > 0, '[TASK-ES-329] 목표 뷰 갱신 전파 확인');
    assert.ok(viewRefreshes.all > 0, '[TASK-ES-329] 4대 뷰 전체 전파 확인');
    assert.strictEqual(payload.state, 'completed', '[TASK-ES-329] 상태 완료 반환 확인');
    assert.strictEqual(payload.prompt_encyclopedia_slots_enabled, true, '[TASK-ES-329] 프롬프트 슬롯 플래그 확인');
  } finally {
    global.window = originalWindow;
  }
}

runTests().then(() => {
  // Silent success
}).catch(err => {
  console.error('[TASK-ES-329] 테스트 실패:', err);
  throw err;
});
