# 엔지니어링 작업계획서 (PLAN) — [UI/UX 틀 개편 완결 대장 등재] 아워골 UI/UX 프레임워크 8대 실행 단계(전수 64대 과업) 전원 머지 공식 등재

> **문서 ID**: PLAN-TASK-UIUX-FRAMEWORK-SYNC  
> **요구사항 연계**: [REQ-TASK-UIUX-FRAMEWORK-SYNC](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-UIUX-FRAMEWORK-SYNC.md)  
> **티켓 연계**: #TASK-UIUX-FRAMEWORK-SYNC  
> **작성 일시**: 2026-10-02  
> **작성자**: Antigravity (Advanced Agentic Pair-Programmer)  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**: Phase 7 PR #622 머지 완료 상태를 `docs/rules/TICKETS.md`에 공식 등재하고 아워골 UI/UX 프레임워크 8대 실행 단계(전수 64대 과업) 완결 상태를 확정.
- **영향 받는 파일 목록 전수**:
  - `docs/rules/TICKETS.md`: 티켓 상태 등록
  - `reports/TASK-UIUX-FRAMEWORK-SYNC/claims.json`: 법정 주장서 파일 생성

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: 본질 승인 대장과 실제 깃허브 머지 상태 간의 100% 무결 정합.
- **[원인] (Technical Causes)**: PR #622 머지 이후 대장 미등재 해소.
- **[중심 배선] (Core Wire & State)**: `docs/rules/TICKETS.md` 티켓 상태 동기화.
- **[핵심 안전장치] (Critical Safety & Persistence)**: 기존 코드 일체 불파괴.

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `docs/rules/TICKETS.md` | 티켓 상태 등록 | +3줄 | -1줄 | +2줄 | 문서 업데이트 |
| `reports/TASK-UIUX-FRAMEWORK-SYNC/claims.json` | 법정 심사 주장서 | +35줄 | 0줄 | +35줄 | 정본 생성 |

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 HTML 디자인, CSS 스타일, 레이아웃을 임의로 변경하지 않고 완벽히 계승했는가?
- [x] 전체 파일 덮어쓰기 없이 변경 부분만 외과수술적 diff로 작성하도록 설계되었는가?
- [x] 기존 사용자의 아바타(보관함 포함), 목표, 기록, 세팅값이 100% 무손실 보존되는가?
- [x] 성능 저하(불필요한 전체 리렌더링)나 다중 탭 동시성 충돌을 유발하지 않는가?

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. `docs/rules/TICKETS.md` 수정 완료.
2. `reports/TASK-UIUX-FRAMEWORK-SYNC/claims.json` 생성.
3. 로컬 5대 테스트 전수 검증.
4. GitHub PR 생성 및 법정 심사 청구.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
- 시나리오 A: Dead Click 0건 유지 (942개 버튼)
- 시나리오 B: 데이터 무손실 100%
- 시나리오 C: 800줄 이하 모듈러 검증 100%
- 시나리오 D: 스모크 테스트 440개 100% PASS
- 시나리오 E: Tri-Sync 정합 100%

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [x] `docs/rules/TICKETS.md` 수정
- [ ] 로컬 무결성 게이트 검증: `node scripts/verify-integrity-gate.js` PASS
- [ ] 전수 클릭 검증: `node scripts/verify-all-clicks.js` PASS
- [ ] 모듈러 조선소 테스트: `node scripts/test-shipyard-modular.js` PASS
- [ ] 스모크 테스트 전수 검증: `node scripts/smoke-test.js` PASS
- [ ] 3자 동기화 검증: `node C:/dev/command-center/lib/tri-sync.js check` PASS
- [ ] GitHub PR 생성 및 법정 심사 청구

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**: 없음.
- **롤백 계획 (Rollback Strategy)**: 변경사항 격리 커밋을 통해 즉각 복원 가능.
- **재검증 트리거**: court 검사 결과 확인 후 이상 시 즉각 조치.
