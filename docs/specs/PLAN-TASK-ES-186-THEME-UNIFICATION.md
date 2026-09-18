# 엔지니어링 작업계획서 (PLAN) — 성소 테마 기준 3대 테마(블랙·화이트·도심) 조형 및 동작 100% 완전 동기화

> **문서 ID**: PLAN-TASK-ES-186-THEME-UNIFICATION  
> **요구사항 연계**: [REQ-TASK-ES-186-THEME-UNIFICATION](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-186-THEME-UNIFICATION.md)  
> **티켓 연계**: #TASK-ES-186  
> **작성 일시**: 2026-09-19  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**: 성소(focus-sanctuary)에만 국한되어 있던 V3 렌더링 엔진(`js/sanctuary-v3-engine.js`)과 조형 룰셋(`ui.css` 5386~7136행)을 4대 테마 공통(`focus-sanctuary`, `black`, `white`, `urban-city`)으로 완전 개방하여, 모든 테마에서 성소와 100% 동일한 화면 조형과 동작을 누리게 하고, 오직 색상 팔레트만 테마별 고유 토큰으로 차별화한다.
- **영향 받는 파일 목록 전수**:
  - `js/sanctuary-v3-engine.js`: `isFocusSanctuary()`를 4개 테마 공통 허용으로 확장하고, 테마 색상 맵 및 렌더링 파이프라인 개방.
  - `index.html`: `applyTheme` 시점에 현재 활성 탭 V3 렌더러 연계 호출 및 4대 뷰 동시 전파.
  - `ui.css`: `[data-theme="focus-sanctuary"]`로 스코핑된 조형 룰셋을 4대 테마 공통 셀렉터로 통합하고, 화이트/블랙/도심 V3 컴포넌트 고시인성 컬러 룰셋 보강.
  - `docs/rules/TICKETS.md`: `#TASK-ES-186` 진행 및 완료 상태 등록.
  - `scripts/smoke-test.js`: 4대 테마 V3 엔진 구동 및 조형 동기화 단언문 추가.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: '화면 조형(Layout & Topology)'과 '색상 테마(Color Theme)'의 완벽한 관심사 분리(Separation of Concerns). 레이아웃은 4개 테마가 100% 동일한 DOM 뼈대를 공유하고, CSS 변수와 테마 데이터 속성(`data-theme`)이 색채만을 주입하도록 일원화한다.
- **[원인] (Technical Causes)**: 과거 기능 추가 시 성소 전용 선택자(`[data-theme="focus-sanctuary"]`)에만 신규 V3 조형을 바인딩하고 타 테마를 레거시 fallback으로 방치했던 구조적 결함.
- **[중심 배선] (Core Wire & State)**:
  - `document.documentElement.getAttribute('data-theme')`: 4대 테마 식별자 (`focus-sanctuary`, `black`, `white`, `urban-city`).
  - `OurgoalSanctuaryV3.render(tab)`: 테마에 관계없이 활성 탭의 V3 조형(마운틴 트레일, 캘린더, 히트맵, 레이더)을 무결하게 렌더링.
  - `state.profile.settings.theme`: Supabase 및 로컬스토리지 영속화 동기화.
- **[핵심 안전장치] (Critical Safety & Persistence)**: 성소 테마의 기존 스타일과 토큰은 1바이트도 수정하지 않고 현행 100% 보존하며, 화이트/블랙/도심의 배경 및 텍스트 대비가 4.5:1 이상(WCAG AA)을 유지하도록 보호.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[설정 > 테마 클릭] -> [applyTheme(tid)] -> [data-theme 속성 갱신] -> [CSS 전역 변수 치환] -> [OurgoalSanctuaryV3.render] -> [성소와 100% 동일한 V3 조형 렌더링] -> [토스트 피드백]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `js/sanctuary-v3-engine.js` | 4대 테마 공통 실행 게이트 개방 및 컬러 맵 연동 | +15줄 | -5줄 | +10줄 | 비파괴 확장 |
| `index.html` | applyTheme 시 활성 탭 V3 렌더러 즉각 동기화 | +5줄 | 0줄 | +5줄 | 배선 보강 |
| `ui.css` | 성소 조형 룰셋 4대 테마 공통 셀렉터 통합 및 컬러 튜닝 | +80줄 | -20줄 | +60줄 | CSS 토큰 준수 |
| `scripts/smoke-test.js` | 4대 테마 V3 조형 및 동작 동기화 단언문 추가 | +20줄 | 0줄 | +20줄 | 테스트 보강 |
| `docs/rules/TICKETS.md` | #TASK-ES-186 티켓 등록 | +2줄 | 0줄 | +2줄 | 규범 준수 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**: `#sanctuaryGoalsView`, `#sanctuaryCalendarView`, `#sanctuaryRecordsView`, `#sanctuaryCommView` 4대 V3 슬롯이 4개 테마 모두에서 `display: block`으로 완전 활성화.
2. **이벤트 리스너 (Listener)**: 마운틴 트레일 목표 클릭, 캘린더 모드 전환, 히트맵 필터, 레이더 1:1 DM 등 72개 인터랙션이 4개 테마에서 100% 동일하게 동작.
3. **비즈니스 로직 (Logic)**: 실제 DB 및 전역 `state.profile`과 직통 결속된 비즈니스 로직 100% 실행 (빈 stub이나 목데이터 0건).
4. **피드백 & 예외처리 (Feedback)**: 테마 전환 시 햅틱 진동, 즉각적인 화면 전환, 성공 토스트 및 에러 방어 완비.

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 성소(focus-sanctuary) 테마의 기존 룰셋, 에메랄드 토큰, 레이아웃을 100% 보존했는가?
- [x] 전체 파일 덮어쓰기 없이 외과수술적 diff로 안전하게 수정하는가?
- [x] 기존 사용자의 아바타(320종 보관함), 목표(마일스톤), 기록(히트맵), 세팅값이 단 1바이트도 손상되지 않는가?
- [x] 화이트 테마에서 배경과 글자가 겹쳐 보이지 않는 가독성 결함이 원천 차단되는가?

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1 (`js/sanctuary-v3-engine.js` 게이트 개방)**:
   - `isFocusSanctuary()`를 `isValidAppTheme(theme)`으로 승격하여 `focus-sanctuary`, `black`, `white`, `urban-city` 모두 `true`를 반환하도록 수정.
   - `renderSanctuaryV3`가 4대 테마 전수에서 동작하도록 보장.
2. **Step 2 (`index.html` 배선 연계)**:
   - `applyTheme(themeId)` 함수 내에서 DOM 속성 세팅 후 `window.OurgoalSanctuaryV3.render(state.activeTab)`를 호출하여 테마 변경 시 활성 화면이 즉각 새 테마 컬러로 리렌더링되도록 결속.
3. **Step 3 (`ui.css` 조형 룰셋 4대 테마 공통화 및 테마별 컬러 분기)**:
   - `[data-theme="focus-sanctuary"]`로 시작하는 상하 조형 룰셋에 `[data-theme="black"]`, `[data-theme="white"]`, `[data-theme="urban-city"]` 셀렉터를 병합.
   - 화이트 테마 전용 룰셋에 V3 카드, 마운틴 트레일, 서브탭, 캘린더 타임라인의 라이트 전용 색상 토큰(`#FFFFFF`, `#F8FAFC`, `#0F172A`, `#CBD5E1`) 주입.
   - 블랙 테마 전용 룰셋에 순수 OLED 블랙(`#000000`) 및 순백 텍스트(`#FFFFFF`) 주입.
   - 도심 테마 전용 룰셋에 슬레이트 네이비(`#0B0F19`) 및 시안 네온(`#38BDF8`) 주입.
4. **Step 4 (스모크 테스트 및 무결성 게이트 검증)**:
   - `scripts/smoke-test.js`에 테마별 V3 엔진 실행 및 CSS 셀렉터 단언문 추가.
   - `npm test` 및 `node scripts/verify-integrity-gate.js` 전수 실행.
5. **Step 5 (브라우저 실측 및 시각 자가감사)**:
   - Chrome CDP를 통해 4대 테마 전수 모바일(375×812) 캡처 및 시각 자가감사표 작성.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
- **시나리오 A (Zero Dead-Click)**: 4대 테마 각각에서 목표 알약, 캘린더 모드 버튼, 기록 세그먼트, 레이더 프로필 전수 클릭 -> 콘솔 에러 0건 확인.
- **시나리오 B (Zero Data Loss)**: 10종 가상 페르소나 데이터 주입 후 테마 전환 시뮬레이션 -> 100% 무손실 딥이퀄 통과.
- **시나리오 C (Zero UX Regression)**: 성소 테마의 비주얼과 동작이 기존과 100% 동일하게 유지되는지 회귀 검증.
- **시나리오 D (Full State Propagation)**: 테마 변경 시 홈/목표/캘린더/기록/소통 5대 탭 전체에 즉시 테마 색상이 전파되는지 확인.
- **시나리오 E (자동화 게이트 통과)**: 324개 이상 스모크 테스트 및 22개 무결성 게이트 전수 통과 확인.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [ ] Step 1: `js/sanctuary-v3-engine.js` 4대 테마 게이트 개방
- [ ] Step 2: `index.html` applyTheme 연계 배선
- [ ] Step 3: `ui.css` 4대 테마 조형 셀렉터 통합 및 테마별 컬러 분기
- [ ] Step 4: `scripts/smoke-test.js` 단언문 추가 및 `npm test` ALL PASS
- [ ] Step 5: `node scripts/verify-integrity-gate.js` ALL PASS
- [ ] Step 6: 4대 테마 브라우저 실측 스크린샷 확보 및 제7조 8항 시각 자가감사 완료
- [ ] [4단계: 로컬 메인 병합 상태 및 5A 프리뷰 배포] 완결 후 상민님께 보고

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**: CSS 셀렉터가 너무 길어지거나 명시도(Specificity) 충돌로 인해 특정 테마에서 인라인 스타일이 덮어씌워지지 않는 문제.
- **사전 방어 및 우회 로직**: 테마별 고시인성 섹션에 명시도 높은 셀렉터(`html[data-theme="..."]`)를 유지하여 컬러 충돌 원천 차단.
- **롤백 계획 (Rollback Strategy)**: 변경 파일 원상 복구 및 `git checkout main`.
- **재검증 트리거**: 캘린더나 마운틴 트레일 노드가 화이트 테마에서 배경과 동화되어 보이지 않을 경우 [원칙 ③ 화이트 룰셋]으로 복귀하여 보더 및 배경 대비 재조정.
