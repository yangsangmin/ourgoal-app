'use strict';
// #TASK-ES-646 — 대조기(verify-inplace.cjs)가 가짜로 통과하지 않는지 보는 대조군(L084).
// 정리 후 index.html 을 일부러 한 군데씩 망가뜨린 사본을 저장소 밖 임시 폴더에 만들고, 대조기가 그것을 모두 잡는지 잰다. 망가뜨리지 않은 사본은 통과해야 한다.
// 작업자 PC 예비 점검 — 판정이 아니다. 사용: node control-group.cjs <정리 전 index.html> <정리 후 index.html> <out.json>
const fs = require('fs'), os = require('os'), path = require('path');
const { spawnSync } = require('child_process');
const [BEFORE, AFTER, OUT] = process.argv.slice(2);
const VERIFY = path.join(__dirname, 'verify-inplace.cjs');
const src = fs.readFileSync(AFTER, 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'es646-control-'));
const once = (s, a, b) => { const i = s.indexOf(a); if (i < 0) throw new Error('대조군이 고칠 글자를 못 찾음: ' + a); return s.slice(0, i) + b + s.slice(i + a.length); }; // 첫 번째 자리만 고친다
const swapLines = (s, a, b) => { const A = s.indexOf(a), B = s.indexOf(b); if (A < 0 || B < 0) throw new Error('대조군이 바꿀 줄을 못 찾음'); const M = '\u0000MARK\u0000'; return s.replace(a, M).replace(b, a).replace(M, b); };
const M = [
  ['M0 망가뜨리지 않음(통과해야 한다)', s => s, false],
  ['M1 접두 하나 빠짐(쓰기가 꾸러미를 안 거침)', s => once(s, 'ctx.rows = newRows;', 'rows = newRows;'), true],
  ['M2 속성 이름에 접두가 붙음', s => once(s, 'prev.rows.map(', 'prev.ctx.rows.map('), true],
  ['M3 저장 뒤 화면 갱신 두 문의 순서가 바뀜', s => swapLines(s, 'renderRecordsScreen();\r\n        renderGoalsScreen();'.replace(/\r\n/g, s.includes('\r\n') ? '\r\n' : '\n'), 'renderCalendarScreen();'), true],
  ['M4 문구 한 글자 바뀜', s => once(s, '>일반저장</button>', '>일반 저장</button>'), true],
  ['M5 등록 줄이 빠짐(다른 조각이 부르면 undefined)', s => once(s, 'ctx.stopSwTimer = stopSwTimer;', ''), true],
  ['M6 조각 부르는 순서가 바뀜', s => swapLines(s, 'bindProRecTrendChart(ctx);', 'bindProRecStopwatch(ctx);'), true],
  ['M7 조각 안에 지역 사본을 만들어 읽음(값이 갈라지는 가장 흔한 사고)', s => once(s, 'var validRows = ctx.rows.filter(', 'var rows = ctx.rows; var validRows = rows.filter('), true],
  ['M8 주석 글자 바뀜', s => once(s, '// 저장 공통 함수', '// 저장 함수'), true],
  ['M9 조건이 바뀜', s => once(s, 'if(ctx.rows.length > 1){', 'if(ctx.rows.length >= 1){'), true],
  ['M10 이 함수 밖 글자가 바뀜', s => once(s, 'window.addEventListener(\'hashchange\', checkRecordDeepLink);', 'window.addEventListener(\'hashchange\',  checkRecordDeepLink);'), true],
  ['M11 주인 조각 안 호출에 필요 없는 접두가 붙음', s => once(s, 'bindRowEvents();\r\n        updateAnalyticsBanner();'.replace(/\r\n/g, s.includes('\r\n') ? '\r\n' : '\n'), 'ctx.bindRowEvents();' + (s.includes('\r\n') ? '\r\n' : '\n') + '        updateAnalyticsBanner();'), true],
  ['M12 타이머 간격 숫자가 바뀜', s => once(s, '}, 60);', '}, 61);'), true],
  ['M13 저장 경로에서 문 하나가 빠짐', s => once(s, 'saveLocalSettings(state.profile.id, state.profile.settings);', ''), true],
  ['M14 조각 밖에 새 최상위 함수가 생김', s => once(s, '  function bindProRecTable(ctx){', '  function strayHelper(){ return 1; }\n  function bindProRecTable(ctx){'), true],
];
const rows = [];
for (const [name, mutate, mustFail] of M) {
  let text; try { text = mutate(src); } catch (e) { rows.push({ mutation: name, error: String(e.message) }); continue; }
  const f = path.join(dir, 'index.' + rows.length + '.html'); fs.writeFileSync(f, text, 'utf8');
  const o = path.join(dir, 'verify.' + rows.length + '.json');
  const r = spawnSync(process.execPath, [VERIFY, BEFORE, f, o], { encoding: 'utf8' });
  let kinds = [], crashed = null;
  try { kinds = JSON.parse(fs.readFileSync(o, 'utf8')).problems.map(p => p.kind); } catch (_) { crashed = (r.stderr || '').split('\n').find(l => /Error/.test(l)) || '결과 파일 없음'; }
  const failed = r.status !== 0;
  rows.push({ mutation: name, changed: text !== src, verifierExit: r.status, caught: failed, expectedCaught: mustFail, asExpected: failed === mustFail && (mustFail ? text !== src : true), problemKinds: [...new Set(kinds)], crashed });
}
fs.rmSync(dir, { recursive: true, force: true });
const out = { tool: 'reports/TASK-ES-646/tools/control-group.cjs', type: '작업자 PC 예비 점검 — 판정 아님', mutations: rows.length, mustBeCaught: rows.filter(r => r.expectedCaught).length, caught: rows.filter(r => r.expectedCaught && r.caught).length, missed: rows.filter(r => r.expectedCaught && !r.caught).map(r => r.mutation), cleanPasses: rows.filter(r => r.expectedCaught === false).every(r => r.caught === false), allAsExpected: rows.every(r => r.asExpected === true), rows };
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', { encoding: 'utf8' });
for (const r of rows) console.log((r.asExpected ? 'ok  ' : 'BAD ') + r.mutation + ' → ' + (r.error || (r.caught ? '잡음 [' + (r.crashed ? '파싱·실행 중단: ' + r.crashed : r.problemKinds.join(' · ')) + ']' : '통과')));
console.log(JSON.stringify({ mutations: out.mutations, mustBeCaught: out.mustBeCaught, caught: out.caught, missed: out.missed, cleanPasses: out.cleanPasses, allAsExpected: out.allAsExpected }));
process.exit(out.allAsExpected ? 0 : 1);
