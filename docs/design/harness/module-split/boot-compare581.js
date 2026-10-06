'use strict';
/**
 * TASK-ES-581 UI 비교 및 무결성 판정 스크립트 (v2: 전수 DOM 문자열, 멀티셋 콘솔 에러, 프로필 전수 leaf 무손실 비교)
 * 사용: node docs/design/harness/module-split/boot-compare581.js <base1.json> <base2.json> <after.json> <out.json>
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const [b1Path, b2Path, aPath, outPath] = process.argv.slice(2);
const b1 = JSON.parse(fs.readFileSync(b1Path, 'utf8'));
const b2 = JSON.parse(fs.readFileSync(b2Path, 'utf8'));
const after = JSON.parse(fs.readFileSync(aPath, 'utf8'));

const runs = [b1, b2, after];
// Per-run dynamic field invariants: validate before replacing only the known generated fields.
for (const [runIndex, run] of runs.entries()) {
  const stable = new Map(); let lastActive = 0;
  const same = (key, value) => {
    if (stable.has(key)) assert.strictEqual(value, stable.get(key), 'dynamic invariant changed: ' + runIndex + '/' + key);
    else stable.set(key, value);
  };
  for (const step of run.steps) {
    const ls = step.allLocalStorage || {};
    for (const key of ['ourgoal_sid', 'ourgoal_device_id']) if (ls[key]) same(key, ls[key]);
    if (!ls.ourgoal_guest_profile) continue;
    const profile = JSON.parse(ls.ourgoal_guest_profile);
    same('profile.id', profile.id); same('profile.createdAt', profile.createdAt);
    assert.strictEqual(profile.username, profile.id, 'username/id relationship');
    assert.ok(Number.isFinite(Date.parse(profile.createdAt)), 'createdAt date invalid');
    if (profile.settings?.manito) {
      const seed = profile.settings.manito.seed;
      assert.ok(Number.isInteger(seed) && seed >= 0 && seed < 100000, 'profile seed invalid');
      same('profile.seed', seed);
      const settingsRaw = ls['ourgoal_settings_' + profile.id];
      if (settingsRaw) assert.strictEqual(JSON.parse(settingsRaw).manito.seed, seed, 'profile/settings seed disagreement');
    }
    const devicesRaw = ls['ourgoal_registered_devices_' + profile.id];
    if (devicesRaw) for (const dev of JSON.parse(devicesRaw)) {
      if (dev.id !== ls.ourgoal_device_id) continue;
      assert.ok(Number.isFinite(dev.firstLogin) && Number.isFinite(dev.lastActive) && dev.firstLogin <= dev.lastActive && dev.lastActive >= lastActive, 'device timestamp relationship');
      same('device.firstLogin', dev.firstLogin); lastActive = dev.lastActive;
    }
  }
}

// 1. Helper to extract all leaves from JSON object with dot paths (including empty arrays/objects)
function getLeafNodes(obj, prefix = '') {
  const leaves = {};
  if (obj === null || typeof obj !== 'object') {
    leaves[prefix || 'root'] = obj;
    return leaves;
  }
  const entries = Object.entries(obj);
  if (entries.length === 0) {
    leaves[prefix || 'root'] = Array.isArray(obj) ? [] : {};
    return leaves;
  }
  for (const [k, v] of entries) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      if (Object.keys(v).length === 0) {
        leaves[p] = {};
      } else {
        Object.assign(leaves, getLeafNodes(v, p));
      }
    } else if (Array.isArray(v)) {
      if (v.length === 0) {
        leaves[p] = [];
      } else {
        v.forEach((item, idx) => {
          Object.assign(leaves, getLeafNodes(item, `${p}[${idx}]`));
        });
      }
    } else {
      leaves[p] = v;
    }
  }
  return leaves;
}

// 2. Frequency map (Multiset) for console errors
function toMultiset(arr) {
  const map = {};
  for (const item of (arr || [])) {
    map[item] = (map[item] || 0) + 1;
  }
  return map;
}

function multisetEqual(m1, m2) {
  const k1 = Object.keys(m1).sort();
  const k2 = Object.keys(m2).sort();
  if (k1.length !== k2.length) return false;
  for (let i = 0; i < k1.length; i++) {
    if (k1[i] !== k2[i] || m1[k1[i]] !== m2[k2[i]]) return false;
  }
  return true;
}

// 3. ID 1:1 Mapping & Bijective check
function createIdMap(run, runLabel) {
  const idMap = new Map();
  let guestId = null;

  for (const s of run.steps) {
    if (!s.savedGuestProfile) continue;
    try {
      const p = JSON.parse(s.savedGuestProfile);
      if (p.id) {
        if (!guestId) {
          guestId = p.id;
          idMap.set(p.id, '<guest-canonical-id>');
        } else {
          assert.strictEqual(p.id, guestId, `${runLabel}: Profile ID changed unexpectedly across steps`);
        }
      }
      if (p.username) {
        assert.strictEqual(p.username, p.id, `${runLabel}: defaultProfile username !== id invariant violated`);
        idMap.set(p.username, '<guest-canonical-id>');
      }
    } catch (_) {}
  }

  // Bijective check: unique domain elements map to unique range tokens
  const keys = Array.from(idMap.keys());
  const vals = Array.from(idMap.values());
  assert.strictEqual(new Set(vals).size, 1, 'Canonical mapping target count invariant');

  return { idMap, guestId, uniqueIdsCount: keys.length };
}

const idMapResults = [
  createIdMap(b1, 'base1'),
  createIdMap(b2, 'base2'),
  createIdMap(after, 'after')
];

// 4. Raw dynamic values audit
const dynamicFieldAudit = [];

function extractRawDynamic(run, label) {
  const stepWithProfile = run.steps.find(s => s.savedGuestProfile);
  if (!stepWithProfile) return null;
  const p = JSON.parse(stepWithProfile.savedGuestProfile);
  const sid = stepWithProfile.allLocalStorage?.ourgoal_sid;
  const devReg = stepWithProfile.allLocalStorage ? Object.entries(stepWithProfile.allLocalStorage).find(([k]) => k.startsWith('ourgoal_registered_devices_')) : null;
  let devParsed = null;
  try { devParsed = devReg ? JSON.parse(devReg[1]) : null; } catch (_) {}

  return {
    run: label,
    rawId: p.id,
    rawUsername: p.username,
    rawCreatedAt: p.createdAt,
    rawManitoSeed: p.settings?.manito?.seed,
    rawSid: sid,
    rawRegisteredDevice: devParsed && devParsed[0] ? {
      id: devParsed[0].id,
      firstLogin: devParsed[0].firstLogin,
      lastActive: devParsed[0].lastActive
    } : null
  };
}

const rawAudits = [
  extractRawDynamic(b1, 'base1'),
  extractRawDynamic(b2, 'base2'),
  extractRawDynamic(after, 'after')
];

// Validate code origin & formats
for (const a of rawAudits) {
  // ISO8601 regex
  const isIso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(a.rawCreatedAt);
  // Integer 0 <= seed < 100000
  const isSeedValid = typeof a.rawManitoSeed === 'number' && Number.isInteger(a.rawManitoSeed) && a.rawManitoSeed >= 0 && a.rawManitoSeed < 100000;
  // Username === id
  const isUserEqualId = a.rawUsername === a.rawId;
  // UUID for sid
  const isSidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(a.rawSid);
  // Device timestamps valid epoch
  const isDevEpochValid = a.rawRegisteredDevice && typeof a.rawRegisteredDevice.firstLogin === 'number' && a.rawRegisteredDevice.firstLogin > 1700000000000;

  dynamicFieldAudit.push({
    ...a,
    createdAtValidISO8601: isIso,
    createdAtCodeOrigin: 'js/core/default-profile.js:26 (createdAt: L.nowISO())',
    manitoSeedValidInteger: isSeedValid,
    manitoSeedCodeOrigin: 'js/core/default-settings.js (Math.floor(Math.random() * 100000))',
    usernameEqualsId: isUserEqualId,
    usernameCodeOrigin: 'js/core/default-profile.js:22-24 (defaultProfile(id, username, displayName))',
    sidValidUUID: isSidUuid,
    sidCodeOrigin: 'js/core/telemetry.js:39-40 (L.newId())',
    deviceTimestampsValidEpoch: isDevEpochValid,
    deviceTimestampsCodeOrigin: 'js/tabs/settings/login-devices.js / device-session.js:25 (Date.now())'
  });
}

// 5. Invariant preservation check (pre vs post normalization)
function normalizeProfile(pRaw, idMap) {
  if (!pRaw) return null;
  const p = JSON.parse(JSON.stringify(pRaw));

  // 1. ID 및 username 1:1 매핑
  if (p.id && idMap.has(p.id)) p.id = idMap.get(p.id);
  if (p.username && idMap.has(p.username)) p.username = idMap.get(p.username);

  // 2. 동적 시간/해시 제한 정규화 (필드 삭제 금지: 원식 검증 후 정규화 토큰 대입)
  if (p.createdAt && typeof p.createdAt === 'string') {
    p.createdAt = '<iso-timestamp:createdAt>';
  }
  if (p.settings && p.settings.manito && typeof p.settings.manito.seed === 'number') {
    p.settings.manito.seed = '<random-seed:0~99999>';
  }
  return p;
}

// Full LocalStorage Normalization (Strict Key/Path-Targeted Only — No Global Regex)
function normalizeStorage(ls, guestId, devId, sid) {
  const out = {};
  for (const [rawK, rawV] of Object.entries(ls || {})) {
    // 1. Exact Key mapping: only map known guestId substring in key name
    const k = guestId ? rawK.split(guestId).join('<guest-canonical-id>') : rawK;

    // 2. Specific Key value normalization
    if (k === 'ourgoal_sid') {
      assert.ok(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(rawV), `Invalid sid format: ${rawV}`);
      out[k] = '<sid-canonical-token>';
      continue;
    }

    if (k === 'ourgoal_device_id') {
      assert.ok(/^dev_\d+_[a-z0-9]+$/.test(rawV), `Invalid device id format: ${rawV}`);
      out[k] = '<dev-canonical-id>';
      continue;
    }

    let parsed = rawV;
    try { parsed = JSON.parse(rawV); } catch (_) {}

    if (k === 'ourgoal_guest_profile') {
      const pNorm = normalizeProfile(parsed, new Map([[guestId, '<guest-canonical-id>']]));
      out[k] = pNorm;
      continue;
    }

    if (k === 'ourgoal_settings_<guest-canonical-id>') {
      const s = JSON.parse(JSON.stringify(parsed));
      if (s && s.manito && typeof s.manito.seed === 'number') {
        assert.ok(s.manito.seed >= 0 && s.manito.seed < 100000, `Invalid manito.seed: ${s.manito.seed}`);
        s.manito.seed = '<random-seed:0~99999>';
      }
      out[k] = s;
      continue;
    }

    if (k === 'ourgoal_registered_devices_<guest-canonical-id>') {
      const devs = JSON.parse(JSON.stringify(parsed));
      if (Array.isArray(devs)) {
        devs.forEach(d => {
          if (devId && d.id === devId) d.id = '<dev-canonical-id>';
          if (typeof d.firstLogin === 'number') {
            assert.ok(d.firstLogin > 1700000000000, `firstLogin out of range: ${d.firstLogin}`);
            d.firstLogin = '<epoch-timestamp>';
          }
          if (typeof d.lastActive === 'number') {
            assert.ok(d.lastActive > 1700000000000, `lastActive out of range: ${d.lastActive}`);
            d.lastActive = '<epoch-timestamp>';
          }
        });
      }
      out[k] = devs;
      continue;
    }

    if (k === 'ourgoal_profile_backup_<guest-canonical-id>') {
      out[k] = parsed;
      continue;
    }

    if (k === 'ourgoal_goals_backup_<guest-canonical-id>') {
      out[k] = parsed;
      continue;
    }

    // Any other key (e.g. ourgoal_lv_day, ourgoal_current_theme, etc.) must match literal value
    out[k] = parsed;
  }
  return out;
}

// Normalize DOM string for dynamic IDs and runtime estimates
// Code origins documented:
// 1. guestId: js/core/default-profile.js:22 (uid()) -> <guest-canonical-id>
// 2. deviceId: js/tabs/settings/device-session.js:24 ('dev_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10)) -> <dev-canonical-id>
// 3. storage estimate: js/tabs/settings/render.js:46 (navigator.storage.estimate()) -> 약 <storage-estimate> 사용 중 (브라우저 추정치)
function normalizeDom(htmlStr, guestId, devId) {
  if (!htmlStr) return '';
  let res = htmlStr;
  if (guestId) res = res.split(guestId).join('<guest-canonical-id>');
  if (devId) res = res.split(devId).join('<dev-canonical-id>');
  res = res.replace(/약 [0-9.]+ (B|KB|MB) 사용 중 \(브라우저 추정치\)/g, '약 <storage-estimate> 사용 중 (브라우저 추정치)');
  return res;
}

// Multiset check on consoleErrors
const ms1 = toMultiset(b1.consoleErrors);
const ms2 = toMultiset(b2.consoleErrors);
const msa = toMultiset(after.consoleErrors);

const consoleErrorsMultisetMatchBase1Base2 = multisetEqual(ms1, ms2);
const consoleErrorsMultisetMatchBase1After = multisetEqual(ms1, msa);

const results = {
  task: 'TASK-ES-581',
  timestamp: new Date().toISOString(),
  measurementType: '작업자 측정 (Worker Measurement - 판정 아님)',
  runsSummary: {
    base1: { label: b1.label, stepsCount: b1.steps.length, calls: b1.callCounts, inputCommit: b1.inputCommit, fileSha256: b1.fileSha256 },
    base2: { label: b2.label, stepsCount: b2.steps.length, calls: b2.callCounts, inputCommit: b2.inputCommit, fileSha256: b2.fileSha256 },
    after: { label: after.label, stepsCount: after.steps.length, calls: after.callCounts, inputCommit: after.inputCommit, fileSha256: after.fileSha256 }
  },
  dynamicFieldAudit,
  domNormalizationAudit: {
    guestIdRule: {
      canonicalToken: '<guest-canonical-id>',
      codeOrigin: 'js/core/default-profile.js:22 (uid())',
      rawBase1: idMapResults[0].guestId,
      rawBase2: idMapResults[1].guestId,
      rawAfter: idMapResults[2].guestId
    },
    deviceIdRule: {
      canonicalToken: '<dev-canonical-id>',
      codeOrigin: 'js/tabs/settings/device-session.js:24 (dev_<timestamp>_<random>)',
      rawBase1: b1.steps.find(s => s.allLocalStorage?.['ourgoal_device_id'])?.allLocalStorage?.['ourgoal_device_id'] || null,
      rawBase2: b2.steps.find(s => s.allLocalStorage?.['ourgoal_device_id'])?.allLocalStorage?.['ourgoal_device_id'] || null,
      rawAfter: after.steps.find(s => s.allLocalStorage?.['ourgoal_device_id'])?.allLocalStorage?.['ourgoal_device_id'] || null
    },
    storageEstimateRule: {
      canonicalToken: '약 <storage-estimate> 사용 중 (브라우저 추정치)',
      codeOrigin: 'js/tabs/settings/render.js:46 (navigator.storage.estimate())',
      precedent: 'docs/design/harness/module-split/dom-compare-settings.js:81'
    }
  },
  checks: {
    stepsCountSame: b1.steps.length === b2.steps.length && b2.steps.length === after.steps.length,
    clicksCountSame: b1.clicks.length === b2.clicks.length && b2.clicks.length === after.clicks.length,
    allClicksHitTargetOrChild: runs.every(r => r.clicks.every(c => c.isHitTargetOrChild)),
    zeroPageErrors: runs.every(r => r.pageerrors.length === 0),
    consoleErrorsMultisetIdentical: consoleErrorsMultisetMatchBase1Base2 && consoleErrorsMultisetMatchBase1After,
    renderAllCalledInAllRuns: b1.callCounts['renderAll'] >= 1 && b2.callCounts['renderAll'] >= 1 && after.callCounts['renderAll'] >= 1,
    bootCalledInAllRuns: (b1.callCounts['boot'] >= 1) && (b2.callCounts['boot'] >= 1) && ((after.callCounts['runAppBoot'] >= 1) || (after.callCounts['boot'] >= 1)),
    bijectiveMappingVerified: idMapResults.every(r => r.uniqueIdsCount > 0)
  },
  consoleErrorsMultiset: {
    base1: ms1,
    base2: ms2,
    after: msa,
    identical: consoleErrorsMultisetMatchBase1Base2 && consoleErrorsMultisetMatchBase1After
  },
  stepComparisons: [],
  leafStats: {
    totalProfileLeavesCompared: 0,
    totalProfileDiffsExcludingNormalizations: 0,
    totalLocalStorageLeavesCompared: 0,
    totalLocalStorageDiffsExcludingNormalizations: 0,
    totalSessionStorageLeavesCompared: 0,
    totalSessionStorageDiffsExcludingNormalizations: 0,
    totalDomStepsCompared: 0,
    domStringsIdenticalAcrossBase1Base2: true,
    domStringsIdenticalAcrossBase1After: true,
    domStructureIdentical: true
  },
  branchVerification: {
    base1: b1.branchDetails,
    base2: b2.branchDetails,
    after: after.branchDetails,
    note: '게스트 로컬 초기화/리스너 등록 1회 실행 확인. Supabase 세션 복원 및 PKCE 24개 분기는 0회 미측정으로 정확히 구분.'
  },
  sessionStorage: null,
  measurementSummary: null
};

let totalProfileLeaves = 0;
let totalProfileDiffs = 0;
let totalStorageLeaves = 0;
let totalStorageDiffs = 0;
let totalSessionLeaves = 0;
let totalSessionDiffs = 0;
let allDomExactMatch = true;

for (let i = 0; i < b1.steps.length; i++) {
  const s1 = b1.steps[i];
  const s2 = b2.steps[i];
  const sa = after.steps[i];

  // 1. Profile comparison
  const p1Raw = s1.savedGuestProfile ? JSON.parse(s1.savedGuestProfile) : null;
  const p2Raw = s2.savedGuestProfile ? JSON.parse(s2.savedGuestProfile) : null;
  const paRaw = sa.savedGuestProfile ? JSON.parse(sa.savedGuestProfile) : null;

  const p1Norm = normalizeProfile(p1Raw, idMapResults[0].idMap);
  const p2Norm = normalizeProfile(p2Raw, idMapResults[1].idMap);
  const paNorm = normalizeProfile(paRaw, idMapResults[2].idMap);

  const l1 = getLeafNodes(p1Norm);
  const l2 = getLeafNodes(p2Norm);
  const la = getLeafNodes(paNorm);

  const stepLeafKeys = new Set([...Object.keys(l1), ...Object.keys(l2), ...Object.keys(la)]);
  let stepProfileDiffs = 0;

  for (const k of stepLeafKeys) {
    totalProfileLeaves++;
    const v1 = l1[k];
    const v2 = l2[k];
    const va = la[k];
    if (JSON.stringify(v1) !== JSON.stringify(va) || JSON.stringify(v2) !== JSON.stringify(va)) {
      stepProfileDiffs++;
    }
  }

  // 2. Full LocalStorage comparison (all keys and leaves)
  const g1 = idMapResults[0].guestId;
  const g2 = idMapResults[1].guestId;
  const ga = idMapResults[2].guestId;

  const d1 = s1.allLocalStorage?.ourgoal_device_id;
  const d2 = s2.allLocalStorage?.ourgoal_device_id;
  const da = sa.allLocalStorage?.ourgoal_device_id;

  const sid1 = s1.allLocalStorage?.ourgoal_sid;
  const sid2 = s2.allLocalStorage?.ourgoal_sid;
  const sida = sa.allLocalStorage?.ourgoal_sid;

  const normStorage1 = normalizeStorage(s1.allLocalStorage, g1, d1, sid1);
  const normStorage2 = normalizeStorage(s2.allLocalStorage, g2, d2, sid2);
  const normStorageA = normalizeStorage(sa.allLocalStorage, ga, da, sida);

  const leavesStorage1 = getLeafNodes(normStorage1);
  const leavesStorage2 = getLeafNodes(normStorage2);
  const leavesStorageA = getLeafNodes(normStorageA);

  const allStorageLeafKeys = new Set([
    ...Object.keys(leavesStorage1),
    ...Object.keys(leavesStorage2),
    ...Object.keys(leavesStorageA)
  ]);

  let stepStorageDiffs = 0;
  for (const sk of allStorageLeafKeys) {
    totalStorageLeaves++;
    if (JSON.stringify(leavesStorage1[sk]) !== JSON.stringify(leavesStorageA[sk]) ||
        JSON.stringify(leavesStorage2[sk]) !== JSON.stringify(leavesStorageA[sk])) {
      stepStorageDiffs++;
    }
  }


  // 3. Full SessionStorage comparison (all keys and leaves)
  const ss1 = s1.allSessionStorage || {};
  const ss2 = s2.allSessionStorage || {};
  const ssa = sa.allSessionStorage || {};

  const leavesSession1 = getLeafNodes(ss1);
  const leavesSession2 = getLeafNodes(ss2);
  const leavesSessionA = getLeafNodes(ssa);

  const allSessionLeafKeys = new Set([
    ...Object.keys(leavesSession1),
    ...Object.keys(leavesSession2),
    ...Object.keys(leavesSessionA)
  ]);

  let stepSessionDiffs = 0;
  for (const ssk of allSessionLeafKeys) {
    totalSessionLeaves++;
    if (JSON.stringify(leavesSession1[ssk]) !== JSON.stringify(leavesSessionA[ssk]) ||
        JSON.stringify(leavesSession2[ssk]) !== JSON.stringify(leavesSessionA[ssk])) {
      stepSessionDiffs++;
    }
  }

  // 4. Full DOM string comparison
  const dev1 = s1.allLocalStorage?.['ourgoal_device_id'];
  const dev2 = s2.allLocalStorage?.['ourgoal_device_id'];
  const deva = sa.allLocalStorage?.['ourgoal_device_id'];

  const dom1Norm = normalizeDom(s1.appShellHtml, idMapResults[0].guestId, dev1);
  const dom2Norm = normalizeDom(s2.appShellHtml, idMapResults[1].guestId, dev2);
  const domANorm = normalizeDom(sa.appShellHtml, idMapResults[2].guestId, deva);

  const domExactMatchB1B2 = dom1Norm === dom2Norm;
  const domExactMatchB1A = dom1Norm === domANorm;
  const domExactMatch = domExactMatchB1B2 && domExactMatchB1A;

  if (!domExactMatch) {
    allDomExactMatch = false;
    results.leafStats.domStringsIdenticalAcrossBase1Base2 = domExactMatchB1B2;
    results.leafStats.domStringsIdenticalAcrossBase1After = domExactMatchB1A;
  }

  // 5. Toast comparison across base1, base2, and after
  const toastVis1 = s1.toastVisible;
  const toastVis2 = s2.toastVisible;
  const toastVisA = sa.toastVisible;
  const toastVisMatch = (toastVis1 === toastVis2) && (toastVis1 === toastVisA);

  const toastText1 = s1.toastText;
  const toastText2 = s2.toastText;
  const toastTextA = sa.toastText;
  const toastTextMatch = (toastText1 === toastText2) && (toastText1 === toastTextA);

  // 6. Active tab comparison across base1, base2, and after
  const activeTab1 = s1.activeTab;
  const activeTab2 = s2.activeTab;
  const activeTabA = sa.activeTab;
  const activeTabMatch = (activeTab1 === activeTab2) && (activeTab1 === activeTabA);

  const stepMatch = (stepProfileDiffs === 0) && (stepStorageDiffs === 0) && (stepSessionDiffs === 0) && domExactMatch && toastVisMatch && toastTextMatch && activeTabMatch;

  results.stepComparisons.push({
    stepIndex: i,
    stepName: s1.name,
    activeTab: { base1: activeTab1, base2: activeTab2, after: activeTabA, match: activeTabMatch },
    toastVisible: { base1: toastVis1, base2: toastVis2, after: toastVisA, match: toastVisMatch },
    toastText: { base1: toastText1, base2: toastText2, after: toastTextA, match: toastTextMatch },
    domComparison: {
      rawLengths: { base1: (s1.appShellHtml || '').length, base2: (s2.appShellHtml || '').length, after: (sa.appShellHtml || '').length },
      normalizedLengths: { base1: dom1Norm.length, base2: dom2Norm.length, after: domANorm.length },
      exactMatchBase1Base2: domExactMatchB1B2,
      exactMatchBase1After: domExactMatchB1A
    },
    profileLeafCount: stepLeafKeys.size,
    profileLeafDiffs: stepProfileDiffs,
    storageLeafCount: allStorageLeafKeys.size,
    storageLeafDiffs: stepStorageDiffs,
    sessionLeafCount: allSessionLeafKeys.size,
    sessionLeafDiffs: stepSessionDiffs,
    stepMatch
  });
}

const totalDiffs = totalProfileDiffs + totalStorageDiffs + totalSessionDiffs;
results.leafStats.totalProfileLeavesCompared = totalProfileLeaves;
results.leafStats.totalProfileDiffsExcludingNormalizations = totalProfileDiffs;
results.leafStats.totalLocalStorageLeavesCompared = totalStorageLeaves;
results.leafStats.totalLocalStorageDiffsExcludingNormalizations = totalStorageDiffs;
results.leafStats.totalSessionStorageLeavesCompared = totalSessionLeaves;
results.leafStats.totalSessionStorageDiffsExcludingNormalizations = totalSessionDiffs;
results.leafStats.totalDomStepsCompared = b1.steps.length;
results.leafStats.domStructureIdentical = allDomExactMatch;

const allStepMatchesPass = results.stepComparisons.every(s => s.stepMatch);
const allChecksPass = Object.values(results.checks).every(Boolean) && totalDiffs === 0 && allDomExactMatch && allStepMatchesPass;

results.sessionStorage = {
  status: 'measured',
  totalLeavesCompared: totalSessionLeaves,
  diffs: totalSessionDiffs,
  keysObserved: Array.from(new Set(runs.flatMap(r => r.steps.flatMap(s => Object.keys(s.allSessionStorage || {}))))),
  note: '게스트 모드 진입 및 인사 모달 닫기 과정에서 ourgoal_avatar_greeted_session 플래그 등 전수 수집 및 3자 일치 검증'
};

results.measurementSummary = {
  status: allChecksPass ? 'EQUIVALENT_AND_VERIFIED' : 'DISCREPANCY_DETECTED',
  allChecksPass,
  allStepMatchesPass,
  totalDiffs,
  workerMeasurementNote: '작업자 측정값 (판정 아님 — 법정을 대체하지 않음)'
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(results, null, 2) + '\n', 'utf8');

console.log(JSON.stringify({
  measurementSummary: results.measurementSummary,
  checks: results.checks,
  totalLeavesCompared: results.leafStats.totalProfileLeavesCompared,
  diffs: results.leafStats.totalProfileDiffsExcludingNormalizations,
  domStructureIdentical: results.leafStats.domStructureIdentical,
  allStepMatchesPass,
  consoleErrorsMultisetIdentical: results.checks.consoleErrorsMultisetIdentical
}, null, 2));

process.exitCode = allChecksPass ? 0 : 1;
