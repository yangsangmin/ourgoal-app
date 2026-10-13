# 고정 소스 검토용 인계 — 적용 전

실제 DB는 이미 별도 TASK-ES-702가 원 SQL을 설치했다. 이번 제품은 D22가 직접 승인한 개인정보 범위의 교정이다. 첫 지표를 다시 실행하지 않는다. 준비 source의 실행·UI fixture는 작업자 주장이고 Court/실사용 판정이 아니다. 현재 SQL apply/새 metric/노출로그/credit 지급/새 public post/서버 정상 쓰기 probe는 모두 실행하지 않았다.

검토 대상은 APPLY-PRIVATE-STAGE2-FIXED.sql, BUNDLE-PREPARED.json의 owner-local rollback-fixed.private.sql 참조/해시, PRIVILEGE-TEST-TEMPLATE.sql, js/reactions.js, js/helpful-reason.js, REQ-TASK-ES-703.md다. 초기 APPLY 파일과 prepared 단계 파일은 과정 보존용이며 적용 대상이 아니다. 신뢰 출처는 origin/main f0ac과 직접 승인 영수증·독점 담당 인계이며 body/hash를 실제 대표님·설치 권위로 만들지 않는다.

한 번의 catalog 조회에서 현재 표·열·정책·함수 정의/ACL·트리거·관련 집계 view·credit enabled 플래그만 읽었다. 원 정의 full SQL은 새 owner-local private prior packet에만 저장하고 중앙에는 경로/해시/metadata만 둔다. 응답 body/credential/log header 또는 업무 원행은 출력하지 않았다. 실제 함수 owner 과거 OID는 수집하지 않아 null이다. SQL은 시작/끝 실제 OID/owner 불변을 확인하지만 과거 원 owner와 일치했다고 주장하지 않는다. root 소스 검토는 이 한계를 포함한다.

원 함수 변경·ACL/정책/열·트리거·관련 view 변경이면 transaction에서 중단한다. 기존 setting key/value, 과거 원행·audit·크레딧 표/함수/값을 보존한다. 이번 save_helpful_reason에서만 award_credit 호출을 빼며 이미 설치된 원장을 삭제하거나 disable하지 않는다. 새 schema/table/backfill/category/credit 설정을 만들지 않는다. SQL apply 중 권한 readback 실패는 전체 rollback이다.

후속 rollback은 현재 교정 함수 body digest를 대조하고 기존 정의/ACL/audit policy를 private 원정의에서 복원하며 data row를 덮지 않는다. 예전 공개 범위를 다시 열 수 있으므로 신규 private 데이터가 생긴 후 자동 실행은 금지다. root가 변경 창/현재 source/데이터 보존과 privacy 재노출을 검토한 뒤만 쓰는 복구 문서다. transaction 실패의 ROLLBACK과 post-commit source 복원을 구분한다. rollback SQL 실제 실행·문법 확인은 아직 미측정이다.

UI 주인 인계: C:/Users/HP/handover/2026-10-13-claude-54f461e5/피드-권한교정-담당인계-답신-01a1310c.md. 세포 reactions/helpful-reason은 hybrid, spans comm/home/records다. 공개 radio name=rxAdvVis와 author/everyone 메뉴를 실제로 제거했다. 본인 삭제 버튼·기존 author_only payload·저장 흐름은 유지했다. #hrText/#hrOk와 [data-hrsum]/#hrSumClose는 원문 저장·종류별 집계를 설명하고 summary raw renderer를 제거했다. SQL·UI source가 함께 실제 사용된 근거가 없으므로 full use 미확인이다.

정확 다음 실행: root가 이 fixed source를 별도 담당에게 검토 배정→법정/PR 흐름과 지적 교정→root apply 지시→기존 management query seam에서 FIXED SQL 하나를 transaction으로 실행→변경된 권한 및 aggregate contract만 확인한다. PRIVILEGE-TEST-TEMPLATE의 TEST_A/B는 기존 테스트 계정 auth 결과로 메모리에서 치환하고 로그하지 않는다. template은 transaction fixture이며 정상 UI 실사용이나 새로운 첫 지표가 아니다. 최초 metric은 별도 owner의 원자료와 hash 연결만 유지한다.

준비 중 local shell regex parse error는 Node 시작 전 실패였으며 first-shell-failure.json에 보존했다. script-file 재결박으로 바꿨다. 초기 rollback body digest가 source CRLF와 fixed SQL LF를 혼동할 수 있음을 발견해 before-body-rebind 원 bytes를 보존하고 최종 SQL에서 다시 산출한 BUNDLE만 사용한다. private initial recipe/rollback도 그대로 두었다. seal-bundle 최초 attempt는 실행 중인 자기 exit.json을 읽으려 ENOENT가 났다. 자기 PID와 일치하는 실행 중 행만 제외하고 다른 미완 행은 여전히 오류를 전파하도록 교정했으며 원 input/script/PID/stdout/stderr/exit를 보존했다. 라이브 SQL 오류라고 주장하지 않는다. 웹 공식 read-only API 페이지를 이 도구가 열지 못한 결과도 실 서버 query 실패와 구분하며 기존 공식 endpoint의 단일 실제 201 결과를 근거로 쓴다.

공식 SQL 경로는 docs/sql/2026-10-13-feed-private-stage2.sql이고 위 FIXED 파일과 실제 bytes/SHA가 같다. TASK-ES-703은 L012에 따른 원격 전체 상태 PR·refs 확인 후 빈 원 main 브랜치로 선점했으며 reservation 자료에 실제 결과를 보존했다. 원 task702/699 주장·기대값·private metric은 변경하지 않았다. 기존 service_role 표 ACL의 명시 권한은 원 metadata에 존재하므로 이번 공개 역할 revoke가 그 기존 private operations 권한을 확장하거나 제거하지 않는다.
