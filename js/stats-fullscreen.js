/**
 * OurGoal Stats Cell: 성취통계 전체화면(가로) 뷰포트 모달(openStatsFullscreenModal) (#TASK-ES-405 · 통계 세포 쪼개기 3차)
 *
 * js/universal-stats.js(이전 전 3,283줄)에서 동작 그대로 옮겼다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 *   openStatsFullscreenModal
 * 함수 단위로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 원본 스코프 이름은 S.<이름>, 다른 통계 세포 파일의 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 */
(function(root) {
  'use strict';
  // S = js/universal-stats.js 의 스코프 통로 — 원본 IIFE 에 남은 공용 함수·값(pad·METRIC_CONFIGS·askConfirm …)을 getter 로 읽는다(원본이 로드될 때 채운다). 값은 읽을 때마다 살아 있는 값이다.
  // K = 통계 세포 키트 — 옮긴 함수를 담는다. 원본은 IIFE 맨 위에서 K 의 함수를 같은 이름으로 가져온다(전역 이름을 함수마다 늘리지 않는다).
  var K = root.OurgoalUniversalStatsKit = root.OurgoalUniversalStatsKit || {};
  var S = K.scope = K.scope || {};

  /**
   * 성취통계 전체화면(가로) 뷰포트 모달 (#TASK-ES-172)
   * 디바이스 기기 화면비율에 알맞게 자동 피팅하며, 세로 폰에서도 가로 꽉 찬 뷰 지원
   */
  function openStatsFullscreenModal(seriesMap, allRecs, state, callbacks){
    var oldModal = document.getElementById('uStatsFullscreenModal');
    if(oldModal) oldModal.remove();

    var modal = document.createElement('div');
    modal.id = 'uStatsFullscreenModal';
    modal.style.position = 'fixed';
    modal.style.inset = '0';
    modal.style.zIndex = '100030';
    modal.style.background = 'rgba(11, 17, 32, 0.98)';
    modal.style.backdropFilter = 'blur(20px)';
    modal.style.webkitBackdropFilter = 'blur(20px)';
    modal.style.display = 'flex';
    modal.style.flexDirection = 'column';
    modal.style.padding = '12px 16px';
    modal.style.boxSizing = 'border-box';
    modal.style.overflow = 'hidden';
    modal.style.color = '#fff';

    document.body.appendChild(modal);

    var curPeriod = state.univPeriod || 'all';
    var curScale = state.univScaleMode || 'linear';
    var isForcedRotated = false;

    var dimNames = {
      '1rm': '추정 1RM(kg)', 'estimated_1rm_kg': '1RM(kg)', 'volume': '총 볼륨(kg)',
      'daily_volume_kg': '일일 볼륨(kg)', 'bodyweight': '체중(kg)', 'bodyweight_kg': '체중(kg)',
      'sets': '세트수', 'record': '완주기록(초)', 'pace': '페이스', 'rpe': '체감강도(RPE)',
      'intensity': '운동강도(%)', 'distance': '거리(km)', 'pages': '독서량(쪽)', 'duration': '소요시간(분)',
      'revenue': '매출액(만원)', 'contracts': '계약건수(건)', 'deals': '계약건수(건)', 'score': '점수(점)',
      'problems': '문제수(개)', 'commits': '커밋수(개)', 'prs': 'PR수(개)', 'reviews': '코드리뷰(건)',
      'meetings': '미팅(회)', 'proposals': '제안서(건)', 'savings': '저축액(만원)', 'hours': '수면(시간)',
      'primary': '1차 지표', 'secondary': '2차 지표'
    };

    function renderFullscreenContent(){
      var winW = window.innerWidth;
      var winH = window.innerHeight;
      var isLandscape = winW >= winH;

      var plotW, plotH;
      if(isForcedRotated && !isLandscape){
        plotW = Math.max(winH - 32, 480);
        plotH = Math.max(winW - 130, 240);
      } else {
        plotW = Math.max(winW - 32, 320);
        plotH = Math.max(winH - 120, 240);
      }

      var fsChartObj = K.renderMultiSeriesSvg(seriesMap, {
        width: plotW,
        height: plotH,
        scaleMode: curScale,
        period: curPeriod
      });

      var activeEntities = Object.keys(seriesMap || {});
      var colors = ['#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b'];

      var fsPeriodTabs = [
        { id: 'all', label: '전체 (ALL)' },
        { id: '1y', label: '1Y' },
        { id: '6m', label: '6M' },
        { id: '3m', label: '3M' },
        { id: '1m', label: '1M' },
        { id: '1w', label: '1W' },
        { id: '3d', label: '3D' }
      ];

      var periodBtnsHtml = '<div style="display:flex;gap:3px;background:rgba(255,255,255,0.08);padding:3px;border-radius:8px;">' +
        fsPeriodTabs.map(function(pt){
          var isAct = curPeriod === pt.id;
          return '<button type="button" class="u-fs-period-btn" data-p="' + pt.id + '" style="padding:4px 8px;border:none;border-radius:6px;font-size:0.75rem;font-weight:700;font-family:monospace;cursor:pointer;background:' + (isAct ? '#3b82f6' : 'transparent') + ';color:' + (isAct ? '#fff' : '#cbd5e1') + ';">' + pt.label + '</button>';
        }).join('') +
      '</div>';

      var scaleBtnsHtml = '<div style="display:flex;gap:3px;background:rgba(255,255,255,0.08);padding:3px;border-radius:8px;">' +
        '<button type="button" class="u-fs-scale-btn" data-s="linear" style="padding:4px 8px;border:none;border-radius:6px;font-size:0.75rem;font-weight:700;cursor:pointer;background:' + (curScale === 'linear' ? '#3b82f6' : 'transparent') + ';color:' + (curScale === 'linear' ? '#fff' : '#cbd5e1') + ';">실제 수치</button>' +
        '<button type="button" class="u-fs-scale-btn" data-s="normalized" style="padding:4px 8px;border:none;border-radius:6px;font-size:0.75rem;font-weight:700;cursor:pointer;background:' + (curScale === 'normalized' ? '#3b82f6' : 'transparent') + ';color:' + (curScale === 'normalized' ? '#fff' : '#cbd5e1') + ';">100% 상대 비교</button>' +
      '</div>';

      var rotateBtnHtml = '';
      if(!isLandscape){
        rotateBtnHtml = '<button type="button" id="uFsRotateBtn" style="padding:5px 10px;border-radius:8px;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.08);color:#fff;font-size:0.75rem;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:4px;">' +
          '<span>🔄 ' + (isForcedRotated ? '세로 보기' : '가로 회전') + '</span>' +
        '</button>';
      }

      var fsLegendHtml = '<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;padding:6px 4px;margin-top:6px;overflow-x:auto;">' +
        activeEntities.map(function(k, idx){
          var s = seriesMap[k];
          var col = colors[idx % colors.length];
          return '<div style="display:flex;align-items:center;gap:5px;font-size:.78rem;font-weight:700;color:#cbd5e1;white-space:nowrap;">' +
            '<span style="width:10px;height:10px;border-radius:50%;background:' + col + ';display:inline-block;box-shadow:0 0 6px ' + col + ';"></span>' +
            '<span>' + s.entity + '</span>' +
            '<span style="color:' + col + ';font-family:monospace;font-weight:800;">' + (s.latestVal ? (s.latestVal + (s.unit ? (' ' + s.unit) : '')) : '-') + '</span>' +
          '</div>';
        }).join('') +
      '</div>';

      var rotationStyle = '';
      if(isForcedRotated && !isLandscape){
        rotationStyle = 'transform:rotate(90deg);transform-origin:center center;width:' + (winH - 32) + 'px;height:' + (winW - 130) + 'px;position:absolute;top:50%;left:50%;margin-left:-' + ((winH - 32)/2) + 'px;margin-top:-' + ((winW - 130)/2) + 'px;';
      } else {
        rotationStyle = 'width:100%;box-sizing:border-box;';
      }

      modal.innerHTML = 
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-shrink:0;gap:8px;flex-wrap:wrap;">' +
          '<div style="display:flex;align-items:center;gap:8px;">' +
            '<span style="font-size:1.3rem;">📊</span>' +
            '<div>' +
              '<h3 style="margin:0;font-size:1.05rem;font-weight:800;color:#fff;letter-spacing:-0.3px;">성취 분석 전체화면 뷰</h3>' +
              '<span style="font-size:0.75rem;color:#94a3b8;font-family:monospace;">화면 비율: ' + (isLandscape ? '가로 와이드 핏' : (isForcedRotated ? '가로 회전 핏' : '모바일 핏')) + ' (' + winW + 'x' + winH + ')</span>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
            periodBtnsHtml +
            scaleBtnsHtml +
            rotateBtnHtml +
            '<button type="button" id="uFsCloseBtn" style="padding:6px 14px;border-radius:10px;border:1px solid rgba(255,255,255,0.25);background:rgba(239,68,68,0.2);color:#fca5a5;font-weight:800;cursor:pointer;font-size:0.85rem;display:inline-flex;align-items:center;gap:4px;">' +
              '<span>✕ 닫기</span>' +
            '</button>' +
          '</div>' +
        '</div>' +
        '<div id="uFsChartWrapper" style="flex:1;min-height:0;position:relative;background:rgba(15,23,42,0.85);border:1px solid rgba(255,255,255,0.12);border-radius:14px;padding:8px;display:flex;flex-direction:column;justify-content:center;align-items:center;overflow:hidden;' + rotationStyle + '">' +
          fsChartObj.svgHtml +
        '</div>' +
        fsLegendHtml;

      modal.querySelector('#uFsCloseBtn').onclick = function(){
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('keydown', handleKey);
        modal.remove();
      };

      modal.querySelectorAll('.u-fs-period-btn').forEach(function(btn){
        btn.onclick = function(){
          curPeriod = btn.dataset.p;
          state.univPeriod = curPeriod;
          var selectedDims = state.univSelectedDimensions || [state.univDimension || 'primary'];
          seriesMap = {};
          if(selectedDims.length > 1){
            selectedDims.forEach(function(d){
              var dLabel = dimNames[d] || d;
              var subMap = K.aggregateMultiSeries(allRecs, state.univSelectedEntities || [], d, curPeriod, state.univMode || 'single');
              Object.keys(subMap).forEach(function(entKey){
                var subSeries = subMap[entKey];
                if(subSeries && subSeries.points && subSeries.points.length > 0){
                  var combinedKey = entKey + ' (' + dLabel + ')';
                  var cloned = Object.assign({}, subSeries);
                  cloned.entity = combinedKey;
                  seriesMap[combinedKey] = cloned;
                }
              });
            });
          } else {
            seriesMap = K.aggregateMultiSeries(allRecs, state.univSelectedEntities || [], state.univDimension || 'primary', curPeriod, state.univMode || 'single');
          }
          renderFullscreenContent();
        };
      });

      modal.querySelectorAll('.u-fs-scale-btn').forEach(function(btn){
        btn.onclick = function(){
          curScale = btn.dataset.s;
          state.univScaleMode = curScale;
          renderFullscreenContent();
        };
      });

      var rotBtn = modal.querySelector('#uFsRotateBtn');
      if(rotBtn){
        rotBtn.onclick = function(){
          isForcedRotated = !isForcedRotated;
          renderFullscreenContent();
        };
      }
    }

    function handleResize(){
      renderFullscreenContent();
    }
    function handleKey(e){
      if(e.key === 'Escape'){
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('keydown', handleKey);
        modal.remove();
      }
    }

    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKey);

    renderFullscreenContent();
  }

  K.openStatsFullscreenModal = openStatsFullscreenModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : global);
