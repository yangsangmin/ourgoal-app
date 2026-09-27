# REQ-TASK-ES-322: 2단계 인증(2FA) 실질적 보안 작동 및 무결성 복구

## 1. 배경 및 목적
- **출처**: 상민님 생각 메모장 [71]번 아이디어
- **상민님 원문 메모**: *"2단계 인증 실질적 작동 안함"*
- **목적**:
  1. 설정창에서 껍데기로만 토글되던 2FA 스위치를 실질적인 4자리 보안 PIN 모달(`openTwoFactorSetupModal`)과 직통 연동.
  2. 2FA 해제 시 본인 확인을 거치는 2중 보안 검증 모달(`openTwoFactorDisableModal`)을 탑재하여 임의 해제 방지.
  3. 2FA 활성화 시 상시 PIN 변경을 지원하는 `btnChange2FaPin` 컨트롤 UI 완비.
  4. 앱 진입(`enterApp`) 시 2FA 활성 계정에 대해 미인증 세션을 차단하고 4자리 PIN 챌린지 모달(`challengeTwoFactorModal`)을 강제하여 무단 접근 원천 봉쇄.
  5. 개정 헌법 8원칙 및 4대 뷰 원자적 전파 표준 직통 핸들러 `handle인증_Item71Action` 완비.

## 2. 요구사항 명세
1. **R1**: `index.html` 내 `openTwoFactorSetupModal` 함수가 4자리 보안 PIN 번호 입력 및 확인을 강제하고 저장 시 2FA를 활성화함을 보장한다.
2. **R2**: `index.html` 내 `openTwoFactorDisableModal` 함수가 2FA 해제 시 기존 설정된 4자리 보안 PIN 일치 여부를 검증하고 일치할 경우에만 해제함을 보장한다.
3. **R3**: `index.html` 내 설정 화면에 2FA 활성 상태에서 4자리 보안 PIN을 언제든 재설정할 수 있는 `btnChange2FaPin` 버튼 및 `twoFactorPinControls`가 제공됨을 보장한다.
4. **R4**: `index.html` 내 `enterApp` 진입 시 2FA 활성 계정에 대해 세션 미인증 상태일 때 `challengeTwoFactorModal` 챌린지를 강제하여 앱 진입을 차단함을 보장한다.
5. **R5**: `index.html` 내 `challengeTwoFactorModal` 모달에서 올바른 4자리 PIN 입력 시 `ourgoal_2fa_verified` 세션 스토리지를 기록하고 앱 잠금을 해제함을 보장한다.
6. **R6**: `js/components.js` 내에 직통 핸들러 `handle인증_Item71Action`이 구현되어 12ms 햅틱 반응, `og_task-71_cache` 로컬 캐시 영속화, 4대 뷰 원자적 전파를 보장한다.
7. **R7**: `tests/two-factor-auth.test.js` 및 `scripts/smoke-test.js` 내에 `#TASK-ES-322` 검증 테스트가 정의되어 무결점을 전수 입증한다.
8. **R8**: `docs/rules/TICKETS.md`에 `#TASK-ES-322`가 승인 티켓으로 등록되어 있다.
