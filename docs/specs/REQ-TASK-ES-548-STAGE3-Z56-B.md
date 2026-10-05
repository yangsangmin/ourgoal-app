# REQ — #TASK-ES-548 인라인 3단계 구역 Z5 표준 2 (앱 진입·수동 일정 편집 창·화면 사용 계측·스타터 목표 템플릿)

- 근거: 헌법 v2026.10.06-SNOWBALL(CELL_SPLIT · CELL_SPLIT_PROOF), 설계 `docs/architecture/INLINE-STAGE3-DESIGN.md` 2절 표준(T) 표·6절 구역 Z5, 작업참고 `C:/dev/agent-knowledge/WORK-REFERENCE.md` **기준 PR #802**(L016·L015·L001·L009·L010·L042) + 오케스트레이터 공지 L046(기관 키트 가져오기 순서)·L047(getter 전용 노출이 setter 를 덮음).
- 지시(2026-10-06, 오케스트레이터 배정): 구역 Z5+Z6 표준(T) 묶음을 index.html 줄 순서대로 표준 이음매로 연속 PR.
- 범위: T 묶음 4개 — 「Enter app」·「캘린더 수동 일정 편집 모달 (Req 2 & #TASK-ES-253)」·「UX Telemetry (Hesitation & Rage Tap)」·「신규 유저 10초 활성화: 갓생 스타터 목표 템플릿」. 생성기 설정 `docs/design/harness/module-split/inline-stage3-z56-b.json`(자리 표지 **HO 기관** — L046). 동작 0 변경.
- 작업 유형(SNOWBALL): (가) 표준. 이탈 없음(이 PR 은 기존 자리 HO 를 쓴다 — 앞 PR #814 의 새 자리 Z56 은 기관 키트 `_uiKit` 선언보다 앞이라 기관 세포에 쓰지 않는다).

## 1. [원칙 ①] 문제 정확히 파악
앱 진입(enterApp)과 그 뒤 로드 중 등록 문 6개(포커스·가시성 복귀·원격 로그아웃 신호·15초 확인·온라인·오프라인), 496줄짜리 수동 일정 편집 창, 계측 상자·연타 감지 등록 문, 스타터 목표 템플릿 상수가 index.html 인라인 IIFE 에 남아 있다.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심
- **본질**: 앱 껍데기(진입·연결 상태)와 일정·목표·설정 탭의 덩어리가 index.html 미분화 덩어리 안에 있어 세포 경계가 닿지 않는다.
- **원인**: 함수 선언·상수·로드 중 등록 문(B2)이 인라인 최상위에 있다.
- **중심**: 표준 이음매 — 함수·상수는 키트로 옮겨 같은 이름으로 가져오고, 등록 문은 bind 함수로 감싸 원래 자리에서 부른다. 기관 세포(js/core)는 `_uiKit` 선언 뒤인 HO 자리에 가져오기를 둔다.
- **핵심**: 손으로 옮긴 글자 0, verify 통과, 이음매 순서 점검(L046·L047) 통과, 세포마다 게스트 시나리오 1개, 게스트 조작 비교 차이 0.

## 3. [원칙 ③] 해결방식
| 새 세포 | 옮긴 것 |
| :-- | :-- |
| `js/core/app-enter.js`(기관, OurgoalUiHelpers, ui-helpers 태그 뒤) | `enterApp` + 등록 문 6개 → `bindFocusResync`·`bindVisibilityResync`·`bindRemoteLogoutStorageListener`·`startRemoteSessionPoll`·`bindOnlineSync`·`bindOfflineNotice` |
| `js/tabs/calendar/manual-edit-modal.js` | `openCalendarManualEditModal` |
| `js/tabs/settings/ux-telemetry.js` | `_uxTelemetry` + 연타 감지 등록 문 → `bindRageTapTelemetry`(window 노출 두 줄은 원래 자리) |
| `js/tabs/goals/starter-goal-templates.js` | `STARTER_GOAL_TEMPLATES` |
도구: `docs/design/harness/module-split/seam-order-check.js`(새 — 가져오기 줄이 키트 선언 뒤인가·대입하는 이름의 마지막 노출에 setter 가 있는가). 신고서·설명 등록. 생성 지도 3종은 커밋하지 않는다(L009).

## 4. [원칙 ④] 재검토 — 한계
- `_uxTelemetry` 는 기록만 하고 읽는 곳이 0 이다(화면에 드러나는 효과 없음) — 고치지 않고 그대로 옮겼다(발견 목록). 시나리오는 연타 감지 처리기가 붙은 채로 탭을 빠르게 두 번 눌러도 화면 전환·예외 0 을 잰다(처리기는 모든 클릭에서 돈다).
- 오프라인 안내 띠 `#offlineNoticeBanner` 는 `ui.css` 5268줄 `display: none !important`(「6대 노이즈 배너 시각적 정리」)에 갇혀 있다 — `bindOfflineNotice` 가 `style.display='block'` 을 넣어도 보이지 않는다(기준 동일). 숨김을 풀지 지울지는 승인선 ③이라 손대지 않고 「CSS 숨김에 갇힌 기능」 목록에 올린다(L042). 시나리오는 토스트만 잰다.
- 스타터 목표 단추는 홈 「오늘의 퀘스트」 나침반(`#homeCompassQuest`) 바텀시트 안(목표 0개일 때)에서만 보인다 — 시나리오가 그 경로로 연다.
- `startRemoteSessionPoll`·`bindRemoteLogoutStorageListener`·포커스/가시성 복귀의 원격 로그아웃 분기는 로그인 뒤에만 뜻이 있다. 이 PR 은 등록 문을 감싸기만 했고(verify 처리기 수 동일·호출 줄 원래 자리), 로그인 뒤 분기는 #802 시범의 실계정 비교 범위(디바이스 세션)와 같은 함수를 부른다 — 로그인 뒤 동작 주장은 내지 않는다.

## 5. [원칙 ⑤] 절차
worktree(origin/main 5bb63ca) → 설정 b(slot HO) → 생성기 → verify → 이음매 순서 점검 → 단독 로드 → 신고서·설명 → 게스트 시나리오 4개(기준 = 같은 커밋 git archive) → 게스트 조작 비교(기준1→작업→기준2) → tests 전후 → main 합치기 → PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파
- 반론 1: "enterApp 은 앱 껍데기라 옮기면 부팅이 깨질 수 있다(L046 사고)." → 가져오기 `var enterApp = _uiKit.enterApp;` 은 HO 자리, `_uiKit` 선언 뒤다(`seam-order-check.json` importsBeforeKitDecl 0). 시나리오 4개 모두 첫 화면 → 「로그인 없이 둘러보기」 → 앱 껍데기(`#appShell.active`)를 지나며 기준·작업 통과.
- 반론 2: "옮긴 코드가 대입하는 이름(setter)이 뒤쪽 getter 전용 노출에 덮인다(L047)." → 같은 점검의 setterGaps 0(대입 이름 목록은 verify assignedL).

## 7. [원칙 ⑦] 단계별 실행 — 식별자
DOM `#btnLandingPreviewDirect` · `#appShell` · `#toast` · `#offlineNoticeBanner` · `#calAddManualBtn` · `#calEditTitle` · `#calEditSaveBtn` · `#calEditCancelBtn` · `#homeCompassQuest` · `.starter-goal-btn[data-starter="study"]` · `#screen-goals` · `.navbtn[data-tab]`, 함수 `enterApp` · `bindFocusResync` · `bindVisibilityResync` · `bindRemoteLogoutStorageListener` · `startRemoteSessionPoll` · `bindOnlineSync` · `bindOfflineNotice` · `openCalendarManualEditModal` · `bindRageTapTelemetry`, 상수 `_uxTelemetry` · `STARTER_GOAL_TEMPLATES`, 파일 위 3절 표 · `inline-stage3-z56-b.json` · `guest-steps-z56-b.json` · `seam-order-check.js`.

## 8. [원칙 ⑧] 막히는 지점 예상 · 성과 측정 (작업자 측정, 판정 아님)
| 항목 | 결과 (출처) |
| :-- | :-- |
| verify | ok · 토큰 동일 · 남은 글자 동일 · 이중 처리기 0 (`reports/TASK-ES-548/verify-inline-hard.json`) |
| 이음매 순서(L046·L047) | 키트 선언 앞 가져오기 0 · setter 빠짐 0 (`seam-order-check.json`) |
| 새 파일 줄 수 | 176 · 510 · 46 · 63 (모두 800 이하) |
| 원본 단독 로드 | 회귀 0, 새 파일 4개 단독 로드 ok (`module-load-probe.json`) |
| 게스트 시나리오 | 4개 기준·작업 통과 (`scenario-local.json`) |
| 게스트 조작 비교 | 7단계 기준1 대 작업 차이 0 · 기준1 대 기준2 0 (`guest-compare.json`) |
| tests 전후 | `test-compare.json` |
| 막힐 지점 | #814 와 같은 설정·키트 태그 줄을 고쳐 먼저 병합된 쪽 뒤에 충돌 → main 판을 입력으로 생성기 재실행(L010) |

[4단계: 심사 청구]
