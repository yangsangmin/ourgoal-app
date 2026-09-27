# REQ-TASK-ES-321: 원격 로그아웃 전 로그인 기기 목록 확인 및 개별 세션 제어 완결

## 1. 배경 및 목적
- **출처**: 상민님 생각 메모장 [70]번 아이디어
- **원문 지시**: *"다른 모든 기기 원격 로그아웃은 진행 전 어디에 로그인이 각각 되어있는지 확인할 수 있어야 하고 끄면 그게 꺼지는 지 직접 확인 가능한 형태의 서비스가 필요함"*
- **목적**:
  1. 기기 목록 5대 식별 앵커(OS, 브라우저, 기기 타입, 위치/IP 힌트, 최근 활동 일시)를 완비하여 어디에 로그인이 각각 되어 있는지 직관적으로 사전 확인.
  2. "끄면 즉시 꺼지는" 실시간 양방향 시각적 상태 전이(`🟢 정상 연결 중` ➔ `🔴 원격 차단됨`, 카드 반투명 및 비활성화, 활성 기기 카운트 배지 즉시 차감) 보장.
  3. "다른 모든 기기 일괄 로그아웃" 실행 전 어디서 로그아웃되는지 목록을 사전 확인하고 취소/진행을 선택할 수 있는 2중 확인 모달(`openLogoutOtherDevicesConfirmModal`) 구축.
  4. 개정 헌법 8원칙 및 4대 뷰 원자적 전파 표준 직통 핸들러 `handle인증_Item70Action` 완비.

## 2. 요구사항 명세
1. **R1**: `index.html` 내 `getRegisteredDevices` 함수가 OS/브라우저, 기기 타입(PC/모바일/태블릿), 위치/IP 힌트, 로그인 시각, 최근 활동 일시 등 5대 식별 앵커를 제공함을 보장한다.
2. **R2**: `index.html` 내 `renderActiveDevicesList` 함수가 등록 기기 목록과 실시간 상태 배지(`🟢 정상 연결 중` / `🔴 원격 차단됨`)를 렌더링하고, 카운트 뱃지(`activeDeviceCountBadge`)를 즉시 갱신한다.
3. **R3**: `index.html` 내 개별 기기 로그아웃 버튼(`.btn-revoke-device`) 클릭 시 12ms 햅틱 피드백을 제공하고, 해당 기기 세션을 즉시 차단 상태(`revoked=true`)로 전환하여 실시간 시각적 전이를 보장한다.
4. **R4**: `index.html` 내 다른 모든 기기 원격 로그아웃 버튼(`logoutOtherDevicesBtn`) 클릭 시 즉시 일괄 로그아웃하지 않고 사전 2중 확인 모달(`openLogoutOtherDevicesConfirmModal`)을 표출하여 차단 대상 기기 목록을 확인시킨다.
5. **R5**: `index.html` 내 사전 확인 모달에서 실행 승인(`btnConfirmLogoutOtherModal`) 시 현재 기기를 제외한 모든 타 기기 세션을 일괄 차단하고 화면을 원자적으로 즉시 갱신한다.
6. **R6**: `js/components.js` 내에 직통 핸들러 `handle인증_Item70Action`이 구현되어 12ms 햅틱 반응, `og_task-70_cache` 로컬 캐시 영속화, 4대 뷰 원자적 전파를 보장한다.
7. **R7**: `tests/device-session-control.test.js` 및 `scripts/smoke-test.js` 내에 `#TASK-ES-321` 검증 테스트가 정의되어 무결점을 전수 입증한다.
8. **R8**: `docs/rules/TICKETS.md`에 `#TASK-ES-321`이 승인 티켓으로 등록되어 있다.
