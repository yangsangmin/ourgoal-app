# TASK-ES-705 세포지도 계약 설명 실행계획

작업참고 PR #976, source main 3a02bec793ec8e99d58ce7dccaa0703671d2c8c8. REQ-TASK-ES-705-CELL-MAP.md를 따른다. 독립 검토·push·PR은 상위 담당이 수행한다.
## 1. 파악
PR975 이후 helpful-reason/reactions의 손 설명과 생성 지도에 개인정보 계약 설명이 뒤처져 있다.
## 2. 본질·원인·중심·핵심
본질은 읽을 수 있는 기능 설명의 정확성, 원인은 지도 갱신 지연, 중심은 cell-descriptions.json, 핵심은 현재 source에서 exporter/publisher가 생성한 실제 does 값이다.
## 3. 해결방식
두 설명만 교정하고 기존 생성기·게시 재료 형식을 유지한다. SQL/UI 구현은 보존한다.
## 4. 재검토
본인 원문 권한과 조회 화면 완성은 다르며 자료와 원격 동기화도 다르다. 코드 근거와 pending만 기록한다.
## 5. 절차
- [x] 설명 및 생성 정본
- [x] 기존 mapper 시험/check/publisher와 의미 필드 검증
- [x] claims/schema/문서 lint 및 원 자료·제품 불변 봉인
- [x] 4단계: 심사 청구 준비 — PR 본문·게시 자료·측정 준비, 실제 독립 검토와 제출은 상위 담당
## 6. 절차 재검증
기존 17개 부품 시험과 결정성/check, publisher 내용 대조를 사용한다. 실제 config 필드 주장에 4자 이상 의미 검사와 하나의 claims 파일을 적용한다.
## 7. 단계별 실행
지도 설명·생성 지도와 ordinary 문서/티켓/보고만 변경한다. 웹/노션/허브의 원격 호출을 하지 않고 .claude/cell-map-705-publish에만 자료를 만든다.
## 8. 막히는 지점 예상
번호·source 이동·CRLF·새 자료의 원 source 불일치가 위험이다. 원 TASK704 자료를 보존하고 measured source/hash와 각 검사 실제 종료코드를 기록한다. 원격 동기화·UI 효과는 미확인이다.


## TASK705 작업참고 사본 추가 동기화

착수 당시 작업참고 기준 PR #976은 원 측정에 보존한다. 지도 일괄 갱신의 SNOWBALL 의무로 상위 담당이 갱신한 정본 기준 PR #975/PR975 merge source의 경험칙 131개를 docs/agents/lessons.json·WORK-REFERENCE.md·reference-meta.json에 바이트 복사한다. 생성 metadata도 같은 source를 유지한다. 원 a8f 커밋과 final-source-seal.json 및 mapper 17개 측정은 보존한다. 새 동기화 측정은 reports/TASK-ES-705/reference-sync.json에 별도 기록하고 문서 gate만 실행한다. 제품/지도 source 및 이전 주장 C1-C6는 바꾸지 않는다. 웹·노션·허브는 pending이다.
