'use strict';
// 통계 세포 쪼개기 3차(#TASK-ES-405) 검사 — 2차 verify-stats-split-2.js 와 같은 기준에 구획 분할·상수 공장 맞대기를 더했다.
//  ① 글자(토큰열, 차이 허용: 'S.'·'K.' 접두뿐)
//     - 함수 단위로 옮긴 함수: 이전 전 원본의 함수 = 새 파일의 함수
//     - 카탈로그 상수 6개: 옮기지 않는다 — 원본에 남은 `var X = <값>;` 이 이전 전과 같다(부품은 S.X getter 로 같은 객체를 읽는다)
//     - 구획 6개: 이전 전 generateDomainSample 의 `if(domainKey === '<키>'){ … }` 블록 본문 = 구획 함수 본문
//     - 조립자 generateDomainSample: 이전 전 함수에서 구획 블록 본문을 `<구획 함수>(<인자>);` 로 바꾼 토큰열 = 새 함수
//     - 원본에 남은 최상위 함수(renderUniversalStatsDashboard 등)·공개 API 객체·차등 모델 별칭 2줄·꼬리 문: 이전 전과 같다
//     - 1·2차 부품 7개 글자 그대로
//  ② 누수: 부품에 원본 IIFE 이름이 접두 없이 남은 곳 0, S.<이름> 모두 노출, K.<이름> 모두 키트 함수, 원본에 남은 옮긴 함수 정의 0, 원본이 쓰는 옮긴 함수 모두 가져옴,
//          통로로 부르는 원본 함수 본문 최상위 this·arguments 0
//  ③ 실행(브라우저 순서 — index.html 태그 순서의 부품 → 원본): 공개 API 키·순서, window 이름 동일, 옮긴 함수 = 키트 함수, 상수 같은 객체 참조(API·통로 getter·원본) ·
//     값 동일(JSON + 함수 값 개수), 차등 모델 별칭(strength·health === big3) 유지, 원본을 한 번 더 돌리면 새 객체(이전과 같이 실행마다 새 객체)
//  ④ 같은 입력(샘플·난수·시각 고정)으로 순수 함수 결과 동일(2차 10가지 + 온톨로지·차등 분석 6가지)  ⑤ 부품 잔디 0
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node verify-stats-split-3.js <이전 전 APP_DIR> <APP_DIR>
const fs = require('fs'), path = require('path'), vm = require('vm');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const BASE = process.argv[2], APP = process.argv[3];
const MAIN = 'js/universal-stats.js';
const FN_MOVED = {
  'js/stats-samples.js': ['generate52WeekPowerliftingSample', 'generate1920sOlympicStrengthSample'],
  'js/stats-ontology.js': ['getChosung', 'matchQuery', 'inferDomainKey', 'buildUniversalOntology'],
  'js/stats-export.js': ['exportCleanCsv', 'captureChartSnapshot'],
  'js/stats-fullscreen.js': ['openStatsFullscreenModal'],
  'js/stats-differentiated.js': ['computeDifferentiatedAnalysis', 'renderDifferentiatedReportCard', 'openDifferentiatedMetricConfigModal'],
};
const CONSTS = [['METRIC_CONFIGS'], ['SAMPLE_THEMES'], ['THEME_METRIC_SPECS'], ['RAW_52W_POWERLIFTING_DATA'], ['DOMAINS'], ['METRIC_DIFFERENTIATED_MODELS']];
const SECTIONS = { hyrox: ['pushHyroxSample', 'js/stats-sample-fitness.js'], running: ['pushRunningSample', 'js/stats-sample-fitness.js'], big3: ['pushBig3Sample', 'js/stats-sample-fitness.js'], study: ['pushStudySample', 'js/stats-sample-growth.js'], coding: ['pushCodingSample', 'js/stats-sample-growth.js'], sales: ['pushSalesSample', 'js/stats-sample-growth.js'] };
const NEW_FILES = ['js/stats-samples.js', 'js/stats-sample-fitness.js', 'js/stats-sample-growth.js', 'js/stats-ontology.js', 'js/stats-export.js', 'js/stats-fullscreen.js', 'js/stats-differentiated.js'];
const PREV_PARTS = ['js/stats-taxonomy.js', 'js/stats-data-grid.js', 'js/stats-lenses.js', 'js/stats-metrics.js', 'js/stats-charts.js', 'js/stats-import.js', 'js/stats-data-menu.js'];
const PREV_FNS = ['openTaxonomyManagerModal', 'openUniversalDataGrid', 'openRowEditModal', 'computeCrossRatioSeries', 'renderCrossRatioSvg', 'renderRadarSvg', 'computeCadenceData', 'renderCadenceSvg', 'generateStatisticalDiagnosticReport',
  'ensureMetricConfig', 'extractMetricsFromRecord', 'discoverActiveMetrics', 'aggregateMetricTimeSeries', 'renderUniversalSvgChart', 'aggregateMultiSeries', 'calcNiceStep', 'renderMultiSeriesSvg', 'normalizeHistoricalDate', 'parseCsvToUniversalRecords', 'openUniversalImportModal', 'openGuideModal', 'openDataManagementModal'];
const ALL = [].concat(...Object.values(FN_MOVED), 'generateDomainSample', Object.values(SECTIONS).map(s => s[0]));
const read = f => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const val = t => (t.type.label === 'name' || t.type.keyword) ? String(t.value) : (t.value !== undefined ? t.type.label + ':' + String(t.value) : t.type.label);
const norm = toks => {
  const vals = toks.filter(t => t.type !== 'CommentLine' && t.type !== 'CommentBlock').map(val);
  const out = [];
  for (let i = 0; i < vals.length; i++) {
    if ((vals[i] === 'S' || vals[i] === 'K') && vals[i + 1] === '.' && /^[A-Za-z_$]/.test(vals[i + 2] || '')) { i += 1; continue; }
    out.push(vals[i]);
  }
  return out;
};
const P = f => parser.parse(read(f), { sourceType: 'script', tokens: true });
const toks = (ast, a, b) => norm(ast.tokens.filter(t => t.start >= a && t.end <= b));
const iifeBody = a => a.program.body[0].expression.callee.body.body;
const topFns = a => { const m = {}; for (const x of iifeBody(a)) if (x.type === 'FunctionDeclaration') m[x.id.name] = x; return m; };
const cmp = (label, a, b) => { const same = a.length === b.length && a.every((v, i) => v === b[i]); let at = -1; if (!same) for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) { at = i; break; } return { what: label, tokensOrig: a.length, tokensNew: b.length, same, firstDiff: same ? null : { i: at, orig: a.slice(Math.max(0, at - 4), at + 6), neu: b.slice(Math.max(0, at - 4), at + 6) } }; };
// ① 글자
const oast = P(path.join(BASE, MAIN)), ofns = topFns(oast);
const mastT = P(path.join(APP, MAIN)), mfns = topFns(mastT);
const equiv = [];
const fileAst = {}; for (const f of NEW_FILES) fileAst[f] = P(path.join(APP, f));
const nf = f => topFns(fileAst[f]);
for (const [f, names] of Object.entries(FN_MOVED)) for (const n of names) equiv.push(Object.assign({ file: f }, cmp('fn ' + n, toks(oast, ofns[n].start, ofns[n].end), toks(fileAst[f], nf(f)[n].start, nf(f)[n].end))));
const oTop = iifeBody(oast), mTop = iifeBody(mastT);
for (const [name] of CONSTS) {
  const od = oTop.find(x => x.type === 'VariableDeclaration' && x.declarations[0].id.name === name);
  const md = mTop.find(x => x.type === 'VariableDeclaration' && x.declarations[0].id.name === name);
  equiv.push(Object.assign({ file: MAIN }, cmp('main const ' + name, toks(oast, od.start, od.end), md ? toks(mastT, md.start, md.end) : ['<없음>'])));
}
// 구획: 이전 전 사슬에서 블록을 찾는다
const ogds = ofns.generateDomainSample;
const chain = []; { let c = ogds.body.body.find(x => x.type === 'IfStatement'); while (c && c.type === 'IfStatement') { chain.push(c); c = c.alternate; } }
const blockOf = {};
for (const c of chain) if (c.test.type === 'BinaryExpression' && c.test.right.type === 'StringLiteral' && SECTIONS[c.test.right.value]) blockOf[c.test.right.value] = c.consequent;
const nsh = nf('js/stats-samples.js').generateDomainSample;
const sectionArgs = {};
for (const [key, [fnName, f]] of Object.entries(SECTIONS)) {
  const ob = blockOf[key];
  const sfn = nf(f)[fnName];
  sectionArgs[key] = sfn.params.map(p => p.name);
  equiv.push(Object.assign({ file: f }, cmp('section ' + key + ' → ' + fnName, toks(oast, ob.start + 1, ob.end - 1), toks(fileAst[f], sfn.body.start + 1, sfn.body.end - 1))));
}
{ // 조립자
  const base = [];
  const blocks = Object.keys(SECTIONS).map(k => blockOf[k]).sort((a, b) => a.start - b.start);
  let pos = ogds.start;
  for (const b of blocks) {
    base.push(...toks(oast, pos, b.start + 1));
    const key = Object.keys(blockOf).find(k => blockOf[k] === b);
    const args = sectionArgs[key];
    base.push(SECTIONS[key][0], '(', ...args.flatMap((a, i) => i ? [',', a] : [a]), ')', ';');
    pos = b.end - 1;
  }
  base.push(...toks(oast, pos, ogds.end));
  equiv.push(Object.assign({ file: 'js/stats-samples.js' }, cmp('assembler generateDomainSample', base, toks(fileAst['js/stats-samples.js'], nsh.start, nsh.end))));
}
// 원본에 남은 것
const remainingFns = Object.keys(mfns);
for (const n of remainingFns) equiv.push(Object.assign({ file: MAIN }, cmp('main fn ' + n, ofns[n] ? toks(oast, ofns[n].start, ofns[n].end) : ['<없음>'], toks(mastT, mfns[n].start, mfns[n].end))));
const tailOf = (ast, body) => { const i = body.findIndex(x => x.type === 'VariableDeclaration' && x.declarations[0].id.name === 'api'); return toks(ast, body[i].start, body[body.length - 1].end); };
equiv.push(Object.assign({ file: MAIN }, cmp('main api·tail', tailOf(oast, oTop), tailOf(mastT, mTop))));
const aliasOf = (ast, body) => body.filter(x => x.type === 'ExpressionStatement' && x.expression.type === 'AssignmentExpression' && x.expression.left.type === 'MemberExpression' && x.expression.left.object.name === 'METRIC_DIFFERENTIATED_MODELS').flatMap(x => toks(ast, x.start, x.end));
equiv.push(Object.assign({ file: MAIN }, cmp('main alias lines', aliasOf(oast, oTop), aliasOf(mastT, mTop))));
const prevPartsUnchanged = PREV_PARTS.every(f => read(path.join(BASE, f)) === read(path.join(APP, f)));
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
for (const f of PREV_PARTS.concat(NEW_FILES)) {
  const fa = parser.parse(read(path.join(APP, f)), { sourceType: 'script' });
  const leaks = new Set(), globals = new Set();
  traverse(fa, {
    Identifier(p) {
      const par = p.parent;
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
  files[f] = { lines: read(path.join(APP, f)).split('\n').length - 1, globals: [...globals].sort(), leaksIIFEName: [...leaks].sort() };
}
usedK.delete('scope');
const notExposed = [...usedT].filter(n => !exposed.has(n)).sort();
const exposedUnused = [...exposed].filter(n => !usedT.has(n)).sort();
const kNotDefined = [...usedK].filter(n => !ALL.includes(n) && !PREV_FNS.includes(n));
const bridgeThis = {};
for (const n of exposed) {
  const b = iife.scope.bindings[n];
  if (!b || !b.path.isFunctionDeclaration()) continue;
  let c = 0;
  b.path.traverse({ ThisExpression(p) { if (p.getFunctionParent() === b.path) c++; }, Identifier(p) { if (p.node.name === 'arguments' && p.getFunctionParent() === b.path) c++; } });
  bridgeThis[n] = c;
}
const bridgeThisFree = Object.values(bridgeThis).every(c => c === 0);
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
const fnCount = o => { let c = 0; const seen = new Set(); (function walk(x) { if (!x || typeof x !== 'object' || seen.has(x)) return; seen.add(x); for (const k of Object.keys(x)) { if (typeof x[k] === 'function') c++; else walk(x[k]); } })(o); return c; };
const constants = {};
for (const [name] of CONSTS) {
  let vb = vm.runInContext('OurgoalUniversalStatsKit && OurgoalUniversalStatsKit.scope && OurgoalUniversalStatsKit.scope["' + name + '"]', before.__ctx);
  let via = vb !== undefined ? 'scope getter' : 'api';
  if (vb === undefined && !(name in before.OurgoalUniversalStats)) { const od = oTop.find(x => x.type === 'VariableDeclaration' && x.declarations[0].id.name === name).declarations[0].init; vb = vm.runInNewContext('(' + read(path.join(BASE, MAIN)).slice(od.start, od.end) + ')'); via = 'base source literal (no free names)'; }
  const va = KIT.scope[name];
  const inApi = name in after.OurgoalUniversalStats;
  constants[name] = {
    sameObjectApiAndScope: !inApi || after.OurgoalUniversalStats[name] === va,
    sameJson: JSON.stringify(vb !== undefined ? vb : before.OurgoalUniversalStats[name]) === JSON.stringify(va),
    functionValues: [fnCount(vb !== undefined ? vb : before.OurgoalUniversalStats[name]), fnCount(va)],
    baseReadVia: via,
  };
  constants[name].ok = constants[name].sameObjectApiAndScope && constants[name].sameJson && constants[name].functionValues[0] === constants[name].functionValues[1] && va !== undefined;
}
const M = after.OurgoalUniversalStats.METRIC_DIFFERENTIATED_MODELS;
const aliasKept = M.strength === M.big3 && M.health === M.big3;
// 원본을 한 번 더 돌리면(키트는 그대로) 상수는 새 객체 — 이전 전도 실행마다 새 객체였다
const firstMC = after.OurgoalUniversalStats.METRIC_CONFIGS;
vm.runInContext(read(path.join(APP, MAIN)), after.__ctx, { filename: MAIN });
const freshPerRun = after.OurgoalUniversalStats.METRIC_CONFIGS !== firstMC && KIT.scope.METRIC_CONFIGS === after.OurgoalUniversalStats.METRIC_CONFIGS && JSON.stringify(firstMC) === JSON.stringify(after.OurgoalUniversalStats.METRIC_CONFIGS);
vm.runInContext(read(path.join(BASE, MAIN)), before.__ctx, { filename: MAIN }); // 양쪽 같은 상태로
// 원본 혼자 읽혀도(부품 없이 — 법정 모듈 로드 탐침과 같은 조건) 멈추지 않고 공개 API 를 등록하는가(이전 전과 같음)
const standalone = (() => { const w = mkWin(); w.document = undefined; try { const ctx = vm.createContext(w); vm.runInContext(read(path.join(APP, MAIN)), ctx, { filename: MAIN }); return { ok: true, api: !!w.OurgoalUniversalStats }; } catch (e) { return { ok: false, error: String(e && e.message || e) }; } })();
const standaloneOk = standalone.ok && standalone.api;
// ④ 순수 함수
const B = before.OurgoalUniversalStats, A = after.OurgoalUniversalStats;
const genSample = U => U.generateDomainSample('big3').concat(U.generateDomainSample('running'), U.generateDomainSample('study'), U.generateDomainSample('hyrox'), U.generateDomainSample('coding'), U.generateDomainSample('sales'));
before.__seed(3); after.__seed(3);
const recsJson = JSON.stringify(genSample(B));
const sampleSame = recsJson === JSON.stringify(genSample(A));
const R = () => JSON.parse(recsJson);
const callBoth = (fn) => { let a, b, ea = null, eb = null; before.__seed(7); after.__seed(7); try { b = fn(B, before); } catch (e) { eb = String(e); } try { a = fn(A, after); } catch (e) { ea = String(e); } const jb = JSON.stringify(b === undefined ? null : b), ja = JSON.stringify(a === undefined ? null : a); return { same: jb === ja && ea === eb, error: eb, size: jb.length }; };
const entities = B.buildUniversalOntology(R()).map(o => o.name);
const ontologySame = JSON.stringify(B.buildUniversalOntology(R())) === JSON.stringify(A.buildUniversalOntology(R()));
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
  equivalent: equiv.every(r => r.same), equivCount: equiv.length, equiv, prevPartsUnchanged, loadOrderAfter: orderAfter, exposed: [...exposed].sort(), imported: [...imported].sort(), notImported, leftFunctionDefsInMain: leftDefs, remainingMainFunctions: remainingFns, files, mainLines,
  usedT: [...usedT].sort(), notExposed, exposedUnused, usedK: [...usedK].sort(), kNotDefined, bridgeThis, bridgeThisFree,
  constants, aliasKept, freshPerRun, standalone, standaloneOk, sampleSame, ontologySame, pureCases, pureSame, jandiInParts: jandi,
  runtime: { apiKeys: apiA.length, sameApiKeysAndOrder: sameApi, movedFunctionsAreKitFunctions: movedSame, windowNamesBefore: globalsB.length, sameWindowNames: sameGlobals, newWindowNames: globalsA.filter(k => !globalsB.includes(k)), scopeGettersResolve: scopeOk },
};
const ok = report.equivalent && prevPartsUnchanged && leftDefs.length === 0 && notImported.length === 0 && notExposed.length === 0 && exposedUnused.length === 0 && kNotDefined.length === 0 && bridgeThisFree
  && Object.values(files).every(x => x.leaksIIFEName.length === 0 && x.lines <= 800) && sameApi && movedSame && sameGlobals && scopeOk && Object.values(constants).every(c => c.ok) && aliasKept && freshPerRun && standaloneOk && pureSame && Object.values(jandi).every(x => x === 0);
report.ok = ok;
console.log(JSON.stringify({ ok, equivalent: report.equivalent, equivCount: equiv.length, prevPartsUnchanged, leftDefs, notImported, notExposed, exposedUnused, kNotDefined, bridgeThisFree, constantsOk: Object.values(constants).every(c => c.ok), aliasKept, freshPerRun, standaloneOk, pureSame, runtime: report.runtime, mainLines, files: Object.fromEntries(Object.entries(files).map(([k, v]) => [k, v.lines + (v.leaksIIFEName.length ? ' LEAK ' + v.leaksIIFEName : '')])) }, null, 1));
for (const r of equiv) if (!r.same) console.log('DIFF', JSON.stringify(r));
for (const [k, v] of Object.entries(pureCases)) if (!v.same || v.size <= 4) console.log('DIFF', k, JSON.stringify(v));
for (const [k, v] of Object.entries(constants)) if (!v.ok) console.log('DIFF const', k, JSON.stringify(v));
if (process.env.MODULE_SPLIT_OUT) fs.writeFileSync(path.join(process.env.MODULE_SPLIT_OUT, 'verify-stats-split-3.json'), JSON.stringify(report, null, 1));
process.exitCode = ok ? 0 : 1;
