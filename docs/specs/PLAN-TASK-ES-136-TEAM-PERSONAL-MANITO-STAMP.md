# 엔지니어링 작업계획서 (PLAN) — 팀 연계 개인목표 생성 의도 직통화 및 마니또 원클릭 웰컴 스탬프 & 실시간 피드백 배선

> **문서 ID**: PLAN-TASK-ES-136-TEAM-PERSONAL-MANITO-STAMP  
> **요구사항 연계**: [REQ-TASK-ES-136-TEAM-PERSONAL-MANITO-STAMP](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-136-TEAM-PERSONAL-MANITO-STAMP.md)  
> **티켓 연계**: #TASK-ES-136  
> **작성 일시**: 2026-10-02  
> **작성자**: Antigravity Core Engine  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**: 팀 목표 탭 상단 및 팀 카드에 44px 규격의 `[💡 팀 연계 개인목표 만들기]` 직통 액션 칩 신설, 생성 및 마일스톤 완수 시 개인 경험치(+EXP) 동시 획득 연출, 가상 샘플 그룹 `[예시 팀]` 뱃지 전면화, 마니또 원클릭 웰컴 스탬프 44px 및 피드백 배선 완결.
- **영향 받는 파일 목록 전수**:
  - `index.html`: 팀 목표 상단 퀵 액션 바, 예시 팀 뱃지, 44px 버튼 클래스, EXP 보상 배선
  - `ui.css`: `.team-quick-action-bar`, `.team-personal-goal-quick-btn`, `.team-personal-goal-pill-btn`, `.badge-mock-team`
  - `docs/rules/TICKETS.md`: 티켓 상태 등록 (#TASK-ES-136 승인)
  - `dev_log.md`: 개발 일지 기록

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: 팀 공동 활동을 개인의 구체적인 일일 실천 로드맵으로 1초 만에 전환하고, 마니또 익명 친구와의 첫 유대감을 원클릭으로 형성하는 동류 소통(E3) 인터랙션 아키텍처.
- **[원인] (Technical Causes)**: 버튼 크기가 24px 미만으로 작고 카드 우측 끝에 묻혀 있어 클릭 접근성이 낮았으며, 샘플 그룹에 명시적 라벨이 없어 실 유저 팀과의 구분이 모호했던 구조적 결함.
- **[중심 배선] (Core Wire & State)**:
  - `state.profile.goals`: 팀 연계 개인목표 unshift 및 `teamLinkId`, `teamLinkName` 필드 보존.
  - `state.profile.settings.xp`: `awardXP(15, ...)`를 통한 개인 레벨 및 경험치 실시간 반영.
- **[핵심 안전장치] (Critical Safety & Persistence)**: 로컬 2중 스토리지 동기화, `saveProfile()` 비동기 저장, 모바일 390px 뷰포트 오버플로우 방화벽.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[팀 화면 퀵 액션 칩 터치] -> [openTeamLinkedPersonalGoalModal 오픈] -> [제목/카테고리 설정] -> [로컬 State 생성 + awardXP(15)] -> [saveProfile() 영속화] -> [4대 연계 뷰 전파 리렌더링] -> [축하 컨페티 및 토스트]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `index.html` | 퀵 액션 바 마크업 및 핸들러 배선, EXP 연동 | +45줄 | -4줄 | +41줄 | 외과수술적 diff |
| `ui.css` | 44px 버튼 및 예시 뱃지 스타일 정의 | +45줄 | 0줄 | +45줄 | CSS 토큰 준수 |
| `docs/rules/TICKETS.md` | 티켓 상태 등록 | +2줄 | -1줄 | +1줄 | 규범 문서 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**: `#btnQuickCreateTeamLinkedGoal`, `.team-personal-goal-pill-btn`, `.badge-mock-team`
2. **이벤트 리스너 (Listener)**: 클릭 시 `openTeamLinkedPersonalGoalModal` 호출, 12ms 햅틱 반응
3. **비즈니스 로직 (Logic)**: `awardXP(15, ...)`, `burstConfetti`, `saveProfile()`
4. **피드백 & 예외처리 (Feedback)**: 토스트 알림, 컨페티 버스트, 뷰포트 너비 유지

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 HTML 디자인, CSS 스타일, 레이아웃을 임의로 변경하지 않고 완벽히 계승했는가? (계승 완료)
- [x] 전체 파일 덮어쓰기 없이 변경 부분만 외과수술적 diff로 작성하도록 설계되었는가? (외과수술적 적용)
- [x] 기존 사용자의 아바타(보관함 포함), 목표, 기록, 세팅값이 100% 무손실 보존되는가? (보존 검증)
- [x] 성능 저하(불필요한 전체 리렌더링)나 다중 탭 동시성 충돌을 유발하지 않는가? (원자적 전파)

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1 (UI 컴포넌트 마크업 & 스타일)**: `ui.css`에 `.team-quick-action-bar`, `.team-personal-goal-quick-btn`, `.team-personal-goal-pill-btn`, `.badge-mock-team` 정의.
2. **Step 2 (팀 화면 직통 액션 칩 신설)**: `index.html` 내 `renderTeamGoalsScreen` 및 `renderTeamGoalsEmptyGuideHtml`에 마크업 삽입.
3. **Step 3 (이벤트 리스너 및 EXP 보상 배선)**: `#btnQuickCreateTeamLinkedGoal` 및 `openTeamLinkedPersonalGoalModal`에 `awardXP(15, ...)` 연결.
4. **Step 4 (가상 샘플 그룹 뱃지 안착)**: `isMockTeam` 조건으로 `.badge-mock-team` 노출.
5. **Step 5 (4대 뷰 실시간 동시 전파)**: 목표 생성 후 `renderGoalsScreen()`, `renderHome()` 원자적 동기화.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
> *(주의: 본 원칙은 구현 순서(⑤)와 체크리스트(⑦) 사이에 반드시 독립적으로 존재해야 하며, 생략하거나 합치는 것은 위헌입니다)*
- **시나리오 A (Zero Dead-Click)**: 신규 버튼(`#btnQuickCreateTeamLinkedGoal`, `.team-personal-goal-pill-btn`, `.manito-welcome-stamp-btn`) 전수 클릭 시뮬레이션 -> 콘솔 에러 0건 확인.
- **시나리오 B (Zero Data Loss)**: 10종 가상 페르소나 데이터 주입 후 업데이트 시뮬레이션 -> 100% 무손실 딥이퀄 대조.
- **시나리오 C (Zero UX Regression)**: 게스트 모드, 소셜 로그인 세션 유지, 핵심 루프(E1/E2/E3) 손상 여부 확인.
- **시나리오 D (Full State Propagation)**: 팀 연계 개인목표 생성 시 목표 탭 목록 및 홈 콕핏 동시 갱신 확인.
- **시나리오 E (자동화 게이트 통과)**: `scripts/smoke-test.js` 및 `verify-integrity-gate.js` 100% ALL PASS 설계.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [x] Step 1~5 순차적 구현 (완전한 실행 코드 작성 완료)
- [ ] 로컬 무결성 게이트 검증: `node scripts/verify-integrity-gate.js` PASS
- [ ] 전수 클릭 검증: `node scripts/verify-all-clicks.js` PASS
- [ ] 스모크 테스트 전수 검증: `npm test` PASS
- [ ] [4단계: 초안 PR + GitHub 법정 판정서 청구] 완결 후 상민님 지시에 따라 병합

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**: 모바일 390px 뷰포트에서 상단 퀵 바 가로 너비 초과 가능성.
- **사전 방어 및 우회 로직**: `box-sizing: border-box`, `min-width: 0`, `flex-wrap: wrap` 방어 적용.
- **롤백 계획 (Rollback Strategy)**: 문제 발생 시 `git checkout main -- index.html ui.css`로 무손실 즉각 원복.
- **재검증 트리거**: CDP 실측에서 터치 타깃 <44px 검출 시 ui.css로 돌아가 min-height 재검토.
