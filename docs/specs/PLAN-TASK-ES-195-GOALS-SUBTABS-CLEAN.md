# 실행 계획서 (PLAN) — 목표 탭 서브탭 5종 5열 그리드 단정화 & 통계 버튼 40px 정상화

> **문서 ID**: PLAN-TASK-ES-195-GOALS-SUBTABS-CLEAN  
> **티켓 연계**: #TASK-ES-195  
> **작성 일시**: 2026-09-20  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 및 작업 목표 정의
- **목표 1**: 목표 탭 서브탭 5종(`개인 목표`, `루틴`, `팀 연계`, `팀 목표`, `📖 템플릿`)을 375px 모바일 뷰포트에서 가로스크롤 0건(`scrollWidth === clientWidth`)의 5열 그리드로 배치하여 `📖 템플릿`의 은폐 및 잘림을 완벽 해소.
- **목표 2**: 기록 탭 성취 통계 기간 버튼 5종(`.s-seg-pill`)의 높이를 기존 26px에서 최소 40px(`min-height: 40px !important;`)로 정상화하여 터치 접근성 확보.
- **목표 3**: 완료 후 6대 탭 및 전수 737개 버튼 Dead-Click 전수 재감사 완결.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심
- **[본질]**: 모바일 한 손 사용 환경에서 5대 목표 모드와 통계 필터의 완전한 시각적 안정성과 인체공학적 조작성 확보.
- **[원인]**: 서브탭 라벨의 비대함(`팀 연계 개인목표`, `📖 템플릿 백과사전`), flex-nowrap 가로 스크롤 방식, `.s-seg-pill`의 빈약한 패딩(5px).
- **[중심]**: 
  - `['teamLinked','팀 연계']`, `['templateEncyclopedia','📖 템플릿']` 라벨 단정화.
  - `#goalsSubtabs.goals-subtabs-grid`: `repeat(5, 1fr)` 선언.
  - `.s-seg-pill`: `min-height: 40px !important;` 선언.
- **[핵심]**: 목표 탭 5대 서브탭 전환 렌더러 로직 및 통계 히트맵 필터링 100% 무손실 보존.

---

## 3. [원칙 ③] 구체적 코드 변경 계획

### 1) `index.html`
- 라인 276: `#goalsSubtabs`에 `goals-subtabs-grid` 클래스 추가:
  ```html
  <div class="comm-subtabs comm-subtabs-clean goals-subtabs-grid" id="goalsSubtabs" style="margin-bottom:14px;"></div>
  ```
- 라인 17191 (`renderGoalsScreen`):
  ```javascript
  subtabs.innerHTML = [['personal','개인 목표'],['routine','루틴'],['teamLinked','팀 연계'],['team','팀 목표'],['templateEncyclopedia','📖 템플릿']].map(function(s){
  ```

### 2) `ui.css`
- `#goalsSubtabs.goals-subtabs-grid` 5열 그리드 스타일 선언 (4대 테마 포함):
  ```css
  /* ============ [#TASK-ES-195] 목표 탭 서브탭 5종 5열 그리드 조형 정돈 ============ */
  [data-theme="focus-sanctuary"] #goalsSubtabs.goals-subtabs-grid,
  [data-theme="black"] #goalsSubtabs.goals-subtabs-grid,
  [data-theme="white"] #goalsSubtabs.goals-subtabs-grid,
  [data-theme="urban-city"] #goalsSubtabs.goals-subtabs-grid,
  html[data-theme="focus-sanctuary"] #goalsSubtabs.goals-subtabs-grid,
  html[data-theme="black"] #goalsSubtabs.goals-subtabs-grid,
  html[data-theme="white"] #goalsSubtabs.goals-subtabs-grid,
  html[data-theme="urban-city"] #goalsSubtabs.goals-subtabs-grid,
  #goalsSubtabs.goals-subtabs-grid {
    display: grid !important;
    grid-template-columns: repeat(5, 1fr) !important;
    gap: 4px !important;
    padding: 4px !important;
    margin-bottom: 12px !important;
    overflow-x: visible !important;
    box-sizing: border-box !important;
    width: 100% !important;
  }

  [data-theme="focus-sanctuary"] #goalsSubtabs.goals-subtabs-grid .comm-subtab,
  [data-theme="black"] #goalsSubtabs.goals-subtabs-grid .comm-subtab,
  [data-theme="white"] #goalsSubtabs.goals-subtabs-grid .comm-subtab,
  [data-theme="urban-city"] #goalsSubtabs.goals-subtabs-grid .comm-subtab,
  html[data-theme="focus-sanctuary"] #goalsSubtabs.goals-subtabs-grid .comm-subtab,
  html[data-theme="black"] #goalsSubtabs.goals-subtabs-grid .comm-subtab,
  html[data-theme="white"] #goalsSubtabs.goals-subtabs-grid .comm-subtab,
  html[data-theme="urban-city"] #goalsSubtabs.goals-subtabs-grid .comm-subtab,
  #goalsSubtabs.goals-subtabs-grid .comm-subtab {
    flex: none !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    min-height: 40px !important;
    padding: 6px 2px !important;
    font-size: 11px !important;
    font-weight: 700 !important;
    letter-spacing: -0.3px !important;
    white-space: nowrap !important;
    border-radius: 9px !important;
    box-sizing: border-box !important;
    width: 100% !important;
    cursor: pointer !important;
    text-align: center !important;
  }

  @media (max-width: 375px) {
    #goalsSubtabs.goals-subtabs-grid {
      gap: 3px !important;
      padding: 3px !important;
    }
    #goalsSubtabs.goals-subtabs-grid .comm-subtab {
      font-size: 10px !important;
      padding: 6px 1px !important;
      min-height: 40px !important;
    }
  }

  /* ============ [#TASK-ES-195] 기록 탭 성취 통계 기간 버튼 40px 정상화 ============ */
  .s-seg-pill,
  html[data-theme="focus-sanctuary"] .s-seg-pill,
  html[data-theme="black"] .s-seg-pill,
  html[data-theme="white"] .s-seg-pill,
  html[data-theme="urban-city"] .s-seg-pill {
    min-height: 40px !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    box-sizing: border-box !important;
    padding: 8px 14px !important;
  }
  ```

### 3) `scripts/smoke-test.js`
- 라인 7223 라벨 호환성 검증:
  ```javascript
  assert.ok(indexHtml.includes("['templateEncyclopedia','📖 템플릿']") || indexHtml.includes("['templateEncyclopedia','📖 템플릿 백과사전']"), 'goalsSubtabs 내 템플릿 서브탭 등록 확인');
  ```

### 4) `scripts/verify-integrity-gate.js`
- `[검증 19/19]` 신설:
  - `goals-subtabs-grid` 클래스 배선 확인.
  - `['teamLinked','팀 연계']`, `['templateEncyclopedia','📖 템플릿']` 라벨 정돈 확인.
  - `ui.css` 내 5열 그리드 및 `.s-seg-pill` 40px 규격 확인.

---

## 4. [원칙 ④] 1~3 재검토 및 엣지 케이스
- 서브탭 5개 모두 40px 높이 확보 여부: CSS `min-height: 40px !important;`로 보장.
- 통계 기간 버튼 5종 모두 40px 높이 확보 여부: `.s-seg-pill` `min-height: 40px !important;`로 보장.
- 4대 테마 전반에서 스타일 덮어쓰기 무결성: 모든 테마 선택자 명시.

---

## 5. [원칙 ⑤] 해결 절차 및 실행 순서
1. 코드 수정: `index.html`, `ui.css`, `scripts/smoke-test.js`, `scripts/verify-integrity-gate.js`.
2. 게이트 및 단위 테스트 실행: `node scripts/verify-integrity-gate.js` & `npm test`.
3. Chrome CDP 375px 모바일 실측 스크립트 작성 및 실행:
   - 목표 탭 5종 서브탭 `scrollWidth === clientWidth`, 5개 탭 높이 >= 40px 확인.
   - 기록 탭 통계 버튼 5종 높이 >= 40px 확인.
   - 스크린샷 증적 저장.
4. 로컬 `main` 브랜치 머지 (`--no-ff`).
5. 6대 탭 및 737개 버튼 전수 Dead-Click 재감사 실행.
6. Tri-Sync 동기화 및 Vercel 프리뷰 배포.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)
> *(주의: 본 원칙은 절차 정리(⑤)와 단계별 실행(⑦) 사이에 반드시 독립적으로 존재해야 하며, 생략하거나 타 원칙과 합치는 것은 위헌입니다)*
- **단일 실패점 (SPOF) 점검**: 목표 서브탭 전환 시 `state.goalsSubTab` 키값(`personal`, `routine`, `teamLinked`, `team`, `templateEncyclopedia`)이 변경되지 않고 라벨만 단정화되었으므로 기존 라우팅 로직의 SPOF 위험 0건. `.s-seg-pill` 높이 상향 시 통계 히트맵 카드 및 컨테이너의 상하 공간 레이아웃 왜곡 여부 점검 완료.
- **가정의 타당성 검증**: 5개 탭이 `repeat(5, 1fr)`로 배치되었을 때 모바일 375px 화면에서 `scrollWidth === clientWidth`를 만족함을 검증.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)
- `npm test` 단위 테스트 100% ALL PASS.
- 34개 무결성 게이트 ALL PASS.
- 737개 버튼 전수 인터랙션 Zero Dead Click 100% PASS.
- 모바일 375px 실측: 가로스크롤 0건 (`scrollWidth === clientWidth`), 잘림 0건 (`clippedCount === 0`), 서브탭 및 통계 버튼 40px 터치 타겟 보장.

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)
- **예상 블로커**: 다른 테마(블랙, 화이트, 도심)에서 서브탭 배경색이나 테두리 깨질 위험 -> 테마별 선택자 완전 결속.
- **재검증 트리거**: CDP 실측에서 `clippedCount > 0` 발견 시 즉시 컬럼 및 패딩 재보정.

