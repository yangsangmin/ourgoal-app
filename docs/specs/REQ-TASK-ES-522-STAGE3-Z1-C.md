# REQ — #TASK-ES-522 인라인 3단계 Z1(로그인·계정) 2차: 뱃지 컬렉션 묶음의 프로필 불러오기 · 서버 관리자 API 복구 · 회원 탈퇴 전용 안내 모달을 세포 3개로 이전(동작 그대로)

- 근거: 헌법 v2026.10.06-SNOWBALL(CELL_SPLIT · CELL_SPLIT_PROOF 5항), 설계 `docs/architecture/INLINE-STAGE3-DESIGN.md` 3절(실계정 표준 절차 — 3-4 두 주장 배치)·6절(Z1), 작업참고 `C:/dev/agent-knowledge/WORK-REFERENCE.md` 기준 PR #802(L016·L045·L046·L047·L010·L009·L002), 시험지 선행 PR #804(#TASK-ES-518 — account-withdrawal-modal·google-session-guard·security-audit 가 합본을 읽음).
- 작업 유형(SNOWBALL): (가) 표준 — 표준 이음매(L016) + 설계 3-4 의 실계정 두 주장 배치(L045). 이탈 없음.

## 1. [원칙 ①] 문제 정확히 파악
Z1 남은 묶음 중 세 개를 옮긴다: 「뱃지 컬렉션 (명예의 전당)」에 남아 있던 프로필 쪽(앞선 #TASK-ES-482 가 로그인 뒤 경로라 남김 — totalCompletedMilestones · resolveUniqueDisplayName · formatDisplayNameWithTag · ensureUserRow · loadProfile), 「서버 관리자 API를 통한 기록 및 프로필 복구 (#TASK-ES-036)」(syncServerRecords), 「회원 탈퇴 전용 안내 모달 및 법적책임·데이터분실 사전 안내 (#TASK-ES-158)」(openWithdrawModal · closeWithdrawModal · submitWithdrawAccount · withdrawAccount).

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심
- **본질**: 옮기기(동작 0 변경). 버그도 그대로.
- **원인**: 로그인 뒤 경로가 섞여 게스트 화면만으로는 잴 수 없어 앞 단계가 남겨 두었다.
- **중심**: 게스트로 닿는 몫(명예의 전당의 완료 마일스톤 합, 탈퇴 안내 창 열고 닫기)은 게스트 시나리오, 로그인·Supabase 가 있어야 도는 몫(프로필 불러오기·사용자 행·서버 기록 복구·로그인 상태의 탈퇴 창)은 실계정 기준1→작업→기준2 비교 + `needs-login`.
- **핵심**: 손으로 옮긴 글자 0, 탈퇴 확정 단추는 어디서도 누르지 않는다(되돌릴 수 없음 ④).

## 3. [원칙 ③] 해결방식
설정 `docs/design/harness/module-split/inline-stage3-z1-c.json`(자리 「HO 기관」 — js/core 세포의 키트 변수 `_uiKit` 가 그 자리 위에 있다, L046) → `gen-inline-hard.js`:
- `js/core/profile-load.js`(기관, OurgoalUiHelpers): 프로필 쪽 함수 5개. `defaultProfile`(함수 끝 줄에 노출 문이 붙어 있어 옮기면 그 줄이 잘린다 — 생성기 정지 조건)·`state`·노출 줄은 원래 자리(keepRest).
- `js/core/server-records-sync.js`(기관): `syncServerRecords`.
- `js/tabs/settings/withdraw-modal.js`: 탈퇴 창 함수 4개. 「회원 탈퇴」 단추 한 줄 등록 문은 원래 자리(3줄 이하).

## 4. [원칙 ④] 재검토 — 한계(정직하게)
- 게스트도 다시 맞추기 단추로 syncServerRecords·loadProfile·ensureUserRow 를 부른다(로컬 실측: 게스트 resync 뒤 loadProfile 1·ensureUserRow 1). 그러나 syncServerRecords 는 로그인 세션 토큰이 없으면 바로 끝나고, loadProfile·ensureUserRow 는 Supabase 서버 응답(users·goals·checkins 조회)이 있어야 본문이 돈다 — 법정은 Supabase 라이브러리는 고정 사본으로 주지만(court/config.json stubs) Supabase 서버 통신은 막아(allowHosts 0) 이 경로의 결과를 다시 만들 수 없다. 그래서 이 몫은 `needs-login` 과 실계정 비교로 낸다.
- 법정과 같은 조건(법정 실행기 로컬 실행 — 라이브러리 고정 사본·서버 통신 차단)의 게스트 다시 맞추기는 6초 뒤에도 단추가 잠긴 채였다(기준·작업 같음) — 법정 환경에서만 생기는 모양이라 결함 목록에는 「확인 필요」로만 적는다.
- 동명이인 태그(resolveUniqueDisplayName·formatDisplayNameWithTag)는 서버 users 조회가 있어야 결과가 나온다 — 실계정 비교에 포함(로그인 때 ensureUserRow 경로), 화면 단독 주장은 하지 않는다.
- 탈퇴 확정(submitWithdrawAccount)은 누르지 않았다 — 토큰 동일·처리기 수 동일만.
- 실계정 비교 결과는 법정이 다시 재지 않는다 — `static`(글자만) 기록 항목 + `needs-login` 로만 실린다(설계 3-4).

## 5. [원칙 ⑤] 절차
#804(시험지 선행) 병합 뒤 origin/main → 기준 사본(git archive) → 설정 → 생성기 → verify(⑧·⑨ 포함 판 — #811) → 원본 단독 로드 → 신고서·설명 → module-guard → tests 전부 종료 코드 → 도달 실측(--guest·계정 --count) → 실계정 기준1·작업·기준2 → 게스트 시나리오 로컬 → main 합치기 → PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파
- 반론 1 「게스트도 loadProfile 을 부르니 needs-login 은 L006 위반이다」 → 법정이 잴 수 있는지가 기준이다. 게스트 경로도 Supabase 서버 응답이 있어야 loadProfile 본문이 돈다 — 법정 화면은 Supabase 서버 통신을 막아(라이브러리는 고정 사본) 같은 결과를 만들 수 없고, 실측에서도 6초 안에 끝나지 않았다. 게스트로 법정이 잴 수 있는 몫(명예의 전당이 부르는 totalCompletedMilestones, 탈퇴 창 열고 닫기)은 모두 시나리오로 냈다.
- 반론 2 「탈퇴 창을 실계정으로 여는 것도 위험하다」 → 창 열기·취소는 서버에 아무것도 보내지 않는다(코드 확인: 확정 단추 onclick 만 submitWithdrawAccount). 하네스는 Supabase 쓰기와 /api 의 track 밖 요청을 모두 끊는다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자
DOM `#hallOfFameBtn` · `#modalSheet` · `#hofClose` · `#withdrawBtn` · `#withdrawModal` · `#withdrawConfirmBtn` · `#withdrawCancelBtn` · `#withdrawAgreeCheck` · `#resyncAccountDataBtn` · `#setGroupDataSummary`, 함수 `totalCompletedMilestones` · `resolveUniqueDisplayName` · `formatDisplayNameWithTag` · `ensureUserRow` · `loadProfile` · `syncServerRecords` · `openWithdrawModal` · `closeWithdrawModal` · `submitWithdrawAccount` · `withdrawAccount`, 파일 `js/core/profile-load.js` · `js/core/server-records-sync.js` · `js/tabs/settings/withdraw-modal.js` · `index.html` · `docs/design/harness/module-split/inline-stage3-z1-c.json` · `real-account-stage3-z1-c-steps.json` · `real-account-stage3-z1-c-reach.json` · `module-load-stage3.js`.

## 8. [원칙 ⑧] 막히는 지점 예상 · 성과 측정 (작업자 측정, 판정 아님)
| 항목 | 결과 (출처) |
| :-- | :-- |
| verify | ok · 토큰 동일 · 남은 글자 동일 · 이중 처리기 0 · 키트 변수 뒤 가져오기 0 · 마지막 getter setter 빠짐 0 (`reports/TASK-ES-522/verify-inline-hard.json`) |
| 새 파일 줄 수 | 325 · 136 · 205 (800 이하) |
| 원본 단독 로드 | 회귀 0 · 새 파일 3개·ui-helpers·settings/index·app-scope 단독 로드 ok (`module-load-probe.json`) |
| tests 전후 | #804 시험지 판으로 tests 전부 종료 코드 기준과 같음(git 이력 의존 2개 제외) |
| 도달 실측 | 게스트: 홈부터 totalCompletedMilestones·syncServerRecords(토큰 없어 바로 끝남), 다시 맞추기 뒤 loadProfile·ensureUserRow, 탈퇴 단추 openWithdrawModal / 테스트 계정: 로그인 때 loadProfile·ensureUserRow 2 (`real-account-reach-guest-base.json`·`real-account-reach-A-base.json`) |
| 게스트 시나리오 | 2개 기준·작업 통과 (`scenario-local.json`) |
| 실계정 조작 비교 | 테스트 계정 A 8단계(로그인·홈·기록·설정·명예의 전당·다시 맞추기·탈퇴 창 열기/취소) 기준1 대 작업 0 · 기준1 대 기준2 0 · 56값 · pageerror 0 (`real-account-compare.json`) |
| 쓰기 차단 수(비교 밖) | #811·#804 병합 뒤 main 위 재측정에서 작업 1회차만 끊은 users POST 가 7(기준 6) — 작업 2·3회차와 기준 3회차는 모두 6. 실행마다 흔들리는 자동 동기화 타이밍으로 보고 화면 비교 대상에서 뺀 값이다(서버에 나간 쓰기 0, 도구가 끊음) |
| 막힐 지점 | #811 과 같은 자리(HO) — 먼저 병합되는 쪽 뒤에 생성기 재실행(L010) |

[4단계: 심사 청구]
