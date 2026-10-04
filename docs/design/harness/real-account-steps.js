'use strict';
/* TASK-ES-355 실계정 하네스 — 시나리오 정의·재생 단계·정리.
 * 표 정본: real-account-scenarios.md (ID 가 같다). 이 파일은 표의 '자동' 행만 실제 클릭으로 재생하고, '수동' 행은 '못 함(수동)'으로 적는다.
 * 모든 확인은 화면(DOM)·건수로 하고, 만든 글에는 ctx.runTag 를 붙인다. 운영 사용자 데이터는 읽거나 바꾸지 않는다:
 *   - 검색 결과에서는 상대 테스트 계정 uid 의 버튼만 누르고, 다른 결과는 기록하지 않는다.
 *   - 서버 건수 확인은 작성자 = 테스트 계정으로 거른 건수만 센다(내용은 받지 않는다).
 */
const path = require('path');
const mock = require('./real-account-mock.js');

const CHROME = process.env.OG_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PUPPETEER = process.env.OG_PUPPETEER || 'C:/dev/command-center/node_modules/puppeteer-core';
/* mock 에서 재생하는 것: 클라이언트 배선만으로 뜻이 있는 자동 행. 빼는 것과 이유 —
 * RA-SET-01(가짜 서버는 다른 기기 세션 무효화를 흉내 내지 않음), RA-SET-03(옵트인), RA-COMM-04C(REST·공개 키), RA-COMM-04D(계정 C) */
const MOCK_SET = ['RA-CORE-LOGIN', 'RA-CORE-SWITCH', 'RA-REC-01', 'RA-REC-02', 'RA-GOALS-03', 'RA-COMM-03', 'RA-COMM-04A', 'RA-COMM-04B', 'RA-SET-02'];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- 공통 단계 ---------- */
async function openDevice(ctx, name, acc){
  const bctx = await ctx.browser.createBrowserContext();
  const page = await bctx.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  page.on('dialog', (d) => d.accept().catch(() => {}));
  if (ctx.mode === 'mock') await mock.prepareMockPage(page, ctx.mockServer);
  else {
    await page.setRequestInterception(true);
    page.on('request', (req) => (/pagead|googlesyndication|doubleclick/.test(req.url()) ? req.respond({ status: 204, body: '' }) : req.continue()));
  }
  const dev = { name, acc, bctx, page, uid: null, nick: null };
  ctx.devices[name] = dev;
  return dev;
}

async function closeDevice(ctx, name){
  const d = ctx.devices[name]; if (!d) return;
  delete ctx.devices[name];
  await d.bctx.close().catch(() => {});
}

const isEntered = (page) => page.evaluate(() => {
  const shell = document.getElementById('appShell'), auth = document.getElementById('authScreen');
  return !!(shell && shell.classList.contains('active')) && !(auth && getComputedStyle(auth).display !== 'none');
}).catch(() => false);
const isLanding = (page) => page.evaluate(() => { const l = document.getElementById('landingScreen'); return !!(l && getComputedStyle(l).display !== 'none' && l.offsetParent !== null); }).catch(() => false);
/* 앱에 들어가 있고 프로필 id 가 인증 UUID 일 때만 '로그인됨'(미리보기·게스트 화면은 로그인 아님) */
const loggedIn = async (page) => (await isEntered(page)) && /^[0-9a-f-]{36}$/i.test(((await readMe(page)) || {}).id || '');
const isAuthShown = (page) => page.evaluate(() => { const a = document.getElementById('authScreen'); return !!(a && getComputedStyle(a).display !== 'none'); }).catch(() => false);

async function waitUntil(fn, ms, every){
  const end = Date.now() + ms;
  while (Date.now() < end) { const v = await fn(); if (v) return v; await wait(every || 500); }
  return null;
}

/* 보이면 누른다(접힌 details 는 그 summary 를 진짜로 눌러 연다). 못 찾으면 false */
async function clickReal(page, sel, timeout){
  const found = await waitUntil(() => page.$(sel).then((h) => !!h), timeout || 8000, 300);
  if (!found) return false;
  for (let i = 0; i < 4; i++) {
    const closed = await page.evaluate((s) => {
      const el = document.querySelector(s); if (!el) return null;
      let d = el.parentElement && el.parentElement.closest('details:not([open])');
      if (!d) return null;
      const sum = d.querySelector(':scope > summary'); if (!sum) return null;
      if (!sum.id) sum.id = 'og-ra-sum-' + Math.random().toString(36).slice(2, 8);
      return '#' + sum.id;
    }, sel);
    if (!closed) break;
    await page.click(closed).catch(() => {}); await wait(300);
  }
  await page.evaluate((s) => { const el = document.querySelector(s); if (el) el.scrollIntoView({ block: 'center' }); }, sel);
  await wait(150);
  try { await page.click(sel); return true; } catch (e) { return false; }
}

async function dismissPopups(page){
  for (const sel of ['#btnAvatarGreetClose', '#closeFirstCheckinTutorialBtn', '#firstCheckinDoneBtn', '#btnCheckinAiClose']) {
    const vis = await page.evaluate((s) => { const el = document.querySelector(s); return !!(el && el.offsetParent !== null); }, sel).catch(() => false);
    if (vis) { await page.click(sel).catch(() => {}); await wait(500); }
  }
  const sheet = await page.evaluate(() => { const o = document.getElementById('modalOverlay'); return !!(o && o.classList.contains('active')); }).catch(() => false);
  if (sheet) { await page.keyboard.press('Escape').catch(() => {}); await wait(600); }
}

async function readMe(page){
  return page.evaluate(() => { const p = window.state && window.state.profile; return p ? { id: String(p.id || ''), nick: String(p.displayName || p.name || '') } : null; }).catch(() => null);
}

/* 이메일 로그인. 이미 세션이 살아 있으면 그대로 들어간다. */
async function login(ctx, dev){
  await dev.page.goto(ctx.base + '/index.html', { waitUntil: 'domcontentloaded', timeout: 45000 });
  let first = await waitUntil(async () => ((await loggedIn(dev.page)) ? 'in' : ((await isAuthShown(dev.page)) ? 'auth' : ((await isLanding(dev.page)) ? 'landing' : null))), 30000);
  if (first === 'landing') {
    await clickReal(dev.page, '#landLoginLink', 5000);
    first = (await waitUntil(() => isAuthShown(dev.page), 8000)) ? 'auth' : null;
  }
  if (first === 'auth') {
    await dev.page.click('#loginUser', { clickCount: 3 }).catch(() => {});
    await dev.page.type('#loginUser', dev.acc.email);
    await dev.page.type('#loginPass', dev.acc.password);
    await dev.page.click('#loginSubmit');
    const ok = await waitUntil(() => loggedIn(dev.page), 30000);
    if (!ok) {
      const err = await dev.page.$eval('#loginError', (e) => e.textContent).catch(() => '');
      return { ok: false, saw: '앱 진입 안 됨' + (err ? ' · 오류 글자: ' + err : '') };
    }
  } else if (!first) return { ok: false, saw: '로그인 화면·첫 화면·로그인된 앱 화면 중 어느 것도 30초 안에 안 보임' + ((await isEntered(dev.page)) ? '(로그인 안 된 미리보기·게스트 화면)' : '') };
  await wait(800); await dismissPopups(dev.page);
  const me = await readMe(dev.page);
  if (!me || !/^[0-9a-f-]{36}$/i.test(me.id)) return { ok: false, saw: 'state.profile.id 가 UUID 아님' };
  dev.uid = me.id; dev.nick = me.nick;
  ctx.uids[dev.acc.label] = me.id; ctx.nicks[dev.acc.label] = me.nick;
  return { ok: true };
}

async function ensureDevice(ctx, name, label){
  if (ctx.devices[name] && await loggedIn(ctx.devices[name].page)) return { ok: true, dev: ctx.devices[name] };
  if (ctx.devices[name]) await closeDevice(ctx, name);
  const dev = await openDevice(ctx, name, ctx.accounts[label]);
  const r = await login(ctx, dev);
  return Object.assign(r, { dev });
}

async function goTab(page, tab){
  for (let i = 0; i < 3; i++) {
    await dismissPopups(page); /* 체크인 뒤 늦게 뜨는 AI 피드백 시트·축하 창이 하단 탭을 덮는다 */
    await page.click('.navbtn[data-tab="' + tab + '"]').catch(() => {});
    await wait(700);
    const on = await page.evaluate((t) => { const b = document.querySelector('.navbtn[data-tab="' + t + '"]'); return !!(b && b.classList.contains('active')); }, tab).catch(() => false);
    if (on) return true;
  }
  return false;
}

const countText = (page, scope, text) => page.evaluate((s, t) => {
  return Array.from(document.querySelectorAll(s)).filter((el) => (el.textContent || '').includes(t)).length;
}, scope, text).catch(() => 0);

async function writeRecord(dev, text){
  await goTab(dev.page, 'home');
  if (!(await clickReal(dev.page, '#captureInput'))) return { ok: false, saw: '#captureInput 없음' };
  await dev.page.type('#captureInput', text);
  if (!(await clickReal(dev.page, '#captureSave'))) return { ok: false, saw: '#captureSave 없음' };
  await wait(2500); await dismissPopups(dev.page);
  return { ok: true };
}

async function findRecord(dev, text){
  await goTab(dev.page, 'records'); await wait(800);
  return countText(dev.page, '#recordsList .rec-card .rec-text', text);
}

async function reloadDevice(ctx, dev){
  await dev.page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
  const ok = await waitUntil(() => loggedIn(dev.page), 30000);
  if (ok) { await wait(800); await dismissPopups(dev.page); }
  return !!ok;
}

async function openCompanions(page){
  if (!(await goTab(page, 'comm'))) return false;
  return clickReal(page, '#commBody .comm-subtab[data-sub="companion"]');
}

async function companionListed(page, uid){
  return page.evaluate((u) => !!document.querySelector('#commSubBody [data-viewprof="' + u + '"], #commSubBody [data-directdm="' + u + '"]'), uid).catch(() => false);
}

async function addCompanion(dev, nick, uid){
  if (!(await openCompanions(dev.page))) return { ok: false, saw: '소통 > 동반자 서브탭 진입 실패' };
  /* 새 기기에서는 서버 동반자 목록이 늦게 그려진다 — 이미 동반자면(앞선 실행이 남긴 관계 포함) 검색 결과에서 빠지므로 목록 동기화를 잠깐 기다린 뒤 판단 */
  if (await waitUntil(() => companionListed(dev.page, uid), 8000)) return { ok: true, already: true };
  if (!(await clickReal(dev.page, '#companionNicknameSearchInput'))) return { ok: false, saw: '#companionNicknameSearchInput 없음' };
  await dev.page.type('#companionNicknameSearchInput', nick);
  const btn = 'button[data-addcomp="' + uid + '"]';
  const appeared = await waitUntil(() => dev.page.$(btn).then((h) => !!h), 12000);
  if (!appeared) return { ok: false, saw: '검색 결과에 상대 테스트 계정(uid 일치) 버튼 없음' };
  await dev.page.click(btn); await wait(2000);
  return { ok: true };
}

async function sendDm(dev, uid, text){
  if (!(await openCompanions(dev.page))) return { ok: false, saw: '동반자 서브탭 진입 실패' };
  if (!(await clickReal(dev.page, '#commSubBody [data-directdm="' + uid + '"]'))) return { ok: false, saw: '동반자 목록에 상대 DM 버튼 없음' };
  if (!(await clickReal(dev.page, '#dmInput'))) return { ok: false, saw: '#dmInput 없음' };
  await dev.page.type('#dmInput', text);
  if (!(await clickReal(dev.page, '#dmSend'))) return { ok: false, saw: '#dmSend 없음' };
  await wait(2500);
  return { ok: true };
}

/* 보낸 쪽 대화의 마지막 내 말풍선 상태 글자(1·읽음·도착) */
async function lastSentState(page, text){
  return page.evaluate((t) => {
    const rows = Array.from(document.querySelectorAll('#dmMsgs .dm-row.me')).filter((r) => (r.textContent || '').includes(t));
    const r = rows[rows.length - 1]; if (!r) return null;
    const bubble = r.querySelector('.dm-msg.me'); if (bubble) bubble.click();
    const box = r.querySelector('.dm-msg-detail-box') || document.querySelector('.dm-msg-detail-box');
    return { unread: !!r.querySelector('.dm-unread-badge'), read: !!r.querySelector('.dm-read-label'), detail: box ? (box.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 160) : '' };
  }, text).catch(() => null);
}

async function incomingDm(dev, fromUid, text, ms){
  return waitUntil(async () => {
    await goTab(dev.page, 'comm');
    await clickReal(dev.page, '#commBody .comm-subtab[data-sub="dm"]', 3000);
    if (!(await clickReal(dev.page, '#commSubBody .dm-list-item[data-open="' + fromUid + '"]', 3000))) return null;
    await wait(1200);
    const n = await countText(dev.page, '#dmMsgs .dm-msg.them', text);
    return n > 0 ? n : null;
  }, ms, 4000);
}

/* 서버 건수(작성자 = 테스트 계정으로 거른 것만, 내용은 받지 않음) — 테스트 계정 로그인 세션으로 */
async function ownedCount(page, table, filters){
  return page.evaluate(async (t, f) => {
    const sb = window.sb; if (!sb) return { error: 'window.sb 없음' };
    let q = sb.from(t).select('id', { count: 'exact', head: true });
    f.forEach(([m, k, v]) => { q = q[m](k, v); });
    const r = await q; return r.error ? { error: r.error.message } : { count: r.count };
  }, table, filters).catch((e) => ({ error: String(e && e.message || e) }));
}

/* 공개 키(anon) 건수 — 작성자 = A 로 걸러 건수만. 주소·키는 앱 페이지에서 읽는다(파일에 쓰지 않음). */
async function anonCount(ctx, table, column, uid){
  if (ctx.mode === 'mock') return { error: 'mock 모드는 REST 없음' };
  const html = await (await fetch(ctx.base + '/index.html')).text();
  const url = (html.match(/SUPABASE_URL\s*=\s*'([^']+)'/) || [])[1];
  const key = (html.match(/SUPABASE_ANON_KEY\s*=\s*'([^']+)'/) || [])[1];
  if (!url || !key) return { error: '앱 페이지에서 공개 주소·키를 못 찾음' };
  const r = await fetch(url + '/rest/v1/' + table + '?select=id&' + column + '=eq.' + encodeURIComponent(uid), { headers: { apikey: key, Authorization: 'Bearer ' + key, Prefer: 'count=exact', Range: '0-0' } });
  const cr = r.headers.get('content-range') || '';
  const total = Number((cr.split('/')[1] || '').replace('*', '')) || 0;
  return { http: r.status, count: cr ? total : null };
}

/* ---------- 시나리오 ---------- */
const S = [];
const auto = (id, tab, source, needs, run) => S.push({ id, tab, source, needs, auto: true, run });
const manual = (id, tab, source, reason) => S.push({ id, tab, source, auto: false, manualReason: reason });

auto('RA-CORE-LOGIN', '공통', 'CORE-02 전제', ['A', 'B'], async (ctx, ev) => {
  for (const [name, label] of [['A1', 'A'], ['B1', 'B']]) {
    const r = await ensureDevice(ctx, name, label);
    if (!r.ok) return { fail: name + ' 로그인', saw: r.saw };
  }
  ev.distinct = ctx.uids.A !== ctx.uids.B;
  if (!ev.distinct) return { fail: 'A·B uid 비교', saw: '같은 uid' };
  return {};
});

auto('RA-CORE-SWITCH', '공통', '#655 TASK-ES-345 C2(일반화)', ['A', 'B'], async (ctx, ev) => {
  const r = await ensureDevice(ctx, 'S1', 'A'); if (!r.ok) return { fail: 'S1 A 로그인', saw: r.saw };
  const text = ctx.runTag + ' switch';
  const w = await writeRecord(r.dev, text); if (!w.ok) return { fail: 'A 기록 저장', saw: w.saw };
  ctx.made.push({ by: 'A', table: 'checkins', what: text });
  await goTab(r.dev.page, 'settings');
  if (!(await clickReal(r.dev.page, '#logoutBtn'))) return { fail: 'A 로그아웃 버튼', saw: '#logoutBtn 없음' };
  if (!(await waitUntil(() => isAuthShown(r.dev.page), 15000))) return { fail: 'A 로그아웃', saw: '로그인 화면이 안 보임' };
  r.dev.acc = ctx.accounts.B;
  const l = await login(ctx, r.dev); if (!l.ok) return { fail: '같은 브라우저 B 로그인', saw: l.saw };
  ev.profileIsB = r.dev.uid === ctx.uids.B;
  ev.aTextOnB = await findRecord(r.dev, text);
  await closeDevice(ctx, 'S1');
  if (!ev.profileIsB) return { fail: 'B 프로필 id', saw: 'A 와 같은 id' };
  if (ev.aTextOnB) return { fail: 'B 기록 탭', saw: 'A 의 표식 기록 ' + ev.aTextOnB + '건 보임' };
  return {};
});

auto('RA-REC-01', '기록', '#654 TASK-ES-344 C8 · #663 TASK-ES-353 C19', ['A'], async (ctx, ev) => {
  const a1 = await ensureDevice(ctx, 'A1', 'A'); if (!a1.ok) return { fail: 'A1 로그인', saw: a1.saw };
  const text = ctx.runTag + ' rec01';
  const w = await writeRecord(a1.dev, text); if (!w.ok) return { fail: 'A1 기록 저장', saw: w.saw };
  ctx.made.push({ by: 'A', table: 'checkins', what: text });
  ev.onA1 = await findRecord(a1.dev, text);
  if (!ev.onA1) return { fail: 'A1 기록 탭', saw: '저장한 기기에서도 안 보임' };
  const a2 = await ensureDevice(ctx, 'A2', 'A'); if (!a2.ok) return { fail: 'A2 로그인', saw: a2.saw };
  ev.onA2 = await findRecord(a2.dev, text);
  if (!ev.onA2) return { fail: 'A2 기록 탭', saw: '다른 기기에서 표식 기록 0건' };
  return {};
});

auto('RA-REC-02', '기록', '#663 TASK-ES-353 C19', ['A'], async (ctx, ev) => {
  const a1 = await ensureDevice(ctx, 'A1', 'A'); if (!a1.ok) return { fail: 'A1 로그인', saw: a1.saw };
  const a2 = await ensureDevice(ctx, 'A2', 'A'); if (!a2.ok) return { fail: 'A2 로그인', saw: a2.saw };
  await goTab(a2.dev.page, 'records');
  const text = ctx.runTag + ' rec02';
  const w = await writeRecord(a1.dev, text); if (!w.ok) return { fail: 'A1 기록 저장', saw: w.saw };
  ctx.made.push({ by: 'A', table: 'checkins', what: text });
  ev.liveWithin20s = !!(await waitUntil(() => findRecord(a2.dev, text), 20000, 2000));
  if (!ev.liveWithin20s) { await reloadDevice(ctx, a2.dev); ev.afterReload = await findRecord(a2.dev, text); }
  if (!ev.liveWithin20s && !ev.afterReload) return { fail: 'A2 반영', saw: '20초 대기·새로고침 뒤에도 0건' };
  return {};
});

manual('RA-REC-03', '기록', '#654 TASK-ES-344 C4·C8', 'checkins-meta SQL 적용 여부 확인·스톱워치 구간 조작이 필요 — 표의 사람 절차');
manual('RA-CAL-01', '일정', '#655 TASK-ES-345 C1·C12', '구글 OAuth 외부 화면');
manual('RA-CAL-02', '일정', '#655 TASK-ES-345 C2', '구글 OAuth 외부 화면');
manual('RA-CAL-03', '일정', '#655 TASK-ES-345 C3·C5', '외부 화면·토큰 1시간 만료 대기');

auto('RA-GOALS-03', '목표', '노션 GOALS-03', ['A'], async (ctx, ev) => {
  const a1 = await ensureDevice(ctx, 'A1', 'A'); if (!a1.ok) return { fail: 'A1 로그인', saw: a1.saw };
  const title = ctx.runTag + ' goal';
  await goTab(a1.dev.page, 'home'); await wait(600);
  if (!(await clickReal(a1.dev.page, '#homeAddGoal'))) return { fail: '새 목표 열기', saw: '#homeAddGoal 없음' };
  if (!(await clickReal(a1.dev.page, '#ngManualBtn'))) return { fail: '직접 설정', saw: '#ngManualBtn 없음' };
  if (!(await clickReal(a1.dev.page, '#mGoalTitle'))) return { fail: '목표 제목', saw: '#mGoalTitle 없음' };
  await a1.dev.page.type('#mGoalTitle', title);
  await a1.dev.page.select('#mGoalVis', 'private').catch(() => {}); /* 운영 사용자에게 노출되지 않게 나만 보기 */
  if (!(await clickReal(a1.dev.page, '#mSave'))) return { fail: '목표 저장', saw: '#mSave 없음' };
  await wait(2500); await dismissPopups(a1.dev.page);
  ctx.made.push({ by: 'A', table: 'goals', what: title });
  const a2 = await ensureDevice(ctx, 'A2', 'A'); if (!a2.ok) return { fail: 'A2 로그인', saw: a2.saw };
  await reloadDevice(ctx, a2.dev);
  await goTab(a2.dev.page, 'goals'); await wait(1000);
  ev.onA2 = await countText(a2.dev.page, '#screen-goals *:not(script)', title) > 0;
  if (!ev.onA2) return { fail: 'A2 목표 탭', saw: '다른 기기에서 표식 목표 제목 0건' };
  return {};
});
manual('RA-GOALS-03R', '목표', '노션 GOALS-03(루틴)', '루틴 원장 통일(GOALS-03 구현) 전');
manual('RA-GOALS-14', '목표', '노션 GOALS-14', '기능 구현 전(티켓 대기)');
manual('RA-GOALS-16', '목표', '노션 GOALS-16', '기능 구현 전(티켓 대기)');
manual('RA-GOALS-17', '목표', '노션 GOALS-17', '기능 구현 전 · 계정 3개');
manual('RA-GOALS-18', '목표', '노션 GOALS-18', '기능 구현 전(티켓 대기)');
manual('RA-GOALS-19', '목표', '노션 GOALS-19', 'B 쪽 노출 화면 미정(GOALS-19 구현 뒤 자동화)');

auto('RA-COMM-03', '소통', '노션 COMM-03', ['A', 'B'], async (ctx, ev) => {
  const a1 = await ensureDevice(ctx, 'A1', 'A'); if (!a1.ok) return { fail: 'A1 로그인', saw: a1.saw };
  if (!ctx.uids.B) { const b = await ensureDevice(ctx, 'B1', 'B'); if (!b.ok) return { fail: 'B1 로그인', saw: b.saw }; }
  const r = await addCompanion(a1.dev, ctx.nicks.B, ctx.uids.B); if (!r.ok) return { fail: 'A 가 B 추가', saw: r.saw };
  if (!r.already) ctx.made.push({ by: 'A', table: 'users.companions', what: 'B' });
  ev.already = !!r.already;
  await openCompanions(a1.dev.page); ev.listedNow = await companionListed(a1.dev.page, ctx.uids.B);
  await reloadDevice(ctx, a1.dev); await openCompanions(a1.dev.page); ev.afterReload = await companionListed(a1.dev.page, ctx.uids.B);
  const a2 = await ensureDevice(ctx, 'A2', 'A');
  /* #TASK-ES-366: 다른 기기는 서버(/api/track sync_companions) 응답이 온 뒤 다시 그린다 — 기대값(B 가 보임)은 같고, 비동기 응답을 최대 12초 기다린다 */
  if (a2.ok) { await reloadDevice(ctx, a2.dev); await openCompanions(a2.dev.page); ev.otherDevice = !!(await waitUntil(() => companionListed(a2.dev.page, ctx.uids.B), 12000, 500)); }
  if (!ev.listedNow) return { fail: '추가 직후 목록', saw: 'B 없음' };
  if (!ev.afterReload) return { fail: '새로고침 뒤 목록', saw: 'B 없음' };
  if (!ev.otherDevice) return { fail: '다른 기기 목록', saw: 'B 없음' };
  return {};
});

auto('RA-COMM-04A', '소통', '노션 COMM-04 · #656 TASK-ES-347 C8', ['A', 'B'], async (ctx, ev) => {
  const a1 = await ensureDevice(ctx, 'A1', 'A'); if (!a1.ok) return { fail: 'A1 로그인', saw: a1.saw };
  const b1 = await ensureDevice(ctx, 'B1', 'B'); if (!b1.ok) return { fail: 'B1 로그인', saw: b1.saw };
  const text = ctx.runTag + ' dm-a';
  const s = await sendDm(a1.dev, ctx.uids.B, text); if (!s.ok) return { fail: 'A DM 전송', saw: s.saw };
  ctx.made.push({ by: 'A', table: 'team_ping_replies', what: text });
  ctx.dmSent = true;
  ev.arrivedOnB = await incomingDm(b1.dev, ctx.uids.A, text, 45000);
  if (!ev.arrivedOnB) return { fail: 'B 대화', saw: '45초 안에 B 화면에 A 의 표식 메시지 0건' };
  return {};
});

auto('RA-COMM-04B', '소통', '노션 COMM-04 완료 기준', ['A', 'B'], async (ctx, ev) => {
  const a1 = await ensureDevice(ctx, 'A1', 'A'); if (!a1.ok) return { fail: 'A1 로그인', saw: a1.saw };
  await closeDevice(ctx, 'B1');
  const text = ctx.runTag + ' dm-b';
  const s = await sendDm(a1.dev, ctx.uids.B, text); if (!s.ok) return { fail: 'A DM 전송(B 꺼짐)', saw: s.saw };
  ctx.made.push({ by: 'A', table: 'team_ping_replies', what: text });
  ev.whileBOff = await lastSentState(a1.dev.page, text);
  const b1 = await ensureDevice(ctx, 'B1', 'B'); if (!b1.ok) return { fail: 'B1 다시 로그인', saw: b1.saw };
  ev.bOpened = !!(await incomingDm(b1.dev, ctx.uids.A, text, 45000));
  await wait(3000);
  await reloadDevice(ctx, a1.dev);
  await sendDmOpenOnly(a1.dev, ctx.uids.B);
  ev.afterBOpened = await lastSentState(a1.dev.page, text);
  const offDelivered = !!(ev.whileBOff && /도착/.test(ev.whileBOff.detail));
  if (offDelivered) return { fail: 'B 꺼짐 동안 도착 표시', saw: '도착 글자가 이미 있음: ' + ev.whileBOff.detail };
  if (!ev.bOpened) return { fail: 'B 가 대화 열기', saw: 'B 화면에 메시지 없음' };
  if (!(ev.afterBOpened && ev.afterBOpened.read)) return { fail: 'B 열람 뒤 읽음', saw: JSON.stringify(ev.afterBOpened) };
  return {};
});
async function sendDmOpenOnly(dev, uid){ await openCompanions(dev.page); await clickReal(dev.page, '#commSubBody [data-directdm="' + uid + '"]'); await wait(2000); }

auto('RA-COMM-04C', '소통', '#656 TASK-ES-347 C7', ['A'], async (ctx, ev) => {
  if (!ctx.uids.A) return { cannot: 'A uid 모름(로그인 시나리오 실패)' };
  if (!ctx.dmSent) return { cannot: 'A 가 보낸 DM 이 없음(RA-COMM-04A 선행)' };
  ev.team_pings = await anonCount(ctx, 'team_pings', 'sender_id', ctx.uids.A);
  ev.team_ping_replies = await anonCount(ctx, 'team_ping_replies', 'sender_id', ctx.uids.A);
  if (ev.team_pings.error || ev.team_ping_replies.error) return { cannot: ev.team_pings.error || ev.team_ping_replies.error };
  if (ev.team_pings.count !== 0 || ev.team_ping_replies.count !== 0) return { fail: '공개 키 조회', saw: 'A 작성 행이 공개 키로 ' + ev.team_pings.count + '·' + ev.team_ping_replies.count + '건' };
  return {};
});

auto('RA-COMM-04D', '소통', '#656 TASK-ES-347 C8', ['A', 'B', 'C'], async (ctx, ev) => {
  if (!ctx.accounts.C) return { cannot: '계정 C 없음' };
  const c1 = await ensureDevice(ctx, 'C1', 'C'); if (!c1.ok) return { fail: 'C1 로그인', saw: c1.saw };
  const a1 = await ensureDevice(ctx, 'A1', 'A'); if (!a1.ok) return { fail: 'A1 로그인', saw: a1.saw };
  const r = await addCompanion(a1.dev, ctx.nicks.C, ctx.uids.C); if (!r.ok) return { fail: 'A 가 C 추가', saw: r.saw };
  if (!r.already) ctx.made.push({ by: 'A', table: 'users.companions', what: 'C' });
  const text = ctx.runTag + ' dm-c';
  const s = await sendDm(a1.dev, ctx.uids.C, text); if (!s.ok) return { fail: 'A→C DM', saw: s.saw };
  ctx.made.push({ by: 'A', table: 'team_ping_replies', what: text });
  const b1 = await ensureDevice(ctx, 'B1', 'B'); if (!b1.ok) return { fail: 'B1 로그인', saw: b1.saw };
  ev.bSeesAtoC = await ownedCount(b1.dev.page, 'team_ping_replies', [['eq', 'sender_id', ctx.uids.A], ['eq', 'receiver_id', ctx.uids.C]]);
  if (ev.bSeesAtoC.error) return { cannot: 'B 세션 건수 조회 실패: ' + ev.bSeesAtoC.error };
  if (ev.bSeesAtoC.count !== 0) return { fail: 'B 세션으로 A→C 조회', saw: ev.bSeesAtoC.count + '건' };
  return {};
});

manual('RA-COMM-01', '소통', '#659 TASK-ES-348 C4·C14', "B 닉네임을 '민지'로 바꾸면 검색에 운영 사용자가 섞임 — 사람이 B 만 고른다");
manual('RA-COMM-05', '소통', '#661 TASK-ES-352 C6·C12', 'A 첫 체크인은 계정당 1번 · 피드 공개 게시 필요');
manual('RA-COMM-11', '소통', '노션 COMM-11', '세션 없는 로그인 경로(하네스는 이메일 로그인만)');

auto('RA-SET-02', '설정', '#658 TASK-ES-346 C4 · #662 TASK-ES-351 C17', ['A'], async (ctx, ev) => {
  const a1 = await ensureDevice(ctx, 'A1', 'A'); if (!a1.ok) return { fail: 'A1 로그인', saw: a1.saw };
  await goTab(a1.dev.page, 'settings');
  if (!(await clickReal(a1.dev.page, '#withdrawBtn'))) return { fail: '회원 탈퇴 버튼', saw: '#withdrawBtn 없음' };
  const t = await waitUntil(() => a1.dev.page.$eval('#withdrawModal', (e) => e.textContent).catch(() => null), 8000);
  ev.has30 = !!(t && t.includes('30일이 지나면'));
  ev.hasBox3 = !!(t && t.includes('데이터 삭제(파기) 현황과 요청 방법'));
  await clickReal(a1.dev.page, '#withdrawCancelBtn', 3000); await wait(800);
  if (!t) return { fail: '탈퇴 창', saw: '#withdrawModal 안 열림' };
  if (!ev.has30 || !ev.hasBox3) return { fail: '탈퇴 창 글자', saw: '30일 문구 ' + ev.has30 + ' · 3번 제목 ' + ev.hasBox3 };
  return {};
});

auto('RA-SET-03', '설정', '#662 TASK-ES-351 C4', ['A'], async (ctx, ev) => {
  if (!ctx.args.includeWithdraw) return { cannot: '옵트인(--include-withdraw) 아님' };
  const w = await ensureDevice(ctx, 'W1', 'A'); if (!w.ok) return { fail: 'W1 로그인', saw: w.saw };
  await goTab(w.dev.page, 'settings');
  if (!(await clickReal(w.dev.page, '#withdrawBtn'))) return { fail: '회원 탈퇴 버튼', saw: '#withdrawBtn 없음' };
  await clickReal(w.dev.page, '#withdrawAgreeCheck');
  if (!(await clickReal(w.dev.page, '#withdrawConfirmBtn'))) return { fail: '탈퇴 신청', saw: '#withdrawConfirmBtn 못 누름' };
  ctx.made.push({ by: 'A', table: 'auth.app_metadata', what: 'deletion_requested_at(복구로 지움)' });
  ev.loggedOut = !!(await waitUntil(() => isAuthShown(w.dev.page), 20000));
  await closeDevice(ctx, 'W1');
  const r = await openDevice(ctx, 'W2', ctx.accounts.A);
  await r.page.goto(ctx.base + '/index.html', { waitUntil: 'domcontentloaded' });
  await waitUntil(() => isAuthShown(r.page), 20000);
  await r.page.type('#loginUser', ctx.accounts.A.email); await r.page.type('#loginPass', ctx.accounts.A.password); await r.page.click('#loginSubmit');
  ev.restoreShown = !!(await waitUntil(() => r.page.$('#btnRestoreAccount').then((h) => !!h), 20000));
  if (!ev.restoreShown) return { fail: '다른 기기 복구 창', saw: '#btnRestoreAccount 안 보임 — 계정이 탈퇴 신청 상태로 남았을 수 있음(대시보드 확인 필요)' };
  await r.page.click('#btnRestoreAccount');
  ev.enteredAfterRestore = !!(await waitUntil(() => isEntered(r.page), 20000));
  if (ev.enteredAfterRestore) ctx.made.push({ by: 'A', table: 'auth.app_metadata', what: '복구 완료', cleaned: true });
  await closeDevice(ctx, 'W2');
  const again = await ensureDevice(ctx, 'W3', 'A');
  ev.restoreAgain = !!(await again.dev.page.$('#btnRestoreAccount'));
  await closeDevice(ctx, 'W3');
  if (!ev.enteredAfterRestore) return { fail: '복구 뒤 앱 진입', saw: '진입 안 됨' };
  if (ev.restoreAgain) return { fail: '재로그인', saw: '복구 창이 또 뜸(서버 기록 안 지워짐)' };
  return {};
});

auto('RA-SET-01', '설정', '#658 TASK-ES-346 C14', ['A'], async (ctx, ev) => {
  const a1 = await ensureDevice(ctx, 'A1', 'A'); if (!a1.ok) return { fail: 'A1 로그인', saw: a1.saw };
  const a2 = await ensureDevice(ctx, 'A2', 'A'); if (!a2.ok) return { fail: 'A2 로그인', saw: a2.saw };
  await wait(65000); /* 로그인 60초 안의 기기는 원격 로그아웃 검사를 건너뛴다(index.html checkRemoteSessionRevoked) */
  await goTab(a1.dev.page, 'settings');
  if (!(await clickReal(a1.dev.page, '#logoutOtherDevicesBtn'))) return { fail: '다른 기기 로그아웃 버튼', saw: '#logoutOtherDevicesBtn 없음' };
  if (!(await clickReal(a1.dev.page, '#btnConfirmLogoutOtherModal'))) return { fail: '확인 버튼', saw: '#btnConfirmLogoutOtherModal 없음' };
  await wait(3000);
  ev.a2Out = !!(await waitUntil(async () => { await a2.dev.page.bringToFront().catch(() => {}); return isAuthShown(a2.dev.page); }, 25000, 2000));
  if (!ev.a2Out) { await a2.dev.page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {}); ev.a2OutAfterReload = !!(await waitUntil(() => isAuthShown(a2.dev.page), 20000)); }
  ev.a1Stays = await isEntered(a1.dev.page);
  if (!ev.a2Out && !ev.a2OutAfterReload) return { fail: '기기 2 로그아웃', saw: '25초·새로고침 뒤에도 로그인 상태' };
  if (!ev.a1Stays) return { fail: '기기 1 유지', saw: '기기 1 도 로그인 화면' };
  return {};
});

manual('RA-SET-04', '설정', '#662 TASK-ES-351 C13·C21', '서버 SQL · 되돌릴 수 없는 파기 — 그때 [결심 필요]');
manual('RA-SET-05', '설정', '#662 TASK-ES-351 C4 후속', '시각 이동은 SQL');

/* 재생 순서: 원격 로그아웃(RA-SET-01)은 다른 기기를 끊으므로 맨 끝 */
const ORDER = ['RA-CORE-LOGIN', 'RA-CORE-SWITCH', 'RA-REC-01', 'RA-REC-02', 'RA-GOALS-03', 'RA-COMM-03', 'RA-COMM-04A', 'RA-COMM-04B', 'RA-COMM-04C', 'RA-COMM-04D', 'RA-SET-02', 'RA-SET-03', 'RA-SET-01'];
const SCENARIOS = ORDER.map((id) => S.find((s) => s.id === id)).concat(S.filter((s) => !ORDER.includes(s.id)));

async function runScenario(ctx, sc){
  const base = { id: sc.id, tab: sc.tab, source: sc.source };
  if (!sc.auto) return Object.assign(base, { status: '못 함', failedStep: { step: 'manual', saw: '수동 — ' + sc.manualReason }, manual: 'real-account-scenarios.md 의 ' + sc.id + ' 행' });
  if (ctx.mode === 'mock' && !MOCK_SET.includes(sc.id)) return Object.assign(base, { status: '못 함', failedStep: { step: 'mock', saw: 'mock 모드는 배선 점검 ' + MOCK_SET.join('·') + ' 만 재생' } });
  const ev = {}; const t0 = Date.now();
  let out;
  try { out = await sc.run(ctx, ev); } catch (e) { out = { fail: 'exception', saw: String(e && e.message || e).slice(0, 200) }; }
  const r = Object.assign(base, { ms: Date.now() - t0, evidence: ev });
  if (out.cannot) return Object.assign(r, { status: '못 함', failedStep: { step: 'precondition', saw: out.cannot } });
  if (out.fail) return Object.assign(r, { status: '실패', failedStep: { step: out.fail, saw: out.saw } });
  return Object.assign(r, { status: '통과' });
}

/* ---------- 정리: runTag 가 붙은 자기 행만 지운다 ---------- */
const CLEAN = [
  { table: 'checkins', col: 'text', owner: 'user_id' },
  { table: 'goals', col: 'title', owner: 'user_id' },
  { table: 'team_ping_replies', col: 'message', owner: 'sender_id' },
  { table: 'team_pings', col: 'message', owner: 'sender_id' }
];
async function cleanup(ctx){
  const log = ctx.cleanupLog;
  for (const label of Object.keys(ctx.accounts)) {
    if (!ctx.uids[label]) continue;
    let r; try { r = await ensureDevice(ctx, 'CLEAN-' + label, label); } catch (e) { r = { ok: false, saw: String(e.message || e) }; }
    if (!r.ok) { log.leftover.push({ by: label, reason: '정리용 로그인 실패: ' + r.saw }); continue; }
    const page = r.dev.page;
    /* 동반자로 추가한 테스트 상대는 목록에서 뺀다(화면의 삭제 버튼) */
    for (const peer of ['B', 'C']) {
      /* 테스트 계정끼리의 관계라 이번 실행이 만들지 않았어도(앞선 실행이 남긴 관계) 지운다 */
      if (label !== 'A' || !ctx.uids[peer]) continue;
      await openCompanions(page);
      if (!(await waitUntil(() => companionListed(page, ctx.uids[peer]), 8000))) continue;
      await openCompanions(page);
      const ok = await clickReal(page, '#commSubBody [data-delcomp="' + ctx.uids[peer] + '"]', 4000); await wait(800);
      /* #TASK-ES-374/376 이후 삭제 확인은 브라우저 기본 dialog 가 아니라 앱 바텀시트 — 뜨면 [확인]을 누른다 */
      try { await clickReal(page, '#modalOverlay.active #btnSheetConfirmOk', 2500); } catch (e) { /* 기본 dialog 경로면 위 page.on('dialog') 가 이미 수락 */ }
      await wait(1200);
      await openCompanions(page); const still = await companionListed(page, ctx.uids[peer]);
      (ok && !still ? log.deleted : log.leftover).push({ by: label, table: 'users.companions', what: peer, how: '화면 삭제 버튼' });
    }
    for (const c of CLEAN) {
      const res = await page.evaluate(async (t, col, owner, uid, tag) => {
        const sb = window.sb; if (!sb) return { error: 'window.sb 없음' };
        const d = await sb.from(t).delete().eq(owner, uid).ilike(col, '%' + tag + '%').select('id');
        const left = await sb.from(t).select('id', { count: 'exact', head: true }).eq(owner, uid).ilike(col, '%' + tag + '%');
        return { deleted: d.error ? null : (d.data || []).length, deleteError: d.error ? d.error.message : null, left: left.error ? null : left.count, leftError: left.error ? left.error.message : null };
      }, c.table, c.col, c.owner, ctx.uids[label], ctx.runTag).catch((e) => ({ error: String(e.message || e) }));
      if (res.error) { log.leftover.push({ by: label, table: c.table, reason: res.error }); continue; }
      if (res.deleted) log.deleted.push({ by: label, table: c.table, rows: res.deleted });
      if (res.left) log.leftover.push({ by: label, table: c.table, rows: res.left, reason: res.deleteError || '삭제 뒤에도 남음(RLS 로 삭제 불가일 수 있음)' });
      else if (res.left === null) log.leftover.push({ by: label, table: c.table, reason: '남은 건수 확인 실패: ' + (res.leftError || '') });
    }
    /* 이 브라우저의 로컬 사본이 다시 서버로 올라가지 않도록 저장소를 비우고 닫는다 */
    await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch (e) {} }).catch(() => {});
    await closeDevice(ctx, 'CLEAN-' + label);
  }
  log.madeDuringRun = ctx.made;
}

async function closeAll(ctx){
  for (const n of Object.keys(ctx.devices)) {
    await ctx.devices[n].page.evaluate(() => { try { localStorage.clear(); } catch (e) {} }).catch(() => {});
    await closeDevice(ctx, n);
  }
  if (ctx.browser) await ctx.browser.close().catch(() => {});
  if (ctx.server) ctx.server.close();
}

/* ---------- 컨텍스트 ---------- */
function baseCtx(mode, runTag, args){
  return { mode, runTag, args, startedAt: new Date().toISOString(), devices: {}, uids: {}, nicks: {}, made: [], dmSent: false, cleanupLog: { deleted: [], leftover: [] } };
}
async function launch(args){
  const puppeteer = require(PUPPETEER);
  const extra = args.mockHost ? ['--host-resolver-rules=MAP ' + args.mockHost + ' 127.0.0.1'] : [];
  return puppeteer.launch({ executablePath: CHROME, headless: !args.headful, args: ['--no-first-run', '--no-default-browser-check'].concat(extra) });
}
async function liveContext(base, accounts, runTag, args){
  const ctx = Object.assign(baseCtx('live', runTag, args), { base, accounts });
  ctx.browser = await launch(args);
  return ctx;
}
async function mockContext(appDir, runTag, args){
  const ctx = Object.assign(baseCtx('mock', runTag, args), { accounts: { A: mock.MOCK_ACCOUNTS.A, B: mock.MOCK_ACCOUNTS.B } });
  ctx.mockServer = mock.createMockServer();
  ctx.server = await mock.serveStatic(path.resolve(appDir));
  /* 127.0.0.1·localhost 는 앱이 미리보기(게스트 자동 입장)로 여므로, 다른 이름을 로컬로 돌려 실제 첫 화면→로그인 경로를 탄다 */
  ctx.base = 'http://' + mock.MOCK_HOST + ':' + ctx.server.address().port;
  ctx.browser = await launch(Object.assign({}, args, { mockHost: mock.MOCK_HOST }));
  return ctx;
}

module.exports = { SCENARIOS, MOCK_SET, runScenario, cleanup, closeAll, liveContext, mockContext };
