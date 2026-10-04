# 단일 원장 설계서 (CORE-03) — 사용자 데이터 저장 위치 지도와 통일안

> **작업번호**: #TASK-ES-350 · **티켓**: 노션 「아워골 UI/UX 대개편 작업 티켓 DB」 CORE-03(작업순서 130)
> **기준 커밋**: origin/main 13dd59a (#654 record-ledger · #655 · #656 · #658 · #659 병합 반영)
> **성격**: 설계·측정·문서만. 앱 코드 수정 0줄, SQL 파일 0개(부록에 초안만), 운영 서버 조회 0회(코드 읽기로만).
> **따라 갈 티켓**: GOALS-03 · CAL-01 · SET-05 · HOME-14 · HOME-19 잔여 · REC-01 잔여

## 0. 한 줄 결론

사용자 데이터는 지금 **서버 표 3개(users·goals·checkins) + events 표 원장 2종(settings_ledger·companion_ledger) + 기기 localStorage 수십 개 키**에 흩어져 있고, 같은 값이 두세 곳에 따로 저장되어 서로 다른 화면이 서로 다른 곳을 읽는다. 해법은 **항목마다 정본 1곳(서버)·읽기/쓰기 함수 1쌍·값당 칸 1개**로 묶고, localStorage 는 "정본의 캐시"로만 남기는 것이다. 새 서버 저장 장소는 표 1개(`user_ledger_docs`, 사용자별 문서 저장)와 goals 칸 2개로 끝낸다.

## 1. 현재 지도 (코드 읽기 결과)

열 설명: **서버 왕복** = 저장 후 다른 기기·localStorage 삭제 뒤에도 서버에서 돌아오는가(있음 / 일부 / 쓰기만 / 없음). **중복 저장** = 같은 값이 독립적으로 읽히는 저장 위치가 2곳 이상인가.
공통 사실: `saveProfile()`(index.html:5049)은 매번 `state.profile` 전체를 `ourgoal_guest_profile` 에도 쓴다(index.html:5107 — 로그인 사용자 포함). 이 "전체 사본"은 모든 항목에 공통이라 아래 표의 중복 판정에서는 빼고 1-3절에 따로 적는다.

| ID | 항목 | 저장 위치(현재) | 쓰는 함수 | 읽는 함수 | 서버 왕복 | 중복 저장 |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| M01 | EXP | `settings.xp.total`·`settings.xp.log` → `ourgoal_settings_<id>` | `awardXP`(index.html:2981), `triggerFirstCheckinCelebrationModal`(:7378, `awardXP` 를 거치지 않고 +5, 로그 없음) | `levelProgress` 호출부(:3067·:3115·:9096·:38549 등), 홈 `expProgressPct`(js/tabs/home/sub-onescreen.js, #652 로 `p.exp` → `settings.xp.total`) | 없음 | 아니오 |
| M02 | 레벨 | 저장 안 함 — `levelForXP(settings.xp.total)` 파생. 남의 레벨은 `user.level`(없으면 1)(js/team-invite-comm.js:2320·2532 등) 인데 users 표에 level 칸이 없어 늘 1 | — | `badgeContext`(:3392), `updateTopBar`, 아바타 설정창, 동반자 목록(타인) | 없음 | 아니오 |
| M03 | 체크인·기록 | `checkins` 표(+`meta` jsonb, #654) · `profile.records` · `ourgoal_records_backup_<id>` · 템플릿 기록의 칸·행·메모·사진은 `settings.proTemplateRecords[recId]`(:32778)에도 | `saveQuickCheckin`→`saveProfile`→`OurgoalRecordLedger.upsertCheckinRows`, `migrateGuestDataToUser`(:6081, `toCheckinRow` 를 거치지 않아 meta 빠짐) | `loadProfile`(:3519), `syncServerRecords`→`mergeServerRecords`, 기록·홈·통계 화면 | 있음 | 예 |
| M04 | 목표·마일스톤·할일 | `goals` 표(`milestones` jsonb 안에 `tasks`) · `profile.goals` · `ourgoal_goals_backup_<id>` | `saveProfile`(:5113 upsert), `moveToTrash`(:9393 soft delete) | `loadProfile`(:3524), 목표·홈·캘린더 화면 | 있음 | 아니오 |
| M05 | 목표 D-day(마감일) | 목표 `dueDate` ↔ `goals.due_date` · 마일스톤 `dueDate`(milestones jsonb). 읽는 쪽 이름이 둘: `dueDate`(index.html 101곳) vs `deadline`(:24886 목표·:24911 마일스톤 — 아무도 쓰지 않는 칸이라 '목표만' 보기 D-day 가 늘 빈칸) | 목표 편집·생성(`goal-edit-ux.js` 등) | `ddayMini(g.deadline)`(:24886) · 그 외 `g.dueDate` | 있음 | 예 |
| M06 | 목표 시작일 | `goal.startDate`(:22093) — `goals` 표에 칸이 없어 upsert 에 안 실림 | 캘린더 목표 기간 편집(:22093) | 기간 편집 창(:21962) | 없음 | 아니오 |
| M07 | 루틴 | `settings.routines`(정본처럼 쓰임) · 읽는 쪽 하나는 `state.profile.routines`(없으면 `state.routines`)(:24037 `renderRoutineMatrixGrid` — 쓰는 곳 0, 늘 빈 목록) · 교대근무 `settings.shiftSettings` 를 `profile.shiftSettings` 에 다시 복사(:22245·:22503) | `openAddRoutineModal`(:23169), `applyShiftWorkRoutines`(:22212), 템플릿 도감(:23810), `renderRoutineGoalsScreen`(빈 경우 예시 3개 자동 삽입 :22485) | `renderRoutineGoalsScreen`(:22480), `renderRoutineMatrixGrid`(:24034) | 없음 | 예 |
| M08 | 직접 추가 일정 | `settings.customSchedules` → `ourgoal_settings_<id>` (첨부 사진 포함, js/calendar-attachment.js) | 캘린더 일정 추가·편집(index.html 59곳), `moveToTrash`(:9396) | 캘린더·홈·`notify-engine.js`(:361)·`sanctuary-v3-engine.js` | 없음 | 아니오 |
| M09 | 일정 배경사진 | `profile.calendarDayBackgrounds` → `ourgoal_cal_day_bg_<id>`(:5109) · 복원 때 `ourgoal_profile_backup_<id>.calendarDayBackgrounds` 도 읽음(:3769, 쓰는 곳 없음) | `openCalendarDayBgPickerModal`(:10719), `saveProfile` | `calCellHtml`(:10393), `loadProfile` | 없음 | 예 |
| M10 | 구글 일정 완료 표시 | `settings.gcalDoneEvents` | `toggleScheduleDone`(:10626), 할일 선택지(:11534) | 캘린더(:9771·:10312) | 없음 | 아니오 |
| M11 | 팀 일정 완료 표시 | `settings.teamGoalDoneEvents` + `ourgoal_team_goal_done_events`(:10636) | `toggleScheduleDone` | 캘린더(:10343·:10363) | 없음 | 예 |
| M12 | 설정 전반(알림·조용한 시간·공개범위 기본값·글자 크기·체크인 시각·AI 공급자 등) | `ourgoal_settings_<id>` 하나 | `saveLocalSettings`(:2924), `saveProfile` 끝(:5150) | `loadLocalSettings`(:2910), `applyAppSettings` | 없음 | 아니오 |
| M13 | 구글 캘린더 연동 값 3개(연결 여부·이메일·client id) | `settings` + `events` 표 `name='settings_ledger'` 행 추가(append-only, api/track.js:149) | `syncServerRecords` 의 `settingsToSave`(:5196) | `syncServerRecords` 응답 처리(:5210) | 있음 | 예 |
| M14 | 동반자 | `users.companions` · `events` 표 `companion_ledger`(api/track.js:360) · `ourgoal_companions_backup_<id>` · `settings.companions`(team-leader-check.js:594 가 씀, index.html:15666·team-invite-comm.js:762 가 읽음) | `persistCompanions`(team-invite-comm.js), `team-leader-check.js` | `loadProfile`(로컬 백업만, :3757), `syncCompanionsFromDb`(서버와 합집합 병합), `redrawStoryCard` | 있음 | 예 |
| M15 | 홈 구성 | `settings.homeLayout = {hidden, version}` | `OurgoalCustomize`(js/customize.js:151·207) | js/customize.js:99 | 없음 | 아니오 |
| M16 | 테마 | `settings.theme` · `ourgoal_current_theme`(부팅용) · `ourgoal_theme`·`theme`(js/sanctuary-v3-engine.js:1380 — 쓰기만, 읽는 곳 0) | `applyTheme`(:2702), `renderSettingsScreen`(:39125), components.js:2651, sanctuary-v3-engine.js:1380 | 부팅(:2350), `applyAppSettings`(:2717), 설정 화면(:39106) | 없음 | 예 |
| M17 | 앱 잠금 PIN(#658) | `settings.twoFactorPin`(`sha256v1$소금$hex`)·`settings.twoFactorAuth` — 이 기기 전용이 설계 의도. 단 `ourgoal_guest_profile` 전체 사본과 전체 백업 JSON(:39521 `JSON.stringify(state.profile)`)에 함께 들어감 | `openTwoFactorSetupModal`, `verifyAppLockPin`(:4003) | `verifyAppLockPin`, 보안 카드 | 없음 | 아니오 |
| M18 | 프로필 기본(닉네임·소개·사진) | `users.display_name·bio·avatar_url` · `ourgoal_profile_backup_<id>` · 사진은 `settings.customAvatarUrl`·`settings.avatarType` 에도 | 프로필 편집 `#pvSave`(:9051), `saveProfile` users upsert(:5078) | `loadProfile`(서버 우선, 비면 로컬 백업), `updateTopBar` | 있음 | 예 |
| M19 | 프로필 · 잇템 | `profile.itItems` · `settings.itItems` · `ourgoal_profile_backup_<id>.itItems` — users 표에 칸 없음 | `#pvSave`(:9061·:9067) | `loadProfile`(:3633 로컬 백업에서만) | 없음 | 예 |
| M20 | 프로필 · 관심 | `users.interests` · `profile.interests` · `settings.interests` · 로컬 백업 | `#pvSave`, `saveProfile` | `loadProfile`, `syncServerRecords`(비었을 때만 서버값) | 있음 | 예 |
| M21 | 프로필 · 지역(내 동네 시/도·시군구) | `users.region` · `settings.region` · 로컬 백업 | `#pvSave`, `saveProfile` | `loadProfile`, `syncServerRecords` | 있음 | 예 |
| M22 | 프로필 · 동네 공개 여부 | `users.region_public` · `settings.regionPublic` · 로컬 백업 | `#pvSave`, `saveProfile` | `loadProfile`, `syncServerRecords`(:5254 서버값으로 덮음) | 있음 | 예 |
| M23 | 아바타 보관함 | `users.saved_avatars` · `settings.savedAvatars` · `ourgoal_saved_avatars_backup_<id>` | `saveProfile`(:5073), 아바타 제작 | `loadProfile`(:3654 합집합, 최대 10) | 있음 | 예 |
| M24 | 수호동물 | `profile.guardianAnimal` · `settings.guardianAnimal`(:5059 복사) — 로드 때 settings 에서 profile 로 되돌리는 코드를 찾지 못함 | 수호동물 선택(:7189) | 홈 아바타(sub-onescreen.js:267) | 없음 | 예 |
| M25 | 휴지통 | `users.trash` · `ourgoal_trash_backup_<id>` — `loadProfile` 이 `finalTrash`(:3761)를 계산하고 반환하지 않음, `getTrashList`(:9341)는 로컬만 읽음, `saveProfile` 은 `state.profile.trash`(없으면 빈 배열) 를 보냄 | `moveToTrash`, `saveProfile` | `getTrashList` | 쓰기만 | 예 |
| M26 | 설정 안의 소통·미션 상태(`feedReactions`·`feedComments`·`myFeedPosts`·`contentReports`·`todayMissions`·`challenges`·`streakFreeze`·`goalStatusSummaries`) | `ourgoal_settings_<id>` | 각 화면 | 각 화면 | 없음 | 아니오 |
| M27 | AI 피드백 저장 프리셋·모드 | `ourgoal_saved_fb_presets_<id>`(:17403) · `ourgoal_ai_feedback_mode`(:16797, 계정 구분 없음) | AI 피드백 창 | AI 피드백 창 | 없음 | 아니오 |
| M28 | 외부 서비스 키(Gemini·노션 키·웹훅·DB id) | `settings.geminiKey`·`notionApiKey`·`notionWebhookUrl`·`notionDatabaseId` — 전체 백업 JSON 과 `ourgoal_guest_profile` 에 평문으로 함께 들어감 | 설정 화면 | AI 호출(:17103), 노션 연동 | 없음 | 아니오 |
| M29 | 오프라인 대기열 | `ourgoal_offline_sync_queue` — `enqueue`(:16499) 후 `enterApp` 의 `OfflineSyncManager.flush()`(:6985)가 처리기 없이 불려 대기열을 그냥 비움 | `updateLiveThemeBadge`(:16499) | `flush` | 없음 | 아니오 |

### 1-1. 집계 (표에서 스크립트로 셈)

집계는 위 표의 "서버 왕복"·"중복 저장" 열을 `reports/TASK-ES-350/count-ledger-map.js` 가 세어 낸 값이다(손으로 옮기지 않음).

| 구분 | 수 |
| :-- | :-- |
| 항목 | 29 |
| 중복 저장 '예' | 16 |
| 로컬 전용(서버 왕복 '없음') | 18 |
| 서버 왕복 '있음' | 10 |
| 서버 왕복 '쓰기만'(서버에 쓰지만 읽어 오지 않음) | 1 |

로컬 전용 18개: M01·M02(파생, 바탕인 EXP 가 로컬)·M06·M07·M08·M09·M10·M11·M12·M15·M16·M17·M19·M24·M26·M27·M28·M29. 중복 16개: M03·M05·M07·M09·M11·M13·M14·M16·M18~M25.

### 1-2. 이번 조사에서 새로 확인한 결함(코드 읽기, 실측 아님)

1. **휴지통 서버값 무시·덮어쓰기 위험(M25)** — `loadProfile` 이 `users.trash` 를 읽어 `finalTrash` 를 만들고 버린다. 이후 `getTrashList` 가 불리기 전에 `saveProfile` 이 돌면 `trash: []` 로 서버 휴지통을 비운다(추정 — 호출 순서에 달림).
2. **목표만 보기 D-day 늘 빈칸(M05)** — `g.deadline`·`m.deadline` 은 쓰는 곳이 0이다.
3. **루틴 매트릭스 늘 빈 목록(M07)** — `state.profile.routines` 는 쓰는 곳이 0이다.
4. **목표 시작일 서버 미저장(M06)** — goals upsert 객체에 `start_date` 가 없다.
5. **게스트→회원 이전 시 기록 meta 누락(M03)** — `migrateGuestDataToUser` 의 checkins upsert 가 `toCheckinRow` 를 쓰지 않는다(뒤이은 `saveProfile` 이 다시 올려 메우지만 순서 의존).
6. **오프라인 대기열 무처리 삭제(M29)** — `flush()` 에 처리기가 없다.
7. **수호동물 리로드 후 복원 경로 없음(M24)** — 로그인 사용자 기준(추정, 화면 미확인).
8. **비밀값 사본(M17·M28)** — 전체 백업 JSON 과 `ourgoal_guest_profile` 에 외부 키·PIN 해시가 들어간다(SET-05 의 '추정'을 코드로 확인: index.html:39521).
9. **남의 레벨 늘 Lv.1(M02)** — 서버에 레벨이 없어 `user.level`(없으면 1) 이 가짜 1을 보인다(CORE-06 가짜 값 계열).

### 1-3. 항목 밖 공통 사본·기기 전용 키

- **전체 사본 `ourgoal_guest_profile`**: `saveProfile`·`#pvSave`·`syncServerRecords` 가 로그인 사용자의 전체 profile 을 쓴다. 게스트 이전(`migrateGuestDataToUser`)만 이 키를 읽어야 한다.
- **기기 전용으로 남길 키(이전 대상 아님)**: `ourgoal_gcal_token_v1_<uid>`·`ourgoal_gcal_events_<uid>`(#655 계정 격리), `ourgoal_device_id`·`ourgoal_registered_devices_<uid>`, `ourgoal_lockscreen_*`, `ourgoal_home_sheet`·`ourgoal_radar_collapsed`·`ourgoal_uStats_expanded`(접힘 상태), `ourgoal_notified_scheds`, `ourgoal_dm_read_*`, `ourgoal_vision_quota_*`, `ourgoal_attrib`·`ourgoal_sid`·`ourgoal_lv_day`(계측), `ourgoal_ux_mode`.

## 2. 목표 설계

### 2-1. 원칙

1. **정본은 서버 1곳(Server-First, 헌법 ARTICLE_15)**. localStorage 는 정본의 캐시이며, 캐시만 있고 서버에 없는 값은 "아직 못 올린 변경"(대기열)으로만 존재한다.
2. **값당 칸 하나**. 같은 값을 profile·settings·백업 키에 나눠 담지 않는다. 화면은 칸을 직접 읽지 않고 2-3절의 함수만 부른다.
3. **문서 단위 저장**. 표를 항목마다 새로 만들지 않고 `user_ledger_docs(user_id, doc_key, data, rev, updated_at)` 하나에 문서로 담는다(부록 A). 목표·기록·프로필처럼 이미 표가 있는 것은 그 표가 정본이다.
4. **새 개인정보 칸 0**. 지금 서버에 없는 사용자 작성 내용(일정·배경사진·잇템 등)을 서버로 올리는 것은 "서버 보관 범위 확대"라 3절 [결심 필요] 후보로 묶는다. 외부 서비스 키·PIN·구글 토큰은 서버로 옮기지 않는다.

### 2-2. 항목별 정본 1곳

| ID | 항목 | 정본(목표) | 캐시(localStorage) | 없애는 칸 |
| :-- | :-- | :-- | :-- | :-- |
| M01 | EXP | `user_ledger_docs['xp']` = `{total, log[최근 200]}` | `ourgoal_ledger_cache_<uid>` | `profile.exp`(읽기 흔적), `settings.xp` |
| M02 | 레벨 | 저장 안 함 — `levelForXP(xp.total)` 파생 하나 | — | 타인 `user.level`(없으면 1) 표시(공개 여부는 결심 후보 K4) |
| M03 | 기록 | `checkins`(+meta) — 템플릿 칸·행·메모는 meta 로 | `ourgoal_records_backup_<uid>` | `settings.proTemplateRecords` |
| M04 | 목표·마일스톤·할일 | `goals`(milestones jsonb) + `updated_at` | `ourgoal_goals_backup_<uid>` | — |
| M05 | D-day | `goals.due_date` ↔ `dueDate` 하나 | — | `deadline`(읽는 2곳) |
| M06 | 목표 시작일 | `goals.start_date`(새 칸, 부록 A) | — | — |
| M07 | 루틴 | `user_ledger_docs['routines']` = `{items[], shift}` | 캐시 | `profile.routines`·`state.routines`·`profile.shiftSettings` |
| M08 | 직접 추가 일정 | `user_ledger_docs['schedules']`(결심 K1) | 캐시 | `settings.customSchedules` |
| M09 | 배경사진 | `user_ledger_docs['calendar_bg']`(결심 K1·K3) | 캐시 | `ourgoal_cal_day_bg_<uid>`, 백업 안 `calendarDayBackgrounds` |
| M10 | 구글 일정 완료 | `user_ledger_docs['gcal_done']`(결심 K1) | 캐시 | `settings.gcalDoneEvents` |
| M11 | 팀 일정 완료 | `user_ledger_docs['team_goal_done']` | 캐시 | `ourgoal_team_goal_done_events`, `settings.teamGoalDoneEvents` |
| M12 | 설정 전반 | `user_ledger_docs['prefs']` — 허용 목록(부록 B)만 | 캐시 | `ourgoal_settings_<id>` 는 기기 전용 값만 남김 |
| M13 | 구글 연동 3값 | `prefs` 안 3칸 | 캐시 | `events.settings_ledger` 쓰기(읽기는 이전 1회만) |
| M14 | 동반자 | `users.companions` | `ourgoal_companions_backup_<uid>` | `settings.companions`, `events.companion_ledger` 쓰기 |
| M15 | 홈 구성 | `prefs.homeLayout` | 캐시 | `settings.homeLayout` |
| M16 | 테마 | `prefs.theme` | `ourgoal_current_theme`(부팅 깜빡임 방지 캐시 1개) | `ourgoal_theme`, `theme` |
| M17 | 앱 잠금 PIN | **이 기기 `ourgoal_settings_<id>` 그대로**(기기 잠금이라 서버로 안 옮김) | — | 전체 백업 JSON·게스트 사본에서 제외 |
| M18 | 프로필 기본 | `users.display_name·bio·avatar_url` + `prefs.avatarType` | 로컬 백업 | `settings.customAvatarUrl` 은 `avatar_url` 과 하나로 |
| M19 | 잇템 | 결심 K2 전에는 **로컬 유지**, 승인 시 `users.it_items` | 로컬 백업 | `settings.itItems` |
| M20~M22 | 관심·지역·동네 공개 | `users.interests`·`region`·`region_public` | 로컬 백업 | `settings.interests`·`region`·`regionPublic` |
| M23 | 아바타 보관함 | `users.saved_avatars` | 로컬 백업 | `settings.savedAvatars` |
| M24 | 수호동물 | `prefs.guardianAnimal` | 캐시 | `profile.guardianAnimal` 사본 |
| M25 | 휴지통 | `users.trash` | `ourgoal_trash_backup_<uid>` | — (`loadProfile` 반환에 `trash` 연결) |
| M26 | 소통·미션 상태 | 이번 범위 밖 — CORE-04·COMM 티켓에서 서버 표(feed 계열) 정본 여부 결정 | — | — |
| M27 | AI 피드백 프리셋 | `prefs.feedbackPresets`·`prefs.feedbackMode` | 캐시 | `ourgoal_saved_fb_presets_<id>`, `ourgoal_ai_feedback_mode` |
| M28 | 외부 서비스 키 | **이 기기만**. 서버로 안 옮김, 백업 JSON·게스트 사본에서 제외 | — | — |
| M29 | 오프라인 대기열 | `user-ledger` 의 대기열 하나(`ourgoal_ledger_pending_<uid>`) | — | `ourgoal_offline_sync_queue` |

### 2-3. 단일 읽기/쓰기 함수 (js/record-ledger.js 패턴 확장 제안)

`js/record-ledger.js` 처럼 브라우저(`window.OurgoalUserLedger`)와 서버(`api/track.js` require)가 같은 규칙을 쓰는 순수 함수 모듈 `js/user-ledger.js` 를 둔다(800줄 상한 안, 화면 코드 없음).

| 함수 | 하는 일 |
| :-- | :-- |
| `readDoc(key)` | 캐시에서 즉시 반환(없으면 기본값). 화면은 이것만 읽는다 |
| `writeDoc(key, data)` | 캐시에 쓰고 `rev+1`·`updatedAt`·`deviceId` 를 붙여 대기열에 넣은 뒤 `pushPending()` |
| `pushPending()` | 대기열을 `/api/track` `action:'sync_ledger'`(본인 토큰 검사 — `sync_records` 와 같은 `authenticateCaller`)로 보낸다. 실패하면 대기열 유지 + 사용자에게 "저장 실패, 다시 시도" 알림(CORE-03 티켓 '기능 동작') |
| `pullAll(uid)` | 서버 문서 전부를 받아 `mergeDoc` 으로 캐시와 합친다. `loadProfile` 끝에서 1회 |
| `mergeDoc(key, local, server)` | 2-5절 충돌 규칙 |
| `mergeItems(localItems, serverItems, tombstones)` | id 기준 항목 병합(일정·루틴·동반자). `mergeServerRecords` 와 같은 규칙: 지운 id 는 되살리지 않음 |
| `stripSecrets(profile)` | 전체 백업·게스트 사본용 — 부록 B 의 금지 목록 키를 뺀 사본 |
| 도메인 함수 | `getXp()`/`addXp(n, reason)`(→ `awardXP` 가 호출), `getRoutines()`/`saveRoutines()`, `getSchedules()`/`saveSchedules()`, `getPrefs()`/`setPref(k, v)`, `getGoalDueDate(goal)`(유일한 D-day 읽기) |

기존 `saveProfile`·`saveLocalSettings` 는 그대로 두되, 옮겨 간 항목은 이 함수들만 부르게 바꾸고 `saveLocalSettings` 는 기기 전용 키만 쓰게 좁힌다(탭 티켓별 단계 이전 — 4절).

### 2-4. 값당 칸 하나 — 통일안 요약

1. **EXP**: `xp` 문서 하나(`total`·`log`). 모든 가감은 `addXp` 경유(첫 체크인 +5 포함). 레벨은 `levelForXP` 파생만, 어디에도 저장하지 않는다.
2. **루틴**: `routines` 문서 하나. `renderRoutineMatrixGrid`·`renderRoutineGoalsScreen` 모두 `getRoutines()`. 빈 경우 예시 3개 자동 삽입은 저장하지 않고 "예시" 표시로만(가짜 데이터 금지, CORE-06).
3. **D-day**: 목표·마일스톤 모두 `dueDate` 하나(서버 `due_date`·milestones jsonb `dueDate`). `deadline` 읽기 2곳은 `getGoalDueDate` 로. 시작일은 `goals.start_date`.
4. **설정**: `prefs` 문서 하나(허용 목록). 구글 3값·홈 구성·테마·수호동물·AI 프리셋 포함. `ourgoal_settings_<id>` 는 기기 전용(PIN·외부 키·기기 상태)만.
5. **프로필 4종·동반자·보관함**: users 표 칸이 정본, `settings.*` 사본과 events 원장 쓰기는 없앤다.

### 2-5. 충돌 해결 규칙

- **문서(prefs·xp 등)**: 칸 단위 최신 우선. 각 칸에 `updatedAt` 을 두고(문서 안 `_ts` 맵), 서버와 캐시 중 더 늦은 값을 쓴다. 같은 시각이면 서버 우선.
- **EXP**: 최신 우선이 아니라 **로그 합집합**(log 항목 id 기준) → `total` 은 로그 합으로 다시 계산. 두 기기에서 동시에 얻은 EXP 가 사라지지 않게 한다. 로그가 200개를 넘으면 잘린 앞부분의 합을 `baseTotal` 로 보존.
- **목록(일정·루틴·동반자)**: id 기준 `mergeItems`. 항목마다 `updatedAt`, 지운 항목은 `tombstones[id] = deletedAt`(30일 보존). 지운 항목은 다른 기기의 묵은 사본으로 되살아나지 않는다(REC-01 과 같은 규칙).
- **덮어쓰기 전 백업**: 서버가 문서를 바꿀 때 직전 판을 `user_ledger_docs_history` 에 1판 남긴다(부록 A, 7일 보관).
- **기기 시계 오차**: `updatedAt` 비교는 서버가 받은 시각(`updated_at default now()`)을 기준으로 하고, 클라이언트 시각은 같은 기기 안 순서에만 쓴다.

### 2-6. 로컬 → 서버 이전 절차와 백업

1. **서버 백업(상민님 `[손 필요]`, SQL Editor)**: 부록 A 의 `*_backup_20261004` 표 복사(users·goals·checkins). 비파괴(`create table if not exists ... as table`).
2. **기기 백업**: 이전 직전 `ourgoal_ledger_premigration_<uid>` 에 `ourgoal_settings_<uid>`·백업 키 원문을 그대로 복사(30일 뒤 정리).
3. **1회 이전**: 로그인 직후 `pullAll` 결과에 해당 문서가 없고 로컬에 값이 있으면 로컬 값을 `writeDoc` 으로 올린다. 서버에 이미 있으면 2-5절 규칙으로 합친다(덮어쓰기 금지). 이전 완료 표시는 `prefs._migratedAt`.
4. **이전 확인**: 이전 전후 항목 수(일정 n개·루틴 n개·EXP total)를 같은 화면 이벤트로 남기고(`track('ledger_migrated', {counts})`, 내용 없이 수만), 다르면 이전을 되돌리고 대기열 유지.
5. **사본 정리**: 이전이 확인된 뒤에만 2-2절 "없애는 칸"을 쓰지 않게 한다. 읽기는 한 판 동안 폴백으로 남긴다(기존 방어 코드 보존 — step 0 원칙).

## 3. [결심 필요] 후보 (이 설계서는 결정하지 않음 — 승인선 ②·①)

| 번호 | 안건 | 권장 | 이유 |
| :-- | :-- | :-- | :-- |
| K1 | 일정 내용·구글 일정 완료 표시를 **서버에 새로 보관**(지금은 기기에만 있음) | 승인 | CAL-01 의 목표 자체. 이미 사용자가 앱에 쓴 내용이고 본인만 읽는 표(RLS·토큰 검사). 구글 일정 원문은 올리지 않고 완료 표시(id→참/거짓)만 |
| K2 | 잇템(이름·구매 링크·광고 표시)을 `users.it_items` 로 **서버 보관** | 보류 | 프로필 공개 화면과 묶여 다른 사람에게 보이는지 정책이 먼저(COMM-09). 그때까지 로컬 유지 |
| K3 | 일정 배경사진·일정 첨부 사진을 서버에 저장 — jsonb 에 data URL 로 넣으면 표가 커지고, Supabase Storage 를 쓰면 **저장 비용** 발생 가능 | 사진만 Storage, 승인 전에는 로컬 유지 | 돈(①)·개인 사진 보관(②) 두 선 모두 걸림 |
| K4 | 레벨을 다른 사람에게 보이게 할지(서버 공개 칸 추가) | 보이지 않게(타인 레벨 표시 제거) | 새 공개 칸이 필요하고, 지금 표시는 가짜 Lv.1 |
| K5 | 외부 서비스 키·PIN | 서버로 옮기지 않음(결정 불필요, 확인용) | SET-05 TO-BE 와 같음 |

## 4. 수명주기 4단계 공통 검사 설계 (구현은 탭 티켓에서)

**하네스**: `docs/design/harness/lifecycle-check.js`(새 파일, 탭 티켓 첫 PR 에서 구현). `shots-lib.js` 의 `newPage` 를 재사용하되, 지금의 Supabase 목(늘 빈 응답·로그인 실패)을 **상태가 있는 목**으로 바꾼다:

- 표 데이터는 Node 프로세스 메모리(`Map<table, rows>`)에 두고 `page.exposeFunction('__ledgerDb', ...)` 로 연결 → `localStorage.clear()`·`page.reload()` 를 해도 "서버"는 남는다.
- `auth.getSession()` 이 고정 uid(`00000000-0000-4000-8000-0000000000a1`)의 세션을 돌려주는 로그인 모드와 게스트 모드 두 가지.
- `/api/track` 은 `page.setRequestInterception` 으로 같은 메모리 표를 읽고 쓰는 처리기로 응답(`sync_records`·`sync_companions`·`sync_ledger`).

**공통 절차(항목마다 같은 함수 `runLifecycle(item)`)**:
1. 생성 — 화면 조작으로 값을 만든다(`item.create(page)`).
2. 파기 — `localStorage.clear(); sessionStorage.clear()` (IndexedDB 는 쓰지 않음 확인).
3. 리로드 — `page.reload()` 후 앱 진입 완료(`state.profile` 존재)까지 대기.
4. 복원 — `item.read(page)` 로 `readDoc`/화면 값을 읽어 1단계 직후 값과 `assert.deepStrictEqual`. 출력은 항목별 `{id, created, restored, equal}` JSON(`out-lifecycle-<날짜>.json`).

**항목별 시나리오**:

| 시나리오 | 대상 | 1단계 생성 | 4단계 비교 값 |
| :-- | :-- | :-- | :-- |
| L01 | M01 EXP | 체크인 2회 | `getXp().total`(=20)·log 길이 2 |
| L02 | M03 기록 | 시간 기록(구간 2개·목표 연결) 1건 | 기록 객체의 META 7칸 |
| L03 | M04·M05·M06 목표 | 목표 1개(마감일·시작일)·마일스톤 1개(마감일)·할일 1개 | 목표 객체 + '목표만' 보기 D-day 글자 |
| L04 | M07 루틴 | 루틴 2개 추가, 1개 오늘 완료 | `getRoutines()` + 매트릭스 행 수 2 |
| L05 | M08·M10·M11 일정 | 직접 일정 1개, 구글 일정 완료 1개(목 데이터), 팀 일정 완료 1개 | 세 문서 |
| L06 | M12·M15·M16·M24 설정 | 조용한 시간 켬, 홈 구성 1개 숨김, 테마 white | `getPrefs()` 해당 칸 + `data-theme` |
| L07 | M14 동반자 | 동반자 1명 추가 후 1명 삭제 | 목록(삭제한 사람 부활 0) |
| L08 | M18~M23 프로필 | 닉네임·관심 2개·지역·공개 켬 | users 행과 화면 값 |
| L09 | M25 휴지통 | 기록 1건 삭제 | 휴지통 1건, 기록 부활 0 |
| L10 | HOME-14 게스트 이전 | 게스트로 L01·L03·L04 생성 → 로그인 모드 전환 | 이전 전후 수 일치 |
| L11 | 비밀값 | 외부 키·PIN 설정 후 전체 백업 | 백업 JSON 안 키 0, 서버 메모리 표 안 키 0 |

**법정과의 관계**: 이 하네스 출력은 작업자 측정(예비 확인)이지 판정이 아니다. 법정 시나리오는 외부 통신이 막힌 채 돌므로 로그인 뒤 화면은 `needs-login` 사유로 "확인 못 함"이 되고, 게스트 경로(L01·L04·L05·L06)는 법정 화면 시나리오로 청구할 수 있다. 기기 2대 동기화(레벨 5)는 `[손 필요]`.
**단위 시험**: 순수 함수(`mergeDoc`·`mergeItems`·`stripSecrets`·EXP 로그 합집합)는 `tests/user-ledger.test.js`(record-ledger-sync.test.js 와 같은 형태)로.

## 5. 실행 순서 — 탭 티켓별 할 일

| 순서 | 티켓 | 바꾸는 것 |
| :-- | :-- | :-- |
| 1 | REC-01 잔여 | `migrateGuestDataToUser` checkins upsert 를 `toCheckinRow`·`upsertCheckinRows` 로. `settings.proTemplateRecords` 를 기록 meta(`templateId`·`columns`·`rows`·`memo`·`photo` 는 결심 K3 따름)로 옮김. `OfflineSyncManager.flush()` 에 기록 업서트 처리기 연결. 실서버 `2026-10-04-checkins-meta.sql` 실행 확인(`[손 필요]`). |
| 2 | (공통 PR) user-ledger | `js/user-ledger.js`·`api/track.js` `sync_ledger`·부록 A SQL·`tests/user-ledger.test.js`·`lifecycle-check.js`. `loadProfile` 반환에 `trash: finalTrash`, `saveProfile` 은 휴지통을 읽은 적 없으면 `trash` 칸을 보내지 않음. `ourgoal_guest_profile` 은 게스트일 때만 쓰기. |
| 3 | HOME-19 잔여 | `awardXP`→`addXp`, 첫 체크인 +5 도 `addXp`. `xp` 문서 이전(L01). 타인 `Lv.` 표시는 K4 결정 전까지 숨김(가짜 1 제거). |
| 4 | GOALS-03 | `routines` 문서 + `getRoutines()` 로 두 화면 통일(L04), `profile.shiftSettings` 사본 제거. `getGoalDueDate` 로 `deadline` 2곳 교체, `goals.start_date`·`updated_at` 저장(L03). |
| 5 | CAL-01 | K1 승인 뒤 `schedules`·`gcal_done`·`team_goal_done` 문서(L05). 배경사진·첨부 사진은 K3 결정 전 로컬 유지 + "이 기기에만 저장" 안내 문구를 사실대로. |
| 6 | SET-05 | `prefs` 문서(부록 B 허용 목록), `settings_ledger` 3값 1회 이전 후 events 쓰기 중단, 테마 키 2개(`ourgoal_theme`·`theme`) 쓰기 제거, `stripSecrets` 를 전체 백업(:39521)에 적용(L06·L11). |
| 7 | HOME-14 | 게스트→회원 이전이 위 문서 전부(xp·routines·schedules·prefs)를 `mergeDoc` 합집합으로 옮기는지 L10 으로 증명, 넛지 문구의 N 은 실제 이전 수. |

## 부록 A. SQL 초안 (파일로 만들지 않음 — 탭 티켓 PR 에서 docs/sql/ 로 옮겨 실행 안내)

```sql
-- A-0. 이전 전 백업 (비파괴)
create table if not exists public.users_backup_20261004 as table public.users;
create table if not exists public.goals_backup_20261004 as table public.goals;
create table if not exists public.checkins_backup_20261004 as table public.checkins;

-- A-1. 목표 시작일·수정 시각 (GOALS-03·CAL-01)
alter table public.goals add column if not exists start_date text;
alter table public.goals add column if not exists updated_at timestamptz default now();

-- A-2. 사용자 문서 원장 (xp·routines·prefs·schedules 등)
-- user_id 는 users.id 와 같은 형(운영 조회 금지로 text 로 가정 — 적용 전 형 확인 필요)
create table if not exists public.user_ledger_docs (
  user_id    text        not null,
  doc_key    text        not null,
  data       jsonb       not null default '{}'::jsonb,
  rev        bigint      not null default 1,
  updated_at timestamptz not null default now(),
  device_id  text,
  primary key (user_id, doc_key)
);
create table if not exists public.user_ledger_docs_history (
  user_id    text        not null,
  doc_key    text        not null,
  data       jsonb       not null,
  rev        bigint      not null,
  saved_at   timestamptz not null default now()
);
alter table public.user_ledger_docs enable row level security;
alter table public.user_ledger_docs_history enable row level security;
-- 정책은 두지 않는다(=anon·authenticated 모두 직접 접근 불가). 읽기·쓰기는 /api/track sync_ledger(서비스 역할 + 본인 토큰 검사)로만.

-- A-3. (결심 K2 승인 시에만) 잇템
-- alter table public.users add column if not exists it_items jsonb not null default '[]'::jsonb;
```

되돌리기: A-1 은 `alter table public.goals drop column if exists start_date;`(데이터 손실 — 결심 ③), A-2 는 표 삭제 전 `*_history` 와 함께 백업. 그래서 되돌리기는 "쓰기 중단(앱 플래그)"을 기본으로 하고 표 삭제는 하지 않는다.

## 부록 B. prefs 허용 목록 / 금지 목록

- **허용(서버 `prefs`)**: `theme`, `fontSize`, `highContrast`, `dataSaver`, `checkinTimes`, `notify`, `notifTeamVerify`, `notifCheers`, `notifDday`, `notifStreak`, `quietHoursEnabled`, `quietHoursStart`, `quietHoursEnd`, `privacy`, `onlineStatus`, `homeLayout`, `aiProvider`, `geminiModel`, `customFeedbackPrompt`, `customFeedbackActive`, `virtualCheerEnabled`, `autoUpdateSuggest`, `exportFormat`, `googleCalendarConnected`, `googleCalendarEmail`, `gcalClientId`, `gcalAutoSync`, `guardianAnimal`, `avatarType`, `hasSeenGuide`, `feedbackPresets`, `feedbackMode`.
- **금지(이 기기만, 백업 JSON·게스트 사본에서도 제외)**: `geminiKey`, `notionApiKey`, `notionWebhookUrl`, `notionDatabaseId`, `twoFactorPin`, `twoFactorAuth`(기기 잠금 여부), `pendingDeletionAt`(서버 탈퇴 처리와 별개 — SET-02), `subscription`.
- **범위 밖(M26)**: `feedReactions`·`feedComments`·`myFeedPosts`·`contentReports`·`todayMissions`·`challenges`·`streakFreeze`·`goalStatusSummaries` — CORE-04·COMM 티켓에서 서버 표 정본 여부를 정한다.

## 부록 C. 확인 못 한 것

- 운영 DB 의 실제 칸·형(`users.id` 형, `goals.updated_at` 존재, `checkins.meta` 적용 여부) — 운영 조회 금지로 코드·docs/sql 만 읽음.
- 휴지통 덮어쓰기(1-2절 1)·수호동물 손실(1-2절 7)의 실제 발생 — 호출 순서 추정, 화면·실계정 미확인.
- 구글 직접 로그인·빠른 복구 경로(Supabase 세션 없음, #656 REQ)의 사용자는 `/api/track` 토큰이 없어 `sync_ledger` 를 못 쓴다 — CORE-02 와 함께 풀어야 하는 한계.
- `js/` 밖 서버 함수(api/*.js) 중 `sync_records` 외 사용자 데이터 쓰기 경로 전수는 하지 않음(api/track.js 의 `sync_records`·`sync_companions` 만 확인).
