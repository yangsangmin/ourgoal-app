# REQ — #TASK-ES-496 인라인 어려움 구역 H4 3차 (피드 목록 — H4 마지막 묶음)

- 근거: 헌법 v2026.10.05-CELL 세포골격 절(CELL_SPLIT · CELL_SPLIT_PROOF), 설계 `docs/architecture/INLINE-HARD-SPLIT-DESIGN.md`, 앞선 H4 이전 #TASK-ES-461(#773)·#TASK-ES-474(#785), 숨은 빠른 게시 띠 제거 #TASK-ES-495(#795, 상민님 「pr791, pr795 금고 변경 승인」 뒤 병합).
- 지시(2026-10-05, 상민님): "미분화 덩어리 분열 작업을 우선순위로" → 코디네이터 배정: 어려움 구역 H4.
- 범위: 「피드 상호소통 댓글 & 리액션 헬퍼」 묶음(feedPostHtml · renderCommFeed)을 생성기(설정 `docs/design/harness/module-split/inline-h4-pr3.json`)로 `js/tabs/comm/feed-list.js` 에 글자 그대로 옮긴다. 동작 0 변경.

## 1. [원칙 ①] 문제 정확히 파악
이 묶음은 H4 1차에서 renderCommFeed 안 숨은 빠른 게시 띠(`display:none !important`) 때문에 옮기지 못했다(새 파일로 옮기면 법정이 CSS 은폐 줄 추가로 돌려보냄). #795 가 그 띠를 지웠으므로 이제 옮길 수 있다.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심
- **본질**: 소통 탭 피드 화면이 index.html 미분화 덩어리 안에 있어 세포 경계가 닿지 않는다.
- **원인**: 다른 묶음 이름(state·FEED_POSTS_CACHE·toast …)을 직접 읽는 600줄짜리 화면 함수다(유형 A1·E·L).
- **중심**: 표준 이음매 — L getter 통로, 머리 가져오기는 자리 표지 H4 아래.
- **핵심**: 손으로 옮긴 글자 0, verify 통과, 게스트 화면 차이 0, 새 파일에 은폐 글자 0.

## 3. [원칙 ③] 해결방식
설정(slot H4, take.all) → 생성기 → verify → 신고서(module-specs --write · role 손 칸 · requires ui.confirm) · cell-descriptions.json. 생성 지도 3종은 커밋하지 않는다.

## 4. [원칙 ④] 재검토 — 한계(정직하게)
- `feedPostHtml` 은 부르는 곳이 0 인 죽은 함수다 — 고치지 않고 그대로 옮겼다(발견 목록).
- 게스트 피드에 글이 없어 반응 단추는 조작 비교에서 누르지 못했다(기준·후 모두 missing).

## 5. [원칙 ⑤] 절차
main 위 worktree → 설정 → 생성기 → verify → 단독 로드 → 신고서 → tests 전후 → 조작 비교(기준 2회·후 1회) → 게스트 시나리오 → 로컬 법정 예비 → PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파
- 반론 1: "600줄 화면 함수를 통째로 옮기면 이름 참조가 어긋난다." → 바꾼 것은 `L.` 접두뿐, verify 가 토큰 동일·남은 글자 동일·누수 0·미노출 0 을 쟀다.
- 반론 2: "은폐 줄이 또 따라온다." → 새 파일 `!important` 0(주장 C9), 숨김 게이트 통과.

## 7. [원칙 ⑦] 단계별 실행 — 식별자
DOM `#commBody [data-sub="feed"]` · `#commSubBody [data-feedtype]` · `[data-feedcat]` · `[data-togglecomments]` · `[data-sharefeed]`, 함수 `renderCommFeed` · `feedPostHtml`, 파일 `js/tabs/comm/feed-list.js` · `docs/design/harness/module-split/inline-h4-pr3.json` · `docs/design/harness/module-split/dom-steps-inline-h4-496.js`.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)
| 항목 | 결과 (출처) |
| :-- | :-- |
| verify | ok · 토큰 동일 · 남은 글자 동일 · 이중 처리기 0 (`reports/TASK-ES-496/verify-inline-hard.json`) |
| 새 파일 줄 수 | 650 (800 이하) |
| 원본 단독 로드 | 회귀 0, 새 파일 단독 로드 ok (`module-load-probe.json`) |
| tests 전후 | 작업 npm test 종료 0 · smoke 443/0(기준 사본 같음). 종료 코드가 갈린 시험지 1개(tests/cell-map-export-es414.test.js)는 기준 사본이 git archive 로 풀어 이력이 없어 실패하고 작업 트리에서는 통과 — 회귀 아님 (`test-compare.json`) |
| 게스트 조작 비교 | 11단계 기준 대 후 차이 0 · 기준 대 기준 0 (`dom-compare-inline-h4.json`) |
| 게스트 시나리오 | 1개 기준·작업 통과 (`scenario-local.json`) |

[4단계: 심사 청구]
