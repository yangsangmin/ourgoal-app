/**
 * Unit Tests for Records Mega-Block and Sub-Blocks (Shipyard Architecture Phase 4)
 */
const assert = require('assert');
const events = require('../js/core/event-bus');
const registry = require('../js/core/registry');
const store = require('../js/core/store');

const timeline = require('../js/tabs/records/sub-timeline');
const timer = require('../js/tabs/records/sub-timer');
const retrospect = require('../js/tabs/records/sub-retrospect');
const recordsMega = require('../js/tabs/records/index');

console.log('🧪 Testing OurGoal Records Blocks (Shipyard Architecture Phase 4)...');

// 1. Sub-Block Basic Specs Test
console.log('[Test 1] Sub-blocks metadata and methods');
assert.strictEqual(timeline.id, 'timeline', 'Timeline sub-block id matches');
assert.strictEqual(typeof timeline.mount, 'function', 'Timeline has mount function');
assert.strictEqual(typeof timeline.render, 'function', 'Timeline has render function');

assert.strictEqual(timer.id, 'timer', 'Timer sub-block id matches');
assert.strictEqual(typeof timer.mount, 'function', 'Timer has mount function');

assert.strictEqual(retrospect.id, 'retrospect', 'Retrospect sub-block id matches');
assert.strictEqual(typeof retrospect.mount, 'function', 'Retrospect has mount function');

// 2. Records MegaBlock Registration & Sub-block Docking Test
console.log('[Test 2] Records MegaBlock registration and sub-block docking');
global.OurgoalRegistry = registry;
global.OurgoalEvents = events;
global.OurgoalStore = store;
global.state = { profile: { goals: [], records: [], settings: {} }, recordsTab: 'timeline' };

recordsMega.registerSubBlock(timeline);
recordsMega.registerSubBlock(timer);
recordsMega.registerSubBlock(retrospect);

assert.strictEqual(recordsMega.id, 'records', 'MegaBlock id matches');
assert.ok(recordsMega.subBlocks['timeline'], 'Timeline sub-block is docked');
assert.ok(recordsMega.subBlocks['timer'], 'Timer sub-block is docked');
assert.ok(recordsMega.subBlocks['retrospect'], 'Retrospect sub-block is docked');

// 3. Mount Execution & Event Trigger Test
console.log('[Test 3] Mount execution and event emission');
let recordsMountedEvent = false;
events.once('records:mounted', () => {
  recordsMountedEvent = true;
});

const mountSuccess = recordsMega.mount(null, global.state, events);
assert.strictEqual(mountSuccess, true, 'MegaBlock mount returns true');
assert.strictEqual(recordsMountedEvent, true, 'records:mounted event was emitted');

// 4. Watertight Boundary Test in Sub-block Mount
console.log('[Test 4] Watertight error boundary on broken sub-block');
const brokenSubBlock = {
  id: 'broken-records-widget',
  name: '고장난 기록 소블록',
  mount: () => {
    throw new Error('Simulated records sub-block crash');
  }
};
recordsMega.registerSubBlock(brokenSubBlock);

let capturedErrorEvent = null;
events.once('block:error', (data) => {
  capturedErrorEvent = data;
});

// Mounting should NOT throw even with broken sub-block
const resilientMountResult = recordsMega.mount(null, global.state, events);
assert.strictEqual(resilientMountResult, true, 'Mount remains resilient despite broken sub-block');
assert.ok(capturedErrorEvent != null, 'block:error event received');
assert.strictEqual(capturedErrorEvent.subBlockId, 'broken-records-widget', 'Error subBlockId matches');

// Clean up broken sub-block
delete recordsMega.subBlocks['broken-records-widget'];

// 5. Event Bus view:sync & checkin:added Propagation Test
console.log('[Test 5] Event Bus checkin:added & view:sync triggers without error');
let errorOccurred = false;
try {
  events.emit('view:sync');
  events.emit('checkin:added');
  events.emit('checkin:updated');
} catch (e) {
  errorOccurred = true;
}
assert.strictEqual(errorOccurred, false, 'view:sync events propagated smoothly');

console.log('✨ ALL 5 Records Block Tests Passed Successfully!');
