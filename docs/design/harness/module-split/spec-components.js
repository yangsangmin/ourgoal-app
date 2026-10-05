'use strict';
// #TASK-ES-411 공통 UI 컴포넌트 세포 쪼개기 — 새 세포 11개의 신고서 손 칸(kind·role·spans)을 적는다(손으로 modules.json 을 고치지 않는다).
// 순서: gen-components.js → node scripts/module-specs.js --write(새 세포가 unclassified 로 올라옴) → 이 스크립트 → module-specs.js --write(코드 칸 다시 씀, 손 칸 보존).
// kind·spans 는 떼어 낸 원본 세포(js/components.js)의 값을 그대로 읽어 적는다(손으로 옮겨 적지 않음). role 은 components-cells.js 의 묶음 설명.
// 능력·자리·데이터 주인 칸은 비워 둔다(옮기기만 — 새 능력 0).
// 사용: node spec-components.js <APP_DIR>
const fs = require('fs');
const path = require('path');
const APP = path.resolve(process.argv[2] || '.');
const P = path.join(APP, 'docs', 'architecture', 'modules.json');
const doc = JSON.parse(fs.readFileSync(P, 'utf8'));
const FROM = 'js/components.js';
const CELLS = require('./components-cells.js');
const src = doc.cells.find(x => x.file === FROM);
if (!src) throw new Error('신고서에 원본 ' + FROM + ' 없음');
for (const C of CELLS) {
  const c = doc.cells.find(x => x.file === C.cell);
  if (!c) throw new Error('신고서에 ' + C.cell + ' 없음 — module-specs.js --write 를 먼저');
  c.kind = src.kind;
  c.role = C.role + '. components.js 에서 분열(#TASK-ES-411)';
  c.spans = src.spans.slice();
  console.log(C.cell + ': kind=' + c.kind + ' spans=' + c.spans.join(','));
}
fs.writeFileSync(P, JSON.stringify(doc, null, 2) + '\n', 'utf8');
