### 🚀 [MODE_4A] 5대 고정 블록 표준 구현 보고서

#### [블록 1] 개요
TASK-ES-701, 기준 db8b7ebbd8a9104cd2e3c10f1602d2ae32bf0d6c/PR972. 공유 caller가 기존 목표→피드 매핑/metadata/insert helper를 실제 소비한다. SDK 오류를 성공으로 알리던 배선과 같은 창 중복 ID를 고쳤다. 계획 구현은 아래 측정 범위, 실제 로그인 게시 사용 가능·장기효과는 미확인이다.

#### [블록 2] REQ / PLAN 및 구체적 식별자
원 facccf8 REQ/PLAN은 불변. 첫 원검토82e7fecfb4404e14fa8067b3904f13f47a5d0b83의 SQ-R01/SQ-P01/SQ-P02는 original-spec-review에 그대로 보존했다. 원33 파일의 실제 Git SHA 대조는 source-pins.json이다. 교정 요구/계획은 docs/specs/*-TASK-ES-701-CORRECTION.md, source API는 API.md다. #shareConfirmBtn/#shareGoalSelect/[data-shcat]/#shareFeedSaveStatus, openShareToFeedModal, records.share-feed-intent가 접점이다. PR/Court 심사 청구 전이다.

#### [블록 3] 핵심 변경사항
생산 source는 share-to-feed.js/new share-feed-save.js, index의 원태그 앞 같은 줄 loader, 공식 generated modules뿐이다. 원태그/버전 보존, 새 전역/자리/종류0, baseline 상향0, 기존 기대/단언 변경0. 기본값은 fromGoal 또는 life이며 수동 선택은 목표 변경 후 유지된다. 첫 await 전에 실제 goal/pct/category/caption을 metadata와 preparedPost로 고정한다. SDK 응답은 preparedPost와 구분한다. 같은 열린 창에서는 ID/준비 본문을 재사용하고 inflight 중 새 effect0이다. 성공 뒤 profile 저장 실패가 추가 insert로 바뀌지 않으며 await 뒤 계정이 바뀌면 새 계정 cache를 쓰지 않는다.

실패/응답 유실은 성공 cache/toast0, 창/입력 유지·미보관 안내다. 새 영구 local draft 또는 임의 remote store를 만들지 않는다. 기존 saveProfile은 settings를 원격 payload로 보내지 않는다. XP 전용 user_ledger_docs 승인도 초안에 확대하지 않았다. root의 범위 결정 전 local draft 시험은 superseded-local-draft-scope.json과 원 component/raw에 보존하며 현재제품의 보관 증거로 쓰지 않는다. 닫기/새로고침 복구는 미구현이다. 기존 과거 extra/settings/pending을 지우거나 재분류하지 않는다.

#### [블록 4] Claims (주장)
claims.json C1/C2는 실제 익명 UI 시나리오, C3는 실제 로그인 게시/readback의 needs-live-server다. measurement.json은 원시에서 집계한 작업자 측정이다. 최종 변경 저장 그룹13 항목, 정상 익명 guest3 항목과 별도 실제 요청 차단 실패2 항목을 구분한다. component fixture SDK/실제 DOM 동작은 실제 Supabase E2E가 아니다. 정상 guest는 상태 주입0/실제 마우스·select·기존 설치 Supabase UMD이며 실제 CDN 버전은 미확인이다. 외부 POST/GET 시도는 차단됐고 실제 원격 효과0이다.

최초 ENOBUFS, HTTP charset 누락, 잘못된 guest 초기 전제/라벨, ingress baseline 누락 의존성, measurement 자기 active raw 읽기 실패는 각각 원시/한계로 남겼다. legacy ingress renderCalendar 단언은 바꾸지 않았다. 재귀 의존성 baseline의 결과와 current 원검사는 별도 입력에 귀속한다. 최초 bare gate tooltrace-only/PID 누락은 복원하지 않는다. 원핑계나 실패를 소급 성공으로 바꾸지 않는다. WORK-REFERENCE PR968 전체 read gap은 작성자 자신의 구간 재독으로 닫았다.

#### [블록 5] 독립 법정 판정서 (GitHub Court Verdict)
원제품 과정10/본질11 검토와 외부 Court는 아직 미확인이다. 고정 product를 root에 먼저 인수하고 최초 원제품 검토는 다른 담당에게 넘긴다. 다음은 정확 source의 필요한 npm/현재 main 결합/PR/Court다. main/운영/계정/SQL/스키마/원격 게시0, 병합0. 상위 중앙 tasklink/사용자 판단은 root 소유다.
