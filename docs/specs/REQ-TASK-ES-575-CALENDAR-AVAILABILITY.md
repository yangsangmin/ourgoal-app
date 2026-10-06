# TASK-ES-575 캘린더 가능 여부 판별 책임 분열
작업참고 기준 PR #835. 유형: 표준(L015·L016·L019·L021·L009). 최종 기준은 origin/main 69d5b9e67b87d20b5303c19cc5dfd28d5ea4cefb이며 해시는 보고 출처다.

## 1. [원칙 ①] 문제 정확히 파악
index.html calendarAvailable(appClientId, settings)는 trim한 앱 ID 또는 settings.gcalClientId 존재 여부를 반환하는 5줄 함수다. 실제 호출은 js/tabs/calendar/day-detail.js:57의 renderCalDayDetail이며 일정이 있는 날짜의 일정 반영 버튼 표시를 결정한다. 브리프의 js/tabs/records/calendar-day-detail.js는 실물에 없으므로 정정한다.

## 2. [원칙 ②] 본질·원인·중심·핵심
본질은 설정 존재 여부의 순수 판별 책임이다. 원인은 이전 분열에서 smoke FN_NAMES 때문에 인라인에 남긴 것이다. 중심은 기존 OurgoalUiHelpers/_uiKit 통로와 호출을 그대로 보존하는 것이다. 핵심은 원문 trim·fallback·버그 보존과 실제 일정 상세 렌더 도달 증명이다.

## 3. [원칙 ③] 해결방식
inline-calendar575.json과 gen-inline-hard.js로 calendarAvailable만 js/core/calendar-availability.js에 옮길 계획이다. HO 자리와 기존 기관 키트를 사용하며 ui-helpers.js가 키트를 통째 대입하므로 afterTag로 그 태그 뒤에 삽입한다. 같은 묶음 googleTokenClient·saveGoogleToken(arguments)·window 노출·토큰 저장은 그대로 둔다. 돈 기능과 무관한 책임이며 코드의 다른 동작을 고치지 않는다.

## 4. [원칙 ④] 재검토
smoke의 fnSource 및 tests/gcal-login-reconnect-fix.test.js는 inline-bundle 지원을 확인했다. 지도의 testIndexOnly 표시는 현재 실제 시험지보다 오래된 정보다. 최종 단계에서 기존 시험 전체 종료코드를 실제 비교하고, 깨지면 기대값·단언 수정 없이 별도 선행 필요 여부를 부모에게 보고한다. 새 파일 신고서는 organ으로 등록하고 generated 필드는 module-specs --write만 쓴다.

## 5. [원칙 ⑤] 절차
좁은 실제 UI 설계: #btnLandingPreviewDirect → .navbtn[data-tab="calendar"] → #calAddManualBtn(또는 빈 날짜 #calEmptyAddBtn) → #calEditTitle에 작업 식별 가능한 일정 제목 입력 → 기존 #calEditDate 현재 선택 날짜 유지 → #calEditSaveBtn 실제 클릭 → 모달을 실제 닫고 #calDayDetail 렌더 및 저장값·토스트 확인. 추가한 일반 일정이 evs에 있으므로 calendarAvailable이 호출된다. 계수만 함수 선언 진입에 런타임 삽입하고 함수를 직접 부르거나 상태 배열을 주입하지 않는다. [data-calsync]의 표시/비표시를 관찰하되 구글 연결·외부 일정 반영 버튼은 클릭하지 않는다. 기존 상수가 비어도 false 분기 호출은 도달 증거다. positive 분기는 실제 앱 설정 입력을 통해서만 보강하며 가짜 ID나 상태 주입으로 만들지 않는다.
모든 원격 REST/storage 쓰기와 local API 쓰기는 기존 측정 하네스 방식으로 차단하고 운영 row 쓰기0을 기록한다. 저장된 게스트 일정은 측정 context 안에서만 생성한다. 최종 기준 통지 뒤 archive 원문과 detachedGit 시험 기준을 따로 만들고 새JS git add 후 원문·독립로드·이음매·실제UI기준2/후1·표준calendar탭2/후1·npm 및113시험지+2보조 종료/출력 비교를 한 벌만 실행한다. UI 도달 및 호출수는 현재 측정하지 않았으므로 null이다.

## 6. [원칙 ⑥] 절차 재검증
반론1: 순수 함수 직접 호출 시험이면 충분하다. 답: 실제 버튼 표시 배선을 증명하지 못하므로 사용자가 일정을 추가하고 날짜 상세를 렌더하게 하는 UI 경로가 필요하다.
반론2: 구글 연결 버튼을 누르면 도달을 쉽게 볼 수 있다. 답: 함수는 일정 목록 렌더에서 이미 호출되며 연결 버튼은 OAuth·외부 전송 범위만 불필요하게 넓힌다. 목록 표시와 함수 계수로 충분하다.

## 7. [원칙 ⑦] 단계별 실행
최신 main에서 계획·설정대로 최종 생성 및 측정을 수행한다. 부모가 833→573→574 뒤 최종 main을 통지하면 준비 경로를 실제 측정한다. 도달 실패는 실패 원문을 보존하고 숨김·가짜 성공 없이 원인을 보고한다. 원문 생성 → 동일성·회귀0 → 실제UI 및 표준탭 비교 → 전체시험 → config 보고 적재 주장과 실제 ui-behavior 시나리오 분리 → 정상 훅 커밋 인계 순서다. main 생성 지도4개는 L009에 따라 유지한다.

## 8. [원칙 ⑧] 막히는 지점 예상
빈 날짜에서는 evs.map 분기가 실행되지 않아 호출0이다. 실제 일정 저장 후 날짜 상세를 다시 확인한다. 모달 overlay·닫힘은 정상 상태 쌍을 관찰하며 새 숨김을 넣지 않는다. 최종 입력 이동은 생성기로 재실행한다. top-level arguments 함수·돈·외부 전송 경로로 범위를 확대하지 않는다. 측정 보고 jsonPath는 등록 config 분야만 쓰고 고정 main hash 단언은 만들지 않는다.

초기 생성은 OurgoalUiHelpers 통째 대입 탐침이 beforeTag 설정을 거부했다. 제품 파일 생성 전 실패이며 afterTag ui-helpers.js로 교정해 재생성했다. 실패 이후 성공한 증명은 반복하지 않는다. 실제 호출은 제품함수 wrap 대신 원문 CDP precise coverage로 잰다. URL의 공개 apikey만 게시 전에 가리고 원시본은 C:/dev/wt/calendar575-raw에 남기며 원시/게시 SHA와 비교 입력을 구분한다.

최종 정본 reports/TASK-ES-575/proof.json·ui-compare.json·tab-compare.json·test-final.json. 보고 값 적재(config)는 작업자 측정 기록 확인이며 법정 실제 UI는 별도 시나리오다. 원시 URL 키는 저장소 밖 보존, 게시본 비교. 최초 생성기는 ui-helpers 키트 덮어쓰기를 거절했고 afterTag를 해당 키트 생성 뒤로 교정했다. 초기 UI 6벌 실패와 시나리오 문법·선택기 오류는 보존했다.
