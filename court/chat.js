#!/usr/bin/env node
'use strict';
// 법정(court) — 채팅 보고의 첫 블록을 만드는 도구 + 법정 고정 댓글의 형식(읽기·이력)을 한곳에 둔 모듈.
//   node court/chat.js <PR번호|작업 커밋 sha> [--json]
//   node court/chat.js --history-check <PR번호> --verdict <verdict.json> [--out <파일>]   (GitHub 의 court 워크플로가 쓴다)
// 왜 있는가: 작업자가 상민님께 올리는 완료 보고의 첫 블록은 "법정 판정서 머리의 굵은 네 줄 그대로"여야 한다(헌법 제8조 제3항 3호).
//   손으로 옮겨 적으면 고쳐 적을 수 있다. 그래서 GitHub 에 찍힌 판정을 기계가 읽어 그대로 출력한다.
// 이 도구는 판정을 계산하지 않는다. 로컬에서 법정을 돌리지도 않는다 — 작업자 PC 에서 돌린 법정 출력은 예비 점검일 뿐 판정이 아니다(제7조 제10항 2호).
// 믿는 것은 둘뿐이다:
//   ① 그 커밋의 검사 기록 중 이름이 court 이고 발급 주체가 GitHub Actions 앱(app.id 15368)인 것 — 같은 이름의 검사를 다른 주체가 만들어도 무시한다.
//   ② 그 PR 의 댓글 중 github-actions[bot] 이 쓴 <!-- court-verdict --> 댓글 — 사람·작업자 계정이 같은 표식으로 단 댓글은 무시한다.
//      글쓴이가 법정 계정이어도, 그 댓글을 마지막으로 고친 계정이 법정 계정이 아니면 믿지 않는다(아래 "법정 기록을 누가 고쳤는가").
// 표준출력에는 보고에 그대로 붙일 블록만 낸다. 조회 경과·사유는 표준오류로 낸다.
// 종료코드: 0 법정 판정을 옮겼다(통과든 돌려보냄이든) · 3 아직 판정이 없다 · 4 GitHub 에 없는 PR·커밋이다 · 5 조회 실패 · 2 사용법 오류
//   (--history-check: 0 바뀐 것 없음 · 1 앞서 "안 됨"이던 지시가 확인 없이 바뀜, 또는 법정 기록이 법정 아닌 계정에 의해 고쳐짐 · 2 앞선 기록을 읽지 못함)
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

const ACTIONS_APP_ID = 15368;
const CHECK_NAME = 'court';
const MARKER = '<!-- court-verdict -->';
const BOT = 'github-actions[bot]';
const NOT_YET = '법정 심사 전 — 아래는 전부 작업자 주장입니다';
const NOT_FOUND = 'GitHub 에 없는';
const LOOKUP_FAILED = '법정 판정을 조회하지 못했습니다(심사 전으로 취급)';
const EXIT = { 'verdict': 0, 'not-yet': 3, 'no-comment': 3, 'not-found': 4, 'lookup-failed': 5, 'gh-missing': 5 };
const REPO_ROOT = path.resolve(__dirname, '..');

// ── 이력(법정 고정 댓글의 숨은 한 줄) ────────────────────────────────────────────────────────────
// 왜 있는가: "앞선 심사에서 안 됨이던 지시"와 "이 PR 이 몇 번 돌려보내졌는가"는 작업 브랜치의 커밋 이력에만 기대면 안 된다
//   (브랜치 이력은 작업자가 다시 쓸 수 있는 곳이다). 그래서 법정이 PR 에 다는 고정 댓글 안에 이 두 가지를 한 줄로 남겨 두고, 다음 심사 때 다시 읽는다.
//   읽을 때는 법정 계정(github-actions[bot])이 쓴 댓글만 믿는다. 쓰는 쪽은 .github/workflows/court-publish.yml 이다.
// 모양: <!-- court-history {"v":1,"rejects":2,"shas":["<커밋 앞 12자>",…],"failed":[["R1","b"],["R3","s"]]} -->
//   rejects = 이 PR 에서 돌려보낸 횟수(같은 커밋을 다시 돌린 것은 세지 않는다) · shas = 돌려보낸 커밋들
//   failed  = 앞선 심사에서 "안 됨"이던 지시 id. "b" = 화면 동작 주장이 안 됐다 / "s" = 글자 확인 주장만 안 됐다
//   editedBy(있을 때만) = 이 댓글을 법정이 아닌 계정이 고친 적이 있다: ["계정","u"(사람 계정)|"o"(그 밖의 계정)]. 한 번 남으면 그 PR 에서는 지워지지 않는다.
const HISTORY_RE = /<!-- court-history (\{[^\n]*?\}) -->/;
const MAX_SHAS = 60, MAX_FAILED = 300;
const ESCALATE_AT = 3; // 한 PR 에서 돌려보냄이 이만큼 쌓이면 작업자는 멈추고 상민님께 보고한다(헌법 제12조). 게시 쪽(court-publish.yml)도 이 값을 쓴다.
const BUCKET_FAILED = '안 됨';
const BUCKET_CONFIRMED = '화면에서 눌러 확인';
const BUCKET_TEXT_ENOUGH = '글자만 확인(이 종류는 그걸로 충분)';
const FAILED_OUTCOMES = ['아직 안 됨', '되던 기능이 고장 남'];

function emptyHistory() { return { v: 1, rejects: 0, shas: [], failed: [] }; }

// 지시 id 는 작업자가 쓰는 글자다. 댓글 주석 안에 그대로 넣지 않는다 — 안전한 글자가 아니면 해시로 바꿔 적는다.
function reqKey(id) {
  const s = typeof id === 'string' ? id : String(id);
  return /^[A-Za-z0-9_.-]{1,40}$/.test(s) && !s.includes('--') ? s : 'x' + crypto.createHash('sha256').update(s).digest('hex').slice(0, 12);
}

// 댓글 본문 → 이력. 줄이 없으면 빈 이력, 줄은 있는데 모양이 틀리면 빈 이력 + damaged(게시 쪽이 경고를 남긴다).
function parseHistory(body) {
  const m = typeof body === 'string' ? HISTORY_RE.exec(body) : null;
  if (!m) return emptyHistory();
  try {
    const j = JSON.parse(m[1]);
    const okShas = Array.isArray(j.shas) && j.shas.length <= MAX_SHAS && j.shas.every(s => typeof s === 'string' && /^[0-9a-f]{12}$/.test(s));
    const okFailed = Array.isArray(j.failed) && j.failed.length <= MAX_FAILED && j.failed.every(p => Array.isArray(p) && p.length === 2 && typeof p[0] === 'string' && reqKey(p[0]) === p[0] && (p[1] === 'b' || p[1] === 's'));
    if (j.v !== 1 || !Number.isInteger(j.rejects) || j.rejects < 0 || j.rejects > 9999 || !okShas || !okFailed) throw new Error('shape');
    if (j.editedBy !== undefined && !validEditedBy(j.editedBy)) throw new Error('shape');
    const h = { v: 1, rejects: j.rejects, shas: j.shas.slice(), failed: j.failed.map(p => [p[0], p[1]]) };
    if (j.editedBy) h.editedBy = [j.editedBy[0], j.editedBy[1]];
    return h;
  } catch (_) { return Object.assign(emptyHistory(), { damaged: true }); }
}

function historyLine(h) {
  const j = { v: 1, rejects: h.rejects, shas: h.shas, failed: h.failed };
  if (validEditedBy(h.editedBy)) j.editedBy = h.editedBy;
  return '<!-- court-history ' + JSON.stringify(j) + ' -->';
}

// ── 법정 기록을 누가 고쳤는가 ────────────────────────────────────────────────────────────────────
// 법정 고정 댓글은 글쓴이가 법정 계정(github-actions[bot])인 것만 읽는다. 여기에 더해 "그 댓글을 마지막으로 고친 계정"도 본다
//   (GraphQL 의 IssueComment.editor — 한 번도 고쳐지지 않았으면 null). 법정 계정은 GraphQL 에서 __typename 'Bot' · login 'github-actions' 로 나온다
//   (REST 의 'github-actions[bot]' 과 표기가 다르다 — 2026-09-21 실제 댓글로 확인).
// 마지막으로 고친 계정이 법정 계정이 아니면 그 댓글에 남은 앞선 기록을 믿지 않는다: 누적 횟수를 ESCALATE_AT 이상으로 올리고, 고친 계정을 이력에 남긴다.
//   남은 뒤에는 그 PR 의 court 검사가 실패로 남는다(한 번 실패한 뒤 검사를 다시 돌리는 것으로 풀리지 않게 한다). 새 PR 로 다시 심사받는 길만 남는다.
// 조회하지 못했으면 "안 고쳐졌다"고 하지 않는다 — 못 읽었다고 답한다.
const EDITOR_QUERY = 'query($id:ID!){node(id:$id){... on IssueComment{editor{__typename login} lastEditedAt}}}';
const BOT_GRAPHQL_LOGIN = 'github-actions';

// 계정 이름은 남이 정한 글자다. 댓글 주석 안에 넣을 수 있는 글자가 아니면 '?' 로 적는다.
function safeLogin(s) { return typeof s === 'string' && /^[A-Za-z0-9_-]{1,60}$/.test(s) && !s.includes('--') ? s : '?'; }
function validEditedBy(x) { return Array.isArray(x) && x.length === 2 && typeof x[0] === 'string' && safeLogin(x[0]) === x[0] && (x[1] === 'u' || x[1] === 'o'); }

// GraphQL 응답의 data → { known, by }. known=false 는 응답 모양이 달라 알 수 없다는 뜻이다(조회 실패로 다룬다).
//   by = null(고쳐진 적 없음, 또는 법정 계정만 고침) 또는 ["계정","u"|"o"](법정이 아닌 계정이 마지막으로 고침).
function editorTrust(data) {
  const node = data && typeof data === 'object' ? data.node : null;
  if (!node || typeof node !== 'object' || !('editor' in node)) return { known: false, by: null };
  const e = node.editor;
  // 고친 기록(lastEditedAt)은 있는데 누가 고쳤는지 나오지 않으면 법정 계정이 고쳤다고 볼 수 없다.
  if (e === null || e === undefined) return { known: true, by: node.lastEditedAt ? ['?', 'o'] : null };
  if (typeof e !== 'object') return { known: false, by: null };
  if (e.__typename === 'Bot' && e.login === BOT_GRAPHQL_LOGIN) return { known: true, by: null };
  return { known: true, by: [safeLogin(e.login), e.__typename === 'User' ? 'u' : 'o'] };
}

// 판정서·댓글에 찍는 글자: "사람 계정(이름)" 또는 "법정이 아닌 계정(이름)"
function editedByText(by) {
  if (!validEditedBy(by)) return '법정이 아닌 계정(알 수 없음)';
  return (by[1] === 'u' ? '사람 계정(' : '법정이 아닌 계정(') + (by[0] === '?' ? '알 수 없음' : by[0]) + ')';
}

// 법정이 아닌 계정이 고친 기록은 믿지 않는다(순수 함수). 이미 남아 있는 계정이 있으면 처음 것을 둔다.
function distrust(h, by) {
  const out = { v: 1, rejects: Math.max(h.rejects, ESCALATE_AT), shas: h.shas.slice(), failed: h.failed.map(p => [p[0], p[1]]) };
  out.editedBy = validEditedBy(h.editedBy) ? [h.editedBy[0], h.editedBy[1]] : (validEditedBy(by) ? [by[0], by[1]] : ['?', 'o']);
  if (h.damaged) out.damaged = true;
  return out;
}

// 이미 있는 법정 댓글에서 이력 한 줄만 바꾼다(없으면 court-meta 줄 아래에 넣는다). 보이는 굵은 네 줄은 건드리지 않는다.
function withHistory(body, h) {
  const line = historyLine(h);
  if (HISTORY_RE.test(body)) return body.replace(HISTORY_RE, () => line);
  const lines = body.split('\n');
  const at = lines.findIndex(l => l.startsWith('<!-- court-meta '));
  lines.splice(at >= 0 ? at + 1 : 1, 0, line);
  return lines.join('\n');
}

// 법정 고정 댓글: 법정 계정이 쓴 표식 댓글 중 첫 번째. 게시 쪽(court-publish.yml)도 같은 함수로 고른다.
function findPinned(comments) {
  return (comments || []).find(c => c && c.user && c.user.login === BOT && c.user.type === 'Bot' && typeof c.body === 'string' && c.body.startsWith(MARKER)) || null;
}

function bucketsOf(v) {
  const reqs = v && v.rollup && Array.isArray(v.rollup.reqs) ? v.rollup.reqs : [];
  return new Map(reqs.filter(r => r && r.id !== undefined && r.id !== null).map(r => [reqKey(r.id), String(r.bucket)]));
}

// 앞서 "안 됨"이던 지시가 풀리는 길은 하나다: 법정이 다시 확인해 주는 것.
//   화면 동작 주장이 안 됐던 지시 → "화면에서 눌러 확인"이 되어야 풀린다. 글자 확인 주장만 안 됐던 지시 → 글자 확인이 충분한 종류면 그것으로도 풀린다.
function cleared(how, bucket) { return bucket === BUCKET_CONFIRMED || (how === 's' && bucket === BUCKET_TEXT_ENOUGH); }

// 앞선 심사에서 "안 됨"이던 지시 중, 새 판정에서 법정의 확인 없이 다른 칸으로 바뀌었거나 지시 목록에서 사라진 것.
//   여전히 "안 됨"인 것은 넣지 않는다(바뀐 것이 아니며, 그 판정은 어차피 돌려보냄이다).
function launderedReqs(history, v) {
  const now = bucketsOf(v);
  const out = [];
  for (const [id, how] of history.failed) {
    const bucket = now.has(id) ? now.get(id) : null;
    if (bucket === BUCKET_FAILED || cleared(how, bucket)) continue;
    out.push({ id, now: bucket === null ? '지시 목록에서 사라짐' : bucket.replace(/\s+/g, ' ').slice(0, 60) });
  }
  return out;
}

// 이번 심사를 반영한 다음 이력. ev = { sha(작업 커밋), rejected(이번 심사가 돌려보냄인가), verdict(믿을 수 있는 verdict.json 또는 null),
//   addOnly(최신 커밋이 아닌 옛 커밋의 판정이면 true — "안 됨"을 더하기만 하고, 옛 판정을 근거로 목록에서 빼지는 않는다) }
function nextHistory(prev, ev) {
  const h = { v: 1, rejects: prev.rejects, shas: prev.shas.slice(), failed: prev.failed.map(p => [p[0], p[1]]) };
  if (validEditedBy(prev.editedBy)) h.editedBy = [prev.editedBy[0], prev.editedBy[1]]; // 한 번 남은 "법정 아닌 계정이 고침"은 지워지지 않는다
  const short =typeof ev.sha === 'string' && /^[0-9a-f]{40}$/.test(ev.sha) ? ev.sha.slice(0, 12) : null;
  // 같은 커밋을 다시 돌린 것은 세지 않는다.
  if (ev.rejected && short && !h.shas.includes(short)) { h.rejects += 1; h.shas.push(short); }
  if (h.shas.length > MAX_SHAS) h.shas = h.shas.slice(-MAX_SHAS);
  if (ev.verdict) {
    const now = bucketsOf(ev.verdict);
    if (!ev.addOnly) h.failed = h.failed.filter(([id, how]) => !(now.has(id) && cleared(how, now.get(id))));
    const claims = Array.isArray(ev.verdict.claims) ? ev.verdict.claims : [];
    const reqs = ev.verdict.rollup && Array.isArray(ev.verdict.rollup.reqs) ? ev.verdict.rollup.reqs : [];
    for (const r of reqs) {
      if (!r || r.bucket !== BUCKET_FAILED) continue;
      const id = reqKey(r.id);
      const byBehavior = claims.some(c => c && c.req === r.id && FAILED_OUTCOMES.includes(c.outcome) && c.kind !== 'static');
      const failingStatic = claims.some(c => c && c.req === r.id && FAILED_OUTCOMES.includes(c.outcome) && c.kind === 'static');
      const how = !byBehavior && failingStatic ? 's' : 'b'; // 어느 쪽인지 모르면 엄한 쪽(b)
      const at = h.failed.findIndex(p => p[0] === id);
      if (at < 0) { if (h.failed.length < MAX_FAILED) h.failed.push([id, how]); } else if (how === 'b') h.failed[at][1] = 'b';
    }
  }
  return h;
}

// ── GitHub 조회 ─────────────────────────────────────────────────────────────────────────────────
// gh api 한 번. {owner}/{repo} 자리표시는 gh 가 이 저장소의 원격(또는 GH_REPO)에서 채운다(저장소 이름을 코드에 박지 않는다).
function ghApi(endpoint) { return ghRun(['api', '-H', 'Accept: application/vnd.github+json', endpoint]); }

// 댓글 하나를 마지막으로 고친 계정(GraphQL). nodeId 는 REST 댓글 목록의 node_id 다. 돌려주는 data 는 editorTrust 에 그대로 넣는다.
function lookupEditor(nodeId) {
  if (typeof nodeId !== 'string' || !/^[A-Za-z0-9_=-]{1,120}$/.test(nodeId)) return { ok: false, missing: false, notFound: false, why: '댓글 식별자(node_id)가 없다' };
  const r = ghRun(['api', 'graphql', '-f', 'query=' + EDITOR_QUERY, '-f', 'id=' + nodeId]);
  return r.ok ? { ok: true, data: r.data && r.data.data } : r;
}

function ghRun(args) {
  const r = spawnSync('gh', args, { cwd: REPO_ROOT, encoding: 'utf8', timeout: 30000, maxBuffer: 32 * 1024 * 1024, windowsHide: true });
  if (r.error) return { ok: false, missing: r.error.code === 'ENOENT', notFound: false, why: r.error.code === 'ENOENT' ? 'gh 가 설치돼 있지 않다' : String(r.error.message || r.error) };
  if (r.status !== 0) {
    const err = String(r.stderr || '').trim();
    // 없는 PR·없는 커밋은 "조회 실패"가 아니라 "GitHub 에 그런 것이 없다"는 답이다(404, 커밋은 422 로도 온다).
    return { ok: false, missing: false, notFound: /HTTP 404|HTTP 422/.test(err), why: err.split('\n')[0].slice(0, 200) || 'gh exit ' + r.status };
  }
  try { return { ok: true, data: JSON.parse(r.stdout) }; } catch (_) { return { ok: false, missing: false, notFound: false, why: 'gh 출력이 JSON 이 아니다' }; }
}

function parseTarget(arg) {
  if (typeof arg !== 'string') return null;
  const a = arg.trim().replace(/^#/, '');
  if (/^\d{1,6}$/.test(a)) return { kind: 'pr', value: Number(a) };
  if (/^[0-9a-fA-F]{7,40}$/.test(a)) return { kind: 'sha', value: a.toLowerCase() };
  return null;
}

// 댓글 글자 되돌리기: 게시 쪽(court-publish.yml)이 멘션·태그를 막으려고 바꿔 둔 두 글자만 원래대로.
function decode(s) { return s.replace(/&#64;/g, '@').replace(/&lt;/g, '<'); }

// 법정 댓글 본문 → { head, verdictId, run, lines[4] }. 형식이 다르면 null(믿지 않는다).
// 굵은 네 줄은 "본문의 1~4행"이 아니라 표식·숨은 줄(<!-- … -->)을 건너뛴 뒤 연달아 나오는 굵은 줄 네 개로 읽는다.
function parseVerdictComment(body) {
  if (typeof body !== 'string' || !body.startsWith(MARKER)) return null;
  const meta = /<!-- court-meta head=([0-9a-f]{40}|unknown) verdictId=([0-9A-Fa-f]{8}|none) run=(\d+) -->/.exec(body);
  if (!meta) return null;
  const lines = [];
  for (const raw of body.split('\n')) {
    const l = raw.replace(/\s+$/, '');
    if (!l || l.startsWith('<!--')) continue;
    const m = /^\*\*(.+)\*\*$/.exec(l);
    if (!m) break; // 굵은 네 줄은 표식 바로 아래에 연달아 있다. 다른 줄이 나오면 거기서 끝이다.
    lines.push(decode(m[1]));
    if (lines.length === 4) break;
  }
  if (lines.length !== 4 || !lines[0].startsWith('판정: ')) return null;
  return { head: meta[1], verdictId: meta[2], run: meta[3], lines };
}

function listComments(prNumber, api) {
  const all = [];
  for (let page = 1; page <= 20; page++) {
    const r = (api || ghApi)('repos/{owner}/{repo}/issues/' + prNumber + '/comments?per_page=100&page=' + page);
    if (!r.ok) return r;
    all.push(...r.data);
    if (r.data.length < 100) break;
  }
  return { ok: true, data: all };
}

function conclusionText(c) {
  if (c === 'success') return 'success(통과 또는 확인 부족)';
  if (c === 'failure') return 'failure(돌려보냄 또는 심사 못 함)';
  return String(c) + '(판정 아님 — 통과로 볼 수 없음)';
}

// 조회 시각(한국 시각). 같은 "심사 전" 한 줄이라도 언제·무엇을 조회한 결과인지 글자로 남긴다.
function kstNow(ms) { return new Date((ms === undefined ? Date.now() : ms) + 9 * 3600 * 1000).toISOString().slice(0, 16).replace('T', ' ') + ' KST'; }

// deps(선택) = { ghApi, lookupEditor } — 단위 확인에서 GitHub 조회를 가짜로 바꿔 끼우는 데만 쓴다.
function lookup(target, deps) {
  const api = (deps && deps.ghApi) || ghApi;
  const editorOf = (deps && deps.lookupEditor) || lookupEditor;
  const notes = [];
  const at = kstNow();
  const done = (state, lines, extra) => ({ state, lines, notes, checkedAt: at, ...(extra || {}) });
  const failed = r => done(r.missing ? 'gh-missing' : 'lookup-failed', [LOOKUP_FAILED + ' (' + (target.kind === 'pr' ? 'PR #' + target.value : '커밋 ' + target.value.slice(0, 7)) + ' · 조회 ' + at + ')']);
  // 심사 전: 헌법이 정한 첫 문장은 그대로 두고, 무엇을 언제 조회했는지를 뒤에 붙인다.
  const notYet = (sha, pr, why, extra) => done('not-yet', [NOT_YET + ' (' + (pr ? 'PR #' + pr : '연결된 PR 없음') + ' · 커밋 ' + sha.slice(0, 7) + ' · ' + why + ' · 조회 ' + at + ')'], { sha, pr: pr || null, ...(extra || {}) });
  // GitHub 에 없는 PR·커밋은 "심사 전"과 다른 말이다: 심사를 청구한 적도 없다.
  const notFound = what => done('not-found', [NOT_FOUND + ' ' + what + ' — 법정에 심사를 청구한 적이 없습니다. 아래는 전부 작업자 주장입니다 (조회 ' + at + ')']);

  // 1) 대상 → 작업 커밋 sha 와 PR
  let sha = null, pr = null;
  if (target.kind === 'pr') {
    const r = api('repos/{owner}/{repo}/pulls/' + target.value);
    if (!r.ok) { notes.push('PR #' + target.value + ' 조회: ' + r.why); return r.notFound ? notFound('PR 입니다: #' + target.value) : failed(r); }
    pr = r.data; sha = pr.head.sha;
  } else {
    const r = api('repos/{owner}/{repo}/commits/' + target.value);
    if (!r.ok) { notes.push('커밋 ' + target.value + ' 조회: ' + r.why); return r.notFound ? notFound('커밋입니다: ' + target.value.slice(0, 12) + ' (올리지 않았거나 없는 sha)') : failed(r); }
    sha = r.data.sha;
    const prs = api('repos/{owner}/{repo}/commits/' + sha + '/pulls');
    if (!prs.ok && !prs.notFound) { notes.push('커밋의 PR 조회: ' + prs.why); return failed(prs); }
    const hits = (prs.ok ? prs.data : []).filter(p => p.head && p.head.sha === sha);
    pr = hits.find(p => p.state === 'open') || hits[0] || null;
  }
  const prNo = pr ? pr.number : null;

  // 2) 그 커밋의 court 검사 기록 — 이름과 발급 주체를 둘 다 본다.
  const cr = api('repos/{owner}/{repo}/commits/' + sha + '/check-runs?check_name=' + CHECK_NAME + '&filter=latest&per_page=100');
  if (!cr.ok) { notes.push('검사 기록 조회: ' + cr.why); return cr.notFound ? notYet(sha, prNo, 'court 검사 기록 없음') : failed(cr); }
  const runs = (cr.data.check_runs || []).filter(c => c.name === CHECK_NAME && c.app && c.app.id === ACTIONS_APP_ID)
    .sort((a, b) => String(b.started_at || '').localeCompare(String(a.started_at || '')));
  const check = runs[0] || null;
  if (!check) { notes.push('커밋 ' + sha.slice(0, 7) + ' 에 법정(court) 검사 기록이 없다'); return notYet(sha, prNo, 'court 검사 기록 없음' + (pr && pr.state !== 'open' ? '(PR 상태 ' + pr.state + ')' : '')); }
  if (check.status !== 'completed') { notes.push('법정 심사가 진행 중이다(' + check.status + '): ' + check.html_url); return notYet(sha, prNo, 'court 검사 진행 중', { checkUrl: check.html_url }); }

  // 3) 그 PR 의 법정 댓글(굵은 네 줄). 댓글이 이 커밋의 것인지, 검사 결론과 맞는지 확인한 뒤에만 옮긴다.
  const tail = 'GitHub court 검사 결론: ' + conclusionText(check.conclusion) + ' · ' + check.html_url;
  const noComment = why => { notes.push(why); return done('no-comment', ['법정 판정서 댓글을 찾지 못했습니다 — 굵은 네 줄을 옮길 수 없습니다. 아래 검사 결론만 사실이며, 그 밖은 전부 작업자 주장입니다. (' + (prNo ? 'PR #' + prNo + ' · ' : '') + '커밋 ' + sha.slice(0, 7) + ' · 조회 ' + at + ')', tail], { sha, pr: prNo, conclusion: check.conclusion, checkUrl: check.html_url }); };
  if (!pr) return noComment('이 커밋을 머리로 하는 PR 을 찾지 못했다');
  const cm = listComments(pr.number, api);
  if (!cm.ok) { notes.push('댓글 조회: ' + cm.why); return failed(cm); }
  const parsed = cm.data.filter(c => c.user && c.user.login === BOT && c.user.type === 'Bot').map(c => ({ comment: c, p: parseVerdictComment(c.body) })).filter(x => x.p);
  const hit = parsed.filter(x => x.p.head === sha).pop() || null;
  const mine = hit ? hit.p : null;
  if (!mine) return noComment(parsed.length ? '법정 댓글은 있지만 다른 커밋(' + parsed[parsed.length - 1].p.head.slice(0, 7) + ')의 판정이다' : 'PR #' + pr.number + ' 에 법정 댓글이 아직 없다');
  const saysPass = /^판정: (통과|확인 부족)/.test(mine.lines[0]);
  if ((check.conclusion === 'success') !== saysPass) return noComment('댓글의 판정과 검사 결론이 어긋난다 — 댓글을 믿지 않는다');
  // 굵은 네 줄을 옮기기 전에, 그 댓글을 마지막으로 고친 계정이 법정 계정인지 본다. 못 읽었으면 옮기지 않는다(조회 실패).
  const ed = editorOf(hit.comment.node_id);
  if (!ed.ok) { notes.push('법정 댓글을 마지막으로 고친 계정 조회: ' + ed.why); return failed(ed); }
  const trust = editorTrust(ed.data);
  if (!trust.known) { notes.push('법정 댓글을 마지막으로 고친 계정 조회: 응답 모양이 다르다'); return failed({ missing: false }); }
  if (trust.by) return noComment('법정 댓글이 ' + editedByText(trust.by) + '에 의해 고쳐졌다 — 댓글을 믿지 않는다');
  return done('verdict', mine.lines.concat([tail]), { sha, pr: pr.number, conclusion: check.conclusion, verdictId: mine.verdictId, checkUrl: check.html_url });
}

// ── 앞선 심사 대조(court 워크플로용) ───────────────────────────────────────────────────────────
// 새 판정서(verdict.json)와 그 PR 의 법정 고정 댓글 이력을 맞대어, 앞서 "안 됨"이던 지시가 확인 없이 바뀌었는지 본다.
// 그 전에, 그 고정 댓글을 마지막으로 고친 계정이 법정 계정인지 본다. 아니면 앞선 기록을 믿지 않는다(state 'tampered' — 종료 1).
// GitHub 조회가 실패하면 "바뀐 것 없음"·"안 고쳐졌음"이라고 하지 않는다 — 못 읽었다고 답한다(종료 2).
function sleepMs(ms) { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); }
// 일시적인 조회 실패는 세 번까지 다시 해 본다(없는 대상·gh 없음은 다시 해도 같으므로 바로 끝낸다).
function withRetry(call) { let r = null; for (let i = 0; i < 3; i++) { r = call(); if (r.ok || r.notFound || r.missing) break; if (i < 2) sleepMs(3000); } return r; }

// fetchComments·fetchEditor(선택)는 단위 확인에서 GitHub 조회를 가짜로 바꿔 끼우는 데만 쓴다.
function historyCheck(prNumber, verdictPath, fetchComments, fetchEditor) {
  const at = kstNow();
  let v;
  try { v = JSON.parse(fs.readFileSync(verdictPath, 'utf8')); } catch (e) { return { schema: 'court-history-check/1', state: 'lookup-failed', pr: prNumber, why: 'verdict.json 을 읽지 못했다', laundered: [], checkedAt: at }; }
  const cm = withRetry(() => (fetchComments || listComments)(prNumber));
  if (!cm.ok) return { schema: 'court-history-check/1', state: 'lookup-failed', pr: prNumber, why: 'PR 댓글 조회 실패: ' + cm.why, laundered: [], checkedAt: at };
  const pinned = findPinned(cm.data);
  const history = pinned ? parseHistory(pinned.body) : emptyHistory();
  // 법정 기록을 법정이 아닌 계정이 고쳤는가. 앞서 그런 적이 있다고 이력에 남아 있으면 다시 묻지 않는다.
  let editedBy = history.editedBy || null;
  if (pinned && !editedBy) {
    const ed = withRetry(() => (fetchEditor || lookupEditor)(pinned.node_id));
    const trust = ed.ok ? editorTrust(ed.data) : { known: false, by: null };
    if (!trust.known) return { schema: 'court-history-check/1', state: 'lookup-failed', pr: prNumber, why: '법정 댓글을 마지막으로 고친 계정 조회 실패: ' + (ed.ok ? '응답 모양이 다르다' : ed.why), laundered: [], checkedAt: at };
    editedBy = trust.by;
  }
  if (editedBy) return { schema: 'court-history-check/1', state: 'tampered', pr: prNumber, editedBy, by: editedByText(editedBy), rejects: Math.max(history.rejects, ESCALATE_AT), damaged: !!history.damaged, laundered: [], checkedAt: at };
  const laundered = launderedReqs(history, v);
  return { schema: 'court-history-check/1', state: laundered.length ? 'laundered' : 'clean', pr: prNumber, rejects: history.rejects, damaged: !!history.damaged, laundered, checkedAt: at };
}

module.exports = {
  parseTarget, parseVerdictComment, lookup, kstNow, NOT_YET, NOT_FOUND, LOOKUP_FAILED, ACTIONS_APP_ID, EXIT, MARKER, BOT,
  emptyHistory, parseHistory, historyLine, withHistory, findPinned, reqKey, launderedReqs, nextHistory, historyCheck,
  ESCALATE_AT, EDITOR_QUERY, editorTrust, editedByText, validEditedBy, distrust, lookupEditor,
  // 아래 넷은 주장 판정기(claims.js)가 내는 글자와 같아야 한다 — 자가시험(selftest/unit.js)이 맞대어 본다.
  BUCKET_FAILED, BUCKET_CONFIRMED, BUCKET_TEXT_ENOUGH, FAILED_OUTCOMES,
};

if (require.main === module) {
  const args = process.argv.slice(2);
  const valueOf = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
  if (args.includes('--history-check')) {
    const prArg = valueOf('--history-check'), verdictPath = valueOf('--verdict'), outPath = valueOf('--out');
    if (!/^\d{1,6}$/.test(String(prArg || '')) || !verdictPath) { console.error('사용: node court/chat.js --history-check <PR번호> --verdict <verdict.json> [--out <파일>]'); process.exit(2); }
    const res = historyCheck(Number(prArg), verdictPath);
    if (outPath) { try { fs.writeFileSync(outPath, JSON.stringify(res, null, 2), 'utf8'); } catch (e) { console.error('(결과 파일을 쓰지 못했다: ' + String((e && e.message) || e) + ')'); } }
    if (res.state === 'lookup-failed') { console.log('앞선 심사 기록을 읽지 못했습니다 — ' + res.why + ' (심사 못 함으로 둡니다. 통과가 아닙니다)'); process.exit(2); }
    if (res.state === 'tampered') { console.log('법정 기록이 ' + res.by + '에 의해 고쳐졌습니다 — 이 PR 의 앞선 심사 기록을 믿을 수 없습니다. [결심 필요] 대상입니다(작업자는 멈추고 상민님께 보고해야 합니다)'); process.exit(1); }
    if (res.state === 'laundered') { console.log('앞선 심사에서 안 됨이던 지시 ' + res.laundered.length + '건이 확인 없이 바뀜: ' + res.laundered.map(x => x.id + ' → ' + x.now).join(' / ')); process.exit(1); }
    console.log('앞선 심사 대조: 확인 없이 바뀐 지시 없음 (이 PR 돌려보냄 누적 ' + res.rejects + '회)');
    process.exit(0);
  }
  const json = args.includes('--json');
  const target = parseTarget(args.find(a => !a.startsWith('--')));
  if (!target) { console.error('사용: node court/chat.js <PR번호|작업 커밋 sha(7~40자)> [--json]'); process.exit(2); }
  let res;
  try { res = lookup(target); } catch (e) { res = { state: 'lookup-failed', lines: [LOOKUP_FAILED], notes: ['도구 오류: ' + String((e && e.message) || e)] }; }
  for (const n of res.notes) console.error('(' + n + ')');
  if (json) console.log(JSON.stringify(res, null, 2)); else for (const l of res.lines) console.log(l);
  process.exit(EXIT[res.state] === undefined ? 5 : EXIT[res.state]);
}
