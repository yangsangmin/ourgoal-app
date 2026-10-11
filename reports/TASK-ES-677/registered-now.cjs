#!/usr/bin/env node
'use strict';
// 지금 등록된 이름 목록(작업자 측정 도구, 판정 아님) — reports/TASK-ES-674/registered-now.cjs 에 등록 3차(#TASK-ES-677)의 계획 기록을 더한 것. 다음 재철거의 입력.
// 등록의 정본은 세포 파일 끝의 등록 블록이다. js/** 의 블록을 글자로 읽어(reports/TASK-ES-664/provide-run.cjs 의 readBlock 과 같은 방법)
// 이름마다 { 통로로 나가는가 · window 로 나가는가 } 를 정하고, 가져오기 이름·손잡이 이름은 등록 계획 기록(1차 reports/TASK-ES-614/provide-plan.json ·
// 2차 reports/TASK-ES-664/provide-plan.json)에서 가져온다. 블록에 있는데 계획 기록에 없는 이름·계획 기록에 있는데 블록에 없는 이름이 있으면 멈춘다.
// 산출의 registered 는 계획 파일과 같은 꼴이라 pinned-names.cjs · mock-unwire.cjs · remaining-wiring.cjs 가 그대로 읽는다.
// 사용: node reports/TASK-ES-674/registered-now.cjs <트리> <out.json>
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(process.argv[2]), OUT = path.resolve(process.argv[3]);
const BEGIN = '/* ==== [세포 등록 시작 · gen-cell-provide.js]', END = '/* ==== [세포 등록 끝] ==== */';
const lf = s => s.replace(/\r\n/g, '\n');
const rj = f => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
function readBlock(code) {
  const t = lf(code), b = t.indexOf(BEGIN);
  if (b < 0) return null;
  const e = t.indexOf(END, b), body = t.slice(b, e), out = { owner: null, entries: {} };
  const kitOf = {};
  for (const m of body.matchAll(/^  var (K\d*) = (.+);$/gm)) { const last = m[2].split('&&').pop().trim(); kitOf[m[1]] = last.replace(/^g\./, ''); }
  for (const m of body.matchAll(/^  if \((K\d*)\) R\.provide\('([^']+)', \{\n([\s\S]*?)\n  \}, \{ window: \[([\s\S]*?)\] \}\);$/gm)) {
    const kv = m[1]; out.owner = m[2];
    const tail = m[4], wo = tail.indexOf('], windowOnly: [');
    const strs = s => (s.match(/'([^']+)'/g) || []).map(x => x.slice(1, -1));
    const win = strs(wo >= 0 ? tail.slice(0, wo) : tail), winOnly = wo >= 0 ? strs(tail.slice(wo)) : [];
    for (const pm of m[3].matchAll(/([A-Za-z_$][\w$]*): (K\d*)\.([A-Za-z_$][\w$]*)/g)) out.entries[pm[1]] = { kit: kitOf[kv], member: pm[3], window: win.includes(pm[1]), scope: !winOnly.includes(pm[1]) };
  }
  return out;
}
const jsFiles = []; (function walk(d) { fs.readdirSync(d, { withFileTypes: true }).forEach(e => { const p = path.join(d, e.name); if (e.isDirectory()) return walk(p); if (e.name.endsWith('.js')) jsFiles.push(path.relative(ROOT, p).replace(/\\/g, '/')); }); })(path.join(ROOT, 'js'));
const now = {}, dup = [];
for (const f of jsFiles.sort()) {
  const b = readBlock(fs.readFileSync(path.join(ROOT, f), 'utf8'));
  if (!b) continue;
  for (const n of Object.keys(b.entries)) { if (now[n]) dup.push(n); now[n] = Object.assign({ file: f, owner: b.owner }, b.entries[n]); }
}
const rec = {};
rj('reports/TASK-ES-614/provide-plan.json').registered.forEach(r => { rec[r.name] = Object.assign({ source: 'TASK-ES-614' }, r); });
const p2 = rj('reports/TASK-ES-664/provide-plan.json');
const p3 = rj('reports/TASK-ES-677/provide-plan.json'); // [#TASK-ES-677] 등록 3차의 계획 기록(더한 이름 + 통로로 올린 이름)
p2.registered.concat(p2.keep.upgradedEntries).forEach(r => { rec[r.name] = Object.assign({ source: 'TASK-ES-664' }, r); });
p3.registered.concat(p3.keep.upgradedEntries).forEach(r => { rec[r.name] = Object.assign({ source: 'TASK-ES-677' }, r); });
const noRecord = Object.keys(now).filter(n => !rec[n]).sort(), noBlock = Object.keys(rec).filter(n => !now[n]).sort();
const differs = Object.keys(now).filter(n => rec[n] && (rec[n].file !== now[n].file || rec[n].member !== now[n].member || rec[n].kit !== now[n].kit)).sort();
if (dup.length || noRecord.length || noBlock.length || differs.length) { console.error('등록 블록과 계획 기록이 어긋난다', JSON.stringify({ dup, noRecord, noBlock, differs })); process.exit(1); }
const kindsOf = e => (e.scope && e.window ? 'scope+window' : e.scope ? 'scope' : 'window');
const registered = Object.keys(now).sort().map(n => { const r = rec[n], e = now[n]; return { name: n, kinds: kindsOf(e), kindsRecorded: r.kinds, import: r.import, kit: e.kit, kitVar: r.kitVar, member: e.member, file: e.file, owner: e.owner, source: r.source }; });
const by = {}; registered.forEach(r => { by[r.kinds] = (by[r.kinds] || 0) + 1; });
const out = { tool: 'reports/TASK-ES-677/registered-now.cjs', type: '작업자 측정, 판정 아님', note: '등록의 정본은 세포 파일 끝의 등록 블록이다 — kinds 는 블록에서 읽은 값(windowOnly 목록에 있으면 window 뿐), kindsRecorded 는 그 이름을 등록한 PR 의 계획 기록 값',
  counts: { files: new Set(registered.map(r => r.file)).size, names: registered.length, byKinds: by, kindsChangedSinceRecord: registered.filter(r => r.kinds !== r.kindsRecorded).map(r => r.name) }, registered };
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', { encoding: 'utf8' });
console.log('등록된 이름', registered.length, JSON.stringify(by), '· 기록과 종류가 달라진 이름', out.counts.kindsChangedSinceRecord.length);
