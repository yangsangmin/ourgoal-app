# REQ/PLAN — TASK-ES-374 기본 확인창 confirm() → 앱 바텀시트 1단계 (index.html 밖)

> 상위: [UI-COMPONENTS.md](../architecture/UI-COMPONENTS.md) 3절 3번(`ui.confirm`) · [MODULE-BLUEPRINT.md](../architecture/MODULE-BLUEPRINT.md) 5절(능력 등록부 한 통로). 앞선 같은 방식: [REQ-TASK-ES-361-TOAST-UNIFY.md](REQ-TASK-ES-361-TOAST-UNIFY.md)(#675 `js/core/toast.js`) · [REQ-TASK-ES-363-MODAL-UNIFY.md](REQ-TASK-ES-363-MODAL-UNIFY.md)(#677 `js/core/modal.js`).
> 숫자는 `node scripts/module-metrics.js` 산출이다(손으로 옮긴 수치 없음).

## 지시 원문(요약 아님 — 작업 지시서 그대로)

- 승인: 상민님 2026-10-04 "끝난 뒤 지침이 필요한 일들 모두 세션권장대로 진행해" — 권장안: 기본 확인창 41곳을 앱 바텀시트로, **문구는 그대로**.
- "1단계 범위 (index.html 제외): `node scripts/module-metrics.js` 의 duplicateCellSites.nativeConfirm 중 index.html 이 아닌 곳."
- "index.html 의 정본 `openBottomSheetConfirm` 을 js/core 공용 통로로 노출: 능력 `ui.confirm` (… 대기열, bind, 재귀 없음, 새 전역 0). index.html 은 <script> 태그 추가 정도만."
- "각 호출부를 ui.confirm 으로 바꾼다. … 확인 뒤 실행되던 동작(삭제·초기화 등)이 **확인을 눌렀을 때만** 실행되고 취소 시 아무 일도 없게. 문구(제목·본문·버튼 글자) 변경 0."
- "정본 바텀시트가 없는 시점이면 기존처럼 confirm() 으로 떨어지는 안전망을 둔다(동작 손실 방지)."

## REQ

- 대상 파일: `js/core/confirm.js`(신규, 세포 `core/confirm`) · `index.html`(스크립트 태그 1줄 — 인라인 스크립트·목표 탭·로그인 코드 미접촉) · 호출부 9파일 15곳 — `js/universal-stats.js`(4) · `js/team-invite-comm.js`(2) · `js/team-linked-goals.js`(2) · `js/time-tracker.js`(2) · `js/avatar-system.js` · `js/customize.js` · `js/reactions.js` · `js/team-visibility-levels.js` · `js/tabs/settings/sub-integrations.js`(각 1) · `docs/architecture/modules.json` · `scripts/test-shipyard-modular.js` · `tests/core-confirm-es374.test.js`(신규)
- 대상 함수: `ask`·`bind`·`attach`·`run`·`settle`·`suspendOpenModal`·`restoreModal`·`afterHistorySettles`·`nativeConfirm`(js/core/confirm.js) · 각 호출부 파일의 `askConfirm`(ui.confirm.bind 가 만든 함수) · 바뀐 처리기: avatar-system `.btn-del-saved-avatar` onclick · customize `#kf1ResetBtn` onclick · reactions `[data-rxmod]` click · sub-integrations `#gcalDisconnectBtn` onclick · team-invite-comm `postShareCardToFeed`·`[data-delcomp]` click · team-linked-goals `#btnDeleteTlGoal`·`[data-tlmsdel]` click · team-visibility-levels `#modalDelLgBtn` click · time-tracker `bindEvents` 안 `#ttTabStopwatch`·`#ttTabTimer` onclick · universal-stats `.u-tax-del-btn`·`#uGridBulkDelBtn`·`.u-grid-del-btn`·샘플 정리 `purgeBtn` onclick · 정본 `openBottomSheetConfirm(title, message, okText, cancelText, onOk, onCancel)`·`openModal`·`closeModal`(index.html, 바꾸지 않음)
- 대상 능력: `ui.confirm`(화면, Promise<boolean>) · `ui.confirm.bind`(세포용 확인 함수 만들기)
- 대상 DOM ID: `#modalOverlay`·`#modalSheet`·`#btnSheetConfirmOk`·`#btnSheetConfirmCancel`(정본, 바꾸지 않음) · 화면 확인용 `#timeTrackerOverlay`·`#btnTtActionStart`·`#ttTabTimer`·`#ttTabStopwatch`·`#ttTimerSetup` · `#homeLayoutOpenBtn`·`#kf1ResetBtn`·`.switch[data-kf1-id="todayGlancePill"]`

## PLAN — 문제해결 8원칙

## 1. [원칙 ①] 목표 정의

- [x] index.html 밖 js 파일의 기본 확인창 직접 호출 0. 모두 공용 통로 `ui.confirm` 하나로 정본 바텀시트를 띄운다. 확인을 눌렀을 때만 뒤따르던 동작이 1회 실행되고, 취소(✕·바깥 탭·뒤로가기 포함)면 0회. 문구는 호출부 문자열 그대로. 정본이 없으면 기본 확인창으로 떨어진다.

## 2. [원칙 ②] 현상 분석 — 본질·원인·중심·핵심 파악

- [x] 15곳 모두 `if(!confirm(문구)) return;`(또는 `if(confirm(문구)){…}`) 한 줄이 동작을 막는 문지기다. 정본 `openBottomSheetConfirm` 은 콜백형이고 호출부가 하나도 없었다(정본만 있고 안 쓰임).
- [x] 정본을 그대로 부르면 생기는 문제 셋을 코드에서 찾았다. ① 정본 `openModal` 은 2중 적재를 막으려고(#UIUX-23) **열린 모달 내용을 덮어쓴다** — 15곳 중 아바타 보관함·홈 구성·조 상세·통계 스키마/그리드/가져오기 창처럼 모달 안에서 묻는 곳이 많아, 그대로면 취소해도 밑 창이 사라진다. ② 시간 기록 전체화면 `.tt-overlay` 는 z-index 10000, 바텀시트 `.modal-overlay` 는 100 — 확인창이 **뒤에 숨는다**(눌러도 안 보이는 Dead-Click). ③ 정본은 본문을 `innerHTML` 로 넣는다 — 팀 이름·조 이름·목표 제목이 든 문구는 꺾쇠가 태그로 해석된다(기본 확인창은 글자 그대로 보였다).

## 3. [원칙 ③] 원인 추정

- [x] 공용 확인 통로가 없어 파일마다 브라우저 기본 확인창을 직접 불렀다(토스트·모달과 같은 원인). 정본 바텀시트는 "한 번에 한 장" 전제로 만들어져 "모달 위의 확인창"을 다룰 길이 없다.

## 4. [원칙 ④] 대안 탐색

- [x] A) 호출부마다 `openBottomSheetConfirm(…, onOk)` 직접 호출 — 15곳에 겹침·층·이스케이프 처리를 15벌 복제, 전역 직접 연결 증가 → 거부. B) 모달 안에서 묻는 곳은 기본 확인창을 유지 — 절반이 바뀌지 않음 → 거부. C) 겹친 확인창용 덮개를 새로 만듦 — 정본이 아닌 두 번째 바텀시트(selfOverlay 증가) → 거부. D) `js/core/confirm.js` 한 통로가 정본을 부르되, 열린 모달이면 밑 노드를 떼었다가(이벤트 연결이 노드에 있으므로 그대로 산다) 닫힌 뒤 다시 붙이고, 떠 있는 동안 덮개를 맨 위 층으로 올리고, 문구는 글자 그대로 보이게 이스케이프 → **D 선택**. 호출부는 처리기를 `async` 로 바꾸고 `if(!(await askConfirm(문구))) return;` — 같은 줄 수.

## 5. [원칙 ⑤] 실행 계획

- [x] (1) js/core/confirm.js — `ui.confirm(message, opts)` → Promise<boolean>; 정본 없음 → `window.confirm`; 한 번에 하나, 겹친 요청은 대기열(최대 20); `ui.confirm.bind(getOverride)`(주입 확인 함수 우선, 통로가 만든 함수는 고르지 않음 → 재귀 불가); ✕·바깥 탭·뒤로가기는 MutationObserver 로 잡아 취소; 정본이 그리지 못하면(`#modalOverlay` 미활성) 기본 확인창. (2) index.html `modal.js` 다음 1줄. (3) 9파일에 `var askConfirm = …ui.confirm.bind…` 1줄 + 15곳 처리기 `async`·`await` — 800줄 넘는 6파일은 빈 줄 1개를 같이 지워 줄 수 증가 0. (4) 신고서·부품 시험·화면 시나리오·주장.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파

- [x] 반론① "동기 → 비동기로 바꾸면 순서가 바뀌어 다른 버그가 난다" → 15곳 모두 문지기 줄 **앞**에는 읽기만 있고(`e.stopPropagation()`·dataset 읽기) 동작은 전부 문지기 **뒤**다. 문지기를 `await` 로 바꾸면 "확인 → 뒤 동작"이라는 순서는 같고, 바뀌는 것은 기다리는 동안 다른 클릭이 가능하다는 점인데, 확인창이 화면 전체를 덮는 덮개(맨 위 층) 위에 뜨므로 밑 버튼을 다시 누를 수 없다. 밑 모달을 다시 붙인 **뒤에** 결과를 돌려주므로, 확인 뒤 `renderModalContent(containerEl)`·`deps.closeModal()` 같은 동작은 원래 창 위에서 돈다(화면 시나리오·부품 시험으로 확인).
- [x] 반론② "안전망 `window.confirm` 이 core 에 남으니 지표만 옮긴 것 아니냐" → 지표 nativeConfirm 의 정의는 "바텀시트 대신 기본 확인창을 부르는 **호출부**"다. 15 호출부는 이제 바텀시트를 부르고, `js/core/confirm.js` 의 기본 확인창은 지시가 요구한 정본 부재 시 안전망 한 곳(`fn.call(global, message)`)이다 — 보고에 그대로 적는다. 반대로 안전망을 없애면 정본 로드 전·시험 환경에서 삭제 버튼이 아무 일도 안 하는 Dead-Click 이 된다.

## 7. [원칙 ⑦] 즉시 실행

- [x] 위 (1)~(4) 반영. 모듈 가드 통과(① 35822 · ② 691 · ③ 282 · ④ 11 · ⑤ 0 — 기준과 같음, 새 전역 0).

## 8. [원칙 ⑧] 성과 측정

- [x] `module-metrics` duplicateCellSites.nativeConfirm 41 → 26(index.html 26 · 그 밖 15 → 0) · ③ windowAssignments 282 → 282 · 800줄 넘는 파일 줄 수(avatar-system 7351 · universal-stats 6092 · team-invite-comm 4105 · time-tracker 1221 · team-linked-goals 982 · team-visibility-levels 837) 전후 같음 · 부품 시험 14건 통과 · 게스트 화면 시나리오 2건(시간 기록 모드 전환 확인 · 홈 구성 되돌리기 확인) 작업 커밋에서 통과.
* **체크리스트 마감 규칙**: 본 작업계획서는 [4단계: 심사 청구]까지만 등록함.

## 2단계 — index.html 26곳 권장 순서(이번 범위 밖)

1. 모달 밖 단순 삭제 확인(되돌림 가능): 기록 카드 휴지통 27729 · 휴지통 영구 삭제/비우기 9666·9678 · 참고자료 20074 · 프롬프트 4747 · 피드백 설정 17335.
2. 캘린더 3곳: 11015 · 11224 · 11513.
3. 소통·피드: 차단 25392 · 댓글/게시물 신고 27240·35458 · 마니또 36850·36861·36868.
4. 팀 2곳: 26301(`openLevelGroupDetailModal` — js/team-visibility-levels.js 와 같은 일을 하는 index.html 사본, 사본 정리와 같이) · 27396.
5. 목표 탭 6곳(22432 · 22646 · 24367 · 24917 · 24930 · 25082) — 목표 탭 세포 이전(ES-370 goals-cell) 병합 뒤 그 세포 안에서.
6. 마지막·따로: 24953 "최종 결과를 먼저 입력할까요? (취소를 누르면 결과 없이 보관해요)" — **취소가 동작(결과 없이 보관)인 유일한 곳**이라 ✕·뒤로가기를 취소로 보면 의도와 달라진다(3갈래 처리 필요). 6472 계정 초기화(`checkPendingDeletionRestore`, 되돌릴 수 없음·로그인 흐름) · 32666 샘플 정리(딥링크).

## 확인 못 한 것

- 실제 폰(L6)에서의 바텀시트·뒤로가기 제스처로 닫기 — 정본 코드는 그대로이고 뒤로가기 → 취소는 부품 시험(MutationObserver 경로)으로만 확인.
- 게스트로 닿지 않는 9곳의 화면 확인: reactions 조언 지우기(운영자 권한·서버 RPC) · sub-integrations 구글 캘린더 해제(연동 필요) · team-invite-comm 피드 게시·동반자 해제 · team-linked-goals 2곳 · team-visibility-levels 조 삭제(팀장 화면) · avatar-system 보관함 삭제 · universal-stats 4곳. 같은 `askConfirm` 한 줄 문지기라 부품 시험(실제 호출부 customize 를 그대로 돌림)과 화면 시나리오 2건으로 갈음.
