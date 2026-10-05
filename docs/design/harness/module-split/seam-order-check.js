'use strict';
// #TASK-ES-548 이음매 순서 점검(작업자 보조, 판정 아님) — verify-inline-hard.js 가 잡지 못하는 부팅 함정 두 가지(작업참고 L046·L047)를 index.html 에서 잰다.
//  ① L046: 머리의 가져오기 줄 `var X = _키트.X;` 마다, 그 키트 변수 선언 `var _키트 = window.…;` 이 그 줄보다 앞에 있는가(뒤에 있으면 부팅 때 TypeError).
//  ② L047: 옮긴 코드가 L.<이름> 에 대입하는 이름(verify 결과 assignedL)마다, index.html 의 마지막 `get 이름()` 노출 줄에 `set 이름(v)` 가 함께 있는가
//          (뒤쪽 expose 의 getter 전용 노출이 앞의 setter 를 덮으면 부팅 때 「only a getter」).
// 사용: node seam-order-check.js <index.html> <verify-inline-hard.json> <out.json>
const fs = require('fs');
const [HTML, VERIFY, OUT] = process.argv.slice(2);
const lines = fs.readFileSync(HTML, 'utf8').replace(/\r\n/g, '\n').split('\n');
const v = JSON.parse(fs.readFileSync(VERIFY, 'utf8'));
const kitDecl = {};
lines.forEach((l, i) => { const m = l.match(/^  var (_\w+Kit) = window\.\w+;$/); if (m && kitDecl[m[1]] == null) kitDecl[m[1]] = i + 1; });
const importOrder = [];
lines.forEach((l, i) => { const m = l.match(/^  var (\w+) = (_\w+Kit)\.(\w+);$/); if (m) { const d = kitDecl[m[2]]; if (d == null || d > i + 1) importOrder.push({ line: i + 1, name: m[1], kitVar: m[2], kitDeclLine: d == null ? null : d }); } });
const setterGaps = [];
for (const n of v.assignedL || []) {
  let last = -1;
  lines.forEach((l, i) => { if (new RegExp('\\bget ' + n + '\\(\\)').test(l)) last = i; });
  if (last < 0 || !new RegExp('\\bset ' + n + '\\(v\\)').test(lines[last])) setterGaps.push({ name: n, lastGetterLine: last < 0 ? null : last + 1 });
}
const out = { tool: 'docs/design/harness/module-split/seam-order-check.js', importsBeforeKitDecl: importOrder, assignedL: v.assignedL || [], setterGaps, ok: importOrder.length === 0 && setterGaps.length === 0 };
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', 'utf8');
console.log(JSON.stringify({ importsBeforeKitDecl: importOrder.length, setterGaps: setterGaps.map(x => x.name), ok: out.ok }));
process.exitCode = out.ok ? 0 : 1;
