/**
 * tests/avatar-rank-background.test.js
 * #TASK-ES-272: 아바타 레벨별 상징 백그라운드 이미지(오버워치·롤 랭크 스타일 테마별 5레벨 배경) 결합 검증
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const avatarSystemPath = path.join(__dirname, '..', 'js', 'avatar-system.js');
const cssPath = path.join(__dirname, '..', 'ui.css');

const avatarCode = fs.readFileSync(avatarSystemPath, 'utf8');
const cssCode = fs.readFileSync(cssPath, 'utf8');

// 1. 코드 정적 단언
assert.ok(avatarCode.includes('avatar-rank-side-wings'), 'avatar-rank-side-wings must exist in js/avatar-system.js');
assert.ok(avatarCode.includes('rank-wings-sprout'), 'rank-wings-sprout must exist');
assert.ok(avatarCode.includes('rank-wings-forest'), 'rank-wings-forest must exist');
assert.ok(avatarCode.includes('rank-wings-poseidon'), 'rank-wings-poseidon must exist');
assert.ok(avatarCode.includes('rank-wings-zeus'), 'rank-wings-zeus must exist');
assert.ok(avatarCode.includes('rank-wings-cosmic'), 'rank-wings-cosmic must exist');
assert.ok(avatarCode.includes('z-index:1'), 'svg layer must have z-index:1');
assert.ok(avatarCode.includes('z-index:2'), 'inner frame must have z-index:2');

// 2. CSS 스타일 정적 단언
assert.ok(cssCode.includes('.avatar-rank-side-wings'), '.avatar-rank-side-wings must be defined in ui.css');
assert.ok(cssCode.includes('.rank-wings-sprout'), '.rank-wings-sprout must be defined in ui.css');
assert.ok(cssCode.includes('.rank-wings-forest'), '.rank-wings-forest must be defined in ui.css');
assert.ok(cssCode.includes('.rank-wings-poseidon'), '.rank-wings-poseidon must be defined in ui.css');
assert.ok(cssCode.includes('.rank-wings-zeus'), '.rank-wings-zeus must be defined in ui.css');
assert.ok(cssCode.includes('.rank-wings-cosmic'), '.rank-wings-cosmic must be defined in ui.css');

// 3. 런타임 모듈 검증
const api = require(avatarSystemPath);
assert.ok(api, 'OurgoalAvatar API must be exported');
assert.strictEqual(typeof api.getRankThemeInfo, 'function', 'getRankThemeInfo must be a function');
assert.strictEqual(typeof api.getRankWingsSvg, 'function', 'getRankWingsSvg must be a function');
assert.strictEqual(typeof api.renderAvatarHtml, 'function', 'renderAvatarHtml must be a function');

// 4. 5대 테마 25단계 레벨별 테마 및 스텝 매핑 검증
// 새싹 (Lv 1 ~ 5)
const t1 = api.getRankThemeInfo(1);
assert.strictEqual(t1.id, 'sprout', 'Lv 1 must be sprout');
assert.strictEqual(t1.subStep, 1, 'Lv 1 must be step 1');

const t5 = api.getRankThemeInfo(5);
assert.strictEqual(t5.id, 'sprout', 'Lv 5 must be sprout');
assert.strictEqual(t5.subStep, 5, 'Lv 5 must be step 5');

// 숲 (Lv 6 ~ 10)
const t6 = api.getRankThemeInfo(6);
assert.strictEqual(t6.id, 'forest', 'Lv 6 must be forest');
assert.strictEqual(t6.subStep, 1, 'Lv 6 must be step 1');

const t10 = api.getRankThemeInfo(10);
assert.strictEqual(t10.id, 'forest', 'Lv 10 must be forest');
assert.strictEqual(t10.subStep, 5, 'Lv 10 must be step 5');

// 포세이돈 (Lv 11 ~ 15)
const t11 = api.getRankThemeInfo(11);
assert.strictEqual(t11.id, 'poseidon', 'Lv 11 must be poseidon');
assert.strictEqual(t11.subStep, 1, 'Lv 11 must be step 1');

const t15 = api.getRankThemeInfo(15);
assert.strictEqual(t15.id, 'poseidon', 'Lv 15 must be poseidon');
assert.strictEqual(t15.subStep, 5, 'Lv 15 must be step 5');

// 제우스 (Lv 16 ~ 20)
const t16 = api.getRankThemeInfo(16);
assert.strictEqual(t16.id, 'zeus', 'Lv 16 must be zeus');
assert.strictEqual(t16.subStep, 1, 'Lv 16 must be step 1');

const t20 = api.getRankThemeInfo(20);
assert.strictEqual(t20.id, 'zeus', 'Lv 20 must be zeus');
assert.strictEqual(t20.subStep, 5, 'Lv 20 must be step 5');

// 코스믹 우주 (Lv 21 ~ 25+)
const t21 = api.getRankThemeInfo(21);
assert.strictEqual(t21.id, 'cosmic', 'Lv 21 must be cosmic');
assert.strictEqual(t21.subStep, 1, 'Lv 21 must be step 1');

const t25 = api.getRankThemeInfo(25);
assert.strictEqual(t25.id, 'cosmic', 'Lv 25 must be cosmic');
assert.strictEqual(t25.subStep, 5, 'Lv 25 must be step 5');

const t30 = api.getRankThemeInfo(30);
assert.strictEqual(t30.id, 'cosmic', 'Lv 30 must be cosmic');
assert.strictEqual(t30.subStep, 5, 'Lv 30 must be step 5 (master)');

// 5. getRankWingsSvg() 좌우 날개 및 백그라운드 레이어 렌더링 검증
[1, 7, 13, 18, 24].forEach((lv) => {
  const svg = api.getRankWingsSvg(lv, 54);
  assert.ok(svg.includes('avatar-rank-side-wings'), 'Level ' + lv + ' must contain side wings');
  assert.ok(svg.includes('z-index:1'), 'Level ' + lv + ' must have z-index:1');
});

// 6. renderAvatarHtml() 결합 구조 검증
const htmlLv1 = api.renderAvatarHtml(1, { settings: { avatarType: 'robot' } }, { size: 54 });
assert.ok(htmlLv1.includes('avatar-rank-aura-wrap'), 'renderAvatarHtml must wrap in avatar-rank-aura-wrap');
assert.ok(htmlLv1.includes('rank-theme-sprout'), 'renderAvatarHtml must include theme class');
assert.ok(htmlLv1.includes('avatar-inner-box'), 'renderAvatarHtml must include inner avatar frame');
assert.ok(htmlLv1.includes('avatar-rank-side-wings'), 'renderAvatarHtml must include side wings');
