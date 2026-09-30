/**
 * tests/theme-system-v4.test.js
 * #TASK-ES-330: 설정 화면스타일 테마 4종(성소·블랙·화이트·도심) 압축 및 전 테마 시인성·동일 작동 전면 개선 단위 테스트
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const indexHtmlPath = path.join(ROOT_DIR, 'index.html');
const uiCssPath = path.join(ROOT_DIR, 'ui.css');
const componentsJsPath = path.join(ROOT_DIR, 'js', 'components.js');

const html = fs.readFileSync(indexHtmlPath, 'utf8');
const css = fs.readFileSync(uiCssPath, 'utf8');
const components = require(componentsJsPath);

console.log('[TASK-ES-330] 단위 테스트 시작...');

// 1. [TASK-ES-330] R1 & R5: index.html 내 4대 테마 배열 정의 검증
assert.ok(html.includes("id: 'focus-sanctuary'"), 'focus-sanctuary 테마 존재');
assert.ok(html.includes("id: 'black'"), 'black 테마 존재');
assert.ok(html.includes("id: 'white'"), 'white 테마 존재');
assert.ok(html.includes("id: 'urban-city'"), 'urban-city 테마 존재');
assert.ok(html.includes('theme-swatch'), 'theme-swatch 클래스 렌더링 존재');

// 2. [TASK-ES-330] R1: ui.css 내 4대 테마 1급 전역 디자인 토큰 변수 시스템 검증
assert.ok(css.includes('html[data-theme="focus-sanctuary"]'), 'focus-sanctuary 셀렉터 존재');
assert.ok(css.includes('--bg: #0B0F17;'), 'focus-sanctuary 배경 변수 정의');

assert.ok(css.includes('html[data-theme="black"] {'), 'black 1급 변수 블록 존재');
assert.ok(css.includes('--bg: #000000;'), 'black True OLED 배경 변수 정의');
assert.ok(css.includes('--ink: #FFFFFF;'), 'black 폰트 변수 정의');

assert.ok(css.includes('html[data-theme="white"] {'), 'white 1급 변수 블록 존재');
assert.ok(css.includes('--bg: #F8FAFC;'), 'white 미니멀 순백 배경 변수 정의');
assert.ok(css.includes('--ink: #0F172A;'), 'white 고대비 폰트 변수 정의');

assert.ok(css.includes('html[data-theme="urban-city"] {'), 'urban-city 1급 변수 블록 존재');
assert.ok(css.includes('--bg: #0B0F19;'), 'urban-city 슬레이트 네이비 배경 변수 정의');
assert.ok(css.includes('--brand: #0EA5E9;'), 'urban-city 스카이블루 포인트 변수 정의');

// 3. [TASK-ES-330] R2 & R3: 화이트/블랙/도심 테마별 컴포넌트 시인성 스타일 검증
assert.ok(css.includes('html[data-theme="white"] #captureInput'), '화이트 테마 #captureInput 고대비 스타일');
assert.ok(css.includes('html[data-theme="black"] #captureInput'), '블랙 테마 #captureInput 고대비 스타일');
assert.ok(css.includes('html[data-theme="urban-city"] #captureInput'), '도심 테마 #captureInput 고대비 스타일');
assert.ok(css.includes('[data-theme="white"] .toss-checkin-clean-box'), '화이트 테마 클린 박스 스타일');
assert.ok(css.includes('[data-theme="black"] .toss-checkin-clean-box'), '블랙 테마 클린 박스 스타일');
assert.ok(css.includes('[data-theme="urban-city"] .toss-checkin-clean-box'), '도심 테마 클린 박스 스타일');

// 4. [TASK-ES-330] R6: applyTheme 함수 12ms 햅틱 및 meta theme-color 동기화 검증
assert.ok(html.includes('triggerHaptic(12)'), 'applyTheme 내 12ms 햅틱 호출 존재');
assert.ok(html.includes('ourgoal_current_theme'), 'applyTheme 내 테마 로컬스토리지 영속화 존재');

// 5. [TASK-ES-330] R7: js/components.js 내 직통 핸들러 및 캐시 영속화 검증
assert.strictEqual(typeof components.handle설정_Item79Action, 'function', 'handle설정_Item79Action 함수 익스포트');
assert.strictEqual(typeof components.handle테마_Item79Action, 'function', 'handle테마_Item79Action 함수 익스포트');

(async () => {
  const fakeLocalStorage = {};
  global.window = {
    localStorage: {
      setItem: (k, v) => { fakeLocalStorage[k] = v; },
      getItem: (k) => fakeLocalStorage[k] || null
    },
    navigator: {
      vibrate: (p) => { global.window.__vibrated = p; }
    },
    applyTheme: (t) => { global.window.__appliedTheme = t; }
  };

  const res = await components.handle설정_Item79Action(null, { theme: 'white' });
  assert.strictEqual(res.ticket, '79');
  assert.strictEqual(res.task_id, 'TASK-ES-330');
  assert.strictEqual(res.theme, 'white');
  assert.strictEqual(res.state, 'completed');
  assert.strictEqual(fakeLocalStorage['ourgoal_current_theme'], 'white');
  assert.ok(fakeLocalStorage['og_task-79_cache'].includes('TASK-ES-330'), 'og_task-79_cache 영속화 확인');
  assert.strictEqual(global.window.__vibrated, 12, '12ms 햅틱 확인');
  assert.strictEqual(global.window.__appliedTheme, 'white', 'applyTheme 호출 확인');

  console.log('[TASK-ES-330] 단위 테스트 전 항목 통과 (PASS)!');
})();
