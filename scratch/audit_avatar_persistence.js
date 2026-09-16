// scratch/audit_avatar_persistence.js
// 아바타 생성 후 앱 업데이트, 재로그인, 앱 재접속, 게스트-소셜 전환 무결성 시뮬레이션

const fs = require('fs');
const assert = require('assert');

console.log('=== 아바타 영속성 및 라이프사이클 유지 무결성 실측 감사 시작 ===\n');

// 1. mock localStorage & sessionStorage
const storage = {};
global.localStorage = {
  getItem: (k) => storage[k] !== undefined ? storage[k] : null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); },
  get length() { return Object.keys(storage).length; },
  key: (i) => Object.keys(storage)[i] || null
};

// 2. js/avatar-system.js 로드 및 검증
const avatarSystemCode = fs.readFileSync('C:/dev/ourgoal-app/js/avatar-system.js', 'utf8');
const indexHtml = fs.readFileSync('C:/dev/ourgoal-app/index.html', 'utf8');

console.log('1. 정적 소스코드 감사:');
const hasCustomAvatarUrlInSettings = avatarSystemCode.includes('settings.customAvatarUrl = newCustomUrl');
console.log(' - avatar-system.js 에서 settings.customAvatarUrl 저장 여부:', hasCustomAvatarUrlInSettings);

const hasAvatarUrlSync = avatarSystemCode.includes('profile.avatarUrl = newCustomUrl') || avatarSystemCode.includes('deps.state.profile.avatarUrl = newCustomUrl');
console.log(' - avatar-system.js 에서 profile.avatarUrl 동기화 여부:', hasAvatarUrlSync);

const hasGuestSettingsMigration = indexHtml.includes('rawGuest') && (indexHtml.includes('customAvatarUrl') || indexHtml.includes('avatarType'));
console.log(' - index.html 게스트 소셜 이전 시 settings/아바타 마이그레이션 여부:', hasGuestSettingsMigration);

const hasTopAvatarCustomSupport = indexHtml.includes('updateTopBar') && indexHtml.includes('customAvatarUrl');
console.log(' - index.html updateTopBar 에서 customAvatarUrl 지원 여부:', hasTopAvatarCustomSupport);

console.log('\n[정적 감사 요약]:');
if (!hasAvatarUrlSync) {
  console.log(' [취약점 1] avatar-system.js 에서 아바타 제작 후 profile.avatarUrl 을 함께 갱신하지 않아 Supabase DB users.avatar_url 및 상단바에 반영되지 않음');
}
if (!hasGuestSettingsMigration) {
  console.log(' [취약점 2] index.html 게스트 세션 마이그레이션 시 아바타 설정(avatarType, customAvatarUrl, avatarThemeId)이 누락되어 소셜 로그인 시 게스트 아바타 증발');
}
if (!hasTopAvatarCustomSupport) {
  console.log(' [취약점 3] index.html updateTopBar 에서 3등신 아바타(customAvatarUrl)를 직접 지원하지 않아 상단바 아바타와 레벨 뱃지 아바타 간 화면 불일치 발생');
}

console.log('\n=== 감사 스크립트 1차 실행 완료 ===');
