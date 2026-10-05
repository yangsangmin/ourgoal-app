'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('[TEST START] routine-detail-modal (#TASK-ES-305)');

const indexHtml = require('./helpers/inline-bundle').withInlineCells(fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8'));
const uiCss = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');

// 1. openRoutineDetailModal 함수 및 모달 마크업 요소 확인
assert.ok(indexHtml.includes('function openRoutineDetailModal(routineId)'), 'openRoutineDetailModal 함수 정의');
assert.ok(indexHtml.includes('class="routine-detail-modal-box"'), 'routine-detail-modal-box 클래스 마크업');
assert.ok(indexHtml.includes('id="detailRtCategoryPicker"'), '#detailRtCategoryPicker 카테고리 칩 컨테이너');
assert.ok(indexHtml.includes('id="inDetailRtTitle"'), '#inDetailRtTitle 루틴 제목 인풋');
assert.ok(indexHtml.includes('id="inDetailRtLinkedGoalId"'), '#inDetailRtLinkedGoalId 연결 상위 목표 셀렉트');
assert.ok(indexHtml.includes('id="inDetailRtTime"'), '#inDetailRtTime 시간 인풋');
assert.ok(indexHtml.includes('id="inDetailRtNotify"'), '#inDetailRtNotify 푸시 알림 체크박스');
assert.ok(indexHtml.includes('id="detailRoutineDaysPicker"'), '#detailRoutineDaysPicker 요일 선택 칩');
assert.ok(indexHtml.includes('id="inDetailRtMemo"'), '#inDetailRtMemo 상세 메모/실천팁 textarea');
assert.ok(indexHtml.includes('id="btnSaveDetailRoutine"'), '#btnSaveDetailRoutine 저장하기 버튼');
assert.ok(indexHtml.includes('id="btnDeleteDetailRoutine"'), '#btnDeleteDetailRoutine 삭제하기 버튼');

// 2. 루틴 카드 직통 오픈 배선 및 카드 내 배지 렌더링
assert.ok(indexHtml.includes("openRoutineDetailModal(rId)"), '루틴 카드 클릭 시 openRoutineDetailModal 직통 진입');
assert.ok(indexHtml.includes('routine-cat-badge'), '루틴 카드 내 카테고리 배지 클래스');
assert.ok(indexHtml.includes('routine-linked-goal-badge'), '루틴 카드 내 연결 목표 배지 클래스');

// 3. openAddRoutineModal 내 카테고리 및 상위 목표 연계 확인
assert.ok(indexHtml.includes('id="addRtCategoryPicker"'), '#addRtCategoryPicker 추가 모달 카테고리 칩');
assert.ok(indexHtml.includes('id="inAddRtLinkedGoalId"'), '#inAddRtLinkedGoalId 추가 모달 상위 목표 셀렉트');

// 4. ui.css 스타일 정의 확인
assert.ok(uiCss.includes('.routine-detail-modal-box'), 'ui.css .routine-detail-modal-box 스타일');
assert.ok(uiCss.includes('.routine-cat-chip'), 'ui.css .routine-cat-chip 스타일');
assert.ok(uiCss.includes('.routine-cat-badge'), 'ui.css .routine-cat-badge 스타일');
assert.ok(uiCss.includes('.routine-linked-goal-badge'), 'ui.css .routine-linked-goal-badge 스타일');

console.log('[TEST PASS] routine-detail-modal - All assertions passed successfully! ✨');
