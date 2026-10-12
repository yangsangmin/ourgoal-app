'use strict';
// 저장 실패 조사 — 브라우저 재현 공용 틀(읽기 전용 조사 도구. 제품 파일은 건드리지 않는다).
// - 앱: 조사용 worktree(C:/dev/wt/save-failure-survey, origin/main)를 법정의 정적 서버로 연다. 호스트는 법정 방식(무작위 .test).
// - 브라우저: 법정의 court/lib/chrome.js(시스템 Chrome headless, 바깥 주소는 전부 NOTFOUND). 실서버·실계정과 통신하지 않는다.
// - 연결 라이브러리: 진짜 Supabase 브라우저 묶음(court/vendor/supabase-js-2.115.0.umd.js 또는 --lib 로 준 파일)을 CDN 요청에 대신 준다.
// - 서버: 브라우저 안(CDP Fetch)에서 *.supabase.co 요청을 붙잡아 메모리 안 가짜 서버가 답한다(성공·500·401·응답 없음·통신 거절·지연).
// - 로그인: 임시 브라우저 저장소에 가짜 세션(만료 전)을 심는다(선례: reports/TASK-ES-689/tools/auth-race.cjs).
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const WT = process.env.SF_WT || 'C:/dev/wt/save-failure-survey';
const OUT = path.resolve(__dirname, '..');
const { launch, sleep } = require(path.join(WT, 'court', 'lib', 'chrome.js'));
const server = require(path.join(WT, 'court', 'lib', 'static-server.js'));
const siteHost = require(path.join(WT, 'court', 'lib', 'site-host.js'));
const cfg = JSON.parse(fs.readFileSync(path.join(WT, 'court', 'config.json'), 'utf8'));
const html = fs.readFileSync(path.join(WT, 'index.html'), 'utf8');
const REF = (html.match(/SUPABASE_URL\s*=\s*['"]https?:\/\/([0-9a-z-]+)\./) || [])[1];
const UID = '00000000-0000-4000-8000-000000000001';
const DEFAULT_LIB = path.join(WT, 'court', 'vendor', 'supabase-js-2.115.0.umd.js');
const redact = s => String(s).replace(/eyJ[A-Za-z0-9._-]+/g, '(가림)').split(REF).join('(프로젝트)');

function png(w, h, rgb) { // 작은 진짜 PNG(사진 첨부용)
  const crcT = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcT[n] = c >>> 0; }
  const crc = b => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (t, d) => { const len = Buffer.alloc(4); len.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const raw = Buffer.alloc((w * 3 + 1) * h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const o = y * (w * 3 + 1) + 1 + x * 3; raw[o] = (x * 7 + rgb[0]) & 255; raw[o + 1] = (y * 5 + rgb[1]) & 255; raw[o + 2] = rgb[2]; }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

// ---------- 메모리 안 가짜 서버 ----------
function makeServer() {
  const S = { tables: { users: [], goals: [], checkins: [] }, mode: {}, delayMs: {}, reqs: [], t0: Date.now(), seq: 0 };
  S.setMode = (m, d) => { S.mode = m || {}; S.delayMs = d || {}; };
  // 열쇠 우선순위: '<table>.<read|write>' → '<table>' → 'rest.<read|write>' → 'rest' → 'auth' / 'all'
  S.modeOf = (kind, table, rw) => { const M = S.mode; if (kind === 'rest') return M[table + '.' + rw] || M[table] || M['rest.' + rw] || M.rest || M.all || 'ok'; return M[kind] || M.all || 'ok'; };
  S.delayOf = (kind, table, rw) => { const D = S.delayMs; if (kind === 'rest') return D[table + '.' + rw] || D[table] || D['rest.' + rw] || D.rest || 0; return D[kind] || 0; };
  const match = (row, q) => { for (const [k, v] of q) { if (['select', 'order', 'limit', 'offset', 'on_conflict', 'columns'].includes(k)) continue; const m = /^([a-z]+)\.(.*)$/.exec(v); if (!m) continue; const op = m[1], val = m[2]; const rv = row[k]; if (op === 'eq' && String(rv) !== val) return false; if (op === 'neq' && String(rv) === val) return false; if (op === 'in') { const set = val.replace(/^\(|\)$/g, '').split(',').map(x => x.replace(/^"|"$/g, '')); if (!set.includes(String(rv))) return false; } if (op === 'is' && val === 'null' && rv != null) return false; } return true; };
  S.rest = (method, table, q, headers, body) => {
    const T = S.tables[table] || (S.tables[table] = []);
    const prefer = String(headers.prefer || headers.Prefer || ''), accept = String(headers.accept || headers.Accept || '');
    const rep = /return=representation/.test(prefer);
    if (method === 'GET' || method === 'HEAD') {
      let rows = T.filter(r => match(r, q)).map(r => Object.assign({}, r));
      const order = q.find(x => x[0] === 'order'); if (order) { const [col, dir] = order[1].split('.'); rows.sort((a, b) => (String(a[col] || '') < String(b[col] || '') ? -1 : String(a[col] || '') > String(b[col] || '') ? 1 : 0) * (dir === 'desc' ? -1 : 1)); }
      const lim = q.find(x => x[0] === 'limit'); if (lim) rows = rows.slice(0, Number(lim[1]));
      if (/vnd\.pgrst\.object/.test(accept)) return rows.length === 1 ? { status: 200, json: rows[0] } : { status: 406, json: { code: 'PGRST116', details: 'The result contains ' + rows.length + ' rows', hint: null, message: 'JSON object requested, multiple (or no) rows returned' } };
      return { status: 200, json: rows };
    }
    if (method === 'POST') {
      const rows = Array.isArray(body) ? body : [body]; const merge = /resolution=merge-duplicates/.test(prefer);
      const keyOf = r => (table === 'user_docs' || (r.id === undefined && r.user_id !== undefined && r.doc_key !== undefined)) ? r.user_id + '|' + r.doc_key : r.id;
      const ids = rows.map(keyOf);
      // Postgres 의 알려진 규칙을 흉내: 한 묶음 안에 같은 열쇠가 두 번이면 ON CONFLICT DO UPDATE 가 거절한다(21000). 운영 DB 로 확인한 것은 아니다.
      if (merge && !process.env.SF_ALLOW_DUP && new Set(ids).size !== ids.length) return { status: 500, json: { code: '21000', details: null, hint: 'Ensure that no rows proposed for insertion within the same command have duplicate constrained values.', message: 'ON CONFLICT DO UPDATE command cannot affect row a second time' } };
      const outRows = [];
      for (const r of rows) {
        const k = keyOf(r); const i = T.findIndex(x => keyOf(x) === k && k !== undefined);
        if (i >= 0) { if (!merge) return { status: 409, json: { code: '23505', details: 'Key already exists.', hint: null, message: 'duplicate key value violates unique constraint "' + table + '_pkey"' } }; T[i] = Object.assign({}, T[i], r); outRows.push(T[i]); }
        else { const nr = Object.assign({ created_at: new Date().toISOString() }, r); if (nr.rev === undefined && nr.doc_key !== undefined) nr.rev = 1; T.push(nr); outRows.push(nr); }
      }
      return rep ? { status: 201, json: outRows } : { status: 201, json: null };
    }
    if (method === 'PATCH') { const hit = T.filter(r => match(r, q)); hit.forEach(r => { Object.assign(r, body); if (typeof r.rev === 'number') r.rev++; }); return rep ? { status: 200, json: hit } : { status: 204, json: null }; }
    if (method === 'DELETE') { const keep = T.filter(r => !match(r, q)); const gone = T.length - keep.length; S.tables[table] = keep; return rep ? { status: 200, json: [] } : { status: 204, json: null, gone }; }
    return { status: 405, json: { message: 'method not allowed' } };
  };
  return S;
}

function seedScript(REF, UID, seed) { // 페이지가 뜨기 전: 가짜 세션 심기 + 알림 글 관찰(읽기만)
  var sf = window.__sf = { t0: Date.now(), toasts: [], errors: [] };
  if (seed) {
    try {
      var b64 = function (o) { return btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_'); };
      var now = Math.floor(Date.now() / 1000);
      var tok = b64({ alg: 'HS256', typ: 'JWT' }) + '.' + b64({ sub: UID, aud: 'authenticated', role: 'authenticated', exp: now + 86400, iat: now - 3600, email: 'probe@example.invalid' }) + '.c2lnbmF0dXJlLW5vdC1yZWFs';
      var sess = { access_token: tok, token_type: 'bearer', expires_in: 86400, expires_at: now + 86400, refresh_token: 'probe-refresh-token', user: { id: UID, aud: 'authenticated', role: 'authenticated', email: 'probe@example.invalid', app_metadata: { provider: 'email' }, user_metadata: {}, created_at: new Date().toISOString() } };
      if (!localStorage.getItem('sb-' + REF + '-auth-token')) localStorage.setItem('sb-' + REF + '-auth-token', JSON.stringify(sess));
      sf.seeded = true;
    } catch (e) { sf.errors.push('seed:' + (e && e.message)); }
  }
  var hook = function () {
    var el = document.getElementById('toast'); if (!el || sf.toastHooked) return !!sf.toastHooked;
    sf.toastHooked = true; var last = '';
    var rec = function () { var sig = (el.classList.contains('show') ? '1' : '0') + '|' + el.textContent; if (sig === last) return; last = sig; sf.toasts.push({ ms: Date.now() - sf.t0, at: Date.now(), show: el.classList.contains('show'), text: (el.textContent || '').slice(0, 160) }); };
    new MutationObserver(rec).observe(el, { attributes: true, childList: true, characterData: true, subtree: true });
    return true;
  };
  document.addEventListener('DOMContentLoaded', hook); var iv = setInterval(function () { if (hook()) clearInterval(iv); }, 50);
}

function snapFn(UID, marks) { // 화면·기기 상태 읽기(읽기만)
  var S = window.OurgoalAppScope && window.OurgoalAppScope.scope, st = S && S.state, p = st && st.profile, out = {};
  var q = function (s) { return document.querySelector(s); };
  var vis = function (el) { try { if (!el) return null; var r = el.getBoundingClientRect(), cs = getComputedStyle(el); return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0; } catch (e) { return 'err'; } };
  out.at = Date.now(); out.online = navigator.onLine;
  out.screen = { landing: vis(q('#landingScreen')), auth: vis(q('#authScreen')), nav: vis(q('.navbtn[data-tab="home"]')), activeTab: (q('.navbtn.active') || { dataset: {} }).dataset.tab || null };
  var t = q('#toast'); out.toastNow = t ? { show: t.classList.contains('show'), text: (t.textContent || '').slice(0, 160) } : null;
  out.toasts = (window.__sf && window.__sf.toasts || []).slice(-12);
  var ci = q('#captureInput'), cb = q('#captureSave');
  out.input = ci ? { value: ci.value, placeholder: ci.placeholder } : null;
  out.btn = cb ? { text: (cb.textContent || '').replace(/\s+/g, ' ').trim(), disabled: !!cb.disabled } : null;
  out.photoPreviewVisible = vis(q('#capturePhotoPreview'));
  var xp = null; try { xp = p && p.settings && p.settings.xp ? p.settings.xp.total : null; } catch (e) { xp = 'err'; }
  out.profile = p ? { isProbeUser: p.id === UID, idKind: String(p.id).slice(0, 6), nRecords: (p.records || []).length, nGoals: (p.goals || []).length, xp: xp,
    goals: (p.goals || []).slice(0, 8).map(function (g) { return { id: String(g.id).slice(0, 14), title: String(g.title || '').slice(0, 30) }; }),
    recs: (p.records || []).slice(0, 8).map(function (r) { return { id: String(r.id).slice(0, 14), type: r.type, text: String(r.text || '').slice(0, 40), photo: r.photo ? String(r.photo).slice(0, 22) + '…(' + String(r.photo).length + ')' : null, feedback: r.feedback ? (r.feedback.verdict || 'obj') : null, energy: r.energy === undefined ? null : r.energy, focus: r.focus === undefined ? null : r.focus, goalId: r.goalId || null }; }) } : null;
  var cards = Array.prototype.slice.call(document.querySelectorAll('.rec-card[data-recid]'));
  out.cards = { total: cards.length, visible: cards.filter(vis).length, list: cards.slice(0, 8).map(function (c) { return { id: String(c.getAttribute('data-recid')).slice(0, 14), visible: vis(c), text: ((c.querySelector('.rec-text') || {}).textContent || '').slice(0, 40), hasPhotoImg: !!c.querySelector('img[src^="data:image"]'), cardText: (c.innerText || '').replace(/\s+/g, ' ').slice(0, 200) }; }) };
  out.marks = {}; (marks || []).forEach(function (m) {
    var inState = p ? (p.records || []).filter(function (r) { return String(r.text || '').indexOf(m) >= 0; }).length : null;
    var inGoals = p ? (p.goals || []).filter(function (g) { return String(g.title || '').indexOf(m) >= 0; }).length : null;
    var inCards = cards.filter(function (c) { return (c.textContent || '').indexOf(m) >= 0; }).length;
    var inCardsVisible = cards.filter(function (c) { return (c.textContent || '').indexOf(m) >= 0 && vis(c); }).length;
    var body = (document.body.innerText || ''); var inBodyText = body.split(m).length - 1;
    var ls = {}; for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (/^sb-/.test(k)) continue; var v = localStorage.getItem(k) || ''; if (v.indexOf(m) >= 0) ls[k.replace(UID, '<uid>')] = v.split(m).length - 1; }
    out.marks[m] = { inStateRecords: inState, inStateGoals: inGoals, inCards: inCards, inCardsVisible: inCardsVisible, inBodyText: inBodyText, inLocalStorage: ls };
  });
  out.ls = {}; for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); var v = localStorage.getItem(k) || ''; out.ls[/^sb-/.test(k) ? '(세션 열쇠)' : k.replace(UID, '<uid>')] = v.length; }
  var bk = null; try { bk = JSON.parse(localStorage.getItem('ourgoal_records_backup_' + UID) || 'null'); } catch (e) { bk = 'parse-error'; }
  out.backup = Array.isArray(bk) ? { n: bk.length, recs: bk.slice(0, 8).map(function (r) { return { id: String(r.id).slice(0, 14), text: String(r.text || '').slice(0, 40), photo: !!r.photo, feedback: !!r.feedback, energy: r.energy === undefined ? null : r.energy, focus: r.focus === undefined ? null : r.focus }; }) } : bk;
  var full = null; try { full = JSON.parse(localStorage.getItem('ourgoal_guest_profile') || 'null'); } catch (e) { full = 'parse-error'; }
  out.fullCopy = full && full.records ? { ownerIsProbe: full.id === UID, n: full.records.length, recs: full.records.slice(0, 8).map(function (r) { return { id: String(r.id).slice(0, 14), text: String(r.text || '').slice(0, 40), photo: !!r.photo, feedback: !!r.feedback }; }) } : full;
  var que = null; try { que = JSON.parse(localStorage.getItem('ourgoal_offline_sync_queue') || 'null'); } catch (e) { que = 'parse-error'; }
  out.queue = Array.isArray(que) ? que.length : que;
  out.openLayers = Array.prototype.slice.call(document.querySelectorAll('.modal, .modal-backdrop, .sheet, .bottom-sheet, [role="dialog"], .overlay, #checkinAiSheetBackdrop, .modal-overlay.active')).filter(function (m) { return vis(m); }).map(function (m) { return (m.id || m.className || '').toString().slice(0, 50) + ' :: ' + (m.innerText || '').replace(/\s+/g, ' ').slice(0, 70); }).slice(0, 6);
  return out;
}

async function open(opts) {
  const o = opts || {};
  const libPath = o.lib || DEFAULT_LIB, libSrc = fs.readFileSync(libPath, 'utf8');
  const S = o.server || makeServer();
  const srv = await server.start(WT, cfg.denyServePrefixes || []);
  const siteUrl = siteHost.siteUrlFor(siteHost.pickSiteHost(cfg), srv.port);
  const browser = await launch({ allowHosts: [], siteOrigin: siteUrl, locale: cfg.locale, viewport: { width: 430, height: 932 } });
  const page = browser.page; const t0 = Date.now();
  const con = [], exc = [], hung = [];
  await page.send('Page.enable'); await page.send('Runtime.enable'); await page.send('Network.enable');
  page.on('Runtime.exceptionThrown', p => { const d = p && p.exceptionDetails; exc.push({ ms: Date.now() - t0, text: redact(String((d && d.exception && d.exception.description) || (d && d.text) || 'exception').split('\n')[0].slice(0, 240)) }); });
  page.on('Runtime.consoleAPICalled', p => { if (!p) return; if (!['error', 'warning', 'warn'].includes(p.type) && !o.allConsole) return; con.push({ ms: Date.now() - t0, type: p.type, text: redact((p.args || []).map(a => (a.value !== undefined ? (typeof a.value === 'string' ? a.value : JSON.stringify(a.value)) : (a.description || a.type || ''))).join(' ').slice(0, 300)) }); });
  const CORS = h => [{ name: 'Access-Control-Allow-Origin', value: '*' }, { name: 'Access-Control-Allow-Methods', value: 'GET,POST,PATCH,PUT,DELETE,OPTIONS,HEAD' }, { name: 'Access-Control-Allow-Headers', value: (h && (h['Access-Control-Request-Headers'] || h['access-control-request-headers'])) || 'authorization,apikey,content-type,prefer,x-client-info,accept-profile,content-profile,x-supabase-api-version' }, { name: 'Access-Control-Expose-Headers', value: 'Content-Range' }, { name: 'Access-Control-Max-Age', value: '600' }];
  const fulfill = (id, status, json, h, ctype) => { const body = json === null || json === undefined ? '' : (typeof json === 'string' ? json : JSON.stringify(json)); const headers = CORS(h).concat(body ? [{ name: 'Content-Type', value: ctype || 'application/json; charset=utf-8' }] : []); return page.send('Fetch.fulfillRequest', { requestId: id, responseCode: status, responseHeaders: headers, body: Buffer.from(body, 'utf8').toString('base64') }).catch(() => {}); };
  page.on('Fetch.requestPaused', async param => {
    const rq = param.request, url = rq.url, id = param.requestId;
    try {
      // SF_FAIL_LIB=1 이면 연결 라이브러리를 못 받는 상황(CDN 실패)을 만든다 → 앱의 서버 연결(sb)이 null
      if (process.env.SF_FAIL_LIB && /^https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js/.test(url)) { S.reqs.push({ n: ++S.seq, ms: Date.now() - t0, method: 'GET', kind: 'cdn', table: 'supabase-js', answered: '통신 거절(라이브러리를 못 받음)' }); return page.send('Fetch.failRequest', { requestId: id, errorReason: 'ConnectionFailed' }).catch(() => {}); }
      if (/^https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js/.test(url)) return page.send('Fetch.fulfillRequest', { requestId: id, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'application/javascript; charset=utf-8' }, { name: 'Access-Control-Allow-Origin', value: '*' }], body: Buffer.from(libSrc, 'utf8').toString('base64') }).catch(() => {});
      const U = new URL(url);
      if (!/\.supabase\.co$/.test(U.hostname)) return page.send('Fetch.continueRequest', { requestId: id }).catch(() => {});
      const method = rq.method, seg = U.pathname.split('/').filter(Boolean); // rest/v1/<table> | auth/v1/<x> | storage/v1/... | functions/v1/...
      const kind = seg[0] || '?', table = kind === 'rest' ? (seg[2] === 'rpc' ? 'rpc:' + seg[3] : seg[2]) : seg.slice(2).join('/');
      if (method === 'OPTIONS') { S.reqs.push({ n: ++S.seq, ms: Date.now() - t0, method, kind, table, preflight: true }); return fulfill(id, 204, null, rq.headers); }
      let body = null; if (rq.hasPostData) { let pd = rq.postData; if (pd === undefined) { try { const g = await page.send('Fetch.getRequestPostData', { requestId: id }); pd = g.base64Encoded ? Buffer.from(g.postData, 'base64').toString('utf8') : g.postData; } catch (_) { pd = null; } } try { body = pd ? JSON.parse(pd) : null; } catch (_) { body = pd; } }
      const rw = (method === 'GET' || method === 'HEAD') ? 'read' : 'write';
      const mode = S.modeOf(kind, table, rw), delay = S.delayOf(kind, table, rw);
      const entry = { n: ++S.seq, ms: Date.now() - t0, method, kind, table, rw, mode, delayMs: delay || undefined, query: redact(U.search).slice(0, 200) || undefined, prefer: rq.headers.Prefer || rq.headers.prefer || undefined,
        rows: Array.isArray(body) ? body.length : (body && typeof body === 'object' ? 1 : undefined), ids: Array.isArray(body) ? body.map(r => String(r && r.id).slice(0, 14)).slice(0, 12) : undefined,
        keys: Array.isArray(body) && body[0] ? Object.keys(body[0]).join(',') : (body && typeof body === 'object' && kind === 'rest' ? Object.keys(body).join(',') : undefined) };
      S.reqs.push(entry);
      if (delay) await sleep(delay);
      if (mode === 'hang') { hung.push(id); entry.answered = '응답 없음(붙잡아 둠)'; return; }
      if (mode === 'netfail') { entry.answered = '통신 거절(InternetDisconnected)'; return page.send('Fetch.failRequest', { requestId: id, errorReason: 'InternetDisconnected' }).catch(() => {}); }
      if (mode === '500') { entry.answered = 500; return fulfill(id, 500, { code: 'XX000', details: null, hint: null, message: 'Internal Server Error' }, rq.headers); }
      if (mode === '500html') { entry.answered = '500(html)'; return fulfill(id, 500, '<html><body><h1>500 Internal Server Error</h1></body></html>', rq.headers, 'text/html; charset=utf-8'); }
      if (mode === '503') { entry.answered = 503; return fulfill(id, 503, 'upstream connect error or disconnect/reset before headers', rq.headers, 'text/plain; charset=utf-8'); }
      if (mode === '401') { entry.answered = 401; return fulfill(id, 401, kind === 'auth' ? { code: 403, error_code: 'bad_jwt', msg: 'invalid JWT: unable to parse or verify signature, token is expired' } : { code: 'PGRST301', details: null, hint: null, message: 'JWT expired' }, rq.headers); }
      if (kind === 'rest') { const r = S.rest(method, table, Array.from(U.searchParams.entries()), rq.headers, body); entry.answered = r.status; if (r.json && r.json.code) entry.answerCode = r.json.code; return fulfill(id, r.status, r.json, rq.headers); }
      if (kind === 'auth') {
        const user = { id: UID, aud: 'authenticated', role: 'authenticated', email: 'probe@example.invalid', app_metadata: { provider: 'email' }, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' };
        if (seg[2] === 'user') { entry.answered = 200; return fulfill(id, 200, user, rq.headers); }
        if (seg[2] === 'logout') { entry.answered = 204; return fulfill(id, 204, null, rq.headers); }
        entry.answered = '400(가짜 서버가 모르는 인증 요청)'; return fulfill(id, 400, { code: 400, error_code: 'validation_failed', msg: 'not simulated' }, rq.headers);
      }
      entry.answered = 404; return fulfill(id, 404, { message: 'not simulated' }, rq.headers);
    } catch (e) { S.reqs.push({ n: ++S.seq, ms: Date.now() - t0, harnessError: String(e && e.message) }); page.send('Fetch.failRequest', { requestId: id, errorReason: 'Failed' }).catch(() => {}); }
  });
  await page.send('Fetch.enable', { patterns: [{ urlPattern: 'https://*.supabase.co/*' }, { urlPattern: 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js*' }] });
  const seedId = (await page.send('Page.addScriptToEvaluateOnNewDocument', { source: 'if (window.top === window) { (' + seedScript.toString() + ')(' + JSON.stringify(REF) + ',' + JSON.stringify(UID) + ',' + JSON.stringify(o.seedSession !== false) + '); }' })).identifier;
  const ev = async (expr, timeout) => { const r = await page.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, timeout || 30000); if (r.exceptionDetails) throw new Error('페이지 평가 오류: ' + ((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text || '').slice(0, 300)); return r.result.value; };
  const H = { S, page, srv, siteUrl, con, exc, t0, UID, REF, libPath, sleep, ev,
    ms: () => Date.now() - t0,
    async nav() { const loaded = new Promise(res => { page.on('Page.loadEventFired', () => res()); setTimeout(res, 25000); }); await page.send('Page.navigate', { url: siteUrl + '/index.html' }); await loaded; },
    async reload() { let done = null; const loaded = new Promise(res => { done = res; setTimeout(res, 25000); }); page.on('Page.loadEventFired', () => done()); await page.send('Page.reload', { ignoreCache: true }); await loaded; },
    async waitFor(expr, timeout, step) { const end = Date.now() + (timeout || 15000); for (;;) { let v = null; try { v = await ev(expr, 8000); } catch (_) { v = null; } if (v) return v; if (Date.now() > end) return null; await sleep(step || 150); } },
    waitEntered(timeout) { return H.waitFor('(function(){var S=window.OurgoalAppScope&&window.OurgoalAppScope.scope;var el=document.querySelector(\'.navbtn[data-tab="home"]\');var ls=document.getElementById("landingScreen");return !!(S&&S.state&&S.state.profile&&el&&el.getBoundingClientRect().width>0&&(!ls||getComputedStyle(ls).display==="none"));})()', timeout || 20000); },
    snap(marks) { return ev('JSON.stringify((' + snapFn.toString() + ')(' + JSON.stringify(UID) + ',' + JSON.stringify(marks || []) + '))').then(JSON.parse); },
    async shot(name) { try { const r = await page.send('Page.captureScreenshot', { format: 'png' }, 20000); const f = path.join(OUT, 'shots', name + '.png'); fs.writeFileSync(f, Buffer.from(r.data, 'base64')); return 'shots/' + name + '.png'; } catch (e) { return '사진 실패: ' + e.message; } },
    async rect(sel) { return ev('(function(){var el=document.querySelector(' + JSON.stringify(sel) + ');if(!el)return null;el.scrollIntoView({block:"center"});var r=el.getBoundingClientRect();var x=r.left+r.width/2,y=r.top+r.height/2;var hit=document.elementFromPoint(x,y);return {x:x,y:y,w:r.width,h:r.height,hitSelf:!!hit&&(hit===el||el.contains(hit)),hit:hit?((hit.id?"#"+hit.id:"")+"."+String(hit.className).slice(0,40)):null,disabled:!!el.disabled};})()'); },
    async click(sel) { const r = await H.rect(sel); if (!r) return { ok: false, why: '요소 없음' }; await page.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: r.x, y: r.y, button: 'left', clickCount: 1 }); await page.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: r.x, y: r.y, button: 'left', clickCount: 1 }); return { ok: true, at: Date.now(), ms: Date.now() - t0, hitSelf: r.hitSelf, hit: r.hit, disabledBefore: r.disabled }; },
    async type(sel, text) { await ev('(function(){var el=document.querySelector(' + JSON.stringify(sel) + ');if(!el)return false;el.scrollIntoView({block:"center"});el.focus();return true;})()'); await page.send('Input.insertText', { text }); },
    async setFile(sel, file) { const doc = await page.send('DOM.getDocument', {}); const n = await page.send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: sel }); await page.send('DOM.setFileInputFiles', { nodeId: n.nodeId, files: [file] }); },
    async dropSeed() { try { await page.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: seedId }); await page.send('Page.addScriptToEvaluateOnNewDocument', { source: 'if (window.top === window) { (' + seedScript.toString() + ')(' + JSON.stringify(REF) + ',' + JSON.stringify(UID) + ',false); }' }); } catch (_) { /* 무시 */ } },
    async closeAiSheet() { // 떠 있는 공용 창(#modalOverlay — 체크인 AI 코칭 등)을 사용자가 하듯 × 로 닫는다. 닫은 창의 첫 글을 돌려준다
      const info = await ev('(function(){var o=document.getElementById("modalOverlay");if(!o||!o.classList.contains("active"))return null;var sh=document.getElementById("modalSheet");var els=Array.prototype.slice.call(sh.querySelectorAll("button,span,div")).filter(function(e){var t=(e.textContent||"").trim();return (t==="×"||t==="✕"||t==="X")&&e.getBoundingClientRect().width>0;});var b=els[els.length-1];var r=b?b.getBoundingClientRect():null;return JSON.stringify({title:(sh.innerText||"").replace(/s+/g," ").slice(0,60),x:r?r.left+r.width/2:null,y:r?r.top+r.height/2:null});})()');
      if (!info) return false; const o = JSON.parse(info);
      if (o.x !== null) { await page.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: o.x, y: o.y, button: 'left', clickCount: 1 }); await page.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: o.x, y: o.y, button: 'left', clickCount: 1 }); }
      await sleep(600); const still = await ev('(function(){var o=document.getElementById("modalOverlay");return !!o&&o.classList.contains("active");})()');
      if (still) { await ev('(function(){var S=window.OurgoalAppScope.scope;if(typeof S.closeModal==="function")S.closeModal();else document.getElementById("modalOverlay").classList.remove("active");})()'); await sleep(500); return o.title + ' (× 로 안 닫혀 closeModal 을 직접 불렀다)'; }
      return o.title;
    },
    async closeModals() { const done = []; for (let i = 0; i < 4; i++) { const t = await H.closeAiSheet(); if (!t) break; done.push(String(t).replace(/s+/g, ' ').slice(0, 70)); await sleep(500); } return done; }, // 차례로 뜨는 창을 모두 닫고 닫은 창 목록을 돌려준다
    reseed() { return ev('(' + seedScript.toString() + ')(' + JSON.stringify(REF) + ',' + JSON.stringify(UID) + ',true); true'); }, // 다시 로그인한 것을 흉내: 가짜 세션을 다시 심는다(그 뒤 새로 고침)
    releaseHung(how) { const ids = hung.splice(0); return Promise.all(ids.map(id => how === 'fail' ? page.send('Fetch.failRequest', { requestId: id, errorReason: 'TimedOut' }).catch(() => {}) : page.send('Fetch.fulfillRequest', { requestId: id, responseCode: 201, responseHeaders: CORS(null), body: '' }).catch(() => {}))).then(() => ids.length); },
    serverView() { const c = S.tables.checkins || [], g = S.tables.goals || []; return { nCheckins: c.length, checkins: c.slice(-10).map(r => ({ id: String(r.id).slice(0, 14), text: String(r.text || '').slice(0, 40), keys: Object.keys(r).join(',') })), nGoals: g.length, goals: g.slice(-10).map(r => ({ id: String(r.id).slice(0, 14), title: String(r.title || '').slice(0, 30) })), otherTables: Object.keys(S.tables).filter(k => !['users', 'goals', 'checkins'].includes(k)).map(k => k + ':' + S.tables[k].length) }; },
    reqsSince(n) { return S.reqs.filter(r => r.n > n && !r.preflight); },
    async close() { try { await browser.close(); } catch (_) { /* 무시 */ } try { await srv.close(); } catch (_) { /* 무시 */ } },
  };
  H.chrome = browser.version;
  return H;
}

function userRow() { return { id: UID, username: 'probe@example.invalid', display_name: '조사용', bio: null, avatar_url: null, interests: [], region: null, region_public: false, saved_avatars: [], trash: [], created_at: '2026-01-01T00:00:00Z' }; }
function oldRows(n) { const a = []; for (let i = 1; i <= n; i++) a.push({ id: 'old-' + i, user_id: UID, type: 'note', text: '옛기록' + i, start_at: '2026-10-0' + i + 'T01:00:00+00:00', end_at: '2026-10-0' + i + 'T01:00:00+00:00', created_at: '2026-10-0' + i + 'T01:00:00+00:00', category: null, theme: 'daily', sub_theme: null, theme_confidence: 0.5, meta: { visibility: 'private' }, deleted_at: null }); return a; }
function save(name, obj) { const f = path.join(OUT, 'raw', name + '.json'); fs.writeFileSync(f, JSON.stringify(obj, null, 1) + '\n', { encoding: 'utf8' }); return 'raw/' + name + '.json'; }
function libInfo(p) { const src = fs.readFileSync(p); return { file: path.basename(p), bytes: src.length, sha256: require('crypto').createHash('sha256').update(src).digest('hex'), versionInFile: ((src.toString('utf8').match(/supabase-js[-\/@]([0-9]+\.[0-9]+\.[0-9]+)/) || [])[1]) || ((src.toString('utf8').match(/version\s*=\s*["'](2\.[0-9]+\.[0-9]+)["']/) || [])[1]) || null }; }

module.exports = { open, makeServer, userRow, oldRows, save, libInfo, png, sleep, UID, REF, OUT, WT, DEFAULT_LIB, redact };
