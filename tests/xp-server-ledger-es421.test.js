'use strict';
// #TASK-ES-421 K-XP1 EXP 서버 원장 부품 시험 — js/avatar/xp.js 의 이관·합치기·오프라인 재동기화·게스트 불변.
// 서버는 메모리 가짜 Supabase(본인 행만 보이는 RLS 흉내 · rev 증가 · 같은 키 insert 충돌)다. 실서버 확인은 docs/design/harness/real-account-xp-ledger-es421.js.
// 출력은 「ok · 이름」, 실패하면 process.exitCode = 1.
const assert = require('assert');
const path = require('path');

const XP_PATH = path.join(__dirname, '..', 'js', 'avatar', 'xp.js');
const A = 'aaaaaaaa-0000-4000-a000-000000000001';
const B = 'bbbbbbbb-0000-4000-a000-000000000002';

function makeStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); },
    keys: () => Array.from(m.keys()),
    _m: m
  };
}

// 가짜 서버: 표 user_ledger_docs 하나. session 이 가리키는 사용자 행만 읽기·쓰기(RLS 흉내).
function makeServer() {
  const rows = new Map();
  return { rows, offline: false, calls: 0 };
}
function makeClient(server, sessionUid) {
  const client = { sessionUid };
  client.auth = { getSession: async () => ({ data: { session: client.sessionUid ? { user: { id: client.sessionUid } } : null } }) };
  client.from = (table) => {
    assert.strictEqual(table, 'user_ledger_docs');
    const q = { filters: {}, op: null, payload: null };
    const run = async () => {
      server.calls++;
      if (server.offline) return { data: null, error: { message: 'Failed to fetch' } };
      const me = client.sessionUid;
      const key = (u, d) => u + '|' + d;
      if (q.op === 'select') {
        const r = rows().filter((x) => x.user_id === me && Object.keys(q.filters).every((k) => String(x[k]) === String(q.filters[k])));
        return { data: q.single ? (r[0] ? pick(r[0]) : null) : r.map(pick), error: null };
      }
      if (q.op === 'insert') {
        if (!me || q.payload.user_id !== me) return { data: null, error: { code: '42501', message: 'new row violates row-level security policy' } };
        const k = key(q.payload.user_id, q.payload.doc_key);
        if (server.rows.has(k)) return { data: null, error: { code: '23505', message: 'duplicate key' } };
        const row = { user_id: q.payload.user_id, doc_key: q.payload.doc_key, data: JSON.parse(JSON.stringify(q.payload.data)), rev: 1 };
        server.rows.set(k, row);
        return { data: [pick(row)], error: null };
      }
      if (q.op === 'update') {
        const hit = rows().filter((x) => x.user_id === me && Object.keys(q.filters).every((k) => String(x[k]) === String(q.filters[k])));
        hit.forEach((x) => { x.data = JSON.parse(JSON.stringify(q.payload.data)); x.rev += 1; });
        return { data: hit.map(pick), error: null };
      }
      throw new Error('unknown op');
    };
    const rows = () => Array.from(server.rows.values());
    const pick = (x) => ({ data: JSON.parse(JSON.stringify(x.data)), rev: x.rev });
    const chain = {
      select() { if (!q.op) q.op = 'select'; return chain; },
      insert(p) { q.op = 'insert'; q.payload = p; return chain; },
      update(p) { q.op = 'update'; q.payload = p; return chain; },
      eq(k, v) { q.filters[k] = v; return chain; },
      maybeSingle() { q.single = true; return run(); },
      then(res, rej) { return run().then(res, rej); }
    };
    return chain;
  };
  return client;
}

// 앱 스코프 흉내 + xp.js 새로 불러오기(모듈 상태 LG 를 기기마다 따로 둔다)
function loadDevice(opts) {
  const storage = opts.storage || makeStorage();
  const scope = { state: { profile: opts.profile }, sb: opts.client, nowISO: () => new Date(Date.now() + (loadDevice.tick = (loadDevice.tick || 0) + 1)).toISOString() };
  global.OurgoalAppScope = { scope };
  global.localStorage = storage;
  global.OurgoalAvatarParts = {};
  delete require.cache[require.resolve(XP_PATH)];
  const K = require(XP_PATH);
  return { K, scope, storage };
}
function profile(id, settings) { return { id, settings: settings || {} }; }
function legacyLog(list) { return list.map(([amount, reason, at]) => ({ amount, reason, at })); }

let failed = 0;
async function t(name, fn) {
  try { await fn(); console.log('  ok · ' + name); }
  catch (e) { failed++; process.exitCode = 1; console.log('  실패 · ' + name + ' — ' + (e && e.message)); }
}

(async () => {
  console.log('[xp-server-ledger-es421] EXP 서버 원장 부품 시험');

  await t('게스트 불변: 지급은 settings.xp(열거되는 일반 칸)에 옛 모양 그대로, 서버 호출 0, 원장 키 0', async () => {
    const server = makeServer();
    const settings = {};
    const { K, storage } = loadDevice({ profile: profile('guest_1700000000', settings), client: makeClient(server, null) });
    const r = K.awardXP(10, '체크인');
    assert.strictEqual(r.total, 10);
    assert.ok(Object.getOwnPropertyDescriptor(settings, 'xp').enumerable, 'settings.xp 는 일반 칸');
    assert.deepStrictEqual(Object.keys(settings.xp.log[0]).sort(), ['amount', 'at', 'reason'], '이력 항목에 id 를 달지 않음');
    assert.strictEqual(JSON.parse(JSON.stringify(settings)).xp.total, 10, '기기 설정 JSON 에 그대로 들어감');
    assert.strictEqual(K.attachLedger('guest_1700000000', settings), settings);
    await K.ledger.sync();
    assert.strictEqual(server.calls, 0, '서버 호출 0');
    assert.strictEqual(storage.keys().filter((k) => /ledger|premigration/.test(k)).length, 0, '원장 키 0');
    assert.strictEqual(K.readXP().xp, 10);
  });

  await t('세션 없는 로그인(직접 로그인): 기기 모드 유지 — 서버 쓰기 0, settings.xp 일반 칸', async () => {
    const server = makeServer();
    const settings = { xp: { total: 40, log: legacyLog([[40, '체크인', '2026-10-01T00:00:00.000Z']]) } };
    const { K } = loadDevice({ profile: profile(A, settings), client: makeClient(server, null) });
    K.attachLedger(A, settings);
    const res = await K.ledger.sync();
    assert.strictEqual(res.mode, 'device');
    assert.strictEqual(server.rows.size, 0);
    assert.ok(Object.getOwnPropertyDescriptor(settings, 'xp').enumerable);
    K.awardXP(10, '체크인');
    assert.strictEqual(settings.xp.total, 50);
  });

  await t('첫 로그인 이관(서버 없음): 백업 먼저 → 서버에 기기 값 그대로 → 되읽기 일치 뒤에만 settings.xp 쓰기 중단', async () => {
    const server = makeServer();
    const orig = { total: 125, log: legacyLog([[50, '마일스톤 완료', '2026-10-03T00:00:00.000Z'], [10, '체크인', '2026-10-02T00:00:00.000Z'], [60, '데일리 퀘스트', '2026-10-01T00:00:00.000Z']]) };
    const settings = { theme: 'black', xp: JSON.parse(JSON.stringify(orig)) };
    const { K, storage } = loadDevice({ profile: profile(A, settings), client: makeClient(server, A) });
    K.attachLedger(A, settings);
    assert.ok(Object.getOwnPropertyDescriptor(settings, 'xp').enumerable, '확인 전에는 일반 칸');
    const res = await K.ledger.sync();
    assert.strictEqual(res.migrated, true);
    const bk = JSON.parse(storage.getItem(K.ledger.BACKUP_PREFIX + A));
    assert.deepStrictEqual(bk.xp, orig, '이관 직전 원문 백업');
    const row = server.rows.get(A + '|xp');
    assert.strictEqual(row.data.total, 125, '서버 합계 = 기기 합계(이력 밖 +5 포함)');
    assert.strictEqual(row.data.log.length, 3);
    assert.deepStrictEqual(row.data.log.map((e) => e.amount), [50, 10, 60]);
    assert.strictEqual(Object.getOwnPropertyDescriptor(settings, 'xp').enumerable, false, '확인 뒤 숨은 칸');
    assert.strictEqual(JSON.parse(JSON.stringify(settings)).xp, undefined, '기기 설정 JSON 에서 빠짐(쓰기 중단)');
    assert.strictEqual(settings.xp.total, 125, '읽는 곳은 같은 글자로 합계를 읽음');
    assert.strictEqual(K.readXP().level, K.levelForXP(125), '레벨 계산 그대로');
    assert.ok(K.ledger.sameXpDoc(row.data, settings.xp), '서버 판 = 메모리 판');
  });

  await t('되읽기 불일치면 확인하지 않음: settings.xp 를 계속 기기에 씀', async () => {
    const server = makeServer();
    const client = makeClient(server, A);
    const realFrom = client.from;
    let n = 0;
    client.from = (tb) => { const c = realFrom(tb); const ms = c.maybeSingle; c.maybeSingle = async () => { const r = await ms(); n++; if (n >= 2 && r.data) r.data.data.total = 1; return r; }; return c; };
    const settings = { xp: { total: 30, log: legacyLog([[30, '체크인', '2026-10-01T00:00:00.000Z']]) } };
    const { K } = loadDevice({ profile: profile(A, settings), client });
    K.attachLedger(A, settings);
    const res = await K.ledger.sync();
    assert.strictEqual(res.why, 'verify-mismatch');
    assert.ok(Object.getOwnPropertyDescriptor(settings, 'xp').enumerable, '일반 칸 유지');
    assert.strictEqual(K.ledger.status().active, false);
  });

  await t('합치기(서버에 이미 있음): 이력 합집합 + 합계는 큰 쪽 이상, 다시 합쳐도 늘지 않음(멱등)', async () => {
    const M = loadDevice({ profile: profile(A, {}), client: null }).K.ledger;
    const s = M.normalizeXpDoc({ total: 60, log: legacyLog([[50, '마일스톤 완료', '2026-10-02T00:00:00.000Z'], [10, '체크인', '2026-10-01T00:00:00.000Z']]) });
    const c = { total: 35, log: legacyLog([[30, '데일리 퀘스트', '2026-10-03T00:00:00.000Z']]) };
    const m = M.mergeXpDocs(s, c);
    assert.strictEqual(m.total, 95, '60 + 30 + 기기의 이력 밖 5');
    assert.ok(m.total >= Math.max(60, 35));
    assert.deepStrictEqual(m.log.map((e) => e.amount), [30, 50, 10], '시각 최신순');
    assert.ok(M.sameXpDoc(M.mergeXpDocs(m, c), m), '같은 기기 판을 다시 합쳐도 그대로');
    assert.ok(M.sameXpDoc(M.mergeXpDocs(m, m), m), '자기 자신과 합쳐도 그대로');
    const same = M.mergeXpDocs(s, { total: 60, log: legacyLog([[50, '마일스톤 완료', '2026-10-02T00:00:00.000Z'], [10, '체크인', '2026-10-01T00:00:00.000Z']]) });
    assert.strictEqual(same.total, 60, '같은 기록을 가진 두 판은 더하지 않음');
  });

  await t('합치기: 200건 넘는 기기 이력 — 서버 이력 200건, 합계는 전체 합 그대로', async () => {
    const M = loadDevice({ profile: profile(A, {}), client: null }).K.ledger;
    const log = []; for (let i = 0; i < 210; i++) log.push({ amount: 10, reason: '체크인', at: new Date(Date.UTC(2026, 0, 1) + (210 - i) * 60000).toISOString() });
    const m = M.mergeXpDocs(null, { total: 2100, log });
    assert.strictEqual(m.log.length, 200);
    assert.strictEqual(m.total, 2100);
  });

  await t('이관 + 서버 기존 판: 두 기기 이력이 합쳐져 서버·메모리 같음, 레벨 배지 다시 그림', async () => {
    const server = makeServer();
    server.rows.set(A + '|xp', { user_id: A, doc_key: 'xp', rev: 3, data: { v: 1, total: 60, log: [{ id: 'xa', amount: 60, reason: '체크인', at: '2026-10-01T00:00:00.000Z' }], seen: ['xa'] } });
    const settings = { xp: { total: 20, log: legacyLog([[20, '할일 완료', '2026-10-04T00:00:00.000Z']]) } };
    const { K, scope } = loadDevice({ profile: profile(A, settings), client: makeClient(server, A) });
    let badgeRenders = 0;
    scope.renderLevelBadge = () => { badgeRenders++; };
    K.attachLedger(A, settings);
    const res = await K.ledger.sync();
    assert.ok(badgeRenders >= 1, '합계가 바뀌면 레벨 배지를 다시 그림(새 기기 복원 때 0 으로 남지 않게)');
    assert.strictEqual(res.migrated, true);
    const row = server.rows.get(A + '|xp');
    assert.strictEqual(row.data.total, 80);
    assert.strictEqual(row.rev, 4, '읽은 판(3) 위에 한 번 씀');
    assert.strictEqual(settings.xp.total, 80);
  });

  await t('확인 뒤 지급: 메모리에 바로 반영 + 대기열 → 동기화로 서버 합계·이력 반영, 대기열 0', async () => {
    const server = makeServer();
    const settings = { xp: { total: 10, log: legacyLog([[10, '체크인', '2026-10-01T00:00:00.000Z']]) } };
    const { K } = loadDevice({ profile: profile(A, settings), client: makeClient(server, A) });
    K.attachLedger(A, settings);
    await K.ledger.sync();
    const r = K.awardXP(50, '마일스톤 완료');
    assert.strictEqual(r.total, 60);
    assert.strictEqual(settings.xp.total, 60);
    assert.strictEqual(K.ledger.status().pending, 1);
    await K.ledger.sync();
    const row = server.rows.get(A + '|xp');
    assert.strictEqual(row.data.total, 60);
    assert.strictEqual(row.data.log[0].reason, '마일스톤 완료');
    assert.strictEqual(K.ledger.status().pending, 0);
    assert.ok(K.ledger.sameXpDoc(row.data, settings.xp));
  });

  await t('오프라인 재동기화: 실패 동안 기기 사본에 보관 → 캐시 파기 없이 다시 열어도 유지 → 연결되면 서버로', async () => {
    const server = makeServer();
    const storage = makeStorage();
    const s1 = { xp: { total: 10, log: legacyLog([[10, '체크인', '2026-10-01T00:00:00.000Z']]) } };
    let dev = loadDevice({ profile: profile(A, s1), client: makeClient(server, A), storage });
    dev.K.attachLedger(A, s1);
    await dev.K.ledger.sync();
    server.offline = true;
    dev.K.awardXP(10, '체크인');
    dev.K.awardXP(30, '데일리 퀘스트');
    const res = await dev.K.ledger.sync();
    assert.strictEqual(res.why, 'offline');
    assert.strictEqual(dev.K.ledger.status().pending, 2);
    const cached = JSON.parse(storage.getItem(dev.K.ledger.CACHE_PREFIX + A));
    assert.strictEqual(cached.xp.pending.length, 2, '대기열이 기기 사본에 있음');
    // 앱 다시 열기: 기기 설정에는 xp 가 없다(쓰기 중단됨)
    const s2 = JSON.parse(JSON.stringify(s1));
    assert.strictEqual(s2.xp, undefined);
    dev = loadDevice({ profile: profile(A, s2), client: makeClient(server, A), storage });
    dev.K.attachLedger(A, s2);
    assert.strictEqual(s2.xp.total, 50, '다시 열자마자(동기) 기기 사본 합계');
    server.offline = false;
    await dev.K.ledger.sync();
    const row = server.rows.get(A + '|xp');
    assert.strictEqual(row.data.total, 50);
    assert.deepStrictEqual(row.data.log.map((e) => e.amount), [30, 10, 10]);
    assert.strictEqual(dev.K.ledger.status().pending, 0);
  });

  await t('두 기기 각자 지급 후 차례로 동기화: 서버 합계 = 모든 지급 합, 같은 지급 두 번 보내도 한 번', async () => {
    const server = makeServer();
    const sx = {}; const sy = {};
    const X = loadDevice({ profile: profile(A, sx), client: makeClient(server, A) });
    X.K.attachLedger(A, sx); await X.K.ledger.sync();
    const Y = loadDevice({ profile: profile(A, sy), client: makeClient(server, A) });
    Y.K.attachLedger(A, sy); await Y.K.ledger.sync();
    X.K.awardXP(10, '체크인');
    Y.K.awardXP(50, '마일스톤 완료');
    // 두 기기 모두 같은 판(rev)을 들고 있다 — Y 가 먼저 쓰면 X 는 충돌 후 다시 읽어 얹는다
    await Y.K.ledger.sync();
    await X.K.ledger.sync();
    await Y.K.ledger.sync();
    const row = server.rows.get(A + '|xp');
    assert.strictEqual(row.data.total, 60);
    assert.strictEqual(sx.xp.total, 60); assert.strictEqual(sy.xp.total, 60);
    const M = X.K.ledger;
    const again = M.applyXpOps(row.data, [{ id: row.data.log[0].id, amount: 999, log: true }]);
    assert.strictEqual(again.total, 60, '이미 본 id 는 건너뜀');
  });

  await t('읽고 쓰는 사이 다른 기기가 먼저 씀(판 충돌): 0행 갱신을 충돌로 보고 다시 읽어 얹음 — 양쪽 지급 모두 남음', async () => {
    const server = makeServer();
    const sx = {};
    const client = makeClient(server, A);
    const X = loadDevice({ profile: profile(A, sx), client });
    X.K.attachLedger(A, sx); await X.K.ledger.sync();
    const realFrom = client.from;
    let raced = false;
    client.from = (tb) => {
      const c = realFrom(tb); const up = c.update;
      c.update = (p) => {
        if (!raced) { raced = true; const row = server.rows.get(A + '|xp'); row.data = { v: 1, total: 50, log: [{ id: 'yy1', amount: 50, reason: '마일스톤 완료', at: '2026-10-05T00:00:00.000Z' }], seen: ['yy1'] }; row.rev += 1; }
        return up(p);
      };
      return c;
    };
    X.K.awardXP(10, '체크인');
    const res = await X.K.ledger.sync();
    assert.strictEqual(res.mode, 'ledger');
    assert.ok(raced, '충돌이 실제로 일어남');
    const row = server.rows.get(A + '|xp');
    assert.strictEqual(row.data.total, 60);
    assert.strictEqual(sx.xp.total, 60);
    assert.strictEqual(X.K.ledger.status().pending, 0);
  });

  await t('이력 없는 직접 증가(첫 체크인 +5 우회 경로)도 잃지 않음: 다음 동기화에 합계만 올라감', async () => {
    const server = makeServer();
    const settings = {};
    const { K } = loadDevice({ profile: profile(A, settings), client: makeClient(server, A) });
    K.attachLedger(A, settings);
    await K.ledger.sync();
    settings.xp.total = (settings.xp.total || 0) + 5; // index.html triggerFirstCheckinCelebrationModal 과 같은 글자
    K.ledger.tick();
    await K.ledger.sync();
    const row = server.rows.get(A + '|xp');
    assert.strictEqual(row.data.total, 5);
    assert.strictEqual(row.data.log.length, 0, '이력은 그대로(지급 규칙 변경 0)');
  });

  await t('본인 행만: B 세션으로는 A 원장을 읽지도 쓰지도 못함(RLS 흉내)', async () => {
    const server = makeServer();
    const sa = { xp: { total: 70, log: legacyLog([[70, '체크인', '2026-10-01T00:00:00.000Z']]) } };
    const a = loadDevice({ profile: profile(A, sa), client: makeClient(server, A) });
    a.K.attachLedger(A, sa); await a.K.ledger.sync();
    const cb = makeClient(server, B);
    const r = await cb.from('user_ledger_docs').select('data,rev').eq('user_id', A).eq('doc_key', 'xp').maybeSingle();
    assert.strictEqual(r.data, null);
    const w = await cb.from('user_ledger_docs').insert({ user_id: A, doc_key: 'xp', data: { total: 1 } }).select('data,rev');
    assert.ok(w.error);
    assert.strictEqual(server.rows.get(A + '|xp').data.total, 70);
  });

  await t('계정 전환: A 원장이 B 프로필에 붙지 않음', async () => {
    const server = makeServer();
    const storage = makeStorage();
    const sa = { xp: { total: 70, log: [] } };
    const dev = loadDevice({ profile: profile(A, sa), client: makeClient(server, A), storage });
    dev.K.attachLedger(A, sa); await dev.K.ledger.sync();
    const sb2 = {};
    dev.scope.state.profile = profile(B, sb2);
    dev.scope.sb.sessionUid = B;
    dev.K.attachLedger(B, sb2);
    assert.strictEqual(sb2.xp, undefined, 'B 설정에 A 값 없음');
    assert.strictEqual(sa.xp, null, '옛 A 설정의 숨은 칸은 더 이상 A 판을 내주지 않음');
    assert.strictEqual(dev.K.readXP().xp, 0);
  });

  console.log('[xp-server-ledger-es421] ' + (failed ? failed + '건 실패' : '모두 통과'));
})();
