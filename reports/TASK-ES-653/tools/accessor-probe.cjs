'use strict';
// 통로 접근자 실측(작업자 측정, 판정 아님): 한 트리를 법정의 브라우저·정적 서버(court/lib/* 읽기 전용)로 띄워 부팅이 끝난 뒤,
// 새 세포가 L.<이름> 으로 읽는 이름마다 통로 속성의 꼴(get/set/value·writable)과 주인(OurgoalAppScope.ownerOf)을 읽고,
// 새 세포가 대입하는 이름은 실제로 써 보고 되읽은 뒤 원래 값으로 돌려놓는다.
// 정적 대조도 함께 한다: index.html 의 상태 기관 이름(window.OurgoalAppState.define/defineVar('X', …))과 생성기가 새로 단 getter·읽는 이름·대입 이름의 겹침.
// 사용: node accessor-probe.cjs <법정 코드가 든 트리> <띄울 트리> <gen-inline-hard-meta.json> <out.json>
const fs = require('fs'), path = require('path');
const [ROOT, APP, META, OUT] = process.argv.slice(2);
const C = p => require(path.resolve(ROOT, 'court', 'lib', p));
const { launch, sleep } = C('chrome.js');
const server = C('static-server.js');
const siteHost = C('site-host.js');
const cfg = JSON.parse(fs.readFileSync(path.resolve(ROOT, 'court', 'config.json'), 'utf8'));
const meta = JSON.parse(fs.readFileSync(META, 'utf8'));
const html = fs.readFileSync(path.join(APP, 'index.html'), 'utf8');
const organ = {};
{ const re = /window\.OurgoalAppState\.(define|defineVar)\('([A-Za-z_$][\w$]*)'/g; let m; while ((m = re.exec(html))) organ[m[2]] = m[1]; }
const read = meta.bridged.map(b => b.n), assigned = meta.bridged.filter(b => b.assigned).map(b => b.n);
const lines = html.split(/\r?\n/);
const exposeLinesOf = n => lines.map((l, i) => (new RegExp('get ' + n.replace(/\$/g, '\\$') + '\\(\\)').test(l) ? { line: i + 1, hasSet: new RegExp('set ' + n.replace(/\$/g, '\\$') + '\\(v\\)').test(l) } : null)).filter(Boolean);
const staticPart = {
  organNames: Object.keys(organ).length,
  readNames: read.length, assignedNames: assigned,
  readNamesOwnedByOrgan: read.filter(n => organ[n]).map(n => ({ name: n, api: organ[n] })),
  assignedNamesOwnedByOrgan: assigned.filter(n => organ[n]).map(n => ({ name: n, api: organ[n] })),
  newGetters: meta.exposed, newGettersOverlappingOrgan: meta.exposed.filter(n => organ[n]).map(n => ({ name: n, api: organ[n] })),
  assignedNameExposeLines: Object.fromEntries(assigned.map(n => [n, exposeLinesOf(n)])),
};
(async () => {
  const srv = await server.start(path.resolve(APP), cfg.denyServePrefixes || []);
  const siteUrl = siteHost.siteUrlFor(siteHost.pickSiteHost(cfg), srv.port);
  const exceptions = [];
  let browser = null, dyn = null, error = null;
  try {
    browser = await launch({ allowHosts: cfg.allowHosts || [], siteOrigin: siteUrl, locale: cfg.locale, viewport: { width: 430, height: 932 } });
    const page = browser.page;
    await page.send('Page.enable'); await page.send('Runtime.enable');
    page.on('Runtime.exceptionThrown', p => { const d = p && p.exceptionDetails; exceptions.push((d && d.exception && d.exception.description) || (d && d.text) || 'exception'); });
    const loaded = new Promise(res => { page.on('Page.loadEventFired', () => res()); setTimeout(res, 20000); });
    await page.send('Page.navigate', { url: siteUrl + '/index.html' });
    await loaded; await sleep(2500);
    const expr = '(function(){var S=window.OurgoalAppScope,L=S.scope,out={names:{},writes:{}};' +
      JSON.stringify(read) + '.forEach(function(n){var d=Object.getOwnPropertyDescriptor(L,n);out.names[n]=d?{get:typeof d.get==="function",set:typeof d.set==="function",value:("value" in d),writable:d.writable===true,owner:S.ownerOf(n),type:(function(){try{return typeof L[n];}catch(e){return "throws:"+e.message;}})()}:null;});' +
      JSON.stringify(assigned) + '.forEach(function(n){var r={};try{var before=L[n];var mark={probe:1};L[n]=mark;r.readBackSame=(L[n]===mark);L[n]=before;r.restored=(L[n]===before);}catch(e){r.threw=String(e&&e.message||e);}out.writes[n]=r;});return out;})()';
    const r = await page.send('Runtime.evaluate', { expression: 'JSON.stringify(' + expr + ')', returnByValue: true, awaitPromise: true }, 15000);
    if (r.exceptionDetails) throw new Error('페이지 평가 오류: ' + ((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text || ''));
    dyn = JSON.parse(r.result.value);
  } catch (e) { error = String(e && e.message || e); }
  try { if (browser && browser.close) await browser.close(); } catch (e) {}
  try { srv.close ? srv.close() : srv.server && srv.server.close(); } catch (e) {}
  const names = dyn ? dyn.names : {};
  const out = { tool: 'reports/TASK-ES-653/tools/accessor-probe.cjs (court/lib/chrome.js · static-server.js · site-host.js 읽기 전용)', type: '작업자 측정, 판정 아님', app: path.resolve(APP), static: staticPart, error, pageExceptions: exceptions,
    dynamic: dyn && { missingOnScope: read.filter(n => !names[n]), undefinedValue: read.filter(n => names[n] && names[n].type === 'undefined'), byOwner: read.reduce((a, n) => { const o = names[n] ? String(names[n].owner) : 'none'; (a[o] = a[o] || []).push(n); return a; }, {}), writes: dyn.writes, names } };
  out.ok = !error && !!dyn && out.dynamic.missingOnScope.length === 0 && assigned.every(n => dyn.writes[n] && dyn.writes[n].readBackSame === true && dyn.writes[n].restored === true) && staticPart.newGettersOverlappingOrgan.length === 0;
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', 'utf8');
  console.log(JSON.stringify({ ok: out.ok, error, exc: exceptions.length, static: { organ: staticPart.organNames, readOrgan: staticPart.readNamesOwnedByOrgan, assignedOrgan: staticPart.assignedNamesOwnedByOrgan, newGetterOverlap: staticPart.newGettersOverlappingOrgan, exposeLines: staticPart.assignedNameExposeLines }, dyn: out.dynamic && { missing: out.dynamic.missingOnScope, undef: out.dynamic.undefinedValue, byOwner: Object.fromEntries(Object.entries(out.dynamic.byOwner).map(([k, v]) => [k, v.length])), writes: out.dynamic.writes, pcp: names.pendingCapturePhoto } }));
  process.exit(0);
})();
