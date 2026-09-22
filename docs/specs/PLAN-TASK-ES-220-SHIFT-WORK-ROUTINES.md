# 엔지니어링 작업계획서 (PLAN) — 교대근무자(2교대/3교대) 전용 가변형 루틴 자동 스케줄링 및 원클릭 맞춤 루틴 연동

> **문서 ID**: PLAN-TASK-ES-220-SHIFT-WORK-ROUTINES  
> **요구사항 연계**: [REQ-TASK-ES-220-SHIFT-WORK-ROUTINES](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/specs/REQ-TASK-ES-220-SHIFT-WORK-ROUTINES.md)  
> **티켓 연계**: #TASK-ES-220  
> **작성 일시**: 2026-09-23  
> **작성자**: 디지털 헬스케어 루틴 알고리즘 아키텍트  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**: 고정된 출퇴근이 어려운 2교대·3교대 근무자를 위해 당일 근무 형태(주간/야간/비번/당직/휴무) 1터치 캡슐 스위처 바 및 서카디언 리듬 맞춤형 루틴 원클릭 연동 및 주기 순환 캘린더 엔진 구축.
- **영향 받는 파일 목록 전수**:
  - `index.html`: `renderRoutineGoalsScreen` 내 `#shiftWorkRoutineBar` 및 안내 카드, 교대 맞춤 루틴 연동 및 주기 순환 설정 모달 배선.
  - `docs/rules/TICKETS.md`: `#TASK-ES-220` 티켓 등록 및 상태 관리.
  - `reports/TASK-ES-220/claims.json`: court 검증 청구서 작성.
  - `scripts/smoke-test.js`: 교대근무 루틴 스위처 및 원클릭 연동 검증 케이스 추가.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: 정적인 24시간 타임라인을 유저의 현재 근무 상태에 따라 가변적으로 재구성하고 서카디언 건강 조언 및 맞춤 루틴을 즉시 제공하는 유연한 루틴 프레임워크.
- **[원인] (Technical Causes)**: 기존 루틴 스키마가 고정된 주간 일정에 종속되어 있어 근무 형태별 타임테이블 분기 및 원클릭 교대 프리셋 주입 기능 부재.
- **[중심 배선] (Core Wire & State)**:
  - `state.profile.settings.shiftSettings`: `{ currentShift, cycle, cycleStartDate, autoCycleEnabled }`
  - `state.profile.shiftSettings`: 동일 상태 동기화
  - `saveProfile()`: 스토리지 원장화
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - 모드 전환 시 기존 사용자의 `routines` 배열 및 `completedDates` 스트릭 데이터 100% 불변 보존.
  - 12ms 미세 햅틱 피드백(`triggerHaptic(12)`) 및 모바일 375px 44px 터치 규격.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[교대 캡슐 터치] -> [12ms 햅틱] -> [state.profile.settings.shiftSettings 갱신] -> [saveProfile() 원장 저장] -> [renderRoutineGoalsScreen 리렌더링] -> [맞춤 가이드 및 루틴 갱신]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `index.html` | 교대 스위처 UI, 12ms 햅틱, 프리셋 연동, 주기 모달 | +160줄 | 0줄 | +160줄 | 외과수술적 추가 |
| `docs/rules/TICKETS.md` | 승인 티켓 대장 #TASK-ES-220 등록 | +2줄 | 0줄 | +2줄 | 티켓 관리 |
| `reports/TASK-ES-220/claims.json` | 법정 청구서 C1~C5 | +70줄 | 0줄 | +70줄 | court 검증 규격 |
| `scripts/smoke-test.js` | 단위 테스트 단언문 | +40줄 | 0줄 | +40줄 | 자동화 검증 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**: `#shiftWorkRoutineBar`, `#btnShiftDay`, `#btnShiftNight`, `#btnShiftDuty`, `#btnShiftOff`, `#btnApplyShiftRoutines`, `#btnOpenShiftCycleModal`.
2. **이벤트 리스너 (Listener)**: 각 버튼별 정밀 클릭 이벤트 및 12ms 햅틱 연결.
3. **비즈니스 로직 (Logic)**: `applyShiftWorkRoutines(shiftMode)`, `openShiftCycleModal()`, 교대 주기 계산기.
4. **피드백 & 예외처리 (Feedback)**: 토스트 메시지 안내, 모드 활성 뱃지 강조, 롤백 안전망.

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 HTML 디자인, CSS 스타일, 루틴 편집/추가/삭제 기능을 일절 파괴하지 않는가? (보증)
- [x] 전체 파일 덮어쓰기 없이 외과수술적 diff로 안전하게 결합하는가? (보증)
- [x] 기존 유저의 스트릭, 레벨, EXP, 루틴 데이터가 100% 무손실 보존되는가? (보증)
- [x] 375px 모바일 뷰포트에서 레이아웃 깨짐이나 가로 오버플로우가 없는가? (보증)

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1 (`index.html`)**: `state.profile.settings.shiftSettings` 초기화 보장 및 교대 모드별 프리셋 데이터 정의.
2. **Step 2 (`index.html`)**: `renderRoutineGoalsScreen` 상단에 `#shiftWorkRoutineBar` 및 맞춤 안내 카드 렌더링.
3. **Step 3 (`index.html`)**: 교대 모드 전환, 12ms 햅틱, `saveProfile()`, 원클릭 루틴 주입(`applyShiftWorkRoutines`) 핸들러 배선.
4. **Step 4 (`index.html`)**: 주기 순환(주·야·비·휴) 설정 모달(`openShiftCycleModal`) 및 자동 계산 알고리즘 배선.
5. **Step 5 (`reports/TASK-ES-220/claims.json`)**: C1~C5 청구서 생성.
6. **Step 6 (`scripts/smoke-test.js`)**: 스모크 테스트 작성 및 `npm test` 통과 확인.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
- **시나리오 A (Zero Dead-Click)**: 신규 추가된 6종 버튼 전수 클릭 시 에러 0건 및 정상 동작 확인.
- **시나리오 B (Zero Data Loss)**: 10종 가상 페르소나 데이터 무손실 검증 및 기존 루틴 보존 확인.
- **시나리오 C (Zero UX Regression)**: 루틴 완수 체크박스 클릭 시 +10 EXP 지급 및 기존 4대 뷰 연계 정상 작동 확인.
- **시나리오 D (Full State Propagation)**: 근무 형태 전환 시 즉시 뱃지 및 가이드 갱신 확인.
- **시나리오 E (자동화 게이트 통과)**: `npm test` (338+ 통과), `node scripts/verify-integrity-gate.js` (38/38 통과), `node scripts/verify-all-clicks.js` (788+ 통과).

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [ ] Step 1~6 순차적 외과수술적 구현
- [ ] 로컬 무결성 게이트 검증: `node scripts/verify-integrity-gate.js` ALL PASS
- [ ] 전수 클릭 검증: `node scripts/verify-all-clicks.js` ALL PASS
- [ ] 스모크 테스트 전수 검증: `npm test` ALL PASS
- [ ] Git commit & push, PR 생성 (Assignee & Reviewer: `yangsangmin`)
- [ ] Notion DB [91] 상태 `완료` 업데이트

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**: 모바일 375px에서 버튼 텍스트 줄바꿈 시 레이아웃 흔들림.
- **사전 방어**: 컴팩트 캡슐 버튼 스타일 및 `gap:6px`, `white-space:nowrap` 방어 배선.
- **롤백 계획**: 문제 발생 시 `git reset --hard` 및 기존 루틴 스키마 100% 원복.
- **재검증 트리거**: UI 깨짐이나 테스트 실패 시 3단계 스타일 및 5단계 이벤트 배선으로 돌아가 즉시 교정.
