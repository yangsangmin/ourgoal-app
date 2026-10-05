/**
 * OurGoal Stats Cell: 성취 분석 콕핏 동작 배선 — 접기·데이터 관리·숨은 앵커, 렌즈·분자/분모·모드·기간·스케일·측정 지표·종목 칩, 십자선·툴팁 수정·전체화면 (#TASK-ES-428 · 통계 세포 쪼개기 4차)
 *
 * js/universal-stats.js(이전 전 1,614줄)의 renderUniversalStatsDashboard(884줄)에서 동작 그대로 옮겼다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md 2절(섹션 소블록)
 *   bindStatsHeaderActions · bindStatsControlActions · bindStatsChartInteractions
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

  function bindStatsHeaderActions(D){
    // 6. 인터랙션 이벤트 바인딩
    // 아코디언 토글
    var hdrEl = D.container.querySelector('.u-cockpit-header');
    var bdyEl = D.container.querySelector('#uCockpitBody');
    var togIco = D.container.querySelector('#uAccordionToggleIcon');

    if(hdrEl && bdyEl){
      hdrEl.onclick = function(){
        var nowExp = (bdyEl.style.display !== 'none');
        var nextExp = !nowExp;
        bdyEl.style.display = nextExp ? 'block' : 'none';
        if(togIco) togIco.textContent = nextExp ? '▲' : '▼';
        try {
          if(typeof localStorage !== 'undefined'){
            localStorage.setItem('ourgoal_uStats_expanded', nextExp ? 'true' : 'false');
          }
        } catch(e){}

        if(nextExp){
          requestAnimationFrame(function(){
            var w = D.container.getBoundingClientRect().width;
            if(w > 100){
              K.renderUniversalStatsDashboard(D.container, D.allRecs, D.state, D.callbacks);
            }
          });
        }
      };
      if(togIco){
        togIco.onclick = function(e){
          e.stopPropagation();
          hdrEl.click();
        };
      }
    }

    // 데이터 관리 모달 통합 메뉴 버튼
    var mgmtMenuBtn = D.container.querySelector('#uHdrMgmtMenuBtn');
    if(mgmtMenuBtn){
      mgmtMenuBtn.onclick = function(e){
        e.stopPropagation();
        var curRecs = (D.state && D.state.profile && D.state.profile.records) || D.allRecs;
        K.openDataManagementModal({
          allRecs: curRecs,
          state: D.state,
          callbacks: D.callbacks,
          onDone: function(){
            var nextRecs = (D.state && D.state.profile && D.state.profile.records) || D.allRecs;
            K.renderUniversalStatsDashboard(D.container, nextRecs, D.state, D.callbacks);
          }
        });
      };
    }

    // 하위 호환성 앵커 버튼 (외부 참조 및 기존 스크립트 안전망)
    var gridBtn = D.container.querySelector('#uHdrGridBtn');
    if(gridBtn){
      gridBtn.onclick = function(e){
        e.stopPropagation();
        K.openUniversalDataGrid({ allRecs: D.allRecs, state: D.state, callbacks: D.callbacks });
      };
    }

    D.impBtn = D.container.querySelector('#uHdrImportBtn');
    if(D.impBtn){
      D.impBtn.onclick = function(e){
        e.stopPropagation();
        K.openUniversalImportModal({
          openModal: D.callbacks.openModal || window.openModal,
          closeModal: D.callbacks.closeModal || window.closeModal,
          toast: D.callbacks.toast || window.toast,
          state: D.state,
          saveProfile: D.callbacks.saveProfile,
          onDone: function(){ K.renderUniversalStatsDashboard(D.container, (D.state && D.state.profile && D.state.profile.records) || [], D.state, D.callbacks); }
        });
      };
    }

    var expCsvBtn = D.container.querySelector('#uHdrExportCsvBtn');
    if(expCsvBtn){
      expCsvBtn.onclick = function(e){
        e.stopPropagation();
        K.exportCleanCsv(D.allRecs, 'ourgoal_analytics_export.csv');
      };
    }

    var snapBtn = D.container.querySelector('#uHdrSnapBtn');
    if(snapBtn){
      snapBtn.onclick = function(e){
        e.stopPropagation();
        var mainCard = D.container.querySelector('#uCockpitMainCard');
        if(mainCard) K.captureChartSnapshot(mainCard, 'ourgoal_cockpit');
      };
    }
  }

  function bindStatsControlActions(D){
    // 4대 렌즈 전환 버튼
    D.container.querySelectorAll('.u-lens-btn').forEach(function(btn){
      btn.onclick = function(){
        D.state.univLens = btn.dataset.lens;
        K.renderUniversalStatsDashboard(D.container, D.allRecs, D.state, D.callbacks);
      };
    });

    // 상관 효율비 분자/분모 지표 변경 리스너
    var numSel = D.container.querySelector('#uRatioNumSelect');
    if(numSel){
      numSel.onchange = function(){
        D.state.univRatioNum = numSel.value;
        K.renderUniversalStatsDashboard(D.container, D.allRecs, D.state, D.callbacks);
      };
    }
    var denSel = D.container.querySelector('#uRatioDenSelect');
    if(denSel){
      denSel.onchange = function(){
        D.state.univRatioDen = denSel.value;
        K.renderUniversalStatsDashboard(D.container, D.allRecs, D.state, D.callbacks);
      };
    }

    // 모드 버튼
    D.container.querySelectorAll('.u-mode-btn').forEach(function(btn){
      btn.onclick = function(){
        D.state.univMode = btn.dataset.mode;
        if(D.state.univMode === 'all'){
          D.state.univSelectedEntities = D.ontology.map(function(o){ return o.name; });
        } else if(D.state.univMode === 'single' && D.state.univSelectedEntities.length > 1){
          D.state.univSelectedEntities = [D.state.univSelectedEntities[0]];
        }
        K.renderUniversalStatsDashboard(D.container, D.allRecs, D.state, D.callbacks);
      };
    });

    // 7-Tier 기간 버튼
    D.container.querySelectorAll('.u-period-btn').forEach(function(btn){
      btn.onclick = function(){
        D.state.univPeriod = btn.dataset.period;
        K.renderUniversalStatsDashboard(D.container, D.allRecs, D.state, D.callbacks);
      };
    });

    // 스케일 모드 버튼
    D.container.querySelectorAll('.u-scale-btn').forEach(function(btn){
      btn.onclick = function(){
        D.state.univScaleMode = btn.dataset.scale;
        K.renderUniversalStatsDashboard(D.container, D.allRecs, D.state, D.callbacks);
      };
    });

    // 3-1. 측정 차원(Dimension) 다중 선택 토글 버튼 (매출액, 계약건수, 커밋수, 1RM 등)
    D.container.querySelectorAll('.u-dim-btn').forEach(function(btn){
      btn.onclick = function(e){
        e.stopPropagation();
        var targetDim = btn.dataset.dim;
        D.state.univDimension = targetDim;
        var curSelected = (D.state.univSelectedDimensions || []).slice();
        var idx = curSelected.indexOf(targetDim);
        if(idx !== -1){
          if(curSelected.length > 1){
            curSelected.splice(idx, 1);
            D.state.univDimension = curSelected[0] || targetDim;
          }
        } else {
          curSelected.push(targetDim);
        }
        D.state.univSelectedDimensions = curSelected;
        K.renderUniversalStatsDashboard(D.container, (D.state && D.state.profile && D.state.profile.records) || D.allRecs, D.state, D.callbacks);
      };
    });

    // 온톨로지 탐색기 오픈
    var taxBtn = D.container.querySelector('#uTaxonomyOpenBtn');
    if(taxBtn){
      taxBtn.onclick = function(){
        K.openTaxonomyManagerModal({
          allRecs: D.allRecs,
          state: D.state,
          callbacks: {
            openModal: D.callbacks.openModal,
            closeModal: D.callbacks.closeModal,
            saveProfile: D.callbacks.saveProfile,
            toast: D.callbacks.toast,
            onDone: function(){ K.renderUniversalStatsDashboard(D.container, D.allRecs, D.state, D.callbacks); }
          }
        });
      };
    }

    // 엔티티 칩 클릭
    D.container.querySelectorAll('.u-entity-chip').forEach(function(btn){
      btn.onclick = function(){
        var entName = btn.dataset.name;
        if(D.state.univMode === 'single' || D.mode === 'single'){
          D.state.univSelectedEntities = [entName];
        } else if(D.state.univMode === 'multi' || D.mode === 'multi'){
          var curList = D.state.univSelectedEntities || [];
          if(curList.includes(entName)){
            if(curList.length > 1) D.state.univSelectedEntities = curList.filter(function(n){ return n !== entName; });
          } else {
            D.state.univSelectedEntities = curList.concat([entName]);
          }
        }
        K.renderUniversalStatsDashboard(D.container, D.allRecs, D.state, D.callbacks);
      };
    });
  }

  function bindStatsChartInteractions(D){
    // 십자선 & 플로팅 인스펙터 인터랙션 (Crosshair Tracking)
    var captureRect = D.container.querySelector('#uCrosshairCapture');
    var crossV = D.container.querySelector('#uCrosshairV');
    var crossH = D.container.querySelector('#uCrosshairH');
    var crossDot = D.container.querySelector('#uCrosshairDot');
    var tipBox = D.container.querySelector('#uFloatingInspector');
    var tipDate = D.container.querySelector('#uTipDate');
    var tipVal = D.container.querySelector('#uTipVal');
    var tipDelta = D.container.querySelector('#uTipDelta');
    var tipMemo = D.container.querySelector('#uTipMemo');
    var tipEditBtn = D.container.querySelector('#uTipEditBtn');
    var curHoverRecId = null;

    if(captureRect && D.chartObj.points.length > 0){
      function handleMove(e){
        var rect = captureRect.getBoundingClientRect();
        var clientX = e.clientX || (e.touches && e.touches[0] && e.touches[0].clientX);
        var clientY = e.clientY || (e.touches && e.touches[0] && e.touches[0].clientY);
        if(!clientX || !clientY) return;

        var svgEl = D.container.querySelector('#uInteractiveSvgChart');
        if(!svgEl) return;
        var svgRect = svgEl.getBoundingClientRect();
        var svgX = ((clientX - svgRect.left) / svgRect.width) * D.chartObj.width;
        var svgY = ((clientY - svgRect.top) / svgRect.height) * D.chartObj.height;

        // 가장 가까운 데이터 포인트 탐색 (반경 35px)
        var nearest = null;
        var minDist = 40;

        D.chartObj.points.forEach(function(pt){
          var dist = Math.hypot(pt.x - svgX, pt.y - svgY);
          if(dist < minDist){
            minDist = dist;
            nearest = pt;
          }
        });

        if(nearest){
          crossV.setAttribute('x1', nearest.x);
          crossV.setAttribute('x2', nearest.x);
          crossV.style.display = 'block';

          crossH.setAttribute('y1', nearest.y);
          crossH.setAttribute('y2', nearest.y);
          crossH.style.display = 'block';

          crossDot.setAttribute('cx', nearest.x);
          crossDot.setAttribute('cy', nearest.y);
          crossDot.setAttribute('fill', nearest.color);
          crossDot.style.display = 'block';

          if(tipBox){
            tipDate.textContent = nearest.date + ' · ' + nearest.seriesName;
            tipVal.textContent = nearest.val.toLocaleString() + ' ' + nearest.unit + (nearest.isPr ? ' (★ PR)' : '');
            if(nearest.delta !== null){
              tipDelta.textContent = (nearest.delta >= 0 ? '+' : '') + nearest.delta + ' ' + nearest.unit + ' (' + (nearest.deltaPct >= 0 ? '+' : '') + nearest.deltaPct + '%)';
              tipDelta.style.color = (nearest.delta >= 0 ? '#34d399' : '#f87171');
            } else {
              tipDelta.textContent = '첫 관측치';
              tipDelta.style.color = '#94a3b8';
            }
            tipMemo.textContent = nearest.memo || '세션 메모 없음';
            curHoverRecId = nearest.recId;

            var tipLeft = Math.min(rect.width - 160, Math.max(10, ((nearest.x / D.chartObj.width) * svgRect.width) - 50));
            var tipTop = Math.max(10, ((nearest.y / D.chartObj.height) * svgRect.height) - 75);
            tipBox.style.left = tipLeft + 'px';
            tipBox.style.top = tipTop + 'px';
            tipBox.style.display = 'block';
          }
        }
      }

      function handleLeave(){
        if(crossV) crossV.style.display = 'none';
        if(crossH) crossH.style.display = 'none';
        if(crossDot) crossDot.style.display = 'none';
        // 툴팁은 마우스 벗어나고 1.5초 후 닫기
        setTimeout(function(){
          if(tipBox && !tipBox.matches(':hover')) tipBox.style.display = 'none';
        }, 1500);
      }

      captureRect.addEventListener('mousemove', handleMove);
      captureRect.addEventListener('touchmove', handleMove, { passive: true });
      captureRect.addEventListener('mouseleave', handleLeave);
    }

    if(tipEditBtn){
      tipEditBtn.onclick = function(){
        if(curHoverRecId){
          var targetRec = D.allRecs.find(function(r){ return r.id === curHoverRecId; });
          if(targetRec){
            K.openRowEditModal({
              row: {
                id: targetRec.id,
                date: (targetRec.startAt || targetRec.createdAt || '').slice(0, 10),
                entity: targetRec.subTheme || targetRec.item || targetRec.exercise || '일반',
                primaryVal: targetRec.metrics ? (targetRec.metrics.primary || targetRec.metrics['1rm'] || targetRec.metrics.pages || 0) : 0,
                primaryUnit: targetRec.metrics ? (targetRec.metrics.primaryUnit || '') : '',
                secondaryVal: targetRec.metrics ? (targetRec.metrics.secondary || targetRec.metrics.volume || targetRec.metrics.duration || 0) : 0,
                secondaryUnit: targetRec.metrics ? (targetRec.metrics.secondaryUnit || '') : '',
                memo: targetRec.text || ''
              },
              callbacks: D.callbacks,
              state: D.state,
              onSaved: function(){
                K.renderUniversalStatsDashboard(D.container, D.state.profile.records, D.state, D.callbacks);
              }
            });
          }
        }
      };
    }
    // 전체화면 (가로 모드) 버튼 바인딩 (#TASK-ES-172)
    var fsBtn = D.container.querySelector('#uBtnGraphFullscreen');
    if(fsBtn){
      fsBtn.onclick = function(e){
        e.stopPropagation();
        K.openStatsFullscreenModal(D.seriesMap, D.allRecs, D.state, D.callbacks);
      };
    }
  }

  K.bindStatsHeaderActions = bindStatsHeaderActions;
  K.bindStatsControlActions = bindStatsControlActions;
  K.bindStatsChartInteractions = bindStatsChartInteractions;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : global);
