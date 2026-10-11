# 작업계획서 — TASK-ES-638 (시동 배선 감싸기 1차)

목표(본질): index.html 인라인 덩어리에 남은 「로드 중 문」(앱이 뜰 때 한 번 도는 연결 줄)을 생성기로 글자 그대로 세포 함수에 옮기고 원래 자리에는 부르는 한 줄만 남긴다. 동작 0 변경, 손으로 옮긴 글자 0. 병합하지 않는다(오케스트레이터 몫).

상민님 지시 원문(2026-10-11): 「남은 미분화작업 모두 진행해 병합도 스스로 진행해. 모든 작업 마칠때까지 멈추지 마.」 · 지시함 DIR-003 · DIR-004 · 작업참고 기준 PR #905.

## 체크리스트

- [x] 작업 폴더·번호 선점 · 예상 5분 · 완료 기준: `git ls-remote origin` 에 feat/2026-10-11-task-es-638-wrap-boot-1 이 있다
- [x] 헌법·작업참고·지시함·설계·생성기·선례 읽기 · 예상 30분 · 완료 기준: REQ 에 기준 PR 번호와 DIR 번호가 적힌다
- [x] 현재 origin/main 에서 묶음 재측정 · 예상 15분 · 완료 기준: 최상위 문 목록(줄·종류·구획 제목)이 스크립트 출력으로 있다
- [x] 시험지 실측(전체 묶음 모의 이전 → tests 전부 종료 코드 기준 대비) · 예상 20분 · 완료 기준: 깨지는 시험 목록이 파일로 있다
- [x] 첫 PR 범위 확정 + 생성기 실행 + verify · 예상 15분 · 완료 기준: verify-inline-hard ok:true
- [x] 신고서(module-specs --write)·cell-descriptions·module-guard --update · 예상 10분 · 완료 기준: module-guard 종료 코드 0, inlineScriptLines 가 줄었다
- [x] 증명: module-load 탐침 기준 대비 회귀 0 · 게스트 시나리오 기준·작업 양쪽 · npm test 기준·작업 수 동일 · tests 전부 종료 코드 동일 · 예상 60분 · 완료 기준: 각 결과 파일이 reports/TASK-ES-638/ 에 있다
- [x] REQ(8원칙)·claims·proof·TICKETS · 예상 30분 · 완료 기준: verify-integrity-gate → npm test → 서류 뒤 npm test 종료 코드 0
- [ ] 커밋 → 로컬 recomputeSplit ok:true · judge.js 전체 실행 · 예상 30분 · 완료 기준: 결과가 court-local.json 에 있다
- [ ] origin/main 합치기 → push → PR 열기(5대 고정 블록) → `gh pr view` 되읽기 · 예상 15분 · 완료 기준: PR 번호·head 가 되읽은 값과 같다
- [ ] [4단계: 심사 청구] 오케스트레이터에 보고 · 완료 기준: 보고에 PR 번호·수치·미룬 묶음이 있다

## 막힐 지점 예상(원칙 ⑧)

- main 이 움직여 index.html 충돌 → 손으로 풀지 않고 main 판으로 생성기 재실행(L010).
- 시험이 index.html 만 읽어 깨짐 → 그 묶음은 미루고 시험지 선행 PR 후보로 보고(L021).
- 생성기가 통로 getter 를 다시 다는 줄(철거로 지운 이름) → 줄 수 효과가 줄어든다. 동작은 같은지 이름 지문으로 잰다.
- 대입하는 이름의 setter(L047) · 기관 키트 가져오기 자리(L046) → verify 의 해당 검사와 게스트 부팅 시나리오로 확인.
