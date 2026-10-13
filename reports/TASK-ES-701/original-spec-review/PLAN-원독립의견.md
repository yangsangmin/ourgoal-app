원PLAN은 helper 내부 missing-column 재시도의 같은 id만 검사한다. 실제 submit이 저장 중 다시 눌려 새 id로 두 번 실행되는 경계와 결과 알림의 oracle을 별도로 적어야 한다.

이 의견은 고정 facccf8의 원PLAN 최초1회 사전검토다. 앞선 REQ 의견을 PLAN의 심사로 재사용하지 않고 실제 단계/측정 계약을 본다.

| 식별자 | 100자 이내 지적 | 근거 구분 |
| --- | --- | --- |
| SQ-P01 | missing-column same-id oracle은 동시 submit의 새 id 2개를 잡지 못한다. in-flight 잠금·열기당 id 경계를 분리해야 한다. | 원 callback 로컬 실측·PLAN6절 |
| SQ-P02 | insertFeedPost 결과에는 post가 없다. 캐시는 withMeta 반환 post, SDK 결과는 error/metaStripped로 구분해 pin해야 한다. | 실제 공개 helper 반환 실측·PLAN3절 표현 |

SQ-P01: 원 source는 callback 안에서 매번 postId를 생성하고 첫 await 전 submit 잠금이 없다. 동일 callback을 두 번 시작한 bounded fixture에서 post_1/post_2로 두 insert가 시작되고 메모리 cache·성공 toast도 각각 발생했다. 실제 사용자 클릭이나 서버 중복 행을 측정한 것은 아니다. SAVE-SYNC-CONTRACT 7절은 저장 중 단추 잠금과 창을 열 때 한 번 id를 정한다. 기존 지시 기준을 새 권위/완화로 바꾸지 않는다.

최소 oracle은 한 번 창 열기→첫 submit 지연→두 번째 입력→중복 효과0/같은 publication frame 귀속→결과별 unlock·실패 보관/성공 알림이다. 새 자동 재시도나 옛 pending 재분류는 넣지 않는다. 버튼·id 계약을 바꾸기 곤란하면 저장 안정화 담당의 선행 단계와 이번 범위의 미충족을 분명히 적는다.

SQ-P02는 API 명칭의 모호함이다. PLAN3절의 기존 helper의 결과 post가 withMeta preparedPost를 뜻하면 그 함수명을 적으면 된다. 실제 insertFeedPost는 SDK {error} 응답을 그대로 반환하고 post를 반환하지 않는다. 성공·missing-column·권한·thrown 각각에서 어느 preparedPost가 local/cache에 남는지를 고정해야 한다. 새 API 변경이나 공유 category-map 편집을 요구하지 않는다.

manual category→다른 goal/__none__, default unknown→life, captured title/id/topic/visibility/pct/caption, missing-column 같은 id/extra·RLS 추가 retry0·helper absence·JSON/old extra-only 원정보 보존은 기존 계획대로 별도 source-bound oracle이 필요하다. 이 리뷰에서는 그 미래 구현을 시험하거나 기존 expected를 바꾸지 않았다.