# TASK-ES-569 기록 테마 분류·공용 토스트 표시 책임 분열

최종 작업참고 기준 PR #829 (2138415b), L051 적용. 착수 참고 #827. 표준: L010 생성기 재실행·L009 지도 main 유지·CELL_SPLIT_PROOF. 병합 순서 TASK-ES-568 다음.

## 1. [원칙 ①] 문제 파악

index.html G062 「5대 테마 온톨로지 & 경량 AI 분류기」의 RECORD_THEMES·THEME_KEYWORDS·THEME_REGEX_RULES·CATEGORY_THEME_MAP·classifyRecordTheme가 인라인에 남아 있다. js/tabs/records/theme-classifier.js 한 책임 세포로 옮긴다.

## 2. [원칙 ②] 본질·원인·중심·핵심

테마 자료는 기록 카드, #themePickList 선택 창, 기록 CSV와 생애 균형 화면이 공통으로 읽는다. 함수는 기존 프로필 읽기 및 피드백의 분류 통로다. 새 구조나 새 데이터 수집 없이 원본 자료·동일 함수와 원래 연결을 보존하는 것이 목표다.

## 3. [원칙 ③] 해결 방식

docs/design/harness/module-split/inline-record-theme-569.json으로 gen-inline-hard.js를 실행한다. 네 상수와 함수 하나를 함께 옮긴다. 정규식 리터럴은 생성기 isPureInit가 허용한다. 원래 L.RECORD_THEMES·L.classifyRecordTheme 노출, _recordsKit 지역 참조, 같은 줄 script 태그를 유지한다.

## 4. [원칙 ④] 재검토

buildCheckinRecord 제품 호출은 saveQuickCheckin 내부 한 곳뿐이며 saveQuickCheckin 자체 제품 호출은 없다. 실제 #captureSave는 js/tabs/records/checkin-capture.js에서 직접 객체를 만들고 OurgoalThemeSystem.buildCheckinThemePayload를 쓴다. 따라서 이 두 함수는 keepRest로 원본에 남긴다. renderAll은 여러 탭 조립 glue이고 책임 이동 효과가 작으므로 함께 옮기지 않는다. 이 분열은 모든 체크인 저장이 classifyRecordTheme를 부른다고 주장하지 않는다.

## 5. [원칙 ⑤] 절차

번호·브랜치 예약→원본 호출 조사→REQ/생성/시나리오 준비→TASK-ES-568 병합 통지→최신 main 입력 재생성→토큰/단독 로드/화면/조작/시험 측정→claims→커밋→함장 심사 인계.

## 6. [원칙 ⑥] 절차 재검증·반론

반론1: 미사용 저장 함수를 옮겨 줄 수만 줄이는 것은 실제 조작으로 증명할 수 없다. 이를 원본에 보존한다. 반론2: 분류기가 바뀌지 않아도 상수 초기화·키트 위치가 어긋나면 부팅이 깨진다. 생성기 verify의 importBeforeKit·lastGetterNoSetter 및 새 파일 court loadOne 결과를 명시한다. 화면 비교는 기준2/후1, 개별 클릭은 별도 게스트 실제 조작 시나리오로 검증한다.

## 7. [원칙 ⑦] 실행 식별자·요구사항

R1: js/tabs/records/theme-classifier.js로 상수4개·classifyRecordTheme 그대로 이동. 한 파일 800줄 이하.
R2: #captureInput→#captureSave로 게스트 기록을 만들고 기록 탭 [data-rectheme]→#themePickList→[data-picktheme="study"]로 테마를 바꾸면 공부기록 표시와 토스트가 같은지 확인.
R3: 원본 단독 로드 및 새 파일 loadOne, 토큰·남은글자 동일·누수0·이중처리기0·원래 객체 참조/분류 산출 동일을 증명.
R4: 기준2/후1 목표 관련 홈·기록 화면 및 DOM·저장값 비교, 실계정 읽기 전후 비교, tests와 helper 시험 종료 동일 및 npm test.
R5: 신고서 등록, generated maps4종 main 유지, 기존 기대값·단언·검사 수 변경0.

## 8. [원칙 ⑧] 막힐 지점 예상·측정

시나리오의 첫 기록 축하 창이 기록 탭 진입을 가리면 보이는 닫기 단추로 닫는다. 숨김 상태로 닿지 않는 기능은 옮기지 않는다. FN_NAMES의 buildCheckinRecord는 옮기지 않아 F2 시험지 선행이 필요 없다. 그 밖의 고정 원본 시험지가 발견되면 제품0 읽기범위 선행만 함장에게 보고한다. 기록 분류 함수의 실제 UI 호출 수와 순수 함수 검증 호출은 구분하며 실측되지 않은 값을 PASS라 쓰지 않는다. 웹 지도는 root가 실제 도구 연결 불가 pending을 관리한다.

[4단계: 심사 청구] 준비 중 — 최종 기준·측정은 TASK-ES-568 병합 후.

## 표준 이탈 근거 4점: 공용 토스트 표시 책임

① 이탈 규칙: MODULE-SPLIT-PROTOCOL 1절과 INLINE-HARD-SPLIT-DESIGN의 옛 예시는 toast가 toastTimer를 공유하므로 남긴다고 한다. UiHelpers 본체에 불순 함수를 손으로 넣지 않는다.

② 사실·필요: 현재 index.html은 toastTimer에 이미 getter/setter를 두고, js/core/confetti.js의 showUndoPrivacyToast가 L.toastTimer로 같은 상태를 읽고 쓴다. core/app-enter 등은 이미 OurgoalUiHelpers 키트에 상태 의존 기관 함수를 등록하는 기존 선례다. 상태 공유 자체를 새로 만들 필요가 없다.

③ 대안: toastTimer·window.toast·window.showToast는 원본에 남기고, gen-inline-hard.js가 toast 함수만 js/core/toast-renderer.js에 생성한다. 기존 OurgoalUiHelpers 키트의 toast 키에 등록하며 원본 ui-helpers.js 태그 뒤에 같은 줄로 새 태그를 넣는다. HO 기관 자리에서 _uiKit 선언 뒤 가져온다. UiHelpers 본체·연결 방식·규범은 수정하지 않는다.

④ 동급 이상 검증: 토큰 동일·남은글자 동일·setter 최종 노출·단독 loadOne·원본 회귀0, 실제 UI 토스트 교체와 클릭 닫기·2200ms 소멸, 목표 공개범위 Undo의 5000ms 타이머 공유·실제 Undo 클릭·저장값을 기준2/후1로 비교한다. 각 세포는 자기 behavior 시나리오를 둔다. 실제 도달하지 못하면 토스트를 범위에서 제외한다.

R6: js/core/toast-renderer.js의 실제 토스트 표시는 원본과 같다. #toast 클릭 닫기와 Undo 교체 후 표시·저장값을 검증한다. 새 숨김 !important 0, 기존 타이머 변경0.

화면 차이는 records·goals 두 탭을 동일 --deadclick off로 기준2/후1 측정한다. 각 세포의 클릭 기능은 별도 실제 조작 시나리오로 검증하며 전수 DeadClick을 주장하지 않는다. DOM 도구는 기존 shots-lib의 로컬 게스트 화면 시드를 재사용하고 기록 테마 변경·Undo의 실제 저장값을 비교한다. 이 시드 화면 검사는 원격 실계정 E2E가 아니며 별도 테스트 계정 읽기는 쓰기 요청을 차단한 실계정 하네스로 수행한다. 정규화는 ISO시각·UUID·epoch ms·서버포트만 사용한다.

준비 중 최신 작업참고 재확인: > **기준 PR #824** (0a2e424d) · 생성 2026-10-06 12:22 KST · 경험칙 50개

최종 기준: origin/main 2138415bbd429f8941138043c817b2a2c06d3e33를 detached git worktree로 만들고 같은 입력에서 재생성했다. reports 산출물 값 적재 주장은 domain config로, 실제 화면 동작은 세포별 독립 behavior 시나리오로 나눈다(L051).
