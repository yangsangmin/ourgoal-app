# REQ — #TASK-ES-556 인라인 3단계 구역 Z6 표준 3 (홈 화면 그리기·마이크 권한 안내 창·AI 피드백 문구집)

- 근거: 헌법 v2026.10.06-SNOWBALL(CELL_SPLIT · CELL_SPLIT_PROOF), 설계 `docs/architecture/INLINE-STAGE3-DESIGN.md` 2절 표준(T) 표·6절 구역 Z6, 작업참고 `C:/dev/agent-knowledge/WORK-REFERENCE.md` **기준 PR #802**(L016·L015·L001·L009·L010·L019·L042) + 공지 L046·L047.
- 지시(2026-10-06, 오케스트레이터 배정): 구역 Z5+Z6 표준(T) 묶음을 index.html 줄 순서대로 표준 이음매로 연속 PR.
- 범위: T 묶음 4개 — 「RENDER: HOME」·「🎙️ 마이크 권한 거부 상태 자가 진단 및 1초 권한 허용 모달 (#TASK-ES-227)」·「AI feedback (best-effort; provider-aware; local fallback)」·「[#TASK-ES-225] Gemini API 분당 쿼터(Rate Limit 429) 방어 및 지수 백오프 큐」. 생성기 설정 `docs/design/harness/module-split/inline-stage3-z56-c.json`(자리 HO). 동작 0 변경.
- 작업 유형(SNOWBALL): (가) 표준. 이탈 없음.

## 1. [원칙 ①] 문제 정확히 파악
홈 화면 그리기(renderHome, 212줄)·마이크 권한 안내 창(234줄)·AI 피드백 상수와 Gemini 쿼터 큐가 index.html 인라인 IIFE 에 남아 있다. 같은 구역의 「원터치 퀵 루틴 칩」·「사진 인증 & 뷰어 모달」은 이번에 옮기지 않는다(4절).

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심
- **본질**: 홈 탭 화면과 기록 탭 체크인 부품이 미분화 덩어리 안에 있어 세포 경계가 닿지 않는다.
- **원인**: 함수 선언·순수 상수가 인라인 최상위에 있다(상태 변수 requestClaudeFeedback·window 노출은 원래 자리).
- **중심**: 표준 이음매 — 홈 세포는 홈 큰 세포 키트 `OurgoalHomeMegaBlock`(js/tabs/home/index.js 가 통째로 대입 → 그 태그 뒤, 유형 M), 기록 세포는 `OurgoalRecordsKit`. 가져오기는 HO 자리(L046 — `_homeKit` 지역 변수가 그 자리에서 먼저 선언된다).
- **핵심**: 손으로 옮긴 글자 0, verify(키트 변수 뒤 가져오기·마지막 노출 setter 포함) 통과, 세포마다 게스트 시나리오 1개, 게스트 조작 비교 차이 0.

## 3. [원칙 ③] 해결방식
| 새 세포 | 옮긴 것 | 원래 자리 |
| :-- | :-- | :-- |
| `js/tabs/home/home-render.js` | `renderHome` | — |
| `js/tabs/records/mic-permission-guide.js` | `openMicPermissionGuideModal` | window 노출 한 줄 |
| `js/tabs/records/ai-feedback-catalog.js` | `THEME_FEEDBACK_PROMPTS`·`PREMIUM_FEEDBACK_CATALOG`·`GeminiQuotaDispatcher`·`DONE_KEYWORDS` | window 노출 두 줄, `requestClaudeFeedback` 선언 |

## 4. [원칙 ④] 재검토 — 한계 · 남긴 묶음
- 「원터치 퀵 루틴 칩」: 등록 문이 찾는 `#quickRoutineRow` 가 지금 문서에 없다(게스트 실측 — 요소 0, 칩 0) → 처리기가 붙지 않는 죽은 등록 문이라 게스트 시나리오로 잴 것이 없다. 옮기지 않고 결함 목록(지울지는 승인선 ③)에 올린다.
- 「사진 인증 & 뷰어 모달」: 사진 단추는 파일 선택 창을 연다 — 법정 시나리오에는 파일 올리기 동작이 없어 옮긴 처리기의 결과(미리보기)를 잴 수 없다. 법정 도구 한계 사유 목록에도 파일 첨부가 맞는 칸이 없어(L006) 이번에 옮기지 않고 남긴다.
- 체크인 대체 피드백 토스트(「AI 응답량이 많아 고품질 추천 엔진으로 즉시 보답해 드렸습니다」)는 저장 뒤 약 0.8~1.5초 사이에만 보인다(작업자 실측) — 시나리오는 1초에 잰다. 시간에 기대는 확인이라 법정 실행 속도가 크게 다르면 흔들릴 수 있다(막힐 지점).
- 오늘의 피드백 문구(판정 제목)는 날짜에 따라 고르는 항목이 바뀐다(`seed = 글자 수 + 목표 제목 길이 + 오늘 날짜`) — 그래서 문구 대신 토스트로 잰다.

## 5. [원칙 ⑤] 절차
worktree(origin/main 85bf297) → 설정 c(slot HO) → 생성기 → verify → 이음매 순서 점검 → 단독 로드 → 신고서·설명 → 게스트 시나리오 3개(기준 = 같은 커밋 git archive) → 게스트 조작 비교 → tests 전후 → 병합 줄 순서에 맞춰 main 합치기(생성기 재실행) → PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파
- 반론 1: "renderHome 은 홈 큰 세포 키트에 다는데, 키트를 통째로 대입하는 index.js 보다 앞이면 지워진다(유형 M)." → 설정이 `afterTag` 로 `js/tabs/home/index.js` 태그 뒤에 넣었고(생성기의 덮어쓰기 검사 통과), 시나리오가 홈 목록 다시 그리기를 기준·작업 둘 다에서 통과한다.
- 반론 2: "GeminiQuotaDispatcher 는 상태(isThrottled)를 가진 객체라 옮기면 두 벌이 된다." → 초기값이 순수 객체 글자라 생성기가 옮기고 index.html 은 같은 객체를 가져온다(같은 참조 — 바깥의 내용 변경이 그대로 보인다). verify 토큰 동일·남은 정의 0.

## 7. [원칙 ⑦] 단계별 실행 — 식별자
DOM `#homeCompassQuest` · `#homeGoalList` · `.starter-goal-btn[data-starter="study"]` · `#micBtn` · `#micPermissionGuideModal` · `#captureInput` · `#captureSave` · `#toast`, 함수 `renderHome` · `openMicPermissionGuideModal`, 상수 `THEME_FEEDBACK_PROMPTS` · `PREMIUM_FEEDBACK_CATALOG` · `GeminiQuotaDispatcher` · `DONE_KEYWORDS`, 파일 위 3절 표 · `inline-stage3-z56-c.json` · `guest-steps-z56-c.json`.

## 8. [원칙 ⑧] 막히는 지점 예상 · 성과 측정 (작업자 측정, 판정 아님)
| 항목 | 결과 (출처) |
| :-- | :-- |
| verify | ok (`reports/TASK-ES-556/verify-inline-hard.json`) |
| 이음매 순서(L046·L047) | 키트 선언 앞 가져오기 0 · setter 빠짐 0 (`seam-order-check.json`) |
| 새 파일 줄 수 | 237 · 258 · 179 (모두 800 이하) |
| 원본 단독 로드 | 회귀 0, 새 파일 3개 단독 로드 ok (`module-load-probe.json`) |
| 게스트 시나리오 | 3개 기준·작업 통과 (`scenario-local.json`) |
| 게스트 조작 비교 | 5단계 기준1 대 작업 차이 0 · 기준1 대 기준2 0 (`guest-compare.json`) |
| tests 전후 | `test-compare.json` |
| 막힐 지점 | 병합 줄(#814 → #819 → …) 뒤 main 합치기 때 생성기 재실행(L010), 토스트 시간 창 |

[4단계: 심사 청구]
