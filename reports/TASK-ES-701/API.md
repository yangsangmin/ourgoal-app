# 현재 게시 의도 API

`OurgoalCapabilities.call('records.share-feed-intent', L)` → `{id, account, submit(post), bind(sheet)}`. 제공 세포 `records/share-feed-save`. 실제 기존 capabilities 등록부와 동일 scope를 쓴다. 새 전역/자리/issuer0.

ID는 modal을 열 때 1회. `submit`은 첫 post를 JSON 복사 후 재귀 freeze하고 반환 복사만 제공한다. 동일 창 retry는 같은 준비 입력과 ID. account가 달라지면 다음 효과0. inflight/accepted 중복은 추가 insert0. 실제 provider가 없는 것을 역할/JSON으로 지원한다고 표시하지 않는다.

SDK `{error:null}`만 accepted; error는 rejected, throw/응답 없음은 unconfirmed, helper 없음은 unsupported다. 이것은 SDK 쓰기 응답의 수용 상태이며 정확 원격 행 readback은 null이다. `insertFeedPost` SDK 결과와 `withMeta` preparedPost는 다르다. missing-column retry는 기존 map 책임이다.

새 초안 저장0, local/remote ledger 추가0, 자동 publication/retry0. 실패는 현재 창 메모리에서만 입력을 유지한다. binder는 그대로 retry할 입력을 잠그고 닫기/새로고침 미보관을 실제 상태 줄에 알린다. original markup/listener/본문 생성 block 이동0. caller는 명시 수용/current account일 때 반환 preparedPost를 기존 cache/profile에 1회 연결한다.

현재 실패→기기 보관 경로는 없다. profile settings는 saveProfile 원격 payload에 포함되지 않으므로 이 호출로 초안 원격 보관을 주장하지 않는다. 과거 settings/extra-only/pending 데이터를 지우거나 마이그레이션하지 않는다.
