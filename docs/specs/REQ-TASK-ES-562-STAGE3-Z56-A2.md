# REQ — #TASK-ES-562 인라인 3단계 구역 Z5 표준 1(다시 냄) (앱 잠금 PIN 형식·목표 종류 상수·로그인 화면 동작·가이드 단추·문의 단추)

- 근거: 헌법 v2026.10.06-SNOWBALL(CELL_SPLIT · CELL_SPLIT_PROOF), 설계 `docs/architecture/INLINE-STAGE3-DESIGN.md` 2절 표준(T) 표·6절 구역 Z5, 작업참고 `C:/dev/agent-knowledge/WORK-REFERENCE.md` **기준 PR #802**(L016·L015·L001·L009·L010·L025).
- 지시(2026-10-06, 오케스트레이터 배정): 구역 Z5+Z6 표준(T) 36묶음을 index.html 줄 순서대로 표준 이음매로 3~5묶음씩 연속 PR.
- 범위: T 묶음 7개 — 「[71] 앱 잠금 PIN (이 기기)」·「Goal category templates」·「P0: 비밀번호 찾기」·「각 탭 200% 활용법 …」·「앱 활용 가이드 다시보기」·「1:1 고객 문의 / 버그 제보」·「결과 기록 (체크박스 대신 수치 입력)」. 생성기 설정 `docs/design/harness/module-split/inline-stage3-z56-a.json`(자리 표지 Z56). 동작 0 변경.
- **다시 낸 경위(A안 선례 #745)**: 같은 코드를 #814(#TASK-ES-541)로 냈는데, main 을 여러 번 합치며 tests 전후 수치(smoke 통과 수)를 주장에 썼다가 바뀌어 주장을 고치고(C13c 추가 뒤 내림) 법정이 「돌려보냄 — 말없이 삭제된 주장」(판정번호 B9063C2A)으로 막았다 — 같은 PR 에서 풀 수 없는 막다른 길(L002·L003). 이 PR 은 같은 생성기 설정으로 main 판에서 다시 만들고, 주장에는 main 이 움직이면 바뀌는 수치(smoke 수·인라인 줄 수·세포 수·tests 종료 코드 목록)를 쓰지 않는다. 옮긴 묶음의 성질(verify·순서 점검·단독 로드)과 세포마다 게스트 시나리오·게스트 조작 비교만 주장한다.
- 작업 유형(SNOWBALL): (가) 표준(L016 이음매·L001 게스트 시나리오). 이탈 1건 — 아래 4절 「자리 표지」(사유 네 가지).

## 1. [원칙 ①] 문제 정확히 파악
T 36묶음 중 12묶음은 옮길 코드가 없다(모두 상태 변수·window 노출·3줄 이하 로드 중 문 — 원래 자리, 생성기 드라이런). 나머지 24묶음을 5벌(a~e)로 나눴고, 이 PR 은 시험지 선행이 필요 없는 앞쪽 7묶음이다(시험지 선행이 걸린 「8대 화면 스타일」 THEMES 는 #TASK-ES-524 병합 뒤 e 벌로 옮긴다).

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심
- **본질**: 설정·로그인·목표 탭의 작은 상수·단추 등록 문이 index.html 미분화 덩어리 안에 있어 세포 경계가 닿지 않는다.
- **원인**: 상수(유형 순수 상수)·로드 중 등록 문(B2)이 인라인 IIFE 최상위에 있다.
- **중심**: 표준 이음매 — 상수는 키트로 옮기고 같은 이름으로 가져옴, 등록 문은 bind 함수로 감싸 원래 자리에서 부름, 상태 변수·window 노출은 원래 자리(L getter).
- **핵심**: 손으로 옮긴 글자 0, verify 통과, 세포마다 게스트 시나리오 1개(기준·작업 통과), 게스트 조작 비교 차이 0.

## 3. [원칙 ③] 해결방식
| 새 세포 | 옮긴 것 | 원래 자리에 남긴 것 |
| :-- | :-- | :-- |
| `js/tabs/settings/app-lock-pin-format.js` | `APP_LOCK_PIN_PREFIX`(앞 주석 포함) | window 노출 if 두 개 |
| `js/tabs/goals/goal-category-templates.js` | `GOAL_TEMPLATES`·`ONBOARDING_PRESETS`·`QUICK_ACTIONS_BY_CAT`·`RESULT_UNITS` | — |
| `js/tabs/settings/auth-screen-actions.js` | 로그인 화면 탭 단추 등록 문 → `bindAuthTabButtons`, `openForgotPasswordModal` | `authTabButtons`·`fpBtn` 선언, `fpBtn` 등록 한 줄, `bindSignupSubmit();` 한 줄 |
| `js/tabs/settings/guide-buttons.js` | `#btnTabGuideHub`·`#btnRestartGuide` 등록 문 → `bindTabGuideHubButton`·`bindRestartGuideButton` | `tabGuideBtn`·`guideBtn` 선언, window 노출 |
| `js/tabs/settings/support-inquiry-bind.js` | 문의 단추·지원 이메일 등록 문 → `bindInquiryButtons`·`bindSupportEmailLink` | `footEmailEl` 선언 |
신고서 `docs/architecture/modules.json`(module-specs --write) · `cell-descriptions.json`(cell-desc-add). 생성 지도 3종은 커밋하지 않는다(L009).

## 4. [원칙 ④] 재검토 — 한계 · 이탈
- **이탈(나) — 자리 표지 Z56**: ① 규칙: 생성기 머리 이음매는 구역 자리 표지(H0~H4·HO) 아래에 넣는다(INLINE-HARD-SPLIT-DESIGN). ② 왜: 3단계는 다섯 빌더가 동시에 옮기는데 3단계 구역용 자리가 없다 — 같은 자리를 쓰면 머리에서 병합 충돌이 난다. ③ 대신: 생성기에 설정 `newSlotBefore` 를 더해(`gen-inline-hard.js` 7줄, 없으면 이전과 같다) 「H0 시범」 자리 표지 바로 앞에 `/* [어려움 이음매 자리 Z56] */` 한 줄을 두고 그 아래에 넣는다. 주석 한 줄이라 토큰 0. ④ 검증: verify 의 남은 글자 비교가 자리 표지 아래 줄을 대칭으로 빼므로 그대로 잰다(ok). 공지(L046, Z1 발견): 키트 변수 선언보다 앞에 가져오기가 들어가면 앱이 안 뜬다 — Z56 자리는 `_settingsKit`(2318줄)·`_goalsKit`(2454줄) 선언 뒤(2598줄)라 이 PR 의 두 키트는 안전하다(게스트 시나리오 5개가 모두 앱 부팅부터 지나간다). js/core 기관 키트(`_uiKit`, HO 자리 아래 선언)는 Z56 자리에 쓰지 않는다 — 다음 벌의 기관 세포는 HO 자리.
- `ONBOARDING_PRESETS`·`QUICK_ACTIONS_BY_CAT`·`RESULT_UNITS` 는 부르는 곳이 0 인 상수다 — 고치지 않고 그대로 옮겼다(발견 목록).
- 로그인 화면 「회원가입」 탭 단추는 `display:none` 인라인 숨김(index.html 95줄)이라 누를 수 없다 — 시나리오는 「로그인」 탭만 누른다.
- `#btnTabGuideHub`·`#btnRestartGuide`·`#feedbackInquiryBtn` 은 닫힌 「데이터 백업 & 고급 설정 / 고객지원」 묶음(`#setGroupDataSummary`) 안이다 — 시나리오는 그 묶음을 펼친 뒤 누른다(L025). 활용법 허브 닫기 단추(`#btnTabGuideClose`)는 그 자리를 다른 단추가 덮어 법정 클릭 도구로 누를 수 없어(기준에서도 같음) 뒤로가기로 닫는다 — 발견 목록.
- 게스트 조작 비교에서 설정 화면 전체 글자에 들어가는 「약 N KB 사용 중(브라우저 추정치)」는 index.html 크기에 따라 달라진다(1차 측정: 기준 893.0 KB · 작업 877.8 KB) — 그 단계는 「고객지원 및 가이드」 칸만 읽도록 좁혔다(동작 아님, 캐시 크기).

## 5. [원칙 ⑤] 절차
worktree(origin/main 2313ad6) → 드라이런(T 36묶음 이동·남김 분류) → 설정 a → 생성기 → verify → 단독 로드 → 신고서 → 게스트 시나리오 5개(기준 사본 = 같은 커밋 git archive) → 게스트 조작 비교(기준1→작업→기준2) → tests 전후 → main 합치기 → PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파
- 반론 1: "상수 하나(APP_LOCK_PIN_PREFIX)짜리 세포는 쪼개기 과잉이다." → 세포 단위는 책임이다. 이 상수는 앱 잠금 PIN 저장 형식(해시 접두) 하나의 책임이고, 이미 있는 `app-lock-pin.js` 는 생성기가 덮어쓰므로 붙일 수 없다(손 이동 금지). 시나리오(PIN 설정 → 해시 저장 → 스위치 켜짐)가 그 상수를 실제로 지난다.
- 반론 2: "부르는 곳 0 인 상수까지 옮기는 것은 의미가 없다 — 지우는 게 낫다." → 지우는 것은 기존 기능 삭제(승인선 ③)일 수 있고 옮기기 PR 에서 고치기를 섞지 않는다(L015). 발견 목록에 올린다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자
DOM `#twoFactorSwitch` · `#twoFaPinInput` · `#btnSave2Fa` · `#twoFactorPinControls` · `#homeAddGoal` · `#ngManualBtn` · `#mCatGrid` · `#landLoginLink` · `.auth-tab[data-authtab="login"]` · `#loginForm` · `#forgotPassBtn` · `#resetEmailInput` · `#setGroupDataSummary` · `#btnTabGuideHub` · `#tabGuideHubModal` · `#btnRestartGuide` · `#miniGuideOverlay` · `#footSupportEmailLink` · `#inquiryType` · `#toast`, 함수 `bindAuthTabButtons` · `openForgotPasswordModal` · `bindTabGuideHubButton` · `bindRestartGuideButton` · `bindInquiryButtons` · `bindSupportEmailLink`, 상수 `APP_LOCK_PIN_PREFIX` · `GOAL_TEMPLATES` · `ONBOARDING_PRESETS` · `QUICK_ACTIONS_BY_CAT` · `RESULT_UNITS`, 파일 위 3절 표 · `docs/design/harness/module-split/inline-stage3-z56-a.json` · `guest-steps-z56-a.json` · `scenario-local-z56.js` · `module-load-z56.js`.

## 8. [원칙 ⑧] 막히는 지점 예상 · 성과 측정 (작업자 측정, 판정 아님)
| 항목 | 결과 (출처) |
| :-- | :-- |
| verify | ok · 토큰 동일 · 덩어리 줄 동일 · 남은 글자 동일 · 이중 처리기 0 (`reports/TASK-ES-562/verify-inline-hard.json`) |
| 새 파일 줄 수 | 30 · 59 · 43 · 41 · 48 (모두 800 이하) |
| 원본 단독 로드 | 회귀 0, 새 파일 5개 단독 로드 ok (`module-load-probe.json`) |
| 게스트 시나리오 | 5개 기준·작업 통과 (`scenario-local.json`) |
| 게스트 조작 비교 | 10단계 기준1 대 작업 차이 0 · 기준1 대 기준2 0 (`guest-compare.json`) |
| tests 전후 | 작업 npm test 종료 0 · 종료 코드가 기준과 갈린 시험지는 cell-map-export-es414 하나(기준 사본 이력 없음) — 기록(`test-compare.json`), main 이 움직이면 바뀌는 값이라 주장하지 않음(L002) |
| 막힐 지점 | 다른 빌더 병합으로 index.html 충돌 → main 판을 입력으로 생성기 재실행(L010) |

[4단계: 심사 청구]
