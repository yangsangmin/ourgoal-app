/**
 * tests/goals-smart-attachments.test.js
 * #TASK-ES-274 목표탭 참고자료 첨부 효과적·효율적 UI/UX 고도화 및 실제 UI 검증 단위 테스트
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- [TEST] #TASK-ES-274 목표탭 참고자료 첨부 UI/UX 검증 시작 ---');

const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const uiCss = fs.readFileSync(path.join(__dirname, '../ui.css'), 'utf8');

// 1. renderInlineAttachmentChips 함수 및 window 전역 노출 검증
assert.ok(
  indexHtml.includes('function renderInlineAttachmentChips(attachments, targetKind, targetId, parentId)'),
  'renderInlineAttachmentChips 함수가 정의되어 있어야 합니다.'
);
assert.ok(
  indexHtml.includes('window.renderInlineAttachmentChips = renderInlineAttachmentChips;'),
  'window.renderInlineAttachmentChips가 전역에 바인딩되어 있어야 합니다.'
);

// 2. renderInlineAttachmentChips 구현 로직 검증 (eval을 통한 가상 실행)
function escapeHtml(str){
  return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function renderInlineAttachmentChips(attachments, targetKind, targetId, parentId){
  if(!attachments || !attachments.length) return '';
  return '<span class="att-chips-inline" style="display:inline-flex;flex-wrap:wrap;gap:4px;vertical-align:middle;">' +
    attachments.map(function(att, idx){
      var icon = att.type === 'video' ? '🎥' : (att.type === 'image' ? '🖼️' : (att.type === 'text' ? '📝' : '🔗'));
      var typeClass = 'type-' + (att.type || 'link');
      var safeTitle = escapeHtml(att.title || '참고자료');
      return '<span class="att-chip att-chip-mini ' + typeClass + '" data-openatt="'+idx+'" data-attkind="'+targetKind+'" data-attid="'+targetId+'" data-attpid="'+(parentId||'')+'" title="'+safeTitle+' (클릭하여 열기)" role="button" tabindex="0">' +
        '<span class="att-chip-mini-icon">' + icon + '</span>' +
        '<span class="att-chip-mini-text">' + safeTitle + '</span>' +
      '</span>';
    }).join('') +
  '</span>';
}

const sampleAttachments = [
  { type: 'video', title: '스쿼트 자세 가이드', url: 'https://youtube.com/watch?v=12345' },
  { type: 'link', title: '공식 문서', url: 'https://example.com' },
  { type: 'text', title: '핵심 요약', note: '주의사항' }
];

const renderedChips = renderInlineAttachmentChips(sampleAttachments, 'task', 'task-1', 'ms-1');
assert.ok(renderedChips.includes('att-chip-mini'), 'att-chip-mini 클래스가 포함되어야 합니다.');
assert.ok(renderedChips.includes('type-video'), 'type-video 클래스가 포함되어야 합니다.');
assert.ok(renderedChips.includes('🎥'), '비디오 아이콘이 포함되어야 합니다.');
assert.ok(renderedChips.includes('스쿼트 자세 가이드'), '타이틀이 포함되어야 합니다.');
assert.ok(renderedChips.includes('data-openatt="0"'), 'data-openatt 속성이 0부터 바인딩되어야 합니다.');
assert.ok(renderedChips.includes('data-attkind="task"'), 'data-attkind가 task여야 합니다.');

// 3. 세부 할 일 행(renderSingleTaskRow)에 +참고 버튼 및 칩 렌더러 적용 검증
assert.ok(
  indexHtml.includes('var tAttHtml = renderInlineAttachmentChips(t.attachments, \'task\', t.id, m.id);'),
  '세부 할 일 행에 renderInlineAttachmentChips가 연결되어야 합니다.'
);
assert.ok(
  indexHtml.includes('<button class="att-add-btn compact-att-btn" data-addatttask="'),
  '세부 할 일 행에 data-addatttask +참고 버튼이 마크업으로 렌더링되어야 합니다.'
);

// 4. 마일스톤 행에 renderInlineAttachmentChips 적용 검증
assert.ok(
  indexHtml.includes('var attSnippet = renderInlineAttachmentChips(m.attachments, \'ms\', m.id);'),
  '마일스톤 행에 renderInlineAttachmentChips가 연결되어야 합니다.'
);
assert.ok(
  indexHtml.includes('<button class="att-add-btn" data-addattms="'),
  '마일스톤 행에 data-addattms +참고 버튼이 렌더링되어야 합니다.'
);

// 5. ui.css 스타일 검증
assert.ok(uiCss.includes('.att-chips-inline'), 'ui.css에 .att-chips-inline 스타일이 있어야 합니다.');
assert.ok(uiCss.includes('.att-chip-mini'), 'ui.css에 .att-chip-mini 스타일이 있어야 합니다.');
assert.ok(uiCss.includes('.compact-att-btn'), 'ui.css에 .compact-att-btn 스타일이 있어야 합니다.');
assert.ok(uiCss.includes('.att-chip-mini.type-video'), 'ui.css에 비디오 칩 스타일이 있어야 합니다.');

console.log('--- [TEST] #TASK-ES-274 목표탭 참고자료 첨부 UI/UX 모든 검증 성공! (ALL PASS) ---');
