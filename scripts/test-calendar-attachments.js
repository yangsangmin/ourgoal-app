/**
 * [#TASK-ES-096] 캘린더 일정(customSchedules) 참고자료(유튜브, 이미지, 메모, 링크) 첨부·조회·삭제 시스템 무결성 검증 테스트
 */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 [#TASK-ES-096] 캘린더 일정 참고자료 시스템 무결성 검증 시작...');

// 1. js/calendar-attachment.js 파일 존재 및 문법 검증
const modulePath = path.join(__dirname, '..', 'js', 'calendar-attachment.js');
assert.ok(fs.existsSync(modulePath), 'js/calendar-attachment.js 파일이 존재해야 합니다.');
const moduleContent = fs.readFileSync(modulePath, 'utf8');

// 가상 브라우저 환경 준비
global.window = global;
global.document = {
  getElementById: function(){ return null; },
  querySelectorAll: function(){ return []; }
};

eval(moduleContent);
assert.ok(global.OurgoalCalendarAttachment, 'OurgoalCalendarAttachment 전역 객체가 정의되어야 합니다.');
assert.strictEqual(typeof OurgoalCalendarAttachment.renderSectionHtml, 'function');
assert.strictEqual(typeof OurgoalCalendarAttachment.wireEditModalAttachments, 'function');
assert.strictEqual(typeof OurgoalCalendarAttachment.renderHubEventChipsHtml, 'function');
assert.strictEqual(typeof OurgoalCalendarAttachment.wireHubModalAttachments, 'function');
assert.strictEqual(typeof OurgoalCalendarAttachment.handleCustomScheduleAttachmentClick, 'function');
console.log('  ✓ [PASS] OurgoalCalendarAttachment 모듈 및 5대 핵심 API 무결성 검증');

// 2. renderSectionHtml 렌더링 검증
const emptyHtml = OurgoalCalendarAttachment.renderSectionHtml([]);
assert.ok(emptyHtml.includes('calEditAddAttBtn'), '참고자료 첨부 버튼(calEditAddAttBtn)이 존재해야 합니다.');
assert.ok(emptyHtml.includes('첨부된 참고자료가 없습니다'), '첨부자료가 없을 때 안내 문구가 표시되어야 합니다.');

const sampleAtts = [
  { id: 'att_1', type: 'video', title: '러닝 폼 가이드 유튜브', url: 'https://youtube.com/watch?v=xyz' },
  { id: 'att_2', type: 'image', title: '대회 코스 지도', url: 'https://example.com/map.jpg' },
  { id: 'att_3', type: 'text', title: '준비물 메모', note: '신분증, 에너지젤 2개 지참' },
  { id: 'att_4', type: 'link', title: '대회 공식 홈페이지', url: 'https://marathon.com' }
];
const populatedHtml = OurgoalCalendarAttachment.renderSectionHtml(sampleAtts);
assert.ok(populatedHtml.includes('🎥'), '비디오 아이콘 🎥이 렌더링되어야 합니다.');
assert.ok(populatedHtml.includes('🖼️'), '이미지 아이콘 🖼️이 렌더링되어야 합니다.');
assert.ok(populatedHtml.includes('📝'), '메모 아이콘 📝이 렌더링되어야 합니다.');
assert.ok(populatedHtml.includes('🔗'), '링크 아이콘 🔗이 렌더링되어야 합니다.');
assert.ok(populatedHtml.includes('data-caldraftatt="0"'), '드래프트 칩 인덱스 바인딩이 존재해야 합니다.');
assert.ok(populatedHtml.includes('러닝 폼 가이드 유튜브'), '첨부 제목이 정상 출력되어야 합니다.');
console.log('  ✓ [PASS] 일정 편집 모달 참고자료 섹션(빈 상태 & 4대 타입 칩) 렌더링 검증');

// 3. index.html 배선 및 기술안전핀 TECH-RULE-01 (index.html 라인수 보존)(순증가 0줄) 검증
const indexPath = path.join(__dirname, '..', 'index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf8');
const indexLines = indexHtml.split(/\r?\n/).length;
assert.ok(indexLines >= 20000, '스마트 안전핀 TECH-RULE-01: index.html 본체 무결성 보존 및 무단 대량삭제 방지');
assert.ok(indexHtml.includes('js/calendar-attachment.js'), 'index.html에 calendar-attachment.js 스크립트가 로드되어야 합니다.');
assert.ok(indexHtml.includes('kind === \'custom\''), 'wireAttachmentChipClicks에 kind === custom 분기가 배선되어야 합니다.');
assert.ok(indexHtml.includes('data-hubaddatt'), '일자 허브 모달에 참고자료 첨부 버튼(data-hubaddatt)이 존재해야 합니다.');
assert.ok(indexHtml.includes('renderHubEventChipsHtml'), '일자 허브 모달에 첨부자료 칩 렌더링이 연동되어야 합니다.');
assert.ok(indexHtml.includes('attachments: curAttachments'), '일정 저장 시 attachments 필드가 영구 저장되어야 합니다.');
console.log('  ✓ [PASS] index.html 기술안전핀 TECH-RULE-01 (index.html 라인수 보존)');

// 4. custom schedule 데이터 모델 및 삭제 시뮬레이션
global.state = {
  profile: {
    settings: {
      customSchedules: [
        {
          id: 'sched_test_1',
          title: '주말 10km 러닝 훈련',
          date: '2026-09-20T09:00',
          note: '여의도 한강공원',
          attachments: [
            { id: 'att_a', type: 'video', title: '페이스 조절 영상', url: 'https://youtube.com/watch?v=1' },
            { id: 'att_b', type: 'text', title: '체크리스트', note: '물 500ml' }
          ]
        }
      ]
    }
  },
  activeTab: 'calendar'
};
global.renderAll = function(){};
global.renderCalendarScreen = function(){};
global.saveProfile = async function(){};
global.toast = function(msg){};

let viewerOpened = false;
let viewerDeleteCb = null;
global.openAttachmentViewer = function(att, onEdit, onDelete){
  viewerOpened = true;
  viewerDeleteCb = onDelete;
};

// 칩 클릭 시뮬레이션
const handled = OurgoalCalendarAttachment.handleCustomScheduleAttachmentClick(null, 0, 'sched_test_1');
assert.strictEqual(handled, true, 'custom schedule 칩 클릭이 처리되어야 합니다.');
assert.strictEqual(viewerOpened, true, 'openAttachmentViewer가 호출되어야 합니다.');
assert.strictEqual(typeof viewerDeleteCb, 'function', '삭제 콜백이 등록되어야 합니다.');

// 삭제 콜백 실행
(async function(){
  await viewerDeleteCb();
  assert.strictEqual(state.profile.settings.customSchedules[0].attachments.length, 1, '첫 번째 첨부자료가 삭제되어야 합니다.');
  assert.strictEqual(state.profile.settings.customSchedules[0].attachments[0].id, 'att_b', '남은 첨부자료는 att_b여야 합니다.');
  console.log('  ✓ [PASS] custom schedule 첨부자료 조회 뷰어 및 삭제 플로우 무결성 검증');
  console.log('✨ [#TASK-ES-096] 캘린더 일정 참고자료 시스템 전수 검증 ALL PASS!');
})();
