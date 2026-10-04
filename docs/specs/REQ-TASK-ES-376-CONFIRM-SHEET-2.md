# REQ/PLAN — TASK-ES-376 기본 확인창 confirm() → 앱 바텀시트 2단계 (index.html)

> 상위: [REQ-TASK-ES-374-CONFIRM-SHEET.md](REQ-TASK-ES-374-CONFIRM-SHEET.md)(#690, 1단계 — 공용 통로 `js/core/confirm.js` · 능력 `ui.confirm`) 의 "2단계 — index.html 26곳 권장 순서" · [UI-COMPONENTS.md](../architecture/UI-COMPONENTS.md) 3절 3번.
> 숫자는 `node scripts/module-metrics.js` · `node scripts/module-guard.js` 산출이다(손으로 옮긴 수치 없음).

## 지시 원문(요약 아님 — 작업 지시서 그대로)

- 승인: 상민님 2026-10-04 "끝난 뒤 지침이 필요한 일들 모두 세션권장대로 진행해" — 문구는 그대로. 1단계 PR #690(TASK-ES-374)의 통로를 그대로 쓴다.
- "범위: index.html 의 confirm() — 1단계 빌더 권장 순서 중 아래만 1. 모달 밖 단순 삭제 2. 캘린더 3. 소통 4. 팀 6. 32666, 6472(계정 초기화 — 로그인 흐름, 신중히). 줄 번호는 지금 main 기준으로 다시 찾는다."
- "목표 탭 안 7곳은 손대지 말 것 — 다른 빌더가 목표 탭 코드를 세포로 옮기는 중."
- "각 처리기를 async 로 바꾸고 확인했을 때만 동작, 취소·✕·뒤로가기면 아무 일 없음. 문구 변경 0."
- "index.html 인라인 줄 수를 늘리지 말 것(모듈 가드)."

## REQ

- 대상 파일: `index.html`(인라인 스크립트 19줄을 같은 줄 수로 바꿈 — 새 함수·새 전역·새 줄 0) · `tests/core-confirm-es376.test.js`(신규) · `scripts/test-shipyard-modular.js`(1줄 등록) · `docs/architecture/UI-COMPONENTS.md` · `dev_log.md` · `docs/rules/TICKETS.md`
- 공용 통로(바꾸지 않음): `js/core/confirm.js` 능력 `ui.confirm` — `OurgoalCapabilities.call('ui.confirm', 문구)` → Promise<boolean>. 열린 모달 안이면 밑 모달 노드를 떼었다 다시 붙이고, ✕·바깥 탭·뒤로가기는 취소, 정본이 없으면 기본 확인창 안전망(#690).
- 지금 main(196c946) 기준 줄 번호 대응(지시서 번호 → 현재 번호 · 처리기):

| 묶음 | 지시서 | 현재 | 처리기(이미 async) | 문구 첫머리 |
| :-- | :-- | :-- | :-- | :-- |
| 1 모달 밖 단순 삭제 | 27729 | 26716 | 기록 카드 `[data-recdel]` click | 이 기록을 휴지통으로 이동할까요? |
| 1 | 9666 | 9703 | `permanentDeleteFromTrash(trashId)` | "제목" 항목을 영구 삭제할까요? |
| 1 | 9678 | 9715 | `emptyTrash()` | 휴지통을 완전히 비울까요? |
| 1 | 20074 | 20104 | 참고자료 창 `#attDelConfirmBtn` click | 이 참고자료를 삭제할까요? |
| 1 | 4747 | 4793 | 프롬프트 백과 `.btn-del-prompt` click | 등록하신 프롬프트를 삭제하시겠습니까? |
| 1 | 17335 | 17365 | 피드백 설정 `.fb-preset-delete` click | ‘제목’ 설정을 보관함에서 삭제하시겠습니까? |
| 2 캘린더 | 11015 | 11045 | 날짜 배경 `deleteBtn` click | 이날의 배경사진을 초기화하고… |
| 2 | 11224 | 11254 | 날짜 허브 `[data-hubdel]` onclick | 이 일정을 휴지통으로 이동할까요? |
| 2 | 11513 | 11543 | 일정 편집 `#calEditDeleteBtn` onclick | 이 일정을 휴지통으로 이동할까요? |
| 3 소통 | 25392 | 24379 | `blockUser(userId, userName)` | 이름님을 차단할까요? |
| 3 | 27240 | 26227 | 팀 댓글 `[data-reportcmt]` click | 이 댓글을 신고할까요? |
| 3 | 35458 | 34445 | 피드 `[data-reportpost]` click | 이 게시물을 신고할까요? |
| 3 | 36850 | 35837 | 마니또 `[data-mnreveal]` click | 정체 공개를 제안할까요? |
| 3 | 36861 | 35848 | 마니또 `#mnReshuffle` click | 지금 마니또와의 응원 기록은 유지되고… |
| 3 | 36868 | 35855 | 마니또 `#mnQuit` click | 마니또를 그만둘까요? |
| 4 팀 | 26301 | 25288 | `openLevelGroupDetailModal` `#modalDelLgBtn` click | 정말 "조 이름" 조와… |
| 4 | 27396 | 26383 | 팀 목표 편집 창 `#modalTgDelGoalBtn`(시트 위임 click) | 정말 "제목" 팀 목표를 삭제할까요? |
| 6 | 32666 | 31653 | `window.purgeSampleRecordsOneClick`(`#recSamplePurgeBtn`) | 체험용 샘플 데이터 N건만… |
| 6 | 6472 | 6518 | 설정 `#resetBtn` click | 이 계정의 모든 목표·기록·설정을 초기화할까요? 되돌릴 수 없어요. |

- 손대지 않은 7곳(목표 탭): index.html 22462·22676(루틴 삭제) · `js/tabs/goals/goal-detail-events.js` 161·174·197·326 · `js/tabs/goals/render.js` 199.
- 대상 DOM ID(화면 확인용): `#modalOverlay`·`#modalSheet`·`#btnSheetConfirmOk`·`#btnSheetConfirmCancel`(정본) · `#recordsList [data-recdel]` · `#btnOpenTrashModal`·`[data-trashdel]`·`#trashCloseBtn`·`#trashUndoToast` · `#recSamplePurgeBtn` · `#setGroupDataSummary`·`#resetBtn` · `#toast`

## PLAN — 문제해결 8원칙

## 1. [원칙 ①] 목표 정의

- [x] index.html 의 목표 탭 밖 기본 확인창 19곳이 모두 정본 바텀시트(공용 통로 `ui.confirm`)로 뜬다. 확인을 눌렀을 때만 뒤따르던 동작이 1회, 취소·✕·바깥 탭·뒤로가기면 0회. 문구는 글자 그대로. index.html 인라인 줄 수·함수 선언 수·전역 대입 수 증가 0.

## 2. [원칙 ②] 현상 분석 — 본질·원인·중심·핵심 파악

- [x] 19곳 모두 `if(!confirm(문구)) return;`(18곳) 또는 `if(confirm(문구)){`(1곳)·`var confirmed = confirm(문구);`(1곳, 샘플 정리) 한 줄 문지기다. 19곳의 처리기는 **이미 전부 `async`** 다(코드에서 하나씩 확인) — 지시의 "async 로 바꾸고"는 이미 되어 있어 문지기 줄만 `await` 로 바꾸면 된다.
- [x] 지시서의 "6472 계정 초기화(로그인 흐름)"는 현재 main 에서 6518 설정 화면 `#resetBtn`(이 계정 데이터 초기화) 처리기다(1단계 REQ 는 `checkPendingDeletionRestore` 로 적었으나 그 함수 안에는 기본 확인창이 없다). 게스트도 설정 「데이터 백업 & 고급 설정」을 펼치면 누를 수 있다.

## 3. [원칙 ③] 원인 추정

- [x] 1단계 통로가 생기기 전에 만든 인라인 코드라 브라우저 기본 확인창을 직접 불렀다. index.html 은 아직 능력 등록부를 부르는 곳이 없어 "통로를 어떻게 부를지"가 유일한 설계 질문이다.

## 4. [원칙 ④] 대안 탐색

- [x] A) 인라인 스크립트 맨 위에 `var askConfirm = …` 한 줄 — 인라인 줄 수 +1(모듈 가드 ① 위반) → 거부. B) `window.openBottomSheetConfirm(…, onOk)` 콜백형으로 직접 — 겹침·층·이스케이프·✕ 취소 처리를 19벌 복제 → 거부. C) 각 문지기 줄을 `if(!(await OurgoalCapabilities.call('ui.confirm', 문구))) return;` 로 같은 줄 안에서 바꿈 — 새 줄·새 함수·새 전역 0, 1단계 통로의 겹침·층·✕ 처리를 그대로 받음 → **C 선택**. `OurgoalCapabilities`(capabilities.js 2299줄)·`confirm.js`(2302줄)는 인라인 스크립트(2365줄~)보다 먼저 로드된다.

## 5. [원칙 ⑤] 실행 계획

- [x] (1) 19줄 교체(문구 식은 한 글자도 안 바꾸고 `confirm(` → `await OurgoalCapabilities.call('ui.confirm', ` 만). (2) 부품 시험 — 19줄이 예전 문구 그대로 통로를 부르는지, 남은 기본 확인창이 목표 탭 2줄뿐인지, 실제 처리기 4개(`permanentDeleteFromTrash`·`emptyTrash`·`blockUser`·`purgeSampleRecordsOneClick`)를 index.html 에서 잘라 돌려 확인 1회/취소 0회. (3) 게스트 화면 시나리오 3건. (4) 로그인 뒤에만 닿는 곳은 확인 못 함으로 주장.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파

- [x] 반론① "모달 안에서 묻는 곳(휴지통 창·참고자료 창·날짜 허브·일정 편집·팀 목표 편집·조 상세)은 정본 `openModal` 이 밑 창을 덮어써서 취소하면 밑 창이 사라진다" → 1단계 통로가 밑 노드를 떼었다가 닫힌 뒤 같은 `#modalSheet` 에 다시 붙이고 나서 결과를 돌려준다. 휴지통 창은 확인 뒤 `sheet.innerHTML = renderModalContent(…)` 로 다시 그리는데 그 `sheet` 는 같은 `#modalSheet` 요소다. 화면 시나리오 record-trash-confirm 이 휴지통 창 위 확인창 → 취소 → 휴지통 창·항목 그대로(`#trashCloseBtn`·`[data-trashdel]` 1개) → 확인 → "휴지통이 비어 있습니다" 를 잰다. 팀 목표 편집 창은 `#modalSheet` 자체에 click 위임을 거는데 확인창 버튼(`#btnSheetConfirmOk`·`#btnSheetConfirmCancel`)은 그 위임의 어느 선택자에도 걸리지 않는다(코드 확인).
- [x] 반론② "계정 데이터 초기화는 되돌릴 수 없고 로그인 흐름이니 바꾸면 위험하다" → 바뀌는 것은 묻는 창의 모양뿐이고 문구·뒤 동작(`defaultProfile` → `saveProfile` → `renderAll`)은 한 글자도 안 바뀐다. 취소·✕·뒤로가기는 모두 false 라 기본 확인창 때보다 "실수로 확인"될 길이 늘지 않는다. 게스트 경로는 화면 시나리오로 재고(취소 → 기록 그대로, 확인 → "초기화했어요"·샘플 배너 사라짐), 실계정 서버 원장 경로는 법정이 로그인할 수 없어 확인 못 함으로 주장한다.

## 7. [원칙 ⑦] 즉시 실행

- [x] 위 (1)~(4) 반영. 모듈 가드 통과(① 34806 · ② 686 · ③ 282 · ④ 11 · ⑤ 0 — 기준과 같음). `module-specs --write` 실행 — index.html 은 세포가 아니라 신고서 내용 변화 0.

## 8. [원칙 ⑧] 성과 측정

- [x] `module-metrics` duplicateCellSites.nativeConfirm 26 → 7(index.html 21 → 2, 남은 7곳 모두 목표 탭) · 인라인 줄 34806 → 34806 · 부품 시험 7건 통과 · 게스트 화면 시나리오 3건(기록 카드 휴지통 + 휴지통 영구 삭제 · 샘플 정리 · 계정 데이터 초기화) 작업 커밋에서 통과, 기준 커밋에서는 같은 문구의 기본 확인창이 떠서 바텀시트 단계에서 실패(로컬 실측).
* **체크리스트 마감 규칙**: 본 작업계획서는 [4단계: 심사 청구]까지만 등록함.

## 확인 못 한 것

- 로그인 뒤에만 닿는 곳의 화면 확인: 팀 댓글·피드 게시물 신고(서버 RPC), 사용자 차단(서버 user_blocks), 마니또 3곳, 팀 조 삭제·팀 목표 삭제(팀 화면), 계정 데이터 초기화의 실계정 서버 원장 반영. 같은 한 줄 문지기라 부품 시험(차단은 실제 `blockUser` 소스를 그대로 돌림)과 게스트 시나리오로 갈음하고 claims 에 확인 못 함으로 적었다.
- 게스트로 닿지만 시나리오를 따로 안 만든 곳: 프롬프트 삭제·피드백 설정 삭제·참고자료 삭제·캘린더 3곳(배경사진은 파일 첨부 필요) — 같은 문지기 줄, 부품 시험의 19줄 정적 검사로 갈음.
- 실제 폰(L6)에서 뒤로가기 제스처로 확인창 닫기 — 1단계와 같음.
