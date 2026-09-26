# 요구사항 정의서 (REQ) — 일정 사진 일기장 안내창 우측 상단 닫기(X) 버튼 추가 및 영구 숨김 처리

> **문서 ID**: REQ-TASK-ES-280-CALENDAR-PHOTO-DIARY-DISMISS-GUIDE  
> **티켓 연계**: #TASK-ES-280  
> **작성 일시**: 2026-09-26  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**: "일정을 사진배경으로 채워서 나만의 사진 일기장을 만들어봐요 창 우측 상단에 X(닫기)버튼 만들어서 참고한 사람들은 닫아서 없애게 해줘.(첫 닫기 이후 계속 안보이게)"
- **현재 발생하는 문제 및 한계 (표면적 현상)**: 일정 탭 상단에 노출되는 사진 일기장 안내창(`calSubGuideBanner`)을 이미 확인하고 숙지한 유저도 화면 공간을 계속 차지하는 안내창으로 인해 일정 달력과 목록 뷰포트가 협소해지는 피로도를 경험함.
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**: 배너의 닫기(X) 버튼 터치 영역이 44px 미만이거나 시인성이 낮아 모바일에서 닫기 조작이 어렵고, 1회 닫기 후 영구 영속화 배선이 불완전할 수 있음.
  - **2층 (구조/프로세스 부재)**: 유저의 닫기 의도를 로컬 및 전역 상태에 원자적으로 동기화하는 4위 1체 직통 핸들러 부재.
  - **3층 (시스템/유저 체감 괴리)**: 안내문은 신규 유저에게 유익하지만 중복 노출 시 시각적 공해로 전락하므로 영구 닫기(dismiss) 권한이 보장되어야 함.
- **사용자 상황 및 페르소나**: 일정을 효율적으로 관리하려는 모바일 375px 환경의 실사용자.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: E1 (체크인 루프 및 일정 관리) / UX
- **[본질] (Essence)**: 사용자 화면 공간 자율성 보장 및 쾌적한 캘린더 인터페이스 제공.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1**: 닫기 버튼의 터치 타겟(44px) 및 시각적 어포던스 부족.
  2. **원인 2**: 닫기 상태의 원자적 저장 및 4대 뷰 동시 전파 체계 미흡.
  3. **원인 3**: 4위 1체 직통 트랜잭션 핸들러 미구현.
- **[중심] (Core Bottleneck & Anchor)**: 우측 상단 명확한 X 버튼 배치, 1회 닫기 시 `ourgoal_hide_diary_guide` 로컬스토리지 영구 보존 및 화면 즉시 숨김.
- **[핵심] (Critical Safety & Termination)**: 기존 캘린더 월간/주간/일간 렌더링 및 일정 첨부 데이터의 100% 불파괴 보존.
- **체감 가설 (User Experience Hypothesis)**:
  > *"사용자가 사진 일기장 안내창의 X 버튼을 탭하면 12ms 햅틱과 함께 안내창이 즉시 사라지고, 이후 앱을 재실행하거나 탭을 이동해도 다시 나타나지 않아 넓고 깔끔한 달력 화면을 누릴 수 있다."*
- **기존 전체 기능 영향도 분석**:
  - 계정/로그인(세션, 게스트, 소셜)에 미치는 영향: 영향 없음 (세션 유지).
  - 홈 화면 및 스트릭에 미치는 영향: 영향 없음 (데이터 불변 보존).
  - 기록/통계/캘린더 탭에 미치는 영향: 4대 뷰 동시 전파로 상태 일관성 보장.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것 (Avoid)**: 캘린더 그리드 엔진 재작성, 기존 배너 필수 DOM ID 삭제, 불필요한 전역 상태 오염.
- **해야 할 것 (Action)**:
  1. `js/calendar-attachment.js`에 `handle일정_Item29Action` 직통 핸들러 정의 및 전역 노출.
  2. `index.html` 일정 탭 내 `#og-task-29-container` 및 `#og-task-29-action-btn` 마크업 마운트.
  3. `#btnHideCalDiaryGuide` 버튼의 최소 44px 터치 타겟 및 명확한 X 닫기 스타일 보장.
  4. 12ms 햅틱 진동, `ourgoal_hide_diary_guide` 및 `og_task-29_cache` 원자적 영속화, 4대 뷰 동시 전파.
- **왜 이 방식이어야만 하는가 (Why this approach)**: 상민님 지시를 100% 충족하면서 기존 헌법 38대 게이트 및 스모크 테스트와 완벽히 공존하는 최적의 해법.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**: Supabase `user_interactions` 호환 보존.
- **2호 (스마트 스토리지 분기 설계)**: `ourgoal_hide_diary_guide` 및 `og_task-29_cache` 로컬 캐시 원자적 갱신.
- **3호 (4대 뷰 전파 배선도)**: 액션 발동 시 `renderHome`, `renderRecordsScreen`, `renderCalendar`, `renderGoalsScreen` 원자적 동시 호출.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `btnHideCalDiaryGuide` | 캘린더 안내 배너 우측 상단 | 클릭/터치 | 안내창 영구 숨김 처리 및 로컬 영속화 | 10~12ms 햅틱 + 즉각 display:none |
| `og-task-29-action-btn` | 일정 탭 안내 허브 | 클릭/터치 | `handle일정_Item29Action` 호출, 영구 숨김 동기화 | 12ms 햅틱 + 상태 토스트 + 4대 뷰 동시 전파 |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Schema)
- **아바타 보존**: 기존 아바타 데이터 100% 보존.
- **목표 데이터 보존**: 기존 목표 리스트 및 마일스톤 불변 보존.
- **기록 데이터 보존**: 과거 일정 및 첨부자료 100% 무손실 유지.
- **화면 구성 세팅값 보존**: 테마 및 네비게이션 상태 불변.

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)
- **비판적 자기 검토 및 약점/한계 인정**: 유저가 나중에 안내창을 다시 보고 싶어할 경우를 대비하여 설정 또는 도움말 탭에서 초기화 가능하도록 캐시 키 격리 유지.
- **기존 기능과의 충돌 가능성 검토**: 기존 `#btnHideCalDiaryGuide` 이벤트 리스너와 충돌 없이 완벽히 조화되도록 설계.
- **엣지 케이스 (Edge Cases)**:
  - 브라우저 로컬스토리지 비활성화 시: 메모리 폴백 상태 유지로 세션 내 숨김 보장.
  - 다중 탭 동시 접속 시: 로컬 스토리지 키 변경 이벤트 감지로 일관성 유지.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)
- **구체적 실행 시퀀스**:
  1. `js/calendar-attachment.js`에 `handle일정_Item29Action` 함수 구현 및 전역 노출.
  2. `index.html` 일정 탭 내 `#og-task-29-container` 마크업 마운트.
  3. `ui.css`에 44px 터치 타겟 반응형 스타일 추가.
  4. `tests/calendar-photo-diary-dismiss-guide.test.js` 작성 및 통과 확인.
  5. `scripts/smoke-test.js`에 #TASK-ES-280 단언문 추가.
- **화면 간 상호연동 전파 규격**:
  - 변경 발생 지점: `handle일정_Item29Action` 또는 `btnHideCalDiaryGuide` 클릭 시.
  - 연계 갱신 화면: `renderHome`, `renderRecordsScreen`, `renderCalendar`, `renderGoalsScreen`.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)
- **단일 실패점 (SPOF) 점검**: DOM 요소 누락 시에도 안전 가드(`try...catch`)로 감싸 앱 크래시 방지.
- **가정의 타당성 검증**: 영구 숨김 키(`ourgoal_hide_diary_guide`)가 새로고침 후에도 유지되는지 검증.
- **재검증 결과 도출된 절차 수정/보완사항**: 닫기 버튼 터치 타겟 44px 이상 및 12ms 햅틱 기본 적용.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)
- 모든 인터랙티브 버튼 클릭 시 콘솔 에러 0건.
- 닫기 버튼 클릭 시 배너 즉시 숨김 및 새로고침 후에도 미노출 확인.
- 스모크 테스트 398개 이상 전수 통과.
- 헌법 게이트 38개 항목 100% ALL PASS.

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)
- **예상 블로커 1**: 캘린더 리렌더링 시 배너 강제 재표출 문제.
- **대책**: `renderCalendarScreen` 실행 시 항상 `ourgoal_hide_diary_guide` 플래그를 우선 점검하여 `display: none` 유지.
