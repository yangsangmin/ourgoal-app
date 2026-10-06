목표: 기존 학습 이벤트로 작업 중 실패·다음 브리프·최근3건 개선·증거 재검토·후속 실측을 이어 준다.

공통 taskId OURGOAL-AGY-SPLIT-RUN-20261006. 원격 부모 상태 sync는 root 단독 담당. 소유: docs/design/harness/shared-learning/{feedback-validate.js,feedback-view.js,review.js,validate.js,collect.js,bootstrap.js,cli.js}, docs/agents/shared-learning/README.md, 자기 REQ/PLAN/reports/learning-feedback. 다른 담당 AGY582585·PR844 완료 트리 변경0.

- [x] 전체 PR844 작업참고·설치runtime·기존schema/collect/bootstrap 확인 · 예상10분 · 이미되는것/연결부족 근거 기록
- [x] 독립8원칙REQ·최소코어연결 구현 · 예상30분 · 선택 feedback-validate/feedback-view/feedback-common/review와 기존 CLI 연결 작성; req-gate.txt exit0
- [x] 기존검증과 실제collect→bootstrap→recent3 측정 · 예상15분 · check-result.json·별도 legacy-check-output.json·npm-test.txt exit0; 작업자 관측이며 독립 판정 아님
- [x] 정상hook commit·독립담당/root 인계 · 예상10분 · 정상hook commit 후 tree·실측·독립판정/설치 미완 경계 전달

막힘 예상: 실패의 진실성은 독립검토가 확인한다. 권고는 자동 재배정·권한 변경이 아니다. 기존2/3승격 충돌을 결정하지 않는다. 효과·진행량·토큰은 출처 없으면null. runtime 설치/PR/Court/병합은root.

- [x] 독립 검토의 원시 실패 식별자·등록 checker·옛 효과 출처 반례 보강 · 예상15분 · fix-check-output.json에서 세 반례 exit2, 미확인 관측 수집/확정집계 제외, 기존 도구33건 예상 일치

- [x] 정상 submit 전 claims/REQ 형식 검사와 실제 실패 pending 연결 · 예상10분 · 기존 요약 원문 보존, validateClaims 형식 오류0, REQ gate exit0, submit-feedback-result.json의 실제 실패exit1/수정exit0·다음bootstrap 연결
- [ ] 최종 head 정상 quick 예비검사 · 예상5분 · 정상 commit 후 기존 court/judge.js --quick exit0 측정·root 인계
