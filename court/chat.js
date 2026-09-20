#!/usr/bin/env node
'use strict';
// 법정(court) — 채팅 보고의 첫 블록을 만드는 도구.
//   node court/chat.js <PR번호|작업 커밋 sha> [--json]
// 왜 있는가: 작업자가 상민님께 올리는 완료 보고의 첫 블록은 "법정 판정서의 첫 네 줄 그대로"여야 한다(헌법 제8조 제3항 3호).
//   손으로 옮겨 적으면 고쳐 적을 수 있다. 그래서 GitHub 에 찍힌 판정을 기계가 읽어 그대로 출력한다.
// 이 도구는 판정을 계산하지 않는다. 로컬에서 법정을 돌리지도 않는다 — 작업자 PC 에서 돌린 법정 출력은 예비 점검일 뿐 판정이 아니다(제7조 제10항 2호).
// 믿는 것은 둘뿐이다:
//   ① 그 커밋의 검사 기록 중 이름이 court 이고 발급 주체가 GitHub Actions 앱(app.id 15368)인 것 — 같은 이름의 검사를 다른 주체가 만들어도 무시한다.
//   ② 그 PR 의 댓글 중 github-actions[bot] 이 쓴 <!-- court-verdict --> 댓글 — 사람·작업자 계정이 같은 표식으로 단 댓글은 무시한다.
// 표준출력에는 보고에 그대로 붙일 블록만 낸다. 조회 경과·사유는 표준오류로 낸다.
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ACTIONS_APP_ID = 15368;
const CHECK_NAME = 'court';
const MARKER = '<!-- court-verdict -->';
const BOT = 'github-actions[bot]';
const NOT_YET = '법정 심사 전 — 아래는 전부 작업자 주장입니다';
const LOOKUP_FAILED = '법정 판정을 조회하지 못했습니다(심사 전으로 취급)';
const REPO_ROOT = path.resolve(__dirname, '..');

// gh api 한 번. {owner}/{repo} 자리표시는 gh 가 이 저장소의 원격에서 채운다(저장소 이름을 코드에 박지 않는다).
function ghApi(endpoint) {
  const r = spawnSync('gh', ['api', '-H', 'Accept: application/vnd.github+json', endpoint], { cwd: REPO_ROOT, encoding: 'utf8', timeout: 30000, maxBuffer: 32 * 1024 * 1024, windowsHide: true });
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
function parseVerdictComment(body) {
  if (typeof body !== 'string' || !body.startsWith(MARKER)) return null;
  const meta = /<!-- court-meta head=([0-9a-f]{40}|unknown) verdictId=([0-9A-Fa-f]{8}|none) run=(\d+) -->/.exec(body);
  if (!meta) return null;
  const lines = [];
  for (const raw of body.split('\n')) {
    const l = raw.replace(/\s+$/, '');
    if (!l || l.startsWith('<!--')) continue;
    const m = /^\*\*(.+)\*\*$/.exec(l);
    if (!m) break; // 첫 네 줄은 표식 바로 아래에 연달아 있다. 다른 줄이 나오면 거기서 끝이다.
    lines.push(decode(m[1]));
    if (lines.length === 4) break;
  }
  if (lines.length !== 4 || !lines[0].startsWith('판정: ')) return null;
  return { head: meta[1], verdictId: meta[2], run: meta[3], lines };
}

function listComments(prNumber) {
  const all = [];
  for (let page = 1; page <= 20; page++) {
    const r = ghApi('repos/{owner}/{repo}/issues/' + prNumber + '/comments?per_page=100&page=' + page);
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

function lookup(target) {
  const notes = [];
  const done = (state, lines, extra) => ({ state, lines, notes, ...(extra || {}) });
  const failed = r => done(r.missing ? 'gh-missing' : 'lookup-failed', [LOOKUP_FAILED]);

  // 1) 대상 → 작업 커밋 sha 와 PR
  let sha = null, pr = null;
  if (target.kind === 'pr') {
    const r = ghApi('repos/{owner}/{repo}/pulls/' + target.value);
    if (!r.ok) { notes.push('PR #' + target.value + ' 조회: ' + r.why); return r.notFound ? done('not-yet', [NOT_YET]) : failed(r); }
    pr = r.data; sha = pr.head.sha;
  } else {
    const r = ghApi('repos/{owner}/{repo}/commits/' + target.value);
    if (!r.ok) { notes.push('커밋 ' + target.value + ' 조회: ' + r.why + (r.notFound ? ' — GitHub 에 없는 커밋이다(올리지 않았거나 없는 sha)' : '')); return r.notFound ? done('not-yet', [NOT_YET]) : failed(r); }
    sha = r.data.sha;
    const prs = ghApi('repos/{owner}/{repo}/commits/' + sha + '/pulls');
    if (!prs.ok && !prs.notFound) { notes.push('커밋의 PR 조회: ' + prs.why); return failed(prs); }
    const hits = (prs.ok ? prs.data : []).filter(p => p.head && p.head.sha === sha);
    pr = hits.find(p => p.state === 'open') || hits[0] || null;
  }

  // 2) 그 커밋의 court 검사 기록 — 이름과 발급 주체를 둘 다 본다.
  const cr = ghApi('repos/{owner}/{repo}/commits/' + sha + '/check-runs?check_name=' + CHECK_NAME + '&filter=latest&per_page=100');
  if (!cr.ok) { notes.push('검사 기록 조회: ' + cr.why); return cr.notFound ? done('not-yet', [NOT_YET], { sha }) : failed(cr); }
  const runs = (cr.data.check_runs || []).filter(c => c.name === CHECK_NAME && c.app && c.app.id === ACTIONS_APP_ID)
    .sort((a, b) => String(b.started_at || '').localeCompare(String(a.started_at || '')));
  const check = runs[0] || null;
  if (!check) { notes.push('커밋 ' + sha.slice(0, 7) + ' 에 법정(court) 검사 기록이 없다'); return done('not-yet', [NOT_YET], { sha, pr: pr && pr.number }); }
  if (check.status !== 'completed') { notes.push('법정 심사가 진행 중이다(' + check.status + '): ' + check.html_url); return done('not-yet', [NOT_YET], { sha, pr: pr && pr.number, checkUrl: check.html_url }); }

  // 3) 그 PR 의 법정 댓글(첫 네 줄). 댓글이 이 커밋의 것인지, 검사 결론과 맞는지 확인한 뒤에만 옮긴다.
  const tail = 'GitHub court 검사 결론: ' + conclusionText(check.conclusion) + ' · ' + check.html_url;
  const noComment = why => { notes.push(why); return done('no-comment', ['법정 판정서 댓글을 찾지 못했습니다 — 첫 네 줄을 옮길 수 없습니다. 아래 검사 결론만 사실이며, 그 밖은 전부 작업자 주장입니다.', tail], { sha, pr: pr && pr.number, conclusion: check.conclusion, checkUrl: check.html_url }); };
  if (!pr) return noComment('이 커밋을 머리로 하는 PR 을 찾지 못했다');
  const cm = listComments(pr.number);
  if (!cm.ok) { notes.push('댓글 조회: ' + cm.why); return failed(cm); }
  const parsed = cm.data.filter(c => c.user && c.user.login === BOT && c.user.type === 'Bot').map(c => parseVerdictComment(c.body)).filter(Boolean);
  const mine = parsed.filter(p => p.head === sha).pop() || null;
  if (!mine) return noComment(parsed.length ? '법정 댓글은 있지만 다른 커밋(' + parsed[parsed.length - 1].head.slice(0, 7) + ')의 판정이다' : 'PR #' + pr.number + ' 에 법정 댓글이 아직 없다');
  const saysPass = /^판정: (통과|확인 부족)/.test(mine.lines[0]);
  if ((check.conclusion === 'success') !== saysPass) return noComment('댓글의 판정과 검사 결론이 어긋난다 — 댓글을 믿지 않는다');
  return done('verdict', mine.lines.concat([tail]), { sha, pr: pr.number, conclusion: check.conclusion, verdictId: mine.verdictId, checkUrl: check.html_url });
}

module.exports = { parseTarget, parseVerdictComment, lookup, NOT_YET, LOOKUP_FAILED, ACTIONS_APP_ID };

if (require.main === module) {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const target = parseTarget(args.find(a => !a.startsWith('--')));
  if (!target) { console.error('사용: node court/chat.js <PR번호|작업 커밋 sha(7~40자)> [--json]'); process.exit(2); }
  let res;
  try { res = lookup(target); } catch (e) { res = { state: 'lookup-failed', lines: [LOOKUP_FAILED], notes: ['도구 오류: ' + String((e && e.message) || e)] }; }
  for (const n of res.notes) console.error('(' + n + ')');
  if (json) console.log(JSON.stringify(res, null, 2)); else for (const l of res.lines) console.log(l);
  process.exit(0);
}
