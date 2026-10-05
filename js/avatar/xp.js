/**
 * OurGoal Avatar Cell: EXP·레벨 (#TASK-ES-395 · 아바타·EXP 쪼개기 PR-5, 설계 docs/specs/REQ-TASK-ES-384-AVATAR-EXP-PLAN.md 3-2절)
 *
 * index.html 인라인 IIFE 의 「XP/레벨 시스템」 구간(이전 전 3126~3193줄)의 선언을 동작 그대로 옮겼다(생성기 docs/design/harness/module-split/gen-avatar-xp.js).
 *   XP_RULES · XP_LOG_MAX · xpForLevel · levelForXP · levelProgress · triggerAvatarCelebrationPopup · awardXP · notifyXpGained
 * 바꾼 것: 인라인 스코프 이름은 L.<이름>(state · nowISO), 저장은 어댑터 xpStore 하나로 모음 — 저장 위치는 그대로 state.profile.settings.xp.
 * #TASK-ES-421(K-XP1): 어댑터 xpStore 뒤에 서버 원장(user_ledger_docs['xp'])을 붙였다 — 로그인 세션 사용자는 이관 확인 뒤 원장, 게스트는 그대로 기기. 규칙: docs/specs/REQ-TASK-ES-421-XP-SERVER-LEDGER.md
 * index.html 은 IIFE 맨 위에서 이 키트(OurgoalAvatarParts.xp — 새 전역 없음)의 이름을 같은 이름으로 가져온다 — 지급 호출처·app-scope getter 는 글자 그대로다.
 * window.xpForLevel · levelForXP · levelProgress · triggerAvatarCelebrationPopup · notifyXpGained 대입 줄은 이전 전과 같은 자리(index.html)에 있다.
 * 능력: xp.award(지급) · xp.read(읽기, 만들지 않음) 을 js/core/capabilities.js 에 준다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state · nowISO)를 getter 로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  var CELL = 'avatar/xp';

  var XP_RULES = { checkin: 10, milestoneDone: 50 };
  var XP_LOG_MAX = 200;
  function xpForLevel(level){
    // 레벨 1은 0 XP, 이후 레벨마다 필요 누적치가 50*(level-1)*level 만큼 늘어나는 성장 곡선.
    return 50 * (level - 1) * level;
  }
  function levelForXP(xp){
    var level = 1;
    while(xpForLevel(level + 1) <= xp) level++;
    return level;
  }
  function levelProgress(xp){
    var level = levelForXP(xp);
    var floor = xpForLevel(level);
    var ceil = xpForLevel(level + 1);
    return { level: level, xp: xp, into: xp - floor, span: ceil - floor, pct: Math.round(((xp - floor) / (ceil - floor)) * 100) };
  }
  function triggerAvatarCelebrationPopup(amount, reason){
    try {
      var oldPop = document.getElementById('avatarCelebrationToast');
      if(oldPop) oldPop.remove();
      var pop = document.createElement('div');
      pop.id = 'avatarCelebrationToast';
      pop.style.cssText = 'position:fixed;bottom:78px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,rgba(30,27,75,0.95),rgba(49,46,129,0.95));border:1.5px solid rgba(129,140,248,0.6);box-shadow:0 12px 30px rgba(0,0,0,0.35);backdrop-filter:blur(8px);border-radius:24px;padding:8px 16px;display:flex;align-items:center;gap:10px;z-index:99999;color:#fff;font-size:.875rem;font-weight:700;animation:animFadeInUp 0.3s cubic-bezier(0.16,1,0.3,1);cursor:pointer;user-select:none;pointer-events:auto;';
      var avImg = (L.state.profile && (L.state.profile.avatarUrl || (L.state.profile.settings && L.state.profile.settings.customAvatarUrl))) || '';
      var avIcon = avImg ? ('<img src="'+avImg+'" style="width:32px;height:32px;border-radius:50%;object-fit:cover;border:1.5px solid #818cf8;">') : '<span style="font-size:1.4rem;">🧑‍🚀</span>';
      pop.innerHTML = avIcon + '<div><div style="font-size:.84rem;color:#e0e7ff;">"잘했다! 내 자신!"</div><div style="font-size:.72rem;color:#38bdf8;font-weight:800;">+' + amount + ' EXP 획득</div></div><span style="font-size:.75rem;color:#94a3b8;margin-left:4px;">✕</span>';
      pop.onclick = function(){ pop.remove(); };
      document.body.appendChild(pop);
      setTimeout(function(){
        if(pop.parentNode){
          pop.style.transition = 'opacity 0.4s, transform 0.4s';
          pop.style.opacity = '0';
          pop.style.transform = 'translateX(-50%) translateY(12px)';
          setTimeout(function(){ if(pop.parentNode) pop.remove(); }, 400);
        }
      }, 2500);
    } catch(e){}
  }

  /* ============ [#TASK-ES-421 K-XP1] EXP 서버 원장 (2단계) ============
     상민님 결심(2026-10-05) "레벨 서버에 저장해야지" — 본인만 읽는 표, 백업 먼저, 이관 확인 뒤 기기 쓰기 중단.
     규칙 정본: docs/specs/REQ-TASK-ES-421-XP-SERVER-LEDGER.md · 표: docs/sql/2026-10-05-xp-ledger.sql (user_ledger_docs, doc_key 'xp')
     - 대상: Supabase 로그인 세션이 있고 세션 사용자 id 가 지금 프로필 id 와 같은 사람만. 게스트·세션 없는 로그인은 지금처럼 settings.xp(기기).
     - 이관(기기별 1회): 기기 settings.xp 원문을 ourgoal_xp_premigration_<uid> 에 먼저 백업 → 서버와 합치기(mergeXpDocs) → 쓰기 → 되읽어 같으면 확인.
       확인 전에는 settings.xp 를 지금처럼 쓴다. 확인 뒤에는 settings.xp 가 원장 메모리 판을 가리키는 숨은(열거 안 되는) 칸이 되어 기기 설정 저장에서 빠진다.
     - 확인 뒤 지급: 메모리 판에 바로 더하고 대기열(pending)에 넣는다 → 서버 판(rev)을 읽어 대기열을 얹어 쓴다. 실패·오프라인이면 기기 사본(ourgoal_ledger_cache_<uid>)에 남기고 다시 보낸다.
     - 지급 규칙·레벨 계산은 바꾸지 않는다. */
  var LEDGER_TABLE = 'user_ledger_docs';
  var LEDGER_DOC = 'xp';
  var LEDGER_SEEN_MAX = 2000;
  var LEDGER_CACHE_PREFIX = 'ourgoal_ledger_cache_';
  var LEDGER_BACKUP_PREFIX = 'ourgoal_xp_premigration_';
  var UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  var LG = freshLedger(null);

  function freshLedger(uid){
    return { uid: uid, active: false, base: null, mem: null, pending: [], importQ: null, rev: null, expected: 0, confirmedAt: null, attachedTo: null, syncing: null, again: false, mode: 'device', lastError: null, nextTry: 0 };
  }
  function xpNum(v){ v = Number(v); return isFinite(v) ? v : 0; }
  function atMs(e){ var t = Date.parse(e && e.at); return isFinite(t) ? t : 0; }
  function sumLog(log){ var s = 0; for(var i = 0; i < log.length; i++) s += xpNum(log[i].amount); return s; }
  function idSet(arr){ var o = Object.create(null); for(var i = 0; i < arr.length; i++) o[arr[i]] = true; return o; }
  function newOpId(){ return 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function ledgerStorage(){ try { return (typeof localStorage !== 'undefined' && localStorage) || null; } catch(e){ return null; } }

  // 이력 항목 id: 2단계 이후 항목은 지급 때 받은 id, 그 전(기기) 항목은 「시각|양|사유」로 만든다. 같은 글자가 여럿이면 오래된 것부터 #2, #3.
  function withXpIds(log){
    var src = Array.isArray(log) ? log.filter(function(e){ return e && typeof e === 'object'; }) : [];
    var out = new Array(src.length);
    var cnt = Object.create(null);
    for(var i = src.length - 1; i >= 0; i--){
      var e = src[i];
      var id = e.id ? String(e.id) : null;
      if(!id){
        var k = 'l:' + String(e.at || '') + '|' + xpNum(e.amount) + '|' + String(e.reason == null ? '' : e.reason);
        cnt[k] = (cnt[k] || 0) + 1;
        id = cnt[k] > 1 ? k + '#' + cnt[k] : k;
      }
      out[i] = { id: id, amount: xpNum(e.amount), reason: e.reason == null ? '' : String(e.reason), at: e.at || null };
    }
    return out;
  }
  function normalizeXpDoc(raw){
    raw = (raw && typeof raw === 'object') ? raw : {};
    var log = withXpIds(raw.log).slice(0, XP_LOG_MAX);
    var seen = [];
    var have = Object.create(null);
    log.map(function(e){ return e.id; }).concat(Array.isArray(raw.seen) ? raw.seen.map(String) : []).forEach(function(id){
      if(!have[id]){ have[id] = true; seen.push(id); }
    });
    return { v: 1, total: xpNum(raw.total), log: log, seen: seen.slice(0, LEDGER_SEEN_MAX) };
  }
  // 합치기(서버 S 를 바탕으로 기기 C 를 얹는다): 이력은 id 합집합(S 가 이미 본 id 는 다시 더하지 않음),
  // 합계 = S 합계 + 새로 더한 이력 합 + max(0, C 의 이력 밖 몫 − S 의 이력 밖 몫). 이력 밖 몫 = 합계 − 이력 합(200건 넘어 잘린 것·이력 없는 +5 등).
  // 그래서 결과 합계는 두 합계 중 큰 쪽 이상이고, 같은 판을 다시 합쳐도 늘지 않는다(멱등).
  function mergeXpDocs(server, local){
    var S = normalizeXpDoc(server), C = normalizeXpDoc(local);
    var known = idSet(S.seen);
    var added = C.log.filter(function(e){ return !known[e.id]; });
    var cSeen = idSet(C.seen), cLog = idSet(C.log.map(function(e){ return e.id; }));
    var overlap = sumLog(S.log.filter(function(e){ return cSeen[e.id] && !cLog[e.id]; }));
    var uS = S.total - sumLog(S.log);
    var uC = C.total - sumLog(C.log) - overlap;
    var total = S.total + sumLog(added) + Math.max(0, uC - uS);
    var log = S.log.concat(added).map(function(e, i){ return { e: e, i: i }; })
      .sort(function(a, b){ return (atMs(b.e) - atMs(a.e)) || (a.i - b.i); }).map(function(x){ return x.e; });
    var seen = added.map(function(e){ return e.id; }).concat(S.seen);
    return normalizeXpDoc({ total: total, log: log.slice(0, XP_LOG_MAX), seen: seen });
  }
  // 대기열 얹기: 서버 판이 이미 본 id 는 건너뛴다(같은 지급을 두 번 보내도 한 번만 더해짐). log:false 는 이력 없이 합계만(예: 첫 체크인 +5).
  function applyXpOps(doc, ops){
    var d = normalizeXpDoc(doc);
    var known = idSet(d.seen);
    (ops || []).forEach(function(op){
      if(!op || !op.id || known[op.id]) return;
      known[op.id] = true;
      d.total += xpNum(op.amount);
      if(op.log) d.log.unshift({ id: String(op.id), amount: xpNum(op.amount), reason: op.reason == null ? '' : String(op.reason), at: op.at || null });
      d.seen.unshift(String(op.id));
    });
    if(d.log.length > XP_LOG_MAX) d.log.length = XP_LOG_MAX;
    if(d.seen.length > LEDGER_SEEN_MAX) d.seen.length = LEDGER_SEEN_MAX;
    return d;
  }
  function canonXp(v){
    if(Array.isArray(v)) return '[' + v.map(canonXp).join(',') + ']';
    if(v && typeof v === 'object') return '{' + Object.keys(v).sort().map(function(k){ return JSON.stringify(k) + ':' + canonXp(v[k]); }).join(',') + '}';
    return JSON.stringify(v === undefined ? null : v);
  }
  function sameXpDoc(a, b){ return canonXp(normalizeXpDoc(a)) === canonXp(normalizeXpDoc(b)); }

  function readLedgerCache(uid){
    var ls = ledgerStorage(); if(!ls) return null;
    try { var c = JSON.parse(ls.getItem(LEDGER_CACHE_PREFIX + uid) || 'null'); return (c && typeof c === 'object') ? c : null; } catch(e){ return null; }
  }
  function writeLedgerCache(){
    var ls = ledgerStorage(); if(!ls || !LG.uid) return;
    try {
      var c = readLedgerCache(LG.uid) || {};
      c.xp = { doc: LG.base, pending: LG.pending, importQ: LG.importQ, rev: LG.rev, confirmedAt: LG.confirmedAt, savedAt: new Date().toISOString() };
      ls.setItem(LEDGER_CACHE_PREFIX + LG.uid, JSON.stringify(c));
    } catch(e){ LG.lastError = 'cache-write'; }
  }
  // 백업 먼저: 이관 전 기기 settings.xp 원문을 한 번만 남긴다(이미 있으면 덮지 않는다).
  function backupBeforeMigration(uid, plain){
    var ls = ledgerStorage(); if(!ls) return false;
    try {
      if(ls.getItem(LEDGER_BACKUP_PREFIX + uid)) return true;
      ls.setItem(LEDGER_BACKUP_PREFIX + uid, JSON.stringify({ savedAt: new Date().toISOString(), xp: plain || null }));
      return true;
    } catch(e){ return false; }
  }
  function plainXpOf(settings){
    var d = settings && Object.getOwnPropertyDescriptor(settings, 'xp');
    return (d && ('value' in d)) ? d.value : null;
  }
  function recomputeMem(){
    var start = LG.base || normalizeXpDoc(null);
    if(LG.importQ) start = mergeXpDocs(start, LG.importQ);
    LG.mem = applyXpOps(start, LG.pending);
    LG.expected = LG.mem.total;
  }
  function queueImport(v){
    if(!v || typeof v !== 'object') return;
    LG.importQ = LG.importQ ? mergeXpDocs(LG.importQ, v) : normalizeXpDoc(v);
    recomputeMem(); writeLedgerCache(); scheduleLedgerSync();
  }
  // 확인 뒤: settings.xp 를 원장 메모리 판을 가리키는 숨은 칸으로 바꾼다 — 읽는 곳(합계 표시 13곳)은 글자 그대로, 기기 설정 JSON 에는 안 들어간다.
  function installLedgerView(settings){
    var uid = LG.uid;
    Object.defineProperty(settings, 'xp', {
      configurable: true,
      enumerable: false,
      get: function(){ return LG.uid === uid && LG.active ? LG.mem : null; },
      set: function(v){ if(LG.uid === uid) queueImport(v); }
    });
    LG.attachedTo = settings;
  }
  // 프로필 불러오기 직후(index.html loadProfile) 같은 줄에서 부른다. 기기 사본으로 바로(동기) 붙이고 서버 맞추기는 뒤에서 한다.
  function attachLedger(userId, settings){
    try {
      if(!settings || typeof settings !== 'object' || !UUID_RE.test(String(userId || ''))) return settings;
      if(LG.uid !== userId) LG = freshLedger(userId);
      LG.attachedTo = settings;
      var c = readLedgerCache(userId);
      var cx = c && c.xp;
      if(cx && cx.confirmedAt){
        LG.base = normalizeXpDoc(cx.doc);
        LG.pending = Array.isArray(cx.pending) ? cx.pending : [];
        LG.importQ = cx.importQ ? normalizeXpDoc(cx.importQ) : null;
        LG.rev = cx.rev == null ? null : cx.rev;
        LG.confirmedAt = cx.confirmedAt;
        LG.active = true;
        LG.mode = 'ledger';
        var plain = plainXpOf(settings);
        if(plain && (xpNum(plain.total) || (Array.isArray(plain.log) && plain.log.length))){
          LG.importQ = LG.importQ ? mergeXpDocs(LG.importQ, plain) : normalizeXpDoc(plain);
        }
        recomputeMem();
        installLedgerView(settings);
        if(LG.importQ) writeLedgerCache();
      }
      scheduleLedgerSync();
    } catch(e){ LG.lastError = 'attach'; }
    return settings;
  }
  function currentProfile(){ return (L.state && L.state.profile) || null; }
  function ensureLedger(){
    var p = currentProfile();
    if(!p || !p.settings) return;
    if(!UUID_RE.test(String(p.id || ''))){ if(LG.uid) LG = freshLedger(null); return; }
    if(LG.uid !== p.id || LG.attachedTo !== p.settings) attachLedger(p.id, p.settings);
  }
  function captureDrift(){
    if(!LG.active || !LG.mem) return;
    var d = xpNum(LG.mem.total) - LG.expected;
    if(d !== 0){
      var op = { id: newOpId(), amount: d, at: L.nowISO ? L.nowISO() : new Date().toISOString(), log: false };
      LG.pending.push(op);
      LG.mem.seen.unshift(op.id);
      LG.expected = xpNum(LG.mem.total);
      writeLedgerCache();
    }
  }
  // 지급 직후(awardXP): 확인된 원장이면 이력 항목에 id 를 달고 대기열에 넣는다. 기기 모드면 아무것도 하지 않는다(게스트 불변).
  function ledgerRecord(entry, amount){
    if(!LG.active || !entry) return;
    entry.id = newOpId();
    LG.pending.push({ id: entry.id, amount: xpNum(amount), reason: entry.reason == null ? '' : String(entry.reason), at: entry.at || null, log: true });
    LG.mem.seen.unshift(entry.id);
    LG.expected += xpNum(amount);
    writeLedgerCache();
    scheduleLedgerSync();
  }

  function ledgerClient(){ var sb = L.sb; return (sb && typeof sb.from === 'function' && sb.auth) ? sb : null; }
  async function readServerXp(sb, uid){
    try {
      var r = await sb.from(LEDGER_TABLE).select('data,rev').eq('user_id', uid).eq('doc_key', LEDGER_DOC).maybeSingle();
      if(r.error) return { error: String(r.error.message || r.error) };
      return { row: r.data || null };
    } catch(e){ return { error: String(e && e.message || e) }; }
  }
  async function writeServerXp(sb, uid, data, rev){
    try {
      var r;
      if(rev == null){
        r = await sb.from(LEDGER_TABLE).insert({ user_id: uid, doc_key: LEDGER_DOC, data: data }).select('data,rev');
        if(r.error) return (r.error.code === '23505') ? { conflict: true } : { error: String(r.error.message || r.error) };
      } else {
        r = await sb.from(LEDGER_TABLE).update({ data: data }).eq('user_id', uid).eq('doc_key', LEDGER_DOC).eq('rev', rev).select('data,rev');
        if(r.error) return { error: String(r.error.message || r.error) };
      }
      var rows = Array.isArray(r.data) ? r.data : (r.data ? [r.data] : []);
      return rows.length ? { row: rows[0] } : { conflict: true };
    } catch(e){ return { error: String(e && e.message || e) }; }
  }
  function refreshXpViews(before){
    if(!LG.mem || xpNum(LG.mem.total) === before) return;
    notifyXpGained(0, LG.mem.total);
    try { if(typeof window !== 'undefined' && typeof window.updateTopBar === 'function') window.updateTopBar(); } catch(e){}
    try { if(typeof L.renderLevelBadge === 'function') L.renderLevelBadge(); } catch(e){}
  }
  async function migrateXp(sb, uid, got){
    var p = currentProfile();
    if(!p || p.id !== uid || !p.settings) return { mode: 'device', why: 'profile-changed' };
    var settings = p.settings;
    var plain = plainXpOf(settings);
    if(!backupBeforeMigration(uid, plain)) return { mode: 'device', why: 'backup-failed' };
    var local = normalizeXpDoc(plain);
    for(var attempt = 0; attempt < 3; attempt++){
      var server = got.row ? normalizeXpDoc(got.row.data) : null;
      var merged = server ? mergeXpDocs(server, local) : local;
      var w = (server && sameXpDoc(server, merged)) ? { row: got.row } : await writeServerXp(sb, uid, merged, got.row ? got.row.rev : null);
      if(w.conflict){ got = await readServerXp(sb, uid); if(got.error) return { mode: 'device', why: 'offline' }; continue; }
      if(w.error) return { mode: 'device', why: 'write-failed', error: w.error };
      var back = await readServerXp(sb, uid);
      if(back.error || !back.row || !sameXpDoc(back.row.data, merged)) return { mode: 'device', why: 'verify-mismatch' };
      var p2 = currentProfile();
      if(!p2 || p2.id !== uid) return { mode: 'device', why: 'profile-changed' };
      var before = xpNum(plainXpOf(p2.settings) && plainXpOf(p2.settings).total);
      var nowPlain = plainXpOf(p2.settings);
      LG.base = normalizeXpDoc(back.row.data);
      LG.rev = back.row.rev;
      LG.pending = [];
      LG.importQ = (nowPlain && !sameXpDoc(nowPlain, local)) ? normalizeXpDoc(nowPlain) : null;
      LG.confirmedAt = new Date().toISOString();
      LG.active = true;
      LG.mode = 'ledger';
      recomputeMem();
      installLedgerView(p2.settings);
      writeLedgerCache();
      if(LG.importQ) scheduleLedgerSync();
      refreshXpViews(before);
      return { mode: 'ledger', migrated: true, total: LG.mem.total, logCount: LG.mem.log.length };
    }
    return { mode: 'device', why: 'conflict' };
  }
  async function pushXp(sb, uid, got){
    for(var attempt = 0; attempt < 3; attempt++){
      captureDrift();
      var server = got.row ? normalizeXpDoc(got.row.data) : null;
      var sent = LG.pending.slice();
      var imp = LG.importQ;
      var next = server || LG.base || normalizeXpDoc(null);
      if(imp) next = mergeXpDocs(next, imp);
      next = applyXpOps(next, sent);
      var row = got.row;
      var wrote = !server || !sameXpDoc(next, server);
      if(wrote){
        var w = await writeServerXp(sb, uid, next, server ? got.row.rev : null);
        if(w.conflict){ got = await readServerXp(sb, uid); if(got.error) return { mode: 'ledger', why: 'offline' }; continue; }
        if(w.error){ LG.lastError = w.error; return { mode: 'ledger', why: 'write-failed', error: w.error }; }
        row = w.row;
      }
      if(LG.uid !== uid) return { mode: 'device', why: 'profile-changed' };
      captureDrift();
      var before = xpNum(LG.mem && LG.mem.total);
      var sentIds = idSet(sent.map(function(op){ return op.id; }));
      LG.pending = LG.pending.filter(function(op){ return !sentIds[op.id]; });
      if(LG.importQ === imp) LG.importQ = null;
      LG.base = normalizeXpDoc(row.data);
      LG.rev = row.rev;
      LG.lastError = null;
      recomputeMem();
      writeLedgerCache();
      refreshXpViews(before);
      return { mode: 'ledger', wrote: wrote, total: LG.mem.total };
    }
    return { mode: 'ledger', why: 'conflict' };
  }
  async function syncLedgerOnce(){
    ensureLedger();
    var uid = LG.uid;
    if(!uid) return { mode: 'none' };
    var sb = ledgerClient();
    if(!sb) return { mode: LG.mode, why: 'no-client' };
    var sess = null;
    try { var g = await sb.auth.getSession(); sess = g && g.data && g.data.session; } catch(e){}
    if(!sess || !sess.user || sess.user.id !== uid){ if(!LG.active) LG.mode = 'device'; return { mode: LG.mode, why: 'no-session' }; }
    var got = await readServerXp(sb, uid);
    if(got.error){ LG.lastError = got.error; return { mode: LG.mode, why: 'offline' }; }
    return LG.active ? pushXp(sb, uid, got) : migrateXp(sb, uid, got);
  }
  function syncLedger(){
    if(LG.syncing){ LG.again = true; return LG.syncing; }
    var run = syncLedgerOnce().catch(function(e){ LG.lastError = String(e && e.message || e); return { mode: LG.mode, why: 'error' }; }).then(function(res){
      LG.syncing = null;
      LG.nextTry = Date.now() + (res && res.why ? 30000 : 0);
      if(LG.again){ LG.again = false; return syncLedger(); }
      return res;
    });
    LG.syncing = run;
    return run;
  }
  function scheduleLedgerSync(){
    if(typeof setTimeout !== 'function' || typeof document === 'undefined') return;
    setTimeout(function(){ if(LG.uid) syncLedger(); }, 0);
  }
  function ledgerTick(){
    ensureLedger();
    if(!LG.uid) return;
    captureDrift();
    if(LG.syncing) return;
    var due = LG.active ? (LG.pending.length > 0 || !!LG.importQ) : true;
    if(due && Date.now() >= LG.nextTry) syncLedger();
  }
  if(typeof window !== 'undefined' && typeof document !== 'undefined' && typeof setInterval === 'function'){
    setInterval(ledgerTick, 5000);
    try { window.addEventListener('online', function(){ LG.nextTry = 0; ledgerTick(); }); } catch(e){}
  }

  // 저장 어댑터: EXP 를 어디에 두는지는 이 함수 하나만 안다.
  // 확인된 원장(로그인 세션 사용자, 이관 확인 뒤)이면 원장 메모리 판, 아니면 옮기기 전과 같은 state.profile.settings.xp.
  // create=true 면 없을 때 { total:0, log:[] } 를 만들어 둔다(옮기기 전 awardXP 머리 두 줄 글자 그대로), false 면 만들지 않고 없으면 null(프로필이 없어도 던지지 않음).
  function xpStore(create){
    ensureLedger();
    if(LG.active && LG.mem){ captureDrift(); return LG.mem; }
    if(!create){
      var s = L.state && L.state.profile && L.state.profile.settings;
      return (s && s.xp) || null;
    }
    if(!L.state.profile.settings.xp) L.state.profile.settings.xp = { total:0, log:[] };
    return L.state.profile.settings.xp;
  }
  function awardXP(amount, reason){
    var xp = xpStore(true);
    var beforeLevel = levelForXP(xp.total);
    xp.total += amount;
    xp.log.unshift({ amount: amount, reason: reason, at: L.nowISO() });
    if(xp.log.length > XP_LOG_MAX) xp.log.length = XP_LOG_MAX;
    ledgerRecord(xp.log[0], amount);
    var leveledUp = levelForXP(xp.total) > beforeLevel;
    if(amount > 0){
      triggerAvatarCelebrationPopup(amount, reason);
    }
    notifyXpGained(amount, xp.total);
    return { total: xp.total, leveledUp: leveledUp };
  }
  // [HOME-19] 경험치가 바뀌면 홈 아바타 진행 링에 알린다(링 갱신 + +N EXP 0.5초 표시)
  function notifyXpGained(amount, total){
    try {
      if(window.OurgoalHomeOneScreen && typeof window.OurgoalHomeOneScreen.onXpGained === 'function'){
        window.OurgoalHomeOneScreen.onXpGained(amount, total);
      }
    } catch(e){}
  }

  // 읽기(만들지 않음): 지금 합계와 레벨 진행 — xp.read 능력
  function readXP(){
    var xp = xpStore(false);
    var total = xp ? xp.total : 0;
    return levelProgress(total);
  }

  // 키트: 아바타 부품 통로(OurgoalAvatarParts, #TASK-ES-389 의 전역) 안의 xp 칸 — 새 전역 이름을 만들지 않는다.
  var AVP = global.OurgoalAvatarParts = global.OurgoalAvatarParts || {};
  var K = AVP.xp = AVP.xp || {};
  K.XP_RULES = XP_RULES;
  K.XP_LOG_MAX = XP_LOG_MAX;
  K.xpForLevel = xpForLevel;
  K.levelForXP = levelForXP;
  K.levelProgress = levelProgress;
  K.triggerAvatarCelebrationPopup = triggerAvatarCelebrationPopup;
  K.awardXP = awardXP;
  K.notifyXpGained = notifyXpGained;
  K.xpStore = xpStore;
  K.readXP = readXP;
  K.CELL = CELL;
  // [#TASK-ES-421] 서버 원장: attachLedger 는 index.html loadProfile 이 부른다. 나머지는 부품 시험(tests/xp-server-ledger-es421.test.js)과 상태 확인용.
  K.attachLedger = attachLedger;
  K.ledger = {
    mergeXpDocs: mergeXpDocs, applyXpOps: applyXpOps, normalizeXpDoc: normalizeXpDoc, sameXpDoc: sameXpDoc,
    sync: syncLedger, tick: ledgerTick,
    status: function(){ return { uid: LG.uid, mode: LG.mode, active: LG.active, confirmedAt: LG.confirmedAt, pending: LG.pending.length, importQueued: !!LG.importQ, rev: LG.rev, total: LG.mem ? LG.mem.total : null, lastError: LG.lastError }; },
    reset: function(){ LG = freshLedger(null); },
    TABLE: LEDGER_TABLE, DOC: LEDGER_DOC, CACHE_PREFIX: LEDGER_CACHE_PREFIX, BACKUP_PREFIX: LEDGER_BACKUP_PREFIX
  };

  var caps = global.OurgoalCapabilities;
  if (!caps && typeof module !== 'undefined' && module.exports && typeof require === 'function') {
    caps = require('../core/capabilities.js');
  }
  if (caps && typeof caps.provide === 'function') {
    caps.provide('xp.award', awardXP, {
      cell: CELL,
      description: 'EXP 를 지급한다(합계 더하기 + 이력 맨 앞에 기록, 200건 상한) — 저장은 로그인 세션 사용자는 서버 원장 user_ledger_docs[xp](기기 사본·대기열 ourgoal_ledger_cache_<uid>), 게스트·세션 없는 로그인은 state.profile.settings.xp(기기). 0 보다 크면 축하 팝업, 홈 링에 알림',
      sideEffect: 'server',
      input: { amount: 'number', reason: 'string' },
      output: { total: 'number', leveledUp: 'boolean' }
    });
    caps.provide('xp.read', readXP, {
      cell: CELL,
      description: '지금 EXP 합계와 레벨 진행(level·xp·into·span·pct)을 읽는다. 저장 칸이 없으면 0 으로 계산하고 만들지 않는다',
      sideEffect: 'none',
      input: null,
      output: { level: 'number', xp: 'number', into: 'number', span: 'number', pct: 'number' }
    });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
