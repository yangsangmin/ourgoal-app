#!/usr/bin/env node
'use strict';
// 세포 등록 기관 대조 탐침 (B1 · docs/architecture/CELL-REGISTRY-DESIGN.md 3.2절) — 작업자 측정 도구, 판정 아님.
// 브라우저(headless Chrome)에서 게스트로 진입해 부팅을 끝낸 뒤 OurgoalCellRegistry.report() 를 받아 JSON 으로 쓴다.
//   비교 범위: OurgoalAppScope.scope 의 모든 이름(페이지 안 OurgoalAppScope.names()) + index.html 인라인 IIFE 최상위의 window 노출 이름 전부
//   (@babel/parser 로 `window.X = …` 문과 `if(typeof window !== 'undefined'){ window.X = … }` 블록을 센다 — 설계 7절 측정 방법).
//   이름마다 옛 경로 값과 등록 값을 `===` 로 본다(함수는 참조 동일, 상태는 getter 값 동일). 로드 중 호출은 note() 기록 순서 배열을 그대로 싣는다.
//   등록이 없는 이름은 missing 으로 나온다 — 첫 측정(B1)에서는 등록이 0 이므로 missing 이 곧 B2 의 등록 범위다. 결과를 가공하지 않는다.
// 법정 밖 도구다. 법정의 브라우저·정적 서버·호스트 이름 라이브러리(court/lib/*)는 읽기만 한다(court/** 변경 0).
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node scripts/probes/cell-registry-compare.js <APP_DIR> <out.json> [--expect-zero] [--chrome <chrome.exe>]
//   --expect-zero: 불일치·누락이 0 이 아니면 종료 코드 1(B2 이후용). 없으면 측정만 하고 0 으로 끝난다.
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');

const argv = process.argv.slice(2);
const APP = path.resolve(argv[0] || '.');
const OUT = argv[1];
const EXPECT_ZERO = argv.includes('--expect-zero');
const chromeArg = argv.indexOf('--chrome') >= 0 ? argv[argv.indexOf('--chrome') + 1] : null;
if (!OUT) { console.error('사용: node scripts/probes/cell-registry-compare.js <APP_DIR> <out.json> [--expect-zero] [--chrome <path>]'); process.exit(2); }

const ROOT = path.resolve(__dirname, '..', '..'); // 이 탐침이 든 저장소(법정 라이브러리는 여기서 읽는다)
const courtLib = p => require(path.join(ROOT, 'court', 'lib', p));
const { launch, sleep } = courtLib('chrome.js');
const server = courtLib('static-server.js');
const siteHost = courtLib('site-host.js');
const courtCfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'court', 'config.json'), 'utf8'));

// index.html 인라인 IIFE 최상위의 window 노출 이름(설계 7절과 같은 셈: 직접 대입문 + 대입만 담은 if 블록, 쉼표 연쇄 포함)
function windowNamesOf(indexHtml) {
  const html = fs.readFileSync(indexHtml, 'utf8');
  const lines = html.split('\n').map(l => l.replace(/\r$/, ''));
  let s = -1, e = -1;
  for (let i = 0; i < lines.length; i++) if (lines[i].trim() === '<script>' && (lines[i + 1] || '').trim() === '(function(){' && (lines[i + 2] || '').includes('"use strict"')) { s = i + 1; break; }
  if (s < 0) throw new Error('index.html 인라인 IIFE 를 찾지 못했다');
  for (let i = s; i < lines.length; i++) if (lines[i].startsWith('</script>')) { e = i; break; }
  const code = lines.slice(s, e).join('\n');
  const ast = parser.parse(code, { sourceType: 'script' });
  const iife = ast.program.body[0].expression.callee;
  const top = iife.body.body;
  const isWA = x => x && x.type === 'AssignmentExpression' && x.left.type === 'MemberExpression' && x.left.object.type === 'Identifier' && x.left.object.name === 'window';
  const nameOf = x => x.left.computed ? (x.left.property.type === 'StringLiteral' ? x.left.property.value : null) : x.left.property.name;
  const names = [], sites = [];
  const rec = (x, where, line) => { const n = nameOf(x); if (!n) return; if (!names.includes(n)) names.push(n); sites.push({ name: n, where, line: line + s, rhs: x.right.type }); };
  for (const st of top) {
    if (st.type === 'ExpressionStatement') {
      const x = st.expression;
      if (isWA(x)) rec(x, 'top', st.loc.start.line);
      else if (x.type === 'SequenceExpression' && x.expressions.every(isWA)) x.expressions.forEach(y => rec(y, 'top-seq', st.loc.start.line));
    } else if (st.type === 'IfStatement' && !st.alternate && st.consequent.type === 'BlockStatement' && st.consequent.body.length
      && st.consequent.body.every(b => b.type === 'ExpressionStatement' && (isWA(b.expression) || (b.expression.type === 'SequenceExpression' && b.expression.expressions.every(isWA))))) {
      for (const b of st.consequent.body) { const x = b.expression; if (isWA(x)) rec(x, 'if', b.loc.start.line); else x.expressions.forEach(y => rec(y, 'if-seq', b.loc.start.line)); }
    }
  }
  return { names, sites, iifeLines: [s + 1, e] };
}

const VIS = '(function(){function vis(el){if(!el)return false;var rs=el.getClientRects();if(!rs.length)return false;var cs=getComputedStyle(el);' +
  'if(cs.display==="none"||cs.visibility==="hidden"||parseFloat(cs.opacity)<0.01)return false;var b=el.getBoundingClientRect();return b.width>0&&b.height>0;}return vis;})()';
async function evalJson(page, expr, timeoutMs) {
  const r = await page.send('Runtime.evaluate', { expression: 'JSON.stringify(' + expr + ')', returnByValue: true, awaitPromise: true }, timeoutMs || 15000);
  if (r.exceptionDetails) throw new Error('페이지 평가 오류: ' + (r.exceptionDetails.text || '') + ' ' + ((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || ''));
  return r.result && typeof r.result.value === 'string' ? JSON.parse(r.result.value) : null;
}
async function waitVisible(page, selector, timeoutMs) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const r = await evalJson(page, '(function(){var vis=' + VIS + ';var els=Array.prototype.slice.call(document.querySelectorAll(' + JSON.stringify(selector) + ')).filter(vis);' +
      'if(els.length!==1)return {n:els.length};var b=els[0].getBoundingClientRect();return {n:1,x:b.left+b.width/2,y:b.top+b.height/2};})()');
    if (r && r.n === 1) return r;
    await sleep(150);
  }
  return null;
}
async function realClick(page, pt) {
  await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: pt.x, y: pt.y });
  await page.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
  await page.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
}

(async () => {
  const startedAt = new Date().toISOString();
  const win = windowNamesOf(path.join(APP, 'index.html'));
  const srv = await server.start(APP, courtCfg.denyServePrefixes || []);
  const host = siteHost.pickSiteHost(courtCfg);
  const siteUrl = siteHost.siteUrlFor(host, srv.port);
  const exceptions = [], consoleErrors = [], steps = [];
  let browser = null, result = null, error = null;
  try {
    browser = await launch({ allowHosts: courtCfg.allowHosts || [], chromePath: chromeArg || undefined, siteOrigin: siteUrl, locale: courtCfg.locale, viewport: { width: 430, height: 932 } });
    const page = browser.page;
    await page.send('Page.enable'); await page.send('Runtime.enable');
    page.on('Runtime.exceptionThrown', p => { const d = p && p.exceptionDetails; exceptions.push((d && d.exception && d.exception.description) || (d && d.text) || 'exception'); });
    page.on('Runtime.consoleAPICalled', p => { if (p && p.type === 'error') consoleErrors.push((p.args || []).map(a => a.value !== undefined ? String(a.value) : (a.description || a.type)).join(' ')); });
    await page.send('Emulation.setDeviceMetricsOverride', { width: 430, height: 932, deviceScaleFactor: 2, mobile: true });
    const loaded = new Promise(res => { page.on('Page.loadEventFired', () => res()); setTimeout(res, 20000); });
    await page.send('Page.navigate', { url: siteUrl + '/index.html' });
    await loaded;
    steps.push({ step: 'goto', ok: true });
    const flow = [
      { wait: '#btnLandingPreviewDirect', click: true, timeoutMs: 15000, required: true },
      { wait: '#btnAvatarGreetClose', click: true, timeoutMs: 10000, required: false },
      { wait: '.navbtn[data-tab="home"]', click: false, timeoutMs: 10000, required: true },
    ];
    for (const f of flow) {
      const pt = await waitVisible(page, f.wait, f.timeoutMs);
      if (!pt) { steps.push({ step: f.wait, ok: false, note: '보이는 요소 1개를 기다렸으나 없음' }); if (f.required) throw new Error('게스트 부팅 단계 실패: ' + f.wait); continue; }
      if (f.click) { await realClick(page, pt); steps.push({ step: f.wait, ok: true, clicked: true }); } else steps.push({ step: f.wait, ok: true });
      await sleep(600);
    }
    await sleep(1500);
    result = await evalJson(page, '(function(){var R=window.OurgoalCellRegistry;var S=window.OurgoalAppScope;var W=' + JSON.stringify(win.names) + ';' +
      'if(!R)return {error:"OurgoalCellRegistry 없음"};var scopeNames=(S&&typeof S.names==="function")?S.names():[];' +
      'var rep=R.report({scopeNames:scopeNames,windowNames:W});' +
      // 옛 경로의 현재 상태(가공 없는 원시값): scope getter 가 읽히는가 · window 이름이 정의돼 있는가
      'var scopeErr=[],scopeType={};scopeNames.forEach(function(n){try{var v=S.scope[n];var t=typeof v;scopeType[t]=(scopeType[t]||0)+1;}catch(e){scopeErr.push({name:n,error:String(e&&e.message||e)});}});' +
      'var winUndef=[],winType={};W.forEach(function(n){var t=typeof window[n];winType[t]=(winType[t]||0)+1;if(t==="undefined")winUndef.push(n);});' +
      'return {report:rep,registeredNames:R.names(),scopeNames:scopeNames,oldPath:{scopeGetterErrors:scopeErr,scopeValueTypes:scopeType,windowValueTypes:winType,windowUndefined:winUndef}};})()', 30000);
  } catch (e) { error = (e && e.message) || String(e); }
  finally { if (browser) { try { await browser.close(); } catch (_) { /* 종료 실패 무시 */ } } try { await srv.close(); } catch (_) { /* 무시 */ } }
  const rep = result && result.report;
  const out = {
    tool: 'scripts/probes/cell-registry-compare.js', type: '작업자 측정, 판정 아님', startedAt, endedAt: new Date().toISOString(),
    app: APP, siteHost: host, guestBoot: { steps, error, exceptions, consoleErrors },
    windowNamesSource: { method: 'index.html 인라인 IIFE 최상위 window 대입문 + 대입만 담은 if 블록(@babel/parser)', iifeLines: win.iifeLines, count: win.names.length, sites: win.sites.length },
    counts: rep ? rep.counts : null,
    report: rep || (result && result.error ? { error: result.error } : null),
    registeredNames: result ? result.registeredNames : null,
    scopeNames: result ? result.scopeNames : null,
    windowNames: win.names,
    oldPath: result ? result.oldPath : null,
    ok: !error && !!rep,
  };
  fs.mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', 'utf8');
  if (rep) console.log('scope', rep.counts.scopeNames, '· window', rep.counts.windowNames, '· registered', rep.counts.registered, '· mismatches', rep.counts.mismatches, '· missing', rep.counts.missing, '· extra', rep.counts.extra, '· conflicts', rep.counts.conflicts, '· exceptions', exceptions.length);
  else console.log('실패:', error || (result && result.error));
  if (error || !rep) process.exit(1);
  if (EXPECT_ZERO && (rep.counts.mismatches || rep.counts.missing)) process.exit(1);
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
