'use strict';
/* 아워골 6개 탭 공통 실측 도구 (TASK-ES-349 · 노션 CORE-01). home-check.js(TASK-ES-342)를 탭 인자형으로 넓혔다.
 * 로컬 정적 서버 + Chrome(puppeteer-core) + shots-lib.js newPage(게스트 프로필 시드·Supabase 목·외부 호출 차단).
 * 원격 서버·실계정에 붙지 않는다. 장(촬영 1회)마다 새 브라우저 컨텍스트를 써서 앞 장의 상태가 섞이지 않게 한다.
 *
 * 사용: node tab-check.js <APP_DIR> <outDir> [tabs] [--summary <file.json>] [--deadclick rep|all|off]
 *   APP_DIR : 점검할 앱 폴더(워크트리 경로)
 *   outDir  : PNG 와 탭별 전체 결과(<tab>-check.json)를 쓰는 폴더. 저장소 밖(임시 폴더)을 권장
 *   tabs    : home | goals | records | calendar | comm | settings | all | 쉼표 목록 (기본 home)
 *   --summary  : 저장소에 남길 작은 요약 JSON(선택)
 *   --deadclick: rep(기본) = 탭×상태마다 대표 장(첫 테마, 375×667)에서 한 번 / all = 모든 장 / off = 끄기
 *
 * 장마다 재는 것(MEASURE_FN): 문서 높이/화면 높이·무스크롤 여부, 44px 미만 조작 요소 목록, 콘솔 오류,
 *   숨은 조작 요소 목록과 숨긴 이유, !important 로 강제된 display:none 요소 수(탭 영역 / 문서 전체), Lv·EXP 노출(홈 지표).
 * Dead-Click 탐지는 tab-deadclick.js, 탭별 상태 정의는 tab-states.js.
 */
const http = require('http'), fs = require('fs'), path = require('path'), cp = require('child_process');
const puppeteer = require('C:/dev/command-center/node_modules/puppeteer-core');
const shots = require('./shots-lib.js');
const { STATES, TAB_NOTES, boot, goTab, sleep } = require('./tab-states.js');
const { probeState } = require('./tab-deadclick.js');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const THEMES = ['focus-sanctuary', 'black', 'white', 'urban-city'];
const VIEWPORTS = [{ width: 375, height: 667 }, { width: 375, height: 812 }];
const TABS = ['home', 'goals', 'records', 'calendar', 'comm', 'settings'];
const ENV = 'local static server + headless Chrome + guest seed + Supabase mock (no remote, no real account)';

const MEASURE_FN = (tab, extraScope) => {
  const IA = 'button, a[href], [role="button"], [role="tab"], [role="switch"], input:not([type=hidden]), select, textarea, summary, [onclick], [tabindex]:not([tabindex="-1"]), .navbtn';
  const vw = innerWidth, vh = innerHeight;
  const screen = document.getElementById('screen-' + tab);
  const label = (el) => el.id ? '#' + el.id : el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
  // !important 로 강제된 display:none 요소: 인라인 style 의 important + 같은 출처 스타일시트 규칙(현재 맞는 @media 포함)
  const importantNone = new Map();
  const walkRules = (rules) => {
    for (const r of rules) {
      if (r.cssRules && (r.media ? matchMedia(r.media.mediaText).matches : true) && !r.selectorText) { try { walkRules(r.cssRules); } catch (e) {} continue; }
      if (!r.style || !r.selectorText) continue;
      if (r.style.getPropertyValue('display').trim() !== 'none' || r.style.getPropertyPriority('display') !== 'important') continue;
      let els = [];
      try { els = document.querySelectorAll(r.selectorText); } catch (e) { continue; }
      for (const el of els) if (getComputedStyle(el).display === 'none' && !importantNone.has(el)) importantNone.set(el, r.selectorText.slice(0, 80));
    }
  };
  for (const sh of document.styleSheets) { let rules = null; try { rules = sh.cssRules; } catch (e) { rules = null; } if (rules) walkRules(rules); }
  for (const el of document.querySelectorAll('[style]')) {
    if (el.style.getPropertyValue('display').trim() === 'none' && el.style.getPropertyPriority('display') === 'important' && !importantNone.has(el)) importantNone.set(el, 'style 속성');
  }
  const hideReason = (el) => {
    for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
      const cs = getComputedStyle(e);
      const via = e === el ? '' : ' (조상 ' + label(e) + ')';
      if (e.hidden) return 'hidden 속성' + via;
      if (cs.display === 'none') return 'display:none' + (importantNone.has(e) ? ' !important' : '') + via;
      if (cs.visibility === 'hidden' || cs.visibility === 'collapse') return 'visibility:' + cs.visibility + via;
      if (parseFloat(cs.opacity) === 0) return 'opacity:0' + via;
      if (e.tagName === 'DETAILS' && !e.open && e !== el && !(el.tagName === 'SUMMARY' && el.parentElement === e)) return '접힌 details' + via;
    }
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return '크기 0';
    if (r.right + scrollX <= 0 || r.bottom + scrollY <= 0 || r.left + scrollX >= Math.max(vw, document.documentElement.scrollWidth)) return '화면 밖 좌표';
    return null;
  };
  const scopes = [screen, ...extraScope.map(s => document.querySelector(s))].filter(Boolean);
  const inScope = [...new Set(scopes.flatMap(s => [s, ...s.querySelectorAll(IA)].filter(e => e.matches(IA))))];
  const chrome = [...document.querySelectorAll('.navbtn')];
  const shown = [], hidden = [];
  for (const el of inScope) { const why = hideReason(el); if (why) hidden.push({ id: el.id || null, sel: label(el), why }); else shown.push(el); }
  const smallList = [];
  for (const el of [...shown, ...chrome.filter(c => !hideReason(c) && !shown.includes(c))]) {
    const r = el.getBoundingClientRect();
    if (r.width < 44 || r.height < 44) smallList.push({ sel: label(el), w: Math.round(r.width), h: Math.round(r.height), inView: r.bottom > 0 && r.top < vh });
  }
  const se = document.scrollingElement || document.documentElement;
  const scrollers = [];
  for (const sc of scopes) for (const el of [sc, ...sc.querySelectorAll('*')]) {
    const cs = getComputedStyle(el);
    if (/(auto|scroll)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 1 && !hideReason(el)) scrollers.push({ sel: label(el), scrollHeight: el.scrollHeight, clientHeight: el.clientHeight });
  }
  const textHits = (re) => {
    const out = [];
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = w.nextNode())) {
      if (!re.test(n.textContent)) continue;
      const p = n.parentElement;
      if (!p || p.closest('script,style,template,noscript') || !scopes.some(s => s.contains(p))) continue;
      const rendered = !hideReason(p);
      const r = p.getBoundingClientRect();
      out.push({ rendered, inFirstView: rendered && r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw });
    }
    return out;
  };
  const lv = textHits(/Lv\./), exp = textHits(/EXP/);
  const inScopeImportant = [...importantNone.keys()].filter(el => scopes.some(s => s.contains(el)));
  return {
    theme: document.documentElement.getAttribute('data-theme'),
    activeTab: (document.querySelector('.screen.active') || {}).id || null,
    viewport: { w: vw, h: vh },
    docScrollHeight: se.scrollHeight,
    heightRatio: Math.round(se.scrollHeight / vh * 100) / 100,
    noScroll: se.scrollHeight <= vh,
    innerScrollers: scrollers,
    targets: shown.length,
    smallTargets: smallList.length,
    smallTargetList: smallList,
    hiddenInteractive: hidden.length,
    hiddenInteractiveDetail: hidden,
    importantNoneInScope: inScopeImportant.length,
    importantNoneInDoc: importantNone.size,
    importantNoneRules: [...new Set(inScopeImportant.map(el => importantNone.get(el)))].slice(0, 20),
    lvVisible: lv.some(h => h.rendered), lvInFirstView: lv.some(h => h.inFirstView),
    expVisible: exp.some(h => h.rendered), expInFirstView: exp.some(h => h.inFirstView)
  };
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

/* 새 컨텍스트 → 게스트 시드 페이지 → 진입 팝업 닫기 → 탭 버튼 → 상태 진입. 오류 수집기를 붙여 돌려준다. */
async function openState(browser, base, tab, theme, vp, st) {
  const ctx = await browser.createBrowserContext();
  const page = await shots.newPage(ctx, true, theme);
  await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errors = [], httpErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
  page.on('pageerror', (e) => errors.push('PAGEERROR ' + String(e).slice(0, 200)));
  page.on('response', (r) => { if (r.status() >= 400 && r.url().startsWith(base)) httpErrors.push(r.status() + ' ' + r.url().slice(base.length)); });
  const close = () => ctx.close().catch(() => {});
  try {
    await page.goto(base + '/', { waitUntil: 'networkidle2', timeout: 60000 });
    await sleep(1500);
    const bootOverlays = await boot(page);
    const nav = await goTab(page, tab);
    if (!nav.ok) return { ok: false, page, close, errors, httpErrors, bootOverlays, note: '탭 진입 실패: ' + nav.note, errBefore: errors.length };
    const errBefore = errors.length;
    let entry;
    try { entry = await st.enter(page); } catch (e) { entry = { entered: false, note: 'enter 실패: ' + String(e).slice(0, 120) }; }
    return { ok: !!entry.entered, page, close, errors, httpErrors, bootOverlays, note: entry.note, errBefore };
  } catch (e) {
    return { ok: false, page, close, errors, httpErrors, bootOverlays: [], note: '열기 실패: ' + String(e).slice(0, 120), errBefore: errors.length };
  }
}

async function runTab(browser, base, tab, outDir, deadMode) {
  const shotsOut = [], dead = {};
  const states = STATES[tab];
  for (const theme of THEMES) for (const vp of VIEWPORTS) for (const st of states) {
    const o = await openState(browser, base, tab, theme, vp, st);
    const name = [tab, theme, vp.width + 'x' + vp.height, st.key].join('-');
    const m = await o.page.evaluate(MEASURE_FN, tab, st.extraScope || []).catch((e) => ({ measureError: String(e).slice(0, 160) }));
    await o.page.screenshot({ path: path.join(outDir, name + '.png'), fullPage: false }).catch(() => {});
    const newErrors = o.errors.slice(o.errBefore);
    await o.close();
    shotsOut.push({ name, tab, themeRequested: theme, viewportRequested: vp, state: st.key, opener: st.opener, entered: o.ok, enterNote: o.note || null, bootOverlays: o.bootOverlays, ...m,
      consoleErrors: newErrors.length, consoleErrorSamples: newErrors.slice(0, 5), consoleErrorsFromLoad: o.errBefore, httpErrors: [...new Set(o.httpErrors)] });
    console.log(name, '| 진입', o.ok, '| 높이', m.docScrollHeight, '/', vp.height, m.noScroll ? '무스크롤' : '스크롤', '| 44px미만', m.smallTargets, '| 숨김', m.hiddenInteractive, '| !important', m.importantNoneInScope, '| 콘솔오류', newErrors.length);
    const rep = theme === THEMES[0] && vp === VIEWPORTS[0];
    if (deadMode !== 'off' && st.deadScope !== false && (deadMode === 'all' || rep)) {
      const scope = st.deadScope || ['#screen-' + tab];
      const skipKinds = st.key !== 'base' && dead[tab + '|base|' + name.split('-').slice(1, -1).join('-')] ? new Set(dead[tab + '|base|' + name.split('-').slice(1, -1).join('-')].probedKeys) : null;
      const r = await probeState({ tab, state: st.key, scope, skipKinds, open: () => openState(browser, base, tab, theme, vp, st) });
      r.combo = theme + ' ' + vp.width + 'x' + vp.height;
      dead[tab + '|' + st.key + '|' + name.split('-').slice(1, -1).join('-')] = r;
      shotsOut[shotsOut.length - 1].deadClick = tab + '|' + st.key + '|' + name.split('-').slice(1, -1).join('-');
      console.log('  Dead-Click', st.key, '| 후보', r.candidates, '| 누름', r.clicked, '| 반응', r.reacted, '| Dead', r.deadCount, '| 가려짐', r.covered.length, '| 안누름', r.notClicked.length, '|', r.durationSec + 's', r.error || '');
    }
  }
  return { shots: shotsOut, deadClick: dead };
}

function slimShot(s) {
  return {
    name: s.name, state: s.state, entered: s.entered, enterNote: s.enterNote, theme: s.theme, viewport: s.viewport, bootOverlays: s.bootOverlays,
    docScrollHeight: s.docScrollHeight, heightRatio: s.heightRatio, noScroll: s.noScroll, innerScrollers: (s.innerScrollers || []).map(x => x.sel + ' ' + x.scrollHeight + '/' + x.clientHeight),
    smallTargets: s.smallTargets, smallTargetList: (s.smallTargetList || []).map(x => x.sel + ' ' + x.w + 'x' + x.h),
    hiddenInteractive: s.hiddenInteractive, hiddenInteractiveDetail: (s.hiddenInteractiveDetail || []).map(h => h.sel + ' ← ' + h.why),
    importantNoneInScope: s.importantNoneInScope, importantNoneInDoc: s.importantNoneInDoc, importantNoneRules: s.importantNoneRules,
    consoleErrors: s.consoleErrors, consoleErrorSamples: (s.consoleErrorSamples || []).slice(0, 2), consoleErrorsFromLoad: s.consoleErrorsFromLoad, httpErrors: s.httpErrors,
    lvVisible: s.lvVisible, expVisible: s.expVisible, deadClick: s.deadClick || null, measureError: s.measureError
  };
}

/* 긴 목록은 한 번만 적고 장에서는 이름(S1, H1, R1 …)으로 가리킨다 */
function writeSummary(file, meta, perTab) {
  const sets = { smallTargetList: {}, hiddenInteractiveDetail: {}, importantNoneRules: {} };
  const keyOf = { smallTargetList: 'S', hiddenInteractiveDetail: 'H', importantNoneRules: 'R' };
  const idx = { smallTargetList: new Map(), hiddenInteractiveDetail: new Map(), importantNoneRules: new Map() };
  const tabs = {};
  for (const [tab, r] of Object.entries(perTab)) {
    const shotsSlim = r.shots.map(slimShot);
    for (const s of shotsSlim) for (const f of Object.keys(sets)) {
      const k = JSON.stringify(s[f] || []);
      if (!idx[f].has(k)) { const n = keyOf[f] + (idx[f].size + 1); idx[f].set(k, n); sets[f][n] = s[f] || []; }
      s[f] = idx[f].get(k);
    }
    const dc = {};
    for (const [k, d] of Object.entries(r.deadClick)) {
      dc[k] = { combo: d.combo, scope: d.scope, candidates: d.candidates, clicked: d.clicked, reacted: d.reacted, deadCount: d.deadCount, dead: d.dead, covered: d.covered, notClicked: d.notClicked,
        sampledOut: d.sampledOut, alreadyInBase: d.alreadyInBase, cappedOut: d.cappedOut, mismatch: d.mismatch, reactions: d.reactions, error: d.error || null, durationSec: d.durationSec };
    }
    tabs[tab] = { note: TAB_NOTES[tab] || null, states: STATES[tab].map(s => ({ key: s.key, opener: s.opener, deadClick: s.deadScope !== false })), shots: shotsSlim, deadClick: dc };
  }
  const out = { ...meta, sets, tabs };
  // 장 하나를 한 줄로 써서 용량을 줄인다
  const lines = [];
  lines.push('{');
  for (const [k, v] of Object.entries(out)) {
    if (k !== 'tabs' && k !== 'sets') lines.push(' ' + JSON.stringify(k) + ': ' + JSON.stringify(v) + ',');
  }
  lines.push(' "sets": ' + JSON.stringify(out.sets, null, 1).replace(/\n/g, '\n ') + ',');
  lines.push(' "tabs": {');
  const tabNames = Object.keys(tabs);
  tabNames.forEach((t, ti) => {
    const T = tabs[t];
    lines.push('  ' + JSON.stringify(t) + ': {');
    lines.push('   "note": ' + JSON.stringify(T.note) + ',');
    lines.push('   "states": ' + JSON.stringify(T.states) + ',');
    lines.push('   "shots": [');
    lines.push(T.shots.map(x => '    ' + JSON.stringify(x)).join(',\n'));
    lines.push('   ],');
    lines.push('   "deadClick": {');
    lines.push(Object.entries(T.deadClick).map(([k, v]) => '    ' + JSON.stringify(k) + ': ' + JSON.stringify(v)).join(',\n'));
    lines.push('   }');
    lines.push('  }' + (ti < tabNames.length - 1 ? ',' : ''));
  });
  lines.push(' }');
  lines.push('}');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, lines.join('\n') + '\n', 'utf8');
  JSON.parse(fs.readFileSync(file, 'utf8')); // 쓴 결과가 올바른 JSON 인지 바로 확인
}

function parseArgs(argv) {
  const opt = { summary: null, deadclick: 'rep' };
  const pos = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--summary') opt.summary = path.resolve(argv[++i]);
    else if (argv[i] === '--deadclick') opt.deadclick = argv[++i];
    else pos.push(argv[i]);
  }
  return { pos, opt };
}

async function main(argv, toolName) {
  const { pos, opt } = parseArgs(argv);
  if (pos.length < 2) {
    console.error('사용: node ' + (toolName || 'tab-check.js') + ' <APP_DIR> <outDir> [home|goals|records|calendar|comm|settings|all|쉼표목록] [--summary <file.json>] [--deadclick rep|all|off]');
    process.exit(2);
  }
  const APP_DIR = path.resolve(pos[0]);
  const outDir = path.resolve(pos[1]);
  const tabs = (!pos[2] ? ['home'] : pos[2] === 'all' ? TABS : pos[2].split(','));
  for (const t of tabs) if (!TABS.includes(t)) { console.error('알 수 없는 탭: ' + t + ' (가능: ' + TABS.join(', ') + ')'); process.exit(2); }
  if (!['rep', 'all', 'off'].includes(opt.deadclick)) { console.error('--deadclick 은 rep|all|off'); process.exit(2); }
  if (!fs.existsSync(path.join(APP_DIR, 'index.html'))) { console.error('APP_DIR 에 index.html 이 없습니다: ' + APP_DIR); process.exit(2); }
  fs.mkdirSync(outDir, { recursive: true });
  let commit = null;
  try { commit = cp.execSync('git rev-parse HEAD', { cwd: APP_DIR, encoding: 'utf8' }).trim(); } catch (e) { commit = null; }
  const port = 4700 + Math.floor(Math.random() * 300);
  const server = await startServer(APP_DIR, port);
  // 허용 목록 밖 호스트는 이름 풀이를 막는다(외부로 실제로 나가지 않게). 요청 시도 자체는 도구가 센다.
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-gpu', '--lang=ko-KR', '--font-render-hinting=none',
    '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost, EXCLUDE fonts.googleapis.com, EXCLUDE fonts.gstatic.com, EXCLUDE cdn.jsdelivr.net'] });
  const base = 'http://localhost:' + port;
  const perTab = {};
  const t0 = Date.now();
  try {
    for (const tab of tabs) {
      perTab[tab] = await runTab(browser, base, tab, outDir, opt.deadclick);
      const full = { tool: 'docs/design/harness/tab-check.js', appDir: APP_DIR, commit, tab, measuredAt: new Date().toISOString(), env: ENV, ...perTab[tab] };
      fs.writeFileSync(path.join(outDir, tab + '-check.json'), JSON.stringify(full, null, 2), 'utf8');
    }
  } finally {
    await browser.close(); server.close();
  }
  if (opt.summary) {
    writeSummary(opt.summary, { tool: 'docs/design/harness/tab-check.js', task: 'TASK-ES-349', appDir: path.basename(APP_DIR), commit, measuredAt: new Date().toISOString(), env: ENV,
      matrix: { themes: THEMES, viewports: VIEWPORTS.map(v => v.width + 'x' + v.height) }, deadClickMode: opt.deadclick, runSeconds: Math.round((Date.now() - t0) / 1000) }, perTab);
  }
  console.log('탭:', tabs.join(','), '| 장 수:', Object.values(perTab).reduce((a, r) => a + r.shots.length, 0), '| 결과 폴더:', outDir, opt.summary ? '| 요약: ' + opt.summary : '');
}

module.exports = { main, MEASURE_FN, TABS, THEMES, VIEWPORTS };
if (require.main === module) main(process.argv.slice(2)).catch(e => { console.error(e); process.exit(1); });
