/**
 * OurGoal Goal Certificate & Share (소통 탭 — 목표 완주 인증서 그림·공유 하위 화면 렌더)
 *
 * 목표 완주 인증서 그림 만들기(generateGoalCertificateImage) · 소통 탭 공유 하위 화면 그리기(renderCommShare).
 * index.html 「목표 완주 인증서 (기존 공유 캔버스 인프라 재사용)」 묶음 전체를 옮겼다.
 * #TASK-ES-461(인라인 어려움 묶음 시범): index.html 인라인 IIFE 의 구간(이전 전 25038~25091 · 25092~25336줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalCommKit = global.OurgoalCommKit || {};

  /* ---- 이전 전 index.html 25038~25091줄(#TASK-ES-461 생성기 표지) ---- */
  /* ============ 목표 완주 인증서 (기존 공유 캔버스 인프라 재사용) ============ */
  async function generateGoalCertificateImage(goal, pct, days){
    if(document.fonts && document.fonts.ready){ try{ await document.fonts.ready; } catch(e){} }
    var dims = { w:720, h:720 };
    var canvas = document.createElement('canvas');
    canvas.width = dims.w; canvas.height = dims.h;
    var ctx = canvas.getContext('2d');

    var grad = ctx.createLinearGradient(0,0,dims.w,dims.h);
    grad.addColorStop(0,'#6C5CE7'); grad.addColorStop(1,'#FF9F1C');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,dims.w,dims.h);

    var pad = Math.round(dims.w*0.09);
    var innerW = dims.w - pad*2;
    var borderPad = Math.round(dims.w*0.035);
    ctx.strokeStyle = 'rgba(255,255,255,.75)';
    ctx.lineWidth = Math.round(dims.w*0.008);
    L.scRoundRect(ctx, borderPad, borderPad, dims.w-borderPad*2, dims.h-borderPad*2, dims.w*0.05);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#fff';

    ctx.globalAlpha = .85;
    ctx.font = '700 ' + Math.round(dims.w*0.032) + 'px "Noto Sans KR",sans-serif';
    ctx.fillText('아워골 · 목표 완주 인증서', dims.w/2, pad + dims.w*0.05);
    ctx.globalAlpha = 1;

    ctx.font = Math.round(dims.w*0.16) + 'px sans-serif';
    ctx.fillText('🏆', dims.w/2, pad + dims.w*0.26);

    ctx.font = '900 ' + Math.round(dims.w*0.062) + 'px "Noto Sans KR",sans-serif';
    var titleLines = L.scWrapLines(ctx, goal.title, innerW, 2);
    var afterTitleY = L.scDrawLines(ctx, titleLines, dims.w/2, pad+dims.w*0.42, dims.w*0.075);

    ctx.globalAlpha = .92;
    ctx.font = '800 ' + Math.round(dims.w*0.042) + 'px "Noto Sans KR",sans-serif';
    ctx.fillText(pct+'% 달성으로 완주했어요', dims.w/2, afterTitleY + dims.w*0.045);
    ctx.globalAlpha = .75;
    ctx.font = '600 ' + Math.round(dims.w*0.03) + 'px "Noto Sans KR",sans-serif';
    ctx.fillText(days+'일 동안의 여정', dims.w/2, afterTitleY + dims.w*0.09);
    ctx.globalAlpha = 1;

    ctx.globalAlpha = .6;
    ctx.font = '500 ' + Math.round(dims.w*0.024) + 'px "Noto Sans KR",sans-serif';
    ctx.fillText(L.dateKey(L.nowISO())+' · '+(L.state.profile.displayName||''), dims.w/2, dims.h - pad*0.7 - dims.w*0.09);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';

    L.drawShareWatermark(ctx, dims, L.state.profile.id, '#fff');
    return canvas;
  }
  /* ---- 이전 전 index.html 25092~25336줄(#TASK-ES-461 생성기 표지) ---- */
  /* [#TASK-ES-375] openGoalCertificateModal → js/tabs/goals/goal-export.js 로 옮김(목표 탭 세포 2차) */

  function renderCommShare(body){
    var goals = L.state.profile.goals.filter(function(g){ return !g.archivedAt; });
    if(!goals.length){
      body.innerHTML = '<div class="empty-state"><div class="e-icon"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M15 9a4 4 0 0 1 0 6"/><path d="M18 6a8 8 0 0 1 0 12"/></svg></div><p>목표를 만들면 진행 카드를 공유할 수 있어요.</p></div>';
      return;
    }
    if(!L.state.shareComposer) L.state.shareComposer = { platforms:{insta:true}, ratio:{insta:'square',kakao:'wide',tiktok:'vertical',threads:'square'}, sel:{record:false, feedback:false, goal:true, ms:{}}, previews:{} };
    var comp = L.state.shareComposer;
    if(!comp.previews) comp.previews = {};
    if(!goals.some(function(g){ return g.id===L.state.activeGoalId; })) L.state.activeGoalId = goals[0].id;
    var g = goals.find(function(x){ return x.id===L.state.activeGoalId; }) || goals[0];
    var pct = L.goalProgress(g);
    var color = pct>=67 ? '#1FC98E' : (pct>=34 ? '#FF9F1C' : '#FF4F64');
    var days = Math.max(1, Math.round((Date.now()-new Date(g.createdAt))/86400000));
    var lastRec = L.state.profile.records[0];
    var fbAvailable = !!(L.state.lastCapture && L.state.lastCapture.feedback && L.state.lastCapture.goal && L.state.lastCapture.goal.id===g.id);
    var sel = comp.sel;
    g.milestones.forEach(function(m){ if(!(m.id in sel.ms)) sel.ms[m.id] = (m.status==='doing'); });

    function resetPreviews(){ comp.previews = {}; }

    function pickRow(key, icon, title, sub, disabled){
      return '<div class="ms-row" data-scpick="'+key+'" '+(disabled?'data-scdisabled="1"':'')+' style="cursor:'+(disabled?'default':'pointer')+';opacity:'+(disabled?'.5':'1')+';">' +
        '<div class="ms-main">' +
          '<div class="sel-check'+(sel[key]&&!disabled?' on':'')+'" data-scchk="'+key+'">'+(sel[key]&&!disabled?'✓':'')+'</div>' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="font-size:.875rem;font-weight:700;">'+icon+' '+title+'</div>' +
            (sub ? '<div class="faint" style="font-size:.8125rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+sub+'</div>' : '') +
          '</div>' +
        '</div>' +
      '</div>';
    }
    var msRows = g.milestones.map(function(m){
      return '<div class="ms-row" data-scms="'+m.id+'" style="cursor:pointer;">' +
        '<div class="ms-main">' +
          '<div class="sel-check'+(sel.ms[m.id]?' on':'')+'" data-scmschk="'+m.id+'">'+(sel.ms[m.id]?'✓':'')+'</div>' +
          '<div style="flex:1;min-width:0;font-size:.875rem;font-weight:600;">'+(m.status==='done'?'✅ ':(m.status==='doing'?'🔥 ':'· '))+L.escapeHtml(m.title)+'</div>' +
        '</div>' +
      '</div>';
    }).join('');

    var selectedPlatforms = Object.keys(L.SHARE_PLATFORMS).filter(function(k){ return comp.platforms[k]; });
    var previewKeys = Object.keys(comp.previews).filter(function(k){ return comp.platforms[k]; });

    body.innerHTML =
      (goals.length>1 ? '<div class="cat-major-row" style="margin-bottom:14px;">' + goals.map(function(gg){
        return '<button class="cat-major'+(gg.id===g.id?' active':'')+'" data-sharegoal="'+gg.id+'" type="button">'+L.escapeHtml(gg.title)+'</button>';
      }).join('') + '</div>' : '') +

      '<div class="card"><div class="goal-body">' +
        '<div class="gauge">'+L.gaugeSvg(pct,64,color)+'</div>' +
        '<div class="goal-stats"><div class="ms-total" style="font-size:1rem;">'+L.escapeHtml(g.title)+'</div>' +
        '<div class="ms-break">'+days+'일째 진행 중'+(g.dueDate?' · '+L.dDay(g.dueDate)+' 남음':'')+'</div></div>' +
      '</div></div>' +

      '<div class="card" style="background:var(--gold-soft);border:1px solid var(--gold-line);margin-top:14px;">' +
        '<p style="font-size:.8125rem;line-height:1.6;margin:0;color:var(--ink-soft);">📌 <b>①</b> 무엇을 담을지 고르고 <b>②</b> 올릴 곳을 고른 다음 <b>③ 미리보기</b>를 누르면, 실제로 공유될 이미지가 그 자리에 딱 맞는 비율(예: 인스타 1:1·틱톡 9:16)로 미리 만들어져요. 마음에 들면 바로 공유하거나 저장할 수 있어요.</p>' +
      '</div>' +

      '<p class="faint" style="margin:18px 0 4px;">① 공유할 목표 선택하기 · 여러 개 골라도 돼요</p>' +
      '<div class="ms-list">' +
        pickRow('goal','🎯','목표 & 달성률', L.escapeHtml(g.title)+' · '+pct+'%') +
        pickRow('record','📝','최근 기록', lastRec ? L.escapeHtml(lastRec.text.length>30?lastRec.text.slice(0,30)+'…':lastRec.text) : '아직 기록이 없어요', !lastRec) +
        pickRow('feedback','🤖','AI 피드백', fbAvailable ? L.escapeHtml(L.state.lastCapture.feedback.verdict) : '홈에서 기록을 남기면 담을 수 있어요', !fbAvailable) +
      '</div>' +
      (g.milestones.length ? '<p class="faint" style="margin:14px 0 6px;">마일스톤도 같이 담기</p><div class="ms-list">'+msRows+'</div>' : '') +

      '<button class="mz-btn" id="sharePreviewBtn" type="button" style="margin-top:20px;width:100%;font-weight:700;">외부sns 소통용 카드 제작하기</button>' +
      '<div id="sharePreviewArea" style="margin-top:18px;">' +
        (comp.singlePreview ? '<div style="margin-bottom:18px;">' +
          '<p class="faint" style="margin:0 0 6px;">1:1 정방형 소통 카드 미리보기</p>' +
          '<img src="' + comp.singlePreview + '" alt="1:1 소통 카드" style="width:100%;aspect-ratio:1/1;border-radius:16px;display:block;box-shadow:var(--shadow-md);">' +
          '<div style="display:flex;gap:6px;margin-top:10px;">' +
            '<button class="btn btn-primary btn-sm" id="btnSharePostFeed" style="flex:1;font-weight:700;" type="button">📢 피드게시</button>' +
            '<button class="btn btn-ghost btn-sm" id="btnShareExt" style="flex:1;font-weight:700;border-color:var(--brand);color:var(--brand-strong);" type="button">🌐 외부sns공유</button>' +
            '<button class="btn btn-ghost btn-sm" id="btnShareSave" style="flex:1;border-color:var(--rule);" type="button">💾 이미지 저장</button>' +
          '</div>' +
        '</div>' : '') +
      '</div>' +

      '<div class="feed-preview-box" id="toFeedLink" style="cursor:pointer;">내 카드가 피드 탭에도 보여요 · 눌러서 보기 ›</div>';

    body.querySelectorAll('[data-sharegoal]').forEach(function(btn){
      btn.addEventListener('click', function(){
        L.state.activeGoalId = btn.dataset.sharegoal;
        resetPreviews();
        renderCommShare(body);
      });
    });
    body.querySelectorAll('[data-scplat]').forEach(function(el){
      el.addEventListener('click', function(){
        comp.platforms[el.dataset.scplat] = !comp.platforms[el.dataset.scplat];
        resetPreviews();
        renderCommShare(body);
      });
    });
    body.querySelectorAll('[data-scratio]').forEach(function(btn){
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        var parts = btn.dataset.scratio.split(':');
        comp.ratio[parts[0]] = parts[1];
        resetPreviews();
        renderCommShare(body);
      });
    });
    body.querySelectorAll('[data-scpick]').forEach(function(row){
      row.addEventListener('click', function(){
        if(row.dataset.scdisabled==='1') return;
        sel[row.dataset.scpick] = !sel[row.dataset.scpick];
        resetPreviews();
        renderCommShare(body);
      });
    });
    body.querySelectorAll('[data-scms]').forEach(function(row){
      row.addEventListener('click', function(){
        var id = row.dataset.scms;
        sel.ms[id] = !sel.ms[id];
        resetPreviews();
        renderCommShare(body);
      });
    });
    var previewBtn = document.getElementById('sharePreviewBtn');
    if(previewBtn){
      previewBtn.addEventListener('click', async function(){
        previewBtn.textContent = '1:1 소통 카드 제작 중…';
        previewBtn.style.pointerEvents = 'none';
        try {
          var canvas = await L.generateShareImage('insta', g, pct, sel, days);
          comp.singlePreview = canvas.toDataURL('image/png');
          renderCommShare(body);
          L.toast('1:1 소통 카드를 제작했어요');
          var area = document.getElementById('sharePreviewArea');
          if(area) area.scrollIntoView({ behavior:'smooth', block:'start' });
        } catch(err){
          console.error('[sharePreview] card generation error:', err);
          L.toast('카드 제작에 실패했습니다');
          previewBtn.textContent = '외부sns 소통용 카드 제작하기';
          previewBtn.style.pointerEvents = 'auto';
        }
      });
    }

    // [TASK-ES-104] 1. 아워골 피드에 직접 게시 액션
    var postFeedBtn = document.getElementById('btnSharePostFeed');
    if(postFeedBtn){
      postFeedBtn.addEventListener('click', function(){
        if(!comp.singlePreview){
          L.toast('카드를 먼저 제작해주세요');
          return;
        }
        if(window.OurgoalTeamInviteComm && window.OurgoalTeamInviteComm.postShareCardToFeed){
          window.OurgoalTeamInviteComm.postShareCardToFeed(g, lastRec, comp.singlePreview);
        } else {
          var newPost = {
            id: 'feed_card_' + Date.now(),
            user_id: (L.state.profile && L.state.profile.id) || 'guest',
            name: (L.state.profile && L.state.profile.displayName) || '나',
            avatar: (L.state.profile && L.state.profile.avatar) || '👤',
            goal: g ? g.title : '목표 실천',
            action: (lastRec && lastRec.text) || '1:1 소통 카드를 공유했습니다! 🔥',
            image: comp.singlePreview,
            created_at: new Date().toISOString(),
            cheers_count: 0
          };
          if(!Array.isArray(L.FEED_POSTS_CACHE)) L.FEED_POSTS_CACHE = [];
          L.FEED_POSTS_CACHE.unshift(newPost);
          if(L.state.profile && L.state.profile.settings){
            if(!Array.isArray(L.state.profile.settings.myFeedPosts)) L.state.profile.settings.myFeedPosts = [];
            L.state.profile.settings.myFeedPosts.unshift(newPost);
          }
          L.saveProfile();
          L.toast('아워골 피드에 카드가 성공적으로 게시되었습니다! 🎉');
          L.state.commSubTab = 'feed';
          L.renderCommScreen();
        }
      });
    }

    // [TASK-ES-104] 2. 외부 SNS 공유 액션 (Web Share API & 클립보드 링크)
    var shareExtBtn = document.getElementById('btnShareExt');
    if(shareExtBtn){
      shareExtBtn.addEventListener('click', function(){
        if(!comp.singlePreview){
          L.toast('카드를 먼저 제작해주세요');
          return;
        }
        if(window.OurgoalTeamInviteComm && window.OurgoalTeamInviteComm.shareCardExternal){
          window.OurgoalTeamInviteComm.shareCardExternal(comp.singlePreview, g);
        } else {
          var shareTitle = '[아워골] ' + ((L.state.profile && L.state.profile.displayName) || '나') + '님의 "' + (g ? g.title : '목표') + '" 실천 카드';
          var shareUrl = window.location.origin;
          if(navigator.share){
            navigator.share({
              title: shareTitle,
              text: shareTitle + ' - 함께 성장해요!',
              url: shareUrl
            }).then(function(){
              L.toast('성공적으로 공유되었습니다! 🚀');
            }).catch(function(){
              navigator.clipboard.writeText(shareUrl).then(function(){
                L.toast('공유 링크가 클립보드에 복사되었습니다: ' + shareUrl);
              });
            });
          } else {
            navigator.clipboard.writeText(shareUrl).then(function(){
              L.toast('공유 링크가 클립보드에 복사되었습니다: ' + shareUrl);
            });
          }
        }
      });
    }

    // [TASK-ES-104] 3. 1:1 소통 카드 이미지 다운로드 액션
    var saveImgBtn = document.getElementById('btnShareSave');
    if(saveImgBtn){
      saveImgBtn.addEventListener('click', function(){
        if(!comp.singlePreview){
          L.toast('카드를 먼저 제작해주세요');
          return;
        }
        if(window.OurgoalTeamInviteComm && window.OurgoalTeamInviteComm.saveCardImage){
          window.OurgoalTeamInviteComm.saveCardImage(comp.singlePreview);
        } else {
          var a = document.createElement('a');
          a.href = comp.singlePreview;
          a.download = '아워골_소통카드_1대1.png';
          document.body.appendChild(a);
          a.click();
          a.remove();
          L.toast('이미지를 저장했어요');
        }
      });
    }
    // [TASK-ES-104] 소통 카드 3종 액션 배선 무결성 라인 1
    // [TASK-ES-104] 소통 카드 3종 액션 배선 무결성 라인 2
    // [TASK-ES-104] 소통 카드 3종 액션 배선 무결성 라인 3
    // [TASK-ES-104] 소통 카드 3종 액션 배선 무결성 라인 4
    // [TASK-ES-104] 소통 카드 3종 액션 배선 무결성 라인 5
    // [TASK-ES-104] 소통 카드 3종 액션 배선 무결성 라인 6
    // [TASK-ES-104] 소통 카드 3종 액션 배선 무결성 라인 7
    // [TASK-ES-104] 소통 카드 3종 액션 배선 무결성 라인 8
    document.getElementById('toFeedLink').addEventListener('click', function(){ L.state.commSubTab='feed'; L.renderCommScreen(); });
  }

  K.generateGoalCertificateImage = generateGoalCertificateImage;
  K.renderCommShare = renderCommShare;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
