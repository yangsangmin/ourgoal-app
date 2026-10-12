// 시안의 바꿔 보기 단추를 전부 눌러 보고 오류와 상태를 잰다. 새로 더한 모습(목표 없음, 피드백 도착, 범위 강조)을 한 장 찍는다
const fs = require('fs'), path = require('path'), cp = require('child_process');
const D = __dirname;
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p => fs.existsSync(p));
const s = fs.readFileSync(path.join(D, 'ourgoal-home-mock1.html'), 'utf8');
const test = `<script>window.__e=[];window.addEventListener("error",function(e){window.__e.push(String(e.message))});window.addEventListener("load",function(){setTimeout(function(){
var q=function(s){return document.querySelector(s)},vis=function(e){return !!(e&&e.getClientRects().length)};
var press=function(g,v){var b=q('.seg[data-group="'+g+'"] button[data-v="'+v+'"]');if(!b){window.__e.push("단추 없음 "+g+"="+v);return}b.click()};
var r={},ph=q("#ogPhone"),st=q("#stateHost");
var all=[];document.querySelectorAll(".seg").forEach(function(seg){seg.querySelectorAll("button").forEach(function(b){all.push([seg.getAttribute("data-group"),b.getAttribute("data-v")])})});
all.forEach(function(a){press(a[0],a[1])});r.pressed=all.length;
// 처음 상태로
["theme=focus-sanctuary","chips=on","cond=half","rank=off","hint=on","cond2=off","goal=has","linked=off","savelabel=기록 완료","scope=off","state=empty","reward=toast"].forEach(function(x){var p=x.split("=");press(p[0],p[1])});
press("goal","none");r.emptyShown=vis(q("#ogPhone .og-empty"));r.goalHidden=!vis(q("#ogPhone .og-hasgoal"));r.starters=document.querySelectorAll("#ogPhone .og-empty .og-start").length;
press("linked","on");r.linkedShown=vis(q("#ogPhone .og-linked"));r.linkedText=q("#ogPhone .og-linked").innerText.slice(0,30);
press("savelabel","기록하기");r.saveLabel=q("#captureSave").textContent+"|"+st.querySelector('[data-id="captureSave"]').textContent;
press("state","feedback");r.fbShown=vis(st.querySelector(".og-fb"));r.fbButtons=st.querySelectorAll(".og-fb button").length;
press("state","saved");press("reward","pulse");r.pulseShown=vis(st.querySelector(".og-pulse"));r.toast=st.querySelector(".og-toast").textContent;
press("state","saving");r.savingLabel=st.querySelector('[data-id="captureSave"]').textContent;
press("state","fail");r.failShown=vis(st.querySelector(".og-fail"));
press("theme","urban-city");r.theme=ph.getAttribute("data-theme")+"|"+getComputedStyle(ph).getPropertyValue("--brand").trim();
press("scope","on");r.scopeOutline=getComputedStyle(q("#captureCardBox")).outlineStyle;
var small=[],taps=[];document.querySelectorAll("#ogPhone *, #stateHost *").forEach(function(e){if(!e.children.length&&e.textContent.trim()&&e.getClientRects().length){var f=parseFloat(getComputedStyle(e).fontSize);if(f<12)small.push(f+"px|"+e.textContent.trim().slice(0,12))}});
document.querySelectorAll("#ogPhone button, #stateHost button, #ogPhone summary").forEach(function(e){var b=e.getBoundingClientRect();if(b.width&&b.height<40)taps.push(Math.round(b.height)+"px|"+(e.id||e.getAttribute("data-ctl")||e.textContent.trim().slice(0,10)))});
r.smallFonts=small.slice(0,6);r.smallTaps=taps.slice(0,8);
press("state","feedback");press("theme","focus-sanctuary");
var d=document.documentElement;r.overflow=d.scrollWidth>d.clientWidth;r.errors=window.__e;
var o=document.createElement("pre");o.id="probe";o.textContent=JSON.stringify(r);document.body.appendChild(o);
},700)})</script>`;
const page = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' + s + test + '</body></html>';
const chk = path.join(D, 'mock1-switch.html'); fs.writeFileSync(chk, page, { encoding: 'utf8' });
const url = 'file:///' + chk.replace(/\\/g, '/'), prof = path.join(D, 'chrome-prof-s');
try { fs.rmSync(prof, { recursive: true, force: true }); } catch (e) {}
let dom = ''; try { dom = cp.execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--window-size=1280,900', '--virtual-time-budget=9000', '--user-data-dir=' + prof, '--dump-dom', url], { encoding: 'utf8', timeout: 120000, maxBuffer: 96 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) {}
const m = dom.match(/<pre id="probe">([\s\S]*?)<\/pre>/);
console.log(m ? m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&') : '측정불가');
try { fs.rmSync(prof, { recursive: true, force: true }); } catch (e) {}
try { cp.execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--window-size=1280,5200', '--virtual-time-budget=9000', '--user-data-dir=' + prof, '--screenshot=' + path.join(D, 'mock1-switch.png'), url], { stdio: 'ignore', timeout: 120000 }); } catch (e) {}
console.log('캡처', fs.existsSync(path.join(D, 'mock1-switch.png')) ? fs.statSync(path.join(D, 'mock1-switch.png')).size : '없음');
