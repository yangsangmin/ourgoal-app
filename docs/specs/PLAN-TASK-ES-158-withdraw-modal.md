# 작업계획서 (PLAN) — 회원 탈퇴 전용 안내 모달 및 법적책임·데이터분실 사전 안내 4위 1체 배선

> **문서 ID**: PLAN-TASK-ES-158-withdraw-modal  
> **티켓 연계**: #TASK-ES-158  
> **작성 일시**: 2026-09-17  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**: 브라우저 기본 confirm()을 완전 제거하고, 법적책임·데이터분실·30일유예 3대 안내 블록과 체크박스 동의 안전핀을 구비한 프리미엄 전용 회원 탈퇴 모달(#withdrawModal) 구축.
- **영향받는 파일 전수 목록**:
  1. `index.html`: #withdrawModal 마크업 추가, withdrawAccount 및 openWithdrawModal/closeWithdrawModal/submitWithdrawAccount 비즈니스 로직 배선.
  2. `ui.css`: 탈퇴 모달 전용 경고 박스, 법적 보존 박스, 체크박스 스타일링.
  3. `docs/rules/TICKETS.md`: #TASK-ES-158 티켓 상태 관리.
  4. `scripts/smoke-test.js`: 탈퇴 모달 인터랙션 및 4위 1체 검증 단언문 추가.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 및 배선(Wire) 식별
- **[본질] (Essence)**: 사용자의 자기 통제권 및 알 권리를 보장하고 데이터 분실을 방지하는 안전 관문 구축.
- **[원인] (Causes)**: 브라우저 confirm 방식의 낮은 시인성과 법령상 필수 고지 항목(데이터 영구 파기 및 법정 보존)의 UI 부재.
- **[중심] (Core)**: 3대 안내 블록과 체크박스 동의 안전핀을 탑재한 전용 #withdrawModal 독립 배선.
- **[핵심] (Anchor)**: 실수 탈퇴 원천 차단 및 30일 유예 기간 내 100% 무손실 복구 보증.
- **전역 상태(state) 영향 분석**:
  - `state.user` 및 `state.profile` 읽기만 수행 (탈퇴 확정 전까지 데이터 변동 0).
  - 탈퇴 집행 시 `/api/withdraw` 성공 후 세션 스토리지 소각 및 `renderLandingScreen()`.
- **종단간 데이터 흐름**:
  `[#withdrawBtn 클릭] ➔ [openWithdrawModal() 모달 팝업] ➔ [안내 3대 블록 표출] ➔ [#withdrawAgreeCheck 체크] ➔ [#withdrawConfirmBtn 활성화] ➔ [submitWithdrawAccount() 호출] ➔ [/api/withdraw 통신] ➔ [30일 유예 알림 및 안전 로그아웃]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)
- **파일별 변경 예산**:
  - `index.html`: +65줄 / -15줄 (모달 마크업 + JS 함수)
  - `ui.css`: +35줄 / -0줄 (탈퇴 모달 전용 CSS)
  - `scripts/smoke-test.js`: +15줄 / -0줄 (신규 테스트)
- **4위 1체 배선 명세**:
  - 마크업: `#withdrawModal`, `#withdrawCloseBtn`, `#withdrawAgreeCheck`, `#withdrawConfirmBtn`, `#withdrawCancelBtn`
  - 리스너: 모달 열기/닫기, 체크박스 change, 탈퇴 클릭
  - 비즈니스 로직: 안내 검증, 서버리스 API 호출, 예외 롤백
  - 사용자 피드백: 로딩 인디케이터, 토스트, 로그아웃 안내

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- **유저 자산 100% 보존 재확인**:
  - 탈퇴 모달 오픈/취소는 순수 읽기 동작으로 기존 아바타, 목표, 기록에 절대 영향 없음.
  - 탈퇴 신청 시에도 30일 유예 소프트 딜리션 정책이 적용되므로 실수 탈퇴 시 재로그인으로 100% 원복 가능.

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. `ui.css`에 탈퇴 모달 전용 클래스(`.withdraw-warning-box`, `.withdraw-legal-box`, `.withdraw-check-row`) 추가.
2. `index.html`에 `#withdrawModal` 마크업 삽입 (설정 탭 모달 영역).
3. `index.html`에 `openWithdrawModal`, `closeWithdrawModal`, `submitWithdrawAccount` 함수 작성 및 `#withdrawBtn` 연결.
4. `scripts/smoke-test.js`에 모달 오픈, 체크박스 토글, 버튼 상태 검증 추가.
5. `npm test` 및 `verify-integrity-gate.js` 전수 검증.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
- **검증 A (Zero Dead-Click)**: #withdrawBtn, #withdrawCloseBtn, #withdrawCancelBtn, #withdrawConfirmBtn 전수 클릭 테스트.
- **검증 B (Zero Data Loss)**: 탈퇴 모달 열고 닫은 후 페르소나 데이터 무손실 대조.
- **검증 C (Zero UX Regression)**: 설정 탭의 다른 설정(테마, 알림, 백업 등) 정상 작동 확인.
- **검증 D (Full State Propagation)**: 탈퇴 취소 시 설정 탭 유지, 탈퇴 완료 시 랜딩 화면 전환.
- **검증 E (자동화 게이트)**: npm test 298개 이상 ALL PASS 및 verify-integrity-gate.js 통과.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트
- [ ] `ui.css` 스타일 추가
- [ ] `index.html` 마크업 및 JS 로직 구현
- [ ] 스모크 테스트 및 무결성 게이트 통과 (2단계)
- [ ] 4단계 로컬 메인 병합

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재 오류**: 모달 backdrop z-index 충돌로 뒤 배경이 클릭되는 현상.
- **방어**: `z-index: 9999` 및 `modal-backdrop` 클릭 시 닫기 배선.
- **롤백**: `git checkout main`으로 즉시 원복 가능.
