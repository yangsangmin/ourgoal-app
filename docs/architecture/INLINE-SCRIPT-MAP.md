# index.html 인라인 스크립트 책임 묶음 지도

> 생성: `NODE_PATH=<node_modules> node scripts/inline-script-map.js --write` (#TASK-ES-423). **손으로 고치지 않는다** — 다시 만들면 같은 입력에서 같은 글자가 나온다(결정적).
> 출처: `index.html` sha256 앞 12자 `076faf1cbbc7` · 큰 인라인 IIFE 2254~5443줄(3190줄) · 다른 인라인 블록 4줄(8줄), 5446줄(16줄).

## 1. 요약

- 묶음 122개(이음매 8 · 옮길 대상 50 · 빈 구획 64). 묶음 = IIFE 최상위 구획 주석 `/* ============ 제목 ============ */` 에서 다음 구획 주석 앞까지.
- 최상위 함수 8 · 최상위 변수 311 · window 전역 대입 85줄(module-metrics ③ 의 index.html 몫과 같은 정규식) · addEventListener 44 · on<이벤트> 대입 44 · 로드 중 바로 도는 최상위 문 229 · 인라인 on*="…" 처리기가 부르는 IIFE 이름 15개.
- 난이도 묶음 수(줄): 쉬움 23(213줄) · 보통 16(227줄) · 어려움 11(1923줄) · 빈 구획 64(696줄) · 이음매(옮기지 않음) 8(131줄).

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
| G099 | 템플릿 마켓 · 복제 · 전문 템플릿 기록 (TASK-ES-013) | 1181 | 3 | 어려움(106) | 0/1/50 | 1 | 1 | 37(17) |
| G010 | [#TASK-ES-432] 인라인 스크립트 세포화 2차 이음매 (docs/architecture/INLINE-SCRIPT-MA | 351 | 0 | 어려움(293) | 24/0/63 | 22 | 0 | 75(30) |
| G103 | 캘린더 실시간 구독 URL 생성기 (WebCal Feed & #TASK-ES-252 HMAC 서명) | 176 | 1 | 어려움(30) | 0/0/2 | 2 | 2 | 7(5) |
| G095 | [#TASK-ES-299] 팀 목표 댓글 작성 및 전송 직통 헬퍼 & 전역 이벤트 위임 (먹통 방어 100%) | 92 | 0 | 빈 구획(31) | 0/2/11 | 3 | 0 | 6(2) |
| G068 | 음성 체크인 (Web Speech API) | 71 | 0 | 빈 구획(7) | 0/0/2 | 1 | 0 | 2(1) |
| G088 | [UI/UX 틀 개편 Phase 4] 목표 탭 노션급 데이터 관리 & 인지순행 IA (#TASK-UIUX-PHASE4-GOAL | 57 | 2 | 어려움(58) | 0/1/6 | 4 | 0 | 17(11) |
| G058 | [#TASK-ES-153] 전역 7일 유예 통합 휴지통 (Recycle Bin) 시스템 | 45 | 1 | 어려움(30) | 0/1/7 | 1 | 1 | 3(1) |
| G121 | PWA: Service Worker 등록 및 자동 업데이트 감지 (#TASK-ES-118) | 39 | 0 | 빈 구획(218) | 0/0/8 | 6 | 0 | 4(1) |
| G001 | [#TASK-ES-354 CORE-07] 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL.md) | 38 | 0 | 이음매(옮기지 않음)(34) | 1/0/13 | 1 | 0 | 11(5) |
| G069 | 사진 인증 & 뷰어 모달 (가상유저 요청 P1) | 38 | 0 | 보통(16) | 0/0/2 | 4 | 0 | 3(2) |

## 3. 권장 순서 (안전한 것부터, 상위 30)

같은 점수면 큰 묶음 먼저(한 번 옮겨 많이 줄인다). 로드 중 문이 있는 묶음은 함수만 옮기고 그 문은 원래 자리에 남긴다(MODULE-SPLIT-PROTOCOL 3절).

| 순서 | 묶음 | 제목 | 줄 | 점수 | 근거(점수가 생긴 곳) |
|--:|---|---|--:|--:|---|
| 1 | G065 | 1순위 대표 목표 AI 초집중 모드 (Focus Auto-Pilot) | 9 | 0 | 없음 |
| 2 | G029 | [78 / 89] 데이터분석 프롬프트 백과사전 (실사용 유저 등록·피드 게시 및 도움돼요 상호작용) | 7 | 0 | 없음 |
| 3 | G108 | 마니또 실 유저 익명 응원 연동 (#TASK-ES-133, #TASK-ES-145) | 7 | 0 | 없음 |
| 4 | G105 | 소통 피드 (Supabase feed_posts, 실시간 동기화) | 6 | 0 | 없음 |
| 5 | G112 | [#TASK-ES-264] 자정(00:00 KST / 현지 표준시) 날짜 변경 감지 및 자동 동기화 워처 | 5 | 0 | 없음 |
| 6 | G086 | RENDER: TEMPLATE ENCYCLOPEDIA SUBTAB (#TASK-ES-187) | 3 | 0 | 없음 |
| 7 | G012 | [#TASK-ES-446] 인라인 스크립트 세포화 P2-1 이음매 (docs/architecture/INLI | 9 | 1 | 상태 읽기 1 |
| 8 | G071 | [#TASK-ES-225] [생각 메모장 95번] Gemini API 분당 쿼터(Rate Limit 429) | 9 | 1 | 상태 읽기 1 |
| 9 | G113 | 세션 복구 및 안전 앱 진입 유틸 | 4 | 3 | 상태 읽기 1 · 로드 중 문 1 |
| 10 | G017 | 아워골 앱 환경설정 | 22 | 4 | 로드 중 문 1 · window 1 · 바깥 파일 1 |
| 11 | G008 | [#TASK-ES-444] 인라인 스크립트 세포화 P1 이음매 2 — 일정 배경·잠금화면 라이브, 소통 창· | 13 | 4 | 상태 읽기 4 |
| 12 | G005 | [#TASK-ES-453] 인라인 스크립트 세포화 P1 이음매 3 — 목표 종합상황 AI 요약 새로 고침 ( | 5 | 4 | 상태 읽기 1 · 시험지(index 단독) 1 |
| 13 | G093 | RENDER: 팀 목표 (팀장·매니저만 추가/수정/삭제, 팀원은 보기만) | 29 | 5 | 상태 읽기 4 · 들어옴 1 |
| 14 | G043 | P0: 비밀번호 찾기 (이메일 재설정 링크 발송) | 10 | 5 | 상태 읽기 1 · 로드 중 문 2 |
| 15 | G106 | 전역 공유 팀 로더 & 렌더링 (#TASK-ES-133) | 9 | 5 | 로드 중 문 1 · window 1 · 바깥 파일 2 |
| 16 | G107 | 통합 딥링크 게이트웨이 & 게스트 소프트 뷰어 3종 (js/viral-sharing.js 위임) | 9 | 5 | 상태 읽기 1 · 로드 중 문 1 · window 1 · 바깥 파일 1 |
| 17 | G046 | [#TASK-ES-160, #TASK-ES-166, #TASK-ES-180] 각 탭 200% 활용법 및 실제 | 6 | 5 | 상태 읽기 1 · 로드 중 문 2 |
| 18 | G047 | 앱 활용 가이드 다시보기 | 4 | 5 | 상태 읽기 1 · 로드 중 문 2 |
| 19 | G016 | Supabase | 9 | 6 | 상태 읽기 1 · 로드 중 문 1 · 시험지(index 단독) 1 |
| 20 | G066 | 원터치 퀵 루틴 칩 | 11 | 7 | 로드 중 문 2 · 시험지(index 단독) 1 |
| 21 | G011 | [#TASK-ES-436] 인라인 스크립트 세포화 P1 이음매 1 — 목표 AI·일정 설정, 기록 AI 피드 | 11 | 8 | 상태 읽기 2 · 시험지(index 단독) 2 |
| 22 | G042 | Goal category templates | 11 | 8 | 상태 읽기 2 · 로드 중 문 3 |
| 23 | G048 | 1:1 고객 문의 / 버그 제보 (#TASK-ES-178) | 5 | 8 | 상태 읽기 2 · 로드 중 문 3 |
| 24 | G039 | 소셜 로그인 (카카오 / 실제 구글 OAuth 연동) | 11 | 9 | 상태 읽기 2 · 로드 중 문 2 · 시험지(index 단독) 1 |
| 25 | G014 | [#TASK-ES-437] 인라인 스크립트 세포화 P0 이음매 (docs/architecture/INLINE | 12 | 10 | 상태 대입 1 · 상태 읽기 4 · 로드 중 문 1 |
| 26 | G087 | [#TASK-ES-189] 템플릿 백과사전 3대 분류(개인·루틴·팀) 및 AI/실유저 2원화 이식 시스템 | 9 | 10 | 로드 중 문 2 · window 2 · 바깥 파일 1 · 시험지(index 단독) 1 |
| 27 | G052 | 최초 로그인 활용가이드 — 4대 탭 무블러(Zero Blur) 투명 라이브 프리뷰 융합 | 8 | 10 | 상태 읽기 1 · 로드 중 문 3 · window 1 · 바깥 파일 2 |
| 28 | G037 | 2계정 상호작용 테스트 (테스터 B 직통 입장: #TASK-ES-169) | 7 | 10 | 상태 읽기 2 · 로드 중 문 4 |
| 29 | G025 | #TASK-ES-165: 앱 진입 아바타 인사 팝업 (화면 절반 크기 & 시간대별 멘트) | 8 | 11 | 상태 읽기 2 · 로드 중 문 2 · window 2 · 바깥 파일 3 |
| 30 | G044 | P0: 회원 탈퇴 30일 유예(소프트 삭제) 복구 체크 | 8 | 14 | 상태 읽기 4 · 로드 중 문 5 |

## 4. 전체 묶음 표

| 묶음 | 줄 범위 | 줄 | 제목 | 함수 | 변수 | 난이도(점수) | 상태 쓰기 · 변경 · 읽기 | window | 처리기(add/on) | 로드 중 문 | 인라인 처리기 | 들어옴/나감 묶음 | 바깥 파일 | 시험지(index 단독) |
|---|---|--:|---|--:|--:|---|---|--:|---|--:|--:|---|--:|---|
| G000 | 2254~2256 | 3 | (IIFE 머리 — "use strict" 와 첫 구획 앞) | 0 | 0 | 빈 구획(66) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 66(22) |
| G001 | 2257~2294 | 38 | [#TASK-ES-354 CORE-07] 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTO | 0 | 16 | 이음매(옮기지 않음)(34) | 1 · 0 · 13 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 11(5) |
| G002 | 2295~2311 | 17 | [#TASK-ES-358] 기록 탭 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL | 0 | 2 | 이음매(옮기지 않음)(49) | 1 · 0 · 7 | 0 | 0/0 | 1 | 0 | 0/1 | 0 | 48(12) |
| G003 | 2312~2330 | 19 | [#TASK-ES-360] 일정 탭 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL | 0 | 3 | 이음매(옮기지 않음)(21) | 0 · 0 · 10 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 9(3) |
| G004 | 2331~2352 | 22 | [#TASK-ES-370] 목표 탭 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL | 0 | 2 | 이음매(옮기지 않음)(52) | 0 · 0 · 14 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 45(12) |
| G005 | 2353~2357 | 5 | [#TASK-ES-453] 인라인 스크립트 세포화 P1 이음매 3 — 목표 종합상황 AI 요약 새로 고침 ( | 0 | 1 | 쉬움(4) | 0 · 0 · 1 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 3(1) |
| G006 | 2358~2361 | 4 | [#TASK-ES-375] 목표 탭 모듈 이음매 2차 (docs/specs/MODULE-SPLIT-PROTO | 0 | 0 | 이음매(옮기지 않음)(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G007 | 2362~2371 | 10 | [#TASK-ES-379] 소통 탭 모듈 이음매 1차 (docs/specs/MODULE-SPLIT-PROTO | 0 | 2 | 이음매(옮기지 않음)(7) | 0 · 0 · 2 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 6(1) |
| G008 | 2372~2384 | 13 | [#TASK-ES-444] 인라인 스크립트 세포화 P1 이음매 2 — 일정 배경·잠금화면 라이브, 소통 창· | 0 | 9 | 쉬움(4) | 0 · 0 · 4 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 5(0) |
| G009 | 2385~2391 | 7 | [#TASK-ES-423] 인라인 스크립트 세포화 1차 이음매 (docs/architecture/INLINE | 0 | 3 | 이음매(옮기지 않음)(1) | 0 · 0 · 1 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 3(0) |
| G010 | 2392~2742 | 351 | [#TASK-ES-432] 인라인 스크립트 세포화 2차 이음매 (docs/architecture/INLINE | 0 | 167 | 어려움(293) | 24 · 0 · 63 | 0 | 0/0 | 22 | 0 | 0/3 | 0 | 75(30) |
| G011 | 2743~2753 | 11 | [#TASK-ES-436] 인라인 스크립트 세포화 P1 이음매 1 — 목표 AI·일정 설정, 기록 AI 피드 | 0 | 7 | 쉬움(8) | 0 · 0 · 2 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 4(2) |
| G012 | 2754~2762 | 9 | [#TASK-ES-446] 인라인 스크립트 세포화 P2-1 이음매 (docs/architecture/INLI | 0 | 5 | 쉬움(1) | 0 · 0 · 1 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G013 | 2763~2786 | 24 | [#TASK-ES-448] 인라인 스크립트 세포화 P2-2 이음매 (docs/architecture/INLI | 0 | 8 | 보통(20) | 1 · 0 · 6 | 0 | 0/0 | 2 | 0 | 0/0 | 0 | 8(2) |
| G014 | 2787~2798 | 12 | [#TASK-ES-437] 인라인 스크립트 세포화 P0 이음매 (docs/architecture/INLINE | 0 | 3 | 보통(10) | 1 · 0 · 4 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 1(0) |
| G015 | 2799~2809 | 11 | [#TASK-ES-442] 인라인 스크립트 세포화 P0 이음매 (docs/architecture/INLINE | 0 | 2 | 보통(15) | 2 · 0 · 5 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 4(0) |
| G016 | 2810~2818 | 9 | Supabase | 0 | 4 | 쉬움(6) | 0 · 0 · 1 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 3(1) |
| G017 | 2819~2840 | 22 | 아워골 앱 환경설정 | 0 | 1 | 쉬움(4) | 0 · 0 · 0 | 1 | 0/0 | 1 | 0 | 0/0 | 1 | 1(0) |
| G018 | 2841~2848 | 8 | [#TASK-ES-264] 표준 시간대(한국 KST 00:00, 타 국가는 해당 국가 표준시 00:00) 기 | 0 | 0 | 빈 구획(11) | 0 · 0 · 2 | 2 | 0/0 | 1 | 0 | 0/0 | 5 | 2(0) |
| G019 | 2849~2859 | 11 | Confetti | 0 | 1 | 어려움(36) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 29 | 2(1) |
| G020 | 2860~2874 | 15 | 8대 화면 스타일 (테마) 정의 | 0 | 1 | 보통(17) | 0 · 0 · 0 | 1 | 0/0 | 1 | 0 | 0/0 | 2 | 10(4) |
| G021 | 2875~2877 | 3 | 가상유저 개선 10대 핵심 헬퍼 함수 | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G022 | 2878~2885 | 8 | [#TASK-ES-345 CAL-02] 구글 캘린더 토큰·일정 캐시 계정 격리 | 0 | 0 | 빈 구획(3) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 2(1) |
| G023 | 2886~2895 | 10 | XP/레벨 시스템 | 0 | 0 | 빈 구획(47) | 0 · 0 · 6 | 6 | 0/0 | 6 | 0 | 0/0 | 20 | 2(1) |
| G024 | 2896~2915 | 20 | [#TASK-ES-150] 아바타 레벨업 대형 팝업 & 성장 성향 키워드 | 0 | 6 | 어려움(32) | 0 · 0 · 5 | 0 | 2/0 | 12 | 0 | 0/0 | 0 | 3(1) |
| G025 | 2916~2923 | 8 | #TASK-ES-165: 앱 진입 아바타 인사 팝업 (화면 절반 크기 & 시간대별 멘트) | 0 | 1 | 보통(11) | 0 · 0 · 2 | 2 | 0/0 | 2 | 0 | 0/0 | 3 | 1(0) |
| G026 | 2924~2935 | 12 | 뱃지 컬렉션 (명예의 전당) | 0 | 1 | 어려움(266) | 0 · 0 · 2 | 1 | 0/0 | 2 | 0 | 0/0 | 253 | 5(2) |
| G027 | 2936~2938 | 3 | [70] 다른 모든 기기 원격 로그아웃 전 로그인 기기 목록 확인 모달 | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G028 | 2939~2946 | 8 | [71] 앱 잠금 PIN (이 기기) — 설정·해제·앱 진입 확인 | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G029 | 2947~2953 | 7 | [78 / 89] 데이터분석 프롬프트 백과사전 (실사용 유저 등록·피드 게시 및 도움돼요 상호작용) | 0 | 2 | 쉬움(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 2(0) |
| G030 | 2954~2957 | 4 | [80] 템플릿백과사전 1초 자동이식 선택 연동 및 로드맵-목표상태 동기화 | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G031 | 2958~2960 | 3 | [82] 팀 목표 내 '팀 연계 개인목표' 생성 모달 | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G032 | 2961~2964 | 4 | [83] 팀원 초대 시 '아워골 동반자 초대하기' 인앱 초대·참가 기능 | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G033 | 2965~2967 | 3 | [88] 오늘의 3초 체크인 목표 버튼 선택 시 플레이스홀더(백그라운드 가이드) 예시 문구 렌더링 | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G034 | 2968~2977 | 10 | [#TASK-UIUX-PHASE3-HOME-COCKPIT] 홈 1초 조망 ↔ 무저항 체크인 콕핏 8대 과업 | 0 | 0 | 빈 구획(150) | 0 · 0 · 2 | 3 | 0/0 | 2 | 0 | 0/0 | 141 | 0(0) |
| G035 | 2978~2978 | 1 | Landing | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G036 | 2979~2988 | 10 | [#TASK-ES-222] [생각 메모장 92번] 카카오톡 인앱 브라우저 감지 및 Android Chrome | 0 | 2 | 보통(16) | 0 · 0 · 4 | 0 | 0/0 | 6 | 0 | 0/0 | 0 | 1(0) |
| G037 | 2989~2995 | 7 | 2계정 상호작용 테스트 (테스터 B 직통 입장: #TASK-ES-169) | 0 | 2 | 보통(10) | 0 · 0 · 2 | 0 | 0/0 | 4 | 0 | 0/0 | 0 | 1(0) |
| G038 | 2996~3003 | 8 | [#TASK-ES-223] [생각 메모장 93번] 개발 디버그 버튼 프로덕션 완전 소거 및 로컬/디버그 격리 | 0 | 0 | 빈 구획(6) | 0 · 0 · 1 | 0 | 1/0 | 1 | 0 | 0/0 | 0 | 1(1) |
| G039 | 3004~3014 | 11 | 소셜 로그인 (카카오 / 실제 구글 OAuth 연동) | 0 | 2 | 보통(9) | 0 · 0 · 2 | 0 | 0/0 | 2 | 0 | 0/0 | 0 | 1(1) |
| G040 | 3015~3017 | 3 | [#TASK-ES-224] [생각 메모장 94번] 게스트(둘러보기) 3회 기록 시 안전 백업 넛지 및 카카오 | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G041 | 3018~3020 | 3 | [#TASK-ES-224] [생각 메모장 94번] 카카오/소셜/일반 로그인 시 게스트 데이터 100% 무손실 | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G042 | 3021~3031 | 11 | Goal category templates | 0 | 1 | 쉬움(8) | 0 · 0 · 2 | 0 | 0/0 | 3 | 0 | 0/0 | 0 | 2(0) |
| G043 | 3032~3041 | 10 | P0: 비밀번호 찾기 (이메일 재설정 링크 발송) | 0 | 1 | 쉬움(5) | 0 · 0 · 1 | 0 | 1/0 | 2 | 0 | 0/0 | 0 | 1(0) |
| G044 | 3042~3049 | 8 | P0: 회원 탈퇴 30일 유예(소프트 삭제) 복구 체크 | 0 | 1 | 보통(14) | 0 · 0 · 4 | 0 | 0/0 | 5 | 0 | 0/0 | 0 | 1(0) |
| G045 | 3050~3053 | 4 | 회원 탈퇴 전용 안내 모달 및 법적책임·데이터분실 사전 안내 (#TASK-ES-158) | 0 | 0 | 빈 구획(6) | 0 · 0 · 1 | 0 | 1/0 | 1 | 0 | 0/0 | 0 | 2(1) |
| G046 | 3054~3059 | 6 | [#TASK-ES-160, #TASK-ES-166, #TASK-ES-180] 각 탭 200% 활용법 및 실제 | 0 | 1 | 쉬움(5) | 0 · 0 · 1 | 0 | 0/0 | 2 | 0 | 0/0 | 0 | 1(0) |
| G047 | 3060~3063 | 4 | 앱 활용 가이드 다시보기 | 0 | 1 | 쉬움(5) | 0 · 0 · 1 | 0 | 0/0 | 2 | 0 | 0/0 | 0 | 1(0) |
| G048 | 3064~3068 | 5 | 1:1 고객 문의 / 버그 제보 (#TASK-ES-178) | 0 | 1 | 쉬움(8) | 0 · 0 · 2 | 0 | 0/0 | 3 | 0 | 0/0 | 0 | 0(0) |
| G049 | 3069~3088 | 20 | 이용약관 / 개인정보처리방침 열람 리스너 | 0 | 0 | 빈 구획(23) | 0 · 0 · 7 | 0 | 2/0 | 8 | 0 | 0/0 | 0 | 1(0) |
| G050 | 3089~3091 | 3 | Onboarding (first-time, after signup) — 16종 동물 아바타 & 직관적 안착  | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G051 | 3092~3098 | 7 | 3단계: 첫 체크인 튜토리얼 가이드 및 축하 연출 | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G052 | 3099~3106 | 8 | 최초 로그인 활용가이드 — 4대 탭 무블러(Zero Blur) 투명 라이브 프리뷰 융합 | 0 | 2 | 보통(10) | 0 · 0 · 1 | 1 | 0/0 | 3 | 0 | 0/0 | 2 | 2(0) |
| G053 | 3107~3114 | 8 | 조선소 블록 레지스트리 6대 메가블록 초기화 (헌법 제3조 제9항) | 0 | 0 | 빈 구획(65) | 0 · 0 · 3 | 2 | 0/0 | 3 | 0 | 0/0 | 54 | 0(0) |
| G054 | 3115~3125 | 11 | Modal helper & Android Hardware Back Handler | 0 | 2 | 어려움(146) | 0 · 0 · 2 | 1 | 0/0 | 2 | 0 | 0/0 | 136 | 2(1) |
| G055 | 3126~3145 | 20 | 이용약관 & 개인정보처리방침 모달 | 0 | 0 | 빈 구획(5) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 1 | 1(0) |
| G056 | 3146~3153 | 8 | 프로필 | 0 | 0 | 빈 구획(3) | 0 · 0 · 1 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 2(0) |
| G057 | 3154~3154 | 1 | 구글 캘린더 연동 | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G058 | 3155~3199 | 45 | [#TASK-ES-153] 전역 7일 유예 통합 휴지통 (Recycle Bin) 시스템 | 1 | 1 | 어려움(30) | 0 · 1 · 7 | 5 | 0/0 | 1 | 0 | 1/0 | 10 | 3(1) |
| G059 | 3200~3220 | 21 | [#TASK-ES-153 & #TASK-ES-155] 캘린더 일자별 배경 사진 지정 모달 | 0 | 0 | 빈 구획(16) | 0 · 0 · 2 | 2 | 0/0 | 2 | 0 | 0/0 | 8 | 1(0) |
| G060 | 3221~3243 | 23 | [#TASK-ES-181 & #TASK-ES-182] 폰 잠금화면에서 바로 보기 통합 허브 모달 | 0 | 0 | 빈 구획(75) | 0 · 0 · 12 | 12 | 0/0 | 1 | 0 | 0/0 | 49 | 2(0) |
| G061 | 3244~3248 | 5 | Adaptive UX Mode | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G062 | 3249~3251 | 3 | Social Crew Pacing (#TASK-ES-228) | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G063 | 3252~3257 | 6 | UX Telemetry (Hesitation & Rage Tap) | 0 | 0 | 빈 구획(3) | 0 · 0 · 1 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 0(0) |
| G064 | 3258~3274 | 17 | iOS 사파리 홈 화면 추가 안내 배너 & 실시간 알림 가이드 (#TASK-ES-234) | 0 | 0 | 빈 구획(5) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 1 | 2(0) |
| G065 | 3275~3283 | 9 | 1순위 대표 목표 AI 초집중 모드 (Focus Auto-Pilot) | 0 | 3 | 쉬움(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 2(0) |
| G066 | 3284~3294 | 11 | 원터치 퀵 루틴 칩 | 0 | 1 | 쉬움(7) | 0 · 0 · 0 | 0 | 1/0 | 2 | 0 | 0/0 | 0 | 2(1) |
| G067 | 3295~3298 | 4 | 🎙️ 마이크 권한 거부 상태 자가 진단 및 1초 권한 허용 모달 (#TASK-ES-227) | 0 | 0 | 빈 구획(6) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 2 | 1(0) |
| G068 | 3299~3369 | 71 | 음성 체크인 (Web Speech API) | 0 | 0 | 빈 구획(7) | 0 · 0 · 2 | 0 | 6/0 | 1 | 0 | 0/0 | 0 | 2(1) |
| G069 | 3370~3407 | 38 | 사진 인증 & 뷰어 모달 (가상유저 요청 P1) | 0 | 4 | 보통(16) | 0 · 0 · 2 | 0 | 2/2 | 4 | 0 | 0/0 | 0 | 3(2) |
| G070 | 3408~3420 | 13 | 체크인 입력 글자수 힌트 (#TASK-ES-367: 열 수 없던 활동 테마 선택 창·배지 제거, 승인 202 | 0 | 3 | 보통(15) | 0 · 0 · 2 | 0 | 0/0 | 5 | 0 | 0/0 | 0 | 3(1) |
| G071 | 3421~3429 | 9 | [#TASK-ES-225] [생각 메모장 95번] Gemini API 분당 쿼터(Rate Limit 429) | 0 | 1 | 쉬움(1) | 0 · 0 · 1 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G072 | 3430~3440 | 11 | 맞춤 피드백 봇 설정 | 0 | 0 | 빈 구획(16) | 0 · 0 · 3 | 1 | 3/0 | 4 | 0 | 0/0 | 1 | 2(1) |
| G073 | 3441~3444 | 4 | 목표 & 기록 선택 피드 공유 모달 (전면 고도화) | 0 | 0 | 빈 구획(8) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 4 | 1(0) |
| G074 | 3445~3450 | 6 | [#TASK-ES-301] 피드 게시 모달 내 '미리보기' 토글 직통 헬퍼 | 0 | 0 | 빈 구획(7) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 3 | 1(0) |
| G075 | 3451~3457 | 7 | 외부 데이터 불러오기 (mock) | 0 | 2 | 보통(16) | 0 · 0 · 3 | 0 | 1/0 | 5 | 0 | 0/0 | 0 | 2(1) |
| G076 | 3458~3488 | 31 | [#TASK-ES-174] 목표 템플릿 백과사전 전체화면 팝업 및 상호작용 | 0 | 7 | 어려움(38) | 0 · 0 · 7 | 2 | 3/0 | 13 | 0 | 0/0 | 3 | 3(0) |
| G077 | 3489~3516 | 28 | [#TASK-ES-146] 아워골 평가해주기 90% 팝업 | 0 | 5 | 어려움(34) | 0 · 0 · 7 | 0 | 3/1 | 12 | 0 | 0/0 | 0 | 4(1) |
| G078 | 3517~3526 | 10 | New goal modal | 0 | 0 | 빈 구획(11) | 0 · 0 · 2 | 1 | 0/0 | 2 | 0 | 0/0 | 4 | 2(0) |
| G079 | 3527~3527 | 1 | 참고자료 (유튜브/영상, 이미지, 텍스트 메모, 웹링크) | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G080 | 3528~3536 | 9 | 참고자료 (유튜브/영상, 이미지, 텍스트 메모, 웹링크) | 0 | 0 | 빈 구획(21) | 0 · 0 · 4 | 4 | 0/0 | 1 | 0 | 0/0 | 5 | 3(2) |
| G081 | 3537~3568 | 32 | 목표 AI 생성 전체 템플릿 양식 및 세부 항목 미리보기 (Req 5) | 0 | 1 | 보통(18) | 0 · 0 · 3 | 0 | 3/0 | 6 | 0 | 0/0 | 0 | 2(1) |
| G082 | 3569~3578 | 10 | [#TASK-ES-264] 오늘의 미션 및 AI 피드백 조건부 호출 최적화 | 0 | 0 | 빈 구획(8) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 1 | 3(1) |
| G083 | 3579~3588 | 10 | 목표 탭 3계층 일정설정 / 디데이·기간 표시 및 캘린더 연동 (#TASK-ES-259, 메모장 03항, # | 0 | 0 | 빈 구획(22) | 0 · 0 · 5 | 5 | 0/0 | 1 | 0 | 0/0 | 7 | 2(1) |
| G084 | 3589~3591 | 3 | [#TASK-ES-220] [생각 메모장 91번] 교대근무자 가변형 루틴 프리셋 & 자동 스케줄러 | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G085 | 3592~3595 | 4 | [#TASK-ES-172] [27] 목표 탭: 데일리 루틴 서브탭 & 편집/상세 모달 | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G086 | 3596~3598 | 3 | RENDER: TEMPLATE ENCYCLOPEDIA SUBTAB (#TASK-ES-187) | 0 | 2 | 쉬움(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G087 | 3599~3607 | 9 | [#TASK-ES-189] 템플릿 백과사전 3대 분류(개인·루틴·팀) 및 AI/실유저 2원화 이식 시스템 | 0 | 4 | 보통(10) | 0 · 0 · 0 | 2 | 0/0 | 2 | 0 | 0/0 | 1 | 4(1) |
| G088 | 3608~3664 | 57 | [UI/UX 틀 개편 Phase 4] 목표 탭 노션급 데이터 관리 & 인지순행 IA (#TASK-UIUX-P | 2 | 0 | 어려움(58) | 0 · 1 · 6 | 5 | 0/0 | 4 | 2 | 0/0 | 1 | 17(11) |
| G089 | 3665~3668 | 4 | [PHASE 5] #TASK-UIUX-PHASE5-RECORDS-CALENDAR FUNCTIONS | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G090 | 3669~3674 | 6 | [PHASE 6] #TASK-UIUX-PHASE6-COMM-SETTINGS FUNCTIONS | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G091 | 3675~3693 | 19 | [UI/UX 프레임워크 개편 Phase 7] 모바일 하드웨어 인터랙션 & 사용성 하드닝 | 0 | 0 | 빈 구획(6) | 0 · 0 · 1 | 0 | 1/0 | 1 | 0 | 0/0 | 0 | 1(1) |
| G092 | 3694~3696 | 3 | RENDER: GOALS | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G093 | 3697~3725 | 29 | RENDER: 팀 목표 (팀장·매니저만 추가/수정/삭제, 팀원은 보기만) | 1 | 2 | 쉬움(5) | 0 · 0 · 4 | 0 | 0/0 | 0 | 0 | 1/0 | 0 | 4(0) |
| G094 | 3726~3740 | 15 | 개인 목표 200% 활용 가이드 & 템플릿 백과사전 (#TASK-ES-135) | 0 | 0 | 빈 구획(37) | 0 · 0 · 3 | 3 | 0/0 | 3 | 0 | 0/0 | 16 | 4(3) |
| G095 | 3741~3832 | 92 | [#TASK-ES-299] 팀 목표 댓글 작성 및 전송 직통 헬퍼 & 전역 이벤트 위임 (먹통 방어 100% | 0 | 0 | 빈 구획(31) | 0 · 2 · 11 | 1 | 2/0 | 3 | 0 | 0/0 | 3 | 6(2) |
| G096 | 3833~3840 | 8 | TASK-ES-307: 측정지표 다중 선택 및 동시 렌더링 엔진 | 0 | 0 | 빈 구획(6) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 2 | 3(0) |
| G097 | 3841~3854 | 14 | 5대 테마 원형 라이프 밸런스 휠 (SVG Pie Chart) | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G098 | 3855~3865 | 11 | ⏱️ 인앱 인터벌 타이머 & 스톱워치 위젯 (In-Table Stopwatch) | 0 | 0 | 빈 구획(6) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 2 | 3(0) |
| G099 | 3866~5046 | 1181 | 템플릿 마켓 · 복제 · 전문 템플릿 기록 (TASK-ES-013) | 3 | 0 | 어려움(106) | 0 · 1 · 50 | 0 | 3/41 | 1 | 0 | 1/1 | 0 | 37(17) |
| G100 | 5047~5074 | 28 | [#TASK-ES-358] 기록 탭 렌더 → js/tabs/records/period-ai-card.js · | 0 | 0 | 빈 구획(12) | 0 · 1 · 6 | 1 | 0/0 | 1 | 0 | 0/0 | 1 | 6(0) |
| G101 | 5075~5088 | 14 | 위클리 리캡 카드 (스포티파이 랩드 스타일, 공유 캔버스 인프라 재사용) | 0 | 2 | 보통(25) | 0 · 0 · 7 | 0 | 3/0 | 9 | 0 | 0/0 | 0 | 1(0) |
| G102 | 5089~5089 | 1 | RFC 5545 표준 iCalendar (.ics) 생성 순수 함수 (TASK-BG-11) | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G103 | 5090~5265 | 176 | 캘린더 실시간 구독 URL 생성기 (WebCal Feed & #TASK-ES-252 HMAC 서명) | 1 | 2 | 어려움(30) | 0 · 0 · 2 | 1 | 1/0 | 2 | 0 | 2/0 | 6 | 7(5) |
| G104 | 5266~5269 | 4 | 크리에이터 템플릿 (#TASK-ES-315, 64: 구형 창 영구 제거 및 무해화) | 0 | 0 | 빈 구획(10) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 6 | 2(0) |
| G105 | 5270~5275 | 6 | 소통 피드 (Supabase feed_posts, 실시간 동기화) | 0 | 1 | 쉬움(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 3(0) |
| G106 | 5276~5284 | 9 | 전역 공유 팀 로더 & 렌더링 (#TASK-ES-133) | 0 | 1 | 쉬움(5) | 0 · 0 · 0 | 1 | 0/0 | 1 | 0 | 0/0 | 2 | 1(0) |
| G107 | 5285~5293 | 9 | 통합 딥링크 게이트웨이 & 게스트 소프트 뷰어 3종 (js/viral-sharing.js 위임) | 0 | 1 | 쉬움(5) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 1 | 1(0) |
| G108 | 5294~5300 | 7 | 마니또 실 유저 익명 응원 연동 (#TASK-ES-133, #TASK-ES-145) | 0 | 3 | 쉬움(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G109 | 5301~5313 | 13 | DM & 동반자 소통 시스템 (TASK-ES-105) | 0 | 0 | 빈 구획(16) | 0 · 0 · 3 | 2 | 0/0 | 3 | 0 | 0/0 | 5 | 1(0) |
| G110 | 5314~5327 | 14 | [#TASK-ES-354 CORE-07·SET-07] 설정 탭 렌더 → js/tabs/settings/ren | 0 | 0 | 이음매(옮기지 않음)(20) | 0 · 0 · 4 | 2 | 0/0 | 4 | 0 | 0/0 | 3 | 4(1) |
| G111 | 5328~5330 | 3 | 4대 연계 뷰 원자적 동시 전파 디스패처 (헌법 제1조 제4항 제5호 & 제15조 제6항 제3호) | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G112 | 5331~5335 | 5 | [#TASK-ES-264] 자정(00:00 KST / 현지 표준시) 날짜 변경 감지 및 자동 동기화 워처 | 0 | 1 | 쉬움(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 2(0) |
| G113 | 5336~5339 | 4 | 세션 복구 및 안전 앱 진입 유틸 | 0 | 1 | 쉬움(3) | 0 · 0 · 1 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 2(0) |
| G114 | 5340~5354 | 15 | #TASK-AUTH-P0-SAFETY: 로그인/계정 보안 패키지 모듈 연결 | 0 | 0 | 빈 구획(13) | 0 · 0 · 9 | 0 | 0/0 | 2 | 0 | 0/0 | 0 | 0(0) |
| G115 | 5355~5368 | 14 | KF-7 #TASK-ES-014: 반응 4종 모듈(js/reactions.js)에 앱 핸들 연결 | 0 | 0 | 빈 구획(16) | 0 · 0 · 11 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 6(1) |
| G116 | 5369~5373 | 5 | KF-4 #TASK-ES-018: 카테고리별 도움이 된 글 슬롯 모듈(js/top-helpful.js) | 0 | 0 | 빈 구획(3) | 0 · 0 · 1 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 1(0) |
| G117 | 5374~5382 | 9 | KF-5 #TASK-ES-016: 도움돼요 이유 모듈(js/helpful-reason.js)에 앱 핸들 연결 | 0 | 0 | 빈 구획(13) | 0 · 0 · 8 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 3(1) |
| G118 | 5383~5390 | 8 | #TASK-ES-105: 팀 초대 및 소통/DM/동반자 모듈(js/team-invite-comm.js) 연결 | 0 | 0 | 빈 구획(25) | 0 · 0 · 14 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 8(3) |
| G119 | 5391~5399 | 9 | #TASK-ES-105: 팀 연계 개인목표 및 상호 체크 모듈(js/team-linked-goals.js)  | 0 | 0 | 빈 구획(32) | 0 · 0 · 19 | 0 | 0/0 | 2 | 0 | 0/0 | 0 | 5(3) |
| G120 | 5400~5404 | 5 | KF-2 #TASK-ES-017: 템플릿 복제 크레딧 모듈(js/template-credit.js)에 앱 핸 | 0 | 0 | 빈 구획(5) | 0 · 0 · 3 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 1(0) |
| G121 | 5405~5443 | 39 | PWA: Service Worker 등록 및 자동 업데이트 감지 (#TASK-ES-118) | 0 | 0 | 빈 구획(218) | 0 · 0 · 8 | 4 | 5/0 | 6 | 0 | 0/0 | 191 | 4(1) |

## 5. 묶음별 의존 상세 (옮길 대상만, 권장 순서)

### G065 1순위 대표 목표 AI 초집중 모드 (Focus Auto-Pilot)

- 3275~3283줄(9줄) · 쉬움(0)
- 함수(0): 없음
- 변수(3): focusTimerInterval, focusTimerRunning, focusTimerSeconds
- 시험지 글자 의존: scripts/smoke-test.js, tests/trio-es143-es145.test.js

### G029 [78 / 89] 데이터분석 프롬프트 백과사전 (실사용 유저 등록·피드 게시 및 도움돼요 상호작용)

- 2947~2953줄(7줄) · 쉬움(0)
- 함수(0): 없음
- 변수(2): _promptEncyclopediaOpen, _promptTabState
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js

### G108 마니또 실 유저 익명 응원 연동 (#TASK-ES-133, #TASK-ES-145)

- 5294~5300줄(7줄) · 쉬움(0)
- 함수(0): 없음
- 변수(3): MANITO_SERVER_LOADED, REAL_MANITO_INBOX_CACHE, REAL_MANITO_PARTNERS_CACHE
- 시험지 글자 의존: scripts/smoke-test.js

### G105 소통 피드 (Supabase feed_posts, 실시간 동기화)

- 5270~5275줄(6줄) · 쉬움(0)
- 함수(0): 없음
- 변수(1): FEED_POSTS_CACHE
- 시험지 글자 의존: scripts/smoke-test.js, tests/core-confirm-es376.test.js, tests/guest-null-client-es377.test.js

### G112 [#TASK-ES-264] 자정(00:00 KST / 현지 표준시) 날짜 변경 감지 및 자동 동기화 워처

- 5331~5335줄(5줄) · 쉬움(0)
- 함수(0): 없음
- 변수(1): _lastObservedDateKey
- 시험지 글자 의존: scripts/smoke-test.js, tests/ai-conditional-call-optimization.test.js

### G086 RENDER: TEMPLATE ENCYCLOPEDIA SUBTAB (#TASK-ES-187)

- 3596~3598줄(3줄) · 쉬움(0)
- 함수(0): 없음
- 변수(2): _subtabTplCat, _subtabTplQuery

### G012 [#TASK-ES-446] 인라인 스크립트 세포화 P2-1 이음매 (docs/architecture/INLINE-SCRIPT-MAP.md 지도 · docs/spe

- 2754~2762줄(9줄) · 쉬움(1)
- 함수(0): 없음
- 변수(5): openProCoachReportModal, openProNotionExportModal, pushRecordToNotion, renderAnalyticsHtml, renderTrendSvgChart
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: _recordsKit
- 시험지 글자 의존: scripts/smoke-test.js

### G071 [#TASK-ES-225] [생각 메모장 95번] Gemini API 분당 쿼터(Rate Limit 429) 방어 및 지수 백오프 큐

- 3421~3429줄(9줄) · 쉬움(1)
- 함수(0): 없음
- 변수(1): requestClaudeFeedback
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: requestServerAIFeedback
- 시험지 글자 의존: scripts/smoke-test.js

### G113 세션 복구 및 안전 앱 진입 유틸

- 5336~5339줄(4줄) · 쉬움(3)
- 함수(0): 없음
- 변수(1): _isEnteringApp
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindLoginRescueButtons
- 로드 중 문 1: 호출 1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js

### G017 아워골 앱 환경설정

- 2819~2840줄(22줄) · 쉬움(4)
- 함수(0): 없음
- 변수(1): OURGOAL_CONFIG
- 로드 중 문 1: IfStatement 1
- window 노출(1줄): OURGOAL_CONFIG
- 바깥 js 가 window 이름을 씀: js/streaks.js
- 시험지 글자 의존: scripts/smoke-test.js

### G008 [#TASK-ES-444] 인라인 스크립트 세포화 P1 이음매 2 — 일정 배경·잠금화면 라이브, 소통 창·스토리 캔버스, 사진 인증, 목표 스타터·로컬 문장, 

- 2372~2384줄(13줄) · 쉬움(4)
- 함수(0): 없음
- 변수(9): buildLockScreenCardPayload, closeLockScreenLiveCard, compressImage, initKeyboardShield, openCalendarDayBgPickerModal, openIosPwaInstallGuideModal, openPhotoViewerModal, syncLockScreenLiveCard, toggleFeedPostPreview
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: _calendarKit, _commKit, _recordsKit, _settingsKit
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js, tests/account-switch-isolation.test.js, tests/direct-login-guard.test.js, tests/feed-post-preview-modal.test.js

### G005 [#TASK-ES-453] 인라인 스크립트 세포화 P1 이음매 3 — 목표 종합상황 AI 요약 새로 고침 (docs/architecture/INLINE-SCRIP

- 2353~2357줄(5줄) · 쉬움(4)
- 함수(0): 없음
- 변수(1): refreshGoalStatusSummary
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: _goalsKit
- 시험지 글자 의존: scripts/smoke-test.js, tests/ai-conditional-call-optimization.test.js, tests/goal-ai-advice-status.test.js (index.html 단독 읽기: tests/goal-ai-advice-status.test.js)

### G093 RENDER: 팀 목표 (팀장·매니저만 추가/수정/삭제, 팀원은 보기만)

- 3697~3725줄(29줄) · 쉬움(5)
- 함수(1): setupUserSessionRealtime
- 변수(2): REALTIME_CHANNELS_SETUP, USER_SESSION_CHANNEL
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: getDeviceId, performLogout, sb, state
- 부르는 묶음(들어옴): G010×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-shipyard-modular.js, tests/core-confirm-es376.test.js, tests/guest-null-client-es377.test.js

### G043 P0: 비밀번호 찾기 (이메일 재설정 링크 발송)

- 3032~3041줄(10줄) · 쉬움(5)
- 함수(0): 없음
- 변수(1): fpBtn
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: openForgotPasswordModal
- 로드 중 문 2: var 초기값 실행 1 · IfStatement 1
- 이벤트 처리기: addEventListener 1 · on<이벤트> 대입 0
- 시험지 글자 의존: scripts/smoke-test.js

### G106 전역 공유 팀 로더 & 렌더링 (#TASK-ES-133)

- 5276~5284줄(9줄) · 쉬움(5)
- 함수(0): 없음
- 변수(1): SHARED_GROUPS_LOADED
- 로드 중 문 1: IfStatement 1
- window 노출(1줄): SHARED_GROUPS_LOADED
- 바깥 js 가 window 이름을 씀: js/tabs/comm/shared-groups.js, js/tabs/goals/team-goals-screen.js
- 시험지 글자 의존: scripts/smoke-test.js

### G107 통합 딥링크 게이트웨이 & 게스트 소프트 뷰어 3종 (js/viral-sharing.js 위임)

- 5285~5293줄(9줄) · 쉬움(5)
- 함수(0): 없음
- 변수(1): checkAndHandlePeerInviteUrl
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: handleDeepLinkRouting
- 로드 중 문 1: IfStatement 1
- window 노출(1줄): MANITO_STAMP_COOLDOWN
- 바깥 js 가 window 이름을 씀: js/tabs/comm/manito-basics.js
- 시험지 글자 의존: scripts/smoke-test.js

### G046 [#TASK-ES-160, #TASK-ES-166, #TASK-ES-180] 각 탭 200% 활용법 및 실제 우수 사용사례 쇼케이스 (최신 기능 전면 동기화)

- 3054~3059줄(6줄) · 쉬움(5)
- 함수(0): 없음
- 변수(1): tabGuideBtn
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindTabGuideHubButton
- 로드 중 문 2: var 초기값 실행 1 · 호출 1
- 시험지 글자 의존: scripts/smoke-test.js

### G047 앱 활용 가이드 다시보기

- 3060~3063줄(4줄) · 쉬움(5)
- 함수(0): 없음
- 변수(1): guideBtn
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindRestartGuideButton
- 로드 중 문 2: var 초기값 실행 1 · 호출 1
- 시험지 글자 의존: scripts/smoke-test.js

### G016 Supabase

- 2810~2818줄(9줄) · 쉬움(6)
- 함수(0): 없음
- 변수(4): SUPABASE_ANON_KEY, SUPABASE_URL, _pendingAuthSession, sb
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindSupabaseAuthStateListener
- 로드 중 문 1: 호출 1
- 시험지 글자 의존: scripts/smoke-test.js, tests/logout-scope-es399.test.js, tests/security-audit.test.js (index.html 단독 읽기: tests/security-audit.test.js)

### G066 원터치 퀵 루틴 칩

- 3284~3294줄(11줄) · 쉬움(7)
- 함수(0): 없음
- 변수(1): qRoutineRow
- 로드 중 문 2: var 초기값 실행 1 · IfStatement 1
- 이벤트 처리기: addEventListener 1 · on<이벤트> 대입 0
- 시험지 글자 의존: scripts/smoke-test.js, tests/theme-system-v4.test.js (index.html 단독 읽기: tests/theme-system-v4.test.js)

### G011 [#TASK-ES-436] 인라인 스크립트 세포화 P1 이음매 1 — 목표 AI·일정 설정, 기록 AI 피드백 (docs/architecture/INLINE-SC

- 2743~2753줄(11줄) · 쉬움(8)
- 함수(0): 없음
- 변수(7): applyScheduleUpdate, computeGoalStatusHash, formatSchedulePillHtml, openScheduleSetupModal, requestAIFeedback, requestServerAIFeedback, sendGoalAgentMessage
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: _goalsKit, _recordsKit
- 시험지 글자 의존: scripts/smoke-test.js, tests/ai-conditional-call-optimization.test.js, tests/goal-ai-advice-status.test.js, tests/goals-schedule-sync.test.js (index.html 단독 읽기: tests/goal-ai-advice-status.test.js, tests/goals-schedule-sync.test.js)

### G042 Goal category templates

- 3021~3031줄(11줄) · 쉬움(8)
- 함수(0): 없음
- 변수(1): authTabButtons
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindAuthTabButtons, bindSignupSubmit
- 로드 중 문 3: var 초기값 실행 1 · 호출 2
- 시험지 글자 의존: scripts/smoke-test.js, tests/guest-null-client-es377.test.js

### G048 1:1 고객 문의 / 버그 제보 (#TASK-ES-178)

- 3064~3068줄(5줄) · 쉬움(8)
- 함수(0): 없음
- 변수(1): footEmailEl
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindInquiryButtons, bindSupportEmailLink
- 로드 중 문 3: 호출 2 · var 초기값 실행 1

### G039 소셜 로그인 (카카오 / 실제 구글 OAuth 연동)

- 3004~3014줄(11줄) · 보통(9)
- 함수(0): 없음
- 변수(2): _googleOneTapNonce, _googleTokenClient
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindGoogleLoginClicks, bindKakaoLoginClicks
- 로드 중 문 2: 호출 2
- 시험지 글자 의존: tests/google-session-guard.test.js (index.html 단독 읽기: tests/google-session-guard.test.js)

### G014 [#TASK-ES-437] 인라인 스크립트 세포화 P0 이음매 (docs/architecture/INLINE-SCRIPT-MAP.md 지도 · docs/specs

- 2787~2798줄(12줄) · 보통(10)
- 함수(0): 없음
- 변수(3): closeAvatarGreetingPopup, openAvatarGreetingPopup, showLegalModal
- 다른 묶음 상태 — 대입: __avatarGreetTimer · 변경: 없음 · 읽기: MOCK_GROUPS, __avatarGreetTimer, _settingsKit, startOAuthLogin
- 로드 중 문 1: 호출 1
- 시험지 글자 의존: scripts/smoke-test.js

### G087 [#TASK-ES-189] 템플릿 백과사전 3대 분류(개인·루틴·팀) 및 AI/실유저 2원화 이식 시스템

- 3599~3607줄(9줄) · 보통(10)
- 함수(0): 없음
- 변수(4): _subtabTplCat, _subtabTplDomain, _subtabTplQuery, _subtabTplType
- 로드 중 문 2: window 노출 2
- window 노출(2줄): _subtabTplDomain, _subtabTplType
- 바깥 js 가 window 이름을 씀: js/tabs/goals/template-encyclopedia.js
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-shipyard-modular.js, scripts/verify-integrity-gate.js, tests/routine-tab-scheduler.test.js (index.html 단독 읽기: tests/routine-tab-scheduler.test.js)

### G052 최초 로그인 활용가이드 — 4대 탭 무블러(Zero Blur) 투명 라이브 프리뷰 융합

- 3099~3106줄(8줄) · 보통(10)
- 함수(0): 없음
- 변수(2): navButtons, screens
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: startFirstLoginGuide
- 로드 중 문 3: window 노출 1 · var 초기값 실행 2
- window 노출(1줄): startFirstLoginGuide
- 바깥 js 가 window 이름을 씀: js/tabs/settings/first-login-guide.js, js/tabs/settings/guide-buttons.js
- 시험지 글자 의존: scripts/smoke-test.js, tests/hidden-entry-guard.test.js

### G037 2계정 상호작용 테스트 (테스터 B 직통 입장: #TASK-ES-169)

- 2989~2995줄(7줄) · 보통(10)
- 함수(0): 없음
- 변수(2): authTesterBBtn, landTesterBBtn
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindAuthTesterBButton, bindLandTesterBButton
- 로드 중 문 4: var 초기값 실행 2 · 호출 2
- 시험지 글자 의존: scripts/smoke-test.js

### G025 #TASK-ES-165: 앱 진입 아바타 인사 팝업 (화면 절반 크기 & 시간대별 멘트)

- 2916~2923줄(8줄) · 보통(11)
- 함수(0): 없음
- 변수(1): __avatarGreetTimer
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: closeAvatarGreetingPopup, openAvatarGreetingPopup
- 로드 중 문 2: window 노출 2
- window 노출(2줄): closeAvatarGreetingPopup, openAvatarGreetingPopup
- 바깥 js 가 window 이름을 씀: js/core/app-enter.js, js/tabs/settings/avatar-greeting.js, js/tabs/settings/sub-profile.js
- 시험지 글자 의존: scripts/smoke-test.js

### G044 P0: 회원 탈퇴 30일 유예(소프트 삭제) 복구 체크

- 3042~3049줄(8줄) · 보통(14)
- 함수(0): 없음
- 변수(1): resyncBtn
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindLoginSubmit, bindLogoutButton, bindResetButton, bindResyncAccountDataButton
- 로드 중 문 5: 호출 4 · var 초기값 실행 1
- 시험지 글자 의존: scripts/smoke-test.js

### G070 체크인 입력 글자수 힌트 (#TASK-ES-367: 열 수 없던 활동 테마 선택 창·배지 제거, 승인 2026-10-04)

- 3408~3420줄(13줄) · 보통(15)
- 함수(0): 없음
- 변수(3): capInput, liveCount, liveMeta
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindCaptureLiveMeta, bindCaptureSave
- 로드 중 문 5: var 초기값 실행 3 · 호출 2
- 시험지 글자 의존: scripts/smoke-test.js, tests/module-guard.test.js, tests/theme-system-v4.test.js (index.html 단독 읽기: tests/theme-system-v4.test.js)

### G015 [#TASK-ES-442] 인라인 스크립트 세포화 P0 이음매 (docs/architecture/INLINE-SCRIPT-MAP.md 지도 · docs/specs

- 2799~2809줄(11줄) · 보통(15)
- 함수(0): 없음
- 변수(2): initDevDebugButtons, toggleScheduleDone
- 다른 묶음 상태 — 대입: _promptEncyclopediaOpen, _promptTabState · 변경: 없음 · 읽기: USER_SESSION_CHANNEL, _calendarKit, _promptEncyclopediaOpen, _promptTabState, _settingsKit
- 로드 중 문 1: 호출 1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js, tests/dev-host-gate.test.js, tests/schedule-goal-sync.test.js

### G069 사진 인증 & 뷰어 모달 (가상유저 요청 P1)

- 3370~3407줄(38줄) · 보통(16)
- 함수(0): 없음
- 변수(4): capturePhotoBtn, capturePhotoInput, capturePhotoPreview, pendingCapturePhoto
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: compressImage, openPhotoViewerModal
- 로드 중 문 4: var 초기값 실행 3 · IfStatement 1
- 이벤트 처리기: addEventListener 2 · on<이벤트> 대입 2
- 시험지 글자 의존: scripts/smoke-test.js, tests/goals-schedule-sync.test.js, tests/today-mission-card-guide.test.js (index.html 단독 읽기: tests/goals-schedule-sync.test.js, tests/today-mission-card-guide.test.js)

### G036 [#TASK-ES-222] [생각 메모장 92번] 카카오톡 인앱 브라우저 감지 및 Android Chrome 자동 탈출 & iOS Safari 플로팅 가이드 배너

- 2979~2988줄(10줄) · 보통(16)
- 함수(0): 없음
- 변수(2): landGuestBtn, landNickQuickLink
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindLandGuestBtn, bindLandLoginLink, bindLandNickQuickLink, checkKakaoInAppBrowser
- 로드 중 문 6: 호출 4 · var 초기값 실행 2
- 시험지 글자 의존: scripts/smoke-test.js

### G075 외부 데이터 불러오기 (mock)

- 3451~3457줄(7줄) · 보통(16)
- 함수(0): 없음
- 변수(2): btnShowGuide, topBtnGuide
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindImportExternalBtn, bindPersonalGuideBtn, state
- 로드 중 문 5: 호출 2 · var 초기값 실행 2 · IfStatement 1
- 이벤트 처리기: addEventListener 1 · on<이벤트> 대입 0
- 시험지 글자 의존: scripts/smoke-test.js, tests/top-page-guide-reposition.test.js (index.html 단독 읽기: tests/top-page-guide-reposition.test.js)

### G020 8대 화면 스타일 (테마) 정의

- 2860~2874줄(15줄) · 보통(17)
- 함수(0): 없음
- 변수(1): THEMES
- 로드 중 문 1: IfStatement 1
- window 노출(1줄): THEMES
- 바깥 js 가 window 이름을 씀: js/tabs/settings/sub-appearance.js, js/tabs/settings/theme-apply.js
- 시험지 글자 의존: scripts/smoke-test.js, tests/account-switch-isolation.test.js, tests/comm-ai-identity-es348.test.js, tests/direct-login-guard.test.js, tests/dm-push-auth-es397.test.js, tests/feed-ai-bot-reduction.test.js, tests/google-session-guard.test.js, tests/hidden-entry-guard.test.js 외 2 (index.html 단독 읽기: tests/comm-ai-identity-es348.test.js, tests/google-session-guard.test.js, tests/team-goal-guide-hint.test.js, tests/theme-system-v4.test.js)

### G081 목표 AI 생성 전체 템플릿 양식 및 세부 항목 미리보기 (Req 5)

- 3537~3568줄(32줄) · 보통(18)
- 함수(0): 없음
- 변수(1): toggleAgentBtn
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindArchivedPageSetter, bindArchivedPeriodSetter, sendGoalAgentMessage
- 로드 중 문 6: var 초기값 실행 1 · IfStatement 1 · 호출 4
- 이벤트 처리기: addEventListener 3 · on<이벤트> 대입 0
- 시험지 글자 의존: scripts/smoke-test.js, tests/avatar-personas-split.test.js (index.html 단독 읽기: tests/avatar-personas-split.test.js)

### G013 [#TASK-ES-448] 인라인 스크립트 세포화 P2-2 이음매 (docs/architecture/INLINE-SCRIPT-MAP.md 지도 · docs/spe

- 2763~2786줄(24줄) · 보통(20)
- 함수(0): 없음
- 변수(8): MOCK_PEOPLE, daysFromNow, groupState, openCustomerInquiryModal, openItemReportModal, playTimerBeep, renderLapRowsHtml, renderStopwatchWidgetHtml
- 다른 묶음 상태 — 대입: FEED_POSTS_CACHE · 변경: 없음 · 읽기: FEED_POSTS_CACHE, MOCK_GROUPS, _commKit, _goalsKit, _recordsKit, _settingsKit
- 로드 중 문 2: 호출 1 · TryStatement 1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js, tests/core-confirm-es376.test.js, tests/hidden-entry-guard.test.js, tests/stopwatch-lap-inputs.test.js, tests/stopwatch-table-hint.test.js, tests/team-fold-state-es409.test.js, tests/theme-system-v4.test.js (index.html 단독 읽기: tests/team-fold-state-es409.test.js, tests/theme-system-v4.test.js)

### G101 위클리 리캡 카드 (스포티파이 랩드 스타일, 공유 캔버스 인프라 재사용)

- 5075~5088줄(14줄) · 보통(25)
- 함수(0): 없음
- 변수(2): btnOpenTt, staticPulseBar
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindRecCarouselPills, bindRecDocumentClick, bindRecPulseBar, bindRecTimeTrackerBtn, openRecordModal, openWeeklyRecapModal, renderRecordsScreen
- 로드 중 문 9: 호출 7 · var 초기값 실행 2
- 이벤트 처리기: addEventListener 3 · on<이벤트> 대입 0
- 시험지 글자 의존: scripts/smoke-test.js

### G103 캘린더 실시간 구독 URL 생성기 (WebCal Feed & #TASK-ES-252 HMAC 서명)

- 5090~5265줄(176줄) · 어려움(30)
- 함수(1): shareContent
- 변수(2): MOCK_GROUPS, _cachedSignedCalendarToken
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: daysFromNow, openExportThemeModal
- 로드 중 문 2: 호출 1 · window 노출 1
- window 노출(1줄): shareContent
- 이벤트 처리기: addEventListener 1 · on<이벤트> 대입 0
- 부르는 묶음(들어옴): G010×1, G099×1
- 바깥 js 가 window 이름을 씀: js/tabs/comm/feed-list.js, js/tabs/comm/share-card.js, js/tabs/records/export-theme.js, js/team-share.js, js/team-templates.js, js/viral-sharing.js
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js, tests/security-audit.test.js, tests/team-fold-state-es409.test.js, tests/team-level-accordion-es406.test.js, tests/team-level-management.test.js, tests/team-tasks-toggle-es410.test.js (index.html 단독 읽기: tests/security-audit.test.js, tests/team-fold-state-es409.test.js, tests/team-level-accordion-es406.test.js, tests/team-level-management.test.js, tests/team-tasks-toggle-es410.test.js)

### G058 [#TASK-ES-153] 전역 7일 유예 통합 휴지통 (Recycle Bin) 시스템

- 3155~3199줄(45줄) · 어려움(30)
- 함수(1): saveGoogleToken
- 변수(1): googleTokenClient
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: gcalCurrentUid, getGoogleAccessToken, isGoogleCalendarConnected, purgeLegacySharedGcalKeys, requestGoogleToken, restoreGoogleToken, state
- 로드 중 문 1: IfStatement 1
- window 노출(5줄): getGoogleAccessToken, isGoogleCalendarConnected, requestGoogleToken, restoreGoogleToken, saveGoogleToken
- 부르는 묶음(들어옴): G010×1
- 바깥 js 가 window 이름을 씀: js/auth-social.js, js/core/app-enter.js, js/core/gcal-sync.js, js/core/trash-bin.js, js/tabs/calendar/calendar-core.js, js/tabs/calendar/manual-edit-modal.js, js/tabs/calendar/natural-schedule.js, js/tabs/calendar/render.js 외 2
- 시험지 글자 의존: scripts/smoke-test.js, tests/core-confirm-es376.test.js, tests/gcal-login-reconnect-fix.test.js (index.html 단독 읽기: tests/gcal-login-reconnect-fix.test.js)

### G024 [#TASK-ES-150] 아바타 레벨업 대형 팝업 & 성장 성향 키워드

- 2896~2915줄(20줄) · 어려움(32)
- 함수(0): 없음
- 변수(6): avLvModalElem, btnAvLvClose, btnAvLvConfirm, btnSaveGrowth, btnSaveLvImg, btnShareLv
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindAvatarGrowthPromptSave, bindAvatarLevelUpBackdrop, bindAvatarLevelUpSaveImage, bindAvatarLevelUpShare, closeAvatarLevelUpModal
- 로드 중 문 12: var 초기값 실행 6 · IfStatement 2 · 호출 4
- 이벤트 처리기: addEventListener 2 · on<이벤트> 대입 0
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js, tests/avatar-10slots-growth.test.js (index.html 단독 읽기: tests/avatar-10slots-growth.test.js)

### G077 [#TASK-ES-146] 아워골 평가해주기 90% 팝업

- 3489~3516줄(28줄) · 어려움(34)
- 함수(0): 없음
- 변수(5): btnEvalBanner, btnEvalClose, btnSubmitEval, challengeBtn, modalEvalElem
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindAppEvalBackdrop, bindAppEvalSubmit, bindHomeAddGoal, closeAppEvaluationModal, openAppEvaluationModal, openMzShareCardModal, setTab
- 로드 중 문 12: var 초기값 실행 5 · IfStatement 3 · 호출 4
- 이벤트 처리기: addEventListener 3 · on<이벤트> 대입 1
- 시험지 글자 의존: scripts/smoke-test.js, tests/app-evaluation-modal.test.js, tests/home-customizer-auto-sync.test.js, tests/trio-es143-es145.test.js (index.html 단독 읽기: tests/home-customizer-auto-sync.test.js)

### G019 Confetti

- 2849~2859줄(11줄) · 어려움(36)
- 함수(0): 없음
- 변수(1): toastTimer
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: toast
- 로드 중 문 1: IfStatement 1
- window 노출(1줄): showToast
- 바깥 js 가 window 이름을 씀: js/avatar/feature-cards.js, js/calendar-attachment.js, js/components-auth-actions.js, js/components-avatar-actions.js, js/components-feed-actions.js, js/components-goal-actions.js, js/components-home-actions.js, js/components-record-actions.js 외 21
- 시험지 글자 의존: scripts/smoke-test.js, tests/core-toast-es361.test.js (index.html 단독 읽기: tests/core-toast-es361.test.js)

### G076 [#TASK-ES-174] 목표 템플릿 백과사전 전체화면 팝업 및 상호작용

- 3458~3488줄(31줄) · 어려움(38)
- 함수(0): 없음
- 변수(7): _tplActiveTab, _tplAiCurCat, btnCloseTplEncycl, btnHeaderTplEncycl, modalTplEncyclElem, tabBtnAi, tabBtnReal
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindHeaderTemplateEncyclopediaClick, bindTemplateEncyclopediaEscape, bindTemplateEncyclopediaModalClick, closeTemplateEncyclopediaModal, copyRealUserTemplate, openTemplateEncyclopediaModal, switchTemplateEncyclopediaTab
- 로드 중 문 13: var 초기값 실행 5 · IfStatement 3 · 호출 3 · window 노출 2
- window 노출(2줄): copyUserGoalTemplate, openGoalTemplateEncyclopediaModal
- 이벤트 처리기: addEventListener 3 · on<이벤트> 대입 0
- 바깥 js 가 window 이름을 씀: js/components-goal-actions.js, js/components.js, js/tabs/goals/template-encyclopedia-modal.js
- 시험지 글자 의존: scripts/smoke-test.js, tests/goal-template-legacy-cleanup.test.js, tests/goal-templates-encyclopedia.test.js

### G088 [UI/UX 틀 개편 Phase 4] 목표 탭 노션급 데이터 관리 & 인지순행 IA (#TASK-UIUX-PHASE4-GOALS)

- 3608~3664줄(57줄) · 어려움(58)
- 함수(2): handleGoalFastAddSubmit, selectSmartTag
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: dispatchFullViewPropagation, renderGoalsScreen, saveProfile, state, toast, triggerHapticFeedback
- 로드 중 문 4: window 노출 4
- window 노출(5줄): currentGoalStatPeriod, handleGoalFastAddSubmit, selectSmartTag, selectedGoalSmartTag
- 인라인 on*="…" 이 부르는 함수: handleGoalFastAddSubmit, selectSmartTag
- 바깥 js 가 window 이름을 씀: js/tabs/goals/goals-ia-actions.js
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-calendar-attachments.js, scripts/verify-integrity-gate.js, tests/ai-conditional-call-optimization.test.js, tests/core-confirm-es376.test.js, tests/goal-ai-advice-status.test.js, tests/goals-only-view.test.js, tests/goals-schedule-sync.test.js 외 9 (index.html 단독 읽기: scripts/test-calendar-attachments.js, tests/goal-ai-advice-status.test.js, tests/goals-only-view.test.js, tests/goals-schedule-sync.test.js, tests/goals-smart-attachments.test.js, tests/record-ledger-sync.test.js, tests/routine-tab-scheduler.test.js, tests/sync-server-records-render-home.test.js 외 3)

### G099 템플릿 마켓 · 복제 · 전문 템플릿 기록 (TASK-ES-013)

- 3866~5046줄(1181줄) · 어려움(106)
- 함수(3): executeDirectTemplateClone, openProTemplateRecordModal, openTemplateMarketModal
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: CURATED_MARKET_TEMPLATES, XP_RULES, awardXP, burstConfetti, checkRecordDeepLink, closeModal, computeTrendChartData, downloadTableAsCsv, escapeHtml, fmtYYMMDD, formatStopwatchTime, getAllProTemplates 외 38
- 로드 중 문 1: 호출 1
- 이벤트 처리기: addEventListener 3 · on<이벤트> 대입 41
- 부르는 묶음(들어옴): G002×2
- 부르는 대상(나감): G103×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-calendar-attachments.js, scripts/test-shipyard-modular.js, scripts/verify-all-clicks.js, scripts/verify-integrity-gate.js, tests/account-switch-isolation.test.js, tests/account-withdrawal-modal.test.js, tests/achievement-graph-multiset.test.js 외 29 (index.html 단독 읽기: scripts/test-calendar-attachments.js, tests/account-withdrawal-modal.test.js, tests/avatar-personas-split.test.js, tests/goal-ai-advice-status.test.js, tests/goal-templates-data-split.test.js, tests/goals-only-view.test.js, tests/goals-schedule-sync.test.js, tests/goals-smart-attachments.test.js 외 9)

### G054 Modal helper & Android Hardware Back Handler

- 3115~3125줄(11줄) · 어려움(146)
- 함수(0): 없음
- 변수(2): _modalDismissGraceUntil, _modalHistoryPushed
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindModalPopstateBack, openModal
- 로드 중 문 2: IfStatement 1 · 호출 1
- window 노출(1줄): openModal
- 바깥 js 가 window 이름을 씀: js/auth-safety.js, js/auth-social.js, js/avatar/dynamic-album.js, js/avatar/level-badge.js, js/avatar/modal/index.js, js/components-home-actions.js, js/core/badges.js, js/core/confirm.js 외 128
- 시험지 글자 의존: scripts/smoke-test.js, tests/core-modal-es363.test.js (index.html 단독 읽기: tests/core-modal-es363.test.js)

### G026 뱃지 컬렉션 (명예의 전당)

- 2924~2935줄(12줄) · 어려움(266)
- 함수(0): 없음
- 변수(1): state
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: defaultProfile, isoDate
- 로드 중 문 2: window 노출 1 · IfStatement 1
- window 노출(1줄): state
- 바깥 js 가 window 이름을 씀: js/auth-safety.js, js/auth-social.js, js/avatar/dynamic-album.js, js/avatar/feature-cards.js, js/avatar/level-badge.js, js/avatar/modal/bind-craft.js, js/avatar/modal/bind-deck.js, js/avatar/modal/bind-save.js 외 245
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-shipyard-modular.js, scripts/verify-integrity-gate.js, tests/routine-tab-scheduler.test.js, tests/unique-display-name.test.js (index.html 단독 읽기: tests/routine-tab-scheduler.test.js, tests/unique-display-name.test.js)

### G010 [#TASK-ES-432] 인라인 스크립트 세포화 2차 이음매 (docs/architecture/INLINE-SCRIPT-MAP.md 지도 · docs/specs

- 2392~2742줄(351줄) · 어려움(293)
- 함수(0): 없음
- 변수(167): CURATED_MARKET_TEMPLATES, TEAM_COMMENTS_CACHE, _authSocialKit, _creatorTemplatesLegacyKit, _curatedMarketDataKit, _homeKit, _levelBadgeKit, _modalOpenKit, _uiKit, _visionTableInputKit, bindAppEvalBackdrop, bindAppEvalSubmit, bindArchivedPageSetter, bindArchivedPeriodSetter, bindAuthTabButtons, bindAuthTesterBButton, bindAvatarGrowthPromptSave, bindAvatarLevelUpBackdrop, bindAvatarLevelUpSaveImage, bindAvatarLevelUpShare 외 147
- 다른 묶음 상태 — 대입: MANITO_SERVER_LOADED, REALTIME_CHANNELS_SETUP, REAL_MANITO_INBOX_CACHE, REAL_MANITO_PARTNERS_CACHE, SHARED_GROUPS_LOADED, _cachedSignedCalendarToken, _googleOneTapNonce, _googleTokenClient, _isEnteringApp, _lastObservedDateKey, _modalDismissGraceUntil, _modalHistoryPushed 외 12 · 변경: 없음 · 읽기: MANITO_SERVER_LOADED, REALTIME_CHANNELS_SETUP, REAL_MANITO_INBOX_CACHE, REAL_MANITO_PARTNERS_CACHE, SHARED_GROUPS_LOADED, _cachedSignedCalendarToken, _calendarKit, _commKit, _goalsKit, _googleOneTapNonce, _googleTokenClient, _isEnteringApp 외 51
- 로드 중 문 22: 호출 22
- 부르는 대상(나감): G058×1, G093×1, G103×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-calendar-attachments.js, scripts/verify-integrity-gate.js, tests/account-switch-isolation.test.js, tests/account-withdrawal-modal.test.js, tests/achievement-collapse-toggle.test.js, tests/achievement-graph-multiset.test.js, tests/achievement-metric-multiselect.test.js 외 67 (index.html 단독 읽기: scripts/test-calendar-attachments.js, tests/account-withdrawal-modal.test.js, tests/app-evaluation-notice.test.js, tests/avatar-personas-split.test.js, tests/avatar-welcome-modal.test.js, tests/calendar-photo-diary-dismiss-guide.test.js, tests/comm-feed-cleanup.test.js, tests/comm-post-feed-button-fix.test.js 외 22)

## 6. 이음매·빈 구획

- G000 2254~2256(3줄) (IIFE 머리 — "use strict" 와 첫 구획 앞) — 빈 구획
- G001 2257~2294(38줄) [#TASK-ES-354 CORE-07] 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL.md) — 이음매(옮기지 않음) · 로드 중 문 1
- G002 2295~2311(17줄) [#TASK-ES-358] 기록 탭 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL.md) — 이음매(옮기지 않음) · 로드 중 문 1
- G003 2312~2330(19줄) [#TASK-ES-360] 일정 탭 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL.md, 기록 탭 #TASK-ES-358 과 같은 틀) — 이음매(옮기지 않음) · 로드 중 문 1
- G004 2331~2352(22줄) [#TASK-ES-370] 목표 탭 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL.md, 일정 탭 #TASK-ES-360 과 같은 틀) — 이음매(옮기지 않음) · 로드 중 문 1
- G006 2358~2361(4줄) [#TASK-ES-375] 목표 탭 모듈 이음매 2차 (docs/specs/MODULE-SPLIT-PROTOCOL.md, 1차 #TASK-ES-370 과 같은 틀 — 이음매(옮기지 않음)
- G007 2362~2371(10줄) [#TASK-ES-379] 소통 탭 모듈 이음매 1차 (docs/specs/MODULE-SPLIT-PROTOCOL.md, 목표 탭 #TASK-ES-370·#TAS — 이음매(옮기지 않음) · 로드 중 문 1
- G009 2385~2391(7줄) [#TASK-ES-423] 인라인 스크립트 세포화 1차 이음매 (docs/architecture/INLINE-SCRIPT-MAP.md 지도 · docs/specs — 이음매(옮기지 않음)
- G018 2841~2848(8줄) [#TASK-ES-264] 표준 시간대(한국 KST 00:00, 타 국가는 해당 국가 표준시 00:00) 기준 날짜 키 — 빈 구획 · 로드 중 문 1
- G021 2875~2877(3줄) 가상유저 개선 10대 핵심 헬퍼 함수 — 빈 구획
- G022 2878~2885(8줄) [#TASK-ES-345 CAL-02] 구글 캘린더 토큰·일정 캐시 계정 격리 — 빈 구획
- G023 2886~2895(10줄) XP/레벨 시스템 — 빈 구획 · 로드 중 문 6
- G027 2936~2938(3줄) [70] 다른 모든 기기 원격 로그아웃 전 로그인 기기 목록 확인 모달 — 빈 구획
- G028 2939~2946(8줄) [71] 앱 잠금 PIN (이 기기) — 설정·해제·앱 진입 확인 — 빈 구획
- G030 2954~2957(4줄) [80] 템플릿백과사전 1초 자동이식 선택 연동 및 로드맵-목표상태 동기화 — 빈 구획
- G031 2958~2960(3줄) [82] 팀 목표 내 '팀 연계 개인목표' 생성 모달 — 빈 구획
- G032 2961~2964(4줄) [83] 팀원 초대 시 '아워골 동반자 초대하기' 인앱 초대·참가 기능 — 빈 구획
- G033 2965~2967(3줄) [88] 오늘의 3초 체크인 목표 버튼 선택 시 플레이스홀더(백그라운드 가이드) 예시 문구 렌더링 — 빈 구획
- G034 2968~2977(10줄) [#TASK-UIUX-PHASE3-HOME-COCKPIT] 홈 1초 조망 ↔ 무저항 체크인 콕핏 8대 과업 — 빈 구획 · 로드 중 문 2
- G035 2978~2978(1줄) Landing — 빈 구획
- G038 2996~3003(8줄) [#TASK-ES-223] [생각 메모장 93번] 개발 디버그 버튼 프로덕션 완전 소거 및 로컬/디버그 격리 — 빈 구획 · 로드 중 문 1
- G040 3015~3017(3줄) [#TASK-ES-224] [생각 메모장 94번] 게스트(둘러보기) 3회 기록 시 안전 백업 넛지 및 카카오 무손실 계정 통합 — 빈 구획
- G041 3018~3020(3줄) [#TASK-ES-224] [생각 메모장 94번] 카카오/소셜/일반 로그인 시 게스트 데이터 100% 무손실 비파괴 합집합(Union Merge) 이관 — 빈 구획
- G045 3050~3053(4줄) 회원 탈퇴 전용 안내 모달 및 법적책임·데이터분실 사전 안내 (#TASK-ES-158) — 빈 구획 · 로드 중 문 1
- G049 3069~3088(20줄) 이용약관 / 개인정보처리방침 열람 리스너 — 빈 구획 · 로드 중 문 8
- G050 3089~3091(3줄) Onboarding (first-time, after signup) — 16종 동물 아바타 & 직관적 안착 융합 — 빈 구획
- G051 3092~3098(7줄) 3단계: 첫 체크인 튜토리얼 가이드 및 축하 연출 — 빈 구획
- G053 3107~3114(8줄) 조선소 블록 레지스트리 6대 메가블록 초기화 (헌법 제3조 제9항) — 빈 구획 · 로드 중 문 3
- G055 3126~3145(20줄) 이용약관 & 개인정보처리방침 모달 — 빈 구획 · 로드 중 문 1
- G056 3146~3153(8줄) 프로필 — 빈 구획 · 로드 중 문 1
- G057 3154~3154(1줄) 구글 캘린더 연동 — 빈 구획
- G059 3200~3220(21줄) [#TASK-ES-153 & #TASK-ES-155] 캘린더 일자별 배경 사진 지정 모달 — 빈 구획 · 로드 중 문 2
- G060 3221~3243(23줄) [#TASK-ES-181 & #TASK-ES-182] 폰 잠금화면에서 바로 보기 통합 허브 모달 — 빈 구획 · 로드 중 문 1
- G061 3244~3248(5줄) Adaptive UX Mode — 빈 구획
- G062 3249~3251(3줄) Social Crew Pacing (#TASK-ES-228) — 빈 구획
- G063 3252~3257(6줄) UX Telemetry (Hesitation & Rage Tap) — 빈 구획 · 로드 중 문 1
- G064 3258~3274(17줄) iOS 사파리 홈 화면 추가 안내 배너 & 실시간 알림 가이드 (#TASK-ES-234) — 빈 구획 · 로드 중 문 1
- G067 3295~3298(4줄) 🎙️ 마이크 권한 거부 상태 자가 진단 및 1초 권한 허용 모달 (#TASK-ES-227) — 빈 구획 · 로드 중 문 1
- G068 3299~3369(71줄) 음성 체크인 (Web Speech API) — 빈 구획 · 로드 중 문 1
- G072 3430~3440(11줄) 맞춤 피드백 봇 설정 — 빈 구획 · 로드 중 문 4
- G073 3441~3444(4줄) 목표 & 기록 선택 피드 공유 모달 (전면 고도화) — 빈 구획 · 로드 중 문 1
- G074 3445~3450(6줄) [#TASK-ES-301] 피드 게시 모달 내 '미리보기' 토글 직통 헬퍼 — 빈 구획 · 로드 중 문 1
- G078 3517~3526(10줄) New goal modal — 빈 구획 · 로드 중 문 2
- G079 3527~3527(1줄) 참고자료 (유튜브/영상, 이미지, 텍스트 메모, 웹링크) — 빈 구획
- G080 3528~3536(9줄) 참고자료 (유튜브/영상, 이미지, 텍스트 메모, 웹링크) — 빈 구획 · 로드 중 문 1
- G082 3569~3578(10줄) [#TASK-ES-264] 오늘의 미션 및 AI 피드백 조건부 호출 최적화 — 빈 구획 · 로드 중 문 1
- G083 3579~3588(10줄) 목표 탭 3계층 일정설정 / 디데이·기간 표시 및 캘린더 연동 (#TASK-ES-259, 메모장 03항, #TASK-ES-135) — 빈 구획 · 로드 중 문 1
- G084 3589~3591(3줄) [#TASK-ES-220] [생각 메모장 91번] 교대근무자 가변형 루틴 프리셋 & 자동 스케줄러 — 빈 구획
- G085 3592~3595(4줄) [#TASK-ES-172] [27] 목표 탭: 데일리 루틴 서브탭 & 편집/상세 모달 — 빈 구획
- G089 3665~3668(4줄) [PHASE 5] #TASK-UIUX-PHASE5-RECORDS-CALENDAR FUNCTIONS — 빈 구획
- G090 3669~3674(6줄) [PHASE 6] #TASK-UIUX-PHASE6-COMM-SETTINGS FUNCTIONS — 빈 구획
- G091 3675~3693(19줄) [UI/UX 프레임워크 개편 Phase 7] 모바일 하드웨어 인터랙션 & 사용성 하드닝 — 빈 구획 · 로드 중 문 1
- G092 3694~3696(3줄) RENDER: GOALS — 빈 구획
- G094 3726~3740(15줄) 개인 목표 200% 활용 가이드 & 템플릿 백과사전 (#TASK-ES-135) — 빈 구획 · 로드 중 문 3
- G095 3741~3832(92줄) [#TASK-ES-299] 팀 목표 댓글 작성 및 전송 직통 헬퍼 & 전역 이벤트 위임 (먹통 방어 100%) — 빈 구획 · 로드 중 문 3
- G096 3833~3840(8줄) TASK-ES-307: 측정지표 다중 선택 및 동시 렌더링 엔진 — 빈 구획 · 로드 중 문 1
- G097 3841~3854(14줄) 5대 테마 원형 라이프 밸런스 휠 (SVG Pie Chart) — 빈 구획
- G098 3855~3865(11줄) ⏱️ 인앱 인터벌 타이머 & 스톱워치 위젯 (In-Table Stopwatch) — 빈 구획 · 로드 중 문 1
- G100 5047~5074(28줄) [#TASK-ES-358] 기록 탭 렌더 → js/tabs/records/period-ai-card.js · render.js 로 옮김 — 빈 구획 · 로드 중 문 1
- G102 5089~5089(1줄) RFC 5545 표준 iCalendar (.ics) 생성 순수 함수 (TASK-BG-11) — 빈 구획
- G104 5266~5269(4줄) 크리에이터 템플릿 (#TASK-ES-315, 64: 구형 창 영구 제거 및 무해화) — 빈 구획 · 로드 중 문 1
- G109 5301~5313(13줄) DM & 동반자 소통 시스템 (TASK-ES-105) — 빈 구획 · 로드 중 문 3
- G110 5314~5327(14줄) [#TASK-ES-354 CORE-07·SET-07] 설정 탭 렌더 → js/tabs/settings/render.js · sub-*.js 로 옮김 — 이음매(옮기지 않음) · 로드 중 문 4
- G111 5328~5330(3줄) 4대 연계 뷰 원자적 동시 전파 디스패처 (헌법 제1조 제4항 제5호 & 제15조 제6항 제3호) — 빈 구획
- G114 5340~5354(15줄) #TASK-AUTH-P0-SAFETY: 로그인/계정 보안 패키지 모듈 연결 — 빈 구획 · 로드 중 문 2
- G115 5355~5368(14줄) KF-7 #TASK-ES-014: 반응 4종 모듈(js/reactions.js)에 앱 핸들 연결 — 빈 구획 · 로드 중 문 1
- G116 5369~5373(5줄) KF-4 #TASK-ES-018: 카테고리별 도움이 된 글 슬롯 모듈(js/top-helpful.js) — 빈 구획 · 로드 중 문 1
- G117 5374~5382(9줄) KF-5 #TASK-ES-016: 도움돼요 이유 모듈(js/helpful-reason.js)에 앱 핸들 연결 — 빈 구획 · 로드 중 문 1
- G118 5383~5390(8줄) #TASK-ES-105: 팀 초대 및 소통/DM/동반자 모듈(js/team-invite-comm.js) 연결 — 빈 구획 · 로드 중 문 1
- G119 5391~5399(9줄) #TASK-ES-105: 팀 연계 개인목표 및 상호 체크 모듈(js/team-linked-goals.js) 연결 — 빈 구획 · 로드 중 문 2
- G120 5400~5404(5줄) KF-2 #TASK-ES-017: 템플릿 복제 크레딧 모듈(js/template-credit.js)에 앱 핸들 연결 — 빈 구획 · 로드 중 문 1
- G121 5405~5443(39줄) PWA: Service Worker 등록 및 자동 업데이트 감지 (#TASK-ES-118) — 빈 구획 · 로드 중 문 6
