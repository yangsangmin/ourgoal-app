/**
 * OurGoal Record Theme Picker (기록 — 테마 선택창)
 *
 * 기록 카드 테마 배지로 여는 선택창, 현재 표시·테마 저장·기록 화면 갱신·토스트 책임. 기존 데이터와 오류 동작을 그대로 보존한다.
 * #TASK-ES-578(기록 테마 선택창 책임 원문 분열): index.html 인라인 IIFE 의 구간(이전 전 5665~5713줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 5665~5713줄(#TASK-ES-578 생성기 표지) ---- */
  /* =========================================================================
     [#TASK-ES-233] 3일 실천 완성 나의 6각 성장 차트 미리보기 SVG 렌더러
     - 6대 영역: 체력, 지식, 마음, 관계, 커리어, 루틴
     - recCount(0~2)에 따른 발광 노드 및 3단계 달성 진척도
  ========================================================================= */
  /* [#TASK-ES-568] renderColdstartRadarPreviewSvg · renderLifeBalanceWheel · renderRecordThemeFilters → js/tabs/records/growth-chart.js 로 옮김(잔여 책임 분열 — 교대근무 루틴·성장차트·홈 퀘스트 — 앞 주석 포함) */

  /* 1-Click HITL 테마 수정 팝업 (TASK-OG-001) */
  function openThemePickerModal(recId){
    var rec = L.state.profile.records.find(function(r){ return r.id===recId; });
    if(!rec || typeof L.RECORD_THEMES === 'undefined') return;
    var keys = ['mind','study','business','schedule','workout','daily'];
    var optionsHtml = keys.map(function(k){
      var th = L.RECORD_THEMES[k];
      var isCurrent = ((rec.theme || 'daily') === k);
      return '<div class="export-theme-opt'+(isCurrent?' active':'')+'" data-picktheme="'+k+'" style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-radius:12px;cursor:pointer;margin-bottom:8px;background:var(--card2);border:1px solid '+(isCurrent?th.color:'transparent')+';">' +
        '<div style="display:flex;align-items:center;gap:10px;">' +
          '<span style="font-size:1.3rem;">'+th.icon+'</span>' +
          '<div>' +
            '<div style="font-weight:700;font-size:.9rem;color:var(--ink);">'+th.label+(isCurrent?' <span style="font-size:.8125rem;color:'+th.color+';font-weight:600;">(현재)</span>':'')+'</div>' +
            '<div style="font-size:.8125rem;color:var(--ink-soft);">'+th.desc+'</div>' +
          '</div>' +
        '</div>' +
        '<span style="font-size:1.1rem;color:'+(isCurrent?th.color:'var(--ink-faint)')+';">'+(isCurrent?'✓':'›')+'</span>' +
      '</div>';
    }).join('');

    L.openModal(
      '<h3>기록 테마 변경</h3>' +
      '<p class="faint" style="font-size:.875rem;margin-bottom:14px;word-break:break-word;">"'+L.escapeHtml(rec.text)+'"</p>' +
      '<div id="themePickList">' + optionsHtml + '</div>' +
      '<div class="modal-actions" style="margin-top:12px;"><button class="btn btn-ghost" id="mCloseTheme" type="button">닫기</button></div>',
      function(sheet){
        sheet.querySelector('#mCloseTheme').addEventListener('click', L.closeModal);
        sheet.querySelectorAll('[data-picktheme]').forEach(function(item){
          item.addEventListener('click', async function(){
            var newTheme = item.dataset.picktheme;
            rec.theme = newTheme;
            rec.themeConfidence = 1.0;
            var th = L.RECORD_THEMES[newTheme];
            await L.saveProfile();
            L.closeModal();
            L.renderRecordsScreen();
            L.toast('테마를 [' + th.label + '](으)로 변경했어요');
          });
        });
      }
    );
  }

  K.openThemePickerModal = openThemePickerModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
