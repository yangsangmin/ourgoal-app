# TASK-ES-705 PR975 병합 후 개인정보 계약 지도 설명 갱신

G0: 본질축 E3 · 체감 가치: 도움 이유와 글 반응이 무엇을 저장·표시하는지 지도에서 정확히 읽는다 · 렌더 근거: cell-map.json does 및 cell-map-publish의 웹/노션 재료. 작업참고 기준 PR #976. 제품 source는 main 3a02bec793ec8e99d58ce7dccaa0703671d2c8c8(PR975 병합)이다.

## 1. 파악
docs/architecture/cell-descriptions.json의 helpful-reason은 글쓴이가 이유 원문도 보는 것으로 남아 있다. reactions는 현재 본인 원문·집계와 계정 세대 경계를 설명하지 않는다. TASK704 자료는 그 당시 source의 원 측정으로 보존한다.
## 2. 본질·원인·중심·핵심
본질은 구조 지도 설명의 사실성이다. 원인은 개인정보 교정 병합 뒤 손 설명의 지연이다. 중심은 cells.helpful-reason/cells.reactions이며 핵심은 js/helpful-reason.js openSummary/render와 save 및 js/reactions.js syncViewer/advicePanelHtml, docs/sql/2026-10-13-feed-private-stage2.sql의 본인 SELECT·원조언 조회/집계 계약이다.
## 3. 해결방식
도움 이유는 원문 본인 읽기 범위로 저장, 작성자 창 종류별 개수 표시, 지급 호출 없음으로 적는다. 반응은 개인 조언 원문 본인 표시와 집계·계정 캐시/늦은 응답 경계로 적는다. 기존 exporter와 publisher로 생성한다. 제품 동작·권한·SQL을 바꾸지 않는다.
## 4. 재검토
정책 범위를 별도 본인 조회 UI 완성으로 표현하지 않는다. 원 서버 definition과 UI 계약의 코드 근거만 기술한다. 자료 준비를 원격 동기화로 표현하지 않으며 운영 역할 증명을 지도 설명 변경의 UI 효과 확인으로 바꾸지 않는다.
## 5. 절차
번호 미사용/source 확인 → 두 설명 교정 → cell-map-export → 기존 cell-map-export-es414 시험 → export --check → publisher --root의 db/notion 재료 → 필드/내용 및 claims schema → 문서 lint·source hash → 로컬 커밋과 PR 본문 인계.
## 6. 절차 재검증
반론1: 손 설명 변경은 생성 지도에 반영하지 않으면 화면에 보이지 않는다. 생성 does와 publisher 본문까지 대조한다. 반론2: 단순 문자열 한 글자는 의미 검증이 아니다. claims check는 실제 설명 전체 또는 의미 있는 구절을 쓰고 parser의 4자 이상 요건도 확인한다. mapper 기존 기대값은 바꾸지 않는다.
## 7. 단계별 실행
docs/architecture/cell-descriptions.json 및 cell-map.json, docs/specs/REQ/PLAN-TASK-ES-705-CELL-MAP.md, ordinary docs/rules/TICKETS.md, dev_log.md와 reports/TASK-ES-705의 단일 claims/측정만 변경한다. .claude/cell-map-705-publish에 새 게시 재료를 만들고 웹·노션·허브 모두 pending으로 남긴다.
## 8. 막히는 지점 예상
main이 이동하면 게시 도장과 병합 이력이 달라질 수 있다. sourceSHA와 기준 commit을 측정 기록에 두고 주장에는 불안정한 전체 수치를 쓰지 않는다. 이전 TASK704 재료·원자료는 수정하지 않으며 private 원문·키·공식 scorecard를 게시하지 않는다. push/PR/원격 게시·SQL3·첫 지표 실행은 이 담당의 범위 밖이다.
