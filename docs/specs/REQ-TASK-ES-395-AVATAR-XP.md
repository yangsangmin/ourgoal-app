# REQ/PLAN — TASK-ES-395 EXP 세포 js/avatar/xp.js (아바타·EXP 쪼개기 PR-5, 저장 위치 그대로)

> 근거: 병합된 설계 `docs/specs/REQ-TASK-ES-384-AVATAR-EXP-PLAN.md` 3-2절 PR-5 행·4-3절·5절. 선행: #700(TASK-ES-385, FN_NAMES 추출 원본에 js/avatar/xp.js)·#706(TASK-ES-391, 앱 합본 아바타 범위 = xp.js)·#708(PR-4).
> 번호: 지시는 TASK-ES-393 이었으나 #707 이 먼저 써서(그 뒤 394·396 도 사용) 조정자 지시대로 TASK-ES-395.
> 제품 동작 변경 0. 저장 위치 그대로(`state.profile.settings.xp`) — 서버 원장 이관(K-XP1)은 상민님 결심 전이라 하지 않음. 금고 파일(court/**·AGENTS.md·CLAUDE.md·.github/workflows/**·scripts/essence-gate.js·scripts/verify-integrity-gate.js·package.json scripts·vercel.json) 변경 0.

## REQ
- 새 파일: `js/avatar/xp.js`(EXP 세포, 136줄)
- 수정 파일: `index.html`(EXP 구간 → 안내 주석 3줄 + window 대입 5줄 원래 자리, IIFE 머리 가져오기 9줄, `<script src="js/avatar/xp.js">` 1줄 — 그 밖의 줄 0), `docs/architecture/modules.json`·`module-baseline.json`
- 도구: `docs/design/harness/module-split/gen-avatar-xp.js`(생성기)·`verify-avatar-xp.js`(토큰·줄·누수·부품 시험·능력)·`dom-compare-avatar-xp.js`(게스트 화면 비교)·`spec-avatar-xp.js`(신고서 손 칸)·`real-account-avatar-xp.js`(실계정 체크인)
- 옮긴 선언 8개: `XP_RULES`·`XP_LOG_MAX`·`xpForLevel`·`levelForXP`·`levelProgress`·`triggerAvatarCelebrationPopup`·`awardXP`·`notifyXpGained`
- 새 함수(xp.js 안): 저장 어댑터 `xpStore(create)`, 읽기 `readXP()`. 키트 `window.OurgoalAvatarParts.xp`(#TASK-ES-389 의 기존 전역 안 — 새 전역 0)
- 능력(js/core/capabilities.js): `xp.award`(= awardXP, sideEffect local) · `xp.read`(= readXP, sideEffect none, 저장 칸을 만들지 않음)
- 그대로 둔 것: 지급 호출처 21곳(index.html 17 · js/tabs/goals 4) 글자, app-scope getter `get XP_RULES(){ return XP_RULES; }`·`get awardXP(){ return awardXP; }`·`get levelForXP(){ return levelForXP; }` 글자, `window.triggerAvatarCelebrationPopup`·`window.xpForLevel`·`window.levelForXP`·`window.levelProgress`·`window.notifyXpGained` 대입 줄(원래 자리)
- DOM(그대로): `#levelBadgeRow`, 홈 링 `#homeHeroExpBar`·`#homeHeroExpFill`·`#homeHeroExpGain`, 축하 팝업 `#avatarCelebrationToast`, 체크인 `#captureInput`·`#captureSave`
- 저장(그대로): localStorage `ourgoal_settings_<uid>` 의 `.xp = { total, log[≤200] }`

## 1. [원칙 ①] 목표 정의
index.html 인라인 IIFE 의 「XP/레벨 시스템」 구간(이전 전 3126~3193줄)을 EXP 세포 `js/avatar/xp.js` 로 옮기고, EXP 를 어디에 저장하는지를 어댑터 함수 하나(`xpStore`)로 모은다. 호출처·화면·저장값은 한 글자·한 값도 바뀌지 않는다. 다음 단계(K-XP1 결심 뒤 서버 원장 이관)는 이 어댑터 한 곳만 바꾸면 되게 한다.

## 2. [원칙 ②] 현상 분석
- EXP 정의 8개가 index.html 인라인(36,403줄 파일)에 있고, 지급은 21곳(index.html 17·목표 탭 4), 읽기는 index.html 11·홈 링 1·설정 1곳이다(설계 2절 측정).
- 저장 칸을 아는 곳이 awardXP 머리 두 줄(`if(!state.profile.settings.xp) …` · `var xp = state.profile.settings.xp;`)이다 — 2단계에서 바꿀 곳.
- 시험지는 준비돼 있다: smoke-test 의 FN_NAMES 추출 원본 = 인라인 + js/avatar/xp.js(#700), 앱 합본 아바타 범위 = xp.js(#706). 아바타 합본(tests/avatar-*)도 js/avatar/** 를 읽는다.

## 3. [원칙 ③] 원인 추정
- 옮기면 깨질 수 있는 이유 셋: (a) 옮긴 코드가 IIFE 이름 `state`·`nowISO` 를 읽는다 → `L.`(app-scope 통로, 둘 다 이미 노출) 로 읽어야 한다. (b) `function` 선언이 `var` 가져오기로 바뀌면 끌어올림이 사라져, 가져오기 줄보다 먼저 실행되는 코드가 있으면 undefined 를 부른다 → 가져오기를 IIFE 머리(첫 실행 문보다 앞)에 둔다. (c) 새 전역 이름은 `tests/avatar-personas-split.test.js` 의 「새 전역은 … 뿐」 단언에 걸린다 → 키트를 기존 전역 `OurgoalAvatarParts` 안 `xp` 칸에 둔다(첫 시도 `OurgoalXpKit` 은 그 단언에 걸려 바꿈).

## 4. [원칙 ④] 대안 탐색
- A 손으로 옮김: 글자 실수 위험. 기각.
- B 생성기로 옮김 + 토큰 비교(허용 차이 = `L.` 접두·어댑터 부르는 줄) — 선택. 생성기는 기준 index.html 에서 다시 돌리면 바이트까지 같은 결과.
- C 어댑터 없이 옮기기만: 2단계에서 awardXP 몸통을 다시 고쳐야 한다(설계 반론 1). 기각.
- D 저장 위치까지 원장으로: K-XP1 결심 전·원장 공통 PR 미병합. 기각(설계 4-1 B).

## 5. [원칙 ⑤] 실행 계획
1) `git archive` 기준 사본(4cf66f0)·기준 worktree(분리 HEAD) → 기준 npm test 2) `gen-avatar-xp.js` 3) `verify-avatar-xp.js` + 변이 탐침 4) `module-specs --write` → `spec-avatar-xp.js` → `module-specs --write` → `module-guard --update` 5) npm test 기준·작업 통과 줄 비교 6) `dom-compare-avatar-xp.js` 기준 대 기준·기준 대 작업 7) `tab-check.js home` 기준 2회·작업 1회 → `tab-compare.js` 8) 실계정 체크인(기준·작업) 9) origin/main(#707 등) 합친 뒤 다시 잼 10) claims·기록·PR.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파
- 반론① "var 가져오기로 바꾸면 함수 끌어올림이 사라져 순서가 바뀐다" → 가져오기 9줄은 IIFE 본문의 6번째 문(앞은 `_ui` 가져오기 var 들뿐)이고, 첫 함수 호출·다른 키트보다 앞이다(verify ③ 이 AST 로 확인: 가져오기 문 번호 < 첫 실행 문 번호). xp.js 는 avatar-system.js 앞, 인라인 스크립트보다 먼저 읽힌다. 화면 비교에서 window EXP 함수 5개 종류·지급 결과가 기준과 같다.
- 반론② "어댑터를 넣었으니 '옮기기만'이 아니다" → 만들기 갈래(`create=true`)의 두 문장은 원래 awardXP 머리 두 줄과 토큰이 같다(verify ① 이 그 두 문장을 awardXP 자리에 되끼워 기준 토큰 156개와 같음을 단언). 읽기 갈래(`create=false`)는 새 능력 xp.read 만 쓰고, 지급 경로는 타지 않는다. 부품 시험이 빈 칸·기존 값·200건 상한·프로필 없음(같은 TypeError)까지 기준과 deepStrictEqual.
- 반론③ "xp.js 가 아바타 합본·앱 합본 둘 다에 들어가 다른 단언(부정 단언)에 걸린다" → npm test 통과 줄이 기준과 줄 단위로 같다(640/640, smoke 443·0, 무결성 38/38).

## 7. [원칙 ⑦] 즉시 실행 — 결과
생성기 1회로 xp.js·index.html 을 썼다(바꾼 이름 참조 `state.` 7곳·`nowISO(` 1곳, 손으로 옮긴 글자 0). 신고서: `avatar/xp` hybrid, provides `xp.award`·`xp.read`, owns `data.xp`, planned contributes `checkin.after`(자리 연결은 별도 PR). avatar-system.js 의 planned.provides 에 있던 `xp.award` 는 실제 주인(xp.js)이 생겨 뺐다(능력 주인 하나).

## 8. [원칙 ⑧] 성과 측정 · 막히는 지점
작업자 실측(판정 아님) — 수치 원본은 `reports/TASK-ES-395/*.json`:
- `verify-avatar-xp.js` 7/7: 옮긴 선언 8개 토큰 561개 = 기준(허용 차이 L. 접두·어댑터), index.html 은 옮긴 63줄·허용 13줄을 빼면 기준과 줄 단위로 같음, 자유 이름 ⊆ 전역, L. 이름 2개 노출됨, 남은 정의 0, 부품 시험 27단계·레벨 함수 200,001값 = 기준, 능력 2개. 변이 탐침 2개(값 하나 바꿈 · L. 접두 하나 뺌) 각각 실패로 잡힘.
- index.html: 36,403 → 36,353줄, 모듈 가드 ① 인라인 줄 34,058 → 34,007 · ② 함수 선언 669 → 663.
- 화면·실계정: 9절.
- 막히는 지점: 진짜 폰(레벨 6)은 못 잼. 실계정은 서버 기록이 남지 않게 기록 동기화·AI 경로를 막고 쟀다.

## 9. 화면 · 실계정 실측
- (dom-compare / tab-check / 실계정 결과는 아래 측정 후 채움)

* **체크리스트 마감 규칙**: 본 작업계획서는 [4단계: 심사 청구]까지만 등록함.
