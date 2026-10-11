# 작업계획서 — TASK-ES-653 (`setupUserSessionRealtime` 이전)

목표(본질): index.html 인라인 덩어리의 `setupUserSessionRealtime` 을 생성기로 글자 그대로 세포 `js/tabs/settings/user-session-realtime.js` 에 옮긴다. 상태 변수 `USER_SESSION_CHANNEL` 은 덩어리에 두고 통로 get·set 으로 읽고 쓴다. 병합하지 않는다(오케스트레이터 몫).

상민님 지시 원문(2026-10-11): 「남은 미분화작업 모두 진행해 병합도 스스로 진행해. 모든 작업 마칠때까지 멈추지 마.」 · 지시함 DIR-003 · DIR-004 · 작업참고 기준 PR #905 · 선행 PR #922 · 선례 #913 · #917.

## 체크리스트

- [x] 작업 폴더·번호 선점 · 예상 5분 · 완료 기준: `git ls-remote origin` 에 feat/2026-10-11-task-es-653-user-session-realtime-move 가 있다
- [x] 생성기 실행 + verify · 예상 10분 · 완료 기준: verify ok:true, 대입 이름의 setter 빠짐 0 · 마지막 노출 setter 문제 0
- [x] 신고서·cell-descriptions·module-guard --update · 예상 5분 · 완료 기준: module-guard 종료 코드 0, inlineScriptLines 가 줄었다
- [x] 정적 집계(대입이 전부 통로) + 통로 쓰기 왕복 실측 · 예상 15분 · 완료 기준: assign-count allAssignmentsViaScope true, accessor-probe ok true
- [x] 증명: module-load · 이름 지문 · 시나리오 · npm test · tests 전부 · 예상 30분 · 완료 기준: 결과 파일이 reports/TASK-ES-653/ 에 있다
- [x] REQ(8원칙)·claims(로그인 뒤 동작은 「확인 못 함」 주장 하나)·TICKETS · 예상 20분 · 완료 기준: verify-integrity-gate → npm test 종료 코드 0
- [x] 커밋 → 로컬 recomputeSplit ok:true · judge.js 전체 실행 · 예상 20분 · 완료 기준: 결과가 court-local.json 에 있다
- [ ] origin/main 합치기 → push → PR 열기(5대 고정 블록) → `gh pr view` 되읽기 · 예상 10분 · 완료 기준: PR 번호·head 가 되읽은 값과 같다
- [ ] [4단계: 심사 청구] 오케스트레이터에 보고 · 완료 기준: 보고에 PR 번호·수치·한계가 있다

## 막힐 지점 예상(원칙 ⑧)

- 로그인 뒤 경로는 게스트 시나리오로 못 잰다 → 정적 집계·통로 쓰기 실측으로 재고, 로그인 뒤 동작 지시 항목에는 「확인 못 함」 주장 하나만 건다(L045 — 사유는 실서버 필요). 법정이 「확인 부족 — 도구 한계」를 내면 정상 판정이다.
- 상태 이전 2차(649)·구역 이전(650)이 먼저 병합되면 main 판으로 생성기 재실행(L010).
