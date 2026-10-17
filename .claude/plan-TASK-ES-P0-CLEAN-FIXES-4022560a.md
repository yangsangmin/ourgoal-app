# PLAN-TASK-ES-P0-CLEAN-FIXES-4022560a — 2차 문제해결 8원칙 실행 계획서

## ① 파악 (구현 범위 및 대상 파일)
- **티켓**: `#TASK-ES-P0-CLEAN-FIXES-4022560a`
- **수정 대상 코드 파일 (12개, 모두 비저장 파일 · 800줄 이하)**:
  1. `js/sanctuary-v3-engine.js` (`H-01`, `H-05`, `F-05`, `C-02`, `R-01`)
  2. `js/sanctuary-calendar-views.js` (`C-02`)
  3. `js/sanctuary-calendar-actions.js` (`C-02`)
  4. `js/tabs/calendar/schedule-done-toggle.js` (`C-03`)
  5. `js/sanctuary-focus-timer.js` (`R-05`)
  6. `js/sanctuary-record-feed.js` (`R-03`, `R-04`)
  7. `js/tabs/goals/goal-detail.js` (`F-01`, `F-02`)
  8. `js/tabs/goals/goal-detail-events.js` (`F-01`, `F-02`)
  9. `js/tabs/goals/template-encyclopedia.js` (`F-15`)
  10. `js/tabs/comm/feed-list.js` (`M-01`, `M-03`, `M-04`, `M-08`)
  11. `js/team-companion-search.js` (`M-02`, `M-09`, `M-10`)
  12. `js/tabs/settings/render.js` (`S-01`)
- **보고 및 인계 문서 (`reports/TASK-ES-P0-CLEAN-FIXES-4022560a/`)**:
  - `DIR006-HANDOFF-2026-10-17.md`
  - `G01-SANCTUARY-VS-LEGACY-MATRIX.md`
  - `OURGOAL-FULL-FORENSIC-MASTER-REPORT.md`
  - `claims.json` 및 `scenarios/*.scenario.json`

## ② 본질 · 원인 · 중심 · 핵심
- **본질**: 저장 계층(`DIR-006`)을 건드리지 않고 UI·상태·이벤트 배선 결함만 안전하게 수리하여 사용자 체감 버그를 즉시 해소하는 것.
- **원인**: 각 탭 렌더러 간 인자·상태 키 불일치 및 재렌더링 시 DOM 포커스/아코디언 열림 상태 초기화.
- **중심**: 최소 침습(Minimal Invasive) 수리로 기존 테스트와의 호환성을 100% 유지하면서 버그만 정확히 제거.
- **핵심**: 브라우저 하네스(`tab-check.js`) 및 GitHub 법정(`node court/chat.js <PR>`) 심사 통과.

## ③ 해결방식
- 각 파일의 해당 함수에서 상태 키 동기화, 인자 보강, 포커스/열림 상태 스냅샷 복원을 수행한다.

## ④ 재검토
- 모든 파일의 줄 수가 800줄 이하(`template-encyclopedia.js` 794줄, `sanctuary-v3-engine.js` 723줄, `feed-list.js` 680줄 등)임을 확인했다.

## ⑤ 절차
1. `reports/TASK-ES-DIR006-HANDOFF-4022560a`를 `reports/TASK-ES-P0-CLEAN-FIXES-4022560a`로 이동/통합.
2. `reports/TASK-ES-P0-CLEAN-FIXES-4022560a/claims.json` 및 시나리오 작성.
3. 로컬 테스트 및 `tab-check.js` 결과 확인 후 커밋·푸시·초안 PR 생성.
4. `node court/chat.js <PR번호>` 판정 확인.

## ⑥ 절차 재검증
- `.task-links/4022560a.json` 등 작업자 로컬 임시 파일이 커밋에 섞이지 않도록 정리 후 스테이징한다.

## ⑦ 단계별 실행
- 즉시 실행 및 검증.

## ⑧ 막히는 지점 예상
- 법정 `claims.json`에서 변경된 제품 코드 파일을 포괄하도록 주장 항목(`claims`)과 `scenarios`를 정확히 매핑한다.
