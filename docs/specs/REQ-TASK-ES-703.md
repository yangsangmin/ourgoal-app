# 피드 반응 원문 본인 조회·추천 집계·운영 기록 비공개 교정

TASK-ES-703 / TASK-OG-FEED-PRIVATE-STAGE2-INSTALL-01a1310c. 작업참고 기준 PR #968. 기준 origin/main f0ac1158c23c4729b0ce0b1d2637a3895c604d2b. 직접 승인 D-2026-10-13-22와 두 UI 파일·DB 독점 담당 인계를 연결한다. 이는 새 규범 문서가 아니라 이번 제품 요구다.

## 1. 파악
한 번의 management read-only catalog 조회 preflight-result.json은 기존 content_reactions/helpful_reasons/feed_settings/feed_settings_log 및 RPC가 존재함을 확인했다. 이전 readonly 조사 음성 결과는 그 이전 시점 근거로 보존한다. 별도 TASK-ES-702가 원 SQL 설치와 첫 지표를 이미 실행했으므로 새 설치/첫 지표로 재명명하거나 반복하지 않는다.

## 2. 본질·원인·중심·핵심
react_content(text,text,text,text,text,text,text,text)는 형식을 유지하되 새 reactor_name을 저장하지 않는다. rawindividual은 본인만, 글쓴이/추천은 태그별 개수만, feed_settings_log의 changed_by/reason은 private operations만 읽는다. 기존 award_credit/credit_settings/원장과 기존 값은 건드리지 않는다. 이번 저장 경로에서 지급 호출은 하지 않는다.

## 3. 해결방식
reports/TASK-OG-FEED-PRIVATE-STAGE2-INSTALL-01a1310c/APPLY-PRIVATE-STAGE2-FIXED.sql이 실제 기존 표를 잠그고 현재 함수 MD5/ACL/설정·정책·열·트리거·관련 view 정의를 대조한다. 바뀌면 중단한다. 본인 표 SELECT만 authenticated, settings key/value만 anon/authenticated, audit는 두 역할 읽기0다. list_content_advice(text[])는 본인만; helpful_reason_summary(text,text)는 기존 tags/texts 모양을 유지하며 texts=[]다. feed_settings_get()/feed_value_counts(text[],integer)/my_helpful_tag_profile()의 집계 형식은 유지한다. 개인 UUID/name/reason_text/advice_text를 추천 결과로 반환하지 않는다.

## 4. 재검토
반론1: 전체 원 SQL 재적용은 현재 wider raw와 public audit를 다시 열므로 금지한다. 반론2: 지급을 막으려 기존 credit 기능을 없애면 승인 범위를 넘으므로 기존 기능/값은 보존하고 이번 함수의 호출만 제외한다. 이전 owner OID는 첫 catalog에 없으므로 null이며 강한 과거 소유권 CAS를 주장하지 않는다. 적용 transaction의 시작/끝 owner OID는 비교한다. 완전한 실제 사용자·UI·효과 결과는 미확인이다.

## 5. 절차
metadata 조회→private 원정의·ACL 보존→고정 SQL/되돌림/권한 시험·UI source→독립 소스 검토 및 법정 흐름→root 적용 지시→transaction 적용·실패 rollback→실제 변경된 권한과 집계 호환만 측정한다. 기존 첫 지표는 그대로 둔다. 현재 고정은 적용0이다.

## 6. 절차 재검증
PRIVILEGE-TEST-TEMPLATE.sql은 적용 뒤 허용 실계정 두 UUID를 일시 결박하고 transaction 안의 fixture만 만들고 rollback한다. 본인 SELECT/조언 RPC만 보임, 다른 원조언0, anon private RPC 실행권한0, audit 읽기0, settings value 읽기만, 집계 결과 raw 필드0를 oracle로 쓴다. fixture는 실제 UI/account 사용 증명이 아니다. 적용 전 SQL 쓰기 권한 probe는 실행하지 않는다. DB SQL 문법/실행 검증은 아직 하지 않았다.

## 7. 단계별 실행
주인 세포 reactions/helpful-reason(hybrid comm/home/records)만 수정한다. js/reactions.js의 #rxAdvText/#rxAdvOk/[data-rxmod]에서 공개 radio/메뉴를 제거하고 본인 전용 안내와 기존 author_only payload를 유지한다. js/helpful-reason.js의 #hrText/#hrOk/[data-hrsum]/#hrSumClose는 저장/집계 안내로 맞추고 응답 texts를 렌더하지 않는다. CSS 은폐가 없다. index/다른 feed 파일·모듈 손칸·baseline·norm/trust는 변경하지 않는다.

## 8. 막히는 지점 예상
원정의 변화, 신규 overload, 정책/ACL 변화, 잠금 실패, 원 private packet 변경이면 적용을 중단한다. transaction 실패는 서버 ROLLBACK으로 되돌리며 원문 행·기록·setting 값은 변경하지 않는다. 후속 private rollback script는 예전 공개 범위를 다시 열 수 있으므로 신규 private 원행이 생긴 뒤 자동 실행하지 않는다. root의 격리 변경 창과 별도 판단 없이는 실행하지 않는다. 실제 UI 표시가 설치된 SQL과 같은 source인지 확인 전 전체 사용 가능을 말하지 않는다.
