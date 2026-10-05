/**
 * OurGoal Feed Post Preview (소통 탭 — 피드 게시 창 미리보기 토글)
 *
 * #TASK-ES-444 (인라인 스크립트 세포화 P1): index.html 인라인 IIFE 에서 옮긴 묶음 —
 *   toggleFeedPostPreview(이전 전 17770~17806줄 · 구획 「[#TASK-ES-301] 피드 게시 모달 내 '미리보기' 토글 직통 헬퍼」)
 * 묶음의 함수 선언을 글자 그대로 옮겼다(묶음 전체가 함수뿐이면 구획 주석까지 통째로). 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>,
 * 같은 키트의 다른 세포 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓). 로드 중 바로 도는 문·최상위 변수는 index.html 원래 자리에 남았다.
 * index.html 은 IIFE 머리에서 이 키트의 함수 중 인라인에서 부르는 것을 같은 이름으로 가져와 부른다 — 부르는 쪽은 그대로다.
 * 지도: docs/architecture/INLINE-SCRIPT-MAP.md(scripts/inline-script-map.js). 선례: #TASK-ES-423. 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·toast·openModal …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 같은 탭 파일끼리 서로 부르는 함수 묶음(이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalCommKit = global.OurgoalCommKit || {};

  function toggleFeedPostPreview(customCaption, customGoalTitle){
    if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
    else if(typeof L.triggerHaptic === 'function') L.triggerHaptic(12);
    var prevSlot = document.getElementById('sharePreviewSlot');
    var prevBtn = document.getElementById('sharePreviewBtn');
    var prevBody = document.getElementById('sharePreviewCardBody');
    if(!prevSlot || !prevBody) return false;
    var isShown = prevSlot.style.display !== 'none';
    if(isShown){
      prevSlot.style.display = 'none';
      if(prevBtn) prevBtn.textContent = '👁️ 미리보기';
      return false;
    }
    var caption = customCaption || (document.getElementById('shareCaptionInput') ? document.getElementById('shareCaptionInput').value.trim() : '') || '갓생 목표를 향해 한 걸음 더 나아가는 중!';
    var goalTitle = customGoalTitle || '';
    var p = (L.state && L.state.profile) || { displayName: '사용자' };
    prevBody.innerHTML = 
      '<div class="feed-card" style="box-shadow:none;border:1px solid var(--rule);padding:12px;border-radius:12px;background:var(--card);">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
          '<div style="display:flex;align-items:center;gap:8px;">' +
            (typeof L.avatarHtml === 'function' ? L.avatarHtml(36) : '👤') +
            '<div>' +
              '<div style="font-weight:800;font-size:.875rem;color:var(--ink);">' + L.escapeHtml(p.displayName) + '</div>' +
              '<div class="faint" style="font-size:.72rem;">방금 전 · <span class="tag" style="font-size:.65rem;padding:1px 5px;">공부·수험</span></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        (goalTitle ? '<div style="font-weight:800;font-size:.9rem;color:var(--primary);margin-bottom:4px;">🎯 ' + L.escapeHtml(goalTitle) + '</div>' : '') +
        '<p style="font-size:.84rem;color:var(--ink);margin:6px 0;line-height:1.45;white-space:pre-wrap;">' + L.escapeHtml(caption) + '</p>' +
        '<div style="display:flex;gap:12px;margin-top:8px;padding-top:6px;border-top:1px solid var(--rule);font-size:.75rem;color:var(--ink-soft);">' +
          '<span>❤️ 응원 0</span><span>💬 댓글 0</span>' +
        '</div>' +
      '</div>';
    prevSlot.style.display = 'block';
    if(prevBtn) prevBtn.textContent = '✕ 미리보기 닫기';
    return true;
  }

  K.toggleFeedPostPreview = toggleFeedPostPreview;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
