# 작업계획서 (PLAN) — 설정 탭 정직성 SET-01 · SET-02

> **문서 ID**: PLAN-TASK-ES-346-SETTINGS-HONESTY
> **티켓 연계**: #TASK-ES-346
> **요구사항**: docs/specs/REQ-TASK-ES-346-SETTINGS-HONESTY.md
> **작성 일시**: 2026-10-04

---

## 1. [원칙 ①] 목표 정의
- [x] 설정 탭이 실제로 하지 않는 일(자동 파기, 2단계 인증 보호, 다른 기기 목록·위치, 원격 차단, 14.2 MB)을 말하지 않게 한다.

## 2. [원칙 ②] 현상 분석 — 본질·원인·중심·핵심
- [x] 본질: 문구가 동작보다 앞섬. 원인: 목업 잔존·계획을 사실처럼 고지·평문 PIN. 중심: 문장별 대조표. 핵심: 승인선(파기·서버 2FA·세션 수집·버튼 삭제 금지)과 평문 PIN 사용자 잠김 방지.

## 3. [원칙 ③] 원인 추정
- [x] `api/withdraw.js` 미호출·크론 없음, `getRegisteredDevices` 시드, `badge2faStatus` 고정 마크업, `refreshSecurityStatus`·`killDeviceSession` 토스트 전용, `cacheSizeText` 고정, `twoFactorPin` 평문.

## 4. [원칙 ④] 대안 탐색
- [x] A안: 동작을 구현(파기·세션 수집) — 승인선 침범, 기각. B안: 문구를 사실에 맞추고 거짓 결과 코드 제거, 실제 경로(`signOut others`)로 연결 — 채택.

## 5. [원칙 ⑤] 실행 계획
- [x] index.html: 마크업 문구, `getRegisteredDevices`, `renderActiveDevicesList`, `openLogoutOtherDevicesConfirmModal`, PIN 블록(`hashAppLockPin`·`verifyAppLockPin`), `paintSecurityCard`, `refreshSecurityStatus`, `killDeviceSession`, `paintCacheUsage`, `clearCacheBtn`, `openWithdrawModal`·`submitWithdrawAccount` 문구, `#setGroupAccountSummary`·`#setGroupDataSummary` id.
- [x] scripts/smoke-test.js · tests/account-withdrawal-modal.test.js · tests/device-session-control.test.js: 거짓 문구를 고정하던 검사 교체.
- [x] reports/TASK-ES-346: claims.json · 시나리오 4개 · 측정 스크립트 · 측정 결과(작업 트리·origin/main).

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파
- [x] 반론 1 "기기 목록을 비우면 일괄 로그아웃이 막힌다" → 창을 목록과 분리, 측정 M2_open 으로 열림 확인.
- [x] 반론 2 "해시 전환으로 기존 PIN 사용자가 잠긴다" → 평문 통과 후 이전, 측정 M3_legacy 로 확인.

## 7. [원칙 ⑦] 즉시 실행
- [x] 구현 · 헤드리스 측정 · `npm test`.

## 8. [원칙 ⑧] 성과 측정
- [x] grep 3종 0건, 헤드리스 M1~M5, `npm test` 종료코드 — 결과는 dev_log.md 와 PR 본문.
- [x] [4단계: 심사 청구] PR 생성 및 법정 실행 기록.

* **체크리스트 마감 규칙**: 본 작업계획서는 [4단계: 심사 청구]까지만 등록함.
