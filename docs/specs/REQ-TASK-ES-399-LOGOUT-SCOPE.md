# REQ/PLAN — TASK-ES-399 일반 로그아웃은 이 기기만, 끊긴 기기는 로그아웃 화면으로, 로그아웃한 기기 푸시 구독 해제

> 근거: TASK-ES-398 조사(운영 앱 실측, 2026-10-05) — 계정 A 두 기기 P1·P2 로그인 → P2 로그아웃 → P1 `getUser` "Auth session missing!", `/api/track` sync_companions 200→401, P1 화면은 로그인 상태 그대로. 코디네이터 지시(2026-10-05).
> 추가 범위(코디네이터, 같은 경로): #714(TASK-ES-400) 빌더 발견 — 로그아웃해도 그 기기의 푸시 구독 행(push_subscriptions)이 이전 사용자 이름으로 남아, 로그아웃 상태로 두면 이전 사용자 알림이 그 기기로 온다. origin/main(#711·#714 병합 후) 위에서 작업.
> [기본값] 의도 복원(기능 삭제 아님). 「다른 기기 로그아웃」(scope 'others')은 그대로.
> 금고 파일(court/**·AGENTS.md·CLAUDE.md·.github/workflows/**·scripts/essence-gate.js·scripts/verify-integrity-gate.js·package.json scripts·vercel.json) 변경 0. index.html 줄 수 origin/main 과 같음(늘지 않음).

## REQ
- 대상 파일: `index.html`
  - 함수 `performLogout`(설정 탭 `#logoutBtn` → 일반 로그아웃) — `sb.auth.signOut({ scope: 'local' })`
  - 함수 `checkRemoteSessionRevoked`(15초 주기·`focus`·`visibilitychange` 에서 부름) — getUser 오류 판정에 `'session missing'`(대소문자 무관)·`status === 401` 추가
  - 이 기기 세션 정리 경로 6곳(`handleGoogleUserSuccess` 계정 충돌 [보호 2], `startOAuthLogin` 카카오 진입 전 정리, `openLoginRescueModal`, `rescueLoginSession`, `boot` OAuth 오류·콜백 지연 2곳) — `{ scope: 'local' }`
  - `submitWithdrawAccount`(탈퇴) — 기본값(global) 유지, 이유 주석
  - `openLogoutOtherDevicesConfirmModal`(`#logoutOtherDevicesBtn` → `#btnConfirmLogoutOtherModal`) — `{ scope: 'others' }` 그대로
  - 함수 `performLogout` 첫 줄 — signOut 전(세션이 있을 때) `removePushSubscription()`(#714 로 세션 Bearer 필수) 을 3초 상한으로 기다림
- 새 시험: `tests/logout-scope-es399.test.js` (npm test 경로: `scripts/test-shipyard-modular.js` Test 6 `runNode`)
- 대상 DOM: `#logoutBtn`, `#authScreen`, `#appShell`, `#logoutOtherDevicesBtn`, `#btnConfirmLogoutOtherModal` — 마크업 변경 0
- R1: 일반 로그아웃은 이 기기 세션만 끝낸다(같은 계정 다른 기기 세션 유지).
- R2: 서버가 세션을 지운 기기(getUser "Auth session missing!"·401)는 기존 안내 흐름(`performLogout` + 토스트)으로 로그아웃 화면에 간다. 네트워크 오류·로그인 직후 60초는 로그아웃시키지 않는다(기존 오탐 방어 유지).
- R3: signOut 호출 전부를 목록화하고 각 scope 를 의도에 맞춘다.
- R5: 로그아웃 직전 이 기기 푸시 구독을 서버에서 지운다(DELETE /api/push-subscribe + 세션 Bearer). 서비스 워커가 없거나 준비되지 않아도 로그아웃은 막히지 않는다.
- R4: 부품 시험 기준 실패 → 작업 통과, npm test 기준과 같음, 실계정 재생으로 수정 전후를 잰다.

## 1. [원칙 ①] 목표 정의
「로그아웃」을 누른 기기만 로그아웃된다. 다른 기기가 끊겼다면(「다른 기기 로그아웃」·탈퇴 등) 그 기기는 조용히 저장 실패(401)를 쌓지 않고 로그아웃 화면으로 간다.

## 2. [원칙 ②] 본질·원인·중심·핵심
- 본질: 로그아웃 범위를 정하는 인자가 빠져 라이브러리 기본값에 맡겨졌다.
- 원인(코드): supabase-js v2 `auth.signOut()` 기본 scope 는 `'global'` — 같은 사용자의 모든 세션(refresh token)을 서버에서 지운다. `performLogout` 은 인자 없이 불렀다. 앱에는 「다른 기기 로그아웃」(`scope: 'others'`)이 따로 있으므로 일반 로그아웃의 의도는 이 기기만이다.
- 원인(감지): 서버가 세션을 지우면 `getUser` 오류 문구는 "Auth session missing!" 인데 `checkRemoteSessionRevoked` 는 `jwt`·`invalid`·`expired` 만 보아 `return false` 했다. 「다른 기기 로그아웃」 쪽은 실시간 방송(`USER_SESSION_CHANNEL` remote_logout)이 닿을 때만 끊긴 기기가 로그아웃되고, 방송을 놓친 기기(잠자던 폰)는 주기 검사가 메타데이터 단계까지 못 가 그대로 남았다.
- 원인(푸시): `performLogout` 이 `removePushSubscription` 을 부르지 않아 서버 `push_subscriptions` 행(user_id = 로그아웃한 사용자)과 브라우저 구독이 그대로 남는다. 해제는 #714 이후 세션 토큰이 있어야 하므로 signOut 뒤에는 부를 수 없다.
- 중심: `performLogout` 한 줄, `checkRemoteSessionRevoked` 판정 한 줄.
- 핵심: scope 를 명시하고, 실제 문구를 끊긴 세션으로 인정한다.

## 3. [원칙 ③] 해결 방식 — 구체적 식별자
| 줄(작업 트리) | 함수 | 의도 | scope |
|---|---|---|---|
| 4054 | `openLogoutOtherDevicesConfirmModal` | 이 기기를 뺀 모든 기기 해제 | `others` 그대로 |
| 5694 | `handleGoogleUserSuccess` [보호 2] | 미로그인 상태 구글 시도 시 이 브라우저의 오염 세션 정리 | `local` |
| 5876 | `startOAuthLogin` | 카카오 OAuth 진입 전 이 브라우저 기존 세션 정리 | `local` |
| 6307 | `performLogout` | 일반 로그아웃(이 기기) — 원격 해제 감지 후 정리에도 쓰임 | `local` |
| 6587 | `submitWithdrawAccount` | 탈퇴 신청 — 계정의 모든 세션 종료 | 기본값(global) 유지 |
| 35949 | `openLoginRescueModal` | 로그인 꼬임 복구 — 이 브라우저 정리 | `local` |
| 36000 | `rescueLoginSession` | 「세션 초기화」 — 이 브라우저 정리 | `local` |
| 36084 | `boot` OAuth 오류 | 실패한 인가 뒤 이 브라우저 정리 | `local` |
| 36118 | `boot` OAuth 콜백 지연 | 세션 못 받은 콜백 뒤 이 브라우저 정리 | `local` |
- 탈퇴를 global 로 두는 근거: `submitWithdrawAccount` 는 서버에 탈퇴 신청(`/api/withdraw` request)을 기록한 뒤 부르며, 안내 문구가 "30일 뒤 영구 파기, 그 전에 어느 기기에서든 다시 로그인하면 복구"다. 복구는 다시 로그인으로 판정(`js/auth-safety.js` `checkPendingDeletionRestore`)하므로, 탈퇴한 계정의 다른 기기가 로그인된 채 남으면 탈퇴 의사와 어긋난다. 또 smoke 시험이 탈퇴 경로의 `sb.auth.signOut()` 글자 순서를 단언한다(서버 기록 확인 뒤에만 로그아웃).
- 정리 경로를 local 로 바꾸는 근거: 모두 "이 브라우저의 꼬인/오염 세션"을 지우는 주석·흐름이다(다른 기기를 끊을 이유 없음). local 도 이 세션의 refresh token 은 서버에서 지운다.
- `performLogout`: `try { if(typeof removePushSubscription === 'function') await Promise.race([removePushSubscription(), 3초 타이머]); } catch(e){}` 를 signOut 앞(같은 줄, 줄 수 불변). 다음 로그인은 `enterApp` 의 `syncPushSubscription`(알림 켬일 때)이 새 사용자 이름으로 다시 구독한다.
- `checkRemoteSessionRevoked`: `eMsg.indexOf('session missing') !== -1 || Number(uRes.error.status) === 401` 추가, 60초 유예·네트워크 오류 무시는 그대로.

## 4. [원칙 ④] 재검토 — 다른 길과 비교
- A `/api/track` 401 응답을 받는 곳마다 로그아웃: 호출처가 많고 서버 일시 오류와 구분이 어려워 오탐 위험 → 버림. 판정은 한 곳(getUser)에 모은다.
- B 일반 로그아웃을 `others`+로컬 정리로: 의미가 반대(이 기기만 남김) → 버림.
- C scope 명시 + 판정 문구 추가 → 선택.

## 5. [원칙 ⑤] 절차
1) 기준 `git archive origin/main`(d2e0dbb) 스크래치 사본 → 2) 부품 시험 작성, 기준 사본 실행(실패 기록) → 3) index.html 수정(줄 수 불변) → 4) 작업 트리 실행(통과) → 5) npm test 기준·작업 비교 → 6) 실계정 재생(로컬 127.0.0.2 정적 서버 + /api 운영 전달, 테스트 계정만) 수정 전후 → 7) 실계정 하네스 6조합 → 8) claims·기록 → 9) PR.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파
- 반론① "401·session missing 을 로그아웃으로 보면 잠깐의 오류에도 튕긴다" → 네트워크 오류는 supabase-js 가 `AuthRetryableFetchError`(status 0, "Failed to fetch")로 주어 걸리지 않고, 로그인 60초 유예도 그대로다. 부품 시험이 두 경우 모두 로그인 유지를 잰다. "Auth session missing!" 은 서버가 세션을 지웠거나 이 기기에 세션이 아예 없을 때만 나온다 — 둘 다 이미 저장이 401 로 실패하는 상태다.
- 반론② "탈퇴도 local 이어야 일관된다" → 탈퇴는 계정 단위 행위라 모든 기기 종료가 의도에 맞다(3번 근거). 일반 로그아웃과 의도가 달라 scope 가 다른 것이 일관성이다.

- 반론③ "로그아웃 때 브라우저 구독까지 끊으면 다음 사용자가 알림을 못 받는다" → 다음 로그인 때 `syncPushSubscription` 이 구독이 없으면 새로 만든다(알림 켬·권한 허용일 때). 이전 사용자 이름의 구독이 남아 남의 알림이 오는 것이 더 큰 결함이다. 서비스 워커가 끝나지 않는 브라우저 대비로 3초 상한을 둔다(부품 시험).

## 7. [원칙 ⑦] 즉시 실행 — 결과
`index.html` 11줄 수정(줄 수 불변), 새 시험 1개, `scripts/test-shipyard-modular.js` 시험 등록 2줄, 기록 파일.

## 8. [원칙 ⑧] 성과 측정 · 막히는 지점
작업자 실측(판정 아님) — `reports/TASK-ES-399/` (기준 = git archive origin/main, #711·#714 병합 후):
- 부품 시험 `tests/logout-scope-es399.test.js`: 기준 사본 5/12(7건 실패) → 작업 트리 12/12.
- npm test: 기준·작업 모두 smoke 443개 통과·0개 실패, 무결성 38/38, 종료 0. 로그 차이는 기준 사본에 .git 이 없어 생기는 줄과 이 시험 출력뿐.
- 실계정 재생(로컬 127.0.0.2 정적 서버 + /api 운영 전달, 테스트 계정 A 두 기기):
  - P2 로그아웃 뒤 P1 sync_companions: 기준 401(getUser 'Auth session missing!') → 작업 200(오류 없음) — `real-logout-*.json`
  - 다른 기기 로그아웃(P1 실시간 채널을 끊어 방송을 놓친 기기 흉내): 기준 P1 로그인 화면 안 감 → 작업 약 3초 안에 로그인 화면 + '로그인 세션이 만료되었습니다' 안내 — `real-others-nobroadcast-*.json`
  - 다른 기기 로그아웃(방송 받음): 기준·작업 모두 P1 약 1초 안에 로그인 화면, P2 는 로그인 유지·저장 200 — `real-others-*.json`
  - 로그아웃 버튼 → 이 기기 푸시 구독: 기준 DELETE 0건·행 A 이름으로 남음 → 작업 DELETE 1건(Bearer, 200)·행 삭제 — `real-push-logout-*.json` (#714 실측 도구를 로그아웃 단계로 바꾼 사본, 표는 메모리)
- 실계정 하네스 6조합(RA-CORE-LOGIN·CORE-SWITCH·COMM-03·COMM-04A·COMM-04B·SET-01): 기준 2통과·4실패 → 작업 3통과·3실패(COMM-03 실패→통과) — `harness-6-*.json`. 남은 3실패는 기준에서도 같은 단계로 실패하며 이번 변경과 무관(원인 아래).
- 막히는 지점(발견, 이번 범위 밖 — 별도 작업):
  - RA-COMM-04A·04B: `js/team-dm-room.js` 대화방 메시지 조회가 `order('created_at', ascending: true)` + `limit(50)` — 가장 오래된 50건만 그린다. 테스트 계정 A↔B 대화가 50건을 넘어 새 메시지가 화면에 안 나온다(진단: 대화방 .dm-msg 50개, 새 표식 0건). 실제 사용자도 대화가 50건을 넘으면 새 메시지를 못 본다 — 제품 결함.
  - RA-SET-01: 하네스가 닫힌 아코디언 `#setGroupAccountSummary` 를 누를 때 클릭이 하단 탭(기록)에 떨어져 설정 화면이 사라진다(진단: 클릭 뒤 보이는 화면 screen-records). 같은 기능(다른 기기 로그아웃 → 끊긴 기기 로그인 화면·누른 기기 유지)은 위 실계정 재생으로 잼.
  - 세션이 이미 서버에서 지워진 기기(원격 해제 감지 경로)의 performLogout 은 DELETE 가 401 이라 서버 구독 행이 남을 수 있다(브라우저 구독은 해제됨).

* **체크리스트 마감 규칙**: 본 작업계획서는 [4단계: 심사 청구]까지만 등록함.
