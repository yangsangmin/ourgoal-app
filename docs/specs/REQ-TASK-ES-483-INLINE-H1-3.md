# REQ — #TASK-ES-483 인라인 어려움 구역 H1 3차 — 세 묶음(자동 업데이트 제안·외부 데이터 불러오기(mock)·참고자료)을 세포 3개로 이전(동작 그대로) + 구역 H1 남은 두 묶음의 진입로 실측

- 근거: 상민님 원문(2026-10-05) "미분화 덩어리 분열 작업을 우선순위로 해야하지 않나?" · 헌법 v2026.10.05-CELL 세포골격 절(CELL_SPLIT · CELL_SPLIT_PROOF · claims_hygiene) · 설계 `docs/architecture/INLINE-HARD-SPLIT-DESIGN.md` · 구역 H1 1차 #TASK-ES-466(#772)·2차 #TASK-ES-476(#775) 병합 뒤 · 코디네이터 지시(2026-10-05): 「외부 데이터(mock)」는 가짜 데이터여도 옮기기만 하고 보고, 진입로를 못 찾은 묶음·숨은 배지는 근거와 함께 결함 목록으로.
- 범위: 구역 H1 어려움 묶음 세 개를 #762 생성기로 글자 그대로 옮긴다(기존 키트 `OurgoalGoalsKit`·`OurgoalRecordsKit`, 새 전역 0, 자리 표지 H1 아래). 생성기에 설정 표시 하나(`take.headerPick: 'nonEmpty'`)를 더한다 — 표시가 없으면 이전과 같다. 생성 지도 3종은 커밋하지 않는다.

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지

| 묶음(구획 주석 제목) | 새 세포 | 옮긴 것 |
| :-- | :-- | :-- |
| 기록 기반 목표·마일스톤·할 일 자동 업데이트 제안 | `js/tabs/goals/goal-update-suggest.js` | `findSuggestionTarget`·`sanitizeSuggestions`·`describeSuggestion`·`applySuggestion`·`maybeShowGoalUpdateModal` (smoke FN_NAMES 4개 — 생성기의 `smokeReadsCell` 판정대로 smoke 가 인라인 합본에서 찾음) |
| 외부 데이터 불러오기 (mock) | `js/tabs/records/external-import.js` | `openHomeCustomizer` + 로드 중 문 2개 감쌈(`bindImportExternalBtn`·`bindPersonalGuideBtn`). 샘플(mock) 데이터 `EXTERNAL_DATA` 는 소통 탭 세포에 있던 그대로 읽기만(고치지 않음). 한 줄에 두 문인 단추 등록 세 줄은 원래 자리 |
| 참고자료 (유튜브/영상, 이미지, 텍스트 메모, 웹링크) | `js/tabs/goals/attachments.js` | 함수 8개(`openAddAttachmentModal`·`openAttachmentViewer`·`renderAttachmentChipsHtml`·`renderInlineAttachmentChips`·`wireAttachmentChipClicks`·`applyGoalAgentOp`·`buildGoalFromAgentData`·`normalizeSequentialMilestoneDates`). window 노출 묶음은 원래 자리 |

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 미분화 덩어리에서 책임 단위 세포를 떼어 내되 동작은 하나도 바꾸지 않는다.
- **원인**: 세 묶음은 생성기가 멈추던 모양이었다 — 같은 글자의 구획 주석 두 줄(「참고자료」), 한 줄에 두 문(「외부 데이터」 — #TASK-ES-482 가 원래 자리에 남기는 경우를 허용하도록 고침), smoke FN_NAMES(「자동 업데이트 제안」 — #TASK-ES-465 의 `smokeReadsCell`).
- **중심**: 「참고자료」 구획 주석은 빈 줄 없이 같은 주석이 두 번 연달아 있다(첫 주석 아래에는 문이 없다). 생성기가 제목으로 묶음을 찾을 때 둘 다 맞아 멈췄다.
- **핵심**: 설정 표시 `headerPick: 'nonEmpty'` 가 있을 때만 "최상위 문을 담은 구획 주석" 하나를 고른다(표시가 없으면 이전과 같이 멈춘다 — 다른 빌더 설정 영향 0).

## 3. [원칙 ③] 해결방식

- 생성기 `groupRange(title, pick)` 에 `headerPick` 처리 7줄. 설정 `inline-hard-h1-483.json` → 생성 → verify → 단독 로드 → 신고서·설명 → 시험 → 게스트 조작 비교(`dom-steps-inline-h1-483.js`) → 시나리오 3개(세포마다 하나).

## 4. [원칙 ④] 재검토 — 한계와 발견(결함 목록 — 고치지 않음)

1. **「[#TASK-ES-174] 목표 템플릿 백과사전 전체화면 팝업」 묶음 — 게스트 진입로 없음(옮기지 않음)**. 작업자 실측(헤드리스 Chrome, 게스트 「바로 둘러보기」): 그 창(`#templateEncyclopediaModal`)을 여는 단추 ① `#btnGoalTemplateEncyclopedia` 는 `#personalGoalsView` 안인데 목표 탭에서 `#btnGoalsSubPersonal` 을 눌러도 `#personalGoalsView` 가 display:none(0×0) — 성소 V3 화면이 대신 그린다 ② `#og-task-53-action-btn`(`handle목표탭_Item53Action`)은 `#ogTaskWireSlot`(마크업 `style="display:none;"`, 주석 「배선/검증 전용 슬롯」) 안 ③ `#btnOpenEncyclopediaFromTeam` 은 팀 목표 만들기 창(`promptNewTeamGoal`) 안인데 그 창을 여는 `[data-addteamgoal]` 이 게스트 팀 목표 화면에 0개 ④ 목표 탭 「📖 템플릿」의 `#btnOpenFullTemplateEncyclopedia` 는 이 창이 아니라 `switchGoalsSubTab('templateEncyclopedia')`(다른 하위 탭)를 연다. → 숨은 UI 에 갇힌 기능(제3조 2항 대상). 살릴지·지울지는 승인선 ③ 이라 별도 결정.
2. **「XP/레벨 시스템」 묶음의 레벨 배지(`renderLevelBadge` → `#levelBadgeRow`) — 보이지 않음(옮기지 않음)**. `ui.css` 5529~5532줄이 네 테마(focus-sanctuary·black·white·urban-city) 모두 `#levelBadgeRow` 를 숨기고, 16902줄 `#screen-home.home-onescreen #levelBadgeRow { display: none !important; }`. 게스트 실측 `#levelBadgeRow` 0×0·display none. 배지 안 단추(`#btnOpenAvatarModal`·아바타 감싸개)도 누를 수 없다. #TASK-ES-462 가 홈 구성 이름표를 「따로 보이는 레벨 배지는 없어요」로 바꿨다(main). 화면 시나리오로 잴 수 없어 이번에 옮기지 않았다.
3. 「외부 데이터 불러오기 (mock)」의 샘플 목록(Strava·헬스 앱·수면 트래커 5줄)은 실제 연동이 아니라 고정 샘플이다(창 안에 「지금은 샘플 데이터예요」 안내). 지시대로 고치지 않고 옮기기만 했다. 같은 묶음의 홈 구성 단추(`#btnCustomHomeLayout`·`#topHomeLayoutBtn`)와 「개인 목표 200% 활용 가이드」(`#btnShowPersonalGuideModal`)는 게스트 화면에서 0×0(숨은 부모)이라 누를 수 없다(이전 전과 같음).
4. 「참고자료」 구획 주석이 같은 글자로 두 번 연달아 있다(첫 주석은 빈 묶음 — 지도 묶음 수에만 잡힘). 지우지 않았다(옮기기 PR).

## 5. [원칙 ⑤] 절차

worktree `C:/dev/wt/inline-h1-c`(브랜치 `feat/2026-10-05-task-es-483-inline-h1-3`, #775 위에서 시작 → 병합 뒤 origin/main 합침, 생성기 충돌은 main 판 위에 표시 한 개만 다시 얹음, index.html 은 main 판 입력으로 다시 생성) → 진입로 실측 → 설정·생성 → verify → 단독 로드 → 신고서·설명·가드 → 시험 → 조작 비교 → 시나리오 3개 → 문서·주장 → PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "생성기를 고치면 다른 빌더의 결과가 바뀐다." → 새 동작은 `take.headerPick === 'nonEmpty'` 일 때만 돈다. 표시 없는 설정은 같은 코드 경로(구획 주석이 1개가 아니면 멈춤)를 그대로 탄다.
- 반론 2: "smoke FN_NAMES 함수를 옮기면 smoke 단위 시험이 죽는다." → smoke-test 가 인라인 합본(js/tabs 세포, L. 뗌)에서 함수를 뽑는다(#TASK-ES-441). 측정: smoke 443/0 기준 = 작업, 시나리오 goal-update-suggest-apply 기준·작업 통과.

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- DOM: `#importExternalBtn`·`#modalOverlay [data-ext]`·`#extOpenUniversalModalBtn`, `#calEditAddAttBtn`·`#attTitleInput`·`#hubAddNewBtn`, `#homeAddGoal`·`#ngManualBtn`·`#mCatGrid [data-cat]`·`#mGoalTitle`·`#mSave`·`#captureInput`·`#captureSave`·`#firstCheckinDoneBtn`·`#btnCheckinAiClose`·`#sugApplyBtn`·`#toast`.
- 함수: 1절 표 + `OurgoalAppScope.expose` 새 getter 3개(`EXTERNAL_DATA`·`btnShowGuide`·`sanitizeAttachments`), 생성기 `groupRange`.
- 파일: `index.html`, 새 세포 3개, `docs/design/harness/module-split/gen-inline-hard.js`·`inline-hard-h1-483.json`·`dom-steps-inline-h1-483.js`, `docs/architecture/modules.json`·`cell-descriptions.json`, `reports/TASK-ES-483/*`.

## 8. [원칙 ⑧] 막히는 지점 · 성과 측정 (작업자 측정, 판정 아님)

| 항목 | 도구 | 결과 |
| :-- | :-- | :-- |
| 글자 동일 | `verify-inline-hard.js` | ok (`verify-inline-hard.json`) |
| 새 파일 줄 수 | 생성기 | goal-update-suggest 168 · external-import 95 · attachments 594 |
| index.html | 생성기 | 이 PR 의 이전 전(origin/main) −727줄 |
| 단독 로드 | `court/probes/module-load.js` 로컬 | 회귀 0, 새 파일 3개 단독 로드 ok·기존 키트 하나씩 |
| 시험 | tests·scripts + npm test 구성 | 기준 통과 → 작업 실패 0, smoke 443/0 (`test-compare.json`) |
| 모듈 가드 | `module-guard.js` | 통과(탭 간 직접 참조 0) |
| 게스트 조작 비교 | `dom-compare-inline-h1.js` | 14단계 × 10칸 = 140값, 기준 대 작업 0 · 기준 대 기준 0, 콘솔 오류 0 |
| 화면 시나리오 | `court/lib/scenario.js` 로컬 | 3개 기준·작업 모두 통과, 약점 0 |

[4단계: 심사 청구]
