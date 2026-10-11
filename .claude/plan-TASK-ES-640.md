# 작업계획서 — TASK-ES-640 (시동 배선 감싸기 2차)

목표(본질): index.html 인라인 덩어리에 남은 로드 중 문 7개와 작은 함수 2개를 생성기로 글자 그대로 세포에 옮긴다(체크인 입력 연결 · 팀 목표 댓글 보내기 · 샘플 기록 정리 · 빠른 목표 추가). 동작 0 변경, 손으로 옮긴 글자 0. 병합하지 않는다(오케스트레이터 몫).

상민님 지시 원문(2026-10-11): 「남은 미분화작업 모두 진행해 병합도 스스로 진행해. 모든 작업 마칠때까지 멈추지 마.」 · 지시함 DIR-003 · DIR-004 · 작업참고 기준 PR #905 · 직전 선례 PR #911.

## 체크리스트

- [x] 작업 폴더·번호 선점 · 예상 5분 · 완료 기준: `git ls-remote origin` 에 feat/2026-10-11-task-es-640-wrap-boot-2 가 있다
- [x] 생성기 실행 + verify · 예상 10분 · 완료 기준: verify-inline-hard ok:true, 대입 이름 pendingCapturePhoto 의 setter 빠짐 0
- [x] 신고서(module-specs --write · requires ui.confirm)·cell-descriptions·module-guard --update · 예상 10분 · 완료 기준: module-guard 종료 코드 0, inlineScriptLines 가 줄었다
- [x] 게스트 화면 도달 범위 실측 + 시나리오 4개 · 예상 30분 · 완료 기준: 기준 2회·작업 1회 모두 통과
- [x] 증명: module-load 회귀 0 · 이름 지문 · npm test 수 동일 · tests 전부 종료 코드 동일 · 예상 30분 · 완료 기준: 결과 파일이 reports/TASK-ES-640/ 에 있다
- [x] REQ(8원칙)·claims·proof·TICKETS · 예상 20분 · 완료 기준: verify-integrity-gate → npm test 종료 코드 0
- [ ] 커밋 → 로컬 recomputeSplit ok:true · judge.js 전체 실행 · 예상 20분 · 완료 기준: 결과가 court-local.json 에 있다
- [ ] origin/main 합치기 → push → PR 열기(5대 고정 블록) → `gh pr view` 되읽기 · 예상 10분 · 완료 기준: PR 번호·head 가 되읽은 값과 같다
- [ ] TASK-ES-637 병합 뒤 main 판 index.html 로 생성기 재실행·측정 재실행 · 완료 기준: 재실행 뒤 recomputeSplit ok:true
- [ ] [4단계: 심사 청구] 오케스트레이터에 보고 · 완료 기준: 보고에 PR 번호·수치·한계가 있다

## 막힐 지점 예상(원칙 ⑧)

- 637 병합으로 index.html 충돌 → 손으로 풀지 않고 main 판으로 생성기 재실행(L010). 신고서 손 칸(requires)은 set-requires.cjs 로 다시 채운다.
- 팀 댓글·사진 첨부·음성 받아 적기는 게스트 화면으로 끝까지 닿지 않는다 → 닿는 범위만 화면으로 재고 한계를 적는다.
