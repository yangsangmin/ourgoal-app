/**
 * OurGoal Growth Chart (기록 — 성장 차트·영역 필터)
 *
 * 기록 성장 차트와 테마 필터 책임. 테마 수정 창은 다음 도달 검증까지 원래 자리.
 * #TASK-ES-568(잔여 책임 분열 — 교대근무 루틴·성장차트·홈 퀘스트): index.html 인라인 IIFE 의 구간(이전 전 7155~7237 · 7238~7347 · 7348~7377줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalRecordsKit = global.OurgoalRecordsKit || {};

  /* ---- 이전 전 index.html 7155~7237줄(#TASK-ES-568 생성기 표지) ---- */
  function renderColdstartRadarPreviewSvg(recCount){
    recCount = Math.min(2, Math.max(0, recCount || 0));
    var w = 320;
    var h = 240;
    var cx = 160;
    var cy = 115;
    var radius = 72;

    var axes = [
      { name: '체력 🏃', sub: '운동' },
      { name: '지식 📚', sub: '학습' },
      { name: '마음 🧘', sub: '회고' },
      { name: '관계 🤝', sub: '소통' },
      { name: '커리어 💼', sub: '성취' },
      { name: '루틴 ⏰', sub: '습관' }
    ];

    var n = 6;
    var angleStep = (Math.PI * 2) / n;

    var svg = '<svg viewBox="0 0 ' + w + ' ' + h + '" style="width:100%;max-width:320px;height:auto;margin:0 auto;display:block;">';
    svg += '<defs>' +
      '<linearGradient id="coldstartRadarGrad" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0%" stop-color="#6366f1" stop-opacity="0.25"/>' +
        '<stop offset="100%" stop-color="#a855f7" stop-opacity="0.12"/>' +
      '</linearGradient>' +
      '<filter id="glowNode" x="-50%" y="-50%" width="200%" height="200%">' +
        '<feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#6366f1" flood-opacity="0.8"/>' +
      '</filter>' +
    '</defs>';

    // 동심원 6각 가이드 격자 (33%, 66%, 100%)
    [0.33, 0.66, 1.0].forEach(function(lvl){
      var rL = radius * lvl;
      var gPts = [];
      for(var i = 0; i < n; i++){
        var a = i * angleStep - Math.PI / 2;
        gPts.push((cx + rL * Math.cos(a)).toFixed(1) + ',' + (cy + rL * Math.sin(a)).toFixed(1));
      }
      svg += '<polygon points="' + gPts.join(' ') + '" fill="none" stroke="var(--rule, #e2e8f0)" stroke-width="' + (lvl === 1.0 ? '1.5' : '1') + '" stroke-dasharray="' + (lvl < 1.0 ? '3,3' : 'none') + '"/>';
    });

    // 6개 방사형 축 선 및 라벨
    for(var i = 0; i < n; i++){
      var a = i * angleStep - Math.PI / 2;
      var ax = cx + radius * Math.cos(a);
      var ay = cy + radius * Math.sin(a);
      svg += '<line x1="' + cx + '" y1="' + cy + '" x2="' + ax.toFixed(1) + '" y2="' + ay.toFixed(1) + '" stroke="var(--rule, #e2e8f0)" stroke-width="1"/>';

      var lx = cx + (radius + 22) * Math.cos(a);
      var ly = cy + (radius + 22) * Math.sin(a);
      var anchor = (Math.abs(Math.cos(a)) < 0.2) ? 'middle' : (Math.cos(a) > 0 ? 'start' : 'end');
      svg += '<text x="' + lx.toFixed(1) + '" y="' + (ly + 4).toFixed(1) + '" text-anchor="' + anchor + '" font-size="10" font-weight="700" fill="var(--ink, #1e293b)">' + axes[i].name + '</text>';
    }

    // 미래의 100% 목표 다각형 (파스텔 그라디언트 + 점선 보더)
    var targetPts = [];
    for(var i = 0; i < n; i++){
      var a = i * angleStep - Math.PI / 2;
      var px = cx + (radius * 0.85) * Math.cos(a);
      var py = cy + (radius * 0.85) * Math.sin(a);
      targetPts.push(px.toFixed(1) + ',' + py.toFixed(1));
    }
    svg += '<polygon points="' + targetPts.join(' ') + '" fill="url(#coldstartRadarGrad)" stroke="rgba(99,102,241,0.5)" stroke-width="1.8" stroke-dasharray="4,3"/>';

    // 꼭짓점 노드 (recCount에 따라 점등)
    for(var i = 0; i < n; i++){
      var pt = targetPts[i].split(',');
      var x = parseFloat(pt[0]);
      var y = parseFloat(pt[1]);
      var isLit = (i < recCount);

      if(isLit){
        svg += '<circle cx="' + x + '" cy="' + y + '" r="6" fill="#6366f1" filter="url(#glowNode)"/>';
        svg += '<circle cx="' + x + '" cy="' + y + '" r="3" fill="#ffffff"/>';
      } else {
        svg += '<circle cx="' + x + '" cy="' + y + '" r="3.5" fill="var(--card, #ffffff)" stroke="#6366f1" stroke-width="1.5"/>';
      }
    }

    svg += '</svg>';
    return svg;
  }
  /* ---- 이전 전 index.html 7238~7347줄(#TASK-ES-568 생성기 표지) ---- */

  function renderLifeBalanceWheel(allRecs){
    var box = document.getElementById('lifeBalanceBox');
    var feedSlot = document.getElementById('recFeedColdstartRadarSlot');
    allRecs = allRecs || [];

    // [TASK-ES-137] 콜드스타트 (기록 0~2개): 피드 상단 및 밸런스 슬라이드에 3일 실천 완성 레이더 차트 미리보기 인포그래픽 노출
    if(allRecs.length < 3){
      var count = allRecs.length;
      var guideText = count === 0
        ? '오늘 첫 실천을 기록하면 첫 번째 꼭짓점이 빛나기 시작해요! (3일 실천 시 100% 활성화)'
        : (count === 1
          ? '멋져요! 1회 실천으로 첫 번째 꼭짓점이 켜졌어요! 2일 더 실천하면 6각 차트가 완전 개통됩니다. (+1 실천 시 33% 달성)'
          : '거의 다 왔어요! 2회 실천 달성! 1회만 더 기록하면 나만의 6각 성장 차트가 완전 개통됩니다. (+1 실천 시 66% 달성)');
      var pct = Math.round((count / 3) * 100);

      var cardHtml =
        '<div class="balance-card coldstart-radar-preview-card" id="coldstartRadarPreviewCard" style="padding:16px;background:var(--card);border:1px solid var(--rule);border-radius:18px;margin-bottom:12px;position:relative;overflow:hidden;">' +
          '<div class="balance-head" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
            '<div style="font-weight:800;font-size:.9375rem;color:var(--ink);display:flex;align-items:center;gap:6px;">' +
              '<span>💡</span><span>3일 뒤 완성될 나의 6각 성장 차트</span>' +
            '</div>' +
            '<span class="dday-pill" style="font-size:.6875rem;font-weight:700;background:rgba(99,102,241,0.12);color:var(--brand-strong);">비전 미리보기</span>' +
          '</div>' +
          '<p style="font-size:.78rem;color:var(--ink-soft);margin:0 0 12px;line-height:1.45;">' + guideText + '</p>' +
          '<div class="coldstart-radar-svg-wrap" style="text-align:center;padding:4px 0;">' +
            renderColdstartRadarPreviewSvg(count) +
          '</div>' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:12px;margin-bottom:12px;padding:10px 12px;background:var(--surface-2);border-radius:12px;font-size:.75rem;">' +
            '<span style="color:var(--ink);font-weight:700;">실천 로드맵: <b>' + count + ' / 3회 달성</b></span>' +
            '<span style="color:var(--brand-strong);font-weight:800;">' + pct + '% 진행 중</span>' +
          '</div>' +
          '<button class="btn-coldstart-record" id="btnColdstartCreateRecord" type="button">' +
            '✍️ 오늘 첫 실천 기록하기 (+10 EXP)' +
          '</button>' +
        '</div>';

      if(feedSlot){
        feedSlot.innerHTML = cardHtml;
        feedSlot.style.display = 'block';
        var feedBtn = feedSlot.querySelector('#btnColdstartCreateRecord');
        if(feedBtn){
          feedBtn.addEventListener('click', function(){
            if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
            if(typeof L.openRecordModal === 'function'){
              L.openRecordModal();
            } else if(typeof L.switchTab === 'function'){
              L.switchTab('home');
              var inp = document.getElementById('checkinInput');
              if(inp){ inp.focus(); inp.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
            }
          });
        }
      }

      if(box){
        box.innerHTML = cardHtml.replace('id="coldstartRadarPreviewCard"', 'id="coldstartRadarPreviewCardInBox"').replace('id="btnColdstartCreateRecord"', 'id="btnColdstartCreateRecordInBox"');
        var boxBtn = box.querySelector('#btnColdstartCreateRecordInBox');
        if(boxBtn){
          boxBtn.addEventListener('click', function(){
            if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
            if(typeof L.openRecordModal === 'function'){
              L.openRecordModal();
            } else if(typeof L.switchTab === 'function'){
              L.switchTab('home');
              var inp = document.getElementById('checkinInput');
              if(inp){ inp.focus(); inp.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
            }
          });
        }
      }
      return;
    } else {
      if(feedSlot){
        feedSlot.innerHTML = '';
        feedSlot.style.display = 'none';
      }
    }
    var wheelData = (typeof OurgoalRecordsStats !== 'undefined')
      ? OurgoalRecordsStats.renderLifeBalancePieSvg(allRecs, L.RECORD_THEMES)
      : { svgHtml: '', thData: [], total: 0 };

    var legendHtml = wheelData.thData.map(function(item){
      var isSelected = (L.state.selectedRecordTheme === item.key);
      return '<div class="balance-leg-item'+(isSelected?' active':'')+'" data-themefilter="'+item.key+'" style="cursor:pointer;'+(isSelected?'font-weight:700;color:var(--ink);':'')+'">' +
        '<span class="balance-dot" style="background-color:'+item.color+';"></span>' +
        '<span>'+item.icon+' '+item.label+' <b style="">'+item.pct+'%</b> ('+item.count+')</span>' +
      '</div>';
    }).join('');

    box.innerHTML =
      '<div class="balance-card">' +
        '<div class="balance-head">' +
          '<b>원형 라이프 밸런스 휠</b>' +
          '<span>총 ' + wheelData.total + '개 기록 분포</span>' +
        '</div>' +
        '<div class="balance-pie-container" style="padding:10px 0 14px;text-align:center;">' +
          wheelData.svgHtml +
        '</div>' +
        '<div class="balance-legend">' + legendHtml + '</div>' +
      '</div>';

    box.querySelectorAll('[data-themefilter]').forEach(function(el){
      el.addEventListener('click', function(){
        var target = el.dataset.themefilter;
        L.state.selectedRecordTheme = (L.state.selectedRecordTheme === target) ? 'all' : target;
        L.renderRecordsScreen();
      });
    });
  }
  /* ---- 이전 전 index.html 7348~7377줄(#TASK-ES-568 생성기 표지) ---- */

  function renderRecordThemeFilters(){
    var wrap = document.getElementById('recThemeFilters');
    if(!wrap || typeof L.RECORD_THEMES === 'undefined') return;
    var themes = [
      { key:'all', label:'전체', icon:'✨' },
      L.RECORD_THEMES.mind,
      L.RECORD_THEMES.study,
      L.RECORD_THEMES.business,
      L.RECORD_THEMES.schedule,
      L.RECORD_THEMES.workout,
      L.RECORD_THEMES.daily
    ];

    var curTheme = L.state.selectedRecordTheme || 'all';
    var html = themes.map(function(t){
      var active = (curTheme === t.key);
      return '<button class="theme-filter-chip'+(active?' active':'')+'" type="button" data-filter="'+t.key+'">' +
        t.icon + ' ' + t.label +
      '</button>';
    }).join('');
    wrap.innerHTML = html;

    wrap.querySelectorAll('[data-filter]').forEach(function(btn){
      btn.addEventListener('click', function(){
        L.state.selectedRecordTheme = btn.dataset.filter;
        L.renderRecordsScreen();
      });
    });
  }

  K.renderColdstartRadarPreviewSvg = renderColdstartRadarPreviewSvg;
  K.renderLifeBalanceWheel = renderLifeBalanceWheel;
  K.renderRecordThemeFilters = renderRecordThemeFilters;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
