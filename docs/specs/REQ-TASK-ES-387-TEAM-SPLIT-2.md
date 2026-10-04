# REQ — #TASK-ES-387 팀 세포 쪼개기 2차: js/team-invite-comm.js 에 남은 묶음 8개를 js/team-*.js 로 떼기 (동작 그대로)

- 근거: 1차 #701(TASK-ES-382) REQ 10절 "남은 범위", 선행 시험지 #703(TASK-ES-388, 팀 합본 — 병합 d11a62c), 틀 `docs/specs/MODULE-SPLIT-PROTOCOL.md`, 도구 선례 `docs/design/harness/module-split/gen-team-split.js`·`verify-team-split.js`·`dom-compare-team.js`.
- 범위(책임 단위 8묶음, 함수 30개): ① 팀 톡방 → `js/team-chat.js` ② 추천 템플릿 → `js/team-templates.js` ③ DM 수신함 → `js/team-dm-inbox.js` ④ DM 대화방 → `js/team-dm-room.js` ⑤ 프로필 모달·초대 링크 → `js/team-profile.js` ⑥ 상단 초대·검색 바 → `js/team-companion-search.js` ⑦ 동반자 탭 → `js/team-companions.js` ⑧ 자동 생성 직통 핸들러 5개 → `js/team-auto-actions.js`.
- 기능 추가·삭제 0. 전역 노출(`window.OurgoalTeamInviteComm` 키 42개와 순서, `window.*` 이름 9개)·호출 순서·동작 그대로. 새 전역 0(키트 `OurgoalTeamCommKit` 는 1차에서 이미 있다).

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지

1. 1차 PR 의 REQ·생성기·verify·dom-compare·reports 를 정독하고 같은 방식으로 남은 묶음을 책임 단위로 더 뗀다. 목표: 원본 800줄 이하. part1/part2 금지.
2. 실계정 전후: Vercel 미리보기 한도로 막혀 로컬 127.0.0.2 정적 서버 + `/api` 운영 전달, 기준은 `git archive` 사본(stash 금지). RA-COMM-03·04A·04B + 로그인 A·B 상태 화면·모달 DOM 비교. 주소·비밀번호 출력 0, 테스트 계정 둘의 데이터만.
3. 신고서 `module-specs --write`, 모듈 가드·기준선. 동결 파일 수정 0, retire 0, 기대값 낮추기 0. 화면에서 기능이 사라지면 멈춘다.
4. 코디네이터 중간 지시: 원본 한 파일을 직접 읽는 기준 시험지 때문에 시험지 선행 PR(TASK-ES-388)을 먼저 — #703 으로 병합됨. 그 뒤 main 을 합쳐 이 PR.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- 본질: 3,276줄 한 IIFE 에 팀 톡방·템플릿·DM 수신·DM 화면·동반자·프로필·검색·자동 핸들러가 한 클로저로 묶여 있다. 쪼개는 단위는 "같이 바뀌는 코드" — 화면 입구가 같은 함수 묶음이다.
- 원인(측정): 묶음 사이는 함수 호출과 **상태 변수 9개**로 얽혀 있다. 특히 `_incomingDmRooms`(수신함이 대입·대화방이 대입·원본의 `getTeamMembersPool`·`getDmPerson` 이 읽음), `_incomingDmLoadedForUser`(수신함이 대입·대화방이 읽음) 처럼 묶음을 건너 대입되는 상태가 있다. 1차 생성기는 원본 스코프 이름에 대입하면 멈췄다.
- 중심: 상태는 **원본에 그대로 둔다**. 옮긴 코드는 키트 통로 `OurgoalTeamCommKit.scope` 의 getter 로 읽고, 대입하는 상태 6개(`_activeDmChannel`·`_hasUnreadDm`·`_incomingDmChannel`·`_incomingDmLoadedForUser`·`_incomingDmRooms`·`_smartDmPollingTimer`)만 setter 를 둔다 — 원본 함수가 읽는 변수가 같은 변수로 바뀐다. 시험이 원본을 `require` 캐시를 비우고 다시 읽으면 상태가 새로 시작되는 동작도 그대로다(상태를 부품 파일로 옮기면 부품 캐시에 남아 달라진다).
- 핵심 제약: 기준 시험지가 이제 팀 합본(#703)을 읽으므로, 옮긴 글자는 부품에 있어도 찾힌다. 단 부품은 `OurgoalTeamCommKit` 표식이 있어야 합본에 든다 — 생성기는 1차와 같은 키트 꼴을 쓴다.

## 3. [원칙 ③] 해결방식

- 생성기 `docs/design/harness/module-split/gen-team-split-2.js`: `@babel/traverse` 스코프 분석으로 옮길 30개 함수가 읽는 원본 IIFE 이름을 뽑아 바꾼다 — 원본에 남는 이름 → `T.<이름>`, 다른 새 파일의 함수·1차에 옮긴 함수 → `K.<이름>`, 같은 파일 안 호출·IIFE 인자 `global` 은 그대로. 같은 파일로 가는 함수가 다른 문 없이 이어지면 한 블록으로(첫 함수 바로 위에 붙은 주석 함께), 원본의 그 자리에 한 줄 안내 주석.
- 원본 머리 이음매(1차 것을 넓힘): ① node `require` 줄에 새 파일 8개 ② `var openTeamChatModal = _teamKit.openTeamChatModal;` … 30줄(함수 선언 끌어올림과 같은 효과 — 이 줄들보다 먼저 도는 문이 없다) ③ `Object.defineProperties(_teamKit.scope, …)` 통로를 1차 이름 10개 + 이번 이름으로 다시 씀: getter 23개, setter 6개.
- 원본에 남긴 것: 상태 변수, 공용 함수(`esc`·`getApp*`·`showGuestSoftAuthGate`·`getDmThreadId`·`getTeamMembersPool`·`getDmPerson`), 동반자 신원·원장(`isKnownAiCompanion`~`persistCompanions`), 노출 객체 `global.OurgoalTeamInviteComm`, 자동 핸들러의 노출 문(`global.OurgoalTeamInviteComm.handle… =`·`window.handle… =`·`module.exports…`), `window.toggleDmMsgDetail =`·`global.copyCompanionInviteLink =` — 문의 순서·자리 그대로.
- `index.html`: 1차 태그(`team-recruit.js`·`team-share.js`) 뒤, 원본 태그 앞에 새 태그 8개(같은 줄). 원본 태그의 버전 글자는 시험이 고정하므로 그대로.
- 위치 [기본값]: `js/` 바로 아래(1차와 같은 이유 — `js/tabs/comm/` 은 #TASK-ES-155 `showToast(` 부재 단언, `js/team/` 은 verify-all-clicks 범위 밖).

## 4. [원칙 ④] 재검토 — 한계(정직하게)

- 원본 3,276 → 590줄(800줄 이하 달성). 새 파일 8개 모두 800줄 이하(최대 `team-dm-room.js` 542줄). 남은 범위 없음 — 원본에 남은 것은 이음매·상태·공용 함수·동반자 원장·노출 문이다. 원장 묶음(`isKnownAiCompanion`~`persistCompanions`, 약 190줄)을 더 뗄 수 있으나 800줄 목표 밖이라 이번엔 두었다.
- 게스트·로그인 비교에서 눌러 보지 못한 단계: 동반자 카드(`[data-viewprof]`)·DM 대화방(`[data-open]`) — 게스트와 테스트 계정 A·B 모두 동반자 0명(하네스 정리가 지움), 게스트는 DM 방 0개. 로그인 B 는 DM 방 2개가 그려졌지만 열지 않았다(열면 읽음 표시가 서버에 써져 회차마다 상태가 바뀐다). 대화방 열기·전송은 실계정 하네스 RA-COMM-04A·04B 가 기준·작업 양쪽에서 통과했다.
- 레거시 템플릿 아코디언(`__FORCE_LEGACY_TPL_ACCORDION`)의 분류 칩·미리보기 칩은 펼친 뒤에도 없어 누르지 못했다(기준·작업 같음).
- 서비스워커 캐시: 원본 태그 버전을 못 올린다(시험 고정). 옛 원본이 캐시에 남은 사용자는 옛 원본(1차 판 — 자체 완결 + 1차 부품) + 새 부품 8개를 받는다. 옛 원본은 2차 키트 함수를 쓰지 않아 동작은 이전과 같다(1차와 같은 판).
- 실계정 회차마다 지우지 못한 DM 행(테스트 계정 A 작성, team_ping_replies 2·team_pings 1 — RLS 로 삭제 불가, 하네스 기존 한계)이 남는다.

## 5. [원칙 ⑤] 절차

1. 시험지 선행 PR #703(TASK-ES-388) 병합 대기 → 2. origin/main(d11a62c) 합침, 기준 사본 `git archive d11a62c` (도중 #702 ES-386 이 들어와 다시 합치고 기준을 d9bd7f0 `git archive` 로 바꿔 6·8·9 단계를 다시 쟀다 — 8절 수치는 d9bd7f0 기준) → 3. 상태 변수 지도(누가 읽고 누가 대입하나) → 4. 생성기 → 5. `verify-team-split-2.js` → 6. `npm test` 기준·작업, tests/*.test.js 전부 기준·작업 → 7. `module-specs --write`(손 칸 kind·role·spans)·`module-guard --update` → 8. 게스트 조작 비교 `dom-compare-team-2.js`(기준 2회·후 1회) + `tab-check.js comm,goals`(기준 2회·후 1회) + 법정 모듈 로드 탐침(로컬) → 9. 실계정 하네스 RA-COMM-03·04A·04B 기준·작업 + 로그인 A·B 화면·모달 비교(기준1·작업·기준2) → 10. 커밋·REQ·claims·dev_log·TICKETS·PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "setter 통로는 1차에 없던 새 결합이다 — 옮긴 코드가 원본 상태를 바꾸는 길이 하나 더 생겼다." → 바뀌는 상태·바꾸는 코드는 이전과 같다(같은 함수가 같은 변수에 대입). 달라진 것은 대입이 `T.x = v` → setter `x = v` 를 거친다는 것뿐이고, 검사기가 ① 옮긴 코드가 대입하는 이름 = setter 목록(빠짐 0·남음 0) ② 실행 중 setter 로 쓴 값이 getter 로 같은 객체로 읽힘(`setterRoundTrip`)을 잰다. 상태를 부품으로 옮기는 길은 원본 `getTeamMembersPool`·`getDmPerson` 이 읽는 `_incomingDmRooms` 때문에 역방향 통로가 필요해 더 복잡하고, require 캐시 비우기 동작을 바꾼다.
- 반론 2: "원본이 590줄이 됐어도 머리 이음매(가져오기 36줄·통로 31줄)가 커져 읽기 어렵다." → 이음매는 생성기가 스코프 분석으로 만든 목록이라 손으로 고칠 일이 없고, 목록이 곧 "원본이 세포들과 주고받는 이름 전부"라는 명세다. 대신 원본 본문은 2,686줄 줄었다.
- 반론 3: "자동 생성 핸들러 5개를 한 파일로 묶는 것은 책임 단위가 아니라 출처 단위다." → 다섯 함수는 같은 생성기 틀(직통 이벤트 바인딩·햅틱·토스트·원자적 저장)을 공유하고 같은 시험 묶음(ES-AUTO 25/28/30/37/39)이 본다. 소통·팀 화면 묶음에 흩어 넣으면 생성기 틀이 여러 세포에 퍼진다. 노출 문은 원본 자리에 그대로 두어 호출 순서가 같다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- 새 파일(키트 부품 — `global.OurgoalTeamCommKit`):
  - `js/team-chat.js`(252줄) — `openTeamChatModal(gid, groupsPool)`·`handlePingSentAutoReply(ping, gid)`, DOM `#teamChatMsgBox`·`#teamChatInput`·`#btnSendTeamChat`·`#btnCloseTeamChat`·`[data-qcidx]`.
  - `js/team-templates.js`(387줄) — `openTemplatePreviewModal(tmplId)`·`openRecommendTemplateModal(t, compList)`·`renderTemplatesAccordionHtml()`·`wireTemplatesAccordionEvents(container, onRerender)`, DOM `#tplPreviewShareBtn`·`#tplPreviewStartBtn`·`#tplPreviewStartTeamBtn`·`#tplPreviewGiftBtn`·`#tplPreviewCloseBtn`·`#closeRecomModalBtn`·`#toggleTemplatesBtn`·`#ourgoalTemplatesCard`.
  - `js/team-dm-inbox.js`(286줄) — `getDmReadMap`·`markDmRoomRead`·`markDmThreadAsRead`·`updateDmUnreadBadge`·`getDmUnreadStatus`·`loadIncomingDmRooms`·`initIncomingDmListener`·`startSmartDmPolling`.
  - `js/team-dm-room.js`(542줄) — `formatDmTime`·`formatDmDetailTime`·`toggleDmMsgDetail`·`renderSingleDmMsg`·`loadDmMessagesFromDb`·`subscribeRealtimeDm`·`renderCommDM(body)`, DOM `#dmMsgs`·`#dmInput`·`#dmSend`·`#dmBack`·`#dmFollowBackBanner`·`#btnDmFollowBack`·`[data-open]`·`[data-openteamdm]`.
  - `js/team-profile.js`(212줄) — `openUserProfileModal(user)`·`copyCompanionInviteLink(e)`, DOM `#userProfAddCompBtn`·`#userProfDmBtn`·`#userProfCloseBtn`.
  - `js/team-companion-search.js`(330줄) — `renderCommTopInviteSearch(container)`, DOM `#btnCopyCompanionInviteLink`·`#companionNicknameSearchInput`·`#companionSearchBtn`·`#companionSearchResetBtn`·`#companionSearchResultsSlot`.
  - `js/team-companions.js`(504줄) — `renderCommCompanions(body)`, DOM `[data-viewprof]`·`[data-delcomp]`·`[data-directdm]`·`[data-addcomp]`·`[data-request-companion]`.
  - `js/team-auto-actions.js`(443줄) — `handle팀목표_Item25Action`·`handle소통_Item28Action`·`handle소통_Item30Action`·`handle팀목표_Item37Action`·`handle팀목표_Item39Action`.
- 원본: `js/team-invite-comm.js` 3,276 → 590줄, 머리 이음매 `_teamKit`·`Object.defineProperties(_teamKit.scope, …)`(get 23·set 6).
- `index.html`: script 태그 8개(1차 태그와 같은 줄).
- 도구: `docs/design/harness/module-split/gen-team-split-2.js`·`verify-team-split-2.js`·`dom-compare-team-2.js`.
- 신고서: `docs/architecture/modules.json` 새 세포 8개(hybrid, spans comm 또는 goals·comm), 기준선 `docs/architecture/module-baseline.json` ④ `js/team-invite-comm.js` 항목 없어짐(800줄 이하), ④ 10 → 9.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

| 항목 | 도구 | 결과 |
| :-- | :-- | :-- |
| 글자 동일 | `verify-team-split-2.js` | 30개 함수 토큰열 동일(T./K. 접두·주석 제외, 수정 허용 목록 0), 누수 0·미노출 0·노출됐는데 안 씀 0·대입하는데 setter 없음 0·setter 남음 0·원본에 남은 정의 0·안 가져온 함수 0, 새 파일 모두 800줄 이하. 실행: `OurgoalTeamInviteComm` 키 42개·순서 동일, 키트 함수 36개 = 노출 키(31개)·window 이름(7개)과 같은 객체, window 이름 9개 동일·새 이름 0, setter 왕복 참 — `reports/TASK-ES-387/verify-team-split-2.json` `ok: true` |
| npm test | `NODE_PATH=… npm test` | 기준(d9bd7f0)·작업 같음 — smoke 443/443(검사 제목 목록 동일) · 무결성 38/38 · 버튼 943/943 · 셀 구조 42 · 모듈 가드 통과(④ 10 → 9) — `reports/TASK-ES-387/test-compare.json` |
| tests 전부 | `tests/*.test.js` 97개 기준·작업 | 종료 코드 97/97 같음(27개는 기준에서도 실패 — 기존). 팀 파일을 읽는 13개는 경로·시간 글자를 뺀 출력까지 같음 |
| 법정 모듈 로드 탐침 | `court/probes/module-load.js`(로컬 호출) | 회귀 0, 새 파일 8개 모두 단독 로드 성공 |
| 조작 전후(게스트) | `dom-compare-team-2.js`(기준 d9bd7f0) | 46단계 × 13칸 = 598값, 기준 대 후 0, 기준 대 기준 0, 콘솔 오류 0/0 — `reports/TASK-ES-387/dom-compare-team-2.json` |
| 탭 실측(게스트) | `tab-check.js comm,goals --deadclick off` 기준 2회·후 1회 → `tab-compare.js` | 816값, 기준 대 기준 0 · 기준 대 작업 0 · 기준2 대 작업 0 |
| 실계정 하네스 | `real-account-check.js --only RA-COMM-03,RA-COMM-04A,RA-COMM-04B`, 로컬 127.0.0.2 + /api 운영 전달 | 기준 3/3 · 작업 3/3 — `reports/TASK-ES-387/real-account-comm.json`(주소·계정 가림). 회차마다 지우지 못한 DM 행 3건(4절) |
| 로그인 A·B 화면·모달 | 작업자 보조(같은 로컬 방식, 읽기만) | 계정마다 11단계 × 7칸 = 77값, 기준1 대 작업 0 · 기준1 대 기준2 0 · 기준2 대 작업 0, 콘솔 오류 A 13·B 8 세 번 같은 글자 — `reports/TASK-ES-387/login-comm-dom-compare.json` |
| 모듈 가드 | `node scripts/module-guard.js` | ① 34,058 · ② 669 · ③ 282 그대로 · ④ 10 → 9 · ⑤ 0. 기준선 낮춤(`--update`) |

폐기(retire) 청구 없음. 시험 기대값 변경 0. 동결 파일 변경 0. 시험 파일 변경 0.

* **체크리스트 마감 규칙**: 본 작업계획서는 [4단계: 심사 청구]까지만 등록함.
