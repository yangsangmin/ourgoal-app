'use strict';
// #TASK-ES-389 아바타 로직 세포 5개의 신고서 손 칸(kind·spans·planned)을 설계 REQ-TASK-ES-384 3-1절 표대로 적는다.
// 순서: gen-avatar-logic.js → node scripts/module-specs.js --write(새 세포가 unclassified 로 올라옴) → 이 스크립트 → module-specs.js --write(코드 칸 다시 씀, 손 칸 보존).
// 자리 연결(contributes)은 이번에 하지 않는다 — planned 에만 적는다(설계 5절 7 「자리 연결 별도 PR」).
// 사용: node spec-avatar-logic.js <APP_DIR>
const fs = require('fs');
const path = require('path');
const APP = process.argv[2];
const P = path.join(APP, 'docs', 'architecture', 'modules.json');
const doc = JSON.parse(fs.readFileSync(P, 'utf8'));
const SPANS = ['home', 'settings', 'comm']; // avatar-system.js 와 같다
const PLAN = {
  'js/avatar/themes.js': { provides: ['avatar.themes'], contributes: [] },
  'js/avatar/render.js': { provides: ['avatar.render'], contributes: ['home.card', 'profile.badge'] },
  'js/avatar/craft-engine.js': { provides: ['avatar.craft'], contributes: [] },
  'js/avatar/wallet.js': { provides: ['avatar.wallet'], contributes: [] },
  'js/avatar/dynamic-album.js': { provides: ['avatar.album'], contributes: ['settings.section'] },
};
let n = 0;
for (const c of doc.cells) {
  if (!PLAN[c.file]) continue;
  c.kind = 'hybrid';
  c.spans = SPANS.slice();
  c.planned = { provides: PLAN[c.file].provides.slice(), contributes: PLAN[c.file].contributes.slice() };
  n++;
}
// avatar-system.js 에 남는 계획: EXP 세포(PR-5) 능력 xp.award, 아바타 설정 모달 자리 settings.section(#btnSettingsQuickAvatar — PR-4 modal/index.js 로 갈 몫).
// home.card·profile.badge 는 그리기 세포(render)로 옮겨 적는다.
const sys = doc.cells.find(c => c.file === 'js/avatar-system.js');
sys.planned = { provides: ['xp.award'], contributes: ['settings.section'] };
if (n !== Object.keys(PLAN).length) throw new Error('신고서에 없는 부품 ' + (Object.keys(PLAN).length - n) + '개 — module-specs.js --write 를 먼저');
fs.writeFileSync(P, JSON.stringify(doc, null, 2) + '\n', 'utf8');
console.log('신고서 손 칸 적음', n + 1);
