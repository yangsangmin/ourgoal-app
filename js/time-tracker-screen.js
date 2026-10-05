/**
 * OurGoal Time Tracker Cell: 몰입 화면 만들기·버튼 배선 — 전체화면 덮개 #timeTrackerOverlay 의 DOM 을 한 번 만들고(initDOM) 모드 탭·프리셋·조절기·회전·닫기·취소·저장·ESC·회전 감지를 배선(bindEvents) (#TASK-ES-407 · 시간기록 세포 쪼개기)
 *
 * js/time-tracker.js(1220줄)에서 동작 그대로 옮겼다(이전 전 123~410줄).
 *   initDOM · bindEvents
 * 바꾼 것은 이름 참조뿐이다 — 원본 스코프 이름은 T.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 바깥에서는 이전과 같이 window.OurgoalTimeTracker(open·close·switchMode·getState)로 부른다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // T = js/time-tracker.js 의 스코프 통로 — 원본 IIFE 에 남은 함수·상태(tracker)를 getter(대입하는 이름은 setter 도)로 읽는다(원본이 로드될 때 채운다). 값은 읽을 때마다 살아 있는 값이다.
  // K = 시간기록 세포 키트의 screen 칸 — 옮긴 함수를 담는다. 원본은 IIFE 맨 위에서 K 의 함수를 같은 이름으로 가져온다(전역 이름을 함수마다 늘리지 않는다).
  var KIT = global.OurgoalTimeTrackerKit = global.OurgoalTimeTrackerKit || {};
  var K = KIT.screen = KIT.screen || {};
  var T = K.scope = K.scope || {};

  /**
   * DOM 생성 및 1회 초기화
   */
  function initDOM() {
    if (document.getElementById('timeTrackerOverlay')) return;

    var overlay = document.createElement('div');
    overlay.id = 'timeTrackerOverlay';
    overlay.className = 'tt-overlay hidden';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', '지금부터 시간기록 몰입 화면');

    overlay.innerHTML = 
      '<div class="tt-wrapper" id="ttWrapper">' +
        '<!-- 헤더 -->' +
        '<header class="tt-header">' +
          '<div class="tt-mode-tabs">' +
            '<button type="button" class="tt-mode-tab active" id="ttTabStopwatch">⏱️ 스톱워치</button>' +
            '<button type="button" class="tt-mode-tab" id="ttTabTimer">⏳ 타이머</button>' +
          '</div>' +
          '<div class="tt-header-actions">' +
            '<button type="button" class="tt-icon-btn" id="btnTtRotateToggle" title="가로/세로 화면 회전 토글" aria-label="화면 회전">' +
              '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                '<path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>' +
              '</svg>' +
            '</button>' +
            '<button type="button" class="tt-icon-btn" id="btnTtClose" title="닫기" aria-label="닫기">' +
              '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>' +
              '</svg>' +
            '</button>' +
          '</div>' +
        '</header>' +

        '<!-- [뷰 A] 타이머/스톱워치 측정 뷰 -->' +
        '<main class="tt-body" id="ttMeasureView">' +
          '<div class="tt-clock-card">' +
            '<div class="tt-status-badge" id="ttStatusBadge">' +
              '<span class="tt-status-dot"></span><span id="ttStatusText">측정 대기</span>' +
            '</div>' +
            '<div class="tt-digits" id="ttDigits">00:00:00</div>' +
            '<div class="tt-digits-sub" id="ttDigitsSub">.00</div>' +
          '</div>' +

          '<!-- 타이머 모드 전용 시간 설정 컨트롤러 -->' +
          '<div class="tt-timer-setup" id="ttTimerSetup" style="display:none;">' +
            '<div class="tt-timer-presets">' +
              '<button type="button" class="tt-preset-chip" data-tsec="300">+5분</button>' +
              '<button type="button" class="tt-preset-chip" data-tsec="600">+10분</button>' +
              '<button type="button" class="tt-preset-chip active" data-tsec="1500">25분 (뽀모도로)</button>' +
              '<button type="button" class="tt-preset-chip" data-tsec="1800">+30분</button>' +
              '<button type="button" class="tt-preset-chip" data-tsec="3600">+1시간</button>' +
              '<button type="button" class="tt-preset-chip" id="btnTtTimerResetPreset" style="color:#f87171;">리셋</button>' +
            '</div>' +
            '<div class="tt-timer-adjusters">' +
              '<div class="tt-adjust-unit">' +
                '<button type="button" class="tt-adjust-btn" id="btnTtTimerHourUp">▲</button>' +
                '<div class="tt-adjust-val" id="ttTimerValHour">00</div>' +
                '<button type="button" class="tt-adjust-btn" id="btnTtTimerHourDown">▼</button>' +
                '<span class="tt-adjust-label">시간</span>' +
              '</div>' +
              '<div class="tt-adjust-sep">:</div>' +
              '<div class="tt-adjust-unit">' +
                '<button type="button" class="tt-adjust-btn" id="btnTtTimerMinUp">▲</button>' +
                '<div class="tt-adjust-val" id="ttTimerValMin">25</div>' +
                '<button type="button" class="tt-adjust-btn" id="btnTtTimerMinDown">▼</button>' +
                '<span class="tt-adjust-label">분</span>' +
              '</div>' +
              '<div class="tt-adjust-sep">:</div>' +
              '<div class="tt-adjust-unit">' +
                '<button type="button" class="tt-adjust-btn" id="btnTtTimerSecUp">▲</button>' +
                '<div class="tt-adjust-val" id="ttTimerValSec">00</div>' +
                '<button type="button" class="tt-adjust-btn" id="btnTtTimerSecDown">▼</button>' +
                '<span class="tt-adjust-label">초</span>' +
              '</div>' +
            '</div>' +
          '</div>' +

          '<!-- 구간 메모 작성 인라인 컨테이너 (#TASK-ES-172, [44], [55]) -->' +
          '<div class="tt-lap-memo-container" id="ttLapMemoContainer" style="display:none;"></div>' +

          '<!-- 구간기록 목록 -->' +
          '<div class="tt-laps-wrapper" id="ttLapsWrapper" style="display:none;">' +
            '<div id="ttLapsList"></div>' +
          '</div>' +
        '</main>' +

        '<!-- [뷰 B] 세션 종료 후 기록 작성 뷰 (Review) -->' +
        '<div class="tt-review-view" id="ttReviewView" style="display:none;">' +
          '<div class="tt-review-summary-card">' +
            '<div class="tt-form-label" style="color:#94a3b8;" id="ttReviewHeaderTitle">방금 완료한 시간 기록</div>' +
            '<div class="tt-review-total-time" id="ttReviewTotalTime">00:00:00</div>' +
            '<div style="font-size:12px;color:#cbd5e1;" id="ttReviewLapCount">총 0개 구간 기록됨</div>' +
          '</div>' +

          '<div class="tt-form-group">' +
            '<label class="tt-form-label" for="ttActivityTitle">오늘 어떤 활동을 하셨나요? <span style="color:#f87171;">*</span></label>' +
            '<input type="text" class="tt-input" id="ttActivityTitle" placeholder="예: 코딩 개발, 자격증 공부, 독서, 헬스 운동, 여행준비 등">' +
          '</div>' +

          '<div class="tt-form-group" id="ttReviewLapsGroup" style="display:none;">' +
            '<label class="tt-form-label">구간별 활동 상세 기록</label>' +
            '<div class="tt-review-laps-list" id="ttReviewLapsList"></div>' +
          '</div>' +

          '<div class="tt-review-actions">' +
            '<button type="button" class="tt-btn tt-btn-danger" id="btnTtCancelReview">취소</button>' +
            '<button type="button" class="tt-btn tt-btn-success" id="btnTtSaveRecord">내 기록에 저장</button>' +
          '</div>' +
        '</div>' +

        '<!-- 컨트롤 바 -->' +
        '<footer class="tt-controls" id="ttControls">' +
          '<!-- 상태에 따라 동적 렌더링 -->' +
        '</footer>' +
      '</div>' +

      '<!-- 취소 확인 2중 안전 경고 팝업 -->' +
      '<div class="tt-dialog-backdrop hidden" id="ttCancelConfirmDialog" style="display:none;">' +
        '<div class="tt-dialog-box">' +
          '<div class="tt-dialog-icon">⚠️</div>' +
          '<div class="tt-dialog-title">정말 취소하시겠습니까?</div>' +
          '<div class="tt-dialog-desc">이번 세션의 시간기록과 연계된 기록이 모두 삭제됩니다. 정말 취소하시겠습니까?</div>' +
          '<div class="tt-dialog-actions">' +
            '<button type="button" class="tt-btn tt-btn-secondary" id="btnTtCancelNo">취소 안함</button>' +
            '<button type="button" class="tt-btn tt-btn-danger" id="btnTtCancelYes">정말 취소</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    // DOM 캐싱
    T.tracker.dom = {
      overlay: overlay,
      wrapper: document.getElementById('ttWrapper'),
      measureView: document.getElementById('ttMeasureView'),
      lapMemoContainer: document.getElementById('ttLapMemoContainer'),
      reviewView: document.getElementById('ttReviewView'),
      digits: document.getElementById('ttDigits'),
      digitsSub: document.getElementById('ttDigitsSub'),
      statusBadge: document.getElementById('ttStatusBadge'),
      statusText: document.getElementById('ttStatusText'),
      lapsWrapper: document.getElementById('ttLapsWrapper'),
      lapsList: document.getElementById('ttLapsList'),
      controls: document.getElementById('ttControls'),
      rotateBtn: document.getElementById('btnTtRotateToggle'),
      closeBtn: document.getElementById('btnTtClose'),
      tabStopwatch: document.getElementById('ttTabStopwatch'),
      tabTimer: document.getElementById('ttTabTimer'),
      timerSetup: document.getElementById('ttTimerSetup'),
      valHour: document.getElementById('ttTimerValHour'),
      valMin: document.getElementById('ttTimerValMin'),
      valSec: document.getElementById('ttTimerValSec'),
      btnHourUp: document.getElementById('btnTtTimerHourUp'),
      btnHourDown: document.getElementById('btnTtTimerHourDown'),
      btnMinUp: document.getElementById('btnTtTimerMinUp'),
      btnMinDown: document.getElementById('btnTtTimerMinDown'),
      btnSecUp: document.getElementById('btnTtTimerSecUp'),
      btnSecDown: document.getElementById('btnTtTimerSecDown'),
      btnResetPreset: document.getElementById('btnTtTimerResetPreset'),
      reviewHeaderTitle: document.getElementById('ttReviewHeaderTitle'),
      reviewTotalTime: document.getElementById('ttReviewTotalTime'),
      reviewLapCount: document.getElementById('ttReviewLapCount'),
      activityTitle: document.getElementById('ttActivityTitle'),
      reviewLapsGroup: document.getElementById('ttReviewLapsGroup'),
      reviewLapsList: document.getElementById('ttReviewLapsList'),
      cancelReviewBtn: document.getElementById('btnTtCancelReview'),
      saveRecordBtn: document.getElementById('btnTtSaveRecord'),
      confirmDialog: document.getElementById('ttCancelConfirmDialog'),
      confirmNoBtn: document.getElementById('btnTtCancelNo'),
      confirmYesBtn: document.getElementById('btnTtCancelYes')
    };

    bindEvents();
  }

  /**
   * 4위 1체 이벤트 리스너 바인딩
   */
  function bindEvents() {
    var d = T.tracker.dom;

    // 1. 모드 탭 (스톱워치 / 타이머 전환)
    d.tabStopwatch.onclick = async function() {
      if (T.tracker.mode === 'stopwatch') return;
      if (T.tracker.state !== 'idle') {
        if (!(await T.askConfirm('현재 측정을 초기화하고 스톱워치로 변경하시겠습니까?'))) return;
      }
      T.switchMode('stopwatch');
    };

    d.tabTimer.onclick = async function() {
      if (T.tracker.mode === 'timer') return;
      if (T.tracker.state !== 'idle') {
        if (!(await T.askConfirm('현재 측정을 초기화하고 타이머로 변경하시겠습니까?'))) return;
      }
      T.switchMode('timer');
    };

    // 2. 타이머 퀵 프리셋 버튼 바인딩
    d.timerSetup.querySelectorAll('[data-tsec]').forEach(function(btn) {
      btn.onclick = function() {
        var sec = parseInt(btn.dataset.tsec, 10);
        if (sec === 1500) {
          // 뽀모도로(25분)는 즉시 25분 세팅
          T.tracker.timerTargetSeconds = 1500;
        } else {
          T.tracker.timerTargetSeconds = Math.min(86399, T.tracker.timerTargetSeconds + sec);
        }
        T.updateTimerDisplay();
        d.timerSetup.querySelectorAll('.tt-preset-chip').forEach(function(c){ c.classList.remove('active'); });
        btn.classList.add('active');
      };
    });

    d.btnResetPreset.onclick = function() {
      T.tracker.timerTargetSeconds = 0;
      T.updateTimerDisplay();
      d.timerSetup.querySelectorAll('.tt-preset-chip').forEach(function(c){ c.classList.remove('active'); });
    };

    // 3. 타이머 시/분/초 증감 조절기
    d.btnHourUp.onclick = function() { T.adjustTimerUnit(3600); };
    d.btnHourDown.onclick = function() { T.adjustTimerUnit(-3600); };
    d.btnMinUp.onclick = function() { T.adjustTimerUnit(60); };
    d.btnMinDown.onclick = function() { T.adjustTimerUnit(-60); };
    d.btnSecUp.onclick = function() { T.adjustTimerUnit(10); };
    d.btnSecDown.onclick = function() { T.adjustTimerUnit(-10); };

    // 4. 화면 회전 수동 토글
    d.rotateBtn.onclick = function() {
      T.tracker.forcedLandscape = !T.tracker.forcedLandscape;
      if (T.tracker.forcedLandscape) {
        d.wrapper.classList.add('tt-forced-landscape');
        d.rotateBtn.style.color = '#60a5fa';
        d.rotateBtn.style.background = 'rgba(59,130,246,0.2)';
      } else {
        d.wrapper.classList.remove('tt-forced-landscape');
        d.rotateBtn.style.color = '';
        d.rotateBtn.style.background = '';
      }
    };

    // 5. 닫기 버튼
    d.closeBtn.onclick = function() {
      T.handleCloseAttempt();
    };

    // 6. 작성 취소 버튼 -> 경고 팝업
    d.cancelReviewBtn.onclick = function() {
      T.showCancelDialog();
    };

    // 7. 경고 팝업: 취소 안함
    d.confirmNoBtn.onclick = function() {
      T.hideCancelDialog();
    };

    // 8. 경고 팝업: 정말 취소
    d.confirmYesBtn.onclick = function() {
      T.hideCancelDialog();
      T.closeTrackerOverlay();
    };

    // 9. 내 기록에 저장 버튼
    d.saveRecordBtn.onclick = function() {
      T.handleSaveRecord();
    };

    // 10. ESC 키 가드
    window.addEventListener('keydown', function(e) {
      if (!T.tracker.isOpen) return;
      if (e.key === 'Escape') {
        if (T.tracker.dom.lapMemoContainer && T.tracker.dom.lapMemoContainer.style.display !== 'none') {
          T.tracker.dom.lapMemoContainer.style.display = 'none';
          T.tracker.dom.lapMemoContainer.innerHTML = '';
          if (T.tracker.dom.measureView) T.tracker.dom.measureView.classList.remove('tt-memo-active');
          return;
        }
        T.handleCloseAttempt();
      }
    });

    // 11. 기기 실제 회전 감지
    window.addEventListener('resize', T.handleScreenResize);
  }

  K.initDOM = initDOM;
  K.bindEvents = bindEvents;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
