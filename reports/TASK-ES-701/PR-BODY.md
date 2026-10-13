### 🚀 [MODE_4A] 5대 고정 블록 표준 구현 보고서

#### [블록 1] 개요
공유 창은 운동·마음 목표 라벨을 피드 카테고리로 바꾸지 않아 공부·수험으로 떨어지고 게시 metadata를 보내지 않았다. 또한 SDK 오류를 성공으로 표시하고, 저장 중 다시 입력하면 새 ID를 만들었다. 기존 매핑/metadata/insert helper를 연결하고 같은 열린 창의 입력과 결과를 고정한다.

#### [블록 2] REQ / PLAN 및 구체적 식별자
TASK-ES-701. 원REQ/PLAN과 첫 독립 검토82e7은 변경하지 않았고 SQ-R01/SQ-P01/SQ-P02는 별도 교정 계약에 반영했다. `docs/specs/REQ-TASK-ES-701-CORRECTION.md`, matching PLAN, `#shareGoalSelect`, `[data-shcat]`, `#shareConfirmBtn`, `#shareFeedSaveStatus`, `openShareToFeedModal`, `records.share-feed-intent`. 심사 청구 단계이며 병합 승격0.

#### [블록 3] 핵심 변경사항
카테고리는 `fromGoal` 또는 life, 수동 선택은 목표 변경 뒤에도 유지한다. 첫 await 전에 실제 목표·카테고리·진행률·본문을 preparedPost에 묶어 withMeta/insertFeedPost로 보낸다. SDK 결과와 cache 입력은 다른 값이다. missing-column retry는 기존 helper가 같은 ID/extra로 처리한다.

새 records/share-feed-save helper는 현재 창의 immutable 의도/계정/ID/inflight만 다룬다. 오류·응답 유실이면 창/입력을 유지하고 초안 미보관을 알린다. textarea/preview가 첫 준비 문구와 일치하도록 잠그고 settled 후 기존 취소를 활성화한다. 새 영구 local/remote 초안 저장소0, 자동 게시0, 과거 자료 변경0이다. 닫기/새로고침 후 작성 초안 복구는 미구현이다. 이 caller의 broad saveProfile을 제거하고 실제 current 계정에 귀속된 기존 local-settings owner/cache만 소비한다. 공유 home/gcal source는 변경하지 않는다.

Loader는 원 share-to-feed 태그 앞 같은 줄 추가이며 원태그/버전 보존이다. 공식 generated modules/main baseline 규칙 적용, baseline 상향0/기존 단언·기대 변경0/보호 파일 편집0이다. 고정 제품bc61과 f0ac 결합 뒤의 소유 파일·Claims 바이트 비교는 required-checks.json에 있다.

#### [블록 4] Claims (주장)
고정 원product-manifest/Claims와 원자료는 reports/TASK-ES-701에 있다. 최초 제품bc61·원 검토f4dd와 이후 교정 source는 구분한다. 최신 교정은 actual guest6개와 실제 gcal owner SDK fixture4개·same-ID/concurrent2개를 재었고 실제 Supabase E2E는 아니다. 기존 required npm 최초1회 종료0은 원1e378/merged tree에 귀속한다. 교정 official gen/guard·preview·Claims schema 종료0. standalone ingress는 기준 db8에서도 같은 단언 실패를 확인했다. 새 standalone target/latest-record는 index-only 원단언에서 실패했고 첫제품 index와 같은 입력임을 SHA로 남겼으며 통과로 판정하지 않았다. 시험을 고치지 않았다.

C1/C2 기존 UI 단언을 유지하며 실제 Court landing preview 입구를 추가했다. C3의 원문/req/kind/touches를 유지하고 실제 로그인 metadata/정확행/중복 원격효과 한계만 법정 supported needs-login schema로 교정했다. C4/C5는 frozen caption/Cancel 실제 UI를 별도 청구한다. 본 작업의 원격 쓰기 예산0, 실제 서버/운영/두 탭/실기기/장기효과 미확인이다. 첫 f4dd 원과정/본질 의견과 세 지적/초기실패/첫법정 반려는 원문으로 보존했다. 신규 원검토 긍정 반복0이다.

#### [블록 5] 독립 법정 판정서 (GitHub Court Verdict)
첫 Court0A7F8493(1e378/실행38397563659)은 돌려보냄·누적1회다. C1/C2는 익명 입구 단계에서 실패했고 C3는 한계 사유 schema를 닫아야 했다. 원artifact를 보존했으며 새 fixedhead로 다시 심사받는다. 이 PR을 병합하지 않는다. 외부 새 Court 판정·원제품 독립 의견과 교정·root의 source 귀속 검토를 함께 인수한다. 로컬 측정은 판정이 아니다.
