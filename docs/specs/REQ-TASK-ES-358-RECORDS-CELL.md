# REQ — #TASK-ES-358 기록 탭 렌더를 js/tabs/records/ 세포로 옮기기 (동작 그대로)

- 근거: `docs/architecture/MODULE-BLUEPRINT.md` 8절 쪼개는 순서 3번(기록·일정)의 첫 단계, 상민님 원문(2026-10-04) "모듈화부터 제대로 정착시켜야하지 않을까?". 이전 틀은 설정 탭 시범(#TASK-ES-354, PR #666 — 이 PR 시점 **미병합**)의 `docs/specs/MODULE-SPLIT-PROTOCOL.md` 를 그대로 따랐다.
- 범위: `index.html` 인라인 IIFE 의 기록 탭 렌더 함수 7개 → `js/tabs/records/render.js`·`js/tabs/records/period-ai-card.js`. 통로 `js/core/app-scope.js`(PR #666 과 **바이트 동일 사본**, git blob f8af8c8). 설정 탭 코드·`js/core/ui-helpers.js`(#666 몫)는 건드리지 않았다.
- 기능 추가·삭제 0. 마크업(HTML)·CSS 는 옮기지 않았다.

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지

1. index.html 인라인 스크립트(미분화 덩어리) 안의 기록 탭 렌더 함수·마크업 생성 코드를 `js/tabs/records/` 로 옮긴다. 화면 결과 전후 차이 0.
2. 신고서(`modules.json`)는 `node scripts/module-specs.js --write` 로 반영, kind tab, 자리는 정식 15곳 중 `record.type`·`stats.card` 만. 모듈 가드 통과.
3. 토스트·모달·시트를 새로 만들지 않는다. 새 js 800줄 이하. 인라인 스크립트 줄 수 감소.
4. 실측: `docs/design/harness/tab-check.js` 로 기준(base)/후(after) 게스트 화면 비교 — 기록 탭 장 전부 차이 0.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 기록 탭이 그려지는 코드가 4만 줄짜리 index.html 한 덩어리 안에 있어, 기록 탭을 고칠 때마다 다른 탭과 같은 파일·같은 스코프를 만진다(충돌·회귀의 원천).
- **원인**: 기록 탭 껍데기 세포(`js/tabs/records/sub-*.js`)는 `window.renderRecordsScreen` 에 위임만 하고, 실제 렌더 코드는 IIFE 지역 스코프 이름(state·toast·escapeHtml … 32개)에 묶여 있어 그냥 잘라 낼 수 없었다.
- **중심**: `renderRecordsScreen`(이전 전 index.html 33441~34016, 576줄)과 그것만 부르는 기간별 AI 피드백 카드 함수들.
- **핵심**: 글자 그대로 옮기고, 지역 스코프 이름만 `L.<이름>`(app-scope getter 통로)로, 옮긴 파일끼리의 호출만 `K.<이름>`(기록 키트)로 바꾼다. index.html 은 IIFE 맨 위에서 같은 이름으로 가져와 호출처 수십 곳을 그대로 둔다.

## 3. [원칙 ③] 해결방식

- 생성기 `docs/design/harness/module-split/gen-records.js`(@babel/traverse 스코프 분석): 이전 전 index.html → 새 index.html + 옮긴 파일 2개. 손으로 옮긴 글자 0.
  - `js/tabs/records/render.js`: `setRecordsSegment` · `setRecordsSlide` · `renderRecordsScreen`
  - `js/tabs/records/period-ai-card.js`: `initPeriodAiCard` · `generatePeriodAIFeedback` · `generateLocalPeriodFeedback` · `renderPeriodFeedbackResult`
- 두 파일로 나눈 기준은 책임(기록 화면 렌더 / 기간별 AI 피드백 카드). 한 파일이면 900줄을 넘는다.
- index.html: IIFE 맨 위 `var _recordsKit = window.OurgoalRecordsKit; var renderRecordsScreen = _recordsKit.renderRecordsScreen; …`(3개) + `window.OurgoalAppScope.expose('index.html', { getter 32개 })`(대입이 있는 `state` 만 setter). 지운 구간 안의 `window.purgeSampleRecordsOneClick = async function(){…}` 문은 IIFE 실행 순서를 지키려고 **원래 자리에 그대로** 두었다. `window.renderRecordsScreen = renderRecordsScreen` 노출 줄도 원래 자리.
- `<script>`: `js/core/app-scope.js` 는 `js/core/store.js` 다음, 기록 파일 2개는 `sub-retrospect.js` 다음·`js/tabs/records/index.js` 앞.

## 4. [원칙 ④] 재검토 — 한계(정직하게)

- **설정 시범(#666) 미병합 상태에서 진행**: `js/core/app-scope.js` 는 #666 과 같은 내용의 사본이라 둘 중 나중에 병합되는 쪽은 같은 파일 추가로 충돌하지 않지만, index.html IIFE 머리(가져오기·expose 블록)와 `<script src="js/core/app-scope.js">` 줄은 같은 자리를 고치므로 나중 쪽이 손으로 합친다(두 expose 호출은 공존 가능, 태그는 1줄만).
- **기준 시험지 깨짐(법정은 기준 커밋의 시험지로 채점)**: index.html 한 파일에서 기록 렌더 글자를 찾던 검사 7개가 이 브랜치에서 실패한다(8절). 그중 6개는 시험지가 "index.html + js/tabs/** + js/core/*" 합본을 읽으면 그대로 통과할 글자이고, 1개(`[#TASK-ES-060] … 대시보드 호출 탑재`, 기대 글자 `renderUniversalStatsDashboard(uDashBox, allRecs, state`)는 옮긴 줄이 `L.state` 가 되어 합본으로도 통과하지 않는다. 시험 기대값은 바꾸지 않았고 폐기(retire)도 청구하지 않았다.
- 이번에 옮기지 않은 기록 탭 코드: `window.purgeSampleRecordsOneClick`(실행 중 대입 문), 위클리 리캡(`weeklyRecapStats`·`findBestMoment` 등 — `weeklyRecapStats` 는 시험지 `FN_NAMES` 가 인라인 스크립트에서 이름으로 뽑는다), `openRecordModal`·`wireRecordCards`·`buildRecordCardHtml`(다른 탭도 부른다). 다음 단계 몫.
- 기록 소블록(`sub-timeline` 등)은 여전히 `window.renderRecordsScreen` 에 위임하는 껍데기다(그리는 주체는 render.js 로 옮겼지만 소블록 구조는 바꾸지 않았다 — 레지스트리 경유 그리기는 오류 경로가 달라지는 별도 티켓, 틀 2절).

## 5. [원칙 ⑤] 절차

워크트리 `C:/dev/wt/records-cell`(브랜치 `feat/2026-10-04-task-es-358-records-cell`, origin/main 2853540) → 대상 확정(바인딩 참조 분석) → 기준 실측 2회 → 생성기 실행 → 글자·누수 검사 → 후 실측 → 신고서·가드 기준선 → `npm test` → 문서 → PR → 법정.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "getter 통로로 읽으면 함수 안에서 다시 대입된 지역 변수(state)를 놓친다." → getter 는 읽을 때마다 살아 있는 값을 돌려주고, 옮긴 코드가 대입하는 유일한 이름 `state`(`if(!state) state = {}`)에는 setter 를 달아 IIFE 변수에 그대로 쓴다. 생성기가 대입·증감 식을 찾아 setter 를 자동으로 붙인다.
- 반론 2: "IIFE 맨 위에서 `var renderRecordsScreen = …` 로 바꾸면 함수 끌어올림(hoisting)이 사라져, 그 줄보다 먼저 도는 호출이 깨진다." → 가져오기 줄은 `"use strict";` 바로 다음, IIFE 의 첫 문이라 그보다 먼저 도는 문이 없다. 기록 파일 2개는 인라인 스크립트보다 먼저 읽힌다(`<script>` 순서).
- 반론 3: "글자가 같아도 전역으로 새는 이름이 있으면 다른 값을 읽는다." → `verify-records.js` 가 옮긴 파일의 자유 변수 중 IIFE 스코프 이름 0(누수 0), `L.` 로 쓴 이름이 모두 expose 됨(미노출 0)을 검사한다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- DOM(옮긴 코드가 그리는 곳, 마크업 자체는 index.html 그대로): `#screen-records`, `#recordsList`, `#recSegmentBar [data-recseg]`, `#recViewFeed`·`#recViewStats`·`#recViewArchive`, `#recCarouselTrack`·`#recCarouselPills [data-recslide]`, `#periodAiCard`, `#universalStatsDashboardBox`.
- 함수: `renderRecordsScreen`, `setRecordsSegment`, `setRecordsSlide`, `initPeriodAiCard`, `generatePeriodAIFeedback`, `generateLocalPeriodFeedback`, `renderPeriodFeedbackResult`, `OurgoalAppScope.expose`, `OurgoalRecordsKit`.
- 파일: `index.html`, `js/tabs/records/render.js`, `js/tabs/records/period-ai-card.js`, `js/core/app-scope.js`, `docs/architecture/modules.json`, `docs/architecture/module-baseline.json`, `docs/design/harness/module-split/gen-records.js`·`verify-records.js`.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

모두 로컬 정적 서버 + 헤드리스 Chrome + 게스트 시드 + Supabase 목(원격·실계정 없음). 결과 파일은 `reports/TASK-ES-358/`. 후(after) 실측은 커밋 전 작업 트리(HEAD 2853540 + 이 변경)에서 잰 값이다.

| 항목 | 도구 | 결과 |
| :-- | :-- | :-- |
| 글자 동일 | `verify-records.js` | 옮긴 7함수 전부 토큰열 동일(L./K. 접두 제외) — renderRecordsScreen 4,088 토큰 등. 누수 0 · 미노출 0 · index.html 에 남은 정의 0 (`verify-records.json` `ok: true`) |
| 기준 재현성 | `tab-check.js … records` 2회 → `tab-compare.js` | 기록 탭 24장(4테마×2화면×3상태)+Dead-Click 3상태, 비교한 값 447 · 다른 값 0 (`tab-compare-base-run1-vs-run2.json`) |
| 화면 전후 | 같은 도구, base run1·run2 각각 대 after | 비교한 값 447 · 다른 값 0 (`tab-compare-base-run1-vs-after.json`·`run2-vs-after.json`), 콘솔 오류 24장 모두 0 |
| 조작 전후 | `dom-compare-records.js` | 13단계(진입·세그먼트 3·캐러셀 4·기간 프리셋·기간 AI 요청·결과 닫기·탭 왕복·다시 그리기 호출) × 9칸(#screen-records HTML·localStorage·토스트·활성 화면·전역·새 콘솔 오류·레지스트리·구독) = 117 값, 다른 값 0, 콘솔 오류 base 0 / after 0. 단계마다 HTML 크기가 실제로 바뀐다(123,220 → 기간 AI 결과 126,168 바이트) — 빈 비교가 아니다 (`dom-compare-records.json`) |
| 모듈 가드 | `node scripts/module-guard.js` | ① 인라인 스크립트 38,207 → 37,368(-839) · ② 함수 선언 718 → 708 · ③ 282 그대로 · ④ 12 그대로 · ⑤ 0. 기준선 낮춤(`--update`) |
| 새 파일 줄 수 | wc | render.js 639 · period-ai-card.js 292 (둘 다 800 이하) |
| npm test(이 브랜치 시험지) | `NODE_PATH=… npm test` | 436 통과 · 7 실패 — 7개 모두 index.html 한 파일에서 옮긴 글자를 찾는 검사(아래). 이전 전 같은 시험지 443 통과 · 0 실패 |

**최종(origin/main 5504ff1 — #670 TASK-ES-359 시험지가 세포 파일의 L./K. 접두를 떼고 읽음, 기대값 변경 0 병합 뒤)**: `npm test` 0 실패 — smoke-test 443/443 · verify-integrity-gate 38/38 · verify-all-clicks 957/957 · test-shipyard-modular 통과. 아래는 경과 기록.

**갱신(origin/main f0259e5 — #669 TASK-ES-357 합본 읽기 시험지 병합 뒤)**: `npm test` 의 smoke-test 442 통과 · 1 실패(아래 7번 `[#TASK-ES-060]`), verify-integrity-gate 통과, verify-all-clicks 957/957 통과, test-shipyard-modular 통과. 남은 1개는 기대 글자 `renderUniversalStatsDashboard(uDashBox, allRecs, state` 와 옮긴 줄 `… allRecs, L.state` 의 차이이며, 이 저장소 pre-commit 훅(`.githooks/pre-commit`: index.html 이 바뀐 커밋은 smoke-test 통과 필수)이 커밋을 막는다. `window.state` 는 3489줄의 한 번 대입(살아 있는 값이 아님)이라 옮긴 코드에서 접두 없이 `state` 를 읽게 하면 동작이 바뀐다 — 그래서 이 PR 안에서 우회하지 않았다.

(#669 이전 시험지 기준) 깨지는 검사 7개(제목 그대로) — 시험지가 합본(index.html + js/tabs/** + js/core/*)을 읽으면 통과할 것 6 · 그래도 실패할 것 1:

1. `compliance: 기록/달력 6대 UX 개선사항(…기간별 AI 피드백…)이 모두 구현되어 있다` — `function initPeriodAiCard` (period-ai-card.js 로 감) · 합본이면 통과
2. `compliance: [#TASK-ES-031] 기록 탭 3분할 세그먼트·미니 펄스바·4단 캐러셀 및 과거 기록 계층형 아코디언이 구현되어 있다` — `function setRecordsSegment(` · 합본이면 통과(측정: 첫 `html` 만 합본으로 바꾼 임시 사본에서 통과)
3. `compliance: [#TASK-ES-036] 서버 사이드 관리자 권한 데이터 복구 파이프라인(api/track.js) 및 RLS 차단 우회 기록·프로필 즉시 복원이 완비되어 있다` — 기록 탭 빈 화면 복원 버튼 글자 · 합본이면 통과(같은 측정)
4. `compliance: [#TASK-ES-037] 기록·목표 탭 12대 핵심 UX 개선 및 통계·마일스톤 구조 개편이 완비되어 있다` — 7일 피드 렌더러 연동 글자 · 합본이면 통과(같은 측정)
5. `[TASK-ES-059] 테마 구분 없는 임의 데이터 AI 자율 메트릭 추론 및 다형성 시각화 엔진 검증` — `OurgoalUniversalStats.renderUniversalStatsDashboard` (검사 안에서 index.html 을 다시 읽음) · 합본이면 통과
6. `[#TASK-ES-245] 기록탭 샘플 데이터 1초 체험 후 원클릭 완전 삭제/초기화 기능 무결성` — `이제 나만의 첫 실천을 기록해보세요! ✨` (검사 안에서 index.html 을 다시 읽음) · 합본이면 통과
7. `compliance: [#TASK-ES-060] 1900년대 및 역대 과거 임의 데이터 완벽 수용·융합·자율 시각화 및 크래시 방어 검증` — 기대 글자 `renderUniversalStatsDashboard(uDashBox, allRecs, state` 가 옮긴 뒤 `… allRecs, L.state` 라 **합본으로도 실패**. 시험 기대값을 바꾸거나 이전 방식을 바꿔야 하는 결정이 필요하다(이 PR 은 둘 다 하지 않았다).

`npm test` 는 `smoke-test.js && verify-integrity-gate.js && verify-all-clicks.js && test-shipyard-modular.js` 사슬이라 첫 실패에서 멈춘다. 뒤 셋을 따로 돌린 결과: verify-integrity-gate 통과 · test-shipyard-modular 통과(모듈 가드 포함) · **verify-all-clicks 실패** — index.html 한 파일의 글자로 버튼 핸들러를 찾는 검사라, 정적 버튼 953 → 940(기록 렌더 함수의 HTML 문자열 속 버튼 13개가 render.js 로 함께 감), 그리고 index.html 마크업에 남은 기간 프리셋 칩 4개(`#periodPresetRow` 의 "최근 7일"·"최근 14일"·"최근 30일"·"이번 달")의 핸들러가 `initPeriodAiCard`(period-ai-card.js)로 옮겨 가 "핸들러 결여" 로 잡힌다. 실제 동작은 조작 비교의 `period-preset-first` 단계에서 전후 같다(두 쪽 모두 HTML 123,221 → 123,649). 이 검사도 합본 읽기 시험지면 통과할 글자다.

폐기(retire) 청구 없음. 합본 읽기 시험지 PR 이 main 에 들어간 뒤 main 을 합쳐 재판정 받는다.

확인 못 함: 실제 폰(레벨 6), 실계정 로그인 상태의 기록 탭(레벨 5 — 게스트 시드만 잼), 다른 5개 탭 전후 비교(기록 탭만 잼 — 옮긴 함수는 기록 탭 렌더 전용이다. 다만 `window.setRecordsSegment = setRecordsSegment`(이전 전 13691줄) 노출 줄은 원래 자리에 남아 IIFE 맨 위에서 가져온 같은 함수를 단다).
