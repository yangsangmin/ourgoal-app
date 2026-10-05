/**
 * OurGoal Stats Cell: 성취 분석 콕핏 화면 글자 — 머리·렌즈·기간 컨트롤·종목 칩·측정 지표·차트·KPI·진단 리포트 HTML 을 만들고 그린다 (#TASK-ES-428 · 통계 세포 쪼개기 4차)
 *
 * js/universal-stats.js(이전 전 1,614줄)의 renderUniversalStatsDashboard(884줄)에서 동작 그대로 옮겼다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md 2절(섹션 소블록)
 *   buildStatsHeaderHtml · buildStatsLensControlsHtml · buildStatsEntityChipsHtml · buildStatsChartHtml · buildStatsKpiHtml · mountStatsDashboardHtml
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

  function buildStatsHeaderHtml(D){
    // 1. 헤더 (1-Line Compact & Intuitive Header)
    D.headerHtml = 
      '<div class="u-cockpit-header" style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--card);border-radius:12px;cursor:pointer;user-select:none;border:1px solid var(--border);">' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
          '<span style="font-size:1.15rem;">📊</span>' +
          '<div>' +
            '<div style="display:flex;align-items:center;gap:6px;">' +
              '<span style="font-weight:800;font-size:.9375rem;color:var(--ink);">성취 분석 콕핏</span>' +
              '<span class="badge" style="font-size:.6875rem;padding:2px 6px;border-radius:10px;background:rgba(37,99,235,0.12);color:var(--primary);font-weight:800;font-family:monospace;">' + D.activeEntityKeys.length + '개 종목</span>' +
            '</div>' +
            '<div style="font-size:.6875rem;color:var(--ink-soft);margin-top:1px;">기록 향상 곡선과 실천 패턴 다각도 분석</div>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:6px;">' +
          '<button type="button" class="btn btn-ghost btn-xs" id="uHdrMgmtMenuBtn" onclick="event.stopPropagation();" style="font-size:.75rem;padding:4px 9px;font-weight:700;border:1px solid var(--border);border-radius:8px;background:var(--card2);cursor:pointer;">' +
            '⚙️ 데이터 관리 ▾' +
          '</button>' +
          '<span id="uAccordionToggleIcon" title="접기/펼치기" style="cursor:pointer;font-size:.75rem;padding:2px 6px;font-weight:800;color:var(--ink-soft);">' + (D.isExpanded ? '▲' : '▼') + '</span>' +
          '<!-- 하위 호환성 앵커 (스크립트/테스트 참조 보존) -->' +
          '<div style="display:none;">' +
            '<button type="button" id="uHdrGridBtn"></button>' +
            '<button type="button" id="uHdrImportBtn"></button>' +
            '<button type="button" id="uHdrExportCsvBtn"></button>' +
            '<button type="button" id="uHdrSnapBtn"></button>' +
          '</div>' +
        '</div>' +
      '</div>';

    // 1-B. 3단계 사용법 퀵 가이드
    D.quickGuideHtml = 
      '<div class="u-cockpit-quick-guide" style="display:flex;align-items:center;justify-content:center;gap:6px;padding:6px 10px;background:var(--card2);border-radius:8px;margin-bottom:8px;font-size:.75rem;color:var(--ink-soft);flex-wrap:wrap;">' +
        '<span style="font-weight:800;color:var(--primary);display:flex;align-items:center;gap:3px;"><span>💡</span><span>사용법:</span></span>' +
        '<span style="font-weight:700;color:var(--ink);"><b style="color:var(--primary);">1</b> 렌즈 선택</span>' +
        '<span style="opacity:0.4;">➔</span>' +
        '<span style="font-weight:700;color:var(--ink);"><b style="color:var(--primary);">2</b> 종목 탭</span>' +
        '<span style="opacity:0.4;">➔</span>' +
        '<span style="font-weight:700;color:var(--ink);"><b style="color:var(--primary);">3</b> 성장 분석 확인</span>' +
      '</div>';
  }

  function buildStatsLensControlsHtml(D){
    // 2. 컨트롤 바 (기간 & 스케일 알약)
    var periodTabs = [
      { id: 'all', label: '전체 (ALL)' },
      { id: '1y', label: '1Y' },
      { id: '6m', label: '6M' },
      { id: '3m', label: '3M' },
      { id: '1m', label: '1M' },
      { id: '1w', label: '1W' },
      { id: '3d', label: '3D' }
    ];

    D.periodHtml = '<div style="display:flex;gap:3px;background:var(--card2);padding:2px;border-radius:8px;">';
    periodTabs.forEach(function(pt){
      var isPAct = (D.period === pt.id);
      D.periodHtml += '<button type="button" class="u-period-btn" data-period="' + pt.id + '" style="padding:3px 7px;border:none;border-radius:6px;font-size:.7rem;font-weight:700;font-family:monospace;cursor:pointer;background:' + (isPAct ? 'var(--card)' : 'transparent') + ';color:' + (isPAct ? 'var(--primary)' : 'var(--ink)') + ';box-shadow:' + (isPAct ? '0 1px 2px rgba(0,0,0,0.08)' : 'none') + ';">' + pt.label + '</button>';
    });
    D.periodHtml += '</div>';

    D.scaleToggleHtml = 
      '<div style="display:flex;gap:2px;background:var(--card2);padding:2px;border-radius:6px;">' +
        '<button type="button" class="u-scale-btn" data-scale="linear" style="padding:3px 6px;border:none;border-radius:4px;font-size:.6875rem;font-weight:700;cursor:pointer;background:' + (D.scaleMode === 'linear' ? 'var(--primary)' : 'transparent') + ';color:' + (D.scaleMode === 'linear' ? '#fff' : 'var(--ink)') + ';">실제 수치</button>' +
        '<button type="button" class="u-scale-btn" data-scale="normalized" style="padding:3px 6px;border:none;border-radius:4px;font-size:.6875rem;font-weight:700;cursor:pointer;background:' + (D.scaleMode === 'normalized' ? 'var(--primary)' : 'transparent') + ';color:' + (D.scaleMode === 'normalized' ? '#fff' : 'var(--ink)') + ';">100% 상대 비교</button>' +
      '</div>';

    // 4대 다차원 분석 렌즈 전환 바 (고밀도 반응형 세그먼트)
    var lenses = [
      { id: 'trend', icon: '📈', label: '성장 추세', sub: '시계열·PR' },
      { id: 'ratio', icon: '⚡', label: '효율 분석', sub: '단가·비율' },
      { id: 'radar', icon: '🎯', label: '균형 레이더', sub: '달성도·방사형' },
      { id: 'cadence', icon: '🗓️', label: '요일 주기', sub: '루틴·밀도' }
    ];
    D.lensHtml = '<div class="u-lens-row" style="display:flex;gap:4px;background:var(--card2);padding:3px;border-radius:10px;margin-bottom:6px;overflow-x:auto;-webkit-overflow-scrolling:touch;">';
    lenses.forEach(function(l){
      var isLAct = (D.curLens === l.id);
      var actBg = isLAct ? 'var(--primary, #2563eb)' : 'transparent';
      var actFg = isLAct ? '#ffffff' : 'var(--ink)';
      var actShadow = isLAct ? '0 2px 6px rgba(37,99,235,0.25)' : 'none';
      D.lensHtml += 
        '<button type="button" class="u-lens-btn" data-lens="' + l.id + '" style="flex:1;min-width:78px;padding:7px 4px;border:none;border-radius:8px;cursor:pointer;background:' + actBg + ';color:' + actFg + ';box-shadow:' + actShadow + ';display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;transition:all 0.18s ease;user-select:none;">' +
          '<div style="display:flex;align-items:center;gap:3px;font-size:.75rem;font-weight:800;">' +
            '<span>' + l.icon + '</span><span>' + l.label + '</span>' +
          '</div>' +
          '<span style="font-size:.625rem;opacity:' + (isLAct ? '0.9' : '0.65') + ';font-family:sans-serif;letter-spacing:-0.2px;">' + l.sub + '</span>' +
        '</button>';
    });
    D.lensHtml += '</div>';

    var lensExplanations = {
      trend: '📈 <b>성장 추세</b>: 선택한 종목의 시간 흐름에 따른 기록 향상 곡선과 역대 최고 기록을 추적합니다.',
      ratio: '⚡ <b>성과 효율 분석</b>: 투자한 시간이나 노력 대비 실질적 성과 비율을 분석합니다.',
      radar: '🎯 <b>균형 레이더</b>: 전체 활동 영역의 비중과 균형도를 방사형 차트로 종합 평가합니다.',
      cadence: '🗓️ <b>요일 주기</b>: 요일별 활동 실천 횟수와 집중 요일을 파악하여 루틴을 점검합니다.'
    };
    D.lensExpBannerHtml = 
      '<div class="u-lens-exp-banner" style="font-size:.75rem;color:var(--ink-soft);background:var(--card2);padding:7px 10px;border-radius:8px;margin-bottom:10px;border-left:3px solid var(--primary);line-height:1.4;">' +
        (lensExplanations[D.curLens] || lensExplanations.trend) +
      '</div>';
  }

  function buildStatsEntityChipsHtml(D){
    // 3. 엔티티 칩 타이틀 및 목록
    D.colors = ['#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b'];
    D.chipsTitleHtml = 
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
        '<span style="font-size:.78125rem;font-weight:800;color:var(--ink);">🎯 분석할 항목 (탭하여 선택):</span>' +
        '<div style="display:flex;gap:4px;align-items:center;">' +
          '<button type="button" class="btn btn-xs btn-ghost u-mode-btn" data-mode="' + (D.mode === 'all' ? 'single' : 'all') + '" style="font-size:.6875rem;padding:2px 7px;border:1px solid var(--border);border-radius:6px;font-weight:700;cursor:pointer;">' +
            (D.mode === 'all' ? '🎯 개별 선택 모드' : '✨ 전체 모아보기') +
          '</button>' +
        '</div>' +
      '</div>';

    D.chipsHtml = '<div class="u-entity-chip-row" style="display:flex;gap:6px;overflow-x:auto;padding-bottom:6px;margin-bottom:8px;-webkit-overflow-scrolling:touch;">';
    D.ontology.forEach(function(o, idx){
      var isSel = (D.mode === 'all') || D.selected.includes(o.name);
      var cIdx = D.selected.indexOf(o.name);
      var cColor = cIdx !== -1 ? D.colors[cIdx % D.colors.length] : (isSel ? 'var(--primary)' : 'var(--card2)');
      var bg = isSel ? cColor : 'var(--card2)';
      var fg = isSel ? '#ffffff' : 'var(--ink)';
      var bd = isSel ? 'none' : '1px solid var(--border)';

      D.chipsHtml += 
        '<button type="button" class="u-entity-chip" data-name="' + o.name + '" style="flex-shrink:0;padding:5px 11px;border-radius:16px;font-size:.75rem;font-weight:700;background:' + bg + ';color:' + fg + ';border:' + bd + ';cursor:pointer;display:flex;align-items:center;gap:4px;box-shadow:' + (isSel ? '0 1px 3px rgba(0,0,0,0.12)' : 'none') + ';">' +
          '<span>' + (isSel && D.mode !== 'all' ? '✓ ' : '') + o.icon + ' ' + o.name + '</span>' +
          '<span style="font-size:.65rem;opacity:0.85;">(' + o.count + ')</span>' +
        '</button>';
    });
    D.chipsHtml += '</div>';

    // 3-1. 측정 차원(Metric Dimension) 전환 바

    D.dimHtml = '<div class="u-dim-selector-row" style="display:flex;gap:5px;overflow-x:auto;padding-bottom:6px;margin-bottom:8px;-webkit-overflow-scrolling:touch;align-items:center;">';
    D.dimHtml += '<span style="font-size:.75rem;font-weight:800;color:var(--ink);flex-shrink:0;margin-right:4px;">📊 측정 기준:</span>';
    D.availableDims.forEach(function(d){
      var isDAct = (D.state.univSelectedDimensions || [D.dimension]).includes(d);
      var dLabel = D.dimDisplayNames[d] || d;
      D.dimHtml += 
        '<button type="button" class="u-dim-btn" data-dim="' + d + '" style="flex-shrink:0;padding:4px 10px;border-radius:14px;font-size:.75rem;font-weight:700;cursor:pointer;border:1.5px solid ' + (isDAct ? 'var(--primary, #2563eb)' : 'var(--border, #cbd5e1)') + ';background:' + (isDAct ? 'rgba(37,99,235,0.14)' : 'var(--card2)') + ';color:' + (isDAct ? 'var(--primary, #1d4ed8)' : 'var(--ink)') + ';box-shadow:' + (isDAct ? '0 1px 2px rgba(0,0,0,0.06)' : 'none') + ';transition:all 0.15s ease;">' +
          (isDAct ? '● ' : '○ ') + dLabel +
        '</button>';
    });
    D.dimHtml += '</div>';
  }

  function buildStatsChartHtml(D){
    // 4. 다차원 분석 렌즈별 정밀 데이터 계산 및 인터랙티브 페어 매핑
    D.chartObj = K.renderMultiSeriesSvg(D.seriesMap, { width: 520, height: 210, scaleMode: D.scaleMode, period: D.period });
    var seriesKeys = Object.keys(D.seriesMap || {});
    var allEntityNames = D.ontology.map(function(o){ return o.name; });

    // 상관 효율비 동적 페어 선택기 (Interactive Pair Selector)
    D.selRatioNum = D.state.univRatioNum || allEntityNames[0] || '';
    D.selRatioDen = D.state.univRatioDen || (allEntityNames.length > 1 ? allEntityNames[1] : allEntityNames[0]) || '';
    if(!allEntityNames.includes(D.selRatioNum)) D.selRatioNum = allEntityNames[0] || '';
    if(!allEntityNames.includes(D.selRatioDen)) D.selRatioDen = (allEntityNames.length > 1 ? allEntityNames[1] : allEntityNames[0]) || '';
    D.state.univRatioNum = D.selRatioNum;
    D.state.univRatioDen = D.selRatioDen;

    var sA = D.seriesMap[D.selRatioNum] || (seriesKeys[0] ? D.seriesMap[seriesKeys[0]] : null);
    var sB = D.seriesMap[D.selRatioDen] || (seriesKeys[1] ? D.seriesMap[seriesKeys[1]] : sA);
    D.ratioData = K.computeCrossRatioSeries(sA, sB);
    D.cadenceData = K.computeCadenceData(D.allRecs);

    // 범례 (Legend)
    var legendHtml = '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:6px;padding:2px 4px;">';
    seriesKeys.forEach(function(k, idx){
      var s = D.seriesMap[k];
      var col = D.colors[idx % D.colors.length];
      legendHtml += 
        '<div style="display:flex;align-items:center;gap:4px;font-size:.7rem;font-weight:700;color:var(--ink);">' +
          '<span style="width:8px;height:8px;border-radius:50%;background:' + col + ';display:inline-block;"></span>' +
          '<span>' + s.entity + '</span>' +
          '<span style="color:' + col + ';font-family:monospace;">' + (s.latestVal ? (s.latestVal + (s.unit ? (' ' + s.unit) : '')) : '-') + '</span>' +
        '</div>';
    });
    legendHtml += '</div>';

    D.mainChartContentHtml = '';
    if(D.curLens === 'trend'){
      D.mainChartContentHtml = 
        D.chartObj.svgHtml +
        '<div id="uFloatingInspector" style="display:none;position:absolute;z-index:30;background:rgba(15,23,42,0.95);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.18);color:#fff;padding:8px 12px;border-radius:10px;font-size:.75rem;pointer-events:auto;box-shadow:0 12px 28px -4px rgba(0,0,0,0.48);max-width:215px;">' +
          '<div id="uTipDate" style="font-size:.6875rem;color:#94a3b8;font-family:monospace;"></div>' +
          '<div id="uTipVal" style="font-size:.875rem;font-weight:800;color:#38bdf8;margin:2px 0;"></div>' +
          '<div id="uTipDelta" style="font-size:.6875rem;color:#34d399;"></div>' +
          '<div id="uTipMemo" style="font-size:.6875rem;color:#cbd5e1;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"></div>' +
          '<button type="button" class="btn btn-xs btn-ghost" id="uTipEditBtn" style="margin-top:4px;padding:1px 6px;font-size:.65rem;color:#fff;border:1px solid rgba(255,255,255,0.3);width:100%;">✏️ 이 기록 수정</button>' +
        '</div>' +
        legendHtml;
    } else if(D.curLens === 'ratio'){
      var ratioPairBar = 
        '<div class="u-ratio-pair-bar" style="display:flex;align-items:center;justify-content:space-between;gap:6px;padding:8px 10px;background:var(--card);border-radius:10px;margin-bottom:10px;border:1px solid var(--border);flex-wrap:wrap;">' +
          '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
            '<div style="display:flex;align-items:center;gap:4px;">' +
              '<span style="font-size:.6875rem;font-weight:800;color:var(--primary);font-family:monospace;">분자(A):</span>' +
              '<select id="uRatioNumSelect" style="font-size:.75rem;padding:3px 8px;border-radius:6px;background:var(--card2);color:var(--ink);border:1px solid var(--border);font-weight:700;cursor:pointer;">' +
                allEntityNames.map(function(n){ return '<option value="' + n + '"' + (n === D.selRatioNum ? ' selected' : '') + '>' + n + '</option>'; }).join('') +
              '</select>' +
            '</div>' +
            '<span style="font-size:1rem;font-weight:900;color:var(--ink-soft);user-select:none;">÷</span>' +
            '<div style="display:flex;align-items:center;gap:4px;">' +
              '<span style="font-size:.6875rem;font-weight:800;color:#10b981;font-family:monospace;">분모(B):</span>' +
              '<select id="uRatioDenSelect" style="font-size:.75rem;padding:3px 8px;border-radius:6px;background:var(--card2);color:var(--ink);border:1px solid var(--border);font-weight:700;cursor:pointer;">' +
                allEntityNames.map(function(n){ return '<option value="' + n + '"' + (n === D.selRatioDen ? ' selected' : '') + '>' + n + '</option>'; }).join('') +
              '</select>' +
            '</div>' +
          '</div>' +
          '<div style="font-size:.6875rem;font-weight:800;color:var(--brand);padding:3px 8px;border-radius:12px;background:rgba(139,92,246,0.12);font-family:monospace;">' +
            '효율단위: ' + (D.ratioData ? D.ratioData.unit : '-') +
          '</div>' +
        '</div>';

      D.mainChartContentHtml = 
        ratioPairBar +
        '<div style="padding:4px 0;">' +
          K.renderCrossRatioSvg(D.ratioData, { width: 520, height: 210 }) +
        '</div>';
    } else if(D.curLens === 'radar'){
      D.mainChartContentHtml = 
        '<div style="padding:6px 0;display:flex;justify-content:center;">' +
          K.renderRadarSvg(D.ontology, D.seriesMap, { size: 260 }) +
        '</div>';
    } else if(D.curLens === 'cadence'){
      D.mainChartContentHtml = 
        '<div style="padding:4px 0;">' +
          K.renderCadenceSvg(D.cadenceData, { width: 520, height: 180 }) +
        '</div>';
    }
  }

  function buildStatsKpiHtml(D){
    // 5. 4대 수학적 정량 KPI 바 (PEAK | LATEST | NET DELTA | VELOCITY)
    var seriesArray = Object.values(D.seriesMap);
    var peakStr = '-';
    var latestStr = '-';
    var deltaStr = '-';
    var velocityStr = '-';

    if(D.curLens === 'ratio' && D.ratioData){
      peakStr = (D.ratioData.avgRatio > 0 ? (D.ratioData.avgRatio + ' ' + D.ratioData.unit) : '-');
      var rPts = D.ratioData.points || [];
      latestStr = (rPts.length > 0 ? (rPts[rPts.length - 1].val + ' ' + D.ratioData.unit) : '-');
      deltaStr = rPts.length > 1 ? (Math.round((rPts[rPts.length - 1].val - rPts[0].val)*10)/10 + ' ' + D.ratioData.unit) : '단일 관측';
      velocityStr = D.ratioData.label;
    } else if(D.curLens === 'cadence' && D.cadenceData){
      var sortedC = D.cadenceData.slice().sort(function(a,b){ return b.count - a.count; });
      peakStr = sortedC[0].count > 0 ? (sortedC[0].day + '요일 (' + sortedC[0].pct + '%)') : '-';
      var totSess = D.cadenceData.reduce(function(acc, c){ return acc + c.count; }, 0);
      latestStr = totSess + '회 총 실천';
      deltaStr = '주 7일 분포';
      velocityStr = (Math.round((totSess / 52)*10)/10) + '회/주 평균';
    } else if(seriesArray.length === 1){
      var sSingle = seriesArray[0];
      peakStr = (sSingle.prVal ? (sSingle.prVal.toLocaleString() + ' ' + sSingle.unit) : '-');
      latestStr = (sSingle.latestVal ? (sSingle.latestVal.toLocaleString() + ' ' + sSingle.unit) : '-');
      deltaStr = (sSingle.netDelta !== 0 ? ((sSingle.netDelta > 0 ? '+' : '') + sSingle.netDelta + ' ' + sSingle.unit + ' (' + (sSingle.growthRate > 0 ? '+' : '') + sSingle.growthRate + '%)') : '변동없음');
      velocityStr = (sSingle.velocityPerWeek !== 0 ? ((sSingle.velocityPerWeek > 0 ? '+' : '') + sSingle.velocityPerWeek + ' ' + sSingle.unit + '/주') : '-');
    } else if(seriesArray.length > 1){
      var totalPrSum = 0;
      var totalLatest = 0;
      seriesArray.forEach(function(s){
        if(s.prVal) totalPrSum += s.prVal;
        if(s.latestVal) totalLatest += s.latestVal;
      });
      peakStr = totalPrSum > 0 ? (totalPrSum.toLocaleString() + ' (합계)') : '-';
      latestStr = totalLatest > 0 ? (totalLatest.toLocaleString() + ' (합계)') : '-';
      deltaStr = seriesArray.map(function(s){ return s.entity + ' ' + (s.growthRate > 0 ? '+' : '') + s.growthRate + '%'; }).slice(0, 2).join(' | ');
      velocityStr = seriesArray.length + '개 지표 추적 중';
    }

    // 차트 상단 헤더 (분석 대상 요약 + 기간/스케일 알약)
    var activeEntLabel = (D.mode === 'all' ? '전체 ' + D.ontology.length + '개 종목' : D.activeEntityKeys.join(', '));
    var chartTitleText = '';
    if(D.curLens === 'trend'){
      chartTitleText = activeEntLabel + ' 성장 곡선';
    } else if(D.curLens === 'ratio'){
      chartTitleText = D.selRatioNum + ' / ' + D.selRatioDen + ' 상관 효율비';
    } else if(D.curLens === 'radar'){
      chartTitleText = '종목별 활동 균형도 다각도 레이더';
    } else if(D.curLens === 'cadence'){
      chartTitleText = '요일별 실천 루틴 및 활동 밀도';
    }

    D.chartTitleBar = 
      '<div class="u-chart-title-bar" style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;flex-wrap:wrap;">' +
        '<div style="font-weight:800;font-size:.8125rem;color:var(--ink);display:flex;align-items:center;gap:5px;">' +
          '<span>📊</span><span>' + chartTitleText + '</span>' +
          '<span style="font-size:.7rem;font-weight:600;color:var(--ink-soft);font-family:monospace;">(' + (D.period === 'all' ? '전체' : D.period.toUpperCase()) + ')</span>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
          D.periodHtml +
          (D.curLens === 'trend' ? D.scaleToggleHtml : '') +
          '<button type="button" class="btn btn-ghost btn-xs" id="uBtnGraphFullscreen" title="전체화면(가로) 보기" style="font-size:.75rem;padding:3px 8px;border:1px solid var(--border);border-radius:6px;background:var(--card2);cursor:pointer;display:inline-flex;align-items:center;gap:4px;font-weight:700;color:var(--ink);">' +
            '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
              '<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>' +
            '</svg>' +
            '<span>전체화면</span>' +
          '</button>' +
        '</div>' +
      '</div>';

    D.kpiHtml = 
      '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(78px, 1fr));gap:6px;margin-top:10px;">' +
        '<div class="card" style="padding:8px 6px;margin:0;border-radius:10px;background:var(--card);border:1px solid var(--border);text-align:center;box-shadow:0 1px 2px rgba(0,0,0,0.03);">' +
          '<div style="font-size:.65rem;font-weight:800;color:#f59e0b;font-family:monospace;display:flex;align-items:center;justify-content:center;gap:3px;">' +
            '<span>🏆</span><span>' + (D.curLens === 'ratio' ? 'AVG RATIO' : (D.curLens === 'cadence' ? 'PEAK DAY' : 'PEAK')) + '</span>' +
          '</div>' +
          '<div style="font-size:clamp(0.78rem, 2.2vw, 0.9375rem);font-weight:900;color:var(--primary, #2563eb);margin-top:3px;font-family:monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + peakStr + '</div>' +
        '</div>' +
        '<div class="card" style="padding:8px 6px;margin:0;border-radius:10px;background:var(--card);border:1px solid var(--border);text-align:center;box-shadow:0 1px 2px rgba(0,0,0,0.03);">' +
          '<div style="font-size:.65rem;font-weight:800;color:#0284c7;font-family:monospace;display:flex;align-items:center;justify-content:center;gap:3px;">' +
            '<span>⚡</span><span>' + (D.curLens === 'ratio' ? 'LATEST RATIO' : (D.curLens === 'cadence' ? 'SESSIONS' : 'LATEST')) + '</span>' +
          '</div>' +
          '<div style="font-size:clamp(0.78rem, 2.2vw, 0.9375rem);font-weight:900;color:var(--ink);margin-top:3px;font-family:monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + latestStr + '</div>' +
        '</div>' +
        '<div class="card" style="padding:8px 6px;margin:0;border-radius:10px;background:var(--card);border:1px solid var(--border);text-align:center;box-shadow:0 1px 2px rgba(0,0,0,0.03);">' +
          '<div style="font-size:.65rem;font-weight:800;color:#10b981;font-family:monospace;display:flex;align-items:center;justify-content:center;gap:3px;">' +
            '<span>📈</span><span>' + (D.curLens === 'ratio' ? 'NET SPREAD' : (D.curLens === 'cadence' ? 'PATTERN' : 'NET DELTA')) + '</span>' +
          '</div>' +
          '<div style="font-size:clamp(0.75rem, 2vw, 0.875rem);font-weight:900;color:#10b981;margin-top:3px;font-family:monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + deltaStr + '</div>' +
        '</div>' +
        '<div class="card" style="padding:8px 6px;margin:0;border-radius:10px;background:var(--card);border:1px solid var(--border);text-align:center;box-shadow:0 1px 2px rgba(0,0,0,0.03);">' +
          '<div style="font-size:.65rem;font-weight:800;color:#8b5cf6;font-family:monospace;display:flex;align-items:center;justify-content:center;gap:3px;">' +
            '<span>🚀</span><span>' + (D.curLens === 'ratio' ? 'EFFICIENCY' : (D.curLens === 'cadence' ? 'CADENCE' : 'VELOCITY')) + '</span>' +
          '</div>' +
          '<div style="font-size:clamp(0.75rem, 2vw, 0.875rem);font-weight:900;color:var(--ink);margin-top:3px;font-family:monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + velocityStr + '</div>' +
        '</div>' +
      '</div>';
  }

  function mountStatsDashboardHtml(D){
    // 6. 자율 통계 진단 리포트 (Visual Executive Briefing Card)
    var diagReportVisual = K.generateStatisticalDiagnosticReport(D.seriesMap, D.cadenceData, (D.curLens === 'ratio' ? D.ratioData : null), { asHtml: true });
    var aiReportHtml = 
      '<div class="card u-ai-briefing-card" style="margin-top:12px;padding:12px 14px;background:linear-gradient(135deg,rgba(37,99,235,0.05),rgba(139,92,246,0.06));border:1px solid rgba(139,92,246,0.22);border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.04);">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:6px;">' +
          '<div style="font-weight:800;font-size:.8125rem;color:var(--brand);display:flex;align-items:center;gap:6px;">' +
            '<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#10b981;box-shadow:0 0 6px #10b981;"></span>' +
            '<span>✨ Gemini 3.1 Flash Lite 자율 다차원 통계 진단 브리핑</span>' +
          '</div>' +
        '</div>' +
        '<div style="font-size:.78125rem;color:var(--ink);line-height:1.6;">' +
          diagReportVisual +
        '</div>' +
      '</div>';

    // 전체 바디 조립 (3단 레이아웃 완비)
    var bodyHtml = 
      '<div id="uCockpitBody" style="display:' + (D.isExpanded ? 'block' : 'none') + ';padding-top:10px;">' +
        D.quickGuideHtml +
        D.lensHtml +
        D.lensExpBannerHtml +
        D.chipsTitleHtml +
        D.chipsHtml +
        (D.curLens === 'trend' ? D.dimHtml : '') +
        D.chartTitleBar +
        '<div id="uChartContainerWrapper" style="position:relative;background:var(--card2);padding:10px 6px;border-radius:10px;border:1px solid var(--border);">' +
          D.mainChartContentHtml +
        '</div>' +
        D.kpiHtml +
        aiReportHtml +
      '</div>';

    D.container.innerHTML = 
      '<div class="card" id="uCockpitMainCard" style="padding:10px 12px;border-radius:14px;background:var(--card);border:1px solid var(--border);margin-bottom:12px;">' +
        D.headerHtml +
        bodyHtml +
      '</div>';
  }

  K.buildStatsHeaderHtml = buildStatsHeaderHtml;
  K.buildStatsLensControlsHtml = buildStatsLensControlsHtml;
  K.buildStatsEntityChipsHtml = buildStatsEntityChipsHtml;
  K.buildStatsChartHtml = buildStatsChartHtml;
  K.buildStatsKpiHtml = buildStatsKpiHtml;
  K.mountStatsDashboardHtml = mountStatsDashboardHtml;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : global);
