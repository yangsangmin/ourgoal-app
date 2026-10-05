'use strict';
// #TASK-ES-490 GUARD_03: 오프라인 동기화 큐(js/core/virtual-user-helpers.js OfflineSyncManager)가 동기화 오류를 삼키고 큐를 비우던 데이터 손실 재현.
// 고치기 전: flush(처리기) 는 처리기가 throw 해도 catch 로 삼키고 큐를 통째로 지웠다 → 보내지 못한 기록이 큐에서 사라진다.
// 고친 뒤: 성공한 항목만 지우고 실패한 항목은 큐에 남는다. 처리기 없이 부르면 아무것도 지우지 않는다. syncOnline 은 저장 실패 시 큐를 유지한다.
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'js', 'core', 'virtual-user-helpers.js'), 'utf8');
const KEY = 'ourgoal_offline_sync_queue';

function load(scopeOverrides) {
  const store = {};
  const toasts = [];
  const scope = Object.assign({ toast: (m) => toasts.push(m), state: { profile: { id: 'guest', records: [] } } }, scopeOverrides || {});
  const ctx = {
    localStorage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } },
    navigator: { onLine: true },
    setTimeout: () => 0, clearTimeout: () => {},
    console: { warn: () => {}, log: () => {}, error: () => {} },
    JSON, Date, Math, Object, Array, String, Number, Promise, Error, isFinite,
    OurgoalAppScope: { scope },
  };
  ctx.window = ctx; ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(SRC, ctx);
  return { M: ctx.OurgoalUiHelpers.OfflineSyncManager, store, toasts, scope };
}

(async () => {
  // 1) 처리기가 실패하면 그 항목은 큐에 남는다
  {
    const { M, store } = load();
    M.enqueue({ type: 'record', data: { id: 'r1', text: 'A' } });
    M.enqueue({ type: 'record', data: { id: 'r2', text: 'B' } });
    const n = await M.flush(async (item) => { if (item.action.data.id === 'r2') throw new Error('network'); });
    const left = JSON.parse(store[KEY] || '[]');
    assert.deepStrictEqual(left.map((x) => x.action.data.id), ['r2'], '실패한 항목(r2)은 큐에 남는다 — 남은 큐: ' + JSON.stringify(left));
    assert.strictEqual(n, 1, '성공한 항목 수를 돌려준다');
  }
  // 2) 처리기 없이 부르면 아무것도 지우지 않는다(예전 유일한 호출부가 이렇게 불러 큐를 버렸다)
  {
    const { M, store } = load();
    M.enqueue({ type: 'record', data: { id: 'r3', text: 'C' } });
    await M.flush();
    assert.strictEqual(JSON.parse(store[KEY] || '[]').length, 1, '처리기 없는 flush 는 큐를 비우지 않는다');
  }
  // 3) syncOnline: 저장이 실패하면 큐 유지 + 사용자에게 알림
  {
    const { M, store, toasts } = load({ saveProfile: async () => { throw new Error('server down'); } });
    M.enqueue({ type: 'record', data: { id: 'r4', text: 'D' } });
    const res = await M.syncOnline();
    assert.strictEqual(JSON.parse(store[KEY] || '[]').length, 1, '저장 실패 시 큐 유지');
    assert.strictEqual(JSON.stringify(res), JSON.stringify({ synced: 0, failed: 1 }));
    assert.ok(toasts.some((t) => /아직 보내지 못했어요/.test(t)), '실패를 사용자에게 알린다: ' + JSON.stringify(toasts));
  }
  // 4) syncOnline: 큐에만 남은 기록을 되살리고 저장 성공 뒤에만 큐를 비운다
  {
    let saved = 0;
    const { M, store, scope, toasts } = load({ saveProfile: async () => { saved++; } });
    M.enqueue({ type: 'record', data: { id: 'r5', text: 'E' } });
    const res = await M.syncOnline();
    assert.strictEqual(saved, 1, 'saveProfile 을 한 번 부른다');
    assert.ok(scope.state.profile.records.some((r) => r.id === 'r5'), '큐에만 있던 기록이 상태에 되살아난다');
    assert.strictEqual(store[KEY], undefined, '저장 성공 뒤 큐를 비운다');
    assert.strictEqual(JSON.stringify(res), JSON.stringify({ synced: 1, failed: 0 }));
    assert.ok(toasts.some((t) => /1건을 동기화했어요/.test(t)));
  }
  console.log('offline-sync-queue-retain: OK');
})().catch((e) => { console.error(e); process.exitCode = 1; });
