# REQ — #TASK-ES-439 index.html 인라인 「어려움」 묶음 분열 설계 + 시범(체크인 저장 처리기 · 설정 빠른 동작)

- 근거: 상민님 원문(2026-10-05) "미분화 덩어리 분열 작업을 우선순위로 해야하지 않나?" · 코디네이터 지시(쉬움·보통은 빌더 4명이 병렬로 옮기는 중, 이 작업은 그다음 단계 「어려움」을 막힘없이 만드는 길) · 헌법 v2026.10.05-CELL 세포골격 절(CELL_SKELETON · CELL_SPLIT · CELL_SPLIT_PROOF · claims_hygiene) · `docs/specs/MODULE-SPLIT-PROTOCOL.md` · 선례 #TASK-ES-423(PR #744).
- 범위: ① 어려움 묶음 유형 집계 도구와 시험지 선행 실측 도구 ② 유형별 표준 이음매 설계 문서 `docs/architecture/INLINE-HARD-SPLIT-DESIGN.md` ③ 설정 파일로 움직이는 생성기·검사기·조작 비교 하네스 ④ 시범: 어려움 묶음 2개를 동작 그대로 이전 ⑤ 처리 순서·병렬 구역 제안. 기능 추가·삭제 0, 마크업·CSS 이동 0, 동결 파일 0, 시험 기대값 변경 0, retire 0.
- 건드리지 않은 것: 쉬움·보통 빌더 구역(P0·P1·P2)과 2차 빌더 묶음(G064·G043·G044·G094·G061·G052·G177), 안티그래비티 배정 5묶음(「캘린더 날짜 클릭 시 해당 일자 일정 수정/관리 허브 모달」·「RENDER: HOME」·「5대 테마 온톨로지 & 경량 AI 분류기」·「11인 외부 UI/UX 감시 및 개선팀 핵심 기능」·「서버 관리자 API를 통한 기록 및 프로필 복구」). 시범 두 묶음은 모두 지도 등급 「어려움」이다.

## 1. [원칙 ①] 문제 정확히 파악

1. 지도(#423) 기준 어려움 묶음은 68개·23,411줄(지시서의 「64개·약 22,000줄」은 그 뒤 배정·이전을 뺀 근사로 보인다 — 이 REQ 의 수는 모두 도구 산출). 인라인 IIFE 33,363줄 중 70%가 어려움이다.
2. 1차 생성기는 "묶음 안에 옮기지 않는 문이 있으면 멈춘다" — 상태 재대입·로드 중 문·window 노출이 있는 묶음은 하나도 못 옮긴다. 어려움 묶음을 옮길 표준 방법·도구·순서가 없다.
3. 할 일: 왜 어려운지 유형별로 도구로 세고, 유형마다 동작 그대로 옮기는 이음매를 정해 생성기·검사기로 만들고, 시범 1~2묶음으로 측정해 보이고, 빌더 여러 명에게 나눌 순서·구역을 낸다.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 어려움 묶음이 어려운 것은 코드가 길어서가 아니라 **IIFE 한 스코프의 실행 순서와 변수 공유에 기대기 때문**이다 — 로드 중 바로 도는 문, 여러 묶음이 다시 대입하는 변수, 인라인 onclick 이 전역에서 찾는 이름. 옮기면 그 순서·공유가 끊길까 봐 못 옮긴다.
- **원인**: 1차 틀은 "함수 선언만" 옮기는 틀이라 순서·공유를 보존하는 장치(setter 통로, 원래 자리에서 부르는 한 줄, 노출 줄 고정)가 없었다. 또 지도의 시험지 의존(F1)은 이름 포함 근사라 65/68 묶음이 "시험지 선행 필요"처럼 보여, 무엇이 진짜 막힘인지 몰랐다.
- **중심**: 원래 자리에 무엇을 남기고 무엇을 세포로 보내는가의 규칙(분류: move · wrap · keep)과, 그 규칙이 지켜졌음을 생성기와 독립적으로 재는 검사(남은 글자 동일 · setter 빠짐 0 · 이중 처리기 0).
- **핵심**: 상태 선언·window 노출은 원래 자리에 두고(순서·공유 보존), 함수·순수 상수는 옮겨 같은 이름으로 가져오고, 로드 중 문은 본문만 세포 함수로 감싸 원래 자리에서 부른다. 진짜 막힘(시험지 선행)은 실측 도구로 좁혀 구역마다 선행 PR 한 번으로 푼다.

## 3. [원칙 ③] 해결방식

### 3-1. 유형 집계 — `scripts/inline-hard-types.js`

- 지도 JSON + index.html 재파싱. 유형 A1 남의 상태 재대입 · A2 내 상태를 남이 씀 · B1 로드 중 window 노출 · B2 로드 때 이벤트 등록 · B3 로드 중 다른 문 · C 인라인 on*= · D 큰 상수 · E 순환 호출(Tarjan SCC) · F1 시험지 단독 의존(근사) · F1m 시험지 선행 필요(실측) · F2 smoke FN_NAMES · G 800줄 초과 · H 함수 재대입 · I 공용 부품(들어옴 10+) · J 바깥 파일이 window 이름 씀 · K 최상위 this/arguments · L 통로에 없는 인라인 이름 참조(예: BADGES·badgeContext) · M 덮어쓰는 키트(예: js/tabs/home/index.js 의 OurgoalHomeMegaBlock — 코디네이터 2026-10-05 요청, 안티그래비티가 「RENDER: HOME」 에서 막힌 두 유형).
- 처리 단계(1 표준 이음매만 · 2 시험지 선행 뒤 · 3 FN_NAMES 선행·800줄 분할 · 4 기관·개별), 병렬 구역(연속 줄 구간, 겹침 0 검사), 권장 순서. `--write` 로 `inline-hard-types.json` 과 설계 문서 1절 표를 쓴다. 결정적(두 번 실행 md5 동일 — 작업자 측정).

### 3-2. 시험지 선행 실측 — `scripts/inline-hard-test-probe.js`

- 앱 사본에서 묶음을 표준 이음매대로 비운 index.html(남는 문: window 노출·상태 변수·class)을 만들고 그 묶음의 testIndexOnly 시험지만 돌려, 기준 2회 모두 통과였는데 비운 뒤 실패한 시험지를 센다.

### 3-3. 표준 이음매 · 생성기 · 검사기

- 설계 문서 2절(유형마다 이음매·법정 탐침·생성기·verify 근거). 생성기 `gen-inline-hard.js`(설정 `inline-hard-pilot.json`), 검사기 `verify-inline-hard.js`(생성기 분류를 다시 쓰지 않고 결과만 읽는다), 조작 비교 `dom-compare-inline-hard.js`.
- 머리 이음매 구역 자리 표지 6줄(H0 시범·H1~H4·HO 기관) — 병렬 빌더가 서로 다른 표지 아래에 넣어 병합 충돌 0. 구획 주석(===)을 쓰지 않아 지도 묶음 수 189 그대로.
- 유형 L: 생성기가 옮긴 코드가 쓰는 인라인 이름 중 getter 없는 것을 스코프 분석으로 뽑아 expose 에 더한다(이름은 옮기지 않음). 유형 M: 설정 afterTag 로 세포 태그를 키트를 통째로 새로 대입하는 파일 뒤에 붙이고, 머리에 키트 변수가 없으면 지역 변수로 만든다. afterTag 없이 덮어쓰는 키트를 쓰면 생성기가 멈춘다(작업자 측정: 홈 메가블록 키트 설정 → 멈춤, afterTag → 생성·verify ok·모듈 로드 회귀 0).
- 지도 생성기 SEAM_RE 에 「세포화 1차 이음매」를 더함 — #423 이음매 묶음(G007)이 자리 표지·getter 를 담아 「어려움」으로 잘못 분류되던 것을 이음매로(옮길 대상 161 → 160).

### 3-4. 시범 — 어려움 묶음 2개

| 묶음(기준 지도) | 점수 | 유형 | 옮긴 것 | 원래 자리에 남긴 것 | 새 세포 |
| :-- | --: | :-- | :-- | :-- | :-- |
| G096 체크인 입력 글자수 힌트(#TASK-ES-367) 204줄 | 52 | A1 · B2 · F1 | 로드 중 등록 문 2개 → `bindCaptureLiveMeta`(13줄) · `bindCaptureSave`(187줄) | 상태 변수 `liveMeta`·`liveCount`·`capInput`(실행되는 초기값), 구획 주석, 부르는 줄 2개 | `js/tabs/records/checkin-capture.js`(231줄, `OurgoalRecordsKit`) |
| G124 [PHASE 6] COMM-SETTINGS FUNCTIONS 128줄 | 63 | A1 · B1 · C · F1 | `paintSecurityCard`·`refreshSecurityStatus`·`killDeviceSession`·`selectThemeSwatch` | window 노출 8줄, `window._commReactionCounts`, 소통 허브 세 함수(keepRest) | `js/tabs/settings/quick-actions.js`(91줄, `OurgoalSettingsKit`) |

- 통로: 새 getter 22개, setter 1개(`pendingCapturePhoto` — 저장 처리기가 `= null` 대입). 가져오기 6줄(함수 4·감싼 함수 2). 새 전역 0.

## 4. [원칙 ④] 재검토 — 한계(정직하게)

- **소통 허브는 옮기지 않았다**: `#commHubGrid`(하위 탭 전환·응원 칩·안심 DM)는 마크업 인라인 `style="display:none !important;"` 로 숨어 게스트 화면 시나리오로 잴 수 없다(작업자 측정: 시나리오 `waitFor #btnCommHubCrew` → 보이는 요소 0개, 기준·작업 같음). 판례 #745(화면 파일 주장은 게스트 시나리오)를 지킬 수 없어 `keepRest` 로 남겼다. 숨은 UI 를 지울지 살릴지는 승인선 ③ — 별도 티켓.
- **체크인 글자수 힌트 칸은 네 테마 CSS 로 숨어 있다**: 처리기가 `style.display` 를 바꿔도 보이지 않는다(이전 전과 같음). 시나리오는 인라인 style 속성 값으로 잰다.
- 실계정 비교는 하지 않았다: 옮긴 처리기는 게스트·로그인 같은 코드 경로이고, 로그인 상태 저장은 `saveProfile`(옮기지 않음)이 맡는다. 「기록」 저장을 실계정으로 누르면 운영 DB 에 기록 행을 쓰므로 누르지 않았다(되돌릴 수 없는 바깥 행위 회피).
- 조작 비교에서 지운 값 두 가지: 기록 카드의 분 단위 시각(`>HH:MM<`), 기본값 `lastStreakAwarded:0` 이 저장되는 시점 — 둘 다 같은 앱 두 번 실행(기준 대 기준·후 대 후)에서도 갈렸다(`dom-compare-inline-hard-reversed.json` 이전 판 측정).
- 기준 사본(`git archive`)은 git 이력이 없어 `tests/cell-map-export-es414.test.js` 의 이력 비교 1건이 기준 쪽에서만 실패한다(작업 트리 16/16).
- 지도 묶음 번호는 앞 묶음이 사라지면 밀린다 → 구역은 줄 구간 + 제목으로 식별(설계 문서 5절 ②).

## 5. [원칙 ⑤] 절차

worktree `C:/dev/wt/inline-hard`(브랜치 `feat/2026-10-05-task-es-439-inline-hard-design`, 기준 origin/main a89ce00 → 합친 뒤 eb9e6e4) → 지시함·헌법 세포골격 절·#423 REQ·생성기·verify·프로토콜 정독 → 지도 재생성 → 유형 집계 도구 → 시험지 선행 실측 도구 → 생성기·검사기(변조 3건 FAIL 확인) → 시범 설정·생성 → verify → 모듈 로드 탐침 → 신고서·설명·가드·지도 → npm test·tests 기준/후 → 게스트 조작 비교(기준 2회·후 1회, 순서 바꿔 한 번 더) → 법정 형식 시나리오 기준/작업 + 돌연변이 → tab-check 해당 탭 기준 2회·후 1회 → 설계 문서·REQ·주장 → 커밋 → 세포지도 재생성 → PR → 법정.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "로드 중 문을 함수로 감싸면 그 안의 `var` 가 IIFE 변수에서 지역 변수로 바뀌어 동작이 달라진다." → 생성기가 감쌀 문 안에서 IIFE 스코프로 끌어올려지는 바인딩을 찾으면 감싸지 않고 원래 자리에 둔다(`wrapSafe`). 감싼 두 문은 최상위 바인딩 0, 최상위 this/arguments·return 0. 측정: verify ③ 남은 글자 동일(이전 전 262,622토큰 = 이후 262,622토큰, 주석 제외), ⑥ 처리기 수 804 = 802 + 2, 게스트 조작 200값 차이 0(빈 저장·두 번 저장·기록 수 26→27·첫 기록 내용·피드백 유무).
- 반론 2: "상태 변수를 getter 로 읽으면 다른 묶음이 다시 대입한 값과 어긋나거나, 옮긴 코드의 대입이 원래 변수에 안 들어간다." → getter 는 읽을 때마다 원래 변수를 읽고, 옮긴 코드가 대입하는 이름은 setter 가 원래 변수에 넣는다. verify ④ 가 `L.x` 대입마다 setter 를 센다(빠짐 0). 측정: 저장 뒤 사진 대기값 초기화·입력칸 비움·힌트 꺼짐이 기준과 같은 값(조작 비교·시나리오).
- 반론 3: "구역 자리 표지는 아무도 안 쓰면 군더더기 6줄이다." → 표지는 주석이라 동작 0이고, 같은 PR 에서 인라인이 207줄 줄었다(순증가 0 충족). 병렬 빌더 4명이 같은 자리에 이음매를 넣으면 매번 충돌이 나는 것을 표지가 막는다(작업자 측정: `git merge-file` 인접 표지 각각 삽입 → 종료 코드 0).

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- DOM: `#captureInput`, `#captureLiveMeta`, `#captureCharCount`, `#captureSave`, `#capturePhotoPreview`, `#btnSettingsSecurityRefresh`, `#badge2faStatus`, `#securityCardDeviceName`, `#btnDeviceKillSwitch`, `#btnThemeSwatchDark`·`Light`·`Midnight`·`Warm`, `#commHubGrid`(숨음 — 옮기지 않음), `#toast`.
- 함수: `bindCaptureLiveMeta`, `bindCaptureSave`, `paintSecurityCard`, `refreshSecurityStatus`, `killDeviceSession`, `selectThemeSwatch`, `switchCommSubTab`·`triggerFloatingReaction`·`openInAppDmSheet`(남김), `OurgoalAppScope.expose`, `OurgoalRecordsKit`, `OurgoalSettingsKit`.
- 파일: `index.html`, `js/tabs/records/checkin-capture.js`, `js/tabs/settings/quick-actions.js`, `scripts/inline-hard-types.js`, `scripts/inline-hard-test-probe.js`, `scripts/inline-script-map.js`, `docs/architecture/INLINE-HARD-SPLIT-DESIGN.md`·`inline-hard-types.json`·`inline-hard-test-probe.json`·`INLINE-SCRIPT-MAP.md`·`inline-script-map.json`·`modules.json`·`cell-descriptions.json`·`cell-map.json`·`module-baseline.json`, `docs/design/harness/module-split/gen-inline-hard.js`·`verify-inline-hard.js`·`dom-compare-inline-hard.js`·`inline-hard-pilot.json`.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

기준 = origin/main eb9e6e4(#747·#748 합친 뒤, `git archive` 사본). 처음 a89ce00 에서 잰 것을 main 을 합친 뒤 모두 다시 쟀다 — 합친 index.html 은 새 기준에 생성기를 다시 돌린 결과와 바이트 동일. 결과 파일은 `reports/TASK-ES-439/`.

| 항목 | 도구 | 결과 |
| :-- | :-- | :-- |
| 유형 집계(기준) | `inline-hard-types.js` | 어려움 68묶음 23,411줄. A1 8 · A2 9 · B1 22 · B2 19 · B3 25 · C 18 · D 7 · E 51 · F1(근사) 65 · **F1m(실측) 30** · F2 18 · G 6 · H 0 · I 18 · J 27 · K 2 (`inline-hard-types-base.json`) |
| 시험지 선행 실측(기준) | `inline-hard-test-probe.js` | 시험지 57개(기준 실패 16·흔들림 0), 어려움 68묶음 중 선행 필요 30, 깨지는 시험지 30개 (`inline-hard-test-probe-base.json`) |
| 인라인 줄 수 | `module-guard` ① | 33,382 → 33,175 (−207), ② 함수 선언 658 → 654, ③ 282 그대로 |
| 글자 동일 | `verify-inline-hard.js` | 옮긴 함수 4·감싼 문 2 토큰열 동일, 표지 구간 6개 줄 단위 동일(주석 포함), 남은 글자 262,622토큰 동일, 누수·미노출·setter 빠짐·남은 정의·안 가져온 사용·this/arguments 0, 처리기 804 = 802 + 2, 새 파일 231·91줄 (`verify-inline-hard.json` ok). 변조 3건(세포 글자·index 남은 글자·접두) 모두 FAIL |
| 원본 단독 로드 | `court/probes/module-load.js` 로컬 | 회귀 0, 새 파일 2개 단독 로드 ok(등록 전역 = 기존 키트 1개씩) (`module-load-probe.json`) |
| 조작 전후(게스트) | `dom-compare-inline-hard.js` | 20단계 × 10칸 = 200값, 기준 대 후 0 · 기준 대 기준 0, 콘솔 오류 0/0/0. 순서 바꿔(후 2회·기준 1회) 다시 0 · 0 |
| 화면 시나리오(법정 형식) | `court/lib/scenario.js` 로컬 | `checkin-capture-save`·`settings-quick-actions` 기준·작업 모두 통과, 약점 0. 돌연변이(부르는 줄·노출 줄 지움) → 작업 쪽 실패(10·8단계) |
| 시험 | `npm test` · tests 122개 | smoke 443/0 · 무결성 38/38 · 버튼 943/943 기준=후, 작업 npm test 종료 코드 0. tests·scripts/test-* 122개 중 120개 종료 코드 같음, 다른 2개(세포지도 이력 비교 시험·그것을 부르는 shipyard)는 git 이력 없는 기준 사본에서만 실패하고 작업은 통과(회귀 0) |
| 탭 실측 | `tab-check.js home,settings,records` 기준 2회·후 1회 → `tab-compare.js` | TAB_CHECK_RESULT |
| 처리 순서·구역 | `inline-hard-types.js`(이 PR 판) | 단계 1: 18묶음 · 2: 19 · 3: 12 · 4(기관): 18. 구역 H1 17묶음 · H2 13 · H3 5 · H4 9 · 기관 16(배정 7묶음 제외 — 2차 빌더 「Enter app」·「Render all」, 안티그래비티 5묶음), 겹침 0 |

**예상 단계 수(추정, 측정 아님)**: 구역마다 시험지 선행 PR 1 + 이전 PR ⌈묶음 ÷ 4⌉ + 800줄 초과 묶음마다 1 → H1 6 · H2 6 · H3 6 · H4 4 = 22 PR, 기관 16묶음 각 1 PR → 합 약 38 PR. 근거: #423 1 PR 4묶음, 이번 1 PR 2묶음(측정 한 벌은 묶음 수와 무관). 구역 4명 병렬이면 가장 긴 구역 6 PR, 기관은 2명으로 나누면 8 PR 이 가장 긴 길.

[4단계: 심사 청구]
