# index.html 인라인 스크립트 책임 묶음 지도

> 생성: `NODE_PATH=<node_modules> node scripts/inline-script-map.js --write` (#TASK-ES-423). **손으로 고치지 않는다** — 다시 만들면 같은 입력에서 같은 글자가 나온다(결정적).
> 출처: `index.html` sha256 앞 12자 `097dd682323d` · 큰 인라인 IIFE 2253~7378줄(5126줄) · 다른 인라인 블록 4줄(8줄), 7381줄(16줄).

## 1. 요약

- 묶음 126개(이음매 8 · 옮길 대상 57 · 빈 구획 61). 묶음 = IIFE 최상위 구획 주석 `/* ============ 제목 ============ */` 에서 다음 구획 주석 앞까지.
- 최상위 함수 32 · 최상위 변수 594 · window 전역 대입 206줄(module-metrics ③ 의 index.html 몫과 같은 정규식) · addEventListener 46 · on<이벤트> 대입 76 · 로드 중 바로 도는 최상위 문 343 · 인라인 on*="…" 처리기가 부르는 IIFE 이름 36개.
- 난이도 묶음 수(줄): 쉬움 16(191줄) · 보통 24(844줄) · 어려움 17(3093줄) · 빈 구획 61(741줄) · 이음매(옮기지 않음) 8(257줄).

### 난이도 점수(낮을수록 안전하게 옮긴다)

`점수 = 4×stateWrite + 2×stateMutate + 1×stateRead + 2×loadTime + 2×inlineHandler + 1×fanInGroup + 1×windowName + 1×externalFile + 3×testIndexOnly + 5×smokeFn`

- stateWrite: 다른 묶음이 선언한 최상위 변수에 대입 · stateMutate: 그 변수의 속성 대입·push 등 · stateRead: 읽기(각각 서로 다른 변수 수)
- loadTime: 로드 중 바로 도는 최상위 문(등록·노출·초기화 — 옮기면 원래 자리에서 불러야 한다) · inlineHandler: 마크업·템플릿의 on*="이름(…)" 이 부르는 이 묶음 함수 수
- fanInGroup: 이 묶음 이름을 부르는 다른 묶음 수 · windowName: 이 묶음이 window 에 다는 이름 수 · externalFile: 그 이름을 쓰는 바깥 js 파일 수
- testIndexOnly: index.html 한 파일만 읽는 시험지 중 이 묶음의 이름(6자 이상)·문자열 글자(8자 이상, 시험지 8곳 넘게 나오는 흔한 글자 제외)를 담은 파일 수 — 옮기면 시험지 선행 PR 이 먼저 필요할 수 있다 · smokeFn: smoke-test FN_NAMES(인라인에서 함수를 잘라 실행)에 든 함수 수
- 등급: 쉬움 ≤ 8 < 보통 ≤ 25 < 어려움. 시험지 글자 의존은 이름·글자 포함 여부만 본 넉넉한 근사다(실제로 깨지는지는 옮겨 보고 시험으로 확인).

## 2. 큰 묶음 상위 10 (줄 수)

| 묶음 | 제목 | 줄 | 함수 | 난이도(점수) | 상태 쓰기/변경/읽기 | 로드 중 문 | 들어옴 묶음 | 시험지(index 단독) |
|---|---|--:|--:|---|---|--:|--:|--:|
| G103 | 템플릿 마켓 · 복제 · 전문 템플릿 기록 (TASK-ES-013) | 1322 | 5 | 어려움(104) | 0/1/50 | 1 | 2 | 35(16) |
| G010 | [#TASK-ES-432] 인라인 스크립트 세포화 2차 이음매 (docs/architecture/INLINE-SCRIPT-MA | 682 | 0 | 어려움(378) | 22/0/124 | 32 | 0 | 83(34) |
| G102 | CSV / 엑셀 양방향 연동 & 스마트워치 매핑 & 목표 3각 추적 | 412 | 4 | 보통(12) | 0/0/5 | 0 | 1 | 6(2) |
| G039 | 소셜 로그인 (카카오 / 실제 구글 OAuth 연동) | 306 | 7 | 어려움(31) | 0/1/11 | 2 | 2 | 14(4) |
| G107 | 캘린더 실시간 구독 URL 생성기 (WebCal Feed & #TASK-ES-252 HMAC 서명) | 177 | 1 | 어려움(38) | 0/0/3 | 3 | 2 | 7(5) |
| G023 | XP/레벨 시스템 | 106 | 3 | 어려움(95) | 0/0/14 | 6 | 2 | 19(14) |
| G062 | 5대 테마 온톨로지 & 경량 AI 분류기 (TASK-OG-001) | 101 | 2 | 어려움(59) | 0/0/18 | 0 | 0 | 26(12) |
| G098 | [#TASK-ES-299] 팀 목표 댓글 작성 및 전송 직통 헬퍼 & 전역 이벤트 위임 (먹통 방어 100%) | 92 | 0 | 빈 구획(28) | 0/2/11 | 3 | 0 | 5(1) |
| G001 | [#TASK-ES-354 CORE-07] 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL.md) | 79 | 0 | 이음매(옮기지 않음)(74) | 1/0/50 | 1 | 0 | 20(6) |
| G071 | 음성 체크인 (Web Speech API) | 71 | 0 | 빈 구획(7) | 0/0/2 | 1 | 0 | 2(1) |

## 3. 권장 순서 (안전한 것부터, 상위 30)

같은 점수면 큰 묶음 먼저(한 번 옮겨 많이 줄인다). 로드 중 문이 있는 묶음은 함수만 옮기고 그 문은 원래 자리에 남긴다(MODULE-SPLIT-PROTOCOL 3절).

| 순서 | 묶음 | 제목 | 줄 | 점수 | 근거(점수가 생긴 곳) |
|--:|---|---|--:|--:|---|
| 1 | G068 | 1순위 대표 목표 AI 초집중 모드 (Focus Auto-Pilot) | 9 | 0 | 없음 |
| 2 | G029 | [78 / 89] 데이터분석 프롬프트 백과사전 (실사용 유저 등록·피드 게시 및 도움돼요 상호작용) | 7 | 0 | 없음 |
| 3 | G109 | 소통 피드 (Supabase feed_posts, 실시간 동기화) | 6 | 0 | 없음 |
| 4 | G116 | [#TASK-ES-264] 자정(00:00 KST / 현지 표준시) 날짜 변경 감지 및 자동 동기화 워처 | 5 | 0 | 없음 |
| 5 | G089 | RENDER: TEMPLATE ENCYCLOPEDIA SUBTAB (#TASK-ES-187) | 3 | 0 | 없음 |
| 6 | G067 | 11인 외부 UI/UX 감시 및 개선팀 핵심 기능 구현 | 12 | 1 | 들어옴 1 |
| 7 | G117 | 세션 복구 및 안전 앱 진입 유틸 | 4 | 3 | 상태 읽기 1 · 로드 중 문 1 |
| 8 | G017 | 아워골 앱 환경설정 | 22 | 4 | 로드 중 문 1 · window 1 · 바깥 파일 1 |
| 9 | G096 | RENDER: 팀 목표 (팀장·매니저만 추가/수정/삭제, 팀원은 보기만) | 29 | 5 | 상태 읽기 4 · 들어옴 1 |
| 10 | G043 | P0: 비밀번호 찾기 (이메일 재설정 링크 발송) | 10 | 5 | 상태 읽기 1 · 로드 중 문 2 |
| 11 | G047 | 앱 활용 가이드 다시보기 | 4 | 5 | 상태 읽기 1 · 로드 중 문 2 |
| 12 | G056 | 목표 일정 리스케일링 | 45 | 6 | 상태 읽기 1 · FN_NAMES 1 |
| 13 | G069 | 원터치 퀵 루틴 칩 | 11 | 7 | 로드 중 문 2 · 시험지(index 단독) 1 |
| 14 | G005 | [#TASK-ES-453] 인라인 스크립트 세포화 P1 이음매 3 — 목표 종합상황 AI 요약 새로 고침 ( | 8 | 7 | 상태 읽기 2 · 로드 중 문 1 · 시험지(index 단독) 1 |
| 15 | G042 | Goal category templates | 11 | 8 | 상태 읽기 2 · 로드 중 문 3 |
| 16 | G048 | 1:1 고객 문의 / 버그 제보 (#TASK-ES-178) | 5 | 8 | 상태 읽기 2 · 로드 중 문 3 |
| 17 | G008 | [#TASK-ES-444] 인라인 스크립트 세포화 P1 이음매 2 — 일정 배경·잠금화면 라이브, 소통 창· | 33 | 10 | 상태 읽기 8 · 로드 중 문 1 |
| 18 | G110 | 전역 공유 팀 로더 & 렌더링 (#TASK-ES-133) | 10 | 10 | 상태 읽기 1 · 로드 중 문 2 · window 2 · 바깥 파일 3 |
| 19 | G111 | 통합 딥링크 게이트웨이 & 게스트 소프트 뷰어 3종 (js/viral-sharing.js 위임) | 10 | 10 | 상태 읽기 2 · 로드 중 문 2 · window 2 · 바깥 파일 2 |
| 20 | G052 | 최초 로그인 활용가이드 — 4대 탭 무블러(Zero Blur) 투명 라이브 프리뷰 융합 | 8 | 10 | 상태 읽기 1 · 로드 중 문 3 · window 1 · 바깥 파일 2 |
| 21 | G112 | 마니또 실 유저 익명 응원 연동 (#TASK-ES-133, #TASK-ES-145) | 8 | 10 | 상태 읽기 1 · 로드 중 문 1 · window 1 · 바깥 파일 6 |
| 22 | G074 | [#TASK-ES-225] [생각 메모장 95번] Gemini API 분당 쿼터(Rate Limit 429) | 11 | 11 | 상태 읽기 3 · 로드 중 문 2 · window 2 · 바깥 파일 2 |
| 23 | G025 | #TASK-ES-165: 앱 진입 아바타 인사 팝업 (화면 절반 크기 & 시간대별 멘트) | 8 | 11 | 상태 읽기 2 · 로드 중 문 2 · window 2 · 바깥 파일 3 |
| 24 | G046 | [#TASK-ES-160, #TASK-ES-166, #TASK-ES-180] 각 탭 200% 활용법 및 실제 | 7 | 11 | 상태 읽기 2 · 로드 중 문 3 · window 1 · 바깥 파일 2 |
| 25 | G102 | CSV / 엑셀 양방향 연동 & 스마트워치 매핑 & 목표 3각 추적 | 412 | 12 | 상태 읽기 5 · 들어옴 1 · 시험지(index 단독) 2 |
| 26 | G012 | [#TASK-ES-446] 인라인 스크립트 세포화 P2-1 이음매 (docs/architecture/INLI | 24 | 12 | 상태 읽기 10 · 로드 중 문 1 |
| 27 | G072 | 사진 인증 & 뷰어 모달 (가상유저 요청 P1) | 38 | 13 | 상태 읽기 2 · 로드 중 문 4 · 시험지(index 단독) 1 |
| 28 | G044 | P0: 회원 탈퇴 30일 유예(소프트 삭제) 복구 체크 | 8 | 14 | 상태 읽기 4 · 로드 중 문 5 |
| 29 | G073 | 체크인 입력 글자수 힌트 (#TASK-ES-367: 열 수 없던 활동 테마 선택 창·배지 제거, 승인 202 | 13 | 15 | 상태 읽기 2 · 로드 중 문 5 · 시험지(index 단독) 1 |
| 30 | G037 | 2계정 상호작용 테스트 (테스터 B 직통 입장: #TASK-ES-169) | 8 | 15 | 상태 읽기 3 · 로드 중 문 5 · window 1 · 바깥 파일 1 |

## 4. 전체 묶음 표

| 묶음 | 줄 범위 | 줄 | 제목 | 함수 | 변수 | 난이도(점수) | 상태 쓰기 · 변경 · 읽기 | window | 처리기(add/on) | 로드 중 문 | 인라인 처리기 | 들어옴/나감 묶음 | 바깥 파일 | 시험지(index 단독) |
|---|---|--:|---|--:|--:|---|---|--:|---|--:|--:|---|--:|---|
| G000 | 2253~2255 | 3 | (IIFE 머리 — "use strict" 와 첫 구획 앞) | 0 | 0 | 빈 구획(66) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 66(22) |
| G001 | 2256~2334 | 79 | [#TASK-ES-354 CORE-07] 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTO | 0 | 19 | 이음매(옮기지 않음)(74) | 1 · 0 · 50 | 0 | 0/0 | 1 | 0 | 0/1 | 0 | 20(6) |
| G002 | 2335~2376 | 42 | [#TASK-ES-358] 기록 탭 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL | 0 | 4 | 이음매(옮기지 않음)(71) | 1 · 0 · 29 | 0 | 0/0 | 1 | 0 | 0/2 | 0 | 48(12) |
| G003 | 2377~2405 | 29 | [#TASK-ES-360] 일정 탭 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL | 0 | 3 | 이음매(옮기지 않음)(30) | 0 · 0 · 19 | 0 | 0/0 | 1 | 0 | 0/1 | 0 | 9(3) |
| G004 | 2406~2447 | 42 | [#TASK-ES-370] 목표 탭 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL | 0 | 2 | 이음매(옮기지 않음)(71) | 0 · 0 · 33 | 0 | 0/0 | 1 | 0 | 0/1 | 0 | 45(12) |
| G005 | 2448~2455 | 8 | [#TASK-ES-453] 인라인 스크립트 세포화 P1 이음매 3 — 목표 종합상황 AI 요약 새로 고침 ( | 0 | 1 | 쉬움(7) | 0 · 0 · 2 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 3(1) |
| G006 | 2456~2471 | 16 | [#TASK-ES-375] 목표 탭 모듈 이음매 2차 (docs/specs/MODULE-SPLIT-PROTO | 0 | 3 | 이음매(옮기지 않음)(10) | 0 · 0 · 8 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 1(0) |
| G007 | 2472~2493 | 22 | [#TASK-ES-379] 소통 탭 모듈 이음매 1차 (docs/specs/MODULE-SPLIT-PROTO | 0 | 7 | 이음매(옮기지 않음)(14) | 0 · 0 · 9 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 7(1) |
| G008 | 2494~2526 | 33 | [#TASK-ES-444] 인라인 스크립트 세포화 P1 이음매 2 — 일정 배경·잠금화면 라이브, 소통 창· | 0 | 23 | 보통(10) | 0 · 0 · 8 | 0 | 0/0 | 1 | 0 | 0/1 | 0 | 5(0) |
| G009 | 2527~2538 | 12 | [#TASK-ES-423] 인라인 스크립트 세포화 1차 이음매 (docs/architecture/INLINE | 0 | 5 | 이음매(옮기지 않음)(5) | 0 · 0 · 3 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 3(0) |
| G010 | 2539~3220 | 682 | [#TASK-ES-432] 인라인 스크립트 세포화 2차 이음매 (docs/architecture/INLINE | 0 | 337 | 어려움(378) | 22 · 0 · 124 | 0 | 0/0 | 32 | 0 | 0/6 | 0 | 83(34) |
| G011 | 3221~3254 | 34 | [#TASK-ES-436] 인라인 스크립트 세포화 P1 이음매 1 — 목표 AI·일정 설정, 기록 AI 피드 | 0 | 15 | 보통(22) | 0 · 0 · 14 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 4(2) |
| G012 | 3255~3278 | 24 | [#TASK-ES-446] 인라인 스크립트 세포화 P2-1 이음매 (docs/architecture/INLI | 0 | 9 | 보통(12) | 0 · 0 · 10 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 2(0) |
| G013 | 3279~3343 | 65 | [#TASK-ES-448] 인라인 스크립트 세포화 P2-2 이음매 (docs/architecture/INLI | 0 | 43 | 보통(25) | 1 · 0 · 11 | 0 | 0/0 | 2 | 0 | 0/0 | 0 | 10(2) |
| G014 | 3344~3379 | 36 | [#TASK-ES-437] 인라인 스크립트 세포화 P0 이음매 (docs/architecture/INLINE | 0 | 20 | 보통(24) | 1 · 0 · 12 | 0 | 0/0 | 1 | 0 | 0/1 | 0 | 7(2) |
| G015 | 3380~3417 | 38 | [#TASK-ES-442] 인라인 스크립트 세포화 P0 이음매 (docs/architecture/INLINE | 0 | 20 | 어려움(28) | 2 · 0 · 15 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 10(1) |
| G016 | 3418~3427 | 10 | Supabase | 0 | 4 | 보통(16) | 0 · 0 · 2 | 1 | 0/0 | 2 | 0 | 0/0 | 6 | 3(1) |
| G017 | 3428~3449 | 22 | 아워골 앱 환경설정 | 0 | 1 | 쉬움(4) | 0 · 0 · 0 | 1 | 0/0 | 1 | 0 | 0/0 | 1 | 1(0) |
| G018 | 3450~3457 | 8 | [#TASK-ES-264] 표준 시간대(한국 KST 00:00, 타 국가는 해당 국가 표준시 00:00) 기 | 0 | 0 | 빈 구획(11) | 0 · 0 · 2 | 2 | 0/0 | 1 | 0 | 0/0 | 5 | 2(0) |
| G019 | 3458~3472 | 15 | Confetti | 0 | 1 | 어려움(224) | 0 · 0 · 2 | 3 | 0/0 | 2 | 0 | 0/0 | 212 | 2(1) |
| G020 | 3473~3488 | 16 | 8대 화면 스타일 (테마) 정의 | 0 | 1 | 보통(21) | 0 · 0 · 1 | 2 | 0/0 | 1 | 0 | 0/0 | 4 | 10(4) |
| G021 | 3489~3492 | 4 | 가상유저 개선 10대 핵심 헬퍼 함수 | 0 | 0 | 빈 구획(46) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 42 | 1(0) |
| G022 | 3493~3505 | 13 | [#TASK-ES-345 CAL-02] 구글 캘린더 토큰·일정 캐시 계정 격리 | 0 | 0 | 빈 구획(19) | 0 · 0 · 3 | 3 | 0/0 | 1 | 0 | 0/0 | 8 | 2(1) |
| G023 | 3506~3611 | 106 | XP/레벨 시스템 | 3 | 0 | 어려움(95) | 0 · 0 · 14 | 6 | 0/2 | 6 | 0 | 2/1 | 19 | 19(14) |
| G024 | 3612~3633 | 22 | [#TASK-ES-150] 아바타 레벨업 대형 팝업 & 성장 성향 키워드 | 0 | 6 | 어려움(41) | 0 · 0 · 6 | 2 | 2/0 | 14 | 0 | 0/0 | 2 | 3(1) |
| G025 | 3634~3641 | 8 | #TASK-ES-165: 앱 진입 아바타 인사 팝업 (화면 절반 크기 & 시간대별 멘트) | 0 | 1 | 보통(11) | 0 · 0 · 2 | 2 | 0/0 | 2 | 0 | 0/0 | 3 | 1(0) |
| G026 | 3642~3655 | 14 | 뱃지 컬렉션 (명예의 전당) | 0 | 1 | 어려움(268) | 0 · 0 · 4 | 3 | 0/0 | 4 | 0 | 0/0 | 247 | 5(2) |
| G027 | 3656~3659 | 4 | [70] 다른 모든 기기 원격 로그아웃 전 로그인 기기 목록 확인 모달 | 0 | 0 | 빈 구획(8) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 4 | 1(0) |
| G028 | 3660~3676 | 17 | [71] 앱 잠금 PIN (이 기기) — 설정·해제·앱 진입 확인 | 0 | 0 | 빈 구획(17) | 0 · 0 · 5 | 5 | 0/0 | 2 | 0 | 0/0 | 3 | 0(0) |
| G029 | 3677~3683 | 7 | [78 / 89] 데이터분석 프롬프트 백과사전 (실사용 유저 등록·피드 게시 및 도움돼요 상호작용) | 0 | 2 | 쉬움(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 2(0) |
| G030 | 3684~3688 | 5 | [80] 템플릿백과사전 1초 자동이식 선택 연동 및 로드맵-목표상태 동기화 | 0 | 0 | 빈 구획(6) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 2 | 0(0) |
| G031 | 3689~3692 | 4 | [82] 팀 목표 내 '팀 연계 개인목표' 생성 모달 | 0 | 0 | 빈 구획(7) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 3 | 1(0) |
| G032 | 3693~3697 | 5 | [83] 팀원 초대 시 '아워골 동반자 초대하기' 인앱 초대·참가 기능 | 0 | 0 | 빈 구획(9) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 5 | 1(0) |
| G033 | 3698~3701 | 4 | [88] 오늘의 3초 체크인 목표 버튼 선택 시 플레이스홀더(백그라운드 가이드) 예시 문구 렌더링 | 0 | 0 | 빈 구획(6) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 2 | 0(0) |
| G034 | 3702~3714 | 13 | [#TASK-UIUX-PHASE3-HOME-COCKPIT] 홈 1초 조망 ↔ 무저항 체크인 콕핏 8대 과업 | 0 | 0 | 빈 구획(160) | 0 · 0 · 5 | 6 | 0/0 | 5 | 0 | 0/0 | 139 | 0(0) |
| G035 | 3715~3715 | 1 | Landing | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G036 | 3716~3727 | 12 | [#TASK-ES-222] [생각 메모장 92번] 카카오톡 인앱 브라우저 감지 및 Android Chrome | 0 | 2 | 보통(24) | 0 · 0 · 5 | 2 | 0/0 | 8 | 0 | 0/0 | 1 | 1(0) |
| G037 | 3728~3735 | 8 | 2계정 상호작용 테스트 (테스터 B 직통 입장: #TASK-ES-169) | 0 | 2 | 보통(15) | 0 · 0 · 3 | 1 | 0/0 | 5 | 0 | 0/0 | 1 | 1(0) |
| G038 | 3736~3744 | 9 | [#TASK-ES-223] [생각 메모장 93번] 개발 디버그 버튼 프로덕션 완전 소거 및 로컬/디버그 격리 | 0 | 0 | 빈 구획(10) | 0 · 0 · 1 | 1 | 1/0 | 2 | 0 | 0/0 | 1 | 1(1) |
| G039 | 3745~4050 | 306 | 소셜 로그인 (카카오 / 실제 구글 OAuth 연동) | 7 | 2 | 어려움(31) | 0 · 1 · 11 | 0 | 2/7 | 2 | 0 | 2/2 | 0 | 14(4) |
| G040 | 4051~4055 | 5 | [#TASK-ES-224] [생각 메모장 94번] 게스트(둘러보기) 3회 기록 시 안전 백업 넛지 및 카카오 | 0 | 0 | 빈 구획(11) | 0 · 0 · 2 | 2 | 0/0 | 2 | 0 | 0/0 | 3 | 0(0) |
| G041 | 4056~4059 | 4 | [#TASK-ES-224] [생각 메모장 94번] 카카오/소셜/일반 로그인 시 게스트 데이터 100% 무손실 | 0 | 0 | 빈 구획(9) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 5 | 0(0) |
| G042 | 4060~4070 | 11 | Goal category templates | 0 | 1 | 쉬움(8) | 0 · 0 · 2 | 0 | 0/0 | 3 | 0 | 0/0 | 0 | 1(0) |
| G043 | 4071~4080 | 10 | P0: 비밀번호 찾기 (이메일 재설정 링크 발송) | 0 | 1 | 쉬움(5) | 0 · 0 · 1 | 0 | 1/0 | 2 | 0 | 0/0 | 0 | 1(0) |
| G044 | 4081~4088 | 8 | P0: 회원 탈퇴 30일 유예(소프트 삭제) 복구 체크 | 0 | 1 | 보통(14) | 0 · 0 · 4 | 0 | 0/0 | 5 | 0 | 0/0 | 0 | 1(0) |
| G045 | 4089~4092 | 4 | 회원 탈퇴 전용 안내 모달 및 법적책임·데이터분실 사전 안내 (#TASK-ES-158) | 0 | 0 | 빈 구획(6) | 0 · 0 · 1 | 0 | 1/0 | 1 | 0 | 0/0 | 0 | 2(1) |
| G046 | 4093~4099 | 7 | [#TASK-ES-160, #TASK-ES-166, #TASK-ES-180] 각 탭 200% 활용법 및 실제 | 0 | 1 | 보통(11) | 0 · 0 · 2 | 1 | 0/0 | 3 | 0 | 0/0 | 2 | 1(0) |
| G047 | 4100~4103 | 4 | 앱 활용 가이드 다시보기 | 0 | 1 | 쉬움(5) | 0 · 0 · 1 | 0 | 0/0 | 2 | 0 | 0/0 | 0 | 1(0) |
| G048 | 4104~4108 | 5 | 1:1 고객 문의 / 버그 제보 (#TASK-ES-178) | 0 | 1 | 쉬움(8) | 0 · 0 · 2 | 0 | 0/0 | 3 | 0 | 0/0 | 0 | 0(0) |
| G049 | 4109~4128 | 20 | 이용약관 / 개인정보처리방침 열람 리스너 | 0 | 0 | 빈 구획(23) | 0 · 0 · 7 | 0 | 2/0 | 8 | 0 | 0/0 | 0 | 1(0) |
| G050 | 4129~4132 | 4 | Onboarding (first-time, after signup) — 16종 동물 아바타 & 직관적 안착  | 0 | 0 | 빈 구획(7) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 3 | 0(0) |
| G051 | 4133~4142 | 10 | 3단계: 첫 체크인 튜토리얼 가이드 및 축하 연출 | 0 | 0 | 빈 구획(14) | 0 · 0 · 3 | 3 | 0/0 | 3 | 0 | 0/0 | 2 | 0(0) |
| G052 | 4143~4150 | 8 | 최초 로그인 활용가이드 — 4대 탭 무블러(Zero Blur) 투명 라이브 프리뷰 융합 | 0 | 2 | 보통(10) | 0 · 0 · 1 | 1 | 0/0 | 3 | 0 | 0/0 | 2 | 2(0) |
| G053 | 4151~4158 | 8 | 조선소 블록 레지스트리 6대 메가블록 초기화 (헌법 제3조 제9항) | 0 | 0 | 빈 구획(64) | 0 · 0 · 3 | 2 | 0/0 | 3 | 0 | 0/0 | 53 | 0(0) |
| G054 | 4159~4225 | 67 | Modal helper & Android Hardware Back Handler | 1 | 2 | 어려움(172) | 0 · 0 · 4 | 5 | 0/2 | 2 | 0 | 12/0 | 135 | 7(4) |
| G055 | 4226~4234 | 9 | 이용약관 & 개인정보처리방침 모달 | 0 | 0 | 빈 구획(5) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 1 | 1(0) |
| G056 | 4235~4279 | 45 | 목표 일정 리스케일링 | 1 | 0 | 쉬움(6) | 0 · 0 · 1 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G057 | 4280~4297 | 18 | 프로필 | 0 | 0 | 빈 구획(27) | 0 · 0 · 5 | 4 | 0/0 | 5 | 0 | 0/0 | 8 | 2(0) |
| G058 | 4298~4298 | 1 | 구글 캘린더 연동 | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G059 | 4299~4344 | 46 | [#TASK-ES-153] 전역 7일 유예 통합 휴지통 (Recycle Bin) 시스템 | 1 | 1 | 어려움(32) | 0 · 1 · 8 | 6 | 0/0 | 1 | 0 | 2/0 | 9 | 3(1) |
| G060 | 4345~4365 | 21 | [#TASK-ES-153 & #TASK-ES-155] 캘린더 일자별 배경 사진 지정 모달 | 0 | 0 | 빈 구획(16) | 0 · 0 · 2 | 2 | 0/0 | 2 | 0 | 0/0 | 8 | 1(0) |
| G061 | 4366~4387 | 22 | [#TASK-ES-181 & #TASK-ES-182] 폰 잠금화면에서 바로 보기 통합 허브 모달 | 0 | 0 | 빈 구획(79) | 0 · 0 · 13 | 13 | 0/0 | 1 | 0 | 0/0 | 51 | 1(0) |
| G062 | 4388~4488 | 101 | 5대 테마 온톨로지 & 경량 AI 분류기 (TASK-OG-001) | 2 | 0 | 어려움(59) | 0 · 0 · 18 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 26(12) |
| G063 | 4489~4494 | 6 | Adaptive UX Mode | 0 | 0 | 빈 구획(5) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 1 | 0(0) |
| G064 | 4495~4501 | 7 | Social Crew Pacing (#TASK-ES-228) | 0 | 0 | 빈 구획(18) | 0 · 0 · 4 | 4 | 0/0 | 4 | 0 | 0/0 | 2 | 0(0) |
| G065 | 4502~4509 | 8 | UX Telemetry (Hesitation & Rage Tap) | 0 | 0 | 빈 구획(15) | 0 · 0 · 3 | 2 | 0/0 | 3 | 0 | 0/0 | 4 | 0(0) |
| G066 | 4510~4521 | 12 | iOS 사파리 홈 화면 추가 안내 배너 & 실시간 알림 가이드 (#TASK-ES-234) | 0 | 0 | 빈 구획(5) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 1 | 2(0) |
| G067 | 4522~4533 | 12 | 11인 외부 UI/UX 감시 및 개선팀 핵심 기능 구현 | 1 | 0 | 쉬움(1) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 1/0 | 0 | 1(0) |
| G068 | 4534~4542 | 9 | 1순위 대표 목표 AI 초집중 모드 (Focus Auto-Pilot) | 0 | 3 | 쉬움(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G069 | 4543~4553 | 11 | 원터치 퀵 루틴 칩 | 0 | 1 | 쉬움(7) | 0 · 0 · 0 | 0 | 1/0 | 2 | 0 | 0/0 | 0 | 2(1) |
| G070 | 4554~4557 | 4 | 🎙️ 마이크 권한 거부 상태 자가 진단 및 1초 권한 허용 모달 (#TASK-ES-227) | 0 | 0 | 빈 구획(6) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 2 | 1(0) |
| G071 | 4558~4628 | 71 | 음성 체크인 (Web Speech API) | 0 | 0 | 빈 구획(7) | 0 · 0 · 2 | 0 | 6/0 | 1 | 0 | 0/0 | 0 | 2(1) |
| G072 | 4629~4666 | 38 | 사진 인증 & 뷰어 모달 (가상유저 요청 P1) | 0 | 4 | 보통(13) | 0 · 0 · 2 | 0 | 2/2 | 4 | 0 | 0/0 | 0 | 2(1) |
| G073 | 4667~4679 | 13 | 체크인 입력 글자수 힌트 (#TASK-ES-367: 열 수 없던 활동 테마 선택 창·배지 제거, 승인 202 | 0 | 3 | 보통(15) | 0 · 0 · 2 | 0 | 0/0 | 5 | 0 | 0/0 | 0 | 3(1) |
| G074 | 4680~4690 | 11 | [#TASK-ES-225] [생각 메모장 95번] Gemini API 분당 쿼터(Rate Limit 429) | 0 | 1 | 보통(11) | 0 · 0 · 3 | 2 | 0/0 | 2 | 0 | 0/0 | 2 | 1(0) |
| G075 | 4691~4707 | 17 | 맞춤 피드백 봇 설정 | 0 | 0 | 빈 구획(31) | 0 · 0 · 6 | 5 | 3/0 | 7 | 0 | 0/0 | 3 | 2(1) |
| G076 | 4708~4711 | 4 | 목표 & 기록 선택 피드 공유 모달 (전면 고도화) | 0 | 0 | 빈 구획(8) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 4 | 1(0) |
| G077 | 4712~4717 | 6 | [#TASK-ES-301] 피드 게시 모달 내 '미리보기' 토글 직통 헬퍼 | 0 | 0 | 빈 구획(7) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 3 | 1(0) |
| G078 | 4718~4724 | 7 | 외부 데이터 불러오기 (mock) | 0 | 2 | 보통(16) | 0 · 0 · 3 | 0 | 1/0 | 5 | 0 | 0/0 | 0 | 2(1) |
| G079 | 4725~4762 | 38 | [#TASK-ES-174] 목표 템플릿 백과사전 전체화면 팝업 및 상호작용 | 0 | 7 | 어려움(64) | 0 · 0 · 10 | 9 | 3/0 | 20 | 0 | 0/0 | 5 | 3(0) |
| G080 | 4763~4793 | 31 | [#TASK-ES-146] 아워골 평가해주기 90% 팝업 | 0 | 5 | 어려움(46) | 0 · 0 · 8 | 3 | 3/1 | 15 | 0 | 0/0 | 2 | 3(1) |
| G081 | 4794~4803 | 10 | New goal modal | 0 | 0 | 빈 구획(11) | 0 · 0 · 2 | 1 | 0/0 | 2 | 0 | 0/0 | 4 | 2(0) |
| G082 | 4804~4804 | 1 | 참고자료 (유튜브/영상, 이미지, 텍스트 메모, 웹링크) | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G083 | 4805~4813 | 9 | 참고자료 (유튜브/영상, 이미지, 텍스트 메모, 웹링크) | 0 | 0 | 빈 구획(21) | 0 · 0 · 4 | 4 | 0/0 | 1 | 0 | 0/0 | 5 | 3(2) |
| G084 | 4814~4846 | 33 | 목표 AI 생성 전체 템플릿 양식 및 세부 항목 미리보기 (Req 5) | 0 | 1 | 보통(20) | 0 · 0 · 4 | 1 | 3/0 | 7 | 0 | 0/0 | 1 | 1(0) |
| G085 | 4847~4856 | 10 | [#TASK-ES-264] 오늘의 미션 및 AI 피드백 조건부 호출 최적화 | 0 | 0 | 빈 구획(8) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 1 | 3(1) |
| G086 | 4857~4868 | 12 | 목표 탭 3계층 일정설정 / 디데이·기간 표시 및 캘린더 연동 (#TASK-ES-259, 메모장 03항, # | 0 | 0 | 빈 구획(27) | 0 · 0 · 7 | 7 | 0/0 | 1 | 0 | 0/0 | 8 | 2(1) |
| G087 | 4869~4875 | 7 | [#TASK-ES-220] [생각 메모장 91번] 교대근무자 가변형 루틴 프리셋 & 자동 스케줄러 | 0 | 0 | 빈 구획(18) | 0 · 0 · 4 | 4 | 0/0 | 4 | 0 | 0/0 | 2 | 1(0) |
| G088 | 4876~4883 | 8 | [#TASK-ES-172] [27] 목표 탭: 데일리 루틴 서브탭 & 편집/상세 모달 | 0 | 0 | 빈 구획(11) | 0 · 0 · 2 | 2 | 0/0 | 1 | 0 | 0/0 | 5 | 1(0) |
| G089 | 4884~4886 | 3 | RENDER: TEMPLATE ENCYCLOPEDIA SUBTAB (#TASK-ES-187) | 0 | 2 | 쉬움(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G090 | 4887~4901 | 15 | [#TASK-ES-189] 템플릿 백과사전 3대 분류(개인·루틴·팀) 및 AI/실유저 2원화 이식 시스템 | 0 | 4 | 어려움(35) | 0 · 0 · 6 | 8 | 0/0 | 8 | 0 | 0/0 | 2 | 4(1) |
| G091 | 4902~4965 | 64 | [UI/UX 틀 개편 Phase 4] 목표 탭 노션급 데이터 관리 & 인지순행 IA (#TASK-UIUX-P | 2 | 0 | 어려움(91) | 0 · 1 · 13 | 12 | 0/0 | 11 | 2 | 0/0 | 6 | 17(11) |
| G092 | 4966~4971 | 6 | [PHASE 5] #TASK-UIUX-PHASE5-RECORDS-CALENDAR FUNCTIONS | 0 | 0 | 빈 구획(10) | 0 · 0 · 2 | 2 | 0/0 | 2 | 0 | 0/0 | 2 | 0(0) |
| G093 | 4972~4981 | 10 | [PHASE 6] #TASK-UIUX-PHASE6-COMM-SETTINGS FUNCTIONS | 0 | 0 | 빈 구획(18) | 0 · 0 · 4 | 4 | 0/0 | 4 | 0 | 0/0 | 2 | 0(0) |
| G094 | 4982~5004 | 23 | [UI/UX 프레임워크 개편 Phase 7] 모바일 하드웨어 인터랙션 & 사용성 하드닝 | 0 | 0 | 빈 구획(23) | 0 · 0 · 5 | 4 | 1/0 | 5 | 0 | 0/0 | 1 | 1(1) |
| G095 | 5005~5007 | 3 | RENDER: GOALS | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G096 | 5008~5036 | 29 | RENDER: 팀 목표 (팀장·매니저만 추가/수정/삭제, 팀원은 보기만) | 1 | 2 | 쉬움(5) | 0 · 0 · 4 | 0 | 0/0 | 0 | 0 | 1/0 | 0 | 4(0) |
| G097 | 5037~5052 | 16 | 개인 목표 200% 활용 가이드 & 템플릿 백과사전 (#TASK-ES-135) | 0 | 0 | 빈 구획(42) | 0 · 0 · 4 | 4 | 0/0 | 4 | 0 | 0/0 | 17 | 4(3) |
| G098 | 5053~5144 | 92 | [#TASK-ES-299] 팀 목표 댓글 작성 및 전송 직통 헬퍼 & 전역 이벤트 위임 (먹통 방어 100% | 0 | 0 | 빈 구획(28) | 0 · 2 · 11 | 1 | 2/0 | 3 | 0 | 0/0 | 3 | 5(1) |
| G099 | 5145~5153 | 9 | TASK-ES-307: 측정지표 다중 선택 및 동시 렌더링 엔진 | 0 | 0 | 빈 구획(10) | 0 · 0 · 2 | 2 | 0/0 | 2 | 0 | 0/0 | 2 | 3(0) |
| G100 | 5154~5167 | 14 | 5대 테마 원형 라이프 밸런스 휠 (SVG Pie Chart) | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G101 | 5168~5176 | 9 | ⏱️ 인앱 인터벌 타이머 & 스톱워치 위젯 (In-Table Stopwatch) | 0 | 0 | 빈 구획(8) | 0 · 0 · 2 | 2 | 0/0 | 1 | 0 | 0/0 | 2 | 3(0) |
| G102 | 5177~5588 | 412 | CSV / 엑셀 양방향 연동 & 스마트워치 매핑 & 목표 3각 추적 | 4 | 2 | 보통(12) | 0 · 0 · 5 | 0 | 0/13 | 0 | 0 | 1/1 | 0 | 6(2) |
| G103 | 5589~6910 | 1322 | 템플릿 마켓 · 복제 · 전문 템플릿 기록 (TASK-ES-013) | 5 | 0 | 어려움(104) | 0 · 1 · 50 | 0 | 3/49 | 1 | 0 | 2/4 | 0 | 35(16) |
| G104 | 6911~6946 | 36 | [#TASK-ES-358] 기록 탭 렌더 → js/tabs/records/period-ai-card.js · | 0 | 0 | 빈 구획(69) | 0 · 1 · 11 | 7 | 0/0 | 2 | 0 | 0/0 | 45 | 5(0) |
| G105 | 6947~6960 | 14 | 위클리 리캡 카드 (스포티파이 랩드 스타일, 공유 캔버스 인프라 재사용) | 0 | 2 | 보통(25) | 0 · 0 · 7 | 0 | 3/0 | 9 | 0 | 0/0 | 0 | 1(0) |
| G106 | 6961~6961 | 1 | RFC 5545 표준 iCalendar (.ics) 생성 순수 함수 (TASK-BG-11) | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G107 | 6962~7138 | 177 | 캘린더 실시간 구독 URL 생성기 (WebCal Feed & #TASK-ES-252 HMAC 서명) | 1 | 2 | 어려움(38) | 0 · 0 · 3 | 2 | 1/0 | 3 | 0 | 2/0 | 10 | 7(5) |
| G108 | 7139~7187 | 49 | 크리에이터 템플릿 (#TASK-ES-315, 64: 구형 창 영구 제거 및 무해화) | 2 | 0 | 어려움(55) | 0 · 1 · 10 | 1 | 0/0 | 1 | 0 | 2/0 | 5 | 19(11) |
| G109 | 7188~7193 | 6 | 소통 피드 (Supabase feed_posts, 실시간 동기화) | 0 | 1 | 쉬움(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 2(0) |
| G110 | 7194~7203 | 10 | 전역 공유 팀 로더 & 렌더링 (#TASK-ES-133) | 0 | 1 | 보통(10) | 0 · 0 · 1 | 2 | 0/0 | 2 | 0 | 0/0 | 3 | 1(0) |
| G111 | 7204~7213 | 10 | 통합 딥링크 게이트웨이 & 게스트 소프트 뷰어 3종 (js/viral-sharing.js 위임) | 0 | 1 | 보통(10) | 0 · 0 · 2 | 2 | 0/0 | 2 | 0 | 0/0 | 2 | 1(0) |
| G112 | 7214~7221 | 8 | 마니또 실 유저 익명 응원 연동 (#TASK-ES-133, #TASK-ES-145) | 0 | 3 | 보통(10) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 6 | 1(0) |
| G113 | 7222~7240 | 19 | DM & 동반자 소통 시스템 (TASK-ES-105) | 1 | 0 | 보통(17) | 0 · 0 · 3 | 2 | 0/0 | 3 | 0 | 1/0 | 5 | 1(0) |
| G114 | 7241~7255 | 15 | [#TASK-ES-354 CORE-07·SET-07] 설정 탭 렌더 → js/tabs/settings/ren | 0 | 0 | 이음매(옮기지 않음)(22) | 0 · 0 · 5 | 3 | 0/0 | 5 | 0 | 0/0 | 4 | 3(0) |
| G115 | 7256~7261 | 6 | 4대 연계 뷰 원자적 동시 전파 디스패처 (헌법 제1조 제4항 제5호 & 제15조 제6항 제3호) | 0 | 0 | 빈 구획(33) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 29 | 0(0) |
| G116 | 7262~7266 | 5 | [#TASK-ES-264] 자정(00:00 KST / 현지 표준시) 날짜 변경 감지 및 자동 동기화 워처 | 0 | 1 | 쉬움(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 2(0) |
| G117 | 7267~7270 | 4 | 세션 복구 및 안전 앱 진입 유틸 | 0 | 1 | 쉬움(3) | 0 · 0 · 1 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 2(0) |
| G118 | 7271~7285 | 15 | #TASK-AUTH-P0-SAFETY: 로그인/계정 보안 패키지 모듈 연결 | 0 | 0 | 빈 구획(12) | 0 · 0 · 8 | 0 | 0/0 | 2 | 0 | 0/1 | 0 | 0(0) |
| G119 | 7286~7299 | 14 | KF-7 #TASK-ES-014: 반응 4종 모듈(js/reactions.js)에 앱 핸들 연결 | 0 | 0 | 빈 구획(15) | 0 · 0 · 10 | 0 | 0/0 | 1 | 0 | 0/1 | 0 | 4(1) |
| G120 | 7300~7304 | 5 | KF-4 #TASK-ES-018: 카테고리별 도움이 된 글 슬롯 모듈(js/top-helpful.js) | 0 | 0 | 빈 구획(3) | 0 · 0 · 1 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 1(0) |
| G121 | 7305~7313 | 9 | KF-5 #TASK-ES-016: 도움돼요 이유 모듈(js/helpful-reason.js)에 앱 핸들 연결 | 0 | 0 | 빈 구획(12) | 0 · 0 · 7 | 0 | 0/0 | 1 | 0 | 0/1 | 0 | 3(1) |
| G122 | 7314~7321 | 8 | #TASK-ES-105: 팀 초대 및 소통/DM/동반자 모듈(js/team-invite-comm.js) 연결 | 0 | 0 | 빈 구획(23) | 0 · 0 · 12 | 0 | 0/0 | 1 | 0 | 0/2 | 0 | 8(3) |
| G123 | 7322~7330 | 9 | #TASK-ES-105: 팀 연계 개인목표 및 상호 체크 모듈(js/team-linked-goals.js)  | 0 | 0 | 빈 구획(31) | 0 · 0 · 18 | 0 | 0/0 | 2 | 0 | 0/1 | 0 | 5(3) |
| G124 | 7331~7335 | 5 | KF-2 #TASK-ES-017: 템플릿 복제 크레딧 모듈(js/template-credit.js)에 앱 핸 | 0 | 0 | 빈 구획(5) | 0 · 0 · 3 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 1(0) |
| G125 | 7336~7378 | 43 | PWA: Service Worker 등록 및 자동 업데이트 감지 (#TASK-ES-118) | 0 | 0 | 빈 구획(238) | 0 · 0 · 11 | 8 | 5/0 | 10 | 0 | 0/1 | 196 | 4(1) |

## 5. 묶음별 의존 상세 (옮길 대상만, 권장 순서)

### G068 1순위 대표 목표 AI 초집중 모드 (Focus Auto-Pilot)

- 4534~4542줄(9줄) · 쉬움(0)
- 함수(0): 없음
- 변수(3): focusTimerInterval, focusTimerRunning, focusTimerSeconds
- 시험지 글자 의존: scripts/smoke-test.js

### G029 [78 / 89] 데이터분석 프롬프트 백과사전 (실사용 유저 등록·피드 게시 및 도움돼요 상호작용)

- 3677~3683줄(7줄) · 쉬움(0)
- 함수(0): 없음
- 변수(2): _promptEncyclopediaOpen, _promptTabState
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js

### G109 소통 피드 (Supabase feed_posts, 실시간 동기화)

- 7188~7193줄(6줄) · 쉬움(0)
- 함수(0): 없음
- 변수(1): FEED_POSTS_CACHE
- 시험지 글자 의존: scripts/smoke-test.js, tests/guest-null-client-es377.test.js

### G116 [#TASK-ES-264] 자정(00:00 KST / 현지 표준시) 날짜 변경 감지 및 자동 동기화 워처

- 7262~7266줄(5줄) · 쉬움(0)
- 함수(0): 없음
- 변수(1): _lastObservedDateKey
- 시험지 글자 의존: scripts/smoke-test.js, tests/ai-conditional-call-optimization.test.js

### G089 RENDER: TEMPLATE ENCYCLOPEDIA SUBTAB (#TASK-ES-187)

- 4884~4886줄(3줄) · 쉬움(0)
- 함수(0): 없음
- 변수(2): _subtabTplCat, _subtabTplQuery

### G067 11인 외부 UI/UX 감시 및 개선팀 핵심 기능 구현

- 4522~4533줄(12줄) · 쉬움(1)
- 함수(1): announceToA11y
- 부르는 묶음(들어옴): G008×1
- 시험지 글자 의존: scripts/smoke-test.js

### G117 세션 복구 및 안전 앱 진입 유틸

- 7267~7270줄(4줄) · 쉬움(3)
- 함수(0): 없음
- 변수(1): _isEnteringApp
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindLoginRescueButtons
- 로드 중 문 1: 호출 1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js

### G017 아워골 앱 환경설정

- 3428~3449줄(22줄) · 쉬움(4)
- 함수(0): 없음
- 변수(1): OURGOAL_CONFIG
- 로드 중 문 1: IfStatement 1
- window 노출(1줄): OURGOAL_CONFIG
- 바깥 js 가 window 이름을 씀: js/streaks.js
- 시험지 글자 의존: scripts/smoke-test.js

### G096 RENDER: 팀 목표 (팀장·매니저만 추가/수정/삭제, 팀원은 보기만)

- 5008~5036줄(29줄) · 쉬움(5)
- 함수(1): setupUserSessionRealtime
- 변수(2): REALTIME_CHANNELS_SETUP, USER_SESSION_CHANNEL
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: getDeviceId, performLogout, sb, state
- 부르는 묶음(들어옴): G010×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-shipyard-modular.js, tests/core-confirm-es376.test.js, tests/guest-null-client-es377.test.js

### G043 P0: 비밀번호 찾기 (이메일 재설정 링크 발송)

- 4071~4080줄(10줄) · 쉬움(5)
- 함수(0): 없음
- 변수(1): fpBtn
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: openForgotPasswordModal
- 로드 중 문 2: var 초기값 실행 1 · IfStatement 1
- 이벤트 처리기: addEventListener 1 · on<이벤트> 대입 0
- 시험지 글자 의존: scripts/smoke-test.js

### G047 앱 활용 가이드 다시보기

- 4100~4103줄(4줄) · 쉬움(5)
- 함수(0): 없음
- 변수(1): guideBtn
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindRestartGuideButton
- 로드 중 문 2: var 초기값 실행 1 · 호출 1
- 시험지 글자 의존: scripts/smoke-test.js

### G056 목표 일정 리스케일링

- 4235~4279줄(45줄) · 쉬움(6)
- 함수(1): rescaleGoal
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: pad
- 시험지 글자 의존: scripts/smoke-test.js
- smoke-test FN_NAMES: rescaleGoal — 옮기려면 시험지 선행 PR 먼저

### G069 원터치 퀵 루틴 칩

- 4543~4553줄(11줄) · 쉬움(7)
- 함수(0): 없음
- 변수(1): qRoutineRow
- 로드 중 문 2: var 초기값 실행 1 · IfStatement 1
- 이벤트 처리기: addEventListener 1 · on<이벤트> 대입 0
- 시험지 글자 의존: scripts/smoke-test.js, tests/theme-system-v4.test.js (index.html 단독 읽기: tests/theme-system-v4.test.js)

### G005 [#TASK-ES-453] 인라인 스크립트 세포화 P1 이음매 3 — 목표 종합상황 AI 요약 새로 고침 (docs/architecture/INLINE-SCRIP

- 2448~2455줄(8줄) · 쉬움(7)
- 함수(0): 없음
- 변수(1): refreshGoalStatusSummary
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: _goalsKit, generateGoalStatusSummary
- 로드 중 문 1: 호출 1
- 시험지 글자 의존: scripts/smoke-test.js, tests/ai-conditional-call-optimization.test.js, tests/goal-ai-advice-status.test.js (index.html 단독 읽기: tests/goal-ai-advice-status.test.js)

### G042 Goal category templates

- 4060~4070줄(11줄) · 쉬움(8)
- 함수(0): 없음
- 변수(1): authTabButtons
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindAuthTabButtons, bindSignupSubmit
- 로드 중 문 3: var 초기값 실행 1 · 호출 2
- 시험지 글자 의존: scripts/smoke-test.js

### G048 1:1 고객 문의 / 버그 제보 (#TASK-ES-178)

- 4104~4108줄(5줄) · 쉬움(8)
- 함수(0): 없음
- 변수(1): footEmailEl
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindInquiryButtons, bindSupportEmailLink
- 로드 중 문 3: 호출 2 · var 초기값 실행 1

### G008 [#TASK-ES-444] 인라인 스크립트 세포화 P1 이음매 2 — 일정 배경·잠금화면 라이브, 소통 창·스토리 캔버스, 사진 인증, 목표 스타터·로컬 문장, 

- 2494~2526줄(33줄) · 보통(10)
- 함수(0): 없음
- 변수(23): _recordHesitation, buildLockScreenCardPayload, closeLockScreenLiveCard, closePwaInstallGuideModal, compressImage, confirmPwaInstall, generateMzStoryCanvas, initKeyboardShield, localNextActionSuggestion, localTodayMission, openCalendarDayBgPickerModal, openIosPwaInstallGuideModal, openPhotoViewerModal, openPwaInstallGuideModal, quickCreateStarterGoal, renderAdaptiveModeBar, renderHomeGrassSummary, renderIosPwaBanner, switchPwaOsTab, switchUxMode 외 3
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: SIM_PERSONAS, STARTER_GOAL_TEMPLATES, _calendarKit, _commKit, _goalsKit, _recordsKit, _settingsKit, _uxTelemetry
- 로드 중 문 1: 호출 1
- 부르는 대상(나감): G067×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js, tests/account-switch-isolation.test.js, tests/direct-login-guard.test.js, tests/feed-post-preview-modal.test.js

### G110 전역 공유 팀 로더 & 렌더링 (#TASK-ES-133)

- 7194~7203줄(10줄) · 보통(10)
- 함수(0): 없음
- 변수(1): SHARED_GROUPS_LOADED
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: loadSharedGroups
- 로드 중 문 2: IfStatement 2
- window 노출(2줄): SHARED_GROUPS_LOADED, loadSharedGroups
- 바깥 js 가 window 이름을 씀: js/core/app-enter.js, js/tabs/comm/shared-groups.js, js/tabs/goals/team-goals-screen.js
- 시험지 글자 의존: scripts/smoke-test.js

### G111 통합 딥링크 게이트웨이 & 게스트 소프트 뷰어 3종 (js/viral-sharing.js 위임)

- 7204~7213줄(10줄) · 보통(10)
- 함수(0): 없음
- 변수(1): checkAndHandlePeerInviteUrl
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: MANITO_WELCOME_STAMPS, handleDeepLinkRouting
- 로드 중 문 2: IfStatement 2
- window 노출(2줄): MANITO_STAMP_COOLDOWN, MANITO_WELCOME_STAMPS
- 바깥 js 가 window 이름을 씀: js/tabs/comm/manito-basics.js, js/tabs/comm/manito-real.js
- 시험지 글자 의존: scripts/smoke-test.js

### G052 최초 로그인 활용가이드 — 4대 탭 무블러(Zero Blur) 투명 라이브 프리뷰 융합

- 4143~4150줄(8줄) · 보통(10)
- 함수(0): 없음
- 변수(2): navButtons, screens
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: startFirstLoginGuide
- 로드 중 문 3: window 노출 1 · var 초기값 실행 2
- window 노출(1줄): startFirstLoginGuide
- 바깥 js 가 window 이름을 씀: js/tabs/settings/first-login-guide.js, js/tabs/settings/guide-buttons.js
- 시험지 글자 의존: scripts/smoke-test.js, tests/hidden-entry-guard.test.js

### G112 마니또 실 유저 익명 응원 연동 (#TASK-ES-133, #TASK-ES-145)

- 7214~7221줄(8줄) · 보통(10)
- 함수(0): 없음
- 변수(3): MANITO_SERVER_LOADED, REAL_MANITO_INBOX_CACHE, REAL_MANITO_PARTNERS_CACHE
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: isValidRealUser
- 로드 중 문 1: window 노출 1
- window 노출(1줄): isValidRealUser
- 바깥 js 가 window 이름을 씀: js/tabs/comm/manito-real.js, js/tabs/records/first-checkin-tutorial.js, js/tabs/settings/guest-backup-nudge.js, js/tabs/settings/guest-migration.js, js/team-dm-room.js, js/team-profile.js
- 시험지 글자 의존: scripts/smoke-test.js

### G074 [#TASK-ES-225] [생각 메모장 95번] Gemini API 분당 쿼터(Rate Limit 429) 방어 및 지수 백오프 큐

- 4680~4690줄(11줄) · 보통(11)
- 함수(0): 없음
- 변수(1): requestClaudeFeedback
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: GeminiQuotaDispatcher, PREMIUM_FEEDBACK_CATALOG, requestServerAIFeedback
- 로드 중 문 2: window 노출 2
- window 노출(2줄): GeminiQuotaDispatcher, PREMIUM_FEEDBACK_CATALOG
- 바깥 js 가 window 이름을 씀: js/tabs/records/ai-feedback-catalog.js, js/tabs/records/ai-feedback-providers.js
- 시험지 글자 의존: scripts/smoke-test.js

### G025 #TASK-ES-165: 앱 진입 아바타 인사 팝업 (화면 절반 크기 & 시간대별 멘트)

- 3634~3641줄(8줄) · 보통(11)
- 함수(0): 없음
- 변수(1): __avatarGreetTimer
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: closeAvatarGreetingPopup, openAvatarGreetingPopup
- 로드 중 문 2: window 노출 2
- window 노출(2줄): closeAvatarGreetingPopup, openAvatarGreetingPopup
- 바깥 js 가 window 이름을 씀: js/core/app-enter.js, js/tabs/settings/avatar-greeting.js, js/tabs/settings/sub-profile.js
- 시험지 글자 의존: scripts/smoke-test.js

### G046 [#TASK-ES-160, #TASK-ES-166, #TASK-ES-180] 각 탭 200% 활용법 및 실제 우수 사용사례 쇼케이스 (최신 기능 전면 동기화)

- 4093~4099줄(7줄) · 보통(11)
- 함수(0): 없음
- 변수(1): tabGuideBtn
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindTabGuideHubButton, openTabGuideHubModal
- 로드 중 문 3: window 노출 1 · var 초기값 실행 1 · 호출 1
- window 노출(1줄): openTabGuideHubModal
- 바깥 js 가 window 이름을 씀: js/tabs/settings/guide-buttons.js, js/tabs/settings/tab-guide.js
- 시험지 글자 의존: scripts/smoke-test.js

### G102 CSV / 엑셀 양방향 연동 & 스마트워치 매핑 & 목표 3각 추적

- 5177~5588줄(412줄) · 보통(12)
- 함수(4): compressImageForVision, decrementVisionDailyQuota, getVisionDailyQuota, openVisionTableModal
- 변수(2): CURATED_MARKET_TEMPLATES, VISION_DAILY_LIMIT
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: closeModal, escapeHtml, fmtYYMMDD, state, toast
- 이벤트 처리기: addEventListener 0 · on<이벤트> 대입 13
- 부르는 묶음(들어옴): G103×1
- 부르는 대상(나감): G054×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-all-clicks.js, tests/push-subscribe-auth-es400.test.js, tests/records-tab-rename.test.js, tests/security-audit.test.js, tests/today-mission-card-guide.test.js (index.html 단독 읽기: tests/security-audit.test.js, tests/today-mission-card-guide.test.js)

### G012 [#TASK-ES-446] 인라인 스크립트 세포화 P2-1 이음매 (docs/architecture/INLINE-SCRIPT-MAP.md 지도 · docs/spe

- 3255~3278줄(24줄) · 보통(12)
- 함수(0): 없음
- 변수(9): buildRecordCardHtml, handleConversationalRecord, openProCoachReportModal, openProNotionExportModal, pushRecordToNotion, renderAnalyticsHtml, renderRecordHeatmap, renderReportSummary, renderTrendSvgChart
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: HEATMAP_LEVELS, HEATMAP_WEEKS, _recordsKit, computeTableAnalytics, heatmapLevel, maybeShowGoalUpdateModal, openRecordModal, renderFeedbackSlot, requestAIFeedback, resizeImageToDataUrl
- 로드 중 문 1: 호출 1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js

### G072 사진 인증 & 뷰어 모달 (가상유저 요청 P1)

- 4629~4666줄(38줄) · 보통(13)
- 함수(0): 없음
- 변수(4): capturePhotoBtn, capturePhotoInput, capturePhotoPreview, pendingCapturePhoto
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: compressImage, openPhotoViewerModal
- 로드 중 문 4: var 초기값 실행 3 · IfStatement 1
- 이벤트 처리기: addEventListener 2 · on<이벤트> 대입 2
- 시험지 글자 의존: scripts/smoke-test.js, tests/today-mission-card-guide.test.js (index.html 단독 읽기: tests/today-mission-card-guide.test.js)

### G044 P0: 회원 탈퇴 30일 유예(소프트 삭제) 복구 체크

- 4081~4088줄(8줄) · 보통(14)
- 함수(0): 없음
- 변수(1): resyncBtn
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindLoginSubmit, bindLogoutButton, bindResetButton, bindResyncAccountDataButton
- 로드 중 문 5: 호출 4 · var 초기값 실행 1
- 시험지 글자 의존: scripts/smoke-test.js

### G073 체크인 입력 글자수 힌트 (#TASK-ES-367: 열 수 없던 활동 테마 선택 창·배지 제거, 승인 2026-10-04)

- 4667~4679줄(13줄) · 보통(15)
- 함수(0): 없음
- 변수(3): capInput, liveCount, liveMeta
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindCaptureLiveMeta, bindCaptureSave
- 로드 중 문 5: var 초기값 실행 3 · 호출 2
- 시험지 글자 의존: scripts/smoke-test.js, tests/module-guard.test.js, tests/theme-system-v4.test.js (index.html 단독 읽기: tests/theme-system-v4.test.js)

### G037 2계정 상호작용 테스트 (테스터 B 직통 입장: #TASK-ES-169)

- 3728~3735줄(8줄) · 보통(15)
- 함수(0): 없음
- 변수(2): authTesterBBtn, landTesterBBtn
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindAuthTesterBButton, bindLandTesterBButton, enterAsTesterB
- 로드 중 문 5: IfStatement 1 · var 초기값 실행 2 · 호출 2
- window 노출(1줄): enterAsTesterB
- 바깥 js 가 window 이름을 씀: js/tabs/settings/tester-entry.js
- 시험지 글자 의존: scripts/smoke-test.js

### G016 Supabase

- 3418~3427줄(10줄) · 보통(16)
- 함수(0): 없음
- 변수(4): SUPABASE_ANON_KEY, SUPABASE_URL, _pendingAuthSession, sb
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindSupabaseAuthStateListener, getSupabaseAuthToken
- 로드 중 문 2: 호출 1 · IfStatement 1
- window 노출(1줄): getSupabaseAuthToken
- 바깥 js 가 window 이름을 씀: js/core/profile-load.js, js/core/server-records-sync.js, js/core/supabase-auth.js, js/tabs/comm/dm-ledger.js, js/tabs/records/export-theme.js, js/tabs/settings/web-push.js
- 시험지 글자 의존: scripts/smoke-test.js, tests/logout-scope-es399.test.js, tests/security-audit.test.js (index.html 단독 읽기: tests/security-audit.test.js)

### G078 외부 데이터 불러오기 (mock)

- 4718~4724줄(7줄) · 보통(16)
- 함수(0): 없음
- 변수(2): btnShowGuide, topBtnGuide
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindImportExternalBtn, bindPersonalGuideBtn, state
- 로드 중 문 5: 호출 2 · var 초기값 실행 2 · IfStatement 1
- 이벤트 처리기: addEventListener 1 · on<이벤트> 대입 0
- 시험지 글자 의존: scripts/smoke-test.js, tests/top-page-guide-reposition.test.js (index.html 단독 읽기: tests/top-page-guide-reposition.test.js)

### G113 DM & 동반자 소통 시스템 (TASK-ES-105)

- 7222~7240줄(19줄) · 보통(17)
- 함수(1): openUserProfileModal
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindWidgetModalOpener, openCustomerInquiryModal, openItemReportModal
- 로드 중 문 3: IfStatement 2 · 호출 1
- window 노출(2줄): openCustomerInquiryModal, openItemReportModal
- 부르는 묶음(들어옴): G010×1
- 바깥 js 가 window 이름을 씀: js/core/profile-topbar.js, js/tabs/settings/sub-data.js, js/tabs/settings/sub-integrations.js, js/tabs/settings/support-inquiry-bind.js, js/tabs/settings/support-modals.js
- 시험지 글자 의존: scripts/smoke-test.js

### G084 목표 AI 생성 전체 템플릿 양식 및 세부 항목 미리보기 (Req 5)

- 4814~4846줄(33줄) · 보통(20)
- 함수(0): 없음
- 변수(1): toggleAgentBtn
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindArchivedPageSetter, bindArchivedPeriodSetter, sendGoalAgentMessage, showGoalAgentReviewStep
- 로드 중 문 7: window 노출 1 · var 초기값 실행 1 · IfStatement 1 · 호출 4
- window 노출(1줄): showGoalAgentReviewStep
- 이벤트 처리기: addEventListener 3 · on<이벤트> 대입 0
- 바깥 js 가 window 이름을 씀: js/tabs/goals/ai-agent.js
- 시험지 글자 의존: scripts/smoke-test.js

### G020 8대 화면 스타일 (테마) 정의

- 3473~3488줄(16줄) · 보통(21)
- 함수(0): 없음
- 변수(1): THEMES
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: applyTheme
- 로드 중 문 1: IfStatement 1
- window 노출(2줄): THEMES, applyTheme
- 바깥 js 가 window 이름을 씀: js/components-settings-actions.js, js/sanctuary-v3-engine.js, js/tabs/settings/sub-appearance.js, js/tabs/settings/theme-apply.js
- 시험지 글자 의존: scripts/smoke-test.js, tests/account-switch-isolation.test.js, tests/comm-ai-identity-es348.test.js, tests/direct-login-guard.test.js, tests/dm-push-auth-es397.test.js, tests/feed-ai-bot-reduction.test.js, tests/google-session-guard.test.js, tests/hidden-entry-guard.test.js 외 2 (index.html 단독 읽기: tests/comm-ai-identity-es348.test.js, tests/google-session-guard.test.js, tests/team-goal-guide-hint.test.js, tests/theme-system-v4.test.js)

### G011 [#TASK-ES-436] 인라인 스크립트 세포화 P1 이음매 1 — 목표 AI·일정 설정, 기록 AI 피드백 (docs/architecture/INLINE-SC

- 3221~3254줄(34줄) · 보통(22)
- 함수(0): 없음
- 변수(15): applyScheduleUpdate, celebrateMilestoneDone, computeGoalStatusHash, formatSchedulePillHtml, generateGoalStatusSummary, initFeedbackTierBar, localGoalStatusSummary, milestonesForAI, openScheduleSetupModal, requestAIFeedback, requestServerAIFeedback, requestTodayMission, sanitizeAttachments, sendGoalAgentMessage, showGoalAgentReviewStep
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: DONE_KEYWORDS, GeminiQuotaDispatcher, THEME_FEEDBACK_PROMPTS, TOPICS, _goalsKit, _recordsKit, applyGoalAgentOp, classifyRecordTheme, dispatchFullViewPropagation, fbBotBubbleHtml, localNextActionSuggestion, localTodayMission 외 2
- 로드 중 문 1: 호출 1
- 시험지 글자 의존: scripts/smoke-test.js, tests/ai-conditional-call-optimization.test.js, tests/goal-ai-advice-status.test.js, tests/goals-schedule-sync.test.js (index.html 단독 읽기: tests/goal-ai-advice-status.test.js, tests/goals-schedule-sync.test.js)

### G014 [#TASK-ES-437] 인라인 스크립트 세포화 P0 이음매 (docs/architecture/INLINE-SCRIPT-MAP.md 지도 · docs/specs

- 3344~3379줄(36줄) · 보통(24)
- 함수(0): 없음
- 변수(20): applyAppSettings, applyQuickCunningText, applyTheme, checkGuestBackupNudge, checkPendingDeletionRestore, checkStreakFreeze, closeAvatarGreetingPopup, gaugeSvg, importTemplateInstantly, initRememberedAuthFields, openAvatarGreetingPopup, openChangePasswordModal, openGuestBackupNudgeModal, openTeamInviteModal, openTeamLinkedPersonalGoalModal, sendToNotion, showCommTourModal, showLegalModal, showLevelUpBanner, templateMilestones
- 다른 묶음 상태 — 대입: __avatarGreetTimer · 변경: 없음 · 읽기: GOAL_TEMPLATES, MOCK_GROUPS, __avatarGreetTimer, _goalsKit, _recordsKit, _settingsKit, closeTemplateEncyclopediaModal, isValidRealUser, maybeApplyStreakFreeze, maybeGrantAvatarCraftBonus, maybeGrantStreakFreeze, openAvatarLevelUpModal
- 로드 중 문 1: 호출 1
- 부르는 대상(나감): G039×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js, tests/account-switch-isolation.test.js, tests/direct-login-guard.test.js, tests/google-session-guard.test.js, tests/logout-scope-es399.test.js, tests/theme-system-v4.test.js (index.html 단독 읽기: tests/google-session-guard.test.js, tests/theme-system-v4.test.js)

### G036 [#TASK-ES-222] [생각 메모장 92번] 카카오톡 인앱 브라우저 감지 및 Android Chrome 자동 탈출 & iOS Safari 플로팅 가이드 배너

- 3716~3727줄(12줄) · 보통(24)
- 함수(0): 없음
- 변수(2): landGuestBtn, landNickQuickLink
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindLandGuestBtn, bindLandLoginLink, bindLandNickQuickLink, checkKakaoInAppBrowser, escapeKakaoInAppBrowser
- 로드 중 문 8: 호출 4 · window 노출 2 · var 초기값 실행 2
- window 노출(2줄): checkKakaoInAppBrowser, escapeKakaoInAppBrowser
- 바깥 js 가 window 이름을 씀: js/tabs/settings/inapp-landing.js
- 시험지 글자 의존: scripts/smoke-test.js

### G013 [#TASK-ES-448] 인라인 스크립트 세포화 P2-2 이음매 (docs/architecture/INLINE-SCRIPT-MAP.md 지도 · docs/spe

- 3279~3343줄(65줄) · 보통(25)
- 함수(0): 없음
- 변수(43): CREATOR_TEMPLATES, EXTERNAL_DATA, MANITO_EMOJI, MANITO_STAMPS, MANITO_WELCOME_STAMPS, MOCK_PEOPLE, SHARE_PLATFORMS, SIM_PERSONAS, TOPICS, VISIBILITY_LABELS, buildInviteLinkSuffix, categoryPickerHtml, daysFromNow, drawShareWatermark, ensureFeedPostsLoaded, genAnonName, generateShareImage, groupCheckedToday, groupState, groupStreak 외 23
- 다른 묶음 상태 — 대입: FEED_POSTS_CACHE · 변경: 없음 · 읽기: FEED_POSTS_CACHE, MOCK_GROUPS, _commKit, _goalsKit, _recordsKit, _settingsKit, getFeedComments, openRecordModal, openTemplateEncyclopediaModal, openThemePickerModal, setFeedComments
- 로드 중 문 2: 호출 1 · TryStatement 1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js, tests/desktop-widget-suite.test.js, tests/guest-null-client-es377.test.js, tests/hidden-entry-guard.test.js, tests/stopwatch-lap-inputs.test.js, tests/stopwatch-table-hint.test.js, tests/team-fold-state-es409.test.js 외 2 (index.html 단독 읽기: tests/team-fold-state-es409.test.js, tests/theme-system-v4.test.js)

### G105 위클리 리캡 카드 (스포티파이 랩드 스타일, 공유 캔버스 인프라 재사용)

- 6947~6960줄(14줄) · 보통(25)
- 함수(0): 없음
- 변수(2): btnOpenTt, staticPulseBar
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindRecCarouselPills, bindRecDocumentClick, bindRecPulseBar, bindRecTimeTrackerBtn, openRecordModal, openWeeklyRecapModal, renderRecordsScreen
- 로드 중 문 9: 호출 7 · var 초기값 실행 2
- 이벤트 처리기: addEventListener 3 · on<이벤트> 대입 0
- 시험지 글자 의존: scripts/smoke-test.js

### G015 [#TASK-ES-442] 인라인 스크립트 세포화 P0 이음매 (docs/architecture/INLINE-SCRIPT-MAP.md 지도 · docs/specs

- 3380~3417줄(38줄) · 어려움(28)
- 함수(0): 없음
- 변수(20): challengeTwoFactorModal, convertTextToNotionDbRecord, defaultSettings, getRegisteredDevices, goalProgress, initDevDebugButtons, isHashedAppLockPin, migrateGuestDataToUser, msCounts, openLogoutOtherDevicesConfirmModal, openTabGuideHubModal, openTwoFactorDisableModal, openTwoFactorSetupModal, renderActiveDevicesList, renderPromptEncyclopediaHtml, resultPct, startOnboarding, toggleScheduleDone, verifyAppLockPin, wirePromptEncyclopediaEvents
- 다른 묶음 상태 — 대입: _promptEncyclopediaOpen, _promptTabState · 변경: 없음 · 읽기: APP_LOCK_PIN_PREFIX, USER_SESSION_CHANNEL, _calendarKit, _goalsKit, _promptEncyclopediaOpen, _promptTabState, _settingsKit, enterApp, gcalEventsKey, getDeviceId, performLogout, purgeLegacySharedGcalKeys 외 3
- 로드 중 문 1: 호출 1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js, tests/account-switch-isolation.test.js, tests/dev-host-gate.test.js, tests/device-session-control.test.js, tests/direct-login-guard.test.js, tests/gcal-login-reconnect-fix.test.js, tests/logout-scope-es399.test.js 외 2 (index.html 단독 읽기: tests/gcal-login-reconnect-fix.test.js)

### G039 소셜 로그인 (카카오 / 실제 구글 OAuth 연동)

- 3745~4050줄(306줄) · 어려움(31)
- 함수(7): getGoogleTokenClient, handleGoogleUserSuccess, initGoogleOneTap, parseJwtPayload, sha256Hex, startGoogleLogin, startOAuthLogin
- 변수(2): _googleOneTapNonce, _googleTokenClient
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: GOOGLE_OAUTH_CLIENT_ID, closeModal, escapeHtml, initRememberedAuthFields, openLoginRescueModal, restoreSessionAndEnter, saveProfile, sb, setDeviceLoginTime, state, toast
- 로드 중 문 2: 호출 2
- 이벤트 처리기: addEventListener 2 · on<이벤트> 대입 7
- 부르는 묶음(들어옴): G010×1, G014×1
- 부르는 대상(나감): G054×2, G059×2
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-all-clicks.js, scripts/verify-integrity-gate.js, tests/dev-host-gate.test.js, tests/direct-login-guard.test.js, tests/dm-push-auth-es397.test.js, tests/gcal-login-reconnect-fix.test.js, tests/goal-templates-data-split.test.js 외 6 (index.html 단독 읽기: tests/gcal-login-reconnect-fix.test.js, tests/goal-templates-data-split.test.js, tests/goals-schedule-sync.test.js, tests/google-session-guard.test.js)

### G059 [#TASK-ES-153] 전역 7일 유예 통합 휴지통 (Recycle Bin) 시스템

- 4299~4344줄(46줄) · 어려움(32)
- 함수(1): saveGoogleToken
- 변수(1): googleTokenClient
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: gcalCurrentUid, gcalTokenStatus, getGoogleAccessToken, isGoogleCalendarConnected, purgeLegacySharedGcalKeys, requestGoogleToken, restoreGoogleToken, state
- 로드 중 문 1: IfStatement 1
- window 노출(6줄): gcalTokenStatus, getGoogleAccessToken, isGoogleCalendarConnected, requestGoogleToken, restoreGoogleToken, saveGoogleToken
- 부르는 묶음(들어옴): G039×2, G010×1
- 바깥 js 가 window 이름을 씀: js/core/app-enter.js, js/core/gcal-sync.js, js/core/trash-bin.js, js/tabs/calendar/calendar-core.js, js/tabs/calendar/manual-edit-modal.js, js/tabs/calendar/natural-schedule.js, js/tabs/calendar/render.js, js/tabs/settings/session-entry.js 외 1
- 시험지 글자 의존: scripts/smoke-test.js, tests/core-confirm-es376.test.js, tests/gcal-login-reconnect-fix.test.js (index.html 단독 읽기: tests/gcal-login-reconnect-fix.test.js)

### G090 [#TASK-ES-189] 템플릿 백과사전 3대 분류(개인·루틴·팀) 및 AI/실유저 2원화 이식 시스템

- 4887~4901줄(15줄) · 어려움(35)
- 함수(0): 없음
- 변수(4): _subtabTplCat, _subtabTplDomain, _subtabTplQuery, _subtabTplType
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: PERSONAL_TEMPLATES_REAL, ROUTINE_TEMPLATES_AI, ROUTINE_TEMPLATES_REAL, TEAM_TEMPLATES_AI, TEAM_TEMPLATES_REAL, renderTemplateEncyclopediaScreen
- 로드 중 문 8: window 노출 8
- window 노출(8줄): PERSONAL_TEMPLATES_REAL, ROUTINE_TEMPLATES_AI, ROUTINE_TEMPLATES_REAL, TEAM_TEMPLATES_AI, TEAM_TEMPLATES_REAL, _subtabTplDomain, _subtabTplType, renderTemplateEncyclopediaScreen
- 바깥 js 가 window 이름을 씀: js/tabs/goals/render.js, js/tabs/goals/template-encyclopedia.js
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-shipyard-modular.js, scripts/verify-integrity-gate.js, tests/routine-tab-scheduler.test.js (index.html 단독 읽기: tests/routine-tab-scheduler.test.js)

### G107 캘린더 실시간 구독 URL 생성기 (WebCal Feed & #TASK-ES-252 HMAC 서명)

- 6962~7138줄(177줄) · 어려움(38)
- 함수(1): shareContent
- 변수(2): MOCK_GROUPS, _cachedSignedCalendarToken
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: CREATOR_TEMPLATES, daysFromNow, openExportThemeModal
- 로드 중 문 3: 호출 1 · window 노출 2
- window 노출(2줄): CREATOR_TEMPLATES, shareContent
- 이벤트 처리기: addEventListener 1 · on<이벤트> 대입 0
- 부르는 묶음(들어옴): G010×1, G103×1
- 바깥 js 가 window 이름을 씀: js/tabs/comm/feed-list.js, js/tabs/comm/manito-real.js, js/tabs/comm/sample-data.js, js/tabs/comm/share-card.js, js/tabs/goals/template-encyclopedia-modal.js, js/tabs/goals/template-encyclopedia.js, js/tabs/records/export-theme.js, js/team-share.js 외 2
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js, tests/security-audit.test.js, tests/team-fold-state-es409.test.js, tests/team-level-accordion-es406.test.js, tests/team-level-management.test.js, tests/team-tasks-toggle-es410.test.js (index.html 단독 읽기: tests/security-audit.test.js, tests/team-fold-state-es409.test.js, tests/team-level-accordion-es406.test.js, tests/team-level-management.test.js, tests/team-tasks-toggle-es410.test.js)

### G024 [#TASK-ES-150] 아바타 레벨업 대형 팝업 & 성장 성향 키워드

- 3612~3633줄(22줄) · 어려움(41)
- 함수(0): 없음
- 변수(6): avLvModalElem, btnAvLvClose, btnAvLvConfirm, btnSaveGrowth, btnSaveLvImg, btnShareLv
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindAvatarGrowthPromptSave, bindAvatarLevelUpBackdrop, bindAvatarLevelUpSaveImage, bindAvatarLevelUpShare, closeAvatarLevelUpModal, openAvatarLevelUpModal
- 로드 중 문 14: window 노출 2 · var 초기값 실행 6 · IfStatement 2 · 호출 4
- window 노출(2줄): closeAvatarLevelUpModal, openAvatarLevelUpModal
- 이벤트 처리기: addEventListener 2 · on<이벤트> 대입 0
- 바깥 js 가 window 이름을 씀: js/tabs/settings/avatar-greeting.js, js/tabs/settings/avatar-levelup-modal.js
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js, tests/avatar-10slots-growth.test.js (index.html 단독 읽기: tests/avatar-10slots-growth.test.js)

### G080 [#TASK-ES-146] 아워골 평가해주기 90% 팝업

- 4763~4793줄(31줄) · 어려움(46)
- 함수(0): 없음
- 변수(5): btnEvalBanner, btnEvalClose, btnSubmitEval, challengeBtn, modalEvalElem
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindAppEvalBackdrop, bindAppEvalSubmit, bindHomeAddGoal, closeAppEvaluationModal, openAppEvaluationModal, openMzShareCardModal, resetAppEvaluationForm, setTab
- 로드 중 문 15: window 노출 3 · var 초기값 실행 5 · IfStatement 3 · 호출 4
- window 노출(3줄): closeAppEvaluationModal, openAppEvaluationModal, resetAppEvaluationForm
- 이벤트 처리기: addEventListener 3 · on<이벤트> 대입 1
- 바깥 js 가 window 이름을 씀: js/components-home-actions.js, js/tabs/settings/app-evaluation.js
- 시험지 글자 의존: scripts/smoke-test.js, tests/app-evaluation-modal.test.js, tests/home-customizer-auto-sync.test.js (index.html 단독 읽기: tests/home-customizer-auto-sync.test.js)

### G108 크리에이터 템플릿 (#TASK-ES-315, 64: 구형 창 영구 제거 및 무해화)

- 7139~7187줄(49줄) · 어려움(55)
- 함수(2): cloneTemplate, templatesHtml
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: CREATOR_TEMPLATES, escapeHtml, newId, nowISO, renderAll, saveProfile, state, toast, trackGoalCreated, uid
- 로드 중 문 1: window 노출 1
- window 노출(1줄): cloneTemplate
- 부르는 묶음(들어옴): G010×1, G122×1
- 바깥 js 가 window 이름을 씀: js/tabs/comm/feed-list.js, js/tabs/goals/template-encyclopedia-modal.js, js/tabs/goals/template-encyclopedia.js, js/team-invite-comm.js, js/viral-sharing.js
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-calendar-attachments.js, scripts/verify-all-clicks.js, scripts/verify-integrity-gate.js, tests/ai-conditional-call-optimization.test.js, tests/core-confirm-es376.test.js, tests/goal-ai-advice-status.test.js, tests/goal-template-legacy-cleanup.test.js 외 11 (index.html 단독 읽기: scripts/test-calendar-attachments.js, tests/goal-ai-advice-status.test.js, tests/goal-templates-data-split.test.js, tests/goals-schedule-sync.test.js, tests/goals-smart-attachments.test.js, tests/record-ledger-sync.test.js, tests/routine-tab-scheduler.test.js, tests/sync-server-records-render-home.test.js 외 3)

### G062 5대 테마 온톨로지 & 경량 AI 분류기 (TASK-OG-001)

- 4388~4488줄(101줄) · 어려움(59)
- 함수(2): buildCheckinRecord, saveQuickCheckin
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: MOCK_GROUPS, XP_RULES, awardXP, checkGuestBackupNudge, classifyRecordTheme, computeStreakDays, dayIndexSinceSignup, dispatchFullViewPropagation, groupState, maybeGrantAvatarCraftBonus, maybeGrantStreakFreeze, newId 외 6
- 시험지 글자 의존: scripts/smoke-test.js, tests/account-switch-isolation.test.js, tests/achievement-stats-shell-button-removal.test.js, tests/avatar-welcome-modal.test.js, tests/calendar-photo-diary-dismiss-guide.test.js, tests/comm-feed-cleanup.test.js, tests/comm-post-feed-button-fix.test.js, tests/component-modularization.test.js 외 18 (index.html 단독 읽기: tests/avatar-welcome-modal.test.js, tests/calendar-photo-diary-dismiss-guide.test.js, tests/comm-feed-cleanup.test.js, tests/comm-post-feed-button-fix.test.js, tests/component-modularization.test.js, tests/dm-keyboard-autofocus-fix.test.js, tests/enlarge-avatar-icons.test.js, tests/google-session-guard.test.js 외 4)
- smoke-test FN_NAMES: buildCheckinRecord — 옮기려면 시험지 선행 PR 먼저

### G079 [#TASK-ES-174] 목표 템플릿 백과사전 전체화면 팝업 및 상호작용

- 4725~4762줄(38줄) · 어려움(64)
- 함수(0): 없음
- 변수(7): _tplActiveTab, _tplAiCurCat, btnCloseTplEncycl, btnHeaderTplEncycl, modalTplEncyclElem, tabBtnAi, tabBtnReal
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: REAL_USER_TEMPLATES, bindHeaderTemplateEncyclopediaClick, bindTemplateEncyclopediaEscape, bindTemplateEncyclopediaModalClick, cheerRealUserTemplate, closeTemplateEncyclopediaModal, copyRealUserTemplate, openTemplateEncyclopediaModal, shareMyActiveGoalAsTemplate, switchTemplateEncyclopediaTab
- 로드 중 문 20: window 노출 9 · var 초기값 실행 5 · IfStatement 3 · 호출 3
- window 노출(9줄): REAL_USER_TEMPLATES, cheerRealUserTemplate, closeGoalTemplateEncyclopediaModal, closeTemplateEncyclopediaModal, copyRealUserTemplate, copyUserGoalTemplate, openGoalTemplateEncyclopediaModal, openTemplateEncyclopediaModal, shareMyActiveGoalAsTemplate
- 이벤트 처리기: addEventListener 3 · on<이벤트> 대입 0
- 바깥 js 가 window 이름을 씀: js/components-goal-actions.js, js/components.js, js/tabs/goals/team-goal-prompt.js, js/tabs/goals/template-encyclopedia-modal.js, js/tabs/goals/template-quick-import.js
- 시험지 글자 의존: scripts/smoke-test.js, tests/goal-template-legacy-cleanup.test.js, tests/goal-templates-encyclopedia.test.js

### G091 [UI/UX 틀 개편 Phase 4] 목표 탭 노션급 데이터 관리 & 인지순행 IA (#TASK-UIUX-PHASE4-GOALS)

- 4902~4965줄(64줄) · 어려움(91)
- 함수(2): handleGoalFastAddSubmit, selectSmartTag
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: adoptTemplateAsMyGoal, closeGoalDetailDrawer, dispatchFullViewPropagation, openGoalDetailDrawer, renderGoalStatsChart, renderGoalsScreen, saveProfile, state, switchGoalStatPeriod, switchGoalsSubTab, toast, toggleMilestoneInDrawer 외 1
- 로드 중 문 11: window 노출 11
- window 노출(12줄): adoptTemplateAsMyGoal, closeGoalDetailDrawer, currentGoalStatPeriod, handleGoalFastAddSubmit, openGoalDetailDrawer, renderGoalStatsChart, selectSmartTag, selectedGoalSmartTag, switchGoalStatPeriod, switchGoalsSubTab, toggleMilestoneInDrawer
- 인라인 on*="…" 이 부르는 함수: handleGoalFastAddSubmit, selectSmartTag
- 바깥 js 가 window 이름을 씀: js/sanctuary-goal-trail.js, js/sanctuary-v3-engine.js, js/tabs/goals/goal-detail-drawer.js, js/tabs/goals/goals-ia-actions.js, js/tabs/goals/personal-goals-guide.js, js/tabs/goals/render.js
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-calendar-attachments.js, scripts/verify-integrity-gate.js, tests/ai-conditional-call-optimization.test.js, tests/core-confirm-es376.test.js, tests/goal-ai-advice-status.test.js, tests/goals-only-view.test.js, tests/goals-schedule-sync.test.js 외 9 (index.html 단독 읽기: scripts/test-calendar-attachments.js, tests/goal-ai-advice-status.test.js, tests/goals-only-view.test.js, tests/goals-schedule-sync.test.js, tests/goals-smart-attachments.test.js, tests/record-ledger-sync.test.js, tests/routine-tab-scheduler.test.js, tests/sync-server-records-render-home.test.js 외 3)

### G023 XP/레벨 시스템

- 3506~3611줄(106줄) · 어려움(95)
- 함수(3): hasUserCustomizedAvatar, levelBadgeHtml, renderLevelBadge
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: MOCK_GROUPS, closeModal, dateKey, levelForXP, levelProgress, notifyXpGained, nowISO, renderHome, saveProfile, state, toast, triggerAvatarCelebrationPopup 외 2
- 로드 중 문 6: window 노출 5 · IfStatement 1
- window 노출(6줄): levelForXP, levelProgress, notifyXpGained, renderLevelBadge, triggerAvatarCelebrationPopup, xpForLevel
- 이벤트 처리기: addEventListener 0 · on<이벤트> 대입 2
- 부르는 묶음(들어옴): G004×1, G103×1
- 부르는 대상(나감): G054×1
- 바깥 js 가 window 이름을 씀: js/avatar/xp.js, js/core/badges.js, js/core/profile-topbar.js, js/sanctuary-weekly-recap.js, js/tabs/goals/goal-detail-events.js, js/tabs/goals/goal-update-suggest.js, js/tabs/goals/result-input.js, js/tabs/goals/result-modal.js 외 11
- 시험지 글자 의존: scripts/smoke-test.js, tests/avatar-10slots-growth.test.js, tests/avatar-icon-enlarge-all.test.js, tests/avatar-personas-split.test.js, tests/enlarge-avatar-icons.test.js, tests/feed-post-photo-upload.test.js, tests/gcal-login-reconnect-fix.test.js, tests/goal-template-legacy-cleanup.test.js 외 11 (index.html 단독 읽기: tests/avatar-10slots-growth.test.js, tests/avatar-personas-split.test.js, tests/enlarge-avatar-icons.test.js, tests/gcal-login-reconnect-fix.test.js, tests/goals-schedule-sync.test.js, tests/goals-smart-attachments.test.js, tests/hide-home-debug-cards.test.js, tests/home-customizer-auto-sync.test.js 외 6)

### G103 템플릿 마켓 · 복제 · 전문 템플릿 기록 (TASK-ES-013)

- 5589~6910줄(1322줄) · 어려움(104)
- 함수(5): checkRecordDeepLink, executeDirectTemplateClone, openProTemplateRecordModal, openTemplateMarketModal, openTemplateRecordDetailModal
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: CURATED_MARKET_TEMPLATES, XP_RULES, awardXP, burstConfetti, closeModal, computeTrendChartData, downloadTableAsCsv, escapeHtml, fmtTime, fmtYYMMDD, formatStopwatchTime, getAllProTemplates 외 38
- 로드 중 문 1: 호출 1
- 이벤트 처리기: addEventListener 3 · on<이벤트> 대입 49
- 부르는 묶음(들어옴): G002×2, G003×1
- 부르는 대상(나감): G054×3, G023×1, G102×1, G107×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-calendar-attachments.js, scripts/test-shipyard-modular.js, scripts/verify-all-clicks.js, scripts/verify-integrity-gate.js, tests/account-switch-isolation.test.js, tests/account-withdrawal-modal.test.js, tests/achievement-graph-multiset.test.js 외 27 (index.html 단독 읽기: scripts/test-calendar-attachments.js, tests/account-withdrawal-modal.test.js, tests/goal-ai-advice-status.test.js, tests/goal-templates-data-split.test.js, tests/goals-only-view.test.js, tests/goals-schedule-sync.test.js, tests/goals-smart-attachments.test.js, tests/google-session-guard.test.js 외 8)

### G054 Modal helper & Android Hardware Back Handler

- 4159~4225줄(67줄) · 어려움(172)
- 함수(1): openModal
- 변수(2): _modalDismissGraceUntil, _modalHistoryPushed
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindModalPopstateBack, closeModal, openBottomSheetAlert, openBottomSheetConfirm
- 로드 중 문 2: IfStatement 1 · 호출 1
- window 노출(5줄): _modalOpenAt, closeModal, openBottomSheetAlert, openBottomSheetConfirm, openModal
- 이벤트 처리기: addEventListener 0 · on<이벤트> 대입 2
- 부르는 묶음(들어옴): G103×3, G039×2, G123×2, G001×1, G002×1, G023×1, G102×1, G118×1, G119×1, G121×1 외 2
- 바깥 js 가 window 이름을 씀: js/auth-safety.js, js/avatar/dynamic-album.js, js/avatar/modal/bind-save.js, js/avatar/modal/index.js, js/components-home-actions.js, js/components.js, js/core/badges.js, js/core/confirm.js 외 127
- 시험지 글자 의존: scripts/smoke-test.js, tests/core-confirm-es374.test.js, tests/core-modal-es363.test.js, tests/dm-push-auth-es397.test.js, tests/goals-smart-attachments.test.js, tests/google-session-guard.test.js, tests/theme-system-v4.test.js (index.html 단독 읽기: tests/core-modal-es363.test.js, tests/goals-smart-attachments.test.js, tests/google-session-guard.test.js, tests/theme-system-v4.test.js)

### G019 Confetti

- 3458~3472줄(15줄) · 어려움(224)
- 함수(0): 없음
- 변수(1): toastTimer
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: showUndoPrivacyToast, toast
- 로드 중 문 2: IfStatement 2
- window 노출(3줄): showToast, showUndoPrivacyToast, toast
- 바깥 js 가 window 이름을 씀: js/auth-safety.js, js/avatar/dynamic-album.js, js/avatar/feature-cards.js, js/avatar/modal/bind-craft.js, js/avatar/modal/bind-deck.js, js/avatar/modal/bind-persona.js, js/avatar/modal/bind-save.js, js/avatar/modal/index.js 외 204
- 시험지 글자 의존: scripts/smoke-test.js, tests/core-toast-es361.test.js (index.html 단독 읽기: tests/core-toast-es361.test.js)

### G026 뱃지 컬렉션 (명예의 전당)

- 3642~3655줄(14줄) · 어려움(268)
- 함수(0): 없음
- 변수(1): state
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: defaultProfile, formatDisplayNameWithTag, isoDate, resolveUniqueDisplayName
- 로드 중 문 4: window 노출 1 · IfStatement 3
- window 노출(3줄): formatDisplayNameWithTag, resolveUniqueDisplayName, state
- 바깥 js 가 window 이름을 씀: js/auth-safety.js, js/avatar/dynamic-album.js, js/avatar/feature-cards.js, js/avatar/modal/bind-craft.js, js/avatar/modal/bind-deck.js, js/avatar/modal/bind-save.js, js/avatar/modal/index.js, js/avatar/xp.js 외 239
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-shipyard-modular.js, scripts/verify-integrity-gate.js, tests/routine-tab-scheduler.test.js, tests/unique-display-name.test.js (index.html 단독 읽기: tests/routine-tab-scheduler.test.js, tests/unique-display-name.test.js)

### G010 [#TASK-ES-432] 인라인 스크립트 세포화 2차 이음매 (docs/architecture/INLINE-SCRIPT-MAP.md 지도 · docs/specs

- 2539~3220줄(682줄) · 어려움(378)
- 함수(0): 없음
- 변수(337): APP_LOCK_PIN_PREFIX, BADGES, DONE_KEYWORDS, GOAL_TEMPLATES, GOOGLE_OAUTH_CLIENT_ID, GeminiQuotaDispatcher, HEATMAP_LEVELS, HEATMAP_WEEKS, OfflineSyncManager, PERSONAL_TEMPLATES_REAL, PREMIUM_FEEDBACK_CATALOG, REAL_USER_TEMPLATES, RECORD_THEMES, ROUTINE_TEMPLATES_AI, ROUTINE_TEMPLATES_REAL, SHIFT_WORK_PRESETS, STARTER_GOAL_TEMPLATES, TEAM_COMMENTS_CACHE, TEAM_TEMPLATES_AI, TEAM_TEMPLATES_REAL 외 317
- 다른 묶음 상태 — 대입: MANITO_SERVER_LOADED, REALTIME_CHANNELS_SETUP, REAL_MANITO_INBOX_CACHE, REAL_MANITO_PARTNERS_CACHE, SHARED_GROUPS_LOADED, _cachedSignedCalendarToken, _isEnteringApp, _lastObservedDateKey, _modalDismissGraceUntil, _modalHistoryPushed, _pendingAuthSession, _subtabTplCat 외 10 · 변경: 없음 · 읽기: CREATOR_TEMPLATES, EXTERNAL_DATA, MANITO_EMOJI, MANITO_SERVER_LOADED, MANITO_STAMPS, MANITO_WELCOME_STAMPS, REALTIME_CHANNELS_SETUP, REAL_MANITO_INBOX_CACHE, REAL_MANITO_PARTNERS_CACHE, SHARED_GROUPS_LOADED, SHARE_PLATFORMS, _cachedSignedCalendarToken 외 112
- 로드 중 문 32: 호출 32
- 부르는 대상(나감): G039×1, G059×1, G096×1, G107×1, G108×1, G113×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-calendar-attachments.js, scripts/test-shipyard-modular.js, scripts/verify-integrity-gate.js, tests/account-switch-isolation.test.js, tests/account-withdrawal-modal.test.js, tests/achievement-collapse-toggle.test.js, tests/achievement-graph-multiset.test.js 외 75 (index.html 단독 읽기: scripts/test-calendar-attachments.js, tests/account-withdrawal-modal.test.js, tests/app-evaluation-notice.test.js, tests/avatar-welcome-modal.test.js, tests/calendar-photo-diary-dismiss-guide.test.js, tests/comm-ai-identity-es348.test.js, tests/comm-feed-cleanup.test.js, tests/comm-post-feed-button-fix.test.js 외 26)

## 6. 이음매·빈 구획

- G000 2253~2255(3줄) (IIFE 머리 — "use strict" 와 첫 구획 앞) — 빈 구획
- G001 2256~2334(79줄) [#TASK-ES-354 CORE-07] 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL.md) — 이음매(옮기지 않음) · 로드 중 문 1
- G002 2335~2376(42줄) [#TASK-ES-358] 기록 탭 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL.md) — 이음매(옮기지 않음) · 로드 중 문 1
- G003 2377~2405(29줄) [#TASK-ES-360] 일정 탭 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL.md, 기록 탭 #TASK-ES-358 과 같은 틀) — 이음매(옮기지 않음) · 로드 중 문 1
- G004 2406~2447(42줄) [#TASK-ES-370] 목표 탭 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL.md, 일정 탭 #TASK-ES-360 과 같은 틀) — 이음매(옮기지 않음) · 로드 중 문 1
- G006 2456~2471(16줄) [#TASK-ES-375] 목표 탭 모듈 이음매 2차 (docs/specs/MODULE-SPLIT-PROTOCOL.md, 1차 #TASK-ES-370 과 같은 틀 — 이음매(옮기지 않음) · 로드 중 문 1
- G007 2472~2493(22줄) [#TASK-ES-379] 소통 탭 모듈 이음매 1차 (docs/specs/MODULE-SPLIT-PROTOCOL.md, 목표 탭 #TASK-ES-370·#TAS — 이음매(옮기지 않음) · 로드 중 문 1
- G009 2527~2538(12줄) [#TASK-ES-423] 인라인 스크립트 세포화 1차 이음매 (docs/architecture/INLINE-SCRIPT-MAP.md 지도 · docs/specs — 이음매(옮기지 않음) · 로드 중 문 1
- G018 3450~3457(8줄) [#TASK-ES-264] 표준 시간대(한국 KST 00:00, 타 국가는 해당 국가 표준시 00:00) 기준 날짜 키 — 빈 구획 · 로드 중 문 1
- G021 3489~3492(4줄) 가상유저 개선 10대 핵심 헬퍼 함수 — 빈 구획 · 로드 중 문 1
- G022 3493~3505(13줄) [#TASK-ES-345 CAL-02] 구글 캘린더 토큰·일정 캐시 계정 격리 — 빈 구획 · 로드 중 문 1
- G027 3656~3659(4줄) [70] 다른 모든 기기 원격 로그아웃 전 로그인 기기 목록 확인 모달 — 빈 구획 · 로드 중 문 1
- G028 3660~3676(17줄) [71] 앱 잠금 PIN (이 기기) — 설정·해제·앱 진입 확인 — 빈 구획 · 로드 중 문 2
- G030 3684~3688(5줄) [80] 템플릿백과사전 1초 자동이식 선택 연동 및 로드맵-목표상태 동기화 — 빈 구획 · 로드 중 문 1
- G031 3689~3692(4줄) [82] 팀 목표 내 '팀 연계 개인목표' 생성 모달 — 빈 구획 · 로드 중 문 1
- G032 3693~3697(5줄) [83] 팀원 초대 시 '아워골 동반자 초대하기' 인앱 초대·참가 기능 — 빈 구획 · 로드 중 문 1
- G033 3698~3701(4줄) [88] 오늘의 3초 체크인 목표 버튼 선택 시 플레이스홀더(백그라운드 가이드) 예시 문구 렌더링 — 빈 구획 · 로드 중 문 1
- G034 3702~3714(13줄) [#TASK-UIUX-PHASE3-HOME-COCKPIT] 홈 1초 조망 ↔ 무저항 체크인 콕핏 8대 과업 — 빈 구획 · 로드 중 문 5
- G035 3715~3715(1줄) Landing — 빈 구획
- G038 3736~3744(9줄) [#TASK-ES-223] [생각 메모장 93번] 개발 디버그 버튼 프로덕션 완전 소거 및 로컬/디버그 격리 — 빈 구획 · 로드 중 문 2
- G040 4051~4055(5줄) [#TASK-ES-224] [생각 메모장 94번] 게스트(둘러보기) 3회 기록 시 안전 백업 넛지 및 카카오 무손실 계정 통합 — 빈 구획 · 로드 중 문 2
- G041 4056~4059(4줄) [#TASK-ES-224] [생각 메모장 94번] 카카오/소셜/일반 로그인 시 게스트 데이터 100% 무손실 비파괴 합집합(Union Merge) 이관 — 빈 구획 · 로드 중 문 1
- G045 4089~4092(4줄) 회원 탈퇴 전용 안내 모달 및 법적책임·데이터분실 사전 안내 (#TASK-ES-158) — 빈 구획 · 로드 중 문 1
- G049 4109~4128(20줄) 이용약관 / 개인정보처리방침 열람 리스너 — 빈 구획 · 로드 중 문 8
- G050 4129~4132(4줄) Onboarding (first-time, after signup) — 16종 동물 아바타 & 직관적 안착 융합 — 빈 구획 · 로드 중 문 1
- G051 4133~4142(10줄) 3단계: 첫 체크인 튜토리얼 가이드 및 축하 연출 — 빈 구획 · 로드 중 문 3
- G053 4151~4158(8줄) 조선소 블록 레지스트리 6대 메가블록 초기화 (헌법 제3조 제9항) — 빈 구획 · 로드 중 문 3
- G055 4226~4234(9줄) 이용약관 & 개인정보처리방침 모달 — 빈 구획 · 로드 중 문 1
- G057 4280~4297(18줄) 프로필 — 빈 구획 · 로드 중 문 5
- G058 4298~4298(1줄) 구글 캘린더 연동 — 빈 구획
- G060 4345~4365(21줄) [#TASK-ES-153 & #TASK-ES-155] 캘린더 일자별 배경 사진 지정 모달 — 빈 구획 · 로드 중 문 2
- G061 4366~4387(22줄) [#TASK-ES-181 & #TASK-ES-182] 폰 잠금화면에서 바로 보기 통합 허브 모달 — 빈 구획 · 로드 중 문 1
- G063 4489~4494(6줄) Adaptive UX Mode — 빈 구획 · 로드 중 문 1
- G064 4495~4501(7줄) Social Crew Pacing (#TASK-ES-228) — 빈 구획 · 로드 중 문 4
- G065 4502~4509(8줄) UX Telemetry (Hesitation & Rage Tap) — 빈 구획 · 로드 중 문 3
- G066 4510~4521(12줄) iOS 사파리 홈 화면 추가 안내 배너 & 실시간 알림 가이드 (#TASK-ES-234) — 빈 구획 · 로드 중 문 1
- G070 4554~4557(4줄) 🎙️ 마이크 권한 거부 상태 자가 진단 및 1초 권한 허용 모달 (#TASK-ES-227) — 빈 구획 · 로드 중 문 1
- G071 4558~4628(71줄) 음성 체크인 (Web Speech API) — 빈 구획 · 로드 중 문 1
- G075 4691~4707(17줄) 맞춤 피드백 봇 설정 — 빈 구획 · 로드 중 문 7
- G076 4708~4711(4줄) 목표 & 기록 선택 피드 공유 모달 (전면 고도화) — 빈 구획 · 로드 중 문 1
- G077 4712~4717(6줄) [#TASK-ES-301] 피드 게시 모달 내 '미리보기' 토글 직통 헬퍼 — 빈 구획 · 로드 중 문 1
- G081 4794~4803(10줄) New goal modal — 빈 구획 · 로드 중 문 2
- G082 4804~4804(1줄) 참고자료 (유튜브/영상, 이미지, 텍스트 메모, 웹링크) — 빈 구획
- G083 4805~4813(9줄) 참고자료 (유튜브/영상, 이미지, 텍스트 메모, 웹링크) — 빈 구획 · 로드 중 문 1
- G085 4847~4856(10줄) [#TASK-ES-264] 오늘의 미션 및 AI 피드백 조건부 호출 최적화 — 빈 구획 · 로드 중 문 1
- G086 4857~4868(12줄) 목표 탭 3계층 일정설정 / 디데이·기간 표시 및 캘린더 연동 (#TASK-ES-259, 메모장 03항, #TASK-ES-135) — 빈 구획 · 로드 중 문 1
- G087 4869~4875(7줄) [#TASK-ES-220] [생각 메모장 91번] 교대근무자 가변형 루틴 프리셋 & 자동 스케줄러 — 빈 구획 · 로드 중 문 4
- G088 4876~4883(8줄) [#TASK-ES-172] [27] 목표 탭: 데일리 루틴 서브탭 & 편집/상세 모달 — 빈 구획 · 로드 중 문 1
- G092 4966~4971(6줄) [PHASE 5] #TASK-UIUX-PHASE5-RECORDS-CALENDAR FUNCTIONS — 빈 구획 · 로드 중 문 2
- G093 4972~4981(10줄) [PHASE 6] #TASK-UIUX-PHASE6-COMM-SETTINGS FUNCTIONS — 빈 구획 · 로드 중 문 4
- G094 4982~5004(23줄) [UI/UX 프레임워크 개편 Phase 7] 모바일 하드웨어 인터랙션 & 사용성 하드닝 — 빈 구획 · 로드 중 문 5
- G095 5005~5007(3줄) RENDER: GOALS — 빈 구획
- G097 5037~5052(16줄) 개인 목표 200% 활용 가이드 & 템플릿 백과사전 (#TASK-ES-135) — 빈 구획 · 로드 중 문 4
- G098 5053~5144(92줄) [#TASK-ES-299] 팀 목표 댓글 작성 및 전송 직통 헬퍼 & 전역 이벤트 위임 (먹통 방어 100%) — 빈 구획 · 로드 중 문 3
- G099 5145~5153(9줄) TASK-ES-307: 측정지표 다중 선택 및 동시 렌더링 엔진 — 빈 구획 · 로드 중 문 2
- G100 5154~5167(14줄) 5대 테마 원형 라이프 밸런스 휠 (SVG Pie Chart) — 빈 구획
- G101 5168~5176(9줄) ⏱️ 인앱 인터벌 타이머 & 스톱워치 위젯 (In-Table Stopwatch) — 빈 구획 · 로드 중 문 1
- G104 6911~6946(36줄) [#TASK-ES-358] 기록 탭 렌더 → js/tabs/records/period-ai-card.js · render.js 로 옮김 — 빈 구획 · 로드 중 문 2
- G106 6961~6961(1줄) RFC 5545 표준 iCalendar (.ics) 생성 순수 함수 (TASK-BG-11) — 빈 구획
- G114 7241~7255(15줄) [#TASK-ES-354 CORE-07·SET-07] 설정 탭 렌더 → js/tabs/settings/render.js · sub-*.js 로 옮김 — 이음매(옮기지 않음) · 로드 중 문 5
- G115 7256~7261(6줄) 4대 연계 뷰 원자적 동시 전파 디스패처 (헌법 제1조 제4항 제5호 & 제15조 제6항 제3호) — 빈 구획 · 로드 중 문 1
- G118 7271~7285(15줄) #TASK-AUTH-P0-SAFETY: 로그인/계정 보안 패키지 모듈 연결 — 빈 구획 · 로드 중 문 2
- G119 7286~7299(14줄) KF-7 #TASK-ES-014: 반응 4종 모듈(js/reactions.js)에 앱 핸들 연결 — 빈 구획 · 로드 중 문 1
- G120 7300~7304(5줄) KF-4 #TASK-ES-018: 카테고리별 도움이 된 글 슬롯 모듈(js/top-helpful.js) — 빈 구획 · 로드 중 문 1
- G121 7305~7313(9줄) KF-5 #TASK-ES-016: 도움돼요 이유 모듈(js/helpful-reason.js)에 앱 핸들 연결 — 빈 구획 · 로드 중 문 1
- G122 7314~7321(8줄) #TASK-ES-105: 팀 초대 및 소통/DM/동반자 모듈(js/team-invite-comm.js) 연결 — 빈 구획 · 로드 중 문 1
- G123 7322~7330(9줄) #TASK-ES-105: 팀 연계 개인목표 및 상호 체크 모듈(js/team-linked-goals.js) 연결 — 빈 구획 · 로드 중 문 2
- G124 7331~7335(5줄) KF-2 #TASK-ES-017: 템플릿 복제 크레딧 모듈(js/template-credit.js)에 앱 핸들 연결 — 빈 구획 · 로드 중 문 1
- G125 7336~7378(43줄) PWA: Service Worker 등록 및 자동 업데이트 감지 (#TASK-ES-118) — 빈 구획 · 로드 중 문 10
