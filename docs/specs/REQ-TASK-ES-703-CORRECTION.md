# TASK-ES-703 검토 반례 보정 요구

작업참고 기준 PR #968. 원 요구: REQ-TASK-ES-703.md, 원 소스 aa8a4ef9e72884bd6c1a6939e4214b6162d72bb2. 최초 독립 검토 FIRST-REVIEW.md와 first-review-seal.json은 그대로 보존한다. D22 본인 원문·추천 집계·운영 audit 비공개, 노출로그/크레딧 지급 제외를 유지한다.

## 1. 파악
최초 PostgreSQL 검토는 list_content_advice(text[],boolean) 추가 후 SQL commit을 재현했다. VM 검토는 계정 전환 뒤 이전 계정 조언 원문이 렌더됨을 확인했다. react_content의 feed_post 전용 제한은 기존 checkin 계약을 축소했다. 원 REQ는 독립 헤더 형식 문제와 PLAN 누락이 있었다.

## 2. 본질·원인·중심·핵심
본질은 본인 원문 경계와 기존 동작을 함께 지키는 것이다. 원인은 이름별 전체 함수 서명 집합 검사 누락, 사용자와 분리된 advices/mine 캐시, 지연 응답의 무조건 반영이다. 중심은 SQL transaction 진입과 UI 계정 경계이며, 핵심은 RPC 추가/누락 중단과 viewer/generation 일치만 반영하는 배선이다.

## 3. 해결방식
docs/sql/2026-10-13-feed-private-stage2.sql의 $guard$에서 public 대상 함수 전체 schema-qualified signature 집합을 expected와 양방향 EXCEPT 비교하고 권한 변경 전에 중단한다. react_content는 feed_posts 존재/봇 검사를 feed_post 분기에 넣는다. js/reactions.js syncViewer/current는 계정 전환 시 caches를 초기화하고 advice user_id를 렌더 때도 현재 viewer와 대조한다. js/helpful-reason.js는 summary/save/openSheet의 늦은 응답과 이벤트를 세대로 검사한다.

## 4. 재검토
반론1: init 초기화만으로는 module-connect의 getProfile 변화를 잡지 못한다. 따라서 읽기·렌더·비동기 commit마다 syncViewer를 호출한다. 반론2: 이전 서버가 is_mine=true를 반환하면 그대로 신뢰할 수 없다. user_id 일치를 요구하고 현재 본인의 합법적 표시와 local 프로필 조언은 보존한다. 비로그인 viewer는 개인 서버 캐시를 렌더하지 않는다.

## 5. 절차
원 독립 검토 고정 → 별도 보정 소스 → REQ/PLAN 헤더 정합 → 동일 PostgreSQL/VM fixture 재현 → 계정 전환/지연 응답 추가 측정 → module-specs/module-guard/npm test → 별도 변경 범위 독립 검토와 법정 → 상위 담당의 고정 canonical transport. 운영 SQL3/첫 지표를 다시 실행하지 않는다.

## 6. 절차 재검증
반증 oracle는 추가 overload가 CURRENT_FUNCTION_SIGNATURE_SET_CHANGED로 중단되고 변경 전 ACL이 유지되는지, checkin/goal_template 반응이 보정 뒤 받아지는지, B 렌더가 A 원문/반응을 포함하지 않는지다. 늦은 refresh·summary·save 실패가 새 계정 settings/modal/toast를 변경하지 않아야 한다. 동일 소스 SHA와 로컬 합성 schema/account라는 한계를 함께 기록한다. 실제 계정·운영·법정 판정은 이 검증으로 대체하지 않는다.

## 7. 단계별 실행
DOM #rxAdvText/#rxAdvOk/[data-rxadvtoggle]/#hrText/#hrOk/[data-hrsum]와 함수 refresh/react/unreact/bindAdvice/openSummary/save를 보정한다. 원 C1~C4 ID와 하나의 reports/TASK-ES-703/claims.json만 유지한다. records DIR006 JS/index/court/규범/게이트 파일은 수정하지 않는다. 기존 원행/setting/credit 값, 원 fixed SQL bundle과 rollback은 보존하고 새 bundle을 별도로 만든다.

## 8. 막히는 지점 예상
과거 metadata는 현재 서버의 실제 상태와 같다고 주장하지 않는다. PostgreSQL 로컬 합성 시험의 owner/ACL guard를 먼저 확인하고, 예상 밖 source drift는 중단한다. canonical Git LF bytes와 worktree CRLF bytes를 구분한다. 기존 rollback은 과거 공개 범위를 열 수 있으므로 자동 운영 실행하지 않는다. 운영 적용/실계정 사용/효과 확인은 상위 담당과 독립 검증의 남은 조건이다.
