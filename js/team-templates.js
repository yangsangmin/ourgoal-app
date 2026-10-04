/**
 * OurGoal Community Cell: 추천 템플릿 — 둘러보기 미리보기 모달·동반자 추천 모달·아코디언 렌더·이벤트 (#TASK-ES-387 · 팀 세포 쪼개기 2차)
 *
 * js/team-invite-comm.js(1차 뒤 3,276줄)에서 동작 그대로 옮겼다(이전 전 288~649줄).
 *   openTemplatePreviewModal · openRecommendTemplateModal · renderTemplatesAccordionHtml · wireTemplatesAccordionEvents
 * 바꾼 것은 이름 참조뿐이다 — 원본 스코프 이름은 T.<이름>, 다른 팀 세포 파일의 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 바깥에서는 이전과 같이 window.OurgoalTeamInviteComm.<함수> 로 부른다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // T = js/team-invite-comm.js 의 스코프 통로 — 원본 IIFE 에 남은 공용 함수·상태를 getter(대입하는 상태는 setter 도)로 읽고 쓴다(원본이 로드될 때 채운다). 값은 읽을 때마다 살아 있는 값이다.
  // K = 팀 세포 키트 — 옮긴 함수를 담는다. 원본은 IIFE 맨 위에서 K 의 함수를 같은 이름으로 가져온다(전역 이름을 함수마다 늘리지 않는다).
  var K = global.OurgoalTeamCommKit = global.OurgoalTeamCommKit || {};
  var T = K.scope = K.scope || {};

  /* ------------------------------------------------------------
   * 3. 아워골 추천 템플릿 3종 아코디언 컴팩트화 & 둘러보기/미리보기
   * ------------------------------------------------------------ */
  function openTemplatePreviewModal(tmplId){
    var t = null;
    if(global.OURGOAL_60_TEMPLATES && typeof global.OURGOAL_60_TEMPLATES.getById === 'function'){
      t = global.OURGOAL_60_TEMPLATES.getById(tmplId);
    }
    if(!t){
      var templates = global.CREATOR_TEMPLATES || [];
      t = templates.find(function(x){ return x.id === tmplId; });
    }
    if(!t) return;

    var msListHtml = (t.ms || []).map(function(m, mIdx){
      var tasksHtml = (m.tasks || []).map(function(tk){
        return '<div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:.8125rem;color:var(--ink-soft);">' +
          '<span style="color:var(--brand);font-weight:700;">✓</span>' +
          '<span>' + T.esc(tk) + '</span>' +
        '</div>';
      }).join('');
      return '<div style="margin-bottom:10px;padding:10px 12px;background:var(--surface-2);border-radius:10px;border:1px solid var(--rule);">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
          '<b style="font-size:.875rem;color:var(--ink);">' + T.esc(m.title) + '</b>' +
          '<span class="dday-pill" style="font-size:.6875rem;">' + (mIdx + 1) + '단계</span>' +
        '</div>' +
        tasksHtml +
      '</div>';
    }).join('');

    var expertBannerHtml = t.expertPoint ? (
      '<div style="margin-bottom:12px;padding:10px 12px;background:var(--surface);border-left:3px solid var(--brand);border-radius:6px;font-size:.8125rem;color:var(--ink);">' +
        '<div style="font-weight:700;margin-bottom:2px;color:var(--brand);">💡 전문가 핵심 방법론 & 성공 지표(KPI)</div>' +
        (t.kpi ? '<div style="margin-bottom:4px;font-weight:600;">🎯 ' + T.esc(t.kpi) + '</div>' : '') +
        '<div class="faint" style="font-size:.75rem;line-height:1.5;">' + T.esc(t.expertPoint) + '</div>' +
      '</div>'
    ) : '';

    var isAiModal = !!(t.isAi || (t.id && String(t.id).indexOf('tpl_') === 0));
    var aiNoticeModalHtml = isAiModal ? '<div style="font-size:calc(.875rem - 3pt);color:var(--ink-soft);margin:-6px 0 10px;font-weight:500;">ai생성템플릿입니다</div>' : '';

    var modalHtml = '<h3>' + T.esc(t.title) + ' · 세부 둘러보기</h3>' +
      aiNoticeModalHtml +
      '<p class="faint" style="margin:-6px 0 12px;font-size:.8125rem;">' + T.esc(t.desc) + ' (' + (t.weeks || 12) + '주 완주 코스)</p>' +
      expertBannerHtml +
      '<div style="max-height:50vh;overflow-y:auto;margin-bottom:14px;padding-right:2px;">' +
        '<div style="font-size:.8125rem;font-weight:700;color:var(--ink);margin-bottom:6px;">📋 4단계 마일스톤 및 세부 할 일 목록 (' + (t.ms||[]).length + '개 단계)</div>' +
        msListHtml +
      '</div>' +
      '<div class="modal-actions" style="display:flex;gap:6px;flex-wrap:wrap;">' +
        '<button class="btn btn-ghost" id="tplPreviewCloseBtn" type="button" style="flex:1;">닫기</button>' +
        '<button class="btn btn-ghost" id="tplPreviewShareBtn" type="button" style="border:1px solid var(--rule);color:var(--ink);font-weight:700;flex:1;">🔗 템플릿 공유</button>' +
        '<button class="btn btn-ghost" id="tplPreviewGiftBtn" type="button" style="border:1.5px solid var(--gold);color:var(--gold);font-weight:700;flex:1;background:var(--gold-soft);">🎁 동반자에게 추천</button>' +
        '<button class="btn btn-primary" id="tplPreviewStartTeamBtn" type="button" style="font-weight:700;padding:9px 14px;width:100%;margin-top:4px;background:var(--card2);border:1.5px solid var(--sage);color:var(--sage);">👑 이 템플릿으로 팀 목표 만들기</button>' +
        '<button class="btn btn-primary" id="tplPreviewStartBtn" type="button" style="font-weight:700;padding:10px 18px;width:100%;margin-top:2px;">✨ 이 템플릿으로 내 개인 목표 시작</button>' +
      '</div>';

    if(global.openModal){
      global.openModal(modalHtml, function(sheet){
        var closeBtn = sheet.querySelector('#tplPreviewCloseBtn');
        if(closeBtn) closeBtn.onclick = global.closeModal;
        var shareBtn = sheet.querySelector('#tplPreviewShareBtn');
        if(shareBtn){
          shareBtn.onclick = function(){
            var fn = global.shareContent || (typeof window !== 'undefined' ? window.shareContent : null);
            if(fn){
              fn({
                type: 'template',
                id: t.id,
                title: t.title,
                desc: t.desc + ' (' + (t.weeks || 12) + '주 완주 코스)',
                text: '[아워골 목표 템플릿] \'' + t.title + '\' 4단계 로드맵으로 함께 완주해요! 🎯'
              });
            } else {
              var shareUrl = window.location.href;
              var shareText = '[아워골 목표 템플릿] \'' + t.title + '\' 4단계 로드맵으로 함께 완주해요! 🎯\n' + shareUrl;
              if(navigator.share){
                navigator.share({ title: t.title, text: shareText, url: shareUrl }).catch(function(){});
              } else if(navigator.clipboard && navigator.clipboard.writeText){
                navigator.clipboard.writeText(shareText).then(function(){
                  T.showToast('템플릿 공유 링크가 클립보드에 복사되었어요! 📋');
                }).catch(function(){
                  T.showToast('공유 링크: ' + shareUrl);
                });
              } else {
                T.showToast('템플릿: ' + t.title);
              }
            }
          };
        }

        // 🎁 동반자에게 템플릿 추천/선물 (#TASK-TEMPLATE-COMPANION-GIFT)
        var giftBtn = sheet.querySelector('#tplPreviewGiftBtn');
        if(giftBtn){
          giftBtn.onclick = function(){
            var state = global.state || {};
            var compList = (state.profile && state.profile.settings && state.profile.settings.companions) || T.ensureDefaultCompanions();
            if(!compList || !compList.length){
              T.showToast('등록된 동반자가 없습니다. 소통 탭에서 동반자를 먼저 추가해보세요!');
              return;
            }
            openRecommendTemplateModal(t, compList);
          };
        }

        // 👑 이 템플릿으로 팀 목표 만들기 (#TASK-TEMPLATE-TO-TEAM-GOAL)
        var startTeamBtn = sheet.querySelector('#tplPreviewStartTeamBtn');
        if(startTeamBtn){
          startTeamBtn.onclick = async function(){
            if(global.closeModal) global.closeModal();
            var state = global.state || {};
            var myProfile = state.profile || {};
            var myName = myProfile.displayName || myProfile.name || '팀장';
            var myId = myProfile.id || 'guest';
            var mockGroups = global.MOCK_GROUPS || [];

            var newTeamGoal = {
              id: 'tg_' + Date.now(),
              title: t.title,
              category: t.category || 'study',
              dueDate: (typeof global.daysFromNow === 'function') ? global.daysFromNow((t.weeks || 12) * 7) : null,
              milestones: (t.ms || []).map(function(m, idx){
                return {
                  id: 'tgm_' + Date.now() + '_' + idx,
                  title: m.title,
                  status: 'todo',
                  priority: 'high',
                  tasks: (m.tasks || []).map(function(tk, tkIdx){
                    return { id: 'tgt_' + Date.now() + '_' + idx + '_' + tkIdx, title: tk, done: false };
                  })
                };
              })
            };

            var newGroup = {
              id: 'g_' + Date.now(),
              name: t.title + ' 챌린지 팀',
              icon: t.icon || '🎯',
              category: t.category || 'study',
              members: 1,
              weeklyTarget: 5,
              teamGoals: [newTeamGoal],
              ownerName: myName,
              roster: [{ n: myName, id: myId, c: 0 }]
            };

            mockGroups.unshift(newGroup);
            if(typeof global.groupState === 'function'){
              var gs = global.groupState(newGroup.id);
              gs.joined = true;
              gs.myRole = 'owner';
            }
            if(global.saveProfile) await global.saveProfile();
            T.showToast('"' + newGroup.name + '" 팀 목표가 개설되었어요! 팀원을 초대해보세요 👑');
            state.goalsSubTab = 'team';
            if(typeof global.setTab === 'function') global.setTab('goals');
            if(typeof global.renderGoalsScreen === 'function') global.renderGoalsScreen();
            // 바로 팀원 초대 모달 오픈!
            K.openTeamInviteModal(newGroup.id, mockGroups);
          };
        }

        var startBtn = sheet.querySelector('#tplPreviewStartBtn');
        if(startBtn) startBtn.onclick = function(){
          if(global.closeModal) global.closeModal();
          var fn = T.getAppCloneTemplate();
          if(fn){
            fn(t.id, function(){
              if(global.renderGoalsScreen) global.renderGoalsScreen();
            });
          }
        };
      });
    }
  }

  /* ------------------------------------------------------------
   * 템플릿 동반자 추천/선물 모달 (#TASK-TEMPLATE-COMPANION-GIFT)
   * ------------------------------------------------------------ */
  function openRecommendTemplateModal(t, compList){
    var listHtml = compList.map(function(c){
      var cName = c.nickname || c.name || '동반자';
      var cAvatar = c.avatar || '👤';
      return '<div class="user-row" style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--surface-2);border-radius:10px;border:1px solid var(--rule);margin-bottom:8px;">' +
        '<div style="display:flex;align-items:center;gap:10px;">' +
          '<span style="font-size:1.6rem;">' + cAvatar + '</span>' +
          '<div>' +
            '<div style="font-weight:700;font-size:.9375rem;color:var(--ink);">' + T.esc(cName) + '</div>' +
            '<div class="faint" style="font-size:.75rem;">나의 아워골 동반자</div>' +
          '</div>' +
        '</div>' +
        '<button class="btn btn-primary btn-sm" data-sendrecom="' + T.esc(c.id || cName) + '" data-cname="' + T.esc(cName) + '" type="button" style="font-size:.8125rem;padding:5px 12px;font-weight:700;">추천 선물</button>' +
      '</div>';
    }).join('');

    if(global.openModal){
      global.openModal(
        '<h3>🎁 동반자에게 템플릿 추천/선물하기</h3>' +
        '<p class="faint" style="margin:-6px 0 14px;font-size:.8125rem;">[\'' + T.esc(t.title) + '\'] 템플릿을 함께 도전하고 싶은 동반자에게 선물합니다.</p>' +
        '<div style="max-height:45vh;overflow-y:auto;margin-bottom:14px;">' + listHtml + '</div>' +
        '<div class="modal-actions">' +
          '<button class="btn btn-ghost btn-block" id="closeRecomModalBtn" type="button">닫기</button>' +
        '</div>',
        function(sheet){
          var clBtn = sheet.querySelector('#closeRecomModalBtn');
          if(clBtn) clBtn.onclick = global.closeModal;
          sheet.querySelectorAll('[data-sendrecom]').forEach(function(btn){
            btn.onclick = async function(){
              var compId = btn.dataset.sendrecom;
              var compName = btn.dataset.cname;
              var state = global.state || {};
              var myProfile = state.profile || {};
              var myName = myProfile.displayName || myProfile.name || '나';
              var myId = myProfile.id || 'guest';
              var pingPayload = {
                id: 'ping_recom_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
                group_id: 'dm_' + [myId, compId].sort().join('_'),
                sender_id: myId,
                sender_name: myName,
                receiver_id: compId,
                target_type: 'template_recommend',
                target_id: t.id,
                target_title: t.title,
                ping_type: 'template_gift',
                message: '🎁 [' + myName + '님의 템플릿 추천]\n"' + t.title + '" (' + (t.weeks || 12) + '주 완주 코스) 함께 도전해봐요! 🎯',
                status: 'active',
                created_at: new Date().toISOString()
              };
              if(window.sb){
                try {
                  await window.sb.from('team_pings').insert(pingPayload);
                } catch(e){}
              }
              T.showToast('"' + compName + '"님에게 \'' + t.title + '\' 템플릿을 추천 선물했어요! 🎁');
              if(global.closeModal) global.closeModal();
            };
          });
        }
      );
    }
  }

  function renderTemplatesAccordionHtml(){
    // [#TASK-ES-315, 64] 목표탭 및 소통탭 구형 60선 창 영구 제거 (템플릿백과사전 일원화)
    // 구형 60선 창이 더 이상 목표탭/소통탭에 노출되지 않도록 빈 문자열 반환
    if(!global.__FORCE_LEGACY_TPL_ACCORDION) return '';
    var isExpanded = (global.state && global.state.templatesExpanded === true);
    var curCat = (global.state && global.state.templatesSelectedCategory) || 'all';

    var catTabs = [
      { id: 'all', label: '전체 (60선)' },
      { id: 'health', label: '💪 운동·건강' },
      { id: 'study', label: '📚 학습·자격' },
      { id: 'career', label: '💼 커리어·머니' },
      { id: 'hobby', label: '🎨 취미·창작' },
      { id: 'mind', label: '🧘 마음·습관' },
      { id: 'relation', label: '🏘️ 관계·생활' }
    ];

    var catChipsHtml = '<div class="tmpl-cat-scroll" style="display:flex;gap:6px;overflow-x:auto;padding:2px 0 8px;margin-bottom:8px;-webkit-overflow-scrolling:touch;">' +
      catTabs.map(function(c){
        var on = (c.id === curCat);
        return '<button type="button" class="btn btn-xs ' + (on ? 'btn-primary' : 'btn-ghost') + '" data-tmplcat="' + c.id + '" style="font-size:.75rem;white-space:nowrap;padding:4px 10px;border-radius:14px;' + (on ? 'font-weight:700;' : 'border:1px solid var(--rule);') + '">' +
          c.label +
        '</button>';
      }).join('') +
    '</div>';

    var templates = [];
    if(global.OURGOAL_60_TEMPLATES && typeof global.OURGOAL_60_TEMPLATES.getByCategory === 'function'){
      templates = global.OURGOAL_60_TEMPLATES.getByCategory(curCat);
    } else {
      templates = global.CREATOR_TEMPLATES || [];
    }

    var cardsHtml = templates.map(function(t){
      var totalTasks = (t.ms || []).reduce(function(a, m){ return a + (m.tasks || []).length; }, 0);
      var badgeText = t.badge || (t.categoryMinor ? t.categoryMinor : '전문가');
      var isAi = !!(t.isAi || (t.id && String(t.id).indexOf('tpl_') === 0));
      var aiNoticeHtml = isAi ? '<div style="font-size:calc(.875rem - 3pt);color:var(--ink-soft);margin:2px 0 4px;font-weight:500;">ai생성템플릿입니다</div>' : '';
      return '<div class="tmpl-card" style="margin-bottom:8px;padding:12px;background:var(--card);border:1px solid var(--rule);border-radius:12px;">' +
        '<div class="tmpl-head" style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">' +
          '<span class="tmpl-badge" style="background:var(--brand);color:#fff;font-size:.6875rem;padding:1px 6px;border-radius:4px;font-weight:700;">' + T.esc(badgeText) + '</span>' +
          '<b style="font-size:.875rem;color:var(--ink);">' + T.esc(t.title) + '</b>' +
          '<span class="faint" style="font-size:.75rem;margin-left:auto;white-space:nowrap;">' + (t.weeks || 12) + '주 과정</span>' +
        '</div>' +
        aiNoticeHtml +
        '<div class="tm-desc" style="font-size:.8125rem;color:var(--ink-soft);margin-bottom:6px;line-height:1.4;">' + T.esc(t.desc) + '</div>' +
        '<div class="faint" style="font-size:.75rem;margin-bottom:8px;">4단계 마일스톤 ' + (t.ms||[]).length + '개 · 세부할일 ' + totalTasks + '개' + (t.kpi ? ' · 🎯 ' + T.esc(t.kpi) : '') + '</div>' +
        '<div class="faint" data-tplcount="creator:' + t.id + '" style="font-size:.8125rem;margin-bottom:8px;display:none;"></div>' +
        '<div style="display:flex;gap:6px;margin-top:6px;">' +
          '<button class="btn btn-ghost btn-sm" data-preview-tmpl="' + t.id + '" type="button" style="flex:1;font-size:.8125rem;font-weight:700;padding:6px 0;border-radius:8px;">' +
            '👀 둘러보기' +
          '</button>' +
          '<button class="btn btn-primary btn-sm" data-tmpl="' + t.id + '" type="button" style="flex:1.4;font-size:.8125rem;font-weight:700;padding:6px 0;border-radius:8px;">' +
            '✨ 이 템플릿으로 시작' +
          '</button>' +
        '</div>' +
      '</div>';
    }).join('');

    return '<div class="card" id="ourgoalTemplatesCard" style="margin-bottom:12px;padding:10px 14px;background:var(--surface-2);border:1px solid var(--rule);border-radius:14px;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;" id="toggleTemplatesBtn">' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
          '<span style="font-size:1.15rem;">📋</span>' +
          '<div>' +
            '<b style="font-size:.875rem;color:var(--ink);">아워골 AI 추천 목표 템플릿 테마별 예시 60선</b>' +
            '<div class="faint" style="font-size:.75rem;margin-top:1px;">전 분야 전문가 큐레이션 · 마일스톤과 세부할일이 통째로 복사돼요</div>' +
          '</div>' +
        '</div>' +
        '<button type="button" class="btn btn-ghost btn-xs tpl-toggle-btn" id="tplExploreToggleBtn" data-tplexplore="1" style="font-size:.75rem;padding:3px 8px;border-radius:6px;border:1px solid var(--rule);color:var(--brand-strong);font-weight:700;flex:0 0 auto;cursor:pointer;">' +
          (isExpanded ? '접기 ▲' : '둘러보기 ▼') +
        '</button>' +
      '</div>' +
      (isExpanded ? '<div style="margin-top:10px;">' + catChipsHtml + '<div style="display:flex;flex-direction:column;gap:6px;max-height:60vh;overflow-y:auto;padding-right:2px;">' + cardsHtml + '</div></div>' : '') +
    '</div>';
  }

  function wireTemplatesAccordionEvents(container, onRerender){
    if(!container) return;
    var toggleBtn = container.querySelector('#toggleTemplatesBtn');
    var exploreBtn = container.querySelector('#tplExploreToggleBtn');
    var handleToggle = function(e){
      if(e) e.stopPropagation();
      if(global.state){
        global.state.templatesExpanded = !global.state.templatesExpanded;
      }
      if(typeof onRerender === 'function') onRerender();
    };

    if(toggleBtn) toggleBtn.onclick = handleToggle;
    if(exploreBtn) exploreBtn.onclick = handleToggle;

    container.querySelectorAll('[data-tmplcat]').forEach(function(btn){
      btn.onclick = function(e){
        e.stopPropagation();
        if(global.state){
          global.state.templatesSelectedCategory = btn.dataset.tmplcat;
        }
        if(typeof onRerender === 'function') onRerender();
      };
    });

    container.querySelectorAll('[data-preview-tmpl]').forEach(function(btn){
      btn.onclick = function(e){
        e.stopPropagation();
        openTemplatePreviewModal(btn.dataset.previewTmpl);
      };
    });

    container.querySelectorAll('[data-tmpl]').forEach(function(btn){
      btn.onclick = function(e){
        e.stopPropagation();
        var fn = T.getAppCloneTemplate();
        if(fn){
          fn(btn.dataset.tmpl, function(){
            if(typeof onRerender === 'function') onRerender();
          });
        }
      };
    });
  }

  K.openTemplatePreviewModal = openTemplatePreviewModal;
  K.openRecommendTemplateModal = openRecommendTemplateModal;
  K.renderTemplatesAccordionHtml = renderTemplatesAccordionHtml;
  K.wireTemplatesAccordionEvents = wireTemplatesAccordionEvents;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
