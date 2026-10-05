'use strict';
// #TASK-ES-395 EXP 세포(js/avatar/xp.js)의 신고서 손 칸(kind·spans·provides·capabilities·owns·planned)을 설계 REQ-TASK-ES-384 3-1·3-2절대로 적는다.
// 순서: gen-avatar-xp.js → node scripts/module-specs.js --write(새 세포가 unclassified 로 올라옴) → 이 스크립트 → module-specs.js --write(코드 칸 다시 씀, 손 칸 보존).
// 능력 설명은 xp.js 의 caps.provide meta 를 그대로 읽어 적는다(손으로 옮겨 적지 않음). 자리 checkin.after 는 planned 에만(자리 실제 연결은 별도 PR — 설계 5절 7).
// avatar-system.js 의 planned.provides 에 남아 있던 xp.award 는 이제 xp.js 가 실제로 주므로 그쪽 계획에서 뺀다(능력 주인은 하나).
// 사용: node spec-avatar-xp.js <APP_DIR>
const fs = require('fs');
const path = require('path');
const APP = path.resolve(process.argv[2] || '.');
const P = path.join(APP, 'docs', 'architecture', 'modules.json');
const doc = JSON.parse(fs.readFileSync(P, 'utf8'));
const caps = require(path.join(APP, 'js', 'core', 'capabilities.js'));
require(path.join(APP, 'js', 'avatar', 'xp.js'));
const meta = caps.describe().filter(m => m.cell === 'avatar/xp');
if (meta.length !== 2) throw new Error('xp.js 능력 2개를 못 읽음: ' + meta.length);
const c = doc.cells.find(x => x.file === 'js/avatar/xp.js');
if (!c) throw new Error('신고서에 js/avatar/xp.js 없음 — module-specs.js --write 를 먼저');
c.kind = 'hybrid';
c.spans = ['home', 'goals', 'records', 'comm', 'settings']; // 지급 호출처(홈 체크인·퀘스트, 목표 탭, 기록, 팀 인증) + 읽는 곳(설정 레벨)
c.provides = meta.map(m => m.name).sort();
c.capabilities = meta.sort((a, b) => (a.name < b.name ? -1 : 1)).map(m => {
  const o = { name: m.name, description: m.description, sideEffect: m.sideEffect, needsConfirm: m.needsConfirm };
  if (m.input) o.input = m.input;
  if (m.output) o.output = m.output;
  return o;
});
c.owns = ['data.xp'];
c.planned = { provides: [], contributes: ['checkin.after'] };
const sys = doc.cells.find(x => x.file === 'js/avatar-system.js');
sys.planned.provides = sys.planned.provides.filter(n => n !== 'xp.award');
fs.writeFileSync(P, JSON.stringify(doc, null, 2) + '\n', 'utf8');
console.log('신고서 손 칸 적음: avatar/xp provides=' + c.provides.join(',') + ' · avatar-system planned.provides=' + JSON.stringify(sys.planned.provides));
