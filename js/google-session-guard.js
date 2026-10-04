/* [#TASK-ES-373] CORE-14 구글 로그인은 Supabase 가 검증한 세션으로만 연다.
 * 원인: index.html initGoogleOneTap 콜백이 GIS 자격증명(JWT)을 parseJwtPayload 로 서명 검증 없이 풀어
 *   이메일을 믿었고, loginWithDirectIdentifier 가 그 이메일 → 'u_' + sha256('ourgoal_user_' + 이메일) 앞 16자 uid 로
 *   Supabase 세션 없이 입장했다(js/direct-login-guard.js 의 google-verified-email 갈래). 이메일만 알면 그 uid 로 들어갈 수 있었다.
 * 규칙:
 *   1. GIS 자격증명은 브라우저에서 해석하지 않고 sb.auth.signInWithIdToken({ provider:'google', token, nonce }) 으로 넘긴다.
 *      Supabase 서버가 구글 서명·aud·만료·nonce 를 검증해 돌려준 세션의 user.id 만 입장 uid 로 쓴다.
 *   2. 토큰 클라이언트(액세스 토큰) 경로는 id_token 이 없어 서버 검증을 받을 수 없다 → 미로그인 상태에서는
 *      sb.auth.signInWithOAuth({ provider:'google' }) 리다이렉트로 Supabase 검증 세션을 받는다.
 *   3. 검증이 실패하거나(위조·무서명·만료·공급자 꺼짐) 세션이 오지 않으면 입장하지 않고 정식 로그인 화면으로 안내한다.
 *   구글 로그인 버튼·One-Tap 은 그대로 둔다. */
(function (root) {
  'use strict';

  var GOOGLE_FAILED_MESSAGE = '구글 계정 확인을 서버에서 마치지 못했어요. 잠시 후 다시 시도하시거나 카카오·이메일로 로그인해 주세요.';
  var JWT_SHAPE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

  function looksLikeJwt(token) {
    return typeof token === 'string' && JWT_SHAPE.test(token);
  }

  function toHex(buf) {
    var bytes = new Uint8Array(buf), out = '';
    for (var i = 0; i < bytes.length; i++) out += ('0' + bytes[i].toString(16)).slice(-2);
    return out;
  }

  /* GIS initialize 에는 hashed(sha256 hex), signInWithIdToken 에는 raw 를 넘긴다(Supabase 가 sha256(raw) 와 토큰 nonce 를 대조).
   * crypto.subtle 이 없으면 null — nonce 없이(양쪽 모두 비움) 진행한다. */
  async function createNonce(cryptoObj) {
    var c = cryptoObj || (typeof crypto !== 'undefined' ? crypto : null);
    if (!c || !c.getRandomValues || !c.subtle || typeof TextEncoder === 'undefined') return null;
    var raw = toHex(c.getRandomValues(new Uint8Array(16)));
    var hashed = toHex(await c.subtle.digest('SHA-256', new TextEncoder().encode(raw)));
    return { raw: raw, hashed: hashed };
  }

  /* 돌려줌: { ok, uid, session, reason } — ok 는 Supabase 가 돌려준 세션에 user.id 가 있을 때만 true */
  async function verifyGoogleCredential(sb, credential, rawNonce) {
    if (!looksLikeJwt(credential)) return { ok: false, uid: null, session: null, reason: 'not-a-jwt' };
    if (!sb || !sb.auth || typeof sb.auth.signInWithIdToken !== 'function') return { ok: false, uid: null, session: null, reason: 'no-client' };
    var params = { provider: 'google', token: credential };
    if (rawNonce) params.nonce = rawNonce;
    var res;
    try { res = await sb.auth.signInWithIdToken(params); }
    catch (e) { return { ok: false, uid: null, session: null, reason: 'server-rejected' }; }
    if (!res || res.error) return { ok: false, uid: null, session: null, reason: 'server-rejected' };
    var session = res.data && res.data.session;
    var uid = session && session.user && session.user.id;
    if (!uid || !session.access_token) return { ok: false, uid: null, session: null, reason: 'no-session' };
    return { ok: true, uid: String(uid), session: session, reason: 'server-verified' };
  }

  /* 액세스 토큰만 있는 경로: Supabase 구글 OAuth 리다이렉트로 서버 검증 세션을 받는다 */
  async function startGoogleOAuthSession(sb, opt) {
    var o = opt || {};
    if (!sb || !sb.auth || typeof sb.auth.signInWithOAuth !== 'function') return { ok: false, reason: 'no-client' };
    var queryParams = { prompt: 'select_account' };
    if (o.loginHint) queryParams.login_hint = String(o.loginHint);
    try {
      var res = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: o.redirectTo, queryParams: queryParams } });
      if (res && res.error) return { ok: false, reason: 'server-rejected' };
      return { ok: true, reason: 'redirecting' };
    } catch (e) {
      return { ok: false, reason: 'server-rejected' };
    }
  }

  /* 실패 안내: 아무 uid 로도 입장하지 않고 정식 로그인 화면(카카오·이메일 칸) + 구글 실패 문구.
   * d: { doc, toast, initFields } — 화면 전환은 js/direct-login-guard.js guideToFormalLogin 을 그대로 쓴다 */
  function guideFailure(d) {
    var o = d || {};
    var dg = root && root.OurgoalDirectLoginGuard;
    if (dg && typeof dg.guideToFormalLogin === 'function') dg.guideToFormalLogin(o.doc, null, o.initFields);
    var err = o.doc && o.doc.getElementById ? o.doc.getElementById('loginError') : null;
    if (err) err.textContent = GOOGLE_FAILED_MESSAGE;
    if (typeof o.toast === 'function') o.toast(GOOGLE_FAILED_MESSAGE);
    return false;
  }

  function rememberGoogle(d) {
    try { if (d.storage) d.storage.setItem('ourgoal_last_auth_provider', 'google'); } catch (e) {}
    if (typeof d.markLogin === 'function') { try { d.markLogin(Date.now()); } catch (e) {} }
  }

  /* One-Tap 자격증명 → 서버 검증 → 세션 uid 로 정식 진입(index.html restoreSessionAndEnter).
   * d: { sb, credential, rawNonce, restore(session), getProfileId(), doc, toast, initFields, storage, markLogin } */
  async function enterWithCredential(d) {
    var o = d || {};
    var v = await verifyGoogleCredential(o.sb, o.credential, o.rawNonce);
    if (!v.ok) return guideFailure(o);
    rememberGoogle(o);
    var current = typeof o.getProfileId === 'function' ? o.getProfileId() : null;
    if (current !== v.uid && typeof o.restore === 'function') await o.restore(v.session);
    return true;
  }

  /* 토큰 클라이언트 경로 → Supabase 구글 OAuth 리다이렉트. 시작 못 하면(공급자 꺼짐 등) 정식 로그인 안내 */
  async function startOAuthOrGuide(d) {
    var o = d || {};
    rememberGoogle(o);
    var r = await startGoogleOAuthSession(o.sb, { redirectTo: o.redirectTo, loginHint: o.loginHint });
    if (!r.ok) return guideFailure(o);
    return true;
  }

  var api = {
    GOOGLE_FAILED_MESSAGE: GOOGLE_FAILED_MESSAGE,
    looksLikeJwt: looksLikeJwt,
    createNonce: createNonce,
    verifyGoogleCredential: verifyGoogleCredential,
    startGoogleOAuthSession: startGoogleOAuthSession,
    guideFailure: guideFailure,
    enterWithCredential: enterWithCredential,
    startOAuthOrGuide: startOAuthOrGuide
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.OurgoalGoogleSessionGuard = api;
})(typeof window !== 'undefined' ? window : null);
