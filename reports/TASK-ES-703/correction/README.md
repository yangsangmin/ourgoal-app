# TASK703 보정 소스와 로컬 측정

원 source/history는 aa8a4ef9e72884bd6c1a6939e4214b6162d72bb2이며 최초 독립 검토 seal은 별도 그대로 보존한다. 여기 파일은 작업자의 보정 측정이며 법정 판정서가 아니다. 실제 운영 호출·사용자 사용·효과를 주장하지 않는다.

SQL 정본은 docs/sql/2026-10-13-feed-private-stage2.sql의 canonical Git blob이다. APPLY-703-CORRECTED.sql과 bundle.json은 그 소스에 결박된 별도 보정 bundle이다. 원 FINAL-PREPARED.json/APPLY-PRIVATE-STAGE2-FIXED.sql은 최초 검토 대상으로 보존하며 이번 적용 후보로 사용하지 않는다. 새 bundle은 original SQL SHA를 supersededOriginalSHA로 연결한다. 원 rollback의 함수 body CAS는 새 react_content와 맞지 않으므로 사용하지 않는다. 새 private rollback 위치·hash와 새 body hashes는 bundle.json에서 확인한다. 이 rollback은 이전 공개 범위를 다시 열 수 있으므로 자동 실행하지 않는다.

measurement-summary.json은 소스 hash·줄수·원 검토 파일 무변경 대조·REQ 원문 단락 보존·문서 lint·module guard와 npm의 실제 종료코드를 담는다. pg-result.json은 전체 transaction source compilation을 먼저 수행하고 별도로 implementation-only compilation을 반복한다. 후자는 원 fixture를 보존한 보조 검사이며 전체 CAS 증명으로 바꾸지 않는다. baseline의 권한 template는 합성 UUID를 transaction 안에서만 사용하며 운영 계정 시험이 아니다.

pg-result-overload.json/missingSignature.json과 all-named-overloads.json은 touched name마다 새 overload 또는 기준 signature 누락이 권한 변경 전에 중단됨을 재현한다. functionDrift/ownerDrift 결과도 보존한다. table CAS는 기존 ACL/RLS/열 범위이고 index/constraint 완전 CAS를 새로 주장하지 않는다. owner는 transaction 시작/끝을 대조하며 과거 owner baseline은 null이다. 함수 CREATE OR REPLACE 외부 동시 변경까지 table lock만으로 방지한다고 주장하지 않는다. 운영 적용 때 담당의 변경 창과 현재 metadata 대조가 필요하다.

ui-cache-review.cjs는 최초 반례를 그대로 이어 받았다. ui-account.cjs는 public API로 본인 조언 정상 표시·외부 user_id 필터·init 없는 전환·늦은 refresh/summary/save와 새 계정 fallback 격리를 추가 재현한다. ui-fixture.cjs는 원 기본 표시/이벤트 기대값을 유지한 사본이다. 모두 합성 SDK/VM이다.

로컬 재현은 PostgreSQL fixture용 @electric-sql/pglite 0.5.9를 사용할 수 있는 위치를 OG_703_PGLITE_MODULE로 지정하고 node pg-review.cjs baseline/overload/missingSignature, node run-named-overloads.cjs를 실행한다. ui-account.cjs와 ui-cache-review.cjs는 추가 설치 없이 node로 실행한다. ui-fixture.cjs 원본은 결과 덮어쓰기를 거부하므로 새 작업 공간에서 실행한다. 기대값·원 immutable fixture는 수정하지 않는다.

다음 조건은 변경 소스 범위의 독립 검토, 법정, canonical hash 강제 transport와 현재 운영 권한 대조, 서버 적용 후 범위 내 권한/집계 검증이다. SQL3·첫 지표 재실행, 정상 운영 write probe, 게시·노출로그·크레딧 지급은 이 보정에서 하지 않았다.
