#!/usr/bin/env node
/**
 * essence-gate.js — 아워골 본질 게이트 (도구 무관: 클로드코드·안티그래비티·코덱스·사람 모두 동일)
 *
 * 모드
 *   --commit-msg <file>            commit-msg 훅: 태그·티켓 형식 검사
 *   --pre-commit                   pre-commit 훅: 현재 브랜치(main 금지)·스테이지된 diff 금지 패턴·index.html 증가 검사
 *   --check-commit <hash>          커밋 1건 전수 검사(워처·CI가 사용). JSON 출력
 *   --ci --base <sha> --head <sha> PR 범위의 모든 비병합 커밋 검사. 하나라도 block이면 exit 1
 *   --self-test                    규칙 파일·정규식 로드 확인
 *
 * 규칙 원본: docs/rules/rules.json (규범 변경은 승인선 5 — 상민님 승인 없이 수정 금지)
 * 이 파일 자체는 self-healing 자동 수정 제외 대상이다 (재는 자가 잣대를 고치지 않는다).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO = process.env.ESSENCE_REPO || (fs.existsSync(path.join(path.dirname(__dirname), 'docs', 'rules', 'rules.json')) ? path.dirname(__dirname) : findRepoRoot(process.cwd()));
const RULES_PATH = process.env.ESSENCE_RULES || path.join(REPO, 'docs', 'rules', 'rules.json');

function findRepoRoot(start) {
  let dir = start;
  for (let i = 0; i < 8; i++) {
    if (fs.existsSync(path.join(dir, 'docs', 'rules', 'rules.json'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  try { return execSync('git rev-parse --show-toplevel', { cwd: start }).toString().trim(); } catch (e) { return start; }
}

function loadRules() {
  const raw = fs.readFileSync(RULES_PATH, 'utf8');
  const rules = JSON.parse(raw);
  rules._compiled = {
    tag: new RegExp(rules.commit.tag_regex),
    prMerge: new RegExp(rules.commit.pr_merge_regex),
    forbidden: rules.forbidden_patterns.map(p => ({ ...p, _re: new RegExp(p.regex), _ex: p.exempt_if_line_matches ? new RegExp(p.exempt_if_line_matches) : null })),
    approval: rules.approval_lines.map(a => ({ ...a, _re: a.regex ? new RegExp(a.regex, 'i') : null, _mre: a.message_regex ? new RegExp(a.message_regex, 'i') : null })),
    ticket: new RegExp(rules.ticket.id_regex)
  };
  return rules;
}

function git(args, opts) {
  return execSync('git ' + args, { cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...(opts || {}) });
}

function globMatch(file, patterns) {
  const base = path.basename(file);
  return patterns.some(p => {
    if (p === '*') return true;
    if (p.includes('/')) {
      const [dir, fp] = p.split('/');
      return file.startsWith(dir + '/') && (fp === '*' || globMatch(base, [fp]));
    }
    if (p.startsWith('*.')) return base.endsWith(p.slice(1));
    return base === p;
  });
}

/* ---------- 검사 1: 커밋 메시지 ---------- */
function checkMessage(rules, message) {
  const first = (message || '').split('\n')[0].trim();
  const findings = [];
  if (rules.commit.allow_untagged_prefixes.some(p => first.startsWith(p))) return { first, tag: null, ticket: null, findings, skipped: true };
  const m = first.match(rules._compiled.tag);
  if (!m) {
    findings.push({ id: 'NO_TAG', severity: 'block', msg: `커밋 메시지에 본질 태그·티켓이 없다. 형식: ${rules.commit.example}` });
    return { first, tag: null, ticket: null, findings };
  }
  return { first, tag: m[1], ticket: m[2], findings };
}

/* ---------- 검사 2: diff 금지 패턴 · 승인선 ---------- */
function scanDiff(rules, diffText, commitMeta) {
  const findings = [];
  let file = null;
  const addedByFile = {};
  const removedByFile = {};
  for (const line of diffText.split('\n')) {
    if (line.startsWith('+++ ')) { file = line.slice(4).replace(/^b\//, ''); addedByFile[file] = addedByFile[file] || 0; removedByFile[file] = removedByFile[file] || 0; continue; }
    if (line.startsWith('--- ')) continue;
    if (!file) continue;
    if (line.startsWith('+')) {
      addedByFile[file]++;
      const body = line.slice(1);
      for (const p of rules._compiled.forbidden) {
        if (!globMatch(file, p.files)) continue;
        if (p._ex && p._ex.test(body)) continue;
        if (p._re.test(body)) findings.push({ id: p.id, severity: p.severity, file, line: body.trim().slice(0, 140), msg: p.why });
      }
      for (const a of rules._compiled.approval) {
        if (!a._re || !a.files || !globMatch(file, a.files)) continue;
        if (a._re.test(body)) findings.push({ id: a.id, severity: 'decision', file, line: body.trim().slice(0, 140), msg: `승인선: ${a.label}` });
      }
    } else if (line.startsWith('-')) {
      removedByFile[file]++;
    }
  }
  // 파일 경로 기반 승인선 (규범 변경)
  for (const a of rules._compiled.approval) {
    if (!a.paths) continue;
    for (const f of Object.keys(addedByFile)) {
      if (a.paths.some(p => f === p || f.startsWith(p))) findings.push({ id: a.id, severity: 'decision', file: f, msg: `승인선: ${a.label} — 상민님 승인 필요` });
    }
  }
  // index.html 순증가 · 대량 변경
  const idx = 'index.html';
  const growth = (addedByFile[idx] || 0) - (removedByFile[idx] || 0);
  if (growth > rules.limits.index_html_net_growth_per_commit) {
    findings.push({ id: 'INDEX_GROWTH', severity: 'block', file: idx, msg: `index.html 순증가 ${growth}줄 > 한도 ${rules.limits.index_html_net_growth_per_commit}줄. 모듈 분리 또는 커밋 분할 필요 (승인선 8)` });
  }
  const total = Object.values(addedByFile).reduce((a, b) => a + b, 0) + Object.values(removedByFile).reduce((a, b) => a + b, 0);
  if (total > rules.limits.large_change_lines) {
    findings.push({ id: 'AL8_LARGE_CHANGE', severity: 'decision', msg: `대량 변경 ${total}줄 > ${rules.limits.large_change_lines}줄 (승인선 8)` });
  }
  // 기능 삭제 승인선
  const del = rules._compiled.approval.find(a => a.id === 'AL3_FEATURE_DELETE');
  if (del && commitMeta && del._mre && del._mre.test(commitMeta.first || '') && Object.values(removedByFile).reduce((a, b) => a + b, 0) >= del.min_deleted_lines) {
    findings.push({ id: 'AL3_FEATURE_DELETE', severity: 'decision', msg: `기존 기능 삭제로 보임 (메시지+삭제 ${Object.values(removedByFile).reduce((a, b) => a + b, 0)}줄) — 승인선 3` });
  }
  // FAKE 격상
  if (findings.some(f => f.id === 'FAKE_SOCIAL_NUMBERS')) findings.push({ id: 'AL7_FAKE_METRIC_DISPLAY', severity: 'decision', msg: '위조 지표 표시 — 차단 + 즉시 결심 필요 (승인선 7)' });
  return { findings, addedByFile, removedByFile, growth, total };
}

/* ---------- 검사 3: 티켓 존재 (파일 소스만 로컬 검사, 노션은 워처가) ---------- */
function checkTicketFile(rules, ticket) {
  if (!ticket) return { exists: false, source: null };
  for (const s of rules.ticket.sources) {
    if (s.type !== 'file') continue;
    const p = path.join(REPO, s.path);
    if (fs.existsSync(p) && fs.readFileSync(p, 'utf8').includes('#' + ticket)) return { exists: true, source: s.path };
  }
  return { exists: false, source: null };
}

/* ---------- 커밋 1건 전수 검사 ---------- */
function checkCommit(rules, hash) {
  const meta = git(`show -s --format=%H%x1f%an%x1f%aI%x1f%P%x1f%s ${hash}`).trim().split('\x1f');
  const [full, author, date, parents, subject] = meta;
  const isMerge = parents.split(' ').length > 1;
  const msg = checkMessage(rules, subject);
  let diff = { findings: [], growth: 0, total: 0 };
  if (!isMerge) diff = scanDiff(rules, git(`show --format= --unified=0 ${hash}`), msg);
  const onMain = isOnBranch(hash, rules.protected_branch);
  const directOnMain = onMain && !isMerge && !rules._compiled.prMerge.test(subject) && isFirstParentOf(hash, rules.protected_branch);
  const findings = [...msg.findings, ...diff.findings];
  if (directOnMain) findings.push({ id: 'DIRECT_ON_MAIN', severity: 'block', msg: `PR 없이 ${rules.protected_branch}에 직접 들어온 커밋 (배포 = 실서비스). PR 경로만 허용` });
  const ticket = checkTicketFile(rules, msg.ticket);
  const worst = findings.some(f => f.severity === 'block') ? 'block' : findings.some(f => f.severity === 'decision') ? 'decision' : 'pass';
  return { hash: full, short: full.slice(0, 7), author, date, subject, isMerge, tag: msg.tag, ticket: msg.ticket, ticketInFile: ticket.exists, directOnMain, growth: diff.growth, total: diff.total, findings, verdict: worst };
}

function isOnBranch(hash, branch) {
  try { const out = git(`branch -a --contains ${hash}`); return out.split('\n').some(l => l.trim().replace(/^\*\s*/, '').replace(/^remotes\/origin\//, '') === branch); } catch (e) { return false; }
}
function isFirstParentOf(hash, branch) {
  const ref = ['origin/' + branch, branch].find(r => { try { git(`rev-parse --verify ${r}`); return true; } catch (e) { return false; } });
  if (!ref) return false;
  try { return git(`rev-list --first-parent ${ref} -n 400`).includes(hash); } catch (e) { return false; }
}

/* ---------- 훅 모드 ---------- */
function runCommitMsg(rules, file) {
  const message = fs.readFileSync(file, 'utf8');
  const r = checkMessage(rules, message);
  if (r.skipped) return 0;
  if (r.findings.length) { print(r.findings); return 1; }
  const t = checkTicketFile(rules, r.ticket);
  if (!t.exists) console.error(`⚠ 티켓 #${r.ticket} 이(가) docs/rules/TICKETS.md 에 없음 — 노션 통합 작업대기목록에 있으면 워처가 확인한다. 둘 다 없으면 G0 위반으로 기록된다.`);
  console.log(`✔ 본질 태그 [${r.tag}] 티켓 #${r.ticket}`);
  return 0;
}

function runPreCommit(rules) {
  const branch = git('rev-parse --abbrev-ref HEAD').trim();
  if (branch === rules.protected_branch && !process.env.ESSENCE_ALLOW_MAIN) {
    console.error(`✖ ${rules.protected_branch} 브랜치에서 직접 커밋 금지. 브랜치를 만들고 PR로 올려라 (git checkout -b feat/<날짜>-<설명>).`);
    return 1;
  }
  const diff = git('diff --cached --unified=0');
  const r = scanDiff(rules, diff, null);
  const blocks = r.findings.filter(f => f.severity === 'block');
  const decisions = r.findings.filter(f => f.severity === 'decision');
  if (decisions.length) { console.error('⚠ 승인선 해당 — 커밋은 허용하되 PR에서 [결심 필요]로 표시된다:'); print(decisions, true); }
  if (blocks.length) { print(blocks); return 1; }
  console.log(`✔ 금지 패턴 없음 · index.html 순증가 ${r.growth}줄 · 변경 ${r.total}줄`);
  return 0;
}

function runCI(rules, base, head) {
  const list = git(`rev-list --no-merges ${base}..${head}`).trim().split('\n').filter(Boolean);
  let fail = false;
  const results = list.map(h => checkCommit(rules, h));
  for (const r of results) {
    const mark = r.verdict === 'block' ? '✖' : r.verdict === 'decision' ? '⚠' : '✔';
    console.log(`${mark} ${r.short} ${r.subject}`);
    for (const f of r.findings.filter(f => f.id !== 'DIRECT_ON_MAIN')) console.log(`    - [${f.severity}] ${f.id}: ${f.msg}${f.file ? ' (' + f.file + ')' : ''}`);
    if (r.findings.some(f => f.severity === 'block' && f.id !== 'DIRECT_ON_MAIN')) fail = true;
  }
  const decisionCount = results.reduce((n, r) => n + r.findings.filter(f => f.severity === 'decision').length, 0);
  if (decisionCount) console.log(`\n⚠ 결심 필요 항목 ${decisionCount}건 — 병합 전 상민님 승인(결정 패킷) 필요`);
  return fail ? 1 : 0;
}

function print(findings, warnOnly) {
  for (const f of findings) (warnOnly ? console.warn : console.error)(`  ${warnOnly ? '⚠' : '✖'} ${f.id}: ${f.msg}${f.file ? ' — ' + f.file : ''}${f.line ? '\n      ' + f.line : ''}`);
}

/* ---------- CLI ---------- */
if (require.main === module) {
  const argv = process.argv.slice(2);
  const arg = k => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
  let rules;
  try { rules = loadRules(); } catch (e) { console.error('규칙 파일 로드 실패: ' + e.message); process.exit(2); }
  let code = 0;
  if (argv.includes('--self-test')) { console.log(`규칙 v${rules.version} · 금지 패턴 ${rules.forbidden_patterns.length} · 승인선 ${rules.approval_lines.length}`); code = 0; }
  else if (arg('--commit-msg')) code = runCommitMsg(rules, arg('--commit-msg'));
  else if (argv.includes('--pre-commit')) code = runPreCommit(rules);
  else if (arg('--check-commit')) { console.log(JSON.stringify(checkCommit(rules, arg('--check-commit')), null, 2)); code = 0; }
  else if (argv.includes('--ci')) code = runCI(rules, arg('--base'), arg('--head'));
  else { console.log('usage: essence-gate.js --commit-msg <file> | --pre-commit | --check-commit <hash> | --ci --base <sha> --head <sha> | --self-test'); code = 2; }
  process.exit(code);
}

module.exports = { loadRules, checkCommit, checkMessage, scanDiff, checkTicketFile, REPO };
