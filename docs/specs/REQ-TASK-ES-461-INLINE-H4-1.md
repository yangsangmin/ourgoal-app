# REQ — #TASK-ES-461 인라인 어려움 구역 H4 1차 (목표 완주 인증서·공유 화면 · 세션 복구 입장 · 마니또 실 유저 · 함께 목표 초대)

- 근거: 헌법 v2026.10.05-CELL 세포골격 절(CELL_SPLIT · CELL_SPLIT_PROOF · claims_hygiene), 설계 `docs/architecture/INLINE-HARD-SPLIT-DESIGN.md`(2절 표준 이음매 · 3절 자리 표지 H4 · 4-1 빌더 절차), 시범 #TASK-ES-439(PR #762).
- 지시(2026-10-05, 상민님): "미분화 덩어리 분열 작업을 우선순위로" → 코디네이터 배정: 어려움 구역 H4.
- 범위: index.html 인라인 IIFE 의 「어려움」 묶음 4개를 생성기(`gen-inline-hard.js`, 설정 `docs/design/harness/module-split/inline-h4-pr1.json`)로 글자 그대로 옮긴다. 동작 0 변경.
  - 「목표 완주 인증서 (기존 공유 캔버스 인프라 재사용)」 → `js/tabs/comm/goal-certificate-share.js` (generateGoalCertificateImage · renderCommShare)
  - 「세션 복구 및 안전 앱 진입 유틸」 → `js/tabs/settings/session-entry.js` (restoreSessionAndEnter · loginWithDirectIdentifier · openLoginRescueModal · rescueLoginSession · 로드 중 등록 문 → bindLoginRescueButtons)
  - 「마니또 실 유저 익명 응원 연동」 → `js/tabs/comm/manito-real.js` (isValidRealUser · loadServerManitoData · manitoPartners · manitoSentToday · manitoStreak · manitoMutualCount · manitoInbox · renderCommManito · renderManitoDm)
  - 「[PEER INVITE] '함께 목표' 방 초대 루프」 → `js/tabs/comm/peer-invite.js` (copyTextToClipboard · fallbackCopyText · trackPeerInvite · shareGroupToKakao · copyGroupInviteLink · openPeerInviteSuccessModal · acceptPeerInvite · showPeerInviteLandingModal)

## 1. [원칙 ①] 문제 정확히 파악
네 묶음은 지도 등급 「어려움」(유형 A1 남의 상태 재대입 · B1 로드 중 window 노출 · B2 로드 중 이벤트 등록 · E 순환 호출 · F2 smoke FN_NAMES · L 통로에 없는 인라인 이름)이라 1차 생성기로는 옮길 수 없었다. 시험지 선행 실측(`scripts/inline-hard-test-probe.js --only`)에서 네 묶음 모두 깨지는 시험지 0.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심
- **본질**: 소통 탭·로그인 복구 코드가 index.html 미분화 덩어리 안에 있어 세포 경계(신고서·가드)가 닿지 않는다.
- **원인**: 공유 상태(`_isEnteringApp` · `REAL_MANITO_PARTNERS_CACHE` · `REAL_MANITO_INBOX_CACHE` · `MANITO_SERVER_LOADED`)·다른 묶음 이름(state·toast·openModal …)을 직접 쓰고, 로드 중 처리기 등록 문과 window 노출 줄이 섞여 있다.
- **중심**: 표준 이음매 — 상태 선언은 원래 자리 + L getter·setter, window 노출 줄은 원래 자리, 로드 중 문은 함수로 감싸 원래 자리에서 부름, 머리 가져오기는 자리 표지 H4 아래.
- **핵심**: 손으로 옮긴 글자 0(생성기), verify ①~⑦ 통과, 게스트 화면 차이 0.

## 3. [원칙 ③] 해결방식
설정 `inline-h4-pr1.json`(slot H4, 네 세포; 인증서·세션·마니또는 `take.all`, 등록 문 wrap 이름 `bindLoginRescueButtons`; 초대는 `take.names` + `keepRest` — smoke FN_NAMES 순수 함수 calculateRemainingSeats · buildPeerInviteUrl · formatPeerInviteMessage 는 생성기 규칙(유형 F2)대로 남김) → 생성기 → 검사기 `verify-inline-hard.js` → 신고서(`module-specs --write` · role 손 칸 · `comm/manito-real` requires `ui.confirm`) · `cell-descriptions.json`. 생성 지도 3종(기준선·세포지도·인라인 지도)은 오케스트레이터 일괄 갱신 몫이라 커밋하지 않는다.

## 4. [원칙 ④] 재검토 — 한계(정직하게)
- 목표 완주 인증서 그림(generateGoalCertificateImage)은 100% 목표 보관 때만 불린다 — 게스트 시나리오는 같은 세포의 공유 화면(renderCommShare)으로 잰다. 함수 글자는 verify 토큰 동일로 보증한다.
- 세션 복구 입장(restoreSessionAndEnter)·직접 로그인·서버 마니또 자료(loadServerManitoData)·초대 수락(acceptPeerInvite)은 로그인 세션·초대 링크가 있어야 돈다 — 게스트로는 복구 창 열기·빈 칸 안내, AI 마니또 참여, 초대 링크 복사까지 잰다.
- 「피드 상호소통 댓글 & 리액션 헬퍼」 묶음은 옮기지 않았다: renderCommFeed 안의 빠른 게시 띠 마크업 글자가 `display:none !important` 인라인 스타일이라, 새 파일로 옮기면 법정이 「CSS 은폐 줄 새로 추가」로 돌려보낸다(로컬 예비 점검에서 확인). 지우거나 살리는 것은 기능 삭제 승인선 ③ 이라 별도 결정. 같은 묶음의 `feedPostHtml` 은 부르는 곳이 0 인 죽은 함수다(발견, 고치지 않음).

## 5. [원칙 ⑤] 절차
worktree(origin/main) → 유형·시험지 선행 실측 → 설정 → 생성기 → verify → 모듈 로드 탐침 → 신고서 → npm test·tests 전후 비교 → 게스트 조작 비교(기준 2회·후 1회) → 게스트 시나리오 4개 로컬(기준·작업) → 로컬 법정 예비 → PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파
- 반론 1: "옮기면서 이름 참조를 바꿨으니 동작이 바뀔 수 있다." → 바꾼 것은 `L.` 접두뿐이고, getter 는 같은 바인딩을 읽는다. verify 가 토큰 동일·남은 글자 동일·누수 0·setter 빠짐 0·이중 처리기 0 을 쟀다.
- 반론 2: "로드 중 등록 문을 함수로 감싸면 등록 시점이 바뀐다." → 원래 자리에 `bindLoginRescueButtons();` 한 줄을 남겨 같은 순서·같은 시점에 동기적으로 한 번 부른다(verify ⑦ 부르는 줄 1개). 시나리오 `login-rescue-modal` 이 첫 화면 링크로 창이 열림을 잰다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자
DOM `#landRescueBtn` · `#authRescueBtn` · `#rescueDirectEnterBtn` · `#commSubBody [data-scpick]` · `#sharePreviewBtn` · `#mnJoin` · `#mnQuit` · `#grpCopyLinkBtn` · `#grpKakaoInviteBtn`, 함수 위 범위 목록, 파일 `js/tabs/comm/goal-certificate-share.js` · `js/tabs/settings/session-entry.js` · `js/tabs/comm/manito-real.js` · `js/tabs/comm/peer-invite.js` · `docs/design/harness/module-split/inline-h4-pr1.json` · `docs/design/harness/module-split/dom-compare-inline-h4.js` · `docs/design/harness/module-split/dom-steps-inline-h4-461.js`.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)
| 항목 | 결과 (출처) |
| :-- | :-- |
| verify | ok · 토큰 동일 · 남은 글자 동일 · 이중 처리기 0 (`reports/TASK-ES-461/verify-inline-hard.json`) |
| 새 파일 줄 수 | 326 · 268 · 496 · 286 (800 이하) |
| 원본 단독 로드 | 회귀 0, 새 파일 4개 단독 로드 ok (`module-load-probe.json`) |
| tests 전후 | 작업 npm test 종료 0 · smoke 443/0(기준 사본 같음). 종료 코드가 갈린 시험지 1개(tests/cell-map-export-es414.test.js)는 기준 사본이 git archive 로 풀어 이력이 없어 실패하고 작업 트리에서는 통과 — 회귀 아님 (`test-compare.json`) |
| 게스트 조작 비교 | 17단계 기준 대 후 차이 0 · 기준 대 기준 0 (`dom-compare-inline-h4.json`), 뒤집어 잼(작업 2회·기준 1회)도 0 (`dom-compare-inline-h4-reversed.json`). main 합친 뒤 첫 실행 한 번은 아바타 인사 창 타이밍으로 갈렸고 다시 잰 두 번은 0 |
| 게스트 시나리오 | 4개 기준·작업 (`scenario-local.json`) |

[4단계: 심사 청구]
