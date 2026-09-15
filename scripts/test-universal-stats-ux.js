// scripts/test-universal-stats-ux.js
// #TASK-ES-092 직관적 전문가용 통계 콕핏 UI/UX 단위 테스트

const assert = require('assert');
const uStats = require('../js/universal-stats.js');

console.log('🧪 [#TASK-ES-092] 직관적 전문가 통계 콕핏 UI/UX 단위 테스트 시작...');

// 1. 모의 DOM 요소 팩토리
function createMockElement(tag, attrs) {
  const el = {
    tagName: (tag || 'div').toUpperCase(),
    dataset: {},
    style: {},
    children: [],
    attributes: attrs || {},
    innerHTML: '',
    textContent: '',
    onclick: null,
    onchange: null,
    querySelector: function(sel) {
      return createMockElement('button');
    },
    querySelectorAll: function(sel) {
      return [createMockElement('button')];
    },
    addEventListener: function(evt, fn) {
      if (!this._listeners) this._listeners = {};
      if (!this._listeners[evt]) this._listeners[evt] = [];
      this._listeners[evt].push(fn);
    },
    getBoundingClientRect: function() {
      return { width: 500, height: 260, top: 10, left: 10 };
    },
    matches: function() { return false; },
    setAttribute: function(k, v) { this.attributes[k] = v; },
    getAttribute: function(k) { return this.attributes[k]; }
  };
  return el;
}

function createMockContainer() {
  const elementMap = {};
  const container = {
    innerHTML: '',
    style: {},
    querySelector: function(sel) {
      if (sel.startsWith('#')) {
        const id = sel.slice(1);
        if (this.innerHTML.includes('id="' + id + '"')) {
          if (!elementMap[sel]) elementMap[sel] = createMockElement('button', { id: id });
          return elementMap[sel];
        }
      }
      if (sel.startsWith('.')) {
        const cls = sel.slice(1);
        if (this.innerHTML.includes('class="' + cls + '"') || this.innerHTML.includes(cls)) {
          if (!elementMap[sel]) elementMap[sel] = createMockElement('div', { class: cls });
          return elementMap[sel];
        }
      }
      return null;
    },
    querySelectorAll: function(sel) {
      const cls = sel.replace('.', '');
      if (this.innerHTML.includes(cls)) {
        const count = (this.innerHTML.match(new RegExp(cls, 'g')) || []).length;
        const res = [];
        for (let i = 0; i < count; i++) {
          res.push(createMockElement('button'));
        }
        return res;
      }
      return [];
    },
    getBoundingClientRect: function() {
      return { width: 520, height: 300, top: 0, left: 0 };
    }
  };
  return container;
}

// 2. 샘플 레코드 준비
const sampleRecs = [
  { id: 'r1', startAt: '2026-01-10T10:00:00Z', subTheme: '벤치프레스', metrics: { primary: 100, primaryUnit: 'kg' } },
  { id: 'r2', startAt: '2026-02-10T10:00:00Z', subTheme: '벤치프레스', metrics: { primary: 110, primaryUnit: 'kg' } },
  { id: 'r3', startAt: '2026-03-10T10:00:00Z', subTheme: '스쿼트', metrics: { primary: 140, primaryUnit: 'kg' } }
];

const mockState = {
  profile: { records: sampleRecs },
  univLens: 'trend',
  univSelectedEntities: ['벤치프레스']
};

const mockCallbacks = {
  toast: function(msg) {},
  openModal: function(html, onMount) {
    if (typeof html === 'string') {
      mockCallbacks.lastModalHtml = html;
    } else if (html && html.bodyHtml) {
      mockCallbacks.lastModalHtml = html.bodyHtml;
    }
    if (typeof onMount === 'function') {
      const mockModalEl = createMockElement('div');
      onMount(mockModalEl);
    }
  },
  closeModal: function() {},
  saveProfile: function() {}
};

// [TEST 1] 3단 레이아웃 핵심 컴포넌트 렌더링 검증
const container = createMockContainer();
uStats.renderUniversalStatsDashboard(container, sampleRecs, mockState, mockCallbacks);

assert.ok(container.innerHTML.includes('u-cockpit-quick-guide'), '1단: 3단계 인터랙션 퀵 가이드 컨테이너 렌더링');
assert.ok(container.innerHTML.includes('사용법:'), '3단계 사용법 레이블 렌더링');
assert.ok(container.innerHTML.includes('1</b> 렌즈 선택') || container.innerHTML.includes('1 렌즈 선택'), '가이드 Step 1 명시');
assert.ok(container.innerHTML.includes('2</b> 종목 탭') || container.innerHTML.includes('2 종목 탭'), '가이드 Step 2 명시');
assert.ok(container.innerHTML.includes('3</b> 성장 분석 확인') || container.innerHTML.includes('3 성장 분석 확인'), '가이드 Step 3 명시');

assert.ok(container.innerHTML.includes('u-lens-exp-banner'), '2단: 렌즈별 목적 설명 배너 렌더링');
assert.ok(container.innerHTML.includes('성장 추세</b>:'), '성장 추세 렌즈 목적 안내 텍스트 렌더링');

assert.ok(container.innerHTML.includes('u-chart-title-bar'), '차트 상단 통합 헤더(제목+기간/스케일) 렌더링');
assert.ok(container.innerHTML.includes('u-entity-chip'), '종목 칩 목록 렌더링');
assert.ok(container.innerHTML.includes('u-ai-briefing-card'), 'Gemini AI 자율 통계 진단 브리핑 카드 렌더링');

// [TEST 2] 4대 렌즈별 설명 배너 동적 갱신 검증
const lensChecks = [
  { lens: 'trend', expected: '성장 추세' },
  { lens: 'ratio', expected: '상관 효율비' },
  { lens: 'radar', expected: '균형 레이더' },
  { lens: 'cadence', expected: '요일 주기' }
];

lensChecks.forEach(function(item) {
  mockState.univLens = item.lens;
  uStats.renderUniversalStatsDashboard(container, sampleRecs, mockState, mockCallbacks);
  assert.ok(container.innerHTML.includes(item.expected), item.lens + ' 렌즈 선택 시 ' + item.expected + ' 배너 표출');
});

// [TEST 3] 통합 데이터 관리 모달 검증
assert.ok(typeof uStats.openDataManagementModal === 'function', 'openDataManagementModal API 제공 확인');
uStats.openDataManagementModal({
  allRecs: sampleRecs,
  state: mockState,
  callbacks: mockCallbacks
});
assert.ok(mockCallbacks.lastModalHtml, '데이터 관리 모달이 렌더링되어야 함');
assert.ok(mockCallbacks.lastModalHtml.includes('새 데이터 가져오기'), '모달 내 [새 데이터 가져오기] 카드 렌더링');
assert.ok(mockCallbacks.lastModalHtml.includes('전체 기록 데이터 표') || mockCallbacks.lastModalHtml.includes('그리드'), '모달 내 [전체 데이터 그리드] 카드 렌더링');
assert.ok(mockCallbacks.lastModalHtml.includes('CSV 파일') || mockCallbacks.lastModalHtml.includes('CSV'), '모달 내 [CSV 내보내기] 카드 렌더링');
assert.ok(mockCallbacks.lastModalHtml.includes('차트 스냅샷') || mockCallbacks.lastModalHtml.includes('스냅샷'), '모달 내 [차트 스냅샷] 카드 렌더링');

// [TEST 4] 4대 KPI 카드 및 스모크 테스트 문자열 호환성 검증
mockState.univLens = 'trend';
uStats.renderUniversalStatsDashboard(container, sampleRecs, mockState, mockCallbacks);
assert.ok(container.innerHTML.includes('🏆'), 'KPI 1위 트로피 이모지 보존');
assert.ok(container.innerHTML.includes('⚡'), 'KPI 2위 번개 이모지 보존');
assert.ok(container.innerHTML.includes('PEAK'), '스모크 테스트 필수 PEAK 라벨 보존');
assert.ok(container.innerHTML.includes('LATEST'), '스모크 테스트 필수 LATEST 라벨 보존');
assert.ok(container.innerHTML.includes('clamp'), '반응형 폰트 clamp 스타일 보존');

// [TEST 5] 다차원 측정 지표(Dimension) 바 및 버튼 인터랙션 검증 (#TASK-ES-092 피드백)
const salesSampleRecs = uStats.generateDomainSample('sales');
const salesState = {
  profile: { records: salesSampleRecs },
  univLens: 'trend',
  univSelectedEntities: ['영업계약'],
  univDimension: 'revenue'
};
const salesContainer = createMockContainer();
uStats.renderUniversalStatsDashboard(salesContainer, salesSampleRecs, salesState, mockCallbacks);

assert.ok(salesContainer.innerHTML.includes('u-dim-selector-row'), '다차원 측정 지표 선택 바 탑재');
assert.ok(salesContainer.innerHTML.includes('u-dim-btn'), '측정 지표 전환 버튼(u-dim-btn) 탑재');
assert.ok(salesContainer.innerHTML.includes('매출액') || salesContainer.innerHTML.includes('revenue'), '매출액 디멘션 라벨 표출');

// [TEST 6] 데이터 관리 모달 -> 새 데이터 가져오기 모달 매끄러운 안전 전환 검증
let closeModalCalledPrematurely = false;
let importModalOpened = false;
let capturedImportBtn = null;

const safetyCallbacks = {
  toast: function() {},
  closeModal: function() { closeModalCalledPrematurely = true; },
  openModal: function(html, onMount) {
    if (typeof html === 'string') {
      if (html.includes('데이터 가져오기 & 1초 샘플 로드')) {
        importModalOpened = true;
      }
    }
    if (typeof onMount === 'function') {
      const mockModalEl = createMockElement('div');
      const origQuery = mockModalEl.querySelector;
      mockModalEl.querySelector = function(sel) {
        if (sel === '#uMenuImportBtn') {
          capturedImportBtn = { onclick: null };
          return capturedImportBtn;
        }
        return origQuery ? origQuery(sel) : createMockElement('button');
      };
      onMount(mockModalEl);
    }
  }
};

uStats.openDataManagementModal({
  allRecs: salesSampleRecs,
  state: salesState,
  callbacks: safetyCallbacks
});

assert.ok(capturedImportBtn, '모달 내 새 데이터 가져오기 버튼이 캡처되어야 함');
assert.strictEqual(typeof capturedImportBtn.onclick, 'function', '새 데이터 가져오기 버튼에 클릭 핸들러가 바인딩되어야 함');

// 버튼 클릭 실행 시뮬레이션
capturedImportBtn.onclick();
assert.strictEqual(closeModalCalledPrematurely, false, '모달 간 전환 시 premature closeModal이 호출되지 않아야 함 (popstate 충돌 방어)');
assert.strictEqual(importModalOpened, true, '새 데이터 가져오기 모달이 즉시 열려야 함');

// [TEST 7] [#TASK-ES-093] 5대 테마별 엄선 7종(총 35종) 카탈로그 & 하이록스 1초 로드 검증
console.log('🧪 [#TASK-ES-093] 테마별 7대 샘플 카탈로그 및 하이록스 융합 검증...');
assert.ok(Array.isArray(uStats.SAMPLE_THEMES), 'SAMPLE_THEMES 카탈로그 배열 제공');
assert.strictEqual(uStats.SAMPLE_THEMES.length, 5, '5대 대분류 테마 완비 (운동, 업무, 공부, 재테크, 웰니스)');

const expectedThemeIds = ['workout', 'career', 'learning', 'finance', 'wellness'];
uStats.SAMPLE_THEMES.forEach(function(th, idx) {
  assert.strictEqual(th.id, expectedThemeIds[idx], '테마 ID 일치: ' + th.id);
  assert.strictEqual(th.items.length, 7, th.label + ' 테마는 엄선된 7종 종목을 완비해야 함');
  th.items.forEach(function(item) {
    assert.ok(item.key, '종목 키 존재');
    assert.ok(item.title, '종목 제목 존재');
    assert.ok(item.tag, '종목 뱃지 태그 존재');
    assert.ok(item.desc, '종목 설명 존재');
  });
});

// 운동 테마 내 하이록스, 헬스(파워리프팅), 요가 검증 (상민님 필수 지시사항)
const workoutTheme = uStats.SAMPLE_THEMES.find(function(t) { return t.id === 'workout'; });
const workoutKeys = workoutTheme.items.map(function(it) { return it.key; });
assert.ok(workoutKeys.includes('hyrox'), '운동 테마에 하이록스(hyrox) 포함');
assert.ok(workoutKeys.includes('big3_52w'), '운동 테마에 헬스/파워리프팅(big3_52w) 포함');
assert.ok(workoutKeys.includes('yoga'), '운동 테마에 요가/필라테스(yoga) 포함');

// 하이록스 52주 데이터 생성기 검증 (#TASK-ES-095 8대 공식 스테이션 + 인터벌러닝 + 종합 완비)
const hyroxRecs = uStats.generateDomainSample('hyrox');
assert.ok(hyroxRecs.length >= 52, '하이록스 52주 이상 풍부한 세션 레코드 생성 (총 ' + hyroxRecs.length + '건)');
assert.strictEqual(hyroxRecs[0].subTheme, '하이록스', '서브 테마명 하이록스');
assert.strictEqual(hyroxRecs[0].isSample, true, '샘플 플래그 isSample: true');
assert.strictEqual(hyroxRecs[0].sampleCategory, 'hyrox', '샘플 카테고리 hyrox');
assert.ok(hyroxRecs[0].metrics && hyroxRecs[0].metrics.primary > 0, '주요 지표 완주시간 탑재');
assert.strictEqual(hyroxRecs[0].metricUnits.primary, '분', '주요 지표 단위 분');

// 하이록스 8대 공식 스테이션 + 인터벌러닝 엔티티 추출 검증
const expectedHyroxStations = ['스키에르그', '슬레드푸시', '슬레드풀', '버피점프', '로잉', '파머스캐리', '샌드백런지', '월볼샷', '인터벌러닝'];
const hyroxOntology = uStats.buildUniversalOntology(hyroxRecs);
const hyroxEntityNames = hyroxOntology.map(function(o){ return o.name; });
expectedHyroxStations.forEach(function(stnName){
  assert.ok(hyroxEntityNames.includes(stnName), '하이록스 온톨로지에 [' + stnName + '] 엔티티 포함 필수');
});


// 모달 렌더링 내 테마 탭 칩 및 7카드 그리드 검증
let sampleModalHtml = '';
let mountedThemeBtns = [];
let mountedQuickBtns = [];
const sampleModalCallbacks = {
  toast: function() {},
  closeModal: function() {},
  saveProfile: function() {},
  openModal: function(html, onMount) {
    sampleModalHtml = html;
    if (typeof onMount === 'function') {
      const mockModal = createMockElement('div');
      mockModal.querySelectorAll = function(sel) {
        if (sel === '.u-theme-tab-btn') {
          mountedThemeBtns = [
            { dataset: { theme: 'workout' }, classList: { toggle: function() {} }, style: {} },
            { dataset: { theme: 'career' }, classList: { toggle: function() {} }, style: {} }
          ];
          return mountedThemeBtns;
        }
        if (sel === '.u-sample-quick-btn') {
          mountedQuickBtns = [
            { dataset: { quickSample: 'hyrox' }, closest: function() { return { textContent: '하이록스' }; } }
          ];
          return mountedQuickBtns;
        }
        return [];
      };
      onMount(mockModal);
    }
  }
};

uStats.openUniversalImportModal({
  openModal: sampleModalCallbacks.openModal,
  closeModal: sampleModalCallbacks.closeModal,
  toast: sampleModalCallbacks.toast,
  state: mockState,
  saveProfile: sampleModalCallbacks.saveProfile
});

assert.ok(sampleModalHtml.includes('uSampleThemeTabRow'), '테마 탭 칩 행(uSampleThemeTabRow) 탑재');
assert.ok(sampleModalHtml.includes('u-theme-tab-btn'), '테마 탭 버튼(u-theme-tab-btn) 탑재');
assert.ok(sampleModalHtml.includes('uSampleCardContainer'), '샘플 카드 컨테이너(uSampleCardContainer) 탑재');
assert.ok(sampleModalHtml.includes('u-sample-card-grid'), '2열 반응형 그리드(u-sample-card-grid) 탑재');
assert.ok(sampleModalHtml.includes('하이록스 (HYROX)'), '초기 운동 테마 내 하이록스 카드 즉시 표출');

// Zero-Dead-Click: 테마 탭 및 1초 로드 버튼 클릭 리스너 바인딩 확인
assert.ok(mountedThemeBtns.length > 0, '테마 탭 버튼 캡처');
assert.strictEqual(typeof mountedThemeBtns[0].onclick, 'function', '테마 탭 버튼에 클릭 핸들러 바인딩 확인');
assert.ok(mountedQuickBtns.length > 0, '1초 로드 버튼 캡처');
assert.strictEqual(typeof mountedQuickBtns[0].onclick, 'function', '1초 로드 버튼에 클릭 핸들러 바인딩 확인');

// [TEST 8] [#TASK-ES-094] 기출문제 예시 1W 기간 하루단위 꺾은선 그래프 및 요일 x축 시인성 검증
console.log('🧪 [#TASK-ES-094] 기출문제 1W 하루단위 꺾은선 그래프 & 전 기간 시인성 검증...');
const studyRecs = uStats.generateDomainSample('study');
assert.ok(studyRecs.length >= 80, '공부(기출문제) 샘플 레코드 생성 (51주 + 최근 7일 일별)');

// 1W 기간 집계 시 기출문제 종목이 최근 7일간 정확히 7개 포인트로 수집되는지 검증
const series1w = uStats.aggregateMultiSeries(studyRecs, ['기출문제'], 'problems', '1w');
assert.ok(series1w['기출문제'], '기출문제 시리즈 맵 생성');
assert.strictEqual(series1w['기출문제'].points.length, 7, '1W 기간 설정 시 정확히 최근 7일간 7개 하루단위 포인트 생성');

// 7개 포인트의 날짜가 중복 없이 순차적으로 정렬되어 있는지 검증
const dates1w = series1w['기출문제'].points.map(function(p) { return p.date; });
const uniqueDates1w = Array.from(new Set(dates1w));
assert.strictEqual(uniqueDates1w.length, 7, '최근 7일간 7개 유니크 날짜 보유');
assert.strictEqual(series1w['기출문제'].points[0].val, 35, 'D-6 초기 문제풀이 35문제');
assert.strictEqual(series1w['기출문제'].points[6].val, 72, 'D-0 역대 최고 72문제 달성');

// 1W SVG 차트 렌더링 검증: 요일(월~일) 정보 및 1W 전용 수치 배지/동적 반경
const chart1w = uStats.renderMultiSeriesSvg(series1w, { width: 520, height: 210, period: '1w' });
assert.ok(chart1w.svgHtml.includes('<path d="M'), '꺾은선 라인 패스 렌더링');
assert.ok(chart1w.svgHtml.includes('fill="url(#u_grad_0)"'), '단일 종목 그라데이션 영역 렌더링');
assert.ok(chart1w.svgHtml.includes('r="4.2"'), '1W 모드 전용 대형 서클(r=4.2) 시인성 확보');
assert.ok(chart1w.svgHtml.includes('PR 72') || chart1w.svgHtml.includes('PR'), '최고 기록 PR 배지 렌더링');

// X축 레이블에 요일 표출 검증 (예: (월), (화), ...)
const hasDayOfWeekInX = ['(일)', '(월)', '(화)', '(수)', '(목)', '(금)', '(토)'].some(function(dayStr) {
  return chart1w.svgHtml.includes(dayStr);
});
assert.strictEqual(hasDayOfWeekInX, true, '1W 모드 x축 레이블에 요일 정보 100% 표출');

// 장기 기간(ALL/1Y) 시인성 검증: 포인트 뭉개짐 방지 컴팩트 닷(r=1.6)
const seriesAll = uStats.aggregateMultiSeries(studyRecs, ['기출문제'], 'problems', 'all');
const chartAll = uStats.renderMultiSeriesSvg(seriesAll, { width: 520, height: 210, period: 'all' });
assert.ok(chartAll.svgHtml.includes('r="1.6"'), '대량 포인트 기간에서 뭉개짐 방지 초소형 서클(r=1.6) 적용');

// 콕핏 통합 렌더링 시 1w 필터 전달 및 정상 작동 검증
const studyState = {
  profile: { records: studyRecs },
  univLens: 'trend',
  univSelectedEntities: ['기출문제'],
  univDimension: 'problems',
  univPeriod: '1w'
};
const studyContainer = createMockContainer();
uStats.renderUniversalStatsDashboard(studyContainer, studyRecs, studyState, mockCallbacks);
assert.ok(studyContainer.innerHTML.includes('uInteractiveSvgChart'), '콕핏 내 대화형 SVG 차트 렌더링');
assert.ok(studyContainer.innerHTML.includes('1W'), '1W 기간 탭 표출');

// [TEST 9] [#TASK-ES-095] 하이록스 8대 공식 스테이션 및 전 테마 세부 종목별 실측 기록·페이스·체감강도(RPE) EAV 심층 검증
console.log('🧪 [#TASK-ES-095] 하이록스 8대 공식 스테이션 및 전 테마 RPE·페이스 EAV 심층 검증...');

// 1. 하이록스 8대 공식 스테이션 + 인터벌러닝 + 종합 (총 10개 엔티티)
const hyroxStationsAll = ['하이록스', '스키에르그', '슬레드푸시', '슬레드풀', '버피점프', '로잉', '파머스캐리', '샌드백런지', '월볼샷', '인터벌러닝'];
const hyroxAllOntology = uStats.buildUniversalOntology(hyroxRecs);
const hyroxOntoNames = hyroxAllOntology.map(function(o){ return o.name; });

hyroxStationsAll.forEach(function(stn){
  assert.ok(hyroxOntoNames.includes(stn), '하이록스 10대 엔티티 온톨로지 보유: ' + stn);
});

// 2. 하이록스 각 스테이션별 기록·페이스·RPE 메트릭 정밀 검증
['스키에르그', '슬레드푸시', '월볼샷', '인터벌러닝'].forEach(function(stn){
  const stnRecs = hyroxRecs.filter(function(r){ return r.subTheme === stn; });
  assert.ok(stnRecs.length >= 50, stn + ' 세션 50개 이상 생성 (실제: ' + stnRecs.length + ')');
  const sampleR = stnRecs[0];
  assert.ok(typeof sampleR.metrics.record === 'number' && sampleR.metrics.record > 0, stn + ' 완주기록(초) 양수 탑재');
  assert.ok(typeof sampleR.metrics.pace === 'number' && sampleR.metrics.pace > 0, stn + ' 페이스 양수 탑재');
  assert.ok(typeof sampleR.metrics.rpe === 'number' && sampleR.metrics.rpe >= 6.0 && sampleR.metrics.rpe <= 10.0, stn + ' 체감강도 RPE (6.0~10.0) 탑재');
  assert.ok(typeof sampleR.metrics.intensity === 'number' && sampleR.metrics.intensity >= 60, stn + ' 운동강도(%) 탑재');
});

// 3. 하이록스 8대 스테이션 [전체 모아보기] 멀티 라인 집계 및 SVG 렌더링 검증
const multiStations = ['스키에르그', '슬레드푸시', '슬레드풀', '버피점프', '로잉', '파머스캐리', '샌드백런지', '월볼샷'];
const hyroxSeriesMap = uStats.aggregateMultiSeries(hyroxRecs, multiStations, 'record', '1y', 'all');
multiStations.forEach(function(stn){
  assert.ok(hyroxSeriesMap[stn], '멀티 스테이션 집계 시리즈 생성: ' + stn);
  assert.ok(hyroxSeriesMap[stn].points.length >= 40, stn + ' 시계열 포인트 40개 이상 보유');
});

const hyroxSvgChart = uStats.renderMultiSeriesSvg(hyroxSeriesMap, { width: 520, height: 210, scaleMode: 'normalized', period: '1y' });
assert.ok(hyroxSvgChart.svgHtml.includes('<path'), '8대 스테이션 멀티 라인 SVG 패스 렌더링');
assert.ok(hyroxSvgChart.svgHtml.includes('stroke='), '8대 스테이션 고유 멀티 컬러 스트로크 렌더링');

// 4. 하이록스 체감 강도 (RPE) 디멘션 집계 및 SVG 렌더링 검증
const hyroxRpeSeries = uStats.aggregateMultiSeries(hyroxRecs, ['스키에르그', '월볼샷'], 'rpe', '1y');
assert.ok(hyroxRpeSeries['스키에르그'].points.length > 0, '스키에르그 RPE 시계열 포인트 수집');
assert.ok(hyroxRpeSeries['스키에르그'].points[0].val >= 7.0, '스키에르그 RPE 7.0 이상');
assert.ok(hyroxRpeSeries['월볼샷'].points[0].val >= 8.5, '월볼샷 최고강도 RPE 8.5 이상');

// 5. 러닝(롱런, 조깅, 인터벌) 세부 엔티티 및 RPE/페이스 검증
const runRecs = uStats.generateDomainSample('running');
const runOntology = uStats.buildUniversalOntology(runRecs);
const runNames = runOntology.map(function(o){ return o.name; });
assert.ok(runNames.includes('롱런'), '러닝 온톨로지에 [롱런] 포함');
assert.ok(runNames.includes('조깅'), '러닝 온톨로지에 [조깅] 포함');
assert.ok(runNames.includes('인터벌러닝'), '러닝 온톨로지에 [인터벌러닝] 포함');
const longRunSample = runRecs.find(function(r){ return r.subTheme === '롱런'; });
assert.ok(longRunSample.metrics.pace > 0, '롱런 페이스 탑재');
assert.ok(longRunSample.metrics.rpe >= 7.0, '롱런 RPE 탑재');

// 6. 파워리프팅 3대 운동(스쿼트, 벤치프레스, 데드리프트) 개별 엔티티 및 RPE/1RM 검증
const big3Recs = uStats.generateDomainSample('big3');
const big3Ontology = uStats.buildUniversalOntology(big3Recs);
const big3Names = big3Ontology.map(function(o){ return o.name; });
assert.ok(big3Names.includes('스쿼트'), '파워리프팅 온톨로지에 [스쿼트] 포함');
assert.ok(big3Names.includes('벤치프레스'), '파워리프팅 온톨로지에 [벤치프레스] 포함');
assert.ok(big3Names.includes('데드리프트'), '파워리프팅 온톨로지에 [데드리프트] 포함');
const sqSample = big3Recs.find(function(r){ return r.subTheme === '스쿼트'; });
assert.ok(sqSample.metrics['1rm'] > 0, '스쿼트 1RM 탑재');
assert.ok(sqSample.metrics.rpe >= 7.0, '스쿼트 RPE 탑재');

// 7. 공부(기출문제, 개념정리, 모의고사)의 RPE 및 페이스 검증
const studyRecsDetailed = uStats.generateDomainSample('study');
const studyOntology = uStats.buildUniversalOntology(studyRecsDetailed);
const studyNames = studyOntology.map(function(o){ return o.name; });
assert.ok(studyNames.includes('기출문제'), '공부 온톨로지에 [기출문제] 포함');
assert.ok(studyNames.includes('개념정리'), '공부 온톨로지에 [개념정리] 포함');
assert.ok(studyNames.includes('모의고사'), '공부 온톨로지에 [모의고사] 포함');
const studySample = studyRecsDetailed.find(function(r){ return r.subTheme === '기출문제'; });
assert.ok(studySample.metrics.pace > 0, '기출문제 페이스(분/문제) 탑재');
assert.ok(studySample.metrics.rpe >= 7.0, '기출문제 RPE(집중도) 탑재');

// 8. 개발(기능구현, PR머지, 코드리뷰) & 영업(영업계약, 고객미팅, 제안서작성) 검증
const codeRecs = uStats.generateDomainSample('coding');
const codeNames = uStats.buildUniversalOntology(codeRecs).map(function(o){ return o.name; });
assert.ok(codeNames.includes('기능구현'), '개발 온톨로지에 [기능구현] 포함');
assert.ok(codeNames.includes('PR머지'), '개발 온톨로지에 [PR머지] 포함');
assert.ok(codeNames.includes('코드리뷰'), '개발 온톨로지에 [코드리뷰] 포함');

const salesRecs = uStats.generateDomainSample('sales');
const salesNames = uStats.buildUniversalOntology(salesRecs).map(function(o){ return o.name; });
assert.ok(salesNames.includes('영업계약'), '영업 온톨로지에 [영업계약] 포함');
assert.ok(salesNames.includes('고객미팅'), '영업 온톨로지에 [고객미팅] 포함');
assert.ok(salesNames.includes('제안서작성'), '영업 온톨로지에 [제안서작성] 포함');

// 9. 35종 전 카탈로그 종목 RPE/intensity 메트릭 전수 탑재 검증
const catalogSampleKeys = ['yoga', 'crossfit', 'swimming', 'climbing', 'marketing', 'toeic', 'dividend', 'water', 'meditation'];
catalogSampleKeys.forEach(function(catKey){
  const recs = uStats.generateDomainSample(catKey);
  assert.ok(recs.length > 0, catKey + ' 샘플 생성 성공');
  const r = recs[0];
  assert.ok(typeof r.metrics.rpe === 'number' && r.metrics.rpe >= 6.0, catKey + ' RPE 메트릭 탑재');
  assert.ok(typeof r.metrics.intensity === 'number' && r.metrics.intensity >= 60, catKey + ' intensity 메트릭 탑재');
  assert.strictEqual(r.metricUnits.rpe, '점', catKey + ' RPE 단위 점');
});

// 10. 하이록스 콕핏 대시보드 렌더링 무결성 검증 (측정 지표 바에 체감강도 RPE 등 노출)
const hyroxState = {
  profile: { records: hyroxRecs },
  univLens: 'trend',
  univSelectedEntities: ['스키에르그'],
  univDimension: 'rpe',
  univPeriod: '1y'
};
const hyroxContainer = createMockContainer();
uStats.renderUniversalStatsDashboard(hyroxContainer, hyroxRecs, hyroxState, mockCallbacks);
assert.ok(hyroxContainer.innerHTML.includes('체감강도(RPE)'), '콕핏 지표 바에 체감강도(RPE) 버튼 표출');
assert.ok(hyroxContainer.innerHTML.includes('완주기록(초)'), '콕핏 지표 바에 완주기록(초) 버튼 표출');
assert.ok(hyroxContainer.innerHTML.includes('페이스'), '콕핏 지표 바에 페이스 버튼 표출');

console.log('✅ [#TASK-ES-092 & #TASK-ES-093 & #TASK-ES-094 & #TASK-ES-095] 모든 통계 콕핏 단위 테스트 100% All Pass!');



