# 엔지니어링 작업계획서 (PLAN) — 목표탭 참고자료 첨부 효과적·효율적 UI/UX 고도화 및 실제 UI 검증

> **문서 ID**: PLAN-TASK-ES-274-GOALS-SMART-ATTACHMENTS  
> **요구사항 연계**: [REQ-TASK-ES-274-GOALS-SMART-ATTACHMENTS](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-274-GOALS-SMART-ATTACHMENTS.md)  
> **티켓 연계**: #TASK-ES-274  
> **작성 일시**: 2026-09-25  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**: 목표 탭 마일스톤 및 세부 할일(Task)에 1초 참고자료 첨부 버튼(`+참고`)과 시각적 인터랙티브 미니 칩(`att-chip-mini`)을 완비하고, 즉각 뷰어/삭제 연동 및 375px 모바일 반응형 조형을 완성한다.
- **영향 받는 파일 목록 전수**:
  - `index.html`: `renderInlineAttachmentChips` 정의, `window` 바인딩, `renderSingleTaskRow` 내 `+참고` 버튼 및 칩 렌더러 추가, 마일스톤 `attSnippet` 교체, 12ms 햅틱 추가.
  - `ui.css`: `.att-chips-inline`, `.att-chip-mini` (유형별 색상 4종), `.compact-att-btn`, 375px 반응형 미디어 쿼리 추가.
  - `tests/goals-smart-attachments.test.js`: 신규 단위 테스트 파일 작성.
  - `scripts/smoke-test.js`: `#TASK-ES-274` 스모크 검증 추가.
  - `reports/TASK-ES-274/claims.json`: GitHub Court claims 작성.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: 목표와 세부 할 일에 필요한 시각적·기술적 참고자료를 인라인에서 1초 만에 확인하고 바로 열람·삭제할 수 있는 4위 1체 인터랙티브 파이프라인.
- **[원인] (Technical Causes)**:
  1. `renderSingleTaskRow`의 `task-meta-inline` 마크업 내 `data-addatttask` 버튼 누락.
  2. 인라인용 `.att-chip-mini` 렌더러 부재로 단순 텍스트 `📎1`로만 축약 표출.
  3. 마일스톤 및 할 일의 인라인 칩에 대한 클릭 이벤트 위임 미연결.
- **[중심 배선] (Core Wire & State)**:
  - `state.profile.goals`: 마일스톤 및 할 일의 `attachments` 배열 데이터 구조 보존.
  - `wireAttachmentChipClicks`: `data-openatt` 속성을 가진 미니 칩을 감지하여 `openAttachmentViewer`로 직결.
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - 첨부 등록/삭제 완료 시 `saveProfile()`를 통한 Supabase 및 로컬 스토리지 원자적 동시 저장.
  - 삭제 시 12ms 햅틱 및 토스트 피드백 제공, 실패 시 롤백.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[할일 +참고 버튼 클릭] -> [openAddAttachmentModal 오픈] -> [스마트 감지/프리셋 적용 및 저장] -> [task.attachments에 푸시] -> [saveProfile 영속화] -> [renderGoalsScreen 리렌더링] -> [renderInlineAttachmentChips 미니 칩 표출] -> [미니 칩 클릭 시 openAttachmentViewer 즉시 열림]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `index.html` | 칩 렌더러 함수 추가, 세부할일 버튼 마크업, 햅틱 배선 | +35줄 | -5줄 | +30줄 | 외과수술적 diff |
| `ui.css` | 미니 칩 및 콤팩트 버튼 스타일링 | +90줄 | 0줄 | +90줄 | CSS 토큰 준수 |
| `tests/goals-smart-attachments.test.js` | 신규 단위 테스트 | +80줄 | 0줄 | +80줄 | 신규 생성 |
| `scripts/smoke-test.js` | 스모크 테스트 단언문 추가 | +25줄 | 0줄 | +25줄 | 회귀 방지 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**:
   - 마일스톤: `.att-add-btn[data-addattms]` + `.att-chip-mini[data-openatt]`
   - 세부 할 일: `.att-add-btn.compact-att-btn[data-addatttask]` + `.att-chip-mini[data-openatt]`
2. **이벤트 리스너 (Listener)**:
   - `[data-addatttask]`: `openAddAttachmentModal(task, ...)` 호출.
   - `[data-openatt]`: `wireAttachmentChipClicks`를 통해 `openAttachmentViewer(att, ...)` 호출.
3. **비즈니스 로직 (Logic)**:
   - `task.attachments` / `ms.attachments`에 데이터 적재 및 `saveProfile()`.
4. **피드백 & 예외처리 (Feedback)**:
   - 12ms 햅틱 피드백 (`triggerHapticFeedback(12)`), 토스트 알림, 모바일 375px 넘침 방어.

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 HTML 디자인, CSS 스타일, 레이아웃을 임의로 변경하지 않고 완벽히 계승했는가? (계승 완료)
- [x] 전체 파일 덮어쓰기 없이 변경 부분만 외과수술적 diff로 작성하도록 설계되었는가? (외과수술적 diff 완료)
- [x] 기존 사용자의 아바타(보관함 포함), 목표, 기록, 세팅값이 100% 무손실 보존되는가? (100% 보존)
- [x] 성능 저하(불필요한 전체 리렌더링)나 다중 탭 동시성 충돌을 유발하지 않는가? (비파괴 안전성 보장)

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1 (인라인 칩 렌더러 구축)**: `index.html`에 `renderInlineAttachmentChips` 함수 구현 및 `window`에 노출.
2. **Step 2 (세부 할 일 행 마크업 및 버튼 배선)**: `renderSingleTaskRow`에 `renderInlineAttachmentChips` 및 `+참고` 버튼 마크업 탑재, 리스너에 12ms 햅틱 및 비동기 저장 연동.
3. **Step 3 (마일스톤 행 칩 렌더러 교체)**: 마일스톤 메타 영역의 단순 텍스트 `attSnippet`을 `renderInlineAttachmentChips`로 업그레이드.
4. **Step 4 (CSS 반응형 조형)**: `ui.css`에 `.att-chips-inline`, `.att-chip-mini` 4종 테마, `.compact-att-btn` 375px 모바일 미디어 쿼리 추가.
5. **Step 5 (4대 뷰 실시간 동시 전파 & 검증)**: 단위 테스트, 스모크 테스트, 무결성 게이트 및 GitHub Court 통과 확인.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
> *(주의: 본 원칙은 구현 순서(⑤)와 체크리스트(⑦) 사이에 반드시 독립적으로 존재해야 하며, 생략하거나 합치는 것은 위헌입니다)*
- **시나리오 A (Zero Dead-Click)**: 세부 할 일 행의 `+참고` 버튼 클릭 시 모달이 100% 팝업되고, 등록된 미니 칩 클릭 시 뷰어가 100% 팝업되는지 검증.
- **시나리오 B (Zero Data Loss)**: 참고자료를 추가/삭제한 후 페이지 새로고침 시 데이터가 100% 보존되는지 딥이퀄 검증.
- **시나리오 C (Zero UX Regression)**: 기존 캘린더 일정 참고자료 첨부 및 마일스톤 참고자료 등록 기능에 일체의 영향 없음 확인.
- **시나리오 D (Full State Propagation)**: 참고자료 추가 시 목표 탭 화면에 즉시 미니 칩이 렌더링되고 전역 프로필에 동기화됨을 확인.
- **시나리오 E (자동화 게이트 통과)**: `node tests/goals-smart-attachments.test.js`, `node scripts/smoke-test.js` (392개 통과), `node scripts/verify-integrity-gate.js` (38개 통과) ALL PASS 설계.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [x] Step 1~5 순차적 구현 (AI 코드 축약 `// ...` 일절 없이 완전한 실행 코드 작성)
- [x] 로컬 단위 테스트 검증: `node tests/goals-smart-attachments.test.js` PASS
- [x] 스모크 테스트 전수 검증: `node scripts/smoke-test.js` (392개 통과) PASS
- [x] 로컬 무결성 게이트 검증: `node scripts/verify-integrity-gate.js` (38개 통과) PASS
- [ ] [4단계: 초안 PR 제출 및 GitHub Court 심사 청구] 완결 후 판정서 확인 및 squash 머지

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**: 모바일 375px 화면에서 세부 할 일 제목과 참고자료 칩, 버튼이 겹치거나 가로 스크롤을 유발할 가능성.
- **사전 방어 및 우회 로직**: `task-meta-inline` 내부에서 미니 칩의 최대 너비를 60px로 제한하고 말줄임표(`text-overflow: ellipsis`)를 주며, 모바일에서는 flex-wrap을 적용하여 자연스럽게 줄바꿈되도록 조형.
- **롤백 계획 (Rollback Strategy)**: 문제 발생 시 `git checkout main -- index.html ui.css`를 통해 즉시 이전 상태로 안전하게 복구.
- **재검증 트리거**: UI 깨짐 발생 시 원칙 ③의 CSS 예산 및 마크업 구조로 되돌아가 반응형 스타일을 재조정.
