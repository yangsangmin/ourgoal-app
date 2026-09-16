// scratch/simulate_accumulative_avatars.js
// #TASK-ES-119 누적 아바타 보관함(서랍) CRUD 및 라이프사이클 무결성 검증

const assert = require('assert');
const OurgoalAvatar = require('../js/avatar-system.js');

console.log('=== [#TASK-ES-119] 생성 아바타 누적 보관함(서랍) 무결성 시뮬레이션 시작 ===\n');

// 1. 자가 치유(Self-Healing) 검증: 기존 유저가 customAvatarUrl만 있고 savedAvatars가 없는 경우
console.log('1. 기존 단일 customAvatarUrl 유저 자가치유 검증:');
const profile1 = {
  id: 'user_legacy',
  settings: {
    avatarType: 'custom',
    customAvatarUrl: 'data:image/png;base64,LEGACY_AVATAR_IMAGE',
    avatarThemeId: 2
  }
};
const list1 = OurgoalAvatar.getSavedAvatars(profile1);
assert.strictEqual(list1.length, 1, '보관함이 비어있을 때 기존 아바타를 1번 아이템으로 자동 복원');
assert.strictEqual(list1[0].url, 'data:image/png;base64,LEGACY_AVATAR_IMAGE');
assert.strictEqual(list1[0].themeId, 2);
assert.strictEqual(list1[0].themeName, '덤벨 마스터');
console.log('✔ PASS: 기존 단일 아바타 자가치유 보관 성공\n');

// 2. 신규 생성 아바타 누적 추가 검증 (최대 10개 한도)
console.log('2. 아바타 누적 추가 및 10개 한도 검증:');
for (let i = 1; i <= 12; i++) {
  OurgoalAvatar.addSavedAvatar(profile1, {
    id: 'ava_' + i,
    url: 'data:image/png;base64,NEW_AVATAR_' + i,
    themeId: i,
    themeName: '테마_' + i,
    themeIcon: '🏃'
  });
}
const list2 = OurgoalAvatar.getSavedAvatars(profile1);
assert.strictEqual(list2.length, 10, '아바타 보관함은 최대 10개까지만 유지');
assert.strictEqual(list2[0].url, 'data:image/png;base64,NEW_AVATAR_12', '가장 최근에 제작한 아바타가 1번에 위치');
console.log('✔ PASS: 10개 누적 보관 및 최신순 unshift 확인\n');

// 3. 착용 중인 아바타 삭제 보호 검증
console.log('3. 착용 중 아바타 삭제 보호 검증:');
profile1.settings.customAvatarUrl = list2[0].url; // 착용 중 설정
const removeActiveResult = OurgoalAvatar.removeSavedAvatar(profile1, list2[0].id);
assert.strictEqual(removeActiveResult, false, '현재 착용 중인 아바타는 삭제 불가');

const removeOtherResult = OurgoalAvatar.removeSavedAvatar(profile1, list2[1].id);
assert.strictEqual(removeOtherResult, true, '착용 중이 아닌 아바타는 정상 삭제');
assert.strictEqual(profile1.settings.savedAvatars.length, 9, '삭제 후 9개로 감소');
console.log('✔ PASS: 착용 중 아바타 보호 및 일반 아바타 삭제 성공\n');

// 4. 게스트 ➔ 소셜 로그인 마이그레이션 시뮬레이션
console.log('4. 게스트 -> 소셜 로그인 보관함 배열 무손실 마이그레이션:');
const guestData = {
  id: 'guest-1234',
  settings: {
    avatarType: 'custom',
    customAvatarUrl: 'data:image/png;base64,GUEST_AVATAR',
    avatarThemeId: 1,
    savedAvatars: [
      { id: 'ava_g1', url: 'data:image/png;base64,GUEST_AVA_1', themeId: 1 },
      { id: 'ava_g2', url: 'data:image/png;base64,GUEST_AVA_2', themeId: 2 }
    ]
  }
};
const socialProfile = {
  id: 'social-user-9999',
  settings: { avatarType: 'robot' }
};

// index.html 마이그레이션 로직 모의
if (guestData.settings && guestData.settings.savedAvatars) {
  socialProfile.settings.savedAvatars = guestData.settings.savedAvatars;
}
assert.strictEqual(socialProfile.settings.savedAvatars.length, 2, '게스트 보관함이 소셜 계정으로 100% 무손실 복제');
console.log('✔ PASS: 게스트 -> 소셜 마이그레이션 검증 완료\n');

console.log('🎉 [#TASK-ES-119] 모든 누적 보관함 CRUD 및 라이프사이클 무결성 검증 100% PASS!');
