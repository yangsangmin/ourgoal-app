/**
 * Unit Tests for Home Mega-Block and Sub-Blocks (Shipyard Architecture Phase 2)
 */
const assert = require('assert');
const events = require('../js/core/event-bus');
const registry = require('../js/core/registry');
const store = require('../js/core/store');

const heatmap = require('../js/tabs/home/sub-heatmap');
const today = require('../js/tabs/home/sub-today');
const quest = require('../js/tabs/home/sub-quest');
const homeMega = require('../js/tabs/home/index');

console.log('🧪 Testing OurGoal Home Blocks (Shipyard Architecture Phase 2)...');

// 1. Sub-Block Basic Specs Test
console.log('[Test 1] Sub-blocks metadata and methods');
assert.strictEqual(heatmap.id, 'heatmap', 'Heatmap sub-block id matches');
assert.strictEqual(typeof heatmap.mount, 'function', 'Heatmap has mount function');
assert.strictEqual(typeof heatmap.render, 'function', 'Heatmap has render function');

assert.strictEqual(today.id, 'today', 'Today sub-block id matches');
assert.strictEqual(typeof today.mount, 'function', 'Today has mount function');

assert.strictEqual(quest.id, 'quest', 'Quest sub-block id matches');
assert.strictEqual(typeof quest.mount, 'function', 'Quest has mount function');

// 2. Home MegaBlock Registration & Sub-block Docking Test
console.log('[Test 2] Home MegaBlock registration and sub-block docking');
global.OurgoalRegistry = registry;
global.OurgoalEvents = events;
global.OurgoalStore = store;
global.state = { profile: { goals: [], records: [], settings: {} } };

homeMega.registerSubBlock(heatmap);
homeMega.registerSubBlock(today);
homeMega.registerSubBlock(quest);

assert.strictEqual(homeMega.id, 'home', 'MegaBlock id matches');
assert.ok(homeMega.subBlocks['heatmap'], 'Heatmap sub-block is docked');
assert.ok(homeMega.subBlocks['today'], 'Today sub-block is docked');
assert.ok(homeMega.subBlocks['quest'], 'Quest sub-block is docked');

// 3. Mount Execution & Event Trigger Test
console.log('[Test 3] Mount execution and event emission');
let homeMountedEvent = false;
events.once('home:mounted', () => {
  homeMountedEvent = true;
});

const mountSuccess = homeMega.mount(null, global.state, events);
assert.strictEqual(mountSuccess, true, 'MegaBlock mount returns true');
assert.strictEqual(homeMountedEvent, true, 'home:mounted event was emitted');

// 4. Watertight Boundary Test in Sub-block Mount
console.log('[Test 4] Watertight error boundary on broken sub-block');
const brokenSubBlock = {
  id: 'broken-widget',
  name: '고장난 소블록',
  mount: () => {
    throw new Error('Simulated sub-block crash');
  }
};
homeMega.registerSubBlock(brokenSubBlock);

let capturedErrorEvent = null;
events.once('block:error', (data) => {
  capturedErrorEvent = data;
});

// Mounting should NOT throw even with broken sub-block
const resilientMountResult = homeMega.mount(null, global.state, events);
assert.strictEqual(resilientMountResult, true, 'Mount remains resilient despite broken sub-block');
assert.ok(capturedErrorEvent != null, 'block:error event received');
assert.strictEqual(capturedErrorEvent.subBlockId, 'broken-widget', 'Error subBlockId matches');

// Clean up broken sub-block
delete homeMega.subBlocks['broken-widget'];

// 5. Event Bus view:sync Propagation Test
console.log('[Test 5] Event Bus view:sync triggers without error');
let errorOccurred = false;
try {
  events.emit('view:sync');
  events.emit('checkin:created');
  events.emit('goal:updated');
} catch (e) {
  errorOccurred = true;
}
assert.strictEqual(errorOccurred, false, 'view:sync events propagated smoothly');

console.log('✨ ALL 5 Home Block Tests Passed Successfully!');
