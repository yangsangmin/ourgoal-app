# 작업계획서 — TASK-ES-659 (`saveGoogleToken` 이전)

목표(본질): index.html 인라인 덩어리의 `saveGoogleToken` 을 생성기로 선언째 글자 그대로 세포 `js/core/gcal-token-save.js` 에 옮긴다. 둘째 인자를 읽는 `arguments[1]` 은 헌법 v2026.10.11-ARGUMENTS CELL_SPLIT 5호가 허용한 꼴(함수 선언 자신의 것)이다. 병합하지 않는다(오케스트레이터 몫).

상민님 지시 원문(2026-10-11): 「남은 미분화작업 모두 진행해 병합도 스스로 진행해. 모든 작업 마칠때까지 멈추지 마.」 · 지시함 DIR-003 · DIR-004 · 헌법 개정 PR #925 · 선행 PR #929 · 작업참고 기준 PR #905.

## 체크리스트

- [x] 작업 폴더·번호 선점 · 예상 5분 · 완료 기준: `git ls-remote origin` 에 feat/2026-10-11-task-es-659-save-google-token 이 있다
- [x] 세포 파일 책임 구분 결정 · 예상 5분 · 완료 기준: REQ 에 기존 gcal-token.js · gcal-sync.js 와의 구분 표가 있다
- [x] 생성기 실행 + verify · 예상 10분 · 완료 기준: verify ok:true, ownArguments 1곳, thisArgs []
- [x] 신고서·cell-descriptions·module-guard --update · 예상 5분 · 완료 기준: module-guard 종료 코드 0, inlineScriptLines 가 줄었다
- [x] arguments 독립 집계 + 직접 호출 실측(기준 대 작업) · 예상 20분 · 완료 기준: arguments-check ok true, save-token-probe ok true
- [x] 증명: 줄 단위 비교 · module-load · 이름 지문 · 접근자 · 시나리오 · npm test · tests 전부 · 예상 30분 · 완료 기준: 결과 파일이 reports/TASK-ES-659/ 에 있다
- [x] REQ(8원칙)·claims(연동 뒤 동작은 「확인 못 함」 주장 하나)·TICKETS · 예상 20분 · 완료 기준: verify-integrity-gate → npm test 종료 코드 0
- [x] 커밋 → 로컬 recomputeSplit ok:true · judge.js 전체 실행 · 예상 20분 · 완료 기준: 결과가 court-local.json 에 있다(recomputeSplit 결과 포함)
- [ ] origin/main 합치기 → push → PR 열기(5대 고정 블록) → `gh pr view` 되읽기 · 예상 10분 · 완료 기준: PR 번호·head 가 되읽은 값과 같다
- [ ] [4단계: 심사 청구] 오케스트레이터에 보고 · 완료 기준: 보고에 PR 번호·수치·한계가 있다

## 막힐 지점 예상(원칙 ⑧)

- 이 함수는 구글 연동·로그인 뒤에만 불린다 → 게스트 시나리오로 못 잰다. 가짜 토큰으로 직접 불러 기준과 맞대고, 진짜 연동 뒤 동작은 「확인 못 함」 주장 하나로 적는다.
- 구역 이전(650)·944줄 정리(646)가 먼저 병합되면 main 판으로 생성기 재실행(L010).
