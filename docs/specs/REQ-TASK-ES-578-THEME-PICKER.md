# TASK-ES-578 기록 테마 선택창 책임 원문 분열

작업참고 기준 PR #838 (37f418579d460e0a544606f7ef5eb10b7b6863ea). 기준 origin/main 37f418579d460e0a544606f7ef5eb10b7b6863ea.
표준 분열(L001·L002·L005·L006·L015·L016·L019·L021·L009·L053).

## 1. [원칙 ①] 문제 정확히 파악
index.html의 `openThemePickerModal(recId)`(5673~5713줄, 41줄) 함수가 인라인 미분화 스크립트에 남아 있다.
- `openThemePickerModal(recId)`: 기록의 ID로 `state.profile.records`에서 항목을 조회하고, `RECORD_THEMES`의 6개 키(`mind`, `study`, `business`, `schedule`, `workout`, `daily`)를 순회하여 현재 테마(`(현재)`)와 목록 HTML(`#themePickList`)을 구성한 뒤, `openModal`을 통해 모달을 띄우고 `[data-picktheme]` 클릭 시 `rec.theme` 갱신, `saveProfile()`, `closeModal()`, `renderRecordsScreen()`, `toast()`를 호출하는 1-Click HITL 테마 수정 팝업 책임이다.
- 앱 스코프 노출: `index.html:3308` (`get openThemePickerModal(){ return openThemePickerModal; }`).
- 실제 호출부: `js/tabs/records/record-card-wire.js:46~51` (`chipBtn = card.querySelector('[data-rectheme]'); ... L.openThemePickerModal(id);`).
- 화면 마크업: `js/tabs/records/record-cards.js:79` (`.rec-theme-chip[data-rectheme]`).
- 모달 내부 식별자: `#themePickList`, `[data-picktheme]`, `#mCloseTheme`.

## 2. [원칙 ②] 본질·원인·중심·핵심
- 본질: 기록 카드 테마 배지 클릭으로 열리는 1-Click HITL 테마 선택창 단일 책임.
- 원인: 이전 분열 작업들(P2 및 잔여 책임 분열)에서 기록 카드의 단추 배선(`record-card-wire.js`)만 분열되고, 모달 구현체인 `openThemePickerModal`은 인라인에 남아 있었음.
- 중심: 기존 탭 키트(`OurgoalRecordsKit` / `_recordsKit`), 앱 스코프 getter(`OurgoalAppScope.scope.openThemePickerModal`), 태그 순서 보존 및 통째 대입 0건 유지.
- 핵심: `openThemePickerModal` 단 1개 함수만 `js/tabs/records/theme-picker.js`로 원문 분열하고, 실제 마우스 기반 UI 조작(기록 생성 -> 기록 탭 이동 -> 테마 창 열기 -> 테마 변경 저장 -> 다시 열기 현재 표시 확인 -> 닫기)과 원래 함수의 CDP coverage 2회 호출을 기준과 동일하게 완전 증명하는 것.

## 3. [원칙 ③] 해결방식
`docs/design/harness/module-split/inline-theme578.json` 설정과 `gen-inline-hard.js` 스코프 분석 생성기를 사용하여 `js/tabs/records/theme-picker.js`를 생성한다.
- 슬롯: `HO` (기관/키트 선언 뒤).
- 키트: `OurgoalRecordsKit`, 키트 변수: `_recordsKit`.
- 배치 위치: `beforeTag: "<script src=\"js/tabs/records/index.js\"></script>"`.
- 단독 로드 탐침(`court/probes/module-load.js`) 및 원문 무결성(`verify-inline-hard.js`)으로 토큰 동일, 누수 0, 최상위 this/arguments 0, 이중처리기 0을 보존한다.

## 4. [원칙 ④] 재검토
- 시험지 선행 파일: `scripts/inline-hard-test-probe.js` 및 개별 시험 실측 결과 깨지는 시험지가 없음을 확인.
- `index.html` 태그 순서: `record-card-wire.js` 뒤, `js/tabs/records/index.js` 앞에 위치하여 키트 확장 규약을 온전히 만족함.
- 신규 파일(`js/tabs/records/theme-picker.js`)은 800줄 상한선(약 70줄 예상)을 엄격히 준수.
- 다른 책임(타이머, 차트, 피드백 등)은 일절 포함하지 않고 대상 함수 1개만 정밀 분열.

## 5. [원칙 ⑤] 절차
1. 실제 UI 조작 절차:
   - 게스트 진입: `#btnLandingPreviewDirect` 클릭
   - 인사 모달 닫기: `#btnAvatarGreetClose` 클릭
   - 홈 텍스트 입력 및 실천 완료 저장: `#captureInput` 입력 후 `#captureSave` 실제 마우스 클릭
   - 첫 체크인 모달 및 AI 피드백 시트 차폐 해소: `#firstCheckinDoneBtn`, `#btnCheckinAiClose` 마우스 클릭 닫기
   - 기록 탭 이동: `.navbtn[data-tab="records"]` 실제 마우스 클릭
   - 테마 선택창 열기: 생성된 레코드 카드의 `.rec-card [data-rectheme]` 실제 마우스 클릭 -> `#themePickList` 확인
   - 테마 변경: 현재(`daily`)와 다른 `[data-picktheme="study"]` 실제 마우스 클릭 -> `saveProfile()` 및 모달 닫힘, 토스트 확인
   - 다시 열기 및 닫기: `.rec-card [data-rectheme]` 재클릭 -> `study` 테마 `(현재)` active 표시 확인 -> `#mCloseTheme` 클릭으로 닫기
2. 기준 2회 vs 작업 1회 측정: 단계별 DOM 전체, 저장 프로필 전체, 토스트, 콘솔/페이지 에러 동일성 확인. ID는 1:1 관계 보존(L053).
3. `openThemePickerModal` 실제 CDP coverage 호출 수 실측 (정확히 2회 호출).
4. 표준 탭 하네스(`tab-check.js`) 기록 탭 기준 2회 vs 작업 1회 비교, 차이 0 확인.
5. npm test 및 개별 시험 전체 전후 비교.

## 6. [원칙 ⑥] 절차 재검증
- 반론 1: `openThemePickerModal`만 옮기면 기존 `record-card-wire.js`에서 호출할 때 키트 참조나 스코프가 깨질 수 있다.
  - 격파: `record-card-wire.js`는 `L.openThemePickerModal(id)`를 호출하며, `index.html` 3308행의 getter가 `openThemePickerModal`을 그대로 노출한다. 생성기 분열 시 `index.html` IIFE 머리에서 `var openThemePickerModal = _recordsKit.openThemePickerModal;`로 가져오므로 스코프와 getter 연결이 100% 무손실로 유지된다.
- 반론 2: UI 조작 시 첫 체크인 축하 모달과 AI 피드백 시트를 프로그래밍 방식으로 닫거나 생략하고 기록 탭을 열면 테스트가 더 빠르다.
  - 격파: 헌법 제4조 및 L053에 따라 함수 직접 호출이나 상태 주입으로 UI를 우회하는 것은 위헌이다. 실제 사용자가 겪는 화면 렌더 흐름대로 실제 마우스 클릭을 통해 축하 모달과 피드백 시트를 닫아야 실제 화면 차폐와 데드클릭 여부를 정직하게 입증할 수 있다.

## 7. [원칙 ⑦] 단계별 실행
- 1단계: 최신 main(37f41857) 합침, 837->838 diff 0 확인, REQ 작성 및 무결성 게이트 검사
- 2단계: 기준 git archive 사본 생성, 시험지 선행 탐침 및 npm/개별 시험 기준선 측정
- 3단계: `gen-inline-hard.js` 실행으로 `theme-picker.js` 분열, `modules.json` 및 `cell-descriptions.json` 갱신
- 4단계: `verify-inline-hard.js` 검증, 단독 로드 탐침(`module-load.js`), 부팅 회귀 0 측정
- 5단계: 저장소 게시용 UI 하네스(`theme-picker-ui578.js`, toastVisible computedStyle 반영)로 기준 2회 + 작업 1회 측정
- 6단계: UI 비교기(`theme-picker-compare578.js`)로 전수 DOM/프로필/토스트/ID 불변식 대조
- 7단계: 표준 탭 하네스(`tab-check.js`) 2+1 비교, npm test 전체 전후 대조
- 8단계: claims.json 및 scenarios 작성, 정상 훅 커밋, 최종 보고

## 8. [원칙 ⑧] 막히는 지점 예상
- 첫 체크인 저장 후 모달 2개(축하 모달, AI 피드백 시트)가 순차적으로 열려 하단 탭을 가린다. 실제 마우스로 `#firstCheckinDoneBtn`과 `#btnCheckinAiClose`를 순차 클릭하여 차폐를 해소한다.
- 테마 선택 클릭 후 `saveProfile()` 비동기 완료 및 `closeModal()` 완료 대기는 `modalOverlay`의 `active` 클래스 제거를 기준으로 정밀 대기한다.
- 실행마다 다른 게스트 ID와 레코드 ID, 생성 시각은 1:1 bijection 매핑을 보존하고 임의로 정규화하거나 삭제하지 않는다(L053).
