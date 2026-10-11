#!/usr/bin/env node
'use strict';
// #TASK-ES-681 모의 적용(작업자 측정 도구, 판정 아님) — 저장소 밖 사본에서 「재철거 4차 → finalize」 를 생성기들로 밟아, 고친 생성기의 세 옵션(relay · keepInline · dropDeadImport)이 끝까지 도는지 본다.
// 저장소의 index.html · js/** 는 건드리지 않는다. <MOCK> 은 기준 커밋을 분리 HEAD 로 꺼낸 저장소 밖 worktree 여야 한다(이 도구가 시작할 때 그 트리를 기준 커밋 글자로 되돌린다).
//   0 준비      작업 트리의 고친 생성기 · 실행기를 사본에 덮어쓴다(사본 안에서 돌리려고)
//   1 region    남은 상태 선언 둘을 구역 함수로(구역 이전 3차를 흉내 낸 준비 단계 — 실제 그 PR 은 다른 작업이다)
//   2 unwire    실행기(unwire-run.js apply)로: 구역 이전으로 참조가 풀린 isoDate(가져오기 · getter, 손잡이 줄) + 읽는 곳이 없는 a11ySwitch(dropDeadImport, 손잡이 줄)
//   3 finalize  relay(renderTeamGoalsScreen) + keepInline(서버 주소 · 공개 키 선언 · sb 상태 선언)
//   4 신고서    module-specs --write → app/boot 의 종류를 organ 으로 정함(손으로 정하는 칸) → 세포 설명 → module-guard --update
//   5 측정      대조 탐침 · 죽은 가져오기의 키트 속성 기술자(브라우저) · 시나리오 · npm test · 시험 하나씩 · 남은 인라인 줄의 바이트 동일
//   6 커밋 훅   사본에서 임시 가지에 실제로 커밋을 시도해 훅의 금지 패턴 단계가 지나가는지 본다(훅을 건너뛰지 않는다 · push 하지 않는다). 끝나면 그 커밋과 가지를 지운다.
// 사용: NODE_PATH=<node_modules> node reports/TASK-ES-681/tools/mock-apply.cjs <작업 트리> <MOCK 트리> <기준 트리> <시나리오 폴더>
const fs = require('fs'), path = require('path'), cp = require('child_process'), os = require('os');
const [WORK, MOCK, BASE, SCEN] = process.argv.slice(2).map(p => path.resolve(p));
const OUT = path.join(WORK, 'reports', 'TASK-ES-681', 'mock');
const T = 'TASK-ES-681-MOCK';
const lf = s => s.replace(/\r\n/g, '\n');
const redact = s => String(s).replace(/eyJ[A-Za-z0-9._-]{10,}/g, '(가림)');
const steps = [];
function sh(id, args, cwd, env) {
  const r = cp.spawnSync(args[0], args.slice(1), { cwd: cwd || MOCK, encoding: 'utf8', env: Object.assign({}, process.env, env || {}), maxBuffer: 256 * 1024 * 1024 });
  steps.push({ id, exitCode: r.status, stdoutTail: redact((r.stdout || '').trim().split('\n').slice(-14).join('\n')).slice(0, 2400), stderrTail: redact((r.stderr || '').trim().split('\n').filter(l => !/^warning: /.test(l)).slice(-6).join('\n')).slice(0, 900) });
  return r;
}
const must = (r, what) => { if (r.status !== 0) { fs.writeFileSync(path.join(OUT, 'mock-apply.json'), JSON.stringify({ failedAt: what, steps }, null, 1) + '\n', { encoding: 'utf8' }); console.error('멈춤: ' + what + '\n' + redact((r.stderr || '') + (r.stdout || '')).split('\n').slice(-6).join('\n')); process.exit(1); } return r; };
const wj = (f, o) => fs.writeFileSync(path.join(OUT, f), JSON.stringify(o, null, 1) + '\n', { encoding: 'utf8' });
const rjAbs = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const node = process.execPath;
fs.mkdirSync(OUT, { recursive: true });
if (!path.relative(WORK, MOCK).startsWith('..')) { console.error('MOCK 트리는 작업 트리 밖이어야 한다'); process.exit(2); }

// ── 0 준비
const baseSha = cp.execFileSync('git', ['rev-parse', 'HEAD'], { cwd: BASE, encoding: 'utf8' }).trim();
must(sh('되돌리기(checkout)', ['git', 'checkout', '-q', '--detach', baseSha], MOCK), 'checkout');
must(sh('되돌리기(reset)', ['git', 'reset', '-q', '--hard', baseSha], MOCK), 'reset');
sh('되돌리기(clean)', ['git', 'clean', '-fdq', '--', 'js', 'reports', 'docs'], MOCK);
for (const f of ['gen-inline-hard.js', 'unwire-run.js']) fs.copyFileSync(path.join(WORK, 'docs', 'design', 'harness', 'module-split', f), path.join(MOCK, 'docs', 'design', 'harness', 'module-split', f));
const GEN = path.join(MOCK, 'docs', 'design', 'harness', 'module-split', 'gen-inline-hard.js');
const metaDir = fs.mkdtempSync(path.join(os.tmpdir(), 'es681-mock-meta-'));
const genRun = (id, cfgFile) => { const r = must(sh(id, [node, GEN, MOCK, cfgFile], MOCK, { MODULE_SPLIT_OUT: metaDir }), id); return { stdout: redact(r.stdout), meta: rjAbs(path.join(metaDir, 'gen-inline-hard-meta.json')) }; };
const indexLines = () => lf(fs.readFileSync(path.join(MOCK, 'index.html'), 'utf8')).split('\n');
const l0 = indexLines().length;

// ── 1 region
const s1 = genRun('1 region', path.join(OUT, 'step1-region.json'));
const l1 = indexLines().length;

// ── 2 unwire(실행기) — isoDate(names) + a11ySwitch(dropDeadImport)
const dead = { '_ui:1:dropkit': [{ name: 'a11ySwitch', reason: '설정 탭 세포들은 키트(window.OurgoalUiHelpers)에서 직접 부른다 — index.html 의 이 지역 변수를 읽는 곳이 없다(#TASK-ES-677 REQ 사실 보고)', definedIn: 'js/core/ui-helpers.js' }] };
wj('step2-dead-imports.json', dead);
must(sh('2 unwire(실행기 apply)', [node, path.join(MOCK, 'docs', 'design', 'harness', 'module-split', 'unwire-run.js'), 'apply', MOCK, '--task', T, '--runs', '_calendarKit:1:dropkit,_ui:1:dropkit', '--names-for', '_calendarKit:1:dropkit=isoDate,_ui:1:dropkit=', '--dead-imports', path.join(OUT, 'step2-dead-imports.json'), '--label', '모의 — 재철거 4차(isoDate · 죽은 가져오기 a11ySwitch)'], MOCK), 'unwire');
fs.copyFileSync(path.join(MOCK, 'reports', T, 'proof.json'), path.join(OUT, 'step2-unwire-proof.json'));
fs.copyFileSync(path.join(MOCK, 'reports', T, 'unwire-meta.json'), path.join(OUT, 'step2-unwire-meta.json'));
const s2 = rjAbs(path.join(OUT, 'step2-unwire-meta.json'));
const l2 = indexLines().length;
const beforeFinalize = indexLines();

// ── 3 finalize(relay + keepInline)
const s3 = genRun('3 finalize', path.join(OUT, 'step3-finalize.json'));
wj('step3-finalize-meta.json', JSON.parse(redact(JSON.stringify(s3.meta)))); // 메타의 문 글자 앞머리에 공개 키 글자가 들어가므로 가린다(커밋 훅의 금지 패턴)
const afterFinalize = indexLines();
const bootText = lf(fs.readFileSync(path.join(MOCK, 'js', 'app', 'boot.js'), 'utf8'));

// ── 4 신고서 · 세포 설명 · 기준선
const specs1 = sh('4 module-specs --write', [node, 'scripts/module-specs.js', '--write'], MOCK);
const mfile = path.join(MOCK, 'docs', 'architecture', 'modules.json');
const kindBefore = (rjAbs(mfile).cells.find(c => c.id === 'app/boot') || {}).kind;
const guard1 = sh('4 module-guard(종류를 정하기 전)', [node, 'scripts/module-guard.js', '--quiet'], MOCK);
{ const raw = fs.readFileSync(mfile, 'utf8'), m = JSON.parse(raw), eol = raw.includes('\r\n') ? '\r\n' : '\n', ind = (raw.match(/\n( +)"/) || [])[1] || ' ';
  m.cells.find(c => c.id === 'app/boot').kind = 'organ';
  fs.writeFileSync(mfile, JSON.stringify(m, null, ind.length).split('\n').join(eol) + (raw.endsWith('\n') ? eol : ''), { encoding: 'utf8' }); }
sh('4 module-specs --write(다시 — 손으로 정한 종류가 보존되는가)', [node, 'scripts/module-specs.js', '--write'], MOCK);
const kindAfter = (rjAbs(mfile).cells.find(c => c.id === 'app/boot') || {}).kind;
const descFile = path.join(metaDir, 'desc.json');
fs.writeFileSync(descFile, JSON.stringify({ 'app/boot': ['앱 부팅(모의)', '인라인에 남아 있던 시동 문을 순서대로 부른다(모의)'], 'core/boot-mock-seeds': ['시동 초깃값(모의)', '앱 상태와 프롬프트 백과 열림 표시의 초깃값을 상태 기관에 맡긴다(모의)'] }), { encoding: 'utf8' });
sh('4 세포 설명', [node, 'docs/design/harness/module-split/cell-desc-add.js', MOCK, descFile], MOCK);
sh('4 module-guard --update', [node, 'scripts/module-guard.js', '--update'], MOCK);
const guard2 = sh('4 module-guard(종류를 정한 뒤)', [node, 'scripts/module-guard.js', '--quiet'], MOCK);
sh('4 새 파일을 추적 대상으로(git add -N — 지도 시험이 추적 파일만 읽는다)', ['git', 'add', '-N', 'js/app/boot.js', 'js/core/boot-mock-seeds.js'], MOCK);

// ── 5 측정
const cmp = path.join(WORK, 'scripts', 'probes', 'cell-registry-compare.js');
sh('5 대조 탐침(기준)', [node, cmp, BASE, path.join(OUT, 'compare.base.json'), '--fingerprints'], WORK);
sh('5 대조 탐침(모의)', [node, cmp, MOCK, path.join(OUT, 'compare.mock.json'), '--fingerprints', '--names-from', path.join(OUT, 'compare.base.json')], WORK);
const cB = rjAbs(path.join(OUT, 'compare.base.json')), cM = rjAbs(path.join(OUT, 'compare.mock.json'));
const fpd = k => Object.keys(cB.fingerprints[k]).filter(n => cB.fingerprints[k][n] !== ((cM.fingerprints || {})[k] || {})[n]);
// 죽은 가져오기: 기준 트리의 브라우저에서 그 키트 속성의 기술자
const dExpr = "({a11ySwitch:(function(){var o=window.OurgoalUiHelpers;var d=Object.getOwnPropertyDescriptor(o,'a11ySwitch');return{own:!!d,data:!!d&&('value' in d),accessor:!!d&&(!!d.get||!!d.set),type:d?typeof d.value:null,onScope:Object.prototype.hasOwnProperty.call(window.OurgoalAppScope.scope,'a11ySwitch')};})()})";
fs.writeFileSync(path.join(metaDir, 'names.json'), JSON.stringify({ names: ['a11ySwitch', 'isoDate', 'renderTeamGoalsScreen', 'sb'] }), { encoding: 'utf8' });
const sp = path.join(WORK, 'reports', 'TASK-ES-636', 'state-probe.cjs');
sh('5 이름 탐침(기준)', [node, sp, BASE, path.join(OUT, 'name-probe.base.json'), '--names', path.join(metaDir, 'names.json'), '--eval', dExpr], WORK);
sh('5 이름 탐침(모의)', [node, sp, MOCK, path.join(OUT, 'name-probe.mock.json'), '--names', path.join(metaDir, 'names.json'), '--eval', dExpr], WORK);
const nB = rjAbs(path.join(OUT, 'name-probe.base.json')), nM = rjAbs(path.join(OUT, 'name-probe.mock.json'));
const scFiles = fs.readdirSync(SCEN).filter(f => /\.json$/.test(f)).sort().map(f => path.join(SCEN, f));
sh('5 시나리오', [node, path.join(WORK, 'docs', 'design', 'harness', 'module-split', 'scenario-local-z56.js'), BASE, MOCK, path.join(OUT, 'scenario-local.json')].concat(scFiles), WORK);
const sc = rjAbs(path.join(OUT, 'scenario-local.json'));
const npmM = sh('5 npm test(모의)', ['cmd', '/c', 'npm', 'test'], MOCK), npmB = sh('5 npm test(기준)', ['cmd', '/c', 'npm', 'test'], BASE);
const okCount = r => ((r.stdout || '') + (r.stderr || '')).split('\n').filter(l => /✓/.test(l)).length;
const each = path.join(WORK, 'reports', 'TASK-ES-614', 'run-tests-each.cjs');
sh('5 시험 하나씩(기준)', [node, each, BASE, path.join(OUT, 'tests-base.json')], WORK);
sh('5 시험 하나씩(모의)', [node, each, MOCK, path.join(OUT, 'tests-mock.json')], WORK);
const tB = rjAbs(path.join(OUT, 'tests-base.json')), tM = rjAbs(path.join(OUT, 'tests-mock.json'));
const sig = x => JSON.stringify([x.exit, x.ok, x.okDot, (x.fails || []).length]), key = x => x.script || x.file;
const differing = []; for (const k of ['scripts', 'testFiles']) { const m = {}; tB[k].forEach(x => { m[key(x)] = sig(x); }); tM[k].forEach(x => { if (m[key(x)] !== sig(x)) differing.push({ file: key(x), base: m[key(x)] || null, mock: sig(x) }); }); }
// 남은 인라인 줄: finalize 직전 줄의 부분열(바이트 동일) · 공개 키 줄이 index.html 에 그대로 있고 부팅 파일에는 없다
const blockOf = ls => { let s = -1, e = -1; for (let i = 0; i < ls.length; i++) if (ls[i].trim() === '<script>' && (ls[i + 1] || '').trim() === '(function(){' && (ls[i + 2] || '').includes('"use strict"')) { s = i; break; } if (s < 0) return null; for (let i = s + 1; i < ls.length; i++) if (ls[i].startsWith('</script>')) { e = i; break; } return ls.slice(s, e + 1); };
const nb = blockOf(afterFinalize), ob = blockOf(beforeFinalize);
let at = 0, sub = !!nb && !!ob; if (sub) for (const l of nb.slice(0, -1)) { while (at < ob.length && ob[at] !== l) at++; if (at >= ob.length) { sub = false; break; } at++; }
const keyRe = /^\s*var SUPABASE_ANON_KEY = /;
const inlineKept = { blockLines: nb ? nb.length : null, linesAreSubsequenceOfBefore: sub, lastLineIsScriptCloseWithBootTag: !!nb && nb[nb.length - 1] === '</script><script src="js/app/boot.js"></script>',
  keyLineInIndexByteSame: afterFinalize.filter(l => keyRe.test(l)).length === 1 && beforeFinalize.filter(l => keyRe.test(l))[0] === afterFinalize.filter(l => keyRe.test(l))[0], keyTextInBoot: /SUPABASE_ANON_KEY|SUPABASE_URL/.test(bootText), bootLines: bootText.split('\n').length - 1 };

// ── 6 커밋 훅(실제 커밋 시도 — 훅을 건너뛰지 않는다 · push 하지 않는다)
sh('6 임시 가지', ['git', 'checkout', '-q', '-b', 'tmp/es681-mock-hook-check'], MOCK);
fs.rmSync(path.join(MOCK, 'reports', T), { recursive: true, force: true }); // 실행기가 사본에 쓴 기록(공개 키 글자는 없지만 커밋에 넣지 않는다)
sh('6 git add', ['git', 'add', '-A'], MOCK);
const commit = sh('6 git commit(훅 실행)', ['git', 'commit', '-m', '[INFRA] #TASK-ES-681 test: finalize 모의 커밋(커밋 훅 확인용 — push 하지 않는다)'], MOCK);
const hookText = redact(((commit.stdout || '') + '\n' + (commit.stderr || '')).split('\n').filter(l => !/^warning: /.test(l)).join('\n'));
const hook = { commitExitCode: commit.status, forbiddenPatternStepPassed: /금지 패턴 없음/.test(hookText), hardcodedSecretBlocked: /HARDCODED_SECRET/.test(hookText), outputTail: hookText.trim().split('\n').slice(-8) };
sh('6 되돌리기', ['git', 'checkout', '-q', '--detach', baseSha], MOCK);
sh('6 되돌리기(reset)', ['git', 'reset', '-q', '--hard', baseSha], MOCK);
sh('6 임시 가지 지움', ['git', 'branch', '-D', 'tmp/es681-mock-hook-check'], MOCK);
sh('6 되돌리기(clean)', ['git', 'clean', '-fdq', '--', 'js', 'reports', 'docs'], MOCK);
fs.rmSync(metaDir, { recursive: true, force: true });

const out = {
  tool: 'reports/TASK-ES-681/tools/mock-apply.cjs', type: '작업자 측정, 판정 아님 — 저장소 밖 사본에서의 모의 적용(실제 적용 0)', measuredAt: new Date().toISOString(), base: baseSha,
  note: '준비 단계(1 region)는 구역 이전 3차를 흉내 낸 것이다 — 실제 그 PR 은 다른 작업이고 구역 함수의 이름·세포가 다를 수 있다. 2 는 재철거 4차, 3 은 finalize 의 미리보기다.',
  htmlLines: { base: l0, afterRegion: l1, afterUnwire: l2, afterFinalize: afterFinalize.length },
  step1Region: { stdout: s1.stdout.trim().split('\n') },
  step2Unwire: { totals: s2.totals, runs: s2.runs.map(r => ({ kitVar: r.kitVar, pass: r.pass, options: r.options, names: r.names, removed: r.removed, deadImports: (r.removedDetail.deadImports || []) })) },
  step3Finalize: { stdout: s3.stdout.trim().split('\n'), statements: s3.meta.statements, removed: s3.meta.removed, tag: s3.meta.tag, relayed: s3.meta.relayed, keptInline: s3.meta.keptInline && Object.assign({}, s3.meta.keptInline, { statements: s3.meta.keptInline.statements.map(x => Object.assign({}, x, { text: redact(x.text) })) }) },
  inlineKept,
  moduleSpecs: { kindWrittenByTool: kindBefore, guardBeforeSettingKind: { exitCode: guard1.status, message: ((guard1.stdout || '') + (guard1.stderr || '')).split('\n').filter(l => /app\/boot/.test(l)).map(l => l.trim()) }, kindSetByHand: 'organ', kindAfterRewrite: kindAfter, guardAfterSettingKind: guard2.status, specsWriteTail: (specs1.stdout || '').trim().split('\n').slice(-1) },
  compare: { base: cB.counts, mock: cM.counts, scopeLost: cM.namesFrom ? cM.namesFrom.scopeLost : null, fingerprintsDiffering: { scope: fpd('scope'), window: fpd('window') }, exceptions: { base: cB.guestBoot.exceptions.length, mock: cM.guestBoot.exceptions.length }, guestBootError: { base: cB.guestBoot.error || null, mock: cM.guestBoot.error || null } },
  deadImportRuntime: { base: (nB.extra || {}).a11ySwitch || null, mock: (nM.extra || {}).a11ySwitch || null, note: '기준 트리(지우기 전)와 모의 트리(지운 뒤)의 브라우저에서 window.OurgoalUiHelpers 의 a11ySwitch 속성 기술자 — data:true · accessor:false 면 읽기만으로 부수효과가 없다. onScope:false 면 통로에 없는 이름이다' },
  nameValues: Object.fromEntries(Object.keys(nB.names || {}).map(n => [n, { base: (nB.names[n] || {}).value, mock: ((nM.names || {})[n] || {}).value, same: (nB.names[n] || {}).value === ((nM.names || {})[n] || {}).value }])),
  scenarios: { count: scFiles.length, allPassedBoth: sc.allPassedBoth, rows: Object.keys(sc.scenarios).map(id => ({ id, base: sc.scenarios[id].runs.base.passed, mock: sc.scenarios[id].runs.work.passed, exceptions: sc.scenarios[id].runs.work.exceptions.length })) },
  npmTest: { base: { exitCode: npmB.status, okLines: okCount(npmB) }, mock: { exitCode: npmM.status, okLines: okCount(npmM) }, same: npmB.status === npmM.status && okCount(npmB) === okCount(npmM) },
  testsEach: { scripts: tM.scripts.length, testFiles: tM.testFiles.length, differing },
  commitHook: hook,
  steps,
};
wj('mock-apply.json', out);
console.log(JSON.stringify({ html: out.htmlLines, unwire: out.step2Unwire.totals.removed, dead: out.step2Unwire.runs.flatMap(r => r.deadImports.map(d => d.name)), finalize: { removed: out.step3Finalize.removed, relayed: (out.step3Finalize.relayed || []).map(x => [x.name, x.movedTo]), inline: out.step3Finalize.keptInline && out.step3Finalize.keptInline.inline, boot: out.step3Finalize.keptInline && out.step3Finalize.keptInline.boot },
  inlineKept, specs: [kindBefore, guard1.status, kindAfter, guard2.status], compare: [out.compare.base.mismatches, out.compare.mock.mismatches, out.compare.base.extra, out.compare.mock.extra, out.compare.scopeLost, out.compare.fingerprintsDiffering, out.compare.exceptions], dead: out.deadImportRuntime, sc: [out.scenarios.count, out.scenarios.allPassedBoth], npm: out.npmTest, each: out.testsEach.differing.length, hook }));
