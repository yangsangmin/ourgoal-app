# TASK-ES-577 생성지도 일괄 갱신
작업참고 기준 PR #837. 유형: L009·L034 표준 생성 작업. PR837 병합 main을 입력으로 실행한다.

## 1. [원칙 ①] 파악
L009에 따라 분열 PR에서 보존한 docs/architecture/module-baseline.json·cell-map.json·inline-script-map.json·INLINE-SCRIPT-MAP.md를 별도 PR로 생성한다.
## 2. [원칙 ②] 본질·원인·중심·핵심
현재 코드와 저장된 지도 차이는 병렬 분열 충돌을 피하기 위한 보존에서 생긴다. 제품 변경 없이 저장본을 생성값으로 맞춘다.
## 3. [원칙 ③] 해결방식
TASK-ES-572·574·575·576 병합을 부모가 통지한 뒤 fetch·origin/main 반영, node scripts/module-guard.js --update → node scripts/cell-map-export.js → node scripts/inline-script-map.js --write 순서로 실행한다. NODE_PATH=C:/dev/ourgoal-app/node_modules.
## 4. [원칙 ④] 재검토
신고서 modules.json은 입력이며 이번 수정 대상이 아니다. module-specs --check가 차이를 찾으면 부모에게 근거를 전달한다. 제품 js/index.html·시험지·금고는 변경하지 않는다.
## 5. [원칙 ⑤] 절차
최신 입력 Git 커밋을 보고서 출처로만 기록한다. 지도 생성 전후 파일 해시·ratchet 값을 스크립트로 기록하고 같은 입력 재실행 차이0을 비교한다. node scripts/module-guard.js, node scripts/module-specs.js --check, npm test를 실행한다.
## 6. [원칙 ⑥] 절차 재검증
반론1: 현재 main으로 미리 생성하면 빠르다. 답: 576까지 반영하지 않은 중복 검증을 피하고 최종 main 하나로 실행한다.
반론2: 모든 UI 촬영이 필요하다. 답: 제품 diff0을 Git으로 확인하고 순수 생성 산출물 재현성·기존 npm 검증으로 범위에 맞게 증명한다. 제품 diff가 나오면 이를 중단하고 원인을 조사한다.
## 7. [원칙 ⑦] 단계별 실행
별도 작업트리에서 생성4개 → 증거·claims 구체화 → 훅 준수 커밋 → 부모의 PR·법정 절차.
## 8. [원칙 ⑧] 막히는 지점 예상
다른 세션의 동일 번호 선점은 착수 직전 재검색한다. main 이동은 최신 입력으로 전부 재생성한다. ratchet 증가를 이유 문구로 덮지 않는다.

## 주장 설계
R1: 기준선은 현 코드 측정값으로 낮아지고 기존 이력을 보존한다.
R2: cell-map은 exporter 입력과 같고 새 세포 및 책임 설명을 포함한다.
R3: 인라인 JSON·Markdown은 책임 지도 생성기의 같은 입력 산출물과 같다.
R4: 제품·시험·금고 변경0, 4개 재생성 차이0, npm 종료0.
측정 정본은 reports/TASK-ES-577/measurement.json이다. 보고서 값 적재 확인은 config 분야의 jsonPath로 주장한다. 법정이 생성·시험을 재실행했다고 주장하지 않는다. main 해시는 보고 출처이며 고정 기대값이 아니다.
