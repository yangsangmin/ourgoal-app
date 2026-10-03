'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const TEST_SUITE_NAME = 'onboarding-first-checkin';
const TASK_TICKET_ID = 'TASK-ES-142';

// 1. index.html 정적 파일 검증
const indexHtmlPath = path.join(__dirname, '../index.html');
assert.ok(fs.existsSync(indexHtmlPath), 'index.html must exist');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

// 2. 홈 콕핏 첫 체크인 튜토리얼 배너 슬롯 검증
assert.ok(indexHtml.includes('id="firstCheckinTutorialBanner"'), 'index.html must contain #firstCheckinTutorialBanner');
assert.ok(indexHtml.includes('id="firstCheckinTutorialEmoji"'), 'index.html must contain #firstCheckinTutorialEmoji');
assert.ok(indexHtml.includes('id="firstCheckinTutorialTitle"'), 'index.html must contain #firstCheckinTutorialTitle');
assert.ok(indexHtml.includes('id="firstCheckinTutorialDesc"'), 'index.html must contain #firstCheckinTutorialDesc');
assert.ok(indexHtml.includes('id="closeFirstCheckinTutorialBtn"'), 'index.html must contain #closeFirstCheckinTutorialBtn');

// 3. 3단계 온보딩 함수 정의 검증
assert.ok(indexHtml.includes('function showObStep1('), 'showObStep1 function must be defined');
assert.ok(indexHtml.includes('function showObStep2('), 'showObStep2 function must be defined');
assert.ok(indexHtml.includes('function completeOnboarding('), 'completeOnboarding function must be defined');
assert.ok(indexHtml.includes('function renderFirstCheckinTutorialBanner('), 'renderFirstCheckinTutorialBanner function must be defined');
assert.ok(indexHtml.includes('function triggerFirstCheckinCelebrationModal('), 'triggerFirstCheckinCelebrationModal function must be defined');

// 4. 16종 MBTI 수호동물 데이터 무결성 검증
const expectedAnimals = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP'
];
expectedAnimals.forEach(mbti => {
  assert.ok(indexHtml.includes(`mbti: '${mbti}'`), `Guardian animal for ${mbti} must be configured in onboarding`);
});

// 4대 성향 탭 검증
['분석형', '외교형', '관리형', '탐험형'].forEach(grp => {
  assert.ok(indexHtml.includes(`'${grp}'`), `Personality group chip '${grp}' must exist`);
});

// 5. 3대 킬러 목표 프리셋 검증
assert.ok(indexHtml.includes('매일 30분 달리기/걷기'), '30min exercise preset must exist');
assert.ok(indexHtml.includes('하루 20분 집중 공부/독서'), '20min study preset must exist');
assert.ok(indexHtml.includes('아침 7시 기상 & 스트레칭'), '7am wake-up preset must exist');
assert.ok(indexHtml.includes('나중에 설정하기'), 'Skip/later preset must exist');

// 6. EXP 보상 및 E1 루프 무결성 검증
assert.ok(indexHtml.includes("awardXP(10, '온보딩 수호동물 안착 축하')"), 'Onboarding completion must award 10 EXP');
assert.ok(indexHtml.includes('+10 EXP ✨'), 'Celebration modal must show +10 EXP badge');
assert.ok(indexHtml.includes('firstCheckinCelebrated'), 'firstCheckinCelebrated state property must be tracked');
assert.ok(indexHtml.includes('firstCheckinPending'), 'firstCheckinPending state property must be tracked');
