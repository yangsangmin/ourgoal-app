# 요구사항 정의서 (REQ) — 팀목표 시인성 개선, 아코디언 및 통합/목표별 수준관리 분리

> **문서 ID**: REQ-TASK-ES-258-TEAM-GOALS-LEVEL-MANAGEMENT  
> **티켓 연계**: #TASK-ES-258 (노션 생각 메모장 [14]번 완결)  
> **작성 일시**: 2026-09-25  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**:
  > *"팀 목표 시인성을 개선해야해. 한개 팀 목표에서 한번에 노출되는 정보량이 너무 많아. 팀 수준별 목표관리도 아코디언으로 하고, 공동 팀 목표도 최초 목표탭 진입시 팀별 한개만 노출되게해. 그리고 팀 수준별 목표관리는 동일 팀의 목표가 여러개면 그 목표에 따라 수준이 다를 수 있으니 팀의 목표별로 수준관리를 따로 할 수 있게 해야해. ‘팀 통합 수준관리’와 ‘목표별 수준관리’로 나눠서 작동하게 하고 시인성, 피로감까지 고려해서 정착시켜야해. 작업 시작 전에 구체적인 구현방법 보고해봐."*
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  1. 팀 카드 한 장 안에 공동 팀 목표 전체, 전 마일스톤, 할 일, 댓글창, 수준별 목표 조들이 수직으로 일괄 렌더링되어 극심한 스크롤과 시각적 과밀(Visual Clutter)을 유발함.
  2. 한 팀 안에서 여러 개의 목표를 운영할 때, 각 목표의 성격(예: 단기 스프린트 vs 장기 습관)에 따라 수준별 조의 기준이 달라야 함에도 단일 조 목록으로만 관리되어 현실적인 운영이 어려움.
  3. 마일스톤이나 세부 할 일, 수준별 관리의 접힘/펼침 상태가 세션 간에 영구 보존되지 않아 화면 이동 후 재진입 시 상태가 초기화되는 피로감이 있음.
- **기저 층위 심층 분석**:
  - **1층 (인지 과부하 및 피로감)**: 사용자가 앱에 들어왔을 때 지금 당장 실천할 대표 목표 1개에 집중하지 못하고 수많은 정보에 압도당함.
  - **2층 (목표-수준 간 스코프 결속 부재)**: '팀 전체 공통 수준'과 '개별 목표 전용 수준'의 2계층 데이터 스키마 분리가 요구됨.
  - **3층 (상태 원장화 미흡)**: 아코디언의 접힘/펼침 세팅이 유저 프로필 원장(`state.profile.settings`)에 안전하게 저장되어야 함.
- **대상 사용자 페르소나 및 발생 상황**:
  - 러닝, 스터디, 자격증, 프로젝트 등 팀 목표를 개설하고 팀원들과 함께 실천하는 모든 사용자 및 팀 리더/매니저.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: `[E3]` (동류 소통 루프 및 무공해 연대)
- **[가목] 본질 (Essence)**:
  1. **무공해성 (Anti-Pollution)**: 정보 과밀과 자극적인 UI 피로를 제거하고, 정갈하고 컴팩트한 목표 카드로 심리적 안정감 제공.
  2. **RPG식 체감 (Immediate Self-Efficacy)**: 대표 목표 1개에 집중하여 오늘 실천할 마일스톤/할 일을 명확히 인지하고 달성률을 즉각 체감.
  3. **동류 연대 (Peer Accompaniment)**: 조별 맞춤형 목표(A조, B조)를 통해 수준이 다른 팀원들도 박탈감 없이 함께 성장하는 동류 연대 확립.
- **[나목] 원인 (Root Causes)**:
  - 1개 카드 내 모든 목표와 마일스톤을 일괄 펼쳐서 렌더링하던 레거시 뷰 구조.
  - 수준별 관리 데이터가 목표(`teamGoals[i]`)와 1:1로 결속되지 않고 팀(`group`) 레벨에만 머물러 있던 스키마 한계.
- **[다목] 중심 (Core Bottleneck)**:
  - `OurgoalTeamVisibilityLevels.renderTeamCardContent`: 대표 1개 목표 선별 렌더링, 상단 칩 스위처, 2계층 아코디언, 듀얼 세그먼트 스위처 및 복사 엔진의 완전 배선.
- **[라목] 핵심 (Critical Anchor)**:
  - 최초 진입 시 팀별 대표 1개 목표 노출, 상단 칩 스위처, 마일스톤 기본 접힘(`unfoldMsList`), 수준별 관리 아코디언(`foldLevelSection`), 팀 통합(`groupLevelGoals`) vs 목표별(`goalLevelGoals`) 완전 분리 및 복사(`copyTeamLevelsToGoal`), 375px 모바일 무결성.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것 (Avoid)**:
  - 기존 팀 목표 데이터나 개인 목표 데이터를 날리거나 스키마를 파괴하는 행위 금지.
  - 칩 바나 아코디언 클릭 시 전체 페이지가 깜빡이거나 스크롤이 튀는 현상 차단.
- **해야 할 것 (Action)**:
  - **스토리지 원장화 3대 명세 (Storage Blueprint Mandate)**:
    1. **원격 DB 및 로컬 스키마 명세**: `state.profile.settings.groupLevelGoals` (팀 통합 수준 목록), `state.profile.settings.goalLevelGoals` (목표 ID별 수준 목록), `state.profile.settings.unfoldMsList` (마일스톤 접힘 상태), `state.profile.settings.foldLevelSection` (수준관리 섹션 접힘 상태).
    2. **스마트 스토리지 분기**: 경량 JSON 트리 형태로 `state.profile.settings`에 집약 저장되며 `saveProfile()` 트랜잭션을 통해 LocalStorage 및 Supabase `profiles` 테이블의 `settings` 컬럼과 안전하게 양방향 동기화.
    3. **4대 뷰 전파 배선도**: 조 추가/수정/삭제 및 마일스톤 체크 시 `renderTeamGoalsScreen` 직통 갱신 및 4대 뷰(`renderGoalsScreen`, `renderHome`, `renderRecordsScreen`, `renderCalendar`) 상태 연동.
  - **전수 인터랙션 (Zero Dead Click) 명세표**:
    - `[data-tgselectgoal]`: 상단 칩 탭 시 `state.activeTeamGoalId[gid]` 갱신 후 화면 즉시 리렌더링.
    - `[data-tgfoldlist]`: 마일스톤 접기/펼치기 토글 및 `unfoldMsList` 저장.
    - `[data-tglevelaccordion]`: 수준별 관리 섹션 헤더 아코디언 토글 및 `foldLevelSection` 저장.
    - `[data-tgcardaccordion]`: 개별 조 인라인 아코디언 바디 토글.
    - `[data-tglevelmode]`: `goal` vs `team` 듀얼 세그먼트 전환.
    - `[data-tgcopyteamlevels]`: 팀 통합 수준 조를 현재 목표별 수준으로 즉시 딥 카피(`copyTeamLevelsToGoal`).
    - `[data-openleveldetail]`: 수준별 조 상세 모달 오픈 (목표별 tgid 연계).

---

## 4. [원칙 ④] 1~3 재검토 · 보완 (Critical Review & Edge Cases)
- **엣지케이스 1: 팀에 목표가 0개인 경우**:
  - 안내 문구 표시 및 권한자(`canManage`)일 경우 [+ 새 공동 팀 목표 추가] 버튼 제공.
- **엣지케이스 2: 팀에 목표가 1개만 있는 경우**:
  - 칩 스위처를 생략하고 대표 카드로 바로 깔끔하게 렌더링하여 불필요한 여백 낭비 제거.
- **엣지케이스 3: 특정 목표에 수준별 조가 0개인 경우**:
  - `[🌐 팀 통합 수준 복사해오기]` 및 `[+ 새 조 만들기]` 버튼을 친절하게 배치하여 콜드스타트 해소.
- **엣지케이스 4: 375px 모바일 화면**:
  - 칩 스위처에 `overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none;` 적용하여 화면 짤림 방지 및 터치 타깃 44px 이상 확보.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Implementation Procedure)
1. **[Step 1] 데이터 및 이벤트 배선 무결성 보강 (`js/team-visibility-levels.js`, `index.html`)**:
   - `data-tgfoldlist`의 `state.profile.settings.unfoldMsList` 저장 로직 직통 결속.
   - 최초 진입 시 미완료 대표 1개 목표 선별 알고리즘 검증.
   - 듀얼 모드 분리 및 복사 엔진 무결성 점검.
2. **[Step 2] UI/UX 및 375px 모바일 반응형 스타일 점검 (`ui.css`)**:
   - 칩 바, 아코디언 헤더, 인라인 아코디언 행의 여백 및 고대비 토큰 점검.
3. **[Step 3] 단위 테스트 스위트 작성 (`tests/team-level-management.test.js`)**:
   - 대표 목표 선별, 칩 스위처 전환, 아코디언 토글 상태 영속성, 듀얼 모드 분리 및 복사 로직 전수 검증.
4. **[Step 4] 스모크 테스트 및 헌법 게이트 통과 (`scripts/smoke-test.js`, `scripts/verify-integrity-gate.js`)**:
   - 376개 테스트 ALL PASS 및 38개 헌법 게이트 확인.
5. **[Step 5] GitHub Court 심사 청구 및 Tri-Sync 무결성 완결**:
   - PR 생성, court 판정서 굵은 네 줄 확보, Tri-Sync `check` 100%.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)
- **단일 실패점 (SPOF) 점검**:
  - `OurgoalTeamVisibilityLevels` 모듈이 만약 로드되지 않거나 에러가 발생해도, `index.html` 내 삼항 연산자 가드(`window.OurgoalTeamVisibilityLevels ? ... : ...`)를 통해 기존 팀 화면이 완전히 죽지 않고 폴백될 수 있도록 방어선 확보.
- **재검증 결과 도출된 절차 보완**:
  - `index.html` 내 `data-tgfoldlist` 클릭 시 단순 DOM 토글만 하던 레거시 코드를 보완하여, `state.profile.settings.unfoldMsList`를 갱신하고 `saveProfile()`을 호출하도록 영구 원장화 배선 추가.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics & Criteria)
1. 최초 진입 시 팀별로 대표 1개 목표만 카드로 렌더링된다.
2. 복수 목표 시 상단 칩 스위처가 렌더링되며 탭 시 활성 목표가 즉시 전환된다.
3. 마일스톤 목록이 기본 접힘 상태로 렌더링되며 토글 시 상태가 원장에 보존된다.
4. 팀 수준별 목표 관리 섹션이 아코디언 헤더로 감싸져 기본 접힘 상태로 렌더링된다.
5. 듀얼 세그먼트 스위처로 '팀 통합 수준관리'와 '목표별 수준관리'가 독립적으로 작동한다.
6. 목표별 조가 없을 때 '팀 통합 수준 복사해오기'를 누르면 즉시 복제된다.
7. 단위 테스트 `tests/team-level-management.test.js` 100% 통과.
8. `smoke-test.js` 376개 테스트 ALL PASS.
9. GitHub Court 판정 통과 및 claims 무결성 확인.

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)
- **블로커 1: 모바일 375px에서 칩 바 줄바꿈 현상**:
  - 대응: `.tg-goal-switcher`에 `flex-wrap: nowrap`, `overflow-x: auto` 강제.
- **블로커 2: 목표 삭제 시 해당 목표의 `goalLevelGoals` 쓰레기 데이터 잔존**:
  - 대응: 목표 삭제 시 `goalLevelGoals[tgid]`도 안전하게 함께 정리하도록 방어 로직 결속.
- **재검증 트리거**:
  - 칩 전환 후 상태 불일치 발생 시 원칙 ③의 렌더러 파이프라인과 원칙 ⑤의 이벤트 리스너 배선으로 복귀하여 재검증.
