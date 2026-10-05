/**
 * OurGoal Records Pro Template Modals (기록 탭 — 내 전용 템플릿 만들기·표 열 편집 모달)
 *
 * 내 전용 템플릿 만들기 모달(openCreateCustomTemplateModal — 줄글 추천·표 미리보기) · 표 속성(열) 편집 모달(openTemplateColumnEditModal).
 * 묶음 「전문적(내 전용 템플릿) 기록하기 & 일정 연동」(850줄)을 책임 단위로 나눈 화면 쪽이다. 데이터·해석은 js/tabs/records/pro-templates.js.
 * #TASK-ES-467(인라인 어려움 묶음 시범): index.html 인라인 IIFE 의 구간(이전 전 20980~21286 · 21287~21355줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 20980~21286줄(#TASK-ES-467 생성기 표지) ---- */

  /* 💡 내 전용 템플릿 생성 모달 (AI 비서 대화형 줄글 추천 + 실시간 표 미리보기) */
  function openCreateCustomTemplateModal(onSave){
    var curAiRec = L.recommendTemplateFromAI('크로스핏 와드');
    var columns = curAiRec.columns.slice();
    var defaultRows = curAiRec.defaultRows ? curAiRec.defaultRows.map(function(r){ return r.slice(); }) : [];

    function renderMiniTableHtml(cols, rList){
      if(!cols.length) return '<div class="faint" style="padding:10px;text-align:center;">속성을 추가해주세요</div>';
      var ths = cols.map(function(c, idx){
        return '<th style="padding:4px 8px;background:var(--card);border-bottom:1px solid var(--rule);border-right:1px solid var(--rule);font-size:.8125rem;white-space:nowrap;'+(idx===0?'width:36px;text-align:center;':'')+'">'+L.escapeHtml(c)+'</th>';
      }).join('');
      var trs = (rList || []).slice(0, 8).map(function(row, rIdx){
        var tds = cols.map(function(_, cIdx){
          var v = (row[cIdx] !== undefined) ? row[cIdx] : (cIdx===0 ? String(rIdx+1) : '');
          return '<td style="padding:4px 6px;border-bottom:1px solid var(--rule);border-right:1px solid var(--rule);font-size:.8125rem;'+(cIdx===0?'text-align:center;color:var(--ink-faint);':'')+'">'+L.escapeHtml(String(v))+'</td>';
        }).join('');
        return '<tr>' + tds + '</tr>';
      }).join('');
      return '<div style="max-height:160px;overflow:auto;border:1px solid var(--rule);border-radius:8px;background:var(--card2);">' +
        '<table style="width:100%;border-collapse:collapse;font-size:.8125rem;">' +
          '<thead><tr>' + ths + '</tr></thead>' +
          '<tbody>' + (trs || '<tr><td colspan="'+cols.length+'" style="text-align:center;padding:8px;color:var(--ink-faint);">데이터 행이 없습니다</td></tr>') + '</tbody>' +
        '</table>' +
      '</div>';
    }

    function renderModalHtml(){
      var colChips = columns.map(function(c, idx){
        return '<span class="dday-pill" style="background:var(--card);border:1px solid var(--rule);display:inline-flex;align-items:center;gap:4px;padding:4px 8px;font-size:.8125rem;">' +
          '<span>'+L.escapeHtml(c)+'</span>' +
          (idx > 0 ? '<button type="button" data-delcol="'+idx+'" style="border:none;background:none;color:var(--ink-faint);cursor:pointer;padding:0 2px;font-size:.875rem;line-height:1;">×</button>' : '') +
        '</span>';
      }).join('');

      return '<h3>내 전용 템플릿 생성하기</h3>' +
        '<div style="padding:10px 14px;background:var(--surface-2);border-radius:12px;margin-bottom:14px;font-size:.8125rem;color:var(--ink);line-height:1.45;">' +
          '<b>ai비서로 원하는 맞춤 템플릿을 추천받고 세부적으로 수정하세요</b><br>' +
          '<span style="font-size:.8125rem;color:var(--ink-soft);">예시) 하이록스 기록, 공부기록, 헬스 기록, 영업기록 -> 맞춤형으로 생성됩니다. 일자별로 그기록을 저장하고 일정과 연동할 수 있습니다.</span>' +
        '</div>' +
        '<div class="field" style="margin-bottom:10px;">' +
          '<label>기록 주제 또는 템플릿 이름</label>' +
          '<input id="customTplTitle" type="text" placeholder="예: ' + L.escapeHtml(curAiRec.title) + ', 하이록스 8종목, 공인중개사 모의고사" value="">' +
        '</div>' +
        '<div class="field" style="margin-bottom:10px;">' +
          '<label style="display:flex;align-items:center;justify-content:space-between;">' +
            '<span>행/열 속성 줄글 설명 (자연어 맞춤 지시)</span>' +
            '<span class="faint" style="font-size:.8125rem;">원하는 열과 행 구성을 자유롭게 설명하세요</span>' +
          '</label>' +
          '<textarea id="customTplProseInput" rows="3" placeholder="예: 열은 \'운동종목, 무게(lb), 횟수, 타임캡, Rx 여부\'로 해주고, 행은 Fran 기준으로 쓰러스터 21-15-9와 풀업으로 넣어줘" style="width:100%;box-sizing:border-box;font-size:.8125rem;padding:8px 10px;border-radius:8px;border:1px solid var(--rule);background:var(--card);"></textarea>' +
          '<div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:6px;">' +
            '<button type="button" class="quick-prose-chip" data-quickprose="crossfit">크로스핏 Fran WOD</button>' +
            '<button type="button" class="quick-prose-chip" data-quickprose="hyrox">하이록스 8대 종목 풀세트</button>' +
            '<button type="button" class="quick-prose-chip" data-quickprose="exam">공인중개사 오답노트</button>' +
            '<button type="button" class="quick-prose-chip" data-quickprose="health">헬스 3대 분할 루틴</button>' +
            '<button type="button" class="quick-prose-chip" data-quickprose="biz">B2B 세일즈 파이프라인</button>' +
            '<button type="button" class="quick-prose-chip" data-quickprose="stock">주식 매매일지</button>' +
          '</div>' +
        '</div>' +
        '<div style="margin-bottom:12px;">' +
          '<button class="btn btn-primary" id="customTplAiBtn" type="button" style="width:100%;padding:9px 0;font-size:.875rem;">AI 줄글 분석 및 맞춤 양식 생성</button>' +
        '</div>' +
        '<div id="customTplAiNotice" style="padding:8px 12px;background:var(--card2);border-radius:8px;border-left:3px solid var(--violet);margin-bottom:12px;font-size:.8125rem;line-height:1.4;color:var(--ink-soft);">' +
          'AI가 [크로스핏 와드] 특성에 맞춘 8개 열 속성과 6개 Fran WOD 행을 준비했습니다.' +
        '</div>' +
        '<div style="display:flex;gap:8px;margin-bottom:10px;">' +
          '<div class="field" style="flex:0 0 60px;margin-bottom:0;">' +
            '<label>아이콘</label>' +
            '<input id="customTplIcon" type="text" value="' + L.escapeHtml(curAiRec.icon) + '" style="text-align:center;">' +
          '</div>' +
          '<div class="field" style="flex:1;margin-bottom:0;">' +
            '<label style="display:flex;align-items:center;justify-content:space-between;">' +
              '<span>표 속성(열) 목록 (' + columns.length + '개)</span>' +
              '<button class="btn btn-ghost btn-sm" id="customTplAddColBtn" type="button" style="font-size:.8125rem;padding:2px 8px;">+ 속성 추가</button>' +
            '</label>' +
            '<div id="customTplColWrap" style="display:flex;gap:6px;flex-wrap:wrap;padding:8px;background:var(--card2);border-radius:10px;border:1px solid var(--rule);min-height:38px;align-items:center;">' +
              colChips +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div style="margin-bottom:14px;">' +
          '<label style="font-size:.8125rem;font-weight:700;display:block;margin-bottom:4px;">실시간 표 미리보기 (생성될 ' + defaultRows.length + '개 행)</label>' +
          '<div id="customTplTablePreview">' +
            renderMiniTableHtml(columns, defaultRows) +
          '</div>' +
        '</div>' +
        '<div class="modal-actions">' +
          '<button class="btn btn-ghost" id="customTplCancel" type="button">취소</button>' +
          '<button class="btn btn-primary" id="customTplSave" type="button">내 템플릿으로 저장</button>' +
        '</div>';
    }

    L.openModal(renderModalHtml(), function(sheet){
      function updateColWrap(){
        var wrap = sheet.querySelector('#customTplColWrap');
        if(!wrap) return;
        wrap.innerHTML = columns.map(function(c, idx){
          return '<span class="dday-pill" style="background:var(--card);border:1px solid var(--rule);display:inline-flex;align-items:center;gap:4px;padding:4px 8px;font-size:.8125rem;">' +
            '<span>'+L.escapeHtml(c)+'</span>' +
            (idx > 0 ? '<button type="button" data-delcol="'+idx+'" style="border:none;background:none;color:var(--ink-faint);cursor:pointer;padding:0 2px;font-size:.875rem;line-height:1;">×</button>' : '') +
          '</span>';
        }).join('');
        bindDelColBtns();
        updateTablePreview();
      }

      function updateTablePreview(){
        var pWrap = sheet.querySelector('#customTplTablePreview');
        if(pWrap){
          pWrap.innerHTML = renderMiniTableHtml(columns, defaultRows);
        }
      }

      function bindDelColBtns(){
        sheet.querySelectorAll('[data-delcol]').forEach(function(btn){
          btn.onclick = function(e){
            e.stopPropagation();
            var idx = parseInt(btn.dataset.delcol, 10);
            if(idx > 0 && idx < columns.length){
              columns.splice(idx, 1);
              updateColWrap();
            }
          };
        });
      }

      function bindEvents(){
        var aiBtn = sheet.querySelector('#customTplAiBtn');
        var proseInp = sheet.querySelector('#customTplProseInput');
        var titleInp = sheet.querySelector('#customTplTitle');
        var iconInp = sheet.querySelector('#customTplIcon');
        var noticeBox = sheet.querySelector('#customTplAiNotice');

        function applyAiRecResult(res){
          curAiRec = res;
          columns = (res.columns && res.columns.length >= 2) ? res.columns.slice() : ['번호', '항목', '세부내용'];
          defaultRows = (res.defaultRows && res.defaultRows.length) ? res.defaultRows.map(function(r){ return r.slice(); }) : [];
          if(titleInp && res.title) titleInp.value = res.title;
          if(iconInp && res.icon) iconInp.value = res.icon;
          if(noticeBox){
            var badge = res.source === 'gemini' ? '<span style="font-weight:700;color:var(--primary);margin-right:4px;">✨ Gemini AI 맞춤설계:</span> ' : (res.isOfflineFallback ? '<span style="font-weight:600;color:var(--ink-faint);margin-right:4px;font-size:11px;">⚡ 오프라인 상태 또는 아워골 서버 문제로 기본 안내가 생성되었습니다:</span> ' : '');
            noticeBox.innerHTML = badge + L.escapeHtml(res.explanation || 'AI가 요청하신 양식에 맞춰 표 속성과 행을 생성했습니다.');
          }
          updateColWrap();
          L.toast('AI가 [' + (res.title || '맞춤 양식') + '] 템플릿을 생성했어요!');
        }

        if(aiBtn){
          aiBtn.onclick = function(){
            var q = (titleInp.value || '').trim();
            var prose = (proseInp.value || '').trim();
            if(!q && !prose){
              L.toast('주제 또는 줄글 설명을 입력해주세요');
              return;
            }

            if(window.OurgoalModeration){
              var checkText = (q + ' ' + prose).trim();
              var modCheck = window.OurgoalModeration.check(checkText);
              if(modCheck.flagged){
                L.openModal(
                  '<div style="text-align:center;padding:12px 4px;">' +
                    '<div style="font-size:2rem;margin-bottom:8px;">⚠️</div>' +
                    '<h3 style="font-size:1.05rem;font-weight:700;margin:0 0 10px;color:var(--brand-strong);">' + L.escapeHtml(modCheck.message) + '</h3>' +
                    '<p style="font-size:.875rem;color:var(--ink-soft);line-height:1.55;margin:0 0 14px;word-break:keep-all;">' + L.escapeHtml(modCheck.detail) + '<br><br>' + L.escapeHtml(modCheck.support) + '<br><br><span style="color:var(--ink-muted, #71717a);font-size:.8125rem;display:inline-block;padding:6px 10px;background:rgba(0,0,0,0.03);border-radius:8px;">🌿 ' + L.escapeHtml(modCheck.notice || '무공해 플랫폼을 위한 강한 제어체계를 구축했습니다. 양해 부탁드립니다.') + '</span></p>' +
                    '<button class="btn btn-primary btn-block" type="button" onclick="closeModal()">확인</button>' +
                  '</div>',
                  function(){}
                );
                return;
              }
            }

            aiBtn.disabled = true;
            var origBtnText = aiBtn.innerHTML;
            aiBtn.innerHTML = '<span>🧠 Gemini 3.1 Flash Lite가 양식 설계 중...</span>';
            if(noticeBox){
              noticeBox.innerHTML = '<div style="display:flex;align-items:center;gap:6px;"><span class="spinner" style="display:inline-block;width:14px;height:14px;border:2px solid var(--violet);border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;"></span> <span>Gemini AI가 줄글 요구사항과 필수 측정 지표를 정밀 분석하고 있습니다...</span></div>';
            }

            var payload = {
              action: 'custom_record_template',
              query: q,
              prose: prose,
              geminiKey: (typeof L.state !== 'undefined' && L.state.profile && L.state.profile.geminiKey) ? L.state.profile.geminiKey : ''
            };

            fetch('/api/customtemplate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            })
            .then(async function(r){
              var resData = await r.json().catch(function(){ return {}; });
              if(!r.ok){
                var err = new Error(resData.message || ('HTTP ' + r.status));
                err.resData = resData;
                throw err;
              }
              return resData;
            })
            .then(function(data){
              applyAiRecResult(data);
            })
            .catch(function(err){
              if(err && err.resData && err.resData.error === 'CONTENT_FILTER_REJECTED'){
                L.openModal(
                  '<div style="text-align:center;padding:12px 4px;">' +
                    '<div style="font-size:2rem;margin-bottom:8px;">⚠️</div>' +
                    '<h3 style="font-size:1.05rem;font-weight:700;margin:0 0 10px;color:var(--brand-strong);">' + L.escapeHtml(err.resData.message) + '</h3>' +
                    '<p style="font-size:.875rem;color:var(--ink-soft);line-height:1.55;margin:0 0 14px;word-break:keep-all;">' + L.escapeHtml(err.resData.detail) + '<br><br>' + L.escapeHtml(err.resData.support) + '<br><br><span style="color:var(--ink-muted, #71717a);font-size:.8125rem;display:inline-block;padding:6px 10px;background:rgba(0,0,0,0.03);border-radius:8px;">🌿 ' + L.escapeHtml(err.resData.notice || '무공해 플랫폼을 위한 강한 제어체계를 구축했습니다. 양해 부탁드립니다.') + '</span></p>' +
                    '<button class="btn btn-primary btn-block" type="button" onclick="closeModal()">확인</button>' +
                  '</div>',
                  function(){}
                );
                return;
              }
              var fb = L.parseNaturalLanguageTemplateSpec(q, prose, columns, defaultRows);
              fb.isOfflineFallback = true;
              applyAiRecResult(fb);
            })
            .finally(function(){
              aiBtn.disabled = false;
              aiBtn.innerHTML = origBtnText;
            });
          };
        }

        // Quick Prose Chips Click
        sheet.querySelectorAll('.quick-prose-chip').forEach(function(chip){
          chip.onclick = function(){
            var t = chip.dataset.quickprose;
            if(t === 'crossfit'){
              titleInp.value = '크로스핏 Fran WOD';
              proseInp.value = '열은 운동종목, 무게(lb), 횟수, 시간, Rx 여부로 해주고 행은 Fran 기준으로 쓰러스터 21-15-9와 풀업 넣어줘';
            } else if(t === 'hyrox'){
              titleInp.value = '하이록스 8종목 풀세트';
              proseInp.value = '하이록스 8개 공식 스테이션과 러닝을 모두 포함해서 9개 행으로 완성해줘';
            } else if(t === 'exam'){
              titleInp.value = '공인중개사 모의고사 오답노트';
              proseInp.value = '열은 과목, 문제번호, 정답여부, 오답원인, 복습예정으로 해주고 민법 모의고사 3문항 예시로 넣어줘';
            } else if(t === 'health'){
              titleInp.value = '헬스 3대 분할 루틴';
              proseInp.value = '열은 운동종목, 세트, 횟수, 무게(kg), 휴식시간으로 해주고 벤치프레스, 스쿼트, 데드리프트 넣어줘';
            } else if(t === 'biz'){
              titleInp.value = 'B2B 세일즈 파이프라인';
              proseInp.value = '열은 고객사명, 제안금액, 계약가능성, 미팅형태, 다음액션으로 해주고 2개 고객사 예시 넣어줘';
            } else if(t === 'stock'){
              titleInp.value = '주식 매매일지';
              proseInp.value = '열은 종목명, 매수가, 매도가, 수량, 수익률, 매매근거로 해줘';
            }
            if(aiBtn) aiBtn.click();
          };
        });

        var addColBtn = sheet.querySelector('#customTplAddColBtn');
        if(addColBtn){
          addColBtn.onclick = function(){
            var name = prompt('추가할 표 속성(열 이름)을 입력하세요:\r\n(예: 심박수, 소요시간, 다음액션, 칼로리 등)');
            if(name && name.trim()){
              columns.push(name.trim());
              updateColWrap();
            }
          };
        }

        bindDelColBtns();

        sheet.querySelector('#customTplCancel').onclick = L.closeModal;
        sheet.querySelector('#customTplSave').onclick = async function(){
          var title = (titleInp.value || '').trim() || (curAiRec && curAiRec.title) || (titleInp && titleInp.placeholder ? titleInp.placeholder.replace(/^예:\s*/, '').split(',')[0].trim() : '맞춤 템플릿');
          var icon = (iconInp.value || '📋').trim();
          if(!title){ L.toast('템플릿 제목을 입력해주세요'); return; }
          if(!columns.length){ L.toast('최소 1개 이상의 표 속성이 필요합니다'); return; }

          var finalRows = (defaultRows && defaultRows.length) ? defaultRows.map(function(r, idx){
            var newR = [];
            for(var i=0; i<columns.length; i++){
              newR[i] = (r[i] !== undefined) ? r[i] : (i===0 ? String(idx+1) : '');
            }
            return newR;
          }) : [columns.map(function(c, i){ return i===0 ? '1' : ''; })];

          var newTpl = {
            id: 'tpl_cust_' + L.newId(),
            key: 'cust_' + Date.now(),
            icon: icon,
            title: title,
            theme: curAiRec.theme || 'daily',
            desc: title + ' 맞춤 표 속성 기록',
            columns: columns.slice(),
            defaultRows: finalRows
          };

          L.state.profile.settings = L.state.profile.settings || {};
          L.state.profile.settings.proTemplates = L.state.profile.settings.proTemplates || [];
          L.state.profile.settings.proTemplates.push(newTpl);
          await L.saveProfile();
          L.toast('내 전용 템플릿 [' + title + ']을 생성했어요!');
          L.closeModal();
          if(typeof onSave === 'function') onSave(newTpl);
        };
      }

      bindEvents();
    });
  }
  /* ---- 이전 전 index.html 21287~21355줄(#TASK-ES-467 생성기 표지) ---- */

  /* ⚙️ 표 속성(열) 편집 모달 */
  function openTemplateColumnEditModal(curColumns, onUpdate){
    var tempCols = curColumns.slice();
    L.openModal(
      '<h3>표 속성(열) 편집</h3>' +
      '<p class="faint" style="font-size:.8125rem;margin:0 0 12px;">표의 열(속성)을 추가, 변경, 삭제할 수 있습니다.</p>' +
      '<div id="colEditList" style="display:flex;flex-direction:column;gap:8px;max-height:280px;overflow-y:auto;margin-bottom:14px;">' +
        tempCols.map(function(c, idx){
          return '<div style="display:flex;gap:6px;align-items:center;">' +
            '<span class="faint" style="width:24px;font-size:.8125rem;text-align:center;">'+(idx+1)+'</span>' +
            '<input type="text" class="col-edit-input" data-colidx="'+idx+'" value="'+L.escapeHtml(c)+'" style="flex:1;font-size:.875rem;padding:6px 10px;">' +
            (idx > 0 ? '<button type="button" class="icon-btn col-del-btn" data-delidx="'+idx+'" style="color:var(--brand-strong);font-size:1.1rem;padding:4px 6px;">×</button>' : '<span style="width:26px;"></span>') +
          '</div>';
        }).join('') +
      '</div>' +
      '<div style="margin-bottom:14px;">' +
        '<button class="btn btn-ghost btn-sm" id="addColActionBtn" type="button" style="width:100%;font-size:.8125rem;border-style:dashed;">+ 새 속성(열) 추가</button>' +
      '</div>' +
      '<div class="modal-actions">' +
        '<button class="btn btn-ghost btn-sm" id="colEditCancel" type="button">취소</button>' +
        '<button class="btn btn-primary btn-sm" id="colEditConfirm" type="button">표에 적용</button>' +
      '</div>',
      function(sheet){
        var listEl = sheet.querySelector('#colEditList');
        function rebind(){
          sheet.querySelectorAll('.col-del-btn').forEach(function(b){
            b.onclick = function(){
              var dIdx = parseInt(b.dataset.delidx, 10);
              if(dIdx > 0 && dIdx < tempCols.length){
                syncInputs();
                tempCols.splice(dIdx, 1);
                renderList();
              }
            };
          });
        }
        function syncInputs(){
          sheet.querySelectorAll('.col-edit-input').forEach(function(inp){
            var idx = parseInt(inp.dataset.colidx, 10);
            if(tempCols[idx] !== undefined) tempCols[idx] = inp.value.trim() || ('속성' + (idx+1));
          });
        }
        function renderList(){
          listEl.innerHTML = tempCols.map(function(c, idx){
            return '<div style="display:flex;gap:6px;align-items:center;">' +
              '<span class="faint" style="width:24px;font-size:.8125rem;text-align:center;">'+(idx+1)+'</span>' +
              '<input type="text" class="col-edit-input" data-colidx="'+idx+'" value="'+L.escapeHtml(c)+'" style="flex:1;font-size:.875rem;padding:6px 10px;">' +
              (idx > 0 ? '<button type="button" class="icon-btn col-del-btn" data-delidx="'+idx+'" style="color:var(--brand-strong);font-size:1.1rem;padding:4px 6px;">×</button>' : '<span style="width:26px;"></span>') +
            '</div>';
          }).join('');
          rebind();
        }
        rebind();
        sheet.querySelector('#addColActionBtn').onclick = function(){
          syncInputs();
          tempCols.push('새 속성 ' + (tempCols.length + 1));
          renderList();
        };
        sheet.querySelector('#colEditCancel').onclick = L.closeModal;
        sheet.querySelector('#colEditConfirm').onclick = function(){
          syncInputs();
          if(!tempCols.length) tempCols = ['번호', '항목'];
          L.closeModal();
          if(typeof onUpdate === 'function') onUpdate(tempCols);
        };
      }
    );
  }

  K.openCreateCustomTemplateModal = openCreateCustomTemplateModal;
  K.openTemplateColumnEditModal = openTemplateColumnEditModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
