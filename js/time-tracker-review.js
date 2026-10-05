/**
 * OurGoal Time Tracker Cell: 기록 작성·내 기록 저장 — 측정을 마친 뒤 활동명·구간별 내용을 적는 화면(openReviewView)과 state.profile.records 저장(handleSaveRecord) (#TASK-ES-407 · 시간기록 세포 쪼개기)
 *
 * js/time-tracker.js(1220줄)에서 동작 그대로 옮겼다(이전 전 1023~1179줄).
 *   openReviewView · handleSaveRecord
 * 바꾼 것은 이름 참조뿐이다 — 원본 스코프 이름은 T.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 바깥에서는 이전과 같이 window.OurgoalTimeTracker(open·close·switchMode·getState)로 부른다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // T = js/time-tracker.js 의 스코프 통로 — 원본 IIFE 에 남은 함수·상태(tracker)를 getter(대입하는 이름은 setter 도)로 읽는다(원본이 로드될 때 채운다). 값은 읽을 때마다 살아 있는 값이다.
  // K = 시간기록 세포 키트의 review 칸 — 옮긴 함수를 담는다. 원본은 IIFE 맨 위에서 K 의 함수를 같은 이름으로 가져온다(전역 이름을 함수마다 늘리지 않는다).
  var KIT = global.OurgoalTimeTrackerKit = global.OurgoalTimeTrackerKit || {};
  var K = KIT.review = KIT.review || {};
  var T = K.scope = K.scope || {};

  /**
   * 세션 종료 후 기록 작성 화면 진입
   */
  function openReviewView(elapsedMs) {
    var d = T.tracker.dom;
    d.measureView.style.display = 'none';
    d.controls.style.display = 'none';
    d.reviewView.style.display = 'flex';

    var f = T.formatTime(elapsedMs);
    var modeBadgeText = T.tracker.mode === 'timer' ? '⏳ 타이머 완료' : '⏱️ 스톱워치 기록';
    d.reviewHeaderTitle.textContent = modeBadgeText + ' (' + f.timeStr + ')';
    d.reviewTotalTime.textContent = f.timeStr;
    d.reviewLapCount.textContent = '총 ' + T.tracker.laps.length + '개 구간 측정 완료';

    // 구간별 작성 내용이 있으면 활동명 기본값 설정 및 프리필
    var hasLapNotes = T.tracker.laps.some(function(l){ return l.text && l.text.trim(); });
    if (hasLapNotes && !d.activityTitle.value) {
      d.activityTitle.value = T.tracker.mode === 'timer' ? '집중 타이머 세션' : '스톱워치 몰입 세션';
    } else if (!d.activityTitle.value) {
      d.activityTitle.value = '';
    }
    d.activityTitle.focus();

    // 구간별 작성 필드 렌더링
    var lapsList = d.reviewLapsList;
    lapsList.innerHTML = '';

    if (T.tracker.laps.length > 0) {
      d.reviewLapsGroup.style.display = 'block';
      var quickReviewTags = ['🏃 러닝', '📚 공부', '💻 코딩', '📖 독서', '☕ 휴식', '🎯 몰입', '💪 운동'];
      T.tracker.laps.forEach(function(lap) {
        var card = document.createElement('div');
        card.className = 'tt-review-lap-card';
        var safeVal = (lap.text || '').replace(/"/g, '&quot;');
        card.innerHTML = 
          '<div class="tt-review-lap-head">' +
            '<div style="display:flex;align-items:center;gap:7px;">' +
              '<span class="tt-review-lap-badge">구간 ' + lap.lapNum + '</span>' +
              '<span class="tt-review-lap-time" style="font-weight:800;color:#e2e8f0;">+' + lap.formattedDuration + '</span>' +
            '</div>' +
            '<span class="tt-review-lap-split" style="font-size:0.75rem;color:#94a3b8;font-family:ui-monospace,SF Mono,monospace;">누적 ' + lap.formattedSplit + '</span>' +
          '</div>' +
          '<div style="display:flex;gap:4px;margin-bottom:8px;overflow-x:auto;" class="no-scrollbar">' +
            quickReviewTags.map(function(tag){
              return '<button type="button" class="btn-lap-card-tag">' + tag + '</button>';
            }).join('') +
          '</div>' +
          '<input type="text" class="tt-input tt-lap-input" data-lap-idx="' + (lap.lapNum - 1) + '" ' +
                 'value="' + safeVal + '" ' +
                 'placeholder="' + lap.lapNum + '구간 집중 활동 입력 (예: 1단원 문제풀이, UI 코딩 등)">';

        var inEl = card.querySelector ? card.querySelector('.tt-lap-input') : null;
        if (card.querySelectorAll) {
          card.querySelectorAll('.btn-lap-card-tag').forEach(function(chip){
            chip.onclick = function(){
              if(!inEl) return;
              if(inEl.value.trim()){
                inEl.value = inEl.value.trim() + ' ' + chip.textContent;
              } else {
                inEl.value = chip.textContent;
              }
              chip.style.background = 'rgba(99,102,241,0.25)';
              chip.style.borderColor = '#6366f1';
              chip.style.color = '#fff';
            };
          });
        }
        lapsList.appendChild(card);
      });
    } else {
      d.reviewLapsGroup.style.display = 'none';
    }
  }

  /**
   * 7. 내 기록에 영속 저장 (Save to records)
   */
  function handleSaveRecord() {
    var d = T.tracker.dom;
    var title = d.activityTitle.value.trim();
    if (!title) {
      if (typeof toast === 'function') toast('어떤 활동을 하셨는지 입력해주세요.');
      d.activityTitle.focus();
      return;
    }

    // 구간별 입력값 수집
    var lapInputs = d.reviewLapsList.querySelectorAll('.tt-lap-input');
    lapInputs.forEach(function(input) {
      var idx = parseInt(input.dataset.lapIdx, 10);
      if (T.tracker.laps[idx]) {
        T.tracker.laps[idx].text = input.value.trim();
      }
    });

    var totalMs = T.tracker.mode === 'timer' ? T.tracker.timerElapsedMs : T.tracker.elapsedBeforePause;
    var formatted = T.formatTime(totalMs);
    var now = new Date();
    var startTime = new Date(now.getTime() - totalMs);

    var modeTag = T.tracker.mode === 'timer' ? '⏳ 타이머' : '⏱️ 스톱워치';
    var textBody = modeTag + ' [' + formatted.timeStr + '] ' + title;
    if (T.tracker.laps.length > 0) {
      textBody += '\n\n[구간별 상세 내역]';
      T.tracker.laps.forEach(function(l) {
        var lapDesc = l.text ? (' - ' + l.text) : '';
        textBody += '\n• 구간 ' + l.lapNum + ' (' + l.formattedDuration + ')' + lapDesc;
      });
    }

    // 레코드 객체 생성
    var newRecord = {
      id: 'rec_tt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      type: 'time_record',
      mode: T.tracker.mode,
      category: '시간기록',
      theme: 'growth',
      subTheme: T.tracker.mode === 'timer' ? 'timer_focus' : 'time_tracker',
      themeConfidence: 0.99,
      text: textBody,
      title: title,
      startAt: startTime.toISOString(),
      endAt: now.toISOString(),
      durationMs: totalMs,
      totalSeconds: formatted.totalSeconds,
      formattedTime: formatted.timeStr,
      laps: T.tracker.laps.slice(),
      createdAt: now.toISOString()
    };

    // 전역 상태에 무손실 저장
    if (typeof state !== 'undefined') {
      if (!state.profile) state.profile = {};
      if (!Array.isArray(state.profile.records)) state.profile.records = [];
      state.profile.records.unshift(newRecord);

      if (typeof saveProfile === 'function') {
        saveProfile();
      } else if (typeof saveState === 'function') {
        saveState();
      }

      if (typeof renderRecordsScreen === 'function') {
        renderRecordsScreen();
      }
      if (typeof renderHome === 'function') {
        renderHome();
      }
    }

    if (typeof toast === 'function') {
      toast('시간 기록이 내 기록에 성공적으로 저장되었습니다! 🎉');
    }

    T.closeTrackerOverlay();
  }

  K.openReviewView = openReviewView;
  K.handleSaveRecord = handleSaveRecord;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
