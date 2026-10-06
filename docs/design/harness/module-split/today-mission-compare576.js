'use strict';
const fs = require('fs');
const assert = require('assert');

const [b1, b2, a, out] = process.argv.slice(2);
const runs = [b1, b2, a].map(p => JSON.parse(fs.readFileSync(p, 'utf8')));

function norm(j) {
  assert.strictEqual(j.completed, true);
  const guest = JSON.parse(j.steps[0].saved).id;
  const allSaved = j.steps.map(s => (s.saved ? JSON.parse(s.saved) : {}));
  const goalIds = allSaved.flatMap(p => (p.goals || []).map(g => g.id)).filter(Boolean);
  const recordIds = allSaved.flatMap(p => (p.records || []).map(r => r.id)).filter(Boolean);
  const ids = [guest, ...goalIds, ...recordIds].filter(Boolean);

  const text = s => {
    if (typeof s !== 'string') return s;
    let res = s;
    for (const id of ids) {
      res = res.split(id).join('<runtime-id>');
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
      const p = s.saved ? JSON.parse(s.saved) : {};
      if (p.id) assert.match(p.id, /^guest-/);
      if (p.createdAt) assert.ok(Number.isFinite(Date.parse(p.createdAt)));
      if (p.settings && p.settings.manito && p.settings.manito.seed) {
        p.settings.manito.seed = '<random-int>';
      }
      return {
        ...s,
        saved: s.saved ? JSON.parse(text(JSON.stringify(p))) : null,
        cardHtml: text(s.cardHtml),
        toast: text(s.toast),
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

const n = runs.map(norm);
const compare = (x, y) => {
  const a = leaves(x);
  const b = leaves(y);
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])];
  const diffs = keys
    .filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k]))
    .map(k => ({ key: k, a: a[k], b: b[k] }));
  return { compared: keys.length, differing: diffs.length, diffs };
};

const r = {
  task: 'TASK-ES-576',
  inputs: [b1, b2, a],
  normalization: 'Exact actual guest/goal/record IDs and valid ISO timestamps; integer manito seed; URL strings only; all fields/counts retained',
  baseline: compare(n[0], n[1]),
  after: compare(n[0], n[2]),
  rawCallCounts: runs.map(j => j.actualCallCount)
};

fs.mkdirSync(require('path').dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(r, null, 2) + '\n', 'utf8');
console.log(JSON.stringify(r));
if (r.baseline.differing || r.after.differing) process.exitCode = 1;
