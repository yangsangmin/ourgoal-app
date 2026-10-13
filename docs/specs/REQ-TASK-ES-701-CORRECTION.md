# TASK-ES-701 원검토 교정 요구

원REQ/PLAN facccf8과 최초 원의견82e7fecfb4404e14fa8067b3904f13f47a5d0b83은 변경하지 않는다. 이 문서는 SQ-R01/SQ-P01/SQ-P02를 반영한 제품0 추가 계약이다. 원 scope는 root가 DIR006 소유자로 배정한 공유 caller 교정이며 대표님 원문 코드 선택을 합성하지 않는다. WORK-REFERENCE 기준 PR #968 전체를 잘리지 않는 구간으로 다시 읽었다.

## 1. [원칙 ①] 문제 정확히 파악
SQ-R01: `#shareConfirmBtn`의 반환/throw 오류가 cache와 성공 toast로 이어진다. SQ-P01: 동시 submit이 두 ID/두 insert/두 성공을 만든다. SQ-P02: `withMeta`의 preparedPost와 `insertFeedPost`의 SDK 결과를 구분한다. 원 측정은 fixture-only이며 실제 서버 결과가 아니다.

## 2. [원칙 ②] 본질·원인·중심·핵심
본질은 공유 의도 하나의 입력과 결과 귀속이다. 원인은 원 caller의 무조건 성공 흐름과 callback마다 ID 생성이다. 중심은 `openShareToFeedModal`이다. 핵심은 수동 카테고리·첫 await 전 immutable post·같은 창 ID·사실에 맞는 상태다.

## 3. [원칙 ③] 해결 방식
기존 `OurgoalCategoryMap.fromGoal/withMeta/feedPostMeta/insertFeedPost`를 사용한다. 미지원 default는 life, 수동 선택 뒤 목표 변경은 덮지 않는다. 창마다 ID 하나, 첫 submit 준비 post를 동일 ID 재시도에 재사용한다. 성공 명시 SDK 응답과 `preparedPost`는 다른 값이다. missing-column helper retry는 같은 ID/extra이며 RLS retry0이다.

실패 post는 `myFeedPosts`와 `FEED_POSTS_CACHE`에 게시물로 넣지 않는다. 계정별 기존 settings 열쇠의 `feedShareDrafts`에 보관하고 실제 localStorage 되읽음으로 확인한다. 저장 전/용량오류는 입력을 닫거나 비우지 않고 보관 미확인으로 알린다. 기기 초안은 원격 원장이 아니며 자동 queue/retry0, 응답 유실은 게시 미확정이다. 같은 ID의 명시 재시도에는 내용/계정 변경을 섞지 않는다. 다른 계정 전환은 거절한다. 성공 이후 profile 저장 실패가 같은 insert 재실행을 만들지 않는다.

## 4. [원칙 ④] 재검토
목표/pct/topic/caption/계정이 await 중 바뀌어도 preparedPost는 바뀌지 않는다. 보관 실패를 보관 성공으로 표시하지 않는다. SDK duplicate 응답을 성공으로 추정하지 않으며 실제 조회 없는 원격 확인은 null이다. 초안을 공용 피드에 섞으면 다시 SQ-R01이므로 분리한다.

## 5. [원칙 ⑤] 절차
원 바이트/SHA 보존→교정 요구/계획 고정→size 확인→허용된 caller/helper 경계 구현→원 반례와 필요한 영향검사→Claims/PR/Court. 보호 파일·기존 기대/단언 변경0.

## 6. [원칙 ⑥] 절차 재검증·반론 격파
반론1: `saveLocalSettings` 호출만으로 보관됐다고 할 수 있다. 실제 함수는 오류를 삼키므로 같은 계정 열쇠의 준비 post를 되읽어 동일함을 검증해야 한다. 반론2: missing-column same-id 시험이면 중복 클릭도 잡힌다. helper 내부 retry와 modal 동시 callback은 다른 경계이므로 지연 중 두 입력과 재시도/reopen을 따로 재야 한다.

## 7. [원칙 ⑦] 단계별 실행
소유 caller의 default/manual/metadata/capture/결과 UI와 제출 잠금만 고친다. root의 구체 배정으로 새 `js/tabs/records/share-feed-save.js`와 기존 share-to-feed 태그 바로 앞 같은 줄 include만 허용됐다. `records.share-feed-intent` 능력은 `{id, account, preparedPost, inflight, accepted}` 의도 객체와 `submit/restore`를 제공한다. 계정별 settings의 feedShareDrafts는 미확정 초안이며 영구 원장/자동retry가 아니다. 실제 저장 확인 없는 단계는 입력 유지·미확인이다. 공용 map·feed-list·saveProfile·다른 저장 caller·schema/auth/정책 변경0. 실제 서버 writebudget0이다.

## 8. [원칙 ⑧] 막히는 지점 예상·성과 측정
기존 actual lines775/상한800 측정은 공식 module-metrics 출처다. 압축으로 회피하지 않는다. original source 반례/컴포넌트 실제 callback·기기 열쇠·게스트 실제 조작을 구분한다. 로그인 실제 게시/readback·서버 응답유실/두 기기·장기효과는 null이다. 원pending 자동 migration0, 기존 사진/보안/공개범위 변경0이다.
