'use strict';
// 대조 탐침 두 결과(기준 · 작업)의 이름별 값 지문을 맞댄다(작업자 측정, 판정 아님).
// 사용: node name-fingerprints.cjs <기준 결과.json> <작업 결과.json> <gen-inline-hard-meta.json> <out.json>
const fs = require('fs');
const [B, W, META, OUT, EXPECT] = process.argv.slice(2);
// EXPECT: 이번에 본문이 세포로 옮겨져 글자 지문(함수 글자 해시)이 달라질 것으로 미리 아는 window 함수 이름(쉼표 목록). 옮긴 본문은 인라인 이름에 L. 접두가 붙어 글자가 달라진다.
const b = JSON.parse(fs.readFileSync(B, 'utf8')), w = JSON.parse(fs.readFileSync(W, 'utf8')), meta = JSON.parse(fs.readFileSync(META, 'utf8'));
const out = { tool: 'scripts/probes/cell-registry-compare.js --fingerprints (기준) / --fingerprints --names-from 기준 결과 (작업)', type: '작업자 측정, 판정 아님', counts: { base: b.counts, work: w.counts }, scopeLost: w.namesFrom.scopeLost, scopeAdded: w.namesFrom.scopeAdded };
for (const k of ['scope', 'window']) {
  const fb = b.fingerprints[k], fw = w.fingerprints[k]; const names = Object.keys(fb);
  const diff = names.filter(n => JSON.stringify(fb[n]) !== JSON.stringify(fw[n]));
  out[k] = { names: names.length, diff: diff.length, diffNames: diff.map(n => ({ n, base: fb[n], work: fw[n] })).slice(0, 20) };
}
const expect = new Set((EXPECT || '').split(',').filter(Boolean));
const head = v => String(v).split(':').slice(0, 3).join(':');
out.scope.unexpectedDiff = out.scope.diffNames.filter(d => !expect.has(d.n)).map(d => d.n);
out.scope.movedSameKindNameArity = out.scope.diffNames.filter(d => expect.has(d.n)).every(d => head(d.base) === head(d.work));
out.window.movedFunctionNames = [...expect];
out.window.unexpectedDiff = out.window.diffNames.filter(d => !expect.has(d.n)).map(d => d.n);
out.window.movedSameKindNameArity = out.window.diffNames.filter(d => expect.has(d.n)).every(d => head(d.base) === head(d.work));
out.window.note = '지문은 「종류:이름:인자 수:함수 글자 해시」다. 옮긴 함수는 본문의 인라인 이름에 L. 접두가 붙어 해시만 달라진다(토큰 동일은 verify-inline-hard.json).';
const added = new Set(out.scopeAdded), reg = new Set(b.registeredNames || []);
out.newGetters = { total: meta.exposed.length, alreadyOnScopeInBase: meta.exposed.filter(n => !added.has(n)).length, alreadyOnScopeAndRegistered: meta.exposed.filter(n => !added.has(n) && reg.has(n)).length, newOnScope: meta.exposed.filter(n => added.has(n)) };
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', 'utf8');
console.log(JSON.stringify({ lost: out.scopeLost, added: out.scopeAdded, scope: out.scope, window: out.window.diff, unexpected: out.window.unexpectedDiff, scopeUnexpected: out.scope.unexpectedDiff, scopeSameHead: out.scope.movedSameKindNameArity, sameHead: out.window.movedSameKindNameArity, ng: out.newGetters, ok: [b.ok, w.ok], mm: [b.counts.mismatches, w.counts.mismatches], win: [b.counts.windowNames, w.counts.windowNames] }));
