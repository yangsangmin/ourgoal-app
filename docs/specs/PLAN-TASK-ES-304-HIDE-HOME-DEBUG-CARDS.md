# 작업계획서 (PLAN) — 홈화면 상단 누적 배선용 테스트 카드(og-task-*) 23종 일괄 화면 은폐 및 홈화면 본래 기능 최상단 복원

> **문서 ID**: PLAN-TASK-ES-304-HIDE-HOME-DEBUG-CARDS  
> **티켓 연계**: #TASK-ES-304  
> **지시 출처**: 상민님 직접 지시 ("숨겨")  
> **작성 일시**: 2026-09-27  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수

---

## 1. 개요 및 목적

본 계획서는 상민님의 즉각 지시("숨겨")에 따라, 최근 단위기능 구현 과정에서 홈화면 상단에 누적 배치된 23종의 `og-task-*` 검증/배선용 카드를 완전히 시각적으로 은폐하고, 아바타·잔디 히트맵·3초 체크인·오늘의 퀘스트 등 홈화면 본래의 핵심 기능을 최상단으로 복원하는 것을 목적으로 합니다.

---

## 2. 작업 단계별 세부 계획

### 단계 1: `index.html` 은폐 래핑
- 홈화면 `screen-home` 내 line 171 ~ 612에 위치한 23종 카드 섹션을 `<div id="ogTaskWireSlot" style="display:none;" aria-hidden="true">`로 감싸 시각적 노출을 원천 차단함.
- 23종 컨테이너 및 내부 버튼, `onclick` 핸들러 마크업을 그대로 보존하여 기존 스모크 테스트 및 자동화 검증 100% 호환.

### 단계 2: `ui.css` 은폐 규칙 탑재
- `.og-feature-card, .og-avatar-welcome-card, .og-home-layout-card, .og-avatar-enlarge-card, .og-quest-task-card, #ogTaskWireSlot { display: none !important; }`를 추가하여 스타일 레벨에서도 2중으로 화면 비침범 보장.
- 기존 단위 테스트 단언문 대상 문자열(`uiCss.includes('#og-task-XX-container')`) 일체 보존.

### 단계 3: 테스트 작성 및 전수 스모크 테스트 검증
- `tests/hide-home-debug-cards.test.js` 작성: `#ogTaskWireSlot` 은폐 속성 및 23종 카드 보존 검증.
- `scripts/smoke-test.js`에 `TASK-ES-304` 검증 블록 추가 및 전체 422개 스모크 테스트 실행 (0개 실패 확인).

### 단계 4: Court 주장 파일 작성 및 GitHub PR 심사
- `reports/TASK-ES-304/claims.json` 작성.
- 커밋, 푸시, PR 생성 및 GitHub Actions 법정 심사 통과 확인.
- PR squash 머지.

### 단계 5: TICKETS.md 완료 갱신 머지 및 원장 동기화
- `TICKETS.md` 완료 갱신 PR 생성 및 머지.
- 관제센터 저널에 `task_done` 기록.
- `node C:/dev/command-center/lib/tri-sync.js check` 무결성 100% 검증.
