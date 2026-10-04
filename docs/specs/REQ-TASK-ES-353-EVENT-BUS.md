# REQ — #TASK-ES-353 변경 이벤트 단일화·리스너 중복 방지 (CORE-04, HOME-18·GOALS-22 흡수)

- 근거: 노션 「아워골 UI/UX 대개편 작업 티켓 DB」 CORE-04(https://app.notion.com/p/3ef598db90968135ad67d4cc64f731aa), 흡수 HOME-18(https://app.notion.com/p/3ee598db909681e6b219d1acafa91f62)·GOALS-22(https://app.notion.com/p/3ee598db90968167a06feb70dc35a45a), `docs/specs/LEDGER-DESIGN-2026-10-04.md`(원장 설계, M26 은 CORE-04 로 넘김), 헌법 ARTICLE_11 11.1 Tri-Sync.
- **HOME-18·GOALS-22 는 이 PR 로 함께 완료된다(별도 PR 없음).** 두 티켓이 요구한 "이벤트 이름 1종(홈·목표 공유)·받는 쪽 자기 영역 1회 렌더·할 일 1회 체크당 목표탭 렌더 1회"를 여기서 처리했다. 다만 HOME-18 의 EXP 원장 이원화(`p.exp` / `settings.xp.total`)는 CORE-03 설계(LEDGER-DESIGN M01)의 실행 티켓 몫이고, "같은 계정 두 기기 반영"은 실계정 2기기가 필요해 확인 못 함으로 남긴다.
- 범위: `js/core/event-bus.js`·`js/core/registry.js`·`js/tabs/**`(6개 메가블록·18개 표준 소블록), 미정의 `renderCalendar` 호출이 있던 js 6개, `index.html` 최소 줄(아래 식별자). 설정·탈퇴·첫 체크인 축하 창 영역은 건드리지 않았다.

## 1. [원칙 ①] 문제 정확히 파악 — 지시 원문(요지)

1. event-bus 에 같은 (이벤트, 핸들러) 또는 같은 소유자 키 중복 등록 방지 + mount 시 이전 구독 해제(dispose).
2. 변경 이벤트 사전 1개(체크인·기록·목표·할일·일정·EXP·설정)를 문서와 상수로 정하고, 구독을 실제 발행 이름에 맞춘다. 발행 0 인 구독 제거.
3. 받는 쪽은 자기 영역만 1회 다시 그린다(같은 틱 중복 렌더 합치기).
4. 미정의 `renderCalendar` 호출을 실제 렌더 함수(`renderCalendarScreen`)로 바꾸거나 제거.
5. 마운트 성공 판정을 '실제로 그렸는가'로 — 빈 소블록이면 폴백 동작.
6. 측정: 헤드리스(`docs/design/harness/shots-lib.js` newPage) 계측으로 ① 기록·캘린더·설정 탭 각 10회 오간 뒤 체크인 1회 → 탭별 렌더 함수 호출 1회 ② 발행 0 인 구독 0 ③ renderCalendar 미정의 호출 0 ④ 체크인·할일 체크가 새로고침 없이 홈·목표·기록·캘린더에 반영. `npm test` 0.
7. 문서: REQ/PLAN, claims, TICKETS 1줄, dev_log. HOME-18·GOALS-22 함께 완료 명시. PR(초안 아님), 법정 판정 기록. 병합 안 함.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 한 번 바뀐 데이터가 "한 번, 맞는 곳에만" 다시 그려지지 않는다. 같은 변경에 같은 화면이 여러 번 그려지고(렌더마다 햅틱), 어떤 화면(설정)은 아예 다시 그려지지 않는다.
- **원인**: (가) `EventBus.on` 에 중복 방지가 없고, 소블록 `mount()` 가 탭 진입마다 `bindEvents()` 로 `ev.on` 을 다시 건다 → 기준 측정에서 탭 10회 왕복 뒤 구독 347개(그중 `view:sync` 123개). (나) 소블록이 발행처 없는 이름 23종(`record:deleted`·`timer:saved`·`goal:updated`·`theme:changed` 등)을 구독. (다) `dispatchFullViewPropagation` 이 직접 그린 뒤 `view:sync` 를 내면 구독자가 같은 렌더를 또 부른다. (라) 소블록 `mount()` 가 아무것도 못 그려도 `true` → 메가블록 폴백(`renderSettingsScreen`)이 막혀 설정 탭은 진입해도 다시 그려지지 않았다(설정 소블록 3개가 부르는 `renderProfileCard`·`updatePrivacyBadges`·`updateTwoFactorStatusUI` 는 `window` 에 없다 — 측정 `subBlockRenderersOnWindow`). (마) 렌더 안에서 햅틱: `applyTheme`(설정 저장마다 같은 테마로 재호출 → 햅틱 + 활성 탭 재렌더), `renderRecordsScreen` 안의 `setRecordsSegment`·`setRecordsSlide`.
- **중심**: `js/core/event-bus.js`(구독·발행·렌더 합치기)와 `dispatchFullViewPropagation`(index.html, 변경 후 유일한 전파기).
- **핵심**: 변경 이벤트 1종(`EVENTS.CHANGED = 'view:sync'`) + 소유자 키 구독(탭 재진입에도 1개) + 렌더 요청을 키(렌더 함수 이름)로 합쳐 전파 끝에서 1회 실행 + '실제로 그렸는가' 판정.

## 3. [원칙 ③] 해결방식

- `js/core/event-bus.js`: `on(event, handler, { owner })` — 같은 핸들러 재등록 무시, 같은 (이벤트, 소유자) 는 교체. `offOwner(owner)`(dispose), `subscriptions()`(계측), `requestRender(key, fn)`·`flushRenders()`(같은 틱 합치기 — 마이크로태스크 또는 전파기가 끝에서 동기 실행). `EVENTS` 를 실제 발행되는 이름으로만 재정의(`CHANGED`·`VIEW_SYNC`·`CHECKIN_CREATED`·`RECORD_SAVED`·`TAB_CHANGED`·`STATE_UPDATED`·`REGISTRY_READY`·`BLOCK_ERROR`) + `CHANGE_DICTIONARY`(checkin·record·goal·todo·schedule·exp·settings → `view:sync`).
- 소블록 18개(`js/tabs/*/sub-*.js`, `sub-onescreen.js` 제외): `mount` = `dispose()` → `render()`(그렸으면 `true`) → `bindEvents()`. 구독은 `'view:sync'` 1종, 소유자 키 `'<탭>/<소블록>'`, 핸들러는 `ev.requestRender('<렌더 함수 이름>', …)`. 홈 소블록 3개는 구독하지 않는다(`renderHome` 이 그 렌더 함수들을 이미 부르고, 전파기가 `renderHome` 을 1회 요청).
- 메가블록 6개(`js/tabs/*/index.js`): `block.mount(...) === true` 인 소블록만 세고, 0 이면 폴백. `lastMountDrew` 를 남기고, 레지스트리에 등록하는 마운트 래퍼는 그 값을 돌려준다. `mount()` 자체의 반환값(true)은 기존 시험(`scripts/test-*-blocks.js`)과 맞춰 그대로 둔다.
- `js/core/registry.js` `mount()`: 블록이 `false` 를 돌려주면 `false`(실패)로 알린다. `index.html` `setTab` 은 레지스트리 마운트가 `false` 면 레거시 렌더(`renderSettingsScreen` 등)로 폴백한다.
- `index.html` `dispatchFullViewPropagation`: 렌더를 `requestRender` 로 모으고 `view:sync`(payload 에 `reason`) 발행 뒤 `flushRenders()` → `OurgoalSanctuaryV3.render` 순. 미정의 `renderCalendar()` 호출 줄 삭제.
- 미정의 `renderCalendar` 호출 52곳(js/components.js 38·team-invite-comm.js 5·avatar-system.js 4·customize.js 2·records-stats.js 2·calendar-attachment.js 1) → `renderCalendarScreen`. index.html 1곳은 삭제(바로 위에서 `renderCalendarScreen` 을 이미 요청). 노션 "10곳"은 실측 53곳이었다.
- 햅틱: `applyTheme` 은 테마가 실제로 바뀔 때만 햅틱·활성 탭 재렌더, `setRecordsSegment(seg, silent)`·`setRecordsSlide(idx, silent)` 는 렌더 안 상태 복원 호출에서 `silent=true`.

## 4. [원칙 ④] 재검토 — 한계(정직하게)

- 설정 소블록 3개의 렌더 함수가 `window` 에 노출돼 있지 않아 설정 탭은 "변경 때"가 아니라 "진입 때" `renderSettingsScreen` 폴백으로 1회 다시 그려진다(숨은 탭이므로 화면상 차이 없음). 노출은 설정 영역(다른 세션 작업 중)이라 손대지 않았다.
- `renderSettingsScreen` 은 진입 때 섹션을 접고 햅틱 1회를 낸다 — 레지스트리 이전 경로(레거시)와 같은 동작이다.
- 할 일 체크(`[data-taskcheck]`)는 버스를 거치지 않고 직접 4개 화면을 그린다(이미 1회씩). 버스 경유로 바꾸지 않았다.
- HOME-18 의 EXP 원장 단일화·두 기기 동기화, 통계 화면 반영 촬영은 이 PR 범위 밖/확인 못 함.

## 5. [원칙 ⑤] 절차

워크트리 `C:/dev/wt/core-04`(브랜치 `feat/2026-10-04-task-es-353-event-bus`, origin/main 79462bd) → 기준 측정 → event-bus → 소블록·메가블록·레지스트리 → index.html 최소 줄 → renderCalendar 치환 → 후 측정 → `npm test` → 문서 → PR → 법정.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "렌더를 미루면(마이크로태스크) 전파 직후 DOM 을 읽는 코드가 깨진다." → 전파기가 끝에서 `flushRenders()` 를 동기로 불러 기존처럼 `dispatchFullViewPropagation()` 이 돌아올 때 화면이 그려져 있다. 마이크로태스크는 전파기 밖에서 `view:sync` 가 나는 경우의 안전망일 뿐이다(현재 제품 코드의 `view:sync` 발행처는 전파기 1곳).
- 반론 2: "mount 가 false 를 돌려주면 기존 시험이 깨진다." → 메가블록 `mount()` 반환은 그대로 true, '그렸는가'는 `lastMountDrew` 와 레지스트리 래퍼로만 전달. `scripts/test-*-blocks.js`·`test-core-modules.js`·`test-shipyard-modular.js` 기준판 전부 통과(로컬).
- 반론 3: "발행 0 인 구독을 지우면 나중에 그 이벤트를 쓰려던 기능이 빠진다." → 지운 23종은 제품 코드 어디에서도 발행하지 않았다(측정 `static.emitted`). 새 이벤트는 발행처와 함께 `EVENTS` 에 추가하도록 상수 주석에 적었다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- DOM: `#captureInput`·`#captureSave`(체크인), `.navbtn[data-tab]`, `#profileCard .profile-stats`, `[data-taskcheck]`, `#screen-home`·`#screen-goals`·`#screen-records`·`#screen-calendar`.
- 함수: `EventBus.on`·`offOwner`·`subscriptions`·`requestRender`·`flushRenders`, `EVENTS.CHANGED`·`CHANGE_DICTIONARY`, `BlockRegistry.mount`, 메가블록 `mount`·`lastMountDrew`, 소블록 `mount`·`dispose`·`render`·`bindEvents`, `dispatchFullViewPropagation`, `setTab`, `applyTheme`, `setRecordsSegment`·`setRecordsSlide`, `renderCalendarScreen`.
- 파일: `js/core/event-bus.js`, `js/core/registry.js`, `js/tabs/{home,goals,calendar,records,comm,settings}/index.js`·`sub-*.js`, `index.html`, `js/components.js`·`js/team-invite-comm.js`·`js/avatar-system.js`·`js/customize.js`·`js/records-stats.js`·`js/calendar-attachment.js`.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

도구 `reports/TASK-ES-353/measure-event-bus.js`(로컬 서버 + 헤드리스 Chrome + 게스트 시드 + Supabase 목, 서버가 내주는 index.html 에만 렌더 함수 호출 카운터를 끼움). 결과 `measure-base-origin-main.json`(origin/main) · `measure-result.json`(이 브랜치).

| 항목 | origin/main | 이 브랜치 |
| :-- | --: | --: |
| 기록·캘린더·설정·목표 탭 각 10회 오간 뒤 구독 수(전체 / view:sync) | 347 / 123 | 12 / 12 |
| 그 뒤 체크인 1회: renderRecordsScreen | 11 | 1 |
| 〃 renderCalendarScreen | 11 | 1 |
| 〃 renderGoalsScreen | 20 | 1 |
| 〃 renderHome | 1 | 1 |
| 〃 triggerHaptic | 52 | 5 |
| 할 일 1회 체크: renderGoalsScreen / triggerHaptic | 6 / 10 | 1 / 2 |
| 설정 탭 10회 진입: renderSettingsScreen | 0 | 10 |
| 발행 0 인 구독 이름(정적) / 이번 세션 한 번도 발행 안 된 구독(런타임) | 23 / 17 | 0 / 0 |
| 미정의 renderCalendar 호출(주석 제외) | 53 | 0 |
| 체크인 후 DOM 변화 홈·목표·기록·캘린더 | 변함·그대로·변함(글 포함)·그대로 | 변함·그대로·변함(글 포함)·그대로 |
| 할 일 체크 후 DOM 변화 홈·목표·기록·캘린더 | 4곳 모두 변함 | 4곳 모두 변함 |
| 콘솔 오류 | 0 | 0 |

- 체크인 뒤 목표·캘린더 DOM 이 그대로인 것은 렌더는 1회씩 됐으나(위 표) 그 화면이 이 체크인(목표 미연결)과 관계된 값을 보여 주지 않기 때문이다(캘린더 월 격자는 기록이 아니라 일정을 그린다).
- 화면 동작(법정 시나리오) `reports/TASK-ES-353/scenarios/settings-stats-after-checkin.json`: 체크인 후 설정 탭 프로필 카드 "총 기록" — 기준 0(13단계 실패), 이 브랜치 1(court 시나리오 엔진으로 로컬 예비 실행, 판정 아님).
- `npm test` 종료코드 0.
