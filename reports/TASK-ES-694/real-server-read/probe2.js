'use strict';
/*
 * 아워골 운영 서버 「읽기만」 조사 — 2차(1차 probe.js 결과에서 생긴 물음만).
 *  (가) 앱이 보내는 칸이 실제로 있는가: checkins 의 theme 3칸, goals 의 앱 칸 전부(A · B 모두 목표 0건이라 select=* 로는 못 봄)
 *  (나) 칸의 자료형: 일부러 맞지 않는 글자를 조건에 넣어 오류 글의 자료형 이름을 읽는다(GET 조회, 자기 행 조건을 함께 건다)
 *  (다) users 와 checkins · goals 사이에 외래 키 관계가 등록돼 있는가(끼워 넣기 조회가 되는가)
 *  (라) 하네스 표식(runTag 꼴)이 붙은 자기 행 개수 — 느슨한 조건 대신 정확한 꼴로
 * 안전 규칙은 probe.js 와 같다: 표에는 GET 만, rpc · 쓰기 없음, 비밀값 · 본문을 남기지 않는다.
 * 실행: node probe2.js
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const OUT_DIR = __dirname;
const LOG_FILE = path.join(OUT_DIR, 'requests-2.jsonl');
const RESULT_FILE = path.join(OUT_DIR, 'result-2.json');
const REPO = 'C:/dev/ourgoal-app';
const MIN_GAP_MS = 650;
const SEQ_OFFSET = 84;        // 1차가 84건
const MAX_REQUESTS = 200 - SEQ_OFFSET;
const ACCOUNT_MARK = /ogtest/i;
const BAD = 'zz-not-a-value';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const state = { n: 0, last: 0, counts: {}, uid: null, log: [] };

function readDeclared() {
  const html = execFileSync('git', ['-C', REPO, 'show', 'origin/main:index.html'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const url = (html.match(/SUPABASE_URL\s*=\s*'([^']+)'/) || [])[1];
  const key = (html.match(/SUPABASE_ANON_KEY\s*=\s*'([^']+)'/) || [])[1];
  if (!url || !key) throw new Error('저장소 선언에서 주소 · 공개 키를 못 찾음');
  return { url: url.replace(/\/+$/, ''), key };
}
const AUTH_ALLOWED = ['/auth/v1/token?grant_type=password', '/auth/v1/logout?scope=local'];
function guard(method, pq) {
  if (state.n >= MAX_REQUESTS) throw new Error('요청 상한 도달 — 멈춤');
  if (pq.startsWith('/rest/v1/')) {
    if (method !== 'GET') throw new Error('차단: 표에는 GET 만');
    if (pq.includes('/rpc/')) throw new Error('차단: rpc 호출');
    return 'rest-GET';
  }
  if (method === 'POST' && AUTH_ALLOWED.indexOf(pq) >= 0) return pq.includes('token') ? 'auth-login' : 'auth-logout';
  throw new Error('차단: 허용 목록 밖 요청');
}
const mask = (s) => state.uid ? String(s).split(state.uid).join('<A>') : String(s);

async function send(base, method, pq, headers, body, why) {
  const kind = guard(method, pq);
  const gap = Date.now() - state.last;
  if (gap < MIN_GAP_MS) await sleep(MIN_GAP_MS - gap);
  state.last = Date.now(); state.n += 1; state.counts[kind] = (state.counts[kind] || 0) + 1;
  const at = new Date().toISOString();
  let res, text = '', json = null, netErr = null;
  try {
    res = await fetch(base + pq, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(30000) });
    text = await res.text();
    try { json = text ? JSON.parse(text) : null; } catch (_) { json = null; }
  } catch (e) { netErr = String(e && e.message || e); }
  const [p, q] = pq.split('?');
  const entry = {
    seq: SEQ_OFFSET + state.n, at, kind, method,
    target: p.replace('/rest/v1/', 'rest:').replace('/auth/v1/', 'auth:'),
    query: kind === 'rest-GET' ? mask(decodeURIComponent(q || '')) : (q || ''),
    as: 'A', status: res ? res.status : null,
    rows: Array.isArray(json) ? json.length : null,
    contentRange: res ? res.headers.get('content-range') : null,
    bytes: text.length,
    errorCode: (json && !Array.isArray(json) && json.code) ? String(json.code) : null,
    errorMessage: (kind === 'rest-GET' && json && !Array.isArray(json) && json.message) ? mask(String(json.message)).slice(0, 160) : null,
    netError: netErr, why
  };
  state.log.push(entry);
  fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n', { encoding: 'utf8' });
  return { status: entry.status, json, entry };
}
const totalOf = (cr) => { const m = String(cr || '').match(/\/(\d+|\*)$/); return m && m[1] !== '*' ? Number(m[1]) : null; };

async function main() {
  const result = { tool: 'probe2.js (읽기만)', startedAt: new Date().toISOString(), exists: {}, types: {}, relations: {}, markers: {}, stoppedBecause: null };
  fs.writeFileSync(LOG_FILE, '', { encoding: 'utf8' });
  const email = String(process.env.OG_TEST_A_EMAIL || '').trim();
  if (!email || !process.env.OG_TEST_A_PASSWORD || !ACCOUNT_MARK.test(email)) { result.stoppedBecause = '계정 조건 위반 — 접속 안 함'; return finish(result, null); }
  const decl = readDeclared();
  const base = decl.url;
  let token = null;
  const H = (extra) => Object.assign({ apikey: decl.key, Authorization: 'Bearer ' + token }, extra || {});
  const COUNT = { Prefer: 'count=exact' };
  const owner = { checkins: 'user_id', goals: 'user_id', users: 'id' };
  try {
    const r = await send(base, 'POST', '/auth/v1/token?grant_type=password', { apikey: decl.key, 'Content-Type': 'application/json' }, { email, password: process.env.OG_TEST_A_PASSWORD }, '로그인(세션 받기)');
    const j = r.json || {};
    if (r.status !== 200 || !j.access_token || !j.user) { result.stoppedBecause = 'A 로그인 실패(status ' + r.status + ')'; return finish(result, null); }
    token = j.access_token; state.uid = j.user.id;
    if (!ACCOUNT_MARK.test(String(j.user.email || '')) || String(j.user.email).toLowerCase() !== email.toLowerCase()) { result.stoppedBecause = '로그인 응답 주소가 시험 계정이 아님'; return finish(result, { base, decl, token }); }
    result.login = { lastSignInAt: j.user.last_sign_in_at || null };
    const A = state.uid;

    /* (가) 칸 유무 */
    const want = {
      checkins: ['theme', 'sub_theme', 'theme_confidence'],
      goals: ['id', 'user_id', 'title', 'category', 'due_date', 'visibility', 'topic', 'archived_at', 'result', 'milestones', 'start_date', 'status', 'progress']
    };
    for (const t of Object.keys(want)) {
      result.exists[t] = {};
      for (const c of want[t]) {
        /* user_id 칸 자체가 없을 수도 있으므로 goals.user_id 를 잴 때는 주인 조건 없이 limit=0 으로 묻는다 */
        const q = (t === 'goals' && c === 'user_id') ? '?select=' + c + '&limit=0' : '?select=' + c + '&' + owner[t] + '=eq.' + A + '&limit=1';
        const x = await send(base, 'GET', '/rest/v1/' + t + q, H(), null, '칸 유무: ' + t + '.' + c);
        result.exists[t][c] = x.status === 200 ? '있음' : (x.entry.errorCode === '42703' ? '없음(42703)' : '판정불가(' + x.status + ' ' + (x.entry.errorCode || '') + ')');
      }
    }

    /* (나) 자료형: 맞지 않는 글자를 조건에 — 오류 글에 자료형 이름이 나온다. 200 이면 글자 계열 */
    const typeCols = {
      checkins: ['id', 'user_id', 'type', 'text', 'start_at', 'end_at', 'created_at', 'category', 'meta'],
      goals: ['created_at', 'updated_at'].concat(want.goals.filter((c) => result.exists.goals[c] === '있음')),
      users: ['id', 'username', 'display_name', 'created_at', 'bio', 'avatar_url', 'interests', 'region', 'region_public', 'saved_avatars']
    };
    for (const t of Object.keys(typeCols)) {
      result.types[t] = {};
      for (const c of typeCols[t]) {
        const x = await send(base, 'GET', '/rest/v1/' + t + '?select=id&' + owner[t] + '=eq.' + A + '&' + c + '=eq.' + BAD + '&limit=1', H(), null, '자료형: ' + t + '.' + c);
        let ty;
        const msg = String((x.json && x.json.message) || '');
        const m = msg.match(/invalid input syntax for type ([a-z0-9 _\[\]]+?)(:|$)/i);
        if (x.status === 200) ty = '글자 계열(오류 없음 — text/varchar 로 보임)';
        else if (m) ty = m[1].trim();
        else if (/malformed array literal/i.test(msg)) ty = '배열(array)';
        else ty = '판정불가(' + x.status + ' ' + (x.entry.errorCode || '') + ')';
        result.types[t][c] = { type: ty, status: x.status, errorCode: x.entry.errorCode };
      }
    }

    /* (다) 외래 키 관계가 등록돼 있는가(끼워 넣기 조회) */
    for (const t of ['checkins', 'goals']) {
      const x = await send(base, 'GET', '/rest/v1/users?select=id,' + t + '(id)&id=eq.' + A + '&limit=1', H(), null, 'users 와 ' + t + ' 사이 관계');
      result.relations['users->' + t] = { status: x.status, errorCode: x.entry.errorCode, embedded: (x.status === 200 && Array.isArray(x.json) && x.json[0] && Array.isArray(x.json[0][t])) ? x.json[0][t].length : null };
    }

    /* (라) 하네스 표식(ogtest-<숫자 12>-<4글자>)이 붙은 자기 행 개수 */
    const pat = encodeURIComponent('ogtest-[0-9]{12}-[a-z0-9]{4}');
    for (const [t, col, oc] of [['checkins', 'text', 'user_id'], ['goals', 'title', 'user_id'], ['team_pings', 'message', 'sender_id'], ['team_ping_replies', 'message', 'sender_id']]) {
      const x = await send(base, 'GET', '/rest/v1/' + t + '?select=id&' + oc + '=eq.' + A + '&' + col + '=imatch.' + pat + '&limit=1', H(COUNT), null, '표식 꼴이 정확히 맞는 자기 행 개수');
      result.markers[t] = { status: x.status, total: totalOf(x.entry.contentRange), errorCode: x.entry.errorCode };
    }
  } catch (e) { result.stoppedBecause = '오류로 멈춤: ' + mask(String(e && e.message || e)).slice(0, 200); }
  return finish(result, token ? { base, decl, token } : null);
}

async function finish(result, ctx) {
  if (ctx) {
    try { const r = await send(ctx.base, 'POST', '/auth/v1/logout?scope=local', { apikey: ctx.decl.key, Authorization: 'Bearer ' + ctx.token }, null, '로그아웃(이 세션만)'); result.logout = r.status; }
    catch (e) { result.logout = '실패'; }
  }
  result.finishedAt = new Date().toISOString();
  result.requests = { total: state.n, byKind: state.counts,
    restNonGet: state.log.filter((l) => l.target.startsWith('rest:') && l.method !== 'GET').length,
    statusCounts: state.log.reduce((a, l) => { const k = String(l.status); a[k] = (a[k] || 0) + 1; return a; }, {}) };
  const text = mask(JSON.stringify(result, null, 2)).replace(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, '<가림>');
  fs.writeFileSync(RESULT_FILE, text + '\n', { encoding: 'utf8' });
  console.log(text);
  return result.stoppedBecause ? 1 : 0;
}
main().then((c) => { process.exitCode = c; }).catch((e) => { console.error('치명 오류: ' + String(e && e.message || e).slice(0, 200)); process.exitCode = 2; });
