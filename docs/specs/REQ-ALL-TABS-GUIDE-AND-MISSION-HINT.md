# 요구사항 정의서 (REQ) — 전 탭 '이 페이지 활용법' 가이드 시스템 & 오늘의 미션 힌트 탑재

> **문서 ID**: REQ-ALL-TABS-GUIDE-AND-MISSION-HINT  
> **티켓 연계**: #TASK-ES-102  
> **작성 일시**: 2026-09-15  
> **작성자**: Antigravity AI Engine  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**:
  > "홈탭의 오늘의 미션 옆에 '할일이 당장 안떠오르면 활용하세요' 추가해"  
  > "홈탭, 목표탭, 일정탭, 소통탭, 설정탭도 기록탭과 마찬가지로 이 페이지 활용법 버튼 넣고 각각 맞는 설명 채워넣어."
- **현재 상황 및 한계**:
  - 현재는 **기록 탭**에만 `[💡 이 페이지 활용법 보기]` 버튼(`recAnalyticsGuideBtn`)이 존재하여 콕핏 철학 모달(`OurgoalUniversalStats.openGuideModal`)을 열 수 있음.
  - 나머지 핵심 탭(홈, 목표, 일정, 소통, 설정)에는 활용법 가이드 버튼이 없어, 신규 및 기존 유저가 각 탭의 차별화된 핵심 가치(루틴 형성, 마일스톤 분할, 시간블록 일정, 동류 응원, 데이터 주권)를 직관적으로 이해하기 어려움.
  - 홈 화면의 `오늘의 미션` 위젯에 대해 유저가 어떤 맥락으로 써야 하는지(할 일이 떠오르지 않을 때의 구원투수 역할) 즉각적인 인지적 힌트가 부족함.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Root Cause & Essence)
- **근본 원인**:
  - 각 화면별 온보딩/가이드 진입점이 기록 탭에만 국한되어 화면 간 사용자 경험의 일관성이 결여됨.
- **본질 축 (Essence Axis)**: `E1` / `E2` / `E3` / `UX`
- **체감 가설 (User Experience Hypothesis)**:
  > *"사용자가 홈, 목표, 일정, 소통, 설정 탭 어디에서든 상단 헤더의 `[💡 이 페이지 활용법 보기]` 버튼을 눌렀을 때, 그 탭의 핵심 기능과 100% 활용 꿀팁이 담긴 정교한 모달을 열람함으로써 앱의 기능 숙련도를 즉시 높이고, 오늘의 미션 옆 힌트를 보고 망설임 없이 행동을 개시한다."*

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Functional Specifications)

### 3-1. 세부 기능 요구사항 (Functional Requirements)
- **FR-01 [오늘의 미션 힌트 배지 탑재]**:
  - 홈 화면 `오늘의 미션` 타이틀 옆에 `'할일이 당장 안떠오르면 활용하세요'` 서브 힌트 텍스트/배지 마운트.
- **FR-02 [전 탭 활용법 버튼 통일 규격 마운트]**:
  - 기록 탭 버튼과 완벽히 동일한 스타일(`btn btn-ghost btn-xs`, 폰트 11px, 보더 라운드 12px, 인디고 테마)로 헤더 영역에 마운트.
  - 홈탭: `homePageGuideBtn`
  - 목표탭: `goalsPageGuideBtn`
  - 일정탭: `calPageGuideBtn`
  - 소통탭: `commPageGuideBtn`
  - 설정탭: `settingsPageGuideBtn`
- **FR-03 [5대 탭별 맞춤 가이드 모달 콘텐츠 설계]**:
  - **홈탭 가이드**: 오늘 한 줄 체크인, 3대 데일리 퀘스트(EXP), AI 3단 맞춤 피드백, 오늘의 미션 활용법.
  - **목표탭 가이드**: 거대 목표의 마일스톤·할 일 계층화, D-day 및 진행률 추적, 팀 목표 함께 달성.
  - **일정탭 가이드**: 캘린더와 시간표 듀얼 뷰, 마일스톤 연동, 외부 캘린더(WebCal/구글) 구독 및 일정 첨부파일.
  - **소통탭 가이드**: 비슷한 목표를 가진 동류 유저 매칭, 건강한 응원과 피드백, 클린 커뮤니티(신고/차단).
  - **설정탭 가이드**: 100% 데이터 주권(로컬 백업 및 복원), AI 페르소나 아바타 커스텀, 푸시 알림 및 계정 관리.
- **FR-04 [공통 가이드 팝업 렌더러 함수]**:
  - `showTabUsageGuide(tabKey)` 단일 함수로 모달 오픈 및 내용 렌더링.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID) | 위치 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 |
| :--- | :--- | :--- | :--- | :--- |
| `homePageGuideBtn` | 홈 탭 헤더 | 클릭 | `showTabUsageGuide('home')` 모달 오픈 | 닫기(X, 바깥) 정상 작동 |
| `goalsPageGuideBtn` | 목표 탭 헤더 | 클릭 | `showTabUsageGuide('goals')` 모달 오픈 | 닫기 정상 작동 |
| `calPageGuideBtn` | 일정 탭 헤더 | 클릭 | `showTabUsageGuide('calendar')` 모달 오픈 | 닫기 정상 작동 |
| `commPageGuideBtn` | 소통 탭 헤더 | 클릭 | `showTabUsageGuide('comm')` 모달 오픈 | 닫기 정상 작동 |
| `settingsPageGuideBtn` | 설정 탭 헤더 | 클릭 | `showTabUsageGuide('settings')` 모달 오픈 | 닫기 정상 작동 |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Schema)
- 단순 모달 및 UI 가이드 추가이므로 기존 유저 상태(아바타, 목표, 기록 등) 데이터 영향도 0%.
- 헌법 제18조 `index.html` 총 줄 수 22,196줄 정확히 보존 (순증가 0줄 엄수).
  - 가이드 함수 로직 및 템플릿은 모듈형 스크립트(`js/tab-guides.js` 또는 기존 헬퍼)에 외부화하거나 효율적 압축으로 줄 수 변동 0 유지.

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)
- 모바일 뷰포트 폭 360px 이하 초소형 기기에서 헤더 버튼 래핑(wrap) 방어: `white-space:nowrap`, 반응형 플렉스 적용.
- 닫기 버튼 누르거나 모달 배경 터치 시 즉시 닫힘 보장.

---

## 5. [원칙 ⑤] 해결 절차 정리
1. 브랜치 `feat/all-tabs-guide-and-mission-hint` 생성.
2. REQ / PLAN 문서 작성.
3. `js/tab-guides.js` 신규 모듈 생성: 5대 탭별 가이드 데이터 및 `showTabUsageGuide(tabKey)` 엔진 구현.
4. `index.html`에 스크립트 로드 및 각 탭 헤더 버튼 마운트, `renderTodayMissionCard` 힌트 텍스트 추가.
5. `index.html` 총 줄 수 22,196줄 검증.
6. `npm test` 245개 테스트 100% 통과 확인.
7. Chrome 브라우저 실물 캡처 검증.
8. 로컬 main 병합.
