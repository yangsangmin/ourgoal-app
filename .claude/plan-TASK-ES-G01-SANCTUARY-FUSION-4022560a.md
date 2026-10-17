# 작업계획서 — TASK-ES-G01-SANCTUARY-FUSION-4022560a

- **본질(목표 한 줄)**: 상민님의 `[결심 필요 2]`(`G-01` 선택지 1) 승인에 따라 어떤 기존 기능도 삭제하지 않고 `goals`·`calendar`·`records` 탭의 성소 컨테이너와 옛 화면 컨테이너 상·하단 중복 목록을 뷰 모드 접기/펼치기 전환 및 모달/선택 연동으로 무손실 통합하고, 브라우저 하네스(`tab-check.js`) 및 법정 `behavior` 시나리오(`node court/chat.js <PR>`) 통과를 실측한다.

## 체크리스트

- [x] **Step 1 — 작업 등록 및 REQ/PLAN 문서 작성** · 예상 5분 · 완료 기준: `docs/rules/TICKETS.md`, `docs/specs/REQ-TASK-ES-G01-SANCTUARY-FUSION-4022560a.md`, `.claude/plan-TASK-ES-G01-SANCTUARY-FUSION-4022560a.md` 생성 완료
- [x] **Step 2 — 목표·일정·기록 탭 성소 ↔ 옛 화면 무손실 뷰 모드 통합 구현 (`DIR-005`/`DIR-006` 파일 0줄 수정)** · 예상 15분 · 완료 기준: `js/sanctuary-v3-engine.js`, `js/sanctuary-goal-trail.js`, `js/sanctuary-calendar-views.js`, `js/sanctuary-record-feed.js` 수정 및 구문 오류 0건 확인
- [x] **Step 3 — 브라우저 하네스(`docs/design/harness/tab-check.js`), 로컬 스모크/정적/본질 게이트 및 법정 `behavior` 시나리오(`g01-sanctuary-fusion.json`) 실측 검증** · 예상 10분 · 완료 기준: `smoke-test.js`, `verify-integrity-gate.js`, `essence-gate.js`, `tab-check.js` 및 법정 시나리오(HEAD 통과 / BASE 증상 단계 실패) 확인 완료
- [x] **Step 4 — GitHub 초안 PR 생성 및 법정(`node court/chat.js <PR>`) `판정: 통과` 실측 확인** · 예상 10분 · 완료 기준: 초안 PR 생성 및 `node court/chat.js` `판정: 통과` 확인 완료
