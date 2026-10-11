#!/usr/bin/env node
'use strict';
// #TASK-ES-687 모의 적용(작업자 측정 도구, 판정 아님) — 저장소 밖 사본(기준 main 의 임시 worktree)에서만 돈다. 저장소의 index.html 은 건드리지 않는다.
// 고친 생성기를 지금 main 의 실제 index.html 에 relay + keepGlobalConst 로 돌리고, 그 결과를 기준 트리(같은 커밋의 다른 임시 worktree)와 맞댄다:
//   ① 생성기 결과(줄 수 · 남긴 블록 · 부팅 파일 · 메타) ② 신고서 종류 · 모듈 가드 · 공식 지표 ③ 글자(남긴 두 줄 바이트 동일 · 부팅 파일에 값 글자 없음)
//   ④ 실제 커밋 훅(모의 트리의 임시 가지에서 진짜 커밋 — 우회 없음, push 없음) ⑤ 대조 탐침 · 시점 탐침
//   ⑥ 「돌아온 로그인 사용자 부팅」 탐침(auth-race.cjs — 전 구간 대조 2회차 담당의 도구를 글자 그대로 옮겨 둔 것): 저장소 판 · CDN 판(파일을 주면), 세션 있음 · 없음, 여러 번
//   ⑦ npm test(모의 트리) ⑧ 시나리오(폴더를 주면 — 기준 2회 · 모의 1회)
// 사용: NODE_PATH=… node reports/TASK-ES-687/tools/mock-apply.cjs <작업 트리> <모의 트리> <기준 트리> [--cdn-lib <브라우저용 묶음 파일>] [--scenarios <시나리오 폴더>] [--skip-npm]
const fs = require('fs'), path = require('path'), cp = require('child_process'), os = require('os'), crypto = require('crypto');
const argv = process.argv.slice(2), WORK = path.resolve(argv[0]), MOCK = path.resolve(argv[1]), BASE = path.resolve(argv[2]);
const opt = k => (argv.indexOf(k) >= 0 ? argv[argv.indexOf(k) + 1] : null);
const CDN = opt('--cdn-lib'), SCEN = opt('--scenarios'), SKIP_NPM = argv.includes('--skip-npm');
const OUT = path.join(WORK, 'reports', 'TASK-ES-687', 'mock'), TOOLS = path.join(WORK, 'reports', 'TASK-ES-687', 'tools');
fs.mkdirSync(path.join(OUT, 'auth-race'), { recursive: true });
const redact = s => String(s).replace(/eyJ[A-Za-z0-9._-]+/g, '(가림)').replace(/https:\/\/[a-z0-9]+\.supabase\.co/g, '(서버 주소 가림)');
const wj = (f, o) => fs.writeFileSync(path.join(OUT, f), JSON.stringify(o, null, 1) + '\n', { encoding: 'utf8' });
const rjAbs = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const node = process.execPath, steps = [];
function sh(id, args, cwd, env) { const t0 = Date.now(); const r = cp.spawnSync(args[0], args.slice(1), { cwd: cwd || WORK, encoding: 'utf8', env: Object.assign({}, process.env, env || {}), maxBuffer: 256 * 1024 * 1024 }); steps.push({ id, exitCode: r.status, ms: Date.now() - t0 }); return r; }
const must = (r, what) => { if (r.status !== 0) { console.error(what + ' 실패: ' + redact(((r.stderr || '') + (r.stdout || '')).slice(-700))); process.exit(1); } return r; };
const git = (cwd, a) => cp.execFileSync('git', a, { cwd, encoding: 'utf8' }).trim();
const lf = s => s.replace(/\r\n/g, '\n');
const npmTest = () => { const r = cp.spawnSync('npm test', { cwd: MOCK, encoding: 'utf8', shell: true, maxBuffer: 256 * 1024 * 1024 }); const t = lf((r.stdout || '') + (r.stderr || '')).split('\n'); fs.writeFileSync(path.join(OUT, 'npm-test.mock.log'), redact(t.join('\n')), { encoding: 'utf8' });
  return { exitCode: r.status, ok: t.filter(l => /^\s*✓ /.test(l)).length, okDot: t.filter(l => /^\s*ok · /.test(l)).length, fail: t.filter(l => /^\s*(✗|✖|not ok|FAIL\b)/.test(l)).length }; };
if (argv.includes('--only-npm')) { // 이미 만든 모의 트리(임시 가지에 커밋된 상태)에서 npm test 만 다시 돌려 mock-apply.json 의 그 칸을 채운다
  const j = rjAbs(path.join(OUT, 'mock-apply.json')); j.npmTest = npmTest(); j.npmTestNote = 'npm test 는 모의 트리(생성기 결과를 임시 가지에 커밋한 상태)에서 따로 돌렸다'; wj('mock-apply.json', j); console.log(JSON.stringify(j.npmTest)); process.exit(0); }
const baseHead = git(BASE, ['rev-parse', 'HEAD']), mockHead0 = git(MOCK, ['rev-parse', 'HEAD']);
if (baseHead !== mockHead0) { console.error('기준 트리와 모의 트리의 커밋이 다르다: ' + baseHead + ' / ' + mockHead0); process.exit(2); }
if (git(MOCK, ['status', '--short'])) { console.error('모의 트리가 깨끗하지 않다'); process.exit(2); }

// ── ① 생성기
const cfg = { task: 'TASK-ES-687-MOCK', slot: 'HO', mode: 'finalize', label: '모의 — 인라인 IIFE 마지막 정리(relay · keepGlobalConst)',
  cells: [{ file: 'js/app/boot.js', title: 'OurGoal App Boot (부팅 — 구역 함수를 순서대로 부른다)', desc: ['구역 함수를 index.html 에 있던 순서 그대로 부른다.'] }],
  relay: [{ name: 'renderTeamGoalsScreen', reason: '주인 세포 js/tabs/goals/team-goals-screen.js 가 798줄이라 등록 블록을 붙이면 800줄 상한을 넘는다 — 등록 기관에 등록하지 못한 이름의 통로 중계' }],
  keepGlobalConst: { statements: ['var SUPABASE_URL', 'var SUPABASE_ANON_KEY'], readers: ["window.OurgoalAppState.define('sb'"], reason: '커밋 훅의 HARDCODED_SECRET 규칙(금고)이 공개 키 선언 줄을 새 파일로 옮기는 것을 막는다 — 선언 두 줄만 제자리에 남긴다(규칙은 건드리지 않는다)' } };
wj('finalize-config.json', cfg);
const metaDir = fs.mkdtempSync(path.join(os.tmpdir(), 'es687-mock-meta-'));
const g = must(sh('1 생성기 finalize(relay · keepGlobalConst)', [node, path.join(WORK, 'docs', 'design', 'harness', 'module-split', 'gen-inline-hard.js'), MOCK, path.join(OUT, 'finalize-config.json')], MOCK, { MODULE_SPLIT_OUT: metaDir }), '생성기');
const meta = JSON.parse(redact(fs.readFileSync(path.join(metaDir, 'gen-inline-hard-meta.json'), 'utf8')));
wj('finalize-meta.json', { stdout: redact((g.stdout || '').trim()).split('\n'), meta });

// ── ② 신고서 · 가드 · 지표
must(sh('2 module-specs --write', [node, 'scripts/module-specs.js', '--write'], MOCK), '신고서');
const mfile = path.join(MOCK, 'docs', 'architecture', 'modules.json');
const kindWritten = (rjAbs(mfile).cells.find(c => c.id === 'app/boot') || {}).kind, dependsOn = (rjAbs(mfile).cells.find(c => c.id === 'app/boot') || {}).dependsOn;
const guard1 = sh('2 module-guard(종류를 정하기 전)', [node, 'scripts/module-guard.js', '--quiet'], MOCK);
{ const raw = fs.readFileSync(mfile, 'utf8'), m = JSON.parse(raw), eol = raw.includes('\r\n') ? '\r\n' : '\n', ind = (raw.match(/\n( +)"/) || [])[1] || ' ';
  m.cells.find(c => c.id === 'app/boot').kind = 'organ';
  fs.writeFileSync(mfile, JSON.stringify(m, null, ind.length).split('\n').join(eol) + (raw.endsWith('\n') ? eol : ''), { encoding: 'utf8' }); }
const descFile = path.join(metaDir, 'desc.json'); fs.writeFileSync(descFile, JSON.stringify({ 'app/boot': ['앱 부팅(모의)', '앱이 뜰 때 시동 함수들을 예전 index.html 에 있던 차례 그대로 부른다(모의)'] }), { encoding: 'utf8' });
must(sh('2 세포 설명', [node, 'docs/design/harness/module-split/cell-desc-add.js', MOCK, descFile], MOCK), '세포 설명');
must(sh('2 module-guard --update', [node, 'scripts/module-guard.js', '--update'], MOCK), '기준선');
const guard2 = sh('2 module-guard(뒤)', [node, 'scripts/module-guard.js', '--quiet'], MOCK);
const ratchet = d => require(path.join(d, 'scripts', 'module-metrics.js')).measure(d).ratchet;
const mB = ratchet(BASE), mM = ratchet(MOCK);

// ── ③ 글자
const bRaw = fs.readFileSync(path.join(BASE, 'index.html')).toString('latin1').split('\n'), mRaw = fs.readFileSync(path.join(MOCK, 'index.html')).toString('latin1').split('\n');
const KEYLINE = /^\s*var SUPABASE_(URL|ANON_KEY) = /, kb = bRaw.filter(l => KEYLINE.test(l)), km = mRaw.filter(l => KEYLINE.test(l));
const ml = lf(fs.readFileSync(path.join(MOCK, 'index.html'), 'utf8')).split('\n'), tagAt = ml.findIndex(l => l === '</script><script src="js/app/boot.js"></script>');
const bootText = fs.readFileSync(path.join(MOCK, 'js', 'app', 'boot.js'), 'utf8');
const words = { baseHtmlLines: lf(fs.readFileSync(path.join(BASE, 'index.html'), 'utf8')).split('\n').length, mockHtmlLines: ml.length, tagLine: tagAt + 1,
  inlineBlock: tagAt >= 3 ? ml.slice(tagAt - 3, tagAt + 1).map(l => redact(l).replace(/'[^']*'/g, "'…'")) : null, blockIsScriptPlusTwoLines: tagAt >= 3 && ml[tagAt - 3] === '<script>' && KEYLINE.test(ml[tagAt - 2]) && KEYLINE.test(ml[tagAt - 1]),
  keyLinesByteIdenticalToBase: kb.length === 2 && km.length === 2 && kb.every((l, i) => Buffer.from(l, 'latin1').equals(Buffer.from(km[i], 'latin1'))),
  bootLines: bootText.split('\n').length - 1, bootHasNoValueText: !/supabase\.co|eyJ[A-Za-z0-9._-]{10,}/.test(bootText), bootReadsNames: (bootText.match(/createClient\(SUPABASE_URL, SUPABASE_ANON_KEY\)/g) || []).length,
  bigIifeLeft: ml.some((l, i) => l.trim() === '<script>' && (ml[i + 1] || '').trim() === '(function(){') };

// ── ④ 실제 커밋 훅(모의 트리의 임시 가지 — 우회 없음, push 없음)
git(MOCK, ['add', '-A']);
const diffAdded = git(MOCK, ['diff', '--cached', '-U0', '--', 'index.html']).split('\n').filter(l => /^\+[^+]/.test(l));
const commit = sh('4 git commit(훅 그대로)', ['git', 'commit', '-m', '[INFRA] #TASK-ES-687 chore: 모의 — keepGlobalConst 적용 결과(로컬 전용, push 하지 않는다)'], MOCK);
const hookLines = lf((commit.stdout || '') + (commit.stderr || '')).split('\n').filter(l => /^[✔✖]/.test(l)).map(redact);
const hook = { exitCode: commit.status, hookLines, forbiddenPatternStepPassed: hookLines.some(l => /^✔ 금지 패턴 없음/.test(l)), hardcodedSecretBlocked: /HARDCODED_SECRET/.test((commit.stdout || '') + (commit.stderr || '')), bypass: false,
  indexHtmlAddedLines: diffAdded.length, addedLinesHaveKeyText: diffAdded.some(l => /SUPABASE_|supabase\.co|eyJ/.test(l)), note: 'index.html 의 diff 에서 더해진 줄은 부팅 태그를 붙인 줄 하나뿐이다 — 남긴 선언 두 줄은 문맥 줄(바뀌지 않은 줄)로 남는다' };

// ── ⑤ 대조 탐침 · 시점 탐침
const probe = path.join(WORK, 'scripts', 'probes', 'cell-registry-compare.js');
sh('5 대조 탐침(기준)', [node, probe, BASE, path.join(OUT, 'compare.base.json'), '--fingerprints']);
sh('5 대조 탐침(모의)', [node, probe, MOCK, path.join(OUT, 'compare.mock.json'), '--fingerprints', '--names-from', path.join(OUT, 'compare.base.json')]);
const cB = rjAbs(path.join(OUT, 'compare.base.json')), cM = rjAbs(path.join(OUT, 'compare.mock.json')), fpd = k => Object.keys(cB.fingerprints[k]).filter(n => cB.fingerprints[k][n] !== ((cM.fingerprints || {})[k] || {})[n]);
const OP = path.join(TOOLS, 'order-probe.cjs');
for (const [n, d] of [['base', BASE], ['mock', MOCK]]) { sh('5 시점 탐침 ' + n, [node, OP, d, path.join(OUT, 'order-probe.' + n + '.json')]); sh('5 시점 탐침(가짜 연결) ' + n, [node, OP, d, path.join(OUT, 'order-probe-fake.' + n + '.json'), '--fake-client']); }
const oB = rjAbs(path.join(OUT, 'order-probe.base.json')).result, oM = rjAbs(path.join(OUT, 'order-probe.mock.json')).result, fB = rjAbs(path.join(OUT, 'order-probe-fake.base.json')).result, fM = rjAbs(path.join(OUT, 'order-probe-fake.mock.json')).result;
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ── ⑥ 돌아온 로그인 사용자 부팅
const AR = path.join(TOOLS, 'auth-race.cjs'), arRows = [];
const runAr = (name, dir, extra) => { const f = path.join(OUT, 'auth-race', name + '.json'); sh('6 auth-race ' + name, [node, AR, WORK, dir, f].concat(extra || [])); const j = rjAbs(f), s = j.summary || {};
  arRows.push({ name, tree: dir === BASE ? '직전 main' : '모의(keepGlobalConst)', lib: j.libVersion, session: !(extra || []).includes('--no-session'), bootOk: j.boot.ok, exceptions: j.boot.exceptions.length, listenerScripts: [...new Set((s.regs || []).map(r => r.script))], initDoneBeforeFirstListener: s.initDoneBeforeReg1,
    signedInDeliveredWithSubs: s.signedInDeliveredWithSubs, appListenersReceivedSignedIn: s.receivedSignedIn, restoreCalls: s.restoreCalls, pendingAuthSessionAtEnd: s.end && s.end.pendingAuthSession, line: s.line || [] }); };
const libs = [['npm', []]].concat(CDN ? [['cdn', ['--lib=' + path.resolve(CDN)]]] : []);
for (const [ln, la] of libs) { for (const i of [1, 2]) runAr(ln + '.prev.' + i, BASE, la); for (const i of [1, 2, 3]) runAr(ln + '.mock.' + i, MOCK, la); runAr(ln + '.prev.nosession', BASE, la.concat(['--no-session'])); for (const i of [1, 2]) runAr(ln + '.mock.nosession.' + i, MOCK, la.concat(['--no-session'])); }
const lineOf = n => JSON.stringify((arRows.find(r => r.name === n) || {}).line);
const authRace = { tool: 'reports/TASK-ES-687/tools/auth-race.cjs', cdnLib: CDN ? { file: path.basename(CDN), sha256: crypto.createHash('sha256').update(fs.readFileSync(path.resolve(CDN))).digest('hex'), note: '운영 화면이 CDN 에서 받는 판을 내려받아 둔 파일(전 구간 대조 2회차 담당이 받은 것) — 저장소에는 넣지 않았다' } : null, rows: arRows,
  byLib: libs.map(([ln]) => ({ lib: ln, withSession: { prevRunsSame: lineOf(ln + '.prev.1') === lineOf(ln + '.prev.2'), mockRunsSameAsPrev: [1, 2, 3].every(i => lineOf(ln + '.mock.' + i) === lineOf(ln + '.prev.1')) }, noSession: { mockRunsSameAsPrev: [1, 2].every(i => lineOf(ln + '.mock.nosession.' + i) === lineOf(ln + '.prev.nosession')) } })) };
authRace.allSameAsPrev = authRace.byLib.every(b => b.withSession.prevRunsSame && b.withSession.mockRunsSameAsPrev && b.noSession.mockRunsSameAsPrev);
authRace.appListenersReceiveSignedIn = arRows.filter(r => r.session).every(r => r.appListenersReceivedSignedIn === 2 && r.signedInDeliveredWithSubs === 3 && r.pendingAuthSessionAtEnd === 'session' && r.initDoneBeforeFirstListener === false);

// ── ⑦ npm test · ⑧ 시나리오
let npm = null;
if (!SKIP_NPM) npm = npmTest();
let scen = null;
if (SCEN) { const files = fs.readdirSync(path.resolve(SCEN)).filter(f => /\.json$/.test(f)).sort().map(f => path.join(path.resolve(SCEN), f)); const rows = {};
  for (let i = 0; i < files.length; i += 10) { const part = path.join(metaDir, 'sc-' + i + '.json'); sh('8 시나리오 ' + (i + 1) + '~', [node, path.join(WORK, 'reports', 'TASK-ES-659', 'tools', 'scenario-local.cjs'), BASE, MOCK, part].concat(files.slice(i, i + 10))); if (fs.existsSync(part)) Object.assign(rows, rjAbs(part).scenarios); }
  const list = Object.keys(rows).map(id => ({ id, base: rows[id].runs.base.passed, base2: rows[id].runs.base2.passed, mock: rows[id].runs.work.passed, mockExceptions: (rows[id].runs.work.exceptions || []).length }));
  scen = { source: path.relative(WORK, path.resolve(SCEN)).replace(/\\/g, '/'), expected: files.length, ran: list.length, allPassed: list.length === files.length && list.every(x => x.base && x.base2 && x.mock), rows: list }; }

const out = { tool: 'reports/TASK-ES-687/tools/mock-apply.cjs', type: '작업자 측정, 판정 아님 — 저장소 밖 사본에서 돌린 모의다(실제 적용은 결심 뒤의 다른 PR)', measuredAt: new Date().toISOString(), base: baseHead,
  generator: { stdout: redact((g.stdout || '').trim()).split('\n'), statements: meta.statements, removed: meta.removed, html: [meta.htmlLinesBefore, meta.htmlLinesAfter], files: meta.files, relayed: (meta.relayed || []).map(x => ({ name: x.name, movedTo: x.movedTo })), keptGlobalConst: meta.keptGlobalConst },
  spec: { kindWrittenByTool: kindWritten, dependsOn, guardExitBeforeKind: guard1.status, kindSetByHand: 'organ', guardExitAfter: guard2.status },
  metrics: { base: mB, mock: mM, note: '공식 지표는 최상위 var 로 생기는 전역 이름을 세지 않는다(windowAssignments 는 그대로다) — 새 전역 둘은 지표로 보이지 않는다' },
  words, commitHook: hook,
  compare: { base: cB.counts, mock: cM.counts, ok: cM.ok, scopeLost: cM.namesFrom ? cM.namesFrom.scopeLost : null, differingScope: fpd('scope'), differingWindow: fpd('window'), exceptions: cM.guestBoot.exceptions.length },
  order: { events: [oB.total, oM.total], eventsSame: same(oB.events, oM.events), bootCalls: [oB.bootCallCount, oM.bootCallCount], bootCallsSame: same(oB.bootCalls, oM.bootCalls), fakeEvents: [fB.total, fM.total], fakeEventsSame: same(fB.events, fM.events), fake: { base: fB.fake, mock: fM.fake } },
  authRace, npmTest: npm, scenarios: scen, steps };
wj('mock-apply.json', out);
fs.rmSync(metaDir, { recursive: true, force: true });
console.log(JSON.stringify({ html: out.generator.html, boot: out.words.bootLines, block: out.words.inlineBlock, words: [out.words.blockIsScriptPlusTwoLines, out.words.keyLinesByteIdenticalToBase, out.words.bootHasNoValueText, out.words.bigIifeLeft], spec: out.spec, metrics: [mB.inlineScriptLines, mM.inlineScriptLines, mB.windowAssignments, mM.windowAssignments],
  hook: [hook.exitCode, hook.forbiddenPatternStepPassed, hook.hardcodedSecretBlocked, hook.indexHtmlAddedLines, hook.addedLinesHaveKeyText], compare: [cM.counts.mismatches, cM.counts.extra, out.compare.scopeLost, out.compare.differingScope.length, out.compare.differingWindow.length], order: [out.order.events, out.order.eventsSame, out.order.fakeEvents, out.order.fakeEventsSame],
  authRace: [authRace.allSameAsPrev, authRace.appListenersReceiveSignedIn, authRace.byLib], npm, scen: scen && [scen.ran, scen.allPassed] }));
