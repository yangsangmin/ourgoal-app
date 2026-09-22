# 요구사항 정의서 (REQ) — 기록/통계 탭(screen-records) 토스(Toss)식 UI/UX 전면 혁신

> **문서 ID**: REQ-TASK-ES-215-RECORDS-TOSS-INNOVATION  
> **티켓 연계**: #TASK-ES-215  
> **작성 일시**: 2026-09-23  
> **작성자**: Antigravity (Toss Head of UI/UX Pair)  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)

- **상민님 지시 원문**:
  > *"홉탭부터 순서대로 가자 1번 홈탭부터 요구사항정의서만 다시 작성해"*  
  ➔ 1번 홈 탭(TASK-ES-211), 2번 목표 탭(TASK-ES-212), 3번 일정 탭(TASK-ES-214) 실서버 배포 완료 후, 상민님께서 부여하신 순서에 따라 **4번 기록/통계 탭(#screen-records)** 전면 혁신 착수.
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  1. **사족 배너 및 분산 컨트롤로 인한 시각적 피로도 (Visual Noise & Clutter)**:
     - 현재 `#screen-records`는 상단 문장형 헤드라인 아래에 `sanctuaryRecordsView`, `recPrivacyBadge`, 숨김 처리된 버튼들(`btnOpenTimeTracker`, `recAddBtn`), `recFeedbackSlot`이 혼재되어 상단 헤더 영역이 어수선함.
  2. **모바일 375px 조작 동선 및 핵심 몰입 요약 부재**:
     - 3분할 세그먼트 바(`recSegmentBar`: 내 기록/성취 통계/보관함)와 1줄 퀵 액션 독(`recQuickDockBar`)이 상단에 배치되어 있으나, 유저가 이번 주 얼마나 몰입했고 어떤 기록을 남겼는지를 한눈에 브리핑해주는 **'몰입 요약 원카드'**가 부재함.
  3. **인터랙션 피드백 및 12ms 햅틱 결여**:
     - 기록 탭의 세그먼트 전환(`[data-recseg]`), 빠른 기록 펼치기, 필터링 등 핵심 터치 인터랙션 시 감각적 만족감을 주는 12ms 미세 햅틱(`triggerHapticFeedback(12)`) 배선이 누락되어 있음.
  4. **피드 카드의 시각적 조형 한계**:
     - 피드 카드가 전통적인 조밀한 리스트 박스 형태로 렌더링되어, 토스형 앱 특유의 쾌적한 카드 여백(16px 패딩, 16px 곡률, 서브틀 섀도우)과 44px 이상 터치 규격이 전면 적용되지 않음.
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**:
    - 기록 세그먼트 전환 및 피드 인터랙션 시 12ms 미세 햅틱 피드백 부재.
  - **2층 (구조/프로세스 부재)**:
    - 사용자가 탭에 진입했을 때 "이번 주 총 N건의 몰입 기록이 쌓였어요"라는 직관적 요약 원카드가 없어 데이터가 파편화되어 보임.
  - **3층 (시스템/유저 체감 괴리)**:
    - 유저는 1초 만에 나의 기록 현황을 파악하고 바로 새 기록을 남기거나 시간을 측정하길 원하지만, 화면 조작 요소들이 분산되어 있음.
- **사용자 상황 및 페르소나**:
  - 하루의 끝에 오늘 하루 어떤 일들을 이루었는지 회고하고, 한 손(엄지)으로 간편하게 기록을 남기며 성장을 확인하고 싶은 2030 프로덕티비티 유저.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)

- **본질 축 (Essence Axis)**: E2 (기록 및 성장 회고 루프) 및 시간 몰입 자산 관리 효능감
- **[본질] (Essence)**:
  - 기록/통계 탭의 본질은 **"이번 주 몰입 요약 원카드 (Weekly Focus Hero Card)와 1터치 간편 회고"**이다.
  - 화면에 들어서는 순간 "이번 주 총 4개의 몰입 기록이 쌓여가고 있어요 📈"와 같이 유저의 성장 데이터가 시원하고 정갈한 토스형 카드로 요약되고, 탭 한 번에 12ms 햅틱과 함께 빠른 기록 또는 시간 측정을 시작하는 쾌적함을 제공하는 것이 본질이다.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1 (상단 영역의 정보 분산)**:
     - 공개범위 배지, 피드백 슬롯, 중복 액션 버튼 등이 상단에 흩어져 있어 시선이 분산됨.
  2. **원인 2 (핵심 요약 앵커 부재)**:
     - 사용자의 주간 누적 몰입 시간과 기록 개수를 단일 카드로 종합해 보여주는 앵커 조형의 결여.
  3. **원인 3 (햅틱 피드백 단절)**:
     - 탭 전환 및 기록 인터랙션 시 12ms 미세 햅틱 피드백 부재.
- **[중심] (Core Bottleneck & Anchor)**:
  - 기존 38대 무결성 게이트(특히 17번: 집중 타이머 기록 탭 이전 및 기록 탭 6종 3×2 그리드 조형 정적 방화벽, 20번: 체크인 즉시 아바타 AI 피드백 고도화 & 영구 원장 영속화 및 기록 탭 상시 노출 무결성), 777개 정적 버튼을 100% 무손실 보존하면서, 시각적 계층을 **'문장형 대형 헤드라인 + 몰입 요약 원카드 + 슬림 퀵 독 + 토스형 피드 카드'**로 정돈하는 외과수술적 개편.
- **[핵심] (Critical Safety & Termination)**:
  - `#recHeadlineSentence`, `#sanctuaryRecordsView`, `#recPrivacyBadge`, `#btnOpenTimeTracker`, `#recAddBtn`, `#recFeedbackSlot`, `#recSegmentBar`, `#recSegFeedBtn`, `#recSegStatsBtn`, `#recSegArchiveBtn`, `#recSegCount`, `#recViewFeed`, `#recQuickDockBar`, `#recTimeTrackerActionCard`, `#recUniversalTopBanner`, `#recList`, `#recAgentCard`, `#recAgentInput` 등 헌법 및 테스트 필수 DOM ID 100% 불변 보존.
  - 모바일 375px 규격 및 42~44px 터치 규격 100% 준수.
- **체감 가설 (User Experience Hypothesis)**:
  > *"사용자가 기록/통계 탭을 열었을 때, 번잡한 컨트롤 대신 단정한 문장형 헤드라인과 '이번 주 몰입 요약 원카드'가 한눈에 들어오고, 1터치로 기록을 추가하거나 필터를 변경할 때마다 12ms 햅틱 피드백이 전해져 회고의 몰입감이 극대화된다."*
- **기존 전체 기능 영향도 분석**:
  - 데이터 모델: `customRecords`, 시간 기록 스톱워치 데이터, 외부 데이터 가져오기 스키마 100% 불변 보존.
  - 연계 뷰: 기록 추가/수정/삭제 시 홈, 목표, 통계, 캘린더 4대 뷰 동시 전파 완비.

---

## 3. [원칙 ③] 목적 · 목표 · 성공 기준 (Objectives & Key Results)

- **최종 목적 (Ultimate Purpose)**:
  - 아워골 4번 기록/통계 탭을 토스(Toss)식 금융·라이프스타일 앱 수준의 미니멀리즘과 직관성으로 끌어올려, 유저가 매일 자신의 성장을 명료하게 확인하고 기록을 지속하도록 유도.
- **정량적 목표 (Key Results)**:
  1. 기계적 무결성 헌법 5대 핵심 게이트 38개 검사 100% 통과 (0건 실패).
  2. 엄밀 Zero Dead-Click 검증 정적 777개 버튼 100% ALL PASS.
  3. 전체 스모크 테스트 335종 100% ALL PASS.
  4. 모바일 375px 뷰포트에서 상단 헤더 여백 및 원카드 가독성 100% 확보 (가로 스크롤 결함 0건).
  5. 세그먼트 전환 및 기록 액션 시 12ms 미세 햅틱 피드백 100% 배선.
- **범위 및 경계 (Scope & Boundaries)**:
  - **In-Scope**:
    - `ui.css`: `.toss-record-hero-card`, `.toss-feed-card`, 토스형 피드 카드 스타일 및 44px 터치 영역 규격 배선.
    - `index.html`: `#screen-records` 상단 조형 정돈, 문장형 헤드라인(`recHeadlineSentence`) 유지/강화, 세그먼트 전환 및 기록 작성 시 `triggerHapticFeedback(12)` 배선.
  - **Out-of-Scope**:
    - 소통 탭(#screen-community) 및 설정 탭(#screen-settings) 조형 변경 (다음 순차 단계에서 수행).
    - 기존 백엔드 DB 스키마 및 타임 트래커 로직 변경.

---

## 4. [원칙 ④] 4단계 전개 시나리오 및 예외 방어 (Rollout Phases & Defensive Design)

- **4단계 상한선 (Phase 1 ~ Phase 4)**:
  - **Phase 1 (디자인 토큰 및 CSS 조형)**:
    - `ui.css`에 `.toss-record-hero-card`, `.toss-feed-card` 스타일 추가.
    - 모바일 375px 최적화 패딩 및 그림자, 44px 터치 규격 정의.
  - **Phase 2 (DOM 앵커 및 헤더 정돈)**:
    - `index.html`의 `#screen-records` 상단 헤더 영역 정돈.
    - 필수 DOM 요소(`recHeadlineSentence`, `recPrivacyBadge`, `recSegmentBar`, `recQuickDockBar`)의 완전한 가시성과 접근성 보장.
  - **Phase 3 (인터랙션 및 12ms 햅틱 배선)**:
    - 세그먼트 전환 함수(`switchRecSegment`) 및 피드 동작에 `triggerHapticFeedback(12)` 배선.
    - 로컬 프리뷰 서버 실측 및 동작 확인.
  - **Phase 4 (검증, PR 발행 및 머지)**:
    - 38/38 무결성 게이트, 335/335 스모크 테스트, 777/777 Zero Dead-Click 전수 검증.
    - PR 생성 -> GitHub Actions CI 통과 -> main 브랜치 머지 완료.
- **예외 상황 및 엣지 케이스 방어**:
  - 기록이 0개인 신규 유저 빈 상태(Empty State)에서도 "아직 작성된 기록이 없어요. 오늘의 첫 기록을 남겨보세요 ✍️" 토스식 빈 카드 단정하게 표출.
  - 오프라인 상태에서도 IndexedDB/localStorage 삼중 백업 데이터 정상 렌더링.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)

- **구체적 실행 시퀀스**:
  1. **[단계 1 - 스펙 및 티켓 정립]**: `REQ-TASK-ES-215-RECORDS-TOSS-INNOVATION.md` 작성 및 티켓 등록.
  2. **[단계 2 - 세부 엔지니어링 계획]**: `PLAN-TASK-ES-215-RECORDS-TOSS-INNOVATION.md` 작성 (8원칙 린터 검증).
  3. **[단계 3 - 법정 청구서 수립]**: `reports/TASK-ES-215/claims.json` 작성 (기록 탭 5대 법정 청구 항목).
  4. **[단계 4 - CSS 토스 기록 토큰 배선]**: `ui.css`에 `.toss-record-hero-card`, `.toss-feed-card` 등 전용 모던 스타일 추가.
  5. **[단계 5 - 렌더러 리팩토링 및 햅틱 배선]**: `index.html` 내 `#screen-records` 헤로 카드 및 세그먼트 전환, 피드 카드 12ms 햅틱(`triggerHapticFeedback(12)`) 연결.
  6. **[단계 6 - 기계적 무결성 전수 검증]**: 335개 테스트, 38개 헌법 게이트, 777개 정적 버튼 dead-click 전수 통과 확인.
- **화면 간 상호연동 전파 규격**:
  - 기록 추가/수정/삭제 시 `dispatchFullViewPropagation()` 호출 -> 기록 화면 즉시 갱신 및 홈/목표/통계/캘린더 동기화.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)

> *(주의: 본 원칙은 절차 정리(⑤)와 단계별 실행(⑦) 사이에 반드시 독립적으로 존재해야 하며, 생략하거나 타 원칙과 합치는 것은 위헌입니다)*

- **단일 실패점 (SPOF) 점검**:
  - 기록 세그먼트 전환 및 피드 렌더링 시 외부 통계 라이브러리 미로딩 상태에서도 UI 반응성 100% 유지(안전 폴백).
  - 햅틱 피드백 호출 시 예외가 발생하더라도 본 로직이 중단되지 않도록 `if(typeof triggerHapticFeedback === 'function')` 방어 코딩 필수.
- **가정의 타당성 검증**:
  - 내 기록/성취 통계/보관함 3개 세그먼트 모두에서 헤로 카드와 피드가 깨짐 없이 동작하는지 크로스 체크.
- **재검증 결과 도출된 절차 수정/보완사항**:
  - 17번 헌법 게이트(집중 타이머 6종 3×2 그리드 조형 정적 방화벽)와 20번 헌법 게이트(아바타 AI 피드백) 셀렉터 무결성 100% 보존.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)

1. 모든 인터랙티브 버튼 클릭 시 콘솔 에러 0건 (Zero Error).
2. 유저 데이터 무손실 검증(10종 페르소나 딥이퀄) 100% PASS.
3. `npm test` 스모크 335개 및 38개 무결성 게이트 전수 ALL PASS (0 failure).
4. `verify-all-clicks.js` 777개 정적 버튼 Zero Dead-Click 100% 통과.
5. 모바일 375px 뷰포트에서 당일 기록 요약 원카드 시인성 확보.

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)

- **예상 장애물**:
  - 대용량 기록 유저의 경우 주간 통계 루프 속도 저하 우려 -> `allRecs.forEach`에서 7일 범위 최적화로 1ms 이내 완료.
- **재검증 트리거**:
  - 기록 추가 시 원카드 통계가 즉각 갱신되지 않는 현상 발견 시 `dispatchFullViewPropagation` 재검증.

