# 미분화 덩어리 해체 뒤에 남은 것 — 근거 위치

지시함 「결심 대기」 표에 올린 일곱 줄의 근거다. 작업자 서류이며 판정이 아니다. 「코드 읽기」라고 적은 것은 화면으로 재지 않았다.

## 1. 법정의 생성기 재실행 대조가 새 폴더를 「예상 밖 파일」로 본다

- 어디: `court/lib/preserve-source.js` 의 `recomputeSplit` — 생성기를 기준 커밋의 임시 복제본에서 돌린 뒤 `git status --short` 의 줄을 허용 목록과 글자로 맞댄다. git 은 없던 폴더의 새 파일을 폴더 한 줄(`?? js/app/`)로 보여 주므로 허용 목록의 파일 이름과 맞지 않는다.
- 재현 기록: `reports/TASK-ES-686/court-newdir-repro.cjs` · `court-newdir-repro.json`. 설명: `docs/specs/REQ-TASK-ES-686-APP-FOLDER.md` 11~15행 · 41행 · 68행(수정안 — status 읽기에 `--untracked-files=all`).
- 지금 비켜 가는 법: 새 폴더에 설명 한 장을 먼저 병합한다(PR #958).
- 고치려면: `court/**` 는 금고다 — 「금고 변경 승인」.

## 2. 채점 기준인 무결성 게이트가 금고 목록에 없는 도우미에 기댄다

- 어디: `scripts/verify-integrity-gate.js` 19행(`tests/helpers/inline-bundle`) · 23행(`tests/helpers/wiring-exposed.js`) · 30행(`tests/helpers/moved-code.js`).
- 금고 목록: `court/vault.json` 의 `baseTests` 에 `scripts/verify-integrity-gate.js` 가 있다. `tests/helpers/**` 는 `frozen` · `baseTests` 어디에도 없다(파일을 읽어 확인).
- 뜻: 도우미를 고치면 채점 기준의 판정이 바뀔 수 있는데, 도우미 변경은 금고 변경으로 잡히지 않는다.

## 3. `renderTeamGoalsScreen` 큰 함수

- 어디: `js/tabs/goals/team-goals-screen.js` 21~791행(함수 771줄 — `@babel/parser` 로 센 값) · 파일 798줄.
- 걸리는 것: 주인 세포가 798줄이라 등록 블록을 붙이면 800줄 상한을 넘는다(`docs/architecture/CELL-REGISTRY-DESIGN.md` 293행). 그래서 이 함수의 통로 연결 2줄은 등록 기관이 아니라 부팅 파일이 글자 그대로 중계한다(상민님 「권장대로 모두 진행」 ②).
- 나누는 일은 옮기기가 아니라 고치기다(944줄 함수 때와 같다 — 안전망 시험 → 제자리 나누기 → 옮기기).

## 4. 옛 생성기 단위 시험 T7

- 어디: `docs/design/harness/module-split/unwire-check-b1.js` 의 T7 — 「작업 트리의 실제 index.html 에서 참조가 남지 않는 `_settingsKit` 가져오기를 골라 철거해 본다」.
- 상태: 재철거 3차(PR #953)가 그 손잡이를 지운 뒤로 고를 대상이 없어 「측정불가」로 실패 기록이 된다. 그 한 건이 이 시험을 다시 돌리는 뒤의 묶음들에 실패로 번진다.
- 근거: `docs/specs/REQ-TASK-ES-681-GEN-FINALIZE-OPTIONS.md` 99행 · `REQ-TASK-ES-683-UNWIRE-4.md` 76행 · `REQ-TASK-ES-684-UNWIRE-5.md` 86행 · 측정 기록 `reports/TASK-ES-681/prev-suite-base.json`.

## 5. 실계정으로만 확인할 수 있는 것

- 법정이 「확인 못 함」으로 남긴 항목: `reports/TASK-ES-691/not-confirmed.md`(대장에서 뽑은 표 — PR · 항목 · 판정 주소).
- 그 밖에 화면 시험과 독립 확인이 못 잰 것(각 PR 의 REQ 「측정불가」 줄과 병합 전 독립 확인의 「못 잰 것」):
  - 카카오 · 구글 OAuth 로 돌아온 직후의 진입.
  - 마지막 정리 뒤, 저장된 세션이 있는 로그인 사용자가 다시 들어올 때의 끝 화면(가짜 세션과 진짜 연결 라이브러리로 인증 사건의 차례까지만 쟀다. 서버 조회 뒤는 못 쟀다).
  - 만료된 세션을 진짜 서버가 갱신해 주는 길.
  - 기록이 있는 계정의 기록 · 소통 화면 내용(게스트는 기록 · 모임이 0건이다).

## 6. 옮기며 그대로 둔 기존 결함 후보 (고치지 않았다 — 옮기기는 고치기가 아니다)

| # | 무엇 | 근거 위치 | 잰 방법 |
|---|---|---|---|
| 1 | 같은 템플릿으로 저장한 기록이 2건 이상이면 전문 템플릿 기록 창이 열리지 않는다 | `js/tabs/records/table-analytics-engine.js` 249행 `val = parseFloat(…)` — `val` 선언이 없고 파일이 `'use strict'`(12행). `docs/specs/REQ-TASK-ES-646-PRO-MODAL-INPLACE.md` 9절 1(재현 절차 포함) · `REQ-TASK-ES-672-PRO-MODAL-CELLS.md` 9절 | 그 REQ 의 작업자가 게스트로 재현(화면) · 이 문서 작성자는 행과 선언 유무만 다시 읽음 |
| 2 | 템플릿 마켓 창의 「미리보기」 단추가 예외로 죽는다 | `docs/specs/REQ-TASK-ES-645-TEMPLATE-MARKET-MOVE.md` 59행(`#mktPreviewTableBox` 요소가 창에 없음) | 그 REQ 의 작업자가 게스트로 눌러 봄 |
| 3 | 성장 추이 차트의 점 설명(툴팁)이 보이지 않는다 | `REQ-TASK-ES-646` 9절 2(`ui.css` 의 `.trend-tooltip.show` 와 처리기의 `display` 대입이 어긋남) | 그 REQ 의 작업자가 화면으로 |
| 4 | 저장 함수 `executeSave` 안에 try 가 하나도 없다 | `js/tabs/records/pro-record-save.js` 26~185행(문 34개 · await 2개 · try 0개 — `@babel/parser` 로 셈) | 코드 읽기 — 도중에 예외가 나면 무엇이 남는지는 재지 않았다 |
| 5 | 전문 템플릿 기록 창을 열 때마다 `focusin` 수신기가 하나씩 더 걸린다 | `js/tabs/records/pro-record-stopwatch.js` 233행(공용 창 요소에 건다. 떼는 코드는 이 세포들에 없다) · 공용 창 요소는 하나를 계속 쓴다(`js/core/modal-open.js` 49행 `sheet.innerHTML = …`) | 코드 읽기 — 화면으로 재지 않았다 |
| 6 | `tests/offline-sync-queue-retain.test.js` 가 가끔 실패한다(흔들림) | `REQ-TASK-ES-620-WIRING-TEXT-TESTS.md` 137행 · `REQ-TASK-ES-645` 76행 · `REQ-TASK-ES-682-REGION-3.md` 84행 | 여러 작업자가 따로 돌려 봄(같은 트리에서 통과와 실패가 섞임) |
| 7 | 퀵 루틴 칩 줄 `#quickRoutineRow` 는 화면에 없는 요소다(가리키는 코드만 남음) | `REQ-TASK-ES-640-WRAP-BOOT-2.md` 60행 · `js/core/boot-home-wiring.js` 53행 · `js/tabs/records/checkin-input-wiring.js` | 그 REQ 의 작업자가 마크업을 읽음 · 지우는 것은 승인선 ③ |
| 그 밖 | 전문 템플릿 기록 창의 작은 것들(도구 창이 기록 창을 덮어씀 · 취소 단추 처리기 이중 대입 · 변수 중복 선언 · 랩 기입 칸 · 단추 글자) | `REQ-TASK-ES-646` 9절 3~9 | 그 REQ 참조 |

## 7. 부팅 파일(`js/app/boot.js`)이 오지 않으면 예외 없이 앱이 뜨지 않는다

- 무엇: 마지막 정리(PR #962) 뒤 앱을 띄우는 문 59개가 `js/app/boot.js` 한 파일에 있다. index.html 에는 상수 선언 두 줄만 남았다. 그 파일이 오지 않으면(404 등) 아무 문도 돌지 않는다.
- 측정(`reports/TASK-ES-691/boot-file-missing.json` — 탐침 `tools/missing-file.cjs`, PR #962 의 머리 307e68e1 에서 병합 전에 잼. 게스트 · 로컬 서버 · 첫 방문):
  - `js/app/boot.js` 만 404 로 돌려주면: 랜딩 화면은 보인다. 「로그인 없이 둘러보기」를 눌러도 앱으로 들어가지 않는다. **예외 0 · 콘솔 오류 0** — 조용히 멈춘다. 통로 이름 471(평소 539) · 상태 이름 0(평소 67) · 테마 표시 없음.
  - 견줌 1(직전 main 13250583 에도 같은 종류의 상태는 있다): IIFE 바로 앞 세포 `js/core/cell-registry-commit.js` 가 404 면 직전 main 도 머리도 앱으로 들어가지 못한다 — 이때는 예외가 1건 난다.
  - 견줌 2: 구역 세포 하나(`js/core/boot-finish.js`)가 404 면 두 트리 모두 예외 1건을 내고 앱으로는 들어간다.
  - 정리: 「파일 하나가 안 오면 앱이 안 뜬다」는 전에도 있었다. 그런 파일이 하나 늘었고, 이 파일은 예외도 남기지 않는다.
- 캐시에 관해 읽은 것(코드 읽기): 서비스 워커(`sw.js`)는 페이지 이동 요청만 다루고 js 파일은 건드리지 않는다. `vercel.json` 에 캐시 머리 지정은 없다. `boot.js` 태그에는 `?v=` 꼬리표가 없다 — 세포 태그의 규칙과 같다(js/core · js/tabs 의 세포 태그 대부분이 그렇다). 운영의 실제 응답 머리는 재지 못했다.
- 운영 반영 사실:
  - GitHub 배포 기록(이 문서 작성자가 읽음): #962 의 병합 커밋 c9bd38b9 는 운영 배포가 2026-10-11T17:12:53Z 에 실패로 적혀 있다(사유 글자 「Deployment has failed」 — 원인은 측정불가). 다음 병합 #963(1cef5b13)의 운영 배포는 2026-10-11T17:21:01Z 에 성공으로 적혀 있다.
  - 지휘 세션의 측정(이 문서 작성자는 다시 재지 않았다): 운영 index.html 의 sha256 앞 12자 4d78d6379c0b 가 main 과 같고, 운영의 `js/app/boot.js` 는 200 이며 main 과 같다. 실제 브라우저 게스트 부팅에서 통로 이름 539 · 상태 이름 67 · 서버 연결 객체 생성 · 여섯 탭 전환.
- 상민님이 정하실 것: 이 상태에 대비(예: 「잠시 뒤 다시 열어 주세요」 알림 화면 · 다시 받기)를 둘지. 두면 새 동작을 더하는 일이라 새 지시가 필요하다.
- 근거 댓글: https://github.com/yangsangmin/ourgoal-app/pull/962#issuecomment-6111564256

