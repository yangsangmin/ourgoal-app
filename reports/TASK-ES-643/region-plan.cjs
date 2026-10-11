#!/usr/bin/env node
'use strict';
// 구역 계획기(#TASK-ES-643) — 작업자 도구, 판정 아님.
// 인라인 IIFE 의 최상위 문을 순서대로 훑어 「구역에 넣을 수 있는 문이 연달아 있는 가장 긴 줄기」를 구역 후보로 잡고, 생성기 region 설정(구획 주석 제목 + 문 글자 닻)을 만든다.
// 넣을 수 있는지의 최종 판단은 이 도구가 아니라 생성기가 한다 — 만든 설정을 저장소 밖 사본에 생성기로 돌려 통과한 것만 계획에 남긴다(--apply <사본 트리> 로 그 사본에 실제 적용).
// 구역을 끊는 것: 함수 선언 · 키트 손잡이·가져오기 · expose 문 · 통로에 노출된 이름의 var(상태 이전이 먼저) · 구역 밖에서 쓰는 var · 돈 근처·결심 대기 줄(OurgoalTemplateCredit · OURGOAL_CONFIG) ·
//   다른 종류의 문 · 문이 남는 묶음의 구획 주석(그 묶음에서 구역을 나눈다).
// 구역 함수 이름(bootRegionNN)과 세포 파일(js/core/boot-region-*.js, 키트 OurgoalUiHelpers)은 **모의 적용용 가칭**이다. 실제 PR 은 구역마다 이름·세포·키트를 정해 설정을 다시 쓴다(경계 = group·from·to 는 그대로 쓸 수 있다).
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node reports/TASK-ES-643/region-plan.cjs <읽을 트리> <out.json> [--apply <사본 트리>] [--pins reports/TASK-ES-643/region-pins.json] [--min-lines N] [--per-cell N]
const fs = require('fs'), path = require('path'), cp = require('child_process'), os = require('os');
const { inventory } = require('./region-inventory.cjs');
const argv = process.argv.slice(2), TREE = path.resolve(argv[0]), OUT = path.resolve(argv[1]);
const opt = (k, d) => (argv.indexOf(k) >= 0 ? argv[argv.indexOf(k) + 1] : d);
const PINS = opt('--pins', null) ? JSON.parse(fs.readFileSync(path.resolve(opt('--pins')), 'utf8')).pins : [];
const APPLY = opt('--apply', null), MIN = Number(opt('--min-lines', '1')), PER_CELL = Number(opt('--per-cell', '12'));
const GEN = path.join(TREE, 'docs', 'design', 'harness', 'module-split', 'gen-inline-hard.js');
const HOLD = /(^|[^\w$])(OurgoalTemplateCredit|OURGOAL_CONFIG)($|[^\w$])/;
const v = inventory(path.join(TREE, 'index.html'));
const { top, iScope, lines, H, HE, code, s: off } = v;
const text = st => code.slice(st.node.start, st.node.end);
const slot0 = lines.findIndex(l => /^  \/\* \[어려움 이음매 자리 HO[ \]]/.test(l));
let insertAt = slot0 + 1; while (insertAt < lines.length && !/^  \/\* \[어려움 이음매 자리 /.test(lines[insertAt]) && lines[insertAt].trim() !== '') insertAt++;
const headers = v.headers.map(h => Object.assign({}, h)).filter(h => top.some(st => (st.node.leadingComments || []).some(c => c.loc.start.line + off === h.line)));
const groupEnd = h => { const i = headers.indexOf(h); return i + 1 < headers.length ? headers[i + 1].line - 1 : v.e; };
const groupSts = h => top.filter(st => H(st.node) >= h.line && HE(st.node) <= groupEnd(h));
const headerOf = st => headers.filter(h => h.line <= H(st.node)).pop() || null;
const headerRaw = h => lines[h.line - 1].replace(/^\s*\/\*\s*/, '').replace(/\s*\*\/\s*$/, '').trim();
// 문마다: 구역에 넣을 수 있는가(생성기 정지 조건의 어림 — 최종 판단은 생성기)
const why = new Map();
top.forEach((st, i) => {
  const x = v.stmts[i];
  if (['functionDecl', 'kitHandle', 'kitImport', 'exposeCall'].includes(x.kind)) return why.set(st, x.kind);
  if (x.kind === 'varExposed') return why.set(st, '통로에 노출된 이름의 var(상태 이전이 먼저): ' + x.names.join(','));
  if (!(st.isExpressionStatement() || st.isIfStatement() || st.isTryStatement() || (st.isVariableDeclaration() && st.node.kind === 'var'))) return why.set(st, '문 종류 ' + st.node.type);
  if (HOLD.test(text(st))) return why.set(st, '돈 근처·결심 대기 대상');
  if (H(st.node) < insertAt + 1) return why.set(st, '머리 이음매 자리보다 앞');
  let bad = 0; st.traverse({ Function(q) { if (!q.isArrowFunctionExpression()) q.skip(); }, ThisExpression() { bad++; }, Identifier(q) { if (q.node.name === 'arguments' && q.isReferencedIdentifier()) bad++; } });
  if (bad) return why.set(st, '최상위 this/arguments');
});
// 시험·가드가 붙잡는 글자(--pins): 문이나 그 앞 주석(앞 문의 끝 다음 줄부터)에 그 글자가 있으면 구역에 넣지 않는다
top.forEach((st, i) => { if (why.has(st)) return; const a = i ? HE(top[i - 1].node) + 1 : H(st.node), seg = lines.slice(a - 1, HE(st.node)).join('\n'); const pin = PINS.find(p => seg.includes(p.text)); if (pin) why.set(st, '시험·가드가 붙잡는 글자(' + pin.kind + '): ' + pin.text); });
// 한 줄을 나눠 쓰는 문 짝: 하나라도 못 넣으면 둘 다 못 넣는다
for (let i = 1; i < top.length; i++) if (v.stmts[i].sharesPrevLine) { const a = top[i - 1], b = top[i]; if (why.has(a) && !why.has(b)) why.set(b, '못 넣는 문과 한 줄을 나눠 씀'); if (why.has(b) && !why.has(a)) why.set(a, '못 넣는 문과 한 줄을 나눠 씀'); }
let runs = [];
for (let guard = 0; guard < 50; guard++) {
  // 연달아 있는 줄기
  runs = []; let cur = null;
  top.forEach(st => { if (why.has(st)) { cur = null; return; } if (!cur) { cur = []; runs.push(cur); } cur.push(st); });
  const inRun = new Map(); runs.forEach(r => r.forEach(st => inRun.set(st, r)));
  // 문이 남는 묶음의 구획 주석에서 나눈다(줄기 안쪽에 든 구획 주석 — 그 묶음의 문이 다 들지 않으면)
  const split = [];
  for (const r of runs) { let piece = [r[0]]; for (let i = 1; i < r.length; i++) { const hPrev = headerOf(r[i - 1]), hCur = headerOf(r[i]); if (hCur !== hPrev && hCur && !groupSts(hCur).every(st => inRun.has(st))) { split.push(piece); piece = []; } piece.push(r[i]); } split.push(piece); }
  // 한 줄을 나눠 쓰는 짝이 조각 경계에 걸리면 안 된다(없어야 정상 — 구획 주석은 줄 사이에 있다)
  runs = split;
  // 지역 변수 검사: 구역 안 var 의 참조가 모두 구역 줄 범위 안인가
  let changed = false;
  for (const r of runs) {
    const first = r[0], k = top.indexOf(first), prevEnd = k ? HE(top[k - 1].node) : off + 2, a = prevEnd + 1, b = HE(r[r.length - 1].node);
    for (const st of r) if (st.isVariableDeclaration()) for (const d of st.node.declarations) {
      const bd = iScope.getBinding(d.id.name); const outs = bd.referencePaths.concat(bd.constantViolations).map(p => H(p.node)).filter(l => l < a || l > b);
      if (outs.length) { why.set(st, '구역 밖에서 쓰는 var: ' + d.id.name + '(줄 ' + [...new Set(outs)].slice(0, 6).join(',') + ')'); changed = true; }
    }
    // 구역 안 블록 속 var(끌어올려지는 선언)도 같은 규칙
    for (const n of Object.keys(iScope.bindings)) { const bd = iScope.bindings[n], dl = H(bd.path.node); if (dl < H(first.node) || dl > b) continue; const st = r.find(x => dl >= H(x.node) && dl <= HE(x.node)); if (!st || st.isVariableDeclaration()) continue;
      const outs = bd.referencePaths.concat(bd.constantViolations).map(p => H(p.node)).filter(l => l < a || l > b); if (v.exposed.has(n) || outs.length) { why.set(st, '문 안에서 선언한 var 를 밖에서 쓰거나 노출함: ' + n); changed = true; } }
  }
  for (let i = 1; i < top.length; i++) if (v.stmts[i].sharesPrevLine) { const a = top[i - 1], b = top[i]; if (why.has(a) !== why.has(b)) { why.set(why.has(a) ? b : a, '못 넣는 문과 한 줄을 나눠 씀'); changed = true; } }
  if (!changed) break;
}
// 구역 설정 만들기
// 제목 후보: 구획 주석의 줄마다 `=`·빈칸을 걷어 낸 글자(여러 줄 구획 주석은 둘째 줄에 제목이 있다) → 그 글자를 담은 구획 주석이 하나뿐인 첫 후보
const titleCands = h => { const ls = lines.slice(h.line - 1, h.endLine).map(l => l.replace(/^\s*\/\*/, '').replace(/\*\/\s*$/, '').trim()); const a = []; for (const l of ls) { const t = l.replace(/^=+\s*/, '').replace(/\s*=+$/, '').trim(); if (t) a.push(t); } return a; };
const uniqTitle = h => { const raw = titleCands(h)[0] || headerRaw(h); for (const cand of titleCands(h).concat([headerRaw(h)])) { if (headers.filter(x => lines.slice(x.line - 1, x.endLine).join('\n').includes(cand)).length === 1) return { title: cand }; }
  const same = headers.filter(x => lines.slice(x.line - 1, x.endLine).join('\n').includes(raw)); if (same.filter(x => groupSts(x).length > 0).length === 1 && groupSts(h).length > 0) return { title: raw, headerPick: 'nonEmpty' }; return null; };
const anchorOf = (st, S) => { const t = text(st); for (let n = Math.min(24, t.length); n <= t.length; n += 8) { const a = t.slice(0, n).split('\n')[0]; if (S.filter(x => text(x).startsWith(a)).length === 1) return a; if (a.length < n) break; } const full = t.split('\n')[0]; return S.filter(x => text(x).startsWith(full)).length === 1 ? full : (S.filter(x => text(x).startsWith(t)).length === 1 ? t : null); };
const regions = [], skipped = [];
runs.forEach(r => {
  const first = r[0], last = r[r.length - 1], h1 = headerOf(first), h2 = headerOf(last);
  const k = top.indexOf(first), prevEnd = k ? HE(top[k - 1].node) : off + 2;
  const stmtLines = r.reduce((a, st) => a + HE(st.node) - H(st.node) + 1, 0);
  const info = { firstLine: H(first.node), lastLine: HE(last.node), statements: r.length, statementLines: stmtLines };
  if (!h1) return skipped.push(Object.assign(info, { why: '앞에 구획 주석이 없다' }));
  const t1 = uniqTitle(h1), t2 = h2 === h1 ? t1 : uniqTitle(h2);
  if (!t1 || !t2) return skipped.push(Object.assign(info, { why: '구획 주석 제목이 하나로 정해지지 않는다: ' + headerRaw(!t1 ? h1 : h2) }));
  const S = top.filter(st => H(st.node) >= h1.line && HE(st.node) <= groupEnd(h2));
  const spec = { name: '', group: t1.title };
  if (h2 !== h1) spec.groupTo = t2.title;
  if (t1.headerPick || t2.headerPick) spec.headerPick = 'nonEmpty';
  if (S[0] !== first) { const a = anchorOf(first, S); if (!a) return skipped.push(Object.assign(info, { why: 'from 닻이 하나로 정해지지 않는다' })); spec.from = a; }
  if (S[S.length - 1] !== last) { const a = anchorOf(last, S); if (!a) return skipped.push(Object.assign(info, { why: 'to 닻이 하나로 정해지지 않는다' })); spec.to = a; }
  regions.push({ spec, info, kinds: r.reduce((a, st) => { const kd = v.stmts[top.indexOf(st)].kind; a[kd] = (a[kd] || 0) + 1; return a; }, {}) });
});
const picked = regions.filter(r => r.info.lastLine - r.info.firstLine + 1 >= MIN);
picked.forEach((r, i) => { r.spec = Object.assign({ name: 'bootRegion' + String(i + 1).padStart(2, '0') }, r.spec, { name: 'bootRegion' + String(i + 1).padStart(2, '0') }); });
const cells = [];
for (let i = 0; i < picked.length; i += PER_CELL) { const part = picked.slice(i, i + PER_CELL), n = cells.length + 1;
  cells.push({ key: 'bootRegion' + n, file: 'js/core/boot-region-' + String.fromCharCode(96 + n) + '.js', kit: 'OurgoalUiHelpers', kitVar: '_uiKit', afterTag: '<script src="js/core/ui-helpers.js"></script>', title: 'OurGoal Boot Regions ' + n + ' (모의 적용용 가칭 — 앱이 뜰 때 한 번 도는 문을 순서 그대로 묶은 구역 함수)', desc: ['구역 ' + part.map(r => r.spec.name).join(' · ') + ' — 계획기(reports/TASK-ES-643/region-plan.cjs)가 붙인 가칭이다. 실제 PR 은 구역마다 이름과 세포를 정한다.'], regions: part.map(r => r.spec) }); }
const config = { task: 'TASK-ES-643', label: '연속 구역 감싸기 모의 적용(저장소 밖 사본)', slot: 'HO', mode: 'region', cells };
// 생성기로 확인: 임시 사본(index.html · js/ · scripts/smoke-test.js 는 필요 없다 — region 경로는 index.html 과 js/** 만 읽는다)
function runGen(appDir, cfg) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'region-plan-')), cf = path.join(tmp, 'cfg.json');
  fs.writeFileSync(cf, JSON.stringify(cfg), { encoding: 'utf8' });
  const r = cp.spawnSync(process.execPath, [GEN, appDir, cf], { encoding: 'utf8', env: Object.assign({}, process.env, { MODULE_SPLIT_OUT: tmp }), maxBuffer: 64 * 1024 * 1024 });
  const meta = r.status === 0 ? JSON.parse(fs.readFileSync(path.join(tmp, 'gen-inline-hard-meta.json'), 'utf8')) : null;
  const err = r.status === 0 ? null : ((r.stderr || '').split('\n').find(l => /^Error: /.test(l)) || (r.stderr || '').split('\n').find(l => /Error/.test(l)) || '').replace(/^Error: /, '').replace(/\r$/, '');
  fs.rmSync(tmp, { recursive: true, force: true });
  return { status: r.status, meta, err, stdout: (r.stdout || '').trim().split('\n') };
}
function copyTree(dst) { fs.mkdirSync(dst, { recursive: true }); fs.copyFileSync(path.join(TREE, 'index.html'), path.join(dst, 'index.html')); fs.cpSync(path.join(TREE, 'js'), path.join(dst, 'js'), { recursive: true }); }
let result = null;
if (cells.length) {
  const work = APPLY ? path.resolve(APPLY) : fs.mkdtempSync(path.join(os.tmpdir(), 'region-plan-tree-'));
  if (!APPLY) copyTree(work);
  result = runGen(work, config);
  if (!APPLY) fs.rmSync(work, { recursive: true, force: true });
}
const cutTable = {}; top.forEach(st => { if (!why.has(st)) return; const w = why.get(st).replace(/:.*$/, ''); const c = cutTable[w] = cutTable[w] || { statements: 0, lines: 0 }; c.statements++; c.lines += HE(st.node) - H(st.node) + 1; });
const out = { tool: 'reports/TASK-ES-643/region-plan.cjs', type: '작업자 측정, 판정 아님', measuredAt: new Date().toISOString(), pins: PINS, basis: { commit: cp.spawnSync('git', ['-C', TREE, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim(), note: '이 커밋의 index.html 에서 쟀다. 구역 함수 이름·세포 파일·키트는 모의 적용용 가칭이다' }, minLines: MIN,
  totals: { topLevelStatements: top.length, regionable: top.length - why.size, runs: runs.length, regions: picked.length, droppedBelowMinLines: regions.length - picked.length, skipped: skipped.length,
    statementsInRegions: picked.reduce((a, r) => a + r.info.statements, 0), statementLinesInRegions: picked.reduce((a, r) => a + r.info.statementLines, 0) },
  generator: result ? { ok: result.status === 0, error: result.err, stdout: result.stdout, htmlLines: result.meta ? [result.meta.htmlLinesBefore, result.meta.htmlLinesAfter] : null, exposedAdded: result.meta ? result.meta.exposed : null, bridged: result.meta ? result.meta.bridged.length : null, files: result.meta ? result.meta.files : null, headLines: result.meta ? result.meta.head.lines : null } : null,
  regions: picked.map((r, i) => Object.assign({ name: r.spec.name, cell: cells[Math.floor(i / PER_CELL)].file }, r.spec, r.info, { kinds: r.kinds }, result && result.meta ? (m => m ? { segment: m.segment, lines: m.lines, locals: m.locals, bridged: m.bridged, headersMoved: m.headersMoved } : {})(result.meta.regions.find(x => x.name === r.spec.name)) : {})),
  notRegionable: cutTable, notRegionableStatements: top.filter(st => why.has(st) && !['functionDecl', 'kitHandle', 'kitImport', 'exposeCall'].includes(v.stmts[top.indexOf(st)].kind)).map(st => ({ line: H(st.node), endLine: HE(st.node), kind: v.stmts[top.indexOf(st)].kind, why: why.get(st), text: lines[H(st.node) - 1].trim().slice(0, 100).replace(/eyJ[A-Za-z0-9_\-.]{6,}/g, '(가림)') })),
  skipped, config };
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', { encoding: 'utf8' });
console.log(JSON.stringify({ totals: out.totals, generator: out.generator && { ok: out.generator.ok, error: out.generator.error, htmlLines: out.generator.htmlLines, exposedAdded: out.generator.exposedAdded && out.generator.exposedAdded.length, headLines: out.generator.headLines, files: out.generator.files }, notRegionable: cutTable, skipped }));
