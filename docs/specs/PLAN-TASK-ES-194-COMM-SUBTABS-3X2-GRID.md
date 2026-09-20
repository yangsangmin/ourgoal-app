# 기술 설계서 (PLAN) — 소통 탭 6종 서브탭 2줄(3×2 그리드) 조형 전면 정돈

> **문서 ID**: PLAN-TASK-ES-194-COMM-SUBTABS-3X2-GRID  
> **티켓 연계**: #TASK-ES-194  
> **작성 일시**: 2026-09-20  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**: "이런 문제 더 있는지 찾아봐" -> 정밀 전수 조사 결과 보고 후 -> "단계별로 모두 진행해"
- **표면적 현상**: 소통 탭 서브탭 6종이 1열 flex-nowrap으로 가로스크롤되어 `[🎁 마니또]`가 우측에 걸치고 `[📤 공유]`는 100% 화면 밖으로 잘림 (`scrollWidth: 440px > 373px`).
- **기저 원인**: 서브탭 컨테이너가 가로 스크롤에 의존하고 있어 모바일 375px 환경에서 시각적 단절 및 터치 불능 유발.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: E3 (동류 소통 루프)
- **[본질] (Essence)**: 소통 탭 6대 핵심 기능의 100% 한눈 가시화 및 모바일 375px 3×2 대칭 조형 완성.
- **[원인] (Root Causes)**:
  1. 서브메뉴 추가 시 1열 flex 가로 나열로 인한 375px 가로폭 초과.
  2. 기록 탭에서 확립된 3×2 그리드 조형 규격의 미반영.
  3. 피드 상단 서브탭-보기옵션-카테고리 3중 바 누적.
- **[중심] (Core Bottleneck & Anchor)**: `.comm-subtabs-grid` 3×2 대칭 그리드를 선언하여 가로스크롤 0건(`scrollWidth === clientWidth`) 및 40px 터치 타겟을 보장하는 것.
- **[핵심] (Critical Safety & Termination)**: 기존 6개 서브탭의 렌더러 분기 및 DM 뱃지 로직의 100% 무손실 보존.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **외과수술적 변경 범위**:
  1. `index.html`: `renderCommScreen()` 내 서브탭 컨테이너 클래스를 `comm-subtabs comm-subtabs-clean comm-subtabs-grid`로 배선.
  2. `ui.css`: `.comm-subtabs-grid`에 3열 그리드(`repeat(3, 1fr)`), 갭 6px, 버튼 최소 높이 40px, 패딩 6px 스타일 정의.
  3. `scripts/verify-integrity-gate.js`: [검증 18] 신설.
  4. `scripts/smoke-test.js`: 스모크 테스트 신설.

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)
- **비판적 자기 검토**: 세로 공간이 38px가량 증가하나, 서브탭 버튼 내부 패딩을 8px로 컴팩트화하여 피드 콘텐츠 공간 잠식을 최소화함.
- **엣지 케이스**:
  - DM 알림 발생 시 뱃지(빨간 점)가 텍스트 오른쪽 옆에 안정적으로 표시되도록 flex 배치 보장.
  - 320px 극소형 뷰포트에서도 글자 줄바꿈이 없도록 폰트 크기 11px 유지.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)
- **구체적 실행 시퀀스**:
  1. `index.html` 수정: `renderCommScreen` 내 서브탭 컨테이너 클래스 지정.
  2. `ui.css` 수정: `.comm-subtabs-grid` 및 내부 버튼 반응형 스타일 선언.
  3. `scripts/verify-integrity-gate.js` & `scripts/smoke-test.js` 검증 결속.
  4. `npm test` 단위 테스트 및 33개 게이트 ALL PASS 확인.
  5. Chrome CDP 375px 모바일 실측 및 스크린샷 캡처 (`screenshot-es194-comm-3x2-grid.png`).

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)
> *(주의: 본 원칙은 절차 정리(⑤)와 단계별 실행(⑦) 사이에 반드시 독립적으로 존재해야 하며, 생략하거나 타 원칙과 합치는 것은 위헌입니다)*
- **단일 실패점 (SPOF) 점검**: 기존 `.comm-subtab` 이벤트 리스너가 클래스 변경 후에도 100% 정상 작동하는지 점검. `querySelector('[data-sub]')`로 바인딩하므로 클래스명 추가와 무관하게 100% 안정 작동함.
- **가정의 타당성 검증**: 3×2 그리드가 375px 화면에서 `scrollWidth === clientWidth`를 완벽히 만족함을 검증.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)
- `npm test` 332개+ 단위 테스트 100% ALL PASS.
- 33개 무결성 게이트 ALL PASS.
- 737개 버튼 전수 인터랙션 Zero Dead Click 100% PASS.
- 모바일 375px 실측: 가로스크롤 0건 (`scrollWidth === clientWidth (375px)`), 잘림 0건 (`clippedCount === 0`), 터치 타겟 40px 보장.

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)
- **예상 블로커**: 다른 테마(블랙, 화이트, 도심)에서 배경색이 깨질 위험 -> 테마 CSS 변수(`var(--surface-2)`, `var(--card)`) 결속.
- **재검증 트리거**: CDP 실측에서 `clippedCount > 0` 발견 시 즉시 컬럼 및 패딩 재보정.
