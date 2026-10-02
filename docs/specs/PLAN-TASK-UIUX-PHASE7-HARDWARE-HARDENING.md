# 엔지니어링 작업계획서 (PLAN) — [UI/UX 프레임워크 개편 Phase 7] 모바일 하드웨어 인터랙션 & 사용성 하드닝 8대 과업

> **문서 ID**: PLAN-TASK-UIUX-PHASE7-HARDWARE-HARDENING  
> **요구사항 연계**: [REQ-TASK-UIUX-PHASE7-HARDWARE-HARDENING](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-UIUX-PHASE7-HARDWARE-HARDENING.md)  
> **티켓 연계**: #TASK-UIUX-PHASE7-HARDWARE-HARDENING  
> **작성 일시**: 2026-10-02  
> **작성자**: Antigravity (Advanced Agentic Pair-Programmer)  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**: 모바일 가상 키보드 가림 방화벽, iOS 바운스 억제, `:active` 터치 스케일 피드백, 테마 전환 200ms 트랜지션, 폰트 스케일링 안전망, PWA 3단계 카드뉴스 인앱 안내 모달, Zero Dead-Click 영구 유지를 아우르는 모바일 하드웨어 융합 및 사용성 하드닝 8대 과업 구현.
- **영향 받는 파일 목록 전수**:
  - `docs/rules/TICKETS.md`: 티켓 진행 상태 업데이트
  - `ui.css`: 키보드 쉴드 유틸, 바운스 억제, `:active` 스케일, 테마 전환 200ms, PWA 카드뉴스 스타일
  - `index.html`: PWA 설치 가이드 모달 바텀시트 마크업, 전역 `initKeyboardShield` 스크립트 및 핸들러 배선
  - `reports/TASK-UIUX-PHASE7-HARDWARE-HARDENING/claims.json`: 법정 주장서 파일 생성

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: 모바일 OS 하드웨어 특성(키보드 뷰포트, 관성 스크롤, 고주사율 터치 반응)과 브라우저 DOM 간의 무지연 무간섭 물리 결속.
- **[원인] (Technical Causes)**: 고정형 웹 뷰포트 설정으로 인한 키보드 뒤 숨김 현상 및 클릭 피드백 지연.
- **[중심 배선] (Core Wire & State)**:
  - `window.visualViewport`: 키보드 리프트업 이벤트 청취 및 포커스 인풋 중앙 정렬.
  - `openPwaInstallGuideModal`: PWA 안내 모달 호출 및 닫기 핸들러.
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - `visualViewport` 미지원 시 우아한 폴백(graceful fallback) 보장.
  - 기존 937개 버튼 Zero Dead-Click 영구 보존.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[인풋 포커스] -> [visualViewport 높이 감지] -> [활성 인풋 센터 스크롤] -> [키보드 가림 원천 차단] -> [손맛 반응]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `docs/rules/TICKETS.md` | 티켓 상태 등록 | +3줄 | -1줄 | +2줄 | 문서 업데이트 |
| `ui.css` | Phase 7 하드웨어 하드닝 및 PWA 스타일 | +150줄 | 0줄 | +150줄 | CSS 클래스 추가 |
| `index.html` | PWA 가이드 모달 및 키보드 쉴드 스크립트 | +120줄 | 0줄 | +120줄 | 외과수술적 추가 |
| `reports/TASK-UIUX-PHASE7-HARDWARE-HARDENING/claims.json` | 법정 심사 주장서 | +65줄 | 0줄 | +65줄 | 정본 생성 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**: `modalPwaInstallGuide`, `btnPwaInstallGuide`, `btnClosePwaGuide`, `btnConfirmPwaInstall`
2. **이벤트 리스너 (Listener)**: 클릭 및 `visualViewport` 이벤트 리스너 바인딩
3. **비즈니스 로직 (Logic)**: `initKeyboardShield()`, `openPwaInstallGuideModal()`, `closePwaInstallGuideModal()`
4. **피드백 & 예외처리 (Feedback)**: 12ms 햅틱 진동 및 토스트 피드백 연계

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 HTML 디자인, CSS 스타일, 레이아웃을 임의로 변경하지 않고 완벽히 계승했는가?
- [x] 전체 파일 덮어쓰기 없이 변경 부분만 외과수술적 diff로 작성하도록 설계되었는가?
- [x] 기존 사용자의 아바타(보관함 포함), 목표, 기록, 세팅값이 100% 무손실 보존되는가?
- [x] 성능 저하(불필요한 전체 리렌더링)나 다중 탭 동시성 충돌을 유발하지 않는가?

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1 (UI 스타일 구축)**: `ui.css`에 키보드 쉴드, `:active` 스케일링, 바운스 억제, 테마 부드러운 전환, PWA 모달 스타일 추가.
2. **Step 2 (모달 마크업 배치)**: `index.html` 하단에 PWA 설치 가이드 모달 바텀시트 마크업 추가.
3. **Step 3 (비즈니스 로직 & 핸들러)**: `initKeyboardShield`, `openPwaInstallGuideModal`, `closePwaInstallGuideModal` 배선.
4. **Step 4 (주장서 작성)**: `reports/TASK-UIUX-PHASE7-HARDWARE-HARDENING/claims.json` 완비.
5. **Step 5 (로컬 5대 테스트 검증)**: 회귀 및 무결성 전수 검증.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
- **시나리오 A (Zero Dead-Click)**: 신규 추가된 3대 PWA 버튼 포함 전수 클릭 시뮬레이션 -> 940개 버튼 100% 배선 확인.
- **시나리오 B (Zero Data Loss)**: 10종 가상 페르소나 데이터 무손실 딥이퀄 검증 100% 통과.
- **시나리오 C (Zero UX Regression)**: 테마 전환 시 200ms 트랜지션 확인 및 기존 모달 작동 유지.
- **시나리오 D (Full State Propagation)**: PWA 가이드 열림/닫힘 및 키보드 포커스 정상 동작 확인.
- **시나리오 E (자동화 게이트 통과)**: `verify-integrity-gate.js`, `smoke-test.js` 100% PASS 확인.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [ ] Step 1~5 순차적 구현 (AI 코드 축약 `// ...` 일절 없이 완전한 실행 코드 작성)
- [ ] 로컬 무결성 게이트 검증: `node scripts/verify-integrity-gate.js` PASS
- [ ] 전수 클릭 검증: `node scripts/verify-all-clicks.js` PASS
- [ ] 모듈러 조선소 테스트: `node scripts/test-shipyard-modular.js` PASS
- [ ] 스모크 테스트 전수 검증: `node scripts/smoke-test.js` PASS
- [ ] 3자 동기화 검증: `node C:/dev/command-center/lib/tri-sync.js check` PASS
- [ ] GitHub PR 생성 및 법정 심사 청구

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**: 모바일 가상 키보드 감지 시 데스크톱 브라우저에서 오작동하지 않도록 뷰포트 크기 변화 임계값(예: 150px 이상 축소 시에만 키보드로 판단) 설정.
- **사전 방어 및 우회 로직**: `window.visualViewport` 유효성 체크 후 가동.
- **롤백 계획 (Rollback Strategy)**: 변경사항 격리 커밋을 통해 결함 발생 시 즉각 롤백 가능.
- **재검증 트리거**: 모달 닫기 제스처와 키보드 리프트 충돌 시 이벤트 우선순위 재조정.
