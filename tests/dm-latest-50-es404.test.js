'use strict';
// DM 대화방·팀 대화방이 최신 메시지를 보여 주는지 시험 (#TASK-ES-404)
// 결함: js/team-dm-room.js loadDmMessagesFromDb 가 .order('created_at', { ascending: true }).limit(50) 으로
//   가장 오래된 50건만 받아 왔다 → 대화가 50건을 넘으면 새 메시지가 대화방에 안 나온다(실계정 RA-COMM-04A·04B 실패 원인).
//   js/team-chat.js 팀 대화방도 같은 모양(.order 오름차순 + .limit(100)).
// 이 시험은 앱 파일을 그대로 읽어 노드 안에서 돌리고, Supabase 조회만 가짜 표(필터·정렬·개수 제한을 진짜처럼 적용)로 바꾼다.
//   - DM: 60건 중 최신 50건(m11~m60)이 대화방 목록에 오래된→최신 순으로 들어가고, 화면 글자에서도 m60 이 맨 아래.
//   - 50건 이하(3건)는 전부 오름차순. 읽음 표시(내 메시지 is_read)는 그대로. 실시간 수신 새 메시지는 맨 뒤에 붙는다.
//   - 팀 대화방: 130건 중 최신 100건(c031~c130)이 오름차순.
// 확인 수준: 부품만 돌려 봄(네트워크 없음).
// 사용: node <이 시험 파일> [저장소 뿌리 경로] [결과 JSON 경로] — 기준 커밋 사본(git archive)을 넘기면 그 사본을 잰다.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const OUT = process.argv[3] ? path.resolve(process.argv[3]) : null;
const ME = '11111111-1111-4111-8111-111111111111';
const PEER = '00000000-0000-4000-8000-000000000002';
const THREAD = 'dm_' + PEER + '_' + ME;
const pad = (n, w) => String(n).padStart(w, '0');
const iso = (i) => new Date(Date.UTC(2026, 9, 1, 0, 0, 0) + i * 60000).toISOString();

const results = [];
function check(name, fn) {
  return Promise.resolve().then(fn).then(() => { results.push({ name, ok: true }); }, (e) => { results.push({ name, ok: false, err: String(e && e.message || e) }); });
}
const flush = () => new Promise((r) => setTimeout(r, 0));

/* 가짜 Supabase 표: select·eq·order·limit 를 기록하고 실제로 적용한다(order 인자 없으면 PostgREST 처럼 오름차순) */
function fakeSb(tables) {
  const handlers = [];
  return {
    handlers,
    from(name) {
      const q = { filters: [], order: null, limit: null };
      const b = {
        select() { return b; },
        eq(c, v) { q.filters.push([c, v]); return b; },
        order(c, o) { q.order = [c, !(o && o.ascending === false)]; return b; },
        limit(n) { q.limit = n; return b; },
        then(res, rej) {
          let rows = (tables[name] || []).filter((x) => q.filters.every(([c, v]) => x[c] === v));
          if (q.order) { const [c, asc] = q.order; rows = rows.slice().sort((x, y) => (x[c] < y[c] ? -1 : x[c] > y[c] ? 1 : 0) * (asc ? 1 : -1)); }
          if (q.limit != null) rows = rows.slice(0, q.limit);
          return Promise.resolve({ data: rows.map((x) => Object.assign({}, x)), error: null }).then(res, rej);
        }
      };
      return b;
    },
    channel() {
      const ch = { on(ev, filter, fn) { handlers.push(fn); return ch; }, subscribe() { return ch; }, unsubscribe() {} };
      return ch;
    },
    removeChannel() {}
  };
}

function loadFile(rel, win) {
  win.window = win;
  const ctx = vm.createContext(win);
  vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel });
  const K = win.OurgoalTeamCommKit;
  K.scope.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c]));
  K.scope.showToast = () => {};
  return K;
}
function baseWin(sb) {
  return {
    console: { log() {}, warn() {}, error() {} },
    state: { user: { id: ME }, profile: { id: ME, displayName: '나' } },
    sb,
    document: { getElementById: () => null, body: { contains: () => false }, createElement: () => ({ innerHTML: '', firstElementChild: null }) },
    setTimeout, Promise, Date, Math, JSON, String, Array, Object, Number
  };
}

/* DM 행 n 개: 홀수 번째는 상대, 짝수 번째는 나. 마지막(최신) 내 메시지는 안 읽음, 나머지 내 메시지는 읽음 */
function dmRows(n) {
  const rows = [];
  for (let i = 1; i <= n; i++) {
    const mine = i % 2 === 0;
    rows.push({ id: 'r' + pad(i, 3), ping_id: THREAD, sender_id: mine ? ME : PEER, receiver_id: mine ? PEER : ME, message: 'm' + pad(i, 2), created_at: iso(i), is_read: mine ? i < n - 1 : null });
  }
  // 다른 대화방 행(필터 확인용)
  rows.push({ id: 'other1', ping_id: 'dm_other', sender_id: PEER, receiver_id: ME, message: 'other', created_at: iso(999) });
  return rows;
}
async function loadDm(n) {
  const sb = fakeSb({ team_ping_replies: dmRows(n) });
  const win = baseWin(sb);
  const K = loadFile('js/team-dm-room.js', win);
  const person = { id: PEER, _thread: [] };
  await K.loadDmMessagesFromDb(THREAD, person);
  return { K, person, sb, win };
}

(async () => {
  const sixty = await loadDm(60);
  const texts = sixty.person._thread.map((m) => m.text);
  const expect = [];
  for (let i = 11; i <= 60; i++) expect.push('m' + pad(i, 2));

  await check('DM 60건 중 대화방 목록은 50건', () => assert.strictEqual(texts.length, 50, '건수 ' + texts.length));
  await check('DM 60건 중 최신 50건(m11~m60)만, 오래된 m01~m10 은 없음', () => {
    assert.ok(texts.includes('m60'), '가장 최신 m60 없음 — 앞 3개: ' + texts.slice(0, 3).join(','));
    assert.ok(!texts.includes('m10'), '오래된 m10 이 들어 있음');
  });
  await check('DM 표시 순서는 시간 오름차순(m11 … m60)', () => assert.deepStrictEqual(texts, expect));
  await check('DM 화면 글자에서 최신 m60 이 맨 아래(m59 보다 뒤), m01 없음', () => {
    const html = sixty.person._thread.map(sixty.K.renderSingleDmMsg).join('');
    const i59 = html.indexOf('>m59<'), i60 = html.indexOf('>m60<');
    assert.ok(i59 >= 0 && i60 > i59, 'm59 위치 ' + i59 + ' · m60 위치 ' + i60);
    assert.strictEqual(html.indexOf('>m01<'), -1, 'm01 이 화면에 있음');
  });
  await check('DM 읽음 표시 그대로: 마지막 내 메시지(m60)는 안 읽음, 그 전 내 메시지(m58)는 읽음, 상대 메시지는 읽음', () => {
    const by = (t) => sixty.person._thread.find((m) => m.text === t);
    assert.strictEqual(by('m60').from, 'me'); assert.strictEqual(by('m60').read, false); assert.strictEqual(by('m60').status, 'sent');
    assert.strictEqual(by('m58').from, 'me'); assert.strictEqual(by('m58').read, true);
    assert.strictEqual(by('m59').from, 'them'); assert.strictEqual(by('m59').read, true);
  });
  await check('DM 3건(50건 이하)은 전부 오름차순', async () => {
    const few = await loadDm(3);
    assert.deepStrictEqual(few.person._thread.map((m) => m.text), ['m01', 'm02', 'm03']);
  });
  await check('DM 실시간 수신 새 메시지(m61)는 불러온 50건 맨 뒤에 붙고 내 메시지는 읽음으로', () => {
    const K = sixty.K;
    K.markDmThreadAsRead = () => {};
    K.subscribeRealtimeDm(THREAD, ME, sixty.person, null);
    assert.strictEqual(sixty.sb.handlers.length, 1, '구독 처리기 ' + sixty.sb.handlers.length);
    sixty.sb.handlers[0]({ new: { id: 'r061', ping_id: THREAD, sender_id: PEER, receiver_id: ME, message: 'm61', created_at: iso(61) } });
    const t = sixty.person._thread;
    assert.strictEqual(t.length, 51); assert.strictEqual(t[t.length - 1].text, 'm61'); assert.strictEqual(t[t.length - 2].text, 'm60');
    assert.strictEqual(t[t.length - 2].read, true);
  });

  await check('팀 대화방 130건 중 최신 100건(c031~c130)을 오름차순으로', async () => {
    const rows = [];
    for (let i = 1; i <= 130; i++) rows.push({ id: 't' + pad(i, 3), group_id: 'g1', target_type: 'team_chat', sender_id: i % 2 ? PEER : ME, sender_name: 'x', message: 'c' + pad(i, 3), created_at: iso(i) });
    rows.push({ id: 'p1', group_id: 'g1', target_type: 'ping', sender_id: PEER, message: 'ping', created_at: iso(500) });
    const sb = fakeSb({ team_pings: rows });
    const win = baseWin(sb);
    const gs = {};
    win.groupState = () => gs;
    win.openModal = (html, onMount) => onMount({ querySelector: () => null, querySelectorAll: () => [] });
    const K = loadFile('js/team-chat.js', win);
    K.openTeamChatModal('g1', [{ id: 'g1', name: '팀' }]);
    for (let i = 0; i < 5; i++) await flush();
    const got = (gs.chatMessages || []).map((m) => m.text);
    const want = []; for (let i = 31; i <= 130; i++) want.push('c' + pad(i, 3));
    assert.deepStrictEqual(got, want, '건수 ' + got.length + ' · 처음 ' + got[0] + ' · 끝 ' + got[got.length - 1]);
  });

  const fail = results.filter((r) => !r.ok);
  for (const r of results) console.log((r.ok ? '  통과 · ' : '  실패 · ') + r.name + (r.ok ? '' : ' — ' + r.err));
  console.log('DM 최신 50건 시험: ' + (results.length - fail.length) + '/' + results.length + ' 통과');
  if (OUT) fs.writeFileSync(OUT, JSON.stringify({ test: 'tests/dm-latest-50-es404.test.js', root: path.basename(ROOT), passed: results.length - fail.length, failed: fail.length, total: results.length, results: results.map((r) => (r.ok ? r : { name: r.name, ok: false, err: r.err.split(String.fromCharCode(10))[0].slice(0, 200) })) }, null, 1), 'utf8');
  if (fail.length) process.exitCode = 1;
})().catch((e) => { console.error(e); process.exitCode = 1; });
