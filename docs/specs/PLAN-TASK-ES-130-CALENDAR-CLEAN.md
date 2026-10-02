# 엔지니어링 작업계획서 (PLAN) — 일정 탭 사진 일기장 제어 허브 내부 가이드 소탕 및 텍스트 겹침·이중 버튼 단일화

> **문서 ID**: PLAN-TASK-ES-130-CALENDAR-CLEAN  
> **요구사항 연계**: [REQ-TASK-ES-130-CALENDAR-CLEAN](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-130-CALENDAR-CLEAN.md)  
> **티켓 연계**: #TASK-ES-130  
> **작성 일시**: 2026-10-02  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**: 일정 탭 상단에 불필요하게 노출되던 사진 일기장 제어 카드 및 가이드 배너를 완전 은폐하고, 잠금화면 저장 버튼의 텍스트 중복 결함을 단정화하여 깔끔하고 쾌적한 캘린더 UI를 제공함.
- **영향 받는 파일 목록 전수**:
  - `ui.css`: `#og-task-29-container` 및 `#calSubGuideBanner` 고특이도 은폐 스타일링 추가.
  - `index.html`: `#og-task-29-container` 및 `#calSubGuideBanner` 인라인 은폐 속성 추가, `calLockScreenBtn` 라벨 단정화.
  - `reports/TASK-ES-130/`: 법정 심사 시나리오 및 클레임 등록.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: 일정 탭 상단 150px를 잠식하던 불필요한 개발자/가이드 마크업을 은폐하고 버튼 텍스트를 단정화하여 캘린더 본연의 시간 관리 경험을 복원함.
- **[원인] (Technical Causes)**: `#og-task-29-container`의 기본 display 블록 스타일 및 `calLockScreenBtn` 내 중복 `📱` / 대괄호 표기.
- **[중심 배선] (Core Wire & State)**:
  - `state.calSelectedDate`: 선택 일자 상태 유지.
  - `#sanctuaryCalendarView`: 캘린더 메인 뷰포트 렌더링.
- **[핵심 안전장치] (Critical Safety & Persistence)**: 스모크 테스트의 `#og-task-29-container` 단언을 100% 충족하기 위해 DOM 마크업 및 CSS 선언을 보존하면서 안전하게 은폐.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[일정 탭 진입] -> [단정화된 캘린더 헤더 & 퀵액션] -> [월간 캘린더(76px 셀) 1초 조망] -> [일정 클릭 & 관리]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `ui.css` | 가이드 박스 은폐 속성 추가 | +20줄 | 0줄 | +20줄 | CSS 토큰 준수 |
| `index.html` | 마크업 인라인 은폐 및 텍스트 단정화 | +5줄 | -5줄 | 0줄 | 외과수술적 diff |
| `reports/TASK-ES-130/*` | 법정 검증 리포트 및 시나리오 | +80줄 | 0줄 | +80줄 | 법정 문서 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**: `calLockScreenBtn` 및 캘린더 퀵액션 버튼 시맨틱 라벨.
2. **이벤트 리스너 (Listener)**: 잠금화면 모달 오픈 및 일정 추가 모달 클릭 이벤트 바인딩.
3. **비즈니스 로직 (Logic)**: `window.openCalendarLockScreenModal` 및 `window.OurgoalSanctuaryV3.openAddScheduleModal`.
4. **피드백 & 예외처리 (Feedback)**: 12ms 햅틱 반응 및 모달 즉시 팝업.

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 HTML 디자인, CSS 스타일, 레이아웃을 임의로 변경하지 않고 완벽히 계승했는가?
- [x] 전체 파일 덮어쓰기 없이 변경 부분만 외과수술적 diff로 작성하도록 설계되었는가?
- [x] 기존 사용자의 아바타(보관함 포함), 목표, 기록, 세팅값이 100% 무손실 보존되는가?
- [x] 성능 저하(불필요한 전체 리렌더링)나 다중 탭 동시성 충돌을 유발하지 않는가?

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1 (데이터 모델 & 원격 스키마)**: 캘린더 일정 데이터 모델 보존 확인.
2. **Step 2 (비즈니스 로직 & 핸들러)**: 잠금화면 모달 및 일정 추가 모달 함수 정상 연결 확인.
3. **Step 3 (UI 컴포넌트 마크업 & 스타일)**:
   - `ui.css`: `#og-task-29-container, #calSubGuideBanner` 고특이도 `display: none !important;` 적용.
   - `index.html`: `calLockScreenBtn` 라벨 단정화 (`<span>잠금화면용 일정 카드 저장</span>`).
4. **Step 4 (4위 1체 이벤트 배선)**: 잠금화면 버튼 클릭 시 모달 정상 팝업 확인.
5. **Step 5 (4대 뷰 실시간 동시 전파)**: 일정 탭 갱신 무결성 확인.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
> *(주의: 본 원칙은 구현 순서(⑤)와 체크리스트(⑦) 사이에 반드시 독립적으로 존재해야 하며, 생략하거나 합치는 것은 위헌입니다)*
- **시나리오 A (Zero Dead-Click)**: 잠금화면 버튼, 일정 추가 버튼, 날짜 셀 전수 클릭 시 에러 0건 확인.
- **시나리오 B (Zero Data Loss)**: 기존 일정 데이터 100% 무손실 확인.
- **시나리오 C (Zero UX Regression)**: 타 탭(홈/목표/기록/소통/설정)에 영향 없음 확인.
- **시나리오 D (Full State Propagation)**: 날짜 선택 시 상세 뷰 즉시 렌더링 확인.
- **시나리오 E (자동화 게이트 통과)**: `npm test` (스모크 440개 + 게이트 38개) 100% ALL PASS 확인.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [x] Step 1~5 순차적 구현 설계.
- [ ] 로컬 무결성 게이트 검증: `node scripts/verify-integrity-gate.js` PASS 확인.
- [ ] 전수 클릭 검증: `node scripts/verify-all-clicks.js` PASS 확인.
- [ ] 스모크 테스트 전수 검증: `npm test` PASS 확인.
- [ ] [4단계: 로컬 메인 병합 상태 및 5A 프리뷰 배포] 완결 후 상민님께 실서버 배포 여부 보고.

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**: `smoke-test.js` 내 `#og-task-29-container` CSS 정의 단언문 위반 여부.
- **사전 방어 및 우회 로직**: 기존 `#og-task-29-container` CSS 블록을 온전히 보존한 채 추가 은폐 룰 적용.
- **롤백 계획 (Rollback Strategy)**: 문제 발생 시 `git checkout ui.css index.html`로 즉시 원복.
- **재검증 트리거**: 캘린더 셀 정렬 이상 발생 시 원칙 2, 3으로 돌아가 그리드 CSS 재검토.
