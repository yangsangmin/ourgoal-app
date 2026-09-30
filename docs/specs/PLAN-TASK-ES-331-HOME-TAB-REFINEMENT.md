# 엔지니어링 작업계획서 (PLAN) — 홈 탭 본질 회귀: 3초 팩트 체크인 중심 4단계 초단순 콕핏 구현

> **문서 ID**: PLAN-TASK-ES-331-HOME-TAB-REFINEMENT  
> **요구사항 연계**: [REQ-TASK-ES-331-HOME-TAB-REFINEMENT](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-331-HOME-TAB-REFINEMENT.md)  
> **티켓 연계**: #TASK-ES-331  
> **작성 일시**: 2026-09-29  
> **작성자**: Antigravity Pair Programmer  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2항 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**: 
  - 팩트 없는 '원클릭 가짜 완료' 헤로 카드와 목표 탭 복제판인 '갓생 퀘스트' 사족을 홈 화면 중심에서 걷어냄.
  - 지식기반(PRD FR-03-02) 정본인 **"오늘의 3초 팩트 체크인(`captureCardBox`)"**을 홈 탭의 최상단 핵심 주인공으로 전면 격상.
  - 홈 탭을 **① 아바타 & 스트릭 상태 ➔ ② 오늘의 3초 팩트 체크인 ➔ ③ 실시간 동류 레이스 ➔ ④ 성장 확인/자랑 및 아워골 평가 배너**의 4단계 초단순 콕핏으로 정돈.
  - Zero Deletion Mandate(890개 정적 버튼 보존) 및 전 기능 인터랙션 100% 실제 작동 보장.
- **영향 받는 파일 목록 전수**:
  - `index.html`: 홈 탭 DOM 배치 순서 정돈 (3초 체크인 상단 전진 배치, 갓생 퀘스트 헤더 정돈).
  - `js/sanctuary-v3-engine.js`: 가짜 원클릭 헤로 카드 슬롯 은폐/제거 및 3초 체크인과 원활한 연동.
  - `ui.css`: 3초 체크인 카드의 최상단 콕핏 카드화 스타일, 4단계 플랫 IA 스타일링.
  - `scripts/verify-integrity-gate.js`: 무결성 통과 확인.
  - `scripts/smoke-test.js`: 440개 테스트 통과 확인.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: **E1 (체크인 루프)** — 목표를 향한 실제 행동(글·수치·사진)의 '팩트 측정'과 이에 따른 실시간 AI 코칭.
- **[원인] (Technical Causes)**:
  - `js/sanctuary-v3-engine.js`가 상단에 `sanctuaryHomeSlot`을 주입하여 가짜 완료 버튼이 달린 거대 헤로 카드를 강제로 노출시킴.
  - 그 결과 원래 정본 엔진이었던 `captureCardBox`(3초 체크인)가 아래로 밀려나고 시각적 관심이 분산됨.
- **[중심 배선] (Core Wire & State)**:
  - `captureInput` ➔ `captureSave` ➔ `saveProfile()` ➔ `dispatchFullViewPropagation()` ➔ `checkin-ai-sheet` 즉각 피드백 파이프라인.
  - 5대 테마 선택 칩(`captureLiveTheme`, `captureThemeQuickBar`) ➔ AI 분석 메타데이터 연동.
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - 기존 890개 정적 버튼 ID 및 이벤트 핸들러 100% 보존.
  - Supabase DB 원격 저장 및 오프라인 큐 안전 대피소.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[홈 진입] -> [오늘 3초 체크인 입력 (글/사진/음성)] -> [기록 완료 클릭] -> [12ms 햅틱 & +10P 적립] -> [원격 DB 저장 및 4대 뷰 동시 전파] -> [Gemini Flash 실시간 맞춤 피드백 카드 오픈]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `index.html` | 3초 체크인 상단 전진 및 목표 리스트 콤팩트 카드화 | +20줄 | -20줄 | 0줄 | 외과수술적 diff |
| `js/sanctuary-v3-engine.js` | 가짜 원클릭 헤로 카드 비활성화 및 3초 체크인 지원 | +10줄 | -30줄 | -20줄 | 슬림화 |
| `ui.css` | 3초 체크인 콕핏 스타일 및 4단계 조형 완성 | +30줄 | -10줄 | +20줄 | CSS 토큰 준수 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**: `#captureCardBox`, `#captureInput`, `#micBtn`, `#capturePhotoBtn`, `#captureSave`.
2. **이벤트 리스너 (Listener)**: 클릭 시 실제 파일 업로드, STT 음성 시작, 체크인 완료 처리.
3. **비즈니스 로직 (Logic)**: `saveProfile()`, `computeStreakDays()`, `dispatchFullViewPropagation()`.
4. **피드백 & 예외처리 (Feedback)**: 햅틱 진동, 토스트 안내, 즉시 AI 피드백 바텀시트/카드 오픈.

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 HTML 디자인, CSS 스타일, 레이아웃을 임의로 파괴하지 않고 단일 콕핏으로 정돈하는가?
- [x] 전체 파일 덮어쓰기 없이 변경 부분만 외과수술적 diff로 작성하도록 설계되었는가?
- [x] 기존 사용자의 아바타(320종 보관함 포함), 목표, 기록, 세팅값이 100% 무손실 보존되는가?
- [x] 890개 정적 버튼 Zero Dead-Click이 100% 유지되는가?

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1 (`js/sanctuary-v3-engine.js`)**:
   - `renderSanctuaryHome()`에서 가짜 원클릭 헤로 카드(`.home-hero-card`)의 중복 렌더링을 중단하고, 홈 탭이 정본 마크업 위주로 단정하게 렌더링되도록 슬림화.
2. **Step 2 (`index.html`)**:
   - `captureCardBox`(오늘의 3초 체크인)가 홈 화면 상단에서 당당한 주인공 카드로 보이도록 마크업 및 배치 순서 정돈.
   - 하단 '오늘의 갓생 퀘스트' 영역을 가벼운 '오늘의 목표 상태 한 줄'로 단순화.
3. **Step 3 (`ui.css`)**:
   - `captureCardBox`에 현대적이고 프리미엄한 콕핏 디자인(에메랄드/다크 테마 악센트, 포커스 링, 패딩) 부여.
   - 4단계(헤더 ➔ 3초 체크인 ➔ 동류 레이스 ➔ 액션 바 및 평가) IA 시각적 정돈.
4. **Step 4 (기계적 검증 및 실측)**:
   - `npm test` 440개 테스트, 38개 헌법 게이트, 890개 정적 버튼 전수 통과 확인.
   - CDP 실측 캡처 (`real_app_home.png`) 생성 및 브라우저 프리뷰 실행.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
- **시나리오 A (Zero Dead-Click)**: 정적 버튼 검증기 `node scripts/verify-all-clicks.js` 100% 통과 확인.
- **시나리오 B (Zero Data Loss)**: 10종 가상 페르소나 데이터 무손실 검증.
- **시나리오 C (Zero UX Regression)**: 체크인 후 AI 피드백 정상 발행 확인.
- **시나리오 D (Full State Propagation)**: 체크인 발생 시 4대 뷰 동시 전파 확인.
- **시나리오 E (자동화 게이트 통과)**: `npm test` 440개 단위/통합 테스트 및 38개 헌법 게이트 100% ALL PASS.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [ ] Step 1~3 순차적 코드 구현
- [ ] 로컬 무결성 게이트 검증: `node scripts/verify-integrity-gate.js` PASS
- [ ] 전수 클릭 검증: `node scripts/verify-all-clicks.js` PASS
- [ ] 스모크 테스트 전수 검증: `npm test` PASS
- [ ] CDP 실측 스크린샷 캡처 및 브라우저 프리뷰 실행
- [ ] Tri-Sync 3자 상호 동기화 무결성 검증 PASS
- [ ] Git 커밋 및 상민님께 실측 스크린샷과 함께 보고

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**:
  - `btnHeroCheckin` 버튼이 삭제되면 890개 정적 버튼 검사기나 특정 테스트가 실패할 수 있음.
  - **사전 방어**: `btnHeroCheckin`을 삭제하지 않고, 3초 체크인의 팩트 제출 버튼 또는 빠른 액션과 유기적으로 공존하도록 배선 유지.
- **롤백 계획 (Rollback Strategy)**:
  - `git checkout -- index.html js/sanctuary-v3-engine.js ui.css`
- **재검증 트리거**:
  - `npm test` 실패 시 즉시 원칙 ④(재검토)로 돌아가 수정 사항 대조.
