'use strict';
// #TASK-ES-407 시간기록 세포 쪼개기 — 새 세포 3개의 신고서 손 칸(kind·role·spans)을 적는다(손으로 modules.json 을 고치지 않는다).
// 순서: gen-time-tracker.js → node scripts/module-specs.js --write(새 세포가 unclassified 로 올라옴) → 이 스크립트 → module-specs.js --write(코드 칸 다시 씀, 손 칸 보존).
// spans·kind 는 떼어 낸 원본 세포(js/time-tracker.js)의 값을 그대로 읽어 적는다(손으로 옮겨 적지 않음). 능력·자리·데이터 주인 칸은 비워 둔다(옮기기만 — 새 능력 0).
// 사용: node spec-time-tracker.js <APP_DIR>
const fs = require('fs');
const path = require('path');
const APP = path.resolve(process.argv[2] || '.');
const P = path.join(APP, 'docs', 'architecture', 'modules.json');
const doc = JSON.parse(fs.readFileSync(P, 'utf8'));
const FROM = 'js/time-tracker.js';
const CELLS = [
  ['js/time-tracker-screen.js', '시간기록 몰입 화면 만들기·버튼 배선 — initDOM(전체화면 덮개 #timeTrackerOverlay DOM 1회 생성)·bindEvents(모드 탭·프리셋·조절기·회전·닫기·취소·저장·ESC·회전 감지). time-tracker.js 에서 분열(#TASK-ES-407)'],
  ['js/time-tracker-lap-memo.js', '시간기록 구간 메모 패널 — openLapMemoModal(측정 중 구간을 누르면 여는 인라인 메모, 퀵 태그·취소·저장). time-tracker.js 에서 분열(#TASK-ES-407)'],
  ['js/time-tracker-review.js', '시간기록 기록 작성·내 기록 저장 — openReviewView(활동명·구간별 내용 작성 화면)·handleSaveRecord(state.profile.records 저장). time-tracker.js 에서 분열(#TASK-ES-407)'],
];
const src = doc.cells.find(x => x.file === FROM);
if (!src) throw new Error('신고서에 원본 ' + FROM + ' 없음');
for (const [file, role] of CELLS) {
  const c = doc.cells.find(x => x.file === file);
  if (!c) throw new Error('신고서에 ' + file + ' 없음 — module-specs.js --write 를 먼저');
  c.kind = src.kind;
  c.role = role;
  c.spans = src.spans.slice();
  console.log(file + ': kind=' + c.kind + ' spans=' + c.spans.join(','));
}
fs.writeFileSync(P, JSON.stringify(doc, null, 2) + '\n', 'utf8');
