# TASK-ES-703 보정 실행계획

REQ-TASK-ES-703.md와 REQ-TASK-ES-703-CORRECTION.md를 따른다. 작업참고 PR #968. 원 소스 aa8a4ef9와 최초 독립 검토 seal을 보존한다. 이 PLAN은 보정 이후의 별도 계획이며 운영 적용을 완료로 표시하지 않는다.

## 1. 파악
추가 overload, 계정 캐시 잔존, checkin 호출 축소의 세 반례를 최초 검토의 동일 fixture로 반복한다. 기존 SQL3 및 첫 지표 완료 자료는 다시 실행하지 않는다.

## 2. 본질·원인·중심·핵심
본질은 D22 개인정보 경계를 실제 배선에 적용하는 것이다. 원인은 부분 CAS와 계정에 결박되지 않은 캐시다. 중심은 $guard$ 및 syncViewer/current이며 핵심은 전체 signature 집합과 viewer/generation 검사다.

## 3. 해결방식
SQL $guard$ 양방향 EXCEPT, feed_post 조건 분기, reactions의 캐시 초기화/원문 user_id 필터와 readGeneration 검사, helpful-reason의 late summary/save/openSheet 검사를 구현한다. public API는 유지한다.

## 4. 재검토
반론1: 캐시를 비우면 본인 표시도 사라질 수 있다. 현재 계정 재조회와 localAdvice user_id 결박으로 정상 표시를 확인한다. 반론2: 응답 성공만 막으면 실패 fallback이 새 계정에 저장될 수 있다. save catch와 missingSchema fallback 이전에도 세대를 확인한다.

## 5. 절차
- [x] SQL·UI 보정 및 source 확인 — correction/measurement-summary.json
- [x] 같은 fixture PostgreSQL/VM 반례 및 추가 지연 응답 측정 — correction/pg-result.json 및 ui-account-result.json
- [x] module-specs --write, module-guard, npm test와 canonical bundle 기록 — correction/bundle.json 및 measurement-summary.json
- [ ] 4단계: 심사 청구 — 상위 담당의 변경 범위 독립 검토 뒤 법정 제출

## 6. 절차 재검증
추가 overload/누락은 권한 변경 전 SQL 중단, checkin/goal_template 허용, A→B init 없이 전환 및 늦은 응답 폐기가 oracle다. 조언 본인 표시와 태그 집계 유지도 검증한다. 실제 사용자/운영 측정은 로컬 fixture로 주장하지 않는다.

## 7. 단계별 실행
js/reactions.js/js/helpful-reason.js/docs/sql/2026-10-13-feed-private-stage2.sql만 제품 변경한다. 원 REQ는 헤더만 정합한다. 단일 claims C1~C4와 수정 소스 hash를 연결하며 800줄·process.exit 금지·모듈 신고서 가드를 지킨다.

## 8. 막히는 지점 예상
운영 metadata drift와 canonical byte 차이는 적용 중단 조건이다. 원 fixed bundle은 superseded로 참조만 하고 덮어쓰지 않는다. rollback은 원정의로 복구하는 별도 판단 사항이며 운영 원문/노출로그/크레딧 지급은 이 단계에서 실행하지 않는다.
