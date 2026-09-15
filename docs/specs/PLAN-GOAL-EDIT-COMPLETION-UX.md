---
notion_id: "3dc598db-9096-8184-b55a-f441ce4f02f0"
---

# 실행 계획서: 목표 탭 편집 모드 완료 버튼 누락 해결 및 직관적 편집·완료 UX 구축

> **문서 ID**: PLAN-GOAL-EDIT-COMPLETION-UX  
> **티켓 ID**: #TASK-ES-109  
> **기반 규격**: [REQ-GOAL-EDIT-COMPLETION-UX](file:///C:/dev/ourgoal-app/docs/specs/REQ-GOAL-EDIT-COMPLETION-UX.md)  
> **본질 축**: FIX (버그 및 UX 결함 수정) / E1 (체크인 및 목표 관리 루프)  
> **작성일**: 2026-09-16  
> **작성자**: Antigravity (Pair Programmer)  

---

## 1. 중심 배선(Wire) 식별 (문제해결 8원칙 ②)

1. **상단 완료 토글 배선 (`#goalEditToggle`, `#teamGoalEditToggle`, `#btnToggleTlEdit`)**:
   - 편집 모드 시 `editBtn.textContent = '✓ 편집 완료'`, `btn btn-primary` 클래스 적용하여 시인성 300% 향상.
2. **목표 제목(Title) 인풋 배선 (`#goalTitleInput`)**:
   - 개인 목표 편집 모드 최상단에 목표 제목 편집 필드 삽입.
   - `input` 및 `change` 이벤트 바인딩 + 완료 시 최신 값 즉시 반영.
3. **하단 인라인 완료 버튼 배선 (`#btnGoalEditDoneInline`)**:
   - 마일스톤 목록 바로 아래 `+ 마일스톤 추가` 버튼과 함께 `[✓ 편집 완료]` 버튼 배치.
4. **하단 고정 플로팅 완료 액션바 배선 (`#goalEditFloatingBar`)**:
   - 화면 하단(`bottom: 74px`)에 떠 있는 반응형 플로팅 완료 바.
   - 문구: `✏️ 목표 편집 중` + 버튼: `[✓ 편집 완료]`.
   - 클릭 시 모든 미반영 입력값 자동 확정 -> `saveProfile()` -> 편집 모드 종료 -> 토스트 출력.
5. **팀 연계 개인목표 및 팀 목표 뷰 연동**:
   - `js/team-linked-goals.js`: 팀 연계 개인목표 편집 모드 시 하단 인라인 및 플로팅 완료 버튼 배선.
   - `index.html`: 팀 목표 편집 모드 시 하단 완료 버튼 배선.

---

## 2. 파일별 Before / After 및 변경 예산 (문제해결 8원칙 ③)

### 2.1 `index.html` (약 70줄 추가/수정)
- **Before**:
  - `editBtn.textContent = state.goalEditMode ? '완료' : '편집';`
  - 목표 제목 수정 input 없음.
  - 마일스톤 목록 하단에 완료 버튼 없음.
  - 플로팅 완료 바 없음.
- **After**:
  - `editBtn.textContent = state.goalEditMode ? '✓ 편집 완료' : '편집';` 및 스타일 강조.
  - 편집 모드 시 `#goalTitleInput` 렌더링 및 `goal.title` 양방향 바인딩.
  - 마일스톤 목록 하단 인라인 `#btnGoalEditDoneInline` 버튼 추가.
  - 편집 모드 시 `#goalEditFloatingBar` 렌더링 및 클릭 이벤트 핸들러(강제 blur, 프로필 저장, 토스트, 재렌더링).
  - 팀 목표 편집 모드 시 하단 완료 버튼 추가.

### 2.2 `js/team-linked-goals.js` (약 25줄 추가/수정)
- **Before**:
  - 상단 `#btnToggleTlEdit` 토글만 존재, 하단 완료 버튼 없음.
- **After**:
  - 마일스톤 목록 하단에 `[✓ 연계 목표 편집 완료]` 버튼 추가 및 이벤트 바인딩.

### 2.3 `ui.css` (약 35줄 추가)
- `.goal-edit-floating-bar`: 고정 하단 플로팅 바 스타일 (반응형 모바일 뷰 최적화, 부드러운 그림자, 브랜드 컬러).
- `.edit-toggle.on`: 브랜드 컬러 액센트로 강조된 토글 스타일.

---

## 3. 구현 상세 순서 (문제해결 8원칙 ⑤)
1. `ui.css`에 플로팅 완료 바 및 편집 모드 강조 스타일 정의.
2. `index.html` 내 `renderGoalsScreen` 함수에 목표 제목 편집 필드, 인라인 완료 버튼, 플로팅 바 추가.
3. `commitAndFinishGoalEdit` 헬퍼 함수를 구현하여, 완료 버튼 클릭 시 모든 활성 input의 값을 안전하게 수집하고 `saveProfile()` 호출 및 편집 모드를 해제하도록 일원화.
4. `index.html` 내 `renderTeamGoalsScreen` 함수에 하단 완료 버튼 배선.
5. `js/team-linked-goals.js` 내 팀 연계 개인목표 렌더러에 하단 완료 버튼 배선.
6. `docs/rules/TICKETS.md`에 #TASK-ES-109 등록.
7. `.task-links/66a84d16.json` 생성 및 Tri-Sync 동기화.

---

## 4. 5대 무결성 검증 시나리오 (문제해결 8원칙 ⑥)
1. **전수 클릭 무결성**: 상단 완료 버튼, 하단 인라인 완료 버튼, 플로팅 완료 버튼 모두 클릭 시 콘솔 에러 없이 정상 작동하는지 확인.
2. **데이터 무손실 보존**: 목표 제목, 마일스톤 제목, 마감일, 할 일 등을 수정한 후 완료 버튼을 눌렀을 때 `state.profile.goals` 및 localStorage에 100% 영속화되는지 확인.
3. **화면 간 전파 검증**: 목표 제목 수정 후 완료 시, 칩 목록 및 홈 탭/기록 탭의 목표 제목이 즉시 변경되는지 확인.
4. **회귀 방지**: `npm test` 및 `verify-integrity-gate.js` 100% 통과 (0 failure).

---

## 5. 체크리스트 (상한선 원칙 엄수: 4단계까지만 등록)
- [ ] 1. TICKETS.md 및 작업 연계/동기화 문서 등록
- [ ] 2. `ui.css` 스타일 및 `index.html` 목표 편집 완료 배선 구현
- [ ] 3. `js/team-linked-goals.js` 팀 연계 목표 완료 버튼 배선
- [ ] 4. 자동화 테스트 및 무결성 게이트(`npm test`) 100% PASS
- [ ] 5. [3단계: 로컬 수동 확인] 브라우저 상에서 편집 -> 완료 플로우 실동작 검증
- [ ] 6. [4단계: 로컬 메인 병합 및 5A 프리뷰 배포] 로컬 main 병합 및 Vercel 프리뷰 배포 실행 후 정지
