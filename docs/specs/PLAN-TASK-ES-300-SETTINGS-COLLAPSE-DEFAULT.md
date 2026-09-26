# 실행계획서 (PLAN) — 설정창 진입 시 모든 설정 섹션 기본 접힘(Collapsed) 상태 적용

> **문서 ID**: PLAN-TASK-ES-300-SETTINGS-COLLAPSE-DEFAULT  
> **티켓 연계**: #TASK-ES-300  
> **작성 일시**: 2026-09-26  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수

---

## 1. 개요 및 목적
- **목적**: 노션 생각 메모장 DB [50]번 지시사항에 따라, 사용자가 설정 화면에 진입했을 때 모든 설정 아코디언이 깔끔하게 접힌(Collapsed) 상태로 시작되도록 구현하여 정보 과부하를 해소하고 쾌적한 UX를 완성한다.
- **적용 대상**: `index.html`, `js/components.js`, `ui.css`, `tests/settings-collapse-default.test.js`, `scripts/smoke-test.js`

---

## 2. 세부 실행 계획

### Step 1: `index.html` 수정
1. 홈 화면 기능 카드 영역에 `#og-task-50-container` 및 `#og-task-50-action-btn` 마운트.
2. 설정창 렌더링 시 아코디언(`<details class="settings-group-accordion">` 및 `.toss-settings-group details`) 기본 접힘 보장.
3. `smoke-test.js` line 6720에 명시된 `!indexHtml.includes('<details class="settings-group-accordion" open>')` 단언문 엄격 준수.

### Step 2: `js/components.js` 4위 1체 배선
1. `handle전체공통_Item50Action(event)` 작성:
   - 12ms 햅틱 진동 피드백 (`navigator.vibrate(12)`).
   - `og_task-50_cache` 로컬 캐시 원자적 갱신 및 Supabase `user_interactions` 동기화.
   - 시각 토스트 피드백 ('설정창 진입 시 모든 설정 섹션 기본 접힘(Collapsed) 상태 적용 처리가 완료되었습니다.').
   - 헌법 제15조 제6항 4대 뷰 원자적 동시 전파.
2. `collapseAllSettingsSections`, `toggleSettingsSectionCollapse` 헬퍼 함수 정의 및 export.

### Step 3: `ui.css` 스타일 및 모바일 반응형
1. `#og-task-50-container`, `#og-task-50-action-btn` 스타일 추가.
2. 최소 44px 터치 규격 및 375px 반응형 최적화.

### Step 4: 검증 테스트 및 스모크 테스트 연동
1. `tests/settings-collapse-default.test.js` 작성 및 통과 확인.
2. `scripts/smoke-test.js`에 `TASK-ES-300` 단언문 추가 및 418개 전수 통과 확인.

### Step 5: Court 주장 파일 작성 및 GitHub 심사
1. `reports/TASK-ES-300/claims.json` 작성.
2. 커밋 및 `npm run court:quick -- --head HEAD` 예비 점검.
3. 원격 푸시 및 PR 생성 후 GitHub Court 판정 확인.
4. Squash 머지 후 TICKETS.md 완료 갱신 PR 머지, 노션 상태 완료, 저널 기록, Tri-Sync 무결성 검증.
