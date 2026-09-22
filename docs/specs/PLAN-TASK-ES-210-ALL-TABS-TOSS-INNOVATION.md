# 엔지니어링 작업계획서 (PLAN) — 아워골 전 6대 탭 토스(Toss)식 UI/UX 전면 혁신 종합 팩

> **문서 ID**: PLAN-TASK-ES-210-ALL-TABS-TOSS-INNOVATION  
> **요구사항 연계**: [REQ-TASK-ES-210-ALL-TABS-TOSS-INNOVATION](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/specs/REQ-TASK-ES-210-ALL-TABS-TOSS-INNOVATION.md)  
> **티켓 연계**: #TASK-ES-210  
> **작성 일시**: 2026-09-22  
> **작성자**: Antigravity (Toss Head of UI/UX Pair)  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**: 아워골 전 6대 탭(`screen-home`, `screen-goals`, `screen-calendar`, `screen-records`, `screen-comm`, `screen-settings`)에 대해 토스(Toss)식 문장형 헤드라인, 1화면 1목적 원카드 구조, 단일 퀘스트 보드 일체화, 12ms 미세 햅틱 피드백을 적용하여 시각적 인지 부하를 해소하고 최상의 모바일 인터랙션을 실현한다.
- **영향 받는 파일 목록 전수**:
  - `docs/rules/TICKETS.md`: 티켓 상태 갱신
  - `docs/specs/REQ-TASK-ES-210-ALL-TABS-TOSS-INNOVATION.md`: 요구사항 정의서
  - `docs/specs/PLAN-TASK-ES-210-ALL-TABS-TOSS-INNOVATION.md`: 엔지니어링 작업계획서
  - `reports/TASK-ES-210/claims.json`: GitHub 법정 검증 청구서
  - `ui.css`: 토스 디자인 시스템 토큰(헤드라인, 1카드, 단일 퀘스트 보드, 둥근 그룹핑) 스타일 추가
  - `index.html`: 6대 탭 상단 문장형 헤드라인 도입 및 퀘스트 보드 시맨틱 래핑, 햅틱 연동 배선
  - `dev_log.md`: 작업 로그 기록

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**:
  - 6대 탭의 뷰 컨테이너와 데이터 모델의 무결성을 100% 유지하면서, 렌더링 계층의 프레젠테이션을 토스식 단순성(Simplicity)과 직관성(Affordance)으로 재정의하는 것.
- **[원인] (Technical Causes)**:
  - 기존 탭들이 개발 과정에서 신규 기능(배너, 모드, 통계)이 덧붙여지면서 수직으로 적층되어 인지 부하가 가중됨.
- **[중심 배선] (Core Wire & State)**:
  - 목표/마일스톤 토글 핸들러: `toggleMilestoneComplete` 및 `toggleTaskComplete`
  - 체크인 완료 핸들러: `saveCheckin` -> `dispatchFullViewPropagation()`
  - 햅틱 피드백 배선: `triggerHapticFeedback(12)`
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - 38대 헌법 정적 방화벽 셀렉터(`#commBody`, `#personalGoalsView`, `#btnPersonalAddGoalInline` 등) 불변 보존.
  - 767개 정적 버튼의 이벤트 핸들러 100% 유지(Zero Dead Click).
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[유저 탭/클릭] -> [미세 햅틱 진동(12ms)] -> [Local State 갱신] -> [Supabase DB 원격 저장] -> [dispatchFullViewPropagation 4대 뷰 동시 전파] -> [토스식 문장형 헤드라인 & 원카드 실시간 갱신]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `ui.css` | 토스 디자인 시스템 클래스 및 6대 탭 스타일링 | +120줄 | 0줄 | +120줄 | CSS 토큰 준수 |
| `index.html` | 6대 탭 헤드라인 마크업 & 햅틱 배선 | +60줄 | -10줄 | +50줄 | 외과수술적 diff |
| `docs/specs/` | REQ / PLAN 2중 8원칙 명세 | +400줄 | 0줄 | +400줄 | 정본 스펙 |
| `reports/TASK-ES-210/claims.json` | 법정 검증 청구서 | +90줄 | 0줄 | +90줄 | 검증 명세 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**: 고유 ID 및 접근성 시맨틱 태그 유지 (`.toss-headline`, `.toss-card`, `.toss-quest-board`).
2. **이벤트 리스너 (Listener)**: 모든 인터랙션 요소에 핸들러 직결.
3. **비즈니스 로직 (Logic)**: `triggerHapticFeedback`, 기존 목표/체크인/소통 로직 100% 가동.
4. **피드백 & 예외처리 (Feedback)**: 햅틱 진동 및 토스트 안내, `navigator.vibrate` 미지원 환경 에러 없는 폴백.

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 HTML 디자인, CSS 스타일, 레이아웃을 파괴하지 않고 래퍼 및 토스 스타일 토큰으로 계승했는가?
- [x] 전체 파일 덮어쓰기 없이 외과수술적 diff로 작성하도록 설계되었는가?
- [x] 기존 사용자의 320종 아바타, 목표, 기록, 세팅값이 100% 무손실 보존되는가?
- [x] 38대 무결성 게이트 및 767개 정적 버튼 dead-click 린터를 100% 통과하도록 검증되었는가?

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1 (스펙 및 법정 청구서 완비)**:
   - `docs/specs/REQ-TASK-ES-210-ALL-TABS-TOSS-INNOVATION.md`
   - `docs/specs/PLAN-TASK-ES-210-ALL-TABS-TOSS-INNOVATION.md`
   - `reports/TASK-ES-210/claims.json`
2. **Step 2 (ui.css 토스 디자인 시스템 토큰 배선)**:
   - `.toss-headline`: 대화체 문장형 볼드 헤드라인 (20px~22px, font-weight 700)
   - `.toss-card`: 둥근 1카드 컨테이너 (border-radius 18px, 모던 섀도우)
   - `.toss-quest-board`: 산악 트레일과 마일스톤이 결합된 원카드 보드
   - `.toss-settings-group`: 토스 스타일 그룹핑 카드 및 `.toss-settings-row` 셰브론 레이아웃
3. **Step 3 (index.html 햅틱 피드백 유틸 함수 배선)**:
   - `function triggerHapticFeedback(ms = 12)` 선언 및 전역 배선
   - 체크인 저장, 마일스톤 토글, 퀘스트 완료 지점에 햅틱 호출 바인딩
4. **Step 4 (index.html 6대 탭 토스식 마크업 리팩토링)**:
   - 목표 탭: 문장형 헤드라인 `#goalsHeadlineSentence` 및 단일 퀘스트 보드 구조
   - 홈 탭: 문장형 헤드라인 및 투데이 퀘스트 원카드
   - 캘린더 탭: 날짜 선택 연계 타임라인 카드
   - 기록 탭: 주간 몰입 문장형 헤드라인
   - 소통 탭: 라이브 피드 강조
   - 설정 탭: 둥근 카드 그루핑 셰브론 행 구조
5. **Step 5 (로컬 기계적 무결성 검증)**:
   - `node scripts/verify-integrity-gate.js` (38개 게이트)
   - `npm test` (335개 테스트 전수 통과)

---

## 6. [원칙 ⑥] 절차 재검증: 법정 주장(claims) 설계
- **청구 항목 설계 (Court Claims)**:
  - R1: 전 6대 탭에 토스식 문장형 헤드라인 스타일(`.toss-headline`)이 정의되고 배치되어야 한다.
  - R2: 목표 탭에 마운틴 트레일과 마일스톤이 조화된 단일 퀘스트 보드(`.toss-quest-board`) 구조가 구현되어야 한다.
  - R3: 모바일 인터랙션 강화를 위한 미세 햅틱 피드백(`triggerHapticFeedback`) 함수가 정의되고 배선되어야 한다.
  - R4: 설정 탭에 토스 스타일의 둥근 그룹핑 카드(`.toss-settings-group`)와 셰브론 행 구조가 배선되어야 한다.
  - R5: 기존 38대 무결성 게이트 및 767개 정적 버튼 Dead-Click 검사가 100% ALL PASS를 유지해야 한다.
- **재검증 결과**:
  - 기존 셀렉터와 이벤트 리스너를 건드리지 않고 순수 CSS 및 가벼운 래퍼 추가로 100% 안전하게 달성 가능함을 확인함.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트
- [x] 1. REQ/PLAN 8원칙 린터 통과 확인 (`node scripts/verify-integrity-gate.js`)
- [x] 2. `reports/TASK-ES-210/claims.json` 작성
- [x] 3. `ui.css` 토스 스타일 토큰 작성
- [x] 4. `index.html` 햅틱 피드백 및 6대 탭 문장형 헤드라인/원카드 배선
- [x] 5. `npm test` 전수 검증 통과 (335/335)
- [x] 6. `dev_log.md` 갱신
- [ ] 7. Git commit, push, PR 생성 및 GitHub Court 검증 확인

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **엔지니어링 잠재 오류**:
  - `index.html` 내 스크립트 수정 시 문법 오류 또는 전역 변수 충돌 가능성.
- **우회 로직 및 롤백 대책**:
  - `triggerHapticFeedback`은 `window` 객체에 안전하게 등록하며, `try-catch` 및 `navigator.vibrate` 존재 검사를 통해 절대 크래시가 나지 않도록 방어.
  - 문제 발생 시 `git checkout`으로 작업 이전 상태로 즉각 무손실 복구 가능.
