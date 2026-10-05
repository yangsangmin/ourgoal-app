'use strict';
// #TASK-ES-402 팀 세포 쪼개기 3차 — 새 세포 3개의 신고서 손 칸(kind·role·spans)을 적는다(손으로 modules.json 을 고치지 않는다).
// 순서: gen-team-split-3.js → node scripts/module-specs.js --write(새 세포가 unclassified 로 올라옴) → 이 스크립트 → module-specs.js --write(코드 칸 다시 씀, 손 칸 보존).
// spans 는 떼어 낸 원본 세포의 spans 를 그대로 읽어 적는다(손으로 옮겨 적지 않음). 능력·자리·데이터 주인 칸은 원본과 같이 비워 둔다(옮기기만 — 새 능력 0).
// 사용: node spec-team-split-3.js <APP_DIR>
const fs = require('fs');
const path = require('path');
const APP = path.resolve(process.argv[2] || '.');
const P = path.join(APP, 'docs', 'architecture', 'modules.json');
const doc = JSON.parse(fs.readFileSync(P, 'utf8'));
const CELLS = [
  ['js/team-level-group-modal.js', 'js/team-visibility-levels.js', '수준별 조 상세 모달 — openLevelGroupDetailModal(팀 통합/목표별 수준 그룹의 목표·마일스톤·할 일 편집 바텀시트). team-visibility-levels.js 에서 분열(#TASK-ES-402)'],
  ['js/team-member-review.js', 'js/team-leader-check.js', '팀장의 팀원 점검 모달 — openLeaderStampSelectModal(확인 도장 선택)·openMemberProgressDetailModal(팀원 달성도 상세 점검). team-leader-check.js 에서 분열(#TASK-ES-402)'],
  ['js/team-linked-goals-screen.js', 'js/team-linked-goals.js', "'팀 연계 개인목표' 워크스페이스 화면 — renderTeamLinkedGoalsScreen. team-linked-goals.js 에서 분열(#TASK-ES-402)"],
];
for (const [file, from, role] of CELLS) {
  const c = doc.cells.find(x => x.file === file);
  const src = doc.cells.find(x => x.file === from);
  if (!c) throw new Error('신고서에 ' + file + ' 없음 — module-specs.js --write 를 먼저');
  if (!src) throw new Error('신고서에 원본 ' + from + ' 없음');
  c.kind = src.kind;
  c.role = role;
  c.spans = src.spans.slice();
  console.log(file + ': kind=' + c.kind + ' spans=' + c.spans.join(','));
}
fs.writeFileSync(P, JSON.stringify(doc, null, 2) + '\n', 'utf8');
