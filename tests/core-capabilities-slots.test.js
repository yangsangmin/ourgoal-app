'use strict';
// 세포 골격 코어 시험 (#TASK-ES-356 · 노션 CORE-08): js/core/capabilities.js(신경 = 능력 등록부) · js/core/slots.js(꽂는 자리)
const assert = require('assert');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const events = require(path.join(ROOT, 'js/core/event-bus.js'));
const caps = require(path.join(ROOT, 'js/core/capabilities.js'));
const slots = require(path.join(ROOT, 'js/core/slots.js'));

let n = 0;
function check(title, fn) {
  fn();
  n++;
  console.log('  ✓ ' + title);
}

console.log('[core] 능력 등록부·꽂는 자리 시험');

check('능력: provide → request/call 로 이름만으로 받아 쓴다', () => {
  caps.clear();
  const seen = [];
  caps.provide('ui.toast', msg => { seen.push(msg); return true; }, { cell: 'components', description: '짧은 알림 띄우기', sideEffect: 'screen' });
  assert.strictEqual(caps.has('ui.toast'), true);
  assert.strictEqual(caps.request('ui.toast')('저장했어요'), true);
  caps.call('ui.toast', '두 번째');
  assert.deepStrictEqual(seen, ['저장했어요', '두 번째']);
});

check('능력: 없는 능력 요청은 CAPABILITY_MISSING — 무엇을 누가 찾았는지 메시지에 담는다', () => {
  let err = null;
  try { caps.request('ledger.read', 'records/sub-timeline'); } catch (e) { err = e; }
  assert.ok(err, '오류가 나야 한다');
  assert.strictEqual(err.code, 'CAPABILITY_MISSING');
  assert.ok(err instanceof Error && err.name === 'Error' && err.capability === 'ledger.read', '일반 Error 이고 찾은 능력 이름을 담는다');
  assert.ok(/ledger\.read/.test(err.message) && /records\/sub-timeline/.test(err.message) && /ui\.toast/.test(err.message), err.message);
});

check('능력: 한 능력에 주는 세포는 하나(CAPABILITY_CONFLICT), 같은 세포가 다시 주면 바꿔 끼운다', () => {
  assert.throws(() => caps.provide('ui.toast', () => 1, { cell: 'other-cell' }), e => e.code === 'CAPABILITY_CONFLICT');
  caps.provide('ui.toast', () => 'v2', { cell: 'components', description: '짧은 알림 띄우기' });
  assert.strictEqual(caps.call('ui.toast'), 'v2');
  assert.strictEqual(caps.describe().filter(d => d.name === 'ui.toast').length, 1);
});

check('능력: 이름 규칙·구현·세포 id 검사', () => {
  assert.throws(() => caps.provide('Toast', () => 1, { cell: 'x' }), e => e.code === 'CAPABILITY_BAD_NAME');
  assert.throws(() => caps.provide('ui.sheet', 'not-fn', { cell: 'x' }), e => e.code === 'CAPABILITY_BAD_IMPL');
  assert.throws(() => caps.provide('ui.sheet', () => 1, {}), e => e.code === 'CAPABILITY_NO_CELL');
});

check('능력: describe() 는 구현 없이 기계가 읽는 기술만 — 외부 행위는 needsConfirm', () => {
  caps.provide('notify.send', () => true, { cell: 'notify-engine', description: '알림 보내기', sideEffect: 'external', input: { title: 'string' } });
  const d = caps.describe();
  assert.deepStrictEqual(d.map(x => x.name), ['notify.send', 'ui.toast']);
  const notify = d.find(x => x.name === 'notify.send');
  assert.strictEqual(notify.needsConfirm, true, '외부 행위 능력은 확인 필요');
  assert.deepStrictEqual(notify.input, { title: 'string' });
  assert.ok(!('impl' in notify), '구현은 내보내지 않는다');
  assert.doesNotThrow(() => JSON.stringify(d));
});

check('능력: revokeCell 로 세포가 떨어지면 흔적 0', () => {
  assert.strictEqual(caps.revokeCell('components'), 1);
  assert.strictEqual(caps.has('ui.toast'), false);
  const off = caps.provide('ui.sheet', () => 1, { cell: 'components' });
  off();
  assert.strictEqual(caps.has('ui.sheet'), false, 'provide 가 돌려준 해제 함수');
  assert.strictEqual(caps.revoke('notify.send', 'someone-else'), false, '다른 세포는 남의 능력을 못 지운다');
  caps.clear();
});

check('자리: 정식 목록 15곳(상민님 확정 2026-10-04)이 미리 있고 그 밖은 없다', () => {
  const names = slots.slots().map(s => s.name);
  const expected = ['home.card', 'home.detail', 'checkin.after', 'record.type', 'stats.card', 'goal.template', 'goal.detail', 'calendar.source', 'feed.card', 'reaction.kind', 'notification.kind', 'settings.section', 'profile.badge', 'share.format', 'assistant.skill'];
  assert.deepStrictEqual(names.slice().sort(), expected.slice().sort());
  assert.ok(slots.slots().every(s => /[가-힣]/.test(s.description)), '설명은 한글');
  assert.strictEqual(slots.slots().find(s => s.name === 'assistant.skill').future, true);
});

check('자리: 하이브리드 세포는 여러 자리에 동시에 꽂히고, order·세포 id 순으로 나온다', () => {
  slots.contribute('home.card', 'avatar-system', () => 'avatar-home', { order: 20 });
  slots.contribute('settings.section', 'avatar-system', () => 'avatar-settings');
  slots.contribute('profile.badge', 'avatar-system', () => 'avatar-badge');
  slots.contribute('home.card', 'streaks', () => 'streak-home', { order: 10 });
  assert.deepStrictEqual(slots.list('home.card').map(x => x.cellId), ['streaks', 'avatar-system']);
  assert.deepStrictEqual(slots.collect('home.card', {}).map(x => x.value), ['streak-home', 'avatar-home']);
  slots.contribute('home.card', 'streaks', () => 'streak-v2', { order: 10 });
  assert.strictEqual(slots.list('home.card').length, 2, '같은 (자리, 세포) 는 바꿔 끼운다');
});

check('자리: 정식 목록 밖 이름은 기여·정의 모두 SLOT_NOT_ALLOWED', () => {
  assert.throws(() => slots.contribute('home.widget', 'x', () => 1), e => e.code === 'SLOT_NOT_ALLOWED' && /home\.widget/.test(e.message));
  assert.throws(() => slots.define('goal.widget', { description: '목표 위젯' }), e => e.code === 'SLOT_NOT_ALLOWED');
  assert.throws(() => slots.define('Bad Slot'), e => e.code === 'SLOT_BAD_NAME');
  slots.define('goal.detail', { description: '목표 상세 칸(설명 보태기)' });
  assert.strictEqual(slots.slots().find(s => s.name === 'goal.detail').description, '목표 상세 칸(설명 보태기)', '목록 안 자리는 설명을 보탤 수 있다');
  assert.throws(() => slots.contribute('goal.detail', 'x', 'nope'), e => e.code === 'SLOT_BAD_RENDER');
});

check('자리: 미래 자리 assistant.skill 은 등록만 받고 그리지 않는다', () => {
  let called = 0;
  slots.contribute('assistant.skill', 'records/sub-timeline', () => { called++; return 'skill'; });
  assert.strictEqual(slots.list('assistant.skill').length, 1, '등록은 된다');
  assert.deepStrictEqual(slots.collect('assistant.skill', {}), [], '그리지 않는다');
  assert.strictEqual(called, 0);
  slots.withdrawCell('records/sub-timeline');
});

check('자리: 기여 하나가 실패해도 나머지는 그린다(수밀 격벽) + block:error 신호', () => {
  let errSignal = null;
  events.once('block:error', p => { errSignal = p; });
  slots.contribute('feed.card', 'broken', () => { throw new Error('boom'); }, { order: 1 });
  slots.contribute('feed.card', 'reactions', () => 'card');
  const out = slots.collect('feed.card', {});
  assert.deepStrictEqual(out.map(x => x.ok), [false, true]);
  assert.strictEqual(out[1].value, 'card');
  assert.ok(errSignal && errSignal.slot === 'feed.card' && errSignal.cellId === 'broken');
});

check('자리: withdrawCell 로 세포가 떨어지면 모든 자리에서 흔적 0', () => {
  assert.strictEqual(slots.withdrawCell('avatar-system'), 3);
  assert.ok(!slots.list('settings.section').some(x => x.cellId === 'avatar-system'));
  assert.ok(!slots.list('home.card').some(x => x.cellId === 'avatar-system'));
});

console.log(`✓ 능력 등록부·꽂는 자리 시험 ${n}건 통과`);
