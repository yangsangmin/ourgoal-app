목표: K17의 기존 삭제 승인·정확 문구·현행 강제 규범을 대조하고 최소 개정 제안을 총괄에게 전달한다.

- [x] 원전·후속확정·현행규범 source/hash/locator 확보 · 예상 15분(추정) · 완료 기준: 원승인 마9/마10/바9 및 06 후속 확인을 행 번호와 SHA256으로 조회할 수 있다. 측정: evidence.json sourcePins/approvalLocators/confirmation.
- [x] 최소 법령 전문 개정 제안·diff와 K17 074~082/13칸 연결 작성 · 예상 10분(추정) · 완료 기준: 제품·커널·원source를 변경하지 않고 강제 두 문장의 검토안을 파일로 읽을 수 있다. 측정: MINIMAL-PROPOSAL.md/MINIMAL-STATUTE.diff와 evidence.json requirementLinks/k17Tasks.
- [x] 변경범위·되읽기·잔여프로세스와 인계 봉인 · 예상 5분(추정) · 완료 기준: 산출물 SHA와 git status, 자기 범위 잔여 실행 관측을 기록하고 root에 경로를 전달한다. 측정: closure.json 보호대상/원source 되읽기·trackedDiff·diffExactReadback·process-observation.json, root 메시지 경로 전달.

막힐 지점: 원문사본과 실제 발화 차이, 규범 승인과 삭제 승인 혼동, main 변동, 정확 안내문구 변형. 원본을 보존하고 차이는 root에 보고한다. 원승인되지 않은 삭제나 규범 발효는 실행하지 않는다.

## 1. [원칙 ①] 문제 정확히 파악
`결심 기록.md` 마9/마10/바9와 `06-이해확인-현황.json`을 전문170·171행에 대조한다. 후속 맞음으로 초기 답대기를 대체하되 원파일은 보존한다.
## 2. [원칙 ②] 본질·원인·중심·핵심
본질은 번잡함 제거와 자료보존이다. 원인은 후속결정과 강제기획의 간격, 중심은 전문2.9와 `MASTER_PLAN_OURGOAL.md`, 핵심은 삭제 승인과 규범⑤를 구분해 정확안을 준비하는 것이다.
## 3. [원칙 ③] 효과적 해결방식
`MINIMAL-STATUTE.diff`는 제품변경 없는 두 문장 검토안이다. DB/이미지/뷰 전파 변경은 없고 원격 권위·차원분리·기존값 보존을 유지한다.
## 4. [원칙 ④] 재검토
`#smartRecommendChips`·`#sliderEnergy`·`#sliderFocus`·`#quickCheckinChips`와 후속074~082의 범위를 확인한다. 원13칸을 제안서에 담고 사용 가능·효과 확인을 아직 null로 둔다.
## 5. [원칙 ⑤] 절차
fresh fetch→격리worktree→필수원전→최초소견→정확diff→sourcehash/링크→closure→root 인계다. 자기폴더의 준비문서만 작성한다.
## 6. [원칙 ⑥] 절차 재검증·반론 격파
삭제원승인이 규범승인을 자동 포함한다는 반론은 커널14.5로 구분한다. 커널에 강제가 없으니 무시한다는 반론은 부재가 직접충돌이 아님을 대조하여 기각한다.
## 7. [원칙 ⑦] 단계별 실행
`evidence.json`의 실제 turn_context와 원문locator·66individual 링크·074~082를 되읽는다. 반복 제품시험·운영·원격·공용원장 작업은 없으며 후속 책임은 root에 넘긴다.
## 8. [원칙 ⑧] 막히는 지점 예상·성과 측정
활성 로그의 무제한 pipeline 읽기가 정체한 원실패를 evidence에 보존하고 첫 turn_context까지의 bounded read로 교정했다. `closure.json`의 SHA/footprint/잔여실행 관측은 준비문서 범위이며 규범효력·제품사용·효과로 확대하지 않는다.
