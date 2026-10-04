# 모듈 분할 공통 틀 (MODULE-SPLIT-PROTOCOL) — 노션 CORE-07

- 처음 적용: #TASK-ES-354 설정 탭 시범(SET-07). 근거: 상민님 원문 "이제 진짜 모듈화 진행해야지?"(2026-10-02), "모듈화부터 제대로 정착시켜야하지 않을까?"(2026-10-04).
- 이 문서는 index.html 인라인 IIFE(약 3만 7천 줄, 함수 700여 개)의 코드를 `js/` 아래 파일로 **옮기는** 규칙이다. 옮기기는 고치기가 아니다.

## 0. 다섯 원칙

1. **동작은 하나도 바꾸지 않고 옮기기만 한다.** 버그도 그대로 옮긴다(고치는 것은 별도 티켓). 바꿔도 되는 글자는 이름 참조 경로(`L.`·`U.`·`K.` 접두)뿐이다.
2. **800줄은 상한일 뿐 기준이 아니다.** 줄 수로 자르지 않고 책임(기능 묶음) 단위로 나눈다. `…-part1`·`…-part2` 같은 줄 수 분할은 금지. 한 함수가 800줄을 넘으면(설정의 `renderSettingsScreen` 826줄) 그 안의 기능 묶음(섹션)을 소블록으로 나누고, 화면 함수는 섹션을 원래 순서로 부르는 조립자로 남긴다.
3. **공용 부품이 먼저다.** 옮길 코드가 쓰는 공용 함수·상태를 스코프 분석으로 목록화하고, 여러 탭이 같이 쓰는 것은 `js/core/` 아래 한 곳으로만 노출한다. 탭 전용 임시 통로를 만들지 않는다.
4. **전역 이름을 새로 늘리지 않는다.** 옮긴 함수를 `window` 에 새로 달면 그 이름을 찾던 다른 파일의 분기가 새로 돌아 동작이 바뀐다(실례: `js/components.js` 의 `win.renderSettingsScreen` 5곳 — 지금은 `undefined` 라 돌지 않는다). index.html 은 IIFE 맨 위에서 같은 이름으로 **가져와** 부른다.
5. **전후 차이 0 을 측정으로 증명한다.** 같은 커밋 2회 실행으로 본질적 변동(시간·난수)을 먼저 걸러 내고, 옮긴 뒤 실행과 비교해 차이 0 이어야 한다.

## 1. 공용 부품 — `js/core/` 두 곳

| 파일 | 전역 1개 | 무엇 | 옮긴 파일에서 |
| :-- | :-- | :-- | :-- |
| `js/core/ui-helpers.js` | `window.OurgoalUiHelpers` | 여러 탭이 같이 쓰고 **인라인 스코프 변수를 읽지 않는** 순수 헬퍼. 코드가 실제로 옮겨 와 있다. 지금: `escapeHtml`·`a11ySwitch`·`download` | `var U = global.OurgoalUiHelpers;` → `U.escapeHtml(…)` |
| `js/core/app-scope.js` | `window.OurgoalAppScope` | 아직 index.html 에 남아 있는 공용 상태·함수(`state`·`saveProfile`·`toast`·`openModal` …)를 **getter** 로 읽는 통로. 모든 탭이 같은 통로를 쓴다 | `var L = global.OurgoalAppScope.scope;` → `L.state.profile`, `L.saveProfile()` |

- 노출하는 쪽은 index.html IIFE 맨 위 한 곳이다: `window.OurgoalAppScope.expose('index.html', { get state(){ return state; }, … })`. getter 라서 나중에 다시 대입된 변수도 살아 있는 값으로 읽힌다. 옮긴 코드가 대입하는 이름만 setter 를 단다(설정: `googleTokenClient`).
- 노출 목록은 손으로 고르지 않는다. 생성기가 `@babel/traverse` 스코프 분석으로 "옮긴 코드가 실제로 읽는, IIFE 최상위에 선언된 이름"만 뽑는다(설정 시범 52개). `OurgoalAppScope.names()` 로 확인한다.
- 헬퍼를 `ui-helpers.js` 로 옮기는 조건: (가) 옮기는 탭이 쓴다 (나) 함수 본문이 IIFE 스코프 이름을 읽지 않는다(서로끼리는 된다) (다) IIFE 안에서 재대입·중복 선언이 없다. (라) 기준 시험지가 인라인 스크립트에서 그 이름으로 함수를 뽑아 단위 시험하지 않는다(`scripts/smoke-test.js` 의 `FN_NAMES` — 법정은 늘 기준 커밋의 시험지로 작업 커밋을 채점하므로, 옮기면 시험지가 중간에 죽는다. 그런 함수는 시험지를 먼저 고친 별도 PR 이 병합된 뒤 옮긴다). 하나라도 어기면 옮기지 않고 `app-scope` getter 로 둔다(예: `toast` 는 `toastTimer` 를 다른 함수와 같이 써서, `nowISO`·`triggerHaptic` 은 (라) 때문에 남겼다).
- 다음 탭이 같은 이름을 쓰면 `expose` 목록에 한 줄을 더할 뿐, 새 통로를 만들지 않는다. `ui-helpers.js` 로 옮겨 간 헬퍼는 index.html 맨 위에서 이미 같은 이름으로 가져오므로 다른 탭 코드는 그대로 돈다.

## 2. 소블록 인터페이스 (#663 CORE-04 사전 위에서)

```text
OurgoalXxxSubYyy = {
  id, megaBlockId, name, containerId,
  render(…)                 실제 렌더. 이번 틀에서는 원래 함수 본문을 글자 그대로 담는다.
  mount(container, state, events) → boolean   '실제로 그렸는가'(#TASK-ES-353). 그리지 않으면 false — 메가블록이 폴백한다.
  dispose(events)           events.offOwner('<탭>/<소블록>') — 이 소블록이 건 구독만 해제
}
```

- 구독은 `js/core/event-bus.js` 사전대로 `view:sync` 1종, 소유자 키 `'<탭>/<소블록>'`, 다시 그리기는 `requestRender('<렌더 함수 이름>', fn)`. **이전 전에 그 화면이 `view:sync` 에 다시 그려지지 않았다면 구독을 새로 걸지 않는다**(구독 추가는 동작 변경이다 — 별도 티켓).
- 화면 하나가 섹션끼리 지역 변수를 공유하는 큰 함수였다면(설정 `renderSettingsScreen`): 화면 함수는 머리(공유 변수 선언까지) + 소블록 `render(공유 변수)` 를 원래 순서로 부르는 조립자로 남고, 소블록 `mount` 는 `false` 를 돌려 이전과 같은 경로(`setTab` 의 레거시 렌더)로 넘긴다. 레지스트리 경유로 그리기를 바꾸는 일은 오류 경로(레지스트리가 예외를 삼키고 `setTab` 이 한 번 더 부름)가 달라지므로 별도 티켓이다.
- 섹션 경계 조건(생성기가 검사): ① 경계가 문(statement) 하나를 가르지 않는다 ② 공유 변수(설정: `settings`) 말고는 어떤 지역 변수도 두 섹션에서 쓰이지 않는다 — 같은 `var` 를 두 번 선언한 버그(설정: 구글 캘린더 자동 동기화 스위치와 노션 자동 전송 스위치가 같은 `isAuto` 를 씀)도 한 파일 안에 남겨 그대로 옮긴다 ③ 공유 변수는 재대입이 없다(인자로 넘겨도 같은 결합).

## 3. index.html 쪽에 남기는 것

1. IIFE 맨 위(`"use strict";` 바로 다음): ① 공용 헬퍼 가져오기 `var escapeHtml = _ui.escapeHtml;` … ② 탭 키트 가져오기 `var renderSettingsScreen = _settingsKit.renderSettingsScreen;` … ③ `OurgoalAppScope.expose('index.html', { getter 목록 })`. 함수 선언의 끌어올림(hoisting)과 같은 효과다 — 이 줄보다 먼저 도는 문이 없다.
2. **실행 순서 보존**: IIFE 실행 중 바로 돌던 문(이벤트 등록, `window.x = x` 노출)은 옮긴 파일의 함수(`bindSettingsHapticDelegate`·`bindSettingsStaticHandlers`)로 감싸고, index.html 의 **원래 자리**에서 부른다. `window.x = x` 노출 줄은 원래 자리에 그대로 둔다(다른 파일이 같은 이름을 먼저 달아 두는 경우가 있다 — 설정: `js/components.js` 가 `window.collapseAllSettingsSections` 를 먼저 달고, index.html 이 나중에 덮어쓴다).
3. `<script>` 태그: `js/core/app-scope.js`·`ui-helpers.js` 는 `js/core/store.js` 다음, 탭 파일은 그 탭 소블록 묶음 안(메가블록 `index.js` 앞). 모두 인라인 IIFE 보다 먼저 읽힌다.

## 4. 옮기는 순서

- 탭 순서: **설정 → 기록 → 일정** 먼저. 로그인 흐름이 많은 **목표·소통은 실계정 확인(CORE-02) 뒤**(게스트 시드·목 Supabase 실측으로는 로그인 화면 차이를 못 잰다).
- 한 탭 안에서: (1) 그 탭이 쓰는 공용 헬퍼 중 조건(1절)을 만족하는 것 → `js/core/ui-helpers.js` (2) 그 탭 전용 헬퍼·핸들러 → `js/tabs/<탭>/render.js` (3) 큰 렌더 함수의 섹션 → `js/tabs/<탭>/sub-<묶음>.js` (4) 마크업(HTML)은 옮기지 않는다(옮긴다면 DOM id·순서 동일을 DOM 비교로 증명).
- 한 PR = 한 탭. 옮긴 파일은 각 800줄 이하, 책임 단위.

## 5. 절차 (도구: `docs/design/harness/module-split/`)

`NODE_PATH=C:/dev/ourgoal-app/node_modules` (또는 저장소 node_modules) 를 두고 돌린다.

1. **기준 2회**: 이전 전 커밋을 `git archive <커밋> | tar -x -C <임시>/base-app` 로 풀고 `node docs/design/harness/tab-check.js <base-app> <out1> all --summary base1.json` 를 두 번(base1·base2). `node tab-compare.js base1.json base2.json` 차이 = 본질적 변동 목록(시간·난수·병렬 지연). 0 이 아니면 그 항목을 이후 비교에서 제외할 근거로 적는다.
2. **생성**: 생성기(설정 예: `gen-settings.js <APP> <이전 전 index.html>`)가 스코프 분석 → 경계·지역 변수·재대입 검사 → 글자 그대로 옮기고 이름 참조만 `L.`/`U.`/`K.` 로 바꿈 → index.html 에서 지움 + 가져오기·노출·원래 자리 호출을 넣음. 손으로 옮기지 않는다(옮긴 글자 수천 줄을 손으로 맞추면 반드시 틀린다).
3. **글자 검사**: `verify-equiv.js <이전 전 index.html> <APP>` — 옮긴 구간 전부 토큰열이 이전 전과 같은지(차이 허용: `L.`·`U.`·`K.` 접두뿐). `verify-free.js <APP>` — 옮긴 파일에 IIFE 이름이 접두 없이 남아(전역으로 새어) 다른 값을 읽는 곳 0, `L.<이름>` 이 모두 노출됐는지.
4. **화면 비교**: 옮긴 뒤 `tab-check.js … all` 1회 → `tab-compare.js base1.json after.json` → 해당 탭 장 전부 + 다른 5탭 차이 0(1단계 본질 변동 제외). 탭별 조작 비교(설정 예: `dom-compare-settings.js <base-app> <after-app> <out.json>`)로 단계마다 화면 HTML·저장값(localStorage)·토스트·테마·콘솔 오류를 맞대 본다(시간·난수 값만 지움).
5. **소스 글자 시험**: `npm test` 0. 소스 글자를 grep 하는 시험(`scripts/smoke-test.js`·`verify-all-clicks.js`)은 "앱 소스 = index.html + 옮긴 파일" 합본으로 보게 고친다(ui.css 분리 때 `styleSrc` 합본과 같은 방식). 시험의 기대값은 바꾸지 않는다 — 통과 수·버튼 수가 이전 전과 같아야 한다(설정: 443 통과·38/38·버튼 953/953). **법정은 기준 커밋의 시험지로 채점한다**: 기준 시험지에서 index.html 한 파일의 글자를 찾던 검사는 옮긴 뒤 깨진다(설정: 13개). 그 검사들은 주장 파일 `retire` 에 검사 제목별로 "옮겨 갔고 작업 커밋 시험지 합본에서는 그대로 통과" 사유를 적는다 — 이 폐기는 상민님 결심 사항으로 판정서에 올라간다. 다음 탭부터 이 마찰을 없애려면 시험지 합본 읽기(이번 PR)가 main 에 먼저 들어가 있어야 한다.
6. **세포 신고서(CORE-08)**: 새로 만든 js 파일은 `node scripts/module-specs.js --write` 로 `docs/architecture/modules.json` 에 올리고 손 칸(kind·role·contributes)을 적는다(설정 섹션 소블록: `kind: tab`, `contributes: ["settings.section"]`). `node scripts/module-guard.js` 통과 후 줄어든 부채는 `--update` 로 기준선을 낮춘다(래칫). `js/core/slots.js` 의 `slots.contribute` 로 실제 연결하는 것은 등록 순서·오류 경로가 바뀌므로 옮기기 PR 다음의 별도 PR 로 한다.
7. 법정: 새 js 파일 800줄 이하, 옮긴 줄 중 `display:none !important`·금지 낱말 0(이번 변경이 "새로 만든" 것만 센다 — CSS 는 옮기지 않는다).

## 6. 실패 시 되돌리기

- 생성기는 이전 전 index.html 을 입력으로 받아 결과를 통째로 다시 쓴다. 되돌리기 = `git checkout <기준> -- index.html js/tabs/<탭> js/core/app-scope.js js/core/ui-helpers.js scripts/smoke-test.js scripts/verify-all-clicks.js` 후 새 파일 삭제. 병합 뒤라면 그 PR 의 되돌림 커밋(`git revert -m 1 <병합 커밋>`) 하나로 끝난다(옮기기만 했으므로 데이터·스키마 영향 없음).
- 비교에서 차이가 나면: 차이 난 장의 지표 → 그 탭 DOM 비교 단계 → 그 단계에서 불린 옮긴 함수 순으로 좁힌다. 원인을 못 찾으면 그 함수는 이번에 옮기지 않고(가져오기 목록에서 빼고 index.html 에 되살림) 다음 PR 로 넘긴다.

## 7. 설정 탭 시범 결과 요약 (#TASK-ES-354)

- 옮긴 것: `renderSettingsScreen`(826줄 → 조립자 + 소블록 6개)·`renderSettingsHeroCard`·`collapseAllSettingsSections`·`toggleAdvancedSettings`·`formatStorageBytes`·`paintCacheUsage` + 설정 정적 바인딩 7문 → `js/tabs/settings/render.js`·`sub-profile.js`·`sub-security.js`·`sub-notify.js`·`sub-appearance.js`·`sub-integrations.js`·`sub-data.js`. 공용 헬퍼 3개 → `js/core/ui-helpers.js`. 통로 `js/core/app-scope.js`(52개 getter).
- 측정값은 `docs/specs/REQ-TASK-ES-354-SETTINGS-MODULE.md` 8절.
- 다음 탭 주의점: 같은 함수 안 `var` 중복 선언(섹션 경계가 바꿔 버림), IIFE 실행 중 바로 도는 등록문(원래 자리에서 부를 것), `window.x` 노출 선후(다른 파일과의 덮어쓰기 순서), 다른 파일이 `win.<이름>` 으로 찾는 함수(노출 금지), 소스 글자 시험의 단일 파일 가정.
