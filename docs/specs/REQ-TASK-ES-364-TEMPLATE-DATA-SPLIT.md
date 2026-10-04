# REQ — #TASK-ES-364 목표 템플릿 데이터 파일을 카테고리 6개 파일로 나누기 (쪼개는 순서 7, 동작 그대로)

- 근거: `docs/architecture/MODULE-BLUEPRINT.md` 8절 쪼개는 순서 7번(데이터 파일 — goal-templates-data 3,526줄). 틀 `docs/specs/MODULE-SPLIT-PROTOCOL.md`(0절 다섯 원칙·5절 절차).
- 범위: `js/goal-templates-data.js` 한 파일. 템플릿 60종 배열 → `js/data/goal-templates/<category>.js` 6개, 원래 파일은 조립자. `index.html` 은 `<script>` 6개 추가만. `js/goal-templates-registry.js`(서버 `api/goaltemplate.js` 용, 2,815줄)는 이번 범위 밖(데이터·로직이 섞인 별도 작업).
- 템플릿 수(이 파일 60종)·순서·내용 변경 0. 기능 추가·삭제 0. 공용 모달 파일(team-linked-goals·team-visibility-levels·theme-system·time-tracker·js/core/)은 건드리지 않았다.

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지

1. `js/goal-templates-data.js`(3,526줄, 800줄 넘는 세포 12개 중 하나)는 대부분 코드가 아니라 템플릿 데이터다. 책임(카테고리) 단위 여러 파일로 나누어 각 800줄 이하로 만든다. 줄 수 분할(part1/part2) 금지.
2. 전역 `OURGOAL_60_TEMPLATES`(list·getByCategory·getById·search)와 읽는 쪽(index.html 3곳·`js/team-invite-comm.js` 2곳·`js/viral-sharing.js` 2곳) 동작 그대로.
3. 증명: 분리 전후 배열 deepStrictEqual(부품 시험, npm test 경로), 템플릿 화면 전후 차이 0. 신고서 `module-specs --write`, 모듈 가드 통과(④ 12→11).

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 템플릿 한 종을 고치거나 더할 때마다 3,526줄짜리 파일 하나를 통째로 만져, 다른 카테고리 작업과 같은 파일에서 충돌하고 가드의 800줄 상한을 넘는다.
- **원인**: 60종 데이터(JSON 모양 객체)와 조회 함수 4개가 한 팩토리 함수 안 지역 배열 `TEMPLATES` 하나에 들어 있다. 로직은 50줄 남짓이다.
- **중심**: `var TEMPLATES = [ … ];`(이전 전 19~3499줄). 원소는 카테고리별로 끊김 없이 10개씩(health·study·career·hobby·mind·relation 순)이다(생성기가 확인).
- **핵심**: 카테고리 경계로 글자 그대로 잘라 6개 파일에 두고, 원래 파일은 같은 순서로 이어 붙여 같은 `TEMPLATES` 를 만든 뒤 원래 꼬리(`isAi` 표시·반환 객체)를 글자 그대로 둔다.

## 3. [원칙 ③] 해결방식

- 생성기 `docs/design/harness/module-split/gen-template-data.js <APP> <이전 전 파일>`: 원소 경계 60개·카테고리 연속·순서 검사 → 6개 파일 생성 → 조립자 생성 → 옮긴 원소 글자 = 원본 원소 글자 검사(파트 마지막 원소 끝 쉼표만 다름). 손으로 옮기지 않았다.
  - `js/data/goal-templates/health.js` 601줄 · `study.js` 595줄 · `career.js` 601줄 · `hobby.js` 603줄 · `mind.js` 595줄 · `relation.js` 598줄(각 10종)
  - `js/goal-templates-data.js` 3,526 → 69줄(조립자). 머리(UMD 노출부)와 꼬리(getByCategory·getById·search)는 원래 글자 그대로.
- 전달 방식: 브라우저는 데이터 파일이 `OurgoalGoalTemplateParts.<category>` 에 배열을 두고 조립자가 읽는다. Node 는 조립자가 `require('./data/goal-templates/<category>.js')` 로 읽는다(서버·시험 경로).
- **[기본값] JSON 이 아니라 js 로 둔다**: 읽는 쪽 7곳이 모두 `OURGOAL_60_TEMPLATES` 를 **동기**로 부른다(첫 렌더·이식·미리보기). JSON 은 `fetch` 비동기라 로드 순서가 바뀌고, 데이터가 오기 전 렌더는 `CREATOR_TEMPLATES` 폴백으로 빠진다(동작 변경). js 파일은 `<script>` 순서대로 동기 실행되어 기존 시점과 같다.
- **[기본값] 위치 `js/data/goal-templates/`**: 데이터는 목표 탭·소통(team-invite-comm)·공유(viral-sharing)가 같이 읽어 탭 전용이 아니다(`js/tabs/goals/` 에 두면 ⑤ 탭 간 직접 참조 의미가 흐려진다). 시험지 합본(js/tabs·js/core)이 이 데이터 글자를 찾는 단언은 0개(시험지·법정·api 전수 검색)라 합본 경로에 둘 필요가 없다.
- `index.html`: `js/goal-templates-data.js` 태그 바로 앞에 6개 태그 추가(`?v=20261004-es364`). 조립자 태그의 `?v=` 는 그대로 — 예전 조립자가 캐시에 남아도 그 파일은 데이터를 스스로 가진 이전 판이라 동작한다.

## 4. [원칙 ④] 재검토 — 한계(정직하게)

- **전역 이름 1개 추가**: `OurgoalGoalTemplateParts`(데이터 묶음). 브라우저에서 `<script>` 파일끼리 데이터를 넘기려면 전역 하나가 필요하다. 이 이름을 찾는 다른 코드는 0개라 새 분기가 돌지 않는다(틀 0절 4의 위험 없음). `window.이름 =` 꼴이 아니라 지표 ③(282)은 그대로다 — 숨긴 게 아니라 지표 정의 밖이라는 뜻이며, 시험이 브라우저 경로에서 새 전역이 이 1개뿐임을 단언한다.
- `goal.template` 자리 연결(`slots.contribute`)은 하지 않았다 — 틀 5절 6에 따라 등록 순서·오류 경로가 바뀌므로 다음 별도 PR.
- 320종: 이 파일이 내는 템플릿은 60종이다(지시서의 320종은 이 파일 기준 수가 아니다 — 헌법 10.2 의 기능 수량 규격). 이 파일 60 → 60, 변경 0.
- 데이터 파일 하나가 로드에 실패하면 조립자는 그 카테고리를 빼고 나머지를 잇는다(이전에는 파일 하나라 전부 있거나 전부 없음). 정상 경로는 같다.

## 5. [원칙 ⑤] 절차

워크트리 `C:/dev/wt/data-split`(브랜치 `feat/2026-10-04-task-es-364-template-data-split`, 기준 origin/main 9962457) → 읽는 쪽 전수(`OURGOAL_60_TEMPLATES`·`goal-templates-data`) → 생성기 → 동일성 시험(`tests/goal-templates-data-split.test.js`, `scripts/test-shipyard-modular.js` [Test 6] 에 연결) → 변이 시험 2종 → 템플릿 화면 DOM 비교(기준 대 기준 → 기준 대 후) → tab-check 목표·소통 탭 → 게스트 시나리오(기준·후 둘 다) → 신고서·가드 → npm test → 커밋·PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "Node 에서 `this` 는 전역이 아니라 `module.exports` 라 데이터 파일이 전역 묶음에 못 넣는다." → Node 에서는 데이터 파일이 `module.exports = LIST` 만 하고, 조립자가 `require` 로 읽는다(전역을 거치지 않음). 시험이 Node 경로와 브라우저 경로(vm 에서 index.html 순서로 7파일 실행)를 따로 재어 둘 다 원본 지문과 같음을 확인한다.
- 반론 2: "같은 객체를 두 곳(파트 배열·TEMPLATES)에서 참조하면 `isAi = true` 표시가 파트 배열까지 바꿔 다르다." → 이전에도 `TEMPLATES` 원소에 직접 달았고, 읽는 쪽은 `OURGOAL_60_TEMPLATES` 만 본다(`OurgoalGoalTemplateParts` 를 읽는 코드 0). 결과 배열은 deepStrictEqual 로 같다.
- 반론 3: "시험이 자기 자신과 비교하면 공허하다." → 기준은 git 의 분리 전 커밋 원본(못 읽으면 분리 전 JSON 지문 sha256)이다. 변이 시험: 파트 한 값(weeks)을 바꾸면 지문 단언이, 카테고리 순서를 바꾸면 id 순서 단언이 실패함을 확인했다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- DOM(읽는 쪽이 그리는 곳, 마크업 그대로): `#btnGoalsSubTemplate`, `#templateEncyclopediaView [data-subtcat]`·`[data-subtpl-prev]`·`[data-subtpl-clone]`, `#btnGoalTemplateEncyclopedia`, `#templateEncyclopediaModal`, `#tabTplOurgoalAi`, `#tplAiCategoryChips [data-encycl-cat]`, `#tplAiCardsList [data-ai-start]`, `.s-goal-pills-wrap .s-goal-pill`.
- 함수·전역: `OURGOAL_60_TEMPLATES.list`·`getByCategory`·`getById`·`search`, 조립자 `loadParts`·`PART_ORDER`, 데이터 묶음 `OurgoalGoalTemplateParts`, 읽는 쪽 `renderAiTemplatesList`·`renderTemplateEncyclopediaScreen`·`cloneTemplate`(index.html), `renderTemplatesAccordionHtml`(team-invite-comm.js).
- 파일: `js/goal-templates-data.js`, `js/data/goal-templates/{health,study,career,hobby,mind,relation}.js`, `index.html`, `tests/goal-templates-data-split.test.js`, `scripts/test-shipyard-modular.js`, `docs/design/harness/module-split/gen-template-data.js`·`dom-compare-templates.js`, `docs/architecture/modules.json`·`module-baseline.json`, `reports/TASK-ES-364/`.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

모두 로컬(정적 서버 + 헤드리스 Chrome + 게스트 시드 + Supabase 목, 원격·실계정 없음). 기준 = origin/main 9962457(분리 커밋) · 합친 뒤 a2c593f(화면 비교 재실행). 결과 파일 `reports/TASK-ES-364/`.

| 항목 | 도구 | 결과 |
| :-- | :-- | :-- |
| 배열 동일 | `tests/goal-templates-data-split.test.js` | 10건 통과 — Node·브라우저 경로 list deepStrictEqual 원본, 지문 6151e77a… 동일, 60종·id 순서 동일, getByCategory·getById·search 동일 |
| 변이 시험 | 파트 값 1개·카테고리 순서 바꿔 실행 | 둘 다 실패(시험이 잡음) |
| 템플릿 화면 조작 | `dom-compare-templates.js` 22단계 × 11칸 | 기준 대 후 242값 차이 0 (기준 대 기준: 오늘 미션 지문 `hash` 11곳만 본질 변동 → 제외 후 0) |
| 목표 탭 실측 | `tab-check.js goals --deadclick off` 기준(a2c593f) 2회·후 | 기준 대 기준 408값 차이 0 · 기준 대 후 408값 차이 0 (소통 탭은 첫 시도가 진행되지 않아 이번에 재지 않음) |
| 게스트 시나리오 | `reports/TASK-ES-364/scenarios/goal-template-pick.json` (법정 실행기 로컬) | 기준·후 모두 통과, 공허 확인 0 |
| 모듈 가드 | `scripts/module-guard.js` | ① 35905 · ② 691 · ③ 282 · ④ 12→11 · ⑤ 0, 기준선 `--update` |
| npm test | | 0 실패 — 443 통과 · 38/38 · 버튼 957/957 · 모듈 시험 전부 |

* **진행 단계**: [4단계: 심사 청구]
