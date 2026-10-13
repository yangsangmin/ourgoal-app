### 🚀 [MODE_4A] 5대 고정 블록 표준 구현 보고서

#### [블록 1] 개요
공유 창은 운동·마음 목표 라벨을 피드 카테고리로 바꾸지 않아 공부·수험으로 떨어지고 게시 metadata를 보내지 않았다. 또한 SDK 오류를 성공으로 표시하고, 저장 중 다시 입력하면 새 ID를 만들었다. 기존 매핑/metadata/insert helper를 연결하고 같은 열린 창의 입력과 결과를 고정한다.

#### [블록 2] REQ / PLAN 및 구체적 식별자
TASK-ES-701. 원REQ/PLAN과 첫 독립 검토82e7은 변경하지 않았고 SQ-R01/SQ-P01/SQ-P02는 별도 교정 계약에 반영했다. `docs/specs/REQ-TASK-ES-701-CORRECTION.md`, matching PLAN, `#shareGoalSelect`, `[data-shcat]`, `#shareConfirmBtn`, `#shareFeedSaveStatus`, `openShareToFeedModal`, `records.share-feed-intent`. 심사 청구 단계이며 병합 승격0.

#### [블록 3] 핵심 변경사항
카테고리는 `fromGoal` 또는 life, 수동 선택은 목표 변경 뒤에도 유지한다. 첫 await 전에 실제 목표·카테고리·진행률·본문을 preparedPost에 묶어 withMeta/insertFeedPost로 보낸다. SDK 결과와 cache 입력은 다른 값이다. missing-column retry는 기존 helper가 같은 ID/extra로 처리한다.

새 records/share-feed-save helper는 현재 창의 immutable 의도/계정/ID/inflight만 다룬다. 오류·응답 유실이면 창/입력을 유지하고 초안 미보관을 알린다. 새 영구 local/remote 초안 저장소0, 자동 게시0, 과거 자료 변경0이다. 닫기/새로고침 후 작성 초안 복구는 미구현이다. SDK 수용 이후 profile 저장 실패를 중복 게시로 바꾸지 않고 await 뒤 계정 liveness를 검사한다.

Loader는 원 share-to-feed 태그 앞 같은 줄 추가이며 원태그/버전 보존이다. 공식 generated modules/main baseline 규칙 적용, baseline 상향0/기존 단언·기대 변경0/보호 파일 편집0이다. 고정 제품bc61과 f0ac 결합 뒤의 소유 파일·Claims 바이트 비교는 required-checks.json에 있다.

#### [블록 4] Claims (주장)
고정 product-manifest/Claims와 원자료는 reports/TASK-ES-701에 있다. 변경 저장13개 component 측정은 실제 Supabase E2E가 아니다. 실제 익명 UI 카테고리/미리보기3개와 실제 요청 차단 실패2개, 추가 profile-await 계정 변경1개는 source별로 구분했다. required npm 최초1회 종료0, official gen/guard 종료0이다. 기존 standalone ingress 단언 실패는 기준 db8에서도 같음을 별도 측정했으며 시험을 고치지 않았다.

C1/C2는 실제 UI 시나리오, C3 로그인 metadata/정확행/중복 원격효과는 needs-live-server다. 본 작업의 원격 쓰기 예산0, 실제 서버/운영/두 탭/실기기/장기효과 미확인이다. 초기 HTTP 인코딩·잘못된 새 guest 전제/라벨·harness 의존성 실패·태그 없는 merge 거절·두 CRLF stderr 정규화 원시를 보존했다. 원제품 과정/본질 검토는 root가 분리 배정한다.

#### [블록 5] 독립 법정 판정서 (GitHub Court Verdict)
심사 요청 전. 이 PR을 병합하지 않는다. 외부 Court 판정·원제품 독립 의견·root의 source 귀속 검토를 함께 인수한다. 로컬 측정은 판정이 아니다.
