#!/usr/bin/env node
'use strict';
// #TASK-ES-620 측정 도구(작업자 측정, 판정 아님) — 이 변경이 바꾼 시험 줄 전수 표.
// `git diff -U0 <기준> -- scripts tests` 를 읽어, 바뀐 줄마다 고치기 전·후 글자와 붙잡는 이름(옛 배선 글자에서 읽는다)·그 줄이 속한 단언 줄·검사 제목을 적는다.
// 더하기만 한 줄(도우미 require 줄·시험 실행 줄·새 파일)은 additions 에 따로 적는다. 지우기만 한 줄이 있으면 removedOnly 에 적는다(0 이어야 한다).
// 사용: node reports/TASK-ES-620/changed-assertions.cjs <작업 폴더> <기준 커밋> <out.json> [--also-from <다른 작업 폴더>:<기준>]
const fs = require('fs'), path = require('path'), cp = require('child_process');
const WT = path.resolve(process.argv[2]), BASE = process.argv[3], OUT = path.resolve(process.argv[4]);
const git = (cwd, args) => cp.execFileSync('git', ['-c', 'core.quotepath=false'].concat(args), { cwd, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
const CHECK_TITLE_RE = /\bcheck\(\s*(['"`])((?:[^\\]|\\.)*?)\1/;
const LEGACY_RE = /(['"])(\s*window\.([A-Za-z_$][\w$]*)\s*=\s*([A-Za-z_$][\w$]*);?)\1/;

function collect(wt, base) {
  const rows = [], additions = [], removedOnly = [];
  const names = git(wt, ['diff', '--name-status', base, '--', 'scripts', 'tests']).split('\n').filter(Boolean).map(l => l.split('\t'));
  const untracked = git(wt, ['ls-files', '--others', '--exclude-standard', '--', 'scripts', 'tests']).split('\n').filter(Boolean);
  const newFiles = names.filter(n => n[0] === 'A').map(n => n[1]).concat(untracked);
  for (const [st, file] of names) {
    if (st !== 'M') continue;
    const after = fs.readFileSync(path.join(wt, file), 'utf8').split(/\r?\n/);
    const diff = git(wt, ['diff', '-U0', '--no-color', base, '--', file]).split('\n');
    const titleAt = line => { for (let i = Math.min(line, after.length) - 1; i >= 0; i--) { const m = CHECK_TITLE_RE.exec(after[i]); if (m) return m[2].trim(); } return null; };
    const assertNear = (line, below) => { // 그 줄이 속한 단언 줄: 자신 → 위로 2줄(여러 줄로 쓴 단언). 끝 지점 계산 줄이면 그 아래 2줄의 단언(그 값을 쓰는 단언)
      for (const i of (below ? [line + 1, line + 2] : [line, line - 1, line - 2])) if (/\bassert(\.\w+)?\(/.test(after[i - 1] || '')) return { line: i, text: (after[i - 1] || '').trim().slice(0, 300) };
      return null;
    };
    for (let i = 0; i < diff.length; i++) {
      const h = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(diff[i]);
      if (!h) continue;
      const oStart = Number(h[1]), oLen = h[2] === undefined ? 1 : Number(h[2]), nStart = Number(h[3]), nLen = h[4] === undefined ? 1 : Number(h[4]);
      const olds = [], news = [];
      for (let k = i + 1; k < diff.length && !/^@@ /.test(diff[k]) && !/^diff --git/.test(diff[k]); k++) {
        if (diff[k][0] === '-') olds.push(diff[k].slice(1).replace(/\r$/, '')); else if (diff[k][0] === '+') news.push(diff[k].slice(1).replace(/\r$/, ''));
      }
      if (oLen === 0) { news.forEach((t, j) => additions.push({ file, line: nStart + j, text: t.trim().slice(0, 300) })); continue; }
      if (nLen === 0) { olds.forEach((t, j) => removedOnly.push({ file, line: oStart + j, text: t.trim().slice(0, 300) })); continue; }
      if (olds.length !== news.length) { olds.forEach((t, j) => removedOnly.push({ file, line: oStart + j, text: t.trim().slice(0, 300), note: '짝이 맞지 않는 묶음' })); continue; }
      olds.forEach((t, j) => {
        const lg = LEGACY_RE.exec(t), lg2 = LEGACY_RE.exec(news[j]);
        const a = assertNear(nStart + j, /\.exposureEnd\(/.test(news[j]));
        rows.push({
          file, lineBefore: oStart + j, lineAfter: nStart + j,
          kind: /\bwindowExposed\(/.test(news[j]) ? 'includes → windowExposed' : (/\.exposureEnd\(/.test(news[j]) ? 'indexOf → exposureEnd(끝 지점 계산 줄 — 단언 줄은 그대로)' : '그 밖'),
          name: lg ? lg[3] : null, from: lg ? lg[4] : null, legacyText: lg ? lg[2] : null, legacyTextKept: !!(lg && lg2 && lg[2] === lg2[2]),
          before: t.trim().slice(0, 400), after: news[j].trim().slice(0, 400),
          assertion: a, check: /^scripts\/(smoke-test|verify-integrity-gate)\.js$/.test(file) ? titleAt(nStart + j) : null,
        });
      });
    }
  }
  return { rows, additions, removedOnly, newFiles };
}

const main = collect(WT, BASE);
const out = { tool: 'reports/TASK-ES-620/changed-assertions.cjs', type: '작업자 측정, 판정 아님', measuredAt: new Date().toISOString(), base: BASE,
  changed: main.rows, additions: main.additions, removedOnly: main.removedOnly, newFiles: main.newFiles };
const by = {}; main.rows.forEach(r => { by[r.file] = (by[r.file] || 0) + 1; });
out.summary = { changedLines: main.rows.length, byFile: by, names: [...new Set(main.rows.map(r => r.name))].sort(), nameCount: new Set(main.rows.map(r => r.name)).size,
  legacyTextKeptAll: main.rows.every(r => r.legacyTextKept), kinds: main.rows.reduce((a, r) => { a[r.kind] = (a[r.kind] || 0) + 1; return a; }, {}),
  checks: [...new Set(main.rows.filter(r => r.check).map(r => r.file + ' :: ' + r.check))].length, additions: main.additions.length, removedOnly: main.removedOnly.length, newFiles: main.newFiles };
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', 'utf8');
console.log(JSON.stringify(out.summary));
