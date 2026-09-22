# 엔지니어링 작업계획서 (PLAN) — 소통 탭 내 [🔗 내 전용 동반자 초대 링크 복사] 및 [가입자 닉네임 검색] 상단 신설

> **문서 ID**: PLAN-TASK-ES-231-COMPANION-INVITE-SEARCH  
> **요구사항 연계**: [REQ-TASK-ES-231-COMPANION-INVITE-SEARCH](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/specs/REQ-TASK-ES-231-COMPANION-INVITE-SEARCH.md)  
> **티켓 연계**: #TASK-ES-231  
> **작성 일시**: 2026-09-23  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악

- **REQ 핵심 요약**:
  소통 탭 동반자(companion) 서브탭 상단에 영롱한 그라데이션의 초대 히어로 카드와 #btnCopyCompanionInviteLink를 신설하고, 0.2초(200ms) 디바운스 실시간 가입자 닉네임 검색 바(#companionNicknameSearchInput) 및 검색 결과 내 [🤝 동반자 신청](data-request-companion) 버튼을 배선하여 모바일 375px 터치 규격과 12~15ms 미세 햅틱을 완비한다.
- **영향 받는 파일 목록 전수**:
  - docs/rules/TICKETS.md: #TASK-ES-231 티켓 등록
  - docs/specs/REQ-TASK-ES-231-COMPANION-INVITE-SEARCH.md: 요구사항 정의서
  - docs/specs/PLAN-TASK-ES-231-COMPANION-INVITE-SEARCH.md: 본 작업계획서
  - reports/TASK-ES-231/claims.json: 법정 검증 청구서
  - ui.css: .companion-hero-card, .companion-search-input, .companion-search-result-card 등 모바일 최적화 스타일
  - js/team-invite-comm.js: renderCommCompanions(body) 상단 초대 히어로 카드 렌더링, Web Share API 및 클립보드 fallback, 200ms 디바운스 검색 리스너, 동반자 신청 및 햅틱 배선
  - scripts/smoke-test.js: #TASK-ES-231 검증 단언문 4종 추가

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)

- **[본질] (Engineering Essence)**:
  - 동반자 서브탭의 기술적 본질은 외부 친구를 내 동반자로 끌어들이는 초대 파이프라인(Share/Clipboard)과 기존 가입자를 지연 없이 찾아내는 실시간 탐색 파이프라인(Debounced Search & Instant Request)을 한 화면에서 유기적으로 연결하는 **"동류 영입 및 상호 작용 개통 엔진(E3 Axis)"**이다.
- **[원인] (Technical Causes)**:
  - 초대 링크 생성 및 클립보드 복사 UI가 동반자 탭 최상단에 전면 배치되지 않았고, 검색 인풋에 키 입력 즉시 0.2초 디바운스로 결과를 갱신하는 리액티브 배선이 부재했음.
- **[중심 배선] (Core Wire & State)**:
  - #btnCopyCompanionInviteLink: 15ms 햅틱 + navigator.share or navigator.clipboard.writeText + 복사 완료 토스트
  - #companionNicknameSearchInput: input 이벤트에 200ms clearTimeout/setTimeout 디바운스 배선
  - [data-request-companion]: 12ms 햅틱 + 동반자 신청 영속화 + 안내 토스트
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - verify-all-clicks.js 엄밀 검증기 통과를 위해 고유 ID(btnCopyCompanionInviteLink, companionSearchBtn) 및 data-request-companion 속성으로 확실한 이벤트 바인딩 보장.
  - Web Share API 에러 시 silent clipboard fallback으로 유저 경험 단절 원천 차단.

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| ui.css | 초대 히어로 카드 및 모바일 375px 검색 스타일 | +45줄 | 0줄 | +45줄 | CSS 선언 |
| js/team-invite-comm.js | 초대 카드, 200ms 디바운스 검색 및 햅틱 배선 | +60줄 | -10줄 | +50줄 | 핵심 로직 |
| scripts/smoke-test.js | #TASK-ES-231 스모크 테스트 4종 단언 | +30줄 | 0줄 | +30줄 | 검증 단언 |
| docs/specs/REQ-TASK-ES-231-COMPANION-INVITE-SEARCH.md | 정본 REQ | +120줄 | 0줄 | +120줄 | 정본 스펙 |
| docs/specs/PLAN-TASK-ES-231-COMPANION-INVITE-SEARCH.md | 정본 PLAN | +100줄 | 0줄 | +100줄 | 정본 스펙 |
| reports/TASK-ES-231/claims.json | 법정 검증 청구서 | +80줄 | 0줄 | +80줄 | 검증 청구서 |
| docs/rules/TICKETS.md | 티켓 등록 | +2줄 | 0줄 | +2줄 | 규칙 관리 |

---

## 4. [원칙 ④] 회귀 방지 및 엣지 케이스 안전 대책

- **Dead-Click 린터 방어**:
  - 버튼 태그에 리터럴 ID 및 data 속성을 명시하여 verify-all-clicks.js 100% 통과.
- **오프라인 및 API 에러 방어**:
  - 네트워크 단절 시에도 로컬 캐시(_userCache) 및 기본 동반자 풀을 탐색하여 크래시 방지.

---

## 5. [원칙 ⑤] 실행 절차 및 4대 뷰 동시 전파

1. ui.css에 모바일 375px 최적화 스타일 추가.
2. js/team-invite-comm.js 내 renderCommCompanions 개편 및 배선.
3. scripts/smoke-test.js에 검증 추가.
4. npm test로 38개 헌법 게이트 및 Zero Dead-Click 전수 검증.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)

- **단일 실패점 (SPOF) 점검**:
  - 초대 링크 복사 로직에서 navigator.clipboard가 HTTPS가 아니거나 권한이 없을 경우를 대비하여 숨김 textarea를 활용한 document.execCommand('copy') 폴백까지 3중 방어.
- **가정의 타당성 검증**:
  - 기존 동반자 추가 로직(data-addcomp)과 신규 data-request-companion이 상호 충돌 없이 매끄럽게 동작함을 보증.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)

- npm test 335개 이상 전체 PASS (0 failure).
- 38개 헌법 게이트 100% PASS.
- Dead-Click 검사 100% ALL PASS.

---

## 8. [원칙 ⑧] 본질 승인 티켓 연계 (Ticket Alignment)

- 티켓: #TASK-ES-231
- 노션 DB 101번 항목 완료 기준 완벽 충족.
