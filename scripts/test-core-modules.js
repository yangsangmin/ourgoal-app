/**
 * Unit Tests for OurGoal Core Shipyard Architecture (배관망 & 도크 레지스트리)
 */
const assert = require('assert');
const events = require('../js/core/event-bus');
const registry = require('../js/core/registry');
const store = require('../js/core/store');

console.log('🧪 Testing OurGoal Core Modules (Shipyard Architecture Phase 1)...');

// 1. EventBus Tests
console.log('[Test 1] EventBus basic Pub/Sub & once');
let receivedPayload = null;
const unsub = events.on('test:event', (payload) => {
  receivedPayload = payload;
});
events.emit('test:event', { foo: 'bar' });
assert.deepStrictEqual(receivedPayload, { foo: 'bar' }, 'EventBus: payload should be received');

let onceCount = 0;
events.once('test:once', () => {
  onceCount++;
});
events.emit('test:once');
events.emit('test:once');
assert.strictEqual(onceCount, 1, 'EventBus: once handler should run exactly once');

unsub();
receivedPayload = null;
events.emit('test:event', { foo: 'baz' });
assert.strictEqual(receivedPayload, null, 'EventBus: unsubscriber should remove listener');

// 2. EventBus Recursion Guard Test
console.log('[Test 2] EventBus recursion guard');
let recursionHits = 0;
events.on('test:loop', () => {
  recursionHits++;
  events.emit('test:loop');
});
events.emit('test:loop');
assert.ok(recursionHits <= 11, 'EventBus: recursion should be halted at max depth');
events.clear('test:loop');

// 3. BlockRegistry Tests
console.log('[Test 3] BlockRegistry registration and listing');
registry.registerMegaBlock('home', {
  name: '홈 탭',
  containerId: 'screen-home',
  mount: (container, s, ev) => {
    return 'mounted:home';
  }
});
registry.registerSubBlock('home', 'cockpit', {
  name: '오늘의 1초 콕핏',
  containerId: 'home-cockpit-slot'
});

const megaList = registry.listMegaBlocks();
assert.ok(megaList.some(m => m.id === 'home'), 'Registry: home megaBlock registered');
const subList = registry.listSubBlocks('home');
assert.ok(subList.some(s => s.id === 'cockpit'), 'Registry: cockpit subBlock registered');

// 4. BlockRegistry Watertight Boundary Test
console.log('[Test 4] BlockRegistry watertight error boundary');
registry.registerMegaBlock('broken-tab', {
  name: '오류 탭',
  containerId: 'screen-broken',
  mount: () => {
    throw new Error('Watertight test exception');
  }
});

let errorEventReceived = null;
events.once('block:error', (errData) => {
  errorEventReceived = errData;
});

// Should not throw, but catch and return false
const mountResult = registry.mount('broken-tab');
assert.strictEqual(mountResult, false, 'Registry: mount should return false on error');
assert.ok(errorEventReceived != null, 'Registry: block:error event should be emitted');
assert.strictEqual(errorEventReceived.blockId, 'broken-tab', 'Registry: error blockId matches');

// 5. StateStore Tests
console.log('[Test 5] StateStore get/set and subscribe');
let storeChange = null;
const unsubStore = store.subscribe('profile.settings.theme', (newVal, oldVal) => {
  storeChange = { newVal, oldVal };
});

store.set('profile.settings.theme', 'sanctuary');
assert.strictEqual(store.get('profile.settings.theme'), 'sanctuary', 'Store: get should return updated value');
assert.deepStrictEqual(storeChange, { newVal: 'sanctuary', oldVal: undefined }, 'Store: subscriber notified');

unsubStore();
store.set('profile.settings.theme', 'oled-black');
// subscriber should not fire again
assert.deepStrictEqual(storeChange, { newVal: 'sanctuary', oldVal: undefined }, 'Store: unsubscribed successfully');

console.log('✨ ALL 5 Core Module Tests Passed Successfully!');
