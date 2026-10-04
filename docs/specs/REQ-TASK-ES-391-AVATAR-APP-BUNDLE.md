# REQ/PLAN — TASK-ES-391 앱 합본의 아바타 범위를 js/avatar/xp.js 로 좁힌다 (아바타·EXP 쪼개기 PR-4 선행 시험지)

> 근거: 설계 `docs/specs/REQ-TASK-ES-384-AVATAR-EXP-PLAN.md` 5절(PR-4 모달 섹션 · feature-cards 세포), PR-3 #704(TASK-ES-389) 보고 — feature-cards 를 기준 시험지 [#TASK-ES-155] 때문에 옮기지 못함. 선례 #700(TASK-ES-385)·#703(TASK-ES-388).
> 제품 코드 변경 0. 금고 파일(court/**·AGENTS.md·CLAUDE.md·.github/workflows/**·scripts/essence-gate.js·scripts/verify-integrity-gate.js·package.json scripts·vercel.json) 변경 0.

## REQ
- 대상 파일: `scripts/smoke-test.js`
- 대상 상수: (신규) `APP_AVATAR_XP_JS`, (변경) `APP_MODULE_FILES` — `listJsTree(js/avatar, true)` → `js/avatar/xp.js`(있으면) 하나
- 그대로: `AVATAR_SRC`·`readAvatarFile`·`readAppModule`·`fnSource`(아바타 합본·EXP 추출 원본), 모든 `check()` 단언 문장·기대값
- 대상 DOM ID: 없음(시험지 변경)

## 1. [원칙 ①] 목표 정의
아바타 코드가 `js/avatar-system.js` 에서 `js/avatar/**`(모달 섹션·feature-cards)로 옮겨 가도 앱 합본(`APP_SRC`) 단언이 새로 걸리지 않게 한다. 단언 문장·기대값·검사 수는 바꾸지 않는다.

## 2. [원칙 ②] 본질·원인·중심·핵심
- 본질: #TASK-ES-385 가 앱 합본에 `js/avatar/**` 전체를 넣은 이유는 EXP 코드(index.html → `js/avatar/xp.js`) 하나였는데, 범위가 아바타 세포 전부로 넓었다.
- 원인: `APP_MODULE_FILES` 에 `listJsTree(path.join(__dirname, '..', 'js', 'avatar'), true)`. #TASK-ES-385 전에는 `js/avatar-system.js` 가 앱 합본에 없었으므로, avatar-system.js 에서 옮긴 글자가 앱 합본 부정 단언 [#TASK-ES-155] `indexSrc.includes('showToast(') === false` 에 처음으로 걸린다(모달·feature-cards 의 `win.showToast(`).
- 중심: 법정은 기준 커밋 시험지로 채점한다 — 이 PR 이 먼저 병합돼야 PR-4 가 판정 가능하다.
- 핵심: 앱 합본의 아바타 범위를 원래 목적(xp.js)으로 되돌린다. 아바타 글자 단언은 아바타 합본이 그대로 본다.

## 3. [원칙 ③] 해결 방식 — 구체적 식별자
- `const APP_AVATAR_XP_JS = path.join(__dirname, '..', 'js', 'avatar', 'xp.js');`
- `APP_MODULE_FILES = [...js/tabs/**, ...js/core/*, ...(fs.existsSync(APP_AVATAR_XP_JS) ? [APP_AVATAR_XP_JS] : [])]`
- `readAppModule(f)` 의 아바타 세포 분기(`isAvatarCellFile` → `readAvatarFile`)는 그대로(xp.js 가 오면 AV.·MS. 접두를 떼고 읽음).

## 4. [원칙 ④] 재검토 — 다른 길과 비교
- A ES-155 단언을 고침: 기대값 변경 — 금지.
- B 모달·feature-cards 의 `win.showToast(` 를 다른 글자로: 제품 코드 변경, "글자 그대로 옮기기" 위반.
- C 앱 합본 범위를 #TASK-ES-385 의 목적(xp.js)으로 좁힘: 단언 0 변경, #700 전 범위와 같음 → C 선택.
- 지금(js/avatar/ 에 themes·render·craft-engine·wallet·dynamic-album 5개, xp.js 없음) 이 5개 파일이 앱 합본에서 빠지지만 그 덕에 통과하던 앱 합본 단언은 0개(전후 통과 줄 동일 실측).

## 5. [원칙 ⑤] 절차
1) 기준 origin/main(fa5a7b6) npm test → 2) `APP_MODULE_FILES` 수정 → 3) 변경 후 npm test, 통과 줄 전후 diff → 4) 변이 시험(아바타 세포에 `showToast(` 를 넣은 탐침 파일) 기준 사본(git archive)·작업본 각각 → 5) xp.js 탐침으로 xp.js 가 여전히 앱 합본에 있음 확인 → 6) claims·기록 → 7) PR.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파
- 반론① "부정 단언의 범위를 줄여 시험을 느슨하게 한다" → 줄인 범위는 #TASK-ES-385(#700, 2026-10-05) 전에는 없던 범위다. 그 전 [#TASK-ES-155] 는 index.html + js/tabs + js/core 만 봤고 avatar-system.js(같은 `win.showToast(` 를 지금도 가진 파일)는 본 적이 없다. 즉 원래 판정 범위로 되돌리는 것이고, 아바타 글자 부정 단언(`btnRerollAvatarTheme` 등)은 아바타 합본에서 그대로 검사된다. 지운 단언 줄 0(diff).
- 반론② "xp.js 를 옮길 때 EXP 단언이 못 찾는다" → xp.js 는 있으면 앱 합본에 들어간다. 탐침 xp.js 에 `showToast(` 를 넣으면 ES-155 가 실패함을 실측(=xp.js 가 앱 합본에 들어감).

## 7. [원칙 ⑦] 즉시 실행 — 결과
`scripts/smoke-test.js` 의 `APP_MODULE_FILES` 1줄 + 주석·상수 1줄. 제품 코드 0, 금고 파일 0, 단언 문장·기대값 0 변경.

## 8. [원칙 ⑧] 성과 측정 · 막히는 지점
작업자 실측(판정 아님):
- 기준(origin/main fa5a7b6) npm test: smoke 443개 통과·0 실패, 나머지 단계 통과. 변경 후: 443·0, 통과 줄(✓·ok) 전후 diff 0줄.
- 변이: `js/avatar/zz-probe.js`(내용 `win.showToast('probe')`)를 넣으면 기준 사본(git archive)은 442·1 실패([#TASK-ES-155]), 작업본은 443·0. 탐침 `js/avatar/xp.js` 를 넣으면 작업본도 442·1 실패([#TASK-ES-155]) → xp.js 는 앱 합본에 남음. 탐침 파일은 시험 뒤 삭제.
- 결과 기록: `reports/TASK-ES-391/measure.json`.
- 막히는 지점: 법정이 기준 시험지로 채점하므로 이 PR 병합 전에는 PR-4(모달·feature-cards)가 판정되지 않는다.

* **체크리스트 마감 규칙**: 본 작업계획서는 [4단계: 심사 청구]까지만 등록함.
