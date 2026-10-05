# REQ — #TASK-ES-425 전문가 목표 템플릿 레지스트리 세포 분열: js/goal-templates-registry.js(2,815줄) → 72줄 + 분야 자료 세포 6개 (동작 그대로)

- 근거: 코디네이터 지시(2026-10-05) — `js/goal-templates-registry.js`(2,815줄, 함수 2개 + 목표 템플릿 자료)를 800줄 이하 파일들로. 자료는 분야별(템플릿 id 접두) 자료 세포로 옮기고 원본은 같은 배열·객체를 같은 순서로 조립해 같은 이름으로 노출. JSON+fetch 방식 금지(로드 시점·동작이 바뀜). 서버 `api/goaltemplate.js` 스마트 폴백이 그대로 동작. #732 보고 "이 파일은 기준에서도 단독 로드 실패" — 원인을 먼저 재고, 분열이 단독 로드 상태를 악화시키지 않게. 헌법 v2026.10.05-CELL 세포골격 절(CELL_SPLIT·CELL_SPLIT_PROOF·claims_hygiene).
- 범위: `MATCH_RULES`(60규칙, 300줄)·`TEMPLATE_MAP`(60항목, 2,460줄)을 접두 6개 — `TPL-HLT`·`TPL-STD`·`TPL-CAR`·`TPL-HOB`·`TPL-MND`·`TPL-REL` — 로 나눠 `js/data/expert-templates/<분야>.js` 6개로 옮긴다. 함수 `findExpertTemplate`·`formatScheduleBackgroundLayout`, 캐시 `COMPILED_RULES`, `module.exports` 는 원본에 글자 그대로 둔다.
- 기능 추가·삭제 0, 버그 수정 0(원본 단독 로드 실패는 기존 그대로 — 아래 원칙 ②). `index.html` 변경 0(이 파일은 브라우저가 부르지 않는다). 새 전역 0.

## 책임 묶음 지도 (이전 전 js/goal-templates-registry.js, 2,815줄)

| 줄 | 묶음 | 누가 부르나 | 이번 처리 |
| :-- | :-- | :-- | :-- |
| 1 | 머리 주석 | — | 원본에 둠 |
| 2~303 | `var MATCH_RULES = [ … ];` 규칙 60개(접두별 10개씩 이어서) | `COMPILED_RULES` 만듦(로드 시점), `module.exports.MATCH_RULES` | 분야 6개로 줄 그대로 옮기고 원본에서 같은 순서로 조립 |
| 304~2765 | `var TEMPLATE_MAP = { … };` 항목 60개(접두별 10개씩 이어서) | `findExpertTemplate`, `module.exports.TEMPLATE_MAP` | 위와 같음(키 순서 그대로) |
| 2766~2815 | `COMPILED_RULES`·`findExpertTemplate`·`formatScheduleBackgroundLayout`·`module.exports` | `api/goaltemplate.js` `localGoalTemplateFallback`(require), `tests/schedule-dual-bg.test.js`(require·글자), `scripts/smoke-test.js` ES-290(글자) | 원본에 둠(글자 그대로) |

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지

1. 2,815줄 레지스트리를 각 800줄 이하 파일로 나눈다. 자료는 분야별 자료 세포, 원본은 같은 이름(`MATCH_RULES`·`TEMPLATE_MAP`·`findExpertTemplate`·`formatScheduleBackgroundLayout`)으로 같은 값을 노출한다(조립 결과가 기준과 deepStrictEqual).
2. 이 파일을 쓰는 곳이 그대로 동작해야 한다: 서버 `api/goaltemplate.js` 143줄 `require('../js/goal-templates-registry')` — 서버 require 경로이므로 부품도 require 로 읽힌다.
3. #732 보고 "단독 로드 실패" 원인을 먼저 재고, 분열이 그 상태를 악화시키지 않게 한다(개선은 보고만, 동작 변경 금지).
4. 증명: `git archive` 기준 사본 대비 deepStrictEqual·함수 토큰 동일, 원본·부품 단독 로드(법정 탐침 방식) 회귀 0, 목표 템플릿 화면 게스트 DOM 비교 0, `api/goaltemplate.js` 를 노드로 직접 불러 여러 키워드에 같은 결과, npm test 동일.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- 본질: 서버 전용 "전문가 템플릿 고르기 규칙" 파일에 규칙 함수(50줄)와 자료(2,760줄)가 한 덩어리로 들어 있다. 자료는 템플릿 id 접두로 이미 분야별로 이어져 있다(측정: 규칙·항목 모두 HLT→STD→CAR→HOB→MND→REL, 끊김 0, 각 10개) — 분야가 같이 바뀌는 단위다.
- 원인(단독 로드 실패, 측정): 법정 탐침 `loadOne`(court/probes/module-load.js) 결과 기준 `ok:false, ReferenceError: module is not defined`. 이 파일은 처음부터(#TASK-ES-101 d59ef1c, #TASK-ES-290 68cf408) 서버 전용 CommonJS 이고 맨 끝 2810줄 `module.exports = { … }` 가 가드 없이 `module` 을 쓴다. 탐침의 vm 은 브라우저 흉내라 `module` 이 없다. `index.html` 에 이 파일 script 태그는 없다(검색 0) — 앱 화면에서 깨지는 것은 아니고, 탐침이 "양쪽 모두 실패(탐침 불충분)"로 남기는 상태다. 고치려면 `if (typeof module !== 'undefined')` 가드 한 줄이면 되지만 동작 변경이므로 이번에는 하지 않는다(별도 티켓 후보).
- 중심: 원본의 **이름·순서·꼬리**는 그대로 둔다. 자료 두 덩어리 자리에 `var MATCH_RULES = []; var TEMPLATE_MAP = {};` 와 부품을 require 해 접두 순서대로 push·키 대입하는 즉시 실행 함수 하나를 둔다. 같은 줄 위치에서 같은 값이 완성되므로 바로 아래 `COMPILED_RULES` 계산·`findExpertTemplate` 의 첫 일치 순서가 같다.
- 핵심: 단독 로드 상태를 악화시키지 않는 것. 부품 require 를 `typeof require === 'function'` 로 감싸 탐침 vm(require 없음)에서는 빈 자료로 끝까지 진행 → 기준과 **같은 줄의 같은 오류**(`ReferenceError: module is not defined`)로 끝난다. 부품 6개는 `module` 을 `typeof` 로만 보고 즉시 실행 함수 안에 있어 단독 로드 오류 0·새 전역 0.

## 3. [원칙 ③] 해결방식

- 생성기 `docs/design/harness/module-split/gen-expert-templates.js`: 기준 원본을 읽어 두 구간 경계·원소 60/60·접두 순서·분야별 10개를 검사하고, 원소 줄을 끝 쉼표까지 **한 글자도 바꾸지 않고** 부품으로 옮긴다(손으로 옮긴 글자 0). 원본은 머리 1줄 + 조립 18줄 + 기준 꼬리 51줄로 다시 쓴다.
- 위치 [기본값]: `js/data/expert-templates/<분야>.js` — 앞선 자료 분열(#TASK-ES-364 `js/data/goal-templates/`)과 같은 자리 관례, 이름은 하는 일(전문가 템플릿 자료) + 분야. 브라우저 쪽 `js/data/goal-templates/` 와는 자료 모양(id 키 지도·정규식 규칙)이 달라 합치지 않는다.
- JSON+fetch 는 쓰지 않는다(지시). 부품은 `module.exports = { MATCH_RULES, TEMPLATE_MAP }` 만 낸다.
- 시험지 선행 PR: 불필요(측정). 원본 글자를 읽는 시험은 `scripts/smoke-test.js` ES-290(`formatScheduleBackgroundLayout` 글자)·`tests/schedule-dual-bg.test.js`(함수 정의·노출 글자, require) 둘뿐이고 둘 다 원본에 남는 꼬리 글자다. 자료 글자를 원본에서 읽는 시험 0(검색).

## 4. [원칙 ④] 재검토 — 한계(정직하게)

- 줄 수: 원본 2,815 → 72. 부품 6개 각 476줄. 모듈 가드 ④(800줄 초과 js) 3 → 2.
- 법정 모듈 로드 탐침은 `js/` 바로 아래 파일만 읽는다(`listModules` 기본 `['js']`) — 부품 6개는 법정 탐침 목록에 들어가지 않는다. 그래서 검사기가 같은 `loadOne` 을 부품마다 직접 불러 쟀다.
- 화면: 이 파일은 브라우저가 부르지 않는다. 목표 탭 템플릿 고르기·추천 화면은 `js/goal-templates-data.js`(별개 파일)를 쓰고, 추천의 서버 호출(`/api/goaltemplate`)은 로컬 비교에서 목 응답이다. 게스트 DOM 비교는 "이 분열이 화면에 새는 것이 없음"을 보이는 것이고, 레지스트리 자체의 동작 증명은 서버 폴백 직접 호출(아래 ⑧)이다.
- 운영 서버(Vercel) 함수 묶음은 문자열 그대로의 `require('./data/expert-templates/…')` 를 따라가 부품을 함께 싣는 것이 정상 경로지만, 배포 뒤 운영 호출로는 재지 않았다(아래 확인 못 한 것).

## 5. [원칙 ⑤] 절차

1. 단독 로드 원인 측정(`loadOne`) → 2. `git archive origin/main`(c7b85d1) 기준 사본 → 3. 생성기 실행 → 4. 검사기 `verify-expert-templates.js` → 5. `module-specs --write` → `spec-expert-templates.js`(손 칸 kind·role·spans, 원본 세포 값 읽음) → `module-specs --write` → `module-guard --update` → `cell-map-export.js` → 6. 법정 모듈 로드 탐침(로컬)·게스트 조작 비교 `dom-compare-templates.js`(#TASK-ES-364 도구, 기준 대 기준·기준 대 후)·`tab-check.js goals` 기준 2회·후 1회 → `tab-compare.js` → 7. npm test 기준·후 → 8. REQ·claims·dev_log·TICKETS·PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "자료 객체가 이제 부품 모듈의 것이라, 누가 반환값을 고치면 부품 쪽 자료가 바뀐다 — 이전과 다르다." → 이전에도 `findExpertTemplate` 은 `tmpl.milestones` 배열을 복사 없이 그대로 돌려줬다(꼬리 글자 동일). 원본 `TEMPLATE_MAP[k]` 와 부품 `TEMPLATE_MAP[k]` 는 **같은 객체**라 고친 결과가 보이는 범위도 이전(한 모듈 안 한 객체)과 같다. 부품을 따로 require 하는 곳은 원본뿐이다(검색).
- 반론 2: "`typeof require === 'function'` 분기는 동작 변경이다." → node·Vercel 함수에서 `require` 는 늘 함수라 분기는 늘 같은 쪽이다(서버 폴백 27입력 deepStrictEqual). 다른 쪽은 require 가 없는 곳(탐침 vm)뿐이고 거기서는 기준과 같은 오류로 끝난다(검사기 `standalone-load`: 기준·작업 `ok:false` · 오류 문구 같음). 분기가 없으면 탐침 오류가 `require is not defined` 로 바뀌어 "악화하지 않게"를 글자로 증명할 수 없다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- 원본 `js/goal-templates-registry.js`: `MATCH_RULES`·`TEMPLATE_MAP`(조립)·`COMPILED_RULES`·`findExpertTemplate`·`formatScheduleBackgroundLayout`·`module.exports`.
- 부품 `js/data/expert-templates/health.js`·`study.js`·`career.js`·`hobby.js`·`mind.js`·`relation.js` — 각 `MATCH_RULES`·`TEMPLATE_MAP` → `module.exports = part`.
- 쓰는 곳 `api/goaltemplate.js` `localGoalTemplateFallback`(143줄 require). DOM(게스트 비교): `#btnGoalsSubTemplate`·`#templateEncyclopediaView`·`#btnGoalTemplateEncyclopedia`·`#templateEncyclopediaModal`·`#tabTplOurgoalAi`·`#tplAiCategoryChips`·`#tplAiCardsList`.
- 도구(`docs/design/harness/module-split/`): `gen-expert-templates.js`·`verify-expert-templates.js`·`spec-expert-templates.js`, 재사용 `dom-compare-templates.js`(#TASK-ES-364).
- 신고서: `docs/architecture/modules.json` 새 세포 6개(hybrid, spans goals·comm — 원본 값), `cell-descriptions.json` 짧은 이름·하는 일 6줄, `cell-map.json` 재생성, 기준선 ④ 에서 `js/goal-templates-registry.js` 빠짐.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

수치는 `reports/TASK-ES-425/` 보고 파일의 값이다.

| 항목 | 도구 | 결과 |
| :-- | :-- | :-- |
| 노출 동일 | `verify-expert-templates.js`(기준 = `git archive origin/main` c7b85d1) | `module.exports` 4이름·순서 같음, `MATCH_RULES`(60)·`TEMPLATE_MAP`(60) `assert.deepStrictEqual` 통과 + JSON 문자열(키·규칙 순서) 같음, 함수 2개 소스 글자 같음 — `verify-expert-templates.json` `ok: true` |
| 글자·토큰 동일 | 같은 검사기 | 옮긴 줄 2,760 = 기준 자료 줄 2,760(분야별·순서대로 한 글자도 다르지 않음), 머리 1줄·꼬리 51줄 같음, 재구성 토큰열 6,661 = 기준, 함수 꼬리 토큰 291 같음 |
| 단독 로드 | 같은 검사기(법정 `loadOne`) | 원본: 기준 `ok:false · ReferenceError: module is not defined` = 작업 같은 결과(악화 0). 부품 6개 각각 오류 0·새 전역 0 |
| 법정 모듈 로드 탐침 | `court/probes/module-load.js`(로컬) | 회귀 0, head 72/71 · base 72/71(실패 1개 = 양쪽 같은 `goal-templates-registry.js`) — `module-load-probe.json` |
| 서버 폴백 | 검사기가 두 판 `api/goaltemplate.js` 를 require | `localGoalTemplateFallback`·`findExpertTemplate` 27입력(빈 문자열·공백·비적중 포함) 결과 deepStrictEqual, 전문가 템플릿 적중 13, `formatScheduleBackgroundLayout` 5입력 같음 |
| 게스트 조작 비교 | `dom-compare-templates.js`(#TASK-ES-364) | 22단계 242값: 기준 대 작업 0 · 기준 대 기준 0, 콘솔 오류 0/0 — `dom-compare-templates.json`·`dom-compare-templates-base-vs-base.json` |
| 목표 탭 실측 | `tab-check.js goals --deadclick off` 기준 2회·후 1회 → `tab-compare.js` | 408값: 기준1 대 기준2 0 · 기준1 대 작업 0 · 기준2 대 작업 0 |
| npm test | 기준(git archive 사본)·작업 | 둘 다 종료 0, smoke 443/0 · 무결성 38/38 · 버튼 943/943, 검사 줄 513 동일, 모듈 가드 ④ 3 → 2(이 PR 의 목적) — `test-compare.json`. 관련 tests 5개 종료 코드 같음(legacy-cleanup 은 기준에서도 1 — 기존) |
| 줄 수 | 같은 검사기 | 원본 72, 부품 각 476 |

폐기(retire) 청구 없음. 시험 기대값 변경 0. 동결 파일 변경 0. 시험 파일 변경 0.
