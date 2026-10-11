# 작업계획서 — TASK-ES-671 (구역 이전: 앱 환경설정 객체 · 템플릿 부품 초기화 블록)

목표(본질): index.html 인라인 덩어리에 「결심 필요」로 남아 있던 두 곳(OURGOAL_CONFIG 선언·window 복사 블록, 템플릿 부품 초기화 블록)을 생성기 region 으로 세포 js/core/boot-app-handles.js 의 구역 함수 둘로 옮긴다. 한도: 접두(L.) 말고는 한 글자도 바꾸지 않는다 · 돈 관련 줄을 만들거나 지우지 않는다. 병합하지 않는다(오케스트레이터 몫).

근거: 상민님 2026-10-11 「결심 1 : 승인, 금고 변경 승인, 결심 2 : 승인」 가운데 결심 2(오케스트레이터가 전한 글자 — 빌더는 채팅을 직접 보지 못했다). 상민님 지시 원문: 「남은 미분화작업 모두 진행해 병합도 스스로 진행해. 모든 작업 마칠때까지 멈추지 마.」 · 지시함 DIR-003 · DIR-004 · 선행 PR #938 · 작업참고 기준 PR #931. push 는 번호 선점 1회 + 마무리 1회.

## 체크리스트

- [x] 작업 폴더·번호 선점 · 예상 5분 · 완료 기준: `git ls-remote origin` 에 feat/2026-10-11-task-es-671-boot-app-handles 가 있다
- [x] proof.json(allowGuarded 둘 · 구역 둘) → 생성기 실행 · 예상 15분 · 완료 기준: 생성기 종료 코드 0, 출력에 guarded 줄 셋
- [x] 신고서·cell-descriptions·module-guard --update · 예상 5분 · 완료 기준: module-guard 종료 코드 0, inlineScriptLines 가 줄었다
- [x] 줄 단위 접두-만 비교 · 돈 관련 낱말 줄 수 · 예상 15분 · 완료 기준: prefix-only-check.json ok true
- [x] window.OURGOAL_CONFIG · 초기화 호출 관측 탐침 · 접근자 탐침 · 예상 15분 · 완료 기준: guarded-probe.json ok true, accessor-probe.json ok true
- [x] 상태 탐침 · 지문 · 시나리오 셋 · 모듈 로드 · npm test · 시험 하나씩 · 예상 30분 · 완료 기준: measurement.json ok true
- [x] REQ(8원칙) · claims(실서버 동작은 「확인 못 함」 주장 하나) · TICKETS · 예상 20분 · 완료 기준: verify-integrity-gate → npm test 종료 코드 0
- [x] 커밋 → 로컬 recomputeSplit ok:true · judge.js 전체 실행 · 예상 20분 · 완료 기준: 결과가 court-local.json 에 있다
- [x] origin/main 합치기 → push 1회 → PR 열기(5대 고정 블록) → `gh pr view` 되읽기 · 예상 10분 · 완료 기준: PR 번호·head 가 되읽은 값과 같다
- [x] [4단계: 심사 청구] 오케스트레이터에 보고 · 완료 기준: 보고에 PR 번호·수치·한계가 있다

(끝의 세 칸은 push 를 한 번으로 줄이려고 그 push 에 함께 실었다 — 법정 요약 파일과 PR 번호 되읽기는 보고에서 확인한다.)

## 막힐 지점 예상(원칙 ⑧)

- 게스트 화면으로는 두 곳이 한 일이 드러나지 않는다 → 페이지가 뜨기 전에 관측 조각을 심는 탐침으로 재고, 실서버 동작은 「확인 못 함」으로 적는다.
- 세포 파일 이름·머리 설명에 돈 관련 낱말이 들면 한도 밖이다 → 낱말 줄 수로 잰다(머리 0줄).
- 944줄 정리(#936)·재철거 2차가 먼저 병합되면 main 판에 같은 proof.json 을 다시 돌린다(L010).
