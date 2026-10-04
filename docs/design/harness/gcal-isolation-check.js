#!/usr/bin/env node
/* [#TASK-ES-345 CAL-02] 구글 캘린더 토큰 계정 격리 점검 (예비 확인 도구, 판정 아님)
   사용: node docs/design/harness/gcal-isolation-check.js <APP_DIR> [outJson]
   - 로컬 정적 서버 + 헤드리스 Chrome + shots-lib 게스트 시드·Supabase 목(외부·실계정 없음).
   - 같은 기기에 다른 계정(u_alice)의 토큰·_last 키·이메일 _last·접미사 없는 일정 캐시가 남아 있는 상태에서
     게스트(guest_demo)로 앱을 열고, 실제 앱 함수(window.restoreGoogleToken 등)와 화면으로 다음을 잰다.
     M1 다른 uid 로 restoreGoogleToken -> null, 구글 API 호출에 A 토큰 사용 0회, 달력에 A 일정 0건
     M2 A 로 돌아오면 A 토큰 복원, 로그아웃 없이 다시 B 로 바꾸면 메모리 토큰도 버려짐
     M3 _last·이메일 _last·공용 일정 캐시 키 정리
     M4 다른 uid 설정 복사 0 (B 설정에 연동 표시·A 이메일 없음)
     M5 게스트 -> 회원 1회 이전(게스트 키 -> 새 uid 키, 게스트 키 삭제)
     M6 토큰 만료 시 설정 화면 1줄 안내 + '다시 연결' 1탭 -> 기존 연결 함수 실행 */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const puppeteer = require('C:/dev/command-center/node_modules/puppeteer-core');
const shots = require('./shots-lib.js');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const APP_DIR = path.resolve(process.argv[2] || '.');
const OUT = process.argv[3] || null;

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
  return new Promise(r => server.listen(0, () => r(server)));
}

const A_TOKEN = 'TOK_ALICE_SECRET';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  const server = await startServer();
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-gpu', '--lang=ko-KR'] });
  const result = { appDir: APP_DIR, env: 'local static server + headless Chrome + guest seed + Supabase mock (no remote, no real account)', measures: {} };
  try {
    const page = await shots.newPage(browser, true, 'focus-sanctuary');
    // 다른 계정(A)이 같은 기기에 남긴 흔적 — 첫 로드 때 한 번만 심는다
    await page.evaluateOnNewDocument((tok) => {
      try {
        if (sessionStorage.getItem('__gcal_seeded')) return;
        sessionStorage.setItem('__gcal_seeded', '1');
        const now = Date.now();
        const aTok = JSON.stringify({ accessToken: tok, expiresAt: now + 3600e3, email: 'alice@example.com', updatedAt: now });
        localStorage.setItem('ourgoal_gcal_token_v1_u_alice', aTok);
        localStorage.setItem('ourgoal_gcal_token_v1_last', aTok);
        localStorage.setItem('ourgoal_gcal_email_last', 'alice@example.com');
        const d = new Date(); const day = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        localStorage.setItem('ourgoal_gcal_events', JSON.stringify([{ id: 'ev_alice', title: 'ALICE 비밀 일정', summary: 'ALICE 비밀 일정', date: day, start: { date: day }, end: { date: day }, kind: 'gcal' }]));
        localStorage.setItem('ourgoal_settings_u_alice', JSON.stringify({ googleCalendarConnected: true, googleCalendarEmail: 'alice@example.com' }));
        localStorage.setItem('ourgoal_current_user', 'u_alice');
      } catch (e) {}
    }, A_TOKEN);
    // 구글 API 호출에 실린 토큰 기록
    const googleCalls = [];
    page.on('request', (req) => {
      const u = req.url();
      if (/googleapis\.com/.test(u)) googleCalls.push({ url: u.slice(0, 80), auth: (req.headers().authorization || '') });
    });
    const consoleErrors = [];
    page.on('pageerror', (e) => consoleErrors.push(String(e.message || e).slice(0, 160)));

    await page.goto(base + '/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.state && window.state.profile && window.state.profile.id, { timeout: 20000 });
    await sleep(2500);

    // M1·M4: B(게스트) 화면에서
    const m1 = await page.evaluate(async () => {
      const out = {};
      out.uid = window.state.profile.id;
      const r = window.restoreGoogleToken();
      out.restoreResult = r ? (r.accessToken || 'object') : null;
      out.stateGoogleToken = window.state.googleToken ? window.state.googleToken.accessToken : null;
      try { out.getAccessTokenNonInteractive = await window.getGoogleAccessToken(false); } catch (e) { out.getAccessTokenNonInteractive = 'throw:' + e.message; }
      const s = window.state.profile.settings || {};
      out.settingsConnected = !!s.googleCalendarConnected;
      out.settingsEmail = s.googleCalendarEmail || '';
      out.isConnected = window.isGoogleCalendarConnected();
      return out;
    });
    await page.evaluate(() => window.setTab('calendar'));
    await sleep(1500);
    m1.calendarShowsAliceEvent = await page.evaluate(() => document.body.innerText.includes('ALICE 비밀 일정'));
    m1.calendarShowsAliceEmail = await page.evaluate(() => document.body.innerHTML.includes('alice@example.com'));
    m1.googleCallsWithAliceToken = googleCalls.filter(c => c.auth.includes('TOK_ALICE')).length;
    m1.googleCallsTotal = googleCalls.length;
    result.measures.M1_otherUidGetsNothing = m1;

    // M3: 공용 키 정리
    result.measures.M3_legacyKeysPurged = await page.evaluate(() => ({
      tokenLast: localStorage.getItem('ourgoal_gcal_token_v1_last'),
      emailLast: localStorage.getItem('ourgoal_gcal_email_last'),
      sharedEventsCache: localStorage.getItem('ourgoal_gcal_events'),
      aliceOwnKeyKept: !!localStorage.getItem('ourgoal_gcal_token_v1_u_alice')
    }));

    // M4: B 설정 저장본에 A 연동 흔적이 복사되지 않았는지
    result.measures.M4_noSettingsCopy = await page.evaluate(() => {
      const raw = localStorage.getItem('ourgoal_settings_' + window.state.profile.id) || '{}';
      let o = {}; try { o = JSON.parse(raw); } catch (e) {}
      return { storedConnected: !!o.googleCalendarConnected, storedHasAliceEmail: raw.includes('alice@example.com'), memoryConnected: !!(window.state.profile.settings || {}).googleCalendarConnected };
    });

    // M2: A 로 바꾸면 A 토큰, 로그아웃 없이 B 로 돌아오면 버려짐, B 가 자기 토큰 저장 후 서로 섞이지 않음
    result.measures.M2_ownerRoundTrip = await page.evaluate((tok) => {
      const st = window.state; const guest = st.profile; const out = {};
      st.profile = { id: 'u_alice', settings: { googleCalendarConnected: true, googleCalendarEmail: 'alice@example.com' } };
      const a = window.restoreGoogleToken(); out.aliceRestores = a ? a.accessToken : null;
      st.profile = guest;
      const b = window.restoreGoogleToken(); out.backToGuestInMemory = b ? b.accessToken : null;
      window.saveGoogleToken({ accessToken: 'TOK_GUEST_OWN', expiresAt: Date.now() + 3600e3 }, '');
      out.guestOwnRestores = (window.restoreGoogleToken() || {}).accessToken || null;
      st.profile = { id: 'u_alice', settings: { googleCalendarConnected: true } };
      out.aliceAfterGuestSave = (window.restoreGoogleToken() || {}).accessToken || null;
      st.profile = guest;
      out.guestAgain = (window.restoreGoogleToken() || {}).accessToken || null;
      out.lastKeyWrittenBySave = localStorage.getItem('ourgoal_gcal_token_v1_last');
      return out;
    }, A_TOKEN);

    // M5: 게스트 -> 회원 1회 이전
    result.measures.M5_guestToMemberOnce = await page.evaluate(async () => {
      const gid = window.state.profile.id;
      const gp = JSON.parse(localStorage.getItem('ourgoal_guest_profile') || '{}');
      gp.settings = Object.assign({}, gp.settings || {}, { googleCalendarConnected: true, googleCalendarEmail: 'guest@example.com' });
      localStorage.setItem('ourgoal_guest_profile', JSON.stringify(gp));
      const target = { id: 'u_newbie', settings: {} };
      try { await window.migrateGuestDataToUser('u_newbie', target); } catch (e) {}
      const moved = JSON.parse(localStorage.getItem('ourgoal_gcal_token_v1_u_newbie') || 'null');
      return { guestId: gid, movedToken: moved && moved.accessToken, movedOwner: moved && moved.ownerUid, guestKeyLeft: localStorage.getItem('ourgoal_gcal_token_v1_' + gid), aliceUntouched: (JSON.parse(localStorage.getItem('ourgoal_gcal_token_v1_u_alice') || '{}').accessToken) };
    });

    result.pageErrors = consoleErrors;
    await page.close();

    // M6: 같은 사람(guest_demo)이 만료된 자기 토큰을 가진 채 앱을 다시 연다 -> 설정 화면 1줄 안내 + '다시 연결' 1탭,
    //     달력 배지도 '다시 연결'로 바뀌고 누르면 기존 연결 함수(openGoogleCalendarConnectModal -> tryConnectGoogleCalendar)가 돈다.
    const p2 = await shots.newPage(browser, true, 'focus-sanctuary');
    await p2.evaluateOnNewDocument(() => {
      try {
        const gp = JSON.parse(localStorage.getItem('ourgoal_guest_profile') || '{}');
        gp.settings = Object.assign({}, gp.settings || {}, { googleCalendarConnected: true, googleCalendarEmail: 'me@example.com' });
        localStorage.setItem('ourgoal_guest_profile', JSON.stringify(gp));
        localStorage.setItem('ourgoal_settings_' + (gp.id || 'guest_demo'), JSON.stringify(gp.settings));
        localStorage.setItem('ourgoal_gcal_token_v1_' + (gp.id || 'guest_demo'), JSON.stringify({ accessToken: 'TOK_ME_EXPIRED', expiresAt: Date.now() - 60000, ownerUid: gp.id || 'guest_demo' }));
      } catch (e) {}
    });
    await p2.goto(base + '/index.html', { waitUntil: 'domcontentloaded' });
    await p2.waitForFunction(() => window.state && window.state.profile && window.state.profile.id, { timeout: 20000 });
    await sleep(2500);
    const m6 = await p2.evaluate(() => {
      const n = document.getElementById('gcalReconnectNotice');
      const b = document.getElementById('gcalReconnectBtn');
      return { uid: window.state.profile.id, tokenStatus: (typeof window.gcalTokenStatus === 'function') ? window.gcalTokenStatus() : 'n/a', noticeText: n ? n.textContent.replace(/다시 연결$/, '').trim() : null, buttonText: b ? b.textContent.trim() : null };
    });
    await p2.evaluate(() => { const d = document.getElementById('advancedSettingsAccordion'); if (d) d.open = true; window.setTab('settings'); });
    await sleep(800);
    // 사용자가 하듯 버튼을 감싼 접힘 구역(details)을 펼친다
    await p2.evaluate(() => { const b = document.getElementById('gcalReconnectBtn'); let p = b; while (p) { if (p.tagName === 'DETAILS') p.open = true; p = p.parentElement; } if (b) b.scrollIntoView({ block: 'center' }); });
    await sleep(300);
    const btn = await p2.$('#gcalReconnectBtn');
    if (btn) { await btn.click(); await sleep(500); }
    const toastHits = () => p2.evaluate(() => {
      const t = document.body.innerText;
      return ['구글 계정 연동 요청 중', '구글 로그인 스크립트를 불러오는 중', '구글 캘린더 연동 설정', '구글 캘린더 연동에 실패', '구글 캘린더를 다시 연결해요'].filter(s => t.includes(s));
    });
    m6.settingsTapFeedback = btn ? await toastHits() : 'button-missing';
    await sleep(3500);
    await p2.evaluate(() => window.setTab('calendar'));
    await sleep(1500);
    m6.calendarBadge = await p2.evaluate(() => { const b = document.getElementById('calGcalMiniBadge'); return b ? { text: b.textContent.trim(), state: b.getAttribute('data-gcal-state'), title: b.getAttribute('title') } : null; });
    const cb = await p2.$('#calGcalMiniBadge');
    if (cb) { await cb.click(); await sleep(500); }
    m6.calendarTapFeedback = cb ? await toastHits() : 'badge-missing';
    result.measures.M6_reconnectNotice = m6;
  } finally {
    await browser.close();
    server.close();
  }
  const json = JSON.stringify(result, null, 2);
  console.log(json);
  if (OUT) fs.writeFileSync(OUT, json + '\n', 'utf8');
})().catch((e) => { console.error(e); process.exit(1); });
