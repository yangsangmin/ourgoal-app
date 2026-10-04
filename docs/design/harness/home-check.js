'use strict';
/* 아워골 탭 화면 점검 하네스 (TASK-ES-342 · 노션 티켓 HOME-25 / GOALS-01 공용)
 * 로컬 정적 서버 + Chrome(puppeteer-core) + 게스트 프로필 시드 + Supabase 목(mock) — shots-lib.js 를 그대로 쓴다.
 * 원격 서버·실계정에 붙지 않는다(supabase.co 등 외부 호출은 shots-lib 가 204 로 막는다).
 *
 * 사용: node home-check.js <APP_DIR> <outDir> [tab] [--summary <file.json>]
 *   APP_DIR : 점검할 앱 폴더(워크트리 경로). 하드코딩하지 않는다.
 *   outDir  : PNG 와 전체 결과(home-check.json)를 쓰는 폴더. 저장소 밖(임시 폴더)을 권장.
 *   tab     : home(기본) | goals | calendar | records | comm | settings
 *   --summary : 저장소에 남길 작은 요약 JSON 경로(선택)
 *
 * 촬영: 테마 4종(index.html 의 data-theme 실제 값) × 뷰포트 2종(375×667, 375×812) × 상태
 *   상태는 탭마다 STATES 에 정의한다. home = base(기본) · sheet(홈 상세 바텀시트 열림) · focus(체크인 입력 포커스)
 *   다른 탭은 기본 상태(base)만 찍는다 — 상태를 늘릴 때는 STATES 에 항목을 더한다.
 *
 * 장마다 재는 것(MEASURE_FN):
 *   - 문서 스크롤 높이와 무스크롤 여부(+ 화면 안에서 따로 스크롤되는 영역)
 *   - 44px 미만 클릭 타겟 수(보이는 것만)와 목록
 *   - 콘솔 에러 수(그 상태에 들어서는 동안 새로 난 것)
 *   - 탭 화면 안에 있으나 display:none·visibility:hidden·opacity:0·크기 0·화면 밖으로 숨겨진 상호작용 요소 수와 id 목록
 *   - 'Lv.'·'EXP' 글자가 보이는지(렌더된 것 / 첫 화면 안에 보이는 것 따로)
 */
const http = require('http'), fs = require('fs'), path = require('path');
const puppeteer = require('C:/dev/command-center/node_modules/puppeteer-core');
const shots = require('./shots-lib.js');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const THEMES = ['focus-sanctuary', 'black', 'white', 'urban-city'];
const VIEWPORTS = [{ width: 375, height: 667 }, { width: 375, height: 812 }];
const TABS = ['home', 'goals', 'calendar', 'records', 'comm', 'settings'];

const argv = process.argv.slice(2);
const sumIdx = argv.indexOf('--summary');
const summaryFile = sumIdx >= 0 ? path.resolve(argv[sumIdx + 1]) : null;
const pos = argv.filter((a, i) => a !== '--summary' && (sumIdx < 0 || i !== sumIdx + 1));
if (pos.length < 2) {
  console.error('사용: node home-check.js <APP_DIR> <outDir> [tab] [--summary <file.json>]');
  process.exit(2);
}
const APP_DIR = path.resolve(pos[0]);
const outDir = path.resolve(pos[1]);
const TAB = pos[2] || 'home';
if (!TABS.includes(TAB)) { console.error('알 수 없는 탭: ' + TAB + ' (가능: ' + TABS.join(', ') + ')'); process.exit(2); }
if (!fs.existsSync(path.join(APP_DIR, 'index.html'))) { console.error('APP_DIR 에 index.html 이 없습니다: ' + APP_DIR); process.exit(2); }
fs.mkdirSync(outDir, { recursive: true });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/* 상태 정의: enter(page) 는 진짜 마우스 입력으로 그 상태에 들어가고, 들어갔는지를 측정해 돌려준다.
 * extraScope 는 탭 화면 밖(body 직속 등)에 붙는 요소 중 이 상태에서 같이 재야 하는 것. */
const STATES = {
  home: [
    { key: 'base', enter: async () => ({ entered: true }) },
    {
      key: 'sheet', extraScope: ['#homeDetailSheet'],
      enter: async (page) => {
        const sel = '#homeCompassQuest';
        if (!(await page.$(sel))) return { entered: false, note: sel + ' 없음' };
        const hit = await page.evaluate((sel) => {
          const b = document.querySelector(sel); b.scrollIntoView({ block: 'nearest' });
          const r = b.getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + r.height / 2;
          const top = document.elementFromPoint(x, y);
          return { covered: !!top && !b.contains(top), by: top ? (top.id ? '#' + top.id : top.tagName.toLowerCase() + '.' + String(top.className).split(' ')[0]) : null, y: Math.round(y) };
        }, sel);
        let retry = null;
        if (hit.covered) {
          // 첫 화면에서 가려져 있으면(가린 요소를 기록) 버튼을 화면 가운데로 스크롤해 한 번 더 시도한다
          retry = await page.evaluate((sel) => {
            const b = document.querySelector(sel); b.scrollIntoView({ block: 'center' });
            const r = b.getBoundingClientRect(); const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
            return { covered: !!top && !b.contains(top), scrollY: Math.round(scrollY) };
          }, sel);
          await sleep(300);
        }
        await page.click(sel);
        await sleep(700);
        const coverNote = hit.covered
          ? '첫 화면 누름 지점(y=' + hit.y + ')이 ' + hit.by + ' 에 가려짐 → 가운데로 스크롤(scrollY=' + retry.scrollY + ') 후 ' + (retry.covered ? '여전히 가려진 채' : '가림 없이') + ' 누름'
          : '누름 지점 y=' + hit.y + ' 가림 없음';
        return page.evaluate(() => {
          const s = document.getElementById('homeDetailSheet');
          const open = !!s && s.classList.contains('open') && s.getAttribute('aria-hidden') === 'false';
          return open;
        }).then((open) => ({ entered: open, note: 'opener=#homeCompassQuest · ' + coverNote }));
      },
      leave: async (page) => {
        if (await page.$('#homeDetailClose')) { await page.click('#homeDetailClose').catch(() => {}); await sleep(600); }
      }
    },
    {
      key: 'focus',
      enter: async (page) => {
        const sel = '#captureInput';
        if (!(await page.$(sel))) return { entered: false, note: sel + ' 없음' };
        await page.click(sel);
        await sleep(500);
        return page.evaluate(() => ({ entered: document.activeElement && document.activeElement.id === 'captureInput', note: '헤드리스 크롬은 가상 키보드를 띄우지 않는다 — 키보드에 가려지는지는 이 장으로 판단 불가' }));
      }
    }
  ]
};
const statesFor = (tab) => STATES[tab] || [{ key: 'base', enter: async () => ({ entered: true }) }];

const MEASURE_FN = (tab, extraScope) => {
  const IA = 'button, a[href], [role="button"], [role="tab"], [role="switch"], input:not([type=hidden]), select, textarea, summary, [onclick], [tabindex]:not([tabindex="-1"]), .navbtn';
  const vw = innerWidth, vh = innerHeight;
  const screen = document.getElementById('screen-' + tab);
  const label = (el) => el.id ? '#' + el.id : el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
  const hideReason = (el) => {
    for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
      const cs = getComputedStyle(e);
      const via = e === el ? '' : ' (조상 ' + label(e) + ')';
      if (e.hidden) return 'hidden 속성' + via;
      if (cs.display === 'none') return 'display:none' + via;
      if (cs.visibility === 'hidden' || cs.visibility === 'collapse') return 'visibility:' + cs.visibility + via;
      if (parseFloat(cs.opacity) === 0) return 'opacity:0' + via;
      if (e.tagName === 'DETAILS' && !e.open && e !== el && !(el.tagName === 'SUMMARY' && el.parentElement === e)) return '접힌 details' + via;
    }
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return '크기 0';
    const sx = scrollX, sy = scrollY;
    if (r.right + sx <= 0 || r.bottom + sy <= 0 || r.left + sx >= Math.max(vw, document.documentElement.scrollWidth)) return '화면 밖 좌표';
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
  if (screen) for (const el of [screen, ...screen.querySelectorAll('*')]) {
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
      if (!p || p.closest('script,style,template,noscript')) continue;
      const inTab = (screen && screen.contains(p)) || extraScope.some(s => { const x = document.querySelector(s); return x && x.contains(p); });
      if (!inTab) continue;
      const rendered = !hideReason(p);
      const r = p.getBoundingClientRect();
      out.push({ sel: label(p), text: n.textContent.trim().slice(0, 40), rendered, inFirstView: rendered && r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw });
    }
    return out;
  };
  const lv = textHits(/Lv\./), exp = textHits(/EXP/);
  // 문서를 길게 만드는 요소: 탭 화면 안에서 아래 끝이 가장 낮은 보이는 요소 3개(문서 좌표)
  const lowest = screen ? [...screen.querySelectorAll('*')].filter(e => !hideReason(e))
    .map(e => ({ sel: label(e), bottom: Math.round(e.getBoundingClientRect().bottom + scrollY) }))
    .sort((a, b) => b.bottom - a.bottom).filter((x, i, a) => a.findIndex(y => y.sel === x.sel) === i).slice(0, 3) : [];
  return {
    theme: document.documentElement.getAttribute('data-theme'),
    activeTab: (document.querySelector('.screen.active') || {}).id || null,
    viewport: { w: vw, h: vh },
    docScrollHeight: se.scrollHeight,
    noScroll: se.scrollHeight <= vh,
    innerScrollers: scrollers,
    lowestInTab: lowest,
    bodyPaddingBottom: getComputedStyle(document.body).paddingBottom,
    screenPaddingBottom: screen ? getComputedStyle(screen).paddingBottom : null,
    targets: shown.length,
    smallTargets: smallList.length,
    smallTargetList: smallList,
    hiddenInteractive: hidden.length,
    hiddenInteractiveIds: hidden.filter(h => h.id).map(h => h.id),
    hiddenInteractiveDetail: hidden,
    lvVisible: lv.some(h => h.rendered), lvInFirstView: lv.some(h => h.inFirstView),
    expVisible: exp.some(h => h.rendered), expInFirstView: exp.some(h => h.inFirstView),
    lvExpHits: [...lv, ...exp]
  };
};

function startServer(port) {
  const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.webp': 'image/webp' };
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/') p = '/index.html';
    if (p.startsWith('/api/')) { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end('{"ok":true}'); }
    const f = path.join(APP_DIR, p);
    if (!f.startsWith(APP_DIR) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise(r => server.listen(port, () => r(server)));
}

async function runCombo(browser, base, theme, vp) {
  const page = await shots.newPage(browser, true, theme);
  await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
  page.on('pageerror', (e) => errors.push('PAGEERROR ' + String(e).slice(0, 200)));
  await page.goto(base + '/', { waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(1500);
  // 첫 진입 때 떠 있는 모달은 기록한 뒤 닫는다(shots.js 와 같은 처리). 무엇이 떠 있었는지 남겨 둔다.
  const bootModal = await page.evaluate(() => {
    const o = document.getElementById('modalOverlay');
    if (!o || !o.classList.contains('active')) return null;
    const t = (o.querySelector('h1,h2,h3,.modal-title') || o).textContent.trim().slice(0, 60);
    o.classList.remove('active');
    return t;
  });
  // 진입 인사 팝업(#avatarGreetingModal, 일정 시간 뒤 자동으로 닫힘)이 떠 있으면 기록하고 닫기 버튼을 실제로 눌러 닫는다
  const greet = await page.evaluate(() => {
    const g = document.getElementById('avatarGreetingModal');
    if (!g || getComputedStyle(g).display === 'none') return null;
    return (document.getElementById('avatarGreetMessageText') || g).textContent.trim().slice(0, 60);
  });
  if (greet !== null) {
    await page.click('#btnAvatarGreetClose').catch(() => {});
    await sleep(800);
  }
  const bootOverlays = [bootModal && ('#modalOverlay: ' + bootModal), greet !== null && ('#avatarGreetingModal: ' + greet)].filter(Boolean);
  if (TAB !== 'home') {
    await page.click('.navbtn[data-tab="' + TAB + '"]').catch(() => {});
    await sleep(900);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(200);
  const results = [];
  for (const st of statesFor(TAB)) {
    const errBefore = errors.length;
    let entry;
    try { entry = await st.enter(page); } catch (e) { entry = { entered: false, note: 'enter 실패: ' + String(e).slice(0, 120) }; }
    const m = await page.evaluate(MEASURE_FN, TAB, st.extraScope || []);
    const name = [TAB, theme, vp.width + 'x' + vp.height, st.key].join('-');
    await page.screenshot({ path: path.join(outDir, name + '.png'), fullPage: false });
    const newErrors = errors.slice(errBefore);
    results.push({ name, tab: TAB, themeRequested: theme, viewportRequested: vp, state: st.key, entered: entry.entered, enterNote: entry.note || null, bootOverlays, ...m, consoleErrors: newErrors.length, consoleErrorSamples: newErrors.slice(0, 5) });
    console.log(name, '| 상태진입', entry.entered, '| 문서높이', m.docScrollHeight, '/', m.viewport.h, m.noScroll ? '무스크롤' : '스크롤', '| 44px미만', m.smallTargets, '| 콘솔에러', newErrors.length, '| 숨김상호작용', m.hiddenInteractive, '| Lv', m.lvVisible, 'EXP', m.expVisible);
    if (st.leave) await st.leave(page);
    await page.evaluate(() => window.scrollTo(0, 0));
  }
  await page.close();
  return results;
}

async function main() {
  const port = 4700 + Math.floor(Math.random() * 300);
  const server = await startServer(port);
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-gpu', '--lang=ko-KR', '--font-render-hinting=none'] });
  const base = 'http://localhost:' + port;
  const shotsOut = [];
  try {
    for (const theme of THEMES) for (const vp of VIEWPORTS) shotsOut.push(...await runCombo(browser, base, theme, vp));
  } finally {
    await browser.close(); server.close();
  }
  const full = { tool: 'docs/design/harness/home-check.js', appDir: APP_DIR, tab: TAB, measuredAt: new Date().toISOString(), env: 'local static server + headless Chrome + guest seed + Supabase mock (no remote, no real account)', shots: shotsOut };
  fs.writeFileSync(path.join(outDir, TAB + '-check.json'), JSON.stringify(full, null, 2), 'utf8');
  if (summaryFile) {
    const slim = { ...full, appDir: path.basename(APP_DIR), shots: shotsOut.map(s => ({
      name: s.name, state: s.state, entered: s.entered, theme: s.theme, viewport: s.viewport, bootOverlays: s.bootOverlays, enterNote: s.enterNote,
      docScrollHeight: s.docScrollHeight, noScroll: s.noScroll, innerScrollers: s.innerScrollers.map(x => x.sel + ' ' + x.scrollHeight + '/' + x.clientHeight),
      lowestInTab: s.lowestInTab.map(x => x.sel + ' @' + x.bottom), bodyPaddingBottom: s.bodyPaddingBottom, screenPaddingBottom: s.screenPaddingBottom,
      smallTargets: s.smallTargets, smallTargetList: s.smallTargetList.map(x => x.sel + ' ' + x.w + 'x' + x.h),
      consoleErrors: s.consoleErrors, consoleErrorSamples: s.consoleErrorSamples.slice(0, 2),
      hiddenInteractive: s.hiddenInteractive, hiddenInteractiveIds: s.hiddenInteractiveIds,
      lvVisible: s.lvVisible, lvInFirstView: s.lvInFirstView, expVisible: s.expVisible, expInFirstView: s.expInFirstView
    })) };
    fs.mkdirSync(path.dirname(summaryFile), { recursive: true });
    // 같은 숨김 id 목록은 한 번만 적고 장에서는 이름(H1, H2 …)으로 가리킨다
    slim.hiddenIdSets = {};
    const setKey = new Map();
    for (const s of slim.shots) {
      const k = JSON.stringify(s.hiddenInteractiveIds);
      if (!setKey.has(k)) { const name = 'H' + (setKey.size + 1); setKey.set(k, name); slim.hiddenIdSets[name] = s.hiddenInteractiveIds; }
      s.hiddenInteractiveIds = setKey.get(k);
    }
    // 장 하나를 한 줄로 써서 용량을 줄인다
    const head = JSON.stringify({ ...slim, shots: '__SHOTS__' }, null, 1);
    const body = '[\n' + slim.shots.map(x => '  ' + JSON.stringify(x)).join(',\n') + '\n ]';
    fs.writeFileSync(summaryFile, head.replace('"__SHOTS__"', () => body) + '\n', 'utf8');
  }
  console.log('장 수:', shotsOut.length, '| 결과:', path.join(outDir, TAB + '-check.json'), summaryFile ? '| 요약: ' + summaryFile : '');
}
main().catch(e => { console.error(e); process.exit(1); });
