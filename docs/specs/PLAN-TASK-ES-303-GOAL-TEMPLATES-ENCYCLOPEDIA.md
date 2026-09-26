# 작업계획서 (PLAN) — 목표탭 '템플릿백과사전' 전체화면 팝업(실사용 유저 템플릿 사전 복사 & 아워골 AI 템플릿) 신설 및 상호작용 구현

> **문서 ID**: PLAN-TASK-ES-303-GOAL-TEMPLATES-ENCYCLOPEDIA  
> **티켓 연계**: #TASK-ES-303  
> **지시 출처**: 노션 생각 메모장 DB [53]번  
> **작성 일시**: 2026-09-26  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수

---

## 1. 개요 및 목적

본 계획서는 상민님의 노션 생각 메모장 DB [53]번 지시사항에 따라, 목표 탭 내 '나만 보기' 배지 우측 빈공간에 '템플릿백과사전' 버튼을 배치하고, 클릭 시 전체화면 팝업창을 띄워 '실사용 템플릿 사전'과 '아워골 AI 템플릿' 60선을 제공하며, 실사용 유저 템플릿 복사 및 상호작용 시스템을 완전 구축하는 것을 목적으로 합니다.

---

## 2. 작업 단계별 세부 계획

### 단계 1: UI 마크업 및 배치 수정 (`index.html`)
1. 목표 탭 헤더 `#goalsPrivacyBadge` 바로 우측에 `#btnGoalTemplateEncyclopedia`를 상시 노출하도록 마크업 조정 (`display:none` 제거 및 가시 스타일 부여).
2. 전체화면 팝업 모달 `#templateEncyclopediaModal`:
   - 전체화면 스타일링 클래스 및 모바일 대응.
   - 닫기 버튼(`#btnTplEncyclopediaClose`), 배경 클릭 및 ESC 키 바인딩 확인.
   - 2대 탭 세그먼트: '👥 실사용 템플릿 사전' (`#tabTplRealUser`) / '🤖 아워골 AI 템플릿' (`#tabTplOurgoalAi`).
   - 실사용 템플릿 목록 렌더링, 템플릿 복제(`copyRealUserTemplate`), 응원하기(`cheerRealUserTemplate`), 내 템플릿 공유 등록 인터페이스 연동.
   - 아워골 AI 템플릿 60선 테마별 카테고리 칩 및 즉시 시작/둘러보기 기능 배선.
3. 홈 화면 내 `#og-task-53-container` 및 `#og-task-53-action-btn` 4위 1체 요소 마운트.

### 단계 2: 자바스크립트 컴포넌트 구현 (`js/components.js`, `index.html`)
1. `handle목표탭_Item53Action(event)`:
   - 12ms 햅틱 진동 피드백.
   - `og_task-53_cache` 영속화 및 Supabase `user_interactions` 동기화.
   - 헌법 제15조 제6항 4대 뷰 원자적 전파.
   - `openGoalTemplateEncyclopediaModal()` 연동.
2. `window.openGoalTemplateEncyclopediaModal`, `window.closeTemplateEncyclopediaModal`, `window.copyUserGoalTemplate` 전역 노출.

### 단계 3: 스타일 시트 반영 (`ui.css`)
1. `#og-task-53-container`, `#og-task-53-action-btn`, `#btnGoalTemplateEncyclopedia` 스타일 추가.
2. `#templateEncyclopediaModal`의 전체화면 팝업 반응형 스타일 및 44px 터치 타겟 보장.
3. 375px 모바일 뷰포트 가로 스크롤 방어 (`overflow-x: hidden`).

### 단계 4: 검증 및 회귀 방지
1. 단위 테스트 `tests/goal-templates-encyclopedia.test.js` 작성 및 통과 검증.
2. `scripts/smoke-test.js`에 `TASK-ES-303` 검증 블록 추가 및 전체 421개 스모크 테스트 통과 확인.
3. `reports/TASK-ES-303/claims.json` 작성.
4. Court 퀵 검사 (`npm run court:quick -- --head HEAD`) 확인.

### 단계 5: 원격 푸시, GitHub Actions 법정 심사 및 머지
1. 브랜치 푸시 및 PR 생성.
2. `gh pr checks <PR번호> --watch` 및 `node court/chat.js <PR번호>` 법정 판정서 확인.
3. PR squash 머지.
4. `TICKETS.md` 완료 갱신 PR 생성 및 머지.
5. 노션 상태 `완료` 업데이트 및 관제센터 journal `task_done` 기록.
6. `node C:/dev/command-center/lib/tri-sync.js check` 무결성 검증.
