# REQ — #TASK-ES-513 인라인 잔여 3단계 설계 + 시범(게스트로 못 재는 묶음을 실계정으로 재어 옮기기)

- 근거: 헌법 v2026.10.06-SNOWBALL(CELL_SPLIT · CELL_SPLIT_PROOF 5항), 작업참고 `C:/dev/agent-knowledge/WORK-REFERENCE.md` **기준 PR #800**, 앞 단계 설계 `docs/architecture/INLINE-HARD-SPLIT-DESIGN.md`.
- 지시(2026-10-06, 오케스트레이터 배정): 인라인 잔여(약 11,794줄·함수 205)를 더 줄일 다음 단계 설계 — 유형별 집계, (가) 게스트로 못 재는 묶음의 실계정 표준 절차와 법정 증거 형식, (나) FN_NAMES 묶음별 판정, (다) CELL_SPLIT 5 구분, 병렬 구역·PR 수, 그리고 (가) 중 가장 작은 묶음 하나를 실계정 하네스로 재어 옮기는 시범 PR 로 판정 줄을 받는다.
- 산출: 설계 문서 `docs/architecture/INLINE-STAGE3-DESIGN.md`, 시범 이동(「디바이스 세션 & 원격 로그아웃 유틸 (Req 1)」 → `js/tabs/settings/device-session.js`).
- 작업 유형(SNOWBALL): 설계·집계 (가) 표준 · 실계정 비교 시범 (다) 탐색·새 유형 — 설계 문서 0절. 이탈 없음.

## 1. [원칙 ①] 문제 정확히 파악
인라인 IIFE 에 91묶음이 남았고(지도 `inline-script-map.js`), 앞선 빌더들은 게스트 화면으로 잴 수 없는 함수를 「남김」으로 두었다(#481·#482·#493·#497). 법정은 외부 통신을 막아 로그인할 수 없고, 실계정 하네스 결과를 법정이 어떻게 평가하는지는 #696(「코드만 확인」) 한 번뿐이다.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심
- **본질**: 남은 덩어리의 상당 부분이 「옮길 수 없다」가 아니라 「옮긴 뒤 같은지 법정 앞에서 증명할 길이 없다」에 막혀 있다.
- **원인**: 법정 시나리오는 게스트(금고 fixture `guest-fresh` 하나)·외부 통신 0 이라 로그인 뒤 경로를 다시 돌릴 수 없고, 작업자 하네스 출력은 「자기가 낸 시험」이라 증거가 아니다(court/README 5절).
- **중심**: 「정말 게스트로 못 닿는가」를 먼저 재고(대부분 닿는다), 로그인 뒤 몫만 실계정 기준·작업 비교로 낸다.
- **핵심**: 손으로 옮긴 글자 0, 게스트로 닿는 몫은 법정이 직접 재는 시나리오, 로그인 뒤 몫은 정직하게 「법정 도구 한계」로 + 실측 파일.

## 3. [원칙 ③] 해결방식
1. 집계: `inline-stage3-classes.js`(새) — 지도·재파싱·시험지 선행 실측(잔여 전체로 넓힌 `inline-hard-test-probe`)을 칸별로.
2. 도구: `real-account-split-check.js`(새) — 단계 설정 JSON, `--guest`·`--count`(사본에만 호출 수 세기), Supabase 쓰기 차단.
3. 시범: 생성기(`gen-inline-hard.js`, 설정 `inline-stage3-pilot.json`, 자리 H1)로 「디바이스 세션 & 원격 로그아웃 유틸 (Req 1)」 묶음 전체를 옮기고 이메일 가입 처리기 등록 문은 `bindSignupSubmit` 으로 감쌌다.

## 4. [원칙 ④] 재검토 — 한계(정직하게)
- 「가장 작은 (가) 묶음」은 계측한 후보(앞선 빌더가 (가)로 남긴 함수 19개) 중에서 고른 것이다. 실측으로 (가)로 확인된 함수(게스트 0·계정 1+)는 `setDeviceLoginTime`·`loadProfile`·`ensureUserRow` 셋뿐이었고, 그중 묶음이 가장 작은 것이 이 묶음(114줄)이다. 「뱃지 컬렉션」(312줄)은 시험지 선행 2가 먼저다.
- 이 묶음의 `performLogout`·`getDeviceId`·`checkRemoteSessionRevoked` 는 게스트로도 닿는다(실측) → 게스트 시나리오로 낸다. 로그인 뒤에만 도는 것은 `setDeviceLoginTime`(로그인 때 기록)과 `checkRemoteSessionRevoked` 의 서버 확인 분기다.
- 감싼 이메일 가입 처리기(`#signupSubmit`)의 화면 진입로(가입 탭)는 숨겨져 있다(real-account-README 「회원가입 탭은 숨겨져 있다」) — 화면으로 누를 수 없어 주장하지 않는다. 처리기 수 동일(verify 이중 처리기 0)만 낸다.
- 실계정 비교 결과는 법정이 다시 재지 않는다 — `static`(글자만) + `needs-login` 으로만 실린다(설계 3-4).

## 5. [원칙 ⑤] 절차
worktree(origin/main 1ce6c144) → 지도 `--write`(커밋 안 함) → 집계 → 도달 실측(--guest·계정, --count) → 설정 → 생성기 → verify → 원본 단독 로드 → 신고서(module-specs --write · cell-descriptions) → tests 전후 → 게스트·실계정 기준1/작업/기준2 비교 → 게스트 시나리오 로컬(기준·작업) → 설계 문서 → main 합치기 → PR → 판정.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파
- 반론 1: 「게스트로 못 재는 묶음은 옮기지 않는 것이 #481·#762 선례다.」 → 선례는 「잴 길이 없을 때」였다. 이번엔 ① 묶음 대부분이 게스트로 닿음을 실측했고(게스트 시나리오로 법정이 직접 잰다) ② 로그인 뒤 몫은 실계정 기준·작업 비교 차이 0 을 파일로 남기며 ③ 헌법 CELL_SPLIT_PROOF 5항이 바로 이 경우(로그인 뒤 화면 → 실계정 하네스)를 정해 두었다. 검증이 선례보다 약하지 않다.
- 반론 2: 「실계정 하네스는 운영 DB 를 건드린다(읽기 전용이라 했지만).」 → 실측해 보니 앱이 로그인 직후 스스로 사용자 행·체크인을 올렸다. 새 도구는 Supabase rest/storage 의 GET 밖 요청을 끊고 그 수를 `writesBlocked` 로 남긴다 — 이 시범에서 운영에 나간 쓰기 0(로그인 토큰 발급·마지막 단계의 이 기기 로그아웃 제외).
- 반론 3: 「전체 수치(11,794 등)를 주장하면 설득력 있다.」 → main 이 움직이면 거짓(L002). 수치는 설계 문서에만 출처 커밋과 함께 두고 주장은 옮긴 묶음의 성질만.

## 7. [원칙 ⑦] 단계별 실행 — 식별자
DOM `#logoutBtn` · `#setGroupDataSummary` · `#authScreen` · `#toast` · `#activeDevicesContainer` · `#signupSubmit`, 함수 `getDeviceId` · `getDeviceLoginTime` · `setDeviceLoginTime` · `performLogout` · `checkRemoteSessionRevoked` · `bindSignupSubmit`, 파일 `js/tabs/settings/device-session.js` · `index.html` · `docs/design/harness/module-split/inline-stage3-pilot.json` · `docs/design/harness/module-split/real-account-split-check.js` · `docs/design/harness/module-split/real-account-stage3-pilot-steps.json` · `docs/design/harness/module-split/inline-stage3-classes.js` · `docs/architecture/INLINE-STAGE3-DESIGN.md`.

## 8. [원칙 ⑧] 막히는 지점 예상 · 성과 측정 (작업자 측정, 판정 아님)
| 항목 | 결과 (출처) |
| :-- | :-- |
| verify | ok · 토큰 동일 · 남은 글자 동일 · 이중 처리기 0(IIFE 269 → 268 + 세포 1) (`reports/TASK-ES-513/verify-inline-hard.json`) |
| 새 파일 줄 수 | 148 (800 이하) |
| 원본 단독 로드 | 회귀 0 · 새 파일·settings/index.js·app-scope.js 단독 로드 ok (`module-load-probe.json`) |
| tests 전후 | tests 종료 코드 기준 사본 = 작업 트리(커밋 전 측정, 차이 0). 작업 트리 npm test 종료 0(커밋 뒤). 기준 사본의 npm test 실패는 `cell-map-export-es414` 하나 — git archive 사본이라 git 이력이 없어서다(앞선 #496 과 같음) |
| 게스트 도달 | `performLogout`·`getDeviceId`·`checkRemoteSessionRevoked`·`getDeviceLoginTime` 게스트로 불림, `setDeviceLoginTime` 게스트 0 · 테스트 계정 2 (`real-account-reach-guest-base.json`·`real-account-reach-A-base.json`) |
| 게스트 조작 비교 | 6단계 기준1 대 작업 차이 0 · 기준1 대 기준2 0 (`guest-compare.json`) |
| 실계정 조작 비교 | 테스트 계정 A 6단계(로그인·탭 전환·설정·로그인 기기 목록·로그아웃·토스트) 기준1 대 작업 0 · 기준 대 기준 0 · pageerror 0 (`real-account-compare.json`) |
| 게스트 시나리오 | 1개 기준·작업 통과 (`scenario-local.json`) |
| 막힐 지점 | 법정이 실계정 증거를 「글자만」으로 셈(설계 3-4) · main 이 움직여 index.html 충돌(L010 생성기 재실행) |

[4단계: 심사 청구]
