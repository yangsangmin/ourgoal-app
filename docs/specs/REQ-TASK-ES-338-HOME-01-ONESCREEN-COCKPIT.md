# 요구사항 정의서 (REQ) — HOME-01 홈 원스크린 콕핏 (무스크롤 첫 화면 + 85vh 상세 바텀시트)

> **문서 ID**: REQ-TASK-ES-338-HOME-01-ONESCREEN-COCKPIT  
> **티켓 연계**: #TASK-ES-338 (노션 「아워골 UI/UX 대개편 작업 티켓 DB」 HOME-01 — https://app.notion.com/3ee598db9096810bb0edca3305347371)  
> **작성 일시**: 2026-10-04  
> **작성자**: Claude Code 세션 baf85964 (Opus 5.5)  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

## 지시 원문

- 상민님 2026-10-03: "아워골 UI/UX 대개편 작업 티켓 DB의 작업대상들 조회가능해?" → 18건 목록 보고 → "1번 진행"
- 티켓 HOME-01 원문(노션 속성 그대로)
  - **AS-IS (레드팀 비판)**: 레거시 목표리스트, 평가 배너, 잔디 요약, 기기 설치 안내 등 7단계 계층이 수직으로 길게 늘어져 유저에게 극심한 스크롤 피로와 인지 과부하 유발.
  - **TO-BE (해결책)**: 메인 화면을 375px 모바일 뷰포트 기준 단일 무스크롤 원스크린(100vh)으로 단정화하고, 복잡한 세부 리스트 및 부가 기능은 85% 대형 바텀시트로 점진적 공개.
  - **기능 동작 & 촉각 피드백**: 메인 영역 height: 100vh 고정, 세부 시트 호출 시 0.3초 슬라이드 업 및 배경 30% 암막 처리, 12ms 햅틱 진동.
  - **화면 구성 & UX 라이팅**: [상단] 아바타/EXP 펄스 + [중앙] 오늘 1순위 실천 콕핏 + [하단] 3대 미니 나침반(퀘스트/동류/회고). (UX 라이팅: "오늘도 올바른 길로 가고 있어요, 내 자신 🌿")
  - **시스템 연계 안정성**: js/tabs/home/index.js, OurgoalSanctuaryV3 단일 렌더러 귀속, 4대 뷰 상태 0ms 동기화.

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)

- 2026-10-03 origin/main(e0cefdc) 을 375×812(모바일 에뮬레이션, 게스트 진입)로 열어 잰 값: 문서 스크롤 높이 **1470px** = 화면의 1.81배.
- 첫 화면에 보이는 섹션(위에서부터): `#sanctuaryTopBar`(72px) → `#homeHeadlineSentence`(51px) → `#captureCardBox` 체크인 카드(440px) → `#crewPacingWidget` 동반자 레이스(299px) → `.home-recent-title` + `#homeGoalList` 오늘 목표 목록(270px).
- 체크인 카드 아래 두 섹션(약 570px)이 첫 화면 밖으로 밀려 스크롤해야 보이고, 동반자 레이스는 하단 메뉴 뒤에 걸쳐 잘린다.
- 하단 여백이 이중이다: `main.screens` 의 `padding-bottom: calc(var(--nav-h)+safe+48px)`(108px) 위에 `#screen-home` 의 `padding-bottom: max(96px, …) !important`(96px)가 또 붙는다(ui.css 9108·9112행).

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)

- **본질**: 홈은 "1초 콕핏"이다. 앱을 열면 오늘 무엇을 할지(체크인)와 어디로 갈지(목표·동반자·회고)가 손가락 한 번 안에 있어야 한다. 스크롤은 이 1초를 깨뜨린다.
- **원인**: 기능이 추가될 때마다 `#screen-home` 의 flex 열(order 1~34)에 카드가 세로로 쌓였고, 세부 목록을 접어 두는 계층(시트)이 없었다. 하단 안전 여백은 두 규칙이 각각 더해 이중으로 들어갔다.
- **중심**: `#screen-home` 의 직계 자식 배치(ui.css 10220~10238행 order 규칙)와 `#crewPacingWidget`·`#homeGoalList` 두 대형 섹션.
- **핵심**: 두 섹션을 **지우지 않고** 노드째 시트로 옮겨야 한다. 이 노드들은 `renderHome()`(목표 목록), 동반자 집계(index.html 13999행 `getElementById('crewPacingWidget')`), 홈 구성 숨김(`js/customize.js` 의 `[data-home-widget]` 스캔)이 ID 로 찾는다. ID 와 노드가 살아 있으면 이 세 경로가 그대로 동작한다.

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)

- 신규 소블록 `js/tabs/home/sub-onescreen.js`(`window.OurgoalHomeOneScreen`)를 만들어 홈 메가블록(`js/tabs/home/index.js`)에 등록한다.
  1. `#captureCardBox` 아래에 **3대 미니 나침반** `#homeCompassRow` 를 둔다: `#homeCompassQuest`(오늘 목표 → 시트) · `#homeCompassCrew`(동반자 → 시트) · `#homeCompassReflect`(회고 → `setTab('records')`).
  2. body 아래에 **85vh 바텀시트** `#homeDetailSheet`(배경 `#homeDetailBackdrop` 30% 암막, 패널 `#homeDetailPanel` 0.3초 슬라이드 업)를 두고, `.home-recent-title`·`#homePositionStrip`·`#homeGoalList` 는 `#homeSheetPanelQuest` 로, `#crewPacingWidget` 은 `#homeSheetPanelCrew` 로 옮긴다.
  3. 원스크린 상태(`#screen-home.home-onescreen`)에서만 홈 자체의 이중 하단 여백을 걷어낸다. 하단 메뉴 여백은 `main.screens` 가 계속 준다.
- 시트를 body 에 두는 이유: `.screen` 의 `will-change: opacity, transform`(ui.css 260행)이 `position: fixed` 의 기준 상자를 홈 영역으로 가둬, 홈 안에 두면 시트가 화면 전체가 아니라 홈 상자 크기로 뜬다(실측: 패널 690px 이 화면 위쪽 0px 부터 시작).

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)

- 이번 변경은 화면 배치만 바꾸고 저장 데이터를 새로 만들거나 바꾸지 않는다. 목표·체크인·동반자 데이터의 읽기/쓰기 경로(`renderHome`, `saveProfile`, Supabase 동기화)는 손대지 않는다.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)

| 요소 ID | 행동 | 결과 | 피드백 |
| :-- | :-- | :-- | :-- |
| `#homeCompassQuest` | 누름 | 시트 열림, 제목 "🎯 오늘 목표", `#homeGoalList` 보임 | 12ms 햅틱, 0.3초 슬라이드 |
| `#homeCompassCrew` | 누름 | 시트 열림, 제목 "🏃 동반자", `#crewPacingWidget` 보임 | 12ms 햅틱 |
| `#homeCompassReflect` | 누름 | 기록/통계 탭으로 전환 | 12ms 햅틱 |
| `#homeDetailClose` | 누름 | 시트 닫힘, 포커스를 연 나침반으로 되돌림 | 12ms 햅틱 |
| `#homeDetailBackdrop` | 누름 | 시트 닫힘 | 12ms 햅틱 |
| `#homeDetailHandle`·`.home-detail-head` | 아래로 80px 이상 쓸기 | 시트 닫힘 | 12ms 햅틱, 손가락 따라 패널 이동 |
| 브라우저/기기 뒤로가기 | 누름 | 시트만 닫힘(앱 이탈 없음). 시트 위 모달이 열려 있으면 모달만 닫힘 | — |
| Esc | 누름 | 시트 닫힘 | — |
| 시트 안 `#btnCrewStartCheckin` | 누름 | 시트를 먼저 닫고 기존 `focusHomeCheckinInput()` 실행 | 기존 동작 |
| 홈 탭 이탈 | 하단 메뉴로 다른 탭 | 열린 시트 자동 닫힘 | — |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Schema)

- DOM 노드를 `appendChild` 로 옮길 뿐 복제·삭제하지 않는다. 노드에 붙은 이벤트 리스너와 ID 는 그대로 유지된다. 저장 스키마 변경 없음.

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)

- **기능 삭제가 아닌가(승인선 ③)**: 두 섹션은 그대로 있고 나침반 한 번으로 열린다. 진입점이 생기기 전에 옮기지 않는다(조립 순서: 나침반 → 시트 → 이동).
- **기존 모달과 겹침**: 시트 z-index 90 < `.modal-overlay` 100. 시트 안 "새 목표"(`#homeAddGoal`)가 여는 모달은 시트 위에 뜬다. 모달을 닫을 때 `closeModal()` 이 부르는 `history.back()` 이 시트까지 닫지 않도록, 시트는 자기가 넣은 기록(`ourgoal_home_sheet`)이 빠질 때만 닫는다.
- **홈 구성에서 동반자 위젯을 숨긴 사용자**: 시트를 열면 빈 패널 대신 `#homeSheetEmpty` 안내("홈 구성에서 숨겨 둔 항목이에요…")를 보인다.
- **100vh 고정**: 티켓은 `height: 100vh` 고정을 적었지만, 고정 높이는 812px 보다 작은 폰(예: 667px)에서 체크인 버튼을 잘라 낸다. 내용이 375×812 한 화면에 들어가게 줄이고, 더 작은 화면에서는 스크롤로 남긴다(잘림보다 스크롤이 안전). 이 차이는 PR 에 적는다.
- **이번 PR 범위 밖(후속 티켓)**: [상단] 아바타/EXP 펄스 확대 = HOME-02, UX 라이팅 문구 전면 교체 = HOME-11, OurgoalSanctuaryV3 단일 렌더러 귀속 = 현재 홈은 `#sanctuaryHomeSlot` 이 꺼져 있어(`display:none`) 이번에 붙일 대상이 없다. 이 항목들은 주장 파일에 요구사항으로 그대로 옮기되 주장을 걸지 않는다(확인 못 함으로 남는다).

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)

1. `js/tabs/home/sub-onescreen.js` 작성 — `build()`(나침반·시트 조립, 노드 이동), `wire()`(닫기 4중·뒤로가기·탭 이탈·목표 수 관찰), `open(key)`/`close()`, `refreshCounts()`.
2. `js/tabs/home/index.js` `init()` 에 `OurgoalHomeOneScreen` 등록, `index.html` 에 스크립트 태그 추가.
3. `ui.css` 끝에 HOME-01 블록 추가(나침반 3열 그리드, 시트, 원스크린 여백·간격).
4. 375×812 실측(스크롤 높이·나침반 하단·하단 메뉴 상단) 및 상호작용 실측.
5. `npm test` 예비 검사.
6. 주장 파일·시나리오·dev_log·TICKETS 등재 → 초안 PR → 법정 심사.

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)
> *(주의: 본 원칙은 절차 정리(⑤)와 단계별 실행(⑦) 사이에 반드시 독립적으로 존재해야 하며, 생략하거나 타 원칙과 합치는 것은 위헌입니다)*

- **반론 1 — "노드를 옮기면 renderHome 이 목록을 못 찾는다"**: `renderHome` 은 `getElementById('homeGoalList')` 로 찾는다. 노드가 문서 안에 있으면 위치와 무관하다. 실측: 옮긴 뒤 시트 안 목표 카드 1개가 그려지고, 나침반 보조 문구가 "1개 진행 중"으로 갱신됐다.
- **반론 2 — "홈 메가블록 폴백(mountedCount===0 → renderHome)이 흔들린다"**: 기존 소블록 3개가 이미 등록돼 mountedCount 는 0 이 아니다. 새 소블록의 `mount()` 는 중복 호출에 안전하다(`_built` 가드). 첫 진입은 탭 전환 없이 홈이 보이므로 스크립트 로드 시 1회 자가 조립한다.
- **SPOF**: 필수 노드(`#screen-home`·`#captureCardBox`·`#crewPacingWidget`·`#homeGoalList`) 중 하나라도 없으면 `build()` 는 아무것도 옮기지 않고 끝낸다 — 기존 세로 배치가 그대로 남는다(퇴화 없음).

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)

- 375×812 에서 문서 스크롤 높이 ≤ 812px, `#homeCompassRow` 하단 < 하단 메뉴 상단.
- 첫 화면에서 `#crewPacingWidget`·`#homeGoalList` 가 보이지 않고, 나침반으로 열면 보인다.
- 닫기 4중(✕·배경·쓸기·뒤로가기)과 Esc, 탭 이탈 시 자동 닫힘이 동작한다.
- `npm test` 통과, 페이지 예외 0건.

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)

- 법정 시나리오에는 "스크롤 높이" 확인 낱말이 없다 → 첫 화면 구성은 `visible`/`notVisible` 로, 스크롤 높이 수치는 작업자 실측(PR 본문)으로 낸다.
- 손가락 쓸기와 실제 안드로이드 뒤로가기는 법정 도구로 못 잰다 → `unverified`(needs-real-device) + [손 필요] 안내.
- 조건부 배너(`#notifyBannerSlot`·`#iosPwaSlot`·`#homeEvalBanner` 등)가 뜨는 사용자는 한 화면을 넘을 수 있다 → 배너 정리는 HOME-06 범위로 넘기고 PR 에 적는다.
