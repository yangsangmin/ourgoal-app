# PLAN-goal-ai-advice-caching — 목표 탭 AI 조언 문구 및 캐시 개선 작업계획서

- **티켓 번호**: #TASK-ES-134
- **적용 축**: FIX / E1
- **기준 문서**: docs/specs/REQ-goal-ai-advice-caching.md

---

## 1. 개요 및 변경 범위
- **대상 파일**:
  1. `index.html`:
     - L9307-9351: `generateGoalStatusSummary` 글자 수 조건 완화 (30자 이상 수용), `refreshGoalStatusSummary` 완료 시 DOM 배선 보강 및 뱃지/스니펫 즉각 갱신
     - L9813-9831: 라벨을 '현상태 분석 AI 조언'으로 변경, `#goalStatusBadge` 상태 배지 신설, 스니펫 텍스트 및 3단계 상태 렌더링
  2. `docs/rules/TICKETS.md`: #TASK-ES-134 티켓 등록
  3. `tests/smoke-test.js` (또는 무결성 테스트 스크립트): 현상태 분석 AI 조언 라벨 및 배지 검증 추가

---

## 2. 세부 작업 절차 (문제해결 8원칙 적용)
- [x] Step 1: 작업 브랜치 (`fix/2026-09-17-goal-ai-advice-caching-es134`) 생성
- [x] Step 2: REQ / PLAN 명세서 작성
- [ ] Step 3: `index.html` 내 AI 조언 UI 및 캐시/뱃지 로직 수정
- [ ] Step 4: 무결성 검증 테스트 (`npm test`) 통과 확인
- [ ] Step 5: 로컬 브라우저 수동 확인 (CDP 스크린샷 및 동작 검증)
- [ ] Step 6: `docs/rules/TICKETS.md` 및 `dev_log.md` 동기화
- [ ] Step 7: 로컬 메인 브랜치 병합 (4단계 완결) 및 Tri-Sync 동기화
- [ ] Step 8: 완료 보고 및 상민님 결심 대기
