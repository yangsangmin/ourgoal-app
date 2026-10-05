'use strict';
// #TASK-ES-425 전문가 목표 템플릿 레지스트리 세포 분열 — 새 자료 세포 6개의 신고서 손 칸(kind·role·spans)을 적는다(손으로 modules.json 을 고치지 않는다).
// 순서: gen-expert-templates.js → node scripts/module-specs.js --write(새 세포가 unclassified 로 올라옴) → 이 스크립트 → module-specs.js --write(코드 칸 다시 씀, 손 칸 보존).
// kind·spans 는 떼어 낸 원본 세포(js/goal-templates-registry.js)의 값을 그대로 읽어 적는다. 능력·자리·데이터 주인 칸은 비워 둔다(옮기기만 — 새 능력 0).
// 사용: node spec-expert-templates.js <APP_DIR>
const fs = require('fs');
const path = require('path');
const APP = path.resolve(process.argv[2] || '.');
const P = path.join(APP, 'docs', 'architecture', 'modules.json');
const doc = JSON.parse(fs.readFileSync(P, 'utf8'));
const FROM = 'js/goal-templates-registry.js';
const PARTS = [['health', '운동·건강', 'HLT'], ['study', '학습·자격', 'STD'], ['career', '커리어·머니', 'CAR'], ['hobby', '취미·창작', 'HOB'], ['mind', '마음·습관', 'MND'], ['relation', '관계·생활', 'REL']];
const src = doc.cells.find(x => x.file === FROM);
if (!src) throw new Error('신고서에 원본 ' + FROM + ' 없음');
for (const [file, label, prefix] of PARTS) {
  const rel = 'js/data/expert-templates/' + file + '.js';
  const c = doc.cells.find(x => x.file === rel);
  if (!c) throw new Error('신고서에 ' + rel + ' 없음 — module-specs.js --write 를 먼저');
  c.kind = src.kind;
  c.role = '전문가 목표 템플릿 레지스트리 자료 — ' + label + ' 10종(TPL-' + prefix + ') MATCH_RULES·TEMPLATE_MAP 조각. goal-templates-registry.js 에서 분열(#TASK-ES-425), 서버 require 전용';
  c.spans = src.spans.slice();
  console.log(rel + ': kind=' + c.kind + ' spans=' + c.spans.join(','));
}
fs.writeFileSync(P, JSON.stringify(doc, null, 2) + '\n', 'utf8');
