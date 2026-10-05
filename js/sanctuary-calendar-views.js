/**
 * OurGoal Sanctuary Cell: 일정 탭 성소 달력의 월간 달력(renderSanctuaryCalendarMonth)과 일간 타임라인(renderSanctuaryCalendarTimeline) 그리기 — renderSanctuaryCalendar 의 두 분기 본문 (#TASK-ES-429 · 포커스 성소 엔진 세포 쪼개기)
 *
 * js/sanctuary-v3-engine.js(1964줄)에서 동작 그대로 옮겼다(이전 전 줄 번호):
 *   분기 본문 renderSanctuaryCalendarMonth(341~508)
 *   분기 본문 renderSanctuaryCalendarTimeline(602~655)
 * 바꾼 글자는 원본 스코프 이름 앞 T. 접두뿐이다. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 바깥에서는 이전과 같이 window.OurgoalSanctuaryV3 로 부른다(메서드는 원본 객체의 같은 자리에서 펼치고, 함수는 원본이 같은 이름으로 가져온다). 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(window) {
  'use strict';
  // T = js/sanctuary-v3-engine.js 의 스코프 통로 — 원본 IIFE 에 남은 상태(engine)·함수를 getter 로 읽는다(원본이 로드될 때 채운다). 값은 읽을 때마다 살아 있는 값이다.
  // K = 성소 세포 키트의 calendarViews 칸 — 옮긴 함수·메서드 묶음을 담는다(전역 이름은 키트 OurgoalSanctuaryV3Kit 하나만 는다).
  // root = window 인자(키트 등록 전용 별칭 — 컴포넌트·팀·통계 부품의 root·global 과 같은 꼴, 옮긴 코드는 root 를 쓰지 않는다).
  var root = window;
  var KIT = root.OurgoalSanctuaryV3Kit = root.OurgoalSanctuaryV3Kit || {};
  var K = KIT.calendarViews = KIT.calendarViews || {};
  var T = K.scope = K.scope || {};

  // [#TASK-ES-429] renderSanctuaryCalendar 의 「engine.activeCalMode === 'month'」 분기 본문 — 이전 전 341~508줄 글자 그대로.
  //   렌더 함수 지역 변수(contentHtml·itemsByDate)는 인자로 받는다, 바뀐 contentHtml 을 돌려준다.
  function renderSanctuaryCalendarMonth(contentHtml, itemsByDate) {
      var curYear = T.engine.calYear;
      var curMonth = T.engine.calMonth;
      var daysInMonth = new Date(curYear, curMonth, 0).getDate();
      var firstDayOfWeek = new Date(curYear, curMonth - 1, 1).getDay(); // 0(일) ~ 6(토)
      var todayStr = T.getTodayStr();

      // 첫 요일 이전 빈 칸 생성 (일요일 시작 정렬)
      var emptyCellsHtml = '';
      for (var ei = 0; ei < firstDayOfWeek; ei++) {
        emptyCellsHtml += '<div class="s-cal-day-cell empty" style="opacity:0.2;pointer-events:none;"></div>';
      }

      // 일자별 셀 렌더링
      var daysHtml = Array.from({ length: daysInMonth }, function(_, i) {
        var d = i + 1;
        var dateKey = curYear + '-' + String(curMonth).padStart(2, '0') + '-' + String(d).padStart(2, '0');
        var isToday = (dateKey === todayStr);
        var isSelected = (dateKey === T.engine.selectedCalDate);
        var dayItems = itemsByDate[dateKey] || [];
        var hasItems = dayItems.length > 0;

        // 일자별 배경 사진 지정 여부 확인 및 사진형 일기(Photo Diary) 연동 (#TASK-ES-197)
        var dayBg = (window.state && window.state.profile && window.state.profile.calendarDayBackgrounds && window.state.profile.calendarDayBackgrounds[dateKey]) || '';
        var photoUrl = '';

        if (!dayBg && window.state && window.state.profile && window.state.profile.records) {
          for (var ri = 0; ri < window.state.profile.records.length; ri++) {
            var rec = window.state.profile.records[ri];
            var rDate = (rec.startAt || rec.createdAt || rec.date || '').slice(0, 10);
            if (rDate === dateKey) {
              if (rec.photo) {
                photoUrl = rec.photo;
                break;
              }
              if (rec.attachments && rec.attachments.length) {
                var imgAtt = rec.attachments.find(function(a) {
                  return a.type === 'image' || (a.url && (a.url.startsWith('data:image') || a.url.match(/\.(png|jpe?g|webp|gif)/i)));
                });
                if (imgAtt) {
                  photoUrl = imgAtt.url;
                  break;
                }
              }
            }
          }
        }
        if (!dayBg && !photoUrl && dayItems && dayItems.length) {
          for (var ei = 0; ei < dayItems.length; ei++) {
            var ev = dayItems[ei];
            if (ev.attachments && ev.attachments.length) {
              var evImg = ev.attachments.find(function(a) {
                return a.type === 'image' || (a.url && (a.url.startsWith('data:image') || a.url.match(/\.(png|jpe?g|webp|gif)/i)));
              });
              if (evImg) {
                photoUrl = evImg.url;
                break;
              }
            }
          }
        }

        var hasPhoto = !!(dayBg || photoUrl);
        var bgStyle = '';
        if (Array.isArray(dayBg) && dayBg.length > 0) {
          bgStyle = 'background-image:url(\'' + T.escapeHtml(dayBg[0]) + '\');background-size:cover;background-position:center;';
        } else if (typeof dayBg === 'string' && dayBg) {
          bgStyle = 'background-image:url(\'' + T.escapeHtml(dayBg) + '\');background-size:cover;background-position:center;';
        } else if (photoUrl) {
          bgStyle = 'background-image:url(\'' + T.escapeHtml(photoUrl) + '\');background-size:cover;background-position:center;';
        }

        var bgLayer = bgStyle ? '<div style="position:absolute;inset:0;opacity:0.38;border-radius:10px;' + bgStyle + 'pointer-events:none;"></div>' : '';
        var photoBadge = hasPhoto ? '<span class="s-cal-photo-badge" title="사진형 일기 포함">📸</span>' : '';

        var dotsHtml = '';
        if (dayItems.length > 0) {
          var dotCount = Math.min(dayItems.length, 3);
          var dots = '';
          for (var di = 0; di < dotCount; di++) {
            var itemDone = !!dayItems[di].done;
            dots += '<span class="s-cal-dot' + (itemDone ? ' done' : '') + '" style="display:inline-block;width:5px;height:5px;border-radius:50%;margin:0 1px;background:' + (itemDone ? '#10b981' : 'var(--brand, #6366f1)') + ';"></span>';
          }
          if (dayItems.length > 3) {
            dots += '<span style="font-size:0.55rem;opacity:0.7;margin-left:1px;">+' + (dayItems.length - 3) + '</span>';
          }
          dotsHtml = '<div class="s-cal-dots-row" style="position:relative;z-index:1;display:flex;align-items:center;justify-content:center;gap:1px;margin-top:2px;">' + dots + '</div>';
        }

        var tagHtml = '';
        if (dayItems.length > 0) {
          var firstTitle = T.escapeHtml(dayItems[0].title || dayItems[0].text || '일정');
          tagHtml = '<span class="s-day-today-tag" style="position:relative;z-index:1;font-size:0.56rem;max-width:96%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block;margin-top:1px;">' + firstTitle + '</span>';
        } else if (hasPhoto) {
          tagHtml = '<span class="s-cal-photo-tag">📷 사진 일기</span>';
        }

        return '<div class="s-cal-day-cell ' + (isToday ? 'today' : '') + ' ' + (isSelected ? 'selected' : '') + ' ' + (hasItems ? 'active' : '') + (hasPhoto ? ' has-photo' : '') + '" style="position:relative;" onclick="window.OurgoalSanctuaryV3.selectCalDay(\'' + dateKey + '\')">' +
          bgLayer +
          '<span class="s-day-num" style="position:relative;z-index:1;">' + d + '</span>' +
          photoBadge +
          dotsHtml +
          tagHtml +
        '</div>';
      }).join('');

      var selectedItems = itemsByDate[T.engine.selectedCalDate] || [];
      var selItemTitle = selectedItems.length > 0 ?
        (selectedItems[0].title || selectedItems[0].text || '실천 일정') :
        '등록된 일정이 없습니다';

      
      var itemsListDetailHtml = '';
      if (selectedItems.length > 0) {
        itemsListDetailHtml = '<div class="s-cal-day-items-list" style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.06);">' +
          selectedItems.map(function(it) {
            var tPart = (it.date && it.date.indexOf('T') !== -1) ? it.date.split('T')[1].slice(0, 5) : (it.time || '종일');
            var isDone = !!it.done;
            var schedId = it.schedId || it.id || '';
            var kind = it.kind || 'custom';
            var goalId = it.goalId || '';
            var msId = it.msId || '';
            return '<div class="quest-item" style="cursor:pointer;margin-bottom:6px;padding:8px 10px;border-radius:10px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);" onclick="window.OurgoalSanctuaryV3.openScheduleDetail(\'' + T.engine.selectedCalDate + '\', \'' + schedId + '\', \'' + kind + '\', \'' + goalId + '\');">' +
              '<div class="quest-left">' +
                '<div class="quest-checkbox ' + (isDone ? 'done' : '') + '" onclick="event.stopPropagation(); window.OurgoalSanctuaryV3.toggleScheduleItem(\'' + schedId + '\', \'' + kind + '\', \'' + goalId + '\', \'' + msId + '\');">' +
                  (isDone ? '✓' : '') +
                '</div>' +
                '<div>' +
                  '<div class="quest-text ' + (isDone ? 'done' : '') + '" style="font-size:0.85rem;">' + T.escapeHtml(it.title || it.text) + '</div>' +
                  '<div style="font-size:0.7rem;color:var(--s-ink-faint, #64748B);">' + tPart + (it.note ? ' · ' + T.escapeHtml(it.note) : '') + '</div>' +
                '</div>' +
              '</div>' +
              '<span class="quest-exp" style="font-size:0.68rem;">' + (it.goalId ? '목표연계' : '일반') + '</span>' +
            '</div>';
          }).join('') +
        '</div>';
      } else {
        itemsListDetailHtml = '<div style="margin-top:10px;padding:12px;text-align:center;font-size:0.78rem;color:var(--s-ink-soft);border-top:1px solid rgba(255,255,255,0.06);">' +
          T.engine.selectedCalDate + ' 에 등록된 일정이 없습니다.' +
        '</div>';
      }

      contentHtml = '<div class="s-month-cal-card">' +
        '<div class="s-month-header">' +
          '<button class="s-cal-arrow" type="button" onclick="window.OurgoalSanctuaryV3.shiftCal(-1);">◀</button>' +
          '<h3 class="s-cal-month-title">' + curYear + '년 ' + curMonth + '월</h3>' +
          '<button class="s-cal-arrow" type="button" onclick="window.OurgoalSanctuaryV3.shiftCal(1);">▶</button>' +
          '<span class="s-cal-today-badge" onclick="window.OurgoalSanctuaryV3.selectToday();">오늘</span>' +
        '</div>' +
        '<div class="s-month-days-header">' +
          '<span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span>' +
        '</div>' +
        '<div class="s-month-grid">' +
          emptyCellsHtml +
          daysHtml +
        '</div>' +
        '<div class="s-cal-selected-bar" style="margin-top:12px;padding-top:10px;">' +
          '<div class="s-cal-sel-info">' +
            '<span class="s-cal-sel-date">' + T.engine.selectedCalDate + ' · 일정 ' + selectedItems.length + '건</span>' +
            '<span class="s-cal-sel-task">' + (selectedItems.length > 0 ? '실천 일정 목록' : '등록된 일정 없음') + '</span>' +
          '</div>' +
          '<div style="display:flex;gap:5px;flex-wrap:wrap;">' +
            '<button class="btn btn-ghost btn-xs" type="button" onclick="window.OurgoalSanctuaryV3.openBgPickerModal();" style="padding:3px 7px;font-size:0.72rem;" title="누르면: 이 날짜에 실천한 인증 사진을 달력 배경으로 등록합니다">🖼️ 사진</button>' +
            '<button class="btn btn-ghost btn-xs" type="button" onclick="window.OurgoalSanctuaryV3.openDayHubModal();" style="padding:3px 7px;font-size:0.72rem;" title="누르면: 이 날짜의 타임라인, 메모, 할 일을 한 번에 관리합니다">📅 허브</button>' +
            '<button class="btn btn-primary btn-xs" type="button" onclick="window.OurgoalSanctuaryV3.openAddScheduleModal();" style="padding:3px 9px;font-size:0.72rem;" title="누르면: 이 날짜에 새로운 실천 일정을 등록합니다">+ 일정 추가</button>' +
          '</div>' +
        '</div>' +
        itemsListDetailHtml +
      '</div>';
    return contentHtml;
  }

  // [#TASK-ES-429] renderSanctuaryCalendar 의 「engine.activeCalMode === 'timeline'」 분기 본문 — 이전 전 602~655줄 글자 그대로.
  //   렌더 함수 지역 변수(contentHtml·itemsByDate)는 인자로 받는다, 바뀐 contentHtml 을 돌려준다.
  function renderSanctuaryCalendarTimeline(contentHtml, itemsByDate) {
      var todayKey = T.engine.selectedCalDate || T.getTodayStr();
      var todayItems = itemsByDate[todayKey] || [];

      var rowsHtml = '';
      if (todayItems.length === 0) {
        rowsHtml = '<div style="text-align:center;padding:36px 14px;color:var(--ink-sub);font-size:0.875rem;">' +
          '선택된 일자(' + todayKey + ')에 등록된 타임라인 일정이 없습니다.<br>새 일정을 추가하여 하루 실천 궤적을 기록해보세요.' +
        '</div>';
      } else {
        rowsHtml = todayItems.map(function(item) {
          var timeStr = '종일';
          if (item.date && item.date.indexOf('T') !== -1) {
            var tPart = item.date.split('T')[1];
            if (tPart) timeStr = tPart.slice(0, 5);
          } else if (item.time) {
            timeStr = item.time;
          }
          var isDone = !!item.done;
          var schedId = item.schedId || item.id || '';
          var kind = item.kind || 'custom';
          var goalId = item.goalId || '';
          var msId = item.msId || '';
          var taskId = item.taskId || '';

          return '<div class="s-timeline-row ' + (isDone ? 'done' : 'active') + '" style="display:flex;align-items:center;gap:10px;padding:4px 0;">' +
            '<span class="s-t-time" style="font-size:0.75rem;font-weight:700;color:var(--ink-soft);min-width:38px;text-align:center;">' + timeStr + '</span>' +
            '<div class="s-t-block" style="flex:1;display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-radius:10px;cursor:pointer;" onclick="window.OurgoalSanctuaryV3.openScheduleDetail(\'' + todayKey + '\', \'' + schedId + '\', \'' + kind + '\', \'' + goalId + '\');">' +
              '<span class="s-t-title" style="font-size:0.875rem;font-weight:600;' + (isDone ? 'text-decoration:line-through;opacity:0.6;' : '') + '">' + T.escapeHtml(item.title || item.text) + '</span>' +
              '<button type="button" class="s-t-badge ' + (isDone ? '' : 'active') + '" style="border:none;cursor:pointer;background:transparent;padding:4px 8px;border-radius:6px;" onclick="event.stopPropagation(); window.OurgoalSanctuaryV3.toggleScheduleItem(\'' + schedId + '\', \'' + kind + '\', \'' + goalId + '\', \'' + msId + '\', \'' + taskId + '\');">' +
                (isDone ? '✓ 완료' : '⚡ 진행 중') +
              '</button>' +
            '</div>' +
          '</div>';
        }).join('');
      }

      contentHtml = '<div class="s-timeline-card">' +
        '<div class="s-timeline-header" style="flex-wrap:wrap;gap:8px;">' +
          '<div style="display:flex;align-items:center;gap:6px;">' +
            '<button class="s-cal-arrow" type="button" style="padding:6px 10px;min-height:36px;min-width:36px;" onclick="window.OurgoalSanctuaryV3.shiftTimelineDay(-1)">◀</button>' +
            '<h4 style="margin:0;white-space:nowrap;font-size:0.95rem;">' + todayKey + ' 타임라인</h4>' +
            '<button class="s-cal-arrow" type="button" style="padding:6px 10px;min-height:36px;min-width:36px;" onclick="window.OurgoalSanctuaryV3.shiftTimelineDay(1)">▶</button>' +
            '<span class="s-cal-today-badge" style="cursor:pointer;" onclick="window.OurgoalSanctuaryV3.selectToday()">오늘</span>' +
          '</div>' +
          '<span class="s-timeline-status">실천 ' + todayItems.length + '건</span>' +
        '</div>' +
        '<div class="s-timeline-track">' +
          rowsHtml +
        '</div>' +
        '<div style="margin-top:14px;display:flex;justify-content:space-between;align-items:center;gap:8px;">' +
          '<button class="btn btn-ghost btn-sm" type="button" onclick="window.OurgoalSanctuaryV3.openDayHubModal();">📅 일자 종합 허브</button>' +
          '<button class="btn btn-primary btn-sm" type="button" onclick="window.OurgoalSanctuaryV3.openAddScheduleModal();">+ 새 일정 등록</button>' +
        '</div>' +
      '</div>';
    return contentHtml;
  }

  K.renderSanctuaryCalendarMonth = renderSanctuaryCalendarMonth;
  K.renderSanctuaryCalendarTimeline = renderSanctuaryCalendarTimeline;
})(window);
