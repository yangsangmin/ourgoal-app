'use strict';
/* 객관 UI 감사: 렌더링된 DOM에서 측정 가능한 지표를 뽑는다 (LLM 불필요)
 * 사용: node audit.js <APP_DIR> <outJson>
 * 지표: 터치 타겟<44px 비율, 글자 크기 종수, 800+ 굵기 수, 그라디언트 수, 그림자 수, 라운드 종수, 이모지 수, 저대비 텍스트 수, 인라인 style 수
 */
const http = require('http'), fs = require('fs'), path = require('path');
const puppeteer = require('C:/dev/command-center/node_modules/puppeteer-core');
const APP_DIR = path.resolve(process.argv[2]);
const outFile = path.resolve(process.argv[3]);
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 4400 + Math.floor(Math.random() * 300);
const shots = require('./shots-lib.js');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  if (p.startsWith('/api/')) { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end('{"ok":true}'); }
  const f = path.join(APP_DIR, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(f).pipe(res);
});
const AUDIT_FN = `(() => {
  const vis = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
  const all = [...document.querySelectorAll('#appShell *')].filter(vis);
  const lum = (rgb) => { const m = rgb.match(/[\\d.]+/g); if (!m) return null; const [r,g,b] = m.slice(0,3).map(Number); const a = m[3] !== undefined ? Number(m[3]) : 1; if (a === 0) return null; const f = (c) => { c /= 255; return c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4); }; return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b); };
  const parse = (rgb) => { const m = rgb.match(/[\\d.]+/g); if (!m) return null; const a = m[3] !== undefined ? Number(m[3]) : 1; return { r:+m[0], g:+m[1], b:+m[2], a }; }; const bgOf = (el) => { const layers = []; let e = el; while (e && e !== document.documentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0) { layers.push(c); if (c.a >= 1) break; } e = e.parentElement; } let out = { r:255, g:255, b:255 }; const body = parse(getComputedStyle(document.body).backgroundColor); if (body && body.a >= 1) out = body; for (let i = layers.length - 1; i >= 0; i--) { const c = layers[i]; out = { r: c.r*c.a + out.r*(1-c.a), g: c.g*c.a + out.g*(1-c.a), b: c.b*c.a + out.b*(1-c.a) }; } return lum('rgb(' + out.r + ',' + out.g + ',' + out.b + ')'); };
  const contrast = (l1, l2) => (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);
  const sizes = new Set(), radii = new Set(); const smallList = {}, lowList = {}; let heavy = 0, grad = 0, shadow = 0, emoji = 0, lowContrast = 0, textEls = 0, small = 0, targets = 0, inlineStyle = 0;
  const emojiRe = /\\p{Extended_Pictographic}/gu;
  for (const el of all) {
    const cs = getComputedStyle(el);
    if (el.getAttribute('style')) inlineStyle++;
    if (cs.backgroundImage && cs.backgroundImage.includes('gradient')) grad++;
    if (cs.boxShadow && cs.boxShadow !== 'none') shadow++;
    if (cs.borderRadius && cs.borderRadius !== '0px') cs.borderRadius.split(' ').forEach(v => radii.add(v));
    const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
    if (own) {
      textEls++; sizes.add(cs.fontSize); const w = parseInt(cs.fontWeight, 10); if (w >= 800) heavy++;
      const m = own.match(emojiRe); if (m) emoji += m.length;
      const lc = lum(cs.color); if (lc !== null) { const c = contrast(lc, bgOf(el)); const px = parseFloat(cs.fontSize); const big = px >= 24 || (px >= 18.66 && w >= 700); if (c < (big ? 3 : 4.5)) { lowContrast++; const k = el.tagName.toLowerCase() + '.' + (el.className && el.className.baseVal === undefined ? String(el.className).split(' ').slice(0,2).join('.') : '') + ' ' + cs.color + ' fs' + cs.fontSize; lowList[k] = (lowList[k]||0)+1; } }
    }
    if (el.matches('button, a[href], [role="button"], input:not([type=hidden]), select, textarea, .switch, .goal-chip, .navbtn')) { targets++; const r = el.getBoundingClientRect(); if (r.width < 44 || r.height < 44) { small++; const k = el.tagName.toLowerCase() + '.' + String(el.className).split(' ').slice(0,2).join('.') + ' ' + Math.round(r.width) + 'x' + Math.round(r.height); smallList[k] = (smallList[k]||0)+1; } }
  }
  return { smallList, lowList, elements: all.length, textEls, fontSizes: sizes.size, heavyWeights: heavy, gradients: grad, shadows: shadow, radii: radii.size, emoji, lowContrast, targets, smallTargets: small, inlineStyle };
})()`;
async function main() {
  await new Promise(r => server.listen(PORT, r));
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-gpu', '--lang=ko-KR'] });
  const page = await shots.newPage(browser, true, 'white');
  await page.goto('http://localhost:' + PORT + '/', { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 1500));
  await page.evaluate(() => { const o = document.getElementById('modalOverlay'); if (o) o.classList.remove('active'); });
  const out = {};
  for (const t of ['home', 'goals', 'calendar', 'records', 'comm', 'settings']) {
    await page.evaluate((t) => { const b = document.querySelector('.navbtn[data-tab="' + t + '"]'); b && b.click(); }, t);
    await new Promise(r => setTimeout(r, 800));
    out[t] = await page.evaluate(AUDIT_FN);
  }
  await browser.close(); server.close();
  const agg=(key)=>{const m={};for(const sc of Object.values(out))for(const [k,v] of Object.entries(sc[key]))m[k]=(m[k]||0)+v;return Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,25);};const topSmall=agg('smallList'),topLow=agg('lowList');for(const sc of Object.values(out)){delete sc.smallList;delete sc.lowList;}const total = { topSmall, topLow }; for (const k of Object.keys(out.home)) total[k] = Object.values(out).reduce((a, s) => a + s[k], 0);
  // fontSizes/radii는 합이 아니라 화면별 최대·합집합 대신 평균
  total.fontSizes = Math.round(Object.values(out).reduce((a, s) => a + s.fontSizes, 0) / 6 * 10) / 10;
  total.radii = Math.round(Object.values(out).reduce((a, s) => a + s.radii, 0) / 6 * 10) / 10;
  total.smallTargetRatio = Math.round(total.smallTargets / Math.max(1, total.targets) * 1000) / 10;
  fs.writeFileSync(outFile, JSON.stringify({ appDir: APP_DIR, screens: out, total }, null, 2), 'utf8');
  console.log(JSON.stringify(total));
}
main().catch(e => { console.error(e); process.exit(1); });
