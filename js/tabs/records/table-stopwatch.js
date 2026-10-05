/**
 * OurGoal Table Stopwatch (기록 탭 — 표 기록 인터벌 타이머·스톱워치 위젯)
 *
 * #TASK-ES-448 (인라인 스크립트 세포화 구역 P2): index.html 인라인 IIFE 에서 동작 그대로 옮겼다. 지도 묶음 G140.
 *   옮긴 선언(이전 전 줄): playTimerBeep(26538~26553) · STOPWATCH_STATE(26554~26563) · renderStopwatchWidgetHtml(26564~26594) · renderLapRowsHtml(26595~26615)
 * playTimerBeep·STOPWATCH_STATE·renderStopwatchWidgetHtml·renderLapRowsHtml = 전문 템플릿 표 안 스톱워치·인터벌 타이머 위젯과 랩 줄. formatStopwatchTime(시험지 smoke 가 글자로 읽음)·window 노출 문은 index.html 제자리(시험지 stopwatch-* 는 #TASK-ES-447 로 인라인 합본을 읽는다).
 * 최상위 선언을 앞 주석·구획 주석과 함께 글자 그대로 옮겼다. 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>, 같은 키트의 다른 세포 이름은 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 로드 중 바로 도는 문(window.X 노출·전역 이벤트 위임)과 시험지가 index.html 에서 글자로 읽는 함수는 index.html 제자리에 남겼다.
 * index.html 은 IIFE 맨 위에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져와 쓴다 — 부르는 쪽은 그대로다.
 * 지도: docs/architecture/INLINE-SCRIPT-MAP.md(scripts/inline-script-map.js). 선례: 인라인 세포화 1차 #TASK-ES-423 · 소통 탭 #TASK-ES-379. 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·toast·openModal …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 같은 탭 파일끼리 서로 부르는 함수 묶음(이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalRecordsKit = global.OurgoalRecordsKit || {};

  function playTimerBeep(){
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch(e){}
  }

  var STOPWATCH_STATE = {
    mode: 'stopwatch',
    targetMs: 0,
    elapsedMs: 0,
    startTime: 0,
    timerId: null,
    isRunning: false,
    laps: []
  };

  function renderStopwatchWidgetHtml(){
    return '<div class="pro-stopwatch-widget" id="proStopwatchWidget">' +
      '<div class="pro-stopwatch-header">' +
        '<div style="display:flex;align-items:center;gap:6px;">' +
          '<span style="font-size:1rem;"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2"/><path d="M9 2h6"/></svg></span>' +
          '<b style="font-size:.875rem;color:var(--ink);">인앱 인터벌 타이머 & 스톱워치</b>' +
        '</div>' +
        '<div class="pro-sw-modes" id="swModeRow">' +
          '<button class="pro-sw-mode-chip active" data-swmode="stopwatch" type="button">스톱워치</button>' +
          '<button class="pro-sw-mode-chip" data-swmode="rest60" type="button">60초 휴식</button>' +
          '<button class="pro-sw-mode-chip" data-swmode="rest90" type="button">90초 휴식</button>' +
          '<button class="pro-sw-mode-chip" data-swmode="rest120" type="button">2분 휴식</button>' +
          '<button class="pro-sw-mode-chip" data-swmode="timecap20" type="button">20분 타임캡</button>' +
        '</div>' +
      '</div>' +
      '<div class="pro-sw-display-row">' +
        '<div class="pro-sw-clock" id="swDisplay">00:00.0</div>' +
        '<div class="pro-sw-controls">' +
          '<button class="btn btn-primary btn-sm" id="swStartPauseBtn" type="button" style="min-width:70px;">시작</button>' +
          '<button class="btn btn-ghost btn-sm" id="swResetBtn" type="button">리셋</button>' +
          '<button class="btn btn-ghost btn-sm" id="swLapBtn" type="button">랩</button>' +
          '<button class="btn btn-ghost btn-sm" id="swInjectBtn" type="button" style="color:var(--ink);border-color:var(--rule);font-weight:700;" title="현재 측정 시간을 표의 시간 열에 기입">표에 시간 기입</button>' +
        '</div>' +
      '</div>' +
      '<div class="sw-inject-hint" id="swInjectHint" style="margin-top:5px;font-size:0.75rem;color:var(--ink-faint);line-height:1.4;">' +
        '💡 넣을 칸 누르고 ‘표에시간기입’ 누르면 바로입력됨 (분:초 또는 초 기입)' +
      '</div>' +
      '<div id="swLapsList" class="sw-laps-container" style="display:none;"></div>' +
    '</div>';
  }

  function renderLapRowsHtml(laps){
    if(!laps || !laps.length) return '';
    return laps.map(function(lp, idx){
      var isObj = lp && typeof lp === 'object';
      var lapNum = isObj && lp.num !== undefined ? lp.num : (laps.length - idx);
      var lapTime = isObj ? (lp.time || '00:00.0') : String(lp);
      var lapMemo = isObj ? (lp.memo || '') : '';
      var safeTime = L.escapeHtml(lapTime);
      var safeMemo = L.escapeHtml(lapMemo);
      return '<div class="sw-lap-row" data-lap-idx="' + idx + '" data-lap-num="' + lapNum + '">' +
        '<div class="sw-lap-meta">' +
          '<span class="sw-lap-badge">랩 ' + lapNum + '</span>' +
          '<span class="sw-lap-time">' + safeTime + '</span>' +
        '</div>' +
        '<div class="sw-lap-memo-wrap">' +
          '<input type="text" class="sw-lap-memo-input" data-lap-idx="' + idx + '" placeholder="구간 활동 내용 (예: 세트 ' + lapNum + ', 웜업)" value="' + safeMemo + '" aria-label="랩 ' + lapNum + ' 메모">' +
          '<button type="button" class="btn btn-ghost btn-xs sw-lap-inject-btn" data-lap-idx="' + idx + '" title="이 구간 기록을 표에 기입">기입</button>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  K.playTimerBeep = playTimerBeep;
  K.STOPWATCH_STATE = STOPWATCH_STATE;
  K.renderStopwatchWidgetHtml = renderStopwatchWidgetHtml;
  K.renderLapRowsHtml = renderLapRowsHtml;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
