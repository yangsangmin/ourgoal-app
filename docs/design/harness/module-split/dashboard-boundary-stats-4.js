'use strict';
// 통계 세포 쪼개기 4차(#TASK-ES-428) 대시보드 DOM 출력 검사기 — renderUniversalStatsDashboard(이전 전 884줄)를 구획 함수로 떼기 전에 먼저 만든다.
// 두 앱(기준·작업)의 통계 부품을 브라우저(헤드리스 Chrome)에 index.html 태그 순서대로(js/stats-*.js → js/universal-stats.js) 읽고,
// 같은 데이터 상태·같은 조작 순서로 공개 API OurgoalUniversalStats.renderUniversalStatsDashboard 를 불러 단계마다 아래를 맞댄다.
//  ① 화면 HTML(body 전체 — 대시보드 + 대시보드가 연 모달·전체화면)  ② 이벤트 배선(요소마다 on* 속성 손잡이 유무 + addEventListener 로 건 종류·옵션)
//  ③ state 객체(JSON, 함수 제외)  ④ localStorage  ⑤ 콜백 기록(openModal·closeModal·toast·saveProfile·onDone 호출 순서·인자 요약)  ⑥ 알림 창 글자  ⑦ 내보낸 파일(Blob 글자)
//  ⑧ 페이지 오류.
// 데이터 상태: 빈 기록(빈 화면 버튼 5개 각각) · 도메인 샘플 10종(generateDomainSample) · 52주 파워리프팅 · 1920년대 역도(과거 기록 → 기간 전체) · 섞음 · 사용자 스키마 ·
//   기록 1건 · 날짜 없는 기록 · 미리 정한 state 변형(렌즈·모드·기간·스케일·지표 여럿·분자/분모 없는 이름·접힘 저장값·multi 모드).
// 조작: 렌즈 4종·분자/분모 선택·모드 왕복·종목 칩·기간·스케일·측정 지표 더하기/빼기·십자선 이동 → 툴팁 수정 → 저장(onSaved)·전체화면 열기/회전/닫기·
//   데이터 관리 메뉴 → 가져오기 → 1초 로드(onDone)·숨은 앵커 4개(그리드·가져오기·CSV·스냅샷)·머리 접기/펼치기(아이콘)·온톨로지 버튼(없으면 missing).
// 시각(Date)·난수(Math.random)는 고정한다(샘플이 시각·난수로 만들어진다). 기준 대 기준(같은 폴더 두 번)이 0 이어야 기준 대 작업을 믿는다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node dashboard-boundary-stats-4.js <기준 APP_DIR> <작업 APP_DIR> [out.json]
const fs = require('fs'), path = require('path'), crypto = require('crypto'), http = require('http');
const puppeteer = require('C:/dev/command-center/node_modules/puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const [BASE, APP, OUT] = process.argv.slice(2);
const MAIN = 'js/universal-stats.js';
const read = f => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const sha = s => crypto.createHash('sha256').update(String(s)).digest('hex').slice(0, 16);
function loadOrder(app) {
  const html = read(path.join(app, 'index.html'));
  const tag = html.indexOf('src="' + MAIN);
  const parts = []; const re = /src="(js\/stats-[^"?]+\.js)/g; let m;
  while ((m = re.exec(html))) if (m.index < tag) parts.push(m[1]);
  return parts.concat([MAIN]);
}
const T0 = Date.parse('2026-10-05T03:00:00Z');
// 페이지 준비: 시각·난수 고정, 이벤트 기록, 콜백·창 함수 대역
const PRELUDE = `(function(){
  var RD=Date; var T=${T0}; function D(){ if(!(this instanceof D)) return new RD(T).toString(); var a=[].slice.call(arguments); return a.length? new (Function.prototype.bind.apply(RD,[null].concat(a)))(): new RD(T);} D.prototype=RD.prototype; D.now=function(){return T;}; D.UTC=RD.UTC; D.parse=RD.parse; window.Date=D;
  var s=1; Math.random=function(){ s=(s*16807)%2147483647; return (s-1)/2147483646; }; window.__seed=function(n){ s=n; };
  window.__ael=[]; var oA=EventTarget.prototype.addEventListener; EventTarget.prototype.addEventListener=function(t,f,o){ window.__ael.push({el:this,type:t,opts:o===undefined?null:JSON.stringify(o)}); return oA.call(this,t,f,o); };
  window.__log=[]; var sum=function(x){ if(x===undefined) return 'u'; if(x===null) return 'n'; if(typeof x==='function') return 'fn'; if(typeof x==='string') return 's'+x.length+':'+x.slice(0,120); if(typeof x==='object') return 'o:'+Object.keys(x).join(','); return typeof x+':'+String(x); };
  var M=function(){ return document.getElementById('modalOverlay'); };
  window.openModal=function(html,cb){ window.__log.push(['openModal',sum(html),sum(cb)]); M().innerHTML=html; if(typeof cb==='function') cb(M()); };
  window.closeModal=function(){ window.__log.push(['closeModal']); M().innerHTML=''; };
  window.toast=function(m){ window.__log.push(['toast',sum(m)]); };
  window.alert=function(m){ window.__log.push(['alert',String(m)]); };
  window.__blobs=[]; var oC=URL.createObjectURL; URL.createObjectURL=function(b){ window.__blobs.push(b); return 'blob:stub/'+window.__blobs.length; };
  HTMLAnchorElement.prototype.click=function(){ window.__log.push(['anchorClick',this.download||'',String(this.href).slice(0,40)]); };
  window.__cb=function(){ return { openModal: window.openModal, closeModal: window.closeModal, toast: window.toast,
    saveProfile: function(){ window.__log.push(['saveProfile']); }, onDone: function(){ window.__log.push(['onDone',[].slice.call(arguments).map(sum).join('|')]); } }; };
})();`;
// 데이터 상태(브라우저 안에서 공개 API 로 만든다 — 같은 씨앗)
const DATA = {
  empty: 'return [];',
  big3: "return U.generateDomainSample('big3');",
  running: "return U.generateDomainSample('running');",
  hyrox: "return U.generateDomainSample('hyrox');",
  study: "return U.generateDomainSample('study');",
  coding: "return U.generateDomainSample('coding');",
  sales: "return U.generateDomainSample('sales');",
  weight: "return U.generateDomainSample('weight');",
  reading: "return U.generateDomainSample('reading');",
  sleep: "return U.generateDomainSample('sleep');",
  finance: "return U.generateDomainSample('finance');",
  pl52: 'return U.generate52WeekPowerliftingSample();',
  olympic1920: 'return U.generate1920sOlympicStrengthSample();',
  mixed: "return U.generateDomainSample('big3').concat(U.generateDomainSample('study'), U.generateDomainSample('sales'));",
  one: "return [{ id: 'r1', startAt: '2026-10-01T09:00:00Z', theme: 'workout', subTheme: '스쿼트', text: '한 건', metrics: { primary: 100, primaryUnit: 'kg', secondary: 5, secondaryUnit: '회' } }];",
  noDate: "return [{ id: 'n1', theme: 'workout', subTheme: '벤치', text: '날짜 없음', metrics: { primary: 60, primaryUnit: 'kg' } }, { id: 'n2', theme: 'study', subTheme: '수학', metrics: { primary: 3 } }];",
};
// [이름, 데이터, state 덧칠(JSON), localStorage 덧칠, 조작 묶음]
const SCEN = [];
for (const k of Object.keys(DATA)) if (k !== 'empty') SCEN.push([k, k, null, null, 'full']);
SCEN.push(['custom-schemas', 'mixed', { profile: { customSchemas: [{ name: '새스키마', unit: 'kg', theme: 'workout' }, { name: '독서량', unit: '쪽', theme: 'reading' }] } }, null, 'full']);
SCEN.push(['preset-ratio-bad-names', 'mixed', { univLens: 'ratio', univRatioNum: '없는이름', univRatioDen: '또없음' }, null, 'full']);
SCEN.push(['preset-all-3d-normalized', 'big3', { univMode: 'all', univPeriod: '3d', univScaleMode: 'normalized' }, null, 'full']);
SCEN.push(['preset-multi-dims', 'pl52', { univSelectedDimensions: ['1rm', 'volume', 'bodyweight'], univDimension: 'volume' }, null, 'full']);
SCEN.push(['preset-bad-dim', 'running', { univSelectedDimensions: ['없는지표'], univDimension: '없는지표' }, null, 'full']);
SCEN.push(['preset-multi-mode', 'mixed', { univMode: 'multi', univSelectedEntities: ['스쿼트'] }, null, 'full']);
SCEN.push(['preset-collapsed', 'big3', null, { ourgoal_uStats_expanded: 'false' }, 'full']);
SCEN.push(['preset-cadence-all', 'sales', { univLens: 'cadence', univMode: 'all' }, null, 'full']);
SCEN.push(['preset-radar', 'coding', { univLens: 'radar' }, null, 'full']);
for (const b of ['sales', 'coding', 'study', 'big3']) SCEN.push(['empty-load-' + b, 'empty', null, null, 'empty:' + b]);
SCEN.push(['empty-import', 'empty', null, null, 'empty-import']);
SCEN.push(['empty-no-container', 'empty', null, null, 'no-container']);

const click = sel => ({ k: 'click', sel });
const FULL = [
  ['lens-ratio', click('.u-lens-btn[data-lens="ratio"]')],
  ['ratio-num-last', { k: 'select', sel: '#uRatioNumSelect', pick: 'last' }],
  ['ratio-den-first', { k: 'select', sel: '#uRatioDenSelect', pick: 'first' }],
  ['lens-radar', click('.u-lens-btn[data-lens="radar"]')],
  ['lens-cadence', click('.u-lens-btn[data-lens="cadence"]')],
  ['lens-trend', click('.u-lens-btn[data-lens="trend"]')],
  ['mode-toggle-1', click('.u-mode-btn')],
  ['mode-toggle-2', click('.u-mode-btn')],
  ['chip-2', { k: 'clickNth', sel: '.u-entity-chip', n: 1 }],
  ['chip-1', { k: 'clickNth', sel: '.u-entity-chip', n: 0 }],
  ['period-3m', click('.u-period-btn[data-period="3m"]')],
  ['period-1w', click('.u-period-btn[data-period="1w"]')],
  ['period-all', click('.u-period-btn[data-period="all"]')],
  ['scale-normalized', click('.u-scale-btn[data-scale="normalized"]')],
  ['scale-linear', click('.u-scale-btn[data-scale="linear"]')],
  ['dim-add-2', { k: 'clickNth', sel: '.u-dim-btn', n: 1 }],
  ['dim-add-3', { k: 'clickNth', sel: '.u-dim-btn', n: 2 }],
  ['dim-remove-1', { k: 'clickNth', sel: '.u-dim-btn', n: 0 }],
  ['crosshair-move', { k: 'hover' }],
  ['tip-edit', click('#uTipEditBtn')],
  ['tip-edit-save', click('#uEditRowSaveBtn')],
  ['fs-open', click('#uBtnGraphFullscreen')],
  ['fs-rotate', click('#uFsRotateBtn')],
  ['fs-close', click('#uFsCloseBtn')],
  ['mgmt-open', click('#uHdrMgmtMenuBtn')],
  ['mgmt-import', click('#uMenuImportBtn')],
  ['mgmt-quick-running', click('.u-sample-quick-btn[data-quick-sample="running"]')],
  ['anchor-grid', click('#uHdrGridBtn')],
  ['anchor-grid-close', { k: 'closeModal' }],
  ['anchor-import', click('#uHdrImportBtn')],
  ['anchor-quick-study', click('.u-sample-quick-btn[data-quick-sample="study"]')],
  ['anchor-csv', click('#uHdrExportCsvBtn')],
  ['anchor-snap', click('#uHdrSnapBtn')],
  ['taxonomy-btn', click('#uTaxonomyOpenBtn')],
  ['header-collapse', click('.u-cockpit-header')],
  ['icon-expand', click('#uAccordionToggleIcon')],
  ['header-collapse-2', click('.u-cockpit-header')],
  ['header-expand-2', click('.u-cockpit-header')],
];
const STEPS_OF = kind => {
  if (kind === 'full') return FULL;
  if (kind.startsWith('empty:')) { const t = kind.slice(6); return [['empty-load-' + t, click('.u-empty-load-btn[data-type="' + t + '"]')], ['after-lens-ratio', click('.u-lens-btn[data-lens="ratio"]')], ['after-mgmt', click('#uHdrMgmtMenuBtn')]]; }
  if (kind === 'empty-import') return [['empty-import-open', click('#uEmptyImportBtn')], ['empty-import-quick-hyrox', click('.u-sample-quick-btn[data-quick-sample="hyrox"]')], ['after-lens-cadence', click('.u-lens-btn[data-lens="cadence"]')]];
  return [];
};

async function snapshot(page) {
  return page.evaluate(async () => {
    const pathOf = el => { if (!el || !el.isConnected) return '<detached>'; if (el === document) return 'document'; if (el === window) return 'window'; const seg = []; let e = el; while (e && e.nodeType === 1 && e !== document.body) { let s = e.tagName.toLowerCase(); if (e.id) { s += '#' + e.id; seg.unshift(s); break; } const p = e.parentElement; if (p) { const same = [...p.children].filter(c => c.tagName === e.tagName); if (same.length > 1) s += ':' + (same.indexOf(e) + 1); } seg.unshift(s); e = p; } return seg.join('>'); };
    const ON = ['onclick', 'onchange', 'oninput', 'onkeyup', 'onkeydown', 'onsubmit', 'onmousemove', 'onmouseleave', 'ontouchstart', 'ontouchmove', 'onscroll', 'onfocus', 'onblur'];
    const props = [];
    for (const el of document.body.querySelectorAll('*')) { const has = ON.filter(k => typeof el[k] === 'function' && !el.hasAttribute(k)); if (has.length) props.push(pathOf(el) + '=' + has.join(',')); }
    const ael = window.__ael.map(r => pathOf(r.el) + '|' + r.type + '|' + r.opts);
    const ls = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); ls[k] = localStorage.getItem(k); }
    const blobs = []; for (const b of window.__blobs) blobs.push(await b.text());
    let st = null; try { st = JSON.stringify(window.__state); } catch (e) { st = 'ERR ' + e.message; }
    return { html: document.body.innerHTML, props, ael, ls: JSON.stringify(ls), state: st, log: JSON.stringify(window.__log), blobs: JSON.stringify(blobs) };
  });
}
async function runScenario(browser, app, order, sc) {
  const [name, dataKey, stateOver, lsOver, kind] = sc;
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR ' + String(e && e.message || e).slice(0, 200)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
  await page.goto(ORIGIN + '/', { waitUntil: 'load' });
  await page.evaluate(PRELUDE);
  for (const r of order) await page.addScriptTag({ content: read(path.join(app, r)) + '\n//# sourceURL=' + r });
  const init = await page.evaluate((dataSrc, stateOver, lsOver, kind) => {
    const U = window.OurgoalUniversalStats; if (!U) return 'no-api';
    localStorage.clear(); if (lsOver) for (const k of Object.keys(lsOver)) localStorage.setItem(k, lsOver[k]);
    window.__seed(11);
    const recs = new Function('U', dataSrc)(U);
    const state = { profile: { records: recs } };
    if (stateOver) for (const k of Object.keys(stateOver)) { if (k === 'profile') Object.assign(state.profile, stateOver.profile); else state[k] = stateOver[k]; }
    window.__state = state; window.__seed(23);
    try { U.renderUniversalStatsDashboard(kind === 'no-container' ? null : document.getElementById('c'), recs, state, window.__cb()); } catch (e) { return 'THROW ' + e.message; }
    return 'rendered ' + recs.length;
  }, DATA[dataKey], stateOver, lsOver, kind);
  const settle = () => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 30)))));
  await settle();
  const steps = [];
  const take = async (stepName, note) => { const s = await snapshot(page); steps.push(Object.assign({ step: stepName, note }, s)); };
  await take('render', init);
  for (const [stepName, act] of STEPS_OF(kind)) {
    const note = await page.evaluate(act => {
      const q = s => document.querySelector(s);
      try {
        if (act.k === 'click') { const el = q(act.sel); if (!el) return 'missing'; el.click(); return 'clicked'; }
        if (act.k === 'clickNth') { const el = document.querySelectorAll(act.sel)[act.n]; if (!el) return 'missing'; el.click(); return 'clicked'; }
        if (act.k === 'select') { const el = q(act.sel); if (!el) return 'missing'; const o = el.options; if (!o.length) return 'no-options'; el.value = act.pick === 'last' ? o[o.length - 1].value : o[0].value; el.dispatchEvent(new Event('change', { bubbles: true })); return 'changed ' + el.value; }
        if (act.k === 'closeModal') { window.closeModal(); return 'closed'; }
        if (act.k === 'hover') {
          const cap = q('#uCrosshairCapture'); if (!cap) return 'missing';
          const r = cap.getBoundingClientRect(); const tip = q('#uFloatingInspector');
          for (const fx of [0.5, 0.25, 0.75, 0.1, 0.9, 0.05, 0.95]) for (const fy of [0.5, 0.3, 0.7, 0.15, 0.85]) {
            cap.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: r.left + r.width * fx, clientY: r.top + r.height * fy }));
            if (tip && tip.style.display === 'block') return 'tip at ' + fx + ',' + fy;
          }
          return 'moved-no-tip';
        }
      } catch (e) { return 'THROW ' + e.message; }
      return 'unknown';
    }, act);
    await settle();
    await take(stepName, note);
  }
  await page.close();
  return { name, steps, errors };
}
// 빈 쪽 하나만 내주는 로컬 서버(localStorage 가 있는 출처가 필요하다 — about:blank 는 막힌다). 부품 글자는 addScriptTag 로 넣는다.
const BLANK = '<!doctype html><html><head><meta charset="utf-8"></head><body><div id="c" style="width:359px"></div><div id="modalOverlay"></div></body></html>';
let ORIGIN = null;
async function runApp(app) {
  const order = loadOrder(app);
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-gpu', '--lang=ko-KR'] });
  const out = [];
  try { for (const sc of SCEN) out.push(await runScenario(browser, app, order, sc)); } finally { await browser.close(); }
  return { order, scen: out };
}
const FIELDS = ['note', 'html', 'props', 'ael', 'ls', 'state', 'log', 'blobs'];
(async () => {
  const srv = http.createServer((req, res) => { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(BLANK); });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  ORIGIN = 'http://127.0.0.1:' + srv.address().port;
  const a = await runApp(BASE), b = await runApp(APP);
  const diffs = []; const cases = [];
  let steps = 0, rendered = 0, wired = 0, missing = 0, clicked = 0;
  a.scen.forEach((sa, i) => {
    const sb = b.scen[i];
    const errSame = JSON.stringify(sa.errors) === JSON.stringify(sb.errors);
    if (!errSame) diffs.push({ scen: sa.name, step: '*', field: 'errors', base: sa.errors, work: sb.errors });
    if (sa.steps.length !== sb.steps.length) diffs.push({ scen: sa.name, step: '*', field: 'stepCount', base: sa.steps.length, work: sb.steps.length });
    sa.steps.forEach((x, j) => {
      const y = sb.steps[j] || {};
      steps++;
      if (/^rendered [1-9]/.test(x.note)) rendered++;
      if (x.note === 'missing') missing++; else if (/^(clicked|changed|tip|closed)/.test(x.note)) clicked++;
      wired += x.props.length + x.ael.length;
      for (const k of FIELDS) {
        const p = JSON.stringify(x[k]), q = JSON.stringify(y[k]);
        if (p === q) continue;
        let at = 0; while (at < p.length && p[at] === q[at]) at++;
        diffs.push({ scen: sa.name, step: x.step, field: k, base: p.slice(Math.max(0, at - 100), at + 160), work: (q || '').slice(Math.max(0, at - 100), at + 160) });
      }
      cases.push({ scen: sa.name, step: x.step, note: x.note, workNote: y.note, htmlBytes: x.html.length, htmlSha: sha(x.html), workHtmlSha: sha(y.html || ''), props: x.props.length, ael: x.ael.length, stateSha: sha(x.state), logSha: sha(x.log) });
    });
  });
  const errorsTotal = a.scen.reduce((s, x) => s + x.errors.length, 0);
  const report = { task: 'TASK-ES-428', what: 'renderUniversalStatsDashboard 출력 HTML·이벤트 배선·state·localStorage·콜백·알림·Blob·페이지 오류 — 같은 데이터 상태·같은 조작에서 기준 대 작업', base: BASE === APP ? 'same-dir(base vs base)' : 'base vs work',
    loadOrderBase: a.order, loadOrderWork: b.order, scenarios: a.scen.length, steps, renderedNonEmpty: rendered, actionsApplied: clicked, actionsMissing: missing, wiringRecords: wired, errorsBase: errorsTotal,
    differing: diffs.length, ok: diffs.length === 0 && steps > 0 && clicked > 0, diffs: diffs.slice(0, 200), cases };
  console.log(JSON.stringify({ ok: report.ok, scenarios: report.scenarios, steps, renderedNonEmpty: rendered, actionsApplied: clicked, actionsMissing: missing, wiringRecords: wired, errorsBase: errorsTotal, differing: diffs.length }));
  for (const d of diffs.slice(0, 10)) console.log('DIFF', JSON.stringify(d).slice(0, 500));
  if (OUT) fs.writeFileSync(OUT, JSON.stringify(report, null, 1));
  srv.close();
  process.exitCode = report.ok ? 0 : 1;
})().catch(e => { console.error(e); process.exitCode = 1; });
