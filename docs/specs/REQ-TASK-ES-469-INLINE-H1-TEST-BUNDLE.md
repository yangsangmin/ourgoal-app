# REQ — #TASK-ES-469 시험지 2개가 인라인 합본을 읽음 — 인라인 어려움 구역 H1 선행(평가 팝업·피드 공유 모달), 단언·기대값·검사 수 그대로

- 근거: 헌법 CELL_SPLIT 3(시험지 선행), 설계 `docs/architecture/INLINE-HARD-SPLIT-DESIGN.md` 2-6절·4-1절 1, 선례 #TASK-ES-441(#751 `tests/helpers/inline-bundle.js`)·#TASK-ES-447(#753).
- 범위: `tests/app-evaluation-modal.test.js`·`tests/feed-post-preview-modal.test.js` 2개가 index.html 대신 인라인 합본(`withInlineCells` — index.html 원문 맨 앞 + js/tabs 세포, L. 접두만 뗌)을 읽게 읽기 줄만 바꾼다. 단언·기대값·검사 수 0 변경, 제품 코드 0, 동결 파일 0.

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지

1. 구역 H1(설계 문서 1절 구역 표) 어려움 묶음을 세포로 옮기면, index.html 글자만 읽는 시험지가 옮긴 글자를 못 찾아 깨진다. 법정은 기준 커밋의 시험지로 채점하므로 이전 PR 보다 먼저 시험지 읽기 범위를 넓혀야 한다.
2. 깨지는 시험지는 실측으로 정했다: 구역 H1 열 묶음(XP/레벨·레벨업 팝업·인앱 브라우저 감지·첫 체크인 튜토리얼·Social Crew Pacing·AI 초집중 모드·피드 공유 모달·템플릿 백과사전·평가 팝업·New goal modal)을 기준 사본에서 생성기로 모두 옮기고 tests·scripts 시험 126개를 기준과 비교 → 기준 통과·이후 실패가 4개(`app-evaluation-modal`·`feed-post-preview-modal`·`module-guard`·`new-module`). 뒤의 둘은 신고서(modules.json)에 새 파일이 없어서이며 이전 PR 이 신고서를 함께 고치므로 시험지 문제가 아니다.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 시험지가 "기능이 있는가"가 아니라 "index.html 에 글자가 있는가"를 본다.
- **원인**: 인라인 분열 전에 쓴 시험지라 함수가 세포 파일로 옮겨 가는 경우를 몰랐다(`sb.from('app_evaluations').insert` 는 평가 제출 처리기 안, `#sharePreviewSlot`·`toggleFeedPostPreview` 노출은 피드 공유 모달 함수 안).
- **중심**: 두 시험지의 index.html 읽기 한 줄.
- **핵심**: 그 한 줄을 #751 의 `withInlineCells` 로 감싼다 — 합본 맨 앞이 원문이라 지금은 같은 글자를 같은 자리에서 찾고, 옮긴 뒤에는 세포 쪽 글자(L. 뗌)에서 찾는다.

## 3. [원칙 ③] 해결방식

- 두 시험지의 index.html 읽기 줄만 `require('./helpers/inline-bundle').withInlineCells(fs.readFileSync(…))` 로 바꾸고 주석 한 줄. 나머지 글자 0 변경.
- 모의 이전 측정 도구 `docs/design/harness/module-split/mock-move-inline-h1.js` + 설정 `mock-move-inline-h1.json`(기준 사본에서 세 묶음을 #762 생성기 `gen-inline-hard.js` 로 옮겨 봄 — 저장소 제품 코드는 그대로).

## 4. [원칙 ④] 재검토 — 한계

- `avatar-10slots-growth` 는 지도 실측 도구(`scripts/inline-hard-test-probe.js`, 묶음을 빈 줄로 비움)에서는 깨졌지만, 실제 생성기로 옮기면 index.html 머리의 가져오기 줄(`var filterHarmfulWords = _settingsKit.filterHarmfulWords;`)이 이름 글자를 남겨 깨지지 않는다 → 바꾸지 않았다(모의 이전 대조로 잼).
- 기준 사본(`git archive`)에서 원래 실패하는 시험지 31개는 이번 범위 밖이다(기준·모의 이전 같은 종료 코드).

## 5. [원칙 ⑤] 절차

워크트리 `C:/dev/wt/inline-h1-tf`(브랜치 `feat/2026-10-05-task-es-469-inline-h1-test-bundle`, 기준 origin/main 8472bbc) → 지도 재생성(작업 사본, 커밋 안 함) → 구역 H1 열 묶음 모의 이전 + 시험 126개 기준 대비 → 시험지 2줄 → 모의 이전 세 묶음 · 4조합(기준/새 시험지 × 기준/모의 이전 제품) 실행 → 문서 → PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "합본을 읽으면 원래 없던 글자도 세포에서 찾혀 단언이 약해진다." → 합본 맨 앞이 index.html 원문이고 세포는 index.html 에서 옮겨 온 글자뿐이다(생성기가 글자 그대로 옮김, L. 접두만 뗌). 기준 제품에서 새 시험지 종료 코드 = 기준 시험지(0 = 0).
- 반론 2: "모의 이전이 실제 이전과 다르면 선행이 모자란다." → 모의 이전은 이전 PR 이 쓸 같은 생성기·같은 묶음 제목·같은 감쌀 이름으로 돌렸고, 열 묶음 전체 모의 이전에서 깨지는 시험지 목록을 먼저 뽑아 범위를 정했다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- 파일: `tests/app-evaluation-modal.test.js`, `tests/feed-post-preview-modal.test.js`, `tests/helpers/inline-bundle.js`(`withInlineCells`, 변경 없음), `docs/design/harness/module-split/mock-move-inline-h1.js`·`mock-move-inline-h1.json`, `reports/TASK-ES-469/mock-move.json`.
- 함수·DOM(모의 이전 대상): `openAppEvaluationModal`·`resetAppEvaluationForm`·`#btnSubmitAppEval` 처리기, `openAvatarLevelUpModal`·`filterHarmfulWords`, `openShareToFeedModal`·`#sharePreviewSlot`.

## 8. [원칙 ⑧] 막히는 지점 · 성과 측정 (작업자 측정, 판정 아님)

| 항목 | 결과 |
| :-- | :-- |
| 기준 제품 · 새 시험지 | 두 시험지 종료 코드 0 = 기준 시험지 0 |
| 모의 이전 제품 · 기준 시험지 | `app-evaluation-modal` 0→1(「Supabase app_evaluations 테이블 직접 적재」 단언), `feed-post-preview-modal` 0→1(「#sharePreviewSlot」 단언) |
| 모의 이전 제품 · 새 시험지 | 둘 다 0 |
| 대조 `avatar-10slots-growth` | 모든 조합 0(바꾸지 않음) |

막히는 지점: 구역 H1 의 「외부 데이터 불러오기 (mock)」(한 줄에 두 문)·「참고자료」(같은 구획 주석 두 줄)는 생성기가 멈추고, 「기록 기반 목표·마일스톤·할 일 자동 업데이트 제안」은 smoke FN_NAMES 함수라 생성기가 멈춘다 — 이 묶음들은 이번 모의 이전에 넣지 않았고, 옮길 때 따로 잰다.

[4단계: 심사 청구]
