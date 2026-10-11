#!/usr/bin/env node
'use strict';
// #TASK-ES-686 측정 모음과 주장(작업자 측정 도구, 판정 아님) — 폴더 설명 한 장을 더한 PR 이 코드를 건드리지 않았음을 잰다.
//   measure  바뀐 파일 범위 · 설명 파일 줄 수 · 신고서/모듈 가드/공식 지표가 .md 를 세지 않는지(기준선 마지막 기록과 같음) · npm test · 무결성 게이트 → measurement.json
//   claims   measurement.json · court-newdir-repro.json 에서 claims.json 을 만든다(기록 주장만 — 화면 동작이 바뀌지 않는 PR 이다)
// 사용: node reports/TASK-ES-686/measure.cjs measure <작업 트리>     (먼저: raw/npm-test.{base,work}.{log,exit} · court-newdir-repro.json)
//       node reports/TASK-ES-686/measure.cjs claims  <작업 트리> --req docs/specs/REQ-….md
const fs = require('fs'), path = require('path'), cp = require('child_process');
const argv = process.argv.slice(2), CMD = argv[0], ROOT = path.resolve(argv[1] || '.');
const opt = (k, d) => (argv.indexOf(k) >= 0 ? argv[argv.indexOf(k) + 1] : d);
const TASK = 'TASK-ES-686', REL = 'reports/' + TASK + '/', DIR = path.join(ROOT, 'reports', TASK), README = 'js/app/README.md';
const rj = f => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
const wj = (f, o) => fs.writeFileSync(path.join(DIR, f), JSON.stringify(o, null, 1) + '\n', { encoding: 'utf8' });
const git = a => cp.execFileSync('git', a, { cwd: ROOT, encoding: 'utf8' }).trim();
const run = args => cp.spawnSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

if (CMD === 'measure') {
  const base = git(['merge-base', 'HEAD', 'origin/main']);
  const files = git(['diff', '--name-only', base, '--']).split('\n').filter(Boolean).concat(git(['ls-files', '--others', '--exclude-standard']).split('\n').filter(Boolean)).filter((f, i, a) => a.indexOf(f) === i).sort();
  const vaultRe = /^(court\/|AGENTS\.md$|CLAUDE\.md$|GEMINI\.md$|01_OURGOAL_SUPREME_CONSTITUTION_FULL\.md$|\.agent\/rules\/|docs\/rules\/(OURGOAL_ABSOLUTE_INTEGRITY_RULES\.md|CONSTITUTION_VERSIONS\.md|ESSENCE_OURGOAL\.md|rules\.json|rules-control\.json|branch-protection.*\.json|archive\/)|\.github\/|\.githooks\/|scripts\/essence-gate\.js$|scripts\/install-essence-gate\.js$|scripts\/verify-integrity-gate\.js$|scripts\/hook-smoke-on-index\.js$|\.vercelignore$|package\.json$|vercel\.json$|\.gitattributes$|\.claude\/settings\.json$|docs\/directives\/)/;
  const readme = fs.readFileSync(path.join(ROOT, README), 'utf8').replace(/\r\n/g, '\n');
  const mm = require(path.join(ROOT, 'scripts', 'module-metrics.js')).measure(ROOT).ratchet;
  const baseline = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'architecture', 'module-baseline.json'), 'utf8')), last = baseline.history[baseline.history.length - 1].metrics;
  const modules = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'architecture', 'modules.json'), 'utf8'));
  const guard = run(['scripts/module-guard.js', '--quiet']), gate = run(['scripts/verify-integrity-gate.js']);
  const specsOut = path.join(require('os').tmpdir(), 'es686-specs-' + process.pid + '.json');
  const readLog = label => { const t = fs.readFileSync(path.join(DIR, 'raw', 'npm-test.' + label + '.log'), 'utf8').replace(/\r\n/g, '\n').split('\n'), ex = fs.readFileSync(path.join(DIR, 'raw', 'npm-test.' + label + '.exit'), 'utf8');
    return { exit: Number((/exit=(\d+)/.exec(ex) || [])[1]), ok: t.filter(l => /^\s*✓ /.test(l)).length, okDot: t.filter(l => /^\s*ok · /.test(l)).length, fail: t.filter(l => /^\s*(✗|✖|not ok|FAIL\b)/.test(l)).length }; };
  const nb = readLog('base'), nw = readLog('work');
  void specsOut;
  const out = { tool: REL + 'measure.cjs', type: '작업자 측정, 판정 아님 — 판정은 GitHub 법정만 낸다', measuredAt: new Date().toISOString(), base, head: git(['rev-parse', 'HEAD']),
    changed: { files, codeFilesChanged: files.filter(f => /\.(js|cjs|mjs|html|css)$/.test(f) && !/^reports\//.test(f)), indexHtmlChanged: files.includes('index.html'), underJs: files.filter(f => /^js\//.test(f)), onlyReadmeUnderJs: JSON.stringify(files.filter(f => /^js\//.test(f))) === JSON.stringify([README]),
      testsChanged: files.filter(f => /^tests\//.test(f)), scriptsChanged: files.filter(f => /^scripts\//.test(f)), vaultChanged: files.filter(f => vaultRe.test(f)), harnessChanged: files.filter(f => /^docs\/design\/harness\//.test(f)), architectureDocsChanged: files.filter(f => /^docs\/architecture\//.test(f)) },
    readme: { file: README, lines: readme.split('\n').length - (readme.endsWith('\n') ? 1 : 0), hasKeyLikeText: /eyJ[A-Za-z0-9._-]{10,}|supabase\.co/.test(readme), mentionsBootFile: /boot\.js/.test(readme) },
    tools: { modulesJsonCellsUnderApp: modules.cells.filter(c => /^js\/app\//.test(c.file || '')).length, modulesJsonChanged: files.includes('docs/architecture/modules.json'), moduleGuardExit: guard.status, integrityGateExit: gate.status,
      metrics: mm, baselineLast: { inlineScriptLines: last.inlineScriptLines, indexFunctionDecls: last.indexFunctionDecls, windowAssignments: last.windowAssignments, crossTabRefs: last.crossTabRefs },
      metricsEqualBaselineLast: mm.inlineScriptLines === last.inlineScriptLines && mm.indexFunctionDecls === last.indexFunctionDecls && mm.windowAssignments === last.windowAssignments && mm.crossTabRefs === last.crossTabRefs,
      note: '신고서 도구 · 모듈 가드 · 모듈 지표는 js/ 아래의 .js 파일만 센다 — 설명 파일(.md)은 세포로 세지 않는다. 신고서(modules.json)와 기준선은 이 PR 에서 바뀌지 않았고 가드는 통과한다' },
    npmTest: { base: nb, work: nw, same: nb.exit === 0 && nw.exit === 0 && nb.ok === nw.ok && nb.okDot === nw.okDot && nb.fail === 0 && nw.fail === 0,
      note: '기준 기록은 같은 기준 커밋(4ea2bd73)의 임시 작업 트리에서 #TASK-ES-685 준비 때 돌린 것을 옮겨 왔다(raw/npm-test.base.log). 작업 기록은 이 작업 트리에서 전경으로 끝까지 돌린 것이다' } };
  wj('measurement.json', out);
  console.log(JSON.stringify({ files: out.changed.files.length, code: out.changed.codeFilesChanged, underJs: out.changed.underJs, tests: out.changed.testsChanged.length, vault: out.changed.vaultChanged.length, readme: out.readme, tools: [out.tools.modulesJsonCellsUnderApp, out.tools.moduleGuardExit, out.tools.integrityGateExit, out.tools.metricsEqualBaselineLast], npm: out.npmTest }));
  process.exit(0);
}
if (CMD === 'claims') {
  const REQ = opt('--req'), M = REL + 'measurement.json', P = REL + 'court-newdir-repro.json', claims = []; let n = 0;
  const getPath = (o, p) => p.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);
  const add = (req, statement, file, p, equals) => { const v = getPath(JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8')), p);
    if (JSON.stringify(v) !== JSON.stringify(equals)) { console.error('값 불일치: ' + file + ' ' + p + ' = ' + JSON.stringify(v).slice(0, 200)); process.exit(1); }
    claims.push({ id: 'C' + (++n), req, kind: 'static', domain: 'config', statement, touches: [file], check: { type: 'jsonPath', file, path: p, equals } }); };
  add('R1', 'js/ 아래에서 바뀐 것은 설명 파일 js/app/README.md 하나다.', M, 'changed.onlyReadmeUnderJs', true);
  add('R1', '설명 파일에 키 꼴 글자나 서버 주소가 없다.', M, 'readme.hasKeyLikeText', false);
  add('R2', '코드 파일(.js · .html · .css — 보고 폴더의 도구 제외)은 하나도 바뀌지 않았다.', M, 'changed.codeFilesChanged', []);
  add('R2', 'index.html 은 바뀌지 않았다.', M, 'changed.indexHtmlChanged', false);
  add('R2', 'tests/ 아래 바뀐 파일이 없다.', M, 'changed.testsChanged', []);
  add('R2', 'scripts/ 아래 바뀐 파일이 없다.', M, 'changed.scriptsChanged', []);
  add('R2', '금고 아래 바뀐 파일이 없다.', M, 'changed.vaultChanged', []);
  add('R2', '생성기 · 하네스 변경이 없다.', M, 'changed.harnessChanged', []);
  // 설명 파일 자체에 거는 주장(법정이 커밋된 트리에서 직접 본다)
  claims.push({ id: 'C' + (++n), req: 'R1', kind: 'static', domain: 'config', statement: '설명 파일 js/app/README.md 가 커밋된 트리에 있다.', touches: [README], check: { type: 'fileExists', file: README } });
  claims.push({ id: 'C' + (++n), req: 'R1', kind: 'static', domain: 'config', statement: '설명 파일이 부팅 파일의 이름(js/app/boot.js)과 「손으로 쓰지 않고 생성기가 만든다」를 적고 있다.', touches: [README], check: { type: 'codeContains', file: README, text: '손으로 쓰지 않고 생성기가 만든다' } });
  add('R3', '신고서(modules.json)에 js/app 아래 세포가 없다(설명 파일은 세포가 아니다).', M, 'tools.modulesJsonCellsUnderApp', 0);
  add('R3', '신고서는 바뀌지 않았다.', M, 'tools.modulesJsonChanged', false);
  add('R3', '모듈 가드 종료 코드가 0 이다.', M, 'tools.moduleGuardExit', 0);
  add('R3', '공식 지표(인라인 줄 수 · index 함수 선언 · window 대입 · 탭 간 참조)가 기준선 마지막 기록과 같다.', M, 'tools.metricsEqualBaselineLast', true);
  add('R3', 'npm test 가 기준·작업에서 종료 코드 0 이고 검사 수가 같다.', M, 'npmTest.same', true);
  add('R3', '무결성 게이트 종료 코드가 0 이다.', M, 'tools.integrityGateExit', 0);
  add('R4', '재현: 기준에 없던 폴더에 생성기가 파일을 만들면 법정과 같은 방식으로 읽은 status 줄이 폴더 한 줄이라 허용 목록과 맞지 않는다.', P, 'summary.failsWhenFolderIsNew', true);
  add('R4', '재현: 그 폴더가 기준에 이미 있으면 같은 읽기 방식으로 걸리지 않는다.', P, 'summary.passesWhenFolderExistsInBase', true);
  add('R4', '재현: status 를 파일 단위(--untracked-files=all)로 읽으면 폴더가 새것이어도 걸리지 않는다(법정 수정안 — 이 PR 은 하지 않는다).', P, 'summary.passesWithUntrackedAll', true);
  wj('claims.json', { task: TASK, requirementsSource: REQ, requirements: [
    { id: 'R1', text: '부팅 기관 폴더 js/app 에 설명 파일 README.md 한 장을 둔다(이 폴더가 무엇이고 무엇을 두지 않는지).' },
    { id: 'R2', text: '제품 코드 · index.html · 시험 · 금고 · 생성기는 바꾸지 않는다.' },
    { id: 'R3', text: '신고서 도구 · 모듈 가드 · 지표가 설명 파일을 세포로 세지 않고, npm test 와 무결성 게이트가 기준과 같다.' },
    { id: 'R4', text: '이 폴더를 먼저 두는 까닭(법정 재실행 대조가 새 폴더에서 멈추는 결함)의 재현 절차를 보고 폴더에 남긴다.' } ],
    outOfScopeReports: [
      { text: '법정 코드의 status 읽기 한 줄을 고치는 일은 금고라 하지 않는다 — 작업 끝 보고에서 법정 결함으로 올린다.', cannotBecause: 'out-of-scope-feature' },
      { text: '부팅 파일 js/app/boot.js 자체는 이 PR 에 없다 — 다음 PR(#TASK-ES-685)이 생성기로 만든다.', cannotBecause: 'out-of-scope-feature' } ],
    claims });
  console.log('claims', claims.length);
  process.exit(0);
}
console.error('사용: node measure.cjs measure|claims <작업 트리>'); process.exit(2);
