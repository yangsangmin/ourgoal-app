# REQ — #TASK-ES-526 인라인 3단계 Z4 이동 3차: 표 CSV·음성 표 입력·테마별 기록 CSV·초대 글자를 세포 4개로 동작 그대로 이전

- 근거: 헌법 CELL_SPLIT·CELL_SPLIT_PROOF, `docs/architecture/INLINE-STAGE3-DESIGN.md` 4절(CSV/엑셀 — 「풀림 + 800줄 초과, take.names 로 책임 단위 두 세포」, 그 밖 「이미 풀림」)·6절 Z4, 작업참고 기준 PR #802(L001·L005·L016·L025·L030·L031·L033·L046·L047).
- 작업 유형(SNOWBALL): (가) 표준. 이탈 없음. 머리 이음매 자리 H2 `[기본값]`(내 다른 PR 은 H3·H4). L046·L047: verify 「키트 변수 뒤 가져오기 · 마지막 노출 setter」 ok, assignedL 0.

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지
| 묶음(제목) | 새 세포 | 옮긴 것 | 원래 자리에 남긴 것 |
|---|---|---|---|
| CSV / 엑셀 양방향 연동 & 스마트워치 매핑 & 목표 3각 추적 (표 주고받기 책임) | `js/tabs/records/table-csv-sync.js` | downloadTableAsCsv · parseCsvText · openCsvImportModal · openWearableSyncModal · syncRecordToMatchingGoals | 사진 표 채우기 일체(compressImageForVision · VISION_DAILY_LIMIT · getVisionDailyQuota · decrementVisionDailyQuota · openVisionTableModal) · CURATED_MARKET_TEMPLATES |
| 같은 묶음 (음성 입력 책임) | `js/tabs/records/voice-table-input.js` | parseVoiceToTableRow · openVoiceTableModal | — |
| 테마별 기록 DB 다운로드 & 외부 AI 분석 프롬프트 번들 (TASK-OG-001) | `js/tabs/records/theme-export-csv.js` | getAIAnalysisPrompt · buildCSV | — |
| [PEER INVITE] '함께 목표' 방 초대 루프 (남아 있던 순수 함수) | `js/tabs/comm/peer-invite-text.js` | calculateRemainingSeats · buildPeerInviteUrl · formatPeerInviteMessage | checkAndHandlePeerInviteUrl 대입 · window 노출 |

생성기 산출(작업자 측정): 옮김 12 · 남김 6, 새 파일 241·272·58·50줄(`reports/TASK-ES-526/gen-meta.json`). 864줄 묶음은 책임 단위 두 세포 + 남김으로 나눠 모두 800줄 이하.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심
- **본질**: 인라인 미분화 덩어리에서 책임 단위 세포를 떼어 낸다.
- **원인**: parseCsvText·parseVoiceToTableRow·buildCSV·getAIAnalysisPrompt·초대 함수 셋이 smoke FN_NAMES 라 남아 있었다(합본 읽기로 풀림). CSV 묶음은 800줄 초과라 한 세포로 못 옮겼다.
- **중심**: take.names 로 책임(표 주고받기 / 음성 입력)마다 세포 하나, 화면으로 잴 수 없거나 승인선에 닿는 몫은 원래 자리.
- **핵심**: 세포마다 게스트 시나리오 하나(CSV 가져오기 · 음성 예시 칩 · 테마 내보내기 · 팀 초대 링크 복사).

## 3. [원칙 ③] 해결방식
설정 `docs/design/harness/module-split/inline-stage3-z4-d.json` → `gen-inline-hard.js` → `verify-inline-hard.js` → `module-load-stage3-z4.js` → 신고서·`cell-descriptions.json` → `tests-exit-compare-z4.js` → 게스트 조작 비교(`real-account-stage3-z4-d-steps.json`, --guest) → 시나리오 4개 로컬 기준·작업.

## 4. [원칙 ④] 재검토 — 남긴 것과 이유
- **사진 표 채우기(Vision-to-Table)**: 사진 파일을 골라야 도는 경로(법정 도구 한계 file-attach)이고, 「오늘 무료 분석: N/10」 하루 한도·「토큰 및 비용 70% 절감」 문구가 AI 비용 한도와 닿아 있어(L033 돈 근처) 옮기지 않았다.
- **CURATED_MARKET_TEMPLATES**: 마켓 템플릿마다 `author: '아워골 크로스핏터 연합'`·`downloads: '2,480'` 같은 박힌 작성자·내려받기 수가 있다 — 실제 집계가 아닌 고정 숫자(허상지표 의심, L030·L031). 고치지도 옮기지도 않고 결심 후보로 올린다(오케스트레이터 접수).
- 「5대 테마 온톨로지」는 로그인 뒤 경로(classifyRecordTheme)라 실계정 비교를 붙인 별도 PR, 「방해금지 시간대」·「다이내믹 알림 문구」는 알림 시계 경로라 Z3 Notifications 와 함께(#TASK-ES-523 REQ 4절), 「목표 일정 리스케일링」은 호출부 0(#TASK-ES-520 REQ 4절).

## 5. [원칙 ⑤] 절차
3절. push 직전 origin/main 합치기(충돌 시 main 판 index.html 로 생성기 재실행, L010).

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파
- 반론 1 "음성 입력은 마이크가 있어야 하니 잴 수 없다" → 음성 창에는 예시 문장 칩(data-voicesim)이 있어 같은 파서·행 추가 경로를 마이크 없이 돈다. 마이크 권한 안내 창(#micPermissionGuideModal, 다른 묶음)은 닫고 누른다.
- 반론 2 "초대 링크 복사는 클립보드라 법정에서 실패할 수 있다" → copyTextToClipboard 는 클립보드 거부 시 대체 복사(fallbackCopyText)로 같은 토스트를 낸다. 로컬 법정 실행기(같은 Chrome 구동)에서 기준·작업 통과.

## 7. [원칙 ⑦] 단계별 실행 — 식별자
DOM `#proCsvImportBtn`·`#csvTextInput`·`#csvApplyBtn`·`#proVoiceInputBtn`·`#btnCloseMicGuide`·`[data-voicesim]`·`#voiceTranscriptBox`·`#exportRecordsBtn`·`#mExpDownload`·`[data-open-group]`·`#grpCopyLinkBtn`·`#toast` · 함수 1절 표 · 파일 1절 표 + 설정·도구.

## 8. [원칙 ⑧] 막히는 지점 예상 · 성과 측정 (작업자 측정, 판정 아님)
| 측정 | 결과 |
|---|---|
| verify | ok — 토큰 동일·덩어리 줄 동일·남은 글자 동일·누수 0·this/arguments 0·이중 처리기 0·키트 변수 뒤 가져오기·마지막 노출 setter·800줄 이하 (`verify-inline-hard.json`) |
| 단독 로드 | 회귀 0, 새 파일 4개 단독 로드 ok (`module-load-probe.json`) |
| tests 전후 | tests 113개 종료 코드 기준 = 작업, 회귀 0 (`tests-exit-compare.json`) |
| 게스트 조작 비교 | 6단계(홈·기록·전문 템플릿 단추·전문 템플릿 창·소통·팀) 기준1 대 작업 0 · 기준1 대 기준2 0 (41값, `guest-compare.json`) |
| 게스트 시나리오 | 4개 기준·작업 통과 (`scenario-local.json`) |
