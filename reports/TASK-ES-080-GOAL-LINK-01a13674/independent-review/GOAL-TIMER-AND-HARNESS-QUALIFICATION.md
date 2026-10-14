# 목표 제안 독립 관측의 구분

대상 dfb6cac74fb336cab496e113f356875fb2da25fc. GOAL-MODAL-TIMER-FIRST.json은 실제 event-bus/modal-open/modal-helper/record-link 소스를 연결한 합성 DOM/timer 부품 관측이다. ui.modal은 opened 사건을 동기 발행한다. 그때 record-link listener가450ms 타이머를 만들고 tick 복귀 후250ms 타이머가 핸들을 덮는다. 열림 직후[450,250], 닫힘 직후[450], 잔여 호출 뒤[]였다. 1회 불필요한 후속 callback은 있으나 이 관측은 이중 창/영구 누수/실운영 효과를 입증하지 않는다. 원 author VM은 ui.modal opened 사건을 생략하므로 이 경계가 측정되지 않았다.

goal-pc-1 FIRST는 독립 하네스 실패다. root를 C:/ 문자열로 정한 뒤 path.resolve의 C:\\ 경로와 startsWith(root+path.sep) 비교해 정적 파일을 모두 거절했다. served0, landing button timeout이며 제품 실패가 아니다. 원 script/raw/PNG는 보존하고 goal-current-pc-path-correction.cjs에서 root의 path.resolve 한 곳만 고친 뒤 goal-pc-2 별도 경로로 측정한다. 기대 문구·행동 조건은 바꾸지 않는다. own browser profile은 로컬 미추적 잔류로 두고 삭제하지 않는다.
