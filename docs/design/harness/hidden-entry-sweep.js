'use strict';
/* 숨김 게이트 — 느린 브라우저판 (#TASK-ES-458 · W98 재발 방지, 수동 실행 — npm test 에서 돌지 않는다)
 *
 * 정적판(scripts/hidden-entry-guard.js)이 못 보는 것 — 자바스크립트가 그린 마크업·실행 중 붙는 클래스·조상 높이 0 등 — 까지
 * 실제 화면에서 잰다. 게스트 시드로 4테마 × 6탭 × 상태(docs/design/harness/tab-states.js)를 열고, 장마다 누르는 요소를 모아
 * 「늘 숨은(!important 숨김 또는 인라인 !important) 처리기 요소 중 같은 처리기·같은 함수·같은 글자의 보이는 요소가 하나도 없는 것」
 * (= 보이는 진입로 0)을 허용 목록(docs/architecture/hidden-entry-sweep-baseline.json)과 견준다. 새로 생긴 것이 있으면 종료 코드 1.
 * (#TASK-ES-440 숨김 전수 실측 도구 sweep.js 를 저장소로 옮겨 판정부를 붙였다.)
 *
 * 사용:
 *   node docs/design/harness/hidden-entry-sweep.js <APP_DIR> [--out 결과.json] [--raw 원자료.json] [--themes a,b] [--baseline 허용목록.json] [--quiet]
 *   node docs/design/harness/hidden-entry-sweep.js --from 원자료.json[,원자료2.json] [--out 결과.json]   — 다시 열지 않고 원자료만 판정
 * 한 번에 68장(4테마 기본)·10분 안팎. 진입에 실패한 장은 그 장의 요소를 못 본 것이므로 결과에 「진입 실패」로 따로 적는다.
 */
const http = require('http'), fs = require('fs'), path = require('path');
const H = __dirname + '/';
const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const FROM = opt('--from');
const OUT = opt('--out') ? path.resolve(opt('--out')) : null;
const RAW = opt('--raw') ? path.resolve(opt('--raw')) : null;
const QUIET = argv.includes('--quiet');
const BASELINE = path.resolve(opt('--baseline') || path.join(__dirname, '..', '..', 'architecture', 'hidden-entry-sweep-baseline.json'));
const APP_DIR = FROM ? null : path.resolve(argv.find((a, i) => !a.startsWith('--') && (i === 0 || !argv[i - 1].startsWith('--'))) || path.join(__dirname, '..', '..', '..'));
const THEMES = (opt('--themes') || 'focus-sanctuary,black,white,urban-city').split(',');
const TABS = ['home', 'goals', 'calendar', 'records', 'comm', 'settings'];
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const puppeteer = FROM ? null : require('C:/dev/command-center/node_modules/puppeteer-core');
const shots = FROM ? null : require(H + 'shots-lib.js');
const { STATES, boot, goTab, sleep } = FROM ? {} : require(H + 'tab-states.js');

const INSTRUMENT = () => {
  const CLICKY = new Set(['click', 'pointerdown', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'dblclick']);
  const L = new WeakMap(); const DELEG = [];
  window.__ogL = L; window.__ogDeleg = DELEG;
  const where = () => {
    const st = (new Error().stack || '').split('\n').slice(3);
    const f = st.find(l => /localhost:\d+\//.test(l)) || '';
    return f.trim().replace(/^at\s+/, '').replace(/https?:\/\/localhost:\d+\//, '').replace(/\?v=[^:]*/, '');
  };
  const rec = (target, type, fn) => {
    const src = String(fn && fn.toString ? fn.toString() : fn);
    const item = { type, at: where(), src: src.slice(0, 400) };
    if (target === document || target === window || target === document.body || target === document.documentElement) { item.target = target === window ? 'window' : target === document ? 'document' : target.tagName; item.full = src.slice(0, 6000); DELEG.push(item); return; }
    let a = L.get(target); if (!a) { a = []; L.set(target, a); } a.push(item);
  };
  const orig = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function (type, fn, opt) {
    try { if (CLICKY.has(type) && (this instanceof Element || this === document || this === window)) rec(this, type, fn); } catch (e) {}
    return orig.call(this, type, fn, opt);
  };
  const d = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'onclick');
  Object.defineProperty(HTMLElement.prototype, 'onclick', { configurable: true, enumerable: true, get() { return d.get.call(this); }, set(v) { try { if (v) rec(this, 'onclick-prop', v); } catch (e) {} d.set.call(this, v); } });
};

const COLLECT = (tab, stateKey) => {
  const vw = innerWidth;
  const L = window.__ogL;
  const label = (el) => el.id ? '#' + el.id : el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.') : '');
  const pathOf = (el) => {
    const parts = [];
    for (let e = el; e && e !== document.body && parts.length < 8; e = e.parentElement) {
      if (e.id) { parts.unshift('#' + e.id); break; }
      let s = e.tagName.toLowerCase();
      if (typeof e.className === 'string' && e.className.trim()) s += '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.');
      const p = e.parentElement; if (p) { const same = [...p.children].filter(c => c.tagName === e.tagName); if (same.length > 1) s += ':nth-of-type(' + (same.indexOf(e) + 1) + ')'; }
      parts.unshift(s);
    }
    return parts.join(' > ');
  };
  // 규칙 표 (현재 맞는 미디어 포함)
  const rules = [];
  const walk = (list, sheetName, media) => {
    for (const r of list) {
      if (r.cssRules && !r.selectorText) { const ok = r.media ? matchMedia(r.media.mediaText).matches : true; if (ok) { try { walk(r.cssRules, sheetName, r.media ? r.media.mediaText : media); } catch (e) {} } continue; }
      if (!r.style || !r.selectorText) continue;
      const dv = r.style.getPropertyValue('display').trim(), vv = r.style.getPropertyValue('visibility').trim();
      const hv = r.style.getPropertyValue('height').trim(), mh = r.style.getPropertyValue('max-height').trim(), op = r.style.getPropertyValue('opacity').trim();
      if (dv === 'none' || vv === 'hidden' || hv === '0' || hv === '0px' || mh === '0' || mh === '0px' || op === '0')
        rules.push({ sel: r.selectorText, sheet: sheetName, media, display: dv, imp: r.style.getPropertyPriority('display') === 'important' || r.style.getPropertyPriority('visibility') === 'important', vis: vv, h: hv || mh, op });
    }
  };
  for (const sh of document.styleSheets) {
    let list = null; try { list = sh.cssRules; } catch (e) { continue; }
    const owner = sh.ownerNode; const name = sh.href ? sh.href.replace(/^https?:\/\/localhost:\d+\//, '').replace(/\?.*/, '') : ('<style' + (owner && owner.id ? '#' + owner.id : '') + (owner && owner.dataset && Object.keys(owner.dataset).length ? ' data=' + JSON.stringify(owner.dataset).slice(0, 60) : '') + ' idx=' + [...document.querySelectorAll('style')].indexOf(owner) + '>');
    walk(list, name, null);
  }
  const rulesFor = (el, kind) => rules.filter(r => { if (kind === 'display' && r.display !== 'none') return false; if (kind === 'visibility' && r.vis !== 'hidden') return false; try { return el.matches(r.sel); } catch (e) { return false; } }).map(r => ({ sel: r.sel.slice(0, 160), sheet: r.sheet, media: r.media, imp: r.imp }));

  const hideOf = (el) => {
    const chain = []; for (let e = el; e && e !== document.documentElement; e = e.parentElement) chain.push(e);
    const visHidden = (e) => { const v = getComputedStyle(e).visibility; return v === 'hidden' || v === 'collapse'; };
    const pick = () => {
      // 1) display:none / hidden 속성 / 접힌 details — 가장 가까운 조상  2) visibility — 숨김을 시작한 가장 바깥 조상  3) opacity 0
      for (const e of chain) {
        if (e.hidden && getComputedStyle(e).display === 'none') return [e, 'hidden-attr'];
        if (getComputedStyle(e).display === 'none') return [e, 'display'];
        if (e.tagName === 'DETAILS' && !e.open && e !== el && !(el.tagName === 'SUMMARY' && el.parentElement === e)) return [e, 'details-closed'];
      }
      if (visHidden(el)) { let top = el; for (const e of chain) { if (visHidden(e)) top = e; else break; } return [top, 'visibility']; }
      for (const e of chain) if (parseFloat(getComputedStyle(e).opacity) === 0) return [e, 'opacity0'];
      return null;
    };
    const pk = pick();
    if (pk) {
      const [e, kind] = pk;
      const cs = getComputedStyle(e);
      const out = { kind, root: label(e), rootPath: pathOf(e), self: e === el };
      if (kind === 'display' || kind === 'visibility') {
        const inl = e.getAttribute('style') || '';
        if (kind === 'display' && e.style.display === 'none') out.inline = { imp: e.style.getPropertyPriority('display') === 'important', text: inl.slice(0, 120) };
        out.rules = rulesFor(e, kind).slice(0, 6);
        out.imp = !!(out.inline && out.inline.imp) || out.rules.some(r => r.imp);
      }
      out.isScreen = e.classList.contains('screen');
      out.screenActive = e.classList.contains('active');
      return out;
    }
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return { kind: 'zero-size', root: label(el), rootPath: pathOf(el), self: true, w: r.width, h: r.height };
    if (r.right < -50 || r.left > vw * 1.05 || r.top > document.documentElement.scrollHeight + 50) {
      let sc = null; for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) { const ox = getComputedStyle(e).overflowX; if (ox === 'auto' || ox === 'scroll') { sc = label(e); break; } }
      if (!sc || r.left < -2000 || r.left > 3000) return { kind: sc ? 'offscreen' : 'offscreen-noscroll', root: label(el), rootPath: pathOf(el), self: true, left: Math.round(r.left), scroller: sc };
    }
    // 조상 높이 0 + overflow hidden
    for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) {
      const q = e.getBoundingClientRect(); const cs = getComputedStyle(e);
      if ((q.height < 1 || q.width < 1) && cs.overflow !== 'visible') return { kind: 'ancestor-zero-clip', root: label(e), rootPath: pathOf(e), self: false };
    }
    return null;
  };
  const SEL = 'button, a[href], [onclick], [role="button"], [data-action], input[type=button], input[type=submit], summary, [data-act], [data-cmd]';
  const set = new Set(document.querySelectorAll(SEL));
  for (const el of document.querySelectorAll('body *')) if (L && L.get(el)) set.add(el);
  const screenOf = (el) => { const s = el.closest('.screen'); return s ? s.id : null; };
  const out = [];
  for (const el of set) {
    if (el.closest('script,template,noscript,style')) continue;
    const scr = screenOf(el);
    const hide = hideOf(el);
    const ls = (L && L.get(el)) || [];
    const dataAttrs = {}; for (const a of el.attributes) if (/^data-/.test(a.name)) dataAttrs[a.name] = a.value.slice(0, 60);
    out.push({
      key: pathOf(el), label: label(el), tag: el.tagName.toLowerCase(), id: el.id || null,
      text: (el.getAttribute('aria-label') || el.textContent || el.getAttribute('title') || '').replace(/\s+/g, ' ').trim().slice(0, 60),
      onclick: (el.getAttribute('onclick') || '').slice(0, 300) || null, href: el.tagName === 'A' ? (el.getAttribute('href') || '').slice(0, 100) : null,
      data: Object.keys(dataAttrs).length ? dataAttrs : null,
      listeners: ls.map(x => ({ type: x.type, at: x.at, src: x.src.slice(0, 250) })),
      screen: scr, screenActive: scr ? document.getElementById(scr).classList.contains('active') : null,
      visible: !hide, hide, disabled: !!el.disabled
    });
  }
  return { tab, state: stateKey, activeScreen: (document.querySelector('.screen.active') || {}).id || null, theme: document.documentElement.getAttribute('data-theme') || document.body.getAttribute('data-theme'), uxMode: document.body.getAttribute('data-ux-mode'), elements: out,
    deleg: (window.__ogDeleg || []).map(d => ({ target: d.target, type: d.type, at: d.at, full: d.full })) };
};

function startServer(appDir, port) {
  const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.webp': 'image/webp' };
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/') p = '/index.html';
    if (p.startsWith('/api/')) { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end('{"ok":true}'); }
    const f = path.join(appDir, p);
    if (!f.startsWith(appDir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise(r => server.listen(port, () => r(server)));
}

async function one(browser, base, theme, tab, st) {
  const ctx = await browser.createBrowserContext();
  try {
    const page = await shots.newPage(ctx, true, theme);
    await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await page.evaluateOnNewDocument(INSTRUMENT);
    await page.goto(base + '/', { waitUntil: 'networkidle2', timeout: 60000 });
    await sleep(1500);
    await boot(page);
    const nav = await goTab(page, tab);
    let entry = { entered: nav.ok, note: nav.note };
    if (nav.ok && st.key !== 'base') { try { entry = await st.enter(page); } catch (e) { entry = { entered: false, note: String(e).slice(0, 100) }; } }
    await sleep(600);
    const r = await page.evaluate(COLLECT, tab, st.key);
    r.entered = !!entry.entered; r.enterNote = entry.note || null; r.themeReq = theme;
    return r;
  } catch (e) { return { tab, state: st.key, themeReq: theme, error: String(e).slice(0, 200) }; }
  finally { await ctx.close().catch(() => {}); }
}


/* ---------- 분석: 늘 숨은 처리기 요소 중 보이는 진입로가 0 인 것 ---------- */
const GENERIC = new Set(['if', 'for', 'while', 'switch', 'return', 'function', 'catch', 'stopPropagation', 'preventDefault', 'closest', 'querySelector', 'querySelectorAll', 'getElementById', 'setTimeout', 'forEach', 'map', 'filter', 'find', 'includes', 'add', 'remove', 'toggle', 'contains', 'getAttribute', 'setAttribute', 'trim', 'push', 'call', 'apply', 'bind', 'then', 'String', 'Number', 'Boolean', 'parseInt', 'Date', 'now', 'log', 'warn', 'error', 'showToast', 'toast', 'save', 'saveProfile', 'render', 'scrollIntoView', 'focus', 'blur', 'click', 'dispatchEvent', 'Event', 'CustomEvent', 'requestAnimationFrame', 'JSON', 'stringify', 'parse', 'replace', 'slice', 'split', 'join', 'test', 'match', 'indexOf', 'keys', 'values', 'entries', 'from', 'Array', 'Object', 'assign', 'Math', 'max', 'min', 'round', 'floor', 'hasAttribute', 'removeAttribute', 'matches', 'some', 'every', 'reduce', 'vibrate', 'haptic', 'playSound', 'navigate', 'typeof', 'new', 'Promise', 'resolve', 'await', 'async', 'console', 'openModal', 'closeModal', 'switchTab', 'goTab', 'createElement', 'appendChild', 'insertAdjacentHTML', 'innerHTML', 'textContent', 'getBoundingClientRect', 'scrollTo', 'location', 'open', 'confirm', 'alert', 'prompt', 'localStorage', 'getItem', 'setItem', 'triggerHaptic', 'triggerHapticFeedback']);
const fnNames = (s) => { const out = new Set(); const re = /([A-Za-z_$][\w$]*)\s*\(\s*(['"]([^'"]{0,40})['"])?/g; let m; while ((m = re.exec(s || ''))) { if (GENERIC.has(m[1]) || m[1].length <= 3) continue; out.add(m[3] !== undefined ? m[1] + "('" + m[3] + "')" : m[1]); } return [...out]; };
const sigOf = (e) => {
  const s = new Set();
  if (e.onclick) s.add('oc:' + e.onclick.replace(/\s+/g, ' ').trim());
  for (const l of e.listeners || []) { if (l.at) s.add('at:' + l.at.replace(/:\d+\)?$/, '').replace(/\)$/, '')); }
  if (e.data) for (const [k, v] of Object.entries(e.data)) if (/action|act|cmd|open|nav|tab|go|target/.test(k)) s.add('da:' + k + '=' + v);
  const fns = new Set(); fnNames(e.onclick).forEach(f => fns.add(f)); for (const l of e.listeners || []) fnNames(l.src).forEach(f => fns.add(f));
  return { sigs: [...s], fns: [...fns] };
};
function analyze(results) {
  const agg = new Map();
  for (const r of results) {
    if (r.error) continue;
    for (const e of r.elements) {
      if (e.screen && e.screen !== r.activeScreen) continue; // 다른 탭 화면 안의 요소는 그 탭에서만 센다
      let a = agg.get(e.key);
      if (!a) { a = { key: e.key, label: e.label, tag: e.tag, text: e.text, onclick: e.onclick, data: e.data, listeners: e.listeners || [], vis: 0, imp: false, hide: null }; agg.set(e.key, a); }
      if ((e.listeners || []).length > a.listeners.length) a.listeners = e.listeners;
      if (e.visible) a.vis++;
      else { if (e.hide && e.hide.imp) a.imp = true; if (!a.hide && e.hide) a.hide = { kind: e.hide.kind, root: e.hide.rootPath, rules: (e.hide.rules || []).map(x => x.sel).slice(0, 3), inline: e.hide.inline || null }; }
    }
  }
  const all = [...agg.values()];
  const vSig = new Set(), vFn = new Set(), vText = new Set();
  for (const a of all) if (a.vis > 0) { const { sigs, fns } = sigOf(a); sigs.forEach(s => vSig.add(s)); fns.forEach(f => vFn.add(f)); if (a.text) vText.add(a.text); }
  const hasHandler = (a) => !!(a.onclick || a.listeners.length || (a.data && Object.keys(a.data).some(k => /action|act|cmd/.test(k))));
  const stuck = all.filter(a => a.vis === 0 && a.imp && hasHandler(a)).filter(a => {
    const { sigs, fns } = sigOf(a);
    return !sigs.some(s => vSig.has(s)) && !fns.some(f => vFn.has(f)) && !(a.text && vText.has(a.text));
  }).map(a => ({ key: a.key, text: a.text, hide: a.hide }));
  return { elements: all.length, neverVisibleWithHandler: all.filter(a => a.vis === 0 && hasHandler(a)).length, stuck: stuck.sort((x, y) => x.key < y.key ? -1 : 1) };
}
function compare(an, baselineFile) {
  const b = fs.existsSync(baselineFile) ? JSON.parse(fs.readFileSync(baselineFile, 'utf8')) : { groups: [] };
  const errs = [];
  (b.groups || []).forEach((g, i) => { if (!g || typeof g.reason !== 'string' || g.reason.trim().length < 20) errs.push('묶음 ' + (i + 1) + ': 사유 20자 미만'); });
  // 키 끝이 ' *' 이면 그 앞으로 시작하는 모든 키(날짜에 따라 칸 번호가 바뀌는 달력 칸처럼 경로가 흔들리는 묶음)
  const keys = (b.groups || []).flatMap(g => g.keys || []);
  const allows = (k) => keys.some(a => a.endsWith(' *') ? k.startsWith(a.slice(0, -2)) : a === k);
  const used = (a) => an.stuck.some(s => a.endsWith(' *') ? s.key.startsWith(a.slice(0, -2)) : s.key === a);
  return { ok: !errs.length && an.stuck.every(s => allows(s.key)), errors: errs, added: an.stuck.filter(s => !allows(s.key)), gone: keys.filter(a => !used(a)) };
}
function report(an, cmp) {
  console.log('[숨김 게이트·브라우저판] 늘 숨은(!important) 처리기 요소 중 보이는 진입로 0: ' + an.stuck.length + '개 · 허용 목록 밖 ' + cmp.added.length + '개');
  for (const e of cmp.errors) console.log('  ✖ 허용 목록: ' + e);
  for (const s of cmp.added) console.log('  ✖ ' + s.key + ' "' + (s.text || '') + '" ← ' + JSON.stringify(s.hide).slice(0, 200));
  if (cmp.gone.length) console.log('  ℹ 더는 갇히지 않은 허용 항목 ' + cmp.gone.length + '개: ' + cmp.gone.slice(0, 8).join(', '));
  console.log(cmp.ok ? '✓ 숨김 게이트(브라우저판) 통과' : '✖ 숨김 게이트(브라우저판) 실패');
}

(async () => {
  if (FROM) {
    const results = FROM.split(',').flatMap(f => JSON.parse(fs.readFileSync(f, 'utf8')).results);
    const an = analyze(results); const cmp = compare(an, BASELINE);
    if (OUT) fs.writeFileSync(OUT, JSON.stringify({ analyzedFrom: FROM, analysis: an, compare: cmp }, null, 1) + '\n', 'utf8');
    report(an, cmp); process.exit(cmp.ok ? 0 : 1);
  }
  const server = await startServer(APP_DIR, 0);
  const port = server.address().port;
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-gpu', '--lang=ko-KR',
    '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost, EXCLUDE fonts.googleapis.com, EXCLUDE fonts.gstatic.com, EXCLUDE cdn.jsdelivr.net'] });
  const base = 'http://localhost:' + port;
  const jobs = [];
  for (const theme of THEMES) for (const tab of TABS) for (const st of STATES[tab]) jobs.push({ theme, tab, st });
  const results = []; let i = 0;
  const worker = async () => { while (i < jobs.length) { const j = jobs[i++]; const r = await one(browser, base, j.theme, j.tab, j.st); results.push(r); if (!QUIET) console.log(j.theme, j.tab, j.st.key, r.error ? 'ERR ' + r.error : ('entered=' + r.entered + ' els=' + r.elements.length)); } };
  try { await Promise.all([worker(), worker()]); }
  finally { await browser.close().catch(() => {}); server.close(); }
  const notEntered = results.filter(r => r.error || !r.entered).map(r => r.themeReq + '/' + r.tab + '/' + r.state);
  const an = analyze(results); const cmp = compare(an, BASELINE);
  if (RAW) fs.writeFileSync(RAW, JSON.stringify({ appDir: APP_DIR, measuredAt: new Date().toISOString(), results }), 'utf8');
  if (OUT) fs.writeFileSync(OUT, JSON.stringify({ appDir: APP_DIR, measuredAt: new Date().toISOString(), states: results.length, notEntered, analysis: an, compare: cmp }, null, 1) + '\n', 'utf8');
  if (notEntered.length) console.log('  ⚠ 진입 실패 ' + notEntered.length + '장(그 장의 요소는 못 봄): ' + notEntered.join(', '));
  report(an, cmp);
  process.exit(cmp.ok ? 0 : 1);
})();
