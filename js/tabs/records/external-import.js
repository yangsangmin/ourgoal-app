/**
 * OurGoal External Import (기록 — 외부 데이터 불러오기 (mock) · 홈 구성 열기)
 *
 * 기록 입력의 「외부 기록 불러오기」 단추(#importExternalBtn) 처리기 — 샘플 데이터(EXTERNAL_DATA, 이름 그대로 mock) 목록 창과 CSV/줄글 대량 가져오기 창 열기, 홈 구성 열기(openHomeCustomizer), 「개인 목표 200% 활용 가이드」 단추 처리기.
 * 처리기 등록 문 두 개는 bind 함수로 감싸 index.html 원래 자리에서 부른다. 한 줄에 두 문인 홈 구성·가이드 단추 등록 세 줄은 원래 자리에 그대로 있다. 샘플(mock) 데이터는 고치지 않고 그대로 옮겼다.
 * #TASK-ES-483(인라인 어려움 구역 H1 3차): index.html 인라인 IIFE 의 구간(이전 전 7929~7982 · 7983~7984 · 7990~7994줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 7929~7982줄(#TASK-ES-483 생성기 표지) ---- */
  function bindImportExternalBtn() { /* [#TASK-ES-483] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  document.getElementById('importExternalBtn').addEventListener('click', function(){
    L.openModal(
      '<h3>외부 데이터 불러오기</h3>' +
      '<p class="muted" style="margin:-8px 0 14px;">연동된 앱에서 오늘의 활동을 가져와요. 선택하면 기록 내용에 채워집니다.</p>' +
      '<div class="ms-list">' +
        L.EXTERNAL_DATA.map(function(d){
          return '<div class="ms-row" data-ext="'+d.id+'" style="cursor:pointer;">' +
            '<div class="ms-main">' +
              '<div style="font-size:1.2rem;">'+d.icon+'</div>' +
              '<div style="flex:1;">' +
                '<div style="font-size:.9375rem;font-weight:600;">'+L.escapeHtml(d.text)+'</div>' +
                '<div class="faint" style="font-size:.8125rem;">'+L.escapeHtml(d.src)+'</div>' +
              '</div>' +
            '</div>' +
          '</div>';
        }).join('') +
      '</div>' +
      '<p class="faint" style="margin-top:12px;">지금은 샘플 데이터예요 · 실제 연동은 각 서비스의 API 인증이 필요해요</p>' +
      '<div class="modal-actions" style="display:flex;flex-direction:column;gap:6px;">' +
        '<button class="btn btn-primary btn-block" id="extOpenUniversalModalBtn" type="button">📥 CSV/줄글/1년치 추천샘플 대량 가져오기</button>' +
        '<button class="btn btn-ghost btn-block" id="extCancel" type="button">닫기</button>' +
      '</div>',
      function(sheet){
        sheet.querySelector('#extCancel').addEventListener('click', L.closeModal);
        var uBtn = sheet.querySelector('#extOpenUniversalModalBtn');
        if(uBtn){
          uBtn.onclick = function(){
            L.closeModal();
            if(typeof OurgoalUniversalStats !== 'undefined'){
              OurgoalUniversalStats.openUniversalImportModal({
                openModal: L.openModal,
                closeModal: L.closeModal,
                toast: L.toast,
                state: L.state,
                saveProfile: L.saveProfile,
                onDone: function(){ if(L.state) L.state.recordsSegment = 'stats'; L.renderRecordsScreen(); }
              });
            }
          };
        }
        sheet.querySelectorAll('[data-ext]').forEach(function(row){
          row.addEventListener('click', function(){
            var d = L.EXTERNAL_DATA.find(function(x){ return x.id===row.dataset.ext; });
            if(!d) return;
            var input = document.getElementById('captureInput');
            input.value = (input.value ? input.value.trim()+'\r\n' : '') + d.icon+' '+d.text;
            L.closeModal();
            input.focus();
            L.toast(d.src+' 데이터를 불러왔어요');
          });
        });
      }
    );
  });
  } /* bindImportExternalBtn */
  /* ---- 이전 전 index.html 7983~7984줄(#TASK-ES-483 생성기 표지) ---- */

  function openHomeCustomizer(){ if(window.OurgoalCustomize && typeof window.OurgoalCustomize.open === 'function'){ OurgoalCustomize.open({ state: L.state, saveProfile: L.saveProfile, toast: L.toast, openModal: L.openModal, closeModal: L.closeModal, track: L.track }); } else { var settingOpenBtn = document.getElementById('homeLayoutOpenBtn'); if(settingOpenBtn) settingOpenBtn.click(); } }

  /* ---- 이전 전 index.html 7990~7994줄(#TASK-ES-483 생성기 표지) ---- */
  function bindPersonalGuideBtn() { /* [#TASK-ES-483] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  if(L.btnShowGuide){
    L.btnShowGuide.addEventListener('click', function(){
      L.openModal('개인 목표 200% 활용 가이드', L.renderPersonalGoalsEmptyGuideHtml());
    });
  }
  } /* bindPersonalGuideBtn */

  K.bindImportExternalBtn = bindImportExternalBtn;
  K.openHomeCustomizer = openHomeCustomizer;
  K.bindPersonalGuideBtn = bindPersonalGuideBtn;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
