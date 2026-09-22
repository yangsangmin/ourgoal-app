# 엔지니어링 작업계획서 (PLAN) — 설정탭 상단 프로필 요약 카드 시인성 강화 및 계정·아바타 정보 가독성 전면 개선

> **문서 ID**: PLAN-TASK-ES-248-SETTINGS-PROFILE-CARD-VISIBILITY  
> **요구사항 연계**: [REQ-TASK-ES-248-SETTINGS-PROFILE-CARD-VISIBILITY](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/specs/REQ-TASK-ES-248-SETTINGS-PROFILE-CARD-VISIBILITY.md)  
> **티켓 연계**: #TASK-ES-248  
> **작성 일시**: 2026-09-23  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악

- **REQ 핵심 요약**:
  설정탭 상단 프로필 요약 카드(.toss-settings-hero-card)의 아바타를 58px로 스케일업하고 레벨 뱃지와 계정 연동 상태 아이콘(🟡/👤)을 배선하여 사용자 아이덴티티와 가독성을 전면 개선한다.
- **영향 받는 파일 목록 전수**:
  - docs/rules/TICKETS.md: #TASK-ES-248 티켓 등록
  - docs/specs/REQ-TASK-ES-248-SETTINGS-PROFILE-CARD-VISIBILITY.md: 요구사항 정의서
  - docs/specs/PLAN-TASK-ES-248-SETTINGS-PROFILE-CARD-VISIBILITY.md: 본 작업계획서
  - reports/TASK-ES-248/claims.json: 법정 검증 청구서
  - index.html: renderSettingsHeroCard 로직 고도화 (58px 아바타 + Lv 뱃지 + 계정 연동 아이콘)
  - ui.css: .toss-settings-hero-card 입체감 및 .toss-settings-avatar-wrap 스타일 선언
  - scripts/smoke-test.js: #TASK-ES-248 검증 단언문 추가

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)

- **[본질] (Engineering Essence)**:
  - 기술적 본질은 설정 탭 상단 프로필 요약 카드에 58px 대형 아바타 링과 Lv.N 오버레이 뱃지, 계정 연동 상태(카카오/게스트) 아이콘을 완결 배선하여, 사용자에게 자신의 성장 효능감과 계정 안정성을 즉각 각인시키는 **"설정 프로필 아이덴티티 고도화 렌더링 엔진(UI/UX & FIX Axis)"**이다.
- **[원인] (Technical Causes)**:
  - 아바타 크기(44px)가 작고 계정 상태가 단순 텍스트로 처리되어 시각적 주목도가 떨어졌음.
- **[중심 배선] (Core Wire & State)**:
  - `settingsHeroAvatarSlot`: 58px 아바타 및 우측 하단 Lv.N 뱃지 오버레이.
  - `settingsHeroStatusDesc`: `🟡 카카오 계정 연동` 또는 `👤 게스트 체험 모드` 배선.
  - `ui.css`: 카드 그림자 및 테두리 고대비 스타일.
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - `#btnSettingsQuickAvatar` 아바타 모달 오픈 및 12ms 햅틱 100% 보존.
  - Zero Dead-Click 린터 및 38대 헌법 게이트 완전 통과.

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| index.html | renderSettingsHeroCard 아바타 및 계정 아이콘 반영 | +25줄 | -3줄 | +22줄 | 로직/마크업 |
| ui.css | 프로필 카드 및 아바타 링 스타일 선언 | +30줄 | 0줄 | +30줄 | 스타일 |
| scripts/smoke-test.js | #TASK-ES-248 스모크 테스트 단언문 추가 | +20줄 | 0줄 | +20줄 | 검증 단언 |
| docs/specs/REQ-TASK-ES-248-SETTINGS-PROFILE-CARD-VISIBILITY.md | 정본 REQ | +120줄 | 0줄 | +120줄 | 정본 스펙 |
| docs/specs/PLAN-TASK-ES-248-SETTINGS-PROFILE-CARD-VISIBILITY.md | 정본 PLAN | +100줄 | 0줄 | +100줄 | 정본 스펙 |
| reports/TASK-ES-248/claims.json | 법정 검증 청구서 | +80줄 | 0줄 | +80줄 | 검증 청구서 |
| docs/rules/TICKETS.md | 티켓 등록 | +2줄 | 0줄 | +2줄 | 규칙 관리 |

---

## 4. [원칙 ④] 회귀 방지 및 엣지 케이스 안전 대책

- **기존 헌법 검증 유지**:
  - `verify-integrity-gate.js` 내 설정 탭 본질 검증 100% 통과 유지.
- **4대 테마 시인성**:
  - 다크, 블랙, 화이트, 도심 테마에서 카드 외곽선 및 아바타 링 대비 4.5:1 이상 확보.

---

## 5. [원칙 ⑤] 실행 절차 및 4대 뷰 동시 전파

1. index.html 내 renderSettingsHeroCard 수정.
2. ui.css 내 프로필 카드 및 아바타 링 스타일 선언.
3. scripts/smoke-test.js에 #TASK-ES-248 검증 단언문 추가.
4. npm test로 38개 헌법 게이트 및 Zero Dead-Click 전수 검증.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)

- **단일 실패점 (SPOF) 점검**:
  - 프로필 속성 결손 시에도 '사용자', '게스트 모드' 기본값 처리로 크래시 위험 0%.
- **가정의 타당성 검증**:
  - 58px 아바타 및 계정 아이콘으로 시각적 안정성과 가독성이 확실히 개선됨.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)

- 58px 아바타 및 Lv 뱃지 렌더링 확인.
- 계정 연동 상태(🟡/👤) 표시 확인.
- npm test 336개 이상 전체 PASS (0 failure).
- 38개 헌법 게이트 100% PASS.
- Dead-Click 검사 100% ALL PASS.

---

## 8. [원칙 ⑧] 본질 승인 티켓 연계 (Ticket Alignment)

- 티켓: #TASK-ES-248
- 노션 DB 118번 항목 완료 기준 완벽 충족.
