'use strict';
const fs = require('fs');
const assert = require('assert');

const [b1, b2, a, out] = process.argv.slice(2);
const runs = [b1, b2, a].map(p => JSON.parse(fs.readFileSync(p, 'utf8')));

// Existing calculation formulas (from js/tabs/goals/ai-status.js & js/tabs/home/today-mission.js)
function computeGoalStatusHash(goal) {
  const parts = [goal.title || '', goal.dueDate || '', JSON.stringify(goal.result || null)];
  (goal.milestones || []).forEach(function(m) {
    parts.push(m.id, m.title || '', m.status || '', m.dueDate || '', JSON.stringify(m.result || null));
    (m.tasks || []).forEach(function(t) {
      parts.push(t.id, t.title || '', t.done ? '1' : '0', t.dueDate || '', JSON.stringify(t.result || null));
    });
  });
  const str = parts.join('|');
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return String(h);
}

function computeTodayMissionHash(goal, records) {
  const baseHash = computeGoalStatusHash(goal);
  const recs = records || [];
  const lastRec = recs.find(function(r) { return r.goalId === goal.id || r.category === goal.category; });
  const recPart = lastRec ? (lastRec.id + ':' + (lastRec.startAt || lastRec.date || '')) : '';
  return baseHash + (recPart ? (':' + recPart) : '');
}

// 1. Exact 1:1 ID mapping & normalization for a single run
function createIdMap(run) {
  const idMap = new Map();
  let goalSeq = 0;
  let msSeq = 0;
  let schedSeq = 0;
  let recSeq = 0;

  for (const step of run.steps) {
    if (!step.saved) continue;
    const p = JSON.parse(step.saved);
    if (p.id && !idMap.has(p.id)) {
      idMap.set(p.id, '<guest-canonical>');
    }
    for (const g of (p.goals || [])) {
      if (g.id && !idMap.has(g.id)) {
        idMap.set(g.id, `<id:goal:${goalSeq++}>`);
      }
      for (const m of (g.milestones || [])) {
        if (m.id && !idMap.has(m.id)) {
          idMap.set(m.id, `<id:ms:${msSeq++}>`);
        }
      }
    }
    for (const s of (p.settings?.customSchedules || [])) {
      if (s.id && !idMap.has(s.id)) {
        idMap.set(s.id, `<id:sched:${schedSeq++}>`);
      }
    }
    for (const r of (p.records || [])) {
      if (r.id && !idMap.has(r.id)) {
        idMap.set(r.id, `<id:rec:${recSeq++}>`);
      }
    }
  }

  // Bijective check: all mapped values are unique
  const mappedVals = Array.from(idMap.values());
  assert.strictEqual(mappedVals.length, new Set(mappedVals).size, '1:1 mapping must be bijective');
  return idMap;
}

// 2. Invariant preservation check (pre vs post normalization)
function verifyInvariants(pRaw, pNorm, idMap) {
  // Goal counts and milestone counts
  assert.strictEqual((pRaw.goals || []).length, (pNorm.goals || []).length, 'Goals count preserved');
  (pRaw.goals || []).forEach((gRaw, i) => {
    const gNorm = pNorm.goals[i];
    assert.strictEqual(idMap.get(gRaw.id), gNorm.id, 'Goal ID 1:1 mapped');
    assert.strictEqual(gRaw.title, gNorm.title, 'Goal title preserved');
    assert.strictEqual(gRaw.category, gNorm.category, 'Goal category preserved');
    assert.strictEqual((gRaw.milestones || []).length, (gNorm.milestones || []).length, 'Milestones count preserved');
    (gRaw.milestones || []).forEach((mRaw, mi) => {
      const mNorm = gNorm.milestones[mi];
      assert.strictEqual(idMap.get(mRaw.id), mNorm.id, 'Milestone ID 1:1 mapped');
      assert.strictEqual(mRaw.title, mNorm.title, 'Milestone title preserved');
      assert.strictEqual(mRaw.status, mNorm.status, 'Milestone status preserved');
    });
  });

  // CustomSchedules count & connection relationships (s.linkedGoalId, s.linkedId)
  const rawScheds = pRaw.settings?.customSchedules || [];
  const normScheds = pNorm.settings?.customSchedules || [];
  assert.strictEqual(rawScheds.length, normScheds.length, 'customSchedules count preserved');
  rawScheds.forEach((sRaw, i) => {
    const sNorm = normScheds[i];
    assert.strictEqual(idMap.get(sRaw.id), sNorm.id, 'Schedule ID 1:1 mapped');
    assert.strictEqual(idMap.get(sRaw.linkedId), sNorm.linkedId, 'Schedule linkedId 1:1 mapped to milestone');
    assert.strictEqual(idMap.get(sRaw.linkedGoalId), sNorm.linkedGoalId, 'Schedule linkedGoalId 1:1 mapped to goal');
    // Connection relationship in raw
    assert.ok(pRaw.goals.some(g => g.id === sRaw.linkedGoalId), 'Raw schedule connected to real goal');
    assert.ok(pRaw.goals.some(g => g.milestones?.some(m => m.id === sRaw.linkedId)), 'Raw schedule connected to real milestone');
    // Connection relationship preserved in norm
    assert.ok(pNorm.goals.some(g => g.id === sNorm.linkedGoalId), 'Norm schedule connected to norm goal');
    assert.ok(pNorm.goals.some(g => g.milestones?.some(m => m.id === sNorm.linkedId)), 'Norm schedule connected to norm milestone');
  });

  // TodayMissions count & goal links
  const rawMissions = pRaw.settings?.todayMissions || {};
  const normMissions = pNorm.settings?.todayMissions || {};
  assert.strictEqual(Object.keys(rawMissions).length, Object.keys(normMissions).length, 'todayMissions count preserved');
  for (const [gidRaw, mRaw] of Object.entries(rawMissions)) {
    const gidNorm = idMap.get(gidRaw);
    assert.ok(gidNorm in normMissions, `Normalized todayMissions has key ${gidNorm}`);
    assert.strictEqual(mRaw.date, normMissions[gidNorm].date, 'todayMission date preserved');
    assert.strictEqual(mRaw.text, normMissions[gidNorm].text, 'todayMission text preserved');
  }

  // GoalStatusSummaries count & goal links
  const rawSummaries = pRaw.settings?.goalStatusSummaries || {};
  const normSummaries = pNorm.settings?.goalStatusSummaries || {};
  assert.strictEqual(Object.keys(rawSummaries).length, Object.keys(normSummaries).length, 'goalStatusSummaries count preserved');
  for (const [gidRaw, sRaw] of Object.entries(rawSummaries)) {
    const gidNorm = idMap.get(gidRaw);
    assert.ok(gidNorm in normSummaries, `Normalized goalStatusSummaries has key ${gidNorm}`);
    assert.strictEqual(sRaw.dateKey, normSummaries[gidNorm].dateKey, 'goalStatusSummary dateKey preserved');
    assert.strictEqual(sRaw.text, normSummaries[gidNorm].text, 'goalStatusSummary text preserved');
  }
}

// 3. Formula contrast: verify that every hash in the run matches computeTodayMissionHash / computeGoalStatusHash
function verifyHashAgainstFormula(run, label) {
  const formulaChecks = [];
  for (const step of run.steps) {
    if (!step.saved) continue;
    const p = JSON.parse(step.saved);
    const goals = p.goals || [];
    const summaries = p.settings?.goalStatusSummaries || {};
    const missions = p.settings?.todayMissions || {};
    const stepMissions = step.todayMissions || {};

    for (const g of goals) {
      const expectedSummaryHash = computeGoalStatusHash(g);
      const expectedMissionHash = computeTodayMissionHash(g, p.records || []);

      if (summaries[g.id]) {
        assert.strictEqual(
          summaries[g.id].hash,
          expectedSummaryHash,
          `[${label}] goalStatusSummaries hash mismatch for goal ${g.id}`
        );
      }
      if (missions[g.id]) {
        assert.strictEqual(
          missions[g.id].hash,
          expectedMissionHash,
          `[${label}] todayMissions saved hash mismatch for goal ${g.id}`
        );
      }
      if (stepMissions[g.id]) {
        assert.strictEqual(
          stepMissions[g.id].hash,
          expectedMissionHash,
          `[${label}] todayMissions step hash mismatch for goal ${g.id}`
        );
      }

      formulaChecks.push({
        step: step.name,
        goalTitle: g.title,
        milestoneIds: g.milestones.map(m => m.id),
        calculatedGoalStatusHash: expectedSummaryHash,
        calculatedTodayMissionHash: expectedMissionHash,
        actualSavedSummaryHash: summaries[g.id]?.hash || null,
        actualSavedMissionHash: missions[g.id]?.hash || null,
        actualStepMissionHash: stepMissions[g.id]?.hash || null,
        matched: true
      });
    }
  }
  return formulaChecks;
}

// 4. Counterfactual cause proof: demonstrate that milestone ID timestamp difference is the sole cause of hash differences
function proveHashDifferenceCause(b1Run, b2Run, afterRun) {
  const b1Saved = JSON.parse(b1Run.steps.find(s => s.name === 'two goals adopted').saved);
  const b2Saved = JSON.parse(b2Run.steps.find(s => s.name === 'two goals adopted').saved);
  const afterSaved = JSON.parse(afterRun.steps.find(s => s.name === 'two goals adopted').saved);

  const proofs = [];

  for (let i = 0; i < b1Saved.goals.length; i++) {
    const g1 = b1Saved.goals[i];
    const g2 = b2Saved.goals[i];
    const gAfter = afterSaved.goals[i];

    // Same goal title & category
    assert.strictEqual(g1.title, g2.title);
    assert.strictEqual(g1.title, gAfter.title);
    assert.strictEqual(g1.category, g2.category);

    // Substitute b2's milestone IDs into g1
    const g1WithB2Milestones = {
      ...g1,
      milestones: g1.milestones.map((m, mi) => ({ ...m, id: g2.milestones[mi].id }))
    };
    const syntheticB2SummaryHash = computeGoalStatusHash(g1WithB2Milestones);
    const syntheticB2MissionHash = computeTodayMissionHash(g1WithB2Milestones, b1Saved.records);

    assert.strictEqual(
      syntheticB2SummaryHash,
      b2Saved.settings.goalStatusSummaries[g2.id].hash,
      'Synthetic b2 summary hash strictly matches b2 actual hash'
    );
    assert.strictEqual(
      syntheticB2MissionHash,
      b2Saved.settings.todayMissions[g2.id].hash,
      'Synthetic b2 mission hash strictly matches b2 actual hash'
    );

    // Substitute after's milestone IDs into g1
    const g1WithAfterMilestones = {
      ...g1,
      milestones: g1.milestones.map((m, mi) => ({ ...m, id: gAfter.milestones[mi].id }))
    };
    const syntheticAfterSummaryHash = computeGoalStatusHash(g1WithAfterMilestones);
    const syntheticAfterMissionHash = computeTodayMissionHash(g1WithAfterMilestones, b1Saved.records);

    assert.strictEqual(
      syntheticAfterSummaryHash,
      afterSaved.settings.goalStatusSummaries[gAfter.id].hash,
      'Synthetic after summary hash strictly matches after actual hash'
    );
    assert.strictEqual(
      syntheticAfterMissionHash,
      afterSaved.settings.todayMissions[gAfter.id].hash,
      'Synthetic after mission hash strictly matches after actual hash'
    );

    proofs.push({
      goalTitle: g1.title,
      b1ActualHash: b1Saved.settings.todayMissions[g1.id].hash,
      b2ActualHash: b2Saved.settings.todayMissions[g2.id].hash,
      afterActualHash: afterSaved.settings.todayMissions[gAfter.id].hash,
      syntheticB2HashMatchesB2: true,
      syntheticAfterHashMatchesAfter: true,
      formulaInputProof: 'computeGoalStatusHash / computeTodayMissionHash formulas are 100% identical and deterministic'
    });
  }

  return proofs;
}

// 5. Full run normalization
function norm(j, idMap) {
  assert.strictEqual(j.completed, true);

  // Sort keys by length descending to prevent partial prefix replacements
  const sortedRawIds = Array.from(idMap.keys()).sort((a, b) => b.length - a.length);

  const text = s => {
    if (typeof s !== 'string') return s;
    let res = s;
    for (const rawId of sortedRawIds) {
      res = res.split(rawId).join(idMap.get(rawId));
    }
    res = res.replace(/\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z/g, '<iso>');
    return res;
  };

  return {
    completed: j.completed,
    actualCallCount: j.actualCallCount,
    rowsWrittenRemote: j.rowsWrittenRemote,
    blockedWrites: j.blockedWrites,
    pageerrors: j.pageerrors,
    consoleErrors: j.consoleErrors
      .map(s => s.replace(/https?:\/\/[^\s']+|wss?:\/\/[^\s']+/g, '<external-url>'))
      .sort(),
    steps: j.steps.map(s => {
      const pRaw = s.saved ? JSON.parse(s.saved) : {};
      if (pRaw.id) assert.match(pRaw.id, /^guest-/);
      if (pRaw.createdAt) assert.ok(Number.isFinite(Date.parse(pRaw.createdAt)));
      if (pRaw.settings && pRaw.settings.manito && pRaw.settings.manito.seed) {
        pRaw.settings.manito.seed = '<random-int>';
      }

      const pNorm = s.saved ? JSON.parse(text(JSON.stringify(pRaw))) : null;
      if (pNorm && pRaw.goals) {
        verifyInvariants(pRaw, pNorm, idMap);
      }

      return {
        name: s.name,
        sheetVisible: s.sheetVisible,
        missionCardExists: s.missionCardExists,
        moreBtnText: s.moreBtnText,
        restListDisplay: s.restListDisplay,
        activeTab: s.activeTab,
        goalsCount: s.goalsCount,
        missionAccordionOpen: s.missionAccordionOpen,
        cardHtml: text(s.cardHtml),
        toast: text(s.toast),
        saved: pNorm,
        todayMissions: s.todayMissions ? JSON.parse(text(JSON.stringify(s.todayMissions))) : null
      };
    })
  };
}

function leaves(x, p = '', o = {}) {
  if (x && typeof x === 'object') {
    if (!Object.keys(x).length) o[p] = x;
    for (const [k, v] of Object.entries(x)) leaves(v, p + '.' + k, o);
  } else o[p] = x;
  return o;
}

const idMaps = runs.map(createIdMap);
const formulaVerifications = [
  verifyHashAgainstFormula(runs[0], 'base1'),
  verifyHashAgainstFormula(runs[1], 'base2'),
  verifyHashAgainstFormula(runs[2], 'after')
];
const causeProof = proveHashDifferenceCause(runs[0], runs[1], runs[2]);

const n = runs.map((run, i) => norm(run, idMaps[i]));

const compare = (x, y) => {
  const a = leaves(x);
  const b = leaves(y);
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])];
  const allDiffs = keys
    .filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k]))
    .map(k => ({ key: k, a: a[k], b: b[k] }));

  const nonHashDiffs = allDiffs.filter(d => !d.key.endsWith('.hash'));
  const hashDiffs = allDiffs.filter(d => d.key.endsWith('.hash'));

  return {
    compared: keys.length,
    differingTotal: allDiffs.length,
    differingNonHash: nonHashDiffs.length,
    differingHash: hashDiffs.length,
    nonHashDiffs,
    hashDiffs,
    allDiffs
  };
};

const baselineComp = compare(n[0], n[1]);
const afterComp = compare(n[0], n[2]);

const r = {
  task: 'TASK-ES-576',
  inputs: [b1, b2, a],
  method: '1:1 ID 정규화 + 연결 불변식 검증 + 기존 해시 계산식 대조 및 인과 증명',
  normalization: 'Exact 1:1 bijective mapping for guest/goal/milestone/schedule/record IDs; ISO timestamps to <iso>; integer manito seed; structural invariants asserted',
  invariantsPreserved: true,
  formulaContrast: {
    base1ChecksCount: formulaVerifications[0].length,
    base2ChecksCount: formulaVerifications[1].length,
    afterChecksCount: formulaVerifications[2].length,
    allFormulaChecksPassed: true
  },
  counterfactualCauseProof: {
    summary: '남은 차이의 원인은 추천 목표 채택 시 Date.now()로 생성되는 마일스톤 ID(m_timestamp_idx) 차이가 computeGoalStatusHash 및 computeTodayMissionHash에 직접 입력되어 발생한 결정론적 해시 차이임이 수식 대조로 입증됨. 해시 삭제 또는 상수 치환 일체 없음.',
    proofs: causeProof
  },
  baseline: {
    compared: baselineComp.compared,
    differingTotal: baselineComp.differingTotal,
    differingNonHash: baselineComp.differingNonHash,
    differingHash: baselineComp.differingHash,
    nonHashDiffs: baselineComp.nonHashDiffs,
    hashDiffs: baselineComp.hashDiffs
  },
  after: {
    compared: afterComp.compared,
    differingTotal: afterComp.differingTotal,
    differingNonHash: afterComp.differingNonHash,
    differingHash: afterComp.differingHash,
    nonHashDiffs: afterComp.nonHashDiffs,
    hashDiffs: afterComp.hashDiffs
  },
  rawCallCounts: runs.map(j => j.actualCallCount)
};

fs.mkdirSync(require('path').dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(r, null, 2) + '\n', 'utf8');
console.log(JSON.stringify({
  task: r.task,
  invariantsPreserved: r.invariantsPreserved,
  allFormulaChecksPassed: r.formulaContrast.allFormulaChecksPassed,
  baselineNonHashDiffs: baselineComp.differingNonHash,
  afterNonHashDiffs: afterComp.differingNonHash,
  baselineHashDiffs: baselineComp.differingHash,
  afterHashDiffs: afterComp.differingHash,
  rawCallCounts: r.rawCallCounts
}));

if (baselineComp.differingNonHash > 0 || afterComp.differingNonHash > 0) {
  process.exitCode = 1;
}
