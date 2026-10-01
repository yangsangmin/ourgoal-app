/**
 * Unit Tests for Community Mega-Block and Sub-Blocks (Shipyard Architecture Phase 6)
 */
const assert = require('assert');
const events = require('../js/core/event-bus');
const registry = require('../js/core/registry');
const store = require('../js/core/store');

const feedSub = require('../js/tabs/comm/sub-feed');
const companionsSub = require('../js/tabs/comm/sub-companions');
const crewSub = require('../js/tabs/comm/sub-crew');
const commMega = require('../js/tabs/comm/index');

console.log('🧪 Testing OurGoal Community Blocks (Shipyard Architecture Phase 6)...');

// 1. Sub-Block Basic Specs Test
console.log('[Test 1] Sub-blocks metadata and methods');
assert.strictEqual(feedSub.id, 'feed', 'Feed sub-block id matches');
assert.strictEqual(typeof feedSub.mount, 'function', 'Feed has mount function');
assert.strictEqual(typeof feedSub.render, 'function', 'Feed has render function');

assert.strictEqual(companionsSub.id, 'companions', 'Companions sub-block id matches');
assert.strictEqual(typeof companionsSub.mount, 'function', 'Companions has mount function');

assert.strictEqual(crewSub.id, 'crew', 'Crew sub-block id matches');
assert.strictEqual(typeof crewSub.mount, 'function', 'Crew has mount function');

// 2. Community MegaBlock Registration & Sub-block Docking Test
console.log('[Test 2] Community MegaBlock registration and sub-block docking');
global.OurgoalRegistry = registry;
global.OurgoalEvents = events;
global.OurgoalStore = store;
global.state = {
  profile: { groups: [], companions: [], cheersReceived: 0 },
  commSubTab: 'feed',
  activeGroupId: null
};

commMega.registerSubBlock(feedSub);
commMega.registerSubBlock(companionsSub);
commMega.registerSubBlock(crewSub);

assert.strictEqual(commMega.id, 'comm', 'MegaBlock id matches');
assert.ok(commMega.subBlocks['feed'], 'Feed sub-block is docked');
assert.ok(commMega.subBlocks['companions'], 'Companions sub-block is docked');
assert.ok(commMega.subBlocks['crew'], 'Crew sub-block is docked');

// 3. Mount Execution & Event Trigger Test
console.log('[Test 3] Mount execution and event emission');
let commMountedEvent = false;
events.once('comm:mounted', () => {
  commMountedEvent = true;
});

const mountSuccess = commMega.mount(null, global.state, events);
assert.strictEqual(mountSuccess, true, 'MegaBlock mount returns true');
assert.strictEqual(commMountedEvent, true, 'comm:mounted event was emitted');

// 4. Watertight Boundary Test in Sub-block Mount
console.log('[Test 4] Watertight error boundary on broken sub-block');
const brokenSubBlock = {
  id: 'broken-comm-widget',
  name: '고장난 소통 소블록',
  mount: () => {
    throw new Error('Simulated comm sub-block crash');
  }
};
commMega.registerSubBlock(brokenSubBlock);

let capturedErrorEvent = null;
events.once('block:error', (data) => {
  capturedErrorEvent = data;
});

// Mounting should NOT throw even with broken sub-block
const resilientMountResult = commMega.mount(null, global.state, events);
assert.strictEqual(resilientMountResult, true, 'Mount remains resilient despite broken sub-block');
assert.ok(capturedErrorEvent != null, 'block:error event received');
assert.strictEqual(capturedErrorEvent.subBlockId, 'broken-comm-widget', 'Error subBlockId matches');

// Clean up broken sub-block
delete commMega.subBlocks['broken-comm-widget'];

// 5. Event Bus view:sync & comm:subtab Propagation Test
console.log('[Test 5] Event Bus comm:subtab & view:sync triggers without error');
let errorOccurred = false;
try {
  events.emit('view:sync');
  events.emit('feed:updated');
  events.emit('cheer:added');
  events.emit('companion:updated');
  events.emit('crew:updated');
} catch (e) {
  errorOccurred = true;
}
assert.strictEqual(errorOccurred, false, 'view:sync events propagated smoothly');

console.log('✨ ALL 5 Community Block Tests Passed Successfully!');
