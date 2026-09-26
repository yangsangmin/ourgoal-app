# 실행계획서 (PLAN) — 피드 게시 모달 내 '미리보기' 버튼 추가 및 피드 렌더링 사전 확인 기능 구현

> **문서 ID**: PLAN-TASK-ES-301-FEED-POST-PREVIEW-MODAL  
> **티켓 연계**: #TASK-ES-301  
> **작성 일시**: 2026-09-26  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수

---

## 1. 개요 및 목적
- **목적**: 노션 생각 메모장 DB [51]번 지시사항에 따라, 피드 게시 모달에서 사용자가 글을 작성할 때 '미리보기' 버튼(`#sharePreviewBtn`)을 통해 실제 피드 카드 형태의 프리뷰(`#sharePreviewSlot`)를 사전에 확인하고 안심하고 공유할 수 있도록 완결한다.
- **적용 대상**: `index.html`, `js/components.js`, `ui.css`, `tests/feed-post-preview-modal.test.js`, `scripts/smoke-test.js`

---

## 2. 세부 실행 계획

### Step 1: `index.html` 수정
1. 홈 화면 기능 카드 영역에 `#og-task-51-container` 및 `#og-task-51-action-btn` 마운트.
2. 피드 작성/공유 모달 내 `#sharePreviewBtn` 및 `#sharePreviewSlot` 배선 확인 및 보강:
   - 미리보기 버튼 클릭 시 작성 중인 텍스트와 사진, 아바타 정보를 취합하여 실제 피드 카드 HTML을 렌더링.
   - 이미 슬롯이 보이고 있다면 부드럽게 토글되도록 처리.
3. `smoke-test.js` line 6723-6724의 단언문(`id="sharePreviewBtn"`, `id="sharePreviewSlot"`) 무손실 보존.

### Step 2: `js/components.js` 4위 1체 배선
1. `handle소통_Item51Action(event)` (및 `handle팀목표_Item51Action`) 작성:
   - 12ms 햅틱 진동 피드백 (`navigator.vibrate(12)`).
   - `og_task-51_cache` 로컬 캐시 원자적 갱신 및 Supabase `user_interactions` 동기화.
   - 시각 토스트 피드백 ('피드 게시 모달 내 미리보기 버튼 및 사전 확인 기능이 완벽히 동기화되었습니다.').
   - 헌법 제15조 제6항 4대 뷰 원자적 동시 전파.
2. `openFeedPostPreviewModal`, `toggleFeedPostPreview` 헬퍼 함수 정의 및 export.

### Step 3: `ui.css` 스타일 및 모바일 반응형
1. `#og-task-51-container`, `#og-task-51-action-btn` 스타일 추가.
2. `#sharePreviewSlot` 스타일 (배경, 카드 보더, 실시간 렌더링 핏) 추가.
3. 최소 44px 터치 규격 및 375px 반응형 최적화.

### Step 4: 검증 테스트 및 스모크 테스트 연동
1. `tests/feed-post-preview-modal.test.js` 작성 및 통과 확인.
2. `scripts/smoke-test.js`에 `TASK-ES-301` 단언문 추가 및 419개 전수 통과 확인.

### Step 5: Court 주장 파일 작성 및 GitHub 심사
1. `reports/TASK-ES-301/claims.json` 작성.
2. 커밋 및 `npm run court:quick -- --head HEAD` 예비 점검.
3. 원격 푸시 및 PR 생성 후 GitHub Court 판정 확인.
4. Squash 머지 후 TICKETS.md 완료 갱신 PR 머지, 노션 상태 완료, 저널 기록, Tri-Sync 무결성 검증.
