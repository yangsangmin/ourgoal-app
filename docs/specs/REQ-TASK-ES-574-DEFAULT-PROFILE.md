# TASK-ES-574 기본 프로필 생성 책임 분열

작업참고 기준 PR #834(625c876b), L009·L010·L051. 유형 표준: 병합 TASK573 AST 끝 범위 opt-in 사용. 기준 origin/main625c876b. 제품 동작 변경0.

## 1. [원칙 ①] 파악
index.html defaultProfile(id,username,displayName)과 같은 줄 window.defaultProfile 노출을 확인한다. 실제 랜딩 #btnLandingPreviewDirect 클릭은 inapp-landing.js의 기존 #landGuestBtn 처리기를 통해 생성 함수를 호출한다.
## 2. [원칙 ②] 본질
본질: 프로필 구조 생성 한 책임을 js/core/default-profile.js 기관으로 옮긴다. 원인: 인라인 조립과 기본 구조 생성이 한 파일에 섞여 있다. 중심: defaultProfile의 반환 객체와 기존 defaultSettings·nowISO 참조다. 핵심: 동일 원문과 같은 줄 window 노출 순서를 보존한다.
## 3. [원칙 ③] 해결
inline-profile574.json의 preserveWindowSuffix·keepRest로 gen-inline-hard.js가 원문만 추출한다. OurgoalUiHelpers 키트·HO 자리·기존 태그를 사용한다.
## 4. [원칙 ④] 재검토
반론1: 직접 stub 호출도 실제 UI 증명이다. 그렇지 않다. Court 방식 새 storage·임의 호스트에서 실제 보이는 버튼을 눌러 CDP preciseCoverage 원시 count를 측정한다. 반론2: 전체 프로필 비교가 시간/ID 때문에 불가능하다. 생성값의 유효 형식을 보존하며 시간·ID 차이만 정규화하고 전체 저장 구조를 비교한다.
## 5. [원칙 ⑤] 절차
원본 actual count→detached git 기준→생성→토큰/rest/suffix/노출 수/순서→기준2후1 DOM 및 tab→각 loadOne→실계정 읽기→개별 시험·npm 전후→주장·커밋 인계.
## 6. [원칙 ⑥] 재검증
최상위 this/arguments0·원문/신규 단독 로드·중복 처리기0. localhost 자동 preview와 직접 숨김 버튼 클릭은 쓰지 않는다. 초기 profile=null, 실제 호출1, 전체 저장·화면·토스트·console 비교를 수행한다. 예전 임시 stub3입력은 실제 UI 증명이 아니다.
## 7. [원칙 ⑦] 실행
R1 실제 게스트 랜딩 프로필 생성·저장·홈/기록 진입 UI를 원문 그대로 보존한다.
R2 토큰/남은 글자·같은 줄 suffix·단독로드·시험·탭/DOM·실계정 작업자 측정 기록을 reports/TASK-ES-574에 적재한다.
R3 생성 설정·신고서·설명·명세를 기록한다. 지도4종 및 기준선 main판 유지, module-specs만 실행한다.
## 8. [원칙 ⑧] 막힘 예상
호출이0이면 제품 이동 전에 도달성 원인을 보고하고 원본 유지. 날짜·ID·출처/포트 차이 정규화는 원문 raw 측정과 함께 남긴다. tab deadclick off는 양쪽 동일하며 전수 죽은 클릭 증명이라 부르지 않는다. real-account는 실제 운영 테스트 계정 읽기전용 비교이고 직접 원격 쓰기0이다.

비동기 시점 근거: 기존 js/core/profile-topbar.js startScheduleReminderPoller는 runCheck를 setTimeout 3000ms로 실행하고 js/notify-engine.js checkScheduleReminders → getNotifConfig가 notifications.cheerActivities/streakReminders 및 notifDm을 보충한다. 최초800ms 고정 대기에서는 실행 시점에 따라 필드가 덜 보충된 raw3벌(ui-before-settle-*)과 비교 보고를 보존했다. 최종 profile-ui574.js는 동일3필드가 true가 될 때까지 최대10000ms 기다리고 실패하면 timeout을 기록한다. 원문 보충 함수·제품·기대값 변경0. 콘솔 외부 차단 오류는 raw를 보존하고 주소 및 발생 순서만 정규화하며 오류 개수를 보존한다.

준비 시나리오 failedStep6은 숨김 #homeGreeting textContains였으며 최초 보고의 토스트 원인 추정을 정정했다. 두 실패 결과를 보존하고 신규 미공개 시나리오만 보이는 #captureCardBox/#captureInput 및 기존 토스트 관찰로 작성했다. 성공한 DOM·탭·실계정 측정은 보존했다. 신규 REQ② 형식 누락은 문서만 보강하고 npm을 재실행했으며 기존113 시험 및 helper2 종료/출력 측정은 재사용했다. 상세 경위와 원시 정본은 reports/TASK-ES-574/provenance.json을 따른다.
