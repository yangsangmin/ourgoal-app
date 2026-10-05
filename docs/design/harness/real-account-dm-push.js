'use strict';
// #TASK-ES-397 실계정 DM 푸시 요청 실측(작업자 보조, 판정 아님) — A 가 B 에게 DM 을 보낼 때 /api/push-dispatch 로 나가는 요청과 서버 응답을 잰다.
// 로컬 127.0.0.2 정적 서버(앱 사본) + /api 운영 전달(OG_APP_URL), 테스트 계정 A·B 이메일 로그인(Windows 사용자 환경 변수를 자식 프로세스에만).
// 재는 두 경로: ① 대화방 전송(js/team-dm-room.js send → #dmSend) ② 피드 공유 DM(js/team-share.js openFeedShareModal → [data-sharecompdm]).
// 기록하는 것: 요청 방식·Authorization 머리글이 Bearer 인지(참거짓)·본문 칸 이름·받는 사람 칸이 B 인지(참거짓)·응답 코드·응답 칸(ok·sent·error 글자).
// 주소·비밀번호·토큰·uid·메시지 본문은 출력·기록하지 않는다. 만든 DM 행(이번 실행 표식)은 끝에 지운다.
// 사용(PowerShell 에서 환경 변수를 자식에만): node real-account-dm-push.js <APP_DIR> <label> <out.json>
const http = require('http'), https = require('https'), fs = require('fs'), path = require('path');
const puppeteer = require('C:/dev/command-center/node_modules/puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const [APP, LABEL, OUT] = process.argv.slice(2);
const env = process.env;
for (const k of ['OG_APP_URL', 'OG_TEST_A_EMAIL', 'OG_TEST_A_PASSWORD', 'OG_TEST_B_EMAIL', 'OG_TEST_B_PASSWORD']) if (!env[k]) { console.log('계정 없음 — 재생 안 함(' + k + ')'); process.exitCode = 2; return; }
const allow = String(env.OG_TEST_ALLOW || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
const isTest = (a) => /ogtest/i.test(a) || allow.includes(String(a).trim().toLowerCase());
if (!isTest(env.OG_TEST_A_EMAIL) || !isTest(env.OG_TEST_B_EMAIL) || env.OG_TEST_A_EMAIL.trim().toLowerCase() === env.OG_TEST_B_EMAIL.trim().toLowerCase()) { console.log('테스트 계정 조건 위반 — 접속 안 함'); process.exitCode = 3; return; }
const UPSTREAM = new URL(env.OG_APP_URL.replace(/\/+$/, ''));
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.webp': 'image/webp', '.jpg': 'image/jpeg' };
const wait = ms => new Promise(r => setTimeout(r, ms));
async function until(fn, ms) { const end = Date.now() + ms; while (Date.now() < end) { const v = await fn().catch(() => null); if (v) return v; await wait(500); } return null; }

const pushLog = [];
let peerUid = null;
function serve(dir) {
  dir = path.resolve(dir);
  const s = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
    if (p.startsWith('/api/')) {
      const chunks = [];
      req.on('data', c => chunks.push(c));
      req.on('end', () => {
        const raw = Buffer.concat(chunks);
        const isPush = p === '/api/push-dispatch';
        let entry = null;
        if (isPush) {
          let body = null; try { body = JSON.parse(raw.toString('utf8') || 'null'); } catch (e) {}
          const auth = String(req.headers['authorization'] || '');
          entry = {
            at: Date.now(), method: req.method,
            hasBearer: auth.indexOf('Bearer ') === 0 && auth.length > 7,
            bodyKeys: body && typeof body === 'object' ? Object.keys(body).sort() : null,
            targetUserIdIsPeer: !!(body && peerUid && body.targetUserId === peerUid),
            receiverIdIsPeer: !!(body && peerUid && body.receiver_id === peerUid),
            tagPrefix: body && typeof body.tag === 'string' ? body.tag.slice(0, 6) : null,
            status: null, response: null
          };
          pushLog.push(entry);
        }
        const up = https.request({ hostname: UPSTREAM.hostname, port: 443, path: req.url, method: req.method, headers: Object.assign({}, req.headers, { host: UPSTREAM.hostname }) }, r => {
          const rc = [];
          r.on('data', c => rc.push(c));
          r.on('end', () => {
            const buf = Buffer.concat(rc);
            if (entry) {
              entry.status = r.statusCode;
              let j = null; try { j = JSON.parse(buf.toString('utf8')); } catch (e) {}
              entry.response = j && typeof j === 'object' ? { keys: Object.keys(j).sort(), ok: j.ok === undefined ? null : j.ok, sent: typeof j.sent === 'number' ? j.sent : null, error: typeof j.error === 'string' ? j.error.slice(0, 80) : null } : { nonJsonBytes: buf.length };
            }
            const h = Object.assign({}, r.headers); delete h['content-encoding']; delete h['transfer-encoding']; h['content-length'] = buf.length;
            res.writeHead(r.statusCode, h); res.end(buf);
          });
        });
        up.on('error', () => { if (entry) entry.status = 'upstream-error'; res.writeHead(502); res.end(); });
        up.end(raw);
      });
      return;
    }
    const f = path.join(dir, p);
    if (!f.startsWith(dir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(f).pipe(res);
  });
  const port = 5600 + Math.floor(Math.random() * 300);
  return new Promise(r => s.listen(port, '127.0.0.2', () => r({ s, base: 'http://127.0.0.2:' + port })));
}
const loggedIn = page => page.evaluate(() => { const shell = document.getElementById('appShell'); const p = window.state && window.state.profile; return !!(shell && shell.classList.contains('active') && p && /^[0-9a-f-]{36}$/i.test(String(p.id || ''))); });
async function login(page, base, email, pass) {
  await page.goto(base + '/index.html', { waitUntil: 'domcontentloaded', timeout: 45000 });
  const first = await until(async () => (await loggedIn(page)) ? 'in' : await page.evaluate(() => {
    const a = document.getElementById('authScreen'); if (a && getComputedStyle(a).display !== 'none') return 'auth';
    const l = document.getElementById('landingScreen'); if (l && getComputedStyle(l).display !== 'none' && l.offsetParent !== null) return 'landing';
    return null;
  }), 30000);
  if (first === 'landing') { await page.click('#landLoginLink').catch(() => {}); await until(() => page.evaluate(() => { const a = document.getElementById('authScreen'); return !!(a && getComputedStyle(a).display !== 'none'); }), 8000); }
  if (first !== 'in') {
    await page.type('#loginUser', email);
    await page.type('#loginPass', pass);
    await page.click('#loginSubmit');
  }
  return !!(await until(() => loggedIn(page), 30000));
}
async function newPage(browser) {
  const bctx = await browser.createBrowserContext();
  const page = await bctx.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  page.on('dialog', d => d.accept().catch(() => {}));
  return { bctx, page };
}
async function dismiss(page) {
  for (const sel of ['#btnAvatarGreetClose', '#closeFirstCheckinTutorialBtn', '#firstCheckinDoneBtn', '#btnCheckinAiClose']) {
    const vis = await page.evaluate((s) => { const el = document.querySelector(s); return !!(el && el.offsetParent !== null); }, sel).catch(() => false);
    if (vis) { await page.click(sel).catch(() => {}); await wait(400); }
  }
  const sheet = await page.evaluate(() => { const o = document.getElementById('modalOverlay'); return !!(o && o.classList.contains('active')); }).catch(() => false);
  if (sheet) { await page.keyboard.press('Escape').catch(() => {}); await wait(500); }
}
const newPushes = (from) => pushLog.slice(from).map(e => Object.assign({}, e, { at: undefined }));

(async () => {
  const runTag = 'ogtest-es397-' + new Date().toISOString().replace(/\D/g, '').slice(0, 12) + '-' + Math.random().toString(36).slice(2, 6);
  const { s, base } = await serve(APP);
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-first-run', '--no-default-browser-check', '--lang=ko-KR'] });
  const out = { label: LABEL, runTag, env: 'local 127.0.0.2 static + /api forwarded to production · test accounts A·B (addresses hidden)', steps: [], cleanup: null };
  const step = (name, ok, evidence) => { out.steps.push({ name, ok: !!ok, evidence }); console.log((ok ? '  ok · ' : '  실패 · ') + name + ' ' + JSON.stringify(evidence)); if (!ok) process.exitCode = 1; };
  let a = null;
  try {
    // B 로그인 → uid 만 읽고 닫는다(출력하지 않음)
    const b = await newPage(browser);
    const bOk = await login(b.page, base, env.OG_TEST_B_EMAIL.trim(), env.OG_TEST_B_PASSWORD);
    if (bOk) peerUid = await b.page.evaluate(() => String(window.state.profile.id));
    await b.page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch (e) {} }).catch(() => {});
    await b.bctx.close().catch(() => {});
    step('B 로그인(uid 읽기)', bOk && !!peerUid, { loggedIn: bOk });
    if (!peerUid) throw new Error('B 로그인 실패');

    a = await newPage(browser);
    const aOk = await login(a.page, base, env.OG_TEST_A_EMAIL.trim(), env.OG_TEST_A_PASSWORD);
    step('A 로그인', aOk, { loggedIn: aOk });
    if (!aOk) throw new Error('A 로그인 실패');
    await wait(2500); await dismiss(a.page);

    // ① 대화방 전송
    await a.page.click('.navbtn[data-tab="comm"]').catch(() => {}); await wait(1200); await dismiss(a.page);
    const opened = await a.page.evaluate((peer) => {
      window.state.dmActiveId = peer;
      const body = document.getElementById('commSubBody') || document.getElementById('commBody');
      window.OurgoalTeamInviteComm.renderCommDM(body);
      return !!document.getElementById('dmInput') && !!document.getElementById('dmSend');
    }, peerUid).catch((e) => String(e && e.message || e));
    step('① 대화방 열림(#dmInput·#dmSend)', opened === true, { opened });
    let from = pushLog.length;
    if (opened === true) {
      /* 대화방이 화면 밖(가려진 서브 화면)에 그려질 수 있어 좌표 클릭 대신 입력칸 값 + 진짜 전송 버튼의 click 이벤트로 send() 를 탄다 */
      await a.page.evaluate((t) => {
        const i = document.getElementById('dmInput'); i.value = t; i.dispatchEvent(new Event('input', { bubbles: true }));
        document.getElementById('dmSend').click();
      }, runTag + ' room');
      await until(async () => pushLog.slice(from).some(e => e.status !== null), 12000);
      await wait(800);
    }
    const roomPushes = newPushes(from);
    step('① 대화방 전송 → /api/push-dispatch 요청·응답', roomPushes.length > 0 && roomPushes.every(e => typeof e.status === 'number' && e.status >= 200 && e.status < 300), { count: roomPushes.length, requests: roomPushes });

    // ② 피드 공유 DM
    await dismiss(a.page);
    const prepared = await a.page.evaluate((peer, tag) => {
      const p = window.state.profile; p.companions = Array.isArray(p.companions) ? p.companions : [];
      const had = p.companions.some(c => String(c.id) === peer);
      if (!had) p.companions.push({ id: peer, nickname: 'ogtest-peer', name: 'ogtest-peer', avatar: '🌱' });
      window.__es397Added = !had;
      window.OurgoalTeamInviteComm.openFeedShareModal({ id: 'post_' + tag, action: tag + ' share', name: 'ogtest' });
      return { had, button: !!document.querySelector('[data-sharecompdm="' + peer + '"]') };
    }, peerUid, runTag).catch((e) => ({ error: String(e && e.message || e) }));
    step('② 공유 창 열림·B 전송 버튼', !!(prepared && prepared.button), { companionAlready: prepared && prepared.had, button: prepared && prepared.button, error: prepared && prepared.error || null });
    from = pushLog.length;
    if (prepared && prepared.button) {
      await a.page.evaluate((peer) => { const b = document.querySelector('[data-sharecompdm="' + peer + '"]'); if (b) b.click(); }, peerUid).catch(() => {});
      await until(async () => pushLog.slice(from).some(e => e.status !== null), 12000);
      await wait(800);
    }
    const sharePushes = newPushes(from);
    step('② 피드 공유 DM → /api/push-dispatch 요청·응답', sharePushes.length > 0 && sharePushes.every(e => typeof e.status === 'number' && e.status >= 200 && e.status < 300), { count: sharePushes.length, requests: sharePushes });
    // ③ 서버 쪽 확인: 로그인 세션 토큰을 붙이면 서버가 받는가(앱 코드와 무관하게 서버 인증만 잰다 — 방금 ①·② 로 실제 DM 행이 있는 상대에게만)
    from = pushLog.length;
    await a.page.evaluate(async (peer, tag) => {
      const s = await window.sb.auth.getSession(); const tok = s && s.data && s.data.session && s.data.session.access_token;
      if (!tok) return;
      await fetch('/api/push-dispatch', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + tok }, body: JSON.stringify({ targetUserId: peer, title: 'ogtest', body: tag + ' probe', url: '/#comm', tag: 'dm-probe' }) }).catch(() => {});
    }, peerUid, runTag).catch(() => {});
    await until(async () => pushLog.slice(from).some(e => e.status !== null), 12000);
    const probe = newPushes(from);
    out.probe = probe;
    console.log('  참고 · ③ 로그인 토큰을 붙인 직접 요청 ' + JSON.stringify(probe));
    await a.page.evaluate((peer) => {
      if (window.__es397Added) { const p = window.state.profile; p.companions = (p.companions || []).filter(c => String(c.id) !== peer); }
      if (window.closeModal) window.closeModal();
    }, peerUid).catch(() => {});
  } catch (e) {
    step('실행', false, { error: String(e && e.message || e).slice(0, 160) });
  } finally {
    if (a) {
      out.cleanup = await a.page.evaluate(async (tag) => {
        const sb = window.sb; const uid = window.state && window.state.profile && window.state.profile.id; if (!sb || !uid) return { error: 'sb·uid 없음' };
        const r = {};
        for (const t of ['team_ping_replies', 'team_pings']) {
          const d = await sb.from(t).delete().eq('sender_id', uid).ilike('message', '%' + tag + '%').select('id');
          const left = await sb.from(t).select('id', { count: 'exact', head: true }).eq('sender_id', uid).ilike('message', '%' + tag + '%');
          r[t] = { deleted: d.error ? null : (d.data || []).length, deleteError: d.error ? String(d.error.message).slice(0, 80) : null, left: left.error ? null : left.count };
        }
        try { localStorage.clear(); sessionStorage.clear(); } catch (e) {}
        return r;
      }, runTag).catch((e) => ({ error: String(e && e.message || e).slice(0, 120) }));
      console.log('  정리 ' + JSON.stringify(out.cleanup));
    }
    await browser.close().catch(() => {}); s.close();
    out.summary = { ok: out.steps.filter(x => x.ok).length, failed: out.steps.filter(x => !x.ok).length };
    if (OUT) { fs.mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true }); fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', 'utf8'); }
    console.log('[real-account-dm-push] ' + LABEL + ' ' + out.summary.ok + ' ok · ' + out.summary.failed + ' failed');
  }
})();
