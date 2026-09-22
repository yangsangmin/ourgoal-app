# 엔지니어링 작업계획서 (PLAN) — 아이폰(iOS Safari) 접속 시 '홈 화면에 추가(PWA)' 및 푸시 알림 100% 활성화 가이드 상시 탑재

> **문서 ID**: PLAN-TASK-ES-234-IOS-PWA-GUIDE  
> **요구사항 연계**: [REQ-TASK-ES-234-IOS-PWA-GUIDE](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/specs/REQ-TASK-ES-234-IOS-PWA-GUIDE.md)  
> **티켓 연계**: #TASK-ES-234  
> **작성 일시**: 2026-09-23  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악

- **REQ 핵심 요약**:
  iOS Safari 환경을 정밀 감지하여 3단계 비주얼 카드(공유 ➔ 홈 화면에 추가 ➔ 알림 허용) 배너를 렌더링하고, 상세 모달(`openIosPwaInstallGuideModal`) 및 푸시 권한 요청 파이프라인을 구축하여 모바일 375px 및 15ms 미세 햅틱을 완비한다.
- **영향 받는 파일 목록 전수**:
  - docs/rules/TICKETS.md: #TASK-ES-234 티켓 등록
  - docs/specs/REQ-TASK-ES-234-IOS-PWA-GUIDE.md: 요구사항 정의서
  - docs/specs/PLAN-TASK-ES-234-IOS-PWA-GUIDE.md: 본 작업계획서
  - reports/TASK-ES-234/claims.json: 법정 검증 청구서
  - index.html: renderIosPwaBanner 3단계 카드 렌더링, openIosPwaInstallGuideModal 모달 및 푸시 권한 연동
  - ui.css: .ios-pwa-steps, .ios-pwa-step-card 스타일 선언
  - scripts/smoke-test.js: #TASK-ES-234 검증 단언문 4종 추가

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)

- **[본질] (Engineering Essence)**:
  - 기술적 본질은 WebKit PWA 라이프사이클을 준수하여, 브라우저 모드에서는 10초 만에 홈 화면 추가 및 푸시 활성화를 유도하고, standalone 모드 진입 시에는 무결점 풀스크린 경험을 제공하는 **"iOS PWA 온보딩 및 Web Push 인터랙션 엔진(INFRA/FIX Axis)"**이다.
- **[원인] (Technical Causes)**:
  - 기존 배너가 1줄 텍스트에 불과하여 시각적 전달력이 낮았고, iOS 16.4+ Web Push 알림 활성화 연계가 누락되었음.
- **[중심 배선] (Core Wire & State)**:
  - `renderIosPwaBanner`: 3단계 비주얼 카드(#iosPwaSlot) 렌더링
  - `btnOpenIosPwaGuideModal`: 상세 인터랙티브 가이드 모달 팝업
  - `btnRequestIosPushPermission`: Notification.requestPermission() 호출 + 15ms 햅틱
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - 기존 `renderIosPwaBanner`, `ios-pwa-banner` 클래스 식별자 100% 보존.
  - Zero Dead-Click 린터 및 38대 헌법 게이트 완전 통과.

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| index.html | 3단계 배너 및 상세 모달, 푸시 권한 배선 | +65줄 | -8줄 | +57줄 | 핵심 로직 |
| ui.css | PWA 3단계 스텝 카드 스타일 선언 | +25줄 | 0줄 | +25줄 | 스타일 |
| scripts/smoke-test.js | #TASK-ES-234 스모크 테스트 4종 단언 | +30줄 | 0줄 | +30줄 | 검증 단언 |
| docs/specs/REQ-TASK-ES-234-IOS-PWA-GUIDE.md | 정본 REQ | +120줄 | 0줄 | +120줄 | 정본 스펙 |
| docs/specs/PLAN-TASK-ES-234-IOS-PWA-GUIDE.md | 정본 PLAN | +100줄 | 0줄 | +100줄 | 정본 스펙 |
| reports/TASK-ES-234/claims.json | 법정 검증 청구서 | +80줄 | 0줄 | +80줄 | 검증 청구서 |
| docs/rules/TICKETS.md | 티켓 등록 | +2줄 | 0줄 | +2줄 | 규칙 관리 |

---

## 4. [원칙 ④] 회귀 방지 및 엣지 케이스 안전 대책

- **Dead-Click 린터 방어**:
  - 모달 닫기 버튼 및 권한 요청 버튼에 명시적인 핸들러 결속.
- **안드로이드/데스크톱 오작동 방어**:
  - iOS 및 비-standalone 환경에서만 배너가 표출되도록 정밀 분기 유지.

---

## 5. [원칙 ⑤] 실행 절차 및 4대 뷰 동시 전파

1. ui.css에 .ios-pwa-steps 스타일 선언.
2. index.html 내 renderIosPwaBanner 및 openIosPwaInstallGuideModal 구현.
3. scripts/smoke-test.js에 검증 추가.
4. npm test로 38개 헌법 게이트 및 Zero Dead-Click 전수 검증.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)

- **단일 실패점 (SPOF) 점검**:
  - 사용자가 알림 권한을 거부하더라도 앱 사용이 중단되지 않고 토스트로 정중히 안내 후 정상 복귀.
- **가정의 타당성 검증**:
  - 3단계 가이드는 애플 공식 권장 PWA 온보딩 표준과 일치함.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)

- npm test 336개 이상 전체 PASS (0 failure).
- 38개 헌법 게이트 100% PASS.
- Dead-Click 검사 100% ALL PASS.

---

## 8. [원칙 ⑧] 본질 승인 티켓 연계 (Ticket Alignment)

- 티켓: #TASK-ES-234
- 노션 DB 104번 항목 완료 기준 완벽 충족.
