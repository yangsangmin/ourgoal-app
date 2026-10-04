# 요구사항 정의서·작업계획서 (REQ/PLAN) — #TASK-ES-355 실계정 2개 확인 묶음 (CORE-02, GOALS-24 흡수)

> **문서 ID**: REQ-TASK-ES-355-REAL-ACCOUNT-HARNESS  
> **티켓 연계**: 노션 「아워골 UI/UX 대개편 작업 티켓 DB」 CORE-02 (GOALS-24 흡수) — https://app.notion.com/p/3ef598db909681889de1eb0692fce863  
> **작성 일시**: 2026-10-04  
> **작성자**: Claude Code 세션 (공통 기반 도구 작업)  
> **성격**: 검증 도구·문서만 추가한다. 제품 파일(`index.html`·`js/**`·`ui.css`)은 건드리지 않는다. 운영 서버에 접속·조회·쓰기를 하지 않았다(테스트 계정이 아직 없다).

## 지시 원문 (작업 지시서에서 옮김)

- 시나리오 표(docs/design/harness/real-account-scenarios.md): 행마다 [출처 PR·주장 id / A 가 하는 일 / B(또는 같은 계정 2기기)에 보여야 하는 것 / 확인 방법(화면 DOM·API 응답·건수) / 필요한 계정 조건]. 오늘 PR 들의 레벨5 미확인 항목 전부 + 목표탭 GOALS-03·14·16~19(공개범위·팀) + 소통 COMM-03·04(동반자·DM) 핵심.
- 하네스(docs/design/harness/real-account-check.js): 환경 변수(예: OG_TEST_A_EMAIL, OG_TEST_A_PASSWORD, OG_TEST_B_EMAIL, OG_TEST_B_PASSWORD, OG_APP_URL)로 두 계정을 이메일 로그인해 헤드리스 브라우저 두 개로 시나리오를 재생. 환경 변수가 없으면 아무 데도 접속하지 않고 '계정 없음 — 재생 안 함' 으로 정직하게 종료(가짜 통과 금지). 결과는 시나리오별 통과/실패/못 함 JSON. 쓰기 시나리오는 테스트 계정 데이터만 만들고 끝에 정리(지운 것까지 기록). 운영 사용자 데이터를 읽거나 바꾸는 시나리오 금지.
- [손 필요] 안내(docs/design/harness/real-account-README.md): 테스트 계정 2개를 만드는 클릭 단위 절차(앱의 이메일 가입 경로 또는 Supabase 대시보드 Authentication → Add user 중 저장소 실제 구조에 맞는 쪽), 환경 변수 넣는 방법(이 PC: Windows 사용자 환경 변수, 값은 채팅에 쓰지 말 것), 실행 명령, 결과 읽는 법, 테스트 계정 삭제 방법.
- 로컬 검증: 환경 변수 없이 실행 → '계정 없음' 종료 확인. 가능하면 shots-lib 의 Supabase mock 으로 두 '가짜 세션'을 흉내 내 하네스 배선만 1~2개 시나리오로 돌려 보되, 결과 파일에 mock 이라 명시.
- 문서: REQ/PLAN(TASK-ES-355), reports/TASK-ES-355/claims.json, TICKETS 1줄, dev_log. 근거: 노션 CORE-02, 원문 "내가 테스트 계정을 만들어서 다른기기에 로그인해서 두 계정으로 직접 체크하고 싶은데"(ES-169), "실제구현이란 실제 사용자들의, 상대방 계정(들)과 상호 연동되는 거야"(ES-106).

## 1. [원칙 ①] 문제 파악

- 2026-10-04 병합 PR #654·#655·#656·#658·#659·#661·#662·#663 의 법정 판정 '확인 부족'은 대부분 확인 수준 5(진짜 계정끼리)를 못 잰 것이다. 각 PR 의 `reports/TASK-ES-344~353/claims.json` 에 `needs-two-accounts`·`needs-live-server`·`needs-login` 주장이 흩어져 있다.
- 법정 도구는 로그인할 수 없고(외부 통신 차단), 세션은 Supabase 대시보드 로그인을 통과할 수 없다. 탭마다 따로 [손 필요] 를 올리면 상민님 손이 여러 번 든다.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: "A 가 하면 B 에게 보이는가"를 사람 눈 대신 같은 도구로 반복해 잴 수 있게 한다. 상민님 손은 테스트 계정 만들기 1번으로 끝난다.
- **원인**: 확인 시나리오가 PR 마다 글로만 남아 있고, 두 계정을 동시에 굴리는 도구가 없다.
- **중심**: 시나리오 표 1장(정본) + 그 표의 ID 를 그대로 쓰는 하네스 1개.
- **핵심**: 계정이 없으면 접속 0 으로 '못 함'만 내고(가짜 통과 0), 계정이 있으면 테스트 계정 데이터만 만들고 지운다.

## 3. [원칙 ③] 해결방식 — 구체적 식별자

| 항목 | 식별자 |
| :-- | :-- |
| 시나리오 표 | `docs/design/harness/real-account-scenarios.md` — 28행(공통 2·기록 3·일정 3·설정 5·소통 8·목표 7) |
| 하네스 본체 | `docs/design/harness/real-account-check.js` — `main()`, `checkEnv()`(필수 변수·`ogtest` 표식·A≠B), `noAccountResult()`, `REQUIRED_ENV`, `NO_ACCOUNT_MSG` |
| 단계·시나리오 | `docs/design/harness/real-account-steps.js` — `SCENARIOS`, `runScenario()`, `login()`(`#landLoginLink`→`#loginUser`·`#loginPass`·`#loginSubmit`, `loggedIn()` = `#appShell.active` + 프로필 id UUID), `writeRecord()`(`#captureInput`·`#captureSave`), `findRecord()`(`#recordsList .rec-card .rec-text`), `addCompanion()`(`#companionNicknameSearchInput`, `button[data-addcomp="<uid>"]`), `sendDm()`(`[data-directdm]`·`#dmInput`·`#dmSend`), `incomingDm()`(`.dm-list-item[data-open]`·`#dmMsgs .dm-msg.them`), `anonCount()`(REST 건수만), `cleanup()`(runTag 붙은 자기 행만 삭제·재조회), `MOCK_SET` |
| mock | `docs/design/harness/real-account-mock.js` — `MOCK_CLIENT_JS`(가짜 supabase-js), `createMockServer()`(노드 쪽 공유 메모리), `prepareMockPage()`(`page.exposeFunction('__ogMockDb')`), `MOCK_HOST`(`ogmock.test` → 127.0.0.1, 앱의 미리보기 자동 입장을 피함) |
| 안내 | `docs/design/harness/real-account-README.md` — 대시보드 Add user(앱 가입 탭은 `display:none`), 환경 변수, 실행·결과·삭제 |
| 산출물 | `docs/design/harness/out-real-account-none-2026-10-04.json`(계정 없음 실행), `out-real-account-mock-2026-10-04.json`(mock 실행) |

## 4. [원칙 ④] 재검토 — 한계(정직하게)

- 실계정으로 한 번도 돌리지 않았다(계정 없음). 실서버 화면에서 선택자·대기 시간이 맞는지는 첫 실행에서 드러난다.
- 28행 중 자동 11·조건부 2(계정 C·옵트인)·수동 15. 수동은 구글 OAuth·서버 SQL·31일 시각 이동·기능 구현 전 티켓이다.
- mock 은 클라이언트 배선 점검이다. 원격 로그아웃(RA-SET-01)은 가짜 서버가 다른 기기 세션 무효화를 흉내 내지 않아 mock 에서 뺐다.
- 정리는 `checkins.text`·`goals.title`·`team_ping_replies.message`·`team_pings.message` 에 runTag 가 든 자기 행 + 동반자 목록의 테스트 상대만 지운다. RLS 가 삭제를 막으면 `leftover` 에 남긴다.

## 5. [원칙 ⑤] 절차

1. 오늘 PR claims 의 unverified 항목·노션 티켓 완료 기준 수집 → 2. 시나리오 표 → 3. 하네스(본체·단계·mock) → 4. 계정 없음 실행·mock 실행 → 5. README·REQ/PLAN·claims·TICKETS·dev_log → 6. PR(심사 청구).

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- **반론 1**: "작업자가 만든 하네스의 '통과'는 자가채점이다." → 맞다. 그래서 결과 파일은 '작업자 예비 증거, 판정 아님'을 적고, 주장 파일은 도구에 무엇이 들어 있는가(글자)와 실계정 재생은 `needs-two-accounts` 로만 낸다. 판정은 법정만 한다.
- **반론 2**: "실서버에서 돌리면 운영 사용자 데이터를 건드린다." → 하네스는 주소에 `ogtest` 가 든 계정만 받고, 검색 결과에서는 상대 테스트 계정 uid 버튼만 누르며, 서버 건수는 작성자 = 테스트 계정으로 거른 건수만 센다(내용 안 받음). 목표는 '나만 보기'로 만든다. 끝에 runTag 붙은 자기 행만 지우고 남은 것을 기록한다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- 환경 변수 없이 실행 → 종료 코드 2, 28개 모두 `못 함`, 브라우저 미기동(`out-real-account-none-2026-10-04.json`).
- 조건 위반(ogtest 없음·A=B) 실행 → 종료 코드 3, 접속 0.
- mock 실행(`--mock <워크트리>`) → `out-real-account-mock-2026-10-04.json`.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님) · 막히는 지점

- mock 재생 9개: 통과 7, 실패 2(`RA-CORE-SWITCH` A 로그아웃→B 로그인 시 A 기록이 B 화면에 보임, `RA-COMM-04B` B 가 꺼져 있어도 '도착' 표시·열람 뒤에도 '읽음' 안 됨), 정리: 만든 행 전부 삭제·남은 것 0.
- 막히는 지점: 실서버 첫 실행에서 대기 시간(실시간·30초 폴링), 원격 로그아웃 60초 보호 시간, AI 피드백 시트가 하단 탭을 덮는 것(`#btnCheckinAiClose` 로 닫음).

## PLAN 체크리스트

- [x] [1단계: REQ] 지시 원문·식별자 정리
- [x] [2단계: PLAN] 8원칙 작성
- [x] [3단계: 구현] 표·하네스·mock·안내·산출물
- [x] [4단계: 심사 청구] PR 생성·`node court/chat.js <PR>` 판정 대기

## 제안 (축 미확정 — 구현 금지)
- (없음)
