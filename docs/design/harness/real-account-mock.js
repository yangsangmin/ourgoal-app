'use strict';
/* TASK-ES-355 실계정 하네스의 mock 모드 — 배선 점검 전용. 실계정 확인이 아니다.
 * 두 브라우저(컨텍스트)가 노드 쪽 메모리 서버 하나를 공유하도록 가짜 Supabase 를 주입한다.
 * 페이지 안 가짜 클라이언트는 모든 auth·from·rpc 호출을 page.exposeFunction('__ogMockDb') 로 노드에 넘긴다.
 * 외부 주소는 모두 막는다(로컬 정적 서버만). 결과 파일에는 mode:"mock" 이 찍힌다.
 */
const http = require('http'), fs = require('fs'), path = require('path');

const MOCK_HOST = 'ogmock.test';
const MOCK_ACCOUNTS = {
  A: { label: 'A', email: 'ogtest-a@mock.local', password: 'mock-only', id: 'aaaaaaaa-0355-4355-8355-00000000000a', nick: 'ogtest-a' },
  B: { label: 'B', email: 'ogtest-b@mock.local', password: 'mock-only', id: 'bbbbbbbb-0355-4355-8355-00000000000b', nick: 'ogtest-b' }
};

/* 페이지에 주입하는 가짜 supabase-js. 상태는 노드 쪽 서버에만 있다. */
const MOCK_CLIENT_JS = `
(function(){
  var KEY = 'og_mock_session';
  function call(msg){ return window.__ogMockDb(JSON.stringify(msg)).then(function(t){ return JSON.parse(t); }); }
  function sess(){ try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch(e){ return null; } }
  var listeners = [];
  function emit(ev, s){ listeners.forEach(function(f){ try { f(ev, s); } catch(e){} }); }
  function builder(table){
    var q = { table: table, op: 'select', filters: [], rows: null, patch: null, single: false, head: false, count: null, onConflict: null };
    var b = {};
    ['order','limit','range','not','or','filter','textSearch','contains','match','returns','abortSignal'].forEach(function(m){ b[m] = function(){ return b; }; });
    b.select = function(cols, opt){ if(opt && opt.head) q.head = true; if(opt && opt.count) q.count = opt.count; if(q.op === 'select') q.op = 'select'; else q.returning = true; return b; };
    ['eq','neq','gt','gte','lt','lte','is','ilike','like','in'].forEach(function(m){ b[m] = function(k, v){ q.filters.push([m, k, v]); return b; }; });
    b.insert = function(r){ q.op = 'insert'; q.rows = Array.isArray(r) ? r : [r]; return b; };
    b.upsert = function(r){ q.op = 'upsert'; q.rows = Array.isArray(r) ? r : [r]; return b; };
    b.update = function(p){ q.op = 'update'; q.patch = p; return b; };
    b.delete = function(){ q.op = 'delete'; return b; };
    b.single = function(){ q.single = true; return b; };
    b.maybeSingle = function(){ q.single = true; return b; };
    b.then = function(res, rej){ var s = sess(); q.uid = s && s.user ? s.user.id : null; return call({ kind: 'query', q: q }).then(res, rej); };
    b.catch = function(rej){ return b.then(null, rej); };
    return b;
  }
  var ch = { on: function(){ return ch; }, subscribe: function(cb){ try { cb && cb('SUBSCRIBED'); } catch(e){} return ch; }, send: function(){ return Promise.resolve('ok'); }, unsubscribe: function(){ return Promise.resolve('ok'); } };
  var client = {
    auth: {
      getSession: function(){ return Promise.resolve({ data: { session: sess() }, error: null }); },
      getUser: function(){ var s = sess(); if(!s) return Promise.resolve({ data: { user: null }, error: null }); return call({ kind: 'getUser', id: s.user.id }); },
      onAuthStateChange: function(f){ listeners.push(f); return { data: { subscription: { unsubscribe: function(){} } } }; },
      signInWithPassword: function(c){ return call({ kind: 'signIn', email: c.email, password: c.password }).then(function(r){ if(r.data && r.data.session){ localStorage.setItem(KEY, JSON.stringify(r.data.session)); emit('SIGNED_IN', r.data.session); } return r; }); },
      signOut: function(){ localStorage.removeItem(KEY); emit('SIGNED_OUT', null); return Promise.resolve({ error: null }); },
      updateUser: function(p){ var s = sess(); return call({ kind: 'updateUser', id: s && s.user.id, data: (p && p.data) || {} }); },
      signInWithOAuth: function(){ return Promise.resolve({ data: {}, error: { message: 'mock: oauth blocked' } }); },
      signUp: function(){ return Promise.resolve({ data: {}, error: { message: 'mock: signup blocked' } }); },
      resetPasswordForEmail: function(){ return Promise.resolve({ data: {}, error: null }); },
      refreshSession: function(){ return Promise.resolve({ data: { session: sess() }, error: null }); }
    },
    from: builder,
    rpc: function(name, args){ return call({ kind: 'rpc', name: name, args: args || {} }); },
    channel: function(){ return ch; },
    removeChannel: function(){ return Promise.resolve('ok'); },
    removeAllChannels: function(){ return Promise.resolve([]); },
    storage: { from: function(){ return { upload: function(){ return Promise.resolve({ data: null, error: { message: 'mock' } }); }, getPublicUrl: function(){ return { data: { publicUrl: '' } }; } }; } }
  };
  window.supabase = { createClient: function(){ return client; } };
})();
`;

/* 노드 쪽 공유 메모리 서버 */
function createMockServer(){
  const tables = {};
  const users = {};
  Object.values(MOCK_ACCOUNTS).forEach((a) => { users[a.email] = { id: a.id, email: a.email, password: a.password, user_metadata: {}, app_metadata: {} }; });
  const log = [];
  const T = (n) => (tables[n] = tables[n] || []);
  const match = (row, f) => f.every(([m, k, v]) => {
    const x = row[k];
    if (m === 'eq') return String(x) === String(v);
    if (m === 'neq') return String(x) !== String(v);
    if (m === 'is') return v === null ? (x === null || x === undefined) : x === v;
    if (m === 'in') return Array.isArray(v) && v.map(String).includes(String(x));
    if (m === 'ilike' || m === 'like') { const re = new RegExp('^' + String(v).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*') + '$', m === 'ilike' ? 'i' : ''); return re.test(String(x == null ? '' : x)); }
    if (m === 'gt') return x > v; if (m === 'gte') return x >= v; if (m === 'lt') return x < v; if (m === 'lte') return x <= v;
    return true;
  });
  function handle(msg){
    if (msg.kind === 'signIn') {
      const u = users[String(msg.email || '').toLowerCase()];
      log.push({ kind: 'signIn', who: u ? u.id : null });
      if (!u || u.password !== msg.password) return { data: { user: null, session: null }, error: { message: 'Invalid login credentials' } };
      const user = { id: u.id, email: u.email, user_metadata: u.user_metadata, app_metadata: u.app_metadata };
      return { data: { user, session: { access_token: 'mock-' + u.id, user } }, error: null };
    }
    if (msg.kind === 'getUser') { const u = Object.values(users).find((x) => x.id === msg.id); return { data: { user: u ? { id: u.id, email: u.email, user_metadata: u.user_metadata, app_metadata: u.app_metadata } : null }, error: null }; }
    if (msg.kind === 'updateUser') { const u = Object.values(users).find((x) => x.id === msg.id); if (u) Object.assign(u.user_metadata, msg.data); return { data: { user: u || null }, error: null }; }
    if (msg.kind === 'rpc') {
      log.push({ kind: 'rpc', name: msg.name });
      if (msg.name === 'search_users_by_nickname') {
        const q = String(msg.args.p_query || '').toLowerCase();
        return { data: T('users').filter((r) => String(r.display_name || '').toLowerCase().includes(q)).map((r) => ({ id: r.id, display_name: r.display_name, username: r.username, avatar_url: r.avatar_url || '' })), error: null };
      }
      return { data: null, error: null };
    }
    const q = msg.q; const rows = T(q.table);
    log.push({ kind: q.op, table: q.table, by: q.uid, n: q.rows ? q.rows.length : undefined });
    if (q.op === 'insert' || q.op === 'upsert') {
      let err = null;
      q.rows.forEach((r) => {
        const i = r.id !== undefined ? rows.findIndex((x) => String(x.id) === String(r.id)) : -1;
        if (i >= 0 && q.op === 'insert') err = { code: '23505', message: 'duplicate key value violates unique constraint' };
        else if (i >= 0) rows[i] = Object.assign({}, rows[i], r);
        else rows.push(JSON.parse(JSON.stringify(r)));
      });
      return { data: q.returning ? q.rows : null, error: err };
    }
    const hit = rows.filter((r) => match(r, q.filters));
    if (q.op === 'update') { hit.forEach((r) => Object.assign(r, q.patch)); return { data: q.returning ? hit : null, error: null }; }
    if (q.op === 'delete') { tables[q.table] = rows.filter((r) => !hit.includes(r)); return { data: q.returning ? hit : null, error: null, count: hit.length }; }
    const data = q.head ? null : (q.single ? (hit[0] || null) : hit);
    return { data, error: null, count: hit.length };
  }
  return { handle: (t) => JSON.stringify(handle(JSON.parse(t))), tables, log };
}

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
function serveStatic(dir){
  return new Promise((res) => {
    const srv = http.createServer((req, rsp) => {
      let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
      const f = path.join(dir, p);
      if (!f.startsWith(dir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rsp.writeHead(404); return rsp.end(); }
      rsp.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(rsp);
    }).listen(0, '127.0.0.1', () => res(srv));
  });
}

/* mock 페이지 준비: 가짜 supabase 주입 + 외부 차단 + 공유 서버 연결 */
async function prepareMockPage(page, server){
  await page.exposeFunction('__ogMockDb', (t) => server.handle(t));
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const u = req.url();
    if (/supabase-js/.test(u)) return req.respond({ status: 200, contentType: 'text/javascript', body: MOCK_CLIENT_JS });
    if (u.startsWith('http://' + MOCK_HOST + ':') || /^data:|^blob:/.test(u)) return req.continue();
    return req.respond({ status: 204, body: '' });
  });
}

module.exports = { MOCK_HOST, MOCK_ACCOUNTS, MOCK_CLIENT_JS, createMockServer, serveStatic, prepareMockPage };
