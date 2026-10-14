목표: PR981 승인 후 실제 병합 사실만 전문·대장에 기록해 root의 후속 출판 입구를 준비한다.

Task ID: #TASK-ES-K17-981-MERGE-RECORD-01a13674. 공통 TASK-CC-CELL-UNWIRE-RUN-309dca5d / root linkage; own leaf pending. WORK-REFERENCE 기준 PR #981. 본질 [INFRA]: 제14.3 승인 후 실제 병합 사실의 추적 가능성을 문서로 제공한다.

- [x] 원격main/원승인/병합 proof·실제 모델 고정 · 예상 2분(추정) · 완료 기준: SOURCE.json에 source/pins/context가 있다.
- [x] 사실 두 행·기존 literal 및 자기 config claim 정합 · 예상 3분(추정) · 완료 기준: 보호 조항 불변·관련 JSON pointer만 변화한다.
- [x] 필요한 형식/버전확인·normal commit·seal/clean 인계 · 예상 3분(추정) · 완료 기준: 정상 훅·실제HEAD·clean·자기잔류 측정으로 writer 종료.

## 1. [원칙 ①] 문제 정확히 파악
PR981은 명시승인 뒤 실제 병합됐으나 전문 머리·대장에는 조건식만 있다. 이번 작업은 제14.3의 병합 근거 사실기입 후속이며 새 규범개정이 아니다.
## 2. [원칙 ②] 본질·원인·중심·핵심
본질은 이미 발생한 병합의 추적 가능성이다. 원인은 승인·병합 전 문서가 조건식을 적었기 때문이다. 중심은 전문 L5와 대장 K17행이다. 핵심은 실제 해시·시각·계정만 덧붙여 승인 범위를 유지하는 것이다.
## 3. [원칙 ③] 효과적 해결방식
원격 main b396 및 root 되읽기 source를 결박해 두 행에 같은 사실 문장을 추가한다. 기존 claims C4/C6 check.text만 현재 exact line에 맞추고 새 기록 claim은 config/text로 한정한다.
## 4. [원칙 ④] 재검토
시간중립 발효조건·당시 미병합 snapshot·기존 명시승인·원판정·과거 보고는 그대로 둔다. 승인 본문 170/171, 커널·MASTER·제품·값·ACTIVE·Court/게이트는 바꾸지 않는다.
## 5. [원칙 ⑤] 절차
현재 지침·WORKREFERENCE981·main/merge proof를 읽고 plan/REQ를 작성한다. 실제 사실 두 행과 literal 두 항목을 정합한 뒤 claims 형식·literal·appendix versions만 확인하고 정상 commit·봉인·clean/PID로 인계한다.
## 6. [원칙 ⑥] 절차 재검증·반론 격파
반론1 사실기입도 새 규범개정이라는 주장은 제14.3이 요구하는 승인 후 실제 병합 기록이고 승인 실질이 그대로여서 배제한다. 반론2 원판정 확인부족을 통과로 교정해야 한다는 주장은 판정 권한과 원기록 보존을 위반하므로 배제한다.
## 7. [원칙 ⑦] 단계별 실행
새 격리 WT 단독 writer로 자기 plan/REQ/ticket/report와 지정 source만 쓴다. 기존 e17norm은 동결한다. push·PR·공식 Court·병합은 root가 한다. DOM/handler/product 변경은 없다.
## 8. [원칙 ⑧] 막히는 지점 예상·측정
과거 claims/보고를 현재판정으로 재분류하지 않는다. raw CRLF와 Git 정규화 층을 분리하고 원파일 바이트를 보존한다. 중앙309d 링크는 root 소유 pending, 계획·사용·효과는 분리하며 미측정은 null이다.
