/**
 * OurGoal Template Market (기록 — 템플릿 마켓 창과 템플릿 복제 본체)
 *
 * openTemplateMarketModal — 「아워골 맞춤 템플릿 마켓플레이스」 창: 분류 알약·검색으로 추린 표 템플릿 목록, 미리보기, 복제하기 단추.
 * executeDirectTemplateClone — 고른 템플릿을 내 템플릿(customTemplates)에 복제해 저장한 뒤 창을 닫는 복제 본체(본문은 이전 전 글자 그대로).
 * 지시함 DIR-004 (나)에 따라 내용은 한 글자도 바꾸지 않고 자리만 옮겼다. 동작·문구·금액·조건 변경 0.
 * #TASK-ES-645(돈 근처 함수 2개 글자 그대로 이전 — 템플릿 마켓 창 · 템플릿 복제 본체(지시함 DIR-004 (나): 내용은 한 글자도 바꾸지 않고 자리만)): index.html 인라인 IIFE 의 구간(이전 전 3383~3411 · 3412~3612줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 3383~3411줄(#TASK-ES-645 생성기 표지) ---- */
  function executeDirectTemplateClone(tpl, onSelectTemplate){
    var customTemplates = (L.state.settings && L.state.settings.customTemplates) || [];
    var existing = customTemplates.find(function(t){ return t.title === tpl.title; });
    if(existing){
      L.toast('이미 복제된 템플릿입니다: ' + tpl.title);
      L.closeModal();
      if(typeof onSelectTemplate === 'function') onSelectTemplate(existing);
      return existing;
    }
    var newTpl = {
      key: 'tpl_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      icon: tpl.icon,
      title: tpl.title,
      columns: tpl.columns.slice(),
      defaultRows: (tpl.defaultRows || []).slice()
    };
    customTemplates.push(newTpl);
    if(!L.state.settings) L.state.settings = {};
    L.state.settings.customTemplates = customTemplates;
    var uidVal = (L.state.profile && L.state.profile.id) || (L.state.user && L.state.user.id) || 'local';
    if(L.state.profile && !L.state.profile.settings) L.state.profile.settings = {};
    if(L.state.profile && L.state.profile.settings) L.state.profile.settings.customTemplates = customTemplates;
    L.saveLocalSettings(uidVal, L.state.settings);
    L.toast('[' + newTpl.title + '] 내 템플릿으로 복제 완료!');
    if(window.OurgoalTemplateCredit) window.OurgoalTemplateCredit.recordCopy(tpl.key || tpl.title, tpl.ownerUserId || null); // KF-2 #TASK-ES-017: 서버 실복제 기록 (복제 뒤 광고 없음)
    L.closeModal();
    if(typeof onSelectTemplate === 'function') onSelectTemplate(newTpl);
    return newTpl;
  }
  /* ---- 이전 전 index.html 3412~3612줄(#TASK-ES-645 생성기 표지) ---- */

  /* 🏪 템플릿 마켓플레이스 모달 */
  function openTemplateMarketModal(onSelectTemplate){
    var curCategory = 'all';
    var searchQuery = '';

    function filterTemplates(){
      return L.CURATED_MARKET_TEMPLATES.filter(function(t){
        var matchCat = curCategory === 'all' || t.category === curCategory;
        if(!matchCat) return false;
        if(!searchQuery) return true;
        var q = searchQuery.toLowerCase();
        return t.title.toLowerCase().includes(q) ||
               t.description.toLowerCase().includes(q) ||
               t.author.toLowerCase().includes(q) ||
               t.columns.join(' ').toLowerCase().includes(q);
      });
    }

    function renderGridHtml(tpls){
      if(!tpls.length){
        return '<div class="empty-state" style="padding:28px 0;"><p>검색 조건에 맞는 템플릿이 없습니다.</p></div>';
      }
      return '<div class="market-grid">' +
        tpls.map(function(t, idx){
          return '<div class="market-card">' +
            '<div>' +
              '<div style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:6px;">' +
                '<span class="pro-tpl-badge" style="font-size:.8125rem;">' + t.icon + ' ' + L.escapeHtml(t.title) + '</span>' +
                '<span class="market-badge" data-tplcount="' + t.key + '" style="background:var(--card2);color:var(--ink-soft);font-size:.6875rem;display:none;"></span>' + /* KF-2 #TASK-ES-017: 복제 수는 서버 실데이터만(js/template-credit.js). 없으면 숨김 */
              '</div>' +
              '<div class="faint" style="font-size:.8125rem;color:var(--ink-soft);margin-bottom:8px;line-height:1.4;">' +
                L.escapeHtml(t.description) +
              '</div>' +
              '<div style="font-size:.7rem;color:var(--ink-faint);margin-bottom:8px;">' +
                '작성자: <b>' + L.escapeHtml(t.author) + '</b>' +
              '</div>' +
              '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:10px;">' +
                t.columns.slice(0, 4).map(function(c){
                  return '<span style="font-size:.6875rem;padding:2px 6px;background:var(--card2);border-radius:6px;border:1px solid var(--rule);">' + L.escapeHtml(c) + '</span>';
                }).join('') +
                (t.columns.length > 4 ? '<span style="font-size:.6875rem;padding:2px 6px;color:var(--ink-faint);">+' + (t.columns.length - 4) + '</span>' : '') +
              '</div>' +
            '</div>' +
            '<div style="display:flex;gap:6px;margin-top:6px;">' +
              '<button class="btn btn-ghost btn-sm mkt-preview-btn" data-mktkey="' + t.key + '" type="button" style="flex:1;font-size:.8125rem;padding:5px 0;">미리보기</button>' +
              '<button class="btn btn-primary btn-sm mkt-clone-btn" data-mktkey="' + t.key + '" type="button" style="flex:1.2;font-size:.8125rem;padding:5px 0;">복제하기</button>' +
            '</div>' +
          '</div>';
        }).join('') +
      '</div>';
    }

    var html = '<h3>아워골 맞춤 템플릿 마켓플레이스</h3>' +
      '<div style="padding:10px 14px;background:var(--surface-2);border-radius:12px;margin-bottom:12px;font-size:.8125rem;color:var(--ink);line-height:1.45;">' +
        '<b>검증된 전문가와 커뮤니티의 노션형 표 템플릿을 원클릭으로 내 앱에 복제하세요.</b><br>' +
        '<span style="font-size:.8125rem;color:var(--ink-soft);">크로스핏, 하이록스, 자격증 수험, 주식 매매일지 등 1초 만에 그대로 복제되어 즉시 기록할 수 있습니다.</span>' +
      '</div>' +
      '<div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:4px;margin-bottom:10px;-webkit-overflow-scrolling:touch;" id="mktCategoryPills">' +
        '<button class="dday-pill active" data-mktcat="all" type="button" style="cursor:pointer;background:var(--chip);color:var(--paper);font-size:.8125rem;">전체</button>' +
        '<button class="dday-pill" data-mktcat="workout" type="button" style="cursor:pointer;border:1px solid var(--rule);background:var(--card);font-size:.8125rem;">운동/피트니스</button>' +
        '<button class="dday-pill" data-mktcat="study" type="button" style="cursor:pointer;border:1px solid var(--rule);background:var(--card);font-size:.8125rem;">공부/수험</button>' +
        '<button class="dday-pill" data-mktcat="business" type="button" style="cursor:pointer;border:1px solid var(--rule);background:var(--card);font-size:.8125rem;">비즈니스/재테크</button>' +
        '<button class="dday-pill" data-mktcat="life" type="button" style="cursor:pointer;border:1px solid var(--rule);background:var(--card);font-size:.8125rem;">라이프/루틴</button>' +
      '</div>' +
      '<div style="display:flex;gap:8px;margin-bottom:10px;">' +
        '<input type="search" id="mktSearchInput" placeholder="템플릿 검색 (예: 크로스핏, 공인중개사, 주식, 식단...)" style="font-size:.875rem;padding:7px 12px;flex:1;border-radius:10px;border:1px solid var(--rule);">' +
        '<button class="btn btn-ghost btn-sm" id="mktShareMyTplBtn" type="button" style="white-space:nowrap;font-size:.8125rem;padding:0 10px;" title="내가 만든 템플릿 코드 공유">내 템플릿 공유</button>' +
      '</div>' +
      '<div id="mktGridContainer">' +
        renderGridHtml(L.CURATED_MARKET_TEMPLATES) +
      '</div>' +
      '<div id="mktDetailPreviewWrap" style="display:none;margin-top:14px;padding:12px;background:var(--card2);border:1px solid var(--rule);border-radius:12px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
          '<b style="font-size:.875rem;" id="mktPreviewTitle">템플릿 미리보기</b>' +
          '<button class="btn btn-ghost btn-sm" id="mktClosePreviewBtn" type="button" style="font-size:.8125rem;">닫기</button>' +
        '</div>' +
        '<div style="display:flex;gap:6px;margin-top:6px;">' +
          '<button class="btn btn-ghost btn-sm" id="mktPreviewShareBtn" type="button" style="flex:1;border:1px solid var(--brand-strong);color:var(--brand-strong);font-weight:700;font-size:.8125rem;padding:7px 0;">🔗 템플릿 공유</button>' +
          '<button class="btn btn-primary btn-sm btn-transplant" id="mktPreviewCloneBtn" type="button" style="flex:1.5;font-size:.8125rem;padding:7px 0;">⚡ 내 목표에 바로 담기 (1초 자동 이식)</button>' +
        '</div>' +
      '</div>' +
      '<div class="modal-actions" style="margin-top:14px;">' +
        '<button class="btn btn-ghost" id="mktModalCloseBtn" type="button">닫기</button>' +
      '</div>';

    L.openModal(html, function(sheet){
      sheet.querySelector('#mktModalCloseBtn').onclick = L.closeModal;

      var gridBox = sheet.querySelector('#mktGridContainer');
      var searchInp = sheet.querySelector('#mktSearchInput');
      var prevWrap = sheet.querySelector('#mktDetailPreviewWrap');
      var prevTitle = sheet.querySelector('#mktPreviewTitle');
      var prevTableBox = sheet.querySelector('#mktPreviewTableBox');
      var prevCloneBtn = sheet.querySelector('#mktPreviewCloneBtn');
      var closePrevBtn = sheet.querySelector('#mktClosePreviewBtn');
      var curPreviewTpl = null;
      if(window.OurgoalTemplateCredit) window.OurgoalTemplateCredit.fillCounts(gridBox);

      function updateGrid(){
        var filtered = filterTemplates();
        gridBox.innerHTML = renderGridHtml(filtered);
        bindGridEvents();
        if(window.OurgoalTemplateCredit) window.OurgoalTemplateCredit.fillCounts(gridBox);
      }

      function cloneTemplate(tpl){
        if(!tpl) return;
        executeDirectTemplateClone(tpl, onSelectTemplate);
      }

      function bindGridEvents(){
        sheet.querySelectorAll('.mkt-clone-btn').forEach(function(btn){
          btn.onclick = function(){
            var key = btn.dataset.mktkey;
            var tpl = L.CURATED_MARKET_TEMPLATES.find(function(t){ return t.key === key; });
            if(tpl) cloneTemplate(tpl);
          };
        });
        sheet.querySelectorAll('.mkt-preview-btn').forEach(function(btn){
          btn.onclick = function(){
            var key = btn.dataset.mktkey;
            var tpl = L.CURATED_MARKET_TEMPLATES.find(function(t){ return t.key === key; });
            if(!tpl) return;
            curPreviewTpl = tpl;
            prevTitle.textContent = tpl.icon + ' ' + tpl.title + ' (기본 ' + (tpl.defaultRows || []).length + '개 행)';
            var tableHtml = '<table class="pro-notion-table" style="font-size:.8125rem;">' +
              '<thead><tr>' + tpl.columns.map(function(c){ return '<th>' + L.escapeHtml(c) + '</th>'; }).join('') + '</tr></thead>' +
              '<tbody>' +
                (tpl.defaultRows || []).map(function(r){
                  return '<tr>' + tpl.columns.map(function(_, ci){ return '<td>' + L.escapeHtml(r[ci] || '-') + '</td>'; }).join('') + '</tr>';
                }).join('') +
              '</tbody></table>';
            prevTableBox.innerHTML = tableHtml;
            prevWrap.style.display = 'block';
            prevWrap.scrollIntoView({ behavior: 'smooth' });
          };
        });
      }

      if(closePrevBtn){
        closePrevBtn.onclick = function(){ prevWrap.style.display = 'none'; curPreviewTpl = null; };
      }
      if(prevCloneBtn){
        prevCloneBtn.onclick = function(){
          if(curPreviewTpl) cloneTemplate(curPreviewTpl);
        };
      }
      var prevShareBtn = sheet.querySelector('#mktPreviewShareBtn'); if(prevShareBtn){ prevShareBtn.onclick = function(){ if(!curPreviewTpl) return; L.shareContent({ type: 'template', id: curPreviewTpl.key || curPreviewTpl.title, title: curPreviewTpl.title, desc: (curPreviewTpl.desc || (curPreviewTpl.title + ' 노션형 맞춤 목표 템플릿')), text: '[아워골 목표 템플릿] \'' + curPreviewTpl.title + '\' 템플릿으로 함께 성장해요! 📋' }); }; }

      // 카테고리 필터 클릭
      sheet.querySelectorAll('#mktCategoryPills button').forEach(function(btn){
        btn.onclick = function(){
          sheet.querySelectorAll('#mktCategoryPills button').forEach(function(b){
            b.classList.remove('active');
            b.style.background = 'var(--card)';
            b.style.color = 'var(--ink)';
            b.style.border = '1px solid var(--rule)';
          });
          btn.classList.add('active');
          btn.style.background = 'var(--chip)';
          btn.style.color = 'var(--paper)';
          btn.style.border = 'none';
          curCategory = btn.dataset.mktcat;
          updateGrid();
        };
      });

      // 실시간 검색
      if(searchInp){
        searchInp.oninput = function(){
          searchQuery = searchInp.value.trim();
          updateGrid();
        };
      }

      // 내 템플릿 마켓 공유 버튼
      var shareBtn = sheet.querySelector('#mktShareMyTplBtn');
      if(shareBtn){
        shareBtn.onclick = function(){
          var myTpls = (L.state.settings && L.state.settings.customTemplates) || [];
          if(!myTpls.length){
            L.toast('공유할 내 맞춤 템플릿이 없습니다. 새 템플릿을 먼저 생성해보세요!');
            return;
          }
          var jsonStr = JSON.stringify(myTpls, null, 2);
          if(navigator.clipboard && navigator.clipboard.writeText){
            navigator.clipboard.writeText(jsonStr).then(function(){
              L.toast('내 맞춤 템플릿 ' + myTpls.length + '개 설정 코드가 클립보드에 복사되었습니다!');
            }).catch(function(){
              window.prompt('아래 템플릿 코드를 복사하여 공유하세요:', jsonStr);
            });
          } else {
            window.prompt('아래 템플릿 코드를 복사하여 공유하세요:', jsonStr);
          }
        };
      }

      bindGridEvents();
    });
  }

  K.executeDirectTemplateClone = executeDirectTemplateClone;
  K.openTemplateMarketModal = openTemplateMarketModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
/* ==== [세포 등록 시작 · gen-cell-provide.js] 이 세포가 키트에 단 이름을 등록 기관(js/core/cell-registry.js)에 스스로 등록한다 — 대조(compare) 전용, 동작 변화 0. 생성기 산출이므로 손으로 고치지 않는다. ==== */
(function (g) {
  var R = g.OurgoalCellRegistry;
  if (!R) return;
  var K = g.OurgoalRecordsKit;
  if (K) R.provide('records/template-market', {
    openTemplateMarketModal: K.openTemplateMarketModal
  }, { window: [] });
})(typeof window !== 'undefined' ? window : globalThis);
/* ==== [세포 등록 끝] ==== */
