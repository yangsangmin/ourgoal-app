# TASK-ES-701 최초 원제품 지적 교정 계약

원제품bc61/3aad·첫 원제품 의견f4dd6c834fe30e2cbd1b7ea22791a40c96462c6a(fe555 최초 의견)·첫 Court974/1e378/0A7F8493은 불변이다. 대표님의 새 판단을 합성하지 않는다. root의 배정은 같은 TASK701 owned caller/helper 최소 교정이다.

## 1. [원칙 ①] 문제 정확히 파악
SP10-01/SP11-01: textarea는 잠기지 않아 preview가 새 문구를 보이지만 retry 의도는 첫 본문이다. SP10-02/SP11-02: original #shareCancelBtn이 실패 뒤에도 disabled다. SP10-03/SP11-03: caller after-await guard 이전, unchanged home-cockpit.saveProfile이 users await 뒤 B목표/설정을 A귀속으로 쓰는 fixture 반례다. 실제 remote 수용은 null이다.

## 2. [원칙 ②] 본질·원인·중심·핵심
본질은 사용자에게 보이는 준비 입력과 실제 의도의 정합이다. 원인은 textarea 선택자 누락/과한 단추 잠금/불필요한 broad profile caller다. 중심은 records/share-feed-save.js lockInput/submit과 share-to-feed.js의 accepted branch다. 핵심은 같은 ID 불변 retry와 원 Cancel, 실제 현재 계정에만 귀속되는 derived cache다.

## 3. [원칙 ③] 해결 방식
`input, textarea, select, button`을 의도 고정 때 잠그고 첫 준비 문구가 고정됨을 #shareFeedSaveStatus에 명시한다. SDK 시도 후 no inflight일 때 #shareCancelBtn만 푼다. 원 listener→L.closeModal을 보존하며 취소는 DB 삭제/자동효과가 아니다.

이 caller의 L.saveProfile broad users/goals/checkins 쓰기를 제거한다. 실제 feed_posts SDK 수용과 현재 계정을 다시 확인한 뒤 existing current profile/settings를 snapshot으로 묶어 derived myFeedPosts cache를 1회 갱신한다. 기존 등록된 core/gcal-token의 L.saveLocalSettings(account, settingsSnapshot)만 동기로 소비한다. helper/kit/등록 객체 동일성·계정별 기기 열쇠·readback을 실제로 잰다. shared home/gcal source 변경0, 새 저장소/초안/컬럼/PII0다. 메모리 pending을 durable로 승격하지 않는다.

## 4. [원칙 ④] 재검토
preview와 caption은 첫 준비 입력을 표시해야 한다. 새 intent 선택으로 unknown ACK 같은 ID를 버리지 않는다. Account A를 captured owner로 쓰더라도 이미 B current라면 쓰기0이다. owner write 뒤 render 전에 current를 다시 본다. 원 데이터나 새 계정 settings를 A prefix에 쓰지 않는다. 취소는 inflight 시도 중에 요청 취소를 합성하지 않는다.

## 5. [원칙 ⑤] 절차
원 의견/SHA·첫 Court artifact 보존→이 제품0 계약 고정→narrow source 교정→세 원반례+changed-path 측정→관련 공식 gen/guard/검사→PR974 새head Court. 원10/11 긍정 재검토0, 기존기대/단언/원source 수정0, 병합0이다.

## 6. [원칙 ⑥] 절차 재검증·반론 격파
반론1: 늦은 after-await guard로 owner 혼합을 막을 수 있다. callee 안에서 이미 일어난 쓰기는 caller가 되돌릴 수 없으므로 그 broad call 자체를 제거한다. 반론2: 일단 freeze하면 미리보기도 자동으로 같은 내용을 보인다. 실제 textarea/키보드/preview를 함께 재어 사용자 입력이 고정됐는지 검증한다. 상태만 바꾸거나 시험 기대를 약하게 하지 않는다.

Court C1/C2는 실제 정식 landing preview wait/click을 추가하고 나머지 행동/단언은 유지한다. step symptom은 추가한 단계 수로 기계 산출한다. C3의 원문/req/touches/kind를 유지하고 실제 로그인 원격 행 검증만 documented tool-cannot-measure/cannotBecause needs-login으로 표현한다. 측정 가능한 guest 조건을 한계로 바꾸지 않는다.

## 7. [원칙 ⑦] 단계별 실행
SP10-01 실제 keyboard 입력 불가·preview 원문 유지, SP10-02 original Cancel closure/추가 effect0, SP10-03 private local SDK 성공 뒤 owner API와 A→B 가장 가까운 seam에서 users/goals/checkins0/B settings→A0을 잰다. actual browser는 상태 주입0/외부요청 차단, SDK/account switch는 fixture-only로 분리한다. wrapper wx input/script/source/PID/stdout/stderr/exit·초기 실패를 보존한다.

## 8. [원칙 ⑧] 막히는 지점 예상·성과 측정
Local-settings helper는 반환값이 없고 오류를 삼킨다. 같은 계정 기기 readback 확인 여부와 이미 수용된 원격 게시를 구분한다. helper 미지원은 미확인으로 남기며 broad saveProfile로 후퇴하지 않는다. strict same-open/replay/missing-column/response-loss 원보호를 보존한다. 실서버/운영/계정/미디어/model/writebudget0·효과/닫기복구null. 800상한과 main baseline 불변이다.
