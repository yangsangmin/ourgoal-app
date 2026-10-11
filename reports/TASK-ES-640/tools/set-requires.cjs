'use strict';
// 신고서 손 칸: records/sample-purge 의 requires 에 ui.confirm 을 적는다(옮긴 코드가 OurgoalCapabilities.call('ui.confirm', …) 을 부른다).
// module-specs --write 는 손 칸을 보존한다. 생성기를 다시 돌려 신고서를 main 판에서 다시 만들 때 이 스크립트를 다시 돌린다.
// 사용: node set-requires.cjs <작업 트리>
const fs = require('fs'), path = require('path');
const f = path.join(process.argv[2], 'docs', 'architecture', 'modules.json');
const raw = fs.readFileSync(f, 'utf8');
const eol = raw.includes('\r\n') ? '\r\n' : '\n';
const lines = raw.split(/\r?\n/);
const i = lines.findIndex(l => l.includes('"id": "records/sample-purge"'));
if (i < 0) throw new Error('세포 없음: records/sample-purge');
let j = i;
while (j < i + 14 && !/"requires": \[/.test(lines[j])) j++;
if (!/"requires": \[\]/.test(lines[j])) { console.log('이미 채워져 있거나 꼴이 다르다: ' + lines[j].trim()); process.exit(0); }
const ind = lines[j].match(/^\s*/)[0];
lines.splice(j, 1, ind + '"requires": [', ind + '  "ui.confirm"', ind + '],');
fs.writeFileSync(f, lines.join(eol), 'utf8');
console.log('requires 채움: 줄 ' + (j + 1));
