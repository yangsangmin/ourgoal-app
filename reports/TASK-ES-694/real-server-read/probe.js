'use strict';
/*
 * 아워골 운영 서버 「읽기만」 조사 (회의 03 확정본 8절의 읽기 조사).
 * - 하는 것: 전용 시험 계정 A · B 로그인(인증 호출) -> 표 조회(GET) -> 로그아웃(인증 호출).
 * - 하지 않는 것: insert · update · upsert · delete · rpc · /api/* · 스토리지. 아래 guard() 가 막는다.
 * - 비밀값(비밀번호 · 토큰 · 공개 키)은 파일 · 출력에 쓰지 않는다. 주소와 공개 키는 저장소 선언에서 실행 때 읽는다.
 * - 응답 본문은 저장하지 않는다. 칸 이름과 값의 꼴(자료형 · 시각 모양 · 길이 범위)만 남긴다.
 * 실행: node probe.js
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const OUT_DIR = __dirname;
const LOG_FILE = path.join(OUT_DIR, 'requests.jsonl');
const RESULT_FILE = path.join(OUT_DIR, 'result.json');
const REPO = 'C:/dev/ourgoal-app';
const MIN_GAP_MS = 650;       // 초당 2건 이하
const MAX_REQUESTS = 200;     // 전체 상한
const ACCOUNT_MARK = /ogtest/i;
const RUN_TAG = /ogtest-\d{12}-[a-z0-9]{4}/i;   // 하네스 makeRunTag() 의 꼴
const PROBE_COLS = ['updated_at', 'version', 'deleted_at', 'meta', 'photo', 'feedback', 'theme_metadata', 'is_bot', 'created_at', 'start_at', 'trash', 'saved_avatars', 'companions'];
const VOCAB_COLS = { checkins: ['type', 'theme'], goals: ['visibility'], users: [] };  // 앱 낱말표라 값 종류를 적어도 되는 칸

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const state = { n: 0, last: 0, counts: {}, uids: {}, log: [] };

/* ---------- 안전: 계정 조건(하네스 checkEnv 와 같은 규칙) ---------- */
function isTestAddress(addr, env) {
  const a = String(addr || '').trim().toLowerCase();
  if (ACCOUNT_MARK.test(a)) return true;
  const allow = String(env.OG_TEST_ALLOW || '').split(',').map((x) => x.trim().toLowerCase()).filter(Boolean);
  return allow.indexOf(a) >= 0;
}
function checkEnv(env) {
  const need = ['OG_TEST_A_EMAIL', 'OG_TEST_A_PASSWORD', 'OG_TEST_B_EMAIL', 'OG_TEST_B_PASSWORD'];
  const missing = need.filter((k) => !String(env[k] || '').trim());
  if (missing.length) return { ok: false, why: '환경 변수 없음: ' + missing.join(', ') };
  const a = env.OG_TEST_A_EMAIL.trim().toLowerCase(), b = env.OG_TEST_B_EMAIL.trim().toLowerCase();
  const bad = [];
  if (!isTestAddress(a, env)) bad.push('A 주소에 ogtest 없음');
  if (!isTestAddress(b, env)) bad.push('B 주소에 ogtest 없음');
  if (a === b) bad.push('A · B 주소가 같음');
  if (bad.length) return { ok: false, why: bad.join(' / ') };
  return { ok: true };
}

/* ---------- 서버 주소 · 공개 키: 저장소 선언에서 읽는다(파일에 쓰지 않는다) ---------- */
function readDeclared() {
  const html = execFileSync('git', ['-C', REPO, 'show', 'origin/main:index.html'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const url = (html.match(/SUPABASE_URL\s*=\s*'([^']+)'/) || [])[1];
  const key = (html.match(/SUPABASE_ANON_KEY\s*=\s*'([^']+)'/) || [])[1];
  if (!url || !key) throw new Error('저장소 선언에서 주소 · 공개 키를 못 찾음');
  const commit = execFileSync('git', ['-C', REPO, 'rev-parse', 'origin/main'], { encoding: 'utf8' }).trim();
  return { url: url.replace(/\/+$/, ''), key, commit };
}

/* ---------- 안전: 허용된 요청만 나간다 ---------- */
const AUTH_ALLOWED = ['/auth/v1/token?grant_type=password', '/auth/v1/logout?scope=local'];
function guard(method, pathAndQuery) {
  if (state.n >= MAX_REQUESTS) throw new Error('요청 상한 ' + MAX_REQUESTS + ' 도달 — 멈춤');
  if (pathAndQuery.startsWith('/rest/v1/')) {
    if (method !== 'GET') throw new Error('차단: 표에는 GET 만 (' + method + ')');
    if (pathAndQuery.includes('/rpc/')) throw new Error('차단: rpc 호출');
    return 'rest-GET';
  }
  if (method === 'POST' && AUTH_ALLOWED.indexOf(pathAndQuery) >= 0) return pathAndQuery.includes('token') ? 'auth-login' : 'auth-logout';
  throw new Error('차단: 허용 목록 밖 요청 ' + method + ' ' + pathAndQuery.split('?')[0]);
}
function maskIds(s) {
  let t = String(s);
  Object.keys(state.uids).forEach((label) => { if (state.uids[label]) t = t.split(state.uids[label]).join('<' + label + '>'); });
  return t;
}
function appendLog(entry) {
  state.log.push(entry);
  fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n', { encoding: 'utf8' });
}

async function send(base, method, pathAndQuery, headers, body, note) {
  const kind = guard(method, pathAndQuery);
  const gap = Date.now() - state.last;
  if (gap < MIN_GAP_MS) await sleep(MIN_GAP_MS - gap);
  state.last = Date.now();
  state.n += 1;
  state.counts[kind] = (state.counts[kind] || 0) + 1;
  const started = new Date().toISOString();
  let res, text = '', json = null, netErr = null;
  try {
    res = await fetch(base + pathAndQuery, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(30000) });
    text = await res.text();
    try { json = text ? JSON.parse(text) : null; } catch (_) { json = null; }
  } catch (e) { netErr = String(e && e.message || e); }
  const [p, q] = pathAndQuery.split('?');
  const entry = {
    seq: state.n, at: started, kind, method,
    target: p.replace('/rest/v1/', 'rest:').replace('/auth/v1/', 'auth:'),
    query: kind === 'rest-GET' ? maskIds(decodeURIComponent(q || '')) : (q || ''),
    as: note && note.as || null,
    status: res ? res.status : null,
    rows: Array.isArray(json) ? json.length : null,
    contentRange: res ? res.headers.get('content-range') : null,
    bytes: text.length,
    errorCode: (json && !Array.isArray(json) && json.code) ? String(json.code) : null,
    errorMessage: (kind === 'rest-GET' && json && !Array.isArray(json) && json.message) ? maskIds(String(json.message)).slice(0, 160) : null,
    netError: netErr,
    why: note && note.why || null
  };
  appendLog(entry);
  return { status: res ? res.status : null, json, headers: res ? res.headers : null, entry };
}

/* ---------- 값의 꼴 요약(내용은 남기지 않는다) ---------- */
function strKind(s) {
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(s)) return 'time:' + s.replace(/\d/g, 'd');
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return 'date:dddd-dd-dd';
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)) return 'uuid';
  if (/^data:/.test(s)) return 'data-uri(' + (s.slice(5, 40).split(/[;,]/)[0] || '?') + ')';
  if (/^https?:\/\//.test(s)) return 'url';
  if (/^-?\d+(\.\d+)?$/.test(s)) return 'numeric-string';
  if (s === '') return 'empty-string';
  return 'text';
}
function idKind(s) {
  s = String(s);
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)) return 'uuid';
  const m = s.match(/^(rec_pomo_|rec_tt_|rec_imp_|rec_prev_|rec_|samp_wt_|samp_|id_|g_)/);
  return m ? m[1] + '…' : 'other';
}
function describe(values, depth) {
  const out = { n: values.length, kinds: {} };
  const bump = (k) => { out.kinds[k] = (out.kinds[k] || 0) + 1; };
  let lenMin = null, lenMax = null, numMin = null, numMax = null, arrMin = null, arrMax = null;
  const objKeys = {}, elemValues = [];
  values.forEach((v) => {
    if (v === null || v === undefined) return bump('null');
    if (typeof v === 'boolean') return bump('boolean');
    if (typeof v === 'number') { bump(Number.isInteger(v) ? 'integer' : 'float'); numMin = numMin === null ? v : Math.min(numMin, v); numMax = numMax === null ? v : Math.max(numMax, v); return; }
    if (typeof v === 'string') { bump('string/' + strKind(v)); lenMin = lenMin === null ? v.length : Math.min(lenMin, v.length); lenMax = lenMax === null ? v.length : Math.max(lenMax, v.length); return; }
    if (Array.isArray(v)) { bump('array'); arrMin = arrMin === null ? v.length : Math.min(arrMin, v.length); arrMax = arrMax === null ? v.length : Math.max(arrMax, v.length); v.forEach((e) => elemValues.push(e)); return; }
    if (typeof v === 'object') { bump('object'); Object.keys(v).forEach((k) => { (objKeys[k] = objKeys[k] || []).push(v[k]); }); return; }
    bump(typeof v);
  });
  if (lenMin !== null) out.stringLength = [lenMin, lenMax];
  if (numMin !== null) out.numberRange = [numMin, numMax];
  if (arrMin !== null) {
    out.arrayLength = [arrMin, arrMax];
    if (elemValues.length && depth > 0) out.elements = describe(elemValues, depth - 1);
  }
  if (Object.keys(objKeys).length) {
    out.objectKeys = {};
    Object.keys(objKeys).sort().forEach((k) => { out.objectKeys[k] = depth > 0 ? describe(objKeys[k], depth - 1).kinds : '…'; });
  }
  return out;
}
function summarizeRows(table, rows) {
  const cols = {};
  const names = [];
  rows.forEach((r) => Object.keys(r).forEach((k) => { if (names.indexOf(k) < 0) names.push(k); }));
  names.forEach((c) => {
    cols[c] = describe(rows.map((r) => r[c]), 2);
    if ((VOCAB_COLS[table] || []).indexOf(c) >= 0) cols[c].distinct = Array.from(new Set(rows.map((r) => r[c]))).slice(0, 20);
  });
  const ids = rows.map((r) => String(r.id));
  const idCounts = {}; ids.forEach((i) => { idCounts[i] = (idCounts[i] || 0) + 1; });
  const idShapes = {}; ids.forEach((i) => { const k = idKind(i); idShapes[k] = (idShapes[k] || 0) + 1; });
  const tagged = rows.filter((r) => RUN_TAG.test(JSON.stringify([r.text, r.title]))).length;
  const taggedAnywhere = rows.filter((r) => RUN_TAG.test(JSON.stringify(r))).length;
  return {
    columnOrder: names, columns: cols,
    rowCount: rows.length,
    duplicateIds: Object.keys(idCounts).filter((i) => idCounts[i] > 1).length,
    idShapes,
    deletedRows: names.indexOf('deleted_at') >= 0 ? rows.filter((r) => r.deleted_at !== null && r.deleted_at !== undefined).length : null,
    harnessTaggedRows: tagged, harnessTaggedAnywhere: taggedAnywhere
  };
}
function totalOf(contentRange) {
  const m = String(contentRange || '').match(/\/(\d+|\*)$/);
  return m && m[1] !== '*' ? Number(m[1]) : null;
}

/* ---------- 본 조사 ---------- */
async function main() {
  const startedAt = new Date().toISOString();
  const result = { tool: 'probe.js (읽기만)', startedAt, accounts: {}, openapi: {}, tables: {}, probes: {}, visibility: {}, paging: {}, markers: {}, stoppedBecause: null };
  fs.writeFileSync(LOG_FILE, '', { encoding: 'utf8' });

  const chk = checkEnv(process.env);
  if (!chk.ok) { result.stoppedBecause = '계정 조건 위반 — 접속 안 함: ' + chk.why; return finish(result, null); }
  const decl = readDeclared();
  result.server = { host: new URL(decl.url).host, declaredAt: 'origin/main:index.html (SUPABASE_URL · SUPABASE_ANON_KEY)', commit: decl.commit };
  const base = decl.url;
  const anonH = { apikey: decl.key, Authorization: 'Bearer ' + decl.key };
  const tokens = {};
  const authH = (label, extra) => Object.assign({ apikey: decl.key, Authorization: 'Bearer ' + tokens[label] }, extra || {});
  const COUNT = { Prefer: 'count=exact' };

  try {
    /* 1) 로그인 A · B */
    for (const label of ['A', 'B']) {
      const email = process.env['OG_TEST_' + label + '_EMAIL'].trim();
      const r = await send(base, 'POST', '/auth/v1/token?grant_type=password', { apikey: decl.key, 'Content-Type': 'application/json' },
        { email, password: process.env['OG_TEST_' + label + '_PASSWORD'] }, { as: label, why: '로그인(세션 받기)' });
      const j = r.json || {};
      if (r.status !== 200 || !j.access_token || !j.user) {
        result.accounts[label] = { login: false, status: r.status, errorCode: j.error_code || j.code || j.error || null };
        if (label === 'A') { result.stoppedBecause = 'A 로그인 실패(status ' + r.status + ') — 여기서 멈춤'; return finish(result, { base, decl, tokens }); }
        continue;
      }
      const serverEmail = String(j.user.email || '').toLowerCase();
      if (!ACCOUNT_MARK.test(serverEmail) || serverEmail !== email.toLowerCase()) {
        tokens[label] = j.access_token;
        result.stoppedBecause = label + ' 로그인 응답의 주소가 시험 계정 조건과 다름 — 멈춤';
        return finish(result, { base, decl, tokens });
      }
      tokens[label] = j.access_token;
      state.uids[label] = j.user.id;
      result.accounts[label] = {
        login: true, emailHead: email.slice(0, 3) + '***', hasOgtest: true,
        accountCreatedAt: j.user.created_at || null, lastSignInAt: j.user.last_sign_in_at || null,
        tokenLifetimeSec: j.expires_in || null, role: j.user.role || null,
        sideEffects: ['인증 쪽에 세션 1개 · 갱신 토큰 1개 생성', '마지막 로그인 시각 갱신', '인증 감사 기록(있다면) 1줄']
      };
    }
    const A = state.uids.A, B = state.uids.B || null;

    /* 2) OpenAPI 문서: 공개 키 -> 안 열리면 로그인 토큰 */
    for (const who of ['anon', 'A']) {
      const r = await send(base, 'GET', '/rest/v1/', Object.assign({ Accept: 'application/openapi+json' }, who === 'anon' ? anonH : authH('A')), null, { as: who, why: 'OpenAPI 문서가 열리는가' });
      const doc = r.json;
      const defs = doc && doc.definitions ? doc.definitions : null;
      const o = { status: r.status, errorCode: r.entry.errorCode, hasDefinitions: !!defs, definitionCount: defs ? Object.keys(defs).length : 0, tables: {} };
      if (defs) {
        ['checkins', 'goals', 'users'].forEach((t) => {
          const d = defs[t];
          if (!d) { o.tables[t] = null; return; }
          const props = {};
          Object.keys(d.properties || {}).forEach((c) => {
            const p = d.properties[c];
            const desc = String(p.description || '');
            props[c] = {
              type: p.type || null, format: p.format || null,
              default: Object.prototype.hasOwnProperty.call(p, 'default') ? p.default : undefined,
              primaryKey: /<pk\/>/.test(desc) || undefined,
              foreignKey: (desc.match(/<fk table='([^']+)' column='([^']+)'\/>/) || []).slice(1, 3).join('.') || undefined,
              maxLength: p.maxLength, enum: p.enum, items: p.items && (p.items.type || p.items.format) || undefined
            };
          });
          o.tables[t] = { required: d.required || [], properties: props };
        });
      }
      result.openapi[who] = o;
      if (defs && o.tables.checkins) break;
    }

    /* 3) 자기 행 전체(앱의 조회와 같은 조건 + 전체 개수) */
    const own = { A: {}, B: {} };
    const ownerCol = { checkins: 'user_id', goals: 'user_id', users: 'id' };
    const fullQuery = {
      checkins: (u) => '/rest/v1/checkins?select=*&user_id=eq.' + u + '&order=start_at.desc',
      goals: (u) => '/rest/v1/goals?select=*&user_id=eq.' + u + '&order=created_at.asc',
      users: (u) => '/rest/v1/users?select=*&id=eq.' + u
    };
    for (const label of ['A', 'B']) {
      if (!tokens[label]) continue;
      result.tables[label] = {};
      for (const t of ['checkins', 'goals', 'users']) {
        const r = await send(base, 'GET', fullQuery[t](state.uids[label]), authH(label, COUNT), null, { as: label, why: '자기 행 전체(select=*) + 전체 개수' });
        const rows = Array.isArray(r.json) ? r.json : [];
        own[label][t] = rows;
        const s = Array.isArray(r.json) ? summarizeRows(t, rows) : { rowCount: null };
        s.status = r.status; s.errorCode = r.entry.errorCode; s.contentRange = r.entry.contentRange; s.total = totalOf(r.entry.contentRange);
        s.returnedEqualsTotal = (s.total !== null && Array.isArray(r.json)) ? rows.length === s.total : null;
        if (Array.isArray(r.json)) s.foreignOwnerRows = rows.filter((x) => String(x[ownerCol[t]]) !== state.uids[label]).length;
        result.tables[label][t] = s;
      }
    }

    /* 4) 칸 유무 재기(A 의 자기 행 조건으로, 42703 = 칸 없음) */
    for (const t of ['checkins', 'goals', 'users']) {
      result.probes[t] = {};
      for (const c of PROBE_COLS) {
        const r = await send(base, 'GET', '/rest/v1/' + t + '?select=' + c + '&' + ownerCol[t] + '=eq.' + A + '&limit=1', authH('A'), null, { as: 'A', why: '칸 유무: ' + t + '.' + c });
        let verdict;
        if (r.status === 200) verdict = '있음';
        else if (r.entry.errorCode === '42703') verdict = '없음(42703)';
        else if (r.entry.errorCode === '42501') verdict = '있으나 읽기 거절(42501)';
        else verdict = '판정불가(' + r.status + ' ' + (r.entry.errorCode || '') + ')';
        const v = (r.status === 200 && Array.isArray(r.json) && r.json.length) ? describe([r.json[0][c]], 1).kinds : null;
        result.probes[t][c] = { verdict, status: r.status, rows: r.entry.rows, valueKind: v };
      }
    }

    /* 5) 지운 행이 주인에게 보이는가 */
    result.deleted = {};
    for (const label of ['A', 'B']) {
      if (!tokens[label]) continue;
      result.deleted[label] = {};
      for (const t of ['checkins', 'goals']) {
        if (!/^있음/.test(result.probes[t].deleted_at.verdict)) { result.deleted[label][t] = { skipped: 'deleted_at 칸 없음/판정불가' }; continue; }
        const r = await send(base, 'GET', '/rest/v1/' + t + '?select=id,deleted_at&user_id=eq.' + state.uids[label] + '&deleted_at=not.is.null', authH(label, COUNT), null, { as: label, why: '지운 행이 주인에게 보이는가' });
        result.deleted[label][t] = { status: r.status, rows: r.entry.rows, total: totalOf(r.entry.contentRange), errorCode: r.entry.errorCode,
          deletedAtShapes: Array.isArray(r.json) ? describe(r.json.map((x) => x.deleted_at), 0).kinds : null };
      }
    }

    /* 6) 쪽 나눔: limit · offset 이 Content-Range 에 어떻게 나오는가(자기 행) */
    result.paging.limitTests = [];
    for (const t of ['checkins', 'goals']) {
      for (const q of ['&limit=1', '&limit=1&offset=1']) {
        const r = await send(base, 'GET', '/rest/v1/' + t + '?select=id&user_id=eq.' + A + q, authH('A', COUNT), null, { as: 'A', why: '쪽 나눔 머리말 확인' });
        result.paging.limitTests.push({ table: t, q, status: r.status, rows: r.entry.rows, contentRange: r.entry.contentRange });
      }
    }

    /* 7) 남의 행이 보이는가 — id · 주인 id 만 받아 개수만 센다(내용 칸은 요청하지 않는다) */
    for (const who of ['A', 'B', 'anon']) {
      if (who !== 'anon' && !tokens[who]) continue;
      const me = who === 'anon' ? null : state.uids[who];
      const H = who === 'anon' ? Object.assign({}, anonH, COUNT) : authH(who, COUNT);
      result.visibility[who] = {};
      for (const t of ['checkins', 'goals', 'users']) {
        const oc = ownerCol[t];
        const sel = t === 'users' ? 'id' : 'id,user_id';
        const r1 = await send(base, 'GET', '/rest/v1/' + t + '?select=' + sel + '&limit=50', H, null, { as: who, why: '주인 조건 없이 조회(개수만)' });
        const rows1 = Array.isArray(r1.json) ? r1.json : [];
        const v = { status: r1.status, errorCode: r1.entry.errorCode, returned: rows1.length, visibleTotal: totalOf(r1.entry.contentRange),
          notMineInSample: me ? rows1.filter((x) => String(x[oc]) !== me).length : rows1.length };
        if (me) {
          const r2 = await send(base, 'GET', '/rest/v1/' + t + '?select=id&' + oc + '=neq.' + me + '&limit=1', H, null, { as: who, why: '내 것이 아닌 행의 개수' });
          v.notMineTotal = totalOf(r2.entry.contentRange); v.notMineStatus = r2.status; v.notMineErrorCode = r2.entry.errorCode;
        }
        result.visibility[who][t] = v;
      }
    }
    /* 7-b) 시험 계정끼리: A 가 B 의 행을, B 가 A 의 행을 (상대도 시험 계정이라 남의 본문이 아니다. 그래도 칸 이름과 개수만 남긴다) */
    result.visibility.cross = {};
    if (B) {
      for (const [viewer, target] of [['A', 'B'], ['B', 'A']]) {
        const c = {};
        for (const t of ['checkins', 'goals']) {
          const r = await send(base, 'GET', '/rest/v1/' + t + '?select=id,user_id&user_id=eq.' + state.uids[target] + '&limit=50', authH(viewer, COUNT), null, { as: viewer, why: '시험 계정 ' + target + ' 의 행이 ' + viewer + ' 에게 보이는가(개수)' });
          c[t] = { status: r.status, rows: r.entry.rows, total: totalOf(r.entry.contentRange), errorCode: r.entry.errorCode, targetOwnTotal: result.tables[target] && result.tables[target][t] ? result.tables[target][t].total : null };
        }
        const ru = await send(base, 'GET', '/rest/v1/users?select=*&id=eq.' + state.uids[target], authH(viewer), null, { as: viewer, why: '시험 계정 ' + target + ' 의 users 행에서 보이는 칸 이름' });
        const row = Array.isArray(ru.json) && ru.json[0] ? ru.json[0] : null;
        c.users = { status: ru.status, rows: ru.entry.rows, errorCode: ru.entry.errorCode, visibleColumns: row ? Object.keys(row) : null,
          nonNullColumns: row ? Object.keys(row).filter((k) => row[k] !== null) : null };
        result.visibility.cross[viewer + '->' + target] = c;
      }
    }

    /* 8) 한 번의 조회 상한: 보이는 행이 1000 을 넘는 표가 있을 때만 id 만 받아 돌아온 수를 센다 */
    result.paging.capTest = [];
    const seen = {};
    for (const who of ['A', 'anon']) {
      for (const t of ['checkins', 'goals', 'users']) {
        const vt = result.visibility[who] && result.visibility[who][t] ? result.visibility[who][t].visibleTotal : null;
        if (vt !== null && vt > 1000 && !seen[t]) {
          seen[t] = true;
          const H = who === 'anon' ? Object.assign({}, anonH, COUNT) : authH(who, COUNT);
          const r = await send(base, 'GET', '/rest/v1/' + t + '?select=id', H, null, { as: who, why: '상한 확인: 제한 없이 id 만(개수만 센다)' });
          result.paging.capTest.push({ table: t, as: who, visibleTotal: vt, returned: r.entry.rows, status: r.status, contentRange: r.entry.contentRange });
        }
      }
    }
    result.paging.maxVisibleTotals = {};
    ['A', 'B', 'anon'].forEach((who) => { if (result.visibility[who]) result.paging.maxVisibleTotals[who] = { checkins: result.visibility[who].checkins.visibleTotal, goals: result.visibility[who].goals.visibleTotal, users: result.visibility[who].users.visibleTotal }; });

    /* 9) 하네스 표식(runTag)이 붙은 자기 행: 개수만 */
    for (const label of ['A', 'B']) {
      if (!tokens[label]) continue;
      const m = { checkins_text: result.tables[label].checkins.harnessTaggedRows, goals_title: result.tables[label].goals.harnessTaggedRows,
        users_row_anywhere: result.tables[label].users.harnessTaggedAnywhere };
      for (const [t, col] of [['checkins', 'text'], ['goals', 'title'], ['team_pings', 'message'], ['team_ping_replies', 'message']]) {
        const oc = (t === 'checkins' || t === 'goals') ? 'user_id' : 'sender_id';
        const r = await send(base, 'GET', '/rest/v1/' + t + '?select=id&' + oc + '=eq.' + state.uids[label] + '&' + col + '=ilike.*ogtest-*&limit=1', authH(label, COUNT), null, { as: label, why: '하네스 표식 붙은 자기 행 개수' });
        m[t + '_serverCount'] = { status: r.status, total: totalOf(r.entry.contentRange), errorCode: r.entry.errorCode };
      }
      result.markers[label] = m;
    }
  } catch (e) {
    result.stoppedBecause = '오류로 멈춤: ' + maskIds(String(e && e.message || e)).slice(0, 200);
  }
  return finish(result, { base, decl, tokens });
}

async function finish(result, ctx) {
  /* 로그아웃(이 세션만) — 인증 쪽 호출이며 표를 고치지 않는다 */
  result.logout = {};
  if (ctx && ctx.tokens) {
    for (const label of Object.keys(ctx.tokens)) {
      try {
        const r = await send(ctx.base, 'POST', '/auth/v1/logout?scope=local', { apikey: ctx.decl.key, Authorization: 'Bearer ' + ctx.tokens[label] }, null, { as: label, why: '로그아웃(이 세션만)' });
        result.logout[label] = r.status;
      } catch (e) { result.logout[label] = '실패: ' + String(e && e.message || e).slice(0, 80); }
    }
  }
  result.finishedAt = new Date().toISOString();
  const methods = {};
  state.log.forEach((l) => { const k = l.method + ' ' + (l.kind); methods[k] = (methods[k] || 0) + 1; });
  result.requests = {
    total: state.n, byKind: state.counts, byMethodKind: methods,
    restNonGet: state.log.filter((l) => l.kind === 'rest-GET' && l.method !== 'GET').length,
    restWriteOrRpc: 0,
    statusCounts: state.log.reduce((a, l) => { const k = String(l.status); a[k] = (a[k] || 0) + 1; return a; }, {})
  };
  let text = JSON.stringify(result, null, 2);
  /* 마지막 안전망: 결과에 계정 id · 토큰 꼴이 섞였으면 가린다 */
  text = maskIds(text).replace(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, '<가림>');
  fs.writeFileSync(RESULT_FILE, text + '\n', { encoding: 'utf8' });
  console.log('요청 ' + state.n + '건 ' + JSON.stringify(state.counts) + ' / 멈춘 까닭: ' + (result.stoppedBecause || '없음') + ' / 로그아웃: ' + JSON.stringify(result.logout));
  return result.stoppedBecause ? 1 : 0;
}

main().then((code) => { process.exitCode = code; }).catch((e) => { console.error('치명 오류: ' + String(e && e.message || e).slice(0, 200)); process.exitCode = 2; });
