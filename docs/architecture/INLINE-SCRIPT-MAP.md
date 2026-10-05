# index.html 인라인 스크립트 책임 묶음 지도

> 생성: `NODE_PATH=<node_modules> node scripts/inline-script-map.js --write` (#TASK-ES-423). **손으로 고치지 않는다** — 다시 만들면 같은 입력에서 같은 글자가 나온다(결정적).
> 출처: `index.html` sha256 앞 12자 `e0f1bb1dee78` · 큰 인라인 IIFE 2298~14069줄(11772줄) · 다른 인라인 블록 4줄(8줄), 14072줄(16줄).

## 1. 요약

- 묶음 151개(이음매 8 · 옮길 대상 91 · 빈 구획 52). 묶음 = IIFE 최상위 구획 주석 `/* ============ 제목 ============ */` 에서 다음 구획 주석 앞까지.
- 최상위 함수 161 · 최상위 변수 487 · window 전역 대입 230줄(module-metrics ③ 의 index.html 몫과 같은 정규식) · addEventListener 124 · on<이벤트> 대입 145 · 로드 중 바로 도는 최상위 문 345 · 인라인 on*="…" 처리기가 부르는 IIFE 이름 43개.
- 난이도 묶음 수(줄): 쉬움 19(304줄) · 보통 38(2823줄) · 어려움 34(7566줄) · 빈 구획 52(826줄) · 이음매(옮기지 않음) 8(253줄).

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
| G119 | 템플릿 복제 보상형 광고(Rewarded Ad) 파이프라인 (TASK-ES-013) | 1379 | 12 | 어려움(77) | 0/1/43 | 2 | 3 | 19(3) |
| G118 | CSV / 엑셀 양방향 연동 & 스마트워치 매핑 & 목표 3각 추적 | 864 | 11 | 보통(24) | 0/0/4 | 0 | 1 | 9(3) |
| G109 | 개인 목표 200% 활용 가이드 & 템플릿 백과사전 (#TASK-ES-135) | 761 | 6 | 어려움(59) | 0/0/10 | 4 | 3 | 20(7) |
| G090 | [#TASK-ES-174] 목표 템플릿 백과사전 전체화면 팝업 및 상호작용 | 568 | 12 | 어려움(82) | 0/1/9 | 20 | 2 | 15(4) |
| G068 | 캘린더 수동 일정 편집 모달 (Req 2 & #TASK-ES-253) | 496 | 1 | 어려움(34) | 0/1/18 | 0 | 2 | 15(4) |
| G010 | [#TASK-ES-432] 인라인 스크립트 세포화 2차 이음매 (docs/architecture/INLINE-SCRIPT-MA | 442 | 0 | 어려움(264) | 17/0/102 | 17 | 0 | 42(20) |
| G099 | [#TASK-ES-220] [생각 메모장 91번] 교대근무자 가변형 루틴 프리셋 & 자동 스케줄러 | 322 | 3 | 어려움(27) | 0/0/7 | 4 | 1 | 8(2) |
| G027 | 뱃지 컬렉션 (명예의 전당) | 312 | 6 | 어려움(279) | 0/0/9 | 4 | 7 | 23(11) |
| G041 | 소셜 로그인 (카카오 / 실제 구글 OAuth 연동) | 306 | 7 | 어려움(26) | 0/1/9 | 2 | 2 | 11(3) |
| G057 | 최초 로그인 활용가이드 — 4대 탭 무블러(Zero Blur) 투명 라이브 프리뷰 융합 | 284 | 5 | 어려움(26) | 0/0/6 | 3 | 2 | 8(2) |

## 3. 권장 순서 (안전한 것부터, 상위 30)

같은 점수면 큰 묶음 먼저(한 번 옮겨 많이 줄인다). 로드 중 문이 있는 묶음은 함수만 옮기고 그 문은 원래 자리에 남긴다(MODULE-SPLIT-PROTOCOL 3절).

| 순서 | 묶음 | 제목 | 줄 | 점수 | 근거(점수가 생긴 곳) |
|--:|---|---|--:|--:|---|
| 1 | G084 | AI feedback (best-effort; provider-aware; local fallback) | 13 | 0 | 없음 |
| 2 | G063 | 결과 기록 (체크박스 대신 수치 입력) | 10 | 0 | 없음 |
| 3 | G078 | 1순위 대표 목표 AI 초집중 모드 (Focus Auto-Pilot) | 9 | 0 | 없음 |
| 4 | G030 | [78 / 89] 데이터분석 프롬프트 백과사전 (실사용 유저 등록·피드 게시 및 도움돼요 상호작용) | 7 | 0 | 없음 |
| 5 | G126 | 소통 피드 (Supabase feed_posts, 실시간 동기화) | 6 | 0 | 없음 |
| 6 | G101 | RENDER: TEMPLATE ENCYCLOPEDIA SUBTAB (#TASK-ES-187) | 3 | 0 | 없음 |
| 7 | G047 | P0: 새 비밀번호 입력 모달 (비밀번호 복구 링크 수신 시) | 9 | 1 | 들어옴 1 |
| 8 | G140 | 세션 복구 및 안전 앱 진입 유틸 | 4 | 3 | 상태 읽기 1 · 로드 중 문 1 |
| 9 | G044 | Goal category templates | 38 | 4 | 로드 중 문 2 |
| 10 | G046 | P0: 비밀번호 찾기 (이메일 재설정 링크 발송) | 10 | 4 | 로드 중 문 2 |
| 11 | G051 | 앱 활용 가이드 다시보기 | 8 | 4 | 로드 중 문 2 |
| 12 | G075 | 신규 유저 10초 활성화: 갓생 스타터 목표 템플릿 | 42 | 6 | 시험지(index 단독) 2 |
| 13 | G062 | 목표 일정 리스케일링 | 36 | 6 | 상태 읽기 1 · FN_NAMES 1 |
| 14 | G017 | 아워골 앱 환경설정 및 보상형 광고 파이프라인 (TASK-ES-013) | 30 | 6 | 로드 중 문 1 · window 1 · 바깥 파일 3 |
| 15 | G023 | 구독 상태 (전체 기능 100% 완전 무료 제공) | 8 | 6 | 상태 읽기 1 · FN_NAMES 1 |
| 16 | G061 | 안내 모달 (전체 기능 100% 완전 무료 제공) | 31 | 7 | 상태 읽기 2 · 로드 중 문 1 · 들어옴 2 · window 1 |
| 17 | G133 | 방해금지 시간대(DND, 조용한 시간) 판별 순수 함수 (TASK-BG-7) | 21 | 7 | 들어옴 2 · FN_NAMES 1 |
| 18 | G079 | 원터치 퀵 루틴 칩 | 11 | 7 | 로드 중 문 2 · 시험지(index 단독) 1 |
| 19 | G005 | [#TASK-ES-453] 인라인 스크립트 세포화 P1 이음매 3 — 목표 종합상황 AI 요약 새로 고침 ( | 8 | 7 | 상태 읽기 2 · 로드 중 문 1 · 시험지(index 단독) 1 |
| 20 | G111 | TASK-ES-307: 측정지표 다중 선택 및 동시 렌더링 엔진 | 62 | 9 | 상태 읽기 1 · 로드 중 문 2 · 들어옴 1 · window 2 · 바깥 파일 1 |
| 21 | G050 | [#TASK-ES-160, #TASK-ES-166, #TASK-ES-180] 각 탭 200% 활용법 및 실제 | 11 | 9 | 상태 읽기 1 · 로드 중 문 3 · window 1 · 바깥 파일 1 |
| 22 | G129 | 통합 딥링크 게이트웨이 & 게스트 소프트 뷰어 3종 (js/viral-sharing.js 위임) | 10 | 9 | 상태 읽기 1 · 로드 중 문 2 · window 2 · 바깥 파일 2 |
| 23 | G127 | 전역 공유 팀 로더 & 렌더링 (#TASK-ES-133) | 7 | 9 | 상태 읽기 1 · 로드 중 문 2 · window 2 · 바깥 파일 2 |
| 24 | G115 | 전문 템플릿 실시간 자동 집계 엔진 (혁신 1) | 174 | 10 | 들어옴 2 · 시험지(index 단독) 1 · FN_NAMES 1 |
| 25 | G082 | 사진 인증 & 뷰어 모달 (가상유저 요청 P1) | 38 | 10 | 상태 읽기 2 · 로드 중 문 4 |
| 26 | G008 | [#TASK-ES-444] 인라인 스크립트 세포화 P1 이음매 2 — 일정 배경·잠금화면 라이브, 소통 창· | 33 | 10 | 상태 읽기 8 · 로드 중 문 1 |
| 27 | G012 | [#TASK-ES-446] 인라인 스크립트 세포화 P2-1 이음매 (docs/architecture/INLI | 24 | 10 | 상태 읽기 8 · 로드 중 문 1 |
| 28 | G052 | 1:1 고객 문의 / 버그 제보 (#TASK-ES-178) | 20 | 10 | 상태 읽기 1 · 로드 중 문 3 · 시험지(index 단독) 1 |
| 29 | G026 | #TASK-ES-165: 앱 진입 아바타 인사 팝업 (화면 절반 크기 & 시간대별 멘트) | 8 | 10 | 상태 읽기 2 · 로드 중 문 2 · window 2 · 바깥 파일 2 |
| 30 | G130 | 마니또 실 유저 익명 응원 연동 (#TASK-ES-133, #TASK-ES-145) | 8 | 10 | 상태 읽기 1 · 로드 중 문 1 · window 1 · 바깥 파일 6 |

## 4. 전체 묶음 표

| 묶음 | 줄 범위 | 줄 | 제목 | 함수 | 변수 | 난이도(점수) | 상태 쓰기 · 변경 · 읽기 | window | 처리기(add/on) | 로드 중 문 | 인라인 처리기 | 들어옴/나감 묶음 | 바깥 파일 | 시험지(index 단독) |
|---|---|--:|---|--:|--:|---|---|--:|---|--:|--:|---|--:|---|
| G000 | 2298~2300 | 3 | (IIFE 머리 — "use strict" 와 첫 구획 앞) | 0 | 0 | 빈 구획(69) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 66(23) |
| G001 | 2301~2379 | 79 | [#TASK-ES-354 CORE-07] 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTO | 0 | 19 | 이음매(옮기지 않음)(67) | 1 · 0 · 40 | 0 | 0/0 | 1 | 0 | 0/9 | 0 | 19(7) |
| G002 | 2380~2421 | 42 | [#TASK-ES-358] 기록 탭 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL | 0 | 4 | 이음매(옮기지 않음)(64) | 1 · 0 · 22 | 0 | 0/0 | 1 | 0 | 0/8 | 0 | 48(12) |
| G003 | 2422~2450 | 29 | [#TASK-ES-360] 일정 탭 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL | 0 | 3 | 이음매(옮기지 않음)(28) | 0 · 0 · 17 | 0 | 0/0 | 1 | 0 | 0/3 | 0 | 9(3) |
| G004 | 2451~2493 | 43 | [#TASK-ES-370] 목표 탭 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL | 0 | 2 | 이음매(옮기지 않음)(67) | 0 · 0 · 29 | 0 | 0/0 | 1 | 0 | 0/5 | 0 | 45(12) |
| G005 | 2494~2501 | 8 | [#TASK-ES-453] 인라인 스크립트 세포화 P1 이음매 3 — 목표 종합상황 AI 요약 새로 고침 ( | 0 | 1 | 쉬움(7) | 0 · 0 · 2 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 3(1) |
| G006 | 2502~2517 | 16 | [#TASK-ES-375] 목표 탭 모듈 이음매 2차 (docs/specs/MODULE-SPLIT-PROTO | 0 | 3 | 이음매(옮기지 않음)(10) | 0 · 0 · 8 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 1(0) |
| G007 | 2518~2539 | 22 | [#TASK-ES-379] 소통 탭 모듈 이음매 1차 (docs/specs/MODULE-SPLIT-PROTO | 0 | 7 | 이음매(옮기지 않음)(14) | 0 · 0 · 9 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 7(1) |
| G008 | 2540~2572 | 33 | [#TASK-ES-444] 인라인 스크립트 세포화 P1 이음매 2 — 일정 배경·잠금화면 라이브, 소통 창· | 0 | 23 | 보통(10) | 0 · 0 · 8 | 0 | 0/0 | 1 | 0 | 0/1 | 0 | 5(0) |
| G009 | 2573~2584 | 12 | [#TASK-ES-423] 인라인 스크립트 세포화 1차 이음매 (docs/architecture/INLINE | 0 | 5 | 이음매(옮기지 않음)(5) | 0 · 0 · 3 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 3(0) |
| G010 | 2585~3026 | 442 | [#TASK-ES-432] 인라인 스크립트 세포화 2차 이음매 (docs/architecture/INLINE | 0 | 207 | 어려움(264) | 17 · 0 · 102 | 0 | 0/0 | 17 | 0 | 0/18 | 0 | 42(20) |
| G011 | 3027~3060 | 34 | [#TASK-ES-436] 인라인 스크립트 세포화 P1 이음매 1 — 목표 AI·일정 설정, 기록 AI 피드 | 0 | 15 | 보통(21) | 0 · 0 · 13 | 0 | 0/0 | 1 | 0 | 0/1 | 0 | 4(2) |
| G012 | 3061~3084 | 24 | [#TASK-ES-446] 인라인 스크립트 세포화 P2-1 이음매 (docs/architecture/INLI | 0 | 9 | 보통(10) | 0 · 0 · 8 | 0 | 0/0 | 1 | 0 | 0/2 | 0 | 2(0) |
| G013 | 3085~3149 | 65 | [#TASK-ES-448] 인라인 스크립트 세포화 P2-2 이음매 (docs/architecture/INLI | 0 | 43 | 어려움(26) | 1 · 0 · 9 | 0 | 0/0 | 2 | 0 | 0/2 | 0 | 11(3) |
| G014 | 3150~3185 | 36 | [#TASK-ES-437] 인라인 스크립트 세포화 P0 이음매 (docs/architecture/INLINE | 0 | 20 | 보통(23) | 1 · 0 · 11 | 0 | 0/0 | 1 | 0 | 0/2 | 0 | 7(2) |
| G015 | 3186~3223 | 38 | [#TASK-ES-442] 인라인 스크립트 세포화 P0 이음매 (docs/architecture/INLINE | 0 | 20 | 보통(24) | 2 · 0 · 11 | 0 | 0/0 | 1 | 0 | 0/2 | 0 | 10(1) |
| G016 | 3224~3262 | 39 | Supabase | 1 | 5 | 보통(25) | 0 · 0 · 2 | 1 | 0/0 | 2 | 0 | 4/0 | 2 | 9(4) |
| G017 | 3263~3292 | 30 | 아워골 앱 환경설정 및 보상형 광고 파이프라인 (TASK-ES-013) | 0 | 1 | 쉬움(6) | 0 · 0 · 0 | 1 | 0/0 | 1 | 0 | 0/0 | 3 | 1(0) |
| G018 | 3293~3300 | 8 | [#TASK-ES-264] 표준 시간대(한국 KST 00:00, 타 국가는 해당 국가 표준시 00:00) 기 | 0 | 0 | 빈 구획(9) | 0 · 0 · 2 | 2 | 0/0 | 1 | 0 | 0/0 | 3 | 2(0) |
| G019 | 3301~3323 | 23 | Confetti | 1 | 1 | 어려움(237) | 0 · 0 · 1 | 3 | 0/1 | 2 | 1 | 39/0 | 185 | 2(1) |
| G020 | 3324~3339 | 16 | 8대 화면 스타일 (테마) 정의 | 0 | 1 | 보통(21) | 0 · 0 · 1 | 2 | 0/0 | 1 | 0 | 0/0 | 4 | 10(4) |
| G021 | 3340~3343 | 4 | 가상유저 개선 10대 핵심 헬퍼 함수 | 0 | 0 | 빈 구획(42) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 38 | 1(0) |
| G022 | 3344~3356 | 13 | [#TASK-ES-345 CAL-02] 구글 캘린더 토큰·일정 캐시 계정 격리 | 0 | 0 | 빈 구획(18) | 0 · 0 · 3 | 3 | 0/0 | 1 | 0 | 0/0 | 7 | 2(1) |
| G023 | 3357~3364 | 8 | 구독 상태 (전체 기능 100% 완전 무료 제공) | 1 | 0 | 쉬움(6) | 0 · 0 · 1 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G024 | 3365~3470 | 106 | XP/레벨 시스템 | 3 | 0 | 어려움(84) | 0 · 0 · 12 | 6 | 0/2 | 6 | 0 | 4/3 | 17 | 15(11) |
| G025 | 3471~3492 | 22 | [#TASK-ES-150] 아바타 레벨업 대형 팝업 & 성장 성향 키워드 | 0 | 6 | 어려움(41) | 0 · 0 · 6 | 2 | 2/0 | 14 | 0 | 0/0 | 2 | 3(1) |
| G026 | 3493~3500 | 8 | #TASK-ES-165: 앱 진입 아바타 인사 팝업 (화면 절반 크기 & 시간대별 멘트) | 0 | 1 | 보통(10) | 0 · 0 · 2 | 2 | 0/0 | 2 | 0 | 0/0 | 2 | 1(0) |
| G027 | 3501~3812 | 312 | 뱃지 컬렉션 (명예의 전당) | 6 | 1 | 어려움(279) | 0 · 0 · 9 | 4 | 0/0 | 4 | 0 | 7/2 | 213 | 23(11) |
| G028 | 3813~3816 | 4 | [70] 다른 모든 기기 원격 로그아웃 전 로그인 기기 목록 확인 모달 | 0 | 0 | 빈 구획(7) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 3 | 0(0) |
| G029 | 3817~3838 | 22 | [71] 앱 잠금 PIN (이 기기) — 설정·해제·앱 진입 확인 | 0 | 1 | 보통(16) | 0 · 0 · 5 | 5 | 0/0 | 2 | 0 | 0/0 | 2 | 0(0) |
| G030 | 3839~3845 | 7 | [78 / 89] 데이터분석 프롬프트 백과사전 (실사용 유저 등록·피드 게시 및 도움돼요 상호작용) | 0 | 2 | 쉬움(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 2(0) |
| G031 | 3846~3850 | 5 | [80] 템플릿백과사전 1초 자동이식 선택 연동 및 로드맵-목표상태 동기화 | 0 | 0 | 빈 구획(6) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 2 | 0(0) |
| G032 | 3851~3854 | 4 | [82] 팀 목표 내 '팀 연계 개인목표' 생성 모달 | 0 | 0 | 빈 구획(7) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 3 | 1(0) |
| G033 | 3855~3859 | 5 | [83] 팀원 초대 시 '아워골 동반자 초대하기' 인앱 초대·참가 기능 | 0 | 0 | 빈 구획(9) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 5 | 1(0) |
| G034 | 3860~3863 | 4 | [88] 오늘의 3초 체크인 목표 버튼 선택 시 플레이스홀더(백그라운드 가이드) 예시 문구 렌더링 | 0 | 0 | 빈 구획(6) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 2 | 0(0) |
| G035 | 3864~3874 | 11 | [#TASK-UIUX-PHASE3-HOME-COCKPIT] 홈 1초 조망 ↔ 무저항 체크인 콕핏 8대 과업 | 0 | 0 | 빈 구획(138) | 0 · 0 · 4 | 6 | 0/0 | 5 | 0 | 0/1 | 118 | 0(0) |
| G036 | 3875~3987 | 113 | 서버 관리자 API를 통한 기록 및 프로필 복구 (#TASK-ES-036) | 1 | 0 | 보통(24) | 0 · 0 · 6 | 0 | 0/0 | 0 | 0 | 3/2 | 0 | 12(5) |
| G037 | 3988~3988 | 1 | Landing | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G038 | 3989~4001 | 13 | [#TASK-ES-222] [생각 메모장 92번] 카카오톡 인앱 브라우저 감지 및 Android Chrome | 0 | 2 | 어려움(27) | 0 · 0 · 6 | 2 | 0/0 | 9 | 0 | 0/0 | 1 | 1(0) |
| G039 | 4002~4039 | 38 | 2계정 상호작용 테스트 (테스터 B 직통 입장: #TASK-ES-169) | 1 | 2 | 보통(20) | 0 · 1 · 1 | 1 | 2/0 | 5 | 0 | 0/3 | 0 | 7(2) |
| G040 | 4040~4048 | 9 | [#TASK-ES-223] [생각 메모장 93번] 개발 디버그 버튼 프로덕션 완전 소거 및 로컬/디버그 격리 | 0 | 0 | 빈 구획(10) | 0 · 0 · 1 | 1 | 1/0 | 2 | 0 | 0/0 | 1 | 1(1) |
| G041 | 4049~4354 | 306 | 소셜 로그인 (카카오 / 실제 구글 OAuth 연동) | 7 | 2 | 어려움(26) | 0 · 1 · 9 | 0 | 2/7 | 2 | 0 | 2/4 | 0 | 11(3) |
| G042 | 4355~4359 | 5 | [#TASK-ES-224] [생각 메모장 94번] 게스트(둘러보기) 3회 기록 시 안전 백업 넛지 및 카카오 | 0 | 0 | 빈 구획(11) | 0 · 0 · 2 | 2 | 0/0 | 2 | 0 | 0/0 | 3 | 0(0) |
| G043 | 4360~4363 | 4 | [#TASK-ES-224] [생각 메모장 94번] 카카오/소셜/일반 로그인 시 게스트 데이터 100% 무손실 | 0 | 0 | 빈 구획(7) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 3 | 0(0) |
| G044 | 4364~4401 | 38 | Goal category templates | 0 | 4 | 쉬움(4) | 0 · 0 · 0 | 0 | 1/0 | 2 | 0 | 0/0 | 0 | 3(0) |
| G045 | 4402~4515 | 114 | 디바이스 세션 & 원격 로그아웃 유틸 (Req 1) | 5 | 0 | 보통(25) | 0 · 1 · 8 | 0 | 1/0 | 1 | 0 | 7/3 | 0 | 10(2) |
| G046 | 4516~4525 | 10 | P0: 비밀번호 찾기 (이메일 재설정 링크 발송) | 1 | 1 | 쉬움(4) | 0 · 0 · 0 | 0 | 1/0 | 2 | 0 | 0/0 | 0 | 1(0) |
| G047 | 4526~4534 | 9 | P0: 새 비밀번호 입력 모달 (비밀번호 복구 링크 수신 시) | 1 | 0 | 쉬움(1) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 1/0 | 0 | 1(0) |
| G048 | 4535~4634 | 100 | P0: 회원 탈퇴 30일 유예(소프트 삭제) 복구 체크 | 0 | 1 | 보통(20) | 0 · 1 · 5 | 0 | 4/0 | 5 | 0 | 0/6 | 0 | 7(1) |
| G049 | 4635~4811 | 177 | 회원 탈퇴 전용 안내 모달 및 법적책임·데이터분실 사전 안내 (#TASK-ES-158) | 4 | 0 | 어려움(28) | 0 · 1 · 6 | 0 | 1/4 | 1 | 0 | 0/2 | 0 | 14(6) |
| G050 | 4812~4822 | 11 | [#TASK-ES-160, #TASK-ES-166, #TASK-ES-180] 각 탭 200% 활용법 및 실제 | 0 | 1 | 보통(9) | 0 · 0 · 1 | 1 | 1/0 | 3 | 0 | 0/0 | 1 | 1(0) |
| G051 | 4823~4830 | 8 | 앱 활용 가이드 다시보기 | 0 | 1 | 쉬움(4) | 0 · 0 · 0 | 0 | 1/0 | 2 | 0 | 0/1 | 0 | 1(0) |
| G052 | 4831~4850 | 20 | 1:1 고객 문의 / 버그 제보 (#TASK-ES-178) | 0 | 1 | 보통(10) | 0 · 0 · 1 | 0 | 2/0 | 3 | 0 | 0/1 | 0 | 3(1) |
| G053 | 4851~4860 | 10 | 이용약관 / 개인정보처리방침 열람 리스너 | 0 | 0 | 빈 구획(5) | 0 · 0 · 1 | 0 | 2/0 | 2 | 0 | 0/0 | 0 | 1(0) |
| G054 | 4861~4991 | 131 | Enter app | 1 | 0 | 어려움(58) | 0 · 0 · 16 | 0 | 5/0 | 6 | 0 | 6/7 | 0 | 19(8) |
| G055 | 4992~4995 | 4 | Onboarding (first-time, after signup) — 16종 동물 아바타 & 직관적 안착  | 0 | 0 | 빈 구획(6) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 2 | 0(0) |
| G056 | 4996~5005 | 10 | 3단계: 첫 체크인 튜토리얼 가이드 및 축하 연출 | 0 | 0 | 빈 구획(14) | 0 · 0 · 3 | 3 | 0/0 | 3 | 0 | 0/0 | 2 | 0(0) |
| G057 | 5006~5289 | 284 | 최초 로그인 활용가이드 — 4대 탭 무블러(Zero Blur) 투명 라이브 프리뷰 융합 | 5 | 2 | 어려움(26) | 0 · 0 · 6 | 1 | 12/9 | 3 | 0 | 2/2 | 0 | 8(2) |
| G058 | 5290~5297 | 8 | 조선소 블록 레지스트리 6대 메가블록 초기화 (헌법 제3조 제9항) | 0 | 0 | 빈 구획(56) | 0 · 0 · 3 | 2 | 0/0 | 3 | 0 | 0/0 | 45 | 0(0) |
| G059 | 5298~5364 | 67 | Modal helper & Android Hardware Back Handler | 1 | 2 | 어려움(163) | 0 · 0 · 4 | 5 | 0/2 | 2 | 0 | 21/0 | 123 | 5(2) |
| G060 | 5365~5370 | 6 | 이용약관 & 개인정보처리방침 모달 | 0 | 0 | 빈 구획(5) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 1 | 1(0) |
| G061 | 5371~5401 | 31 | 안내 모달 (전체 기능 100% 완전 무료 제공) | 2 | 0 | 쉬움(7) | 0 · 0 · 2 | 1 | 0/1 | 1 | 0 | 2/1 | 0 | 2(0) |
| G062 | 5402~5437 | 36 | 목표 일정 리스케일링 | 1 | 0 | 쉬움(6) | 0 · 0 · 1 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G063 | 5438~5447 | 10 | 결과 기록 (체크박스 대신 수치 입력) | 0 | 1 | 쉬움(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G064 | 5448~5465 | 18 | 프로필 | 0 | 0 | 빈 구획(25) | 0 · 0 · 5 | 4 | 0/0 | 5 | 0 | 0/0 | 6 | 2(0) |
| G065 | 5466~5466 | 1 | 구글 캘린더 연동 | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G066 | 5467~5517 | 51 | [#TASK-ES-153] 전역 7일 유예 통합 휴지통 (Recycle Bin) 시스템 | 2 | 1 | 어려움(36) | 0 · 1 · 8 | 6 | 0/0 | 1 | 0 | 3/0 | 7 | 3(1) |
| G067 | 5518~5527 | 10 | [#TASK-ES-153 & #TASK-ES-155] 캘린더 일자별 배경 사진 지정 모달 | 0 | 0 | 빈 구획(15) | 0 · 0 · 2 | 2 | 0/0 | 2 | 0 | 0/0 | 7 | 0(0) |
| G068 | 5528~6023 | 496 | 캘린더 수동 일정 편집 모달 (Req 2 & #TASK-ES-253) | 1 | 0 | 어려움(34) | 0 · 1 · 18 | 0 | 0/10 | 0 | 0 | 2/3 | 0 | 15(4) |
| G069 | 6024~6045 | 22 | [#TASK-ES-181 & #TASK-ES-182] 폰 잠금화면에서 바로 보기 통합 허브 모달 | 0 | 0 | 빈 구획(74) | 0 · 0 · 12 | 13 | 0/0 | 1 | 0 | 0/1 | 47 | 1(0) |
| G070 | 6046~6301 | 256 | 5대 테마 온톨로지 & 경량 AI 분류기 (TASK-OG-001) | 3 | 4 | 어려움(39) | 0 · 0 · 17 | 0 | 0/0 | 0 | 0 | 2/0 | 0 | 14(5) |
| G071 | 6302~6307 | 6 | Adaptive UX Mode | 0 | 0 | 빈 구획(5) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 1 | 0(0) |
| G072 | 6308~6314 | 7 | Social Crew Pacing (#TASK-ES-228) | 0 | 0 | 빈 구획(17) | 0 · 0 · 4 | 4 | 0/0 | 4 | 0 | 0/0 | 1 | 0(0) |
| G073 | 6315~6337 | 23 | UX Telemetry (Hesitation & Rage Tap) | 0 | 1 | 보통(12) | 0 · 0 · 1 | 2 | 1/0 | 3 | 0 | 0/0 | 3 | 0(0) |
| G074 | 6338~6341 | 4 | iOS 사파리 홈 화면 추가 안내 배너 & 실시간 알림 가이드 (#TASK-ES-234) | 0 | 0 | 빈 구획(5) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 1 | 1(0) |
| G075 | 6342~6383 | 42 | 신규 유저 10초 활성화: 갓생 스타터 목표 템플릿 | 0 | 1 | 쉬움(6) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 4(2) |
| G076 | 6384~6599 | 216 | RENDER: HOME | 1 | 0 | 어려움(81) | 0 · 1 · 28 | 0 | 8/2 | 0 | 0 | 6/6 | 0 | 52(15) |
| G077 | 6600~6745 | 146 | 11인 외부 UI/UX 감시 및 개선팀 핵심 기능 구현 | 3 | 0 | 어려움(34) | 0 · 0 · 10 | 0 | 0/4 | 0 | 0 | 3/2 | 0 | 9(7) |
| G078 | 6746~6754 | 9 | 1순위 대표 목표 AI 초집중 모드 (Focus Auto-Pilot) | 0 | 3 | 쉬움(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G079 | 6755~6765 | 11 | 원터치 퀵 루틴 칩 | 0 | 1 | 쉬움(7) | 0 · 0 · 0 | 0 | 1/0 | 2 | 0 | 0/0 | 0 | 2(1) |
| G080 | 6766~7002 | 237 | 🎙️ 마이크 권한 거부 상태 자가 진단 및 1초 권한 허용 모달 (#TASK-ES-227) | 1 | 0 | 보통(16) | 0 · 0 · 2 | 1 | 1/5 | 1 | 0 | 2/1 | 0 | 9(3) |
| G081 | 7003~7073 | 71 | 음성 체크인 (Web Speech API) | 0 | 0 | 빈 구획(5) | 0 · 0 · 0 | 0 | 6/0 | 1 | 0 | 0/2 | 0 | 2(1) |
| G082 | 7074~7111 | 38 | 사진 인증 & 뷰어 모달 (가상유저 요청 P1) | 0 | 4 | 보통(10) | 0 · 0 · 2 | 0 | 2/2 | 4 | 0 | 0/0 | 0 | 1(0) |
| G083 | 7112~7120 | 9 | 체크인 입력 글자수 힌트 (#TASK-ES-367: 열 수 없던 활동 테마 선택 창·배지 제거, 승인 202 | 0 | 3 | 보통(15) | 0 · 0 · 2 | 0 | 0/0 | 5 | 0 | 0/0 | 0 | 3(1) |
| G084 | 7121~7133 | 13 | AI feedback (best-effort; provider-aware; local fallback) | 0 | 1 | 쉬움(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G085 | 7134~7279 | 146 | [#TASK-ES-225] [생각 메모장 95번] Gemini API 분당 쿼터(Rate Limit 429) | 0 | 4 | 보통(12) | 0 · 0 · 2 | 2 | 0/0 | 2 | 0 | 0/1 | 1 | 2(1) |
| G086 | 7280~7296 | 17 | 맞춤 피드백 봇 설정 | 0 | 0 | 빈 구획(31) | 0 · 0 · 6 | 5 | 3/0 | 7 | 0 | 0/0 | 3 | 2(1) |
| G087 | 7297~7300 | 4 | 목표 & 기록 선택 피드 공유 모달 (전면 고도화) | 0 | 0 | 빈 구획(8) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 4 | 1(0) |
| G088 | 7301~7306 | 6 | [#TASK-ES-301] 피드 게시 모달 내 '미리보기' 토글 직통 헬퍼 | 0 | 0 | 빈 구획(7) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 3 | 1(0) |
| G089 | 7307~7316 | 10 | 외부 데이터 불러오기 (mock) | 0 | 4 | 어려움(28) | 0 · 0 · 4 | 0 | 3/0 | 9 | 0 | 0/0 | 0 | 3(2) |
| G090 | 7317~7884 | 568 | [#TASK-ES-174] 목표 템플릿 백과사전 전체화면 팝업 및 상호작용 | 12 | 8 | 어려움(82) | 0 · 1 · 9 | 9 | 9/3 | 20 | 2 | 2/2 | 4 | 15(4) |
| G091 | 7885~7915 | 31 | [#TASK-ES-146] 아워골 평가해주기 90% 팝업 | 0 | 5 | 어려움(46) | 0 · 0 · 8 | 3 | 3/1 | 15 | 0 | 0/0 | 2 | 3(1) |
| G092 | 7916~7925 | 10 | New goal modal | 0 | 0 | 빈 구획(11) | 0 · 0 · 2 | 1 | 0/0 | 2 | 0 | 0/0 | 4 | 2(0) |
| G093 | 7926~7926 | 1 | 참고자료 (유튜브/영상, 이미지, 텍스트 메모, 웹링크) | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G094 | 7927~7935 | 9 | 참고자료 (유튜브/영상, 이미지, 텍스트 메모, 웹링크) | 0 | 0 | 빈 구획(21) | 0 · 0 · 4 | 4 | 0/0 | 1 | 0 | 0/0 | 5 | 3(2) |
| G095 | 7936~7959 | 24 | 목표 AI 생성 전체 템플릿 양식 및 세부 항목 미리보기 (Req 5) | 0 | 1 | 보통(14) | 0 · 0 · 2 | 1 | 3/0 | 5 | 0 | 0/0 | 1 | 0(0) |
| G096 | 7960~8133 | 174 | 목표 보관(기록으로 옮기기) | 3 | 0 | 어려움(245) | 0 · 1 · 7 | 4 | 1/0 | 2 | 1 | 3/2 | 213 | 6(2) |
| G097 | 8134~8214 | 81 | [#TASK-ES-264] 오늘의 미션 및 AI 피드백 조건부 호출 최적화 | 2 | 0 | 어려움(30) | 0 · 1 · 8 | 1 | 0/1 | 1 | 0 | 2/0 | 0 | 14(5) |
| G098 | 8215~8226 | 12 | 목표 탭 3계층 일정설정 / 디데이·기간 표시 및 캘린더 연동 (#TASK-ES-259, 메모장 03항, # | 0 | 0 | 빈 구획(26) | 0 · 0 · 7 | 7 | 0/0 | 1 | 0 | 0/0 | 7 | 2(1) |
| G099 | 8227~8548 | 322 | [#TASK-ES-220] [생각 메모장 91번] 교대근무자 가변형 루틴 프리셋 & 자동 스케줄러 | 3 | 1 | 어려움(27) | 0 · 0 · 7 | 4 | 0/8 | 4 | 0 | 1/2 | 1 | 8(2) |
| G100 | 8549~8718 | 170 | [#TASK-ES-172] [27] 목표 탭: 데일리 루틴 서브탭 & 편집/상세 모달 | 1 | 0 | 보통(21) | 0 · 0 · 7 | 2 | 0/5 | 1 | 0 | 1/3 | 3 | 10(2) |
| G101 | 8719~8721 | 3 | RENDER: TEMPLATE ENCYCLOPEDIA SUBTAB (#TASK-ES-187) | 0 | 2 | 쉬움(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G102 | 8722~8736 | 15 | [#TASK-ES-189] 템플릿 백과사전 3대 분류(개인·루틴·팀) 및 AI/실유저 2원화 이식 시스템 | 0 | 4 | 어려움(35) | 0 · 0 · 6 | 8 | 0/0 | 8 | 0 | 0/0 | 2 | 4(1) |
| G103 | 8737~8890 | 154 | [UI/UX 틀 개편 Phase 4] 목표 탭 노션급 데이터 관리 & 인지순행 IA (#TASK-UIUX-P | 7 | 0 | 어려움(74) | 0 · 1 · 10 | 14 | 0/0 | 13 | 6 | 1/1 | 4 | 5(2) |
| G104 | 8891~9049 | 159 | [PHASE 5] #TASK-UIUX-PHASE5-RECORDS-CALENDAR FUNCTIONS | 4 | 0 | 어려움(56) | 1 · 1 · 5 | 14 | 0/0 | 8 | 4 | 0/1 | 1 | 9(4) |
| G105 | 9050~9059 | 10 | [PHASE 6] #TASK-UIUX-PHASE6-COMM-SETTINGS FUNCTIONS | 0 | 0 | 빈 구획(18) | 0 · 0 · 4 | 4 | 0/0 | 4 | 0 | 0/0 | 2 | 0(0) |
| G106 | 9060~9082 | 23 | [UI/UX 프레임워크 개편 Phase 7] 모바일 하드웨어 인터랙션 & 사용성 하드닝 | 0 | 0 | 빈 구획(23) | 0 · 0 · 5 | 4 | 1/0 | 5 | 0 | 0/0 | 1 | 1(1) |
| G107 | 9083~9085 | 3 | RENDER: GOALS | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G108 | 9086~9345 | 260 | RENDER: 팀 목표 (팀장·매니저만 추가/수정/삭제, 팀원은 보기만) | 17 | 3 | 어려움(52) | 0 · 0 · 13 | 0 | 2/0 | 0 | 0 | 6/4 | 0 | 18(6) |
| G109 | 9346~10106 | 761 | 개인 목표 200% 활용 가이드 & 템플릿 백과사전 (#TASK-ES-135) | 6 | 0 | 어려움(59) | 0 · 0 · 10 | 4 | 18/0 | 4 | 0 | 3/2 | 13 | 20(7) |
| G110 | 10107~10198 | 92 | [#TASK-ES-299] 팀 목표 댓글 작성 및 전송 직통 헬퍼 & 전역 이벤트 위임 (먹통 방어 100% | 0 | 0 | 빈 구획(24) | 0 · 2 · 10 | 1 | 2/0 | 3 | 0 | 0/1 | 3 | 3(0) |
| G111 | 10199~10260 | 62 | TASK-ES-307: 측정지표 다중 선택 및 동시 렌더링 엔진 | 1 | 0 | 보통(9) | 0 · 0 · 1 | 2 | 0/0 | 2 | 0 | 1/0 | 1 | 2(0) |
| G112 | 10261~10289 | 29 | 기록 히트맵 (GitHub 히트맵 스타일) | 2 | 2 | 보통(16) | 0 · 0 · 4 | 0 | 0/0 | 0 | 0 | 2/0 | 0 | 2(0) |
| G113 | 10290~10291 | 2 | 5대 테마 원형 라이프 밸런스 휠 (SVG Pie Chart) | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G114 | 10292~10567 | 276 | [#TASK-ES-233] 3일 실천 완성 나의 6각 성장 차트 미리보기 SVG 렌더러 | 4 | 0 | 어려움(28) | 0 · 1 · 9 | 0 | 6/0 | 0 | 0 | 2/2 | 0 | 14(5) |
| G115 | 10568~10741 | 174 | 전문 템플릿 실시간 자동 집계 엔진 (혁신 1) | 1 | 0 | 보통(10) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 2/0 | 0 | 2(1) |
| G116 | 10742~10852 | 111 | 📈 표 기록 기반 일자별 자동 성장 추이 차트 (Visual Trend Chart) | 1 | 0 | 보통(17) | 0 · 0 · 2 | 0 | 0/0 | 0 | 0 | 1/1 | 0 | 9(3) |
| G117 | 10853~10874 | 22 | ⏱️ 인앱 인터벌 타이머 & 스톱워치 위젯 (In-Table Stopwatch) | 1 | 0 | 보통(17) | 0 · 0 · 3 | 2 | 0/0 | 1 | 0 | 1/0 | 1 | 4(1) |
| G118 | 10875~11738 | 864 | CSV / 엑셀 양방향 연동 & 스마트워치 매핑 & 목표 3각 추적 | 11 | 2 | 보통(24) | 0 · 0 · 4 | 0 | 0/29 | 0 | 0 | 1/3 | 0 | 9(3) |
| G119 | 11739~13117 | 1379 | 템플릿 복제 보상형 광고(Rewarded Ad) 파이프라인 (TASK-ES-013) | 12 | 0 | 어려움(77) | 0 · 1 · 43 | 1 | 3/49 | 2 | 0 | 3/7 | 0 | 19(3) |
| G120 | 13118~13153 | 36 | [#TASK-ES-358] 기록 탭 렌더 → js/tabs/records/period-ai-card.js · | 0 | 0 | 빈 구획(63) | 0 · 1 · 10 | 7 | 0/0 | 2 | 0 | 0/1 | 40 | 4(0) |
| G121 | 13154~13166 | 13 | 위클리 리캡 카드 (스포티파이 랩드 스타일, 공유 캔버스 인프라 재사용) | 0 | 2 | 어려움(28) | 0 · 0 · 8 | 0 | 3/0 | 10 | 0 | 0/0 | 0 | 1(0) |
| G122 | 13167~13199 | 33 | 테마별 기록 DB 다운로드 & 외부 AI 분석 프롬프트 번들 (TASK-OG-001) | 2 | 0 | 보통(19) | 0 · 0 · 5 | 0 | 0/0 | 0 | 0 | 1/0 | 0 | 2(1) |
| G123 | 13200~13200 | 1 | RFC 5545 표준 iCalendar (.ics) 생성 순수 함수 (TASK-BG-11) | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G124 | 13201~13377 | 177 | 캘린더 실시간 구독 URL 생성기 (WebCal Feed & #TASK-ES-252 HMAC 서명) | 1 | 2 | 어려움(37) | 0 · 0 · 3 | 2 | 1/0 | 3 | 0 | 2/0 | 9 | 7(5) |
| G125 | 13378~13426 | 49 | 크리에이터 템플릿 (#TASK-ES-315, 64: 구형 창 영구 제거 및 무해화) | 2 | 0 | 어려움(29) | 0 · 1 · 8 | 1 | 0/0 | 1 | 0 | 3/2 | 4 | 10(3) |
| G126 | 13427~13432 | 6 | 소통 피드 (Supabase feed_posts, 실시간 동기화) | 0 | 1 | 쉬움(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 2(0) |
| G127 | 13433~13439 | 7 | 전역 공유 팀 로더 & 렌더링 (#TASK-ES-133) | 0 | 1 | 보통(9) | 0 · 0 · 1 | 2 | 0/0 | 2 | 0 | 0/0 | 2 | 1(0) |
| G128 | 13440~13463 | 24 | [PEER INVITE] '함께 목표' 방 초대 루프 (웹 무설치 즉시 수락) | 3 | 0 | 어려움(28) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 1/0 | 0 | 8(4) |
| G129 | 13464~13473 | 10 | 통합 딥링크 게이트웨이 & 게스트 소프트 뷰어 3종 (js/viral-sharing.js 위임) | 1 | 1 | 보통(9) | 0 · 0 · 1 | 2 | 0/0 | 2 | 0 | 0/0 | 2 | 1(0) |
| G130 | 13474~13481 | 8 | 마니또 실 유저 익명 응원 연동 (#TASK-ES-133, #TASK-ES-145) | 0 | 3 | 보통(10) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 6 | 1(0) |
| G131 | 13482~13506 | 25 | DM & 동반자 소통 시스템 (TASK-ES-105) | 1 | 0 | 보통(16) | 0 · 0 · 3 | 2 | 1/0 | 3 | 0 | 1/0 | 4 | 2(0) |
| G132 | 13507~13516 | 10 | [#TASK-ES-354 CORE-07·SET-07] 설정 탭 렌더 → js/tabs/settings/ren | 0 | 0 | 이음매(옮기지 않음)(22) | 0 · 0 · 5 | 3 | 0/0 | 5 | 0 | 0/0 | 4 | 1(0) |
| G133 | 13517~13537 | 21 | 방해금지 시간대(DND, 조용한 시간) 판별 순수 함수 (TASK-BG-7) | 1 | 0 | 쉬움(7) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 2/0 | 0 | 1(0) |
| G134 | 13538~13589 | 52 | 맥락 기반 다이내믹 알림 문구 생성 | 1 | 0 | 보통(19) | 0 · 0 · 3 | 0 | 0/0 | 0 | 0 | 2/1 | 0 | 6(3) |
| G135 | 13590~13620 | 31 | Notifications (best-effort, tab must be open) | 2 | 0 | 보통(16) | 0 · 1 · 6 | 0 | 1/0 | 0 | 0 | 2/2 | 0 | 5(2) |
| G136 | 13621~13674 | 54 | Web Push (앱이 꺼져 있어도 오는 알림) | 3 | 0 | 보통(13) | 0 · 0 · 1 | 0 | 0/0 | 0 | 0 | 3/1 | 0 | 11(3) |
| G137 | 13675~13680 | 6 | 4대 연계 뷰 원자적 동시 전파 디스패처 (헌법 제1조 제4항 제5호 & 제15조 제6항 제3호) | 0 | 0 | 빈 구획(30) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 26 | 0(0) |
| G138 | 13681~13715 | 35 | [#TASK-ES-264] 자정(00:00 KST / 현지 표준시) 날짜 변경 감지 및 자동 동기화 워처 | 2 | 1 | 보통(12) | 0 · 0 · 5 | 3 | 2/0 | 0 | 0 | 1/1 | 0 | 3(1) |
| G139 | 13716~13728 | 13 | Render all | 1 | 0 | 보통(24) | 0 · 0 · 7 | 0 | 0/0 | 0 | 0 | 8/2 | 0 | 10(3) |
| G140 | 13729~13732 | 4 | 세션 복구 및 안전 앱 진입 유틸 | 0 | 1 | 쉬움(3) | 0 · 0 · 1 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 0(0) |
| G141 | 13733~13745 | 13 | #TASK-AUTH-P0-SAFETY: 로그인/계정 보안 패키지 모듈 연결 | 0 | 0 | 빈 구획(6) | 0 · 0 · 4 | 0 | 0/0 | 1 | 0 | 0/4 | 0 | 0(0) |
| G142 | 13746~13973 | 228 | Boot | 0 | 0 | 빈 구획(25) | 0 · 1 · 9 | 0 | 0/0 | 1 | 0 | 0/6 | 0 | 11(4) |
| G143 | 13974~13976 | 3 | #TASK-ES-015 FIX: 공용 크레딧 모듈(js/credits.js)에 앱 sb 주입 | 0 | 0 | 빈 구획(3) | 0 · 0 · 1 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 1(0) |
| G144 | 13977~13990 | 14 | KF-7 #TASK-ES-014: 반응 4종 모듈(js/reactions.js)에 앱 핸들 연결 | 0 | 0 | 빈 구획(14) | 0 · 0 · 9 | 0 | 0/0 | 1 | 0 | 0/2 | 0 | 4(1) |
| G145 | 13991~13995 | 5 | KF-4 #TASK-ES-018: 카테고리별 도움이 된 글 슬롯 모듈(js/top-helpful.js) | 0 | 0 | 빈 구획(3) | 0 · 0 · 1 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 1(0) |
| G146 | 13996~14004 | 9 | KF-5 #TASK-ES-016: 도움돼요 이유 모듈(js/helpful-reason.js)에 앱 핸들 연결 | 0 | 0 | 빈 구획(11) | 0 · 0 · 6 | 0 | 0/0 | 1 | 0 | 0/2 | 0 | 3(1) |
| G147 | 14005~14012 | 8 | #TASK-ES-105: 팀 초대 및 소통/DM/동반자 모듈(js/team-invite-comm.js) 연결 | 0 | 0 | 빈 구획(22) | 0 · 0 · 11 | 0 | 0/0 | 1 | 0 | 0/3 | 0 | 8(3) |
| G148 | 14013~14021 | 9 | #TASK-ES-105: 팀 연계 개인목표 및 상호 체크 모듈(js/team-linked-goals.js)  | 0 | 0 | 빈 구획(26) | 0 · 0 · 13 | 0 | 0/0 | 2 | 0 | 0/5 | 0 | 5(3) |
| G149 | 14022~14026 | 5 | KF-2 #TASK-ES-017: 템플릿 복제 크레딧 모듈(js/template-credit.js)에 앱 핸 | 0 | 0 | 빈 구획(4) | 0 · 0 · 2 | 0 | 0/0 | 1 | 0 | 0/2 | 0 | 1(0) |
| G150 | 14027~14069 | 43 | PWA: Service Worker 등록 및 자동 업데이트 감지 (#TASK-ES-118) | 0 | 0 | 빈 구획(218) | 0 · 0 · 10 | 8 | 5/0 | 10 | 0 | 0/2 | 174 | 4(2) |

## 5. 묶음별 의존 상세 (옮길 대상만, 권장 순서)

### G084 AI feedback (best-effort; provider-aware; local fallback)

- 7121~7133줄(13줄) · 쉬움(0)
- 함수(0): 없음
- 변수(1): THEME_FEEDBACK_PROMPTS
- 시험지 글자 의존: scripts/smoke-test.js

### G063 결과 기록 (체크박스 대신 수치 입력)

- 5438~5447줄(10줄) · 쉬움(0)
- 함수(0): 없음
- 변수(1): RESULT_UNITS
- 시험지 글자 의존: scripts/smoke-test.js

### G078 1순위 대표 목표 AI 초집중 모드 (Focus Auto-Pilot)

- 6746~6754줄(9줄) · 쉬움(0)
- 함수(0): 없음
- 변수(3): focusTimerInterval, focusTimerRunning, focusTimerSeconds
- 시험지 글자 의존: scripts/smoke-test.js

### G030 [78 / 89] 데이터분석 프롬프트 백과사전 (실사용 유저 등록·피드 게시 및 도움돼요 상호작용)

- 3839~3845줄(7줄) · 쉬움(0)
- 함수(0): 없음
- 변수(2): _promptEncyclopediaOpen, _promptTabState
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js

### G126 소통 피드 (Supabase feed_posts, 실시간 동기화)

- 13427~13432줄(6줄) · 쉬움(0)
- 함수(0): 없음
- 변수(1): FEED_POSTS_CACHE
- 시험지 글자 의존: scripts/smoke-test.js, tests/guest-null-client-es377.test.js

### G101 RENDER: TEMPLATE ENCYCLOPEDIA SUBTAB (#TASK-ES-187)

- 8719~8721줄(3줄) · 쉬움(0)
- 함수(0): 없음
- 변수(2): _subtabTplCat, _subtabTplQuery

### G047 P0: 새 비밀번호 입력 모달 (비밀번호 복구 링크 수신 시)

- 4526~4534줄(9줄) · 쉬움(1)
- 함수(1): openNewPasswordModal
- 부르는 묶음(들어옴): G142×2
- 시험지 글자 의존: scripts/smoke-test.js

### G140 세션 복구 및 안전 앱 진입 유틸

- 13729~13732줄(4줄) · 쉬움(3)
- 함수(0): 없음
- 변수(1): _isEnteringApp
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindLoginRescueButtons
- 로드 중 문 1: 호출 1

### G044 Goal category templates

- 4364~4401줄(38줄) · 쉬움(4)
- 함수(0): 없음
- 변수(4): GOAL_TEMPLATES, ONBOARDING_PRESETS, QUICK_ACTIONS_BY_CAT, authTabButtons
- 로드 중 문 2: var 초기값 실행 1 · 호출 1
- 이벤트 처리기: addEventListener 1 · on<이벤트> 대입 0
- 시험지 글자 의존: scripts/smoke-test.js, tests/ai-conditional-call-optimization.test.js, tests/onboarding-first-checkin.test.js

### G046 P0: 비밀번호 찾기 (이메일 재설정 링크 발송)

- 4516~4525줄(10줄) · 쉬움(4)
- 함수(1): openForgotPasswordModal
- 변수(1): fpBtn
- 로드 중 문 2: var 초기값 실행 1 · IfStatement 1
- 이벤트 처리기: addEventListener 1 · on<이벤트> 대입 0
- 시험지 글자 의존: scripts/smoke-test.js

### G051 앱 활용 가이드 다시보기

- 4823~4830줄(8줄) · 쉬움(4)
- 함수(0): 없음
- 변수(1): guideBtn
- 로드 중 문 2: var 초기값 실행 1 · IfStatement 1
- 이벤트 처리기: addEventListener 1 · on<이벤트> 대입 0
- 부르는 대상(나감): G057×1
- 시험지 글자 의존: scripts/smoke-test.js

### G075 신규 유저 10초 활성화: 갓생 스타터 목표 템플릿

- 6342~6383줄(42줄) · 쉬움(6)
- 함수(0): 없음
- 변수(1): STARTER_GOAL_TEMPLATES
- 시험지 글자 의존: scripts/smoke-test.js, tests/ai-conditional-call-optimization.test.js, tests/goal-ai-advice-status.test.js, tests/team-level-management.test.js (index.html 단독 읽기: tests/goal-ai-advice-status.test.js, tests/team-level-management.test.js)

### G062 목표 일정 리스케일링

- 5402~5437줄(36줄) · 쉬움(6)
- 함수(1): rescaleGoal
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: pad
- 시험지 글자 의존: scripts/smoke-test.js
- smoke-test FN_NAMES: rescaleGoal — 옮기려면 시험지 선행 PR 먼저

### G017 아워골 앱 환경설정 및 보상형 광고 파이프라인 (TASK-ES-013)

- 3263~3292줄(30줄) · 쉬움(6)
- 함수(0): 없음
- 변수(1): OURGOAL_CONFIG
- 로드 중 문 1: IfStatement 1
- window 노출(1줄): OURGOAL_CONFIG
- 바깥 js 가 window 이름을 씀: js/credits.js, js/streaks.js, js/template-credit.js
- 시험지 글자 의존: scripts/smoke-test.js

### G023 구독 상태 (전체 기능 100% 완전 무료 제공)

- 3357~3364줄(8줄) · 쉬움(6)
- 함수(1): subscriptionState
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: state
- 시험지 글자 의존: scripts/smoke-test.js
- smoke-test FN_NAMES: subscriptionState — 옮기려면 시험지 선행 PR 먼저

### G061 안내 모달 (전체 기능 100% 완전 무료 제공)

- 5371~5401줄(31줄) · 쉬움(7)
- 함수(2): openPaywallModal, renderProBadge
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: closeModal, escapeHtml
- 로드 중 문 1: window 노출 1
- window 노출(1줄): openPaywallModal
- 이벤트 처리기: addEventListener 0 · on<이벤트> 대입 1
- 부르는 묶음(들어옴): G010×1, G054×1
- 부르는 대상(나감): G059×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js

### G133 방해금지 시간대(DND, 조용한 시간) 판별 순수 함수 (TASK-BG-7)

- 13517~13537줄(21줄) · 쉬움(7)
- 함수(1): isWithinDND
- 부르는 묶음(들어옴): G134×1, G135×1
- 시험지 글자 의존: scripts/smoke-test.js
- smoke-test FN_NAMES: isWithinDND — 옮기려면 시험지 선행 PR 먼저

### G079 원터치 퀵 루틴 칩

- 6755~6765줄(11줄) · 쉬움(7)
- 함수(0): 없음
- 변수(1): qRoutineRow
- 로드 중 문 2: var 초기값 실행 1 · IfStatement 1
- 이벤트 처리기: addEventListener 1 · on<이벤트> 대입 0
- 시험지 글자 의존: scripts/smoke-test.js, tests/theme-system-v4.test.js (index.html 단독 읽기: tests/theme-system-v4.test.js)

### G005 [#TASK-ES-453] 인라인 스크립트 세포화 P1 이음매 3 — 목표 종합상황 AI 요약 새로 고침 (docs/architecture/INLINE-SCRIP

- 2494~2501줄(8줄) · 쉬움(7)
- 함수(0): 없음
- 변수(1): refreshGoalStatusSummary
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: _goalsKit, generateGoalStatusSummary
- 로드 중 문 1: 호출 1
- 시험지 글자 의존: scripts/smoke-test.js, tests/ai-conditional-call-optimization.test.js, tests/goal-ai-advice-status.test.js (index.html 단독 읽기: tests/goal-ai-advice-status.test.js)

### G111 TASK-ES-307: 측정지표 다중 선택 및 동시 렌더링 엔진

- 10199~10260줄(62줄) · 보통(9)
- 함수(1): renderMultiMetricSvg
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: TREND_METRICS
- 로드 중 문 2: window 노출 2
- window 노출(2줄): TREND_METRICS, renderMultiMetricSvg
- 부르는 묶음(들어옴): G010×1
- 바깥 js 가 window 이름을 씀: js/tabs/records/trend-metrics-chart.js
- 시험지 글자 의존: scripts/smoke-test.js, tests/achievement-graph-multiset.test.js

### G050 [#TASK-ES-160, #TASK-ES-166, #TASK-ES-180] 각 탭 200% 활용법 및 실제 우수 사용사례 쇼케이스 (최신 기능 전면 동기화)

- 4812~4822줄(11줄) · 보통(9)
- 함수(0): 없음
- 변수(1): tabGuideBtn
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: openTabGuideHubModal
- 로드 중 문 3: window 노출 1 · var 초기값 실행 1 · IfStatement 1
- window 노출(1줄): openTabGuideHubModal
- 이벤트 처리기: addEventListener 1 · on<이벤트> 대입 0
- 바깥 js 가 window 이름을 씀: js/tabs/settings/tab-guide.js
- 시험지 글자 의존: scripts/smoke-test.js

### G129 통합 딥링크 게이트웨이 & 게스트 소프트 뷰어 3종 (js/viral-sharing.js 위임)

- 13464~13473줄(10줄) · 보통(9)
- 함수(1): handleDeepLinkRouting
- 변수(1): checkAndHandlePeerInviteUrl
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: MANITO_WELCOME_STAMPS
- 로드 중 문 2: IfStatement 2
- window 노출(2줄): MANITO_STAMP_COOLDOWN, MANITO_WELCOME_STAMPS
- 바깥 js 가 window 이름을 씀: js/tabs/comm/manito-basics.js, js/tabs/comm/manito-real.js
- 시험지 글자 의존: scripts/smoke-test.js

### G127 전역 공유 팀 로더 & 렌더링 (#TASK-ES-133)

- 13433~13439줄(7줄) · 보통(9)
- 함수(0): 없음
- 변수(1): SHARED_GROUPS_LOADED
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: loadSharedGroups
- 로드 중 문 2: IfStatement 2
- window 노출(2줄): SHARED_GROUPS_LOADED, loadSharedGroups
- 바깥 js 가 window 이름을 씀: js/tabs/comm/shared-groups.js, js/tabs/goals/team-goals-screen.js
- 시험지 글자 의존: scripts/smoke-test.js

### G115 전문 템플릿 실시간 자동 집계 엔진 (혁신 1)

- 10568~10741줄(174줄) · 보통(10)
- 함수(1): computeTableAnalytics
- 부르는 묶음(들어옴): G012×1, G116×1
- 시험지 글자 의존: scripts/smoke-test.js, tests/google-session-guard.test.js (index.html 단독 읽기: tests/google-session-guard.test.js)
- smoke-test FN_NAMES: computeTableAnalytics — 옮기려면 시험지 선행 PR 먼저

### G082 사진 인증 & 뷰어 모달 (가상유저 요청 P1)

- 7074~7111줄(38줄) · 보통(10)
- 함수(0): 없음
- 변수(4): capturePhotoBtn, capturePhotoInput, capturePhotoPreview, pendingCapturePhoto
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: compressImage, openPhotoViewerModal
- 로드 중 문 4: var 초기값 실행 3 · IfStatement 1
- 이벤트 처리기: addEventListener 2 · on<이벤트> 대입 2
- 시험지 글자 의존: scripts/smoke-test.js

### G008 [#TASK-ES-444] 인라인 스크립트 세포화 P1 이음매 2 — 일정 배경·잠금화면 라이브, 소통 창·스토리 캔버스, 사진 인증, 목표 스타터·로컬 문장, 

- 2540~2572줄(33줄) · 보통(10)
- 함수(0): 없음
- 변수(23): _recordHesitation, buildLockScreenCardPayload, closeLockScreenLiveCard, closePwaInstallGuideModal, compressImage, confirmPwaInstall, generateMzStoryCanvas, initKeyboardShield, localNextActionSuggestion, localTodayMission, openCalendarDayBgPickerModal, openIosPwaInstallGuideModal, openPhotoViewerModal, openPwaInstallGuideModal, quickCreateStarterGoal, renderAdaptiveModeBar, renderHomeGrassSummary, renderIosPwaBanner, switchPwaOsTab, switchUxMode 외 3
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: SIM_PERSONAS, STARTER_GOAL_TEMPLATES, _calendarKit, _commKit, _goalsKit, _recordsKit, _settingsKit, _uxTelemetry
- 로드 중 문 1: 호출 1
- 부르는 대상(나감): G077×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js, tests/account-switch-isolation.test.js, tests/direct-login-guard.test.js, tests/feed-post-preview-modal.test.js

### G012 [#TASK-ES-446] 인라인 스크립트 세포화 P2-1 이음매 (docs/architecture/INLINE-SCRIPT-MAP.md 지도 · docs/spe

- 3061~3084줄(24줄) · 보통(10)
- 함수(0): 없음
- 변수(9): buildRecordCardHtml, handleConversationalRecord, openProCoachReportModal, openProNotionExportModal, pushRecordToNotion, renderAnalyticsHtml, renderRecordHeatmap, renderReportSummary, renderTrendSvgChart
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: HEATMAP_LEVELS, HEATMAP_WEEKS, _recordsKit, maybeShowGoalUpdateModal, openRecordModal, renderFeedbackSlot, requestAIFeedback, resizeImageToDataUrl
- 로드 중 문 1: 호출 1
- 부르는 대상(나감): G112×1, G115×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js

### G052 1:1 고객 문의 / 버그 제보 (#TASK-ES-178)

- 4831~4850줄(20줄) · 보통(10)
- 함수(0): 없음
- 변수(1): footEmailEl
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: openCustomerInquiryModal
- 로드 중 문 3: 호출 1 · var 초기값 실행 1 · IfStatement 1
- 이벤트 처리기: addEventListener 2 · on<이벤트> 대입 0
- 부르는 대상(나감): G019×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js, tests/account-withdrawal-modal.test.js (index.html 단독 읽기: tests/account-withdrawal-modal.test.js)

### G026 #TASK-ES-165: 앱 진입 아바타 인사 팝업 (화면 절반 크기 & 시간대별 멘트)

- 3493~3500줄(8줄) · 보통(10)
- 함수(0): 없음
- 변수(1): __avatarGreetTimer
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: closeAvatarGreetingPopup, openAvatarGreetingPopup
- 로드 중 문 2: window 노출 2
- window 노출(2줄): closeAvatarGreetingPopup, openAvatarGreetingPopup
- 바깥 js 가 window 이름을 씀: js/tabs/settings/avatar-greeting.js, js/tabs/settings/sub-profile.js
- 시험지 글자 의존: scripts/smoke-test.js

### G130 마니또 실 유저 익명 응원 연동 (#TASK-ES-133, #TASK-ES-145)

- 13474~13481줄(8줄) · 보통(10)
- 함수(0): 없음
- 변수(3): MANITO_SERVER_LOADED, REAL_MANITO_INBOX_CACHE, REAL_MANITO_PARTNERS_CACHE
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: isValidRealUser
- 로드 중 문 1: window 노출 1
- window 노출(1줄): isValidRealUser
- 바깥 js 가 window 이름을 씀: js/tabs/comm/manito-real.js, js/tabs/records/first-checkin-tutorial.js, js/tabs/settings/guest-backup-nudge.js, js/tabs/settings/guest-migration.js, js/team-dm-room.js, js/team-profile.js
- 시험지 글자 의존: scripts/smoke-test.js

### G085 [#TASK-ES-225] [생각 메모장 95번] Gemini API 분당 쿼터(Rate Limit 429) 방어 및 지수 백오프 큐

- 7134~7279줄(146줄) · 보통(12)
- 함수(0): 없음
- 변수(4): DONE_KEYWORDS, GeminiQuotaDispatcher, PREMIUM_FEEDBACK_CATALOG, requestClaudeFeedback
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: requestServerAIFeedback, state
- 로드 중 문 2: window 노출 2
- window 노출(2줄): GeminiQuotaDispatcher, PREMIUM_FEEDBACK_CATALOG
- 부르는 대상(나감): G019×4
- 바깥 js 가 window 이름을 씀: js/tabs/records/ai-feedback-providers.js
- 시험지 글자 의존: scripts/smoke-test.js, tests/google-session-guard.test.js (index.html 단독 읽기: tests/google-session-guard.test.js)

### G138 [#TASK-ES-264] 자정(00:00 KST / 현지 표준시) 날짜 변경 감지 및 자동 동기화 워처

- 13681~13715줄(35줄) · 보통(12)
- 함수(2): checkAndHandleDateRollover, setupDateRolloverWatcher
- 변수(1): _lastObservedDateKey
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: dateKey, dispatchFullViewPropagation, getEffectiveStandardDateKey, nowISO, state
- window 노출(3줄): _dateRolloverInterval, checkAndHandleDateRollover, setupDateRolloverWatcher
- 이벤트 처리기: addEventListener 2 · on<이벤트> 대입 0
- 부르는 묶음(들어옴): G139×2
- 부르는 대상(나감): G097×2
- 시험지 글자 의존: scripts/smoke-test.js, tests/ai-conditional-call-optimization.test.js, tests/today-mission-card-guide.test.js (index.html 단독 읽기: tests/today-mission-card-guide.test.js)

### G073 UX Telemetry (Hesitation & Rage Tap)

- 6315~6337줄(23줄) · 보통(12)
- 함수(0): 없음
- 변수(1): _uxTelemetry
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: _recordHesitation
- 로드 중 문 3: window 노출 2 · IfStatement 1
- window 노출(2줄): _recordHesitation, _uxTelemetry
- 이벤트 처리기: addEventListener 1 · on<이벤트> 대입 0
- 바깥 js 가 window 이름을 씀: js/tabs/comm/crew-pacing.js, js/tabs/goals/result-modal.js, js/tabs/settings/adaptive-ux.js

### G136 Web Push (앱이 꺼져 있어도 오는 알림)

- 13621~13674줄(54줄) · 보통(13)
- 함수(3): removePushSubscription, syncPushSubscription, urlBase64ToUint8Array
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: state
- 부르는 묶음(들어옴): G001×2, G045×2, G054×1
- 부르는 대상(나감): G016×2
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-shipyard-modular.js, tests/account-switch-isolation.test.js, tests/ai-conditional-call-optimization.test.js, tests/direct-login-guard.test.js, tests/dm-push-auth-es397.test.js, tests/google-session-guard.test.js, tests/logout-scope-es399.test.js 외 3 (index.html 단독 읽기: tests/google-session-guard.test.js, tests/push-subscribe-auth-es400.test.js, tests/security-audit.test.js)

### G095 목표 AI 생성 전체 템플릿 양식 및 세부 항목 미리보기 (Req 5)

- 7936~7959줄(24줄) · 보통(14)
- 함수(0): 없음
- 변수(1): toggleAgentBtn
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: sendGoalAgentMessage, showGoalAgentReviewStep
- 로드 중 문 5: window 노출 1 · var 초기값 실행 1 · IfStatement 1 · 호출 2
- window 노출(1줄): showGoalAgentReviewStep
- 이벤트 처리기: addEventListener 3 · on<이벤트> 대입 0
- 바깥 js 가 window 이름을 씀: js/tabs/goals/ai-agent.js

### G083 체크인 입력 글자수 힌트 (#TASK-ES-367: 열 수 없던 활동 테마 선택 창·배지 제거, 승인 2026-10-04)

- 7112~7120줄(9줄) · 보통(15)
- 함수(0): 없음
- 변수(3): capInput, liveCount, liveMeta
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindCaptureLiveMeta, bindCaptureSave
- 로드 중 문 5: var 초기값 실행 3 · 호출 2
- 시험지 글자 의존: scripts/smoke-test.js, tests/module-guard.test.js, tests/theme-system-v4.test.js (index.html 단독 읽기: tests/theme-system-v4.test.js)

### G080 🎙️ 마이크 권한 거부 상태 자가 진단 및 1초 권한 허용 모달 (#TASK-ES-227)

- 6766~7002줄(237줄) · 보통(16)
- 함수(1): openMicPermissionGuideModal
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: triggerHaptic, triggerHapticFeedback
- 로드 중 문 1: window 노출 1
- window 노출(1줄): openMicPermissionGuideModal
- 이벤트 처리기: addEventListener 1 · on<이벤트> 대입 5
- 부르는 묶음(들어옴): G081×8, G118×2
- 부르는 대상(나감): G019×2
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-all-clicks.js, tests/goals-schedule-sync.test.js, tests/guest-null-client-es377.test.js, tests/hidden-entry-guard.test.js, tests/records-tab-rename.test.js, tests/stopwatch-lap-inputs.test.js, tests/team-goal-guide-hint.test.js 외 1 (index.html 단독 읽기: tests/goals-schedule-sync.test.js, tests/team-goal-guide-hint.test.js, tests/theme-system-v4.test.js)

### G135 Notifications (best-effort, tab must be open)

- 13590~13620줄(31줄) · 보통(16)
- 함수(2): setupNotifyTimer, showNotifyBanner
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: dateKey, escapeHtml, nowISO, pad, setTab, state
- 이벤트 처리기: addEventListener 1 · on<이벤트> 대입 0
- 부르는 묶음(들어옴): G001×2, G054×1
- 부르는 대상(나감): G133×1, G134×1
- 시험지 글자 의존: scripts/smoke-test.js, tests/dm-push-auth-es397.test.js, tests/push-subscribe-auth-es400.test.js, tests/schedule-notification-setting.test.js, tests/theme-system-v4.test.js (index.html 단독 읽기: tests/push-subscribe-auth-es400.test.js, tests/theme-system-v4.test.js)

### G112 기록 히트맵 (GitHub 히트맵 스타일)

- 10261~10289줄(29줄) · 보통(16)
- 함수(2): filterRecordsByQuery, heatmapLevel
- 변수(2): HEATMAP_LEVELS, HEATMAP_WEEKS
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: RECORD_THEMES, TOPICS, dateKey, fmtDateLabel
- 부르는 묶음(들어옴): G002×1, G012×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js
- smoke-test FN_NAMES: filterRecordsByQuery, heatmapLevel — 옮기려면 시험지 선행 PR 먼저

### G131 DM & 동반자 소통 시스템 (TASK-ES-105)

- 13482~13506줄(25줄) · 보통(16)
- 함수(1): openUserProfileModal
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: openCustomerInquiryModal, openItemReportModal, openWidgetSettingsModal
- 로드 중 문 3: IfStatement 2 · 호출 1
- window 노출(2줄): openCustomerInquiryModal, openItemReportModal
- 이벤트 처리기: addEventListener 1 · on<이벤트> 대입 0
- 부르는 묶음(들어옴): G010×1
- 바깥 js 가 window 이름을 씀: js/core/profile-topbar.js, js/tabs/settings/sub-data.js, js/tabs/settings/sub-integrations.js, js/tabs/settings/support-modals.js
- 시험지 글자 의존: scripts/smoke-test.js, tests/desktop-widget-suite.test.js

### G029 [71] 앱 잠금 PIN (이 기기) — 설정·해제·앱 진입 확인

- 3817~3838줄(22줄) · 보통(16)
- 함수(0): 없음
- 변수(1): APP_LOCK_PIN_PREFIX
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: challengeTwoFactorModal, isHashedAppLockPin, openTwoFactorDisableModal, openTwoFactorSetupModal, verifyAppLockPin
- 로드 중 문 2: IfStatement 2
- window 노출(5줄): challengeTwoFactorModal, isHashedAppLockPin, openTwoFactorDisableModal, openTwoFactorSetupModal, verifyAppLockPin
- 바깥 js 가 window 이름을 씀: js/tabs/settings/app-lock-pin.js, js/tabs/settings/sub-security.js

### G116 📈 표 기록 기반 일자별 자동 성장 추이 차트 (Visual Trend Chart)

- 10742~10852줄(111줄) · 보통(17)
- 함수(1): computeTrendChartData
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: dateKey, pad
- 부르는 묶음(들어옴): G119×4
- 부르는 대상(나감): G115×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-shipyard-modular.js, scripts/verify-integrity-gate.js, tests/account-withdrawal-modal.test.js, tests/goal-template-legacy-cleanup.test.js, tests/goal-templates-data-split.test.js, tests/goal-templates-encyclopedia.test.js, tests/record-ledger-sync.test.js 외 1 (index.html 단독 읽기: tests/account-withdrawal-modal.test.js, tests/goal-templates-data-split.test.js, tests/record-ledger-sync.test.js)
- smoke-test FN_NAMES: computeTrendChartData — 옮기려면 시험지 선행 PR 먼저

### G117 ⏱️ 인앱 인터벌 타이머 & 스톱워치 위젯 (In-Table Stopwatch)

- 10853~10874줄(22줄) · 보통(17)
- 함수(1): formatStopwatchTime
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: pad, renderLapRowsHtml, renderStopwatchWidgetHtml
- 로드 중 문 1: IfStatement 1
- window 노출(2줄): renderLapRowsHtml, renderStopwatchWidgetHtml
- 부르는 묶음(들어옴): G119×4
- 바깥 js 가 window 이름을 씀: js/tabs/records/table-stopwatch.js
- 시험지 글자 의존: scripts/smoke-test.js, tests/record-ledger-sync.test.js, tests/stopwatch-lap-inputs.test.js, tests/stopwatch-table-hint.test.js (index.html 단독 읽기: tests/record-ledger-sync.test.js)
- smoke-test FN_NAMES: formatStopwatchTime — 옮기려면 시험지 선행 PR 먼저

### G134 맥락 기반 다이내믹 알림 문구 생성

- 13538~13589줄(52줄) · 보통(19)
- 함수(1): generateDynamicNotification
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: MOCK_GROUPS, dateKey, pad
- 부르는 묶음(들어옴): G001×1, G135×1
- 부르는 대상(나감): G133×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js, tests/core-confirm-es376.test.js, tests/goals-schedule-sync.test.js, tests/record-ledger-sync.test.js, tests/xp-server-ledger-es421.test.js (index.html 단독 읽기: tests/goals-schedule-sync.test.js, tests/record-ledger-sync.test.js, tests/xp-server-ledger-es421.test.js)
- smoke-test FN_NAMES: generateDynamicNotification — 옮기려면 시험지 선행 PR 먼저

### G122 테마별 기록 DB 다운로드 & 외부 AI 분석 프롬프트 번들 (TASK-OG-001)

- 13167~13199줄(33줄) · 보통(19)
- 함수(2): buildCSV, getAIAnalysisPrompt
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: RECORD_THEMES, TOPICS, dateKey, fmtTime, state
- 부르는 묶음(들어옴): G010×2
- 시험지 글자 의존: scripts/smoke-test.js, tests/goals-smart-attachments.test.js (index.html 단독 읽기: tests/goals-smart-attachments.test.js)
- smoke-test FN_NAMES: buildCSV, getAIAnalysisPrompt — 옮기려면 시험지 선행 PR 먼저

### G048 P0: 회원 탈퇴 30일 유예(소프트 삭제) 복구 체크

- 4535~4634줄(100줄) · 보통(20)
- 함수(0): 없음
- 변수(1): resyncBtn
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: checkPendingDeletionRestore, migrateGuestDataToUser, saveProfile, sb, state
- 로드 중 문 5: 호출 3 · var 초기값 실행 1 · IfStatement 1
- 이벤트 처리기: addEventListener 4 · on<이벤트> 대입 0
- 부르는 대상(나감): G019×7, G027×3, G045×2, G139×2, G036×1, G054×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-shipyard-modular.js, scripts/verify-integrity-gate.js, tests/core-confirm-es374.test.js, tests/core-confirm-es376.test.js, tests/direct-login-guard.test.js, tests/google-session-guard.test.js (index.html 단독 읽기: tests/google-session-guard.test.js)

### G039 2계정 상호작용 테스트 (테스터 B 직통 입장: #TASK-ES-169)

- 4002~4039줄(38줄) · 보통(20)
- 함수(1): enterAsTesterB
- 변수(2): authTesterBBtn, landTesterBBtn
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: loginWithDirectIdentifier
- 로드 중 문 5: IfStatement 3 · var 초기값 실행 2
- window 노출(1줄): enterAsTesterB
- 이벤트 처리기: addEventListener 2 · on<이벤트> 대입 0
- 부르는 대상(나감): G019×2, G027×1, G054×1
- 시험지 글자 의존: scripts/smoke-test.js, tests/account-switch-isolation.test.js, tests/dev-host-gate.test.js, tests/direct-login-guard.test.js, tests/gcal-login-reconnect-fix.test.js, tests/google-session-guard.test.js, tests/logout-scope-es399.test.js (index.html 단독 읽기: tests/gcal-login-reconnect-fix.test.js, tests/google-session-guard.test.js)

### G100 [#TASK-ES-172] [27] 목표 탭: 데일리 루틴 서브탭 & 편집/상세 모달

- 8549~8718줄(170줄) · 보통(21)
- 함수(1): openRoutineDetailModal
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: closeModal, dateKey, escapeHtml, renderRoutineGoalsScreen, saveProfile, state, triggerHaptic
- 로드 중 문 1: IfStatement 1
- window 노출(2줄): openRoutineDetailModal, renderRoutineGoalsScreen
- 이벤트 처리기: addEventListener 0 · on<이벤트> 대입 5
- 부르는 묶음(들어옴): G010×1
- 부르는 대상(나감): G139×4, G019×3, G059×1
- 바깥 js 가 window 이름을 씀: js/tabs/goals/render.js, js/tabs/goals/routine-screen.js, js/tabs/goals/sub-routine.js
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-all-clicks.js, scripts/verify-integrity-gate.js, tests/achievement-graph-multiset.test.js, tests/core-confirm-es376.test.js, tests/feed-post-category-diversity.test.js, tests/goals-schedule-sync.test.js, tests/guest-null-client-es377.test.js 외 2 (index.html 단독 읽기: tests/goals-schedule-sync.test.js, tests/routine-detail-modal.test.js)

### G011 [#TASK-ES-436] 인라인 스크립트 세포화 P1 이음매 1 — 목표 AI·일정 설정, 기록 AI 피드백 (docs/architecture/INLINE-SC

- 3027~3060줄(34줄) · 보통(21)
- 함수(0): 없음
- 변수(15): applyScheduleUpdate, celebrateMilestoneDone, computeGoalStatusHash, formatSchedulePillHtml, generateGoalStatusSummary, initFeedbackTierBar, localGoalStatusSummary, milestonesForAI, openScheduleSetupModal, requestAIFeedback, requestServerAIFeedback, requestTodayMission, sanitizeAttachments, sendGoalAgentMessage, showGoalAgentReviewStep
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: DONE_KEYWORDS, GeminiQuotaDispatcher, THEME_FEEDBACK_PROMPTS, TOPICS, _goalsKit, _recordsKit, applyGoalAgentOp, dispatchFullViewPropagation, fbBotBubbleHtml, localNextActionSuggestion, localTodayMission, normalizeSequentialMilestoneDates 외 1
- 로드 중 문 1: 호출 1
- 부르는 대상(나감): G070×1
- 시험지 글자 의존: scripts/smoke-test.js, tests/ai-conditional-call-optimization.test.js, tests/goal-ai-advice-status.test.js, tests/goals-schedule-sync.test.js (index.html 단독 읽기: tests/goal-ai-advice-status.test.js, tests/goals-schedule-sync.test.js)

### G020 8대 화면 스타일 (테마) 정의

- 3324~3339줄(16줄) · 보통(21)
- 함수(0): 없음
- 변수(1): THEMES
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: applyTheme
- 로드 중 문 1: IfStatement 1
- window 노출(2줄): THEMES, applyTheme
- 바깥 js 가 window 이름을 씀: js/components-settings-actions.js, js/sanctuary-v3-engine.js, js/tabs/settings/sub-appearance.js, js/tabs/settings/theme-apply.js
- 시험지 글자 의존: scripts/smoke-test.js, tests/account-switch-isolation.test.js, tests/comm-ai-identity-es348.test.js, tests/direct-login-guard.test.js, tests/dm-push-auth-es397.test.js, tests/feed-ai-bot-reduction.test.js, tests/google-session-guard.test.js, tests/hidden-entry-guard.test.js 외 2 (index.html 단독 읽기: tests/comm-ai-identity-es348.test.js, tests/google-session-guard.test.js, tests/team-goal-guide-hint.test.js, tests/theme-system-v4.test.js)

### G014 [#TASK-ES-437] 인라인 스크립트 세포화 P0 이음매 (docs/architecture/INLINE-SCRIPT-MAP.md 지도 · docs/specs

- 3150~3185줄(36줄) · 보통(23)
- 함수(0): 없음
- 변수(20): applyAppSettings, applyQuickCunningText, applyTheme, checkGuestBackupNudge, checkPendingDeletionRestore, checkStreakFreeze, closeAvatarGreetingPopup, gaugeSvg, importTemplateInstantly, initRememberedAuthFields, openAvatarGreetingPopup, openChangePasswordModal, openGuestBackupNudgeModal, openTeamInviteModal, openTeamLinkedPersonalGoalModal, sendToNotion, showCommTourModal, showLegalModal, showLevelUpBanner, templateMilestones
- 다른 묶음 상태 — 대입: __avatarGreetTimer · 변경: 없음 · 읽기: GOAL_TEMPLATES, MOCK_GROUPS, __avatarGreetTimer, _goalsKit, _recordsKit, _settingsKit, isValidRealUser, maybeApplyStreakFreeze, maybeGrantAvatarCraftBonus, maybeGrantStreakFreeze, openAvatarLevelUpModal
- 로드 중 문 1: 호출 1
- 부르는 대상(나감): G041×1, G090×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js, tests/account-switch-isolation.test.js, tests/direct-login-guard.test.js, tests/google-session-guard.test.js, tests/logout-scope-es399.test.js, tests/theme-system-v4.test.js (index.html 단독 읽기: tests/google-session-guard.test.js, tests/theme-system-v4.test.js)

### G118 CSV / 엑셀 양방향 연동 & 스마트워치 매핑 & 목표 3각 추적

- 10875~11738줄(864줄) · 보통(24)
- 함수(11): compressImageForVision, decrementVisionDailyQuota, downloadTableAsCsv, getVisionDailyQuota, openCsvImportModal, openVisionTableModal, openVoiceTableModal, openWearableSyncModal, parseCsvText, parseVoiceToTableRow, syncRecordToMatchingGoals
- 변수(2): CURATED_MARKET_TEMPLATES, VISION_DAILY_LIMIT
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: closeModal, escapeHtml, fmtYYMMDD, state
- 이벤트 처리기: addEventListener 0 · on<이벤트> 대입 29
- 부르는 묶음(들어옴): G119×6
- 부르는 대상(나감): G019×14, G059×4, G080×2
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-calendar-attachments.js, scripts/verify-all-clicks.js, scripts/verify-integrity-gate.js, tests/account-switch-isolation.test.js, tests/direct-login-guard.test.js, tests/push-subscribe-auth-es400.test.js, tests/security-audit.test.js 외 1 (index.html 단독 읽기: scripts/test-calendar-attachments.js, tests/push-subscribe-auth-es400.test.js, tests/security-audit.test.js)
- smoke-test FN_NAMES: parseCsvText, parseVoiceToTableRow — 옮기려면 시험지 선행 PR 먼저

### G036 서버 관리자 API를 통한 기록 및 프로필 복구 (#TASK-ES-036)

- 3875~3987줄(113줄) · 보통(24)
- 함수(1): syncServerRecords
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: getTrashList, renderCalendarScreen, renderRecordsScreen, renderSettingsScreen, saveLocalSettings, state
- 부르는 묶음(들어옴): G002×1, G048×1, G142×1
- 부르는 대상(나감): G016×1, G076×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js, tests/account-switch-isolation.test.js, tests/direct-login-guard.test.js, tests/dm-push-auth-es397.test.js, tests/gcal-login-reconnect-fix.test.js, tests/logout-scope-es399.test.js, tests/module-guard.test.js 외 4 (index.html 단독 읽기: tests/gcal-login-reconnect-fix.test.js, tests/push-subscribe-auth-es400.test.js, tests/record-ledger-sync.test.js, tests/security-audit.test.js, tests/sync-server-records-render-home.test.js)

### G015 [#TASK-ES-442] 인라인 스크립트 세포화 P0 이음매 (docs/architecture/INLINE-SCRIPT-MAP.md 지도 · docs/specs

- 3186~3223줄(38줄) · 보통(24)
- 함수(0): 없음
- 변수(20): challengeTwoFactorModal, convertTextToNotionDbRecord, defaultSettings, getRegisteredDevices, goalProgress, initDevDebugButtons, isHashedAppLockPin, migrateGuestDataToUser, msCounts, openLogoutOtherDevicesConfirmModal, openTabGuideHubModal, openTwoFactorDisableModal, openTwoFactorSetupModal, renderActiveDevicesList, renderPromptEncyclopediaHtml, resultPct, startOnboarding, toggleScheduleDone, verifyAppLockPin, wirePromptEncyclopediaEvents
- 다른 묶음 상태 — 대입: _promptEncyclopediaOpen, _promptTabState · 변경: 없음 · 읽기: APP_LOCK_PIN_PREFIX, USER_SESSION_CHANNEL, _calendarKit, _goalsKit, _promptEncyclopediaOpen, _promptTabState, _settingsKit, gcalEventsKey, purgeLegacySharedGcalKeys, renderFirstCheckinTutorialBanner, renderSettingsScreen
- 로드 중 문 1: 호출 1
- 부르는 대상(나감): G045×3, G054×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js, tests/account-switch-isolation.test.js, tests/dev-host-gate.test.js, tests/device-session-control.test.js, tests/direct-login-guard.test.js, tests/gcal-login-reconnect-fix.test.js, tests/logout-scope-es399.test.js 외 2 (index.html 단독 읽기: tests/gcal-login-reconnect-fix.test.js)

### G139 Render all

- 13716~13728줄(13줄) · 보통(24)
- 함수(1): renderAll
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: renderCalendarScreen, renderCommScreen, renderGoalsScreen, renderRecordsScreen, renderSettingsScreen, state, updateTopBar
- 부르는 묶음(들어옴): G100×4, G048×2, G142×2, G001×1, G054×1, G076×1, G096×1, G125×1
- 부르는 대상(나감): G138×2, G076×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-calendar-attachments.js, scripts/test-shipyard-modular.js, tests/ai-conditional-call-optimization.test.js, tests/app-evaluation-notice.test.js, tests/device-session-control.test.js, tests/goal-template-legacy-cleanup.test.js, tests/team-creation-clean.test.js 외 2 (index.html 단독 읽기: scripts/test-calendar-attachments.js, tests/app-evaluation-notice.test.js, tests/unique-display-name.test.js)

### G045 디바이스 세션 & 원격 로그아웃 유틸 (Req 1)

- 4402~4515줄(114줄) · 보통(25)
- 함수(5): checkRemoteSessionRevoked, getDeviceId, getDeviceLoginTime, performLogout, setDeviceLoginTime
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: getAttribution, initRememberedAuthFields, saveProfile, sb, startOnboarding, state, track, updateAppBadge
- 로드 중 문 1: 호출 1
- 이벤트 처리기: addEventListener 1 · on<이벤트> 대입 0
- 부르는 묶음(들어옴): G054×5, G015×3, G041×3, G048×2, G108×2, G010×1, G141×1
- 부르는 대상(나감): G027×2, G136×2, G019×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-shipyard-modular.js, scripts/verify-integrity-gate.js, tests/account-switch-isolation.test.js, tests/dev-host-gate.test.js, tests/direct-login-guard.test.js, tests/gcal-login-reconnect-fix.test.js, tests/google-session-guard.test.js 외 2 (index.html 단독 읽기: tests/gcal-login-reconnect-fix.test.js, tests/google-session-guard.test.js)

### G016 Supabase

- 3224~3262줄(39줄) · 보통(25)
- 함수(1): getSupabaseAuthToken
- 변수(5): GOOGLE_OAUTH_CLIENT_ID, SUPABASE_ANON_KEY, SUPABASE_URL, _pendingAuthSession, sb
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: restoreSessionAndEnter, state
- 로드 중 문 2: TryStatement 1 · IfStatement 1
- window 노출(1줄): getSupabaseAuthToken
- 부르는 묶음(들어옴): G136×2, G010×1, G027×1, G036×1
- 바깥 js 가 window 이름을 씀: js/tabs/comm/dm-ledger.js, js/tabs/records/export-theme.js
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js, tests/account-switch-isolation.test.js, tests/direct-login-guard.test.js, tests/google-session-guard.test.js, tests/logout-scope-es399.test.js, tests/push-subscribe-auth-es400.test.js, tests/security-audit.test.js 외 1 (index.html 단독 읽기: tests/google-session-guard.test.js, tests/push-subscribe-auth-es400.test.js, tests/security-audit.test.js, tests/sync-server-records-render-home.test.js)

### G041 소셜 로그인 (카카오 / 실제 구글 OAuth 연동)

- 4049~4354줄(306줄) · 어려움(26)
- 함수(7): getGoogleTokenClient, handleGoogleUserSuccess, initGoogleOneTap, parseJwtPayload, sha256Hex, startGoogleLogin, startOAuthLogin
- 변수(2): _googleOneTapNonce, _googleTokenClient
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: GOOGLE_OAUTH_CLIENT_ID, closeModal, escapeHtml, initRememberedAuthFields, openLoginRescueModal, restoreSessionAndEnter, saveProfile, sb, state
- 로드 중 문 2: 호출 2
- 이벤트 처리기: addEventListener 2 · on<이벤트> 대입 7
- 부르는 묶음(들어옴): G010×1, G014×1
- 부르는 대상(나감): G019×10, G045×3, G059×2, G066×2
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-all-clicks.js, scripts/verify-integrity-gate.js, tests/dev-host-gate.test.js, tests/direct-login-guard.test.js, tests/gcal-login-reconnect-fix.test.js, tests/goals-schedule-sync.test.js, tests/google-session-guard.test.js 외 3 (index.html 단독 읽기: tests/gcal-login-reconnect-fix.test.js, tests/goals-schedule-sync.test.js, tests/google-session-guard.test.js)

### G057 최초 로그인 활용가이드 — 4대 탭 무블러(Zero Blur) 투명 라이브 프리뷰 융합

- 5006~5289줄(284줄) · 어려움(26)
- 함수(5): getPrivacyLabel, maybeShowFirstLoginGuide, openPrivacyPickerModal, startFirstLoginGuide, updatePrivacyBadges
- 변수(2): navButtons, screens
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: closeModal, escapeHtml, saveProfile, setTab, showCommTourModal, state
- 로드 중 문 3: window 노출 1 · var 초기값 실행 2
- window 노출(1줄): startFirstLoginGuide
- 이벤트 처리기: addEventListener 12 · on<이벤트> 대입 9
- 부르는 묶음(들어옴): G001×1, G051×1
- 부르는 대상(나감): G059×7, G019×4
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-all-clicks.js, scripts/verify-integrity-gate.js, tests/goals-schedule-sync.test.js, tests/guest-null-client-es377.test.js, tests/hidden-entry-guard.test.js, tests/records-tab-rename.test.js, tests/today-mission-card-guide.test.js (index.html 단독 읽기: tests/goals-schedule-sync.test.js, tests/today-mission-card-guide.test.js)
- smoke-test FN_NAMES: getPrivacyLabel — 옮기려면 시험지 선행 PR 먼저

### G013 [#TASK-ES-448] 인라인 스크립트 세포화 P2-2 이음매 (docs/architecture/INLINE-SCRIPT-MAP.md 지도 · docs/spe

- 3085~3149줄(65줄) · 어려움(26)
- 함수(0): 없음
- 변수(43): CREATOR_TEMPLATES, EXTERNAL_DATA, MANITO_EMOJI, MANITO_STAMPS, MANITO_WELCOME_STAMPS, MOCK_PEOPLE, SHARE_PLATFORMS, SIM_PERSONAS, TOPICS, VISIBILITY_LABELS, buildInviteLinkSuffix, categoryPickerHtml, daysFromNow, drawShareWatermark, ensureFeedPostsLoaded, genAnonName, generateShareImage, groupCheckedToday, groupState, groupStreak 외 23
- 다른 묶음 상태 — 대입: FEED_POSTS_CACHE · 변경: 없음 · 읽기: FEED_POSTS_CACHE, MOCK_GROUPS, _commKit, _goalsKit, _recordsKit, _settingsKit, getFeedComments, openRecordModal, setFeedComments
- 로드 중 문 2: 호출 1 · TryStatement 1
- 부르는 대상(나감): G090×1, G114×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js, tests/desktop-widget-suite.test.js, tests/guest-null-client-es377.test.js, tests/hidden-entry-guard.test.js, tests/record-ledger-sync.test.js, tests/stopwatch-lap-inputs.test.js, tests/stopwatch-table-hint.test.js 외 3 (index.html 단독 읽기: tests/record-ledger-sync.test.js, tests/team-fold-state-es409.test.js, tests/theme-system-v4.test.js)

### G099 [#TASK-ES-220] [생각 메모장 91번] 교대근무자 가변형 루틴 프리셋 & 자동 스케줄러

- 8227~8548줄(322줄) · 어려움(27)
- 함수(3): applyShiftWorkRoutines, openShiftCycleModal, openShiftWorkCustomModal
- 변수(1): SHIFT_WORK_PRESETS
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: closeModal, dateKey, escapeHtml, renderRoutineGoalsScreen, saveProfile, state, triggerHaptic
- 로드 중 문 4: window 노출 4
- window 노출(4줄): SHIFT_WORK_PRESETS, applyShiftWorkRoutines, openShiftCycleModal, openShiftWorkCustomModal
- 이벤트 처리기: addEventListener 0 · on<이벤트> 대입 8
- 부르는 묶음(들어옴): G010×3
- 부르는 대상(나감): G019×4, G059×2
- 바깥 js 가 window 이름을 씀: js/tabs/goals/routine-screen.js
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-all-clicks.js, scripts/verify-integrity-gate.js, tests/goals-schedule-sync.test.js, tests/guest-null-client-es377.test.js, tests/hidden-entry-guard.test.js, tests/routine-tab-scheduler.test.js, tests/stopwatch-lap-inputs.test.js (index.html 단독 읽기: tests/goals-schedule-sync.test.js, tests/routine-tab-scheduler.test.js)

### G038 [#TASK-ES-222] [생각 메모장 92번] 카카오톡 인앱 브라우저 감지 및 Android Chrome 자동 탈출 & iOS Safari 플로팅 가이드 배너

- 3989~4001줄(13줄) · 어려움(27)
- 함수(0): 없음
- 변수(2): landGuestBtn, landNickQuickLink
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindLandGuestBtn, bindLandLoginLink, bindLandNickQuickLink, bindLandStartBtn, checkKakaoInAppBrowser, escapeKakaoInAppBrowser
- 로드 중 문 9: 호출 5 · window 노출 2 · var 초기값 실행 2
- window 노출(2줄): checkKakaoInAppBrowser, escapeKakaoInAppBrowser
- 바깥 js 가 window 이름을 씀: js/tabs/settings/inapp-landing.js
- 시험지 글자 의존: scripts/smoke-test.js

### G114 [#TASK-ES-233] 3일 실천 완성 나의 6각 성장 차트 미리보기 SVG 렌더러

- 10292~10567줄(276줄) · 어려움(28)
- 함수(4): openThemePickerModal, renderColdstartRadarPreviewSvg, renderLifeBalanceWheel, renderRecordThemeFilters
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: RECORD_THEMES, closeModal, escapeHtml, openRecordModal, renderRecordsScreen, saveProfile, state, switchTab, triggerHapticFeedback
- 이벤트 처리기: addEventListener 6 · on<이벤트> 대입 0
- 부르는 묶음(들어옴): G002×2, G013×1
- 부르는 대상(나감): G019×1, G059×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-calendar-attachments.js, scripts/test-shipyard-modular.js, scripts/verify-all-clicks.js, tests/achievement-graph-multiset.test.js, tests/goal-ai-advice-status.test.js, tests/goals-schedule-sync.test.js, tests/guest-null-client-es377.test.js 외 6 (index.html 단독 읽기: scripts/test-calendar-attachments.js, tests/goal-ai-advice-status.test.js, tests/goals-schedule-sync.test.js, tests/routine-tab-scheduler.test.js, tests/team-goal-guide-hint.test.js)

### G049 회원 탈퇴 전용 안내 모달 및 법적책임·데이터분실 사전 안내 (#TASK-ES-158)

- 4635~4811줄(177줄) · 어려움(28)
- 함수(4): closeWithdrawModal, openWithdrawModal, submitWithdrawAccount, withdrawAccount
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: closeModal, initRememberedAuthFields, saveProfile, sb, state, updateAppBadge
- 로드 중 문 1: 호출 1
- 이벤트 처리기: addEventListener 1 · on<이벤트> 대입 4
- 부르는 대상(나감): G019×6, G059×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-all-clicks.js, scripts/verify-integrity-gate.js, tests/account-switch-isolation.test.js, tests/account-withdrawal-modal.test.js, tests/core-toast-es361.test.js, tests/dev-host-gate.test.js, tests/direct-login-guard.test.js 외 6 (index.html 단독 읽기: tests/account-withdrawal-modal.test.js, tests/core-toast-es361.test.js, tests/gcal-login-reconnect-fix.test.js, tests/google-session-guard.test.js, tests/push-subscribe-auth-es400.test.js, tests/security-audit.test.js)

### G128 [PEER INVITE] '함께 목표' 방 초대 루프 (웹 무설치 즉시 수락)

- 13440~13463줄(24줄) · 어려움(28)
- 함수(3): buildPeerInviteUrl, calculateRemainingSeats, formatPeerInviteMessage
- 부르는 묶음(들어옴): G010×3
- 시험지 글자 의존: scripts/smoke-test.js, tests/account-switch-isolation.test.js, tests/avatar-personas-split.test.js, tests/dev-host-gate.test.js, tests/direct-login-guard.test.js, tests/google-session-guard.test.js, tests/record-ledger-sync.test.js, tests/xp-server-ledger-es421.test.js (index.html 단독 읽기: tests/avatar-personas-split.test.js, tests/google-session-guard.test.js, tests/record-ledger-sync.test.js, tests/xp-server-ledger-es421.test.js)
- smoke-test FN_NAMES: buildPeerInviteUrl, calculateRemainingSeats, formatPeerInviteMessage — 옮기려면 시험지 선행 PR 먼저

### G121 위클리 리캡 카드 (스포티파이 랩드 스타일, 공유 캔버스 인프라 재사용)

- 13154~13166줄(13줄) · 어려움(28)
- 함수(0): 없음
- 변수(2): btnOpenTt, staticPulseBar
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindRecCarouselPills, bindRecDocumentClick, bindRecPulseBar, bindRecSegmentBar, bindRecTimeTrackerBtn, openRecordModal, openWeeklyRecapModal, renderRecordsScreen
- 로드 중 문 10: 호출 8 · var 초기값 실행 2
- 이벤트 처리기: addEventListener 3 · on<이벤트> 대입 0
- 시험지 글자 의존: scripts/smoke-test.js

### G089 외부 데이터 불러오기 (mock)

- 7307~7316줄(10줄) · 어려움(28)
- 함수(0): 없음
- 변수(4): btnCustomHome, btnShowGuide, topBtnCustomHome, topBtnGuide
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindImportExternalBtn, bindPersonalGuideBtn, openHomeCustomizer, state
- 로드 중 문 9: 호출 2 · var 초기값 실행 4 · IfStatement 3
- 이벤트 처리기: addEventListener 3 · on<이벤트> 대입 0
- 시험지 글자 의존: scripts/smoke-test.js, tests/remove-duplicate-home-layout-button.test.js, tests/top-page-guide-reposition.test.js (index.html 단독 읽기: tests/remove-duplicate-home-layout-button.test.js, tests/top-page-guide-reposition.test.js)

### G125 크리에이터 템플릿 (#TASK-ES-315, 64: 구형 창 영구 제거 및 무해화)

- 13378~13426줄(49줄) · 어려움(29)
- 함수(2): cloneTemplate, templatesHtml
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: CREATOR_TEMPLATES, escapeHtml, newId, nowISO, saveProfile, state, trackGoalCreated, uid
- 로드 중 문 1: window 노출 1
- window 노출(1줄): cloneTemplate
- 부르는 묶음(들어옴): G090×2, G010×1, G147×1
- 부르는 대상(나감): G019×1, G139×1
- 바깥 js 가 window 이름을 씀: js/tabs/comm/feed-list.js, js/tabs/goals/template-encyclopedia.js, js/team-invite-comm.js, js/viral-sharing.js
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-all-clicks.js, scripts/verify-integrity-gate.js, tests/ai-conditional-call-optimization.test.js, tests/goal-ai-advice-status.test.js, tests/goal-template-legacy-cleanup.test.js, tests/goal-templates-data-split.test.js, tests/goals-schedule-sync.test.js 외 2 (index.html 단독 읽기: tests/goal-ai-advice-status.test.js, tests/goal-templates-data-split.test.js, tests/goals-schedule-sync.test.js)

### G097 [#TASK-ES-264] 오늘의 미션 및 AI 피드백 조건부 호출 최적화

- 8134~8214줄(81줄) · 어려움(30)
- 함수(2): computeTodayMissionHash, renderTodayMissionCard
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: computeGoalStatusHash, dateKey, escapeHtml, getEffectiveStandardDateKey, nowISO, requestTodayMission, saveProfile, state
- 로드 중 문 1: IfStatement 1
- window 노출(1줄): computeTodayMissionHash
- 이벤트 처리기: addEventListener 0 · on<이벤트> 대입 1
- 부르는 묶음(들어옴): G138×2, G076×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-all-clicks.js, tests/account-switch-isolation.test.js, tests/ai-conditional-call-optimization.test.js, tests/core-confirm-es374.test.js, tests/core-confirm-es376.test.js, tests/direct-login-guard.test.js, tests/goals-schedule-sync.test.js 외 6 (index.html 단독 읽기: tests/goals-schedule-sync.test.js, tests/hide-home-debug-cards.test.js, tests/home-customizer-auto-sync.test.js, tests/record-ledger-sync.test.js, tests/today-mission-card-guide.test.js)

### G068 캘린더 수동 일정 편집 모달 (Req 2 & #TASK-ES-253)

- 5528~6023줄(496줄) · 어려움(34)
- 함수(1): openCalendarManualEditModal
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: escapeHtml, gcalEventsKey, getGoogleAccessToken, isGoogleCalendarConnected, isoDate, moveToTrash, nowISO, openCalendarDayEditHubModal, pushCalendarEvent, renderCalendarScreen, renderGoalsScreen, renderRecordsScreen 외 6
- 이벤트 처리기: addEventListener 0 · on<이벤트> 대입 10
- 부르는 묶음(들어옴): G003×1, G069×1
- 부르는 대상(나감): G076×8, G019×5, G059×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-calendar-attachments.js, scripts/test-shipyard-modular.js, scripts/verify-all-clicks.js, scripts/verify-integrity-gate.js, tests/achievement-graph-multiset.test.js, tests/core-confirm-es374.test.js, tests/core-confirm-es376.test.js 외 7 (index.html 단독 읽기: scripts/test-calendar-attachments.js, tests/goals-schedule-sync.test.js, tests/goals-smart-attachments.test.js, tests/routine-tab-scheduler.test.js)

### G077 11인 외부 UI/UX 감시 및 개선팀 핵심 기능 구현

- 6600~6745줄(146줄) · 어려움(34)
- 함수(3): announceToA11y, renderDailyQuestBar, renderTodayGlancePill
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: awardXP, burstConfetti, calculateWeeklyFocusStats, computeStreakDays, dateKey, saveLocalSettings, saveProfile, state, switchTab, triggerHaptic
- 이벤트 처리기: addEventListener 0 · on<이벤트> 대입 4
- 부르는 묶음(들어옴): G076×4, G008×1, G010×1
- 부르는 대상(나감): G019×2, G024×1
- 시험지 글자 의존: scripts/smoke-test.js, tests/goal-ai-advice-status.test.js, tests/goals-smart-attachments.test.js, tests/hide-home-debug-cards.test.js, tests/home-customizer-auto-sync.test.js, tests/quest-task-exp.test.js, tests/team-goal-guide-hint.test.js, tests/theme-system-v4.test.js 외 1 (index.html 단독 읽기: tests/goal-ai-advice-status.test.js, tests/goals-smart-attachments.test.js, tests/hide-home-debug-cards.test.js, tests/home-customizer-auto-sync.test.js, tests/team-goal-guide-hint.test.js, tests/theme-system-v4.test.js, tests/unique-display-name.test.js)

### G102 [#TASK-ES-189] 템플릿 백과사전 3대 분류(개인·루틴·팀) 및 AI/실유저 2원화 이식 시스템

- 8722~8736줄(15줄) · 어려움(35)
- 함수(0): 없음
- 변수(4): _subtabTplCat, _subtabTplDomain, _subtabTplQuery, _subtabTplType
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: PERSONAL_TEMPLATES_REAL, ROUTINE_TEMPLATES_AI, ROUTINE_TEMPLATES_REAL, TEAM_TEMPLATES_AI, TEAM_TEMPLATES_REAL, renderTemplateEncyclopediaScreen
- 로드 중 문 8: window 노출 8
- window 노출(8줄): PERSONAL_TEMPLATES_REAL, ROUTINE_TEMPLATES_AI, ROUTINE_TEMPLATES_REAL, TEAM_TEMPLATES_AI, TEAM_TEMPLATES_REAL, _subtabTplDomain, _subtabTplType, renderTemplateEncyclopediaScreen
- 바깥 js 가 window 이름을 씀: js/tabs/goals/render.js, js/tabs/goals/template-encyclopedia.js
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-shipyard-modular.js, scripts/verify-integrity-gate.js, tests/routine-tab-scheduler.test.js (index.html 단독 읽기: tests/routine-tab-scheduler.test.js)

### G066 [#TASK-ES-153] 전역 7일 유예 통합 휴지통 (Recycle Bin) 시스템

- 5467~5517줄(51줄) · 어려움(36)
- 함수(2): calendarAvailable, saveGoogleToken
- 변수(1): googleTokenClient
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: gcalCurrentUid, gcalTokenStatus, getGoogleAccessToken, isGoogleCalendarConnected, purgeLegacySharedGcalKeys, requestGoogleToken, restoreGoogleToken, state
- 로드 중 문 1: IfStatement 1
- window 노출(6줄): gcalTokenStatus, getGoogleAccessToken, isGoogleCalendarConnected, requestGoogleToken, restoreGoogleToken, saveGoogleToken
- 부르는 묶음(들어옴): G041×2, G003×1, G010×1
- 바깥 js 가 window 이름을 씀: js/core/gcal-sync.js, js/core/trash-bin.js, js/tabs/calendar/calendar-core.js, js/tabs/calendar/natural-schedule.js, js/tabs/calendar/render.js, js/tabs/settings/session-entry.js, js/tabs/settings/sub-integrations.js
- 시험지 글자 의존: scripts/smoke-test.js, tests/core-confirm-es376.test.js, tests/gcal-login-reconnect-fix.test.js (index.html 단독 읽기: tests/gcal-login-reconnect-fix.test.js)
- smoke-test FN_NAMES: calendarAvailable — 옮기려면 시험지 선행 PR 먼저

### G124 캘린더 실시간 구독 URL 생성기 (WebCal Feed & #TASK-ES-252 HMAC 서명)

- 13201~13377줄(177줄) · 어려움(37)
- 함수(1): shareContent
- 변수(2): MOCK_GROUPS, _cachedSignedCalendarToken
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: CREATOR_TEMPLATES, daysFromNow, openExportThemeModal
- 로드 중 문 3: 호출 1 · window 노출 2
- window 노출(2줄): CREATOR_TEMPLATES, shareContent
- 이벤트 처리기: addEventListener 1 · on<이벤트> 대입 0
- 부르는 묶음(들어옴): G010×1, G119×1
- 바깥 js 가 window 이름을 씀: js/tabs/comm/feed-list.js, js/tabs/comm/manito-real.js, js/tabs/comm/sample-data.js, js/tabs/comm/share-card.js, js/tabs/goals/template-encyclopedia.js, js/tabs/records/export-theme.js, js/team-share.js, js/team-templates.js 외 1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js, tests/security-audit.test.js, tests/team-fold-state-es409.test.js, tests/team-level-accordion-es406.test.js, tests/team-level-management.test.js, tests/team-tasks-toggle-es410.test.js (index.html 단독 읽기: tests/security-audit.test.js, tests/team-fold-state-es409.test.js, tests/team-level-accordion-es406.test.js, tests/team-level-management.test.js, tests/team-tasks-toggle-es410.test.js)

### G070 5대 테마 온톨로지 & 경량 AI 분류기 (TASK-OG-001)

- 6046~6301줄(256줄) · 어려움(39)
- 함수(3): buildCheckinRecord, classifyRecordTheme, saveQuickCheckin
- 변수(4): CATEGORY_THEME_MAP, RECORD_THEMES, THEME_KEYWORDS, THEME_REGEX_RULES
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: MOCK_GROUPS, XP_RULES, awardXP, checkGuestBackupNudge, computeStreakDays, dayIndexSinceSignup, dispatchFullViewPropagation, groupState, maybeGrantAvatarCraftBonus, maybeGrantStreakFreeze, newId, nowISO 외 5
- 부르는 묶음(들어옴): G027×2, G011×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-calendar-attachments.js, scripts/test-shipyard-modular.js, tests/account-switch-isolation.test.js, tests/core-confirm-es376.test.js, tests/direct-login-guard.test.js, tests/feed-post-category-diversity.test.js, tests/goal-templates-data-split.test.js 외 6 (index.html 단독 읽기: scripts/test-calendar-attachments.js, tests/goal-templates-data-split.test.js, tests/goals-schedule-sync.test.js, tests/record-ledger-sync.test.js, tests/routine-tab-scheduler.test.js)
- smoke-test FN_NAMES: buildCheckinRecord — 옮기려면 시험지 선행 PR 먼저

### G025 [#TASK-ES-150] 아바타 레벨업 대형 팝업 & 성장 성향 키워드

- 3471~3492줄(22줄) · 어려움(41)
- 함수(0): 없음
- 변수(6): avLvModalElem, btnAvLvClose, btnAvLvConfirm, btnSaveGrowth, btnSaveLvImg, btnShareLv
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindAvatarGrowthPromptSave, bindAvatarLevelUpBackdrop, bindAvatarLevelUpSaveImage, bindAvatarLevelUpShare, closeAvatarLevelUpModal, openAvatarLevelUpModal
- 로드 중 문 14: window 노출 2 · var 초기값 실행 6 · IfStatement 2 · 호출 4
- window 노출(2줄): closeAvatarLevelUpModal, openAvatarLevelUpModal
- 이벤트 처리기: addEventListener 2 · on<이벤트> 대입 0
- 바깥 js 가 window 이름을 씀: js/tabs/settings/avatar-greeting.js, js/tabs/settings/avatar-levelup-modal.js
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js, tests/avatar-10slots-growth.test.js (index.html 단독 읽기: tests/avatar-10slots-growth.test.js)

### G091 [#TASK-ES-146] 아워골 평가해주기 90% 팝업

- 7885~7915줄(31줄) · 어려움(46)
- 함수(0): 없음
- 변수(5): btnEvalBanner, btnEvalClose, btnSubmitEval, challengeBtn, modalEvalElem
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindAppEvalBackdrop, bindAppEvalSubmit, bindHomeAddGoal, closeAppEvaluationModal, openAppEvaluationModal, openMzShareCardModal, resetAppEvaluationForm, setTab
- 로드 중 문 15: window 노출 3 · var 초기값 실행 5 · IfStatement 3 · 호출 4
- window 노출(3줄): closeAppEvaluationModal, openAppEvaluationModal, resetAppEvaluationForm
- 이벤트 처리기: addEventListener 3 · on<이벤트> 대입 1
- 바깥 js 가 window 이름을 씀: js/components-home-actions.js, js/tabs/settings/app-evaluation.js
- 시험지 글자 의존: scripts/smoke-test.js, tests/app-evaluation-modal.test.js, tests/home-customizer-auto-sync.test.js (index.html 단독 읽기: tests/home-customizer-auto-sync.test.js)

### G108 RENDER: 팀 목표 (팀장·매니저만 추가/수정/삭제, 팀원은 보기만)

- 9086~9345줄(260줄) · 어려움(52)
- 함수(17): blockUser, canManageTeamGoals, ensureTeamCommentsLoaded, filterBlockedPosts, filterHidden, isUserBlocked, openBlockedUsersModal, reorderGoal, setupRealtimeChannelsOnce, setupTeamCommentsRealtime, setupUserSessionRealtime, shiftGoalOrder, sortGoalsByOrder, teamCommentItemHtml, teamComments, teamCommentsBlockHtml, unblockUser
- 변수(3): REALTIME_CHANNELS_SETUP, TEAM_COMMENTS_CACHE, USER_SESSION_CHANNEL
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: closeModal, escapeHtml, groupState, nowISO, renderCommFeed, renderGoalsScreen, renderTeamGoalsScreen, saveProfile, sb, setupFeedPostsRealtime, state, timeAgoStr 외 1
- 이벤트 처리기: addEventListener 2 · on<이벤트> 대입 0
- 부르는 묶음(들어옴): G010×6, G076×3, G004×2, G148×2, G001×1, G054×1
- 부르는 대상(나감): G019×4, G045×2, G076×2, G059×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-shipyard-modular.js, scripts/verify-all-clicks.js, tests/account-switch-isolation.test.js, tests/comm-ai-identity-es348.test.js, tests/core-confirm-es374.test.js, tests/core-confirm-es376.test.js, tests/direct-login-guard.test.js 외 10 (index.html 단독 읽기: tests/comm-ai-identity-es348.test.js, tests/goals-schedule-sync.test.js, tests/google-session-guard.test.js, tests/team-fold-state-es409.test.js, tests/team-goal-guide-hint.test.js, tests/team-level-accordion-es406.test.js)
- smoke-test FN_NAMES: filterBlockedPosts, filterHidden, sortGoalsByOrder — 옮기려면 시험지 선행 PR 먼저

### G104 [PHASE 5] #TASK-UIUX-PHASE5-RECORDS-CALENDAR FUNCTIONS

- 8891~9049줄(159줄) · 어려움(56)
- 함수(4): exportRecordsCsv, handleQuickStopwatchSaveRecord, handleQuickStopwatchToggle, switchRecFusionMode
- 다른 묶음 상태 — 대입: state · 변경: state · 읽기: dispatchFullViewPropagation, renderRecordsScreen, state, toggleRecordArchive, triggerHapticFeedback
- 로드 중 문 8: window 노출 8
- window 노출(14줄): _quickStopwatchElapsed, _quickStopwatchRunning, _quickStopwatchTimerId, exportRecordsCsv, handleQuickStopwatchSaveRecord, handleQuickStopwatchToggle, switchRecFusionMode, toggleRecordArchive
- 인라인 on*="…" 이 부르는 함수: exportRecordsCsv, handleQuickStopwatchSaveRecord, handleQuickStopwatchToggle, switchRecFusionMode
- 부르는 대상(나감): G019×18
- 바깥 js 가 window 이름을 씀: js/tabs/records/archive-toggle.js
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js, tests/account-switch-isolation.test.js, tests/core-confirm-es376.test.js, tests/direct-login-guard.test.js, tests/goals-schedule-sync.test.js, tests/goals-smart-attachments.test.js, tests/record-ledger-sync.test.js 외 1 (index.html 단독 읽기: tests/goals-schedule-sync.test.js, tests/goals-smart-attachments.test.js, tests/record-ledger-sync.test.js, tests/xp-server-ledger-es421.test.js)

### G054 Enter app

- 4861~4991줄(131줄) · 어려움(58)
- 함수(1): enterApp
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: OfflineSyncManager, challengeTwoFactorModal, checkSocialNotifications, checkStreakFreeze, computeStreakDays, ensureFeedPostsLoaded, loadSharedGroups, openAvatarGreetingPopup, openRecordModal, renderFirstCheckinTutorialBanner, restoreGoogleToken, setTab 외 4
- 로드 중 문 6: 호출 6
- 이벤트 처리기: addEventListener 5 · on<이벤트> 대입 0
- 부르는 묶음(들어옴): G142×2, G010×1, G015×1, G039×1, G048×1, G141×1
- 부르는 대상(나감): G045×5, G019×2, G061×1, G108×1, G135×1, G136×1, G139×1
- 시험지 글자 의존: scripts/smoke-test.js, tests/achievement-stats-shell-button-removal.test.js, tests/comm-ai-identity-es348.test.js, tests/core-confirm-es374.test.js, tests/core-modal-es363.test.js, tests/core-toast-es361.test.js, tests/dev-host-gate.test.js, tests/direct-login-guard.test.js 외 11 (index.html 단독 읽기: tests/comm-ai-identity-es348.test.js, tests/core-modal-es363.test.js, tests/core-toast-es361.test.js, tests/google-session-guard.test.js, tests/push-subscribe-auth-es400.test.js, tests/theme-system-v4.test.js, tests/top-page-guide-reposition.test.js, tests/unique-display-name.test.js)

### G109 개인 목표 200% 활용 가이드 & 템플릿 백과사전 (#TASK-ES-135)

- 9346~10106줄(761줄) · 어려움(59)
- 함수(6): collapseAllTeamGoalAccordions, getGroupLevelGoals, isMockGroup, openLevelGroupDetailModal, openTeamGoalEditModal, renderPersonalGoalsEmptyGuideHtml
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: MOCK_GROUPS, closeModal, daysFromNow, escapeHtml, renderTeamGoalsEmptyGuideHtml, renderTeamGoalsScreen, saveProfile, state, triggerHaptic, uid
- 로드 중 문 4: IfStatement 3 · window 노출 1
- window 노출(4줄): collapseAllTeamGoalAccordions, isMockGroup, renderTeamGoalsEmptyGuideHtml, renderTeamGoalsScreen
- 이벤트 처리기: addEventListener 18 · on<이벤트> 대입 0
- 부르는 묶음(들어옴): G010×5, G004×1, G148×1
- 부르는 대상(나감): G019×6, G059×2
- 바깥 js 가 window 이름을 씀: js/components-team-actions.js, js/components.js, js/goal-edit-ux.js, js/tabs/comm/shared-groups.js, js/tabs/goals/render.js, js/tabs/goals/sub-team.js, js/tabs/goals/team-goal-prompt.js, js/tabs/goals/team-goals-guide.js 외 5
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-shipyard-modular.js, scripts/verify-all-clicks.js, tests/account-switch-isolation.test.js, tests/ai-conditional-call-optimization.test.js, tests/comm-ai-identity-es348.test.js, tests/core-confirm-es374.test.js, tests/core-confirm-es376.test.js 외 12 (index.html 단독 읽기: tests/comm-ai-identity-es348.test.js, tests/goal-ai-advice-status.test.js, tests/google-session-guard.test.js, tests/team-fold-state-es409.test.js, tests/team-goal-guide-hint.test.js, tests/team-level-accordion-es406.test.js, tests/team-level-management.test.js)

### G103 [UI/UX 틀 개편 Phase 4] 목표 탭 노션급 데이터 관리 & 인지순행 IA (#TASK-UIUX-PHASE4-GOALS)

- 8737~8890줄(154줄) · 어려움(74)
- 함수(7): closeGoalDetailDrawer, handleGoalFastAddSubmit, openGoalDetailDrawer, renderRoutineMatrixGrid, selectSmartTag, toggleMilestoneInDrawer, toggleRoutineStamp
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: adoptTemplateAsMyGoal, dispatchFullViewPropagation, escapeHtml, renderGoalStatsChart, renderGoalsScreen, saveProfile, state, switchGoalStatPeriod, switchGoalsSubTab, triggerHapticFeedback
- 로드 중 문 13: window 노출 13
- window 노출(14줄): adoptTemplateAsMyGoal, closeGoalDetailDrawer, currentGoalStatPeriod, handleGoalFastAddSubmit, openGoalDetailDrawer, renderGoalStatsChart, renderRoutineMatrixGrid, selectSmartTag, selectedGoalSmartTag, switchGoalStatPeriod, switchGoalsSubTab, toggleMilestoneInDrawer, toggleRoutineStamp
- 인라인 on*="…" 이 부르는 함수: closeGoalDetailDrawer, handleGoalFastAddSubmit, openGoalDetailDrawer, selectSmartTag, toggleMilestoneInDrawer, toggleRoutineStamp
- 부르는 묶음(들어옴): G004×1
- 부르는 대상(나감): G019×6
- 바깥 js 가 window 이름을 씀: js/sanctuary-goal-trail.js, js/sanctuary-v3-engine.js, js/tabs/goals/goals-ia-actions.js, js/tabs/goals/render.js
- 시험지 글자 의존: scripts/smoke-test.js, tests/ai-conditional-call-optimization.test.js, tests/goal-ai-advice-status.test.js, tests/team-goal-comment-fix.test.js, tests/team-level-management.test.js (index.html 단독 읽기: tests/goal-ai-advice-status.test.js, tests/team-level-management.test.js)

### G119 템플릿 복제 보상형 광고(Rewarded Ad) 파이프라인 (TASK-ES-013)

- 11739~13117줄(1379줄) · 어려움(77)
- 함수(12): checkRecordDeepLink, computeAdCountdownProgress, executeDirectTemplateClone, getTemplateAdNoticeMessage, handleTemplateCloneWithAd, isTemplateRewardedAdEnabled, openProTemplateRecordModal, openTemplateMarketModal, openTemplateRecordDetailModal, playRewardedAdVideo, showWebRewardedAdModal, startTemplateAdCountdown
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: CURATED_MARKET_TEMPLATES, OURGOAL_CONFIG, XP_RULES, awardXP, burstConfetti, closeModal, escapeHtml, fmtTime, fmtYYMMDD, getAllProTemplates, getProTemplateByKey, isGoogleCalendarConnected 외 31
- 로드 중 문 2: IfStatement 1 · 호출 1
- window 노출(1줄): testTemplateAdFlow
- 이벤트 처리기: addEventListener 3 · on<이벤트> 대입 49
- 부르는 묶음(들어옴): G002×2, G003×1, G149×1
- 부르는 대상(나감): G019×20, G118×6, G116×4, G117×4, G059×3, G024×1, G124×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-shipyard-modular.js, scripts/verify-integrity-gate.js, tests/account-switch-isolation.test.js, tests/account-withdrawal-modal.test.js, tests/achievement-graph-multiset.test.js, tests/ai-conditional-call-optimization.test.js, tests/core-confirm-es376.test.js 외 11 (index.html 단독 읽기: tests/account-withdrawal-modal.test.js, tests/goal-templates-data-split.test.js, tests/record-ledger-sync.test.js)
- smoke-test FN_NAMES: computeAdCountdownProgress, getTemplateAdNoticeMessage, isTemplateRewardedAdEnabled — 옮기려면 시험지 선행 PR 먼저

### G076 RENDER: HOME

- 6384~6599줄(216줄) · 어려움(81)
- 함수(1): renderHome
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: BADGES, badgeContext, burstConfetti, computeStreakDays, dDay, dateKey, dispatchFullViewPropagation, escapeHtml, goalProgress, initFeedbackTierBar, initHomeCockpit, msCounts 외 16
- 이벤트 처리기: addEventListener 8 · on<이벤트> 대입 2
- 부르는 묶음(들어옴): G068×8, G024×2, G108×2, G001×1, G036×1, G139×1
- 부르는 대상(나감): G077×4, G108×3, G019×1, G024×1, G097×1, G139×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-all-clicks.js, scripts/verify-integrity-gate.js, tests/achievement-collapse-toggle.test.js, tests/achievement-metric-multiselect.test.js, tests/achievement-stats-shell-button-removal.test.js, tests/app-evaluation-notice.test.js, tests/avatar-exp-celebration.test.js 외 44 (index.html 단독 읽기: tests/app-evaluation-notice.test.js, tests/avatar-welcome-modal.test.js, tests/calendar-photo-diary-dismiss-guide.test.js, tests/comm-feed-cleanup.test.js, tests/comm-post-feed-button-fix.test.js, tests/component-modularization.test.js, tests/dm-keyboard-autofocus-fix.test.js, tests/goals-only-view.test.js 외 7)

### G090 [#TASK-ES-174] 목표 템플릿 백과사전 전체화면 팝업 및 상호작용

- 7317~7884줄(568줄) · 어려움(82)
- 함수(12): cheerRealUserTemplate, closeTemplateEncyclopediaModal, copyRealUserTemplate, getLikedTemplateMap, getUserSharedTemplates, openTemplateEncyclopediaModal, renderAiTemplatesList, renderRealUserTemplatesList, saveUserSharedTemplates, setLikedTemplateMap, shareMyActiveGoalAsTemplate, switchTemplateEncyclopediaTab
- 변수(8): REAL_USER_TEMPLATES, _tplActiveTab, _tplAiCurCat, btnCloseTplEncycl, btnHeaderTplEncycl, modalTplEncyclElem, tabBtnAi, tabBtnReal
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: escapeHtml, newId, nowISO, renderGoalsScreen, saveProfile, setTab, state, trackGoalCreated, uid
- 로드 중 문 20: window 노출 9 · var 초기값 실행 5 · IfStatement 5 · 호출 1
- window 노출(9줄): REAL_USER_TEMPLATES, cheerRealUserTemplate, closeGoalTemplateEncyclopediaModal, closeTemplateEncyclopediaModal, copyRealUserTemplate, copyUserGoalTemplate, openGoalTemplateEncyclopediaModal, openTemplateEncyclopediaModal, shareMyActiveGoalAsTemplate
- 이벤트 처리기: addEventListener 9 · on<이벤트> 대입 3
- 인라인 on*="…" 이 부르는 함수: closeTemplateEncyclopediaModal, openTemplateEncyclopediaModal
- 부르는 묶음(들어옴): G013×1, G014×1
- 부르는 대상(나감): G019×8, G125×2
- 바깥 js 가 window 이름을 씀: js/components-goal-actions.js, js/components.js, js/tabs/goals/team-goal-prompt.js, js/tabs/goals/template-quick-import.js
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-shipyard-modular.js, scripts/verify-all-clicks.js, scripts/verify-integrity-gate.js, tests/ai-conditional-call-optimization.test.js, tests/feed-post-category-diversity.test.js, tests/goal-template-legacy-cleanup.test.js, tests/goal-templates-data-split.test.js 외 7 (index.html 단독 읽기: tests/goal-templates-data-split.test.js, tests/goals-schedule-sync.test.js, tests/routine-tab-scheduler.test.js, tests/team-level-management.test.js)

### G024 XP/레벨 시스템

- 3365~3470줄(106줄) · 어려움(84)
- 함수(3): hasUserCustomizedAvatar, levelBadgeHtml, renderLevelBadge
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: MOCK_GROUPS, closeModal, dateKey, levelForXP, levelProgress, notifyXpGained, nowISO, saveProfile, state, triggerAvatarCelebrationPopup, updateTopBar, xpForLevel
- 로드 중 문 6: window 노출 5 · IfStatement 1
- window 노출(6줄): levelForXP, levelProgress, notifyXpGained, renderLevelBadge, triggerAvatarCelebrationPopup, xpForLevel
- 이벤트 처리기: addEventListener 0 · on<이벤트> 대입 2
- 부르는 묶음(들어옴): G004×1, G076×1, G077×1, G119×1
- 부르는 대상(나감): G076×2, G019×1, G059×1
- 바깥 js 가 window 이름을 씀: js/avatar/xp.js, js/core/badges.js, js/core/profile-topbar.js, js/sanctuary-weekly-recap.js, js/tabs/goals/goal-detail-events.js, js/tabs/goals/goal-update-suggest.js, js/tabs/goals/result-input.js, js/tabs/goals/result-modal.js 외 9
- 시험지 글자 의존: scripts/smoke-test.js, tests/avatar-10slots-growth.test.js, tests/avatar-icon-enlarge-all.test.js, tests/avatar-personas-split.test.js, tests/enlarge-avatar-icons.test.js, tests/feed-post-photo-upload.test.js, tests/gcal-login-reconnect-fix.test.js, tests/goal-template-legacy-cleanup.test.js 외 7 (index.html 단독 읽기: tests/avatar-10slots-growth.test.js, tests/avatar-personas-split.test.js, tests/enlarge-avatar-icons.test.js, tests/gcal-login-reconnect-fix.test.js, tests/goals-schedule-sync.test.js, tests/hide-home-debug-cards.test.js, tests/home-customizer-auto-sync.test.js, tests/remove-duplicate-home-layout-button.test.js 외 3)

### G059 Modal helper & Android Hardware Back Handler

- 5298~5364줄(67줄) · 어려움(163)
- 함수(1): openModal
- 변수(2): _modalDismissGraceUntil, _modalHistoryPushed
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindModalPopstateBack, closeModal, openBottomSheetAlert, openBottomSheetConfirm
- 로드 중 문 2: IfStatement 1 · 호출 1
- window 노출(5줄): _modalOpenAt, closeModal, openBottomSheetAlert, openBottomSheetConfirm, openModal
- 이벤트 처리기: addEventListener 0 · on<이벤트> 대입 2
- 부르는 묶음(들어옴): G057×7, G118×4, G119×3, G041×2, G099×2, G109×2, G148×2, G001×1, G002×1, G024×1 외 11
- 바깥 js 가 window 이름을 씀: js/auth-safety.js, js/avatar/dynamic-album.js, js/avatar/modal/bind-save.js, js/avatar/modal/index.js, js/components-home-actions.js, js/components.js, js/core/badges.js, js/core/confirm.js 외 115
- 시험지 글자 의존: scripts/smoke-test.js, tests/core-confirm-es374.test.js, tests/core-modal-es363.test.js, tests/dm-push-auth-es397.test.js, tests/google-session-guard.test.js (index.html 단독 읽기: tests/core-modal-es363.test.js, tests/google-session-guard.test.js)

### G019 Confetti

- 3301~3323줄(23줄) · 어려움(237)
- 함수(1): toast
- 변수(1): toastTimer
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: showUndoPrivacyToast
- 로드 중 문 2: IfStatement 2
- window 노출(3줄): showToast, showUndoPrivacyToast, toast
- 이벤트 처리기: addEventListener 0 · on<이벤트> 대입 1
- 인라인 on*="…" 이 부르는 함수: toast
- 부르는 묶음(들어옴): G119×20, G104×18, G118×14, G041×10, G090×8, G048×7, G049×6, G103×6, G109×6, G068×5 외 29
- 바깥 js 가 window 이름을 씀: js/auth-safety.js, js/avatar/dynamic-album.js, js/avatar/feature-cards.js, js/avatar/modal/bind-craft.js, js/avatar/modal/bind-deck.js, js/avatar/modal/bind-persona.js, js/avatar/modal/bind-save.js, js/avatar/modal/index.js 외 177
- 시험지 글자 의존: scripts/smoke-test.js, tests/avatar-personas-split.test.js (index.html 단독 읽기: tests/avatar-personas-split.test.js)

### G096 목표 보관(기록으로 옮기기)

- 7960~8133줄(174줄) · 어려움(245)
- 함수(3): goalAchievement, renderArchivedGoals, restoreGoal
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: dateKey, escapeHtml, resultPct, saveProfile, setTab, state, topicLabel
- 로드 중 문 2: window 노출 2
- window 노출(4줄): setArchivedPage, setArchivedPeriod, state
- 이벤트 처리기: addEventListener 1 · on<이벤트> 대입 0
- 인라인 on*="…" 이 부르는 함수: restoreGoal
- 부르는 묶음(들어옴): G002×1, G004×1, G148×1
- 부르는 대상(나감): G019×1, G139×1
- 바깥 js 가 window 이름을 씀: js/auth-safety.js, js/avatar/dynamic-album.js, js/avatar/feature-cards.js, js/avatar/modal/bind-craft.js, js/avatar/modal/bind-deck.js, js/avatar/modal/bind-save.js, js/avatar/modal/index.js, js/avatar/xp.js 외 205
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-all-clicks.js, tests/goals-schedule-sync.test.js, tests/guest-null-client-es377.test.js, tests/hidden-entry-guard.test.js, tests/team-goal-guide-hint.test.js (index.html 단독 읽기: tests/goals-schedule-sync.test.js, tests/team-goal-guide-hint.test.js)
- smoke-test FN_NAMES: goalAchievement — 옮기려면 시험지 선행 PR 먼저

### G010 [#TASK-ES-432] 인라인 스크립트 세포화 2차 이음매 (docs/architecture/INLINE-SCRIPT-MAP.md 지도 · docs/specs

- 2585~3026줄(442줄) · 어려움(264)
- 함수(0): 없음
- 변수(207): BADGES, OfflineSyncManager, PERSONAL_TEMPLATES_REAL, ROUTINE_TEMPLATES_AI, ROUTINE_TEMPLATES_REAL, TEAM_TEMPLATES_AI, TEAM_TEMPLATES_REAL, TREND_METRICS, _uiKit, addSimulatedCheerAndReplyToPost, adoptTemplateAsMyGoal, applyCrewPacingUI, applyGoalAgentOp, avatarHtml, badgeContext, bindAppEvalBackdrop, bindAppEvalSubmit, bindAvatarGrowthPromptSave, bindAvatarLevelUpBackdrop, bindAvatarLevelUpSaveImage 외 187
- 다른 묶음 상태 — 대입: MANITO_SERVER_LOADED, REAL_MANITO_INBOX_CACHE, REAL_MANITO_PARTNERS_CACHE, SHARED_GROUPS_LOADED, _cachedSignedCalendarToken, _isEnteringApp, _modalDismissGraceUntil, _modalHistoryPushed, _subtabTplCat, _subtabTplDomain, _subtabTplQuery, _subtabTplType 외 5 · 변경: 없음 · 읽기: CREATOR_TEMPLATES, EXTERNAL_DATA, GOAL_TEMPLATES, MANITO_EMOJI, MANITO_SERVER_LOADED, MANITO_STAMPS, MANITO_WELCOME_STAMPS, REAL_MANITO_INBOX_CACHE, REAL_MANITO_PARTNERS_CACHE, SHARED_GROUPS_LOADED, SHARE_PLATFORMS, SHIFT_WORK_PRESETS 외 90
- 로드 중 문 17: 호출 17
- 부르는 대상(나감): G108×6, G109×5, G099×3, G128×3, G027×2, G122×2, G016×1, G041×1, G045×1, G054×1 외 8
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-calendar-attachments.js, scripts/test-shipyard-modular.js, scripts/verify-integrity-gate.js, tests/account-switch-isolation.test.js, tests/achievement-graph-multiset.test.js, tests/ai-conditional-call-optimization.test.js, tests/app-evaluation-modal.test.js 외 34 (index.html 단독 읽기: scripts/test-calendar-attachments.js, tests/comm-ai-identity-es348.test.js, tests/comm-post-feed-button-fix.test.js, tests/core-modal-es363.test.js, tests/gcal-login-reconnect-fix.test.js, tests/goal-ai-advice-status.test.js, tests/goals-schedule-sync.test.js, tests/goals-smart-attachments.test.js 외 12)

### G027 뱃지 컬렉션 (명예의 전당)

- 3501~3812줄(312줄) · 어려움(279)
- 함수(6): defaultProfile, ensureUserRow, formatDisplayNameWithTag, loadProfile, resolveUniqueDisplayName, totalCompletedMilestones
- 변수(1): state
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: defaultSettings, escapeHtml, getAttribution, isoDate, loadLocalSettings, nowISO, saveLocalSettings, sb, track
- 로드 중 문 4: window 노출 1 · IfStatement 3
- window 노출(4줄): defaultProfile, formatDisplayNameWithTag, resolveUniqueDisplayName, state
- 부르는 묶음(들어옴): G048×3, G010×2, G045×2, G142×2, G002×1, G035×1, G039×1
- 부르는 대상(나감): G070×2, G016×1
- 바깥 js 가 window 이름을 씀: js/auth-safety.js, js/avatar/dynamic-album.js, js/avatar/feature-cards.js, js/avatar/modal/bind-craft.js, js/avatar/modal/bind-deck.js, js/avatar/modal/bind-save.js, js/avatar/modal/index.js, js/avatar/xp.js 외 205
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-shipyard-modular.js, scripts/verify-integrity-gate.js, tests/account-switch-isolation.test.js, tests/account-withdrawal-modal.test.js, tests/avatar-10slots-growth.test.js, tests/avatar-personas-split.test.js, tests/dev-host-gate.test.js 외 15 (index.html 단독 읽기: tests/account-withdrawal-modal.test.js, tests/avatar-10slots-growth.test.js, tests/avatar-personas-split.test.js, tests/gcal-login-reconnect-fix.test.js, tests/goal-templates-data-split.test.js, tests/push-subscribe-auth-es400.test.js, tests/record-ledger-sync.test.js, tests/routine-tab-scheduler.test.js 외 3)
- smoke-test FN_NAMES: totalCompletedMilestones — 옮기려면 시험지 선행 PR 먼저

## 6. 이음매·빈 구획

- G000 2298~2300(3줄) (IIFE 머리 — "use strict" 와 첫 구획 앞) — 빈 구획
- G001 2301~2379(79줄) [#TASK-ES-354 CORE-07] 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL.md) — 이음매(옮기지 않음) · 로드 중 문 1
- G002 2380~2421(42줄) [#TASK-ES-358] 기록 탭 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL.md) — 이음매(옮기지 않음) · 로드 중 문 1
- G003 2422~2450(29줄) [#TASK-ES-360] 일정 탭 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL.md, 기록 탭 #TASK-ES-358 과 같은 틀) — 이음매(옮기지 않음) · 로드 중 문 1
- G004 2451~2493(43줄) [#TASK-ES-370] 목표 탭 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL.md, 일정 탭 #TASK-ES-360 과 같은 틀) — 이음매(옮기지 않음) · 로드 중 문 1
- G006 2502~2517(16줄) [#TASK-ES-375] 목표 탭 모듈 이음매 2차 (docs/specs/MODULE-SPLIT-PROTOCOL.md, 1차 #TASK-ES-370 과 같은 틀 — 이음매(옮기지 않음) · 로드 중 문 1
- G007 2518~2539(22줄) [#TASK-ES-379] 소통 탭 모듈 이음매 1차 (docs/specs/MODULE-SPLIT-PROTOCOL.md, 목표 탭 #TASK-ES-370·#TAS — 이음매(옮기지 않음) · 로드 중 문 1
- G009 2573~2584(12줄) [#TASK-ES-423] 인라인 스크립트 세포화 1차 이음매 (docs/architecture/INLINE-SCRIPT-MAP.md 지도 · docs/specs — 이음매(옮기지 않음) · 로드 중 문 1
- G018 3293~3300(8줄) [#TASK-ES-264] 표준 시간대(한국 KST 00:00, 타 국가는 해당 국가 표준시 00:00) 기준 날짜 키 — 빈 구획 · 로드 중 문 1
- G021 3340~3343(4줄) 가상유저 개선 10대 핵심 헬퍼 함수 — 빈 구획 · 로드 중 문 1
- G022 3344~3356(13줄) [#TASK-ES-345 CAL-02] 구글 캘린더 토큰·일정 캐시 계정 격리 — 빈 구획 · 로드 중 문 1
- G028 3813~3816(4줄) [70] 다른 모든 기기 원격 로그아웃 전 로그인 기기 목록 확인 모달 — 빈 구획 · 로드 중 문 1
- G031 3846~3850(5줄) [80] 템플릿백과사전 1초 자동이식 선택 연동 및 로드맵-목표상태 동기화 — 빈 구획 · 로드 중 문 1
- G032 3851~3854(4줄) [82] 팀 목표 내 '팀 연계 개인목표' 생성 모달 — 빈 구획 · 로드 중 문 1
- G033 3855~3859(5줄) [83] 팀원 초대 시 '아워골 동반자 초대하기' 인앱 초대·참가 기능 — 빈 구획 · 로드 중 문 1
- G034 3860~3863(4줄) [88] 오늘의 3초 체크인 목표 버튼 선택 시 플레이스홀더(백그라운드 가이드) 예시 문구 렌더링 — 빈 구획 · 로드 중 문 1
- G035 3864~3874(11줄) [#TASK-UIUX-PHASE3-HOME-COCKPIT] 홈 1초 조망 ↔ 무저항 체크인 콕핏 8대 과업 — 빈 구획 · 로드 중 문 5
- G037 3988~3988(1줄) Landing — 빈 구획
- G040 4040~4048(9줄) [#TASK-ES-223] [생각 메모장 93번] 개발 디버그 버튼 프로덕션 완전 소거 및 로컬/디버그 격리 — 빈 구획 · 로드 중 문 2
- G042 4355~4359(5줄) [#TASK-ES-224] [생각 메모장 94번] 게스트(둘러보기) 3회 기록 시 안전 백업 넛지 및 카카오 무손실 계정 통합 — 빈 구획 · 로드 중 문 2
- G043 4360~4363(4줄) [#TASK-ES-224] [생각 메모장 94번] 카카오/소셜/일반 로그인 시 게스트 데이터 100% 무손실 비파괴 합집합(Union Merge) 이관 — 빈 구획 · 로드 중 문 1
- G053 4851~4860(10줄) 이용약관 / 개인정보처리방침 열람 리스너 — 빈 구획 · 로드 중 문 2
- G055 4992~4995(4줄) Onboarding (first-time, after signup) — 16종 동물 아바타 & 직관적 안착 융합 — 빈 구획 · 로드 중 문 1
- G056 4996~5005(10줄) 3단계: 첫 체크인 튜토리얼 가이드 및 축하 연출 — 빈 구획 · 로드 중 문 3
- G058 5290~5297(8줄) 조선소 블록 레지스트리 6대 메가블록 초기화 (헌법 제3조 제9항) — 빈 구획 · 로드 중 문 3
- G060 5365~5370(6줄) 이용약관 & 개인정보처리방침 모달 — 빈 구획 · 로드 중 문 1
- G064 5448~5465(18줄) 프로필 — 빈 구획 · 로드 중 문 5
- G065 5466~5466(1줄) 구글 캘린더 연동 — 빈 구획
- G067 5518~5527(10줄) [#TASK-ES-153 & #TASK-ES-155] 캘린더 일자별 배경 사진 지정 모달 — 빈 구획 · 로드 중 문 2
- G069 6024~6045(22줄) [#TASK-ES-181 & #TASK-ES-182] 폰 잠금화면에서 바로 보기 통합 허브 모달 — 빈 구획 · 로드 중 문 1
- G071 6302~6307(6줄) Adaptive UX Mode — 빈 구획 · 로드 중 문 1
- G072 6308~6314(7줄) Social Crew Pacing (#TASK-ES-228) — 빈 구획 · 로드 중 문 4
- G074 6338~6341(4줄) iOS 사파리 홈 화면 추가 안내 배너 & 실시간 알림 가이드 (#TASK-ES-234) — 빈 구획 · 로드 중 문 1
- G081 7003~7073(71줄) 음성 체크인 (Web Speech API) — 빈 구획 · 로드 중 문 1
- G086 7280~7296(17줄) 맞춤 피드백 봇 설정 — 빈 구획 · 로드 중 문 7
- G087 7297~7300(4줄) 목표 & 기록 선택 피드 공유 모달 (전면 고도화) — 빈 구획 · 로드 중 문 1
- G088 7301~7306(6줄) [#TASK-ES-301] 피드 게시 모달 내 '미리보기' 토글 직통 헬퍼 — 빈 구획 · 로드 중 문 1
- G092 7916~7925(10줄) New goal modal — 빈 구획 · 로드 중 문 2
- G093 7926~7926(1줄) 참고자료 (유튜브/영상, 이미지, 텍스트 메모, 웹링크) — 빈 구획
- G094 7927~7935(9줄) 참고자료 (유튜브/영상, 이미지, 텍스트 메모, 웹링크) — 빈 구획 · 로드 중 문 1
- G098 8215~8226(12줄) 목표 탭 3계층 일정설정 / 디데이·기간 표시 및 캘린더 연동 (#TASK-ES-259, 메모장 03항, #TASK-ES-135) — 빈 구획 · 로드 중 문 1
- G105 9050~9059(10줄) [PHASE 6] #TASK-UIUX-PHASE6-COMM-SETTINGS FUNCTIONS — 빈 구획 · 로드 중 문 4
- G106 9060~9082(23줄) [UI/UX 프레임워크 개편 Phase 7] 모바일 하드웨어 인터랙션 & 사용성 하드닝 — 빈 구획 · 로드 중 문 5
- G107 9083~9085(3줄) RENDER: GOALS — 빈 구획
- G110 10107~10198(92줄) [#TASK-ES-299] 팀 목표 댓글 작성 및 전송 직통 헬퍼 & 전역 이벤트 위임 (먹통 방어 100%) — 빈 구획 · 로드 중 문 3
- G113 10290~10291(2줄) 5대 테마 원형 라이프 밸런스 휠 (SVG Pie Chart) — 빈 구획
- G120 13118~13153(36줄) [#TASK-ES-358] 기록 탭 렌더 → js/tabs/records/period-ai-card.js · render.js 로 옮김 — 빈 구획 · 로드 중 문 2
- G123 13200~13200(1줄) RFC 5545 표준 iCalendar (.ics) 생성 순수 함수 (TASK-BG-11) — 빈 구획
- G132 13507~13516(10줄) [#TASK-ES-354 CORE-07·SET-07] 설정 탭 렌더 → js/tabs/settings/render.js · sub-*.js 로 옮김 — 이음매(옮기지 않음) · 로드 중 문 5
- G137 13675~13680(6줄) 4대 연계 뷰 원자적 동시 전파 디스패처 (헌법 제1조 제4항 제5호 & 제15조 제6항 제3호) — 빈 구획 · 로드 중 문 1
- G141 13733~13745(13줄) #TASK-AUTH-P0-SAFETY: 로그인/계정 보안 패키지 모듈 연결 — 빈 구획 · 로드 중 문 1
- G142 13746~13973(228줄) Boot — 빈 구획 · 로드 중 문 1
- G143 13974~13976(3줄) #TASK-ES-015 FIX: 공용 크레딧 모듈(js/credits.js)에 앱 sb 주입 — 빈 구획 · 로드 중 문 1
- G144 13977~13990(14줄) KF-7 #TASK-ES-014: 반응 4종 모듈(js/reactions.js)에 앱 핸들 연결 — 빈 구획 · 로드 중 문 1
- G145 13991~13995(5줄) KF-4 #TASK-ES-018: 카테고리별 도움이 된 글 슬롯 모듈(js/top-helpful.js) — 빈 구획 · 로드 중 문 1
- G146 13996~14004(9줄) KF-5 #TASK-ES-016: 도움돼요 이유 모듈(js/helpful-reason.js)에 앱 핸들 연결 — 빈 구획 · 로드 중 문 1
- G147 14005~14012(8줄) #TASK-ES-105: 팀 초대 및 소통/DM/동반자 모듈(js/team-invite-comm.js) 연결 — 빈 구획 · 로드 중 문 1
- G148 14013~14021(9줄) #TASK-ES-105: 팀 연계 개인목표 및 상호 체크 모듈(js/team-linked-goals.js) 연결 — 빈 구획 · 로드 중 문 2
- G149 14022~14026(5줄) KF-2 #TASK-ES-017: 템플릿 복제 크레딧 모듈(js/template-credit.js)에 앱 핸들 연결 — 빈 구획 · 로드 중 문 1
- G150 14027~14069(43줄) PWA: Service Worker 등록 및 자동 업데이트 감지 (#TASK-ES-118) — 빈 구획 · 로드 중 문 10
