# 엔지니어링 작업계획서 (PLAN) — 목표 탭 현상태 분석 AI 조언 문구 단일화 및 '진행 상황 분석 중…' 뱃지 상태 정상화 & 탭 전환 재분석 방지

> **문서 ID**: PLAN-TASK-ES-255-GOAL-AI-ADVICE-STATUS  
> **요구사항 연계**: [REQ-TASK-ES-255-GOAL-AI-ADVICE-STATUS](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-255-GOAL-AI-ADVICE-STATUS.md)  
> **티켓 연계**: #TASK-ES-255  
> **작성 일시**: 2026-09-25  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **상민님 지시 원문**:
  *"목표탭의 ‘ai현황’(최종결과 밑에 있는)을 ‘현상태 분석 ai 조언’으로 바꿔. 그리고 분석하여 결과를 보여주고도 진행상황 분석중… 안내가 계속 나타나있음. 분석할때만 띄우고 결과값 나오면 ‘분석완료’ 안내하도록 해 그리고 다른 창을 갔다가 다시 목표탭으로 돌아오거나"*
- **영향 받는 파일 목록 전수**:
  - `index.html`: `renderGoalDetailScreen` 뱃지 렌더링, `refreshGoalStatusSummary` 멱등성 가드, `window` 노출.
  - `tests/goal-ai-advice-status.test.js`: 신규 단위 테스트 스위트.
  - `scripts/smoke-test.js`: 회귀 방지 검증 단언문.
  - `reports/TASK-ES-255/claims.json`: 법정 클레임 검증서.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: `E1/UX` & `FIX` (목표 관리 핵심 경험 및 AI 조언 신뢰도 정상화).
- **[원인] (Technical Causes)**:
  - `index.html` line 21770의 `dateKey !== todayKST` 조건으로 인해 데이터 변경이 없어도 날짜가 바뀌면 stale 처리됨.
  - `else if(goalStatusStale)`에서 기존 결과 텍스트가 캐시에 존재함에도 뱃지를 "진행 상황 분석 중…"으로 덮어씀.
  - 스니펫 플레이스홀더에 '탭하여 AI 종합현황 보기' 레거시 문구 잔존.
- **[중심 배선] (Core Wire & State)**:
  - `state.profile.settings.goalStatusSummaries[goal.id]`: 캐시된 AI 조언 및 해시/일자 보존.
  - `state.goalStatusPending[goal.id]`: 실시간 분석 진행 여부 플래그.
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - `refreshGoalStatusSummary` 내 멱등성 조기 반환 가드 (`existing && existing.text && existing.hash === hash`).
  - 예외 발생 시 에러 핸들링 및 기존 캐시 뱃지('분석완료') 보존.

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `index.html` | 뱃지 판정 로직, 멱등성 가드, 문구 단일화 | +20줄 | -5줄 | +15줄 | 외과수술적 diff |
| `tests/goal-ai-advice-status.test.js` | 단위 검증 스위트 신설 | +150줄 | 0줄 | +150줄 | 단위 테스트 |
| `scripts/smoke-test.js` | 회귀 방지 단언문 추가 | +15줄 | 0줄 | +15줄 | 스모크 테스트 |

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 HTML 디자인, CSS 스타일, 레이아웃을 임의로 변경하지 않고 완벽히 계승했는가?
- [x] 전체 파일 덮어쓰기 없이 변경 부분만 외과수술적 diff로 작성하도록 설계되었는가?
- [x] 기존 사용자의 아바타(보관함 포함), 목표, 기록, 세팅값이 100% 무손실 보존되는가?
- [x] 성능 저하(불필요한 전체 리렌더링)나 다중 탭 동시성 충돌을 유발하지 않는가?

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1**: `index.html` 내 `renderGoalDetailScreen` 상태 뱃지 로직 개선 및 '현상태 분석 AI 조언' 단일화.
2. **Step 2**: `refreshGoalStatusSummary` 멱등성 가드 탑재 및 catch 블록 보강.
3. **Step 3**: `tests/goal-ai-advice-status.test.js` 단위 테스트 작성 및 통과 확인.
4. **Step 4**: `scripts/smoke-test.js`에 검증 단언문 추가.
5. **Step 5**: 헌법 5대 게이트 및 `reports/TASK-ES-255/claims.json` 작성.
6. **Step 6**: 커밋, 푸시, Draft PR 개설 및 GitHub Court 심사 청구.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
- **시나리오 A (Zero Dead-Click)**: 목표 탭 진입 및 아코디언 토글 클릭 시 에러 없이 부드럽게 펼침/접힘 동작 확인.
- **시나리오 B (Zero Data Loss)**: 목표 데이터 및 기존 `goalStatusSummaries` 캐시가 100% 보존됨을 확인.
- **시나리오 C (Zero UX Regression)**: 결과 캐시 존재 시 날짜 경과와 무관하게 초록색 '분석완료' 뱃지 즉시 표출 확인.
- **시나리오 D (Full State Propagation)**: 마일스톤 수정 시 해시 변경에 의해 '진행 상황 분석 중…'으로 전환 후 완료 시 '분석완료'로 동기화 확인.
- **시나리오 E (자동화 게이트 통과)**: `scripts/smoke-test.js` 373개 및 `verify-integrity-gate.js` 38개 100% ALL PASS 확인.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [x] Step 1~2 `index.html` 외과수술적 수정 완료.
- [x] Step 3 단위 테스트 `node tests/goal-ai-advice-status.test.js` ALL PASS.
- [x] Step 4 스모크 테스트 `node scripts/smoke-test.js` 373개 ALL PASS.
- [ ] Step 5 로컬 무결성 게이트 검증: `node scripts/verify-integrity-gate.js` PASS.
- [ ] Step 6 초안 PR 개설 및 GitHub Court 법정 심사 청구.

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**: Supabase 프로필 저장 지연 또는 네트워크 타임아웃 시 뱃지 고착 가능성.
- **사전 방어 및 우회 로직**: `catch` 블록에서 `isPending`을 즉각 해제하고 기존 캐시 텍스트가 있을 경우 '분석완료'로 복구.
- **롤백 계획 (Rollback Strategy)**: 변경 브랜치에서 `git checkout -- index.html`을 통해 즉각 이전 상태 복원 가능.
- **재검증 트리거**: 뱃지 전환 실패 시 원칙 ② 배선 및 `refreshGoalStatusSummary`의 `isPending` 플래그 수명 주기 재검토.
