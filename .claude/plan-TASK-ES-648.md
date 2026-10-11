# 작업계획서 — TASK-ES-648 (다시 생긴 배선 재철거)

목표(본질): 감싸기·함수 이전이 IIFE 머리에 다시 단 통로 getter 가운데 등록 기관이 통로에 내주는 이름의 줄, 참조 0 이 된 가져오기 줄·손잡이 줄을 생성기 unwire 로 지운다. 제품 변경은 index.html 하나, 손 편집 0. 병합하지 않는다(오케스트레이터 몫).

상민님 지시 원문(2026-10-11): 「남은 미분화작업 모두 진행해 병합도 스스로 진행해. 모든 작업 마칠때까지 멈추지 마.」 · 지시함 DIR-003 · DIR-004 · 작업참고 기준 PR #905 · 선례 #891~#907.

## 체크리스트

- [x] 작업 폴더·번호 선점 · 예상 5분 · 완료 기준: `git ls-remote origin` 에 feat/2026-10-11-task-es-648-unwire-regrown 이 있다
- [x] 현재 main 에서 남은 배선 재기 · 예상 10분 · 완료 기준: remaining-wiring.before.json 이 있다
- [x] 대상 가르기 + unwire-run apply · 예상 15분 · 완료 기준: 생성기가 멈춘 이름 0, index.html 줄이 줄었다
- [x] module-guard --update · npm test 기준·작업 · unwire-run measure · 예상 30분 · 완료 기준: 대조 불일치 0 · 사라진 이름 0 · 지문 차이 0 · 되짚기 같음
- [x] 남은 배선·덩어리 구성 다시 재기 · 예상 10분 · 완료 기준: remaining-wiring.json · iife-composition.json 이 있다(줄 합 일치)
- [x] REQ(8원칙)·claims·TICKETS · 예상 20분 · 완료 기준: verify-integrity-gate → npm test 종료 코드 0
- [x] 커밋 → 로컬 recomputeSplit ok:true · judge.js 전체 실행(X2 첫 실사용) · 예상 20분 · 완료 기준: 결과가 court-local.json 에 있다
- [ ] origin/main 합치기 → push → PR 열기(5대 고정 블록) → `gh pr view` 되읽기 · 예상 10분 · 완료 기준: PR 번호·head 가 되읽은 값과 같다
- [ ] [4단계: 심사 청구] 오케스트레이터에 보고 · 완료 기준: 보고에 PR 번호·수치·남은 구성 표가 있다

## 막힐 지점 예상(원칙 ⑧)

- window 전용으로 등록된 이름의 getter 를 지우면 세포가 못 읽는다 → 대상에서 빼고 대조의 「통로에서 사라진 이름 0」으로 확인한다.
- X2(dropKitVar) 첫 실사용 → push 전 recomputeSplit·로컬 법정 전체 실행.
- 다른 index.html PR(TASK-ES-646)이 먼저 병합되면 main 판 index.html 로 apply 를 다시 돌린다.
