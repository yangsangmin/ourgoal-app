# [작업계획서] 모임 다중 가입(최대 30개) 안정화 및 모임장 세부 권한 위임(RBAC) 시스템 구축

- **문서 번호**: PLAN-OURGOAL-2026-09-13-MULTI-JOIN-RBAC
- **티켓 ID**: #TASK-ES-032
- **연관 요구사항 정의서**: REQ-OURGOAL-2026-09-13-MULTI-JOIN-RBAC (`docs/specs/REQ-TEAM-GOAL-MULTI-JOIN-AND-RBAC.md`)
- **본질 축**: E3 (동류 발견·소통) / FIX (모임 다중 가입 및 렌더링 결함 수정)
- **작성일자**: 2026-09-13
- **작성자**: 아워골 AI 엔지니어링 지휘팀 (Antigravity)
- **작업 방식**: 점진적 컴포넌트 추가, 모듈 분리(순증가 300줄 한도 엄수), 무결성 실측 검증

---

## 1. 아키텍처 및 설계 원칙

1. **승인선 8(대량 변경·index.html 300줄 한도) 준수 및 모듈 분리**:
   - 권한 매트릭스 렌더러와 권한 검증 로직은 `js/group-permissions.js` 독립 모듈로 신설하여 `index.html`의 순증가를 30~50줄 이내로 극소화.
2. **참조 오류(ReferenceError) 원천 차단**:
   - `renderCommGroups` 내 `var checked = groupCheckedToday(g.id);` 누락을 즉시 보완하여 가입 즉시 소통 탭 목록이 사라지는 결함 박멸.
3. **영구 스토리지 보존 및 비파괴성 원칙**:
   - 가이드 템플릿 개설 모임은 `state.profile.settings.customGroups`에 안전하게 JSON 직렬화 저장되어 새로고침 후에도 유지.
4. **선택적 권한 매트릭스 (5개 항목 × 3대 액션)**:
   - 모임 정보, 팀 목표, 마일스톤, 세부할일, 일정 항목별로 추가/수정/삭제 권한을 독립적으로 부여 및 1초 즉시 회수.

---

## 2. 단계별 구현 계획 (Implementation Phases)

### Phase 1: 결함 수정 및 모임 다중 가입 안정화 (Bug Fix & 30-Group Cap)
- **작업 1-1: `renderCommGroups` 미정의 `checked` 식별자 수정**
  - `index.html` 내 `visibleGroups.map` 상단에 `var checked = groupCheckedToday(g.id);` 추가.
- **작업 1-2: 최대 30개 모임 가입 상한선 가드 구축**
  - `promptNewGroup` 및 `data-join` 클릭 시 `var joinedCount = MOCK_GROUPS.filter(function(x){ return groupState(x.id).joined; }).length;` 검사.
  - `joinedCount >= 30`인 경우: `toast('모임은 최대 30개까지 참여할 수 있어요. 참여 중인 모임을 먼저 정리해주세요 ⚠️')` 경고 및 가입 차단.
- **작업 1-3: 가이드 템플릿 개설 워크플로우 안정화**
  - `promptNewGroup(body, initialPreset)` 호출 시 `body` null 가드 적용 (`body || document.querySelector('#commSubBody') || document.getElementById('goalsView')`).
  - 생성된 모임 `state.profile.settings.customGroups`에 동기화.

### Phase 2: 세부 권한 매트릭스 모듈 신설 (`js/group-permissions.js`)
- **작업 2-1: 권한 상수 및 프리셋 정의**
  - `PERMISSION_KEYS`: `group_info:edit`, `goal:create`, `goal:edit`, `goal:delete`, `milestone:create`, `milestone:edit`, `milestone:delete`, `task:create`, `task:edit`, `task:delete`, `schedule:edit`.
  - `ROLE_PRESETS`: `owner`(전권), `manager`(전체 운영), `planner`(목표·마일스톤·일정), `reporter`(할일·체크), `member`(읽기전용).
- **작업 2-2: 권한 검증 코어 함수 `hasPermission(gid, permKey, myId, myRole, permissions)` 구현**
  - 모임장(`owner`)은 무조건 `true`.
  - 팀원의 경우 위임받은 `allows` 배열에 포함되어 있는지 검사.
- **작업 2-3: 권한 관리 모달 렌더러 `openGroupPermissionModal(gid, deps)` 구현**
  - 팀원 선택 드롭다운, 퀵 프리셋 칩, 5개 카테고리별 체크박스 매트릭스, 권한 회수 및 저장 핸들러 완비.

### Phase 3: 팀 목표 화면 및 모달 인터페이스 연동 (UI Integration)
- **작업 3-1: 팀 목표 카드 헤더에 `[🛡️ 권한 위임]` 버튼 탑재**
  - `canManageTeamGoals(g.id)` 및 `isOwner` 조건 시 노출.
- **작업 3-2: 권한 기반 UI 가드 적용**
  - `promptNewTeamGoal`: `goal:create` 권한 확인.
  - `openTeamGoalEditModal`: 각 항목(제목, 마일스톤, 할일, 마감일)별로 `goal:edit`, `milestone:create/edit/delete`, `task:create/edit/delete`, `schedule:edit` 권한 여부에 따라 버튼 표시/숨김 제어.
  - 팀원 화면 상단에 위임받은 권한 요약 배너 표시 (`[🛡️ 운영 권한: 마일스톤·할일 편집 가능]`).

### Phase 4: 스모크 테스트 신설 및 무결성 검증 (Testing & Verification)
- **작업 4-1: `scripts/smoke-test.js`에 #TASK-ES-032 컴플라이언스 테스트 신설**
  - 모임 1개 가입 후 `renderCommGroups` 렌더링 무오류 검증.
  - 30개 가입 상한선 가드 검증.
  - `js/group-permissions.js` 권한 체크 및 프리셋 매핑 무결성 검증.
  - 5대 항목별 권한 부여 및 회수 상태 천이 검증.
- **작업 4-2: `npm test` 205개+ 전수 통과 확인**

---

## 3. 세부 파일별 변경 계획 (File Level Plan)

| 파일 경로 | 작업 유형 | 주요 내용 |
| :--- | :---: | :--- |
| `docs/specs/REQ-TEAM-GOAL-MULTI-JOIN-AND-RBAC.md` | [NEW] | 요구사항 정의서 정본 |
| `docs/specs/PLAN-TEAM-GOAL-MULTI-JOIN-AND-RBAC.md` | [NEW] | 엔지니어링 구현 작업계획서 정본 (본 문서) |
| `docs/rules/TICKETS.md` | [MODIFY] | #TASK-ES-032 티켓 등록 |
| `js/group-permissions.js` | [NEW] | 세부 권한 매트릭스 코어 로직 및 권한 위임 바텀시트 모달 모듈 |
| `index.html` | [MODIFY] | `checked` 선언 누락 보완, 30개 상한선 가드, `js/group-permissions.js` 로드 및 권한 가드 배선 (순증가 40줄 이내) |
| `scripts/smoke-test.js` | [MODIFY] | #TASK-ES-032 전용 컴플라이언스 단위 테스트 케이스 추가 |

---

## 4. 리스크 및 안전망 대책

1. **권한 오동작으로 인한 모임 폭파 방지**:
   - `group_info:delete` (모임 삭제)는 어떠한 팀원에게도 위임될 수 없으며, 오직 원래 개설한 모임장(`owner`) 본인만 실행할 수 있도록 하드 가드.
2. **모듈 분리를 통한 코드베이스 건전성 수호**:
   - 권한 매트릭스 UI와 이벤트 처리를 `js/group-permissions.js`로 100% 캡슐화하여 `index.html`의 순증가를 30줄 대로 최소화.
