/**
 * tests/profile-region-public.test.js
 * [#TASK-ES-326 / 노션 75번] 프로필 지역공개 토글 스위치 설정 및 저장 작동 안함 오류 수정 단위 테스트
 */
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

async function runTests() {
  console.log('--- [#TASK-ES-326] 프로필 지역공개 토글 스위치 단위 테스트 시작 ---');

  // 1. 소스 코드 정적 무결성 검증
  const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  const uiCss = fs.readFileSync(path.join(__dirname, '../ui.css'), 'utf8');
  const componentsJs = fs.readFileSync(path.join(__dirname, '../js/components.js'), 'utf8');

  // 1.1 UI 스타일 정의 검증
  assert.ok(uiCss.includes('.pv-region-card'), 'ui.css 내 .pv-region-card 클래스 확인');
  assert.ok(uiCss.includes('.pv-region-badge'), 'ui.css 내 .pv-region-badge 클래스 확인');
  assert.ok(uiCss.includes('.pv-region-benefit-card'), 'ui.css 내 .pv-region-benefit-card 클래스 확인');

  // 1.2 index.html 마크업 및 로직 검증
  assert.ok(indexHtml.includes('id="pvRegionPublicBadge"'), 'index.html 내 #pvRegionPublicBadge 요소 확인');
  assert.ok(indexHtml.includes('id="pvRegionBenefitCard"'), 'index.html 내 #pvRegionBenefitCard 요소 확인');
  assert.ok(indexHtml.includes('id="pvRegionBenefitText"'), 'index.html 내 #pvRegionBenefitText 요소 확인');
  assert.ok(indexHtml.includes('function updateRegionPublicUI()'), 'index.html 내 updateRegionPublicUI 함수 확인');
  assert.ok(indexHtml.includes('function updateRegionBenefitText()'), 'index.html 내 updateRegionBenefitText 함수 확인');

  // 1.3 js/components.js 핸들러 및 노출 검증
  assert.ok(componentsJs.includes('async function handle프로필_Item75Action'), 'js/components.js 내 handle프로필_Item75Action 선언 확인');
  assert.ok(componentsJs.includes('OurgoalComponents.handle프로필_Item75Action = handle프로필_Item75Action;'), 'OurgoalComponents 노출 확인');
  assert.ok(componentsJs.includes('window.handle프로필_Item75Action = handle프로필_Item75Action;'), 'window 전역 노출 확인');
  assert.ok(componentsJs.includes('module.exports.handle프로필_Item75Action = handle프로필_Item75Action;'), 'module.exports 노출 확인');

  // 2. 가상 환경 모의 동작 검증 (Virtual Environment Simulation)
  const storage = {};
  let hapticDuration = 0;
  const viewRefreshes = { profileCard: 0, settings: 0, home: 0, goals: 0, comm: 0, all: 0 };

  const winMock = {
    navigator: {
      vibrate: function(ms) {
        hapticDuration = ms;
        return true;
      }
    },
    localStorage: {
      setItem: function(k, v) { storage[k] = v; },
      getItem: function(k) { return storage[k] || null; }
    },
    state: {
      profile: {
        id: 'usr_test_75',
        displayName: '상민',
        bio: '아워골로 매일 성장하는 중',
        avatarUrl: 'av_fox',
        interests: ['health/러닝·마라톤'],
        region: '서울 마포구',
        regionPublic: false,
        itItems: []
      }
    },
    renderProfileCard: function() { viewRefreshes.profileCard++; },
    renderSettingsScreen: function() { viewRefreshes.settings++; },
    renderHome: function() { viewRefreshes.home++; },
    renderGoalsScreen: function() { viewRefreshes.goals++; },
    renderCommScreen: function() { viewRefreshes.comm++; },
    renderAll: function() { viewRefreshes.all++; },
    toast: function(msg) {}
  };

  const componentsModule = require('../js/components.js');
  assert.strictEqual(typeof componentsModule.handle프로필_Item75Action, 'function', '컴포넌트 모듈 핸들러 함수 확인');

  // 2.1 핸들러 실행: 지역 공개(true) 활성화 테스트
  const testPayloadOn = {
    ticket: '75',
    regionPublic: true,
    region: '서울 마포구',
    silent: true
  };

  const resultOn = await componentsModule.handle프로필_Item75Action.call(winMock, null, testPayloadOn);
  assert.strictEqual(resultOn.task_id, 'TASK-ES-326', 'task_id 반환 일치 확인');
  assert.strictEqual(resultOn.region_public, true, 'region_public true 반환 확인');
  assert.strictEqual(resultOn.privacy_boundary_guaranteed, true, '안심 프라이버시 바운더리 보장 플래그 확인');
  assert.strictEqual(hapticDuration, 12, '12ms 햅틱 반응 검증');

  // 2.2 로컬 캐시 및 프로필 상태 갱신 검증
  const cachedJson = storage['og_task-75_cache'];
  assert.ok(cachedJson, 'og_task-75_cache 영속화 확인');
  const parsedCache = JSON.parse(cachedJson);
  assert.strictEqual(parsedCache.state, 'completed');
  assert.strictEqual(parsedCache.region_public, true);

  const profileBackupOn = JSON.parse(storage['ourgoal_profile_backup_usr_test_75']);
  assert.strictEqual(profileBackupOn.regionPublic, true, '프로필 백업 내 regionPublic true 동기화 확인');
  assert.strictEqual(profileBackupOn.region, '서울 마포구', '프로필 백업 내 region 동기화 확인');

  // 2.3 핸들러 실행: 지역 비공개(false) 전환 테스트
  const testPayloadOff = {
    ticket: '75',
    regionPublic: false,
    silent: true
  };

  const resultOff = await componentsModule.handle프로필_Item75Action.call(winMock, null, testPayloadOff);
  assert.strictEqual(resultOff.region_public, false, 'region_public false 반환 확인');
  const profileBackupOff = JSON.parse(storage['ourgoal_profile_backup_usr_test_75']);
  assert.strictEqual(profileBackupOff.regionPublic, false, '프로필 백업 내 regionPublic false 동기화 확인');

  // 2.4 4대 뷰 동시 전파 확인
  assert.ok(viewRefreshes.profileCard > 0, 'renderProfileCard 전파 확인');
  assert.ok(viewRefreshes.settings > 0, 'renderSettingsScreen 전파 확인');
  assert.ok(viewRefreshes.home > 0, 'renderHome 전파 확인');
  assert.ok(viewRefreshes.goals > 0, 'renderGoalsScreen 전파 확인');
  assert.ok(viewRefreshes.comm > 0, 'renderCommScreen 전파 확인');
  assert.ok(viewRefreshes.all > 0, 'renderAll 전파 확인');

  console.log('✅ [#TASK-ES-326] 단위 테스트 전수 통과 완료 (PASS)!');
}

runTests().catch(function(err){
  console.error('❌ [#TASK-ES-326] 단위 테스트 실패:', err);
  throw err;
});
