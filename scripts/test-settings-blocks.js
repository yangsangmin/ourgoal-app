/**
 * Unit Tests for Settings Mega-Block and Sub-Blocks (Shipyard Architecture Phase 7)
 */
const assert = require('assert');
const events = require('../js/core/event-bus');
const registry = require('../js/core/registry');
const store = require('../js/core/store');

const profileSub = require('../js/tabs/settings/sub-profile');
const securitySub = require('../js/tabs/settings/sub-security');
const appearanceSub = require('../js/tabs/settings/sub-appearance');
const settingsMega = require('../js/tabs/settings/index');

console.log('🧪 Testing OurGoal Settings Blocks (Shipyard Architecture Phase 7)...');

// 1. Sub-Block Basic Specs Test
console.log('[Test 1] Sub-blocks metadata and methods');
assert.strictEqual(profileSub.id, 'profile', 'Profile sub-block id matches');
assert.strictEqual(typeof profileSub.mount, 'function', 'Profile has mount function');
assert.strictEqual(typeof profileSub.render, 'function', 'Profile has render function');

assert.strictEqual(securitySub.id, 'security', 'Security sub-block id matches');
assert.strictEqual(typeof securitySub.mount, 'function', 'Security has mount function');

assert.strictEqual(appearanceSub.id, 'appearance', 'Appearance sub-block id matches');
assert.strictEqual(typeof appearanceSub.mount, 'function', 'Appearance has mount function');

// 2. Settings MegaBlock Registration & Sub-block Docking Test
console.log('[Test 2] Settings MegaBlock registration and sub-block docking');
global.OurgoalRegistry = registry;
global.OurgoalEvents = events;
global.OurgoalStore = store;
global.state = {
  profile: {
    name: '아워골러',
    avatar: '🌱',
    settings: { theme: 'sanctuary', privacy: {} }
  }
};

settingsMega.registerSubBlock(profileSub);
settingsMega.registerSubBlock(securitySub);
settingsMega.registerSubBlock(appearanceSub);

assert.strictEqual(settingsMega.id, 'settings', 'MegaBlock id matches');
assert.ok(settingsMega.subBlocks['profile'], 'Profile sub-block is docked');
assert.ok(settingsMega.subBlocks['security'], 'Security sub-block is docked');
assert.ok(settingsMega.subBlocks['appearance'], 'Appearance sub-block is docked');

// 3. Mount Execution & Event Trigger Test
console.log('[Test 3] Mount execution and event emission');
let settingsMountedEvent = false;
events.once('settings:mounted', () => {
  settingsMountedEvent = true;
});

const mountSuccess = settingsMega.mount(null, global.state, events);
assert.strictEqual(mountSuccess, true, 'MegaBlock mount returns true');
assert.strictEqual(settingsMountedEvent, true, 'settings:mounted event was emitted');

// 4. Watertight Boundary Test in Sub-block Mount
console.log('[Test 4] Watertight error boundary on broken sub-block');
const brokenSubBlock = {
  id: 'broken-settings-widget',
  name: '고장난 설정 소블록',
  mount: () => {
    throw new Error('Simulated settings sub-block crash');
  }
};
settingsMega.registerSubBlock(brokenSubBlock);

let capturedErrorEvent = null;
events.once('block:error', (data) => {
  capturedErrorEvent = data;
});

// Mounting should NOT throw even with broken sub-block
const resilientMountResult = settingsMega.mount(null, global.state, events);
assert.strictEqual(resilientMountResult, true, 'Mount remains resilient despite broken sub-block');
assert.ok(capturedErrorEvent != null, 'block:error event received');
assert.strictEqual(capturedErrorEvent.subBlockId, 'broken-settings-widget', 'Error subBlockId matches');

// Clean up broken sub-block
delete settingsMega.subBlocks['broken-settings-widget'];

// 5. Event Bus view:sync & theme:changed Propagation Test
console.log('[Test 5] Event Bus theme:changed & view:sync triggers without error');
let errorOccurred = false;
try {
  events.emit('view:sync');
  events.emit('theme:changed');
  events.emit('profile:updated');
  events.emit('security:updated');
  events.emit('privacy:updated');
} catch (e) {
  errorOccurred = true;
}
assert.strictEqual(errorOccurred, false, 'view:sync events propagated smoothly');

console.log('✨ ALL 5 Settings Block Tests Passed Successfully!');
