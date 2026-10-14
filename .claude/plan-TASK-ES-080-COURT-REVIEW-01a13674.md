# 목표
Goal 재심 C081/C082 동선 교정이 원 기대를 약화하지 않고 기존 UI 보호·팝업을 정상적으로 거치는지 독립 검토한다.

공통 task_id TASK-CC-CELL-UNWIRE-RUN-309dca5d. 중앙 연계는 root 단독이며 이 leaf의 직접 sync는 하지 않는다. 중앙 완료는 미확인.
작업 TASK-ES-080-COURT-REVIEW-01a13674. 원격 fetch 후 origin/main 0692dbd255fdacad2a50db9e324dd5486d9769b7 확인. 검토 대상은 root가 지정한 공개 PR 후보 9f161a5bc5c9c234e147ea1b2de8eda39674c22f에서 별도 격리했다. 검토 대상으로 재현하는 것이며 origin/main 제품을 변경하지 않는다.
작업참고 기준 PR #985. 요청 gpt-6-astra/high; 실제 rollout turn_context L4602, 2026-10-14T18:33:54.166Z, model=gpt-6-astra, effort=high. 기존 자기 rollout의 실제 행에서 확인했다. 공개 보고에는 로컬 세션 원문·사적 경로를 복제하지 않는다. 선택 이유: 공식 원반려와 기대 보존, 양성 전제의 의미를 구분해야 한다.
자기 계획과 reports/TASK-ES-080-GOAL-LINK-01a13674/correction-2-independent만 쓴다. 제품·claims·Court·기존 보고 쓰기 0. 실계정·외부/API·운영·원 시험 전수 반복 0. Goal 전용 공개 가능한 자료만 남긴다.

## 판단 요약
이해: 원 C081/C082의 실제 UI 도달 실패를 교정한 시나리오 검토다.
분류: 원반례 보존과 교정 분리의 표준 검토다.
예측: 부재 단언이 다른 팝업에 가려 우연히 참이 되거나, 양성 선행 상태가 동률 조건을 바꿀 수 있다.
반론: 기대 개수만 같으면 충분하다는 주장은 호출 순서와 실제 목표 상태가 달라질 수 있어 성립하지 않는다. 대기 시간을 추가하면 모두 해결된다는 주장은 기존 modal owner와 실제 닫힘을 확인해야 하므로 성립하지 않는다.
선택: exact 동결 packet과 원 기대 multiset을 먼저 비교하고 필요한 추가 동선만 관측한다.

## 체크리스트
- [x] 별도 WT/기준 인수 · 예상 5분 · fetch 후 origin/main과 지정 PR 후보 확인.
- [ ] 동결 시나리오 인수 · 예상 미정 · exact Git/physical SHA 및 제품·원 claims 불변 확인.
- [ ] 기대·동선 독립 검토 · 예상 미정 · 원 단언 보존, 양성 전제·동률·기존 팝업 정상 닫힘 검토.
- [ ] 필요한 선정 관측과 인계 · 예상 미정 · FIRST/근거/source seal·정상 commit·clean·자기 process 종료 확인. 공식 재심은 root 담당.

## ① 파악
원 scenarios/goal-link-ambiguous.json 및 goal-link-dismiss.json과 공식 첫 반려를 읽는다.
## ② 본질·원인·중심·핵심
검사 실패와 제품 실패, 기존 closeModal 보호와 새 목표 제안의 소유권을 구분한다.
## ③ 해결방식
원 기대를 보존하며 양성 제안→명시 이동, 기존 guest backup의 나중에 동선을 대조한다.
## ④ 재검토
동률의 두 목표가 실제 남았는지, 같은 부재 단언이 잘못된 화면에서 참이 되는지 검토한다.
## ⑤ 절차
원 source/claims → author 동결 → delta/expect 대조 → 필요한 한정 관측 → 독립 의견 봉인.
## ⑥ 절차 재검증
400ms 보호를 우회하거나 내부 상태를 주입하지 않는다. 기존 팝업을 새 제품 제안으로 해석하지 않는다.
## ⑦ 단계별 실행
수정 시나리오만 읽고 원 C080와 기존 전체 PC suite를 반복하지 않는다.
## ⑧ 막히는 지점 예상
동결 전 결론은 보류하며 source 불일치·기대 약화·양성 조건 변형을 root에게 즉시 보고한다. 공식 Court 판정은 대체하지 않는다.
