/* ============================================================
 * 아워골 — 도움돼요 이유 작성 + 크레딧
 * KF-5 · #TASK-ES-016 · 본질 ③ 동류 발견·소통
 *
 * 도움돼요를 누른 직후 "왜 도움이 됐나요?" 시트를 띄운다(건너뛰기 가능).
 * 태그 1개 + 한 줄 텍스트(선택). 텍스트가 품질 게이트(최소 글자 수·복붙 아님)를
 * 넘으면 서버 RPC 가 공용 원장에 적립을 시도한다 — 크레딧이 꺼져 있으면(기본) 0.
 * 서버(docs/sql/2026-09-12-helpful-reason.sql)가 아직 적용되지 않았으면 조용히
 * 기기 저장으로 폴백하고 오류를 띄우지 않는다. 숫자는 실데이터만, 0이면 숨긴다.
 *
 * js/reactions.js(KF-7)가 도움돼요 저장 성공 직후 openSheet 를 부르고,
 * 글쓴이 카드에는 authorButtonHtml / bind 로 "이유 보기"를 붙인다.
 * ============================================================ */
(function(){
  'use strict';

  /* 태그는 서버 설정값(credit_settings.helpful_reason_tags)이 우선. 아래는 서버가 없을 때의 기본값 */
  var DEFAULT_TAGS = [
    { code: 'how_to',         label: '구체적인 방법을 알려줘요' },
    { code: 'same_situation', label: '내 상황과 같아요' },
    { code: 'motivation',     label: '동기부여가 됐어요' },
    { code: 'new_info',       label: '몰랐던 정보예요' },
    { code: 'other',          label: '기타' }
  ];
  var DEFAULT_MIN_CHARS = 10;   /* 기본값 — credit_settings.min_reason_chars 가 null 일 때만 쓴다 */
  var TEXT_MAX = 300;

  var deps = null;
  var serverOk = null;          /* null 미확인 · true 사용 가능 · false 미적용(기기 저장 폴백) */
  var tags = DEFAULT_TAGS;
  var minChars = DEFAULT_MIN_CHARS;
  var policyLoaded = false;

  function esc(s){ return deps && deps.escapeHtml ? deps.escapeHtml(s == null ? '' : String(s)) : String(s == null ? '' : s); }
  function profile(){ return deps && deps.getProfile ? deps.getProfile() : null; }
  function settings(){ var p = profile(); if(!p) return null; if(!p.settings) p.settings = {}; return p.settings; }
  function myId(){ var p = profile(); return p ? p.id : null; }
  function toast(m){ if(deps && deps.toast) deps.toast(m); }
  function isBot(it){ return window.OurgoalReactions ? window.OurgoalReactions.isBot(it) : !!(it && it.is_ai); }
  function isVirtualMine(it){ return !!(it && typeof it.id === 'string' && it.id.indexOf('me_') === 0); }
  function missingSchema(err){
    if(window.OurgoalReactions && window.OurgoalReactions.missingSchema) return window.OurgoalReactions.missingSchema(err);
    if(!err) return false;
    var code = String(err.code || ''), msg = String(err.message || '');
    return code === 'PGRST202' || code === 'PGRST205' || code === '42883' || code === '42P01' || /does not exist|not find|schema cache|404/i.test(msg);
  }
  function tagLabel(code){
    for(var i = 0; i < tags.length; i++){ if(tags[i].code === code) return tags[i].label; }
    return code;
  }

  /* 설정값(태그 목록·최소 글자 수)은 크레딧 정책과 같은 RPC 에서 1회 읽는다 */
  function loadPolicy(){
    if(policyLoaded || !window.OurgoalCredits || !window.OurgoalCredits.policy) return Promise.resolve();
    policyLoaded = true;
    return window.OurgoalCredits.policy().then(function(p){
      if(p && Array.isArray(p.helpful_reason_tags) && p.helpful_reason_tags.length){
        var ok = p.helpful_reason_tags.filter(function(t){ return t && t.code && t.label; });
        if(ok.length) tags = ok;
      }
      if(p && typeof p.min_reason_chars === 'number' && p.min_reason_chars > 0) minChars = p.min_reason_chars;
    }).catch(function(){ /* 조용히 기본값 */ });
  }

  /* 기기 저장 폴백 — settings.helpfulReasons[targetId] = { tag, text, createdAt } */
  function localSave(targetId, tag, text){
    var s = settings(); if(!s) return false;
    if(!s.helpfulReasons) s.helpfulReasons = {};
    s.helpfulReasons[targetId] = { tag: tag, text: text || null, createdAt: new Date().toISOString() };
    if(deps.saveProfile) deps.saveProfile();
    return true;
  }
  function localHas(targetId){
    var s = settings(); return !!(s && s.helpfulReasons && s.helpfulReasons[targetId]);
  }
  function localDuplicate(targetId, text){
    var s = settings(); if(!s || !s.helpfulReasons || !text) return false;
    var norm = text.replace(/\s+/g, '').toLowerCase();
    return Object.keys(s.helpfulReasons).some(function(k){
      var r = s.helpfulReasons[k];
      return k !== targetId && r && r.text && r.text.replace(/\s+/g, '').toLowerCase() === norm;
    });
  }

  /* ---------- 저장 ---------- */
  function save(it, tag, text){
    var targetId = String(it.id);
    var uid = myId();
    if(serverOk === false || isVirtualMine(it) || !deps.sb || !uid){
      return Promise.resolve({ ok: localSave(targetId, tag, text), local: true, credit: 0 });
    }
    return deps.sb.rpc('save_helpful_reason', { p_target_type: 'feed_post', p_target_id: targetId, p_reason_tag: tag, p_reason_text: text || null })
      .then(function(res){
        if(res.error){
          if(missingSchema(res.error)){ serverOk = false; return { ok: localSave(targetId, tag, text), local: true, credit: 0 }; }
          var msg = String(res.error.message || '');
          if(/helpful reaction required/.test(msg)) toast('먼저 도움돼요를 눌러주세요');
          else if(/own content/.test(msg)) toast('내 글에는 남길 수 없어요');
          else toast('잠시 후 다시 시도해주세요');
          return { ok: false, credit: 0 };
        }
        serverOk = true;
        var d = res.data || {};
        var granted = typeof d.credit_granted === 'number' ? d.credit_granted : 0;
        /* 서버가 적립했으면 같은 멱등 키라 아래 호출은 0을 돌려준다(이중 지급 없음) */
        var p = window.OurgoalCredits && window.OurgoalCredits.award
          ? window.OurgoalCredits.award('helpful_reason', 'feed_post', targetId, 'helpful_reason:' + uid + ':' + targetId)
          : Promise.resolve(0);
        return p.then(function(n){ return { ok: true, credit: Math.max(granted, n || 0), pass: !!d.quality_pass, minChars: d.min_chars || minChars }; })
                .catch(function(){ return { ok: true, credit: granted, pass: !!d.quality_pass, minChars: d.min_chars || minChars }; });
      })
      .catch(function(){ return { ok: localSave(targetId, tag, text), local: true, credit: 0 }; });
  }

  /* ---------- 시트 ---------- */
  function openSheet(it, btn){
    if(!deps || !deps.openModal || isBot(it)) return;
    if(localHas(String(it.id)) && serverOk === false) return;   /* 기기 저장 폴백에서 이미 적었으면 다시 묻지 않는다 */
    loadPolicy().then(function(){
      deps.openModal(
        '<h3>어떤 점이 도움이 됐나요?</h3>' +
        '<p class="muted" style="margin:0 0 10px;font-size:.82rem;line-height:1.45;">글쓴이에게 전해져요. 누가 적었는지는 보이지 않아요.</p>' +
        '<div id="hrTagList" style="display:flex;flex-direction:column;gap:8px;">' +
          tags.map(function(t){ return '<label style="display:flex;align-items:center;gap:8px;font-size:.9rem;"><input type="radio" name="hrTag" value="' + esc(t.code) + '"> ' + esc(t.label) + '</label>'; }).join('') +
        '</div>' +
        '<textarea id="hrText" rows="2" maxlength="' + TEXT_MAX + '" placeholder="한 줄로 적으면 글쓴이에게 더 도움이 돼요 (선택)" style="width:100%;margin-top:10px;border:1px solid var(--rule);border-radius:12px;padding:10px;font:inherit;box-sizing:border-box;"></textarea>' +
        '<p class="muted" id="hrHint" style="margin:6px 0 0;font-size:.76rem;line-height:1.4;">' + minChars + '자 이상 구체적으로 적어주세요.</p>' +
        '<div class="modal-actions">' +
          '<button class="btn btn-ghost" id="hrSkip" type="button">건너뛰기</button>' +
          '<button class="btn btn-primary" id="hrOk" type="button" disabled>보내기</button>' +
        '</div>',
        function(sheet){
          var ok = sheet.querySelector('#hrOk');
          var text = sheet.querySelector('#hrText');
          var hint = sheet.querySelector('#hrHint');
          function sync(){
            var picked = sheet.querySelector('input[name="hrTag"]:checked');
            ok.disabled = !picked;
            var v = text.value.trim();
            if(!v) hint.textContent = minChars + '자 이상 구체적으로 적어주세요.';
            else if(v.length < minChars) hint.textContent = (minChars - v.length) + '자만 더 적으면 돼요.';
            else if(localDuplicate(String(it.id), v)) hint.textContent = '다른 글에 적은 문장과 같아요. 이 글에 맞게 적어주세요.';
            else hint.textContent = '좋아요. 이 글에 딱 맞는 이유예요.';
          }
          sheet.querySelectorAll('input[name="hrTag"]').forEach(function(r){ r.addEventListener('change', sync); });
          text.addEventListener('input', sync);
          sheet.querySelector('#hrSkip').addEventListener('click', function(){ deps.closeModal(); });
          ok.addEventListener('click', function(){
            var picked = sheet.querySelector('input[name="hrTag"]:checked');
            if(!picked) return;
            ok.disabled = true;
            save(it, picked.value, text.value.trim().slice(0, TEXT_MAX)).then(function(r){
              deps.closeModal();
              if(!r || !r.ok) return;
              if(r.credit > 0) toast('+' + r.credit + ' 크레딧 · 이유가 전해졌어요');
              else if(r.pass === false && text.value.trim()) toast('이유가 전해졌어요. 조금 더 구체적으로 적으면 좋아요');
              else toast('이유가 전해졌어요');
            });
          });
        }
      );
    });
  }

  /* ---------- 글쓴이: 이유 보기 ---------- */
  function authorButtonHtml(it, helpfulCount){
    if(isBot(it)) return '';
    var n = Number(helpfulCount) || 0;
    return '<span data-hrsumwrap="' + esc(it.id) + '">' +
      (n > 0 ? '<button class="feed-comm-toggle has-comments" data-hrsum="' + esc(it.id) + '" type="button">👍 도움된 이유 보기</button>' : '') +
      '</span>';
  }
  function patchAuthorButton(body, it, helpfulCount){
    if(!body) return;
    var wrap = body.querySelector('[data-hrsumwrap="' + it.id + '"]');
    if(!wrap) return;
    var tmp = document.createElement('div');
    tmp.innerHTML = authorButtonHtml(it, helpfulCount);
    var fresh = tmp.firstChild;
    if(fresh){ wrap.replaceWith(fresh); bindOne(fresh, it); }
  }
  function openSummary(it){
    if(!deps || !deps.openModal) return;
    function render(tagsArr, texts){
      var tagHtml = tagsArr.length
        ? '<div style="display:flex;flex-wrap:wrap;gap:6px;">' + tagsArr.map(function(t){ return '<span class="topic-pill">' + esc(tagLabel(t.tag)) + ' ' + t.cnt + '</span>'; }).join('') + '</div>'
        : '<p class="muted" style="font-size:.85rem;">아직 전해진 이유가 없어요.</p>';
      var textHtml = texts.length
        ? '<div class="feed-comments-list" style="margin-top:10px;">' + texts.map(function(x){
            return '<div class="feed-comment-bubble"><div class="feed-c-body">' +
              '<div class="feed-c-meta"><span class="feed-c-badge">' + esc(tagLabel(x.tag)) + '</span><span class="feed-c-time">' + (deps.timeAgo ? deps.timeAgo(x.created_at) : '') + '</span></div>' +
              '<div class="feed-c-text">' + esc(x.text) + '</div></div></div>';
          }).join('') + '</div>'
        : '';
      deps.openModal(
        '<h3>이 글이 도움이 된 이유</h3>' +
        '<p class="muted" style="margin:0 0 10px;font-size:.82rem;">누가 적었는지는 보이지 않아요.</p>' +
        tagHtml + textHtml +
        '<div class="modal-actions"><button class="btn btn-ghost" id="hrSumClose" type="button">닫기</button></div>',
        function(sheet){ sheet.querySelector('#hrSumClose').addEventListener('click', function(){ deps.closeModal(); }); }
      );
    }
    if(serverOk === false || !deps.sb){ render([], []); return; }
    deps.sb.rpc('helpful_reason_summary', { p_target_type: 'feed_post', p_target_id: String(it.id) }).then(function(res){
      if(res.error){ if(missingSchema(res.error)) serverOk = false; render([], []); return; }
      serverOk = true;
      var d = res.data || {};
      render(Array.isArray(d.tags) ? d.tags : [], Array.isArray(d.texts) ? d.texts : []);
    }).catch(function(){ render([], []); });
  }

  function bindOne(el, it){
    if(!el) return;
    var b = el.matches && el.matches('[data-hrsum]') ? el : el.querySelector('[data-hrsum]');
    if(b) b.addEventListener('click', function(){ loadPolicy().then(function(){ openSummary(it); }); });
  }
  function bind(body, items){
    if(!body) return;
    (items || []).forEach(function(it){ bindOne(body.querySelector('[data-hrsumwrap="' + it.id + '"]'), it); });
  }

  function init(d){ deps = d || null; }

  window.OurgoalHelpfulReason = {
    DEFAULT_TAGS: DEFAULT_TAGS, DEFAULT_MIN_CHARS: DEFAULT_MIN_CHARS,
    init: init, openSheet: openSheet, openSummary: openSummary,
    authorButtonHtml: authorButtonHtml, patchAuthorButton: patchAuthorButton, bind: bind,
    _state: function(){ return { serverOk: serverOk, tags: tags, minChars: minChars }; }
  };
})();
