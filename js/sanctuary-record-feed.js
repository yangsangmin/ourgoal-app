/**
 * OurGoal Sanctuary Cell: 기록 탭 성소 피드(renderSanctuaryRecordsFeed)와 보관함(renderSanctuaryRecordsArchive) 그리기, 기간·쪽·직접 기간 고르기 메서드 (#TASK-ES-429 · 포커스 성소 엔진 세포 쪼개기)
 *
 * js/sanctuary-v3-engine.js(1964줄)에서 동작 그대로 옮겼다(이전 전 줄 번호):
 *   분기 본문 renderSanctuaryRecordsFeed(782~972)
 *   분기 본문 renderSanctuaryRecordsArchive(986~1107)
 *   메서드 setFeedPeriod·setFeedPage·applyFeedCustomDate·setArchivePeriod·setArchivePage(1923~1952)
 * 바꾼 글자는 원본 스코프 이름 앞 T. 접두뿐이다. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 바깥에서는 이전과 같이 window.OurgoalSanctuaryV3 로 부른다(메서드는 원본 객체의 같은 자리에서 펼치고, 함수는 원본이 같은 이름으로 가져온다). 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(window) {
  'use strict';
  // T = js/sanctuary-v3-engine.js 의 스코프 통로 — 원본 IIFE 에 남은 상태(engine)·함수를 getter 로 읽는다(원본이 로드될 때 채운다). 값은 읽을 때마다 살아 있는 값이다.
  // K = 성소 세포 키트의 recordFeed 칸 — 옮긴 함수·메서드 묶음을 담는다(전역 이름은 키트 OurgoalSanctuaryV3Kit 하나만 는다).
  // root = window 인자(키트 등록 전용 별칭 — 컴포넌트·팀·통계 부품의 root·global 과 같은 꼴, 옮긴 코드는 root 를 쓰지 않는다).
  var root = window;
  var KIT = root.OurgoalSanctuaryV3Kit = root.OurgoalSanctuaryV3Kit || {};
  var K = KIT.recordFeed = KIT.recordFeed || {};
  var T = K.scope = K.scope || {};

  // [#TASK-ES-429] renderSanctuaryRecords 의 「engine.activeRecMode === 'feed'」 분기 본문 — 이전 전 782~972줄 글자 그대로.
  //   렌더 함수 지역 변수(records·contentHtml)는 인자로 받는다, 바뀐 contentHtml 을 돌려준다.
  function renderSanctuaryRecordsFeed(records, contentHtml) {
      var feedItemsHtml = '';
      if (records.length === 0) {
        feedItemsHtml = '<div style="text-align:center;padding:40px 20px;color:var(--ink-sub);">' +
          '등록된 기록이 없습니다.<br>오늘의 첫 체크인과 회고를 남겨보세요.' +
        '</div>';
        contentHtml = '<div class="s-feed-container">' +
          '<div class="s-feed-header">' +
            '<h4>나의 체크인 & 회고 피드 (0건)</h4>' +
            '<button class="btn btn-primary btn-sm" type="button" onclick="if(window.OurgoalRecordsKit && typeof OurgoalRecordsKit.openRecordModal === \'function\') OurgoalRecordsKit.openRecordModal(null);">+ 새 기록</button>' +
          '</div>' +
          feedItemsHtml +
        '</div>';
      } else {
        // 1. 최신순 정렬 (가장 최신에 쓴 글이 맨 위에 오도록 타임스탬프 내림차순 정렬)
        var sortedRecs = records.slice().sort(function(a, b) {
          var tA = new Date(a.startAt || a.created_at || a.start_at || 0).getTime();
          var tB = new Date(b.startAt || b.created_at || b.start_at || 0).getTime();
          return tB - tA;
        });

        // 2. 최근 3개만 먼저 보여줌
        var top3Recs = sortedRecs.slice(0, 3);
        var top3Html = top3Recs.map(function(r, idx) {
          var dateStr = (r.startAt || r.created_at || r.start_at || '').slice(0, 16).replace('T', ' ');
          var topicTag = r.topic ? '<span class="s-f-tag">#' + T.escapeHtml(r.topic) + '</span>' : '';
          var isLatest = (idx === 0) ? '<span style="font-size:0.7rem;font-weight:700;color:var(--brand);background:var(--brand-glow, rgba(99,102,241,0.12));padding:1px 6px;border-radius:4px;margin-left:4px;">최신글</span>' : '';
          return '<div class="s-feed-item-card">' +
            '<div class="s-f-head">' +
              '<span class="s-f-date">' + dateStr + isLatest + '</span>' +
              '<span class="s-f-xp">+10 EXP</span>' +
            '</div>' +
            '<div class="s-f-content">' +
              T.escapeHtml(r.text || r.content || '실천 완료') +
            '</div>' +
            '<div class="s-f-meta">' +
              topicTag +
              '<span class="s-f-goal">목표 연동</span>' +
            '</div>' +
          '</div>';
        }).join('');

        var pastSectionHtml = '';
        var allPast = sortedRecs.slice(3);

        if (allPast.length > 0) {
          // 3. 기간 필터링
          var pFilter = T.engine.feedPeriod || 'all';
          var now = new Date();

          var dayOfWeek = now.getDay() || 7;
          var monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (dayOfWeek - 1), 0, 0, 0);
          var sunday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (7 - dayOfWeek), 23, 59, 59);

          var monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
          var monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

          var lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
          var lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

          var d30Start = new Date(now.getTime() - 30 * 86400000);
          var d30End = new Date();

          var cStartStr = T.engine.feedCustomStart || T.getTodayStr();
          var cEndStr = T.engine.feedCustomEnd || T.getTodayStr();
          var cStart = new Date(cStartStr + 'T00:00:00');
          var cEnd = new Date(cEndStr + 'T23:59:59');

          var filteredPast = allPast;
          if (pFilter === 'week') {
            filteredPast = allPast.filter(function(r) {
              var t = new Date(r.startAt || r.created_at || r.start_at || 0).getTime();
              return t >= monday.getTime() && t <= sunday.getTime();
            });
          } else if (pFilter === 'month') {
            filteredPast = allPast.filter(function(r) {
              var t = new Date(r.startAt || r.created_at || r.start_at || 0).getTime();
              return t >= monthStart.getTime() && t <= monthEnd.getTime();
            });
          } else if (pFilter === 'last_month') {
            filteredPast = allPast.filter(function(r) {
              var t = new Date(r.startAt || r.created_at || r.start_at || 0).getTime();
              return t >= lastMonthStart.getTime() && t <= lastMonthEnd.getTime();
            });
          } else if (pFilter === '30d') {
            filteredPast = allPast.filter(function(r) {
              var t = new Date(r.startAt || r.created_at || r.start_at || 0).getTime();
              return t >= d30Start.getTime() && t <= d30End.getTime();
            });
          } else if (pFilter === 'custom') {
            filteredPast = allPast.filter(function(r) {
              var t = new Date(r.startAt || r.created_at || r.start_at || 0).getTime();
              return t >= cStart.getTime() && t <= cEnd.getTime();
            });
          }

          // 4. 최대 5개 피드 페이징
          var PAGE_SIZE = 5;
          var totalPast = filteredPast.length;
          var totalPages = Math.max(1, Math.ceil(totalPast / PAGE_SIZE));
          var currPage = Math.min(Math.max(1, T.engine.feedPage || 1), totalPages);
          T.engine.feedPage = currPage;
          var pageItems = filteredPast.slice((currPage - 1) * PAGE_SIZE, currPage * PAGE_SIZE);

          var pastCardsHtml = '';
          if (pageItems.length === 0) {
            pastCardsHtml = '<div style="text-align:center;padding:20px;font-size:0.8125rem;color:var(--ink-faint);">' +
              '선택한 기간에 작성된 이전 기록이 없습니다.<br>' +
              '<button type="button" class="btn btn-ghost btn-sm" style="margin-top:8px;" onclick="window.OurgoalSanctuaryV3.setFeedPeriod(\'all\');">전체 보기</button>' +
            '</div>';
          } else {
            var firstD = (pageItems[0].startAt || pageItems[0].created_at || pageItems[0].start_at || '').slice(0, 10);
            var lastD = (pageItems[pageItems.length - 1].startAt || pageItems[pageItems.length - 1].created_at || pageItems[pageItems.length - 1].start_at || '').slice(0, 10);
            var rangeBadge = '<div class="rec-paged-range-badge" style="margin:6px 0 10px;">📅 ' + (lastD === firstD ? firstD : (lastD + ' ~ ' + firstD)) + ' (' + pageItems.length + '건)</div>';

            var cardsList = pageItems.map(function(r) {
              var dateStr = (r.startAt || r.created_at || r.start_at || '').slice(0, 16).replace('T', ' ');
              var topicTag = r.topic ? '<span class="s-f-tag">#' + T.escapeHtml(r.topic) + '</span>' : '';
              return '<div class="s-feed-item-card">' +
                '<div class="s-f-head">' +
                  '<span class="s-f-date">' + dateStr + '</span>' +
                  '<span class="s-f-xp">+10 EXP</span>' +
                '</div>' +
                '<div class="s-f-content">' +
                  T.escapeHtml(r.text || r.content || '실천 완료') +
                '</div>' +
                '<div class="s-f-meta">' +
                  topicTag +
                  '<span class="s-f-goal">목표 연동</span>' +
                '</div>' +
              '</div>';
            }).join('');

            // 모바일 와이드 엄지 페이저
            var pagerHtml = '<div class="rec-past-pager" style="margin-top:12px;padding-top:10px;">' +
              '<button type="button" class="rec-pager-btn" ' + (currPage <= 1 ? 'disabled' : '') + ' onclick="window.OurgoalSanctuaryV3.setFeedPage(' + (currPage - 1) + ');">' +
                '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>' +
                '<span>이전 5개</span>' +
              '</button>' +
              '<div class="rec-pager-info">' +
                '<b>' + currPage + ' / ' + totalPages + ' 페이지</b>' +
                '<span>(이전 기록 총 ' + totalPast + '건)</span>' +
              '</div>' +
              '<button type="button" class="rec-pager-btn" ' + (currPage >= totalPages ? 'disabled' : '') + ' onclick="window.OurgoalSanctuaryV3.setFeedPage(' + (currPage + 1) + ');">' +
                '<span>다음 5개</span>' +
                '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>' +
              '</button>' +
            '</div>';

            pastCardsHtml = rangeBadge + cardsList + pagerHtml;
          }

          var customDateBoxHtml = '';
          if (pFilter === 'custom') {
            customDateBoxHtml = '<div class="rec-custom-date-box" style="margin-bottom:10px;">' +
              '<label>시작</label><input type="date" id="sFeedCustomStart" value="' + cStartStr + '">' +
              '<span style="color:var(--ink-faint);">~</span>' +
              '<label>종료</label><input type="date" id="sFeedCustomEnd" value="' + cEndStr + '">' +
              '<button type="button" class="btn btn-primary btn-sm" style="padding:4px 10px;font-size:0.75rem;font-weight:700;" onclick="window.OurgoalSanctuaryV3.applyFeedCustomDate();">조회</button>' +
            '</div>';
          }

          pastSectionHtml = '<div class="rec-past-archive-card" id="sFeedPastArchiveCard" style="margin-top:16px;">' +
            '<div class="rec-past-header-row">' +
              '<div class="rec-past-title"><span>📂 이전 피드 모아보기</span></div>' +
              '<span class="rec-past-meta">총 ' + totalPast + '건</span>' +
            '</div>' +
            '<div class="rec-period-chip-bar">' +
              '<button type="button" class="rec-period-chip ' + (pFilter === 'all' ? 'active' : '') + '" onclick="window.OurgoalSanctuaryV3.setFeedPeriod(\'all\');">전체</button>' +
              '<button type="button" class="rec-period-chip ' + (pFilter === 'week' ? 'active' : '') + '" onclick="window.OurgoalSanctuaryV3.setFeedPeriod(\'week\');">이번 주</button>' +
              '<button type="button" class="rec-period-chip ' + (pFilter === 'month' ? 'active' : '') + '" onclick="window.OurgoalSanctuaryV3.setFeedPeriod(\'month\');">이번 달</button>' +
              '<button type="button" class="rec-period-chip ' + (pFilter === 'last_month' ? 'active' : '') + '" onclick="window.OurgoalSanctuaryV3.setFeedPeriod(\'last_month\');">지난 달</button>' +
              '<button type="button" class="rec-period-chip ' + (pFilter === '30d' ? 'active' : '') + '" onclick="window.OurgoalSanctuaryV3.setFeedPeriod(\'30d\');">최근 30일</button>' +
              '<button type="button" class="rec-period-chip ' + (pFilter === 'custom' ? 'active' : '') + '" onclick="window.OurgoalSanctuaryV3.setFeedPeriod(\'custom\');">📅 직접 설정</button>' +
            '</div>' +
            customDateBoxHtml +
            pastCardsHtml +
          '</div>';
        } else {
          pastSectionHtml = '<div style="font-size:0.78rem;color:var(--ink-faint);text-align:center;padding:12px 0;">✨ 모든 최신 기록을 확인했습니다.</div>';
        }

        contentHtml = '<div class="s-feed-container">' +
          '<div class="s-feed-header">' +
            '<h4>나의 체크인 & 회고 피드 (' + records.length + '건)</h4>' +
            '<button class="btn btn-primary btn-sm" type="button" onclick="if(window.OurgoalRecordsKit && typeof OurgoalRecordsKit.openRecordModal === \'function\') OurgoalRecordsKit.openRecordModal(null);">+ 새 기록</button>' +
          '</div>' +
          '<div style="font-size:0.75rem;font-weight:700;color:var(--ink-soft);margin-bottom:8px;">✍️ 최근 실천 3개 (최신순)</div>' +
          top3Html +
          pastSectionHtml +
        '</div>';
      }
    return contentHtml;
  }

  // [#TASK-ES-429] renderSanctuaryRecords 의 「engine.activeRecMode === 'archive'」 분기 본문 — 이전 전 986~1107줄 글자 그대로.
  //   렌더 함수 지역 변수(contentHtml)는 인자로 받는다, 바뀐 contentHtml 을 돌려준다.
  function renderSanctuaryRecordsArchive(contentHtml) {
      var allArchived = (window.state && window.state.profile && window.state.profile.goals || []).filter(function(g){ return g.archivedAt; })
        .sort(function(a,b){ return new Date(b.archivedAt) - new Date(a.archivedAt); });

      if (allArchived.length === 0) {
        contentHtml = '<div class="s-heatmap-card" style="margin-bottom:12px;text-align:center;padding:36px 20px;">' +
          '<div style="font-size:2rem;margin-bottom:8px;">📦</div>' +
          '<h3 style="margin:0 0 6px;">보관된 목표가 없습니다</h3>' +
          '<p style="font-size:0.875rem;color:var(--ink-sub);margin:0;">마감일이 지났거나 완료된 목표는 삭제 대신 보관함에 안전하게 기록됩니다.</p>' +
        '</div>';
      } else {
        function sBuildGoalCard(g, isLatest) {
          var pct = typeof window.goalAchievement === 'function' ? window.goalAchievement(g) : (g.progress || 0);
          var days = Math.max(1, Math.round((new Date(g.archivedAt) - new Date(g.createdAt || Date.now())) / 86400000));
          var latestBadge = isLatest ? '<span style="font-size:0.7rem;font-weight:700;color:var(--brand);background:var(--brand-glow, rgba(99,102,241,0.12));padding:1px 6px;border-radius:4px;margin-left:6px;">최신 보관</span>' : '';
          var msHtml = '';
          if (Array.isArray(g.milestones) && g.milestones.length > 0) {
            var msList = g.milestones.map(function(m){
              return '· ' + T.escapeHtml(m.title) + ' (' + (m.status === 'done' || m.done ? '완료' : '진행 중') + ')';
            }).join('<br>');
            msHtml = '<details class="archive-ms-details" style="margin-top:8px;border-top:1px dashed var(--line, rgba(255,255,255,0.08));padding-top:6px;">' +
              '<summary style="font-size:0.75rem;color:var(--ink-soft);cursor:pointer;user-select:none;font-weight:600;">세부 마일스톤 (' + g.milestones.length + '개) 보기 ▾</summary>' +
              '<div class="archive-ms" style="margin-top:6px;font-size:0.75rem;line-height:1.45;color:var(--ink-sub);">' + msList + '</div>' +
            '</details>';
          }

          var archDate = (g.archivedAt || '').slice(0, 10);
          return '<div class="archive-card s-feed-item-card" style="margin-bottom:10px;">' +
            '<div class="archive-top" style="display:flex;align-items:center;justify-content:space-between;">' +
              '<div><b>' + T.escapeHtml(g.title) + '</b>' + latestBadge + '</div>' +
              '<span class="archive-pct" style="font-size:0.875rem;font-weight:800;color:var(--brand);">' + pct + '%</span>' +
            '</div>' +
            '<div class="archive-meta" style="font-size:0.75rem;color:var(--ink-faint);margin-top:4px;">' +
              (g.topic ? ('#' + T.escapeHtml(g.topic) + ' · ') : '') + days + '일간 진행 · ' + archDate + ' 보관' +
            '</div>' +
            msHtml +
            '<button class="btn btn-ghost btn-sm" type="button" style="width:100%;margin-top:10px;" onclick="if(window.restoreGoal){ var tg = (window.state.profile.goals||[]).find(function(x){return x.id===\'' + g.id + '\';}); if(tg) window.restoreGoal(tg); } else { toast(\'목표를 다시 진행함으로 복원했습니다.\'); }">다시 진행하기</button>' +
          '</div>';
        }

        // 1. 최신 3개 전면 노출
        var sTop3 = allArchived.slice(0, 3);
        var sTop3Html = sTop3.map(function(g, idx){ return sBuildGoalCard(g, idx === 0); }).join('');

        // 2. 4번째 이후 과거 완료 목표 모아보기
        var sAllPast = allArchived.slice(3);
        var sPastHtml = '';

        if (sAllPast.length > 0) {
          var pFilter = T.engine.archivePeriod || 'all';
          var curYear = new Date().getFullYear();

          var sFilteredPast = sAllPast;
          if (pFilter === 'this_year') {
            sFilteredPast = sAllPast.filter(function(g){ return new Date(g.archivedAt || 0).getFullYear() === curYear; });
          } else if (pFilter === 'last_year') {
            sFilteredPast = sAllPast.filter(function(g){ return new Date(g.archivedAt || 0).getFullYear() === (curYear - 1); });
          } else if (pFilter === 'health') {
            sFilteredPast = sAllPast.filter(function(g){ return g.topic === 'health' || g.topic === '운동/건강'; });
          } else if (pFilter === 'study') {
            sFilteredPast = sAllPast.filter(function(g){ return g.topic === 'study' || g.topic === '학습/성장'; });
          }

          var PAGE_SIZE = 5;
          var totalPast = sFilteredPast.length;
          var totalPages = Math.max(1, Math.ceil(totalPast / PAGE_SIZE));
          var currPage = Math.min(Math.max(1, T.engine.archivePage || 1), totalPages);
          T.engine.archivePage = currPage;
          var pageItems = sFilteredPast.slice((currPage - 1) * PAGE_SIZE, currPage * PAGE_SIZE);

          var pastCardsHtml = '';
          if (pageItems.length === 0) {
            pastCardsHtml = '<div style="text-align:center;padding:20px;font-size:0.8125rem;color:var(--ink-faint);">' +
              '선택한 분류의 이전 보관 목표가 없습니다.<br>' +
              '<button type="button" class="btn btn-ghost btn-sm" style="margin-top:8px;" onclick="window.OurgoalSanctuaryV3.setArchivePeriod(\'all\');">전체 보기</button>' +
            '</div>';
          } else {
            var cardsList = pageItems.map(function(g){ return sBuildGoalCard(g, false); }).join('');
            var pagerHtml = '<div class="rec-past-pager" style="margin-top:12px;padding-top:10px;">' +
              '<button type="button" class="rec-pager-btn" ' + (currPage <= 1 ? 'disabled' : '') + ' onclick="window.OurgoalSanctuaryV3.setArchivePage(' + (currPage - 1) + ');">' +
                '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>' +
                '<span>이전 5개</span>' +
              '</button>' +
              '<div class="rec-pager-info">' +
                '<b>' + currPage + ' / ' + totalPages + ' 페이지</b>' +
                '<span>(이전 목표 총 ' + totalPast + '개)</span>' +
              '</div>' +
              '<button type="button" class="rec-pager-btn" ' + (currPage >= totalPages ? 'disabled' : '') + ' onclick="window.OurgoalSanctuaryV3.setArchivePage(' + (currPage + 1) + ');">' +
                '<span>다음 5개</span>' +
                '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>' +
              '</button>' +
            '</div>';
            pastCardsHtml = cardsList + pagerHtml;
          }

          sPastHtml = '<div class="rec-past-archive-card" id="sArchivePastCard" style="margin-top:16px;">' +
            '<div class="rec-past-header-row">' +
              '<div class="rec-past-title"><span>📂 이전 완료 목표 모아보기</span></div>' +
              '<span class="rec-past-meta">총 ' + totalPast + '개</span>' +
            '</div>' +
            '<div class="rec-period-chip-bar">' +
              '<button type="button" class="rec-period-chip ' + (pFilter === 'all' ? 'active' : '') + '" onclick="window.OurgoalSanctuaryV3.setArchivePeriod(\'all\');">전체</button>' +
              '<button type="button" class="rec-period-chip ' + (pFilter === 'this_year' ? 'active' : '') + '" onclick="window.OurgoalSanctuaryV3.setArchivePeriod(\'this_year\');">올해</button>' +
              '<button type="button" class="rec-period-chip ' + (pFilter === 'last_year' ? 'active' : '') + '" onclick="window.OurgoalSanctuaryV3.setArchivePeriod(\'last_year\');">작년</button>' +
              '<button type="button" class="rec-period-chip ' + (pFilter === 'health' ? 'active' : '') + '" onclick="window.OurgoalSanctuaryV3.setArchivePeriod(\'health\');">운동/건강</button>' +
              '<button type="button" class="rec-period-chip ' + (pFilter === 'study' ? 'active' : '') + '" onclick="window.OurgoalSanctuaryV3.setArchivePeriod(\'study\');">학습/성장</button>' +
            '</div>' +
            pastCardsHtml +
          '</div>';
        } else {
          sPastHtml = '<div style="font-size:0.78rem;color:var(--ink-faint);text-align:center;padding:12px 0;">✨ 모든 보관 목표를 확인했습니다.</div>';
        }

        contentHtml = '<div class="s-feed-container">' +
          '<div class="s-feed-header">' +
            '<h4>실천 및 목표 보관함 (' + allArchived.length + '개)</h4>' +
            '<button class="btn btn-ghost btn-sm" type="button" onclick="if(window.switchTab) window.switchTab(\'goals\'); else window.setTab(\'goals\');">목표 관리 바로가기 ›</button>' +
          '</div>' +
          '<div style="font-size:0.75rem;font-weight:700;color:var(--ink-soft);margin-bottom:8px;">✨ 최근 완료·보관 목표 (최신순 3개)</div>' +
          sTop3Html +
          sPastHtml +
        '</div>';
      }
    return contentHtml;
  }

  // [#TASK-ES-429] window.OurgoalSanctuaryV3 메서드 setFeedPeriod·setFeedPage·applyFeedCustomDate·setArchivePeriod·setArchivePage — 이전 전 1923~1952줄 글자 그대로. 원본 객체 리터럴의 같은 자리에서 펼친다(...).
  K.methodsFrom_setFeedPeriod = {
    setFeedPeriod: function(p) {
      T.engine.feedPeriod = p;
      T.engine.feedPage = 1;
      T.renderSanctuaryRecords();
    },
    setFeedPage: function(page) {
      T.engine.feedPage = page;
      T.renderSanctuaryRecords();
      var c = document.getElementById('sFeedPastArchiveCard');
      if (c) c.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    applyFeedCustomDate: function() {
      var s = document.getElementById('sFeedCustomStart');
      var e = document.getElementById('sFeedCustomEnd');
      if (s && s.value) T.engine.feedCustomStart = s.value;
      if (e && e.value) T.engine.feedCustomEnd = e.value;
      T.engine.feedPage = 1;
      T.renderSanctuaryRecords();
    },
    setArchivePeriod: function(p) {
      T.engine.archivePeriod = p;
      T.engine.archivePage = 1;
      T.renderSanctuaryRecords();
    },
    setArchivePage: function(page) {
      T.engine.archivePage = page;
      T.renderSanctuaryRecords();
      var c = document.getElementById('sArchivePastCard');
      if (c) c.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  K.renderSanctuaryRecordsFeed = renderSanctuaryRecordsFeed;
  K.renderSanctuaryRecordsArchive = renderSanctuaryRecordsArchive;
})(window);
