# 엔지니어링 작업계획서 (PLAN) — 나만의 홈 구성 연동 전수조사 및 자동 연동 시스템화

> **문서 ID**: PLAN-TASK-ES-263-HOME-CUSTOMIZER-AUTO-SYNC  
> **요구사항 연계**: [REQ-TASK-ES-263-HOME-CUSTOMIZER-AUTO-SYNC](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-263-HOME-CUSTOMIZER-AUTO-SYNC.md)  
> **티켓 연계**: #TASK-ES-263 (노션 생각 메모장 [06]번, Page ID: `3dc598db-9096-8102-a401-e5e19597df18`)  
> **작성 일시**: 2026-09-25  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**:
  - 홈 탭 내 주요 위젯 전수조사 및 선언적 `data-home-widget` 속성 마크업 부여.
  - `js/customize.js` 내에 `discoverWidgets()` 및 `getEffectiveWhitelist()` 동적 레지스트리 엔진을 구축하여, 향후 위젯 추가/변경/삭제 시 나만의 홈 구성이 100% 자동 연동되도록 시스템화.
  - `crewPacingWidget`(실시간 동류 레이스)을 동적으로 자동 탐색하여 유저 토글 지원.
  - 상단 고정 원칙(`levelBadgeRow`, `captureCardBox`) 불변 보존.
- **영향 받는 파일 목록 전수**:
  - `index.html`: 홈 위젯 선언적 메타데이터 속성 부여.
  - `js/customize.js`: 동적 자동 탐색 엔진 및 연동 파이프라인.
  - `docs/rules/TICKETS.md`: `#TASK-ES-263` 티켓 등록.
  - `tests/home-customizer-auto-sync.test.js`: 신규 단위 테스트 스위트.
  - `scripts/smoke-test.js`: `#TASK-ES-263` 검증 단언문 추가.
  - `reports/TASK-ES-263/claims.json`: GitHub Court 심사 청구서.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: 정적 하드코딩 배열의 구조적 한계를 극복하고, DOM 마크업 선언만으로 나만의 홈 구성이 스스로 연동되는 자율형 레지스트리 아키텍처 구축.
- **[원인] (Technical Causes)**:
  - 위젯 메타데이터가 `customize.js`에 정적으로 묶여 있어 화면 변경 시 동기화 단절 발생.
  - 런타임 DOM 탐색 파이프라인의 부재로 인해 새 위젯이나 복원된 위젯(`crewPacingWidget`) 누락.
- **[중심 배선] (Core Wire & State)**:
  - `index.html` 내 `data-home-widget="<id>"` ➔ `discoverWidgets()`가 DOM 스캔 ➔ `getEffectiveWhitelist()` ➔ `open()` 모달 UI 렌더링 및 `apply()` 실시간 적용.
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - `CORE_IDS`에 등록된 상단 고정 항목(`levelBadgeRow`, `captureCardBox`)은 `normalize()` 및 `apply()`에서 절대 숨겨지지 않도록 불변 잠금.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[홈 화면 마크업 data-home-widget 선언]` ➔ `[discoverWidgets() 동적 탐색]` ➔ `[getEffectiveWhitelist() 생성]` ➔ `[나만의 홈 구성 모달 토글]` ➔ `[settings.homeLayout 저장 및 apply() 실시간 반영]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `index.html` | 위젯들에 data-home-widget 속성 선언 | +10줄 | -10줄 | 0줄 | 선언적 속성 부여 |
| `js/customize.js` | discoverWidgets 및 getEffectiveWhitelist 엔진 탑재 | +40줄 | -5줄 | +35줄 | 동적 레지스트리 |
| `tests/home-customizer-auto-sync.test.js` | 신규 단위 검증 스위트 신설 | +100줄 | 0줄 | +100줄 | 신규 파일 |
| `scripts/smoke-test.js` | 스모크 테스트 단언문 추가 | +20줄 | 0줄 | +20줄 | 회귀 방지 |
| `docs/rules/TICKETS.md` | 작업 티켓 등록 | +1줄 | 0줄 | +1줄 | 문서 갱신 |

---

## 4. [원칙 ④] 세부 계획 수립 및 헌법 8원칙 준수 (Detailed Planning)
- 승인선 5대 영역 해당 없음 (기존 기능 삭제 없음, 비파괴 호환).
- 헌법 제1조 제4항 제5호 상태 불일치 방지 준수.
- 헌법 제7조 제8항 375px 모바일 시각 규격 준수.

---

## 5. [원칙 ⑤] 외과수술적 구현 (Surgical Implementation)
- **마크업 선언 표준**:
  ```html
  <div id="crewPacingWidget" class="crew-pacing-widget card"
       data-home-widget="crewPacingWidget"
       data-widget-label="실시간 동류 레이스"
       data-widget-hint="오늘 달성 레이스 및 페이스메이커 위젯">
  ```
- **동적 레지스트리 엔진**:
  ```javascript
  function discoverWidgets(){
    if(typeof document === 'undefined' || !document.querySelectorAll) return WHITELIST.slice();
    var discovered = [];
    var seen = {};
    var domWidgets = document.querySelectorAll('[data-home-widget]');
    if(domWidgets && domWidgets.length > 0){
      Array.prototype.forEach.call(domWidgets, function(el){
        var id = el.getAttribute('data-home-widget') || el.id;
        if(!id || seen[id]) return;
        seen[id] = true;
        var label = el.getAttribute('data-widget-label') || el.title || id;
        var hint = el.getAttribute('data-widget-hint') || '';
        var fixed = el.getAttribute('data-widget-fixed') === 'true' || CORE_IDS.indexOf(id) >= 0;
        discovered.push({ id: id, label: label, hint: hint, fixed: fixed });
      });
    }
    WHITELIST.forEach(function(w){
      if(!seen[w.id]){ seen[w.id] = true; discovered.push(w); }
    });
    return discovered;
  }
  ```

---

## 6. [원칙 ⑥] 절차 재검증 계획 및 완료 조건 (Re-verification Plan & Definition of Done)
- **단위 테스트**: `tests/home-customizer-auto-sync.test.js` 100% ALL PASS
- **스모크 테스트**: `scripts/smoke-test.js` 381개 전 항목 통과
- **헌법 게이트**: `scripts/verify-integrity-gate.js` 38개 전 항목 통과
- **Court 법정 심사**: `reports/TASK-ES-263/claims.json` 작성 및 GitHub Court 합격 판정 획득

---

## 7. [원칙 ⑦] 구현 파일 범위 및 회귀 방지 (Target Files & Safety)
- `index.html`: `data-home-widget` 선언적 속성 부여.
- `js/customize.js`: 동적 자동 탐색 엔진 및 연동 파이프라인.
- `tests/home-customizer-auto-sync.test.js`: 신규 단위 테스트 스위트.
- `scripts/smoke-test.js`: 스모크 테스트 단언문.

---

## 8. [원칙 ⑧] 본질 측정 및 사후 모니터링 (Essence Metrics & Review)
- `tests/home-customizer-auto-sync.test.js` 5대 단언 통과율: 100%.
- `smoke-test.js` 381개 검증 통과율: 100%.
- 향후 신규 위젯 추가 시 별도 JS 수정 없이 DOM 속성만으로 나만의 홈 구성 자동 연동 보장.
