'use strict';
// #TASK-ES-672 — 「CSV 다운로드」 단추가 실제로 파일을 만드는지, 그 파일이 정리 전후에 같은지 재는 탐침.
// 법정 시나리오 어휘에는 내려받은 파일을 보는 낱말이 없어서 따로 잰다. 법정의 브라우저·정적 서버·호스트 이름 라이브러리(court/lib/*)는 읽기만 쓴다.
// 누르는 것은 전부 진짜 마우스 입력(Input.dispatchMouseEvent)이다 — 함수를 직접 부르지 않는다. 작업자 PC 측정 — 판정이 아니다.
// 사용: node csv-download-probe.cjs <기준 트리> <작업 트리> <out.json>
const fs = require('fs'), os = require('os'), path = require('path'), crypto = require('crypto');
const [BASE, WORK, OUT] = process.argv.slice(2);
const COURT = path.resolve(WORK, 'court');
const { launch, sleep } = require(path.join(COURT, 'lib', 'chrome.js'));
const server = require(path.join(COURT, 'lib', 'static-server.js'));
const siteHostLib = require(path.join(COURT, 'lib', 'site-host.js'));
const cfg = JSON.parse(fs.readFileSync(path.join(COURT, 'config.json'), 'utf8'));
const J = JSON.stringify;

async function run(tree, label) {
  const dlDir = fs.mkdtempSync(path.join(os.tmpdir(), 'es646-csv-' + label + '-'));
  const host = siteHostLib.pickSiteHost(cfg);
  const srv = await server.start(path.resolve(tree), cfg.denyServePrefixes);
  const siteUrl = siteHostLib.siteUrlFor(host, srv.port);
  const b = await launch({ viewport: { width: 430, height: 932 }, allowHosts: cfg.allowHosts, siteOrigin: siteUrl, locale: cfg.locale });
  const page = b.page;
  const out = { label, steps: [], exceptions: [], download: null };
  try {
    page.on('Runtime.exceptionThrown', p => out.exceptions.push(String((p.exceptionDetails && p.exceptionDetails.exception && p.exceptionDetails.exception.description) || 'exception').split('\n')[0]));
    let began = null;
    page.on('Page.downloadWillBegin', p => { began = { suggestedFilename: p.suggestedFilename, guid: p.guid }; });
    await page.send('Page.enable'); await page.send('Runtime.enable'); await page.send('Network.enable');
    await page.send('Network.setBypassServiceWorker', { bypass: true });
    await page.send('Emulation.setDeviceMetricsOverride', { width: 430, height: 932, deviceScaleFactor: 2, mobile: true });
    try { await page.send('Emulation.setTimezoneOverride', { timezoneId: cfg.timezone || 'Asia/Seoul' }); } catch (_) { /* 무시 */ }
    for (const st of cfg.stubs || []) { /* 외부 라이브러리 고정 사본은 법정 실행기만 쓴다 — 이 탐침은 게스트 로컬 경로만 본다 */ void st; }
    await page.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: dlDir });
    const ev = async expr => { const r = await page.send('Runtime.evaluate', { expression: expr, returnByValue: true }); return r.result ? r.result.value : undefined; };
    const VIS = 'function(el){if(!el)return false;var rs=el.getClientRects();if(!rs.length)return false;var cs=getComputedStyle(el);if(cs.display==="none"||cs.visibility==="hidden")return false;var b=el.getBoundingClientRect();return b.width>0&&b.height>0;}';
    const waitFor = async (sel, ms) => { const end = Date.now() + (ms || 15000); for (;;) { const n = await ev('(function(){var v=' + VIS + ';return Array.prototype.filter.call(document.querySelectorAll(' + J(sel) + '),v).length;})()'); if (n > 0) return true; if (Date.now() > end) throw new Error('보이는 대상 없음: ' + sel); await sleep(120); } };
    const click = async sel => {
      await waitFor(sel);
      const pos = await ev('(function(){var v=' + VIS + ';var els=Array.prototype.filter.call(document.querySelectorAll(' + J(sel) + '),v);if(els.length!==1)return {n:els.length};var el=els[0];el.scrollIntoView({block:"center",inline:"center",behavior:"instant"});var b=el.getBoundingClientRect();var x=b.left+b.width/2,y=b.top+b.height/2;var top=document.elementFromPoint(x,y);return {n:1,x:x,y:y,hit:!!top&&(top===el||el.contains(top))};})()');
      if (!pos || pos.n !== 1) throw new Error('대상이 하나가 아니다(' + (pos && pos.n) + '): ' + sel);
      for (let i = 0; i < 20 && !pos.hit; i++) { await sleep(150); const again = await ev('(function(){var el=document.querySelector(' + J(sel) + ');var b=el.getBoundingClientRect();var x=b.left+b.width/2,y=b.top+b.height/2;var top=document.elementFromPoint(x,y);return {x:x,y:y,hit:!!top&&(top===el||el.contains(top))};})()'); Object.assign(pos, again); }
      if (!pos.hit) throw new Error('그 자리를 다른 요소가 덮고 있다: ' + sel);
      await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: pos.x, y: pos.y });
      await page.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pos.x, y: pos.y, button: 'left', clickCount: 1 });
      await page.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: pos.x, y: pos.y, button: 'left', clickCount: 1 });
      await sleep(250); out.steps.push('누름 ' + sel);
    };
    await page.send('Page.navigate', { url: siteUrl + '/index.html' });
    await click('#btnLandingPreviewDirect');
    await click('#btnAvatarGreetClose');
    await click('.navbtn[data-tab="records"]');
    await click('#recQuickDockBar > button:nth-child(4)');
    await click('#recOpenProTemplateBtn');
    await waitFor('#proTable');
    await click('.pro-tpl-cell-input[data-row="0"][data-col="1"]');
    await page.send('Input.insertText', { text: ' 안전망, "따옴표"' }); // 쉼표·따옴표가 든 칸 — 내보낼 때 감싸는 길까지 지난다
    await sleep(200);
    await click('#proCsvExportBtn');
    let file = null;
    for (let i = 0; i < 60 && !file; i++) { await sleep(150); const list = fs.readdirSync(dlDir).filter(f => !/\.crdownload$/.test(f)); if (list.length) file = list[0]; }
    if (file) {
      const buf = fs.readFileSync(path.join(dlDir, file));
      const text = buf.toString('utf8');
      out.download = { created: true, suggestedFilename: began ? began.suggestedFilename : null, savedAs: file, bytes: buf.length, sha256: crypto.createHash('sha256').update(buf).digest('hex'), startsWithBom: buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF, lines: text.split(/\r\r\n|\r\n|\n/).length, firstLine: text.replace(/^﻿/, '').split(/\r\r\n|\r\n|\n/)[0], secondLine: text.split(/\r\r\n|\r\n|\n/)[1] };
    } else out.download = { created: false, began };
    out.modalStillOpen = (await ev('document.querySelectorAll("#proTable").length')) === 1;
  } catch (e) { out.error = String(e && e.message || e); }
  finally { try { await b.close(); } catch (_) { /* 무시 */ } try { await srv.close(); } catch (_) { /* 무시 */ } try { fs.rmSync(dlDir, { recursive: true, force: true }); } catch (_) { /* 무시 */ } }
  return out;
}

(async () => {
  const base = await run(BASE, 'base'), work = await run(WORK, 'work');
  const d = x => (x.download && x.download.created ? x.download : null);
  const same = !!(d(base) && d(work) && d(base).sha256 === d(work).sha256 && d(base).suggestedFilename === d(work).suggestedFilename && d(base).savedAs === d(work).savedAs);
  const res = { tool: 'reports/TASK-ES-672/tools/csv-download-probe.cjs (court/lib/chrome.js · static-server.js · site-host.js 읽기 전용, 진짜 마우스 입력)', type: '작업자 PC 측정 — 판정 아님', measuredAt: new Date().toISOString(),
    base, work, fileCreated: { base: !!d(base), work: !!d(work) }, sameFile: same, exceptions: { base: base.exceptions.length, work: work.exceptions.length } };
  fs.writeFileSync(OUT, JSON.stringify(res, null, 1) + '\n', { encoding: 'utf8' });
  console.log(JSON.stringify({ created: res.fileCreated, same, name: d(base) && d(base).suggestedFilename, bytes: [d(base) && d(base).bytes, d(work) && d(work).bytes], second: d(work) && d(work).secondLine, err: [base.error || null, work.error || null], ex: res.exceptions }));
  process.exit(0);
})();
