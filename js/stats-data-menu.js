/**
 * OurGoal Stats Cell: 데이터 관리 메뉴·활용 가이드 모달 — openGuideModal · openDataManagementModal (#TASK-ES-401 · 통계 세포 쪼개기 2차)
 *
 * js/universal-stats.js(이전 전 5,171줄)에서 동작 그대로 옮겼다(이전 전 3160~3222, 3235~3364줄).
 *   openGuideModal · openDataManagementModal
 * 바꾼 것은 이름 참조뿐이다 — 원본 스코프 이름은 S.<이름>, 다른 통계 세포 파일의 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 바깥에서는 이전과 같이 window.OurgoalUniversalStats.<함수> 로 부른다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(root) {
  'use strict';
  // S = js/universal-stats.js 의 스코프 통로 — 원본 IIFE 에 남은 공용 함수·값(pad·METRIC_CONFIGS·askConfirm …)을 getter 로 읽는다(원본이 로드될 때 채운다). 값은 읽을 때마다 살아 있는 값이다.
  // K = 통계 세포 키트 — 옮긴 함수를 담는다. 원본은 IIFE 맨 위에서 K 의 함수를 같은 이름으로 가져온다(전역 이름을 함수마다 늘리지 않는다).
  var K = root.OurgoalUniversalStatsKit = root.OurgoalUniversalStatsKit || {};
  var S = K.scope = K.scope || {};

  /* ================= 7. 활용 가이드 모달 (Guide Modal - OurGoal Philosophy) ================= */
  function openGuideModal(options){
    options = options || {};
    var openModalFn = options.openModal || window.openModal;
    var closeModalFn = options.closeModal || window.closeModal;
    if(!openModalFn) return;

    var bodyHtml = 
      '<div style="max-height:75vh;overflow-y:auto;padding:4px 2px;">' +
        '<div style="text-align:center;margin-bottom:16px;">' +
          '<div style="font-size:2rem;margin-bottom:6px;">🚀</div>' +
          '<h3 style="font-size:1.125rem;font-weight:800;color:var(--ink);margin:0;">나의 역사와 미래를 담는 자율 데이터 콕핏</h3>' +
          '<p style="font-size:.8125rem;color:var(--ink-soft);margin-top:4px;">기록을 숫자로 끝내지 않고 실천과 성장으로 잇는 아워골의 5대 원칙</p>' +
        '</div>' +

        '<div style="display:flex;flex-direction:column;gap:12px;">' +
          '<div class="card" style="padding:12px 14px;border-radius:12px;background:var(--card);border-left:4px solid #3b82f6;margin:0;">' +
            '<div style="font-weight:800;font-size:.875rem;color:#3b82f6;margin-bottom:4px;">1. 테마 제약 없는 유니버설 데이터 주권</div>' +
            '<div style="font-size:.8125rem;color:var(--ink);line-height:1.5;">' +
              '운동, 독서, 학술 연구, 재테크, 프로젝트, 멘탈 회고까지 어떤 형태의 데이터든 스스로 알맞은 단위와 스케일을 입혀 융합합니다. 100년 전 1924년 올림픽 데이터부터 52주간의 성장 궤적까지 100% 무손실로 보존됩니다.' +
            '</div>' +
          '</div>' +

          '<div class="card" style="padding:12px 14px;border-radius:12px;background:var(--card);border-left:4px solid #10b981;margin:0;">' +
            '<div style="font-weight:800;font-size:.875rem;color:#10b981;margin-bottom:4px;">2. 트레이딩뷰급 정밀 십자선 & 7-Tier 시계열 분석</div>' +
            '<div style="font-size:.8125rem;color:var(--ink);line-height:1.5;">' +
              '전체(역대)부터 1년, 6개월, 3개월, 1개월, 1주, 3일까지 7단계로 절삭하여 추세를 관측합니다. 차트 위를 호버하면 <b>자석 스냅 십자선(Crosshair)</b>과 세션 간 <b>변동폭(Δ)</b>, <b>PR 별 배지</b>가 실시간 플로팅 인스펙터로 즉시 표출됩니다.' +
            '</div>' +
          '</div>' +

          '<div class="card" style="padding:12px 14px;border-radius:12px;background:var(--card);border-left:4px solid #8b5cf6;margin:0;">' +
            '<div style="font-weight:800;font-size:.875rem;color:#8b5cf6;margin-bottom:4px;">3. 노션식 EAV 온톨로지 & 초성 고속 검색</div>' +
            '<div style="font-size:.8125rem;color:var(--ink);line-height:1.5;">' +
              '<b>[🔍 Facet Taxonomy Explorer]</b>를 통해 8대 도메인 트리를 자유자재로 탐색하고, <b>초성 검색</b>(예: <code>ㅂㅊ</code> ➔ 벤치프레스, <code>ㅅㅋ</code> ➔ 스쿼트, <code>ㄷㅅ</code> ➔ 독서)으로 원하는 지표를 1ms 만에 찾아냅니다. 필요 시 사용자가 직접 단위를 정의할 수도 있습니다.' +
            '</div>' +
          '</div>' +

          '<div class="card" style="padding:12px 14px;border-radius:12px;background:var(--card);border-left:4px solid #f59e0b;margin:0;">' +
            '<div style="font-weight:800;font-size:.875rem;color:#f59e0b;margin-bottom:4px;">4. 엔터프라이즈 데이터 그리드 (무손실 CRUD & 클린 CSV)</div>' +
            '<div style="font-size:.8125rem;color:var(--ink);line-height:1.5;">' +
              '<b>[📋 DATA GRID]</b> 버튼을 누르면 엑셀 수준의 고밀도 테이블이 열립니다. 도메인별 자동 헤더 전환, 모노스페이스 다차원 3상태 정렬, 단건 수정/삭제, <b>체크박스 일괄 삭제</b>, <b>클린 CSV 내보내기</b>를 통해 데이터를 완벽히 통제할 수 있습니다.' +
            '</div>' +
          '</div>' +

          '<div class="card" style="padding:12px 14px;border-radius:12px;background:var(--card);border-left:4px solid #ec4899;margin:0;">' +
            '<div style="font-weight:800;font-size:.875rem;color:#ec4899;margin-bottom:4px;">5. 실시간 목표 및 캘린더 실천 연계 (비용 0원)</div>' +
            '<div style="font-size:.8125rem;color:var(--ink);line-height:1.5;">' +
              '데이터에서 달성한 최고 수치는 <b>내 목표(Goal) 진척도로 1초 만에 자동 동기화</b>되며, Gemini AI 진단에서 추천된 행동은 <b>[📅 캘린더에 실천 등록]</b> 클릭 한 번으로 내 일정에 0초 만에 안착됩니다.' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div style="margin-top:16px;text-align:center;">' +
          '<button type="button" class="btn btn-primary" id="uGuideCloseBtn" style="width:100%;font-weight:700;">확인했습니다</button>' +
        '</div>' +
      '</div>';

    var fullHtml = '<div class="modal-head" style="margin-bottom:12px;"><h3 style="margin:0;font-size:1.125rem;font-weight:800;color:var(--ink);">💡 아워골 자율 데이터 콕핏 안내</h3></div>' + bodyHtml;
    openModalFn(fullHtml, function(modalEl){
      var cBtn = modalEl ? modalEl.querySelector('#uGuideCloseBtn') : null;
      if(cBtn && closeModalFn) cBtn.onclick = closeModalFn;
    });
  }

  function openDataManagementModal(options){
    options = options || {};
    var allRecs = options.allRecs || [];
    var state = options.state || {};
    var callbacks = options.callbacks || {};
    var openModalFn = callbacks.openModal || window.openModal;
    var closeModalFn = callbacks.closeModal || window.closeModal;
    if(!openModalFn) return;

    var menuHtml = 
      '<div class="modal-head" style="margin-bottom:12px;">' +
        '<h3 style="margin:0;font-size:1.125rem;font-weight:800;color:var(--ink);">⚙️ 데이터 관리 & 분석 도구</h3>' +
      '</div>' +
      '<div style="font-size:.8125rem;color:var(--ink-soft);margin-bottom:14px;line-height:1.4;">' +
        '새로운 데이터를 추가하거나, 기존 기록을 표로 조회·수정하고, 파일로 백업할 수 있습니다.' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:8px;">' +
        '<button type="button" class="btn btn-ghost" id="uMenuImportBtn" style="height:auto;padding:12px 14px;text-align:left;display:flex;align-items:center;gap:12px;border:1.5px solid var(--border);border-radius:12px;cursor:pointer;transition:background .15s;">' +
          '<span style="font-size:1.4rem;">📥</span>' +
          '<div style="flex:1;">' +
            '<div style="font-weight:800;font-size:.875rem;color:var(--ink);">새 데이터 가져오기 & 1초 샘플</div>' +
            '<div style="font-size:.75rem;color:var(--ink-soft);margin-top:2px;">CSV 파일 업로드, 엑셀 텍스트 붙여넣기, 52주 추천 샘플 1초 로드</div>' +
          '</div>' +
        '</button>' +
        '<button type="button" class="btn btn-ghost" id="uMenuGridBtn" style="height:auto;padding:12px 14px;text-align:left;display:flex;align-items:center;gap:12px;border:1.5px solid var(--border);border-radius:12px;cursor:pointer;transition:background .15s;">' +
          '<span style="font-size:1.4rem;">📋</span>' +
          '<div style="flex:1;">' +
            '<div style="font-weight:800;font-size:.875rem;color:var(--ink);">전체 기록 데이터 표 (그리드)</div>' +
            '<div style="font-size:.75rem;color:var(--ink-soft);margin-top:2px;">모든 기록을 테이블로 검색, 정렬하고 수치를 직접 수정·삭제</div>' +
          '</div>' +
        '</button>' +
        '<button type="button" class="btn btn-ghost" id="uMenuExportCsvBtn" style="height:auto;padding:12px 14px;text-align:left;display:flex;align-items:center;gap:12px;border:1.5px solid var(--border);border-radius:12px;cursor:pointer;transition:background .15s;">' +
          '<span style="font-size:1.4rem;">💾</span>' +
          '<div style="flex:1;">' +
            '<div style="font-weight:800;font-size:.875rem;color:var(--ink);">CSV 파일로 백업 다운로드</div>' +
            '<div style="font-size:.75rem;color:var(--ink-soft);margin-top:2px;">정제된 전체 기록을 엑셀에서 열 수 있는 CSV로 다운로드</div>' +
          '</div>' +
        '</button>' +
        '<button type="button" class="btn btn-ghost" id="uMenuTaxonomyBtn" style="height:auto;padding:12px 14px;text-align:left;display:flex;align-items:center;gap:12px;border:1.5px solid var(--border);border-radius:12px;cursor:pointer;transition:background .15s;">' +
          '<span style="font-size:1.4rem;">🔍</span>' +
          '<div style="flex:1;">' +
            '<div style="font-weight:800;font-size:.875rem;color:var(--ink);">항목 온톨로지 탐색기</div>' +
            '<div style="font-size:.75rem;color:var(--ink-soft);margin-top:2px;">새로운 분석 종목 및 맞춤 단위(kg, 쪽, 만원 등) 스키마 관리</div>' +
          '</div>' +
        '</button>' +
        '<button type="button" class="btn btn-ghost" id="uMenuSnapBtn" style="height:auto;padding:12px 14px;text-align:left;display:flex;align-items:center;gap:12px;border:1.5px solid var(--border);border-radius:12px;cursor:pointer;transition:background .15s;">' +
          '<span style="font-size:1.4rem;">📸</span>' +
          '<div style="flex:1;">' +
            '<div style="font-weight:800;font-size:.875rem;color:var(--ink);">차트 스냅샷 이미지 저장</div>' +
            '<div style="font-size:.75rem;color:var(--ink-soft);margin-top:2px;">현재 콕핏 차트와 KPI 카드를 깨끗한 PNG 이미지로 보관</div>' +
          '</div>' +
        '</button>' +
      '</div>';

    openModalFn(menuHtml, function(modalEl){
      if(!modalEl) return;
      var curAllRecs = (state && state.profile && state.profile.records) || allRecs;

      var impB = modalEl.querySelector('#uMenuImportBtn');
      if(impB){
        impB.onclick = function(){
          // closeModalFn() 호출 없이 직접 import 모달로 전환 (popstate 레이스 컨디션 차단)
          K.openUniversalImportModal({
            openModal: openModalFn,
            closeModal: closeModalFn,
            toast: callbacks.toast || (typeof window !== 'undefined' ? window.toast : null),
            state: state,
            saveProfile: callbacks.saveProfile || (typeof window !== 'undefined' ? window.saveProfile : null),
            onDone: function(type, count){
              if(options.onDone) options.onDone(type, count);
              if(callbacks.onDone) callbacks.onDone(type, count);
            }
          });
        };
      }
      var gridB = modalEl.querySelector('#uMenuGridBtn');
      if(gridB){
        gridB.onclick = function(){
          K.openUniversalDataGrid({
            allRecs: (state && state.profile && state.profile.records) || allRecs,
            state: state,
            callbacks: {
              openModal: openModalFn,
              closeModal: closeModalFn,
              saveProfile: callbacks.saveProfile || (typeof window !== 'undefined' ? window.saveProfile : null),
              toast: callbacks.toast || (typeof window !== 'undefined' ? window.toast : null),
              onDone: function(){
                if(options.onDone) options.onDone();
                if(callbacks.onDone) callbacks.onDone();
              }
            }
          });
        };
      }
      var expB = modalEl.querySelector('#uMenuExportCsvBtn');
      if(expB){
        expB.onclick = function(){
          closeModalFn();
          S.exportCleanCsv((state && state.profile && state.profile.records) || allRecs, 'ourgoal_analytics_export.csv');
        };
      }
      var taxB = modalEl.querySelector('#uMenuTaxonomyBtn');
      if(taxB){
        taxB.onclick = function(){
          K.openTaxonomyManagerModal({
            allRecs: (state && state.profile && state.profile.records) || allRecs,
            state: state,
            callbacks: {
              openModal: openModalFn,
              closeModal: closeModalFn,
              saveProfile: callbacks.saveProfile || (typeof window !== 'undefined' ? window.saveProfile : null),
              toast: callbacks.toast || (typeof window !== 'undefined' ? window.toast : null),
              onDone: function(){
                if(options.onDone) options.onDone();
                if(callbacks.onDone) callbacks.onDone();
              }
            }
          });
        };
      }
      var snapB = modalEl.querySelector('#uMenuSnapBtn');
      if(snapB){
        snapB.onclick = function(){
          closeModalFn();
          var mainCard = (typeof document !== 'undefined') ? document.querySelector('#uCockpitMainCard') : null;
          if(mainCard) S.captureChartSnapshot(mainCard, 'ourgoal_cockpit');
        };
      }
    });
  }

  K.openGuideModal = openGuideModal;
  K.openDataManagementModal = openDataManagementModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : global);
