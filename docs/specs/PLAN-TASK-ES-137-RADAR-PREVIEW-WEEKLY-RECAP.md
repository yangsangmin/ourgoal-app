# 엔지니어링 작업계획서 (PLAN) — 신규 유저 3일 실천 레이더 차트 미리보기 & 위클리 리캡 카드 원클릭 생성/공유 UX 복원

> **문서 ID**: PLAN-TASK-ES-137-RADAR-PREVIEW-WEEKLY-RECAP  
> **티켓 연계**: #TASK-ES-137  
> **작성 일시**: 2026-10-02  
> **작성자**: Antigravity Core Engine  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **기능/모듈 엔지니어링 구조 파악**:
  - `index.html`: `renderLifeBalanceWheel`의 콜드스타트 레이더 카드(`#coldstartRadarPreviewCard`) 내 `#btnColdstartCreateRecord` 직통 버튼 탑재 및 클릭 핸들러 배선. 상단 `#btnOpenWeeklyRecap` 및 캐러셀 하단 `#weeklyRecapBtn`의 44px 모바일 터치 타깃 강화. 신규 유저(`allRecs.length < 3`) 기록 탭 진입 시 밸런스 슬라이드 인지 순행 보정.
  - `ui.css`: `.btn-coldstart-record` (min-height: 44px, touch-action: manipulation), `.weekly-recap-action-btn` (min-height: 44px) 디자인 토큰 안착.
  - `docs/rules/TICKETS.md`: `#TASK-ES-137` 승인 등록.
- **수정 대상 파일 목록**:
  1. `docs/rules/TICKETS.md` (티켓 등록)
  2. `docs/specs/REQ-TASK-ES-137-RADAR-PREVIEW-WEEKLY-RECAP.md` (요구사항 정의서)
  3. `docs/specs/PLAN-TASK-ES-137-RADAR-PREVIEW-WEEKLY-RECAP.md` (본 계획서)
  4. `index.html` (레이더 차트 퀵 버튼 및 위클리 리캡 버튼 44px 배선)
  5. `ui.css` (44px 터치 규격 및 모바일 조형 스타일)
  6. `dev_log.md` (개발 로그 기록)
  7. `reports/TASK-ES-137/*` (법정 심사 보고서 및 시나리오)

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Essence)**:
  - 콜드스타트 유저에게 3일 뒤 완성될 나의 6각 성장 비전을 선명히 제시하고 즉각적인 1초 첫 실천을 유도하며, 주간 성취를 원클릭 카드 1장으로 요약해 피드에 공유하는 팩트 기반 회고 및 바이럴 루프.
- **[원인] (Root Causes)**:
  - 신규 가입 유저 진입 시 빈 실천추이 슬라이드가 기본 노출되어 레이더 차트 미리보기가 가려졌고, 카드 내에 행동을 유발하는 44px 직통 버튼이 없었으며, 상단 위클리 리캡 버튼이 44px 터치 규격에 미달했던 점.
- **[중심 배선] (Core Wiring)**:
  - `renderLifeBalanceWheel` 내 `#btnColdstartCreateRecord` 버튼 배치 및 `openRecordModal` / 홈 체크인 연결.
  - `#btnOpenWeeklyRecap` 및 `#weeklyRecapBtn`에 `.weekly-recap-action-btn` 클래스 부여 및 44px 모바일 규격화.
  - `openWeeklyRecapModal` 내 `btnRecapOpenCanvas` 클릭 시 캔버스 모달 오픈 및 소통 피드 공유 브릿지 완결.
- **[핵심 안전장치] (Critical Safety)**:
  - 기존 3개 이상 기록 보유 유저의 원형 라이프 밸런스 휠 SVG 렌더링 100% 보존.
  - 터치 조작 시 `touch-action: manipulation` 적용으로 더블탭 확대 간섭 원천 차단.
  - 390px 모바일 뷰포트 너비 안정성 보증 (가로 스크롤 누수 제로).

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)
- **하지 말아야 할 것**:
  - `renderLifeBalanceWheel`의 원형 파이 차트 계산 알고리즘 임의 수정 금지.
  - 기록 데이터 스키마 임의 변경 금지.
  - 44px 미달 터치 버튼 방치 금지.
- **파일별 변경 예산 (Diff Budget)**:
  - `ui.css`: 약 +25 ~ +35 라인 (버튼 및 레이더 카드 반응형 스타일)
  - `index.html`: 약 +30 ~ +50 라인 (버튼 마크업 및 핸들러 배선)
  - `docs/rules/TICKETS.md`: 약 +2 라인
  - `dev_log.md`: 약 +35 라인
  - `reports/TASK-ES-137/*`: 약 +150 라인

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- **비판적 재검토**:
  - 신규 유저가 기록 탭에 들어왔을 때 캐러셀 슬라이드가 0에 머물러 있으면 레이더 차트가 보이지 않을 수 있음 -> 신규 유저(`allRecs.length < 3`) 진입 시 슬라이드 1(밸런스)을 기본으로 보여주거나 상단에 인라인 프리뷰를 노출하여 발견성을 100% 보장.
  - 기록이 3개 이상 쌓이면 자동으로 기존 원형 라이프 밸런스 휠로 전환되어 기존 유저의 경험이 100% 온전하게 보존됨.

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1 (CSS 스타일)**: `ui.css`에 `.btn-coldstart-record`, `.weekly-recap-action-btn` 스타일 정의 (min-height: 44px, touch-action: manipulation, font-weight: 700).
2. **Step 2 (레이더 차트 직통 버튼)**: `index.html`의 `renderLifeBalanceWheel` 내 콜드스타트 카드에 `#btnColdstartCreateRecord` 배치 및 클릭 시 첫 기록 작성 모달 연결.
3. **Step 3 (위클리 리캡 버튼 강화)**: `index.html` 내 `#btnOpenWeeklyRecap` 및 `#weeklyRecapBtn`에 `.weekly-recap-action-btn` 클래스 적용.
4. **Step 4 (신규 유저 인지 순행)**: 기록 0~2건 유저 진입 시 밸런스 슬라이드 인지성 보강.
5. **Step 5 (로컬 검증)**: `npm test` 스모크 440개 + 무결성 38개 + 947개 Zero Dead-Click 통과 확인.
6. **Step 6 (CDP 실측)**: Headless Chrome CDP 모바일 390px 실측 및 스크린샷 캡처.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
- **시나리오 1 (신규 유저 레이더 프리뷰)**: 게스트 진입 후 기록 탭 이동 시 3일 실천 레이더 차트 및 `#btnColdstartCreateRecord` 정상 가시화 확인.
- **시나리오 2 (첫 기록 작성 직통)**: `#btnColdstartCreateRecord` 클릭 시 에러 없이 기록 작성 모달 정상 호출 확인.
- **시나리오 3 (위클리 리캡 버튼 44px)**: 상단 `#btnOpenWeeklyRecap` 및 `#weeklyRecapBtn`의 너비와 높이가 44px 이상임을 계측.
- **시나리오 4 (기존 밸런스 휠 보존)**: 기록 3건 이상 상태에서 원형 라이프 밸런스 휠 정상 작동 확인.
- **시나리오 5 (뷰포트 안정성)**: 모바일 390px 너비에서 가로 스크롤 오버플로우 0px 확인.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [ ] 1. `ui.css` 44px 터치 버튼 스타일 추가
- [ ] 2. `index.html` 콜드스타트 레이더 퀵 버튼 `#btnColdstartCreateRecord` 및 위클리 리캡 버튼 규격화
- [ ] 3. `npm test` 440개 스모크 및 38개 무결성 게이트 전원 통과 확인
- [ ] 4. CDP 스크립트 작성 및 390px 모바일 실측
- [ ] 5. 법정 심사용 `reports/TASK-ES-137/` 파일군(claims.json, scenarios, pr-body) 완비
- [ ] 6. 커밋 및 푸시 후 PR 생성 & GitHub Court 심사 청구

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **예상 블로커**: 캐러셀 뷰포트와의 충돌로 인한 버튼 클릭 불가 -> 이벤트 위임 및 z-index 10 부여로 터치 레이어 보호.
- **롤백 계획**: 문제 발생 시 `git restore index.html ui.css`로 즉시 원복 후 단위 테스트 재수행.
