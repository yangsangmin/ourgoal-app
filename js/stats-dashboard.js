/**
 * OurGoal Stats Cell: 성취 분석 콕핏 대시보드 조립자 — 머리(온톨로지)·문맥 객체 D·구획 차례 호출, 빈 화면(샘플 바로 불러오기·가져오기), 데이터 준비(렌즈·모드·종목·측정 지표·기간·시계열) (#TASK-ES-428 · 통계 세포 쪼개기 4차)
 *
 * js/universal-stats.js(이전 전 1,614줄)의 renderUniversalStatsDashboard(884줄)에서 동작 그대로 옮겼다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md 2절(섹션 소블록)
 *   renderUniversalStatsDashboard · renderStatsEmptyState · prepareStatsDashboardData
 * 조립자 renderUniversalStatsDashboard 는 이전 함수의 머리(인자 기본값·온톨로지)를 글자 그대로 두고, 공유 지역 이름을 담을 문맥 객체 D 를 만든 뒤
 * 이전 함수 본문의 구획을 원래 순서로 부른다(빈 화면이면 빈 화면 구획 뒤 return — 이전과 같음).
 * 구획 함수는 이전 함수 본문의 최상위 문 묶음을 글자 그대로 옮긴 것이다. 구획끼리 같이 쓰던 지역 이름(인자·var)은 문맥 객체 D 의 칸(D.<이름>)으로 읽고 쓴다
 * (그 이름의 var 선언은 `var ` 만 떼어 대입문이 됨). 한 구획에서만 쓰던 지역 이름은 그 구획의 var 로 그대로다.
 * 바꾼 것은 이름 참조뿐이다 — D.<공유 지역 이름>, 원본 스코프 이름은 S.<이름>, 다른 통계 세포 파일의 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 */
(function(root) {
  'use strict';
  // S = js/universal-stats.js 의 스코프 통로 — 원본 IIFE 에 남은 공용 함수·값(pad·METRIC_CONFIGS·askConfirm …)을 getter 로 읽는다(원본이 로드될 때 채운다). 값은 읽을 때마다 살아 있는 값이다.
  // K = 통계 세포 키트 — 옮긴 함수를 담는다. 원본은 IIFE 맨 위에서 K 의 함수를 같은 이름으로 가져온다(전역 이름을 함수마다 늘리지 않는다).
  var K = root.OurgoalUniversalStatsKit = root.OurgoalUniversalStatsKit || {};
  var S = K.scope = K.scope || {};

/* ================= 10. 프로페셔널 데이터 콕핏 메인 렌더러 ================= */
  function renderUniversalStatsDashboard(container, allRecs, state, callbacks){

    if(!container) return;
    callbacks = callbacks || {};
    state = state || {};

    var customSchemas = (state.profile && state.profile.customSchemas) || [];
    var ontology = K.buildUniversalOntology(allRecs, customSchemas);
    var D = { container: container, allRecs: allRecs, state: state, callbacks: callbacks, ontology: ontology };

    if(ontology.length === 0){
      renderStatsEmptyState(D);
      return;
    }
    prepareStatsDashboardData(D);
    K.buildStatsHeaderHtml(D);
    K.buildStatsLensControlsHtml(D);
    K.buildStatsEntityChipsHtml(D);
    K.buildStatsChartHtml(D);
    K.buildStatsKpiHtml(D);
    K.mountStatsDashboardHtml(D);
    K.bindStatsHeaderActions(D);
    K.bindStatsControlActions(D);
    K.bindStatsChartInteractions(D);
  }

  function renderStatsEmptyState(D){
    D.container.innerHTML = 
      '<div class="card" style="padding:18px 14px;text-align:center;border-radius:14px;background:var(--card);border:1px solid var(--border);">' +
        '<div style="font-size:1.6rem;margin-bottom:6px;">📊</div>' +
        '<div style="font-weight:800;font-size:1rem;color:var(--ink);">자율 다차원 통계 분석기</div>' +
        '<div style="font-size:.8125rem;color:var(--ink-soft);margin-top:4px;margin-bottom:14px;line-height:1.5;">영업 실적, 개발 커밋, 수험 공부, 자산, 운동 등 어떤 데이터든 AI가 감지해 다차원으로 분석해요.</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(130px, 1fr));gap:8px;margin-bottom:12px;">' +
          '<button type="button" class="btn btn-ghost btn-sm u-empty-load-btn" data-type="sales" style="padding:10px 8px;border-radius:10px;border:1px solid var(--border);background:var(--card2);display:flex;flex-direction:column;align-items:center;gap:4px;height:auto;cursor:pointer;">' +
            '<span style="font-size:1.2rem;">💼</span>' +
            '<span style="font-weight:700;font-size:.75rem;color:var(--ink);">B2B 영업 실적</span>' +
            '<span style="font-size:.65rem;color:var(--ink-soft);">52주 매출·계약</span>' +
          '</button>' +
          '<button type="button" class="btn btn-ghost btn-sm u-empty-load-btn" data-type="coding" style="padding:10px 8px;border-radius:10px;border:1px solid var(--border);background:var(--card2);display:flex;flex-direction:column;align-items:center;gap:4px;height:auto;cursor:pointer;">' +
            '<span style="font-size:1.2rem;">💻</span>' +
            '<span style="font-weight:700;font-size:.75rem;color:var(--ink);">개발자 활동</span>' +
            '<span style="font-size:.65rem;color:var(--ink-soft);">52주 커밋·PR</span>' +
          '</button>' +
          '<button type="button" class="btn btn-ghost btn-sm u-empty-load-btn" data-type="study" style="padding:10px 8px;border-radius:10px;border:1px solid var(--border);background:var(--card2);display:flex;flex-direction:column;align-items:center;gap:4px;height:auto;cursor:pointer;">' +
            '<span style="font-size:1.2rem;">📖</span>' +
            '<span style="font-weight:700;font-size:.75rem;color:var(--ink);">수험·공부</span>' +
            '<span style="font-size:.65rem;color:var(--ink-soft);">52주 문제·순공</span>' +
          '</button>' +
          '<button type="button" class="btn btn-ghost btn-sm u-empty-load-btn" id="uEmptyLoadBig3Btn" data-type="big3" style="padding:10px 8px;border-radius:10px;border:1px solid var(--border);background:var(--card2);display:flex;flex-direction:column;align-items:center;gap:4px;height:auto;cursor:pointer;">' +
            '<span style="font-size:1.2rem;">🏃</span>' +
            '<span style="font-weight:700;font-size:.75rem;color:var(--ink);">건강·운동</span>' +
            '<span style="font-size:.65rem;color:var(--ink-soft);">52주 중량·세션</span>' +
          '</button>' +
        '</div>' +
        '<button type="button" class="btn btn-primary btn-sm" id="uEmptyImportBtn" style="font-weight:700;padding:8px 16px;"><span>📥 내 데이터 가져오기 (CSV / 직접입력)</span></button>' +
      '</div>';

    D.container.querySelectorAll('.u-empty-load-btn').forEach(function(btn){
      btn.onclick = function(){
        var sType = btn.dataset.type;
        var sRecs = [];
        if(sType === 'sales') sRecs = K.generateDomainSample('sales');
        else if(sType === 'coding') sRecs = K.generateDomainSample('coding');
        else if(sType === 'study') sRecs = K.generateDomainSample('study');
        else sRecs = K.generate52WeekPowerliftingSample();

        var cur = (D.state && D.state.profile && D.state.profile.records) || [];
        if(D.state && D.state.profile) D.state.profile.records = cur.concat(sRecs);
        if(D.callbacks.saveProfile) D.callbacks.saveProfile();
        if(D.callbacks.onDone) D.callbacks.onDone();
        renderUniversalStatsDashboard(D.container, (D.state && D.state.profile && D.state.profile.records) || sRecs, D.state, D.callbacks);
      };
    });

    D.impBtn = D.container.querySelector('#uEmptyImportBtn');
    if(D.impBtn){
      D.impBtn.onclick = function(){
        K.openUniversalImportModal({
          openModal: D.callbacks.openModal || window.openModal,
          closeModal: D.callbacks.closeModal || window.closeModal,
          toast: D.callbacks.toast || window.toast,
          state: D.state,
          saveProfile: D.callbacks.saveProfile,
          onDone: function(){
            if(D.callbacks.onDone) D.callbacks.onDone();
            renderUniversalStatsDashboard(D.container, (D.state && D.state.profile && D.state.profile.records) || [], D.state, D.callbacks);
          }
        });
      };
    }
  }

  function prepareStatsDashboardData(D){
    D.isExpanded = true;
    try {
      if(typeof localStorage !== 'undefined'){
        var savedExp = localStorage.getItem('ourgoal_uStats_expanded');
        if(savedExp === 'false') D.isExpanded = false;
      }
    } catch(e){}

    D.curLens = D.state.univLens || 'trend';
    D.state.univLens = D.curLens;
        D.mode = D.state.univMode || 'single';
    D.selected = D.state.univSelectedEntities;
    if(!D.selected || D.selected.length === 0){
      D.selected = [D.ontology[0].name];
      D.state.univSelectedEntities = D.selected;
    }

    // 선택된 엔티티가 가진 모든 측정 차원(Metric Dimensions) 동적 수집
    var targetEntityNames = (D.mode === 'all') ? D.ontology.map(function(o){ return o.name; }) : D.selected;
    D.availableDims = [];
    var specificDims = [];
    targetEntityNames.forEach(function(name){
      var ent = D.ontology.find(function(o){ return o.name === name; });
      if(ent && Array.isArray(ent.dimensions)){
        ent.dimensions.forEach(function(d){
          if(d === 'primary' || d === 'secondary' || d === 'primaryUnit' || d === 'secondaryUnit') return;
          if(!specificDims.includes(d)) specificDims.push(d);
        });
      }
    });
    if(specificDims.length > 0){
      D.availableDims = specificDims;
    } else {
      D.availableDims = ['primary'];
    }

    var selectedDims = D.state.univSelectedDimensions;
    if(!Array.isArray(selectedDims) || selectedDims.length === 0){
      var initDim = D.state.univDimension || D.availableDims[0];
      if(!D.availableDims.includes(initDim)) initDim = D.availableDims[0];
      selectedDims = [initDim];
      D.state.univSelectedDimensions = selectedDims;
    } else {
      selectedDims = selectedDims.filter(function(d){ return D.availableDims.includes(d); });
      if(selectedDims.length === 0){
        selectedDims = [D.availableDims[0]];
      }
      D.state.univSelectedDimensions = selectedDims;
    }

    D.dimension = D.state.univDimension;
    if(!D.dimension || !selectedDims.includes(D.dimension)){
      D.dimension = selectedDims[0];
      D.state.univDimension = D.dimension;
    }

    var hasHistorical = (D.allRecs || []).some(function(r){
      var yr = parseInt((r.startAt || '').slice(0, 4), 10);
      return !isNaN(yr) && yr < 2025;
    });
    D.period = D.state.univPeriod || (hasHistorical ? 'all' : '1y');
    D.state.univPeriod = D.period;

    D.scaleMode = D.state.univScaleMode || 'linear';

    D.dimDisplayNames = {
      '1rm': '추정 1RM(kg)',
      'estimated_1rm_kg': '1RM(kg)',
      'volume': '총 볼륨(kg)',
      'daily_volume_kg': '일일 볼륨(kg)',
      'bodyweight': '체중(kg)',
      'bodyweight_kg': '체중(kg)',
      'sets': '세트수',
      'record': '완주기록(초)',
      'pace': '페이스',
      'rpe': '체감강도(RPE)',
      'intensity': '운동강도(%)',
      'distance': '거리(km)',
      'pages': '독서량(쪽)',
      'duration': '소요시간(분)',
      'revenue': '매출액(만원)',
      'contracts': '계약건수(건)',
      'deals': '계약건수(건)',
      'score': '점수(점)',
      'problems': '문제수(개)',
      'commits': '커밋수(개)',
      'prs': 'PR수(개)',
      'reviews': '코드리뷰(건)',
      'meetings': '미팅(회)',
      'proposals': '제안서(건)',
      'savings': '저축액(만원)',
      'hours': '수면(시간)',
      'primary': '1차 지표',
      'secondary': '2차 지표'
    };

    D.activeEntityKeys = (D.mode === 'all') ? D.ontology.map(function(o){ return o.name; }) : D.selected;
    D.seriesMap = {};
    if(selectedDims.length <= 1){
      D.seriesMap = K.aggregateMultiSeries(D.allRecs, D.activeEntityKeys, D.dimension, D.period, D.mode);
    } else {
      // 복수 지표 다중 선택 시: 모든 선택된 지표의 시계열을 단일 차트에 오버레이 (#TASK-ES-172)
      selectedDims.forEach(function(d){
        var dLabel = D.dimDisplayNames[d] || d;
        var subMap = K.aggregateMultiSeries(D.allRecs, D.activeEntityKeys, d, D.period, D.mode);
        Object.keys(subMap).forEach(function(entKey){
          var subSeries = subMap[entKey];
          if(subSeries && subSeries.points && subSeries.points.length > 0){
            var combinedKey = (D.activeEntityKeys.length === 1 && D.mode !== 'all') ? dLabel : (entKey + ' (' + dLabel + ')');
            var cloned = Object.assign({}, subSeries);
            cloned.entity = combinedKey;
            D.seriesMap[combinedKey] = cloned;
          }
        });
      });
      if(Object.keys(D.seriesMap).length === 0){
        D.seriesMap = K.aggregateMultiSeries(D.allRecs, D.activeEntityKeys, D.dimension, D.period, D.mode);
      }
    }
  }

  K.renderUniversalStatsDashboard = renderUniversalStatsDashboard;
  K.renderStatsEmptyState = renderStatsEmptyState;
  K.prepareStatsDashboardData = prepareStatsDashboardData;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : global);
