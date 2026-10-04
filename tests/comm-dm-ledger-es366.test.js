'use strict';
// DM·동반자 서버 원장 통로 시험 (#TASK-ES-366 · 노션 COMM-03·COMM-04)
// 부품 시험(확인 수준 3): 네트워크·실서버를 타지 않고, supabase-js 와 같은 모양으로 { data, error } 를 돌려주는 대역(stub)으로
// 통로가 무엇을 보내고 오류를 어떻게 다루는지만 잰다. 실계정 확인은 docs/design/harness/real-account-check.js(RA-COMM-03·04A·04B).
const assert = require('assert');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const L = require(path.join(ROOT, 'js/tabs/comm/dm-ledger.js'));

/* supabase-js 체인 대역: from(t).insert/update/.eq/.neq/.not/.select 를 기록하고, 정해 둔 결과를 돌려준다 */
function stubClient(plan) {
  const calls = [];
  function chain(table, op, payload) {
    const c = { table, op, payload, filters: [] };
    calls.push(c);
    const p = {
      eq(k, v) { c.filters.push(['eq', k, v]); return p; },
      neq(k, v) { c.filters.push(['neq', k, v]); return p; },
      not(k, o, v) { c.filters.push(['not', k, o, v]); return p; },
      select() { c.select = true; return p; },
      then(res, rej) { return Promise.resolve(plan[op](c)).then(res, rej); }
    };
    return p;
  }
  return {
    calls,
    from(t) { return { insert: (x) => chain(t, 'insert', x), update: (x) => chain(t, 'update', x) }; },
    rpc(name, args) { calls.push({ op: 'rpc', name, args }); return Promise.resolve(plan.rpc({ name, args })); }
  };
}

let n = 0;
async function check(title, fn) { await fn(); n++; console.log('  ok · ' + title); }

(async () => {
  console.log('[comm/dm-ledger] DM·동반자 서버 원장 통로 시험');

  await check('trackPost: 본인 토큰을 Authorization 에 붙여 /api/track 으로 보낸다(COMM-03 원인 ①: 토큰 없이 401)', async () => {
    const sent = [];
    globalThis.getSupabaseAuthToken = async () => 'tok-A';
    globalThis.fetch = async (url, opt) => { sent.push({ url, opt }); return { ok: true, json: async () => ({ ok: true }) }; };
    await L.trackPost({ action: 'sync_companions', userId: 'u1' });
    assert.strictEqual(sent.length, 1);
    assert.strictEqual(sent[0].url, '/api/track');
    assert.strictEqual(sent[0].opt.headers.Authorization, 'Bearer tok-A');
    assert.deepStrictEqual(JSON.parse(sent[0].opt.body), { action: 'sync_companions', userId: 'u1' });
  });

  await check('trackPost: 토큰이 없으면 보내지 않고 null(서버 401 을 만들지 않는다)', async () => {
    const sent = [];
    globalThis.getSupabaseAuthToken = async () => null;
    globalThis.sb = { auth: { getSession: async () => ({ data: { session: null } }) } };
    globalThis.fetch = async () => { sent.push(1); return { ok: true }; };
    assert.strictEqual(await L.trackPost({ action: 'sync_companions', userId: 'u1' }), null);
    assert.strictEqual(sent.length, 0);
    delete globalThis.sb;
  });

  await check('storageCopy: 대화 흔적(_thread·_loadedThreadFromDb·lastMsg·lastTime·isUnread)을 뺀 사본, 원본은 그대로', async () => {
    const orig = [{ id: 'b', nickname: '비', _thread: [{ text: 'secret dm' }], _loadedThreadFromDb: true, lastMsg: 'secret dm', lastTime: 't', isUnread: true }];
    const copy = L.storageCopy(orig);
    assert.deepStrictEqual(copy, [{ id: 'b', nickname: '비' }]);
    assert.strictEqual(orig[0]._loadedThreadFromDb, true);
    assert.ok(!JSON.stringify(copy).includes('secret dm'));
  });

  await check('insertReply: 상태 열이 없는 표(PGRST204)면 그 열만 빼고 다시 넣어 메시지를 도착시킨다(COMM-04A 원인)', async () => {
    const sb = stubClient({
      insert: (c) => ('delivered_at' in c.payload || 'status' in c.payload || 'sent_at' in c.payload)
        ? { error: { code: 'PGRST204', message: "Could not find the 'sent_at' column of 'team_ping_replies' in the schema cache" } }
        : { error: null }
    });
    const r = await L.insertReply(sb, { id: 'r1', ping_id: 'dm_a_b', sender_id: 'a', receiver_id: 'b', message: 'hi', status: 'sent', sent_at: 'x', created_at: 'x' });
    assert.deepStrictEqual(r, { ok: true, error: null, withoutStatusColumns: true });
    assert.strictEqual(sb.calls.length, 2);
    assert.deepStrictEqual(Object.keys(sb.calls[1].payload).sort(), ['created_at', 'id', 'message', 'ping_id', 'receiver_id', 'sender_id']);
  });

  await check('insertReply: 열이 다 있으면 한 번에, 다른 오류(권한 등)는 다시 넣지 않고 실패로 돌려준다', async () => {
    const okSb = stubClient({ insert: () => ({ error: null }) });
    assert.deepStrictEqual(await L.insertReply(okSb, { id: 'r2', status: 'sent' }), { ok: true, error: null, withoutStatusColumns: false });
    assert.strictEqual(okSb.calls.length, 1);
    const denySb = stubClient({ insert: () => ({ error: { code: '42501', message: 'new row violates row-level security policy' } }) });
    const r = await L.insertReply(denySb, { id: 'r3', status: 'sent' });
    assert.strictEqual(r.ok, false);
    assert.ok(/row-level security/.test(r.error));
    assert.strictEqual(denySb.calls.length, 1);
  });

  await check('markThreadRead: 서버 함수 og_dm_mark(p_read true) 를 먼저 부르고 바뀐 행 수를 돌려준다', async () => {
    const sb = stubClient({ rpc: () => ({ data: 2, error: null }) });
    const r = await L.markThreadRead(sb, 'b', 'dm_a_b');
    assert.deepStrictEqual(r, { ok: true, rows: 2, via: 'rpc', error: null });
    assert.deepStrictEqual(sb.calls[0], { op: 'rpc', name: 'og_dm_mark', args: { p_ping_id: 'dm_a_b', p_read: true } });
  });

  await check('markThreadRead: 함수가 없으면 받는 사람 본인 행만 직접 update(아직 안 읽은 행), 실패는 ok:false 로 정직하게', async () => {
    const sb = stubClient({ rpc: () => ({ data: null, error: { code: 'PGRST202', message: 'Could not find the function' } }), update: () => ({ data: [], error: { code: 'PGRST204', message: "Could not find the 'is_read' column" } }) });
    const r = await L.markThreadRead(sb, 'b', 'dm_a_b');
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.via, 'update');
    const up = sb.calls.find((c) => c.op === 'update');
    assert.deepStrictEqual(up.filters, [['eq', 'ping_id', 'dm_a_b'], ['eq', 'receiver_id', 'b'], ['not', 'is_read', 'is', true]]);
  });

  await check('team-invite-comm: markDmThreadAsRead 가 통로의 markThreadRead 를 부른다(COMM-04 원인: 부르는 곳 없음)', async () => {
    globalThis.window = globalThis;
    globalThis.state = { profile: { id: 'user_b', settings: {} } };
    globalThis.localStorage = { _m: {}, getItem(k) { return this._m[k] || null; }, setItem(k, v) { this._m[k] = String(v); }, removeItem(k) { delete this._m[k]; }, key() { return null; }, length: 0 };
    require(path.join(ROOT, 'js/team-invite-comm.js'));
    const M = globalThis.OurgoalTeamInviteComm;
    const seen = [];
    globalThis.OurgoalDmLedger = Object.assign({}, L, { markThreadRead: async (sb, me, t) => { seen.push([me, t]); return { ok: true, rows: 1, via: 'rpc', error: null }; } });
    globalThis.sb = {};
    const r = await M.markDmThreadAsRead('user_b', 'user_a');
    assert.deepStrictEqual(seen, [['user_b', 'dm_user_a_user_b']]);
    assert.strictEqual(r.ok, true);
  });

  await check('renderSingleDmMsg: 내 메시지는 도착 시각이 없으면 \'도착\'을 쓰지 않는다(04B: 상대가 꺼져 있을 때 도착을 지어내지 않음)', async () => {
    const M = globalThis.OurgoalTeamInviteComm;
    const noDelivery = M.renderSingleDmMsg({ id: 'm1', from: 'me', text: 'hi', sentAt: '2026-10-04T14:00:00.000Z', deliveredAt: null, read: false });
    assert.ok(!noDelivery.includes('도착'));
    assert.ok(noDelivery.includes('미확인 (1)'));
    const delivered = M.renderSingleDmMsg({ id: 'm2', from: 'me', text: 'hi', sentAt: '2026-10-04T14:00:00.000Z', deliveredAt: '2026-10-04T14:00:05.000Z', read: false });
    assert.ok(delivered.includes('도착 2026'));
  });

  await check('ensureDefaultCompanions: 자기 uid 키(ourgoal_companions_backup_<uid>)만 읽고, 비어 있으면 다른 계정 키를 가져오지 않는다', async () => {
    const M = globalThis.OurgoalTeamInviteComm;
    const store = { 'ourgoal_companions_backup_user_other': JSON.stringify([{ id: 'peer_of_other', nickname: '남의 동반자' }]) };
    globalThis.localStorage = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; }, key: (i) => Object.keys(store)[i] || null, get length() { return Object.keys(store).length; } };
    globalThis.state = { profile: { id: 'user_me', settings: {}, companions: [] } };
    assert.deepStrictEqual(M.ensureDefaultCompanions(), []);
    store['ourgoal_companions_backup_user_me'] = JSON.stringify([{ id: 'peer_of_me', nickname: '내 동반자' }]);
    globalThis.state = { profile: { id: 'user_me', settings: {}, companions: [] } };
    assert.deepStrictEqual(M.ensureDefaultCompanions().map((c) => c.id), ['peer_of_me']);
  });

  console.log('[comm/dm-ledger] ' + n + '/10 통과');
})().catch((e) => { console.error('[comm/dm-ledger] 실패:', e && e.stack || e); process.exitCode = 1; });
