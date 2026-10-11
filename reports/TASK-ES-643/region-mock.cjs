#!/usr/bin/env node
'use strict';
// 구역 감싸기 모의 적용 측정(#TASK-ES-643) — 작업자 도구, 판정 아님.
// 저장소 밖 사본 둘(기준 = origin/main, 모의 = 같은 커밋에 구역 계획을 생성기로 적용한 것)을 맞대어 잰다. 저장소의 제품 파일은 건드리지 않는다.
//   앱이 실제로 뜨는가(게스트 시나리오) · 대조 탐침(통로·window 이름별 값 지문) · 상태 탐침(값 요약·접근자·쓰기 왕복) · 모듈 로드 · npm test · 시험 하나씩 · 인라인 줄 수 ·
//   모의 적용 뒤 IIFE 에 남는 최상위 문의 종류별 표(= sweep · finalize 와 그 앞 단계의 입력)
// 사용(작업 트리에서, NODE_PATH=C:/dev/ourgoal-app/node_modules):
//   node reports/TASK-ES-643/region-mock.cjs <작업 트리> --base <기준 트리> --mock <모의 트리> --plan <모의 트리에 적용할 때 계획기가 낸 json>
//   먼저: reports/TASK-ES-643/raw/npm-test.{base,mock}.{log,exit} · tests-{base,mock}.json(reports/TASK-ES-614/run-tests-each.cjs)
const fs = require('fs'), path = require('path'), cp = require('child_process');
const argv = process.argv.slice(2), ROOT = path.resolve(argv[0] || '.');
const opt = (k, d) => (argv.indexOf(k) >= 0 ? argv[argv.indexOf(k) + 1] : d);
const BASE = path.resolve(opt('--base')), MOCK = path.resolve(opt('--mock')), PLAN = JSON.parse(fs.readFileSync(path.resolve(opt('--plan')), 'utf8'));
const TASK = 'TASK-ES-643', REL = 'reports/' + TASK + '/', DIR = path.join(ROOT, 'reports', TASK);
const wj = (f, o) => fs.writeFileSync(path.join(DIR, f), JSON.stringify(o, null, 1) + '\n', { encoding: 'utf8' });
const rj = f => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
const lf = s => s.replace(/\r\n/g, '\n');
const commands = [];
function run(id, args, cwd) { const t0 = new Date().toISOString(); const r = cp.spawnSync(args[0], args.slice(1), { cwd: cwd || ROOT, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 }); commands.push({ id, startedAt: t0, endedAt: new Date().toISOString(), exitCode: r.status, stderrHead: (r.stderr || '').slice(0, 200) }); return r; }
const git = (args, cwd) => run('git ' + args[0], ['git'].concat(args), cwd);
const L = s => s.trim().split('\n').map(x => x.trim()).filter(Boolean);
const { inventory } = require('./region-inventory.cjs');

const baseHead = git(['rev-parse', 'HEAD'], BASE).stdout.trim(), mockHead = git(['rev-parse', 'HEAD'], MOCK).stdout.trim();
const numstat = L(git(['diff', '--numstat', 'HEAD', '--'], MOCK).stdout).map(l => { const [a, d, f] = l.split('\t'); return { file: f, insertions: Number(a), deletions: Number(d) }; });
// 줄 수 · 재고
const mm = f => require(path.join(f, 'scripts', 'module-metrics.js')).measure(f).ratchet, mB = mm(BASE), mM = mm(MOCK);
const table = v => { const t = {}; v.stmts.forEach(x => { const k = t[x.kind] = t[x.kind] || { statements: 0, lines: 0 }; k.statements++; k.lines += x.lines; }); return t; };
const iB = inventory(path.join(BASE, 'index.html')), iM = inventory(path.join(MOCK, 'index.html')), tB = table(iB), tM = table(iM);
// 다시 파싱 · 세포 줄 수
const parser = require('@babel/parser');
const cells = Object.keys(PLAN.generator.files).map(f => { const t = lf(fs.readFileSync(path.join(MOCK, f), 'utf8')); let ok = true; try { parser.parse(t, { sourceType: 'script' }); } catch (e) { ok = false; } return { file: f, lines: t.split('\n').length - 1, parses: ok }; });
// 시나리오
const scDir = path.join(ROOT, 'reports', 'TASK-ES-637', 'scenarios'), scFiles = fs.readdirSync(scDir).filter(f => /\.json$/.test(f)).sort().map(f => path.join(scDir, f));
run('scenario-local', [process.execPath, path.join(ROOT, 'docs', 'design', 'harness', 'module-split', 'scenario-local-z56.js'), BASE, MOCK, path.join(DIR, 'scenario-mock.json')].concat(scFiles));
const sc = rj('scenario-mock.json');
const scRows = Object.keys(sc.scenarios).map(id => ({ id, basePassed: sc.scenarios[id].runs.base.passed, mockPassed: sc.scenarios[id].runs.work.passed, baseExceptions: (sc.scenarios[id].runs.base.exceptions || []).length, mockExceptions: (sc.scenarios[id].runs.work.exceptions || []).length, nonVacuousExpects: sc.scenarios[id].runs.work.nonVacuousExpects }));
// 대조 탐침(이름 목록은 기준 트리 결과로 고정)
const cmp = path.join(ROOT, 'scripts', 'probes', 'cell-registry-compare.js');
run('registry probe base', [process.execPath, cmp, BASE, path.join(DIR, 'cell-registry-compare.base.json'), '--fingerprints']);
run('registry probe base2', [process.execPath, cmp, BASE, path.join(DIR, 'cell-registry-compare.base2.json'), '--fingerprints']);
run('registry probe mock', [process.execPath, cmp, MOCK, path.join(DIR, 'cell-registry-compare.mock.json'), '--fingerprints', '--names-from', path.join(DIR, 'cell-registry-compare.base.json')]);
const cB = rj('cell-registry-compare.base.json'), cB2 = rj('cell-registry-compare.base2.json'), cM = rj('cell-registry-compare.mock.json');
const fpd = (x, y, k) => Object.keys(x.fingerprints[k]).filter(n => x.fingerprints[k][n] !== (y.fingerprints[k] || {})[n]);
const intrinsicFp = { scope: fpd(cB, cB2, 'scope'), window: fpd(cB, cB2, 'window') };
const fpDiff = { scope: fpd(cB, cM, 'scope').filter(n => !intrinsicFp.scope.includes(n)), window: fpd(cB, cM, 'window').filter(n => !intrinsicFp.window.includes(n)) };
// 상태 탐침(통로에 노출된 상태 이름 — #914 의 고정 목록)
const probe = path.join(ROOT, 'reports', 'TASK-ES-636', 'state-probe.cjs'), namesFile = path.join(ROOT, 'reports', 'TASK-ES-637', 'probe-names.json');
for (const [tree, out] of [[BASE, 'state-probe.base.json'], [BASE, 'state-probe.base2.json'], [MOCK, 'state-probe.mock.json']]) run('state-probe ' + out, [process.execPath, probe, tree, path.join(DIR, out), '--names', namesFile]);
const pB = rj('state-probe.base.json'), pB2 = rj('state-probe.base2.json'), pM = rj('state-probe.mock.json');
const FIELDS = ['accessor', 'owner', 'value', 'onWindow', 'windowValue', 'windowSame', 'writeRoundtrip', 'restored', 'error'];
const pdiff = (x, y) => Object.keys(x.names || {}).filter(n => FIELDS.some(f => JSON.stringify(x.names[n][f]) !== JSON.stringify(((y.names || {})[n] || {})[f])));
const intrinsicState = pdiff(pB, pB2), stateDiff = pdiff(pB, pM).filter(n => !intrinsicState.includes(n));
const writable = p => { const v = Object.values(p.names || {}).filter(x => x.accessor === 'get+set'); return { names: v.length, roundtripOk: v.filter(x => x.writeRoundtrip === true && x.restored === true).length }; };
// 모듈 로드
const ml = require(path.join(ROOT, 'court', 'probes', 'module-load.js'));
const mlCmp = ml.compare(ml.probeModules(BASE), ml.probeModules(MOCK), fs.readFileSync(path.join(MOCK, 'index.html'), 'utf8'));
// npm test 로그 비교
function readLog(label) {
  const txt = lf(fs.readFileSync(path.join(DIR, 'raw', 'npm-test.' + label + '.log'), 'utf8')), T = txt.split('\n');
  const exitTxt = fs.readFileSync(path.join(DIR, 'raw', 'npm-test.' + label + '.exit'), 'utf8').trim();
  const norm = s => s.trim().replace(/\d+(\.\d+)?\s?ms\b/g, 'Nms').replace(/[A-Za-z]:[\\/][^\s"')]+/g, '<path>');
  const ok = T.filter(l => /^\s*✓ /.test(l)).map(norm), okDot = T.filter(l => /^\s*ok · /.test(l)).map(norm), fail = T.filter(l => /^\s*(✗|✖|not ok|FAIL\b)/.test(l)).map(norm);
  return { file: REL + 'raw/npm-test.' + label + '.log', ok: ok.length, okDot: okDot.length, fail: fail.length, failLines: fail.slice(0, 20), exit: Number((/exit=(\d+)/.exec(exitTxt) || [])[1]), checks: ok.concat(okDot) };
}
const nb = readLog('base'), nm = readLog('mock');
const ms = a => { const m = {}; a.forEach(x => { m[x] = (m[x] || 0) + 1; }); return m; }, b1 = ms(nb.checks), m1 = ms(nm.checks);
const onlyBase = Object.keys(b1).filter(k => (m1[k] || 0) < b1[k]), onlyMock = Object.keys(m1).filter(k => (b1[k] || 0) < m1[k]);
delete nb.checks; delete nm.checks;
// 시험 하나씩
const eB = rj('tests-base.json'), eM = rj('tests-mock.json');
const fset = t => new Set(t.testFiles.filter(x => x.exit !== 0).map(x => x.file)), fB = fset(eB), fM = fset(eM), tail = (t, f) => (t.testFiles.find(x => x.file === f) || {}).tail || null;
const scripts = eM.scripts.map(s => { const b = eB.scripts.find(x => x.script === s.script) || {}; return { script: s.script, exit: [b.exit, s.exit], ok: [b.ok, s.ok], okDot: [b.okDot, s.okDot], fails: [(b.fails || []).length, s.fails.length], newFails: s.fails.filter(x => !(b.fails || []).includes(x)).slice(0, 12) }; });
const newFailFiles = [...fM].filter(x => !fB.has(x)).map(f => ({ file: f, tail: String(tail(eM, f) || '').slice(-400) }));
// 남는 줄 표
const how = {
  kitHandle: '손잡이 줄 — 그 손잡이의 가져오기가 모두 지워진 뒤 unwire dropKitVar(X2) · finalize',
  kitImport: '가져오기 줄 — 구역 함수 것은 finalize, 등록된 이름은 unwire(U1), 등록 안 된 이름은 세포가 등록 기관에 등록한 뒤 unwire',
  exposeCall: '통로 getter/setter 줄 — 등록된 이름은 unwire(U2), 상태 이름은 unstate(X4), 구역이 새로 단 가져오기 이름의 getter 는 그 이름을 등록 기관에 등록한 뒤 unwire',
  functionDecl: '함수 선언 — 함수 이전(A 트랙) · 944줄 함수는 지시함 묶음 4(A안)',
  varExposed: '통로에 노출된 상태 var — 맨이름 참조가 없어지면 unstate(X4·X5), 그 뒤 그 define 줄을 구역으로. 모의 적용 뒤 수가 느는 것은 구역에 못 든 var(btnAvLvClose · capturePhotoBtn)를 구역 본문이 통로로 읽게 돼 getter 가 생겼기 때문이다',
  varNotExposed: '노출 안 된 var — 남은 것은 구역 밖(노출된 var sb 의 초기값)에서 쓰는 SUPABASE_URL · SUPABASE_ANON_KEY 와 결심 대기 OURGOAL_CONFIG',
  stateDefine: '기관 define 줄 — 구역으로(M1b). 여기 남은 것은 구역을 끊는 문 사이에 낀 것',
  wrapCall: '감싼 함수 부르는 줄 — 구역으로(M1a) 또는 finalize',
  regionCall: '구역 함수 부르는 줄 — finalize 가 js/app/boot.js 로 옮긴다',
  windowCopy: 'window 복사 줄 — 구역으로(M1d). 여기 남은 것은 못 넣는 문과 한 줄을 나눠 쓰는 것', windowCopyBlock: 'window 복사 if 블록 — 구역으로(M1d). 여기 남은 것은 결심 대기 대상(OURGOAL_CONFIG)',
  windowDefBlock: 'window 정의 if 블록 — 구역으로. 여기 남은 것은 모듈 가드가 인라인 소유 이름으로 세는 줄(window.SHARED_GROUPS_LOADED = false — region-pins.json)', windowLiteral: 'window 리터럴 대입 — 구역으로', windowFunctionDef: 'window 함수식 대입 — 구역으로 또는 옮기기 경로의 감싸기',
  if: 'if 문 — 구역으로. 여기 남은 것은 돈 근처(OurgoalTemplateCredit.init) 줄', try: 'try 문 — 구역으로', call: '호출문 — 구역으로',
};
const kinds = [...new Set(Object.keys(tB).concat(Object.keys(tM)))].sort();
const remaining = kinds.map(k => ({ kind: k, before: tB[k] || { statements: 0, lines: 0 }, after: tM[k] || { statements: 0, lines: 0 }, next: how[k] || '' }));
remaining.push({ kind: '(주석 줄)', before: { lines: iB.comment }, after: { lines: iM.comment }, next: '문이 없는 구획의 주석 — sweep(X8). 문이 남은 구획의 주석과 자리 표지는 finalize' });
remaining.push({ kind: '(빈 줄)', before: { lines: iB.blank }, after: { lines: iM.blank }, next: 'sweep(X8) · finalize' });
remaining.push({ kind: '(IIFE 껍데기)', before: { lines: 3 }, after: { lines: 3 }, next: 'finalize(X9)' });
const leftStatements = iM.stmts.filter(x => !['functionDecl', 'kitImport', 'kitHandle', 'exposeCall', 'regionCall'].includes(x.kind)).map(x => ({ line: x.line, lines: x.lines, kind: x.kind, text: x.text.slice(0, 90) }));

const unit = fs.existsSync(path.join(DIR, 'region-unit.json')) ? rj('region-unit.json') : null;
const out = { schema: 'ourgoal.region-mock/1', taskId: TASK, type: '작업자 측정, 판정 아님 — 저장소 밖 사본에서 잰 것이다. 이 PR 은 index.html 을 바꾸지 않는다', measuredAt: new Date().toISOString(),
  environment: { node: process.version, platform: process.platform },
  sourceCommit: { base: baseHead, mock: mockHead + ' + 구역 계획 적용(커밋하지 않은 작업 상태)', planBasis: PLAN.basis && PLAN.basis.commit },
  summary: {
    plan: { regions: PLAN.totals.regions, statements: PLAN.totals.statementsInRegions, statementLines: PLAN.totals.statementLinesInRegions, linesMoved: PLAN.regions.reduce((a, r) => a + (r.lines || 0), 0), locals: PLAN.regions.reduce((a, r) => a + (r.locals || []).length, 0), gettersAdded: PLAN.generator.exposedAdded.length, headLines: PLAN.generator.headLines, files: PLAN.generator.files },
    changedInMock: numstat,
    htmlLines: PLAN.generator.htmlLines, inlineScriptLines: { before: mB.inlineScriptLines, after: mM.inlineScriptLines, delta: mM.inlineScriptLines - mB.inlineScriptLines },
    ratchet: { indexFunctionDecls: [mB.indexFunctionDecls, mM.indexFunctionDecls], windowAssignments: [mB.windowAssignments, mM.windowAssignments], oversizeJsFiles: [mB.oversizeJsFiles.count, mM.oversizeJsFiles.count] },
    parse: { inlineParses: true, cells },
    staticOrder: unit ? { unitP3: (unit.results.find(r => r.id === 'P3') || {}).ok, detail: (unit.results.find(r => r.id === 'P3') || {}).detail, note: '구역 함수 본문 줄에서 L. 접두만 걷어 내면 이전 전 구역의 줄과 같다 = 문 순서가 이전 전 줄 순서와 같다(단위 시험 P3, PIN 커밋 사본). 생성기도 쓰기 전에 토큰열로 같은 것을 본다' } : null,
    scenarios: { rows: scRows, allPassedBoth: scRows.length > 0 && scRows.every(r => r.basePassed && r.mockPassed && !r.mockExceptions) },
    registryCompare: { ok: cM.ok, counts: cM.counts, scopeLost: cM.namesFrom ? cM.namesFrom.scopeLost : null, scopeAdded: cM.namesFrom ? (cM.namesFrom.scopeAdded || []).length : null, intrinsicVariance: intrinsicFp, differingScope: fpDiff.scope, differingWindow: fpDiff.window, exceptions: cM.guestBoot.exceptions.length, consoleErrors: cM.guestBoot.consoleErrors.length, baseExceptions: cB.guestBoot.exceptions.length },
    stateProbe: { names: Object.keys(pB.names || {}).length, bootOk: { base: pB.guestBoot.ok, mock: pM.guestBoot.ok }, exceptions: { base: pB.guestBoot.exceptions.length, mock: pM.guestBoot.exceptions.length }, intrinsicVariance: intrinsicState, differing: stateDiff, writable: { base: writable(pB), mock: writable(pM) }, captureSame: JSON.stringify(pB.checks) === JSON.stringify(pM.checks) },
    moduleLoad: { regressions: mlCmp.regressions.length, regressionList: mlCmp.regressions.slice(0, 10), insufficient: mlCmp.insufficient.length },
    npmTest: { base: nb, mock: nm, sameCounts: nb.ok === nm.ok && nb.okDot === nm.okDot && nb.exit === nm.exit, onlyBase: onlyBase.slice(0, 30), onlyMock: onlyMock.slice(0, 30) },
    testsEach: { scripts, testFiles: eM.testFiles.length, failedBase: fB.size, failedMock: fM.size, newFailFiles, fixedInMock: [...fB].filter(x => !fM.has(x)) },
    remaining: { note: '모의 적용 뒤 인라인 IIFE 최상위에 남는 것(문 수 · 줄 수)과 다음에 그것을 없애는 단계', rows: remaining, leftLoadStatements: leftStatements },
  },
  limits: ['법정 판정이 아니다. 모의 사본은 커밋·PR 이 아니다.', '구역 함수 이름 · 세포 파일 · 키트는 계획기의 가칭이다. 실제 PR 은 구역마다 이름과 세포를 정하고 지도(modules.json 등)를 맞춘다 — 모의 사본에서 그 지도를 맞추지 않아 깨지는 시험은 따로 적는다.', '화면 시나리오가 닿는 범위는 게스트의 탭 전환 · 목표 하위 탭 · 종 모달 · 새 목표 창 · AI 목표 어시스턴트 서랍까지다. 로그인 뒤 화면과 숨겨진 진입로는 측정불가다.', '호출 순서의 동적 대조(설계 3.4 의 탐침안)는 만들지 않았다 — 미검증. 순서는 정적 대조(줄 순서 동일)와 꾸러미의 vm 실행 등가로만 쟀다.'],
  commands };
wj('region-mock.json', out);
const s = out.summary;
console.log(JSON.stringify({ plan: s.plan, inline: s.inlineScriptLines, html: s.htmlLines, parse: s.parse.cells, scenarios: s.scenarios.rows.map(r => [r.id, r.basePassed, r.mockPassed, r.mockExceptions]), registry: { ok: s.registryCompare.ok, mism: s.registryCompare.counts && s.registryCompare.counts.mismatches, lost: s.registryCompare.scopeLost, added: s.registryCompare.scopeAdded, intrinsic: s.registryCompare.intrinsicVariance, dScope: s.registryCompare.differingScope, dWin: s.registryCompare.differingWindow, exc: s.registryCompare.exceptions },
  state: { differing: s.stateProbe.differing, intrinsic: s.stateProbe.intrinsicVariance, boot: s.stateProbe.bootOk, exc: s.stateProbe.exceptions, writable: s.stateProbe.writable }, ml: s.moduleLoad, npm: { base: [nb.exit, nb.ok, nb.okDot, nb.fail], mock: [nm.exit, nm.ok, nm.okDot, nm.fail], onlyBase: onlyBase.length, onlyMock: onlyMock.length }, each: { scripts: scripts.map(x => [x.script, x.exit, x.ok, x.fails]), failed: [fB.size, fM.size], newFail: newFailFiles.map(x => x.file) } }));
