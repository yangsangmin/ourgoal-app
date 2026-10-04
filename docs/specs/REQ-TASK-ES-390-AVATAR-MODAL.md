# REQ/PLAN — TASK-ES-390 아바타 설정 모달 섹션 7개 · 기능 카드 세포 (아바타·EXP 쪼개기 PR-4)

> 근거: 병합된 설계 `docs/specs/REQ-TASK-ES-384-AVATAR-EXP-PLAN.md` 3-1절 표(`js/avatar/modal/*` 7개 · `js/avatar/feature-cards.js`)·3-2절 PR-4 행. 선행: #700(시험지)·#702(데이터)·#704(로직 5세포)·#706(TASK-ES-391, 앱 합본 아바타 범위를 xp.js 로 좁힘 — feature-cards 를 막던 [#TASK-ES-155] 해소).
> 제품 동작 변경 0. 금고 파일(court/**·AGENTS.md·CLAUDE.md·.github/workflows/**·scripts/essence-gate.js·scripts/verify-integrity-gate.js·package.json scripts·vercel.json) 변경 0.

## REQ
- 수정 파일: `js/avatar-system.js`(1,448 → 249줄, 조립자), `index.html`(avatar-system.js 앞 `<script>` 8줄 추가만), `tests/avatar-period-analysis.test.js`(읽는 범위만 아바타 합본으로), `docs/architecture/modules.json`·`module-baseline.json`
- 새 파일: `js/avatar/feature-cards.js`(341), `js/avatar/modal/index.js`(192)·`markup.js`(190)·`bind-period.js`(87)·`bind-deck.js`(250)·`bind-craft.js`(234)·`bind-persona.js`(109)·`bind-save.js`(87)
- 도구: `docs/design/harness/module-split/gen-avatar-modal.js`(생성기)·`verify-avatar-modal.js`(글자·토큰·실행·섹션 경계)·`dom-compare-avatar-modal.js`(화면 비교)·`spec-avatar-modal.js`(신고서 손 칸)·`real-account-avatar-modal.js`(실계정 왕복)
- 함수: `openAvatarModal`·`showAvatarLegalNotice`(→ modal/index.js), 섹션 함수(새, `OurgoalAvatarParts` 안에만) `renderAvatarModalMarkup`·`restoreAvatarModalPersona`·`bindAvatarModalPeriod`·`bindAvatarModalDeck`·`bindAvatarModalCraft`·`bindAvatarModalPersona`·`bindAvatarModalSave`, 기능 카드 `handle아바타_Item26Action`·`handle아바타_Item32Action`·`handle아바타_Item41Action`·`handle아바타_Item42Action`·`triggerAvatarLevelUpDialogue`·`triggerExpCelebrationPopup`
- 모달 상태 객체 `MS`(openAvatarModal 호출마다 새로): getter 46개(openAvatarModal 지역 17 + openModal 콜백 지역 29), setter 9개 `selectedType`·`newCustomUrl`·`lastUploadedImg`·`lastUploadedDataUrl`·`currentFeatures`·`chosenTheme`·`periodStart`·`periodEnd`·`currentPersona`(설계 3-1절 9개와 같음), 섹션 함수 3개 `updateRemainingUI`·`updateCustomAvatarView`·`onAvatarCraftCompleted`(bind-deck 이 담음)
- DOM(그대로): `#btnSettingsQuickAvatar`·`#avatarTypeToggle`·`#avatarPeriodSection`·`#btnSetAvatarPeriod`·`#avatarPeriodStartInput`·`#avatarPeriodEndInput`·`.avatar-period-chip`·`#savedAvatarsDeckSlot`·`.saved-avatar-card`·`.empty-avatar-slot`·`.btn-del-saved-avatar`·`.avatar-growth-chip`·`#btnSaveModalGrowthPrompt`·`#btnUploadAvatarPhoto`·`#customAvatarFileInput`·`#btnLegalNoticeAgree`·`#btnRunCraftAvatar`·`#btnToggle320PersonaCatalog`·`.btn-group-tab`·`#inputSearchPersona320`·`.persona-theme-card`·`#btnSaveAvatarModal`·`#btnCancelAvatarModal`

## 1. [원칙 ①] 목표 정의
`js/avatar-system.js` 를 800줄 이하 조립자로 만든다(1,448 → 249). 설정 모달(`openAvatarModal` 880줄)을 책임 섹션 7개로, PR-3 이 남긴 기능 카드 묶음(핸들러 4·대사 2)을 `feature-cards.js` 로 옮긴다. 공개 이름 42개·호출 순서·동작 그대로, 생성기로만 옮기고 손으로 옮긴 글자 0, 각 파일 800줄 이하. 결과: 모듈 가드 ④ 800줄 초과 js 파일 9 → 8.

## 2. [원칙 ②] 본질·원인·중심·핵심
- 본질: 모달은 함수 하나 안의 클로저다 — 섹션끼리 지역 변수 46개를 같이 쓰고 그중 9개는 다시 대입한다. 글자만 잘라 옮기면 변수가 끊긴다.
- 원인: `openModal(html, function (sheet) { … })` 콜백 안에서 섹션들이 `selectedType` 등을 읽고 쓰며, 다른 섹션의 함수(`updateRemainingUI` 등)를 부른다.
- 중심: 틀(`docs/specs/MODULE-SPLIT-PROTOCOL.md` 2절) 섹션 경계 조건 ③(공유 변수 재대입 없음)을 9개가 어긴다 → 설계대로 모달 상태 객체 `MS.` 로 넘긴다.
- 핵심: 생성기가 Babel 스코프 분석으로 이름마다 주인 섹션을 정하고, 다른 섹션이 쓰는 이름만 `MS.<이름>`(getter·setter 는 조립자가 원래 변수에 건다 — 값은 살아 있다), 팩토리 이름은 `AV.<이름>`(PR-3 과 같음)으로 바꾼다.

## 3. [원칙 ③] 해결 방식 — 구체적 식별자
- 섹션(이전 전 줄): markup 197~362 · restore(초기 페르소나 복원) 378~385 · period 410~473 · deck 475~698 · craft 700~896 · persona 898~983 · save 985~1048. 최상위 문 단위로만 자른다(문 하나를 가르지 않음).
- 조립자 `modal/index.js`: openAvatarModal 머리(173~195)·`if (sheet)`·공유 변수 9개 선언·DOM 참조 20개·`btnCancel.onclick` 는 글자 그대로, 섹션 자리는 부르는 줄 한 줄(`AV.bindAvatarModalPeriod(MS);` …, markup 은 `var html = AV.renderAvatarModalMarkup(MS);`) — 원래 순서·원래 자리. restore 도 원래 자리(공유 변수 선언 바로 다음)에서 부른다.
- MS 만들기: 머리 다음(markup 앞)에 `var MS = {}` + openAvatarModal 지역 17개 getter, 공유 변수 선언 다음에 콜백 지역 29개 getter(9개는 setter). 섹션 함수 3개는 bind-deck 맨 위에서 `MS.<이름> = <이름>`(함수 끌어올림과 같은 시점).
- 기능 카드: 선언 6개만 옮기고, `window.handle아바타_* = …` if 문 4쌍과 `api.<이름> = …` 4줄은 avatar-system.js 원래 자리(js/components.js 가 41·42 를 나중에 덮어쓰는 순서 보존). 기능 카드 몸통은 바깥 이름을 읽지 않아 바꾼 글자 0.
- avatar-system.js: PR-3 이음매 바로 다음에 이음매 2(부품 8개 require · `var X = AV.X` 8줄 · 새 AV getter `askConfirm` 1개). 새 전역 0(`OurgoalAvatarParts` 는 PR-3 것).
- 시험지: `tests/avatar-period-analysis.test.js` 가 avatar-system.js 한 파일을 읽던 것을 아바타 합본(tests/avatar-10slots-growth.test.js 의 `readAvatarBundle` 글자 그대로)으로 — 단언·기대값 0 변경(PR-3 이 시험 2개에 한 것과 같음).

## 4. [원칙 ④] 재검토 — 다른 길과 비교
- A 섹션마다 매개변수 46개를 넘김: 9개는 재대입이라 값이 되돌아오지 않음 — 동작이 바뀐다. 기각.
- B 공유 변수를 모두 객체로 옮기고 조립자 글자도 `MS.x` 로 바꿈: 조립자 글자(선언 9줄 등)가 바뀐다. 기각.
- C 조립자는 글자 그대로 두고 MS 에 getter/setter(살아 있는 값) — 섹션은 접두만 바뀜(시험지가 뗌). 선택.
- `this` 위험: `MS.f()`·`AV.f()` 로 부르면 this 가 바뀐다 — 부르는 함수 28개(MS 8 · AV 20) 모두 자기 몸통에 this 0(생성기 검사 + index.html `toast`·`saveProfile`·`openModal`·`closeModal`·deps 람다 4개 실측 0).

## 5. [원칙 ⑤] 절차
1) origin/main(09f4a99, #706 병합) 합침 → `git archive` 기준 사본 → 기준 npm test 2) 생성기 3) `verify-avatar-modal.js` 4) 시험 1개 읽는 범위 넓힘 5) `module-specs --write` → `spec-avatar-modal.js` → `module-specs --write` → `module-guard --update` 6) npm test 7) 화면: `dom-compare-avatar-modal.js` 기준 대 기준·기준 대 작업, `tab-check.js home,settings` 기준 2회·작업 1회 → `tab-compare.js` 8) 실계정 모달 왕복(기준·작업) 9) claims·기록·PR.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파
- 반론① "getter 로 바꾸면 값이 한 박자 늦거나 복사본이 된다" → getter 는 읽을 때마다 원래 클로저 변수를 돌려주고 setter 는 원래 변수에 쓴다(복사 없음). 화면 비교에서 공유 변수를 쓰는 조작(기간 칩·입력, 보관함 선택·삭제, 업로드·제작 3경로, 도감 선택, 저장)의 DOM·저장값·토스트·/api 호출 내용이 기준과 같다.
- 반론② "섹션을 옮기면 실행 순서·시점이 바뀐다" → 섹션 부르는 줄은 원래 문 자리에 있고, 다른 섹션 함수를 중첩 함수 밖에서 바로 부르는 곳은 0(생성기 ④ 검사). 함수 담기(`MS.f = f`)는 섹션 첫 줄 = 끌어올림과 같은 시점. 기능 카드 window 대입은 원래 자리.
- 반론③ "기능 카드를 옮기면 [#TASK-ES-155] 가 다시 깨진다" → #706 이 앱 합본 아바타 범위를 xp.js 로 좁혔다. npm test 443·0 그대로.

## 7. [원칙 ⑦] 즉시 실행 — 결과
생성기 1회 실행으로 새 파일 8개·avatar-system.js·index.html 을 썼다(이름 참조 바꿈 392곳, 손으로 옮긴 글자 0). 시험 1개는 읽는 범위만, 단언 0 변경.

## 8. [원칙 ⑧] 성과 측정 · 막히는 지점
작업자 실측(판정 아님) — 수치는 `reports/TASK-ES-390/*.json` 이 원본:
- `verify-avatar-modal.js`: 8/8 — 섹션 7개 몸통·기능 카드 몸통 = 기준 줄 그대로, 되맞추기 1,449줄·토큰 8,881개 = 기준(허용 차이 접두 784토큰 = 392곳), Node·브라우저(self 있음·없음) 공개 42개·함수 토큰·데이터 = 기준, 새 전역 0, 섹션 파일 자유 이름 ⊆ 기준 전역, MS 대입 = setter 9개, 파일 8개·avatar-system.js 각 800줄 이하. 변이 2개(접두 하나 뺌 · 글자 하나 바꿈) 각각 ⑥·③ 실패로 잡힘.
- npm test: 기준(git archive 09f4a99) smoke 443·0 / 무결성 38/38 → 작업 443·0 / 38/38, 모듈 가드 ④ 9 → 8. 전후 결과 줄 차이는 기준 사본에 .git 이 없어 건너뛴 git 비교 줄 3개뿐.
- tests: 아바타 관련 12개 기준·작업 종료 코드 같음. avatar-icon-enlarge-all·avatar-welcome-modal·enlarge-avatar-icons 는 **기준에서도** 실패(기존, 메시지 같음 — 고치지 않음).
- 화면·실계정: 9절.
- 확인 못 함: 진짜 폰(레벨 6), 실제 Gemini 호출(돈·외부 전송 — 목으로만), 파일 선택 창의 실제 사진(1×1 PNG 로만).

## 9. 화면 · 실계정 실측
- 모달 섹션별 조작(게스트, `dom-compare-avatar-modal.js`): 42단계(부팅 5 · 조립자 5 · markup 4 · restore 1 · period 8 · deck 13 · craft 6 · persona 5 · save 3, 겹침 포함) × 14칸 = 588값. 기준 대 기준 차이 0(`dom-compare-avatar-modal-base-vs-base.json`) · **기준 대 작업 차이 0**(`dom-compare-avatar-modal.json`), 콘솔 오류 0·0. 지난 경로: 탭 토글, 기간 칩 4개·직접 입력(잘못된 범위/바른 범위), 보관함 선택·빈 슬롯·삭제 취소/확인(앱 바텀시트), 성장 성향 칩·부적절 단어 정화, 사진 전 제작 안내, 초상권 안내 → 동의 → 파일 선택(1×1 PNG), 제작 3경로(서버 문제 안내·횟수 되돌림 / AI 그림 / 캔버스 합성), 도감 열기·NF 탭·검색·카드 선택, 만화형 적용·로봇 적용·닫기. /api 호출 내용(페르소나 요약·avatar-face 테마 id)도 기준과 같다(목 서버, 실제 Gemini 0).
- 탭 실측(`tab-check.js home,settings` 기준 2회·작업 1회 → `tab-compare.js`): 732값, 기준 1회차 대 2회차 0 · 기준 대 작업 0.
- 실계정(테스트 계정 A, 로컬 127.0.0.2 + /api 운영 전달, avatar-face·persona 는 막음, `real-account-avatar-modal.js`): 기준·작업 각 6/6 — 설정 → 모달 열기 → 만화형 → 표식 카드 → 적용하기 → state·서버 `users.avatar_url` = 표식 → 기기 사본 파기·새로고침 → 서버에서 복원 → 원래 값으로 정리(서버 = 원래 값). 보관함 서버 저장(`users.saved_avatars`)은 운영 칸이 없어 기준·작업 모두 저장 안 됨(#704 에서 찾은 기존 결함, 이 PR 범위 밖 — 회귀 아님). 참고값: 적용 4초 뒤에도 `#avatarTypeToggle` 이 DOM 에 남음(기준·작업 같음).

* **체크리스트 마감 규칙**: 본 작업계획서는 [4단계: 심사 청구]까지만 등록함.
