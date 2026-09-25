# 엔지니어링 작업계획서 (PLAN) — 기록탭 명칭 '기록/통계'로 변경 2차 초정밀 완결

> **문서 ID**: PLAN-TASK-ES-260-RECORDS-TAB-RENAME  
> **요구사항 연계**: [REQ-TASK-ES-260-RECORDS-TAB-RENAME](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-260-RECORDS-TAB-RENAME.md)  
> **티켓 연계**: #TASK-ES-260 (노션 생각 메모장 [36]번)  
> **작성 일시**: 2026-09-25  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**:
  - 하단 네비게이션 버튼 텍스트 '기록/통계' 및 `aria-label="기록/통계"` 확립.
  - 가이드 허브 모달(`tabGuideHubModal`) 및 공개 범위 모달(`openPrivacyPickerModal`) 내 탭 명칭 '기록/통계'로 4위 1체 동기화.
  - 모바일 375px 뷰포트에서 4글자 탭 이름이 줄바꿈되지 않도록 `white-space: nowrap` 및 반응형 패딩/폰트 보장.
  - 내부 로직 식별자(`records`)의 무결성을 100% 보존하여 하위 호환성 유지.
- **영향 받는 파일 목록 전수**:
  - `index.html`: 하단 네비게이션 버튼 마크업, `tabGuideHubModal`, `openPrivacyPickerModal`
  - `ui.css`: `.navbtn` `white-space: nowrap;` 및 `@media (max-width: 375px)` 반응형 규칙
  - `docs/rules/TICKETS.md`: `#TASK-ES-260` 티켓 등록
  - `tests/records-tab-rename.test.js`: 신규 단위 테스트 스위트 (`const SUITE_TASK = 'TASK-ES-260';`)
  - `scripts/smoke-test.js`: `#TASK-ES-260` 검증 단언문 추가
  - `reports/TASK-ES-260/claims.json`: GitHub Court 심사 청구서

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: 사용자가 매일 쌓은 시간과 실천 데이터를 단순 메모가 아닌 '통계와 시각적 데이터 자산'으로 즉각 인지할 수 있도록 명확한 탭 브랜딩과 시각적 안정성 제공.
- **[원인] (Technical Causes)**:
  - 1차 선행 작업 시 하단 네비게이션 바 HTML 텍스트만 일부 교체되고 앱 내 연계 모달(`tabGuideHubModal`, `openPrivacyPickerModal`)의 명칭 일괄 검증 누락.
  - 375px 모바일 5대 탭 환경에서 4글자 라벨의 줄바꿈 방지 스타일 명시 누락.
- **[중심 배선] (Core Wire & State)**:
  - 내부 탭 키 `records`, `state.activeTab = 'records'`, `screen-records` 등 핵심 엔진 ID는 100% 불변 유지.
  - 사용자에게 노출되는 UI 텍스트 및 접근성 `aria-label`만 '기록/통계'로 단일화.
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - 기존 탭 라우팅(`switchTab`), 렌더러(`renderRecordsScreen`), 스토리지(`state.profile.settings.privacy.records`) 무손실 보존.
  - 375px 모바일 뷰포트에서 `white-space: nowrap` 및 최소 44px 터치 타겟 보장.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[하단 네비 '기록/통계' 클릭]` ➔ `[switchTab('records')]` ➔ `[renderRecordsScreen() 실행]` ➔ `[헤더 '기록/통계' 및 히어로 카드 렌더링]` ➔ `[설정/가이드 모달에서도 '기록/통계' 일관 노출]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `index.html` | aria-label 추가 및 연계 모달 탭명 '기록/통계' 동기화 | +5줄 | -3줄 | +2줄 | 외과수술적 diff |
| `ui.css` | .navbtn nowrap 및 375px 모바일 반응형 규칙 추가 | +3줄 | -1줄 | +2줄 | CSS 토큰 준수 |
| `tests/records-tab-rename.test.js` | 신규 단위 검증 스위트 신설 | +65줄 | 0줄 | +65줄 | 신규 파일 |
| `scripts/smoke-test.js` | 스모크 테스트 단언문 추가 | +25줄 | 0줄 | +25줄 | 회귀 방지 |
| `docs/rules/TICKETS.md` | 작업 티켓 등록 | +1줄 | 0줄 | +1줄 | 문서 갱신 |

---

## 4. [원칙 ④] 세부 계획 수립 및 헌법 8원칙 준수 (Detailed Planning)
- 승인선 5대 영역 해당 없음.
- 헌법 제3조 제1항 기존 기능 훼손 금지 엄수.
- 헌법 제7조 제8항 375px 모바일 시각 규격 준수.

---

## 5. [원칙 ⑤] 외과수술적 구현 (Surgical Implementation)
- 마크업: `.navbtn[data-tab="records"]`에 `aria-label="기록/통계"` 추가.
- 모달: `tabGuideHubModal` 내 `{ key: 'records', label: '기록/통계', icon: '📝' }`, `openPrivacyPickerModal` 내 `tabName = tabKey==='records' ? '기록/통계' : '통계'` 반영.
- CSS: `.navbtn`에 `white-space: nowrap; letter-spacing: -0.2px;` 및 `@media (max-width: 375px){.navbtn{font-size:.625rem;letter-spacing:-0.4px;padding:6px 1px 4px;}}` 적용.

---

## 6. [원칙 ⑥] 재검증 계획 (Re-verification Plan)
- 단위 테스트: `tests/records-tab-rename.test.js` 100% ALL PASS
- 스모크 테스트: `scripts/smoke-test.js` 378개 ALL PASS
- 헌법 게이트: `scripts/verify-integrity-gate.js` 38개 전 항목 통과

---

## 7. [원칙 ⑦] 회귀 결함 방지 (Regression Prevention)
- 내부 탭 식별자(`records`), `renderRecordsScreen()`, 라우팅 로직을 일절 변경하지 않아 기존 기능 100% 무결 유지.

---

## 8. [원칙 ⑧] 법정 심사 청구 명세 (Court Claims)
- 파일: `reports/TASK-ES-260/claims.json`
- Claim 1: 하단 내비게이션 바 data-tab="records" 버튼 텍스트가 '기록/통계'로 렌더링됨
- Claim 2: 하단 내비게이션 바 data-tab="records" 버튼에 aria-label="기록/통계" 접근성 속성이 지정됨
- Claim 3: 기록 화면(#screen-records) 상단 헤더 타이틀이 '기록/통계'로 표기됨
- Claim 4: 가이드 허브 모달 및 공개 범위 설정 모달의 탭 레이블이 '기록/통계'로 4위 1체 동기화됨
- Claim 5: 375px 모바일 뷰포트에서 navbtn에 white-space:nowrap 및 반응형 스타일이 적용되어 수평 오버플로우가 0px임
