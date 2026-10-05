/**
 * OurGoal Photo Proof (기록 — 사진 인증 줄이기·사진 보기 창)
 *
 * #TASK-ES-444 (인라인 스크립트 세포화 P1): index.html 인라인 IIFE 에서 옮긴 묶음 —
 *   openPhotoViewerModal · compressImage(이전 전 14930~14973줄 · 구획 「사진 인증 & 뷰어 모달 (가상유저 요청 P1)」)
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
  var K = global.OurgoalRecordsKit = global.OurgoalRecordsKit || {};

  function openPhotoViewerModal(src){
    if(!src) return;
    var existing = document.getElementById('photoViewerModal');
    if(existing) existing.remove();
    var modal = document.createElement('div');
    modal.id = 'photoViewerModal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px);';
    modal.innerHTML = '<div style="position:relative;max-width:92vw;max-height:92vh;display:flex;flex-direction:column;align-items:center;">'
      + '<img src="' + src + '" style="max-width:100%;max-height:85vh;border-radius:12px;object-fit:contain;" />'
      + '<button type="button" id="photoViewerCloseBtn" style="margin-top:12px;background:#fff;color:var(--ink);border:none;border-radius:16px;padding:8px 24px;font-weight:700;cursor:pointer;">닫기</button>'
      + '</div>';
    modal.addEventListener('click', function(e){
      if(e.target === modal || e.target.tagName === 'BUTTON' || (e.target && e.target.id === 'photoViewerCloseBtn')) modal.remove();
    });
    document.body.appendChild(modal);
  }

  function compressImage(file, maxDimension, quality, callback){
    var reader = new FileReader();
    reader.onload = function(e){
      var img = new Image();
      img.onload = function(){
        var w = img.width, h = img.height;
        if(w > maxDimension || h > maxDimension){
          if(w > h){
            h = Math.round((h * maxDimension) / w);
            w = maxDimension;
          } else {
            w = Math.round((w * maxDimension) / h);
            h = maxDimension;
          }
        }
        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        var dataUrl = canvas.toDataURL('image/jpeg', quality || 0.82);
        callback(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  K.openPhotoViewerModal = openPhotoViewerModal;
  K.compressImage = compressImage;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
