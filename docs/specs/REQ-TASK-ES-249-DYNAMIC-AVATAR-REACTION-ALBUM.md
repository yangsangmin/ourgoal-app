# 요구사항 정의서 (REQ) — 상황별 다이나믹 아바타 생성 및 VIP 수익화 모델 (세부할일·마일스톤·기록회차별 아바타 리액션 도감)

> **문서 ID**: REQ-TASK-ES-249-DYNAMIC-AVATAR-REACTION-ALBUM  
> **티켓 연계**: #TASK-ES-249  
> **작성 일시**: 2026-09-23  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)

- **상민님 지시 원문**:
  > *"돈많은 사람들을 위한 추가 기능으로 각 상황마다의 추가 아바타 생성은 어때? 세부할일, 마일스톤, 목표달성, 당일 기록 2회차, 3회차 등 나눠서 많은 아바타들을 상황마다 다르게 볼 수 있는거지"*
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  1. 현재 아바타는 1개의 고정된 대표 프로필 아바타만 노출되며, 사용자가 체크인을 1회차, 2회차, 3회차 연속 수행하거나 세부할일·마일스톤을 달성해도 아바타의 시각적 반응(포즈, 소품, 대사)이 단조로움.
  2. 사용자의 애착과 몰입을 자극할 수 있는 다양한 상황별 캐릭터 리액션 수집(성장 앨범/도감) 기능이 부재함.
  3. 열성 유저 및 고과금 유저(VIP)를 위한 프리미엄 아바타 생성권 및 한정판 포즈 팩 등 비즈니스 모델(BM)이 부재하여 수익화 기회가 제약됨.
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**:
    - 상황별 아바타 프리셋(`DYNAMIC_SITUATIONS`) 및 리액션 도감(`OurgoalAvatar.openDynamicAlbumModal`) 렌더링 파이프라인 부재.
  - **2층 (구조/프로세스 부재)**:
    - 캐릭터 일관성(얼굴/헤어/피부톤)을 유지하며 포즈/말풍선을 결합하는 동적 아바타 생성 엔진 미비.
  - **3층 (시스템/유저 체감 괴리)**:
    - 사용자는 내가 달성한 목표와 시간에 따라 아바타가 생생하게 칭찬해주고 다른 모습으로 반겨주길 원함.
- **사용자 상황 및 페르소나**:
  - 매일 3회 이상 체크인을 수행하며 마일스톤을 달성할 때마다 내 캐릭터의 특별한 축하 포즈를 모으고 소장하고자 하는 열성 유저 및 VIP 멤버.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)

- **본질 축 (Essence Axis)**: E1(체크인 루프) & E2(기록 회고) & BM
- **[본질] (Essence)**:
  - 이 기능의 본질은 **"유저의 실제 행동(당일 1~3회차 체크인, 세부할일 완료, 마일스톤 돌파)에 맞춰 아바타가 살아 숨쉬듯 동적으로 반응하고, 이를 성장 앨범(도감)으로 소장하며 고마진 VIP 멤버십을 통해 지속 가능한 수익화를 달성하는 다이나믹 아바타 리액션 엔진"**이다.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1 (상황별 프리셋 부재)**: 체크인 회차와 목표 달성 트리거에 매핑되는 아바타 프리셋 구조 부재.
  2. **원인 2 (도감 UI 및 수집 체계 부재)**: 획득한 다양한 상황별 아바타를 한눈에 모아보고 활성화할 수 있는 모달 부재.
  3. **원인 3 (VIP 수익화 배선 부재)**: 무료 생성권(2회) 및 VIP 정기 생성권/포즈 팩을 관리하는 상태 원장 부재.
- **[중심] (Core Bottleneck & Anchor)**:
  - `js/avatar-system.js` 내 `DYNAMIC_SITUATIONS` 5대 상황 프리셋 선언, `getDynamicAvatarSvg()`, `openDynamicAlbumModal()`, `getVipPassInfo()` 함수 구현.
- **[핵심] (Critical Safety & Termination)**:
  - 기존 유저의 프로필 아바타 100% 무손실 보존.
  - 페이투윈(P2W) 방지: 무료 유저에게도 기본 5대 상황 아바타 및 무료 2회 생성권 보장.
  - 초상권/퍼블리시티권 방어 모달 및 Notice & Takedown 가드레일 배선.
  - `npm test` 365개 이상 전수 통과, 38대 헌법 게이트 및 Zero Dead-Click 100% PASS.
- **체감 가설 (User Experience Hypothesis)**:
  > *"사용자가 아침 1회차, 오후 2회차, 밤 3회차 체크인을 할 때마다 아바타가 다른 옷과 포즈로 따뜻하게 말을 건네고, 마일스톤을 깰 때마다 트로피를 든 한정판 아바타가 도감에 채워져 매일의 실천이 시각적 축제로 체감된다."*
- **기존 전체 기능 영향도 분석**:
  - 계정/프로필: 기존 프로필 아바타 및 세션 100% 유지.
  - 홈 화면: 당일 체크인 횟수에 따른 아바타 카드 말풍선 및 포즈 동적 반응.
  - 설정 화면: 프로필 카드에 `[📖 아바타 도감]` 버튼 신설.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)

- **하지 말아야 할 것 (Avoid)**:
  - 기존 아바타 제작 로직(`OurgoalAvatar.composite3DeformedAvatar`, 77종 바디 테마)을 훼손하지 않는다.
  - 무과금 유저의 체크인/기록을 차단하지 않는다.
- **해야 할 것 (Action)**:
  - `js/avatar-system.js`에 5대 상황별 다이나믹 프리셋 정의:
    1. `checkin_1`: 일상 맞이 ("돌아왔구나! 오늘은 어떤 하루야?")
    2. `checkin_2`: 오후 몰입 ("열심히 달리는 중! 커피 한 잔의 여유 ☕")
    3. `checkin_3`: 야간 안식 ("오늘 하루도 정말 고생 많았어! 🌙")
    4. `todo_done`: 할일 완료 ("해냈다! 하나씩 클리어하는 맛! 💪")
    5. `milestone_break`: 마일스톤 돌파 ("대박! 마일스톤 정복을 축하해! 🏆")
  - `OurgoalAvatar.openDynamicAlbumModal()`로 성장 도감 팝업 렌더링.
  - `OurgoalAvatar.getVipPassInfo()`로 잔여 생성권 및 VIP 패스 상태 관리.
  - `index.html` 내 홈 아바타 및 설정 탭 프로필 카드 연동.
  - `ui.css` 내 도감 카드 그리드 및 글래스모피즘 스타일링.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**: `users` 테이블 내 `dynamic_album` JSONB 컬럼 매핑 (로컬 fallback: `state.profile.dynamicAlbum`).
- **2호 (스마트 스토리지 분기 설계)**: SVG/DataURL 아바타 메타는 `localStorage.getItem('ourgoal_dynamic_album')` 및 프로필에 3중 저장.
- **3호 (4대 뷰 전파 배선도)**: 도감 아바타 변경 시 `renderHome()`, `renderSettingsScreen()` 동시 전파.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `#btnOpenDynamicAlbum` | 설정탭 프로필 카드 | 클릭 | `OurgoalAvatar.openDynamicAlbumModal()` 호출 | 12ms 햅틱 + 모달 표출 |
| `#btnClaimFreeVipPass` | 도감 모달 상단 | 클릭 | 무료 VIP 체험권(추가 생성권 2회) 충전 | 충전 완료 토스트 + 잔여 횟수 즉시 갱신 |
| `.btn-equip-dynamic-avatar` | 도감 카드 내부 | 클릭 | 해당 상황 대표 아바타로 활성화/장착 | 장착 완료 배지 및 홈 화면 동기화 |
| `#btnLegalNoticeAgree` | 사진 등록 전 모달 | 클릭 | 초상권 확인 동의 및 사진 선택 창 오픈 | 동의 거부 시 모달 안전 닫힘 |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Schema)
- 기존 프로필 아바타, 77종 바디 테마 데이터, 기록/체크인 데이터 100% 무손실 보존.

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)

- **엣지 케이스 (Edge Cases)**:
  - 당일 체크인 0회 유저: 기본 프로필 아바타 표출.
  - 당일 체크인 1회 유저: `checkin_1` 포즈 및 인사말 표출.
  - 당일 체크인 2회 유저: `checkin_2` 오후 몰입 포즈 표출.
  - 당일 체크인 3회 이상 유저: `checkin_3` 야간 안식 포즈 표출.
  - 4대 테마(다크, 블랙, 화이트, 도심) 전수 4.5:1 이상 대비 확보.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)

1. `docs/rules/TICKETS.md`에 #TASK-ES-249 티켓 등록.
2. `docs/specs/REQ-TASK-ES-249-DYNAMIC-AVATAR-REACTION-ALBUM.md` 및 PLAN 작성.
3. `js/avatar-system.js`에 5대 상황 프리셋, `getDynamicAvatarSvg()`, `openDynamicAlbumModal()`, `getVipPassInfo()` 구현.
4. `index.html`에 홈 아바타 회차별 반응, 설정탭 프로필 카드 도감 버튼, 초상권 안전 모달 배선.
5. `ui.css`에 도감 모달 및 카드 그리드 반응형 스타일 배선.
6. `reports/TASK-ES-249/claims.json` 및 `scripts/smoke-test.js` 검증 단언문 추가.
7. `npm test` 365개 이상 테스트, 38개 헌법 게이트, Zero Dead-Click 100% PASS 확인.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)

- **단일 실패점 (SPOF) 점검**:
  - `OurgoalAvatar` 객체가 초기화되지 않은 상태에서도 기본 로봇 아바타와 텍스트로 안전하게 폴백되도록 방어 가드 장착.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)

- 5대 상황 프리셋(`checkin_1`, `checkin_2`, `checkin_3`, `todo_done`, `milestone_break`) 100% 정상 선언.
- 도감 모달 및 아바타 장착/체험 파이프라인 100% 정상 작동.
- 38개 헌법 게이트 및 Zero Dead-Click 100% ALL PASS.

---

## 8. [원칙 ⑧] 본질 승인 티켓 연계 (Ticket Alignment)

- 티켓: #TASK-ES-249 (본질축: E1/E2/BM)
- 노션 DB `상민 직접입력 핵심 기능` KF-16 항목과 완벽히 1:1 일치.
