# 공용 화면 부품 목록 — 중복 조사와 한 벌화 순서 (TASK-ES-356 · CORE-08)

> 상위 문서: [MODULE-BLUEPRINT.md](MODULE-BLUEPRINT.md) 6절 「융합」·8절 쪼개는 순서 2번(공용 화면 부품). 이 문서는 **조사와 순서**만 담는다. 구현(js/ui/ 한 벌화)은 다음 티켓이다.
>
> 숫자는 `node scripts/module-metrics.js` 의 `info.duplicateCellSites`(정의 서명 정규식은 스크립트 `DUP_FAMILIES`) 산출, origin/main f7e31bd(2026-10-04). index.html 줄 번호는 파일 그대로다. 보조 집계(시트·칩·정적 덮개 마크업)는 같은 날 grep 결과이며 명령을 함께 적었다.

## 1. 요약

| 부품 | 정본(지금 쓰는 공용 구현) | 따로 만든 것 | 수 |
| :-- | :-- | :-- | --: |
| 토스트 | index.html `toast()`(2619줄, `#toast` 요소) + 같은 요소를 쓰는 `showUndoPrivacyToast`(2634)·`toastWithTrashUndo`(9605) | js 파일마다 만든 토스트 연결 통로(의존성 주입 래퍼) | **6** |
| 모달(가운데·바텀시트 겸용) | index.html `openModal(html, onMount)`·`closeModal()`(7934·7987, `#modalOverlay`·`#modalSheet`) | js 파일마다 만든 openModal 연결 통로 | **4** |
| | | 공용 모달을 안 쓰고 직접 만든 전체 화면 덮개 | **9** |
| | | index.html 마크업에 따로 있는 덮개 요소(`eval-modal-backdrop` 3 · `#commProfileBottomSheet` 1 — `theme-modal-backdrop` 1 은 TASK-ES-367 에서 제거) | 4 |
| 확인창 | index.html `openBottomSheetConfirm(title, message, okText, cancelText, onOk, onCancel)`(8023, `openModal` 위) | 브라우저 기본 `confirm()` 호출 | **41** |
| 알림창 | index.html `openBottomSheetAlert(title, message, okText, onOk)`(8004) | 브라우저 기본 `alert()` | 1(grep) |
| 바텀시트(별도 구현) | (정본 없음 — `openModal` 이 바텀시트 모양으로 뜬다) | `showCheckinFeedbackSheet`(18137, 자체 `checkin-ai-backdrop`) · `openInAppDmSheet`(24495, `#commProfileBottomSheet` 표시 전환) | 2 |
| 칩 | (정본 없음) | `chip` 으로 끝나는 CSS 클래스(ui.css·index.html `<style>`) 52종, 칩 그리는 함수 `renderQuickCheckinGuideChips`(4990)·`renderAttachmentChipsHtml`(20456)·`renderInlineAttachmentChips`(20471)·`wireAttachmentChipClicks`(20826)·`drawChip`(35509, 캔버스) | 52 · 5 |

## 2. 위치

### 2-1. 토스트 연결 통로 6 (`function toast`/`showToast`/`toastFn` — index.html 밖)

> **TASK-ES-361 에서 0 으로 줄였다**: 6곳은 `js/core/toast.js` 가 주는 능력 `ui.toast.bind` 로 만든 함수를 쓰고(주입 토스트 우선), 그리기는 index.html 정본 `toast()` 그대로다(정본 준비 전엔 대기열). team-invite-comm 재귀(CORE-10)도 사라졌다. 아래 표는 그 전 기록이다. 정본을 `js/ui/toast.js` 로 옮기는 일(3절 1번 앞부분)은 `attach(fn)` 자리로 남겨 두었다.

| 파일:줄 | 이름 | 하는 일 |
| :-- | :-- | :-- |
| js/auth-safety.js:6 | `toastFn` | 기본값 `console.log` — `init(deps)` 전에는 화면에 안 뜬다 |
| js/helpful-reason.js:38 | `toast` | `deps.toast` 위임 |
| js/reactions.js:45 | `toast` | `deps.toast` 위임 |
| js/team-invite-comm.js:13 | `showToast` | `_ctx.toast` → 없으면 **자기 자신을 다시 부른다**(16줄 `return showToast(msg)`) — `init()` 전에 불리면 무한 재귀가 `try/catch` 에 묻혀 토스트가 조용히 안 뜬다(잠재 결함, 이 PR 은 동작을 바꾸지 않아 고치지 않았다. index.html 40467줄 `init({ toast })` 뒤에는 `_ctx.toast` 로 정상) |
| js/team-linked-goals.js:18 | `toast` | `_ctx.toast` → `global.toast` |
| js/team-visibility-levels.js:17 | `toast` | `_deps.toast` → `global.toast` |

### 2-2. 모달 연결 통로 4 (`function openModal` — index.html 밖)

js/team-linked-goals.js:19 · js/team-visibility-levels.js:18 · js/theme-system.js:635 · js/time-tracker.js:1184

> **TASK-ES-363 에서 0 으로 줄였다.** 4곳을 열어 보니 성격이 둘이었다.
> - **진짜 연결 통로 2곳**(team-linked-goals·team-visibility-levels): 주입 `openModal`/`closeModal` → 없으면 `window.openModal` 로 넘기기만 하던 함수. `js/core/modal.js` 가 주는 능력 `ui.modal.bind` 로 만든 `{ open, close }` 를 쓰게 바꿨다(주입 우선, 없으면 정본, 정본 준비 전엔 대기열). 그리기는 index.html 정본 `openModal`·`closeModal` 그대로다.
> - **자체 모달 2곳**(theme-system·time-tracker): 정본으로 넘기는 통로가 아니라 자기 DOM(index.html 정적 덮개 `#themeSelectorModal` · 자체 전체화면 덮개 `#timeTrackerOverlay`)을 여는 함수가 같은 이름을 쓰고 있었다. 정본으로 옮기면 모양이 바뀌므로 이번엔 이름만 정정했다(`openThemeSelector`/`closeThemeSelector` · `openTrackerOverlay`/`closeTrackerOverlay`, 밖으로 드러난 API 키 `openModal`·`open` 은 그대로). 이 둘은 2-3 덮개 흡수(3절 4번) 대상이다 — `#timeTrackerOverlay` 는 덮개 지표(selfOverlay, time-tracker.js:131)에 이미 잡혀 있고, `#themeSelectorModal` 은 1절 정적 덮개 요소(`theme-modal-backdrop` 1)로 잡혀 있다.
> - 새로 찾은 결함(고치지 않음): 테마 선택 창은 지금 화면에서 열 길이 없다. 여는 입구 두 곳(`#captureLiveTheme` 이 든 `#captureLiveMeta`, `#btnOpenThemeModal` 이 든 `#captureThemeQuickBar`)이 ui.css 5824·5955 줄 규칙으로 앱 테마 4종(focus-sanctuary·black·white·urban-city) 모두에서 `display:none !important` 다. 기능을 살릴지·지울지는 상민님 결정(기능 삭제 승인선).
> - **TASK-ES-367(SET-09, 상민님 승인 2026-10-04 "결심필요 - 사용자가 열 수 없는 테마 선택 창 권장대로 진행해")에서 지웠다.** `#themeSelectorModal`·입구 `#captureLiveTheme`·`#captureThemeQuickBar`(`#btnOpenThemeModal`·즐겨찾기 칩)·안내 문구·`OurgoalThemeSystem.initUI`·그것만 쓰던 ui.css 규칙을 제거. 체크인 테마 분류(`suggestTheme`·`buildCheckinThemePayload`·온톨로지·즐겨찾기/커스텀 데이터 함수)와 저장된 프로필의 `themeSettings` 는 그대로다. 정적 덮개 요소(`theme-modal-backdrop`)는 이제 0.

### 2-3. 공용 모달 대신 직접 만든 전체 화면 덮개 9

index.html:7664(`position:fixed;inset:0`) · index.html:16044(`mic-perm-backdrop`)·16048 · index.html:16351(`position:fixed;inset:0`) · index.html:18153(`checkin-ai-backdrop`) · js/avatar-system.js:5567(`modal-backdrop active`)·5568 · js/time-tracker.js:131(`tt-overlay`) · js/universal-stats.js:5184(`style.inset = '0'`)

같은 덮개를 두 줄로 만든 곳(16044·16048, 5567·5568)이 있어 덮개 수로는 7곳이다. 지표는 정의 서명 수(9)로 센다.

### 2-4. 기본 `confirm()` 41

index.html 27곳(4661·6391·9585·9597·10942·11151·11440·17792·20531·22889·23103·24824·25374·25387·25410·25539·25849·26758·27697·27853·28186·33427·36796·38188·38199·38206·39311), js/universal-stats.js 4 · js/team-invite-comm.js 2 · js/team-linked-goals.js 2 · js/time-tracker.js 2 · avatar-system·customize·reactions·team-visibility-levels 각 1.

### 2-5. 보조 집계 명령(grep, 같은 날)

```
grep -ohE "\.[a-zA-Z0-9_-]*chip\s*[{,]" ui.css index.html | sort -u | wc -l          # 칩 클래스 52
grep -ohE 'class="[^"]*\b(modal-overlay|modal-backdrop|eval-modal-backdrop|theme-modal-backdrop)\b[^"]*"' index.html | sort | uniq -c
grep -ohE 'id="[A-Za-z]*(BottomSheet|Sheet)"' index.html | sort -u                      # #commProfileBottomSheet · #modalSheet
```

## 3. 한 벌화 순서 (다음 티켓 — 쪼개는 순서 2번)

능력 등록부(`js/core/capabilities.js`)로 **이름이 아니라 능력**을 주고받게 한다. 한 단계마다 tab-check 전후 차이 0, 모듈 가드 기준선 낮추기.

1. **`js/ui/toast.js` 기관 세포** — index.html `toast`·`showUndoPrivacyToast`·`toastWithTrashUndo` 를 옮기고 `ui.toast`(`{ message, action? }`) 능력을 `provides`. 6개 연결 통로는 `OurgoalCapabilities.request('ui.toast')` 로 바꾼다(team-invite-comm 재귀도 이때 사라진다). 지표: 토스트 6 → 0, ③ 감소(`window.toast`·`window.showToast`).
2. **`js/ui/sheet.js`** — `openModal`·`closeModal`(뒤로가기 history 처리 포함)을 옮기고 `ui.sheet` 능력. 모달 연결 통로 4 → 0.
   - (TASK-ES-363) 통로 쪽은 끝났다: `js/core/modal.js` 가 `ui.modal`·`ui.modal.close`·`ui.modal.bind` 를 주고 모달 연결 통로 4 → 0. 남은 일은 정본을 `js/ui/sheet.js` 로 옮기는 것뿐이며 `attach({ open, close })` 자리로 열어 두었다.
3. **`js/ui/confirm.js`** — `openBottomSheetConfirm`·`openBottomSheetAlert` 를 `ui.confirm`·`ui.alert` 로. 기본 `confirm()` 41 을 탭 이전 단계마다 그 탭 몫씩 바꾼다(삭제·탈퇴 확인처럼 되돌릴 수 없는 동작은 문구를 바꾸지 않는다).
4. **덮개 9 흡수** — 직접 만든 덮개를 `ui.sheet` 로 바꾸되, 체크인 직후 시트(`showCheckinFeedbackSheet`)는 `checkin.after` 자리의 기여로 옮긴다.
5. **칩** — 칩 클래스 52종을 `js/ui/chip.js` + 한 벌 CSS 로 모으는 것은 디자인 토큰 결정이 필요해 마지막(보기 차이는 사람 눈 확인 — `visual-quality`).

각 단계의 완료 기준은 `node scripts/module-metrics.js --card` 의 「같은 일을 하는 중복 세포」 행 숫자다.
