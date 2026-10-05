/**
 * tests/desktop-widget-suite.test.js
 * #TASK-ES-313 [62] 기기 바탕화면용 위젯 기능(일정·목표·기록 3종 × 3가지 구성) 개발 완결 검증
 */

'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('[TEST START] desktop-widget-suite (#TASK-ES-313)');

const rootDir = path.resolve(__dirname, '..');
const widgetHtmlPath = path.join(rootDir, 'widget.html');
const indexHtmlPath = path.join(rootDir, 'index.html');
const manifestPath = path.join(rootDir, 'manifest.json');
const jsCompPath = path.join(rootDir, 'js', 'components.js');

const widgetHtml = fs.readFileSync(widgetHtmlPath, 'utf8');
const indexHtml = require('./helpers/inline-bundle').withInlineCells(fs.readFileSync(indexHtmlPath, 'utf8')); /* #TASK-ES-447 인라인 합본(원문 맨 앞 + js/tabs 세포) — 위젯 설정 창이 설정 탭 세포로 옮겨 가도 같은 글자를 찾는다 */
const manifestJson = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const componentsModule = require(jsCompPath);

// 1. widget.html 파일 존재 및 3종 × 3구성 (총 9개 조합) 렌더링 코드 검증
assert.ok(fs.existsSync(widgetHtmlPath), 'widget.html 파일 존재 확인');
assert.ok(widgetHtml.includes("type === 'calendar'"), 'widget.html: 일정 위젯 분기 확인');
assert.ok(widgetHtml.includes("type === 'goals'"), 'widget.html: 목표 위젯 분기 확인');
assert.ok(widgetHtml.includes("records"), 'widget.html: 기록 위젯 분기 확인');

// 크기별 3구성 (compact, standard, detail) 확인
assert.ok(widgetHtml.includes("size === 'compact'"), 'widget.html: 컴팩트(compact) 크기 분기 확인');
assert.ok(widgetHtml.includes("size === 'standard'"), 'widget.html: 표준형(standard) 크기 분기 확인');
assert.ok(widgetHtml.includes("detail"), 'widget.html: 상세형(detail) 크기 분기 확인');

// 9개 구성별 특화 요소 확인
// calendar: next 일정, 오늘 일정 3건, 24시간 타임라인
assert.ok(widgetHtml.includes('오늘의 다음 일정'), 'widget.html: calendar compact 전용 라벨 확인');
assert.ok(widgetHtml.includes('오늘의 일정'), 'widget.html: calendar standard 전용 라벨 확인');
assert.ok(widgetHtml.includes('오늘의 24시간 타임라인'), 'widget.html: calendar detail 전용 라벨 확인');

// goals: 최우선 목표, 핵심 실천 목표, 3계층 목표 & 마일스톤
assert.ok(widgetHtml.includes('최우선 목표'), 'widget.html: goals compact 전용 라벨 확인');
assert.ok(widgetHtml.includes('핵심 실천 목표'), 'widget.html: goals standard 전용 라벨 확인');
assert.ok(widgetHtml.includes('3계층 목표 & 마일스톤 현황'), 'widget.html: goals detail 전용 라벨 확인');

// records: 오늘 실천 기록, 최근 실천 기록, 실천 통계 & 타임로그
assert.ok(widgetHtml.includes('오늘의 실천 기록'), 'widget.html: records compact 전용 라벨 확인');
assert.ok(widgetHtml.includes('최근 실천 기록'), 'widget.html: records standard 전용 라벨 확인');
assert.ok(widgetHtml.includes('누적 실천 기록'), 'widget.html: records detail 전용 라벨 확인');
console.log('1. widget.html 3종 x 3구성 총 9개 조합 검증 완료');

// 2. manifest.json 내 3종 숏컷(shortcuts) 검증
assert.ok(Array.isArray(manifestJson.shortcuts), 'manifest.json: shortcuts 배열 확인');
assert.strictEqual(manifestJson.shortcuts.length >= 3, true, 'manifest.json: 3개 이상의 숏컷 등록 확인');

const shortcutUrls = manifestJson.shortcuts.map(s => s.url);
assert.ok(shortcutUrls.includes('/#calendar'), 'manifest.json: 일정 숏컷 (/#calendar) 확인');
assert.ok(shortcutUrls.includes('/#goals'), 'manifest.json: 목표 숏컷 (/#goals) 확인');
assert.ok(shortcutUrls.includes('/#records'), 'manifest.json: 기록 숏컷 (/#records) 확인');
console.log('2. manifest.json PWA 3종 바로가기 숏컷 검증 완료');

// 3. index.html 내 openWidgetSettingsModal 및 미리보기 iframe 검증
assert.ok(indexHtml.includes('openWidgetSettingsModal'), 'index.html: openWidgetSettingsModal 정의 확인');
assert.ok(indexHtml.includes('widgetPreviewIframe'), 'index.html: widgetPreviewIframe 미리보기 요소 확인');
assert.ok(indexHtml.includes('widget.html?type='), 'index.html: widget.html URL 매핑 로직 확인');
console.log('3. index.html 위젯 설정 & 실시간 미리보기 모달 검증 완료');

// 4. components.js getWidgetRenderSpec 9종 스펙 반환 검증
assert.ok(typeof componentsModule.getWidgetRenderSpec === 'function', 'components.js: getWidgetRenderSpec 함수 export 확인');

const types = ['calendar', 'goals', 'records'];
const sizes = ['compact', 'standard', 'detail'];

types.forEach(t => {
  sizes.forEach(s => {
    const spec = componentsModule.getWidgetRenderSpec(t, s);
    assert.strictEqual(spec.type, t, `getWidgetRenderSpec: 타입 일치 (${t})`);
    assert.strictEqual(spec.size, s, `getWidgetRenderSpec: 크기 일치 (${s})`);
    assert.ok(spec.title, `getWidgetRenderSpec: 타이틀 존재 (${t}, ${s})`);
    assert.ok(spec.width > 0, `getWidgetRenderSpec: 유효 가로폭 (${t}, ${s})`);
    assert.ok(spec.height > 0, `getWidgetRenderSpec: 유효 세로높이 (${t}, ${s})`);
    assert.ok(spec.link, `getWidgetRenderSpec: 직통 링크 (${t}, ${s})`);
  });
});
console.log('4. getWidgetRenderSpec 9개 조합 스펙 반환 검증 완료');

// 5. components.js handle전체공통_Item62Action 직통 액션 핸들러 검증
assert.ok(typeof componentsModule.handle전체공통_Item62Action === 'function', 'components.js: handle전체공통_Item62Action 함수 export 확인');

async function testItem62Action() {
  const mockStorage = {};
  let hapticDuration = null;
  let viewRenderedCount = 0;

  const mockWindow = {
    localStorage: {
      setItem: (key, val) => { mockStorage[key] = val; },
      getItem: (key) => mockStorage[key] || null
    },
    navigator: {
      vibrate: (ms) => { hapticDuration = ms; }
    },
    renderCalendar: () => { viewRenderedCount++; },
    renderGoalsScreen: () => { viewRenderedCount++; },
    renderHome: () => { viewRenderedCount++; },
    renderRecordsScreen: () => { viewRenderedCount++; },
    toast: () => {}
  };

  const oldWindow = global.window;
  const oldLocalStorage = global.localStorage;

  try {
    global.window = mockWindow;
    global.localStorage = mockWindow.localStorage;

    const res = await componentsModule.handle전체공통_Item62Action();

    assert.strictEqual(hapticDuration, 12, '12ms 햅틱 진동 피드백 검증');
    assert.strictEqual(viewRenderedCount, 4, '헌법 제15조 제6항 4대 뷰 동시 전파 검증');
    assert.ok(mockStorage['og_task-62_cache'], '로컬 캐시 og_task-62_cache 영속화 확인');

    const cached = JSON.parse(mockStorage['og_task-62_cache']);
    assert.strictEqual(cached.ticket, '62', '티켓 번호 62 확인');
    assert.strictEqual(cached.widget_suite_enabled, true, 'widget_suite_enabled 플래그 확인');
    assert.deepStrictEqual(cached.widget_types, ['calendar', 'goals', 'records'], '위젯 3종 등록 확인');
    assert.deepStrictEqual(cached.widget_sizes, ['compact', 'standard', 'detail'], '위젯 3구성 등록 확인');
    assert.strictEqual(cached.state, 'completed', '상태 completed 확인');
    assert.strictEqual(res.state, 'completed', '반환값 state completed 확인');

    console.log('5. handle전체공통_Item62Action 8원칙 및 4대 뷰 원자적 전파 검증 완료');
  } finally {
    global.window = oldWindow;
    global.localStorage = oldLocalStorage;
  }
}

testItem62Action().then(() => {
  console.log('[TEST COMPLETE] desktop-widget-suite verification done');
}).catch(err => {
  console.error('[TEST ERROR]', err);
  throw err;
});
