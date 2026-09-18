# 실행 계획서 (PLAN) — 폰 잠금화면에서 바로 보기 통합 허브 및 선택형 3대 기능 구축

> **문서 ID**: PLAN-TASK-ES-181-LOCKSCREEN-HUB  
> **티켓 연계**: #TASK-ES-181  
> **작성 일시**: 2026-09-18  
> **작성자**: Antigravity  
> **귀속 축**: E1 / UX  
> **진행 상태**: 3단계(로컬 구현 중)  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 2회차 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- 상민님 지시사항: 폰 잠금화면을 켤 때 앱에 들어오지 않아도 일정을 확인할 수 있도록, 선택형으로 모든 방식을 제공하고 설정법 안내와 즉시 설정을 한 모달에서 완결하는 허브 구축.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질**: 잠금화면 0초 인지 사용자 경험 혁신.
- **중심 & 핵심**: 3가지 선택지(배경화면, 위젯 구독, 모닝 알림)의 명확한 시각적 가이드 및 원클릭 즉시 실행력 완비.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- `index.html`:
  1. `#screen-calendar` 내 `#calLockScreenBtn` 추가 및 `renderCalendarScreen` 클릭 바인딩.
  2. `generateLockScreenCalendarImage`: 1080×2340 Canvas 2D 고해상도 그래픽 렌더러 구현 (상단 세이프존, 중앙 월간 캘린더 그리드, 하단 일정/D-Day 카드).
  3. `openLockScreenHubModal`: 3단 탭(배경화면/위젯/알림) 및 기종별(iOS/Android) 가이드 통합 모달 구현.
  4. `window.openLockScreenHubModal`, `window.generateLockScreenCalendarImage` 전역 노출.
- `sw.js`:
  - 캐시 네임을 `ourgoal-shell-v20260918-es181-lockscreen-hub`로 갱신.

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증 (Review & Safety)
- 기존 캘린더 네비게이션, 일정 등록, 구글 연동 기능에 무영향.
- 4위 1체 배선 준수(데드클릭 제로).

---

## 5. [원칙 ⑤] 정답 · 최선의 방안 탐색 (Optimal Solution Architecture)
- 단일 모달 내 탭 전환 구조로 화면 이탈 없이 완결.
- Canvas 2D 기반으로 외부 무거운 라이브러리 없이 0.1초 내 렌더링.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계 (Re-Verification)
- **Step 1**: `index.html` 및 `sw.js` 코드 구현.
- **Step 2**: JS 구문 유효성 검사 (`new Function` 검증).
- **Step 3**: `npm test` 스모크 테스트 및 `node scripts/verify-integrity-gate.js` 무결성 게이트 검증.
- **Step 4**: Headless Chrome CDP 자동화 테스트 스크립트 실행 및 실물 스크린샷 캡처.
- **Step 5**: Git 커밋 및 PR 생성.
- **Step 6**: 관제센터 저널 및 Tri-Sync 3자 동기화 무결성 검증.
- **Step 7**: 상민님께 실서버 배포 여부 결심 요청.

---

## 7. [원칙 ⑦] 위험 최소화 · 예외 상황 대응 (Risk Management & Fallbacks)
- 브라우저 클립보드 미지원 환경을 고려한 인풋 선택 및 execCommand 폴백 제공.
- 캔버스 렌더링 실패 시 기본 이미지 대체 및 에러 로그 처리.

---

## 8. [원칙 ⑧] 지속적 검증 · 피드백 수렴 · 반영 (Continuous Verification & Integrity Gates)
- 무결성 게이트 20개 항목 100% 통과 확인.
- 실서버 배포 후 라이브 HTTP 200 OK 및 캐시 버전 확인.
