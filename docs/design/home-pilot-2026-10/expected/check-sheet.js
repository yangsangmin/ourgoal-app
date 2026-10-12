// 2판 보고서를 화면 없는 크롬으로 한 번 열어 오류·가로 넘침을 재고 한 장 찍는다
const fs = require('fs'), path = require('path'), cp = require('child_process');
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p => fs.existsSync(p));
const src = fs.readFileSync(path.join(__dirname, '예상-변화-한장.html'), 'utf8');
const probe = '<script>window.__e=[];window.addEventListener("error",function(e){window.__e.push(String(e.message))});window.addEventListener("load",function(){setTimeout(function(){var d=document.documentElement;var wide=[];document.querySelectorAll(".page *").forEach(function(el){var r=el.getBoundingClientRect();if(r.right>d.clientWidth+1&&!el.closest(".tw,.fig"))wide.push(el.tagName+"."+el.className)});var o=document.createElement("pre");o.id="probe";o.textContent=JSON.stringify({errors:window.__e,overflow:d.scrollWidth>d.clientWidth,scrollW:d.scrollWidth,clientW:d.clientWidth,height:d.scrollHeight,wide:wide.slice(0,8),tables:document.querySelectorAll("table").length,bare:Array.from(document.querySelectorAll("table")).filter(function(t){return !t.closest(".tw")}).length});document.body.appendChild(o)},400)})</script>';
const page = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' + probe + src + '</body></html>';
const html = path.join(__dirname, 'sheet-check.html');
fs.writeFileSync(html, page, { encoding: 'utf8' });
const url = 'file:///' + html.replace(/\\/g, '/');
const prof = path.join(__dirname, 'chrome-prof-sheet');
for (const [name, size] of [['넓은 화면', '1280,900'], ['좁은 화면', '500,900']]) {
  try { fs.rmSync(prof, { recursive: true, force: true }); } catch (e) {}
  const common = ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--window-size=' + size, '--virtual-time-budget=6000', '--user-data-dir=' + prof];
  let dom = '';
  try { dom = cp.execFileSync(CHROME, common.concat(['--dump-dom', url]), { encoding: 'utf8', timeout: 90000, maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = ''; }
  const m = dom.match(/<pre id="probe">([\s\S]*?)<\/pre>/);
  console.log(name, m ? m[1].replace(/&quot;/g, '"') : '측정불가(결과를 못 읽음)');
}
try { fs.rmSync(prof, { recursive: true, force: true }); } catch (e) {}
const png = path.join(__dirname, 'sheet-check.png');
try { cp.execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--window-size=1280,2400', '--virtual-time-budget=6000', '--user-data-dir=' + prof, '--screenshot=' + png, url], { stdio: 'ignore', timeout: 90000 }); } catch (e) {}
console.log('캡처', fs.existsSync(png) ? fs.statSync(png).size + ' bytes' : '없음');
