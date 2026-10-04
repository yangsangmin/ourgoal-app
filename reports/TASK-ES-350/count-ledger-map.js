// [#TASK-ES-350] 설계서 1절 지도표(| M01 ~ |)의 "서버 왕복"·"중복 저장" 열을 세어 1-1절 집계를 낸다.
// 사용: node reports/TASK-ES-350/count-ledger-map.js [설계서 경로]
'use strict';
const fs = require('fs');
const path = require('path');
const file = process.argv[2] || path.join(__dirname, '..', '..', 'docs', 'specs', 'LEDGER-DESIGN-2026-10-04.md');
const src = fs.readFileSync(file, 'utf8');
const start = src.indexOf('## 1. 현재 지도');
const end = src.indexOf('### 1-1.');
const rows = src.slice(start, end).split('\n').filter(l => /^\| M\d{2} \|/.test(l));
const out = { items: rows.length, duplicate: 0, localOnly: 0, writeOnly: 0, partial: 0, server: 0, ids: { duplicate: [], localOnly: [] } };
for (const r of rows) {
  const cells = r.split(/(?<!\\)\|/).slice(1, -1).map(s => s.trim());
  const id = cells[0], rt = cells[5], dup = cells[6];
  if (dup === '예') { out.duplicate++; out.ids.duplicate.push(id); }
  if (rt === '없음') { out.localOnly++; out.ids.localOnly.push(id); }
  else if (rt === '쓰기만') out.writeOnly++;
  else if (rt === '일부') out.partial++;
  else if (rt === '있음') out.server++;
  else throw new Error(id + ' 서버 왕복 값 이상: ' + rt);
  if (dup !== '예' && dup !== '아니오') throw new Error(id + ' 중복 값 이상: ' + dup);
}
console.log(JSON.stringify(out, null, 2));
