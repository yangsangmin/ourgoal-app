// 시안 1판을 한 파일로 조립하고(지금 모습 사진을 넣는다) 화면 없는 브라우저로 점검한다
const fs = require('fs'), path = require('path'), cp = require('child_process');
const D = __dirname;
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p => fs.existsSync(p));
const img = f => 'data:image/png;base64,' + fs.readFileSync(path.join(D, f)).toString('base64');
let s = fs.readFileSync(path.join(D, 'mock1.src.html'), 'utf8');
s = s.split('__NOW_FS__').join(img('now-focus-sanctuary.png')).split('__NOW_WHITE__').join(img('now-white.png')).split('__NOW_BLACK__').join(img('now-black.png')).split('__NOW_URBAN__').join(img('now-urban-city.png'));
const out = path.join(D, 'ourgoal-home-mock1.html');
fs.writeFileSync(out, s, { encoding: 'utf8' });
console.log('조립', Math.round(s.length / 1024) + 'KB');

const probe = '<script>window.__e=[];window.addEventListener("error",function(e){window.__e.push(String(e.message))});window.addEventListener("load",function(){setTimeout(function(){var d=document.documentElement;var wide=[];document.querySelectorAll(".page *").forEach(function(el){var r=el.getBoundingClientRect();if(r.right>d.clientWidth+1&&!el.closest(".tw"))wide.push(el.tagName+"."+String(el.className).slice(0,30))});var ph=document.getElementById("ogPhone"),cap=document.getElementById("captureCardBox"),me=document.getElementById("levelBadgeRow");var small=[];ph.querySelectorAll("*").forEach(function(e){if(!e.children.length&&e.textContent.trim()&&e.getClientRects().length){var f=parseFloat(getComputedStyle(e).fontSize);if(f<12)small.push(f+"px|"+e.textContent.trim().slice(0,14))}});var taps=[];ph.querySelectorAll("button,summary,[role=button]").forEach(function(e){var r=e.getBoundingClientRect();if(r.width&&r.height<40)taps.push(Math.round(r.height)+"px|"+(e.id||e.textContent.trim().slice(0,10)))});var top=ph.getBoundingClientRect().top;var o=document.createElement("pre");o.id="probe";o.textContent=JSON.stringify({errors:window.__e,overflow:d.scrollWidth>d.clientWidth,wide:wide.slice(0,6),parity:document.getElementById("parityOut").getAttribute("data-found"),phoneW:Math.round(ph.getBoundingClientRect().width),phoneH:Math.round(ph.getBoundingClientRect().height),capBottom:Math.round(cap.getBoundingClientRect().bottom-top),meH:Math.round(me.getBoundingClientRect().height),capH:Math.round(cap.getBoundingClientRect().height),h2font:getComputedStyle(cap.querySelector(".og-h")).fontSize,smallFonts:small.slice(0,8),smallTaps:taps.slice(0,10),geneRows:document.querySelectorAll("#geneRows tr").length,contrastRows:document.querySelectorAll("#contrastRows tr").length,stateCard:!!document.querySelector("#stateHost .og-cap"),dupIds:(function(){var m={},dup=[];document.querySelectorAll("[id]").forEach(function(e){if(m[e.id])dup.push(e.id);m[e.id]=1});return dup})()});document.body.appendChild(o)},700)})</script>';
const page = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' + probe + s + '</body></html>';
const chk = path.join(D, 'mock1-check.html'); fs.writeFileSync(chk, page, { encoding: 'utf8' });
const url = 'file:///' + chk.replace(/\\/g, '/'), prof = path.join(D, 'chrome-prof-m');
for (const [name, size] of [['넓은 화면', '1280,900'], ['좁은 화면', '500,900']]) {
  try { fs.rmSync(prof, { recursive: true, force: true }); } catch (e) {}
  let dom = ''; try { dom = cp.execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--window-size=' + size, '--virtual-time-budget=9000', '--user-data-dir=' + prof, '--dump-dom', url], { encoding: 'utf8', timeout: 120000, maxBuffer: 96 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) {}
  const m = dom.match(/<pre id="probe">([\s\S]*?)<\/pre>/);
  console.log(name, m ? m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&') : '측정불가');
}
try { fs.rmSync(prof, { recursive: true, force: true }); } catch (e) {}
try { cp.execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--window-size=1280,3400', '--virtual-time-budget=9000', '--user-data-dir=' + prof, '--screenshot=' + path.join(D, 'mock1-check.png'), url], { stdio: 'ignore', timeout: 120000 }); } catch (e) {}
console.log('캡처', fs.existsSync(path.join(D, 'mock1-check.png')) ? fs.statSync(path.join(D, 'mock1-check.png')).size : '없음');
