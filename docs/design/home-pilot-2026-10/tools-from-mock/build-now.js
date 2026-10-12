// 아워골 홈의 "지금 모습"을 실제 뼈대와 실제 꾸밈(ui.css)으로 그려 찍는다. 자료를 채우는 코드는 돌리지 않는다(뼈대만).
const fs = require('fs'), path = require('path'), cp = require('child_process');
const D = __dirname, SRC = path.join(D, 'src');
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p => fs.existsSync(p));
const lines = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8').split(/\r?\n/);
const L = (a, b) => lines.slice(a - 1, b).join('\n');
// 홈 구획: 152~838행. 숨은 연결용 카드(#ogTaskWireSlot)는 시범에서 건드리지 않는 것이라 뺀다
const homeStart = lines.findIndex(l => l.includes('id="screen-home"')) + 1;
let homeEnd = homeStart; for (let i = homeStart; i < lines.length; i++) { if (/<\/section>/.test(lines[i])) { homeEnd = i + 1; break; } }
// 구획 안에 다른 section 이 들어 있어 위 방식으로는 끝을 못 찾는다 → 덩어리 해체 세션이 숨은 칸을 빼고 넘겨준 뼈대(204줄)를 쓴다
let home = fs.readFileSync(path.join(SRC, 'home-skeleton.html'), 'utf8');
const w0 = -1;
let wireNote = '넘겨받은 뼈대 ' + home.split(/\r?\n/).length + '줄 사용(숨은 칸은 이미 빠져 있음)';
if (w0 >= 0) {
  // 그 칸을 여는 <div 부터 짝이 맞는 </div> 까지 잘라 낸다
  const open = home.lastIndexOf('<div', w0); let depth = 0, i = open, end = -1;
  const re = /<div\b|<\/div>/g; re.lastIndex = open; let m;
  while ((m = re.exec(home))) { if (m[0] === '</div>') { depth--; if (depth === 0) { end = m.index + 6; break; } } else depth++; }
  if (end > 0) { wireNote = '숨은 칸 ' + home.slice(open, end).split('\n').length + '줄 뺌'; home = home.slice(0, open) + '<!-- 숨은 연결용 카드: 뺌 -->' + home.slice(end); }
}
const shellStart = lines.findIndex(l => l.includes('<div id="appShell">')) + 1;
const mainLine = lines.findIndex(l => l.includes('<main class="screens">')) + 1;
const navStart = lines.findIndex(l => l.includes('<div class="bottomnav">')) + 1;
let navEnd = navStart; for (let i = navStart; i < lines.length; i++) { if (/<\/nav>/.test(lines[i])) { navEnd = i + 2; break; } }
const shellHead = L(shellStart, mainLine);
const nav = L(navStart, navEnd);
const css = 'src/ui.css';
const probe = '<script>window.addEventListener("load",function(){setTimeout(function(){var d=document.documentElement,cs=getComputedStyle(d),b=getComputedStyle(document.body);var q=function(s){var e=document.querySelector(s);if(!e)return null;var c=getComputedStyle(e),r=e.getBoundingClientRect();return{w:Math.round(r.width),h:Math.round(r.height),bg:c.backgroundColor,color:c.color,radius:c.borderRadius,font:c.fontSize,display:c.display}};var o=document.createElement("pre");o.id="probe";o.textContent=JSON.stringify({theme:d.getAttribute("data-theme"),bodyBg:b.backgroundColor,bodyColor:b.color,font:b.fontFamily.slice(0,40),vars:(function(){var o={};["--rule","--ink","--brand","--card","--ink-soft","--surface-2","--ink-faint","--primary","--brand-strong","--radius-lg","--ease","--surface-3","--font","--card2","--radius","--primary-hover","--brand-soft","--shadow-sm","--bg","--border-subtle","--surface-1","--shadow","--card-border","--line","--card-bg"].forEach(function(n){o[n]=cs.getPropertyValue(n).trim()});return o})(),shell:q("#appShell"),card:q("#captureCardBox"),save:q("#captureSave"),input:q("#captureInput"),nav:q(".bottomnav"),overflow:d.scrollWidth>d.clientWidth,height:d.scrollHeight});document.body.appendChild(o)},600)})</script>';
const out = {};
for (const theme of ['focus-sanctuary', 'white', 'black', 'urban-city', '(없음)']) {
  const attr = theme === '(없음)' ? '' : ' data-theme="' + theme + '"';
  const name = 'now-' + (theme === '(없음)' ? 'root' : theme);
  const html = '<!doctype html><html lang="ko"' + attr + '><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"><link rel="stylesheet" href="' + css + '"><style>#appShell{display:block!important}#probe{display:none}</style></head><body>' + shellHead + '\n' + home + '\n</main>\n' + nav + '\n</div>' + probe + '</body></html>';
  const file = path.join(D, name + '.html');
  fs.writeFileSync(file, html, { encoding: 'utf8' });
  const url = 'file:///' + file.replace(/\\/g, '/');
  const prof = path.join(D, 'chrome-prof');
  try { fs.rmSync(prof, { recursive: true, force: true }); } catch (e) {}
  const common = ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--allow-file-access-from-files', '--window-size=500,2400', '--virtual-time-budget=8000', '--user-data-dir=' + prof];
  let dom = '';
  try { dom = cp.execFileSync(CHROME, common.concat(['--dump-dom', url]), { encoding: 'utf8', timeout: 120000, maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) {}
  const m = dom.match(/<pre id="probe">([\s\S]*?)<\/pre>/);
  out[theme] = m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&')) : '측정불가';
  try { fs.rmSync(prof, { recursive: true, force: true }); } catch (e) {}
  try { cp.execFileSync(CHROME, common.concat(['--screenshot=' + path.join(D, name + '.png'), url]), { stdio: 'ignore', timeout: 120000 }); } catch (e) {}
  try { fs.rmSync(prof, { recursive: true, force: true }); } catch (e) {}
}
console.log('홈 구획', homeStart + '~' + homeEnd, '·', wireNote, '· 껍데기', shellStart + '~' + mainLine, '· 하단 탭', navStart + '~' + navEnd);
fs.writeFileSync(path.join(D, 'now-measure.json'), JSON.stringify(out, null, 1), { encoding: 'utf8' });
for (const k of Object.keys(out)) console.log(k, out[k]==='측정불가'?out[k]:Object.keys(out[k].vars).length+'개 변수, 카드 '+JSON.stringify(out[k].card));
for (const f of fs.readdirSync(D).filter(f => f.endsWith('.png'))) console.log('사진', f, fs.statSync(path.join(D, f)).size);
