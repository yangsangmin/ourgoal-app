# REQ — #TASK-ES-354 모듈 분할 공통 틀(CORE-07) + 설정 탭 시범 이전(SET-07)

- 근거: 노션 「아워골 UI/UX 대개편 작업 티켓 DB」 CORE-07(모듈 분할 공통 틀)·SET-07(설정 탭 모듈 이전). 상민님 원문 "이제 진짜 모듈화 진행해야지?"(2026-10-02), "모듈화부터 제대로 정착시켜야하지 않을까?"(2026-10-04). 상민님 질문 "800줄 블록화·모듈화가 알맞은 방향인가"에 대한 오케스트레이터 결론(2026-10-04: 줄 수가 아니라 책임 단위, 공용 부품 먼저, 탭 순서).
- 참고만: `docs/specs/LEDGER-DESIGN-2026-10-04.md`(원장 설계 — 이번 범위 아님).
- 틀 문서: `docs/specs/MODULE-SPLIT-PROTOCOL.md`.
- 범위: `index.html`(설정 렌더 코드·공용 헬퍼 3개 삭제, IIFE 맨 위 가져오기·통로 노출, `<script>` 태그), `js/core/app-scope.js`·`js/core/ui-helpers.js`(신규), `js/tabs/settings/*`(render.js·sub-notify·sub-integrations·sub-data 신규, sub-profile·sub-security·sub-appearance 교체, index.js 등록 3줄), `scripts/smoke-test.js`·`scripts/verify-all-clicks.js`(소스 합본으로 읽기 — 기대값은 그대로), 도구 `docs/design/harness/module-split/`. 마크업(HTML)·CSS 는 옮기지 않았다.

## 1. [원칙 ①] 문제 정확히 파악 — 지시 원문(요지)

1. CORE-07 틀 문서: 소블록 인터페이스(mount·render·dispose, 이벤트는 #663 사전), 인라인 함수가 쓰는 공용 상태·헬퍼를 새 파일에서 참조하는 방법(전역 노출 최소, 한 곳에서 노출), 옮기는 순서, 전후 비교 절차(같은 커밋 2회 → 이전 후 → tab-compare 차이 0), 실패 시 되돌리기.
2. 설정 탭 시범: `renderSettingsScreen` 과 설정 전용 핸들러·헬퍼를 `js/tabs/settings/` 아래 묶음별 파일(각 800줄 이하)로 옮기고 index.html 에서 삭제. 마크업은 옮기지 않음. 설정 소블록 껍데기를 실제 렌더로 교체. 다른 곳의 `renderSettingsScreen` 호출(20여 곳)은 같은 이름으로 계속 동작.
3. 측정: ① index.html 의 `renderSettingsScreen` 정의 0·줄 수 감소량 ② 새 파일 각 800줄 이하 ③ tab-check 설정 탭(+6탭 회귀) 전/후 → tab-compare 차이 0(본질 변동은 2회 기준으로 제외 근거) ④ 콘솔 오류 증가 0 ⑤ `npm test` 0.
4. 문서: REQ/PLAN, `reports/TASK-ES-354/claims.json`, TICKETS 1줄, dev_log.
5. 보완 ①: 800줄은 상한일 뿐 — 책임(기능 묶음) 단위로 나누고 `part1/part2` 식 줄 수 분할 금지.
6. 보완 ②: 공용 부품 먼저 — 설정 코드가 쓰는 공용 함수·상태를 목록화하고 여러 탭이 쓰는 것은 `js/core/` 아래 한 통로로만 노출. 설정 전용 임시 통로 금지. 실제로 core 로 옮기는 것은 설정이 쓰는 범위, 동작 그대로.
7. 보완 ③: 틀 문서에 위 두 원칙과 탭 순서(설정→기록→일정 먼저, 목표·소통은 실계정 확인 CORE-02 뒤).
8. 보완 ④: 효과 지표 3개 — index.html 줄 수 전/후, 800줄 초과 js 파일 수 전/후, 새 파일 목록·줄 수.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 화면 하나를 고치려 해도 index.html 4만 줄 IIFE 안을 뒤져야 하고, 탭 파일(`js/tabs/*`)은 이름뿐인 껍데기라 모듈 구조가 실제로는 없다. 옮기는 틀이 없으니 매번 "고치면서 옮기다" 동작이 바뀐다.
- **원인**: (가) 모든 함수가 한 IIFE 클로저 안에서 서로의 지역 이름(`state`·`saveProfile`·`toast` …)을 직접 읽는다 — 바깥 파일에서는 그 이름이 안 보인다. (나) 그래서 기존 설정 소블록 3개는 `window.renderProfileCard`·`updatePrivacyBadges`·`updateTwoFactorStatusUI`(window 에 없음)를 부르는 껍데기였다(측정: 그린 소블록 0 → 폴백). (다) `renderSettingsScreen` 하나가 826줄이라 800줄 상한 안에 그대로 넣을 수 없다. (라) 전역에 함수를 새로 달면 그 이름을 찾던 다른 파일의 분기가 새로 돈다(`js/components.js` 의 `win.renderSettingsScreen` 5곳).
- **중심**: 인라인 스코프와 바깥 파일 사이의 이음매 — 무엇을, 어디서, 어떤 순서로 노출하고 가져오는가.
- **핵심**: 스코프 분석으로 뽑은 이름만 `js/core/app-scope.js` 한 통로에 getter 로, 순수 공용 헬퍼는 `js/core/ui-helpers.js` 로 실제 이전, index.html 은 IIFE 맨 위에서 같은 이름으로 가져온다(전역 0 추가). 옮기는 글자는 생성기가 토큰 단위로 그대로 옮기고 이름 접두만 바꾼다.

## 3. [원칙 ③] 해결방식

- `js/core/app-scope.js`: `OurgoalAppScope.expose(owner, getters)`·`scope`·`names()`·`missing()`. index.html IIFE 맨 위에서 52개 이름 getter(대입하는 `googleTokenClient` 만 setter).
- `js/core/ui-helpers.js`: `escapeHtml`·`a11ySwitch`·`download` 글자 그대로 이전(조건: IIFE 스코프 이름을 읽지 않음·재대입 없음 — `toast` 는 `toastTimer` 공유라 남김). `nowISO`·`triggerHaptic`(·그것을 읽는 `triggerHapticFeedback`)은 기준 시험지 `scripts/smoke-test.js` 의 단위 시험(FN_NAMES)이 인라인 스크립트에서 이름으로 뽑아 돌리므로 남겼다 — 옮기면 법정의 기준 시험지 채점이 중간에 죽는다(예비 점검에서 실측). index.html 은 맨 위에서 같은 이름으로 가져옴.
- `js/tabs/settings/render.js`: `renderSettingsHeroCard`·`collapseAllSettingsSections`·`toggleAdvancedSettings`·`formatStorageBytes`·`paintCacheUsage`·`renderSettingsScreen`(머리 23줄 + 소블록 6개를 원래 순서로 `render(settings)`)·`bindSettingsHapticDelegate`(문서 클릭 햅틱 위임 1문)·`bindSettingsStaticHandlers`(체크인 시간 추가·테스트 알림·내보내기 2·가져오기 2, 6문). 키트 `window.OurgoalSettingsKit`.
- 소블록(책임 단위): `sub-profile.js`(공개 범위·아바타 인사·활동 상태) · `sub-security.js`(계정 표시·비밀번호·앱 잠금 PIN·다른 기기 로그아웃) · `sub-notify.js`(체크인 시간·알림 센터·방해금지·유형별 알림) · `sub-appearance.js`(테마·고대비·글자 크기·데이터 절약) · `sub-integrations.js`(구글 캘린더·가상 페르소나·휴지통/차단·노션·잇템) · `sub-data.js`(AI 키·자동 제안·캐시·내보내기 형식·고객지원·고급 설정 햅틱). 각 `render(settings)` = 원래 구간 본문, `mount` = dispose 후 `false`(이전과 같은 폴백 경로), `dispose` = `offOwner('settings/<id>')`.
- `index.html`: 지운 구간(이전 전 38632~39647줄) 자리에 `bindSettingsHapticDelegate()`·`window.collapseAllSettingsSections/toggleAdvancedSettings/paintCacheUsage = …`(원래 순서)·`bindSettingsStaticHandlers()` 만 남김. `<script>` 태그 6줄 추가.
- 시험: `scripts/smoke-test.js` 가 소스 글자를 index.html 단일 파일로 보던 것을 "index.html + 옮긴 파일" 합본으로(검사 187곳의 `readFileSync(index.html)` → `APP_SRC`, 단위 시험 함수 추출은 `ui-helpers.js` 를 이어 붙임). `scripts/verify-all-clicks.js` 는 정적 `<button>` 추출·핸들러 탐색에 옮긴 파일을 더함. 기대값(통과 수·버튼 수)은 바꾸지 않았다.

## 4. [원칙 ④] 재검토 — 한계(정직하게)

- 바뀐 내부 구조(화면에는 안 보임): 설정 메가블록에 등록된 소블록 3 → 6, 설정 소블록 3개가 걸던 `view:sync` 구독 3개(핸들러가 아무것도 그리지 않던 것)는 걸지 않는다. 화면·저장값 차이 0(8절).
- 레지스트리 경유 그리기(메가블록이 직접 `renderSettingsScreen`)로 바꾸지 않았다 — 렌더가 예외를 던질 때 레지스트리가 삼키고 `setTab` 이 한 번 더 부르는 경로가 생겨 동작이 바뀌기 때문이다(별도 티켓).
- 옮기며 발견한 기존 버그(고치지 않음, 별도 티켓): ① `renderSettingsScreen` 안 `var isAuto` 중복 선언 — 구글 캘린더 "자동 동기화" 스위치 클릭이 노션 자동 전송 값(`!!settings.notionAutoPush`)으로 뒤집는다 ② `js/components.js` 의 `win.renderSettingsScreen()` 5곳은 전역에 그 함수가 없어 늘 건너뛴다 ③ index.html 마크업 `#btnOpenDynamicAlbum` 의 인라인 onclick 은 전역 `renderSettingsScreen` 을 찾는다(설정 히어로 카드가 그려지면 `.onclick` 으로 덮여 실제로는 안 쓰임).
- 기준 시험지(bb343d3 의 `scripts/smoke-test.js`)로 작업 커밋을 채점하면 index.html 한 파일에서 설정 코드 글자를 찾던 검사 13개가 깨진다(코드가 옮겨 갔으므로). 단언은 그대로이고 작업 커밋 시험지 합본에서는 통과한다. 주장 파일 `retire` 에 제목별 사유를 적었다 — 이 폐기는 판정서에 상민님 결심 사항으로 올라간다(승인선 ⑤ 규범·시험 기준 쪽). 시험 기대값을 낮춘 것은 없다.
- 측정은 게스트 시드·목 Supabase 화면이다. 로그인 사용자의 설정 화면(카카오·구글 계정 표시, 비밀번호 버튼 분기)은 같은 코드 경로지만 화면으로는 못 쟀다.

## 5. [원칙 ⑤] 절차

워크트리 `C:/dev/wt/core-07`(브랜치 `refactor/2026-10-04-task-es-354-settings-module`, origin/main bb343d3) → 기준 앱 `git archive bb343d3` → 기준 tab-check 2회(병렬) → 스코프 분석 → 생성기 → 글자 검사 2종 → `npm test` → 설정 조작 DOM 비교 → 이후 tab-check → tab-compare → 문서 → PR → 법정.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "getter 통로는 결국 전역 노출이고, 값 복사와 다를 바 없다." → 전역은 `OurgoalAppScope` 1개뿐이고 이름 52개는 스코프 분석이 뽑은 '옮긴 코드가 실제로 읽는 것'만이다. getter 라 값 복사가 아니라 읽을 때마다 IIFE 변수의 현재 값을 돌려준다(`state` 가 다시 대입돼도 따라간다). 호출 시 `this` 가 통로 객체가 되는 차이는 52개 이름 중 최상위 본문에서 `this` 를 쓰는 것이 0개라 동작에 영향이 없다(분석 결과 `bridgedThis: []`).
- 반론 2: "826줄 함수를 섹션 함수 6개로 나누면 지역 변수 공유가 끊겨 동작이 바뀐다." → 생성기가 렌더 함수의 지역 바인딩 102개 전부를 섹션별로 검사해 `settings` 말고는 두 섹션에 걸친 이름이 0 임을 확인했고(걸치면 생성 중단), `settings` 는 재대입이 없어 인자로 넘겨도 같은 객체다. 섹션 경계는 문을 가르지 않는다(검사). 옮긴 뒤 토큰열은 이전 전과 같다(`verify-equiv.js`: 8구간 모두 동일, 렌더 함수 6250 토큰).
- 반론 3: "전역에 안 다는데 다른 탭 코드가 `renderSettingsScreen` 을 계속 부를 수 있나?" → index.html 안 호출 9곳은 IIFE 맨 위 `var renderSettingsScreen = _settingsKit.renderSettingsScreen;` 으로 같은 스코프에서 해석된다(함수 선언 끌어올림과 같은 시점 — 이 줄보다 먼저 도는 문이 없다). 바깥 파일(`avatar-system.js`)은 인자로 받은 것을 쓰고, `components.js` 는 이전 전에도 못 찾던 전역을 찾는다(그대로).

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- DOM(옮긴 코드가 묶는 id, 마크업 그대로): `#settingsHeroCard`·`#btnSettingsQuickAvatar`·`#btnOpenDynamicAlbum`·`#homeLayoutOpenBtn`·`#btnOpenWidgetModal`·`#privGoalSelect`·`#privCalSelect`·`#privRecSelect`·`#privStatsSelect`·`#avatarGreetingSwitch`·`#onlineStatusSwitch`·`#setAccountEmail`·`#btnChangePassModal`·`#twoFactorSwitch`·`#logoutOtherDevicesBtn`·`#checkinTimesRow`·`#presetTimesBtn`·`#notifFeedbackModeGrid`·`#notifPrivacyToggle`·`#notifBgSwitch`·`#notifySwitch`·`#quietHoursSwitch`·`#themeGrid`·`#highContrastSwitch`·`#fontSizeToggle`·`#dataSaverSwitch`·`#gcalStatusBox`·`#gcalAutoSyncSwitch`·`#notionSwitch`·`#notionAutoPushSwitch`·`#itemStatsList`·`#geminiKeyInput`·`#autoUpdateSwitch`·`#clearCacheBtn`·`#formatToggle`·`#advancedSettingsAccordion`·`#addTimeBtn`·`#testNotifyBtn`·`#settingsExportCheckins`·`#settingsExportAll`·`#settingsImportAll`·`#importFile`.
- 함수: `renderSettingsScreen`·`renderSettingsHeroCard`·`collapseAllSettingsSections`·`toggleAdvancedSettings`·`formatStorageBytes`·`paintCacheUsage`·`bindSettingsHapticDelegate`·`bindSettingsStaticHandlers`·`renderProfileSection`·`renderSecuritySection`·`renderNotifySection`·`renderAppearanceSection`·`renderIntegrationsSection`·`renderDataSection`·`OurgoalAppScope.expose`·`OurgoalUiHelpers.*`.
- 파일: `index.html`, `js/core/app-scope.js`, `js/core/ui-helpers.js`, `js/tabs/settings/{render,sub-profile,sub-security,sub-notify,sub-appearance,sub-integrations,sub-data,index}.js`, `scripts/smoke-test.js`, `scripts/verify-all-clicks.js`, `docs/design/harness/module-split/{gen-settings,verify-equiv,verify-free,dom-compare-settings}.js`, `docs/specs/MODULE-SPLIT-PROTOCOL.md`.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

측정 파일: 효과 지표 `reports/TASK-ES-354/measure-effect.json`(스크립트 `measure-effect.js`), 6탭 `tab-check-base-bb343d3-run1.json`·`tab-check-after.json`·`tab-compare-*.json`·`tab-compare-summary.json`, 설정 조작 `dom-compare-settings.json`, 토큰 동일 `verify-equiv.json`.

| 항목 | 이전 전(bb343d3) | 이전 후 |
| :-- | --: | --: |
| index.html 줄 수 | 40,568 | 39,620 (−948) |
| index.html 의 `function renderSettingsScreen(` 정의 | 1 | 0 |
| 800줄 넘는 js/ 파일 수 | 12 | 12 (새 파일 중 넘는 것 0) |
| 새·바뀐 파일 줄 수 | — | app-scope 62 · ui-helpers 45 · render 257 · sub-profile 189 · sub-security 126 · sub-notify 254 · sub-appearance 122 · sub-integrations 296 · sub-data 127 · index.js 139 |
| 옮긴 함수 | — | 설정 6개(renderSettingsScreen 826줄 포함) + 정적 바인딩 7문(함수 2개로 감쌈) + 공용 헬퍼 3개 = 9함수 |
| 옮긴 구간 토큰 동일(L./U./K. 접두 제외) | — | 8구간 모두 동일(renderSettingsScreen+섹션 6250 토큰) |
| 옮긴 파일에 접두 없이 남은 IIFE 이름 / 노출 안 된 L.이름 | — | 0 / 0 (노출 52개 전부 사용) |
| tab-check 6탭 136장(테마 4 × 2해상도 × 상태) — 기준 1회차 대 2회차 | 2,520값 중 차이 0 | — |
| tab-check 기준 1회차·2회차 대 이전 후 | — | 2,520값 중 차이 0 / 0 |
| 콘솔 오류(136장 합) | 0 | 0 |
| 설정 조작 24단계 비교(화면 HTML·저장값·토스트·테마·클래스·활성 화면·전역 노출·새 오류) | — | 동작 차이 0 (구조 차이 48 = 소블록 수 3→6, 아무것도 그리지 않던 view:sync 구독 3개 없음 × 24단계) |
| 법정 시나리오 예비 실행(court/lib/scenario.js, 판정 아님) `settings-theme-contrast-same` | 통과 | 통과 |
| `npm test` | 0 (443·38/38·버튼 953/953) | 0 (443·38/38·버튼 953/953) |

- 본질적 변동: 같은 커밋 2회 실행 차이가 0 이라 tab-check 비교에서 뺀 항목은 없다. 설정 조작 비교에서는 실행마다 바뀌는 값(이 기기 등록 id·첫 로그인/마지막 활동 시각·ISO/ms 시각·마니또 seed·UUID·posthog 저장값·캐시 사용량 숫자)만 지우고 비교했다.
- 측정 환경: 로컬 정적 서버 + 헤드리스 Chrome + 게스트 시드 + Supabase 목(실서버·실계정 아님). 로그인 사용자 화면은 확인 못 함(주장 C9).
