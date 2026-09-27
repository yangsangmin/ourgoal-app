# TASK-ES-318 법정 주장서 (Claims)

## 과제 개요
- **티켓**: `#TASK-ES-318`
- **노션 생각 메모장 번호**: `[67]번`
- **지시 내용**: "DM 전송 상태·읽음 확인(상대방 도착/읽음 표시) 및 전송·수신 시각 상세 표시 (카카오톡 방식) — DM 전송됨(상대방에게 실제 도착했을 때), 읽음, 전송된 시간, 읽은 시간 표시되게 해야함. 카톡 레퍼런스 해서 적용해"

## 요구사항 및 실체 코드 매핑
- **R1 / C1**: `js/team-invite-comm.js` 내에 `renderSingleDmMsg` 단일 메시지 렌더러 구현 (카카오톡 방식 노란색 1 뱃지 `#eab308` 및 전송 시각 표출)
- **R2 / C2**: `js/team-invite-comm.js` 내에 `formatDmDetailTime` 상세 시각 포맷터 구현
- **R3 / C3**: `js/team-invite-comm.js` 내에 `toggleDmMsgDetail` 및 `dm-msg-detail-box` 상세 타임스탬프 요소 구비
- **R4 / C4**: `js/team-invite-comm.js` 내에 `markDmThreadAsRead` 읽음 동기화 함수 구현
- **R5 / C5~C6**: `js/components.js` 내에 `handle소통_Item67Action` 직통 핸들러 및 `og_task-67_cache` 로컬 캐시 영속화, 4대 뷰 원자적 전파 구현
- **R6 / C7, C9**: `scripts/smoke-test.js` 및 `tests/dm-delivery-read-receipt.test.js`에 `#TASK-ES-318` 전수 검증 테스트 구축 (436개 전수 통과)
- **R7 / C8**: `docs/rules/TICKETS.md`에 `#TASK-ES-318` 승인 티켓 등록

## 검증 결과
- `tests/dm-delivery-read-receipt.test.js`: 통과 (100%)
- `scripts/smoke-test.js`: 436개 통과, 0개 실패 (100% 무결점)
