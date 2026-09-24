# 엔지니어링 작업계획서 (PLAN) — 팀목표 200% 활용 가이드 안내문구 표시 ('* 팀 목표를 생성하면 사라짐')

> **문서 ID**: PLAN-TASK-ES-256-TEAM-GOAL-GUIDE-HINT  
> **요구사항 연계**: [REQ-TASK-ES-256-TEAM-GOAL-GUIDE-HINT](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-256-TEAM-GOAL-GUIDE-HINT.md)  
> **티켓 연계**: #TASK-ES-256  
> **작성 일시**: 2026-09-25  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **상민님 지시 원문**:
  > "팀목표에서 팀목표 200% 활용 가이드 오른쪽에 3포인트 작게 ‘* 팀 목표를 생성하면 사라짐’ 안내문구 표시하자."
- **영향 받는 파일 목록 전수**:
  - `index.html`: `renderTeamGoalsEmptyGuideHtml` 힌트 렌더링 확인 및 `window` 노출 보장.
  - `tests/team-goal-guide-hint.test.js`: 신규 독립 단위 테스트 스위트 작성.
  - `scripts/smoke-test.js`: #TASK-ES-256 검증 단언문 추가.
  - `reports/TASK-ES-256/claims.json`: 법정 클레임 검증서 작성.
  - `docs/rules/TICKETS.md`: #TASK-ES-256 티켓 등록.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: `[UI/UX & E3]` (온보딩 안내 시인성 최적화 및 375px 모바일 레이아웃 무결성).
- **[원인] (Technical Causes)**:
  - 과거 배치 작업 시 독립 단위 테스트 스위트 및 법정 심사 프로세스가 누락되어 노션 생각 메모장 [11]번이 정식 종결되지 못함.
- **[중심 배선] (Core Wire & State)**:
  - `renderTeamGoalsEmptyGuideHtml`: 가이드 카드 마크업 생성기.
  - `renderTeamGoalsScreen`: `myTeams.length === 0`일 때 empty guide 출력, 팀 존재 시 실제 팀 목표 뷰 전환.
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - 플렉스 컨테이너의 `flex-wrap: wrap` 및 `gap: 8px`로 375px 실기기 가로 오버플로우 방어.
  - `var(--ink-faint)` 토큰을 통한 다크/라이트 테마 자동 호환.

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `index.html` | 함수 window 노출 및 힌트 스타일 정밀화 | +5줄 | 0줄 | +5줄 | 외과수술적 diff |
| `tests/team-goal-guide-hint.test.js` | 신규 독립 단위 테스트 스위트 | +120줄 | 0줄 | +120줄 | 단위 테스트 |
| `scripts/smoke-test.js` | #TASK-ES-256 회귀 방지 단언문 | +15줄 | 0줄 | +15줄 | 스모크 테스트 |
| `docs/rules/TICKETS.md` | 티켓 등록 | +1줄 | 0줄 | +1줄 | 규범 문서 |
| `reports/TASK-ES-256/claims.json` | 법정 심사 클레임 | +30줄 | 0줄 | +30줄 | 심사 문서 |

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 HTML 디자인, CSS 스타일, 레이아웃을 임의로 변경하지 않고 완벽히 계승했는가?
- [x] 전체 파일 덮어쓰기 없이 변경 부분만 외과수술적 diff로 작성하도록 설계되었는가?
- [x] 기존 팀 목표 생성, 가입, 레벨별 목표, 댓글 등 팀 기능이 100% 무손실 보존되는가?
- [x] 375px 모바일 뷰포트에서 가로 스크롤 오버플로우를 유발하지 않는가?

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1**: `index.html` 내 `renderTeamGoalsEmptyGuideHtml` 함수 확인 및 `window.renderTeamGoalsEmptyGuideHtml` 노출 보장.
2. **Step 2**: `tests/team-goal-guide-hint.test.js` 단위 테스트 작성 및 통과 확인.
3. **Step 3**: `scripts/smoke-test.js`에 `#TASK-ES-256` 검증 단언문 추가.
4. **Step 4**: `docs/rules/TICKETS.md`에 `#TASK-ES-256` 티켓 등록.
5. **Step 5**: 전체 스모크 테스트(`smoke-test.js`) 및 헌법 게이트(`verify-integrity-gate.js`) 실행.
6. **Step 6**: `reports/TASK-ES-256/claims.json` 작성, 커밋, 푸시, Draft PR 생성 및 Court 심사 청구.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
- **시나리오 A (Zero Dead-Click)**: 가이드 카드 내부의 템플릿 퀵버튼(🏢 워크숍 TF, ✈️ 단체여행, 🏋️ 운동 크루) 클릭 시 정상 동작 확인.
- **시나리오 B (Zero Data Loss)**: 팀 목표 및 회원 상태 변경 없이 가이드 힌트 렌더링 무결성 확인.
- **시나리오 C (Zero UX Regression)**: 팀 생성 시 가이드가 즉시 사라지고 팀 목표 목록이 화면에 나타남을 확인.
- **시나리오 D (Full State Propagation)**: 다크/라이트 테마 전환 시 힌트 텍스트 시인성 유지 확인.
- **시나리오 E (자동화 게이트 통과)**: `scripts/smoke-test.js` 및 `verify-integrity-gate.js` 38개 100% ALL PASS 확인.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [x] Step 1 REQ/PLAN 명세서 완비.
- [ ] Step 2 `index.html` 렌더러 검증 및 window 노출.
- [ ] Step 3 단위 테스트 `node tests/team-goal-guide-hint.test.js` 통과.
- [ ] Step 4 스모크 테스트 374개 ALL PASS.
- [ ] Step 5 헌법 38대 게이트 `node scripts/verify-integrity-gate.js` 통과.
- [ ] Step 6 초안 PR 개설 및 GitHub Court 법정 심사 청구.

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**: 모바일 375px에서 flex 줄바꿈 시 제목과 힌트가 겹치는 현상.
- **사전 방어**: `display: flex; align-items: center; gap: 8px; flex-wrap: wrap;` 구조로 줄바꿈 여백 자동 보장.
- **롤백 계획 (Rollback Strategy)**: `git checkout -- index.html`을 통해 즉각 복원 가능.
- **재검증 트리거**: 모바일 뷰포트 레이아웃 깨짐 감지 시 flex 속성 및 margin 조정.
