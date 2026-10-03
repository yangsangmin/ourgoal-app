/**
 * tests/trio-es143-es145.test.js
 * 
 * [E1/E3/UX] #TASK-ES-143 ~ #TASK-ES-145 통합 검증 테스트
 * 1. #TASK-ES-143: 온보딩 첫 체크인 축하 모달 내 동류 러너 3인 매칭 & 첫 웰컴 스탬프 발송 및 소통 탭 직통 전환
 * 2. #TASK-ES-144: 프로필 편집 4종(잇템 추가·관심 카테고리·지역공개·동네설정) 결함 완치 및 계정 게스트 오표기 교정
 * 3. #TASK-ES-145: 갓생 스토리카드 5대 비율 다각화 & 잠금화면용 일정 카드 9:16 고해상도 생성 고도화
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const indexHtmlPath = path.join(__dirname, '..', 'index.html');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

const recordsStatsJsPath = path.join(__dirname, '..', 'js', 'records-stats.js');
const recordsStatsJs = fs.readFileSync(recordsStatsJsPath, 'utf8');

const componentsJsPath = path.join(__dirname, '..', 'js', 'components.js');
const componentsJs = fs.readFileSync(componentsJsPath, 'utf8');

test('#TASK-ES-143 온보딩 후속 E3 동류 러너 매칭 & 첫 웰컴 스탬프 발송 검증', (t) => {
  assert.ok(indexHtml.includes('function getPeerRunnersForCategory('), 'getPeerRunnersForCategory 함수가 정의되어 있어야 함');
  assert.ok(indexHtml.includes('id="firstCheckinCommBtn"'), '첫 웰컴 스탬프 발송 버튼(#firstCheckinCommBtn)이 존재해야 함');
  assert.ok(indexHtml.includes('id="firstCheckinDoneBtn"'), '홈 콕핏 둘러보기 버튼(#firstCheckinDoneBtn)이 존재해야 함');
  assert.ok(indexHtml.includes('함께 달리는 동류 러너'), '동류 러너 조망 섹션 타이틀이 존재해야 함');
  assert.ok(indexHtml.includes("toast('💌 동류 러너들에게 웰컴 응원 스탬프를 보냈어요! (+5 EXP)')"), '웰컴 스탬프 발송 완료 피드백 토스트가 연동되어야 함');
  assert.ok(indexHtml.includes("state.commSubTab = 'feed'"), '소통 탭 피드로의 직통 전환이 배선되어야 함');
});

test('#TASK-ES-144 프로필 편집 4종 정상화 및 계정 게스트 오표기 완치 검증', (t) => {
  // [72] 게스트 오표기 교정
  assert.ok(indexHtml.includes('isRealUser = (u && u.id && String(u.id).indexOf(\'guest\') === -1)'), '정회원 판별 가드가 강화되어 있어야 함');
  assert.ok(indexHtml.includes('회원') && indexHtml.includes('계정 연동됨 (동기화 활성)'), '정회원 상태일 때 계정 연동됨으로 정확히 표출되어야 함');

  // [73] 잇템 추가
  assert.ok(indexHtml.includes('id="pvAddItItem"'), '잇템 추가 버튼(#pvAddItItem)이 존재해야 함');
  assert.ok(indexHtml.includes('id="pvInlineItItemForm"'), '인라인 잇템 입력 폼이 존재해야 함');
  assert.ok(indexHtml.includes('id="btnConfirmInlineItItem"'), '잇템 등록 완료 버튼이 존재해야 함');

  // [74] 관심 카테고리
  assert.ok(indexHtml.includes('id="pvInterests"'), '관심 카테고리 컨테이너(#pvInterests)가 존재해야 함');
  assert.ok(indexHtml.includes('b.classList.add(\'active\')') || indexHtml.includes('b.classList.remove(\'active\')'), '관심 카테고리 칩 선택 토글이 안정적으로 배선되어야 함');

  // [75] 지역공개 토글
  assert.ok(indexHtml.includes('id="pvRegionPublic"'), '지역공개 토글 스위치(#pvRegionPublic)가 존재해야 함');

  // [76] 내 동네 설정
  assert.ok(indexHtml.includes('wireRegionPicker(sheet, \'pvRegion\', regionRef)'), '지역 피커가 draft.region과 정확히 바인딩되어야 함');
  assert.ok(indexHtml.includes('p.settings.itItems = p.itItems'), 'settings에 itItems가 2중 영속화되어야 함');
});

test('#TASK-ES-145 갓생 스토리카드 5대 비율 다각화 및 잠금화면 카드 고도화 검증', (t) => {
  // 스토리카드 모달 직통 호출
  assert.ok(recordsStatsJs.includes('openMzShareCardModal'), 'records-stats.js Item35 핸들러에서 openMzShareCardModal이 호출되어야 함');
  assert.ok(componentsJs.includes('openMzShareCardModal'), 'components.js Item35 핸들러에서 openMzShareCardModal이 호출되어야 함');

  // 기록 탭 헤더 스토리카드 버튼
  assert.ok(indexHtml.includes('id="recStoryCardBtn"'), '기록 탭 헤더에 #recStoryCardBtn이 탑재되어 있어야 함');

  // 스토리카드 5대 비율 지원
  assert.ok(indexHtml.includes('data-ratio="9:16"'), '9:16 스토리 비율 지원');
  assert.ok(indexHtml.includes('data-ratio="1:1"'), '1:1 피드 비율 지원');
  assert.ok(indexHtml.includes('data-ratio="3:4"'), '3:4 세로 비율 지원');
  assert.ok(indexHtml.includes('data-ratio="4:3"'), '4:3 가로 비율 지원');
  assert.ok(indexHtml.includes('data-ratio="16:9"'), '16:9 가로 비율 지원');

  // 일정 탭 잠금화면 카드 버튼
  assert.ok(indexHtml.includes('id="calLockScreenBtn"'), '일정 탭 잠금화면 카드 버튼(#calLockScreenBtn)이 존재해야 함');
  assert.ok(indexHtml.includes('잠금화면용 일정 카드 저장'), '잠금화면용 일정 카드 저장 라벨이 표출되어야 함');
});
