/**
 * OurGoal Stats Cell: 패싯 온톨로지 탐색기·스키마 CRUD 모달 — openTaxonomyManagerModal (#TASK-ES-392 · 통계 세포 쪼개기 1차)
 *
 * js/universal-stats.js(이전 전 6,092줄)에서 동작 그대로 옮겼다(이전 전 3199~3354줄).
 *   openTaxonomyManagerModal
 * 바꾼 것은 이름 참조뿐이다 — 원본 스코프 이름은 S.<이름>, 다른 통계 세포 파일의 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 바깥에서는 이전과 같이 window.OurgoalUniversalStats.<함수> 로 부른다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(root) {
  'use strict';
  // S = js/universal-stats.js 의 스코프 통로 — 원본 IIFE 에 남은 공용 함수·값(askConfirm·getChosung·DOMAINS …)을 getter 로 읽는다(원본이 로드될 때 채운다). 값은 읽을 때마다 살아 있는 값이다.
  // K = 통계 세포 키트 — 옮긴 함수를 담는다. 원본은 IIFE 맨 위에서 K 의 함수를 같은 이름으로 가져온다(전역 이름을 함수마다 늘리지 않는다).
  var K = root.OurgoalUniversalStatsKit = root.OurgoalUniversalStatsKit || {};
  var S = K.scope = K.scope || {};

  /* ================= 8. 패싯 온톨로지 탐색기 & 스키마 CRUD 모달 ================= */
  function openTaxonomyManagerModal(options){
    options = options || {};
    var allRecs = options.allRecs || [];
    var state = options.state || {};
    var callbacks = options.callbacks || {};
    var openModalFn = callbacks.openModal || window.openModal;
    var closeModalFn = callbacks.closeModal || window.closeModal;
    if(!openModalFn) return;

    var customSchemas = (state.profile && state.profile.customSchemas) || [];
    var curDomainFilter = 'all';
    var curSearchQuery = '';

    function renderModalContent(containerEl){
      var ontology = S.buildUniversalOntology(allRecs, customSchemas);
      var filtered = ontology.filter(function(o){
        if(curDomainFilter !== 'all' && o.domainKey !== curDomainFilter) return false;
        if(curSearchQuery && !S.matchQuery(o.name, curSearchQuery)) return false;
        return true;
      });

      var domainPills = '<div style="display:flex;gap:4px;overflow-x:auto;padding-bottom:6px;margin-bottom:10px;">';
      domainPills += '<button type="button" class="u-tax-dom-btn" data-dom="all" style="padding:4px 8px;border-radius:12px;border:none;font-size:.75rem;font-weight:700;cursor:pointer;background:' + (curDomainFilter === 'all' ? 'var(--primary)' : 'var(--card2)') + ';color:' + (curDomainFilter === 'all' ? '#fff' : 'var(--ink)') + ';">전체</button>';
      Object.values(S.DOMAINS).forEach(function(d){
        var isA = (curDomainFilter === d.key);
        domainPills += '<button type="button" class="u-tax-dom-btn" data-dom="' + d.key + '" style="padding:4px 8px;border-radius:12px;border:none;font-size:.75rem;font-weight:700;cursor:pointer;background:' + (isA ? 'var(--primary)' : 'var(--card2)') + ';color:' + (isA ? '#fff' : 'var(--ink)') + ';">' + d.icon + ' ' + d.name + '</button>';
      });
      domainPills += '</div>';

      var listHtml = '<div style="max-height:40vh;overflow-y:auto;display:flex;flex-direction:column;gap:6px;">';
      if(filtered.length === 0){
        listHtml += '<div style="padding:20px;text-align:center;color:var(--ink-soft);font-size:.8125rem;">검색 결과가 없습니다. 아래에서 직접 추가해보세요!</div>';
      } else {
        filtered.forEach(function(item){
          var isSel = (state.univSelectedEntities || []).includes(item.name);
          listHtml += 
            '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--card2);border-radius:10px;">' +
              '<div style="display:flex;align-items:center;gap:8px;">' +
                '<span style="font-size:1.1rem;">' + item.icon + '</span>' +
                '<div>' +
                  '<div style="font-size:.875rem;font-weight:700;color:var(--ink);">' + item.name + ' ' + (item.isCustom ? '<span style="font-size:.65rem;padding:1px 4px;border-radius:4px;background:rgba(139,92,246,0.15);color:#8b5cf6;">커스텀</span>' : '') + '</div>' +
                  '<div style="font-size:.75rem;color:var(--ink-soft);">' + (item.count ? (item.count + '개 기록') : '정의된 스키마') + (item.primaryUnit ? (' · ' + item.primaryUnit) : '') + '</div>' +
                '</div>' +
              '</div>' +
              '<div style="display:flex;gap:4px;">' +
                '<button type="button" class="btn btn-xs u-tax-select-btn" data-name="' + item.name + '" style="background:' + (isSel ? 'var(--primary)' : 'var(--card)') + ';color:' + (isSel ? '#fff' : 'var(--ink)') + ';border:1px solid var(--border);">' + (isSel ? '선택됨' : '선택') + '</button>' +
                (item.isCustom ? ('<button type="button" class="btn btn-xs btn-ghost u-tax-del-btn" data-name="' + item.name + '" style="color:#ef4444;">삭제</button>') : '') +
              '</div>' +
            '</div>';
        });
      }
      listHtml += '</div>';

      var addFormHtml = 
        '<div style="margin-top:12px;padding:10px 12px;background:var(--card);border:1px solid var(--border);border-radius:10px;">' +
          '<div style="font-size:.8125rem;font-weight:700;color:var(--ink);margin-bottom:6px;">+ 새 분류/단위 직접 정의 (Custom Schema)</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:6px;">' +
            '<select id="uTaxNewDomain" style="padding:6px;font-size:.8125rem;border-radius:6px;border:1px solid var(--border);background:var(--card2);color:var(--ink);">' +
              Object.values(S.DOMAINS).map(function(d){ return '<option value="' + d.key + '">' + d.icon + ' ' + d.name + '</option>'; }).join('') +
            '</select>' +
            '<input id="uTaxNewName" type="text" placeholder="항목명 (예: 플랭크, 한자암기)" style="padding:6px;font-size:.8125rem;border-radius:6px;border:1px solid var(--border);background:var(--card2);color:var(--ink);">' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px;">' +
            '<input id="uTaxNewPUnit" type="text" placeholder="1차 단위 (예: 초, 자, kg, 쪽)" style="padding:6px;font-size:.8125rem;border-radius:6px;border:1px solid var(--border);background:var(--card2);color:var(--ink);">' +
            '<input id="uTaxNewSUnit" type="text" placeholder="2차 단위 (선택, 예: 세트, 분)" style="padding:6px;font-size:.8125rem;border-radius:6px;border:1px solid var(--border);background:var(--card2);color:var(--ink);">' +
          '</div>' +
          '<button type="button" class="btn btn-primary btn-sm" id="uTaxAddSchemaBtn" style="width:100%;font-weight:700;">+ 스키마 등록 및 온톨로지 반영</button>' +
        '</div>';

      containerEl.innerHTML = 
        '<div style="max-height:75vh;overflow-y:auto;padding:2px;">' +
          '<div style="margin-bottom:8px;">' +
            '<input id="uTaxSearchInput" type="search" placeholder="초성 고속 검색 (예: ㅂㅊ, ㅅㅋ, ㄷㅅ, 독서)" value="' + curSearchQuery + '" style="width:100%;padding:8px 12px;border-radius:10px;border:1px solid var(--border);font-size:.875rem;background:var(--card2);color:var(--ink);box-sizing:border-box;">' +
          '</div>' +
          domainPills +
          listHtml +
          addFormHtml +
        '</div>';

      // 이벤트 바인딩
      var sInput = containerEl.querySelector('#uTaxSearchInput');
      if(sInput){
        sInput.oninput = function(){
          curSearchQuery = sInput.value;
          renderModalContent(containerEl);
          var nextInp = containerEl.querySelector('#uTaxSearchInput');
          if(nextInp){
            nextInp.focus();
            nextInp.selectionStart = nextInp.selectionEnd = nextInp.value.length;
          }
        };
      }

      containerEl.querySelectorAll('.u-tax-dom-btn').forEach(function(btn){
        btn.onclick = function(){
          curDomainFilter = btn.dataset.dom;
          renderModalContent(containerEl);
        };
      });

      containerEl.querySelectorAll('.u-tax-select-btn').forEach(function(btn){
        btn.onclick = function(){
          var entName = btn.dataset.name;
          state.univSelectedEntities = [entName];
          state.univMode = 'single';
          if(callbacks.onDone) callbacks.onDone();
          closeModalFn();
        };
      });

      containerEl.querySelectorAll('.u-tax-del-btn').forEach(function(btn){
        btn.onclick = async function(){
          var entName = btn.dataset.name;
          if(!(await S.askConfirm('[' + entName + '] 스키마를 삭제하시겠습니까? (기존 기록은 안전 보존됩니다)'))) return;
          customSchemas = customSchemas.filter(function(cs){ return cs.name !== entName; });
          if(state.profile) state.profile.customSchemas = customSchemas;
          if(callbacks.saveProfile) callbacks.saveProfile();
          renderModalContent(containerEl);
        };
      });

      var addBtn = containerEl.querySelector('#uTaxAddSchemaBtn');
      if(addBtn){
        addBtn.onclick = function(){
          var nameInput = containerEl.querySelector('#uTaxNewName');
          var nameVal = (nameInput && nameInput.value || '').trim();
          if(!nameVal){
            alert('항목명을 입력해주세요.');
            return;
          }
          var domVal = containerEl.querySelector('#uTaxNewDomain').value;
          var pUnit = (containerEl.querySelector('#uTaxNewPUnit').value || '').trim();
          var sUnit = (containerEl.querySelector('#uTaxNewSUnit').value || '').trim();

          customSchemas.push({
            name: nameVal,
            domainKey: domVal,
            primaryUnit: pUnit,
            secondaryUnit: sUnit,
            icon: S.DOMAINS[domVal] ? S.DOMAINS[domVal].icon : '📌'
          });
          if(state.profile) state.profile.customSchemas = customSchemas;
          if(callbacks.saveProfile) callbacks.saveProfile();
          if(callbacks.toast) callbacks.toast('[' + nameVal + '] 스키마가 성공적으로 등록되었습니다!');
          renderModalContent(containerEl);
        };
      }
    }

    var fullHtml = '<div class="modal-head" style="margin-bottom:12px;"><h3 style="margin:0;font-size:1.125rem;font-weight:800;color:var(--ink);">🔍 다형성 패싯 온톨로지 탐색기</h3></div><div id="uTaxModalContainer"></div>';
    openModalFn(fullHtml, function(modalEl){
      var cEl = modalEl ? modalEl.querySelector('#uTaxModalContainer') : null;
      if(cEl) renderModalContent(cEl);
    });
  }

  K.openTaxonomyManagerModal = openTaxonomyManagerModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : global);
