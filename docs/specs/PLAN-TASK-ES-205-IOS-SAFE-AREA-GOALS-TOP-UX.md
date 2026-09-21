# 작업계획서 (PLAN) — 아이폰 iOS Safe Area 상단 차폐 및 목표 탭 서브탭·알약 네비게이션 전수 정상화

> **문서 ID**: PLAN-TASK-ES-205-IOS-SAFE-AREA-GOALS-TOP-UX  
> **티켓 연계**: #TASK-ES-205  
> **작성 일시**: 2026-09-22  
> **작성자**: Antigravity AI  
> **기반 문서**: [REQ-TASK-ES-205-IOS-SAFE-AREA-GOALS-TOP-UX](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-205-IOS-SAFE-AREA-GOALS-TOP-UX.md)  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2회차 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악 (Architecture & Scope)

- **핵심 목표 요약**:
  - 아이폰(노치/다이나믹 아일랜드) 환경에서 목표 탭의 상단 5대 서브탭(`#goalsSubtabs`)이 상태바 뒤로 사라지고, 목표 알약(`.s-goal-pills-wrap`)이 잘리는 결함을 해소하기 위해 `ui.css`의 상단 뷰포트 패딩과 Sticky 오프셋에 `env(safe-area-inset-top)`를 완결 배선.
- **영향받는 파일 전수 목록**:
  1. `ui.css`: 전역 `.screens` 상단 패딩 및 상단 Sticky 컴포넌트 Safe Area 오프셋 추가.
  2. `docs/specs/REQ-TASK-ES-205-IOS-SAFE-AREA-GOALS-TOP-UX.md`: 요구사항 정의서.
  3. `docs/specs/PLAN-TASK-ES-205-IOS-SAFE-AREA-GOALS-TOP-UX.md`: 작업계획서 (본 문서).
  4. `.Codex/작업계획서/14c658d5.md`: 세션 작업계획서.
  5. `reports/TASK-ES-205/claims.json`: 법정 주장 문서.
  6. `reports/TASK-ES-205/scenarios/goals-safe-area.json`: 법정 시나리오.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Core Wiring & State Flow)

- **[본질] (Engineering Essence)**:
  - 런타임 오버헤드나 레이아웃 리플로우 없이 CSS의 브라우저 네이티브 하드웨어 뷰포트 인셋(`env(safe-area-inset-top)`)을 온전히 동기화하여, 모바일 375px~430px 전 기종에서 상태표시줄과 다이나믹 아일랜드 간섭 없이 5대 서브탭과 목표 알약의 가시성과 터치 어포던스를 영구 확보하는 것.
- **[원인] (Technical Causes)**:
  - `viewport-fit=cover` 선언 상태에서 `.screens` 상단 패딩이 `padding-top: 4px`로 하드코딩되어 `env(safe-area-inset-top)`(59px)가 결여됨.
  - 레거시 `.topbar` 은폐 후 대체 상단 인셋이 미수립되어 최상단 요소(`#goalsSubtabs`)가 Y=4px~54px의 상태바 데드존에 갇혀 증발함.
  - 상단 Sticky 요소들이 `top: 0`으로 고정되어 스크롤 시에도 노치 뒤 0px에 갇혀 나타나지 않음.
- **[중심] (Core Bottleneck & Wire)**:
  - `.screens, main.screens`에 `padding-top: calc(8px + env(safe-area-inset-top, 0px)) !important;`를 배선하고, Sticky 헤더들(`goalsSubtabs`, `s-cal-modes-wrap`, `s-rec-modes-wrap`, `comm-subtabs`)의 `top` 좌표를 `env(safe-area-inset-top, 0px) !important;`로 완벽히 결속하는 것.
- **[핵심] (Critical Safety & Anchor)**:
  - 기존 클래스명과 DOM 구조, JS 핸들러 일체를 100% 보존하면서 안드로이드/데스크톱(안전 여백 0px)에서도 8px 깔끔한 기본 여백을 유지하도록 방어 코드를 작성하여 무손실·무결함을 보증하는 것.
- **종단간 데이터 흐름 다이어그램 (End-to-End Flow)**:
  ```
  [iOS Hardware / WebKit]
         │
         ▼ (Dynamic Island: 59px / Notch: 47px)
  [env(safe-area-inset-top)]
         │
         ├───▶ [main.screens]: padding-top = calc(8px + env(safe-area-inset-top, 0px))
         │            │
         │            └───▶ [#goalsSubtabs]: 5개 서브탭이 상태바 바로 아래(Y=67px)에 시원하게 안착
         │            │
         │            └───▶ [.s-goal-pills-wrap]: 목표 알약이 서브탭 아래 온전한 타원으로 노출
         │
         └───▶ [Sticky Headers]: top = env(safe-area-inset-top, 0px)
                      │
                      └───▶ 스크롤 시에도 노치 뒤로 숨지 않고 가독 영역 상단에 영구 고정
  ```
- **전역 상태(`state`) 영향 분석**:
  - `state` 변수 변경 없음 (순수 뷰포트 물리 레이아웃 배선).

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget & 4-in-1 Wire)

- **파일별 Diff Budget (예상 줄 수)**:
  - `ui.css`: +15줄 / -2줄
  - `reports/TASK-ES-205/claims.json`: +50줄 / -0줄
  - `reports/TASK-ES-205/scenarios/goals-safe-area.json`: +15줄 / -0줄
  - 총합 80줄 이내의 정밀 외과수술적 변경.
- **4위 1체 배선 명세**:
  1. 마크업: 기존 `#goalsSubtabs`, `.s-goal-pills-wrap` 유지.
  2. 리스너: 기존 클릭 이벤트 리스너 100% 유지.
  3. 비즈니스 로직: 서브탭 전환 및 목표 선택 로직 100% 유지.
  4. 피드백: 노치 아래 완벽 노출 및 터치 시 100% 시각적 활성 상태 반응.

### 3-1. 시각적 IA 및 시맨틱 통합 배선도 (헌법 제2조 제6항 준수)
| 뷰포트 / 기기 | 상단 Safe Area | `.screens` 상단 패딩 | `#goalsSubtabs` 시작 Y좌표 | 결과 시각 상태 |
| :--- | :--- | :--- | :--- | :--- |
| **iPhone 14/15/16 Pro** | 59px | 67px | Y=67px | 상태바 아래 완벽 노출 및 터치 100% |
| **iPhone 13/14 일반** | 47px | 55px | Y=55px | 노치 아래 완벽 노출 및 터치 100% |
| **Android 펀치홀** | 28px | 36px | Y=36px | 카메라 홀 침범 없이 완벽 노출 |
| **Desktop / 브라우저** | 0px | 8px | Y=8px | 깔끔한 최소 상단 여백 유지 |

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증 (Review & Anti-Regression)

- **기존 디자인/스타일 보존**:
  - 다크/블랙/화이트/도심 4개 테마의 색상 토큰 및 카드 디자인 100% 보존.
- **유저 자산 무손실 보증**:
  - 유저 데이터베이스, 로컬스토리지, IndexedDB 일체 미접촉으로 무손실 100% 보증.

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)

1. **Step 1 (`ui.css` 보정)**:
   - `.screens` 및 `main.screens`에 `padding-top: calc(8px + env(safe-area-inset-top, 0px)) !important;` 선언.
   - `#goalsSubtabs.goals-subtabs-grid`, `.s-cal-modes-wrap`, `.s-rec-modes-wrap`, `#screen-comm .comm-subtabs`의 `top`을 `env(safe-area-inset-top, 0px) !important;`로 선언.
2. **Step 2 (`reports/TASK-ES-205` 법정 서류 작성)**:
   - `reports/TASK-ES-205/claims.json` 및 `scenarios/goals-safe-area.json` 작성.
3. **Step 3 (CDP 실기기 시뮬레이션 및 스크린샷 검증)**:
   - iPhone 뷰포트(393x852)에서 `#goalsSubtabs`의 `top >= 60px` 실측 및 캡처.
4. **Step 4 (예비 검사 실행)**:
   - `npm test`를 통해 335개 테스트 및 38개 무결성 게이트 전수 통과 확인.
5. **Step 5 (로컬 법정 검증)**:
   - `node court/judge.js --quick`으로 단일 주장 파일 무결성 및 통과 확인.
6. **Step 6 (Tri-Sync 3자 동기화)**:
   - Notion - Obsidian - Command Center 동기화 무결성 검증.

---

## 6. [원칙 ⑥] 절차 재검증: 법정 주장(claims) 설계 (Claims & Verification)

- **법정 주장 (Claims) 설계**:
  - `claim-1`: `kind: "behavior"`, touches: `["ui.css"]`, scenario: `scenarios/goals-safe-area.json`
  - `claim-2`: `kind: "behavior"`, touches: `["ui.css"]`, scenario: `scenarios/goals-safe-area.json`
- **측정 불가능 항목 투명 보고**:
  - 실제 물리 아이폰 기기에서의 손가락 터치는 로컬 PC 법정 도구로는 측정할 수 없으므로 `unverified.cannotBecause: "visual-quality"` 사유 및 상민님 실기기 확인(`[손 필요]`)으로 투명하게 분리 보고.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (Checklist)

- [x] Step 1: `ui.css` 상단 Safe Area 인셋 및 Sticky 오프셋 선언
- [x] Step 2: `reports/TASK-ES-205` 법정 주장 및 시나리오 작성
- [x] Step 3: Chrome CDP 모바일 헤드리스 스크립트로 393x852 실측 및 캡처
- [x] Step 4: `npm test` 예비 검사 전수 실행
- [ ] Step 5: `node court/judge.js --quick` 로컬 법정 예비 점검
- [ ] Step 6: Tri-Sync 3자 동기화 무결성 확인 (`node C:/dev/command-center/lib/tri-sync.js check`)

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획 (Blockers & Rollback)

- **잠재 장애 요인**:
  - 테마별 고특이도 CSS 규칙이 `padding-top`을 재정의하여 우선순위에서 밀릴 경우.
- **대응책**:
  - `html[data-theme] .screens` 조합 셀렉터에 `!important`를 명시하여 테마 전환 시에도 일관된 여백 강제.
- **롤백 절차**:
  - `git checkout -- ui.css`로 0초 만에 완벽 복구.
