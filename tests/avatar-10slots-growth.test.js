// tests/avatar-10slots-growth.test.js
// TASK-ES-267: 아바타 10개 관리 및 레벨업 팝업/공유/저장/프롬프트 성향 설정 단위 검증

const fs = require('fs');
const path = require('path');
const assert = require('assert');

function runTest() {
  const avatarSystemPath = path.join(__dirname, '..', 'js', 'avatar-system.js');
  const indexHtmlPath = path.join(__dirname, '..', 'index.html');
  const uiCssPath = path.join(__dirname, '..', 'ui.css');

  assert.ok(fs.existsSync(avatarSystemPath), 'js/avatar-system.js 파일이 존재해야 합니다.');
  assert.ok(fs.existsSync(indexHtmlPath), 'index.html 파일이 존재해야 합니다.');
  assert.ok(fs.existsSync(uiCssPath), 'ui.css 파일이 존재해야 합니다.');

  const avatarSystemSrc = fs.readFileSync(avatarSystemPath, 'utf8');
  const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
  const uiCss = fs.readFileSync(uiCssPath, 'utf8');

  // 1. avatar-system 모듈 로드 및 10개 슬롯 렌더링 검증
  const OurgoalAvatar = require('../js/avatar-system.js');
  assert.ok(OurgoalAvatar, 'OurgoalAvatar 모듈 로드 성공');

  // 더미 프로필 및 2개 저장 아바타
  const mockProfile = {
    settings: {
      customAvatarUrl: 'data:image/png;base64,mockWearing',
      avatarGrowthPrompt: '더 강하게',
      savedAvatars: [
        { id: 'ava_1', url: 'data:image/png;base64,mockWearing', themeId: 1, themeName: '열정 러너', growthPrompt: '더 강하게' },
        { id: 'ava_2', url: 'data:image/png;base64,mockSaved2', themeId: 2, themeName: '덤벨 마스터', growthPrompt: '카리스마' }
      ]
    }
  };

  const deckHtml = avatarSystemSrc;
  assert.ok(deckHtml.includes('MAX_SLOTS = 10'), '10개 고정 슬롯 상수가 정의되어 있어야 합니다.');
  assert.ok(deckHtml.includes('empty-avatar-slot'), '비어있는 슬롯 클래스가 정의되어 있어야 합니다.');
  assert.ok(deckHtml.includes('avatar-10slots-carousel'), '10슬롯 캐러셀 컨테이너가 정의되어 있어야 합니다.');

  // 2. addSavedAvatar에 growthPrompt 보존 검증
  const updatedList = OurgoalAvatar.addSavedAvatar(mockProfile, {
    url: 'data:image/png;base64,mockNew',
    themeId: 3,
    growthPrompt: '지적으로'
  });
  assert.ok(updatedList.length === 3, '저장 아바타가 3개로 증가해야 합니다.');
  assert.strictEqual(updatedList[0].growthPrompt, '지적으로', '신규 아바타의 growthPrompt가 보존되어야 합니다.');

  // 3. 착용 중 아바타 삭제 방지 및 비착용 아바타 정상 삭제 검증
  const wearingDelete = OurgoalAvatar.removeSavedAvatar(mockProfile, 'ava_1');
  assert.strictEqual(wearingDelete, false, '착용 중인 아바타는 삭제가 차단되어야 합니다.');

  const nonWearingDelete = OurgoalAvatar.removeSavedAvatar(mockProfile, 'ava_2');
  assert.strictEqual(nonWearingDelete, true, '비착용 아바타는 정상 삭제되어야 합니다.');

  // 4. index.html 유해 단어 필터링 검증
  assert.ok(indexHtml.includes('filterHarmfulWords'), 'filterHarmfulWords 함수가 index.html에 정의되어 있어야 합니다.');
  assert.ok(indexHtml.includes('avatarLevelUpModal'), 'avatarLevelUpModal 엘리먼트가 존재해야 합니다.');
  assert.ok(indexHtml.includes('btnShareLevelUp'), 'SNS 공유 버튼(btnShareLevelUp)이 존재해야 합니다.');
  assert.ok(indexHtml.includes('btnSaveLevelUpImage'), '이미지 저장 버튼(btnSaveLevelUpImage)이 존재해야 합니다.');
  assert.ok(indexHtml.includes('btnConfirmLevelUpClose'), '확인 닫기 버튼(btnConfirmLevelUpClose)이 존재해야 합니다.');

  // 5. ui.css 모바일 375px 캐러셀 스타일 검증
  assert.ok(uiCss.includes('.avatar-10slots-carousel'), 'ui.css에 .avatar-10slots-carousel 스타일이 정의되어야 합니다.');
  assert.ok(uiCss.includes('.empty-avatar-slot'), 'ui.css에 .empty-avatar-slot 스타일이 정의되어야 합니다.');
}

runTest();
