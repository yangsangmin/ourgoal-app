# 엔지니어링 작업계획서 (PLAN) — 목표탭 상단 독립 루틴 탭 구축 및 요일별 반복·교대근무 가변 스케줄러 완결

> **문서 ID**: PLAN-TASK-ES-270-ROUTINE-TAB-SCHEDULER  
> **요구사항 연계**: [REQ-TASK-ES-270-ROUTINE-TAB-SCHEDULER](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-270-ROUTINE-TAB-SCHEDULER.md)  
> **티켓 연계**: #TASK-ES-270 (노션 생각 메모장 [27]번, Page ID: `3de598db-9096-8156-a2f0-f9ea3bec968c`)  
> **작성 일시**: 2026-09-25  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**:
  - 목표 탭 상단 서브탭(`subtabsList`)에서 `['routine', '루틴']`을 `['personal', '개인']`의 왼쪽(첫 번째 자리)에 배치.
  - `#routineGoalsView` 상단에 요일별 칩 필터 바(`#routineDayFilterBar`: `[오늘]`, `[월]`, `[화]`, `[수]`, `[목]`, `[금]`, `[토]`, `[일]`, `[전체]`) 신설 및 실시간 루틴 필터링.
  - 교대근무 4종 캡슐 버튼(`btnShiftDay`, `btnShiftNight`, `btnShiftDuty`, `btnShiftOff`) 클릭 시 `applyShiftWorkRoutines(mode, true)` 1초 교체 적용 배선 (개인 루틴 100% 무손실 보존).
  - 당일 루틴 전수 완주 시 `awardXP(10, ...)` 지급 피드백 유지.
- **영향 받는 파일 목록 전수**:
  - `index.html`: 목표 서브탭 순서 정합화, 요일별 칩 필터 바 마크업 및 동적 렌더링, 교대 캡슐 버튼 1초 교체 배선.
  - `ui.css`: `.routine-day-chip` 스타일, 모바일 375px 가로 스크롤 및 44px 터치 영역 스타일링.
  - `tests/routine-tab-scheduler.test.js`: 신규 단위 테스트 (조용한 assert 위주).
  - `scripts/smoke-test.js`: `#TASK-ES-270` 무결성 단언 추가.
  - `reports/TASK-ES-270/claims.json`: 법정 청구서 (주석 배제).

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**:
  - 데일리 루틴과 교대근무 스케줄을 목표 탭의 첫 자리에서 한눈에 관리하고 요일별 반복·시간 알림·완주 보상(+10 EXP)을 제공하는 가변형 일상 스케줄러 시스템.
- **[원인] (Technical Causes)**:
  - `renderGoalsScreen` 내 `subtabsList`에서 `personal`이 먼저 정의되어 있었고, 요일별 칩 필터 바가 부재했으며, 교대 캡슐 버튼에 `applyShiftWorkRoutines(mode, true)`가 직결되지 않았음.
- **[중심 배선] (Core Wire & State)**:
  - `state.routineFilterDay`: 요일 필터 상태 (`'today'`, `1~7`, `'all'`).
  - `#routineDayFilterBar`: 요일 칩 클릭 시 `state.routineFilterDay` 업데이트 및 `renderRoutineGoalsScreen()` 재호출.
  - `#btnShiftDay`, `#btnShiftNight`, `#btnShiftDuty`, `#btnShiftOff`: 클릭 시 `await applyShiftWorkRoutines(mode, true)`.
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - 교대 루틴 치환 시 개인 고유 루틴(`isShiftRoutine !== true`) 100% 무손실 보존.
  - 당일 루틴 완주 시 `routineLastExpAwardDate === todayKey` 검사를 통한 일일 1회 한정 중복 지급 방지.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[목표 탭 진입] -> ['루틴' 첫번째 탭 클릭] -> [요일별 칩 선택] -> [해당 요일 루틴 필터링] -> [체크박스 클릭] -> [당일 완주 판정] -> [EXP 10 및 영속화]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `index.html` | 서브탭 순서 정돈, 요일 칩 바 마크업 및 필터링, 교대 버튼 1초 교체 배선 | +45줄 | -10줄 | +35줄 | 외과수술적 diff |
| `ui.css` | `.routine-day-chip` 및 가로 스크롤 반응형 스타일 | +20줄 | 0줄 | +20줄 | CSS 컴포넌트 |
| `tests/routine-tab-scheduler.test.js` | 신규 단위 테스트 | +60줄 | 0줄 | +60줄 | 단위 테스트 |
| `scripts/smoke-test.js` | 스모크 테스트 단언 | +15줄 | 0줄 | +15줄 | 무결성 단언 |
| `reports/TASK-ES-270/claims.json` | 법정 청구서 | +90줄 | 0줄 | +90줄 | 법정 규격 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**: `#routineDayFilterBar`, `.routine-day-chip[data-day]`, `#btnShiftDay` 등
2. **이벤트 리스너 (Listener)**: 요일 칩 클릭 시 필터 전환, 교대 캡슐 버튼 클릭 시 `applyShiftWorkRoutines` 호출
3. **비즈니스 로직 (Logic)**: `state.routineFilterDay`에 따른 루틴 목록 동적 필터링 및 교대근무 비파괴 치환
4. **피드백 & 예외처리 (Feedback)**: 12ms 햅틱, active 칩 시각 강조, EXP 획득 토스트 및 축하 콘페티

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 목표 탭 내 다른 서브탭(`personal`, `teamLinked`, `team`, `templateEncyclopedia`)의 기능과 뷰 라우팅이 100% 무손실 보존되는가?
- [x] 사용자가 설정한 개인 루틴이 교대근무 모드 변경 시 보존되는가?
- [x] 387개 기존 스모크 단언과 38개 헌법 게이트가 100% 통과하는가?

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1**: `index.html` 내 `subtabsList` 순서를 `['routine', '루틴']`을 첫 번째(개인 왼쪽)로 변경.
2. **Step 2**: `index.html` 내 `renderRoutineGoalsScreen`에 `state.routineFilterDay` 상태 도입 및 `#routineDayFilterBar` 렌더링/이벤트 바인딩 구현.
3. **Step 3**: `index.html` 내 교대근무 4종 캡슐 버튼에 `await applyShiftWorkRoutines(mode, true)` 배선.
4. **Step 4**: `ui.css`에 `.routine-day-bar`, `.routine-day-chip` 모바일 375px 대응 스타일 추가.
5. **Step 5**: 단위 테스트 `tests/routine-tab-scheduler.test.js` 작성 및 로컬 검증.
6. **Step 6**: `scripts/smoke-test.js`에 `#TASK-ES-270` 단언 추가 및 전체 스모크/게이트 검증.
7. **Step 7**: 법정 청구서 `reports/TASK-ES-270/claims.json` 작성.
8. **Step 8**: Git 커밋, 푸시, PR 생성 및 GitHub Court 심사 통과 후 머지.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
- **시나리오 A (Zero Dead-Click)**: `#routineDayFilterBar` 내 9개 칩 전수 클릭 시 필터링 즉시 작동 및 콘솔 에러 0건.
- **시나리오 B (Zero Data Loss)**: 교대근무 모드 주간->야간->휴무 전환 시 개인 등록 루틴 100% 보존 확인.
- **시나리오 C (Zero UX Regression)**: 목표 탭 진입 시 서브탭 1열에 '루틴'이 '개인' 왼쪽에 올바르게 노출되는지 확인.
- **시나리오 D (Full State Propagation)**: 당일 루틴 체크 완료 시 `routineLastExpAwardDate` 영속화 및 EXP 지급 확인.
- **시나리오 E (자동화 게이트 통과)**: `node scripts/verify-integrity-gate.js` 및 `npm test` 100% ALL PASS.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [ ] Step 1~4 외과수술적 코드 구현 완료
- [ ] 단위 테스트 `tests/routine-tab-scheduler.test.js` PASS
- [ ] 스모크 테스트 388개 ALL PASS
- [ ] 헌법 무결성 게이트 38개 ALL PASS
- [ ] GitHub Court 심사 청구 및 `node court/chat.js <PR번호>` 결론 획득 후 squash 머지

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**:
  - 요일 칩 선택 상태가 초기화되지 않거나 undefined일 때 화면이 빈 상태로 나오는 오류 가능성.
  - 사전 방어: `var currentFilter = state.routineFilterDay || 'today';`로 자가 치유.
- **롤백 계획 (Rollback Strategy)**:
  - `git checkout -- index.html ui.css`로 이전 상태 즉각 복구 가능.
