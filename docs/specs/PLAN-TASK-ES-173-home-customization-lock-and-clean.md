# 작업계획서 (PLAN) — 나만의 홈 구성 상단 고정 및 유령 항목 정리·정합성 고도화

> **문서 ID**: PLAN-TASK-ES-173-home-customization-lock-and-clean  
> **티켓 연계**: #TASK-ES-173  
> **세션 ID**: 8c15f1ab  
> **작성 일시**: 2026-09-18  
> **작성자**: Antigravity  
> **귀속 축**: E1 / UX (체크인 루프 및 홈 화면 맞춤형 제어)  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 2회차 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악 (Architecture & Scope)

- **REQ 핵심 요약**:
  - 상민님 지시: 아바타(경험치)창(`levelBadgeRow`)과 오늘 기록하기 창(`captureCardBox`)은 나만의 홈 구성에서 표현하되 최상단에 편집 불가(잠금) 상태로 고정.
  - 권장안 집행: 유령 식별자 `crewPacingWidget` 영구 삭제, 6대 부가 위젯 라벨/힌트 1:1 정합화, `ui.css` 레거시 정리, 스모크 테스트 동기화.
- **영향받는 파일 전수 목록**:
  1. `js/customize.js` (화이트리스트, 코어보호, 모달 렌더러, 정규화 로직)
  2. `ui.css` (미니멀 모드 셀렉터 및 잠금 스위치 스타일)
  3. `scripts/smoke-test.js` (화이트리스트 단언문 및 고정 항목 검증)
  4. `docs/rules/TICKETS.md` (#TASK-ES-173 티켓 등재)

---

## 2. [원칙 ②] 본질 · 중심 배선(Wire) 식별 (Essence, Causes, Core & Anchor)

- **[본질] (Essence)**:
  - 아워골 홈의 핵심인 E1 체크인 루프(아바타 마주하기 + 1줄 기록)의 시각적 안정성 보장 및 홈 구성 설정의 100% 투명한 정합성 확립.
- **[원인] (Root Causes)**:
  - `levelBadgeRow`가 부가 위젯으로 취급되어 숨김 가능했던 점, `captureCardBox`가 설정 UI에 노출되지 않았던 점, 버튼/위젯 변경 시 설정 화이트리스트가 방치되었던 점.
- **[중심] (Core Bottleneck)**:
  - `OurgoalCustomize.open()` 렌더러와 `normalize()` 정규화 엔진에서 `fixed: true` 속성을 가진 코어 항목을 단단히 잠그고, 기존 저장 데이터와의 하위 호환성을 완벽히 보장하는 배선.
- **[핵심] (Critical Anchor)**:
  - `CORE_IDS`에 `levelBadgeRow` 등록 및 `normalize()` 필터링으로 유저가 어떤 방식으로도 아바타와 체크인 창을 끌 수 없도록 원천 차단.

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget & Storage Blueprint)

### 3-1. 파일별 변경 예산 (Diff Budget)
- `js/customize.js`: +25줄 / -15줄 (화이트리스트 재편, 고정 렌더링 배선)
- `ui.css`: +8줄 / -3줄 (잠금 스위치 CSS 및 셀렉터 청소)
- `scripts/smoke-test.js`: +20줄 / -10줄 (최신 화이트리스트 테스트)
- `docs/rules/TICKETS.md`: +1줄 / 0줄 (티켓 등록)

### 3-2. 스토리지 원장화 3대 명세 의무 (헌법 제2조 제4항 준수)
1. **원격 DB 스키마 명세**:
   - 신규 DDL 없음. `settings.homeLayout` JSON 객체의 비파괴 정규화 승계.
2. **스마트 스토리지 분기 설계**:
   - 기존 유저의 `hidden` 목록에서 `levelBadgeRow`, `captureCardBox`, `crewPacingWidget`을 `normalize()`로 필터링하여 안전한 상태로 정규화 유지.
3. **4대 뷰 전파 배선도**:
   - `apply(settings)` 호출 시 `renderHome()`의 DOM 인라인 display 제어. 4대 연계 뷰 영향도 0 (오직 홈 부가 위젯만 제어).

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증 (Critical Review & Safety)

- **디자인/스타일 보존**:
  - `ui.css` CSS 전역 변수(`--brand`, `--rule`, `--ink-faint`)를 완벽히 계승하여 잠금 뱃지(`🔒 고정`) 및 비활성 스위치 구현.
- **비파괴 데이터 보존**:
  - `normalize()` 함수가 구버전 `hidden` 배열을 읽을 때 기존의 유효한 숨김 설정(예: `homeGrassSummaryCard`, `mzShareBtn` 등)은 단 1개도 유실하지 않고 보존.
- **코드 무결성**:
  - `// ...` 등의 무단 축약 주석 절대 배제, 완전한 실행 가능한 코드로 작성.

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)

1. **Step 1 (`js/customize.js`)**:
   - `CORE_IDS`에 `levelBadgeRow` 추가.
   - `WHITELIST` 최상단에 `{ id: 'levelBadgeRow', label: '아바타 & 레벨 배지', hint: '내 아바타, 레벨, 경험치 바 (상단 고정)', fixed: true }`, `{ id: 'captureCardBox', label: '오늘 기록하기', hint: '1줄 체크인 입력창 (상단 고정)', fixed: true }` 등록.
   - `crewPacingWidget` 삭제.
   - 나머지 6대 부가 위젯의 라벨/힌트 최신화.
   - `normalize()`에서 `CORE_IDS` 자동 배제.
   - `open()` 모달 렌더러: `fixed: true`인 항목은 `switch locked on` 및 `🔒 고정` 뱃지 렌더링, 클릭 이벤트 시 "이 항목은 항상 홈 상단에 고정돼요" 토스트 표출 및 리스트 조작 차단.
2. **Step 2 (`ui.css`)**:
   - `.switch.locked` 스타일에 `opacity: 0.7; cursor: not-allowed;` 부여.
   - `body[data-ux-mode="minimal"]`에서 `#quickRoutineRow` 및 `#crewPacingWidget` 제거.
3. **Step 3 (`scripts/smoke-test.js`)**:
   - 화이트리스트 검증 단언문 갱신 및 `levelBadgeRow`/`captureCardBox` 고정 잠금 검증 추가.
4. **Step 4 (문서 및 티켓 동기화)**:
   - `docs/rules/TICKETS.md`에 #TASK-ES-173 등록.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계 (Verification Scenarios)

- **검증 A (Zero Dead-Click)**:
  - 잠금 스위치 클릭 시 에러 없이 "이 항목은 항상 홈 상단에 고정돼요" 안내 토스트가 정상 발동하는가.
  - 일반 스위치 토글 시 실시간으로 화면의 위젯이 숨김/표시되는가.
- **검증 B (Zero Data Loss)**:
  - `normalize()` 실행 후 기존 사용자의 숨김 목록이 유실 없이 비파괴 승계되는가.
- **검증 C (Zero UX Regression)**:
  - 아바타 변경 모달, 체크인 저장, 3대 퀘스트, 최근 히트맵 등 홈 기능 100% 정상 작동하는가.
- **검증 D (Full State Propagation)**:
  - 나만의 홈 구성 저장(`saveProfile`) 시 원격/로컬 스토리지에 즉각 동기화되는가.
- **검증 E (자동화 게이트 통과)**:
  - `node scripts/verify-integrity-gate.js` 18/18 ALL PASS.
  - `npm test` 전체 스모크 테스트 0 실패 통과.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (4단계 마감 상한선 준수)

- [ ] [1단계: 기획·설계 상태] REQ / PLAN 문서 수립 및 검증 (완료)
- [ ] [2단계: 내부 시뮬레이션 상태] 브랜치 코드 구현 및 로컬 단위/무결성 테스트 ALL PASS
- [ ] [3단계: 로컬 수동 확인 상태] 브라우저 환경에서 나만의 홈 구성 팝업 실물 및 잠금 동작 점검
- [ ] [4단계: 로컬 메인 병합 상태] 작업 브랜치를 로컬 main에 병합 및 Vercel 프리뷰(5A) 자동 실행 후 URL 제공

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획 (Blockers & Rollback)

- **잠재 블로커**:
  - `smoke-test.js` 내 기존 `OurgoalCustomize.WHITELIST` 배열 길이(9개) 단언문 충돌 가능성.
- **해결 및 롤백**:
  - 최신 8개 항목(고정 2개 + 가변 6개)으로 단언문 정확히 동기화.
  - 문제 발생 시 `git checkout feat/2026-09-18-home-customization-lock-and-clean-es173` 브랜치 상태에서 안전하게 롤백.
