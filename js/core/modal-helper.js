/**
 * OurGoal Modal Helper (기관 — 모달 도우미·안드로이드 뒤로가기 처리)
 *
 * 모달 열기·닫기 도우미와 안드로이드 하드웨어 뒤로가기 처리 묶음. 최상위 this/arguments 를 쓰는 함수는 헌법 CELL_SPLIT 5 에 따라 index.html 에 남겼다.
 * #TASK-ES-471(인라인 어려움 기관 묶음 이전 1차): index.html 인라인 IIFE 의 구간(이전 전 6234~6237 · 6291~6306 · 6307~6326 · 6327~6355 · 6363~6371줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 6234~6237줄(#TASK-ES-471 생성기 표지) ---- */

  function isModalDismissCooldown(){
    return Date.now() < L._modalDismissGraceUntil;
  }

  /* ---- 이전 전 index.html 6291~6306줄(#TASK-ES-471 생성기 표지) ---- */

  function closeModal(skipHistoryBack){
    var overlay = document.getElementById('modalOverlay');
    if(!overlay || !overlay.classList.contains('active')) return;
    overlay.classList.remove('active');
    var sheet = document.getElementById('modalSheet');
    if(sheet) sheet.style.transform = '';
    L._modalDismissGraceUntil = Date.now() + 400; // 400ms 동안 빈 영역 탭 후속 고스트 클릭 완벽 방어

    if(L._modalHistoryPushed && !skipHistoryBack && typeof window!=='undefined' && window.history && history.back){
      L._modalHistoryPushed = false;
      try { history.back(); } catch(e){}
    } else {
      L._modalHistoryPushed = false;
    }
  }
  /* ---- 이전 전 index.html 6307~6326줄(#TASK-ES-471 생성기 표지) ---- */

  // [#UIUX-20] 구형 중앙 팝업/얼럿/컨펌 전수 바텀시트 표준 흡수 엔진
  function openBottomSheetAlert(title, message, okText, onOk){
    var t = title || '알림';
    var m = message || '';
    var ok = okText || '확인';
    var content = '<div class="sheet-alert-body" style="padding:10px 0 16px;text-align:center;">' +
      '<h3 style="font-size:1.15rem;font-weight:700;margin-bottom:8px;color:var(--ink);">' + t + '</h3>' +
      '<p style="font-size:0.925rem;color:var(--ink-soft);line-height:1.5;margin-bottom:20px;white-space:pre-line;">' + m + '</p>' +
      '<button type="button" class="btn btn-primary btn-block touch-target-44" id="btnSheetAlertOk" style="font-weight:700;">' + ok + '</button>' +
      '</div>';
    L.openModal(content, function(sheet){
      var btn = sheet.querySelector('#btnSheetAlertOk');
      if(btn) btn.onclick = function(){
        if(typeof window.triggerHaptic === 'function') window.triggerHaptic(12);
        closeModal();
        if(typeof onOk === 'function') onOk();
      };
    });
  }
  /* ---- 이전 전 index.html 6327~6355줄(#TASK-ES-471 생성기 표지) ---- */

  function openBottomSheetConfirm(title, message, okText, cancelText, onOk, onCancel){
    var t = title || '확인';
    var m = message || '';
    var ok = okText || '확인';
    var cancel = cancelText || '취소';
    var content = '<div class="sheet-confirm-body" style="padding:10px 0 16px;text-align:center;">' +
      '<h3 style="font-size:1.15rem;font-weight:700;margin-bottom:8px;color:var(--ink);">' + t + '</h3>' +
      '<p style="font-size:0.925rem;color:var(--ink-soft);line-height:1.5;margin-bottom:20px;white-space:pre-line;">' + m + '</p>' +
      '<div style="display:flex;gap:10px;">' +
      '<button type="button" class="btn btn-ghost touch-target-44" id="btnSheetConfirmCancel" style="flex:1;font-weight:600;">' + cancel + '</button>' +
      '<button type="button" class="btn btn-primary touch-target-44" id="btnSheetConfirmOk" style="flex:1;font-weight:700;">' + ok + '</button>' +
      '</div>' +
      '</div>';
    L.openModal(content, function(sheet){
      var bCancel = sheet.querySelector('#btnSheetConfirmCancel');
      if(bCancel) bCancel.onclick = function(){
        if(typeof window.triggerHaptic === 'function') window.triggerHaptic(12);
        closeModal();
        if(typeof onCancel === 'function') onCancel();
      };
      var bOk = sheet.querySelector('#btnSheetConfirmOk');
      if(bOk) bOk.onclick = function(){
        if(typeof window.triggerHaptic === 'function') window.triggerHaptic(12);
        closeModal();
        if(typeof onOk === 'function') onOk();
      };
    });
  }

  /* ---- 이전 전 index.html 6363~6371줄(#TASK-ES-471 생성기 표지) ---- */
  function bindModalPopstateBack() { /* [#TASK-ES-471] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */

  if(typeof window!=='undefined' && window.addEventListener){
    window.addEventListener('popstate', function(e){
      var overlay = document.getElementById('modalOverlay');
      if(overlay && overlay.classList.contains('active')){
        closeModal(true);
      }
    });
  }
  } /* bindModalPopstateBack */

  K.isModalDismissCooldown = isModalDismissCooldown;
  K.closeModal = closeModal;
  K.openBottomSheetAlert = openBottomSheetAlert;
  K.openBottomSheetConfirm = openBottomSheetConfirm;
  K.bindModalPopstateBack = bindModalPopstateBack;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
