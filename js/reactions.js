/* ============================================================
 * 아워골 — 컨텐츠 반응 4종 (응원해요 · 도움돼요 · 별로에요 · 조언해요)
 * KF-7 · #TASK-ES-014 · 본질 ③ 동류 발견·소통
 *
 * index.html 의 메인 스크립트가 init(deps) 로 필요한 핸들(supabase 클라이언트,
 * 프로필, 모달, 토스트 …)을 넘긴다. 서버(docs/sql/2026-09-12-content-reactions.sql)가
 * 아직 적용되지 않았으면 조용히 기기 저장으로 폴백하고 화면에 오류를 띄우지 않는다.
 * 봇·시뮬 글(is_ai / sim_ 접두)에는 반응 버튼을 비활성한다. 숫자는 실데이터만,
 * 0이면 표시하지 않는다.
 * ============================================================ */
(function(){
  'use strict';

  var TYPES = [
    { key: 'cheer',   label: '응원해요', icon: '🔥', title: '응원해요' },
    { key: 'helpful', label: '도움돼요', icon: '👍', title: '내 목표에 도움이 됐어요' },
    { key: 'poor',    label: '별로에요', icon: '🤔', title: '별로예요 (이유를 적어요)' },
    { key: 'advice',  label: '조언해요', icon: '💡', title: '팁을 남겨요' }
  ];
  var POOR_REASONS = [
    { code: 'ai_suspect', label: '인공지능이 만든 글 같아요' },
    { code: 'wrong_info', label: '잘못된 정보가 많아요' },
    { code: 'ad',         label: '광고·홍보 글이에요' },
    { code: 'off_topic',  label: '목표와 상관없는 글이에요' },
    { code: 'other',      label: '기타 (직접 적을게요)' }
  ];
  var ADVICE_MAX = 600;
  var REASON_MAX = 300;

  var deps = null;
  var serverOk = null;          // null 미확인 · true 사용 가능 · false 미적용(기기 저장 폴백)
  var counts = {};              // targetId -> { cheer:n, helpful:n, poor:n, advice:n }
  var mine = {};                // targetId -> { cheer:true, ... }
  var advices = {};             // targetId -> [row]
  var expanded = {};            // targetId -> boolean (조언 패널 열림)
  var lastItems = [];

  function esc(s){ return deps && deps.escapeHtml ? deps.escapeHtml(s == null ? '' : String(s)) : String(s == null ? '' : s); }
  function profile(){ return deps && deps.getProfile ? deps.getProfile() : null; }
  function settings(){ var p = profile(); if(!p) return null; if(!p.settings) p.settings = {}; return p.settings; }
  function myId(){ var p = profile(); return p ? p.id : null; }
  function myName(){ var p = profile(); return (p && p.displayName) || ''; }
  function isBot(it){ return !!(it && (it.is_ai || (typeof it.id === 'string' && it.id.indexOf('sim_') === 0))); }
  function isVirtualMine(it){ return !!(it && typeof it.id === 'string' && it.id.indexOf('me_') === 0); }
  function toast(m){ if(deps && deps.toast) deps.toast(m); }

  /* 서버 미적용 판별: 함수 없음(PGRST202) · 테이블 없음(PGRST205) · 404 */
  function missingSchema(err){
    if(!err) return false;
    var code = String(err.code || '');
    var msg = String(err.message || '');
    return code === 'PGRST202' || code === 'PGRST205' || code === '42883' || code === '42P01' ||
           /does not exist|not find|schema cache|404/i.test(msg);
  }

  /* 기기 저장 폴백(서버 없을 때) — settings.feedReactionsV2[targetId] */
  function localBag(targetId, create){
    var s = settings(); if(!s) return null;
    if(!s.feedReactionsV2) s.feedReactionsV2 = {};
    if(!s.feedReactionsV2[targetId] && create) s.feedReactionsV2[targetId] = {};
    return s.feedReactionsV2[targetId] || null;
  }
  function localMine(targetId){
    var out = {};
    var bag = localBag(targetId, false);
    if(bag){ TYPES.forEach(function(t){ if(bag[t.key]) out[t.key] = true; }); }
    /* 예전 이모지 반응(기기 저장)은 응원해요로 본다 — 데이터는 그대로 둔다 */
    var s = settings();
    var legacy = (s && s.feedReactions) || {};
    if(legacy[targetId + ':fire'] || legacy[targetId + ':clap'] || legacy[targetId + ':heart'] || legacy[targetId + ':sparkle'] || legacy[targetId]) out.cheer = true;
    return out;
  }

  function myState(targetId){
    if(mine[targetId]) return mine[targetId];
    return localMine(targetId);
  }

  function countOf(it, type){
    var c = counts[it.id];
    if(c && typeof c[type] === 'number') return c[type];
    if(serverOk === true) return 0;
    /* 서버 집계가 없을 때: 응원해요만 서버의 cheers_count(실데이터)를 쓰고, 나머지는 내 반응만 */
    var m = myState(it.id);
    if(type === 'cheer') return (it.cheers || 0) + (m.cheer && serverOk === false ? 1 : 0);
    return m[type] ? 1 : 0;
  }

  /* ---------- 마크업 ---------- */
  function buttonsHtml(it, ctx){
    var bot = isBot(it);
    var m = myState(it.id);
    var isMe = !!(ctx && ctx.isMe);
    return TYPES.map(function(t){
      if(isMe && (t.key === 'helpful' || t.key === 'poor')) return '';   /* 내 글엔 도움돼요·별로에요 없음 */
      var n = bot ? 0 : countOf(it, t.key);
      var on = !bot && !!m[t.key];
      var cls = 'feed-react-btn rx-btn' + (on ? ' active active-' + (t.key === 'cheer' ? 'fire' : (t.key === 'helpful' ? 'clap' : (t.key === 'advice' ? 'sparkle' : 'heart'))) : '');
      return '<button class="' + cls + '" data-rx="' + t.key + '" data-rxid="' + esc(it.id) + '" type="button"' +
        (bot ? ' disabled aria-disabled="true" title="AI 봇 글에는 반응할 수 없어요" style="opacity:.45;cursor:not-allowed;"' : ' title="' + esc(t.title) + '"') + '>' +
        t.icon + ' ' + t.label + (n > 0 ? ' <span class="rx-cnt" data-rxcnt="' + t.key + '">' + n + '</span>' : '<span class="rx-cnt" data-rxcnt="' + t.key + '"></span>') +
        '</button>';
    }).join('') +
    /* KF-5 #TASK-ES-016: 글쓴이에게 "도움된 이유 보기" (도움돼요가 1건 이상일 때만) */
    (isMe && !bot && window.OurgoalHelpfulReason ? window.OurgoalHelpfulReason.authorButtonHtml(it, countOf(it, 'helpful')) : '');
  }

  function advicePanelHtml(it){
    if(isBot(it)) return '';
    var list = advices[it.id] || localAdvice(it.id);
    var n = list.length;
    if(!n) return '<div class="rx-advice-wrap" data-rxadv="' + esc(it.id) + '"></div>';
    var open = !!expanded[it.id];
    return '<div class="rx-advice-wrap" data-rxadv="' + esc(it.id) + '">' +
      '<button class="feed-comm-toggle has-comments" data-rxadvtoggle="' + esc(it.id) + '" type="button" style="margin-top:6px;">조언 ' + n + '개' + (open ? ' 접기' : ' 보기') + '</button>' +
      (open ? '<div class="feed-comments-list" style="margin-top:6px;">' + list.map(function(a){ return adviceRowHtml(it, a); }).join('') + '</div>' : '') +
      '</div>';
  }

  function adviceRowHtml(it, a){
    var isOwner = !!a.is_owner || (it.userId && it.userId === myId()) || !!it.me;
    var isMine = !!a.is_mine || a.user_id === myId() || a.local === true;
    var vis = a.advice_visibility === 'everyone' ? '모두에게' : '원작자에게만';
    var menu = '';
    if(isOwner && !a.local){
      menu += '<button data-rxmod="' + (a.advice_visibility === 'everyone' ? 'author_only' : 'everyone') + '" data-rxmodid="' + a.id + '" type="button" style="background:none;border:none;color:var(--ink-faint);font-size:.7rem;cursor:pointer;">' + (a.advice_visibility === 'everyone' ? '원작자만 보기로' : '모두에게 공개') + '</button>';
    }
    if((isOwner || isMine) && !a.local){
      menu += '<button data-rxmod="delete" data-rxmodid="' + a.id + '" type="button" style="background:none;border:none;color:var(--ink-faint);font-size:.7rem;cursor:pointer;">삭제</button>';
    }
    if(a.local){
      menu += '<button data-rxlocaldel="' + esc(it.id) + '" data-rxlocalidx="' + a.idx + '" type="button" style="background:none;border:none;color:var(--ink-faint);font-size:.7rem;cursor:pointer;">삭제</button>';
    }
    return '<div class="feed-comment-bubble' + (isMine ? ' me-comment' : '') + '">' +
      '<div class="feed-c-avatar' + (isMine ? ' me' : '') + '">' + esc((a.reactor_name || '?').slice(0, 1)) + '</div>' +
      '<div class="feed-c-body">' +
        '<div class="feed-c-meta"><span class="feed-c-name">' + esc(a.reactor_name || '익명') + '</span>' +
          '<span class="feed-c-badge">' + vis + '</span>' +
          '<span class="feed-c-time">' + (deps.timeAgo ? deps.timeAgo(a.created_at) : '') + '</span></div>' +
        '<div class="feed-c-text">' + esc(a.advice_text) + '</div>' +
        (menu ? '<div style="display:flex;gap:8px;margin-top:4px;">' + menu + '</div>' : '') +
      '</div></div>';
  }

  function localAdvice(targetId){
    var bag = localBag(targetId, false);
    var arr = (bag && bag.adviceList) || [];
    return arr.map(function(a, i){ return { id: 'local_' + i, idx: i, local: true, reactor_name: myName(), advice_text: a.text, advice_visibility: a.visibility, created_at: a.createdAt, is_mine: true }; });
  }

  /* ---------- 서버 읽기 ---------- */
  function realIds(items){
    return items.filter(function(it){ return !isBot(it) && !isVirtualMine(it) && it.id; }).map(function(it){ return String(it.id); });
  }

  function refresh(body, items){
    if(!deps || !deps.sb || serverOk === false) return Promise.resolve();
    var ids = realIds(items);
    if(!ids.length) return Promise.resolve();
    return Promise.all([
      deps.sb.rpc('count_content_reactions', { p_target_ids: ids }),
      deps.sb.rpc('my_content_reactions', { p_target_ids: ids }),
      deps.sb.rpc('list_content_advice', { p_target_ids: ids })
    ]).then(function(res){
      var err = (res[0] && res[0].error) || (res[1] && res[1].error) || (res[2] && res[2].error);
      if(err){ if(missingSchema(err)) serverOk = false; return; }
      serverOk = true;
      ids.forEach(function(id){ counts[id] = { cheer: 0, helpful: 0, poor: 0, advice: 0 }; mine[id] = {}; advices[id] = []; });
      (res[0].data || []).forEach(function(r){ if(counts[r.target_id]) counts[r.target_id][r.type] = r.cnt; });
      (res[1].data || []).forEach(function(r){ if(mine[r.target_id]) mine[r.target_id][r.type] = true; });
      (res[2].data || []).forEach(function(r){ if(advices[r.target_id]) advices[r.target_id].push(r); });
      patch(body, items);
    }).catch(function(){ /* 조용히 무시 */ });
  }

  /* 전체 재렌더 없이 버튼·조언 패널만 갱신 */
  function patch(body, items){
    if(!body) return;
    items.forEach(function(it){
      if(isBot(it)) return;
      var m = myState(it.id);
      body.querySelectorAll('[data-rx][data-rxid="' + it.id + '"]').forEach(function(btn){
        var t = btn.dataset.rx;
        var n = countOf(it, t);
        var span = btn.querySelector('[data-rxcnt]');
        if(span) span.textContent = n > 0 ? String(n) : '';
        var on = !!m[t];
        btn.classList.toggle('active', on);
        ['active-fire','active-clap','active-heart','active-sparkle'].forEach(function(c){ btn.classList.remove(c); });
        if(on) btn.classList.add('active-' + (t === 'cheer' ? 'fire' : (t === 'helpful' ? 'clap' : (t === 'advice' ? 'sparkle' : 'heart'))));
      });
      if(window.OurgoalHelpfulReason && window.OurgoalHelpfulReason.patchAuthorButton) window.OurgoalHelpfulReason.patchAuthorButton(body, it, countOf(it, 'helpful'));
      var wrap = body.querySelector('[data-rxadv="' + it.id + '"]');
      if(wrap){
        var tmp = document.createElement('div');
        tmp.innerHTML = advicePanelHtml(it);
        var fresh = tmp.firstChild;
        if(fresh){ wrap.replaceWith(fresh); bindAdvice(fresh, it); }
      }
    });
  }

  /* ---------- 쓰기 ---------- */
  function react(it, type, payload, btn){
    if(isBot(it)){ toast('AI 봇 글에는 반응할 수 없어요'); return Promise.resolve(false); }
    var name = myName();
    var params = { p_target_type: 'feed_post', p_target_id: String(it.id), p_type: type, p_reactor_name: name };
    if(type === 'poor'){ params.p_reason_tag = payload.reason_tag; params.p_reason_text = payload.reason_text || null; }
    if(type === 'advice'){ params.p_advice_text = payload.advice_text; params.p_advice_visibility = payload.advice_visibility; }

    function celebrate(){
      if(deps.triggerHaptic) deps.triggerHaptic(12);
      if(deps.burstConfetti && btn && btn.getBoundingClientRect){ var r = btn.getBoundingClientRect(); deps.burstConfetti(r.left + r.width / 2, r.top, 8); }
    }
    function local(){
      var bag = localBag(it.id, true);
      if(!bag) return false;
      if(type === 'advice'){ bag.adviceList = bag.adviceList || []; bag.adviceList.push({ text: payload.advice_text, visibility: payload.advice_visibility, createdAt: new Date().toISOString() }); }
      else if(type === 'poor'){ bag.poor = true; bag.poorReason = payload.reason_tag; }
      else bag[type] = true;
      if(deps.saveProfile) deps.saveProfile();
      return true;
    }

    if(serverOk === false || isVirtualMine(it) || !deps.sb){
      local(); celebrate(); return Promise.resolve(true);
    }
    return deps.sb.rpc('react_content', params).then(function(res){
      if(res.error){
        if(missingSchema(res.error)){ serverOk = false; local(); celebrate(); return true; }
        var msg = String(res.error.message || '');
        if(/own content/.test(msg)) toast('내 글에는 남길 수 없어요');
        else if(/bot/.test(msg)) toast('AI 봇 글에는 반응할 수 없어요');
        else toast('잠시 후 다시 시도해주세요');
        return false;
      }
      serverOk = true;
      if(!mine[it.id]) mine[it.id] = {};
      mine[it.id][type] = true;
      if(!counts[it.id]) counts[it.id] = { cheer: 0, helpful: 0, poor: 0, advice: 0 };
      counts[it.id][type] = (counts[it.id][type] || 0) + 1;
      if(type === 'advice') expanded[it.id] = true;
      celebrate();
      return true;
    });
  }

  function unreact(it, type){
    if(serverOk === false || isVirtualMine(it) || !deps.sb){
      var bag = localBag(it.id, false);
      if(bag){ delete bag[type]; if(deps.saveProfile) deps.saveProfile(); }
      var s = settings();
      if(type === 'cheer' && s && s.feedReactions){ ['','fire','clap','heart','sparkle'].forEach(function(k){ delete s.feedReactions[k ? it.id + ':' + k : it.id]; }); if(deps.saveProfile) deps.saveProfile(); }
      return Promise.resolve(true);
    }
    return deps.sb.rpc('unreact_content', { p_target_type: 'feed_post', p_target_id: String(it.id), p_type: type }).then(function(res){
      if(res.error){ if(missingSchema(res.error)) serverOk = false; return false; }
      if(mine[it.id]) delete mine[it.id][type];
      if(counts[it.id]) counts[it.id][type] = Math.max(0, (counts[it.id][type] || 0) - 1);
      return true;
    });
  }

  /* ---------- 시트 ---------- */
  function openPoorSheet(it, btn){
    if(!deps.openModal) return;
    deps.openModal(
      '<h3>어떤 점이 별로였나요?</h3>' +
      '<p class="muted" style="margin:0 0 10px;font-size:.875rem;line-height:1.45;">이유는 글쓴이에게 익명으로, 개수와 종류만 전해져요. 누가 눌렀는지는 보이지 않아요.</p>' +
      '<div id="rxPoorList" style="display:flex;flex-direction:column;gap:8px;">' +
        POOR_REASONS.map(function(r){ return '<label style="display:flex;align-items:center;gap:8px;font-size:.9rem;"><input type="radio" name="rxPoorReason" value="' + r.code + '"> ' + esc(r.label) + '</label>'; }).join('') +
      '</div>' +
      '<textarea id="rxPoorText" rows="2" maxlength="' + REASON_MAX + '" placeholder="조금 더 적어주면 도움이 돼요 (선택)" style="width:100%;margin-top:10px;border:1px solid var(--rule);border-radius:12px;padding:10px;font:inherit;box-sizing:border-box;"></textarea>' +
      '<div class="modal-actions">' +
        '<button class="btn btn-ghost" id="rxPoorCancel" type="button">취소</button>' +
        '<button class="btn btn-primary" id="rxPoorOk" type="button" disabled>보내기</button>' +
      '</div>',
      function(sheet){
        var ok = sheet.querySelector('#rxPoorOk');
        var text = sheet.querySelector('#rxPoorText');
        function sync(){
          var picked = sheet.querySelector('input[name="rxPoorReason"]:checked');
          var need = picked && picked.value === 'other';
          ok.disabled = !picked || (need && !text.value.trim());
        }
        sheet.querySelectorAll('input[name="rxPoorReason"]').forEach(function(r){ r.addEventListener('change', sync); });
        text.addEventListener('input', sync);
        sheet.querySelector('#rxPoorCancel').addEventListener('click', function(){ deps.closeModal(); });
        ok.addEventListener('click', function(){
          var picked = sheet.querySelector('input[name="rxPoorReason"]:checked');
          if(!picked) return;
          ok.disabled = true;
          react(it, 'poor', { reason_tag: picked.value, reason_text: text.value.trim().slice(0, REASON_MAX) }, btn).then(function(done){
            deps.closeModal();
            if(done){ toast('의견이 전해졌어요'); rerender(); }
          });
        });
      }
    );
  }

  function openAdviceSheet(it, btn){
    if(!deps.openModal) return;
    deps.openModal(
      '<h3>이 목표에 도움이 될 팁을 남겨요</h3>' +
      '<textarea id="rxAdvText" rows="4" maxlength="' + ADVICE_MAX + '" placeholder="내가 해보니 이렇게 하면 좋았어요…" style="width:100%;border:1px solid var(--rule);border-radius:12px;padding:10px;font:inherit;box-sizing:border-box;"></textarea>' +
      '<div style="display:flex;flex-direction:column;gap:8px;margin-top:10px;font-size:.9375rem;">' +
        '<label style="display:flex;align-items:center;gap:8px;"><input type="radio" name="rxAdvVis" value="author_only" checked> 글쓴이에게만 보여요</label>' +
        '<label style="display:flex;align-items:center;gap:8px;"><input type="radio" name="rxAdvVis" value="everyone"> 이 글을 보는 모두에게 보여요</label>' +
      '</div>' +
      '<p class="muted" style="margin:10px 0 0;font-size:.8125rem;line-height:1.45;">글쓴이는 이 조언의 공개 범위를 바꾸거나 지울 수 있어요.</p>' +
      '<div class="modal-actions">' +
        '<button class="btn btn-ghost" id="rxAdvCancel" type="button">취소</button>' +
        '<button class="btn btn-primary" id="rxAdvOk" type="button" disabled>남기기</button>' +
      '</div>',
      function(sheet){
        var ok = sheet.querySelector('#rxAdvOk');
        var text = sheet.querySelector('#rxAdvText');
        text.addEventListener('input', function(){ ok.disabled = !text.value.trim(); });
        sheet.querySelector('#rxAdvCancel').addEventListener('click', function(){ deps.closeModal(); });
        ok.addEventListener('click', function(){
          var vis = (sheet.querySelector('input[name="rxAdvVis"]:checked') || {}).value || 'author_only';
          var v = text.value.trim().slice(0, ADVICE_MAX);
          if(!v) return;
          ok.disabled = true;
          react(it, 'advice', { advice_text: v, advice_visibility: vis }, btn).then(function(done){
            deps.closeModal();
            if(done){ toast('조언을 남겼어요'); rerender(); }
          });
        });
      }
    );
  }

  function rerender(){ if(deps && deps.rerenderFeed) deps.rerenderFeed(); }

  /* ---------- 이벤트 바인딩 ---------- */
  function bindAdvice(wrap, it){
    if(!wrap) return;
    var tg = wrap.querySelector('[data-rxadvtoggle]');
    if(tg) tg.addEventListener('click', function(){ expanded[it.id] = !expanded[it.id]; patch(wrap.parentNode, [it]); });
    wrap.querySelectorAll('[data-rxmod]').forEach(function(b){
      b.addEventListener('click', function(){
        if(!deps.sb) return;
        var action = b.dataset.rxmod;
        if(action === 'delete' && !window.confirm('이 조언을 지울까요?')) return;
        deps.sb.rpc('moderate_advice', { p_reaction_id: Number(b.dataset.rxmodid), p_action: action }).then(function(res){
          if(res.error){ toast('잠시 후 다시 시도해주세요'); return; }
          toast(action === 'delete' ? '조언을 지웠어요' : '공개 범위를 바꿨어요');
          rerender();
        });
      });
    });
    wrap.querySelectorAll('[data-rxlocaldel]').forEach(function(b){
      b.addEventListener('click', function(){
        var bag = localBag(b.dataset.rxlocaldel, false);
        if(bag && bag.adviceList){ bag.adviceList.splice(Number(b.dataset.rxlocalidx), 1); if(deps.saveProfile) deps.saveProfile(); }
        rerender();
      });
    });
  }

  function bind(body, items){
    if(!body || !deps) return;
    lastItems = items || [];
    var byId = {};
    lastItems.forEach(function(it){ byId[String(it.id)] = it; });
    body.querySelectorAll('[data-rx]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var it = byId[btn.dataset.rxid];
        if(!it || btn.disabled) return;
        var type = btn.dataset.rx;
        var m = myState(it.id);
        if(type === 'poor'){ if(m.poor){ unreact(it, 'poor').then(rerender); } else openPoorSheet(it, btn); return; }
        if(type === 'advice'){ openAdviceSheet(it, btn); return; }
        if(m[type]) unreact(it, type).then(function(){ patch(body, [it]); });
        else react(it, type, {}, btn).then(function(done){
          patch(body, [it]);
          /* KF-5 #TASK-ES-016: 도움돼요 저장 직후 "왜 도움이 됐나요?" 시트(건너뛰기 가능) */
          if(done && type === 'helpful' && window.OurgoalHelpfulReason) window.OurgoalHelpfulReason.openSheet(it, btn);
        });
      });
    });
    lastItems.forEach(function(it){ bindAdvice(body.querySelector('[data-rxadv="' + it.id + '"]'), it); });
    if(window.OurgoalHelpfulReason && window.OurgoalHelpfulReason.bind) window.OurgoalHelpfulReason.bind(body, lastItems);
    refresh(body, lastItems);
  }

  function init(d){ deps = d || null; }

  window.OurgoalReactions = {
    TYPES: TYPES, POOR_REASONS: POOR_REASONS,
    init: init, buttonsHtml: buttonsHtml, advicePanelHtml: advicePanelHtml, bind: bind,
    isBot: isBot, missingSchema: missingSchema,
    _state: function(){ return { serverOk: serverOk, counts: counts, mine: mine }; }
  };
})();
