# 엔지니어링 작업계획서 (PLAN) — 맞춤 템플릿 스톱워치 표 시간기입 안내문구 추가 및 시간 컬럼 빈칸 UX 개선

> **문서 ID**: PLAN-TASK-ES-257-STOPWATCH-TABLE-HINT  
> **요구사항 연계**: [REQ-TASK-ES-257-STOPWATCH-TABLE-HINT](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-257-STOPWATCH-TABLE-HINT.md)  
> **티켓 연계**: #TASK-ES-257  
> **작성 일시**: 2026-09-25  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **상민님 지시 원문**:
  > 1. "맞춤 템플릿 기록 스톱워치 시간 옆에 ‘넣을 칸 누르고 ‘표에시간기입’누르면 바로입력됨’ 안내문구 추가. (빈칸에 사용자경험, 시인성 좋도록 알맞게 반영)"
  > 2. "맞춤 템플릿 스톱워치 표에 시간 기입(분:초 또는 초)할 수 있도록 안내문구 추가해"
- **영향 받는 파일 목록 전수**:
  - `index.html`: `renderStopwatchWidgetHtml` 힌트 텍스트 및 ID 강화, `renderRowsHtml` 시간 컬럼 placeholder 분기, 토스트 멘트 일원화, `window.renderStopwatchWidgetHtml` 노출.
  - `tests/stopwatch-table-hint.test.js`: 신규 독립 단위 테스트 스위트 작성.
  - `scripts/smoke-test.js`: #TASK-ES-257 회귀 방지 검증 단언문 추가.
  - `reports/TASK-ES-257/claims.json`: 법정 심사 클레임 문서 작성.
  - `docs/rules/TICKETS.md`: #TASK-ES-257 등록.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: `[UI/UX & E1/E2]` (인앱 측정 툴과 데이터 그리드 간 직관적 상호작용 체계 완성).
- **[원인] (Technical Causes)**:
  - 스톱워치 안내 문구에 시간 포맷(`분:초 또는 초`) 설명이 누락되어 있었고, 표 셀의 placeholder가 단순 컬럼명으로 고정되어 수동 입력 가이드가 미흡했음.
- **[중심 배선] (Core Wire & State)**:
  - `renderStopwatchWidgetHtml`: 스톱워치 뷰 및 힌트 생성기 (`#swInjectHint`).
  - `renderRowsHtml`: 표 행 및 셀 렌더러 (`placeholder` 시간 포맷 스마트 분기).
  - `#swInjectBtn`: 클릭 시 타깃 셀 주입 및 토스트 알림 배선.
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - 시간 컬럼 판별 정규식(`/(시간|타임|휴식|초|time|duration)/i`) 적용으로 타 컬럼 훼손 없이 시간 열에만 정밀 가이드 적용.
  - 기존 랩타임, 리셋, 시작/정지 및 데이터 저장 파이프라인 무손실 보존.

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `index.html` | 힌트 문구 보강, 시간 셀 placeholder 스마트 분기, 토스트 일원화, window 노출 | +12줄 | -3줄 | +9줄 | 외과수술적 diff |
| `tests/stopwatch-table-hint.test.js` | 신규 독립 단위 테스트 스위트 | +110줄 | 0줄 | +110줄 | 단위 테스트 |
| `scripts/smoke-test.js` | #TASK-ES-257 검증 단언문 | +16줄 | 0줄 | +16줄 | 스모크 테스트 |
| `docs/rules/TICKETS.md` | 티켓 등록 | +1줄 | 0줄 | +1줄 | 규범 문서 |
| `reports/TASK-ES-257/claims.json` | 법정 심사 클레임 | +30줄 | 0줄 | +30줄 | 심사 문서 |

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 맞춤 템플릿의 Notion 연동, 일정 연동 저장, 로컬스토리지 저장이 100% 무손실 보존되는가?
- [x] 전체 파일 덮어쓰기 없이 변경 부분만 외과수술적 diff로 작성하도록 설계되었는가?
- [x] 375px 모바일 뷰포트에서 가로 스크롤 오버플로우를 유발하지 않는가?
- [x] 스톱워치 타이머 동작(시작/정지/리셋/랩타임)에 아무런 간섭이 없는가?

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1**: `index.html` 내 `renderStopwatchWidgetHtml`의 힌트 텍스트를 `💡 넣을 칸 누르고 ‘표에시간기입’ 누르면 바로입력됨 (분:초 또는 초 기입)`으로 정밀화하고 `id="swInjectHint"` 속성 확정.
2. **Step 2**: `renderRowsHtml` 내 시간 관련 컬럼 식별 로직 추가 및 placeholder에 `분:초 또는 초 (예: 01:30)` 부여.
3. **Step 3**: `index.html` 내 타깃 셀 미선택 토스트 문구를 동일하게 단일화.
4. **Step 4**: `window.renderStopwatchWidgetHtml` 전역 바인딩 노출.
5. **Step 5**: `tests/stopwatch-table-hint.test.js` 단위 테스트 작성 및 통과 확인.
6. **Step 6**: `scripts/smoke-test.js`에 `#TASK-ES-257` 단언문 추가 및 375개 테스트 ALL PASS 확인.
7. **Step 7**: `docs/rules/TICKETS.md`에 `#TASK-ES-257` 등록.
8. **Step 8**: `reports/TASK-ES-257/claims.json` 작성, 커밋, 푸시, Draft PR 생성 및 Court 심사 청구.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
- **시나리오 A (Zero Dead-Click)**: 스톱워치 시작, 일시정지, 리셋, 랩타임 버튼 및 [표에 시간 기입] 버튼 데드클릭 0건 확인.
- **시나리오 B (Zero Data Loss)**: 표에 기입된 시간 및 텍스트 데이터가 저장 시 온전히 유지됨을 확인.
- **시나리오 C (Zero UX Regression)**: 모바일 375px 화면에서 힌트 문구가 자연스럽게 감싸지며 가로 스크롤이 발생하지 않음을 확인.
- **시나리오 D (Full State Propagation)**: 표에 시간 기입 시 `cell-highlight-flash` 피드백이 발생하고 DOM 동기화가 즉시 이루어짐을 확인.
- **시나리오 E (자동화 게이트 통과)**: `scripts/smoke-test.js` 375개 및 `verify-integrity-gate.js` 38개 100% ALL PASS 확인.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [x] Step 1 REQ/PLAN 명세서 작성 완료.
- [ ] Step 2 `index.html` 스톱워치 힌트, 표 셀 placeholder, 토스트 및 window 바인딩 적용.
- [ ] Step 3 단위 테스트 `node tests/stopwatch-table-hint.test.js` ALL PASS.
- [ ] Step 4 스모크 테스트 375개 ALL PASS.
- [ ] Step 5 헌법 38대 게이트 통과.
- [ ] Step 6 초안 PR 개설 및 GitHub Court 법정 심사 청구.

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**: 컬럼명 판별 시 대소문자 또는 비정형 컬럼명(예: 'Duration') 누락 가능성.
- **사전 방어**: `/(시간|타임|휴식|초|time|duration|sec|min)/i` 정규식으로 국/영문 전방위 매칭.
- **롤백 계획 (Rollback Strategy)**: `git checkout -- index.html`로 즉각 원상 복원 가능.
- **재검증 트리거**: placeholder 비정상 노출 시 정규식 패턴 재검토.
