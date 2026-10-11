# 작업계획서 — TASK-ES-652 (`USER_SESSION_CHANNEL` setter 선행)

목표(본질): `setupUserSessionRealtime` 을 세포로 옮길 수 있게, 통로의 `USER_SESSION_CHANNEL` 마지막 노출 줄에 setter 한 칸을 더한다(index.html 한 줄, 줄 수 그대로, 동작 그대로). 병합하지 않는다(오케스트레이터 몫). 실제 이전은 이 PR 병합 뒤 다음 PR.

상민님 지시 원문(2026-10-11): 「남은 미분화작업 모두 진행해 병합도 스스로 진행해. 모든 작업 마칠때까지 멈추지 마.」 · 지시함 DIR-004(설계 6.2 순서 3 · 9절 setter 선행) · 작업참고 기준 PR #905.

## 체크리스트

- [x] 작업 폴더·번호 선점 · 예상 5분 · 완료 기준: `git ls-remote origin` 에 feat/2026-10-11-task-es-652-user-session-realtime 이 있다
- [x] 현재 main 에서 선행 없이 이전 모의 · 예상 10분 · 완료 기준: 검사기 결과(FAIL·사유)가 mock-move.json 에 있다
- [x] index.html 한 줄 편집 + 통로 쓰기 왕복(기준·작업) · 예상 10분 · 완료 기준: 작업 writeRoundTripOk true, 기준 false
- [x] 선행 뒤 이전 모의 → 원복 · 예상 10분 · 완료 기준: 검사기 ok, index.html 차이가 다시 1줄
- [x] 측정: 대조·지문 · 시나리오 2개 · 모듈 로드 · npm test · tests 전부 · 예상 30분 · 완료 기준: 결과 파일이 reports/TASK-ES-652/ 에 있다
- [x] REQ(8원칙)·claims·TICKETS · 예상 20분 · 완료 기준: verify-integrity-gate → npm test 종료 코드 0
- [x] 커밋 → judge.js 전체 실행 · 예상 15분 · 완료 기준: 결과가 court-local.json 에 있다
- [ ] origin/main 합치기 → push → PR 열기(5대 고정 블록) → `gh pr view` 되읽기 · 예상 10분 · 완료 기준: PR 번호·head 가 되읽은 값과 같다
- [ ] [4단계: 심사 청구] 오케스트레이터에 보고 · 완료 기준: 보고에 PR 번호·실측·다음 PR 계획이 있다

## 막힐 지점 예상(원칙 ⑧)

- 손 편집 PR 이라 생성기 재실행 대조(proof)가 없다 → 보존 주장은 시나리오로, 한 줄 변경과 쓰기 왕복은 기록 주장으로 건다(선례 #909). 법정이 「확인 부족」을 내면 사유를 보고 고친다.
- 다른 index.html PR 이 먼저 병합되면 그 줄을 다시 찾아 같은 한 칸을 더하고 다시 잰다.
