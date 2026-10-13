원REQ R4는 insert 실패를 로컬 fallback으로 넘긴 뒤 사용자에게 어떤 상태를 알릴지 닫지 않았다. SDK error를 잡는 구현만으로 현재 성공 알림이 사실에 맞게 바뀌지 않는다.

이 의견은 고정 facccf8의 원REQ 최초1회 사전검토다. 제품0이며 미래 교정 제품은 실행하지 않았다. 기존 original source의 결함과 이번 요구 계약의 미기재를 구분한다.

| 식별자 | 100자 이내 지적 | 실측·읽음·한계 |
| --- | --- | --- |
| SQ-R01 | R4의 returned/thrown 실패 fallback 뒤 기존 성공 toast가 남는다. 보관·거절·미확정 UI 결과를 명시해야 한다. | 원 submit callback 로컬 실측·원REQ 읽음 |

근거는 share-to-feed.js의 #shareConfirmBtn callback이다. insert의 {error}를 읽지 않은 뒤 profile cache·saveProfile·성공 toast로 흐른다. SAVE-SYNC-CONTRACT 7절은 결과에 맞는 알림·기기 쓰기 확인 전 닫기 금지를 정하며 실패가 성공으로 보이는 것은 출시 차단 기준이다. R4가 returned error를 catch/fallback으로 연결해도 이후 무조건 성공 알림을 그대로 두면 사용자가 서버 게시 성공으로 읽는다.

최소 보완은 이 owned caller의 명확한 서버 결과와 로컬 보관/미확정 UI 문구·닫기 조건을 요구에 적는 것이다. 저장되지 않은 것을 보관됐다고 쓰지 않는다. shared saveProfile·저장 설정을 여기서 고치거나 새 자동 retry/queue를 만드는 것이 아니다. 보관 확인 API가 아직 없으면 그 한계와 서버 성공을 구분한다.

SQ-R01 원 callback fixture는 returned RLS 오류에서 같은 post 1개를 메모리 cache에 두고 성공 toast를 호출했다. 실제 브라우저 클릭·서버 요청·기기 저장 확인은 0/null이다. old source baseline을 이번 미구현 제품의 실패나 실제 RLS 판정으로 승격하지 않는다.

R1/R2/R3의 기존 fromGoal 재사용, 수동 override 보존, 첫 await 전 selected goal/pct/caption scalar capture는 기존 API로 구현 가능한 좁은 요구다. old extra-only post를 현재 목표로 다시 분류하지 않는 제한도 별도 유지해야 한다. 이 읽기 의견은 완료·통과 판정이 아니다.