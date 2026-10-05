# REQ — #TASK-ES-521 인라인 3단계 Z1(로그인·계정) 1차: Supabase · 2계정 상호작용 테스트 · 새 비밀번호 입력 모달 · 회원 탈퇴 30일 유예 묶음을 세포 3개로 이전(동작 그대로) + 검사기 키트 변수 순서 검사

- 근거: 헌법 v2026.10.06-SNOWBALL(CELL_SPLIT · CELL_SPLIT_PROOF 5항), 설계 `docs/architecture/INLINE-STAGE3-DESIGN.md` 3절(실계정 표준 절차 — 3-4 두 주장 배치)·6절(Z1 구역), 작업참고 `C:/dev/agent-knowledge/WORK-REFERENCE.md` 기준 PR #802(L016·L045·L010·L009·L002), 오케스트레이터 지시(2026-10-06: 검사기에 「가져오기 줄 위치 < 키트 변수 선언 위치면 FAIL」 검사 추가).
- 작업 유형(SNOWBALL): (가) 표준 — 표준 이음매(L016) + 설계 3-4 의 실계정 두 주장 배치(L045). 이탈 없음. 이 구역은 시험지 선행이 필요 없었다(아래 8절, 선행 PR #804 는 다음 묶음용).

## 1. [원칙 ①] 문제 정확히 파악
index.html 인라인 IIFE 에 Z1 묶음이 남아 있다. 이 PR 은 그중 시험지 선행이 필요 없는 네 묶음을 옮긴다: 「Supabase」(39줄) · 「2계정 상호작용 테스트 (테스터 B 직통 입장: #TASK-ES-169)」(38줄) · 「P0: 새 비밀번호 입력 모달」(9줄) · 「P0: 회원 탈퇴 30일 유예(소프트 삭제) 복구 체크」(100줄 — 이메일 로그인 제출·계정 데이터 다시 맞추기·로그아웃·초기화 단추 처리기 등록 문). 로그인 제출 뒤 경로·인증 상태 감지·로그인 세션 토큰은 로그인해야 돈다.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심
- **본질**: 옮기기(동작 0 변경). 버그도 그대로.
- **원인**: 인라인 덩어리가 로그인 처리기를 품고 있어 세포 경계가 없다.
- **중심**: 생성기로 글자 그대로 옮기고, 게스트로 닿는 몫은 게스트 시나리오(법정이 직접 잼), 로그인 뒤 몫은 실계정 기준1→작업→기준2 비교 + `needs-login`.
- **핵심**: 손으로 옮긴 글자 0, 토큰 동일, 이중 처리기 0, 그리고 **로드 순서**(가져오기 줄이 키트 변수보다 뒤) — 이번에 실계정 실측으로 생성기의 숨은 결함을 찾았다(4절).

## 3. [원칙 ③] 해결방식
설정 `docs/design/harness/module-split/inline-stage3-z1-b.json`(자리 「HO 기관」) → `gen-inline-hard.js`:
- `js/core/supabase-auth.js`(기관, 키트 OurgoalUiHelpers): `getSupabaseAuthToken` · `GOOGLE_OAUTH_CLIENT_ID` 옮김, 인증 상태 감지 등록 try 문 → `bindSupabaseAuthStateListener` 로 감쌈. `SUPABASE_URL`·`SUPABASE_ANON_KEY`·`sb`·`_pendingAuthSession`·노출 줄은 원래 자리(keepRest — 주소·키는 `docs/design/harness/real-account-steps.js` 가 index.html 에서 정규식으로 읽는다).
- `js/tabs/settings/tester-entry.js`: `enterAsTesterB` 옮김, 단추 등록 if 문 2개 → `bindLandTesterBButton`·`bindAuthTesterBButton`. 단추 변수·노출 줄 원래 자리.
- `js/tabs/settings/account-actions.js`: `openNewPasswordModal` 옮김, 처리기 등록 문 4개 → `bindLoginSubmit`·`bindResyncAccountDataButton`·`bindLogoutButton`·`bindResetButton`. `resyncBtn` 변수 원래 자리.
- 검사기 `verify-inline-hard.js` ⑧: 가져오기 줄(`var X = _키트.X`)이 그 키트 변수 선언(`var _키트 = window.K`)보다 앞이면 FAIL(`importBeforeKit`). 기존 검사 유지.

## 4. [원칙 ④] 재검토 — 한계(정직하게)
- **생성기 결함 발견(고치지 않고 검사로 막음)**: 처음 자리 H1 로 돌렸을 때 verify 는 ok 였고 tests 도 기준과 같았지만, 실계정 하네스 작업 실행이 `Cannot read properties of undefined (reading 'getSupabaseAuthToken')` 로 앱이 뜨지 않았다. 생성기는 머리 어딘가에 `var _uiKit = …` 이 있으면(HO 자리 아래) 「있다」고 보고 새로 만들지 않는데, 가져오기 줄은 그보다 앞(H1 자리)에 들어가 로드 때 `_uiKit` 가 undefined 였다. 자리를 「HO 기관」으로 바꿔 다시 생성했고, 같은 모양을 검사기 ⑧ 이 잡는 것을 기록했다(`verify-kit-order-negative.json`: H1 판 FAIL, 다른 검사는 모두 ok — 기존 검사로는 못 잡았다는 뜻).
- 테스터 B 단추는 배포 주소에서 `initDevDebugButtons` 가 지운다(로컬 개발 주소 + `?debug=true` 에서만 보임). 법정 호스트(`court-…test`)에서는 단추가 없어 `enterAsTesterB` 클릭 경로를 화면으로 잴 수 없다 — 법정 도구 한계 목록(`cannotBecause`)에 맞는 사유가 없어 주장하지 않는다. 등록 함수가 오류 없이 도는 것(앱·로그인 화면이 정상)만 게스트 시나리오로 낸다.
- 새 비밀번호 창(`openNewPasswordModal`)은 비밀번호 복구 메일 링크로만 열린다. 메일 발송은 되돌릴 수 없는 바깥 행위(④)라 실계정으로도 재지 않았다 — 토큰 동일만.
- 초기화 단추(`#resetBtn`)는 누르지 않았다(지시: 탈퇴·초기화 금지). 처리기 수 동일(이중 처리기 0)만.
- 실계정 비교 결과는 법정이 다시 재지 않는다 — `static`(글자만) 기록 항목 + `needs-login` 로만 실린다(설계 3-4).

## 5. [원칙 ⑤] 절차
worktree(origin/main 7bf4c36) → 기준 사본(git archive) → 설정 → 생성기 → verify(⑧ 포함) → 원본 단독 로드(`module-load-stage3.js`) → 신고서(`module-specs --write` · `requires: ui.confirm` · 설명 `cell-descriptions.json`) → module-guard → tests 전부 종료 코드 기준 대비 → 실계정 기준1·작업·기준2 → 게스트 시나리오 로컬(기준·작업) → main 합치기 → PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파
- 반론 1 「verify ok·tests 동일이면 충분하다」 → 이번에 그 둘이 통과한 판이 실제로는 앱을 못 띄웠다. 그래서 게스트 부팅 시나리오(`core-supabase-auth-guest-boot`)와 실계정 실행을 증거에 넣었고, 검사기에 순서 검사를 더했다.
- 반론 2 「검사기를 고치는 것은 판정 도구를 고치는 것 아닌가」 → `docs/design/harness/**` 는 작업자 보조 도구(금고 아님)이고 판정은 법정이 낸다. 검사를 **더한** 것뿐이며 기존 조건은 그대로다(완화 0).
- 반론 3 「SUPABASE_URL 도 옮겨야 줄이 더 준다」 → 하네스가 index.html 에서 읽어 깨진다. 2줄 이득보다 실계정 도구 보존이 낫다(keepRest, 설정에 근거).

## 7. [원칙 ⑦] 단계별 실행 — 식별자
DOM `#loginSubmit` · `#loginUser` · `#loginPass` · `#loginError` · `#landLoginLink` · `#authScreen` · `#resyncAccountDataBtn` · `#logoutBtn` · `#resetBtn` · `#landTesterBBtn` · `#authTesterBBtn` · `#btnLandingPreviewDirect` · `#screen-home` · `#screen-records`, 함수 `getSupabaseAuthToken` · `bindSupabaseAuthStateListener` · `enterAsTesterB` · `bindLandTesterBButton` · `bindAuthTesterBButton` · `openNewPasswordModal` · `bindLoginSubmit` · `bindResyncAccountDataButton` · `bindLogoutButton` · `bindResetButton`, 상수 `GOOGLE_OAUTH_CLIENT_ID`, 파일 `js/core/supabase-auth.js` · `js/tabs/settings/tester-entry.js` · `js/tabs/settings/account-actions.js` · `index.html` · `docs/design/harness/module-split/inline-stage3-z1-b.json` · `verify-inline-hard.js` · `module-load-stage3.js` · `real-account-stage3-z1-b-steps.json` · `real-account-stage3-z1-b-reach.json`.

## 8. [원칙 ⑧] 막히는 지점 예상 · 성과 측정 (작업자 측정, 판정 아님)
| 항목 | 결과 (출처) |
| :-- | :-- |
| verify | ok · 토큰 동일 · 남은 글자 동일 · 이중 처리기 0 · 키트 변수 뒤 가져오기(⑧) (`reports/TASK-ES-521/verify-inline-hard.json`) |
| 검사기 ⑧ 음성 대조 | 자리 H1 판에서 FAIL(`importBeforeKit` 3개), 나머지 검사 ok (`verify-kit-order-negative.json`) |
| 새 파일 줄 수 | 64 · 68 · 146 (800 이하) |
| 원본 단독 로드 | 회귀 0 · 새 파일 3개·ui-helpers·settings/index·app-scope 단독 로드 ok (`module-load-probe.json`) |
| tests 전후 | tests/*.test.js 113개 + npm test 스크립트 4개 종료 코드: 기준 사본(git archive)과 다른 것은 git 이력이 있어야 도는 2개(module-guard·new-module — 작업 트리에서 통과)뿐. 시험지 선행 불필요 |
| 게스트 도달 | 게스트 홈에서 getSupabaseAuthToken 1회(`real-account-reach-guest-base.json`) |
| 게스트 시나리오 | 3개 기준·작업 통과 (`scenario-local.json`) |
| 실계정 조작 비교 | 테스트 계정 A 6단계(로그인 제출·홈·기록·설정·데이터 다시 맞추기·로그아웃·토스트) 기준1 대 작업 0 · 기준1 대 기준2 0 · 43값 · pageerror 0, Supabase 쓰기는 도구가 끊음 (`real-account-compare.json`) |
| 검사기 ⑨ 음성 대조 | 뒤쪽 expose 블록에 _pendingAuthSession getter-only 한 줄을 넣은 사본에서 ⑨ 가 잡음, 기존 noSetter 는 0 (`verify-last-getter-negative.json`) |
| 막힐 지점 | main 이동 충돌(L010 — 생성기 재실행) · 다른 구역도 「HO 기관」 자리를 쓰면 같은 자리 충돌(재생성으로 해결) |

- 추가(오케스트레이터 지시 2026-10-06, Z2 발견 · 작업참고 L047): 검사기 ⑨ `lastGetterNoSetter` — 옮긴 코드가 대입하는 이름(L.X = …)은 index.html 에서 그 이름의 마지막 `get X()` 줄에도 `set X(v)` 가 있어야 한다. 뒤쪽 expose 블록의 getter-only 노출이 머리 setter 를 덮어 부팅이 멈추는 모양을 잡는다(기존 noSetter 는 「어디든 한 번 setter」라 못 잡음). 이 PR 의 대입 이름은 `_pendingAuthSession` 하나이고 마지막 getter 줄에 setter 가 있다(⑨ 0).

[4단계: 심사 청구]
