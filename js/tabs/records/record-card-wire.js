/**
 * OurGoal Record Card Wire (기록 탭 — 기록 카드 단추 연결)
 *
 * #TASK-ES-448 (인라인 스크립트 세포화 구역 P2): index.html 인라인 IIFE 에서 동작 그대로 옮겼다. 지도 묶음 G130.
 *   옮긴 선언(이전 전 줄): wireRecordCards(24260~24306)
 * wireRecordCards = 기록 카드의 수정·삭제(휴지통)·테마 바꾸기·표 기록 열기 단추를 연결한다(시험지 core-confirm-es376 은 #751 로 인라인 합본을 읽는다).
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

  function wireRecordCards(container, options){
    if(!container) return;
    options = options || {};
    var onUpdate = options.onUpdate || function(){ L.renderRecordsScreen(); };
    container.querySelectorAll('.rec-card').forEach(function(card){
      var id = card.dataset.recid;
      var rec = (L.state.profile.records || []).find(function(r){ return r.id===id; });
      if(!rec) return;

      if(rec.type === 'template'){
        card.addEventListener('click', function(e){
          if(e.target.closest('button') || e.target.closest('.rec-theme-chip')) return;
          L.openTemplateRecordDetailModal(rec);
        });
      }

      var editBtn = card.querySelector('[data-recedit]');
      if(editBtn){
        editBtn.addEventListener('click', function(e){
          e.stopPropagation();
          if(rec.type === 'template'){
            L.openProTemplateRecordModal(rec);
          } else {
            L.openRecordModal(rec);
          }
        });
      }
      var chipBtn = card.querySelector('[data-rectheme]');
      if(chipBtn){
        chipBtn.addEventListener('click', function(e){
          e.stopPropagation();
          L.openThemePickerModal(id);
        });
      }
      var delBtn = card.querySelector('[data-recdel]');
      if(delBtn){
        delBtn.addEventListener('click', async function(e){
          e.stopPropagation();
          if(!(await OurgoalCapabilities.call('ui.confirm', '이 기록을 휴지통으로 이동할까요?\n7일간 보관되며 언제든 원복할 수 있습니다.'))) return;
          await L.moveToTrash('record', id, rec, 'in_app', rec.text || rec.title || '체크인 기록');
          card.remove();
          onUpdate();
        });
      }
    });
  }

  K.wireRecordCards = wireRecordCards;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
