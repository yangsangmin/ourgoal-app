/**
 * OurGoal Confetti (기관 — 축하 꽃가루·공개 범위 되돌리기 토스트)
 *
 * 여러 탭이 부르는 축하 꽃가루(burstConfetti — #confettiLayer 에 조각을 뿌리고 1.1초 뒤 지움)와 목표 공개 범위 되돌리기 토스트(showUndoPrivacyToast).
 * 같은 묶음의 토스트(toast)와 그 타이머(toastTimer)·window 노출 if 문은 옮기지 않았다 — toast 는 다른 함수와 타이머를 같이 쓴다(MODULE-SPLIT-PROTOCOL 1절).
 * #TASK-ES-482(인라인 어려움 묶음 시범): index.html 인라인 IIFE 의 구간(이전 전 3081~3106 · 3122~3149줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalUiHelpers = global.OurgoalUiHelpers || {};

  /* ---- 이전 전 index.html 3081~3106줄(#TASK-ES-482 생성기 표지) ---- */
  function burstConfetti(x, y, count){
    if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    count = count || 18;
    var layer = document.getElementById('confettiLayer');
    if(!layer){
      layer = document.createElement('div');
      layer.id = 'confettiLayer';
      document.body.appendChild(layer);
    }
    var colors = ['#FF4F64','#FF9F1C','#1FC98E','#6C5CE7','#FFD166'];
    for(var i=0;i<count;i++){
      var p = document.createElement('div');
      p.className = 'confetti-piece';
      var angle = (Math.PI * 2 * i) / count + Math.random()*0.4;
      var dist = 60 + Math.random()*90;
      p.style.left = x + 'px';
      p.style.top = y + 'px';
      p.style.background = colors[i % colors.length];
      p.style.setProperty('--dx', Math.cos(angle)*dist + 'px');
      p.style.setProperty('--dy', (Math.sin(angle)*dist + 60) + 'px');
      p.style.setProperty('--rot', (Math.random()*720-360) + 'deg');
      p.style.animationDelay = (Math.random()*0.08) + 's';
      layer.appendChild(p);
      (function(el){ setTimeout(function(){ el.remove(); }, 1100); })(p);
    }
  }

  /* ---- 이전 전 index.html 3122~3149줄(#TASK-ES-482 생성기 표지) ---- */

  /* #TASK-ES-333: 같은 테마 공개 안내 및 1초 되돌리기(나만 보기로 변경) 토스트 배선 */
  function showUndoPrivacyToast(goalId){
    var el = document.getElementById('toast');
    if(!el) return;
    el.innerHTML = '<span style="vertical-align:middle;">🏷️ 같은 테마 러너에게만 공유돼요</span> ' +
      '<button id="btnUndoThemePrivacy" type="button" style="background:#fff;color:#1e293b;border:none;border-radius:6px;padding:3px 9px;font-size:12px;font-weight:700;margin-left:8px;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,0.2);">🔒 나만 보기로 변경</button>';
    el.classList.add('show');
    clearTimeout(L.toastTimer);
    var btn = el.querySelector('#btnUndoThemePrivacy');
    if(btn){
      btn.onclick = async function(e){
        e.stopPropagation();
        var target = (L.state.profile && L.state.profile.goals || []).find(function(g){ return g.id === goalId; });
        if(target){
          target.visibility = 'private';
          await L.saveProfile();
          if(typeof L.dispatchFullViewPropagation === 'function'){
            L.dispatchFullViewPropagation('goal_update', { goalId: goalId });
          } else {
            L.renderAll();
          }
        }
        L.toast('🔒 나만 보기로 변경되었어요');
      };
    }
    L.toastTimer = setTimeout(function(){ el.classList.remove('show'); }, 5000);
  }

  K.burstConfetti = burstConfetti;
  K.showUndoPrivacyToast = showUndoPrivacyToast;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
