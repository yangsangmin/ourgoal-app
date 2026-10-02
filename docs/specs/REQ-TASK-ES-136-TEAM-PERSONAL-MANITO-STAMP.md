# 요구사항 정의서 (REQ) — 팀 연계 개인목표 생성 의도 직통화 및 마니또 원클릭 웰컴 스탬프 & 실시간 피드백 배선

> **문서 ID**: REQ-TASK-ES-136-TEAM-PERSONAL-MANITO-STAMP  
> **티켓 연계**: #TASK-ES-136  
> **작성 일시**: 2026-10-02  
> **작성자**: Antigravity Core Engine  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**: "병합하고 관련 모든 티켓 중단없이 집행해", 노션 생각 메모장 [136]번 (정체 [82], [99], [100] 결합)
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  1. 팀 목표 탭 내 '팀 연계 개인목표' 버튼이 24px 미만의 극소 버튼으로 카드 우측에 묻혀 있어 사용자가 팀 활동과 개인 목표를 연결하는 핵심 의도를 직관적으로 인지하기 어려움.
  2. `MOCK_GROUPS` 샘플 데이터와 실제 유저 팀 간의 구분이 모호하여 신규 유저가 가상 팀을 실제 운영 팀으로 오인하는 혼선이 존재함.
  3. 마니또 매칭 후 신규 매칭 상대에게 첫인사를 건네기까지의 마찰이 커서 상호작용 참여율이 저조함.
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**: 팀 연계 개인목표 생성 시 개인 경험치(+EXP) 지급 피드백이 연계되지 않아 동기부여가 약화됨.
  - **2층 (구조/프로세스 부재)**: 팀 상단에 팀-개인 연결을 유도하는 직통 퀵 액션 바의 부재 및 샘플 팀에 대한 명시적 뱃지 부재.
  - **3층 (시스템/유저 체감 괴리)**: 유저는 팀에 가입해도 나만의 실천 로드맵을 어떻게 만들어야 할지 막막함을 느끼며, 마니또 매칭 시에도 즉각적인 환영 제스처를 취하기 어려움.
- **사용자 상황 및 페르소나**: 팀 크루에 참여한 신규/기존 유저 및 마니또 매칭을 완료한 유저.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: INFRA / UX (소통탭·팀목표)
- **[본질] (Essence)**: 팀의 공동 목표와 개인의 일일 실천을 1초 만에 연결하고, 마니또 비밀 친구에게 첫인사를 즉시 건네는 무저항 동류 소통(E3) 및 체크인 동기부여 체계.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1**: 팀 목표 탭 내 팀 연계 목표 생성 버튼이 44px 터치 규격에 미달하고 가시성이 부족했던 점.
  2. **원인 2**: 가상 샘플 그룹(`MOCK_GROUPS`)에 대한 `[예시 팀]` 시각적 뱃지가 누락되어 실 유저 팀과의 경계가 불명확했던 점.
  3. **원인 3**: 마니또 매칭 화면에서 웰컴 스탬프 전송 시 1초 실시간 피드백 및 터치 타깃이 모바일 규격에 최적화되지 않았던 점.
- **[중심] (Core Bottleneck & Anchor)**: `renderTeamGoalsScreen`의 헤더 퀵 액션 바 및 `openTeamLinkedPersonalGoalModal`의 경험치(+15 EXP) 보상 배선, `renderCommManito`의 44px 웰컴 스탬프 터치 무결성.
- **[핵심] (Critical Safety & Termination)**: 팀 연계 목표 생성 시 로컬 `state.profile.goals`와 `saveProfile()` 영속화, 4대 뷰 원자적 전파, 44px 터치 타깃 준수.
- **체감 가설 (User Experience Hypothesis)**:
  > *"사용자가 팀 목표 탭에 들어왔을 때 상단의 '💡 팀 연계 개인목표 만들기'를 통해 1초 만에 내 목표를 만들고 +15 EXP를 획득하며, 마니또 탭에서 원클릭으로 웰컴 응원을 전송하여 즉각적인 유대감을 느낀다."*
- **기존 전체 기능 영향도 분석**:
  - 계정/로그인(세션, 게스트, 소셜)에 미치는 영향: 영향 없음 (게스트/회원 모두 안전하게 작동).
  - 홈 화면 및 스트릭에 미치는 영향: 목표 생성 시 홈 콕핏에 즉각 연동되어 체크인 후보로 활용 가능.
  - 기록/통계/캘린더 탭에 미치는 영향: 연계 일정 생성 시 캘린더 및 기록 탭에 정상 반영.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것 (Avoid)**: 기존 팀 목표 렌더링 로직 파괴 금지, 불필요한 전체 리렌더링 유발 금지, CSS 스타일 누수 금지.
- **해야 할 것 (Action)**: 상단 퀵 액션 바 `#teamLinkedGoalQuickBar` 배치, 팀 카드 내 44px 규격의 `.team-personal-goal-pill-btn` 적용, `.badge-mock-team` 뱃지 표출, `awardXP` 연동.
- **왜 이 방식이어야만 하는가 (Why this approach)**: 사용자의 인지 흐름(IA) 상 상단에서 '팀 연계 개인목표'의 가치를 먼저 알리고, 카드별로도 즉시 액션을 취할 수 있도록 이중 배치하는 것이 전환율을 극대화함.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**: `state.profile.goals` 내 `teamLinkId`, `teamLinkName` 필드 보존.
- **2호 (스마트 스토리지 분기 설계)**: 로컬 캐시 및 `saveProfile()` 통한 Supabase profile upsert.
- **3호 (4대 뷰 전파 배선도)**: 목표 생성 후 `renderAll()`, `renderGoalsScreen()`, `renderHome()` 원자적 호출.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `#btnQuickCreateTeamLinkedGoal` | 팀 목표 탭 상단 | 클릭/터치 | 활성 팀 연계 목표 생성 모달 오픈 | 팀 부재 시 샘플 팀 자동 바인딩 |
| `.team-personal-goal-pill-btn` | 팀 카드 헤더 | 클릭/터치 | 해당 팀 연계 목표 생성 모달 오픈 | 모달 즉시 노출 |
| `#tlpConfirm` | 연계 목표 모달 | 클릭/터치 | 목표 생성 + 15 EXP 지급 + 저장 | 제목 누락 시 토스트 경고 |
| `.manito-welcome-stamp-btn` | 마니또 탭 상단 | 클릭/터치 | 웰컴 스탬프 전송 + 햅틱/컨페티 | 60초 쿨타임 안내 토스트 |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Schema)
- **아바타 보존**: 기존 아바타 이미지 및 레벨 경험치 보존.
- **목표 데이터 보존**: 기존 goals 배열 훼손 없이 unshift 추가.
- **기록 데이터 보존**: 기존 records 및 체크인 데이터 불변.
- **화면 구성 세팅값 보존**: 테마, 필터, 접힘 상태 100% 유지.

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)
- **비판적 자기 검토 및 약점/한계 인정**: 참여 중인 팀이 0개인 경우 빈 화면 가이드에서도 직통 버튼을 제공해야 함 -> `renderTeamGoalsEmptyGuideHtml`에 `#btnQuickCreateTeamLinkedGoalEmpty` 동시 탑재로 완벽 보완.
- **기존 기능과의 충돌 가능성 검토**: 기존 팀 목표 편집 모드 및 아코디언 접힘 상태와 완벽 공존.
- **엣지 케이스 (Edge Cases)**:
  - 게스트 모드: 로컬 상태에 정상 저장되고 EXP 반영.
  - 네트워크 단절: 로컬 2중 스토리지에 즉각 영속화.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)
- **구체적 실행 시퀀스**:
  1. `ui.css`에 `.team-quick-action-bar`, `.team-personal-goal-quick-btn`, `.team-personal-goal-pill-btn`, `.badge-mock-team` 정의.
  2. `index.html` 내 `renderTeamGoalsScreen` 및 `renderTeamGoalsEmptyGuideHtml`에 직통 UI 및 핸들러 배선.
  3. `openTeamLinkedPersonalGoalModal`에 `awardXP(15, ...)` 및 축하 피드백 배선.
  4. 마니또 웰컴 스탬프 44px 및 전송 피드백 무결성 확인.
- **화면 간 상호연동 전파 규격**:
  - 데이터 변경 발생 지점: 팀 연계 개인목표 생성 시
  - 즉시 갱신되어야 할 연계 화면:
    1. 홈 화면 (`renderHome`): 신규 목표 반영
    2. 목표 탭 (`renderGoalsScreen`): 개인 목표 및 팀 목표 갱신
    3. 통계 탭 (`renderStatsScreen`): 목표 개수 갱신
    4. 캘린더 탭 (`renderCalendarScreen`): 마감일 연동

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)
- **단일 실패점 (SPOF) 점검**: 모달 호출 함수 `openTeamLinkedPersonalGoalModal`이 누락되더라도 fallback 안내 토스트 제공.
- **가정의 타당성 검증**: `MOCK_GROUPS`가 비어있을 경우에도 기본 fallback 객체를 통해 에러 방지.
- **재검증 결과 도출된 절차 수정/보완사항**: 빈 화면 가이드 모달뿐 아니라 인라인 뷰에서도 동일하게 작동하도록 양방향 리스너 배선.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)
- 모든 인터랙티브 버튼 클릭 시 콘솔 에러 0건 (Zero Dead-Click).
- 유저 데이터 무손실 검증 100% PASS.
- `npm test` 스모크 440개 및 무결성 게이트 38개 전수 ALL PASS.
- Headless Chrome 실측 시 모바일 390px 뷰포트 너비 안정성 준수.

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)
- **예상 블로커 1**: CSS 클래스명 충돌 -> 고유 네임스페이스(`team-personal-goal-pill-btn`, `badge-mock-team`) 적용으로 격리.
- **예상 블로커 2**: 뷰포트 가로 스크롤 발생 -> `display: flex; flex-wrap: wrap;` 및 가로 패딩 규격화로 방어.
- **재검증 트리거**: CDP 실측에서 버튼 크기 <44px 발견 시 ui.css로 즉시 회귀하여 패딩 및 min-height 보정.
