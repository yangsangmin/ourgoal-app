/**
 * tests/feed-post-photo-upload.test.js
 * #TASK-ES-309 [58] 소통 피드 게시하기 내 사진(이미지) 첨부 기능 추가 검증
 */

'use strict';
const fs = require('fs');
const path = require('path');
const { readComponentsBundle } = require('./helpers/components-bundle.js'); // #TASK-ES-412 컴포넌트 합본(원문 + 키트 부품)
const assert = require('assert');

console.log('[TEST START] feed-post-photo-upload (#TASK-ES-309)');

const htmlPath = path.join(__dirname, '..', 'index.html');
const cssPath = path.join(__dirname, '..', 'ui.css');
const jsCompPath = path.join(__dirname, '..', 'js', 'components.js');

const html = fs.readFileSync(htmlPath, 'utf8');
const css = fs.readFileSync(cssPath, 'utf8');
const jsComp = readComponentsBundle();

// 1. index.html 사진 첨부 드롭존 & 프리뷰 마크업 및 게시물 연동 검증
assert.ok(html.includes('share-photo-uploader-box'), 'index.html: .share-photo-uploader-box 컨테이너 확인');
assert.ok(html.includes('sharePhotoDropzone'), 'index.html: #sharePhotoDropzone 드롭존 확인');
assert.ok(html.includes('share-photo-dropzone'), 'index.html: .share-photo-dropzone 클래스 확인');
assert.ok(html.includes('shareDirectPhotoInput'), 'index.html: #shareDirectPhotoInput 파일 인풋 확인');
assert.ok(html.includes('shareDirectPhotoPreviewWrap'), 'index.html: #shareDirectPhotoPreviewWrap 프리뷰 래퍼 확인');
assert.ok(html.includes('share-photo-preview-card'), 'index.html: .share-photo-preview-card 클래스 확인');
assert.ok(html.includes('shareDirectPhotoPreviewImg'), 'index.html: #shareDirectPhotoPreviewImg 프리뷰 이미지 확인');
assert.ok(html.includes('btnShareRemovePhoto'), 'index.html: #btnShareRemovePhoto 사진 삭제 버튼 확인');
assert.ok(html.includes('share-photo-remove-btn'), 'index.html: .share-photo-remove-btn 클래스 확인');
assert.ok(html.includes('btnShareChangePhoto'), 'index.html: #btnShareChangePhoto 사진 변경 버튼 확인');
assert.ok(html.includes('photo: finalPhoto,'), 'index.html: 게시물 최상위 photo 필드 할당 확인');
console.log('1. index.html 사진 첨부 드롭존 및 게시물 연동 검증 통과');

// 2. ui.css 스타일 및 모바일 반응형 검증
assert.ok(css.includes('.share-photo-uploader-box'), 'CSS: .share-photo-uploader-box 스타일 정의 확인');
assert.ok(css.includes('.share-photo-dropzone'), 'CSS: .share-photo-dropzone 스타일 정의 확인');
assert.ok(css.includes('.share-photo-preview-card'), 'CSS: .share-photo-preview-card 스타일 정의 확인');
assert.ok(css.includes('.share-photo-remove-btn'), 'CSS: .share-photo-remove-btn 스타일 정의 확인');
assert.ok(css.includes('max-width: 375px'), 'CSS: 375px 모바일 반응형 미디어 쿼리 확인');
console.log('2. ui.css 사진 첨부 UI 스타일 및 375px 반응형 검증 통과');

// 3. js/components.js 직통 액션 핸들러 및 트랜잭션 검증
assert.ok(jsComp.includes('handle소통_Item58Action'), 'components.js: handle소통_Item58Action 정의 확인');
assert.ok(jsComp.includes('og_task-58_cache'), 'components.js: og_task-58_cache 로컬스토리지 저장 확인');
assert.ok(jsComp.includes('photo_upload'), 'components.js: photo_upload 필드 확인');
assert.ok(jsComp.includes('photo_attached'), 'components.js: photo_attached 플래그 확인');

const componentsModule = require(jsCompPath);
assert.ok(typeof componentsModule.handle소통_Item58Action === 'function', 'components.js: handle소통_Item58Action export 확인');
console.log('3. components.js 직통 액션 핸들러 및 export 검증 통과');

// 4. handle소통_Item58Action 단위 실행 및 4대 뷰 전파 검증
async function testActionHandler() {
  const mockStorage = {};
  const mockViews = {
    calendar: false,
    goals: false,
    home: false,
    records: false
  };

  const winMock = {
    state: {
      shareDraft: {
        photo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        caption: '오늘의 멋진 실천 사진 인증!',
        category: 'workout'
      }
    },
    localStorage: {
      setItem: function(key, val) { mockStorage[key] = val; },
      getItem: function(key) { return mockStorage[key]; }
    },
    renderCalendar: function() { mockViews.calendar = true; },
    renderGoalsScreen: function() { mockViews.goals = true; },
    renderHome: function() { mockViews.home = true; },
    renderRecordsScreen: function() { mockViews.records = true; },
    toast: function(msg) { assert.ok(msg.includes('사진 첨부'), '토스트 메시지 검증'); }
  };

  global.window = winMock;
  global.state = winMock.state;
  global.localStorage = winMock.localStorage;
  global.renderCalendar = winMock.renderCalendar;
  global.renderGoalsScreen = winMock.renderGoalsScreen;
  global.renderHome = winMock.renderHome;
  global.renderRecordsScreen = winMock.renderRecordsScreen;
  global.toast = winMock.toast;

  const result = await componentsModule.handle소통_Item58Action(null, null);
  assert.strictEqual(result.ticket, '58', '티켓 58 반환 확인');
  assert.strictEqual(result.state, 'completed', '상태 completed 확인');
  assert.strictEqual(result.photo_attached, true, '사진 첨부 플래그 확인');
  assert.ok(result.photo_upload.photo.includes('data:image/png;base64,'), '사진 데이터 확인');
  assert.strictEqual(result.photo_upload.category, 'workout', '카테고리 확인');

  assert.ok(mockStorage['og_task-58_cache'], '로컬스토리지 og_task-58_cache 기록 확인');
  assert.strictEqual(mockViews.calendar, true, '헌법 제15조 제6항 4대 뷰: calendar 전파 확인');
  assert.strictEqual(mockViews.goals, true, '헌법 제15조 제6항 4대 뷰: goals 전파 확인');
  assert.strictEqual(mockViews.home, true, '헌법 제15조 제6항 4대 뷰: home 전파 확인');
  assert.strictEqual(mockViews.records, true, '헌법 제15조 제6항 4대 뷰: records 전파 확인');
  console.log('4. handle소통_Item58Action 단위 실행 및 4대 뷰 전파 검증 통과');
}

testActionHandler().then(function() {
  console.log('[TEST COMPLETED] feed-post-photo-upload test completed successfully.');
}).catch(function(err) {
  console.error('[TEST ERROR]', err);
  throw err;
});
