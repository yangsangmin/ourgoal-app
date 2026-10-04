'use strict';
// 통계 세포 쪼개기 2차(#TASK-ES-401) 검사 — 1차 verify-stats-split.js 와 같은 기준:
//  ① 글자: 옮긴 함수마다 이전 전 js/universal-stats.js 의 토큰열과 옮긴 파일의 토큰열이 같은가(차이 허용: 'S.'·'K.' 접두뿐)
//  ② 누수: 옮긴 파일에 원본 IIFE 스코프 이름이 접두 없이 남아(전역으로 새어) 다른 값을 읽는 곳 0, S.<이름> 이 모두 노출됐는가,
//          K.<이름> 이 모두 키트 함수인가, 옮긴 함수 정의가 원본에 남지 않았는가, 원본이 쓰는 옮긴 함수가 모두 가져와졌는가,
//          통로로 부르는 원본 함수의 본문 최상위에 this·arguments 가 없는가(S.f() 로 부르면 this 가 S 가 되므로)
//  ③ 실행: 브라우저와 같은 순서(1차 부품 3개 → 2차 부품 4개 → 원본, 이전 전은 1차 부품 3개 → 원본)로 읽었을 때
//          OurgoalUniversalStats 키·순서가 같고 옮긴 함수가 키트 함수와 같은 객체인가, window.* 이름 목록이 이전 전과 같은가
//  ④ 같은 입력(샘플 big3·running·study 합본, 난수·현재 시각 고정)으로 옮긴 순수 함수(메트릭·차트·가져오기 11개)를 이전 전·후 불러 결과가 같은가
//  ⑤ 옮긴 부품의 잔디 글자 0(금고 verify-integrity-gate.js 가 원본 한 파일만 보므로 따로 잰다)
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node verify-stats-split-2.js <이전 전 APP_DIR> <APP_DIR>
const fs = require('fs'), path = require('path'), vm = require('vm');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const BASE = process.argv[2], APP = process.argv[3];
const MOVED = {
  'js/stats-metrics.js': ['ensureMetricConfig', 'extractMetricsFromRecord', 'discoverActiveMetrics', 'aggregateMetricTimeSeries'],
  'js/stats-charts.js': ['renderUniversalSvgChart', 'aggregateMultiSeries', 'calcNiceStep', 'renderMultiSeriesSvg'],
  'js/stats-import.js': ['normalizeHistoricalDate', 'parseCsvToUniversalRecords', 'openUniversalImportModal'],
  'js/stats-data-menu.js': ['openGuideModal', 'openDataManagementModal'],
};
const PREV_PARTS = ['js/stats-taxonomy.js', 'js/stats-data-grid.js', 'js/stats-lenses.js']; // 1차(#TASK-ES-392) 부품 — 이번 PR 은 안 고친다
const PREV_FNS = ['openTaxonomyManagerModal', 'openUniversalDataGrid', 'openRowEditModal', 'computeCrossRatioSeries', 'renderCrossRatioSvg', 'renderRadarSvg', 'computeCadenceData', 'renderCadenceSvg', 'generateStatisticalDiagnosticReport'];
const MAIN = 'js/universal-stats.js';
const ALL = [].concat(...Object.values(MOVED));
const read = f => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const norm = toks => {
  toks = toks.filter(t => t.type !== 'CommentLine' && t.type !== 'CommentBlock');
  const vals = toks.map(t => (t.type.label === 'name' || t.type.keyword) ? String(t.value) : (t.value !== undefined ? t.type.label + ':' + String(t.value) : t.type.label));
  const out = [];
  for (let i = 0; i < vals.length; i++) {
    if ((vals[i] === 'S' || vals[i] === 'K') && vals[i + 1] === '.' && /^[A-Za-z_$]/.test(vals[i + 2] || '')) { i += 1; continue; }
    out.push(vals[i]);
  }
  return out;
};
const iifeBody = a => a.program.body[0].expression.callee.body.body;
const topFns = a => { const m = {}; for (const x of iifeBody(a)) if (x.type === 'FunctionDeclaration') m[x.id.name] = x; return m; };
// ① 글자
const oast = parser.parse(read(path.join(BASE, MAIN)), { sourceType: 'script', tokens: true });
const ofns = topFns(oast);
const equiv = [];
for (const [f, names] of Object.entries(MOVED)) {
  const fast = parser.parse(read(path.join(APP, f)), { sourceType: 'script', tokens: true });
  const nfns = topFns(fast);
  for (const n of names) {
    const a = norm(oast.tokens.filter(t => t.start >= ofns[n].start && t.end <= ofns[n].end));
    const b = norm(fast.tokens.filter(t => t.start >= nfns[n].start && t.end <= nfns[n].end));
    const same = a.length === b.length && a.every((v, i) => v === b[i]);
    let at = -1; if (!same) for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) { at = i; break; }
    equiv.push({ fn: n, file: f, tokensOrig: a.length, tokensNew: b.length, same, firstDiff: same ? null : { i: at, orig: a.slice(at - 3, at + 5), neu: b.slice(at - 3, at + 5) } });
  }
}
// 1차 부품은 그대로인가(글자 동일)
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
const notImported = ALL.concat(PREV_FNS).filter(n => !imported.has(n));
const files = {}; const usedT = new Set(); const usedK = new Set();
for (const f of PREV_PARTS.concat(Object.keys(MOVED))) {
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
  const lines = read(path.join(APP, f)).split('\n').length - 1;
  files[f] = { lines, globals: [...globals].sort(), leaksIIFEName: [...leaks].sort() };
}
usedK.delete('scope');
const notExposed = [...usedT].filter(n => !exposed.has(n)).sort();
const exposedUnused = [...exposed].filter(n => !usedT.has(n)).sort();
const kNotDefined = [...usedK].filter(n => !ALL.includes(n) && !PREV_FNS.includes(n));
// 통로로 부르는 원본 함수 본문 최상위의 this·arguments
const bridgeThis = {};
for (const n of exposed) {
  const b = iife.scope.bindings[n];
  if (!b || !b.path.isFunctionDeclaration()) continue;
  let c = 0;
  b.path.traverse({ ThisExpression(p) { if (p.getFunctionParent() === b.path) c++; }, Identifier(p) { if (p.node.name === 'arguments' && p.getFunctionParent() === b.path) c++; } });
  bridgeThis[n] = c;
}
const bridgeThisFree = Object.values(bridgeThis).every(c => c === 0);
// ③ 실행(브라우저와 같은 순서) — 난수·현재 시각 고정(④ 비교용)
const FIX = "(function(){var RD=Date;var T=RD.parse('2026-10-05T03:00:00Z');function D(){ if(!(this instanceof D)) return new RD(T).toString(); var a=[].slice.call(arguments); return a.length? new (Function.prototype.bind.apply(RD,[null].concat(a)))(): new RD(T);} D.prototype=RD.prototype; D.now=function(){return T;}; D.UTC=RD.UTC; D.parse=RD.parse; Date=D;" +
  "var s=1; Math.random=function(){ s=(s*16807)%2147483647; return (s-1)/2147483646; }; this.__seed=function(n){ s=n; };})();";
const mkWin = () => { const w = { console: { log() {}, warn() {}, error() {} } }; w.window = w; return w; };
const run = (w, rels, base) => { const ctx = vm.createContext(w); vm.runInContext(FIX, ctx); for (const r of rels) vm.runInContext(read(path.join(base, r)), ctx, { filename: r }); return w; };
const before = run(mkWin(), [...PREV_PARTS, MAIN], BASE);
const after = run(mkWin(), [...PREV_PARTS, ...Object.keys(MOVED), MAIN], APP);
const keys = o => Object.keys(o).filter(k => k !== 'window' && k !== 'console' && k !== '__seed').sort();
const apiB = Object.keys(before.OurgoalUniversalStats), apiA = Object.keys(after.OurgoalUniversalStats);
const sameApi = JSON.stringify(apiB) === JSON.stringify(apiA);
const movedSame = ALL.every(n => typeof after.OurgoalUniversalStatsKit[n] === 'function' && ((n in before.OurgoalUniversalStats) === (n in after.OurgoalUniversalStats)) && (!(n in after.OurgoalUniversalStats) || after.OurgoalUniversalStats[n] === after.OurgoalUniversalStatsKit[n]));
const movedNotInApi = ALL.filter(n => !(n in after.OurgoalUniversalStats));
const globalsB = keys(before), globalsA = keys(after);
const sameGlobals = JSON.stringify(globalsB) === JSON.stringify(globalsA);
const scopeOk = [...exposed].every(n => after.OurgoalUniversalStatsKit.scope[n] !== undefined);
// ④ 같은 입력으로 불러 비교 — 입력은 이전 전 실행의 샘플 생성기로 한 번 만들고, 부를 때마다 JSON 복제본을 넘긴다(함수가 입력을 고쳐도 서로 안 섞인다)
const B = before.OurgoalUniversalStats, A = after.OurgoalUniversalStats;
// 원본 상태(METRIC_CONFIGS 등록 등)를 양쪽에서 같게 두려고 샘플 생성·온톨로지는 양쪽 모두 부른다(난수·시각 고정 — 결과도 맞댄다)
const genSample = U => U.generateDomainSample('big3').concat(U.generateDomainSample('running'), U.generateDomainSample('study'));
before.__seed(3); after.__seed(3);
const recsJson = JSON.stringify(genSample(B));
const sampleSame = recsJson === JSON.stringify(genSample(A));
const R = () => JSON.parse(recsJson);
const callBoth = (fn) => { let a, b, ea = null, eb = null; before.__seed(7); after.__seed(7); try { b = fn(B, before); } catch (e) { eb = String(e); } try { a = fn(A, after); } catch (e) { ea = String(e); } const jb = JSON.stringify(b === undefined ? null : b), ja = JSON.stringify(a === undefined ? null : a); return { same: jb === ja && ea === eb, error: eb, size: jb.length }; };
const entities = B.buildUniversalOntology(R()).map(o => o.name);
const ontologySame = JSON.stringify(entities) === JSON.stringify(A.buildUniversalOntology(R()).map(o => o.name));
const sMap = U => U.aggregateMultiSeries(R(), entities, 'primary', 'all', 'all');
const CSV = '날짜,종목,무게,횟수\n1924-07-05,스쿼트,100,5\n2025-01-06,벤치프레스,80,8\n2025/01/13,데드리프트,140,3\n';
const pureCases = {
  ensureMetricConfig: callBoth(U => [U.ensureMetricConfig('weight'), U.ensureMetricConfig('tbl_새지표', { title: '새 지표', unit: '회' }), Object.keys(U.METRIC_CONFIGS).length]),
  extractMetricsFromRecord: callBoth(U => R().slice(0, 60).map(r => U.extractMetricsFromRecord(r))),
  discoverActiveMetrics: callBoth(U => U.discoverActiveMetrics(R())),
  aggregateMetricTimeSeries: callBoth(U => ['1year', '6months', '3months', '1week'].map(p => U.discoverActiveMetrics(R()).activeMetrics.map(m => U.aggregateMetricTimeSeries(R(), m.category, p)))),
  renderUniversalSvgChart: callBoth(U => U.renderUniversalSvgChart(U.aggregateMetricTimeSeries(R(), 'weight', '1year'))),
  renderUniversalSvgChartEmpty: callBoth(U => U.renderUniversalSvgChart(null)),
  aggregateMultiSeries: callBoth(U => ['all', '1y', '6m', '3m', '1m', '1w'].map(p => U.aggregateMultiSeries(R(), entities, 'primary', p, 'all'))),
  renderMultiSeriesSvg: callBoth(U => U.renderMultiSeriesSvg(sMap(U), { width: 520, height: 240 })),
  normalizeHistoricalDate: callBoth(U => ['1924-07-05', '1920.3.1', '2025/01/13 07:30', '19240705', 'abc', ''].map(s => U.normalizeHistoricalDate(s, 0))),
  parseCsvToUniversalRecords: callBoth(U => U.parseCsvToUniversalRecords(CSV, 'workout')),
};
const pureSame = sampleSame && ontologySame && Object.values(pureCases).every(v => v.same && v.size > 4);
const jandi = {}; for (const f of Object.keys(MOVED)) jandi[f] = read(path.join(APP, f)).split('잔디').length - 1;
const mainLines = read(path.join(APP, MAIN)).split('\n').length - 1;
const report = {
  equivalent: equiv.every(r => r.same), equiv, prevPartsUnchanged, exposed: [...exposed].sort(), imported: [...imported].sort(), notImported, leftFunctionDefsInMain: leftDefs, files, mainLines,
  usedT: [...usedT].sort(), notExposed, exposedUnused, usedK: [...usedK].sort(), kNotDefined, bridgeThis, bridgeThisFree,
  sampleSame, ontologySame, pureCases, pureSame, jandiInParts: jandi,
  runtime: { apiKeys: apiA.length, sameApiKeysAndOrder: sameApi, movedFunctionsAreKitFunctions: movedSame, movedNotInApi, windowNamesBefore: globalsB.length, sameWindowNames: sameGlobals, newWindowNames: globalsA.filter(k => !globalsB.includes(k)), scopeGettersResolve: scopeOk },
};
const ok = report.equivalent && prevPartsUnchanged && leftDefs.length === 0 && notImported.length === 0 && notExposed.length === 0 && exposedUnused.length === 0 && kNotDefined.length === 0 && bridgeThisFree
  && Object.values(files).every(x => x.leaksIIFEName.length === 0 && x.lines <= 800) && sameApi && movedSame && sameGlobals && scopeOk && pureSame && Object.values(jandi).every(x => x === 0);
report.ok = ok;
console.log(JSON.stringify({ ok, equivalent: report.equivalent, prevPartsUnchanged, notImported, notExposed, exposedUnused, kNotDefined, bridgeThis, pureSame, runtime: report.runtime, files, mainLines }, null, 1));
for (const [k, v] of Object.entries(pureCases)) if (!v.same || v.size <= 4) console.log('DIFF', k, JSON.stringify(v));
if (process.env.MODULE_SPLIT_OUT) fs.writeFileSync(path.join(process.env.MODULE_SPLIT_OUT, 'verify-stats-split-2.json'), JSON.stringify(report, null, 1));
process.exitCode = ok ? 0 : 1;
