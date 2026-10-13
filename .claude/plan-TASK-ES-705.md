목표: PR975 병합 source의 본인 원문·글쓴이 집계·지급 제외 계약을 세포지도 설명과 게시 전 재료에 반영한다.

작업참고 기준 PR #976. 표준 E3 생성 지도 갱신. 원 TASK704 재료·측정은 보존하고 원격 웹/노션/허브는 pending이다.
- [x] 번호·최신 source·참고·관련 주장 확인 · 예상 5분 · TASK705 미사용과 main 3a02 source 확인
- [x] REQ/PLAN·티켓 및 두 세포 설명 교정 · 예상 5분 · helpful-reason/reactions source와 설명 대조
- [x] 기존 export·17개 시험·check·publisher 실행 · 예상 5분 · 각 실제 종료코드·새 게시 재료 생성
- [x] claims schema/문서 lint·제품 불변·원 TASK704 보존 대조 · 예상 5분 · 실제 field 주장·4자 이상 검사·불변 hash
- [x] 로컬 커밋·PR 본문·최종 인계 준비 · 예상 5분 · 커밋 및 .claude/pr-body-TASK-ES-705.md와 게시 자료·측정 인계

## 1. 파악
TASK704 도움 이유 설명은 현재 서버·UI의 글쓴이 집계 전용 계약을 반영하지 않는다. reactions도 개인 원문·계정 세대 경계를 설명하지 않는다.
## 2. 본질·원인·중심·핵심
본질은 지도가 현재 기능과 일치하는 것이다. 원인은 PR975 병합 뒤 손 설명·생성물 갱신 지연이다. 중심은 cell-descriptions.json cells의 두 항목이며 핵심은 실제 UI/SQL에서 본인 원문과 집계를 나누는 계약이다.
## 3. 해결방식
설명 두 개만 교정하고 기존 cell-map-export/publish로 source에 결박된 정본과 게시 재료를 만든다.
## 4. 재검토
반론1: 원문 정책이 곧 본인 조회 화면 구현이라는 설명은 부정확하다. 저장·서버 읽기 범위와 실제 작성자 창 표시를 구분한다. 반론2: 재료 생성은 게시 완료가 아니다. 웹·노션·허브를 pending으로 유지한다.
## 5. 절차
번호/source 확인 → 설명 및 문서 → export → 기존 시험/check → publisher → 단일 config claims → 봉인 및 로컬 커밋 → 부모 독립 검토.
## 6. 절차 재검증
표시 설명과 source 코드·SQL 토큰을 대조하고 기존 생성기 결정성 시험·실제 생성 필드를 검사한다. 설명만 검증하며 제품 사용·법정 판정으로 승격하지 않는다.
## 7. 단계별 실행
이 전용 worktree의 지도 설명·생성 지도·REQ/PLAN·ordinary TICKETS·dev_log·TASK705 보고만 변경한다. 제품/SQL/index/court/규범/시험 기대값은 변경하지 않는다.
## 8. 막히는 지점 예상
main 이동, 번호 충돌, 생성 source stamp, Git CRLF, 동기화 오표시가 위험이다. 원 source와 새 hash를 기록하고 원 자료를 덮지 않으며 publisher 재료를 원격 적용하지 않는다.
