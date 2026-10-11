# 작업계획서 — TASK-ES-645 (돈 근처 함수 2개 글자 그대로 이전)

목표(본질): index.html 인라인 덩어리의 `executeDirectTemplateClone` · `openTemplateMarketModal` 을 생성기로 글자 그대로 세포 `js/tabs/records/template-market.js` 에 옮긴다. 지시함 DIR-004 (나) 한도: 내용은 한 글자도 바꾸지 않고 자리만. 병합하지 않는다(오케스트레이터 몫).

상민님 지시 원문(2026-10-11): 「남은 미분화작업 모두 진행해 병합도 스스로 진행해. 모든 작업 마칠때까지 멈추지 마.」 · 지시함 DIR-003 · DIR-004 · 작업참고 기준 PR #905 · 선례 PR #911 · #913.

## 체크리스트

- [x] 작업 폴더·번호 선점 · 예상 5분 · 완료 기준: `git ls-remote origin` 에 feat/2026-10-11-task-es-645-template-market-move 가 있다
- [x] 한도 확인(DIR-004 원문 · OURGOAL_CONFIG·!important·this/arguments 0) · 예상 10분 · 완료 기준: REQ 머리에 원문 인용, 옮길 줄에 해당 글자 0건
- [x] 생성기 실행 + verify + 한도 실측 · 예상 15분 · 완료 기준: verify ok:true, prefix-only-check 의 그 밖의 차이 0줄
- [x] 신고서·cell-descriptions·module-guard --update · 예상 5분 · 완료 기준: module-guard 종료 코드 0, inlineScriptLines 가 줄었다
- [x] 게스트 도달 실측 + 시나리오(쓰기 조작 없음) · 예상 20분 · 완료 기준: 기준 2회·작업 1회 통과
- [x] 증명: module-load · 이름 지문 · 접근자 · npm test · tests 전부 · 예상 30분 · 완료 기준: 결과 파일이 reports/TASK-ES-645/ 에 있다
- [x] REQ(8원칙)·claims·proof·TICKETS · 예상 20분 · 완료 기준: verify-integrity-gate → npm test 종료 코드 0
- [ ] 커밋 → 로컬 recomputeSplit ok:true · judge.js 전체 실행 · 예상 20분 · 완료 기준: 결과가 court-local.json 에 있다
- [ ] origin/main 합치기 → push → PR 열기(5대 고정 블록) → `gh pr view` 되읽기 · 예상 10분 · 완료 기준: PR 번호·head 가 되읽은 값과 같다
- [ ] [4단계: 심사 청구] 오케스트레이터에 보고 · 완료 기준: 보고에 PR 번호·수치·한도 준수 확인이 있다

## 막힐 지점 예상(원칙 ⑧)

- 커밋 훅의 돈 표시 검사가 막으면 우회하지 않고 훅 출력 원문과 함께 보고한다.
- 생성기가 OURGOAL_CONFIG 나 돈 관련 상태의 getter 를 새로 달려 하면 멈추고 보고한다(실제로는 해당 없음 — 새 getter 는 saveLocalSettings · CURATED_MARKET_TEMPLATES).
- 다른 index.html PR 이 먼저 병합되면 main 판으로 생성기 재실행(L010).
