#!/usr/bin/env node
'use strict';
// #TASK-ES-686 재현 절차(작업자 측정 도구, 판정 아님) — 법정의 생성기 재실행 대조가 「기준에 없던 폴더에 새 파일을 만드는 생성기」에서 멈추는 까닭.
// 법정 코드(court/lib/preserve-source.js — 금고)는 읽기만 한다. 이 도구는 그 코드의 한 대목과 같은 방식으로 임시 저장소의 `git status --short` 를 읽어 보인다:
//   법정: 생성기를 기준 커밋의 임시 복제본에서 돌린 뒤 `git status --short` 의 줄마다 「마지막 낱말」을 허용 목록(index.html + 증명 파일의 cells[].file)과 글자로 맞댄다.
//   git:  추적하지 않는 파일이 「통째로 새 폴더」 안에 있으면 파일이 아니라 폴더 한 줄(`?? 새폴더/`)로 접어 보여 준다(기본값 --untracked-files=normal).
//   결과: 허용 목록에는 `새폴더/파일.js` 가 있는데 status 줄은 `새폴더/` 라 글자가 맞지 않는다 → 「Unexpected file modified by generator: 새폴더/」.
// 이 도구가 하는 일(저장소 밖 임시 폴더에서만 — 끝나면 지운다):
//   ① 빈 git 저장소에 `js/core/a.js` 한 파일을 커밋한다(기준).
//   ② 「생성기가 만든 파일」 둘을 둔다: 이미 있는 폴더의 `js/core/new.js`, 없던 폴더의 `js/app/boot.js`.
//   ③ `git status --short` 를 법정과 같은 방식(마지막 낱말)으로 읽어 허용 목록과 맞댄다 → 없던 폴더 쪽만 걸린다.
//   ④ 같은 일을 `--untracked-files=all` 로 읽으면 걸리지 않는다(법정 한 줄 수정안 — 금고라 이 PR 은 하지 않는다).
//   ⑤ 기준에 `js/app/README.md` 가 먼저 있으면 기본 status 로도 걸리지 않는다(이 PR 이 하는 일).
// 사용: node reports/TASK-ES-686/court-newdir-repro.cjs <out.json>
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const OUT = path.resolve(process.argv[2] || 'court-newdir-repro.json');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'es686-repro-'));
const git = (cwd, args) => cp.execFileSync('git', args, { cwd, encoding: 'utf8', env: Object.assign({}, process.env, { GIT_AUTHOR_NAME: 'repro', GIT_AUTHOR_EMAIL: 'repro@example.invalid', GIT_COMMITTER_NAME: 'repro', GIT_COMMITTER_EMAIL: 'repro@example.invalid' }) });
const put = (dir, rel, text) => { const f = path.join(dir, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, text, { encoding: 'utf8' }); };
const ALLOWED = new Set(['index.html', 'js/core/new.js', 'js/app/boot.js']);
// 법정의 읽기 방식 그대로: 줄을 trim → 공백으로 나눔 → 마지막 낱말
const courtRead = status => status.trim().split('\n').filter(Boolean).map(line => { const p = line.trim().split(/\s+/); const f = p[p.length - 1].replace(/\\/g, '/'); return { line, lastWord: f, allowed: ALLOWED.has(f) }; });
function scenario(name, withReadme) {
  const dir = path.join(tmp, name); fs.mkdirSync(dir);
  git(dir, ['init', '-q']); git(dir, ['config', 'core.autocrlf', 'false']); git(dir, ['config', 'core.hooksPath', path.join(tmp, 'no-hooks')]);
  put(dir, 'js/core/a.js', '// 기준에 있던 파일\n'); if (withReadme) put(dir, 'js/app/README.md', '# js/app\n');
  git(dir, ['add', '-A']); git(dir, ['commit', '-q', '-m', 'base']);
  put(dir, 'js/core/new.js', '// 생성기가 만든 파일(이미 있는 폴더)\n'); put(dir, 'js/app/boot.js', '// 생성기가 만든 파일(' + (withReadme ? '기준에 이미 있는' : '기준에 없던') + ' 폴더)\n');
  const normal = courtRead(git(dir, ['status', '--short'])), all = courtRead(git(dir, ['status', '--short', '--untracked-files=all']));
  return { baseHasAppFolder: withReadme, statusShort: normal, unexpected: normal.filter(x => !x.allowed).map(x => x.lastWord), courtWouldFail: normal.some(x => !x.allowed),
    statusShortUntrackedAll: all, unexpectedWithUntrackedAll: all.filter(x => !x.allowed).map(x => x.lastWord) };
}
let out;
try {
  const a = scenario('without-folder', false), b = scenario('with-folder', true);
  out = { tool: 'reports/TASK-ES-686/court-newdir-repro.cjs', type: '작업자 측정, 판정 아님 — 법정 코드는 읽기만 했다(금고 변경 0)', measuredAt: new Date().toISOString(), gitVersion: git(tmp, ['--version']).trim(),
    courtCode: { file: 'court/lib/preserve-source.js', what: '`git status --short` 의 줄마다 마지막 낱말을 허용 목록(index.html + cells[].file)과 글자로 맞댄다 — 맞지 않으면 「Unexpected file modified by generator: <낱말>」' },
    allowed: [...ALLOWED],
    withoutFolderInBase: a, withFolderInBase: b,
    summary: { failsWhenFolderIsNew: a.courtWouldFail === true && JSON.stringify(a.unexpected) === JSON.stringify(['js/app/']), passesWithUntrackedAll: a.unexpectedWithUntrackedAll.length === 0, passesWhenFolderExistsInBase: b.courtWouldFail === false },
    observedOnRealCommits: {
      note: '아래 둘은 #TASK-ES-685(마지막 정리) 준비 때 법정의 recomputeSplit 을 실제 커밋에 직접 불러 받은 결과다(작업자 PC, 2026-10-11). 이 도구가 다시 만들지는 않는다 — 글자를 옮겨 적은 기록이다',
      baseWithoutAppFolder: { base: '4ea2bd73', result: '{"ok":false,"reason":"Unexpected file modified by generator: js/app/","details":{"checkedFiles":[{"file":"index.html","genLength":196660,"headLength":196660},{"file":"js/app/boot.js","genLength":3686,"headLength":3686}]}}', meaning: '두 파일은 기준 생성기 재실행 결과와 바이트 길이까지 맞춰 본 뒤(대조 통과), 그다음 status 검사에서 폴더 줄에 걸렸다' },
      baseWithAppFolderReadme: { base: '4ea2bd73 에 js/app/README.md 한 장을 얹은 임시 커밋(저장소 밖 실험 — push 없음, 가지 삭제)', result: '{"ok":true,"details":{"checkedFiles":[{"file":"index.html","genLength":196660,"headLength":196660},{"file":"js/app/boot.js","genLength":3686,"headLength":3686}]}}' } },
    fixCandidate: { where: 'court/lib/preserve-source.js 의 status 호출', change: '`git status --short` → `git status --short --untracked-files=all`(새 폴더 안의 파일도 파일 단위로 나온다)', status: '금고라 이 PR 은 하지 않는다 — 작업 끝 보고에서 법정 결함으로 올린다(상민님 결심 사안)' } };
} finally { fs.rmSync(tmp, { recursive: true, force: true }); }
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', { encoding: 'utf8' });
console.log(JSON.stringify({ without: out.withoutFolderInBase.statusShort.map(x => x.line), unexpected: out.withoutFolderInBase.unexpected, withAll: out.withoutFolderInBase.statusShortUntrackedAll.map(x => x.line), withFolder: out.withFolderInBase.statusShort.map(x => x.line), summary: out.summary }));
