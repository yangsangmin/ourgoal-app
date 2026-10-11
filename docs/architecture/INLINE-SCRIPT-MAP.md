# index.html 인라인 스크립트 책임 묶음 지도

> 생성: `NODE_PATH=<node_modules> node scripts/inline-script-map.js --write` (#TASK-ES-423). **손으로 고치지 않는다** — 다시 만들면 같은 입력에서 같은 글자가 나온다(결정적).
> 출처: `index.html` sha256 앞 12자 `e8c01d4986e3` · 큰 인라인 IIFE 2254~4135줄(1882줄) · 다른 인라인 블록 4줄(8줄), 4138줄(16줄).

## 1. 요약

- 묶음 53개(이음매 7 · 옮길 대상 17 · 빈 구획 29). 묶음 = IIFE 최상위 구획 주석 `/* ============ 제목 ============ */` 에서 다음 구획 주석 앞까지.
- 최상위 함수 2 · 최상위 변수 212 · window 전역 대입 4줄(module-metrics ③ 의 index.html 몫과 같은 정규식) · addEventListener 2 · on<이벤트> 대입 32 · 로드 중 바로 도는 최상위 문 38 · 인라인 on*="…" 처리기가 부르는 IIFE 이름 11개.
- 난이도 묶음 수(줄): 쉬움 11(94줄) · 보통 3(37줄) · 어려움 3(1510줄) · 빈 구획 29(178줄) · 이음매(옮기지 않음) 7(63줄).

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
| G046 | 템플릿 마켓 · 복제 · 전문 템플릿 기록 (TASK-ES-013) | 953 | 1 | 어려움(103) | 0/1/50 | 1 | 1 | 35(16) |
| G010 | [#TASK-ES-432] 인라인 스크립트 세포화 2차 이음매 (docs/architecture/INLINE-SCRIPT-MA | 383 | 0 | 어려움(110) | 4/0/20 | 10 | 0 | 30(18) |
| G048 | 캘린더 실시간 구독 URL 생성기 (WebCal Feed & #TASK-ES-252 HMAC 서명) | 174 | 1 | 어려움(27) | 0/0/2 | 2 | 1 | 6(4) |
| G017 | 아워골 앱 환경설정 | 22 | 0 | 쉬움(4) | 0/0/0 | 1 | 0 | 1(0) |
| G001 | [#TASK-ES-354 CORE-07] 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL.md) | 18 | 0 | 이음매(옮기지 않음)(18) | 0/0/1 | 1 | 0 | 10(5) |
| G013 | [#TASK-ES-448] 인라인 스크립트 세포화 P2-2 이음매 (docs/architecture/INLINE-SCRIPT- | 15 | 0 | 보통(17) | 1/0/6 | 2 | 0 | 4(1) |
| G033 | [#TASK-ES-153 & #TASK-ES-155] 캘린더 일자별 배경 사진 지정 모달 | 15 | 0 | 빈 구획(3) | 0/0/0 | 0 | 0 | 4(1) |
| G044 | 5대 테마 원형 라이프 밸런스 휠 (SVG Pie Chart) | 14 | 0 | 빈 구획(0) | 0/0/0 | 0 | 0 | 1(0) |
| G032 | [#TASK-ES-153] 전역 7일 유예 통합 휴지통 (Recycle Bin) 시스템 | 13 | 0 | 빈 구획(14) | 0/0/2 | 2 | 0 | 2(1) |
| G002 | [#TASK-ES-358] 기록 탭 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL.md) | 12 | 0 | 이음매(옮기지 않음)(45) | 1/0/3 | 1 | 0 | 48(12) |

## 3. 권장 순서 (안전한 것부터, 상위 30)

같은 점수면 큰 묶음 먼저(한 번 옮겨 많이 줄인다). 로드 중 문이 있는 묶음은 함수만 옮기고 그 문은 원래 자리에 남긴다(MODULE-SPLIT-PROTOCOL 3절).

| 순서 | 묶음 | 제목 | 줄 | 점수 | 근거(점수가 생긴 곳) |
|--:|---|---|--:|--:|---|
| 1 | G050 | 소통 피드 (Supabase feed_posts, 실시간 동기화) | 6 | 0 | 없음 |
| 2 | G041 | RENDER: TEMPLATE ENCYCLOPEDIA SUBTAB (#TASK-ES-187) | 3 | 0 | 없음 |
| 3 | G012 | [#TASK-ES-446] 인라인 스크립트 세포화 P2-1 이음매 (docs/architecture/INLI | 9 | 1 | 상태 읽기 1 |
| 4 | G008 | [#TASK-ES-444] 인라인 스크립트 세포화 P1 이음매 2 — 일정 배경·잠금화면 라이브, 소통 창· | 5 | 1 | 상태 읽기 1 |
| 5 | G011 | [#TASK-ES-436] 인라인 스크립트 세포화 P1 이음매 1 — 목표 AI·일정 설정, 기록 AI 피드 | 7 | 2 | 상태 읽기 2 |
| 6 | G026 | [78 / 89] 데이터분석 프롬프트 백과사전 (실사용 유저 등록·피드 게시 및 도움돼요 상호작용) | 7 | 3 | 상태 읽기 1 · 로드 중 문 1 |
| 7 | G017 | 아워골 앱 환경설정 | 22 | 4 | 로드 중 문 1 · window 1 · 바깥 파일 1 |
| 8 | G014 | [#TASK-ES-437] 인라인 스크립트 세포화 P0 이음매 (docs/architecture/INLINE | 8 | 4 | 상태 읽기 2 · 로드 중 문 1 |
| 9 | G042 | [#TASK-ES-189] 템플릿 백과사전 3대 분류(개인·루틴·팀) 및 AI/실유저 2원화 이식 시스템 | 11 | 6 | 상태 읽기 1 · 로드 중 문 1 · 시험지(index 단독) 1 |
| 10 | G016 | Supabase | 8 | 6 | 상태 읽기 1 · 로드 중 문 1 · 시험지(index 단독) 1 |
| 11 | G015 | [#TASK-ES-442] 인라인 스크립트 세포화 P0 이음매 (docs/architecture/INLINE | 8 | 8 | 상태 대입 1 · 상태 읽기 2 · 로드 중 문 1 |
| 12 | G023 | 뱃지 컬렉션 (명예의 전당) | 12 | 10 | 상태 읽기 2 · 로드 중 문 1 · 시험지(index 단독) 2 |
| 13 | G022 | [#TASK-ES-150] 아바타 레벨업 대형 팝업 & 성장 성향 키워드 | 10 | 14 | 상태 읽기 1 · 로드 중 문 2 · 시험지(index 단독) 3 |
| 14 | G013 | [#TASK-ES-448] 인라인 스크립트 세포화 P2-2 이음매 (docs/architecture/INLI | 15 | 17 | 상태 대입 1 · 상태 읽기 6 · 로드 중 문 2 · 시험지(index 단독) 1 |
| 15 | G048 | 캘린더 실시간 구독 URL 생성기 (WebCal Feed & #TASK-ES-252 HMAC 서명) | 174 | 27 | 상태 읽기 2 · 로드 중 문 2 · 들어옴 1 · window 1 · 바깥 파일 7 · 시험지(index 단독) 4 |
| 16 | G046 | 템플릿 마켓 · 복제 · 전문 템플릿 기록 (TASK-ES-013) | 953 | 103 | 상태 변경 1 · 상태 읽기 50 · 로드 중 문 1 · 들어옴 1 · 시험지(index 단독) 16 |
| 17 | G010 | [#TASK-ES-432] 인라인 스크립트 세포화 2차 이음매 (docs/architecture/INLINE | 383 | 110 | 상태 대입 4 · 상태 읽기 20 · 로드 중 문 10 · 시험지(index 단독) 18 |

## 4. 전체 묶음 표

| 묶음 | 줄 범위 | 줄 | 제목 | 함수 | 변수 | 난이도(점수) | 상태 쓰기 · 변경 · 읽기 | window | 처리기(add/on) | 로드 중 문 | 인라인 처리기 | 들어옴/나감 묶음 | 바깥 파일 | 시험지(index 단독) |
|---|---|--:|---|--:|--:|---|---|--:|---|--:|--:|---|--:|---|
| G000 | 2254~2256 | 3 | (IIFE 머리 — "use strict" 와 첫 구획 앞) | 0 | 0 | 빈 구획(66) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 67(22) |
| G001 | 2257~2274 | 18 | [#TASK-ES-354 CORE-07] 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTO | 0 | 9 | 이음매(옮기지 않음)(18) | 0 · 0 · 1 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 10(5) |
| G002 | 2275~2286 | 12 | [#TASK-ES-358] 기록 탭 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL | 0 | 2 | 이음매(옮기지 않음)(45) | 1 · 0 · 3 | 0 | 0/0 | 1 | 0 | 0/1 | 0 | 48(12) |
| G003 | 2287~2292 | 6 | [#TASK-ES-360] 일정 탭 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL | 0 | 2 | 이음매(옮기지 않음)(9) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 11(3) |
| G004 | 2293~2301 | 9 | [#TASK-ES-370] 목표 탭 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL | 0 | 2 | 이음매(옮기지 않음)(39) | 0 · 0 · 1 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 47(12) |
| G005 | 2302~2305 | 4 | [#TASK-ES-453] 인라인 스크립트 세포화 P1 이음매 3 — 목표 종합상황 AI 요약 새로 고침 ( | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G006 | 2306~2309 | 4 | [#TASK-ES-375] 목표 탭 모듈 이음매 2차 (docs/specs/MODULE-SPLIT-PROTO | 0 | 0 | 이음매(옮기지 않음)(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G007 | 2310~2318 | 9 | [#TASK-ES-379] 소통 탭 모듈 이음매 1차 (docs/specs/MODULE-SPLIT-PROTO | 0 | 1 | 이음매(옮기지 않음)(4) | 0 · 0 · 2 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 0(0) |
| G008 | 2319~2323 | 5 | [#TASK-ES-444] 인라인 스크립트 세포화 P1 이음매 2 — 일정 배경·잠금화면 라이브, 소통 창· | 0 | 1 | 쉬움(1) | 0 · 0 · 1 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G009 | 2324~2328 | 5 | [#TASK-ES-423] 인라인 스크립트 세포화 1차 이음매 (docs/architecture/INLINE | 0 | 1 | 이음매(옮기지 않음)(1) | 0 · 0 · 1 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 3(0) |
| G010 | 2329~2711 | 383 | [#TASK-ES-432] 인라인 스크립트 세포화 2차 이음매 (docs/architecture/INLINE | 0 | 163 | 어려움(110) | 4 · 0 · 20 | 0 | 0/0 | 10 | 0 | 0/1 | 0 | 30(18) |
| G011 | 2712~2718 | 7 | [#TASK-ES-436] 인라인 스크립트 세포화 P1 이음매 1 — 목표 AI·일정 설정, 기록 AI 피드 | 0 | 3 | 쉬움(2) | 0 · 0 · 2 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G012 | 2719~2727 | 9 | [#TASK-ES-446] 인라인 스크립트 세포화 P2-1 이음매 (docs/architecture/INLI | 0 | 5 | 쉬움(1) | 0 · 0 · 1 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G013 | 2728~2742 | 15 | [#TASK-ES-448] 인라인 스크립트 세포화 P2-2 이음매 (docs/architecture/INLI | 0 | 6 | 보통(17) | 1 · 0 · 6 | 0 | 0/0 | 2 | 0 | 0/0 | 0 | 4(1) |
| G014 | 2743~2750 | 8 | [#TASK-ES-437] 인라인 스크립트 세포화 P0 이음매 (docs/architecture/INLINE | 0 | 1 | 쉬움(4) | 0 · 0 · 2 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 1(0) |
| G015 | 2751~2758 | 8 | [#TASK-ES-442] 인라인 스크립트 세포화 P0 이음매 (docs/architecture/INLINE | 0 | 1 | 쉬움(8) | 1 · 0 · 2 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 2(0) |
| G016 | 2759~2766 | 8 | Supabase | 0 | 3 | 쉬움(6) | 0 · 0 · 1 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 2(1) |
| G017 | 2767~2788 | 22 | 아워골 앱 환경설정 | 0 | 1 | 쉬움(4) | 0 · 0 · 0 | 1 | 0/0 | 1 | 0 | 0/0 | 1 | 1(0) |
| G018 | 2789~2796 | 8 | [#TASK-ES-264] 표준 시간대(한국 KST 00:00, 타 국가는 해당 국가 표준시 00:00) 기 | 0 | 0 | 빈 구획(3) | 0 · 0 · 1 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 2(0) |
| G019 | 2797~2799 | 3 | 가상유저 개선 10대 핵심 헬퍼 함수 | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 2(0) |
| G020 | 2800~2807 | 8 | [#TASK-ES-345 CAL-02] 구글 캘린더 토큰·일정 캐시 계정 격리 | 0 | 0 | 빈 구획(3) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 2(1) |
| G021 | 2808~2811 | 4 | XP/레벨 시스템 | 0 | 0 | 빈 구획(3) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 2(1) |
| G022 | 2812~2821 | 10 | [#TASK-ES-150] 아바타 레벨업 대형 팝업 & 성장 성향 키워드 | 0 | 1 | 보통(14) | 0 · 0 · 1 | 0 | 0/0 | 2 | 0 | 0/0 | 0 | 7(3) |
| G023 | 2822~2833 | 12 | 뱃지 컬렉션 (명예의 전당) | 0 | 1 | 보통(10) | 0 · 0 · 2 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 5(2) |
| G024 | 2834~2836 | 3 | [70] 다른 모든 기기 원격 로그아웃 전 로그인 기기 목록 확인 모달 | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G025 | 2837~2844 | 8 | [71] 앱 잠금 PIN (이 기기) — 설정·해제·앱 진입 확인 | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G026 | 2845~2851 | 7 | [78 / 89] 데이터분석 프롬프트 백과사전 (실사용 유저 등록·피드 게시 및 도움돼요 상호작용) | 0 | 1 | 쉬움(3) | 0 · 0 · 1 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 2(0) |
| G027 | 2852~2855 | 4 | [80] 템플릿백과사전 1초 자동이식 선택 연동 및 로드맵-목표상태 동기화 | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G028 | 2856~2858 | 3 | [82] 팀 목표 내 '팀 연계 개인목표' 생성 모달 | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G029 | 2859~2862 | 4 | [83] 팀원 초대 시 '아워골 동반자 초대하기' 인앱 초대·참가 기능 | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G030 | 2863~2868 | 6 | [88] 오늘의 3초 체크인 목표 버튼 선택 시 플레이스홀더(백그라운드 가이드) 예시 문구 렌더링 | 0 | 0 | 빈 구획(3) | 0 · 0 · 1 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 1(0) |
| G031 | 2869~2869 | 1 | 구글 캘린더 연동 | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G032 | 2870~2882 | 13 | [#TASK-ES-153] 전역 7일 유예 통합 휴지통 (Recycle Bin) 시스템 | 0 | 0 | 빈 구획(14) | 0 · 0 · 2 | 1 | 0/0 | 2 | 0 | 0/0 | 4 | 2(1) |
| G033 | 2883~2897 | 15 | [#TASK-ES-153 & #TASK-ES-155] 캘린더 일자별 배경 사진 지정 모달 | 0 | 0 | 빈 구획(3) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 4(1) |
| G034 | 2898~2906 | 9 | [#TASK-ES-181 & #TASK-ES-182] 폰 잠금화면에서 바로 보기 통합 허브 모달 | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 3(0) |
| G035 | 2907~2911 | 5 | Adaptive UX Mode | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G036 | 2912~2921 | 10 | Social Crew Pacing (#TASK-ES-228) | 0 | 0 | 빈 구획(3) | 0 · 0 · 1 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 1(0) |
| G037 | 2922~2928 | 7 | [#TASK-ES-264] 오늘의 미션 및 AI 피드백 조건부 호출 최적화 | 0 | 0 | 빈 구획(3) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 3(1) |
| G038 | 2929~2931 | 3 | 목표 탭 3계층 일정설정 / 디데이·기간 표시 및 캘린더 연동 (#TASK-ES-259, 메모장 03항, # | 0 | 0 | 빈 구획(3) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(1) |
| G039 | 2932~2934 | 3 | [#TASK-ES-220] [생각 메모장 91번] 교대근무자 가변형 루틴 프리셋 & 자동 스케줄러 | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G040 | 2935~2938 | 4 | [#TASK-ES-172] [27] 목표 탭: 데일리 루틴 서브탭 & 편집/상세 모달 | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G041 | 2939~2941 | 3 | RENDER: TEMPLATE ENCYCLOPEDIA SUBTAB (#TASK-ES-187) | 0 | 2 | 쉬움(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G042 | 2942~2952 | 11 | [#TASK-ES-189] 템플릿 백과사전 3대 분류(개인·루틴·팀) 및 AI/실유저 2원화 이식 시스템 | 0 | 4 | 쉬움(6) | 0 · 0 · 1 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 4(1) |
| G043 | 2953~2959 | 7 | TASK-ES-307: 측정지표 다중 선택 및 동시 렌더링 엔진 | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 3(0) |
| G044 | 2960~2973 | 14 | 5대 테마 원형 라이프 밸런스 휠 (SVG Pie Chart) | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G045 | 2974~2981 | 8 | ⏱️ 인앱 인터벌 타이머 & 스톱워치 위젯 (In-Table Stopwatch) | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 2(0) |
| G046 | 2982~3934 | 953 | 템플릿 마켓 · 복제 · 전문 템플릿 기록 (TASK-ES-013) | 1 | 0 | 어려움(103) | 0 · 1 · 50 | 0 | 2/32 | 1 | 0 | 1/0 | 0 | 35(16) |
| G047 | 3935~3935 | 1 | RFC 5545 표준 iCalendar (.ics) 생성 순수 함수 (TASK-BG-11) | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G048 | 3936~4109 | 174 | 캘린더 실시간 구독 URL 생성기 (WebCal Feed & #TASK-ES-252 HMAC 서명) | 1 | 1 | 어려움(27) | 0 · 0 · 2 | 1 | 0/0 | 2 | 0 | 1/0 | 7 | 6(4) |
| G049 | 4110~4112 | 3 | 크리에이터 템플릿 (#TASK-ES-315, 64: 구형 창 영구 제거 및 무해화) | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 2(0) |
| G050 | 4113~4118 | 6 | 소통 피드 (Supabase feed_posts, 실시간 동기화) | 0 | 1 | 쉬움(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 3(0) |
| G051 | 4119~4128 | 10 | 전역 공유 팀 로더 & 렌더링 (#TASK-ES-133) | 0 | 0 | 빈 구획(12) | 0 · 0 · 2 | 1 | 0/0 | 3 | 0 | 0/0 | 3 | 1(0) |
| G052 | 4129~4135 | 7 | KF-2 #TASK-ES-017: 템플릿 복제 크레딧 모듈(js/template-credit.js)에 앱 핸 | 0 | 0 | 빈 구획(8) | 0 · 0 · 4 | 0 | 0/0 | 2 | 0 | 0/0 | 0 | 1(0) |

## 5. 묶음별 의존 상세 (옮길 대상만, 권장 순서)

### G050 소통 피드 (Supabase feed_posts, 실시간 동기화)

- 4113~4118줄(6줄) · 쉬움(0)
- 함수(0): 없음
- 변수(1): FEED_POSTS_CACHE
- 시험지 글자 의존: scripts/smoke-test.js, tests/core-confirm-es376.test.js, tests/guest-null-client-es377.test.js

### G041 RENDER: TEMPLATE ENCYCLOPEDIA SUBTAB (#TASK-ES-187)

- 2939~2941줄(3줄) · 쉬움(0)
- 함수(0): 없음
- 변수(2): _subtabTplCat, _subtabTplQuery

### G012 [#TASK-ES-446] 인라인 스크립트 세포화 P2-1 이음매 (docs/architecture/INLINE-SCRIPT-MAP.md 지도 · docs/spe

- 2719~2727줄(9줄) · 쉬움(1)
- 함수(0): 없음
- 변수(5): openProCoachReportModal, openProNotionExportModal, pushRecordToNotion, renderAnalyticsHtml, renderTrendSvgChart
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: _recordsKit
- 시험지 글자 의존: scripts/smoke-test.js

### G008 [#TASK-ES-444] 인라인 스크립트 세포화 P1 이음매 2 — 일정 배경·잠금화면 라이브, 소통 창·스토리 캔버스, 사진 인증, 목표 스타터·로컬 문장, 

- 2319~2323줄(5줄) · 쉬움(1)
- 함수(0): 없음
- 변수(1): initKeyboardShield
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: _settingsKit
- 시험지 글자 의존: scripts/smoke-test.js

### G011 [#TASK-ES-436] 인라인 스크립트 세포화 P1 이음매 1 — 목표 AI·일정 설정, 기록 AI 피드백 (docs/architecture/INLINE-SC

- 2712~2718줄(7줄) · 쉬움(2)
- 함수(0): 없음
- 변수(3): requestAIFeedback, requestServerAIFeedback, sendGoalAgentMessage
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: _goalsKit, _recordsKit
- 시험지 글자 의존: scripts/smoke-test.js

### G026 [78 / 89] 데이터분석 프롬프트 백과사전 (실사용 유저 등록·피드 게시 및 도움돼요 상호작용)

- 2845~2851줄(7줄) · 쉬움(3)
- 함수(0): 없음
- 변수(1): _promptEncyclopediaOpen
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bootPromptTabState
- 로드 중 문 1: 호출 1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js

### G017 아워골 앱 환경설정

- 2767~2788줄(22줄) · 쉬움(4)
- 함수(0): 없음
- 변수(1): OURGOAL_CONFIG
- 로드 중 문 1: IfStatement 1
- window 노출(1줄): OURGOAL_CONFIG
- 바깥 js 가 window 이름을 씀: js/streaks.js
- 시험지 글자 의존: scripts/smoke-test.js

### G014 [#TASK-ES-437] 인라인 스크립트 세포화 P0 이음매 (docs/architecture/INLINE-SCRIPT-MAP.md 지도 · docs/specs

- 2743~2750줄(8줄) · 쉬움(4)
- 함수(0): 없음
- 변수(1): showLegalModal
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: MOCK_GROUPS, _settingsKit
- 로드 중 문 1: 호출 1
- 시험지 글자 의존: scripts/smoke-test.js

### G042 [#TASK-ES-189] 템플릿 백과사전 3대 분류(개인·루틴·팀) 및 AI/실유저 2원화 이식 시스템

- 2942~2952줄(11줄) · 쉬움(6)
- 함수(0): 없음
- 변수(4): _subtabTplCat, _subtabTplDomain, _subtabTplQuery, _subtabTplType
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bootGoalsAndTeamState
- 로드 중 문 1: 호출 1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-shipyard-modular.js, scripts/verify-integrity-gate.js, tests/routine-tab-scheduler.test.js (index.html 단독 읽기: tests/routine-tab-scheduler.test.js)

### G016 Supabase

- 2759~2766줄(8줄) · 쉬움(6)
- 함수(0): 없음
- 변수(3): SUPABASE_ANON_KEY, SUPABASE_URL, sb
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bootAuthStateListener
- 로드 중 문 1: 호출 1
- 시험지 글자 의존: scripts/smoke-test.js, tests/security-audit.test.js (index.html 단독 읽기: tests/security-audit.test.js)

### G015 [#TASK-ES-442] 인라인 스크립트 세포화 P0 이음매 (docs/architecture/INLINE-SCRIPT-MAP.md 지도 · docs/specs

- 2751~2758줄(8줄) · 쉬움(8)
- 함수(0): 없음
- 변수(1): initDevDebugButtons
- 다른 묶음 상태 — 대입: _promptEncyclopediaOpen · 변경: 없음 · 읽기: _promptEncyclopediaOpen, _settingsKit
- 로드 중 문 1: 호출 1
- 시험지 글자 의존: scripts/smoke-test.js, tests/dev-host-gate.test.js

### G023 뱃지 컬렉션 (명예의 전당)

- 2822~2833줄(12줄) · 보통(10)
- 함수(0): 없음
- 변수(1): state
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bootExposeAppState, isoDate
- 로드 중 문 1: 호출 1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-shipyard-modular.js, scripts/verify-integrity-gate.js, tests/routine-tab-scheduler.test.js, tests/unique-display-name.test.js (index.html 단독 읽기: tests/routine-tab-scheduler.test.js, tests/unique-display-name.test.js)

### G022 [#TASK-ES-150] 아바타 레벨업 대형 팝업 & 성장 성향 키워드

- 2812~2821줄(10줄) · 보통(14)
- 함수(0): 없음
- 변수(1): btnAvLvClose
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bootAvatarLevelUpWiring
- 로드 중 문 2: var 초기값 실행 1 · 호출 1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js, tests/avatar-10slots-growth.test.js, tests/core-confirm-es376.test.js, tests/guest-null-client-es377.test.js, tests/team-fold-state-es409.test.js, tests/team-level-accordion-es406.test.js (index.html 단독 읽기: tests/avatar-10slots-growth.test.js, tests/team-fold-state-es409.test.js, tests/team-level-accordion-es406.test.js)

### G013 [#TASK-ES-448] 인라인 스크립트 세포화 P2-2 이음매 (docs/architecture/INLINE-SCRIPT-MAP.md 지도 · docs/spe

- 2728~2742줄(15줄) · 보통(17)
- 함수(0): 없음
- 변수(6): MOCK_PEOPLE, daysFromNow, groupState, playTimerBeep, renderLapRowsHtml, renderStopwatchWidgetHtml
- 다른 묶음 상태 — 대입: FEED_POSTS_CACHE · 변경: 없음 · 읽기: FEED_POSTS_CACHE, MOCK_GROUPS, _commKit, _goalsKit, _recordsKit, bootApplySavedTheme
- 로드 중 문 2: 호출 2
- 시험지 글자 의존: scripts/smoke-test.js, tests/stopwatch-lap-inputs.test.js, tests/stopwatch-table-hint.test.js, tests/team-fold-state-es409.test.js (index.html 단독 읽기: tests/team-fold-state-es409.test.js)

### G048 캘린더 실시간 구독 URL 생성기 (WebCal Feed & #TASK-ES-252 HMAC 서명)

- 3936~4109줄(174줄) · 어려움(27)
- 함수(1): shareContent
- 변수(1): MOCK_GROUPS
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bootRecordsExportWiring, daysFromNow
- 로드 중 문 2: 호출 1 · window 노출 1
- window 노출(1줄): shareContent
- 부르는 묶음(들어옴): G010×1
- 바깥 js 가 window 이름을 씀: js/tabs/comm/feed-list.js, js/tabs/comm/share-card.js, js/tabs/records/export-theme.js, js/tabs/records/template-market.js, js/team-share.js, js/team-templates.js, js/viral-sharing.js
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js, tests/team-fold-state-es409.test.js, tests/team-level-accordion-es406.test.js, tests/team-level-management.test.js, tests/team-tasks-toggle-es410.test.js (index.html 단독 읽기: tests/team-fold-state-es409.test.js, tests/team-level-accordion-es406.test.js, tests/team-level-management.test.js, tests/team-tasks-toggle-es410.test.js)

### G046 템플릿 마켓 · 복제 · 전문 템플릿 기록 (TASK-ES-013)

- 2982~3934줄(953줄) · 어려움(103)
- 함수(1): openProTemplateRecordModal
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: XP_RULES, awardXP, bootRecordsWiring, burstConfetti, closeModal, computeTrendChartData, downloadTableAsCsv, escapeHtml, fmtYYMMDD, formatStopwatchTime, getAllProTemplates, getProTemplateByKey 외 38
- 로드 중 문 1: 호출 1
- 이벤트 처리기: addEventListener 2 · on<이벤트> 대입 32
- 부르는 묶음(들어옴): G002×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-calendar-attachments.js, scripts/test-shipyard-modular.js, scripts/verify-all-clicks.js, scripts/verify-integrity-gate.js, tests/account-withdrawal-modal.test.js, tests/achievement-graph-multiset.test.js, tests/ai-conditional-call-optimization.test.js 외 27 (index.html 단독 읽기: scripts/test-calendar-attachments.js, tests/account-withdrawal-modal.test.js, tests/avatar-personas-split.test.js, tests/goal-ai-advice-status.test.js, tests/goal-templates-data-split.test.js, tests/goals-only-view.test.js, tests/goals-schedule-sync.test.js, tests/goals-smart-attachments.test.js 외 8)

### G010 [#TASK-ES-432] 인라인 스크립트 세포화 2차 이음매 (docs/architecture/INLINE-SCRIPT-MAP.md 지도 · docs/specs

- 2329~2711줄(383줄) · 어려움(110)
- 함수(0): 없음
- 변수(163): CURATED_MARKET_TEMPLATES, TEAM_COMMENTS_CACHE, _authSocialKit, _curatedMarketDataKit, _levelBadgeKit, _modalOpenKit, _uiKit, _visionTableInputKit, bindAppEvalBackdrop, bindAppEvalSubmit, bindArchivedPageSetter, bindArchivedPeriodSetter, bindAuthTabButtons, bindAuthTesterBButton, bindAvatarGrowthPromptSave, bindAvatarLevelUpBackdrop, bindAvatarLevelUpSaveImage, bindAvatarLevelUpShare, bindCaptureLiveMeta, bindCapturePhoto 외 143
- 다른 묶음 상태 — 대입: _subtabTplCat, _subtabTplDomain, _subtabTplQuery, _subtabTplType · 변경: 없음 · 읽기: MOCK_PEOPLE, _calendarKit, _goalsKit, _recordsKit, _settingsKit, _subtabTplCat, _subtabTplDomain, _subtabTplQuery, _subtabTplType, bindSettingsHapticDelegate, bindSettingsStaticHandlers, btnAvLvClose 외 8
- 로드 중 문 10: 호출 10
- 부르는 대상(나감): G048×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-calendar-attachments.js, scripts/verify-integrity-gate.js, tests/account-switch-isolation.test.js, tests/account-withdrawal-modal.test.js, tests/avatar-personas-split.test.js, tests/comm-post-feed-button-fix.test.js, tests/core-confirm-es374.test.js 외 22 (index.html 단독 읽기: scripts/test-calendar-attachments.js, tests/account-withdrawal-modal.test.js, tests/avatar-personas-split.test.js, tests/comm-post-feed-button-fix.test.js, tests/core-modal-es363.test.js, tests/core-toast-es361.test.js, tests/gcal-login-reconnect-fix.test.js, tests/google-session-guard.test.js 외 10)

## 6. 이음매·빈 구획

- G000 2254~2256(3줄) (IIFE 머리 — "use strict" 와 첫 구획 앞) — 빈 구획
- G001 2257~2274(18줄) [#TASK-ES-354 CORE-07] 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL.md) — 이음매(옮기지 않음) · 로드 중 문 1
- G002 2275~2286(12줄) [#TASK-ES-358] 기록 탭 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL.md) — 이음매(옮기지 않음) · 로드 중 문 1
- G003 2287~2292(6줄) [#TASK-ES-360] 일정 탭 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL.md, 기록 탭 #TASK-ES-358 과 같은 틀) — 이음매(옮기지 않음)
- G004 2293~2301(9줄) [#TASK-ES-370] 목표 탭 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL.md, 일정 탭 #TASK-ES-360 과 같은 틀) — 이음매(옮기지 않음) · 로드 중 문 1
- G005 2302~2305(4줄) [#TASK-ES-453] 인라인 스크립트 세포화 P1 이음매 3 — 목표 종합상황 AI 요약 새로 고침 (docs/architecture/INLINE-SCRIP — 빈 구획
- G006 2306~2309(4줄) [#TASK-ES-375] 목표 탭 모듈 이음매 2차 (docs/specs/MODULE-SPLIT-PROTOCOL.md, 1차 #TASK-ES-370 과 같은 틀 — 이음매(옮기지 않음)
- G007 2310~2318(9줄) [#TASK-ES-379] 소통 탭 모듈 이음매 1차 (docs/specs/MODULE-SPLIT-PROTOCOL.md, 목표 탭 #TASK-ES-370·#TAS — 이음매(옮기지 않음) · 로드 중 문 1
- G009 2324~2328(5줄) [#TASK-ES-423] 인라인 스크립트 세포화 1차 이음매 (docs/architecture/INLINE-SCRIPT-MAP.md 지도 · docs/specs — 이음매(옮기지 않음)
- G018 2789~2796(8줄) [#TASK-ES-264] 표준 시간대(한국 KST 00:00, 타 국가는 해당 국가 표준시 00:00) 기준 날짜 키 — 빈 구획 · 로드 중 문 1
- G019 2797~2799(3줄) 가상유저 개선 10대 핵심 헬퍼 함수 — 빈 구획
- G020 2800~2807(8줄) [#TASK-ES-345 CAL-02] 구글 캘린더 토큰·일정 캐시 계정 격리 — 빈 구획
- G021 2808~2811(4줄) XP/레벨 시스템 — 빈 구획
- G024 2834~2836(3줄) [70] 다른 모든 기기 원격 로그아웃 전 로그인 기기 목록 확인 모달 — 빈 구획
- G025 2837~2844(8줄) [71] 앱 잠금 PIN (이 기기) — 설정·해제·앱 진입 확인 — 빈 구획
- G027 2852~2855(4줄) [80] 템플릿백과사전 1초 자동이식 선택 연동 및 로드맵-목표상태 동기화 — 빈 구획
- G028 2856~2858(3줄) [82] 팀 목표 내 '팀 연계 개인목표' 생성 모달 — 빈 구획
- G029 2859~2862(4줄) [83] 팀원 초대 시 '아워골 동반자 초대하기' 인앱 초대·참가 기능 — 빈 구획
- G030 2863~2868(6줄) [88] 오늘의 3초 체크인 목표 버튼 선택 시 플레이스홀더(백그라운드 가이드) 예시 문구 렌더링 — 빈 구획 · 로드 중 문 1
- G031 2869~2869(1줄) 구글 캘린더 연동 — 빈 구획
- G032 2870~2882(13줄) [#TASK-ES-153] 전역 7일 유예 통합 휴지통 (Recycle Bin) 시스템 — 빈 구획 · 로드 중 문 2
- G033 2883~2897(15줄) [#TASK-ES-153 & #TASK-ES-155] 캘린더 일자별 배경 사진 지정 모달 — 빈 구획
- G034 2898~2906(9줄) [#TASK-ES-181 & #TASK-ES-182] 폰 잠금화면에서 바로 보기 통합 허브 모달 — 빈 구획
- G035 2907~2911(5줄) Adaptive UX Mode — 빈 구획
- G036 2912~2921(10줄) Social Crew Pacing (#TASK-ES-228) — 빈 구획 · 로드 중 문 1
- G037 2922~2928(7줄) [#TASK-ES-264] 오늘의 미션 및 AI 피드백 조건부 호출 최적화 — 빈 구획
- G038 2929~2931(3줄) 목표 탭 3계층 일정설정 / 디데이·기간 표시 및 캘린더 연동 (#TASK-ES-259, 메모장 03항, #TASK-ES-135) — 빈 구획
- G039 2932~2934(3줄) [#TASK-ES-220] [생각 메모장 91번] 교대근무자 가변형 루틴 프리셋 & 자동 스케줄러 — 빈 구획
- G040 2935~2938(4줄) [#TASK-ES-172] [27] 목표 탭: 데일리 루틴 서브탭 & 편집/상세 모달 — 빈 구획
- G043 2953~2959(7줄) TASK-ES-307: 측정지표 다중 선택 및 동시 렌더링 엔진 — 빈 구획
- G044 2960~2973(14줄) 5대 테마 원형 라이프 밸런스 휠 (SVG Pie Chart) — 빈 구획
- G045 2974~2981(8줄) ⏱️ 인앱 인터벌 타이머 & 스톱워치 위젯 (In-Table Stopwatch) — 빈 구획
- G047 3935~3935(1줄) RFC 5545 표준 iCalendar (.ics) 생성 순수 함수 (TASK-BG-11) — 빈 구획
- G049 4110~4112(3줄) 크리에이터 템플릿 (#TASK-ES-315, 64: 구형 창 영구 제거 및 무해화) — 빈 구획
- G051 4119~4128(10줄) 전역 공유 팀 로더 & 렌더링 (#TASK-ES-133) — 빈 구획 · 로드 중 문 3
- G052 4129~4135(7줄) KF-2 #TASK-ES-017: 템플릿 복제 크레딧 모듈(js/template-credit.js)에 앱 핸들 연결 — 빈 구획 · 로드 중 문 2
