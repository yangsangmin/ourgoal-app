# 엔지니어링 작업계획서 (PLAN) — 홈탭 최하단 <아워골 평가해주기> 고정배너 및 90% 팝업 평가폼

> **문서 ID**: PLAN-TASK-ES-268-APP-EVALUATION-MODAL  
> **요구사항 연계**: [REQ-TASK-ES-268-APP-EVALUATION-MODAL](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-268-APP-EVALUATION-MODAL.md)  
> **티켓 연계**: #TASK-ES-268 (노션 생각 메모장 [13]번, Page ID: `3dc598db-9096-8186-bff7-ffc1986ebe52`)  
> **작성 일시**: 2026-09-25  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**:
  - 홈 탭 최하단 고정 배너(#homeEvalBanner) 버튼 텍스트를 `<아워골 평가해주기>`로 정돈하고 나만의 홈 구성에서 숨겨지지 않는 불변 고정 배너로 확립.
  - 화면 90% 크기 대형 모달(#appEvaluationModal)과 5대 폼(종합점수 100점, 장점, 단점, 개선요청, 대표에게 하고싶은말 플레이스홀더) 완비.
  - Supabase `app_evaluations` 원장 적재 + 로컬 스토리지 2중 영속화 및 제출 후 감사 토스트.
- **영향 받는 파일 목록 전수**:
  - `index.html`: 배너 마크업 버튼 텍스트 `<아워골 평가해주기>` 정돈, 제출 핸들러 Supabase 적재 파이프라인 강화.
  - `ui.css`: `.eval-modal-sheet` 90vw / 90vh 규격 확정 및 모바일 375px 호환성 강화.
  - `tests/app-evaluation-modal.test.js`: 신규 단위 테스트.
  - `scripts/smoke-test.js`: `#TASK-ES-268` 단언 추가.
  - `reports/TASK-ES-268/claims.json`: 법정 청구서.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**:
  - 실제 사용자로부터 여과 없는 솔직한 개선 의견을 수집하여 제품을 지속해서 자가 치유하는 무공해 피드백 통로의 종단간(End-to-End) 배선.
- **[원인] (Technical Causes)**:
  - 배너 버튼 문구가 지시 원문과 부분적으로 차이가 있었고, Supabase 직접 적재 로직의 명시적 안정성이 더 강화될 필요가 있었음.
- **[중심 배선] (Core Wire & State)**:
  - `#btnOpenEvalModal` 클릭 ➔ `openAppEvaluationModal()`
  - `#btnSubmitAppEval` 클릭 ➔ 유효성 검사 ➔ `sb.from('app_evaluations').insert(...)` + 로컬 `state.profile.settings.appEvaluations` ➔ 토스트 표출 ➔ `closeAppEvaluationModal()`
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - Supabase 장애 시 로컬 스토리지에 무손실 저장 및 안내.
  - 375px 모바일 뷰포트에서 가로 넘침 0건 및 세로 스크롤 보증.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[홈 최하단 배너 클릭] -> [90% 대형 모달 오픈] -> [5대 항목 작성] -> [제출 클릭] -> [입력 검증] -> [Supabase app_evaluations + Local 저장] -> [감사 토스트 & 모달 닫힘]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `index.html` | 배너 버튼 텍스트 `<아워골 평가해주기>` 정돈 및 Supabase 적재 로직 강화 | +25줄 | -5줄 | +20줄 | 외과수술적 diff |
| `ui.css` | `.eval-modal-sheet` 90vw / 90vh 규격 확정 | +10줄 | -2줄 | +8줄 | CSS 규격 준수 |
| `tests/app-evaluation-modal.test.js` | 신규 단위 테스트 | +60줄 | 0줄 | +60줄 | 단위 테스트 |
| `scripts/smoke-test.js` | 스모크 테스트 단언 | +15줄 | 0줄 | +15줄 | 무결성 단언 |
| `reports/TASK-ES-268/claims.json` | 법정 청구서 | +90줄 | 0줄 | +90줄 | 규격 정본 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**: `#homeEvalBanner`, `#btnOpenEvalModal`, `#appEvaluationModal`, `#evalScoreInput`, `#evalProsInput`, `#evalConsInput`, `#evalImprovementsInput`, `#evalCeoMsgInput`, `#btnSubmitAppEval`, `#btnAppEvalClose`
2. **이벤트 리스너 (Listener)**: 클릭 시 모달 열기/닫기/제출 이벤트 바인딩.
3. **비즈니스 로직 (Logic)**: 점수(0~100) 및 내용 검증, `sb.from('app_evaluations').insert(...)` + `state.profile.settings.appEvaluations` 영속화.
4. **피드백 & 예외처리 (Feedback)**: 점수 범위 초과 시 경고, 제출 중 버튼 비활성화, 제출 완료 후 감사 토스트 및 모달 닫기.

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 HTML 디자인, CSS 스타일, 레이아웃을 임의로 변경하지 않고 완벽히 계승하는가?
- [x] 전체 파일 덮어쓰기 없이 변경 부분만 외과수술적 diff로 작성하도록 설계되었는가?
- [x] 기존 사용자의 아바타(보관함 포함), 목표, 기록, 세팅값이 100% 무손실 보존되는가?
- [x] 나만의 홈 구성 위젯 토글 설정과 충돌하지 않는가?

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1**: `index.html` 홈탭 배너 버튼 텍스트 `<아워골 평가해주기>`로 정돈 및 어포던스 강화.
2. **Step 2**: `index.html` 평가 제출 함수에 Supabase `app_evaluations` 직접 적재 파이프라인 보강.
3. **Step 3**: `ui.css` 내 `.eval-modal-sheet` 크기를 `width: 90vw; height: 90vh; max-height: 90vh;`로 확정하고 모바일 375px 호환성 보장.
4. **Step 4**: `tests/app-evaluation-modal.test.js` 작성 및 로컬 실행.
5. **Step 5**: `scripts/smoke-test.js` 단언 추가 및 전체 스모크 테스트(385개+), 헌법 게이트(38개) 100% 통과 확인.
6. **Step 6**: 법정 청구서 `reports/TASK-ES-268/claims.json` 작성 및 밸리데이션.
7. **Step 7**: 커밋, 푸시, GitHub Draft PR 생성, Ready for review, Court 심사 통과 및 squash 머지.
8. **Step 8**: Tri-Sync 완료 갱신 및 최종 보고.

---

## 6. [원칙 ⑥] 절차 재검증 (Verification Procedure)
- **단위 테스트**: `node tests/app-evaluation-modal.test.js` (PASS)
- **스모크 테스트**: `node scripts/smoke-test.js` (ALL PASS)
- **헌법 게이트**: `node scripts/verify-integrity-gate.js` (38개 ALL PASS)
- **GitHub Court**: `node court/chat.js <PR번호>` (success)

---

## 7. [원칙 ⑦] 안전핀 및 롤백 대책 (Rollback Strategy)
- 문제 발생 시 `git restore index.html ui.css`로 즉각 복원 가능.
- 기존 사용자의 `appEvaluations` 배열 구조와 100% 하위 호환.
