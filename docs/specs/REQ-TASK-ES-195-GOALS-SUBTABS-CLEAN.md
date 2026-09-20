# 요구사항 정의서 (REQ) — 목표 탭 서브탭 5종 375px 5열 균등 단정 배치 및 통계 버튼 40px 정상화

> **문서 ID**: REQ-TASK-ES-195-GOALS-SUBTABS-CLEAN  
> **티켓 연계**: #TASK-ES-195  
> **작성 일시**: 2026-09-20  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**: "이런 문제 더 있는지 찾아봐" -> 6대 탭 전수 정밀 감사 후 권장안 보고 -> "단계별로 모두 진행해"
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  1. **목표 탭 서브탭 은폐 결함**: 목표 탭 5종 서브탭(`[개인 목표]`, `[루틴]`, `[팀 연계 개인목표]`, `[팀 목표]`, `[📖 템플릿 백과사전]`)의 총 텍스트 폭이 460px에 달하여, 모바일 375px(컨테이너 실폭 약 343px)에서 87px 오버플로우가 발생하고, 5번째 핵심 기능인 `[📖 템플릿 백과사전]`이 오른쪽 밖으로 59px 잘려 숨겨짐.
  2. **기록 탭 통계 세그먼트 버튼 터치 타겟 미달 결함**: 기록 탭 성취 통계 기간 버튼 5종(`오늘`, `이번 주`, `이번 달`, `올해`, `전체` - `.s-seg-pill`)의 높이가 26px에 불과하여 모바일 헌법 물리 규격(제7조 제8항 제3호 최소 40px)을 위배함.
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**: 서브탭이 뷰포트 밖으로 벗어나 사용자가 가로로 스크롤하지 않으면 템플릿 백과사전의 존재 자체를 인지하지 못함. 통계 버튼은 터치 반경이 협소하여 오터치 발생.
  - **2층 (구조/프로세스 부재)**: 1열 flex-nowrap 나열 방식으로 탭이 추가될 때마다 가로스크롤이 누적되는 레거시 구조 방치.
  - **3층 (시스템/유저 체감 괴리)**: 첫인상에서 완성도 높은 앱의 안정감이 훼손되고 템플릿 탐색 동선이 차단됨.
- **사용자 상황 및 페르소나**: 모바일 375px 기기에서 목표를 탐색하거나 기록 탭 통계를 기간별로 확인하고자 하는 일반 사용자.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: E1 (자아실현 및 목표 수립) & E4 (기록 및 통계 시각화)
- **[본질] (Essence)**: 목표 탭 5대 서브탭과 기록 탭 통계 기간 선택 버튼의 100% 가시성 및 인체공학적 터치 안정성(Zero Clip & Zero Horizontal Scroll & 40px Touch Target) 확립.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1 (긴 라벨명)**: `팀 연계 개인목표`(8자)와 `📖 템플릿 백과사전`(10자)의 과도하게 긴 라벨로 인해 총폭이 불필요하게 비대화됨.
  2. **원인 2 (부적절한 컨테이너 레이아웃)**: flex 가로스크롤 방식으로 모바일 뷰포트 폭(375px) 안에 정돈되지 못함.
  3. **원인 3 (패딩 부족)**: `.s-seg-pill`의 패딩이 `5px 12px`에 불과하여 폰트 크기 포함 총 높이가 26px에 그침.
- **[중심] (Core Bottleneck & Anchor)**:
  - 서브탭 라벨을 `팀 연계`, `📖 템플릿`으로 단정하게 압축하고, `goalsSubtabs`를 `repeat(5, 1fr)` 5열 그리드로 선언하여 375px 안에서 100% 한 화면에 무스크롤로 안착시킴.
  - `.s-seg-pill`에 `min-height: 40px !important;`를 부여하여 4대 테마 전반에서 터치 타겟을 정상화함.
- **[핵심] (Critical Safety & Termination)**: 기존 5대 목표 뷰(`sanctuaryGoalsView`, `routineGoalsView`, `teamLinkedGoalsView`, `teamGoalsView`, `templateEncyclopediaView`) 렌더러 분기 및 통계 히트맵 필터링 기능(`OurgoalSanctuaryV3.setHeatFilter`) 100% 무손실 보존.
- **체감 가설 (User Experience Hypothesis)**:
  > *"목표 탭에 들어섰을 때 5대 목표 축(개인, 루틴, 팀 연계, 팀, 템플릿)이 한눈에 정갈하게 들어오고, 기록 탭에서 손가락이 닿는 모든 기간 버튼이 40px로 편안하게 반응하여 몰입감이 극대화된다."*
- **기존 전체 기능 영향도 분석**:
  - 홈/일정/소통/설정 탭: 무영향.
  - 목표 탭: 가로스크롤 소멸, 템플릿 서브탭 즉시 노출.
  - 기록 탭: 통계 버튼 조작 편의성 비약적 향상.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것 (Avoid)**:
  - 서브탭 중 일부를 숨기거나 제거하는 행위.
  - 폰트를 과도하게 줄여 가독성을 떨어뜨리는 행위.
- **해야 할 것 (Action)**:
  1. `index.html`: `renderGoalsScreen` 내 라벨 단정화 (`['teamLinked','팀 연계']`, `['templateEncyclopedia','📖 템플릿']`).
  2. `index.html`: `#goalsSubtabs`에 `.goals-subtabs-grid` 클래스 장착.
  3. `ui.css`: `#goalsSubtabs.goals-subtabs-grid` 선언 (`grid-template-columns: repeat(5, 1fr); gap: 4px; padding: 4px;`).
  4. `ui.css`: `.s-seg-pill`에 `min-height: 40px !important;` 선언 및 flex 수직 정렬.
  5. `scripts/smoke-test.js` & `scripts/verify-integrity-gate.js`: [검증 19] 신설 및 결속.
- **왜 이 방식이어야만 하는가 (Why this approach)**:
  - 5개 탭을 `repeat(5, 1fr)`로 배치하면 375px 모바일에서 각 탭에 약 65px 폭이 균등하게 배정되어, 단정해진 텍스트가 줄바꿈이나 가로스크롤 없이 한 줄에 정확히 들어맞음.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**: Supabase `profiles`, `goals`, `routines` 기존 스키마 100% 유지.
- **2호 (스마트 스토리지 분기 설계)**: 로컬 캐시 `state.profile.goals`, `engine.heatFilter` 상태 보존.
- **3호 (4대 뷰 전파 배선도)**: 탭 전환 시 `renderGoalsScreen()` 및 `OurgoalSanctuaryV3.renderHeatmap()` 연계 뷰 동시 전파.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `gsub-personal` | 목표 탭 서브탭 (1열) | 클릭 | 개인 목표 뷰 렌더링 (`sanctuaryGoalsView`) | 활성 탭 하이라이트 |
| `gsub-routine` | 목표 탭 서브탭 (2열) | 클릭 | 루틴 뷰 렌더링 (`routineGoalsView`) | 활성 탭 하이라이트 |
| `gsub-teamLinked` | 목표 탭 서브탭 (3열) | 클릭 | 팀 연계 목표 뷰 렌더링 (`teamLinkedGoalsView`) | 활성 탭 하이라이트 |
| `gsub-team` | 목표 탭 서브탭 (4열) | 클릭 | 팀 목표 뷰 렌더링 (`teamGoalsView`) | 활성 탭 하이라이트 |
| `gsub-templateEncyclopedia` | 목표 탭 서브탭 (5열) | 클릭 | 템플릿 백과사전 뷰 렌더링 (`templateEncyclopediaView`) | 활성 탭 하이라이트 |
| `s-seg-pill (today)` | 기록 탭 통계 | 클릭 | 오늘 통계 필터 적용 | 활성 뱃지 하이라이트 |
| `s-seg-pill (week)` | 기록 탭 통계 | 클릭 | 이번 주 통계 필터 적용 | 활성 뱃지 하이라이트 |
| `s-seg-pill (month)` | 기록 탭 통계 | 클릭 | 이번 달 통계 필터 적용 | 활성 뱃지 하이라이트 |
| `s-seg-pill (year)` | 기록 탭 통계 | 클릭 | 올해 통계 필터 적용 | 활성 뱃지 하이라이트 |
| `s-seg-pill (all)` | 기록 탭 통계 | 클릭 | 전체 통계 필터 적용 | 활성 뱃지 하이라이트 |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Schema)
- 유저 목표 목록, 마일스톤, 루틴, 팀 연계 데이터, 히트맵 기록 100% 무손실 보존.

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)
- **비판적 자기 검토**:
  - 375px 이하(예: 320px) 초소형 화면에서 5열 그리드의 텍스트가 넘칠 수 있는가?
  - 보완책: `@media (max-width: 375px)` 미디어 쿼리에서 `font-size: 10px; padding: 6px 1px; letter-spacing: -0.4px;`를 적용하여 320px에서도 줄바꿈 0건 및 텍스트 보존 완결.
- **기존 테스트 호환성**:
  - `scripts/smoke-test.js:7223`의 `['templateEncyclopedia','📖 템플릿 백과사전']` 검증이 단정화된 `📖 템플릿`과 충돌하지 않도록 양방향 검증으로 유연하게 결속.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)
1. `docs/specs/REQ-TASK-ES-195-GOALS-SUBTABS-CLEAN.md` 및 `docs/specs/PLAN-TASK-ES-195-GOALS-SUBTABS-CLEAN.md` 확정.
2. `index.html` 서브탭 라벨 단정화 및 `goals-subtabs-grid` 클래스 배선.
3. `ui.css` 5열 그리드 및 40px 터치 타겟 스타일 선언.
4. `scripts/smoke-test.js` 및 `scripts/verify-integrity-gate.js` [검증 19] 결속.
5. `npm test` ALL PASS 확인.
6. Chrome CDP 모바일 375px 실측 캡처 및 클리핑 0건 증명.
7. 로컬 main 머지 (`--no-ff`).
8. 6대 탭 및 737개 버튼 전수 재감사 실행.
9. Tri-Sync 동기화 및 Vercel 프리뷰 배포.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)
> *(주의: 본 원칙은 절차 정리(⑤)와 단계별 실행(⑦) 사이에 반드시 독립적으로 존재해야 하며, 생략하거나 타 원칙과 합치는 것은 위헌입니다)*
- **단일 실패점 (SPOF) 점검**:
  - 목표 서브탭 전환 시 `state.goalsSubTab` 키값(`personal`, `routine`, `teamLinked`, `team`, `templateEncyclopedia`)이 변경되지 않고 라벨만 단정화되었으므로 기존 라우팅 로직의 SPOF 위험 0건.
  - `.s-seg-pill` 높이 상향 시 통계 히트맵 카드 및 컨테이너의 상하 공간 레이아웃 왜곡 여부 점검: 부모 컨테이너가 `overflow-x: auto;`로 감싸져 있어 레이아웃 깨짐 없이 쾌적하게 렌더링됨.
- **가정의 타당성 검증**:
  - 5개 탭이 `repeat(5, 1fr)`로 배치되었을 때 모바일 375px 뷰포트에서 `scrollWidth === clientWidth`를 만족함을 검증.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)
- 목표 탭 서브탭 5종 모두 클릭 시 화면 정상 렌더링 및 콘솔 에러 0건.
- 모바일 375px 실측 시 `scrollWidth === clientWidth` (가로스크롤 0건, 오버플로우 0px).
- 목표 탭 서브탭 5종 및 통계 기간 버튼 5종 모두 높이 >= 40px 100% 충족.
- 잘림(Clipped) 요소 0건 입증.
- `npm test` 단위 테스트 및 무결성 게이트 ALL PASS.

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)
- **예상 블로커**: 테마별 `.s-seg-pill` 활성 스타일(`active`) 유지 여부 -> **대책**: 기존 테마별 색상 유지 및 공통 `min-height: 40px !important;`만 부여.
- **재검증 트리거**: CDP 실측에서 `isOverflowing === true` 또는 `clippedCount > 0` 적발 시 즉시 컬럼 gap 및 padding 재조정.

