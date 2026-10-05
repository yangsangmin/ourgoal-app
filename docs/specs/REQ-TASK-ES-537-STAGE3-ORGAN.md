# REQ — #TASK-ES-537 인라인 3단계 기관 몫: 데일리 루틴 상세·편집 창 → js/tabs/goals/routine-detail-modal.js (Modal helper·Confetti 는 옮길 문 0)

- 근거: 헌법 v2026.10.06-SNOWBALL(CELL_SPLIT · CELL_SPLIT_PROOF), 설계 `docs/architecture/INLINE-STAGE3-DESIGN.md` 6절 기관 행(「Modal helper(openModal 남김) · Confetti(toast 남김) · 데일리 루틴 서브탭(게스트 루틴 생성 실측 뒤)」), 작업참고 기준 PR #802(L001·L006·L009·L015·L016, 공지 L046·L047).
- 선행: 시험지 선행 #TASK-ES-527(PR #805, 병합 1c9193d) — `tests/core-confirm-es376.test.js` 가 루틴 삭제 확인창을 새 세포에서도 센다.
- 설정: `docs/design/harness/module-split/inline-stage3-organ.json`(자리 HO, 키트 OurgoalGoalsKit — `_goalsKit` 선언은 모든 자리보다 위).
- 작업 유형(SNOWBALL): (가) 표준 — L016 표준 이음매. 이탈 없음.

## 1. [원칙 ①] 문제 정확히 파악
| 묶음(제목) | 결과 | 근거 |
| :-- | :-- | :-- |
| [#TASK-ES-172] [27] 목표 탭: 데일리 루틴 서브탭 & 편집/상세 모달 | `openRoutineDetailModal` → `js/tabs/goals/routine-detail-modal.js` | 남은 함수 1개. window 노출 if 문은 원래 자리 |
| Modal helper & Android Hardware Back Handler | **옮길 문 0** | 남은 것: `_modalHistoryPushed`·`_modalDismissGraceUntil`(재대입 상태), `openModal`(최상위 `arguments[2]` — CELL_SPLIT 5), window 노출 if 문, `bindModalPopstateBack()` 부르는 줄(#471 이 이미 감쌈) |
| Confetti | **옮길 문 0** | 남은 것: `toastTimer`(재대입 상태), `toast`(다른 함수와 타이머 공유 — MODULE-SPLIT-PROTOCOL 1절, #482 판단 유지), window 노출 if 문 2 |

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심
- **본질**: 루틴 상세 창을 동작 그대로 목표 탭 세포로.
- **원인**: #TASK-ES-493 이 「게스트 시드 루틴 0개라 창을 여는 카드가 없다」로 남겼다.
- **중심**: 게스트로 닿는지 먼저 실측 — 게스트 「루틴」 하위 탭에는 기본 루틴 3개(`rt_morning`·`rt_focus`·`rt_evening`, `renderRoutineGoalsScreen` 이 routines 가 없을 때 채움)가 그려져 카드를 누르면 창이 열린다. #493 의 판단은 지금 사실과 다르다.
- **핵심**: 생성기 글자 그대로, 게스트 시나리오가 창 열기·이름 고쳐 저장까지 잰다.

## 3. [원칙 ③] 해결방식
생성기 `gen-inline-hard.js` + 설정(take.all). 신고서 `module-specs --write` + `cell-descriptions.json` 2줄. 단독 로드 `module-load-stage3-z3o.js`(#TASK-ES-536 과 같은 파일).

## 4. [원칙 ④] 재검토 — 한계
- 창 안의 「삭제」는 `confirm()` 기본 확인창(native-dialog)을 거친다 — 시나리오는 열기·저장만 잰다. 삭제 처리기 글자는 verify 토큰 동일, 확인창 글자는 core-confirm-es376 시험이 센다.
- 실계정 비교는 하지 않았다 — 옮긴 함수가 로그인 뒤에만 도는 경로가 아니다(게스트로 닿음, 시나리오).

## 5. [원칙 ⑤] 절차
origin/main(f504928) → 생성기(HO) → verify(assignedL 0 — L047 해당 없음) → 가져오기 줄(3037행) > `var _goalsKit`(2454행) → 신고서 → 단독 로드 → tests 전부 종료 코드 기준 대비 → 게스트 시나리오 로컬(기준·작업) → PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파
- 반론 1 「설계는 게스트 루틴 0 이라 했다」 → 시나리오 실측에서 게스트 루틴 카드 3개가 보였다(기준·작업 모두). 설계 3-1 의 도달 실측 단계에는 「루틴」 하위 탭이 없었다.
- 반론 2 「Modal helper·Confetti 를 0 으로 끝내는 것은 일을 안 한 것」 → 남은 문은 모두 생성기 규칙상 원래 자리(상태 변수·노출 문·최상위 arguments·공용 타이머)다. 억지로 옮기면 CELL_SPLIT 5 위반이다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자
DOM `#btnGoalsSubRoutine` · `#routineGoalsView` · `.routine-card[data-rtid="rt_morning"]` · `#modalOverlay` · `#inDetailRtTitle` · `#btnSaveDetailRoutine` · `#toast`, 함수 `openRoutineDetailModal`, 파일 `js/tabs/goals/routine-detail-modal.js` · `index.html` · `docs/design/harness/module-split/inline-stage3-organ.json`.

## 8. [원칙 ⑧] 막히는 지점 예상 · 성과 측정 (작업자 측정, 판정 아님)
| 항목 | 결과 (출처) |
| :-- | :-- |
| verify | ok · 토큰 동일 · 남은 글자 동일 · 이중 처리기 0 (`reports/TASK-ES-537/verify-inline-hard.json`) |
| 새 파일 줄 수 | 188 (800 이하) |
| 단독 로드 | 회귀 0 · 새 파일 단독 로드 ok (`module-load-probe.json`) |
| tests 전후 | tests 전부 종료 코드 기준 사본 = 작업 트리(차이 0) |
| 게스트 시나리오 | 1개 기준·작업 통과 (`scenario-local.json`) |

[4단계: 심사 청구]
