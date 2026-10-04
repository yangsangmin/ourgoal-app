# REQ/PLAN — TASK-ES-389 아바타 로직을 책임 세포 5개(js/avatar/)로 나눈다 (아바타·EXP 쪼개기 PR-3)

> 근거: 병합된 설계 `docs/specs/REQ-TASK-ES-384-AVATAR-EXP-PLAN.md` 3-1·3-2절 표의 **PR-3 로직 세포** 행. 선행 PR-1 #700(TASK-ES-385 시험지가 아바타 합본을 읽음)·PR-2 #702(TASK-ES-386 페르소나 데이터 분리) 병합 뒤 착수. 기준 커밋 origin/main `d9bd7f0`(#702 병합).
> 동작·순서·내용 변경 0. 금고 파일(court/**·AGENTS.md·CLAUDE.md·.github/workflows/**·scripts/essence-gate.js·scripts/verify-integrity-gate.js·package.json scripts·vercel.json) 변경 0. 검사 폐기(retire)·기대값 낮추기 0.

## REQ
- 대상 파일: `js/avatar-system.js`(조립자로), (새) `js/avatar/{themes,render,craft-engine,wallet,dynamic-album}.js`, `index.html`(`<script>` 5개 추가만), `tests/avatar-personas-split.test.js`·`tests/avatar-rank-background.test.js`·`tests/avatar-10slots-growth.test.js`(읽는 범위만 넓힘), (새 도구) `docs/design/harness/module-split/gen-avatar-logic.js`·`verify-avatar-logic.js`·`dom-compare-avatar-logic.js`·`spec-avatar-logic.js`·`real-account-avatar-wallet.js`, `docs/architecture/modules.json`·`module-baseline.json`
- 대상 전역·함수: `window.OurgoalAvatar`(공개 이름 42개 그대로), (새 전역) `OurgoalAvatarParts`(부품 통로), 옮긴 선언 32개 — themes: `BODY_THEMES_77`·`getAllThemes`·`getThemesByMbti`·`getThemesByGroup`·`searchThemes`·`getThemeById`·`renderPersona320ListHtml` / render: `getRobotAvatarSvg`·`getWoodHammerMakerAnimationHtml`·`RANK_THEMES_5`·`getRankThemeInfo`·`getRankWingsSvg`·`renderAvatarHtml` / craft-engine: `composite3DeformedAvatar`·`getSmartFallbackFeatures`·`extractPersonalFeatures`·`drawCartoonHead`·`collectPeriodPersonaSummary`·`fetchAvatarPersona` / wallet: `isLegacyAccount`·`getMaxCrafts`·`getRemainingCrafts`·`maybeGrantStreakBonus`·`getSavedAvatars`·`addSavedAvatar`·`removeSavedAvatar`·`renderSavedAvatarsDeckHtml` / dynamic-album: `DYNAMIC_SITUATIONS`·`getDynamicAvatarSvg`·`getDynamicAlbum`·`saveDynamicAlbum`·`openDynamicAlbumModal`. 남는 것: `openAvatarModal`(PR-4 몫)·`showAvatarLegalNotice`·상수 4개·페르소나 조립·`api`·기능 카드 6개(아래 7절).
- 대상 DOM ID(화면 비교): `#topAvatar`, `#levelBadgeRow`, `#screen-home`, `#screen-settings`, `#btnSettingsQuickAvatar`, `#avatarTypeToggle`, `.avatar-period-chip`, `#btnSetAvatarPeriod`, `#savedAvatarsDeckSlot`(`.saved-avatar-card`·`.empty-avatar-slot`), `#btnToggle320PersonaCatalog`, `#persona320ItemsContainer`, `#btnSaveAvatarModal`, `#btnOpenDynamicAlbum`, `.btn-equip-dynamic-avatar`, `#btnCloseDynamicAlbumModal`, `#modalOverlay`, `#toast`

## 1. [원칙 ①] 목표 정의
`js/avatar-system.js`(3,222줄) 의 로직 선언을 설계 3-1절 책임 단위 세포로 글자 그대로 옮긴다. 바꾸는 글자는 부품 사이 이름 참조(`AV.<이름>`)·가져오기 줄·자리 안내 주석뿐이다. 공개 이름 42개·호출 순서·`window.handle아바타_*` 대입 시점·화면·저장값은 바뀌지 않는다. 각 새 파일 800줄 이하, part1/part2 금지, 자리 연결은 하지 않고 신고서 `planned` 에만 적는다.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심
- 본질: 그리기·제작권·보관함·합성·앨범이 한 팩토리 3천 줄에 섞여 있어 하나를 고치려면 전체를 읽고, 다음 PR(모달 섹션 PR-4)의 비교가 다른 책임 글자에 묻힌다.
- 원인: 기능 카드마다 같은 파일 끝에 선언을 덧붙여 온 결과 — 팩토리 최상위 선언 46개가 서로를 이름으로 부른다(같은 스코프).
- 중심: 옮긴 코드가 남는 쪽 이름을 읽는 곳(스코프 분석: `BODY_THEMES_320`·`DEFAULT_BASE_CRAFTS`·`LEGACY_MAX_CRAFTS`·`MAX_AVATAR_CHANGES` 4개)과 부품끼리 부르는 곳(`getThemeById`·`getRobotAvatarSvg`) — 이 26곳만 `AV.` 를 붙이면 나머지 글자는 그대로 옮길 수 있다.
- 핵심: 남는 avatar-system.js 가 팩토리 맨 위에서 옮긴 이름을 **같은 이름**으로 가져오면(`var getRobotAvatarSvg = AV.getRobotAvatarSvg;`) `openAvatarModal`·`api` 객체·`window.*` 대입 줄은 한 글자도 바뀌지 않는다.

## 3. [원칙 ③] 해결 방식 — 구체적 식별자
- 생성기 `gen-avatar-logic.js <APP> <이전 전 avatar-system.js(LF)>`(입력 `git show d9bd7f0:js/avatar-system.js`): @babel/traverse 로 팩토리 최상위 문을 앞 주석과 함께 덩어리로 잡고, 같은 세포로 가는 이어진 문을 묶음(13개)으로 옮긴다. 멈추는 조건: 옮길 이름 재대입·중복 선언, 옮길 데이터 초기값에 실행 식·이름 읽기, 두 문이 한 줄, 문 사이 틈에 글자, 다른 파일 이름에 대입, `AV.` 로 부르는 함수 몸통의 `this`, getter 로 줄 이름의 재대입.
- 부품 파일 꼴: `(function (root, factory) { Node: module.exports = factory / 브라우저: factory(root.OurgoalAvatarParts = root.OurgoalAvatarParts || {}) }(self 또는 this, function (AV) { 'use strict'; …옮긴 글자… AV.<이름> = <이름>; }))`.
- avatar-system.js: `'use strict';` 바로 다음에 이음매 머리 50줄 — `var AV = (Node) ? {} : (OurgoalAvatarParts || {})`, Node 에서 `require('./avatar/<부품>.js')(AV)` 5줄, 옮긴 이름 32개 `var X = AV.X;`, 남는 이름 4개 getter(`Object.defineProperties(AV, …get BODY_THEMES_320() …)`). 옮긴 자리에는 한 줄 안내 주석 13개. avatar-system.js 는 전역을 새로 만들지 않는다(읽기만).
- index.html: avatar-system.js `<script>` 바로 앞에 부품 5개(`?v=20261005-es389`). 다른 글자 0.
- 신고서: `module-specs --write` → `spec-avatar-logic.js`(5세포 kind hybrid·spans·planned: themes `avatar.themes` / render `avatar.render` + 자리 `home.card`·`profile.badge` / craft-engine `avatar.craft` / wallet `avatar.wallet` / dynamic-album `avatar.album` + 자리 `settings.section`; avatar-system.js 는 `xp.award` + `settings.section`) → `module-specs --write` → `module-guard --update`.

## 4. [원칙 ④] 재검토 — 다른 길과 비교
- A 같은 이름 가져오기 + `AV.` 접두(채택): 남는 코드 글자 0 변경, 접두는 시험지가 이미 뗌(#700).
- B 남는 쪽 호출을 모두 `AV.x()` 로: openAvatarModal 879줄의 글자가 바뀌고 `this` 결합이 달라진다. 기각.
- C 줄 수로 자르기(part1/part2): 틀 0절 2 금지. 기각.
- D 부품을 `window.<이름>` 으로 노출: 전역 32개 증가(틀 0절 4 위반, components.js 의 같은 이름 분기가 새로 돈다). 기각 — 새 전역은 통로 `OurgoalAvatarParts` 1개(설계 3-1에 적은 것).
- 기능 카드 세포(feature-cards)는 이번에 옮기지 않는다(7절 — 기준 시험지가 막음).

## 5. [원칙 ⑤] 절차
1) 기준 `d9bd7f0` 을 `git archive` 사본으로 풀어 npm test → 2) 생성기 → 3) 글자·토큰·실행 동일성 `verify-avatar-logic.js` → 4) 시험 3개 읽는 범위 넓힘 → 5) 신고서·모듈 가드 → 6) npm test(작업 트리 + 작업 커밋 `git archive` 사본) → 7) 화면: `tab-check.js home,settings` 기준 2회·후 1회 + `dom-compare-avatar-logic.js` 기준 대 후·기준 대 기준 → 8) 실계정 보관함 왕복(로컬 127.0.0.2 + /api 운영 전달, 기준·작업) → 9) claims·기록·PR.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파
- 반론① 「함수 선언을 `var X = AV.X` 로 바꾸면 끌어올림이 달라져, 선언보다 앞에서 부르던 곳이 깨진다」 → 가져오기 줄은 팩토리의 첫 문(`'use strict'` 바로 다음)이라 팩토리 안 어떤 문보다 먼저 값이 들어간다. 옮긴 var 데이터 3개(`BODY_THEMES_77`·`RANK_THEMES_5`·`DYNAMIC_SITUATIONS`)는 생성기가 순수 리터럴임을 확인했다(부품 파일이 먼저 실행돼도 같은 값). 실행 비교 ④·⑤ 가 Node·브라우저(self 있음·없음) 세 경로에서 공개 이름 42개 순서·함수 33개 토큰·데이터를 기준과 맞댔다.
- 반론② 「`AV.getThemeById()` 처럼 객체에서 부르면 `this` 가 AV 가 되어 동작이 바뀐다」 → `AV.` 로 부르는 함수는 `getThemeById`·`getRobotAvatarSvg` 두 개이고 둘 다 몸통에 `this` 가 없다(생성기가 검사, 있으면 멈춤). 남는 쪽은 `AV.` 를 쓰지 않고 같은 이름 변수로 부르므로 이전과 같다.
- 반론③ 「`window.handle아바타_Item41/42Action` 을 components.js 가 나중에 덮어쓰는 순서가 바뀔 수 있다」 → 대입 if 문 4쌍과 핸들러 선언은 avatar-system.js 원래 자리에 그대로 남았다(기능 카드는 옮기지 않음). 실행 비교 ⑤ 가 `window.handle아바타_*` 4개 = `OurgoalAvatar` 의 같은 함수임을 쟀다.

## 7. [원칙 ⑦] 즉시 실행 — 결과
- `js/avatar-system.js` 3,222줄 → 1,448줄. 남은 것: 이음매 머리 50줄 · 안내 주석 13줄 · 원래 글자 1,385줄(`openAvatarModal` 879줄 포함 — PR-4 에서 섹션으로 나눔).
- 새 파일(줄 수, 생성기 산출): `js/avatar/themes.js` 188 · `render.js` 615 · `craft-engine.js` 626 · `wallet.js` 221 · `dynamic-album.js` 327. 모두 800줄 이하. 옮긴 줄 1,837, `AV.` 를 붙인 줄 23(themes 11·wallet 11·dynamic-album 1).
- **설계 표의 6번째 세포 `feature-cards`(핸들러 4개·대사 2개, 323줄)는 옮기지 않았다.** 기준 시험지 `scripts/smoke-test.js` 는 #700 부터 앱 합본(`APP_SRC`)에 `js/avatar/**` 를 넣고, `[#TASK-ES-155]` 검사가 그 합본에 `showToast(` 글자가 **없어야** 한다고 단언한다. 핸들러 4개의 `win.showToast(` 를 `js/avatar/` 로 옮긴 판을 실제로 돌려 보니 smoke 443 → 442(그 검사 하나 실패). 법정은 기준 시험지로 채점하므로 이 PR 에 넣으면 돌려보냄이다. 길: 시험지 선행 PR — `APP_MODULE_FILES` 의 아바타 범위를 EXP 세포(`js/avatar/xp.js`)로 좁힘(#700 이 넣은 이유가 EXP 이전) — 병합 뒤 `feature-cards` 를 옮긴다.
- 시험 3개: 읽는 범위만 넓힘(단언·기대값 그대로). `avatar-personas-split` 은 index.html 순서의 부품도 같이 실행하고, 새 전역 목록에 부품 통로 1개(`OurgoalAvatarParts`, 부품이 있을 때만)를 더했다. `avatar-rank-background`·`avatar-10slots-growth` 는 `npm test` 에 등록돼 있지 않지만 기준에서 통과하던 단독 시험이라 아바타 합본을 읽게 했다(안 하면 옮긴 글자를 못 찾아 실패).

## 8. [원칙 ⑧] 성과 측정 · 막히는 지점
작업자 실측(판정 아님 — 판정은 법정):

| 무엇 | 도구 | 결과 |
| :-- | :-- | :-- |
| 글자·토큰·실행 동일성 | `verify-avatar-logic.js <작업> <기준 사본>` | 7/7: ① 부품 몸통(AV. 뗌) = 기준 옮긴 줄 1,837줄 그대로 ② 남은 avatar-system.js(머리·안내 주석 뺌) = 기준에서 옮긴 줄 뺀 1,386줄 그대로 ③ 토큰 26,334개 동일(허용 차이 `AV.` 접두·가져오기 줄) ④ Node 공개 이름 42개 순서·함수 33개 토큰·데이터 동일 ⑤ 브라우저 vm self 있음·없음 동일, `window.handle아바타_*` 4개 같은 함수, 새 전역 `OurgoalAvatarParts` 1개 ⑥ 줄 수 — `reports/TASK-ES-389/verify-avatar-logic.json`. 변이(render.js 글자 1개) 넣으면 ①③④⑤ 실패 확인 |
| npm test | 기준 사본 vs 작업 | 기준 smoke 443·0 / 무결성 38/38 / 셀 구조 통과 / 부품 시험 11 → 작업 같은 수, 결과 줄 604줄 차이 0(작업 트리의 `git archive` 사본 기준 — 9절). 작업 트리(.git 있음)는 git 기준 원본 비교 3건이 더 돈다(13 passed) |
| 조작 전후(게스트) | `dom-compare-avatar-logic.js` | 24단계(홈 → 보관함 2칸 시드 → 설정 → 프로필 편집 → 로봇/만화형 → 기간 칩 4개·기간 정하기 → 보관함 카드 2번·빈 칸 → 도감 펼치기·카드 선택 → 적용하기 → 홈 → 설정 → 다이나믹 앨범 열기·착용·닫기 → 홈) × 11칸 = 264값, 기준 대 작업 다른 값 0, 기준 대 기준 0, 콘솔 오류 0/0 — `dom-compare-avatar-logic.json`·`…-base-vs-base.json`. 시간·난수만 지움(앨범 SVG 클립 id 는 `Math.random()` — 기준끼리도 다름) |
| 탭 실측(게스트) | `tab-check.js home,settings` 기준 2회·후 1회 → `tab-compare.js` | 40장(홈 24·설정 16) 732값: 기준 대 기준 0 · 기준 대 작업 0 (9절) |
| 실계정 보관함 왕복 | `real-account-avatar-wallet.js`(로컬 127.0.0.2 + /api 운영 전달, 테스트 계정 A) | 기준·작업 **같은 결과**(5단계 모두 같은 값): 로그인 됨 · 서버 읽기 「column users.saved_avatars does not exist」 · 추가 뒤 서버에 없음 · 기기 사본 파기 뒤 복원 0 — **운영 `users` 표에 `saved_avatars` 칸이 없다**(아래 새 결함 1). 왕복 자체는 확인 못 함 |
| 모듈 가드 | `node scripts/module-guard.js` | ④ 800줄 초과 파일 수 10 그대로, `js/avatar-system.js` 기준선 3,222 → 1,448(history 17번째). 새 파일 5개 모두 800줄 이하 |

- 새 결함(이번에 실측):
  1. **보관함 서버 저장이 운영에서 늘 빠진다** — 운영 `users` 표에 `saved_avatars` 칸이 없어(`select` 응답 「column users.saved_avatars does not exist」) `saveProfile` 의 upsert 가 실패하고, 그 오류 문구에 `saved_avatars` 가 들어 있어 그 칸을 빼고 다시 저장한다(index.html 5214~5218). 보관함은 기기(`ourgoal_settings_<uid>`·`ourgoal_saved_avatars_backup_<uid>`)에만 있고 다른 기기·재설치에서 사라진다. 원장 설계 M23(`users.saved_avatars`) 이 전제한 칸이 운영에 없다 — 칸 추가는 운영 DB 스키마 변경(SQL Editor, [손 필요]). 기준 사본에서도 같다(이 PR 과 무관).
  2. 기준 시험지 `[#TASK-ES-155]` 의 부정 단언이 아바타 세포 폴더 전체를 앱 합본으로 보는 탓에, `showToast(` 를 쓰는 아바타 코드는 `js/avatar/` 로 옮길 수 없다(7절) — 시험지 선행 PR 필요.
- 확인 못 함: 사진 업로드·제작 실행(`/api/avatar-face` — 외부 AI 호출·돈, 모달 섹션 PR-4 몫), 실계정 보관함 왕복(칸 없음), 진짜 폰.

## 9. 탭 실측 결과
- 기준 사본(`git archive d9bd7f0`) 2회 · 작업 트리 1회, `tab-check.js <앱> <out> home,settings --summary`. 홈 24장·설정 16장(테마 4 × 화면 2 × 상태) + Dead-Click 대표 장.
- `tab-compare.js` 기준1 대 기준2: 비교 732값, 다른 값 0(본질적 변동 없음) — `reports/TASK-ES-389/tab-compare-base-run1-vs-run2.json`.
- `tab-compare.js` 기준1 대 작업: 비교 732값, 다른 값 0 — `reports/TASK-ES-389/tab-compare-base-vs-after.json`.
- npm test: 작업 트리를 `git write-tree` → `git archive` 사본으로 풀어 돌린 결과 줄 604줄이 기준 사본 604줄과 같음(정렬 비교 차이 0).

* **체크리스트 마감 규칙**: 본 작업계획서는 [4단계: 심사 청구]까지만 등록함.

- [x] 1. 목표 정의 · [x] 2. 현상 분석 · [x] 3. 원인 추정 · [x] 4. 대안 탐색 · [x] 5. 실행 계획 · [x] 6. 절차 재검증·반론 격파 · [x] 7. 즉시 실행 · [x] 8. 성과 측정
- [x] [4단계: 심사 청구]
