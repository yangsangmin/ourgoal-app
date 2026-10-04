# REQ — #TASK-ES-350 단일 원장 설계서 (CORE-03)

- 근거: 노션 「아워골 UI/UX 대개편 작업 티켓 DB」 CORE-03(https://app.notion.com/p/3ef598db9096813c9f32f011889551fd), 6개 탭 상호관계 분석(공통 기반 ③ "데이터 원장이 탭마다 다르고 새고 있음"), 헌법 GUARD_03·ARTICLE_07 7.2·ARTICLE_11·ARTICLE_15.
- 범위: 설계·측정·문서만. 앱 코드 수정 0줄, SQL 파일 0개(설계서 부록 A 초안), 운영 서버 조회 0회.
- 산출물: `docs/specs/LEDGER-DESIGN-2026-10-04.md`(설계서 정본), `reports/TASK-ES-350/count-ledger-map.js`(지도표 집계 스크립트), 이 REQ, `docs/plans/PLAN-TASK-ES-350-LEDGER-DESIGN.md`, `reports/TASK-ES-350/claims.json`, TICKETS 1줄, dev_log 항목.

## 1. [원칙 ①] 문제 정확히 파악 — 지시 원문(요지)

1. origin/main(오늘 #654 record-ledger·#655·#658 병합 반영) 기준 사용자 데이터 원장 전수 조사 → 항목별 [쓰는 곳(localStorage 키·state 경로·Supabase 표·칸) / 쓰는 함수 / 읽는 함수 / 서버 왕복 / 중복 저장]. 최소: EXP(settings.xp.total vs profile.exp), 레벨, 체크인·기록(checkins+meta), 목표·마일스톤·할일(dueDate vs deadline), 루틴(settings.routines vs profile.routines), 일정(customSchedules·calendarDayBackgrounds·gcalDoneEvents), 설정 전반(ourgoal_settings_<id>, 서버는 settings_ledger 구글 값 3개), 동반자(users.companions), 홈 구성(homeLayout), 테마(키 3개), 앱 잠금 PIN(#658), 프로필 4종(잇템·관심·지역·동네).
2. 목표 설계: 항목별 정본 저장소 1곳(Server-First), 단일 읽기/쓰기 함수(js/record-ledger.js 패턴 확장), 값당 칸 하나(EXP·루틴·D-day), 로컬→서버 이전 절차·백업, 충돌 해결 규칙. 새 개인정보 칸 추가 금지 — 필요해 보이면 [결심 필요] 후보.
3. 수명주기 4단계(생성→localStorage 삭제→리로드→원격 복원 deepStrictEqual) 공통 검사 설계(하네스·항목별 시나리오). 구현 안 함.
4. 실행 순서: GOALS-03·CAL-01·SET-05·HOME-14·HOME-19 잔여·REC-01 잔여별 1~3줄.
5. SQL 은 설계서 부록에 초안만(비파괴), 파일로 만들지 않음.
6. REQ/PLAN·claims·TICKETS 1줄·dev_log, PR(초안 아님), 법정 판정 기록. 병합 안 함.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 사용자가 남긴 값이 "어디에 한 번" 저장되는지가 정해져 있지 않다. 그래서 같은 값을 여러 곳에 쓰고, 화면마다 다른 곳을 읽고, 일부는 기기를 벗어나지 못한다.
- **원인**: 기능을 붙일 때마다 그 기능 안에서 저장 위치를 새로 정했다(`settings` 에 넣기 → 로컬 백업 키 추가 → events 원장 추가). 공통 저장 함수가 없어 `saveProfile()`(index.html:5049)·`saveLocalSettings()`(:2924)·`persistCompanions()`·`/api/track` `sync_records`·`sync_companions` 가 각자 쓴다.
- **중심**: `state.profile` 과 `state.profile.settings` 두 객체에 같은 값이 겹쳐 있고(`interests`·`region`·`itItems`·`guardianAnimal`·`companions` 등), `ourgoal_settings_<id>` 가 서버에 가지 않는다.
- **핵심**: 항목별 정본 1곳 + 읽기/쓰기 함수 1쌍 + 값당 칸 1개. 설계서 1절 지도표(29항목) 집계는 스크립트 산출: 중복 저장 16, 로컬 전용 18, 서버 쓰기만 1.

## 3. [원칙 ③] 해결방식

- 지도는 코드 읽기로 만든다(운영 조회 금지). 각 칸에 함수 이름과 index.html 줄 번호를 단다.
- 서버 저장 장소는 새 표 1개 `user_ledger_docs`(사용자별 문서)와 goals 칸 2개(`start_date`·`updated_at`)로 최소화. 이미 표가 있는 목표·기록·프로필은 그 표가 정본.
- 공통 모듈 `js/user-ledger.js`(`window.OurgoalUserLedger`, 서버 `api/track.js` require 공용) — `readDoc`·`writeDoc`·`pushPending`·`pullAll`·`mergeDoc`·`mergeItems`·`stripSecrets`·도메인 함수(`getXp`·`addXp`·`getRoutines`·`getGoalDueDate`·`getPrefs`).
- 서버로 새로 올리는 사용자 작성 내용(일정·사진·잇템)과 공개 범위(레벨)는 [결심 필요] 후보 K1~K4 로 분리.

## 4. [원칙 ④] 재검토 — 한계(정직하게)

- 줄 번호·함수명은 13dd59a 기준이며 이후 PR 로 밀릴 수 있다.
- 운영 DB 의 실제 형(`users.id`)·칸 존재(`goals.updated_at`, `checkins.meta` 적용)는 확인 못 함 → 부록 A 는 `if not exists` 와 "적용 전 형 확인" 주석.
- 휴지통 덮어쓰기·수호동물 손실은 호출 순서에 달린 추정이다(화면·실계정 미확인).
- Supabase 세션이 없는 입장 경로(구글 직접 로그인 등)는 `/api/track` 토큰이 없어 서버 원장을 못 쓴다 — CORE-02 와 함께.

## 5. [원칙 ⑤] 해결 절차

1. 워크트리 `C:/dev/wt/core-03`, 브랜치 `docs/2026-10-04-task-es-350-ledger-design`(origin/main 13dd59a).
2. localStorage 키 전수(`grep` 로 `ourgoal_*` 문자열 리터럴 60종 — 내려받기 파일명·sessionStorage 키 포함) → 사용자 데이터·기기 전용 분류.
3. `loadProfile`·`saveProfile`·`syncServerRecords`·`migrateGuestDataToUser`·`api/track.js` `handleSyncRecords`·`handleSyncCompanions` 정독.
4. 항목별 지도표 → 집계 스크립트 → 목표 설계 → 수명주기 설계 → 실행 순서 → SQL 부록.
5. 문서·claims → 커밋·PR → 법정 판정 기록.

## 6. [원칙 ⑥] 절차 재검증 — 반론 격파

- **반론 1: "문서만 바꾸는 PR 이라 법정이 잴 것이 없고, 설계 내용이 맞는지는 아무도 보증하지 않는다."** → 맞다. 그래서 주장은 '설계서에 무엇이 적혀 있다'(static, 글자만 봄)로 한정하고, 설계의 옳음은 주장하지 않는다. 대신 지도표의 각 칸에 줄 번호를 달아 읽는 분이 바로 대조할 수 있게 했고, 집계는 손이 아니라 스크립트(`count-ledger-map.js`)로 냈다(처음 손으로 적은 중복 17 이 스크립트로 16 으로 바로잡힘).
- **반론 2: "새 표 `user_ledger_docs` 자체가 새 개인정보 칸이다."** → 표는 이미 앱이 다루는 값(EXP·루틴·설정)을 기기 대신 서버에 두는 그릇이다. 그러나 지금 서버에 없는 사용자 작성 내용(일정 내용·사진·잇템)을 그 그릇에 넣는 순간 서버 보관 범위가 넓어지므로, 그 항목들은 K1~K3 로 분리해 상민님 결심 전에는 로컬 유지로 설계했다. 외부 서비스 키·PIN·구글 토큰은 어떤 경우에도 서버로 옮기지 않는다(부록 B 금지 목록).
- **반론 3: "충돌 규칙을 최신 우선으로 하면 두 기기에서 동시에 얻은 EXP 가 사라진다."** → EXP 만은 로그 합집합 후 합계를 다시 계산하도록 따로 정했다(설계서 2-5).

## 7. [원칙 ⑦] 단계별 실행 기준

- 설계서의 각 절은 지시 1~5 에 1:1(1절=지시1, 2·3절=지시2, 4절=지시3, 5절=지시4, 부록 A=지시5).
- 앱 코드·`docs/sql/`·금고 파일은 변경하지 않는다(PR 변경 파일: docs/specs 2, docs/plans 1, reports 2, TICKETS, dev_log).

## 8. [원칙 ⑧] 막히는 지점 예상

- 법정이 문서 PR 의 static 주장에서 `check.file` 이 `touches` 밖이면 형식 오류 → 모든 주장에 같은 파일을 넣음.
- 주장 문장에 "다른 기기"·"타인" 같은 낱말이 있으면 필요 수준이 올라간다(grade-floors keywordFloors) → 문장에서 뺌.
- 판정이 늦게 오면 `node court/chat.js <PR>` 종료코드 3(아직 없음) — 재조회.
