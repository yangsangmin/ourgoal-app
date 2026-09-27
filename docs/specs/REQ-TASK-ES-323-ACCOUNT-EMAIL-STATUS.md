# REQ-TASK-ES-323: 설정 계정 및 보안 로그인 상태 시 이메일 게스트모드 오표기 오류 수정

## 1. 배경 및 목적
- **출처**: 상민님 생각 메모장 [72]번 아이디어
- **상민님 원문 메모**: *"설정의 계정 및 보안에서 로그인 상태인데 로그인 계정 이메일에 게스트모드(로그인 후 계정 연동)이라고 잘못 표시됨"*
- **목적**:
  1. 로그인 상태(이메일 회원, 카카오 연동, 구글 연동)임에도 설정 화면의 '로그인 계정 상태' 및 비밀번호 변경 버튼이 게스트 모드로 잘못 표기되는 결함을 근절.
  2. 단일 정본 판별 유틸 `getAccountStatusInfo(p, u)` 구축 및 `window.getAccountStatusInfo` 전역 노출.
  3. 세션 복원 및 인증 파이프라인(`restoreSessionAndEnter`, `boot`, `signUp`, `loginSubmit`, `onAuthStateChange`) 전반에서 `state.user` 전역 영속화 및 `loadProfile` 반환 객체에 `email`, `provider` 필드 정규화 주입.
  4. 설정 화면(`renderSettingsScreen`) 및 히어로 카드(`renderSettingsHeroCard`)에서 단일 정본 판별기를 직접 연동하여 정직하고 정확한 계정 상태 렌더링.
  5. 개정 헌법 8원칙 및 4대 뷰 원자적 전파 표준 직통 핸들러 `handle인증_Item72Action` 완비.

## 2. 요구사항 명세
1. **R1**: `index.html` 내 `getAccountStatusInfo(p, u)` 함수가 정의되고 `window.getAccountStatusInfo`로 전역 노출됨을 보장한다.
2. **R2**: `index.html` 내 세션 복원 및 로그인/회원가입/로그아웃 파이프라인에서 `state.user`가 일관되게 영속화 및 초기화됨을 보장한다.
3. **R3**: `index.html` 내 `loadProfile` 함수가 반환하는 프로필 객체에 `email` 및 `provider` 필드가 누락 없이 정규화 주입됨을 보장한다.
4. **R4**: `index.html` 내 `renderSettingsScreen` 함수에서 `getAccountStatusInfo`를 호출하여 `setAccountEmail`에 `accInfo.displayEmail`, `btnChangePassModal`에 `accInfo.passwordButtonText`를 반영함을 보장한다.
5. **R5**: `index.html` 내 `renderSettingsHeroCard` 함수에서 `getAccountStatusInfo`를 호출하여 `settingsHeroStatusDesc`에 `accInfo.badgeHtml`을 반영함을 보장한다.
6. **R6**: `js/components.js` 내에 직통 핸들러 `handle인증_Item72Action`이 구현되어 12ms 햅틱 반응, `og_task-72_cache` 로컬 캐시 영속화, 4대 뷰 원자적 전파를 보장한다.
7. **R7**: `tests/account-email-status.test.js` 및 `scripts/smoke-test.js` 내에 `#TASK-ES-323` 검증 테스트가 정의되어 무결점을 전수 입증한다.
8. **R8**: `docs/rules/TICKETS.md`에 `#TASK-ES-323`가 승인 티켓으로 등록되어 있다.
