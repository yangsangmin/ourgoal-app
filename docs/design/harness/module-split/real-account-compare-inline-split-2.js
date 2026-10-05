'use strict';
// #TASK-ES-432 실계정 읽기 전용 결과 3개(기준1·후·기준2)를 맞댄다 — 단계별 존재·보임·글자 해시·길이·속성 해시·덧붙인 값, window 종류, 기록 수 전후, pageerror.
// 사용: node real-account-compare-inline-split-2.js <base1.json> <after.json> <base2.json> <out.json>
const fs = require('fs');
const [B1, A, B2, OUT] = process.argv.slice(2).map((f, i) => i < 3 ? JSON.parse(fs.readFileSync(f, 'utf8')) : f);
const flat = r => { const o = { loggedIn: r.loggedIn, globals: r.globals, recordsCountUnchanged: r.recordsCountUnchanged, pageerrors: r.errors.length, failure: r.failure || null };
  for (const s of r.steps) for (const [k, v] of Object.entries(s)) if (k !== 'name') o[s.name + '.' + k] = v; return o; };
const cmp = (x, y) => { const fx = flat(x), fy = flat(y); const keys = [...new Set([...Object.keys(fx), ...Object.keys(fy)])].sort(); const diffs = keys.filter(k => JSON.stringify(fx[k]) !== JSON.stringify(fy[k])).map(k => ({ key: k, a: fx[k], b: fy[k] })); return { compared: keys.length, differing: diffs.length, diffs }; };
const out = { base1VsAfter: cmp(B1, A), base1VsBase2: cmp(B1, B2), base2VsAfter: cmp(B2, A), stepsAfter: A.steps.map(s => ({ name: s.name, present: s.present, visible: s.visible, gauges: s.gauges, bannerCount: s.bannerCount, open: s.open })), rowsWritten: 0, pageerrors: [B1.errors.length, A.errors.length, B2.errors.length] };
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n');
console.log(JSON.stringify({ b1a: out.base1VsAfter.differing, b1b2: out.base1VsBase2.differing, b2a: out.base2VsAfter.differing, compared: out.base1VsAfter.compared, steps: out.stepsAfter }));
