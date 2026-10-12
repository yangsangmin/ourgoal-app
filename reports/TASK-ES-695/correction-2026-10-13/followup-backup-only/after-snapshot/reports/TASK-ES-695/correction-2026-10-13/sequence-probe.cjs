'use strict';
// 작업자 추가 순서 측정. 독립 검토자의 도구는 바꾸지 않는다. 실제 종료·운영 브라우저 경쟁의 측정이 아니다.
const fs = require('fs'), path = require('path'), assert = require('assert');
const source = path.resolve(__dirname, '../../../js/core/local-keep.js');
const uid = '11111111-1111-4111-8111-111111111111';
const key = (kind, type) => 'ourgoal_' + kind + '_' + type + '_' + uid;
const fresh = () => { delete require.cache[require.resolve(source)]; return require(source); };
const store = () => {
  const data = {}, ops = [];
  return { data, ops, getItem(k) { return Object.hasOwn(data, k) ? data[k] : null; }, setItem(k, v) { data[k] = String(v); ops.push({ op: 'set', key: k }); }, removeItem(k) { delete data[k]; ops.push({ op: 'remove', key: k }); } };
};
const cases = [];
function run(name, fn) { try { const details = fn(); cases.push({ name, assertionsHeld: true, details }); } catch (e) { cases.push({ name, assertionsHeld: false, error: e.stack }); } }
for (const kind of ['records', 'goals']) {
  for (const cut of [0, 1, 2]) run(kind + ' restore interrupted after ' + cut + ' successful writes', () => {
    const K = fresh(), s = store(), b = key(kind, 'backup'), p = key(kind, 'prev');
    const current = JSON.stringify([{ id: 'new', text: 'current-unique', photo: 'current-photo' }]);
    const previous = JSON.stringify([{ id: 'old', text: 'previous-unique', photo: 'old-photo' }]);
    s.data[b] = current; s.data[p] = previous;
    let n = 0; const set = s.setItem;
    s.setItem = (k, v) => { if (n >= cut) throw Error('terminated'); set(k, v); n++; };
    const result = K.restorePrevious(kind, uid, s);
    assert.strictEqual(result.ok, false);
    assert.ok(Object.values(s.data).some(v => v.includes('current-unique')));
    assert.ok(Object.values(s.data).some(v => v.includes('previous-unique')));
    return { result, operations: s.ops, currentRemains: true, previousRemains: true };
  });
  for (const type of ['backup', 'prev', 'kept']) run(kind + ' transient ' + type + ' read failure then next save', () => {
    const K = fresh(), s = store(), b = key(kind, 'backup'), p = key(kind, 'prev'), k = key(kind, 'kept');
    const current = JSON.stringify([{ id: 'r', text: 'device-edited', feedback: 'device-feedback', photo: 'unique-current' }, { id: 'device', text: 'only-device' }]);
    s.data[b] = current; s.data[p] = JSON.stringify([{ id: 'prev-only', text: 'unique-previous' }]);
    s.data[k] = JSON.stringify({ v: 1, items: [{ why: 'not-in-server-response', item: { id: 'kept-only', text: 'unique-kept' } }] });
    const before = { ...s.data }; const get = s.getItem;
    s.getItem = name => { if (name === key(kind, type)) throw Error('read-access-denied'); return get(name); };
    const output = kind === 'records' ? K.commitServerRecords(uid, [{ id: 'r', text: 'server' }], s) : K.commitServerGoals(uid, [{ id: 'r', text: 'server' }], s);
    s.getItem = get;
    K.setBackupFromSave(kind, uid, output.records || output.goals, s);
    for (const raw of Object.values(before)) assert.ok(Object.values(s.data).some(v => v.includes(raw) || v === raw));
    return { result: output.result, nextSavePreservesRaw: true, operations: s.ops };
  });
  run(kind + ' unreadable current preservation fails then next save', () => {
    const K = fresh(), s = store(), b = key(kind, 'backup'), k = key(kind, 'kept');
    s.data[b] = 'BROKEN-UNIQUE-RAW'; const set = s.setItem;
    s.setItem = (key, value) => { if (key === k) throw Error('quota'); set(key, value); };
    const output = kind === 'records' ? K.commitServerRecords(uid, [{ id: 'r', text: 'server' }], s) : K.commitServerGoals(uid, [{ id: 'r', title: 'server' }], s);
    const wrote = K.setBackupFromSave(kind, uid, output.records || output.goals, s);
    assert.strictEqual(s.data[b], 'BROKEN-UNIQUE-RAW'); assert.strictEqual(wrote, false);
    return { result: output.result, wrote, raw: s.data[b] };
  });
  run(kind + ' unique previous preservation fails then quota release', () => {
    const K = fresh(), s = store(), b = key(kind, 'backup'), p = key(kind, 'prev'), k = key(kind, 'kept');
    s.data[b] = JSON.stringify([{ id: 'r', text: 'current' }]); s.data[p] = 'BROKEN-PREVIOUS-UNIQUE';
    const set = s.setItem; s.setItem = (key, value) => { if (key === b || key === k) throw Error('quota'); set(key, value); };
    assert.throws(() => K.setBackupFromSave(kind, uid, [{ id: 'r', text: 'next' }], s));
    assert.strictEqual(s.data[p], 'BROKEN-PREVIOUS-UNIQUE');
    return { previousRemains: true, operations: s.ops };
  });
}
for (const position of ['before-backup-write-check', 'atomic-backup-write-throws', 'after-backup-write']) run('concurrent change ' + position, () => {
  const K = fresh(), s = store(), b = key('records', 'backup'), p = key('records', 'prev');
  const old = JSON.stringify([{ id: 'r', text: 'old' }]), other = JSON.stringify([{ id: 'r', text: 'old' }, { id: 'other-tab', text: 'concurrent-unique' }]);
  s.data[b] = old; const plan = K.planRecords(uid, [{ id: 'r', text: 'old', category: 'updated' }], s);
  const set = s.setItem;
  s.setItem = (k, v) => {
    if (position === 'before-backup-write-check' && k === p) { set(k, v); s.data[b] = other; return; }
    if (k === b && position === 'atomic-backup-write-throws') { s.data[b] = other; throw Error('QuotaExceededError'); }
    set(k, v); if (k === b && position === 'after-backup-write') s.data[b] = other;
  };
  const result = K.commit('records', uid, plan, s);
  assert.strictEqual(result.ok, false); assert.strictEqual(s.data[b], other);
  return { result, concurrentRetained: true, operations: s.ops };
});
run('server non-null values and null device values', () => {
  const K = fresh(), s = store(), b = key('records', 'backup');
  s.data[b] = JSON.stringify([{ id: 'r', text: 'same', photo: null, feedback: null, energy: 40, focus: 70, arbitraryField: { x: 1 } }]);
  const r = K.commitServerRecords(uid, [{ id: 'r', text: 'same', energy: 99, photo: 'server-photo', arbitraryField: { y: 2 } }], s).records[0];
  assert.strictEqual(r.energy, 99); assert.strictEqual(r.photo, 'server-photo'); assert.strictEqual(r.feedback, undefined); assert.strictEqual(r.focus, 70); assert.deepStrictEqual(r.arbitraryField, { y: 2 });
  return r;
});
// CAS가 없는 마지막 틈은 알려진 한계로 숨기지 않고 측정한다. 이것은 assertionsHeld 수에 넣지 않는다.
const K = fresh(), s = store(), b = key('records', 'backup');
s.data[b] = JSON.stringify([{ id: 'r', text: 'old' }]); const plan = K.planRecords(uid, [{ id: 'r', text: 'old', category: 'new' }], s);
const set = s.setItem; s.setItem = (k, v) => { if (k === b) s.data[b] = JSON.stringify([{ id: 'race', text: 'write-between-check-and-set' }]); set(k, v); };
const result = K.commit('records', uid, plan, s);
const boundary = { position: 'another writer inside the final setItem after the last read', result, concurrentRemains: Object.values(s.data).some(v => v.includes('write-between-check-and-set')), scope: 'synchronous injection; CAS absent; not actual browser interleaving' };
const output = { source, cases, total: cases.length, assertionsNotHeld: cases.filter(x => !x.assertionsHeld).length, boundary, note: 'worker measurement; no court verdict; no operating server requests' };
fs.writeFileSync(path.join(__dirname, 'sequence-probe.json'), JSON.stringify(output, null, 2) + '\n', 'utf8');
console.log(JSON.stringify({ total: output.total, assertionsNotHeld: output.assertionsNotHeld, boundary }));
process.exitCode = output.assertionsNotHeld ? 1 : 0;
