# REQ-TASK-ES-318: DM 전송 상태·읽음 확인(상대방 도착/읽음 표시) 및 전송·수신 시각 상세 표시 (카카오톡 방식)

## 1. 배경 및 목적
- **출처**: 상민님 생각 메모장 [67]번 아이디어
- **원문 지시**: *"DM 전송 상태·읽음 확인(상대방 도착/읽음 표시) 및 전송·수신 시각 상세 표시 (카카오톡 방식) — DM 전송됨(상대방에게 실제 도착했을 때), 읽음, 전송된 시간, 읽은 시간 표시되게 해야함. 카톡 레퍼런스 해서 적용해"*
- **목적**: 1:1 DM 채팅에서 카카오톡의 직관적인 사용자 경험을 완벽히 벤치마킹하여, 상대방이 읽지 않은 메시지에 노란색 숫자 1 뱃지를 표출하고, 전송 시각(sentAt), 도착 시각(deliveredAt), 읽은 시각(readAt)을 정밀하게 기록 및 시각화하여 사용자가 메시지의 전달 및 열람 상태를 즉시 확인할 수 있도록 함.

## 2. 요구사항 명세
1. **R1**: `js/team-invite-comm.js` 내에 `renderSingleDmMsg` 단일 메시지 렌더러가 구현되어, 카카오톡 방식의 미확인 노란색 숫자 1 뱃지(`dm-unread-badge`, `#eab308`) 및 전송 시각을 표출한다.
2. **R2**: `js/team-invite-comm.js` 내에 `formatDmDetailTime` 함수가 구현되어 년월일 및 초 단위까지 정밀한 시각 포맷팅을 지원한다.
3. **R3**: `js/team-invite-comm.js` 내에 `toggleDmMsgDetail` 함수 및 `dm-msg-detail-box` 요소가 구비되어, 말풍선 탭/클릭 시 상세 전송·도착·읽음 타임스탬프를 확인할 수 있다.
4. **R4**: `js/team-invite-comm.js` 내에 `markDmThreadAsRead` 함수가 구현되어 대화방 진입 및 메시지 수신 시 원자적으로 읽음 상태를 서버 및 로컬에 동기화한다.
5. **R5**: `js/components.js` 내에 직통 핸들러 `handle소통_Item67Action`이 구현되어 12ms 햅틱 반응, `og_task-67_cache` 로컬 캐시 영속화, 4대 뷰 원자적 전파를 보장한다.
6. **R6**: `tests/dm-delivery-read-receipt.test.js` 및 `scripts/smoke-test.js` 내에 `#TASK-ES-318` 검증 테스트가 정의되어 무결점을 전수 입증한다.
7. **R7**: `docs/rules/TICKETS.md`에 `#TASK-ES-318`이 승인 티켓으로 등록되어 있다.
