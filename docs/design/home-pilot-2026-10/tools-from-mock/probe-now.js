// 지금 모습에서 시안의 "지금" 칸에 적을 값을 직접 잰다: 대표색 위 글자 변수, 탭 줄 바탕, 아바타 배지 크기, 가장 작은 글자, 저장 단추의 바탕과 글자
const fs = require('fs'), path = require('path'), cp = require('child_process');
const D = __dirname;
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p => fs.existsSync(p));
const inj = '<script>window.addEventListener("load",function(){setTimeout(function(){var d=document.documentElement,cs=getComputedStyle(d);var v=function(n){return cs.getPropertyValue(n).trim()};var box=function(s){var e=document.querySelector(s);if(!e)return null;var c=getComputedStyle(e),r=e.getBoundingClientRect();return{w:Math.round(r.width),h:Math.round(r.height),bg:c.backgroundColor,bgImage:c.backgroundImage.slice(0,90),color:c.color,font:c.fontSize,radius:c.borderRadius}};var small=[];document.querySelectorAll("#screen-home *").forEach(function(e){if(!e.children.length&&e.textContent.trim()&&e.getClientRects().length){var f=parseFloat(getComputedStyle(e).fontSize);if(f<12)small.push(f+"px|"+e.textContent.trim().slice(0,18))}});var o=document.createElement("pre");o.id="probe2";o.textContent=JSON.stringify({rootFont:cs.fontSize,chipInk:v("--chip-ink"),navBg:v("--bottomnav-bg"),brand:v("--brand"),avatarBadge:box("#sanctuaryAvatarBadge"),bell:box("#sanctuaryBellBtn"),save:box("#captureSave"),title:box(".sanctuary-title-text"),chip:box("#smartChipExercise"),photoBtn:box("#capturePhotoBtn"),smallCount:small.length,small:small.slice(0,12)});document.body.appendChild(o)},600)})</script>';
const out = {};
for (const name of ['focus-sanctuary', 'white', 'black', 'urban-city']) {
  const src = fs.readFileSync(path.join(D, 'now-' + name + '.html'), 'utf8').replace('</body>', inj + '</body>');
  const f = path.join(D, 'probe-' + name + '.html'); fs.writeFileSync(f, src, { encoding: 'utf8' });
  const prof = path.join(D, 'chrome-prof-p'); try { fs.rmSync(prof, { recursive: true, force: true }); } catch (e) {}
  let dom = ''; try { dom = cp.execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--allow-file-access-from-files', '--window-size=500,2400', '--virtual-time-budget=8000', '--user-data-dir=' + prof, '--dump-dom', 'file:///' + f.replace(/\\/g, '/')], { encoding: 'utf8', timeout: 120000, maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) {}
  const m = dom.match(/<pre id="probe2">([\s\S]*?)<\/pre>/);
  out[name] = m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&gt;/g, '>').replace(/&lt;/g, '<')) : '측정불가';
  try { fs.rmSync(prof, { recursive: true, force: true }); } catch (e) {}
}
fs.writeFileSync(path.join(D, 'now-probe2.json'), JSON.stringify(out, null, 1), { encoding: 'utf8' });
for (const k of Object.keys(out)) console.log(k, JSON.stringify(out[k]));
