#!/usr/bin/env node
'use strict';
// #TASK-ES-687 측정 모음과 주장(작업자 측정 도구, 판정 아님).
//   measure  단위 시험 결과를 묶음별로 줄이고(unit-summary.json), 바뀐 파일 범위 · npm test(기준 · 작업) · 무결성 게이트 · 독립 확인 결과의 요지 · 모의 적용의 요지를 measurement.json 에 모은다.
//   claims   measurement.json · unit-summary.json · evidence-959 에서 claims.json 을 만든다(기록 주장만 — 이 PR 은 제품 코드를 바꾸지 않는다).
// 사용: node reports/TASK-ES-687/tools/measure.cjs measure <작업 트리>    (먼저: finalize-kgc-unit.json · mock/mock-apply.json · mock/scenarios.json · raw/npm-test.{base,work}.{log,exit})
//       node reports/TASK-ES-687/tools/measure.cjs claims  <작업 트리> --req docs/specs/REQ-….md
const fs = require('fs'), path = require('path'), cp = require('child_process');
const argv = process.argv.slice(2), CMD = argv[0], WORK = path.resolve(argv[1] || '.');
const opt = (k, d) => (argv.indexOf(k) >= 0 ? argv[argv.indexOf(k) + 1] : d);
const TASK = 'TASK-ES-687', REL = 'reports/' + TASK + '/', DIR = path.join(WORK, 'reports', TASK);
const rj = f => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
const wj = (f, o) => fs.writeFileSync(path.join(DIR, f), JSON.stringify(o, null, 1) + '\n', { encoding: 'utf8' });
const git = a => cp.execFileSync('git', a, { cwd: WORK, encoding: 'utf8' }).trim();

if (CMD === 'measure') {
  const u = rj('finalize-kgc-unit.json'), by = {}; u.results.forEach(r => { by[r.id] = r; });
  const ok = ids => ids.length > 0 && ids.every(id => by[id] && by[id].ok === true);
  const ids = re => u.results.map(r => r.id).filter(id => re.test(id));
  const S = ids(/^S\d\d$/), N = ids(/^N\d$/), X = ids(/^X\d$/);
  const summary = { tool: REL + 'tools/measure.cjs', type: '작업자 측정, 판정 아님', source: REL + 'finalize-kgc-unit.json', pin: u.pin, total: u.total, passed: u.passed, failed: u.failed,
    prevSuiteOk: ok(['P']), prevSuite: by.P && by.P.detail, diffConfinedOk: ok(['D']), diffDetail: by.D && by.D.detail, defaultSameOk: ok(['G1']),
    normal: N.length, allNormalOk: N.length === 5 && ok(N), execEquivalentOk: ok(['E1']), scriptBoundaryOk: ok(['E2']), scriptBoundary: by.E2 && by.E2.detail,
    stops: S.length, allStopsOk: S.length === 36 && ok(S), auditOk: ok(['A']), realIndex: X.length, realIndexOk: ok(['X1']), realIndexDetail: by.X1 && by.X1.detail, rerunStopsOk: ok(['X2']), realIndexStopsOk: ok(['X3', 'X4']) };
  wj('unit-summary.json', summary);
  const base = git(['merge-base', 'HEAD', 'origin/main']);
  const files = git(['diff', '--name-only', base, '--']).split('\n').filter(Boolean).concat(git(['ls-files', '--others', '--exclude-standard']).split('\n').filter(Boolean)).filter((f, i, a) => a.indexOf(f) === i).sort();
  const vaultRe = /^(court\/|AGENTS\.md$|CLAUDE\.md$|GEMINI\.md$|01_OURGOAL_SUPREME_CONSTITUTION_FULL\.md$|\.agent\/rules\/|docs\/rules\/(OURGOAL_ABSOLUTE_INTEGRITY_RULES\.md|CONSTITUTION_VERSIONS\.md|ESSENCE_OURGOAL\.md|rules\.json|rules-control\.json|branch-protection.*\.json|archive\/)|\.github\/|\.githooks\/|scripts\/essence-gate\.js$|scripts\/install-essence-gate\.js$|scripts\/verify-integrity-gate\.js$|scripts\/hook-smoke-on-index\.js$|\.vercelignore$|package\.json$|vercel\.json$|\.gitattributes$|\.claude\/settings\.json$|docs\/directives\/)/;
  const readLog = label => { const t = fs.readFileSync(path.join(DIR, 'raw', 'npm-test.' + label + '.log'), 'utf8').replace(/\r\n/g, '\n').split('\n'), ex = fs.readFileSync(path.join(DIR, 'raw', 'npm-test.' + label + '.exit'), 'utf8');
    return { exit: Number((/exit=(\d+)/.exec(ex) || [])[1]), ok: t.filter(l => /^\s*✓ /.test(l)).length, okDot: t.filter(l => /^\s*ok · /.test(l)).length, fail: t.filter(l => /^\s*(✗|✖|not ok|FAIL\b)/.test(l)).length }; };
  const nb = readLog('base'), nw = readLog('work');
  const gate = cp.spawnSync(process.execPath, ['scripts/verify-integrity-gate.js'], { cwd: WORK, encoding: 'utf8' });
  const ev = n => { const j = rj('evidence-959/auth-race.' + n + '.json'), s = j.summary; return { run: n, received: s.received, end: s.end, lib: j.libVersion, listenerScripts: [...new Set(s.regs.map(r => r.script))], initDoneBeforeFirstListener: s.initDoneBeforeReg1, signedInDeliveredWithSubs: s.signedInDeliveredWithSubs, appListenersReceivedSignedIn: s.receivedSignedIn, pendingAuthSessionAtEnd: s.end && s.end.pendingAuthSession, line: s.line }; };
  const evRows = ['cdn.prev.1', 'cdn.prev.2', 'cdn.head.1', 'cdn.head.2', 'prev.1', 'prev.2', 'prev.3', 'head.1', 'head.2', 'head.3', 'prev.nosession', 'head.nosession'].map(ev);
  const prev = evRows.filter(r => /prev\.\d$/.test(r.run)), head = evRows.filter(r => /head\.\d$/.test(r.run));
  const m = rj('mock/mock-apply.json'), sc = fs.existsSync(path.join(DIR, 'mock', 'scenarios.json')) ? rj('mock/scenarios.json') : null;
  const out = { tool: REL + 'tools/measure.cjs', type: '작업자 측정, 판정 아님 — 판정은 GitHub 법정만 낸다', measuredAt: new Date().toISOString(), base, head: git(['rev-parse', 'HEAD']),
    changed: { files: files.length, productFiles: files.filter(f => /^(js\/.*|index\.html|ui\.js|sw\.js|.*\.css)$/.test(f)), testsChanged: files.filter(f => /^tests\//.test(f)), scriptsChanged: files.filter(f => /^scripts\//.test(f)), vaultChanged: files.filter(f => vaultRe.test(f)),
      harnessChanged: files.filter(f => /^docs\/design\/harness\//.test(f)), designDocsChanged: files.filter(f => /^docs\/architecture\//.test(f)), generatedMapsChanged: files.filter(f => /^docs\/architecture\/(cell-map\.json|inline-script-map\.json|INLINE-SCRIPT-MAP\.md|modules\.json|module-baseline\.json)$/.test(f)) },
    unit: { total: summary.total, passed: summary.passed, failed: summary.failed },
    npmTest: { base: nb, work: nw, same: nb.exit === 0 && nw.exit === 0 && nb.ok === nw.ok && nb.okDot === nw.okDot && nb.fail === 0 && nw.fail === 0 }, integrityGateExit: gate.status,
    evidence959: { source: '전 구간 대조 2회차(다른 담당)가 잰 결과 파일을 글자 그대로 옮긴 것 — reports/TASK-ES-687/evidence-959/', rows: evRows,
      prevAllDeliverToAppListeners: prev.length === 5 && prev.every(r => r.appListenersReceivedSignedIn === 2 && r.signedInDeliveredWithSubs === 3 && r.initDoneBeforeFirstListener === false && r.pendingAuthSessionAtEnd === 'session'),
      headNoneDeliverToAppListeners: head.length === 5 && head.every(r => r.appListenersReceivedSignedIn === 0 && r.signedInDeliveredWithSubs === 1 && r.initDoneBeforeFirstListener === true && r.pendingAuthSessionAtEnd === 'null'),
      noSessionReceivedSame: (() => { const a = evRows.find(r => r.run === 'prev.nosession'), b = evRows.find(r => r.run === 'head.nosession'); return JSON.stringify(a.received) === JSON.stringify(b.received) && JSON.stringify(a.end) === JSON.stringify(b.end) && a.appListenersReceivedSignedIn === 0 && b.appListenersReceivedSignedIn === 0; })(),
      noSessionNote: '세션이 없으면 두 쪽 모두 앱 수신기가 INITIAL_SESSION(null)만 받고 끝 상태가 같다. 사건 줄 자체는 초기화가 끝나는 자리(수신기 걸기 앞/뒤)만 다르다 — 그래서 게스트 시나리오로는 차이가 드러나지 않는다' },
    mock: { source: REL + 'mock/mock-apply.json', base: m.base, html: m.generator.html, bootLines: m.words.bootLines, inlineBlockLines: m.words.inlineBlock ? m.words.inlineBlock.length : null, words: { blockIsScriptPlusTwoLines: m.words.blockIsScriptPlusTwoLines, keyLinesByteIdenticalToBase: m.words.keyLinesByteIdenticalToBase, bootHasNoValueText: m.words.bootHasNoValueText, bigIifeLeft: m.words.bigIifeLeft },
      metrics: m.metrics, commitHook: m.commitHook, compare: { mismatches: m.compare.mock.mismatches, scopeLost: m.compare.scopeLost, differingScope: m.compare.differingScope.length, differingWindow: m.compare.differingWindow.length, exceptions: m.compare.exceptions },
      order: m.order, authRace: { allSameAsPrev: m.authRace.allSameAsPrev, appListenersReceiveSignedIn: m.authRace.appListenersReceiveSignedIn, byLib: m.authRace.byLib, runs: m.authRace.rows.length }, npmTest: m.npmTest,
      scenarios: sc ? { ran: sc.ran, allPassed: sc.allPassed } : null, globalNameScan: m.generator.keptGlobalConst && m.generator.keptGlobalConst.globalNameScan } };
  wj('measurement.json', out);
  console.log(JSON.stringify({ unit: out.unit, groups: [summary.prevSuiteOk, summary.diffConfinedOk, summary.defaultSameOk, summary.allNormalOk, summary.execEquivalentOk, summary.scriptBoundaryOk, summary.allStopsOk, summary.auditOk, summary.realIndexOk, summary.rerunStopsOk, summary.realIndexStopsOk], changed: out.changed, npm: out.npmTest, gate: out.integrityGateExit,
    ev: [out.evidence959.prevAllDeliverToAppListeners, out.evidence959.headNoneDeliverToAppListeners, out.evidence959.noSessionReceivedSame], mock: [out.mock.html, out.mock.authRace, out.mock.scenarios] }));
  process.exit(0);
}
if (CMD === 'claims') {
  const REQ = opt('--req'), U = REL + 'unit-summary.json', M = REL + 'measurement.json', claims = []; let n = 0;
  const getPath = (o, p) => p.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);
  const add = (req, statement, file, p, equals) => { const v = getPath(JSON.parse(fs.readFileSync(path.join(WORK, file), 'utf8')), p);
    if (JSON.stringify(v) !== JSON.stringify(equals)) { console.error('값 불일치: ' + file + ' ' + p + ' = ' + JSON.stringify(v).slice(0, 200)); process.exit(1); }
    claims.push({ id: 'C' + (++n), req, kind: 'static', domain: 'config', statement, touches: [file], check: { type: 'jsonPath', file, path: p, equals } }); };
  const text = (req, statement, file, t) => { if (!fs.readFileSync(path.join(WORK, file), 'utf8').includes(t)) { console.error('글자 없음: ' + file + ' — ' + t); process.exit(1); } claims.push({ id: 'C' + (++n), req, kind: 'static', domain: 'config', statement, touches: [file], check: { type: 'codeContains', file, text: t } }); };
  add('R1', 'keepGlobalConst 를 채운 꾸러미 다섯(선언 둘 + 읽는 상태 선언 · 읽는 문 없음 · defineVar · CRLF · 주석 속 같은 이름)에서 선언만 최상위 스크립트에 줄 그대로 남고 나머지는 부팅 파일로 원래 차례 그대로 간다.', U, 'allNormalOk', true);
  add('R1', '실행 등가(vm): 원래 IIFE 와 「남긴 최상위 스크립트 → 부팅 파일」의 사건 줄과 통로 중계 값이 같다.', U, 'execEquivalentOk', true);
  add('R1', '실제 index.html(기준 커밋)과 실제 js 폴더에서 relay + keepGlobalConst 로 성공하고 인라인에는 선언 두 줄만 남는다(임시 사본).', U, 'realIndexOk', true);
  add('R1', '생성기와 따로 한 감사: 원래 문 = 남긴 선언 + 옮긴 문(겹침 0) · 남긴 블록은 문자열 상수 선언뿐(괄호 0) · 블록 밖 줄 그대로.', U, 'auditOk', true);
  add('R2', '정지 꾸러미는 36건이다.', U, 'stops', 36);
  add('R2', '정지 36건이 전부 기대한 글자로 멈추고 index.html 은 바이트 그대로이며 부팅 파일이 생기지 않는다.', U, 'allStopsOk', true);
  add('R2', '스크립트 사이마다 밀린 약속을 비우는 조건(vm)에서 원래 IIFE 와 keepGlobalConst 꼴은 수신기가 알림을 받고 keepInline 꼴은 받지 못한다.', U, 'scriptBoundaryOk', true);
  add('R2', '한 번 돌린 결과에 다시 돌리면 멈춘다.', U, 'rerunStopsOk', true);
  add('R2', '실제 index.html: readers 나 relay 를 빼면 전제 미충족으로 멈춘다.', U, 'realIndexStopsOk', true);
  add('R3', '옵션을 적지 않으면 기준 생성기와 결과가 같다(꾸러미 6개의 index.html · 부팅 파일 · 표준 출력 · 메타 · 오류 글자).', U, 'defaultSameOk', true);
  add('R3', '생성기 diff 는 runFinalize 구간 안에만 있다. 검사기는 기준과 같다.', U, 'diffConfinedOk', true);
  add('R3', '앞선 단위 시험 89건(relay · keepInline · dropDeadImport)이 고친 생성기에서도 전부 통과한다.', U, 'prevSuiteOk', true);
  add('R3', '단위 시험 51건 가운데 실패한 것이 없다.', U, 'failed', []);
  add('R4', '독립 확인의 기록: 직전 main 은 다섯 번 모두 앱 수신기 둘이 SIGNED_IN 을 받는다(걸려 있던 수신기 3 · 끝의 대기 세션 있음).', M, 'evidence959.prevAllDeliverToAppListeners', true);
  add('R4', '독립 확인의 기록: keepInline 꼴(#959 머리)은 다섯 번 모두 앱 수신기가 SIGNED_IN 을 받지 못한다(걸려 있던 수신기 1 · 초기화가 첫 수신기보다 먼저 끝남 · 끝의 대기 세션 null).', M, 'evidence959.headNoneDeliverToAppListeners', true);
  add('R4', '독립 확인의 기록: 세션이 없는 대조군은 두 쪽 모두 앱 수신기가 받는 사건(INITIAL_SESSION · null)과 끝 상태가 같다 — 게스트로는 차이가 드러나지 않는다.', M, 'evidence959.noSessionReceivedSame', true);
  text('R4', '설계 문서의 finalize 절(5.8)에 경고가 있다.', 'docs/architecture/CELL-REGISTRY-DESIGN.md', '문 차례가 같아도 스크립트를 가르면 동작이 달라질 수 있다');
  text('R4', '설계 문서 5.9 에 keepInline 의 한계가 측정과 함께 적혀 있다.', 'docs/architecture/CELL-REGISTRY-DESIGN.md', '서버 연결 세 문에 쓰면 동작이 보존되지 않는다');
  add('R5', '제품 파일(js/** · index.html · ui.js · sw.js · css) 변경이 없다.', M, 'changed.productFiles', []);
  add('R5', 'tests/ 아래 바뀐 파일이 없다.', M, 'changed.testsChanged', []);
  add('R5', 'scripts/ 아래 바뀐 파일이 없다.', M, 'changed.scriptsChanged', []);
  add('R5', '금고 아래 바뀐 파일이 없다.', M, 'changed.vaultChanged', []);
  add('R5', '신고서 · 기준선 · 생성 지도 변경이 없다.', M, 'changed.generatedMapsChanged', []);
  add('R5', '바뀐 하네스 파일은 생성기와 새 단위 시험 둘뿐이다.', M, 'changed.harnessChanged', ['docs/design/harness/module-split/finalize-check-687.js', 'docs/design/harness/module-split/gen-inline-hard.js']);
  add('R5', 'npm test 가 기준·작업에서 종료 코드 0 이고 검사 수가 같다.', M, 'npmTest.same', true);
  add('R5', '무결성 게이트 종료 코드가 0 이다.', M, 'integrityGateExit', 0);
  wj('claims.json', { task: TASK, requirementsSource: REQ, requirements: [
    { id: 'R1', text: 'finalize 에 명시적 옵션 keepGlobalConst 를 더한다 — 문자열 리터럴로 초기화하는 한 줄 var 선언만 껍데기 없는 최상위 스크립트에 줄 그대로 남기고, 그 이름을 읽는 상태 선언과 나머지 문은 전부 부팅 파일로.' },
    { id: 'R2', text: '정지 조건과 사후 대조: 문자열 상수 선언이 아니거나 차례·전역 이름이 안전하지 않으면 아무것도 쓰지 않고 멈춘다. 인라인에는 선언만 남는다.' },
    { id: 'R3', text: '옵션을 적지 않으면 기준 생성기와 결과가 같고, 생성기 diff 는 runFinalize 구간 안뿐이며, 앞선 단위 시험이 그대로 통과한다.' },
    { id: 'R4', text: '이번 경위(keepInline 꼴이 동작을 보존하지 못한 측정)와 경고를 기록으로 남긴다.' },
    { id: 'R5', text: '제품 코드 · tests · scripts · 금고 변경 0, npm test 와 무결성 게이트가 기준과 같다.' } ],
    outOfScopeReports: [
      { text: '실제 적용(index.html 변경 · js/app/boot.js)은 이 PR 에 없다 — 상민님 결심 뒤의 다른 PR 이다. 모의 적용 결과(mock/)는 결심의 입력으로 적었고 주장으로 걸지 않았다.', cannotBecause: 'out-of-scope-feature' },
      { text: '진짜 서버로 로그인한 계정의 끝 결과 · 만료된 세션 · OAuth 복귀 · 느린 망에서의 테마 적용 시각은 재지 못했다(외부 통신 차단 · 실계정 미사용).', cannotBecause: 'needs-real-account' } ],
    notes: [{ text: '병합 보류 — 닫힌 목록 밖의 줄 종류이고 2026-10-11 결심 ①이 승인한 모양을 바꾼다. 오케스트레이터가 상민님께 다시 여쭙는 중이다.' }],
    claims });
  console.log('claims', claims.length);
  process.exit(0);
}
console.error('사용: node measure.cjs measure|claims <작업 트리>'); process.exit(2);
