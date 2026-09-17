/**
 * js/time-tracker.js — 아워골 기록탭 '지금부터 시간기록' (스톱워치 & 타이머) 완전 통합 모듈
 * 
 * 최고 헌법 제2조(Zero-Omission 무누락) 및 제3조(4위 1체 배선) 준수:
 * - 전체화면 스톱워치 및 타이머(카운트다운) 듀얼 엔진
 * - 기기 회전 센서 연동 + 수동 가로/세로 전환
 * - 뽀모도로(25분), 10분, 30분, 1시간 퀵 프리셋 및 시/분/초 정밀 조절기
 * - 정밀 타임스탬프 기반 구간기록(Lap)
 * - 타이머 완료 시 Web Audio 비프음 및 축하 화면
 * - 세션 종료 후 활동명 및 구간별 내용 작성
 * - 취소 시 2중 안전 경고 모달 ("정말 취소하시겠습니까?")
 * - 내 기록(state.profile.records) 무손실 저장 및 실시간 화면 전파
 */

(function(global) {
  'use strict';

  // 내부 상태 객체
  var tracker = {
    isOpen: false,
    mode: 'stopwatch', // 'stopwatch' | 'timer'
    state: 'idle',     // 'idle' | 'running' | 'paused' | 'completed'
    startTime: 0,
    elapsedBeforePause: 0,
    rafId: null,
    laps: [],          // [{ lapNum, splitMs, durationMs, formattedDuration, formattedSplit, text: '' }]
    lastLapElapsed: 0,
    forcedLandscape: false,

    // 타이머 전용 상태
    timerTargetSeconds: 1500, // 기본값: 25분 (1500초)
    timerRemainingMs: 1500000,
    timerRemainingBeforePause: 1500000,
    timerElapsedMs: 0,

    dom: {}
  };

  function safeRaf(cb) {
    if (typeof requestAnimationFrame === 'function') return requestAnimationFrame(cb);
    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') return window.requestAnimationFrame(cb);
    return setTimeout(cb, 50);
  }

  function safeCaf(id) {
    if (!id) return;
    if (typeof cancelAnimationFrame === 'function') return cancelAnimationFrame(id);
    if (typeof window !== 'undefined' && typeof window.cancelAnimationFrame === 'function') return window.cancelAnimationFrame(id);
    clearTimeout(id);
  }

  /**
   * 비프음 재생 (외부 오디오 파일 의존 없는 Web Audio API 순수 톤)
   */
  function playTimerBeep() {
    try {
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      var ctx = new AudioCtx();
      var playTone = function(freq, start, duration) {
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };
      playTone(880, 0, 0.2);
      playTone(880, 0.3, 0.2);
      playTone(1174, 0.6, 0.6);
    } catch(e) {}
  }

  /**
   * 밀리초를 HH:MM:SS 및 ms 서브 문자열로 변환
   */
  function formatTime(ms) {
    var totalSeconds = Math.max(0, Math.floor(ms / 1000));
    var hours = Math.floor(totalSeconds / 3600);
    var minutes = Math.floor((totalSeconds % 3600) / 60);
    var seconds = totalSeconds % 60;
    var centiseconds = Math.floor((Math.max(0, ms) % 1000) / 10);

    var hh = String(hours).padStart(2, '0');
    var mm = String(minutes).padStart(2, '0');
    var ss = String(seconds).padStart(2, '0');
    var cs = String(centiseconds).padStart(2, '0');

    return {
      timeStr: hh + ':' + mm + ':' + ss,
      subStr: '.' + cs,
      totalSeconds: totalSeconds,
      hours: hours,
      minutes: minutes,
      seconds: seconds
    };
  }

  /**
   * 현재 경과 시간(ms) 계산
   */
  function getElapsedMs() {
    if (tracker.mode === 'stopwatch') {
      if (tracker.state === 'running') {
        return tracker.elapsedBeforePause + (Date.now() - tracker.startTime);
      }
      return tracker.elapsedBeforePause;
    } else {
      // 타이머 모드: 설정시간에서 남은시간을 뺀 실제 수행 시간
      if (tracker.state === 'running') {
        var passed = Date.now() - tracker.startTime;
        var rem = Math.max(0, tracker.timerRemainingBeforePause - passed);
        return Math.max(0, (tracker.timerTargetSeconds * 1000) - rem);
      }
      return tracker.timerElapsedMs;
    }
  }

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
    tracker.dom = {
      overlay: overlay,
      wrapper: document.getElementById('ttWrapper'),
      measureView: document.getElementById('ttMeasureView'),
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
    var d = tracker.dom;

    // 1. 모드 탭 (스톱워치 / 타이머 전환)
    d.tabStopwatch.onclick = function() {
      if (tracker.mode === 'stopwatch') return;
      if (tracker.state !== 'idle') {
        if (!confirm('현재 측정을 초기화하고 스톱워치로 변경하시겠습니까?')) return;
      }
      switchMode('stopwatch');
    };

    d.tabTimer.onclick = function() {
      if (tracker.mode === 'timer') return;
      if (tracker.state !== 'idle') {
        if (!confirm('현재 측정을 초기화하고 타이머로 변경하시겠습니까?')) return;
      }
      switchMode('timer');
    };

    // 2. 타이머 퀵 프리셋 버튼 바인딩
    d.timerSetup.querySelectorAll('[data-tsec]').forEach(function(btn) {
      btn.onclick = function() {
        var sec = parseInt(btn.dataset.tsec, 10);
        if (sec === 1500) {
          // 뽀모도로(25분)는 즉시 25분 세팅
          tracker.timerTargetSeconds = 1500;
        } else {
          tracker.timerTargetSeconds = Math.min(86399, tracker.timerTargetSeconds + sec);
        }
        updateTimerDisplay();
        d.timerSetup.querySelectorAll('.tt-preset-chip').forEach(function(c){ c.classList.remove('active'); });
        btn.classList.add('active');
      };
    });

    d.btnResetPreset.onclick = function() {
      tracker.timerTargetSeconds = 0;
      updateTimerDisplay();
      d.timerSetup.querySelectorAll('.tt-preset-chip').forEach(function(c){ c.classList.remove('active'); });
    };

    // 3. 타이머 시/분/초 증감 조절기
    d.btnHourUp.onclick = function() { adjustTimerUnit(3600); };
    d.btnHourDown.onclick = function() { adjustTimerUnit(-3600); };
    d.btnMinUp.onclick = function() { adjustTimerUnit(60); };
    d.btnMinDown.onclick = function() { adjustTimerUnit(-60); };
    d.btnSecUp.onclick = function() { adjustTimerUnit(10); };
    d.btnSecDown.onclick = function() { adjustTimerUnit(-10); };

    // 4. 화면 회전 수동 토글
    d.rotateBtn.onclick = function() {
      tracker.forcedLandscape = !tracker.forcedLandscape;
      if (tracker.forcedLandscape) {
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
      handleCloseAttempt();
    };

    // 6. 작성 취소 버튼 -> 경고 팝업
    d.cancelReviewBtn.onclick = function() {
      showCancelDialog();
    };

    // 7. 경고 팝업: 취소 안함
    d.confirmNoBtn.onclick = function() {
      hideCancelDialog();
    };

    // 8. 경고 팝업: 정말 취소
    d.confirmYesBtn.onclick = function() {
      hideCancelDialog();
      closeModal();
    };

    // 9. 내 기록에 저장 버튼
    d.saveRecordBtn.onclick = function() {
      handleSaveRecord();
    };

    // 10. ESC 키 가드
    window.addEventListener('keydown', function(e) {
      if (!tracker.isOpen) return;
      if (e.key === 'Escape') {
        handleCloseAttempt();
      }
    });

    // 11. 기기 실제 회전 감지
    window.addEventListener('resize', handleScreenResize);
  }

  /**
   * 타이머 증감 헬퍼
   */
  function adjustTimerUnit(deltaSec) {
    tracker.timerTargetSeconds = Math.max(0, Math.min(86399, tracker.timerTargetSeconds + deltaSec));
    updateTimerDisplay();
  }

  /**
   * 타이머 설정 화면 수치 동기화
   */
  function updateTimerDisplay() {
    var sec = tracker.timerTargetSeconds;
    var h = Math.floor(sec / 3600);
    var m = Math.floor((sec % 3600) / 60);
    var s = sec % 60;

    var hh = String(h).padStart(2, '0');
    var mm = String(m).padStart(2, '0');
    var ss = String(s).padStart(2, '0');

    tracker.dom.valHour.textContent = hh;
    tracker.dom.valMin.textContent = mm;
    tracker.dom.valSec.textContent = ss;

    if (tracker.state === 'idle') {
      tracker.dom.digits.textContent = hh + ':' + mm + ':' + ss;
      tracker.dom.digitsSub.textContent = '.00';
    }
  }

  /**
   * 모드 전환 (스톱워치 ↔ 타이머)
   */
  function switchMode(newMode) {
    resetTracker();
    tracker.mode = newMode;
    var d = tracker.dom;

    if (newMode === 'stopwatch') {
      d.tabStopwatch.classList.add('active');
      d.tabTimer.classList.remove('active');
      d.timerSetup.style.display = 'none';
      d.digits.textContent = '00:00:00';
      d.digitsSub.textContent = '.00';
    } else {
      d.tabTimer.classList.add('active');
      d.tabStopwatch.classList.remove('active');
      d.timerSetup.style.display = 'flex';
      updateTimerDisplay();
    }

    renderControls();
  }

  /**
   * 화면 리사이즈/회전 자동 감지
   */
  function handleScreenResize() {
    if (!tracker.isOpen) return;
    var isLandscape = window.innerWidth > window.innerHeight;
    if (isLandscape && !tracker.forcedLandscape) {
      tracker.dom.wrapper.classList.add('tt-forced-landscape');
    } else if (!isLandscape && !tracker.forcedLandscape) {
      tracker.dom.wrapper.classList.remove('tt-forced-landscape');
    }
  }

  /**
   * 닫기 시도 시 안전 처리
   */
  function handleCloseAttempt() {
    var hasProgress = (tracker.state === 'running' || tracker.state === 'paused' || tracker.laps.length > 0 || getElapsedMs() > 0);
    if (hasProgress) {
      showCancelDialog();
    } else {
      closeModal();
    }
  }

  /**
   * 취소 확인 경고 다이얼로그 노출
   */
  function showCancelDialog() {
    tracker.dom.confirmDialog.style.display = 'flex';
    tracker.dom.confirmDialog.classList.remove('hidden');
  }

  /**
   * 취소 확인 다이얼로그 닫기
   */
  function hideCancelDialog() {
    tracker.dom.confirmDialog.style.display = 'none';
    tracker.dom.confirmDialog.classList.add('hidden');
  }

  /**
   * 하단 컨트롤 버튼셋 상태별 렌더링 (Zero-Dead-Click 4위 1체)
   */
  function renderControls() {
    var c = tracker.dom.controls;
    c.innerHTML = '';

    if (tracker.state === 'idle') {
      // 대기 상태: [시작] 버튼
      var startBtn = document.createElement('button');
      startBtn.type = 'button';
      startBtn.className = 'tt-btn tt-btn-primary';
      startBtn.id = 'btnTtActionStart';
      var labelText = tracker.mode === 'timer' ? '타이머 시작' : '스톱워치 시작';
      startBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg><span>' + labelText + '</span>';
      startBtn.onclick = startTracker;
      c.appendChild(startBtn);
    } else if (tracker.state === 'running') {
      // 동작 중 상태: [구간기록], [일시중지], [전체중지 및 기록하기], [초기화]
      var lapBtn = document.createElement('button');
      lapBtn.type = 'button';
      lapBtn.className = 'tt-btn tt-btn-secondary';
      lapBtn.id = 'btnTtActionLap';
      lapBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg><span>구간기록</span>';
      lapBtn.onclick = recordLap;

      var pauseBtn = document.createElement('button');
      pauseBtn.type = 'button';
      pauseBtn.className = 'tt-btn tt-btn-warning';
      pauseBtn.id = 'btnTtActionPause';
      pauseBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg><span>일시중지</span>';
      pauseBtn.onclick = pauseTracker;

      var stopBtn = document.createElement('button');
      stopBtn.type = 'button';
      stopBtn.className = 'tt-btn tt-btn-success';
      stopBtn.id = 'btnTtActionStopRecord';
      stopBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12l2 2 4-4"/></svg><span>전체중지 및 기록하기</span>';
      stopBtn.onclick = stopAndRecord;

      var resetBtn = document.createElement('button');
      resetBtn.type = 'button';
      resetBtn.className = 'tt-btn tt-btn-danger';
      resetBtn.id = 'btnTtActionReset';
      resetBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg><span>초기화</span>';
      resetBtn.onclick = promptResetConfirm;

      c.appendChild(lapBtn);
      c.appendChild(pauseBtn);
      c.appendChild(stopBtn);
      c.appendChild(resetBtn);
    } else if (tracker.state === 'paused') {
      // 일시중지 상태: [계속하기], [구간기록], [전체중지 및 기록하기], [초기화]
      var resumeBtn = document.createElement('button');
      resumeBtn.type = 'button';
      resumeBtn.className = 'tt-btn tt-btn-primary';
      resumeBtn.id = 'btnTtActionResume';
      resumeBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg><span>계속하기</span>';
      resumeBtn.onclick = resumeTracker;

      var lapBtn2 = document.createElement('button');
      lapBtn2.type = 'button';
      lapBtn2.className = 'tt-btn tt-btn-secondary';
      lapBtn2.id = 'btnTtActionLap';
      lapBtn2.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg><span>구간기록</span>';
      lapBtn2.onclick = recordLap;

      var stopBtn2 = document.createElement('button');
      stopBtn2.type = 'button';
      stopBtn2.className = 'tt-btn tt-btn-success';
      stopBtn2.id = 'btnTtActionStopRecord';
      stopBtn2.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12l2 2 4-4"/></svg><span>전체중지 및 기록하기</span>';
      stopBtn2.onclick = stopAndRecord;

      var resetBtn2 = document.createElement('button');
      resetBtn2.type = 'button';
      resetBtn2.className = 'tt-btn tt-btn-danger';
      resetBtn2.id = 'btnTtActionReset';
      resetBtn2.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg><span>초기화</span>';
      resetBtn2.onclick = promptResetConfirm;

      c.appendChild(resumeBtn);
      c.appendChild(lapBtn2);
      c.appendChild(stopBtn2);
      c.appendChild(resetBtn2);
    } else if (tracker.state === 'completed') {
      // 타이머 시간 완료 상태: [🎉 완료 및 기록하기], [다시 시작]
      var finishRecordBtn = document.createElement('button');
      finishRecordBtn.type = 'button';
      finishRecordBtn.className = 'tt-btn tt-btn-success';
      finishRecordBtn.id = 'btnTtActionFinishRecord';
      finishRecordBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg><span>🎉 완료 및 기록하기</span>';
      finishRecordBtn.onclick = stopAndRecord;

      var restartBtn = document.createElement('button');
      restartBtn.type = 'button';
      restartBtn.className = 'tt-btn tt-btn-secondary';
      restartBtn.id = 'btnTtActionRestart';
      restartBtn.innerHTML = '<span>다시 설정</span>';
      restartBtn.onclick = resetTracker;

      c.appendChild(finishRecordBtn);
      c.appendChild(restartBtn);
    }
  }

  /**
   * 타이머 및 스톱워치 통합 프레임 루프
   */
  function updateLoop() {
    if (tracker.state !== 'running') return;

    if (tracker.mode === 'stopwatch') {
      var elapsed = getElapsedMs();
      var formatted = formatTime(elapsed);
      tracker.dom.digits.textContent = formatted.timeStr;
      tracker.dom.digitsSub.textContent = formatted.subStr;
      tracker.rafId = safeRaf(updateLoop);
    } else {
      // 카운트다운 루프
      var now = Date.now();
      var passedMs = now - tracker.startTime;
      var currentRemaining = Math.max(0, tracker.timerRemainingBeforePause - passedMs);
      tracker.timerRemainingMs = currentRemaining;
      tracker.timerElapsedMs = (tracker.timerTargetSeconds * 1000) - currentRemaining;

      var fRem = formatTime(currentRemaining);
      tracker.dom.digits.textContent = fRem.timeStr;
      tracker.dom.digitsSub.textContent = fRem.subStr;

      if (currentRemaining <= 0) {
        // 타이머 완료 도달!
        handleTimerComplete();
        return;
      }

      tracker.rafId = safeRaf(updateLoop);
    }
  }

  /**
   * 타이머 카운트다운 도달 완료 핸들러
   */
  function handleTimerComplete() {
    safeCaf(tracker.rafId);
    tracker.state = 'completed';
    tracker.timerRemainingMs = 0;
    tracker.timerElapsedMs = tracker.timerTargetSeconds * 1000;

    tracker.dom.digits.textContent = '00:00:00';
    tracker.dom.digitsSub.textContent = '.00';
    tracker.dom.statusBadge.className = 'tt-status-badge running';
    tracker.dom.statusText.textContent = '🎉 타이머 완료!';

    playTimerBeep();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate([200, 100, 200, 100, 500]); } catch(e){}
    }

    renderControls();
  }

  /**
   * 1. 시작 (Start)
   */
  function startTracker() {
    if (tracker.mode === 'timer') {
      if (!tracker.timerTargetSeconds || tracker.timerTargetSeconds <= 0) {
        if (typeof toast === 'function') toast('타이머 시간을 1초 이상 설정해주세요.');
        return;
      }
      tracker.timerRemainingMs = tracker.timerTargetSeconds * 1000;
      tracker.timerRemainingBeforePause = tracker.timerRemainingMs;
      tracker.timerElapsedMs = 0;
      tracker.dom.timerSetup.style.display = 'none';
    }

    tracker.state = 'running';
    tracker.startTime = Date.now();
    tracker.elapsedBeforePause = 0;
    tracker.lastLapElapsed = 0;
    tracker.laps = [];

    tracker.dom.statusBadge.className = 'tt-status-badge running';
    tracker.dom.statusText.textContent = tracker.mode === 'timer' ? '집중 측정 중' : '측정 중';
    tracker.dom.lapsList.innerHTML = '';
    tracker.dom.lapsWrapper.style.display = 'none';

    renderControls();
    updateLoop();
  }

  /**
   * 2. 일시중지 (Pause)
   */
  function pauseTracker() {
    if (tracker.state !== 'running') return;
    safeCaf(tracker.rafId);

    if (tracker.mode === 'stopwatch') {
      tracker.elapsedBeforePause += (Date.now() - tracker.startTime);
      var formatted = formatTime(tracker.elapsedBeforePause);
      tracker.dom.digits.textContent = formatted.timeStr;
      tracker.dom.digitsSub.textContent = formatted.subStr;
    } else {
      var passedMs = Date.now() - tracker.startTime;
      tracker.timerRemainingBeforePause = Math.max(0, tracker.timerRemainingBeforePause - passedMs);
      tracker.timerRemainingMs = tracker.timerRemainingBeforePause;
      tracker.timerElapsedMs = (tracker.timerTargetSeconds * 1000) - tracker.timerRemainingMs;
      var f = formatTime(tracker.timerRemainingMs);
      tracker.dom.digits.textContent = f.timeStr;
      tracker.dom.digitsSub.textContent = f.subStr;
    }

    tracker.state = 'paused';
    tracker.dom.statusBadge.className = 'tt-status-badge paused';
    tracker.dom.statusText.textContent = '일시 정지';

    renderControls();
  }

  /**
   * 3. 재개/계속하기 (Resume)
   */
  function resumeTracker() {
    if (tracker.state !== 'paused') return;
    tracker.state = 'running';
    tracker.startTime = Date.now();

    tracker.dom.statusBadge.className = 'tt-status-badge running';
    tracker.dom.statusText.textContent = tracker.mode === 'timer' ? '집중 측정 중' : '측정 중';

    renderControls();
    updateLoop();
  }

  /**
   * 4. 구간기록 (Lap)
   */
  function recordLap() {
    var currentElapsed = getElapsedMs();
    var lapDuration = currentElapsed - tracker.lastLapElapsed;
    tracker.lastLapElapsed = currentElapsed;

    var lapNum = tracker.laps.length + 1;
    var fSplit = formatTime(currentElapsed).timeStr;
    var fDur = formatTime(lapDuration).timeStr;

    var lapItem = {
      lapNum: lapNum,
      durationMs: lapDuration,
      splitMs: currentElapsed,
      formattedDuration: fDur,
      formattedSplit: fSplit,
      text: ''
    };

    tracker.laps.push(lapItem);
    renderLapsList();
  }

  /**
   * 실시간 구간별 활동기록 작성 팝업 (시간 정지 없음, #TASK-ES-172)
   */
  function openLapMemoModal(lap) {
    if (!lap) return;
    var modal = document.getElementById('ttLapMemoModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'ttLapMemoModal';
      modal.style.position = 'fixed';
      modal.style.bottom = '24px';
      modal.style.left = '50%';
      modal.style.transform = 'translateX(-50%)';
      modal.style.width = 'calc(100% - 32px)';
      modal.style.maxWidth = '440px';
      modal.style.background = 'rgba(15, 23, 42, 0.95)';
      modal.style.backdropFilter = 'blur(16px)';
      modal.style.webkitBackdropFilter = 'blur(16px)';
      modal.style.border = '1px solid rgba(99, 102, 241, 0.45)';
      modal.style.borderRadius = '20px';
      modal.style.padding = '18px 20px';
      modal.style.boxShadow = '0 20px 48px rgba(0,0,0,0.65)';
      modal.style.zIndex = '100005';
      document.body.appendChild(modal);
    }
    var quickTags = ['🏃 러닝', '📚 공부', '💻 코딩', '☕ 휴식', '🎯 몰입', '💪 운동', '📖 독서'];
    modal.innerHTML = 
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
          '<span style="background:rgba(99,102,241,0.22);color:#818cf8;font-size:0.8rem;font-weight:800;padding:3px 9px;border-radius:8px;">구간 ' + lap.lapNum + '</span>' +
          '<h4 style="margin:0;font-size:1rem;color:#fff;font-weight:800;">+' + lap.formattedDuration + ' <span style="font-size:.8rem;color:#94a3b8;font-weight:500;">(누적 ' + lap.formattedSplit + ')</span></h4>' +
        '</div>' +
        '<span style="display:inline-flex;align-items:center;gap:5px;font-size:.72rem;background:rgba(34,197,94,0.15);color:#4ade80;font-weight:700;padding:3px 9px;border-radius:999px;border:1px solid rgba(34,197,94,0.3);">' +
          '<span style="width:6px;height:6px;border-radius:50%;background:#22c55e;display:inline-block;box-shadow:0 0 6px #22c55e;"></span>시간 측정 중' +
        '</span>' +
      '</div>' +
      '<p style="font-size:.78rem;color:#94a3b8;margin:0 0 10px;line-height:1.4;">시간 정지 없이 이 구간에서 몰입한 활동을 기록하세요.</p>' +
      '<div style="display:flex;gap:5px;overflow-x:auto;padding-bottom:8px;margin-bottom:10px;" class="no-scrollbar">' +
        quickTags.map(function(tag){
          return '<button type="button" class="btn-quick-lap-tag" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.14);color:#cbd5e1;padding:4px 10px;border-radius:10px;font-size:0.75rem;cursor:pointer;white-space:nowrap;transition:all .15s;font-weight:600;">' + tag + '</button>';
        }).join('') +
      '</div>' +
      '<textarea id="ttLapMemoInput" style="width:100%;box-sizing:border-box;height:75px;background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.18);border-radius:12px;padding:10px 12px;color:#fff;font-size:.875rem;resize:none;margin-bottom:12px;outline:none;line-height:1.4;" placeholder="예: 3km 페이스 유지 러닝, 핵심 비즈니스 로직 작성 등">' + (lap.text || '') + '</textarea>' +
      '<div style="display:flex;gap:8px;justify-content:flex-end;align-items:center;">' +
        '<button type="button" class="btn btn-ghost btn-sm" id="btnTtLapMemoCancel" style="padding:7px 14px;border-radius:10px;color:#94a3b8;font-weight:600;">취소</button>' +
        '<button type="button" class="btn btn-primary btn-sm" id="btnTtLapMemoSave" style="padding:7px 18px;border-radius:10px;background:#6366f1;color:#fff;border:none;font-weight:700;box-shadow:0 2px 10px rgba(99,102,241,0.4);">저장</button>' +
      '</div>';
    modal.style.display = 'block';

    var txt = modal.querySelector('#ttLapMemoInput');
    if (txt) {
      txt.focus();
      txt.onfocus = function(){ txt.style.borderColor = '#6366f1'; txt.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.2)'; };
      txt.onblur = function(){ txt.style.borderColor = 'rgba(255,255,255,0.18)'; txt.style.boxShadow = 'none'; };
    }

    modal.querySelectorAll('.btn-quick-lap-tag').forEach(function(btn){
      btn.onclick = function(){
        if (!txt) return;
        var tag = btn.textContent;
        if (txt.value.trim()) {
          txt.value = txt.value.trim() + ' ' + tag;
        } else {
          txt.value = tag;
        }
        btn.style.background = 'rgba(99,102,241,0.3)';
        btn.style.borderColor = '#6366f1';
        btn.style.color = '#fff';
      };
    });

    modal.querySelector('#btnTtLapMemoCancel').onclick = function() {
      modal.style.display = 'none';
    };
    modal.querySelector('#btnTtLapMemoSave').onclick = function() {
      lap.text = (txt ? txt.value.trim() : '');
      modal.style.display = 'none';
      renderLapsList();
      if (typeof toast === 'function') toast('구간 ' + lap.lapNum + ' 활동 내용이 저장되었습니다.');
    };
  }

  /**
   * 2중 초기화 확인 안전 모달 (#TASK-ES-172)
   */
  function promptResetConfirm() {
    var dialog = document.getElementById('ttResetConfirmDialog');
    if (!dialog) {
      dialog = document.createElement('div');
      dialog.id = 'ttResetConfirmDialog';
      dialog.className = 'tt-confirm-dialog';
      dialog.style.display = 'flex';
      dialog.style.position = 'fixed';
      dialog.style.top = '0';
      dialog.style.left = '0';
      dialog.style.right = '0';
      dialog.style.bottom = '0';
      dialog.style.background = 'rgba(0,0,0,0.7)';
      dialog.style.zIndex = '100010';
      dialog.style.alignItems = 'center';
      dialog.style.justifyContent = 'center';
      dialog.style.padding = '16px';
      dialog.innerHTML = 
        '<div style="background:#1e293b;border:1px solid rgba(239,68,68,0.4);border-radius:16px;padding:20px;max-width:320px;width:100%;text-align:center;box-shadow:0 12px 36px rgba(0,0,0,0.5);">' +
          '<div style="font-size:2rem;margin-bottom:8px;">⚠️</div>' +
          '<h3 style="margin:0 0 8px;font-size:1.1rem;color:#f87171;">정말 초기화하시겠습니까?</h3>' +
          '<p id="ttResetConfirmMsg" style="font-size:.85rem;color:#cbd5e1;margin:0 0 16px;line-height:1.4;">소중하게 측정한 시간과 ' + tracker.laps.length + '개의 구간 기록이 모두 사라집니다.</p>' +
          '<div style="display:flex;gap:8px;">' +
            '<button type="button" class="btn btn-ghost btn-sm" id="btnTtResetNo" style="flex:1;padding:10px;border-radius:10px;font-weight:700;">취소</button>' +
            '<button type="button" class="btn btn-danger btn-sm" id="btnTtResetYes" style="flex:1;padding:10px;border-radius:10px;font-weight:700;background:#ef4444;color:#fff;border:none;">초기화</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(dialog);
      dialog.querySelector('#btnTtResetNo').onclick = function() {
        dialog.style.display = 'none';
      };
      dialog.querySelector('#btnTtResetYes').onclick = function() {
        dialog.style.display = 'none';
        resetTracker();
        if (typeof toast === 'function') toast('기록이 초기화되었습니다.');
      };
    } else {
      var msg = dialog.querySelector('#ttResetConfirmMsg');
      if (msg) msg.textContent = '소중하게 측정한 시간과 ' + tracker.laps.length + '개의 구간 기록이 모두 사라집니다.';
      dialog.style.display = 'flex';
    }
  }

  /**
   * 구간기록 목록 렌더링
   */
  function renderLapsList() {
    var wrapper = tracker.dom.lapsWrapper;
    var list = tracker.dom.lapsList;
    if (!tracker.laps.length) {
      wrapper.style.display = 'none';
      list.innerHTML = '';
      return;
    }

    wrapper.style.display = 'block';
    list.innerHTML = '';

    // 최신 순으로 상단 표시
    var reversed = tracker.laps.slice().reverse();
    reversed.forEach(function(lap, idx) {
      var item = document.createElement('div');
      item.className = 'tt-lap-item' + (idx === 0 ? ' latest' : '');
      item.style.cursor = 'pointer';
      item.title = '구간별 메모 작성 (시간은 계속 흘러갑니다)';
      item.innerHTML = 
        '<div style="display:flex;align-items:center;justify-content:space-between;width:100%;">' +
          '<span class="tt-lap-num">구간 ' + lap.lapNum + '</span>' +
          '<span class="tt-lap-split">누적 ' + lap.formattedSplit + '</span>' +
          '<span class="tt-lap-time">+' + lap.formattedDuration + '</span>' +
        '</div>' +
        '<div style="font-size:0.75rem;color:#cbd5e1;margin-top:3px;text-align:left;">' +
          (lap.text ? '📝 ' + lap.text : '<span style="color:#64748b;font-size:0.7rem;">(터치하여 활동 메모 작성)</span>') +
        '</div>';
      item.onclick = function() {
        openLapMemoModal(lap);
      };
      list.appendChild(item);
    });

    wrapper.scrollTop = 0;
  }

  /**
   * 5. 초기화 (Reset)
   */
  function resetTracker() {
    safeCaf(tracker.rafId);
    tracker.state = 'idle';
    tracker.startTime = 0;
    tracker.elapsedBeforePause = 0;
    tracker.lastLapElapsed = 0;
    tracker.laps = [];

    tracker.dom.statusBadge.className = 'tt-status-badge';
    tracker.dom.statusText.textContent = '측정 대기';
    tracker.dom.lapsWrapper.style.display = 'none';
    tracker.dom.lapsList.innerHTML = '';

    if (tracker.mode === 'stopwatch') {
      tracker.dom.digits.textContent = '00:00:00';
      tracker.dom.digitsSub.textContent = '.00';
      if (tracker.dom.timerSetup) tracker.dom.timerSetup.style.display = 'none';
    } else {
      if (tracker.dom.timerSetup) tracker.dom.timerSetup.style.display = 'flex';
      updateTimerDisplay();
    }

    renderControls();
  }

  /**
   * 6. 전체중지 및 기록하기 (Stop and Review)
   */
  function stopAndRecord() {
    safeCaf(tracker.rafId);
    var finalElapsed = getElapsedMs();
    tracker.elapsedBeforePause = finalElapsed;
    tracker.state = 'paused';

    if (finalElapsed === 0) {
      if (typeof toast === 'function') toast('측정된 시간이 없습니다.');
      return;
    }

    // 마지막 구간이 남아있으면 자동 랩 추가
    if (tracker.laps.length > 0 && finalElapsed > tracker.lastLapElapsed) {
      var remainingMs = finalElapsed - tracker.lastLapElapsed;
      tracker.laps.push({
        lapNum: tracker.laps.length + 1,
        durationMs: remainingMs,
        splitMs: finalElapsed,
        formattedDuration: formatTime(remainingMs).timeStr,
        formattedSplit: formatTime(finalElapsed).timeStr,
        text: ''
      });
    }

    // 작성 화면 전환
    openReviewView(finalElapsed);
  }

  /**
   * 세션 종료 후 기록 작성 화면 진입
   */
  function openReviewView(elapsedMs) {
    var d = tracker.dom;
    d.measureView.style.display = 'none';
    d.controls.style.display = 'none';
    d.reviewView.style.display = 'flex';

    var f = formatTime(elapsedMs);
    var modeBadgeText = tracker.mode === 'timer' ? '⏳ 타이머 완료' : '⏱️ 스톱워치 기록';
    d.reviewHeaderTitle.textContent = modeBadgeText + ' (' + f.timeStr + ')';
    d.reviewTotalTime.textContent = f.timeStr;
    d.reviewLapCount.textContent = '총 ' + tracker.laps.length + '개 구간 측정 완료';

    // 구간별 작성 내용이 있으면 활동명 기본값 설정 및 프리필
    var hasLapNotes = tracker.laps.some(function(l){ return l.text && l.text.trim(); });
    if (hasLapNotes && !d.activityTitle.value) {
      d.activityTitle.value = tracker.mode === 'timer' ? '집중 타이머 세션' : '스톱워치 몰입 세션';
    } else if (!d.activityTitle.value) {
      d.activityTitle.value = '';
    }
    d.activityTitle.focus();

    // 구간별 작성 필드 렌더링
    var lapsList = d.reviewLapsList;
    lapsList.innerHTML = '';

    if (tracker.laps.length > 0) {
      d.reviewLapsGroup.style.display = 'block';
      var quickReviewTags = ['🏃 러닝', '📚 공부', '💻 코딩', '☕ 휴식', '🎯 몰입'];
      tracker.laps.forEach(function(lap) {
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
              return '<button type="button" class="btn-lap-card-tag" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);color:#cbd5e1;padding:2px 8px;border-radius:8px;font-size:0.72rem;cursor:pointer;white-space:nowrap;transition:all .15s;">' + tag + '</button>';
            }).join('') +
          '</div>' +
          '<input type="text" class="tt-input tt-lap-input" data-lap-idx="' + (lap.lapNum - 1) + '" ' +
                 'value="' + safeVal + '" ' +
                 'placeholder="' + lap.lapNum + '구간 집중 활동 입력 (예: 1단원 문제풀이, UI 코딩 등)">';

        var inEl = card.querySelector('.tt-lap-input');
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
    var d = tracker.dom;
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
      if (tracker.laps[idx]) {
        tracker.laps[idx].text = input.value.trim();
      }
    });

    var totalMs = tracker.mode === 'timer' ? tracker.timerElapsedMs : tracker.elapsedBeforePause;
    var formatted = formatTime(totalMs);
    var now = new Date();
    var startTime = new Date(now.getTime() - totalMs);

    var modeTag = tracker.mode === 'timer' ? '⏳ 타이머' : '⏱️ 스톱워치';
    var textBody = modeTag + ' [' + formatted.timeStr + '] ' + title;
    if (tracker.laps.length > 0) {
      textBody += '\n\n[구간별 상세 내역]';
      tracker.laps.forEach(function(l) {
        var lapDesc = l.text ? (' - ' + l.text) : '';
        textBody += '\n• 구간 ' + l.lapNum + ' (' + l.formattedDuration + ')' + lapDesc;
      });
    }

    // 레코드 객체 생성
    var newRecord = {
      id: 'rec_tt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      type: 'time_record',
      mode: tracker.mode,
      category: '시간기록',
      theme: 'growth',
      subTheme: tracker.mode === 'timer' ? 'timer_focus' : 'time_tracker',
      themeConfidence: 0.99,
      text: textBody,
      title: title,
      startAt: startTime.toISOString(),
      endAt: now.toISOString(),
      durationMs: totalMs,
      totalSeconds: formatted.totalSeconds,
      formattedTime: formatted.timeStr,
      laps: tracker.laps.slice(),
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

    closeModal();
  }

  /**
   * 모달 열기
   */
  function openModal() {
    initDOM();
    tracker.isOpen = true;
    tracker.forcedLandscape = false;
    tracker.dom.wrapper.classList.remove('tt-forced-landscape');
    tracker.dom.measureView.style.display = 'flex';
    tracker.dom.reviewView.style.display = 'none';
    tracker.dom.controls.style.display = 'flex';

    resetTracker();
    hideCancelDialog();
    tracker.dom.overlay.classList.remove('hidden');

    handleScreenResize();
  }

  /**
   * 모달 닫기
   */
  function closeModal() {
    if (!tracker.isOpen) return;
    safeCaf(tracker.rafId);
    resetTracker();
    tracker.isOpen = false;
    if (tracker.dom.overlay) {
      tracker.dom.overlay.classList.add('hidden');
    }
  }

  // 외부 공개 API
  global.OurgoalTimeTracker = {
    open: openModal,
    close: closeModal,
    switchMode: switchMode,
    getState: function() { return tracker; }
  };

})(window);