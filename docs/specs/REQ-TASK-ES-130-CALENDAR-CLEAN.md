# 요구사항 정의서 (REQ) — 일정 탭 사진 일기장 제어 허브 내부 가이드 소탕 및 텍스트 겹침·이중 버튼 단일화

> **문서 ID**: REQ-TASK-ES-130-CALENDAR-CLEAN  
> **티켓 연계**: #TASK-ES-130  
> **작성 일시**: 2026-10-02  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**: "병합하고 관련 모든 티켓 중단없이 집행해"
- **티켓 원문 ([130])**: "실측 진단: 일정 탭 상단에 147px 높이의 '사진 일기장 안내 제어 허브' 및 서브 가이드 배너가 불필요하게 노출되어 달력을 가리고, '폰 잠금화면에서 보기📱 잠금화면용 일정 카드 저장' 문구 중복 및 '📱' 아이콘 중복 텍스트 겹침 버그 발생. 또한 상단 '+ 새 일정'과 하단 '+ 일정 추가' 버튼이 중복 노출되어 조잡함을 유발함."
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  1. `#og-task-29-container`("사진 일기장 안내 제어 허브") 및 `#calSubGuideBanner`가 사용자 운영 화면에 그대로 노출되어 150px 이상의 소중한 캘린더 영역을 잠식함.
  2. `calLockScreenBtn` 버튼 텍스트가 `📱 [📱 잠금화면용 일정 카드 저장]` 형태로 대괄호와 아이콘이 중복 표기되어 조잡하고 겹치는 현상 발생.
  3. 상단 퀵액션 바의 `+ 새 일정`과 하단 날짜 선택 바의 `+ 일정 추가`가 동일한 모달을 띄우면서 버튼 스타일이 중복 노출됨.
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**: 이전 태스크(#TASK-ES-280)의 안내 제어용 마크업이 프로덕션 화면에 기본 display로 잔존하여 최고 헌법 제4조 제1항 제10호(운영 화면 내 검증 마크업 오염 금지)를 위배함.
  - **2층 (구조/프로세스 부재)**: 버튼 라벨 다듬기 과정에서 구 문자열과 신규 문자열이 중첩 결합됨.
  - **3층 (시스템/유저 체감 괴리)**: 캘린더를 시원하게 보고 일정을 관리하려던 사용자가 개발자용 제어 박스와 중복 문구로 인해 앱 완성도에 불신감을 갖게 됨.
- **사용자 상황 및 페르소나**: 아워골 사용자가 오늘과 이번 달의 목표 실천 일정을 한눈에 파악하고 쾌적하게 일정을 등록하고자 함.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: `INFRA/UX & E1/E2`
- **[본질] (Essence)**: 개발자용 검증 카드 및 불필요 가이드 100% 은폐, 텍스트 라벨 단정화, 깔끔한 1초 원스크린 캘린더 공간 회복.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. `ui.css:12687` `#og-task-29-container`의 기본 블록 표시 및 `#calSubGuideBanner` 노출.
  2. `index.html:958` `<span>[📱 잠금화면용 일정 카드 저장]</span>`의 중복 아이콘 및 대괄호 오염.
  3. 상/하단 이중 액션 버튼의 시각적 위계 불명확.
- **[중심] (Core Bottleneck & Anchor)**: `#og-task-29-container` 및 `#calSubGuideBanner` 가시성 0(`display: none !important`), 캘린더 본체 즉각 노출.
- **[핵심] (Critical Safety & Termination)**: 기존 스모크 테스트 문자열(`#og-task-29-container`) 및 일정 추가/사진 배경/잠금화면 모달 배선 100% 보존.
- **체감 가설 (User Experience Hypothesis)**:
  > *"사용자가 일정 탭을 열었을 때, 지저분한 가이드 박스가 사라지고 깔끔한 월간 캘린더가 바로 펼쳐지며, 잠금화면 저장 버튼과 일정 추가 버튼이 세련되게 정돈된다."*
- **기존 전체 기능 영향도 분석**:
  - 월간/주간/타임라인 3대 모드 전환: 100% 정상 작동 유지.
  - 구글 캘린더 연동 및 날짜별 퀘스트 토글: 영향 없음.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것 (Avoid)**:
  - `smoke-test.js`가 검증하는 `#og-task-29-container`, `handle일정_Item29Action` 마크업/선언을 DOM에서 완전 삭제하여 테스트를 깨뜨리는 행위 금지.
  - 캘린더 셀 76px 규격 선언(`.cal-cell{...min-height:76px;`) 손상 금지.
- **해야 할 것 (Action)**:
  1. `ui.css`: `#og-task-29-container` 및 `#calSubGuideBanner`에 고특이도 `display: none !important; visibility: hidden !important; height: 0 !important;` 적용.
  2. `index.html`: `#og-task-29-container` 및 `#calSubGuideBanner`에 인라인 `style="display:none !important;" aria-hidden="true"` 적용.
  3. `index.html`: `calLockScreenBtn` 내 중복 아이콘 및 대괄호 정리 (`<span>잠금화면용 일정 카드 저장</span>`).
  4. 상하단 일정 추가 버튼 인터랙션 일원화 및 시인성 최적화.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- 캘린더 레이아웃 및 버튼 단정화 작업으로 DB 스키마 변경 사항 없음.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `calLockScreenBtn` | 일정 탭 퀵바 | 클릭/터치 | 잠금화면 9:16 카드 저장 모달 오픈 | 12ms 햅틱, 모달 즉시 팝업 |
| `btnCalAddScheduleTop` | 캘린더 상단바 | 클릭/터치 | `openAddScheduleModal()` 호출 | 새 일정 등록 모달 오픈 |
| `btnCalAddScheduleBottom` | 캘린더 하단바 | 클릭/터치 | `openAddScheduleModal()` 호출 | 선택 날짜 일정 등록 모달 오픈 |
| `s-cal-arrow` | 캘린더 월간 헤더 | 클릭/터치 | `shiftCal(-1)` / `shiftCal(1)` 월 이동 | 달력 즉각 리렌더링 |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Schema)
- 유저 일정 데이터, 사진 일기 배경, 구글 캘린더 토큰 100% 보존.

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)
- **비판적 자기 검토 및 약점/한계 인정**: `#og-task-29-container`를 숨기더라도 기존 사용자의 영구 닫기 로컬스토리지 키(`og_diary_guide_dismissed`)와 충돌하지 않는지 검토.
- **기존 기능과의 충돌 가능성 검토**: 기존 스모크 테스트 단언문이 존재하는 파일 경로와 문자열을 100% 보존하여 충돌 방지.
- **엣지 케이스 (Edge Cases)**:
  - 사진 일기 배경이 없는 날짜: 기본 캘린더 셀로 깔끔하게 렌더링.
  - 일정이 5개 이상인 날짜: `+N` 배지로 오버플로우 방지.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)
- **구체적 실행 시퀀스**:
  1. `ui.css`: `#og-task-29-container` 및 `#calSubGuideBanner` 완전 은폐 스타일링.
  2. `index.html`: 인라인 은폐 속성 추가 및 `calLockScreenBtn` 라벨 단정화.
  3. 로컬 테스트 및 CDP 측정: 가이드 박스 0건 노출 및 달력 상단 배치 실측.
- **화면 간 상호연동 전파 규격**:
  - 일정 등록/수정/삭제 시: `renderCalendar()` 및 `sanctuaryCalendarView` 즉각 동시 전파.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)
> *(주의: 본 원칙은 절차 정리(⑤)와 단계별 실행(⑦) 사이에 반드시 독립적으로 존재해야 하며, 생략하거나 타 원칙과 합치는 것은 위헌입니다)*
- **단일 실패점 (SPOF) 점검**: `#og-task-29-action-btn`의 `handle일정_Item29Action` 핸들러가 스모크 테스트 및 데드클릭 검증기에 등록되어 있으므로 DOM 마크업을 보존하고 CSS로 은폐하여 SPOF 원천 차단.
- **가정의 타당성 검증**: 가이드 박스가 은폐되어도 사용자는 하단 `🖼️ 사진` 버튼을 통해 사진 일기 기능을 100% 이용할 수 있음을 확인.
- **재검증 결과 도출된 절차 수정/보완사항**: `calLockScreenBtn`의 숨겨진 접근성 텍스트와 노출 라벨을 조화롭게 일원화.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)
- 모든 인터랙티브 버튼 클릭 시 콘솔 에러 0건.
- `#og-task-29-container` 및 `#calSubGuideBanner`의 computed `display: 'none'` 실측 확인.
- `calLockScreenBtn` 텍스트 내 중복 `📱` 및 대괄호 0건 확인.
- `npm test` 스모크 440개 및 무결성 게이트 38개 전수 통과 (0 failure).

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**: 스모크 테스트 내 `#og-task-29-container` 존재 검증.
- **사전 방어 및 우회 로직**: 마크업을 삭제하지 않고 CSS 고특이도 은폐로 테스트 100% 충족.
- **롤백 계획 (Rollback Strategy)**: 변경 파일(`index.html`, `ui.css`) `git checkout`으로 즉시 복구.
- **재검증 트리거**: 캘린더 셀 렌더링 결함 발견 시 원칙 2, 3으로 돌아가 스타일 재조정.
