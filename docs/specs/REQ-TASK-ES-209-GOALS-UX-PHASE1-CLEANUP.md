# 요구사항 정의서 (REQ) — 목표 탭 Phase 1 컨트롤 슬림화 및 스크롤 단축

> **문서 ID**: REQ-TASK-ES-209-GOALS-UX-PHASE1-CLEANUP  
> **티켓 연계**: #TASK-ES-209  
> **작성 일시**: 2026-09-22  
> **작성자**: Antigravity Omnichannel Session  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**: "아워골 목표탭의 ui / ux를 개선해야해. 외부 컨설턴트로서 현 상태 평가 및 개선사항 보고서를 작성해." ➔ 컨설팅 보고서 제시 ➔ "1" (Option A: Phase 1 컨트롤 슬림화 및 스크롤 단축 선택) ➔ "진행해"
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  - 목표 탭에 진입했을 때, 상단 영역에 12개 이상의 제어 버튼과 토글이 어지럽게 난립해 있어 사용자에게 극심한 선택 마비(Choice Paralysis)를 초래함.
  - 모바일(375px) 뷰포트에서 상단 서브탭 + 마운틴 헤더 + AI 어시스턴트 카드 + 메타 스트립 + 2단 필터바/뷰토글이 첫 화면을 가득 채워, 정작 오늘 실천해야 할 첫 번째 마일스톤 및 할 일 체크박스를 보려면 최소 2.5회 이상 스크롤을 내려야 하는 극심한 뷰포트 질식(Suffocation) 발생.
- **표면 아래 기저 층위 분석**:
  - **1층 (시각적 과밀 결함)**: 마일스톤 필터바(4종)와 뷰 토글(4종)이 2줄로 뚱뚱하게 배치되어 불필요하게 90px 이상의 세로 공간을 낭비함.
  - **2층 (구조적 비대화)**: AI 목표 어시스턴트 카드가 접혀 있는 상태에서도 과도한 패딩과 마진을 차지하여 뷰포트를 아래로 밀어냄.
  - **3층 (도메인 철학 괴리)**: 아워골은 내 인생 청사진과 연결되는 '무공해 성장 도피처'여야 하나, 목표 탭에 들어서면 Jira나 복잡한 ERP 도구를 보는 듯한 관리 피로감을 유발함.
- **사용자 상황 및 페르소나**:
  - 출퇴근길 지하철이나 침대에서 모바일 스마트폰으로 접속하여 오늘 집중해야 할 목표와 마일스톤을 확인하고 가볍게 체크인하려는 보통의 실천 유저.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: `E1` (체크인 루프 및 목표 실천 RPG 효능감)
- **[가목] 본질 (Essence)**:
  - 겉모습의 착시를 걷어낸 이 문제의 진짜 실체는 "도구가 목표 달성보다 더 복잡해진 본말전도"임.
  - **무공해성 (Anti-Pollution)**: 복잡한 버튼과 필터의 피로감을 걷어내고, 사용자가 편안하게 자신의 목표에 집중할 수 있는 시각적 여백 제공.
  - **RPG식 체감 (Immediate Self-Efficacy)**: 진입 즉시 '지금 정복해야 할 마일스톤'이 한눈에 들어와 즉각적인 실천 의지를 자극.
  - **동류 연대 (Peer Accompaniment)**: 깔끔한 공개 범위 제어와 정제된 UI로 팀 연계 및 공유의 바탕 마련.
- **[나목] 원인 (Root Causes)**:
  1. **원인 1**: 기능이 추가될 때마다(`msFilterToggle`, `msViewToggle`, `densityBtn`, `collapseAllBtn`, `goalAgentCard`) 기존 레이아웃 위에 단순 수직 나열식으로 누적 배치됨.
  2. **원인 2**: 모바일 375px 뷰포트를 고려하지 않은 데스크탑 기준의 넓은 패딩(12~20px)과 마진(14~20px) 유지.
  3. **원인 3**: 상황적(Contextual) UI 설계의 부재로, 모든 옵션 버튼이 언제나 화면 전면에 노출되어 주의를 분산시킴.
- **[다목] 중심 (Core Bottleneck)**:
  - 기존 린터와 스모크 테스트(`scripts/smoke-test.js`, `verify-integrity-gate.js`)가 검증하는 필수 ID(`btnPersonalAddGoalInline`, `window.promptNewGoal`, `goalEditToggle` 등)의 기능을 단 1개도 훼손하지 않으면서, 2줄로 분산된 10대 컨트롤을 세련된 **'단일 1열 반응형 제어 바'**로 통합 압축하는 것.
- **[라목] 핵심 (Critical Anchor)**:
  - 모바일 375px 뷰포트에서 첫 번째 마일스톤 카드 도달 스크롤을 50% 단축하고, 기존 38개 무결성 게이트 100% ALL PASS를 방어하는 것.
- **체감 가설 (User Experience Hypothesis)**:
  > *"상민님이 스마트폰(375px)으로 목표 탭에 접속했을 때, 잡다한 2단 토글 버튼들이 깔끔한 1열 세그먼트 바로 정돈되어 보이고, 불필요한 스크롤 없이 '내가 지금 해야 할 마일스톤'이 즉시 시야에 들어와 실천 몰입도가 2배 상승한다."*

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것 (Avoid)**:
  - 기존 마일스톤 필터링 및 뷰 전환 기능 자체를 파괴하거나 삭제하는 행위 금지.
  - `btnPersonalAddGoalInline`, `goalEditToggle` 등의 마크업 ID를 삭제하거나 리스너를 끊는 행위 금지 (테스트 깨짐 원천 방지).
  - 전체 화면을 백지화하고 재작성하는 위험한 빅뱅 방식 금지.
- **해야 할 것 (Action)**:
  - `#goalAgentCard`: 슬림한 32px 인라인 어시스턴트 바로 패딩/마진 리팩토링.
  - `msFilterBar` & `msViewToggle`: 상하 2줄을 단일 1열 플렉스 행(`display: flex; justify-content: space-between;`)으로 압축하여 50px 수직 공간 즉각 확보.
  - `.mountain-trail-card` 및 하단 카드 간격 20px ➔ 12px 최적화.
  - 상태 필터는 `전체 · 진행 · 대기 · 완료` 콤팩트 세그먼트로 정돈하고, 뷰 토글(`기본 · 요약`)을 우측 아이콘 칩으로 단정하게 결속.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**:
  - 본 작업은 클라이언트 UI/UX 뷰포트 슬림화 작업으로 신규 DB 테이블이나 DDL 마이그레이션이 필요하지 않음 (기존 Supabase `goals`, `milestones` 스키마 100% 보존).
- **2호 (스마트 스토리지 분기 설계)**:
  - 기존 `state.msFilter`, `state.goalViewMode`, `state.msDensity` 등의 세션 상태 변수와 100% 호환 유지.
- **3호 (4대 뷰 전파 배선도)**:
  - 목표 탭 내 필터/뷰 변경 시 기존 렌더러 `renderGoalsScreen()`을 즉각 호출하여 화면 갱신 완결.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Selector) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `#btnToggleGoalAgent` | 목표 탭 상단 카드 | 클릭/탭 | AI 어시스턴트 드로어 부드러운 펼침/접힘 토글 및 쉐브론 회전 | 접힘 상태 저장 및 즉각 반응 |
| `#goalAgentSendBtn` | AI 어시스턴트 드로어 | 클릭/엔터 | 입력된 목표/마일스톤 AI 생성 요청 | 공백 시 토스트 안내, 성공 시 렌더링 |
| `#msFilterToggle .format-opt` | 슬림 제어 바 좌측 | 클릭/탭 | `state.msFilter` 상태 전환 및 해당 상태 마일스톤만 즉각 필터링 | active 클래스 하이라이트 즉각 전환 |
| `#msViewToggle .format-opt` | 슬림 제어 바 우측 | 클릭/탭 | `state.goalViewMode` 전환 (기본 뷰 ↔ 🎯 목표별 요약) | 뷰 전환 시 스크롤 위치 보존 |
| `#msDensityToggleBtn` | 슬림 제어 바 유틸 | 클릭/탭 | 마일스톤 카드 간격 콤팩트 ↔ 상세 토글 | 아이콘 및 툴팁 즉각 갱신 |
| `#btnPersonalAddGoalInline` | 세부 마일스톤 헤더 | 클릭/탭 | 새 목표 생성 모달(`promptNewGoal`) 즉각 호출 | 헌법 38개 게이트 필수 검증 항목 완벽 유지 |
| `#goalEditToggle` | 세부 마일스톤 헤더 | 클릭/탭 | 편집 모드 온/오프 전환 | 편집 모드 시 인라인 삭제/보관 버튼 표출 |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Schema)
- 유저가 등록한 기존 목표(`goals`), 마일스톤(`milestones`), 할 일(`tasks`), 체크인 기록은 단 1바이트도 건드리지 않으며 100% 무손실 보존.

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)
- **비판적 자기 검토 및 약점/한계 인정**:
  - 1열로 컨트롤을 압축할 경우 375px 초소형 화면에서 버튼 글자가 겹치거나 잘릴 위험(Overflow)이 있음.
  - **보완책**: 플렉스 컨테이너에 `gap: 4px; overflow-x: auto; -webkit-overflow-scrolling: touch;` 및 폰트 크기 `.75rem` 최적화를 적용하여 가로 잘림을 0건으로 차단.
- **기존 기능과의 충돌 가능성 검토**:
  - `scripts/verify-integrity-gate.js` 및 `scripts/smoke-test.js`의 전수 단언문 분석 완료. 필수 셀렉터 전수 보존 확인.
- **엣지 케이스 (Edge Cases)**:
  - 등록된 목표가 0개일 때: 기존의 친절한 빈 화면 가이드(`personalGoalsEmptyGuideSlot`)가 정상 노출되도록 분기 방어.
  - 마일스톤이 0개일 때: 마일스톤 필터바가 불필요하게 노출되지 않도록 `totalMs > 0` 가드 유지.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)
1. **[단계 1]**: `docs/rules/TICKETS.md`에 `#TASK-ES-209` 티켓 등록 확인.
2. **[단계 2]**: `docs/specs/REQ-TASK-ES-209-GOALS-UX-PHASE1-CLEANUP.md` (본 문서) 및 `PLAN-*.md` 작성.
3. **[단계 3]**: `index.html` 내 `#goalAgentCard` 마크업 및 인라인 스타일 슬림화.
4. **[단계 4]**: `index.html` 내 `msFilterBar` 렌더링 템플릿 리팩토링 (2단 분산 ➔ 단일 1열 콤팩트 바).
5. **[단계 5]**: `ui.css` 내 목표 탭 여백 및 모바일 375px 전용 클래스 스타일링 추가.
6. **[단계 6]**: `npm test` 및 무결성 게이트 전수 검증 (38개 게이트 ALL PASS 확인).
7. **[단계 7]**: `dev_log.md` 자동 갱신 및 결과 보고.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)
- **단일 실패점 (SPOF) 점검**:
  - CSS 변경으로 인해 타 탭(홈, 일정, 기록 등)의 공통 클래스(`.format-toggle` 등)가 깨질 위험.
  - **완화책**: 신규 스타일은 오직 `#screen-goals` 하위 또는 전용 네임스페이스(`.goals-filter-strip`, `.goals-agent-slim`)로 한정하여 타 화면 회귀 0건 보장.
- **가정의 타당성 검증**:
  - 1열 압축 시 '마일스톤만', '할일만' 뷰를 자주 쓰는 유저가 불편할 수 있다는 가정.
  - **검증**: 대부분의 유저는 마일스톤과 할 일을 함께 보는 '기본 뷰'와 전체 목표를 조망하는 '목표별 요약' 2가지를 주로 사용함. 마일스톤만/할일만 옵션은 유틸 토글 내에 콤팩트하게 보존하여 니즈를 100% 충족.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)
- 모바일 375px 기준 상단 마운틴 트레일부터 첫 마일스톤 카드까지의 스크롤 도달 거리 50% 단축 (실측 약 80px 절약).
- `npm test` 335개 테스트 전수 통과 (0 failure).
- `scripts/verify-integrity-gate.js` 38개 헌법 게이트 100% 통과.
- `scripts/verify-all-clicks.js` 엄밀 Zero Dead-Click 3중 방화벽 100% ALL PASS.

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)
- **예상 블로커**: 필터바 DOM 구조 변경 시 기존 이벤트 리스너 바인딩 누락 발생 가능성.
- **대응책**: `renderGoalsScreen()` 내의 `addEventListener` 바인딩 로직을 1:1로 정확하게 점검하고, 리팩토링 전후 DOM ID를 일치시킴.
- **재검증 트리거**: `npm test` 시 단 1개라도 FAIL이 발생하면 즉시 원칙 ④로 복귀하여 변경된 셀렉터와 린터 단언문을 재점검함.
