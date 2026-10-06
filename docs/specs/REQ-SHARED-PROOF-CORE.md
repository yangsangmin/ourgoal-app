# 공통 분열 증거 코어 REQ

기준 작업참고 PR #843, 유형 탐색. 작업자 측정이며 Court 판정 아님.

## 1. [원칙 ①] 문제 파악
582/585 감사에서 전체 DOM·SS·오류·기준 재현·필수 단계가 최종 종료 조건에 연결되지 않았다. 새 docs/design/harness/shared-proof/cli.js의 evaluate()가 필수 gate 전체 AND를 계산한다.
## 2. [원칙 ②] 본질·원인·중심·핵심
본질은 수집 증거 완전성, 원인은 작업별 비교기가 조건을 따로 소유한 것, 중심은 preflight(), 핵심은 완료 선언 대신 SHA·필수 관측·차이 측정이다.
## 3. [원칙 ③] 해결 방식
공통 input/step/compare/baseline/sensitivity 계약과 JSON task adapter를 분리한다. #avatarCelebrationToast 등 동적 DOM도 입증 없이 제외하지 않는다. DOM은 원문과 구조를 모두 보존한다.
## 4. [원칙 ④] 재검토
Court·제품·기존 시험·헌법·금고 수정0. private raw 내용은 결과에 싣지 않고 코드/필드 경로/해시/차이 수만 기록한다. 원시 계약은 수집의 진실성이나 실사용자 안전 판정이 아니다.
## 5. [원칙 ⑤] 절차
REQ gate → 새 코어 → 단위 계약 자료 CLI → 실제582/585 raw 읽기 검사 → 독립 담당자 부정대조 → 정상 hook commit → root push/PR/Court.
## 6. [원칙 ⑥] 절차 재검증·반론
반론1: 날짜/ID를 지우면 비교가 쉬워진다. 반박: 기존 기록 변조까지 흡수하므로 provenance 미지원 경로는 미측정으로 거부한다. 반론2: 같은 단계 수면 충분하다. 반박: 이름·순서·정확 개수·후조건·함수 관측을 각각 검사한다. 독립 감도 입력 없이 최종 측정 충족을 선언하지 않는다.
## 7. [원칙 ⑦] 단계별 실행
schema.json, preflight.js, compare.js, dynamic-contract.js, cli.js, adapters/task582.json·task585.json를 새로 만든다. mutation-audit.js는 독립 담당자가 소유하며 이 구현자는 쓰지 않는다.
## 8. [원칙 ⑧] 막힘 예상·성과 측정
이전 raw 필드가 없으면 정확한 누락 경로를 기록하고 root에 수집 보완을 넘긴다. SHA 변조·실행 미완료·단계 누락·DOM/LS/SS/오류 차이·기준2 변경은 비0 종료를 측정한다. 효과·실계정 기능 안전·Court verdict는 null.
