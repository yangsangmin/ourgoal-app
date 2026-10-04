# REQ — #TASK-ES-379 소통 탭 메인 렌더를 js/tabs/comm/ 세포로 옮기기 1차 (동작 그대로)

- 근거: `docs/specs/MODULE-SPLIT-PROTOCOL.md`(4절 "로그인 흐름이 많은 목표·소통은 실계정 확인 뒤"), 선례 목표 탭 #689(TASK-ES-370)·#693(TASK-ES-375). 시험지 합본 읽기 #669·#670·#681.
- 범위(책임 단위 두 묶음): ① 소통 탭 메인 렌더 `renderCommScreen` + 그것만 부르는 위임 `renderCommDM`·`renderCommCompanions` → `js/tabs/comm/render.js` ② 피드 댓글·리액션 헬퍼 `SERVER_FEED_COMMENTS_CACHE`·`loadServerFeedComments`·`getFeedComments`·`setFeedComments`·`handleUserCommentSubmit`·`toggleFeedReaction` → `js/tabs/comm/feed-comments.js`. 통로는 기존 `js/core/app-scope.js`(바꾸지 않음).
- 기능 추가·삭제 0. 마크업(HTML)·CSS 는 옮기지 않았다. 이미 있는 `js/tabs/comm/dm-ledger.js`(#680)·`js/team-invite-comm.js`·`js/tabs/comm/index.js`·`sub-*.js` 는 건드리지 않았다.

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지

1. index.html 인라인 스크립트 안의 소통 탭 메인 렌더 함수와 그것만 쓰는 헬퍼를 `js/tabs/comm/` 세포로 옮긴다. 화면 결과 전후 동일.
2. 범위가 크면 책임 단위 1~2 묶음만 이번 PR 에 담고 나머지는 보고한다. 새 파일 800줄 이하, `part1/part2` 금지.
3. 소통은 두 계정이 주고받는 화면이라 게스트 실측만으로 부족하다 — 실계정 하네스 RA-COMM-03·RA-COMM-04A 를 기준 사본(`git archive`)·작업 사본에 돌리고, 로그인 A·B 상태 소통 탭 DOM 을 맞댄다. 운영 배포가 막혀 있어 로컬 127.0.0.2 정적 서버 + `/api` 운영 전달 방식으로 한다. 주소·비밀번호 출력·기록 0.
4. 신고서는 `module-specs --write`, 자리(`feed.card`·`reaction.kind`)는 실제로 꽂는 것만 — 꽂지 않으므로 planned. 모듈 가드·기준선. 동결 파일·기대값 변경 0, retire 0.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 소통 탭이 그려지는 코드가 3만 6천 줄 index.html 한 덩어리 안에 있어, 소통을 고칠 때마다 다른 탭과 같은 파일·같은 스코프를 만진다.
- **원인**: 소통 껍데기 세포(`js/tabs/comm/sub-feed.js` 등)는 `global.renderCommFeed` 를 찾지만(정의된 곳 없음 — 늘 `undefined`), 실제 렌더는 IIFE 지역 이름(state·saveProfile·sb …)에 묶여 인라인에만 있다.
- **중심**: `renderCommScreen`(48줄) — 요약 카드 숫자 3개, 서브탭 칩 6개(`[data-sub]`), 서브탭 분기(피드·팀·동반자·DM·마니또·공유). 분기 대상 중 피드·공유·팀·마니또 화면은 각각 수백 줄짜리 별개 책임이다.
- **핵심**: 글자 그대로 옮기고 이름 참조만 `L.<이름>`(app-scope getter)·`K.<이름>`(소통 키트 `OurgoalCommKit`)으로 바꾼다. 법정은 **기준 커밋의 시험지**로 채점하므로, 시험지가 index.html 한 파일에서 글자를 세거나 잘라 가는 함수는 이번에 옮기지 않는다.

## 3. [원칙 ③] 해결방식

- 생성기 `docs/design/harness/module-split/gen-comm.js`: 목표 2차 `gen-goals-2.js` 를 복제. 더한 것: ① 옮기는 함수만 쓰는 빈 객체 `var SERVER_FEED_COMMENTS_CACHE = {};` 한 줄도 같이 옮김(초기값이 빈 객체 리터럴이고 재대입 0·다른 파일 참조 0 을 검사) ② 같은 파일로 가는 이웃 선언 사이가 빈 줄뿐이면 한 덩어리로 묶어 표지 주석 한 줄로 바꿈 ③ 시험지가 잘라 가는 함수(`setupFeedPostsRealtime`·`ensureFeedPostsLoaded`·`renderCommFeed`)와 smoke-test `FN_NAMES` 를 옮기려 하면 멈춤 ④ 선언 첫 줄 앞·끝 줄 뒤에 다른 코드가 붙어 있으면 멈춤. 손으로 옮긴 글자 0.
- 결과 파일(모두 800줄 이하, 책임 단위):
  - `js/tabs/comm/render.js`(89줄): `renderCommScreen`(이전 전 32526~32573) · `renderCommDM`(35424~35428) · `renderCommCompanions`(35430~35434)
  - `js/tabs/comm/feed-comments.js`(199줄): `SERVER_FEED_COMMENTS_CACHE`(33194) · `loadServerFeedComments`(33195~33238) · `getFeedComments`(33240~33272) · `setFeedComments`(33274~33277) · `handleUserCommentSubmit`(33279~33327) · `toggleFeedReaction`(33329~33358)
- index.html IIFE 머리: 목표 2차 이음매(#TASK-ES-375) 다음에 소통 이음매 — `var _commKit = window.OurgoalCommKit;` + 옮긴 코드 밖에서 부르는 6개(`renderCommScreen`·`loadServerFeedComments`·`getFeedComments`·`setFeedComments`·`handleUserCommentSubmit`·`toggleFeedReaction`)를 같은 이름으로 가져오기 + `expose` getter 9개(`FEED_POSTS_CACHE`·`dayIndexSinceSignup`·`fmtTime`·`newId`·`renderCommFeed`·`renderCommGroups`·`renderCommManito`·`renderCommShare`·`sb`). 옮긴 코드가 쓰는 18개 중 9개는 앞 이음매가 이미 노출. 옮긴 코드가 이름 자체에 대입하는 인라인 이름 0 → 새 setter 0.
- 구획 주석 두 개(「피드 상호소통 댓글 & 리액션 헬퍼」·「DM & 동반자 소통 시스템」)는 index.html 에 남겼다 — 그 구획에 남는 함수(`feedPostHtml`·`openUserProfileModal`)가 있다.
- `<script>`: `feed-comments.js`·`render.js` 는 `sub-crew.js` 다음·`js/tabs/comm/index.js` 앞(인라인 IIFE 보다 먼저 읽힘).

## 4. [원칙 ④] 재검토 — 한계(정직하게)

- **이번에 옮기지 않은 소통 범위**(다음 PR — 각각 다른 책임 단위):
  - 피드 화면 `renderCommFeed`(600줄) + 피드만 쓰는 `openUserProfileModal`: `tests/core-confirm-es376.test.js` 가 index.html **한 파일**에서 「피드 게시물 신고」 확인창 줄을 정확히 1곳 센다(19곳 합계 단언). 옮기면 기준 시험지가 0곳을 세어 실패한다. 처음 생성 때 실제로 이 시험이 실패해 범위에서 뺐다. 선행 PR(그 시험만 합본 읽기로, 제품 0·기대값 0) 병합 뒤 옮긴다.
  - 공유 묶음(`renderCommShare` 243줄 + 공유 카드 그림 `generateShareImage`·`buildShareText`·`SHARE_PLATFORMS`·`SHARE_CANVAS_DIMS` — 그림 헬퍼 `scRoundRect` 등은 목표 완주 인증서도 씀).
  - 팀 묶음(`renderCommGroups` 156줄·`renderGroupDetail` 227줄·`promptNewGroup` 149줄·`collectiveGaugeHtml`·피어 초대 함수들 — `calculateRemainingSeats`·`buildPeerInviteUrl`·`formatPeerInviteMessage` 는 smoke-test `FN_NAMES` 라 시험지 선행 PR 필요, `groupState` 는 다른 탭 20여 곳이 씀).
  - 마니또 묶음(`renderCommManito` 246줄·`renderManitoDm`·`loadServerManitoData`·`manito*` 헬퍼·`MANITO_*` 상수 — `manitoState`·`manitoInbox` 는 다른 화면도 씀, 재대입 있는 캐시 변수 3개는 묶음째 옮겨야 함).
  - 실시간 구독 `setupFeedPostsRealtime`·`ensureFeedPostsLoaded`(시험지 `guest-null-client-es377` 이 index.html 에서 잘라 감), 피드 캐시 `FEED_POSTS_CACHE`(다른 탭 10여 곳이 읽고 씀).
- `toggleFeedReaction` 은 `js/reactions.js`(`OurgoalReactions`)가 없을 때만 그려지는 예전 이모지 단추([data-reacttype])가 부른다. 운영에서는 reactions.js 가 늘 있어 실사용 경로가 아니다 — 게스트 조작 비교에서 두 앱 모두 같은 조작으로 OurgoalReactions 를 잠시 떼어 실제로 돌렸다.
- 자리 연결: `slots.contribute` 로 `feed.card`·`reaction.kind` 에 실제로 꽂지 않았다(등록 순서·오류 경로 변경 — 별도 PR) → 신고서 `planned.contributes`(feed-comments: `reaction.kind`). `feed.card` 는 피드 카드 마크업(`renderCommFeed`)을 옮기는 다음 PR 몫.
- 키트 전역 `window.OurgoalCommKit` 하나가 새로 생긴다(목표 `OurgoalGoalsKit` 와 같은 틀). 옮긴 함수 이름은 window 에 달지 않았다(조작 비교에서 `typeof window.<이름>` 9개 전후 같음).

## 5. [원칙 ⑤] 절차

워크트리 `C:/dev/wt/comm-cell`(브랜치 `feat/2026-10-05-task-es-379-comm-cell`, 기준 origin/main 20a2493) → 선례·직전 커밋 정독 → 대상 확정(바인딩 참조 분석) → 기준 사본 `git archive 20a2493` → 생성기 → 글자·누수 검사 → 신고서·가드 → `npm test`(기준·후) → 실패한 시험(core-confirm-es376) 원인 확인 → 범위에서 `renderCommFeed` 제외 후 재생성 → `npm test` 다시 → 게스트 조작 비교(기준 2회·후 1회) → tab-check 기준 2회·후 1회 → 실계정 RA-COMM-03·04A(로컬 기준·로컬 후) + 로그인 A·B 소통 탭 DOM(기준·후·기준) → 법정 형식 게스트 시나리오 기준·후 → 문서 → PR → 법정.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "`renderCommScreen` 은 hoisting 되던 함수 선언인데, 이제 IIFE 머리의 `var` 대입이라 그 줄보다 먼저 부르면 `undefined` 다." → 소통 이음매는 IIFE 머리(설정·기록·일정·목표 이음매 바로 다음)이고, 그 앞에는 이음매의 `expose` 호출(getter 정의만)뿐이라 이 줄보다 먼저 `renderCommScreen` 을 부르는 문이 없다. 옮긴 코드가 쓰는 인라인 이름도 getter 라 읽을 때마다 살아 있는 값이다. 측정: 게스트 조작 비교 50단계에서 콘솔 오류 기준 0·후 0, 로그인 A·B 소통 탭 15단계 오류 건수·종류 기준=후(정적 서버에 없는 자원 404·Supabase 400, 같은 종류).
- 반론 2: "피드 화면은 그대로 두고 그 헬퍼만 옮기면, 피드가 헬퍼를 못 찾거나 다른 값을 쓴다." → 인라인에 남은 `renderCommFeed`·`setupFeedPostsRealtime` 이 부르는 헬퍼 6개는 IIFE 머리에서 같은 이름으로 가져와 호출 글자 0 변경이다(검사: `verify-comm.js` 안 가져온 사용 0). 헬퍼가 읽는 `FEED_POSTS_CACHE` 는 getter 로 읽고 대입은 없다. 측정: 게스트 조작 비교의 댓글 펼치기·빈 댓글·등록·빠른 답글·삭제·예전 이모지 반응 4종이 저장값(feedComments·feedReactions)·화면 HTML·토스트까지 기준과 같다.
- 반론 3: "게스트 목 Supabase 로는 로그인 상태를 못 잰다." → 운영 Supabase 테스트 계정 A·B 로 로컬 기준 사본·작업 사본에 각각 로그인해 RA-COMM-03(동반자 추가·새로고침·다른 기기)·RA-COMM-04A(DM 도착)를 돌렸고 둘 다 통과, 로그인 상태 소통 탭 읽기 조작 15단계 × 7칸 × 2계정 = 210값 기준 대 후 다른 값 0(기준 대 기준 0).

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- DOM(옮긴 코드가 그리고 잇는 곳, 마크업 자체는 index.html 그대로): `#screen-comm`, `#commBody`, `#commBody .comm-subtab[data-sub]`(feed·group·companion·dm·manito·share), `#dmSubtabBadge`, `#commTopCompanionBar`, `#commSubBody`, `#commHeroGroupCount`·`#commHeroCompanionCount`·`#commHeroCheerCount`, 피드 댓글·반응 `[data-togglecomments]`·`[data-cinput]`·`[data-sendcomment]`·`[data-quickreply]`·`[data-delcomment]`·`[data-reacttype]`.
- 함수: `renderCommScreen`, `renderCommDM`, `renderCommCompanions`, `loadServerFeedComments`, `getFeedComments`, `setFeedComments`, `handleUserCommentSubmit`, `toggleFeedReaction`, `OurgoalAppScope.expose`, `OurgoalCommKit`.
- 파일: `index.html`, `js/tabs/comm/render.js`·`feed-comments.js`, `docs/architecture/modules.json`·`module-baseline.json`, `docs/design/harness/module-split/gen-comm.js`·`verify-comm.js`·`dom-compare-comm.js`.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

기준 = origin/main 20a2493(`git archive` 사본). 결과 파일은 `reports/TASK-ES-379/`.

| 항목 | 도구 | 결과 |
| :-- | :-- | :-- |
| 글자 동일 | `verify-comm.js` | 옮긴 9개 선언 토큰열 동일(renderCommScreen 594·renderCommDM 31·renderCommCompanions 31·SERVER_FEED_COMMENTS_CACHE 6·loadServerFeedComments 477·getFeedComments 340·setFeedComments 44·handleUserCommentSubmit 322·toggleFeedReaction 303, L./K. 접두 제외), 누수 0·미노출 0·남은 정의 0·안 가져온 사용 0 (`verify-comm.json` `ok: true`) |
| 조작 전후(게스트) | `dom-compare-comm.js` | 50단계(소통 진입·피드 카테고리 2·유형 2·반응 모듈 단추·예전 이모지 반응 4·댓글 펼치기·빈 댓글·등록·빠른 답글·삭제·프로필·DM·동반자·신고·차단·공유·스카우트·템플릿·서브탭 6·탭 왕복 …) × 13칸 = 650값, 기준 대 후 다른 값 0, 기준 대 기준 0, 콘솔 오류 0/0/0. 지운 값: 시간·난수, 기록 입력 창 datetime-local 기본값(분 단위 지금 시각), 마니또 미리보기 익명 이름(난수) — 둘 다 같은 기준 앱 2회에서 달랐다 |
| 탭 실측 | `tab-check.js … comm` 기준 2회·후 1회 → `tab-compare.js` | 소통 탭 24장(4테마×2화면×3상태: 기본·서브탭·시트)+Dead-Click, 비교한 값 447 — 기준 1회 대 2회 다른 값 0(본질 변동 0), 기준 1회 대 후 0, 기준 2회 대 후 0. 두 앱 모두 git 폴더가 아니라 요약의 commit 칸은 null(같은 커밋 표시는 그 때문 — 실제로는 기준 20a2493 대 이 변경) |
| 실계정 RA-COMM-03·04A | `real-account-check.js --only RA-COMM-03,RA-COMM-04A`(로컬 127.0.0.2 + /api 운영 전달) | 기준 사본 **통과·통과** · 이 변경 **통과·통과**(동반자 즉시·새로고침·다른 기기 모두 참, B 도착 1건). 주소·계정 가림 |
| 실계정 로그인 상태 조작 | 작업자 보조 스크립트(같은 로컬 방식, 계정 A·B, 읽기 조작만) | 15단계 × 7칸 × 2계정 = 210값, 기준1 대 후 0·기준1 대 기준2 0·기준2 대 후 0. 콘솔 오류 A 14·B 9 세 번 모두 같은 수·같은 종류(404·400) (`real-account-comm-dom-compare.json`) |
| 화면 시나리오(법정 형식) | `court/lib/scenario.js` runScenario, 법정 정적 서버·법정 무작위 호스트 | `comm-subtabs-switch` 기준·후 모두 통과, 약점 0, 예외 0 |
| 모듈 가드 | `node scripts/module-guard.js` | ① 인라인 스크립트 34,316 → 34,117(-199) · ② 함수 선언 678 → 670 · ③ 282 그대로 · ④ 11 그대로 · ⑤ 0. 기준선 낮춤(`--update`, 13번째). origin/main(#682·#688·#695) 합친 뒤 다시 만든 기준선: 34,257 → 34,058(-199) · 677 → 669(14번째) |
| index.html 전체 줄 | wc -l | 36,699 → 36,502 |
| 새 파일 줄 수 | wc -l | render.js 89 · feed-comments.js 199 (모두 800 이하) |
| npm test | `NODE_PATH=… npm test` | 기준·후 같음 — smoke-test 443/443 · verify-integrity-gate 38/38 · verify-all-clicks 957/957 · test-shipyard-modular 통과(모듈 파일 40 → 42개 모두 800줄 이하) |

- 실계정 데이터: 테스트 계정 둘의 데이터만 만들었다. 새로 생긴 DM — RA-COMM-04A 2회 × (team_pings 1행 + team_ping_replies 1행) = **4행**(정책상 지울 수 없음, 하네스 정리가 남은 건수로 보고). 동반자 관계(A→B)는 하네스 정리가 공용 확인창(바텀시트)을 누르지 못해 남아서, 작업자 보조 스크립트로 같은 화면 삭제 버튼 + 확인을 눌러 두 번 모두 지웠다(남은 0, `real-account-companion-cleanup.json`).
- 폐기(retire) 청구 없음. 시험 기대값 변경 0. 동결 파일 변경 0.
- 확인 못 함: 실제 폰(레벨 6). 실계정으로 피드 댓글 등록·반응 — 운영 피드의 글은 실사용자 글이라 댓글·응원 수를 남기지 않았다(게스트 목 서버로만 비교). 운영 주소(이전 전) 재생 — 운영 배포가 막혀 있어 운영이 main 과 같은지 보장이 없어 로컬 기준 사본으로 대신했다.

* **체크리스트 마감 규칙**: 본 작업계획서는 [4단계: 심사 청구]까지만 등록함.
