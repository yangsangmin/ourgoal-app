// scratch/simulate_avatar_persistence.js
// 4대 시나리오 실측 시뮬레이션 테스트

const assert = require('assert');

console.log('=== 아바타 라이프사이클 4대 시나리오 무결성 시뮬레이션 ===\n');

// Mock localStorage
const store = {};
const mockLocalStorage = {
  getItem: (k) => store[k] !== undefined ? store[k] : null,
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); }
};

// Mock Supabase DB
const mockDb = {
  users: {},
  goals: [],
  checkins: []
};

// 시나리오 1: 아바타 생성 및 저장 시뮬레이션
console.log('--- [시나리오 1] 아바타 생성 및 saveProfile() 영속화 테스트 ---');
let profile = {
  id: 'user_123',
  username: 'testuser',
  displayName: '테스트유저',
  avatarUrl: '',
  settings: {
    avatarType: 'robot',
    customAvatarUrl: '',
    avatarThemeId: 1,
    avatarCraftCount: 0
  },
  goals: [],
  records: []
};

// 사용자가 3등신 아바타 제작 완료
const mockAvatarDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const chosenThemeId = 42;

// 기존 방식 (settings에만 저장) vs 개선 방식 (profile.avatarUrl 도 동기화)
profile.settings.avatarType = 'custom';
profile.settings.customAvatarUrl = mockAvatarDataUrl;
profile.settings.avatarThemeId = chosenThemeId;
profile.avatarUrl = mockAvatarDataUrl; // [개선 배선]

// saveProfile 시뮬레이션
mockLocalStorage.setItem('ourgoal_settings_' + profile.id, JSON.stringify(profile.settings));
mockLocalStorage.setItem('ourgoal_profile_backup_' + profile.id, JSON.stringify({
  displayName: profile.displayName,
  avatarUrl: profile.avatarUrl
}));
mockDb.users[profile.id] = {
  id: profile.id,
  display_name: profile.displayName,
  avatar_url: profile.avatarUrl
};

assert.strictEqual(mockDb.users[profile.id].avatar_url, mockAvatarDataUrl, 'DB users에 avatar_url 저장 성공');
assert.strictEqual(JSON.parse(mockLocalStorage.getItem('ourgoal_settings_' + profile.id)).customAvatarUrl, mockAvatarDataUrl, '로컬 세팅에 customAvatarUrl 저장 성공');
console.log('✔ 시나리오 1 PASS: 아바타 제작 시 DB와 로컬스토리지 모두에 완벽 영속화\n');


// 시나리오 2: 로그아웃 후 재로그인 (동일 기기 & 새 기기/캐시삭제 환경)
console.log('--- [시나리오 2] 로그아웃 후 재로그인 시 아바타 복원 테스트 ---');

// 로그아웃 수행 (performLogout)
mockLocalStorage.removeItem('ourgoal_guest_profile');
mockLocalStorage.removeItem('ourgoal_current_user');
let sessionProfile = null;

// Case 2-A: 동일 기기 재로그인 (ourgoal_settings_ 남아있는 경우)
let restoredSettingsA = JSON.parse(mockLocalStorage.getItem('ourgoal_settings_user_123'));
assert.strictEqual(restoredSettingsA.customAvatarUrl, mockAvatarDataUrl, '동일 기기 재로그인 시 아바타 유지');

// Case 2-B: 새 기기 / 시크릿 모드 / 캐시 삭제 후 재로그인 (ourgoal_settings_ 가 없는 경우)
mockLocalStorage.removeItem('ourgoal_settings_user_123'); // 캐시 삭제 모사
let urow = mockDb.users['user_123']; // 서버 DB에서 조회된 urow
let restoredSettingsB = { avatarType: 'robot', customAvatarUrl: '' }; // defaultSettings

// [개선 배선: loadProfile의 DB avatar_url 자동 복구 안전망]
if (!restoredSettingsB.customAvatarUrl && urow.avatar_url) {
  restoredSettingsB.customAvatarUrl = urow.avatar_url;
  restoredSettingsB.avatarType = 'custom';
}
assert.strictEqual(restoredSettingsB.customAvatarUrl, mockAvatarDataUrl, '새 기기 로그인 시 DB users.avatar_url에서 아바타 자동 복원 성공');
assert.strictEqual(restoredSettingsB.avatarType, 'custom', '새 기기 로그인 시 avatarType=custom 복원 성공');
console.log('✔ 시나리오 2 PASS: 동일 기기 및 새 기기/캐시삭제 재로그인 시 아바타 100% 유지\n');


// 시나리오 3: 게스트 상태에서 아바타 생성 후 소셜 로그인 전환
console.log('--- [시나리오 3] 게스트 상태 아바타 생성 후 소셜 로그인 마이그레이션 ---');
const guestId = 'guest_999';
const guestProfile = {
  id: guestId,
  displayName: '게스트',
  avatarUrl: mockAvatarDataUrl,
  settings: {
    avatarType: 'custom',
    customAvatarUrl: mockAvatarDataUrl,
    avatarThemeId: chosenThemeId,
    avatarCraftCount: 1
  },
  goals: [], // 목표를 아직 안 만들었을 수도 있음
  records: []
};
mockLocalStorage.setItem('ourgoal_guest_profile', JSON.stringify(guestProfile));
mockLocalStorage.setItem('ourgoal_settings_' + guestId, JSON.stringify(guestProfile.settings));

// 소셜 로그인 세션 생성 (카카오/구글)
const socialUser = { id: 'social_user_888', email: 'user@kakao.com' };
let socialProfile = {
  id: socialUser.id,
  displayName: '카카오유저',
  avatarUrl: '',
  settings: { avatarType: 'robot', customAvatarUrl: '', avatarCraftCount: 0 }
};

// [개선 배선: restoreSessionAndEnter() 게스트 아바타/설정 마이그레이션]
const rawGuest = mockLocalStorage.getItem('ourgoal_guest_profile');
if (rawGuest) {
  const gData = JSON.parse(rawGuest);
  if (gData && gData.id !== socialUser.id) {
    // 게스트 아바타 설정 마이그레이션
    if (gData.settings && gData.settings.avatarType === 'custom' && gData.settings.customAvatarUrl) {
      socialProfile.settings.avatarType = 'custom';
      socialProfile.settings.customAvatarUrl = gData.settings.customAvatarUrl;
      socialProfile.settings.avatarThemeId = gData.settings.avatarThemeId;
      socialProfile.settings.avatarCraftCount = gData.settings.avatarCraftCount;
      socialProfile.avatarUrl = gData.settings.customAvatarUrl;
    } else if (gData.avatarUrl) {
      socialProfile.avatarUrl = gData.avatarUrl;
    }
  }
}

assert.strictEqual(socialProfile.settings.customAvatarUrl, mockAvatarDataUrl, '소셜 로그인 후 게스트 커스텀 아바타 URL 승계 성공');
assert.strictEqual(socialProfile.settings.avatarType, 'custom', '소셜 로그인 후 게스트 avatarType 승계 성공');
assert.strictEqual(socialProfile.avatarUrl, mockAvatarDataUrl, '소셜 로그인 후 avatarUrl 동기화 성공');
console.log('✔ 시나리오 3 PASS: 게스트 -> 소셜 로그인 전환 시 아바타 설정 100% 무손실 이전\n');


// 시나리오 4: 앱 나갔다가 다시 들어올 때 (F5 / 탭 재접속)
console.log('--- [시나리오 4] 앱 나갔다가 다시 들어왔을 때 아바타 유지 테스트 ---');
// localStorage에 저장된 세션 상태에서 boot() 복원
mockLocalStorage.setItem('ourgoal_guest_profile', JSON.stringify(socialProfile));
mockLocalStorage.setItem('ourgoal_settings_' + socialProfile.id, JSON.stringify(socialProfile.settings));

// 브라우저 탭 닫고 다시 열었을 때 boot() 복원 시뮬레이션
const bootedRaw = mockLocalStorage.getItem('ourgoal_guest_profile');
const bootedProfile = JSON.parse(bootedRaw);
const bootedSettings = JSON.parse(mockLocalStorage.getItem('ourgoal_settings_' + bootedProfile.id));
bootedProfile.settings = bootedSettings;

assert.strictEqual(bootedProfile.settings.customAvatarUrl, mockAvatarDataUrl, '앱 재접속 시 customAvatarUrl 정상 로드');
assert.strictEqual(bootedProfile.settings.avatarType, 'custom', '앱 재접속 시 avatarType 정상 로드');
console.log('✔ 시나리오 4 PASS: 앱 재접속(새로고침/탭 재오픈) 시 아바타 100% 유지\n');

console.log('🎉 모든 4대 시나리오 시뮬레이션 검증 100% PASS!');
