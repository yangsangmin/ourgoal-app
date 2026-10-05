# REQ — #TASK-ES-492 인라인 어려움 기관 묶음 이전 3차 — 맞춤 피드백 봇(설정 창 · 체크인 피드백 보여 주기로 책임 나눔)

- 근거: 코디네이터 지시(2026-10-05 — 기관 빌더, PR 당 600~1,500줄) · 설계 `docs/architecture/INLINE-HARD-SPLIT-DESIGN.md` 2-7(800줄 초과 묶음은 책임 단위로) · 헌법 CELL_SPLIT·CELL_SPLIT_PROOF · 앞 PR #782(기관 2차) 위.
- 범위: 「맞춤 피드백 봇 설정」 묶음(1,085줄)을 생성기로 글자 그대로 세포 2개로 옮김. 기능 추가·삭제 0, 마크업·CSS 이동 0, 동결 파일 0, 시험 기대값 변경 0, retire 0, 생성 지도 3종 커밋 0.
- 남은 기관: 「프로필」(574줄) — 다음 PR. 「Confetti」·「뱃지 컬렉션」·「전역 휴지통」은 H3 빌더 몫.

## 1. [원칙 ①] 문제 정확히 파악

1. 「맞춤 피드백 봇 설정」은 800줄을 넘고(1,085줄) 책임이 둘이다: 피드백 봇 설정 창(프리셋·맞춤 프롬프트·설정 화면 그리기 485줄)과 체크인 피드백 보여 주기(홈·기록 피드백 칸, 체크인 피드백 창 231줄, 피드 바로 공유).
2. 들어오는 묶음 13개(지도 fanIn) — 홈 체크인 저장(기록 세포)·목표 새 목표 창(말풍선)·소통 피드(「n분 전」 글자) 등이 부른다.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 설정 창과 결과 보여 주기가 한 구획에 쌓여 있어 한 세포로는 800줄 상한도 넘고 책임도 섞인다.
- **원인**: 기능이 같은 구획 주석 아래에 차례로 덧붙었다.
- **중심**: 설정 `take.names` 로 같은 묶음을 두 세포가 이름으로 나눠 갖고, 이름을 안 고른 문은 `keepRest` 로 원래 자리(홈·설정 단추 클릭 등록 한 줄씩·window 노출) — 생성기를 고쳐 다른 세포의 keepRest 는 옮기기에 지게 했다.
- **핵심**: 설정 창은 설정 탭 세포(`js/tabs/settings/feedback-bot-setup.js`, OurgoalSettingsKit), 보여 주기는 기록 세포(`js/tabs/records/checkin-feedback.js`, OurgoalRecordsKit). 새 전역 0.

## 3. [원칙 ③] 해결방식

| 세포 | 옮긴 함수 |
| :-- | :-- |
| `js/tabs/settings/feedback-bot-setup.js` (632줄) | customFeedbackStatusSuffix·refreshCustomFeedbackButtons·getSavedFeedbackPresets·persistFeedbackPresets·openFeedbackSetup·closeFeedbackSetup·generateCustomFeedbackPrompt·fbBotBubbleHtml·renderFeedbackSetup·openFeedbackSetupGated |
| `js/tabs/records/checkin-feedback.js` (526줄) | verdictClass·renderFeedbackSlot·getUserAvatarHtml·showCheckinFeedbackSheet·closeCheckinFeedbackSheet·instantShareCheckinToFeed·renderRecordFeedbackSlot·timeAgoStr |

- 원래 자리에 남긴 것: window 노출 4줄·노출 묶음 1개, 클릭 등록 3줄(`customFeedbackBtn`·`settingsCustomFeedbackBtn`·`fbSetupBack` — 한 줄씩).
- 설정 `docs/design/harness/module-split/inline-organ-3.json`. 생성기 고침 1곳(여러 세포가 묶음을 나눌 때 keepRest 남김은 옮기기에 짐 — 진짜 남김과 겹치면 여전히 멈춤).

## 4. [원칙 ④] 재검토 — 한계·발견

- **발견(고치지 않음)**: 홈 체크인 칸의 「나만의 AI 말투 & 피드백 설정」 단추(`#customFeedbackBtn`)는 화면 가운데로 굴려도 다른 단추가 덮고, 설정 탭 「고급 설정」 펼침(`#advancedSettingsSummary`)·「맞춤 피드백 봇 설정하기」(`#settingsCustomFeedbackBtn`)는 법정 클릭 도구가 그 자리에서 요소를 찾지 못한다(기준 커밋에서도 같음). 실제 사용자도 누르기 어려운 죽은 클릭일 수 있다 — 별도 티켓(제6조). 그래서 설정 창 세포는 다른 진입로(새 목표 창의 말풍선 `fbBotBubbleHtml`)로 쟀다.
- 실계정 비교는 하지 않았다(피드 바로 공유는 로그인·운영 DB 쓰기).
- main 이 이 PR 사이에 움직여(#783·#784·#775) 앞 PR #782 를 main(c1f0a72) 판으로 다시 만든 뒤, 이 PR 의 index.html 도 그 위에서 생성기를 다시 돌려 만들었다(verify ok, 시나리오 2개 기준·작업 통과, 모듈 로드 회귀 0, npm test 0 을 다시 잼 — 조작 비교·시험 종료 코드 비교는 바로 앞 기준 값). tab-check(앞 PR #776 분, 홈·목표·일정)는 아직 도는 중이다 — 끝나면 다음 PR 기록에 싣는다.

## 5. [원칙 ⑤] 절차

worktree `C:/dev/wt/inline-organ`(브랜치 `feat/2026-10-05-task-es-492-inline-organ-4`, push 로 번호 선점, #782 위) → 묶음 안 문 목록 → 설정 → 생성기 고침 → 생성 → verify → 모듈 로드 탐침 → 신고서·설명 → 게스트 시나리오 2개 + 돌연변이 2개 → 조작 비교 → 시험 → main 합치기 → push → PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "한 묶음을 둘로 나누면 서로 부르던 함수(설정 창 → 피드백 칸 다시 그리기 등)가 끊긴다." → 다른 세포로 간 이름은 `L.<이름>`(index.html 이 가져온 같은 함수의 getter)로 부른다. 측정: verify 미노출 0·안 가져온 사용 0, 체크인 피드백 창 시나리오·새 목표 창 시나리오 기준·작업 통과.
- 반론 2: "keepRest 를 옮기기에 지게 바꾸면 남겨야 할 문까지 옮겨질 수 있다." → 지는 것은 「이 세포가 이름을 고르지 않았다」는 이유의 남김뿐이고, 상태 변수·window 노출·감쌀 수 없는 문의 남김과 겹치면 생성기가 멈춘다. 측정: 이번 남김 7문(노출 5·클릭 등록 3 중 한 줄 문 포함) 모두 index.html 원래 자리(verify 남은 글자 150,733토큰 동일).

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- DOM: `#sAddGoalBtn`, `#modalOverlay`, `#modalSheet`, `#captureInput`, `#captureSave`, `#firstCheckinDoneBtn`, `#btnCheckinAiGoRecords`, `#btnCheckinAiShareFeed`, `#customFeedbackBtn`·`#settingsCustomFeedbackBtn`·`#advancedSettingsSummary`(발견).
- 함수: 3절 표, `OurgoalSettingsKit`, `OurgoalRecordsKit`.
- 파일: `index.html`, `js/tabs/settings/feedback-bot-setup.js`, `js/tabs/records/checkin-feedback.js`, `docs/architecture/modules.json`·`cell-descriptions.json`, `docs/design/harness/module-split/gen-inline-hard.js`·`inline-organ-3.json`, `reports/TASK-ES-492/`.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

| 항목 | 결과 |
| :-- | :-- |
| 인라인 줄 | 이전 전 대비 −1,051줄 |
| 글자 동일 | `verify-inline-hard.json` ok — 18개 토큰·줄 동일, 남은 글자 150,733토큰 동일, 누수·미노출·setter 빠짐 0, 처리기 548 = 513 + 35, 새 파일 632·526줄 |
| 단독 로드 | 회귀 0, 새 파일 2개 standaloneOk |
| 화면 시나리오 | 2개 기준·작업 통과(새 목표 창 말풍선·첫 체크인 뒤 피드백 창), 돌연변이 2개(키트 이름 지움) 작업 쪽 실패 |
| 조작 비교 | 160값, 기준 대 후 0 · 기준 대 기준 0 |
| 시험 | tests·scripts/test-* 종료 코드 기준과 같음, smoke 443/0 · 무결성 38/38 · 버튼 943/943 |

[4단계: 심사 청구]
