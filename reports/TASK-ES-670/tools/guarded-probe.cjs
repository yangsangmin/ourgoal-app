'use strict';
// 잠긴 두 곳(앱 환경설정 객체 · 템플릿 부품 초기화)의 실행을 브라우저에서 잰다(작업자 측정, 판정 아님). 기준 트리와 작업(또는 모의) 트리를 각각 법정의 브라우저·정적 서버(court/lib/* 읽기 전용)로 띄운다.
// 페이지가 뜨기 전에 관측용 조각을 심는다(제품 파일은 건드리지 않는다): window.OURGOAL_CONFIG 에 값이 달리는 순간과 OurgoalTemplateCredit.init 이 불리는 순간을 차례로 적는다.
// 부팅이 끝난 뒤 읽는 것: ① 두 사건의 수와 순서 ② window.OURGOAL_CONFIG 의 꼴(종류 · 키 수 · 다시 읽어도 같은 객체) ③ init 에 건넨 값이 통로의 sb · state · toast 와 같은 것인지
//   ④ init 이 window.sb 를 단 결과(window.sb === 통로의 sb) ⑤ js/streaks.js 가 그 객체를 읽는 길(전역 OurgoalStreaks 가 있으면 그 종류).
// 기준과 작업의 결과를 통째로 맞댄다. 외부 통신은 법정 브라우저가 막는다 — 서버 연결 객체(sb)가 null 일 수 있고 그 경우도 그대로 적는다.
// 사용: node guarded-probe.cjs <법정 코드가 든 트리> <기준 트리> <작업 트리> <out.json>
const fs = require('fs'), path = require('path');
const [ROOT, BASE, WORK, OUT] = process.argv.slice(2);
const C = p => require(path.resolve(ROOT, 'court', 'lib', p));
const { launch, sleep } = C('chrome.js');
const server = C('static-server.js');
const siteHost = C('site-host.js');
const cfg = JSON.parse(fs.readFileSync(path.resolve(ROOT, 'court', 'config.json'), 'utf8'));

function spy() { // 페이지가 뜨기 전에 도는 관측 조각
  var seq = window.__guardedSeq = [], calls = window.__partInitCalls = [], cfgVal, realPart;
  Object.defineProperty(window, 'OURGOAL_CONFIG', { configurable: true, enumerable: true, get: function () { return cfgVal; }, set: function (v) { seq.push('config-set'); cfgVal = v; } });
  Object.defineProperty(window, 'OurgoalTemplateCredit', { configurable: true, enumerable: true, get: function () { return realPart; }, set: function (v) {
    realPart = v;
    if (v && typeof v.init === 'function' && !v.__spied) { var orig = v.init; v.init = function (d) { seq.push('part-init'); calls.push({ d: d, self: this === v }); return orig.apply(this, arguments); }; v.__spied = true; }
  } });
}
function read() { // 부팅이 끝난 뒤 읽는다
  var S = window.OurgoalAppScope.scope, c = window.__partInitCalls || [], d = c[0] && c[0].d, cf = window.OURGOAL_CONFIG;
  return { seq: (window.__guardedSeq || []).slice(), initCalls: c.length,
    init: d ? { keys: Object.keys(d).sort().join(','), thisIsThePart: c[0].self, sbIsScopeSb: d.sb === S.sb, sbIsNull: d.sb === null, getStateReturnsScopeState: typeof d.getState === 'function' && d.getState() === S.state, toastIsScopeToast: d.toast === S.toast } : null,
    config: { type: typeof cf, isNull: cf === null, keys: cf && typeof cf === 'object' ? Object.keys(cf).length : null, plainObject: !!cf && Object.getPrototypeOf(cf) === Object.prototype, sameOnReread: window.OURGOAL_CONFIG === cf },
    windowSb: { present: 'sb' in window, sameAsScopeSb: window.sb === S.sb },
    scopeHas: { OURGOAL_CONFIG: Object.prototype.hasOwnProperty.call(S, 'OURGOAL_CONFIG'), sb: 'sb' in S, state: 'state' in S, toast: 'toast' in S },
    streaks: typeof window.OurgoalStreaks };
}
async function runTree(APP) {
  const srv = await server.start(path.resolve(APP), cfg.denyServePrefixes || []);
  const siteUrl = siteHost.siteUrlFor(siteHost.pickSiteHost(cfg), srv.port);
  const exceptions = [];
  let browser = null, result = null, error = null;
  try {
    browser = await launch({ allowHosts: cfg.allowHosts || [], siteOrigin: siteUrl, locale: cfg.locale, viewport: { width: 430, height: 932 } });
    const page = browser.page;
    await page.send('Page.enable'); await page.send('Runtime.enable');
    page.on('Runtime.exceptionThrown', p => { const d = p && p.exceptionDetails; exceptions.push((d && d.exception && d.exception.description) || (d && d.text) || 'exception'); });
    await page.send('Page.addScriptToEvaluateOnNewDocument', { source: '(' + spy.toString() + ')();' });
    const loaded = new Promise(res => { page.on('Page.loadEventFired', () => res()); setTimeout(res, 20000); });
    await page.send('Page.navigate', { url: siteUrl + '/index.html' });
    await loaded; await sleep(2500);
    const r = await page.send('Runtime.evaluate', { expression: 'JSON.stringify((' + read.toString() + ')())', returnByValue: true, awaitPromise: true }, 15000);
    if (r.exceptionDetails) throw new Error('페이지 평가 오류: ' + ((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text || ''));
    result = JSON.parse(r.result.value);
  } catch (e) { error = String(e && e.message || e); }
  try { if (browser && browser.close) await browser.close(); } catch (e) { /* 닫기 실패는 결과에 영향 없음 */ }
  try { srv.close ? srv.close() : srv.server && srv.server.close(); } catch (e) { /* 닫기 실패는 결과에 영향 없음 */ }
  return { app: path.resolve(APP), error, pageExceptions: exceptions, result };
}
(async () => {
  const base = await runTree(BASE), work = await runTree(WORK);
  const same = !!base.result && !!work.result && JSON.stringify(base.result) === JSON.stringify(work.result);
  const w = work.result || {};
  const out = { tool: 'reports/TASK-ES-670/tools/guarded-probe.cjs (court/lib/chrome.js · static-server.js · site-host.js 읽기 전용)', type: '작업자 측정, 판정 아님',
    limits: '게스트로 부팅한 임시 브라우저에서 쟀다. 관측 조각은 페이지가 뜨기 전에 window 에 심은 것이고 제품 파일은 그대로다. 법정 브라우저가 외부 통신을 막아 서버 연결 객체가 null 일 수 있다.',
    base, work, sameAsBase: same,
    expected: work.result ? { configSetOnce: w.seq.filter(x => x === 'config-set').length === 1, partInitOnce: w.initCalls === 1, configBeforePartInit: w.seq.indexOf('config-set') >= 0 && w.seq.indexOf('config-set') < w.seq.indexOf('part-init'),
      configIsPlainEmptyObject: w.config.type === 'object' && w.config.plainObject === true && w.config.keys === 0 && w.config.sameOnReread === true,
      initGetsScopeValues: !!w.init && w.init.keys === 'getState,sb,toast' && w.init.sbIsScopeSb === true && w.init.getStateReturnsScopeState === true && w.init.toastIsScopeToast === true && w.init.thisIsThePart === true } : null,
    exceptionsBoth: [base.pageExceptions.length, work.pageExceptions.length] };
  out.ok = !base.error && !work.error && same && !!out.expected && Object.values(out.expected).every(v => v === true) && work.pageExceptions.length <= base.pageExceptions.length;
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', { encoding: 'utf8' });
  console.log(JSON.stringify({ ok: out.ok, errors: [base.error, work.error], same, expected: out.expected, work: work.result, exc: out.exceptionsBoth }));
  process.exit(0);
})();
