# [구현 계획서] #TASK-ES-305: [54] 루틴 상세 모달 및 편집 기능 구현 (목표탭 벤치마킹 & 루틴 카드 클릭 시 바로 진입)

## 1. 구현 개요
상민님의 원문 지시에 따라 루틴 상세 모달을 목표탭 편집창 양식으로 벤치마킹하여 고도화하고, 루틴 카드를 누르면 즉시 상세 확인 및 수정이 가능한 무마찰 사용자 여정을 완성한다.

## 2. 변경 대상 파일 및 상세 내용
1. `index.html`:
   - `openRoutineDetailModal(routineId)` 함수 내 모달 템플릿 전면 고도화:
     - 카테고리 선택 칩 (`#detailRtCategoryPicker`: 운동·건강, 학습·성장, 커리어, 마음챙김, 생활습관 등)
     - 상위 연결 목표 드롭다운 (`#inDetailRtGoalId`: 현재 활성화된 개인 목표 목록 연계)
     - 루틴명, 알림 시간, 요일 선택 칩, 실천 팁 메모, 알림 토글
     - 루틴 삭제, 취소, 저장하기 직통 바인딩
   - 루틴 카드 본문 클릭 시 `openRoutineDetailModal(rId)` 직통 호출 핸들러 보존 및 강화.
2. `ui.css`:
   - `.routine-detail-modal-box`, `.routine-cat-chip`, `.routine-goal-select` 등 375px 모바일 반응형 스타일 추가.
3. `tests/routine-detail-modal.test.js`:
   - 전용 단독 검증 스크립트 작성 및 통과 확인.
4. `scripts/smoke-test.js`:
   - `TASK-ES-305` 검증 블록 추가 및 총 423개 테스트 통과 확인.
5. `reports/TASK-ES-305/claims.json`:
   - R1~R4에 대한 Court 심사용 claims 정의.

## 3. 검증 전략
- `node tests/routine-detail-modal.test.js` PASS
- `node scripts/smoke-test.js` 423개 전수 PASS
- GitHub Actions Court 심사 합격 및 squash 머지.
