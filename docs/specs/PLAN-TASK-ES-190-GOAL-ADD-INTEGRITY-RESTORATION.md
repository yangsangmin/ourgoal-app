# 엔지니어링 작업계획서 (PLAN) — [#TASK-ES-190] 목표 추가 기능 전면 복원 및 4위 1체 UX 고도화

> **문서 ID**: PLAN-TASK-ES-190-GOAL-ADD-INTEGRITY-RESTORATION  
> **요구사항 연계**: [REQ-TASK-ES-190-GOAL-ADD-INTEGRITY-RESTORATION](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-190-GOAL-ADD-INTEGRITY-RESTORATION.md)  
> **티켓 연계**: #TASK-ES-190  
> **작성 일시**: 2026-09-20  
> **작성자**: Antigravity (세션 11fcefcf)  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**:
  - 목표 화면 및 홈 화면에서 목표 추가 기능이 먹통(Dead Click 또는 더미 토스트)이 되거나, AI 줄글 템플릿 생성 시 `[object Object]`로 데이터가 깨지는 결함을 전면 소탕하고, 어느 화면에서든 매끄럽게 목표를 추가하고 4대 뷰에 실시간 동기화되는 무결성 파이프라인 완성.
- **영향 받는 파일 목록 전수**:
  - `index.html`:
    - `promptNewGoal`, `showNewGoalManualForm` 전역 `window` 객체 노출
    - `localGoalTemplate` tasks 데이터 모델 정규화
    - `showNewGoalReviewStep` 렌더링 및 적용 시 tasks 객체/문자열 상호 방어 로직 배선
    - `showNewGoalManualForm` 제목 유효성 토스트 및 'etc' 기본 마일스톤 보강, 엔터 키 전송 리스너
    - `personalGoalsView` 헤더에 `+ 새 목표` 인라인 버튼(`#btnPersonalAddGoalInline`) 추가 및 이벤트 바인딩
    - 목표 생성 후 `dispatchFullViewPropagation` 및 4대 뷰 동시 전파 호출
  - `js/sanctuary-v3-engine.js`:
    - `sAddGoalBtn` 및 빈 트레일 카드의 `+ 새 목표 만들기` 버튼 핸들러를 안전한 `window.promptNewGoal()` 호출 체계로 보강
  - `scripts/verify-integrity-gate.js`:
    - 목표 추가 파이프라인 및 `window.promptNewGoal` 배선 검증 테스트 추가
  - `scripts/smoke-test.js`:
    - 목표 생성 API/로컬 폴백 무결성 단언문 추가

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**:
  - 아워골 앱의 핵심 사용자 여정(E1 루프)의 시작점인 목표 생성 기능을 전역 인터페이스 수준에서 완벽히 배선하고, 데이터 모델의 일관성을 확립하여 런타임 오류 제로와 4대 뷰 동시 전파를 실현하는 엔지니어링 완결성.
- **[원인] (Technical Causes)**:
  - 스코프 격리로 인한 `window.promptNewGoal` 누락, API와 로컬 폴백 간 tasks 타입 불일치(`string[]` vs `object[]`), 폼 유효성 검사 피드백 누락.
- **[중심 배선] (Core Wire & State)**:
  - `state.profile.goals`: 신규 목표 객체 안전 삽입 및 `state.activeGoalId` 동기화
  - `window.promptNewGoal`: 홈/목표/성소/세부뷰 어디서든 단일 진입로 제공
  - `dispatchFullViewPropagation`: 변경 즉시 4대 뷰에 상태 전파
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - `saveProfile()`을 통한 원격 Supabase DB 및 localStorage 3중 백업 자동 저장
  - 비파괴 추가(`goals.push`)로 기존 유저 자산 100% 무손실 보존
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  ```
  [새 목표 버튼 클릭 (어느 화면이든)]
         │
         ▼
  [window.promptNewGoal()]
         │
         ▼
  [모달 표출: AI 줄글 생성 vs 직접 설정]
         │
    ┌────┴────────────────────────┐
    ▼                             ▼
  [AI / 로컬 스마트 폴백]     [직접 설정 폼 입력]
    │                             │
    ▼                             ▼
  [tasks 정규화 및 검증]     [제목 검증 및 기본 마일스톤 결속]
    │                             │
    └────┬────────────────────────┘
         ▼
  [newGoal 객체 생성 및 state.profile.goals.push]
         │
         ▼
  [await saveProfile() (원격 DB + 로컬 3중 백업)]
         │
         ▼
  [4대 연계 뷰 동시 전파: renderHome, renderGoalsScreen, renderCalendarScreen, renderRecordsScreen, 성소 렌더]
         │
         ▼
  [성공 토스트 + 축하 햅틱 피드백]
  ```

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `index.html` | 전역 배선, tasks 정규화, 폼 피드백, 헤더 버튼 | +65줄 | -15줄 | +50줄 | 외과수술적 diff |
| `js/sanctuary-v3-engine.js` | 성소 트레일 목표 추가 핸들러 보강 | +10줄 | -4줄 | +6줄 | 방어적 배선 |
| `scripts/verify-integrity-gate.js` | 회귀 방지 게이트키퍼 검증 추가 | +20줄 | 0줄 | +20줄 | 테스트 보강 |
| `scripts/smoke-test.js` | 목표 생성 로직 스모크 테스트 추가 | +15줄 | 0줄 | +15줄 | 테스트 보강 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**:
   - `#btnPersonalAddGoalInline`: 세부 마일스톤 헤더에 `+ 새 목표` 버튼 배치
   - `#sAddGoalBtn`: 마운틴 트레일 알약 내 `+ 새 목표` 버튼
   - 빈 트레일 카드 내 `+ 새 목표 만들기` 버튼
2. **이벤트 리스너 (Listener)**:
   - 각 버튼에 `window.promptNewGoal()` 바인딩 및 쿨다운 가드 적용
   - `mGoalTitle` 입력창에 `keypress (Enter)` 이벤트 바인딩으로 원터치 완료 지원
3. **비즈니스 로직 (Logic)**:
   - `promptNewGoal()` -> `showNewGoalChatStep()`
   - tasks 정규화: `(m.tasks || []).map(function(tk){ return { id: uid('task'), title: (typeof tk === 'string' ? tk : (tk && tk.title ? tk.title : '')), done: false }; })`
   - 직접 입력 시 'etc' 카테고리도 알찬 3단계 마일스톤 기본 주입
4. **피드백 & 예외처리 (Feedback)**:
   - 공백 입력 시 `toast('목표 제목을 입력해주세요')` 즉시 노출
   - 목표 생성 완료 시 `toast('목표를 만들었어요')` 및 햅틱 진동

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 HTML 디자인, CSS 스타일, 레이아웃을 임의로 변경하지 않고 완벽히 계승했는가? (네, 기존 버튼 토큰 및 클래스 재사용)
- [x] 전체 파일 덮어쓰기 없이 변경 부분만 외과수술적 diff로 작성하도록 설계되었는가? (네, 해당 함수부만 정밀 수정)
- [x] 기존 사용자의 아바타(보관함 포함), 목표, 기록, 세팅값이 100% 무손실 보존되는가? (네, 비파괴 push 및 불변 원칙 준수)
- [x] 성능 저하(불필요한 전체 리렌더링)나 다중 탭 동시성 충돌을 유발하지 않는가? (네, 정규화된 4대 뷰 디스패치 사용)

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1 (전역 인터페이스 배선)**: `index.html`에서 `window.promptNewGoal = promptNewGoal;` 및 `window.showNewGoalManualForm = showNewGoalManualForm;` 등록.
2. **Step 2 (데이터 모델 정규화)**:
   - `localGoalTemplate`에서 반환하는 tasks 규격을 확인하고, `showNewGoalReviewStep`에서 리뷰 HTML 렌더링 시 `typeof tk === 'string' ? tk : (tk.title || '')`로 방어.
   - `ngApplyBtn` 저장 시 태스크 title에 객체가 들어가지 않도록 문자열 추출 보장.
3. **Step 3 (직접 입력 폼 UX 고도화)**:
   - `mSave` 클릭 시 `title` 공백일 때 `toast('목표 제목을 입력해주세요'); return;` 추가.
   - `templateMilestones`에서 'etc' 카테고리일 때도 기본 3단계 마일스톤 생성.
   - `mGoalTitle` 인풋에 Enter 키 입력 시 `mSave.click()` 배선.
4. **Step 4 (성소 마운틴 트레일 배선 보강)**:
   - `js/sanctuary-v3-engine.js`의 `sAddGoalBtn` 및 빈 카드 버튼 클릭 시 `window.promptNewGoal()`을 직접 안전하게 호출하도록 핸들러 정돈.
5. **Step 5 (세부 마일스톤 헤더 버튼 추가)**:
   - `index.html`의 `#personalGoalsView` 헤더에 `#btnPersonalAddGoalInline` 신설 및 `promptNewGoal` 이벤트 연결.
6. **Step 6 (4대 뷰 동시 전파 결속)**:
   - 목표 저장 완료 후 `renderHome()`, `renderGoalsScreen()`, `renderCalendarScreen()`, `renderRecordsScreen()`, `window.OurgoalSanctuaryV3.render('goals')` 동시 갱신 보장.
7. **Step 7 (게이트키퍼 및 자동화 테스트 검증)**:
   - `verify-integrity-gate.js` 및 `smoke-test.js`에 검증문 추가 후 `npm test` 통과.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
> *(주의: 본 원칙은 구현 순서(⑤)와 체크리스트(⑦) 사이에 반드시 독립적으로 존재해야 하며, 생략하거나 합치는 것은 위헌입니다)*
- **시나리오 A (Zero Dead-Click)**:
  - 홈 화면 `#homeAddGoal`, 성소 트레일 `#sAddGoalBtn`, 빈 상태 카드 버튼, 세부 마일스톤 `#btnPersonalAddGoalInline` 4개 지점 전수 클릭 -> 콘솔 에러 0건 및 모달 100% 정상 팝업 확인.
- **시나리오 B (Zero Data Loss)**:
  - 10종 가상 페르소나 데이터 환경에서 신규 목표 추가 후 기존 목표 및 마일스톤 불변 딥이퀄 대조 100% PASS.
- **시나리오 C (Zero UX Regression)**:
  - 게스트 모드 및 카카오/구글 로그인 세션 유지 확인, E1/E2/E3 루프 온전성 확인.
- **시나리오 D (Full State Propagation)**:
  - 새 목표 생성 즉시 홈 화면, 목표 화면, 캘린더 화면, 기록 화면에 실시간 동시 렌더링 확인.
- **시나리오 E (자동화 게이트 통과)**:
  - `node scripts/verify-integrity-gate.js` 및 `npm test` 100% ALL PASS.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [ ] Step 1~6 순차적 외과수술적 구현 (AI 코드 축약 `// ...` 영구 금지)
- [ ] 로컬 무결성 게이트 검증: `node scripts/verify-integrity-gate.js` PASS
- [ ] 전수 클릭 검증: `node scripts/verify-all-clicks.js` PASS
- [ ] 스모크 테스트 전수 검증: `npm test` PASS
- [ ] Chrome CDP 모바일(375px) 실측 감사 및 스크린샷 캡처
- [ ] [4단계: 로컬 메인 병합 상태] 완결 후 Vercel 프리뷰(5A) 자동 실행 및 상민님께 보고

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**:
  - 목표가 0개인 빈 상태에서 목표를 생성했을 때 `personalGoalsView`의 `display:none;`이 풀리지 않는 문제 -> `renderGoalsScreen()`에서 `goals.length > 0` 검사 시 즉각 뷰 전환되도록 보장.
- **사전 방어 및 우회 로직**:
  - `window.promptNewGoal`이 미처 초기화되기 전 클릭이 발생하더라도 인라인 가드 함수가 `promptNewGoal`을 재탐색하여 호출하도록 방어.
- **롤백 계획 (Rollback Strategy)**:
  - 결함 발생 시 작업 브랜치(`feat/2026-09-20-task-es-190-goal-add-integrity`)에서 즉시 변경 파일을 되돌릴 수 있도록 git diff 관리.
- **재검증 트리거**:
  - 목표 추가 후 모달이 닫히지 않거나 화면이 갱신되지 않는 경우: 원칙 ②(배선) 및 원칙 ⑤(전파)로 복귀하여 이벤트 리스너와 렌더러 호출 순서를 재검증한다.
