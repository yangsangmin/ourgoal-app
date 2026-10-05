/**
 * OurGoal Calendar Day Background Image (일정 탭 — 일자별 배경 사진 줄이기)
 *
 * #TASK-ES-444 (인라인 스크립트 세포화 P1): index.html 인라인 IIFE 에서 옮긴 묶음 —
 *   compressCalendarBgImage(이전 전 10490~10528줄 · 구획 「[#TASK-ES-153 & #TASK-ES-155] 캘린더 일자별 배경 사진 지정 모달」)
 * openCalendarDayBgPickerModal 은 시험지(core-confirm-es376)가 index.html 한 파일에서 그 안의 ui.confirm 줄을 세어 index.html 에 남았다.
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
  var K = global.OurgoalCalendarKit = global.OurgoalCalendarKit || {};

  function compressCalendarBgImage(file, callback){
    if(!file) return callback(new Error('파일이 없습니다.'));
    var reader = new FileReader();
    reader.onload = function(e){
      var rawResult = e.target.result;
      var img = new Image();
      img.onload = function(){
        try {
          var canvas = document.createElement('canvas');
          var maxDim = 800;
          var w = img.width || 800;
          var h = img.height || 600;
          if(w > maxDim || h > maxDim){
            if(w > h){
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          canvas.width = w;
          canvas.height = h;
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          var compressed = canvas.toDataURL('image/jpeg', 0.82);
          callback(null, compressed || rawResult);
        } catch(err) {
          callback(null, rawResult);
        }
      };
      img.onerror = function(){
        callback(null, rawResult);
      };
      img.src = rawResult;
    };
    reader.onerror = function(err){ callback(err); };
    reader.readAsDataURL(file);
  }

  K.compressCalendarBgImage = compressCalendarBgImage;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
