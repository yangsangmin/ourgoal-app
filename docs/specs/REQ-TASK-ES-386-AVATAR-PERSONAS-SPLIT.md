# REQ/PLAN — TASK-ES-386 아바타 페르소나 320종 데이터를 MBTI 16개 파일로 나눈다 (아바타·EXP 쪼개기 PR-2)

> 근거: 병합된 설계 `docs/specs/REQ-TASK-ES-384-AVATAR-EXP-PLAN.md` 5절 표의 **PR-2 데이터** 행. 선행 PR-1 #700(TASK-ES-385, 시험지가 아바타 합본을 읽음) 병합 뒤 착수. 선례 #679(TASK-ES-364 목표 템플릿 데이터 분리).
> 동작·순서·내용 변경 0. 금고 파일(court/**·AGENTS.md·CLAUDE.md·.github/workflows/**·scripts/essence-gate.js·scripts/verify-integrity-gate.js·package.json scripts·vercel.json) 변경 0. 검사 폐기(retire)·기대값 변경 0.

## REQ
- 대상 파일: `js/avatar-system.js`(조립 줄로 교체), (새) `js/data/avatar-personas/{intj,intp,entj,entp,infj,infp,enfj,enfp,istj,isfj,estj,esfj,istp,isfp,estp,esfp}.js`, `index.html`(`<script>` 16개 추가만), (새) `tests/avatar-personas-split.test.js`, `scripts/test-shipyard-modular.js`(시험 등록 1줄), (새 도구) `docs/design/harness/module-split/gen-avatar-data.js`·`dom-compare-avatar-personas.js`, `docs/architecture/modules.json`·`module-baseline.json`
- 대상 전역·함수: `window.OurgoalAvatar.BODY_THEMES_320`(같은 배열), `getAllThemes`·`getThemesByMbti`·`getThemesByGroup`·`searchThemes`·`getTheme`/`getThemeById`(코드 그대로), (새) `PERSONA_PART_ORDER`·`loadPersonaParts()`·`PERSONA_PARTS`(avatar-system.js 안), (새 전역) `OurgoalAvatarPersonaParts.<mbti>`(데이터 묶음)
- 대상 DOM ID(화면 비교): `#btnSettingsQuickAvatar`, `#avatarTypeToggle`, `#btnToggle320PersonaCatalog`, `#persona320CatalogSlot`, `#toggle320Arrow`, `#inputSearchPersona320`, `#persona320GroupTabs`, `#persona320ItemsContainer`(`.persona-theme-card[data-tid]`), `#btnCancelAvatarModal`, `#toast`

## 1. [원칙 ①] 목표 정의
`js/avatar-system.js`(7,351줄) 안의 320종 페르소나 데이터(`var BODY_THEMES_320 = [ … ];`, 122~4283줄)를 MBTI 16개 데이터 파일로 글자 그대로 옮긴다. avatar-system.js 는 같은 이름·같은 순서·같은 내용의 배열을 다시 만든다. 화면·저장값·공개 이름은 바뀌지 않는다.

## 2. [원칙 ②] 본질·원인·중심·핵심
- 본질: 한 파일에 「데이터 4,161줄 + 로직 3,190줄」이 섞여 있어 로직을 나누는 다음 PR(PR-3·4)의 비교가 데이터 글자에 묻힌다.
- 원인: TASK-ES-127 때 320종을 배열 리터럴로 파일 안에 넣었다.
- 중심: 데이터는 로직이 없는 글자 덩어리라 「옮기기만」으로 전후 0 을 증명할 수 있다 — 가장 먼저 덜어 낼 수 있다.
- 핵심: MBTI 경계(20개씩, 끊김 없음)로 나누고, 읽는 쪽은 한 줄도 바꾸지 않는다(배열 이름 `BODY_THEMES_320` 그대로).

## 3. [원칙 ③] 해결 방식 — 구체적 식별자
- 생성기 `docs/design/harness/module-split/gen-avatar-data.js <APP> <이전 전 avatar-system.js>`(입력은 `git show ddbb761:js/avatar-system.js` — LF 원문). 검사 ①원소 320개 ②MBTI 연속 ③순서 = PART_ORDER, 각 20개 ④옮긴 글자 = 원본(파트 마지막 원소의 끝 쉼표만 다름) ⑤배열 구간 밖 3,189줄 글자 = 원본. 어기면 중단.
- 데이터 파일: `(function(root){ var LIST = [ …20개… ]; module.exports = LIST 또는 root.OurgoalAvatarPersonaParts.<mbti> = LIST; })(typeof self !== 'undefined' ? self : this);` — 선례 goal-templates 파트와 같은 꼴.
- avatar-system.js: 배열 자리에 `PERSONA_PART_ORDER`·`loadPersonaParts()`(Node 는 `require('./data/avatar-personas/<mbti>.js')`, 브라우저는 전역 `OurgoalAvatarPersonaParts` 를 이름으로 읽음)·`BODY_THEMES_320.push.apply` 잇기. 전역을 `self`/`window` 가 아니라 이름으로 읽는 까닭: `self` 없는 vm(시험 `enlarge-avatar-icons`)에서 데이터 파일은 전역 this 에 묶음을 두는데, 그 vm 의 `window` 는 별개 객체다.
- index.html: avatar-system.js `<script>` 바로 앞에 16개를 PART_ORDER 순서로(`?v=20261005-es386`). 다른 글자 0.
- JSON 이 아니라 js([기본값], 설계 4-1 D 기각): `getAllThemes` 등 읽는 쪽이 동기 호출 — fetch 는 첫 렌더 순서를 바꾼다.

## 4. [원칙 ④] 재검토 — 다른 길과 비교
- A MBTI 16개(채택): 파일당 279줄, 책임 하나(도감 MBTI 필터 단위).
- B 기질 4묶음(NT·NF·SJ·SP): 80×13 ≈ 1,040줄 + 머리 — 800줄 상한 초과. 기각.
- C 줄 수로 자르기: 원소를 가르거나 책임이 섞임(설계 틀 0절 2 금지). 기각.
- D JSON 파일: 동기 → 비동기로 바뀜. 기각.
- `scripts/verify-integrity-gate.js`·`verify-all-clicks.js`: 페르소나 데이터를 읽지 않음 → 그대로(통과 수 불변 실측).

## 5. [원칙 ⑤] 절차
1) 기준 ddbb761 을 `git archive` 사본으로 풀어 npm test(443·38/38·943/943) → 2) 생성기 실행(검사 ①~⑤) → 3) index.html `<script>` 16개 → 4) 부품 시험(기준 = `git show ddbb761` 원문을 실행한 배열) + 변이 2종 → 5) 화면 DOM 비교(기준 사본 vs 작업, 기준 vs 기준) → 6) 법정 시나리오 로컬 실행(기준·작업) → 7) module-specs --write · module-guard --update → 8) 변경 후 npm test → 9) claims·기록·PR.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파
- 반론① 「배열 리터럴 → push 로 바꾸면 값은 같아도 동작이 다를 수 있다(공유 참조·순서)」 → 원소 객체는 데이터 파일의 같은 객체이고, avatar-system.js 는 모듈 캐시로 한 번만 실행된다(이전과 같이 배열 하나). 순서는 PERSONA_PART_ORDER 고정이며, 시험이 Node·브라우저(self 있음·없음) 세 경로 모두 원본 배열과 deepStrictEqual 을 잰다. 순서를 바꾼 변이(intj↔intp)는 시험에서 실패함을 확인했다.
- 반론② 「데이터 파일이 로드되지 않으면(태그 누락·순서 뒤바뀜) 조용히 빈 배열이 된다」 → 시험이 index.html 의 `<script>` 순서를 직접 읽어 「16개가 PART_ORDER 순서로 avatar-system.js 앞」을 단언하고, 그 순서대로 vm 실행해 지문(sha256)을 잰다. 기존 smoke `[#TASK-ES-127]` 검사(320개 전수·id 1~320·MBTI 16×20)도 그대로 돈다. 빈 배열 폴백(77종)은 원래 코드(`themePool`·`getThemeById` 꼬리)에 있던 것이라 손대지 않았다.

## 7. [원칙 ⑦] 즉시 실행 — 결과
- `js/avatar-system.js` 7,351줄 → 3,222줄(배열 4,162줄 → 조립 33줄, 그 밖 3,189줄 글자 그대로 — 생성기 ⑤).
- `js/data/avatar-personas/*.js` 16개, 각 279줄·20종(id 1~20 intj … 301~320 esfp).
- index.html +16줄(`<script>` 만). 제품 코드 그 밖 변경 0, 금고 파일 0.

## 8. [원칙 ⑧] 성과 측정 · 막히는 지점
작업자 실측(판정 아님 — 판정은 법정):
- 부품 시험 `tests/avatar-personas-split.test.js` 13건 통과: Node 배열 = `git show ddbb761` 원본 실행 배열(deepStrictEqual, 지문 b556882b0a91…), 공개 이름 42개 같음, 브라우저 vm(index.html 순서, self 있음·없음) 같음, 새 전역은 `OurgoalAvatarPersonaParts` 하나, 조회 함수 결과 같음, 변이 ①(esfp 색 1개)·②(intj↔intp 순서) 모두 비교 실패로 잡힘, 파일 800줄 이하, 로드 순서.
- 화면 DOM 비교(`reports/TASK-ES-386/dom-compare-avatar-personas.json`): 게스트·설정 → 아바타 모달 → 만화형 → 도감 펼치기 → 4군·전체 탭 → 카드 2번 선택 → 검색 5가지 → 접기·펼치기 → 닫기 19단계, 비교 228값 차이 0, 콘솔 오류 0/0. 같은 기준끼리 2회도 228값 차이 0(`…-base-vs-base.json`).
- 법정 시나리오 `scenarios/avatar-persona-catalog.json` 을 법정 실행기(court/lib/scenario.js)로 로컬 실행: 기준·작업 모두 통과, 화면 캡처 지문 두 장 모두 기준과 같음(나누기만 했으므로 기준에서도 통과하는 것이 맞다).
- npm test: 기준 443·0 / 38/38 / 943/943 / 셀 구조 통과 → 후 443·0 / 38/38 / 943/943 / 통과(+ 새 부품 시험 13건).
- 모듈 가드 ④: 800줄 넘는 파일 수는 10 그대로(avatar-system.js 가 아직 3,222줄 — PR-3·4 에서 더 나눈다), 그 파일 기준선 7,351 → 3,222줄로 낮춤(history 15번째). 새 파일 16개는 모두 800줄 이하라 ④ 를 늘리지 않음.
- 확인 못 함: 실계정 로그인 상태의 아바타 적용·서버 저장(`users.avatar_url`) — 이 PR 은 저장 코드를 바꾸지 않았고 테마 객체 동일만 쟀다. 진짜 폰 확인 없음.
- 막히는 지점: PR-3 은 같은 avatar-system.js 를 고치므로 이 PR 병합 뒤에 착수(병렬 금지).

* **체크리스트 마감 규칙**: 본 작업계획서는 [4단계: 심사 청구]까지만 등록함.

- [x] 1. 목표 정의 · [x] 2. 현상 분석 · [x] 3. 원인 추정 · [x] 4. 대안 탐색 · [x] 5. 실행 계획 · [x] 6. 절차 재검증·반론 격파 · [x] 7. 즉시 실행 · [x] 8. 성과 측정
- [x] [4단계: 심사 청구]
