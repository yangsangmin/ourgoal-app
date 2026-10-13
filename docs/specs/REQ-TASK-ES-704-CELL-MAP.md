# TASK-ES-704 병합 뒤 세포지도 기능 설명과 게시 재료

G0: 본질축 E3 · 체감 가치: 현재 공유 창 저장 처리 세포를 지도에서 찾고 실제 하는 일을 이해한다 · 렌더 근거: docs/architecture/cell-map.json 및 cell-map-publish web/notion 산출. WORK-REFERENCE 기준 PR #968. 제품 source는 origin/main b1c89e5ec0b4d391197310a707bf0dd8a920ad25다.

## 1. 원칙 ① 문제 정확히 파악
records/share-feed-save 세포의 손 설명이 없고 helpful-reason은 현재 지급하지 않는 크레딧을 준다고 설명한다. PR974 이후 생성 지도도 갱신이 필요하다.
## 2. 원칙 ② 본질·원인·중심·핵심
본질은 구조 설명의 사실성이다. 원인은 생성물 갱신 지연이다. 중심은 docs/architecture/cell-descriptions.json의 cells/names와 scripts/cell-map-export.js의 build다. 핵심은 js/tabs/records/share-feed-save.js createIntent/submit가 같은 창 입력·계정·SDK 결과를 다룬다는 점이다.
## 3. 원칙 ③ 해결 방식
records/share-feed-save에 사용자 기능 설명과 짧은 이름을 추가한다. helpful-reason 설명을 이유 입력·저장·조회 기능으로 교정한다. node scripts/cell-map-export.js로 지도 전체를 생성한다. products/SQL/court/규칙 변경은 없다.
## 4. 원칙 ④ 재검토
같은 창의 재시도를 영속 초안이나 원격 행 확인으로 표현하지 않는다. helpful-reason의 현재 글쓴이 조회 UI를 설명하되 TASK703 미적용 정책을 적용된 것처럼 쓰지 않는다.
## 5. 원칙 ⑤ 절차 수립
번호 미사용 검사 → 손 설명 → 생성 지도 → tests/cell-map-export-es414.test.js → export --check → cell-map-publish --root의 db/notion 재료 → 정본 source/검증 기록 → 주장 파일 하나 → 로컬 커밋.
## 6. 원칙 ⑥ 절차 재검증
반론 1: SDK accepted가 저장 사용 증명이라는 주장에는 동의할 수 없다. 지도 설명은 SDK 결과 안내로 한정한다. 반론 2: 재료 생성이 웹·노션 동기화라는 주장에는 되읽기 증거가 없으므로 동의할 수 없다. 상태는 pending으로 둔다.
## 7. 원칙 ⑦ 실행·측정
기존 생성기 결정성·세포 필수 칸·관계 시험을 실행한다. source 및 기능 설명을 생성 지도에서 스크립트로 읽어 보고하고 정적 config 주장으로 제출한다. 독립 법정 판정은 미청구다.
## 8. 원칙 ⑧ 실패 지점 예상
main 이동 시 게시 기준이 바뀐다. 원격 main와 제품 기준을 기록한다. 게시 source와 저장본 구조가 다르면 publisher가 중단하므로 수정한다. 원격 API는 호출하지 않고 재료만 인계한다.
