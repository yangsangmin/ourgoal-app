/**
 * Unit Tests for Goals Mega-Block and Sub-Blocks (Shipyard Architecture Phase 3)
 */
const assert = require('assert');
const events = require('../js/core/event-bus');
const registry = require('../js/core/registry');
const store = require('../js/core/store');

const personal = require('../js/tabs/goals/sub-personal');
const routine = require('../js/tabs/goals/sub-routine');
const team = require('../js/tabs/goals/sub-team');
const goalsMega = require('../js/tabs/goals/index');

console.log('🧪 Testing OurGoal Goals Blocks (Shipyard Architecture Phase 3)...');

// 1. Sub-Block Basic Specs Test
console.log('[Test 1] Sub-blocks metadata and methods');
assert.strictEqual(personal.id, 'personal', 'Personal sub-block id matches');
assert.strictEqual(typeof personal.mount, 'function', 'Personal has mount function');
assert.strictEqual(typeof personal.render, 'function', 'Personal has render function');

assert.strictEqual(routine.id, 'routine', 'Routine sub-block id matches');
assert.strictEqual(typeof routine.mount, 'function', 'Routine has mount function');

assert.strictEqual(team.id, 'team', 'Team sub-block id matches');
assert.strictEqual(typeof team.mount, 'function', 'Team has mount function');

// 2. Goals MegaBlock Registration & Sub-block Docking Test
console.log('[Test 2] Goals MegaBlock registration and sub-block docking');
global.OurgoalRegistry = registry;
global.OurgoalEvents = events;
global.OurgoalStore = store;
global.state = { profile: { goals: [], records: [], settings: {} }, goalsSubTab: 'personal' };

goalsMega.registerSubBlock(personal);
goalsMega.registerSubBlock(routine);
goalsMega.registerSubBlock(team);

assert.strictEqual(goalsMega.id, 'goals', 'MegaBlock id matches');
assert.ok(goalsMega.subBlocks['personal'], 'Personal sub-block is docked');
assert.ok(goalsMega.subBlocks['routine'], 'Routine sub-block is docked');
assert.ok(goalsMega.subBlocks['team'], 'Team sub-block is docked');

// 3. Mount Execution & Event Trigger Test
console.log('[Test 3] Mount execution and event emission');
let goalsMountedEvent = false;
events.once('goals:mounted', () => {
  goalsMountedEvent = true;
});

const mountSuccess = goalsMega.mount(null, global.state, events);
assert.strictEqual(mountSuccess, true, 'MegaBlock mount returns true');
assert.strictEqual(goalsMountedEvent, true, 'goals:mounted event was emitted');

// 4. Watertight Boundary Test in Sub-block Mount
console.log('[Test 4] Watertight error boundary on broken sub-block');
const brokenSubBlock = {
  id: 'broken-goals-widget',
  name: '고장난 목표 소블록',
  mount: () => {
    throw new Error('Simulated goals sub-block crash');
  }
};
goalsMega.registerSubBlock(brokenSubBlock);

let capturedErrorEvent = null;
events.once('block:error', (data) => {
  capturedErrorEvent = data;
});

// Mounting should NOT throw even with broken sub-block
const resilientMountResult = goalsMega.mount(null, global.state, events);
assert.strictEqual(resilientMountResult, true, 'Mount remains resilient despite broken sub-block');
assert.ok(capturedErrorEvent != null, 'block:error event received');
assert.strictEqual(capturedErrorEvent.subBlockId, 'broken-goals-widget', 'Error subBlockId matches');

// Clean up broken sub-block
delete goalsMega.subBlocks['broken-goals-widget'];

// 5. Event Bus view:sync & goal:updated Propagation Test
console.log('[Test 5] Event Bus goal:updated & view:sync triggers without error');
let errorOccurred = false;
try {
  events.emit('view:sync');
  events.emit('goal:updated');
  events.emit('checkin:created');
} catch (e) {
  errorOccurred = true;
}
assert.strictEqual(errorOccurred, false, 'view:sync events propagated smoothly');

console.log('✨ ALL 5 Goals Block Tests Passed Successfully!');
