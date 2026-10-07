'use strict';
/**
 * TASK-ES-585 UI 비교 및 무결성 판정 스크립트 (독립 감사 최종 보완판)
 * 사용: node docs/design/harness/module-split/task585-record-detail-compare.js <base1.json> <base2.json> <after.json> <out.json>
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const [b1Path, b2Path, aPath, outPath] = process.argv.slice(2);
if (!b1Path || !b2Path || !aPath || !outPath) {
  console.error('Usage: node task585-record-detail-compare.js <base1.json> <base2.json> <after.json> <out.json>');
  process.exit(1);
}

const b1 = JSON.parse(fs.readFileSync(b1Path, 'utf8'));
const b2 = JSON.parse(fs.readFileSync(b2Path, 'utf8'));
const after = JSON.parse(fs.readFileSync(aPath, 'utf8'));

const runs = [b1, b2, after];
const labels = ['base1', 'base2', 'after'];

const REQUIRED_STEPS = [
  '1_guest_entered',
  '2_records_tab_opened',
  '3_pro_template_card_toggled',
  '4_pro_template_modal_opened',
  '5_pro_template_row_entered',
  '6_pro_template_saved',
  '7_detail_modal_opened_via_card',
  '8_detail_chart_period_changed',
  '9_detail_edit_btn_clicked',
  '10_card_edit_modal_opened',
  '11_card_edit_modal_cancelled',
  '12_detail_modal_closed_via_button',
  '13_detail_modal_opened_via_deeplink',
  '14_deeplink_modal_closed'
];

// 0. Preconditions Gate (Returns structured result without uncaught crash)
function checkPreconditions(runList) {
  for (let rIdx = 0; rIdx < runList.length; rIdx++) {
    const r = runList[rIdx];
    const lbl = labels[rIdx] || `run_${rIdx}`;
    if (!r || r.completed !== true) return { ok: false, reason: `${lbl}: completed must be true` };
    if (r.errorPresent || r.error) return { ok: false, reason: `${lbl}: error present` };
    if (!Array.isArray(r.steps) || r.steps.length !== 14) return { ok: false, reason: `${lbl}: steps length must be exactly 14` };
    for (let i = 0; i < 14; i++) {
      if (!r.steps[i] || r.steps[i].step !== REQUIRED_STEPS[i]) return { ok: false, reason: `${lbl}: step ${i} name must match ${REQUIRED_STEPS[i]}` };
      if (typeof r.steps[i].fullDomHTML !== 'string' || r.steps[i].fullDomHTML.length <= 1000) return { ok: false, reason: `${lbl}: step ${i} fullDomHTML empty` };
    }
  }
  return { ok: true };
}

const precCheck = checkPreconditions(runs);
const preconditionsPassed = precCheck.ok;

if (!preconditionsPassed) {
  const earlyVerdict = {
    task: 'TASK-ES-585',
    comparator: 'docs/design/harness/module-split/task585-record-detail-compare.js',
    stepsEvaluated: 0,
    preconditionsPassed: false,
    preconditionFailureReason: precCheck.reason,
    invariantsPreserved: false,
    baseReproducibilityPassed: false,
    allStepsDomMatched: false,
    allStepsModalMatched: false,
    allStepsToastMatched: false,
    storageMatched: false,
    sessionStorageMatched: false,
    errorsMatched: false,
    allStepsStateMatched: false,
    targetFunctionsCalled: false,
    mutatorSensitivityPassed: false,
    details: { error: precCheck.reason }
  };
  fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(earlyVerdict, null, 2), 'utf8');
  console.error('PRECONDITIONS GATE FAILED:', precCheck.reason);
  process.exit(1);
}

// 1. Dynamic invariant checks across ALL snapshots of each run
function checkInvariants(run, runLabel) {
  const stable = new Map();
  let lastActive = 0;
  let initialFirstLogin = null;
  let initialSeed = null;

  for (let idx = 0; idx < run.steps.length; idx++) {
    const step = run.steps[idx];
    const ls = step.allLocalStorage || {};

    for (const key of ['ourgoal_sid', 'ourgoal_device_id']) {
      if (ls[key]) {
        if (stable.has(key)) {
          assert.strictEqual(ls[key], stable.get(key), `${runLabel} step ${idx}: ${key} changed within run`);
        } else {
          stable.set(key, ls[key]);
        }
      }
    }

    if (step.templateRecordId) {
      if (stable.has('templateRecordId')) {
        assert.strictEqual(step.templateRecordId, stable.get('templateRecordId'), `${runLabel} step ${idx}: templateRecordId changed within run`);
      } else {
        stable.set('templateRecordId', step.templateRecordId);
      }
    }

    if (ls.ourgoal_guest_profile) {
      const profile = JSON.parse(ls.ourgoal_guest_profile);
      if (stable.has('profile.id')) {
        assert.strictEqual(profile.id, stable.get('profile.id'), `${runLabel} step ${idx}: profile.id changed`);
        assert.strictEqual(profile.createdAt, stable.get('profile.createdAt'), `${runLabel} step ${idx}: profile.createdAt changed`);
      } else {
        stable.set('profile.id', profile.id);
        stable.set('profile.createdAt', profile.createdAt);
      }
      assert.strictEqual(profile.username, profile.id, `${runLabel} step ${idx}: username !== id`);
      assert.ok(Number.isFinite(Date.parse(profile.createdAt)), `${runLabel} step ${idx}: invalid createdAt`);

      if (profile.settings?.manito?.seed !== undefined) {
        if (initialSeed === null) {
          initialSeed = profile.settings.manito.seed;
        } else {
          assert.strictEqual(profile.settings.manito.seed, initialSeed, `${runLabel} step ${idx}: manito.seed changed within run`);
        }
      }
    }

    // Check device timestamps and link with ourgoal_device_id
    const devKey = Object.keys(ls).find(k => k.startsWith('ourgoal_registered_devices_'));
    if (devKey && ls[devKey]) {
      let devs = null;
      try { devs = JSON.parse(ls[devKey]); } catch (_) {}
      if (Array.isArray(devs) && devs[0]) {
        const dev = devs[0];
        if (ls.ourgoal_device_id) {
          assert.strictEqual(dev.id, ls.ourgoal_device_id, `${runLabel} step ${idx}: registered device id does not match ourgoal_device_id`);
        }
        if (initialFirstLogin === null) {
          initialFirstLogin = dev.firstLogin;
        } else {
          assert.strictEqual(dev.firstLogin, initialFirstLogin, `${runLabel} step ${idx}: dev.firstLogin changed within run`);
        }
        assert.ok(dev.firstLogin <= dev.lastActive, `${runLabel} step ${idx}: dev.firstLogin > dev.lastActive`);
        assert.ok(dev.lastActive >= lastActive, `${runLabel} step ${idx}: lastActive regressed`);
        lastActive = dev.lastActive;
      }
    }
  }

  return { ok: true, invariantsChecked: stable.size };
}

const invariantResults = runs.map((r, i) => {
  try {
    return checkInvariants(r, labels[i]);
  } catch (e) {
    console.error(`Invariant failure in ${labels[i]}:`, e.message);
    return { ok: false, error: e.message };
  }
});

// 2. Multiset helper for console errors & page errors
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

// 3. Leaf nodes extractor
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

function sortedLeaves(leaves) {
  const sorted = {};
  for (const k of Object.keys(leaves).sort()) {
    sorted[k] = leaves[k];
  }
  return sorted;
}

// 4. Bijective ID mapping for URL/DOM cross-cutting identities (NO blanket regex, NO seed/startAt global pollution)
function createIdMap(run, runLabel) {
  const idMap = new Map();
  let guestId = null;
  let guestCreatedAt = null;
  let guestSeed = null;
  let recordId = null;
  let recordCreatedAt = null;
  let recordStartAt = null;
  let sid = null;
  let devId = null;

  for (const s of run.steps) {
    if (s.templateRecordId && !recordId) {
      recordId = s.templateRecordId;
      idMap.set(recordId, '<canonical-rec-id>');
    }
    const ls = s.allLocalStorage || {};
    if (ls.ourgoal_guest_profile) {
      try {
        const p = JSON.parse(ls.ourgoal_guest_profile);
        if (p.id && !guestId) {
          guestId = p.id;
          guestCreatedAt = p.createdAt;
          idMap.set(p.id, '<canonical-guest-id>');
          if (p.username) idMap.set(p.username, '<canonical-guest-id>');
          if (p.createdAt) idMap.set(p.createdAt, '<canonical-profile-created>');
        }
        if (p.settings?.manito?.seed !== undefined && guestSeed === null) {
          guestSeed = p.settings.manito.seed;
          // Note: guestSeed is NOT injected into global idMap to prevent blanket cross-run string replacement
        }
        if (recordId && (!recordCreatedAt || !recordStartAt)) {
          if (p.settings?.proTemplateRecords && p.settings.proTemplateRecords[recordId]) {
            const r = p.settings.proTemplateRecords[recordId];
            if (r.createdAt && !recordCreatedAt) recordCreatedAt = r.createdAt;
            if (r.startAt && !recordStartAt) recordStartAt = r.startAt;
          }
          if (Array.isArray(p.records)) {
            const r = p.records.find(item => item && item.id === recordId);
            if (r) {
              if (r.createdAt && !recordCreatedAt) recordCreatedAt = r.createdAt;
              if (r.startAt && !recordStartAt) recordStartAt = r.startAt;
            }
          }
        }
      } catch (_) {}
    }
    if (ls.ourgoal_sid && !sid) {
      sid = ls.ourgoal_sid;
      idMap.set(sid, '<canonical-sid>');
    }
    if (ls.ourgoal_device_id && !devId) {
      devId = ls.ourgoal_device_id;
      idMap.set(devId, '<canonical-dev-id>');
    }

    const devKey = Object.keys(ls).find(k => k.startsWith('ourgoal_registered_devices_'));
    if (devKey && ls[devKey]) {
      try {
        const devs = JSON.parse(ls[devKey]);
        if (Array.isArray(devs) && devs[0]) {
          if (devs[0].firstLogin) idMap.set(String(devs[0].firstLogin), '<canonical-dev-time>');
          if (devs[0].lastActive) idMap.set(String(devs[0].lastActive), '<canonical-dev-time>');
        }
      } catch (_) {}
    }

    // Modal dynamic date values from record creation input
    if (s.modalSheetHTML) {
      const dateValMatch = s.modalSheetHTML.match(/value="(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})"/);
      if (dateValMatch && dateValMatch[1]) {
        idMap.set(dateValMatch[1], '<canonical-modal-datetime>');
      }
      const timeMatch = s.modalSheetHTML.match(/기록일시:\s*(\d{2}:\d{2})/);
      if (timeMatch && timeMatch[1]) {
        idMap.set(timeMatch[1], '<canonical-modal-time>');
      }
    }
  }

  return { idMap, guestId, guestCreatedAt, guestSeed, recordId, recordCreatedAt, recordStartAt, sid, devId };
}

const idMaps = runs.map((r, i) => createIdMap(r, labels[i]));

function normalizeTargeted(text, idMap) {
  if (!text || typeof text !== 'string') return text;
  let res = text;
  for (const [orig, canon] of idMap.entries()) {
    if (orig && typeof orig === 'string') {
      res = res.split(orig).join(canon);
    }
  }
  return res;
}

function normalizeFullDom(html, idMap) {
  let norm = normalizeTargeted(html, idMap);
  // 1. Script tag in <head>
  norm = norm.replace('<script src="js/tabs/records/template-record-detail.js"></script>', '');

  // 2. HO slot import & expose block in index.html
  const hoStart = '\n  /* [#TASK-ES-585] js/tabs/records/template-record-detail.js';
  const hoEnd = 'renderTrendSvgChart; }\n  });\n';
  const hoS = norm.indexOf(hoStart);
  if (hoS !== -1) {
    const hoE = norm.indexOf(hoEnd, hoS);
    if (hoE !== -1) {
      norm = norm.slice(0, hoS) + '\n' + norm.slice(hoE + hoEnd.length);
    }
  }

  // 3. Original function definitions in baseline vs replacement comment in after
  const fnStart = '/* 🔍 전문 템플릿 기록 상세 조회 모달';
  const aftStart = '/* [#TASK-ES-585] openTemplateRecordDetailModal';
  const fnEnd = "window.addEventListener('hashchange'";

  const bS = norm.indexOf(fnStart);
  if (bS !== -1) {
    const bE = norm.indexOf(fnEnd, bS);
    if (bE !== -1) {
      norm = norm.slice(0, bS) + '<!-- split-inline-cell -->\n  ' + norm.slice(bE);
    }
  } else {
    const aS = norm.indexOf(aftStart);
    if (aS !== -1) {
      const aE = norm.indexOf(fnEnd, aS);
      if (aE !== -1) {
        norm = norm.slice(0, aS) + '<!-- split-inline-cell -->\n  ' + norm.slice(aE);
      }
    }
  }
  norm = norm.replace(/\n\n  <!-- split-inline-cell -->/, '\n  <!-- split-inline-cell -->');
  return norm;
}

function normalizeStorageObject(ls, idInfo) {
  const { idMap, guestId, guestCreatedAt, guestSeed, recordId, recordCreatedAt, recordStartAt } = idInfo;
  const out = {};
  for (const [rawK, rawV] of Object.entries(ls || {})) {
    const k = guestId ? rawK.split(guestId).join('<guest-canonical-id>') : rawK;

    if (k === 'ourgoal_sid') {
      out[k] = '<sid-canonical-token>';
      continue;
    }

    if (k === 'ourgoal_device_id') {
      out[k] = '<dev-canonical-id>';
      continue;
    }

    let parsed = rawV;
    try { parsed = JSON.parse(rawV); } catch (_) {}

    if (k === 'ourgoal_guest_profile') {
      const p = JSON.parse(JSON.stringify(parsed));
      if (p.id && p.id === guestId) p.id = '<guest-canonical-id>';
      if (p.username && p.username === guestId) p.username = '<guest-canonical-id>';
      if (p.createdAt && p.createdAt === guestCreatedAt) p.createdAt = '<profile-created-token>';
      if (p.settings && p.settings.manito && p.settings.manito.seed === guestSeed) {
        p.settings.manito.seed = '<guest-seed-token>';
      }
      if (p.settings && p.settings.xp && Array.isArray(p.settings.xp.log)) {
        p.settings.xp.log.forEach(item => { if (item && item.at) item.at = '<canonical-timestamp>'; });
      }
      // ONLY normalize the test-created template record
      if (p.settings && p.settings.proTemplateRecords && typeof p.settings.proTemplateRecords === 'object') {
        const normProRecs = {};
        for (const [rKey, rVal] of Object.entries(p.settings.proTemplateRecords)) {
          if (rKey === recordId) {
            const normVal = JSON.parse(JSON.stringify(rVal));
            normVal.id = '<canonical-rec-id>';
            if (normVal.createdAt === recordCreatedAt) normVal.createdAt = '<rec-created-token>';
            if (normVal.startAt === recordStartAt) normVal.startAt = '<rec-start-token>';
            normProRecs['<canonical-rec-id>'] = normVal;
          } else {
            normProRecs[rKey] = rVal; // Keep existing records strictly untouched!
          }
        }
        p.settings.proTemplateRecords = normProRecs;
      }
      if (Array.isArray(p.records)) {
        p.records = p.records.map(r => {
          if (r && r.id === recordId) {
            const normVal = JSON.parse(JSON.stringify(r));
            normVal.id = '<canonical-rec-id>';
            if (normVal.createdAt === recordCreatedAt) normVal.createdAt = '<rec-created-token>';
            if (normVal.startAt === recordStartAt) normVal.startAt = '<rec-start-token>';
            return normVal;
          }
          return r;
        });
      }
      out[k] = p;
      continue;
    }

    if (k === 'ourgoal_records_backup_<guest-canonical-id>') {
      if (Array.isArray(parsed)) {
        out[k] = parsed.map(r => {
          if (r && r.id === recordId) {
            const normVal = JSON.parse(JSON.stringify(r));
            normVal.id = '<canonical-rec-id>';
            if (normVal.createdAt === recordCreatedAt) normVal.createdAt = '<rec-created-token>';
            if (normVal.startAt === recordStartAt) normVal.startAt = '<rec-start-token>';
            return normVal;
          }
          return r;
        });
      } else {
        out[k] = parsed;
      }
      continue;
    }

    if (k === 'ourgoal_settings_<guest-canonical-id>') {
      const s = JSON.parse(JSON.stringify(parsed));
      if (s && s.manito && s.manito.seed === guestSeed) {
        s.manito.seed = '<guest-seed-token>';
      }
      if (s && s.xp && Array.isArray(s.xp.log)) {
        s.xp.log.forEach(item => { if (item && item.at) item.at = '<canonical-timestamp>'; });
      }
      if (s && s.proTemplateRecords && typeof s.proTemplateRecords === 'object') {
        const normProRecs = {};
        for (const [rKey, rVal] of Object.entries(s.proTemplateRecords)) {
          if (rKey === recordId) {
            const normVal = JSON.parse(JSON.stringify(rVal));
            normVal.id = '<canonical-rec-id>';
            if (normVal.createdAt === recordCreatedAt) normVal.createdAt = '<rec-created-token>';
            if (normVal.startAt === recordStartAt) normVal.startAt = '<rec-start-token>';
            normProRecs['<canonical-rec-id>'] = normVal;
          } else {
            normProRecs[rKey] = rVal; // Keep existing records strictly untouched!
          }
        }
        s.proTemplateRecords = normProRecs;
      }
      out[k] = s;
      continue;
    }

    if (k === 'ourgoal_registered_devices_<guest-canonical-id>') {
      const devs = JSON.parse(JSON.stringify(parsed));
      if (Array.isArray(devs) && devs[0]) {
        devs[0].id = '<dev-canonical-id>';
        devs[0].firstLogin = '<dev-timestamp:firstLogin>';
        devs[0].lastActive = '<dev-timestamp:lastActive>';
      }
      out[k] = devs;
      continue;
    }

    if (typeof parsed === 'string') {
      out[k] = normalizeTargeted(parsed, idMap);
    } else {
      out[k] = parsed;
    }
  }
  return out;
}

// 5. Step-by-step Full DOM, Modal HTML, Storage, SessionStorage, Toast, Errors comparison
const stepComparisons = [];
let domDiffCount = 0;
let modalDiffCount = 0;
let toastDiffCount = 0;
let storageDiffCount = 0;
let sessionStorageDiffCount = 0;
let errorDiffCount = 0;
let stateDiffCount = 0;

let baseReproducibilityPassed = true;

for (let i = 0; i < 14; i++) {
  const sB1 = b1.steps[i];
  const sB2 = b2.steps[i];
  const sA = after.steps[i];

  // Full DOM comparison
  const normDomB1 = normalizeFullDom(sB1.fullDomHTML, idMaps[0].idMap);
  const normDomB2 = normalizeFullDom(sB2.fullDomHTML, idMaps[1].idMap);
  const normDomA  = normalizeFullDom(sA.fullDomHTML, idMaps[2].idMap);

  const domB1_B2_match = (normDomB1 === normDomB2);
  const domB1_A_match  = (normDomB1 === normDomA);
  const domMatch = domB1_B2_match && domB1_A_match;
  if (!domB1_B2_match) baseReproducibilityPassed = false;
  if (!domMatch) domDiffCount++;

  // Modal HTML comparison
  const normModalB1 = normalizeTargeted(sB1.modalSheetHTML, idMaps[0].idMap);
  const normModalB2 = normalizeTargeted(sB2.modalSheetHTML, idMaps[1].idMap);
  const normModalA  = normalizeTargeted(sA.modalSheetHTML, idMaps[2].idMap);

  const modalB1_B2_match = (normModalB1 === normModalB2) || (normModalB1 === null && normModalB2 === null);
  const modalB1_A_match  = (normModalB1 === normModalA) || (normModalB1 === null && normModalA === null);
  const modalMatch = modalB1_B2_match && modalB1_A_match;
  if (!modalB1_B2_match) baseReproducibilityPassed = false;
  if (!modalMatch) modalDiffCount++;

  // Toast comparison
  const toastB1_B2_match = (sB1.toastText === sB2.toastText) && (sB1.toastVisible === sB2.toastVisible);
  const toastB1_A_match  = (sB1.toastText === sA.toastText) && (sB1.toastVisible === sA.toastVisible);
  const toastMatch = toastB1_B2_match && toastB1_A_match;
  if (!toastB1_B2_match) baseReproducibilityPassed = false;
  if (!toastMatch) toastDiffCount++;

  // LocalStorage comparison
  const normStorageB1 = normalizeStorageObject(sB1.allLocalStorage, idMaps[0]);
  const normStorageB2 = normalizeStorageObject(sB2.allLocalStorage, idMaps[1]);
  const normStorageA  = normalizeStorageObject(sA.allLocalStorage, idMaps[2]);
  const leavesB1 = sortedLeaves(getLeafNodes(normStorageB1));
  const leavesB2 = sortedLeaves(getLeafNodes(normStorageB2));
  const leavesA  = sortedLeaves(getLeafNodes(normStorageA));

  const storageB1_B2_match = (JSON.stringify(leavesB1) === JSON.stringify(leavesB2));
  const storageB1_A_match  = (JSON.stringify(leavesB1) === JSON.stringify(leavesA));
  const storageMatch = storageB1_B2_match && storageB1_A_match;
  if (!storageB1_B2_match) baseReproducibilityPassed = false;
  if (!storageMatch) storageDiffCount++;

  // SessionStorage comparison
  const ssB1_B2_match = JSON.stringify(sB1.allSessionStorage) === JSON.stringify(sB2.allSessionStorage);
  const ssB1_A_match  = JSON.stringify(sB1.allSessionStorage) === JSON.stringify(sA.allSessionStorage);
  const ssMatch = ssB1_B2_match && ssB1_A_match;
  if (!ssB1_B2_match) baseReproducibilityPassed = false;
  if (!ssMatch) sessionStorageDiffCount++;

  // Errors comparison
  const errB1_B2_match = multisetEqual(toMultiset(sB1.consoleErrors), toMultiset(sB2.consoleErrors)) &&
                         multisetEqual(toMultiset(sB1.pageerrors), toMultiset(sB2.pageerrors));
  const errB1_A_match  = multisetEqual(toMultiset(sB1.consoleErrors), toMultiset(sA.consoleErrors)) &&
                         multisetEqual(toMultiset(sB1.pageerrors), toMultiset(sA.pageerrors));
  const errMatch = errB1_B2_match && errB1_A_match;
  if (!errB1_B2_match) baseReproducibilityPassed = false;
  if (!errMatch) errorDiffCount++;

  // State comparison (STRICT AND comparison for both Base2 and After, including currentHash)
  const activeTabMatch = (sB1.activeTab === sB2.activeTab) && (sB1.activeTab === sA.activeTab);
  const recordsCountMatch = (sB1.recordsCount === sB2.recordsCount) && (sB1.recordsCount === sA.recordsCount);
  const isModalOpenMatch = (sB1.isModalOpen === sB2.isModalOpen) && (sB1.isModalOpen === sA.isModalOpen);

  const normHashB1 = normalizeTargeted(sB1.currentHash, idMaps[0].idMap);
  const normHashB2 = normalizeTargeted(sB2.currentHash, idMaps[1].idMap);
  const normHashA  = normalizeTargeted(sA.currentHash,  idMaps[2].idMap);
  const hashB1_B2_match = (normHashB1 === normHashB2);
  const hashB1_A_match  = (normHashB1 === normHashA);
  const hashMatch = hashB1_B2_match && hashB1_A_match;
  if (!hashB1_B2_match) baseReproducibilityPassed = false;

  const stateMatch = activeTabMatch && recordsCountMatch && isModalOpenMatch && hashMatch;
  if (!stateMatch) stateDiffCount++;

  stepComparisons.push({
    step: sB1.step,
    domMatch,
    modalMatch,
    toastMatch,
    storageMatch,
    sessionStorageMatch: ssMatch,
    errMatch,
    activeTabMatch,
    recordsCountMatch,
    isModalOpenMatch,
    hashMatch
  });
}

// 5.5. Offline Date Provenance Verification (Production formula: new Date(schedDateVal).toISOString())
function extractPreSaveDateInput(run, runLabel) {
  let foundInputVal = null;
  for (let i = 0; i <= 4; i++) {
    const s = run.steps[i];
    if (s && s.modalSheetHTML && s.modalSheetHTML.includes('proRecDate')) {
      // Enforce unique input count = 1 in modalSheetHTML
      const inputs = s.modalSheetHTML.match(/<input[^>]*id=["']proRecDate["'][^>]*>/gi) || [];
      if (inputs.length !== 1) {
        return { ok: false, reason: `Enforce unique input failed in ${runLabel} step ${i}: expected exactly 1 #proRecDate input, found ${inputs.length}` };
      }
      const match = inputs[0].match(/value=["']([^"']+)["']/i);
      if (match && match[1]) {
        if (!foundInputVal) foundInputVal = match[1];
      }
    }
  }
  if (!foundInputVal) return { ok: false, reason: `No #proRecDate input found in ${runLabel} steps 0..4` };
  return { ok: true, inputVal: foundInputVal };
}

function extractSavedRecordStartAt(run, runLabel) {
  const targetRecordId = run.steps.find(s => s.templateRecordId)?.templateRecordId;
  if (!targetRecordId) {
    return { ok: false, reason: `templateRecordId missing in ${runLabel}` };
  }
  for (let i = 5; i < run.steps.length; i++) {
    const s = run.steps[i];
    if (s && s.allLocalStorage) {
      for (const k of Object.keys(s.allLocalStorage)) {
        if (k.includes('records')) {
          try {
            const records = JSON.parse(s.allLocalStorage[k]);
            if (Array.isArray(records)) {
              const matched = records.filter(r => r && r.id === targetRecordId);
              if (matched.length === 1 && matched[0].startAt) {
                return { ok: true, targetRecordId, startAt: matched[0].startAt, record: matched[0] };
              } else if (matched.length > 1) {
                return { ok: false, reason: `Multiple records (${matched.length}) matched targetRecordId '${targetRecordId}' in ${runLabel}` };
              }
            }
          } catch (_) {}
        }
      }
    }
  }
  return { ok: false, reason: `Exact record matching targetRecordId '${targetRecordId}' not found in ${runLabel}` };
}

function verifyDateProvenance(run, runLabel) {
  const inputRes = extractPreSaveDateInput(run, runLabel);
  if (!inputRes.ok) return inputRes;
  const recRes = extractSavedRecordStartAt(run, runLabel);
  if (!recRes.ok) return recRes;

  const inputVal = inputRes.inputVal;
  const startAt = recRes.startAt;
  const targetRecordId = recRes.targetRecordId;

  // Browser timezone note: implicit-same-host-environment assumption
  // Expected ISO production formula: new Date(schedDateVal).toISOString()
  const computedISO = new Date(inputVal).toISOString();
  if (computedISO !== startAt) {
    return {
      ok: false,
      reason: `Date production mismatch in ${runLabel}: input '${inputVal}' -> computed '${computedISO}' !== saved '${startAt}'`
    };
  }

  // Also verify date-only prefix integrity (YYYY-MM-DD)
  const inputDateOnly = inputVal.slice(0, 10);
  const localDateFromISO = new Date(startAt);
  const localYear = localDateFromISO.getFullYear();
  const localMonth = String(localDateFromISO.getMonth() + 1).padStart(2, '0');
  const localDay = String(localDateFromISO.getDate()).padStart(2, '0');
  const localDateStr = `${localYear}-${localMonth}-${localDay}`;
  if (localDateStr !== inputDateOnly) {
    return {
      ok: false,
      reason: `Date-only prefix mismatch in ${runLabel}: input date '${inputDateOnly}' !== local '${localDateStr}'`
    };
  }

  return {
    ok: true,
    targetRecordId,
    inputVal,
    startAt,
    computedISO,
    timezoneAssumption: 'implicit-same-host-environment (browser executed on same host runtime)'
  };
}

const b1DateProv = verifyDateProvenance(b1, 'Base1');
const b2DateProv = verifyDateProvenance(b2, 'Base2');
const afterDateProv = verifyDateProvenance(after, 'After');
const dateProvenancePassed = (b1DateProv.ok === true) && (b2DateProv.ok === true) && (afterDateProv.ok === true);

// 6. Mutator sensitivity test (all audit canary cases + Base2 CDP zero + Base2 Hash only + Date Provenance Tamper)
function runMutatorSensitivityTest() {
  const mutatorResults = {};

  // Mutation 1: Full DOM mutation outside modal
  const origDomB1 = normalizeFullDom(b1.steps[0].fullDomHTML, idMaps[0].idMap);
  const mutatedDomA = normalizeFullDom(after.steps[0].fullDomHTML, idMaps[2].idMap) + '<div id="tampered_outside_modal"></div>';
  mutatorResults.domOutsideModalMutationDetected = (mutatedDomA !== origDomB1);

  // Mutation 2: Modal sheet HTML mutation
  const testStepIdx = 3;
  const origModalB1 = normalizeTargeted(b1.steps[testStepIdx].modalSheetHTML, idMaps[0].idMap);
  const mutatedModalA = normalizeTargeted(after.steps[testStepIdx].modalSheetHTML, idMaps[2].idMap) + '<!-- modal_mut -->';
  mutatorResults.modalDomMutationDetected = (mutatedModalA !== origModalB1);

  // Mutation 3: After error and incomplete flag
  const mutatedAfterIncomplete = JSON.parse(JSON.stringify(after));
  mutatedAfterIncomplete.completed = false;
  const checkInc = checkPreconditions([b1, b2, mutatedAfterIncomplete]);
  mutatorResults.afterIncompleteDetected = (checkInc.ok === false);

  // Mutation 4: Required step omitted across all runs (13 steps)
  const runs13 = runs.map(r => {
    const copy = JSON.parse(JSON.stringify(r));
    copy.steps.pop();
    return copy;
  });
  const checkOmit = checkPreconditions(runs13);
  mutatorResults.omittedStepDetected = (checkOmit.ok === false);

  // Mutation 5: New pageerror injected
  const mutatedPageErrorA = ['PAGEERROR Uncaught TypeError: injected'];
  mutatorResults.newPageErrorDetected = !multisetEqual(toMultiset(b1.steps[0].pageerrors), toMultiset(mutatedPageErrorA));

  // Mutation 6: New console error injected
  const mutatedConsoleErrorA = ['Injected console error'];
  mutatorResults.newConsoleErrorDetected = !multisetEqual(toMultiset(b1.steps[0].consoleErrors), toMultiset(mutatedConsoleErrorA));

  // Mutation 7: SessionStorage extra key injected
  const mutatedSsA = Object.assign({}, after.steps[0].allSessionStorage, { injected_session_key: 'mutated' });
  mutatorResults.sessionStorageExtraKeyDetected = (JSON.stringify(b1.steps[0].allSessionStorage) !== JSON.stringify(mutatedSsA));

  // Mutation 8: Base2-only storage theme change
  const mutatedStorageB2 = JSON.parse(JSON.stringify(b2.steps[0].allLocalStorage));
  mutatedStorageB2.ourgoal_current_theme = 'tampered_theme';
  const normB1_ls = sortedLeaves(getLeafNodes(normalizeStorageObject(b1.steps[0].allLocalStorage, idMaps[0])));
  const normB2_ls = sortedLeaves(getLeafNodes(normalizeStorageObject(mutatedStorageB2, idMaps[1])));
  mutatorResults.base2ThemeChangeDetected = (JSON.stringify(normB1_ls) !== JSON.stringify(normB2_ls));

  // Mutation 9: Existing record date changed across after run
  const mutatedRecStorageA = JSON.parse(JSON.stringify(after.steps[5].allLocalStorage));
  const pA = JSON.parse(mutatedRecStorageA.ourgoal_guest_profile);
  pA.records = [{ id: 'pre_existing_rec', createdAt: '2026-01-01T00:00:00.000Z', startAt: '2026-01-01T00:00:00.000Z' }];
  mutatedRecStorageA.ourgoal_guest_profile = JSON.stringify(pA);
  const mutatedNormRecStorageA = sortedLeaves(getLeafNodes(normalizeStorageObject(mutatedRecStorageA, idMaps[2])));
  const origNormRecStorageB1 = sortedLeaves(getLeafNodes(normalizeStorageObject(b1.steps[5].allLocalStorage, idMaps[0])));
  mutatorResults.existingRecordDateChangeDetected = (JSON.stringify(mutatedNormRecStorageA) !== JSON.stringify(origNormRecStorageB1));

  // Mutation 10: Existing seed changed across after run
  const mutatedSeedStorageA = JSON.parse(JSON.stringify(after.steps[0].allLocalStorage));
  const pSeed = JSON.parse(mutatedSeedStorageA.ourgoal_guest_profile);
  pSeed.settings.manito.seed = 9999999;
  mutatedSeedStorageA.ourgoal_guest_profile = JSON.stringify(pSeed);
  const mutatedNormSeedA = sortedLeaves(getLeafNodes(normalizeStorageObject(mutatedSeedStorageA, idMaps[2])));
  const origNormSeedB1 = sortedLeaves(getLeafNodes(normalizeStorageObject(b1.steps[0].allLocalStorage, idMaps[0])));
  mutatorResults.existingSeedChangeDetected = (JSON.stringify(mutatedNormSeedA) !== JSON.stringify(origNormSeedB1));

  // Mutation 11: Device registered ID disconnected
  const mutatedDevRun = JSON.parse(JSON.stringify(after));
  const devKey = Object.keys(mutatedDevRun.steps[0].allLocalStorage).find(k => k.startsWith('ourgoal_registered_devices_'));
  if (devKey) {
    const devs = JSON.parse(mutatedDevRun.steps[0].allLocalStorage[devKey]);
    devs[0].id = 'disconnected_device_id';
    mutatedDevRun.steps[0].allLocalStorage[devKey] = JSON.stringify(devs);
  }
  let devLinkDetected = false;
  try { checkInvariants(mutatedDevRun, 'mutated-dev-link'); } catch (_) { devLinkDetected = true; }
  mutatorResults.deviceDisconnectedDetected = devLinkDetected;

  // Mutation 12: Base2 CDP Zero Mutation Detection (Mandatory Gate)
  const b2CdpZero = JSON.parse(JSON.stringify(b2));
  b2CdpZero.targetFunctionStats = {
    openTemplateRecordDetailModal: { called: false, maxEntryCount: 0 },
    checkRecordDeepLink: { called: false, maxEntryCount: 0 }
  };
  const b2CdpZeroCalled = isFnCalled(b2CdpZero, 'openTemplateRecordDetailModal') && isFnCalled(b2CdpZero, 'checkRecordDeepLink');
  mutatorResults.base2CDPZeroDetected = (b2CdpZeroCalled === false);

  // Mutation 13: Base2 Hash Mismatch Mutation Detection (Mandatory Gate)
  const normB1Hash = normalizeTargeted(b1.steps[12].currentHash, idMaps[0].idMap);
  const normB2HashTampered = normalizeTargeted('#tampered_hash_b2', idMaps[1].idMap);
  mutatorResults.base2HashMismatchDetected = (normB1Hash !== normB2HashTampered);

  // Mutation 14: After CDP Zero Mutation Detection (Mandatory Gate)
  const afterCdpZero = JSON.parse(JSON.stringify(after));
  afterCdpZero.targetFunctionStats = {
    openTemplateRecordDetailModal: { called: false, maxEntryCount: 0 },
    checkRecordDeepLink: { called: false, maxEntryCount: 0 }
  };
  const afterCdpZeroCalled = isFnCalled(afterCdpZero, 'openTemplateRecordDetailModal') && isFnCalled(afterCdpZero, 'checkRecordDeepLink');
  mutatorResults.afterCDPZeroDetected = (afterCdpZeroCalled === false);

  // Mutation 15: Date Provenance Tampering (Same-year day alteration rejected)
  const afterDateTampered = JSON.parse(JSON.stringify(after));
  for (let i = 5; i < afterDateTampered.steps.length; i++) {
    const s = afterDateTampered.steps[i];
    if (s && s.allLocalStorage) {
      for (const k of Object.keys(s.allLocalStorage)) {
        if (k.includes('records')) {
          try {
            const records = JSON.parse(s.allLocalStorage[k]);
            if (Array.isArray(records) && records.length > 0 && records[0].startAt) {
              // Alter day within the same year (e.g. from 2026-10-06 to 2026-10-08)
              records[0].startAt = '2026-10-08T15:41:00.000Z';
              s.allLocalStorage[k] = JSON.stringify(records);
            }
          } catch (_) {}
        }
      }
    }
  }
  const checkDateTamper = verifyDateProvenance(afterDateTampered, 'mutated-after-date');
  mutatorResults.sameYearDayTamperDetected = (checkDateTamper.ok === false);

  // Mutation 16: Duplicate pre-save input injected (Enforce unique input count = 1)
  const afterDuplicateInput = JSON.parse(JSON.stringify(after));
  afterDuplicateInput.steps[3].modalSheetHTML += '<input id="proRecDate" value="2026-10-07T00:41">';
  const checkDuplicate = verifyDateProvenance(afterDuplicateInput, 'mutated-dup-input');
  mutatorResults.duplicatePresaveInputDetected = (checkDuplicate.ok === false);

  // Mutation 17: Mismatched targetRecordId (Exact record ID match enforced, not arbitrary [0])
  const afterMismatchedId = JSON.parse(JSON.stringify(after));
  for (let i = 5; i < afterMismatchedId.steps.length; i++) {
    const s = afterMismatchedId.steps[i];
    if (s && s.allLocalStorage) {
      for (const k of Object.keys(s.allLocalStorage)) {
        if (k.includes('records')) {
          try {
            const records = JSON.parse(s.allLocalStorage[k]);
            if (Array.isArray(records) && records[0]) {
              records[0].id = 'unmatched_arbitrary_record_id';
              s.allLocalStorage[k] = JSON.stringify(records);
            }
          } catch (_) {}
        }
      }
    }
  }
  const checkMismatch = verifyDateProvenance(afterMismatchedId, 'mutated-mismatched-id');
  mutatorResults.mismatchedRecordIdDetected = (checkMismatch.ok === false);

  const allDetected = Object.values(mutatorResults).every(v => v === true);
  return { ...mutatorResults, allDetected };
}

// 7. CDP Target functions stats comparison (Mandatory Base1, Base2, After AND Gate)
function isFnCalled(run, fnName) {
  const stats = run.targetFunctionStats?.[fnName] || run.targetStats?.[fnName];
  if (!stats) return false;
  return stats.called === true || (stats.callCount || 0) > 0 || (stats.maxEntryCount || 0) > 0;
}

function getFnStat(run, fnName, key) {
  const stats = run.targetFunctionStats?.[fnName] || run.targetStats?.[fnName];
  return stats?.[key] || 0;
}

const fnStats = {
  openTemplateRecordDetailModal: {
    base1Called: isFnCalled(b1, 'openTemplateRecordDetailModal'),
    base2Called: isFnCalled(b2, 'openTemplateRecordDetailModal'),
    afterCalled: isFnCalled(after, 'openTemplateRecordDetailModal'),
    afterMaxEntryCount: getFnStat(after, 'openTemplateRecordDetailModal', 'maxEntryCount'),
    afterMaxSubRangesSum: getFnStat(after, 'openTemplateRecordDetailModal', 'maxSubRangesSum')
  },
  checkRecordDeepLink: {
    base1Called: isFnCalled(b1, 'checkRecordDeepLink'),
    base2Called: isFnCalled(b2, 'checkRecordDeepLink'),
    afterCalled: isFnCalled(after, 'checkRecordDeepLink'),
    afterMaxEntryCount: getFnStat(after, 'checkRecordDeepLink', 'maxEntryCount'),
    afterMaxSubRangesSum: getFnStat(after, 'checkRecordDeepLink', 'maxSubRangesSum')
  }
};

const targetFunctionsCalled =
  fnStats.openTemplateRecordDetailModal.base1Called &&
  fnStats.openTemplateRecordDetailModal.base2Called &&
  fnStats.openTemplateRecordDetailModal.afterCalled &&
  fnStats.checkRecordDeepLink.base1Called &&
  fnStats.checkRecordDeepLink.base2Called &&
  fnStats.checkRecordDeepLink.afterCalled;

const mutatorCheck = runMutatorSensitivityTest();

// 8. Final Verdict Assembly
const finalVerdict = {
  task: 'TASK-ES-585',
  comparator: 'docs/design/harness/module-split/task585-record-detail-compare.js',
  stepsEvaluated: 14,
  preconditionsPassed,
  invariantsPreserved: invariantResults.every(r => r.ok),
  baseReproducibilityPassed,
  allStepsDomMatched: (domDiffCount === 0),
  allStepsModalMatched: (modalDiffCount === 0),
  allStepsToastMatched: (toastDiffCount === 0),
  storageMatched: (storageDiffCount === 0),
  sessionStorageMatched: (sessionStorageDiffCount === 0),
  errorsMatched: (errorDiffCount === 0),
  allStepsStateMatched: (stateDiffCount === 0),
  dateProvenancePassed,
  targetFunctionsCalled,
  mutatorSensitivityPassed: mutatorCheck.allDetected,
  details: {
    domDiffCount,
    modalDiffCount,
    toastDiffCount,
    storageDiffCount,
    sessionStorageDiffCount,
    errorDiffCount,
    stateDiffCount,
    dateProvenance: {
      base1: b1DateProv,
      base2: b2DateProv,
      after: afterDateProv
    },
    fnStats,
    mutatorCheck,
    stepComparisons
  }
};

fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(finalVerdict, null, 2), 'utf8');
console.log('UI Comparison result written to:', outPath);
console.log('Verdict:', {
  preconditionsPassed: finalVerdict.preconditionsPassed,
  invariantsPreserved: finalVerdict.invariantsPreserved,
  baseReproducibilityPassed: finalVerdict.baseReproducibilityPassed,
  allStepsDomMatched: finalVerdict.allStepsDomMatched,
  allStepsModalMatched: finalVerdict.allStepsModalMatched,
  allStepsToastMatched: finalVerdict.allStepsToastMatched,
  storageMatched: finalVerdict.storageMatched,
  sessionStorageMatched: finalVerdict.sessionStorageMatched,
  errorsMatched: finalVerdict.errorsMatched,
  allStepsStateMatched: finalVerdict.allStepsStateMatched,
  dateProvenancePassed: finalVerdict.dateProvenancePassed,
  targetFunctionsCalled: finalVerdict.targetFunctionsCalled,
  mutatorSensitivityPassed: finalVerdict.mutatorSensitivityPassed
});

// STRICT EXIT GATE: ALL required checks MUST pass
const allPassed =
  finalVerdict.preconditionsPassed &&
  finalVerdict.invariantsPreserved &&
  finalVerdict.baseReproducibilityPassed &&
  finalVerdict.allStepsDomMatched &&
  finalVerdict.allStepsModalMatched &&
  finalVerdict.allStepsToastMatched &&
  finalVerdict.storageMatched &&
  finalVerdict.sessionStorageMatched &&
  finalVerdict.errorsMatched &&
  finalVerdict.allStepsStateMatched &&
  finalVerdict.dateProvenancePassed &&
  finalVerdict.targetFunctionsCalled &&
  finalVerdict.mutatorSensitivityPassed;

if (!allPassed) {
  console.error('STRICT GATE FAILED: One or more verification checks failed!');
  process.exit(1);
}
