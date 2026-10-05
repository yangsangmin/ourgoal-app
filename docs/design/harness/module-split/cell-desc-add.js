'use strict';
// 세포지도 설명(docs/architecture/cell-descriptions.json)에 새 세포의 짧은 이름(names)·하는 일(cells)을 더한다(#TASK-ES-437~ 인라인 P0).
// 기존 칸은 건드리지 않는다. 두 칸이 이름순이면 이름순 자리에, 아니면 끝에 넣는다. 같은 id 가 이미 있으면 멈춘다.
// 사용: node cell-desc-add.js <APP_DIR> <추가.json>   — 추가.json = { "<세포 id>": ["짧은 이름", "하는 일 한 줄"], … }
const fs = require('fs'), path = require('path');
const [APP, ADD] = process.argv.slice(2);
const F = path.join(APP, 'docs', 'architecture', 'cell-descriptions.json');
const j = JSON.parse(fs.readFileSync(F, 'utf8'));
const add = JSON.parse(fs.readFileSync(ADD, 'utf8'));
const put = (obj, entries) => {
  const keys = Object.keys(obj);
  const sorted = keys.every((k, i) => i === 0 || keys[i - 1] <= k);
  for (const [k] of entries) if (Object.prototype.hasOwnProperty.call(obj, k)) throw new Error('이미 있음: ' + k);
  const all = [...Object.entries(obj), ...entries];
  if (sorted) all.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  return Object.fromEntries(all);
};
j.names = put(j.names, Object.entries(add).map(([k, v]) => [k, v[0]]));
j.cells = put(j.cells, Object.entries(add).map(([k, v]) => [k, v[1]]));
fs.writeFileSync(F, JSON.stringify(j, null, 2) + '\n', 'utf8');
console.log('added', Object.keys(add).length);
