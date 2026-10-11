#!/usr/bin/env node
'use strict';
// #TASK-ES-678 모의 측정(작업자 측정, 판정 아님) — 저장소 밖 사본에서 `_promptEncyclopediaOpen` 을 실제 생성기(unstate 모드)로 상태 기관 호출로 바꾼 뒤,
// 무결성 게이트가 도우미의 판에 따라 어떻게 답하는지 차례로 잰다. 줄을 바꿔 쓰는 것은 생성기다(손 편집 0). 대조군만 그 호출 줄을 일부러 깨뜨린다.
//   S0 사본 그대로(기준)                                   → 게이트
//   S1 생성기 unstate(_promptEncyclopediaOpen) 적용        → 게이트(사본에 든 게이트·도우미 그대로)
//   S2 + 금고 게이트를 #TASK-ES-669 판으로(도우미는 옛 판) → 게이트   ← 「중간 단계에서 깨진다」가 여기서 보인다
//   S3 + 도우미를 이 PR 판으로                              → 게이트 · npm test
//   C* S3 에서 인라인의 호출 줄을 깨뜨린다(초기값 true · 다른 이름 · 주석 · 문자열 · 상태 기관 태그 빼기) → 게이트의 그 검사가 실패해야 한다. 변형마다 되돌린다.
// 사용: NODE_PATH=… node unstate-gate-mock.cjs <모의 트리(기준 커밋 그대로)> <#669 판 게이트 파일> <이 PR 판 도우미 파일> <out.json>
const fs = require('fs'), path = require('path'), cp = require('child_process');
const [DIR_ARG, GATE_669, HELPER_NEW, OUT] = process.argv.slice(2);
const DIR = path.resolve(DIR_ARG), NL = String.fromCharCode(10);
const NAME = '_promptEncyclopediaOpen', LEGACY = NAME + ' = false;';
const P = rel => path.join(DIR, rel);
const read = rel => fs.readFileSync(P(rel), 'utf8');
const write = (rel, t) => fs.writeFileSync(P(rel), t, { encoding: 'utf8' });
const GATE = 'scripts/verify-integrity-gate.js', HELPER = 'tests/helpers/moved-code.js', GEN = 'docs/design/harness/module-split/gen-inline-hard.js';
function gate() {
  const r = cp.spawnSync(process.execPath, [GATE], { cwd: DIR, encoding: 'utf8', env: process.env, maxBuffer: 256 * 1024 * 1024 });
  const L = ((r.stdout || '') + NL + (r.stderr || '')).split(/\r?\n/);
  const fails = [];
  L.forEach((l, i) => { if (/^\s*(✗|✖|not ok)/.test(l)) fails.push((l.trim() + ' / ' + (L[i + 1] || '').trim()).slice(0, 240)); });
  return { exit: r.status, checkLines: L.filter(l => /^\s*✓ /.test(l)).length, failedChecks: fails.length, fails };
}
const hitsThatCheck = g => g.fails.some(f => /TASK-ES-201|프롬프트 백과사전 아코디언/.test(f));
const html0 = read('index.html');
const out = { tool: 'reports/TASK-ES-678/tools/unstate-gate-mock.cjs', type: '작업자 측정, 판정 아님', name: NAME, steps: {}, controls: [] };
out.steps.S0 = { what: '사본 그대로(기준)', legacyTextInIndex: html0.includes(LEGACY), gate: gate() };
{ // S0b: 상태 이전 전(옛 선언 글자가 있는 지금의 index.html)에 #669 판 게이트와 이 PR 판 도우미를 얹어도 판정이 같은가 — 잰 뒤 되돌린다
  const gate0 = read(GATE), helper0 = read(HELPER);
  try { write(GATE, fs.readFileSync(GATE_669, 'utf8')); write(HELPER, fs.readFileSync(HELPER_NEW, 'utf8')); out.steps.S0b = { what: '상태 이전 전 + #TASK-ES-669 판 게이트 + 이 PR 판 도우미', gate: gate() }; }
  finally { write(GATE, gate0); write(HELPER, helper0); }
}

// S1: 생성기 unstate
const cfg = { task: 'TASK-ES-678', label: '모의 — ' + NAME + ' 한 이름의 상태 이전(측정용, 저장소 밖)', slot: 'HO', mode: 'unstate', cells: [{ file: 'js/core/app-state.js' }], unstate: { names: [NAME] } };
const cfgFile = OUT.replace(/\.json$/, '') + '.unstate-config.json';
fs.writeFileSync(cfgFile, JSON.stringify(cfg, null, 1) + NL, { encoding: 'utf8' });
const g = cp.spawnSync(process.execPath, [GEN, DIR, cfgFile], { cwd: DIR, encoding: 'utf8', env: process.env, maxBuffer: 256 * 1024 * 1024 });
const html1 = read('index.html');
const defLine = html1.split(/\r?\n/).find(l => l.indexOf("OurgoalAppState.define") >= 0 && l.indexOf("'" + NAME + "'") >= 0) || null;
out.steps.S1 = { what: '생성기 unstate 적용(' + NAME + ')', generatorExit: g.status, generatorTail: ((g.stdout || '') + (g.stderr || '')).trim().split(/\r?\n/).slice(-3).map(l => l.slice(0, 200)),
  indexChanged: html1 !== html0, legacyTextInIndex: html1.includes(LEGACY), defineLineInIndex: defLine ? defLine.trim() : null, indexLines: [html0.split(NL).length, html1.split(NL).length], gate: gate() };
if (g.status !== 0 || !defLine || html1.includes(LEGACY)) { fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + NL, { encoding: 'utf8' }); throw new Error('생성기 unstate 가 기대한 꼴을 만들지 못했다 — 결과 파일을 본다'); }

// S2: #669 판 게이트 + 옛 도우미
const helperOld = read(HELPER);
write(GATE, fs.readFileSync(GATE_669, 'utf8'));
out.steps.S2 = { what: '+ 금고 게이트를 #TASK-ES-669 판으로(도우미는 고치기 전 판)', gateCallsHelper: read(GATE).includes('textOrStateDefined(indexHtml'), gate: gate() };
// S3: 이 PR 판 도우미
write(HELPER, fs.readFileSync(HELPER_NEW, 'utf8'));
out.steps.S3 = { what: '+ 도우미를 이 PR 판으로', gate: gate() };
{
  const r = cp.spawnSync('npm test', { cwd: DIR, encoding: 'utf8', env: process.env, shell: true, maxBuffer: 512 * 1024 * 1024, timeout: 900000 });
  const L = ((r.stdout || '') + NL + (r.stderr || '')).split(/\r?\n/);
  out.steps.S3.npmTest = { exit: r.status, checkLines: L.filter(l => /^\s*✓ /.test(l)).length, okLines: L.filter(l => /^\s*ok · /.test(l)).length, failLines: L.filter(l => /^\s*(✗|✖|not ok)/.test(l)).map(l => l.trim().slice(0, 200)) };
}
// 대조군
const DEF = defLine.trim();
const once = (s, a, b) => { if (s.split(a).length !== 2) throw new Error('바꿀 글자가 꼭 한 번 있어야 한다: ' + a.slice(0, 60)); return s.replace(a, () => b); };
const STATE_TAG = '<script src="js/core/app-state.js"></script>';
const variants = [
  ['C1', '호출의 초기값을 false → true 로 바꿈', () => once(html1, DEF, DEF.replace(', false)', ', true)'))],
  ['C2', '호출의 이름을 다른 이름으로 바꿈', () => once(html1, DEF, DEF.replace("'" + NAME + "'", "'" + NAME + "Gone'"))],
  ['C3', '호출 줄을 주석으로 바꿈', () => once(html1, DEF, '/* ' + DEF + ' */')],
  ['C4', '호출 글자를 문자열 안에만 남김', () => once(html1, DEF, 'var controlGroupText = ' + JSON.stringify(DEF) + ';')],
  ['C5', '호출 줄을 지움', () => once(html1, DEF, '')],
  ['C6', 'index.html 에서 상태 기관(js/core/app-state.js) 태그를 뺌', () => once(html1, STATE_TAG, '')],
  ['C7', '상태 기관 태그를 덩어리 스크립트 뒤로 옮김(호출이 기관보다 앞에 있게 됨)', () => { const s = once(html1, STATE_TAG, ''); const i = s.lastIndexOf('</body>'); if (i < 0) throw new Error('</body> 없음'); return s.slice(0, i) + STATE_TAG + NL + s.slice(i); }],
];
for (const [id, what, make] of variants) {
  let r;
  try { write('index.html', make()); r = gate(); } finally { write('index.html', html1); }
  out.controls.push({ id, what, gateExit: r.exit, checkLines: r.checkLines, failedChecks: r.failedChecks, thatCheckFailed: hitsThatCheck(r), onlyThatCheckFailed: r.failedChecks === 1 && hitsThatCheck(r) });
}
out.steps.S3again = { what: '대조군 뒤 되돌린 상태에서 다시', gate: gate() };
// 되돌림(사본을 처음 상태로)
write('index.html', html0); write(HELPER, helperOld);
cp.spawnSync('git', ['checkout', '--', GATE], { cwd: DIR, encoding: 'utf8' });
const S = out.steps;
out.summary = {
  gateS0: [S.S0.gate.checkLines, S.S0.gate.failedChecks], gateS0b: [S.S0b.gate.checkLines, S.S0b.gate.failedChecks], gateS1: [S.S1.gate.checkLines, S.S1.gate.failedChecks], gateS2: [S.S2.gate.checkLines, S.S2.gate.failedChecks], gateS3: [S.S3.gate.checkLines, S.S3.gate.failedChecks],
  s1FailsThatCheck: hitsThatCheck(S.S1.gate), s2FailsThatCheck: hitsThatCheck(S.S2.gate), s3Exit: S.S3.gate.exit,
  npmTestS3: [S.S3.npmTest.exit, S.S3.npmTest.checkLines, S.S3.npmTest.okLines],
  controls: out.controls.length, controlsAllFailThatCheck: out.controls.every(c => c.thatCheckFailed), controlsOnlyThatCheck: out.controls.every(c => c.onlyThatCheckFailed),
  defineLine: S.S1.defineLineInIndex, legacyTextAfterUnstate: S.S1.legacyTextInIndex, gateAfterControls: [S.S3again.gate.checkLines, S.S3again.gate.failedChecks],
};
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + NL, { encoding: 'utf8' });
console.log(JSON.stringify(out.summary, null, 1));
for (const c of out.controls) console.log(c.id + ' ' + c.what + ' → 게이트 종료 ' + c.gateExit + ' · ✓ ' + c.checkLines + ' · 그 검사 실패 ' + c.thatCheckFailed);
