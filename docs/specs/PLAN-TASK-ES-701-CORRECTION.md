# TASK-ES-701 원검토 교정 계획

## 1. [원칙 ①] 문제 정확히 파악
고정 원검토82e7의 SQ-R01/SQ-P01/SQ-P02만 재료로 쓴다. 원문·raw·기대값은 original-spec-review/source-pins.json의 불변 Git source에 남는다.

## 2. [원칙 ②] 본질·원인·중심·핵심
본질: 공유 의도와 결과의 정합. 원인: metadata와 결과 연결 누락. 중심: records/share-to-feed의 modal. 핵심: captured preparedPost와 SDK response 분리.

## 3. [원칙 ③] 해결 방식
먼저 선언한 default/manual+첫 await capture oracle을 유지한다. modal 하나의 postId/inflight/preparedPost/accepted 상태와 계정별 draft readback을 연결한다. root가 정확 새 records/share-feed-save.js와 원 share-to-feed 태그 앞 같은 줄 include를 배정했다. 신규 helper는 공식 세포 생성기의 declaration을 토대로 실제 비화면 책임을 신고하고 generated metadata는 공식 도구만 쓴다. 기존 functional block 이동0이며 CELL_SPLIT으로 주장하지 않는다.

## 4. [원칙 ④] 재검토
cached draft를 공개 feed로 렌더하지 않는다. 실패/미확정은 입력 유지, 명시 성공은 cache에 같은 preparedPost 1회만. saveProfile 오류와 게시 실패를 혼동하지 않는다. 새 자동 재전송이나 과거 post 재분류는 넣지 않는다.

## 5. [원칙 ⑤] 절차
- [ ] 교정 계약 고정 · 예상5분 · 원33 artifact SHA 대조와 product0 commit.
- [ ] 실제 caller 구현 · 예상15분 · default/manual/capture+결과·ID·잠금 배선.
- [ ] 검증/Claims · 예상15분 · 아래 oracle 원시/PID/입력/종료 증거, 공식guard 및 관련검사.
- [ ] 심사 청구 · 예상10분 · PR/Court 정확head/root 인계, 병합0.

## 6. [원칙 ⑥] 절차 재검증·반론 격파
① health/running→running, mind→mental, unknown/__none__→life. ② manual→goal change 유지. ③ 첫 await 뒤 goal/category/pct 변경→captured id/title/topic/visibility/pct/category/caption 불변. ④ missing-column 같은 ID/extra 두 요청, RLS 추가 retry0. ⑤ returned/throw 오류→공개cache0/성공toast0/초안 실제 되읽음 또는 보관실패 입력유지. ⑥ 지연 첫 callback+두번째 callback→한 의도/한 ID/중복 insert0, pending 후 명시 retry도 ID·본문 유지. ⑦ 계정 전환/보관 용량 실패/SDK response 없음/성공뒤 saveProfile 실패. ⑧ old extra-only 원정보 그대로. 모든 fixture는 component-only/remote0이며 별도 실제 guest 브라우저는 mock E2E로 합성하지 않는다.

반론1(helper same-id로 modal 경계를 대체)은 동시 callback 별도 oracle로 막는다. 반론2(SDK 응답을 cache post로 사용)는 preparedPost 객체와 result.error/metaStripped를 별도 측정해 막는다.

## 7. [원칙 ⑦] 단계별 실행
wx 원시 wrapper로 첫 실패부터 script/input/source/PID/stdout/stderr/exit을 남긴다. 원 검토 script를 성공처럼 재작성하지 않는다. affected local/category/module/guest 검사 뒤 서류까지 작성하고 npm test를 마지막 실행한다.

## 8. [원칙 ⑧] 막히는 지점 예상·성과 측정
800한계·helper absent·localStorage 거절·SDK 응답유실·current main 변화는 실측대로 분리한다. actual server/로그인/원격행/실기기/null은 그대로 남긴다. 첫 bare gate 실행 raw/PID가 없던 한계는 소급 복원하지 않는다. root가 중앙 tasklink와 사용자 판단을 맡는다.
