# REQ/PLAN — #TASK-ES-384 아바타·EXP 세포 쪼개기 설계 (쪼개는 순서 5, 설계만 · 코드 변경 0)

- 근거: `docs/architecture/MODULE-BLUEPRINT.md` 8절 순서 5(「아바타·EXP (7,351줄) — 책임 단위 분열, `xp.award` 능력·`home.card`·`settings.section`·`profile.badge` 기여 / ④ 감소 · EXP 원장 하나(CORE-03 M01)」), 틀 `docs/specs/MODULE-SPLIT-PROTOCOL.md`, 원장 설계 `docs/specs/LEDGER-DESIGN-2026-10-04.md`(#TASK-ES-350), 데이터 분리 선례 `docs/specs/REQ-TASK-ES-364-TEMPLATE-DATA-SPLIT.md`.
- 기준 커밋: origin/main `f3b1c50`(#698 병합 직후). 줄 번호는 모두 이 커밋 기준.
- 성격: **설계·측정·문서만.** 제품 코드·동결 파일 수정 0, 운영 DB 조회·쓰기 0(코드·SQL 파일 읽기로만). 측정 스크립트 `reports/TASK-ES-384/avatar-map.js`(읽기 전용) 하나를 함께 둔다 — 아래 표의 줄 범위·호출 관계·외부 참조·시험 글자 수는 모두 이 스크립트 산출이다(손으로 옮긴 수치 없음).

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지

1. `js/avatar-system.js`(7,351줄, 800줄 넘는 세포 12개 중 가장 큼)를 **책임 단위**로 나누는 계획을 세운다. 각 새 파일 800줄 이하, 꽂는 자리는 정식 15곳 중에서만, PR 3~5개의 순서와 PR 마다의 증명 방법.
2. EXP(경험치) 저장 위치를 원장 하나로 통일하는 설계를 함께 세운다 — 지금 몇 벌로 어디에 저장되는지, 원장 하나와 파생 규칙, 데이터 이관 필요 여부(필요하면 [결심 필요]).
3. 두 작업이 같은 코드를 두 번 만지지 않도록 순서를 정한다.
4. 산출물은 문서만: 이 REQ, dev_log·TICKETS 각 1줄, `reports/TASK-ES-384/claims.json`.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 아바타를 만지는 모든 작업(랭크 배경, 사진 제작, 보관함, 다이나믹 앨범, 기능 카드)이 7,351줄짜리 파일 하나를 통째로 고친다. 그리고 「경험치」는 아바타의 성장 근거인데, 그 저장·계산 코드는 이 파일이 아니라 `index.html` 인라인 스크립트에 따로 있다. 두 덩어리가 하나의 기능(성장하는 나)을 반씩 쥐고 있다.
- **원인**: (1) 320종 페르소나 데이터 4,161줄이 로직과 한 팩토리 함수 안에 있다. (2) 모달 하나(`openAvatarModal`, 879줄)가 화면 마크업·기간 설정·보관함·사진 제작·도감·저장을 한 클로저 안에서 공유 변수로 처리한다. (3) EXP 는 `settings.xp` 한 칸에 쓰지만 서버 정본이 없고, 레벨은 파생인데 남의 레벨은 존재하지 않는 칸(`user.level`)을 읽는다.
- **중심**: 데이터 `BODY_THEMES_320`(122~4282줄) · 모달 `openAvatarModal`(5599~6477줄) · EXP 쓰기 `awardXP`(index.html:3142).
- **핵심**: ① 데이터부터 떼어 내면 파일이 3,190줄로 줄고 로직만 남는다 ② 로직은 서로 부르는 관계(아래 3-2)를 따라 6개 세포로, 모달은 섹션 세포로 나눈다 ③ EXP 는 **저장 어댑터를 가진 세포 하나**로 먼저 옮기고(저장 위치는 그대로), 서버 원장으로 바꿀 때는 어댑터만 바꾼다 — 그래야 호출처 21곳을 한 번만 만진다.

### 2-1. 측정 결과 — `js/avatar-system.js` 책임 지도

`node reports/TASK-ES-384/avatar-map.js` 산출. 팩토리 함수(UMD, 12~7351줄) 최상위 선언 46개. 「호출」은 같은 파일 안 다른 최상위 함수 호출만.

| 줄 범위 | 줄 수 | 이름 | 종류 | 같은 파일 안 호출 | 저장 |
| :-- | --: | :-- | :-- | :-- | :-- |
| 22~25 | 4 | `askConfirm`·`DEFAULT_BASE_CRAFTS`·`LEGACY_MAX_CRAFTS`·`MAX_AVATAR_CHANGES` | 상수 | — | — |
| 28~119 | 92 | `BODY_THEMES_77` | 데이터 | — | — |
| 122~4282 | 4,161 | `BODY_THEMES_320` (16 MBTI × 20종, MBTI 순으로 끊김 없이 20개씩) | 데이터 | — | — |
| 4286~4312 | 24 | `getAllThemes`·`getThemesByMbti`·`getThemesByGroup`·`searchThemes` | 도감 조회 | — | — |
| 4316~4347 | 32 | `getRobotAvatarSvg` | 그리기 | — | — |
| 4350~4415 | 66 | `getWoodHammerMakerAnimationHtml` | 그리기 | — | — |
| 4418~4739 | 322 | `composite3DeformedAvatar` | 사진 합성 | `getSmartFallbackFeatures` | — |
| 4741~4769 | 29 | `getSmartFallbackFeatures` | 사진 합성 | — | — |
| 4772~4843 | 66 | `isLegacyAccount`·`getMaxCrafts`·`getRemainingCrafts`·`maybeGrantStreakBonus` | 제작권 | 서로 | `settings.maxBaseCrafts`·`bonusCraftCredits`·`avatarCraftCount`·`lastStreakAwarded` |
| 4846~4859 | 14 | `getThemeById` | 도감 조회 | — | — |
| 4862~4936 | 71 | `getSavedAvatars`·`addSavedAvatar`·`removeSavedAvatar` | 보관함 | `getThemeById` | `settings.savedAvatars`(→ `users.saved_avatars`, M23) |
| 4939~5006 | 66 | `collectPeriodPersonaSummary`·`fetchAvatarPersona` | 기간 페르소나 | — | — (`/api` 호출) |
| 5011~5029 | 19 | `renderPersona320ListHtml` | 도감 화면 | — | — |
| 5031~5072 | 42 | `renderSavedAvatarsDeckHtml` | 보관함 화면 | — | — |
| 5076~5187 | 112 | `RANK_THEMES_5` | 데이터 | — | — |
| 5189~5507 | 318 | `getRankThemeInfo`·`getRankWingsSvg` | 랭크 그리기 | `getRankThemeInfo` | — |
| 5510~5560 | 51 | `renderAvatarHtml` | 그리기(입구) | `getRobotAvatarSvg`·`getRankThemeInfo`·`getRankWingsSvg` | — |
| 5563~5596 | 34 | `showAvatarLegalNotice` | 모달 | — | — |
| 5599~6477 | **879** | `openAvatarModal` | 모달 | 19개(도감·그리기·합성·제작권·보관함·페르소나·`renderAvatarHtml`·`extractPersonalFeatures`) | `settings.avatarType`·`customAvatarUrl`·`avatarThemeId`·`profile.avatarUrl` |
| 6481~6649 | 169 | `extractPersonalFeatures` | 사진 합성 | `getSmartFallbackFeatures` | — |
| 6652~6655 | 4 | `drawCartoonHead` | 사진 합성 | — | — |
| 6658~6714 | 57 | `DYNAMIC_SITUATIONS` | 데이터 | — | — |
| 6717~6958 | 236 | `getDynamicAvatarSvg`·`getDynamicAlbum`·`saveDynamicAlbum`·`openDynamicAlbumModal` | 다이나믹 앨범 | `getRobotAvatarSvg` | localStorage `ourgoal_dynamic_album` |
| 6960~6999 | 40 | `api` | 공개 객체 | — | — |
| 7004~7345 | 323 | `handle아바타_Item26Action`·`Item32Action`·`triggerAvatarLevelUpDialogue`·`Item41Action`·`triggerExpCelebrationPopup`·`Item42Action` | 기능 카드 | — | Supabase `user_interactions` upsert, 실패 시 localStorage `og_task-<n>_cache` |

**공개 이름(`window.OurgoalAvatar` = `api`)** 42개: 상수 3·데이터 6(`BODY_THEMES_77`·`BODY_THEMES_320`·`RANK_THEMES_5`·`DYNAMIC_SITUATIONS`·`CARTOON_HAIRSTYLES`·`CARTOON_EXPRESSIONS`)·함수 33(`getTheme` 은 `getThemeById` 의 별칭).
**`window.` 직접 대입** 4개: `handle아바타_Item26Action`·`Item32Action`·`Item41Action`·`Item42Action`. 이 중 **41·42 는 `js/components.js:3748~3749` 가 같은 이름을 나중에 덮어쓴다**(스크립트 순서 index.html:2291 → 2299). 브라우저에서 실제로 도는 것은 components.js 판이고, avatar-system.js 판은 Node 시험(`tests/avatar-levelup-dialogue.test.js`·`avatar-exp-celebration.test.js`)과 `api` 로만 쓰인다.

### 2-2. 다른 파일·index.html 이 부르는 이름 (스크립트 산출)

| 이름 | 부르는 곳(파일:횟수) |
| :-- | :-- |
| `openAvatarModal` | index.html:10(3232·8856·8980 등 3경로) · js/tabs/home/sub-onescreen.js:2 · js/tabs/settings/render.js:2 · index.html:1378 `#btnSettingsQuickAvatar` onclick |
| `renderAvatarHtml` | index.html:13(3196·3294·3471·8938·8955·17271) · scripts/smoke-test.js · tests/enlarge-avatar-icons.test.js |
| `getRankThemeInfo` | index.html:4(3192·3282) |
| `DYNAMIC_SITUATIONS` | index.html:4(3189·21018) |
| `getDynamicAvatarSvg` | index.html:2(21016) |
| `openDynamicAlbumModal` | index.html:2(1379 `#btnOpenDynamicAlbum`) · js/tabs/settings/render.js:2 |
| `maybeGrantStreakBonus` | index.html:2(12969) |
| `addSavedAvatar`·`removeSavedAvatar`·`getSavedAvatars` | tests/avatar-10slots-growth.test.js · scratch/ 2개(제품 밖) |
| `window.handle아바타_Item26/32Action` | index.html:187·213 onclick(`#og-task-26-action-btn`·`#og-task-32-action-btn`) · smoke · tests |
| `window.handle아바타_Item41/42Action` | index.html:364·384 onclick · js/components.js(같은 이름 재정의) · smoke · tests |

### 2-3. 시험이 이 파일의 **글자**를 찾는 곳 (스크립트 산출)

- `scripts/smoke-test.js` 는 `js/avatar-system.js` 를 **단일 파일로** `readFileSync` 해 `avatarSrc`·`avatarJsSrc`·`avatarSystemSrc` 로 글자를 찾는다(합본 `html` 이 아님). `tests/avatar-exp-celebration.test.js`·`avatar-levelup-dialogue.test.js`·`enlarge-avatar-icons.test.js` 도 같은 방식.
- 글자 단언 126개 중 **이 파일 안에 있는 글자를 찾는 긍정 단언 113개**, 없어야 통과하는 부정 단언 13개(옮겨도 깨지지 않음).
- 긍정 113개가 사는 곳: `openAvatarModal` 52 · `RANK_THEMES_5` 15 · `renderSavedAvatarsDeckHtml` 6 · `handle아바타_Item32Action` 6 · `triggerAvatarLevelUpDialogue` 4 · 그 밖 30(17개 선언에 흩어짐).
- 순서 단언 1개: smoke 8664~8667 `indexOf('id="btnUploadAvatarPhoto"')` < `indexOf('id="avatarPeriodSection"')` — 모달 마크업이 한 파일에 같은 순서로 있어야 한다.
- 모달 공유 변수 이름이 든 글자 단언 6개: `theme: chosenTheme` · `'<span>' + chosenTheme.name + '</span>'` · `profile.avatarUrl = newCustomUrl;` · `deps.state.profile.avatarUrl = newCustomUrl;` · `extractPersonalFeatures(lastUploadedImg)` · `Math.max(0, (settings.avatarCraftCount || 1) - 1)`.
- `scripts/smoke-test.js` `FN_NAMES`(95~121줄)는 인라인 스크립트에서 함수를 뽑아 단위 시험한다 — 그 안에 **`xpForLevel`·`levelForXP`·`levelProgress`** 가 있다(EXP 세포 이전의 걸림돌, 5절 PR-1).
- index.html 글자 단언 중 `awardXP(...)` **호출 글자** 9개(smoke 5482~5484·7681·8301·8711·9093, tests 4개) — 호출처를 그대로 두면 깨지지 않는다.
- `smoke-test.js:2496` 은 특정 화면 소스에 `awardXP|XP_RULES` 가 **없어야** 한다(출석·기록에 화폐·XP 보상 없음 규정, TASK-ES-019) — EXP 세포 이름을 바꾸지 않는 한 영향 없음.

### 2-4. 측정 결과 — EXP 저장 위치 현황 (코드 읽기, 운영 조회 0)

| # | 어디에 | 무엇 | 쓰는 곳 | 읽는 곳 | 성격 |
| :-- | :-- | :-- | :-- | :-- | :-- |
| X1 | `state.profile.settings.xp = {total, log[≤200]}` → localStorage `ourgoal_settings_<uid>` | 합계·이력 | `awardXP`(index.html:3142, 호출 21곳: index.html 17 + js/tabs/goals 4) · 첫 체크인 응원 보내기 +5(index.html:7576~7578, **`awardXP` 를 거치지 않아 log 없음**) · `saveLocalSettings`(3085, `saveProfile` 끝 5258 등) | 레벨 배지(3228)·상단바(3276·3364·3381)·아바타 화면(3467·8857·8936·8953·8981·17269)·`badgeContext`(3553)·홈 링(js/tabs/home/sub-onescreen.js:293)·설정(js/tabs/settings/render.js:38) | **사실상 정본(기기 전용)** |
| X2 | localStorage `ourgoal_guest_profile` | X1 을 포함한 profile 전체 사본 | `saveProfile`(5214)·5362·5528·5939 — 로그인 사용자도 씀 | `migrateGuestDataToUser`(5993) — 단 이 함수는 `settings.xp` 를 **옮기지 않는다**(gcal·일정·보관함만) | 사본 1벌 |
| X3 | 전체 백업 내보내기 JSON(사용자 파일) | profile 전체 | 설정 → 데이터 내보내기 | (가져오기 경로는 이번에 확인 못 함) | 앱 밖 사본 |
| X4 | 서버 | **없음** — `users` 표에 xp·level 칸 없음(docs/sql 전수 검색 0), `sync_records` 의 `settingsToSave` 는 구글 3값만(index.html:5289) | — | — | 서버 왕복 없음 |
| D1 | 레벨 | 저장 안 함 — `levelForXP(xp.total)` 파생(3104). 공식 `xpForLevel(L)=50·(L-1)·L` | — | 위 X1 읽는 곳 전부 | 파생(정상) |
| D2 | 남의 레벨 `user.level`·`person.level`·`target.level`·`u.level` | 서버에 없는 칸 → 늘 `\|\| 1` | — | js/team-invite-comm.js 1818·2290·2341·2502·2584·2731·3029·3173 (8곳) | **가짜 Lv.1**(원장 M02, 결심 K4) |
| D3 | `profile.level` | 쓰는 곳 0 | — | `openAvatarModal` 5610 `deps.currentLevel \|\| profile.level \|\| 1`(폴백) | 죽은 칸 |
| D4 | 고정 표시 `+10 EXP` | 저장 아님 | — | js/sanctuary-v3-engine.js 811·902(기록 카드마다 고정 문구), `triggerExpCelebrationPopup` 기본값 10(avatar-system.js 7262) | 원장과 무관한 표시 |

- **몇 벌인가**: 앱 안 저장 **2벌**(X1 정본 역할 + X2 전체 사본), 서버 0벌, 레벨 파생 1곳 + 존재하지 않는 칸을 읽는 곳 9곳(D2 8 + D3 1).
- **원장 설계서와의 관계(정직하게)**: 지시서의 「중복 저장 16항목 중 EXP 관련」에 대해 — 설계서 지도표의 M01(EXP)은 「중복 저장: 아니오」로 **16항목에 들어 있지 않다**(설계서가 `ourgoal_guest_profile` 전체 사본을 공통 사본으로 따로 뺐기 때문, 1-3절). 이번 조사로 EXP 도 X2 사본까지 치면 2벌임을 확인했다. 16항목 중 이 세포(아바타·EXP)의 데이터는 **M18(사진 `users.avatar_url` ↔ `settings.customAvatarUrl`)·M23(보관함 `users.saved_avatars` ↔ `settings.savedAvatars` ↔ `ourgoal_saved_avatars_backup_<uid>`)·M24(수호동물 `profile.guardianAnimal` ↔ `settings.guardianAnimal`)** 3개다. 이 3개는 아바타 세포가 주인(`owns`)이 되어야 할 데이터이므로 4-3절 통일안에 함께 넣는다.
- **새로 확인한 결함(코드 읽기, 실측 아님)**:
  1. 게스트로 쌓은 EXP 는 회원 전환 때 옮겨지지 않는다(`migrateGuestDataToUser` 가 `settings.xp` 를 복사하지 않음, 5993~). 추정 — 화면 미확인.
  2. log 가 200개에서 잘리고(`XP_LOG_MAX`), 첫 체크인 +5 는 log 없이 total 만 올린다 → **지금도 `total ≠ Σlog.amount`** 인 사용자가 있다. 원장 설계서 2-5절의 「total 은 로그 합으로 다시 계산」을 그대로 적용하면 EXP 가 **줄어든다**(4-4절에서 `baseTotal` 로 막음).
  3. 브라우저에서는 avatar-system.js 의 `handle아바타_Item41/42Action` 이 components.js 판에 가려져 돌지 않는다(같은 기능 2벌 — 융합 후보, 기능 삭제 아님).

## 3. [원칙 ③] 해결방식

### 3-1. 나눌 세포 목록 (각 800줄 이하 · 책임 단위 · 줄 수는 옮길 선언 합, 머리·꼬리 20~30줄 별도)

새 디렉터리 두 곳: 데이터 `js/data/avatar-personas/`(선례 `js/data/goal-templates/`), 로직 `js/avatar/`(하이브리드 세포 묶음 — 탭 전용이 아니라 홈·설정·소통·목표가 같이 씀).

| 세포(파일) | 담당 | 옮길 선언 | 줄(합) | 꽂는 자리(정식 15곳 중) | 능력(provides) |
| :-- | :-- | :-- | --: | :-- | :-- |
| `js/data/avatar-personas/<mbti>.js` ×16 | 320종 페르소나 데이터(MBTI 하나에 20종) | `BODY_THEMES_320` 원소 | 각 약 262 | — | — |
| `js/avatar/themes.js` | 77종 바디·도감 조회·도감 목록 화면 | `BODY_THEMES_77`·`getAllThemes`·`getThemesByMbti`·`getThemesByGroup`·`searchThemes`·`getThemeById`·`renderPersona320ListHtml` | 149 | — | `avatar.themes` |
| `js/avatar/render.js` | 아바타·랭크 그리기 입구 | `getRobotAvatarSvg`·`getWoodHammerMakerAnimationHtml`·`RANK_THEMES_5`·`getRankThemeInfo`·`getRankWingsSvg`·`renderAvatarHtml` | 579 | `home.card`(홈 아바타 카드) · `profile.badge`(레벨 배지) | `avatar.render` |
| `js/avatar/craft-engine.js` | 사진 → 3등신 합성 · 기간 페르소나 분석 | `composite3DeformedAvatar`·`getSmartFallbackFeatures`·`extractPersonalFeatures`·`drawCartoonHead`·`collectPeriodPersonaSummary`·`fetchAvatarPersona` | 590 | — | `avatar.craft` (sideEffect `external` — `/api/avatar-face`·페르소나 호출, `needsConfirm`) |
| `js/avatar/wallet.js` | 제작권(횟수·스트릭 보너스)·보관함 10칸 | `isLegacyAccount`·`getMaxCrafts`·`getRemainingCrafts`·`maybeGrantStreakBonus`·`getSavedAvatars`·`addSavedAvatar`·`removeSavedAvatar`·`renderSavedAvatarsDeckHtml` | 179 | — | `avatar.wallet` · `owns: savedAvatars, craftCredits` |
| `js/avatar/dynamic-album.js` | 상황별 다이나믹 아바타·앨범 | `DYNAMIC_SITUATIONS`·`getDynamicAvatarSvg`·`getDynamicAlbum`·`saveDynamicAlbum`·`openDynamicAlbumModal` | 293 | `settings.section`(`#btnOpenDynamicAlbum`) | `avatar.album` |
| `js/avatar/feature-cards.js` | 자동 생성 기능 카드 핸들러 4개 + 대사 2개 | `handle아바타_Item26/32/41/42Action`·`triggerAvatarLevelUpDialogue`·`triggerExpCelebrationPopup` | 323 | — | — (옮기기만, 융합은 별도) |
| `js/avatar/modal/index.js` | 아바타 설정 모달 조립자 + 법적 고지 | `showAvatarLegalNotice` + `openAvatarModal` 머리(5600~5623)·`openModal` 호출 뼈대 | 약 110 | `settings.section`(`#btnSettingsQuickAvatar`) | `avatar.open` |
| `js/avatar/modal/markup.js` | 모달 HTML 문자열(5624~5790) | 문자열 조립 | 약 170 | — | — |
| `js/avatar/modal/bind-period.js` | 생성 기준 기간·퀵 칩(5837~5901) | 섹션 | 약 70 | — | — |
| `js/avatar/modal/bind-deck.js` | 탭 토글·남은 횟수·보관함 슬롯·제작 완료 인입(5902~6125) | 섹션 | 약 225 | — | — |
| `js/avatar/modal/bind-craft.js` | 초기 페르소나 복원·사진 업로드·제작 실행(5792~5834, 6127~6324) | 섹션 | 약 245 | — | — |
| `js/avatar/modal/bind-persona.js` | 320종 도감 토글·검색·탭(6327~6411) | 섹션 | 약 85 | — | — |
| `js/avatar/modal/bind-save.js` | 최종 적용하기(6412~6476) | 섹션 | 약 65 | — | — |
| `js/avatar/xp.js` (EXP 세포, index.html 에서 옮김) | EXP 규칙·레벨 공식·지급·축하·알림 + **저장 어댑터** | `XP_RULES`·`XP_LOG_MAX`·`xpForLevel`·`levelForXP`·`levelProgress`·`triggerAvatarCelebrationPopup`·`awardXP`·`notifyXpGained`(index.html 3097~3165) + 새 `getXp`/`addXp` 얇은 입구 | 약 110 | `checkin.after`(+EXP 축하) · `home.card`(진행 링 값) | **`xp.award`**(청사진 계획 능력) · `xp.read` · `owns: xp` · 신호 `xp:gained`(청사진 4-1 「더할 것」) |
| `js/avatar-system.js` (남는 것) | UMD 머리 + 상수 4개 + 부품 읽기 + `api` 객체(공개 이름 42개 그대로) | 조립자 | 약 120 | — | — |

- 7,351 → 최대 파일 590줄(`craft-engine.js`). 모듈 가드 ④ 800줄 초과 파일 수 −1(12→11, EXP 이전은 ①·② 감소).
- 자리는 모두 정식 15곳 안이다. `checkin.after` 의 주인은 아직 index-html(체크인 저장 흐름) — 실제 `contribute` 는 옮기기 PR 다음 별도 PR(틀 5절 6).
- 부품 사이 연결: 브라우저는 부품 파일이 `OurgoalAvatarParts.<부품>` 에 넣고 조립자가 읽는다(선례 `OurgoalGoalTemplateParts`, `window.X =` 꼴이 아니라 지표 ③ 불변 — 새 전역 이름 1개는 정직하게 적는다). Node 는 조립자가 `require('./avatar/<부품>.js')`. 부품끼리 부르는 이름은 `AV.<이름>` 접두(틀의 `L.`·`K.` 와 같은 허용 차이), 모달 섹션끼리 공유하는 바뀌는 변수 9개(`selectedType`·`newCustomUrl`·`lastUploadedImg`·`lastUploadedDataUrl`·`currentFeatures`·`chosenTheme`·`periodStart`·`periodEnd`·`currentPersona`)는 `MS.<이름>`(모달 상태 객체) 접두로 바꾼다 — 틀 2절 섹션 경계 조건 ③(공유 변수 재대입 없음)을 이 변수들이 어기기 때문이다.

### 3-2. 옮기는 순서 — PR 5개

| PR | 무엇 | 제품 변화 | 증명 방법 |
| :-- | :-- | :-- | :-- |
| **PR-1 시험지 선행** | `scripts/smoke-test.js`·tests 3개가 `avatarSrc` 를 「아바타 합본」(= `js/avatar-system.js` + `js/avatar/**/*.js` + `js/data/avatar-personas/*.js`, 이름순, `AV.`·`MS.` 접두를 떼고 읽음)으로 읽게 바꾸고, `FN_NAMES` 추출 원본을 「인라인 스크립트 + `js/avatar/xp.js`(있으면)」로 넓힌다. 앱 합본(`APP_MODULE_FILES`)에 `js/avatar/**` 를 더한다. 기대값·단언 0 변경 | 0 | `npm test` 통과 수가 기준과 같음(443·38/38·버튼 수 동일), 합본이 지금은 avatar-system.js 한 파일과 글자가 같음을 시험이 단언. **법정은 기준 커밋 시험지로 채점하므로 이 PR 이 먼저 병합돼야 PR-2~5 가 판정 가능**(틀 1절 (라)) |
| **PR-2 데이터** | `BODY_THEMES_320` → `js/data/avatar-personas/<mbti>.js` 16개(MBTI 경계로 글자 그대로), avatar-system.js 는 같은 배열을 이어 붙임. index.html `<script>` 16개(avatar-system.js 태그 앞) | 0 | 생성기 `gen-avatar-data.js` + 부품 시험 `tests/avatar-personas-split.test.js`: Node·브라우저(vm, index.html 순서) 두 경로 모두 `BODY_THEMES_320` deepStrictEqual 원본(원본 = `git show <기준>:js/avatar-system.js` 를 실행한 값, 없으면 sha256 지문) · 변이 시험 2종(값 1개·순서) 실패 확인 |
| **PR-3 로직 세포 6개** | `themes`·`render`·`craft-engine`·`wallet`·`dynamic-album`·`feature-cards` 로 글자 그대로 이전, avatar-system.js 는 조립자(공개 이름 42개 그대로, `window.handle아바타_*` 4줄은 **원래 순서 그대로** — components.js 덮어쓰기 순서 보존) | 0 | ① 토큰 동일: `verify-equiv` 확장판으로 `git archive <기준>` 사본의 avatar-system.js 와 옮긴 구간 토큰열 동일(허용 차이 `AV.` 접두뿐) ② `Object.keys(OurgoalAvatar)` 와 각 함수 `toString()` 토큰 동일 ③ 화면: `tab-check.js` 홈·설정 기준 2회·후 1회 차이 0, 새 `dom-compare-avatar.js` 로 아바타 모달·다이나믹 앨범·보관함 조작 단계별 DOM·localStorage·토스트 비교 ④ 실계정 하네스(`real-account-check.js`, [손 필요] 계정): 보관함 저장 → `users.saved_avatars` 왕복(M23)·`avatar_url` 저장 전후 동일 |
| **PR-4 모달 섹션** | `openAvatarModal` 879줄 → `modal/index.js` 조립자 + 섹션 6개(위 표). 공유 바뀌는 변수 9개는 `MS.` 접두 | 0 | PR-3 의 ①~④ 동일 + 섹션 경계 검사(문 하나를 가르지 않음, 공유 변수 외 지역 변수 섹션 간 0) + smoke 순서 단언(업로드 < 기간 섹션) 통과 + 사진 업로드·제작 실행은 `/api/avatar-face` 를 목으로 바꾼 로컬 실측(실제 Gemini 호출은 돈·외부 전송 — 하지 않음) |
| **PR-5 EXP 세포** | index.html 3097~3165 의 EXP 코드 → `js/avatar/xp.js`. index.html IIFE 머리에서 같은 이름으로 가져옴(`var awardXP = _xp.awardXP;` …) → **호출처 21곳·app-scope getter(2452·2454) 글자 그대로**. `window.xpForLevel`·`levelForXP`·`levelProgress`·`triggerAvatarCelebrationPopup`·`notifyXpGained` 대입 줄은 원래 자리에 둠. 저장 어댑터 1단계 = `settings.xp`(지금과 같은 곳). `xp.award`·`xp.read` 능력 `provide` | 0 | `FN_NAMES` 3개가 PR-1 덕에 xp.js 에서 뽑혀 같은 단언 통과 · 토큰 동일(허용 차이 가져오기 줄) · 체크인·마일스톤·퀘스트 지급 후 `settings.xp` deepStrictEqual 전후 · 홈 링·레벨 배지 DOM 동일 |

그 뒤(이 계획의 PR 밖, 원장 공통 PR 과 결심 뒤): **EXP 2단계** — `xp.js` 저장 어댑터만 `settings.xp` → `user_ledger_docs['xp']`(원장 설계서 2-3절 `getXp`/`addXp`)로 바꾸고 1회 이관(4-4절). 호출처는 다시 만지지 않는다. 자리 실제 연결(`slots.contribute`)도 별도 PR.

## 4. [원칙 ④] 재검토 — 대안과 한계

### 4-1. 대안 비교

| 안 | 내용 | 장점 | 단점 | 판단 |
| :-- | :-- | :-- | :-- | :-- |
| A(권장) | 시험지 → 데이터 → 로직 → 모달 → EXP(어댑터) → (결심 뒤) 원장 | 한 PR 한 책임, 각 PR 이 「옮기기만」이라 전후 0 증명 가능. EXP 호출처를 한 번만 만짐 | PR 5개 + 후속 | **[기본값] 채택** |
| B | EXP 원장(서버)부터 하고 아바타를 나눔 | 데이터 통일이 빨리 끝남 | 원장 공통 PR(`js/user-ledger.js`·`sync_ledger`·표 생성 SQL — 아직 main 에 없음)과 결심 K-XP1 을 기다려야 해서 분할 전체가 멈춤. 옮기기와 동작 변경이 한 PR 에 섞여 전후 0 증명 불가 | 기각 |
| C | 줄 수로 avatar-system.js 를 part1~part9 로 자름 | 빠름 | 틀 0절 2 금지(줄 수 분할), 책임이 섞인 채 남음 | 기각 |
| D | 페르소나 데이터를 JSON 으로 | 파일 1개 | 읽는 쪽이 동기 호출(`getAllThemes` 등) — fetch 비동기면 첫 렌더 순서가 바뀜(선례 ES-364 같은 판단) | 기각 |

### 4-2. 데이터 파일 단위 — [기본값] MBTI 16개

320종은 MBTI 순으로 20개씩 끊김 없다(스크립트 확인). 기질 4묶음(NT·NF·SJ·SP 각 80종)은 80×13줄 ≈ 1,040줄로 800줄을 넘는다. MBTI 하나 = 책임 하나(도감 탭의 MBTI 필터와 같은 단위)라 16개로 한다. `<script>` 16개가 늘어나는 비용은 선례(템플릿 6개)와 같은 방식이며, 서비스워커(sw.js)는 파일 목록을 따로 두지 않아 손볼 곳이 없다.

### 4-3. EXP 통일 목표 설계 — 원장 하나, 나머지는 파생

| 값 | 정본(목표) | 파생·캐시 | 없애는 것 |
| :-- | :-- | :-- | :-- |
| EXP 합계·이력 | `user_ledger_docs['xp'] = {total, baseTotal, log[≤200]}` (원장 설계서 2-2 M01, `baseTotal` 은 이 계획이 더함) | 캐시 `ourgoal_ledger_cache_<uid>`(설계서 2-3) | `settings.xp`(이관 확인 뒤 쓰기 중단, 읽기 폴백 한 판 유지) · `ourgoal_guest_profile` 의 xp(게스트일 때만 쓰기 — 설계서 공통 PR) |
| 레벨 | 저장 안 함 — `xp.js` 의 `levelForXP(getXp().total)` 하나 | — | `profile.level` 폴백(D3) |
| 남의 레벨 | 결심 K4(원장 설계서) — 권장: 표시 안 함 | — | `user.level \|\| 1` 가짜 표시 8곳(D2) |
| 고정 「+10 EXP」 표시 | 실제 지급 기록(log)의 amount 로 표시하거나 문구 제거 — 화면 문구 변경이라 별도 티켓 | — | (D4 — 이번 범위 밖, 위험 목록에 둠) |
| 사진·보관함·수호동물(M18·M23·M24) | 원장 설계서 2-2 그대로(`users.avatar_url`·`users.saved_avatars`·`prefs.guardianAnimal`) — 주인 세포 `avatar/wallet`·`avatar/render` | 로컬 백업 | `settings.customAvatarUrl`·`settings.savedAvatars`·`profile.guardianAnimal` 사본 |

- 모든 가감은 `addXp(n, reason)` 하나로 — `awardXP` 는 `addXp` 를 부르는 이름으로 남고(호출처 21곳 글자 그대로), 첫 체크인 +5(7576~7578)도 `addXp(5, '첫 체크인 응원 보내기')` 로 바뀐다(이건 동작 변경 — 로그가 생김 — 이라 PR-5 가 아니라 2단계에서).
- 충돌 규칙: 원장 설계서 2-5절의 로그 합집합 + **`total = baseTotal + Σlog.amount`**. `baseTotal` 은 log 가 200개에서 잘린 앞부분과 기록 없이 오른 값의 합이다.

### 4-4. 데이터 이관이 필요한가 — **필요하다 → [결심 필요] K-XP1**

- 이유: EXP 는 지금 기기에만 있다(X1). 서버 원장으로 옮기려면 기존 값을 한 번 올려야 하고, 그러지 않으면 다른 기기·재설치에서 EXP 가 0 으로 보인다.
- 이관 절차(비파괴, GUARD_03 백업 먼저):
  1. **서버 백업**: 원장 설계서 부록 A-0(`users_backup_20261004` 등 `create table if not exists … as table`) + 새 표 `user_ledger_docs`·`user_ledger_docs_history`(A-2) 생성 — 운영 SQL 실행은 [손 필요](SQL Editor).
  2. **기기 백업**: 이관 직전 `ourgoal_ledger_premigration_<uid>` 에 `ourgoal_settings_<uid>` 원문 복사(30일 보관).
  3. **1회 이관**: 서버에 `xp` 문서가 없고 로컬에 있으면 `{ total: X1.total, baseTotal: X1.total − Σ(X1.log.amount), log: X1.log }` 로 올린다. 서버에 이미 있으면 로그 합집합 + `baseTotal` 큰 값(덮어쓰기 금지).
  4. **확인**: 이관 전후 `total` 이 같아야 한다(`track('ledger_migrated', {counts})` 에 수만). 다르면 되돌리고 대기열 유지.
  5. **사본 정리**: 확인된 뒤에만 `settings.xp` 쓰기 중단. 읽기 폴백은 한 판 유지(step 0 방어 코드 보존).
- 왜 결심인가: ② 서버 보관 범위 확대 — 지금까지 기기에만 있던 **활동 이력(무엇을·언제 했는지 `reason`·`at` 200건)** 을 서버에 새로 둔다. ③·GUARD_03 — 사본 정리 단계는 기존 저장 칸 쓰기를 멈추는 변경이다. 표 생성은 운영 DB 쓰기다.
- 권장: **승인**(이력은 본인만 읽는 표·`/api/track` 본인 토큰 검사, 내용은 지급 사유 문구와 시각뿐). 대안: 합계만 올리고 이력은 기기에 둠(서버 보관 최소화, 대신 두 기기 동시 지급 합치기가 「최신 우선」이 되어 EXP 가 사라질 수 있음).

### 4-5. 한계(정직하게)

- 이 문서의 줄 수·호출 관계는 정적 측정이다. 동적 호출(`window[...]`·문자열 eval)은 잡지 못한다 — 검색 결과 avatar-system.js 안에 그런 호출은 없었지만 다른 파일이 `OurgoalAvatar` 를 변수에 담아 부르는 경우는 시험 3곳뿐이었다(`const OurgoalAvatar = require(...)`, `api`).
- 모달 섹션 줄 수(약 70~245)는 주석 경계로 잰 추정이다. 생성기가 경계를 확정한다.
- `MS.`·`AV.` 접두는 글자를 바꾸는 일이다. 시험지가 접두를 떼고 읽게 하는 것(PR-1)이 전제다.

## 5. [원칙 ⑤] 절차

1. PR-1 병합(시험지) → 2. PR-2(데이터) → 3. PR-3(로직 6세포) → 4. PR-4(모달 섹션) → 5. PR-5(EXP 세포, 저장 위치 그대로) → (원장 공통 PR 병합 + K-XP1·K4 결심) → 6. EXP 2단계(어댑터 교체·이관) → 7. 자리 연결(`home.card`·`settings.section`·`profile.badge`·`checkin.after` contribute) 별도 PR.
- PR-2~4 는 서로 다른 글자를 옮기지만 모두 `js/avatar-system.js` 를 고치므로 **순서대로**(병렬 금지 — 같은 파일 동시 수정 금지 규칙).
- PR-5 는 `index.html` 을 고친다 — 같은 시기 다른 탭 이전 세션(목표·소통 등)과 index.html 동시 수정이 겹치지 않게 착수 전 열린 PR 을 확인한다.
- 각 PR: `git -C C:/dev/ourgoal-app worktree add C:/dev/wt/avatar-<n> -b feat/<날짜>-task-es-<번호>-avatar-<n> origin/main` → 생성기 → 글자 검사 → 화면 비교 → `node scripts/module-specs.js --write` → `node scripts/module-guard.js --update`(줄어든 부채) → `npm test` → PR → 법정.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- **반론 1**: 「EXP 를 먼저 서버로 통일해야 두 번 손대지 않는다. 세포로 옮긴 뒤 다시 원장으로 바꾸면 두 번 만지는 것 아닌가?」 → 두 번 만지는 것은 **호출처**다(지급 21곳 — index.html 17·js/tabs/goals 4 — 와 읽는 곳 13곳 — index.html 11·홈 링 1·설정 1). PR-5 는 호출처를 글자 그대로 두고 정의만 옮기며, 저장 위치를 `xp.js` 안 어댑터 함수 하나로 모은다. 2단계는 그 어댑터 한 곳만 바꾼다. 반대로 원장을 먼저 하면 index.html 안에 있는 `awardXP` 를 고친 뒤, PR-5 에서 그 고친 코드를 다시 옮겨야 한다 — 그쪽이 두 번 만지는 길이다. 게다가 원장 공통 PR·결심 K-XP1 을 기다리는 동안 분할 전체가 멈춘다.
- **반론 2**: 「시험지를 고치는 PR-1 은 판정을 흐리는 것 아닌가(동결 대상 `package.json` scripts·court 는 아니지만 시험 기대값을 만지는 것 아닌가)?」 → PR-1 은 읽는 **범위**만 넓힌다(파일 하나 → 합본). 단언 문장·기대값은 한 글자도 바꾸지 않고, 지금 시점의 합본이 avatar-system.js 단일 파일과 글자가 같음을 시험 안에서 단언한다. 선례 #669(TASK-ES-357)가 index.html → 합본으로 같은 일을 했고 법정이 받았다. 검사 폐기(retire)는 쓰지 않는다.
- **반론 3**: 「320종 데이터를 16개 파일로 나누면 `<script>` 가 너무 많다.」 → 대안(JSON·묶음 파일)은 동기 호출 순서를 바꾼다. 16개는 책임(MBTI) 단위이고 800줄 상한을 지키는 가장 작은 책임 단위다. 빌드 단계가 생기면 그때 묶는 것은 별도 결정.

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- **파일**: `js/avatar-system.js`, (새) `js/avatar/{themes,render,craft-engine,wallet,dynamic-album,feature-cards,xp}.js`, `js/avatar/modal/{index,markup,bind-period,bind-deck,bind-craft,bind-persona,bind-save}.js`, `js/data/avatar-personas/{intj,intp,entj,entp,infj,infp,enfj,enfp,istj,isfj,estj,esfj,istp,isfp,estp,esfp}.js`, `index.html`(`<script>`·IIFE 머리 가져오기), `scripts/smoke-test.js`·`tests/avatar-exp-celebration.test.js`·`tests/avatar-levelup-dialogue.test.js`·`tests/enlarge-avatar-icons.test.js`(PR-1), `docs/design/harness/module-split/gen-avatar-*.js`·`verify-avatar.js`·`dom-compare-avatar.js`(새 도구), `docs/architecture/modules.json`·`module-baseline.json`.
- **함수·전역**: `window.OurgoalAvatar`(공개 42개 그대로), (새) `OurgoalAvatarParts`, `openAvatarModal`·`renderAvatarHtml`·`getRankThemeInfo`·`getDynamicAvatarSvg`·`openDynamicAlbumModal`·`maybeGrantStreakBonus`·`DYNAMIC_SITUATIONS`, `handle아바타_Item26/32/41/42Action`, EXP `XP_RULES`·`XP_LOG_MAX`·`xpForLevel`·`levelForXP`·`levelProgress`·`awardXP`·`notifyXpGained`·`triggerAvatarCelebrationPopup`, (2단계) `getXp`·`addXp`, 능력 `xp.award`·`xp.read`·`avatar.render`·`avatar.open`, 신호 `xp:gained`.
- **DOM**: `#btnSettingsQuickAvatar`·`#btnOpenDynamicAlbum`(index.html:1378·1379), `#levelBadgeRow`, `#sanctuaryAvatarBadge`, `#homeHeroExpBar`·`#homeHeroExpFill`·`#homeHeroExpGain`(홈 링), 모달 `#avatarTypeToggle`·`#btnUploadAvatarPhoto`·`#btnRunCraftAvatar`·`#customAvatarFileInput`·`#avatarPeriodSection`·`#btnSetAvatarPeriod`·`#avatarPeriodStartInput`·`#avatarPeriodEndInput`·`#savedAvatarsDeckSlot`·`#btnToggle320PersonaCatalog`·`#inputSearchPersona320`·`#btnSaveAvatarModal`·`#btnCancelAvatarModal`, 기능 카드 `#og-task-26/32/41/42-action-btn`, 축하 `#avatarCelebrationToast`.
- **저장**: localStorage `ourgoal_settings_<uid>`(.xp·.savedAvatars·.avatarType·.customAvatarUrl·.avatarThemeId·.avatarCraftCount·.bonusCraftCredits·.maxBaseCrafts·.lastStreakAwarded), `ourgoal_guest_profile`, `ourgoal_dynamic_album`, `og_task-<n>_cache`, `ourgoal_saved_avatars_backup_<uid>`; Supabase `users.avatar_url`·`users.saved_avatars`, `user_interactions`; (결심 뒤) `user_ledger_docs`.
- **측정 도구**: `node reports/TASK-ES-384/avatar-map.js [--json]`.

### 7-1. 계획 체크리스트 (이 작업 — 설계)

- [x] 1. 목표 정의: 아바타 분할 + EXP 통일을 한 순서로 (1절)
- [x] 2. 현상 분석: 책임 지도·외부 참조·시험 글자·EXP 저장 위치 측정 (2-1~2-4)
- [x] 3. 원인 추정: 데이터·모달 클로저·서버 정본 부재 (2절)
- [x] 4. 대안 탐색: A~D 비교 (4-1)
- [x] 5. 실행 계획: 세포 목록·PR 5개·증명 방법 (3절)
- [x] 6. 절차 재검증 및 반론 격파: 반론 3개 (6절)
- [x] 7. 즉시 실행: 이 문서·측정 스크립트·claims·dev_log·TICKETS
- [x] 8. 성과 측정: 8절
- [x] [4단계: 심사 청구]
* **체크리스트 마감 규칙**: 본 작업계획서는 [4단계: 심사 청구]까지만 등록함.

## 8. [원칙 ⑧] 성과 측정 · 위험 · 막힐 지점

### 8-1. 측정 (작업자 측정, 판정 아님)

| 항목 | 값 | 출처 |
| :-- | :-- | :-- |
| avatar-system.js 줄 수 | 7,351 | `wc -l`, module-baseline.json 과 같음 |
| 최상위 선언 | 46 (함수 37 · var 9 = 상수 4·데이터 4·`api` 1) | avatar-map.js |
| 공개 이름 / `window.` 대입 | 42 / 4 | avatar-map.js |
| 글자 단언(긍정·이 파일 안) / 부정 | 113 / 13 | avatar-map.js |
| 분할 뒤 최대 파일 | 약 590줄(craft-engine) | 선언 줄 합 |
| EXP 저장 벌 수 | 앱 안 2(settings.xp·guest_profile 사본) · 서버 0 | 코드 읽기 |
| EXP 지급 호출처 | 21(index.html 17·js/tabs/goals 4) + 우회 1(+5) | grep |
| 가짜 레벨 읽기 | 9(team-invite-comm 8 · profile.level 1) | grep |

### 8-2. 위험 · 막힐 지점(예상)

1. **법정은 기준 시험지로 채점** — PR-1 이 병합되기 전에 PR-2~5 를 올리면 smoke 의 `avatarSrc` 단언 113개 중 옮긴 글자만큼 실패한다. PR-1 을 반드시 먼저.
2. **`window.handle아바타_Item41/42Action` 덮어쓰기 순서** — 조립자가 대입 순서를 바꾸거나 components.js 보다 늦게 실행되면 브라우저에서 다른 판이 돈다. 대입 4줄은 avatar-system.js 원래 자리에서, 같은 실행 시점에.
3. **모달 공유 변수 9개** — `MS.` 접두 변환을 손으로 하면 틀린다. 생성기 + 스코프 분석(@babel/traverse, `NODE_PATH`)으로만.
4. **사진 제작은 외부 호출** — `/api/avatar-face`·페르소나 분석은 Gemini 호출(돈·외부 전송). 화면 비교는 목 응답으로만, 실제 호출 실측은 하지 않는다.
5. **EXP 합계 감소 위험** — 원장 설계서 규칙(로그 합 재계산)을 그대로 쓰면 200건 넘은 사용자·첫 체크인 +5 받은 사용자의 EXP 가 줄어든다. `baseTotal` 로 막고, L01 시나리오에 「log 201건 + 우회 +5」 사례를 더한다.
6. **게스트 EXP 손실(추정)** — 회원 전환 때 `settings.xp` 미이관. 2단계(HOME-14 L10)에서 함께 고친다. 그 전에는 화면에서 실측해 추정을 확인해야 한다(지금은 코드 읽기뿐).
7. **index.html 동시 수정** — PR-5 는 다른 탭 이전 세션과 겹칠 수 있다. 착수 전 열린 PR·worktree 확인.
8. **고정 「+10 EXP」 문구(D4)** — 실제 지급과 다를 수 있는 표시(허상 지표 계열). 문구 변경이라 별도 티켓으로만 제기.

### 8-3. [결심 필요] 항목

| 번호 | 안건 | 권장 | 언제 |
| :-- | :-- | :-- | :-- |
| **K-XP1** | EXP 합계·이력(사유·시각 200건)을 서버 원장 `user_ledger_docs['xp']` 로 이관 + 운영 표 생성 SQL + 이관 확인 뒤 `settings.xp` 쓰기 중단 | 승인(본인만 읽는 표, 백업 먼저) | EXP 2단계 착수 전 — PR-1~5 는 이 결심 없이 진행 가능 |
| K4(원장 설계서) | 남의 레벨 공개 칸 vs 표시 제거 | 표시 제거 | EXP 2단계 |

* **진행 단계**: [4단계: 심사 청구]
