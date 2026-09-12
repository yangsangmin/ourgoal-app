# [작업계획서] 아워골 팀 목표 모임장-팀원 목표달성도 점검 시스템 구현

- **문서 번호**: PLAN-OURGOAL-2026-09-13-TG-CHECK
- **티켓 ID**: #TASK-ES-026
- **연관 요구사항 정의서**: REQ-OURGOAL-2026-09-13-TG-CHECK (docs/specs/REQ-TEAM-GOAL-MEMBER-PROGRESS.md)
- **본질 축**: E3 (동류 발견·소통) / E1 (체크인 루프)
- **작성일자**: 2026-09-13
- **작성자**: 아워골 AI 엔지니어링 지휘팀 (Antigravity)
- **작업 방식**: 점진적 컴포넌트 추가 및 무결성 실측 검증

---

## 1. 아키텍처 및 설계 원칙

1. **기존 구조 보존 및 무충돌 원칙**:
   - 기존 `renderTeamGoalsScreen`의 모임 필터, 공동 목표 마일스톤, 조별 목표 관리(`levelSectionHtml`), 댓글 기능(`teamCommentsBlockHtml`)을 100% 보존하며 그 상단에 모임장 전용 '팀원 달성도 점검 블록'을 자연스럽게 융합.
2. **실데이터 기반 렌더링 (금지 6-1 준수)**:
   - 더미 인원이나 고정 랭킹을 표시하지 않고, `g.members` 및 실제 체크인 기록(`checkins`), 모임별 로컬 상태(`groupState[gid]`)의 실제 데이터를 기반으로 지표 연산.
3. **가벼운 Vanilla JS & 기존 UI CSS 재사용**:
   - 신규 CSS 파일을 늘리지 않고 기존 `ui.css`의 검증된 클래스(`.card`, `.group-bar`, `.dday-pill`, `.streak-pill`, `.btn`, `.modal-sheet`, `.tag`)와 인라인 스타일을 적극 활용하여 번들 사이즈 및 스타일 충돌 방지.
4. **오프라인-퍼스트 & 클라우드 실시간 동기화**:
   - `saveProfile()` 및 `state.profile.settings.groupState[gid]`에 낙관적 즉각 반영 후, Supabase Realtime을 통해 모임원 기기 간 양방향 푸시 수신.

---

## 2. 단계별 구현 절차 (Implementation Phases)

### Phase 1: 데이터 모델 및 헬퍼 함수 배선 (Data Layer)
- **작업 1-1: 팀원 달성도 집계 헬퍼 `calcGroupMembersProgress(gid)` 구현**
  - 모임 가입 멤버 목록 순회.
  - 각 멤버의 당일 체크인 여부(`todayCheckedIn`), 최근 체크인 일시, 마일스톤 완료율, 연속 스트릭 계산.
  - 팀 전체 통계(총원, 오늘 완료자 수, 완료율 %, 평균 달성률 %, 집중케어 대상자 수) 반환.
- **작업 1-2: 로컬 상태 초기화 및 캐시 구조 확장**
  - `groupState(gid).memberProgress` 및 `groupState(gid).leaderStamps` 기본값 안전 초기화 (`|| {}`).

### Phase 2: 모임장 전용 대시보드 및 컨트롤러 UI 렌더링 (View Layer)
- **작업 2-1: 모임장 요약 KPI 바 `renderLeaderCheckDashboardHtml(g, summary)` 구현**
  - `canManageTeamGoals(g.id)` 게이트 통과 시 렌더링.
  - 4단 통계 그리드 (팀원 수, 오늘 인증 완료율, 평균 진척도, 집중 케어 인원).
- **작업 2-2: 다차원 필터 칩 바 `renderMemberFilterBarHtml(g.id, currentFilter)` 구현**
  - [전체 | 오늘 완료 | 미인증 | 집중 케어] 필터 칩 렌더링.
  - 클릭 시 `state.teamMemberFilter = filterType` 반영 및 리렌더링.
- **작업 2-3: 팀원별 달성도 카드 리스트 `renderMemberProgressListHtml(g, members, filter)` 구현**
  - 팀원 프로필, 진행률 바, 오늘의 인증 뱃지, 스트릭 뱃지.
  - 인증 완료자: 모임장 도장 부여 버튼 또는 기부여 도장 뱃지.
  - 미인증자: 1초 독려 넛지(응원) 버튼.
  - 카드 우측 '상세보기' 버튼 배치.

### Phase 3: 인터랙션 및 모달 스위트 구현 (Interaction Layer)
- **작업 3-1: 확인 도장 부여 이벤트 핸들러 `handleApplyLeaderStamp(gid, memberId, stampType)`**
  - 도장 4종(완벽해요, 폭풍성장, 참잘했어요, 힘내요) 퀵 팝오버/버튼 클릭 처리.
  - 햅틱 진동 `hapticFeedback()` 호출 + 도장 파티클 애니메이션.
  - 로컬 `groupState` 업데이트 및 `saveProfile()`.
  - Supabase `team_leader_checkoffs` 테이블 비동기 upsert.
- **작업 3-2: 1초 독려 넛지 이벤트 핸들러 `handleSendLeaderNudge(gid, memberId)`**
  - 미인증 멤버 대상 넛지 발송.
  - 당일 발송 여부 확인(쿨다운 가드).
  - 토스트 피드백: 'ㅇㅇㅇ님에게 응원의 넛지를 보냈어요!'
  - Supabase `team_leader_nudges` 비동기 적재.
- **작업 3-3: 팀원 상세 점검 바텀시트 모달 `openMemberProgressDetailModal(gid, memberId)` 구현**
  - `openModal()` 기반 반응형 바텀시트.
  - 오늘 인증 사진(있을 경우 이미지 프리뷰) 및 일지 전문 표시.
  - 팀원의 마일스톤 및 할 일 체크리스트 상세 표시.
  - 모임장 1:1 피드백 입력창 및 전송 버튼 연동.

### Phase 4: 모임원 뷰(Member View) 피드백 노출 (Feedback Loop Layer)
- **작업 4-1: 일반 멤버 팀 목표 화면 내 '모임장 피드백' 알림 카드**
  - 내게 부여된 모임장의 확인 도장 및 1:1 피드백이 있을 경우 팀 목표 카드 최상단에 하이라이트 배너 노출.
  - E1 체크인 루프와 즉시 연결되는 긍정적 강화 피드백 실현.

### Phase 5: 스모크 테스트 및 무결성 검증 (Verification Layer)
- **작업 5-1: 메인 스크립트 문법 검사 (`node -e "new Function(...)"`)**
- **작업 5-2: 스모크 테스트 케이스 신설 (`scripts/smoke-test.js`)**
  - 팀원 달성도 집계 함수 무결성 테스트.
  - 모임장 권한 게이트 및 도장 상태 데이터 검증.
- **작업 5-3: 브라우저 실환경 스모크 렌더링 확인**

---

## 3. 세부 파일별 변경 계획 (File Level Plan)

| 파일 경로 | 작업 유형 | 주요 변경 내용 |
| :--- | :---: | :--- |
| `docs/specs/REQ-TEAM-GOAL-MEMBER-PROGRESS.md` | [NEW] | 모임장의 팀원 목표달성도 점검 시스템 요구사항 정의서 정본 |
| `docs/specs/PLAN-TEAM-GOAL-MEMBER-PROGRESS.md` | [NEW] | 단계별 구현 작업계획서 정본 (본 문서) |
| `docs/rules/TICKETS.md` | [MODIFY] | #TASK-ES-026 본질 티켓 추가 및 체감 가설 명시 |
| `.codex/작업계획서/b5fa17fa.md` | [MODIFY] | 세션 작업계획서 체크리스트 실시간 진행률 갱신 |
| `.task-links/b5fa17fa.json` | [MODIFY] | phase를 '검증' 및 '완료'로 순차 갱신 후 task-link sync |
| `index.html` (향후 구현 시) | [MODIFY] | 팀 목표 탭 내 점검 대시보드, 팀원 카드, 도장/넛지/모달 렌더러 삽입 |
| `scripts/smoke-test.js` (향후 구현 시) | [MODIFY] | #TASK-ES-026 관련 스모크 테스트 케이스 2건 추가 |

---

## 4. 리스크 관리 및 롤백 계획 (Rollback & Risk Management)

- **UI 복잡도 증가 리스크**:
  - 팀 목표 화면이 너무 길어지는 것을 방지하기 위해 기본값으로 상단 '요약 KPI'를 노출하고, 팀원 리스트는 '접기/펼치기' 토글 또는 필터 칩으로 압축 제어.
- **다중 기기 동시성 충돌**:
  - `groupState[gid]` 갱신 시 `saveProfile()`의 기존 로컬 머지 정책을 유지하여 다른 세션의 갱신 데이터를 덮어쓰지 않도록 보호.
- **롤백 절차**:
  - 만약 예기치 않은 회귀가 발생할 경우 git 브랜치 격리를 통해 이전 커밋으로 즉각 안전 롤백 가능.

---

## 5. 검증 체크리스트 (Verification Checklist)
- [ ] 문서 정본 2종(REQ, PLAN) 작성 및 일관성 검토 완료
- [ ] 옵시디언 볼트 3자 동기화(Tri-Sync) 적재 및 해시 무결성 검증
- [ ] task-link.js sync 및 check 정상 통과
- [ ] TICKETS.md 내 본질 축(E3/E1) 및 승인 규범 충족 확인