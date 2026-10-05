/**
 * OurGoal Records Weekly Recap (기록 탭 — 위클리 리캡 카드·기록 추가 창·기록 탭 정적 단추 처리기)
 *
 * 위클리 리캡 카드 그림·창(fitBigFont · generateWeeklyRecapImage · findBestMoment · openWeeklyRecapModal · openLegacyRecapCanvasModal) · 기록 추가 창(openRecordModal).
 * 기록 탭 로드 중 처리기 등록 문 다섯 개(시간 기록 단추 · 세그먼트 막대 · 미니 펄스 막대 · 캐러셀 알약 · 문서 위임 클릭)는 bindRecTimeTrackerBtn · bindRecSegmentBar · bindRecPulseBar · bindRecCarouselPills · bindRecDocumentClick 으로 감싸 index.html 원래 자리에서 부른다(등록 순서 보존, 이중 처리기 0).
 * 한 줄 등록 문 세 개와 상태 변수(btnOpenTt · staticPulseBar)는 원래 자리에 있다. weeklyRecapStats 는 smoke-test FN_NAMES 함수 — smoke-test 가 인라인 합본(js/tabs 세포 포함)에서 잘라 가므로(#TASK-ES-465) 같이 옮겼다.
 * #TASK-ES-474(인라인 어려움 묶음 시범): index.html 인라인 IIFE 의 구간(이전 전 18326~18343 · 18344~18352 · 18353~18433 · 18434~18458 · 18459~18572 · 18573~18716 · 18717~18813 · 18816~18822 · 18825~18832 · 18834~18839 · 18840~18845 · 18846~18935줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 18326~18343줄(#TASK-ES-474 생성기 표지) ---- */
  function weeklyRecapStats(records, now){
    now = now || new Date();
    var weekAgo = new Date(now.getTime() - 7*86400000);
    var count = 0, totalMs = 0;
    var catTotals = {};
    (records || []).forEach(function(r){
      var start = new Date(r.startAt);
      if(isNaN(start.getTime()) || start < weekAgo || start > now) return;
      count++;
      if(r.endAt){
        var ms = new Date(r.endAt) - start;
        if(ms > 0) totalMs += ms;
        if(r.category) catTotals[r.category] = (catTotals[r.category] || 0) + ms;
      }
    });
    var topCategory = Object.keys(catTotals).sort(function(a,b){ return catTotals[b]-catTotals[a]; })[0] || null;
    return { count: count, totalMs: totalMs, topCategory: topCategory, topCategoryMs: topCategory ? catTotals[topCategory] : 0 };
  }
  /* ---- 이전 전 index.html 18344~18352줄(#TASK-ES-474 생성기 표지) ---- */
  function fitBigFont(ctx, text, maxWidth, baseSize, weight){
    var size = baseSize;
    ctx.font = weight+' '+Math.round(size)+'px "Noto Sans KR",sans-serif';
    while(ctx.measureText(text).width > maxWidth && size > baseSize*0.4){
      size -= 2;
      ctx.font = weight+' '+Math.round(size)+'px "Noto Sans KR",sans-serif';
    }
    return size;
  }
  /* ---- 이전 전 index.html 18353~18433줄(#TASK-ES-474 생성기 표지) ---- */
  async function generateWeeklyRecapImage(stats, streakDays, options){
    options = Object.assign({
      includeCount: true,
      includeDuration: true,
      includeStreak: true,
      includeTopCategory: true,
      includeKeyGoal: true,
      includeProfileDate: true
    }, options || {});

    if(document.fonts && document.fonts.ready){ try{ await document.fonts.ready; } catch(e){} }
    var dims = { w:720, h:960 };
    var canvas = document.createElement('canvas');
    canvas.width = dims.w; canvas.height = dims.h;
    var ctx = canvas.getContext('2d');

    ctx.fillStyle = '#14162B';
    ctx.fillRect(0,0,dims.w,dims.h);

    var pad = Math.round(dims.w*0.09);
    var innerW = dims.w - pad*2;
    var y = pad + dims.w*0.04;

    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,.6)';
    ctx.font = '700 ' + Math.round(dims.w*0.032) + 'px "Noto Sans KR",sans-serif';
    ctx.fillText('아워골 위클리 리캡', pad, y);
    y += dims.w*0.09;

    var items = [];
    if(options.includeCount){
      items.push({ value: stats.count+'번', label: '이번 주 기록했어요', color: '#FF4F64' });
    }
    if(options.includeDuration){
      items.push({ value: L.fmtDuration(stats.totalMs), label: '이번 주 총 몰입 시간', color: '#FF9F1C' });
    }
    if(options.includeStreak){
      items.push({ value: streakDays+'일', label: '연속 기록 스트릭', color: '#1FC98E' });
    }
    if(options.includeTopCategory && stats.topCategory && typeof L.TOPICS !== 'undefined' && L.TOPICS[stats.topCategory]){
      items.push({ value: L.TOPICS[stats.topCategory].icon+' '+L.TOPICS[stats.topCategory].label, label: '이번 주 가장 많이 한 분야', color: '#6C5CE7' });
    }
    if(options.includeKeyGoal && L.state.profile && L.state.profile.goals && L.state.profile.goals.length > 0){
      var activeGoal = L.state.profile.goals.find(function(g){ return !g.archivedAt; }) || L.state.profile.goals[0];
      if(activeGoal && activeGoal.title){
        items.push({ value: activeGoal.title, label: '도전 중인 주요 목표', color: '#3DBFCF' });
      }
    }

    var itemCount = Math.max(1, items.length);
    var availableHeight = dims.h - y - (options.includeProfileDate ? dims.w*0.22 : dims.w*0.12);
    var itemSlotHeight = availableHeight / itemCount;
    var baseFontSize = Math.min(dims.w*0.13, itemSlotHeight * 0.45);

    function bigStat(value, label, color){
      var size = fitBigFont(ctx, value, innerW, baseFontSize, '900');
      ctx.fillStyle = color;
      ctx.fillText(value, pad, y);
      y += size * 0.72;
      ctx.fillStyle = 'rgba(255,255,255,.72)';
      ctx.font = '600 ' + Math.round(Math.min(dims.w*0.034, size * 0.35)) + 'px "Noto Sans KR",sans-serif';
      ctx.fillText(label, pad, y);
      y += (itemSlotHeight - size * 0.72);
    }

    items.forEach(function(it){
      bigStat(it.value, it.label, it.color);
    });

    if(options.includeProfileDate){
      ctx.globalAlpha = .55;
      ctx.fillStyle = '#fff';
      ctx.font = '500 ' + Math.round(dims.w*0.026) + 'px "Noto Sans KR",sans-serif';
      ctx.fillText((L.state.profile.displayName||'나의 성장')+' · '+L.dateKey(L.nowISO()), pad, dims.h - pad*0.6 - dims.w*0.09);
      ctx.globalAlpha = 1;
    }
    ctx.textAlign = 'left';

    L.drawShareWatermark(ctx, dims, L.state.profile.id, '#fff');
    return canvas;
  }
  /* ---- 이전 전 index.html 18434~18458줄(#TASK-ES-474 생성기 표지) ---- */

  /* [#TASK-ES-336] 팩트 기반 최근 7일 베스트 실천 1선 자동 추출 알고리즘 (사진 > 몰입시간 > 글자수) */
  function findBestMoment(records, now){
    now = now || new Date();
    var weekAgo = new Date(now.getTime() - 7*86400000);
    var weekRecs = (records || []).filter(function(r){
      if(!r) return false;
      var start = new Date(r.startAt || r.date || r.createdAt);
      return !isNaN(start.getTime()) && start >= weekAgo && start <= now;
    });
    if(!weekRecs.length) return null;
    return weekRecs.slice().sort(function(a, b){
      var aPhoto = a.photo ? 1 : 0;
      var bPhoto = b.photo ? 1 : 0;
      if(bPhoto !== aPhoto) return bPhoto - aPhoto;

      var aDur = (a.endAt && a.startAt) ? (new Date(a.endAt) - new Date(a.startAt)) : 0;
      var bDur = (b.endAt && b.startAt) ? (new Date(b.endAt) - new Date(b.startAt)) : 0;
      if(bDur !== aDur) return bDur - aDur;

      var aLen = (a.text || a.note || '').length;
      var bLen = (b.text || b.note || '').length;
      return bLen - aLen;
    })[0];
  }
  /* ---- 이전 전 index.html 18459~18572줄(#TASK-ES-474 생성기 표지) ---- */

  /* [#TASK-ES-336] 초경량 위클리 리캡 3초 요약 카드 모달 */
  async function openWeeklyRecapModal(){
    var allRecs = (L.state && L.state.profile && L.state.profile.records) || [];
    var stats = weeklyRecapStats(allRecs);
    var streakDays = typeof L.computeStreakDays === 'function' ? L.computeStreakDays() : 0;
    var bestMoment = findBestMoment(allRecs);

    var bestMomentHtml = '';
    if(bestMoment){
      var bPhotoHtml = bestMoment.photo
        ? '<div style="margin-right:12px;flex:0 0 56px;height:56px;border-radius:10px;overflow:hidden;border:1px solid var(--rule);flex-shrink:0;"><img src="' + L.escapeHtml(bestMoment.photo) + '" style="width:100%;height:100%;object-fit:cover;" alt="베스트 실천 사진"></div>'
        : '<div style="margin-right:12px;flex:0 0 48px;height:48px;border-radius:10px;background:var(--card2);display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex-shrink:0;">🌟</div>';
      var bTitle = L.escapeHtml(bestMoment.text || bestMoment.note || '소중한 실천 기록');
      var bDur = (bestMoment.endAt && bestMoment.startAt) ? (new Date(bestMoment.endAt) - new Date(bestMoment.startAt)) : 0;
      var bMeta = (bDur > 0 ? (L.fmtDuration(bDur) + ' 몰입 · ') : '') + (bestMoment.category && typeof L.TOPICS !== 'undefined' && L.TOPICS[bestMoment.category] ? (L.TOPICS[bestMoment.category].label + ' · ') : '') + (bestMoment.startAt ? L.dateKey(bestMoment.startAt).slice(5) : '이번 주');

      bestMomentHtml =
        '<div id="recapBestMomentCard" style="background:var(--card2);border:1px solid var(--rule);border-radius:14px;padding:12px;margin-bottom:14px;text-align:left;cursor:pointer;transition:border-color .15s;" title="클릭하여 상세 기록 보기">' +
          '<div style="font-size:.75rem;font-weight:700;color:var(--brand);margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;">' +
            '<span>🌟 이번 주 가장 빛난 실천</span>' +
            '<span style="font-size:.6875rem;font-weight:normal;color:var(--ink-faint);">상세보기 &gt;</span>' +
          '</div>' +
          '<div style="display:flex;align-items:center;">' +
            bPhotoHtml +
            '<div style="flex:1;min-width:0;">' +
              '<div style="font-size:.875rem;font-weight:700;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + bTitle + '</div>' +
              '<div style="font-size:.75rem;color:var(--ink-faint);margin-top:2px;">' + bMeta + '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
    } else {
      bestMomentHtml =
        '<div style="background:var(--card2);border:1px solid var(--rule);border-radius:14px;padding:16px;margin-bottom:14px;text-align:center;">' +
          '<div style="font-size:1.5rem;margin-bottom:6px;">🌱</div>' +
          '<div style="font-size:.8125rem;color:var(--ink-faint);">이번 주 기록이 아직 없어요 · 첫 발자국을 남겨보세요</div>' +
        '</div>';
    }

    var modalHtml =
      '<div style="text-align:center;position:relative;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
          '<div style="font-size:1rem;font-weight:800;color:var(--ink);display:flex;align-items:center;gap:6px;">' +
            '<span>🐾 이번 주 나의 실천 리캡</span>' +
          '</div>' +
          '<button type="button" class="icon-btn" id="btnRecapTopClose" aria-label="닫기" style="font-size:1.2rem;line-height:1;padding:4px 8px;cursor:pointer;">×</button>' +
        '</div>' +
        '<p style="text-align:left;margin:0 0 14px;font-size:.8125rem;color:var(--ink-faint);line-height:1.4;">' +
          '한 주 동안 차분히 쌓아올린 발자국이에요. 내가 나를 위해 쓴 시간들을 돌아보세요.' +
        '</p>' +

        '<!-- 3대 팩트 지표 카드 -->' +
        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px;">' +
          '<div style="background:var(--card2);border:1px solid var(--rule);border-radius:12px;padding:10px 4px;text-align:center;">' +
            '<div style="font-size:1.15rem;font-weight:900;color:var(--brand);">' + (stats.count || 0) + '회</div>' +
            '<div style="font-size:.6875rem;color:var(--ink-faint);margin-top:2px;">주간 실천</div>' +
          '</div>' +
          '<div style="background:var(--card2);border:1px solid var(--rule);border-radius:12px;padding:10px 4px;text-align:center;">' +
            '<div style="font-size:1.15rem;font-weight:900;color:#FF9F1C;">' + L.fmtDuration(stats.totalMs || 0) + '</div>' +
            '<div style="font-size:.6875rem;color:var(--ink-faint);margin-top:2px;">몰입 시간</div>' +
          '</div>' +
          '<div style="background:var(--card2);border:1px solid var(--rule);border-radius:12px;padding:10px 4px;text-align:center;">' +
            '<div style="font-size:1.15rem;font-weight:900;color:#10b981;">' + (streakDays || 0) + '일</div>' +
            '<div style="font-size:.6875rem;color:var(--ink-faint);margin-top:2px;">연속 스트릭</div>' +
          '</div>' +
        '</div>' +

        bestMomentHtml +

        '<!-- 하단 액션 -->' +
        '<div style="display:flex;gap:8px;">' +
          '<button type="button" class="btn btn-primary" id="btnRecapFeedGo" style="flex:1;font-weight:700;padding:10px 14px;border-radius:12px;min-height:44px;touch-action:manipulation;display:inline-flex;align-items:center;justify-content:center;">' +
            '기록 피드 보러가기' +
          '</button>' +
          '<button type="button" class="btn btn-ghost" id="btnRecapOpenCanvas" style="font-size:.8125rem;padding:10px 12px;border-radius:12px;border:1px solid var(--rule);color:var(--ink-soft);min-height:44px;touch-action:manipulation;display:inline-flex;align-items:center;justify-content:center;">' +
            '🎨 카드 공유' +
          '</button>' +
        '</div>' +
      '</div>';

    L.openModal(modalHtml, function(sheet){
      var closeTop = sheet.querySelector('#btnRecapTopClose');
      if(closeTop) closeTop.onclick = function(){ L.closeModal(); };

      var feedGo = sheet.querySelector('#btnRecapFeedGo');
      if(feedGo){
        feedGo.onclick = function(){
          if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
          L.closeModal();
          if(typeof L.setRecordsSegment === 'function'){
            L.setRecordsSegment('feed');
          } else if(typeof L.switchTab === 'function'){
            L.switchTab('records');
          }
        };
      }

      var bestCard = sheet.querySelector('#recapBestMomentCard');
      if(bestCard && bestMoment){
        bestCard.onclick = function(){
          L.closeModal();
          if(typeof openRecordModal === 'function') openRecordModal(bestMoment);
        };
      }

      var canvasBtn = sheet.querySelector('#btnRecapOpenCanvas');
      if(canvasBtn){
        canvasBtn.onclick = function(){
          L.closeModal();
          openLegacyRecapCanvasModal();
        };
      }
    });
  }
  /* ---- 이전 전 index.html 18573~18716줄(#TASK-ES-474 생성기 표지) ---- */

  /* 기존 스포티파이 랩드 스타일 공유 캔버스 생성 모달 보존 */
  async function openLegacyRecapCanvasModal(){
    var allRecs = (L.state && L.state.profile && L.state.profile.records) || [];
    var stats = weeklyRecapStats(allRecs);
    var streakDays = typeof L.computeStreakDays === 'function' ? L.computeStreakDays() : 0;
    if(!stats.count){ L.toast('이번 주 기록이 아직 없어요 · 먼저 기록을 남겨보세요'); return; }

    var currentOptions = {
      includeCount: true,
      includeDuration: true,
      includeStreak: true,
      includeTopCategory: true,
      includeKeyGoal: true,
      includeProfileDate: true
    };

    var currentDataUrl = null;

    L.openModal(
      '<h3 style="text-align:center;margin:0 0 4px;">이번 주 위클리 리캡</h3>' +
      '<p class="muted" style="text-align:center;margin:0 0 12px;font-size:.8125rem;">이번 주 기록을 카드 한 장으로 모았어요</p>' +

      '<div style="background:var(--card2);border:1px solid var(--rule);border-radius:12px;padding:10px 12px;margin-bottom:12px;">' +
        '<div style="font-size:.8125rem;font-weight:700;color:var(--ink);margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;">' +
          '<span>카드에 포함할 정보 선택</span>' +
          '<span class="faint" style="font-size:.6875rem;font-weight:normal;">실시간 반영</span>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px;" id="recapOptionsGrid">' +
          '<label style="display:flex;align-items:center;gap:6px;font-size:.8125rem;cursor:pointer;user-select:none;">' +
            '<input type="checkbox" id="recapOptCount" checked>기록 횟수' +
          '</label>' +
          '<label style="display:flex;align-items:center;gap:6px;font-size:.8125rem;cursor:pointer;user-select:none;">' +
            '<input type="checkbox" id="recapOptDuration" checked>몰입 시간' +
          '</label>' +
          '<label style="display:flex;align-items:center;gap:6px;font-size:.8125rem;cursor:pointer;user-select:none;">' +
            '<input type="checkbox" id="recapOptStreak" checked>연속 스트릭' +
          '</label>' +
          '<label style="display:flex;align-items:center;gap:6px;font-size:.8125rem;cursor:pointer;user-select:none;">' +
            '<input type="checkbox" id="recapOptTopCat" checked>최다 분야' +
          '</label>' +
          '<label style="display:flex;align-items:center;gap:6px;font-size:.8125rem;cursor:pointer;user-select:none;">' +
            '<input type="checkbox" id="recapOptKeyGoal" checked>주요 목표' +
          '</label>' +
          '<label style="display:flex;align-items:center;gap:6px;font-size:.8125rem;cursor:pointer;user-select:none;">' +
            '<input type="checkbox" id="recapOptProfile" checked>닉네임·날짜' +
          '</label>' +
        '</div>' +
      '</div>' +

      '<div id="recapImgContainer" style="position:relative;text-align:center;min-height:300px;display:flex;align-items:center;justify-content:center;">' +
        '<div id="recapImgWrap" style="color:var(--ink-faint);padding:60px 0;">카드 만드는 중…</div>' +
      '</div>' +
      '<div class="modal-actions" style="margin-top:12px;">' +
        '<button class="btn btn-primary" id="recapShareBtn" type="button" disabled>공유하기</button>' +
        '<button class="btn btn-ghost" id="recapSaveBtn" type="button" disabled>이미지 저장</button>' +
      '</div>',
      function(sheet){
        async function updateCard(){
          var shareBtn = sheet.querySelector('#recapShareBtn');
          var saveBtn = sheet.querySelector('#recapSaveBtn');
          if(shareBtn) shareBtn.disabled = true;
          if(saveBtn) saveBtn.disabled = true;

          var canvas = await generateWeeklyRecapImage(stats, streakDays, currentOptions);
          currentDataUrl = canvas.toDataURL('image/png');
          var container = sheet.querySelector('#recapImgContainer');
          if(!container) return;
          container.innerHTML = '<img id="recapImgWrap" src="'+currentDataUrl+'" alt="위클리 리캡 카드" style="width:100%;border-radius:16px;display:block;">';

          if(shareBtn) shareBtn.disabled = false;
          if(saveBtn) saveBtn.disabled = false;
        }

        var optKeys = [
          { id: '#recapOptCount', key: 'includeCount' },
          { id: '#recapOptDuration', key: 'includeDuration' },
          { id: '#recapOptStreak', key: 'includeStreak' },
          { id: '#recapOptTopCat', key: 'includeTopCategory' },
          { id: '#recapOptKeyGoal', key: 'includeKeyGoal' },
          { id: '#recapOptProfile', key: 'includeProfileDate' }
        ];

        optKeys.forEach(function(item){
          var chk = sheet.querySelector(item.id);
          if(chk){
            chk.onchange = function(){
              var anyChecked = optKeys.some(function(k){ var el = sheet.querySelector(k.id); return el && el.checked; });
              if(!anyChecked){
                chk.checked = true;
                L.toast('최소 1개 이상의 정보는 포함되어야 합니다');
                return;
              }
              currentOptions[item.key] = chk.checked;
              updateCard();
            };
          }
        });

        var shareBtn = sheet.querySelector('#recapShareBtn');
        var saveBtn = sheet.querySelector('#recapSaveBtn');

        if(shareBtn){
          shareBtn.onclick = async function(){
            if(!currentDataUrl) return;
            var parts = [];
            if(currentOptions.includeCount) parts.push(stats.count + '번 기록');
            if(currentOptions.includeDuration) parts.push('총 ' + L.fmtDuration(stats.totalMs) + ' 몰입');
            if(currentOptions.includeStreak) parts.push(streakDays + '일 연속');
            var text = '아워골 이번 주 위클리 리캡' + (parts.length ? (' · ' + parts.join(', ')) : '') + '! 🔥' + L.buildInviteLinkSuffix();
            try{
              var blob = await (await fetch(currentDataUrl)).blob();
              var file = new File([blob], 'ourgoal-weekly-recap.png', { type:'image/png' });
              if(navigator.canShare && navigator.canShare({ files:[file] })){
                await navigator.share({ files:[file], title:'아워골', text: text });
                L.toast('공유했어요');
              } else if(navigator.share){
                await navigator.share({ title:'아워골', text: text });
                L.toast('이 기기는 이미지 공유를 지원하지 않아 문구로 공유했어요 · 이미지는 저장 버튼을 써주세요');
              } else if(navigator.clipboard){
                await navigator.clipboard.writeText(text);
                L.toast('공유 문구를 복사했어요 · 이미지는 저장 버튼으로 받아주세요');
              } else {
                L.toast('이미지 저장 버튼으로 받아서 직접 공유해주세요');
              }
            } catch(e){ /* 사용자가 공유 시트를 취소함 */ }
          };
        }

        if(saveBtn){
          saveBtn.onclick = function(){
            if(!currentDataUrl) return;
            var a = document.createElement('a');
            a.href = currentDataUrl;
            a.download = '아워골_위클리리캡.png';
            document.body.appendChild(a); a.click(); a.remove();
            L.toast('이미지를 저장했어요');
          };
        }

        updateCard();
      }
    );
  }
  /* ---- 이전 전 index.html 18717~18813줄(#TASK-ES-474 생성기 표지) ---- */

  function openRecordModal(rec){
    var isNew = !rec;
    var r = rec || { id: L.newId(), type:'timed', text:'', startAt: L.nowISO(), endAt: null, createdAt: L.nowISO(), category: null, theme:'daily', subTheme:'', themeConfidence:1.0 };
    var catOptions = '<option value="">미분류</option>' + Object.keys(L.TOPICS).map(function(k){
      return '<option value="'+k+'"'+(r.category===k?' selected':'')+'>'+L.TOPICS[k].icon+' '+L.TOPICS[k].label+'</option>';
    }).join('');
    var themeOptions = (typeof L.RECORD_THEMES !== 'undefined') ? Object.keys(L.RECORD_THEMES).map(function(k){
      var th = L.RECORD_THEMES[k];
      return '<option value="'+k+'"'+((r.theme||'daily')===k?' selected':'')+'>'+th.icon+' '+th.label+' ('+th.desc+')</option>';
    }).join('') : '<option value="daily">일상</option>';

    L.openModal(
      '<h3>'+(isNew?'새 기록':'기록 수정')+'</h3>' +
      '<div class="field"><label>내용</label><input id="rText" type="text" value="'+L.escapeHtml(r.text)+'" placeholder="무엇을 했나요?"></div>' +
      '<div class="field"><label>테마 분류</label><select id="rTheme">'+themeOptions+'</select></div>' +
      '<div class="field"><label>분야</label><select id="rCategory">'+catOptions+'</select></div>' +
      '<div class="field">' +
        '<label>사진 첨부 (선택)</label>' +
        '<div style="display:flex;gap:10px;align-items:center;">' +
          '<button class="btn btn-ghost btn-sm" id="recPickPhotoBtn" type="button">사진 첨부</button>' +
          '<input type="file" id="recFileInput" accept="image/*" style="display:none;">' +
          '<div id="recPhotoThumb" style="width:40px;height:40px;border-radius:8px;background:var(--card2);display:flex;align-items:center;justify-content:center;font-size:1.2rem;overflow:hidden;border:1px solid var(--rule);">' +
            (r.photo ? '<img src="'+r.photo+'" style="width:100%;height:100%;object-fit:cover;">' : '🖼️') +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="field"><label>시작 시간</label><input id="rStart" type="datetime-local" value="'+L.toLocalInputValue(r.startAt)+'"></div>' +
      '<div class="field"><label style="display:flex;align-items:center;justify-content:space-between;">종료 시간 <span style="font-weight:400;"><input type="checkbox" id="rOngoing" '+(!r.endAt?'checked':'')+'> 진행중</span></label>' +
        '<input id="rEnd" type="datetime-local" value="'+L.toLocalInputValue(r.endAt)+'" '+(!r.endAt?'disabled':'')+'></div>' +
      '<div class="modal-actions"><button class="btn btn-ghost" id="mCancel" type="button">취소</button><button class="btn btn-primary" id="mSave" type="button">저장</button></div>',
      function(sheet){
        var ongoingChk = sheet.querySelector('#rOngoing');
        var endInput = sheet.querySelector('#rEnd');
        var fileInput = sheet.querySelector('#recFileInput');
        var photoBtn = sheet.querySelector('#recPickPhotoBtn');
        var photoThumb = sheet.querySelector('#recPhotoThumb');

        if(photoBtn && fileInput){
          photoBtn.onclick = function(){ fileInput.click(); };
          fileInput.onchange = function(e){
            var f = e.target.files[0];
            if(!f) return;
            L.resizeImageToDataUrl(f, 600, function(dUrl){
              if(dUrl){
                r.photo = dUrl;
                photoThumb.innerHTML = '<img src="'+dUrl+'" style="width:100%;height:100%;object-fit:cover;">';
              }
            });
          };
        }

        ongoingChk.addEventListener('change', function(){ endInput.disabled = ongoingChk.checked; });
        sheet.querySelector('#mCancel').addEventListener('click', L.closeModal);
        sheet.querySelector('#mSave').addEventListener('click', async function(){
          var text = sheet.querySelector('#rText').value.trim();
          if(!text) return;
          var startVal = sheet.querySelector('#rStart').value;
          var endVal = endInput.value;
          var selectedTheme = sheet.querySelector('#rTheme').value || 'daily';
          r.text = text;
          r.type = 'timed';
          r.theme = selectedTheme;
          r.themeConfidence = 1.0;
          r.category = sheet.querySelector('#rCategory').value || null;
          r.startAt = startVal ? new Date(startVal).toISOString() : L.nowISO();
          r.endAt = ongoingChk.checked ? null : (endVal ? new Date(endVal).toISOString() : null);
          if(isNew) L.state.profile.records.unshift(r);
          await L.saveProfile();
          L.closeModal();
          L.renderRecordsScreen();
          L.toast(isNew ? '기록을 추가했어요' : '수정했어요');

          if(isNew){
            L.renderRecordFeedbackSlot('loading');
            var recGoal = (L.state.profile.goals || []).find(function(g){ return g.category === r.category; }) || (L.state.profile.goals && L.state.profile.goals[0]) || { title: '나의 일상 성장', milestones: [] };
            L.requestAIFeedback(recGoal, r.text, r.theme).then(async function(fb){
              if(fb){
                r.feedback = fb;
                await L.saveProfile();
                L.state.lastCapture = { record: r, goal: recGoal, feedback: fb };
                L.renderRecordFeedbackSlot(fb);
                L.renderFeedbackSlot(fb);
                if(L.state.activeTab === 'records') L.renderRecordsScreen();
                if(recGoal && recGoal.milestones && recGoal.milestones.length > 0){
                  L.maybeShowGoalUpdateModal(recGoal, fb);
                }
                L.sendToNotion(r, fb);
              }
            }).catch(function(err){
              console.warn('[RecordModal AI feedback error]', err);
            });
          }
        });
      }
    );
  }

  /* ---- 이전 전 index.html 18816~18822줄(#TASK-ES-474 생성기 표지) ---- */
  function bindRecTimeTrackerBtn() { /* [#TASK-ES-474] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  if(L.btnOpenTt){
    L.btnOpenTt.addEventListener('click', function(){
      if(typeof OurgoalTimeTracker !== 'undefined' && OurgoalTimeTracker.open){
        OurgoalTimeTracker.open();
      }
    });
  }
  } /* bindRecTimeTrackerBtn */

  /* ---- 이전 전 index.html 18825~18832줄(#TASK-ES-474 생성기 표지) ---- */
  function bindRecSegmentBar() { /* [#TASK-ES-474] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */

  // 세그먼트·펄스바·캐러셀 알약 정적 클릭 리스너 보장 (이벤트 유실 원천 방어)
  document.querySelectorAll('#recSegmentBar [data-recseg]').forEach(function(btn){
    btn.addEventListener('click', function(e){
      e.preventDefault();
      L.setRecordsSegment(btn.dataset.recseg);
    });
  });
  } /* bindRecSegmentBar */

  /* ---- 이전 전 index.html 18834~18839줄(#TASK-ES-474 생성기 표지) ---- */
  function bindRecPulseBar() { /* [#TASK-ES-474] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  if(L.staticPulseBar){
    L.staticPulseBar.addEventListener('click', function(e){
      e.preventDefault();
      L.setRecordsSegment('stats');
    });
  }
  } /* bindRecPulseBar */
  /* ---- 이전 전 index.html 18840~18845줄(#TASK-ES-474 생성기 표지) ---- */
  function bindRecCarouselPills() { /* [#TASK-ES-474] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  document.querySelectorAll('#recCarouselPills [data-recslide]').forEach(function(btn){
    btn.addEventListener('click', function(e){
      e.preventDefault();
      L.setRecordsSlide(parseInt(btn.dataset.recslide, 10));
    });
  });
  } /* bindRecCarouselPills */
  /* ---- 이전 전 index.html 18846~18935줄(#TASK-ES-474 생성기 표지) ---- */
  function bindRecDocumentClick() { /* [#TASK-ES-474] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */

  // 유니버설 데이터 가져오기, 활용가이드 및 템플릿 전역 클릭 리스너 보장 (이벤트 유실 원천 방어)
  document.addEventListener('click', function(e){
    var ttBtn = e.target.closest('#btnOpenTimeTracker, #btnOpenTimeTrackerBanner, #recTimeTrackerActionCard');
    if(ttBtn){
      e.preventDefault();
      if(typeof OurgoalTimeTracker !== 'undefined' && OurgoalTimeTracker.open){
        OurgoalTimeTracker.open();
      }
      return;
    }
    var gBtn = e.target.closest('#recAnalyticsGuideBtn');
    if(gBtn){
      e.preventDefault();
      if(typeof OurgoalUniversalStats !== 'undefined' && OurgoalUniversalStats.openGuideModal){
        OurgoalUniversalStats.openGuideModal({ openModal: L.openModal, closeModal: L.closeModal });
      }
      return;
    }
    var diffCfgBtn = e.target.closest('#metricDiffCfgBtn, .diff-cfg-open-btn');
    if(diffCfgBtn){
      e.preventDefault();
      if(typeof OurgoalUniversalStats !== 'undefined' && OurgoalUniversalStats.openDifferentiatedMetricConfigModal){
        OurgoalUniversalStats.openDifferentiatedMetricConfigModal({
          openModal: L.openModal,
          closeModal: L.closeModal,
          onSave: function(){
            L.renderRecordsScreen();
            if(typeof L.toast === 'function') L.toast('지표별 차등 분석 기준이 적용되었습니다.');
          }
        });
      }
      return;
    }
    var uBtn = e.target.closest('#recImportBannerBtn, [data-uimport], #uQuickImportBtn');
    if(uBtn){
      e.preventDefault();
      if(typeof OurgoalUniversalStats !== 'undefined' && OurgoalUniversalStats.openUniversalImportModal){
        OurgoalUniversalStats.openUniversalImportModal({
          openModal: L.openModal,
          closeModal: L.closeModal,
          toast: L.toast,
          state: L.state,
          saveProfile: L.saveProfile,
          onDone: function(){ if(L.state) L.state.recordsSegment = 'stats'; L.renderRecordsScreen(); }
        });
      }
      return;
    }
    var pBtn = e.target.closest('#recOpenProTemplateBtn');
    if(pBtn){
      e.preventDefault();
      if(typeof L.openProTemplateRecordModal === 'function') L.openProTemplateRecordModal(null);
      return;
    }
    var qBtn = e.target.closest('#recQuickTemplateChips [data-quicktpl]');
    if(qBtn){
      e.preventDefault();
      if(typeof L.openProTemplateRecordModal === 'function') L.openProTemplateRecordModal(null, qBtn.dataset.quicktpl);
      return;
    }
    var mcBtn = e.target.closest('#recCreateCustomTplQuickBtn');
    if(mcBtn){
      e.preventDefault();
      if(typeof L.openCreateCustomTemplateModal === 'function'){
        L.openCreateCustomTemplateModal(function(newTpl){
          if(typeof L.openProTemplateRecordModal === 'function') L.openProTemplateRecordModal(null, newTpl.key);
        });
      }
      return;
    }
    var mmBtn = e.target.closest('#recOpenMarketQuickBtn');
    if(mmBtn){
      e.preventDefault();
      if(typeof L.openTemplateMarketModal === 'function'){
        L.openTemplateMarketModal(function(clonedTpl){
          if(typeof L.openProTemplateRecordModal === 'function') L.openProTemplateRecordModal(null, clonedTpl.key);
        });
      }
      return;
    }
    var ggBtn = e.target.closest('#recGoToGoalsTplBtn');
    if(ggBtn){
      e.preventDefault();
      L.switchTab('goals');
      if(typeof openGoalTemplatesModal === 'function') openGoalTemplatesModal();
      else if(typeof openCustomTemplateModal === 'function') openCustomTemplateModal();
      return;
    }
  });
  } /* bindRecDocumentClick */

  K.weeklyRecapStats = weeklyRecapStats;
  K.fitBigFont = fitBigFont;
  K.generateWeeklyRecapImage = generateWeeklyRecapImage;
  K.findBestMoment = findBestMoment;
  K.openWeeklyRecapModal = openWeeklyRecapModal;
  K.openLegacyRecapCanvasModal = openLegacyRecapCanvasModal;
  K.openRecordModal = openRecordModal;
  K.bindRecTimeTrackerBtn = bindRecTimeTrackerBtn;
  K.bindRecSegmentBar = bindRecSegmentBar;
  K.bindRecPulseBar = bindRecPulseBar;
  K.bindRecCarouselPills = bindRecCarouselPills;
  K.bindRecDocumentClick = bindRecDocumentClick;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
