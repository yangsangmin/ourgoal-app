# 엔지니어링 작업계획서 (PLAN) — 오늘의 미션 추천카드 내 안내멘트 생성 (‘뭘 할지 모르겠을 때 도움돼요’)

> **문서 ID**: PLAN-TASK-ES-262-TODAY-CARD-GUIDE-TEXT  
> **요구사항 연계**: [REQ-TASK-ES-262-TODAY-CARD-GUIDE-TEXT](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-262-TODAY-CARD-GUIDE-TEXT.md)  
> **티켓 연계**: #TASK-ES-262 (노션 생각 메모장 [05]번, Page ID: `3dc598db-9096-8189-9cf6-d3a8d2770ca7`)  
> **작성 일시**: 2026-09-25  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**:
  - 홈 탭 '오늘의 미션' 카드 헤더에서 '오늘의 카드' 레이블 옆에 1pt 작은 폰트(11px / 0.6875rem)로 '뭘 할지 모르겠을 때 도움돼요(내 목표기반)' 서브 안내멘트를 `.today-card-guide-hint` 클래스로 정형화.
  - 375px 모바일 뷰포트에서 가로 스크롤 및 텍스트 겹침 없이 자연스럽게 어우러지도록 반응형 CSS 및 다크/라이트 테마 고대비 토큰 완비.
  - 기존 미션 생성/저장 로직 및 아코디언 토글 로직을 100% 무손실 보존.
- **영향 받는 파일 목록 전수**:
  - `index.html`: `renderTodayMissionCard` 내 마크업 클래스 및 접근성 속성 정돈.
  - `ui.css`: `.today-card-guide-hint` 1pt 축소 폰트 및 모바일 375px 반응형 스타일.
  - `docs/rules/TICKETS.md`: `#TASK-ES-262` 티켓 등록.
  - `tests/today-mission-card-guide.test.js`: 신규 단위 테스트 스위트 (`const SUITE_TASK = 'TASK-ES-262';`).
  - `scripts/smoke-test.js`: `#TASK-ES-262` 검증 단언문 추가.
  - `reports/TASK-ES-262/claims.json`: GitHub Court 심사 청구서.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: 홈 화면에서 오늘의 추천 미션을 마주한 유저에게 '내 목표 기반의 엄선된 제안'임을 명확한 마이크로카피로 인지시켜 행동 실행 마찰을 제로화함.
- **[원인] (Technical Causes)**:
  - 안내멘트가 인라인 스타일로 임의 적용되어 전용 CSS 클래스 및 스타일 토큰 체계가 부재함.
  - `.ct-label` 대비 1pt 축소 규격(11px)이 테마별 가독성 및 375px 모바일 반응형으로 체계화되지 못함.
- **[중심 배선] (Core Wire & State)**:
  - `renderTodayMissionCard()` 함수 내 헤더 마크업: `<div class="ct-label" style="margin:0;">오늘의 카드</div>` 바로 옆에 `<span class="today-card-guide-hint" title="뭘 할지 모르겠을 때 도움돼요(내 목표기반)">뭘 할지 모르겠을 때 도움돼요(내 목표기반)</span>` 배치.
  - `ui.css`에 전용 클래스 `.today-card-guide-hint`를 배선하여 1pt 축소 폰트(`0.6875rem` / `11px`), 배경, 여백, 모바일 반응형을 규격화.
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - 기존 미션 생성 API 호출(`requestTodayMission`), 캐시 저장(`state.profile.settings.todayMissions`), 아코디언 토글(`btnToggleMissionAccordion`) 동작 100% 불변 보존.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[홈 화면 렌더링]` ➔ `[renderTodayMissionCard() 실행]` ➔ `['오늘의 카드' 헤더 및 .today-card-guide-hint 렌더링]` ➔ `[유저가 마이크로카피 인지 후 미션 수행]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `index.html` | 헤더 마크업에 .today-card-guide-hint 클래스 부여 | +3줄 | -1줄 | +2줄 | 외과수술적 diff |
| `ui.css` | .today-card-guide-hint 1pt 축소 폰트 및 375px 반응형 스타일 | +15줄 | 0줄 | +15줄 | CSS 토큰 준수 |
| `tests/today-mission-card-guide.test.js` | 신규 단위 검증 스위트 신설 | +65줄 | 0줄 | +65줄 | 신규 파일 |
| `scripts/smoke-test.js` | 스모크 테스트 단언문 추가 | +20줄 | 0줄 | +20줄 | 회귀 방지 |
| `docs/rules/TICKETS.md` | 작업 티켓 등록 | +1줄 | 0줄 | +1줄 | 문서 갱신 |

---

## 4. [원칙 ④] 세부 계획 수립 및 헌법 8원칙 준수 (Detailed Planning)
- 승인선 5대 영역 해당 없음.
- 헌법 제3조 제1항 기존 기능 훼손 금지 엄수.
- 헌법 제7조 제8항 375px 모바일 시각 규격 준수.

---

## 5. [원칙 ⑤] 외과수술적 구현 (Surgical Implementation)
- **마크업**:
  ```javascript
  '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
    '<div class="ct-label" style="margin:0;">오늘의 카드</div>' +
    '<span class="today-card-guide-hint" title="뭘 할지 모르겠을 때 도움돼요(내 목표기반)">뭘 할지 모르겠을 때 도움돼요(내 목표기반)</span>' +
  '</div>'
  ```
- **CSS**:
  ```css
  /* [#TASK-ES-262] 오늘의 미션 추천카드 내 안내멘트 ('뭘 할지 모르겠을 때 도움돼요(내 목표기반)') */
  .today-card-guide-hint {
    font-size: 0.6875rem; /* 11px, .ct-label(12px)보다 1pt 축소 규격 */
    color: var(--brand);
    background: rgba(99, 102, 241, 0.08);
    padding: 2px 7px;
    border-radius: 6px;
    font-weight: 600;
    line-height: 1.3;
    display: inline-flex;
    align-items: center;
    white-space: nowrap;
  }
  @media (max-width: 375px) {
    .today-card-guide-hint {
      font-size: 0.65625rem; /* 10.5px */
      padding: 1px 5px;
      letter-spacing: -0.3px;
    }
  }
  ```

---

## 6. [원칙 ⑥] 재검증 계획 (Re-verification Plan)
- **단위 테스트**: `tests/today-mission-card-guide.test.js` 100% ALL PASS
- **스모크 테스트**: `scripts/smoke-test.js` 380개 전 항목 통과
- **헌법 게이트**: `scripts/verify-integrity-gate.js` 38개 전 항목 통과
- **Court 법정 심사**: `reports/TASK-ES-262/claims.json` 작성 및 GitHub Court 합격 판정 획득

---

## 7. [원칙 ⑦] 회귀 결함 방지 (Regression Prevention)
- `requestTodayMission`, `saveProfile`, 아코디언 토글 핸들러를 온전히 보존하여 기존 기능 100% 무결 유지.

---

## 8. [원칙 ⑧] 법정 심사 청구 명세 (Court Claims)
- 파일: `reports/TASK-ES-262/claims.json`
- Claim 1: index.html 내 오늘의 미션 카드 헤더에 '오늘의 카드' 및 '뭘 할지 모르겠을 때 도움돼요(내 목표기반)' 텍스트가 렌더링됨
- Claim 2: index.html 내 안내멘트 요소에 class="today-card-guide-hint"가 지정되어 있음
- Claim 3: ui.css 내 .today-card-guide-hint에 1pt 축소 폰트 규격(0.6875rem)이 지정되어 있음
- Claim 4: ui.css 내 375px 모바일 반응형 미디어 쿼리가 정의되어 있음
- Claim 5: tests/today-mission-card-guide.test.js 단위 검증 파일이 존재하고 정상 작동함
