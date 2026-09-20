'use strict';
// 법정(court) — git 사실 조회. 보고서의 git 상태는 작업자가 타이핑하지 않고 전부 여기서 읽는다.
// 저장소 상태를 바꾸는 명령은 쓰지 않는다(스냅샷은 임시 인덱스 파일로 뽑는다).
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

function git(repo, args, env) {
  return execFileSync('git', ['-C', repo, ...args], {
    encoding: 'utf8', maxBuffer: 512 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
    env: env ? { ...process.env, ...env } : process.env,
  });
}

function tryGit(repo, args, env) {
  try { return { ok: true, out: git(repo, args, env).replace(/\s+$/, '') }; }
  catch (e) { return { ok: false, out: String((e.stderr && e.stderr.toString()) || e.message || '').trim() }; }
}

// rev → 커밋 SHA(40자). 없는 브랜치·없는 커밋이면 null. "없는 브랜치를 보고서에 적는" 사고를 여기서 끊는다.
function revParse(repo, rev) {
  if (typeof rev !== 'string' || !rev.trim() || rev.startsWith('-')) return null;
  const r = tryGit(repo, ['rev-parse', '--verify', '--quiet', rev + '^{commit}']);
  return r.ok && /^[0-9a-f]{40}$/.test(r.out) ? r.out : null;
}

function refExists(repo, ref) { return revParse(repo, ref) !== null; }

function mergeBase(repo, a, b) {
  const r = tryGit(repo, ['merge-base', a, b]);
  return r.ok && /^[0-9a-f]{40}$/.test(r.out) ? r.out : null;
}

// 커밋의 트리를 destDir 에 그대로 푼다. 작업폴더·인덱스·HEAD 를 건드리지 않는다.
function snapshot(repo, rev, destDir) {
  const sha = revParse(repo, rev);
  if (!sha) throw new Error('스냅샷 실패: 존재하지 않는 rev ' + rev);
  fs.mkdirSync(destDir, { recursive: true });
  const tmpIndex = path.join(os.tmpdir(), 'court-index-' + process.pid + '-' + sha.slice(0, 12) + '-' + Math.random().toString(36).slice(2));
  const env = { GIT_INDEX_FILE: tmpIndex };
  try {
    git(repo, ['read-tree', sha], env);
    const prefix = path.resolve(destDir).replace(/\\/g, '/') + '/';
    git(repo, ['-c', 'core.autocrlf=false', '-c', 'core.eol=lf', 'checkout-index', '-a', '-f', '--prefix=' + prefix], env);
  } finally {
    try { fs.unlinkSync(tmpIndex); } catch (_) { /* 임시 인덱스가 없을 수 있다 */ }
  }
  return { sha, dir: path.resolve(destDir) };
}

function fileAt(repo, rev, filePath) {
  const r = tryGit(repo, ['show', rev + ':' + filePath.replace(/\\/g, '/')]);
  return r.ok ? r.out : null;
}

// base..head 사이에 바뀐 파일 목록 [{path, status, added, deleted, oldPath?}]
function changedFiles(repo, base, head) {
  const names = git(repo, ['diff', '--name-status', '-M', '-z', base, head]).split('\0').filter(s => s.length);
  const status = new Map();
  for (let i = 0; i < names.length;) {
    const code = names[i];
    if (/^[RC]\d*$/.test(code)) { status.set(names[i + 2], { status: code[0], oldPath: names[i + 1] }); i += 3; }
    else { status.set(names[i + 1], { status: code[0] }); i += 2; }
  }
  const out = [];
  const num = git(repo, ['diff', '--numstat', '-M', '-z', base, head]).split('\0');
  for (let i = 0; i < num.length; i++) {
    const m = /^(\d+|-)\t(\d+|-)\t(.*)$/.exec(num[i]);
    if (!m) continue;
    let p = m[3];
    if (p === '') { p = num[i + 2]; i += 2; } // 이름 변경: "added\tdeleted\t" 다음에 old, new 가 따로 온다
    const st = status.get(p) || { status: 'M' };
    out.push({ path: p, status: st.status, oldPath: st.oldPath || null, added: m[1] === '-' ? null : Number(m[1]), deleted: m[2] === '-' ? null : Number(m[2]) });
  }
  return out;
}

// 한 파일의 base→head 통합 diff 원문(금고의 '단언 삭제' 판정에 쓴다)
function fileDiff(repo, base, head, filePath) {
  const r = tryGit(repo, ['diff', '-U0', base, head, '--', filePath]);
  return r.ok ? r.out : '';
}

// 보고서 Block 1 을 대체하는 git 사실. 전부 git 에서 직접 읽는다.
function headFacts(repo, headRev, mainRemote) {
  const remoteMain = mainRemote || 'origin/main';
  const headSha = revParse(repo, headRev || 'HEAD');
  const branch = tryGit(repo, ['rev-parse', '--abbrev-ref', 'HEAD']);
  const porcelain = tryGit(repo, ['status', '--porcelain', '--untracked-files=all']);
  const lines = porcelain.ok && porcelain.out ? porcelain.out.split('\n') : [];
  const untracked = lines.filter(l => l.startsWith('??')).length;
  const dirtyTracked = lines.length - untracked;
  const facts = {
    headRev: headRev || 'HEAD', headSha,
    currentBranch: branch.ok ? branch.out : null,
    dirtyTrackedFiles: dirtyTracked, untrackedFiles: untracked,
    remoteMain, remoteMainSha: revParse(repo, remoteMain),
    aheadOfRemoteMain: null, behindRemoteMain: null,
    onRemoteBranches: [], pushed: null,
  };
  if (headSha && facts.remoteMainSha) {
    const c = tryGit(repo, ['rev-list', '--left-right', '--count', headSha + '...' + facts.remoteMainSha]);
    const m = c.ok ? /^(\d+)\s+(\d+)$/.exec(c.out) : null;
    if (m) { facts.aheadOfRemoteMain = Number(m[1]); facts.behindRemoteMain = Number(m[2]); }
  }
  if (headSha) {
    const rb = tryGit(repo, ['branch', '-r', '--contains', headSha]);
    facts.onRemoteBranches = rb.ok && rb.out ? rb.out.split('\n').map(s => s.trim()).filter(s => s && !s.includes('->')) : [];
    facts.pushed = facts.onRemoteBranches.length > 0;
  }
  return facts;
}

module.exports = { git, tryGit, revParse, refExists, mergeBase, snapshot, fileAt, changedFiles, fileDiff, headFacts };
