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

  /* ============ [#TASK-ES-407] 시간기록 세포 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL.md) ============
     ① 가져오기: 부품으로 옮긴 함수를 이 스코프에서 같은 이름으로 쓴다(브라우저는 index.html 이 부품을 먼저 읽고, node 는 아래 require).
     ② 스코프 통로: 옮긴 코드가 읽는 이 스코프의 이름만 OurgoalTimeTrackerKit.<칸>.scope 에 getter 로 노출한다(목록은 스코프 분석으로 뽑았다). */
  var _ttKit = global.OurgoalTimeTrackerKit || {};
  var _ttScreen = _ttKit.screen;
  if(!_ttScreen && typeof require === 'function'){ _ttScreen = require('./time-tracker-screen.js'); }
  _ttScreen = _ttScreen || {};
  var _ttLapMemo = _ttKit.lapMemo;
  if(!_ttLapMemo && typeof require === 'function'){ _ttLapMemo = require('./time-tracker-lap-memo.js'); }
  _ttLapMemo = _ttLapMemo || {};
  var _ttReview = _ttKit.review;
  if(!_ttReview && typeof require === 'function'){ _ttReview = require('./time-tracker-review.js'); }
  _ttReview = _ttReview || {};
  var initDOM = _ttScreen.initDOM;
  var bindEvents = _ttScreen.bindEvents;
  Object.defineProperties(_ttScreen.scope || (_ttScreen.scope = {}), Object.getOwnPropertyDescriptors({
    get adjustTimerUnit(){ return adjustTimerUnit; },
    get askConfirm(){ return askConfirm; },
    get closeTrackerOverlay(){ return closeTrackerOverlay; },
    get handleCloseAttempt(){ return handleCloseAttempt; },
    get handleSaveRecord(){ return handleSaveRecord; },
    get handleScreenResize(){ return handleScreenResize; },
    get hideCancelDialog(){ return hideCancelDialog; },
    get showCancelDialog(){ return showCancelDialog; },
    get switchMode(){ return switchMode; },
    get tracker(){ return tracker; },
    get updateTimerDisplay(){ return updateTimerDisplay; }
  }));
  var openLapMemoModal = _ttLapMemo.openLapMemoModal;
  Object.defineProperties(_ttLapMemo.scope || (_ttLapMemo.scope = {}), Object.getOwnPropertyDescriptors({
    get renderLapsList(){ return renderLapsList; },
    get tracker(){ return tracker; }
  }));
  var openReviewView = _ttReview.openReviewView;
  var handleSaveRecord = _ttReview.handleSaveRecord;
  Object.defineProperties(_ttReview.scope || (_ttReview.scope = {}), Object.getOwnPropertyDescriptors({
    get closeTrackerOverlay(){ return closeTrackerOverlay; },
    get formatTime(){ return formatTime; },
    get tracker(){ return tracker; }
  }));
  var askConfirm = ((typeof OurgoalCapabilities !== 'undefined' && OurgoalCapabilities.has('ui.confirm.bind')) ? OurgoalCapabilities.request('ui.confirm.bind') : typeof require === 'function' ? require('./core/confirm.js').bind : function(get){ return function(m){ var o = get(); return Promise.resolve(typeof o === 'function' ? o(m) : false); }; })(function(){ return null; });
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

  /* [#TASK-ES-407] initDOM · bindEvents → js/time-tracker-screen.js 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */

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
      closeTrackerOverlay();
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

  /* [#TASK-ES-407] openLapMemoModal → js/time-tracker-lap-memo.js 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */

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
   * 구간기록 목록 렌더링 (#TASK-ES-172, [44], [55])
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
      item.title = '구간별 메모 작성 (시간은 계속 흘러갑니다)';
      var noteHtml = lap.text
        ? '<div style="font-size:0.75rem;color:#cbd5e1;display:flex;align-items:center;gap:5px;margin-top:2px;"><span>📝</span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + lap.text + '</span></div>'
        : '<div style="font-size:0.72rem;color:#818cf8;font-weight:600;display:flex;align-items:center;gap:5px;margin-top:2px;"><span>✏️</span><span>활동 메모 작성 (터치)</span></div>';

      item.innerHTML = 
        '<div style="display:flex;align-items:center;justify-content:space-between;width:100%;">' +
          '<div style="display:flex;align-items:center;gap:7px;">' +
            '<span class="tt-lap-num">구간 ' + lap.lapNum + '</span>' +
            '<span class="tt-lap-time">+' + lap.formattedDuration + '</span>' +
          '</div>' +
          '<span class="tt-lap-split">누적 ' + lap.formattedSplit + '</span>' +
        '</div>' +
        noteHtml;

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

    if (tracker.dom && tracker.dom.lapMemoContainer) {
      tracker.dom.lapMemoContainer.style.display = 'none';
      tracker.dom.lapMemoContainer.innerHTML = '';
    }
    if (tracker.dom && tracker.dom.measureView) {
      tracker.dom.measureView.classList.remove('tt-memo-active');
    }

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
    if (tracker.dom && tracker.dom.lapMemoContainer) {
      tracker.dom.lapMemoContainer.style.display = 'none';
      tracker.dom.lapMemoContainer.innerHTML = '';
    }
    if (tracker.dom && tracker.dom.measureView) {
      tracker.dom.measureView.classList.remove('tt-memo-active');
    }
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

  /* [#TASK-ES-407] openReviewView · handleSaveRecord → js/time-tracker-review.js 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */

  /**
   * 모달 열기
   */
  function openTrackerOverlay() { // #TASK-ES-363: 정본 openModal 통로가 아니라 자체 전체화면 덮개 #timeTrackerOverlay 를 여는 함수 — 이름만 정정(동작 불변, 덮개 한 벌화 4단계 대상)
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
  function closeTrackerOverlay() {
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
    open: openTrackerOverlay,
    close: closeTrackerOverlay,
    switchMode: switchMode,
    getState: function() { return tracker; }
  };

})(window);