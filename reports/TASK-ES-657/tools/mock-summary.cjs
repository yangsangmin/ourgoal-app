'use strict';
// saveGoogleToken 모의 이전 사본의 결과를 모은다(작업자 측정, 판정 아님). 모의 = 현재 main(1c40f599)의 git 작업 폴더에 고친 생성기를 mock-config.json 으로 돌리고 module-specs --write 까지 한 것. 실제 이전 0.
// 사용: node mock-summary.cjs <작업 트리> <기준 작업 폴더> <모의 작업 폴더> <raw 폴더(tests-all.base.json · tests-all.mock.first.json · tests-all.mock.json · gen-inline-hard-meta.json · verify-inline-hard.json)> <흔들림 재실행 기준 "0 0 0"> <모의 "0 0 0">
const fs = require('fs'), path = require('path'), cp = require('child_process');
const [WORK, BASE, MOCK, RAW, FB, FM] = process.argv.slice(2);
const rj = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const tb = rj(path.join(RAW, 'tests-all.base.json')), t1 = rj(path.join(RAW, 'tests-all.mock.first.json')), t2 = rj(path.join(RAW, 'tests-all.mock.json'));
const diff = (a, b) => Object.keys(a).filter(k => !b[k] || a[k].exit !== b[k].exit || a[k].okLines !== b[k].okLines);
const meta = rj(path.join(RAW, 'gen-inline-hard-meta.json')), verify = rj(path.join(RAW, 'verify-inline-hard.json'));
const guard = cp.spawnSync(process.execPath, ['scripts/module-guard.js'], { cwd: MOCK, encoding: 'utf8' });
const G = 'tests/gcal-login-reconnect-fix.test.js', F = 'tests/offline-sync-queue-retain.test.js';
const html = fs.readFileSync(path.join(MOCK, 'index.html'), 'utf8'), cell = fs.readFileSync(path.join(MOCK, 'js', 'core', 'gcal-token-save.js'), 'utf8');
const d1 = diff(tb, t1), d2 = diff(tb, t2);
const out = { type: '작업자 측정, 판정 아님', what: '현재 main(1c40f599)의 git 작업 폴더 둘(기준 · 모의)에서 saveGoogleToken 모의 이전을 재고 시험 파일을 하나씩 돌려 비교했다. 실제 이전은 0 이다(모의 작업 폴더는 측정 뒤 지운다).',
  baseHead: cp.execFileSync('git', ['rev-parse', 'HEAD'], { cwd: BASE, encoding: 'utf8' }).trim(), config: 'reports/TASK-ES-657/mock-config.json',
  generator: { ok: true, htmlLines: [meta.htmlLinesBefore, meta.htmlLinesAfter], files: meta.files, ownArguments: meta.ownArguments || null, newExposeGetters: meta.exposed, imports: meta.imports.map(i => i.n) },
  verify: { ok: verify.ok, ownArguments: verify.ownArguments || null, thisArgs: verify.thisArgs },
  text: { windowExposureLineStaysInIndexHtml: html.includes('window.saveGoogleToken = saveGoogleToken;'), declarationInCell: cell.includes('function saveGoogleToken(tokenObj){'), argumentsLineUntouched: cell.includes('var optEmail = arguments[1];') },
  moduleGuard: { exitCode: guard.status, tail: (guard.stdout || '').trim().split(/\r?\n/).slice(-4) },
  testsAll: { files: Object.keys(tb).length, nonZeroExitBase: Object.keys(tb).filter(k => tb[k].exit !== 0).length,
    firstRun: { differingCount: d1.length, differing: d1.map(k => ({ file: k, base: [tb[k].exit, tb[k].okLines], mock: [t1[k].exit, t1[k].okLines] })) },
    secondRun: { differingCount: d2.length, differing: d2.map(k => ({ file: k, base: [tb[k].exit, tb[k].okLines], mock: [t2[k].exit, t2[k].okLines] })) },
    flaky: { file: F, reads: ['js/core/virtual-user-helpers.js'], readsChangedByMock: false, rerunsBase: FB.trim().split(/\s+/).map(Number), rerunsMock: FM.trim().split(/\s+/).map(Number), note: '모의 이전이 바꾸지 않는 한 파일만 읽는 시험이다. #917(TASK-ES-645) 때도 같은 흔들림을 봤다(reports/TASK-ES-645/tests-all-flake.json).' },
    differingCount: d2.length },
  gcalLoginReconnectFix: { file: G, base: [tb[G].exit, tb[G].okLines], mockFirst: [t1[G].exit, t1[G].okLines], mockSecond: [t2[G].exit, t2[G].okLines], sameExit: tb[G].exit === t1[G].exit && tb[G].exit === t2[G].exit, note: '이 시험은 index.html 에서 `window.saveGoogleToken = saveGoogleToken;` 글자를 찾는다 — 그 노출 줄은 원래 자리에 남는다.' } };
out.ok = out.verify.ok === true && out.text.windowExposureLineStaysInIndexHtml && out.text.declarationInCell && out.text.argumentsLineUntouched && out.moduleGuard.exitCode === 0 && out.gcalLoginReconnectFix.sameExit && out.testsAll.secondRun.differingCount === 0;
fs.writeFileSync(path.join(WORK, 'reports', 'TASK-ES-657', 'mock-tests.json'), JSON.stringify(out, null, 1) + '\n', { encoding: 'utf8' });
console.log(JSON.stringify({ ok: out.ok, gen: out.generator, verify: out.verify, text: out.text, guard: out.moduleGuard.exitCode, first: out.testsAll.firstRun, second: out.testsAll.secondRun.differingCount, gcal: out.gcalLoginReconnectFix }).slice(0, 1500));
