# index.html 인라인 스크립트 책임 묶음 지도

> 생성: `NODE_PATH=<node_modules> node scripts/inline-script-map.js --write` (#TASK-ES-423). **손으로 고치지 않는다** — 다시 만들면 같은 입력에서 같은 글자가 나온다(결정적).
> 출처: `index.html` sha256 앞 12자 `b63b6517d912` · 큰 인라인 IIFE 2254~5152줄(2899줄) · 다른 인라인 블록 4줄(8줄), 5155줄(16줄).

## 1. 요약

- 묶음 117개(이음매 8 · 옮길 대상 49 · 빈 구획 60). 묶음 = IIFE 최상위 구획 주석 `/* ============ 제목 ============ */` 에서 다음 구획 주석 앞까지.
- 최상위 함수 8 · 최상위 변수 266 · window 전역 대입 20줄(module-metrics ③ 의 index.html 몫과 같은 정규식) · addEventListener 35 · on<이벤트> 대입 44 · 로드 중 바로 도는 최상위 문 182 · 인라인 on*="…" 처리기가 부르는 IIFE 이름 12개.
- 난이도 묶음 수(줄): 쉬움 26(227줄) · 보통 15(235줄) · 어려움 8(1833줄) · 빈 구획 60(526줄) · 이음매(옮기지 않음) 8(78줄).

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
| G097 | 템플릿 마켓 · 복제 · 전문 템플릿 기록 (TASK-ES-013) | 1181 | 3 | 어려움(106) | 0/1/50 | 1 | 1 | 39(17) |
| G010 | [#TASK-ES-432] 인라인 스크립트 세포화 2차 이음매 (docs/architecture/INLINE-SCRIPT-MA | 330 | 0 | 어려움(247) | 24/0/66 | 17 | 0 | 34(17) |
| G101 | 캘린더 실시간 구독 URL 생성기 (WebCal Feed & #TASK-ES-252 HMAC 서명) | 176 | 1 | 어려움(30) | 0/0/2 | 2 | 2 | 7(5) |
| G093 | [#TASK-ES-299] 팀 목표 댓글 작성 및 전송 직통 헬퍼 & 전역 이벤트 위임 (먹통 방어 100%) | 92 | 0 | 빈 구획(31) | 0/2/11 | 3 | 0 | 6(2) |
| G067 | 음성 체크인 (Web Speech API) | 71 | 0 | 빈 구획(7) | 0/0/2 | 1 | 0 | 2(1) |
| G087 | [UI/UX 틀 개편 Phase 4] 목표 탭 노션급 데이터 관리 & 인지순행 IA (#TASK-UIUX-PHASE4-GOAL | 57 | 2 | 어려움(58) | 0/1/6 | 4 | 0 | 17(11) |
| G057 | [#TASK-ES-153] 전역 7일 유예 통합 휴지통 (Recycle Bin) 시스템 | 41 | 1 | 보통(15) | 0/1/3 | 1 | 1 | 3(1) |
| G068 | 사진 인증 & 뷰어 모달 (가상유저 요청 P1) | 38 | 0 | 보통(16) | 0/0/2 | 4 | 0 | 3(2) |
| G075 | [#TASK-ES-174] 목표 템플릿 백과사전 전체화면 팝업 및 상호작용 | 29 | 0 | 어려움(27) | 0/0/5 | 11 | 0 | 3(0) |
| G091 | RENDER: 팀 목표 (팀장·매니저만 추가/수정/삭제, 팀원은 보기만) | 29 | 1 | 쉬움(5) | 0/0/4 | 0 | 1 | 4(0) |

## 3. 권장 순서 (안전한 것부터, 상위 30)

같은 점수면 큰 묶음 먼저(한 번 옮겨 많이 줄인다). 로드 중 문이 있는 묶음은 함수만 옮기고 그 문은 원래 자리에 남긴다(MODULE-SPLIT-PROTOCOL 3절).

| 순서 | 묶음 | 제목 | 줄 | 점수 | 근거(점수가 생긴 곳) |
|--:|---|---|--:|--:|---|
| 1 | G064 | 1순위 대표 목표 AI 초집중 모드 (Focus Auto-Pilot) | 9 | 0 | 없음 |
| 2 | G029 | [78 / 89] 데이터분석 프롬프트 백과사전 (실사용 유저 등록·피드 게시 및 도움돼요 상호작용) | 7 | 0 | 없음 |
| 3 | G106 | 마니또 실 유저 익명 응원 연동 (#TASK-ES-133, #TASK-ES-145) | 7 | 0 | 없음 |
| 4 | G025 | #TASK-ES-165: 앱 진입 아바타 인사 팝업 (화면 절반 크기 & 시간대별 멘트) | 6 | 0 | 없음 |
| 5 | G103 | 소통 피드 (Supabase feed_posts, 실시간 동기화) | 6 | 0 | 없음 |
| 6 | G110 | [#TASK-ES-264] 자정(00:00 KST / 현지 표준시) 날짜 변경 감지 및 자동 동기화 워처 | 5 | 0 | 없음 |
| 7 | G085 | RENDER: TEMPLATE ENCYCLOPEDIA SUBTAB (#TASK-ES-187) | 3 | 0 | 없음 |
| 8 | G012 | [#TASK-ES-446] 인라인 스크립트 세포화 P2-1 이음매 (docs/architecture/INLI | 9 | 1 | 상태 읽기 1 |
| 9 | G070 | [#TASK-ES-225] [생각 메모장 95번] Gemini API 분당 쿼터(Rate Limit 429) | 9 | 1 | 상태 읽기 1 |
| 10 | G008 | [#TASK-ES-444] 인라인 스크립트 세포화 P1 이음매 2 — 일정 배경·잠금화면 라이브, 소통 창· | 7 | 2 | 상태 읽기 2 |
| 11 | G011 | [#TASK-ES-436] 인라인 스크립트 세포화 P1 이음매 1 — 목표 AI·일정 설정, 기록 AI 피드 | 7 | 2 | 상태 읽기 2 |
| 12 | G019 | Confetti | 8 | 3 | 시험지(index 단독) 1 |
| 13 | G111 | 세션 복구 및 안전 앱 진입 유틸 | 4 | 3 | 상태 읽기 1 · 로드 중 문 1 |
| 14 | G017 | 아워골 앱 환경설정 | 22 | 4 | 로드 중 문 1 · window 1 · 바깥 파일 1 |
| 15 | G051 | 최초 로그인 활용가이드 — 4대 탭 무블러(Zero Blur) 투명 라이브 프리뷰 융합 | 7 | 4 | 로드 중 문 2 |
| 16 | G091 | RENDER: 팀 목표 (팀장·매니저만 추가/수정/삭제, 팀원은 보기만) | 29 | 5 | 상태 읽기 4 · 들어옴 1 |
| 17 | G042 | P0: 비밀번호 찾기 (이메일 재설정 링크 발송) | 10 | 5 | 상태 읽기 1 · 로드 중 문 2 |
| 18 | G104 | 전역 공유 팀 로더 & 렌더링 (#TASK-ES-133) | 9 | 5 | 로드 중 문 1 · window 1 · 바깥 파일 2 |
| 19 | G105 | 통합 딥링크 게이트웨이 & 게스트 소프트 뷰어 3종 (js/viral-sharing.js 위임) | 9 | 5 | 상태 읽기 1 · 로드 중 문 1 · window 1 · 바깥 파일 1 |
| 20 | G045 | [#TASK-ES-160, #TASK-ES-166, #TASK-ES-180] 각 탭 200% 활용법 및 실제 | 6 | 5 | 상태 읽기 1 · 로드 중 문 2 |
| 21 | G046 | 앱 활용 가이드 다시보기 | 4 | 5 | 상태 읽기 1 · 로드 중 문 2 |
| 22 | G016 | Supabase | 9 | 6 | 상태 읽기 1 · 로드 중 문 1 · 시험지(index 단독) 1 |
| 23 | G053 | Modal helper & Android Hardware Back Handler | 8 | 6 | 상태 읽기 1 · 로드 중 문 1 · 시험지(index 단독) 1 |
| 24 | G065 | 원터치 퀵 루틴 칩 | 11 | 7 | 로드 중 문 2 · 시험지(index 단독) 1 |
| 25 | G041 | Goal category templates | 11 | 8 | 상태 읽기 2 · 로드 중 문 3 |
| 26 | G047 | 1:1 고객 문의 / 버그 제보 (#TASK-ES-178) | 5 | 8 | 상태 읽기 2 · 로드 중 문 3 |
| 27 | G038 | 소셜 로그인 (카카오 / 실제 구글 OAuth 연동) | 11 | 9 | 상태 읽기 2 · 로드 중 문 2 · 시험지(index 단독) 1 |
| 28 | G014 | [#TASK-ES-437] 인라인 스크립트 세포화 P0 이음매 (docs/architecture/INLINE | 9 | 9 | 상태 대입 1 · 상태 읽기 3 · 로드 중 문 1 |
| 29 | G086 | [#TASK-ES-189] 템플릿 백과사전 3대 분류(개인·루틴·팀) 및 AI/실유저 2원화 이식 시스템 | 9 | 10 | 로드 중 문 2 · window 2 · 바깥 파일 1 · 시험지(index 단독) 1 |
| 30 | G037 | 2계정 상호작용 테스트 (테스터 B 직통 입장: #TASK-ES-169) | 9 | 13 | 상태 읽기 3 · 로드 중 문 5 |

## 4. 전체 묶음 표

| 묶음 | 줄 범위 | 줄 | 제목 | 함수 | 변수 | 난이도(점수) | 상태 쓰기 · 변경 · 읽기 | window | 처리기(add/on) | 로드 중 문 | 인라인 처리기 | 들어옴/나감 묶음 | 바깥 파일 | 시험지(index 단독) |
|---|---|--:|---|--:|--:|---|---|--:|---|--:|--:|---|--:|---|
| G000 | 2254~2256 | 3 | (IIFE 머리 — "use strict" 와 첫 구획 앞) | 0 | 0 | 빈 구획(66) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 67(22) |
| G001 | 2257~2276 | 20 | [#TASK-ES-354 CORE-07] 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTO | 0 | 9 | 이음매(옮기지 않음)(24) | 1 · 0 · 3 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 10(5) |
| G002 | 2277~2288 | 12 | [#TASK-ES-358] 기록 탭 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL | 0 | 2 | 이음매(옮기지 않음)(44) | 1 · 0 · 2 | 0 | 0/0 | 1 | 0 | 0/1 | 0 | 48(12) |
| G003 | 2289~2294 | 6 | [#TASK-ES-360] 일정 탭 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL | 0 | 2 | 이음매(옮기지 않음)(9) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 11(3) |
| G004 | 2295~2303 | 9 | [#TASK-ES-370] 목표 탭 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL | 0 | 2 | 이음매(옮기지 않음)(39) | 0 · 0 · 1 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 45(12) |
| G005 | 2304~2307 | 4 | [#TASK-ES-453] 인라인 스크립트 세포화 P1 이음매 3 — 목표 종합상황 AI 요약 새로 고침 ( | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G006 | 2308~2311 | 4 | [#TASK-ES-375] 목표 탭 모듈 이음매 2차 (docs/specs/MODULE-SPLIT-PROTO | 0 | 0 | 이음매(옮기지 않음)(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G007 | 2312~2321 | 10 | [#TASK-ES-379] 소통 탭 모듈 이음매 1차 (docs/specs/MODULE-SPLIT-PROTO | 0 | 2 | 이음매(옮기지 않음)(7) | 0 · 0 · 2 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 6(1) |
| G008 | 2322~2328 | 7 | [#TASK-ES-444] 인라인 스크립트 세포화 P1 이음매 2 — 일정 배경·잠금화면 라이브, 소통 창· | 0 | 3 | 쉬움(2) | 0 · 0 · 2 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G009 | 2329~2333 | 5 | [#TASK-ES-423] 인라인 스크립트 세포화 1차 이음매 (docs/architecture/INLINE | 0 | 1 | 이음매(옮기지 않음)(1) | 0 · 0 · 1 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 3(0) |
| G010 | 2334~2663 | 330 | [#TASK-ES-432] 인라인 스크립트 세포화 2차 이음매 (docs/architecture/INLINE | 0 | 148 | 어려움(247) | 24 · 0 · 66 | 0 | 0/0 | 17 | 0 | 0/3 | 0 | 34(17) |
| G011 | 2664~2670 | 7 | [#TASK-ES-436] 인라인 스크립트 세포화 P1 이음매 1 — 목표 AI·일정 설정, 기록 AI 피드 | 0 | 3 | 쉬움(2) | 0 · 0 · 2 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G012 | 2671~2679 | 9 | [#TASK-ES-446] 인라인 스크립트 세포화 P2-1 이음매 (docs/architecture/INLI | 0 | 5 | 쉬움(1) | 0 · 0 · 1 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G013 | 2680~2701 | 22 | [#TASK-ES-448] 인라인 스크립트 세포화 P2-2 이음매 (docs/architecture/INLI | 0 | 6 | 보통(19) | 1 · 0 · 5 | 0 | 0/0 | 2 | 0 | 0/0 | 0 | 8(2) |
| G014 | 2702~2710 | 9 | [#TASK-ES-437] 인라인 스크립트 세포화 P0 이음매 (docs/architecture/INLINE | 0 | 1 | 보통(9) | 1 · 0 · 3 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 1(0) |
| G015 | 2711~2720 | 10 | [#TASK-ES-442] 인라인 스크립트 세포화 P0 이음매 (docs/architecture/INLINE | 0 | 1 | 보통(14) | 2 · 0 · 4 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 2(0) |
| G016 | 2721~2729 | 9 | Supabase | 0 | 4 | 쉬움(6) | 0 · 0 · 1 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 3(1) |
| G017 | 2730~2751 | 22 | 아워골 앱 환경설정 | 0 | 1 | 쉬움(4) | 0 · 0 · 0 | 1 | 0/0 | 1 | 0 | 0/0 | 1 | 1(0) |
| G018 | 2752~2755 | 4 | [#TASK-ES-264] 표준 시간대(한국 KST 00:00, 타 국가는 해당 국가 표준시 00:00) 기 | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 2(0) |
| G019 | 2756~2763 | 8 | Confetti | 0 | 1 | 쉬움(3) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 2(1) |
| G020 | 2764~2778 | 15 | 8대 화면 스타일 (테마) 정의 | 0 | 1 | 보통(17) | 0 · 0 · 0 | 1 | 0/0 | 1 | 0 | 0/0 | 2 | 10(4) |
| G021 | 2779~2781 | 3 | 가상유저 개선 10대 핵심 헬퍼 함수 | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G022 | 2782~2789 | 8 | [#TASK-ES-345 CAL-02] 구글 캘린더 토큰·일정 캐시 계정 격리 | 0 | 0 | 빈 구획(3) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 2(1) |
| G023 | 2790~2793 | 4 | XP/레벨 시스템 | 0 | 0 | 빈 구획(3) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 2(1) |
| G024 | 2794~2813 | 20 | [#TASK-ES-150] 아바타 레벨업 대형 팝업 & 성장 성향 키워드 | 0 | 6 | 어려움(32) | 0 · 0 · 5 | 0 | 2/0 | 12 | 0 | 0/0 | 0 | 3(1) |
| G025 | 2814~2819 | 6 | #TASK-ES-165: 앱 진입 아바타 인사 팝업 (화면 절반 크기 & 시간대별 멘트) | 0 | 1 | 쉬움(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G026 | 2820~2831 | 12 | 뱃지 컬렉션 (명예의 전당) | 0 | 1 | 어려움(266) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 256 | 5(2) |
| G027 | 2832~2834 | 3 | [70] 다른 모든 기기 원격 로그아웃 전 로그인 기기 목록 확인 모달 | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G028 | 2835~2842 | 8 | [71] 앱 잠금 PIN (이 기기) — 설정·해제·앱 진입 확인 | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G029 | 2843~2849 | 7 | [78 / 89] 데이터분석 프롬프트 백과사전 (실사용 유저 등록·피드 게시 및 도움돼요 상호작용) | 0 | 2 | 쉬움(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 2(0) |
| G030 | 2850~2853 | 4 | [80] 템플릿백과사전 1초 자동이식 선택 연동 및 로드맵-목표상태 동기화 | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G031 | 2854~2856 | 3 | [82] 팀 목표 내 '팀 연계 개인목표' 생성 모달 | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G032 | 2857~2860 | 4 | [83] 팀원 초대 시 '아워골 동반자 초대하기' 인앱 초대·참가 기능 | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G033 | 2861~2863 | 3 | [88] 오늘의 3초 체크인 목표 버튼 선택 시 플레이스홀더(백그라운드 가이드) 예시 문구 렌더링 | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G034 | 2864~2872 | 9 | [#TASK-UIUX-PHASE3-HOME-COCKPIT] 홈 1초 조망 ↔ 무저항 체크인 콕핏 8대 과업 | 0 | 0 | 빈 구획(4) | 0 · 0 · 0 | 1 | 0/0 | 1 | 0 | 0/0 | 1 | 0(0) |
| G035 | 2873~2873 | 1 | Landing | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G036 | 2874~2883 | 10 | [#TASK-ES-222] [생각 메모장 92번] 카카오톡 인앱 브라우저 감지 및 Android Chrome | 0 | 2 | 보통(16) | 0 · 0 · 4 | 0 | 0/0 | 6 | 0 | 0/0 | 0 | 1(0) |
| G037 | 2884~2892 | 9 | 2계정 상호작용 테스트 (테스터 B 직통 입장: #TASK-ES-169) | 0 | 2 | 보통(13) | 0 · 0 · 3 | 0 | 0/0 | 5 | 0 | 0/0 | 0 | 1(0) |
| G038 | 2893~2903 | 11 | 소셜 로그인 (카카오 / 실제 구글 OAuth 연동) | 0 | 2 | 보통(9) | 0 · 0 · 2 | 0 | 0/0 | 2 | 0 | 0/0 | 0 | 1(1) |
| G039 | 2904~2906 | 3 | [#TASK-ES-224] [생각 메모장 94번] 게스트(둘러보기) 3회 기록 시 안전 백업 넛지 및 카카오 | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G040 | 2907~2909 | 3 | [#TASK-ES-224] [생각 메모장 94번] 카카오/소셜/일반 로그인 시 게스트 데이터 100% 무손실 | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G041 | 2910~2920 | 11 | Goal category templates | 0 | 1 | 쉬움(8) | 0 · 0 · 2 | 0 | 0/0 | 3 | 0 | 0/0 | 0 | 2(0) |
| G042 | 2921~2930 | 10 | P0: 비밀번호 찾기 (이메일 재설정 링크 발송) | 0 | 1 | 쉬움(5) | 0 · 0 · 1 | 0 | 1/0 | 2 | 0 | 0/0 | 0 | 1(0) |
| G043 | 2931~2938 | 8 | P0: 회원 탈퇴 30일 유예(소프트 삭제) 복구 체크 | 0 | 1 | 보통(14) | 0 · 0 · 4 | 0 | 0/0 | 5 | 0 | 0/0 | 0 | 1(0) |
| G044 | 2939~2942 | 4 | 회원 탈퇴 전용 안내 모달 및 법적책임·데이터분실 사전 안내 (#TASK-ES-158) | 0 | 0 | 빈 구획(6) | 0 · 0 · 1 | 0 | 1/0 | 1 | 0 | 0/0 | 0 | 2(1) |
| G045 | 2943~2948 | 6 | [#TASK-ES-160, #TASK-ES-166, #TASK-ES-180] 각 탭 200% 활용법 및 실제 | 0 | 1 | 쉬움(5) | 0 · 0 · 1 | 0 | 0/0 | 2 | 0 | 0/0 | 0 | 1(0) |
| G046 | 2949~2952 | 4 | 앱 활용 가이드 다시보기 | 0 | 1 | 쉬움(5) | 0 · 0 · 1 | 0 | 0/0 | 2 | 0 | 0/0 | 0 | 1(0) |
| G047 | 2953~2957 | 5 | 1:1 고객 문의 / 버그 제보 (#TASK-ES-178) | 0 | 1 | 쉬움(8) | 0 · 0 · 2 | 0 | 0/0 | 3 | 0 | 0/0 | 0 | 0(0) |
| G048 | 2958~2971 | 14 | 이용약관 / 개인정보처리방침 열람 리스너 | 0 | 0 | 빈 구획(24) | 0 · 0 · 8 | 0 | 0/0 | 8 | 0 | 0/0 | 0 | 1(0) |
| G049 | 2972~2974 | 3 | Onboarding (first-time, after signup) — 16종 동물 아바타 & 직관적 안착  | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G050 | 2975~2981 | 7 | 3단계: 첫 체크인 튜토리얼 가이드 및 축하 연출 | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G051 | 2982~2988 | 7 | 최초 로그인 활용가이드 — 4대 탭 무블러(Zero Blur) 투명 라이브 프리뷰 융합 | 0 | 2 | 쉬움(4) | 0 · 0 · 0 | 0 | 0/0 | 2 | 0 | 0/0 | 0 | 2(0) |
| G052 | 2989~2996 | 8 | 조선소 블록 레지스트리 6대 메가블록 초기화 (헌법 제3조 제9항) | 0 | 0 | 빈 구획(25) | 0 · 0 · 3 | 1 | 0/0 | 3 | 0 | 0/0 | 15 | 0(0) |
| G053 | 2997~3004 | 8 | Modal helper & Android Hardware Back Handler | 0 | 2 | 쉬움(6) | 0 · 0 · 1 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 2(1) |
| G054 | 3005~3021 | 17 | 이용약관 & 개인정보처리방침 모달 | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G055 | 3022~3029 | 8 | 프로필 | 0 | 0 | 빈 구획(3) | 0 · 0 · 1 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 2(0) |
| G056 | 3030~3030 | 1 | 구글 캘린더 연동 | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G057 | 3031~3071 | 41 | [#TASK-ES-153] 전역 7일 유예 통합 휴지통 (Recycle Bin) 시스템 | 1 | 1 | 보통(15) | 0 · 1 · 3 | 1 | 0/0 | 1 | 0 | 1/0 | 3 | 3(1) |
| G058 | 3072~3086 | 15 | [#TASK-ES-153 & #TASK-ES-155] 캘린더 일자별 배경 사진 지정 모달 | 0 | 0 | 빈 구획(3) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 4(1) |
| G059 | 3087~3095 | 9 | [#TASK-ES-181 & #TASK-ES-182] 폰 잠금화면에서 바로 보기 통합 허브 모달 | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 2(0) |
| G060 | 3096~3100 | 5 | Adaptive UX Mode | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G061 | 3101~3103 | 3 | Social Crew Pacing (#TASK-ES-228) | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G062 | 3104~3109 | 6 | UX Telemetry (Hesitation & Rage Tap) | 0 | 0 | 빈 구획(3) | 0 · 0 · 1 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 0(0) |
| G063 | 3110~3125 | 16 | iOS 사파리 홈 화면 추가 안내 배너 & 실시간 알림 가이드 (#TASK-ES-234) | 0 | 0 | 빈 구획(3) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 4(1) |
| G064 | 3126~3134 | 9 | 1순위 대표 목표 AI 초집중 모드 (Focus Auto-Pilot) | 0 | 3 | 쉬움(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 2(0) |
| G065 | 3135~3145 | 11 | 원터치 퀵 루틴 칩 | 0 | 1 | 쉬움(7) | 0 · 0 · 0 | 0 | 1/0 | 2 | 0 | 0/0 | 0 | 2(1) |
| G066 | 3146~3148 | 3 | 🎙️ 마이크 권한 거부 상태 자가 진단 및 1초 권한 허용 모달 (#TASK-ES-227) | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G067 | 3149~3219 | 71 | 음성 체크인 (Web Speech API) | 0 | 0 | 빈 구획(7) | 0 · 0 · 2 | 0 | 6/0 | 1 | 0 | 0/0 | 0 | 2(1) |
| G068 | 3220~3257 | 38 | 사진 인증 & 뷰어 모달 (가상유저 요청 P1) | 0 | 4 | 보통(16) | 0 · 0 · 2 | 0 | 2/2 | 4 | 0 | 0/0 | 0 | 3(2) |
| G069 | 3258~3270 | 13 | 체크인 입력 글자수 힌트 (#TASK-ES-367: 열 수 없던 활동 테마 선택 창·배지 제거, 승인 202 | 0 | 3 | 보통(15) | 0 · 0 · 2 | 0 | 0/0 | 5 | 0 | 0/0 | 0 | 3(1) |
| G070 | 3271~3279 | 9 | [#TASK-ES-225] [생각 메모장 95번] Gemini API 분당 쿼터(Rate Limit 429) | 0 | 1 | 쉬움(1) | 0 · 0 · 1 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G071 | 3280~3289 | 10 | 맞춤 피드백 봇 설정 | 0 | 0 | 빈 구획(11) | 0 · 0 · 2 | 0 | 3/0 | 3 | 0 | 0/0 | 0 | 2(1) |
| G072 | 3290~3292 | 3 | 목표 & 기록 선택 피드 공유 모달 (전면 고도화) | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G073 | 3293~3297 | 5 | [#TASK-ES-301] 피드 게시 모달 내 '미리보기' 토글 직통 헬퍼 | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G074 | 3298~3304 | 7 | 외부 데이터 불러오기 (mock) | 0 | 2 | 보통(16) | 0 · 0 · 3 | 0 | 1/0 | 5 | 0 | 0/0 | 0 | 2(1) |
| G075 | 3305~3333 | 29 | [#TASK-ES-174] 목표 템플릿 백과사전 전체화면 팝업 및 상호작용 | 0 | 7 | 어려움(27) | 0 · 0 · 5 | 0 | 3/0 | 11 | 0 | 0/0 | 0 | 3(0) |
| G076 | 3334~3361 | 28 | [#TASK-ES-146] 아워골 평가해주기 90% 팝업 | 0 | 5 | 어려움(37) | 0 · 0 · 7 | 0 | 3/1 | 12 | 0 | 0/0 | 0 | 7(2) |
| G077 | 3362~3368 | 7 | New goal modal | 0 | 0 | 빈 구획(3) | 0 · 0 · 1 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 0(0) |
| G078 | 3369~3369 | 1 | 참고자료 (유튜브/영상, 이미지, 텍스트 메모, 웹링크) | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G079 | 3370~3372 | 3 | 참고자료 (유튜브/영상, 이미지, 텍스트 메모, 웹링크) | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G080 | 3373~3391 | 19 | 목표 AI 생성 전체 템플릿 양식 및 세부 항목 미리보기 (Req 5) | 0 | 1 | 보통(16) | 0 · 0 · 4 | 0 | 2/0 | 6 | 0 | 0/0 | 0 | 1(0) |
| G081 | 3392~3398 | 7 | [#TASK-ES-264] 오늘의 미션 및 AI 피드백 조건부 호출 최적화 | 0 | 0 | 빈 구획(3) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 3(1) |
| G082 | 3399~3401 | 3 | 목표 탭 3계층 일정설정 / 디데이·기간 표시 및 캘린더 연동 (#TASK-ES-259, 메모장 03항, # | 0 | 0 | 빈 구획(3) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(1) |
| G083 | 3402~3404 | 3 | [#TASK-ES-220] [생각 메모장 91번] 교대근무자 가변형 루틴 프리셋 & 자동 스케줄러 | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G084 | 3405~3408 | 4 | [#TASK-ES-172] [27] 목표 탭: 데일리 루틴 서브탭 & 편집/상세 모달 | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G085 | 3409~3411 | 3 | RENDER: TEMPLATE ENCYCLOPEDIA SUBTAB (#TASK-ES-187) | 0 | 2 | 쉬움(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G086 | 3412~3420 | 9 | [#TASK-ES-189] 템플릿 백과사전 3대 분류(개인·루틴·팀) 및 AI/실유저 2원화 이식 시스템 | 0 | 4 | 보통(10) | 0 · 0 · 0 | 2 | 0/0 | 2 | 0 | 0/0 | 1 | 4(1) |
| G087 | 3421~3477 | 57 | [UI/UX 틀 개편 Phase 4] 목표 탭 노션급 데이터 관리 & 인지순행 IA (#TASK-UIUX-P | 2 | 0 | 어려움(58) | 0 · 1 · 6 | 5 | 0/0 | 4 | 2 | 0/0 | 1 | 17(11) |
| G088 | 3478~3481 | 4 | [PHASE 5] #TASK-UIUX-PHASE5-RECORDS-CALENDAR FUNCTIONS | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G089 | 3482~3496 | 15 | [PHASE 6] #TASK-UIUX-PHASE6-COMM-SETTINGS FUNCTIONS | 0 | 0 | 빈 구획(3) | 0 · 0 · 1 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 0(0) |
| G090 | 3497~3499 | 3 | RENDER: GOALS | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G091 | 3500~3528 | 29 | RENDER: 팀 목표 (팀장·매니저만 추가/수정/삭제, 팀원은 보기만) | 1 | 2 | 쉬움(5) | 0 · 0 · 4 | 0 | 0/0 | 0 | 0 | 1/0 | 0 | 4(0) |
| G092 | 3529~3539 | 11 | 개인 목표 200% 활용 가이드 & 템플릿 백과사전 (#TASK-ES-135) | 0 | 0 | 빈 구획(23) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 16 | 2(1) |
| G093 | 3540~3631 | 92 | [#TASK-ES-299] 팀 목표 댓글 작성 및 전송 직통 헬퍼 & 전역 이벤트 위임 (먹통 방어 100% | 0 | 0 | 빈 구획(31) | 0 · 2 · 11 | 1 | 2/0 | 3 | 0 | 0/0 | 3 | 6(2) |
| G094 | 3632~3638 | 7 | TASK-ES-307: 측정지표 다중 선택 및 동시 렌더링 엔진 | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 3(0) |
| G095 | 3639~3652 | 14 | 5대 테마 원형 라이프 밸런스 휠 (SVG Pie Chart) | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G096 | 3653~3660 | 8 | ⏱️ 인앱 인터벌 타이머 & 스톱워치 위젯 (In-Table Stopwatch) | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 2(0) |
| G097 | 3661~4841 | 1181 | 템플릿 마켓 · 복제 · 전문 템플릿 기록 (TASK-ES-013) | 3 | 0 | 어려움(106) | 0 · 1 · 50 | 0 | 3/41 | 1 | 0 | 1/1 | 0 | 39(17) |
| G098 | 4842~4869 | 28 | [#TASK-ES-358] 기록 탭 렌더 → js/tabs/records/period-ai-card.js · | 0 | 0 | 빈 구획(12) | 0 · 1 · 6 | 1 | 0/0 | 1 | 0 | 0/0 | 1 | 6(0) |
| G099 | 4870~4883 | 14 | 위클리 리캡 카드 (스포티파이 랩드 스타일, 공유 캔버스 인프라 재사용) | 0 | 2 | 보통(25) | 0 · 0 · 7 | 0 | 3/0 | 9 | 0 | 0/0 | 0 | 1(0) |
| G100 | 4884~4884 | 1 | RFC 5545 표준 iCalendar (.ics) 생성 순수 함수 (TASK-BG-11) | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G101 | 4885~5060 | 176 | 캘린더 실시간 구독 URL 생성기 (WebCal Feed & #TASK-ES-252 HMAC 서명) | 1 | 2 | 어려움(30) | 0 · 0 · 2 | 1 | 1/0 | 2 | 0 | 2/0 | 6 | 7(5) |
| G102 | 5061~5063 | 3 | 크리에이터 템플릿 (#TASK-ES-315, 64: 구형 창 영구 제거 및 무해화) | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 2(0) |
| G103 | 5064~5069 | 6 | 소통 피드 (Supabase feed_posts, 실시간 동기화) | 0 | 1 | 쉬움(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 3(0) |
| G104 | 5070~5078 | 9 | 전역 공유 팀 로더 & 렌더링 (#TASK-ES-133) | 0 | 1 | 쉬움(5) | 0 · 0 · 0 | 1 | 0/0 | 1 | 0 | 0/0 | 2 | 1(0) |
| G105 | 5079~5087 | 9 | 통합 딥링크 게이트웨이 & 게스트 소프트 뷰어 3종 (js/viral-sharing.js 위임) | 0 | 1 | 쉬움(5) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 1 | 1(0) |
| G106 | 5088~5094 | 7 | 마니또 실 유저 익명 응원 연동 (#TASK-ES-133, #TASK-ES-145) | 0 | 3 | 쉬움(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G107 | 5095~5101 | 7 | DM & 동반자 소통 시스템 (TASK-ES-105) | 0 | 0 | 빈 구획(3) | 0 · 0 · 1 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 1(0) |
| G108 | 5102~5113 | 12 | [#TASK-ES-354 CORE-07·SET-07] 설정 탭 렌더 → js/tabs/settings/ren | 0 | 0 | 이음매(옮기지 않음)(9) | 0 · 0 · 2 | 0 | 0/0 | 2 | 0 | 0/0 | 0 | 4(1) |
| G109 | 5114~5116 | 3 | 4대 연계 뷰 원자적 동시 전파 디스패처 (헌법 제1조 제4항 제5호 & 제15조 제6항 제3호) | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G110 | 5117~5121 | 5 | [#TASK-ES-264] 자정(00:00 KST / 현지 표준시) 날짜 변경 감지 및 자동 동기화 워처 | 0 | 1 | 쉬움(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 2(0) |
| G111 | 5122~5125 | 4 | 세션 복구 및 안전 앱 진입 유틸 | 0 | 1 | 쉬움(3) | 0 · 0 · 1 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 2(0) |
| G112 | 5126~5130 | 5 | #TASK-AUTH-P0-SAFETY: 로그인/계정 보안 패키지 모듈 연결 | 0 | 0 | 빈 구획(9) | 0 · 0 · 3 | 0 | 0/0 | 3 | 0 | 0/0 | 0 | 0(0) |
| G113 | 5131~5138 | 8 | KF-4 #TASK-ES-018: 카테고리별 도움이 된 글 슬롯 모듈(js/top-helpful.js) | 0 | 0 | 빈 구획(9) | 0 · 0 · 3 | 0 | 0/0 | 3 | 0 | 0/0 | 0 | 1(0) |
| G114 | 5139~5141 | 3 | #TASK-ES-105: 팀 연계 개인목표 및 상호 체크 모듈(js/team-linked-goals.js)  | 0 | 0 | 빈 구획(30) | 0 · 0 · 17 | 0 | 0/0 | 2 | 0 | 0/0 | 0 | 5(3) |
| G115 | 5142~5146 | 5 | KF-2 #TASK-ES-017: 템플릿 복제 크레딧 모듈(js/template-credit.js)에 앱 핸 | 0 | 0 | 빈 구획(5) | 0 · 0 · 3 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 1(0) |
| G116 | 5147~5152 | 6 | PWA: Service Worker 등록 및 자동 업데이트 감지 (#TASK-ES-118) | 0 | 0 | 빈 구획(38) | 0 · 0 · 4 | 1 | 1/0 | 3 | 0 | 0/0 | 27 | 0(0) |

## 5. 묶음별 의존 상세 (옮길 대상만, 권장 순서)

### G064 1순위 대표 목표 AI 초집중 모드 (Focus Auto-Pilot)

- 3126~3134줄(9줄) · 쉬움(0)
- 함수(0): 없음
- 변수(3): focusTimerInterval, focusTimerRunning, focusTimerSeconds
- 시험지 글자 의존: scripts/smoke-test.js, tests/trio-es143-es145.test.js

### G029 [78 / 89] 데이터분석 프롬프트 백과사전 (실사용 유저 등록·피드 게시 및 도움돼요 상호작용)

- 2843~2849줄(7줄) · 쉬움(0)
- 함수(0): 없음
- 변수(2): _promptEncyclopediaOpen, _promptTabState
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js

### G106 마니또 실 유저 익명 응원 연동 (#TASK-ES-133, #TASK-ES-145)

- 5088~5094줄(7줄) · 쉬움(0)
- 함수(0): 없음
- 변수(3): MANITO_SERVER_LOADED, REAL_MANITO_INBOX_CACHE, REAL_MANITO_PARTNERS_CACHE
- 시험지 글자 의존: scripts/smoke-test.js

### G025 #TASK-ES-165: 앱 진입 아바타 인사 팝업 (화면 절반 크기 & 시간대별 멘트)

- 2814~2819줄(6줄) · 쉬움(0)
- 함수(0): 없음
- 변수(1): __avatarGreetTimer

### G103 소통 피드 (Supabase feed_posts, 실시간 동기화)

- 5064~5069줄(6줄) · 쉬움(0)
- 함수(0): 없음
- 변수(1): FEED_POSTS_CACHE
- 시험지 글자 의존: scripts/smoke-test.js, tests/core-confirm-es376.test.js, tests/guest-null-client-es377.test.js

### G110 [#TASK-ES-264] 자정(00:00 KST / 현지 표준시) 날짜 변경 감지 및 자동 동기화 워처

- 5117~5121줄(5줄) · 쉬움(0)
- 함수(0): 없음
- 변수(1): _lastObservedDateKey
- 시험지 글자 의존: scripts/smoke-test.js, tests/ai-conditional-call-optimization.test.js

### G085 RENDER: TEMPLATE ENCYCLOPEDIA SUBTAB (#TASK-ES-187)

- 3409~3411줄(3줄) · 쉬움(0)
- 함수(0): 없음
- 변수(2): _subtabTplCat, _subtabTplQuery

### G012 [#TASK-ES-446] 인라인 스크립트 세포화 P2-1 이음매 (docs/architecture/INLINE-SCRIPT-MAP.md 지도 · docs/spe

- 2671~2679줄(9줄) · 쉬움(1)
- 함수(0): 없음
- 변수(5): openProCoachReportModal, openProNotionExportModal, pushRecordToNotion, renderAnalyticsHtml, renderTrendSvgChart
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: _recordsKit
- 시험지 글자 의존: scripts/smoke-test.js

### G070 [#TASK-ES-225] [생각 메모장 95번] Gemini API 분당 쿼터(Rate Limit 429) 방어 및 지수 백오프 큐

- 3271~3279줄(9줄) · 쉬움(1)
- 함수(0): 없음
- 변수(1): requestClaudeFeedback
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: requestServerAIFeedback
- 시험지 글자 의존: scripts/smoke-test.js

### G008 [#TASK-ES-444] 인라인 스크립트 세포화 P1 이음매 2 — 일정 배경·잠금화면 라이브, 소통 창·스토리 캔버스, 사진 인증, 목표 스타터·로컬 문장, 

- 2322~2328줄(7줄) · 쉬움(2)
- 함수(0): 없음
- 변수(3): compressImage, initKeyboardShield, openPhotoViewerModal
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: _recordsKit, _settingsKit
- 시험지 글자 의존: scripts/smoke-test.js

### G011 [#TASK-ES-436] 인라인 스크립트 세포화 P1 이음매 1 — 목표 AI·일정 설정, 기록 AI 피드백 (docs/architecture/INLINE-SC

- 2664~2670줄(7줄) · 쉬움(2)
- 함수(0): 없음
- 변수(3): requestAIFeedback, requestServerAIFeedback, sendGoalAgentMessage
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: _goalsKit, _recordsKit
- 시험지 글자 의존: scripts/smoke-test.js

### G019 Confetti

- 2756~2763줄(8줄) · 쉬움(3)
- 함수(0): 없음
- 변수(1): toastTimer
- 시험지 글자 의존: scripts/smoke-test.js, tests/core-toast-es361.test.js (index.html 단독 읽기: tests/core-toast-es361.test.js)

### G111 세션 복구 및 안전 앱 진입 유틸

- 5122~5125줄(4줄) · 쉬움(3)
- 함수(0): 없음
- 변수(1): _isEnteringApp
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindLoginRescueButtons
- 로드 중 문 1: 호출 1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js

### G017 아워골 앱 환경설정

- 2730~2751줄(22줄) · 쉬움(4)
- 함수(0): 없음
- 변수(1): OURGOAL_CONFIG
- 로드 중 문 1: IfStatement 1
- window 노출(1줄): OURGOAL_CONFIG
- 바깥 js 가 window 이름을 씀: js/streaks.js
- 시험지 글자 의존: scripts/smoke-test.js

### G051 최초 로그인 활용가이드 — 4대 탭 무블러(Zero Blur) 투명 라이브 프리뷰 융합

- 2982~2988줄(7줄) · 쉬움(4)
- 함수(0): 없음
- 변수(2): navButtons, screens
- 로드 중 문 2: var 초기값 실행 2
- 시험지 글자 의존: scripts/smoke-test.js, tests/hidden-entry-guard.test.js

### G091 RENDER: 팀 목표 (팀장·매니저만 추가/수정/삭제, 팀원은 보기만)

- 3500~3528줄(29줄) · 쉬움(5)
- 함수(1): setupUserSessionRealtime
- 변수(2): REALTIME_CHANNELS_SETUP, USER_SESSION_CHANNEL
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: getDeviceId, performLogout, sb, state
- 부르는 묶음(들어옴): G010×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-shipyard-modular.js, tests/core-confirm-es376.test.js, tests/guest-null-client-es377.test.js

### G042 P0: 비밀번호 찾기 (이메일 재설정 링크 발송)

- 2921~2930줄(10줄) · 쉬움(5)
- 함수(0): 없음
- 변수(1): fpBtn
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: openForgotPasswordModal
- 로드 중 문 2: var 초기값 실행 1 · IfStatement 1
- 이벤트 처리기: addEventListener 1 · on<이벤트> 대입 0
- 시험지 글자 의존: scripts/smoke-test.js

### G104 전역 공유 팀 로더 & 렌더링 (#TASK-ES-133)

- 5070~5078줄(9줄) · 쉬움(5)
- 함수(0): 없음
- 변수(1): SHARED_GROUPS_LOADED
- 로드 중 문 1: IfStatement 1
- window 노출(1줄): SHARED_GROUPS_LOADED
- 바깥 js 가 window 이름을 씀: js/tabs/comm/shared-groups.js, js/tabs/goals/team-goals-screen.js
- 시험지 글자 의존: scripts/smoke-test.js

### G105 통합 딥링크 게이트웨이 & 게스트 소프트 뷰어 3종 (js/viral-sharing.js 위임)

- 5079~5087줄(9줄) · 쉬움(5)
- 함수(0): 없음
- 변수(1): checkAndHandlePeerInviteUrl
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: handleDeepLinkRouting
- 로드 중 문 1: IfStatement 1
- window 노출(1줄): MANITO_STAMP_COOLDOWN
- 바깥 js 가 window 이름을 씀: js/tabs/comm/manito-basics.js
- 시험지 글자 의존: scripts/smoke-test.js

### G045 [#TASK-ES-160, #TASK-ES-166, #TASK-ES-180] 각 탭 200% 활용법 및 실제 우수 사용사례 쇼케이스 (최신 기능 전면 동기화)

- 2943~2948줄(6줄) · 쉬움(5)
- 함수(0): 없음
- 변수(1): tabGuideBtn
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindTabGuideHubButton
- 로드 중 문 2: var 초기값 실행 1 · 호출 1
- 시험지 글자 의존: scripts/smoke-test.js

### G046 앱 활용 가이드 다시보기

- 2949~2952줄(4줄) · 쉬움(5)
- 함수(0): 없음
- 변수(1): guideBtn
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindRestartGuideButton
- 로드 중 문 2: var 초기값 실행 1 · 호출 1
- 시험지 글자 의존: scripts/smoke-test.js

### G016 Supabase

- 2721~2729줄(9줄) · 쉬움(6)
- 함수(0): 없음
- 변수(4): SUPABASE_ANON_KEY, SUPABASE_URL, _pendingAuthSession, sb
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindSupabaseAuthStateListener
- 로드 중 문 1: 호출 1
- 시험지 글자 의존: scripts/smoke-test.js, tests/logout-scope-es399.test.js, tests/security-audit.test.js (index.html 단독 읽기: tests/security-audit.test.js)

### G053 Modal helper & Android Hardware Back Handler

- 2997~3004줄(8줄) · 쉬움(6)
- 함수(0): 없음
- 변수(2): _modalDismissGraceUntil, _modalHistoryPushed
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindModalPopstateBack
- 로드 중 문 1: 호출 1
- 시험지 글자 의존: scripts/smoke-test.js, tests/core-modal-es363.test.js (index.html 단독 읽기: tests/core-modal-es363.test.js)

### G065 원터치 퀵 루틴 칩

- 3135~3145줄(11줄) · 쉬움(7)
- 함수(0): 없음
- 변수(1): qRoutineRow
- 로드 중 문 2: var 초기값 실행 1 · IfStatement 1
- 이벤트 처리기: addEventListener 1 · on<이벤트> 대입 0
- 시험지 글자 의존: scripts/smoke-test.js, tests/theme-system-v4.test.js (index.html 단독 읽기: tests/theme-system-v4.test.js)

### G041 Goal category templates

- 2910~2920줄(11줄) · 쉬움(8)
- 함수(0): 없음
- 변수(1): authTabButtons
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindAuthTabButtons, bindSignupSubmit
- 로드 중 문 3: var 초기값 실행 1 · 호출 2
- 시험지 글자 의존: scripts/smoke-test.js, tests/guest-null-client-es377.test.js

### G047 1:1 고객 문의 / 버그 제보 (#TASK-ES-178)

- 2953~2957줄(5줄) · 쉬움(8)
- 함수(0): 없음
- 변수(1): footEmailEl
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindInquiryButtons, bindSupportEmailLink
- 로드 중 문 3: 호출 2 · var 초기값 실행 1

### G038 소셜 로그인 (카카오 / 실제 구글 OAuth 연동)

- 2893~2903줄(11줄) · 보통(9)
- 함수(0): 없음
- 변수(2): _googleOneTapNonce, _googleTokenClient
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindGoogleLoginClicks, bindKakaoLoginClicks
- 로드 중 문 2: 호출 2
- 시험지 글자 의존: tests/google-session-guard.test.js (index.html 단독 읽기: tests/google-session-guard.test.js)

### G014 [#TASK-ES-437] 인라인 스크립트 세포화 P0 이음매 (docs/architecture/INLINE-SCRIPT-MAP.md 지도 · docs/specs

- 2702~2710줄(9줄) · 보통(9)
- 함수(0): 없음
- 변수(1): showLegalModal
- 다른 묶음 상태 — 대입: __avatarGreetTimer · 변경: 없음 · 읽기: MOCK_GROUPS, __avatarGreetTimer, _settingsKit
- 로드 중 문 1: 호출 1
- 시험지 글자 의존: scripts/smoke-test.js

### G086 [#TASK-ES-189] 템플릿 백과사전 3대 분류(개인·루틴·팀) 및 AI/실유저 2원화 이식 시스템

- 3412~3420줄(9줄) · 보통(10)
- 함수(0): 없음
- 변수(4): _subtabTplCat, _subtabTplDomain, _subtabTplQuery, _subtabTplType
- 로드 중 문 2: window 노출 2
- window 노출(2줄): _subtabTplDomain, _subtabTplType
- 바깥 js 가 window 이름을 씀: js/tabs/goals/template-encyclopedia.js
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-shipyard-modular.js, scripts/verify-integrity-gate.js, tests/routine-tab-scheduler.test.js (index.html 단독 읽기: tests/routine-tab-scheduler.test.js)

### G037 2계정 상호작용 테스트 (테스터 B 직통 입장: #TASK-ES-169)

- 2884~2892줄(9줄) · 보통(13)
- 함수(0): 없음
- 변수(2): authTesterBBtn, landTesterBBtn
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindAuthTesterBButton, bindLandTesterBButton, startDevDebugButtons
- 로드 중 문 5: var 초기값 실행 2 · 호출 3
- 시험지 글자 의존: scripts/smoke-test.js

### G015 [#TASK-ES-442] 인라인 스크립트 세포화 P0 이음매 (docs/architecture/INLINE-SCRIPT-MAP.md 지도 · docs/specs

- 2711~2720줄(10줄) · 보통(14)
- 함수(0): 없음
- 변수(1): initDevDebugButtons
- 다른 묶음 상태 — 대입: _promptEncyclopediaOpen, _promptTabState · 변경: 없음 · 읽기: USER_SESSION_CHANNEL, _promptEncyclopediaOpen, _promptTabState, _settingsKit
- 로드 중 문 1: 호출 1
- 시험지 글자 의존: scripts/smoke-test.js, tests/dev-host-gate.test.js

### G043 P0: 회원 탈퇴 30일 유예(소프트 삭제) 복구 체크

- 2931~2938줄(8줄) · 보통(14)
- 함수(0): 없음
- 변수(1): resyncBtn
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindLoginSubmit, bindLogoutButton, bindResetButton, bindResyncAccountDataButton
- 로드 중 문 5: 호출 4 · var 초기값 실행 1
- 시험지 글자 의존: scripts/smoke-test.js

### G057 [#TASK-ES-153] 전역 7일 유예 통합 휴지통 (Recycle Bin) 시스템

- 3031~3071줄(41줄) · 보통(15)
- 함수(1): saveGoogleToken
- 변수(1): googleTokenClient
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: gcalCurrentUid, purgeLegacySharedGcalKeys, state
- 로드 중 문 1: IfStatement 1
- window 노출(1줄): saveGoogleToken
- 부르는 묶음(들어옴): G010×1
- 바깥 js 가 window 이름을 씀: js/auth-social.js, js/core/gcal-sync.js, js/tabs/settings/session-entry.js
- 시험지 글자 의존: scripts/smoke-test.js, tests/core-confirm-es376.test.js, tests/gcal-login-reconnect-fix.test.js (index.html 단독 읽기: tests/gcal-login-reconnect-fix.test.js)

### G069 체크인 입력 글자수 힌트 (#TASK-ES-367: 열 수 없던 활동 테마 선택 창·배지 제거, 승인 2026-10-04)

- 3258~3270줄(13줄) · 보통(15)
- 함수(0): 없음
- 변수(3): capInput, liveCount, liveMeta
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindCaptureLiveMeta, bindCaptureSave
- 로드 중 문 5: var 초기값 실행 3 · 호출 2
- 시험지 글자 의존: scripts/smoke-test.js, tests/module-guard.test.js, tests/theme-system-v4.test.js (index.html 단독 읽기: tests/theme-system-v4.test.js)

### G068 사진 인증 & 뷰어 모달 (가상유저 요청 P1)

- 3220~3257줄(38줄) · 보통(16)
- 함수(0): 없음
- 변수(4): capturePhotoBtn, capturePhotoInput, capturePhotoPreview, pendingCapturePhoto
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: compressImage, openPhotoViewerModal
- 로드 중 문 4: var 초기값 실행 3 · IfStatement 1
- 이벤트 처리기: addEventListener 2 · on<이벤트> 대입 2
- 시험지 글자 의존: scripts/smoke-test.js, tests/goals-schedule-sync.test.js, tests/today-mission-card-guide.test.js (index.html 단독 읽기: tests/goals-schedule-sync.test.js, tests/today-mission-card-guide.test.js)

### G080 목표 AI 생성 전체 템플릿 양식 및 세부 항목 미리보기 (Req 5)

- 3373~3391줄(19줄) · 보통(16)
- 함수(0): 없음
- 변수(1): toggleAgentBtn
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindArchivedPageSetter, bindArchivedPeriodSetter, bindGoalAgentToggle, sendGoalAgentMessage
- 로드 중 문 6: var 초기값 실행 1 · 호출 5
- 이벤트 처리기: addEventListener 2 · on<이벤트> 대입 0
- 시험지 글자 의존: scripts/smoke-test.js

### G036 [#TASK-ES-222] [생각 메모장 92번] 카카오톡 인앱 브라우저 감지 및 Android Chrome 자동 탈출 & iOS Safari 플로팅 가이드 배너

- 2874~2883줄(10줄) · 보통(16)
- 함수(0): 없음
- 변수(2): landGuestBtn, landNickQuickLink
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindLandGuestBtn, bindLandLoginLink, bindLandNickQuickLink, checkKakaoInAppBrowser
- 로드 중 문 6: 호출 4 · var 초기값 실행 2
- 시험지 글자 의존: scripts/smoke-test.js

### G074 외부 데이터 불러오기 (mock)

- 3298~3304줄(7줄) · 보통(16)
- 함수(0): 없음
- 변수(2): btnShowGuide, topBtnGuide
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindImportExternalBtn, bindPersonalGuideBtn, state
- 로드 중 문 5: 호출 2 · var 초기값 실행 2 · IfStatement 1
- 이벤트 처리기: addEventListener 1 · on<이벤트> 대입 0
- 시험지 글자 의존: scripts/smoke-test.js, tests/top-page-guide-reposition.test.js (index.html 단독 읽기: tests/top-page-guide-reposition.test.js)

### G020 8대 화면 스타일 (테마) 정의

- 2764~2778줄(15줄) · 보통(17)
- 함수(0): 없음
- 변수(1): THEMES
- 로드 중 문 1: IfStatement 1
- window 노출(1줄): THEMES
- 바깥 js 가 window 이름을 씀: js/tabs/settings/sub-appearance.js, js/tabs/settings/theme-apply.js
- 시험지 글자 의존: scripts/smoke-test.js, tests/account-switch-isolation.test.js, tests/comm-ai-identity-es348.test.js, tests/direct-login-guard.test.js, tests/dm-push-auth-es397.test.js, tests/feed-ai-bot-reduction.test.js, tests/google-session-guard.test.js, tests/hidden-entry-guard.test.js 외 2 (index.html 단독 읽기: tests/comm-ai-identity-es348.test.js, tests/google-session-guard.test.js, tests/team-goal-guide-hint.test.js, tests/theme-system-v4.test.js)

### G013 [#TASK-ES-448] 인라인 스크립트 세포화 P2-2 이음매 (docs/architecture/INLINE-SCRIPT-MAP.md 지도 · docs/spe

- 2680~2701줄(22줄) · 보통(19)
- 함수(0): 없음
- 변수(6): MOCK_PEOPLE, daysFromNow, groupState, playTimerBeep, renderLapRowsHtml, renderStopwatchWidgetHtml
- 다른 묶음 상태 — 대입: FEED_POSTS_CACHE · 변경: 없음 · 읽기: FEED_POSTS_CACHE, MOCK_GROUPS, _commKit, _goalsKit, _recordsKit
- 로드 중 문 2: 호출 1 · TryStatement 1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js, tests/core-confirm-es376.test.js, tests/hidden-entry-guard.test.js, tests/stopwatch-lap-inputs.test.js, tests/stopwatch-table-hint.test.js, tests/team-fold-state-es409.test.js, tests/theme-system-v4.test.js (index.html 단독 읽기: tests/team-fold-state-es409.test.js, tests/theme-system-v4.test.js)

### G099 위클리 리캡 카드 (스포티파이 랩드 스타일, 공유 캔버스 인프라 재사용)

- 4870~4883줄(14줄) · 보통(25)
- 함수(0): 없음
- 변수(2): btnOpenTt, staticPulseBar
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindRecCarouselPills, bindRecDocumentClick, bindRecPulseBar, bindRecTimeTrackerBtn, openRecordModal, openWeeklyRecapModal, renderRecordsScreen
- 로드 중 문 9: 호출 7 · var 초기값 실행 2
- 이벤트 처리기: addEventListener 3 · on<이벤트> 대입 0
- 시험지 글자 의존: scripts/smoke-test.js

### G075 [#TASK-ES-174] 목표 템플릿 백과사전 전체화면 팝업 및 상호작용

- 3305~3333줄(29줄) · 어려움(27)
- 함수(0): 없음
- 변수(7): _tplActiveTab, _tplAiCurCat, btnCloseTplEncycl, btnHeaderTplEncycl, modalTplEncyclElem, tabBtnAi, tabBtnReal
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindHeaderTemplateEncyclopediaClick, bindTemplateEncyclopediaEscape, bindTemplateEncyclopediaModalClick, closeTemplateEncyclopediaModal, switchTemplateEncyclopediaTab
- 로드 중 문 11: var 초기값 실행 5 · IfStatement 3 · 호출 3
- 이벤트 처리기: addEventListener 3 · on<이벤트> 대입 0
- 시험지 글자 의존: scripts/smoke-test.js, tests/goal-template-legacy-cleanup.test.js, tests/goal-templates-encyclopedia.test.js

### G101 캘린더 실시간 구독 URL 생성기 (WebCal Feed & #TASK-ES-252 HMAC 서명)

- 4885~5060줄(176줄) · 어려움(30)
- 함수(1): shareContent
- 변수(2): MOCK_GROUPS, _cachedSignedCalendarToken
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: daysFromNow, openExportThemeModal
- 로드 중 문 2: 호출 1 · window 노출 1
- window 노출(1줄): shareContent
- 이벤트 처리기: addEventListener 1 · on<이벤트> 대입 0
- 부르는 묶음(들어옴): G010×1, G097×1
- 바깥 js 가 window 이름을 씀: js/tabs/comm/feed-list.js, js/tabs/comm/share-card.js, js/tabs/records/export-theme.js, js/team-share.js, js/team-templates.js, js/viral-sharing.js
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js, tests/security-audit.test.js, tests/team-fold-state-es409.test.js, tests/team-level-accordion-es406.test.js, tests/team-level-management.test.js, tests/team-tasks-toggle-es410.test.js (index.html 단독 읽기: tests/security-audit.test.js, tests/team-fold-state-es409.test.js, tests/team-level-accordion-es406.test.js, tests/team-level-management.test.js, tests/team-tasks-toggle-es410.test.js)

### G024 [#TASK-ES-150] 아바타 레벨업 대형 팝업 & 성장 성향 키워드

- 2794~2813줄(20줄) · 어려움(32)
- 함수(0): 없음
- 변수(6): avLvModalElem, btnAvLvClose, btnAvLvConfirm, btnSaveGrowth, btnSaveLvImg, btnShareLv
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindAvatarGrowthPromptSave, bindAvatarLevelUpBackdrop, bindAvatarLevelUpSaveImage, bindAvatarLevelUpShare, closeAvatarLevelUpModal
- 로드 중 문 12: var 초기값 실행 6 · IfStatement 2 · 호출 4
- 이벤트 처리기: addEventListener 2 · on<이벤트> 대입 0
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js, tests/avatar-10slots-growth.test.js (index.html 단독 읽기: tests/avatar-10slots-growth.test.js)

### G076 [#TASK-ES-146] 아워골 평가해주기 90% 팝업

- 3334~3361줄(28줄) · 어려움(37)
- 함수(0): 없음
- 변수(5): btnEvalBanner, btnEvalClose, btnSubmitEval, challengeBtn, modalEvalElem
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindAppEvalBackdrop, bindAppEvalSubmit, bindHomeAddGoal, closeAppEvaluationModal, openAppEvaluationModal, openMzShareCardModal, setTab
- 로드 중 문 12: var 초기값 실행 5 · IfStatement 3 · 호출 4
- 이벤트 처리기: addEventListener 3 · on<이벤트> 대입 1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js, tests/app-evaluation-modal.test.js, tests/home-customizer-auto-sync.test.js, tests/sync-server-records-render-home.test.js, tests/team-goal-comment-fix.test.js, tests/trio-es143-es145.test.js (index.html 단독 읽기: tests/home-customizer-auto-sync.test.js, tests/sync-server-records-render-home.test.js)

### G087 [UI/UX 틀 개편 Phase 4] 목표 탭 노션급 데이터 관리 & 인지순행 IA (#TASK-UIUX-PHASE4-GOALS)

- 3421~3477줄(57줄) · 어려움(58)
- 함수(2): handleGoalFastAddSubmit, selectSmartTag
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: dispatchFullViewPropagation, renderGoalsScreen, saveProfile, state, toast, triggerHapticFeedback
- 로드 중 문 4: window 노출 4
- window 노출(5줄): currentGoalStatPeriod, handleGoalFastAddSubmit, selectSmartTag, selectedGoalSmartTag
- 인라인 on*="…" 이 부르는 함수: handleGoalFastAddSubmit, selectSmartTag
- 바깥 js 가 window 이름을 씀: js/tabs/goals/goals-ia-actions.js
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-calendar-attachments.js, scripts/verify-integrity-gate.js, tests/ai-conditional-call-optimization.test.js, tests/core-confirm-es376.test.js, tests/goal-ai-advice-status.test.js, tests/goals-only-view.test.js, tests/goals-schedule-sync.test.js 외 9 (index.html 단독 읽기: scripts/test-calendar-attachments.js, tests/goal-ai-advice-status.test.js, tests/goals-only-view.test.js, tests/goals-schedule-sync.test.js, tests/goals-smart-attachments.test.js, tests/record-ledger-sync.test.js, tests/routine-tab-scheduler.test.js, tests/sync-server-records-render-home.test.js 외 3)

### G097 템플릿 마켓 · 복제 · 전문 템플릿 기록 (TASK-ES-013)

- 3661~4841줄(1181줄) · 어려움(106)
- 함수(3): executeDirectTemplateClone, openProTemplateRecordModal, openTemplateMarketModal
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: CURATED_MARKET_TEMPLATES, XP_RULES, awardXP, burstConfetti, checkRecordDeepLink, closeModal, computeTrendChartData, downloadTableAsCsv, escapeHtml, fmtYYMMDD, formatStopwatchTime, getAllProTemplates 외 38
- 로드 중 문 1: 호출 1
- 이벤트 처리기: addEventListener 3 · on<이벤트> 대입 41
- 부르는 묶음(들어옴): G002×2
- 부르는 대상(나감): G101×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-calendar-attachments.js, scripts/test-shipyard-modular.js, scripts/verify-all-clicks.js, scripts/verify-integrity-gate.js, tests/account-switch-isolation.test.js, tests/account-withdrawal-modal.test.js, tests/achievement-graph-multiset.test.js 외 31 (index.html 단독 읽기: scripts/test-calendar-attachments.js, tests/account-withdrawal-modal.test.js, tests/avatar-personas-split.test.js, tests/goal-ai-advice-status.test.js, tests/goal-templates-data-split.test.js, tests/goals-only-view.test.js, tests/goals-schedule-sync.test.js, tests/goals-smart-attachments.test.js 외 9)

### G010 [#TASK-ES-432] 인라인 스크립트 세포화 2차 이음매 (docs/architecture/INLINE-SCRIPT-MAP.md 지도 · docs/specs

- 2334~2663줄(330줄) · 어려움(247)
- 함수(0): 없음
- 변수(148): CURATED_MARKET_TEMPLATES, TEAM_COMMENTS_CACHE, _authSocialKit, _creatorTemplatesLegacyKit, _curatedMarketDataKit, _homeKit, _levelBadgeKit, _modalOpenKit, _uiKit, _visionTableInputKit, bindAppEvalBackdrop, bindAppEvalSubmit, bindArchivedPageSetter, bindArchivedPeriodSetter, bindAuthTabButtons, bindAuthTesterBButton, bindAvatarGrowthPromptSave, bindAvatarLevelUpBackdrop, bindAvatarLevelUpSaveImage, bindAvatarLevelUpShare 외 128
- 다른 묶음 상태 — 대입: MANITO_SERVER_LOADED, REALTIME_CHANNELS_SETUP, REAL_MANITO_INBOX_CACHE, REAL_MANITO_PARTNERS_CACHE, SHARED_GROUPS_LOADED, _cachedSignedCalendarToken, _googleOneTapNonce, _googleTokenClient, _isEnteringApp, _lastObservedDateKey, _modalDismissGraceUntil, _modalHistoryPushed 외 12 · 변경: 없음 · 읽기: MANITO_SERVER_LOADED, MOCK_PEOPLE, REALTIME_CHANNELS_SETUP, REAL_MANITO_INBOX_CACHE, REAL_MANITO_PARTNERS_CACHE, SHARED_GROUPS_LOADED, _cachedSignedCalendarToken, _calendarKit, _commKit, _goalsKit, _googleOneTapNonce, _googleTokenClient 외 54
- 로드 중 문 17: 호출 17
- 부르는 대상(나감): G057×1, G091×1, G101×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-calendar-attachments.js, scripts/verify-integrity-gate.js, tests/account-switch-isolation.test.js, tests/account-withdrawal-modal.test.js, tests/avatar-personas-split.test.js, tests/comm-post-feed-button-fix.test.js, tests/core-confirm-es374.test.js 외 26 (index.html 단독 읽기: scripts/test-calendar-attachments.js, tests/account-withdrawal-modal.test.js, tests/avatar-personas-split.test.js, tests/comm-post-feed-button-fix.test.js, tests/core-modal-es363.test.js, tests/core-toast-es361.test.js, tests/gcal-login-reconnect-fix.test.js, tests/google-session-guard.test.js 외 9)

### G026 뱃지 컬렉션 (명예의 전당)

- 2820~2831줄(12줄) · 어려움(266)
- 함수(0): 없음
- 변수(1): state
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: isoDate
- 로드 중 문 1: IfStatement 1
- window 노출(1줄): state
- 바깥 js 가 window 이름을 씀: js/auth-safety.js, js/auth-social.js, js/avatar/dynamic-album.js, js/avatar/feature-cards.js, js/avatar/level-badge.js, js/avatar/modal/bind-craft.js, js/avatar/modal/bind-deck.js, js/avatar/modal/bind-save.js 외 248
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-shipyard-modular.js, scripts/verify-integrity-gate.js, tests/routine-tab-scheduler.test.js, tests/unique-display-name.test.js (index.html 단독 읽기: tests/routine-tab-scheduler.test.js, tests/unique-display-name.test.js)

## 6. 이음매·빈 구획

- G000 2254~2256(3줄) (IIFE 머리 — "use strict" 와 첫 구획 앞) — 빈 구획
- G001 2257~2276(20줄) [#TASK-ES-354 CORE-07] 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL.md) — 이음매(옮기지 않음) · 로드 중 문 1
- G002 2277~2288(12줄) [#TASK-ES-358] 기록 탭 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL.md) — 이음매(옮기지 않음) · 로드 중 문 1
- G003 2289~2294(6줄) [#TASK-ES-360] 일정 탭 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL.md, 기록 탭 #TASK-ES-358 과 같은 틀) — 이음매(옮기지 않음)
- G004 2295~2303(9줄) [#TASK-ES-370] 목표 탭 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL.md, 일정 탭 #TASK-ES-360 과 같은 틀) — 이음매(옮기지 않음) · 로드 중 문 1
- G005 2304~2307(4줄) [#TASK-ES-453] 인라인 스크립트 세포화 P1 이음매 3 — 목표 종합상황 AI 요약 새로 고침 (docs/architecture/INLINE-SCRIP — 빈 구획
- G006 2308~2311(4줄) [#TASK-ES-375] 목표 탭 모듈 이음매 2차 (docs/specs/MODULE-SPLIT-PROTOCOL.md, 1차 #TASK-ES-370 과 같은 틀 — 이음매(옮기지 않음)
- G007 2312~2321(10줄) [#TASK-ES-379] 소통 탭 모듈 이음매 1차 (docs/specs/MODULE-SPLIT-PROTOCOL.md, 목표 탭 #TASK-ES-370·#TAS — 이음매(옮기지 않음) · 로드 중 문 1
- G009 2329~2333(5줄) [#TASK-ES-423] 인라인 스크립트 세포화 1차 이음매 (docs/architecture/INLINE-SCRIPT-MAP.md 지도 · docs/specs — 이음매(옮기지 않음)
- G018 2752~2755(4줄) [#TASK-ES-264] 표준 시간대(한국 KST 00:00, 타 국가는 해당 국가 표준시 00:00) 기준 날짜 키 — 빈 구획
- G021 2779~2781(3줄) 가상유저 개선 10대 핵심 헬퍼 함수 — 빈 구획
- G022 2782~2789(8줄) [#TASK-ES-345 CAL-02] 구글 캘린더 토큰·일정 캐시 계정 격리 — 빈 구획
- G023 2790~2793(4줄) XP/레벨 시스템 — 빈 구획
- G027 2832~2834(3줄) [70] 다른 모든 기기 원격 로그아웃 전 로그인 기기 목록 확인 모달 — 빈 구획
- G028 2835~2842(8줄) [71] 앱 잠금 PIN (이 기기) — 설정·해제·앱 진입 확인 — 빈 구획
- G030 2850~2853(4줄) [80] 템플릿백과사전 1초 자동이식 선택 연동 및 로드맵-목표상태 동기화 — 빈 구획
- G031 2854~2856(3줄) [82] 팀 목표 내 '팀 연계 개인목표' 생성 모달 — 빈 구획
- G032 2857~2860(4줄) [83] 팀원 초대 시 '아워골 동반자 초대하기' 인앱 초대·참가 기능 — 빈 구획
- G033 2861~2863(3줄) [88] 오늘의 3초 체크인 목표 버튼 선택 시 플레이스홀더(백그라운드 가이드) 예시 문구 렌더링 — 빈 구획
- G034 2864~2872(9줄) [#TASK-UIUX-PHASE3-HOME-COCKPIT] 홈 1초 조망 ↔ 무저항 체크인 콕핏 8대 과업 — 빈 구획 · 로드 중 문 1
- G035 2873~2873(1줄) Landing — 빈 구획
- G039 2904~2906(3줄) [#TASK-ES-224] [생각 메모장 94번] 게스트(둘러보기) 3회 기록 시 안전 백업 넛지 및 카카오 무손실 계정 통합 — 빈 구획
- G040 2907~2909(3줄) [#TASK-ES-224] [생각 메모장 94번] 카카오/소셜/일반 로그인 시 게스트 데이터 100% 무손실 비파괴 합집합(Union Merge) 이관 — 빈 구획
- G044 2939~2942(4줄) 회원 탈퇴 전용 안내 모달 및 법적책임·데이터분실 사전 안내 (#TASK-ES-158) — 빈 구획 · 로드 중 문 1
- G048 2958~2971(14줄) 이용약관 / 개인정보처리방침 열람 리스너 — 빈 구획 · 로드 중 문 8
- G049 2972~2974(3줄) Onboarding (first-time, after signup) — 16종 동물 아바타 & 직관적 안착 융합 — 빈 구획
- G050 2975~2981(7줄) 3단계: 첫 체크인 튜토리얼 가이드 및 축하 연출 — 빈 구획
- G052 2989~2996(8줄) 조선소 블록 레지스트리 6대 메가블록 초기화 (헌법 제3조 제9항) — 빈 구획 · 로드 중 문 3
- G054 3005~3021(17줄) 이용약관 & 개인정보처리방침 모달 — 빈 구획
- G055 3022~3029(8줄) 프로필 — 빈 구획 · 로드 중 문 1
- G056 3030~3030(1줄) 구글 캘린더 연동 — 빈 구획
- G058 3072~3086(15줄) [#TASK-ES-153 & #TASK-ES-155] 캘린더 일자별 배경 사진 지정 모달 — 빈 구획
- G059 3087~3095(9줄) [#TASK-ES-181 & #TASK-ES-182] 폰 잠금화면에서 바로 보기 통합 허브 모달 — 빈 구획
- G060 3096~3100(5줄) Adaptive UX Mode — 빈 구획
- G061 3101~3103(3줄) Social Crew Pacing (#TASK-ES-228) — 빈 구획
- G062 3104~3109(6줄) UX Telemetry (Hesitation & Rage Tap) — 빈 구획 · 로드 중 문 1
- G063 3110~3125(16줄) iOS 사파리 홈 화면 추가 안내 배너 & 실시간 알림 가이드 (#TASK-ES-234) — 빈 구획
- G066 3146~3148(3줄) 🎙️ 마이크 권한 거부 상태 자가 진단 및 1초 권한 허용 모달 (#TASK-ES-227) — 빈 구획
- G067 3149~3219(71줄) 음성 체크인 (Web Speech API) — 빈 구획 · 로드 중 문 1
- G071 3280~3289(10줄) 맞춤 피드백 봇 설정 — 빈 구획 · 로드 중 문 3
- G072 3290~3292(3줄) 목표 & 기록 선택 피드 공유 모달 (전면 고도화) — 빈 구획
- G073 3293~3297(5줄) [#TASK-ES-301] 피드 게시 모달 내 '미리보기' 토글 직통 헬퍼 — 빈 구획
- G077 3362~3368(7줄) New goal modal — 빈 구획 · 로드 중 문 1
- G078 3369~3369(1줄) 참고자료 (유튜브/영상, 이미지, 텍스트 메모, 웹링크) — 빈 구획
- G079 3370~3372(3줄) 참고자료 (유튜브/영상, 이미지, 텍스트 메모, 웹링크) — 빈 구획
- G081 3392~3398(7줄) [#TASK-ES-264] 오늘의 미션 및 AI 피드백 조건부 호출 최적화 — 빈 구획
- G082 3399~3401(3줄) 목표 탭 3계층 일정설정 / 디데이·기간 표시 및 캘린더 연동 (#TASK-ES-259, 메모장 03항, #TASK-ES-135) — 빈 구획
- G083 3402~3404(3줄) [#TASK-ES-220] [생각 메모장 91번] 교대근무자 가변형 루틴 프리셋 & 자동 스케줄러 — 빈 구획
- G084 3405~3408(4줄) [#TASK-ES-172] [27] 목표 탭: 데일리 루틴 서브탭 & 편집/상세 모달 — 빈 구획
- G088 3478~3481(4줄) [PHASE 5] #TASK-UIUX-PHASE5-RECORDS-CALENDAR FUNCTIONS — 빈 구획
- G089 3482~3496(15줄) [PHASE 6] #TASK-UIUX-PHASE6-COMM-SETTINGS FUNCTIONS — 빈 구획 · 로드 중 문 1
- G090 3497~3499(3줄) RENDER: GOALS — 빈 구획
- G092 3529~3539(11줄) 개인 목표 200% 활용 가이드 & 템플릿 백과사전 (#TASK-ES-135) — 빈 구획 · 로드 중 문 1
- G093 3540~3631(92줄) [#TASK-ES-299] 팀 목표 댓글 작성 및 전송 직통 헬퍼 & 전역 이벤트 위임 (먹통 방어 100%) — 빈 구획 · 로드 중 문 3
- G094 3632~3638(7줄) TASK-ES-307: 측정지표 다중 선택 및 동시 렌더링 엔진 — 빈 구획
- G095 3639~3652(14줄) 5대 테마 원형 라이프 밸런스 휠 (SVG Pie Chart) — 빈 구획
- G096 3653~3660(8줄) ⏱️ 인앱 인터벌 타이머 & 스톱워치 위젯 (In-Table Stopwatch) — 빈 구획
- G098 4842~4869(28줄) [#TASK-ES-358] 기록 탭 렌더 → js/tabs/records/period-ai-card.js · render.js 로 옮김 — 빈 구획 · 로드 중 문 1
- G100 4884~4884(1줄) RFC 5545 표준 iCalendar (.ics) 생성 순수 함수 (TASK-BG-11) — 빈 구획
- G102 5061~5063(3줄) 크리에이터 템플릿 (#TASK-ES-315, 64: 구형 창 영구 제거 및 무해화) — 빈 구획
- G107 5095~5101(7줄) DM & 동반자 소통 시스템 (TASK-ES-105) — 빈 구획 · 로드 중 문 1
- G108 5102~5113(12줄) [#TASK-ES-354 CORE-07·SET-07] 설정 탭 렌더 → js/tabs/settings/render.js · sub-*.js 로 옮김 — 이음매(옮기지 않음) · 로드 중 문 2
- G109 5114~5116(3줄) 4대 연계 뷰 원자적 동시 전파 디스패처 (헌법 제1조 제4항 제5호 & 제15조 제6항 제3호) — 빈 구획
- G112 5126~5130(5줄) #TASK-AUTH-P0-SAFETY: 로그인/계정 보안 패키지 모듈 연결 — 빈 구획 · 로드 중 문 3
- G113 5131~5138(8줄) KF-4 #TASK-ES-018: 카테고리별 도움이 된 글 슬롯 모듈(js/top-helpful.js) — 빈 구획 · 로드 중 문 3
- G114 5139~5141(3줄) #TASK-ES-105: 팀 연계 개인목표 및 상호 체크 모듈(js/team-linked-goals.js) 연결 — 빈 구획 · 로드 중 문 2
- G115 5142~5146(5줄) KF-2 #TASK-ES-017: 템플릿 복제 크레딧 모듈(js/template-credit.js)에 앱 핸들 연결 — 빈 구획 · 로드 중 문 1
- G116 5147~5152(6줄) PWA: Service Worker 등록 및 자동 업데이트 감지 (#TASK-ES-118) — 빈 구획 · 로드 중 문 3
