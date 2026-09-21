# 엔지니어링 작업계획서 (PLAN) — 전수 6대 탭 상단 배너·모드 네비게이션 4대 결함 전수 일괄 정상화

> **문서 ID**: PLAN-TASK-ES-201-ALL-TABS-UX-REMEDIATION  
> **요구사항 연계**: [REQ-TASK-ES-201-ALL-TABS-UX-REMEDIATION](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-201-ALL-TABS-UX-REMEDIATION.md)  
> **티켓 연계**: #TASK-ES-201  
> **작성 일시**: 2026-09-21  
> **작성자**: Antigravity AI  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악

- **REQ 핵심 요약**:
  - 목표, 일정, 기록, 커뮤니티 4개 탭의 상단 서브탭/모드 네비게이션에 Sticky 포지셔닝(`position: sticky; top: 0; z-index: 25;`) 및 블러 배경을 부여하여 스크롤 시 소실 방지.
  - 비활성 서브탭/모드 전환 칩에 배경 틴트(`rgba(255,255,255,0.05)`) 및 1px 테두리를 적용하여 평문 텍스트 착시(Ghost 버튼) 해소 및 터치 어포던스 복구.
  - 커뮤니티 카테고리 필터 바(`.feed-filter-bar`)에 가로 스크롤 페이드 마스크를 적용하여 375px 모바일에서 우측 7개 잘린 칩의 존재를 시각적으로 유도.
  - 목표가 0건인 빈 상태에서도 상단 필터 바(`.s-goal-pills-wrap`)가 DOM에서 증발하지 않고 유지되도록 조건부 렌더링 정돈.
- **영향 받는 파일 목록 전수**:
  - `ui.css`: [서브탭 및 모드 전환 칩 Sticky, 어포던스 틴트, 페이드 마스크 스타일 선언]
  - `js/sanctuary-v3-engine.js`: [목표 0건 시 상단 알약 바 보존 및 인라인 스타일 클린업]
  - `scripts/verify-integrity-gate.js`: [#TASK-ES-201 4대 검증 게이트 단언문 추가]
  - `reports/TASK-ES-201/claims.json`: [법정(Court) 심사용 주장 명세서]
  - `reports/TASK-ES-201/scenarios/*.json`: [법정 자동 브라우저 실행 시나리오]

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)

- **[본질] (Engineering Essence)**:
  - 런타임 성능 저하(리플로우/리페인트 폭탄) 없이 CSS 레이아웃 엔진의 GPU 하드웨어 가속(Sticky 컴포지팅 계층)을 활용하여 모바일 375px 전 화면에서 무결한 네비게이션 가시성을 영구 확보하는 것.
- **[원인] (Technical Causes)**:
  - `position: static` 상태로 인해 뷰포트 스크롤 오프셋 발생 시 문서 흐름대로 상단 밖으로 밀려남.
  - 비활성 상태에 `background: transparent; border: none;`만 정의되어 투명한 텍스트로 렌더링됨.
  - 조건부 렌더링 `if (goals.length > 0)` 분기에서 빈 상태 대체 마크업을 건너뜀.
- **[중심 배선] (Core Wire & State)**:
  - `window.OurgoalSanctuaryV3.setCalMode`, `setRecMode`, `goalsSubtabs` 클릭 이벤트 위임 리스너가 sticky 컨테이너 위에서도 100% 정상 작동하도록 이벤트 포인터 버블링 보존.
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - 기존 클래스명과 DOM 위계를 일체 변경하지 않고 CSS 레이어와 렌더링 템플릿만 외과수술적으로 패치하여 기존 335개 테스트와 37개 무결성 게이트에 0건의 사이드이펙트를 보증.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[유저 화면 스크롤] -> [Sticky 컨테이너 top:0 안착] -> [서브탭/모드 칩 터치] -> [기존 이벤트 위임 핸들러 호출] -> [서브 뷰 렌더링] -> [헤더 위치 유지]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `ui.css` | Sticky, 비활성 틴트, 마스크 스타일 선언 | +60줄 | -5줄 | +55줄 | CSS 토큰 준수 외과수술 |
| `js/sanctuary-v3-engine.js` | 목표 0건 알약 바 보존 렌더링 | +15줄 | -5줄 | +10줄 | 비파괴 마크업 보강 |
| `scripts/verify-integrity-gate.js` | #TASK-ES-201 정적 방화벽 검증 게이트 추가 | +45줄 | 0줄 | +45줄 | 회귀 차단 |
| `reports/TASK-ES-201/claims.json` | 법정 심사용 주장 파일 | +80줄 | 0줄 | +80줄 | 법정 제출 정본 |
| `reports/TASK-ES-201/scenarios/*.json`| 법정 시나리오 2종 | +50줄 | 0줄 | +50줄 | 자동 브라우저 검증 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**: `#goalsSubtabs`, `.s-cal-modes-wrap`, `.s-rec-modes-wrap`, `#screen-comm .comm-subtabs`, `.feed-filter-bar`, `#sAddGoalBtn` 고유 ID 및 클래스 100% 보존.
2. **이벤트 리스너 (Listener)**: 클릭/터치 이벤트 기존 `onclick` 및 위임 리스너 직통 결속 유지.
3. **비즈니스 로직 (Logic)**: 모드 전환, 달력 뷰 갱신, 피드 필터링, 새 목표 모달 호출 등 기존 로직 100% 수행.
4. **피드백 & 예외처리 (Feedback)**: 클릭 시 `.active` 클래스 즉각 토글 및 하단 뷰 실시간 갱신.

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증

- [x] 기존 HTML 디자인, CSS 스타일, 레이아웃을 임의로 변경하지 않고 완벽히 계승했는가?
- [x] 전체 파일 덮어쓰기 없이 변경 부분만 외과수술적 diff로 작성하도록 설계되었는가?
- [x] 기존 사용자의 아바타(보관함 포함), 목표, 기록, 세팅값이 100% 무손실 보존되는가?
- [x] 성능 저하(불필요한 전체 리렌더링)나 다중 탭 동시성 충돌을 유발하지 않는가?
- [x] 기존 335개 테스트와 37개 무결성 게이트 통과가 100% 보장되는가?

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)

1. **Step 1 (`ui.css` 패치)**:
   - `#goalsSubtabs.goals-subtabs-grid`에 sticky, z-index, backdrop-filter 및 배경 스타일 추가.
   - `.s-cal-modes-wrap` 및 `.s-rec-modes-wrap`에 sticky, z-index, backdrop-filter 스타일 추가.
   - `#screen-comm .comm-subtabs.comm-subtabs-grid`에 sticky, z-index, backdrop-filter 스타일 추가.
   - 비활성 버튼/서브탭(`.comm-subtab:not(.active)`, `.s-rec-mode-btn:not(.active)`, `.s-cal-mode-btn:not(.active)`)에 카드 배경 틴트 및 1px 테두리 추가 (다크 및 라이트 테마 분기 포함).
   - `.feed-filter-bar`에 `-webkit-mask-image` 및 `-webkit-overflow-scrolling: touch` 추가.
2. **Step 2 (`js/sanctuary-v3-engine.js` 패치)**:
   - `renderSanctuaryGoals()`에서 `goals.length === 0`일 때도 `.s-goal-pills-wrap` 내에 `+ 새 목표 만들기` 버튼 렌더링 유지.
3. **Step 3 (`scripts/verify-integrity-gate.js` 게이트 추가)**:
   - `[검증 23/23] [#TASK-ES-201] 전 탭 상단 네비게이션 Sticky & 어포던스 4대 무결성 검사` 추가.
4. **Step 4 (`reports/TASK-ES-201/` 주장 및 시나리오 작성)**:
   - `claims.json` 및 `scenarios/` 작성.
5. **Step 5 (로컬 예비 검증)**:
   - `npm test` 실행 (스모크, 게이트, 클릭 전수 통과 확인).
   - Chrome CDP 및 로컬 브라우저로 375px 모바일 실측 검증.

---

## 6. [원칙 ⑥] 절차 재검증: 법정 주장(claims) 설계

- **지시 항목 1: 상단 네비게이션 Sticky 고정 (R1)**
  - 주장 C1: `kind: "behavior"`, change: `fix`, symptom: 7, scenario: `scenarios/goals-sticky.json`.
  - 기준 커밋에서는 목표 탭 서브탭의 position이 static이어서 실패, 작업 커밋에서는 sticky로 통과.
- **지시 항목 2: 비활성 탭/버튼 어포던스 부여 (R2)**
  - 주장 C2: `kind: "behavior"`, change: `fix`, symptom: 7, scenario: `scenarios/records-modes-sticky.json`.
  - 기준 커밋에서는 기록 탭 모드 바의 position이 static이어서 실패, 작업 커밋에서는 sticky 및 어포던스 적용으로 통과.
- **지시 항목 3: 커뮤니티 카테고리 필터 마스크 (R3)**
  - 주장 C3: `kind: "static"`, touches: `["ui.css"]`, check: `codeContains` in `ui.css` for `.feed-filter-bar` mask-image.
- **지시 항목 4: 목표 0건 시 네비게이션 보존 (R4)**
  - 주장 C4: `kind: "static"`, touches: `["js/sanctuary-v3-engine.js"]`, check: `codeContains` in `js/sanctuary-v3-engine.js` for `s-goal-pills-wrap` empty preservation.
- **단일 실패점 (SPOF) 방어**:
  - `claims.json` 유효성 검증기를 사전 실행하여 형식 오류가 전혀 없음을 기계적으로 확인.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)

- [ ] Step 1: `ui.css` 외과수술적 스타일 패치
- [ ] Step 2: `js/sanctuary-v3-engine.js` 렌더러 정돈
- [ ] Step 3: `scripts/verify-integrity-gate.js` 검증 게이트 배선
- [ ] Step 4: `reports/TASK-ES-201/claims.json` 및 시나리오 작성
- [ ] Step 5: `npm test` 로컬 예비 검사 100% 통과 확인
- [ ] Step 6: Git commit & push `feat/2026-09-21-task-es-201-all-tabs-ux-remediation`
- [ ] Step 7: 초안 PR 오픈 (`gh pr create --draft`) -> [4단계: 심사 청구 상태] 도달
- [ ] Step 8: `node court/chat.js <PR번호>` 법정 판정 대기 및 결과 확인

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획

- **잠재적 엔지니어링 블로커**:
  - `ui.css` 내 다크 테마별(`focus-sanctuary`, `black`, `urban-city`, `white`) CSS 셀렉터 특이성(Specificity) 충돌로 인해 일부 테마에서 배경색이 덮어씌워질 가능성.
- **사전 방어 및 우회 로직**:
  - `html[data-theme] #goalsSubtabs.goals-subtabs-grid` 형태로 공통 다크/라이트 셀렉터를 상위에서 선언하고 `!important`를 필요한 최소 속성에만 제한적으로 사용하여 테마별 충돌을 원천 차단.
- **롤백 계획 (Rollback Strategy)**:
  - 문제 발생 시 `git reset --hard HEAD~1`을 통해 안전하게 직전 상태로 복구 가능.
- **재검증 트리거**:
  - `npm test` 중 하나의 테스트라도 실패하거나 게이트가 깨지면 즉시 중단하고 원칙 ②로 되돌아가 diff 범위를 좁히고 재검증.
