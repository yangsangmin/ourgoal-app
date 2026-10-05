# REQ — #TASK-ES-545 인라인 3단계 Z2(팀·소통) 1차: 「RENDER: 팀 목표」 묶음 · 「DM & 동반자 소통 시스템」 묶음 옮기기

- 근거: 오케스트레이터 배정(2026-10-06, 구역 Z2 팀·소통) · 설계 `docs/architecture/INLINE-STAGE3-DESIGN.md` 2절 (가)·3절(실계정 표준 절차 — 3-4 두 주장 배치)·6절 · 헌법 v2026.10.06-SNOWBALL CELL_SPLIT·CELL_SPLIT_PROOF·claims_hygiene · 작업참고 `C:/dev/agent-knowledge/WORK-REFERENCE.md` 기준 PR #802(L001·L002·L006·L015·L016·L018·L045·L046·L047).
- 선행: 시험지 선행 #808(#TASK-ES-517, team-goal-comment-fix 합본 읽기) · #803(#TASK-ES-519, collapseAllTeamGoalAccordions 구간 절단 — 이 PR 은 그 함수를 옮기지 않는다).
- 작업 유형(SNOWBALL): (가) 표준 — 생성기 이음매(L016)·게스트 시나리오(L001)·로그인 뒤 몫 `needs-login` + 별도 기록 항목(L045, 설계 3-4). 이탈 1건(아래 4절 「USER_SESSION_CHANNEL」): ① 규칙: 묶음을 생성기로 통째(대입하는 상태는 L setter) ② 왜: 생성기가 H 자리에 단 setter 를 뒤쪽 P0 이음매(#TASK-ES-442)의 getter-only 노출이 덮어 앱 부팅 때 TypeError(작업자 실측, 게스트 시나리오 noExceptions 로 잡힘) ③ 대신: 그 이름에 대입하는 `setupUserSessionRealtime`·`USER_SESSION_CHANNEL` 을 원래 자리에 둠(keepRest) ④ 검증: 옮긴 것은 같은 증명(verify·단독 로드·시나리오·실계정 비교)을 다 받는다 — 약해진 곳 없음.

## 1. [원칙 ①] 문제 정확히 파악

index.html 인라인 IIFE 에 Z2 구역 묶음이 남아 있다. 「RENDER: 팀 목표 (팀장·매니저만 추가/수정/삭제, 팀원은 보기만)」(함수 17 — 설계 2절 (가): 팀·실시간·차단 사용자)와 「DM & 동반자 소통 시스템 (TASK-ES-105)」(openUserProfileModal + 문서 클릭 위임 1문). 설계 3-1 은 팀 경로가 「계정만으로는 안 닿는다(팀 0개)」고 보았으나, 이번 도달 실측에서 **게스트도 소통 「팀」의 예시 팀을 「체험」하면 목표 「팀목표」 화면이 그 팀으로 그려져** canManageTeamGoals·ensureTeamCommentsLoaded·teamComments·teamCommentsBlockHtml 이 불린다(`reports/TASK-ES-545/real-account-reach-guest-base.json`). 고정 테스트 팀(운영 쓰기)은 이 PR 에 필요 없었다.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 팀 목표 댓글·차단·목표 순서·위젯 열기 코드가 인라인 덩어리에 섞여 있어, 탭 세포와 따로 고치고 검사할 수 없다.
- **원인**: 앞선 단계는 이 묶음을 「게스트로 못 잰다」로 남겼다(#493·#497). 실제로는 게스트로 닿는 몫이 대부분이고, 로그인 뒤에만 도는 몫(서버 team_comments 불러오기·실시간 채널 구독·차단 서버 기록)만 실계정이 필요하다.
- **중심**: 책임 단위 4세포로 생성기가 글자 그대로 옮기고, 게스트로 닿는 몫은 세포마다 게스트 시나리오로, 로그인 뒤 몫은 테스트 계정 기준1→작업→기준2 읽기 전용 비교로 낸다.
- **핵심**: 손으로 옮긴 글자 0 · 동작 0 변경(결함도 그대로) · index.html 순증가 0 · 주장은 옮긴 묶음의 성질만(L002).

## 3. [원칙 ③] 해결방식

생성기 `docs/design/harness/module-split/gen-inline-hard.js` · 설정 `docs/design/harness/module-split/inline-stage3-z2-545.json`(자리 H2).

| 새 세포 | 옮긴 것 |
| :-- | :-- |
| `js/tabs/goals/team-comments.js` | canManageTeamGoals · TEAM_COMMENTS_CACHE(순수 상수 — 같은 객체를 가져온다) · setupRealtimeChannelsOnce · ensureTeamCommentsLoaded · setupTeamCommentsRealtime · teamComments · teamCommentItemHtml · teamCommentsBlockHtml |
| `js/tabs/comm/user-blocks.js` | filterHidden · filterBlockedPosts(둘 다 smoke FN_NAMES — 합본으로 풀림) · isUserBlocked · blockUser · unblockUser · openBlockedUsersModal |
| `js/tabs/goals/goal-order.js` | sortGoalsByOrder(smoke FN_NAMES) · shiftGoalOrder · reorderGoal |
| `js/tabs/settings/widget-modal-opener.js` | 문서 클릭 위임(#btnOpenWidgetModal → openWidgetSettingsModal)을 `bindWidgetModalOpener` 로 감쌈 — index.html 원래 자리에서 부른다 |

원래 자리에 남긴 것: `REALTIME_CHANNELS_SETUP`(재대입 — L getter·setter) · `USER_SESSION_CHANNEL`·`setupUserSessionRealtime`(4절) · `openUserProfileModal`(4절) · window 노출 if 문 2개.

## 4. [원칙 ④] 재검토 — 한계(정직하게)

- `setupUserSessionRealtime`(다른 기기 원격 로그아웃 방송 수신)은 `USER_SESSION_CHANNEL` 에 대입한다. 생성기는 H2 머리에 getter·setter 를 다는데, 같은 이름의 getter-only 노출이 머리 뒤쪽 P0 이음매(#TASK-ES-442 expose 블록)에 있어 나중에 실행되며 setter 를 덮었다 → 모든 게스트 시나리오가 noExceptions 에서 실패(「Cannot set property USER_SESSION_CHANNEL … only a getter」). verify-inline-hard 는 이것을 못 잡는다(setter 빠짐 0). 그래서 둘을 원래 자리에 두었다 — 생성기 결함 2로 오케스트레이터에 보고(작업참고 L047).
- `openUserProfileModal` 은 예비 경로다(`js/tabs/comm/feed-list.js` 가 `OurgoalTeamInviteComm.openUserProfileModal` 을 먼저 부른다) — 게스트·로그인 모두 화면으로 닿지 않아 잴 수 없으므로 옮기지 않았다.
- `shiftGoalOrder` 의 ◀▶ 단추는 `#goalChipRow` 안에 있는데 그 줄이 게스트 화면에서 보이지 않는다(편집 모드에서도 크기 0 — 작업자 실측). `reorderGoal` 은 끌어 놓기 경로. 둘 다 시나리오로 누를 수 없어, 그 세포의 시나리오는 같은 세포의 `sortGoalsByOrder`(목록 정렬)로 낸다. 숨김 원인은 이 PR 범위 밖 — 결함 목록에 적는다.
- 위젯 단추는 `js/tabs/settings/render.js` 의 `onclick` 도 같은 창을 연다 — 감싼 위임이 고장 나도 시나리오는 통과할 수 있다(옮기기라 기준·작업 모두 통과가 기대값). 위임이 원래 자리에서 한 번 불리는 것은 verify(부르는 줄·이중 처리기 0)로 낸다.
- 로그인 뒤 화면은 법정이 다시 돌리지 못한다(설계 3-4) — 그 몫은 `unverified needs-login` 하나 + 실계정 결과 파일은 별도 기록 항목.

## 5. [원칙 ⑤] 절차

worktree `C:/dev/wt/stage3-z2`(처음 origin/main 417a777, #803 포함 — #808 병합 뒤 origin/main 을 합치고 index.html 은 main 판을 입력으로 생성기를 다시 돌림, L010) → 도달 실측(`real-account-split-check.js --guest/계정 --count`) → 설정 → 생성기 → verify → 마지막 getter 줄 setter 점검(L047) → 신고서(module-specs --write · cell-descriptions 관련 세포 옆 · comm/user-blocks requires ui.confirm) → module-guard → 원본 단독 로드 → 게스트 시나리오 4개 기준·작업 → 테스트 계정·게스트 기준1/작업/기준2 비교 → tests 전후 → #808 병합 뒤 main 합치기 → PR → 판정.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: 「팀 경로는 고정 테스트 팀이 있어야 잰다(설계 3-3).」 → 실측으로 게스트가 예시 팀 「체험」만으로 팀목표 화면·댓글 블록에 닿았다(도달 실측 파일). 법정이 직접 재는 게스트 시나리오가 더 강한 증거이고 운영 쓰기도 0 이다. 로그인 뒤에만 다른 분기(서버 댓글·실시간 구독)는 실계정 비교로 따로 냈다.
- 반론 2: 「한 묶음을 네 세포로 나누면 옮기기가 아니라 재설계다.」 → 문 단위로 글자 그대로 옮겼고(verify 토큰 동일·덩어리 줄 동일·남은 글자 동일), 나눈 기준은 책임(댓글/차단/순서/위젯)이다(CELL_SPLIT 7). 이름 참조 접두 밖 변경 0.
- 반론 3: 「USER_SESSION_CHANNEL 을 남기면 묶음이 덜 옮겨진다.」 → 옮기면 앱이 부팅 중 예외를 낸다(실측). 생성기 결함은 고치기 티켓·도구 개선 몫이고, 옮기기 PR 은 동작 0 변경이 우선이다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- DOM: `[data-join="g-workshop"]` · `#btnGoalsSubTeam` · `[data-tgtogglegoalcomments]` · `[data-tggoalcommentsbox]` · `.team-comments-block` · `[data-cmtinput]` · `[data-cmtsend]` · `#setGroupDataSummary` · `#manageBlockedBtn` · `#modalSheet` · `#closeBlockedModal` · `.btn-quick-adopt-goal` · `#goalFastAddInput` · `#btnGoalFastAddSubmit` · `[data-sgoalid]` · `#btnOpenWidgetModal` · `#goalChipRow`.
- 함수: 3절 표 + `bindWidgetModalOpener`(새 감싼 함수) · 남김 `setupUserSessionRealtime` · `openUserProfileModal`.
- 파일: `index.html` · 새 세포 4개(3절) · `docs/design/harness/module-split/inline-stage3-z2-545.json` · `docs/design/harness/module-split/real-account-stage3-z2-545-steps.json` · `docs/design/harness/module-split/module-load-stage3-z2.js` · `docs/architecture/modules.json` · `docs/architecture/cell-descriptions.json` · `reports/TASK-ES-545/**`.

## 8. [원칙 ⑧] 막히는 지점 예상 · 성과 측정 (작업자 측정, 판정 아님)

| 항목 | 결과 (출처) |
| :-- | :-- |
| verify | ok · 토큰 동일 · 남은 글자 동일 · 이중 처리기 0 (`reports/TASK-ES-545/verify-inline-hard.json`) |
| 마지막 getter 줄 setter | 옮긴 코드가 대입하는 이름(REALTIME_CHANNELS_SETUP) — 마지막 노출 줄에 setter 있음(작업자 점검) |
| 새 파일 줄 수 | 각 800 이하 (verify `files`) |
| 원본 단독 로드 | 회귀 0 · 새 세포 4개 단독 로드 ok (`module-load-probe.json`) |
| 게스트 시나리오 | 4개 기준·작업 통과 (`scenario-local.json`) |
| 도달 실측 | `real-account-reach-guest-base.json` · `real-account-reach-A-base.json` |
| 게스트·실계정 조작 비교 | `guest-compare.json` · `real-account-compare.json` |
| tests 전후 | 시험지 종료 코드 기준 = 작업 (`tests-compare.json` differing 0 — 합친 main 기준) |
| 막힐 지점 | main 이동(L010 생성기 재실행) · #808 병합 전에는 team-goal-comment-fix 가 작업 트리에서 실패(선행 순서) |

[4단계: 심사 청구]
