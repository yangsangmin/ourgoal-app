'use strict';
/* TASK-ES-346 (SET-01·SET-02) 설정 탭 정직성 측정 — 헤드리스 Chrome + 게스트 시드 + Supabase 목(mock).
 * docs/design/harness/shots-lib.js 의 newPage 를 재사용한다. 원격 서버·실계정에는 붙지 않는다.
 * 사용: node reports/TASK-ES-346/measure-settings-honesty.js <APP_DIR> [out.json]
 * 재는 것:
 *  M1 PIN 미설정 시 보안 카드 배지가 '설정됨/보호 중'을 표시하지 않는다
 *  M2 기기 목록: 새로 열 때 가짜 기기 생성 0, 예전 판이 저장한 가짜 2대는 로드 시 정리
 *  M3 PIN 설정 → 저장값이 평문 아님, 올바른 PIN 통과·틀린 PIN 실패(화면 입력), 예전 평문 PIN 은 첫 성공 때 해시로 이전
 *  M4 저장공간 표시가 하드코딩이 아니라 실측(또는 '측정 불가'), 비우기 뒤 다시 잰다
 *  M5 개별·카드 '원격 차단' 이 '끊었다'는 토스트를 내지 않는다(게스트: 세션 없음 안내)
 */
const http = require('http'), fs = require('fs'), path = require('path');
const puppeteer = require('C:/dev/command-center/node_modules/puppeteer-core');
const shots = require('../../docs/design/harness/shots-lib.js');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const APP_DIR = path.resolve(process.argv[2] || '.');
const OUT = process.argv[3] ? path.resolve(process.argv[3]) : null;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const UID = 'guest_demo';
const DEV_KEY = 'ourgoal_registered_devices_' + UID;

function startServer() {
  const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2' };
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/') p = '/index.html';
    if (p.startsWith('/api/')) { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end('{"ok":true}'); }
    const f = path.join(APP_DIR, p);
    if (!f.startsWith(APP_DIR) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => r(server)));
}

async function closeBootOverlays(page) {
  await page.evaluate(() => {
    const o = document.getElementById('modalOverlay');
    if (o && o.classList.contains('active') && !document.getElementById('challenge2FaPin')) o.classList.remove('active');
  });
  if (await page.$('#btnAvatarGreetClose')) {
    const shown = await page.evaluate(() => { const g = document.getElementById('avatarGreetingModal'); return !!g && getComputedStyle(g).display !== 'none'; });
    if (shown) { await page.click('#btnAvatarGreetClose').catch(() => {}); await sleep(500); }
  }
}

async function open(browser, base, seedFn, seedArg) {
  const page = await shots.newPage(browser, true, 'white');
  const toasts = [];
  if (seedFn) await page.evaluateOnNewDocument(seedFn, seedArg);
  await page.goto(base + '/index.html', { waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(1500);
  await closeBootOverlays(page);
  return { page, toasts };
}
async function toastAfter(page, action, wait) {
  await page.evaluate(() => { const t = document.getElementById('toast'); if (t) t.textContent = ''; });
  await action();
  await sleep(wait || 800);
  return page.evaluate(() => { const t = document.getElementById('toast'); return t ? t.textContent.trim() : null; });
}
async function gotoSettings(page) {
  await page.click('.navbtn[data-tab="settings"]').catch(() => {});
  await sleep(900);
}

(async () => {
  const server = await startServer();
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  const R = { app: APP_DIR, at: new Date().toISOString() };
  try {
    /* M1 + M2(새로 열기) + M4 + M5 */
    {
      const { page, toasts } = await open(browser, base);
      await gotoSettings(page);
      R.M1 = await page.evaluate(() => {
        const b = document.getElementById('badge2faStatus');
        return { badgeText: b ? b.textContent.trim() : null, dataApplock: b ? b.getAttribute('data-applock') : null };
      });
      R.M1.protectedShownWithoutPin = /보호 중|설정됨/.test(R.M1.badgeText || '');
      R.M2_fresh = await page.evaluate((k) => {
        const list = JSON.parse(localStorage.getItem(k) || '[]');
        return { storedCount: list.length, ids: list.map(d => d.id), ipHints: list.map(d => d.ipHint), cards: document.querySelectorAll('#activeDevicesContainer .active-device-card').length, badge: (document.getElementById('activeDeviceCountBadge') || {}).textContent };
      }, DEV_KEY);
      R.M2_fresh.fabricatedCount = R.M2_fresh.ids.filter(id => id === 'dev_mobile_pwa' || id === 'dev_tablet_tab').length;
      R.M4 = await page.evaluate(() => ({ text: document.getElementById('cacheSizeText').textContent.trim(), measured: document.getElementById('cacheSizeText').getAttribute('data-measured') }));
      R.M4.estimateUsage = await page.evaluate(async () => { try { const e = await navigator.storage.estimate(); return e.usage; } catch (e) { return null; } });
      R.M4.hardcoded142 = /14\.2 MB/.test(R.M4.text);
      await page.evaluate(() => { const e = document.getElementById('clearCacheBtn'); const d = e && e.closest('details'); if (d) d.open = true; e && e.scrollIntoView({ block: 'center' }); });
      await sleep(300);
      R.M4.clearToast = await toastAfter(page, () => page.click('#clearCacheBtn'), 1500);
      R.M4.afterClear = await page.evaluate(() => document.getElementById('cacheSizeText').textContent.trim());
      R.M1.refreshToast = await toastAfter(page, () => page.click('#btnSettingsSecurityRefresh'), 600);
      R.M1.badgeAfterRefresh = await page.evaluate(() => document.getElementById('badge2faStatus').textContent.trim());
      const killToast = await toastAfter(page, () => page.click('#btnDeviceKillSwitch'), 700);
      R.M5 = {
        killSwitchLabel: await page.evaluate(() => document.getElementById('btnDeviceKillSwitch').textContent.trim()),
        toastAfterClick: killToast,
        modalTitle: await page.evaluate(() => { const o = document.getElementById('modalOverlay'); const h = o && o.classList.contains('active') ? o.querySelector('h3') : null; return h ? h.textContent.trim() : null; }),
        modalText: await page.evaluate(() => { const o = document.getElementById('modalOverlay'); return o && o.classList.contains('active') ? o.textContent.replace(/\s+/g, ' ').trim().slice(0, 300) : null; })
      };
      R.M5.claimsCutWithoutAction = /차단되었습니다|로그아웃되었습니다|세션 차단\)했습니다/.test(killToast || '');
      await page.close();
    }
    /* M2_open: '다른 모든 기기에서 로그아웃' 버튼을 눌러 확인 창을 연 뒤 저장된 기기 목록(예전 판은 여기서 가짜 2대를 만들었다) */
    {
      const { page } = await open(browser, base);
      await gotoSettings(page);
      await page.evaluate(() => { const e = document.getElementById('logoutOtherDevicesBtn'); const d = e && e.closest('details'); if (d) d.open = true; e && e.scrollIntoView({ block: 'center' }); });
      await sleep(300);
      const t = await toastAfter(page, () => page.click('#logoutOtherDevicesBtn'), 800);
      R.M2_open = await page.evaluate((k) => {
        const list = JSON.parse(localStorage.getItem(k) || '[]');
        const o = document.getElementById('modalOverlay');
        return { storedCount: list.length, ids: list.map(d => d.id), ipHints: list.map(d => d.ipHint), modalText: o && o.classList.contains('active') ? o.textContent.replace(/\s+/g, ' ').trim().slice(0, 300) : null };
      }, DEV_KEY);
      R.M2_open.toast = t;
      R.M2_open.fabricatedCount = R.M2_open.ids.filter(id => id === 'dev_mobile_pwa' || id === 'dev_tablet_tab').length;
      await page.close();
    }
    /* M2(예전 판 가짜 기기 저장값 정리) */
    {
      const seed = (k) => {
        try {
          if (!sessionStorage.getItem('__seeded')) {
            sessionStorage.setItem('__seeded', '1');
            localStorage.setItem('ourgoal_device_id', 'dev_real_me');
            localStorage.setItem(k, JSON.stringify([
              { id: 'dev_real_me', name: 'Windows Chrome', platform: 'Windows', isCurrent: true, firstLogin: 1, lastActive: 2, ipHint: '대한민국 서울 (현재 위치)', revoked: false },
              { id: 'dev_mobile_pwa', name: '스마트폰 (모바일 PWA 앱)', platform: 'Mobile', isCurrent: false, firstLogin: 1, lastActive: 2, ipHint: '대한민국 (모바일 LTE/5G)', revoked: false },
              { id: 'dev_tablet_tab', name: '태블릿 / iPad Web', platform: 'Tablet', isCurrent: false, firstLogin: 1, lastActive: 2, ipHint: '대한민국 경기 (Wi-Fi 사무실)', revoked: false }
            ]));
          }
        } catch (e) {}
      };
      const { page } = await open(browser, base, seed, DEV_KEY);
      const before = 3;
      await gotoSettings(page);
      R.M2_legacy = await page.evaluate((k) => {
        const list = JSON.parse(localStorage.getItem(k) || '[]');
        return { storedCount: list.length, ids: list.map(d => d.id), ipHints: list.map(d => d.ipHint), firstLoginKept: list[0] && list[0].firstLogin, cards: document.querySelectorAll('#activeDevicesContainer .active-device-card').length, revokeButtons: document.querySelectorAll('#activeDevicesContainer .btn-revoke-device').length };
      }, DEV_KEY);
      R.M2_legacy.seededCount = before;
      R.M2_legacy.fabricatedLeft = R.M2_legacy.ids.filter(id => id === 'dev_mobile_pwa' || id === 'dev_tablet_tab').length;
      await page.close();
    }
    /* M3a 새 PIN 설정 → 해시 저장 → 화면에서 틀린/맞는 PIN */
    {
      const { page, toasts } = await open(browser, base);
      await gotoSettings(page);
      await page.evaluate(() => { const d = document.getElementById('twoFactorSwitch'); const acc = d && d.closest('details'); if (acc) acc.open = true; d && d.scrollIntoView(); });
      await sleep(300);
      await page.click('#twoFactorSwitch');
      await sleep(500);
      await page.type('#twoFaPinInput', '2580');
      await page.type('#twoFaPinConfirm', '2580');
      await page.click('#btnSave2Fa');
      await sleep(1000);
      R.M3_set = await page.evaluate(() => {
        const s = (window.state && window.state.profile && window.state.profile.settings) || {};
        const gp = JSON.parse(localStorage.getItem('ourgoal_guest_profile') || '{}');
        const ls = JSON.parse(localStorage.getItem('ourgoal_settings_guest_demo') || '{}');
        const b = document.getElementById('badge2faStatus');
        return { inMemory: s.twoFactorPin, guestProfileStored: gp.settings && gp.settings.twoFactorPin, settingsStored: ls.twoFactorPin, badge: b && b.textContent.trim() };
      });
      const all = [R.M3_set.inMemory, R.M3_set.guestProfileStored, R.M3_set.settingsStored].filter(v => v !== undefined && v !== null);
      R.M3_set.anyPlaintext = all.some(v => v === '2580' || String(v).indexOf('2580') >= 0);
      R.M3_set.allHashed = all.length > 0 && all.every(v => /^sha256v1\$/.test(v));
      R.M3_set.toasts = toasts.slice();
      R.M3_set.toasts = undefined;
      await page.close();
    }
    /* M3a' 위에서 저장된 해시값을 가진 상태로 앱을 새로 열고(세션 인증 없음) 화면에서 틀린/맞는 PIN 입력 */
    {
      const hashed = R.M3_set.settingsStored || R.M3_set.inMemory;
      const seed = (h) => {
        try {
          if (!sessionStorage.getItem('__seeded')) {
            sessionStorage.setItem('__seeded', '1');
            const p = JSON.parse(localStorage.getItem('ourgoal_guest_profile'));
            p.settings.twoFactorAuth = true; p.settings.twoFactorPin = h;
            localStorage.setItem('ourgoal_guest_profile', JSON.stringify(p));
            localStorage.setItem('ourgoal_settings_guest_demo', JSON.stringify(p.settings));
          }
        } catch (e) {}
      };
      const { page } = await open(browser, base, seed, hashed);
      R.M3_challenge = { shown: !!(await page.$('#challenge2FaPin')) };
      if (R.M3_challenge.shown) {
        R.M3_challenge.wrongToast = await toastAfter(page, () => page.type('#challenge2FaPin', '1111'), 900);
        R.M3_challenge.wrongStillLocked = !!(await page.$('#challenge2FaPin')) && await page.evaluate(() => sessionStorage.getItem('ourgoal_2fa_verified') !== 'true');
        R.M3_challenge.rightToast = await toastAfter(page, () => page.type('#challenge2FaPin', '2580'), 1300);
        R.M3_challenge.rightUnlocked = await page.evaluate(() => { const o = document.getElementById('modalOverlay'); return sessionStorage.getItem('ourgoal_2fa_verified') === 'true' && !(o && o.classList.contains('active') && o.querySelector('#challenge2FaPin')); });
      }
      await page.close();
    }
    /* M3b 예전 평문 PIN 사용자 → 첫 성공 때 해시로 이전(잠김 없음) */
    {
      const seed = () => {
        try {
          if (!sessionStorage.getItem('__seeded')) {
            sessionStorage.setItem('__seeded', '1');
            const p = JSON.parse(localStorage.getItem('ourgoal_guest_profile'));
            p.settings.twoFactorAuth = true; p.settings.twoFactorPin = '4321';
            localStorage.setItem('ourgoal_guest_profile', JSON.stringify(p));
            const st = JSON.parse(localStorage.getItem('ourgoal_settings_guest_demo') || 'null');
            localStorage.setItem('ourgoal_settings_guest_demo', JSON.stringify(Object.assign({}, st || p.settings, { twoFactorAuth: true, twoFactorPin: '4321' })));
          }
        } catch (e) {}
      };
      const { page } = await open(browser, base, seed);
      R.M3_legacy = { challengeShown: !!(await page.$('#challenge2FaPin')) };
      R.M3_legacy.storedBefore = await page.evaluate(() => (window.state && state.profile && state.profile.settings && state.profile.settings.twoFactorPin) || null);
      if (R.M3_legacy.challengeShown) {
        await page.type('#challenge2FaPin', '4321');
        await sleep(1500);
        R.M3_legacy.unlocked = await page.evaluate(() => sessionStorage.getItem('ourgoal_2fa_verified') === 'true');
        R.M3_legacy.after = await page.evaluate(() => {
          const s = state.profile.settings;
          const ls = JSON.parse(localStorage.getItem('ourgoal_settings_guest_demo') || '{}');
          const gp = JSON.parse(localStorage.getItem('ourgoal_guest_profile') || '{}');
          return { inMemory: s.twoFactorPin, settingsStored: ls.twoFactorPin, guestProfileStored: gp.settings && gp.settings.twoFactorPin };
        });
        R.M3_legacy.migratedToHash = /^sha256v1\$/.test(R.M3_legacy.after.inMemory || '') && /^sha256v1\$/.test(R.M3_legacy.after.settingsStored || '');
        R.M3_legacy.verifyOldPinAfter = await page.evaluate(() => window.verifyAppLockPin('4321'));
        R.M3_legacy.verifyWrongAfter = await page.evaluate(() => window.verifyAppLockPin('0000'));
      }
      await page.close();
    }
  } catch (e) {
    R.error = String(e && e.stack || e);
  } finally {
    await browser.close();
    server.close();
  }
  const json = JSON.stringify(R, null, 2);
  if (OUT) fs.writeFileSync(OUT, json, 'utf8');
  console.log(json);
})();
