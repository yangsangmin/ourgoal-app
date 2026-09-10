#!/usr/bin/env node
/**
 * OURGOAL CHAOS MONKEY TEST SUITE?
 * 
 * ?? ??? ????? ?? ???? ??? ???? ??,
 * ??? ??, XSS ??, 10,000? ?? ??, ?? ??, ??? ???? ???
 * ?? ???? ???? ???? ??? ??? ? ??? ?? ??? ?? ?????.
 * 
 * ??: node scripts/chaos-monkey-test.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const INDEX_HTML = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(INDEX_HTML, 'utf8');

const scriptMatches = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)]
  .filter(m => !/\bsrc=/.test(m[1]))
  .map(m => m[2])
  .filter(code => code.trim().length > 0);

const mainScript = scriptMatches.reduce((a, b) => (b.length > a.length ? b : a), '');

function extractFunction(source, name) {
  const startMatch = new RegExp('function\\s+' + name + '\\s*\\(').exec(source);
  if (!startMatch) throw new Error('??? ?? ? ??: ' + name);
  const braceStart = source.indexOf('{', startMatch.index);
  let depth = 0;
  for (let i = braceStart; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') {
      depth--;
      if (depth === 0) return source.slice(startMatch.index, i + 1);
    }
  }
  throw new Error('??? ?? ???? ?? ??: ' + name);
}

const FN_NAMES = [
  'pad', 'dateKey', 'goalProgress', 'msCounts', 'resultPct', 'dDay',
  'computeStreakDays', 'fmtDateLabel', 'filterRecordsByQuery', 'convertTextToNotionDbRecord',
  'rescaleGoal'
];

const extracted = FN_NAMES.map(name => extractFunction(mainScript, name)).join('\n');

const sandboxSrc =
  'var window = {};\n' +
  'var TOPICS = { workout: { label: "운동" }, study: { label: "공부" } };\n' +
  'var state = { profile: { records: [] } };\n' +
  extracted +
  '\nmodule.exports = { goalProgress, msCounts, resultPct, dDay, computeStreakDays, filterRecordsByQuery, convertTextToNotionDbRecord, rescaleGoal };\n';

const os = require('os');
const sandboxPath = path.join(os.tmpdir(), 'ourgoal-chaos-sandbox-' + process.pid + '.js');
fs.writeFileSync(sandboxPath, sandboxSrc);
let fns;
try {
  fns = require(sandboxPath);
} finally {
  fs.unlinkSync(sandboxPath);
}

const { localGoalAgentFallback } = require('../api/goalagent.js');

let chaosTotal = 0;
let chaosPassed = 0;
let chaosFailed = 0;

function runChaos(label, fn) {
  chaosTotal++;
  try {
    fn();
    chaosPassed++;
    console.log('  [CHAOS DEFENDED] ' + label);
  } catch (err) {
    chaosFailed++;
    console.error('  [CHAOS FAILED] ' + label + ': ' + (err && err.message ? err.message : err));
  }
}

console.log('====================================================');
console.log('OURGOAL CHAOS MONKEY TEST SUITE');
console.log('====================================================');

// 1. ??? ??? ?? (Fuzz Vectors)
const FUZZ_VECTORS = [
  '',
  '   ',
  '\n\r\t',
  null,
  undefined,
  '<script>alert("xss")</script>',
  '<img src=x onerror=alert(1)>',
  '\' OR \'1\'=\'1\'; DROP TABLE users; --',
  '???????????????????',
  'A'.repeat(5000),
  '#@!$%^&*()_+~`|}{[]:;?><,./-=',
  '2026-02-31',
  '9999-99-99',
  'NaN',
  'Infinity',
  '{"bad": "json", [unclosed'
];

console.log('\n[??? 1] AI ?? ?? DB ??? ?? ?? ?? ??');
FUZZ_VECTORS.forEach((fuzz, idx) => {
  runChaos(`convertTextToNotionDbRecord ?? ?? #${idx + 1} (${typeof fuzz === 'string' ? fuzz.slice(0, 15) : fuzz})`, () => {
    const res = fns.convertTextToNotionDbRecord(fuzz, 'note', { title: fuzz }, { category: fuzz });
    assert.ok(res, '?? ??? ????? ?');
    assert.ok(res.notionSchema, '?? ???? ????? ?');
    assert.ok(typeof res.status === 'string', '?? ??? ??');
    assert.ok(typeof res.progress === 'number', '??? ?? ??');
    assert.ok(Array.isArray(res.tags), '?? ?? ??');
  });
});

console.log('\n[??? 2] ???? ???? / ??? ?? ????? ?? ??');
const BAD_GOALS = [
  null,
  undefined,
  {},
  { milestones: null },
  { milestones: [null, undefined, {}] },
  { dueDate: 'invalid-date', milestones: [{ dueDate: '9999-99-99', tasks: [null, {}] }] },
  { milestones: [], rescaledCount: 'bad_number' }
];

BAD_GOALS.forEach((badGoal, idx) => {
  runChaos(`rescaleGoal ??? ?? ?? #${idx + 1}`, () => {
    const res = fns.rescaleGoal(badGoal, 0.5);
    if (badGoal) {
      assert.ok(res, '?? ?? ??');
      assert.ok(res.rescaledCount >= 1, '????? ??? ??');
    } else {
      assert.strictEqual(res, null, 'null/undefined? ???? null ??');
    }
  });
});

console.log('\n[??? 3] ??? ??? ???? ?? ? DoS ??');
const REGEX_EXPLOITS = [
  '[' , '(' , ')' , '{' , '}' , '\\' , '^' , '$' , '.' , '|' , '?' , '*' , '+' ,
  '(((((((((a+)+)+)+)+)+)+)+)+)+$',
  '\\\\\\\\\\\\\\\\'
];

const SAMPLE_RECORDS = [
  { text: '?? 5km ?? ??', category: 'workout', startAt: '2026-09-11' },
  { text: '??? ?? 2??', category: 'study', startAt: '2026-09-10' }
];

REGEX_EXPLOITS.forEach((exploit, idx) => {
  runChaos(`?? ?? ??? ?? ?? #${idx + 1} (${exploit})`, () => {
    const res = fns.filterRecordsByQuery(SAMPLE_RECORDS, exploit);
    assert.ok(Array.isArray(res), '?? ?? ?? ??');
  });
});

console.log('\n[??? 4] ?? ??? ??(goalProgress) 0??? ? ?? ?? ??');
const CORRUPT_GOALS = [
  { milestones: [] },
  { milestones: [{ status: 'unknown' }, { status: null }] },
  { milestones: new Array(100).fill({ status: 'done' }) }
];

CORRUPT_GOALS.forEach((cg, idx) => {
  runChaos(`goalProgress ?? ?? #${idx + 1}`, () => {
    const pct = fns.goalProgress(cg);
    assert.ok(!isNaN(pct), 'NaN? ???? ?');
    assert.ok(pct >= 0 && pct <= 100, '0~100 ?? ??? ??');
  });
});

console.log('\n[??? 5] ???? AI ?? ?? ??? ??? ?? ??');
const WEIRD_GOAL_INPUTS = [
  '1234567890',
  '???? ??? ???? ?? ?? ??? ????',
  '!!!???@@@',
  'A'.repeat(500)
];

WEIRD_GOAL_INPUTS.forEach((weird, idx) => {
  runChaos(`???? AI ?? ?? #${idx + 1} (${weird.slice(0, 15)})`, () => {
    const res = localGoalAgentFallback(weird, [], '2026-09-11', {});
    assert.ok(res && res.ops && res.ops.length > 0, '?? ?? ?? ??');
    assert.ok(res.ops[0].data.title, '?? ??? ??');
    assert.ok(res.ops[0].data.milestones.length >= 2, '?? ???? ??');
  });
});

console.log('\n====================================================');
console.log(`[CHAOS MONKEY SUMMARY] Total: ${chaosTotal} | Defended: ${chaosPassed} | Failed: ${chaosFailed}`);
console.log('====================================================');

if (chaosFailed > 0) {
  process.exit(1);
} else {
  console.log('✨ All 45 Chaos Attacks Defended with Zero Vulnerabilities!\n');
  process.exit(0);
}
