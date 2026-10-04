# REQ/PLAN — TASK-ES-385 시험지가 「아바타 합본」을 읽는다 (아바타·EXP 쪼개기 PR-1, 시험지 선행)

> 근거: 병합된 설계 `docs/specs/REQ-TASK-ES-384-AVATAR-EXP-PLAN.md` 5절 표의 **PR-1 시험지 선행** 행. 선례 #669(TASK-ES-357)·#670(TASK-ES-359)·#681(TASK-ES-369).
> 제품 코드 변경 0. 금고 파일(court/**·AGENTS.md·CLAUDE.md·.github/workflows/**·scripts/essence-gate.js·scripts/verify-integrity-gate.js·package.json scripts·vercel.json) 변경 0.

## REQ
- 대상 파일: `scripts/smoke-test.js`, `tests/avatar-exp-celebration.test.js`, `tests/avatar-levelup-dialogue.test.js`, `tests/enlarge-avatar-icons.test.js`
- 대상 함수·상수(smoke-test.js 신규): `AVATAR_CELL_DIR`, `isAvatarCellFile(f)`, `readAvatarFile(f)`, `AVATAR_SYSTEM_JS`, `AVATAR_PART_FILES`, `AVATAR_SRC`, `AVATAR_XP_JS`, `fnSource`; 변경: `APP_MODULE_FILES`(+ `js/avatar/**`), `readAppModule(f)`(아바타 세포면 `readAvatarFile`), `extracted`(추출 원본 `mainScript` → `fnSource`)
- 대상 함수(tests 3개 신규): `listJsTree(dir, recursive)`, `readAvatarBundle(rootDir)`; 변수 `avatarSystemJs`·`avatarJs`, enlarge 시험의 `avatarScriptOrder`
- 대상 DOM ID: 없음(시험지 변경)

## 1. [원칙 ①] 목표 정의
`js/avatar-system.js`(7,351줄)를 `js/avatar/**`·`js/data/avatar-personas/*` 세포로 옮겨도(동작 그대로) 기존 글자 단언 113개·EXP 함수 단위 시험이 같은 코드를 찾게 한다. 단언 문장·기대값·검사 수는 바꾸지 않는다.

## 2. [원칙 ②] 본질·원인·중심·핵심
- 본질: 시험은 '아바타 코드'를 봐야 하는데 '아바타 코드가 들어 있는 파일 한 개'를 보고 있다.
- 원인: smoke-test.js 의 아바타 단언 24곳과 tests 3개가 `js/avatar-system.js` 를 직접 읽는다. `FN_NAMES` 의 `xpForLevel`·`levelForXP`·`levelProgress` 는 index.html 인라인 스크립트에서만 뽑는다.
- 중심: 법정은 기준 커밋 시험지로 채점한다 — 이 PR 이 먼저 병합되지 않으면 PR-2~5 는 옮긴 글자만큼 실패한다.
- 핵심: 읽는 범위를 합본으로 넓히고, 지금 합본이 단일 파일과 글자가 같음을 시험 안에서 단언한다.

## 3. [원칙 ③] 해결 방식 — 구체적 식별자
- 아바타 합본 = `js/avatar-system.js` + `js/avatar/**/*.js` + `js/data/avatar-personas/*.js`(폴더 안 이름순), 생성기 접두 `AV.`·`MS.` 를 정규식 `/(^|[^A-Za-z0-9_$.])(?:AV|MS)\.(?=[A-Za-z_$])/g` 로 떼고 읽음(L.·K. 와 같은 방식).
- smoke-test.js: `fs.readFileSync(path.join(__dirname, '..', 'js', 'avatar-system.js'), 'utf8')` 23곳과 `fs.readFileSync(avatarSystemPath, 'utf8')` 1곳 → `AVATAR_SRC`. `require('../js/avatar-system.js')`(실행 경로)는 그대로.
- `FN_NAMES` 추출 원본 = `mainScript` + `js/avatar/xp.js`(있으면). 인라인 문법 검사는 `mainScript` 그대로.
- `APP_MODULE_FILES` 에 `listJsTree(js/avatar, true)` 를 더함(EXP 코드가 index.html → xp.js 로 가도 html 단언이 찾게).
- tests 3개: 읽는 줄만 `readAvatarBundle(rootDir)` 로. enlarge 시험의 `vm.runInContext` 는 접두 뗀 글자가 아니라 실제 파일을 index.html `<script>` 순서대로 실행(지금은 avatar-system.js 하나 — 같은 실행).
- 합본=단일 파일 단언: 부품 파일 0개일 때 `assert.strictEqual(합본, avatar-system.js 원문)`. smoke 에서는 `check()` 밖(검사 수 443 불변).

## 4. [원칙 ④] 재검토 — 다른 길과 비교
- A 세포 이전 PR 마다 단언 경로를 고침: 단언 변경, 기준 시험지로 채점되는 법정에서 판정 불가.
- B 아바타 글자를 avatar-system.js 에 남김: 쪼개기 무의미.
- C 읽는 범위만 합본으로(선례 #669·#670·#681): 단언 0 변경 → C 선택.
- `scripts/verify-integrity-gate.js`: 아바타 파일 글자를 읽는 검사가 없음(전수 grep: `avatar-system` 0건) → [기본값] 변경하지 않음. 범위를 넓히면 77종 금지 검사가 오늘 보지 않던 파일을 보게 되어 기대가 달라진다.
- `scripts/verify-all-clicks.js`: avatar-system.js 를 읽지 않음 → [기본값] 그대로(버튼 수 불변).

## 5. [원칙 ⑤] 절차
1) 기준 커밋 f025fa1 을 `git archive` 사본으로 풀어 npm test 측정 → 2) 시험지 수정 → 3) 변경 후 npm test → 4) 전후 로그 비교 → 5) diff 로 지운 단언 0 확인 → 6) claims·기록 → 7) PR.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파
- 반론① "시험을 느슨하게 한다" → 존재 단언은 같은 글자를 같은 순서의 더 넓은 범위에서 찾고(avatar-system.js 가 맨 앞이라 indexOf 첫 위치 그대로), 부재 단언(`btnRerollAvatarTheme`·`최대 3회` 등)은 범위가 넓어져 더 엄격해진다. 지운 단언 줄 0(diff).
- 반론② "접두 떼기가 오늘 글자를 바꿀 수 있다" → 부품 파일이 없을 때 합본 === avatar-system.js 원문을 시험이 단언하므로, 떼기가 한 글자라도 바꾸면 smoke·tests 가 바로 실패한다. 실측 통과.

## 7. [원칙 ⑦] 즉시 실행 — 결과
scripts/smoke-test.js·tests 3개만 변경. 제품 코드 0, 금고 파일 0, 단언 문장·기대값 0 변경.

## 8. [원칙 ⑧] 성과 측정 · 막히는 지점
작업자 실측(판정 아님):
- 기준(f025fa1, git archive 사본) npm test: smoke 443개 통과·0 실패 / 무결성 38개 중 38개 / 버튼 943개 / 943개 / 셀 구조 시험 통과.
- 변경 후 npm test: 443·0 / 38/38 / 943/943 / 통과. 전후 로그 차이는 경로 문자열과 .git 유무(사본에 .git 없음) 줄뿐.
- tests: avatar-exp-celebration·avatar-levelup-dialogue 전후 모두 exit 0. enlarge-avatar-icons 는 **기준 커밋에서도** index.html 단언(`class="avatar-placeholder" style="width:72px;height:72px;`, 28줄)에서 실패 — 이 PR 과 무관한 기존 실패, 고치지 않음(기대값 변경 금지). 그 단언만 건너뛴 스크래치 사본에서 vm 실행부는 전후 모두 exit 0.
- 막히는 지점: PR-5 에서 `xpForLevel` 이 인라인에서 빠져야 xp.js 판이 뽑힌다(추출은 첫 일치). 설계대로 옮기면 자연히 그렇게 된다.

* **체크리스트 마감 규칙**: 본 작업계획서는 [4단계: 심사 청구]까지만 등록함.
