// 묶음 ①(공용 값 28개)의 예상 변화 목록을 만든다. 읽기만 한다 — 아워골 저장소는 git show 로 꺼내 읽고, 쓰는 곳은 이 폴더뿐이다.
// 여섯 구획 × 네 테마를 실제 뼈대·실제 꾸밈으로 그려 "앞"을 찍고, 새 값 28개를 맨 끝에 덮어쓴 뒤 "뒤"를 찍어 요소마다 견준다.
const fs = require('fs'), path = require('path'), cp = require('child_process');
const puppeteer = require('C:/dev/command-center/node_modules/puppeteer-core');
const D = __dirname, PAGES = path.join(D, 'pages'), SHOTS = path.join(D, 'shots');
for (const d of [PAGES, SHOTS]) fs.mkdirSync(d, { recursive: true });
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p => fs.existsSync(p));
const git = args => cp.execFileSync('git', ['-C', 'C:/dev/ourgoal-app', ...args], { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024 });
const REF = process.argv[2] || 'origin/main';
const commit = git(['rev-parse', '--short', REF]).trim(), commitAt = git(['log', '-1', '--format=%ci', REF]).trim();
const index = git(['show', REF + ':index.html']), css = git(['show', REF + ':ui.css']);
fs.writeFileSync(path.join(D, 'ui.css'), css, { encoding: 'utf8' });
const GENES = JSON.parse(fs.readFileSync(path.join(D, '..', 'handoff', '02-유전자-값.json'), 'utf8')).값.filter(g => g.changed);
const VARS = [...new Set(GENES.map(g => g.name))], FIVE = ['--primary', '--primary-hover', '--border-subtle', '--surface-1', '--card-bg'];
const THEMES = ['focus-sanctuary', 'white', 'black', 'urban-city'], TN = { 'focus-sanctuary': '성소', white: '화이트', black: '블랙', 'urban-city': '깔끔한 도심' };
const SCREENS = [['screen-home', '홈'], ['screen-goals', '목표'], ['screen-calendar', '일정'], ['screen-records', '기록'], ['screen-comm', '소통'], ['screen-settings', '설정']];

// ── 뼈대에서 구획을 떼어 낸다
const L = index.split(/\r?\n/);
const shellStart = L.findIndex(l => l.includes('<div id="appShell">')), mainLine = L.findIndex(l => l.includes('<main class="screens">'));
const mainEnd = L.findIndex((l, i) => i > mainLine && /<\/main>/.test(l));
const starts = []; L.forEach((l, i) => { if (i > mainLine && i < mainEnd && /<section class="screen/.test(l)) starts.push(i); });
const navStart = L.findIndex(l => l.includes('<div class="bottomnav">')); let navEnd = navStart; for (let i = navStart; i < L.length; i++) if (/<\/nav>/.test(L[i])) { navEnd = i + 1; break; }
const section = id => { const k = starts.findIndex(i => L[i].includes('id="' + id + '"')); if (k < 0) throw new Error('구획 없음 ' + id); const a = starts[k], b = k + 1 < starts.length ? starts[k + 1] : mainEnd;
  return { from: a + 1, to: b, html: L.slice(a, b).join('\n').replace(/<section class="screen(?: active)?"/, '<section class="screen active"') }; };
const override = theme => 'html[data-theme="' + theme + '"]{' + GENES.filter(g => g.theme === theme).map(g => g.name + ':' + g.new + ' !important').join(';') + '}';
const page = (sec, theme, after) => '<!doctype html><html lang="ko" data-theme="' + theme + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
  + '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"><link rel="stylesheet" href="../ui.css">'
  + '<style>#appShell{display:block!important}</style>' + (after ? '<style id="newvalues">' + override(theme) + '</style>' : '') + '</head><body>'
  + L.slice(shellStart, mainLine + 1).join('\n') + '\n' + sec.html + '\n</main>\n' + L.slice(navStart, navEnd + 1).join('\n') + '\n</div></body></html>';

// ── 화면 안에서 재는 것
const PROBE = (VARS, FIVE) => {
  const d = document.documentElement, cs = getComputedStyle(d), shell = document.getElementById('appShell');
  const parse = c => { const m = String(c).match(/rgba?\(([^)]+)\)/); if (!m) return [0, 0, 0, 0]; const p = m[1].split(',').map(parseFloat); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; };
  const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const bgOf = el => { const layers = []; for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c[3] > 0) { layers.push(c); if (c[3] >= 1) break; } }
    let base = [255, 255, 255, 1]; for (let i = layers.length - 1; i >= 0; i--) { const c = layers[i]; base = [c[0] * c[3] + base[0] * (1 - c[3]), c[1] * c[3] + base[1] * (1 - c[3]), c[2] * c[3] + base[2] * (1 - c[3]), 1]; } return base; };
  const ratio = el => { const bg = bgOf(el), f = parse(getComputedStyle(el).color); const fg = [f[0] * f[3] + bg[0] * (1 - f[3]), f[1] * f[3] + bg[1] * (1 - f[3]), f[2] * f[3] + bg[2] * (1 - f[3])]; const a = lum(fg), b = lum(bg); return Math.round((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) * 100) / 100; };
  const pathOf = el => { const p = []; for (let e = el; e && e !== shell; e = e.parentElement) p.unshift(Array.prototype.indexOf.call(e.parentElement.children, e)); return p.join('.'); };
  const rows = [];
  shell.querySelectorAll('*').forEach(el => {
    if (['SCRIPT', 'STYLE', 'PATH', 'CIRCLE', 'RECT', 'LINE', 'POLYLINE'].includes(el.tagName.toUpperCase())) return;
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
    const c = getComputedStyle(el), own = Array.prototype.some.call(el.childNodes, n => n.nodeType === 3 && n.textContent.trim());
    rows.push({ p: pathOf(el), k: el.tagName.toLowerCase() + (el.id ? '#' + el.id : el.classList.length ? '.' + Array.prototype.slice.call(el.classList, 0, 2).join('.') : ''),
      color: c.color, bg: c.backgroundColor, border: parseFloat(c.borderTopWidth) > 0 ? c.borderTopColor : '', text: own ? el.textContent.trim().slice(0, 18) : '', ratio: own ? ratio(el) : null, font: own ? parseFloat(c.fontSize) : null });
  });
  const vars = {}; VARS.concat(FIVE).forEach(n => { vars[n] = cs.getPropertyValue(n).trim(); });
  const nested = shell.querySelectorAll('.card .card').length;
  const slots = Array.prototype.filter.call(shell.querySelectorAll('[id]'), e => !e.children.length && !e.textContent.trim() && !['INPUT', 'TEXTAREA', 'SELECT', 'CANVAS', 'IMG'].includes(e.tagName)).map(e => e.id);
  const pill = document.querySelector('.rec-pill-btn.active');
  return { vars, rows, nested, slots, pill: pill ? { ratio: ratio(pill), color: getComputedStyle(pill).color, bg: getComputedStyle(pill).backgroundColor } : null,
    cap: document.getElementById('captureCardBox') ? { bg: getComputedStyle(document.getElementById('captureCardBox')).backgroundColor, border: getComputedStyle(document.getElementById('captureCardBox')).borderTopColor } : null,
    overflow: d.scrollWidth > d.clientWidth, height: d.scrollHeight };
};

// ── 꾸밈 파일에서 변수 정의를 전부 찾는다(줄 · 선택자 · 값)
const defs = {}; VARS.concat(FIVE).forEach(n => { defs[n] = []; });
{ const stack = []; let buf = '', line = 1, selStart = 1;
  // 주석을 같은 길이의 빈칸으로 바꿔(줄 번호는 그대로) 선택자에 주석이 섞이지 않게 한다
  const NL = String.fromCharCode(10);
  const bare = css.split('/*').map((part, i) => { if (i === 0) return part; const end = part.indexOf('*/'); if (end < 0) return part.split('').map(c => c === NL ? NL : ' ').join('') + '  ';
    return '  ' + part.slice(0, end).split('').map(c => c === NL ? NL : ' ').join('') + '  ' + part.slice(end + 2); }).join('');
  for (let i = 0; i < bare.length; i++) { const ch = bare[i];
    if (ch === '\n') line++;
    if (ch === '{') { stack.push({ sel: buf.trim().replace(/\s+/g, ' '), line: selStart }); buf = ''; selStart = line; }
    else if (ch === '}' || ch === ';') {
      const m = buf.match(/^\s*(--[\w-]+)\s*:\s*([\s\S]+?)\s*$/);
      if (m && defs[m[1]] && stack.length) defs[m[1]].push({ line, selector: stack[stack.length - 1].sel.slice(0, 160), media: stack.length > 1 ? stack[0].sel.slice(0, 60) : '', value: m[2].replace(/\s+/g, ' ') });
      buf = ''; if (ch === '}') stack.pop(); selStart = line;
    } else buf += ch;
  } }
const norm = x => String(x).toLowerCase().replace(/\s+/g, '').replace(/(^|[^0-9])0\./g, '$1.').replace(/!important/g, '');
const count = (text, name) => (text.match(new RegExp('var\\(\\s*' + name + '\\s*[,)]', 'g')) || []).length;
const jsCount = name => { try { return git(['grep', '-o', '-E', 'var\\(\\s*' + name + '\\s*[,)]', REF, '--', 'js']).split('\n').filter(Boolean).length; } catch (e) { return 0; } };

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--allow-file-access-from-files', '--hide-scrollbars'] });
  const tab = await browser.newPage(); await tab.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  const out = { commit, commitAt, ref: REF, madeAt: new Date().toISOString(), width: 390, screens: {} };
  for (const [id, name] of SCREENS) {
    const sec = section(id); out.screens[id] = { name, lines: sec.from + '~' + sec.to, themes: {} };
    for (const theme of THEMES) {
      const res = {};
      for (const when of ['before', 'after']) {
        const file = path.join(PAGES, id + '-' + theme + '-' + when + '.html');
        fs.writeFileSync(file, page(sec, theme, when === 'after'), { encoding: 'utf8' });
        await tab.goto('file:///' + file.replace(/\\/g, '/'), { waitUntil: 'load', timeout: 60000 });
        await new Promise(r => setTimeout(r, 500));
        res[when] = await tab.evaluate(PROBE, VARS, FIVE);
        await tab.screenshot({ path: path.join(SHOTS, id + '-' + theme + '-' + when + '.jpg'), type: 'jpeg', quality: 62, fullPage: true });
      }
      const b = new Map(res.before.rows.map(r => [r.p, r])), kinds = {}; let color = 0, bg = 0, border = 0, moved = 0;
      const worse = [], low = { before: 0, after: 0 }, vlow = { before: 0, after: 0 }; let texts = 0, fellBelow = 0, roseAbove = 0;
      for (const r of res.after.rows) {
        const o = b.get(r.p); if (!o) { moved++; continue; }
        const ch = [o.color !== r.color ? '글자색' : '', o.bg !== r.bg ? '바탕' : '', o.border !== r.border ? '테두리' : ''].filter(Boolean);
        if (o.color !== r.color) color++; if (o.bg !== r.bg) bg++; if (o.border !== r.border) border++;
        if (ch.length) { const key = r.k.replace(/#.*/, m => m); kinds[key] = kinds[key] || { n: 0, what: new Set() }; kinds[key].n++; ch.forEach(x => kinds[key].what.add(x)); }
        if (r.ratio != null && o.ratio != null) { texts++; if (o.ratio < 4.5) low.before++; if (r.ratio < 4.5) low.after++; if (o.ratio < 3) vlow.before++; if (r.ratio < 3) vlow.after++;
          if (o.ratio >= 4.5 && r.ratio < 4.5) fellBelow++; if (o.ratio < 4.5 && r.ratio >= 4.5) roseAbove++;
          if (r.ratio < o.ratio - 0.3) worse.push({ k: r.k, text: r.text, before: o.ratio, after: r.ratio }); }
      }
      const wrongVars = GENES.filter(g => g.theme === theme && norm(res.after.vars[g.name]) !== norm(g.new)).map(g => g.name + ' 기대 ' + g.new + ' 실제 ' + res.after.vars[g.name]);
      const fiveChanged = FIVE.filter(n => res.before.vars[n] !== res.after.vars[n]);
      out.screens[id].themes[theme] = { elements: res.after.rows.length, changed: { color, bg, border }, unmatched: moved + Math.abs(res.before.rows.length - res.after.rows.length), texts, low, vlow,
        worse: worse.sort((x, y) => x.after - y.after).slice(0, 12), worseCount: worse.length, worstAfter: worse.length ? worse[0].after : null, fellBelow, roseAbove, kinds: Object.entries(kinds).map(([k, v]) => ({ k, n: v.n, what: [...v.what].join('·') })).sort((x, y) => y.n - x.n).slice(0, 14),
        wrongVars, fiveChanged, fiveValues: Object.fromEntries(FIVE.map(n => [n, res.before.vars[n]])), nested: res.after.nested, slots: res.before.slots, pill: { before: res.before.pill, after: res.after.pill }, cap: { before: res.before.cap, after: res.after.cap },
        overflow: { before: res.before.overflow, after: res.after.overflow }, height: { before: res.before.height, after: res.after.height }, varsBefore: Object.fromEntries(VARS.map(n => [n, res.before.vars[n]])) };
      process.stdout.write(name + '/' + TN[theme] + ' ');
    }
  }
  await browser.close();
  // 변수별 쓰는 자리 수와 이기는 정의
  out.vars = VARS.map(name => { const perTheme = {};
    for (const theme of THEMES) { const now = out.screens['screen-home'].themes[theme].varsBefore[name];
      const cand = defs[name].filter(x => x.selector.includes('[data-theme="' + theme + '"]') || !/data-theme/.test(x.selector));
      const win = cand.filter(x => norm(x.value) === norm(now)).at(-1) || null;
      perTheme[theme] = { now, candidates: cand.length, winner: win ? { line: win.line, selector: win.selector, media: win.media } : null, changes: GENES.some(g => g.theme === theme && g.name === name), new: (GENES.find(g => g.theme === theme && g.name === name) || {}).new || null }; }
    return { name, uses: { css: count(css, name), html: count(index, name), js: jsCount(name) }, definitions: defs[name].length, perTheme }; });
  out.five = FIVE.map(name => ({ name, definitions: defs[name].length, definedInHtml: (index.match(new RegExp(name + '\\s*:', 'g')) || []).length, uses: { css: count(css, name), html: count(index, name), js: jsCount(name) } }));
  fs.writeFileSync(path.join(D, 'data.json'), JSON.stringify(out, null, 1), { encoding: 'utf8' });
  console.log('\n기준', commit, commitAt, '· 사진', fs.readdirSync(SHOTS).length + '장', '·', Math.round(fs.readdirSync(SHOTS).reduce((a, f) => a + fs.statSync(path.join(SHOTS, f)).size, 0) / 1024) + 'KB');
})().catch(e => { console.error('실패', e); process.exit(1); });
