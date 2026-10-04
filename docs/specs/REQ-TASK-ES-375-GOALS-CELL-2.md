# REQ — #TASK-ES-375 목표 탭 세포 이전 2차: 결과 입력 모달·내보내기/보관 묶음을 js/tabs/goals/ 로 옮기기 (동작 그대로)

- 근거: 1차 #689(TASK-ES-370) 4절 "이번에 옮기지 않은 목표 탭 범위" 목록, 틀 `docs/specs/MODULE-SPLIT-PROTOCOL.md`. 선례 도구: `docs/design/harness/module-split/gen-goals.js`·`verify-goals.js`·`dom-compare-goals.js`.
- 범위(책임 단위 두 묶음): ① 결과 입력 모달 `openResultModal`(이전 전 8583~8931, 349줄) → `js/tabs/goals/result-modal.js` ② 내보내기·보관 `buildGoalSnapshot`·`goalSnapshotSummary`·`exportGoalSnapshot`·`archiveGoal`·`openGoalCertificateModal` → `js/tabs/goals/goal-export.js`. 통로는 기존 `js/core/app-scope.js`(바꾸지 않음), 키트는 1차의 `window.OurgoalGoalsKit`(새 전역 0).
- 기능 추가·삭제 0. 마크업(HTML)·CSS 는 옮기지 않았다. index.html 의 목표 탭 `confirm()` 들은 손대지 않았다(이번에 옮긴 함수 안에는 `confirm()` 이 없다 — 보관 전 확인창은 1차에 옮긴 `goal-detail-events.js` 에 있고 그대로다). `sortGoalsByOrder`·`shiftGoalOrder`(홈도 씀)는 남겼다.

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지

1. 1차 빌더가 남긴 목표 탭 목록 중 이번 PR 에 담을 만큼(1~2묶음)을 책임 단위로 `js/tabs/goals/` 세포로 옮긴다. 나머지는 보고한다.
2. 선례(#689) 그대로: 생성기로 글자 그대로 옮기고 이름 참조만 `L.`/`K.`, 토큰 동일 검사, 조작 DOM 비교(기준 2회·후 1회), tab-check 기준 2회·후, 법정 형식 게스트 시나리오.
3. 실계정 전후 확인: 로컬 127.0.0.2 정적 서버 + `/api` 운영 전달, 테스트 계정 A·B, 환경 변수는 Windows 사용자 환경 변수에서 자식 프로세스에만. 주소·비밀번호 출력·기록 0. 테스트 계정 둘의 데이터만 만들고 끝에 정리.
4. 신고서 `module-specs --write`, 모듈 가드·기준선, 새 파일 800줄 이하(part1/part2 금지). 동결 파일 변경 0, retire 0, 기대값 낮추기 0.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 목표 상세가 부르는 결과 입력·내보내기·보관 코드가 여전히 3만 7천 줄 index.html 인라인 IIFE 안에 흩어져 있어(8583줄·21046줄·33273줄), 목표 탭을 고칠 때마다 다른 탭과 같은 파일·같은 스코프를 만진다.
- **원인**: 1차가 목표 상세의 마크업·이벤트는 옮겼지만, 그 이벤트가 부르는 `openResultModal`·`exportGoalSnapshot`·`archiveGoal` 은 인라인에 남아 `L.` 통로로만 불리고 있었다.
- **중심**: 두 묶음은 서로 다른 책임이다 — ① 결과 입력 모달(목표·마일스톤·할 일 공용, AI 정리·수동 입력·저장·보관 버튼, 349줄 한 함수) ② 목표 데이터를 밖으로 내보내거나(AI 분석용 md/json) 보관하는 일(보관 → 100% 달성이면 완주 인증서).
- **핵심**: 묶음마다 한 파일, 함수는 통째로 글자 그대로. 옮긴 함수를 부르는 바깥(1차 이음매의 getter `get openResultModal(){…}` 등)은 index.html IIFE 머리에서 같은 이름으로 가져와 그대로 둔다.

## 3. [원칙 ③] 해결방식

- 생성기 `docs/design/harness/module-split/gen-goals-2.js`(1차 `gen-goals.js` 복제, 구간 분할 없음 — 함수 모두 800줄 이하): 스코프 분석으로 ① 옮길 이름의 재대입·중복 선언 0 ② 옮긴 코드 밖 참조 → 가져오기 목록 자동 산출(`openResultModal`·`exportGoalSnapshot`·`archiveGoal` — 1차 이음매 getter 가 읽는 이름) ③ 옮긴 코드가 읽는 인라인 이름 30개 중 앞선 이음매가 노출하지 않은 7개만 새 getter(`buildInviteLinkSuffix`·`burstConfetti`·`convertTextToNotionDbRecord`·`download`·`generateGoalCertificateImage`·`goalProgress`·`topicLabel`), 대입하는 인라인 이름 0 → setter 0 ④ 함수 바로 위 주석 처리: 함수 하나만 설명하는 주석(`/* 목표·마일스톤·할 일 공용 결과 입력 모달 */`)과 그 묶음만 덮는 구획 주석(`/* ============ 목표 현황 데이터 내보내기 (AI 분석용) ============ */`)은 함께 옮기고, 남는 함수(`restoreGoal`)가 있는 보관 구획 주석은 index.html 에 남긴다. 손으로 옮긴 글자 0.
- 결과 파일(책임 단위, 모두 800줄 이하): `js/tabs/goals/result-modal.js`(373줄) · `js/tabs/goals/goal-export.js`(194줄).
- index.html: 옮긴 자리에는 한 줄 표지 주석(붙어 있던 내보내기 세 함수는 한 줄), IIFE 머리 1차 이음매 바로 다음에 2차 이음매(가져오기 3줄 + getter 7개), `<script>` 두 줄은 `goals/render.js` 다음·`goals/index.js` 앞.

## 4. [원칙 ④] 재검토 — 한계(정직하게)

- **이번에 옮기지 않은 목표 탭 범위**(다음 PR — 각각 다른 책임 단위): 프롬프트 백과사전 묶음(`renderPromptEncyclopediaHtml`·`wirePromptEncyclopediaEvents`·`openAddUserPromptModal`·`getUserPrompts`·`getLikedPromptIds`·`getPromptLikesMap`·`_promptTabState`·`_promptEncyclopediaOpen`, 약 460줄 — 상태 변수 재대입이 있어 setter 가 필요한 묶음), 서브탭 화면(`renderTeamGoalsScreen` 771줄·`renderRoutineGoalsScreen` 402줄·`renderTemplateEncyclopediaScreen` 479줄·`renderGoalStatsChart`·`renderRoutineMatrixGrid` — 이 셋은 smoke-test 가 `function renderTemplateEncyclopediaScreen()` 등 글자를 찾으므로 합본 읽기로 찾히지만, 팀목표 화면은 팀 계정 실측이 필요), 완주 인증서 그림 `generateGoalCertificateImage`(공유 카드 그림 묶음과 같이 옮길 일 — 이번에는 L 통로).
- 옮기면서 발견한 이전 전 결함(고치지 않고 그대로 옮김 — 별도 티켓 몫):
  1. 결과 입력 모달의 '보관' 버튼(`#rsJustArchive`): 목표 결과 버튼(`#goalResultBtn`)에서 열면 4번째 인자 `goal` 이 없어 눌러도 아무 일이 없다(Dead-Click). 마일스톤·할 일 결과에서 열면 보관·저장 뒤 정의되지 않은 `renderGoalDetail()` 을 불러 `ReferenceError` 가 난다(게스트 조작 비교에서 기준·후 똑같이 1건 재현).
  2. 목표 상세의 `+ 최종 결과`(`#goalResultBtn`)는 `ui.css` 의 `#goalDetailBody > .toss-goal-hero-card { display: none !important; }` 에 가려 사용자 화면에 보이지 않는다(너비·높이 0). 목표 단위 결과 입력은 보관 확인창 경로로만 열린다.
- 신고서의 `goal.detail` 자리는 실제로 꽂지 않으므로 `planned.contributes` 로만 적었다(`slots.contribute` 연결은 별도 PR).

## 5. [원칙 ⑤] 절차

워크트리 `C:/dev/wt/goals-cell-2`(브랜치 `feat/2026-10-05-task-es-375-goals-cell-2`, 기준 origin/main 196c946) → 직전 커밋·#689 선례 정독 → 대상 확정(바인딩 참조 분석: 옮길 6함수의 바깥 호출처는 1차 이음매 getter 3개·`goal-detail-events.js` 의 `L.` 호출뿐) → 기준 앱 풀기(`git archive 196c946`) → 생성기 → 글자·누수 검사 → 신고서·가드 → `npm test`(기준·후) → 게스트 조작 비교(기준 2회·후 1회) → tab-check 목표 탭 기준 2회·후 → 실계정 RA-GOALS-03(운영·로컬 기준·로컬 후) + 계정 A·B 로그인 상태 조작 비교 → 법정 형식 게스트 시나리오 기준·후 → 문서 → PR → 법정.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "함수 선언을 `var x = _goalsKit.x` 로 바꾸면 끌어올림(hoisting)이 사라져, IIFE 가 그 줄보다 먼저 이 함수를 부르면 `undefined` 를 부른다." → 가져오기 줄은 IIFE 머리(`"use strict";` 다음 이음매 묶음, 2555줄 근처)에 있고, 그보다 앞서 도는 문은 앞선 탭 이음매뿐이다(함수 호출 없음). 옮긴 함수들은 모두 사용자 조작(버튼)이나 그 콜백에서만 불린다. 1차 이음매 getter(`get openResultModal(){ return openResultModal; }`)는 읽을 때마다 가져온 var 를 돌려주므로 `goal-detail-events.js` 의 `L.openResultModal(…)` 은 이제 키트의 같은 함수를 부른다 — 게스트 조작 59단계에서 결과 모달·내보내기·보관 경로가 기준과 같은 값을 냈다.
- 반론 2: "함수 안에서 이름 없이 부르던 것(`renderGoalDetail`·`renderHomeGoals`)이 파일 스코프로 옮겨 가면 다른 것을 부를 수 있다." → 검사기 `verify-goals-2.js` 가 옮긴 파일의 접두 없는 이름 중 인라인 IIFE 바인딩과 겹치는 것(누수)이 0 임을 확인했다. 두 이름은 이전 전에도 IIFE 에 없는 이름이라(전역 조회 → 없음) 옮긴 뒤에도 같은 전역 조회다 — 오류도 같은 오류다(조작 비교 `rs-just-archive-ms` 단계에서 기준·후 모두 `ReferenceError: renderGoalDetail is not defined` 1건, 다른 값 0).
- 반론 3: "게스트 시드는 `window.confirm` 을 늘 true 로 바꿔 두어 보관 확인창의 거절 경로를 못 잰다." → 조작 비교가 그 단계에서만 확인창 답을 정하는 대역을 걸어 거절(→ 바로 보관)·수락(→ 결과 입력 모달 → 저장 → 보관) 두 경로를 모두 눌렀고, 물은 글자까지 맞댔다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- DOM(옮긴 코드가 그리고 잇는 곳, 마크업 자체는 그대로): `#modalOverlay`·`#modalSheet`, 결과 모달 `#rsNotionDbPreview`·`#rsAiQuickInput`·`#rsAiQuickApplyBtn`·`#rsManualToggleBtn`·`#rsManualToggleArrow`·`#rsManualForm`·`#rsManualTitle`·`#rsManualStatus`·`#rsManualPct`·`#rsManualMetric`·`#rsManualKeyTakeaway`·`#rsCancel`·`#rsSave`·`#rsSaveAndArchive`·`#rsJustArchive`·`#ambientCheckinConfirmBtn`·`#ambientCheckinArchiveBtn`, 인증서 `#certImgWrap`·`#certShareBtn`·`#certSaveBtn`, 부르는 곳 `#goalResultBtn`·`[data-msresult]`·`[data-taskresult]`·`#goalExportBtn`·`#goalExportAllBtn`·`#goalArchiveBtn`.
- 함수: `openResultModal`, `buildGoalSnapshot`, `goalSnapshotSummary`, `exportGoalSnapshot`, `archiveGoal`, `openGoalCertificateModal`, `OurgoalAppScope.expose`, `OurgoalGoalsKit`.
- 파일: `index.html`, `js/tabs/goals/result-modal.js`·`goal-export.js`, `docs/architecture/modules.json`·`module-baseline.json`, `docs/design/harness/module-split/gen-goals-2.js`·`verify-goals-2.js`·`dom-compare-goals-2.js`.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

기준 = origin/main 196c946(`git archive` 사본). 결과 파일은 `reports/TASK-ES-375/`.

| 항목 | 도구 | 결과 |
| :-- | :-- | :-- |
| 글자 동일 | `verify-goals-2.js` | openResultModal 2,508 토큰·buildGoalSnapshot 452·goalSnapshotSummary 547·exportGoalSnapshot 131·archiveGoal 71·openGoalCertificateModal 480 전부 동일(L./K. 접두 제외), 누수 0·미노출 0·남은 정의 0·안 가져온 사용 0 (`verify-goals-2.json` `ok: true`) |
| 조작 전후(게스트) | `dom-compare-goals-2.js` | 59단계(결과 모달 목표·마일스톤·할 일: 수동 입력 펼치기·빈 AI 정리·AI 정리·저장·빈 저장·취소·100% 저장, 앰비언트 카드 '완료 승인'·'완료 승인 및 보관' / 내보내기 md 하나·전체·json / 보관: 결과 있음 → 완주 인증서·이미지 저장, 확인창 거절 → 바로 보관, 확인창 수락 → 결과 입력 → 보관 / 결과 모달 '보관' 버튼 두 경로 / 다시 그리기) × 13칸(화면 HTML·모달·목표 상태·저장값·토스트·확인창 글자·내보낸 파일 글자 …) = 767값, 기준 대 후 다른 값 0, 기준 대 기준 0, 콘솔 오류 기준 1 = 후 1(같은 `ReferenceError` — 4절 결함 1). 지운 값: 시간·난수, 인증서 캔버스 PNG(같은 앱 2회에서도 바이트가 달라 자리표로), 저장값의 `bonusCraftCredits`(js/avatar-system.js 가 채우는 칸 — 첫 저장 전 부팅 속도에 따라 있기도 없기도 해 같은 기준 앱 2회에서 처음 7단계가 달랐다) |
| 탭 실측 | `tab-check.js … goals` 기준 2회·후 1회 → `tab-compare.js` | 목표 탭 24장(4테마×2화면×3상태)+Dead-Click, 비교한 값 447 — 기준 1회 대 2회 0, 기준 1회 대 후 0, 기준 2회 대 후 0 |
| 실계정 RA-GOALS-03 | `real-account-check.js --only RA-GOALS-03` | 운영(이전 전) 통과 · 로컬 127.0.0.2 + /api 운영 전달 기준 사본 통과 · 같은 방식 이 변경 통과(정리 goals 1행 삭제·남은 0, 세 번 모두). 주소·계정 가림 |
| 실계정 로그인 상태 조작 | 작업자 보조 스크립트(같은 로컬 방식) | 계정 A·B 각각 22단계(표식 목표 만들기 → 마일스톤 추가 → 목표 결과 모달: 수동 펼치기·빈 AI 정리·AI 정리·저장 → 마일스톤 결과 100% 저장 → 다시 열기·취소 → 목표 100% 저장 → 내보내기 → 보관 → 완주 인증서 → 이미지 저장) × 10칸 = 220값, 다른 값 0. 콘솔 오류 기준 = 후(같은 종류: 정적 서버에 없는 자원 404·운영 API 400). 표식 목표 각 1개 만들고 지움, 남은 0 |
| 화면 시나리오(법정 형식) | `court/lib/scenario.js` runScenario, 법정 정적 서버·무작위 호스트 | `goals-ms-result-modal-save`·`goals-export-snapshot`·`goals-archive-with-result` 기준·후 모두 통과, 약점 0 |
| 모듈 가드 | `node scripts/module-guard.js` | ① 인라인 스크립트 34,806 → 34,316(-490) · ② 함수 선언 686 → 678 · ③ 282 그대로 · ④ 11 그대로 · ⑤ 0. 기준선 낮춤(`--update`) |
| index.html 전체 줄 | wc -l | 37,187 → 36,699 |
| 새 파일 줄 수 | wc -l | result-modal.js 373 · goal-export.js 194 (모두 800 이하) |
| npm test | `NODE_PATH=… npm test` | 기준·후 같음 — smoke-test 443/443 · verify-integrity-gate 38/38 · verify-all-clicks 정적 버튼 957 · test-shipyard-modular 통과(모듈 파일 수 38 → 40) |

폐기(retire) 청구 없음. 시험 기대값 변경 0. 동결 파일 변경 0.

확인 못 함: 실제 폰(레벨 6), 구글 캘린더 연동, AI 실서버 응답(결과 모달의 'AI 정리'는 로컬 규칙 변환 `convertTextToNotionDbRecord` 경로), 공유 시트(`navigator.share` — 헤드리스에 없음).

* **체크리스트 마감 규칙**: 본 작업계획서는 [4단계: 심사 청구]까지만 등록함.
