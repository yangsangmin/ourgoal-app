# 요구사항 정의서 (REQ) — 홈 경험치창·각 탭 우측상단 프로필·설정창 아바타 아이콘 크기 일괄 확대

> **문서 ID**: REQ-TASK-ES-298-AVATAR-ICON-ENLARGE-ALL  
> **티켓 연계**: #TASK-ES-298  
> **작성 일시**: 2026-09-26  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**: "홈 경험치창, 각 탭 우측상단 프로필, 설정창의 아바타 아이콘 크기를 일괄 확대하여 시인성과 애착을 극대화할 것." (노션 생각 메모장 DB [48]번)
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  - 홈 화면의 레벨 배지 영역 내 아바타, 전 탭 우측 상단 탑바 아바타, 설정 탭 히어로 카드 아바타의 크기가 모바일 환경에서 다소 왜소하여 유저가 정성껏 성장시킨 캐릭터와 오라의 시각적 매력 및 애착을 온전히 느끼기 어려움.
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**: 설정창 아바타 슬롯(64px) 및 상단바(52px)의 크기 비례가 보수적으로 묶여 있어 캐릭터 디테일과 뱃지 오버레이가 작게 체감됨.
  - **2층 (구조/프로세스 부재)**: 홈 경험치창(72px ➔ 76px), 탑바(52px ➔ 56px), 설정창(64px ➔ 76px) 3개 핵심 거점의 아바타 크기가 개별적으로 분산되어 있어 일괄적인 애착 극대화 규격 튜닝 부재.
  - **3층 (시스템/유저 체감 괴리)**: 아워골은 갓생 실천과 아바타 성장이 결합된 게이미피케이션 플랫폼인데, 아바타의 물리적 시인성이 작아 유저의 몰입감과 자부심이 저하됨.
- **사용자 상황 및 페르소나**: 매일 체크인과 목표 달성으로 아바타를 성장시키며 나만의 페르소나에 깊은 애착을 느끼는 모바일 375px 실사용자.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: E1 (체크인 루프 및 아바타 육성) / RPG / UX
- **[본질] (Essence)**: 홈 경험치창, 전 탭 상단바, 설정창 3대 거점 아바타 아이콘 일괄 확대를 통한 캐릭터 애착 및 시각적 효능감 증대.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1**: 초기 컴팩트 UI 설계로 인해 설정창 히어로 아바타가 64px, 상단바 아바타가 52px에 머물러 있음.
  2. **원인 2**: 모바일 375px 환경에서 레이아웃 오버플로우 걱정으로 크기 확대를 일괄적으로 적용하지 못했음.
  3. **원인 3**: 4위 1체(마크업-리스너-로직-피드백) 직통 아바타 일괄 확대 제어 및 동기화 체계 부재.
- **[중심] (Core Bottleneck & Anchor)**: 홈 배지 아바타(76px), 탑바 아바타(56px), 설정창 히어로 아바타(76px)로 일괄 확대하고 모바일 375px에서 가로 오버플로우 0px을 달성하는 조형적 튜닝 및 `handle아바타_Item48Action` 직통 배선.
- **[핵심] (Critical Safety & Termination)**: 기존 320종 아바타 데이터, 장착 상황 키, 레벨 경험치 및 랭크 오라의 100% 불파괴 보존.
- **체감 가설 (User Experience Hypothesis)**:
  > *"홈 화면 경험치창, 모든 탭 상단바, 그리고 설정 화면에 들어설 때마다 내 아바타가 큼직하고 선명하게 반겨주어 캐릭터에 대한 애정과 갓생 성취감이 크게 고양된다."*
- **기존 전체 기능 영향도 분석**:
  - 계정/로그인(세션, 게스트, 소셜)에 미치는 영향: 영향 없음 (세션 유지).
  - 홈 화면 및 스트릭에 미치는 영향: 영향 없음 (데이터 불변 보존).
  - 기록/통계/캘린더/설정 탭에 미치는 영향: 4대 뷰 동시 전파로 상태 일관성 보장.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것 (Avoid)**: 아바타 렌더링 SVG 엔진 전면 교체, 상단바 헤더 레이아웃 붕괴, 불필요한 서드파티 라이브러리 추가.
- **해야 할 것 (Action)**:
  1. `index.html` 내 `levelBadgeHtml`의 아바타 렌더 사이즈를 72px에서 76px로 확대.
  2. `index.html` 내 `topAvatar`의 탑바 아바타 사이즈를 52px에서 56px로 확대.
  3. `index.html` 내 `renderSettingsScreen`의 설정 히어로 아바타 사이즈를 64px에서 76px로 확대.
  4. `js/components.js`에 `handle아바타_Item48Action` 직통 핸들러 및 `enlargeAvatarIconsBatch` 구현/export.
  5. 홈 화면에 `#og-task-48-container` 및 `#og-task-48-action-btn` 마크업 마운트.
  6. 12ms 햅틱 진동, `og_task-48_cache` 로컬 캐시 원자적 저장, 4대 뷰 동시 전파.
  7. `ui.css`에 아바타 일괄 확대에 따른 375px 모바일 레이아웃 최적화 및 44px 터치 타겟 스타일 반영.
- **왜 이 방식이어야만 하는가 (Why this approach)**: 상민님 지시를 100% 충족하면서 다른 요소를 해치지 않는 최적의 비례를 완성하는 해법.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**: Supabase `user_settings` 및 `user_interactions` 호환 보존.
- **2호 (스마트 스토리지 분기 설계)**: `og_task-48_cache` 로컬 캐시 원자적 갱신.
- **3호 (4대 뷰 전파 배선도)**: 액션 발동 시 `renderHome`, `renderRecordsScreen`, `renderCalendar`, `renderGoalsScreen`, `renderSettingsScreen` 원자적 동시 호출.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `og-task-48-action-btn` | 홈 화면 경험치 배지 하단 허브 | 클릭/터치 | 아바타 크기 일괄 확대 모드 토글/동기화 및 저장 | 12ms 햅틱 + 토스트 알림 |
| `topUserChip` | 전 탭 상단 탑바 우측 | 클릭/터치 | 확대된 56px 아바타 표출 및 아바타 모달 오픈 | 12ms 햅틱 + 모달 오픈 |
| `sanctuaryAvatarBadge` | 홈 탭 경험치 배지 영역 | 클릭/터치 | 확대된 76px 아바타 표출 및 아바타 변경 모달 오픈 | 12ms 햅틱 + 모달 오픈 |
| `settingsHeroAvatarSlot` | 설정 탭 히어로 카드 | 확인/터치 | 확대된 76px 아바타 링 및 레벨 뱃지 표출 | 시각적 피드백 유지 |

---

## 4. [원칙 ④] 구현 즉시 완료 (Immediate Completion Plan)
- **코드 수정 범위**:
  - `index.html`: `#og-task-48-container`, `#og-task-48-action-btn`, 아바타 크기 파라미터 튜닝
  - `js/components.js`: `handle아바타_Item48Action`, `enlargeAvatarIconsBatch`
  - `ui.css`: `.toss-settings-avatar-wrap`, `#topAvatar`, `#og-task-48-container`
  - `tests/avatar-icon-enlarge-all.test.js`: 통합 검증 테스트 작성
  - `scripts/smoke-test.js`: 스모크 단언문 추가
- **완료 정의 (DoD)**:
  1. 홈 경험치창 아바타 76px, 전 탭 탑바 아바타 56px, 설정창 히어로 아바타 76px 확대 적용.
  2. 모바일 375px 뷰포트에서 가로 스크롤(오버플로우) 0px 유지.
  3. 모든 버튼 dead-click 0건, 44px 터치 규격 만족.
  4. smoke-test 및 court 검사 ALL PASS 달성.
