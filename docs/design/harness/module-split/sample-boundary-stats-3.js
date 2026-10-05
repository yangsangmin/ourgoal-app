'use strict';
// 통계 세포 쪼개기 3차(#TASK-ES-405) 구획 경계 검사기 — generateDomainSample(이전 전 970줄)을 도메인 구획별 하위 함수로 떼기 전에 먼저 만든다.
// 같은 씨앗(Math.random)·고정 시각(Date) 두 가지에서 모든 도메인 키의 출력이 이전 전과 assert.deepStrictEqual 로 같은지 맞댄다.
//  도메인 키 = 이전 전 원본의 generateDomainSample 안 `domainKey === '<키>'` 글자 전부 + THEME_METRIC_SPECS 객체의 키 전부 + SAMPLE_THEMES 카드 키 전부 + 없는 키 1개.
//  과거 샘플 generate52WeekPowerliftingSample·generate1920sOlympicStrengthSample 도 같이 맞댄다(이번에 같이 옮긴다).
//  두 앱은 브라우저와 같은 순서(index.html 의 js/stats-*.js 태그 순서 → js/universal-stats.js)로 vm 에 읽는다. 다른 vm 의 객체는 원형이 달라 JSON 왕복 뒤 비교한다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node sample-boundary-stats-3.js <이전 전 APP_DIR> <APP_DIR> [out.json]
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const [BASE, APP, OUT] = process.argv.slice(2);
const read = f => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const MAIN = 'js/universal-stats.js';
function loadOrder(app) {
  const html = read(path.join(app, 'index.html'));
  const tag = html.indexOf('src="' + MAIN);
  const parts = [];
  const re = /src="(js\/stats-[^"?]+\.js)/g; let m;
  while ((m = re.exec(html))) if (m.index < tag) parts.push(m[1]);
  return parts.concat([MAIN]);
}
// 도메인 키는 이전 전 원본 글자에서 뽑는다(두 앱에 같은 목록을 넣는다)
const bast = parser.parse(read(path.join(BASE, MAIN)), { sourceType: 'script' });
const keys = new Set();
traverse(bast, {
  FunctionDeclaration(p) {
    if (p.node.id.name !== 'generateDomainSample') return;
    p.traverse({ BinaryExpression(q) { const n = q.node; if (n.operator === '===' && n.left.type === 'Identifier' && n.left.name === 'domainKey' && n.right.type === 'StringLiteral') keys.add(n.right.value); } });
  },
  VariableDeclarator(p) {
    const id = p.node.id.name, init = p.node.init;
    if (id === 'THEME_METRIC_SPECS' && init && init.type === 'ObjectExpression') for (const pr of init.properties) keys.add(pr.key.name || pr.key.value);
    if (id === 'SAMPLE_THEMES' && init && init.type === 'ArrayExpression') p.traverse({ ObjectProperty(q) { if ((q.node.key.name || q.node.key.value) === 'key' && q.node.value.type === 'StringLiteral') keys.add(q.node.value.value); } });
  }
});
keys.add('__no_such_domain__');
const KEYS = [...keys];
const FIX = T => "(function(){var RD=Date;var T=" + T + ";function D(){ if(!(this instanceof D)) return new RD(T).toString(); var a=[].slice.call(arguments); return a.length? new (Function.prototype.bind.apply(RD,[null].concat(a)))(): new RD(T);} D.prototype=RD.prototype; D.now=function(){return T;}; D.UTC=RD.UTC; D.parse=RD.parse; Date=D;" +
  "var s=1; Math.random=function(){ s=(s*16807)%2147483647; return (s-1)/2147483646; }; this.__seed=function(n){ s=n; };})();";
function boot(app, T) {
  const w = { console: { log() {}, warn() {}, error() {} } }; w.window = w;
  const ctx = vm.createContext(w);
  vm.runInContext(FIX(T), ctx);
  for (const r of loadOrder(app)) vm.runInContext(read(path.join(app, r)), ctx, { filename: r });
  return w;
}
const TIMES = [Date.parse('2026-10-05T03:00:00Z'), Date.parse('2025-02-28T23:59:30Z')];
const results = [];
let ok = true;
for (const T of TIMES) {
  const b = boot(BASE, T), a = boot(APP, T);
  const call = (w, fn) => { w.__seed(11); try { return { v: JSON.parse(JSON.stringify(fn(w.OurgoalUniversalStats))) }; } catch (e) { return { e: String(e && e.message || e) }; } };
  const cases = KEYS.map(k => ['generateDomainSample:' + k, U => U.generateDomainSample(k)])
    .concat([['generate52WeekPowerliftingSample', U => U.generate52WeekPowerliftingSample()], ['generate1920sOlympicStrengthSample', U => U.generate1920sOlympicStrengthSample()]]);
  for (const [name, fn] of cases) {
    const x = call(b, fn), y = call(a, fn);
    let same = true, msg = null;
    try { assert.deepStrictEqual(y, x); } catch (e) { same = false; msg = String(e.message).slice(0, 300); }
    const n = x.v && Array.isArray(x.v) ? x.v.length : null;
    if (!same) ok = false;
    results.push({ at: new Date(T).toISOString(), case: name, records: n, same, error: x.e || null, diff: msg });
  }
}
const nonEmpty = results.filter(r => r.records > 0).length;
const report = { task: 'TASK-ES-405', what: '모든 도메인 키 generateDomainSample 출력·과거 샘플 2종 — 같은 씨앗·고정 시각 2가지에서 이전 전 대 후 deepStrictEqual', keys: KEYS, times: TIMES.map(t => new Date(t).toISOString()),
  cases: results.length, same: results.filter(r => r.same).length, nonEmptyCases: nonEmpty, totalRecords: results.reduce((s, r) => s + (r.records || 0), 0), ok: ok && nonEmpty > 0, results };
console.log(JSON.stringify({ ok: report.ok, keys: KEYS.length, cases: report.cases, same: report.same, nonEmptyCases: nonEmpty, totalRecords: report.totalRecords }));
for (const r of results) if (!r.same) console.log('DIFF', r.at, r.case, r.diff);
if (OUT) fs.writeFileSync(OUT, JSON.stringify(report, null, 1));
process.exitCode = report.ok ? 0 : 1;
