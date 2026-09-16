# 작업계획서 (PLAN) — 아바타 제작 한도 기본 3회 조정 & 7일 연속 체크인 리워드 충전 (#TASK-ES-125)

> **문서 ID**: PLAN-TASK-ES-125-AVATAR-CRAFT-STREAK-REWARD
> **티켓 연계**: #TASK-ES-125 (요구서: REQ-TASK-ES-125-AVATAR-CRAFT-STREAK-REWARD.md)
> **작성 일시**: 2026-09-16
> **작성자**: Antigravity 세션 454cedb2
> **규범 준수**: TECH-RULE-01(index.html 스마트 라인수 락), TECH-RULE-03(유저 데이터 100% 무손실 보존), AGENTS.md 14대 조문

---

## 1. 개요 및 마일스톤
- [x] **Step 1: 요구사항 정의 및 티켓 등록**
  - `docs/specs/REQ-TASK-ES-125-AVATAR-CRAFT-STREAK-REWARD.md` 작성
  - `docs/rules/TICKETS.md`에 `#TASK-ES-125` 등록 및 상태 갱신
  - `.codex/작업계획서/454cedb2.md` 마일스톤 관리
- [x] **Step 2: 로직 모듈 구현 (`js/avatar-system.js`)**
  - `DEFAULT_BASE_CRAFTS = 3`, `LEGACY_MAX_CRAFTS = 10`, `MAX_AVATAR_CHANGES = 10`
  - `isLegacyAccount(profile)` 판별기 탑재: 기존 계정 10회 기득권 100% 영구 보존
  - `getMaxCrafts(profile)`: `baseCrafts + (bonusCraftCredits || 0)` 동적 계산
  - `getRemainingCrafts(profile)`: `Math.max(0, maxCrafts - usedCrafts)` 계산
  - `maybeGrantStreakBonus(profile, streakDays)`: 7일 배수 도달 시 +1 충전 및 구간 락킹
  - 아바타 모달 상단/버튼 동적 `(남은/총가용)` 표기 및 `#avatarStreakRechargeBanner` 상시 배너 탑재
- [x] **Step 3: 앱 본체 배선 (`index.html`)**
  - `defaultSettings()`에 `maxBaseCrafts: 3, bonusCraftCredits: 0, lastStreakAwarded: 0` 기본 탑재
  - `maybeGrantAvatarCraftBonus()` 신설 및 체크인(퀵/모달) 및 앱 부트 시 스트릭 연동
  - 7일 달성 시 축하 토스트: `🎉 7일 연속 체크인 달성! 아바타 제작권 1회가 충전되었습니다! 🎨`
- [x] **Step 4: 스모크 테스트 및 무결성 게이트 통과 (`scripts/smoke-test.js`)**
  - `#TASK-ES-125` 컴플라이언스 테스트 9대 항목 신설
  - `npm test` 266개 ALL PASS (0 failure), 14대 헌법 게이트 100% PASS, Zero Dead Click 100% PASS
- [ ] **Step 5: 로컬 메인 병합 및 5A 프리뷰 배포 (상민님 승인선 대기)**
