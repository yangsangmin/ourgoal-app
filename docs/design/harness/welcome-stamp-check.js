'use strict';
/* TASK-ES-352 (노션 COMM-05) 측정 하네스 — 첫 체크인 축하 창 '웰컴 응원' 버튼의 실제 발송.
 * 로컬 정적 서버 + Chrome(puppeteer-core) + shots-lib.js 의 게스트 시드·Supabase 목(mock)을 고쳐 쓴다. 원격·실계정에 붙지 않는다.
 * 목은 team_pings insert 를 window.__SB_INSERTS 에 기록하고, 같은 id 두 번째 insert 는 실제 서버처럼 23505(중복 키)로 거절한다.
 * 로그인은 흉내만 낸다(state.user·state.profile.id 를 인증 UUID 로 바꿈). 실계정 두 개로 받는 쪽 도달은 재지 못한다.
 * 사용: node welcome-stamp-check.js <APP_DIR> [outJson]
 * 재는 것:
 *   M1 동류 2명 표시 → 누르면 insert 2행(sender·receiver·형식), 토스트 '2명', EXP +5, 소통 탭 이동
 *   M2 같은 날 다시 누르면 0행·EXP 그대로 / 기기 기록을 지워도 서버 중복 거절로 0행
 *   M3 게스트(세션 없음)·로그인했지만 동류 0명 → insert 0, '보냈어요' 0, 소통 탭 이동, EXP 그대로
 *   M4 받는 쪽: 마니또를 시작하지 않은 받는 회원의 소통 탭 → 마니또 '받은 응원함'에 보낸 사람 이름·문구가 보임
 */
const http = require('http'), fs = require('fs'), path = require('path');
const puppeteer = require('C:/dev/command-center/node_modules/puppeteer-core');
const shots = require('./shots-lib.js');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const APP_DIR = path.resolve(process.argv[2] || '.');
const OUT = process.argv[3] ? path.resolve(process.argv[3]) : null;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const ME = 'aaaaaaaa-1111-4111-8111-000000000001';
const PEER1 = 'bbbbbbbb-2222-4222-8222-000000000002';
const PEER2 = 'cccccccc-3333-4333-8333-000000000003';

/* shots-lib 의 목을 그대로 두고, 피드 글을 인증 UUID 회원 2명(운동 분야)으로 바꾸고 insert·select 필터를 기록하게 덧댄다 */
const MOCK = shots.MOCK_SUPABASE
  .replace(/var POSTS = \[[\s\S]*?\n  \];/, `var POSTS = [
    {id:'p1',user_id:'${PEER1}',display_name:'하늘',avatar_url:'',goal_title:'아침 러닝 5km',caption:'오늘 러닝 완료',cheers_count:1,extra:{category:'workout'},created_at:new Date(Date.now()-3600e3).toISOString()},
    {id:'p2',user_id:'${PEER2}',display_name:'민재',avatar_url:'',goal_title:'헬스 주 3회',caption:'운동 끝',cheers_count:2,extra:{category:'workout'},created_at:new Date(Date.now()-7200e3).toISOString()}
  ];
  window.__SB_INSERTS = window.__SB_INSERTS || [];
  window.__SB_ATTEMPTS = window.__SB_ATTEMPTS || [];`)
  .replace("var st = { single:false };", "var st = { single:false, op:'select', rows:null, f:{} };")
  .replace("chain.forEach(function(m){ b[m] = function(){ return b; }; });",
    "chain.forEach(function(m){ b[m] = function(){ return b; }; });\n    b.insert = function(r){ st.op = 'insert'; st.rows = Array.isArray(r) ? r : [r]; return b; };\n    b.eq = function(k, v){ st.f[k] = v; return b; };")
  .replace("var data = [];", `var data = [];
      if(table === 'team_pings' && st.op === 'insert'){
        var err = null;
        st.rows.forEach(function(r){
          window.__SB_ATTEMPTS.push(r);
          if(window.__SB_INSERTS.some(function(x){ return x.id === r.id; })) err = { code:'23505', message:'duplicate key value violates unique constraint' };
          else window.__SB_INSERTS.push(JSON.parse(JSON.stringify(r)));
        });
        return Promise.resolve({ data: null, error: err }).then(res, rej);
      }
      if(table === 'team_pings' && st.op === 'select'){
        data = window.__SB_INSERTS.filter(function(x){ return Object.keys(st.f).every(function(k){ return String(x[k]) === String(st.f[k]); }); });
      }`);

function serve(dir){
  return new Promise((res) => {
    const srv = http.createServer((req, rsp) => {
      let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
      const f = path.join(dir, p);
      if (!f.startsWith(dir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rsp.writeHead(404); return rsp.end(); }
      rsp.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(rsp);
    }).listen(0, () => res(srv));
  });
}

async function openPage(browser, base, errors, preInserts){
  const page = await shots.newPage(browser, true, 'focus-sanctuary');
  await page.setRequestInterception(true);
  page.removeAllListeners('request');
  page.on('request', (req) => {
    const u = req.url();
    if (/supabase-js/.test(u)) return req.respond({ status: 200, contentType: 'text/javascript', body: MOCK });
    if (/supabase\.co|accounts\.google\.com|googleapis\.com|gstatic\.com|kakao|pagead|googlesyndication|doubleclick|fonts\.|jsdelivr/.test(u)) return req.respond({ status: 204, body: '' });
    req.continue();
  });
  if (preInserts) await page.evaluateOnNewDocument((rows) => { window.__SB_INSERTS = rows; }, preInserts);
  page.on('pageerror', (e) => errors.push(String(e.message || e).slice(0, 200)));
  await page.setViewport({ width: 375, height: 812 });
  await page.goto(base + '/index.html', { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForFunction(() => window.state && window.state.profile && typeof window.triggerFirstCheckinCelebrationModal === 'function', { timeout: 30000 });
  return page;
}

/* 축하 창을 열고 버튼을 실제로 눌러 결과를 잰다 */
async function openAndClick(page, goal){
  const before = await page.evaluate(() => ({ n: window.__SB_INSERTS.length, a: window.__SB_ATTEMPTS.length, xp: (window.state.profile.settings.xp || {}).total }));
  await page.evaluate((g) => { try { window.closeModal && window.closeModal(); } catch (e) {} window.triggerFirstCheckinCelebrationModal(g, '아침 러닝 5km 완료'); }, goal);
  await page.waitForSelector('#firstCheckinCommBtn', { visible: true, timeout: 10000 });
  const modal = await page.evaluate(() => ({ label: document.getElementById('firstCheckinCommBtn').textContent.trim(), peerWidget: !!document.getElementById('firstCheckinPeerRunners'),
    peerNames: Array.from(document.querySelectorAll('#firstCheckinPeerRunners [style*="font-weight:700"]')).map((e) => e.textContent) }));
  await page.evaluate(() => document.getElementById('firstCheckinCommBtn').scrollIntoView({ block: 'center' }));
  await new Promise((r) => setTimeout(r, 300));
  await page.evaluate(() => { const t = document.getElementById('toast'); if (t) { t.textContent = ''; t.classList.remove('show'); } });
  await page.click('#firstCheckinCommBtn');
  await page.waitForFunction(() => { const t = (document.getElementById('toast') || {}).textContent || ''; return /웰컴 응원|소통 탭/.test(t) && document.getElementById('toast').classList.contains('show'); }, { timeout: 10000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 400));
  const after = await page.evaluate(() => ({ n: window.__SB_INSERTS.length, a: window.__SB_ATTEMPTS.length, xp: (window.state.profile.settings.xp || {}).total,
    toast: (document.getElementById('toast') || {}).textContent || '', activeTab: window.state.activeTab, commSubTab: window.state.commSubTab,
    rows: window.__SB_INSERTS.slice() }));
  return { modal, newRows: after.rows.slice(before.n), insertsAdded: after.n - before.n, attempts: after.a - before.a, xpDelta: (after.xp || 0) - (before.xp || 0),
    toast: after.toast, saysSentNow: /(명에게|러너들에게).*보냈어요/.test(after.toast), activeTab: after.activeTab, commSubTab: after.commSubTab };
}

(async () => {
  const srv = await serve(APP_DIR); const base = 'http://localhost:' + srv.address().port;
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  const out = { app: APP_DIR, at: new Date().toISOString(), results: {} };
  const errors = [];
  const goalRun = { id: 'gx', title: '아침 러닝 5km', category: '운동' };
  const goalStudy = { id: 'gy', title: '토익 900', category: '공부' };
  try {
    // 보내는 사람: 로그인 흉내 + 피드 로드(소통 탭 한 번 열기)
    const page = await openPage(browser, base, errors);
    await page.evaluate((me) => { window.state.user = { id: me }; window.state.profile.id = me; window.state.profile.displayName = '지민'; window.state.commSubTab = 'feed'; window.setTab('comm'); }, ME);
    await page.waitForFunction(() => document.body.innerText.indexOf('오늘 러닝 완료') !== -1, { timeout: 15000 }).catch(() => {});
    await page.evaluate(() => window.setTab('home'));
    out.results.M1_send = await openAndClick(page, goalRun);
    out.results.M2_sameDay = await openAndClick(page, goalRun);
    await page.evaluate(() => { window.state.profile.settings.welcomeStampSent = null; });
    out.results.M2_serverDedupe = await openAndClick(page, goalRun);
    out.results.M3_loggedInZeroPeers = await openAndClick(page, goalStudy);
    // 게스트(세션 없음) — 동류가 화면에 보여도 보내지 않는다
    await page.evaluate(() => { window.state.user = null; window.state.profile.id = 'guest_demo'; window.state.profile.settings.welcomeStampSent = null; });
    out.results.M3_guest = await openAndClick(page, goalRun);
    const sentRows = (out.results.M1_send.newRows || []);
    await page.close();

    // 받는 사람: 마니또를 시작하지 않은 PEER1 이 소통 탭 → 마니또를 연다
    const rpage = await openPage(browser, base, errors, sentRows);
    await rpage.evaluate((pid) => { window.state.user = { id: pid }; window.state.profile.id = pid; if (window.state.profile.settings.manito) window.state.profile.settings.manito.joined = false; window.setTab('comm'); }, PEER1);
    await rpage.waitForSelector('#commBody [data-sub="manito"]', { visible: true, timeout: 15000 });
    // 화면 전환 애니메이션 중에는 좌표 클릭이 HTML 에 떨어진다 — 마니또 칸의 실제 click 이벤트를 DOM 으로 보낸다
    await rpage.evaluate(() => document.querySelector('#commBody [data-sub="manito"]').click());
    await rpage.waitForFunction(() => !!document.getElementById('manitoPreJoinInbox'), { timeout: 15000 }).catch(() => {});
    out.results.M4_receiver = await rpage.evaluate(() => {
      const box = document.getElementById('manitoPreJoinInbox');
      return { inboxShown: !!box, text: box ? box.innerText.replace(/\s+/g, ' ').slice(0, 200) : '', tab: window.state.activeTab, sub: window.state.commSubTab,
        rowsOnServer: (window.__SB_INSERTS || []).length, body: ((document.getElementById('commSubBody') || {}).innerText || '').replace(/\s+/g, ' ').slice(0, 120) };
    });
    await rpage.close();
  } catch (e) {
    out.fatal = String(e && e.stack || e).slice(0, 600);
  }
  out.pageErrors = errors.slice(0, 10);
  await browser.close(); srv.close();
  const s = JSON.stringify(out, null, 2);
  if (OUT) fs.writeFileSync(OUT, s, 'utf8');
  console.log(s);
})();
