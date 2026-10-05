# index.html 인라인 스크립트 책임 묶음 지도

> 생성: `NODE_PATH=<node_modules> node scripts/inline-script-map.js --write` (#TASK-ES-423). **손으로 고치지 않는다** — 다시 만들면 같은 입력에서 같은 글자가 나온다(결정적).
> 출처: `index.html` sha256 앞 12자 `96015d7e28f8` · 큰 인라인 IIFE 2257~11933줄(9677줄) · 다른 인라인 블록 4줄(8줄), 11936줄(16줄).

## 1. 요약

- 묶음 138개(이음매 8 · 옮길 대상 74 · 빈 구획 56). 묶음 = IIFE 최상위 구획 주석 `/* ============ 제목 ============ */` 에서 다음 구획 주석 앞까지.
- 최상위 함수 102 · 최상위 변수 529 · window 전역 대입 207줄(module-metrics ③ 의 index.html 몫과 같은 정규식) · addEventListener 94 · on<이벤트> 대입 114 · 로드 중 바로 도는 최상위 문 336 · 인라인 on*="…" 처리기가 부르는 IIFE 이름 36개.
- 난이도 묶음 수(줄): 쉬움 18(640줄) · 보통 30(1228줄) · 어려움 26(6685줄) · 빈 구획 56(872줄) · 이음매(옮기지 않음) 8(252줄).

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
| G110 | 템플릿 마켓 · 복제 · 전문 템플릿 기록 (TASK-ES-013) | 1322 | 5 | 어려움(64) | 0/1/49 | 1 | 2 | 19(3) |
| G103 | 개인 목표 200% 활용 가이드 & 템플릿 백과사전 (#TASK-ES-135) | 761 | 6 | 어려움(62) | 0/0/10 | 4 | 3 | 22(8) |
| G085 | [#TASK-ES-174] 목표 템플릿 백과사전 전체화면 팝업 및 상호작용 | 568 | 12 | 어려움(80) | 0/1/9 | 20 | 2 | 15(4) |
| G010 | [#TASK-ES-432] 인라인 스크립트 세포화 2차 이음매 (docs/architecture/INLINE-SCRIPT-MA | 538 | 0 | 어려움(302) | 19/0/112 | 24 | 0 | 45(22) |
| G063 | 캘린더 수동 일정 편집 모달 (Req 2 & #TASK-ES-253) | 496 | 1 | 어려움(34) | 0/1/18 | 0 | 2 | 15(4) |
| G109 | CSV / 엑셀 양방향 연동 & 스마트워치 매핑 & 목표 3각 추적 | 412 | 4 | 쉬움(8) | 0/0/4 | 0 | 1 | 3(1) |
| G093 | [#TASK-ES-220] [생각 메모장 91번] 교대근무자 가변형 루틴 프리셋 & 자동 스케줄러 | 322 | 3 | 어려움(27) | 0/0/7 | 4 | 1 | 8(2) |
| G026 | 뱃지 컬렉션 (명예의 전당) | 312 | 6 | 어려움(287) | 0/0/10 | 4 | 4 | 23(10) |
| G040 | 소셜 로그인 (카카오 / 실제 구글 OAuth 연동) | 306 | 7 | 어려움(27) | 0/1/10 | 2 | 2 | 12(3) |
| G107 | [#TASK-ES-233] 3일 실천 완성 나의 6각 성장 차트 미리보기 SVG 렌더러 | 282 | 4 | 어려움(28) | 0/1/9 | 0 | 2 | 15(5) |

## 3. 권장 순서 (안전한 것부터, 상위 30)

같은 점수면 큰 묶음 먼저(한 번 옮겨 많이 줄인다). 로드 중 문이 있는 묶음은 함수만 옮기고 그 문은 원래 자리에 남긴다(MODULE-SPLIT-PROTOCOL 3절).

| 순서 | 묶음 | 제목 | 줄 | 점수 | 근거(점수가 생긴 곳) |
|--:|---|---|--:|--:|---|
| 1 | G079 | AI feedback (best-effort; provider-aware; local fallback) | 13 | 0 | 없음 |
| 2 | G073 | 1순위 대표 목표 AI 초집중 모드 (Focus Auto-Pilot) | 9 | 0 | 없음 |
| 3 | G029 | [78 / 89] 데이터분석 프롬프트 백과사전 (실사용 유저 등록·피드 게시 및 도움돼요 상호작용) | 7 | 0 | 없음 |
| 4 | G116 | 소통 피드 (Supabase feed_posts, 실시간 동기화) | 6 | 0 | 없음 |
| 5 | G125 | [#TASK-ES-264] 자정(00:00 KST / 현지 표준시) 날짜 변경 감지 및 자동 동기화 워처 | 4 | 0 | 없음 |
| 6 | G095 | RENDER: TEMPLATE ENCYCLOPEDIA SUBTAB (#TASK-ES-187) | 3 | 0 | 없음 |
| 7 | G127 | 세션 복구 및 안전 앱 진입 유틸 | 4 | 3 | 상태 읽기 1 · 로드 중 문 1 |
| 8 | G017 | 아워골 앱 환경설정 | 25 | 5 | 로드 중 문 1 · window 1 · 바깥 파일 2 |
| 9 | G044 | P0: 비밀번호 찾기 (이메일 재설정 링크 발송) | 10 | 5 | 상태 읽기 1 · 로드 중 문 2 |
| 10 | G048 | 앱 활용 가이드 다시보기 | 4 | 5 | 상태 읽기 1 · 로드 중 문 2 |
| 11 | G058 | 목표 일정 리스케일링 | 45 | 6 | 상태 읽기 1 · FN_NAMES 1 |
| 12 | G070 | 신규 유저 10초 활성화: 갓생 스타터 목표 템플릿 | 42 | 6 | 시험지(index 단독) 2 |
| 13 | G122 | 방해금지 시간대(DND, 조용한 시간) 판별 순수 함수 (TASK-BG-7) | 21 | 7 | 들어옴 2 · FN_NAMES 1 |
| 14 | G074 | 원터치 퀵 루틴 칩 | 11 | 7 | 로드 중 문 2 · 시험지(index 단독) 1 |
| 15 | G005 | [#TASK-ES-453] 인라인 스크립트 세포화 P1 이음매 3 — 목표 종합상황 AI 요약 새로 고침 ( | 8 | 7 | 상태 읽기 2 · 로드 중 문 1 · 시험지(index 단독) 1 |
| 16 | G109 | CSV / 엑셀 양방향 연동 & 스마트워치 매핑 & 목표 3각 추적 | 412 | 8 | 상태 읽기 4 · 들어옴 1 · 시험지(index 단독) 1 |
| 17 | G043 | Goal category templates | 11 | 8 | 상태 읽기 2 · 로드 중 문 3 |
| 18 | G049 | 1:1 고객 문의 / 버그 제보 (#TASK-ES-178) | 5 | 8 | 상태 읽기 2 · 로드 중 문 3 |
| 19 | G117 | 전역 공유 팀 로더 & 렌더링 (#TASK-ES-133) | 10 | 9 | 상태 읽기 1 · 로드 중 문 2 · window 2 · 바깥 파일 2 |
| 20 | G077 | 사진 인증 & 뷰어 모달 (가상유저 요청 P1) | 38 | 10 | 상태 읽기 2 · 로드 중 문 4 |
| 21 | G008 | [#TASK-ES-444] 인라인 스크립트 세포화 P1 이음매 2 — 일정 배경·잠금화면 라이브, 소통 창· | 33 | 10 | 상태 읽기 8 · 로드 중 문 1 |
| 22 | G118 | 통합 딥링크 게이트웨이 & 게스트 소프트 뷰어 3종 (js/viral-sharing.js 위임) | 10 | 10 | 상태 읽기 2 · 로드 중 문 2 · window 2 · 바깥 파일 2 |
| 23 | G025 | #TASK-ES-165: 앱 진입 아바타 인사 팝업 (화면 절반 크기 & 시간대별 멘트) | 8 | 10 | 상태 읽기 2 · 로드 중 문 2 · window 2 · 바깥 파일 2 |
| 24 | G054 | 최초 로그인 활용가이드 — 4대 탭 무블러(Zero Blur) 투명 라이브 프리뷰 융합 | 8 | 10 | 상태 읽기 1 · 로드 중 문 3 · window 1 · 바깥 파일 2 |
| 25 | G119 | 마니또 실 유저 익명 응원 연동 (#TASK-ES-133, #TASK-ES-145) | 8 | 10 | 상태 읽기 1 · 로드 중 문 1 · window 1 · 바깥 파일 6 |
| 26 | G016 | Supabase | 10 | 11 | 상태 읽기 2 · 로드 중 문 2 · window 1 · 바깥 파일 4 |
| 27 | G047 | [#TASK-ES-160, #TASK-ES-166, #TASK-ES-180] 각 탭 200% 활용법 및 실제 | 7 | 11 | 상태 읽기 2 · 로드 중 문 3 · window 1 · 바깥 파일 2 |
| 28 | G080 | [#TASK-ES-225] [생각 메모장 95번] Gemini API 분당 쿼터(Rate Limit 429) | 146 | 12 | 상태 읽기 2 · 로드 중 문 2 · window 2 · 바깥 파일 1 · 시험지(index 단독) 1 |
| 29 | G012 | [#TASK-ES-446] 인라인 스크립트 세포화 P2-1 이음매 (docs/architecture/INLI | 24 | 12 | 상태 읽기 10 · 로드 중 문 1 |
| 30 | G068 | UX Telemetry (Hesitation & Rage Tap) | 23 | 12 | 상태 읽기 1 · 로드 중 문 3 · window 2 · 바깥 파일 3 |

## 4. 전체 묶음 표

| 묶음 | 줄 범위 | 줄 | 제목 | 함수 | 변수 | 난이도(점수) | 상태 쓰기 · 변경 · 읽기 | window | 처리기(add/on) | 로드 중 문 | 인라인 처리기 | 들어옴/나감 묶음 | 바깥 파일 | 시험지(index 단독) |
|---|---|--:|---|--:|--:|---|---|--:|---|--:|--:|---|--:|---|
| G000 | 2257~2259 | 3 | (IIFE 머리 — "use strict" 와 첫 구획 앞) | 0 | 0 | 빈 구획(66) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 66(22) |
| G001 | 2260~2338 | 79 | [#TASK-ES-354 CORE-07] 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTO | 0 | 19 | 이음매(옮기지 않음)(69) | 1 · 0 · 45 | 0 | 0/0 | 1 | 0 | 0/6 | 0 | 18(6) |
| G002 | 2339~2380 | 42 | [#TASK-ES-358] 기록 탭 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL | 0 | 4 | 이음매(옮기지 않음)(66) | 1 · 0 · 24 | 0 | 0/0 | 1 | 0 | 0/6 | 0 | 48(12) |
| G003 | 2381~2409 | 29 | [#TASK-ES-360] 일정 탭 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL | 0 | 3 | 이음매(옮기지 않음)(28) | 0 · 0 · 17 | 0 | 0/0 | 1 | 0 | 0/3 | 0 | 9(3) |
| G004 | 2410~2451 | 42 | [#TASK-ES-370] 목표 탭 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL | 0 | 2 | 이음매(옮기지 않음)(68) | 0 · 0 · 30 | 0 | 0/0 | 1 | 0 | 0/3 | 0 | 45(12) |
| G005 | 2452~2459 | 8 | [#TASK-ES-453] 인라인 스크립트 세포화 P1 이음매 3 — 목표 종합상황 AI 요약 새로 고침 ( | 0 | 1 | 쉬움(7) | 0 · 0 · 2 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 3(1) |
| G006 | 2460~2475 | 16 | [#TASK-ES-375] 목표 탭 모듈 이음매 2차 (docs/specs/MODULE-SPLIT-PROTO | 0 | 3 | 이음매(옮기지 않음)(10) | 0 · 0 · 8 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 1(0) |
| G007 | 2476~2497 | 22 | [#TASK-ES-379] 소통 탭 모듈 이음매 1차 (docs/specs/MODULE-SPLIT-PROTO | 0 | 7 | 이음매(옮기지 않음)(14) | 0 · 0 · 9 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 7(1) |
| G008 | 2498~2530 | 33 | [#TASK-ES-444] 인라인 스크립트 세포화 P1 이음매 2 — 일정 배경·잠금화면 라이브, 소통 창· | 0 | 23 | 보통(10) | 0 · 0 · 8 | 0 | 0/0 | 1 | 0 | 0/1 | 0 | 5(0) |
| G009 | 2531~2542 | 12 | [#TASK-ES-423] 인라인 스크립트 세포화 1차 이음매 (docs/architecture/INLINE | 0 | 5 | 이음매(옮기지 않음)(5) | 0 · 0 · 3 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 3(0) |
| G010 | 2543~3080 | 538 | [#TASK-ES-432] 인라인 스크립트 세포화 2차 이음매 (docs/architecture/INLINE | 0 | 259 | 어려움(302) | 19 · 0 · 112 | 0 | 0/0 | 24 | 0 | 0/14 | 0 | 45(22) |
| G011 | 3081~3114 | 34 | [#TASK-ES-436] 인라인 스크립트 세포화 P1 이음매 1 — 목표 AI·일정 설정, 기록 AI 피드 | 0 | 15 | 보통(21) | 0 · 0 · 13 | 0 | 0/0 | 1 | 0 | 0/1 | 0 | 4(2) |
| G012 | 3115~3138 | 24 | [#TASK-ES-446] 인라인 스크립트 세포화 P2-1 이음매 (docs/architecture/INLI | 0 | 9 | 보통(12) | 0 · 0 · 10 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 2(0) |
| G013 | 3139~3203 | 65 | [#TASK-ES-448] 인라인 스크립트 세포화 P2-2 이음매 (docs/architecture/INLI | 0 | 43 | 보통(23) | 1 · 0 · 9 | 0 | 0/0 | 2 | 0 | 0/2 | 0 | 10(2) |
| G014 | 3204~3239 | 36 | [#TASK-ES-437] 인라인 스크립트 세포화 P0 이음매 (docs/architecture/INLINE | 0 | 20 | 보통(23) | 1 · 0 · 11 | 0 | 0/0 | 1 | 0 | 0/2 | 0 | 7(2) |
| G015 | 3240~3277 | 38 | [#TASK-ES-442] 인라인 스크립트 세포화 P0 이음매 (docs/architecture/INLINE | 0 | 20 | 어려움(27) | 2 · 0 · 14 | 0 | 0/0 | 1 | 0 | 0/1 | 0 | 10(1) |
| G016 | 3278~3287 | 10 | Supabase | 0 | 4 | 보통(11) | 0 · 0 · 2 | 1 | 0/0 | 2 | 0 | 0/0 | 4 | 1(0) |
| G017 | 3288~3312 | 25 | 아워골 앱 환경설정 | 0 | 1 | 쉬움(5) | 0 · 0 · 0 | 1 | 0/0 | 1 | 0 | 0/0 | 2 | 1(0) |
| G018 | 3313~3320 | 8 | [#TASK-ES-264] 표준 시간대(한국 KST 00:00, 타 국가는 해당 국가 표준시 00:00) 기 | 0 | 0 | 빈 구획(10) | 0 · 0 · 2 | 2 | 0/0 | 1 | 0 | 0/0 | 4 | 2(0) |
| G019 | 3321~3343 | 23 | Confetti | 1 | 1 | 어려움(240) | 0 · 0 · 1 | 3 | 0/1 | 2 | 1 | 32/0 | 195 | 2(1) |
| G020 | 3344~3359 | 16 | 8대 화면 스타일 (테마) 정의 | 0 | 1 | 보통(21) | 0 · 0 · 1 | 2 | 0/0 | 1 | 0 | 0/0 | 4 | 10(4) |
| G021 | 3360~3363 | 4 | 가상유저 개선 10대 핵심 헬퍼 함수 | 0 | 0 | 빈 구획(42) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 38 | 1(0) |
| G022 | 3364~3376 | 13 | [#TASK-ES-345 CAL-02] 구글 캘린더 토큰·일정 캐시 계정 격리 | 0 | 0 | 빈 구획(18) | 0 · 0 · 3 | 3 | 0/0 | 1 | 0 | 0/0 | 7 | 2(1) |
| G023 | 3377~3482 | 106 | XP/레벨 시스템 | 3 | 0 | 어려움(84) | 0 · 0 · 12 | 6 | 0/2 | 6 | 0 | 4/3 | 17 | 15(11) |
| G024 | 3483~3504 | 22 | [#TASK-ES-150] 아바타 레벨업 대형 팝업 & 성장 성향 키워드 | 0 | 6 | 어려움(41) | 0 · 0 · 6 | 2 | 2/0 | 14 | 0 | 0/0 | 2 | 3(1) |
| G025 | 3505~3512 | 8 | #TASK-ES-165: 앱 진입 아바타 인사 팝업 (화면 절반 크기 & 시간대별 멘트) | 0 | 1 | 보통(10) | 0 · 0 · 2 | 2 | 0/0 | 2 | 0 | 0/0 | 2 | 1(0) |
| G026 | 3513~3824 | 312 | 뱃지 컬렉션 (명예의 전당) | 6 | 1 | 어려움(287) | 0 · 0 · 10 | 4 | 0/0 | 4 | 0 | 4/1 | 226 | 23(10) |
| G027 | 3825~3828 | 4 | [70] 다른 모든 기기 원격 로그아웃 전 로그인 기기 목록 확인 모달 | 0 | 0 | 빈 구획(8) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 4 | 1(0) |
| G028 | 3829~3845 | 17 | [71] 앱 잠금 PIN (이 기기) — 설정·해제·앱 진입 확인 | 0 | 0 | 빈 구획(16) | 0 · 0 · 5 | 5 | 0/0 | 2 | 0 | 0/0 | 2 | 0(0) |
| G029 | 3846~3852 | 7 | [78 / 89] 데이터분석 프롬프트 백과사전 (실사용 유저 등록·피드 게시 및 도움돼요 상호작용) | 0 | 2 | 쉬움(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 2(0) |
| G030 | 3853~3857 | 5 | [80] 템플릿백과사전 1초 자동이식 선택 연동 및 로드맵-목표상태 동기화 | 0 | 0 | 빈 구획(6) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 2 | 0(0) |
| G031 | 3858~3861 | 4 | [82] 팀 목표 내 '팀 연계 개인목표' 생성 모달 | 0 | 0 | 빈 구획(7) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 3 | 1(0) |
| G032 | 3862~3866 | 5 | [83] 팀원 초대 시 '아워골 동반자 초대하기' 인앱 초대·참가 기능 | 0 | 0 | 빈 구획(9) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 5 | 1(0) |
| G033 | 3867~3870 | 4 | [88] 오늘의 3초 체크인 목표 버튼 선택 시 플레이스홀더(백그라운드 가이드) 예시 문구 렌더링 | 0 | 0 | 빈 구획(6) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 2 | 0(0) |
| G034 | 3871~3881 | 11 | [#TASK-UIUX-PHASE3-HOME-COCKPIT] 홈 1초 조망 ↔ 무저항 체크인 콕핏 8대 과업 | 0 | 0 | 빈 구획(144) | 0 · 0 · 4 | 6 | 0/0 | 5 | 0 | 0/1 | 124 | 0(0) |
| G035 | 3882~3994 | 113 | 서버 관리자 API를 통한 기록 및 프로필 복구 (#TASK-ES-036) | 1 | 0 | 보통(21) | 0 · 0 · 7 | 0 | 0/0 | 0 | 0 | 2/1 | 0 | 12(4) |
| G036 | 3995~3995 | 1 | Landing | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G037 | 3996~4007 | 12 | [#TASK-ES-222] [생각 메모장 92번] 카카오톡 인앱 브라우저 감지 및 Android Chrome | 0 | 2 | 보통(24) | 0 · 0 · 5 | 2 | 0/0 | 8 | 0 | 0/0 | 1 | 1(0) |
| G038 | 4008~4015 | 8 | 2계정 상호작용 테스트 (테스터 B 직통 입장: #TASK-ES-169) | 0 | 2 | 보통(15) | 0 · 0 · 3 | 1 | 0/0 | 5 | 0 | 0/0 | 1 | 1(0) |
| G039 | 4016~4024 | 9 | [#TASK-ES-223] [생각 메모장 93번] 개발 디버그 버튼 프로덕션 완전 소거 및 로컬/디버그 격리 | 0 | 0 | 빈 구획(10) | 0 · 0 · 1 | 1 | 1/0 | 2 | 0 | 0/0 | 1 | 1(1) |
| G040 | 4025~4330 | 306 | 소셜 로그인 (카카오 / 실제 구글 OAuth 연동) | 7 | 2 | 어려움(27) | 0 · 1 · 10 | 0 | 2/7 | 2 | 0 | 2/3 | 0 | 12(3) |
| G041 | 4331~4335 | 5 | [#TASK-ES-224] [생각 메모장 94번] 게스트(둘러보기) 3회 기록 시 안전 백업 넛지 및 카카오 | 0 | 0 | 빈 구획(11) | 0 · 0 · 2 | 2 | 0/0 | 2 | 0 | 0/0 | 3 | 0(0) |
| G042 | 4336~4339 | 4 | [#TASK-ES-224] [생각 메모장 94번] 카카오/소셜/일반 로그인 시 게스트 데이터 100% 무손실 | 0 | 0 | 빈 구획(8) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 4 | 0(0) |
| G043 | 4340~4350 | 11 | Goal category templates | 0 | 1 | 쉬움(8) | 0 · 0 · 2 | 0 | 0/0 | 3 | 0 | 0/0 | 0 | 1(0) |
| G044 | 4351~4360 | 10 | P0: 비밀번호 찾기 (이메일 재설정 링크 발송) | 0 | 1 | 쉬움(5) | 0 · 0 · 1 | 0 | 1/0 | 2 | 0 | 0/0 | 0 | 1(0) |
| G045 | 4361~4368 | 8 | P0: 회원 탈퇴 30일 유예(소프트 삭제) 복구 체크 | 0 | 1 | 보통(14) | 0 · 0 · 4 | 0 | 0/0 | 5 | 0 | 0/0 | 0 | 1(0) |
| G046 | 4369~4545 | 177 | 회원 탈퇴 전용 안내 모달 및 법적책임·데이터분실 사전 안내 (#TASK-ES-158) | 4 | 0 | 보통(25) | 0 · 1 · 6 | 0 | 1/4 | 1 | 0 | 0/2 | 0 | 14(5) |
| G047 | 4546~4552 | 7 | [#TASK-ES-160, #TASK-ES-166, #TASK-ES-180] 각 탭 200% 활용법 및 실제 | 0 | 1 | 보통(11) | 0 · 0 · 2 | 1 | 0/0 | 3 | 0 | 0/0 | 2 | 1(0) |
| G048 | 4553~4556 | 4 | 앱 활용 가이드 다시보기 | 0 | 1 | 쉬움(5) | 0 · 0 · 1 | 0 | 0/0 | 2 | 0 | 0/0 | 0 | 1(0) |
| G049 | 4557~4561 | 5 | 1:1 고객 문의 / 버그 제보 (#TASK-ES-178) | 0 | 1 | 쉬움(8) | 0 · 0 · 2 | 0 | 0/0 | 3 | 0 | 0/0 | 0 | 0(0) |
| G050 | 4562~4571 | 10 | 이용약관 / 개인정보처리방침 열람 리스너 | 0 | 0 | 빈 구획(5) | 0 · 0 · 1 | 0 | 2/0 | 2 | 0 | 0/0 | 0 | 1(0) |
| G051 | 4572~4701 | 130 | Enter app | 1 | 0 | 어려움(58) | 0 · 0 · 21 | 0 | 5/0 | 6 | 0 | 4/3 | 0 | 18(7) |
| G052 | 4702~4705 | 4 | Onboarding (first-time, after signup) — 16종 동물 아바타 & 직관적 안착  | 0 | 0 | 빈 구획(7) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 3 | 0(0) |
| G053 | 4706~4715 | 10 | 3단계: 첫 체크인 튜토리얼 가이드 및 축하 연출 | 0 | 0 | 빈 구획(14) | 0 · 0 · 3 | 3 | 0/0 | 3 | 0 | 0/0 | 2 | 0(0) |
| G054 | 4716~4723 | 8 | 최초 로그인 활용가이드 — 4대 탭 무블러(Zero Blur) 투명 라이브 프리뷰 융합 | 0 | 2 | 보통(10) | 0 · 0 · 1 | 1 | 0/0 | 3 | 0 | 0/0 | 2 | 2(0) |
| G055 | 4724~4731 | 8 | 조선소 블록 레지스트리 6대 메가블록 초기화 (헌법 제3조 제9항) | 0 | 0 | 빈 구획(59) | 0 · 0 · 3 | 2 | 0/0 | 3 | 0 | 0/0 | 48 | 0(0) |
| G056 | 4732~4798 | 67 | Modal helper & Android Hardware Back Handler | 1 | 2 | 어려움(165) | 0 · 0 · 4 | 5 | 0/2 | 2 | 0 | 18/0 | 128 | 5(2) |
| G057 | 4799~4807 | 9 | 이용약관 & 개인정보처리방침 모달 | 0 | 0 | 빈 구획(5) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 1 | 1(0) |
| G058 | 4808~4852 | 45 | 목표 일정 리스케일링 | 1 | 0 | 쉬움(6) | 0 · 0 · 1 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G059 | 4853~4870 | 18 | 프로필 | 0 | 0 | 빈 구획(25) | 0 · 0 · 5 | 4 | 0/0 | 5 | 0 | 0/0 | 6 | 2(0) |
| G060 | 4871~4871 | 1 | 구글 캘린더 연동 | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G061 | 4872~4922 | 51 | [#TASK-ES-153] 전역 7일 유예 통합 휴지통 (Recycle Bin) 시스템 | 2 | 1 | 어려움(36) | 0 · 1 · 8 | 6 | 0/0 | 1 | 0 | 3/0 | 7 | 3(1) |
| G062 | 4923~4932 | 10 | [#TASK-ES-153 & #TASK-ES-155] 캘린더 일자별 배경 사진 지정 모달 | 0 | 0 | 빈 구획(15) | 0 · 0 · 2 | 2 | 0/0 | 2 | 0 | 0/0 | 7 | 0(0) |
| G063 | 4933~5428 | 496 | 캘린더 수동 일정 편집 모달 (Req 2 & #TASK-ES-253) | 1 | 0 | 어려움(34) | 0 · 1 · 18 | 0 | 0/10 | 0 | 0 | 2/3 | 0 | 15(4) |
| G064 | 5429~5450 | 22 | [#TASK-ES-181 & #TASK-ES-182] 폰 잠금화면에서 바로 보기 통합 허브 모달 | 0 | 0 | 빈 구획(74) | 0 · 0 · 12 | 13 | 0/0 | 1 | 0 | 0/1 | 47 | 1(0) |
| G065 | 5451~5706 | 256 | 5대 테마 온톨로지 & 경량 AI 분류기 (TASK-OG-001) | 3 | 4 | 어려움(39) | 0 · 0 · 17 | 0 | 0/0 | 0 | 0 | 2/0 | 0 | 14(5) |
| G066 | 5707~5712 | 6 | Adaptive UX Mode | 0 | 0 | 빈 구획(5) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 1 | 0(0) |
| G067 | 5713~5719 | 7 | Social Crew Pacing (#TASK-ES-228) | 0 | 0 | 빈 구획(17) | 0 · 0 · 4 | 4 | 0/0 | 4 | 0 | 0/0 | 1 | 0(0) |
| G068 | 5720~5742 | 23 | UX Telemetry (Hesitation & Rage Tap) | 0 | 1 | 보통(12) | 0 · 0 · 1 | 2 | 1/0 | 3 | 0 | 0/0 | 3 | 0(0) |
| G069 | 5743~5746 | 4 | iOS 사파리 홈 화면 추가 안내 배너 & 실시간 알림 가이드 (#TASK-ES-234) | 0 | 0 | 빈 구획(5) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 1 | 1(0) |
| G070 | 5747~5788 | 42 | 신규 유저 10초 활성화: 갓생 스타터 목표 템플릿 | 0 | 1 | 쉬움(6) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 4(2) |
| G071 | 5789~6004 | 216 | RENDER: HOME | 1 | 0 | 어려움(81) | 0 · 1 · 28 | 0 | 8/2 | 0 | 0 | 6/6 | 0 | 52(15) |
| G072 | 6005~6150 | 146 | 11인 외부 UI/UX 감시 및 개선팀 핵심 기능 구현 | 3 | 0 | 어려움(37) | 0 · 0 · 10 | 0 | 0/4 | 0 | 0 | 3/2 | 0 | 10(8) |
| G073 | 6151~6159 | 9 | 1순위 대표 목표 AI 초집중 모드 (Focus Auto-Pilot) | 0 | 3 | 쉬움(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G074 | 6160~6170 | 11 | 원터치 퀵 루틴 칩 | 0 | 1 | 쉬움(7) | 0 · 0 · 0 | 0 | 1/0 | 2 | 0 | 0/0 | 0 | 2(1) |
| G075 | 6171~6407 | 237 | 🎙️ 마이크 권한 거부 상태 자가 진단 및 1초 권한 허용 모달 (#TASK-ES-227) | 1 | 0 | 보통(17) | 0 · 0 · 2 | 1 | 1/5 | 1 | 0 | 2/1 | 1 | 9(3) |
| G076 | 6408~6478 | 71 | 음성 체크인 (Web Speech API) | 0 | 0 | 빈 구획(5) | 0 · 0 · 0 | 0 | 6/0 | 1 | 0 | 0/2 | 0 | 2(1) |
| G077 | 6479~6516 | 38 | 사진 인증 & 뷰어 모달 (가상유저 요청 P1) | 0 | 4 | 보통(10) | 0 · 0 · 2 | 0 | 2/2 | 4 | 0 | 0/0 | 0 | 1(0) |
| G078 | 6517~6525 | 9 | 체크인 입력 글자수 힌트 (#TASK-ES-367: 열 수 없던 활동 테마 선택 창·배지 제거, 승인 202 | 0 | 3 | 보통(15) | 0 · 0 · 2 | 0 | 0/0 | 5 | 0 | 0/0 | 0 | 3(1) |
| G079 | 6526~6538 | 13 | AI feedback (best-effort; provider-aware; local fallback) | 0 | 1 | 쉬움(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G080 | 6539~6684 | 146 | [#TASK-ES-225] [생각 메모장 95번] Gemini API 분당 쿼터(Rate Limit 429) | 0 | 4 | 보통(12) | 0 · 0 · 2 | 2 | 0/0 | 2 | 0 | 0/1 | 1 | 2(1) |
| G081 | 6685~6701 | 17 | 맞춤 피드백 봇 설정 | 0 | 0 | 빈 구획(31) | 0 · 0 · 6 | 5 | 3/0 | 7 | 0 | 0/0 | 3 | 2(1) |
| G082 | 6702~6705 | 4 | 목표 & 기록 선택 피드 공유 모달 (전면 고도화) | 0 | 0 | 빈 구획(8) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 4 | 1(0) |
| G083 | 6706~6711 | 6 | [#TASK-ES-301] 피드 게시 모달 내 '미리보기' 토글 직통 헬퍼 | 0 | 0 | 빈 구획(7) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 3 | 1(0) |
| G084 | 6712~6718 | 7 | 외부 데이터 불러오기 (mock) | 0 | 2 | 보통(16) | 0 · 0 · 3 | 0 | 1/0 | 5 | 0 | 0/0 | 0 | 2(1) |
| G085 | 6719~7286 | 568 | [#TASK-ES-174] 목표 템플릿 백과사전 전체화면 팝업 및 상호작용 | 12 | 8 | 어려움(80) | 0 · 1 · 9 | 9 | 9/3 | 20 | 1 | 2/2 | 4 | 15(4) |
| G086 | 7287~7317 | 31 | [#TASK-ES-146] 아워골 평가해주기 90% 팝업 | 0 | 5 | 어려움(46) | 0 · 0 · 8 | 3 | 3/1 | 15 | 0 | 0/0 | 2 | 3(1) |
| G087 | 7318~7327 | 10 | New goal modal | 0 | 0 | 빈 구획(11) | 0 · 0 · 2 | 1 | 0/0 | 2 | 0 | 0/0 | 4 | 2(0) |
| G088 | 7328~7328 | 1 | 참고자료 (유튜브/영상, 이미지, 텍스트 메모, 웹링크) | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G089 | 7329~7337 | 9 | 참고자료 (유튜브/영상, 이미지, 텍스트 메모, 웹링크) | 0 | 0 | 빈 구획(21) | 0 · 0 · 4 | 4 | 0/0 | 1 | 0 | 0/0 | 5 | 3(2) |
| G090 | 7338~7370 | 33 | 목표 AI 생성 전체 템플릿 양식 및 세부 항목 미리보기 (Req 5) | 0 | 1 | 보통(20) | 0 · 0 · 4 | 1 | 3/0 | 7 | 0 | 0/0 | 1 | 1(0) |
| G091 | 7371~7451 | 81 | [#TASK-ES-264] 오늘의 미션 및 AI 피드백 조건부 호출 최적화 | 2 | 0 | 어려움(30) | 0 · 1 · 8 | 1 | 0/1 | 1 | 0 | 2/0 | 0 | 15(5) |
| G092 | 7452~7463 | 12 | 목표 탭 3계층 일정설정 / 디데이·기간 표시 및 캘린더 연동 (#TASK-ES-259, 메모장 03항, # | 0 | 0 | 빈 구획(26) | 0 · 0 · 7 | 7 | 0/0 | 1 | 0 | 0/0 | 7 | 2(1) |
| G093 | 7464~7785 | 322 | [#TASK-ES-220] [생각 메모장 91번] 교대근무자 가변형 루틴 프리셋 & 자동 스케줄러 | 3 | 1 | 어려움(27) | 0 · 0 · 7 | 4 | 0/8 | 4 | 0 | 1/2 | 1 | 8(2) |
| G094 | 7786~7793 | 8 | [#TASK-ES-172] [27] 목표 탭: 데일리 루틴 서브탭 & 편집/상세 모달 | 0 | 0 | 빈 구획(10) | 0 · 0 · 2 | 2 | 0/0 | 1 | 0 | 0/0 | 4 | 1(0) |
| G095 | 7794~7796 | 3 | RENDER: TEMPLATE ENCYCLOPEDIA SUBTAB (#TASK-ES-187) | 0 | 2 | 쉬움(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G096 | 7797~7811 | 15 | [#TASK-ES-189] 템플릿 백과사전 3대 분류(개인·루틴·팀) 및 AI/실유저 2원화 이식 시스템 | 0 | 4 | 어려움(35) | 0 · 0 · 6 | 8 | 0/0 | 8 | 0 | 0/0 | 2 | 4(1) |
| G097 | 7812~7921 | 110 | [UI/UX 틀 개편 Phase 4] 목표 탭 노션급 데이터 관리 & 인지순행 IA (#TASK-UIUX-P | 5 | 0 | 어려움(65) | 0 · 1 · 10 | 12 | 0/0 | 11 | 5 | 0/1 | 4 | 5(2) |
| G098 | 7922~7961 | 40 | [PHASE 5] #TASK-UIUX-PHASE5-RECORDS-CALENDAR FUNCTIONS | 1 | 0 | 보통(15) | 0 · 0 · 3 | 2 | 0/0 | 2 | 1 | 0/1 | 1 | 6(1) |
| G099 | 7962~7971 | 10 | [PHASE 6] #TASK-UIUX-PHASE6-COMM-SETTINGS FUNCTIONS | 0 | 0 | 빈 구획(18) | 0 · 0 · 4 | 4 | 0/0 | 4 | 0 | 0/0 | 2 | 0(0) |
| G100 | 7972~7994 | 23 | [UI/UX 프레임워크 개편 Phase 7] 모바일 하드웨어 인터랙션 & 사용성 하드닝 | 0 | 0 | 빈 구획(23) | 0 · 0 · 5 | 4 | 1/0 | 5 | 0 | 0/0 | 1 | 1(1) |
| G101 | 7995~7997 | 3 | RENDER: GOALS | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G102 | 7998~8257 | 260 | RENDER: 팀 목표 (팀장·매니저만 추가/수정/삭제, 팀원은 보기만) | 17 | 3 | 어려움(54) | 0 · 0 · 15 | 0 | 2/0 | 0 | 0 | 6/3 | 0 | 18(6) |
| G103 | 8258~9018 | 761 | 개인 목표 200% 활용 가이드 & 템플릿 백과사전 (#TASK-ES-135) | 6 | 0 | 어려움(62) | 0 · 0 · 10 | 4 | 18/0 | 4 | 0 | 3/2 | 13 | 22(8) |
| G104 | 9019~9110 | 92 | [#TASK-ES-299] 팀 목표 댓글 작성 및 전송 직통 헬퍼 & 전역 이벤트 위임 (먹통 방어 100% | 0 | 0 | 빈 구획(24) | 0 · 2 · 10 | 1 | 2/0 | 3 | 0 | 0/1 | 3 | 3(0) |
| G105 | 9111~9119 | 9 | TASK-ES-307: 측정지표 다중 선택 및 동시 렌더링 엔진 | 0 | 0 | 빈 구획(10) | 0 · 0 · 2 | 2 | 0/0 | 2 | 0 | 0/0 | 2 | 3(0) |
| G106 | 9120~9121 | 2 | 5대 테마 원형 라이프 밸런스 휠 (SVG Pie Chart) | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G107 | 9122~9403 | 282 | [#TASK-ES-233] 3일 실천 완성 나의 6각 성장 차트 미리보기 SVG 렌더러 | 4 | 0 | 어려움(28) | 0 · 1 · 9 | 0 | 6/0 | 0 | 0 | 2/2 | 0 | 15(5) |
| G108 | 9404~9412 | 9 | ⏱️ 인앱 인터벌 타이머 & 스톱워치 위젯 (In-Table Stopwatch) | 0 | 0 | 빈 구획(8) | 0 · 0 · 2 | 2 | 0/0 | 1 | 0 | 0/0 | 2 | 3(0) |
| G109 | 9413~9824 | 412 | CSV / 엑셀 양방향 연동 & 스마트워치 매핑 & 목표 3각 추적 | 4 | 2 | 쉬움(8) | 0 · 0 · 4 | 0 | 0/13 | 0 | 0 | 1/2 | 0 | 3(1) |
| G110 | 9825~11146 | 1322 | 템플릿 마켓 · 복제 · 전문 템플릿 기록 (TASK-ES-013) | 5 | 0 | 어려움(64) | 0 · 1 · 49 | 0 | 3/49 | 1 | 0 | 2/5 | 0 | 19(3) |
| G111 | 11147~11182 | 36 | [#TASK-ES-358] 기록 탭 렌더 → js/tabs/records/period-ai-card.js · | 0 | 0 | 빈 구획(63) | 0 · 1 · 10 | 7 | 0/0 | 2 | 0 | 0/1 | 40 | 4(0) |
| G112 | 11183~11196 | 14 | 위클리 리캡 카드 (스포티파이 랩드 스타일, 공유 캔버스 인프라 재사용) | 0 | 2 | 보통(25) | 0 · 0 · 7 | 0 | 3/0 | 9 | 0 | 0/0 | 0 | 1(0) |
| G113 | 11197~11197 | 1 | RFC 5545 표준 iCalendar (.ics) 생성 순수 함수 (TASK-BG-11) | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G114 | 11198~11374 | 177 | 캘린더 실시간 구독 URL 생성기 (WebCal Feed & #TASK-ES-252 HMAC 서명) | 1 | 2 | 어려움(37) | 0 · 0 · 3 | 2 | 1/0 | 3 | 0 | 2/0 | 9 | 7(5) |
| G115 | 11375~11423 | 49 | 크리에이터 템플릿 (#TASK-ES-315, 64: 구형 창 영구 제거 및 무해화) | 2 | 0 | 어려움(29) | 0 · 1 · 8 | 1 | 0/0 | 1 | 0 | 3/2 | 4 | 10(3) |
| G116 | 11424~11429 | 6 | 소통 피드 (Supabase feed_posts, 실시간 동기화) | 0 | 1 | 쉬움(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 2(0) |
| G117 | 11430~11439 | 10 | 전역 공유 팀 로더 & 렌더링 (#TASK-ES-133) | 0 | 1 | 보통(9) | 0 · 0 · 1 | 2 | 0/0 | 2 | 0 | 0/0 | 2 | 1(0) |
| G118 | 11440~11449 | 10 | 통합 딥링크 게이트웨이 & 게스트 소프트 뷰어 3종 (js/viral-sharing.js 위임) | 0 | 1 | 보통(10) | 0 · 0 · 2 | 2 | 0/0 | 2 | 0 | 0/0 | 2 | 1(0) |
| G119 | 11450~11457 | 8 | 마니또 실 유저 익명 응원 연동 (#TASK-ES-133, #TASK-ES-145) | 0 | 3 | 보통(10) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 6 | 1(0) |
| G120 | 11458~11482 | 25 | DM & 동반자 소통 시스템 (TASK-ES-105) | 1 | 0 | 보통(17) | 0 · 0 · 3 | 2 | 1/0 | 3 | 0 | 1/0 | 5 | 2(0) |
| G121 | 11483~11492 | 10 | [#TASK-ES-354 CORE-07·SET-07] 설정 탭 렌더 → js/tabs/settings/ren | 0 | 0 | 이음매(옮기지 않음)(22) | 0 · 0 · 5 | 3 | 0/0 | 5 | 0 | 0/0 | 4 | 1(0) |
| G122 | 11493~11513 | 21 | 방해금지 시간대(DND, 조용한 시간) 판별 순수 함수 (TASK-BG-7) | 1 | 0 | 쉬움(7) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 2/0 | 0 | 1(0) |
| G123 | 11514~11569 | 56 | 맥락 기반 다이내믹 알림 문구 생성 | 1 | 0 | 보통(18) | 0 · 0 · 3 | 0 | 0/0 | 0 | 0 | 1/1 | 0 | 7(3) |
| G124 | 11570~11575 | 6 | 4대 연계 뷰 원자적 동시 전파 디스패처 (헌법 제1조 제4항 제5호 & 제15조 제6항 제3호) | 0 | 0 | 빈 구획(31) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 27 | 0(0) |
| G125 | 11576~11579 | 4 | [#TASK-ES-264] 자정(00:00 KST / 현지 표준시) 날짜 변경 감지 및 자동 동기화 워처 | 0 | 1 | 쉬움(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 2(0) |
| G126 | 11580~11592 | 13 | Render all | 1 | 0 | 보통(22) | 0 · 0 · 8 | 0 | 0/0 | 0 | 0 | 5/1 | 0 | 10(3) |
| G127 | 11593~11596 | 4 | 세션 복구 및 안전 앱 진입 유틸 | 0 | 1 | 쉬움(3) | 0 · 0 · 1 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 0(0) |
| G128 | 11597~11609 | 13 | #TASK-AUTH-P0-SAFETY: 로그인/계정 보안 패키지 모듈 연결 | 0 | 0 | 빈 구획(7) | 0 · 0 · 5 | 0 | 0/0 | 1 | 0 | 0/3 | 0 | 0(0) |
| G129 | 11610~11837 | 228 | Boot | 0 | 0 | 빈 구획(26) | 0 · 1 · 10 | 0 | 0/0 | 1 | 0 | 0/5 | 0 | 11(4) |
| G130 | 11838~11840 | 3 | #TASK-ES-015 FIX: 공용 크레딧 모듈(js/credits.js)에 앱 sb 주입 | 0 | 0 | 빈 구획(3) | 0 · 0 · 1 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 1(0) |
| G131 | 11841~11854 | 14 | KF-7 #TASK-ES-014: 반응 4종 모듈(js/reactions.js)에 앱 핸들 연결 | 0 | 0 | 빈 구획(14) | 0 · 0 · 9 | 0 | 0/0 | 1 | 0 | 0/2 | 0 | 4(1) |
| G132 | 11855~11859 | 5 | KF-4 #TASK-ES-018: 카테고리별 도움이 된 글 슬롯 모듈(js/top-helpful.js) | 0 | 0 | 빈 구획(3) | 0 · 0 · 1 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 1(0) |
| G133 | 11860~11868 | 9 | KF-5 #TASK-ES-016: 도움돼요 이유 모듈(js/helpful-reason.js)에 앱 핸들 연결 | 0 | 0 | 빈 구획(11) | 0 · 0 · 6 | 0 | 0/0 | 1 | 0 | 0/2 | 0 | 3(1) |
| G134 | 11869~11876 | 8 | #TASK-ES-105: 팀 초대 및 소통/DM/동반자 모듈(js/team-invite-comm.js) 연결 | 0 | 0 | 빈 구획(22) | 0 · 0 · 11 | 0 | 0/0 | 1 | 0 | 0/3 | 0 | 8(3) |
| G135 | 11877~11885 | 9 | #TASK-ES-105: 팀 연계 개인목표 및 상호 체크 모듈(js/team-linked-goals.js)  | 0 | 0 | 빈 구획(27) | 0 · 0 · 14 | 0 | 0/0 | 2 | 0 | 0/4 | 0 | 5(3) |
| G136 | 11886~11890 | 5 | KF-2 #TASK-ES-017: 템플릿 복제 크레딧 모듈(js/template-credit.js)에 앱 핸 | 0 | 0 | 빈 구획(4) | 0 · 0 · 2 | 0 | 0/0 | 1 | 0 | 0/1 | 0 | 1(0) |
| G137 | 11891~11933 | 43 | PWA: Service Worker 등록 및 자동 업데이트 감지 (#TASK-ES-118) | 0 | 0 | 빈 구획(222) | 0 · 0 · 10 | 8 | 5/0 | 10 | 0 | 0/2 | 181 | 4(1) |

## 5. 묶음별 의존 상세 (옮길 대상만, 권장 순서)

### G079 AI feedback (best-effort; provider-aware; local fallback)

- 6526~6538줄(13줄) · 쉬움(0)
- 함수(0): 없음
- 변수(1): THEME_FEEDBACK_PROMPTS
- 시험지 글자 의존: scripts/smoke-test.js

### G073 1순위 대표 목표 AI 초집중 모드 (Focus Auto-Pilot)

- 6151~6159줄(9줄) · 쉬움(0)
- 함수(0): 없음
- 변수(3): focusTimerInterval, focusTimerRunning, focusTimerSeconds
- 시험지 글자 의존: scripts/smoke-test.js

### G029 [78 / 89] 데이터분석 프롬프트 백과사전 (실사용 유저 등록·피드 게시 및 도움돼요 상호작용)

- 3846~3852줄(7줄) · 쉬움(0)
- 함수(0): 없음
- 변수(2): _promptEncyclopediaOpen, _promptTabState
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js

### G116 소통 피드 (Supabase feed_posts, 실시간 동기화)

- 11424~11429줄(6줄) · 쉬움(0)
- 함수(0): 없음
- 변수(1): FEED_POSTS_CACHE
- 시험지 글자 의존: scripts/smoke-test.js, tests/guest-null-client-es377.test.js

### G125 [#TASK-ES-264] 자정(00:00 KST / 현지 표준시) 날짜 변경 감지 및 자동 동기화 워처

- 11576~11579줄(4줄) · 쉬움(0)
- 함수(0): 없음
- 변수(1): _lastObservedDateKey
- 시험지 글자 의존: scripts/smoke-test.js, tests/ai-conditional-call-optimization.test.js

### G095 RENDER: TEMPLATE ENCYCLOPEDIA SUBTAB (#TASK-ES-187)

- 7794~7796줄(3줄) · 쉬움(0)
- 함수(0): 없음
- 변수(2): _subtabTplCat, _subtabTplQuery

### G127 세션 복구 및 안전 앱 진입 유틸

- 11593~11596줄(4줄) · 쉬움(3)
- 함수(0): 없음
- 변수(1): _isEnteringApp
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindLoginRescueButtons
- 로드 중 문 1: 호출 1

### G017 아워골 앱 환경설정

- 3288~3312줄(25줄) · 쉬움(5)
- 함수(0): 없음
- 변수(1): OURGOAL_CONFIG
- 로드 중 문 1: IfStatement 1
- window 노출(1줄): OURGOAL_CONFIG
- 바깥 js 가 window 이름을 씀: js/credits.js, js/streaks.js
- 시험지 글자 의존: scripts/smoke-test.js

### G044 P0: 비밀번호 찾기 (이메일 재설정 링크 발송)

- 4351~4360줄(10줄) · 쉬움(5)
- 함수(0): 없음
- 변수(1): fpBtn
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: openForgotPasswordModal
- 로드 중 문 2: var 초기값 실행 1 · IfStatement 1
- 이벤트 처리기: addEventListener 1 · on<이벤트> 대입 0
- 시험지 글자 의존: scripts/smoke-test.js

### G048 앱 활용 가이드 다시보기

- 4553~4556줄(4줄) · 쉬움(5)
- 함수(0): 없음
- 변수(1): guideBtn
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindRestartGuideButton
- 로드 중 문 2: var 초기값 실행 1 · 호출 1
- 시험지 글자 의존: scripts/smoke-test.js

### G058 목표 일정 리스케일링

- 4808~4852줄(45줄) · 쉬움(6)
- 함수(1): rescaleGoal
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: pad
- 시험지 글자 의존: scripts/smoke-test.js
- smoke-test FN_NAMES: rescaleGoal — 옮기려면 시험지 선행 PR 먼저

### G070 신규 유저 10초 활성화: 갓생 스타터 목표 템플릿

- 5747~5788줄(42줄) · 쉬움(6)
- 함수(0): 없음
- 변수(1): STARTER_GOAL_TEMPLATES
- 시험지 글자 의존: scripts/smoke-test.js, tests/ai-conditional-call-optimization.test.js, tests/goal-ai-advice-status.test.js, tests/team-level-management.test.js (index.html 단독 읽기: tests/goal-ai-advice-status.test.js, tests/team-level-management.test.js)

### G122 방해금지 시간대(DND, 조용한 시간) 판별 순수 함수 (TASK-BG-7)

- 11493~11513줄(21줄) · 쉬움(7)
- 함수(1): isWithinDND
- 부르는 묶음(들어옴): G010×1, G123×1
- 시험지 글자 의존: scripts/smoke-test.js
- smoke-test FN_NAMES: isWithinDND — 옮기려면 시험지 선행 PR 먼저

### G074 원터치 퀵 루틴 칩

- 6160~6170줄(11줄) · 쉬움(7)
- 함수(0): 없음
- 변수(1): qRoutineRow
- 로드 중 문 2: var 초기값 실행 1 · IfStatement 1
- 이벤트 처리기: addEventListener 1 · on<이벤트> 대입 0
- 시험지 글자 의존: scripts/smoke-test.js, tests/theme-system-v4.test.js (index.html 단독 읽기: tests/theme-system-v4.test.js)

### G005 [#TASK-ES-453] 인라인 스크립트 세포화 P1 이음매 3 — 목표 종합상황 AI 요약 새로 고침 (docs/architecture/INLINE-SCRIP

- 2452~2459줄(8줄) · 쉬움(7)
- 함수(0): 없음
- 변수(1): refreshGoalStatusSummary
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: _goalsKit, generateGoalStatusSummary
- 로드 중 문 1: 호출 1
- 시험지 글자 의존: scripts/smoke-test.js, tests/ai-conditional-call-optimization.test.js, tests/goal-ai-advice-status.test.js (index.html 단독 읽기: tests/goal-ai-advice-status.test.js)

### G109 CSV / 엑셀 양방향 연동 & 스마트워치 매핑 & 목표 3각 추적

- 9413~9824줄(412줄) · 쉬움(8)
- 함수(4): compressImageForVision, decrementVisionDailyQuota, getVisionDailyQuota, openVisionTableModal
- 변수(2): CURATED_MARKET_TEMPLATES, VISION_DAILY_LIMIT
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: closeModal, escapeHtml, fmtYYMMDD, state
- 이벤트 처리기: addEventListener 0 · on<이벤트> 대입 13
- 부르는 묶음(들어옴): G110×1
- 부르는 대상(나감): G019×6, G056×1
- 시험지 글자 의존: scripts/smoke-test.js, tests/push-subscribe-auth-es400.test.js, tests/security-audit.test.js (index.html 단독 읽기: tests/security-audit.test.js)

### G043 Goal category templates

- 4340~4350줄(11줄) · 쉬움(8)
- 함수(0): 없음
- 변수(1): authTabButtons
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindAuthTabButtons, bindSignupSubmit
- 로드 중 문 3: var 초기값 실행 1 · 호출 2
- 시험지 글자 의존: scripts/smoke-test.js

### G049 1:1 고객 문의 / 버그 제보 (#TASK-ES-178)

- 4557~4561줄(5줄) · 쉬움(8)
- 함수(0): 없음
- 변수(1): footEmailEl
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindInquiryButtons, bindSupportEmailLink
- 로드 중 문 3: 호출 2 · var 초기값 실행 1

### G117 전역 공유 팀 로더 & 렌더링 (#TASK-ES-133)

- 11430~11439줄(10줄) · 보통(9)
- 함수(0): 없음
- 변수(1): SHARED_GROUPS_LOADED
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: loadSharedGroups
- 로드 중 문 2: IfStatement 2
- window 노출(2줄): SHARED_GROUPS_LOADED, loadSharedGroups
- 바깥 js 가 window 이름을 씀: js/tabs/comm/shared-groups.js, js/tabs/goals/team-goals-screen.js
- 시험지 글자 의존: scripts/smoke-test.js

### G077 사진 인증 & 뷰어 모달 (가상유저 요청 P1)

- 6479~6516줄(38줄) · 보통(10)
- 함수(0): 없음
- 변수(4): capturePhotoBtn, capturePhotoInput, capturePhotoPreview, pendingCapturePhoto
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: compressImage, openPhotoViewerModal
- 로드 중 문 4: var 초기값 실행 3 · IfStatement 1
- 이벤트 처리기: addEventListener 2 · on<이벤트> 대입 2
- 시험지 글자 의존: scripts/smoke-test.js

### G008 [#TASK-ES-444] 인라인 스크립트 세포화 P1 이음매 2 — 일정 배경·잠금화면 라이브, 소통 창·스토리 캔버스, 사진 인증, 목표 스타터·로컬 문장, 

- 2498~2530줄(33줄) · 보통(10)
- 함수(0): 없음
- 변수(23): _recordHesitation, buildLockScreenCardPayload, closeLockScreenLiveCard, closePwaInstallGuideModal, compressImage, confirmPwaInstall, generateMzStoryCanvas, initKeyboardShield, localNextActionSuggestion, localTodayMission, openCalendarDayBgPickerModal, openIosPwaInstallGuideModal, openPhotoViewerModal, openPwaInstallGuideModal, quickCreateStarterGoal, renderAdaptiveModeBar, renderHomeGrassSummary, renderIosPwaBanner, switchPwaOsTab, switchUxMode 외 3
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: SIM_PERSONAS, STARTER_GOAL_TEMPLATES, _calendarKit, _commKit, _goalsKit, _recordsKit, _settingsKit, _uxTelemetry
- 로드 중 문 1: 호출 1
- 부르는 대상(나감): G072×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js, tests/account-switch-isolation.test.js, tests/direct-login-guard.test.js, tests/feed-post-preview-modal.test.js

### G118 통합 딥링크 게이트웨이 & 게스트 소프트 뷰어 3종 (js/viral-sharing.js 위임)

- 11440~11449줄(10줄) · 보통(10)
- 함수(0): 없음
- 변수(1): checkAndHandlePeerInviteUrl
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: MANITO_WELCOME_STAMPS, handleDeepLinkRouting
- 로드 중 문 2: IfStatement 2
- window 노출(2줄): MANITO_STAMP_COOLDOWN, MANITO_WELCOME_STAMPS
- 바깥 js 가 window 이름을 씀: js/tabs/comm/manito-basics.js, js/tabs/comm/manito-real.js
- 시험지 글자 의존: scripts/smoke-test.js

### G025 #TASK-ES-165: 앱 진입 아바타 인사 팝업 (화면 절반 크기 & 시간대별 멘트)

- 3505~3512줄(8줄) · 보통(10)
- 함수(0): 없음
- 변수(1): __avatarGreetTimer
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: closeAvatarGreetingPopup, openAvatarGreetingPopup
- 로드 중 문 2: window 노출 2
- window 노출(2줄): closeAvatarGreetingPopup, openAvatarGreetingPopup
- 바깥 js 가 window 이름을 씀: js/tabs/settings/avatar-greeting.js, js/tabs/settings/sub-profile.js
- 시험지 글자 의존: scripts/smoke-test.js

### G054 최초 로그인 활용가이드 — 4대 탭 무블러(Zero Blur) 투명 라이브 프리뷰 융합

- 4716~4723줄(8줄) · 보통(10)
- 함수(0): 없음
- 변수(2): navButtons, screens
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: startFirstLoginGuide
- 로드 중 문 3: window 노출 1 · var 초기값 실행 2
- window 노출(1줄): startFirstLoginGuide
- 바깥 js 가 window 이름을 씀: js/tabs/settings/first-login-guide.js, js/tabs/settings/guide-buttons.js
- 시험지 글자 의존: scripts/smoke-test.js, tests/hidden-entry-guard.test.js

### G119 마니또 실 유저 익명 응원 연동 (#TASK-ES-133, #TASK-ES-145)

- 11450~11457줄(8줄) · 보통(10)
- 함수(0): 없음
- 변수(3): MANITO_SERVER_LOADED, REAL_MANITO_INBOX_CACHE, REAL_MANITO_PARTNERS_CACHE
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: isValidRealUser
- 로드 중 문 1: window 노출 1
- window 노출(1줄): isValidRealUser
- 바깥 js 가 window 이름을 씀: js/tabs/comm/manito-real.js, js/tabs/records/first-checkin-tutorial.js, js/tabs/settings/guest-backup-nudge.js, js/tabs/settings/guest-migration.js, js/team-dm-room.js, js/team-profile.js
- 시험지 글자 의존: scripts/smoke-test.js

### G016 Supabase

- 3278~3287줄(10줄) · 보통(11)
- 함수(0): 없음
- 변수(4): SUPABASE_ANON_KEY, SUPABASE_URL, _pendingAuthSession, sb
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindSupabaseAuthStateListener, getSupabaseAuthToken
- 로드 중 문 2: 호출 1 · IfStatement 1
- window 노출(1줄): getSupabaseAuthToken
- 바깥 js 가 window 이름을 씀: js/core/supabase-auth.js, js/tabs/comm/dm-ledger.js, js/tabs/records/export-theme.js, js/tabs/settings/web-push.js
- 시험지 글자 의존: tests/logout-scope-es399.test.js

### G047 [#TASK-ES-160, #TASK-ES-166, #TASK-ES-180] 각 탭 200% 활용법 및 실제 우수 사용사례 쇼케이스 (최신 기능 전면 동기화)

- 4546~4552줄(7줄) · 보통(11)
- 함수(0): 없음
- 변수(1): tabGuideBtn
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindTabGuideHubButton, openTabGuideHubModal
- 로드 중 문 3: window 노출 1 · var 초기값 실행 1 · 호출 1
- window 노출(1줄): openTabGuideHubModal
- 바깥 js 가 window 이름을 씀: js/tabs/settings/guide-buttons.js, js/tabs/settings/tab-guide.js
- 시험지 글자 의존: scripts/smoke-test.js

### G080 [#TASK-ES-225] [생각 메모장 95번] Gemini API 분당 쿼터(Rate Limit 429) 방어 및 지수 백오프 큐

- 6539~6684줄(146줄) · 보통(12)
- 함수(0): 없음
- 변수(4): DONE_KEYWORDS, GeminiQuotaDispatcher, PREMIUM_FEEDBACK_CATALOG, requestClaudeFeedback
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: requestServerAIFeedback, state
- 로드 중 문 2: window 노출 2
- window 노출(2줄): GeminiQuotaDispatcher, PREMIUM_FEEDBACK_CATALOG
- 부르는 대상(나감): G019×4
- 바깥 js 가 window 이름을 씀: js/tabs/records/ai-feedback-providers.js
- 시험지 글자 의존: scripts/smoke-test.js, tests/google-session-guard.test.js (index.html 단독 읽기: tests/google-session-guard.test.js)

### G012 [#TASK-ES-446] 인라인 스크립트 세포화 P2-1 이음매 (docs/architecture/INLINE-SCRIPT-MAP.md 지도 · docs/spe

- 3115~3138줄(24줄) · 보통(12)
- 함수(0): 없음
- 변수(9): buildRecordCardHtml, handleConversationalRecord, openProCoachReportModal, openProNotionExportModal, pushRecordToNotion, renderAnalyticsHtml, renderRecordHeatmap, renderReportSummary, renderTrendSvgChart
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: HEATMAP_LEVELS, HEATMAP_WEEKS, _recordsKit, computeTableAnalytics, heatmapLevel, maybeShowGoalUpdateModal, openRecordModal, renderFeedbackSlot, requestAIFeedback, resizeImageToDataUrl
- 로드 중 문 1: 호출 1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js

### G068 UX Telemetry (Hesitation & Rage Tap)

- 5720~5742줄(23줄) · 보통(12)
- 함수(0): 없음
- 변수(1): _uxTelemetry
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: _recordHesitation
- 로드 중 문 3: window 노출 2 · IfStatement 1
- window 노출(2줄): _recordHesitation, _uxTelemetry
- 이벤트 처리기: addEventListener 1 · on<이벤트> 대입 0
- 바깥 js 가 window 이름을 씀: js/tabs/comm/crew-pacing.js, js/tabs/goals/result-modal.js, js/tabs/settings/adaptive-ux.js

### G045 P0: 회원 탈퇴 30일 유예(소프트 삭제) 복구 체크

- 4361~4368줄(8줄) · 보통(14)
- 함수(0): 없음
- 변수(1): resyncBtn
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindLoginSubmit, bindLogoutButton, bindResetButton, bindResyncAccountDataButton
- 로드 중 문 5: 호출 4 · var 초기값 실행 1
- 시험지 글자 의존: scripts/smoke-test.js

### G098 [PHASE 5] #TASK-UIUX-PHASE5-RECORDS-CALENDAR FUNCTIONS

- 7922~7961줄(40줄) · 보통(15)
- 함수(1): exportRecordsCsv
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: state, toggleRecordArchive, triggerHapticFeedback
- 로드 중 문 2: window 노출 2
- window 노출(2줄): exportRecordsCsv, toggleRecordArchive
- 인라인 on*="…" 이 부르는 함수: exportRecordsCsv
- 부르는 대상(나감): G019×6
- 바깥 js 가 window 이름을 씀: js/tabs/records/archive-toggle.js
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js, tests/account-switch-isolation.test.js, tests/direct-login-guard.test.js, tests/goals-smart-attachments.test.js, tests/module-guard.test.js (index.html 단독 읽기: tests/goals-smart-attachments.test.js)

### G078 체크인 입력 글자수 힌트 (#TASK-ES-367: 열 수 없던 활동 테마 선택 창·배지 제거, 승인 2026-10-04)

- 6517~6525줄(9줄) · 보통(15)
- 함수(0): 없음
- 변수(3): capInput, liveCount, liveMeta
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindCaptureLiveMeta, bindCaptureSave
- 로드 중 문 5: var 초기값 실행 3 · 호출 2
- 시험지 글자 의존: scripts/smoke-test.js, tests/module-guard.test.js, tests/theme-system-v4.test.js (index.html 단독 읽기: tests/theme-system-v4.test.js)

### G038 2계정 상호작용 테스트 (테스터 B 직통 입장: #TASK-ES-169)

- 4008~4015줄(8줄) · 보통(15)
- 함수(0): 없음
- 변수(2): authTesterBBtn, landTesterBBtn
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindAuthTesterBButton, bindLandTesterBButton, enterAsTesterB
- 로드 중 문 5: IfStatement 1 · var 초기값 실행 2 · 호출 2
- window 노출(1줄): enterAsTesterB
- 바깥 js 가 window 이름을 씀: js/tabs/settings/tester-entry.js
- 시험지 글자 의존: scripts/smoke-test.js

### G084 외부 데이터 불러오기 (mock)

- 6712~6718줄(7줄) · 보통(16)
- 함수(0): 없음
- 변수(2): btnShowGuide, topBtnGuide
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindImportExternalBtn, bindPersonalGuideBtn, state
- 로드 중 문 5: 호출 2 · var 초기값 실행 2 · IfStatement 1
- 이벤트 처리기: addEventListener 1 · on<이벤트> 대입 0
- 시험지 글자 의존: scripts/smoke-test.js, tests/top-page-guide-reposition.test.js (index.html 단독 읽기: tests/top-page-guide-reposition.test.js)

### G075 🎙️ 마이크 권한 거부 상태 자가 진단 및 1초 권한 허용 모달 (#TASK-ES-227)

- 6171~6407줄(237줄) · 보통(17)
- 함수(1): openMicPermissionGuideModal
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: triggerHaptic, triggerHapticFeedback
- 로드 중 문 1: window 노출 1
- window 노출(1줄): openMicPermissionGuideModal
- 이벤트 처리기: addEventListener 1 · on<이벤트> 대입 5
- 부르는 묶음(들어옴): G076×8, G010×1
- 부르는 대상(나감): G019×2
- 바깥 js 가 window 이름을 씀: js/tabs/records/voice-table-input.js
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-all-clicks.js, tests/goals-schedule-sync.test.js, tests/guest-null-client-es377.test.js, tests/hidden-entry-guard.test.js, tests/records-tab-rename.test.js, tests/stopwatch-lap-inputs.test.js, tests/team-goal-guide-hint.test.js 외 1 (index.html 단독 읽기: tests/goals-schedule-sync.test.js, tests/team-goal-guide-hint.test.js, tests/theme-system-v4.test.js)

### G120 DM & 동반자 소통 시스템 (TASK-ES-105)

- 11458~11482줄(25줄) · 보통(17)
- 함수(1): openUserProfileModal
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: openCustomerInquiryModal, openItemReportModal, openWidgetSettingsModal
- 로드 중 문 3: IfStatement 2 · 호출 1
- window 노출(2줄): openCustomerInquiryModal, openItemReportModal
- 이벤트 처리기: addEventListener 1 · on<이벤트> 대입 0
- 부르는 묶음(들어옴): G010×1
- 바깥 js 가 window 이름을 씀: js/core/profile-topbar.js, js/tabs/settings/sub-data.js, js/tabs/settings/sub-integrations.js, js/tabs/settings/support-inquiry-bind.js, js/tabs/settings/support-modals.js
- 시험지 글자 의존: scripts/smoke-test.js, tests/desktop-widget-suite.test.js

### G123 맥락 기반 다이내믹 알림 문구 생성

- 11514~11569줄(56줄) · 보통(18)
- 함수(1): generateDynamicNotification
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: MOCK_GROUPS, dateKey, pad
- 부르는 묶음(들어옴): G001×1
- 부르는 대상(나감): G122×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js, tests/core-confirm-es376.test.js, tests/dm-push-auth-es397.test.js, tests/goals-schedule-sync.test.js, tests/record-ledger-sync.test.js, tests/xp-server-ledger-es421.test.js (index.html 단독 읽기: tests/goals-schedule-sync.test.js, tests/record-ledger-sync.test.js, tests/xp-server-ledger-es421.test.js)
- smoke-test FN_NAMES: generateDynamicNotification — 옮기려면 시험지 선행 PR 먼저

### G090 목표 AI 생성 전체 템플릿 양식 및 세부 항목 미리보기 (Req 5)

- 7338~7370줄(33줄) · 보통(20)
- 함수(0): 없음
- 변수(1): toggleAgentBtn
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindArchivedPageSetter, bindArchivedPeriodSetter, sendGoalAgentMessage, showGoalAgentReviewStep
- 로드 중 문 7: window 노출 1 · var 초기값 실행 1 · IfStatement 1 · 호출 4
- window 노출(1줄): showGoalAgentReviewStep
- 이벤트 처리기: addEventListener 3 · on<이벤트> 대입 0
- 바깥 js 가 window 이름을 씀: js/tabs/goals/ai-agent.js
- 시험지 글자 의존: scripts/smoke-test.js

### G035 서버 관리자 API를 통한 기록 및 프로필 복구 (#TASK-ES-036)

- 3882~3994줄(113줄) · 보통(21)
- 함수(1): syncServerRecords
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: getSupabaseAuthToken, getTrashList, renderCalendarScreen, renderRecordsScreen, renderSettingsScreen, saveLocalSettings, state
- 부르는 묶음(들어옴): G002×1, G129×1
- 부르는 대상(나감): G071×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js, tests/account-switch-isolation.test.js, tests/direct-login-guard.test.js, tests/dm-push-auth-es397.test.js, tests/gcal-login-reconnect-fix.test.js, tests/logout-scope-es399.test.js, tests/module-guard.test.js 외 4 (index.html 단독 읽기: tests/gcal-login-reconnect-fix.test.js, tests/record-ledger-sync.test.js, tests/security-audit.test.js, tests/sync-server-records-render-home.test.js)

### G011 [#TASK-ES-436] 인라인 스크립트 세포화 P1 이음매 1 — 목표 AI·일정 설정, 기록 AI 피드백 (docs/architecture/INLINE-SC

- 3081~3114줄(34줄) · 보통(21)
- 함수(0): 없음
- 변수(15): applyScheduleUpdate, celebrateMilestoneDone, computeGoalStatusHash, formatSchedulePillHtml, generateGoalStatusSummary, initFeedbackTierBar, localGoalStatusSummary, milestonesForAI, openScheduleSetupModal, requestAIFeedback, requestServerAIFeedback, requestTodayMission, sanitizeAttachments, sendGoalAgentMessage, showGoalAgentReviewStep
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: DONE_KEYWORDS, GeminiQuotaDispatcher, THEME_FEEDBACK_PROMPTS, TOPICS, _goalsKit, _recordsKit, applyGoalAgentOp, dispatchFullViewPropagation, fbBotBubbleHtml, localNextActionSuggestion, localTodayMission, normalizeSequentialMilestoneDates 외 1
- 로드 중 문 1: 호출 1
- 부르는 대상(나감): G065×1
- 시험지 글자 의존: scripts/smoke-test.js, tests/ai-conditional-call-optimization.test.js, tests/goal-ai-advice-status.test.js, tests/goals-schedule-sync.test.js (index.html 단독 읽기: tests/goal-ai-advice-status.test.js, tests/goals-schedule-sync.test.js)

### G020 8대 화면 스타일 (테마) 정의

- 3344~3359줄(16줄) · 보통(21)
- 함수(0): 없음
- 변수(1): THEMES
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: applyTheme
- 로드 중 문 1: IfStatement 1
- window 노출(2줄): THEMES, applyTheme
- 바깥 js 가 window 이름을 씀: js/components-settings-actions.js, js/sanctuary-v3-engine.js, js/tabs/settings/sub-appearance.js, js/tabs/settings/theme-apply.js
- 시험지 글자 의존: scripts/smoke-test.js, tests/account-switch-isolation.test.js, tests/comm-ai-identity-es348.test.js, tests/direct-login-guard.test.js, tests/dm-push-auth-es397.test.js, tests/feed-ai-bot-reduction.test.js, tests/google-session-guard.test.js, tests/hidden-entry-guard.test.js 외 2 (index.html 단독 읽기: tests/comm-ai-identity-es348.test.js, tests/google-session-guard.test.js, tests/team-goal-guide-hint.test.js, tests/theme-system-v4.test.js)

### G126 Render all

- 11580~11592줄(13줄) · 보통(22)
- 함수(1): renderAll
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: renderCalendarScreen, renderCommScreen, renderGoalsScreen, renderRecordsScreen, renderSettingsScreen, setupDateRolloverWatcher, state, updateTopBar
- 부르는 묶음(들어옴): G129×2, G001×1, G051×1, G071×1, G115×1
- 부르는 대상(나감): G071×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-calendar-attachments.js, scripts/test-shipyard-modular.js, tests/ai-conditional-call-optimization.test.js, tests/app-evaluation-notice.test.js, tests/device-session-control.test.js, tests/goal-template-legacy-cleanup.test.js, tests/team-creation-clean.test.js 외 2 (index.html 단독 읽기: scripts/test-calendar-attachments.js, tests/app-evaluation-notice.test.js, tests/unique-display-name.test.js)

### G013 [#TASK-ES-448] 인라인 스크립트 세포화 P2-2 이음매 (docs/architecture/INLINE-SCRIPT-MAP.md 지도 · docs/spe

- 3139~3203줄(65줄) · 보통(23)
- 함수(0): 없음
- 변수(43): CREATOR_TEMPLATES, EXTERNAL_DATA, MANITO_EMOJI, MANITO_STAMPS, MANITO_WELCOME_STAMPS, MOCK_PEOPLE, SHARE_PLATFORMS, SIM_PERSONAS, TOPICS, VISIBILITY_LABELS, buildInviteLinkSuffix, categoryPickerHtml, daysFromNow, drawShareWatermark, ensureFeedPostsLoaded, genAnonName, generateShareImage, groupCheckedToday, groupState, groupStreak 외 23
- 다른 묶음 상태 — 대입: FEED_POSTS_CACHE · 변경: 없음 · 읽기: FEED_POSTS_CACHE, MOCK_GROUPS, _commKit, _goalsKit, _recordsKit, _settingsKit, getFeedComments, openRecordModal, setFeedComments
- 로드 중 문 2: 호출 1 · TryStatement 1
- 부르는 대상(나감): G085×1, G107×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js, tests/desktop-widget-suite.test.js, tests/guest-null-client-es377.test.js, tests/hidden-entry-guard.test.js, tests/stopwatch-lap-inputs.test.js, tests/stopwatch-table-hint.test.js, tests/team-fold-state-es409.test.js 외 2 (index.html 단독 읽기: tests/team-fold-state-es409.test.js, tests/theme-system-v4.test.js)

### G014 [#TASK-ES-437] 인라인 스크립트 세포화 P0 이음매 (docs/architecture/INLINE-SCRIPT-MAP.md 지도 · docs/specs

- 3204~3239줄(36줄) · 보통(23)
- 함수(0): 없음
- 변수(20): applyAppSettings, applyQuickCunningText, applyTheme, checkGuestBackupNudge, checkPendingDeletionRestore, checkStreakFreeze, closeAvatarGreetingPopup, gaugeSvg, importTemplateInstantly, initRememberedAuthFields, openAvatarGreetingPopup, openChangePasswordModal, openGuestBackupNudgeModal, openTeamInviteModal, openTeamLinkedPersonalGoalModal, sendToNotion, showCommTourModal, showLegalModal, showLevelUpBanner, templateMilestones
- 다른 묶음 상태 — 대입: __avatarGreetTimer · 변경: 없음 · 읽기: GOAL_TEMPLATES, MOCK_GROUPS, __avatarGreetTimer, _goalsKit, _recordsKit, _settingsKit, isValidRealUser, maybeApplyStreakFreeze, maybeGrantAvatarCraftBonus, maybeGrantStreakFreeze, openAvatarLevelUpModal
- 로드 중 문 1: 호출 1
- 부르는 대상(나감): G040×1, G085×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js, tests/account-switch-isolation.test.js, tests/direct-login-guard.test.js, tests/google-session-guard.test.js, tests/logout-scope-es399.test.js, tests/theme-system-v4.test.js (index.html 단독 읽기: tests/google-session-guard.test.js, tests/theme-system-v4.test.js)

### G037 [#TASK-ES-222] [생각 메모장 92번] 카카오톡 인앱 브라우저 감지 및 Android Chrome 자동 탈출 & iOS Safari 플로팅 가이드 배너

- 3996~4007줄(12줄) · 보통(24)
- 함수(0): 없음
- 변수(2): landGuestBtn, landNickQuickLink
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindLandGuestBtn, bindLandLoginLink, bindLandNickQuickLink, checkKakaoInAppBrowser, escapeKakaoInAppBrowser
- 로드 중 문 8: 호출 4 · window 노출 2 · var 초기값 실행 2
- window 노출(2줄): checkKakaoInAppBrowser, escapeKakaoInAppBrowser
- 바깥 js 가 window 이름을 씀: js/tabs/settings/inapp-landing.js
- 시험지 글자 의존: scripts/smoke-test.js

### G046 회원 탈퇴 전용 안내 모달 및 법적책임·데이터분실 사전 안내 (#TASK-ES-158)

- 4369~4545줄(177줄) · 보통(25)
- 함수(4): closeWithdrawModal, openWithdrawModal, submitWithdrawAccount, withdrawAccount
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: closeModal, initRememberedAuthFields, saveProfile, sb, state, updateAppBadge
- 로드 중 문 1: 호출 1
- 이벤트 처리기: addEventListener 1 · on<이벤트> 대입 4
- 부르는 대상(나감): G019×6, G056×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-all-clicks.js, scripts/verify-integrity-gate.js, tests/account-switch-isolation.test.js, tests/account-withdrawal-modal.test.js, tests/core-toast-es361.test.js, tests/dev-host-gate.test.js, tests/direct-login-guard.test.js 외 6 (index.html 단독 읽기: tests/account-withdrawal-modal.test.js, tests/core-toast-es361.test.js, tests/gcal-login-reconnect-fix.test.js, tests/google-session-guard.test.js, tests/security-audit.test.js)

### G112 위클리 리캡 카드 (스포티파이 랩드 스타일, 공유 캔버스 인프라 재사용)

- 11183~11196줄(14줄) · 보통(25)
- 함수(0): 없음
- 변수(2): btnOpenTt, staticPulseBar
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindRecCarouselPills, bindRecDocumentClick, bindRecPulseBar, bindRecTimeTrackerBtn, openRecordModal, openWeeklyRecapModal, renderRecordsScreen
- 로드 중 문 9: 호출 7 · var 초기값 실행 2
- 이벤트 처리기: addEventListener 3 · on<이벤트> 대입 0
- 시험지 글자 의존: scripts/smoke-test.js

### G093 [#TASK-ES-220] [생각 메모장 91번] 교대근무자 가변형 루틴 프리셋 & 자동 스케줄러

- 7464~7785줄(322줄) · 어려움(27)
- 함수(3): applyShiftWorkRoutines, openShiftCycleModal, openShiftWorkCustomModal
- 변수(1): SHIFT_WORK_PRESETS
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: closeModal, dateKey, escapeHtml, renderRoutineGoalsScreen, saveProfile, state, triggerHaptic
- 로드 중 문 4: window 노출 4
- window 노출(4줄): SHIFT_WORK_PRESETS, applyShiftWorkRoutines, openShiftCycleModal, openShiftWorkCustomModal
- 이벤트 처리기: addEventListener 0 · on<이벤트> 대입 8
- 부르는 묶음(들어옴): G010×3
- 부르는 대상(나감): G019×4, G056×2
- 바깥 js 가 window 이름을 씀: js/tabs/goals/routine-screen.js
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-all-clicks.js, scripts/verify-integrity-gate.js, tests/goals-schedule-sync.test.js, tests/guest-null-client-es377.test.js, tests/hidden-entry-guard.test.js, tests/routine-tab-scheduler.test.js, tests/stopwatch-lap-inputs.test.js (index.html 단독 읽기: tests/goals-schedule-sync.test.js, tests/routine-tab-scheduler.test.js)

### G040 소셜 로그인 (카카오 / 실제 구글 OAuth 연동)

- 4025~4330줄(306줄) · 어려움(27)
- 함수(7): getGoogleTokenClient, handleGoogleUserSuccess, initGoogleOneTap, parseJwtPayload, sha256Hex, startGoogleLogin, startOAuthLogin
- 변수(2): _googleOneTapNonce, _googleTokenClient
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: GOOGLE_OAUTH_CLIENT_ID, closeModal, escapeHtml, initRememberedAuthFields, openLoginRescueModal, restoreSessionAndEnter, saveProfile, sb, setDeviceLoginTime, state
- 로드 중 문 2: 호출 2
- 이벤트 처리기: addEventListener 2 · on<이벤트> 대입 7
- 부르는 묶음(들어옴): G010×1, G014×1
- 부르는 대상(나감): G019×10, G056×2, G061×2
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-all-clicks.js, scripts/verify-integrity-gate.js, tests/dev-host-gate.test.js, tests/direct-login-guard.test.js, tests/gcal-login-reconnect-fix.test.js, tests/goals-schedule-sync.test.js, tests/google-session-guard.test.js 외 4 (index.html 단독 읽기: tests/gcal-login-reconnect-fix.test.js, tests/goals-schedule-sync.test.js, tests/google-session-guard.test.js)

### G015 [#TASK-ES-442] 인라인 스크립트 세포화 P0 이음매 (docs/architecture/INLINE-SCRIPT-MAP.md 지도 · docs/specs

- 3240~3277줄(38줄) · 어려움(27)
- 함수(0): 없음
- 변수(20): challengeTwoFactorModal, convertTextToNotionDbRecord, defaultSettings, getRegisteredDevices, goalProgress, initDevDebugButtons, isHashedAppLockPin, migrateGuestDataToUser, msCounts, openLogoutOtherDevicesConfirmModal, openTabGuideHubModal, openTwoFactorDisableModal, openTwoFactorSetupModal, renderActiveDevicesList, renderPromptEncyclopediaHtml, resultPct, startOnboarding, toggleScheduleDone, verifyAppLockPin, wirePromptEncyclopediaEvents
- 다른 묶음 상태 — 대입: _promptEncyclopediaOpen, _promptTabState · 변경: 없음 · 읽기: APP_LOCK_PIN_PREFIX, USER_SESSION_CHANNEL, _calendarKit, _goalsKit, _promptEncyclopediaOpen, _promptTabState, _settingsKit, gcalEventsKey, getDeviceId, performLogout, purgeLegacySharedGcalKeys, renderFirstCheckinTutorialBanner 외 2
- 로드 중 문 1: 호출 1
- 부르는 대상(나감): G051×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js, tests/account-switch-isolation.test.js, tests/dev-host-gate.test.js, tests/device-session-control.test.js, tests/direct-login-guard.test.js, tests/gcal-login-reconnect-fix.test.js, tests/logout-scope-es399.test.js 외 2 (index.html 단독 읽기: tests/gcal-login-reconnect-fix.test.js)

### G107 [#TASK-ES-233] 3일 실천 완성 나의 6각 성장 차트 미리보기 SVG 렌더러

- 9122~9403줄(282줄) · 어려움(28)
- 함수(4): openThemePickerModal, renderColdstartRadarPreviewSvg, renderLifeBalanceWheel, renderRecordThemeFilters
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: RECORD_THEMES, closeModal, escapeHtml, openRecordModal, renderRecordsScreen, saveProfile, state, switchTab, triggerHapticFeedback
- 이벤트 처리기: addEventListener 6 · on<이벤트> 대입 0
- 부르는 묶음(들어옴): G002×2, G013×1
- 부르는 대상(나감): G019×1, G056×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-calendar-attachments.js, scripts/test-shipyard-modular.js, scripts/verify-all-clicks.js, tests/achievement-graph-multiset.test.js, tests/goal-ai-advice-status.test.js, tests/goals-schedule-sync.test.js, tests/guest-null-client-es377.test.js 외 7 (index.html 단독 읽기: scripts/test-calendar-attachments.js, tests/goal-ai-advice-status.test.js, tests/goals-schedule-sync.test.js, tests/routine-tab-scheduler.test.js, tests/team-goal-guide-hint.test.js)

### G115 크리에이터 템플릿 (#TASK-ES-315, 64: 구형 창 영구 제거 및 무해화)

- 11375~11423줄(49줄) · 어려움(29)
- 함수(2): cloneTemplate, templatesHtml
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: CREATOR_TEMPLATES, escapeHtml, newId, nowISO, saveProfile, state, trackGoalCreated, uid
- 로드 중 문 1: window 노출 1
- window 노출(1줄): cloneTemplate
- 부르는 묶음(들어옴): G085×2, G010×1, G134×1
- 부르는 대상(나감): G019×1, G126×1
- 바깥 js 가 window 이름을 씀: js/tabs/comm/feed-list.js, js/tabs/goals/template-encyclopedia.js, js/team-invite-comm.js, js/viral-sharing.js
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-all-clicks.js, scripts/verify-integrity-gate.js, tests/ai-conditional-call-optimization.test.js, tests/goal-ai-advice-status.test.js, tests/goal-template-legacy-cleanup.test.js, tests/goal-templates-data-split.test.js, tests/goals-schedule-sync.test.js 외 2 (index.html 단독 읽기: tests/goal-ai-advice-status.test.js, tests/goal-templates-data-split.test.js, tests/goals-schedule-sync.test.js)

### G091 [#TASK-ES-264] 오늘의 미션 및 AI 피드백 조건부 호출 최적화

- 7371~7451줄(81줄) · 어려움(30)
- 함수(2): computeTodayMissionHash, renderTodayMissionCard
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: computeGoalStatusHash, dateKey, escapeHtml, getEffectiveStandardDateKey, nowISO, requestTodayMission, saveProfile, state
- 로드 중 문 1: IfStatement 1
- window 노출(1줄): computeTodayMissionHash
- 이벤트 처리기: addEventListener 0 · on<이벤트> 대입 1
- 부르는 묶음(들어옴): G010×1, G071×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-all-clicks.js, tests/account-switch-isolation.test.js, tests/achievement-graph-multiset.test.js, tests/ai-conditional-call-optimization.test.js, tests/core-confirm-es374.test.js, tests/core-confirm-es376.test.js, tests/direct-login-guard.test.js 외 7 (index.html 단독 읽기: tests/goals-schedule-sync.test.js, tests/hide-home-debug-cards.test.js, tests/home-customizer-auto-sync.test.js, tests/record-ledger-sync.test.js, tests/today-mission-card-guide.test.js)

### G063 캘린더 수동 일정 편집 모달 (Req 2 & #TASK-ES-253)

- 4933~5428줄(496줄) · 어려움(34)
- 함수(1): openCalendarManualEditModal
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: escapeHtml, gcalEventsKey, getGoogleAccessToken, isGoogleCalendarConnected, isoDate, moveToTrash, nowISO, openCalendarDayEditHubModal, pushCalendarEvent, renderCalendarScreen, renderGoalsScreen, renderRecordsScreen 외 6
- 이벤트 처리기: addEventListener 0 · on<이벤트> 대입 10
- 부르는 묶음(들어옴): G003×1, G064×1
- 부르는 대상(나감): G071×8, G019×5, G056×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-calendar-attachments.js, scripts/test-shipyard-modular.js, scripts/verify-all-clicks.js, scripts/verify-integrity-gate.js, tests/achievement-graph-multiset.test.js, tests/core-confirm-es374.test.js, tests/core-confirm-es376.test.js 외 7 (index.html 단독 읽기: scripts/test-calendar-attachments.js, tests/goals-schedule-sync.test.js, tests/goals-smart-attachments.test.js, tests/routine-tab-scheduler.test.js)

### G096 [#TASK-ES-189] 템플릿 백과사전 3대 분류(개인·루틴·팀) 및 AI/실유저 2원화 이식 시스템

- 7797~7811줄(15줄) · 어려움(35)
- 함수(0): 없음
- 변수(4): _subtabTplCat, _subtabTplDomain, _subtabTplQuery, _subtabTplType
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: PERSONAL_TEMPLATES_REAL, ROUTINE_TEMPLATES_AI, ROUTINE_TEMPLATES_REAL, TEAM_TEMPLATES_AI, TEAM_TEMPLATES_REAL, renderTemplateEncyclopediaScreen
- 로드 중 문 8: window 노출 8
- window 노출(8줄): PERSONAL_TEMPLATES_REAL, ROUTINE_TEMPLATES_AI, ROUTINE_TEMPLATES_REAL, TEAM_TEMPLATES_AI, TEAM_TEMPLATES_REAL, _subtabTplDomain, _subtabTplType, renderTemplateEncyclopediaScreen
- 바깥 js 가 window 이름을 씀: js/tabs/goals/render.js, js/tabs/goals/template-encyclopedia.js
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-shipyard-modular.js, scripts/verify-integrity-gate.js, tests/routine-tab-scheduler.test.js (index.html 단독 읽기: tests/routine-tab-scheduler.test.js)

### G061 [#TASK-ES-153] 전역 7일 유예 통합 휴지통 (Recycle Bin) 시스템

- 4872~4922줄(51줄) · 어려움(36)
- 함수(2): calendarAvailable, saveGoogleToken
- 변수(1): googleTokenClient
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: gcalCurrentUid, gcalTokenStatus, getGoogleAccessToken, isGoogleCalendarConnected, purgeLegacySharedGcalKeys, requestGoogleToken, restoreGoogleToken, state
- 로드 중 문 1: IfStatement 1
- window 노출(6줄): gcalTokenStatus, getGoogleAccessToken, isGoogleCalendarConnected, requestGoogleToken, restoreGoogleToken, saveGoogleToken
- 부르는 묶음(들어옴): G040×2, G003×1, G010×1
- 바깥 js 가 window 이름을 씀: js/core/gcal-sync.js, js/core/trash-bin.js, js/tabs/calendar/calendar-core.js, js/tabs/calendar/natural-schedule.js, js/tabs/calendar/render.js, js/tabs/settings/session-entry.js, js/tabs/settings/sub-integrations.js
- 시험지 글자 의존: scripts/smoke-test.js, tests/core-confirm-es376.test.js, tests/gcal-login-reconnect-fix.test.js (index.html 단독 읽기: tests/gcal-login-reconnect-fix.test.js)
- smoke-test FN_NAMES: calendarAvailable — 옮기려면 시험지 선행 PR 먼저

### G114 캘린더 실시간 구독 URL 생성기 (WebCal Feed & #TASK-ES-252 HMAC 서명)

- 11198~11374줄(177줄) · 어려움(37)
- 함수(1): shareContent
- 변수(2): MOCK_GROUPS, _cachedSignedCalendarToken
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: CREATOR_TEMPLATES, daysFromNow, openExportThemeModal
- 로드 중 문 3: 호출 1 · window 노출 2
- window 노출(2줄): CREATOR_TEMPLATES, shareContent
- 이벤트 처리기: addEventListener 1 · on<이벤트> 대입 0
- 부르는 묶음(들어옴): G010×1, G110×1
- 바깥 js 가 window 이름을 씀: js/tabs/comm/feed-list.js, js/tabs/comm/manito-real.js, js/tabs/comm/sample-data.js, js/tabs/comm/share-card.js, js/tabs/goals/template-encyclopedia.js, js/tabs/records/export-theme.js, js/team-share.js, js/team-templates.js 외 1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js, tests/security-audit.test.js, tests/team-fold-state-es409.test.js, tests/team-level-accordion-es406.test.js, tests/team-level-management.test.js, tests/team-tasks-toggle-es410.test.js (index.html 단독 읽기: tests/security-audit.test.js, tests/team-fold-state-es409.test.js, tests/team-level-accordion-es406.test.js, tests/team-level-management.test.js, tests/team-tasks-toggle-es410.test.js)

### G072 11인 외부 UI/UX 감시 및 개선팀 핵심 기능 구현

- 6005~6150줄(146줄) · 어려움(37)
- 함수(3): announceToA11y, renderDailyQuestBar, renderTodayGlancePill
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: awardXP, burstConfetti, calculateWeeklyFocusStats, computeStreakDays, dateKey, saveLocalSettings, saveProfile, state, switchTab, triggerHaptic
- 이벤트 처리기: addEventListener 0 · on<이벤트> 대입 4
- 부르는 묶음(들어옴): G071×4, G008×1, G010×1
- 부르는 대상(나감): G019×2, G023×1
- 시험지 글자 의존: scripts/smoke-test.js, tests/goal-ai-advice-status.test.js, tests/goals-only-view.test.js, tests/goals-smart-attachments.test.js, tests/hide-home-debug-cards.test.js, tests/home-customizer-auto-sync.test.js, tests/quest-task-exp.test.js, tests/team-goal-guide-hint.test.js 외 2 (index.html 단독 읽기: tests/goal-ai-advice-status.test.js, tests/goals-only-view.test.js, tests/goals-smart-attachments.test.js, tests/hide-home-debug-cards.test.js, tests/home-customizer-auto-sync.test.js, tests/team-goal-guide-hint.test.js, tests/theme-system-v4.test.js, tests/unique-display-name.test.js)

### G065 5대 테마 온톨로지 & 경량 AI 분류기 (TASK-OG-001)

- 5451~5706줄(256줄) · 어려움(39)
- 함수(3): buildCheckinRecord, classifyRecordTheme, saveQuickCheckin
- 변수(4): CATEGORY_THEME_MAP, RECORD_THEMES, THEME_KEYWORDS, THEME_REGEX_RULES
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: MOCK_GROUPS, XP_RULES, awardXP, checkGuestBackupNudge, computeStreakDays, dayIndexSinceSignup, dispatchFullViewPropagation, groupState, maybeGrantAvatarCraftBonus, maybeGrantStreakFreeze, newId, nowISO 외 5
- 부르는 묶음(들어옴): G026×2, G011×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-calendar-attachments.js, scripts/test-shipyard-modular.js, tests/account-switch-isolation.test.js, tests/core-confirm-es376.test.js, tests/direct-login-guard.test.js, tests/feed-post-category-diversity.test.js, tests/goal-templates-data-split.test.js 외 6 (index.html 단독 읽기: scripts/test-calendar-attachments.js, tests/goal-templates-data-split.test.js, tests/goals-schedule-sync.test.js, tests/record-ledger-sync.test.js, tests/routine-tab-scheduler.test.js)
- smoke-test FN_NAMES: buildCheckinRecord — 옮기려면 시험지 선행 PR 먼저

### G024 [#TASK-ES-150] 아바타 레벨업 대형 팝업 & 성장 성향 키워드

- 3483~3504줄(22줄) · 어려움(41)
- 함수(0): 없음
- 변수(6): avLvModalElem, btnAvLvClose, btnAvLvConfirm, btnSaveGrowth, btnSaveLvImg, btnShareLv
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindAvatarGrowthPromptSave, bindAvatarLevelUpBackdrop, bindAvatarLevelUpSaveImage, bindAvatarLevelUpShare, closeAvatarLevelUpModal, openAvatarLevelUpModal
- 로드 중 문 14: window 노출 2 · var 초기값 실행 6 · IfStatement 2 · 호출 4
- window 노출(2줄): closeAvatarLevelUpModal, openAvatarLevelUpModal
- 이벤트 처리기: addEventListener 2 · on<이벤트> 대입 0
- 바깥 js 가 window 이름을 씀: js/tabs/settings/avatar-greeting.js, js/tabs/settings/avatar-levelup-modal.js
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js, tests/avatar-10slots-growth.test.js (index.html 단독 읽기: tests/avatar-10slots-growth.test.js)

### G086 [#TASK-ES-146] 아워골 평가해주기 90% 팝업

- 7287~7317줄(31줄) · 어려움(46)
- 함수(0): 없음
- 변수(5): btnEvalBanner, btnEvalClose, btnSubmitEval, challengeBtn, modalEvalElem
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindAppEvalBackdrop, bindAppEvalSubmit, bindHomeAddGoal, closeAppEvaluationModal, openAppEvaluationModal, openMzShareCardModal, resetAppEvaluationForm, setTab
- 로드 중 문 15: window 노출 3 · var 초기값 실행 5 · IfStatement 3 · 호출 4
- window 노출(3줄): closeAppEvaluationModal, openAppEvaluationModal, resetAppEvaluationForm
- 이벤트 처리기: addEventListener 3 · on<이벤트> 대입 1
- 바깥 js 가 window 이름을 씀: js/components-home-actions.js, js/tabs/settings/app-evaluation.js
- 시험지 글자 의존: scripts/smoke-test.js, tests/app-evaluation-modal.test.js, tests/home-customizer-auto-sync.test.js (index.html 단독 읽기: tests/home-customizer-auto-sync.test.js)

### G102 RENDER: 팀 목표 (팀장·매니저만 추가/수정/삭제, 팀원은 보기만)

- 7998~8257줄(260줄) · 어려움(54)
- 함수(17): blockUser, canManageTeamGoals, ensureTeamCommentsLoaded, filterBlockedPosts, filterHidden, isUserBlocked, openBlockedUsersModal, reorderGoal, setupRealtimeChannelsOnce, setupTeamCommentsRealtime, setupUserSessionRealtime, shiftGoalOrder, sortGoalsByOrder, teamCommentItemHtml, teamComments, teamCommentsBlockHtml, unblockUser
- 변수(3): REALTIME_CHANNELS_SETUP, TEAM_COMMENTS_CACHE, USER_SESSION_CHANNEL
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: closeModal, escapeHtml, getDeviceId, groupState, nowISO, performLogout, renderCommFeed, renderGoalsScreen, renderTeamGoalsScreen, saveProfile, sb, setupFeedPostsRealtime 외 3
- 이벤트 처리기: addEventListener 2 · on<이벤트> 대입 0
- 부르는 묶음(들어옴): G010×6, G071×3, G004×2, G135×2, G001×1, G051×1
- 부르는 대상(나감): G019×4, G071×2, G056×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-shipyard-modular.js, scripts/verify-all-clicks.js, tests/account-switch-isolation.test.js, tests/comm-ai-identity-es348.test.js, tests/core-confirm-es374.test.js, tests/core-confirm-es376.test.js, tests/direct-login-guard.test.js 외 10 (index.html 단독 읽기: tests/comm-ai-identity-es348.test.js, tests/goals-schedule-sync.test.js, tests/google-session-guard.test.js, tests/team-fold-state-es409.test.js, tests/team-goal-guide-hint.test.js, tests/team-level-accordion-es406.test.js)
- smoke-test FN_NAMES: filterBlockedPosts, filterHidden, sortGoalsByOrder — 옮기려면 시험지 선행 PR 먼저

### G051 Enter app

- 4572~4701줄(130줄) · 어려움(58)
- 함수(1): enterApp
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: OfflineSyncManager, challengeTwoFactorModal, checkRemoteSessionRevoked, checkSocialNotifications, checkStreakFreeze, computeStreakDays, ensureFeedPostsLoaded, getDeviceId, loadSharedGroups, openAvatarGreetingPopup, openRecordModal, performLogout 외 9
- 로드 중 문 6: 호출 6
- 이벤트 처리기: addEventListener 5 · on<이벤트> 대입 0
- 부르는 묶음(들어옴): G129×2, G010×1, G015×1, G128×1
- 부르는 대상(나감): G019×2, G102×1, G126×1
- 시험지 글자 의존: scripts/smoke-test.js, tests/achievement-stats-shell-button-removal.test.js, tests/comm-ai-identity-es348.test.js, tests/core-confirm-es374.test.js, tests/core-modal-es363.test.js, tests/core-toast-es361.test.js, tests/dev-host-gate.test.js, tests/direct-login-guard.test.js 외 10 (index.html 단독 읽기: tests/comm-ai-identity-es348.test.js, tests/core-modal-es363.test.js, tests/core-toast-es361.test.js, tests/google-session-guard.test.js, tests/theme-system-v4.test.js, tests/top-page-guide-reposition.test.js, tests/unique-display-name.test.js)

### G103 개인 목표 200% 활용 가이드 & 템플릿 백과사전 (#TASK-ES-135)

- 8258~9018줄(761줄) · 어려움(62)
- 함수(6): collapseAllTeamGoalAccordions, getGroupLevelGoals, isMockGroup, openLevelGroupDetailModal, openTeamGoalEditModal, renderPersonalGoalsEmptyGuideHtml
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: MOCK_GROUPS, closeModal, daysFromNow, escapeHtml, renderTeamGoalsEmptyGuideHtml, renderTeamGoalsScreen, saveProfile, state, triggerHaptic, uid
- 로드 중 문 4: IfStatement 3 · window 노출 1
- window 노출(4줄): collapseAllTeamGoalAccordions, isMockGroup, renderTeamGoalsEmptyGuideHtml, renderTeamGoalsScreen
- 이벤트 처리기: addEventListener 18 · on<이벤트> 대입 0
- 부르는 묶음(들어옴): G010×5, G004×1, G135×1
- 부르는 대상(나감): G019×6, G056×2
- 바깥 js 가 window 이름을 씀: js/components-team-actions.js, js/components.js, js/goal-edit-ux.js, js/tabs/comm/shared-groups.js, js/tabs/goals/render.js, js/tabs/goals/sub-team.js, js/tabs/goals/team-goal-prompt.js, js/tabs/goals/team-goals-guide.js 외 5
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-shipyard-modular.js, scripts/verify-all-clicks.js, tests/account-switch-isolation.test.js, tests/achievement-graph-multiset.test.js, tests/ai-conditional-call-optimization.test.js, tests/comm-ai-identity-es348.test.js, tests/core-confirm-es374.test.js 외 14 (index.html 단독 읽기: tests/comm-ai-identity-es348.test.js, tests/goal-ai-advice-status.test.js, tests/goals-only-view.test.js, tests/google-session-guard.test.js, tests/team-fold-state-es409.test.js, tests/team-goal-guide-hint.test.js, tests/team-level-accordion-es406.test.js, tests/team-level-management.test.js)

### G110 템플릿 마켓 · 복제 · 전문 템플릿 기록 (TASK-ES-013)

- 9825~11146줄(1322줄) · 어려움(64)
- 함수(5): checkRecordDeepLink, executeDirectTemplateClone, openProTemplateRecordModal, openTemplateMarketModal, openTemplateRecordDetailModal
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: CURATED_MARKET_TEMPLATES, XP_RULES, awardXP, burstConfetti, closeModal, computeTrendChartData, downloadTableAsCsv, escapeHtml, fmtTime, fmtYYMMDD, formatStopwatchTime, getAllProTemplates 외 37
- 로드 중 문 1: 호출 1
- 이벤트 처리기: addEventListener 3 · on<이벤트> 대입 49
- 부르는 묶음(들어옴): G002×2, G003×1
- 부르는 대상(나감): G019×19, G056×3, G023×1, G109×1, G114×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-shipyard-modular.js, scripts/verify-integrity-gate.js, tests/account-switch-isolation.test.js, tests/account-withdrawal-modal.test.js, tests/achievement-graph-multiset.test.js, tests/ai-conditional-call-optimization.test.js, tests/core-confirm-es376.test.js 외 11 (index.html 단독 읽기: tests/account-withdrawal-modal.test.js, tests/goal-templates-data-split.test.js, tests/record-ledger-sync.test.js)

### G097 [UI/UX 틀 개편 Phase 4] 목표 탭 노션급 데이터 관리 & 인지순행 IA (#TASK-UIUX-PHASE4-GOALS)

- 7812~7921줄(110줄) · 어려움(65)
- 함수(5): closeGoalDetailDrawer, handleGoalFastAddSubmit, openGoalDetailDrawer, selectSmartTag, toggleMilestoneInDrawer
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: adoptTemplateAsMyGoal, dispatchFullViewPropagation, escapeHtml, renderGoalStatsChart, renderGoalsScreen, saveProfile, state, switchGoalStatPeriod, switchGoalsSubTab, triggerHapticFeedback
- 로드 중 문 11: window 노출 11
- window 노출(12줄): adoptTemplateAsMyGoal, closeGoalDetailDrawer, currentGoalStatPeriod, handleGoalFastAddSubmit, openGoalDetailDrawer, renderGoalStatsChart, selectSmartTag, selectedGoalSmartTag, switchGoalStatPeriod, switchGoalsSubTab, toggleMilestoneInDrawer
- 인라인 on*="…" 이 부르는 함수: closeGoalDetailDrawer, handleGoalFastAddSubmit, openGoalDetailDrawer, selectSmartTag, toggleMilestoneInDrawer
- 부르는 대상(나감): G019×6
- 바깥 js 가 window 이름을 씀: js/sanctuary-goal-trail.js, js/sanctuary-v3-engine.js, js/tabs/goals/goals-ia-actions.js, js/tabs/goals/render.js
- 시험지 글자 의존: scripts/smoke-test.js, tests/ai-conditional-call-optimization.test.js, tests/goal-ai-advice-status.test.js, tests/team-goal-comment-fix.test.js, tests/team-level-management.test.js (index.html 단독 읽기: tests/goal-ai-advice-status.test.js, tests/team-level-management.test.js)

### G085 [#TASK-ES-174] 목표 템플릿 백과사전 전체화면 팝업 및 상호작용

- 6719~7286줄(568줄) · 어려움(80)
- 함수(12): cheerRealUserTemplate, closeTemplateEncyclopediaModal, copyRealUserTemplate, getLikedTemplateMap, getUserSharedTemplates, openTemplateEncyclopediaModal, renderAiTemplatesList, renderRealUserTemplatesList, saveUserSharedTemplates, setLikedTemplateMap, shareMyActiveGoalAsTemplate, switchTemplateEncyclopediaTab
- 변수(8): REAL_USER_TEMPLATES, _tplActiveTab, _tplAiCurCat, btnCloseTplEncycl, btnHeaderTplEncycl, modalTplEncyclElem, tabBtnAi, tabBtnReal
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: escapeHtml, newId, nowISO, renderGoalsScreen, saveProfile, setTab, state, trackGoalCreated, uid
- 로드 중 문 20: window 노출 9 · var 초기값 실행 5 · IfStatement 5 · 호출 1
- window 노출(9줄): REAL_USER_TEMPLATES, cheerRealUserTemplate, closeGoalTemplateEncyclopediaModal, closeTemplateEncyclopediaModal, copyRealUserTemplate, copyUserGoalTemplate, openGoalTemplateEncyclopediaModal, openTemplateEncyclopediaModal, shareMyActiveGoalAsTemplate
- 이벤트 처리기: addEventListener 9 · on<이벤트> 대입 3
- 인라인 on*="…" 이 부르는 함수: closeTemplateEncyclopediaModal
- 부르는 묶음(들어옴): G013×1, G014×1
- 부르는 대상(나감): G019×8, G115×2
- 바깥 js 가 window 이름을 씀: js/components-goal-actions.js, js/components.js, js/tabs/goals/team-goal-prompt.js, js/tabs/goals/template-quick-import.js
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-shipyard-modular.js, scripts/verify-all-clicks.js, scripts/verify-integrity-gate.js, tests/ai-conditional-call-optimization.test.js, tests/feed-post-category-diversity.test.js, tests/goal-template-legacy-cleanup.test.js, tests/goal-templates-data-split.test.js 외 7 (index.html 단독 읽기: tests/goal-templates-data-split.test.js, tests/goals-schedule-sync.test.js, tests/routine-tab-scheduler.test.js, tests/team-level-management.test.js)

### G071 RENDER: HOME

- 5789~6004줄(216줄) · 어려움(81)
- 함수(1): renderHome
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: BADGES, badgeContext, burstConfetti, computeStreakDays, dDay, dateKey, dispatchFullViewPropagation, escapeHtml, goalProgress, initFeedbackTierBar, initHomeCockpit, msCounts 외 16
- 이벤트 처리기: addEventListener 8 · on<이벤트> 대입 2
- 부르는 묶음(들어옴): G063×8, G023×2, G102×2, G001×1, G035×1, G126×1
- 부르는 대상(나감): G072×4, G102×3, G019×1, G023×1, G091×1, G126×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-all-clicks.js, scripts/verify-integrity-gate.js, tests/achievement-collapse-toggle.test.js, tests/achievement-metric-multiselect.test.js, tests/achievement-stats-shell-button-removal.test.js, tests/app-evaluation-notice.test.js, tests/avatar-exp-celebration.test.js 외 44 (index.html 단독 읽기: tests/app-evaluation-notice.test.js, tests/avatar-welcome-modal.test.js, tests/calendar-photo-diary-dismiss-guide.test.js, tests/comm-feed-cleanup.test.js, tests/comm-post-feed-button-fix.test.js, tests/component-modularization.test.js, tests/dm-keyboard-autofocus-fix.test.js, tests/goals-only-view.test.js 외 7)

### G023 XP/레벨 시스템

- 3377~3482줄(106줄) · 어려움(84)
- 함수(3): hasUserCustomizedAvatar, levelBadgeHtml, renderLevelBadge
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: MOCK_GROUPS, closeModal, dateKey, levelForXP, levelProgress, notifyXpGained, nowISO, saveProfile, state, triggerAvatarCelebrationPopup, updateTopBar, xpForLevel
- 로드 중 문 6: window 노출 5 · IfStatement 1
- window 노출(6줄): levelForXP, levelProgress, notifyXpGained, renderLevelBadge, triggerAvatarCelebrationPopup, xpForLevel
- 이벤트 처리기: addEventListener 0 · on<이벤트> 대입 2
- 부르는 묶음(들어옴): G004×1, G071×1, G072×1, G110×1
- 부르는 대상(나감): G071×2, G019×1, G056×1
- 바깥 js 가 window 이름을 씀: js/avatar/xp.js, js/core/badges.js, js/core/profile-topbar.js, js/sanctuary-weekly-recap.js, js/tabs/goals/goal-detail-events.js, js/tabs/goals/goal-update-suggest.js, js/tabs/goals/result-input.js, js/tabs/goals/result-modal.js 외 9
- 시험지 글자 의존: scripts/smoke-test.js, tests/avatar-10slots-growth.test.js, tests/avatar-icon-enlarge-all.test.js, tests/avatar-personas-split.test.js, tests/enlarge-avatar-icons.test.js, tests/feed-post-photo-upload.test.js, tests/gcal-login-reconnect-fix.test.js, tests/goal-template-legacy-cleanup.test.js 외 7 (index.html 단독 읽기: tests/avatar-10slots-growth.test.js, tests/avatar-personas-split.test.js, tests/enlarge-avatar-icons.test.js, tests/gcal-login-reconnect-fix.test.js, tests/goals-schedule-sync.test.js, tests/hide-home-debug-cards.test.js, tests/home-customizer-auto-sync.test.js, tests/remove-duplicate-home-layout-button.test.js 외 3)

### G056 Modal helper & Android Hardware Back Handler

- 4732~4798줄(67줄) · 어려움(165)
- 함수(1): openModal
- 변수(2): _modalDismissGraceUntil, _modalHistoryPushed
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindModalPopstateBack, closeModal, openBottomSheetAlert, openBottomSheetConfirm
- 로드 중 문 2: IfStatement 1 · 호출 1
- window 노출(5줄): _modalOpenAt, closeModal, openBottomSheetAlert, openBottomSheetConfirm, openModal
- 이벤트 처리기: addEventListener 0 · on<이벤트> 대입 2
- 부르는 묶음(들어옴): G110×3, G040×2, G093×2, G103×2, G135×2, G001×1, G002×1, G023×1, G046×1, G063×1 외 8
- 바깥 js 가 window 이름을 씀: js/auth-safety.js, js/avatar/dynamic-album.js, js/avatar/modal/bind-save.js, js/avatar/modal/index.js, js/components-home-actions.js, js/components.js, js/core/badges.js, js/core/confirm.js 외 120
- 시험지 글자 의존: scripts/smoke-test.js, tests/core-confirm-es374.test.js, tests/core-modal-es363.test.js, tests/dm-push-auth-es397.test.js, tests/google-session-guard.test.js (index.html 단독 읽기: tests/core-modal-es363.test.js, tests/google-session-guard.test.js)

### G019 Confetti

- 3321~3343줄(23줄) · 어려움(240)
- 함수(1): toast
- 변수(1): toastTimer
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: showUndoPrivacyToast
- 로드 중 문 2: IfStatement 2
- window 노출(3줄): showToast, showUndoPrivacyToast, toast
- 이벤트 처리기: addEventListener 0 · on<이벤트> 대입 1
- 인라인 on*="…" 이 부르는 함수: toast
- 부르는 묶음(들어옴): G110×19, G040×10, G085×8, G046×6, G097×6, G098×6, G103×6, G109×6, G063×5, G080×4 외 22
- 바깥 js 가 window 이름을 씀: js/auth-safety.js, js/avatar/dynamic-album.js, js/avatar/feature-cards.js, js/avatar/modal/bind-craft.js, js/avatar/modal/bind-deck.js, js/avatar/modal/bind-persona.js, js/avatar/modal/bind-save.js, js/avatar/modal/index.js 외 187
- 시험지 글자 의존: scripts/smoke-test.js, tests/avatar-personas-split.test.js (index.html 단독 읽기: tests/avatar-personas-split.test.js)

### G026 뱃지 컬렉션 (명예의 전당)

- 3513~3824줄(312줄) · 어려움(287)
- 함수(6): defaultProfile, ensureUserRow, formatDisplayNameWithTag, loadProfile, resolveUniqueDisplayName, totalCompletedMilestones
- 변수(1): state
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: defaultSettings, escapeHtml, getAttribution, getSupabaseAuthToken, isoDate, loadLocalSettings, nowISO, saveLocalSettings, sb, track
- 로드 중 문 4: window 노출 1 · IfStatement 3
- window 노출(4줄): defaultProfile, formatDisplayNameWithTag, resolveUniqueDisplayName, state
- 부르는 묶음(들어옴): G010×3, G129×2, G002×1, G034×1
- 부르는 대상(나감): G065×2
- 바깥 js 가 window 이름을 씀: js/auth-safety.js, js/avatar/dynamic-album.js, js/avatar/feature-cards.js, js/avatar/modal/bind-craft.js, js/avatar/modal/bind-deck.js, js/avatar/modal/bind-save.js, js/avatar/modal/index.js, js/avatar/xp.js 외 218
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-shipyard-modular.js, scripts/verify-integrity-gate.js, tests/account-switch-isolation.test.js, tests/account-withdrawal-modal.test.js, tests/avatar-10slots-growth.test.js, tests/avatar-personas-split.test.js, tests/dev-host-gate.test.js 외 15 (index.html 단독 읽기: tests/account-withdrawal-modal.test.js, tests/avatar-10slots-growth.test.js, tests/avatar-personas-split.test.js, tests/gcal-login-reconnect-fix.test.js, tests/goal-templates-data-split.test.js, tests/record-ledger-sync.test.js, tests/routine-tab-scheduler.test.js, tests/security-audit.test.js 외 2)
- smoke-test FN_NAMES: totalCompletedMilestones — 옮기려면 시험지 선행 PR 먼저

### G010 [#TASK-ES-432] 인라인 스크립트 세포화 2차 이음매 (docs/architecture/INLINE-SCRIPT-MAP.md 지도 · docs/specs

- 2543~3080줄(538줄) · 어려움(302)
- 함수(0): 없음
- 변수(259): APP_LOCK_PIN_PREFIX, BADGES, GOAL_TEMPLATES, GOOGLE_OAUTH_CLIENT_ID, HEATMAP_LEVELS, HEATMAP_WEEKS, OfflineSyncManager, PERSONAL_TEMPLATES_REAL, ROUTINE_TEMPLATES_AI, ROUTINE_TEMPLATES_REAL, TEAM_TEMPLATES_AI, TEAM_TEMPLATES_REAL, TREND_METRICS, _uiKit, addSimulatedCheerAndReplyToPost, adoptTemplateAsMyGoal, applyCrewPacingUI, applyGoalAgentOp, avatarHtml, badgeContext 외 239
- 다른 묶음 상태 — 대입: MANITO_SERVER_LOADED, REAL_MANITO_INBOX_CACHE, REAL_MANITO_PARTNERS_CACHE, SHARED_GROUPS_LOADED, _cachedSignedCalendarToken, _isEnteringApp, _lastObservedDateKey, _modalDismissGraceUntil, _modalHistoryPushed, _pendingAuthSession, _subtabTplCat, _subtabTplDomain 외 7 · 변경: 없음 · 읽기: CREATOR_TEMPLATES, EXTERNAL_DATA, MANITO_EMOJI, MANITO_SERVER_LOADED, MANITO_STAMPS, MANITO_WELCOME_STAMPS, REAL_MANITO_INBOX_CACHE, REAL_MANITO_PARTNERS_CACHE, SHARED_GROUPS_LOADED, SHARE_PLATFORMS, SHIFT_WORK_PRESETS, TEAM_COMMENTS_CACHE 외 100
- 로드 중 문 24: 호출 24
- 부르는 대상(나감): G102×6, G103×5, G026×3, G093×3, G040×1, G051×1, G061×1, G072×1, G075×1, G091×1 외 4
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-calendar-attachments.js, scripts/test-shipyard-modular.js, scripts/verify-integrity-gate.js, tests/account-switch-isolation.test.js, tests/achievement-graph-multiset.test.js, tests/ai-conditional-call-optimization.test.js, tests/app-evaluation-modal.test.js 외 37 (index.html 단독 읽기: scripts/test-calendar-attachments.js, tests/comm-ai-identity-es348.test.js, tests/comm-post-feed-button-fix.test.js, tests/core-modal-es363.test.js, tests/gcal-login-reconnect-fix.test.js, tests/goal-ai-advice-status.test.js, tests/goals-schedule-sync.test.js, tests/goals-smart-attachments.test.js 외 14)

## 6. 이음매·빈 구획

- G000 2257~2259(3줄) (IIFE 머리 — "use strict" 와 첫 구획 앞) — 빈 구획
- G001 2260~2338(79줄) [#TASK-ES-354 CORE-07] 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL.md) — 이음매(옮기지 않음) · 로드 중 문 1
- G002 2339~2380(42줄) [#TASK-ES-358] 기록 탭 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL.md) — 이음매(옮기지 않음) · 로드 중 문 1
- G003 2381~2409(29줄) [#TASK-ES-360] 일정 탭 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL.md, 기록 탭 #TASK-ES-358 과 같은 틀) — 이음매(옮기지 않음) · 로드 중 문 1
- G004 2410~2451(42줄) [#TASK-ES-370] 목표 탭 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL.md, 일정 탭 #TASK-ES-360 과 같은 틀) — 이음매(옮기지 않음) · 로드 중 문 1
- G006 2460~2475(16줄) [#TASK-ES-375] 목표 탭 모듈 이음매 2차 (docs/specs/MODULE-SPLIT-PROTOCOL.md, 1차 #TASK-ES-370 과 같은 틀 — 이음매(옮기지 않음) · 로드 중 문 1
- G007 2476~2497(22줄) [#TASK-ES-379] 소통 탭 모듈 이음매 1차 (docs/specs/MODULE-SPLIT-PROTOCOL.md, 목표 탭 #TASK-ES-370·#TAS — 이음매(옮기지 않음) · 로드 중 문 1
- G009 2531~2542(12줄) [#TASK-ES-423] 인라인 스크립트 세포화 1차 이음매 (docs/architecture/INLINE-SCRIPT-MAP.md 지도 · docs/specs — 이음매(옮기지 않음) · 로드 중 문 1
- G018 3313~3320(8줄) [#TASK-ES-264] 표준 시간대(한국 KST 00:00, 타 국가는 해당 국가 표준시 00:00) 기준 날짜 키 — 빈 구획 · 로드 중 문 1
- G021 3360~3363(4줄) 가상유저 개선 10대 핵심 헬퍼 함수 — 빈 구획 · 로드 중 문 1
- G022 3364~3376(13줄) [#TASK-ES-345 CAL-02] 구글 캘린더 토큰·일정 캐시 계정 격리 — 빈 구획 · 로드 중 문 1
- G027 3825~3828(4줄) [70] 다른 모든 기기 원격 로그아웃 전 로그인 기기 목록 확인 모달 — 빈 구획 · 로드 중 문 1
- G028 3829~3845(17줄) [71] 앱 잠금 PIN (이 기기) — 설정·해제·앱 진입 확인 — 빈 구획 · 로드 중 문 2
- G030 3853~3857(5줄) [80] 템플릿백과사전 1초 자동이식 선택 연동 및 로드맵-목표상태 동기화 — 빈 구획 · 로드 중 문 1
- G031 3858~3861(4줄) [82] 팀 목표 내 '팀 연계 개인목표' 생성 모달 — 빈 구획 · 로드 중 문 1
- G032 3862~3866(5줄) [83] 팀원 초대 시 '아워골 동반자 초대하기' 인앱 초대·참가 기능 — 빈 구획 · 로드 중 문 1
- G033 3867~3870(4줄) [88] 오늘의 3초 체크인 목표 버튼 선택 시 플레이스홀더(백그라운드 가이드) 예시 문구 렌더링 — 빈 구획 · 로드 중 문 1
- G034 3871~3881(11줄) [#TASK-UIUX-PHASE3-HOME-COCKPIT] 홈 1초 조망 ↔ 무저항 체크인 콕핏 8대 과업 — 빈 구획 · 로드 중 문 5
- G036 3995~3995(1줄) Landing — 빈 구획
- G039 4016~4024(9줄) [#TASK-ES-223] [생각 메모장 93번] 개발 디버그 버튼 프로덕션 완전 소거 및 로컬/디버그 격리 — 빈 구획 · 로드 중 문 2
- G041 4331~4335(5줄) [#TASK-ES-224] [생각 메모장 94번] 게스트(둘러보기) 3회 기록 시 안전 백업 넛지 및 카카오 무손실 계정 통합 — 빈 구획 · 로드 중 문 2
- G042 4336~4339(4줄) [#TASK-ES-224] [생각 메모장 94번] 카카오/소셜/일반 로그인 시 게스트 데이터 100% 무손실 비파괴 합집합(Union Merge) 이관 — 빈 구획 · 로드 중 문 1
- G050 4562~4571(10줄) 이용약관 / 개인정보처리방침 열람 리스너 — 빈 구획 · 로드 중 문 2
- G052 4702~4705(4줄) Onboarding (first-time, after signup) — 16종 동물 아바타 & 직관적 안착 융합 — 빈 구획 · 로드 중 문 1
- G053 4706~4715(10줄) 3단계: 첫 체크인 튜토리얼 가이드 및 축하 연출 — 빈 구획 · 로드 중 문 3
- G055 4724~4731(8줄) 조선소 블록 레지스트리 6대 메가블록 초기화 (헌법 제3조 제9항) — 빈 구획 · 로드 중 문 3
- G057 4799~4807(9줄) 이용약관 & 개인정보처리방침 모달 — 빈 구획 · 로드 중 문 1
- G059 4853~4870(18줄) 프로필 — 빈 구획 · 로드 중 문 5
- G060 4871~4871(1줄) 구글 캘린더 연동 — 빈 구획
- G062 4923~4932(10줄) [#TASK-ES-153 & #TASK-ES-155] 캘린더 일자별 배경 사진 지정 모달 — 빈 구획 · 로드 중 문 2
- G064 5429~5450(22줄) [#TASK-ES-181 & #TASK-ES-182] 폰 잠금화면에서 바로 보기 통합 허브 모달 — 빈 구획 · 로드 중 문 1
- G066 5707~5712(6줄) Adaptive UX Mode — 빈 구획 · 로드 중 문 1
- G067 5713~5719(7줄) Social Crew Pacing (#TASK-ES-228) — 빈 구획 · 로드 중 문 4
- G069 5743~5746(4줄) iOS 사파리 홈 화면 추가 안내 배너 & 실시간 알림 가이드 (#TASK-ES-234) — 빈 구획 · 로드 중 문 1
- G076 6408~6478(71줄) 음성 체크인 (Web Speech API) — 빈 구획 · 로드 중 문 1
- G081 6685~6701(17줄) 맞춤 피드백 봇 설정 — 빈 구획 · 로드 중 문 7
- G082 6702~6705(4줄) 목표 & 기록 선택 피드 공유 모달 (전면 고도화) — 빈 구획 · 로드 중 문 1
- G083 6706~6711(6줄) [#TASK-ES-301] 피드 게시 모달 내 '미리보기' 토글 직통 헬퍼 — 빈 구획 · 로드 중 문 1
- G087 7318~7327(10줄) New goal modal — 빈 구획 · 로드 중 문 2
- G088 7328~7328(1줄) 참고자료 (유튜브/영상, 이미지, 텍스트 메모, 웹링크) — 빈 구획
- G089 7329~7337(9줄) 참고자료 (유튜브/영상, 이미지, 텍스트 메모, 웹링크) — 빈 구획 · 로드 중 문 1
- G092 7452~7463(12줄) 목표 탭 3계층 일정설정 / 디데이·기간 표시 및 캘린더 연동 (#TASK-ES-259, 메모장 03항, #TASK-ES-135) — 빈 구획 · 로드 중 문 1
- G094 7786~7793(8줄) [#TASK-ES-172] [27] 목표 탭: 데일리 루틴 서브탭 & 편집/상세 모달 — 빈 구획 · 로드 중 문 1
- G099 7962~7971(10줄) [PHASE 6] #TASK-UIUX-PHASE6-COMM-SETTINGS FUNCTIONS — 빈 구획 · 로드 중 문 4
- G100 7972~7994(23줄) [UI/UX 프레임워크 개편 Phase 7] 모바일 하드웨어 인터랙션 & 사용성 하드닝 — 빈 구획 · 로드 중 문 5
- G101 7995~7997(3줄) RENDER: GOALS — 빈 구획
- G104 9019~9110(92줄) [#TASK-ES-299] 팀 목표 댓글 작성 및 전송 직통 헬퍼 & 전역 이벤트 위임 (먹통 방어 100%) — 빈 구획 · 로드 중 문 3
- G105 9111~9119(9줄) TASK-ES-307: 측정지표 다중 선택 및 동시 렌더링 엔진 — 빈 구획 · 로드 중 문 2
- G106 9120~9121(2줄) 5대 테마 원형 라이프 밸런스 휠 (SVG Pie Chart) — 빈 구획
- G108 9404~9412(9줄) ⏱️ 인앱 인터벌 타이머 & 스톱워치 위젯 (In-Table Stopwatch) — 빈 구획 · 로드 중 문 1
- G111 11147~11182(36줄) [#TASK-ES-358] 기록 탭 렌더 → js/tabs/records/period-ai-card.js · render.js 로 옮김 — 빈 구획 · 로드 중 문 2
- G113 11197~11197(1줄) RFC 5545 표준 iCalendar (.ics) 생성 순수 함수 (TASK-BG-11) — 빈 구획
- G121 11483~11492(10줄) [#TASK-ES-354 CORE-07·SET-07] 설정 탭 렌더 → js/tabs/settings/render.js · sub-*.js 로 옮김 — 이음매(옮기지 않음) · 로드 중 문 5
- G124 11570~11575(6줄) 4대 연계 뷰 원자적 동시 전파 디스패처 (헌법 제1조 제4항 제5호 & 제15조 제6항 제3호) — 빈 구획 · 로드 중 문 1
- G128 11597~11609(13줄) #TASK-AUTH-P0-SAFETY: 로그인/계정 보안 패키지 모듈 연결 — 빈 구획 · 로드 중 문 1
- G129 11610~11837(228줄) Boot — 빈 구획 · 로드 중 문 1
- G130 11838~11840(3줄) #TASK-ES-015 FIX: 공용 크레딧 모듈(js/credits.js)에 앱 sb 주입 — 빈 구획 · 로드 중 문 1
- G131 11841~11854(14줄) KF-7 #TASK-ES-014: 반응 4종 모듈(js/reactions.js)에 앱 핸들 연결 — 빈 구획 · 로드 중 문 1
- G132 11855~11859(5줄) KF-4 #TASK-ES-018: 카테고리별 도움이 된 글 슬롯 모듈(js/top-helpful.js) — 빈 구획 · 로드 중 문 1
- G133 11860~11868(9줄) KF-5 #TASK-ES-016: 도움돼요 이유 모듈(js/helpful-reason.js)에 앱 핸들 연결 — 빈 구획 · 로드 중 문 1
- G134 11869~11876(8줄) #TASK-ES-105: 팀 초대 및 소통/DM/동반자 모듈(js/team-invite-comm.js) 연결 — 빈 구획 · 로드 중 문 1
- G135 11877~11885(9줄) #TASK-ES-105: 팀 연계 개인목표 및 상호 체크 모듈(js/team-linked-goals.js) 연결 — 빈 구획 · 로드 중 문 2
- G136 11886~11890(5줄) KF-2 #TASK-ES-017: 템플릿 복제 크레딧 모듈(js/template-credit.js)에 앱 핸들 연결 — 빈 구획 · 로드 중 문 1
- G137 11891~11933(43줄) PWA: Service Worker 등록 및 자동 업데이트 감지 (#TASK-ES-118) — 빈 구획 · 로드 중 문 10
