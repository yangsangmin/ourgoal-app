/**
 * OurGoal Stats Cell: 지표별 차등 분석 — 분석 계산·리포트 카드·기준 설정 모달(computeDifferentiatedAnalysis · renderDifferentiatedReportCard · openDifferentiatedMetricConfigModal) (#TASK-ES-405 · 통계 세포 쪼개기 3차)
 *
 * js/universal-stats.js(이전 전 3,283줄)에서 동작 그대로 옮겼다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 *   computeDifferentiatedAnalysis · renderDifferentiatedReportCard · openDifferentiatedMetricConfigModal
 * 함수 단위로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 원본 스코프 이름은 S.<이름>, 다른 통계 세포 파일의 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 */
(function(root) {
  'use strict';
  // S = js/universal-stats.js 의 스코프 통로 — 원본 IIFE 에 남은 공용 함수·값(pad·METRIC_CONFIGS·askConfirm …)을 getter 로 읽는다(원본이 로드될 때 채운다). 값은 읽을 때마다 살아 있는 값이다.
  // K = 통계 세포 키트 — 옮긴 함수를 담는다. 원본은 IIFE 맨 위에서 K 의 함수를 같은 이름으로 가져온다(전역 이름을 함수마다 늘리지 않는다).
  var K = root.OurgoalUniversalStatsKit = root.OurgoalUniversalStatsKit || {};
  var S = K.scope = K.scope || {};

  function computeDifferentiatedAnalysis(metricKey, timeSeriesData, customAgg){
    var model = S.METRIC_DIFFERENTIATED_MODELS[metricKey];
    if(model && typeof model.analyze === 'function'){
      return model.analyze(timeSeriesData);
    }
    timeSeriesData = Array.isArray(timeSeriesData) ? timeSeriesData : [];
    var n = timeSeriesData.length;
    var sum = timeSeriesData.reduce(function(a, b){ return a + (b.value||0); }, 0);
    var avg = n > 0 ? +(sum / n).toFixed(1) : 0;
    var max = n > 0 ? Math.max.apply(null, timeSeriesData.map(function(p){ return p.value || 0; })) : 0;
    return {
      model: 'generic',
      title: '📊 일반 지표 정밀 분석',
      kpis: [
        { label: '총 합계', val: sum.toLocaleString(), badge: '누적' },
        { label: '평균값', val: avg.toLocaleString(), badge: '일평균' },
        { label: '최고 기록', val: max.toLocaleString(), badge: 'PR' },
        { label: '기록 횟수', val: n + ' 회', badge: '데이터수' }
      ],
      summary: '총 ' + n + '건의 기록이 누적되었으며, 일평균 ' + avg + ', 최고 ' + max + '를 기록했습니다.'
    };
  }

  function renderDifferentiatedReportCard(metricKey, timeSeriesData, customAgg){
    var report = computeDifferentiatedAnalysis(metricKey, timeSeriesData, customAgg);
    if(!report) return '';

    var kpiHtml = (report.kpis || []).map(function(k){
      return '<div class="diff-kpi-cell">' +
        '<span class="diff-kpi-label">' + k.label + '</span>' +
        '<span class="diff-kpi-val">' + k.val + '</span>' +
        '<span class="diff-kpi-badge">' + k.badge + '</span>' +
      '</div>';
    }).join('');

    return '<div class="diff-report-card" data-metric-report="' + (report.model || metricKey) + '">' +
      '<div class="diff-report-header">' +
        '<div class="diff-report-title">' + (report.title || '지표 정밀 분석 리포트') + '</div>' +
        '<button type="button" class="btn btn-sm btn-ghost diff-cfg-open-btn" style="font-size:0.75rem;padding:4px 8px;border:1px solid var(--rule,#cbd5e1);border-radius:6px;">⚙️ 기준 설정</button>' +
      '</div>' +
      '<div class="diff-kpi-grid">' + kpiHtml + '</div>' +
      '<div class="diff-summary-box">💡 ' + (report.summary || '') + '</div>' +
    '</div>';
  }

  function openDifferentiatedMetricConfigModal(options){
    options = options || {};
    var openModalFn = options.openModal || (typeof window !== 'undefined' ? window.openModal : null);
    var closeModalFn = options.closeModal || (typeof window !== 'undefined' ? window.closeModal : null);
    if(!openModalFn) return;

    var STORAGE_KEY = 'ourgoal_metric_diff_configs';
    var savedConfigs = {};
    try {
      savedConfigs = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch(e) { savedConfigs = {}; }

    var metricList = [
      { key: 'weight', name: '체중 (kg)', defaultAgg: 'domain', desc: '7일 이동평균 & 주간 감량 속도 분석' },
      { key: 'strength', name: '웨이트/3대 (kg)', defaultAgg: 'domain', desc: '에플리 공식 1RM 추정 & 과부하 분석' },
      { key: 'running', name: '러닝 (km)', defaultAgg: 'domain', desc: '5단계 페이스존 & 심폐 마일리지' },
      { key: 'study', name: '공부/수험 (분/시간)', defaultAgg: 'domain', desc: '순공 몰입 밀도 & 뽀모도로 세션' },
      { key: 'finance', name: '자산/저축 (만원)', defaultAgg: 'domain', desc: '월간 저축 가속도 & 복리 예측' },
      { key: 'sleep', name: '수면 (시간)', defaultAgg: 'domain', desc: '수면 규칙성 100점 & 수면 부채' }
    ];

    var bodyHtml = 
      '<div class="og-modal-shell" style="max-height:75vh;overflow-y:auto;padding:4px 2px;">' +
        '<div class="og-modal-sub">' +
          '지표별 특성에 맞는 전문 분석 모델(1RM, 7일이평선, 페이스존, 뽀모도로 등) 또는 원하는 집계 기준(누적합, 평균, 최고기록)을 차등 지정할 수 있습니다.' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;gap:12px;">' +
          metricList.map(function(m){
            var curVal = savedConfigs[m.key] || m.defaultAgg;
            return '<div class="diff-cfg-card">' +
              '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
                '<span class="diff-cfg-title">' + m.name + '</span>' +
                '<span style="font-size:0.75rem;color:var(--ink-soft);">' + m.desc + '</span>' +
              '</div>' +
              '<div class="diff-opt-group">' +
                '<button type="button" class="diff-opt-btn' + (curVal==='domain' ? ' active' : '') + '" data-metric="' + m.key + '" data-agg="domain">맞춤 전문모델</button>' +
                '<button type="button" class="diff-opt-btn' + (curVal==='sum' ? ' active' : '') + '" data-metric="' + m.key + '" data-agg="sum">누적합</button>' +
                '<button type="button" class="diff-opt-btn' + (curVal==='avg' ? ' active' : '') + '" data-metric="' + m.key + '" data-agg="avg">평균값</button>' +
                '<button type="button" class="diff-opt-btn' + (curVal==='max' ? ' active' : '') + '" data-metric="' + m.key + '" data-agg="max">최고기록</button>' +
                '<button type="button" class="diff-opt-btn' + (curVal==='ma7' ? ' active' : '') + '" data-metric="' + m.key + '" data-agg="ma7">7일이평</button>' +
              '</div>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>';

    var footerHtml = 
      '<div style="display:flex;justify-content:flex-end;gap:8px;width:100%;">' +
        '<button type="button" class="btn btn-secondary" id="diffCfgCloseBtn" style="padding:8px 16px;">닫기</button>' +
        '<button type="button" class="btn btn-primary" id="diffCfgSaveBtn" style="padding:8px 20px;font-weight:700;">적용 완료</button>' +
      '</div>';

    openModalFn({
      title: '⚙️ 지표별 차등 분석 기준 설정',
      body: bodyHtml,
      footer: footerHtml
    });

    setTimeout(function(){
      var modalEl = document.querySelector('.modal, .dialog, #modalContainer, body');
      if(!modalEl) return;

      var buttons = modalEl.querySelectorAll('.diff-opt-btn');
      buttons.forEach(function(btn){
        btn.addEventListener('click', function(){
          var mKey = btn.getAttribute('data-metric');
          modalEl.querySelectorAll('.diff-opt-btn[data-metric="' + mKey + '"]').forEach(function(b){ b.classList.remove('active'); });
          btn.classList.add('active');
        });
      });

      var saveBtn = document.getElementById('diffCfgSaveBtn');
      if(saveBtn){
        saveBtn.addEventListener('click', function(){
          var newConfigs = {};
          metricList.forEach(function(m){
            var activeBtn = modalEl.querySelector('.diff-opt-btn[data-metric="' + m.key + '"].active');
            newConfigs[m.key] = activeBtn ? activeBtn.getAttribute('data-agg') : 'domain';
          });
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfigs));
          } catch(e){}
          if(typeof closeModalFn === 'function') closeModalFn();
          if(typeof options.onSave === 'function') options.onSave(newConfigs);
        });
      }

      var closeBtn = document.getElementById('diffCfgCloseBtn');
      if(closeBtn){
        closeBtn.addEventListener('click', function(){
          if(typeof closeModalFn === 'function') closeModalFn();
        });
      }
    }, 50);
  }

  K.computeDifferentiatedAnalysis = computeDifferentiatedAnalysis;
  K.renderDifferentiatedReportCard = renderDifferentiatedReportCard;
  K.openDifferentiatedMetricConfigModal = openDifferentiatedMetricConfigModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : global);
