# REQ/PLAN — TASK-ES-404 DM 대화방이 가장 오래된 50건 대신 최신 50건을 보여 준다

> 근거: #716(TASK-ES-399) 빌더 진단 계측 — 실계정 하네스 RA-COMM-04A·04B 실패 때 B 의 대화방 `.dm-msg` 50개, 이번 실행 표식 메시지 0건. 하네스가 지우지 못한 DM 행(RLS)이 쌓여 A·B 대화가 50건을 넘었다. 코디네이터 지시(2026-10-05).
> 추가 범위(코디네이터, 같은 PR·하네스만): `docs/design/harness/real-account-steps.js` RA-SET-01 — `clickReal` 이 접힌 아코디언 `#setGroupAccountSummary` 를 누르면 클릭이 하단 탭(기록)에 떨어져 설정 화면이 사라지던 것. 제품 코드 변경 없음.
> [기본값] 「이전 메시지 더 보기」는 원래 없었다 — 새로 만들지 않는다(기능 추가 범위 아님, 아래 8번에 보고).
> 금고 파일(court/**·AGENTS.md·CLAUDE.md·.github/workflows/**·scripts/essence-gate.js·scripts/verify-integrity-gate.js·package.json scripts·vercel.json) 변경 0. origin/main(#716 병합 뒤) 위에서 작업.

## REQ
- 대상 파일·함수
  - `js/team-dm-room.js` `loadDmMessagesFromDb(threadId, person)` — `team_ping_replies` 조회를 `.order('created_at', { ascending: false }).limit(50)` 으로 받고 `res.data.slice().reverse()` 로 오름차순으로 바꿔 `person._thread` 에 넣는다.
  - `js/team-chat.js` `openTeamChatModal(gid, groupsPool)` — 같은 모양의 팀 대화방 조회(`team_pings`, `target_type = 'team_chat'`, 오름차순 + `limit(100)`)를 최신 100건 + 오름차순 표시로.
  - `docs/design/harness/real-account-steps.js` 새 함수 `scrollClear(page, sel)` + `clickReal` — 누르기 전 요소를 화면 가운데로 올리고 `elementFromPoint` 로 그 점이 그 요소인지 확인(가려졌으면 조금씩 옮겨 다시 잼). 접힌 `details` 의 `summary` 와 대상 요소 모두.
- 대상 DOM: `#dmMsgs`(대화방 메시지 칸, `.dm-msg`), `#teamChatMsgBox`, 하네스 `#setGroupAccountSummary`·`#logoutOtherDevicesBtn`·`.navbtn` — 마크업 변경 0.
- 새 시험: `tests/dm-latest-50-es404.test.js` (npm test 경로: `scripts/test-shipyard-modular.js` Test 6 `runNode`).
- R1: 대화가 50건을 넘어도 대화방은 최신 50건을 시간 오름차순(맨 아래가 최신)으로 보여 준다.
- R2: 읽음 표시·실시간 수신(맨 뒤에 붙음)·피드 공유 DM·dm-ledger 와의 상호작용이 그대로다.
- R3: 같은 오래된 순 limit 이 다른 곳에 있으면 목록화하고 처리 범위를 밝힌다.
- R4: 부품 시험 기준 사본 실패 → 작업 통과, npm test 기준과 같음, 실계정 RA-COMM-04A·04B 기준·작업.
- R5(추가): 하네스 RA-SET-01 이 기준·작업 모두에서 끝까지 돈다(하단 탭 오클릭 없음).

## 1. [원칙 ①] 목표 정의
대화가 몇 건이 되든 대화방을 열면 방금 온 메시지가 보인다. 팀 대화방도 같다. 실계정 하네스는 접힌 설정 칸을 열 때 하단 탭을 누르지 않는다.

## 2. [원칙 ②] 본질·원인·중심·핵심
- 본질: 「몇 건만 가져온다」와 「어떤 순서로 보여 준다」를 한 줄(오름차순 + limit)로 처리해, 개수 제한이 오래된 쪽을 남겼다.
- 원인: PostgREST 는 정렬 뒤 limit 을 적용한다. `order(created_at asc).limit(50)` = 가장 오래된 50건. 화면은 받은 순서대로 그리므로 51번째 이후(최신)는 영영 안 나온다. 실시간 수신은 대화방이 열려 있을 때만 붙어, 다시 열면 또 오래된 50건으로 덮인다.
- 중심: `loadDmMessagesFromDb` 조회 두 줄과 매핑 입력 한 줄.
- 핵심: 최신 N건을 desc 로 받고, 화면용으로 뒤집는다.
- 하네스(R5) 원인: puppeteer `page.click` 은 요소가 화면 안에만 있으면 스크롤하지 않고 그 중심을 누른다. 접힌 아코디언 summary 가 화면 맨 아래(고정 하단 탭 높이 안)에 있으면 그 점은 `.navbtn` 이 덮고 있어 기록 탭이 눌렸다. `clickReal` 은 대상 요소만 가운데로 올리고 summary 는 올리지 않았다.

## 3. [원칙 ③] 해결 방식 — 구체적 식별자
| 파일 | 함수 | 바꾼 것 |
|---|---|---|
| `js/team-dm-room.js` | `loadDmMessagesFromDb` | `ascending: true` → `false`, `latestRows = res.data.slice().reverse()` 를 매핑 |
| `js/team-chat.js` | `openTeamChatModal` | `ascending: true` → `false`, `res.data.slice().reverse().map(...)` |
| `docs/design/harness/real-account-steps.js` | `scrollClear`(새), `clickReal` | summary·대상 요소를 누르기 전 가운데로 + 가림 확인 |
| `tests/dm-latest-50-es404.test.js` | (새) | 가짜 표(필터·정렬·limit 진짜 적용)로 앱 파일을 그대로 돌림 |
| `scripts/test-shipyard-modular.js` | Test 6 | `runNode('tests/dm-latest-50-es404.test.js')` |

같은 패턴 전수(`team_ping_replies`·`team_pings` 조회, `index.html`·`js/**`):
| 위치 | 조회 | 판정 |
|---|---|---|
| `js/team-dm-room.js` `loadDmMessagesFromDb` | asc + limit 50 | **결함 — 고침** |
| `js/team-chat.js` `openTeamChatModal` | asc + limit 100 | **같은 결함 — 고침**(팀 대화 100건 초과 시 새 메시지 안 보임) |
| `js/team-dm-inbox.js` `loadIncomingDmRooms`(대화 목록 미리보기·안 읽음 표시·새 대화 요청) | desc + limit 100 | 최신 순이라 정상 — 안 고침. 다만 받은 행 100건만 보므로 101번째보다 오래된 상대는 목록 미리보기에서 빠질 수 있음(별도 사안, 보고만) |
| `js/tabs/comm/dm-ledger.js` `markThreadRead` | update(limit 없음) | 해당 없음 |
| `js/team-share.js` 피드 공유 DM | insert 만 | 해당 없음 — 같은 `dm_` 대화방 id 로 들어가 최신 50건에 포함 |
| `api/push-dispatch.js` 증명 조회 | select id, 최근 10분 | 해당 없음 |

## 4. [원칙 ④] 재검토 — 다른 길과 비교
- (가) limit 을 늘림(500 등): 문제를 미룰 뿐, 큰 대화방에서 매번 전체를 받아 느려진다. 기각.
- (나) 서버 RPC 로 최신 N건 오름차순: 스키마 변경·배포가 필요하고 효과는 같다. 기각.
- (다) desc + limit + 클라이언트 뒤집기: 한 줄, 서버 변경 0, 실시간·읽음 로직이 기대는 `person._thread` 오름차순 계약 유지. 채택.
- 하네스: 하단 탭을 숨기는 CSS 주입은 화면을 바꿔 측정을 오염시킨다. 스크롤 + 가림 확인으로 채택.

## 5. [원칙 ⑤] 절차
1) worktree(origin/main) → 2) 같은 패턴 전수 → 3) 기준 `git archive` 스크래치 사본 → 4) 부품 시험 작성, 기준 실행(실패 기록) → 5) 수정 → 6) 작업 실행(통과) → 7) npm test 기준·작업 → 8) #716 병합 뒤 main 으로 옮기고 기준 사본 다시 → 9) 하네스 RA-SET-01 수정 → 10) 실계정(로컬 127.0.0.2 정적 서버 + /api 운영 전달, 테스트 계정 A·B) 기준·작업 → 11) claims·기록 → 12) PR.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파
- 반론 1: 「뒤집으면 같은 created_at 메시지 순서가 바뀐다.」 → 기존 asc 조회도 같은 시각끼리 순서를 보장하지 않았다(정렬 키 하나). 바뀌는 것은 없다. 앱 전송 시각은 밀리초 ISO 라 실제 동률은 드물다.
- 반론 2: 「최신 50건만 받으면 그보다 오래된 내 안 읽은 메시지 표시가 사라진다.」 → 읽음 판정(`is_read`·`status`)은 행 단위 매핑이라 받은 50건 안에서는 그대로이고(부품 시험이 m58 읽음·m60 안 읽음을 잼), 50건 밖은 예전에도 「최신 쪽」이 빠졌을 뿐 지금은 「오래된 쪽」이 빠진다 — 사용자에게 보여야 하는 것은 최신 쪽이다. 서버 읽음 처리(`markThreadRead`)는 limit 없이 대화방 전체에 적용되어 영향 없다.
- 반론 3(하네스): 「scrollClear 가 다른 시나리오의 클릭을 바꾼다.」 → 가려지지 않은 요소는 예전과 같은 위치(가운데)에서 눌린다(예전에도 대상 요소는 가운데로 올렸다). 바뀌는 것은 summary 를 누르기 전 스크롤과 가림 재확인뿐.

## 7. [원칙 ⑦] 즉시 실행 — 결과
- 부품 시험 `tests/dm-latest-50-es404.test.js`: 기준 사본 2/8 → 작업 8/8 (`reports/TASK-ES-404/unit-dm-latest-{base,work}.json`).
- npm test: 기준·작업 모두 종료 0, 443 통과·0 실패, 클릭 38/38 (`reports/TASK-ES-404/npm-test-summary.json`). 작업에서 새 시험 8/8 추가. module-guard 통과(스펙 갱신 불필요).
- 실계정 하네스 6조합(RA-CORE-LOGIN·CORE-SWITCH·COMM-03·COMM-04A·COMM-04B·SET-01), 로컬 127.0.0.2 정적 서버 + /api 운영 전달, 테스트 계정 A·B:
  - 기준 앱 + 수정 전 하네스: 3통과·3실패 — COMM-04A「45초 안에 B 화면에 A 의 표식 메시지 0건」, COMM-04B「B 화면에 메시지 없음」, SET-01「#logoutOtherDevicesBtn 없음」(`harness-6-base-oldharness.json`)
  - 기준 앱 + 수정 하네스: 4통과·2실패 — SET-01 통과(하네스 수정 효과), COMM-04A·04B 는 같은 실패(제품 결함) (`harness-6-base.json`)
  - 작업 앱 + 수정 하네스: 6통과·0실패 — COMM-04A arrivedOnB 1, COMM-04B B 열람 뒤 A 쪽 「읽음」, SET-01 a2Out·a1Stays (`harness-6-work.json`)
  - 세 실행 모두 하네스가 지우지 못한 DM 행 2건(RLS, 기존과 같음).

## 8. [원칙 ⑧] 성과 측정 · 막히는 지점
- 측정: 위 7번 파일. 판정은 법정만.
- 「이전 메시지 더 보기」: 원래 없었다. 이번 수정 뒤 50건보다 오래된 메시지는 대화방에서 볼 수 없다(예전엔 최신이 안 보였음). 필요하면 별도 기능 작업.
- `js/team-dm-inbox.js` 대화 목록이 받은 행 100건만 본다(최신 순이라 이번 결함은 아님) — 받은 메시지가 많은 사용자는 오래 전 대화 상대가 목록 미리보기·안 읽음 점에서 빠질 수 있다. 보고만.
- 하네스가 만든 DM 행은 RLS 로 지워지지 않아 A·B 대화방이 계속 길어진다(cleanup leftover) — 이번 결함을 재현한 원인이기도 하다.
- 실기기 확인은 로그인이 필요해 claims 에 unverified 로 냄.
