'use strict';
// saveGoogleToken 직접 호출 실측(작업자 측정, 판정 아님): 기준 트리와 작업 트리를 각각 법정의 브라우저·정적 서버(court/lib/* 읽기 전용)로 띄워
// 게스트로 부팅이 끝난 뒤, 가짜 토큰 객체로 saveGoogleToken 을 인자 수를 바꿔 가며 부르고(통로 L.saveGoogleToken · window.saveGoogleToken 양쪽),
// 그때마다 localStorage · sessionStorage · state 의 결과를 읽어 기준과 작업을 맞댄다. 둘째 인자(arguments[1])가 그대로 읽히는지가 핵심이다.
// 쓰는 곳은 이 탐침이 띄운 임시 브라우저의 저장소뿐이다(외부 통신 0 — 법정 브라우저가 막는다). 끝에 넣은 키·바꾼 state 를 되돌리고 되돌려졌는지 적는다.
// 진짜 구글 로그인으로 받은 토큰이 이 함수에 들어오는 길(연동 버튼 → 구글 동의 창 → 토큰 수신)은 재지 못한다 — 그것은 주장 파일의 「확인 못 함」 칸에 따로 적는다.
// 사용: node save-token-probe.cjs <법정 코드가 든 트리> <기준 트리> <작업 트리> <out.json>
const fs = require('fs'), path = require('path');
const [ROOT, BASE, WORK, OUT] = process.argv.slice(2);
const C = p => require(path.resolve(ROOT, 'court', 'lib', p));
const { launch, sleep } = C('chrome.js');
const server = C('static-server.js');
const siteHost = C('site-host.js');
const cfg = JSON.parse(fs.readFileSync(path.resolve(ROOT, 'court', 'config.json'), 'utf8'));

function pageProbe() {
  var S = window.OurgoalAppScope, L = S.scope, st = L.state, FAR = 4102444800000;
  var LEG = ['ourgoal_gcal_token_v1_last', 'ourgoal_gcal_email_last', 'ourgoal_gcal_events', 'ourgoal_google_token'];
  var keys = function () { var ks = []; for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k.indexOf('ourgoal_gcal') === 0 || k === 'ourgoal_google_token') ks.push(k); } return ks.sort(); };
  var tok = function (uid) {
    var raw = localStorage.getItem('ourgoal_gcal_token_v1_' + uid); if (raw == null) return null;
    var j = JSON.parse(raw), now = Date.now();
    return { keys: Object.keys(j), accessToken: j.accessToken, email: j.email, ownerUid: j.ownerUid,
      expiresAt: j.expiresAt === FAR ? 'given' : (Math.abs(j.expiresAt - (now + 3300000)) < 60000 ? 'default(now+3300000)' : 'other'),
      updatedAtRecent: typeof j.updatedAt === 'number' && Math.abs(now - j.updatedAt) < 60000 };
  };
  var stView = function () { return { owner: st._gcalOwnerUid, cacheIsNull: st.gcalEventsCache === null, lastExpiredIsNull: st._lastExpiredGoogleToken === null }; };
  var saved = { profile: st.profile, owner: st._gcalOwnerUid, cache: st.gcalEventsCache, lastExp: st._lastExpiredGoogleToken, ss: sessionStorage.getItem('ourgoal_google_token') };
  var before = keys(), uid0 = L.gcalCurrentUid(), out = { cases: {} };
  var fn = window.saveGoogleToken;
  out.pre = { typeofWindow: typeof fn, typeofScope: typeof L.saveGoogleToken, windowIsScope: fn === L.saveGoogleToken, declaredParams: fn.length, name: fn.name, uid: uid0, keysBefore: before };
  out.where = { kitHas: !!(window.OurgoalUiHelpers && typeof window.OurgoalUiHelpers.saveGoogleToken === 'function'), kitIsWindow: !!(window.OurgoalUiHelpers && window.OurgoalUiHelpers.saveGoogleToken === fn), bodyReadsScope: /L\.gcalCurrentUid\(\)/.test(String(fn)), bodyHasArguments1: /arguments\[1\]/.test(String(fn)) };
  // A: 토큰이 없으면 아무것도 쓰지 않는다
  var a1 = L.saveGoogleToken(null, 'none@example.com'), a2 = L.saveGoogleToken({}, 'none@example.com');
  out.cases.A_noToken = { returns: [typeof a1, typeof a2], keysUnchanged: JSON.stringify(keys()) === JSON.stringify(before), session: sessionStorage.getItem('ourgoal_google_token') === saved.ss };
  // B: 인자 둘(통로로 호출) — 둘째 인자가 email 로 들어간다. 예전 공용 키는 지워지고, 주인이 다르던 일정 캐시는 버려진다
  LEG.forEach(function (k) { localStorage.setItem(k, 'legacy'); });
  st._gcalOwnerUid = 'other_probe'; st.gcalEventsCache = [{ id: 'ev' }]; st._lastExpiredGoogleToken = 'old';
  var b = L.saveGoogleToken({ accessToken: 'TOK_B', expiresAt: FAR }, 'two-args@example.com');
  out.cases.B_twoArgsViaScope = { returns: typeof b, token: tok(uid0), legacyLeft: LEG.filter(function (k) { return localStorage.getItem(k) !== null; }), session: sessionStorage.getItem('ourgoal_google_token'), state: stView() };
  // C: 인자 하나, 프로필에 연동 이메일이 없음 → email 은 빈 글자, 만료 시각은 기본값. 주인이 같으므로 일정 캐시는 그대로다
  st.gcalEventsCache = ['keep'];
  L.saveGoogleToken({ accessToken: 'TOK_C' });
  out.cases.C_oneArgNoEmail = { token: tok(uid0), session: sessionStorage.getItem('ourgoal_google_token'), cacheKept: !!st.gcalEventsCache && st.gcalEventsCache[0] === 'keep', state: stView() };
  // D: 인자 하나, 프로필 설정에 연동 이메일이 있음(임시 프로필) → 그 계정 키에, 설정의 이메일로 저장. 주인이 바뀌었으므로 캐시를 버린다
  st.profile = { id: 'u_probe_659', settings: { googleCalendarEmail: 'from-settings@example.com' } };
  window.saveGoogleToken({ accessToken: 'TOK_D', expiresAt: FAR });
  out.cases.D_oneArgSettingsEmail = { uid: L.gcalCurrentUid(), token: tok('u_probe_659'), guestTokenStill: tok(uid0) && tok(uid0).accessToken, session: sessionStorage.getItem('ourgoal_google_token'), state: stView() };
  // E: 인자 셋(window 로 호출) — 둘째 인자가 설정의 이메일보다 먼저다. 셋째 인자는 쓰이지 않는다
  window.saveGoogleToken({ accessToken: 'TOK_E', expiresAt: FAR }, 'override@example.com', 'ignored');
  out.cases.E_threeArgsViaWindow = { token: tok('u_probe_659'), session: sessionStorage.getItem('ourgoal_google_token'), state: stView() };
  // 되돌리기
  st.profile = saved.profile; st._gcalOwnerUid = saved.owner; st.gcalEventsCache = saved.cache; st._lastExpiredGoogleToken = saved.lastExp;
  localStorage.removeItem('ourgoal_gcal_token_v1_u_probe_659'); if (before.indexOf('ourgoal_gcal_token_v1_' + uid0) < 0) localStorage.removeItem('ourgoal_gcal_token_v1_' + uid0);
  if (saved.ss === null) sessionStorage.removeItem('ourgoal_google_token'); else sessionStorage.setItem('ourgoal_google_token', saved.ss);
  out.restored = { keysSame: JSON.stringify(keys()) === JSON.stringify(before), profileSame: st.profile === saved.profile, sessionSame: sessionStorage.getItem('ourgoal_google_token') === saved.ss };
  return out;
}

async function runTree(APP) {
  const srv = await server.start(path.resolve(APP), cfg.denyServePrefixes || []);
  const siteUrl = siteHost.siteUrlFor(siteHost.pickSiteHost(cfg), srv.port);
  const exceptions = [];
  let browser = null, result = null, error = null;
  try {
    browser = await launch({ allowHosts: cfg.allowHosts || [], siteOrigin: siteUrl, locale: cfg.locale, viewport: { width: 430, height: 932 } });
    const page = browser.page;
    await page.send('Page.enable'); await page.send('Runtime.enable');
    page.on('Runtime.exceptionThrown', p => { const d = p && p.exceptionDetails; exceptions.push((d && d.exception && d.exception.description) || (d && d.text) || 'exception'); });
    const loaded = new Promise(res => { page.on('Page.loadEventFired', () => res()); setTimeout(res, 20000); });
    await page.send('Page.navigate', { url: siteUrl + '/index.html' });
    await loaded; await sleep(2500);
    const r = await page.send('Runtime.evaluate', { expression: 'JSON.stringify((' + pageProbe.toString() + ')())', returnByValue: true, awaitPromise: true }, 15000);
    if (r.exceptionDetails) throw new Error('페이지 평가 오류: ' + ((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text || ''));
    result = JSON.parse(r.result.value);
    await sleep(500);
  } catch (e) { error = String(e && e.message || e); }
  try { if (browser && browser.close) await browser.close(); } catch (e) {}
  try { srv.close ? srv.close() : srv.server && srv.server.close(); } catch (e) {}
  return { app: path.resolve(APP), error, pageExceptions: exceptions, result };
}

(async () => {
  const base = await runTree(BASE), work = await runTree(WORK);
  const cb = base.result && base.result.cases, cw = work.result && work.result.cases;
  const caseIds = cw ? Object.keys(cw) : [];
  const perCase = Object.fromEntries(caseIds.map(id => [id, !!cb && JSON.stringify(cb[id]) === JSON.stringify(cw[id])]));
  const w = cw || {};
  const expected = cw ? {
    noTokenWritesNothing: w.A_noToken.keysUnchanged === true && w.A_noToken.session === true,
    secondArgBecomesEmail: w.B_twoArgsViaScope.token && w.B_twoArgsViaScope.token.email === 'two-args@example.com',
    legacyKeysPurged: w.B_twoArgsViaScope.legacyLeft.length === 0,
    staleCacheDropped: w.B_twoArgsViaScope.state.cacheIsNull === true && w.B_twoArgsViaScope.state.lastExpiredIsNull === true && w.B_twoArgsViaScope.state.owner === work.result.pre.uid,
    oneArgEmailEmptyAndDefaultExpiry: w.C_oneArgNoEmail.token && w.C_oneArgNoEmail.token.email === '' && w.C_oneArgNoEmail.token.expiresAt === 'default(now+3300000)' && w.C_oneArgNoEmail.cacheKept === true,
    oneArgUsesSettingsEmailAndOwnUidKey: w.D_oneArgSettingsEmail.token && w.D_oneArgSettingsEmail.token.email === 'from-settings@example.com' && w.D_oneArgSettingsEmail.token.ownerUid === 'u_probe_659' && w.D_oneArgSettingsEmail.guestTokenStill === 'TOK_C',
    secondArgOverridesSettingsEmail: w.E_threeArgsViaWindow.token && w.E_threeArgsViaWindow.token.email === 'override@example.com' && w.E_threeArgsViaWindow.token.accessToken === 'TOK_E',
    sessionHoldsLastToken: w.E_threeArgsViaWindow.session === 'TOK_E',
  } : null;
  const out = { tool: 'reports/TASK-ES-659/tools/save-token-probe.cjs (court/lib/chrome.js · static-server.js · site-host.js 읽기 전용)', type: '작업자 측정, 판정 아님',
    limits: '게스트로 부팅한 임시 브라우저에서 가짜 토큰 객체로 함수를 직접 부른 것이다. 진짜 구글 로그인으로 받은 토큰이 들어오는 길은 재지 못했다. D · E 는 state.profile 을 임시 객체로 바꿔 부른 뒤 되돌렸다.',
    base, work,
    compare: { casesCompared: caseIds.length, perCase, allCasesSame: caseIds.length === 5 && caseIds.every(id => perCase[id]), preSame: !!base.result && !!work.result && JSON.stringify(base.result.pre) === JSON.stringify(work.result.pre) },
    expected, allExpected: !!expected && Object.values(expected).every(v => v === true),
    restoredBoth: !!base.result && !!work.result && [base, work].every(t => t.result.restored.keysSame && t.result.restored.profileSame && t.result.restored.sessionSame),
    exceptionsBoth: [base.pageExceptions.length, work.pageExceptions.length] };
  out.ok = !base.error && !work.error && out.compare.allCasesSame && out.compare.preSame && out.allExpected && out.restoredBoth && work.pageExceptions.length <= base.pageExceptions.length
    && work.result.where.kitIsWindow === true && work.result.where.bodyReadsScope === true && work.result.where.bodyHasArguments1 === true && base.result.where.kitHas === false;
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', { encoding: 'utf8' });
  console.log(JSON.stringify({ ok: out.ok, errors: [base.error, work.error], compare: out.compare, expected, restored: out.restoredBoth, exc: out.exceptionsBoth, whereBase: base.result && base.result.where, whereWork: work.result && work.result.where, pre: work.result && work.result.pre }));
  process.exit(0);
})();
