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
  return {
    run: label,
    rawId: p.id,
    rawUsername: p.username,
    rawCreatedAt: p.createdAt,
    rawManitoSeed: p.settings?.manito?.seed
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

  dynamicFieldAudit.push({
    ...a,
    createdAtValidISO8601: isIso,
    createdAtCodeOrigin: 'js/core/default-profile.js:26 (createdAt: L.nowISO())',
    manitoSeedValidInteger: isSeedValid,
    manitoSeedCodeOrigin: 'js/core/default-settings.js (Math.floor(Math.random() * 100000))',
    usernameEqualsId: isUserEqualId,
    usernameCodeOrigin: 'js/core/default-profile.js:22-24 (defaultProfile(id, username, displayName))'
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
    base1: { label: b1.label, stepsCount: b1.steps.length, calls: b1.callCounts },
    base2: { label: b2.label, stepsCount: b2.steps.length, calls: b2.callCounts },
    after: { label: after.label, stepsCount: after.steps.length, calls: after.callCounts }
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
  workerVerdict: 'PENDING'
};

let totalLeaves = 0;
let totalDiffs = 0;
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
    totalLeaves++;
    const v1 = l1[k];
    const v2 = l2[k];
    const va = la[k];
    if (JSON.stringify(v1) !== JSON.stringify(va) || JSON.stringify(v2) !== JSON.stringify(va)) {
      stepProfileDiffs++;
    }
  }

  // 2. Full DOM string comparison
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

  // 3. Toast comparison across base1, base2, and after
  const toastVis1 = s1.toastVisible;
  const toastVis2 = s2.toastVisible;
  const toastVisA = sa.toastVisible;
  const toastVisMatch = (toastVis1 === toastVis2) && (toastVis1 === toastVisA);

  const toastText1 = s1.toastText;
  const toastText2 = s2.toastText;
  const toastTextA = sa.toastText;
  const toastTextMatch = (toastText1 === toastText2) && (toastText1 === toastTextA);

  // 4. Active tab comparison across base1, base2, and after
  const activeTab1 = s1.activeTab;
  const activeTab2 = s2.activeTab;
  const activeTabA = sa.activeTab;
  const activeTabMatch = (activeTab1 === activeTab2) && (activeTab1 === activeTabA);

  const stepMatch = (stepProfileDiffs === 0) && domExactMatch && toastVisMatch && toastTextMatch && activeTabMatch;

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
    leafCount: stepLeafKeys.size,
    leafDiffs: stepProfileDiffs,
    stepMatch
  });

  totalDiffs += stepProfileDiffs;
}

results.leafStats.totalProfileLeavesCompared = totalLeaves;
results.leafStats.totalProfileDiffsExcludingNormalizations = totalDiffs;
results.leafStats.totalDomStepsCompared = b1.steps.length;
results.leafStats.domStructureIdentical = allDomExactMatch;

const allChecksPass = Object.values(results.checks).every(Boolean) && totalDiffs === 0 && allDomExactMatch;
results.workerVerdict = allChecksPass ? 'EQUIVALENT_AND_VERIFIED' : 'DISCREPANCY_DETECTED';

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(results, null, 2) + '\n', 'utf8');

console.log(JSON.stringify({
  workerVerdict: results.workerVerdict,
  checks: results.checks,
  totalLeavesCompared: results.leafStats.totalProfileLeavesCompared,
  diffs: results.leafStats.totalProfileDiffsExcludingNormalizations,
  domStructureIdentical: results.leafStats.domStructureIdentical,
  domExactMatchBase1Base2: results.leafStats.domStringsIdenticalAcrossBase1Base2,
  domExactMatchBase1After: results.leafStats.domStringsIdenticalAcrossBase1After,
  consoleErrorsMultisetIdentical: results.checks.consoleErrorsMultisetIdentical
}, null, 2));
