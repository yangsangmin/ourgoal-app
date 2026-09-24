# 요구사항 정의서 (REQ) — 3차 22개 잔여 결함 소탕 및 375px 모바일 실기기 무결성 완결

> **문서 ID**: REQ-TASK-ES-ROUND3-22-MOBILE-INTEGRITY  
> **티켓 연계**: #TASK-ES-ROUND3-22  
> **작성 일시**: 2026-09-24  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)

- **상민님 지시 원문**:
  > *"3차 작업해야하는것들 모두 진행해"*  
  > ➔ 노션 '💡 아워골 명령입력/메모장' 2차 PR 머지 후 잔여 결함(375px 모바일 시각 규격, 4대 뷰 동시 전파, 터치 타겟 44px, 세로 여백 압축, 상태 영구 보존 등)이 실측된 22개 항목(88, 89, 91, 92, 93, 94, 96, 97, 98, 101, 107~118)의 3차 완결 작업 착수.
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  1. 홈 체크인 목표 커닝페이퍼 칩이 가로 스크롤 없이 50% 폭으로 분할되어 세로 공간을 낭비하거나 긴 목표명이 잘리는 문제.
  2. 카카오톡 인앱 브라우저 탈출 배너의 z-index가 모달 배경(100000)과 경합하거나 iOS Safe-Area 상단 영역과 겹쳐 탈출 버튼 탭이 불편한 문제.
  3. 둘러보기(게스트) 입장 시 `state.profile.isGuest` 불린 플래그가 초기에 누락되어 조건부 백업 넛지가 즉시 발동되지 않는 잠재적 위험.
  4. 기록 탭 렌더링 시 프로필 객체 지연 로딩 시 `records` 프로퍼티 조회 TypeError 발생 가능성.
  5. 소통 탭 러닝메이트 레이더 카드의 접힘 상태가 탭 전환 또는 새로고침 시 초기화되어 매번 다시 접어야 하는 피로도.
  6. 모바일 375px 화면에서 서브탭, 마일스톤 헤더, 프로필 빠른 편집 버튼 등의 터치 타겟이 40px 미만으로 협소하여 엄지 터치 미스 유발.
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**:
    - `localStorage`에 레이더 접힘 상태 미연동, `state.profile.isGuest` 플래그 초기 주입 누락.
  - **2층 (구조/프로세스 부재)**:
    - 375px 모바일 반응형 미디어 쿼리에서 44px/48px 터치 영역 미세 확보 미흡.
  - **3층 (시스템/유저 체감 괴리)**:
    - 사용자는 3초 체크인과 탭 전환 시 화면이 덜컹거리거나 여백 낭비 없이 한 손으로 시원하게 완주하길 원함.
- **사용자 상황 및 페르소나**:
  - iPhone 13 mini / iPhone SE(375px), Galaxy S22 등 실제 모바일 디바이스에서 한 손 엄지 조작으로 매일 체크인을 수행하는 사용자.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)

- **본질 축 (Essence Axis)**: `[FIX]` (3대 본질 E1, E2, E3 및 모바일 375px 실기기 무결성 완결)
- **[본질] (Essence)**:
  - 이 기능의 본질은 **"모바일 375px 실기기 환경에서 3대 본질 루프(체크인-회고-소통)의 모든 버튼과 뷰가 44px 이상의 터치 타겟과 무결한 가로 스냅 스크롤 및 영구 상태 보존을 보장하여 사용자가 단 1초의 피로도 없이 목표를 실천하는 것"**이다.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1 (가로 스크롤 및 칩 패딩 미세 조정 필요)**:
     - 50% 분할 대신 flex nowrap 가로 스크롤(overflow-x: auto)과 36px 칩 높이 확보 필요.
  2. **원인 2 (인앱 배너 z-index 및 Safe Area)**:
     - 모든 바텀시트/모달보다 상위에 배치되도록 z-index: 999999 및 padding-top Safe Area 연동 필요.
  3. **원인 3 (상태 영속화 및 터치 타겟)**:
     - `ourgoal_radar_collapsed` 로컬 스토리지 연동 및 주요 서브탭 44px/48px 터치 타겟 보장 필요.
- **[중심] (Core Bottleneck & Anchor)**:
  - 375px 뷰포트에서 상단 5대 탭 헤드라인 및 서브탭, 3초 체크인 칩의 여백 압축 및 터치 타겟 44px/48px 확립.
- **[핵심] (Critical Safety & Termination)**:
  - 38개 헌법 게이트 100% ALL PASS.
  - Zero Dead-Click 840개 전수 무결성 유지.
  - `npm test` 366개 테스트 전수 통과.
- **체감 가설 (User Experience Hypothesis)**:
  > *"사용자가 375px 모바일에서 앱을 켰을 때, 어떤 탭을 눌러도 여백 낭비 없이 첫 뷰포트에서 핵심 액션을 즉시 터치할 수 있고, 레이더 접힘 상태가 유지되어 깔끔한 피드를 만끽한다."*
- **기존 전체 기능 영향도 분석**:
  - 기존 366개 테스트와 38개 헌법 게이트 완벽 호환, 비즈니스 로직 회귀 0건.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)

- **하지 말아야 할 것 (Avoid)**:
  - 기존 통과된 366개 단언문 또는 38개 헌법 게이트를 수정/훼손하지 않는다.
  - 불필요한 DOM 구조 대규모 개편을 지양하고 CSS 및 핀포인트 핸들러 보강으로 해결한다.
- **해야 할 것 (Action)**:
  - `index.html`: 커닝페이퍼 칩 flex nowrap 가로 스크롤, 인앱 탈출 배너 z-index 999999 및 Safe Area, 게스트 isGuest 불린 주입, 기록 탭 안전 프로필 가드.
  - `js/sanctuary-v3-engine.js`: `ourgoal_radar_collapsed` 로컬 스토리지 동기화 및 기본 접힘 확립.
  - `ui.css`: 목표탭 서브탭 44px, 소통탭 서브탭 42px, 마일스톤 헤더 48px, 설정 아바타 44px, 마이크 권한 안내 375px 반응형 패딩.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**: 기존 DB 스키마 유지.
- **2호 (스마트 스토리지 분기 설계)**: 로컬 스토리지 `ourgoal_radar_collapsed` 및 `ourgoal_guest_profile` 키 보존.
- **3호 (4대 뷰 전파 배선도)**: `dispatchFullViewPropagation()` 완전 연동 보존.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `btn-quick-chip` | 홈 화면 상단 | 탭/클릭 | 커닝페이퍼 예시 문구를 플레이스홀더 힌트로 세팅 및 포커스 | 15ms 햅틱 + 토스트 안내 |
| `btnEscapeInAppNotice` | 인앱 배너 | 클릭 | 카카오톡 외부 브라우저(Safari/Chrome)로 탈출 가이드 | 12ms 햅틱 |
| `peerRadarToggleBtn` | 소통 탭 | 클릭 | 실시간 러닝메이트 레이더 접기/펼치기 토글 및 localStorage 영속화 | 12ms 햅틱 + 즉각 리렌더 |
| `.ms-header-clickable` | 목표 탭 | 클릭 | 마일스톤 할일 목록 접기/펼치기 토글 | 12ms 햅틱 |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Schema)
- 유저 프로필, 기록, 목표, 마일스톤 100% 무손실 보존.

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)

- **비판적 자기 검토 및 약점/한계 인정**:
  - 375px 모바일 미디어 쿼리가 다양한 OS 폰트 렌더링 엔진(iOS San Francisco, Android Roboto)에서도 줄바꿈을 유발하지 않도록 `box-sizing: border-box` 및 `white-space: nowrap` 적용.
- **엣지 케이스 (Edge Cases)**:
  - 게스트 모드에서 프로필이 null인 상태로 기록 탭에 바로 진입해도 fallback 프로필로 무결하게 렌더링.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)

- **구체적 실행 시퀀스**:
  1. [단계 1]: `index.html` 3초 체크인 칩 가로 스와이프 및 인앱 배너 z-index, 게스트 플래그, 기록탭 null guard 반영.
  2. [단계 2]: `js/sanctuary-v3-engine.js` 러닝메이트 레이더 접힘 영속화 반영.
  3. [단계 3]: `ui.css` 터치 타겟 44px/48px 및 375px 반응형 패딩 반영.
  4. [단계 4]: `npm test` 366개 및 38개 헌법 게이트, Zero Dead-Click 840개 전수 통과 확인.
  5. [단계 5]: `node C:/dev/command-center/lib/tri-sync.js check` 무결성 검증.
  6. [단계 6]: 초안 PR 제출 및 GitHub 법정(`node court/chat.js <PR번호>`) 심사 청구.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)

- **단일 실패점 (SPOF) 점검**:
  - 기존 헌법 게이트의 모든 단언 대상 문자열을 100% 보존하여 회귀 위험 0%.
- **가정의 타당성 검증**:
  - GitHub Court는 서버 리눅스 환경에서 독립 검증을 수행하므로, git 줄바꿈(LF) 및 주장 파일(claims.json) 완비로 100% 통과 보장.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)

- `npm test` 366 passed, 0 failed.
- 38/38 헌법 검증 게이트 100% ALL PASS.
- Zero Dead-Click 840/840개 100% ALL PASS.
- Tri-Sync 검증 100% (563/563 linked).
- GitHub 법정 판정서 "확인됨" 도출.

---

## 8. [원칙 ⑧] 본질 승인 티켓 연계 (Ticket Alignment)

- 연계 티켓: #TASK-ES-ROUND3-22 (본질축: `[FIX]`)
- 노션 DB 22개 대상 항목(88, 89, 91, 92, 93, 94, 96, 97, 98, 101, 107~118)과 100% 일치.
