'use strict';
// 인라인 어려움 묶음 생성기(#TASK-ES-439) — 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md
// index.html 인라인 IIFE 의 책임 묶음(scripts/inline-script-map.js 지도의 묶음)을 설정 파일대로 세포 파일로 글자 그대로 옮긴다.
// 1차 생성기(gen-inline-split-1.js, #TASK-ES-423)는 "묶음 안에 옮기지 않는 문이 있으면 멈춘다". 이 생성기는 어려움 유형을 표준 이음매로 푼다:
//   · 함수 선언                      → 세포로 옮김. index.html 은 IIFE 머리에서 같은 이름으로 가져온다(var X = _kit.X — 끌어올림과 같은 효과).
//   · 순수 상수(초기값에 이름·호출 0, 재대입 0) → 세포로 옮김 + 같은 이름으로 가져옴(같은 객체 — 바깥의 내용 변경도 그대로 보인다).
//   · 상태 변수(재대입 있음·초기값이 실행되는 식) → 원래 자리에 그대로 둔다. 옮긴 코드는 L.<이름> getter 로 읽고, 대입하면 setter 를 단다(유형 A1·A2).
//   · window.X = … 노출 문(B1)       → 원래 자리에 그대로 둔다(노출 순서·바깥 파일 덮어쓰기 순서 보존, 인라인 on*="X()" 도 그대로 닿는다 — 유형 C·J).
//   · 설정 take 의 keepRest: true → 이 묶음에서 이름을 고르지 않은 문은 원래 자리에 둔다(묶음을 나눠 옮길 때).
//   · 로드 중 다른 문(B2·B3)         → 4줄 이상이고 감싸도 안전하면 본문을 세포 함수로 옮기고 원래 자리에 그 함수 부르는 한 줄을 남긴다(호출 순서 보존).
//                                       3줄 이하이거나 감쌀 수 없으면(IIFE 로 끌어올려지는 var·최상위 this/arguments/return) 그대로 둔다.
//   · this·arguments(유형 K, 헌법 CELL_SPLIT 5호) → 옮기는 함수 선언의 최상위 this 가 있으면 멈춘다. arguments 는 함수 선언을 선언째로 옮길 때 그 함수 자신의 본문에서 쓰는 것만 허용하고
//                                       (#TASK-ES-657 · 헌법 v2026.10.11-ARGUMENTS), 그 안의 화살표 함수 안 arguments · 감싸는 로드 중 문의 this/arguments 는 예전처럼 멈추거나 그대로 둔다.
// 이름 참조만 바꾼다: 인라인 IIFE 스코프 이름은 L.<이름>(js/core/app-scope.js 통로), 같은 세포 안 이름은 그대로.
// 머리 이음매는 구역 자리 표지(`/* [어려움 이음매 자리 Hn] */`) 바로 아래에 넣는다 — 구역마다 자리가 달라 병렬 빌더의 병합 충돌이 나지 않는다.
// 손으로 옮기지 않는다. 결과를 바꾸려면 설정을 바꿔 다시 돌린다(입력 = 이전 전 index.html).
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node gen-inline-hard.js <APP_DIR> <설정.json> [이전 전 index.html]
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const APP = process.argv[2];
const CFG = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
const SRC = process.argv[4] || path.join(APP, 'index.html');
const TAG = CFG.task; // 예: 'TASK-ES-439'
const html = fs.readFileSync(SRC, 'utf8');
const EOL = html.includes('\r\n') ? '\r\n' : '\n';
const lines = html.split('\n').map(l => l.replace(/\r$/, ''));
let sLine = -1, eLine = -1;
for (let i = 0; i < lines.length; i++) if (lines[i].trim() === '<script>' && (lines[i + 1] || '').trim() === '(function(){' && (lines[i + 2] || '').includes('"use strict"')) { sLine = i + 1; break; }
// #TASK-ES-668: 옮길 덩어리(큰 인라인 IIFE)가 없으면 알 수 없는 TypeError 로 죽지 않고, 이유를 적고 0 이 아닌 종료 코드(3)로 끝낸다. 아무 파일도 쓰지 않는다.
// 조용한 성공이 아니다 — 부르는 쪽(하네스·사람)이 「옮길 것이 없어서 멈췄다」를 종료 코드와 글자로 구분할 수 있다. IIFE 가 있으면 이 줄은 아무것도 하지 않는다.
if (sLine < 0) { console.error('gen-inline-hard: 옮길 덩어리가 없다 — ' + SRC + ' 에 큰 인라인 IIFE(`<script>` 다음 줄 `(function(){`, 그 다음 줄 "use strict")가 없다. 아무 파일도 쓰지 않았다(종료 코드 3).'); process.exitCode = 3; return; }
for (let i = sLine; i < lines.length; i++) if (lines[i].startsWith('</script>')) { eLine = i; break; }
const off = sLine;
const code = lines.slice(sLine, eLine).join('\n');
const ast = parser.parse(code, { sourceType: 'script', ranges: true });
let iife = null;
traverse(ast, { FunctionExpression(p) { if (!iife) iife = p; } });
const iScope = iife.scope;
const top = iife.get('body').get('body');
const H = n => n.loc.start.line + off, HE = n => n.loc.end.line + off;
const fail = m => { throw new Error(m); };

// ── [#TASK-ES-661 · docs/architecture/CELL-REGISTRY-DESIGN.md 3.4절 · 5절 닫힌 목록 X8 — 상민님 2026-10-11 「허용」, 효력 기록 지시함 DIR-004] 빈 구획 쓸기 모드(설정 "mode": "sweep").
// 무엇을 하는가: IIFE 최상위에서 **문이 하나도 없는 구획**(구획 주석 `/* ===` 에서 다음 구획 주석 앞까지 — 지도·옮기기 경로와 같은 규칙)의 주석 줄과 빈 줄을 지운다. 다루는 줄은 두 종류뿐이다:
//   W1 그 구획의 주석 줄(생성기 「옮김」 표지 등 — 줄 전체가 주석인 줄. 여러 줄 주석은 통째로)   W2 그 구획의 빈 줄
// 대상 구획은 **적용 시점의 index.html 을 재서** 정한다: "groups": "all" 이면 지금 문이 0 인 구획 전부, 제목 배열이면 그 제목의 구획만(그 구획에 문이 하나라도 있으면 멈춘다).
// 건드리지 않는 것(지우지 않는다 — 5절 X8 의 정지·제외 조건):
//   · 구획 주석(`/* ===` 줄) 자체 — 생성기(묶음 경계·take.group·region.group)와 지도 도구(scripts/inline-script-map.js · inline-hard-types.js · inline-hard-test-probe.js)가 묶음을 이것으로 가른다
//   · 자리 표지(`[어려움 이음매 자리 X]`)나 1차 이음매 주석(`[#TASK-ES-423] 인라인 스크립트 세포화 1차 이음매`)이 든 구획 — 통째로 제외한다(생성기·검사기가 자리 표지 아래 줄을 빈 줄까지로 센다)
//   · 구획 주석과 같은 줄에 있는 주석 · "keep" 의 글자를 담은 주석(시험·가드가 글자로 붙잡는 주석 — 생성기는 모른다. 쓰는 PR 이 모의 적용 사본에서 시험 전부를 돌려 찾아 적는다) · 그런 주석과 줄을 나눠 쓰는 주석
//   · 문이 있는 구획의 주석·빈 줄 · 첫 구획 주석 앞(머리) · 문 안의 주석 · IIFE 밖의 글자
// 안전 정지(fail): 제목 배열의 구획에 문이 있음 · 제목에 맞는 구획 주석이 없음 · 제목 배열이 제외 구획(자리 표지·1차 이음매)을 가리킴 · 한 줄에 구획 주석 둘 · 구획 경계에 걸친 주석 ·
//   대상 줄에 실행 글자(토큰)가 있음 · keep 의 글자를 담은 주석이 대상 구획에 없음(오타 방지) · 지울 줄이 0 · 모르는 칸. 멈추면 index.html 을 쓰지 않는다. 세포 파일은 쓰지 않는다.
// 여러 실행: "sweep" 이 배열이면 차례로 적용한다(앞 실행 결과를 다시 파싱). 배열의 단계가 { "unwire": { … } } 이면 그 단계는 unwire 실행 하나로 돈다(unwireOnce 를 그대로 부른다 — unstate 와 같은 꼴).
// 사후 대조(모든 실행): 다시 파싱한 토큰열(주석 제외) = 이전 토큰열(실행 글자 0 변화) · 남은 주석 = 이전 주석 − 지운 주석 · 줄 수 = 이전 − 지운 줄. 다르면 쓰지 않고 멈춘다.
// 설정 예: { "task": "TASK-ES-6xx", "slot": "HO", "mode": "sweep", "cells": [{ "file": "js/core/cell-registry.js" }], "sweep": { "groups": "all", "keep": ["filterHarmfulWords"] } }
//   제목으로 고르기: "sweep": { "groups": ["(구획 주석 제목)", "…"] }    여러 단계: "sweep": [ { "unwire": { "kitVar": "_uiKit", "names": ["…"] } }, { "groups": "all" } ]
if (CFG.mode === 'sweep') { runSweep(); return; }
function runSweep() {
  for (const k of Object.keys(CFG)) if (!['task', 'label', 'slot', 'mode', 'cells', 'sweep'].includes(k)) fail('sweep 설정에 모르는 칸: ' + k);
  const isList = Array.isArray(CFG.sweep);
  const specs = isList ? CFG.sweep : [CFG.sweep || {}];
  if (isList && !specs.length) fail('sweep 배열이 비었다');
  let doc = parseUnwireDoc(lines);
  const metas = [], logs = [];
  for (let i = 0; i < specs.length; i++) {
    const sp = specs[i];
    let r;
    try {
      if (isList && sp && typeof sp === 'object' && !Array.isArray(sp) && Object.prototype.hasOwnProperty.call(sp, 'unwire')) { // unwire 단계 — unwireOnce 를 그대로 부른다
        if (Object.keys(sp).length !== 1) fail('unwire 단계에는 unwire 칸 하나만 둔다');
        r = unwireOnce(sp.unwire, doc);
        r = { next: r.next, meta: Object.assign({ step: 'unwire' }, r.meta), log: ['unwire'].concat(r.log) };
      } else {
        r = sweepOnce(sp, doc);
        if (isList) r = { next: r.next, meta: Object.assign({ step: 'sweep' }, r.meta), log: r.log };
      }
    } catch (err) { if (isList) err.message = '[sweep 실행 ' + (i + 1) + '/' + specs.length + '] ' + err.message; throw err; }
    metas.push(r.meta); logs.push(r.log);
    doc = r.next;
  }
  fs.writeFileSync(path.join(APP, 'index.html'), doc.lines.join(EOL), { encoding: 'utf8' });
  const meta = isList
    ? { task: TAG, mode: 'sweep', runs: metas, htmlLinesBefore: lines.length, htmlLinesAfter: doc.lines.length, files: {} }
    : Object.assign({ task: TAG, mode: 'sweep' }, metas[0], { files: {} });
  fs.writeFileSync(path.join(process.env.MODULE_SPLIT_OUT || require('os').tmpdir(), 'gen-inline-hard-meta.json'), JSON.stringify(meta, null, 1), { encoding: 'utf8' });
  logs.forEach((l, i) => console.log(...(isList ? ['[' + (i + 1) + '/' + specs.length + ']'] : []), ...l));
  console.log('index.html lines', lines.length, '->', doc.lines.length);
}
function sweepOnce(U, doc) {
  const { lines, top, iScope } = doc; // 이 실행이 보는 문서(앞 실행의 결과). 파일 머리의 같은 이름을 가린다.
  const H = n => n.loc.start.line + doc.off, HE = n => n.loc.end.line + doc.off;
  if (!U || typeof U !== 'object' || Array.isArray(U)) fail('sweep 실행 설정은 객체여야 한다');
  for (const k of Object.keys(U)) if (!['groups', 'keep', 'label'].includes(k)) fail('sweep 설정에 모르는 칸: ' + k);
  const ALL = U.groups === 'all';
  if (!ALL && !(Array.isArray(U.groups) && U.groups.length && U.groups.every(t => typeof t === 'string' && t))) fail('sweep.groups 는 "all" 이거나 구획 주석 제목의 배열이어야 한다');
  if (!ALL && new Set(U.groups).size !== U.groups.length) fail('sweep.groups 에 같은 제목이 두 번 있다');
  const keep = U.keep === undefined ? [] : U.keep;
  if (!Array.isArray(keep) || !keep.every(t => typeof t === 'string' && t) || new Set(keep).size !== keep.length) fail('sweep.keep 은 비지 않은 글자의 배열이어야 한다(겹침 없이)');
  const body = iScope.path.node.body;
  const isComment = t => typeof t.type === 'string';
  const sig = t => JSON.stringify([t.type.label || '', t.value === undefined ? '' : String(t.value)]);
  const comSig = c => JSON.stringify([c.type, c.value]);
  const codeToks = d => d.ast.tokens.filter(t => !isComment(t) && t.type.label !== 'eof');
  const SLOT = '[어려움 이음매 자리 ', SEAM1 = '[#TASK-ES-423] 인라인 스크립트 세포화 1차 이음매';
  const isHeader = c => c.type === 'CommentBlock' && /^\s*=+/.test(c.value);
  const kindOf = c => isHeader(c) ? 'header' : c.value.includes(SLOT) ? 'slot' : c.value.includes(SEAM1) ? 'seam1'
    : /^\s*\[#[\w-]+\][^\n]*로 옮김/.test(c.value) ? 'moved' : /^\s*\[#[\w-]+\] js\/\S+ — /.test(c.value) ? 'genHead' : 'other';
  // 최상위(문 밖) 주석 · 실행 글자가 있는 줄 · 종류별 집계(이전/이후 표에 쓴다)
  const survey = d => {
    const b = d.iScope.path.node.body, L = n => n.loc.start.line + d.off, LE = n => n.loc.end.line + d.off;
    const spans = d.top.map(st => [st.node.start, st.node.end]).concat((b.directives || []).map(x => [x.start, x.end]));
    const topComments = d.ast.comments.filter(c => c.start > b.start && c.end < b.end && !spans.some(([s, e]) => c.start >= s && c.end <= e));
    const codeLine = new Set();
    for (const t of codeToks(d)) for (let l = L(t); l <= LE(t); l++) codeLine.add(l);
    const commentLine = new Map();
    for (const c of topComments) for (let l = L(c); l <= LE(c); l++) { if (!commentLine.has(l)) commentLine.set(l, []); commentLine.get(l).push(c); }
    return { topComments, codeLine, commentLine };
  };
  // 종류별 줄 수(이전/이후 표): 문이 걸친 줄(문 안의 빈 줄·주석 줄 포함)은 최상위 틈이 아니다 — 집계에서 뺀다
  const stmtLines = d => { const s = new Set(), b = d.iScope.path.node.body, L = n => n.loc.start.line + d.off, LE = n => n.loc.end.line + d.off; for (const n of d.top.map(st => st.node).concat(b.directives || [])) for (let l = L(n); l <= LE(n); l++) s.add(l); return s; };
  const gapTally = d => {
    const sv = survey(d), inStmt = stmtLines(d), b = d.iScope.path.node.body, t = { header: 0, slot: 0, seam1: 0, moved: 0, genHead: 0, other: 0, blank: 0 };
    for (let l = d.off + b.loc.start.line + 1; l < d.off + b.loc.end.line; l++) {
      if (inStmt.has(l)) continue;
      const cs = sv.commentLine.get(l);
      if (cs) t[kindOf(cs[0])]++; else if (d.lines[l - 1].trim() === '') t.blank++;
    }
    return t;
  };
  const sv = survey(doc);
  // ── 구획(구획 주석에서 다음 구획 주석 앞까지). 첫 구획 주석 앞(머리)은 구획이 아니다 — 다루지 않는다
  const headers = sv.topComments.filter(isHeader).map(c => ({ c, line: H(c), endLine: HE(c), text: c.value }));
  const lastLine = HE(body) - 1;
  headers.forEach((h, i) => {
    const nx = headers[i + 1];
    if (nx && nx.line <= h.endLine) fail('한 줄에 구획 주석이 둘이다(줄 ' + nx.line + ') — sweep 은 구획을 줄로 가른다');
    h.end = nx ? nx.line - 1 : lastLine;
    h.title = h.text.split('\n')[0].replace(/^\s*=+\s*/, '').replace(/\s*=+\s*$/, '');
  });
  for (const h of headers) {
    h.sts = top.filter(st => H(st.node) >= h.line && H(st.node) <= h.end);
    h.comments = sv.topComments.filter(c => c !== h.c && H(c) >= h.line && H(c) <= h.end);
    const has = s => h.text.includes(s) || h.comments.some(c => c.value.includes(s));
    h.excluded = has(SLOT) ? '자리 표지가 든 구획' : has(SEAM1) ? '1차 이음매 구획' : null;
  }
  // ── 대상 구획
  let targets;
  const skipped = [];
  if (ALL) {
    targets = headers.filter(h => !h.sts.length && !h.excluded);
    for (const h of headers) if (!h.sts.length && h.excluded) skipped.push({ title: h.title, line: h.line, why: h.excluded });
  } else {
    targets = [];
    for (const title of U.groups) {
      const hs = headers.filter(h => h.text.includes(title));
      if (!hs.length) fail('구획 주석이 0개: ' + title);
      for (const h of hs) {
        if (h.sts.length) fail('구획에 문이 ' + h.sts.length + '개 있다 — sweep 은 문이 없는 구획만 다룬다: ' + title + ' (줄 ' + h.line + ')');
        if (h.excluded) fail('sweep 이 다루지 않는 구획이다(' + h.excluded + '): ' + title + ' (줄 ' + h.line + ')');
        if (targets.includes(h)) fail('sweep.groups 의 두 제목이 같은 구획을 가리킨다: ' + title + ' (줄 ' + h.line + ')');
        targets.push(h);
      }
    }
    targets.sort((a, b) => a.line - b.line);
  }
  if (!targets.length) fail('문이 없는 구획이 없다 — 지울 것이 없다');
  // ── 지울 줄
  const del = new Set(), delComments = new Set(), kept = [], keepHit = new Set();
  const report = [];
  for (const h of targets) {
    const a = h.endLine + 1, b = h.end;
    const cs = [], keptHere = new Set(), why = new Map();
    for (const c of h.comments) {
      if (H(c) <= h.endLine) { kept.push({ line: H(c), why: '구획 주석과 같은 줄', text: c.value.trim().slice(0, 80) }); if (HE(c) > h.endLine) fail('구획 주석 줄에서 시작해 아래로 이어지는 주석(줄 ' + H(c) + ') — 줄 단위로 가를 수 없다'); continue; }
      if (HE(c) > b) fail('구획 경계에 걸친 주석(줄 ' + H(c) + '~' + HE(c) + ') — 다음 구획 주석과 줄을 나눠 쓴다');
      cs.push(c);
    }
    const owners = new Map();
    for (const c of cs) for (let l = H(c); l <= HE(c); l++) { if (!owners.has(l)) owners.set(l, []); owners.get(l).push(c); }
    for (const c of cs) { const k = keep.find(s => c.value.includes(s)); if (k !== undefined) { keptHere.add(c); why.set(c, 'keep: ' + k); } }
    for (const c of cs) for (const s of keep) if (c.value.includes(s)) keepHit.add(s);
    for (let again = true; again;) { // 지키는 주석과 줄을 나눠 쓰는 주석은 함께 남긴다(줄 단위로만 지운다)
      again = false;
      for (const c of cs) if (!keptHere.has(c)) for (let l = H(c); l <= HE(c); l++) if (owners.get(l).some(o => keptHere.has(o))) { keptHere.add(c); why.set(c, '지키는 주석과 같은 줄'); again = true; break; }
    }
    let nc = 0, nb = 0;
    for (let l = a; l <= b; l++) {
      if (sv.codeLine.has(l)) fail('문이 없는 구획의 줄 ' + l + ' 에 실행 글자가 있다(닫힌 목록 밖 줄) — 쓰지 않는다');
      const os = owners.get(l);
      if (!os) { if (lines[l - 1].trim() !== '') fail('줄 ' + l + ' 은 주석도 빈 줄도 아니다(닫힌 목록 밖 줄) — 쓰지 않는다'); del.add(l); nb++; continue; }
      if (os.every(o => !keptHere.has(o))) { del.add(l); nc++; }
    }
    for (const c of cs) { if (keptHere.has(c)) kept.push({ line: H(c), why: why.get(c), text: c.value.trim().slice(0, 80) }); else delComments.add(c); }
    report.push({ title: h.title, line: h.line, headerLines: h.endLine - h.line + 1, end: h.end, deletedCommentLines: nc, deletedBlankLines: nb, keptComments: keptHere.size });
  }
  const unused = keep.filter(s => !keepHit.has(s));
  if (unused.length) fail('sweep.keep 의 글자를 담은 주석이 대상 구획에 없다: ' + unused.join(' · '));
  if (!del.size) fail('지울 줄이 0 — 대상 구획에 지울 주석·빈 줄이 없다');
  const nl = lines.filter((_, i) => !del.has(i + 1));
  const next = parseUnwireDoc(nl);
  // ── 사후 대조: 실행 글자 0 변화 · 남은 주석 = 이전 − 지운 주석 · 줄 수
  {
    const want = codeToks(doc).map(sig), got = codeToks(next).map(sig);
    let diffAt = want.length === got.length ? -1 : Math.min(want.length, got.length);
    for (let i = 0; i < Math.min(want.length, got.length); i++) if (want[i] !== got[i]) { diffAt = i; break; }
    if (diffAt >= 0) fail('지운 뒤 토큰열이 이전과 다르다(실행 글자 변화) — 쓰지 않는다: 토큰 ' + diffAt);
    const wantCom = doc.ast.comments.filter(c => !delComments.has(c)).map(comSig), gotCom = next.ast.comments.map(comSig);
    if (wantCom.length !== gotCom.length || wantCom.some((v, i) => v !== gotCom[i])) fail('지운 뒤 남은 주석이 예상과 다르다 — 쓰지 않는다');
    if (nl.length !== lines.length - del.size) fail('지운 뒤 줄 수가 예상과 다르다 — 쓰지 않는다');
  }
  const byKind = {};
  for (const l of del) { const os = sv.commentLine.get(l); if (os) { const k = kindOf(os[0]); byKind[k] = (byKind[k] || 0) + 1; } }
  const wordsOf = s => new Set(s.match(/[A-Za-z_$][\w$]{3,}/g) || []);
  const after = wordsOf(nl.join('\n'));
  const vanishedWords = [...wordsOf([...delComments].map(c => c.value).join('\n'))].filter(w => !after.has(w)).sort();
  const nCom = [...del].filter(l => sv.commentLine.has(l)).length;
  const meta = {
    groups: ALL ? 'all' : U.groups, keep,
    emptyGroups: { total: headers.filter(h => !h.sts.length).length, swept: targets.length, skipped },
    deleted: { lines: del.size, commentLines: nCom, blankLines: del.size - nCom, comments: delComments.size, commentLinesByKind: byKind },
    kept, targets: report, removedLines: [...del].sort((a, b) => a - b),
    gapLinesBefore: gapTally(doc), gapLinesAfter: gapTally(next),
    vanishedWords, htmlLinesBefore: lines.length, htmlLinesAfter: nl.length,
  };
  const log = ['sweep', '· groups', targets.length, '· lines', del.size, '(주석 ' + nCom + ' · 빈 줄 ' + (del.size - nCom) + ')', '· kept', kept.length, '· skipped', skipped.length];
  return { next, meta, log };
}

// ── [#TASK-ES-662 · docs/architecture/CELL-REGISTRY-DESIGN.md 3.4절 · 5절 닫힌 목록 X9(+X2) — 상민님 2026-10-11 「허용」, 효력 기록 지시함 DIR-004] 마지막 모드(설정 "mode": "finalize").
// 전제(아니면 멈춘다): IIFE 최상위 문이 세 종류뿐이다 — ① 키트 손잡이 `var _k = window.X;`(`window.X.y` 포함 — unwire X1 과 같은 꼴) ② 구역 함수 가져오기 `var f = _k.f;`(이름과 속성이 같고, 최상위에서 한 번 이상 불린다) ③ 구역 함수 호출문 `f();`(인자 없음).
//   함수 선언 · expose 문 · 상태 선언 · 그 밖의 var · window 대입 · if · try · 구역 함수가 아닌 호출문 · 호출되지 않는 가져오기 · 쓰이지 않는 손잡이가 하나라도 있으면 종류별 수를 적고 멈춘다.
// 하는 일(네 가지뿐):
//   F1 부팅 파일 js/app/boot.js 를 만든다 — IIFE 껍데기와 남은 문(손잡이 · 가져오기 · 호출)을 **글자 그대로, 같은 순서로** 담는다. 주석·빈 줄은 옮기지 않는다.
//      (부르는 방식을 바꾸지 않는다: 가져오기를 건너뛰고 `window.키트.f()` 로 부르면 값을 잡는 시점과 this 가 달라진다 — 그래서 문을 고쳐 쓰지 않고 그대로 옮긴다.)
//   F2 index.html 에서 `<script>` 줄부터 `</script>` 줄까지(껍데기 5줄 · 남은 문 · 주석 · 빈 줄)를 지운다.
//   F3 `<script>` 바로 앞 줄(script 태그로 끝나는 줄) 끝에 `<script src="js/app/boot.js"></script>` 를 붙인다 — defer·async 없이 같은 자리의 동기 태그(로드 순서 = 실행 순서. /ui.js(defer)가 호출 시점에 읽는 window 이름이 그때 이미 있어야 한다).
//   그 밖의 글자는 바꾸지 않는다. 다른 인라인 스크립트 블록(접속 통계 조각 · ESC 키 처리기)은 건드리지 않는다.
// 안전 정지(fail): 전제 미충족 · `<script>`/`(function(){`/`"use strict";`/`})();`/`</script>` 줄에 다른 글자 · 스크립트 블록에 IIFE 밖의 문 · IIFE 가 인자를 받거나 넘김 · 같은 이름의 손잡이·가져오기 둘 ·
//   앞 줄이 script 태그로 끝나지 않음 · 부팅 파일이 이미 있음 · index.html 에 부팅 파일 글자가 이미 있음 · cells 가 `js/app/boot.js` 하나가 아님 · title·desc 꼴 · 모르는 칸. 멈추면 아무것도 쓰지 않는다.
// 사후 대조: ① 부팅 파일을 다시 파싱한 토큰열(주석 제외) = 이전 IIFE 스크립트의 토큰열(실행 글자 0 변화) ② 새 index.html 에 큰 인라인 IIFE 가 없고 부팅 태그가 꼭 한 번 있다 ③ 줄 수 = 이전 − 지운 줄 ④ 지운 구간 밖의 줄은 태그를 붙인 한 줄 말고 그대로다. 다르면 쓰지 않고 멈춘다.
// 설정 예: { "task": "TASK-ES-6xx", "mode": "finalize", "label": "…", "cells": [{ "file": "js/app/boot.js", "title": "OurGoal App Boot (부팅 — 구역 함수를 순서대로 부른다)", "desc": ["…"] }] }
if (CFG.mode === 'finalize') { runFinalize(); return; }
function runFinalize() {
  const BOOT = 'js/app/boot.js', BOOT_TAG = '<script src="' + BOOT + '"></script>';
  for (const k of Object.keys(CFG)) if (!['task', 'label', 'slot', 'mode', 'cells', 'relay', 'keepInline', 'keepGlobalConst'].includes(k)) fail('finalize 설정에 모르는 칸: ' + k);
  if (typeof TAG !== 'string' || !TAG) fail('finalize 설정 task 가 없다');
  if (!Array.isArray(CFG.cells) || CFG.cells.length !== 1 || !CFG.cells[0] || typeof CFG.cells[0] !== 'object') fail('finalize 설정 cells 는 부팅 파일 하나여야 한다');
  const C = CFG.cells[0];
  for (const k of Object.keys(C)) if (!['file', 'title', 'desc'].includes(k)) fail('finalize 세포 설정에 모르는 칸: ' + k);
  if (C.file !== BOOT) fail('finalize 의 부팅 파일은 ' + BOOT + ' 로 정해져 있다: ' + C.file);
  if (typeof C.title !== 'string' || !C.title || !Array.isArray(C.desc) || !C.desc.length || !C.desc.every(d => typeof d === 'string' && d)) fail('finalize 세포 title · desc(비지 않은 글자의 배열)가 없다');
  if ([C.title].concat(C.desc).some(d => d.includes('*/') || /[\r\n]/.test(d))) fail('finalize 세포 title · desc 에 주석을 닫는 글자나 줄바꿈이 있다');
  if (fs.existsSync(path.join(APP, BOOT))) fail('부팅 파일이 이미 있다: ' + BOOT);
  if (html.includes(BOOT)) fail('index.html 에 이미 부팅 파일 글자가 있다: ' + BOOT);
  // ── [#TASK-ES-681 · 설계 5.9절] 명시적 옵션 둘 — 둘 다 기본은 꺼져 있다(예전과 같은 글자로 멈춘다). 설정에 이름과 근거 글자를 적은 경우에만 동작하고, 쓴 것마다 표준 출력 한 줄과 메타 기록이 남는다.
  //   relay      등록 기관에 등록할 수 없는 키트 이름의 통로 중계(가져오기 한 줄 + 그 이름의 getter 만 담은 expose 문)를 부팅 파일로 글자 그대로 옮긴다.
  //   keepInline 지정한 문(var 선언 · 상태 선언)을 인라인 IIFE 에 줄 그대로 남긴다. 실행 순서를 지키려고 그 문보다 앞에서 도는 문(호출문 · relay expose 문)과 그 문들이 읽는 가져오기 · 손잡이 줄도 함께 남기고,
  //              나머지만 부팅 파일로 옮긴다. 부팅 태그는 남긴 `</script>` 줄 끝에 붙인다(인라인 → 부팅 파일 순서). 양쪽이 함께 쓰는 손잡이 줄은 부팅 파일에 같은 글자로 한 번 더 적는다.
  const okReason = r => typeof r === 'string' && r.trim().length >= 10 && !/[\r\n]/.test(r) && !r.includes('*/');
  const RELAY = new Map();
  if (CFG.relay !== undefined) {
    if (!Array.isArray(CFG.relay) || !CFG.relay.length) fail('finalize 설정 relay 는 비지 않은 배열이어야 한다(스위치로 풀리지 않는다)');
    for (const r of CFG.relay) {
      if (!r || typeof r !== 'object' || Array.isArray(r)) fail('finalize 설정 relay 의 칸은 { name, reason } 이어야 한다');
      for (const k of Object.keys(r)) if (!['name', 'reason'].includes(k)) fail('finalize 설정 relay 에 모르는 칸: ' + k);
      if (typeof r.name !== 'string' || !/^[A-Za-z_$][\w$]*$/.test(r.name)) fail('finalize 설정 relay 의 name 이 이름 꼴이 아니다: ' + JSON.stringify(r.name));
      if (!okReason(r.reason)) fail('finalize 설정 relay 「' + r.name + '」 의 근거(reason)가 없거나 짧거나(10자 미만) 여러 줄이다');
      if (RELAY.has(r.name)) fail('finalize 설정 relay 에 같은 이름이 둘이다: ' + r.name);
      RELAY.set(r.name, { reason: r.reason, importLine: null, getterLine: null, exposeLines: null });
    }
  }
  let KEEP = null;
  if (CFG.keepInline !== undefined) {
    const k = CFG.keepInline;
    if (!k || typeof k !== 'object' || Array.isArray(k)) fail('finalize 설정 keepInline 은 { statements, reason } 이어야 한다(스위치로 풀리지 않는다)');
    for (const x of Object.keys(k)) if (!['statements', 'reason'].includes(x)) fail('finalize 설정 keepInline 에 모르는 칸: ' + x);
    if (!Array.isArray(k.statements) || !k.statements.length || !k.statements.every(p => typeof p === 'string' && p.trim() === p && p.length >= 5 && !/[\r\n]/.test(p))) fail('finalize 설정 keepInline.statements 는 문의 글자 앞머리(5자 이상 한 줄, 앞뒤 공백 없음)의 비지 않은 배열이어야 한다');
    if (new Set(k.statements).size !== k.statements.length) fail('finalize 설정 keepInline.statements 에 같은 앞머리가 둘이다');
    if (!okReason(k.reason)) fail('finalize 설정 keepInline 의 근거(reason)가 없거나 짧거나(10자 미만) 여러 줄이다');
    KEEP = { reason: k.reason, prefixes: k.statements.slice() };
  }
  // ── [#TASK-ES-687 · 설계 5.9절] 명시적 옵션 keepGlobalConst — 기본은 꺼져 있다. keepInline 과 함께 쓸 수 없다(인라인에 문을 남기는 길은 하나만 고른다).
  //   지정한 「문자열 리터럴로 초기화하는 한 줄 var 선언」만 index.html 에 줄 그대로 남긴다 — IIFE 껍데기 없이 최상위 스크립트로(그 이름은 전역 이름이 된다). 나머지 문은 전부 부팅 파일로 간다.
  //   그 이름을 읽는 문(readers 에 적은 상태 선언)도 부팅 파일로 간다 — 「연결 만들기」와 그 뒤의 문이 한 스크립트 안에서 이어서 돈다.
  //   왜 keepInline 이 아닌가: 문 차례가 같아도 스크립트를 가르면 그 경계에서 브라우저가 밀린 약속(마이크로태스크)을 먼저 돌린다. 연결 만들기를 인라인에, 수신기 걸기를 부팅 파일에 두면 그 사이에 라이브러리 초기화가 끝나 버린다(#TASK-ES-685 독립 확인의 측정 — 설계 5.9절 경고).
  //   그래서 이 옵션이 인라인에 남기는 것은 「차례에 무관한 문」뿐이다: 부수효과도 다른 이름 읽기도 없는 문자열 상수 선언.
  let GKC = null;
  if (CFG.keepGlobalConst !== undefined) {
    const g = CFG.keepGlobalConst;
    if (KEEP) fail('finalize 설정 keepGlobalConst 는 keepInline 과 함께 쓸 수 없다 — 인라인에 문을 남기는 길은 하나만 고른다');
    if (!g || typeof g !== 'object' || Array.isArray(g)) fail('finalize 설정 keepGlobalConst 는 { statements, readers, reason } 이어야 한다(스위치로 풀리지 않는다)');
    for (const x of Object.keys(g)) if (!['statements', 'readers', 'reason'].includes(x)) fail('finalize 설정 keepGlobalConst 에 모르는 칸: ' + x);
    const okList = a => Array.isArray(a) && a.length > 0 && a.every(p => typeof p === 'string' && p.trim() === p && p.length >= 5 && !/[\r\n]/.test(p));
    if (!okList(g.statements)) fail('finalize 설정 keepGlobalConst.statements 는 문의 글자 앞머리(5자 이상 한 줄, 앞뒤 공백 없음)의 비지 않은 배열이어야 한다');
    if (g.readers !== undefined && !okList(g.readers)) fail('finalize 설정 keepGlobalConst.readers 는 문의 글자 앞머리(5자 이상 한 줄, 앞뒤 공백 없음)의 비지 않은 배열이어야 한다(없으면 칸을 적지 않는다)');
    const allP = g.statements.concat(g.readers || []);
    if (new Set(allP).size !== allP.length) fail('finalize 설정 keepGlobalConst 의 statements · readers 에 같은 앞머리가 둘이다');
    if (!okReason(g.reason)) fail('finalize 설정 keepGlobalConst 의 근거(reason)가 없거나 짧거나(10자 미만) 여러 줄이다');
    GKC = { reason: g.reason, prefixes: g.statements.slice(), readerPrefixes: (g.readers || []).slice() };
  }
  const doc = parseUnwireDoc(lines);
  const { top, iScope } = doc;
  const s = doc.off; // lines[s - 1] = `<script>` 줄, lines[s] = `(function(){` 줄
  let e = -1; for (let i = s; i < lines.length; i++) if (lines[i].startsWith('</script>')) { e = i; break; }
  const H = n => n.loc.start.line + s, HE = n => n.loc.end.line + s;
  const iifeFn = iScope.path.node, body = iifeFn.body, prog = doc.ast.program.body;
  const isComment = t => typeof t.type === 'string';
  const sig = t => JSON.stringify([t.type.label || '', t.value === undefined ? '' : String(t.value)]);
  const codeToks = a => a.tokens.filter(t => !isComment(t) && t.type.label !== 'eof').map(sig);
  // ── 껍데기 꼴: 다섯 줄이 정해진 글자뿐이어야 한다(줄 안의 다른 글자를 함께 지우지 않게)
  if (lines[s - 1] !== '<script>') fail('`<script>` 줄에 다른 글자가 있다(줄 ' + s + ')');
  if (lines[s] !== '(function(){') fail('`(function(){` 줄에 다른 글자가 있다(줄 ' + (s + 1) + ')');
  if (lines[s + 1].trim() !== '"use strict";') fail('`"use strict";` 줄에 다른 글자가 있다(줄 ' + (s + 2) + ')');
  if (lines[e - 1] !== '})();') fail('`})();` 줄에 다른 글자가 있다(줄 ' + e + ')');
  if (lines[e] !== '</script>') fail('`</script>` 줄에 다른 글자가 있다(줄 ' + (e + 1) + ')');
  const call = prog.length === 1 && prog[0].type === 'ExpressionStatement' ? prog[0].expression : null;
  if (!call || call.type !== 'CallExpression' || call.callee !== iifeFn) fail('스크립트 블록에 IIFE 밖의 문이 있다 — finalize 는 IIFE 하나뿐인 블록만 다룬다');
  if (iifeFn.params.length || call.arguments.length || iifeFn.id || iifeFn.async || iifeFn.generator) fail('IIFE 가 인자를 받거나 넘기거나 이름이 있다 — 껍데기 꼴이 다르다');
  if ((body.directives || []).length !== 1 || body.directives[0].value.value !== 'use strict') fail('IIFE 머리의 지시문이 "use strict" 하나가 아니다');
  if (!/<script src="[^"]+"><\/script>$/.test(lines[s - 2] || '')) fail('`<script>` 앞 줄이 script 태그로 끝나지 않는다 — 부팅 태그를 붙일 자리가 없다(줄 ' + (s - 1) + ')');
  // ── 전제: 최상위 문이 손잡이 · 구역 함수 가져오기 · 구역 함수 호출문뿐
  const oneVar = st => (st.isVariableDeclaration() && st.node.kind === 'var' && st.node.declarations.length === 1 && st.node.declarations[0].id.type === 'Identifier') ? st.node.declarations[0] : null;
  const plainMember = n => !!n && n.type === 'MemberExpression' && !n.computed && n.object.type === 'Identifier' && n.property.type === 'Identifier';
  const rootWin = n => { let x = n; while (x && x.type === 'MemberExpression' && !x.computed) x = x.object; return !!x && x.type === 'Identifier' && x.name === 'window'; };
  const winChain = n => { let x = n; if (!x || x.type !== 'MemberExpression') return false; while (x.type === 'MemberExpression') { if (x.computed || x.property.type !== 'Identifier') return false; x = x.object; } return x.type === 'Identifier' && x.name === 'window'; }; // window.A · window.A.b — unwire(X1)가 받는 손잡이 꼴과 같다
  const calleeText = x => (x.callee.type === 'MemberExpression' ? doc.code.slice(x.callee.start, x.callee.end) : '');
  const handles = new Map(), imports = new Map(), calls = [], bad = [];
  const text = st => doc.code.slice(st.node.start, st.node.end);
  // [#TASK-ES-681] keepInline: 앞머리마다 최상위 문이 꼭 하나여야 한다
  const keptIdx = new Map(), kept = [], relayExposes = [];
  if (KEEP) for (const p of KEEP.prefixes) {
    const hit = []; top.forEach((st, i) => { if (text(st).startsWith(p)) hit.push(i); });
    if (hit.length !== 1) fail('keepInline 지정이 문 하나로 정해지지 않는다: 「' + p + '」 — 맞는 최상위 문 ' + hit.length + '개');
    if (keptIdx.has(hit[0])) fail('keepInline 지정 둘이 같은 문을 가리킨다: 「' + p + '」 (줄 ' + H(top[hit[0]].node) + ')');
    keptIdx.set(hit[0], p);
  }
  // [#TASK-ES-687] keepGlobalConst: 남길 선언(gIdx) · 그 이름을 읽어 부팅 파일로 가는 문(grIdx) — 앞머리마다 최상위 문이 꼭 하나여야 한다
  const gIdx = new Map(), grIdx = new Map(), gkept = [], greaders = [];
  if (GKC) for (const [list, map, what] of [[GKC.prefixes, gIdx, 'statements'], [GKC.readerPrefixes, grIdx, 'readers']]) for (const p of list) {
    const hit = []; top.forEach((st, i) => { if (text(st).startsWith(p)) hit.push(i); });
    if (hit.length !== 1) fail('keepGlobalConst.' + what + ' 지정이 문 하나로 정해지지 않는다: 「' + p + '」 — 맞는 최상위 문 ' + hit.length + '개');
    if (gIdx.has(hit[0]) || grIdx.has(hit[0])) fail('keepGlobalConst 지정 둘이 같은 문을 가리킨다: 「' + p + '」 (줄 ' + H(top[hit[0]].node) + ')');
    map.set(hit[0], p);
  }
  // [#TASK-ES-681] relay:`window.OurgoalAppScope.expose('index.html', { get N(){ return N; } … })` 이고 속성이 전부 relay 이름의 그 꼴 getter 일 때 그 이름들, 아니면 null(예전처럼 전제 밖의 문이다)
  const relayExpose = st => {
    const x = st.isExpressionStatement() ? st.node.expression : null;
    if (!x || x.type !== 'CallExpression' || calleeText(x) !== 'window.OurgoalAppScope.expose' || x.arguments.length !== 2) return null;
    const a0 = x.arguments[0], a1 = x.arguments[1];
    if (a0.type !== 'StringLiteral' || a0.value !== 'index.html' || a1.type !== 'ObjectExpression' || !a1.properties.length) return null;
    const names = [];
    for (const p of a1.properties) {
      if (p.type !== 'ObjectMethod' || p.kind !== 'get' || p.computed || p.key.type !== 'Identifier' || !RELAY.has(p.key.name) || p.params.length) return null;
      const b = p.body.body;
      if ((p.body.directives || []).length || b.length !== 1 || b[0].type !== 'ReturnStatement' || !b[0].argument || b[0].argument.type !== 'Identifier' || b[0].argument.name !== p.key.name) return null;
      names.push({ name: p.key.name, line: p.loc.start.line + s });
    }
    return names;
  };
  const kindOfOther = st => {
    const n = st.node, d = oneVar(st);
    if (n.type === 'FunctionDeclaration') return '함수 선언';
    if (n.type === 'VariableDeclaration') {
      if (d && d.init && d.init.type === 'MemberExpression' && rootWin(d.init)) return '손잡이 꼴이 아닌 window 읽기 var';
      if (d && plainMember(d.init) && handles.has(d.init.object.name)) return '이름이 다른 가져오기';
      return '그 밖의 var';
    }
    if (n.type === 'ExpressionStatement' && n.expression.type === 'CallExpression') {
      const t = calleeText(n.expression);
      if (/^window\.OurgoalAppScope\.expose$/.test(t)) return 'expose 문';
      if (/^window\.OurgoalAppState\.(define|defineVar)$/.test(t)) return '상태 선언(define)';
      return '구역 함수가 아닌 호출문';
    }
    if (n.type === 'ExpressionStatement' && n.expression.type === 'AssignmentExpression' && n.expression.left.type === 'MemberExpression' && rootWin(n.expression.left)) return 'window 대입';
    if (n.type === 'IfStatement') return 'if 문';
    if (n.type === 'TryStatement') return 'try 문';
    return n.type;
  };
  for (let ti = 0; ti < top.length; ti++) {
    const st = top[ti];
    const d = oneVar(st), x = st.isExpressionStatement() ? st.node.expression : null;
    if (keptIdx.has(ti)) { // [#TASK-ES-681] keepInline 으로 남길 문 — var 선언(손잡이·가져오기 꼴 제외)과 상태 선언뿐
      const isDef = !!x && x.type === 'CallExpression' && /^window\.OurgoalAppState\.(define|defineVar)$/.test(calleeText(x));
      const isVar = !!d && !winChain(d.init) && !(plainMember(d.init) && handles.has(d.init.object.name));
      if (!isDef && !isVar) fail('keepInline 으로 남길 수 있는 문은 var 선언(손잡이·가져오기 꼴 제외)과 상태 선언(define·defineVar)뿐이다: 「' + keptIdx.get(ti) + '」 (줄 ' + H(st.node) + ')');
      kept.push({ i: ti, kind: isDef ? 'define' : 'var', name: isVar ? d.id.name : null });
      continue;
    }
    if (gIdx.has(ti)) { // [#TASK-ES-687] keepGlobalConst 로 남길 문 — 문자열 리터럴로 초기화하는 한 줄 var 선언뿐(부수효과 · 다른 이름 읽기 0 이라 차례에 무관하다)
      if (!d || !d.init || d.init.type !== 'StringLiteral') fail('keepGlobalConst 로 남길 수 있는 문은 문자열 리터럴로 초기화하는 var 선언(이름 하나)뿐이다: 「' + gIdx.get(ti) + '」 (줄 ' + H(st.node) + ')');
      if (!/^[A-Z][A-Z0-9_]{5,}$/.test(d.id.name)) fail('keepGlobalConst 로 남길 이름은 대문자 상수 꼴(6자 이상)이어야 한다 — 전역 이름이 된다: ' + d.id.name + ' (줄 ' + H(st.node) + ')');
      if (H(st.node) !== HE(st.node) || lines[H(st.node) - 1].trim() !== text(st)) fail('keepGlobalConst 로 남길 선언은 한 줄을 혼자 써야 한다(여러 줄 · 뒤따르는 주석 · 다른 문과 한 줄이면 줄 그대로 남길 수 없다): 「' + gIdx.get(ti) + '」 (줄 ' + H(st.node) + ')');
      gkept.push({ i: ti, name: d.id.name });
      continue;
    }
    if (grIdx.has(ti)) { // [#TASK-ES-687] 남긴 전역 이름을 읽는 문 — 상태 선언(define·defineVar)뿐. 부팅 파일로 간다
      if (!x || x.type !== 'CallExpression' || !/^window\.OurgoalAppState\.(define|defineVar)$/.test(calleeText(x))) fail('keepGlobalConst.readers 로 적을 수 있는 문은 상태 선언(define·defineVar)뿐이다: 「' + grIdx.get(ti) + '」 (줄 ' + H(st.node) + ')');
      greaders.push({ i: ti });
      continue;
    }
    if (d && winChain(d.init)) {
      if (handles.has(d.id.name) || imports.has(d.id.name)) fail('같은 이름의 손잡이·가져오기가 둘이다: ' + d.id.name + ' (줄 ' + H(st.node) + ')');
      handles.set(d.id.name, { kit: doc.code.slice(d.init.start, d.init.end).slice('window.'.length), line: H(st.node), used: 0 });
    } else if (d && plainMember(d.init) && handles.has(d.init.object.name) && d.init.property.name === d.id.name) {
      if (handles.has(d.id.name) || imports.has(d.id.name)) fail('같은 이름의 손잡이·가져오기가 둘이다: ' + d.id.name + ' (줄 ' + H(st.node) + ')');
      imports.set(d.id.name, { handle: d.init.object.name, line: H(st.node), called: 0, st });
      handles.get(d.init.object.name).used++;
    } else if (x && x.type === 'CallExpression' && !x.optional && x.callee.type === 'Identifier' && imports.has(x.callee.name) && x.arguments.length === 0) {
      imports.get(x.callee.name).called++;
      calls.push({ name: x.callee.name, line: H(st.node), i: ti });
    } else {
      const rx = RELAY.size ? relayExpose(st) : null;
      if (rx) relayExposes.push({ i: ti, names: rx });
      else bad.push({ kind: kindOfOther(st), line: H(st.node), text: doc.code.slice(st.node.start, st.node.end).split('\n')[0].slice(0, 60) });
    }
  }
  for (const [n, im] of imports) if (!im.called && !RELAY.has(n)) bad.push({ kind: '호출되지 않는 가져오기', line: im.line, text: 'var ' + n + ' = ' + im.handle + '.' + n + ';' });
  for (const [n, h] of handles) if (!h.used) bad.push({ kind: '쓰이지 않는 손잡이', line: h.line, text: 'var ' + n + ' = window.' + h.kit + ';' });
  if (bad.length) {
    bad.sort((a, b) => a.line - b.line);
    const by = {}; for (const b of bad) by[b.kind] = (by[b.kind] || 0) + 1;
    fail('finalize 전제 미충족 — IIFE 최상위에 키트 손잡이·구역 함수 가져오기·구역 함수 호출문 밖의 문이 ' + bad.length + '개 있다(' + Object.keys(by).sort().map(k => k + ' ' + by[k]).join(' · ') + '). 첫 문: 줄 ' + bad[0].line + ' 「' + bad[0].text + '」');
  }
  if (!calls.length) fail('finalize 전제 미충족 — 구역 함수 호출문이 없다(부를 것이 없는 부팅 파일은 만들지 않는다)');
  // ── [#TASK-ES-681] relay 확인: 이름마다 「가져오기 1 + getter 1」이고 그 getter 말고는 아무도 읽지 않는다
  for (const [n, r] of RELAY) {
    const im = imports.get(n);
    if (!im) fail('relay 이름의 가져오기 줄(`var ' + n + ' = _키트.' + n + ';`)이 IIFE 최상위에 없다: ' + n + ' — 쓰이지 않는 허용은 적지 않는다');
    if (im.called) fail('relay 이름이 최상위에서 불린다 — 구역 함수다(relay 대상이 아니다): ' + n);
    const gs = []; for (const ex of relayExposes) for (const g of ex.names) if (g.name === n) gs.push({ line: g.line, i: ex.i });
    if (gs.length !== 1) fail('relay 이름의 줄 꼴이 「가져오기 1 + getter 1」이 아니다: ' + n + ' — getter ' + gs.length + '개');
    const bnd = iScope.getBinding(n);
    if (!bnd || bnd.referencePaths.length !== 1 || bnd.constantViolations.length) fail('relay 이름을 그 getter 말고 다른 곳이 읽거나 쓴다: ' + n);
    r.importLine = im.line; r.getterLine = gs[0].line; r.exposeLines = [H(top[gs[0].i].node), HE(top[gs[0].i].node)]; r.exposeIdx = gs[0].i;
  }
  // ── [#TASK-ES-681] keepInline 갈림: 인라인에 남는 문 번호(inl) · 부팅 파일로 가는 문 번호(bootIdx — 양쪽이 함께 쓰는 손잡이는 여기에도 든다)
  const isHandleAt = i => { const d = oneVar(top[i]); return !!d && handles.has(d.id.name) && handles.get(d.id.name).line === H(top[i].node); };
  const isImportAt = i => { const d = oneVar(top[i]); return !!d && imports.has(d.id.name) && imports.get(d.id.name).line === H(top[i].node); };
  const callIdx = new Set(calls.map(c => c.i));
  let PART = null;
  if (KEEP) {
    const ks = kept.map(k => k.i).sort((a, b) => a - b);
    for (let i = 1; i < ks.length; i++) if (ks[i] !== ks[i - 1] + 1) fail('keepInline 으로 남길 문이 연달아 있지 않다 — 줄 ' + H(top[ks[i - 1]].node) + ' 과 줄 ' + H(top[ks[i]].node) + ' 사이에 다른 최상위 문이 있다');
    const P = ks[ks.length - 1];
    const inl = new Set(ks), prefix = [];
    for (let i = 0; i < P; i++) if (!inl.has(i) && !isHandleAt(i) && !isImportAt(i)) { inl.add(i); prefix.push(i); } // 남길 문보다 앞에서 도는 문(호출문 · relay expose 문) — 실행 순서를 지키려고 인라인에 둔다
    const topIdxOf = p => { let q = p; while (q && q.parent !== body) q = q.parentPath; return q ? top.findIndex(t => t.node === q.node) : -1; };
    const decl = new Map(); top.forEach((st, i) => { const d = oneVar(st); if (d) decl.set(i, d.id.name); });
    const readers = new Map(); // 선언 문 번호 → 그 이름을 읽거나 쓰는 다른 최상위 문 번호
    for (const [di, n] of decl) { const b = iScope.getBinding(n), set = new Set(); if (b) for (const p of b.referencePaths.concat(b.constantViolations)) { const r = topIdxOf(p); if (r >= 0 && r !== di) set.add(r); } readers.set(di, set); }
    const pulled = [];
    for (let changed = true; changed;) { // 닫기: 인라인에 남는 문이 읽는 가져오기 · 손잡이 줄도 인라인에 남긴다
      changed = false;
      for (const [di, set] of readers) if (!inl.has(di) && [...set].some(r => inl.has(r))) {
        if (di > P) fail('인라인에 남는 문이 그 뒤에서 선언되는 이름을 읽는다: ' + decl.get(di) + ' (줄 ' + H(top[di].node) + ')');
        inl.add(di); pulled.push(di); changed = true;
      }
    }
    const dup = new Set();
    for (const [di, set] of readers) {
      if (!inl.has(di)) continue;
      const outside = [...set].filter(r => !inl.has(r)).sort((a, b) => a - b);
      if (!outside.length) continue;
      if (isHandleAt(di)) { dup.add(di); continue; }
      if (keptIdx.has(di)) fail('keepInline 으로 남긴 var 를 부팅 파일로 가는 문이 읽는다: ' + decl.get(di) + ' (선언 줄 ' + H(top[di].node) + ' · 읽는 줄 ' + H(top[outside[0]].node) + ')');
      fail('가져오기 ' + decl.get(di) + ' 를 인라인에 남는 문과 부팅 파일로 가는 문이 함께 쓴다 — 가져오기 줄은 한 곳에만 둘 수 있다(줄 ' + H(top[di].node) + ' · 줄 ' + H(top[outside[0]].node) + ')');
    }
    const bootIdx = top.map((_, i) => i).filter(i => !inl.has(i) || dup.has(i));
    if (!bootIdx.some(i => callIdx.has(i))) fail('keepInline 을 적용하면 부팅 파일에 구역 함수 호출문이 하나도 남지 않는다 — 부를 것이 없는 부팅 파일은 만들지 않는다');
    const inlLines = new Set();
    for (const i of inl) for (let l = H(top[i].node); l <= HE(top[i].node); l++) inlLines.add(l);
    for (let i = 0; i < top.length; i++) if (!inl.has(i)) for (let l = H(top[i].node); l <= HE(top[i].node); l++) if (inlLines.has(l)) fail('인라인에 남길 문이 부팅 파일로 가는 문과 한 줄을 나눠 쓴다(줄 ' + l + ') — 줄 그대로 남길 수 없다');
    PART = { ks, P, inl, prefix, pulled: pulled.sort((a, b) => a - b), dup, bootIdx, inlLines };
  }
  // ── [#TASK-ES-687] keepGlobalConst 갈림: 남길 선언(ks) · 부팅 파일로 가는 문(그 밖의 전부) · 이름별 읽는 문 · 전역 이름 충돌 검사
  let GPART = null;
  if (GKC) {
    const ks = gkept.map(k => k.i).sort((a, b) => a - b);
    for (let i = 1; i < ks.length; i++) if (ks[i] !== ks[i - 1] + 1) fail('keepGlobalConst 로 남길 선언이 연달아 있지 않다 — 줄 ' + H(top[ks[i - 1]].node) + ' 과 줄 ' + H(top[ks[i]].node) + ' 사이에 다른 최상위 문이 있다');
    const names = gkept.slice().sort((a, b) => a.i - b.i).map(k => k.name);
    if (new Set(names).size !== names.length) fail('keepGlobalConst 로 남길 선언 둘이 같은 이름이다: ' + names.join(' · '));
    const gTopIdxOf = p => { let q = p; while (q && q.parent !== body) q = q.parentPath; return q ? top.findIndex(t => t.node === q.node) : -1; };
    const readBy = {};
    for (const k of gkept) {
      const b = iScope.getBinding(k.name);
      if (!b) fail('keepGlobalConst 로 남길 이름의 선언을 IIFE 범위에서 찾지 못했다: ' + k.name);
      if (b.constantViolations.length) fail('keepGlobalConst 로 남길 이름에 IIFE 안에서 다시 대입하거나 다시 선언한다 — 상수가 아니다: ' + k.name + ' (줄 ' + (b.constantViolations[0].node.loc.start.line + s) + ')');
      const set = new Set();
      for (const p of b.referencePaths) { const r = gTopIdxOf(p); if (r < 0) fail('keepGlobalConst 로 남길 이름을 읽는 자리의 최상위 문을 찾지 못했다: ' + k.name); set.add(r); }
      for (const r of [...set].sort((a, c) => a - c)) {
        if (r < k.i) fail('남길 선언보다 앞의 문이 그 이름을 읽는다 — 선언을 앞당기면 읽는 값이 달라진다: ' + k.name + ' (읽는 줄 ' + H(top[r].node) + ' · 선언 줄 ' + H(top[k.i].node) + ')');
        if (!grIdx.has(r)) fail('keepGlobalConst 로 남긴 이름을 readers 에 적지 않은 문이 읽는다: ' + k.name + ' (읽는 줄 ' + H(top[r].node) + ') — 그 문을 readers 에 근거와 함께 적어야 부팅 파일로 간다');
      }
      readBy[k.name] = [...set].sort((a, c) => a - c);
    }
    for (const g of greaders) if (!names.some(n => readBy[n].includes(g.i))) fail('keepGlobalConst.readers 의 문이 남긴 이름을 하나도 읽지 않는다 — 쓰이지 않는 허용은 적지 않는다: 「' + grIdx.get(g.i) + '」 (줄 ' + H(top[g.i].node) + ')');
    // 전역 이름 충돌: 같은 전역 범위를 쓰는 글자 = index.html 의 이 블록 밖 + index.html 이 부르는 로컬 스크립트 파일. 그 이름이 하나라도 있으면 멈춘다(주석 속 글자는 세지 않는다).
    const word = n => new RegExp('(^|[^A-Za-z0-9_$])' + n + '([^A-Za-z0-9_$]|$)');
    const outside = lines.slice(0, s - 1).concat(lines.slice(e + 1)).join('\n');
    const srcs = []; { const re = /<script\b[^>]*\bsrc="([^"]+)"/g; let m; while ((m = re.exec(outside))) { if (/^([a-z]+:)?\/\//i.test(m[1])) continue; const rel = m[1].replace(/[?#].*$/, '').replace(/^\//, ''); if (!srcs.includes(rel)) srcs.push(rel); } }
    const hits = []; let scanned = 0, missing = 0;
    for (const rel of srcs) {
      const f = path.join(APP, rel);
      if (!fs.existsSync(f)) { missing++; continue; }
      scanned++;
      const src = fs.readFileSync(f, 'utf8');
      const cand = names.filter(n => word(n).test(src));
      if (!cand.length) continue;
      let toks; try { toks = parser.parse(src, { sourceType: 'script', tokens: true, errorRecovery: true }).tokens; } catch (err) { for (const n of cand) hits.push(n + ' @ ' + rel + '(파싱하지 못했다 — 글자가 있어 멈춘다)'); continue; }
      for (const n of cand) if (toks.some(t => typeof t.type !== 'string' && ((t.type.label === 'name' && t.value === n) || (t.type.label === 'string' && typeof t.value === 'string' && word(n).test(t.value))))) hits.push(n + ' @ ' + rel);
    }
    for (const n of names) if (word(n).test(outside)) hits.push(n + ' @ index.html(인라인 IIFE 블록 밖)');
    if (hits.length) fail('keepGlobalConst 로 남길 이름이 같은 전역 범위의 다른 글자에 이미 있다 — 전역 이름으로 만들 수 없다: ' + hits.join(' · '));
    GPART = { ks, names, readBy, bootIdx: top.map((_, i) => i).filter(i => !gIdx.has(i)), scan: { scripts: srcs.length, scanned, missing } };
  }
  // ── F1: 부팅 파일(문을 글자 그대로, 같은 순서로)
  const LABEL = CFG.label || '인라인 IIFE 마지막 정리';
  const bootTop = PART ? PART.bootIdx.map(i => top[i]) : GPART ? GPART.bootIdx.map(i => top[i]) : top;
  const nBootHandles = PART ? PART.bootIdx.filter(isHandleAt).length : handles.size;
  const nBootImports = (PART ? PART.bootIdx.filter(isImportAt).length : imports.size) - (PART ? [...RELAY.keys()].filter(n => PART.bootIdx.some(i => isImportAt(i) && oneVar(top[i]).id.name === n)).length : RELAY.size);
  const nBootCalls = PART ? PART.bootIdx.filter(i => callIdx.has(i)).length : calls.length;
  const relayInBoot = [...RELAY.keys()].filter(n => !PART || PART.bootIdx.includes(RELAY.get(n).exposeIdx));
  const headExtra = []; // [#TASK-ES-681] 옵션을 썼을 때만 생기는 머리 주석 줄(옵션이 없으면 예전과 글자가 같다)
  if (relayInBoot.length) {
    headExtra.push(' * 통로 중계 ' + relayInBoot.length + '개(' + relayInBoot.join(' · ') + ')도 함께 옮겼다 — 등록 기관에 등록할 수 없는 이름의 가져오기 줄과 그 getter 를 담은 expose 문이다(생성기 설정 relay).');
    for (const n of relayInBoot) headExtra.push(' *   - ' + n + ': ' + RELAY.get(n).reason);
  }
  if (PART && PART.dup.size) headExtra.push(' * 인라인에 남은 문과 이 파일이 함께 쓰는 키트 손잡이 ' + PART.dup.size + '개(' + [...PART.dup].sort((a, b) => a - b).map(i => oneVar(top[i]).id.name).join(' · ') + ')는 같은 글자로 한 번 더 적었다.');
  if (GPART && greaders.length) headExtra.push(' * 상태 선언 ' + greaders.length + '개도 함께 옮겼다 — index.html 에 남긴 전역 상수(' + GPART.names.join(' · ') + ')를 읽는 문이다(생성기 설정 keepGlobalConst.readers).');
  const boot = ['/**', ' * ' + C.title, ' *'].concat(C.desc.map(d => ' * ' + d), [
    ' * #' + TAG + '(' + LABEL + '): index.html 인라인 IIFE 에 마지막까지 남아 있던 문(키트 손잡이 ' + nBootHandles + '개 · 구역 함수 가져오기 ' + nBootImports + '개 · 구역 함수 호출 ' + nBootCalls + '개)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로, 같은 순서로 옮겼다.'],
    headExtra, [
    PART
      ? ' * 주석·빈 줄은 옮기지 않았다. index.html 의 인라인 IIFE 에는 문 ' + PART.inl.size + '개가 줄 그대로 남아 있고(생성기 설정 keepInline — ' + KEEP.reason + '), 그 `</script>` 뒤의 동기 script 태그가 이 파일을 부른다 — 인라인이 먼저 돌고 이 파일이 이어서 돈다. defer·async 를 붙이지 않는다(로드 순서가 곧 실행 순서다).'
      : GPART
      ? ' * 주석·빈 줄은 옮기지 않았다. index.html 에는 큰 인라인 IIFE 가 더 없고, 문자열 상수 선언 ' + GPART.ks.length + '줄(' + GPART.names.join(' · ') + ')만 껍데기 없는 최상위 스크립트에 줄 그대로 남아 있다(생성기 설정 keepGlobalConst — ' + GKC.reason + '). 그 `</script>` 뒤의 동기 script 태그가 이 파일을 부르고 이 파일의 문이 그 전역 이름을 읽는다 — 나머지 문은 전부 이 파일 한 스크립트 안에서 이어서 돈다. defer·async 를 붙이지 않는다(로드 순서가 곧 실행 순서다).'
      : ' * 주석·빈 줄은 옮기지 않았다. index.html 에는 큰 인라인 IIFE 가 더 없고, 그 자리(앞 태그 줄 끝)의 동기 script 태그가 이 파일을 부른다 — defer·async 를 붙이지 않는다(로드 순서가 곧 실행 순서다).',
    ' * 설계: docs/architecture/CELL-REGISTRY-DESIGN.md 3.4절 · 5절 X9' + (RELAY.size || PART || GPART ? ' · 5.9절' : ''),
    ' */',
    '(function(){', '  "use strict";'], bootTop.map(st => '  ' + text(st)), ['})();', '']);
  // ── F2 · F3: IIFE 블록을 지우고 앞 줄 끝에 부팅 태그를 붙인다. [#TASK-ES-681] keepInline 이면 블록을 남기고(껍데기 5줄 + 남길 문의 줄) 그 `</script>` 줄 끝에 태그를 붙인다
  const keptBody = []; if (PART) for (let l = s + 3; l <= e - 1; l++) if (PART.inlLines.has(l)) keptBody.push(lines[l - 1]);
  // [#TASK-ES-687] keepGlobalConst 이면 `<script>` 줄 + 남길 선언 줄(줄 그대로, 원래 차례) + `</script>` 줄만 남기고(IIFE 껍데기 3줄은 지운다) 그 `</script>` 줄 끝에 태그를 붙인다
  const gLines = GPART ? GPART.ks.map(i => lines[H(top[i].node) - 1]) : [];
  const nh = PART
    ? lines.slice(0, s + 2).concat(keptBody, [lines[e - 1], lines[e] + BOOT_TAG], lines.slice(e + 1))
    : GPART
    ? lines.slice(0, s).concat(gLines, [lines[e] + BOOT_TAG], lines.slice(e + 1))
    : lines.slice(0, s - 2).concat([lines[s - 2] + BOOT_TAG], lines.slice(e + 1));
  const removed = PART ? (e - s - 3) - keptBody.length : GPART ? (e - s) - gLines.length : e - s + 2;
  // ── 사후 대조
  if (GPART) {
    // [#TASK-ES-687] ① 부팅 파일의 문 토큰열 = 옮기기로 한 문의 토큰열(같은 순서) ② 남긴 최상위 스크립트에는 문자열 상수 선언만 있다 — 호출 · 대입 · 약속 · 수신기 등록 같은 순서 민감한 문이 인라인에 남지 않는다
    // ③ 두 쪽이 원래 문 전부를 겹침 없이 가른다 ④ 남긴 줄은 원래 줄과 바이트가 같고 순서가 같다 ⑤ 블록 밖의 줄은 그대로다 ⑥ 큰 인라인 IIFE 가 남지 않고 부팅 태그는 꼭 한 번, 남긴 `</script>` 줄 끝이다
    const sigOfG = (ast, nodes) => nodes.map(n => JSON.stringify(ast.tokens.filter(t => !isComment(t) && t.type.label !== 'eof' && t.start >= n.start && t.end <= n.end).map(sig)));
    const origSig = sigOfG(doc.ast, top.map(t => t.node));
    let bootAst; try { bootAst = parser.parse(boot.join('\n'), { sourceType: 'script', tokens: true }); } catch (err) { fail('만든 부팅 파일이 파싱되지 않는다 — 쓰지 않는다: ' + err.message); }
    const bx = bootAst.program.body.length === 1 && bootAst.program.body[0].type === 'ExpressionStatement' ? bootAst.program.body[0].expression : null;
    if (!bx || bx.type !== 'CallExpression' || bx.callee.type !== 'FunctionExpression') fail('만든 부팅 파일의 껍데기 꼴이 다르다 — 쓰지 않는다');
    if (JSON.stringify(sigOfG(bootAst, bx.callee.body.body)) !== JSON.stringify(GPART.bootIdx.map(i => origSig[i]))) fail('부팅 파일의 문 토큰열이 옮기기로 한 문과 다르다(실행 글자 변화) — 쓰지 않는다');
    let ia; try { ia = parser.parse(nh.slice(s, s + gLines.length).join('\n'), { sourceType: 'script', tokens: true }); } catch (err) { fail('남긴 최상위 스크립트가 파싱되지 않는다 — 쓰지 않는다: ' + err.message); }
    const ib = ia.program.body;
    if ((ia.program.directives || []).length || ib.length !== gLines.length || !ib.every(n => n.type === 'VariableDeclaration' && n.kind === 'var' && n.declarations.length === 1 && n.declarations[0].id.type === 'Identifier' && !!n.declarations[0].init && n.declarations[0].init.type === 'StringLiteral'))
      fail('남긴 최상위 스크립트에 문자열 상수 선언 말고 다른 문이 있다(호출 · 대입 · 약속 · 수신기 등록 같은 순서 민감한 문이 인라인에 남으면 안 된다) — 쓰지 않는다');
    const okTok = new Set(['var', 'name', '=', 'string', ';']);
    if (ia.tokens.some(t => !isComment(t) && t.type.label !== 'eof' && !okTok.has(t.type.label))) fail('남긴 최상위 스크립트에 선언 말고 다른 실행 글자가 있다 — 쓰지 않는다');
    if (JSON.stringify(sigOfG(ia, ib)) !== JSON.stringify(GPART.ks.map(i => origSig[i]))) fail('남긴 선언의 토큰열이 원래 선언과 다르다 — 쓰지 않는다');
    if (new Set(GPART.ks.concat(GPART.bootIdx)).size !== top.length || GPART.ks.length + GPART.bootIdx.length !== top.length) fail('남긴 선언과 옮긴 문이 원래 문 전부를 겹침 없이 가르지 않는다 — 쓰지 않는다');
    for (const n of GPART.names) for (const r of GPART.readBy[n]) if (!GPART.bootIdx.includes(r)) fail('남긴 이름을 읽는 문이 부팅 파일에 없다 — 쓰지 않는다: ' + n);
    if (nh[s - 1] !== '<script>' || gLines.some((l, j) => nh[s + j] !== l) || nh[s + gLines.length] !== lines[e] + BOOT_TAG) fail('남긴 최상위 스크립트 블록의 줄이 예상과 다르다 — 쓰지 않는다');
    if (nh.some((l, i) => l.trim() === '<script>' && (nh[i + 1] || '').trim() === '(function(){' && (nh[i + 2] || '').includes('"use strict"'))) fail('지운 뒤에도 큰 인라인 IIFE 가 남아 있다 — 쓰지 않는다');
    if (nh.join('\n').split(BOOT).length !== 2) fail('부팅 태그가 꼭 한 번이 아니다 — 쓰지 않는다');
    if (nh.length !== lines.length - removed) fail('지운 뒤 줄 수가 예상과 다르다 — 쓰지 않는다');
    if (nh.slice(0, s - 1).join('\n') !== lines.slice(0, s - 1).join('\n') || nh.slice(s + gLines.length + 1).join('\n') !== lines.slice(e + 1).join('\n')) fail('남긴 블록 밖의 글자가 달라졌다 — 쓰지 않는다');
  } else if (PART) {
    // [#TASK-ES-681] ① 부팅 파일의 문 토큰열 = 옮기기로 한 문의 토큰열(같은 순서) ② 새 인라인 IIFE 의 문 토큰열 = 남기기로 한 문의 토큰열(같은 순서) ③ 두 쪽이 원래 문 전부를 빠짐없이 가른다(겹치는 것은 함께 쓰는 손잡이뿐)
    // ④ 남은 인라인 줄은 전부 원래 줄과 바이트가 같고 순서가 같다 ⑤ 블록 밖의 줄은 그대로다 ⑥ 부팅 태그는 꼭 한 번, 남긴 `</script>` 줄 끝이다
    const sigOf = (ast, nodes) => nodes.map(n => JSON.stringify(ast.tokens.filter(t => !isComment(t) && t.type.label !== 'eof' && t.start >= n.start && t.end <= n.end).map(sig)));
    const origSig = sigOf(doc.ast, top.map(t => t.node));
    let bootAst; try { bootAst = parser.parse(boot.join('\n'), { sourceType: 'script', tokens: true }); } catch (err) { fail('만든 부팅 파일이 파싱되지 않는다 — 쓰지 않는다: ' + err.message); }
    const bx = bootAst.program.body.length === 1 && bootAst.program.body[0].type === 'ExpressionStatement' ? bootAst.program.body[0].expression : null;
    if (!bx || bx.type !== 'CallExpression' || bx.callee.type !== 'FunctionExpression') fail('만든 부팅 파일의 껍데기 꼴이 다르다 — 쓰지 않는다');
    const bootSig = sigOf(bootAst, bx.callee.body.body);
    if (JSON.stringify(bootSig) !== JSON.stringify(PART.bootIdx.map(i => origSig[i]))) fail('부팅 파일의 문 토큰열이 옮기기로 한 문과 다르다(실행 글자 변화) — 쓰지 않는다');
    let nd; try { nd = parseUnwireDoc(nh); } catch (err) { fail('남긴 인라인 IIFE 가 파싱되지 않는다 — 쓰지 않는다: ' + err.message); }
    const inlSorted = [...PART.inl].sort((a, b) => a - b);
    if (nd.off !== s || JSON.stringify(sigOf(nd.ast, nd.top.map(t => t.node))) !== JSON.stringify(inlSorted.map(i => origSig[i]))) fail('남긴 인라인 IIFE 의 문 토큰열이 남기기로 한 문과 다르다 — 쓰지 않는다');
    const all = new Set(inlSorted.concat(PART.bootIdx));
    if (all.size !== top.length || inlSorted.some(i => PART.bootIdx.includes(i) && !PART.dup.has(i))) fail('남긴 문과 옮긴 문이 원래 문 전부를 가르지 않는다 — 쓰지 않는다');
    const blockNew = nh.slice(s - 1, s + 2 + keptBody.length + 2), blockOld = lines.slice(s - 1, e + 1);
    let at = 0; for (let i = 0; i < blockNew.length - 1; i++) { while (at < blockOld.length && blockOld[at] !== blockNew[i]) at++; if (at >= blockOld.length) fail('남은 인라인 줄이 원래 줄과 다르거나 순서가 다르다 — 쓰지 않는다(새 블록 ' + (i + 1) + '번째 줄)'); at++; }
    if (blockNew[blockNew.length - 1] !== lines[e] + BOOT_TAG || nh[s - 1] !== '<script>' || nh[s] !== '(function(){') fail('남긴 인라인 블록의 껍데기·부팅 태그 줄이 예상과 다르다 — 쓰지 않는다');
    if (nh.join('\n').split(BOOT).length !== 2) fail('부팅 태그가 꼭 한 번이 아니다 — 쓰지 않는다');
    if (nh.length !== lines.length - removed) fail('지운 뒤 줄 수가 예상과 다르다 — 쓰지 않는다');
    if (nh.slice(0, s - 1).join('\n') !== lines.slice(0, s - 1).join('\n') || nh.slice(s + 2 + keptBody.length + 2).join('\n') !== lines.slice(e + 1).join('\n')) fail('인라인 블록 밖의 글자가 달라졌다 — 쓰지 않는다');
  } else {
    let bootAst; try { bootAst = parser.parse(boot.join('\n'), { sourceType: 'script', tokens: true }); } catch (err) { fail('만든 부팅 파일이 파싱되지 않는다 — 쓰지 않는다: ' + err.message); }
    const want = codeToks(doc.ast), got = codeToks(bootAst);
    let diffAt = want.length === got.length ? -1 : Math.min(want.length, got.length);
    for (let i = 0; i < Math.min(want.length, got.length); i++) if (want[i] !== got[i]) { diffAt = i; break; }
    if (diffAt >= 0) fail('부팅 파일의 토큰열이 이전 IIFE 와 다르다(실행 글자 변화) — 쓰지 않는다: 토큰 ' + diffAt);
    if (nh.some((l, i) => l.trim() === '<script>' && (nh[i + 1] || '').trim() === '(function(){' && (nh[i + 2] || '').includes('"use strict"'))) fail('지운 뒤에도 큰 인라인 IIFE 가 남아 있다 — 쓰지 않는다');
    if (nh.join('\n').split(BOOT).length !== 2) fail('부팅 태그가 꼭 한 번이 아니다 — 쓰지 않는다');
    if (nh.length !== lines.length - removed) fail('지운 뒤 줄 수가 예상과 다르다 — 쓰지 않는다');
    if (nh.slice(0, s - 2).join('\n') !== lines.slice(0, s - 2).join('\n') || nh.slice(s - 1).join('\n') !== lines.slice(e + 1).join('\n') || nh[s - 2].slice(0, lines[s - 2].length) !== lines[s - 2]) fail('지운 구간 밖의 글자가 달라졌다 — 쓰지 않는다');
  }
  const stmtLine = new Set(); for (const st of top) for (let l = H(st.node); l <= HE(st.node); l++) stmtLine.add(l);
  let blank = 0, comment = 0; for (let l = s + 3; l <= e - 1; l++) if (!stmtLine.has(l)) { if (lines[l - 1].trim() === '') blank++; else comment++; }
  fs.mkdirSync(path.dirname(path.join(APP, BOOT)), { recursive: true });
  fs.writeFileSync(path.join(APP, BOOT), boot.join('\n'), { encoding: 'utf8' });
  fs.writeFileSync(path.join(APP, 'index.html'), nh.join(EOL), { encoding: 'utf8' });
  const meta = {
    task: TAG, mode: 'finalize', scriptHtmlLines: [s, e + 1],
    statements: { total: top.length, handles: handles.size, imports: imports.size, calls: calls.length },
    handles: [...handles].map(([n, h]) => ({ name: n, kit: h.kit, imports: h.used })), callOrder: calls.map(c => c.name),
    removed: { lines: removed, shell: PART ? 0 : GPART ? 3 : 5, statementLines: PART ? stmtLine.size - PART.inlLines.size : GPART ? stmtLine.size - gLines.length : stmtLine.size, commentLines: comment, blankLines: blank },
    tag: { line: PART ? s + 2 + keptBody.length + 2 : GPART ? s + gLines.length + 1 : s - 1, text: BOOT_TAG, sync: true },
    htmlLinesBefore: lines.length, htmlLinesAfter: nh.length, files: { [BOOT]: boot.length - 1 },
  };
  // [#TASK-ES-681] 옵션을 썼을 때만 생기는 메타 칸과 표준 출력 줄(옵션이 없으면 메타·출력의 글자가 예전과 같다)
  const optLog = [];
  if (RELAY.size) {
    meta.relayed = [...RELAY].map(([n, r]) => ({ name: n, reason: r.reason, importLine: r.importLine, getterLine: r.getterLine, exposeLines: r.exposeLines, movedTo: !PART || PART.bootIdx.includes(r.exposeIdx) ? BOOT : 'index.html(인라인에 남음)' }));
    for (const x of meta.relayed) optLog.push('  relay ' + x.name + ' — 가져오기 줄 ' + x.importLine + ' · getter 줄 ' + x.getterLine + '(expose 문 줄 ' + x.exposeLines[0] + '~' + x.exposeLines[1] + ') → ' + x.movedTo + ' · 근거: ' + x.reason);
  }
  if (PART) {
    const row = (i, why) => ({ line: H(top[i].node), endLine: HE(top[i].node), why, text: text(top[i]).split('\n')[0].slice(0, 60) });
    meta.keptInline = {
      reason: KEEP.reason,
      statements: PART.ks.map(i => Object.assign({ match: keptIdx.get(i), kind: kept.find(k => k.i === i).kind }, row(i, '지정한 문'))),
      before: PART.prefix.map(i => row(i, callIdx.has(i) ? '지정한 문보다 앞에서 도는 호출문' : '지정한 문보다 앞에서 도는 relay expose 문')),
      pulled: PART.pulled.map(i => row(i, isHandleAt(i) ? '인라인에 남는 문이 읽는 손잡이' : '인라인에 남는 문이 읽는 가져오기')),
      duplicatedHandles: [...PART.dup].sort((a, b) => a - b).map(i => ({ name: oneVar(top[i]).id.name, line: H(top[i].node) })),
      inline: { statements: PART.inl.size, bodyLines: keptBody.length, shellLines: 5 }, boot: { statements: PART.bootIdx.length, handles: nBootHandles, imports: nBootImports, calls: nBootCalls },
      inlineCallOrder: calls.filter(c => PART.inl.has(c.i)).map(c => c.name), bootCallOrder: calls.filter(c => !PART.inl.has(c.i)).map(c => c.name),
    };
    for (const x of meta.keptInline.statements) optLog.push('  keepInline 「' + x.match + '」 — 줄 ' + x.line + (x.endLine !== x.line ? '~' + x.endLine : '') + '(' + (x.kind === 'var' ? 'var 선언' : '상태 선언') + ') 을 인라인 IIFE 에 줄 그대로 남긴다 · 근거: ' + KEEP.reason);
    for (const x of meta.keptInline.before.concat(meta.keptInline.pulled)) optLog.push('  keepInline(함께 남김) 줄 ' + x.line + ' 「' + x.text + '」 — ' + x.why);
    for (const x of meta.keptInline.duplicatedHandles) optLog.push('  keepInline(손잡이 한 번 더) ' + x.name + ' — 줄 ' + x.line + ' 은 인라인에 남고 부팅 파일에도 같은 글자로 적는다');
  }
  if (GPART) { // [#TASK-ES-687] 값 글자(문자열 리터럴의 내용)는 메타·표준 출력에 적지 않는다 — 이름과 줄 번호, 길이만
    const lit = i => oneVar(top[i]).init.value.length;
    const firstKept = GPART.ks[0];
    meta.keptGlobalConst = {
      reason: GKC.reason,
      statements: GPART.ks.map(i => ({ match: gIdx.get(i), name: oneVar(top[i]).id.name, line: H(top[i].node), valueLength: lit(i), readBy: GPART.readBy[oneVar(top[i]).id.name].map(r => H(top[r].node)) })),
      readers: greaders.map(g => ({ match: grIdx.get(g.i), line: H(top[g.i].node), endLine: HE(top[g.i].node), reads: GPART.names.filter(n => GPART.readBy[n].includes(g.i)), movedTo: BOOT })),
      globalNames: GPART.names, globalNameScan: Object.assign({ hits: 0 }, GPART.scan),
      movedEarlierOver: { statements: firstKept, calls: calls.filter(c => c.i < firstKept).map(c => c.name), note: '남긴 선언은 원래 이 문들 뒤에 있었다 — 이제 그 앞(인라인)에서 돈다. 문자열 상수 선언이라 차례에 무관하고, 앞의 문 가운데 그 이름을 읽는 것은 없다(있으면 멈춘다)' },
      inline: { statements: GPART.ks.length, bodyLines: gLines.length, shellLines: 2, iifeShell: false }, boot: { statements: GPART.bootIdx.length, handles: handles.size, imports: imports.size - RELAY.size, calls: calls.length, readers: greaders.length },
    };
    for (const x of meta.keptGlobalConst.statements) optLog.push('  keepGlobalConst 「' + x.match + '」 — 줄 ' + x.line + ' 의 문자열 상수 선언(' + x.name + ' · 값 ' + x.valueLength + '자)을 껍데기 없는 최상위 스크립트에 줄 그대로 남긴다(전역 이름이 된다) · 근거: ' + GKC.reason);
    for (const x of meta.keptGlobalConst.readers) optLog.push('  keepGlobalConst(읽는 문) 줄 ' + x.line + (x.endLine !== x.line ? '~' + x.endLine : '') + ' 「' + x.match + '」 — 남긴 전역 이름(' + x.reads.join(' · ') + ')을 읽는 상태 선언, 부팅 파일로 간다');
    optLog.push('  keepGlobalConst(전역 이름 검사) 같은 전역 범위의 스크립트 ' + GPART.scan.scripts + '개(읽은 것 ' + GPART.scan.scanned + ' · 없는 파일 ' + GPART.scan.missing + ')와 index.html 의 블록 밖 글자에 그 이름 0');
  }
  fs.writeFileSync(path.join(process.env.MODULE_SPLIT_OUT || require('os').tmpdir(), 'gen-inline-hard-meta.json'), JSON.stringify(meta, null, 1), { encoding: 'utf8' });
  console.log('finalize', '· handles', handles.size, '· imports', imports.size, '· calls', calls.length, '· removed lines', removed, '(껍데기 ' + (PART ? 0 : GPART ? 3 : 5) + ' · 문 ' + (PART ? stmtLine.size - PART.inlLines.size : GPART ? stmtLine.size - gLines.length : stmtLine.size) + ' · 주석 ' + comment + ' · 빈 줄 ' + blank + ')');
  for (const l of optLog) console.log(l);
  console.log('index.html lines', lines.length, '->', nh.length);
  console.log(BOOT, boot.length - 1);
}

// ── [B1 · docs/architecture/CELL-REGISTRY-DESIGN.md 5절] 배선 철거 모드(설정 "mode": "unwire") — 상민님 2026-10-10 「허용」(결심 ⑤), 범위는 그 문서 5절 그대로.
// 지우는 대상은 세 종류뿐이다:
//   ① 지정 키트(unwire.kitVar)의 가져오기 줄 `var X = _kit.X;`
//   ② OurgoalAppScope.expose('index.html', {…}) 객체의 X getter/setter 속성 줄(`get X(){ return X; }` · `, set X(v){ X = v; }`) — 객체가 비면 expose 문 전체
//   ③ X 의 window 대입 줄 `window.X = X;` · `if(typeof window !== 'undefined'){ window.X = X; }` · 여러 줄 if 블록 안의 그 줄 — 블록이 비면 if 문 전체
// unwire.names 에 없는 이름은 지우지 않는다. 함수 본문은 옮기거나 고치지 않는다. 그 밖의 글자는 바꾸지 않는다
// (지운 속성이 마지막이어서 새로 마지막이 된 속성 줄 끝의 쉼표를 떼는 것만 예외 — 문법 유지). 세포 파일은 쓰지 않는다(설정 cells 는 법정 재생성 대조의 파일 목록일 뿐).
// 안전 정지(fail): 지운 뒤에도 IIFE 안에 그 이름을 읽거나 쓰는 곳이 남으면(ReferenceError 가 될 자리) · 지울 문이 다른 글자와 한 줄을 나눠 쓰면 ·
//   window 대입의 오른쪽이 이름이 아니면(함수 정의문은 배선이 아니다) · names 의 이름 중 지울 줄이 하나도 없는 것이 있으면 멈춘다.
// 설정 예: { "task": "TASK-ES-6xx", "slot": "HO", "mode": "unwire", "cells": [{ "file": "js/core/cell-registry.js" }],
//           "unwire": { "kitVar": "_settingsKit", "imports": true, "exposeGetters": true, "windowAssign": true, "names": ["…"] } }
// ── [#TASK-ES-619 · 같은 문서 5절 닫힌 목록 X1·X2·X3 — 상민님 2026-10-11 「허용」, 효력 기록 지시함 DIR-004] unwire 확장. 아래는 전부 mode:"unwire" 경로 안에서만 돈다.
//   · 여러 실행: "unwire" 가 배열이면 실행을 차례로 적용한다(앞 실행이 지운 결과를 다시 파싱해 다음 실행이 돈다). 줄 종류는 그대로다 — 한 PR 에서 여러 키트·플래그를 돌릴 뿐이다.
//     하나라도 멈추면 index.html 을 쓰지 않는다. 단일 객체 꼴은 예전과 같은 글자를 낸다.
//   · X1 손잡이 이름꼴: kitVar 는 `_xxxKit` 꼴이 아니어도 된다(`_ui`·`_xp`). 대신 IIFE 최상위에서 `var <kitVar> = window.…;` 로 한 번 선언된 손잡이여야 한다(아니면 멈춘다).
//   · X3 "sharedLine": true — 다른 글자와 한 줄을 나눠 쓰는 window 대입(주석·다른 문과 같은 줄의 `window.X = X;`, 한 줄 if 블록 안 여러 대입 중 일부)을 그 줄 안에서 그 대입 글자만 지운다.
//     지운 대입 뒤의 빈칸을 함께 지우고, 줄 끝이었으면 앞 빈칸을 지운다. 줄이 비면 줄을 지운다. 쉼표 연쇄·여러 줄 if 블록 안의 나눠 쓴 줄·오른쪽이 이름이 아닌 대입은 여전히 멈춘다.
//   · X2 "dropKitVar": true — 그 실행의 삭제를 반영한 뒤 손잡이의 맨이름 참조가 0 이면 손잡이 줄 `var <kitVar> = window.…;` 을 지운다. 참조가 남으면 멈춘다. 이때만 names 가 비어도 된다.
//   · 사후 대조(모든 실행): 결과를 다시 파싱해 토큰열이 「이전 토큰열 − 지우기로 한 줄·글자의 토큰 − 뗀 쉼표」와 같고 남은 주석이 그대로인지 본다. 다르면 멈춘다(닫힌 목록 밖 글자 변화 0 의 기계 검사).
// 설정 예(여러 실행): "unwire": [ { "kitVar": "_uiKit", "names": ["…"] }, { "kitVar": "_uiKit", "imports": false, "sharedLine": true, "names": ["…"] }, { "kitVar": "_ui", "names": ["…"], "dropKitVar": true } ]
if (CFG.mode === 'unwire') { runUnwire(); return; }
function parseUnwireDoc(ls) {
  let s = -1, e = -1;
  for (let i = 0; i < ls.length; i++) if (ls[i].trim() === '<script>' && (ls[i + 1] || '').trim() === '(function(){' && (ls[i + 2] || '').includes('"use strict"')) { s = i + 1; break; }
  if (s >= 0) for (let i = s; i < ls.length; i++) if (ls[i].startsWith('</script>')) { e = i; break; }
  if (s < 0 || e < 0) fail('인라인 IIFE 를 찾지 못했다');
  const c = ls.slice(s, e).join('\n');
  const a = parser.parse(c, { sourceType: 'script', ranges: true, tokens: true });
  let f = null;
  traverse(a, { FunctionExpression(p) { if (!f) f = p; } });
  return { lines: ls, code: c, ast: a, top: f.get('body').get('body'), iScope: f.scope, off: s };
}
function runUnwire() {
  const isList = Array.isArray(CFG.unwire);
  const specs = isList ? CFG.unwire : [CFG.unwire || {}];
  if (isList && !specs.length) fail('unwire 배열이 비었다');
  let doc = parseUnwireDoc(lines);
  const metas = [], logs = [];
  for (let i = 0; i < specs.length; i++) {
    let r;
    try { r = unwireOnce(specs[i], doc); }
    catch (err) { if (isList) err.message = '[unwire 실행 ' + (i + 1) + '/' + specs.length + '] ' + err.message; throw err; }
    metas.push(r.meta); logs.push(r.log);
    doc = r.next;
  }
  fs.writeFileSync(path.join(APP, 'index.html'), doc.lines.join(EOL), 'utf8');
  const meta = isList
    ? { task: TAG, mode: 'unwire', runs: metas, htmlLinesBefore: lines.length, htmlLinesAfter: doc.lines.length, files: {} }
    : Object.assign({ task: TAG, mode: 'unwire' }, metas[0], { files: {} });
  fs.writeFileSync(path.join(process.env.MODULE_SPLIT_OUT || require('os').tmpdir(), 'gen-inline-hard-meta.json'), JSON.stringify(meta, null, 1), 'utf8');
  logs.forEach((l, i) => console.log(...(isList ? ['unwire', '[' + (i + 1) + '/' + specs.length + ']'] : ['unwire']), ...l));
  console.log('index.html lines', lines.length, '->', doc.lines.length);
}
function unwireOnce(U, doc) {
  const { lines, code, top, iScope } = doc; // 이 실행이 보는 문서(앞 실행의 결과). 파일 머리의 같은 이름을 가린다.
  const H = n => n.loc.start.line + doc.off, HE = n => n.loc.end.line + doc.off;
  if (!U || typeof U !== 'object' || Array.isArray(U)) fail('unwire 실행 설정은 객체여야 한다');
  for (const k of Object.keys(U)) if (!['kitVar', 'names', 'imports', 'exposeGetters', 'windowAssign', 'sharedLine', 'dropKitVar', 'dropDeadImport', 'label'].includes(k)) fail('unwire 설정에 모르는 칸: ' + k);
  // [#TASK-ES-681 · 설계 5.10절] dropDeadImport — 읽는 곳이 하나도 없는 키트 가져오기 줄을 지운다(등록 기관과 무관한 「죽은 줄」). 기본은 꺼져 있고, 이름 · 근거 글자 · 그 속성을 다는 파일을 적은 경우에만 동작한다.
  const DEAD = new Map();
  if (U.dropDeadImport !== undefined) {
    if (!Array.isArray(U.dropDeadImport) || !U.dropDeadImport.length) fail('unwire.dropDeadImport 는 비지 않은 배열이어야 한다(스위치로 풀리지 않는다)');
    for (const d of U.dropDeadImport) {
      if (!d || typeof d !== 'object' || Array.isArray(d)) fail('unwire.dropDeadImport 의 칸은 { name, reason, definedIn } 이어야 한다');
      for (const k of Object.keys(d)) if (!['name', 'reason', 'definedIn'].includes(k)) fail('unwire.dropDeadImport 에 모르는 칸: ' + k);
      if (typeof d.name !== 'string' || !/^[A-Za-z_$][\w$]*$/.test(d.name)) fail('unwire.dropDeadImport 의 name 이 이름 꼴이 아니다: ' + JSON.stringify(d.name));
      if (typeof d.reason !== 'string' || d.reason.trim().length < 10 || /[\r\n]/.test(d.reason)) fail('unwire.dropDeadImport 「' + d.name + '」 의 근거(reason)가 없거나 짧거나(10자 미만) 여러 줄이다');
      if (typeof d.definedIn !== 'string' || !/^js\/[\w./-]+\.js$/.test(d.definedIn) || d.definedIn.includes('..')) fail('unwire.dropDeadImport 「' + d.name + '」 의 definedIn(그 키트 속성을 다는 js/ 아래 파일)이 없거나 꼴이 다르다');
      if (DEAD.has(d.name)) fail('unwire.dropDeadImport 에 같은 이름이 둘이다: ' + d.name);
      DEAD.set(d.name, { reason: d.reason, definedIn: d.definedIn });
    }
  }
  if (typeof U.kitVar !== 'string' || !/^[A-Za-z_$][\w$]*$/.test(U.kitVar)) fail('unwire.kitVar 가 이름이 아니다: ' + U.kitVar);
  // X1: kitVar 는 IIFE 최상위에서 `var <kitVar> = window.…;` 로 한 번 선언된 손잡이여야 한다(아무 식별자나 받지 않는다)
  const rootWin = n => { let x = n; while (x && x.type === 'MemberExpression' && !x.computed) x = x.object; return !!x && x.type === 'Identifier' && x.name === 'window'; };
  const handleSts = top.filter(st => st.isVariableDeclaration() && st.node.declarations.some(d => d.id.type === 'Identifier' && d.id.name === U.kitVar));
  if (handleSts.length !== 1 || handleSts[0].node.declarations.length !== 1 || !handleSts[0].node.declarations[0].init || handleSts[0].node.declarations[0].init.type !== 'MemberExpression' || !rootWin(handleSts[0].node.declarations[0].init))
    fail('unwire.kitVar 는 IIFE 최상위에서 `var ' + U.kitVar + ' = window.…;` 로 한 번 선언된 손잡이여야 한다: ' + U.kitVar);
  const names = new Set(Array.isArray(U.names) ? U.names : []);
  const shared = U.sharedLine === true, dropKit = U.dropKitVar === true;
  if (!names.size && !dropKit && !DEAD.size) fail('unwire.names 가 비었다');
  for (const n of names) if (!/^[A-Za-z_$][\w$]*$/.test(n)) fail('unwire.names 에 이름이 아닌 글자: ' + n);
  const doImports = U.imports !== false, doExpose = U.exposeGetters !== false, doWindow = U.windowAssign !== false;
  const del = new Set();        // 지울 줄(index.html 1-based)
  const commaFix = new Map();   // 줄 → 쉼표를 뗀 새 글자
  const cuts = new Map();       // X3: 줄 → [{ c0, c1, s, e }] 그 줄 안에서 지울 글자 구간(열, code 오프셋)
  const removed = { imports: [], exposeProps: [], exposeCalls: [], windowAssigns: [], windowBlocks: [] };
  const hit = {}; for (const n of names) hit[n] = 0;
  const src = n => code.slice(n.start, n.end);
  const ownLine = (st, what) => { // 문이 한 줄을 통째로 차지하는가(앞뒤에 다른 글자 0)
    if (H(st.node) !== HE(st.node)) fail(what + ' 이(가) 여러 줄에 걸쳐 있다: ' + H(st.node));
    if (lines[H(st.node) - 1].trim() !== src(st.node)) fail(what + ' 이(가) 다른 글자와 한 줄을 나눠 쓴다: ' + H(st.node));
  };
  const sharesLine = nd => H(nd) === HE(nd) && lines[H(nd) - 1].trim() !== src(nd);
  const cutInline = (nd, what) => { // X3: 한 줄 안의 그 문 글자만 지운다
    if (H(nd) !== HE(nd)) fail(what + ' 이(가) 여러 줄에 걸쳐 있다: ' + H(nd));
    const l = H(nd);
    if (lines[l - 1].slice(nd.loc.start.column, nd.loc.end.column) !== src(nd)) fail(what + ' 의 줄 안 자리를 찾지 못했다: ' + l);
    if (!cuts.has(l)) cuts.set(l, []);
    cuts.get(l).push({ c0: nd.loc.start.column, c1: nd.loc.end.column, s: nd.start, e: nd.end });
  };
  const isWA = x => x && x.type === 'AssignmentExpression' && x.operator === '=' && x.left.type === 'MemberExpression' && !x.left.computed && x.left.object.type === 'Identifier' && x.left.object.name === 'window' && x.left.property.type === 'Identifier';
  const isSeqWA = x => x && x.type === 'SequenceExpression' && x.expressions.every(isWA);
  const isExposureBlock = n => n.type === 'IfStatement' && !n.alternate && n.consequent.type === 'BlockStatement' && n.consequent.body.length > 0
    && n.consequent.body.every(b => b.type === 'ExpressionStatement' && (isWA(b.expression) || isSeqWA(b.expression)));
  const checkRhs = (x, where) => { if (x.right.type !== 'Identifier') fail('window.' + x.left.property.name + ' 대입의 오른쪽이 이름이 아니다(' + x.right.type + ') — 배선이 아니라 정의문이라 지우지 않는다: ' + where); };
  const headTailOnly = (st, what) => { // 여러 줄 문의 머리 줄·꼬리 줄에 그 문 말고 다른 글자가 없는가
    const a = H(st.node), b = HE(st.node);
    if (lines[a - 1].slice(0, st.node.loc.start.column).trim() !== '' || lines[b - 1].slice(st.node.loc.end.column).trim() !== '') fail(what + ' 의 머리·꼬리 줄에 다른 글자가 있다: ' + a + '~' + b);
  };
  for (const st of top) {
    const e = st.isExpressionStatement() ? st.node.expression : null;
    // ① 가져오기
    if (st.isVariableDeclaration()) {
      if (st.node.declarations.length !== 1) continue;
      const d = st.node.declarations[0];
      if (!d.init || d.id.type !== 'Identifier' || d.init.type !== 'MemberExpression' || d.init.computed || d.init.object.type !== 'Identifier' || d.init.object.name !== U.kitVar) continue;
      if (!names.has(d.id.name)) continue;
      if (d.init.property.type !== 'Identifier' || d.init.property.name !== d.id.name) fail('가져오기 이름과 키트 속성이 다르다: ' + src(st.node));
      if (!doImports) continue;
      ownLine(st, '가져오기 ' + d.id.name);
      del.add(H(st.node)); hit[d.id.name]++; removed.imports.push({ name: d.id.name, line: H(st.node) });
      continue;
    }
    // ② expose getter/setter
    if (e && e.type === 'CallExpression' && e.callee.type === 'MemberExpression' && !e.callee.computed && e.callee.property.name === 'expose'
      && ((e.callee.object.type === 'Identifier' && e.callee.object.name === 'OurgoalAppScope') || (e.callee.object.type === 'MemberExpression' && !e.callee.object.computed && e.callee.object.property.name === 'OurgoalAppScope'))
      && e.arguments.length === 2 && e.arguments[1].type === 'ObjectExpression') {
      if (!doExpose) continue;
      const byLine = new Map();
      for (const p of e.arguments[1].properties) { const l = p.loc.start.line + doc.off; if (!byLine.has(l)) byLine.set(l, []); byLine.get(l).push(p); }
      for (const [l, ps] of byLine) {
        const keys = [...new Set(ps.map(p => (p.type === 'ObjectMethod' && !p.computed && p.key.type === 'Identifier' && (p.kind === 'get' || p.kind === 'set')) ? p.key.name : null))];
        const mine = keys.filter(k => k !== null && names.has(k));
        if (!mine.length) continue;
        if (keys.length !== 1) fail('expose 속성 줄에 여러 이름이 섞여 있다(' + keys.join(',') + '): ' + l);
        if (ps.some(p => p.loc.end.line + doc.off !== l)) fail('expose 속성이 여러 줄에 걸쳐 있다: ' + l);
        if (l === H(st.node) || l === HE(st.node)) fail('expose 속성이 머리·꼬리 줄과 한 줄을 나눠 쓴다: ' + l);
        if (lines[l - 1].trim().replace(/,$/, '') !== code.slice(ps[0].start, ps[ps.length - 1].end)) fail('expose 속성 줄에 다른 글자가 있다: ' + l);
        del.add(l); hit[keys[0]]++; removed.exposeProps.push({ name: keys[0], line: l, kinds: ps.map(p => p.kind) });
      }
      const rest = [...byLine.keys()].filter(l => !del.has(l)).sort((a, b) => a - b);
      if (!rest.length) { headTailOnly(st, 'expose 문'); for (let l = H(st.node); l <= HE(st.node); l++) del.add(l); removed.exposeCalls.push({ line: H(st.node), endLine: HE(st.node) }); }
      else { const last = rest[rest.length - 1]; const t = lines[last - 1]; if (/,\s*$/.test(t)) commaFix.set(last, t.replace(/,\s*$/, '')); }
      continue;
    }
    // ③ window 대입
    if (e && (isWA(e) || isSeqWA(e))) {
      if (isSeqWA(e)) { if (e.expressions.some(x => names.has(x.left.property.name))) fail('한 줄에 여러 window 대입(쉼표 연쇄)이 있어 하나만 지울 수 없다: ' + H(st.node)); continue; }
      const n = e.left.property.name;
      if (!names.has(n) || !doWindow) continue;
      checkRhs(e, '줄 ' + H(st.node));
      if (shared && sharesLine(st.node)) { // X3: 주석·다른 문과 한 줄을 나눠 쓰는 대입
        cutInline(st.node, 'window 대입 ' + n);
        hit[n]++; removed.windowAssigns.push({ name: n, line: H(st.node), inline: true });
        continue;
      }
      ownLine(st, 'window 대입 ' + n);
      del.add(H(st.node)); hit[n]++; removed.windowAssigns.push({ name: n, line: H(st.node) });
      continue;
    }
    if (st.isIfStatement() && isExposureBlock(st.node)) {
      if (!doWindow) continue;
      const body = st.node.consequent.body;
      const a = H(st.node), b = HE(st.node);
      if (a === b) { // 한 줄 if 블록
        const x = body[0].expression;
        if (body.length !== 1 || !isWA(x)) {
          if (!body.some(s => (isWA(s.expression) ? [s.expression] : s.expression.expressions).some(y => names.has(y.left.property.name)))) continue;
          if (!shared) fail('한 줄 if 블록에 여러 window 대입이 있어 하나만 지울 수 없다: ' + a);
          // X3: 한 줄 if 블록 안 여러 대입 중 names 의 것만 지운다
          if (body.some(s => !isWA(s.expression))) fail('한 줄 if 블록에 쉼표 연쇄 window 대입이 있어 지울 수 없다: ' + a);
          const mine = body.filter(s => names.has(s.expression.left.property.name));
          for (const s of mine) checkRhs(s.expression, '줄 ' + a);
          const whole = mine.length === body.length, inl = !whole || sharesLine(st.node); // 블록의 대입이 모두 대상이면 블록째 지운다
          if (whole) { if (inl) cutInline(st.node, 'window 대입 블록'); else del.add(a); }
          for (const s of mine) {
            if (!whole) cutInline(s, 'window 대입 ' + s.expression.left.property.name);
            hit[s.expression.left.property.name]++; removed.windowAssigns.push(Object.assign({ name: s.expression.left.property.name, line: a, block: 'one-line' }, inl ? { inline: true } : {}));
          }
          continue;
        }
        if (!names.has(x.left.property.name)) continue;
        checkRhs(x, '줄 ' + a);
        if (shared && sharesLine(st.node)) { // X3: 주석·다른 문과 한 줄을 나눠 쓰는 한 줄 블록
          cutInline(st.node, 'window 대입 블록 ' + x.left.property.name);
          hit[x.left.property.name]++; removed.windowAssigns.push({ name: x.left.property.name, line: a, block: 'one-line', inline: true });
          continue;
        }
        ownLine(st, 'window 대입 블록 ' + x.left.property.name);
        del.add(a); hit[x.left.property.name]++; removed.windowAssigns.push({ name: x.left.property.name, line: a, block: 'one-line' });
        continue;
      }
      const bodyLines = [];
      for (const s of body) {
        const x = s.expression, l = s.loc.start.line + doc.off;
        bodyLines.push(l);
        if (isSeqWA(x)) { if (x.expressions.some(y => names.has(y.left.property.name))) fail('if 블록 안 한 줄에 여러 window 대입이 있어 하나만 지울 수 없다: ' + l); continue; }
        const n = x.left.property.name;
        if (!names.has(n)) continue;
        checkRhs(x, '줄 ' + l);
        if (s.loc.end.line + doc.off !== l || l === a || l === b) fail('window 대입이 여러 줄이거나 if 머리·꼬리와 한 줄을 나눠 쓴다: ' + l);
        if (lines[l - 1].trim() !== src(s)) fail('window 대입 줄에 다른 글자가 있다: ' + l);
        del.add(l); hit[n]++; removed.windowAssigns.push({ name: n, line: l, block: a + '~' + b });
      }
      if (bodyLines.every(l => del.has(l))) { headTailOnly(st, 'window 대입 if 블록'); for (let l = a; l <= b; l++) del.add(l); removed.windowBlocks.push({ line: a, endLine: b }); }
    }
  }
  for (const n of names) if (!hit[n]) fail('unwire.names 의 이름인데 지울 줄이 하나도 없다: ' + n);
  // [#TASK-ES-681 · 설계 5.10절] dropDeadImport: 가져오기 줄 하나만 지운다. 아래 가운데 하나라도 어긋나면 멈춘다.
  //   ① 선언이 `var N = <kitVar>.N;` 꼴(단순 속성 읽기 — 호출 · 계산된 속성 · 다른 손잡이면 멈춤)이고 한 줄을 통째로 차지한다 ② IIFE 안에 그 이름을 읽거나 쓰는 곳이 하나도 없다
  //   ③ 그 이름의 getter·setter 속성이나 `….N = …` 대입이 IIFE 안에 없다 ④ 그 이름이 낱말로 든 문자열이 IIFE 안에 없고, eval · new Function · with 가 IIFE 안에 없다(동적 접근)
  //   ⑤ definedIn 파일이 그 속성을 **데이터 속성**으로 단다(객체의 보통 속성 `N: …` 또는 `….N = …` 대입) — 접근자(get/set · defineProperty)면 읽기만으로 부수효과가 날 수 있어 멈춘다
  for (const [n, dd] of DEAD) {
    if (names.has(n)) fail('dropDeadImport 이름이 unwire.names 에도 있다 — 한 곳에만 적는다: ' + n);
    const sts = top.filter(st => st.isVariableDeclaration() && st.node.declarations.some(d => d.id.type === 'Identifier' && d.id.name === n));
    if (sts.length !== 1 || sts[0].node.declarations.length !== 1) fail('dropDeadImport 이름의 가져오기 줄이 IIFE 최상위에 꼭 하나가 아니다: ' + n + ' — ' + sts.length + '개(쓰이지 않는 허용은 적지 않는다)');
    const st = sts[0], d = st.node.declarations[0];
    if (!d.init || d.init.type !== 'MemberExpression' || d.init.computed || d.init.object.type !== 'Identifier' || d.init.object.name !== U.kitVar || d.init.property.type !== 'Identifier' || d.init.property.name !== n)
      fail('dropDeadImport 이름의 선언 오른쪽이 「' + U.kitVar + '.' + n + '」 단순 속성 읽기가 아니다 — 지우지 않는다: ' + src(st.node));
    ownLine(st, '가져오기 ' + n);
    const bd = iScope.getBinding(n);
    const used = bd ? [...new Set(bd.referencePaths.map(r => r.node).concat(bd.constantViolations.map(r => r.node)).map(H))].sort((x, y) => x - y) : null;
    if (!bd || bd.path.node !== d) fail('dropDeadImport 이름의 선언을 찾지 못했다: ' + n);
    if (used.length) fail('dropDeadImport 이름을 IIFE 안에서 읽거나 쓰는 곳이 있다 — 죽은 가져오기가 아니다: ' + n + '(줄 ' + used.join(',') + ')');
    const word = new RegExp('(^|[^A-Za-z0-9_$])' + n.replace(/[$]/g, '\\$&') + '($|[^A-Za-z0-9_$])');
    iScope.path.traverse({
      StringLiteral(p) { if (word.test(p.node.value)) fail('dropDeadImport 이름이 낱말로 든 문자열이 IIFE 안에 있다(동적 접근일 수 있다) — 지우지 않는다: ' + n + '(줄 ' + H(p.node) + ')'); },
      TemplateElement(p) { if (word.test(p.node.value.raw)) fail('dropDeadImport 이름이 낱말로 든 문자열이 IIFE 안에 있다(동적 접근일 수 있다) — 지우지 않는다: ' + n + '(줄 ' + H(p.node) + ')'); },
      ObjectMethod(p) { if ((p.node.kind === 'get' || p.node.kind === 'set') && !p.node.computed && p.node.key.type === 'Identifier' && p.node.key.name === n) fail('dropDeadImport 이름의 getter·setter 가 IIFE 안에 있다 — 통로로 나가는 이름이다(죽은 가져오기가 아니다): ' + n + '(줄 ' + H(p.node) + ')'); },
      AssignmentExpression(p) { const l = p.node.left; if (l.type === 'MemberExpression' && !l.computed && l.property.type === 'Identifier' && l.property.name === n) fail('dropDeadImport 이름으로 대입하는 줄이 IIFE 안에 있다(window 노출일 수 있다) — 지우지 않는다: ' + n + '(줄 ' + H(p.node) + ')'); },
      CallExpression(p) { if (p.node.callee.type === 'Identifier' && p.node.callee.name === 'eval') fail('IIFE 안에 eval 이 있다 — 이름을 동적으로 읽을 수 있어 죽은 가져오기를 지우지 않는다(줄 ' + H(p.node) + ')'); },
      NewExpression(p) { if (p.node.callee.type === 'Identifier' && p.node.callee.name === 'Function') fail('IIFE 안에 new Function 이 있다 — 이름을 동적으로 읽을 수 있어 죽은 가져오기를 지우지 않는다(줄 ' + H(p.node) + ')'); },
      WithStatement(p) { fail('IIFE 안에 with 문이 있다 — 죽은 가져오기를 지우지 않는다(줄 ' + H(p.node) + ')'); },
    });
    // ⑤ 데이터 속성인지(정적): definedIn 파일을 읽어 그 이름의 정의 꼴을 본다
    const defFile = path.join(APP, dd.definedIn);
    if (!fs.existsSync(defFile)) fail('dropDeadImport 「' + n + '」 의 definedIn 파일이 없다: ' + dd.definedIn);
    let defAst; try { defAst = parser.parse(fs.readFileSync(defFile, 'utf8'), { sourceType: 'script' }); } catch (err) { fail('dropDeadImport 「' + n + '」 의 definedIn 파일이 파싱되지 않는다: ' + dd.definedIn); }
    const keyIs = k => (k.type === 'Identifier' && k.name === n) || (k.type === 'StringLiteral' && k.value === n);
    let dataAt = null, accessorAt = null;
    traverse(defAst, {
      ObjectProperty(p) { if (!p.node.computed && keyIs(p.node.key) && dataAt === null) dataAt = p.node.loc.start.line; },
      ObjectMethod(p) { if (!p.node.computed && keyIs(p.node.key)) { if (p.node.kind === 'get' || p.node.kind === 'set') accessorAt = p.node.loc.start.line; else if (dataAt === null) dataAt = p.node.loc.start.line; } },
      ClassMethod(p) { if (!p.node.computed && keyIs(p.node.key) && (p.node.kind === 'get' || p.node.kind === 'set')) accessorAt = p.node.loc.start.line; },
      AssignmentExpression(p) { const l = p.node.left; if (l.type === 'MemberExpression' && !l.computed && l.property.type === 'Identifier' && l.property.name === n && dataAt === null) dataAt = p.node.loc.start.line; },
      CallExpression(p) {
        const c = p.node.callee, a = p.node.arguments;
        const nm = c.type === 'MemberExpression' && !c.computed && c.property.type === 'Identifier' ? c.property.name : '';
        if (/^(defineProperty|__defineGetter__|__defineSetter__)$/.test(nm) && a.some(x => x.type === 'StringLiteral' && x.value === n)) accessorAt = p.node.loc.start.line;
        if (nm === 'defineProperties') accessorAt = accessorAt || p.node.loc.start.line; // 어느 이름을 정의하는지 정적으로 가리지 않는다 — 있으면 멈춘다
      },
    });
    if (accessorAt !== null) fail('dropDeadImport 「' + n + '」 — ' + dd.definedIn + ' 가 그 속성을 접근자(get/set · defineProperty)로 정의한다(줄 ' + accessorAt + '). 읽기만으로 부수효과가 날 수 있어 지우지 않는다');
    if (dataAt === null) fail('dropDeadImport 「' + n + '」 — ' + dd.definedIn + ' 에서 그 속성을 데이터 속성으로 다는 자리(`' + n + ': …` 또는 `….' + n + ' = …`)를 찾지 못했다 — 지우지 않는다');
    del.add(H(st.node));
    (removed.deadImports = removed.deadImports || []).push({ name: n, line: H(st.node), kit: src(handleSts[0].node.declarations[0].init).replace(/^window\./, ''), reason: dd.reason, definedIn: dd.definedIn, definedAtLine: dataAt });
  }
  // X3: 줄 안 삭제를 줄 글자로 바꾼다(오른쪽부터). 지운 문 뒤의 빈칸을 함께 지우고, 줄 끝이었으면 앞 빈칸을 지운다. 줄이 비면 줄을 지운다.
  const edits = new Map(), cutRanges = [], inlineEdits = [];
  for (const [l, cs] of cuts) {
    if (del.has(l)) fail('줄 안 삭제와 줄 삭제가 같은 줄에 겹친다: ' + l);
    if (commaFix.has(l)) fail('줄 안 삭제와 쉼표 떼기가 같은 줄에 겹친다: ' + l);
    const sorted = cs.slice().sort((p, q) => q.c0 - p.c0);
    for (let i = 1; i < sorted.length; i++) if (sorted[i].c1 > sorted[i - 1].c0) fail('줄 안 삭제 구간이 서로 겹친다: ' + l);
    let t = lines[l - 1];
    for (const c of sorted) { const left = t.slice(0, c.c0), right = t.slice(c.c1).replace(/^[ \t]+/, ''); t = right === '' ? left.replace(/[ \t]+$/, '') : left + right; cutRanges.push({ s: c.s, e: c.e }); }
    if (t.trim() === '') del.add(l); else edits.set(l, t);
    inlineEdits.push({ line: l, before: lines[l - 1], after: t.trim() === '' ? null : t });
  }
  const gone = nd => del.has(H(nd)) || cutRanges.some(r => nd.start >= r.s && nd.end <= r.e); // 이 실행이 지우는 글자 안에 있는가
  const leftOf = bd => [...new Set(bd.referencePaths.map(r => r.node).concat(bd.constantViolations.map(r => r.node)).filter(nd => !gone(nd)).map(H))].sort((x, y) => x - y);
  // 안전: 가져오기를 지운 이름이 IIFE 안에 아직 읽히거나 대입되면 멈춘다(지운 글자 밖의 참조만 센다)
  const remaining = [];
  for (const n of names) {
    const b = iScope.getBinding(n);
    if (!b || !del.has(H(b.path.node))) continue;
    const left = leftOf(b);
    if (left.length) remaining.push(n + '(줄 ' + left.join(',') + ')');
  }
  if (remaining.length) fail('철거한 이름을 IIFE 안에서 아직 쓰는 곳이 남는다 — 지우지 않는다: ' + remaining.join(' · '));
  // X2: 손잡이 줄 — 이 실행의 삭제를 반영한 뒤 맨이름 참조가 0 일 때만 지운다
  if (dropKit) {
    const hs = handleSts[0];
    ownLine(hs, '손잡이 ' + U.kitVar);
    const hb = iScope.getBinding(U.kitVar);
    if (!hb || hb.path.node !== hs.node.declarations[0]) fail('손잡이 ' + U.kitVar + ' 의 선언을 찾지 못했다');
    const left = leftOf(hb);
    if (left.length) fail('손잡이 ' + U.kitVar + ' 을(를) IIFE 안에서 아직 쓰는 곳이 남는다 — 지우지 않는다: 줄 ' + left.join(','));
    del.add(H(hs.node)); removed.kitVarLine = { name: U.kitVar, line: H(hs.node) };
  }
  const nh = [];
  for (let i = 0; i < lines.length; i++) { const l = i + 1; if (del.has(l)) continue; nh.push(edits.has(l) ? edits.get(l) : commaFix.has(l) ? commaFix.get(l) : lines[i]); }
  // 사후 대조: 다시 파싱한 토큰열 = 이전 토큰열 − (지운 줄의 토큰 · 줄 안에서 지운 글자의 토큰 · 뗀 쉼표). 주석도 지운 줄의 것만 빠진다.
  const next = parseUnwireDoc(nh);
  const isComment = t => typeof t.type === 'string';
  const sig = t => (t.type.label || '') + '\u0000' + (t.value === undefined ? '' : String(t.value));
  const tokLine = t => t.loc.start.line + doc.off;
  const oldToks = doc.ast.tokens.filter(t => !isComment(t)), commaTok = new Set();
  for (const l of commaFix.keys()) {
    const onLine = oldToks.filter(t => tokLine(t) === l), last = onLine[onLine.length - 1];
    if (!last || last.type.label !== ',') fail('쉼표를 뗀 줄의 마지막 토큰이 쉼표가 아니다: ' + l);
    commaTok.add(last);
  }
  const want = oldToks.filter(t => !del.has(tokLine(t)) && !commaTok.has(t) && !cutRanges.some(r => t.start >= r.s && t.end <= r.e)).map(sig);
  const got = next.ast.tokens.filter(t => !isComment(t)).map(sig);
  let diffAt = want.length === got.length ? -1 : Math.min(want.length, got.length);
  for (let i = 0; i < Math.min(want.length, got.length); i++) if (want[i] !== got[i]) { diffAt = i; break; }
  if (diffAt >= 0) fail('지운 뒤 다시 파싱한 토큰열이 예상과 다르다(닫힌 목록 밖 글자 변화) — 쓰지 않는다: 토큰 ' + diffAt + ' 기대 ' + JSON.stringify(want[diffAt]) + ' 실제 ' + JSON.stringify(got[diffAt]));
  const wantCom = doc.ast.tokens.filter(t => isComment(t) && !del.has(tokLine(t))).map(t => t.value), gotCom = next.ast.tokens.filter(isComment).map(t => t.value);
  if (wantCom.length !== gotCom.length || wantCom.some((v, i) => v !== gotCom[i])) fail('지운 뒤 남은 주석이 예상과 다르다 — 쓰지 않는다');
  const flags = { imports: doImports, exposeGetters: doExpose, windowAssign: doWindow };
  if (shared) flags.sharedLine = true;
  if (dropKit) flags.dropKitVar = true;
  const meta = { kitVar: U.kitVar, names: [...names], flags, removed, commaFixedLines: [...commaFix.keys()], deletedLines: [...del].sort((a, b) => a - b), htmlLinesBefore: lines.length, htmlLinesAfter: nh.length };
  if (inlineEdits.length) meta.inlineEdits = inlineEdits;
  const log = [U.kitVar, '· names', names.size, '· imports', removed.imports.length, '· expose props', removed.exposeProps.length, '(calls', removed.exposeCalls.length + ')', '· window', removed.windowAssigns.length, '(blocks', removed.windowBlocks.length + ')', '· comma', commaFix.size];
  if (inlineEdits.length) log.push('· inline', inlineEdits.length);
  if (removed.kitVarLine) log.push('· kitVar line', removed.kitVarLine.line);
  if (removed.deadImports) for (const x of removed.deadImports) log.push('\n  dead-import ' + x.name + ' — 줄 ' + x.line + '(`var ' + x.name + ' = ' + U.kitVar + '.' + x.name + ';`) 을 지운다 · 읽는 곳 0 · 데이터 속성: ' + x.definedIn + ' 줄 ' + x.definedAtLine + ' · 근거: ' + x.reason); // [#TASK-ES-681] 쓴 것마다 한 줄
  return { next, meta, log };
}

// ── [#TASK-ES-634 · docs/architecture/CELL-REGISTRY-DESIGN.md 3.3절 · 5절 닫힌 목록 X4·X5·X6 — 상민님 2026-10-11 「허용」, 효력 기록 지시함 DIR-004] 상태 이전 모드(설정 "mode": "unstate").
// 통로에 노출된 IIFE 상태 변수의 소유를 상태 기관(window.OurgoalAppState — js/core/app-state.js, 이 생성기는 만들지 않는다)으로 옮긴다. 다루는 줄은 세 종류뿐이다:
//   S1(X4) 그 이름의 OurgoalAppScope.expose getter/setter 속성 줄 — 삭제(객체가 비면 expose 문 전체, 새로 마지막이 된 속성의 쉼표 한 글자). 본문이 `return X;`·`X = v;` 꼴이 아니면 멈춘다.
//   R1(X5) 선언문 `var X = <초기값>;` — `var X =` 를 `window.OurgoalAppState.define('X',` 로, 끝의 `;` 를 `);` 로 바꿔 쓴다. 초기값 글자와 자리는 그대로다.
//          그 이름의 마지막 노출 문(지우기 직전)에 `set X` 가 있었으면 define 대신 defineVar 를 쓴다 — 사람이 아니라 생성기가 정한다(L047).
//   R2(X6) 자기 일회 window 복사 줄 `window.X = X;` — 오른쪽 이름만 `window.OurgoalAppScope.scope.X` 로 바꿔 쓴다(자리·시점 유지).
// 안전 정지(fail): 그 이름의 맨이름 참조(읽기·대입)가 지운 줄·바꿔 쓴 글자 밖에 하나라도 남으면 · 초기값에 자기 이름이 나오면 · 선언이 없거나 여럿이면 · 선언자가 여럿이면 ·
//   초기값이 없으면 · 선언문이 다른 글자와 한 줄을 나눠 쓰면 · 통로에 노출되지 않은 이름이면 · window 복사 줄이 다른 글자와 한 줄을 나눠 쓰거나 쉼표 연쇄면 ·
//   선언이 첫 노출 문보다 앞이고 그 사이에 실행되는 문이 있으면(노출 시점이 달라진다) 멈춘다. 함수 본문은 옮기거나 고치지 않는다. 세포 파일은 쓰지 않는다.
// 여러 실행: "unstate" 가 배열이면 차례로 적용한다(앞 실행 결과를 다시 파싱). 배열의 단계가 { "unwire": { … } } 이면 그 단계는 위 unwire 실행 하나로 돈다(unwireOnce 를 그대로 부른다 — 법정은 PR 하나에 생성기를 한 번만 돌린다).
// 사후 대조(모든 실행): 다시 파싱한 토큰열 = 이전 토큰열 − 지운 줄의 토큰 − 뗀 쉼표, 그리고 바꿔 쓴 자리는 정해진 토큰열로 바뀜. 남은 주석은 그대로. 다르면 쓰지 않고 멈춘다.
// 설정 예: { "task": "TASK-ES-6xx", "slot": "HO", "mode": "unstate", "cells": [{ "file": "js/core/app-state.js" }], "unstate": { "names": ["toastTimer", "…"] } }
//   여러 단계: "unstate": [ { "names": ["…"] }, { "unwire": { "kitVar": "_uiKit", "names": ["…"] } }, { "names": ["…"] } ]
if (CFG.mode === 'unstate') { runUnstate(); return; }
function runUnstate() {
  const isList = Array.isArray(CFG.unstate);
  const specs = isList ? CFG.unstate : [CFG.unstate || {}];
  if (isList && !specs.length) fail('unstate 배열이 비었다');
  let doc = parseUnwireDoc(lines);
  const metas = [], logs = [];
  for (let i = 0; i < specs.length; i++) {
    const sp = specs[i];
    let r;
    try {
      if (isList && sp && typeof sp === 'object' && !Array.isArray(sp) && Object.prototype.hasOwnProperty.call(sp, 'unwire')) { // unwire 단계 — 위 unwireOnce 를 그대로 부른다
        if (Object.keys(sp).length !== 1) fail('unwire 단계에는 unwire 칸 하나만 둔다');
        r = unwireOnce(sp.unwire, doc);
        r = { next: r.next, meta: Object.assign({ step: 'unwire' }, r.meta), log: ['unwire'].concat(r.log) };
      } else {
        r = unstateOnce(sp, doc);
        if (isList) r = { next: r.next, meta: Object.assign({ step: 'unstate' }, r.meta), log: r.log };
      }
    } catch (err) { if (isList) err.message = '[unstate 실행 ' + (i + 1) + '/' + specs.length + '] ' + err.message; throw err; }
    metas.push(r.meta); logs.push(r.log);
    doc = r.next;
  }
  fs.writeFileSync(path.join(APP, 'index.html'), doc.lines.join(EOL), 'utf8');
  const meta = isList
    ? { task: TAG, mode: 'unstate', runs: metas, htmlLinesBefore: lines.length, htmlLinesAfter: doc.lines.length, files: {} }
    : Object.assign({ task: TAG, mode: 'unstate' }, metas[0], { files: {} });
  fs.writeFileSync(path.join(process.env.MODULE_SPLIT_OUT || require('os').tmpdir(), 'gen-inline-hard-meta.json'), JSON.stringify(meta, null, 1), 'utf8');
  logs.forEach((l, i) => console.log(...(isList ? ['[' + (i + 1) + '/' + specs.length + ']'] : []), ...l));
  console.log('index.html lines', lines.length, '->', doc.lines.length);
}
function unstateOnce(U, doc) {
  const { lines, code, top, iScope } = doc; // 이 실행이 보는 문서(앞 실행의 결과). 파일 머리의 같은 이름을 가린다.
  const H = n => n.loc.start.line + doc.off, HE = n => n.loc.end.line + doc.off;
  if (!U || typeof U !== 'object' || Array.isArray(U)) fail('unstate 실행 설정은 객체여야 한다');
  for (const k of Object.keys(U)) if (!['names', 'label'].includes(k)) fail('unstate 설정에 모르는 칸: ' + k);
  const names = new Set(Array.isArray(U.names) ? U.names : []);
  if (!names.size) fail('unstate.names 가 비었다');
  for (const n of names) if (typeof n !== 'string' || !/^[A-Za-z_$][\w$]*$/.test(n)) fail('unstate.names 에 이름이 아닌 글자: ' + n);
  const ORGAN = 'window.OurgoalAppState', SCOPE = 'window.OurgoalAppScope.scope';
  const del = new Set();        // 지울 줄(index.html 1-based)
  const commaFix = new Map();   // 줄 → 쉼표를 뗀 새 글자
  const subs = [];              // 바꿔 쓸 글자 구간 { line, c0, c1, s, e, text, sigs }
  const removed = { exposeProps: [], exposeCalls: [] }, rewritten = { declarations: [], windowCopies: [] }, api = Object.create(null);
  const st8 = Object.create(null); for (const n of names) st8[n] = { decls: [], expose: [], copies: [] };
  const src = n => code.slice(n.start, n.end);
  const isWA = x => x && x.type === 'AssignmentExpression' && x.operator === '=' && x.left.type === 'MemberExpression' && !x.left.computed && x.left.object.type === 'Identifier' && x.left.object.name === 'window' && x.left.property.type === 'Identifier';
  const isSeqWA = x => x && x.type === 'SequenceExpression' && x.expressions.every(isWA);
  const isExposureBlock = n => n.type === 'IfStatement' && !n.alternate && n.consequent.type === 'BlockStatement' && n.consequent.body.length > 0
    && n.consequent.body.every(b => b.type === 'ExpressionStatement' && (isWA(b.expression) || isSeqWA(b.expression)));
  const isExposeCall = e => !!e && e.type === 'CallExpression' && e.callee.type === 'MemberExpression' && !e.callee.computed && e.callee.property.name === 'expose'
    && ((e.callee.object.type === 'Identifier' && e.callee.object.name === 'OurgoalAppScope') || (e.callee.object.type === 'MemberExpression' && !e.callee.object.computed && e.callee.object.property.name === 'OurgoalAppScope'))
    && e.arguments.length === 2 && e.arguments[1].type === 'ObjectExpression';
  const isCopy = x => isWA(x) && names.has(x.left.property.name) && x.right.type === 'Identifier' && x.right.name === x.left.property.name; // 자기 일회 window 복사 `window.X = X`
  const trivialAccessor = p => { // getter 는 `return X;`, setter 는 `X = v;` 하나뿐인가
    const b = p.body.body, k = p.key.name;
    if (p.kind === 'get') return p.params.length === 0 && b.length === 1 && b[0].type === 'ReturnStatement' && !!b[0].argument && b[0].argument.type === 'Identifier' && b[0].argument.name === k;
    return p.params.length === 1 && p.params[0].type === 'Identifier' && b.length === 1 && b[0].type === 'ExpressionStatement' && b[0].expression.type === 'AssignmentExpression' && b[0].expression.operator === '='
      && b[0].expression.left.type === 'Identifier' && b[0].expression.left.name === k && b[0].expression.right.type === 'Identifier' && b[0].expression.right.name === p.params[0].name;
  };
  const headTailOnly = (st, what) => { // 문의 머리 줄·꼬리 줄에 그 문 말고 다른 글자가 없는가
    const a = H(st.node), b = HE(st.node);
    if (lines[a - 1].slice(0, st.node.loc.start.column).trim() !== '' || lines[b - 1].slice(st.node.loc.end.column).trim() !== '') fail(what + ' 이(가) 다른 글자와 한 줄을 나눠 쓴다: ' + a + (a === b ? '' : '~' + b));
  };
  top.forEach((st, idx) => {
    const e = st.isExpressionStatement() ? st.node.expression : null;
    if (st.isVariableDeclaration()) { for (const d of st.node.declarations) if (d.id.type === 'Identifier' && names.has(d.id.name)) st8[d.id.name].decls.push({ st, d, idx }); return; }
    // S1(X4): expose getter/setter
    if (isExposeCall(e)) {
      const byLine = new Map();
      for (const p of e.arguments[1].properties) { const l = p.loc.start.line + doc.off; if (!byLine.has(l)) byLine.set(l, []); byLine.get(l).push(p); }
      for (const [l, ps] of byLine) {
        const keys = [...new Set(ps.map(p => (p.type === 'ObjectMethod' && !p.computed && p.key.type === 'Identifier' && (p.kind === 'get' || p.kind === 'set')) ? p.key.name : null))];
        const mine = keys.filter(k => k !== null && names.has(k));
        if (!mine.length) continue;
        if (keys.length !== 1) fail('expose 속성 줄에 여러 이름이 섞여 있다(' + keys.join(',') + '): ' + l);
        if (ps.some(p => p.loc.end.line + doc.off !== l)) fail('expose 속성이 여러 줄에 걸쳐 있다: ' + l);
        if (l === H(st.node) || l === HE(st.node)) fail('expose 속성이 머리·꼬리 줄과 한 줄을 나눠 쓴다: ' + l);
        if (lines[l - 1].trim().replace(/,$/, '') !== code.slice(ps[0].start, ps[ps.length - 1].end)) fail('expose 속성 줄에 다른 글자가 있다: ' + l);
        if (!ps.every(trivialAccessor)) fail('expose 속성의 본문이 `return X;`·`X = v;` 꼴이 아니다 — 지우지 않는다: ' + l);
        del.add(l); st8[keys[0]].expose.push({ line: l, idx, kinds: ps.map(p => p.kind) }); removed.exposeProps.push({ name: keys[0], line: l, kinds: ps.map(p => p.kind) });
      }
      const rest = [...byLine.keys()].filter(l => !del.has(l)).sort((a, b) => a - b);
      if (![...byLine.keys()].some(l => del.has(l))) return;
      if (!rest.length) { headTailOnly(st, 'expose 문'); for (let l = H(st.node); l <= HE(st.node); l++) del.add(l); removed.exposeCalls.push({ line: H(st.node), endLine: HE(st.node) }); }
      else { const last = rest[rest.length - 1]; const t = lines[last - 1]; if (/,\s*$/.test(t)) commaFix.set(last, t.replace(/,\s*$/, '')); }
      return;
    }
    // R2(X6): 자기 일회 window 복사 줄 — 받는 꼴은 unwire 의 window 대입 줄과 같다(줄을 통째로 차지하는 문 · 그런 줄만 담은 if 블록)
    if (e && (isWA(e) || isSeqWA(e))) {
      if (isSeqWA(e)) { if (e.expressions.some(isCopy)) fail('window 복사가 쉼표 연쇄 안에 있어 바꿔 쓰지 않는다: ' + H(st.node)); return; }
      if (!isCopy(e)) return;
      if (H(st.node) !== HE(st.node) || lines[H(st.node) - 1].trim() !== src(st.node)) fail('window 복사 줄이 다른 글자와 한 줄을 나눠 쓴다: ' + H(st.node));
      st8[e.left.property.name].copies.push({ rhs: e.right, line: H(st.node) });
      return;
    }
    if (st.isIfStatement() && isExposureBlock(st.node)) {
      const body = st.node.consequent.body, a = H(st.node), b = HE(st.node);
      for (const s of body) {
        const x = s.expression, l = s.loc.start.line + doc.off;
        if (isSeqWA(x)) { if (x.expressions.some(isCopy)) fail('window 복사가 쉼표 연쇄 안에 있어 바꿔 쓰지 않는다: ' + l); continue; }
        if (!isCopy(x)) continue;
        if (a === b) { if (body.length !== 1 || lines[a - 1].trim() !== src(st.node)) fail('한 줄 if 블록의 window 복사가 다른 글자와 한 줄을 나눠 쓴다: ' + a); }
        else if (s.loc.end.line + doc.off !== l || l === a || l === b || lines[l - 1].trim() !== src(s)) fail('window 복사 줄에 다른 글자가 있다: ' + l);
        st8[x.left.property.name].copies.push({ rhs: x.right, line: l });
      }
    }
  });
  // 바꿔 쓴 자리에 들어갈 토큰열(사후 대조용) — 온전한 견본 문을 토큰으로 갈라 얻는다
  const isComment = t => typeof t.type === 'string';
  const sig = t => (t.type.label || '') + '\u0000' + (t.value === undefined ? '' : String(t.value));
  const sample = text => parser.parse(text, { sourceType: 'script', tokens: true }).tokens.filter(t => !isComment(t) && t.type.label !== 'eof').map(sig);
  const toks = doc.ast.tokens.filter(t => !isComment(t)), comments = doc.ast.tokens.filter(isComment);
  const quietBetween = (stmts, from, to) => { // 두 최상위 문 사이에 「실행되는」 문이 없는가(선언·함수 선언·노출·window 복사만 있으면 조용하다)
    for (let i = from + 1; i < to; i++) {
      const t = stmts[i].node, x = t.type === 'ExpressionStatement' ? t.expression : null;
      if (t.type === 'FunctionDeclaration' || isExposeCall(x) || isExposureBlock(t)) continue;
      if (x && (isSeqWA(x) || isWA(x)) && (isSeqWA(x) ? x.expressions : [x]).every(y => /^(Identifier|NullLiteral|BooleanLiteral|NumericLiteral|StringLiteral)$/.test(y.right.type))) continue;
      if (t.type === 'VariableDeclaration' && t.declarations.every(d => !d.init || /^(Identifier|NullLiteral|BooleanLiteral|NumericLiteral|StringLiteral)$/.test(d.init.type) || (d.init.type === 'MemberExpression' && !d.init.computed && d.init.object.type === 'Identifier'))) continue;
      return H(t);
    }
    return 0;
  };
  for (const n of names) {
    const info = st8[n];
    if (!info.decls.length) fail('unstate.names 의 이름인데 IIFE 최상위 선언이 없다: ' + n);
    if (info.decls.length !== 1) fail('같은 이름의 선언이 여럿이다 — 옮기지 않는다: ' + n + '(줄 ' + info.decls.map(x => H(x.st.node)).join(',') + ')');
    const { st, d, idx } = info.decls[0];
    if (st.node.kind !== 'var') fail('var 선언이 아니다 — 옮기지 않는다: ' + n + ' 줄 ' + H(st.node));
    if (st.node.declarations.length !== 1) fail('선언자가 여럿인 선언문이다 — 옮기지 않는다: ' + n + ' 줄 ' + H(st.node));
    const bd = iScope.getBinding(n);
    if (!bd || bd.path.node !== d) fail('선언을 IIFE 바인딩에서 찾지 못했다: ' + n);
    if (!d.init) fail('초기값이 없는 선언이다 — 옮기지 않는다: ' + n + ' 줄 ' + H(st.node));
    headTailOnly(st, '선언문 ' + n);
    if (!info.expose.length) fail('통로에 노출되지 않은 이름이다(상태 기관 대상이 아니다): ' + n);
    const ts = toks.filter(t => t.start >= st.node.start && t.end <= st.node.end), semi = ts[ts.length - 1];
    if (ts.length < 5 || ts[0].type.label !== 'var' || ts[1].type.label !== 'name' || ts[1].value !== n || ts[2].type.label !== '=' || semi.type.label !== ';' || semi.end !== st.node.end) fail('선언문이 `var X = 초기값;` 꼴이 아니다 — 옮기지 않는다: ' + n + ' 줄 ' + H(st.node));
    if (ts[0].loc.start.line !== ts[2].loc.end.line) fail('선언문의 `var X =` 가 여러 줄에 걸쳐 있다: ' + n + ' 줄 ' + H(st.node));
    if (comments.some(c => c.start >= ts[0].start && c.end <= ts[2].end)) fail('선언문의 `var X =` 사이에 주석이 있다: ' + n + ' 줄 ' + H(st.node));
    const lastIdx = Math.max(...info.expose.map(x => x.idx)), firstIdx = Math.min(...info.expose.map(x => x.idx));
    const lastKinds = new Set(); for (const x of info.expose) if (x.idx === lastIdx) for (const k of x.kinds) lastKinds.add(k);
    if (!lastKinds.has('get')) fail('마지막 노출 문에 getter 가 없다 — 옮기지 않는다: ' + n);
    api[n] = lastKinds.has('set') ? 'defineVar' : 'define'; // 마지막 노출 문(지우기 직전)에 set 이 있었는가로 정한다
    if (idx < firstIdx) { const q = quietBetween(top, idx, firstIdx); if (q) fail('선언이 첫 노출보다 앞이고 그 사이에 실행되는 문이 있다(노출 시점이 달라진다) — 옮기지 않는다: ' + n + ' 줄 ' + H(st.node) + ' · 사이의 문 ' + q); }
    const head = ORGAN + '.' + api[n] + "('" + n + "',", s8 = sample(ORGAN + '.' + api[n] + "('" + n + "', 0);");
    subs.push({ line: ts[0].loc.start.line + doc.off, c0: ts[0].loc.start.column, c1: ts[2].loc.end.column, s: ts[0].start, e: ts[2].end, text: head, sigs: s8.slice(0, s8.length - 3) });
    subs.push({ line: semi.loc.start.line + doc.off, c0: semi.loc.start.column, c1: semi.loc.end.column, s: semi.start, e: semi.end, text: ');', sigs: s8.slice(s8.length - 2) });
    rewritten.declarations.push({ name: n, line: H(st.node), endLine: HE(st.node), api: api[n] });
    for (const c of info.copies) {
      const s9 = sample(SCOPE + '.' + n + ';');
      subs.push({ line: c.rhs.loc.start.line + doc.off, c0: c.rhs.loc.start.column, c1: c.rhs.loc.end.column, s: c.rhs.start, e: c.rhs.end, text: SCOPE + '.' + n, sigs: s9.slice(0, s9.length - 1) });
      rewritten.windowCopies.push({ name: n, line: c.line });
    }
  }
  // 안전: 옮길 이름의 맨이름 참조가 지운 줄·바꿔 쓴 글자 밖에 하나라도 남으면 멈춘다
  const inSub = nd => subs.some(r => nd.start >= r.s && nd.end <= r.e);
  const remaining = [];
  for (const n of names) {
    const bd = iScope.getBinding(n), d = st8[n].decls[0].d;
    const left = bd.referencePaths.map(r => r.node).concat(bd.constantViolations.map(r => r.node)).filter(nd => !del.has(H(nd)) && !inSub(nd));
    const self = left.filter(nd => nd.start >= d.init.start && nd.end <= d.init.end);
    if (self.length) fail('초기값에 자기 이름이 나온다 — 옮기지 않는다: ' + n + ' 줄 ' + H(self[0]));
    if (left.length) remaining.push(n + '(줄 ' + [...new Set(left.map(H))].sort((x, y) => x - y).join(',') + ')');
  }
  if (remaining.length) fail('옮길 이름을 IIFE 안에서 아직 맨이름으로 쓰는 곳이 남는다 — 옮기지 않는다: ' + remaining.join(' · '));
  // 줄 글자 바꿔 쓰기(오른쪽부터)
  const edits = new Map(), byLine = new Map();
  for (const r of subs) {
    if (del.has(r.line)) fail('바꿔 쓸 줄과 지울 줄이 겹친다: ' + r.line);
    if (commaFix.has(r.line)) fail('바꿔 쓸 줄과 쉼표 떼기가 겹친다: ' + r.line);
    if (lines[r.line - 1].slice(r.c0, r.c1) !== code.slice(r.s, r.e)) fail('바꿔 쓸 글자의 줄 안 자리를 찾지 못했다: ' + r.line);
    if (!byLine.has(r.line)) byLine.set(r.line, []);
    byLine.get(r.line).push(r);
  }
  for (const [l, rs] of byLine) {
    const sorted = rs.slice().sort((p, q) => q.c0 - p.c0);
    for (let i = 1; i < sorted.length; i++) if (sorted[i].c1 > sorted[i - 1].c0) fail('바꿔 쓸 구간이 서로 겹친다: ' + l);
    let t = lines[l - 1];
    for (const r of sorted) t = t.slice(0, r.c0) + r.text + t.slice(r.c1);
    edits.set(l, t);
  }
  const nh = [];
  for (let i = 0; i < lines.length; i++) { const l = i + 1; if (del.has(l)) continue; nh.push(edits.has(l) ? edits.get(l) : commaFix.has(l) ? commaFix.get(l) : lines[i]); }
  // 사후 대조: 다시 파싱한 토큰열 = 이전 토큰열에서 지운 줄의 토큰·뗀 쉼표를 빼고, 바꿔 쓴 구간을 정해진 토큰열로 바꾼 것. 주석은 지운 줄의 것만 빠진다.
  const next = parseUnwireDoc(nh);
  const tokLine = t => t.loc.start.line + doc.off, commaTok = new Set();
  for (const l of commaFix.keys()) {
    const onLine = toks.filter(t => tokLine(t) === l), last = onLine[onLine.length - 1];
    if (!last || last.type.label !== ',') fail('쉼표를 뗀 줄의 마지막 토큰이 쉼표가 아니다: ' + l);
    commaTok.add(last);
  }
  const want = [], emitted = new Set();
  for (const t of toks) {
    if (del.has(tokLine(t)) || commaTok.has(t)) continue;
    const r = subs.find(x => t.start >= x.s && t.end <= x.e);
    if (!r) { want.push(sig(t)); continue; }
    if (!emitted.has(r)) { emitted.add(r); for (const g of r.sigs) want.push(g); }
  }
  if (emitted.size !== subs.length) fail('바꿔 쓸 구간 가운데 토큰을 찾지 못한 것이 있다 — 쓰지 않는다');
  const got = next.ast.tokens.filter(t => !isComment(t)).map(sig);
  let diffAt = want.length === got.length ? -1 : Math.min(want.length, got.length);
  for (let i = 0; i < Math.min(want.length, got.length); i++) if (want[i] !== got[i]) { diffAt = i; break; }
  if (diffAt >= 0) fail('바꿔 쓴 뒤 다시 파싱한 토큰열이 예상과 다르다(닫힌 목록 밖 글자 변화) — 쓰지 않는다: 토큰 ' + diffAt + ' 기대 ' + JSON.stringify(want[diffAt]) + ' 실제 ' + JSON.stringify(got[diffAt]));
  const wantCom = comments.filter(t => !del.has(tokLine(t))).map(t => t.value), gotCom = next.ast.tokens.filter(isComment).map(t => t.value);
  if (wantCom.length !== gotCom.length || wantCom.some((v, i) => v !== gotCom[i])) fail('바꿔 쓴 뒤 남은 주석이 예상과 다르다 — 쓰지 않는다');
  const meta = { names: [...names], api, removed, rewritten, commaFixedLines: [...commaFix.keys()], deletedLines: [...del].sort((a, b) => a - b), editedLines: [...edits.keys()].sort((a, b) => a - b), htmlLinesBefore: lines.length, htmlLinesAfter: nh.length };
  const nVar = Object.values(api).filter(v => v === 'defineVar').length;
  const log = ['unstate', '· names', names.size, '· define', names.size - nVar, '· defineVar', nVar, '· expose props', removed.exposeProps.length, '(calls', removed.exposeCalls.length + ')', '· window copies', rewritten.windowCopies.length, '· comma', commaFix.size];
  return { next, meta, log };
}

// ── [#TASK-ES-643 · docs/architecture/CELL-REGISTRY-DESIGN.md 3.4절 · 5절 닫힌 목록 X7 — 상민님 2026-10-11 「허용」, 효력 기록 지시함 DIR-004] 연속 구역 감싸기 모드(설정 "mode": "region").
// 아래는 전부 mode:"region" 경로 안에서만 돈다. 옮기기 경로(이 줄 아래)·unwire·unstate 경로의 글자는 바꾸지 않았다(이 블록을 한 자리에 끼워 넣었을 뿐 — 새 경로다. 옮기기 경로의 코드를 부르지 않는다).
// 무엇을 하는가: IIFE 최상위에서 **연달아 있는 문 여럿**(구역)을 순서 그대로 세포 함수 하나의 본문으로 옮기고, 원래 자리에 그 함수를 부르는 한 줄을, 머리 이음매 자리에 가져오기 한 줄을 남긴다.
//   옮기기 경로의 「감싸기」(4줄 이상 문 **하나**를 함수 하나로)와 산출 꼴(세포 파일 틀 · 부르는 줄 · 머리 가져오기 · 통로 getter · script 태그)이 같다. 다른 점은 셋이다:
//   ① 문 하나가 아니라 연속 구역이다(3줄 이하 문 포함 — M1a) ② 구역 안에서만 쓰는 노출 안 된 var 는 그 함수의 지역 변수가 된다(M1c — 옮기기 경로는 「IIFE 로 끌어올려지는 선언」이면 감싸지 않는다)
//   ③ window 노출 줄도 구역에 들면 함께 간다(`window.X = X;` → `window.X = L.X;` — M1d, 구역 함수가 원래 자리에서 불리므로 시점은 그대로다. 옮기기 경로는 노출 줄을 원래 자리에 둔다).
//   기관이 바꿔 쓴 `window.OurgoalAppState.define…` 줄은 글자 그대로 간다(M1b). 구역 안 주석·빈 줄은 따라간다(M1e — 첫 문의 앞 주석·빈 줄 포함. 마지막 문 뒤의 주석·빈 줄은 남는다).
// 바꾸는 글자는 이름 접두 `L.` 뿐이다(헌법 CELL_SPLIT 1호 — IIFE 스코프 이름을 통로로 읽는다. 대입하면 setter). 그 밖의 글자·문 순서는 그대로다. 단계마다 try/catch 를 넣지 않는다.
// 구역 경계는 줄 번호가 아니라 구획 주석 제목(`/* ===` 줄에 든 글자)으로 정한다: { "name", "group" [, "groupTo"] [, "from"] [, "to"] [, "headerPick"] }
//   · group 만            → 그 묶음(구획 주석 ~ 다음 구획 주석 앞)의 최상위 문 전부
//   · groupTo             → group 묶음부터 groupTo 묶음까지(연달아 있는 묶음들)
//   · from / to(문 글자 닻) → 그 범위 안에서 **글자가 이 문자열로 시작하는 최상위 문**(꼭 하나여야 한다)부터 / 까지. 묶음 안에 구역에 넣을 수 없는 문이 끼어 있을 때 그 앞뒤를 가른다.
//   구획 주석의 행방: 구역이 묶음의 첫 문에서 시작하고 그 묶음의 문이 모두 (어느) 구역에 들면 구획 주석도 따라간다. 문이 남으면 구획 주석은 index.html 에 남는다(남은 문의 묶음 이름이 그대로).
//   구역 안쪽에 든 구획 주석(뒤 묶음의 것)은 그 묶음의 문이 모두 구역에 들 때만 받는다 — 아니면 멈춘다(그 묶음에서 구역을 나눈다).
// 안전 정지(fail — index.html·세포 파일을 쓰지 않는다): 구역 안에 함수 선언 · 키트 손잡이(`var _k = window.…`) · 키트 가져오기(`var X = _k.X`) · expose 문 · 통로에 노출된 이름의 var 선언(상태 이전이 먼저) ·
//   구역 밖에서 읽거나 쓰는 var · let/const/class · 호출문·식 문·if·try·var 밖의 문 종류(for·while·switch·블록…) · 최상위 this/arguments/return · 줄 중간에서 시작하거나 끝나는 구역(앞뒤 문과 한 줄을 나눠 씀 · 경계에 걸친 주석) ·
//   머리 이음매 자리보다 앞에 있는 구역 · 서로 겹치는 구역 · 제목·닻이 하나로 정해지지 않음 · 이미 있는 이름의 구역 함수 · 이미 있는 세포 파일 · 저장소 js/** 어디에도 없는 키트(새 전역을 만들지 않는다) · 800줄을 넘는 세포 파일 ·
//   돈 근처·결심 대기 대상(`OurgoalTemplateCredit` · `OURGOAL_CONFIG` — L. 접두도 글자 변경이라 「글자 그대로 자리만」 한도 밖이다) · 설정의 모르는 칸.
// 사후 대조: 세포 파일과 새 index.html 을 다시 파싱하고, 구역 함수 본문의 토큰열에서 `L.` 접두(와 줄임 속성 `{a}` → `{a: L.a}`)만 걷어 낸 것이 이전 전 구역의 토큰열과 같은지, 주석이 그대로인지 본다. 다르면 쓰지 않고 멈춘다.
// 설정 예: { "task": "TASK-ES-6xx", "slot": "HO", "mode": "region", "label": "…",
//           "cells": [ { "key": "bootLanding", "file": "js/…/boot-landing.js", "kit": "OurgoalSettingsKit", "kitVar": "_settingsKit", "beforeTag": "<script src=\"js/tabs/settings/index.js\"></script>",
//                        "title": "…", "desc": ["…"], "regions": [ { "name": "bootLandingLinks", "group": "랜딩 페이지", "from": "window.OurgoalAppState.define('landNickQuickLink'", "to": "bindLandGuestBtn();" } ] } ] }
if (CFG.mode === 'region') { runRegion(); return; }
function runRegion() {
  const doc = parseUnwireDoc(lines);
  const { code, top, iScope } = doc, off = doc.off, eLine = off + code.split('\n').length;
  const H = n => n.loc.start.line + off, HE = n => n.loc.end.line + off;
  const ID = /^[A-Za-z_$][\w$]*$/, iife = iScope.path;
  const HOLD = ['OurgoalTemplateCredit', 'OURGOAL_CONFIG']; // 돈 근처(DIR-004 묶음 3 — 글자 그대로 자리만) · 결심 대기 — 구역에 넣지 않는다
  const isComment = t => typeof t.type === 'string';
  const toks = doc.ast.tokens.filter(t => !isComment(t) && t.type.label !== 'eof');
  const LABEL = CFG.label || '연속 구역 감싸기';

  // ── 설정 검사(모르는 칸은 멈춘다 — 오타로 목록 밖 동작이 켜지지 않게)
  for (const k of Object.keys(CFG)) if (!['task', 'label', 'slot', 'mode', 'cells', 'allowGuarded'].includes(k)) fail('region 설정에 모르는 칸: ' + k);
  // [#TASK-ES-670 · 상민님 2026-10-11 「결심 2 : 승인」] 잠긴 이름(HOLD)의 명시적 허용. 기본은 예전과 같다 — 구역에 잠긴 이름이 있으면 멈춘다.
  //   설정 맨 위에 "allowGuarded": [{ "name": "<HOLD 의 이름>", "approval": "<승인 근거 글자>" }] 를 적은 이름만 구역에 들 수 있다(조용히 풀리지 않는다 — 실행 출력과 메타에 이름·근거·구역·줄을 적는다).
  //   적지 않은 잠긴 이름은 지금처럼 멈춘다. HOLD 에 없는 이름 · 근거 글자가 없는 칸 · 겹친 이름 · 어느 구역에도 없는 이름(쓰이지 않는 허용) · 모르는 칸은 멈춘다.
  //   허용돼도 바뀌는 글자는 이름 접두 `L.` 뿐이다 — 그 문에 줄임 속성 확장(`{a}` → `{a: L.a}`)이 필요하면 멈춘다(「접두 말고는 한 글자도 바꾸지 않는다」).
  const GUARD_ALLOW = new Map();
  if (CFG.allowGuarded !== undefined) {
    if (!Array.isArray(CFG.allowGuarded) || !CFG.allowGuarded.length) fail('region 설정 allowGuarded 는 비지 않은 배열이어야 한다');
    for (const a of CFG.allowGuarded) {
      if (!a || typeof a !== 'object' || Array.isArray(a)) fail('region allowGuarded 의 칸은 객체여야 한다');
      for (const k of Object.keys(a)) if (!['name', 'approval'].includes(k)) fail('region allowGuarded 에 모르는 칸: ' + k);
      if (!HOLD.includes(a.name)) fail('region allowGuarded 의 name 은 잠긴 이름(' + HOLD.join(' · ') + ') 가운데 하나여야 한다: ' + a.name);
      if (GUARD_ALLOW.has(a.name)) fail('region allowGuarded 에 같은 이름이 두 번 있다: ' + a.name);
      if (typeof a.approval !== 'string' || a.approval.trim().length < 10 || /[\r\n]/.test(a.approval)) fail('region allowGuarded 의 approval(승인 근거 글자 — 10자 이상, 한 줄)이 없다: ' + a.name);
      GUARD_ALLOW.set(a.name, { approval: a.approval, hits: [] });
    }
  }
  if (typeof TAG !== 'string' || !/^TASK-[A-Z0-9-]+$/.test(TAG)) fail('region 설정 task 가 작업 번호가 아니다: ' + TAG);
  if (typeof CFG.slot !== 'string' || !CFG.slot) fail('region 설정 slot 이 없다');
  if (!Array.isArray(CFG.cells) || !CFG.cells.length) fail('region 설정 cells 가 비었다');
  const seenName = new Set(), seenKey = new Set(), seenFile = new Set();
  for (const c of CFG.cells) {
    if (!c || typeof c !== 'object' || Array.isArray(c)) fail('region 설정 cells 의 칸은 객체여야 한다');
    for (const k of Object.keys(c)) if (!['key', 'file', 'kit', 'kitVar', 'beforeTag', 'afterTag', 'title', 'desc', 'regions'].includes(k)) fail('region 설정 cells 에 모르는 칸: ' + k);
    if (typeof c.key !== 'string' || !ID.test(c.key) || seenKey.has(c.key)) fail('region 세포 key 가 이름이 아니거나 겹친다: ' + c.key);
    seenKey.add(c.key);
    if (typeof c.file !== 'string' || !/^js\/[A-Za-z0-9_\-./]+\.js$/.test(c.file) || c.file.includes('..') || seenFile.has(c.file)) fail('region 세포 file 이 js/ 아래 경로가 아니거나 겹친다: ' + c.file);
    seenFile.add(c.file);
    if (fs.existsSync(path.join(APP, c.file))) fail('region 세포 파일이 이미 있다(덮어쓰지 않는다): ' + c.file);
    if (typeof c.kit !== 'string' || !ID.test(c.kit)) fail('region 세포 kit 이 이름이 아니다: ' + c.kit);
    if (typeof c.kitVar !== 'string' || !ID.test(c.kitVar)) fail('region 세포 kitVar 가 이름이 아니다: ' + c.kitVar);
    if ((typeof c.beforeTag === 'string') === (typeof c.afterTag === 'string')) fail('region 세포는 beforeTag · afterTag 가운데 꼭 하나를 적는다: ' + c.key);
    if (typeof c.title !== 'string' || !c.title || !Array.isArray(c.desc) || !c.desc.length || c.desc.some(d => typeof d !== 'string')) fail('region 세포 title · desc 가 없다: ' + c.key);
    if ([c.title].concat(c.desc).some(d => d.includes('*/') || /[\r\n]/.test(d))) fail('region 세포 title · desc 에 주석을 닫는 글자나 줄바꿈이 있다: ' + c.key);
    if (!Array.isArray(c.regions) || !c.regions.length) fail('region 세포 regions 가 비었다: ' + c.key);
    for (const r of c.regions) {
      if (!r || typeof r !== 'object' || Array.isArray(r)) fail('region 구역 설정은 객체여야 한다');
      for (const k of Object.keys(r)) if (!['name', 'group', 'groupTo', 'from', 'to', 'headerPick'].includes(k)) fail('region 구역 설정에 모르는 칸: ' + k);
      if (typeof r.name !== 'string' || !ID.test(r.name)) fail('region 구역 name 이 이름이 아니다: ' + r.name);
      if (seenName.has(r.name)) fail('region 구역 name 이 겹친다: ' + r.name);
      seenName.add(r.name);
      if (iScope.hasBinding(r.name) || (iScope.hasGlobal && iScope.hasGlobal(r.name))) fail('구역 함수 이름이 이미 있다: ' + r.name);
      for (const k of ['group', 'groupTo', 'from', 'to']) if (r[k] !== undefined && (typeof r[k] !== 'string' || !r[k])) fail('region 구역 ' + k + ' 가 빈 글자다: ' + r.name);
      if (typeof r.group !== 'string') fail('region 구역 group(구획 주석 제목)이 없다: ' + r.name);
      if (r.headerPick !== undefined && r.headerPick !== 'nonEmpty') fail('region 구역 headerPick 은 nonEmpty 만 받는다: ' + r.name);
    }
  }
  // 새 전역을 만들지 않는다: 키트는 저장소 js/** 의 어느 파일엔가 이미 있어야 한다
  const jsFiles = []; (function walk(d) { fs.readdirSync(d, { withFileTypes: true }).forEach(e => { const p = path.join(d, e.name); if (e.isDirectory()) return walk(p); if (e.name.endsWith('.js')) jsFiles.push(p); }); })(path.join(APP, 'js'));
  const jsText = new Map(jsFiles.map(p => [path.relative(APP, p).replace(/\\/g, '/'), fs.readFileSync(p, 'utf8')]));
  for (const c of CFG.cells) if (![...jsText.values()].some(t => new RegExp('(?:global|window)\\.' + c.kit.replace(/\$/g, '\\$') + '\\b').test(t))) fail('키트 ' + c.kit + ' 가 저장소 js/** 어디에도 없다 — 구역 감싸기는 새 전역을 만들지 않는다');

  // ── IIFE 머리의 현재 상태(AST): 통로 getter·setter · 키트 손잡이 · 키트 가져오기
  const rootWin = n => { let x = n; while (x && x.type === 'MemberExpression' && !x.computed) x = x.object; return !!x && x.type === 'Identifier' && x.name === 'window'; };
  const isExposeCall = st => { const x = st.isExpressionStatement() && st.node.expression; return !!x && x.type === 'CallExpression' && x.callee.type === 'MemberExpression' && !x.callee.computed && x.callee.property.name === 'expose' && x.callee.object.type === 'MemberExpression' && !x.callee.object.computed && x.callee.object.property.name === 'OurgoalAppScope'; };
  const oneVar = st => (st.isVariableDeclaration() && st.node.declarations.length === 1 && st.node.declarations[0].id.type === 'Identifier') ? st.node.declarations[0] : null;
  const isHandle = st => { const d = oneVar(st); return !!d && !!d.init && d.init.type === 'MemberExpression' && rootWin(d.init); };
  const handleOf = new Map(); // 손잡이 이름 → { kit(window.<한 단계>일 때만), line }
  for (const st of top) if (isHandle(st)) { const d = oneVar(st), i = d.init; handleOf.set(d.id.name, { kit: (!i.computed && i.object.type === 'Identifier' && i.object.name === 'window') ? i.property.name : null, line: H(st.node) }); }
  const isKitImport = st => { const d = oneVar(st); return !!d && !!d.init && d.init.type === 'MemberExpression' && !d.init.computed && d.init.object.type === 'Identifier' && handleOf.has(d.init.object.name); };
  const getters = new Set(), setters = new Set();
  for (const st of top) if (isExposeCall(st)) { const o = st.node.expression.arguments[1]; if (o && o.type === 'ObjectExpression') for (const p of o.properties) if (p.type === 'ObjectMethod' && !p.computed && p.key.type === 'Identifier') { if (p.kind === 'get') getters.add(p.key.name); if (p.kind === 'set') setters.add(p.key.name); } }

  // ── 묶음 경계(옮기기 경로·지도와 같은 규칙: 구획 주석 `/* ===` 에서 다음 구획 주석 앞까지)
  const isHeader = c => c.type === 'CommentBlock' && /^\s*=+/.test(c.value);
  const headers = [];
  for (const st of top) for (const c of (st.node.leadingComments || [])) if (isHeader(c)) headers.push({ line: c.loc.start.line + off, endLine: c.loc.end.line + off, text: c.value });
  const groupEnd = h => { const i = headers.indexOf(h); return i + 1 < headers.length ? headers[i + 1].line - 1 : eLine; };
  const groupSts = h => top.filter(st => H(st.node) >= h.line && HE(st.node) <= groupEnd(h));
  const pickHeader = (title, pick, who) => {
    let hs = headers.filter(h => h.text.includes(title));
    if (hs.length > 1 && pick === 'nonEmpty') hs = hs.filter(h => groupSts(h).length > 0);
    if (hs.length !== 1) fail('구획 주석이 ' + hs.length + '개: ' + title + ' (구역 ' + who + ')');
    return hs[0];
  };
  const dirEnd = (iife.node.body.directives || []).reduce((m, d) => Math.max(m, HE(d)), H(iife.node.body));
  const text = st => code.slice(st.node.start, st.node.end);

  // ── 구역마다 문을 정한다
  const items = [];
  for (const c of CFG.cells) for (const r of c.regions) {
    const h1 = pickHeader(r.group, r.headerPick, r.name), h2 = r.groupTo ? pickHeader(r.groupTo, r.headerPick, r.name) : h1;
    if (h2.line < h1.line) fail('groupTo 묶음이 group 묶음보다 앞에 있다: ' + r.name);
    const S = top.filter(st => H(st.node) >= h1.line && HE(st.node) <= groupEnd(h2));
    if (!S.length) fail('구역에 최상위 문이 없다: ' + r.name);
    const anchor = (a, what) => { const m = S.filter(st => text(st).startsWith(a)); if (m.length !== 1) fail('구역 ' + r.name + ' 의 ' + what + ' 닻에 맞는 문이 ' + m.length + '개다(꼭 하나여야 한다): ' + a); return S.indexOf(m[0]); };
    const iFrom = r.from ? anchor(r.from, 'from') : 0, iTo = r.to ? anchor(r.to, 'to') : S.length - 1;
    if (iTo < iFrom) fail('구역 ' + r.name + ' 의 to 문이 from 문보다 앞에 있다');
    const sts = S.slice(iFrom, iTo + 1), first = sts[0], last = sts[sts.length - 1], k = top.indexOf(first);
    const prevEnd = k ? HE(top[k - 1].node) : dirEnd;
    const gh = headers.filter(h => h.line > prevEnd && h.line <= H(first.node)).pop() || null; // 첫 문 바로 앞의 구획 주석(이 문이 그 묶음의 첫 문)
    items.push({ cell: c.key, file: c.file, name: r.name, spec: r, sts, first, last, prevEnd, gh, start: H(first.node), end: HE(last.node), segStart: prevEnd + 1, locals: [], bridged: new Set(), edits: 0, headersMoved: [] });
  }
  // 문 종류 검사(닫힌 목록: 호출문·식 문 · if · try · var)
  for (const it of items) for (const st of it.sts) {
    const at = '(구역 ' + it.name + ', 줄 ' + H(st.node) + ')';
    if (st.isFunctionDeclaration()) fail('구역 안에 함수 선언이 있다 — 함수 이전이 먼저다: ' + st.node.id.name + ' ' + at);
    if (st.isVariableDeclaration()) {
      if (st.node.kind !== 'var') fail('구역 안에 ' + st.node.kind + ' 선언이 있다 ' + at);
      if (st.node.declarations.some(d => d.id.type !== 'Identifier')) fail('구역 안 var 선언이 구조 분해다 ' + at);
      if (isHandle(st)) fail('구역 안에 키트 손잡이가 있다: ' + oneVar(st).id.name + ' ' + at);
      if (isKitImport(st)) fail('구역 안에 키트 가져오기가 있다: ' + oneVar(st).id.name + ' ' + at);
    } else if (st.isExpressionStatement()) {
      if (isExposeCall(st)) fail('구역 안에 expose 문이 있다 ' + at);
    } else if (!st.isIfStatement() && !st.isTryStatement()) fail('구역에 넣을 수 없는 문 종류: ' + st.node.type + ' ' + at);
    let bad = 0;
    st.traverse({ Function(q) { if (!q.isArrowFunctionExpression()) q.skip(); }, ThisExpression() { bad++; }, Identifier(q) { if (q.node.name === 'arguments' && q.isReferencedIdentifier()) bad++; } });
    if (bad) fail('구역 안 문의 최상위에 this/arguments 가 있다 ' + at);
    st.traverse({ ReturnStatement(q) { const fp = q.getFunctionParent(); if (fp && fp.node === iife.node) fail('구역 안 문의 최상위에 return 이 있다 ' + at); } });
  }
  // 겹침 · 묶음과 구획 주석의 행방
  items.sort((a, b) => a.start - b.start);
  for (let i = 1; i < items.length; i++) if (items[i].start <= items[i - 1].end) fail('구역이 서로 겹친다: ' + items[i - 1].name + ' · ' + items[i].name);
  const covered = st => items.some(it => it.sts.includes(st));
  for (const it of items) {
    if (it.gh) { if (groupSts(it.gh).every(covered)) { it.segStart = it.gh.line; it.headersMoved.push(it.gh.line); } else it.segStart = it.gh.endLine + 1; }
    for (const h of headers) if (h !== it.gh && h.line >= it.segStart && h.line <= it.end) {
      if (!groupSts(h).every(covered)) fail('구역 ' + it.name + ' 이 묶음 중간에서 끝난다 — 그 묶음의 구획 주석(줄 ' + h.line + ')이 구역에 들었는데 그 묶음의 문이 다 들지 않았다. 그 묶음에서 구역을 나눈다');
      it.headersMoved.push(h.line);
    }
  }
  // 줄 경계: 구역은 온전한 줄들이어야 한다
  for (const it of items) {
    if (it.start <= it.prevEnd || it.segStart <= it.prevEnd) fail('구역 ' + it.name + ' 이 줄 중간에서 시작한다(앞 문과 한 줄을 나눠 쓴다): ' + it.start);
    if (toks.some(t => t.loc.start.line + off === it.start && t.start < it.first.node.start)) fail('구역 ' + it.name + ' 이 줄 중간에서 시작한다(앞 문과 한 줄을 나눠 쓴다): ' + it.start);
    if (toks.some(t => t.loc.start.line + off === it.end && t.start >= it.last.node.end)) fail('구역 ' + it.name + ' 이 줄 중간에서 끝난다(뒤 문과 한 줄을 나눠 쓴다): ' + it.end);
    for (const cm of doc.ast.comments || []) {
      const a = cm.loc.start.line + off, b = cm.loc.end.line + off;
      if ((a < it.segStart && b >= it.segStart) || (a <= it.end && b > it.end)) fail('구역 ' + it.name + ' 의 경계에 주석이 걸쳐 있다: ' + a + '~' + b);
    }
    const s0 = code.split('\n').slice(0, it.segStart - 1 - off).join('\n').length + (it.segStart - 1 - off > 0 ? 1 : 0), e0 = code.split('\n').slice(0, it.end - off).join('\n').length;
    it.c0 = s0; it.c1 = e0;
    const holdOf = t => HOLD.find(w => new RegExp('(^|[^\\w$])' + w.replace(/\$/g, '\\$') + '($|[^\\w$])').test(code.slice(t.start, t.end)));
    for (const held of toks.filter(t => t.start >= s0 && t.end <= e0 && holdOf(t))) { // [#TASK-ES-670] allowGuarded 에 적은 이름만 지나간다 — 적지 않은 이름은 예전과 같은 글자로 멈춘다
      const g = GUARD_ALLOW.get(holdOf(held));
      if (!g) fail('구역 ' + it.name + ' 에 돈 근처·결심 대기 대상이 있다 — 구역에서 뺀다: ' + code.slice(held.start, held.end) + '(줄 ' + (held.loc.start.line + off) + ')');
      const st = it.sts.find(x => x.node.start <= held.start && held.end <= x.node.end);
      const span = st ? [st.node.start, st.node.end] : [held.start, held.end], seen = g.hits.find(h => h.region === it.name && h.stmt[0] === span[0]);
      if (seen) seen.tokens++; else g.hits.push({ region: it.name, line: st ? H(st.node) : held.loc.start.line + off, stmt: span, tokens: 1 }); // 문 하나에 한 줄(그 문 안의 잠긴 낱말 수를 센다)
    }
  }
  for (const [n, g] of GUARD_ALLOW) if (!g.hits.length) fail('region allowGuarded 에 적은 이름이 어느 구역에도 없다(쓰이지 않는 허용은 적지 않는다): ' + n);
  // 구역 안에서 선언되는 IIFE 이름: 노출 안 됐고 모든 참조가 그 구역 안이면 지역 변수(M1c), 아니면 멈춘다
  const inItem = l => items.find(it => l >= it.segStart && l <= it.end) || null;
  for (const n of Object.keys(iScope.bindings).sort()) {
    const b = iScope.bindings[n], dl = H(b.path.node), it = inItem(dl);
    if (!it) continue;
    if (b.kind !== 'var') fail('구역 안에 var 가 아닌 선언이 있다: ' + n + '(' + b.kind + ', 줄 ' + dl + ', 구역 ' + it.name + ')');
    if (getters.has(n)) fail('구역 안에 통로에 노출된 이름의 var 선언이 있다 — 상태 이전(unstate)이 먼저다: ' + n + '(줄 ' + dl + ', 구역 ' + it.name + ')');
    const outs = b.referencePaths.concat(b.constantViolations).map(r => H(r.node)).filter(l => !(l >= it.segStart && l <= it.end));
    if (outs.length) fail('구역 안 var 를 구역 밖에서 읽거나 쓴다 — 지역 변수로 만들 수 없다: ' + n + '(구역 ' + it.name + ', 밖의 줄 ' + [...new Set(outs)].sort((a, b) => a - b).join(',') + ')');
    it.locals.push(n);
  }

  // ── 이름 바꿔 쓰기(구역 안): IIFE 스코프 이름 → L.<이름>. 지역이 된 이름은 그대로
  const edits = [], bridged = new Map(), shortEdits = new Set();
  for (const it of items) for (const st of it.sts) {
    st.traverse({
      Identifier(p) {
        const nm = p.node.name, par = p.parent;
        if ((p.parentPath.isMemberExpression() || p.parentPath.isOptionalMemberExpression()) && par.property === p.node && !par.computed) return;
        if (p.parentPath.isObjectProperty() && par.key === p.node && !par.computed && !par.shorthand) return;
        if (p.parentPath.isObjectMethod() && par.key === p.node && !par.computed) return;
        if (p.parentPath.isClassMethod() && par.key === p.node && !par.computed) return;
        if (p.parentPath.isLabeledStatement() || p.parentPath.isBreakStatement() || p.parentPath.isContinueStatement()) return;
        const b = p.scope.getBinding(nm);
        if (!b || b.scope !== iScope) return;
        if (it.locals.includes(nm)) return; // 이 구역의 지역 변수 — 그대로
        const isWrite = (p.parentPath.isAssignmentExpression() && par.left === p.node) || p.parentPath.isUpdateExpression() || (p.parentPath.isAssignmentPattern() && par.left === p.node) || p.parentPath.isArrayPattern() || (p.parentPath.isObjectProperty() && p.parentPath.parentPath.isObjectPattern());
        if (isWrite && b.kind === 'const') fail('const 에 대입: ' + nm);
        if (!bridged.has(nm)) bridged.set(nm, { assigned: false, kind: b.kind });
        if (isWrite) bridged.get(nm).assigned = true;
        it.bridged.add(nm);
        if (p.parentPath.isObjectProperty() && par.shorthand) { edits.push({ start: par.start, end: par.end, text: nm + ': L.' + nm }); shortEdits.add(par.start); return; }
        edits.push({ start: p.node.start, end: p.node.end, text: 'L.' + nm });
      }
    });
  }
  const seen = new Set();
  const uniq = edits.filter(e => { const k = e.start + ':' + e.end; if (seen.has(k)) return false; seen.add(k); return true; }).sort((a, b) => b.start - a.start);
  let newCode = code;
  for (const e of uniq) newCode = newCode.slice(0, e.start) + e.text + newCode.slice(e.end);
  const newLines = newCode.split('\n');
  if (newLines.length !== code.split('\n').length) fail('줄 수가 바뀜');
  const range = (a, b) => { const o = []; for (let l = a; l <= b; l++) o.push(newLines[l - 1 - off]); return o; };
  for (const it of items) it.edits = uniq.filter(e => e.start >= it.c0 && e.end <= it.c1).length;
  for (const [n, g] of GUARD_ALLOW) for (const h of g.hits) { // [#TASK-ES-670] 허용된 잠긴 이름의 문에서 바뀌는 글자는 접두 L. 뿐이어야 한다
    if ([...shortEdits].some(p => p >= h.stmt[0] && p < h.stmt[1])) fail('허용한 잠긴 이름 ' + n + ' 의 문(줄 ' + h.line + ')에 줄임 속성 확장이 필요하다 — 허용 한도는 이름 접두 L. 뿐이다. 옮기지 않는다');
    h.prefixEdits = uniq.filter(e => e.start >= h.stmt[0] && e.end <= h.stmt[1]).length;
  }

  // ── 세포 파일(옮기기 경로의 감싸기와 같은 틀: 키트에 단다 · L 통로 · 생성기 표지)
  const outFiles = {};
  for (const c of CFG.cells) {
    const its = items.filter(i => i.cell === c.key);
    const body = [];
    let prevEnd = -2;
    for (const it of its) {
      if (it.segStart !== prevEnd + 1 && body.length) body.push('');
      body.push('  /* ---- 이전 전 index.html ' + it.segStart + '~' + it.end + '줄(#' + TAG + ' 생성기 표지) ---- */');
      body.push('  function ' + it.name + '() { /* [#' + TAG + '] 로드 중 구역 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */');
      body.push(...range(it.segStart, it.end));
      body.push('  } /* ' + it.name + ' */');
      prevEnd = it.end;
    }
    outFiles[c.file] = [
      '/**',
      ' * ' + c.title,
      ' *',
      ...c.desc.map(d => ' * ' + d),
      ' * #' + TAG + '(' + LABEL + '): index.html 인라인 IIFE 의 연속 구역(이전 전 ' + its.map(i => i.segStart + '~' + i.end).join(' · ') + '줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js mode:"region")로 글자 그대로 옮겼다.',
      ' * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 구역 안에서만 쓰던 var 는 그 함수의 지역 변수가 됐다.',
      ' * 로드 중 바로 돌던 문들은 순서 그대로 함수 하나로 감싸 index.html 원래 자리에서 부른다. index.html 은 IIFE 머리에서 그 함수를 같은 이름으로 가져온다.',
      ' * 설계: docs/architecture/CELL-REGISTRY-DESIGN.md 3.4절 · 5절 · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md',
      ' */',
      '(function(global) {',
      "  'use strict';",
      '  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.',
      '  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};',
      '  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다',
      '  var K = global.' + c.kit + ' = global.' + c.kit + ' || {};',
      '',
      ...body,
      '',
      ...its.map(i => '  K.' + i.name + ' = ' + i.name + ';'),
      '',
      "  if (typeof module !== 'undefined' && module.exports) {",
      '    module.exports = K;',
      '  }',
      "})(typeof window !== 'undefined' ? window : globalThis);",
      '',
    ];
    if (outFiles[c.file].length - 1 > 800) fail('세포 파일이 800줄을 넘는다(헌법 CELL_SPLIT 7호) — 구역을 여러 세포로 나눈다: ' + c.file + ' ' + (outFiles[c.file].length - 1) + '줄');
  }

  // ── index.html 새 판: (1) 구역 → 부르는 한 줄 (2) 머리 이음매 자리에 가져오기·통로 (3) script 태그(같은 줄)
  const SLOT_RE = new RegExp('^  /\\* \\[어려움 이음매 자리 ' + CFG.slot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[ \\]]');
  const slot0 = lines.findIndex(l => SLOT_RE.test(l));
  if (slot0 < 0) fail('머리 이음매 자리 표지가 없다: ' + CFG.slot);
  let insertAt = slot0 + 1;
  while (insertAt < lines.length && !/^  \/\* \[어려움 이음매 자리 /.test(lines[insertAt]) && lines[insertAt].trim() !== '') insertAt++;
  for (const it of items) if (it.segStart < insertAt + 1) fail('구역 ' + it.name + ' 이 머리 이음매 자리보다 앞에 있다(가져오기 전에 부르게 된다): ' + it.segStart);
  let nh = lines.slice();
  const cellByKey = Object.fromEntries(CFG.cells.map(c => [c.key, c]));
  for (const it of items.slice().sort((a, b) => b.segStart - a.segStart))
    nh.splice(it.segStart - 1, it.end - it.segStart + 1, '  ' + it.name + '(); /* [#' + TAG + '] 로드 중 구역(주석·빈 줄 포함 ' + (it.end - it.segStart + 1) + '줄) → ' + it.file + ' 의 ' + it.name + ' 로 옮김 — 원래 자리에서 부른다 */');
  const head = ['  /* [#' + TAG + '] ' + CFG.cells.map(c => c.file).join(' · ') + ' — 구역 함수 가져오기 ' + items.length + '개 · 통로 노출은 스코프 분석으로 뽑았다 */'];
  const kitVarsAdded = [];
  for (const c of CFG.cells) {
    const hd = handleOf.get(c.kitVar);
    if (hd) { if (hd.kit !== c.kit) fail('키트 변수 이름이 다른 키트에 쓰였다: ' + c.kitVar); if (hd.line > insertAt) fail('키트 손잡이 ' + c.kitVar + ' 가 머리 이음매 자리보다 뒤에 있다: ' + hd.line); }
    else if (!kitVarsAdded.some(k => k.kitVar === c.kitVar && k.kit === c.kit)) {
      if (iScope.hasBinding(c.kitVar) || kitVarsAdded.some(k => k.kitVar === c.kitVar)) fail('키트 변수 이름이 이미 다른 뜻으로 쓰인다: ' + c.kitVar);
      head.push('  var ' + c.kitVar + ' = window.' + c.kit + ';'); kitVarsAdded.push({ kitVar: c.kitVar, kit: c.kit });
    }
    for (const it of items.filter(i => i.cell === c.key)) head.push('  var ' + it.name + ' = ' + c.kitVar + '.' + it.name + ';');
  }
  const exposeList = [...bridged.keys()].sort().filter(n => !getters.has(n) || (bridged.get(n).assigned && !setters.has(n)));
  if (exposeList.length) {
    head.push("  window.OurgoalAppScope.expose('index.html', {");
    exposeList.forEach((n, i) => head.push('    get ' + n + '(){ return ' + n + '; }' + (bridged.get(n).assigned ? ', set ' + n + '(v){ ' + n + ' = v; }' : '') + (i === exposeList.length - 1 ? '' : ',')));
    head.push('  });');
  }
  nh.splice(insertAt, 0, ...head);
  // 덮어쓰는 키트(유형 M): 어떤 js 파일이 global.<키트> = { … } 로 통째로 새로 대입하면 그 파일 태그 뒤(afterTag)에만 넣는다
  const overwriters = kit => [...jsText.entries()].filter(([, t]) => new RegExp('(?:global|window)\\.' + kit + '\\s*=(?!=)').test(t) && !new RegExp('(?:global|window)\\.' + kit + '\\s*=\\s*(?:global|window)\\.' + kit + '\\s*\\|\\|').test(t)).map(([f]) => f);
  const tags = [];
  for (const c of CFG.cells) {
    const tagStr = '<script src="' + c.file + '"></script>', anchorTag = c.afterTag || c.beforeTag;
    if (nh.some(l => l.includes(tagStr))) fail('세포 태그가 이미 있다: ' + c.file);
    if (!c.afterTag) { const ow = overwriters(c.kit); if (ow.length) fail('키트 ' + c.kit + ' 를 통째로 새로 대입하는 파일이 있다(' + ow.join(', ') + ') — 그 태그 뒤에 넣도록 설정에 afterTag 를 쓴다(유형 M)'); }
    const hits = nh.reduce((a, l, i) => (l.includes(anchorTag) ? a.concat(i) : a), []);
    if (hits.length !== 1) fail('태그가 ' + hits.length + '개: ' + anchorTag);
    nh[hits[0]] = c.afterTag ? nh[hits[0]].replace(c.afterTag, c.afterTag + tagStr) : nh[hits[0]].replace(c.beforeTag, tagStr + c.beforeTag);
    if (!(hits[0] < doc.off)) fail('세포 태그가 인라인 IIFE 뒤에 있다: ' + c.file);
    tags.push({ file: c.file, line: hits[0] + 1, where: c.afterTag ? 'after' : 'before' });
  }

  // ── 사후 대조: 다시 파싱 · 구역 함수 본문의 토큰열에서 L. 접두만 걷어 낸 것 == 이전 전 구역의 토큰열 · 주석 그대로
  const sig = t => (t.type.label || '') + '\u0000' + (t.value === undefined ? '' : String(t.value));
  const next = parseUnwireDoc(nh);
  for (const it of items) {
    const want = toks.filter(t => t.start >= it.c0 && t.end <= it.c1);
    const wantCom = doc.ast.tokens.filter(t => isComment(t) && t.start >= it.c0 && t.end <= it.c1).map(t => t.value);
    let got;
    try { got = parser.parse('function ' + it.name + '(){\n' + range(it.segStart, it.end).join('\n') + '\n}', { sourceType: 'script', tokens: true, strictMode: true }).tokens; }
    catch (err) { fail('구역 함수 본문이 파싱되지 않는다 — 쓰지 않는다: ' + it.name + ' — ' + err.message); }
    const gotCom = got.filter(isComment).map(t => t.value);
    got = got.filter(t => !isComment(t) && t.type.label !== 'eof').slice(5, -1); // function 이름 ( ) { … }
    const isL = (j, nm) => got[j] && got[j].type.label === 'name' && got[j].value === 'L' && got[j + 1] && got[j + 1].type.label === '.' && got[j + 2] && got[j + 2].type.label === 'name' && got[j + 2].value === nm;
    let j = 0, prefixes = 0;
    for (let i = 0; i < want.length; i++) {
      const w = want[i], nm = w.type.label === 'name' ? w.value : null;
      if (nm !== null && it.bridged.has(nm) && isL(j, nm)) { j += 3; prefixes++; continue; }
      if (!got[j] || sig(got[j]) !== sig(w)) fail('구역 함수 본문의 토큰열이 예상과 다르다(닫힌 목록 밖 글자 변화) — 쓰지 않는다: ' + it.name + ' 토큰 ' + i + ' 기대 ' + JSON.stringify(sig(w)) + ' 실제 ' + JSON.stringify(got[j] ? sig(got[j]) : null));
      j++;
      if (nm !== null && shortEdits.has(w.start) && got[j] && got[j].type.label === ':' && isL(j + 1, nm)) { j += 4; prefixes++; } // 줄임 속성 {a} → {a: L.a}
    }
    if (j !== got.length) fail('구역 함수 본문에 예상 밖의 토큰이 더 있다 — 쓰지 않는다: ' + it.name);
    if (prefixes !== it.edits) fail('구역 함수 본문의 L. 접두 수(' + prefixes + ')가 바꿔 쓴 자리 수(' + it.edits + ')와 다르다 — 쓰지 않는다: ' + it.name);
    if (wantCom.length !== gotCom.length || wantCom.some((v, x) => v !== gotCom[x])) fail('구역 함수 본문의 주석이 이전 전과 다르다 — 쓰지 않는다: ' + it.name);
  }
  for (const [f, arr] of Object.entries(outFiles)) { try { parser.parse(arr.join('\n'), { sourceType: 'script' }); } catch (err) { fail('세포 파일이 파싱되지 않는다 — 쓰지 않는다: ' + f + ' — ' + err.message); } }
  // 새 index.html 의 IIFE 토큰열 = 이전 토큰열 − 구역 토큰 + 부르는 줄(이름 ( ) ;) + 머리 줄 토큰
  {
    const headToks = parser.parse(head.join('\n'), { sourceType: 'script', tokens: true }).tokens.filter(t => !isComment(t) && t.type.label !== 'eof').map(sig);
    const callSig = nm => [{ type: { label: 'name' }, value: nm }, { type: { label: '(' } }, { type: { label: ')' } }, { type: { label: ';' } }].map(sig);
    const insertOff = code.split('\n').slice(0, insertAt - off).join('\n').length;
    const want = [];
    let headDone = false; const done = new Set();
    for (const t of toks) {
      if (!headDone && t.start > insertOff) { want.push(...headToks); headDone = true; }
      const it = items.find(x => t.start >= x.c0 && t.end <= x.c1);
      if (it) { if (!done.has(it)) { done.add(it); want.push(...callSig(it.name)); } continue; }
      want.push(sig(t));
    }
    const got = next.ast.tokens.filter(t => !isComment(t) && t.type.label !== 'eof').map(sig);
    let diffAt = want.length === got.length ? -1 : Math.min(want.length, got.length);
    for (let i = 0; i < Math.min(want.length, got.length); i++) if (want[i] !== got[i]) { diffAt = i; break; }
    if (diffAt >= 0) fail('새 index.html 의 토큰열이 예상과 다르다(닫힌 목록 밖 글자 변화) — 쓰지 않는다: 토큰 ' + diffAt + ' 기대 ' + JSON.stringify(want[diffAt]) + ' 실제 ' + JSON.stringify(got[diffAt]));
  }

  fs.writeFileSync(path.join(APP, 'index.html'), nh.join(EOL), 'utf8');
  for (const [f, arr] of Object.entries(outFiles)) { fs.mkdirSync(path.dirname(path.join(APP, f)), { recursive: true }); fs.writeFileSync(path.join(APP, f), arr.join('\n'), 'utf8'); }
  const kindOf = st => st.isVariableDeclaration() ? 'var' : st.isIfStatement() ? 'if' : st.isTryStatement() ? 'try' : (st.node.expression.type === 'CallExpression' ? 'call' : 'expr');
  const meta = {
    task: TAG, mode: 'region', slot: CFG.slot, scriptHtmlLines: [doc.off + 1, eLine],
    regions: items.map(it => ({ cell: it.cell, file: it.file, name: it.name, group: it.spec.group, groupTo: it.spec.groupTo || null, from: it.spec.from || null, to: it.spec.to || null,
      segment: [it.segStart, it.end], lines: it.end - it.segStart + 1, stmt: [it.start, it.end], statements: it.sts.map(st => ({ line: H(st.node), endLine: HE(st.node), kind: kindOf(st) })),
      headersMoved: it.headersMoved, locals: it.locals, bridged: [...it.bridged].sort(), edits: it.edits })),
    imports: items.map(it => ({ n: it.name, cell: it.cell })), kitVarsAdded,
    bridged: [...bridged.keys()].sort().map(n => ({ n, assigned: bridged.get(n).assigned, kind: bridged.get(n).kind, exposedBefore: getters.has(n), setterBefore: setters.has(n) })), exposed: exposeList,
    head: { insertAfterLine: insertAt, lines: head.length }, tags, edits: uniq.length,
    htmlLinesBefore: lines.length, htmlLinesAfter: nh.length,
    files: Object.fromEntries(Object.entries(outFiles).map(([f, a]) => [f, a.length - 1])),
  };
  if (GUARD_ALLOW.size) meta.guardedAllowed = [...GUARD_ALLOW].map(([n, g]) => ({ name: n, approval: g.approval, hits: g.hits.map(h => ({ region: h.region, line: h.line, guardedWords: h.tokens, prefixEdits: h.prefixEdits })) })); // [#TASK-ES-670] 허용한 잠긴 이름 — 해당이 있을 때만 생기는 칸
  fs.writeFileSync(path.join(process.env.MODULE_SPLIT_OUT || require('os').tmpdir(), 'gen-inline-hard-meta.json'), JSON.stringify(meta, null, 1), 'utf8');
  console.log('region', '· regions', items.length, '· statements', items.reduce((a, it) => a + it.sts.length, 0), '· lines', items.reduce((a, it) => a + it.end - it.segStart + 1, 0), '· locals', items.reduce((a, it) => a + it.locals.length, 0), '· edits', uniq.length, '· bridged', bridged.size, '· exposed', exposeList.length, '· imports', items.length);
  for (const it of items) console.log('  region', it.name, it.segStart + '~' + it.end, '→', it.file);
  for (const [n, g] of GUARD_ALLOW) for (const h of g.hits) console.log('  guarded', n, '— 구역 ' + h.region + '(문 줄 ' + h.line + ' · 잠긴 낱말 ' + h.tokens + '개) · 접두 ' + h.prefixEdits + '곳 · 승인 근거: ' + g.approval); // [#TASK-ES-670]
  console.log('index.html lines', lines.length, '->', nh.length);
  for (const [f, a] of Object.entries(outFiles)) console.log(f, a.length - 1);
}

// smoke-test FN_NAMES(시험지가 인라인에서 함수를 잘라 실행) — 옮기지 않는다(MODULE-SPLIT-PROTOCOL 1절 (라), 유형 F2)
const smokeFn = (() => { const s = fs.readFileSync(path.join(APP, 'scripts', 'smoke-test.js'), 'utf8'); const m = s.match(/const FN_NAMES = \[([\s\S]*?)\];/); if (!m) fail('smoke-test FN_NAMES 못 읽음'); return new Set((m[1].match(/'([^']+)'/g) || []).map(x => x.slice(1, -1))); })();

// #TASK-ES-465: smoke-test 가 함수를 잘라 오는 원본에 인라인 합본(tests/helpers/inline-bundle.js — js/tabs/** app-scope 세포 + js/core/*.js 중 생성기 표지를 담은 파일)을 붙이면
// FN_NAMES 함수도 그 자리 세포로 옮길 수 있다(시험지가 같은 함수를 세포 글자에서 찾는다). 그 밖의 경로는 여전히 멈춘다.
const smokeUsesBundle = /inline-bundle/.test(fs.readFileSync(path.join(APP, 'scripts', 'smoke-test.js'), 'utf8'));
const bundleCoversCore = (() => { try { return /coreMovedCellFiles/.test(fs.readFileSync(path.join(APP, 'tests', 'helpers', 'inline-bundle.js'), 'utf8')); } catch (e) { return false; } })();
const smokeReadsCell = file => smokeUsesBundle && (file.startsWith('js/tabs/') || (bundleCoversCore && /^js\/core\/[^/]+\.js$/.test(file)));

// ── 묶음 경계(지도와 같은 규칙: 구획 주석 `/* ===` 에서 다음 구획 주석 앞까지)
const isHeader = c => c.type === 'CommentBlock' && /^\s*=+/.test(c.value);
const headers = [];
for (const st of top) for (const c of (st.node.leadingComments || [])) if (isHeader(c)) headers.push({ line: c.loc.start.line + off, endLine: c.loc.end.line + off, text: c.value, stmt: st });
const groupRange = (title, pick) => {
  let hs = headers.filter(h => h.text.includes(title));
  // [#TASK-ES-483] 설정 take.headerPick: 'nonEmpty' — 같은 글자의 구획 주석이 여럿이면(예: 「참고자료」 구획 주석이 두 줄 연달아) 최상위 문을 담은 것 하나만 고른다. 표시가 없으면 이전과 같이 멈춘다.
  if (hs.length > 1 && pick === 'nonEmpty') {
    const endOf = h => { const i = headers.indexOf(h); return i + 1 < headers.length ? headers[i + 1].line - 1 : eLine; };
    hs = hs.filter(h => top.some(st => H(st.node) >= h.line && HE(st.node) <= endOf(h)));
  }
  if (hs.length !== 1) fail('구획 주석이 ' + hs.length + '개: ' + title);
  const i = headers.indexOf(hs[0]);
  return { start: hs[0].line, hEnd: hs[0].endLine, end: i + 1 < headers.length ? headers[i + 1].line - 1 : eLine };
};

// ── 최상위 문 분류
const isPureInit = node => {
  if (!node) return true;
  let pure = true;
  const walk = n => {
    if (!pure || !n || typeof n !== 'object') return;
    if (Array.isArray(n)) return n.forEach(walk);
    switch (n.type) {
      case 'StringLiteral': case 'NumericLiteral': case 'BooleanLiteral': case 'NullLiteral': case 'RegExpLiteral': case 'TemplateElement': return;
      case 'FunctionExpression': case 'ArrowFunctionExpression': return; // 본문은 부를 때 돈다
      case 'ObjectExpression': return n.properties.forEach(p => { if (p.type !== 'ObjectProperty' || p.computed) { if (p.type === 'ObjectMethod' && !p.computed) return; pure = false; return; } walk(p.value); });
      case 'ArrayExpression': return n.elements.forEach(walk);
      case 'TemplateLiteral': return n.expressions.length ? (pure = false) : undefined;
      case 'UnaryExpression': return n.operator === '-' ? walk(n.argument) : (pure = false);
      default: pure = false;
    }
  };
  walk(node);
  return pure;
};
const topThisArgs = p => {
  let bad = 0;
  p.traverse({ Function(q) { if (!q.isArrowFunctionExpression()) q.skip(); }, ThisExpression() { bad++; }, Identifier(q) { if (q.node.name === 'arguments' && q.isReferencedIdentifier()) bad++; } });
  return bad;
};
// [#TASK-ES-657 · 헌법 v2026.10.11-ARGUMENTS CELL_SPLIT 5호(PR #925)] 함수 선언(`function 이름(…) { … }`)을 선언째로 옮길 때만 쓰는 검사.
//   · thisN     — 그 함수 자신의 층(화살표 함수 안 포함)에 있는 `this` 수. 0 이어야 옮긴다(예전과 같다).
//   · argsOwn   — 그 함수 자신의 본문에서 쓰는 `arguments`(가장 가까운 함수 부모가 그 선언 자신). 그 함수 자신의 호출 인자를 가리켜 옮겨도 뜻이 같다 → 허용.
//   · argsArrow — 그 함수 안의 화살표 함수 안에 있는 `arguments`. 0 이어야 옮긴다(조문이 「그대로 0」으로 둔 꼴 — 좁게 읽어 예전처럼 멈춘다).
//   안쪽의 보통 함수(식·선언)는 자기 this·arguments 를 가지므로 들어가지 않는다(예전과 같다).
//   감싸기로 옮기는 로드 중 문(wrapSafe) · var 에 담긴 함수식(movable 판정)은 이 함수를 쓰지 않는다 — 위 topThisArgs 그대로다.
const fnDeclThisArgs = st => {
  const own = st.node, k = { thisN: 0, argsOwn: 0, argsArrow: 0 };
  st.get('body').traverse({
    Function(q) { if (!q.isArrowFunctionExpression()) q.skip(); },
    ThisExpression() { k.thisN++; },
    Identifier(q) { if (q.node.name !== 'arguments' || !q.isReferencedIdentifier()) return; const f = q.getFunctionParent(); if (f && f.node === own) k.argsOwn++; else k.argsArrow++; },
  });
  return k;
};
const wrapSafe = st => {
  const why = [];
  for (const [n, b] of Object.entries(iScope.bindings)) { const l = H(b.path.node); if (l >= H(st.node) && l <= HE(st.node)) why.push('IIFE 로 끌어올려지는 선언 ' + n); }
  if (topThisArgs(st)) why.push('최상위 this/arguments');
  st.traverse({ ReturnStatement(q) { if (q.getFunctionParent() === iife) why.push('최상위 return'); } });
  return why;
};

// #TASK-ES-465: `if(typeof window !== 'undefined'){ window.a = a; window.b = c; }` 처럼 몸통이 window 속성 대입뿐인 if 문(else 없음)은 노출 묶음이다 → 원래 자리
const isWindowAssign = x => x && x.type === 'AssignmentExpression' && x.operator === '=' && x.left.type === 'MemberExpression' && x.left.object.type === 'Identifier' && x.left.object.name === 'window' && (x.right.type !== 'AssignmentExpression' || isWindowAssign(x.right));
const isWindowExposureBlock = n => n.type === 'IfStatement' && !n.alternate && n.consequent.type === 'BlockStatement' && n.consequent.body.length > 0
  && n.consequent.body.every(b => b.type === 'ExpressionStatement' && (isWindowAssign(b.expression) || (b.expression.type === 'SequenceExpression' && b.expression.expressions.every(isWindowAssign))));
const cellByKey =Object.fromEntries(CFG.cells.map(c => [c.key, c]));
const plan = []; // { cell, action: move|wrap|keep, st, start, end, segStart, names, wrapName, why }
for (const c of CFG.cells) {
  for (const t of c.take) {
    const r = groupRange(t.group, t.headerPick);
    const sts = top.filter(s => H(s.node) >= r.start && HE(s.node) <= r.end);
    let wrapK = 0;
    sts.forEach((st, k) => {
      const prevEnd = k ? HE(sts[k - 1].node) : r.start - 1;
      const sharesPrevLine = !!(k && H(st.node) === prevEnd); // #TASK-ES-482: 한 줄에 두 문 — 둘 다 원래 자리에 남으면 문제없다(옮기는 문에 걸릴 때만 아래에서 멈춘다)
      const tail = lines[HE(st.node) - 1].slice(st.node.loc.end.column).trim();
      const tailCode = !!(tail && !tail.startsWith('//'));
      // 앞 주석·빈 줄은 그 문을 따라간다(묶음 첫 문은 구획 주석부터)
      const item = { cell: c.key, group: t.group, hEnd: r.hEnd, gStart: r.start, gEnd: r.end, st, start: H(st.node), end: HE(st.node), segStart: k ? prevEnd + 1 : r.start, names: [], sharesPrevLine, tailCode, preserveWindowSuffix: t.preserveWindowSuffix === true };
      const mine = n => t.all || (t.names || []).includes(n);
      if (st.isFunctionDeclaration()) {
        const n = st.node.id.name; item.names = [n];
        if (!mine(n)) { item.action = t.keepRest ? 'keep' : 'skip'; if (t.keepRest) { item.why = '이번 범위 밖(keepRest) — 원래 자리'; item.keepRestOnly = true; } return plan.push(item); }
        const b = iScope.getBinding(n);
        if (smokeFn.has(n) && !smokeReadsCell(c.file)) fail('smoke-test FN_NAMES 함수 — 시험지 선행 PR 이 먼저(유형 F2): ' + n);
        if (b.constantViolations.length) fail('함수 이름 재대입(유형 H) — 개별 설계: ' + n);
        { const k = fnDeclThisArgs(st); if (k.thisN || k.argsArrow) fail('최상위 this/arguments(유형 K) — 옮기지 않는다: ' + n); if (k.argsOwn) item.ownArguments = k.argsOwn; } // [#TASK-ES-657] 함수 선언 자신의 arguments 만 허용(헌법 CELL_SPLIT 5호)
        item.action = 'move';
      } else if (st.isVariableDeclaration()) {
        item.names = st.node.declarations.map(d => d.id.name);
        const movable = st.node.declarations.every(d => d.id.type === 'Identifier' && iScope.getBinding(d.id.name).constantViolations.length === 0 && isPureInit(d.init) && (!smokeFn.has(d.id.name) || smokeReadsCell(c.file)))
          && st.node.declarations.every(d => !d.init || !/Function|Arrow/.test(d.init.type) || topThisArgs(st) === 0);
        if (!item.names.some(mine)) { item.action = t.keepRest ? 'keep' : 'skip'; if (t.keepRest) { item.why = '이번 범위 밖(keepRest) — 원래 자리'; item.keepRestOnly = true; } return plan.push(item); }
        if (!item.names.every(mine)) fail('한 var 문의 이름을 일부만 가져감: ' + item.names.join(','));
        item.action = movable ? 'move' : 'keep';
        if (item.action === 'keep') item.why = '상태 변수(재대입 또는 실행되는 초기값) — 원래 자리에 두고 L getter/setter 로 읽는다';
      } else if (st.isClassDeclaration()) {
        item.names = [st.node.id.name]; item.action = 'keep'; item.why = 'class 선언은 이번 틀 밖';
      } else {
        const e = st.isExpressionStatement() && st.node.expression;
        const lineCount = HE(st.node) - H(st.node) + 1;
        if (e && e.type === 'AssignmentExpression' && e.left.type === 'MemberExpression' && e.left.object.type === 'Identifier' && e.left.object.name === 'window' && lineCount <= 3) { item.action = 'keep'; item.why = 'window 노출 — 원래 자리(순서 보존)'; }
        else if (isWindowExposureBlock(st.node)) { item.action = 'keep'; item.why = 'window 노출 묶음(if 안 window.X = … 만) — 원래 자리(순서 보존, #TASK-ES-465)'; }
        else if (!t.all && !(t.wrap || []).length) { item.action = t.keepRest ? 'keep' : 'skip'; if (t.keepRest) { item.why = '이번 범위 밖(keepRest) — 원래 자리'; item.keepRestOnly = true; } }
        else if (lineCount <= 3) { item.action = 'keep'; item.why = '3줄 이하 로드 중 문 — 원래 자리'; }
        else {
          const why = wrapSafe(st);
          if (why.length) { item.action = 'keep'; item.why = '감쌀 수 없음: ' + why.join(', '); }
          else {
            const wn = (t.wrap || [])[wrapK++];
            if (!wn) fail('감쌀 로드 중 문에 이름이 없다(설정 wrap): ' + H(st.node) + '~' + HE(st.node));
            if (iScope.hasBinding(wn) || iScope.hasGlobal && iScope.hasGlobal(wn)) fail('감쌀 함수 이름이 이미 있다: ' + wn);
            item.action = 'wrap'; item.wrapName = wn; item.names = [wn];
          }
        }
      }
      plan.push(item);
    });
    if ((t.wrap || []).length !== wrapK) fail('설정 wrap 이름 수(' + (t.wrap || []).length + ')와 감싼 문 수(' + wrapK + ')가 다르다: ' + t.group);
  }
}
// #TASK-ES-573: 명시 opt-in인 여러 줄 함수의 닫는 } 뒤 window.같은이름=같은함수; 한 문장만 원문 끝 열로 자른다.
// 일반 같은 줄 코드·계산 프로퍼티·연쇄 대입·한 줄 함수는 기존 차단을 유지한다. suffix는 원래 자리의 원문 그대로 남는다.
const windowSuffixEnd = it => {
  if (!it.preserveWindowSuffix || !it.st.isFunctionDeclaration() || it.start === it.end || iScope.hasOwnBinding('window')) return null;
  const n = it.st.node.id.name, col = it.st.node.loc.end.column;
  if (!/^[A-Za-z_$][\w$]*$/.test(n) || lines[it.end - 1].slice(0, col).trim() !== '}') return null;
  const nx = top[top.indexOf(it.st) + 1], e = nx && nx.isExpressionStatement() && nx.node.expression;
  if (!nx || H(nx.node) !== it.end || HE(nx.node) !== it.end || !plan.some(x => x.st === nx && x.action === 'keep')) return null;
  if (!e || e.type !== 'AssignmentExpression' || e.operator !== '=' || e.left.type !== 'MemberExpression' || e.left.computed || e.left.object.type !== 'Identifier' || e.left.object.name !== 'window' || e.left.property.name !== n || e.right.type !== 'Identifier' || e.right.name !== n) return null;
  if (!new RegExp('^[ \\t]+window\\.' + n.replace(/\$/g, '\\$') + '[ \\t]*=[ \\t]*' + n.replace(/\$/g, '\\$') + '[ \\t]*;[ \\t]*(?://.*)?$').test(lines[it.end - 1].slice(col))) return null;
  let count = 0; traverse(ast, { AssignmentExpression(p) { const l = p.node.left; if (l.type === 'MemberExpression' && l.object.type === 'Identifier' && l.object.name === 'window' && ((!l.computed && l.property.name === n) || (l.computed && l.property.type === 'StringLiteral' && l.property.value === n))) count++; } });
  if (count !== 1) return null;
  return col;
};
// #TASK-ES-482: 한 줄을 나눠 쓰는 문은 기본적으로 옮기거나 감쌀 수 없다. #573의 좁은 함수 끝 범위만 예외다.
for (const it of plan) {
  const out = it.action === 'move' || it.action === 'wrap';
  if (out && it.sharesPrevLine) fail('두 문이 한 줄에: ' + it.start);
  if (out && it.tailCode) { const col = windowSuffixEnd(it); if (col === null) fail('문 끝 줄 뒤에 다른 코드: ' + it.end); it.sourceEndColumn = col; }
  if (it.tailCode) { const nx = plan.find(x => x !== it && x.start === it.end && x.sharesPrevLine && (x.action === 'move' || x.action === 'wrap')); if (nx) fail('두 문이 한 줄에: ' + nx.start); }
}
// 같은 문을 두 세포가 가져가면 안 된다 · skip 은 다른 세포가 가져가야 한다
const byStart = new Map();
for (const it of plan) { const k = it.start; if (!byStart.has(k)) byStart.set(k, []); byStart.get(k).push(it); }
const finalPlan = [];
for (const [, its] of [...byStart].sort((a, b) => a[0] - b[0])) {
  const out = its.filter(i => i.action === 'move' || i.action === 'wrap');
  if (out.length > 1) fail('같은 문을 두 세포가 가져감: ' + its[0].start);
  // #TASK-ES-482: 한 묶음을 여러 세포가 이름으로 나눠 가질 때, 다른 세포의 keepRest(「이번 범위 밖」) 남김은 그 문을 옮기는 세포에 양보한다. 그 밖의 남김(상태 변수·노출 문 등)과 겹치면 멈춘다
  if (out.length && its.some(i => i.action === 'keep' && !(i.keepRestOnly))) fail('한 세포는 옮기고 다른 세포는 남김: ' + its[0].start);
  const real = out.length ? out : its.filter(i => i.action === 'keep').slice(0, 1);
  if (!real.length) { const s = its[0]; fail('어느 세포도 가져가지 않는 문(names 에 빠짐): ' + s.start + ' ' + (s.names.join(',') || s.st.node.type)); }
  finalPlan.push(real[0]);
}
// 묶음에 원래 자리에 남는 문이 있으면 구획 주석은 index.html 에 남긴다(지도의 묶음 이름·경계가 그대로 — 남은 문이 앞 묶음에 붙지 않는다)
for (const it of finalPlan) {
  if (it.segStart !== it.gStart || it.action === 'keep') continue;
  if (finalPlan.some(x => x.action === 'keep' && x.start >= it.gStart && x.end <= it.gEnd)) it.segStart = it.hEnd + 1;
}
const moved = finalPlan.filter(i => i.action === 'move');
const wrapped = finalPlan.filter(i => i.action === 'wrap');
const kept = finalPlan.filter(i => i.action === 'keep');
const MOVED_NAMES = new Set(moved.flatMap(i => i.names));
const CELL_OF = new Map(moved.flatMap(i => i.names.map(n => [n, i.cell])));
const outPieces = finalPlan.filter(i => i.action !== 'keep');
const cellOfLine = l => { const it = outPieces.find(x => l >= x.segStart && l <= x.end); return it ? it.cell : null; };

// ── 이름 바꿔 쓰기(옮기는 문·감싸는 문 안)
const edits = []; const bridged = new Map();
for (const it of outPieces) {
  it.st.traverse({
    Identifier(p) {
      const nm = p.node.name, par = p.parent;
      if ((p.parentPath.isMemberExpression() || p.parentPath.isOptionalMemberExpression()) && par.property === p.node && !par.computed) return;
      if (p.parentPath.isObjectProperty() && par.key === p.node && !par.computed && !par.shorthand) return;
      if (p.parentPath.isObjectMethod() && par.key === p.node && !par.computed) return;
      if (p.parentPath.isClassMethod() && par.key === p.node && !par.computed) return;
      if (p.parentPath.isLabeledStatement() || p.parentPath.isBreakStatement() || p.parentPath.isContinueStatement()) return;
      const b = p.scope.getBinding(nm);
      if (!b || b.scope !== iScope) return;
      const here = it.cell;
      if (MOVED_NAMES.has(nm) && CELL_OF.get(nm) === here) return; // 같은 세포 안 — 그대로
      if (it.action === 'move' && it.names.includes(nm) && (p.parentPath.isFunctionDeclaration() || p.parentPath.isVariableDeclarator()) && par.id === p.node) return;
      const isWrite = (p.parentPath.isAssignmentExpression() && par.left === p.node) || p.parentPath.isUpdateExpression() || (p.parentPath.isAssignmentPattern() && par.left === p.node) || p.parentPath.isArrayPattern() || (p.parentPath.isObjectProperty() && p.parentPath.parentPath.isObjectPattern());
      if (isWrite && b.kind === 'const') fail('const 에 대입: ' + nm);
      if (!bridged.has(nm)) bridged.set(nm, { assigned: false, kind: b.kind });
      if (isWrite) bridged.get(nm).assigned = true;
      if (p.parentPath.isObjectProperty() && par.shorthand) { edits.push({ start: par.start, end: par.end, text: nm + ': L.' + nm }); return; }
      edits.push({ start: p.node.start, end: p.node.end, text: 'L.' + nm });
    }
  });
}
const seen = new Set();
const uniq = edits.filter(e => { const k = e.start + ':' + e.end; if (seen.has(k)) return false; seen.add(k); return true; }).sort((a, b) => b.start - a.start);
let newCode = code;
for (const e of uniq) newCode = newCode.slice(0, e.start) + e.text + newCode.slice(e.end);
const newLines = newCode.split('\n');
if (newLines.length !== code.split('\n').length) fail('줄 수가 바뀜');
const NL = l => newLines[l - 1 - off];
const range = (a, b) => { const o = []; for (let l = a; l <= b; l++) o.push(NL(l)); return o; };

// ── 세포 파일
const outFiles = {};
for (const c of CFG.cells) {
  const its = outPieces.filter(i => i.cell === c.key).sort((a, b) => a.segStart - b.segStart);
  if (!its.length) continue;
  const body = [];
  let prevEnd = -2;
  for (const it of its) {
    if (it.segStart !== prevEnd + 1 && body.length) body.push('');
    body.push('  /* ---- 이전 전 index.html ' + it.segStart + '~' + it.end + '줄(#' + TAG + ' 생성기 표지) ---- */');
    if (it.sourceEndColumn != null) body.push('  /* 원문 AST 끝 ' + it.end + ':' + it.sourceEndColumn + ' · ' + it.names[0] + ' · 같은 줄 window 노출 보존 */');
    if (it.action === 'wrap') {
      body.push('  function ' + it.wrapName + '() { /* [#' + TAG + '] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */');
      body.push(...range(it.segStart, it.end));
      body.push('  } /* ' + it.wrapName + ' */');
    } else { const segment = range(it.segStart, it.end); if (it.sourceEndColumn != null) segment[segment.length - 1] = segment[segment.length - 1].slice(0, it.sourceEndColumn); body.push(...segment); }
    prevEnd = it.end;
  }
  const exportNames = its.flatMap(i => i.names);
  const pieces = its.map(i => i.segStart + '~' + i.end).join(' · ');
  outFiles[c.file] = [
    '/**',
    ' * ' + c.title,
    ' *',
    ...c.desc.map(d => ' * ' + d),
    ' * #' + TAG + '(' + (CFG.label || '인라인 어려움 묶음 시범') + '): index.html 인라인 IIFE 의 구간(이전 전 ' + pieces + '줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.',
    ' * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.',
    ' * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.',
    ' * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md',
    ' */',
    '(function(global) {',
    "  'use strict';",
    '  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.',
    '  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};',
    '  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다',
    '  var K = global.' + c.kit + ' = global.' + c.kit + ' || {};',
    '',
    ...body,
    '',
    ...exportNames.map(n => '  K.' + n + ' = ' + n + ';'),
    '',
    "  if (typeof module !== 'undefined' && module.exports) {",
    '    module.exports = K;',
    '  }',
    "})(typeof window !== 'undefined' ? window : globalThis);",
    '',
  ];
}

// ── index.html 새 판
let nh = lines.slice();
// (1) 묶음 자리: 옮긴 연속 구간 → 표지 한 줄, 감싼 문 → 부르는 한 줄, 남긴 문 → 그대로
const repl = [];
{
  const sorted = finalPlan.slice().sort((a, b) => a.segStart - b.segStart);
  let run = null;
  const flush = () => { if (run) { repl.push(run); run = null; } };
  for (const it of sorted) {
    if (it.action === 'move') {
      if (run && run.kind === 'move' && run.cell === it.cell && run.end + 1 === it.segStart && run.sourceEndColumn == null && it.sourceEndColumn == null) { run.end = it.end; run.names.push(...it.names); }
      else { flush(); run = { kind: 'move', cell: it.cell, segStart: it.segStart, end: it.end, names: it.names.slice(), sourceEndColumn: it.sourceEndColumn }; }
    } else if (it.action === 'wrap') { flush(); repl.push({ kind: 'wrap', cell: it.cell, segStart: it.segStart, end: it.end, names: [it.wrapName] }); }
    else flush();
  }
  flush();
}
for (const r of repl.slice().sort((a, b) => b.segStart - a.segStart)) {
  const file = cellByKey[r.cell].file;
  const line = r.kind === 'move'
    ? '  /* [#' + TAG + '] ' + r.names.join(' · ') + ' → ' + file + ' 로 옮김(' + (CFG.label || '인라인 어려움 묶음 시범') + ' — 앞 주석 포함) */'
    : '  ' + r.names[0] + '(); /* [#' + TAG + '] 로드 중 문(앞 주석 포함) → ' + file + ' 의 ' + r.names[0] + ' 로 옮김 — 원래 자리에서 부른다 */';
  nh.splice(r.segStart - 1, r.end - r.segStart + 1, line + (r.sourceEndColumn == null ? '' : lines[r.end - 1].slice(r.sourceEndColumn)));
}
// (2) 머리 이음매: 구역 자리 표지 아래(없으면 #TASK-ES-423 이음매 다음에 자리 표지 묶음을 만든다)
const usIdx = nh.findIndex((l, i) => i > sLine - 1 && l.includes('"use strict";'));
const SLOT_RE = s => new RegExp('^  /\\* \\[어려움 이음매 자리 ' + s + '[ \\]]');
// [#TASK-ES-524] 설정 newSlotBefore: 자리 묶음이 이미 있는데 이 구역 자리 표지가 없으면, 그 이름의 자리 표지 바로 앞에 이 구역 자리 표지 한 줄만 새로 둔다
// (인라인 3단계 병렬 구역 — 다른 빌더가 쓰는 자리와 다른 줄이라 머리에서 병합 충돌이 나지 않는다. 주석 한 줄이라 토큰 0).
if (CFG.newSlotBefore && !nh.some(l => SLOT_RE(CFG.slot).test(l))) {
  const b = nh.findIndex(l => SLOT_RE(CFG.newSlotBefore).test(l));
  if (b < 0) fail('newSlotBefore 자리 표지 없음: ' + CFG.newSlotBefore);
  nh.splice(b, 0, '  /* [어려움 이음매 자리 ' + CFG.slot + '] */');
}
if (!nh.some(l => SLOT_RE(CFG.slot).test(l))) {
  const a = nh.findIndex(l => l.includes('[#TASK-ES-423] 인라인 스크립트 세포화 1차 이음매'));
  if (a < 0) fail('1차 이음매(#TASK-ES-423) 없음');
  let aEnd = -1; for (let i = a; i < nh.length; i++) if (nh[i] === '  });') { aEnd = i; break; }
  if (aEnd < 0 || aEnd - a > 80) fail('1차 이음매 expose 끝 못 찾음');
  nh.splice(aEnd + 1, 0,
    '',
    '  /* [#TASK-ES-439] 인라인 어려움 묶음 이음매 자리 (docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 생성기 docs/design/harness/module-split/gen-inline-hard.js)',
    '     구역(H1~H4·HO 기관)마다 자기 자리 표지 바로 아래에 ① 가져오기(var X = _키트.X) ② 앱 스코프 통로(expose getter·setter)를 생성기가 넣는다.',
    '     자리가 서로 다른 줄이라 여러 빌더가 동시에 옮겨도 이 머리에서 병합 충돌이 나지 않는다(자리 표지는 지우지 않는다).',
    '     구획 주석(=== 줄)을 쓰지 않는다 — 지도(scripts/inline-script-map.js)의 묶음 번호가 밀리지 않게 1차 이음매 묶음에 붙는다. */',
    ...CFG.slots.map(s => '  /* [어려움 이음매 자리 ' + s + '] */'));
}
const slotIdx = nh.findIndex(l => SLOT_RE(CFG.slot).test(l));
let insertAt = slotIdx + 1;
while (insertAt < nh.length && !/^  \/\* \[어려움 이음매 자리 /.test(nh[insertAt]) && nh[insertAt].trim() !== '') insertAt++;
// 이미 노출된 이름(머리 전체의 expose getter·setter)
const headEnd = nh.findIndex((l, i) => i > usIdx && /^  try\{$/.test(l));
const headText = nh.slice(usIdx, headEnd > 0 ? headEnd : usIdx + 600);
const getters = new Set(), setters = new Set(), kitVars = new Set();
for (const l of headText) {
  let m; const g = /get ([A-Za-z_$][\w$]*)\(\)/g; while ((m = g.exec(l))) getters.add(m[1]);
  const s = /set ([A-Za-z_$][\w$]*)\(v\)/g; while ((m = s.exec(l))) setters.add(m[1]);
  const k = l.match(/^  var (_\w+Kit) = window\.(\w+);$/); if (k) kitVars.add(k[1] + '=' + k[2]);
}
// 가져올 이름: 옮긴 이름 중 옮긴 코드 밖(index.html 에 남은 곳 · 다른 세포)에서 쓰는 것 + 감싼 함수
const IMPORTS = [];
const outsideRefs = {};
for (const it of moved) for (const n of it.names) {
  const b = iScope.getBinding(n);
  const outs = b.referencePaths.filter(r => cellOfLine(H(r.node)) !== CELL_OF.get(n));
  if (outs.length) { IMPORTS.push({ n, cell: it.cell }); outsideRefs[n] = outs.map(r => H(r.node)); }
}
for (const it of wrapped) IMPORTS.push({ n: it.wrapName, cell: it.cell });
// 다른 세포로 간 이름을 L. 로 부르면 그 이름도 노출해야 한다(가져온 var 를 getter 로)
const head = ['  /* [#' + TAG + '] ' + CFG.cells.map(c => c.file).join(' · ') + ' — 가져오기 ' + IMPORTS.length + '개 · 통로 노출은 스코프 분석으로 뽑았다 */'];
for (const c of CFG.cells) {
  // 앞선 이음매에 그 키트 변수가 없으면(예: 홈 탭) 이 자리에서 지역 변수로 만든다 — 전역 이름은 늘지 않는다(이미 있는 전역을 읽을 뿐)
  if (!kitVars.has(c.kitVar + '=' + c.kit)) { if ([...kitVars].some(k => k.startsWith(c.kitVar + '='))) fail('키트 변수 이름이 다른 키트에 쓰였다: ' + c.kitVar); head.push('  var ' + c.kitVar + ' = window.' + c.kit + ';'); kitVars.add(c.kitVar + '=' + c.kit); }
  for (const x of IMPORTS.filter(i => i.cell === c.key)) head.push('  var ' + x.n + ' = ' + c.kitVar + '.' + x.n + ';');
}
const exposeList = [...bridged.keys()].sort().filter(n => !getters.has(n) || (bridged.get(n).assigned && !setters.has(n)));
if (exposeList.length) {
  head.push("  window.OurgoalAppScope.expose('index.html', {");
  exposeList.forEach((n, i) => head.push('    get ' + n + '(){ return ' + n + '; }' + (bridged.get(n).assigned ? ', set ' + n + '(v){ ' + n + ' = v; }' : '') + (i === exposeList.length - 1 ? '' : ',')));
  head.push('  });');
}
nh.splice(insertAt, 0, ...head);
// (3) script 태그: 그 탭 index.js 태그 바로 앞, 같은 줄(순증가 0줄)
// 덮어쓰는 키트(유형 M): 어떤 js 파일이 global.<키트> = { … } 로 통째로 새로 대입하면, 그 파일 태그보다 앞에 넣은 세포의 K.x 는 지워진다 → 그 파일 태그 뒤(afterTag)에만 넣는다
const overwriters = kit => { const out = []; const walk = d => fs.readdirSync(d, { withFileTypes: true }).forEach(e => { const p = path.join(d, e.name); if (e.isDirectory()) return walk(p); if (!e.name.endsWith('.js') || path.resolve(p) === path.resolve(APP, CFG.cells.find(c => c.kit === kit).file)) return; const t = fs.readFileSync(p, 'utf8'); if (new RegExp('(?:global|window)\\.' + kit + '\\s*=(?!=)').test(t) && !new RegExp('(?:global|window)\\.' + kit + '\\s*=\\s*(?:global|window)\\.' + kit + '\\s*\\|\\|').test(t)) out.push(path.relative(APP, p).replace(/\\/g, '/')); }); walk(path.join(APP, 'js')); return out; };
for (const c of CFG.cells) {
  if (!outFiles[c.file]) continue;
  const tagStr = '<script src="' + c.file + '"></script>';
  const ow = overwriters(c.kit);
  if (c.afterTag) {
    const idx = nh.findIndex(l => l.includes(c.afterTag));
    if (idx < 0) fail('태그 없음 ' + c.afterTag);
    nh[idx] = nh[idx].replace(c.afterTag, c.afterTag + tagStr);
  } else {
    if (ow.length) fail('키트 ' + c.kit + ' 를 통째로 새로 대입하는 파일이 있다(' + ow.join(', ') + ') — 그 태그 뒤에 넣도록 설정에 afterTag 를 쓴다(유형 M)');
    const idx = nh.findIndex(l => l.includes(c.beforeTag));
    if (idx < 0) fail('태그 없음 ' + c.beforeTag);
    nh[idx] = nh[idx].replace(c.beforeTag, tagStr + c.beforeTag);
  }
}
// 세포 태그는 인라인 IIFE 보다 앞이어야 한다(머리에서 가져온다)
for (const c of CFG.cells) { const ti = nh.findIndex(l => l.includes('<script src="' + c.file + '"></script>')); if (outFiles[c.file] && !(ti >= 0 && ti < sLine)) fail('세포 태그가 인라인 IIFE 뒤에 있다: ' + c.file); }

fs.writeFileSync(path.join(APP, 'index.html'), nh.join(EOL), 'utf8');
for (const [f, arr] of Object.entries(outFiles)) fs.writeFileSync(path.join(APP, f), arr.join('\n'), 'utf8');
const meta = {
  task: TAG, slot: CFG.slot, scriptHtmlLines: [sLine + 1, eLine],
  plan: finalPlan.map(i => ({ cell: i.cell, action: i.action, segment: [i.segStart, i.end], stmt: [i.start, i.end], names: i.names, why: i.why || null, ...(i.sourceEndColumn == null ? {} : { sourceEndColumn: i.sourceEndColumn }) })),
  imports: IMPORTS, outsideRefs,
  bridged: [...bridged.keys()].sort().map(n => ({ n, ...bridged.get(n), exposedBefore: getters.has(n), setterBefore: setters.has(n) })), exposed: exposeList, edits: uniq.length,
  htmlLinesBefore: lines.length, htmlLinesAfter: nh.length,
  files: Object.fromEntries(Object.entries(outFiles).map(([f, a]) => [f, a.length - 1])),
};
{ const oa = moved.filter(i => i.ownArguments).map(i => ({ name: i.names[0], cell: i.cell, count: i.ownArguments })); if (oa.length) meta.ownArguments = oa; } // [#TASK-ES-657] 자기 arguments 를 쓰는 함수 선언을 옮겼을 때만 이 칸이 생긴다
fs.writeFileSync(path.join(process.env.MODULE_SPLIT_OUT || require('os').tmpdir(), 'gen-inline-hard-meta.json'), JSON.stringify(meta, null, 1));
console.log('move', moved.length, 'wrap', wrapped.length, 'keep', kept.length, '· edits', uniq.length, '· bridged', bridged.size, '· exposed', exposeList.length, '· imports', IMPORTS.length);
for (const i of moved.filter(x => x.ownArguments)) console.log('  arguments', i.names[0], '— 함수 선언째로 옮김: 그 함수 자신의 arguments ' + i.ownArguments + '곳(헌법 CELL_SPLIT 5호 허용)');
for (const k of kept) console.log('  keep', k.start + '~' + k.end, k.names.join(',') || k.st.node.type, '—', k.why);
console.log('index.html lines', lines.length, '->', nh.length);
for (const [f, a] of Object.entries(outFiles)) console.log(f, a.length - 1);
