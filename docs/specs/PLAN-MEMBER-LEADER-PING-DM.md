# [작업계획서] 팀원-모임장 달성자랑/힘들어요 찌르기 및 1:1 DM 반응 시스템 구현

- **문서 번호**: PLAN-OURGOAL-2026-09-13-PING-DM
- **티켓 ID**: #TASK-ES-027
- **연관 요구사항 정의서**: REQ-OURGOAL-2026-09-13-PING-DM
- **본질 축**: E3 (동류 발견·소통) / E1 (체크인 루프 연계)
- **작성일자**: 2026-09-13
- **작성자**: 아워골 AI 엔지니어링 지휘팀 (Antigravity)
- **작업 방식**: `js/team-leader-check.js` 모듈 기능 확장 및 경량 index.html 바인딩

---

## 1. 구현 아키텍처 및 원칙

1. **독립 모듈 확장 원칙**:
   - `index.html`을 비대하게 만들지 않고, 이미 검증된 `js/team-leader-check.js` 모듈 내에 찌르기 데이터 모델, 렌더러, 모달 스위트를 일체 캡슐화.
2. **기존 DM 구조와의 조화**:
   - 모임 전용 1:1 대화 스레드를 `groupState[gid].dmThreads`에 안전하게 분리 보존.
3. **엄격한 스팸 쿨다운 방어**:
   - 동일 항목 및 팀원 간 찌르기 발송 시 60초 쿨다운 적용.

---

## 2. 단계별 구현 계획

### Step 1: `js/team-leader-check.js` API 확장
- `sendMemberPing(gid, targetInfo, pingType, message, deps)`: 찌르기 생성 및 로컬 저장.
- `getPingsForGroup(gid, deps)`: 모임 찌르기 목록 조회.
- `openSendPingModal(gid, targetInfo, deps)`: 팀원 찌르기 발송 모달.
- `openLeaderMemberDmModal(gid, memberName, pingId, deps)`: 모임장 1:1 DM 대화 바텀시트 모달.
- `renderLeaderPingsSectionHtml(g, deps)`: 모임장 대시보드 내 찌르기 알림 바 렌더러.
- `renderMemberPingButtonHtml(gid, targetType, targetId, title, isDone)`: 마일스톤 및 태스크 행 찌르기 버튼 렌더러.

### Step 2: `index.html` 경량 통합 배선
- 마일스톤 렌더러(`msHtml`) 및 세부할일 행에 `OurgoalTeamLeaderCheck.renderMemberPingButtonHtml(...)` 삽입.
- 모임장 대시보드 상단에 `OurgoalTeamLeaderCheck.renderLeaderPingsSectionHtml(g, deps)` 삽입.
- 이벤트 위임 핸들러에 `[data-openpingmodal]`, `[data-opendmmodal]` 추가.

### Step 3: 스모크 테스트 및 품질 검증
- `scripts/smoke-test.js`에 `#TASK-ES-027` 전용 테스트 2건 추가:
  1. `OurgoalTeamLeaderCheck`의 찌르기 및 DM API 무결성 검증.
  2. 찌르기 2종(`boast`, `struggle`) 분기 및 쿨다운 가드 검증.
- `npm test` 200개 테스트 전수 통과 확인.

### Step 4: 3자 동기화 및 PR 발행
- 옵시디언 볼트에 정본 적재 및 `tri-sync sync` 실행.
- GitHub PR 발행 및 CI 통과 확인.