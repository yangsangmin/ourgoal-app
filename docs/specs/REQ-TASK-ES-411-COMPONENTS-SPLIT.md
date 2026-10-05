# REQ — #TASK-ES-411 공통 UI 컴포넌트 세포 분열 1차: js/components.js(3,861줄) → 487줄 (동작 그대로)

- 근거: 코디네이터 지시(2026-10-05) — `js/components.js`(3,861줄)의 책임 묶음 지도를 만들고, 응집되고 안전한 묶음부터 새 파일(각 800줄 이하, 하는 일 이름, part1/part2 금지)로. 원본 최대한 줄이기, 전역 노출·호출 순서·동작 그대로, 기능 추가·삭제 0, 상태 값·로드 시점에 쓰이는 상수는 원본에. 선례 #712·#717·#725(통계)·#719(팀)·#722(시간기록). 선행 시험지 #726(TASK-ES-412, 컴포넌트 합본 — 병합됨 a9e08ab).
- 범위(탭별 직통 핸들러 11묶음, 함수 56개 = `handle<탭>_ItemNNAction` 38개 + 그 핸들러를 부르거나 같은 탭 일을 하는 작은 함수 18개):
  ① `js/components-home-actions.js` — 홈 탭(33·34·66)
  ② `js/components-record-actions.js` — 기록·스톱워치(35·44·47, `toggleTimeRecordModalCompact`)
  ③ `js/components-team-actions.js` — 팀 목표(37·39·46·49·52·68, `toggleTeamLinkedGoalExample`·`sendTeamGoalComment`·`toggleTeamGoalCommentSection`·`collapseAllTeamGoalAccordions`·`toggleTeamGoalAccordionCollapse`)
  ④ `js/components-feed-actions.js` — 소통(51·57·58·59·61·63·67, `openFeedPostPreviewModal`·`toggleFeedPostPreview`·`blendFeedWithAiBotRule`·`generateRecordPledgeMessage`)
  ⑤ `js/components-goal-actions.js` — 목표 탭(40·53·64, `openGoalTemplateEncyclopediaModal`·`copyUserGoalTemplate`)
  ⑥ `js/components-avatar-actions.js` — 아바타(41·42·48, `enlargeAvatarIconsBatch`)
  ⑦ `js/components-stats-actions.js` — 성취 통계(43·45·56·60, `toggleAchievementMetricFilter`·`toggleDataManagementSection`)
  ⑧ `js/components-auth-actions.js` — 인증(69·70·71)
  ⑨ `js/components-settings-actions.js` — 설정(38·50·79, `handle테마_Item79Action`·`collapseAllSettingsSections`·`toggleSettingsSectionCollapse`)
  ⑩ `js/components-widget-actions.js` — 바탕화면 위젯(62, `getWidgetRenderSpec`)
  ⑪ `js/components-schedule-actions.js` — 일정(65)
- 기능 추가·삭제 0, 버그 수정 0. 전역 노출(`window.<이름>` 59개·`OurgoalComponents` 키 27개·`module.exports` 키 64개와 순서)·호출 순서·동작 그대로. 새 전역 1개(키트 `window.OurgoalComponentsKit`).

## 책임 묶음 지도 (이전 전 js/components.js, 3,861줄)

| 줄 | 묶음 | 누가 부르나 | 이번 처리 |
| :-- | :-- | :-- | :-- |
| 1~158 | `escapeHtml` + `OurgoalComponents` 객체(배지·통계카드·프로그레스바·모달셸·엠프티스테이트·`task23ModularComponent`) — 로드 시점에 만들어지는 상수 | index.html 소통 피드 빈 화면(`OurgoalComponents.emptyState`), smoke ES-162 | 원본에 둠 |
| 159~232 | `handle전체공통_Item23Action`(컴포넌트 모듈화 허브 — `task23ModularComponent` 와 한 짝) | 설정 화면 허브 버튼 `#og-task-23-action-btn` | 원본에 둠 |
| 233~3706 | 탭별 직통 핸들러 38개 + 작은 함수 18개(서로 같은 탭 안에서만 부름, 원본 스코프 이름은 `window` 인자뿐) | index.html 숨은 배선 칸 `#ogTaskWireSlot`(display:none) 버튼 `#og-task-33~53-action-btn` 의 onclick, 게시 모달(`generateRecordPledgeMessage`), `js/avatar-system.js`·`js/customize.js`·`js/records-stats.js`·`js/team-*.js` 의 `window.handle…` 분기, tests 31개·smoke 38곳 | 11묶음으로 옮김 |
| 3468 | 별칭 `var handle팀목표_Item51Action = handle소통_Item51Action;` (로드 시점 값 읽기) | 노출 줄 | 원본에 둠(가져온 이름을 읽는다) |
| 3708~3715 | 모달 닫기 클릭 위임(`document.addEventListener('click', …)`) — 로드 시점 등록 | 모든 `.og-modal-close` | 원본에 둠 |
| 3716~3859 | `OurgoalComponents.X = X` 21줄 · `window.X = X` 59줄 · `module.exports.X = X` 64줄 — 노출 순서(다른 파일·index.html 이 뒤에서 같은 이름을 덮어쓰는 순서: `toggleFeedPostPreview`·`openGoalTemplateEncyclopediaModal`·`copyUserGoalTemplate`·`sendTeamGoalComment`·`collapseAllSettingsSections`) | 앱 전체 | 원본에 둠(자리·순서 그대로) |

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지

1. `js/components.js` 에서 응집되고 안전한 묶음을 새 파일(각 800줄 이하, 하는 일 이름)로 뗀다. 원본을 최대한 줄이고 남은 범위를 보고한다. 전역 노출·호출 순서·동작 그대로, 기능 추가·삭제 0, 상태 값·로드 시점 상수는 원본에.
2. 법정 모듈 로드 탐침은 js 파일을 하나씩 따로 vm 에 로드한다 — 원본이 부품 없이도 로드되어야 한다(#725 의 교훈). 검사기에 원본 단독 로드(standaloneOk)를 넣는다.
3. 시험지가 원본 한 파일만 읽어 깨지면 범위만 넓히는 선행 PR — 모의 이전에서 기준 시험지 408/443·tests 21개 실패가 나와 #726(TASK-ES-412)을 먼저 올렸고 병합됐다(a9e08ab). 그 위에서 이 PR.
4. 증명: `git archive` 기준 사본 대비 토큰 동일, 원본 단독 로드, tab-check 기준 2회·후 1회 차이 0, 게스트 조작 DOM 비교, npm test 동일, 로그인 화면 읽기 전용 비교.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- 본질: "공통 UI 컴포넌트" 파일에 컴포넌트(로드 시점 상수)와 무관한 탭별 직통 핸들러 38개가 노션 티켓 순서로 쌓여 3,861줄이 됐다. 쪼개는 단위는 핸들러 이름이 이미 밝힌 탭(홈·기록·팀·소통·목표·아바타·통계·인증·설정·위젯·일정) — 같이 바뀌는 코드다.
- 원인(측정): 핸들러는 서로 거의 부르지 않고(작은 함수 → 같은 탭 핸들러뿐) 원본 IIFE 스코프에서 읽는 이름은 인자 `window` 하나다(생성기 스코프 분석: 옮긴 코드가 읽는 원본 스코프 이름 0개 → `T.` 접두 0개). 그래서 글자를 하나도 바꾸지 않고 옮길 수 있다.
- 중심: 상태·상수·노출은 **원본에 그대로 둔다**. 원본은 IIFE 맨 위('use strict' 바로 다음, 이 줄보다 먼저 도는 문 없음)에서 옮긴 함수 56개를 같은 이름으로 가져온다 — 함수 선언 끌어올림과 같은 값이라 아래 노출 줄·별칭은 이전과 같은 함수를 단다. 원본 최상위 문이 옮긴 함수를 로드 중에 **부르는** 곳은 0(생성기 검사) → 부품 없이 단독 로드해도 던지지 않는다(노출 값만 undefined, 등록 전역 이름은 같다).
- 핵심: 부품 IIFE 인자 이름도 `window`, 부르는 식도 원본과 같은 `typeof window !== 'undefined' ? window : global` — 옮긴 코드의 `window` 는 원본과 같은 순간 같은 식으로 같은 객체를 받는다(브라우저: 같은 window, node require: 원본 로드 중 같은 전역). 키트 등록은 별칭 `root`(팀·통계 부품의 `root`·`global` 과 같은 꼴)로 해 `window.X =` 직접 대입 수(모듈 가드 ③ 282)를 늘리지 않는다.

## 3. [원칙 ③] 해결방식

- 생성기 `docs/design/harness/module-split/gen-components.js`(묶음 정의 `components-cells.js`): `@babel/traverse` 로 옮길 함수가 최상위 함수 선언·재대입 없음·최상위 this 없음을 확인하고, 한 묶음의 함수를 원본 순서대로 여러 덩어리(사이에 다른 문 없이 이어진 함수 + 바로 위 주석)째 글자 그대로 옮긴다. 원본에는 옮긴 구간마다 한 줄 안내 주석.
- 원본 머리 이음매: `var _cKit = window.OurgoalComponentsKit || {};` → 칸마다 `var _cHome = _cKit.home;`(없으면 node 에서 `require('./components-home-actions.js')`, 그것도 없으면 `{}`) → `var handle홈탭_Item33Action = _cHome.handle홈탭_Item33Action;` … 56줄.
- `index.html`: 원본 태그 `js/components.js?v=20260917-es162` 바로 앞 같은 줄에 새 태그 11개(순증가 0줄).
- 위치 [기본값]: `js/` 바로 아래(팀·통계·시간기록 쪼개기와 같은 이유 — `js/tabs/**` 는 #TASK-ES-155 단언, `js/<폴더>/` 는 verify-all-clicks 범위 밖). 이름은 하는 일: `components-<탭>-actions.js`.
- 키트 [기본값]: 함수마다 전역을 두지 않고 `OurgoalComponentsKit` 하나에 칸 11개 — 새 전역 1개.

## 4. [원칙 ④] 재검토 — 한계(정직하게)

- 줄 수: `js/components.js` 3,861 → 487. 새 파일 283·298·588·681·311·296·388·349·307·132·123줄(모두 800 이하). 모듈 가드 ④ 4 → 3.
- 남긴 것(남은 범위): `OurgoalComponents` 객체(141줄, 로드 시점 상수 — 지시대로 원본), `handle전체공통_Item23Action`(70줄, 객체의 `task23ModularComponent` 와 한 짝), 노출 줄 144줄, 이음매 약 90줄. 원본은 이미 800 이하라 2차는 필요하지 않다 — 더 줄인다면 노출 줄을 부품별로 옮기는 일인데, 그것은 노출 **순서**(다른 파일이 뒤에서 같은 이름을 덮어쓰는 순서)를 바꿀 수 있어 이번 범위 밖으로 남긴다.
- 직통 핸들러 버튼은 숨은 배선 칸(`#ogTaskWireSlot`, `display:none` — 기존, 이 PR 과 무관)에 있어 게스트가 화면에서 누를 수 없다. 게스트 조작 비교는 그 버튼을 `element.click()` 으로 눌러(onclick 경로 그대로) 쟀고, 법정이 화면으로 잴 수 있는 길은 소통 탭 「게시하기」의 한마디 안내 글자(`generateRecordPledgeMessage`)라 그것을 시나리오로 냈다.
- 실계정: 직통 핸들러 버튼은 누르지 않았다(`user_interactions` upsert — 쓰기). 노출 이름·함수 글자 해시, 게시 모달(게시 없이 닫음), 순수 계산 결과 해시, 설정 탭 화면만 읽었다.

## 5. [원칙 ⑤] 절차

1. 지도(babel 최상위 문·참조 분석, 호출하는 쪽 grep) → 2. 생성기·모의 이전 → 기준 시험지 실패 확인(smoke 408/443, tests 21개) → 시험지 선행 #726(TASK-ES-412) → 병합 뒤 origin/main(a9e08ab) 위에서 → 3. 생성 → 4. `verify-components.js`(기준 = `git archive 31e5703`, 제품 글자는 a9e08ab 와 같음) → 5. `module-specs --write` → `spec-components.js`(손 칸 kind·role·spans, 원본 세포 값 읽음) → `module-specs --write` → `module-guard --update` → 6. 법정 모듈 로드 탐침(로컬)·게스트 조작 비교 `dom-compare-components.js`(기준 2회·후 1회)·`tab-check.js all`(기준 2회·후 1회)·화면 시나리오 로컬 실행(법정 실행기) → 7. 실계정 `real-account-components.js`(기준1·작업·기준2) → 8. npm test·tests → 9. REQ·claims·dev_log·TICKETS·PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "부품 IIFE 인자를 `window` 로 두면 node 시험에서 다른 객체를 잡을 수 있다(전역 `window` 를 바꿔 끼우는 시험)." → 부품은 원본이 로드되는 그 순간 원본 머리에서 require 되고 같은 식으로 인자를 받는다. 시험지 중 `require.cache` 를 지워 원본만 다시 읽는 곳은 0(검색). 검사기가 키트 없이 node require 경로로 `module.exports` 64개 키·순서·함수 글자가 같음을, 브라우저 순서 vm 으로 window 이름 59개·함수 글자가 같음을 쟀고, tests 105개 종료 코드·출력이 같다.
- 반론 2: "원본 최상위 노출 줄이 부품 없이 돌면 undefined 를 단다 — 법정 탐침에서 회귀다." → 탐침은 던짐·등록 전역 이름의 사라짐을 본다. 원본 단독 로드는 던지지 않고 등록 전역 59개가 이전 전 단독 로드와 같다(검사기 `standaloneOk`, 법정 `loadOne` 그대로 호출). 앱에서는 index.html 이 부품 11개를 원본 바로 앞에서 읽으므로 값이 채워진다(게스트 조작 비교: 핸들러 48개 함수로 노출, 차이 0).

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- 옮긴 함수 56개(위 범위 ①~⑪), DOM `#ogTaskWireSlot`·`#og-task-33-action-btn`~`#og-task-53-action-btn`·`#btnCommPostFeed`·`#shareCaptionInput`.
- 원본 이음매 `_cKit`·`_cHome`·`_cRecord`·`_cTeam`·`_cFeed`·`_cGoal`·`_cAvatar`·`_cStats`·`_cAuth`·`_cSettings`·`_cWidget`·`_cSchedule`.
- 도구(모두 `docs/design/harness/module-split/`): `components-cells.js`·`gen-components.js`·`verify-components.js`·`spec-components.js`·`dom-compare-components.js`·`real-account-components.js`·`scenario-local-components.js`·`test-compare-components.js`(#726).
- 신고서: `docs/architecture/modules.json` 새 세포 11개(organ — 원본 값), 기준선 `docs/architecture/module-baseline.json` ④ 에서 `js/components.js` 빠짐.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

수치는 각 보고 파일(`reports/TASK-ES-411/`)의 값이다.

| 항목 | 도구 | 결과 |
| :-- | :-- | :-- |
| 글자 동일 | `verify-components.js`(기준 = `git archive 31e5703`) | 56개 함수 토큰열 동일(주석 제외, `T.` 접두 0), 누수 0·원본에 남은 정의 0·안 가져온 함수 0, 옮긴 코드의 `window` 는 모두 부품 인자에 묶임, 부품 부르는 식 = 원본. 실행: window 이름 59개 같음(새 이름 = 키트 1개), 노출 함수 글자 차이 0, `OurgoalComponents` 27키·순서·글자 같음, 별칭 51 같음, node require `module.exports` 64키·순서·글자 같음 — `verify-components.json` `ok: true` |
| 원본 단독 로드 | 같은 검사기(법정 `loadOne`) | 기준·작업 모두 성공, 등록 전역 59개 같음, 부품 11개 각각 단독 로드 성공(전역 = 키트 1개) — `standaloneOk: true` |
| 법정 모듈 로드 탐침 | `court/probes/module-load.js`(로컬 호출, 기준 a9e08ab) | 회귀 0, head 72/71 · base 61/60(실패 1개는 양쪽 같은 기존 `goal-templates-registry.js`) — `module-load-probe.json` |
| 조작 전후(게스트) | `dom-compare-components.js`(기준 2회·후 1회) | 83단계 × 13칸 = 1,079값, 기준 대 후 0, 기준 대 기준 1(첫 단계 저장값에서 게스트 프로필 칸이 채워지는 시점 — 비동기 초기화 순서, 본질 변동), 83단계 모두 실행, 콘솔 오류 0/0 — `dom-compare-components.json` |
| 화면 시나리오(게스트, 법정 재실행용) | `scenarios/comm-post-pledge-caption.json` 을 법정 실행기로 로컬 실행 | 기준·작업 모두 통과 — `scenario-local.json` |
| 탭 실측(게스트) | `tab-check.js all --deadclick off` 기준 2회·후 1회 → `tab-compare.js` | 6탭 136장, 2,312값 — 기준 대 기준 0 · 기준1 대 작업 0 · 기준2 대 작업 0 — `tab-compare-base1-base2.json`·`tab-compare-base1-after.json`·`tab-compare-base2-after.json` |
| 실계정(읽기 전용) | `real-account-components.js`, 로컬 127.0.0.2 + /api 운영 전달, 테스트 계정 A | 기준1·작업·기준2 같음(노출 67개 이름·함수 글자 해시, `OurgoalComponents` 해시, 게시 모달·한마디 안내 글자 해시, 순수 계산 4개 해시, 설정 탭·숨은 배선 칸), 로그인 3/3, pageerror 0, 쓴 행 0, 기록 수 전후 같음 — `real-account-components.json` |
| npm test | 기준(분리 worktree a9e08ab)·작업 | smoke 443/0(검사 제목·결과 목록 동일) · 무결성 38/38 · 버튼 943/943, 모듈 가드 ④ 4 → 3(이 PR 의 목적) — `test-compare.json` |
| tests 전부 | `tests/*.test.js` 105개 기준·작업 | 종료 코드 105/105 같음(27개는 기준에서도 실패 — 기존), 정규화 출력 차이 0 |

폐기(retire) 청구 없음. 시험 기대값 변경 0. 동결 파일 변경 0. 시험 파일 변경 0(시험지 범위는 #726 에서).

* **체크리스트 마감 규칙**: 본 작업계획서는 [4단계: 심사 청구]까지만 등록함.
