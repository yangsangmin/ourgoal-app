# REQ/PLAN — TASK-ES-377 게스트 실시간 구독 null 가드 + 휴지통 되돌리기 안내가 조작을 막지 않게

> 숫자는 `node scripts/module-metrics.js` · `node scripts/module-guard.js` · 법정 러너(`court/lib/scenario.js`) 로컬 실행 산출이다(손으로 옮긴 수치 없음). 로컬 실행은 판정이 아니다.

## 지시 원문(작업 지시서 그대로)

- "1. 게스트 입장 때마다 `setupTeamCommentsRealtime` 에서 `TypeError: Cannot read properties of null (reading 'channel')` (sb 없음, index.html 24272 부근 — 줄은 다시 찾기). Supabase 클라이언트·세션이 없으면 실시간 구독을 건너뛰게(조용히 return) 고친다. 같은 패턴(sb 없이 .channel 호출)이 다른 곳에도 있으면 함께 목록화해 고친다."
- "2. 휴지통으로 옮긴 직후 `#trashUndoToast` 가 6초 동안 설정 아코디언 제목을 덮어 누를 수 없다. 되돌리기 안내는 그대로 두되(문구·시간 변경 0) 다른 조작을 막지 않게(위치 또는 pointer-events 범위) 고친다. CSS 숨김(display:none !important 등) 금지."
- "index.html 의 목표 탭 렌더 코드는 손대지 말 것." "index.html 인라인 줄 수를 늘리지 말 것(모듈 가드)."

## REQ

- 대상 파일: `index.html`(인라인 스크립트 6줄을 같은 줄 수로 고침 — 새 함수·새 전역·새 줄 0) · `tests/guest-realtime-es377.test.js`(신규) · `scripts/test-shipyard-modular.js`(1줄 등록) · `dev_log.md` · `docs/rules/TICKETS.md`
- sb 없이 `.channel` 을 부르던 곳 목록(지금 main 70db18a 기준):

| 위치 | 함수 | 이전 | 고침 |
| :-- | :-- | :-- | :-- |
| index.html 24244 | `setupUserSessionRealtime()` | 프로필만 보고 `sb.channel('user_session_…')` | `if(!sb \|\| typeof sb.channel !== 'function' \|\| !state.profile \|\| !state.profile.id) return;` |
| index.html 24272 | `setupTeamCommentsRealtime()` | 바로 `sb.channel('team_comments_channel')` → 게스트 TypeError | 함수 첫 줄에 `if(!sb \|\| typeof sb.channel !== 'function') return;` |
| index.html 33633 | `setupFeedPostsRealtime()` | 바로 `sb.channel('feed_posts_channel')` | 함수 첫 줄에 같은 가드 |
| index.html 33622 | `ensureFeedPostsLoaded()`(같은 진입 흐름 `enterApp` 바로 다음 줄, `.from`) | `sb.from('feed_posts')` → 위 3곳을 고치면 여기서 `reading 'from'` 으로 진입이 끊김 | `FEED_POSTS_CACHE = []; if(!sb) return;` |
| js/team-invite-comm.js 560 · 1315 · 1680 | 팀 채팅·DM 채널 | 이미 `if(global.sb)` / `if(!global.sb …) return;` 가드 + try | 고칠 것 없음 |

- 휴지통 되돌리기 안내 `toastWithTrashUndo(msg, trashId)`(index.html 9723): 막대 `#trashUndoToast` 에 `pointer-events:none;`, 버튼 `#btnTrashUndoAction` 에 `pointer-events:auto;`. 위치·문구(`실행 취소`)·6000ms·z-index 그대로. 숨김 0.
- 세션 해석 [기본값]: "세션 없음"은 게스트에게도 공개 테이블(팀 댓글·피드) 실시간이 쓰이고 있어 끄지 않는다(기존 기능 축소 방지). 사용자 세션 채널은 원래대로 프로필 id 가 있어야만 연다. 끄는 조건은 클라이언트가 없을 때(실제 오류 원인)다.

## PLAN — 문제해결 8원칙

## 1. [원칙 ①] 목표 정의
Supabase 클라이언트가 없는 게스트 입장에서 미처리 예외 0, 휴지통 이동 직후 6초 안에도 설정 아코디언 제목 클릭이 된다. 되돌리기 버튼은 그대로 동작.

## 2. [원칙 ②] 현상 분석 — 본질·원인·중심·핵심 파악
`enterApp` → `setupRealtimeChannelsOnce()` → `setupTeamCommentsRealtime()` 가 `sb`(supabase CDN 이 안 뜨면 null, index.html 2564) 를 검사 없이 씀. 예외가 async `enterApp` 을 끊어 뒤의 피드 불러오기·알림 확인·공유 그룹 불러오기·인사 팝업이 같이 안 돈다. 안내 막대는 `position:fixed;bottom:76px;z-index:99999` 라 그 아래 요소의 클릭을 가로챈다(로컬 법정 러너: 기준 커밋에서 `#setGroupDataSummary → 누를 수 없음: 그 자리를 다른 요소가 덮고 있다: div#trashUndoToast`).

## 3. [원칙 ③] 원인 추정
두 결함 모두 "없을 수 있는 것"의 경계 처리 누락: 클라이언트 존재 가정, 안내 막대가 버튼보다 넓은 누름 영역을 가짐.

## 4. [원칙 ④] 대안 탐색
- 실시간: (A) 함수 첫 줄 가드 / (B) `setupRealtimeChannelsOnce` 한 곳만 가드 / (C) 도우미 함수. → (A): 각 함수가 단독 호출돼도 안전, (C)는 함수 선언 수(모듈 가드 ②)를 늘림.
- 안내: (A) pointer-events 범위 축소 / (B) 위치를 위로 옮김. → (A): 위치를 바꾸면 다른 요소를 또 덮을 수 있고 안내 모양이 바뀜.

## 5. [원칙 ⑤] 실행 계획
index.html 6줄 같은 줄 수로 수정 → 부품 시험(실제 소스 잘라 sb=null/있음) → 법정 시나리오 2개 → claims → npm test → PR.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파
- 반론 1: "게스트도 세션이 없으니 실시간을 다 꺼야 지시대로다." → 게스트 피드·팀 댓글 실시간은 지금 쓰이는 기능이라 끄면 기능 축소(승인선 ③). 오류 원인은 클라이언트 부재뿐이므로 그 조건으로 건너뛴다. 사용자 세션 채널은 원래 프로필 id 조건 유지.
- 반론 2: "pointer-events:none 이면 실행 취소가 안 눌린다." → 버튼에 `pointer-events:auto` 를 따로 줘서 버튼은 누름을 받는다. 시나리오가 아코디언을 연 뒤 `#btnTrashUndoAction` 을 실제로 눌러 기록이 되돌아오는 것까지 본다.

## 7. [원칙 ⑦] 즉시 실행
완료 — 커밋 참조.

## 8. [원칙 ⑧] 성과 측정
- 부품 시험 `tests/guest-realtime-es377.test.js` 5건: 기준 커밋 소스에서는 첫 검사가 `Cannot read properties of null (reading 'channel')` 로 실패, 작업 커밋에서 5건 통과.
- 시나리오 `trash-toast-passthrough`: 기준 커밋 17단계(`pointer-events="auto"`)에서 멈춤, 작업 커밋 전 단계 통과(아코디언 열림 → 실행 취소 → 기록 복귀).
- 모듈 가드: ① 34806 · ② 686 · ③ 282 그대로.
* 체크리스트 마감 규칙: [4단계: 심사 청구]까지만 등록.

## 확인 못 한 것
- 법정은 supabase 라이브러리 고정 사본을 넣어 앱을 열기 때문에 법정 안에서는 `sb` 가 null 이 아니다 → 게스트 입장 시나리오(`guest-boot-realtime`)는 기준 커밋에서도 통과한다("고칠 게 없었음"으로 나올 수 있음). sb=null 경로는 부품 시험으로만 잰다.
