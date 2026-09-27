/**
 * tests/stopwatch-lap-inputs.test.js
 * #TASK-ES-306 [55] 스톱워치 구간기록별 텍스트 입력창 UI 정돈 및 시인성 개선 검증
 */

'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('[TEST START] stopwatch-lap-inputs (#TASK-ES-306)');

const htmlPath = path.join(__dirname, '..', 'index.html');
const cssPath = path.join(__dirname, '..', 'ui.css');
const html = fs.readFileSync(htmlPath, 'utf8');
const css = fs.readFileSync(cssPath, 'utf8');

// 1. HTML 마크업 및 필수 클래스/함수 존재 검증
assert.ok(html.includes('renderStopwatchWidgetHtml'), 'renderStopwatchWidgetHtml 함수 정의 확인');
assert.ok(html.includes('renderLapRowsHtml'), 'renderLapRowsHtml 함수 정의 확인');
assert.ok(html.includes('sw-laps-container'), '스톱워치 랩 컨테이너 클래스 확인');
assert.ok(html.includes('sw-lap-row'), '스톱워치 랩 행 클래스 확인');
assert.ok(html.includes('sw-lap-badge'), '스톱워치 랩 배지 클래스 확인');
assert.ok(html.includes('sw-lap-time'), '스톱워치 랩 타임 클래스 확인');
assert.ok(html.includes('sw-lap-memo-input'), '스톱워치 랩 메모 인풋 클래스 확인');
assert.ok(html.includes('sw-lap-inject-btn'), '스톱워치 랩 기입 버튼 클래스 확인');
assert.ok(html.includes('injectLapIntoTable'), '스톱워치 랩 표 기입 함수 확인');
console.log('1. index.html 함수 및 클래스 선언 검증 통과');

// 2. CSS 스타일 및 반응형/다크테마 검증
assert.ok(css.includes('.sw-laps-container'), 'CSS: .sw-laps-container 스타일 정의');
assert.ok(css.includes('.sw-lap-row'), 'CSS: .sw-lap-row 스타일 정의');
assert.ok(css.includes('.sw-lap-badge'), 'CSS: .sw-lap-badge 스타일 정의');
assert.ok(css.includes('.sw-lap-time'), 'CSS: .sw-lap-time 스타일 정의');
assert.ok(css.includes('.sw-lap-memo-input'), 'CSS: .sw-lap-memo-input 스타일 정의');
assert.ok(css.includes('.sw-lap-inject-btn'), 'CSS: .sw-lap-inject-btn 스타일 정의');
assert.ok(css.includes('.sw-lap-memo-wrap'), 'CSS: .sw-lap-memo-wrap 스타일 정의');
assert.ok(css.includes('.sw-lap-meta'), 'CSS: .sw-lap-meta 스타일 정의');
assert.ok(css.includes('@media (max-width:420px)'), 'CSS: 모바일 뷰포트 반응형 미디어 쿼리 정의');
assert.ok(css.includes('[data-theme="black"] .sw-lap-memo-input') || css.includes('[data-theme="dark"] .sw-lap-memo-input'), 'CSS: 다크테마 인풋 스타일 보정 정의');
console.log('2. ui.css 스타일 및 반응형/다크테마 검증 통과');

// 3. renderLapRowsHtml 순수 함수 기능 검증 (Sandbox 실행)
function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
  });
}

// Extract renderLapRowsHtml from index.html
const startMatch = /function\s+renderLapRowsHtml\s*\(/.exec(html);
assert.ok(startMatch, 'renderLapRowsHtml 함수 시작점 확인');
const braceStart = html.indexOf('{', startMatch.index);
let depth = 0;
let renderLapRowsSrc = '';
for (let i = braceStart; i < html.length; i++) {
  if (html[i] === '{') depth++;
  else if (html[i] === '}') {
    depth--;
    if (depth === 0) {
      renderLapRowsSrc = html.slice(startMatch.index, i + 1);
      break;
    }
  }
}
assert.ok(renderLapRowsSrc, 'renderLapRowsHtml 함수 본문 추출 성공');

const vm = require('vm');
const sandbox = { escapeHtml };
vm.createContext(sandbox);
vm.runInContext(renderLapRowsSrc, sandbox);
const renderLapRowsHtml = sandbox.renderLapRowsHtml;

// 3-1. 빈 배열 처리
assert.strictEqual(renderLapRowsHtml([]), '', '빈 배열 전달 시 빈 문자열 반환');
assert.strictEqual(renderLapRowsHtml(null), '', 'null 전달 시 빈 문자열 반환');

// 3-2. 정상 랩 객체 렌더링
const sampleLaps = [
  { id: 'lap_1', num: 2, time: '01:25.4', memo: '스쿼트 10회' },
  { id: 'lap_2', num: 1, time: '00:45.0', memo: '웜업 스트레칭' }
];
const renderedHtml = renderLapRowsHtml(sampleLaps);
assert.ok(renderedHtml.includes('sw-lap-row'), '랩 행 컨테이너 생성');
assert.ok(renderedHtml.includes('랩 2'), '랩 2 번호 배지 렌더링');
assert.ok(renderedHtml.includes('01:25.4'), '랩 2 타임 렌더링');
assert.ok(renderedHtml.includes('value="스쿼트 10회"'), '랩 2 메모 값 인풋 바인딩');
assert.ok(renderedHtml.includes('랩 1'), '랩 1 번호 배지 렌더링');
assert.ok(renderedHtml.includes('00:45.0'), '랩 1 타임 렌더링');
assert.ok(renderedHtml.includes('value="웜업 스트레칭"'), '랩 1 메모 값 인풋 바인딩');
assert.ok(renderedHtml.includes('class="btn btn-ghost btn-xs sw-lap-inject-btn"'), '기입 버튼 렌더링');

// 3-3. HTML 이스케이프 및 XSS 방어 검증
const maliciousLaps = [
  { id: 'lap_x', num: 3, time: '02:00.0', memo: '<script>alert(1)</script>' }
];
const renderedXss = renderLapRowsHtml(maliciousLaps);
assert.ok(!renderedXss.includes('<script>'), 'XSS 스크립트 태그 이스케이프 방어');
assert.ok(renderedXss.includes('&lt;script&gt;alert(1)&lt;/script&gt;'), 'HTML 엔티티 변환 확인');

// 3-4. 하위 호환성: 단순 문자열 배열 전달 시에도 안전하게 렌더링
const legacyLaps = ['00:12.3', '00:24.6'];
const renderedLegacy = renderLapRowsHtml(legacyLaps);
assert.ok(renderedLegacy.includes('00:12.3'), '레거시 문자열 랩 타임 정상 렌더링');
assert.ok(renderedLegacy.includes('00:24.6'), '레거시 문자열 랩 타임 정상 렌더링');
assert.ok(renderedLegacy.includes('sw-lap-memo-input'), '레거시 문자열이어도 인풋 생성');

console.log('3. renderLapRowsHtml 순수 함수 단위 테스트 및 샌드박스 검증 전수 통과');

console.log('stopwatch-lap-inputs test completed successfully.');
