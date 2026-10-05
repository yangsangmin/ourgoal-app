/**
 * OurGoal Profile & Top Bar (기관 — 프로필 카드·편집 창·위 막대·알림 센터)
 *
 * 「프로필」 묶음: 아바타 글자·프로필 카드·프로필 편집 창·사진 줄이기, 모든 화면 위 막대(updateTopBar)와 알림 배지·알림 센터 창, 일정 알림 폴러. 일정 알림 폴러 시작 문은 bindScheduleReminderStart 로 감싸 index.html 원래 자리에서 부른다.
 * #TASK-ES-499(인라인 어려움 기관 묶음 이전 4차): index.html 인라인 IIFE 의 구간(이전 전 5379~5386 · 5387~5425 · 5426~5444 · 5445~5742 · 5746~5808 · 5810~5828 · 5832~5843 · 5844~5851 · 5852~5947줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalUiHelpers = global.OurgoalUiHelpers || {};

  /* ---- 이전 전 index.html 5379~5386줄(#TASK-ES-499 생성기 표지) ---- */
  function avatarHtml(size){
    var p = L.state.profile;
    var s = size || 64;
    if(p.avatarUrl){
      return '<div class="profile-avatar" style="width:'+s+'px;height:'+s+'px;"><img src="'+p.avatarUrl+'" alt=""></div>';
    }
    return '<div class="profile-avatar" style="width:'+s+'px;height:'+s+'px;font-size:'+(s*0.42)+'px;">'+L.escapeHtml(p.displayName.slice(0,1))+'</div>';
  }
  /* ---- 이전 전 index.html 5387~5425줄(#TASK-ES-499 생성기 표지) ---- */

  function renderProfileCard(){
    var wrap = document.getElementById('profileCard');
    if(!wrap) return;
    var p = L.state.profile;
    var activeGoals = p.goals.filter(function(g){ return !g.archivedAt; });
    var archived = p.goals.filter(function(g){ return g.archivedAt; });
    var streak = L.computeStreakDays();
    wrap.innerHTML =
      '<div class="profile-card">' +
        '<div class="profile-top">' +
          avatarHtml(72) +
          '<div style="flex:1;min-width:0;">' +
            '<div class="profile-name">'+L.escapeHtml(p.displayName)+
              (streak>=7 ? '<span class="tmpl-badge" title="7일 이상 연속 기록"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c4 0 7-3 7-7 0-3-2-5-3-6-1 2-2 3-3 3 0-3-1-6-4-8 0 4-4 6-4 11 0 4 3 7 7 7z"/></svg></span>' : '')+'</div>' +
            (p.region
              ? '<div class="faint" style="font-size:.8125rem;margin-top:2px;">'+L.escapeHtml(p.region)+
                ' · '+(p.regionPublic ? '공개' : '<span style="color:var(--ink-faint);">비공개</span>')+'</div>'
              : '<div class="faint" style="font-size:.8125rem;margin-top:2px;">지역 미설정 · 근처 사람·오프라인 팀 추천에 쓰여요</div>') +
            '<div class="profile-bio">'+(p.bio ? L.escapeHtml(p.bio) : '<span class="faint">소개를 적으면 피드에서 나를 더 잘 보여줄 수 있어요</span>')+'</div>' +
          '</div>' +
        '</div>' +
        ((p.interests||[]).length ? '<div class="tag-row">' +
          p.interests.map(function(t){ return '<span class="tag on">'+L.escapeHtml(L.topicLabel(t) || t)+'</span>'; }).join('') +
        '</div>' : '<div class="tag-row"><span class="tag">관심 카테고리를 고르면 비슷한 사람·팀을 추천해줘요</span></div>') +
        '<div class="profile-stats">' +
          '<div class="profile-stat"><b>'+activeGoals.length+'</b><span>진행 중 목표</span></div>' +
          '<div class="profile-stat"><b>'+archived.length+'</b><span>보관한 목표</span></div>' +
          '<div class="profile-stat"><b>'+p.records.length+'</b><span>총 기록</span></div>' +
          '<div class="profile-stat"><b>'+streak+'</b><span>연속일</span></div>' +
        '</div>' +
        '<div style="display:flex;gap:8px;margin-top:12px;">' +
          '<button class="btn btn-ghost btn-sm" id="editProfileBtn" type="button" style="flex:1;">프로필 편집</button>' +
          '<button class="btn btn-ghost btn-sm" id="hallOfFameBtn" type="button" style="flex:1;">명예의 전당</button>' +
        '</div>' +
      '</div>';
    document.getElementById('editProfileBtn').addEventListener('click', openProfileEditor);
    document.getElementById('hallOfFameBtn').addEventListener('click', L.openHallOfFame);
  }
  /* ---- 이전 전 index.html 5426~5444줄(#TASK-ES-499 생성기 표지) ---- */

  function resizeImageToDataUrl(file, max, cb){
    var reader = new FileReader();
    reader.onload = function(){
      var img = new Image();
      img.onload = function(){
        var scale = Math.min(1, max / Math.max(img.width, img.height));
        var w = Math.round(img.width * scale), h = Math.round(img.height * scale);
        var canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        cb(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = function(){ cb(null); };
      img.src = reader.result;
    };
    reader.onerror = function(){ cb(null); };
    reader.readAsDataURL(file);
  }
  /* ---- 이전 전 index.html 5445~5742줄(#TASK-ES-499 생성기 표지) ---- */

  function openProfileEditor(existingDraft){
    var p = L.state.profile;
    var draft = existingDraft || {
      name: p.displayName || '',
      bio: p.bio || '',
      avatarUrl: p.avatarUrl || '',
      interests: Array.isArray(p.interests) ? p.interests.slice() : [],
      region: p.region || '',
      regionPublic: typeof p.regionPublic !== 'undefined' ? !!p.regionPublic : true,
      itItems: Array.isArray(p.itItems) ? p.itItems.slice().map(function(item){ return Object.assign({}, item); }) : []
    };
    draft.itItems = draft.itItems || [];

    L.openModal(
      '<h3>프로필 편집</h3>' +
      '<div class="avatar-edit">' +
        '<div id="pvAvatar">'+avatarHtml(64)+'</div>' +
        '<div style="flex:1;">' +
          '<button class="btn btn-ghost btn-sm" id="pvPick" type="button" style="display:inline-flex;align-items:center;gap:4px;font-weight:700;">🎨 아바타 변경 (320종)</button>' +
          '<div class="hint">아워골 320종 아바타 도감에서 내 캐릭터를 선택해요</div>' +
        '</div>' +
      '</div>' +
      '<div class="field"><label>닉네임</label><input id="pvName" type="text" value="'+L.escapeHtml(draft.name)+'" maxlength="20"></div>' +
      '<div class="field"><label>내 소개 (최대 80자)</label><input id="pvBio" type="text" value="'+L.escapeHtml(draft.bio)+'" maxlength="80" placeholder="예: 3개월 뒤 하프마라톤 도전 중 · 매일 기록해요"></div>' +
      '<div class="field"><label>내 동네 (시/도 · 시군구)</label></div>' +
      L.regionPickerHtml('pvRegion', draft.region) +
      '<div class="toggle-row" style="margin-top:10px;">' +
        '<div class="t">프로필에 지역 공개<div class="faint" style="font-size:.8125rem;">공개하면 같은 동네 사람·오프라인 팀 추천에 노출돼요</div></div>' +
        '<div class="switch'+(draft.regionPublic?' on':'')+'" id="pvRegionPublic"></div>' +
      '</div>' +
      '<div class="field" style="margin-top:14px;"><label>관심 카테고리 (최대 8개 선택)</label></div>' +
      '<div id="pvInterests"></div>' +
      '<p class="faint" id="pvCount" style="margin:8px 0 0;font-size:.8125rem;font-weight:600;color:var(--brand);"></p>' +
      '<div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--rule);">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
          '<label style="margin:0;font-weight:700;">내 잇템 등록 (추천 아이템 & 장비)</label>' +
          '<button class="btn btn-ghost btn-sm" id="pvAddItItem" type="button" style="padding:3px 8px;font-size:.8125rem;">+ 잇템 추가</button>' +
        '</div>' +
        '<p class="faint" style="margin:0 0 10px;font-size:.8125rem;">내가 애용하는 운동 장비·꿀템 사진과 구매 링크를 등록해보세요.</p>' +
        '<div id="pvInlineItItemForm" style="display:none;background:var(--card2);border:1px solid var(--rule);border-radius:12px;padding:12px;margin-bottom:12px;">' +
          '<div style="font-size:.875rem;font-weight:700;margin-bottom:8px;color:var(--ink);">새 잇템 정보 입력</div>' +
          '<div class="field"><label style="font-size:.78125rem;">잇템 이름 (필수)</label><input id="itNameInput" type="text" placeholder="예: 나이키 인빈서블 3 러닝화"></div>' +
          '<div class="field"><label style="font-size:.78125rem;">구매/소개 링크 (선택)</label><input id="itBuyUrlInput" type="url" placeholder="https://..."></div>' +
          '<div class="field"><label style="font-size:.78125rem;">추천 한줄평 (선택)</label><input id="itDescInput" type="text" placeholder="예: 쿠션감이 좋아 무릎 부담이 없어요"></div>' +
          '<div class="field" style="display:flex;align-items:center;gap:6px;margin-top:6px;">' +
            '<input type="checkbox" id="itIsAffiliateCheck" style="width:16px;height:16px;cursor:pointer;">' +
            '<label for="itIsAffiliateCheck" style="font-size:.78125rem;cursor:pointer;margin:0;color:var(--brand);font-weight:600;">쿠팡 파트너스 등 수수료를 제공받는 제휴 링크입니다</label>' +
          '</div>' +
          '<div style="margin-top:8px;padding:8px 10px;background:rgba(108,92,231,0.06);border:1px solid rgba(108,92,231,0.2);border-radius:8px;font-size:.75rem;line-height:1.45;color:var(--ink-soft);">' +
            '<span style="color:var(--brand-strong);font-weight:700;">⚠️ 잇템 등록 안내:</span> 제휴 링크인 경우 추천평에 [파트너스 활동의 일환으로 수수료를 제공받을 수 있음] 문구가 자동 반영됩니다.' +
          '</div>' +
          '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px;">' +
            '<button class="btn btn-ghost btn-sm" id="btnCancelInlineItItem" type="button">접기</button>' +
            '<button class="btn btn-primary btn-sm" id="btnConfirmInlineItItem" type="button">잇템 등록 완료</button>' +
          '</div>' +
        '</div>' +
        '<div id="pvItItemsContainer"></div>' +
      '</div>' +
      '<div class="modal-actions"><button class="btn btn-ghost" id="pvCancel" type="button">취소</button><button class="btn btn-primary" id="pvSave" type="button">저장</button></div>',
      function(sheet){
        function syncInputsToDraft(){
          var nameInput = sheet.querySelector('#pvName');
          var bioInput = sheet.querySelector('#pvBio');
          if(nameInput) draft.name = nameInput.value.trim();
          if(bioInput) draft.bio = bioInput.value.trim();
        }

        function paintInterests(){
          var el = sheet.querySelector('#pvInterests');
          if(!el) return;
          el.innerHTML = Object.keys(L.TOPICS).map(function(k){
            var t = L.TOPICS[k];
            return '<div style="margin-bottom:10px;">' +
              '<div class="faint" style="font-size:.8125rem;margin-bottom:4px;">'+t.icon+' '+t.label+'</div>' +
              '<div class="cat-sub-grid">' +
                t.subs.map(function(s){
                  var key = k+'/'+s;
                  var on = draft.interests.indexOf(key)!==-1;
                  return '<button class="cat-sub'+(on?' active':'')+'" data-int="'+L.escapeHtml(key)+'" type="button">'+L.escapeHtml(s)+'</button>';
                }).join('') +
              '</div>' +
            '</div>';
          }).join('');

          function updateInterestCount(){
            var countEl = sheet.querySelector('#pvCount');
            if(countEl) countEl.textContent = draft.interests.length+'개 선택됨 · 최대 8개';
          }

          el.querySelectorAll('[data-int]').forEach(function(b){
            b.addEventListener('click', function(ev){
              if(ev && typeof ev.preventDefault === 'function') ev.preventDefault();
              var key = b.dataset.int;
              var i = draft.interests.indexOf(key);
              if(i===-1){
                if(draft.interests.length>=8){ L.toast('관심 카테고리는 8개까지 고를 수 있어요'); return; }
                draft.interests.push(key);
                b.classList.add('active');
              } else {
                draft.interests.splice(i,1);
                b.classList.remove('active');
              }
              L.triggerHaptic(12);
              updateInterestCount();
            });
          });
          updateInterestCount();
        }
        paintInterests();

        function paintItItems(){
          var box = sheet.querySelector('#pvItItemsContainer');
          if(!box) return;
          if(!draft.itItems.length){
            box.innerHTML = '<p class="faint" style="margin:4px 0 8px;font-size:.8125rem;text-align:center;padding:12px;background:var(--card2);border-radius:10px;">등록된 잇템이 없어요. [+ 잇템 추가]를 눌러 등록해보세요!</p>';
            return;
          }
          box.innerHTML = draft.itItems.map(function(it, idx){
            var isAff = it.isAffiliate || /파트너스|쿠팡|affiliate|제휴/i.test(it.desc || '');
            return '<div class="it-item-card" style="display:flex;flex-direction:column;align-items:stretch;margin-bottom:8px;padding:10px;background:var(--card2);border-radius:10px;border:1px solid var(--rule);">' +
              '<div style="display:flex;align-items:center;gap:10px;">' +
                '<div class="it-item-thumb" style="width:44px;height:44px;border-radius:8px;background:rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:center;font-size:1.2rem;border:1px solid var(--rule);flex-shrink:0;">👟</div>' +
                '<div style="flex:1;min-width:0;">' +
                  '<div style="display:flex;align-items:center;gap:4px;">' +
                    '<div style="font-weight:700;font-size:.875rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+L.escapeHtml(it.name)+'</div>' +
                    (isAff ? '<span class="dday-pill" style="font-size:.6875rem;background:rgba(108,92,231,0.12);color:var(--brand-strong);font-weight:700;padding:1px 5px;flex-shrink:0;">제휴</span>' : '') +
                  '</div>' +
                  (it.buyUrl ? '<a href="'+L.escapeHtml(it.buyUrl)+'" target="_blank" rel="noopener noreferrer nofollow" style="font-size:.8125rem;color:var(--brand);text-decoration:underline;word-break:break-all;display:block;margin-top:2px;">'+L.escapeHtml(it.buyUrl)+' ↗</a>' : '') +
                  (it.desc ? '<div class="faint" style="font-size:.8125rem;margin-top:2px;">'+L.escapeHtml(it.desc)+'</div>' : '') +
                '</div>' +
                '<button class="icon-btn" data-delititem="'+idx+'" type="button" aria-label="잇템 삭제" style="padding:4px 8px;font-size:1.1rem;cursor:pointer;">×</button>' +
              '</div>' +
              '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px;padding-top:6px;border-top:1px dashed var(--rule);font-size:.6875rem;color:var(--ink-faint);">' +
                '<span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">※ 아워골은 상품 판매 당사자가 아닙니다.</span>' +
                '<button class="btn btn-ghost btn-xs btn-report-ititem" data-itname="'+L.escapeHtml(it.name)+'" data-iturl="'+L.escapeHtml(it.buyUrl||'')+'" data-itowner="'+L.escapeHtml(draft.name||'내 잇템')+'" type="button" style="font-size:.6875rem;padding:2px 6px;color:var(--red);border:1px solid rgba(235,87,87,0.3);border-radius:6px;cursor:pointer;flex-shrink:0;margin-left:6px;" onclick="openItemReportModal({itemName:this.dataset.itname, itemUrl:this.dataset.iturl, itemOwner:this.dataset.itowner})">🚨 신고</button>' +
              '</div>' +
            '</div>';
          }).join('');

          box.querySelectorAll('[data-delititem]').forEach(function(b){
            b.addEventListener('click', function(ev){
              if(ev && typeof ev.preventDefault === 'function') ev.preventDefault();
              var idx = parseInt(b.dataset.delititem, 10);
              draft.itItems.splice(idx, 1);
              paintItItems();
              L.triggerHaptic(12);
              L.toast('잇템이 삭제되었습니다.');
            });
          });
        }
        paintItItems();

        // 잇템 추가 토글
        var addBtn = sheet.querySelector('#pvAddItItem');
        var inlineForm = sheet.querySelector('#pvInlineItItemForm');
        if(addBtn && inlineForm){
          addBtn.addEventListener('click', function(ev){
            if(ev && typeof ev.preventDefault === 'function') ev.preventDefault();
            L.triggerHaptic(12);
            var isHidden = (inlineForm.style.display === 'none' || !inlineForm.style.display);
            inlineForm.style.display = isHidden ? 'block' : 'none';
            if(isHidden){
              try { inlineForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch(e){}
              var inp = sheet.querySelector('#itNameInput');
              if(inp) setTimeout(function(){ inp.focus(); }, 150);
            }
          });
        }
        var btnCancelInline = sheet.querySelector('#btnCancelInlineItItem');
        if(btnCancelInline){
          btnCancelInline.addEventListener('click', function(ev){
            if(ev && typeof ev.preventDefault === 'function') ev.preventDefault();
            inlineForm.style.display = 'none';
          });
        }
        var btnConfirmInline = sheet.querySelector('#btnConfirmInlineItItem');
        if(btnConfirmInline){
          btnConfirmInline.addEventListener('click', function(ev){
            if(ev && typeof ev.preventDefault === 'function') ev.preventDefault();
            var nameVal = (sheet.querySelector('#itNameInput').value || '').trim();
            if(!nameVal){
              L.toast('잇템 이름을 입력해주세요.');
              return;
            }
            var buyUrlVal = (sheet.querySelector('#itBuyUrlInput').value || '').trim();
            if(buyUrlVal && !/^https?:\/\//i.test(buyUrlVal)) buyUrlVal = 'https://' + buyUrlVal;
            var descVal = (sheet.querySelector('#itDescInput').value || '').trim();
            var isAffVal = !!sheet.querySelector('#itIsAffiliateCheck').checked;

            draft.itItems.push({
              id: 'it_' + Date.now(),
              name: nameVal,
              buyUrl: buyUrlVal,
              desc: descVal,
              isAffiliate: isAffVal,
              createdAt: new Date().toISOString()
            });

            sheet.querySelector('#itNameInput').value = '';
            sheet.querySelector('#itBuyUrlInput').value = '';
            sheet.querySelector('#itDescInput').value = '';
            sheet.querySelector('#itIsAffiliateCheck').checked = false;
            inlineForm.style.display = 'none';
            paintItItems();
            L.triggerHaptic(15);
            L.toast('"' + nameVal + '" 잇템을 추가했어요 ✨');
          });
        }

        // 지역 및 공개 토글
        var regionRef = { value: draft.region };
        L.wireRegionPicker(sheet, 'pvRegion', regionRef);

        var regionSw = sheet.querySelector('#pvRegionPublic');
        if(regionSw){
          regionSw.addEventListener('click', function(ev){
            if(ev && typeof ev.preventDefault === 'function') ev.preventDefault();
            L.triggerHaptic(12);
            draft.regionPublic = !draft.regionPublic;
            regionSw.className = 'switch' + (draft.regionPublic ? ' on' : '');
            L.toast(draft.regionPublic ? '지역 공개 설정됨' : '지역 비공개 설정됨');
          });
        }

        sheet.querySelector('#pvPick').addEventListener('click', function(){
          syncInputsToDraft();
          if(window.OurgoalAvatar && window.OurgoalAvatar.openAvatarModal){
            var xpTotal = (L.state.profile && L.state.profile.settings && L.state.profile.settings.xp && L.state.profile.settings.xp.total) || 0;
            var pLvl = L.levelProgress(xpTotal);
            window.OurgoalAvatar.openAvatarModal({
              profile: L.state.profile,
              state: L.state,
              saveProfile: L.saveProfile,
              toast: L.toast,
              openModal: L.openModal,
              closeModal: function(){
                openProfileEditor(draft);
              },
              currentLevel: pLvl.level,
              mockGroups: (typeof L.MOCK_GROUPS !== 'undefined' ? L.MOCK_GROUPS : []),
              onAvatarChanged: function(newAvatarKey){
                draft.avatarUrl = newAvatarKey;
                syncInputsToDraft();
                openProfileEditor(draft);
                L.renderLevelBadge();
                updateTopBar();
                L.toast('아바타가 선택되었습니다 ✨');
              }
            });
          } else {
            L.toast('아바타 도감을 불러오는 중입니다...');
          }
        });

        var clearBtn = sheet.querySelector('#pvClear');
        if(clearBtn) clearBtn.addEventListener('click', function(){
          draft.avatarUrl = '';
          sheet.querySelector('#pvAvatar').innerHTML = '<div class="profile-avatar">'+L.escapeHtml((draft.name || '나').slice(0,1))+'</div>';
        });

        sheet.querySelector('#pvCancel').addEventListener('click', L.closeModal);
        sheet.querySelector('#pvSave').addEventListener('click', async function(){
          syncInputsToDraft();
          if(!draft.name){ L.toast('닉네임을 입력해주세요'); return; }
          L.triggerHaptic(20);
          p.displayName = draft.name;
          p.bio = draft.bio;
          p.avatarUrl = draft.avatarUrl;
          p.interests = draft.interests || [];
          p.region = regionRef.value || draft.region || '';
          p.regionPublic = !!draft.regionPublic;
          p.itItems = draft.itItems || [];

          p.settings = p.settings || {};
          p.settings.interests = p.interests;
          p.settings.region = p.region;
          p.settings.regionPublic = p.regionPublic;
          p.settings.itItems = p.itItems;

          var uidVal = p.id || 'guest';
          try {
            localStorage.setItem('ourgoal_profile_backup_' + uidVal, JSON.stringify({
              displayName: p.displayName, bio: p.bio, avatarUrl: p.avatarUrl,
              interests: p.interests, region: p.region, regionPublic: p.regionPublic, itItems: p.itItems
            }));
            localStorage.setItem('ourgoal_guest_profile', JSON.stringify(p));
          } catch(e){}

          await L.saveProfile();
          L.closeModal();
          L.renderAll();
          updateTopBar();
          L.toast('프로필을 저장했어요 ✨');
        });
      }
    );
  }

  /* ---- 이전 전 index.html 5746~5808줄(#TASK-ES-499 생성기 표지) ---- */
  function updateTopBar(){
    try {
      var p = L.state.profile;
      var sancAv = document.getElementById('sanctuaryAvatarBadge');
      if(sancAv && p){
        if(window.OurgoalAvatar && window.OurgoalAvatar.renderAvatarHtml){
          var xpTotal = (p.settings && p.settings.xp && p.settings.xp.total) || 0;
          var pLvl = L.levelProgress(xpTotal);
          sancAv.innerHTML = window.OurgoalAvatar.renderAvatarHtml(pLvl.level, p, { size: 36, compact: true });
        } else {
          var customUrl = (p.settings && p.settings.avatarType === 'custom' && p.settings.customAvatarUrl) || p.avatarUrl;
          if(customUrl){
            sancAv.innerHTML = '<img src="'+customUrl+'" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';
          }
        }
      }
    } catch(e){}
    var p = L.state.profile;
    document.getElementById('topUserName').textContent = p.displayName;
    L.renderProBadge();
    var av = document.getElementById('topAvatar');
    if(av && p){
      if(window.OurgoalAvatar && window.OurgoalAvatar.renderAvatarHtml){
        var xpTotal = (p.settings && p.settings.xp && p.settings.xp.total) || 0;
        var pLvl = L.levelProgress(xpTotal);
        av.innerHTML = window.OurgoalAvatar.renderAvatarHtml(pLvl.level, p, { size: 56, compact: true }); /* [TASK-ES-283 compat: av.innerHTML = window.OurgoalAvatar.renderAvatarHtml(pLvl.level, p, { size: 52, compact: true });] */
        av.style.padding = '0'; av.style.overflow = 'visible'; av.style.background = 'transparent';
      } else {
        var customUrl = (p.settings && p.settings.avatarType === 'custom' && p.settings.customAvatarUrl) || p.avatarUrl;
        if(customUrl){
          av.innerHTML = '<img src="'+customUrl+'" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';
          av.style.padding = '0'; av.style.overflow = 'hidden';
        } else {
          av.textContent = p.displayName.slice(0,1);
        }
      }
    }
    updateTopNotifBadge();

    // 화면 제일 우측 상단 프로필(topUserChip) 클릭 시 아바타 변경 모달 직통 연결 (#TASK-ES-170)
    var chip = document.getElementById('topUserChip');
    if(chip && !chip._avatarBound){
      chip._avatarBound = true;
      chip.style.cursor = 'pointer';
      chip.setAttribute('title', '내 아바타 바꾸기');
      chip.onclick = function(e){
        e.preventDefault();
        if(typeof window.triggerHaptic === 'function') window.triggerHaptic(12);
        var btn = document.getElementById('btnOpenAvatarModal');
        if(btn) btn.click();
        else if(window.OurgoalAvatar && window.OurgoalAvatar.openAvatarModal){
          var xpTotal = (L.state.profile && L.state.profile.settings && L.state.profile.settings.xp && L.state.profile.settings.xp.total) || 0;
          var pLvl = L.levelProgress(xpTotal);
          window.OurgoalAvatar.openAvatarModal({
            profile: L.state.profile, state: L.state, saveProfile: L.saveProfile, toast: L.toast,
            openModal: L.openModal, closeModal: L.closeModal, currentLevel: pLvl.level,
            mockGroups: (typeof L.MOCK_GROUPS !== 'undefined' ? L.MOCK_GROUPS : []),
            onAvatarChanged: function(){ L.renderLevelBadge(); updateTopBar(); if(typeof L.renderHome === 'function') L.renderHome(); }
          });
        }
      };
    }
  }

  /* ---- 이전 전 index.html 5810~5828줄(#TASK-ES-499 생성기 표지) ---- */

  /* [#TASK-ES-168] 상단바 알림 배지 실시간 동기화 */
  function updateTopNotifBadge(){
    var badge = document.getElementById('topNotifBadge');
    if(!badge) return;
    var count = 0;
    if(window.OurgoalNotifyEngine && typeof window.OurgoalNotifyEngine.getUnreadCount === 'function'){
      count = window.OurgoalNotifyEngine.getUnreadCount();
    } else {
      var unreads = (L.state.profile && L.state.profile.settings && L.state.profile.settings.unreadNotifications) || [];
      count = unreads.filter(function(n){ return !n.read; }).length;
    }
    if(count > 0){
      badge.textContent = count > 99 ? '99+' : count;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }

  /* ---- 이전 전 index.html 5832~5843줄(#TASK-ES-499 생성기 표지) ---- */

  /* [#TASK-ES-316], [65] 일정 사전 알림 스마트 체커 루프 (1분 주기 및 앱 진입 시) */
  function startScheduleReminderPoller(){
    if(window._schedReminderPoller) return;
    function runCheck(){
      if(window.OurgoalNotifyEngine && typeof window.OurgoalNotifyEngine.checkScheduleReminders === 'function'){
        try { window.OurgoalNotifyEngine.checkScheduleReminders(); } catch(e){}
      }
    }
    setTimeout(runCheck, 3000);
    window._schedReminderPoller = setInterval(runCheck, 60000);
  }
  /* ---- 이전 전 index.html 5844~5851줄(#TASK-ES-499 생성기 표지) ---- */
  function bindScheduleReminderStart() { /* [#TASK-ES-499] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  if(typeof window !== 'undefined'){
    window.startScheduleReminderPoller = startScheduleReminderPoller;
    if(document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', startScheduleReminderPoller);
    } else {
      startScheduleReminderPoller();
    }
  }
  } /* bindScheduleReminderStart */
  /* ---- 이전 전 index.html 5852~5947줄(#TASK-ES-499 생성기 표지) ---- */

  /* [#TASK-ES-168] 알림 센터 모달 열기 */
  function openNotificationCenterModal(){
    var list = [];
    if(window.OurgoalNotifyEngine && typeof window.OurgoalNotifyEngine.getUnreadNotifications === 'function'){
      list = window.OurgoalNotifyEngine.getUnreadNotifications();
    } else {
      list = (L.state.profile && L.state.profile.settings && L.state.profile.settings.unreadNotifications) || [];
    }

    var sortedList = list.slice().reverse();

    var itemsHtml = '';
    if(sortedList.length === 0){
      itemsHtml = '<div style="text-align:center;padding:36px 16px;color:var(--ink-soft);">' +
        '<div style="font-size:2.2rem;margin-bottom:8px;">🔔</div>' +
        '<div style="font-weight:700;font-size:.9375rem;margin-bottom:4px;color:var(--ink);">도착한 알림이 없습니다</div>' +
        '<div class="faint" style="font-size:.8125rem;">새로운 1:1 DM이나 팀 소식, 응원이 오면 여기에 표시돼요.</div>' +
      '</div>';
    } else {
      itemsHtml = '<div style="display:flex;flex-direction:column;gap:8px;max-height:360px;overflow-y:auto;padding-right:4px;">' +
        sortedList.map(function(item, idx){
          var isUnread = !item.read;
          var borderStyle = isUnread ? 'border:1.5px solid var(--brand);background:var(--surface-2);' : 'border:1px solid var(--rule);background:var(--card);';
          var dot = isUnread ? '<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#ef4444;margin-left:6px;vertical-align:middle;"></span>' : '';
          var timeStr = item.createdAt ? (typeof L.fmtTime === 'function' ? L.fmtTime(item.createdAt) : new Date(item.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})) : '최근';

          return '<div class="notif-center-item" data-notifidx="' + idx + '" data-targettab="' + (item.targetTab || 'home') + '" data-targetdmid="' + (item.targetDmId || '') + '" style="cursor:pointer;padding:12px;border-radius:12px;' + borderStyle + 'display:flex;align-items:flex-start;gap:10px;transition:background 0.15s ease;">' +
            '<div style="font-size:1.4rem;line-height:1;flex-shrink:0;margin-top:2px;">' + (item.type === 'dm' ? '💬' : (item.type === 'team' ? '👥' : (item.type === 'cheer' ? '🔥' : (item.type === 'goal' ? '🎯' : '🔔')))) + '</div>' +
            '<div style="flex:1;min-width:0;">' +
              '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:2px;">' +
                '<b style="font-size:.875rem;color:var(--ink);">' + L.escapeHtml(item.title) + dot + '</b>' +
                '<span class="faint" style="font-size:.6875rem;">' + timeStr + '</span>' +
              '</div>' +
              '<div style="font-size:.8125rem;color:var(--ink-soft);line-height:1.4;word-break:break-word;">' + L.escapeHtml(item.body) + '</div>' +
            '</div>' +
          '</div>';
        }).join('') +
      '</div>';
    }

    var modalHtml = '<div style="padding:4px 0;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid var(--rule);">' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
          '<span style="font-size:1.3rem;">🔔</span>' +
          '<h3 style="margin:0;font-size:1.0625rem;font-weight:700;color:var(--ink);">알림 센터</h3>' +
        '</div>' +
        (sortedList.length > 0 ? '<button type="button" class="btn btn-ghost btn-xs" id="notifCenterMarkAllRead" style="font-size:.75rem;padding:4px 8px;color:var(--brand-strong);font-weight:700;">모두 읽음</button>' : '') +
      '</div>' +
      itemsHtml +
      '<div style="margin-top:14px;padding-top:10px;border-top:1px solid var(--rule);display:flex;gap:8px;">' +
        '<button type="button" class="btn btn-block btn-ghost" id="closeNotifCenterBtn" style="flex:1;padding:8px;font-weight:600;">닫기</button>' +
        '<button type="button" class="btn btn-block btn-outline" id="goToNotifSettingsBtn" style="flex:1;padding:8px;font-weight:600;border-color:var(--rule);color:var(--ink-soft);">알림 설정 ⚙️</button>' +
      '</div>' +
    '</div>';

    L.openModal(modalHtml, function(sheet){
      var closeBtn = sheet.querySelector('#closeNotifCenterBtn');
      if(closeBtn) closeBtn.onclick = L.closeModal;

      var setBtn = sheet.querySelector('#goToNotifSettingsBtn');
      if(setBtn){
        setBtn.onclick = function(){
          L.closeModal();
          L.setTab('settings');
        };
      }

      var markAllBtn = sheet.querySelector('#notifCenterMarkAllRead');
      if(markAllBtn){
        markAllBtn.onclick = function(){
          if(window.OurgoalNotifyEngine && typeof window.OurgoalNotifyEngine.markAllAsRead === 'function'){
            window.OurgoalNotifyEngine.markAllAsRead();
          }
          L.toast('모든 알림을 읽음 처리했습니다 ✨');
          L.closeModal();
        };
      }

      sheet.querySelectorAll('.notif-center-item').forEach(function(el){
        el.onclick = function(){
          var targetTab = el.dataset.targettab || 'home';
          var targetDmId = el.dataset.targetdmid;
          L.closeModal();
          if(targetTab && typeof L.setTab === 'function'){
            L.setTab(targetTab);
          }
          if(targetDmId && window.OurgoalComm){
            L.state.commSubTab = 'dm';
            L.state.dmActiveId = targetDmId;
            if(typeof L.renderCommScreen === 'function') L.renderCommScreen();
          }
        };
      });
    });
  }

  K.avatarHtml = avatarHtml;
  K.renderProfileCard = renderProfileCard;
  K.resizeImageToDataUrl = resizeImageToDataUrl;
  K.openProfileEditor = openProfileEditor;
  K.updateTopBar = updateTopBar;
  K.updateTopNotifBadge = updateTopNotifBadge;
  K.startScheduleReminderPoller = startScheduleReminderPoller;
  K.bindScheduleReminderStart = bindScheduleReminderStart;
  K.openNotificationCenterModal = openNotificationCenterModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
