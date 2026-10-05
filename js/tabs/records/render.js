/**
 * OurGoal Records Screen Renderer (기록 탭 화면 렌더)
 *
 * #TASK-ES-358 (기록 탭 세포 이전): index.html 인라인 IIFE 에 있던 기록 탭 렌더 코드를 동작 그대로 옮겼다.
 *   setRecordsSegment(세그먼트 전환) · setRecordsSlide(지표 캐러셀) · renderRecordsScreen(기록 화면 전체 렌더)
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>, 다른 기록 파일 함수는 K.<이름>. 버그도 그대로 옮겼다.
 * index.html 은 IIFE 맨 위에서 이 키트(OurgoalRecordsKit)의 함수를 같은 이름으로 가져와 부른다 — 호출하는 쪽 수십 곳은 그대로다.
 * window.renderRecordsScreen 노출은 이전 전과 같은 자리(index.html)에 그대로 있다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·saveProfile·toast …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 기록 키트: 기록 파일끼리 서로 부르는 함수 묶음(전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalRecordsKit = global.OurgoalRecordsKit || {};

  function setRecordsSegment(seg, silent){
    /* [#TASK-ES-353] silent: 렌더가 상태 복원용으로 부를 때는 햅틱 없음(사용자가 누를 때만) */
    if(!silent && typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
    L.state.recordsSegment = seg;
    var viewFeed = document.getElementById('recViewFeed');
    var viewStats = document.getElementById('recViewStats');
    var viewArchive = document.getElementById('recViewArchive');
    if(viewFeed) viewFeed.style.display = (seg === 'feed' ? 'block' : 'none');
    if(viewStats) viewStats.style.display = (seg === 'stats' ? 'block' : 'none');
    if(viewArchive) viewArchive.style.display = (seg === 'archive' ? 'block' : 'none');
    /* [#TASK-ES-515] 늘 숨어 있던 옛 세그먼트 막대의 단추 강조 동기화 줄을 막대와 함께 지웠다(상민님 승인 2026-10-06). 보기 전환·성소 기록 모드 동기화는 그대로 */

    if (window.OurgoalSanctuaryV3 && typeof window.OurgoalSanctuaryV3.getActiveRecMode === 'function') {
      var curMode = window.OurgoalSanctuaryV3.getActiveRecMode();
      if (['heatmap', 'timer', 'recap'].indexOf(curMode) === -1) {
        var sMode = (seg === 'stats') ? 'stats' : ((seg === 'archive') ? 'archive' : 'feed');
        if (curMode !== sMode) {
          window.OurgoalSanctuaryV3.setRecMode(sMode);
        }
      }
    }
  }

  function setRecordsSlide(idx, silent){
    if(!silent && typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
    L.state.recordsSlide = idx;
    var track = document.getElementById('recCarouselTrack');
    if(track){
      track.style.transform = 'translateX(-' + (idx * 25) + '%)';
    }
    document.querySelectorAll('#recCarouselPills [data-recslide]').forEach(function(btn){
      btn.classList.toggle('active', parseInt(btn.dataset.recslide, 10) === idx);
    });
  }

  function renderRecordsScreen(){
    if(!L.state) L.state = {};
    if(!L.state.profile){
      if(typeof L.defaultProfile === 'function'){
        L.state.profile = L.defaultProfile('guest', 'guest', '게스트');
      } else {
        L.state.profile = { id: 'guest', username: 'guest', displayName: '게스트', records: [], goals: [], settings: {} };
      }
    }
    if(typeof ensureProfileDataStructure === 'function'){
      ensureProfileDataStructure();
    } else {
      if(!L.state.profile.records || !Array.isArray(L.state.profile.records)) L.state.profile.records = [];
      if(!L.state.profile.goals || !Array.isArray(L.state.profile.goals)) L.state.profile.goals = [];
      if(!L.state.profile.settings || typeof L.state.profile.settings !== 'object') L.state.profile.settings = {};
    }

    // 템플릿 필터 및 테마 자동 감지 데이터 보정
    var needsSave = false;
    (L.state.profile.records || []).forEach(function(r){
      if(!r.theme || r.theme === 'daily'){
        var c = (typeof classifyRecordThemeEnhanced === 'function') ? classifyRecordThemeEnhanced(r.text || r.content || '') : { theme:'daily', subTheme:'일상', confidence:0.8 };
        r.theme = c.theme; r.subTheme = c.subTheme; r.themeConfidence = c.confidence; needsSave = true;
      }
    });
    if(needsSave){ L.saveProfile(); }
    var allRecs = (L.state.profile.records || []).slice().sort(function(a,b){
      var tA = new Date(a.startAt || a.start_at || 0).getTime(); var tB = new Date(b.startAt || b.start_at || 0).getTime(); return tB - tA;
    });

    
    // [TASK-ES-245] 샘플 데이터 능동 감지 배너 렌더링
    var curRecords = (L.state && L.state.profile && L.state.profile.records) || (L.state && L.state.records) || [];
    var sampleCount = curRecords.filter(function(r){ return r && r.isSample === true; }).length;
    var purgeBannerEl = document.getElementById('recSamplePurgeBanner');
    if(purgeBannerEl){
      if(sampleCount > 0){
        purgeBannerEl.style.display = 'block';
        purgeBannerEl.innerHTML = 
          '<div class="rec-sample-purge-box" id="recSamplePurgeBox">' +
            '<div style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:var(--ink);min-width:0;flex:1;">' +
              '<span style="font-size:16px;flex-shrink:0;">💡</span>' +
              '<span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">체험용 샘플 데이터 <b style="color:#ef4444;">' + sampleCount + '건</b> 적용 중</span>' +
            '</div>' +
            '<button type="button" class="btn btn-sm toss-haptic-tap" id="recSamplePurgeBtn" onclick="purgeSampleRecordsOneClick()" style="flex-shrink:0;background:#ef4444;color:#ffffff;border:none;border-radius:18px;font-size:12px;font-weight:700;padding:6px 12px;box-shadow:0 2px 6px rgba(239,68,68,0.3);cursor:pointer;min-height:36px;">' +
              '🧹 1초 정리하기' +
            '</button>' +
          '</div>';
      } else {
        purgeBannerEl.style.display = 'none';
        purgeBannerEl.innerHTML = '';
      }
    }

    var recHeadline = document.getElementById('recHeadlineSentence');
    if(recHeadline){
      var totalRecs = (L.state.profile.records || []).length;
      if(totalRecs > 0){
        recHeadline.innerHTML = '총 <b>' + totalRecs + '개</b>의 소중한 성장이 기록되었어요 📈';
      } else {
        recHeadline.innerHTML = '매일의 작은 실천이 <b>큰 성장</b>을 만들어요 📈';
      }
    }

    // 실시간 AI 피드백 슬롯 동기화 (Req 1)
    if(L.state.lastCapture && L.state.lastCapture.feedback){
      L.renderRecordFeedbackSlot(L.state.lastCapture.feedback);
    }

    // 라이프 밸런스 휠 (전체 기록 테마 분포)
    L.renderLifeBalanceWheel(allRecs);

    // 테마 필터 칩 렌더링
    L.renderRecordThemeFilters();

    // week summary & mini pulse bar calculation
    var weekAgo = Date.now() - 7*86400000;
    var totalMs = 0;
    var weekRecCount = 0;
    allRecs.forEach(function(r){
      if(new Date(r.startAt).getTime() >= weekAgo){
        weekRecCount++;
        if(r.endAt){
          totalMs += (new Date(r.endAt) - new Date(r.startAt));
        }
      }
    });
    var weekSummaryEl = document.getElementById('weekSummary');
    if(weekSummaryEl) weekSummaryEl.textContent = '이번 주 총 ' + L.fmtDuration(totalMs) + ' 기록';

    // 토스 기록 요약 원카드 (#TASK-ES-215) 통계 바인딩
    var heroWeekCountEl = document.getElementById('recHeroWeekCount');
    if(heroWeekCountEl) heroWeekCountEl.textContent = weekRecCount + '회';
    var heroWeekTimeEl = document.getElementById('recHeroWeekTime');
    if(heroWeekTimeEl) heroWeekTimeEl.textContent = totalMs > 0 ? L.fmtDuration(totalMs) : '0분';
    var heroTotalCountEl = document.getElementById('recHeroTotalCount');
    if(heroTotalCountEl) heroTotalCountEl.textContent = allRecs.length + '개';

    var pulseTextEl = document.getElementById('recMiniPulseText');
    if(pulseTextEl){
      if(totalMs > 0){
        pulseTextEl.innerHTML = '이번 주 <b>' + L.fmtDuration(totalMs) + ' 실천</b> (' + weekRecCount + '회 기록) · 성취 확인';
      } else if(weekRecCount > 0){
        pulseTextEl.innerHTML = '이번 주 <b>' + weekRecCount + '회 실천 완료 ✨</b> · 성취 확인';
      } else {
        pulseTextEl.innerHTML = '이번 주 <b>0회 실천</b> · 실천을 기록해보세요';
      }
    }

    L.renderWeekChart(allRecs);
    L.renderRecordHeatmap(allRecs);
    L.renderReportSummary(allRecs);
    L.renderArchivedGoals();

    // 기간별 기록 AI 피드백 카드 초기화 (Req 4)
    K.initPeriodAiCard(allRecs);

    // [TASK-ES-059] 테마 제약 없는 유니버설 AI 자율 메트릭 시계열 대시보드 렌더링
    if(typeof OurgoalUniversalStats !== 'undefined'){
      var uDashBox = document.getElementById('universalStatsDashboardBox');
      if(uDashBox){
        try {
          OurgoalUniversalStats.renderUniversalStatsDashboard(uDashBox, allRecs, L.state, {
            openModal: L.openModal,
            closeModal: L.closeModal,
            toast: L.toast,
            saveProfile: L.saveProfile,
            onDone: function(){ if(L.state) L.state.recordsSegment = 'stats'; renderRecordsScreen(); }
          });
        } catch(uErr){
          console.error('[UniversalStats] render error:', uErr);
        }
      }
    }

    // 기록 화면 배너 [데이터 가져오기 & 1초 샘플로드] 버튼 바인딩
    var bnrImpBtn = document.getElementById('recImportBannerBtn');
    if(bnrImpBtn){
      bnrImpBtn.onclick = function(){
        if(typeof OurgoalUniversalStats !== 'undefined'){
          OurgoalUniversalStats.openUniversalImportModal({
            openModal: L.openModal,
            closeModal: L.closeModal,
            toast: L.toast,
            state: L.state,
            saveProfile: L.saveProfile,
            onDone: function(){ if(L.state) L.state.recordsSegment = 'stats'; renderRecordsScreen(); }
          });
        }
      };
    }

    // [TASK-ES-061] 성취 통계 및 유니버설 온톨로지 대시보드 활용법 가이드 모달 바인딩
    var guideBtn = document.getElementById('recAnalyticsGuideBtn');
    if(guideBtn){
      guideBtn.onclick = function(){
        if(typeof OurgoalUniversalStats !== 'undefined' && OurgoalUniversalStats.openGuideModal){
          OurgoalUniversalStats.openGuideModal({ openModal: L.openModal, closeModal: L.closeModal });
        }
      };
    }

    // [TASK-ES-163] 지표별 차등 분석 기준 설정 모달 바인딩
    var diffCfgBtn = document.getElementById('metricDiffCfgBtn');
    if(diffCfgBtn){
      diffCfgBtn.onclick = function(){
        if(typeof OurgoalUniversalStats !== 'undefined' && OurgoalUniversalStats.openDifferentiatedMetricConfigModal){
          OurgoalUniversalStats.openDifferentiatedMetricConfigModal({
            openModal: L.openModal,
            closeModal: L.closeModal,
            onSave: function(){
              renderRecordsScreen();
              if(typeof L.toast === 'function') L.toast('지표별 차등 분석 기준이 적용되었습니다.');
            }
          });
        }
      };
    }

    // 세그먼트 및 캐러셀 상태 동기화
    setRecordsSegment(L.state.recordsSegment || 'feed', true);
    setRecordsSlide(L.state.recordsSlide || 0, true);

    // 미니 펄스 바 & 캐러셀 알약 탭 이벤트 리스너 연결
    var pulseBar = document.getElementById('recMiniPulseBar');
    if(pulseBar){
      pulseBar.onclick = function(){ setRecordsSegment('stats'); };
    }
    document.querySelectorAll('#recCarouselPills [data-recslide]').forEach(function(btn){
      btn.onclick = function(){ setRecordsSlide(parseInt(btn.dataset.recslide, 10)); };
    });
    var curSlide = (L.state && typeof L.state.recordsSlide === 'number') ? L.state.recordsSlide : 0;
    if(allRecs.length < 3 && (!L.state.recordsSlideInit || L.state.recordsSlide === 0)){
      curSlide = 1;
      L.state.recordsSlide = 1;
      L.state.recordsSlideInit = true;
    }
    setRecordsSlide(curSlide, true);

    // 캐러셀 스와이프 제스처 지원 (모바일 PWA 터치 최적화)
    var vport = document.getElementById('recCarouselViewport');
    if(vport && !vport._swipeBound){
      vport._swipeBound = true;
      var touchStartX = 0;
      vport.addEventListener('touchstart', function(e){
        if(e.touches && e.touches[0]) touchStartX = e.touches[0].clientX;
      }, { passive: true });
      vport.addEventListener('touchend', function(e){
        if(e.changedTouches && e.changedTouches[0]){
          var diff = e.changedTouches[0].clientX - touchStartX;
          if(diff < -40 && (L.state.recordsSlide || 0) < 3){
            setRecordsSlide((L.state.recordsSlide || 0) + 1);
          } else if(diff > 40 && (L.state.recordsSlide || 0) > 0){
            setRecordsSlide((L.state.recordsSlide || 0) - 1);
          }
        }
      }, { passive: true });
    }

    // 대화형 기록 입력창 리스너 연결 (Req 1)
    var recSend = document.getElementById('recAgentSendBtn');
    var recInp = document.getElementById('recAgentInput');
    if(recSend && recInp){
      var submitAiRec = function(){
        var txt = recInp.value.trim();
        if(!txt) return;
        recInp.value = '';
        L.handleConversationalRecord(txt);
      };
      recSend.onclick = submitAiRec;
      recInp.onkeydown = function(e){
        if(e.key === 'Enter') submitAiRec();
      };
    }

    // 전문적(내 전용 템플릿) 기록 버튼 & 퀵 칩 리스너 연결
    var proOpenBtn = document.getElementById('recOpenProTemplateBtn');
    if(proOpenBtn){
      proOpenBtn.onclick = function(){ L.openProTemplateRecordModal(null); };
    }
    document.querySelectorAll('#recQuickTemplateChips [data-quicktpl]').forEach(function(btn){
      btn.onclick = function(){ L.openProTemplateRecordModal(null, btn.dataset.quicktpl); };
    });
    var quickCreateBtn = document.getElementById('recCreateCustomTplQuickBtn');
    if(quickCreateBtn){
      quickCreateBtn.onclick = function(){
        L.openCreateCustomTemplateModal(function(newTpl){
          L.openProTemplateRecordModal(null, newTpl.key);
        });
      };
    }
    var quickMarketBtn = document.getElementById('recOpenMarketQuickBtn');
    if(quickMarketBtn){
      quickMarketBtn.onclick = function(){
        L.openTemplateMarketModal(function(clonedTpl){
          L.openProTemplateRecordModal(null, clonedTpl.key);
        });
      };
    }
    var goToGoalsTplBtn = document.getElementById('recGoToGoalsTplBtn');
    if(goToGoalsTplBtn){
      goToGoalsTplBtn.onclick = function(){
        L.switchTab('goals');
        if(typeof openGoalTemplatesModal === 'function') openGoalTemplatesModal();
        else if(typeof openCustomTemplateModal === 'function') openCustomTemplateModal();
      };
    }

    var listEl = document.getElementById('recordsList');
    if(!allRecs.length){
      listEl.innerHTML = '<div class="empty-state"><div class="e-icon"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></div><p>이제 나만의 첫 실천을 기록해보세요! ✨</p>' +
        '<button class="btn btn-primary btn-sm" id="recAutoRestoreBtn" style="margin-top:12px;padding:8px 16px;border-radius:10px;font-weight:700;">🔄 이전 기록 전체 불러오기</button></div>';
      var restoreBtn = document.getElementById('recAutoRestoreBtn');
      if(restoreBtn){
        restoreBtn.onclick = async function(){
          restoreBtn.disabled = true;
          restoreBtn.textContent = '불러오는 중…';
          var hasUpdated = await L.syncServerRecords(true);
          if(hasUpdated){
            L.toast('기록 ' + (L.state.profile.records || []).length + '개를 성공적으로 복원했습니다!');
            renderRecordsScreen();
          } else {
            L.toast('서버 및 로컬에서 추가로 복원할 기록이 없습니다.');
            restoreBtn.disabled = false;
            restoreBtn.textContent = '🔄 이전 기록 전체 불러오기';
          }
        };
      }
      if(!window._hasAutoTriedRecordSync){
        window._hasAutoTriedRecordSync = true;
        L.syncServerRecords(false).then(function(hasUpdated){
          if(hasUpdated) renderRecordsScreen();
        });
      }
      return;
    }

    // 테마 필터링
    var filteredRecs = allRecs;
    if(L.state.selectedRecordTheme && L.state.selectedRecordTheme !== 'all'){
      filteredRecs = filteredRecs.filter(function(r){
        return (r.theme || 'daily') === L.state.selectedRecordTheme;
      });
    }

    // 검색어 필터링
    var searchInput = document.getElementById('recSearchInput');
    var query = searchInput ? searchInput.value : '';
    filteredRecs = L.filterRecordsByQuery(filteredRecs, query);
    if(!filteredRecs.length){
      listEl.innerHTML = '<div class="empty-state"><div class="e-icon"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></div><p>해당 테마 또는 검색 조건에 맞는 기록이 없어요.</p></div>';
      return;
    }

    if(query || (L.state.selectedRecordTheme && L.state.selectedRecordTheme !== 'all')){
      // 검색 및 테마 필터 상태: 일자별 평면 노출로 빠른 검색 탐색 지원
      var html = ''; var lastKey = null;
      filteredRecs.forEach(function(r){
        var k = L.dateKey(r.startAt);
        if(k!==lastKey){ html += '<div class="rec-date-label">'+L.fmtDateLabel(r.startAt)+'</div>'; lastKey = k; }
        html += L.buildRecordCardHtml(r);
      });
      listEl.innerHTML = html;
    } else {
      // [TASK-ES-202] 내 기록 피드: 최신 3개 전면 노출 + 이전 기록 기간 탐색 & 5개 와이드 페이징 (레거시 무결성 100% 호환)
      var html = '';
      var topRecs = filteredRecs.slice(0, 3);
      var allPastRecs = filteredRecs.slice(3);

      // 1. 최신 3개 피드 전면 노출 (OurgoalRecordsStats.build7DaysFeedHtml 호환 및 카드 렌더링)
      html += '<div class="rec-feed-header">' +
        '<span class="rec-feed-title">✍️ 최근 실천 피드</span>' +
        '<span class="rec-feed-count">최신 ' + topRecs.length + '건</span>' +
      '</div>';

      if(topRecs.length > 0){
        var lastKey = null;
        topRecs.forEach(function(r){
          var k = L.dateKey(r.startAt);
          if(k !== lastKey){
            html += '<div class="rec-date-label">' + L.fmtDateLabel(r.startAt) + '</div>';
            lastKey = k;
          }
          html += L.buildRecordCardHtml(r);
        });
      } else if(typeof OurgoalRecordsStats !== 'undefined' && OurgoalRecordsStats.build7DaysFeedHtml){
        html += OurgoalRecordsStats.build7DaysFeedHtml([], { fmtDateLabel: L.fmtDateLabel, buildRecordCardHtml: L.buildRecordCardHtml });
      }

      if(filteredRecs.length <= 3){
        html += '<div style="font-size:0.78rem;color:var(--ink-faint);text-align:center;padding:14px 0;">✨ 모든 최신 실천 기록을 확인했습니다.</div>';
      } else {
        // 2. 이전 기록 (4번째부터) 기간 탐색 & 5개 단위 와이드 페이징
        var pFilter = L.state.recordsPeriodFilter || 'all';
        var now = new Date();

        // 날짜 필터 범위 계산
        var dayOfWeek = now.getDay() || 7;
        var monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (dayOfWeek - 1), 0, 0, 0);
        var sunday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (7 - dayOfWeek), 23, 59, 59);

        var monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        var monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        var lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
        var lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

        var d30Start = new Date(now.getTime() - 30 * 86400000);
        var d30End = new Date();

        var cStartStr = L.state.recordsCustomStart || L.dateKey(new Date(now.getTime() - 30 * 86400000));
        var cEndStr = L.state.recordsCustomEnd || L.dateKey(now);
        var cStart = new Date(cStartStr + 'T00:00:00');
        var cEnd = new Date(cEndStr + 'T23:59:59');

        var filteredPast = allPastRecs;
        if(pFilter === 'week'){
          filteredPast = allPastRecs.filter(function(r){
            var t = new Date(r.startAt || 0).getTime();
            return t >= monday.getTime() && t <= sunday.getTime();
          });
        } else if(pFilter === 'month'){
          filteredPast = allPastRecs.filter(function(r){
            var t = new Date(r.startAt || 0).getTime();
            return t >= monthStart.getTime() && t <= monthEnd.getTime();
          });
        } else if(pFilter === 'last_month'){
          filteredPast = allPastRecs.filter(function(r){
            var t = new Date(r.startAt || 0).getTime();
            return t >= lastMonthStart.getTime() && t <= lastMonthEnd.getTime();
          });
        } else if(pFilter === '30d'){
          filteredPast = allPastRecs.filter(function(r){
            var t = new Date(r.startAt || 0).getTime();
            return t >= d30Start.getTime() && t <= d30End.getTime();
          });
        } else if(pFilter === 'custom'){
          filteredPast = allPastRecs.filter(function(r){
            var t = new Date(r.startAt || 0).getTime();
            return t >= cStart.getTime() && t <= cEnd.getTime();
          });
        }

        var PAGE_SIZE = 5;
        var totalPast = filteredPast.length;
        var totalPages = Math.max(1, Math.ceil(totalPast / PAGE_SIZE));
        var currPage = Math.min(Math.max(1, L.state.recordsPastPage || 1), totalPages);
        L.state.recordsPastPage = currPage;
        var pageItems = filteredPast.slice((currPage - 1) * PAGE_SIZE, currPage * PAGE_SIZE);

        html += '<div class="rec-accordion-card rec-past-archive-card expanded" id="recPastArchiveSection" data-acc="past-archive">' +
          '<div class="rec-acc-head rec-past-header-row" data-toggleacc="1" style="cursor:pointer;">' +
            '<div class="rec-past-title"><span>📂 이전 기록 모아보기</span></div>' +
            '<div class="rec-acc-meta" style="display:flex;align-items:center;gap:6px;">' +
              '<span class="rec-past-meta">총 ' + totalPast + '건</span>' +
              '<span class="rec-acc-chevron">▼</span>' +
            '</div>' +
          '</div>' +
          '<div class="rec-acc-body">' +
            '<div class="rec-acc-inner">' +
              '<div class="rec-period-chip-bar" id="recPeriodChipBar">' +
                '<button type="button" class="rec-period-chip ' + (pFilter === 'all' ? 'active' : '') + '" data-pchip="all">전체</button>' +
                '<button type="button" class="rec-period-chip ' + (pFilter === 'week' ? 'active' : '') + '" data-pchip="week">이번 주</button>' +
                '<button type="button" class="rec-period-chip ' + (pFilter === 'month' ? 'active' : '') + '" data-pchip="month">이번 달</button>' +
                '<button type="button" class="rec-period-chip ' + (pFilter === 'last_month' ? 'active' : '') + '" data-pchip="last_month">지난 달</button>' +
                '<button type="button" class="rec-period-chip ' + (pFilter === '30d' ? 'active' : '') + '" data-pchip="30d">최근 30일</button>' +
                '<button type="button" class="rec-period-chip ' + (pFilter === 'custom' ? 'active' : '') + '" data-pchip="custom">📅 직접 설정</button>' +
              '</div>';

        if(pFilter === 'custom'){
          html += '<div class="rec-custom-date-box" id="recCustomDateBox">' +
            '<label>시작</label><input type="date" id="recPastCustomStart" value="' + cStartStr + '">' +
            '<span style="color:var(--ink-faint);">~</span>' +
            '<label>종료</label><input type="date" id="recPastCustomEnd" value="' + cEndStr + '">' +
            '<button type="button" class="btn btn-primary btn-sm" id="recPastCustomApplyBtn" style="padding:4px 10px;font-size:0.75rem;font-weight:700;">조회</button>' +
          '</div>';
        }

        if(totalPast === 0){
          html += '<div class="empty-state" style="padding:18px 0;text-align:center;">' +
            '<p style="font-size:0.8125rem;color:var(--ink-faint);margin-bottom:8px;">선택한 기간에 작성된 이전 기록이 없습니다.</p>' +
            '<button type="button" class="btn btn-ghost btn-sm" id="recPastResetFilterBtn">전체 기록 보기</button>' +
          '</div>';
        } else {
          // 현재 페이지 날짜 범위 뱃지
          var firstItem = pageItems[0];
          var lastItem = pageItems[pageItems.length - 1];
          var rangeText = L.dateKey(firstItem.startAt);
          if(pageItems.length > 1 && L.dateKey(lastItem.startAt) !== rangeText){
            rangeText = L.dateKey(lastItem.startAt) + ' ~ ' + rangeText;
          }
          html += '<div class="rec-paged-range-badge">📅 ' + rangeText + ' (' + pageItems.length + '건)</div>';

          var pastLastKey = null;
          pageItems.forEach(function(r){
            var k = L.dateKey(r.startAt);
            if(k !== pastLastKey){
              html += '<div class="rec-date-label">' + L.fmtDateLabel(r.startAt) + '</div>';
              pastLastKey = k;
            }
            html += L.buildRecordCardHtml(r);
          });

          // 모바일 와이드 엄지 페이저
          html += '<div class="rec-past-pager">' +
            '<button type="button" class="rec-pager-btn" id="recPagerPrevBtn" ' + (currPage <= 1 ? 'disabled' : '') + '>' +
              '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>' +
              '<span>이전 5개</span>' +
            '</button>' +
            '<div class="rec-pager-info">' +
              '<b>' + currPage + ' / ' + totalPages + ' 페이지</b>' +
              '<span>(이전 기록 총 ' + totalPast + '건)</span>' +
            '</div>' +
            '<button type="button" class="rec-pager-btn" id="recPagerNextBtn" ' + (currPage >= totalPages ? 'disabled' : '') + '>' +
              '<span>다음 5개</span>' +
              '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>' +
            '</button>' +
          '</div>';
        }

        html += '</div></div></div>'; // end inner, body, rec-accordion-card
      }
      listEl.innerHTML = html;

      // 3. 아코디언 토글 리스너 연결
      listEl.querySelectorAll('[data-toggleacc]').forEach(function(head){
        head.addEventListener('click', function(e){
          e.stopPropagation();
          var card = head.closest('.rec-accordion-card');
          if(card) card.classList.toggle('expanded');
        });
      });
      listEl.querySelectorAll('[data-toggleday]').forEach(function(btn){
        btn.addEventListener('click', function(e){
          e.stopPropagation();
          var dayKey = btn.dataset.toggleday;
          var collapseEl = document.getElementById('dayCollapse_' + dayKey);
          if(!collapseEl) return;
          var isHidden = collapseEl.style.display === 'none';
          collapseEl.style.display = isHidden ? 'block' : 'none';
        });
      });

      // 4. 이전 기록 인터랙션 바인딩
      listEl.querySelectorAll('#recPeriodChipBar [data-pchip]').forEach(function(chipBtn){
        chipBtn.onclick = function(e){
          e.stopPropagation();
          L.state.recordsPeriodFilter = chipBtn.dataset.pchip;
          L.state.recordsPastPage = 1;
          renderRecordsScreen();
        };
      });

      var customApplyBtn = listEl.querySelector('#recPastCustomApplyBtn');
      if(customApplyBtn){
        customApplyBtn.onclick = function(e){
          e.stopPropagation();
          var sEl = document.getElementById('recPastCustomStart');
          var eEl = document.getElementById('recPastCustomEnd');
          if(sEl && sEl.value) L.state.recordsCustomStart = sEl.value;
          if(eEl && eEl.value) L.state.recordsCustomEnd = eEl.value;
          L.state.recordsPastPage = 1;
          renderRecordsScreen();
        };
      }

      var resetFilterBtn = listEl.querySelector('#recPastResetFilterBtn');
      if(resetFilterBtn){
        resetFilterBtn.onclick = function(e){
          e.stopPropagation();
          L.state.recordsPeriodFilter = 'all';
          L.state.recordsPastPage = 1;
          renderRecordsScreen();
        };
      }

      var prevPagerBtn = listEl.querySelector('#recPagerPrevBtn');
      if(prevPagerBtn){
        prevPagerBtn.onclick = function(e){
          e.stopPropagation();
          if((L.state.recordsPastPage || 1) > 1){
            L.state.recordsPastPage = (L.state.recordsPastPage || 1) - 1;
            renderRecordsScreen();
            var sec = document.getElementById('recPastArchiveSection');
            if(sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        };
      }

      var nextPagerBtn = listEl.querySelector('#recPagerNextBtn');
      if(nextPagerBtn){
        nextPagerBtn.onclick = function(e){
          e.stopPropagation();
          var cur = L.state.recordsPastPage || 1;
          var totalP = Math.max(1, Math.ceil((filteredPast || []).length / 5));
          if(cur < totalP){
            L.state.recordsPastPage = cur + 1;
            renderRecordsScreen();
            var sec = document.getElementById('recPastArchiveSection');
            if(sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        };
      }
    }

    L.wireRecordCards(listEl, { onUpdate: function(){ renderRecordsScreen(); } });
    if(typeof window.OurgoalSanctuaryV3 !== 'undefined' && window.OurgoalSanctuaryV3.render){
      window.OurgoalSanctuaryV3.render('records');
    }
  }

  K.setRecordsSegment = setRecordsSegment;
  K.setRecordsSlide = setRecordsSlide;
  K.renderRecordsScreen = renderRecordsScreen;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
