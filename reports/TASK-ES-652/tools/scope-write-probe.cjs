'use strict';
// 통로 쓰기 왕복 실측(작업자 측정, 판정 아님): 한 트리를 법정의 브라우저·정적 서버(court/lib/* 읽기 전용)로 띄워 부팅이 끝난 뒤,
// 통로(OurgoalAppScope.scope)의 한 이름에 대해 속성 꼴(get/set)과 주인을 읽고, 표식 객체를 써 보고 되읽은 다음 원래 값으로 돌려놓는다.
// 엄격 모드 함수 안에서 쓴다 — setter 가 없으면 「only a getter」 TypeError 가 그대로 잡힌다(옮긴 세포 코드는 'use strict' 다).
// 사용: node scope-write-probe.cjs <법정 코드가 든 트리> <띄울 트리> <이름> <out.json>
const fs = require('fs'), path = require('path');
const [ROOT, APP, NAME, OUT] = process.argv.slice(2);
const C = p => require(path.resolve(ROOT, 'court', 'lib', p));
const { launch, sleep } = C('chrome.js');
const server = C('static-server.js');
const siteHost = C('site-host.js');
const cfg = JSON.parse(fs.readFileSync(path.resolve(ROOT, 'court', 'config.json'), 'utf8'));
const html = fs.readFileSync(path.join(APP, 'index.html'), 'utf8').split(/\r?\n/);
const exposeLines = html.map((l, i) => (new RegExp('get ' + NAME + '\\(\\)').test(l) ? { line: i + 1, hasSet: new RegExp('set ' + NAME + '\\(v\\)').test(l), text: l.trim().slice(0, 200) } : null)).filter(Boolean);
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
    const expr = '(function(){"use strict";var S=window.OurgoalAppScope,L=S.scope,n=' + JSON.stringify(NAME) + ',d=Object.getOwnPropertyDescriptor(L,n),out={};' +
      'out.descriptor=d?{get:typeof d.get==="function",set:typeof d.set==="function",value:("value" in d)}:null;out.owner=S.ownerOf(n);' +
      'var before;try{before=L[n];out.typeBefore=(before===null?"null":typeof before);}catch(e){out.readThrew=String(e&&e.message||e);}' +
      'var mark={probe:1};try{L[n]=mark;out.wrote=true;}catch(e){out.wrote=false;out.writeThrew=String(e&&e.message||e);}' +
      'try{out.readBackSame=(L[n]===mark);}catch(e){out.readBackSame=false;}' +
      'if(out.wrote){try{L[n]=before;out.restored=(L[n]===before);}catch(e){out.restored=false;out.restoreThrew=String(e&&e.message||e);}}else{out.restored=(L[n]===before);}' +
      'return out;})()';
    const r = await page.send('Runtime.evaluate', { expression: 'JSON.stringify(' + expr + ')', returnByValue: true, awaitPromise: true }, 15000);
    if (r.exceptionDetails) throw new Error('페이지 평가 오류: ' + ((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text || ''));
    dyn = JSON.parse(r.result.value);
  } catch (e) { error = String(e && e.message || e); }
  try { if (browser && browser.close) await browser.close(); } catch (e) {}
  try { srv.close ? srv.close() : srv.server && srv.server.close(); } catch (e) {}
  const out = { tool: 'reports/TASK-ES-652/tools/scope-write-probe.cjs (court/lib/chrome.js · static-server.js · site-host.js 읽기 전용)', type: '작업자 측정, 판정 아님', name: NAME,
    static: { exposeLines, lastExposeHasSet: exposeLines.length ? exposeLines[exposeLines.length - 1].hasSet : null }, error, pageExceptions: exceptions, dynamic: dyn,
    writeRoundTripOk: !!dyn && dyn.wrote === true && dyn.readBackSame === true && dyn.restored === true };
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', 'utf8');
  console.log(JSON.stringify({ name: NAME, lastExposeHasSet: out.static.lastExposeHasSet, exposeLines: exposeLines.map(x => x.line + (x.hasSet ? ':get+set' : ':get')), dyn, ok: out.writeRoundTripOk, error, exc: exceptions.length }));
  process.exit(0);
})();
