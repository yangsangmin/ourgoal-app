'use strict';
// 통계 세포 쪼개기 4차(#TASK-ES-428) 검사 — 3차 verify-stats-split-3.js 와 같은 기준에 대시보드 구획(문맥 객체 D) 맞대기를 더했다.
//  ① 글자(토큰열)
//     - 구획 함수 11개: 이전 전 대시보드 본문의 구획 문 묶음 토큰열에서 "기대 토큰열"을 이 검사기가 따로 만든다 —
//       공유 이름(대시보드 스코프 이름 중 머리·구획 둘 이상에서 쓰이는 것, 이 검사기가 이전 전 글자에서 스스로 셈)을 가리키는 식별자 앞에 `D .` 를 넣고,
//       공유 이름만 선언하는 var 문의 `var` 를 뺀다. 이것이 새 파일 구획 함수 본문 토큰열(S.·K. 접두만 뗌)과 같아야 한다. 그 밖의 차이는 0.
//     - 조립자: 이전 전 대시보드 토큰열에서 빈 화면 블록 본문(맨 끝 return 앞까지)을 `renderStatsEmptyState(D);` 로, 각 구획을 `<구획 함수>(D);` 로 바꾸고
//       온톨로지 선언 뒤에 `var D = { <머리 공유 이름>: <이름>, … };` 를 넣은 토큰열 = 새 조립자.
//     - 원본에 남은 최상위 함수·카탈로그 상수 6개·공개 API 객체·차등 모델 별칭·꼬리: 이전 전과 같다. 1·2·3차 부품 14개 글자 그대로.
//  ② 누수: 부품에 원본 IIFE 이름이 접두 없이 남은 곳 0, S.<이름> 모두 노출, K.<이름> 모두 키트 함수, 원본에 남은 옮긴 함수 정의 0, 원본이 쓰는 옮긴 함수 모두 가져옴,
//          새 파일에서 D 는 구획 함수 인자·조립자 var 로만 묶임(전역 D 0), 옮긴 함수 최상위 this·arguments 0
//  ③ 실행(브라우저 순서): 공개 API 키·순서, window 이름 동일, 옮긴 함수 = 키트 함수, 상수 같은 객체·값, 별칭 유지, 원본·새 파일 단독 로드(부품 없이) 오류 0
//  ④ 같은 입력으로 순수 함수 결과 동일(3차 16가지)  ⑤ 새 파일 잔디 0
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node verify-stats-split-4.js <이전 전 APP_DIR> <APP_DIR>
const fs = require('fs'), path = require('path'), vm = require('vm');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const BASE = process.argv[2], APP = process.argv[3];
const MAIN = 'js/universal-stats.js';
const DASH = 'renderUniversalStatsDashboard', EMPTY_FN = 'renderStatsEmptyState';
const SECTIONS = [
  ['prepareStatsDashboardData', 'js/stats-dashboard.js', { v: 'isExpanded' }],
  ['buildStatsHeaderHtml', 'js/stats-dashboard-view.js', { v: 'headerHtml' }],
  ['buildStatsLensControlsHtml', 'js/stats-dashboard-view.js', { v: 'periodTabs' }],
  ['buildStatsEntityChipsHtml', 'js/stats-dashboard-view.js', { v: 'colors' }],
  ['buildStatsChartHtml', 'js/stats-dashboard-view.js', { v: 'chartObj' }],
  ['buildStatsKpiHtml', 'js/stats-dashboard-view.js', { v: 'seriesArray' }],
  ['mountStatsDashboardHtml', 'js/stats-dashboard-view.js', { v: 'diagReportVisual' }],
  ['bindStatsHeaderActions', 'js/stats-dashboard-bind.js', { v: 'hdrEl' }],
  ['bindStatsControlActions', 'js/stats-dashboard-bind.js', { t: "container.querySelectorAll('.u-lens-btn')" }],
  ['bindStatsChartInteractions', 'js/stats-dashboard-bind.js', { v: 'captureRect' }],
];
const NEW_FILES = ['js/stats-dashboard.js', 'js/stats-dashboard-view.js', 'js/stats-dashboard-bind.js'];
const PREV_PARTS = ['js/stats-taxonomy.js', 'js/stats-data-grid.js', 'js/stats-lenses.js', 'js/stats-metrics.js', 'js/stats-charts.js', 'js/stats-import.js', 'js/stats-data-menu.js',
  'js/stats-samples.js', 'js/stats-sample-fitness.js', 'js/stats-sample-growth.js', 'js/stats-ontology.js', 'js/stats-export.js', 'js/stats-fullscreen.js', 'js/stats-differentiated.js'];
const CONSTS = ['METRIC_CONFIGS', 'SAMPLE_THEMES', 'THEME_METRIC_SPECS', 'RAW_52W_POWERLIFTING_DATA', 'DOMAINS', 'METRIC_DIFFERENTIATED_MODELS'];
const PREV_FNS = ['openTaxonomyManagerModal', 'openUniversalDataGrid', 'openRowEditModal', 'computeCrossRatioSeries', 'renderCrossRatioSvg', 'renderRadarSvg', 'computeCadenceData', 'renderCadenceSvg', 'generateStatisticalDiagnosticReport',
  'ensureMetricConfig', 'extractMetricsFromRecord', 'discoverActiveMetrics', 'aggregateMetricTimeSeries', 'renderUniversalSvgChart', 'aggregateMultiSeries', 'calcNiceStep', 'renderMultiSeriesSvg', 'normalizeHistoricalDate', 'parseCsvToUniversalRecords', 'openUniversalImportModal', 'openGuideModal', 'openDataManagementModal',
  'generateDomainSample', 'generate52WeekPowerliftingSample', 'generate1920sOlympicStrengthSample', 'getChosung', 'matchQuery', 'inferDomainKey', 'buildUniversalOntology', 'exportCleanCsv', 'captureChartSnapshot', 'openStatsFullscreenModal',
  'computeDifferentiatedAnalysis', 'renderDifferentiatedReportCard', 'openDifferentiatedMetricConfigModal',
  'pushHyroxSample', 'pushRunningSample', 'pushBig3Sample', 'pushStudySample', 'pushCodingSample', 'pushSalesSample'];
const ALL = [DASH, EMPTY_FN, ...SECTIONS.map(s => s[0])];
const FILE_OF = { [DASH]: 'js/stats-dashboard.js', [EMPTY_FN]: 'js/stats-dashboard.js' }; for (const [n, f] of SECTIONS) FILE_OF[n] = f;
const read = f => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const val = t => (t.type.label === 'name' || t.type.keyword) ? String(t.value) : (t.value !== undefined ? t.type.label + ':' + String(t.value) : t.type.label);
const isCom = t => t.type === 'CommentLine' || t.type === 'CommentBlock';
const normSK = vals => { const out = []; for (let i = 0; i < vals.length; i++) { if ((vals[i] === 'S' || vals[i] === 'K') && vals[i + 1] === '.' && /^[A-Za-z_$]/.test(vals[i + 2] || '') && vals[i - 1] !== '.') { i += 1; continue; } out.push(vals[i]); } return out; };
const P = f => parser.parse(read(f), { sourceType: 'script', tokens: true, ranges: true });
const rawToks = (ast, a, b) => ast.tokens.filter(t => t.start >= a && t.end <= b && !isCom(t));
const toks = (ast, a, b) => normSK(rawToks(ast, a, b).map(val));
const iifeBody = a => a.program.body[0].expression.callee.body.body;
const topFns = a => { const m = {}; for (const x of iifeBody(a)) if (x.type === 'FunctionDeclaration') m[x.id.name] = x; return m; };
const cmp = (label, a, b) => { const same = a.length === b.length && a.every((v, i) => v === b[i]); let at = -1; if (!same) for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) { at = i; break; } return { what: label, tokensOrig: a.length, tokensNew: b.length, same, firstDiff: same ? null : { i: at, orig: a.slice(Math.max(0, at - 6), at + 8), neu: b.slice(Math.max(0, at - 6), at + 8) } }; };

// ① 이전 전 대시보드에서 구획·공유 이름을 스스로 센다
const oast = P(path.join(BASE, MAIN)), ofns = topFns(oast), oSrc = read(path.join(BASE, MAIN));
let dashPath = null;
traverse(oast, { FunctionDeclaration(p) { if (p.node.id.name === DASH && !dashPath) dashPath = p; } });
const dScope = dashPath.scope;
const dBody = dashPath.node.body.body;
const iOnt = dBody.findIndex(s => s.type === 'VariableDeclaration' && s.declarations[0].id.name === 'ontology');
const emptyIf = dBody[iOnt + 1];
const eBody = emptyIf.consequent.body, eStmts = eBody.slice(0, -1);
const secStart = SECTIONS.map(([n, , a]) => dBody.findIndex(s => a.v ? (s.type === 'VariableDeclaration' && s.declarations[0].id.name === a.v) : oSrc.slice(s.start, s.end).startsWith(a.t)));
const regions = [{ name: EMPTY_FN, start: eStmts[0].start, end: eStmts[eStmts.length - 1].end }];
SECTIONS.forEach(([n], k) => { const a = secStart[k], b = k + 1 < SECTIONS.length ? secStart[k + 1] - 1 : dBody.length - 1; regions.push({ name: n, start: dBody[a].start, end: dBody[b].end }); });
const contiguous = secStart[0] === iOnt + 2 && secStart.every((x, i) => i === 0 || x > secStart[i - 1]);
const regionOf = pos => { for (const r of regions) if (pos >= r.start && pos < r.end) return r.name; return 'head'; };
const sharedB = new Map();
for (const [name, b] of Object.entries(dScope.bindings)) {
  const regs = new Set();
  if (b.kind === 'param') regs.add('head');
  dashPath.traverse({ Identifier(p) { if (p.node.name === name && p.scope.getBinding(name) === b) regs.add(regionOf(p.node.start)); } });
  if (regs.size >= 2) sharedB.set(name, { b, fromHead: regs.has('head') });
}
// 기대 토큰열: 공유 식별자 위치(앞에 D . 넣음)·뺄 var 토큰 위치
const insertAt = new Set(), dropAt = new Set();
dashPath.traverse({
  Identifier(p) {
    if (regionOf(p.node.start) === 'head') return;
    const par = p.parent;
    if ((p.parentPath.isMemberExpression() || p.parentPath.isOptionalMemberExpression()) && par.property === p.node && !par.computed) return;
    if (p.parentPath.isObjectProperty() && par.key === p.node && !par.computed && !par.shorthand) return;
    if (p.parentPath.isObjectMethod() && par.key === p.node && !par.computed) return;
    const s = sharedB.get(p.node.name);
    if (!s || p.scope.getBinding(p.node.name) !== s.b) return;
    if (p.parentPath.isObjectProperty() && par.shorthand) throw new Error('단축 속성 공유 이름 — 검사기 미지원');
    insertAt.add(p.node.start);
  },
  VariableDeclaration(p) {
    if (regionOf(p.node.start) === 'head') return;
    if (p.node.declarations.every(d => { const s = sharedB.get(d.id.name); return s && p.scope.getBinding(d.id.name) === s.b; })) dropAt.add(p.node.start);
  },
});

const snip = src => parser.parse(src, { sourceType: 'script', tokens: true }).tokens.filter(t => !isCom(t) && t.type.label !== 'eof').map(val);
const DOT = snip('D.x').slice(0, 2);
const expectSection = (a, b) => { const out = []; for (const t of rawToks(oast, a, b)) { if (dropAt.has(t.start) && val(t) === 'var') continue; if (insertAt.has(t.start)) out.push(...DOT); out.push(val(t)); } return out; };
const fileAst = {}; for (const f of NEW_FILES) fileAst[f] = P(path.join(APP, f));
const nf = f => topFns(fileAst[f]);
const equiv = [];
for (const r of regions) {
  const f = FILE_OF[r.name];
  const sfn = nf(f)[r.name];
  const params = sfn ? sfn.params.map(x => x.name) : null;
  equiv.push(Object.assign({ file: f, params }, cmp('section ' + r.name, expectSection(r.start, r.end), sfn ? toks(fileAst[f], sfn.body.start + 1, sfn.body.end - 1) : ['<없음>'])));
}
{ // 조립자
  const exp = [];
  const od = ofns[DASH];
  const headShared = [...sharedB.entries()].filter(([, s]) => s.fromHead).map(([n]) => n);
  const order = ['container', 'allRecs', 'state', 'callbacks'].filter(n => headShared.includes(n)).concat(headShared.filter(n => !['container', 'allRecs', 'state', 'callbacks'].includes(n)));
  exp.push(...toks(oast, od.start, dBody[iOnt].end));
  exp.push(...snip('var D = { ' + order.map(n => n + ': ' + n).join(', ') + ' };'));
  exp.push(...toks(oast, dBody[iOnt].end, eStmts[0].start));
  exp.push(...snip(EMPTY_FN + '(D);'));
  exp.push(...toks(oast, eBody[eBody.length - 1].start, emptyIf.end));
  for (const [n] of SECTIONS) exp.push(...snip(n + '(D);'));
  exp.push(...snip('{}').slice(1));
  equiv.push(Object.assign({ file: 'js/stats-dashboard.js', headShared: order }, cmp('assembler ' + DASH, exp, toks(fileAst['js/stats-dashboard.js'], nf('js/stats-dashboard.js')[DASH].start, nf('js/stats-dashboard.js')[DASH].end))));
}
// 원본에 남은 것
const mastT = P(path.join(APP, MAIN)), mfns = topFns(mastT);
const oTop = iifeBody(oast), mTop = iifeBody(mastT);
const remainingFns = Object.keys(mfns);
for (const n of remainingFns) equiv.push(Object.assign({ file: MAIN }, cmp('main fn ' + n, ofns[n] ? toks(oast, ofns[n].start, ofns[n].end) : ['<없음>'], toks(mastT, mfns[n].start, mfns[n].end))));
for (const name of CONSTS) {
  const od = oTop.find(x => x.type === 'VariableDeclaration' && x.declarations[0].id.name === name);
  const md = mTop.find(x => x.type === 'VariableDeclaration' && x.declarations[0].id.name === name);
  equiv.push(Object.assign({ file: MAIN }, cmp('main const ' + name, toks(oast, od.start, od.end), md ? toks(mastT, md.start, md.end) : ['<없음>'])));
}
const tailOf = (ast, body) => { const i = body.findIndex(x => x.type === 'VariableDeclaration' && x.declarations[0].id.name === 'api'); return toks(ast, body[i].start, body[body.length - 1].end); };
equiv.push(Object.assign({ file: MAIN }, cmp('main api·tail', tailOf(oast, oTop), tailOf(mastT, mTop))));
const aliasOf = (ast, body) => body.filter(x => x.type === 'ExpressionStatement' && x.expression.type === 'AssignmentExpression' && x.expression.left.type === 'MemberExpression' && x.expression.left.object.name === 'METRIC_DIFFERENTIATED_MODELS').flatMap(x => toks(ast, x.start, x.end));
equiv.push(Object.assign({ file: MAIN }, cmp('main alias lines', aliasOf(oast, oTop), aliasOf(mastT, mTop))));
const prevPartsUnchanged = PREV_PARTS.every(f => read(path.join(BASE, f)) === read(path.join(APP, f)));
const sectionParamsOk = equiv.filter(e => e.what.startsWith('section ')).every(e => JSON.stringify(e.params) === '["D"]');
// ② 누수
const mast = parser.parse(read(path.join(APP, MAIN)), { sourceType: 'script' });
let iife; traverse(mast, { FunctionExpression(p) { if (!iife) iife = p; } });
const iifeNames = new Set(Object.keys(iife.scope.bindings));
const exposed = new Set(); const imported = new Set();
iife.traverse({
  ObjectMethod(p) { if (p.node.kind === 'get' && p.parentPath.parentPath.isCallExpression() && p.parentPath.parentPath.node.callee.type === 'MemberExpression' && p.parentPath.parentPath.node.callee.property.name === 'getOwnPropertyDescriptors') exposed.add(p.node.key.name); },
  VariableDeclarator(p) { const i = p.node.init; if (i && i.type === 'MemberExpression' && i.object.type === 'Identifier' && i.object.name === '_statsKit' && !i.computed) imported.add(p.node.id.name); }
});
const leftDefs = ALL.filter(n => { const b = iife.scope.bindings[n]; return b && b.path.isFunctionDeclaration(); });
const usedInMain = new Set();
iife.traverse({ Identifier(p) { if (p.isReferencedIdentifier() && ALL.concat(PREV_FNS).includes(p.node.name) && !p.parentPath.isVariableDeclarator()) usedInMain.add(p.node.name); } });
const notImported = [...usedInMain].filter(n => !imported.has(n));
const files = {}; const usedT = new Set(); const usedK = new Set();
const dBindings = {};
for (const f of PREV_PARTS.concat(NEW_FILES)) {
  const fa = parser.parse(read(path.join(APP, f)), { sourceType: 'script' });
  const leaks = new Set(), globals = new Set();
  const dKinds = new Set();
  traverse(fa, {
    Identifier(p) {
      const par = p.parent;
      if (p.node.name === 'D' && NEW_FILES.includes(f) && !(p.parentPath.isMemberExpression() && par.property === p.node && !par.computed)) { const b = p.scope.getBinding('D'); dKinds.add(b ? (b.kind + '@' + (b.scope.block.id ? b.scope.block.id.name : '?')) : 'GLOBAL'); }
      if (p.parentPath.isMemberExpression() && par.property === p.node && !par.computed) {
        if (par.object.type === 'Identifier' && par.object.name === 'S') usedT.add(p.node.name);
        if (par.object.type === 'Identifier' && par.object.name === 'K' && !p.parentPath.parentPath.isAssignmentExpression()) usedK.add(p.node.name);
        return;
      }
      if (p.parentPath.isObjectProperty() && par.key === p.node && !par.computed) return;
      if (p.parentPath.isObjectMethod() && par.key === p.node) return;
      if (!p.isReferencedIdentifier() && !(p.parentPath.isAssignmentExpression() && par.left === p.node)) return;
      if (p.scope.getBinding(p.node.name)) return;
      globals.add(p.node.name);
      if (iifeNames.has(p.node.name) && p.node.name !== 'root') leaks.add(p.node.name);
    }
  });
  if (NEW_FILES.includes(f)) dBindings[f] = [...dKinds].sort();
  files[f] = { lines: read(path.join(APP, f)).split('\n').length - 1, globals: [...globals].sort(), leaksIIFEName: [...leaks].sort() };
}
usedK.delete('scope');
const dBoundOnlyLocally = Object.values(dBindings).every(ks => ks.length > 0 && ks.every(k => (k.startsWith('param@') && ALL.includes(k.slice(6))) || k === 'var@' + DASH));
const notExposed = [...usedT].filter(n => !exposed.has(n)).sort();
const exposedUnused = [...exposed].filter(n => !usedT.has(n)).sort();
const kNotDefined = [...usedK].filter(n => !ALL.includes(n) && !PREV_FNS.includes(n));
const thisArgs = {};
for (const f of NEW_FILES) {
  traverse(fileAst[f], { FunctionDeclaration(p) { if (!ALL.includes(p.node.id.name)) return; let c = 0; p.traverse({ ThisExpression(q) { if (q.getFunctionParent() === p) c++; }, Identifier(q) { if (q.node.name === 'arguments' && q.getFunctionParent() === p) c++; } }); thisArgs[p.node.id.name] = c; } });
}
const thisArgsFree = ALL.every(n => thisArgs[n] === 0);
// ③ 실행
const loadOrder = app => { const html = read(path.join(app, 'index.html')); const tag = html.indexOf('src="' + MAIN); const out = []; const re = /src="(js\/stats-[^"?]+\.js)/g; let m; while ((m = re.exec(html))) if (m.index < tag) out.push(m[1]); return out.concat([MAIN]); };
const FIX = "(function(){var RD=Date;var T=RD.parse('2026-10-05T03:00:00Z');function D(){ if(!(this instanceof D)) return new RD(T).toString(); var a=[].slice.call(arguments); return a.length? new (Function.prototype.bind.apply(RD,[null].concat(a)))(): new RD(T);} D.prototype=RD.prototype; D.now=function(){return T;}; D.UTC=RD.UTC; D.parse=RD.parse; Date=D;" +
  "var s=1; Math.random=function(){ s=(s*16807)%2147483647; return (s-1)/2147483646; }; this.__seed=function(n){ s=n; };})();";
const mkWin = () => { const w = { console: { log() {}, warn() {}, error() {} } }; w.window = w; return w; };
const run = (w, rels, base) => { const ctx = vm.createContext(w); vm.runInContext(FIX, ctx); for (const r of rels) vm.runInContext(read(path.join(base, r)), ctx, { filename: r }); w.__ctx = ctx; return w; };
const orderBase = loadOrder(BASE), orderAfter = loadOrder(APP);
const before = run(mkWin(), orderBase, BASE);
const after = run(mkWin(), orderAfter, APP);
const keys = o => Object.keys(o).filter(k => !['window', 'console', '__seed', '__ctx'].includes(k)).sort();
const apiB = Object.keys(before.OurgoalUniversalStats), apiA = Object.keys(after.OurgoalUniversalStats);
const sameApi = JSON.stringify(apiB) === JSON.stringify(apiA);
const KIT = after.OurgoalUniversalStatsKit;
const movedSame = ALL.every(n => typeof KIT[n] === 'function' && ((n in before.OurgoalUniversalStats) === (n in after.OurgoalUniversalStats)) && (!(n in after.OurgoalUniversalStats) || after.OurgoalUniversalStats[n] === KIT[n]));
const globalsB = keys(before), globalsA = keys(after);
const sameGlobals = JSON.stringify(globalsB) === JSON.stringify(globalsA);
const scopeOk = [...exposed].every(n => KIT.scope[n] !== undefined);
const constants = {};
for (const name of CONSTS) {
  const vb = before.OurgoalUniversalStatsKit.scope[name], va = KIT.scope[name];
  constants[name] = { sameJson: JSON.stringify(vb) === JSON.stringify(va), sameObjectApi: !(name in after.OurgoalUniversalStats) || after.OurgoalUniversalStats[name] === va };
  constants[name].ok = constants[name].sameJson && constants[name].sameObjectApi && va !== undefined;
}
const M = after.OurgoalUniversalStats.METRIC_DIFFERENTIATED_MODELS;
const aliasKept = M.strength === M.big3 && M.health === M.big3;
// 단독 로드(부품 없이 한 파일만 — 법정 모듈 로드 탐침과 같은 조건): 원본·새 파일 각각
const standalone = {};
for (const f of [MAIN].concat(NEW_FILES)) standalone[f] = (() => { const w = mkWin(); try { const ctx = vm.createContext(w); vm.runInContext(read(path.join(APP, f)), ctx, { filename: f }); return { ok: true, api: !!w.OurgoalUniversalStats, kit: !!w.OurgoalUniversalStatsKit }; } catch (e) { return { ok: false, error: String(e && e.message || e) }; } })();
const standaloneOk = Object.values(standalone).every(x => x.ok) && standalone[MAIN].api;
// ④ 순수 함수(3차와 같은 16가지)
const B = before.OurgoalUniversalStats, A = after.OurgoalUniversalStats;
const genSample = U => U.generateDomainSample('big3').concat(U.generateDomainSample('running'), U.generateDomainSample('study'), U.generateDomainSample('hyrox'), U.generateDomainSample('coding'), U.generateDomainSample('sales'));
before.__seed(3); after.__seed(3);
const recsJson = JSON.stringify(genSample(B));
const sampleSame = recsJson === JSON.stringify(genSample(A));
const R = () => JSON.parse(recsJson);
const callBoth = (fn) => { let a, b, ea = null, eb = null; before.__seed(7); after.__seed(7); try { b = fn(B, before); } catch (e) { eb = String(e); } try { a = fn(A, after); } catch (e) { ea = String(e); } const jb = JSON.stringify(b === undefined ? null : b), ja = JSON.stringify(a === undefined ? null : a); return { same: jb === ja && ea === eb, error: eb, size: jb.length }; };
const entities = B.buildUniversalOntology(R()).map(o => o.name);
const ontologySame = JSON.stringify(B.buildUniversalOntology(R())) === JSON.stringify(A.buildUniversalOntology(R())) && JSON.stringify(A.buildUniversalOntology(R()).map(o => o.name)) === JSON.stringify(entities); // 양쪽 같은 횟수로 부른다(온톨로지가 지표 레지스트리를 늘린다)
const sMap = U => U.aggregateMultiSeries(R(), entities, 'primary', 'all', 'all');
const CSV = '날짜,종목,무게,횟수\n1924-07-05,스쿼트,100,5\n2025-01-06,벤치프레스,80,8\n2025/01/13,데드리프트,140,3\n';
const ts = U => U.aggregateMetricTimeSeries(R(), 'weight', '1year');
const pureCases = {
  ensureMetricConfig: callBoth(U => [U.ensureMetricConfig('weight'), U.ensureMetricConfig('tbl_새지표', { title: '새 지표', unit: '회' }), Object.keys(U.METRIC_CONFIGS).length]),
  extractMetricsFromRecord: callBoth(U => R().slice(0, 60).map(r => U.extractMetricsFromRecord(r))),
  discoverActiveMetrics: callBoth(U => U.discoverActiveMetrics(R())),
  aggregateMetricTimeSeries: callBoth(U => ['1year', '6months', '3months', '1week'].map(p => U.discoverActiveMetrics(R()).activeMetrics.map(m => U.aggregateMetricTimeSeries(R(), m.category, p)))),
  renderUniversalSvgChart: callBoth(U => U.renderUniversalSvgChart(ts(U))),
  aggregateMultiSeries: callBoth(U => ['all', '1y', '6m', '3m', '1m', '1w'].map(p => U.aggregateMultiSeries(R(), entities, 'primary', p, 'all'))),
  renderMultiSeriesSvg: callBoth(U => U.renderMultiSeriesSvg(sMap(U), { width: 520, height: 240 })),
  normalizeHistoricalDate: callBoth(U => ['1924-07-05', '1920.3.1', '2025/01/13 07:30', '19240705', 'abc', ''].map(s => U.normalizeHistoricalDate(s, 0))),
  parseCsvToUniversalRecords: callBoth(U => U.parseCsvToUniversalRecords(CSV, 'workout')),
  buildUniversalOntologyCustom: callBoth(U => U.buildUniversalOntology(R(), [{ name: '새스키마', unit: 'kg', theme: 'workout' }])),
  getChosung: callBoth(U => ['스쿼트', '벤치프레스', 'abc 데드', ''].map(s => U.getChosung(s))),
  matchQuery: callBoth(U => U.buildUniversalOntology(R()).slice(0, 12).map(e => ['ㅅ', 'ㅂㅊ', '스쿼', 'xyz', ''].map(q => U.matchQuery(e, q)))),
  computeDifferentiatedAnalysis: callBoth(U => Object.keys(U.METRIC_DIFFERENTIATED_MODELS).concat(['unknown_metric']).map(k => U.computeDifferentiatedAnalysis(k, ts(U)))),
  renderDifferentiatedReportCard: callBoth(U => Object.keys(U.METRIC_DIFFERENTIATED_MODELS).concat(['unknown_metric']).map(k => U.renderDifferentiatedReportCard(k, ts(U)))),
  generate52WeekPowerliftingSample: callBoth(U => U.generate52WeekPowerliftingSample()),
  generate1920sOlympicStrengthSample: callBoth(U => U.generate1920sOlympicStrengthSample()),
};
const pureSame = sampleSame && ontologySame && Object.values(pureCases).every(v => v.same && v.size > 4);
const jandi = {}; for (const f of NEW_FILES) jandi[f] = read(path.join(APP, f)).split('잔디').length - 1;
const mainLines = read(path.join(APP, MAIN)).split('\n').length - 1;
const report = {
  task: 'TASK-ES-428', equivalent: equiv.every(r => r.same), equivCount: equiv.length, equiv, contiguous, shared: [...sharedB.entries()].map(([n, s]) => ({ name: n, fromHead: s.fromHead })), dInserted: insertAt.size, varDropped: dropAt.size, sectionParamsOk,
  prevPartsUnchanged, loadOrderAfter: orderAfter, exposed: [...exposed].sort(), imported: [...imported].sort(), notImported, leftFunctionDefsInMain: leftDefs, remainingMainFunctions: remainingFns, files, mainLines,
  usedT: [...usedT].sort(), notExposed, exposedUnused, usedK: [...usedK].sort(), kNotDefined, dBindings, dBoundOnlyLocally, thisArgs, thisArgsFree,
  constants, aliasKept, standalone, standaloneOk, sampleSame, ontologySame, pureCases, pureSame, jandiInParts: jandi,
  runtime: { apiKeys: apiA.length, sameApiKeysAndOrder: sameApi, movedFunctionsAreKitFunctions: movedSame, windowNamesBefore: globalsB.length, sameWindowNames: sameGlobals, newWindowNames: globalsA.filter(k => !globalsB.includes(k)), scopeGettersResolve: scopeOk },
};
const ok = report.equivalent && contiguous && sectionParamsOk && prevPartsUnchanged && leftDefs.length === 0 && notImported.length === 0 && notExposed.length === 0 && exposedUnused.length === 0 && kNotDefined.length === 0 && thisArgsFree && dBoundOnlyLocally
  && Object.values(files).every(x => x.leaksIIFEName.length === 0 && x.lines <= 800) && mainLines <= 800 && sameApi && movedSame && sameGlobals && scopeOk && Object.values(constants).every(c => c.ok) && aliasKept && standaloneOk && pureSame && Object.values(jandi).every(x => x === 0);
report.ok = ok;
console.log(JSON.stringify({ ok, equivalent: report.equivalent, equivCount: equiv.length, shared: report.shared.length, dInserted: insertAt.size, varDropped: dropAt.size, sectionParamsOk, prevPartsUnchanged, leftDefs, notImported, notExposed, exposedUnused, kNotDefined, thisArgsFree, dBindings, dBoundOnlyLocally, constantsOk: Object.values(constants).every(c => c.ok), aliasKept, standalone, standaloneOk, pureSame, runtime: report.runtime, mainLines, files: Object.fromEntries(Object.entries(files).filter(([k]) => NEW_FILES.includes(k)).map(([k, v]) => [k, v.lines + (v.leaksIIFEName.length ? ' LEAK ' + v.leaksIIFEName : '')])) }, null, 1));
for (const r of equiv) if (!r.same) console.log('DIFF', JSON.stringify(r));
for (const [k, v] of Object.entries(pureCases)) if (!v.same || v.size <= 4) console.log('DIFF', k, JSON.stringify(v));
if (process.env.MODULE_SPLIT_OUT) fs.writeFileSync(path.join(process.env.MODULE_SPLIT_OUT, 'verify-stats-split-4.json'), JSON.stringify(report, null, 1));
process.exitCode = ok ? 0 : 1;
