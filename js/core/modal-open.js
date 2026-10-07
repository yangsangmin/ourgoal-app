/**
 * Modal Open & Handlers
 *
 * openModal 함수 및 모달 팝업 상태(history, dismiss) 관리
 * #TASK-ES-591(인라인 어려움 묶음 시범): index.html 인라인 IIFE 의 구간(이전 전 3804~3857줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalModalOpenKit = global.OurgoalModalOpenKit || {};

  /* ---- 이전 전 index.html 3804~3857줄(#TASK-ES-591 생성기 표지) ---- */
  /* [#TASK-ES-471] isModalDismissCooldown → js/core/modal-helper.js 로 옮김(인라인 어려움 기관 묶음 이전 1차 — 앞 주석 포함) */

  function openModal(html, onMount, thirdArg){
    window._modalOpenAt = Date.now();
    var overlay = document.getElementById('modalOverlay');
    var sheet = document.getElementById('modalSheet');
    if(!overlay || !sheet) return;

    var finalHtml = '';
    var finalOnMount = null;

    if(html && typeof html === 'object'){
      var title = html.title || '';
      var body = html.body || html.content || html.html || '';
      finalOnMount = html.onOpen || html.onMount || onMount;
      finalHtml = (title ? '<div class="modal-head" style="margin-bottom:12px;padding-right:44px;"><h3 style="margin:0;font-size:1.125rem;font-weight:800;color:var(--ink);">' + title + '</h3></div>' : '') + body;
    } else if(typeof html === 'string' && typeof onMount === 'string'){
      finalHtml = '<div class="modal-head" style="margin-bottom:12px;padding-right:44px;"><h3 style="margin:0;font-size:1.125rem;font-weight:800;color:var(--ink);">' + html + '</h3></div>' + onMount;
      if(thirdArg && typeof thirdArg === 'function') finalOnMount = thirdArg;
    } else {
      finalHtml = html || '';
      finalOnMount = (typeof onMount === 'function') ? onMount : null;
    }

    // [#UIUX-19] 70세 어르신 인지 배려 우측 상단 44px 큼직한 ✕ 닫기 버튼 자동 주입
    if(finalHtml.indexOf('modal-sheet-close') === -1){
      finalHtml = '<button type="button" class="modal-sheet-close touch-target-44" aria-label="닫기" title="닫기" onclick="if(typeof window.triggerHaptic===\'function\') window.triggerHaptic(12); closeModal();">✕</button>' + finalHtml;
    }

    // [#UIUX-23] 2중 바텀시트 적재(Stacking) 방지: 이미 열려있을 경우 단일 포커스 전환
    sheet.style.transform = '';
    sheet.innerHTML = finalHtml;
    overlay.classList.add('active');
    if(finalOnMount){
      try { finalOnMount(sheet); } catch(mErr){ console.error('[openModal] mount error:', mErr); }
    }

    var dismissHandler = function(e){
      if(e.target === overlay){
        e.preventDefault();
        e.stopPropagation();
        L.closeModal();
      }
    };
    overlay.onclick = dismissHandler;
    overlay.ontouchend = dismissHandler;

    try {
      if(!L._modalHistoryPushed && typeof window!=='undefined' && window.history && history.pushState){
        history.pushState({ ourgoal_modal: true }, '');
        L._modalHistoryPushed = true;
      }
    } catch(e){}
  }

  K.openModal = openModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
