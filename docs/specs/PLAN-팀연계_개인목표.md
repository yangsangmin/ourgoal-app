# [PLAN] 아워골 팀 연계 개인목표 및 상호 달성도 체크·소통 시스템 구현 계획서

- **문서 ID**: PLAN-TEAM-LINKED-PERSONAL-GOALS
- **작성일**: 2026-09-16
- **작성자**: Antigravity (Gemini)
- **우선순위**: P0
- **관련 규격**: `docs/specs/REQ-팀연계_개인목표.md`
- **준수 헌법**: 아워골 최고 헌법 11대 조문 (제5조 계획서 수립, 제6조 무축약, 제7조 4위1체, 제14조 마감 상한선)

---

## 1. 중심 배선 (Core Wiring)
1. **서브탭 확장**:
   - `goalsSubtabs` 내 `['personal','개인 목표'], ['teamLinked','팀 연계 개인목표'], ['team','팀 목표']` 3개 서브탭 구성.
2. **독립 뷰 분리**:
   - `personalGoalsView` (순수 개인 목표)
   - `teamLinkedGoalsView` (신규: 팀 연계 개인목표 전용 워크스페이스)
   - `teamGoalsView` (팀 목표 대시보드)
3. **원클릭 복제 & 참가 배선 (`copyTeamGoalToPersonalLinked`)**:
   - 팀 목표에서 `data-copyteamgoal="groupId:teamGoalId"` 클릭 시 트리거.
   - 대상 팀 목표의 제목, 카테고리, 마일스톤, 할일을 새 고유 ID를 부여하여 Deep Copy.
   - `teamLinked: true`, `teamGoalId`, `groupId`, `groupName` 메타데이터 삽입.
   - `groupState(groupId).teamGoalParticipants[teamGoalId]`에 참가자 레코드 등록.
   - `state.profile.goals`에 추가 후 `saveProfile()`.
4. **팀 연계 개인목표 워크스페이스 (`renderTeamLinkedGoalsScreen`)**:
   - 연계된 목표들 간 전환 칩바.
   - 상단 "🏢 [모임명] > [목표명] 연계 로드맵" 뱃지 + "팀 목표 원본 보기" 버튼.
   - 마일스톤 달성 상태 순환 토글, 세부 할일 Done 토글, 나만의 세부 할일 추가/삭제.
   - 조작 시 실시간 달성률 자동 계산 및 팀 목표 참가자 데이터 동기화.
5. **팀 목표 카드 내 참가자 상호 체크 & 3대 상호작용 배선**:
   - 각 팀 목표 카드 하단에 `👥 참가 팀원 달성 현황` 섹션.
   - 참가자별 아바타, 이름, 진행률 Bar, 달성 마일스톤 수 표시.
   - **⚡ 찌르기 (Nudge)**: `data-tgpnudge="userId:userName"` -> 응원 토스트 및 넛지 저장.
   - **💬 댓글**: `data-tgpcmt="teamGoalId"` -> 해당 목표 댓글창 스크롤 및 포커스.
   - **✉️ DM**: `data-tgpdm="userId:userName"` -> 1:1 대화 모달 즉시 실행.

---

## 2. 파일별 변경 계획 및 Before / After

### 1) `index.html`
- **Before**: 서브탭이 2개(personal, team)이며 `personalGoalsView`와 `teamGoalsView`만 존재.
- **After**:
  - 서브탭 3개로 확장(`teamLinked` 추가).
  - `<div id="teamLinkedGoalsView" style="display:none;"></div>` 마크업 추가.
  - 기존 개인 목표 렌더링 시 `!g.teamLinked` 필터링 적용.
  - `renderTeamLinkedGoalsScreen()` 신규 구현.
  - `copyTeamGoalToPersonalLinked(gid, tgid)` 신규 구현.
  - `renderTeamGoalsScreen()`에 참가 버튼, 참가 팀원 달성도 UI 및 3대 상호작용(찌르기/댓글/DM) 배선.

### 2) `scripts/smoke-test.js`
- **Before**: 팀 목표 관련 기존 스모크 테스트 유지.
- **After**:
  - `compliance: [#TASK-ES-TLG] 팀 연계 개인목표 서브탭, 복사 참가, 독립 관리 및 팀 목표 상호체크·소통 시스템 검증` 테스트 블록 추가.

---

## 3. 5대 무결성 검증 시나리오
1. **Zero Dead-Click**:
   - '팀 연계 개인목표' 탭 클릭 시 정상 뷰 전환.
   - '팀 연계 개인목표로 복사하며 참가' 버튼 클릭 시 즉시 복제 및 탭 전환.
   - 세부 할일 체크박스, 마일스톤 토글, 할일 추가 버튼 클릭 시 정상 동작.
   - 찌르기(Nudge), 댓글 포커스, DM 버튼 클릭 시 정확한 피드백 및 모달 오픈.
2. **Zero UX Regression**:
   - 기존 '개인 목표' 탭에서의 목표 추가, 순서 변경, 삭제 등이 100% 동일하게 정상 작동.
   - 기존 '팀 목표' 탭의 팀장/팀원 기능(댓글, 마일스톤 접기, 모임 필터 등) 정상 작동.
3. **Zero Data Loss**:
   - `scripts/verify-integrity-gate.js` 페르소나 10종 딥이퀄 검증 100% 통과.
4. **Full State Propagation**:
   - 팀 연계 목표에서 할일을 체크하면 팀 목표 화면의 '참가 팀원 현황'에 달성률(%)이 실시간으로 즉시 반영.
5. **Technical Spec PASS**:
   - `npm test` 236개 이상 테스트 100% 통과 (0 failures).

---

## 4. 작업 체크리스트 (헌법 제14조 5항에 따른 4단계 상한선 준수)
- [ ] 1. 작업계획서 및 컨트롤타워 연계 등록
- [ ] 2. `index.html` 내 서브탭 및 `teamLinkedGoalsView` 마크업/스타일 배선
- [ ] 3. `index.html` 내 `copyTeamGoalToPersonalLinked` 원클릭 복사 참가 로직 구현
- [ ] 4. `index.html` 내 `renderTeamLinkedGoalsScreen` 독립 관리 화면 구현
- [ ] 5. `index.html` 내 팀 목표 카드 '참가 팀원 달성 현황' 및 찌르기/댓글/DM 배선
- [ ] 6. `scripts/smoke-test.js` 자동화 검증 스위트 추가
- [ ] 7. [2단계: 내부 시뮬레이션] `npm test` 및 무결성 게이트 검증
- [ ] 8. [3단계: 로컬 수동 확인] 로컬 브라우저 UI/UX 완벽 검증
- [ ] 9. [4단계: 로컬 메인 병합 및 5A 프리뷰 배포] 로컬 main 브랜치 병합 및 Vercel 프리뷰 배포 완결
