/**
 * OurGoal Feedback Bot Setup (설정 — 맞춤 피드백 봇 설정 창)
 *
 * 「맞춤 피드백 봇 설정」 묶음 중 설정 창 몫: 프리셋 읽기·저장, 맞춤 프롬프트 만들기, 설정 창 열기·닫기·그리기, 말풍선 글자(fbBotBubbleHtml). 홈·설정 단추의 클릭 등록 줄은 index.html 원래 자리(한 줄씩).
 * #TASK-ES-492(인라인 어려움 기관 묶음 이전 3차): index.html 인라인 IIFE 의 구간(이전 전 7861~7864 · 7865~7871 · 7872~7898 · 7899~7911 · 7912~7923 · 7925~7936 · 7938~7955 · 7956~7961 · 7962~8446 · 8447~8450줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalSettingsKit = global.OurgoalSettingsKit || {};

  /* ---- 이전 전 index.html 7861~7864줄(#TASK-ES-492 생성기 표지) ---- */
  function customFeedbackStatusSuffix(){
    var s = L.state.profile.settings;
    return (s.customFeedbackActive && s.customFeedbackPrompt) ? ' · 사용 중' : '';
  }
  /* ---- 이전 전 index.html 7865~7871줄(#TASK-ES-492 생성기 표지) ---- */
  function refreshCustomFeedbackButtons(){
    var suffix = customFeedbackStatusSuffix();
    var a = document.getElementById('customFeedbackStatus');
    var b = document.getElementById('settingsCustomFeedbackStatus');
    if(a) a.textContent = suffix;
    if(b) b.textContent = suffix;
  }
  /* ---- 이전 전 index.html 7872~7898줄(#TASK-ES-492 생성기 표지) ---- */
  function getSavedFeedbackPresets(){
    if(!L.state.profile) L.state.profile = {};
    if(!L.state.profile.settings) L.state.profile.settings = {};
    var s = L.state.profile.settings;
    if(!Array.isArray(s.savedFeedbackPresets)){
      var uid = L.state.profile.uid || (L.state.user && L.state.user.uid) || 'guest';
      try {
        var raw = localStorage.getItem('ourgoal_saved_fb_presets_' + uid);
        if(raw){
          var parsed = JSON.parse(raw);
          if(Array.isArray(parsed)) s.savedFeedbackPresets = parsed;
        }
      } catch(e){}
      if(!Array.isArray(s.savedFeedbackPresets)) s.savedFeedbackPresets = [];
    }
    // Auto-seed existing customFeedbackPrompt if presets are empty to prevent volatility
    if(s.savedFeedbackPresets.length === 0 && s.customFeedbackPrompt && s.customFeedbackPrompt.trim()){
      s.savedFeedbackPresets.push({
        id: 'fb_preset_' + Date.now(),
        title: '나만의 맞춤 피드백',
        prompt: s.customFeedbackPrompt.trim(),
        createdAt: new Date().toISOString()
      });
      persistFeedbackPresets(s.savedFeedbackPresets);
    }
    return s.savedFeedbackPresets;
  }
  /* ---- 이전 전 index.html 7899~7911줄(#TASK-ES-492 생성기 표지) ---- */
  async function persistFeedbackPresets(presets){
    if(!L.state.profile) L.state.profile = {};
    if(!L.state.profile.settings) L.state.profile.settings = {};
    L.state.profile.settings.savedFeedbackPresets = presets;
    var uid = L.state.profile.uid || (L.state.user && L.state.user.uid) || 'guest';
    try {
      localStorage.setItem('ourgoal_saved_fb_presets_' + uid, JSON.stringify(presets));
    } catch(e){}
    try {
      if(typeof L.saveLocalSettings === 'function') L.saveLocalSettings();
    } catch(e){}
    await L.saveProfile();
  }
  /* ---- 이전 전 index.html 7912~7923줄(#TASK-ES-492 생성기 표지) ---- */

  function openFeedbackSetup(){
    L.state.prevScreenTab = L.state.activeTab || 'home';
    if(!L.state.profile) L.state.profile = {};
    if(!L.state.profile.settings) L.state.profile.settings = {};
    L.screens.forEach(function(s){ s.classList.toggle('active', s.id==='screen-feedbacksetup'); });
    var bnav = document.querySelector('.bottomnav');
    if(bnav) bnav.style.display = 'none';
    window.scrollTo({top:0, behavior:'auto'});
    L.state.fbSetup = { step: 'status', desc:'', draft:'', draftTitle:'', generated:'', editingPresetId: null };
    renderFeedbackSetup();
  }

  /* ---- 이전 전 index.html 7925~7936줄(#TASK-ES-492 생성기 표지) ---- */
  function closeFeedbackSetup(){
    if(L.state.fbSetup && L.state.fbSetup.step && L.state.fbSetup.step !== 'status'){
      L.state.fbSetup.step = 'status';
      L.state.fbSetup.editingPresetId = null;
      renderFeedbackSetup();
      return;
    }
    var bnav = document.querySelector('.bottomnav');
    if(bnav) bnav.style.display = '';
    L.state.fbSetup = null;
    L.setTab(L.state.prevScreenTab || 'home');
  }

  /* ---- 이전 전 index.html 7938~7955줄(#TASK-ES-492 생성기 표지) ---- */
  async function generateCustomFeedbackPrompt(description){
    var controller = new AbortController();
    var timer = setTimeout(function(){ controller.abort(); }, 28000);
    try{
      var res = await fetch('/api/promptgen', {
        method:'POST', headers:{'Content-Type':'application/json'}, signal: controller.signal,
        body: JSON.stringify({ description: description })
      });
      clearTimeout(timer);
      if(!res.ok) throw new Error('bad status');
      var data = await res.json();
      if(!data || !data.prompt) throw new Error('bad shape');
      return data.prompt;
    } catch(e){
      clearTimeout(timer);
      return null;
    }
  }
  /* ---- 이전 전 index.html 7956~7961줄(#TASK-ES-492 생성기 표지) ---- */
  function fbBotBubbleHtml(inner){
    return '<div class="card" style="display:flex;gap:12px;align-items:flex-start;">' +
      '<div style="font-size:1.6rem;flex:0 0 auto;line-height:1;"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v3"/><rect x="4" y="7" width="16" height="12" rx="3"/><circle cx="9" cy="13" r="1.2" fill="currentColor"/><circle cx="15" cy="13" r="1.2" fill="currentColor"/><path d="M2 12h2M20 12h2"/></svg></div>' +
      '<div style="flex:1;min-width:0;">' + inner + '</div>' +
    '</div>';
  }
  /* ---- 이전 전 index.html 7962~8446줄(#TASK-ES-492 생성기 표지) ---- */
  function renderFeedbackSetup(){
    var body = document.getElementById('fbSetupBody');
    var st = L.state.fbSetup;
    if(!body || !st) return;
    var settings = (L.state.profile && L.state.profile.settings) ? L.state.profile.settings : (L.state.profile ? (L.state.profile.settings = {}) : {});
    var presets = getSavedFeedbackPresets();
    var maxPresets = 10;

    // STEP: STATUS (MAIN DASHBOARD: ACTIVE FEEDBACK + STORAGE + CREATE OPTIONS)
    if(st.step === 'status'){
      var hasActivePrompt = !!(settings.customFeedbackPrompt && settings.customFeedbackPrompt.trim());
      var isActiveOn = hasActivePrompt && !!settings.customFeedbackActive;
      
      var isCurrentInPresets = presets.some(function(p){
        return p.prompt && settings.customFeedbackPrompt && p.prompt.trim() === settings.customFeedbackPrompt.trim();
      });

      // 1. ACTIVE FEEDBACK CARD
      var statusBadgeHtml = isActiveOn
        ? '<span style="background:#10b981;color:#fff;font-size:0.75rem;font-weight:700;padding:2px 8px;border-radius:9999px;">● 사용 중 (ON)</span>'
        : (hasActivePrompt
          ? '<span style="background:var(--card2);border:1px solid var(--rule);color:var(--ink-soft);font-size:0.75rem;font-weight:600;padding:2px 8px;border-radius:9999px;">○ 일시 정지 (OFF)</span>'
          : '<span style="background:var(--card2);border:1px solid var(--rule);color:var(--ink-soft);font-size:0.75rem;font-weight:600;padding:2px 8px;border-radius:9999px;">기본 피드백 모드</span>');

      var activeCardHtml =
        '<div class="card" style="margin-bottom:14px;border:1px solid ' + (isActiveOn ? 'var(--brand)' : 'var(--rule)') + ';box-shadow:' + (isActiveOn ? '0 4px 14px rgba(var(--brand-rgb, 79, 70, 229), 0.12)' : 'none') + ';">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px;">' +
            '<div style="display:flex;align-items:center;gap:6px;font-weight:700;font-size:0.95rem;color:var(--ink);">' +
              '<span>🤖</span> <span>현재 사용 중인 피드백</span>' +
            '</div>' +
            '<div style="display:flex;align-items:center;gap:8px;">' +
              statusBadgeHtml +
              '<div class="switch' + (settings.customFeedbackActive ? ' on' : '') + '" id="fbActiveSwitch" title="맞춤 피드백 봇 켜기/끄기"></div>' +
            '</div>' +
          '</div>' +
          (hasActivePrompt
            ? '<div style="background:var(--card2);border:1px solid var(--rule);border-radius:10px;padding:12px;font-size:0.875rem;line-height:1.6;white-space:pre-wrap;color:var(--ink);max-height:160px;overflow-y:auto;">' + L.escapeHtml(settings.customFeedbackPrompt) + '</div>' +
              '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;">' +
                (!isCurrentInPresets && presets.length < maxPresets
                  ? '<button class="btn btn-ghost btn-sm" id="fbStatusSaveToRepoBtn" type="button" style="font-weight:700;color:var(--brand);border:1px solid var(--brand);"><svg class="i" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:3px;vertical-align:-2px;"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>내 저장소에 보관</button>'
                  : '') +
                '<button class="btn btn-ghost btn-sm" id="fbStatusEditBtn" type="button" style="flex:1;min-width:100px;">✏️ 프롬프트 수정</button>' +
                '<button class="btn btn-ghost btn-sm" id="fbStatusResetBtn" type="button" style="color:var(--ink-soft);font-size:0.75rem;">기본 피드백으로 초기화</button>' +
              '</div>'
            : '<div style="background:var(--card2);border:1px dashed var(--rule);border-radius:10px;padding:14px;text-align:center;font-size:0.85rem;color:var(--ink-soft);">' +
                '현재 적용된 맞춤 피드백이 없습니다.<br>아래 보관함에서 피드백을 적용하거나 새 피드백을 만들어보세요.' +
              '</div>'
          ) +
        '</div>';

      // 2. PRESETS STORAGE CARD (MAX 10)
      var presetsListHtml = '';
      if(presets.length === 0){
        presetsListHtml =
          '<div style="background:var(--card2);border:1px dashed var(--rule);border-radius:10px;padding:18px;text-align:center;color:var(--ink-soft);font-size:0.85rem;margin-top:10px;">' +
            '보관된 나만의 피드백이 없습니다.<br>아래에서 첫 번째 피드백을 저장해보세요! (최대 10개)' +
          '</div>';
      } else {
        presetsListHtml = '<div style="display:flex;flex-direction:column;gap:10px;margin-top:10px;">';
        presets.forEach(function(preset, idx){
          var isThisActive = isActiveOn && (settings.customFeedbackPrompt === preset.prompt);
          var dateStr = '';
          if(preset.createdAt){
            try {
              var d = new Date(preset.createdAt);
              dateStr = d.getFullYear() + '.' + String(d.getMonth()+1).padStart(2,'0') + '.' + String(d.getDate()).padStart(2,'0');
            } catch(e){}
          }
          presetsListHtml +=
            '<div class="card" style="padding:12px 14px;margin:0;background:' + (isThisActive ? 'rgba(var(--brand-rgb, 79, 70, 229), 0.04)' : 'var(--card2)') + ';border:1px solid ' + (isThisActive ? 'var(--brand)' : 'var(--rule)') + ';border-radius:12px;">' +
              '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">' +
                '<div style="display:flex;align-items:center;gap:6px;min-width:0;">' +
                  '<span style="font-weight:700;font-size:0.92rem;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + L.escapeHtml(preset.title || ('피드백 #' + (idx + 1))) + '</span>' +
                  (isThisActive ? '<span style="background:var(--brand);color:#fff;font-size:0.68rem;font-weight:700;padding:2px 6px;border-radius:9999px;flex-shrink:0;">적용 중</span>' : '') +
                '</div>' +
                (dateStr ? '<span style="font-size:0.7rem;color:var(--ink-soft);flex-shrink:0;">' + dateStr + '</span>' : '') +
              '</div>' +
              '<div style="font-size:0.8rem;line-height:1.5;color:var(--ink-soft);margin:8px 0;background:rgba(0,0,0,0.06);padding:8px 10px;border-radius:8px;white-space:pre-wrap;max-height:72px;overflow-y:auto;">' +
                L.escapeHtml(preset.prompt) +
              '</div>' +
              '<div style="display:flex;align-items:center;justify-content:flex-end;gap:6px;margin-top:8px;">' +
                (isThisActive
                  ? '<button class="btn btn-ghost btn-xs fb-preset-unapply" data-id="' + preset.id + '" type="button" style="font-size:0.75rem;padding:4px 9px;">적용 해제</button>'
                  : '<button class="btn btn-primary btn-xs fb-preset-apply" data-id="' + preset.id + '" type="button" style="font-size:0.75rem;padding:4px 10px;background:var(--brand);color:#fff;font-weight:700;">이 피드백 적용</button>'
                ) +
                '<button class="btn btn-ghost btn-xs fb-preset-edit" data-id="' + preset.id + '" type="button" style="font-size:0.75rem;padding:4px 9px;">수정</button>' +
                '<button class="btn btn-ghost btn-xs fb-preset-delete" data-id="' + preset.id + '" type="button" style="font-size:0.75rem;padding:4px 9px;color:#ef4444;">삭제</button>' +
              '</div>' +
            '</div>';
        });
        presetsListHtml += '</div>';
      }

      var repoCardHtml =
        '<div class="card" style="margin-bottom:14px;border:1px solid var(--rule);">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">' +
            '<div style="display:flex;align-items:center;gap:6px;font-weight:700;font-size:0.95rem;color:var(--ink);">' +
              '<span>📁</span> <span>내 피드백 설정 저장소</span>' +
            '</div>' +
            '<span class="badge" style="font-weight:700;background:var(--card2);border:1px solid var(--rule);padding:2px 8px;border-radius:9999px;font-size:0.75rem;color:' + (presets.length >= maxPresets ? '#ef4444' : 'var(--ink)') + ';">' +
              presets.length + ' / ' + maxPresets + '개' +
            '</span>' +
          '</div>' +
          '<p class="faint" style="margin:6px 0 0;font-size:0.78rem;line-height:1.45;">' +
            '자주 쓰는 맞춤 말투를 최대 10개까지 저장하고 원클릭으로 바꿔가며 쓸 수 있어요.' +
          '</p>' +
          presetsListHtml +
        '</div>';

      // 3. CREATE NEW SECTION
      var isFull = (presets.length >= maxPresets);
      var createCardHtml =
        '<div class="card" style="border:1px solid var(--rule);">' +
          '<div style="display:flex;align-items:center;gap:6px;font-weight:700;font-size:0.95rem;color:var(--ink);margin-bottom:8px;">' +
            '<span>✨</span> <span>새 피드백 추가</span>' +
          '</div>' +
          (isFull
            ? '<div style="padding:10px 12px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);border-radius:10px;font-size:0.8rem;color:var(--ink);line-height:1.5;">' +
                '⚠️ <b>저장소 한도 도달 (' + maxPresets + '/' + maxPresets + '개)</b><br>새로운 피드백을 추가하려면 저장소에서 사용하지 않는 피드백을 먼저 삭제해주세요.' +
              '</div>'
            : '<div style="display:flex;gap:8px;margin-top:8px;">' +
                '<button class="btn btn-ghost" id="fbNewManualBtn" type="button" style="flex:1;padding:9px 12px;font-size:0.85rem;font-weight:600;">✍️ 직접 수동 작성</button>' +
                '<button class="btn btn-primary" id="fbNewChatBtn" type="button" style="flex:1;padding:9px 12px;font-size:0.85rem;font-weight:700;background:var(--brand);color:#fff;">🤖 AI 대화로 생성</button>' +
              '</div>'
          ) +
        '</div>';

      body.innerHTML = activeCardHtml + repoCardHtml + createCardHtml;

      // Event handlers for status view
      var switchEl = document.getElementById('fbActiveSwitch');
      if(switchEl){
        switchEl.addEventListener('click', async function(){
          if(!settings.customFeedbackPrompt && !settings.customFeedbackActive){
            if(presets.length > 0){
              settings.customFeedbackPrompt = presets[0].prompt;
              settings.customFeedbackActive = true;
              await L.saveProfile();
              refreshCustomFeedbackButtons();
              L.toast('‘' + (presets[0].title || '맞춤 피드백') + '’ 봇을 켰어요');
              renderFeedbackSetup();
              return;
            } else {
              L.toast('먼저 맞춤 피드백을 작성하거나 생성해주세요');
              return;
            }
          }
          settings.customFeedbackActive = !settings.customFeedbackActive;
          await L.saveProfile();
          refreshCustomFeedbackButtons();
          L.toast(settings.customFeedbackActive ? '맞춤 피드백 봇을 켰어요' : '기본 피드백으로 되돌렸어요 · 지침은 보관되어 있어요');
          renderFeedbackSetup();
        });
      }

      var saveToRepoBtn = document.getElementById('fbStatusSaveToRepoBtn');
      if(saveToRepoBtn){
        saveToRepoBtn.addEventListener('click', function(){
          if(presets.length >= maxPresets){
            L.toast('저장소는 최대 ' + maxPresets + '개까지만 보관할 수 있어요. 기존 피드백을 삭제해주세요.');
            return;
          }
          st.editingPresetId = null;
          st.draftTitle = '나만의 맞춤 피드백';
          st.draft = settings.customFeedbackPrompt || '';
          st.autoApply = true;
          st.step = 'manual';
          renderFeedbackSetup();
        });
      }

      var editBtn = document.getElementById('fbStatusEditBtn');
      if(editBtn){
        editBtn.addEventListener('click', function(){
          var matching = presets.find(function(p){ return p.prompt === settings.customFeedbackPrompt; });
          st.editingPresetId = matching ? matching.id : null;
          st.draftTitle = matching ? matching.title : '나만의 맞춤 피드백';
          st.draft = settings.customFeedbackPrompt || '';
          st.autoApply = true;
          st.step = 'manual';
          renderFeedbackSetup();
        });
      }

      var resetBtn = document.getElementById('fbStatusResetBtn');
      if(resetBtn){
        resetBtn.addEventListener('click', async function(){
          settings.customFeedbackActive = false;
          await L.saveProfile();
          refreshCustomFeedbackButtons();
          L.toast('기본 피드백 모드로 설정되었어요');
          renderFeedbackSetup();
        });
      }

      // Preset list handlers (apply, unapply, edit, delete)
      body.querySelectorAll('.fb-preset-apply').forEach(function(btn){
        btn.addEventListener('click', async function(){
          var pid = btn.getAttribute('data-id');
          var target = presets.find(function(p){ return p.id === pid; });
          if(!target) return;
          settings.customFeedbackPrompt = target.prompt;
          settings.customFeedbackActive = true;
          await L.saveProfile();
          refreshCustomFeedbackButtons();
          L.toast('‘' + (target.title || '선택한 피드백') + '’ 피드백이 적용되었어요 🚀');
          renderFeedbackSetup();
        });
      });

      body.querySelectorAll('.fb-preset-unapply').forEach(function(btn){
        btn.addEventListener('click', async function(){
          settings.customFeedbackActive = false;
          await L.saveProfile();
          refreshCustomFeedbackButtons();
          L.toast('맞춤 피드백 적용을 해제하고 기본 모드로 전환했어요');
          renderFeedbackSetup();
        });
      });

      body.querySelectorAll('.fb-preset-edit').forEach(function(btn){
        btn.addEventListener('click', function(){
          var pid = btn.getAttribute('data-id');
          var target = presets.find(function(p){ return p.id === pid; });
          if(!target) return;
          st.editingPresetId = target.id;
          st.draftTitle = target.title || '';
          st.draft = target.prompt || '';
          st.autoApply = (settings.customFeedbackPrompt === target.prompt && settings.customFeedbackActive);
          st.step = 'manual';
          renderFeedbackSetup();
        });
      });

      body.querySelectorAll('.fb-preset-delete').forEach(function(btn){
        btn.addEventListener('click', async function(){
          var pid = btn.getAttribute('data-id');
          var target = presets.find(function(p){ return p.id === pid; });
          if(!target) return;
          if(!(await OurgoalCapabilities.call('ui.confirm', '‘' + (target.title || '이 피드백') + '’ 설정을 보관함에서 삭제하시겠습니까?'))) return;
          var newPresets = presets.filter(function(p){ return p.id !== pid; });
          if(settings.customFeedbackPrompt === target.prompt){
            settings.customFeedbackActive = false;
            settings.customFeedbackPrompt = '';
          }
          await persistFeedbackPresets(newPresets);
          refreshCustomFeedbackButtons();
          L.toast('피드백이 삭제되었습니다');
          renderFeedbackSetup();
        });
      });

      var newManualBtn = document.getElementById('fbNewManualBtn');
      if(newManualBtn){
        newManualBtn.addEventListener('click', function(){
          if(presets.length >= maxPresets){
            L.toast('저장소는 최대 ' + maxPresets + '개까지만 보관할 수 있어요. 기존 피드백을 삭제해주세요.');
            return;
          }
          st.editingPresetId = null;
          st.draftTitle = '';
          st.draft = '';
          st.autoApply = true;
          st.step = 'manual';
          renderFeedbackSetup();
        });
      }

      var newChatBtn = document.getElementById('fbNewChatBtn');
      if(newChatBtn){
        newChatBtn.addEventListener('click', function(){
          if(presets.length >= maxPresets){
            L.toast('저장소는 최대 ' + maxPresets + '개까지만 보관할 수 있어요. 기존 피드백을 삭제해주세요.');
            return;
          }
          st.desc = '';
          st.generated = '';
          st.step = 'chat';
          renderFeedbackSetup();
        });
      }

      return;
    }

    // STEP: MANUAL (DIRECT WRITE OR EDIT PRESET)
    if(st.step === 'manual'){
      var isEditing = !!st.editingPresetId;
      body.innerHTML =
        '<div style="margin-bottom:12px;display:flex;align-items:center;gap:8px;">' +
          '<button class="btn btn-ghost btn-xs" id="fbManualBackBtn" type="button" style="padding:4px 8px;">‹ 저장소 목록으로</button>' +
          '<span style="font-weight:700;font-size:0.95rem;color:var(--ink);">' + (isEditing ? '✏️ 피드백 설정 수정' : '✍️ 새 피드백 직접 작성') + '</span>' +
        '</div>' +
        '<div class="card">' +
          '<label style="display:block;font-size:0.8rem;font-weight:700;color:var(--ink);margin-bottom:6px;">피드백 이름 (최대 25자)</label>' +
          '<input id="fbPresetTitleInput" maxlength="25" placeholder="예: 엄격한 팩폭 코치, 다정한 러닝메이트" value="' + L.escapeHtml(st.draftTitle || '') + '" style="width:100%;margin-bottom:12px;padding:10px;border-radius:8px;border:1px solid var(--rule);background:var(--card2);color:var(--ink);box-sizing:border-box;">' +
          '<label style="display:block;font-size:0.8rem;font-weight:700;color:var(--ink);margin-bottom:6px;">피드백 지침 (프롬프트)</label>' +
          '<p class="faint" style="margin:0 0 8px;font-size:0.78rem;line-height:1.4;">피드백 봇에게 내릴 지침을 적어주세요. 톤, 말투, 강조할 점, 비판/칭찬 기준 등을 자유롭게 써주시면 돼요.</p>' +
          '<textarea id="fbManualInput" maxlength="2000" placeholder="예: 핑계는 일절 듣지 말고 냉철하게 현실을 자각시켜줘. 단, 비판 뒤에는 오늘 당장 실천할 수 있는 1가지 구체적 행동 방안을 반드시 덧붙여줘." style="width:100%;min-height:200px;padding:10px;border-radius:8px;border:1px solid var(--rule);background:var(--card2);color:var(--ink);box-sizing:border-box;">' + L.escapeHtml(st.draft || '') + '</textarea>' +
          '<p class="faint" id="fbManualCounter" style="text-align:right;margin:4px 2px 0;font-size:.6875rem;">0/2000자</p>' +
          '<label style="display:flex;align-items:center;gap:8px;margin-top:12px;cursor:pointer;font-size:0.85rem;color:var(--ink);">' +
            '<input type="checkbox" id="fbAutoApplyCheck" ' + (st.autoApply !== false ? 'checked' : '') + '> 저장 즉시 활성화하여 사용' +
          '</label>' +
        '</div>' +
        '<div style="display:flex;gap:8px;margin-top:12px;">' +
          '<button class="btn btn-ghost" id="fbManualCancelBtn" type="button" style="flex:1;">취소</button>' +
          '<button class="btn btn-primary" id="fbManualSaveBtn" type="button" style="flex:1;background:var(--brand);color:#fff;font-weight:700;">' + (isEditing ? '수정 완료' : '저장소에 보관') + '</button>' +
        '</div>';

      var titleInput = document.getElementById('fbPresetTitleInput');
      var manualInput = document.getElementById('fbManualInput');
      var mCounter = document.getElementById('fbManualCounter');
      function updateMCounter(){ mCounter.textContent = manualInput.value.length + '/2000자'; }
      updateMCounter();
      manualInput.addEventListener('input', updateMCounter);

      function backToStatus(){
        st.step = 'status';
        st.editingPresetId = null;
        st.draftTitle = '';
        st.draft = '';
        renderFeedbackSetup();
      }
      document.getElementById('fbManualBackBtn').addEventListener('click', backToStatus);
      document.getElementById('fbManualCancelBtn').addEventListener('click', backToStatus);

      document.getElementById('fbManualSaveBtn').addEventListener('click', async function(){
        var promptVal = manualInput.value.trim();
        if(!promptVal){ L.toast('지침 내용을 입력해주세요'); return; }
        var titleVal = (titleInput.value || '').trim() || (isEditing ? '나만의 맞춤 피드백' : ('피드백 #' + (presets.length + 1)));
        var autoApply = document.getElementById('fbAutoApplyCheck').checked;

        if(isEditing){
          var target = presets.find(function(p){ return p.id === st.editingPresetId; });
          if(target){
            var oldPrompt = target.prompt;
            target.title = titleVal;
            target.prompt = promptVal;
            target.updatedAt = new Date().toISOString();
            if(autoApply || (settings.customFeedbackPrompt === oldPrompt && settings.customFeedbackActive)){
              settings.customFeedbackPrompt = promptVal;
              settings.customFeedbackActive = true;
            }
          }
          await persistFeedbackPresets(presets);
          L.toast('피드백 설정이 수정되었어요 ✨');
        } else {
          if(presets.length >= maxPresets){
            L.toast('저장소는 최대 ' + maxPresets + '개까지만 보관할 수 있어요. 기존 피드백을 삭제해주세요.');
            return;
          }
          presets.push({
            id: 'fb_preset_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            title: titleVal,
            prompt: promptVal,
            createdAt: new Date().toISOString()
          });
          if(autoApply){
            settings.customFeedbackPrompt = promptVal;
            settings.customFeedbackActive = true;
          }
          await persistFeedbackPresets(presets);
          L.toast('새 피드백이 저장소에 보관되었어요 🎉');
        }
        refreshCustomFeedbackButtons();
        backToStatus();
      });
      return;
    }

    // STEP: CHAT (PROMPT GENERATOR INTERACTION)
    if(st.step === 'chat'){
      body.innerHTML =
        '<div style="margin-bottom:12px;display:flex;align-items:center;gap:8px;">' +
          '<button class="btn btn-ghost btn-xs" id="fbChatBackBtn" type="button" style="padding:4px 8px;">‹ 저장소 목록으로</button>' +
          '<span style="font-weight:700;font-size:0.95rem;color:var(--ink);">🤖 AI 대화로 피드백 봇 만들기</span>' +
        '</div>' +
        fbBotBubbleHtml(
          '<p style="margin:0;font-size:.9375rem;line-height:1.65;">안녕하세요 아워골 피드백 봇입니다. 어떤 목표를 향해가시는지와 어떤 피드백을 원하는지 알려주시면 원하시는 피드백 봇 프롬프트를 자동으로 설계해드릴게요.<br><br>생성된 피드백은 <b>내 저장소(최대 10개)</b>에 보관되어 언제든 다시 사용할 수 있어요.</p>'
        ) +
        '<textarea id="fbDescInput" maxlength="300" placeholder="예: 여행 유튜브 채널 10만 구독자가 목표예요. 행동에 대한 질책뿐 아니라 보완할 세부 대책도 전문적으로 짚어주는 날카로운 피드백 봇이 필요해요." style="width:100%;min-height:120px;margin-top:14px;padding:10px;border-radius:8px;border:1px solid var(--rule);background:var(--card2);color:var(--ink);box-sizing:border-box;">' + L.escapeHtml(st.desc || '') + '</textarea>' +
        '<p class="faint" id="fbDescCounter" style="text-align:right;margin:4px 2px 0;font-size:.6875rem;"></p>' +
        '<div style="display:flex;gap:8px;margin-top:10px;">' +
          '<button class="btn btn-ghost" id="fbChatCancelBtn" type="button" style="flex:1;">취소</button>' +
          '<button class="btn btn-primary" id="fbGenerateBtn" type="button" style="flex:1;background:var(--brand);color:#fff;font-weight:700;">봇 프롬프트 생성하기</button>' +
        '</div>';

      var descInput = document.getElementById('fbDescInput');
      var counter = document.getElementById('fbDescCounter');
      function updateCounter(){ counter.textContent = descInput.value.length + '/300자'; }
      updateCounter();
      descInput.addEventListener('input', updateCounter);

      function backToStatus(){
        st.step = 'status';
        renderFeedbackSetup();
      }
      document.getElementById('fbChatBackBtn').addEventListener('click', backToStatus);
      document.getElementById('fbChatCancelBtn').addEventListener('click', backToStatus);

      document.getElementById('fbGenerateBtn').addEventListener('click', async function(){
        var desc = descInput.value.trim();
        if(!desc){ L.toast('먼저 원하시는 내용을 적어주세요'); return; }
        st.desc = desc;
        st.step = 'loading';
        renderFeedbackSetup();
        var generated = await generateCustomFeedbackPrompt(desc);
        if(!generated){
          L.toast('지금은 봇을 만들지 못했어요 · 다시 시도하거나 직접 수동 작성을 이용해주세요');
          st.step = 'chat';
          renderFeedbackSetup();
          return;
        }
        st.generated = generated;
        st.step = 'review';
        renderFeedbackSetup();
      });
      return;
    }

    // STEP: LOADING
    if(st.step === 'loading'){
      body.innerHTML = fbBotBubbleHtml('<p class="faint" style="margin:0;">맞춤 피드백 봇을 만들고 검증하는 중… 🛠️<br>완결된 지침인지 한 번 더 확인하고 있어요, 잠시만요.</p>');
      return;
    }

    // STEP: REVIEW
    if(st.step === 'review'){
      body.innerHTML =
        fbBotBubbleHtml('<p style="margin:0;font-size:.9375rem;line-height:1.65;">사용자 맞춤 프롬프트가 추천되었습니다. 이대로 저장소에 보관할까요?</p>') +
        '<div class="card" style="margin-top:12px;background:var(--surface-2);border:1px solid var(--rule);">' +
          '<label style="display:block;font-size:0.8rem;font-weight:700;color:var(--ink);margin-bottom:6px;">저장할 피드백 이름</label>' +
          '<input id="fbReviewTitleInput" maxlength="25" value="AI 맞춤 피드백" placeholder="예: AI 추천 피드백" style="width:100%;margin-bottom:12px;padding:8px 10px;border-radius:8px;border:1px solid var(--rule);background:var(--card);color:var(--ink);box-sizing:border-box;">' +
          '<label style="display:block;font-size:0.8rem;font-weight:700;color:var(--ink);margin-bottom:6px;">생성된 프롬프트 지침</label>' +
          '<p style="margin:0;font-size:.875rem;line-height:1.7;white-space:pre-wrap;background:var(--card);padding:10px;border-radius:8px;border:1px solid var(--rule);">' + L.escapeHtml(st.generated) + '</p>' +
          '<label style="display:flex;align-items:center;gap:8px;margin-top:12px;cursor:pointer;font-size:0.85rem;color:var(--ink);">' +
            '<input type="checkbox" id="fbReviewAutoApply" checked> 저장 즉시 활성화하여 사용' +
          '</label>' +
        '</div>' +
        '<div style="display:flex;gap:8px;margin-top:14px;">' +
          '<button class="btn btn-ghost" id="fbBackBtn" type="button" style="flex:1;">다시 만들기</button>' +
          '<button class="btn btn-ghost" id="fbEditBtn" type="button" style="flex:1;">직접 수정</button>' +
          '<button class="btn btn-primary" id="fbApproveBtn" type="button" style="flex:1;background:var(--brand);color:#fff;font-weight:700;">저장소에 보관</button>' +
        '</div>';

      document.getElementById('fbBackBtn').addEventListener('click', function(){
        st.step = 'chat';
        renderFeedbackSetup();
      });
      document.getElementById('fbEditBtn').addEventListener('click', function(){
        st.editingPresetId = null;
        st.draftTitle = (document.getElementById('fbReviewTitleInput').value || '').trim() || 'AI 맞춤 피드백';
        st.draft = st.generated;
        st.autoApply = document.getElementById('fbReviewAutoApply').checked;
        st.step = 'manual';
        renderFeedbackSetup();
      });
      document.getElementById('fbApproveBtn').addEventListener('click', async function(){
        if(presets.length >= maxPresets){
          L.toast('저장소는 최대 ' + maxPresets + '개까지만 보관할 수 있어요. 기존 피드백을 삭제해주세요.');
          return;
        }
        var titleVal = (document.getElementById('fbReviewTitleInput').value || '').trim() || 'AI 맞춤 피드백';
        var autoApply = document.getElementById('fbReviewAutoApply').checked;

        presets.push({
          id: 'fb_preset_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          title: titleVal,
          prompt: st.generated,
          createdAt: new Date().toISOString()
        });

        if(autoApply){
          settings.customFeedbackPrompt = st.generated;
          settings.customFeedbackActive = true;
        }
        await persistFeedbackPresets(presets);
        refreshCustomFeedbackButtons();
        L.toast('맞춤 피드백이 저장소에 보관되었어요 🎉');
        st.step = 'status';
        renderFeedbackSetup();
      });
      return;
    }
  }
  /* ---- 이전 전 index.html 8447~8450줄(#TASK-ES-492 생성기 표지) ---- */
  function openFeedbackSetupGated(){
    if(L.isModalDismissCooldown()) return;
    openFeedbackSetup();
  }

  K.customFeedbackStatusSuffix = customFeedbackStatusSuffix;
  K.refreshCustomFeedbackButtons = refreshCustomFeedbackButtons;
  K.getSavedFeedbackPresets = getSavedFeedbackPresets;
  K.persistFeedbackPresets = persistFeedbackPresets;
  K.openFeedbackSetup = openFeedbackSetup;
  K.closeFeedbackSetup = closeFeedbackSetup;
  K.generateCustomFeedbackPrompt = generateCustomFeedbackPrompt;
  K.fbBotBubbleHtml = fbBotBubbleHtml;
  K.renderFeedbackSetup = renderFeedbackSetup;
  K.openFeedbackSetupGated = openFeedbackSetupGated;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
