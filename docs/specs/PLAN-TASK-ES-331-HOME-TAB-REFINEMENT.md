# 엔지니어링 작업계획서 (PLAN) — 홈 탭 UI/UX 중복 전면 소탕 및 실천 콕핏 직관화

> **문서 ID**: PLAN-TASK-ES-331-HOME-TAB-REFINEMENT  
> **요구사항 연계**: [REQ-TASK-ES-331-HOME-TAB-REFINEMENT](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-331-HOME-TAB-REFINEMENT.md)  
> **티켓 연계**: #TASK-ES-331  
> **작성 일시**: 2026-09-29  
> **작성자**: Antigravity Pair Programmer  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2항 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**: 
  - 홈 탭 4대 결함(동일 목표 3중 노출 및 수치 불일치, 체크인 이원화 혼란, 수직 7단계 과다 층위, 모바일 터치 어포던스 결핍)을 전면 소탕.
  - 홈 탭을 "오늘 나에게 가장 중요한 1순위 실천을 완주하고 스트릭 불꽃을 켜는 단일 집중 콕핏"으로 단순화.
  - Zero Deletion Mandate(890개 정적 버튼 보존) 및 유저 데이터 100% 무손실 보존.
- **영향 받는 파일 목록 전수**:
  - `index.html`: `homeHeadline` 인사 문구 내 목표명 중복 제거, `hybridDashboardHtml()`에서 1순위 대표 목표 제외(`goals.slice(1)`), 갓생 퀘스트 렌더링 최적화.
  - `js/sanctuary-v3-engine.js`: 헤로 카드 진행률을 `goalProgress(activeGoal)`로 통일하여 캐러셀과 수치 일치, 1터치 완료와 한 줄 메모/사진 입력 인라인 점진적 전개 배선.
  - `ui.css`: 하단 레거시 `captureCardBox` 숨김 처리(`display: none !important;`)로 수직 7단계 스크롤 압박 해소, 모바일 인라인 마이크로카피 및 3단계 플랫 조형 스타일 보강.
  - `scripts/verify-integrity-gate.js`: 회귀 및 헌법 게이트 통과 확인.
  - `scripts/smoke-test.js`: 440개 테스트 전수 통과 확인.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: **E1 (체크인 루프 & 실천 콕핏)** — 홈 화면을 분산된 대시보드가 아닌 '오늘의 1순위 실천 완주 및 스트릭 점화' 단일 콕핏으로 정립.
- **[원인] (Technical Causes)**:
  - 인사 문구(`index.html:13431`)에서 `firstG.title`을 불필요하게 렌더링.
  - `hybridDashboardHtml`(`index.html:7149`)에서 `goals[0]`(1순위 대표 목표)를 필터링하지 않고 캐러셀에 그대로 출력하여 상단 헤로 카드와 100% 중복.
  - 진행률 계산식이 `activeGoal.progress` vs `goalProgress(g)`로 분기되어 65% vs 0% 수치 왜곡 발생.
  - 1터치 완료(`btnHeroCheckin`)와 한 줄 메모/사진 입력(`captureCardBox`)이 분리되어 스크롤 압박 유발.
- **[중심 배선] (Core Wire & State)**:
  - `state.profile.goals`: 1순위는 상단 몰입 카드(`.home-hero-card`), 2순위 이하는 캐러셀 및 서브 퀘스트로 분리 배선.
  - `state.profile.records`: 체크인 발생 시 로컬 및 Supabase 원격 동기화, `dispatchFullViewPropagation()` 배선.
  - `state.user`: 계정 및 세션 불변 유지.
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - 기존 890개 정적 버튼 Dead-Click 0건 보존 (태그 물리 삭제 금지).
  - 10종 가상 페르소나 데이터 무손실 검증.
  - 오프라인 큐 및 Supabase 3계층 스토리지 보존.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[홈 헤로 카드 1터치 완료] -> [12ms 햅틱 & 스트릭 점화] -> [state.profile.records 원자적 추가] -> [dispatchFullViewPropagation (홈·기록·통계·캘린더 4대 뷰 동시 전파)] -> [인라인 한 줄 회고/사진 입력창 점진적 확장]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `index.html` | 인사 문구 중복 제거 및 캐러셀 1순위 제외 필터링 | +15줄 | -10줄 | +5줄 | 외과수술적 diff |
| `js/sanctuary-v3-engine.js` | 진행률 수치 정규화 및 인라인 체크인 확장 배선 | +30줄 | -10줄 | +20줄 | 콕핏 통합 |
| `ui.css` | 레거시 입력 박스 축소 숨김 및 플랫 조형 스타일 | +25줄 | -5줄 | +20줄 | CSS 토큰 준수 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**: 헤로 카드 내 고유 ID(`btnHeroCheckin`, `heroInlineMemoBox`) 및 모바일 인라인 마이크로카피.
2. **이벤트 리스너 (Listener)**: 1터치 완료 클릭 시 즉시 완료 토글 및 인라인 메모 영역 자연 확장.
3. **비즈니스 로직 (Logic)**: 기존 `fastCheckin()` 및 `dispatchFullViewPropagation()` 원자적 연계.
4. **피드백 & 예외처리 (Feedback)**: 햅틱 진동(12ms), 불꽃 점화 애니메이션, 토스트 안내, 오프라인 큐 대피.

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 HTML 디자인, CSS 스타일, 레이아웃을 임의로 파괴하지 않고 단일 콕핏으로 정돈하는가?
- [x] 전체 파일 덮어쓰기 없이 변경 부분만 외과수술적 diff로 작성하도록 설계되었는가?
- [x] 기존 사용자의 아바타(320종 보관함 포함), 목표, 기록, 세팅값이 100% 무손실 보존되는가?
- [x] 890개 정적 버튼 Zero Dead-Click이 100% 유지되는가?
- [x] `goals.slice(1)` 처리 시 목표가 1개인 경우 캐러셀 배열이 빈 배열(`[]`)이 되어도 에러 없이 방어되는가?

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1 (`index.html:13431`)**:
   - `homeHeadline` 인사 문구에서 `firstG.title` 중복 노출을 제거하고 동기부여 문구로 변경.
2. **Step 2 (`index.html:7149~7175`)**:
   - `hybridDashboardHtml(goals)`에서 `var subGoals = goals.slice(1);`로 1순위 대표 목표를 제외하고, 서브 목표가 없으면 깔끔한 온보딩/추가 카드로 연결.
3. **Step 3 (`js/sanctuary-v3-engine.js`)**:
   - 진행률 표기를 `typeof goalProgress === 'function' ? Math.round(goalProgress(activeGoal)) : (activeGoal.progress || 0)`로 정규화.
   - 헤로 카드 내 1터치 완료 시 인라인 메모/사진 입력이 자연스럽게 확장되도록 연계.
4. **Step 4 (`ui.css`)**:
   - 하단 레거시 `captureCardBox`를 `display: none !important;`로 숨겨 스크롤 피로도 전면 해소.
   - 홈 탭 3단계(헤로 카드 ➔ 갓생 서브 퀘스트 ➔ 액션 바) 플랫 조형 스타일 보강.
5. **Step 5 (기계적 검증 및 실측)**:
   - `npm test` 440개 테스트, 38개 헌법 게이트, 890개 정적 버튼 검증.
   - CDP 실측 캡처 (`real_app_home.png`) 생성.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
- **시나리오 A (Zero Dead-Click)**: 890개 정적 버튼 검증기 `node scripts/verify-all-clicks.js` 100% 통과 확인.
- **시나리오 B (Zero Data Loss)**: 10종 가상 페르소나 데이터 주입 후 불변 보존 대조 (게이트 2/5).
- **시나리오 C (Zero UX Regression)**: 게스트/소셜 세션 유지, E1 체크인 루프 및 스트릭 점화 정상 작동 확인.
- **시나리오 D (Full State Propagation)**: 체크인 발생 시 홈, 기록, 통계, 캘린더 4대 뷰 동시 전파 확인.
- **시나리오 E (자동화 게이트 통과)**: `npm test` 440개 단위/통합 테스트 및 38개 헌법 게이트 100% ALL PASS.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [ ] Step 1~4 코드 수정 순차적 구현
- [ ] 로컬 무결성 게이트 검증: `node scripts/verify-integrity-gate.js` PASS
- [ ] 전수 클릭 검증: `node scripts/verify-all-clicks.js` PASS
- [ ] 스모크 테스트 전수 검증: `npm test` PASS
- [ ] 로컬 실앱(`http://localhost:8888/index.html`) CDP 스크린샷 재캡처 및 프리뷰 확인
- [ ] Tri-Sync 3자 상호 동기화 무결성 검증: `node C:/dev/command-center/lib/tri-sync.js check` PASS
- [ ] Git 커밋 및 상민님께 실측 스크린샷과 함께 보고

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**:
  - `hybridDashboardHtml`에서 서브 목표가 없을 때(`subGoals.length === 0`) 기존 DOM 구조가 깨질 가능성.
  - **사전 방어**: `subGoals.length === 0`일 때 온보딩 퀘스트 카드를 반환하거나 깔끔한 추천 카드를 렌더링하여 공백 방지.
- **롤백 계획 (Rollback Strategy)**:
  - 오류 발생 시 `git checkout -- index.html js/sanctuary-v3-engine.js ui.css`로 즉시 원복 가능.
- **재검증 트리거**:
  - `npm test` 실패 시 즉시 원칙 ④(재검토)로 돌아가 수정 사항 대조 및 단위 테스트 보정.
