# 읽기 조사 셋(작업 0-2) — 시험 서버 · 서버가 받는 칸 · 추천 칩의 태그

- **이 파일은 사본이다.** 정본은 볼트 `C:/dev/vault/에이전트 토론장/2026-10-12 회의 03 — 저장 · 동기화 계약 검토/근거 — 읽기 조사 셋(작업 0-2).md` 이다(2026-10-12 에 옮김. 볼트의 끝머리 연결 줄만 뺐다).
- 기준 커밋: 아워골 `origin/main` = `9f019754184e01d9cc11ae89dffc2b70a5f0a280` (2026-10-12 03:00 KST). 줄 번호는 모두 이 커밋 기준.
- 방법: `git show` · `git grep` 으로 읽기만 했다. 저장소 0 변경, 커밋 · push · PR 0, 서버 주소로 보낸 요청 0. 코드를 실행하지 않았다.
- 표시: **확실** = 파일에 그대로 적혀 있거나 전체 검색 0건으로 확인 / **코드로 읽음** = 흐름을 읽어 판단(실행 안 함) / **모름** = 저장소로는 알 수 없음.
- 비밀값은 옮기지 않았다(자리만 적는다).

## 결론 세 줄
1. **시험용 서버 없음(저장소 기준 확실) · 전용 시험 계정은 운영 서버 안에 있음(기록으로 확실, 지금도 살아 있는지는 모름).** 저장소가 아는 서버 프로젝트는 하나뿐이고, 미리보기 배포도 같은 서버를 본다. 운영에 쓰지 않고 실제 접근 규칙(RLS)과 표 모양을 확인할 길은 저장소 안에 없다 — `checkins` · `goals` · `users` 의 기본 표 정의와 접근 규칙이 저장소에 없기 때문이다(확실).
2. **사진 · AI 피드백 · 에너지 · 집중 · 노션 구조는 기록 저장 길로는 서버에 가지 않는다(확실). 버전 칸 · 수정 시각 칸은 없다(앱이 보내지도 읽지도 않음 — 확실, 운영 표에 있는지는 모름). 지움은 `deleted_at` 표식 한 번의 수정 요청으로 전하고 결과를 보지 않는다(코드로 읽음).** 다만 사진과 피드백은 사용자가 「피드에 공유」를 누르면 이미 서버 `feed_posts` 로 간다(코드로 읽음).
3. **고정 추천 칩의 태그는 분류 · 목표 연결 · 통계 어디에도 쓰이지 않는다(확실: `#낱말` 을 읽는 코드 0건).** 칩이 남기는 것은 글자 「#운동 」 그 자체뿐이다. 글에 넣지 않게 바꾸면 사라지는 기능은 없고, 글에 그 낱말이 들어가서 생기던 곁효과 셋만 사라진다(③ 표).

---

## ① 시험용 서버와 전용 계정

| 물음 | 사실 | 근거 | 표시 |
|---|---|---|---|
| 서버 프로젝트가 몇 개인가 | `*.supabase.co` 주소는 저장소 전체(reports 제외)에서 **한 가지**만 나온다. 11개 파일이 모두 같은 주소 | `index.html:2254`(주소) · `:2255`(공개 키 값이 있는 자리) · `api/track.js:4` · `api/withdraw.js:3` · `api/push-subscribe.js:4` · `api/push-dispatch.js:7` · `scripts/verify-report-schema.js:18` · `scripts/verify-oauth-providers.js:8` | 확실 |
| `supabase/` 폴더 · 마이그레이션 도구 | 없다. SQL 은 `docs/sql/` 45개 파일이고 전부 「대시보드 SQL Editor 에 사람이 붙여넣기」 방식이다 | 최상위 목록 · `docs/sql/2026-10-04-account-purge-README.md:3` | 확실 |
| staging · preview · branch 설정 | 없다. 「스테이징」은 백로그의 계획 문장 한 줄뿐이고, 그 항목이 만든 것은 서버가 아니라 `sandbox_db.json` 파일이다 | `BACKLOG.md:31, 37` | 확실 |
| Vercel 미리보기가 다른 서버를 보는가 | 아니다. `vercel.json` 은 주소 바꿔 쓰기 10줄뿐이고 환경 구분이 없다. 화면은 주소를 코드에 박아 두었으므로 어느 배포든 같은 서버로 간다 | `vercel.json` 전체 · `index.html:2254` · `js/app/boot.js:48` | 확실 |
| 서버 함수(`api/`)의 주소 | 환경 변수 `SUPABASE_URL` 을 먼저 읽고 없으면 같은 기본 주소. Vercel 에 환경별로 다른 값이 들어 있는지는 대시보드를 봐야 안다 | `api/track.js:19` · `api/push-subscribe.js:44` · `api/push-dispatch.js:117` · `api/withdraw.js:6` | 모름 |
| CI 가 서버 비밀을 쓰는가 | 서버(Supabase) 비밀은 **안 쓴다.** 워크플로 5개에서 나오는 이름은 `secrets.CRON_SECRET` · `vars.PUSH_DISPATCH_URL`(푸시 발송 호출) · `github.token`(법정 댓글)뿐 | `.github/workflows/push-dispatch.yml:16~17` · `court.yml:194` · `court-publish.yml:59` | 확실 |
| 법정(court)은 서버를 어떻게 다루는가 | 바깥 통신을 전부 끊는다(`allowHosts: []`, 127.0.0.1 만 허용). 서버 라이브러리는 진짜 사본(2.115.0)을 대신 내주지만 서버에는 닿지 않는다. 상설 시나리오 6개는 모두 게스트 화면이다 | `court/config.json`(allowHosts · stubs) · `court/lib/chrome.js:70, 77` · `court/lib/scenario.js:282` · `court/scenarios/` 6개 | 확실 |
| `docs/sql/2026-10-04-account-purge-test.mjs` 는 무엇에 대고 도는가 | 로컬 메모리 Postgres(PGlite). 표 모양은 작성자가 「운영과 같은 모양」이라고 손으로 적은 것이고 실서버에 접속하지 않는다. DM 쪽 시험 3개도 같다 | 그 파일 `:1~5, 25~50` · `2026-10-04-dm-rls-test.mjs:1~4` · `2026-10-04-dm-read-columns-test.mjs:1~5` · `2026-10-05-dm-rls-step2-recheck-test.mjs:1~6` | 확실 |
| 전용 시험 계정 | **운영 서버 안에** A · B 두 개를 쓰는 「실계정 하네스」가 있다. 주소에 `ogtest` 가 있거나 `OG_TEST_ALLOW` 에 적힌 계정만 로그인한다. 계정은 대시보드의 Add user 로 만든다(앱의 가입 탭은 숨겨져 있다) | `docs/design/harness/real-account-check.js:9~17, 22~23, 46~51` · `real-account-README.md:12~25, 41~49` | 확실 |
| 그 하네스는 운영에 쓰는가 | **쓴다.** 실행 표식(runTag)을 붙인 자료를 만들고 끝에 그 표식의 자기 행만 지운다. 읽기 전용이 아니다 | `real-account-check.js:16` · `real-account-README.md:57` | 확실 |
| 계정이 실제로 쓰였는가 | 「테스트 계정 2회 실측」「A · B 모두 팀 0개(실측)」 기록이 있다. 이 PC 에는 `OG_APP_URL` · `OG_TEST_A_*` · `OG_TEST_B_*` 가 **설정돼 있다**(이름만 확인, 값은 읽지 않음). `OG_TEST_C_*` · `OG_TEST_ALLOW` 는 없다 | `docs/architecture/INLINE-STAGE3-DESIGN.md:77, 169, 186` · 이 PC 환경 변수 유무 | 기록은 확실 / 계정이 지금 로그인되는지는 모름 |
| 가짜 서버로 도는 길 | 둘 있다. (가) 하네스 `--mock`: 두 브라우저가 노드 쪽 메모리 서버를 공유하는 가짜 클라이언트. (나) 화면 측정용 `shots-lib.js`: 가짜 클라이언트 + 서버 주소 204 응답. 둘 다 접근 규칙 · 실제 표 모양을 흉내 내지 않는다 | `real-account-mock.js:1~6` · `docs/design/harness/shots-lib.js:2, 120~122` | 확실 |
| 로컬 개발용 「테스터 B」 | 로컬 주소에서만 열리고 서버 로그인 세션이 없다(고정 id 로 화면만 들어감) | `js/tabs/settings/tester-entry.js:19~38` · `real-account-README.md:14` | 코드로 읽음 |

**운영에 쓰지 않고 접근 규칙 · 표 모양을 확인할 길이 있는가**
- 저장소 안에는 **없다.** `checkins` · `goals` · `users` 를 만드는 `create table` 과 접근 규칙(`create policy`)이 저장소 어디에도 없다(전체 검색 0건 — `docs/sql/` 에는 나중에 붙인 칸 추가 SQL 과 다른 표의 규칙만 있다). 그래서 PGlite 로 로컬에 세워도 「작성자가 추측한 모양」을 시험하는 것이 된다.
- 접근 규칙에 관한 유일한 기록은 2026-09-03 개발 일지 한 항목이다(「users/goals/checkins RLS 켜짐, `auth.uid()=user_id` 확인」으로 읽히나 그 구간의 글자가 깨져 있다) — `dev_log.md:46~50`. 그 뒤 규칙이 바뀌었는지는 모름.
- 운영에서 **읽기만으로** 표 칸의 유무를 재는 선례는 있다: 공개 키로 `select=<칸>&limit=1` 을 보내 오류 코드(42703 = 칸 없음)로 판정 — `scripts/verify-report-schema.js:9~12, 23~29`. 다만 그 스크립트의 네 번째 항목은 함수 호출(POST)이다. 쓰기 규칙(다른 사람 행에 못 쓰는지, 묶음이 통째로 거절되는지)은 읽기만으로는 잴 수 없다.

---

## ② 서버가 받는 칸 · 안 받는 칸 · 버전 칸

**먼저: 세 표의 기본 정의가 저장소에 없다(확실).** 아래 「스키마 근거」는 나중에 붙인 칸의 SQL · 백업 표 정의 · 로컬 시험의 손 모형이 전부다. 그 SQL 들이 운영에 실제로 실행됐는지는 저장소로 알 수 없다(모름 — `dev_log.md:5744` 는 「실서버 할 일」로만 적었고, `docs/specs/LEDGER-DESIGN-2026-10-04.md:265` 도 「운영 조회 금지로 코드 · docs/sql 만 읽음」이라고 적었다).

### checkins
| 칸 | 앱이 보냄 | 앱이 받음 | 스키마 근거 |
|---|---|---|---|
| id · user_id | 예 `js/record-ledger.js:32~33` | 예 `js/core/profile-load.js:147`(조회 조건 `:111`) | 기본 정의 없음. 손 모형은 `id text primary key`(`account-purge-test.mjs:38`), 백업 표는 `id TEXT`(`daily-backup.sql:30`) |
| type · text · end_at | 예 `:34, 35, 37` | 예 `:147` | 기본 정의 없음(백업 표 `daily-backup.sql:32~35` 에 이름만) |
| start_at | 예 `:36` — 값이 없으면 칸을 아예 안 보낸다(`undefined`) | 예 `:147`, 정렬 기준 `:111` | 〃, 색인 `goals-checkins-softdelete.sql:37` |
| created_at | **안 보냄** | 받음 `:147` | 정의 없음. 서버가 채우는 값으로 보인다(추측) |
| category | 예 `:38` | 예 `:148` | `2026-09-06-checkins-category.sql:6` |
| theme · sub_theme · theme_confidence | 예 `:39~41` | 예 `:149~151` | `2026-09-10-checkins-theme.sql:4~6` |
| theme_metadata | 안 보냄 | 안 받음 | 칸 정의만 있음 `2026-09-10-checkins-theme.sql:7` |
| meta (jsonb) | 예 `:42` — 담는 것은 goalId · laps · durationMs · durationMinutes · visibility · isSample · title 일곱 개뿐(`:9`) | 예 `:154`(이미 값이 있는 칸은 덮지 않음 `record-ledger.js:22~27`) | `2026-10-04-checkins-meta.sql:5` |
| deleted_at | 묶음 저장에는 없음. 지울 때만 `update`(`js/core/trash-bin.js:84`), 되살릴 때 null(`:143`) | 거르는 데만 `:145` | `goals-checkins-softdelete.sql:30` |
| is_bot | 안 보냄 | 안 받음 | `2026-09-12-count-same-theme-checkins.sql:14` |
| photo · feedback | **안 보냄** | **안 받음** | 만드는 SQL 없음. `daily-backup.sql:66~69` 의 백업 함수는 checkins 에 이 두 칸이 있다고 가정하고 읽는다. 명세가 말한 `2026-09-20-checkins-feedback.sql` 은 저장소에 없다(`docs/specs/REQ-DIARY-MENTOR-FEEDBACK-ARCHIVE.md:86`) |
| updated_at · version | 안 보냄 | 안 받음 | 정의 없음(전체 검색 0건) |

### goals
| 칸 | 앱이 보냄 | 앱이 받음 | 스키마 근거 |
|---|---|---|---|
| id · user_id · title · category · due_date · visibility · topic · archived_at · result · milestones(jsonb, 할 일까지 통째) | 예 `js/core/home-cockpit.js:219~223` | 예 `profile-load.js:114~118` | 기본 정의 없음. 손 모형 `account-purge-test.mjs:37`, 백업 표 `daily-backup.sql:9~22` |
| created_at | 안 보냄 | 받음 `:115`, 정렬 `:110` | 색인 `goals-checkins-softdelete.sql:36` |
| deleted_at | 지울 때만 `update`(`trash-bin.js:72`, 되살림 `:120`) | 거르는 데만 `:112` | `goals-checkins-softdelete.sql:16` |
| updated_at · start_date | 안 보냄 | 안 받음 | 설계 초안에만 있음(`LEDGER-DESIGN-2026-10-04.md:226~227`), `docs/sql/` 에 파일 없음 |
| 기기에만 있는 목표 속성 | `status` · `progress`(`js/tabs/goals/goal-fast-add.js:50~51`), 기기가 만든 `createdAt` 등은 보내는 목록에 없다 | — | — |

### users
| 칸 | 앱이 보냄 | 앱이 받음 | 스키마 근거 |
|---|---|---|---|
| id · username · display_name · bio · avatar_url · interests · region · region_public | 예 `home-cockpit.js:183~190` | 예 `profile-load.js:183~188` | 기본 정의 없음 |
| saved_avatars | 예 `:189`(오류면 빼고 재전송 `:193~196`) | 예 `profile-load.js:210` | `2026-09-17-users-saved-avatars-column.sql:11` |
| trash (jsonb) | 예 `:184` — 메모리에 목록이 없으면 **빈 배열**을 보낸다(`:179`) | 읽고 **버린다**: `finalTrash` 를 만들지만(`profile-load.js:292~293`) 돌려주는 객체(`:305~313`)에 없다. 화면은 기기 열쇠만 읽는다(`trash-bin.js:20~25`) | `migration_20260917_recycle_bin.sql:15` |
| companions | 별도 길: `js/team-invite-comm.js:450`, `api/track.js:375` | `team-invite-comm.js:401` | `2026-09-16-users-companions-column.sql:16` |

### 사진 · AI 피드백 · 에너지 · 집중 · 노션 구조
| 항목 | 기록 객체의 속성 | 서버로 가는가 | 다른 보존 길 | 읽는 곳 |
|---|---|---|---|---|
| 사진 | `photo` — **데이터 주소 글자**(JPEG, 긴 변 1080, 품질 0.82). 주소(URL)가 아니다. `js/tabs/records/checkin-capture.js:60, 69` · `checkin-input-wiring.js:115~116` · `photo-proof.js:35~56` | 기록 길로는 안 감(`toCheckinRow` 에 없음) | 기기: `ourgoal_records_backup_<uid>` 와 `ourgoal_guest_profile` 두 곳(`home-cockpit.js:212, 230`). 전문 템플릿 기록만 설정 캐시로 되붙음(`profile-load.js:238~252`). **사용자가 피드에 공유하면** `feed_posts.photo` · `extra.photo` 로 서버에 간다(`js/tabs/records/share-to-feed.js:696, 708, 713, 725` · `checkin-feedback.js:397, 409`) | 여러 화면 |
| AI 피드백 | `feedback` — 저장 뒤에 붙이고 한 번 더 저장(`checkin-capture.js:202~205`) | 안 감 | 기기 백업. 공유하면 `feed_posts.extra.feedback`(`share-to-feed.js:715`). 노션 연동을 켠 사용자는 자기 노션으로(`js/tabs/settings/notion-sync.js:31~33, 47~54`) | 피드백 창 등 |
| 에너지 · 집중 | `energy` · `focus`(슬라이더 값, 기본 80) `checkin-capture.js:61~64, 81~82` | 안 감 | 기기 백업뿐 | **읽는 코드 0건**(전체 검색 — 쓰는 두 줄만 있다) |
| 노션 구조 | `notionDb` · `structured` `checkin-capture.js:57~59, 79~80` | 안 감 | 기기 백업뿐 | 읽는 코드 0건(쓰는 곳은 이 파일과 `js/tabs/goals/result-modal.js:340`) |
| 테마 부가정보 | `themeMetadata` `:78` | 안 감(서버 칸은 정의돼 있음) | 기기 백업뿐 | 0건 |

- **저장소(스토리지)에 올리는 코드는 없다**: `storage.from(` · `.upload(` · `getPublicUrl` 전체 검색 0건(확실).
- **지금 서버로 가는 사용자 자료의 종류**(코드로 읽음): 프로필(닉네임 · 소개 · 아바타 주소 또는 아바타 그림 데이터 · 관심사 · 지역 · 저장 아바타 · 동반자 · 휴지통 내용) / 목표(제목 · 분류 · 기한 · 공개 범위 · 단계와 할 일) / 기록(글 · 시각 · 분류 · 테마 · meta 일곱 값) / 피드 글(공유한 기록 글 · 사진 · 피드백) / 팀 댓글 · 메시지 / 반응 · 신고 · 차단 / 문의 · 앱 평가 / 푸시 구독 / 이용 사건(`events`, `user_action_logs`, `user_interactions`). 그리고 기록 글은 AI 피드백을 위해 `/api/feedback` 으로 간다(목표 제목 · 단계 · 최근 기록 3건 · 다가올 일정 포함, `js/tabs/records/ai-feedback-providers.js:35~48`).
- **개인정보처리방침과 견줌**(`docs/legal/privacy.md:11~16`): 수집 항목에 「목표, 마일스톤, 체크인 기록, 피드백 설정, 피드 게시물 및 댓글」이 있다. **사진 · 에너지 · 집중 · AI 피드백 내용은 낱말로 적혀 있지 않다.** 「체크인 기록」에 사진이 든다고 읽을 수 있는지는 판단의 몫이다. 위탁 목록(`:45~48`)은 Supabase · Vercel 둘이며 AI 제공자는 없다.

### 버전 · 시각 · 지움
| 물음 | 사실 | 근거 | 표시 |
|---|---|---|---|
| 「이 변경이 반영됐다」를 확인할 칸 | 없다. 앱은 `updated_at` · `version` 을 checkins · goals 에 보내지도 읽지도 않는다. 받는 시각은 `created_at` 뿐이다 | `js` · `api` 전체 검색 | 확실(운영 표에 칸이 있는지는 모름) |
| 저장 결과를 보는가 | checkins: 돌려받은 결과를 버린다. goals: 응답을 보지 않는다. 묶음 저장에 `.select()` 가 없어 서버가 무엇을 받았는지 돌려받지 않는다 | `home-cockpit.js:218, 238` · `record-ledger.js:65~84` | 코드로 읽음 |
| 지움을 어떻게 전하는가 | 행 삭제가 아니라 **표식**: `update({deleted_at: 지금})` 한 번. 결과를 보지 않고 재시도도 없다(예외만 잡는다). 그 뒤 기록은 메모리 배열에서 빠져 다시는 묶음에 실리지 않는다 | `trash-bin.js:72, 77, 84` | 코드로 읽음 |
| 그 수정 요청이 실패하면 | 서버 행은 살아 있다. 다음 로그인 때 서버 기록에서 거르는 기준은 `deleted_at` 뿐이고(`profile-load.js:145`) 휴지통 id 로는 거르지 않는다(휴지통 id 는 기기 백업을 거를 때만 `:162~167`). → 지운 기록이 되살아날 수 있다 | 같은 줄 | 코드로 읽음(재현 안 함) |
| 휴지통과 서버 | 휴지통 본문(지운 항목의 통째 사본, 최대 100개, 7일)은 `users.trash` 로 올라가지만 다른 기기는 그것을 쓰지 않는다(위 users 표). 영구 삭제 · 비우기 · 7일 만료는 휴지통 목록에서만 빼고, checkins · goals 행을 실제로 지우는 코드는 없다(`delete` 0건) → 서버에는 표식 붙은 행이 남는다 | `trash-bin.js:29~41, 54~66, 168~192` · `home-cockpit.js:179~184` | 코드로 읽음 |
| 다른 기기에서 지운 것이 이 기기에 오는 길 | 다음 `loadProfile`(로그인 · 재실행) 때뿐이다. checkins · goals 에 실시간 구독이 없다(구독은 피드 · 댓글 · 메시지 · 세션뿐). 켜 둔 기기는 그 기록을 계속 보여 주고 매 저장에 다시 싣는다 — 묶음에 `deleted_at` 칸이 없으니 표식은 그대로 남을 것으로 보인다(서버 동작은 추측) | `profile-load.js:112, 145, 177` · `js/tabs/comm/feed-posts-sync.js:33~46` | 코드로 읽음 / 서버 동작 모름 |
| upsert 의 충돌 기준 | 지정하지 않는다(`onConflict` 전체 검색 0건) → 표의 기본 키를 따른다. 기본 키가 `id` 하나인지 `(user_id, id)` 인지는 모름 | `home-cockpit.js:191, 218` · `record-ledger.js:67` | 확실(무지정) / 키는 모름 |
| 「전체를 다시 보낸다」의 모양 | 저장 한 번에 요청 세 개: users 1행 → goals **전부** 한 묶음 → checkins **전부** 한 묶음. 나누는 코드 · 개수 제한이 없다. 주인 표시가 다른 기록만 뺀다 | `home-cockpit.js:209~238` · `js/account-isolation.js:77~84` | 코드로 읽음(서버 쪽 본문 크기 제한은 모름) |
| 저장이 불리는 빈도 | 기록 탭을 그릴 때마다 테마가 `daily` 인 기록이 하나라도 있으면 `saveProfile()` 이 돈다. 보정 함수 `classifyRecordThemeEnhanced` 가 저장소에 정의돼 있지 않아 테마가 `daily` 로 남기 때문이다 | `js/tabs/records/render.js:71~77`(그 이름은 전체에서 이 한 줄뿐) | 코드로 읽음 |

### 기록 id 가 만들어지는 곳
| 경로 | 꼴 | 근거 |
|---|---|---|
| 홈 오늘 기록 · 기록 창 · 기록 도우미 · 전문 템플릿 · 빠른 체크인 | UUID(`crypto.randomUUID`), 없으면 `id_<시각36진><난수5>` | `js/core/time-keys.js:19, 21` · `checkin-capture.js:66` · `weekly-recap.js:420` · `record-assistant.js:63` · `pro-record-save.js:38` · `quick-checkin.js:30` |
| 뽀모도로 | `rec_pomo_<밀리초>` | `js/sanctuary-focus-timer.js:111` |
| 몰입 자동 기록 · 성소 엔진 | `rec_<밀리초>` | `js/tabs/goals/focus-autopilot.js:118` · `js/sanctuary-v3-engine.js:600` |
| 시간 기록 | `rec_tt_<밀리초>_<난수4>` | `js/time-tracker-review.js:130` |
| 가져오기 | `rec_imp_<날짜>_<순번>_<난수>` | `js/stats-import.js:164` |
| 체험 · 견본 | `rec_prev_0…`, `samp_wt_<n>` — 기기마다 같은 값 | `js/core/app-boot.js:220` · `js/stats-samples.js:29` |
| 목표 | UUID(`new-goal-modal.js:218, 308`) 또는 `g_<밀리초>`(`goal-fast-add.js:47`, `goals-ia-actions.js:76`) | — |

---

## ③ 고정 추천 칩의 태그

### 두 줄의 차이
| | 고정 추천 칩 | 내 목표 맞춤 커닝페이퍼 |
|---|---|---|
| 어디서 그리나 | `index.html:696~701` 에 고정 셋(운동 · 독서 · 멘탈). `data-tag` 속성이 있다 | 코드가 그림: `#quickCheckinChips`(`index.html:690`), `js/core/home-cockpit.js:120~133`, 속성은 `data-cunningtext` |
| 누르면 | 입력칸 **맨 앞에 「#운동 」 글자를 넣는다**. 다시 누르면 맨 앞에 있을 때만 뺀다. 칩에 `active-smart-chip` 클래스 | 입력칸의 **배경 예시(placeholder)만** 바꾼다. 글은 건드리지 않는다 |
| 근거 | `js/tabs/home/sub-onescreen.js:351~368` | `js/tabs/records/checkin-helpers.js:19~31` · `home-cockpit.js:135~149` |
| 저장되는 기록에 남는 것 | `text` 안의 「#운동 」 글자뿐 | 없음 |
| 저장 뒤 | 켜진 표시를 끄는 코드가 없다(끄는 곳은 처리기 `:358, 363` 뿐) | 저장 처리기가 모양을 되돌린다(`checkin-capture.js:85, 88~95`) |

### 태그는 어디에 쓰이는가
| 물음 | 사실 | 근거 | 표시 |
|---|---|---|---|
| `#낱말` 을 읽는 코드 | **0건.** 저장소의 `#` 처리는 닉네임 꼬리표(`#1234`), 기록 바로가기(`#record=`), 주소 해시뿐이다 | `js` · `api` · `ui.js` 전체 검색. `profile-load.js:31, 61` · `team-companion-search.js:194~195` · `tabs/calendar/day-detail.js:38` · `tabs/records/template-record-detail.js:148` · `core/app-boot.js:54` | 확실 |
| 칩 정보가 글 말고 다른 길로 저장에 가는가 | 안 간다. `data-tag` 를 읽는 곳은 처리기 한 줄(`sub-onescreen.js:351`)이고, 저장 처리기는 칩을 보지 않는다 | `checkin-capture.js:37~222` 에 smart 칩 참조 0 | 확실 |
| 글을 구조로 바꾸는 함수 | `convertTextToNotionDbRecord` 는 `#` 를 모른다. 글에 「운동」이 **들어 있으면** 태그 「운동」, 「독서」가 있으면 「학습」을 붙인다(낱말 포함 검사). 「멘탈」은 해당 없음. 제목에는 「#운동」이 그대로 들어간다 | `js/tabs/goals/notion-record-convert.js:61~63, 67~72` | 코드로 읽음 |
| 그 결과가 쓰이는 곳 | 기록의 `structured` · `notionDb` 에 담기지만 읽는 코드가 0건이고 서버로도 안 간다. 성공 알림은 상태 · 수치만 쓴다 | `checkin-capture.js:79~80, 159~160` | 확실 |
| 분류 · 테마 | 홈 기록은 테마를 **`daily` 로 고정**한다(글을 보지 않는다). 낱말로 테마를 고르는 `classifyRecordTheme` 은 이 길에서 불리지 않는다 | `checkin-capture.js:53~55, 75~76` · `js/theme-system.js:545~551` · `js/tabs/records/theme-classifier.js:127~178` | 코드로 읽음 |
| 목표 연결 | 홈 기록에는 `goalId` 가 없다. 지금 고른 목표의 분류만 `category` 로 옮긴다. 태그와 무관하다 | `checkin-capture.js:48~49, 65~83` | 확실 |
| 통계 | 항목 이름은 `subTheme` 가 먼저다. 홈 기록은 항상 「일상기타」가 들어가므로 글의 낱말 검사까지 가지 않는다 | `js/stats-ontology.js:104~121` | 코드로 읽음 |
| AI 피드백 요청 | 글 전체가 그대로 간다(「#운동 」 포함). 테마는 `daily` 로 넘긴다 | `checkin-capture.js:191` · `ai-feedback-providers.js:38~42` | 코드로 읽음 |
| 달력 · 피드 · 검색 | 글을 그대로 보여 주거나 포함 검색할 뿐이다 | 위 검색 | 코드로 읽음 |

### 칩이 글에 태그를 넣지 않게 바꾸면 사라지는 것
사용자가 직접 친 `#태그` 는 지금도 보통 글자로만 다뤄지므로 달라지지 않는다. **기능은 사라지지 않는다.** 사라지는 것은 글에 낱말이 들어가서 생기던 곁효과뿐이다.
1. 기록 글 맨 앞의 「#운동 」 글자 자체 — 목록 · 피드 공유 · 노션 내보내기에 보이던 것, 「운동」으로 찾던 것.
2. 기기 전용 노션 구조의 태그 「운동」 · 「학습」(읽는 곳 0건).
3. AI 피드백이 받던 낱말 하나(문맥 힌트).
- 덤: 칩을 바꿔 누르면 앞 칩의 글자는 남는다(「#독서 #운동 …」) — `sub-onescreen.js:363~367`(코드로 읽음).
- 다른 곳에도 입력칸에 `#` 글을 넣는 코드가 하나 있다: 단계에서 기록으로 갈 때 「#<단계 이름> 」 — `js/sanctuary-goal-trail.js:139~148`. 조사 대상 밖이지만 「입력칸을 미리 채우지 않는다」와 같은 종류다.

### 이 칩을 확인하는 시험
- 상설 시험에는 **없다**: `tests/` · `scripts/` · `court/scenarios/` 에 smart 칩 참조 0건(확실). 스모크가 보는 것은 커닝페이퍼 줄이다(`scripts/smoke-test.js:7249~7251, 7612~7614`).
- 작업 보고 폴더에 하나 있다: `reports/TASK-ES-340/scenarios/home-core-interaction.json:15~23` — 칩 셋이 보이는지, 운동 칩을 누르면 `active-smart-chip` 이 붙는지만 본다. **입력칸의 글은 확인하지 않는다.** 같은 폴더 `claims.json:45~47` 은 `id="smartRecommendChips"` 글자가 있는지만 본다.
- 크기 측정 기록: `docs/design/harness/out-six-tab-2026-10-04.json:17~19`(61×28).

---

## 계약 문서를 쓸 때 조심할 사실 (제안이 아니라 본 것)
1. 서버에 「이 변경을 받았다」고 답해 주는 칸이 없다. 지금 코드로 서버 상태를 아는 길은 다시 조회해 `id` 와 내용을 견주는 것, 또는 저장 요청에 돌려받기(`.select()`)를 붙이는 것 둘인데, 뒤쪽은 지금 쓰이지 않는다.
2. 서버가 주는 시각은 `created_at` 뿐이고 기기가 보낸 값이 아니다. 기기의 `createdAt` 은 재실행 뒤 서버 값으로 바뀐다(`profile-load.js:147`).
3. 지움 표식은 한 번의 `update` 에 달려 있고, 묶음 저장은 `deleted_at` 을 싣지 않는다. 지움과 고침이 서로 다른 요청 꼴이다.
4. 휴지통은 서버로 「쓰기만」 한다. 메모리에 목록이 없는 기기가 저장하면 빈 배열을 보낸다(`home-cockpit.js:179, 184`). 2026-10-04 설계서가 이미 같은 것을 적었다(`LEDGER-DESIGN-2026-10-04.md:43, 65`).
5. 기록 id 가 전역에서 겹칠 수 있는 꼴이 있다(`rec_prev_0`, `rec_<밀리초>`). 기본 키가 `id` 하나라면 다른 사람의 같은 id 와 부딪친다 — 실제 키와 그때 서버의 답은 모름.
6. 저장 한 번이 세 표에 따로 가고 묶어 주는 장치가 없다. 기록 탭을 그리는 것만으로도 전체 저장이 돈다(`render.js:71~77`).
7. 게스트 → 가입 이관은 다른 변환을 쓴다: `meta` 없이 올리고 테마를 `daily` 로 채운다(`js/tabs/settings/guest-migration.js:198~211`).
8. 사진은 한 장이 긴 글자이고 기기 두 열쇠에 겹쳐 들어간다. 서버에 사진이 이미 가는 길(피드 공유)은 표의 jsonb/text 칸에 데이터 글자로 넣는 방식이다.
9. 에너지 · 집중 · 노션 구조는 지금 쓰기만 하고 읽는 화면이 없다.
10. 시험 계정으로 도는 하네스는 운영에 쓰고 지운다. 「운영에 쓰지 않는 확인」으로 셀 수 없다.

## 못 잰 것
- 운영 서버의 실제 표 모양(칸 · 자료형 · 기본 키) · 접근 규칙 · `deleted_at` · `meta` 칸이 실제로 있는지 — 서버에 접속하지 않았다.
- Supabase 대시보드에 다른 프로젝트나 브랜치가 있는지, Vercel 환경 변수가 환경별로 다른지.
- 시험 계정 A · B 가 지금 로그인되는지(환경 변수가 있다는 것만 봤다).
- 묶음 저장에서 한 행이 거절될 때 전체가 거절되는지, 본문 크기 제한, 같은 id 가 묶음에 두 번 들 때의 답.
- 묶음 저장이 `deleted_at` 표식을 건드리지 않는다는 것(서버 동작 — 추측).
- 칩 동작의 화면 확인(전부 코드로 읽음).
- `reports/` 아래 과거 측정 파일 전부는 읽지 않았다(칩 관련 23개 파일 중 시나리오 · 주장 두 개만 읽음).

