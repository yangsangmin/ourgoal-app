# 엔지니어링 작업계획서 (PLAN) — 홈 탭(screen-home) 토스(Toss)식 UI/UX 전면 혁신

> **문서 ID**: PLAN-TASK-ES-211-HOME-TOSS-INNOVATION  
> **요구사항 연계**: [REQ-TASK-ES-211-HOME-TOSS-INNOVATION](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/specs/REQ-TASK-ES-211-HOME-TOSS-INNOVATION.md)  
> **티켓 연계**: #TASK-ES-211  
> **작성 일시**: 2026-09-22  
> **작성자**: Antigravity (Toss Head of UI/UX Pair)  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악

- **REQ 핵심 요약**:
  홈 탭(`screen-home`) 내 16개 컴포넌트의 수직 과밀 적층으로 인한 시각적 인지 부하를 전면 해소하고, "오늘의 원카드 (Today Focus Card)" 중심의 1화면 1목적 구조와 "군더더기 없는 3초 체크인"으로 개편하여 엄지 영역(Thumb-Zone) 중심의 직관적 토스식 모바일 경험을 확립한다.
- **영향 받는 파일 목록 전수**:
  - `docs/rules/TICKETS.md`: #TASK-ES-211 티켓 상태 갱신
  - `docs/specs/REQ-TASK-ES-211-HOME-TOSS-INNOVATION.md`: 요구사항 정의서 (기작성)
  - `docs/specs/PLAN-TASK-ES-211-HOME-TOSS-INNOVATION.md`: 본 엔지니어링 작업계획서
  - `reports/TASK-ES-211/claims.json`: GitHub 법정 검증 청구서
  - `ui.css`: 토스 홈 전용 스타일 컴포넌트 (`.toss-home-focus-card`, `.toss-checkin-clean-box`, `.toss-home-footer-summary`, 모바일 375px 여백 튜닝)
  - `index.html`: `#screen-home` 마크업 외과수술적 위계 재배치, `renderHome()` 1순위 대표 원카드 하이라이팅 연동, 38대 헌법 DOM ID 100% 보존
  - `scripts/verify-integrity-gate.js`: 회귀 및 8원칙 린터 정적 검증
  - `dev_log.md`: 개발 로그 기록

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)

- **[본질] (Engineering Essence)**:
  - 홈 탭의 기술적 본질은 유저가 앱을 여는 순간 오늘 실천해야 할 최우선 1개 목표를 가장 명확한 단일 조형("오늘의 원카드")으로 제시하고, 3초 이내에 1터치로 실천 기록(`captureSave`)을 완료하여 로컬 상태 및 Supabase에 원장화하고 4대 연계 뷰로 즉각 전파하는 **"초고속 성장 피드백 루프(E1 Axis) 엔진"**이다.
- **[원인] (Technical Causes)**:
  - 16개에 달하는 독립 UI 블록(질문 카드, 히트맵 요약, 체크인 카드, 크루 레이스, 퀘스트 목록, 평가 배너 등)이 위계 없이 수직으로 병렬 적층되었고, 체크인 폼 주변에 팁/옵션/AI 모드가 과도하게 분산되어 모바일 375px 뷰포트에서 4~5회 이상의 스크롤 마찰과 인지 과부하를 초래한 것이 결함의 근본 원인이다.
- **[중심 배선] (Core Wire & State)**:
  - `state.profile.goals`: 1순위 대표 목표 추출 및 '오늘의 원카드' 바인딩 (`state.activeGoalId` 또는 첫 번째 미완료 목표)
  - `state.profile.records`: 오늘 체크인 횟수 집계 및 헤드라인 문장 실시간 바인딩
  - `captureSave`: 입력 검증 -> 로컬 상태 갱신 -> Supabase 동기화 -> `dispatchFullViewPropagation()` 배선
  - `triggerHapticFeedback(12)`: 원터치 퀘스트 완료 및 체크인 저장 시 12ms 미세 햅틱 피드백 트리거
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - 767개 정적 버튼 dead-click 린터 및 38대 헌법 방화벽 셀렉터(`#captureInput`, `#captureSave`, `#micBtn`, `#capturePhotoBtn`, `#importExternalBtn`, `#homeGoalList`, `#btnCustomHomeLayout`, `#btnOpenEvalModal`, `#todayMissionCard`, `#crewPacingWidget` 등) 100% 불변 보존.
  - 네트워크 단절 시 `offlineNoticeBanner` 표출 및 로컬 스토리지 삼중 백업(`ourgoal_records_backup_`) 안전 대피소 유지.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[원카드 1터치 완료 or 3초 체크인 입력] -> [triggerHapticFeedback(12)] -> [state.profile 갱신 및 로컬 캐싱] -> [Supabase DB 원격 저장] -> [dispatchFullViewPropagation(홈/기록/통계/캘린더)] -> [원카드 완료 전환 & 배지/스트릭/히트맵 실시간 점등]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `ui.css` | 토스 홈 전용 스타일링 (.toss-home-focus-card 등) | +140줄 | 0줄 | +140줄 | CSS 토큰 준수 |
| `index.html` | 마크업 위계 정리 및 renderHome() 연계 | +50줄 | -10줄 | +40줄 | 외과수술적 diff |
| `docs/specs/PLAN-TASK-ES-211-HOME-TOSS-INNOVATION.md` | 정본 엔지니어링 작업계획서 | +180줄 | 0줄 | +180줄 | 정본 스펙 |
| `reports/TASK-ES-211/claims.json` | 법정 검증 청구서 | +90줄 | 0줄 | +90줄 | 검증 명세 |
| `docs/rules/TICKETS.md` | 티켓 상태 갱신 | +5줄 | -1줄 | +4줄 | 규칙 관리 |

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**:
  - Supabase 테이블(`profiles`, `goals`, `milestones`, `checkins`, `feed_posts`, `app_settings`) DDL 변경 0건 (100% 하위 호환 보장).
- **2호 (스마트 스토리지 분기 설계)**:
  - 320종 아바타 에셋 및 유저 생성 사진(Photo)은 기존 3계층(Supabase DB / IndexedDB / localStorage 메타) 캐시 파이프라인 유지.
- **3호 (4대 뷰 전파 배선도)**:
  - 체크인 저장 또는 목표 상태 갱신 시 `dispatchFullViewPropagation()`을 호출하여:
    1. `renderHome()`: 오늘의 원카드 및 스트릭 배지 즉시 갱신
    2. `renderRecordsScreen()`: 최신 일지 피드 동기화
    3. `renderStatsScreen()`: 히트맵 당일 셀 실시간 점등
    4. `renderCalendar()`: 당일 타임라인 실천 카드 추가

### 3-2. 시각적 IA 및 시맨틱 통합 배선도 명세 (헌법 제2조 제6항 준수)
- **1호 (상하 위계 및 서브뷰 공존 설계)**:
  - **[Zone 1: 상단 헤더 & 헤드라인]**: 아워골 로고, 알림 종, 320종 아바타 배지 + 토스식 문장형 헤드라인 (`homeHeadlineSentence`).
  - **[Zone 2: 오늘의 원카드 (Today Focus Card)]**: 오늘 최우선 1개 퀘스트 카드 (`.toss-home-focus-card`), 1터치 완료 버튼 및 진행 게이지 바.
  - **[Zone 3: 오늘의 3초 체크인 (Clean Check-in Box)]**: 입력창, 음성 마이크, 사진 첨부, 저장 버튼을 모던 카드로 일체화 (`.toss-checkin-clean-box`). 복잡한 옵션은 콤팩트하게 수납.
  - **[Zone 4: 크루 레이스 & 갓생 퀘스트 보드]**: 크루 페이싱 위젯(`#crewPacingWidget`) + 전체 목표 목록(`#homeGoalList`).
  - **[Zone 5: 하단 액션 & 서머리 푸터]**: 성장 확인/자랑 버튼 + 아워골 평가하기(`homeEvalBanner`) 미니멀 카드화.
- **2호 (기존 기능 슬롯 1:1 이식 매핑표)**:
  - `#sanctuaryAvatarBadge` ➔ 상단 헤더 아바타 슬롯 계승
  - `#btnCustomHomeLayout` ➔ 상단 헤더 우측 옵션 슬롯 계승
  - `#homeHeadlineSentence` ➔ 문장형 헤드라인 슬롯 계승
  - `#todayMissionCard` ➔ 오늘의 질문 슬롯 계승
  - `#homeGrassSummaryCard` ➔ 히트맵 요약 슬롯 계승
  - `#captureCardBox`, `#captureInput`, `#micBtn`, `#capturePhotoBtn`, `#importExternalBtn`, `#captureSave` ➔ 3초 체크인 클린 카드 슬롯 계승
  - `#customFeedbackBtn` ➔ 피드백 옵션 슬롯 계승
  - `#crewPacingWidget` ➔ 크루 페이싱 위젯 슬롯 계승
  - `#homeAddGoal`, `#homeGoalList` ➔ 퀘스트 보드 슬롯 계승
  - `#homeChallengeRoomBtn`, `#mzShareBtn` ➔ 하단 액션 버튼 슬롯 계승
  - `#homeEvalBanner`, `#btnOpenEvalModal` ➔ 하단 서머리 푸터 슬롯 계승
- **3호 (모바일 반응형 뷰포트 여백 예산)**:
  - 375px 및 430px 기준:
    - 카드 좌우 패딩: 16px
    - 버튼 터치 타깃: 최소 높이 44px (WCAG 2.1 AA)
    - 원카드 모서리 곡률: border-radius 20px
    - 스크롤 총 길이: 기존 대비 약 40% 압축 (스크롤 횟수 4~5회 ➔ 2회 이내로 단축)

### 3-3. 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**: 고유 ID 및 접근성 시맨틱 태그 완비 (`#homeHeadlineSentence`, `#captureInput`, `#captureSave`, `#btnOpenEvalModal`).
2. **이벤트 리스너 (Listener)**: 클릭 및 입력 이벤트 핸들러 직결.
3. **비즈니스 로직 (Logic)**: 실제 로컬 상태 갱신, Supabase 원격 저장 및 `dispatchFullViewPropagation()` 가동.
4. **피드백 & 예외처리 (Feedback)**: `triggerHapticFeedback(12)` 미세 진동, 토스트 알림, 에러 방어 처리.

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증

- [x] 기존 HTML 디자인, CSS 스타일, 레이아웃을 임의 파괴하지 않고 토스식 미니멀 카드 토큰으로 계승했는가?
- [x] 전체 파일 덮어쓰기 없이 변경 부분만 외과수술적 diff로 작성하도록 설계되었는가?
- [x] 기존 사용자의 320종 아바타(보관함 포함), 목표, 기록, 세팅값이 100% 무손실 보존되는가?
- [x] 성능 저하(불필요한 전체 리렌더링)나 다중 탭 동시성 충돌을 유발하지 않는가?
- **비판적 자기 검토 및 약점/한계 인정**:
  - 홈 화면의 사족 위젯을 완전히 삭제할 경우 기존 렌더러 스크립트(`renderHomeEvalBanner` 등)에서 null 참조 에러가 발생할 수 있음.
  - 따라서 DOM 요소를 제거하지 않고 시각적 위계를 재편하며, CSS 그리드/플렉스와 래퍼를 통해 우아하게 정돈하는 외과수술적 접근을 취함.
- **엣지 케이스 대응**:
  - 등록된 목표가 0개인 신규/게스트 유저: 원카드 위치에 스타터 가이드 카드 표출.
  - 오프라인 네트워크 단절: `#offlineNoticeBanner` 플로팅 및 로컬 큐(`ourgoal_records_backup_`) 안전 대피.

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)

1. **Step 1 (스펙 및 법정 청구서 완비)**:
   - `docs/specs/PLAN-TASK-ES-211-HOME-TOSS-INNOVATION.md` 작성 및 티켓 갱신
   - `reports/TASK-ES-211/claims.json` 법정 검증 청구서 작성
2. **Step 2 (ui.css 토스 홈 컴포넌트 스타일링)**:
   - `.toss-home-focus-card`: 1순위 목표 집중 원카드 스타일링
   - `.toss-checkin-clean-box`: 여백과 가독성이 강화된 미니멀 체크인 폼 스타일링
   - `.toss-home-footer-summary`: 아워골 평가하기 및 하단 서머리 푸터 스타일링
   - 모바일 375px 반응형 여백 및 스크롤 최적화
3. **Step 3 (index.html 마크업 정돈 및 위계 래핑)**:
   - `#screen-home` 내 16개 컴포넌트 순서 및 위계를 5대 Zone으로 정돈
   - 기존 필수 DOM ID 100% 보존
4. **Step 4 (renderHome() 오늘의 원카드 및 체크인 4위 1체 연동)**:
   - 1순위 대표 목표 추출 및 원카드 강조 렌더링
   - 체크인 완료 시 햅틱 피드백(`triggerHapticFeedback(12)`) 및 4대 뷰 전파 확인
5. **Step 5 (로컬 기계적 무결성 전수 검증)**:
   - `node scripts/verify-integrity-gate.js` (38개 무결성 게이트)
   - `node scripts/verify-all-clicks.js` (767개 정적 버튼 dead-click)
   - `npm test` (335개 테스트 전수 ALL PASS)

---

## 6. [원칙 ⑥] 절차 재검증: 법정 주장(claims) 설계

> *(주의: 본 원칙은 구현 순서(⑤)와 체크리스트(⑦) 사이에 반드시 독립적으로 존재해야 하며, 생략하거나 합치는 것은 위헌입니다)*

- **법정 주장(Claims) 설계 (reports/TASK-ES-211/claims.json)**:
  - **C1 (원카드 스타일링)**: `ui.css`에 `.toss-home-focus-card` 클래스가 정의되어 1순위 대표 목표 원카드 조형을 제공한다.
  - **C2 (체크인 클린 박스)**: `ui.css`에 `.toss-checkin-clean-box` 클래스가 정의되어 군더더기 없는 3초 체크인 레이아웃을 제공한다.
  - **C3 (원카드 마크업 배선)**: `index.html`의 `#screen-home`에 문장형 헤드라인(`#homeHeadlineSentence`)과 오늘의 원카드 영역이 배선된다.
  - **C4 (하단 서머리 푸터화)**: `index.html`의 `#homeEvalBanner`가 하단 서머리 푸터로 안전하게 정돈되어 렌더링된다.
  - **C5 (무결성 불변 보존)**: 38대 헌법 무결성 게이트 및 767개 정적 버튼 Dead-Click 검사가 100% ALL PASS를 유지한다.
- **단일 실패점 (SPOF) 방어 검증**:
  - 홈 화면 렌더러 실패 시 앱 전체 진입 차단 위험 ➔ 모든 DOM 접근에 null 가드 및 방어 코딩을 적용하여 100% 안전 보증.
- **재검증 결과 도출된 보완사항**:
  - 체크인 카드 내 테마 선택과 AI 모드 바는 완전히 삭제하지 않고, CSS로 시각적 부피를 최소화하여 기존 JS 이벤트와 완벽히 호환되도록 보완함.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)

- [x] Step 1: PLAN 문서 및 `reports/TASK-ES-211/claims.json` 작성
- [x] Step 2: `ui.css` 토스 홈 전용 스타일 작성
- [x] Step 3: `index.html` `#screen-home` 마크업 외과수술적 위계 정돈
- [x] Step 4: `renderHome()` 원카드 연동 및 체크인 햅틱 배선
- [x] Step 5: `node scripts/verify-integrity-gate.js` PASS (38/38)
- [x] Step 6: `node scripts/verify-all-clicks.js` PASS (777/777)
- [x] Step 7: `npm test` PASS (335/335)
- [x] Step 8: [4단계: 로컬 메인 병합 상태 및 5A 프리뷰 배포] 완결 후 상민님께 실서버 배포 여부 보고

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획

- **잠재적 엔지니어링 블로커**:
  - CSS 캐스케이딩 충돌로 인해 홈 화면 내 타 위젯의 폰트나 여백이 의도치 않게 변경되는 현상.
  - 기존 렌더러가 특정 DOM ID를 찾지 못해 콘솔 에러를 발생시키는 현상.
- **사전 방어 및 우회 로직**:
  - 신규 스타일은 `.toss-home-focus-card`, `.toss-checkin-clean-box` 등 전용 네임스페이스 클래스를 사용하여 전역 오염을 원천 차단.
  - 기존 모든 ID와 클래스를 100% 보존하여 JS 바인딩 실패를 방어.
- **롤백 계획 (Rollback Strategy)**:
  - 결함 발생 시 `git restore index.html ui.css`를 실행하여 작업 직전 안정 상태로 0초 만에 무손실 롤백.
- **재검증 트리거**:
  - 38대 게이트나 335개 테스트 중 1건이라도 실패할 경우 즉시 수정을 중단하고 원칙 ④(재검토)로 돌아가 DOM 셀렉터 정합성을 재검토함.
