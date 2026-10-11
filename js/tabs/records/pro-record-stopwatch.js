/**
 * OurGoal Pro Record Stopwatch (기록 — 전문 템플릿 기록 창의 스톱워치·인터벌 타이머)
 *
 * bindProRecStopwatch — 시작/정지 · 리셋 · 모드 · 랩 · 랩과 지금 시간을 표 칸에 기입하기를 연결하고, 타이머를 멈추는 함수를 꾸러미(ctx)에 등록한다.
 * 본문은 이전 전 글자 그대로다(#TASK-ES-646 에서 나눈 꼴).
 * #TASK-ES-672(전문 템플릿 기록 창 조각 여섯을 세포로 글자 그대로 이전 — 진입점 · 표 편집 · 도구 단추 · 성장 추이 차트 · 스톱워치·인터벌 타이머 · 저장·닫기 (지시함 DIR-004 (라) A안 ③)): index.html 인라인 IIFE 의 구간(이전 전 3223~3486줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 3223~3486줄(#TASK-ES-672 생성기 표지) ---- */
  function bindProRecStopwatch(ctx){ /* [#TASK-ES-646] 전문 템플릿 기록 창 조각 — 스톱워치·인터벌 타이머: 시작/정지 · 리셋 · 모드 · 랩 · 랩과 지금 시간을 표 칸에 기입. 꾸러미(ctx)는 openProTemplateRecordModal 가 만든다 */
      ctx.stopSwTimer = stopSwTimer;
      // ⏱️ 인앱 스톱워치 & 인터벌 타이머 위젯 제어
      var swTimerId = null;
      var swRunning = false;
      var swMode = 'stopwatch';
      var swTargetMs = 0;
      var swElapsedMs = 0;
      var swLastTick = 0;
      var swLaps = [];
      var lastFocusedCell = null;

      var swDisplay = ctx.sheet.querySelector('#swDisplay');
      var swStartPauseBtn = ctx.sheet.querySelector('#swStartPauseBtn');
      var swResetBtn = ctx.sheet.querySelector('#swResetBtn');
      var swLapBtn = ctx.sheet.querySelector('#swLapBtn');
      var swInjectBtn = ctx.sheet.querySelector('#swInjectBtn');
      var swLapsList = ctx.sheet.querySelector('#swLapsList');
      var swModeChips = ctx.sheet.querySelectorAll('.pro-sw-mode-chip');

      function updateSwDisplay(){
        if(!swDisplay) return;
        var displayMs = swMode === 'stopwatch' ? swElapsedMs : Math.max(0, swTargetMs - swElapsedMs);
        swDisplay.textContent = L.formatStopwatchTime(displayMs, true);
        if(swMode !== 'stopwatch' && displayMs === 0 && swRunning){
          swDisplay.style.color = 'var(--red)';
        } else {
          swDisplay.style.color = '';
        }
      }

      function stopSwTimer(){
        if(swTimerId){
          clearInterval(swTimerId);
          swTimerId = null;
        }
        swRunning = false;
        if(swStartPauseBtn) swStartPauseBtn.textContent = '▶ 시작';
      }

      function resetSw(newMode){
        stopSwTimer();
        if(newMode) swMode = newMode;
        swElapsedMs = 0;
        swLaps = [];
        if(swLapsList){
          swLapsList.style.display = 'none';
          swLapsList.innerHTML = '';
        }
        if(swMode === 'stopwatch'){
          swTargetMs = 0;
        } else if(swMode === 'rest60'){
          swTargetMs = 60000;
        } else if(swMode === 'rest90'){
          swTargetMs = 90000;
        } else if(swMode === 'rest120'){
          swTargetMs = 120000;
        } else if(swMode === 'timecap20'){
          swTargetMs = 1200000;
        }
        updateSwDisplay();
      }

      swModeChips.forEach(function(chip){
        chip.onclick = function(){
          swModeChips.forEach(function(c){ c.classList.remove('active'); });
          chip.classList.add('active');
          resetSw(chip.dataset.swmode);
        };
      });

      if(swStartPauseBtn){
        swStartPauseBtn.onclick = function(){
          if(swRunning){
            stopSwTimer();
          } else {
            swRunning = true;
            swStartPauseBtn.textContent = '일시정지';
            swLastTick = Date.now();
            swTimerId = setInterval(function(){
              var now = Date.now();
              var delta = now - swLastTick;
              swLastTick = now;
              swElapsedMs += delta;

              if(swMode !== 'stopwatch' && swElapsedMs >= swTargetMs){
                swElapsedMs = swTargetMs;
                stopSwTimer();
                updateSwDisplay();
                L.playTimerBeep();
                var modeNames = { rest60: '60초 휴식', rest90: '90초 휴식', rest120: '2분 휴식', timecap20: '20분 타임캡' };
                L.toast('[' + (modeNames[swMode] || '타이머') + '] 종료되었습니다! 다음 세트를 시작하세요!');
                return;
              }
              updateSwDisplay();
            }, 60);
          }
        };
      }

      if(swResetBtn){
        swResetBtn.onclick = function(){
          resetSw();
        };
      }

      function renderLapsUI(){
        if(!swLapsList) return;
        if(!swLaps || swLaps.length === 0){
          swLapsList.style.display = 'none';
          swLapsList.innerHTML = '';
          return;
        }
        swLapsList.style.display = 'flex';
        swLapsList.innerHTML = L.renderLapRowsHtml(swLaps);

        swLapsList.querySelectorAll('.sw-lap-memo-input').forEach(function(inp){
          inp.oninput = function(e){
            var idx = parseInt(e.target.dataset.lapIdx, 10);
            if(swLaps[idx]){
              swLaps[idx].memo = e.target.value;
            }
          };
        });

        swLapsList.querySelectorAll('.sw-lap-inject-btn').forEach(function(btn){
          btn.onclick = function(e){
            var idx = parseInt(e.target.dataset.lapIdx, 10);
            var lap = swLaps[idx];
            if(lap){
              injectLapIntoTable(lap);
            }
          };
        });
      }

      function injectLapIntoTable(lap){
        if(!lap) return;
        var targetInp = null;
        if(lastFocusedCell && document.body.contains(lastFocusedCell)){
          targetInp = lastFocusedCell;
        } else {
          var timeColIdx = -1;
          ctx.columns.forEach(function(c, i){
            if(timeColIdx === -1 && /(?:시간|페이스|time|타임|소요)/i.test(c)){
              timeColIdx = i;
            }
          });
          if(timeColIdx === -1 && ctx.columns.length > 1) timeColIdx = ctx.columns.length - 1;

          if(timeColIdx !== -1){
            var inps = ctx.sheet.querySelectorAll('.pro-tpl-cell-input[data-col="'+timeColIdx+'"]');
            for(var j=0; j<inps.length; j++){
              if(!inps[j].value.trim()){
                targetInp = inps[j];
                break;
              }
            }
            if(!targetInp && inps.length) targetInp = inps[inps.length - 1];
          }
        }

        if(!targetInp){
          L.toast('넣을 칸 누르고 ‘기입’ 누르면 바로입력됨');
          return;
        }

        var timeVal = (lap.rawMs !== undefined) ? L.formatStopwatchTime(lap.rawMs, false) : (lap.time || '');
        targetInp.value = timeVal;
        targetInp.classList.add('cell-highlight-flash');
        setTimeout(function(){ targetInp.classList.remove('cell-highlight-flash'); }, 1400);

        var rowIdx = targetInp.getAttribute('data-row');
        if(rowIdx !== null && lap.memo && lap.memo.trim()){
          var itemColIdx = -1;
          ctx.columns.forEach(function(c, i){
            if(itemColIdx === -1 && /(?:항목|종목|메모|내용|활동|운동)/i.test(c)){
              itemColIdx = i;
            }
          });
          if(itemColIdx !== -1){
            var memoInp = ctx.sheet.querySelector('.pro-tpl-cell-input[data-row="'+rowIdx+'"][data-col="'+itemColIdx+'"]');
            if(memoInp && !memoInp.value.trim()){
              memoInp.value = lap.memo.trim();
              memoInp.classList.add('cell-highlight-flash');
              setTimeout(function(){ memoInp.classList.remove('cell-highlight-flash'); }, 1400);
            }
          }
        }

        ctx.syncCurrentRowsFromDOM();
        ctx.updateAnalyticsBanner();
        L.toast('랩 ' + lap.num + ' (' + timeVal + ')을 표에 기입했습니다!');
      }

      if(swLapBtn){
        swLapBtn.onclick = function(){
          var curMs = swMode === 'stopwatch' ? swElapsedMs : Math.max(0, swTargetMs - swElapsedMs);
          var lapStr = L.formatStopwatchTime(curMs, true);
          var lapNum = swLaps.length + 1;
          var lapItem = {
            id: 'lap_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            num: lapNum,
            time: lapStr,
            rawMs: curMs,
            memo: ''
          };
          swLaps.unshift(lapItem);
          renderLapsUI();
          L.toast('랩 ' + lapNum + ' (' + lapStr + ') 기록!');
        };
      }

      // Track cell focus for stopwatch injection
      ctx.sheet.addEventListener('focusin', function(e){
        if(e.target && e.target.classList && e.target.classList.contains('pro-tpl-cell-input')){
          lastFocusedCell = e.target;
        }
      });

      if(swInjectBtn){
        swInjectBtn.onclick = function(){
          var targetInp = null;
          if(lastFocusedCell && document.body.contains(lastFocusedCell)){
            targetInp = lastFocusedCell;
          } else {
            // Find column matching 시간|페이스|time|소요시간|타임
            var timeColIdx = -1;
            ctx.columns.forEach(function(c, i){
              if(timeColIdx === -1 && /(?:시간|페이스|time|타임|소요)/i.test(c)){
                timeColIdx = i;
              }
            });
            if(timeColIdx === -1 && ctx.columns.length > 1) timeColIdx = ctx.columns.length - 1;

            if(timeColIdx !== -1){
              var inps = ctx.sheet.querySelectorAll('.pro-tpl-cell-input[data-col="'+timeColIdx+'"]');
              for(var j=0; j<inps.length; j++){
                if(!inps[j].value.trim()){
                  targetInp = inps[j];
                  break;
                }
              }
              if(!targetInp && inps.length) targetInp = inps[inps.length - 1];
            }
          }

          if(!targetInp){
            L.toast('넣을 칸 누르고 ‘표에시간기입’ 누르면 바로입력됨');
            return;
          }

          var curMs = swMode === 'stopwatch' ? swElapsedMs : Math.max(0, swTargetMs - swElapsedMs);
          var timeVal = L.formatStopwatchTime(curMs, false);
          targetInp.value = timeVal;
          targetInp.classList.add('cell-highlight-flash');
          setTimeout(function(){ targetInp.classList.remove('cell-highlight-flash'); }, 1400);

          ctx.syncCurrentRowsFromDOM();
          ctx.updateAnalyticsBanner();
          L.toast('표에 측정 시간(' + timeVal + ')을 자동 기입했습니다!');
        };
      }
  }

  K.bindProRecStopwatch = bindProRecStopwatch;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
/* ==== [세포 등록 시작 · gen-cell-provide.js] 이 세포가 키트에 단 이름을 등록 기관(js/core/cell-registry.js)에 스스로 등록한다 — 대조(compare) 전용, 동작 변화 0. 생성기 산출이므로 손으로 고치지 않는다. ==== */
(function (g) {
  var R = g.OurgoalCellRegistry;
  if (!R) return;
  var K = g.OurgoalRecordsKit;
  if (K) R.provide('records/pro-record-stopwatch', {
    bindProRecStopwatch: K.bindProRecStopwatch
  }, { window: [] });
})(typeof window !== 'undefined' ? window : globalThis);
/* ==== [세포 등록 끝] ==== */
