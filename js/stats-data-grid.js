/**
 * OurGoal Stats Cell: 도메인 중립 데이터 그리드 모달·행 편집 모달 — openUniversalDataGrid · openRowEditModal (#TASK-ES-392 · 통계 세포 쪼개기 1차)
 *
 * js/universal-stats.js(이전 전 6,092줄)에서 동작 그대로 옮겼다(이전 전 3356~3805줄).
 *   openUniversalDataGrid · openRowEditModal
 * 바꾼 것은 이름 참조뿐이다 — 원본 스코프 이름은 S.<이름>, 다른 통계 세포 파일의 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 바깥에서는 이전과 같이 window.OurgoalUniversalStats.<함수> 로 부른다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(root) {
  'use strict';
  // S = js/universal-stats.js 의 스코프 통로 — 원본 IIFE 에 남은 공용 함수·값(askConfirm·getChosung·DOMAINS …)을 getter 로 읽는다(원본이 로드될 때 채운다). 값은 읽을 때마다 살아 있는 값이다.
  // K = 통계 세포 키트 — 옮긴 함수를 담는다. 원본은 IIFE 맨 위에서 K 의 함수를 같은 이름으로 가져온다(전역 이름을 함수마다 늘리지 않는다).
  var K = root.OurgoalUniversalStatsKit = root.OurgoalUniversalStatsKit || {};
  var S = K.scope = K.scope || {};

  /* ================= 9. 도메인 중립 엔터프라이즈 데이터 그리드 모달 ================= */
  function openUniversalDataGrid(options){
    options = options || {};
    var allRecs = options.allRecs || [];
    var state = options.state || {};
    var callbacks = options.callbacks || {};
    var openModalFn = callbacks.openModal || window.openModal;
    var closeModalFn = callbacks.closeModal || window.closeModal;
    if(!openModalFn) return;

    var sortCol = 'date';
    var sortDir = 'desc'; // 'desc', 'asc', 'none'
    var curQuery = '';
    var curSource = 'all';
    var curPage = 1;
    var pageSize = 30;
    var selectedRecIds = {};

    function getDisplayRecord(r){
      var d = (r.startAt || r.createdAt || '').slice(0, 10);
      var ent = r.subTheme || r.item || r.exercise || '일반';
      var pVal = (r.metrics && (r.metrics.primary !== undefined ? r.metrics.primary : (r.metrics.revenue !== undefined ? r.metrics.revenue : (r.metrics.commits !== undefined ? r.metrics.commits : (r.metrics.problems !== undefined ? r.metrics.problems : (r.metrics['1rm'] || r.metrics.pages || r.metrics.distance || 0)))))) || 0;
      var pUnit = (r.metrics && r.metrics.primaryUnit) || (r.metricUnits && (r.metricUnits.primary || r.metricUnits.revenue || r.metricUnits.commits || r.metricUnits.problems)) || (r.metrics && r.metrics['1rm'] ? 'kg' : (r.metrics && r.metrics.pages ? '쪽' : (r.metrics && r.metrics.revenue ? '만원' : '')));
      var sVal = (r.metrics && (r.metrics.secondary !== undefined ? r.metrics.secondary : (r.metrics.deals !== undefined ? r.metrics.deals : (r.metrics.prs !== undefined ? r.metrics.prs : (r.metrics.volume || r.metrics.duration || 0))))) || 0;
      var sUnit = (r.metrics && r.metrics.secondaryUnit) || (r.metricUnits && (r.metricUnits.secondary || r.metricUnits.deals || r.metricUnits.prs)) || (r.metrics && r.metrics.volume ? 'kg' : (r.metrics && r.metrics.duration ? '분' : (r.metrics && r.metrics.deals ? '건' : '')));
      var memo = r.text || '';
      var src = r.source || 'in_app';
      var rawTime = new Date(r.startAt || r.createdAt).getTime();

      return {
        id: r.id || (d + '_' + Math.random()),
        date: d,
        rawTime: rawTime,
        entity: ent,
        primaryVal: pVal,
        primaryUnit: pUnit,
        secondaryVal: sVal,
        secondaryUnit: sUnit,
        memo: memo,
        source: src,
        raw: r
      };
    }

    function renderGrid(modalContainer){
      var mapped = allRecs.map(getDisplayRecord);

      // 필터링
      var filtered = mapped.filter(function(row){
        if(curSource !== 'all' && row.source !== curSource) return false;
        if(curQuery){
          var q = curQuery.toLowerCase();
          var hit = row.date.indexOf(q) !== -1 || row.entity.toLowerCase().indexOf(q) !== -1 || row.memo.toLowerCase().indexOf(q) !== -1;
          if(!hit && /^[ㄱ-ㅎ]+$/.test(q)){
            hit = S.getChosung(row.entity).indexOf(q) !== -1;
          }
          if(!hit) return false;
        }
        return true;
      });

      // 정렬
      if(sortDir !== 'none'){
        filtered.sort(function(a, b){
          var cmp = 0;
          if(sortCol === 'date') cmp = a.rawTime - b.rawTime;
          else if(sortCol === 'entity') cmp = a.entity.localeCompare(b.entity);
          else if(sortCol === 'primary') cmp = a.primaryVal - b.primaryVal;
          else if(sortCol === 'secondary') cmp = a.secondaryVal - b.secondaryVal;
          return (sortDir === 'desc' ? -cmp : cmp);
        });
      }

      var totalRows = filtered.length;
      var pagedRows = filtered.slice(0, curPage * pageSize);

            // 도메인 감지 헤더
      var h1 = '1차 지표';
      var h2 = '2차 지표';
      var sampleRow = pagedRows[0];
      if(sampleRow){
        var entLower = (sampleRow.entity || '').toLowerCase();
        var rawM = (sampleRow.raw && sampleRow.raw.metrics) || {};
        var isWeightlifting = /스쿼트|벤치프레스|데드리프트|역도|파워리프팅/.test(entLower);
        if(rawM.revenue !== undefined || /영업|매출|계약/.test(entLower)){
          h1 = '매출실적 (' + (sampleRow.primaryUnit || '만원') + ')';
          h2 = '계약/미팅 (' + (sampleRow.secondaryUnit || '건') + ')';
        } else if(rawM.commits !== undefined || /개발|커밋|코딩|git/.test(entLower)){
          h1 = '커밋수 (' + (sampleRow.primaryUnit || '개') + ')';
          h2 = 'PR/리뷰 (' + (sampleRow.secondaryUnit || '개') + ')';
        } else if(rawM.problems !== undefined || /공부|수험|학습|문제/.test(entLower)){
          h1 = '소요시간 (' + (sampleRow.primaryUnit || '분') + ')';
          h2 = '문제풀이 (' + (sampleRow.secondaryUnit || '개') + ')';
        } else if(isWeightlifting && sampleRow.primaryUnit === 'kg'){
          h1 = 'Peak 1RM (kg)';
          h2 = 'Total Vol (kg)';
        } else if(sampleRow.primaryUnit === '쪽' || /독서|책/.test(entLower)){
          h1 = '독서량 (쪽)';
          h2 = '집중시간 (분)';
        } else if(sampleRow.primaryUnit === 'km' || /러닝|달리기/.test(entLower)){
          h1 = '거리 (km)';
          h2 = '소요시간 (분)';
        } else if(sampleRow.primaryUnit === 'hr' || sampleRow.primaryUnit === '시간' || /수면|잠/.test(entLower)){
          h1 = '수면시간 (' + (sampleRow.primaryUnit || '시간') + ')';
          h2 = '컨디션 점수';
        } else if(sampleRow.primaryUnit === '원' || sampleRow.primaryUnit === '만원' || /재테크|저축|자산/.test(entLower)){
          h1 = '저축/투자 (' + (sampleRow.primaryUnit || '만원') + ')';
          h2 = '건수/수익률';
        } else {
          h1 = sampleRow.primaryUnit ? ('1차 지표 (' + sampleRow.primaryUnit + ')') : '1차 지표';
          h2 = sampleRow.secondaryUnit ? ('2차 지표 (' + sampleRow.secondaryUnit + ')') : '2차 지표';
        }
      }

      var sortIcon = function(c){
        if(sortCol !== c || sortDir === 'none') return ' ↕';
        return sortDir === 'desc' ? ' ▼' : ' ▲';
      };

      var tableRows = pagedRows.map(function(row){
        var isChecked = !!selectedRecIds[row.id];
        return (
          '<tr style="border-bottom:1px solid var(--border);font-size:.8125rem;">' +
            '<td style="padding:6px 4px;text-align:center;"><input type="checkbox" class="u-grid-row-chk" data-id="' + row.id + '" ' + (isChecked ? 'checked' : '') + '></td>' +
            '<td style="padding:6px 6px;font-family:monospace;font-weight:600;color:var(--ink);">' + row.date + '</td>' +
            '<td style="padding:6px 6px;font-weight:700;color:var(--primary);">' + row.entity + '</td>' +
            '<td style="padding:6px 6px;text-align:right;font-family:monospace;font-weight:700;color:var(--ink);">' + (row.primaryVal ? (row.primaryVal.toLocaleString() + ' ' + row.primaryUnit) : '-') + '</td>' +
            '<td style="padding:6px 6px;text-align:right;font-family:monospace;color:var(--ink-soft);">' + (row.secondaryVal ? (row.secondaryVal.toLocaleString() + ' ' + row.secondaryUnit) : '-') + '</td>' +
            '<td style="padding:6px 6px;color:var(--ink);max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="' + row.memo + '">' + (row.memo || '-') + '</td>' +
            '<td style="padding:6px 4px;text-align:center;">' +
              '<button type="button" class="btn btn-xs btn-ghost u-grid-edit-btn" data-id="' + row.id + '" style="padding:1px 4px;font-size:.7rem;">✏️</button>' +
              '<button type="button" class="btn btn-xs btn-ghost u-grid-del-btn" data-id="' + row.id + '" style="padding:1px 4px;font-size:.7rem;color:#ef4444;">🗑️</button>' +
            '</td>' +
          '</tr>'
        );
      }).join('');

      var selCount = Object.keys(selectedRecIds).length;

      modalContainer.innerHTML = 
        '<div style="max-height:78vh;display:flex;flex-direction:column;gap:8px;padding:2px;">' +
          // 상단 액션바
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:6px;flex-wrap:wrap;">' +
            '<div style="display:flex;align-items:center;gap:6px;">' +
              '<span style="font-weight:800;font-size:.9375rem;color:var(--ink);">총 ' + totalRows + '건</span>' +
              (selCount > 0 ? ('<button type="button" class="btn btn-xs btn-danger" id="uGridBulkDelBtn" style="background:#ef4444;color:#fff;font-weight:700;">' + selCount + '개 일괄 삭제</button>') : '') +
            '</div>' +
            '<div style="display:flex;gap:4px;">' +
              '<button type="button" class="btn btn-xs btn-primary" id="uGridAddRowBtn" style="font-weight:700;">+ 새 기록 추가</button>' +
              '<button type="button" class="btn btn-xs btn-ghost" id="uGridExportCleanBtn" style="border:1px solid var(--border);">📥 클린 CSV</button>' +
            '</div>' +
          '</div>' +

          // 검색 & 소스 필터
          '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">' +
            '<input id="uGridSearchInp" type="search" placeholder="검색 (날짜, 항목, 메모, 초성)" value="' + curQuery + '" style="flex:1;min-width:140px;padding:6px 10px;border-radius:8px;border:1px solid var(--border);font-size:.8125rem;background:var(--card2);color:var(--ink);">' +
            '<div style="display:flex;gap:3px;background:var(--card2);padding:2px;border-radius:8px;">' +
              '<button type="button" class="u-grid-src-btn" data-src="all" style="padding:3px 6px;border:none;border-radius:6px;font-size:.7rem;font-weight:700;cursor:pointer;background:' + (curSource === 'all' ? 'var(--card)' : 'transparent') + ';color:var(--ink);">전체</button>' +
              '<button type="button" class="u-grid-src-btn" data-src="manual_in_app" style="padding:3px 6px;border:none;border-radius:6px;font-size:.7rem;font-weight:700;cursor:pointer;background:' + (curSource === 'manual_in_app' ? 'var(--card)' : 'transparent') + ';color:var(--ink);">인앱</button>' +
              '<button type="button" class="u-grid-src-btn" data-src="powerlifting_52w_sample" style="padding:3px 6px;border:none;border-radius:6px;font-size:.7rem;font-weight:700;cursor:pointer;background:' + (curSource === 'powerlifting_52w_sample' ? 'var(--card)' : 'transparent') + ';color:var(--ink);">52주</button>' +
              '<button type="button" class="u-grid-src-btn" data-src="olympic_strength_1920s" style="padding:3px 6px;border:none;border-radius:6px;font-size:.7rem;font-weight:700;cursor:pointer;background:' + (curSource === 'olympic_strength_1920s' ? 'var(--card)' : 'transparent') + ';color:var(--ink);">1924</button>' +
            '</div>' +
          '</div>' +

          // 테이블 영역
          '<div style="flex:1;overflow-y:auto;border:1px solid var(--border);border-radius:8px;background:var(--card);">' +
            '<table style="width:100%;border-collapse:collapse;text-align:left;">' +
              '<thead style="background:var(--card2);position:sticky;top:0;z-index:2;border-bottom:1px solid var(--border);font-size:.75rem;">' +
                '<tr>' +
                  '<th style="padding:8px 4px;text-align:center;width:28px;"><input type="checkbox" id="uGridSelectAll"></th>' +
                  '<th class="u-grid-sort-th" data-col="date" style="padding:8px 6px;cursor:pointer;">일시' + sortIcon('date') + '</th>' +
                  '<th class="u-grid-sort-th" data-col="entity" style="padding:8px 6px;cursor:pointer;">항목' + sortIcon('entity') + '</th>' +
                  '<th class="u-grid-sort-th" data-col="primary" style="padding:8px 6px;text-align:right;cursor:pointer;">' + h1 + sortIcon('primary') + '</th>' +
                  '<th class="u-grid-sort-th" data-col="secondary" style="padding:8px 6px;text-align:right;cursor:pointer;">' + h2 + sortIcon('secondary') + '</th>' +
                  '<th style="padding:8px 6px;">메모</th>' +
                  '<th style="padding:8px 4px;text-align:center;width:48px;">액션</th>' +
                '</tr>' +
              '</thead>' +
              '<tbody>' +
                (tableRows || '<tr><td colspan="7" style="padding:20px;text-align:center;color:var(--ink-soft);">데이터가 없습니다</td></tr>') +
              '</tbody>' +
            '</table>' +
          '</div>' +

          // 하단 지연 페이징
          '<div style="display:flex;align-items:center;justify-content:space-between;font-size:.75rem;color:var(--ink-soft);padding:4px 0;">' +
            '<span>표시: ' + Math.min(pagedRows.length, totalRows) + ' / ' + totalRows + '</span>' +
            (pagedRows.length < totalRows ? ('<button type="button" class="btn btn-xs btn-ghost" id="uGridLoadMoreBtn" style="border:1px solid var(--border);font-weight:700;">+ 더보기 (30개)</button>') : '') +
          '</div>' +
        '</div>';

      // 이벤트 바인딩
      var sInp = modalContainer.querySelector('#uGridSearchInp');
      if(sInp){
        sInp.oninput = function(){
          curQuery = sInp.value;
          curPage = 1;
          renderGrid(modalContainer);
          var nextI = modalContainer.querySelector('#uGridSearchInp');
          if(nextI){
            nextI.focus();
            nextI.selectionStart = nextI.selectionEnd = nextI.value.length;
          }
        };
      }

      modalContainer.querySelectorAll('.u-grid-src-btn').forEach(function(btn){
        btn.onclick = function(){
          curSource = btn.dataset.src;
          curPage = 1;
          renderGrid(modalContainer);
        };
      });

      modalContainer.querySelectorAll('.u-grid-sort-th').forEach(function(th){
        th.onclick = function(){
          var col = th.dataset.col;
          if(sortCol === col){
            sortDir = (sortDir === 'desc' ? 'asc' : (sortDir === 'asc' ? 'none' : 'desc'));
          } else {
            sortCol = col;
            sortDir = 'desc';
          }
          renderGrid(modalContainer);
        };
      });

      var allChk = modalContainer.querySelector('#uGridSelectAll');
      if(allChk){
        allChk.onchange = function(){
          var checked = allChk.checked;
          pagedRows.forEach(function(r){
            if(checked) selectedRecIds[r.id] = true;
            else delete selectedRecIds[r.id];
          });
          renderGrid(modalContainer);
        };
      }

      modalContainer.querySelectorAll('.u-grid-row-chk').forEach(function(chk){
        chk.onchange = function(){
          var id = chk.dataset.id;
          if(chk.checked) selectedRecIds[id] = true;
          else delete selectedRecIds[id];
          renderGrid(modalContainer);
        };
      });

      var moreBtn = modalContainer.querySelector('#uGridLoadMoreBtn');
      if(moreBtn){
        moreBtn.onclick = function(){
          curPage++;
          renderGrid(modalContainer);
        };
      }

      var expBtn = modalContainer.querySelector('#uGridExportCleanBtn');
      if(expBtn){
        expBtn.onclick = function(){
          S.exportCleanCsv(allRecs, 'ourgoal_clean_grid_export.csv');
        };
      }

      var bulkDelBtn = modalContainer.querySelector('#uGridBulkDelBtn');
      if(bulkDelBtn){
        bulkDelBtn.onclick = async function(){
          var delIds = Object.keys(selectedRecIds);
          if(!(await S.askConfirm('선택된 ' + delIds.length + '개 기록을 완전히 삭제하시겠습니까?'))) return;
          if(state.profile && state.profile.records){
            state.profile.records = state.profile.records.filter(function(r){ return !selectedRecIds[r.id]; });
            allRecs = state.profile.records;
            selectedRecIds = {};
            if(callbacks.saveProfile) callbacks.saveProfile();
            if(callbacks.onDone) callbacks.onDone();
            renderGrid(modalContainer);
          }
        };
      }

      modalContainer.querySelectorAll('.u-grid-del-btn').forEach(function(btn){
        btn.onclick = async function(){
          var id = btn.dataset.id;
          if(!(await S.askConfirm('해당 기록을 삭제하시겠습니까?'))) return;
          if(state.profile && state.profile.records){
            state.profile.records = state.profile.records.filter(function(r){ return r.id !== id; });
            allRecs = state.profile.records;
            delete selectedRecIds[id];
            if(callbacks.saveProfile) callbacks.saveProfile();
            if(callbacks.onDone) callbacks.onDone();
            renderGrid(modalContainer);
          }
        };
      });

      var addRowBtn = modalContainer.querySelector('#uGridAddRowBtn');
      if(addRowBtn){
        addRowBtn.onclick = function(){
          openRowEditModal({
            isNew: true,
            callbacks: callbacks,
            state: state,
            onSaved: function(){
              allRecs = (state.profile && state.profile.records) || [];
              renderGrid(modalContainer);
            }
          });
        };
      }

      modalContainer.querySelectorAll('.u-grid-edit-btn').forEach(function(btn){
        btn.onclick = function(){
          var id = btn.dataset.id;
          var targetRow = mapped.find(function(r){ return r.id === id; });
          if(targetRow){
            openRowEditModal({
              row: targetRow,
              callbacks: callbacks,
              state: state,
              onSaved: function(){
                allRecs = (state.profile && state.profile.records) || [];
                renderGrid(modalContainer);
              }
            });
          }
        };
      });
    }

    var fullHtml = '<div class="modal-head" style="margin-bottom:12px;"><h3 style="margin:0;font-size:1.125rem;font-weight:800;color:var(--ink);">📋 엔터프라이즈 데이터 관리 그리드</h3></div><div id="uGridModalContainer"></div>';
    openModalFn(fullHtml, function(modalEl){
      var cEl = modalEl ? modalEl.querySelector('#uGridModalContainer') : null;
      if(cEl) renderGrid(cEl);
    });
  }

  /* 단건 레코드 인라인 수정/추가 모달 */
  function openRowEditModal(options){
    options = options || {};
    var row = options.row || {};
    var isNew = !!options.isNew;
    var state = options.state || {};
    var callbacks = options.callbacks || {};
    var openModalFn = callbacks.openModal || window.openModal;
    var closeModalFn = callbacks.closeModal || window.closeModal;
    if(!openModalFn) return;

    var curDate = row.date || new Date().toISOString().slice(0, 10);
    var curEntity = row.entity || '';
    var curPVal = row.primaryVal || '';
    var curPUnit = row.primaryUnit || 'kg';
    var curSVal = row.secondaryVal || '';
    var curSUnit = row.secondaryUnit || 'kg';
    var curMemo = row.memo || '';

    var bodyHtml = 
      '<div style="display:flex;flex-direction:column;gap:8px;padding:4px 0;">' +
        '<div style="font-size:.8125rem;font-weight:700;color:var(--ink);">일시 (1900년대 완벽 지원)</div>' +
        '<input id="uEditRowDate" type="text" value="' + curDate + '" placeholder="YYYY-MM-DD" style="padding:8px;border-radius:8px;border:1px solid var(--border);background:var(--card2);color:var(--ink);font-family:monospace;">' +
        '<div style="font-size:.8125rem;font-weight:700;color:var(--ink);">항목 / 엔티티</div>' +
        '<input id="uEditRowEntity" type="text" value="' + curEntity + '" placeholder="예: 벤치프레스, 독서, 러닝" style="padding:8px;border-radius:8px;border:1px solid var(--border);background:var(--card2);color:var(--ink);">' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">' +
          '<div>' +
            '<div style="font-size:.75rem;font-weight:700;color:var(--ink);margin-bottom:2px;">1차 수치 / 단위</div>' +
            '<div style="display:flex;gap:4px;">' +
              '<input id="uEditRowPVal" type="number" step="any" value="' + curPVal + '" placeholder="수치" style="flex:1;padding:6px;border-radius:6px;border:1px solid var(--border);background:var(--card2);color:var(--ink);">' +
              '<input id="uEditRowPUnit" type="text" value="' + curPUnit + '" placeholder="단위" style="width:50px;padding:6px;border-radius:6px;border:1px solid var(--border);background:var(--card2);color:var(--ink);">' +
            '</div>' +
          '</div>' +
          '<div>' +
            '<div style="font-size:.75rem;font-weight:700;color:var(--ink);margin-bottom:2px;">2차 수치 / 단위</div>' +
            '<div style="display:flex;gap:4px;">' +
              '<input id="uEditRowSVal" type="number" step="any" value="' + curSVal + '" placeholder="수치" style="flex:1;padding:6px;border-radius:6px;border:1px solid var(--border);background:var(--card2);color:var(--ink);">' +
              '<input id="uEditRowSUnit" type="text" value="' + curSUnit + '" placeholder="단위" style="width:50px;padding:6px;border-radius:6px;border:1px solid var(--border);background:var(--card2);color:var(--ink);">' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div style="font-size:.8125rem;font-weight:700;color:var(--ink);">메모 / 상세 내용</div>' +
        '<textarea id="uEditRowMemo" rows="3" style="padding:8px;border-radius:8px;border:1px solid var(--border);background:var(--card2);color:var(--ink);resize:vertical;">' + curMemo + '</textarea>' +
        '<button type="button" class="btn btn-primary" id="uEditRowSaveBtn" style="margin-top:8px;font-weight:700;">' + (isNew ? '기록 생성' : '수정 사항 저장') + '</button>' +
      '</div>';

    var fullHtml = '<div class="modal-head" style="margin-bottom:12px;"><h3 style="margin:0;font-size:1.125rem;font-weight:800;color:var(--ink);">' + (isNew ? '➕ 새 데이터 행 추가' : '✏️ 데이터 행 정밀 수정') + '</h3></div>' + bodyHtml;
    openModalFn(fullHtml, function(modalEl){
      if(!modalEl) return;
      var saveBtn = modalEl.querySelector('#uEditRowSaveBtn');
        if(saveBtn){
          saveBtn.onclick = function(){
            var dateVal = modalEl.querySelector('#uEditRowDate').value.trim();
            var entVal = modalEl.querySelector('#uEditRowEntity').value.trim();
            var pVal = parseFloat(modalEl.querySelector('#uEditRowPVal').value) || 0;
            var pUnit = modalEl.querySelector('#uEditRowPUnit').value.trim();
            var sVal = parseFloat(modalEl.querySelector('#uEditRowSVal').value) || 0;
            var sUnit = modalEl.querySelector('#uEditRowSUnit').value.trim();
            var memoVal = modalEl.querySelector('#uEditRowMemo').value.trim();

            if(!dateVal || !entVal){
              alert('일시와 항목명은 필수입니다.');
              return;
            }

            var recs = (state.profile && state.profile.records) || [];
            if(isNew){
              var newId = 'rec_' + dateVal.replace(/[^0-9]/g, '') + '_' + Math.random().toString(36).slice(2, 7);
              var newRec = {
                id: newId,
                theme: S.inferDomainKey(entVal),
                subTheme: entVal,
                item: entVal,
                text: '[' + entVal + '] ' + (pVal ? (pVal + pUnit + ' ') : '') + memoVal,
                startAt: dateVal + 'T12:00:00.000Z',
                createdAt: dateVal + 'T12:00:00.000Z',
                source: 'manual_in_app',
                metrics: {
                  primary: pVal,
                  primaryUnit: pUnit,
                  secondary: sVal,
                  secondaryUnit: sUnit
                }
              };
              if(pUnit === 'kg' && /스쿼트|벤치|데드/i.test(entVal)) newRec.metrics['1rm'] = pVal;
              if(sUnit === 'kg' && /스쿼트|벤치|데드/i.test(entVal)) newRec.metrics.volume = sVal;
              if(pUnit === '쪽') newRec.metrics.pages = pVal;
              recs.push(newRec);
            } else {
              var target = recs.find(function(r){ return r.id === row.id; });
              if(target){
                target.startAt = dateVal + 'T12:00:00.000Z';
                target.subTheme = entVal;
                target.item = entVal;
                target.text = '[' + entVal + '] ' + (pVal ? (pVal + pUnit + ' ') : '') + memoVal;
                target.metrics = target.metrics || {};
                target.metrics.primary = pVal;
                target.metrics.primaryUnit = pUnit;
                target.metrics.secondary = sVal;
                target.metrics.secondaryUnit = sUnit;
                if(pUnit === 'kg' && /스쿼트|벤치|데드/i.test(entVal)) target.metrics['1rm'] = pVal;
                if(sUnit === 'kg' && /스쿼트|벤치|데드/i.test(entVal)) target.metrics.volume = sVal;
                if(pUnit === '쪽') target.metrics.pages = pVal;
              }
            }

            if(state.profile) state.profile.records = recs;
            if(callbacks.saveProfile) callbacks.saveProfile();
            if(callbacks.toast) callbacks.toast('데이터가 성공적으로 저장되었습니다!');
            closeModalFn();
            if(options.onSaved) options.onSaved();
          };
        }
      });
    }

  K.openUniversalDataGrid = openUniversalDataGrid;
  K.openRowEditModal = openRowEditModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : global);
