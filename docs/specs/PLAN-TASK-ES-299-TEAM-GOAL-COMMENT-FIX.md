# 구현 계획서 (PLAN) — 팀 목표 댓글 작성 및 전송 기능 먹통 오류 수정

> **문서 ID**: PLAN-TASK-ES-299-TEAM-GOAL-COMMENT-FIX  
> **티켓 연계**: #TASK-ES-299  
> **작성 일시**: 2026-09-26  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. 개요 및 설계 방향
본 계획서는 노션 생각 메모장 DB [49]번 지시사항에 따라, **팀 목표 댓글 작성 및 전송 기능 먹통 오류를 원천 차단**하기 위해 `teamCommentsBlockHtml` 마크업 내 `data-gid` 보강, `document` 레벨 전역 이벤트 위임 리스너 추가, `sendTeamGoalComment` 직통 함수 배선, 12ms 햅틱, `og_task-49_cache` 원자적 영속화, 4대 뷰 동시 전파를 구현하기 위한 작업 절차를 정의합니다.

---

## 2. 세부 구현 단계

### Phase 1: 마크업 및 위임 리스너 보강 (`index.html`)
1. **`teamCommentsBlockHtml` 버튼 속성 보강**:
   - `[data-cmtsend]` 버튼에 `data-gid="'+gid+'"` 추가.
2. **홈 화면 허브 마운트**:
   - `#og-task-49-container` 및 `#og-task-49-action-btn` (data-ticket="49", onclick="handle팀목표_Item49Action(event)") 마운트.
3. **전역 위임 리스너 보강**:
   - `document.addEventListener('click')`에서 `[data-cmtsend]` 클릭을 감지하여 안전하게 `sendTeamGoalComment` 호출.

### Phase 2: 비즈니스 로직 및 4위 1체 배선 (`js/components.js`)
1. **`handle팀목표_Item49Action(event)` 구현**:
   - 12ms 햅틱 진동 피드백 발동.
   - `og_task-49_cache` 키로 로컬 스토리지에 원자적 동기화.
   - Supabase `user_interactions` 비동기 영속화.
   - 4대 뷰(`renderCalendar`, `renderGoalsScreen`, `renderHome`, `renderRecordsScreen`) 동시 호출.
   - 사용자 성공 안내 토스트 메시지 표출 ("팀 목표 댓글 전송 안전망이 정상 동기화되었습니다.").
2. **`sendTeamGoalComment(gid, targetId, text)` 함수 구현**:
   - 인풋 텍스트 추출 및 유효성 검사.
   - 낙관적 캐시 및 2중 영속화 안전망 가동.
   - 뷰 리렌더링 및 댓글창 열림 상태 보존.
3. **글로벌 및 모듈 export**:
   - `window.handle팀목표_Item49Action`, `window.sendTeamGoalComment`, `window.toggleTeamGoalCommentSection`.
   - `module.exports.handle팀목표_Item49Action`, `module.exports.sendTeamGoalComment`, `module.exports.toggleTeamGoalCommentSection`.

### Phase 3: 스타일 및 모바일 375px 반응형 최적화 (`ui.css`)
1. **`#og-task-49-container` & `#og-task-49-action-btn`**:
   - 일관된 카드 조형 디자인, 44px 터치 규격 확보.
2. **팀 댓글 입력창 및 등록 버튼**:
   - `.dm-input-row` 모바일 375px 패딩 최적화 및 등록 버튼 터치 영역 44px 확보.
3. **모바일 375px 가로 스크롤 0px 방어**:
   - `overflow-x: hidden` 및 입력창 100% 핏 보장.

### Phase 4: 테스트 작성 및 전수 검증
1. `tests/team-goal-comment-fix.test.js` 작성 및 통과 확인.
2. `scripts/smoke-test.js`에 `#TASK-ES-299` 단언문 추가 (417개 통과 확인).
3. `reports/TASK-ES-299/claims.json` 작성.
4. `npm run court:quick -- --head HEAD` 예비 점검.
5. GitHub PR 제출 및 Court 심사 완료 후 Squash 머지.
