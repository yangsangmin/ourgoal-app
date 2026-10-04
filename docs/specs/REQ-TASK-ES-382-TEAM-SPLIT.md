# REQ — #TASK-ES-382 팀 세포 쪼개기 1차: js/team-invite-comm.js 에서 팀 초대·영입 모달·공유 묶음 떼기 (동작 그대로) + R 피드 공유 DM 대화방 id

- 근거: 쪼개는 순서 4번(팀 세포), 틀 `docs/specs/MODULE-SPLIT-PROTOCOL.md`, 선례 #675 toast·#677 modal·#690 confirm 통로, #680 `js/tabs/comm/dm-ledger.js`, 도구 선례 `docs/design/harness/module-split/gen-records.js`·`verify-records.js`·`dom-compare-records.js`.
- 범위(책임 단위 두 묶음): ① 팀 초대·영입 모달 `openTeamInviteModal`(이전 전 30~430줄)·`openScoutToTeamModal`(3452~3579줄) → `js/team-recruit.js` ② 공유 — 공유 카드 3대 버튼 `postShareCardToFeed`·`shareCardExternal`·`saveCardImage`(1025~1143줄)·피드 글 공유 모달 `openFeedShareModal`(3240~3450줄) → `js/team-share.js`.
- 기능 추가·삭제 0. 전역 노출(`window.OurgoalTeamInviteComm` 키 42개와 순서, `window.*` 이름 8개)은 그대로이고, 새 전역은 키트 `window.OurgoalTeamCommKit` 1개뿐이다(선례 `OurgoalRecordsKit`·`OurgoalDmLedger` 와 같은 꼴).
- 별도 지시 항목 R(코디네이터 추가, #697 빌더 발견): 피드 공유 DM 이 대화방 id 를 `'dm_'` 없이 만들어 대화방 화면·읽음 표시에서 빠지던 결함 1줄 수정. 옮기기 커밋(2fa6fc2)과 수정 커밋(72287de)을 나눴다.

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지

1. `js/team-invite-comm.js`(4,105줄, 800줄 넘는 세포)를 책임 단위로 나눈다. 각 800줄 이하, part1/part2 금지. 전역 노출·호출 순서·동작 그대로. 범위가 크면 이번 PR 은 2~3묶음만 떼고 원본은 남은 부분만 갖게(줄 수 감소), 나머지는 보고.
2. 시험지는 `index.html + js/tabs/** + js/core/*` 합본으로 읽는다 — 새 파일 위치와 기존 시험이 이 파일 글자를 직접 찾는지 먼저 확인. 시험이 깨지면 기대값을 바꾸지 말고 보고.
3. 실계정 전후: 로컬 127.0.0.2 정적 서버 + `/api` 운영 전달, 기준 사본은 `git archive`(stash 금지). RA-COMM-03·04A·04B 를 기준·작업 사본에서 비교. 주소·비밀번호 출력·기록 0, 테스트 계정 둘의 데이터만.
4. 신고서 `module-specs --write`, 모듈 가드·기준선. 동결 파일 변경 0, retire 0, 기대값 낮추기 0.
5. R: 피드 공유 DM 대화방 id 를 `getDmThreadId(myId, peerId)` 로 바꾸는 1줄, 부품 시험으로 기준 실패 → 작업 통과를 증명.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- 본질: 4천 줄 한 IIFE 에 팀 초대·팀 채팅·템플릿·공유 카드·DM·동반자·피드 공유·영입·자동 생성 핸들러가 한 클로저로 묶여 있어, 한 곳을 고칠 때 전체를 읽어야 한다. 쪼개기의 첫걸음은 "다른 부분과 공유하는 상태가 적은 묶음"부터 떼는 것.
- 핵심 제약(측정): `scripts/smoke-test.js` 가 이 파일을 **직접** 읽어 글자를 찾는 단언이 16개 검사 블록·약 120개 글자다(합본이 아니라 `js/team-invite-comm.js` 한 파일). 그 글자가 원본에 하나도 남지 않게 옮기면 기준 시험지가 깨진다. 그래서 단언 글자를 줄 번호로 지도화했고, "그 묶음에만 있는 단언 글자"가 없는 묶음만 이번에 옮겼다.
  - 이번에 옮긴 6개 함수: 안의 단언 글자가 모두 원본 다른 곳(예: `fetch('/api/track'`·`navigator.share`·`showGuestSoftAuthGate`)이나 노출 객체(`openTeamInviteModal: openTeamInviteModal`)에도 있다.
  - 못 옮긴 것(유일 글자): 팀 채팅 `team_chat_room_`, 템플릿 미리보기 `id="tplPreviewShareBtn"`·`이 템플릿으로 시작`, DM `DM_READ_PREFIX = 'ourgoal_dm_read_'`·`id="dmFollowBackBanner"` 등, 동반자 `자가 치유 동기화 예외`·`safeAvatarHtml(c.avatar, 44)`, 프로필 `실천 히트맵`, 검색 `tagMatch[0].toLowerCase()`·`🔥 Lv.`, 자동 핸들러 `async function handle팀목표_Item25Action(` 등.
- 위치: 지시의 [기본값] 두 곳을 시험으로 재 보니 둘 다 기준 시험이 깨진다 —
  - `js/tabs/comm/`: 합본(APP_SRC)에 새로 들어가 `#TASK-ES-155` 단언 `indexSrc.includes('showToast(') === false` 가 깨진다(실측: 442/443). 옮긴 코드에 `T.showToast(` 가 있다.
  - `js/team/`: `scripts/verify-all-clicks.js` 가 핸들러 소스로 `js/` 바로 아래 파일만 읽어(하위 폴더는 `js/tabs`·`js/core` 만) 범위에서 빠진다.
  - [기본값] → `js/` 바로 아래(`team-invite-comm.js`·`team-linked-goals.js`·`team-visibility-levels.js` 와 같은 자리). 모든 시험의 읽는 범위가 이전과 같다(측정: 4절). 기대값은 하나도 안 바꿨다.

## 3. [원칙 ③] 해결방식

- 생성기 `docs/design/harness/module-split/gen-team-split.js`: `@babel/traverse` 스코프 분석으로 옮길 함수가 읽는 원본 IIFE 이름을 뽑아 `T.<이름>` 으로만 바꾸고(IIFE 인자 `global` 은 새 파일도 같은 값을 같은 이름으로 받아 그대로), 함수와 그 위 섹션 머리 주석을 글자 그대로 옮긴다. 원본에서 지운 자리에는 한 줄 안내 주석.
- 원본 IIFE 맨 위('use strict' 다음): ① `var openTeamInviteModal = _teamKit.openTeamInviteModal;` … 6줄(함수 선언 끌어올림과 같은 효과 — 이 줄보다 먼저 도는 문이 없다) ② `Object.defineProperties(_teamKit.scope, …{ get esc(){ return esc; } … })` — 옮긴 코드가 읽는 이름 9개(+R 1개)만 getter 로. 값은 읽을 때마다 살아 있는 값(`_ctx` 재대입 뒤의 `showToast` 등).
- `index.html`: 원본 `<script src="js/team-invite-comm.js?v=20260916-es131">` 바로 앞에 `js/team-recruit.js`·`js/team-share.js` 태그 2개(소통 탭 렌더 코드는 손대지 않음 — comm-cell 담당). 원본 태그의 버전 글자는 시험이 고정하므로 그대로.
- R: `js/team-share.js` `openFeedShareModal` 의 `var threadId = [myId, peerId].sort().join('_');` → `var threadId = T.getDmThreadId(myId, peerId);` 1줄 + 원본 통로에 `get getDmThreadId` 1줄.

## 4. [원칙 ④] 재검토 — 한계(정직하게)

- 원본은 여전히 3,276줄로 800줄을 넘는다(④ 800줄 초과 파일 수는 10 그대로, 줄 수만 -829). 남은 묶음은 기준 시험지가 원본 파일 글자를 직접 찾는 단언 때문에, 시험지를 "원본 + 새 팀 파일" 합본으로 읽게 고친 선행 PR(제품 0·기대값 0)이 병합된 뒤에 옮길 수 있다(프로토콜 5절 5항과 같은 순서).
- 실계정 RA-COMM-03 은 기준·작업 양쪽에서 통과와 실패가 번갈아 나왔다(기준 실패·통과, 작업 통과·실패·실패, 실패 단계는 늘 "검색 결과에 상대 테스트 계정 버튼 없음"). 이 변경이 건드리지 않는 동반자 검색(`renderCommTopInviteSearch`, 원본에 그대로)의 흔들림으로 본다 — 결함 후보로 보고.
- 로그인 상태 모달 비교에서 계정 A 의 동반자·이끄는 팀이 0 이라 동반자 초대 버튼·피드 공유 DM 버튼·팀 영입 버튼은 그려지지 않았다(눌러 보지 못함). R 의 실서버 전송은 하지 않았다(지울 수 없는 DM 행이 남는다 — RLS). R 은 부품 시험으로만 증명.
- R 이후 푸시 태그는 `'dm_' + threadId` 라 `dm_dm_…` 가 된다(알림 묶음 키일 뿐, 1줄 지시 범위 밖이라 그대로 둠). DM 화면 전송은 `'dm-' + threadId` 를 쓴다 — 태그 형식 통일은 별도 티켓.
- 서비스워커 캐시: 원본 태그 버전을 못 올리므로, 옛 원본이 캐시에 남은 사용자는 옛 원본(자체 완결) + 새 파일 2개를 받는다. 옛 원본은 키트를 쓰지 않아 동작은 이전과 같다(#680 선례도 같은 판).

## 5. [원칙 ⑤] 절차

1. 기준 사본 `git archive HEAD`(0e9a1e8) → 스크래치. 2. 단언 글자 지도로 옮길 묶음 확정. 3. 생성기 실행. 4. `verify-team-split.js`(토큰 동일·누수·노출·실행 순서). 5. `npm test` 기준·작업. 6. `module-specs --write`·`module-guard --update`. 7. 게스트 조작 비교 `dom-compare-team.js`(기준 2회·후 1회) + `tab-check.js comm,goals`(기준 2회·후 1회). 8. 실계정 하네스 RA-COMM-03·04A·04B 기준·작업 + 로그인 상태 모달 비교. 9. 옮기기 커밋 → R 수정·부품 시험 커밋. 10. REQ·claims·dev_log·TICKETS, PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "새 키트 전역(`OurgoalTeamCommKit`)은 '전역 이름을 새로 늘리지 않는다' 원칙 위반이다." → 원칙의 뜻은 옮긴 **함수**를 `window.<함수>` 로 달아 다른 파일 분기가 새로 도는 것을 막는 것. 옮긴 함수 6개는 window 에 달지 않았고(실행 비교: window 이름 8개 동일, 새 이름은 키트 1개), 키트 1개는 기록·목표 탭 선례(`OurgoalRecordsKit`·`OurgoalGoalsKit`)와 같은 꼴이다. 다른 파일 어디도 `OurgoalTeamCommKit` 을 찾지 않는다(grep 0).
- 반론 2: "`js/` 바로 아래는 프로토콜이 말한 `js/tabs/**` 가 아니어서 법정 합본 시험이 옮긴 코드를 못 찾는다." → 이 파일의 기존 단언은 합본이 아니라 원본 한 파일을 직접 읽는다. 옮긴 묶음의 단언 글자는 모두 원본에 남아 있어 같은 단언이 같은 결과(443/443)다. 오히려 `js/tabs/comm/` 이 기준 단언 1개를 깨뜨린다(실측). verify-all-clicks 범위(`js/` 바로 아래)도 그대로라 버튼 943/943 이 같다.
- 반론 3(R): "옮기기 PR 에 동작 변경을 섞으면 '옮기기만' 증명이 흐려진다." → 커밋을 나눴고, 검사기는 R 한 곳만 허용 목록(`PATCHES`)으로 이전 전 글자에 같은 수정을 적용한 뒤 나머지 토큰 동일을 그대로 검사한다. 옮기기 커밋만으로도 부품 시험이 기준과 같은 3/5(같은 실패)라 옮기기 자체는 동작을 안 바꿨다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- 새 파일: `js/team-recruit.js`(553줄) — `openTeamInviteModal(gid, groupsPool)`·`openScoutToTeamModal(targetUser)`, DOM `#closeInviteModalBtn`·`#tabTeamInviteInner`·`#tabTeamInviteOuter`·`.btn-invite-comp`·`#teamInviteSearchInput`·`#teamInviteSearchBtn`·`.btn-recruit-user`·`#btnInviteKakao`·`#btnInviteSms`·`#btnInviteCopy`·`#btnCloseScoutModal`·`#btnGoCreateTeamGoal`·`[data-scoutteamid]`.
- 새 파일: `js/team-share.js`(358줄) — `postShareCardToFeed(g, lastRec, canvasDataUrl)`·`shareCardExternal`·`saveCardImage`·`openFeedShareModal(post)`, DOM `#btnCloseFeedShareModal`·`#btnShareExternalSNS`·`[data-sharecompdm]`·`[data-shareteamchat]`.
- 원본: `js/team-invite-comm.js` 4,105 → 3,276줄, 머리 이음매 `_teamKit`·`Object.defineProperties(_teamKit.scope, …)`.
- `index.html`: script 태그 2개(같은 줄 2297).
- 도구: `docs/design/harness/module-split/gen-team-split.js`·`verify-team-split.js`·`dom-compare-team.js`. 시험: `tests/feed-share-dm-thread-es382.test.js`.
- 신고서: `docs/architecture/modules.json` `team-recruit`(hybrid, spans goals·comm)·`team-share`(hybrid, spans comm). 기준선 `docs/architecture/module-baseline.json` ④ `js/team-invite-comm.js` 4105 → 3276.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

| 항목 | 도구 | 결과 |
| :-- | :-- | :-- |
| 글자 동일 | `verify-team-split.js` | 6개 함수 토큰열 동일(T./K. 접두·주석 제외, R 1곳은 허용 목록), 누수 0·미노출 0·노출됐는데 안 씀 0·원본에 남은 정의 0·안 가져온 함수 0. 실행: `OurgoalTeamInviteComm` 키 42개·순서 동일, 옮긴 함수 = 키트 함수, window 이름 8개 동일(새 이름은 `OurgoalTeamCommKit` 1개) — `reports/TASK-ES-382/verify-team-split.json` `ok: true` |
| npm test | `NODE_PATH=… npm test` | 기준·작업 같음 — smoke-test 443/443 · verify-integrity-gate 38/38 · verify-all-clicks 버튼 943/943 · test-shipyard-modular 통과(모듈 파일 40 그대로) · 모듈 가드 통과 |
| 조작 전후(게스트) | `dom-compare-team.js` | 34단계(초대 모달 열기·탭 전환·검색·복사·문자·닫기, 모르는 팀 id, 영입 모달 열기·팀 만들기 이동·닫기, 피드 공유 모달 열기·외부 공유·닫기, 공유 카드 이미지 저장·외부 공유·피드 게시 확인/취소, 다시 그리기) × 13칸 = 442값, 기준 대 후 다른 값 0, 기준 대 기준 0, 콘솔 오류 0/0 — `reports/TASK-ES-382/dom-compare-team.json` |
| 탭 실측(게스트) | `tab-check.js comm,goals` 기준 2회·후 1회 → `tab-compare.js` | (아래 9절) |
| 실계정 하네스 | `real-account-check.js --only RA-COMM-03,RA-COMM-04A,RA-COMM-04B`, 로컬 127.0.0.2 + /api 운영 전달 | RA-COMM-04A·04B 다섯 번 모두 통과(기준 2·작업 3). RA-COMM-03 기준 실패·통과, 작업 통과·실패·실패(같은 단계, 4절) — `reports/TASK-ES-382/real-account-comm.json`. 지우지 못한 DM 행 2~3건(테스트 계정 A 작성, RLS 로 삭제 불가 — 하네스 기존 한계) |
| 로그인 상태 모달 | 작업자 보조(같은 로컬 방식, 계정 A, 읽기만) | 7단계 49값, 기준 대 옮기기만 0·기준 대 최종 0, 콘솔 오류 같은 12건(정적 서버에 없는 자원 404·운영 API 400) |
| R 부품 시험 | `tests/feed-share-dm-thread-es382.test.js` | 기준 사본 3/5(team_pings.id·team_ping_replies.ping_id 2건 실패) → 옮기기만 3/5(같은 실패) → 최종 5/5 — `reports/TASK-ES-382/unit-feed-share-dm-thread-*.json` |
| 모듈 가드 | `node scripts/module-guard.js` | ① 34,257 · ② 677 · ③ 282 그대로 · ④ 10 그대로(800줄 초과 수), `js/team-invite-comm.js` 4,105 → 3,276줄. 기준선 낮춤 |

폐기(retire) 청구 없음. 시험 기대값 변경 0. 동결 파일 변경 0.

## 9. 탭 실측(게스트) 결과

(측정 뒤 채움)

## 10. 남은 범위(다음 PR)

원본 3,276줄에 남은 책임 묶음 — 팀 채팅(`openTeamChatModal`·`handlePingSentAutoReply`), 추천 템플릿(`openTemplatePreviewModal`·`openRecommendTemplateModal`·`renderTemplatesAccordionHtml`·`wireTemplatesAccordionEvents`), DM 수신·읽음(`getDmReadMap`~`startSmartDmPolling`), DM 화면(`renderSingleDmMsg`·`loadDmMessagesFromDb`·`subscribeRealtimeDm`·`renderCommDM`), 동반자 원장·신원(`isKnownAiCompanion`~`persistCompanions`), 프로필 모달(`openUserProfileModal`·`copyCompanionInviteLink`), 동반자 검색·목록(`renderCommTopInviteSearch`·`renderCommCompanions`), 자동 생성 핸들러 5개(`handle…Item25/28/30/37/39Action`). 모두 기준 시험지가 원본 파일 글자를 직접 찾는 단언이 있어, 시험지를 "원본 + js/team-*.js" 합본으로 읽게 고친 선행 PR(제품 0·기대값 0)이 먼저다.

* **체크리스트 마감 규칙**: 본 작업계획서는 [4단계: 심사 청구]까지만 등록함.
