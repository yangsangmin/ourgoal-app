# index.html 인라인 스크립트 책임 묶음 지도

> 생성: `NODE_PATH=<node_modules> node scripts/inline-script-map.js --write` (#TASK-ES-423). **손으로 고치지 않는다** — 다시 만들면 같은 입력에서 같은 글자가 나온다(결정적).
> 출처: `index.html` sha256 앞 12자 `45919cc17640` · 큰 인라인 IIFE 2331~21401줄(19071줄) · 다른 인라인 블록 4줄(8줄), 21404줄(16줄).

## 1. 요약

- 묶음 154개(이음매 8 · 옮길 대상 100 · 빈 구획 46). 묶음 = IIFE 최상위 구획 주석 `/* ============ 제목 ============ */` 에서 다음 구획 주석 앞까지.
- 최상위 함수 249 · 최상위 변수 414 · window 전역 대입 239줄(module-metrics ③ 의 index.html 몫과 같은 정규식) · addEventListener 283 · on<이벤트> 대입 217 · 로드 중 바로 도는 최상위 문 340 · 인라인 on*="…" 처리기가 부르는 IIFE 이름 46개.
- 난이도 묶음 수(줄): 쉬움 21(360줄) · 보통 36(2992줄) · 어려움 43(14449줄) · 빈 구획 46(744줄) · 이음매(옮기지 않음) 8(526줄).

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
| G110 | 개인 목표 200% 활용 가이드 & 템플릿 백과사전 (#TASK-ES-135) | 1956 | 11 | 어려움(112) | 0/2/22 | 4 | 6 | 33(16) |
| G120 | 템플릿 복제 보상형 광고(Rewarded Ad) 파이프라인 (TASK-ES-013) | 1379 | 12 | 어려움(71) | 0/1/36 | 2 | 4 | 14(3) |
| G087 | 맞춤 피드백 봇 설정 | 1085 | 18 | 어려움(90) | 1/2/24 | 7 | 12 | 20(8) |
| G119 | CSV / 엑셀 양방향 연동 & 스마트워치 매핑 & 목표 3각 추적 | 864 | 11 | 보통(24) | 0/0/4 | 0 | 1 | 9(3) |
| G069 | [#TASK-ES-181 & #TASK-ES-182] 폰 잠금화면에서 바로 보기 통합 허브 모달 | 829 | 7 | 어려움(121) | 0/0/20 | 1 | 13 | 21(4) |
| G101 | [#TASK-ES-172] [27] 목표 탭: 데일리 루틴 서브탭 & 편집/상세 모달 | 701 | 3 | 어려움(37) | 0/1/9 | 1 | 2 | 15(6) |
| G128 | 피드 상호소통 댓글 & 리액션 헬퍼 (#TASK-ES-133 서버 DB 실시간 동기화) | 635 | 2 | 어려움(37) | 1/1/19 | 0 | 3 | 15(3) |
| G122 | 위클리 리캡 카드 (스포티파이 랩드 스타일, 공유 캔버스 인프라 재사용) | 612 | 7 | 어려움(69) | 0/1/20 | 10 | 8 | 14(4) |
| G129 | 전역 공유 팀 로더 & 렌더링 (#TASK-ES-133) | 592 | 5 | 어려움(52) | 0/2/27 | 2 | 3 | 14(4) |
| G063 | 프로필 | 574 | 8 | 어려움(76) | 0/1/15 | 5 | 9 | 20(9) |

## 3. 권장 순서 (안전한 것부터, 상위 30)

같은 점수면 큰 묶음 먼저(한 번 옮겨 많이 줄인다). 로드 중 문이 있는 묶음은 함수만 옮기고 그 문은 원래 자리에 남긴다(MODULE-SPLIT-PROTOCOL 3절).

| 순서 | 묶음 | 제목 | 줄 | 점수 | 근거(점수가 생긴 곳) |
|--:|---|---|--:|--:|---|
| 1 | G075 | 신규 유저 10초 활성화: 갓생 스타터 목표 템플릿 | 42 | 0 | 없음 |
| 2 | G084 | AI feedback (best-effort; provider-aware; local fallback) | 13 | 0 | 없음 |
| 3 | G062 | 결과 기록 (체크박스 대신 수치 입력) | 10 | 0 | 없음 |
| 4 | G078 | 1순위 대표 목표 AI 초집중 모드 (Focus Auto-Pilot) | 10 | 0 | 없음 |
| 5 | G029 | [78 / 89] 데이터분석 프롬프트 백과사전 (실사용 유저 등록·피드 게시 및 도움돼요 상호작용) | 7 | 0 | 없음 |
| 6 | G102 | RENDER: TEMPLATE ENCYCLOPEDIA SUBTAB (#TASK-ES-187) | 3 | 0 | 없음 |
| 7 | G127 | 소통 피드 (Supabase feed_posts, 실시간 동기화) | 3 | 0 | 없음 |
| 8 | G046 | P0: 새 비밀번호 입력 모달 (비밀번호 복구 링크 수신 시) | 9 | 1 | 들어옴 1 |
| 9 | G143 | 세션 복구 및 안전 앱 진입 유틸 | 4 | 3 | 상태 읽기 1 · 로드 중 문 1 |
| 10 | G043 | Goal category templates | 38 | 4 | 로드 중 문 2 |
| 11 | G045 | P0: 비밀번호 찾기 (이메일 재설정 링크 발송) | 10 | 4 | 로드 중 문 2 |
| 12 | G050 | 앱 활용 가이드 다시보기 | 8 | 4 | 로드 중 문 2 |
| 13 | G061 | 목표 일정 리스케일링 | 36 | 6 | 상태 읽기 1 · FN_NAMES 1 |
| 14 | G016 | 아워골 앱 환경설정 및 보상형 광고 파이프라인 (TASK-ES-013) | 30 | 6 | 로드 중 문 1 · window 1 · 바깥 파일 3 |
| 15 | G011 | [#TASK-ES-446] 인라인 스크립트 세포화 P2-1 이음매 (docs/architecture/INLI | 24 | 6 | 상태 읽기 4 · 로드 중 문 1 |
| 16 | G022 | 구독 상태 (전체 기능 100% 완전 무료 제공) | 8 | 6 | 상태 읽기 1 · FN_NAMES 1 |
| 17 | G139 | 받은 응원 알림 (실제 내 게시물 응원 수 + 마니또 받은 응원함) | 34 | 7 | 상태 읽기 6 · 들어옴 1 |
| 18 | G060 | 안내 모달 (전체 기능 100% 완전 무료 제공) | 31 | 7 | 상태 읽기 2 · 로드 중 문 1 · 들어옴 2 · window 1 |
| 19 | G135 | 방해금지 시간대(DND, 조용한 시간) 판별 순수 함수 (TASK-BG-7) | 21 | 7 | 들어옴 2 · FN_NAMES 1 |
| 20 | G079 | 원터치 퀵 루틴 칩 | 11 | 7 | 로드 중 문 2 · 시험지(index 단독) 1 |
| 21 | G005 | [#TASK-ES-453] 인라인 스크립트 세포화 P1 이음매 3 — 목표 종합상황 AI 요약 새로 고침 ( | 8 | 7 | 상태 읽기 2 · 로드 중 문 1 · 시험지(index 단독) 1 |
| 22 | G112 | TASK-ES-307: 측정지표 다중 선택 및 동시 렌더링 엔진 | 62 | 9 | 상태 읽기 1 · 로드 중 문 2 · 들어옴 1 · window 2 · 바깥 파일 1 |
| 23 | G049 | [#TASK-ES-160, #TASK-ES-166, #TASK-ES-180] 각 탭 200% 활용법 및 실제 | 11 | 9 | 상태 읽기 1 · 로드 중 문 3 · window 1 · 바깥 파일 1 |
| 24 | G131 | 통합 딥링크 게이트웨이 & 게스트 소프트 뷰어 3종 (js/viral-sharing.js 위임) | 10 | 9 | 상태 읽기 1 · 로드 중 문 2 · window 2 · 바깥 파일 2 |
| 25 | G116 | 전문 템플릿 실시간 자동 집계 엔진 (혁신 1) | 174 | 10 | 들어옴 2 · 시험지(index 단독) 1 · FN_NAMES 1 |
| 26 | G082 | 사진 인증 & 뷰어 모달 (가상유저 요청 P1) | 38 | 10 | 상태 읽기 2 · 로드 중 문 4 |
| 27 | G008 | [#TASK-ES-444] 인라인 스크립트 세포화 P1 이음매 2 — 일정 배경·잠금화면 라이브, 소통 창· | 33 | 10 | 상태 읽기 8 · 로드 중 문 1 |
| 28 | G051 | 1:1 고객 문의 / 버그 제보 (#TASK-ES-178) | 20 | 10 | 상태 읽기 1 · 로드 중 문 3 · 시험지(index 단독) 1 |
| 29 | G025 | #TASK-ES-165: 앱 진입 아바타 인사 팝업 (화면 절반 크기 & 시간대별 멘트) | 8 | 10 | 상태 읽기 2 · 로드 중 문 2 · window 2 · 바깥 파일 2 |
| 30 | G132 | 마니또 실 유저 익명 응원 연동 (#TASK-ES-133, #TASK-ES-145) | 8 | 10 | 상태 읽기 1 · 로드 중 문 1 · window 1 · 바깥 파일 6 |

## 4. 전체 묶음 표

| 묶음 | 줄 범위 | 줄 | 제목 | 함수 | 변수 | 난이도(점수) | 상태 쓰기 · 변경 · 읽기 | window | 처리기(add/on) | 로드 중 문 | 인라인 처리기 | 들어옴/나감 묶음 | 바깥 파일 | 시험지(index 단독) |
|---|---|--:|---|--:|--:|---|---|--:|---|--:|--:|---|--:|---|
| G000 | 2331~2333 | 3 | (IIFE 머리 — "use strict" 와 첫 구획 앞) | 0 | 0 | 빈 구획(69) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 65(23) |
| G001 | 2334~2412 | 79 | [#TASK-ES-354 CORE-07] 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTO | 0 | 19 | 이음매(옮기지 않음)(58) | 1 · 0 · 34 | 0 | 0/0 | 1 | 0 | 0/13 | 0 | 18(6) |
| G002 | 2413~2454 | 42 | [#TASK-ES-358] 기록 탭 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL | 0 | 4 | 이음매(옮기지 않음)(61) | 1 · 0 · 19 | 0 | 0/0 | 1 | 0 | 0/10 | 0 | 48(12) |
| G003 | 2455~2483 | 29 | [#TASK-ES-360] 일정 탭 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL | 0 | 3 | 이음매(옮기지 않음)(22) | 0 · 0 · 11 | 0 | 0/0 | 1 | 0 | 0/6 | 0 | 9(3) |
| G004 | 2484~2526 | 43 | [#TASK-ES-370] 목표 탭 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL | 0 | 2 | 이음매(옮기지 않음)(62) | 0 · 0 · 24 | 0 | 0/0 | 1 | 0 | 0/8 | 0 | 45(12) |
| G005 | 2527~2534 | 8 | [#TASK-ES-453] 인라인 스크립트 세포화 P1 이음매 3 — 목표 종합상황 AI 요약 새로 고침 ( | 0 | 1 | 쉬움(7) | 0 · 0 · 2 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 3(1) |
| G006 | 2535~2550 | 16 | [#TASK-ES-375] 목표 탭 모듈 이음매 2차 (docs/specs/MODULE-SPLIT-PROTO | 0 | 3 | 이음매(옮기지 않음)(10) | 0 · 0 · 8 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 1(0) |
| G007 | 2551~2572 | 22 | [#TASK-ES-379] 소통 탭 모듈 이음매 1차 (docs/specs/MODULE-SPLIT-PROTO | 0 | 7 | 이음매(옮기지 않음)(12) | 0 · 0 · 7 | 0 | 0/0 | 1 | 0 | 0/2 | 0 | 7(1) |
| G008 | 2573~2605 | 33 | [#TASK-ES-444] 인라인 스크립트 세포화 P1 이음매 2 — 일정 배경·잠금화면 라이브, 소통 창· | 0 | 23 | 보통(10) | 0 · 0 · 8 | 0 | 0/0 | 1 | 0 | 0/1 | 0 | 5(0) |
| G009 | 2606~2890 | 285 | [#TASK-ES-423] 인라인 스크립트 세포화 1차 이음매 (docs/architecture/INLINE | 0 | 138 | 이음매(옮기지 않음)(198) | 15 · 0 · 75 | 0 | 0/0 | 9 | 0 | 0/15 | 0 | 30(15) |
| G010 | 2891~2924 | 34 | [#TASK-ES-436] 인라인 스크립트 세포화 P1 이음매 1 — 목표 AI·일정 설정, 기록 AI 피드 | 0 | 15 | 보통(17) | 0 · 0 · 9 | 0 | 0/0 | 1 | 0 | 0/4 | 0 | 4(2) |
| G011 | 2925~2948 | 24 | [#TASK-ES-446] 인라인 스크립트 세포화 P2-1 이음매 (docs/architecture/INLI | 0 | 9 | 쉬움(6) | 0 · 0 · 4 | 0 | 0/0 | 1 | 0 | 0/6 | 0 | 2(0) |
| G012 | 2949~3013 | 65 | [#TASK-ES-448] 인라인 스크립트 세포화 P2-2 이음매 (docs/architecture/INLI | 0 | 43 | 보통(25) | 1 · 0 · 8 | 0 | 0/0 | 2 | 0 | 0/3 | 0 | 11(3) |
| G013 | 3014~3049 | 36 | [#TASK-ES-437] 인라인 스크립트 세포화 P0 이음매 (docs/architecture/INLINE | 0 | 20 | 보통(20) | 1 · 0 · 8 | 0 | 0/0 | 1 | 0 | 0/3 | 0 | 7(2) |
| G014 | 3050~3087 | 38 | [#TASK-ES-442] 인라인 스크립트 세포화 P0 이음매 (docs/architecture/INLINE | 0 | 20 | 보통(24) | 2 · 0 · 11 | 0 | 0/0 | 1 | 0 | 0/2 | 0 | 10(1) |
| G015 | 3088~3126 | 39 | Supabase | 1 | 5 | 보통(24) | 0 · 0 · 2 | 1 | 0/0 | 2 | 0 | 4/0 | 1 | 9(4) |
| G016 | 3127~3156 | 30 | 아워골 앱 환경설정 및 보상형 광고 파이프라인 (TASK-ES-013) | 0 | 1 | 쉬움(6) | 0 · 0 · 0 | 1 | 0/0 | 1 | 0 | 0/0 | 3 | 1(0) |
| G017 | 3157~3164 | 8 | [#TASK-ES-264] 표준 시간대(한국 KST 00:00, 타 국가는 해당 국가 표준시 00:00) 기 | 0 | 0 | 빈 구획(9) | 0 · 0 · 2 | 2 | 0/0 | 1 | 0 | 0/0 | 3 | 2(0) |
| G018 | 3165~3187 | 23 | Confetti | 1 | 1 | 어려움(233) | 0 · 0 · 1 | 3 | 0/1 | 2 | 1 | 51/0 | 169 | 2(1) |
| G019 | 3188~3203 | 16 | 8대 화면 스타일 (테마) 정의 | 0 | 1 | 보통(12) | 0 · 0 · 1 | 2 | 0/0 | 1 | 0 | 0/0 | 4 | 3(1) |
| G020 | 3204~3207 | 4 | 가상유저 개선 10대 핵심 헬퍼 함수 | 0 | 0 | 빈 구획(35) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 31 | 1(0) |
| G021 | 3208~3220 | 13 | [#TASK-ES-345 CAL-02] 구글 캘린더 토큰·일정 캐시 계정 격리 | 0 | 0 | 빈 구획(17) | 0 · 0 · 3 | 3 | 0/0 | 1 | 0 | 0/0 | 6 | 2(1) |
| G022 | 3221~3228 | 8 | 구독 상태 (전체 기능 100% 완전 무료 제공) | 1 | 0 | 쉬움(6) | 0 · 0 · 1 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G023 | 3229~3334 | 106 | XP/레벨 시스템 | 3 | 0 | 어려움(82) | 0 · 0 · 11 | 6 | 0/2 | 6 | 0 | 6/4 | 14 | 15(11) |
| G024 | 3335~3356 | 22 | [#TASK-ES-150] 아바타 레벨업 대형 팝업 & 성장 성향 키워드 | 0 | 6 | 어려움(41) | 0 · 0 · 6 | 2 | 2/0 | 14 | 0 | 0/0 | 2 | 3(1) |
| G025 | 3357~3364 | 8 | #TASK-ES-165: 앱 진입 아바타 인사 팝업 (화면 절반 크기 & 시간대별 멘트) | 0 | 1 | 보통(10) | 0 · 0 · 2 | 2 | 0/0 | 2 | 0 | 0/0 | 2 | 1(0) |
| G026 | 3365~3676 | 312 | 뱃지 컬렉션 (명예의 전당) | 6 | 1 | 어려움(261) | 0 · 0 · 8 | 4 | 0/0 | 4 | 0 | 7/3 | 196 | 23(11) |
| G027 | 3677~3680 | 4 | [70] 다른 모든 기기 원격 로그아웃 전 로그인 기기 목록 확인 모달 | 0 | 0 | 빈 구획(7) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 3 | 0(0) |
| G028 | 3681~3702 | 22 | [71] 앱 잠금 PIN (이 기기) — 설정·해제·앱 진입 확인 | 0 | 1 | 보통(16) | 0 · 0 · 5 | 5 | 0/0 | 2 | 0 | 0/0 | 2 | 0(0) |
| G029 | 3703~3709 | 7 | [78 / 89] 데이터분석 프롬프트 백과사전 (실사용 유저 등록·피드 게시 및 도움돼요 상호작용) | 0 | 2 | 쉬움(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 2(0) |
| G030 | 3710~3714 | 5 | [80] 템플릿백과사전 1초 자동이식 선택 연동 및 로드맵-목표상태 동기화 | 0 | 0 | 빈 구획(6) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 2 | 0(0) |
| G031 | 3715~3718 | 4 | [82] 팀 목표 내 '팀 연계 개인목표' 생성 모달 | 0 | 0 | 빈 구획(5) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 1 | 1(0) |
| G032 | 3719~3723 | 5 | [83] 팀원 초대 시 '아워골 동반자 초대하기' 인앱 초대·참가 기능 | 0 | 0 | 빈 구획(8) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 4 | 1(0) |
| G033 | 3724~3727 | 4 | [88] 오늘의 3초 체크인 목표 버튼 선택 시 플레이스홀더(백그라운드 가이드) 예시 문구 렌더링 | 0 | 0 | 빈 구획(6) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 2 | 0(0) |
| G034 | 3728~3738 | 11 | [#TASK-UIUX-PHASE3-HOME-COCKPIT] 홈 1초 조망 ↔ 무저항 체크인 콕핏 8대 과업 | 0 | 0 | 빈 구획(124) | 0 · 0 · 4 | 6 | 0/0 | 5 | 0 | 0/1 | 104 | 0(0) |
| G035 | 3739~3851 | 113 | 서버 관리자 API를 통한 기록 및 프로필 복구 (#TASK-ES-036) | 1 | 0 | 보통(24) | 0 · 0 · 6 | 0 | 0/0 | 0 | 0 | 3/2 | 0 | 12(5) |
| G036 | 3852~3852 | 1 | Landing | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G037 | 3853~3865 | 13 | [#TASK-ES-222] [생각 메모장 92번] 카카오톡 인앱 브라우저 감지 및 Android Chrome | 0 | 2 | 어려움(27) | 0 · 0 · 6 | 2 | 0/0 | 9 | 0 | 0/0 | 1 | 1(0) |
| G038 | 3866~3903 | 38 | 2계정 상호작용 테스트 (테스터 B 직통 입장: #TASK-ES-169) | 1 | 2 | 보통(20) | 0 · 1 · 1 | 1 | 2/0 | 5 | 0 | 0/3 | 0 | 7(2) |
| G039 | 3904~3912 | 9 | [#TASK-ES-223] [생각 메모장 93번] 개발 디버그 버튼 프로덕션 완전 소거 및 로컬/디버그 격리 | 0 | 0 | 빈 구획(10) | 0 · 0 · 1 | 1 | 1/0 | 2 | 0 | 0/0 | 1 | 1(1) |
| G040 | 3913~4218 | 306 | 소셜 로그인 (카카오 / 실제 구글 OAuth 연동) | 7 | 2 | 어려움(26) | 0 · 1 · 9 | 0 | 2/7 | 2 | 0 | 2/4 | 0 | 11(3) |
| G041 | 4219~4223 | 5 | [#TASK-ES-224] [생각 메모장 94번] 게스트(둘러보기) 3회 기록 시 안전 백업 넛지 및 카카오 | 0 | 0 | 빈 구획(10) | 0 · 0 · 2 | 2 | 0/0 | 2 | 0 | 0/0 | 2 | 0(0) |
| G042 | 4224~4227 | 4 | [#TASK-ES-224] [생각 메모장 94번] 카카오/소셜/일반 로그인 시 게스트 데이터 100% 무손실 | 0 | 0 | 빈 구획(7) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 3 | 0(0) |
| G043 | 4228~4265 | 38 | Goal category templates | 0 | 4 | 쉬움(4) | 0 · 0 · 0 | 0 | 1/0 | 2 | 0 | 0/0 | 0 | 2(0) |
| G044 | 4266~4379 | 114 | 디바이스 세션 & 원격 로그아웃 유틸 (Req 1) | 5 | 0 | 보통(24) | 0 · 1 · 7 | 0 | 1/0 | 1 | 0 | 7/4 | 0 | 10(2) |
| G045 | 4380~4389 | 10 | P0: 비밀번호 찾기 (이메일 재설정 링크 발송) | 1 | 1 | 쉬움(4) | 0 · 0 · 0 | 0 | 1/0 | 2 | 0 | 0/0 | 0 | 1(0) |
| G046 | 4390~4398 | 9 | P0: 새 비밀번호 입력 모달 (비밀번호 복구 링크 수신 시) | 1 | 0 | 쉬움(1) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 1/0 | 0 | 1(0) |
| G047 | 4399~4498 | 100 | P0: 회원 탈퇴 30일 유예(소프트 삭제) 복구 체크 | 0 | 1 | 보통(20) | 0 · 1 · 5 | 0 | 4/0 | 5 | 0 | 0/6 | 0 | 7(1) |
| G048 | 4499~4675 | 177 | 회원 탈퇴 전용 안내 모달 및 법적책임·데이터분실 사전 안내 (#TASK-ES-158) | 4 | 0 | 어려움(27) | 0 · 1 · 5 | 0 | 1/4 | 1 | 0 | 0/3 | 0 | 14(6) |
| G049 | 4676~4686 | 11 | [#TASK-ES-160, #TASK-ES-166, #TASK-ES-180] 각 탭 200% 활용법 및 실제 | 0 | 1 | 보통(9) | 0 · 0 · 1 | 1 | 1/0 | 3 | 0 | 0/0 | 1 | 1(0) |
| G050 | 4687~4694 | 8 | 앱 활용 가이드 다시보기 | 0 | 1 | 쉬움(4) | 0 · 0 · 0 | 0 | 1/0 | 2 | 0 | 0/1 | 0 | 1(0) |
| G051 | 4695~4714 | 20 | 1:1 고객 문의 / 버그 제보 (#TASK-ES-178) | 0 | 1 | 보통(10) | 0 · 0 · 1 | 0 | 2/0 | 3 | 0 | 0/1 | 0 | 3(1) |
| G052 | 4715~4724 | 10 | 이용약관 / 개인정보처리방침 열람 리스너 | 0 | 0 | 빈 구획(5) | 0 · 0 · 1 | 0 | 2/0 | 2 | 0 | 0/0 | 0 | 1(0) |
| G053 | 4725~4855 | 131 | Enter app | 1 | 0 | 어려움(49) | 0 · 0 · 10 | 0 | 5/0 | 6 | 0 | 6/12 | 0 | 18(7) |
| G054 | 4856~4859 | 4 | Onboarding (first-time, after signup) — 16종 동물 아바타 & 직관적 안착  | 0 | 0 | 빈 구획(6) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 2 | 0(0) |
| G055 | 4860~4869 | 10 | 3단계: 첫 체크인 튜토리얼 가이드 및 축하 연출 | 0 | 0 | 빈 구획(14) | 0 · 0 · 3 | 3 | 0/0 | 3 | 0 | 0/0 | 2 | 0(0) |
| G056 | 4870~5153 | 284 | 최초 로그인 활용가이드 — 4대 탭 무블러(Zero Blur) 투명 라이브 프리뷰 융합 | 5 | 2 | 어려움(26) | 0 · 0 · 6 | 1 | 12/9 | 3 | 0 | 2/2 | 0 | 8(2) |
| G057 | 5154~5161 | 8 | 조선소 블록 레지스트리 6대 메가블록 초기화 (헌법 제3조 제9항) | 0 | 0 | 빈 구획(49) | 0 · 0 · 3 | 2 | 0/0 | 3 | 0 | 0/0 | 38 | 0(0) |
| G058 | 5162~5228 | 67 | Modal helper & Android Hardware Back Handler | 1 | 2 | 어려움(160) | 0 · 0 · 4 | 5 | 0/2 | 2 | 0 | 29/0 | 112 | 5(2) |
| G059 | 5229~5234 | 6 | 이용약관 & 개인정보처리방침 모달 | 0 | 0 | 빈 구획(5) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 1 | 1(0) |
| G060 | 5235~5265 | 31 | 안내 모달 (전체 기능 100% 완전 무료 제공) | 2 | 0 | 쉬움(7) | 0 · 0 · 2 | 1 | 0/1 | 1 | 0 | 2/1 | 0 | 2(0) |
| G061 | 5266~5301 | 36 | 목표 일정 리스케일링 | 1 | 0 | 쉬움(6) | 0 · 0 · 1 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G062 | 5302~5311 | 10 | 결과 기록 (체크박스 대신 수치 입력) | 0 | 1 | 쉬움(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G063 | 5312~5885 | 574 | 프로필 | 8 | 0 | 어려움(76) | 0 · 1 · 15 | 6 | 13/9 | 5 | 1 | 9/7 | 5 | 20(9) |
| G064 | 5886~5886 | 1 | 구글 캘린더 연동 | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G065 | 5887~5932 | 46 | [#TASK-ES-153] 전역 7일 유예 통합 휴지통 (Recycle Bin) 시스템 | 2 | 1 | 어려움(35) | 0 · 1 · 8 | 6 | 0/0 | 1 | 0 | 3/0 | 6 | 3(1) |
| G066 | 5933~6276 | 344 | 일정(캘린더) 탭 | 7 | 0 | 어려움(45) | 0 · 1 · 12 | 0 | 0/0 | 0 | 0 | 10/1 | 0 | 14(7) |
| G067 | 6277~6286 | 10 | [#TASK-ES-153 & #TASK-ES-155] 캘린더 일자별 배경 사진 지정 모달 | 0 | 0 | 빈 구획(14) | 0 · 0 · 2 | 2 | 0/0 | 2 | 0 | 0/0 | 6 | 0(0) |
| G068 | 6287~6782 | 496 | 캘린더 수동 일정 편집 모달 (Req 2 & #TASK-ES-253) | 1 | 0 | 어려움(31) | 0 · 1 · 15 | 0 | 0/10 | 0 | 0 | 2/4 | 0 | 14(4) |
| G069 | 6783~7611 | 829 | [#TASK-ES-181 & #TASK-ES-182] 폰 잠금화면에서 바로 보기 통합 허브 모달 | 7 | 1 | 어려움(121) | 0 · 0 · 20 | 13 | 0/14 | 1 | 0 | 13/6 | 41 | 21(4) |
| G070 | 7612~7867 | 256 | 5대 테마 온톨로지 & 경량 AI 분류기 (TASK-OG-001) | 3 | 4 | 어려움(34) | 0 · 0 · 12 | 0 | 0/0 | 0 | 0 | 2/2 | 0 | 14(5) |
| G071 | 7868~7873 | 6 | Adaptive UX Mode | 0 | 0 | 빈 구획(5) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 1 | 0(0) |
| G072 | 7874~7880 | 7 | Social Crew Pacing (#TASK-ES-228) | 0 | 0 | 빈 구획(17) | 0 · 0 · 4 | 4 | 0/0 | 4 | 0 | 0/0 | 1 | 0(0) |
| G073 | 7881~7903 | 23 | UX Telemetry (Hesitation & Rage Tap) | 0 | 1 | 보통(12) | 0 · 0 · 1 | 2 | 1/0 | 3 | 0 | 0/0 | 3 | 0(0) |
| G074 | 7904~7907 | 4 | iOS 사파리 홈 화면 추가 안내 배너 & 실시간 알림 가이드 (#TASK-ES-234) | 0 | 0 | 빈 구획(5) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 1 | 1(0) |
| G075 | 7908~7949 | 42 | 신규 유저 10초 활성화: 갓생 스타터 목표 템플릿 | 0 | 1 | 쉬움(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G076 | 7950~8165 | 216 | RENDER: HOME | 1 | 0 | 어려움(74) | 0 · 1 · 22 | 0 | 8/2 | 0 | 0 | 8/10 | 0 | 51(14) |
| G077 | 8166~8311 | 146 | 11인 외부 UI/UX 감시 및 개선팀 핵심 기능 구현 | 3 | 0 | 어려움(33) | 0 · 0 · 9 | 0 | 0/4 | 0 | 0 | 3/3 | 0 | 9(7) |
| G078 | 8312~8321 | 10 | 1순위 대표 목표 AI 초집중 모드 (Focus Auto-Pilot) | 0 | 3 | 쉬움(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G079 | 8322~8332 | 11 | 원터치 퀵 루틴 칩 | 0 | 1 | 쉬움(7) | 0 · 0 · 0 | 0 | 1/0 | 2 | 0 | 0/0 | 0 | 2(1) |
| G080 | 8333~8569 | 237 | 🎙️ 마이크 권한 거부 상태 자가 진단 및 1초 권한 허용 모달 (#TASK-ES-227) | 1 | 0 | 보통(13) | 0 · 0 · 2 | 1 | 1/5 | 1 | 0 | 2/1 | 0 | 8(2) |
| G081 | 8570~8640 | 71 | 음성 체크인 (Web Speech API) | 0 | 0 | 빈 구획(5) | 0 · 0 · 0 | 0 | 6/0 | 1 | 0 | 0/2 | 0 | 2(1) |
| G082 | 8641~8678 | 38 | 사진 인증 & 뷰어 모달 (가상유저 요청 P1) | 0 | 4 | 보통(10) | 0 · 0 · 2 | 0 | 2/2 | 4 | 0 | 0/0 | 0 | 1(0) |
| G083 | 8679~8687 | 9 | 체크인 입력 글자수 힌트 (#TASK-ES-367: 열 수 없던 활동 테마 선택 창·배지 제거, 승인 202 | 0 | 3 | 보통(15) | 0 · 0 · 2 | 0 | 0/0 | 5 | 0 | 0/0 | 0 | 3(1) |
| G084 | 8688~8700 | 13 | AI feedback (best-effort; provider-aware; local fallback) | 0 | 1 | 쉬움(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G085 | 8701~8844 | 144 | [#TASK-ES-225] [생각 메모장 95번] Gemini API 분당 쿼터(Rate Limit 429) | 0 | 4 | 보통(12) | 0 · 0 · 2 | 2 | 0/0 | 2 | 0 | 0/1 | 1 | 2(1) |
| G086 | 8845~8980 | 136 | 기록 기반 목표·마일스톤·할 일 자동 업데이트 제안 | 5 | 0 | 어려움(33) | 0 · 0 · 10 | 0 | 3/0 | 0 | 0 | 3/4 | 0 | 1(0) |
| G087 | 8981~10065 | 1085 | 맞춤 피드백 봇 설정 | 18 | 0 | 어려움(90) | 1 · 2 · 24 | 5 | 36/2 | 7 | 1 | 12/2 | 1 | 20(8) |
| G088 | 10066~10069 | 4 | 목표 & 기록 선택 피드 공유 모달 (전면 고도화) | 0 | 0 | 빈 구획(7) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 3 | 1(0) |
| G089 | 10070~10075 | 6 | [#TASK-ES-301] 피드 게시 모달 내 '미리보기' 토글 직통 헬퍼 | 0 | 0 | 빈 구획(7) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 3 | 1(0) |
| G090 | 10076~10143 | 68 | 외부 데이터 불러오기 (mock) | 1 | 4 | 어려움(38) | 0 · 1 · 7 | 0 | 7/1 | 9 | 1 | 0/3 | 0 | 4(3) |
| G091 | 10144~10711 | 568 | [#TASK-ES-174] 목표 템플릿 백과사전 전체화면 팝업 및 상호작용 | 12 | 8 | 어려움(82) | 0 · 1 · 9 | 9 | 9/3 | 20 | 2 | 2/2 | 4 | 14(4) |
| G092 | 10712~10742 | 31 | [#TASK-ES-146] 아워골 평가해주기 90% 팝업 | 0 | 5 | 어려움(46) | 0 · 0 · 8 | 3 | 3/1 | 15 | 0 | 0/0 | 2 | 3(1) |
| G093 | 10743~10752 | 10 | New goal modal | 0 | 0 | 빈 구획(11) | 0 · 0 · 2 | 1 | 0/0 | 2 | 0 | 0/0 | 4 | 2(0) |
| G094 | 10753~10753 | 1 | 참고자료 (유튜브/영상, 이미지, 텍스트 메모, 웹링크) | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G095 | 10754~11314 | 561 | 참고자료 (유튜브/영상, 이미지, 텍스트 메모, 웹링크) | 8 | 0 | 어려움(41) | 0 · 1 · 14 | 4 | 11/1 | 1 | 0 | 3/4 | 4 | 12(4) |
| G096 | 11315~11338 | 24 | 목표 AI 생성 전체 템플릿 양식 및 세부 항목 미리보기 (Req 5) | 0 | 1 | 보통(14) | 0 · 0 · 2 | 1 | 3/0 | 5 | 0 | 0/0 | 1 | 0(0) |
| G097 | 11339~11512 | 174 | 목표 보관(기록으로 옮기기) | 3 | 0 | 어려움(225) | 0 · 1 · 7 | 4 | 1/0 | 2 | 1 | 3/2 | 196 | 5(1) |
| G098 | 11513~11593 | 81 | [#TASK-ES-264] 오늘의 미션 및 AI 피드백 조건부 호출 최적화 | 2 | 0 | 어려움(27) | 0 · 1 · 8 | 1 | 0/1 | 1 | 0 | 2/0 | 0 | 10(4) |
| G099 | 11594~11605 | 12 | 목표 탭 3계층 일정설정 / 디데이·기간 표시 및 캘린더 연동 (#TASK-ES-259, 메모장 03항, # | 0 | 0 | 빈 구획(25) | 0 · 0 · 7 | 7 | 0/0 | 1 | 0 | 0/0 | 6 | 2(1) |
| G100 | 11606~11927 | 322 | [#TASK-ES-220] [생각 메모장 91번] 교대근무자 가변형 루틴 프리셋 & 자동 스케줄러 | 3 | 1 | 보통(25) | 0 · 0 · 6 | 4 | 0/8 | 4 | 0 | 1/3 | 0 | 8(2) |
| G101 | 11928~12628 | 701 | [#TASK-ES-172] [27] 목표 탭: 데일리 루틴 서브탭 & 편집/상세 모달 | 3 | 0 | 어려움(37) | 0 · 1 · 9 | 2 | 0/25 | 1 | 0 | 2/4 | 2 | 15(6) |
| G102 | 12629~12631 | 3 | RENDER: TEMPLATE ENCYCLOPEDIA SUBTAB (#TASK-ES-187) | 0 | 2 | 쉬움(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G103 | 12632~12646 | 15 | [#TASK-ES-189] 템플릿 백과사전 3대 분류(개인·루틴·팀) 및 AI/실유저 2원화 이식 시스템 | 0 | 4 | 어려움(35) | 0 · 0 · 6 | 8 | 0/0 | 8 | 0 | 0/0 | 2 | 4(1) |
| G104 | 12647~12800 | 154 | [UI/UX 틀 개편 Phase 4] 목표 탭 노션급 데이터 관리 & 인지순행 IA (#TASK-UIUX-P | 7 | 0 | 어려움(67) | 0 · 1 · 9 | 14 | 0/0 | 13 | 6 | 1/2 | 4 | 2(0) |
| G105 | 12801~12959 | 159 | [PHASE 5] #TASK-UIUX-PHASE5-RECORDS-CALENDAR FUNCTIONS | 4 | 0 | 어려움(55) | 1 · 1 · 4 | 14 | 0/0 | 8 | 4 | 0/2 | 1 | 9(4) |
| G106 | 12960~13035 | 76 | [PHASE 6] #TASK-UIUX-PHASE6-COMM-SETTINGS FUNCTIONS | 3 | 0 | 어려움(48) | 1 · 1 · 7 | 9 | 0/0 | 8 | 3 | 0/1 | 2 | 4(1) |
| G107 | 13036~13058 | 23 | [UI/UX 프레임워크 개편 Phase 7] 모바일 하드웨어 인터랙션 & 사용성 하드닝 | 0 | 0 | 빈 구획(23) | 0 · 0 · 5 | 4 | 1/0 | 5 | 0 | 0/0 | 1 | 1(1) |
| G108 | 13059~13061 | 3 | RENDER: GOALS | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G109 | 13062~13321 | 260 | RENDER: 팀 목표 (팀장·매니저만 추가/수정/삭제, 팀원은 보기만) | 17 | 3 | 어려움(44) | 0 · 0 · 10 | 0 | 2/0 | 0 | 0 | 7/7 | 0 | 15(4) |
| G110 | 13322~15277 | 1956 | 개인 목표 200% 활용 가이드 & 템플릿 백과사전 (#TASK-ES-135) | 11 | 0 | 어려움(112) | 0 · 2 · 22 | 5 | 64/6 | 4 | 0 | 6/4 | 19 | 33(16) |
| G111 | 15278~15369 | 92 | [#TASK-ES-299] 팀 목표 댓글 작성 및 전송 직통 헬퍼 & 전역 이벤트 위임 (먹통 방어 100% | 0 | 0 | 빈 구획(23) | 0 · 2 · 9 | 1 | 2/0 | 3 | 0 | 0/2 | 3 | 3(0) |
| G112 | 15370~15431 | 62 | TASK-ES-307: 측정지표 다중 선택 및 동시 렌더링 엔진 | 1 | 0 | 보통(9) | 0 · 0 · 1 | 2 | 0/0 | 2 | 0 | 1/0 | 1 | 2(0) |
| G113 | 15432~15460 | 29 | 기록 히트맵 (GitHub 히트맵 스타일) | 2 | 2 | 보통(16) | 0 · 0 · 4 | 0 | 0/0 | 0 | 0 | 2/0 | 0 | 2(0) |
| G114 | 15461~15462 | 2 | 5대 테마 원형 라이프 밸런스 휠 (SVG Pie Chart) | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 1(0) |
| G115 | 15463~15738 | 276 | [#TASK-ES-233] 3일 실천 완성 나의 6각 성장 차트 미리보기 SVG 렌더러 | 4 | 0 | 어려움(27) | 0 · 1 · 8 | 0 | 6/0 | 0 | 0 | 2/3 | 0 | 14(5) |
| G116 | 15739~15912 | 174 | 전문 템플릿 실시간 자동 집계 엔진 (혁신 1) | 1 | 0 | 보통(10) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 2/0 | 0 | 2(1) |
| G117 | 15913~16023 | 111 | 📈 표 기록 기반 일자별 자동 성장 추이 차트 (Visual Trend Chart) | 1 | 0 | 보통(17) | 0 · 0 · 2 | 0 | 0/0 | 0 | 0 | 1/1 | 0 | 9(3) |
| G118 | 16024~16045 | 22 | ⏱️ 인앱 인터벌 타이머 & 스톱워치 위젯 (In-Table Stopwatch) | 1 | 0 | 보통(17) | 0 · 0 · 3 | 2 | 0/0 | 1 | 0 | 1/0 | 1 | 4(1) |
| G119 | 16046~16909 | 864 | CSV / 엑셀 양방향 연동 & 스마트워치 매핑 & 목표 3각 추적 | 11 | 2 | 보통(24) | 0 · 0 · 4 | 0 | 0/29 | 0 | 0 | 1/3 | 0 | 9(3) |
| G120 | 16910~18288 | 1379 | 템플릿 복제 보상형 광고(Rewarded Ad) 파이프라인 (TASK-ES-013) | 12 | 0 | 어려움(71) | 0 · 1 · 36 | 1 | 3/49 | 2 | 0 | 4/12 | 0 | 14(3) |
| G121 | 18289~18324 | 36 | [#TASK-ES-358] 기록 탭 렌더 → js/tabs/records/period-ai-card.js · | 0 | 0 | 빈 구획(54) | 0 · 1 · 4 | 7 | 0/0 | 2 | 0 | 0/3 | 37 | 4(0) |
| G122 | 18325~18936 | 612 | 위클리 리캡 카드 (스포티파이 랩드 스타일, 공유 캔버스 인프라 재사용) | 7 | 2 | 어려움(69) | 0 · 1 · 20 | 0 | 11/9 | 10 | 1 | 8/8 | 0 | 14(4) |
| G123 | 18937~18969 | 33 | 테마별 기록 DB 다운로드 & 외부 AI 분석 프롬프트 번들 (TASK-OG-001) | 2 | 0 | 보통(20) | 0 · 0 · 5 | 0 | 0/0 | 0 | 0 | 2/0 | 0 | 2(1) |
| G124 | 18970~18970 | 1 | RFC 5545 표준 iCalendar (.ics) 생성 순수 함수 (TASK-BG-11) | 0 | 0 | 빈 구획(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 0(0) |
| G125 | 18971~19421 | 451 | 캘린더 실시간 구독 URL 생성기 (WebCal Feed & #TASK-ES-252 HMAC 서명) | 7 | 2 | 어려움(73) | 0 · 0 · 11 | 2 | 5/0 | 3 | 0 | 5/4 | 7 | 22(9) |
| G126 | 19422~19470 | 49 | 크리에이터 템플릿 (#TASK-ES-315, 64: 구형 창 영구 제거 및 무해화) | 2 | 0 | 어려움(26) | 0 · 1 · 8 | 1 | 0/0 | 1 | 0 | 4/2 | 3 | 8(2) |
| G127 | 19471~19473 | 3 | 소통 피드 (Supabase feed_posts, 실시간 동기화) | 0 | 1 | 쉬움(0) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 | 2(0) |
| G128 | 19474~20108 | 635 | 피드 상호소통 댓글 & 리액션 헬퍼 (#TASK-ES-133 서버 DB 실시간 동기화) | 2 | 0 | 어려움(37) | 1 · 1 · 19 | 0 | 18/3 | 0 | 0 | 3/6 | 0 | 15(3) |
| G129 | 20109~20700 | 592 | 전역 공유 팀 로더 & 렌더링 (#TASK-ES-133) | 5 | 1 | 어려움(52) | 0 · 2 · 27 | 3 | 18/7 | 2 | 0 | 3/5 | 0 | 14(4) |
| G130 | 20701~20724 | 24 | [PEER INVITE] '함께 목표' 방 초대 루프 (웹 무설치 즉시 수락) | 3 | 0 | 어려움(28) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 1/0 | 0 | 8(4) |
| G131 | 20725~20734 | 10 | 통합 딥링크 게이트웨이 & 게스트 소프트 뷰어 3종 (js/viral-sharing.js 위임) | 1 | 1 | 보통(9) | 0 · 0 · 1 | 2 | 0/0 | 2 | 0 | 0/0 | 2 | 1(0) |
| G132 | 20735~20742 | 8 | 마니또 실 유저 익명 응원 연동 (#TASK-ES-133, #TASK-ES-145) | 0 | 3 | 보통(10) | 0 · 0 · 1 | 1 | 0/0 | 1 | 0 | 0/0 | 6 | 1(0) |
| G133 | 20743~20767 | 25 | DM & 동반자 소통 시스템 (TASK-ES-105) | 1 | 0 | 보통(15) | 0 · 0 · 3 | 2 | 1/0 | 3 | 0 | 1/0 | 3 | 2(0) |
| G134 | 20768~20777 | 10 | [#TASK-ES-354 CORE-07·SET-07] 설정 탭 렌더 → js/tabs/settings/ren | 0 | 0 | 이음매(옮기지 않음)(22) | 0 · 0 · 5 | 3 | 0/0 | 5 | 0 | 0/0 | 4 | 1(0) |
| G135 | 20778~20798 | 21 | 방해금지 시간대(DND, 조용한 시간) 판별 순수 함수 (TASK-BG-7) | 1 | 0 | 쉬움(7) | 0 · 0 · 0 | 0 | 0/0 | 0 | 0 | 2/0 | 0 | 1(0) |
| G136 | 20799~20850 | 52 | 맥락 기반 다이내믹 알림 문구 생성 | 1 | 0 | 보통(19) | 0 · 0 · 3 | 0 | 0/0 | 0 | 0 | 2/1 | 0 | 6(3) |
| G137 | 20851~20881 | 31 | Notifications (best-effort, tab must be open) | 2 | 0 | 보통(16) | 0 · 1 · 6 | 0 | 1/0 | 0 | 0 | 2/2 | 0 | 5(2) |
| G138 | 20882~20933 | 52 | Web Push (앱이 꺼져 있어도 오는 알림) | 3 | 0 | 보통(14) | 0 · 0 · 1 | 0 | 0/0 | 0 | 0 | 4/1 | 0 | 11(3) |
| G139 | 20934~20967 | 34 | 받은 응원 알림 (실제 내 게시물 응원 수 + 마니또 받은 응원함) | 3 | 0 | 쉬움(7) | 0 · 0 · 6 | 0 | 1/0 | 0 | 0 | 1/0 | 0 | 0(0) |
| G140 | 20968~21012 | 45 | 4대 연계 뷰 원자적 동시 전파 디스패처 (헌법 제1조 제4항 제5호 & 제15조 제6항 제3호) | 1 | 0 | 어려움(45) | 0 · 0 · 4 | 1 | 0/0 | 1 | 0 | 8/1 | 24 | 10(2) |
| G141 | 21013~21047 | 35 | [#TASK-ES-264] 자정(00:00 KST / 현지 표준시) 날짜 변경 감지 및 자동 동기화 워처 | 2 | 1 | 보통(11) | 0 · 0 · 4 | 3 | 2/0 | 0 | 0 | 1/2 | 0 | 3(1) |
| G142 | 21048~21060 | 13 | Render all | 1 | 0 | 어려움(26) | 0 · 0 · 6 | 0 | 0/0 | 0 | 0 | 11/3 | 0 | 10(3) |
| G143 | 21061~21064 | 4 | 세션 복구 및 안전 앱 진입 유틸 | 0 | 1 | 쉬움(3) | 0 · 0 · 1 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 0(0) |
| G144 | 21065~21077 | 13 | #TASK-AUTH-P0-SAFETY: 로그인/계정 보안 패키지 모듈 연결 | 0 | 0 | 빈 구획(6) | 0 · 0 · 4 | 0 | 0/0 | 1 | 0 | 0/4 | 0 | 0(0) |
| G145 | 21078~21305 | 228 | Boot | 0 | 0 | 빈 구획(22) | 0 · 1 · 9 | 0 | 0/0 | 1 | 0 | 0/6 | 0 | 10(3) |
| G146 | 21306~21308 | 3 | #TASK-ES-015 FIX: 공용 크레딧 모듈(js/credits.js)에 앱 sb 주입 | 0 | 0 | 빈 구획(3) | 0 · 0 · 1 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 1(0) |
| G147 | 21309~21322 | 14 | KF-7 #TASK-ES-014: 반응 4종 모듈(js/reactions.js)에 앱 핸들 연결 | 0 | 0 | 빈 구획(12) | 0 · 0 · 7 | 0 | 0/0 | 1 | 0 | 0/4 | 0 | 4(1) |
| G148 | 21323~21327 | 5 | KF-4 #TASK-ES-018: 카테고리별 도움이 된 글 슬롯 모듈(js/top-helpful.js) | 0 | 0 | 빈 구획(3) | 0 · 0 · 1 | 0 | 0/0 | 1 | 0 | 0/0 | 0 | 1(0) |
| G149 | 21328~21336 | 9 | KF-5 #TASK-ES-016: 도움돼요 이유 모듈(js/helpful-reason.js)에 앱 핸들 연결 | 0 | 0 | 빈 구획(10) | 0 · 0 · 5 | 0 | 0/0 | 1 | 0 | 0/3 | 0 | 3(1) |
| G150 | 21337~21344 | 8 | #TASK-ES-105: 팀 초대 및 소통/DM/동반자 모듈(js/team-invite-comm.js) 연결 | 0 | 0 | 빈 구획(22) | 0 · 0 · 11 | 0 | 0/0 | 1 | 0 | 0/3 | 0 | 8(3) |
| G151 | 21345~21353 | 9 | #TASK-ES-105: 팀 연계 개인목표 및 상호 체크 모듈(js/team-linked-goals.js)  | 0 | 0 | 빈 구획(25) | 0 · 0 · 12 | 0 | 0/0 | 2 | 0 | 0/5 | 0 | 5(3) |
| G152 | 21354~21358 | 5 | KF-2 #TASK-ES-017: 템플릿 복제 크레딧 모듈(js/template-credit.js)에 앱 핸 | 0 | 0 | 빈 구획(4) | 0 · 0 · 2 | 0 | 0/0 | 1 | 0 | 0/2 | 0 | 1(0) |
| G153 | 21359~21401 | 43 | PWA: Service Worker 등록 및 자동 업데이트 감지 (#TASK-ES-118) | 0 | 0 | 빈 구획(202) | 0 · 0 · 9 | 8 | 5/0 | 10 | 0 | 0/3 | 159 | 4(2) |

## 5. 묶음별 의존 상세 (옮길 대상만, 권장 순서)

### G075 신규 유저 10초 활성화: 갓생 스타터 목표 템플릿

- 7908~7949줄(42줄) · 쉬움(0)
- 함수(0): 없음
- 변수(1): STARTER_GOAL_TEMPLATES
- 시험지 글자 의존: scripts/smoke-test.js

### G084 AI feedback (best-effort; provider-aware; local fallback)

- 8688~8700줄(13줄) · 쉬움(0)
- 함수(0): 없음
- 변수(1): THEME_FEEDBACK_PROMPTS
- 시험지 글자 의존: scripts/smoke-test.js

### G062 결과 기록 (체크박스 대신 수치 입력)

- 5302~5311줄(10줄) · 쉬움(0)
- 함수(0): 없음
- 변수(1): RESULT_UNITS
- 시험지 글자 의존: scripts/smoke-test.js

### G078 1순위 대표 목표 AI 초집중 모드 (Focus Auto-Pilot)

- 8312~8321줄(10줄) · 쉬움(0)
- 함수(0): 없음
- 변수(3): focusTimerInterval, focusTimerRunning, focusTimerSeconds
- 시험지 글자 의존: scripts/smoke-test.js

### G029 [78 / 89] 데이터분석 프롬프트 백과사전 (실사용 유저 등록·피드 게시 및 도움돼요 상호작용)

- 3703~3709줄(7줄) · 쉬움(0)
- 함수(0): 없음
- 변수(2): _promptEncyclopediaOpen, _promptTabState
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js

### G102 RENDER: TEMPLATE ENCYCLOPEDIA SUBTAB (#TASK-ES-187)

- 12629~12631줄(3줄) · 쉬움(0)
- 함수(0): 없음
- 변수(2): _subtabTplCat, _subtabTplQuery

### G127 소통 피드 (Supabase feed_posts, 실시간 동기화)

- 19471~19473줄(3줄) · 쉬움(0)
- 함수(0): 없음
- 변수(1): FEED_POSTS_CACHE
- 시험지 글자 의존: scripts/smoke-test.js, tests/guest-null-client-es377.test.js

### G046 P0: 새 비밀번호 입력 모달 (비밀번호 복구 링크 수신 시)

- 4390~4398줄(9줄) · 쉬움(1)
- 함수(1): openNewPasswordModal
- 부르는 묶음(들어옴): G145×2
- 시험지 글자 의존: scripts/smoke-test.js

### G143 세션 복구 및 안전 앱 진입 유틸

- 21061~21064줄(4줄) · 쉬움(3)
- 함수(0): 없음
- 변수(1): _isEnteringApp
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindLoginRescueButtons
- 로드 중 문 1: 호출 1

### G043 Goal category templates

- 4228~4265줄(38줄) · 쉬움(4)
- 함수(0): 없음
- 변수(4): GOAL_TEMPLATES, ONBOARDING_PRESETS, QUICK_ACTIONS_BY_CAT, authTabButtons
- 로드 중 문 2: var 초기값 실행 1 · 호출 1
- 이벤트 처리기: addEventListener 1 · on<이벤트> 대입 0
- 시험지 글자 의존: scripts/smoke-test.js, tests/onboarding-first-checkin.test.js

### G045 P0: 비밀번호 찾기 (이메일 재설정 링크 발송)

- 4380~4389줄(10줄) · 쉬움(4)
- 함수(1): openForgotPasswordModal
- 변수(1): fpBtn
- 로드 중 문 2: var 초기값 실행 1 · IfStatement 1
- 이벤트 처리기: addEventListener 1 · on<이벤트> 대입 0
- 시험지 글자 의존: scripts/smoke-test.js

### G050 앱 활용 가이드 다시보기

- 4687~4694줄(8줄) · 쉬움(4)
- 함수(0): 없음
- 변수(1): guideBtn
- 로드 중 문 2: var 초기값 실행 1 · IfStatement 1
- 이벤트 처리기: addEventListener 1 · on<이벤트> 대입 0
- 부르는 대상(나감): G056×1
- 시험지 글자 의존: scripts/smoke-test.js

### G061 목표 일정 리스케일링

- 5266~5301줄(36줄) · 쉬움(6)
- 함수(1): rescaleGoal
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: pad
- 시험지 글자 의존: scripts/smoke-test.js
- smoke-test FN_NAMES: rescaleGoal — 옮기려면 시험지 선행 PR 먼저

### G016 아워골 앱 환경설정 및 보상형 광고 파이프라인 (TASK-ES-013)

- 3127~3156줄(30줄) · 쉬움(6)
- 함수(0): 없음
- 변수(1): OURGOAL_CONFIG
- 로드 중 문 1: IfStatement 1
- window 노출(1줄): OURGOAL_CONFIG
- 바깥 js 가 window 이름을 씀: js/credits.js, js/streaks.js, js/template-credit.js
- 시험지 글자 의존: scripts/smoke-test.js

### G011 [#TASK-ES-446] 인라인 스크립트 세포화 P2-1 이음매 (docs/architecture/INLINE-SCRIPT-MAP.md 지도 · docs/spe

- 2925~2948줄(24줄) · 쉬움(6)
- 함수(0): 없음
- 변수(9): buildRecordCardHtml, handleConversationalRecord, openProCoachReportModal, openProNotionExportModal, pushRecordToNotion, renderAnalyticsHtml, renderRecordHeatmap, renderReportSummary, renderTrendSvgChart
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: HEATMAP_LEVELS, HEATMAP_WEEKS, _recordsKit, requestAIFeedback
- 로드 중 문 1: 호출 1
- 부르는 대상(나감): G063×1, G086×1, G087×1, G113×1, G116×1, G122×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js

### G022 구독 상태 (전체 기능 100% 완전 무료 제공)

- 3221~3228줄(8줄) · 쉬움(6)
- 함수(1): subscriptionState
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: state
- 시험지 글자 의존: scripts/smoke-test.js
- smoke-test FN_NAMES: subscriptionState — 옮기려면 시험지 선행 PR 먼저

### G139 받은 응원 알림 (실제 내 게시물 응원 수 + 마니또 받은 응원함)

- 20934~20967줄(34줄) · 쉬움(7)
- 함수(3): checkSocialNotifications, showSocialNotifyBanner, totalFeedCheers
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: FEED_POSTS_CACHE, manitoInbox, manitoState, saveProfile, setTab, state
- 이벤트 처리기: addEventListener 1 · on<이벤트> 대입 0
- 부르는 묶음(들어옴): G053×1

### G060 안내 모달 (전체 기능 100% 완전 무료 제공)

- 5235~5265줄(31줄) · 쉬움(7)
- 함수(2): openPaywallModal, renderProBadge
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: closeModal, escapeHtml
- 로드 중 문 1: window 노출 1
- window 노출(1줄): openPaywallModal
- 이벤트 처리기: addEventListener 0 · on<이벤트> 대입 1
- 부르는 묶음(들어옴): G053×1, G063×1
- 부르는 대상(나감): G058×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js

### G135 방해금지 시간대(DND, 조용한 시간) 판별 순수 함수 (TASK-BG-7)

- 20778~20798줄(21줄) · 쉬움(7)
- 함수(1): isWithinDND
- 부르는 묶음(들어옴): G136×1, G137×1
- 시험지 글자 의존: scripts/smoke-test.js
- smoke-test FN_NAMES: isWithinDND — 옮기려면 시험지 선행 PR 먼저

### G079 원터치 퀵 루틴 칩

- 8322~8332줄(11줄) · 쉬움(7)
- 함수(0): 없음
- 변수(1): qRoutineRow
- 로드 중 문 2: var 초기값 실행 1 · IfStatement 1
- 이벤트 처리기: addEventListener 1 · on<이벤트> 대입 0
- 시험지 글자 의존: scripts/smoke-test.js, tests/theme-system-v4.test.js (index.html 단독 읽기: tests/theme-system-v4.test.js)

### G005 [#TASK-ES-453] 인라인 스크립트 세포화 P1 이음매 3 — 목표 종합상황 AI 요약 새로 고침 (docs/architecture/INLINE-SCRIP

- 2527~2534줄(8줄) · 쉬움(7)
- 함수(0): 없음
- 변수(1): refreshGoalStatusSummary
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: _goalsKit, generateGoalStatusSummary
- 로드 중 문 1: 호출 1
- 시험지 글자 의존: scripts/smoke-test.js, tests/ai-conditional-call-optimization.test.js, tests/goal-ai-advice-status.test.js (index.html 단독 읽기: tests/goal-ai-advice-status.test.js)

### G112 TASK-ES-307: 측정지표 다중 선택 및 동시 렌더링 엔진

- 15370~15431줄(62줄) · 보통(9)
- 함수(1): renderMultiMetricSvg
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: TREND_METRICS
- 로드 중 문 2: window 노출 2
- window 노출(2줄): TREND_METRICS, renderMultiMetricSvg
- 부르는 묶음(들어옴): G009×1
- 바깥 js 가 window 이름을 씀: js/tabs/records/trend-metrics-chart.js
- 시험지 글자 의존: scripts/smoke-test.js, tests/achievement-graph-multiset.test.js

### G049 [#TASK-ES-160, #TASK-ES-166, #TASK-ES-180] 각 탭 200% 활용법 및 실제 우수 사용사례 쇼케이스 (최신 기능 전면 동기화)

- 4676~4686줄(11줄) · 보통(9)
- 함수(0): 없음
- 변수(1): tabGuideBtn
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: openTabGuideHubModal
- 로드 중 문 3: window 노출 1 · var 초기값 실행 1 · IfStatement 1
- window 노출(1줄): openTabGuideHubModal
- 이벤트 처리기: addEventListener 1 · on<이벤트> 대입 0
- 바깥 js 가 window 이름을 씀: js/tabs/settings/tab-guide.js
- 시험지 글자 의존: scripts/smoke-test.js

### G131 통합 딥링크 게이트웨이 & 게스트 소프트 뷰어 3종 (js/viral-sharing.js 위임)

- 20725~20734줄(10줄) · 보통(9)
- 함수(1): handleDeepLinkRouting
- 변수(1): checkAndHandlePeerInviteUrl
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: MANITO_WELCOME_STAMPS
- 로드 중 문 2: IfStatement 2
- window 노출(2줄): MANITO_STAMP_COOLDOWN, MANITO_WELCOME_STAMPS
- 바깥 js 가 window 이름을 씀: js/tabs/comm/manito-basics.js, js/tabs/comm/manito-real.js
- 시험지 글자 의존: scripts/smoke-test.js

### G116 전문 템플릿 실시간 자동 집계 엔진 (혁신 1)

- 15739~15912줄(174줄) · 보통(10)
- 함수(1): computeTableAnalytics
- 부르는 묶음(들어옴): G011×1, G117×1
- 시험지 글자 의존: scripts/smoke-test.js, tests/google-session-guard.test.js (index.html 단독 읽기: tests/google-session-guard.test.js)
- smoke-test FN_NAMES: computeTableAnalytics — 옮기려면 시험지 선행 PR 먼저

### G082 사진 인증 & 뷰어 모달 (가상유저 요청 P1)

- 8641~8678줄(38줄) · 보통(10)
- 함수(0): 없음
- 변수(4): capturePhotoBtn, capturePhotoInput, capturePhotoPreview, pendingCapturePhoto
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: compressImage, openPhotoViewerModal
- 로드 중 문 4: var 초기값 실행 3 · IfStatement 1
- 이벤트 처리기: addEventListener 2 · on<이벤트> 대입 2
- 시험지 글자 의존: scripts/smoke-test.js

### G008 [#TASK-ES-444] 인라인 스크립트 세포화 P1 이음매 2 — 일정 배경·잠금화면 라이브, 소통 창·스토리 캔버스, 사진 인증, 목표 스타터·로컬 문장, 

- 2573~2605줄(33줄) · 보통(10)
- 함수(0): 없음
- 변수(23): _recordHesitation, buildLockScreenCardPayload, closeLockScreenLiveCard, closePwaInstallGuideModal, compressImage, confirmPwaInstall, generateMzStoryCanvas, initKeyboardShield, localNextActionSuggestion, localTodayMission, openCalendarDayBgPickerModal, openIosPwaInstallGuideModal, openPhotoViewerModal, openPwaInstallGuideModal, quickCreateStarterGoal, renderAdaptiveModeBar, renderHomeGrassSummary, renderIosPwaBanner, switchPwaOsTab, switchUxMode 외 3
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: SIM_PERSONAS, STARTER_GOAL_TEMPLATES, _calendarKit, _commKit, _goalsKit, _recordsKit, _settingsKit, _uxTelemetry
- 로드 중 문 1: 호출 1
- 부르는 대상(나감): G077×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js, tests/account-switch-isolation.test.js, tests/direct-login-guard.test.js, tests/feed-post-preview-modal.test.js

### G051 1:1 고객 문의 / 버그 제보 (#TASK-ES-178)

- 4695~4714줄(20줄) · 보통(10)
- 함수(0): 없음
- 변수(1): footEmailEl
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: openCustomerInquiryModal
- 로드 중 문 3: 호출 1 · var 초기값 실행 1 · IfStatement 1
- 이벤트 처리기: addEventListener 2 · on<이벤트> 대입 0
- 부르는 대상(나감): G018×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js, tests/account-withdrawal-modal.test.js (index.html 단독 읽기: tests/account-withdrawal-modal.test.js)

### G025 #TASK-ES-165: 앱 진입 아바타 인사 팝업 (화면 절반 크기 & 시간대별 멘트)

- 3357~3364줄(8줄) · 보통(10)
- 함수(0): 없음
- 변수(1): __avatarGreetTimer
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: closeAvatarGreetingPopup, openAvatarGreetingPopup
- 로드 중 문 2: window 노출 2
- window 노출(2줄): closeAvatarGreetingPopup, openAvatarGreetingPopup
- 바깥 js 가 window 이름을 씀: js/tabs/settings/avatar-greeting.js, js/tabs/settings/sub-profile.js
- 시험지 글자 의존: scripts/smoke-test.js

### G132 마니또 실 유저 익명 응원 연동 (#TASK-ES-133, #TASK-ES-145)

- 20735~20742줄(8줄) · 보통(10)
- 함수(0): 없음
- 변수(3): MANITO_SERVER_LOADED, REAL_MANITO_INBOX_CACHE, REAL_MANITO_PARTNERS_CACHE
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: isValidRealUser
- 로드 중 문 1: window 노출 1
- window 노출(1줄): isValidRealUser
- 바깥 js 가 window 이름을 씀: js/tabs/comm/manito-real.js, js/tabs/records/first-checkin-tutorial.js, js/tabs/settings/guest-backup-nudge.js, js/tabs/settings/guest-migration.js, js/team-dm-room.js, js/team-profile.js
- 시험지 글자 의존: scripts/smoke-test.js

### G141 [#TASK-ES-264] 자정(00:00 KST / 현지 표준시) 날짜 변경 감지 및 자동 동기화 워처

- 21013~21047줄(35줄) · 보통(11)
- 함수(2): checkAndHandleDateRollover, setupDateRolloverWatcher
- 변수(1): _lastObservedDateKey
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: dateKey, getEffectiveStandardDateKey, nowISO, state
- window 노출(3줄): _dateRolloverInterval, checkAndHandleDateRollover, setupDateRolloverWatcher
- 이벤트 처리기: addEventListener 2 · on<이벤트> 대입 0
- 부르는 묶음(들어옴): G142×2
- 부르는 대상(나감): G098×2, G140×2
- 시험지 글자 의존: scripts/smoke-test.js, tests/ai-conditional-call-optimization.test.js, tests/today-mission-card-guide.test.js (index.html 단독 읽기: tests/today-mission-card-guide.test.js)

### G085 [#TASK-ES-225] [생각 메모장 95번] Gemini API 분당 쿼터(Rate Limit 429) 방어 및 지수 백오프 큐

- 8701~8844줄(144줄) · 보통(12)
- 함수(0): 없음
- 변수(4): DONE_KEYWORDS, GeminiQuotaDispatcher, PREMIUM_FEEDBACK_CATALOG, requestClaudeFeedback
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: requestServerAIFeedback, state
- 로드 중 문 2: window 노출 2
- window 노출(2줄): GeminiQuotaDispatcher, PREMIUM_FEEDBACK_CATALOG
- 부르는 대상(나감): G018×4
- 바깥 js 가 window 이름을 씀: js/tabs/records/ai-feedback-providers.js
- 시험지 글자 의존: scripts/smoke-test.js, tests/google-session-guard.test.js (index.html 단독 읽기: tests/google-session-guard.test.js)

### G073 UX Telemetry (Hesitation & Rage Tap)

- 7881~7903줄(23줄) · 보통(12)
- 함수(0): 없음
- 변수(1): _uxTelemetry
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: _recordHesitation
- 로드 중 문 3: window 노출 2 · IfStatement 1
- window 노출(2줄): _recordHesitation, _uxTelemetry
- 이벤트 처리기: addEventListener 1 · on<이벤트> 대입 0
- 바깥 js 가 window 이름을 씀: js/tabs/comm/crew-pacing.js, js/tabs/goals/result-modal.js, js/tabs/settings/adaptive-ux.js

### G019 8대 화면 스타일 (테마) 정의

- 3188~3203줄(16줄) · 보통(12)
- 함수(0): 없음
- 변수(1): THEMES
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: applyTheme
- 로드 중 문 1: IfStatement 1
- window 노출(2줄): THEMES, applyTheme
- 바깥 js 가 window 이름을 씀: js/components-settings-actions.js, js/sanctuary-v3-engine.js, js/tabs/settings/sub-appearance.js, js/tabs/settings/theme-apply.js
- 시험지 글자 의존: scripts/smoke-test.js, tests/hidden-entry-guard.test.js, tests/theme-system-v4.test.js (index.html 단독 읽기: tests/theme-system-v4.test.js)

### G080 🎙️ 마이크 권한 거부 상태 자가 진단 및 1초 권한 허용 모달 (#TASK-ES-227)

- 8333~8569줄(237줄) · 보통(13)
- 함수(1): openMicPermissionGuideModal
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: triggerHaptic, triggerHapticFeedback
- 로드 중 문 1: window 노출 1
- window 노출(1줄): openMicPermissionGuideModal
- 이벤트 처리기: addEventListener 1 · on<이벤트> 대입 5
- 부르는 묶음(들어옴): G081×8, G119×2
- 부르는 대상(나감): G018×2
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-all-clicks.js, tests/goals-schedule-sync.test.js, tests/guest-null-client-es377.test.js, tests/hidden-entry-guard.test.js, tests/records-tab-rename.test.js, tests/stopwatch-lap-inputs.test.js, tests/theme-system-v4.test.js (index.html 단독 읽기: tests/goals-schedule-sync.test.js, tests/theme-system-v4.test.js)

### G138 Web Push (앱이 꺼져 있어도 오는 알림)

- 20882~20933줄(52줄) · 보통(14)
- 함수(3): removePushSubscription, syncPushSubscription, urlBase64ToUint8Array
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: state
- 부르는 묶음(들어옴): G001×2, G044×2, G069×2, G053×1
- 부르는 대상(나감): G015×2
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-shipyard-modular.js, tests/account-switch-isolation.test.js, tests/ai-conditional-call-optimization.test.js, tests/direct-login-guard.test.js, tests/dm-push-auth-es397.test.js, tests/google-session-guard.test.js, tests/logout-scope-es399.test.js 외 3 (index.html 단독 읽기: tests/google-session-guard.test.js, tests/push-subscribe-auth-es400.test.js, tests/security-audit.test.js)

### G096 목표 AI 생성 전체 템플릿 양식 및 세부 항목 미리보기 (Req 5)

- 11315~11338줄(24줄) · 보통(14)
- 함수(0): 없음
- 변수(1): toggleAgentBtn
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: sendGoalAgentMessage, showGoalAgentReviewStep
- 로드 중 문 5: window 노출 1 · var 초기값 실행 1 · IfStatement 1 · 호출 2
- window 노출(1줄): showGoalAgentReviewStep
- 이벤트 처리기: addEventListener 3 · on<이벤트> 대입 0
- 바깥 js 가 window 이름을 씀: js/tabs/goals/ai-agent.js

### G133 DM & 동반자 소통 시스템 (TASK-ES-105)

- 20743~20767줄(25줄) · 보통(15)
- 함수(1): openUserProfileModal
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: openCustomerInquiryModal, openItemReportModal, openWidgetSettingsModal
- 로드 중 문 3: IfStatement 2 · 호출 1
- window 노출(2줄): openCustomerInquiryModal, openItemReportModal
- 이벤트 처리기: addEventListener 1 · on<이벤트> 대입 0
- 부르는 묶음(들어옴): G128×2
- 바깥 js 가 window 이름을 씀: js/tabs/settings/sub-data.js, js/tabs/settings/sub-integrations.js, js/tabs/settings/support-modals.js
- 시험지 글자 의존: scripts/smoke-test.js, tests/desktop-widget-suite.test.js

### G083 체크인 입력 글자수 힌트 (#TASK-ES-367: 열 수 없던 활동 테마 선택 창·배지 제거, 승인 2026-10-04)

- 8679~8687줄(9줄) · 보통(15)
- 함수(0): 없음
- 변수(3): capInput, liveCount, liveMeta
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindCaptureLiveMeta, bindCaptureSave
- 로드 중 문 5: var 초기값 실행 3 · 호출 2
- 시험지 글자 의존: scripts/smoke-test.js, tests/module-guard.test.js, tests/theme-system-v4.test.js (index.html 단독 읽기: tests/theme-system-v4.test.js)

### G137 Notifications (best-effort, tab must be open)

- 20851~20881줄(31줄) · 보통(16)
- 함수(2): setupNotifyTimer, showNotifyBanner
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: dateKey, escapeHtml, nowISO, pad, setTab, state
- 이벤트 처리기: addEventListener 1 · on<이벤트> 대입 0
- 부르는 묶음(들어옴): G001×2, G053×1
- 부르는 대상(나감): G135×1, G136×1
- 시험지 글자 의존: scripts/smoke-test.js, tests/dm-push-auth-es397.test.js, tests/push-subscribe-auth-es400.test.js, tests/schedule-notification-setting.test.js, tests/theme-system-v4.test.js (index.html 단독 읽기: tests/push-subscribe-auth-es400.test.js, tests/theme-system-v4.test.js)

### G113 기록 히트맵 (GitHub 히트맵 스타일)

- 15432~15460줄(29줄) · 보통(16)
- 함수(2): filterRecordsByQuery, heatmapLevel
- 변수(2): HEATMAP_LEVELS, HEATMAP_WEEKS
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: RECORD_THEMES, TOPICS, dateKey, fmtDateLabel
- 부르는 묶음(들어옴): G002×1, G011×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js
- smoke-test FN_NAMES: filterRecordsByQuery, heatmapLevel — 옮기려면 시험지 선행 PR 먼저

### G028 [71] 앱 잠금 PIN (이 기기) — 설정·해제·앱 진입 확인

- 3681~3702줄(22줄) · 보통(16)
- 함수(0): 없음
- 변수(1): APP_LOCK_PIN_PREFIX
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: challengeTwoFactorModal, isHashedAppLockPin, openTwoFactorDisableModal, openTwoFactorSetupModal, verifyAppLockPin
- 로드 중 문 2: IfStatement 2
- window 노출(5줄): challengeTwoFactorModal, isHashedAppLockPin, openTwoFactorDisableModal, openTwoFactorSetupModal, verifyAppLockPin
- 바깥 js 가 window 이름을 씀: js/tabs/settings/app-lock-pin.js, js/tabs/settings/sub-security.js

### G117 📈 표 기록 기반 일자별 자동 성장 추이 차트 (Visual Trend Chart)

- 15913~16023줄(111줄) · 보통(17)
- 함수(1): computeTrendChartData
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: dateKey, pad
- 부르는 묶음(들어옴): G120×4
- 부르는 대상(나감): G116×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-shipyard-modular.js, scripts/verify-integrity-gate.js, tests/account-withdrawal-modal.test.js, tests/goal-template-legacy-cleanup.test.js, tests/goal-templates-data-split.test.js, tests/goal-templates-encyclopedia.test.js, tests/record-ledger-sync.test.js 외 1 (index.html 단독 읽기: tests/account-withdrawal-modal.test.js, tests/goal-templates-data-split.test.js, tests/record-ledger-sync.test.js)
- smoke-test FN_NAMES: computeTrendChartData — 옮기려면 시험지 선행 PR 먼저

### G010 [#TASK-ES-436] 인라인 스크립트 세포화 P1 이음매 1 — 목표 AI·일정 설정, 기록 AI 피드백 (docs/architecture/INLINE-SC

- 2891~2924줄(34줄) · 보통(17)
- 함수(0): 없음
- 변수(15): applyScheduleUpdate, celebrateMilestoneDone, computeGoalStatusHash, formatSchedulePillHtml, generateGoalStatusSummary, initFeedbackTierBar, localGoalStatusSummary, milestonesForAI, openScheduleSetupModal, requestAIFeedback, requestServerAIFeedback, requestTodayMission, sanitizeAttachments, sendGoalAgentMessage, showGoalAgentReviewStep
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: DONE_KEYWORDS, GeminiQuotaDispatcher, THEME_FEEDBACK_PROMPTS, TOPICS, _goalsKit, _recordsKit, localNextActionSuggestion, localTodayMission, renderGoalsScreen
- 로드 중 문 1: 호출 1
- 부르는 대상(나감): G095×2, G070×1, G087×1, G140×1
- 시험지 글자 의존: scripts/smoke-test.js, tests/ai-conditional-call-optimization.test.js, tests/goal-ai-advice-status.test.js, tests/goals-schedule-sync.test.js (index.html 단독 읽기: tests/goal-ai-advice-status.test.js, tests/goals-schedule-sync.test.js)

### G118 ⏱️ 인앱 인터벌 타이머 & 스톱워치 위젯 (In-Table Stopwatch)

- 16024~16045줄(22줄) · 보통(17)
- 함수(1): formatStopwatchTime
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: pad, renderLapRowsHtml, renderStopwatchWidgetHtml
- 로드 중 문 1: IfStatement 1
- window 노출(2줄): renderLapRowsHtml, renderStopwatchWidgetHtml
- 부르는 묶음(들어옴): G120×4
- 바깥 js 가 window 이름을 씀: js/tabs/records/table-stopwatch.js
- 시험지 글자 의존: scripts/smoke-test.js, tests/record-ledger-sync.test.js, tests/stopwatch-lap-inputs.test.js, tests/stopwatch-table-hint.test.js (index.html 단독 읽기: tests/record-ledger-sync.test.js)
- smoke-test FN_NAMES: formatStopwatchTime — 옮기려면 시험지 선행 PR 먼저

### G136 맥락 기반 다이내믹 알림 문구 생성

- 20799~20850줄(52줄) · 보통(19)
- 함수(1): generateDynamicNotification
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: MOCK_GROUPS, dateKey, pad
- 부르는 묶음(들어옴): G001×1, G137×1
- 부르는 대상(나감): G135×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js, tests/core-confirm-es376.test.js, tests/goals-schedule-sync.test.js, tests/record-ledger-sync.test.js, tests/xp-server-ledger-es421.test.js (index.html 단독 읽기: tests/goals-schedule-sync.test.js, tests/record-ledger-sync.test.js, tests/xp-server-ledger-es421.test.js)
- smoke-test FN_NAMES: generateDynamicNotification — 옮기려면 시험지 선행 PR 먼저

### G047 P0: 회원 탈퇴 30일 유예(소프트 삭제) 복구 체크

- 4399~4498줄(100줄) · 보통(20)
- 함수(0): 없음
- 변수(1): resyncBtn
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: checkPendingDeletionRestore, migrateGuestDataToUser, saveProfile, sb, state
- 로드 중 문 5: 호출 3 · var 초기값 실행 1 · IfStatement 1
- 이벤트 처리기: addEventListener 4 · on<이벤트> 대입 0
- 부르는 대상(나감): G018×7, G026×3, G044×2, G142×2, G035×1, G053×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-shipyard-modular.js, scripts/verify-integrity-gate.js, tests/core-confirm-es374.test.js, tests/core-confirm-es376.test.js, tests/direct-login-guard.test.js, tests/google-session-guard.test.js (index.html 단독 읽기: tests/google-session-guard.test.js)

### G038 2계정 상호작용 테스트 (테스터 B 직통 입장: #TASK-ES-169)

- 3866~3903줄(38줄) · 보통(20)
- 함수(1): enterAsTesterB
- 변수(2): authTesterBBtn, landTesterBBtn
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: loginWithDirectIdentifier
- 로드 중 문 5: IfStatement 3 · var 초기값 실행 2
- window 노출(1줄): enterAsTesterB
- 이벤트 처리기: addEventListener 2 · on<이벤트> 대입 0
- 부르는 대상(나감): G018×2, G026×1, G053×1
- 시험지 글자 의존: scripts/smoke-test.js, tests/account-switch-isolation.test.js, tests/dev-host-gate.test.js, tests/direct-login-guard.test.js, tests/gcal-login-reconnect-fix.test.js, tests/google-session-guard.test.js, tests/logout-scope-es399.test.js (index.html 단독 읽기: tests/gcal-login-reconnect-fix.test.js, tests/google-session-guard.test.js)

### G013 [#TASK-ES-437] 인라인 스크립트 세포화 P0 이음매 (docs/architecture/INLINE-SCRIPT-MAP.md 지도 · docs/specs

- 3014~3049줄(36줄) · 보통(20)
- 함수(0): 없음
- 변수(20): applyAppSettings, applyQuickCunningText, applyTheme, checkGuestBackupNudge, checkPendingDeletionRestore, checkStreakFreeze, closeAvatarGreetingPopup, gaugeSvg, importTemplateInstantly, initRememberedAuthFields, openAvatarGreetingPopup, openChangePasswordModal, openGuestBackupNudgeModal, openTeamInviteModal, openTeamLinkedPersonalGoalModal, sendToNotion, showCommTourModal, showLegalModal, showLevelUpBanner, templateMilestones
- 다른 묶음 상태 — 대입: __avatarGreetTimer · 변경: 없음 · 읽기: GOAL_TEMPLATES, MOCK_GROUPS, __avatarGreetTimer, _goalsKit, _recordsKit, _settingsKit, isValidRealUser, openAvatarLevelUpModal
- 로드 중 문 1: 호출 1
- 부르는 대상(나감): G069×3, G040×1, G091×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js, tests/account-switch-isolation.test.js, tests/direct-login-guard.test.js, tests/google-session-guard.test.js, tests/logout-scope-es399.test.js, tests/theme-system-v4.test.js (index.html 단독 읽기: tests/google-session-guard.test.js, tests/theme-system-v4.test.js)

### G123 테마별 기록 DB 다운로드 & 외부 AI 분석 프롬프트 번들 (TASK-OG-001)

- 18937~18969줄(33줄) · 보통(20)
- 함수(2): buildCSV, getAIAnalysisPrompt
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: RECORD_THEMES, TOPICS, dateKey, fmtTime, state
- 부르는 묶음(들어옴): G125×5, G009×1
- 시험지 글자 의존: scripts/smoke-test.js, tests/goals-smart-attachments.test.js (index.html 단독 읽기: tests/goals-smart-attachments.test.js)
- smoke-test FN_NAMES: buildCSV, getAIAnalysisPrompt — 옮기려면 시험지 선행 PR 먼저

### G119 CSV / 엑셀 양방향 연동 & 스마트워치 매핑 & 목표 3각 추적

- 16046~16909줄(864줄) · 보통(24)
- 함수(11): compressImageForVision, decrementVisionDailyQuota, downloadTableAsCsv, getVisionDailyQuota, openCsvImportModal, openVisionTableModal, openVoiceTableModal, openWearableSyncModal, parseCsvText, parseVoiceToTableRow, syncRecordToMatchingGoals
- 변수(2): CURATED_MARKET_TEMPLATES, VISION_DAILY_LIMIT
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: closeModal, escapeHtml, fmtYYMMDD, state
- 이벤트 처리기: addEventListener 0 · on<이벤트> 대입 29
- 부르는 묶음(들어옴): G120×6
- 부르는 대상(나감): G018×14, G058×4, G080×2
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-calendar-attachments.js, scripts/verify-all-clicks.js, scripts/verify-integrity-gate.js, tests/account-switch-isolation.test.js, tests/direct-login-guard.test.js, tests/push-subscribe-auth-es400.test.js, tests/security-audit.test.js 외 1 (index.html 단독 읽기: scripts/test-calendar-attachments.js, tests/push-subscribe-auth-es400.test.js, tests/security-audit.test.js)
- smoke-test FN_NAMES: parseCsvText, parseVoiceToTableRow — 옮기려면 시험지 선행 PR 먼저

### G044 디바이스 세션 & 원격 로그아웃 유틸 (Req 1)

- 4266~4379줄(114줄) · 보통(24)
- 함수(5): checkRemoteSessionRevoked, getDeviceId, getDeviceLoginTime, performLogout, setDeviceLoginTime
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: getAttribution, initRememberedAuthFields, saveProfile, sb, startOnboarding, state, track
- 로드 중 문 1: 호출 1
- 이벤트 처리기: addEventListener 1 · on<이벤트> 대입 0
- 부르는 묶음(들어옴): G053×5, G014×3, G040×3, G047×2, G109×2, G009×1, G144×1
- 부르는 대상(나감): G026×2, G138×2, G018×1, G069×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-shipyard-modular.js, scripts/verify-integrity-gate.js, tests/account-switch-isolation.test.js, tests/dev-host-gate.test.js, tests/direct-login-guard.test.js, tests/gcal-login-reconnect-fix.test.js, tests/google-session-guard.test.js 외 2 (index.html 단독 읽기: tests/gcal-login-reconnect-fix.test.js, tests/google-session-guard.test.js)

### G035 서버 관리자 API를 통한 기록 및 프로필 복구 (#TASK-ES-036)

- 3739~3851줄(113줄) · 보통(24)
- 함수(1): syncServerRecords
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: getTrashList, renderCalendarScreen, renderRecordsScreen, renderSettingsScreen, saveLocalSettings, state
- 부르는 묶음(들어옴): G002×1, G047×1, G145×1
- 부르는 대상(나감): G015×1, G076×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js, tests/account-switch-isolation.test.js, tests/direct-login-guard.test.js, tests/dm-push-auth-es397.test.js, tests/gcal-login-reconnect-fix.test.js, tests/logout-scope-es399.test.js, tests/module-guard.test.js 외 4 (index.html 단독 읽기: tests/gcal-login-reconnect-fix.test.js, tests/push-subscribe-auth-es400.test.js, tests/record-ledger-sync.test.js, tests/security-audit.test.js, tests/sync-server-records-render-home.test.js)

### G015 Supabase

- 3088~3126줄(39줄) · 보통(24)
- 함수(1): getSupabaseAuthToken
- 변수(5): GOOGLE_OAUTH_CLIENT_ID, SUPABASE_ANON_KEY, SUPABASE_URL, _pendingAuthSession, sb
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: restoreSessionAndEnter, state
- 로드 중 문 2: TryStatement 1 · IfStatement 1
- window 노출(1줄): getSupabaseAuthToken
- 부르는 묶음(들어옴): G138×2, G026×1, G035×1, G125×1
- 바깥 js 가 window 이름을 씀: js/tabs/comm/dm-ledger.js
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js, tests/account-switch-isolation.test.js, tests/direct-login-guard.test.js, tests/google-session-guard.test.js, tests/logout-scope-es399.test.js, tests/push-subscribe-auth-es400.test.js, tests/security-audit.test.js 외 1 (index.html 단독 읽기: tests/google-session-guard.test.js, tests/push-subscribe-auth-es400.test.js, tests/security-audit.test.js, tests/sync-server-records-render-home.test.js)

### G014 [#TASK-ES-442] 인라인 스크립트 세포화 P0 이음매 (docs/architecture/INLINE-SCRIPT-MAP.md 지도 · docs/specs

- 3050~3087줄(38줄) · 보통(24)
- 함수(0): 없음
- 변수(20): challengeTwoFactorModal, convertTextToNotionDbRecord, defaultSettings, getRegisteredDevices, goalProgress, initDevDebugButtons, isHashedAppLockPin, migrateGuestDataToUser, msCounts, openLogoutOtherDevicesConfirmModal, openTabGuideHubModal, openTwoFactorDisableModal, openTwoFactorSetupModal, renderActiveDevicesList, renderPromptEncyclopediaHtml, resultPct, startOnboarding, toggleScheduleDone, verifyAppLockPin, wirePromptEncyclopediaEvents
- 다른 묶음 상태 — 대입: _promptEncyclopediaOpen, _promptTabState · 변경: 없음 · 읽기: APP_LOCK_PIN_PREFIX, USER_SESSION_CHANNEL, _calendarKit, _goalsKit, _promptEncyclopediaOpen, _promptTabState, _settingsKit, gcalEventsKey, purgeLegacySharedGcalKeys, renderFirstCheckinTutorialBanner, renderSettingsScreen
- 로드 중 문 1: 호출 1
- 부르는 대상(나감): G044×3, G053×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js, tests/account-switch-isolation.test.js, tests/dev-host-gate.test.js, tests/device-session-control.test.js, tests/direct-login-guard.test.js, tests/gcal-login-reconnect-fix.test.js, tests/logout-scope-es399.test.js 외 2 (index.html 단독 읽기: tests/gcal-login-reconnect-fix.test.js)

### G100 [#TASK-ES-220] [생각 메모장 91번] 교대근무자 가변형 루틴 프리셋 & 자동 스케줄러

- 11606~11927줄(322줄) · 보통(25)
- 함수(3): applyShiftWorkRoutines, openShiftCycleModal, openShiftWorkCustomModal
- 변수(1): SHIFT_WORK_PRESETS
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: closeModal, dateKey, escapeHtml, saveProfile, state, triggerHaptic
- 로드 중 문 4: window 노출 4
- window 노출(4줄): SHIFT_WORK_PRESETS, applyShiftWorkRoutines, openShiftCycleModal, openShiftWorkCustomModal
- 이벤트 처리기: addEventListener 0 · on<이벤트> 대입 8
- 부르는 묶음(들어옴): G101×7
- 부르는 대상(나감): G018×4, G058×2, G101×2
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-all-clicks.js, scripts/verify-integrity-gate.js, tests/goals-schedule-sync.test.js, tests/guest-null-client-es377.test.js, tests/hidden-entry-guard.test.js, tests/routine-tab-scheduler.test.js, tests/stopwatch-lap-inputs.test.js (index.html 단독 읽기: tests/goals-schedule-sync.test.js, tests/routine-tab-scheduler.test.js)

### G012 [#TASK-ES-448] 인라인 스크립트 세포화 P2-2 이음매 (docs/architecture/INLINE-SCRIPT-MAP.md 지도 · docs/spe

- 2949~3013줄(65줄) · 보통(25)
- 함수(0): 없음
- 변수(43): CREATOR_TEMPLATES, EXTERNAL_DATA, MANITO_EMOJI, MANITO_STAMPS, MANITO_WELCOME_STAMPS, MOCK_PEOPLE, SHARE_PLATFORMS, SIM_PERSONAS, TOPICS, VISIBILITY_LABELS, buildInviteLinkSuffix, categoryPickerHtml, daysFromNow, drawShareWatermark, ensureFeedPostsLoaded, genAnonName, generateShareImage, groupCheckedToday, groupState, groupStreak 외 23
- 다른 묶음 상태 — 대입: FEED_POSTS_CACHE · 변경: 없음 · 읽기: FEED_POSTS_CACHE, MOCK_GROUPS, _commKit, _goalsKit, _recordsKit, _settingsKit, getFeedComments, setFeedComments
- 로드 중 문 2: 호출 1 · TryStatement 1
- 부르는 대상(나감): G091×1, G115×1, G122×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js, tests/desktop-widget-suite.test.js, tests/guest-null-client-es377.test.js, tests/hidden-entry-guard.test.js, tests/record-ledger-sync.test.js, tests/stopwatch-lap-inputs.test.js, tests/stopwatch-table-hint.test.js 외 3 (index.html 단독 읽기: tests/record-ledger-sync.test.js, tests/team-fold-state-es409.test.js, tests/theme-system-v4.test.js)

### G040 소셜 로그인 (카카오 / 실제 구글 OAuth 연동)

- 3913~4218줄(306줄) · 어려움(26)
- 함수(7): getGoogleTokenClient, handleGoogleUserSuccess, initGoogleOneTap, parseJwtPayload, sha256Hex, startGoogleLogin, startOAuthLogin
- 변수(2): _googleOneTapNonce, _googleTokenClient
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: GOOGLE_OAUTH_CLIENT_ID, closeModal, escapeHtml, initRememberedAuthFields, openLoginRescueModal, restoreSessionAndEnter, saveProfile, sb, state
- 로드 중 문 2: 호출 2
- 이벤트 처리기: addEventListener 2 · on<이벤트> 대입 7
- 부르는 묶음(들어옴): G009×1, G013×1
- 부르는 대상(나감): G018×10, G044×3, G058×2, G065×2
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-all-clicks.js, scripts/verify-integrity-gate.js, tests/dev-host-gate.test.js, tests/direct-login-guard.test.js, tests/gcal-login-reconnect-fix.test.js, tests/goals-schedule-sync.test.js, tests/google-session-guard.test.js 외 3 (index.html 단독 읽기: tests/gcal-login-reconnect-fix.test.js, tests/goals-schedule-sync.test.js, tests/google-session-guard.test.js)

### G056 최초 로그인 활용가이드 — 4대 탭 무블러(Zero Blur) 투명 라이브 프리뷰 융합

- 4870~5153줄(284줄) · 어려움(26)
- 함수(5): getPrivacyLabel, maybeShowFirstLoginGuide, openPrivacyPickerModal, startFirstLoginGuide, updatePrivacyBadges
- 변수(2): navButtons, screens
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: closeModal, escapeHtml, saveProfile, setTab, showCommTourModal, state
- 로드 중 문 3: window 노출 1 · var 초기값 실행 2
- window 노출(1줄): startFirstLoginGuide
- 이벤트 처리기: addEventListener 12 · on<이벤트> 대입 9
- 부르는 묶음(들어옴): G001×1, G050×1
- 부르는 대상(나감): G058×7, G018×4
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-all-clicks.js, scripts/verify-integrity-gate.js, tests/goals-schedule-sync.test.js, tests/guest-null-client-es377.test.js, tests/hidden-entry-guard.test.js, tests/records-tab-rename.test.js, tests/today-mission-card-guide.test.js (index.html 단독 읽기: tests/goals-schedule-sync.test.js, tests/today-mission-card-guide.test.js)
- smoke-test FN_NAMES: getPrivacyLabel — 옮기려면 시험지 선행 PR 먼저

### G126 크리에이터 템플릿 (#TASK-ES-315, 64: 구형 창 영구 제거 및 무해화)

- 19422~19470줄(49줄) · 어려움(26)
- 함수(2): cloneTemplate, templatesHtml
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: CREATOR_TEMPLATES, escapeHtml, newId, nowISO, saveProfile, state, trackGoalCreated, uid
- 로드 중 문 1: window 노출 1
- window 노출(1줄): cloneTemplate
- 부르는 묶음(들어옴): G091×2, G009×1, G128×1, G150×1
- 부르는 대상(나감): G018×1, G142×1
- 바깥 js 가 window 이름을 씀: js/tabs/goals/template-encyclopedia.js, js/team-invite-comm.js, js/viral-sharing.js
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-all-clicks.js, scripts/verify-integrity-gate.js, tests/goal-template-legacy-cleanup.test.js, tests/goal-templates-data-split.test.js, tests/goals-schedule-sync.test.js, tests/guest-null-client-es377.test.js, tests/hidden-entry-guard.test.js (index.html 단독 읽기: tests/goal-templates-data-split.test.js, tests/goals-schedule-sync.test.js)

### G142 Render all

- 21048~21060줄(13줄) · 어려움(26)
- 함수(1): renderAll
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: renderCalendarScreen, renderCommScreen, renderGoalsScreen, renderRecordsScreen, renderSettingsScreen, state
- 부르는 묶음(들어옴): G101×6, G047×2, G145×2, G001×1, G053×1, G063×1, G076×1, G086×1, G095×1, G097×1 외 1
- 부르는 대상(나감): G141×2, G063×1, G076×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-calendar-attachments.js, scripts/test-shipyard-modular.js, tests/ai-conditional-call-optimization.test.js, tests/app-evaluation-notice.test.js, tests/device-session-control.test.js, tests/goal-template-legacy-cleanup.test.js, tests/team-creation-clean.test.js 외 2 (index.html 단독 읽기: scripts/test-calendar-attachments.js, tests/app-evaluation-notice.test.js, tests/unique-display-name.test.js)

### G115 [#TASK-ES-233] 3일 실천 완성 나의 6각 성장 차트 미리보기 SVG 렌더러

- 15463~15738줄(276줄) · 어려움(27)
- 함수(4): openThemePickerModal, renderColdstartRadarPreviewSvg, renderLifeBalanceWheel, renderRecordThemeFilters
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: RECORD_THEMES, closeModal, escapeHtml, renderRecordsScreen, saveProfile, state, switchTab, triggerHapticFeedback
- 이벤트 처리기: addEventListener 6 · on<이벤트> 대입 0
- 부르는 묶음(들어옴): G002×2, G012×1
- 부르는 대상(나감): G122×4, G018×1, G058×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-calendar-attachments.js, scripts/test-shipyard-modular.js, scripts/verify-all-clicks.js, tests/achievement-graph-multiset.test.js, tests/goal-ai-advice-status.test.js, tests/goals-schedule-sync.test.js, tests/guest-null-client-es377.test.js 외 6 (index.html 단독 읽기: scripts/test-calendar-attachments.js, tests/goal-ai-advice-status.test.js, tests/goals-schedule-sync.test.js, tests/routine-tab-scheduler.test.js, tests/team-goal-guide-hint.test.js)

### G048 회원 탈퇴 전용 안내 모달 및 법적책임·데이터분실 사전 안내 (#TASK-ES-158)

- 4499~4675줄(177줄) · 어려움(27)
- 함수(4): closeWithdrawModal, openWithdrawModal, submitWithdrawAccount, withdrawAccount
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: closeModal, initRememberedAuthFields, saveProfile, sb, state
- 로드 중 문 1: 호출 1
- 이벤트 처리기: addEventListener 1 · on<이벤트> 대입 4
- 부르는 대상(나감): G018×6, G058×1, G069×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-all-clicks.js, scripts/verify-integrity-gate.js, tests/account-switch-isolation.test.js, tests/account-withdrawal-modal.test.js, tests/core-toast-es361.test.js, tests/dev-host-gate.test.js, tests/direct-login-guard.test.js 외 6 (index.html 단독 읽기: tests/account-withdrawal-modal.test.js, tests/core-toast-es361.test.js, tests/gcal-login-reconnect-fix.test.js, tests/google-session-guard.test.js, tests/push-subscribe-auth-es400.test.js, tests/security-audit.test.js)

### G098 [#TASK-ES-264] 오늘의 미션 및 AI 피드백 조건부 호출 최적화

- 11513~11593줄(81줄) · 어려움(27)
- 함수(2): computeTodayMissionHash, renderTodayMissionCard
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: computeGoalStatusHash, dateKey, escapeHtml, getEffectiveStandardDateKey, nowISO, requestTodayMission, saveProfile, state
- 로드 중 문 1: IfStatement 1
- window 노출(1줄): computeTodayMissionHash
- 이벤트 처리기: addEventListener 0 · on<이벤트> 대입 1
- 부르는 묶음(들어옴): G141×2, G076×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-all-clicks.js, tests/ai-conditional-call-optimization.test.js, tests/core-confirm-es374.test.js, tests/goals-schedule-sync.test.js, tests/guest-null-client-es377.test.js, tests/hidden-entry-guard.test.js, tests/hide-home-debug-cards.test.js 외 2 (index.html 단독 읽기: tests/goals-schedule-sync.test.js, tests/hide-home-debug-cards.test.js, tests/home-customizer-auto-sync.test.js, tests/today-mission-card-guide.test.js)

### G037 [#TASK-ES-222] [생각 메모장 92번] 카카오톡 인앱 브라우저 감지 및 Android Chrome 자동 탈출 & iOS Safari 플로팅 가이드 배너

- 3853~3865줄(13줄) · 어려움(27)
- 함수(0): 없음
- 변수(2): landGuestBtn, landNickQuickLink
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindLandGuestBtn, bindLandLoginLink, bindLandNickQuickLink, bindLandStartBtn, checkKakaoInAppBrowser, escapeKakaoInAppBrowser
- 로드 중 문 9: 호출 5 · window 노출 2 · var 초기값 실행 2
- window 노출(2줄): checkKakaoInAppBrowser, escapeKakaoInAppBrowser
- 바깥 js 가 window 이름을 씀: js/tabs/settings/inapp-landing.js
- 시험지 글자 의존: scripts/smoke-test.js

### G130 [PEER INVITE] '함께 목표' 방 초대 루프 (웹 무설치 즉시 수락)

- 20701~20724줄(24줄) · 어려움(28)
- 함수(3): buildPeerInviteUrl, calculateRemainingSeats, formatPeerInviteMessage
- 부르는 묶음(들어옴): G009×3
- 시험지 글자 의존: scripts/smoke-test.js, tests/account-switch-isolation.test.js, tests/avatar-personas-split.test.js, tests/dev-host-gate.test.js, tests/direct-login-guard.test.js, tests/google-session-guard.test.js, tests/record-ledger-sync.test.js, tests/xp-server-ledger-es421.test.js (index.html 단독 읽기: tests/avatar-personas-split.test.js, tests/google-session-guard.test.js, tests/record-ledger-sync.test.js, tests/xp-server-ledger-es421.test.js)
- smoke-test FN_NAMES: buildPeerInviteUrl, calculateRemainingSeats, formatPeerInviteMessage — 옮기려면 시험지 선행 PR 먼저

### G068 캘린더 수동 일정 편집 모달 (Req 2 & #TASK-ES-253)

- 6287~6782줄(496줄) · 어려움(31)
- 함수(1): openCalendarManualEditModal
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: escapeHtml, gcalEventsKey, getGoogleAccessToken, isGoogleCalendarConnected, moveToTrash, nowISO, openCalendarDayEditHubModal, renderCalendarScreen, renderGoalsScreen, renderRecordsScreen, saveLocalSettings, saveProfile 외 3
- 이벤트 처리기: addEventListener 0 · on<이벤트> 대입 10
- 부르는 묶음(들어옴): G003×1, G069×1
- 부르는 대상(나감): G076×8, G018×5, G066×4, G058×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-calendar-attachments.js, scripts/test-shipyard-modular.js, scripts/verify-integrity-gate.js, tests/achievement-graph-multiset.test.js, tests/core-confirm-es374.test.js, tests/core-confirm-es376.test.js, tests/goals-schedule-sync.test.js 외 6 (index.html 단독 읽기: scripts/test-calendar-attachments.js, tests/goals-schedule-sync.test.js, tests/goals-smart-attachments.test.js, tests/routine-tab-scheduler.test.js)

### G077 11인 외부 UI/UX 감시 및 개선팀 핵심 기능 구현

- 8166~8311줄(146줄) · 어려움(33)
- 함수(3): announceToA11y, renderDailyQuestBar, renderTodayGlancePill
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: awardXP, burstConfetti, calculateWeeklyFocusStats, dateKey, saveLocalSettings, saveProfile, state, switchTab, triggerHaptic
- 이벤트 처리기: addEventListener 0 · on<이벤트> 대입 4
- 부르는 묶음(들어옴): G076×4, G008×1, G009×1
- 부르는 대상(나감): G018×2, G023×1, G069×1
- 시험지 글자 의존: scripts/smoke-test.js, tests/goal-ai-advice-status.test.js, tests/goals-smart-attachments.test.js, tests/hide-home-debug-cards.test.js, tests/home-customizer-auto-sync.test.js, tests/quest-task-exp.test.js, tests/team-goal-guide-hint.test.js, tests/theme-system-v4.test.js 외 1 (index.html 단독 읽기: tests/goal-ai-advice-status.test.js, tests/goals-smart-attachments.test.js, tests/hide-home-debug-cards.test.js, tests/home-customizer-auto-sync.test.js, tests/team-goal-guide-hint.test.js, tests/theme-system-v4.test.js, tests/unique-display-name.test.js)

### G086 기록 기반 목표·마일스톤·할 일 자동 업데이트 제안

- 8845~8980줄(136줄) · 어려움(33)
- 함수(5): applySuggestion, describeSuggestion, findSuggestionTarget, maybeShowGoalUpdateModal, sanitizeSuggestions
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: XP_RULES, awardXP, burstConfetti, celebrateMilestoneDone, closeModal, escapeHtml, levelForXP, saveProfile, showLevelUpBanner, state
- 이벤트 처리기: addEventListener 3 · on<이벤트> 대입 0
- 부르는 묶음(들어옴): G011×1, G120×1, G122×1
- 부르는 대상(나감): G018×1, G023×1, G058×1, G142×1
- 시험지 글자 의존: scripts/smoke-test.js
- smoke-test FN_NAMES: applySuggestion, describeSuggestion, findSuggestionTarget, sanitizeSuggestions — 옮기려면 시험지 선행 PR 먼저

### G070 5대 테마 온톨로지 & 경량 AI 분류기 (TASK-OG-001)

- 7612~7867줄(256줄) · 어려움(34)
- 함수(3): buildCheckinRecord, classifyRecordTheme, saveQuickCheckin
- 변수(4): CATEGORY_THEME_MAP, RECORD_THEMES, THEME_KEYWORDS, THEME_REGEX_RULES
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: MOCK_GROUPS, XP_RULES, awardXP, checkGuestBackupNudge, dayIndexSinceSignup, groupState, newId, nowISO, saveProfile, state, track, triggerFirstCheerResponse
- 부르는 묶음(들어옴): G026×2, G010×1
- 부르는 대상(나감): G069×4, G140×2
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-calendar-attachments.js, scripts/test-shipyard-modular.js, tests/account-switch-isolation.test.js, tests/core-confirm-es376.test.js, tests/direct-login-guard.test.js, tests/feed-post-category-diversity.test.js, tests/goal-templates-data-split.test.js 외 6 (index.html 단독 읽기: scripts/test-calendar-attachments.js, tests/goal-templates-data-split.test.js, tests/goals-schedule-sync.test.js, tests/record-ledger-sync.test.js, tests/routine-tab-scheduler.test.js)
- smoke-test FN_NAMES: buildCheckinRecord — 옮기려면 시험지 선행 PR 먼저

### G065 [#TASK-ES-153] 전역 7일 유예 통합 휴지통 (Recycle Bin) 시스템

- 5887~5932줄(46줄) · 어려움(35)
- 함수(2): calendarAvailable, saveGoogleToken
- 변수(1): googleTokenClient
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: gcalCurrentUid, gcalTokenStatus, getGoogleAccessToken, isGoogleCalendarConnected, purgeLegacySharedGcalKeys, requestGoogleToken, restoreGoogleToken, state
- 로드 중 문 1: IfStatement 1
- window 노출(6줄): gcalTokenStatus, getGoogleAccessToken, isGoogleCalendarConnected, requestGoogleToken, restoreGoogleToken, saveGoogleToken
- 부르는 묶음(들어옴): G040×2, G003×1, G009×1
- 바깥 js 가 window 이름을 씀: js/core/gcal-sync.js, js/core/trash-bin.js, js/tabs/calendar/natural-schedule.js, js/tabs/calendar/render.js, js/tabs/settings/session-entry.js, js/tabs/settings/sub-integrations.js
- 시험지 글자 의존: scripts/smoke-test.js, tests/core-confirm-es376.test.js, tests/gcal-login-reconnect-fix.test.js (index.html 단독 읽기: tests/gcal-login-reconnect-fix.test.js)
- smoke-test FN_NAMES: calendarAvailable — 옮기려면 시험지 선행 PR 먼저

### G103 [#TASK-ES-189] 템플릿 백과사전 3대 분류(개인·루틴·팀) 및 AI/실유저 2원화 이식 시스템

- 12632~12646줄(15줄) · 어려움(35)
- 함수(0): 없음
- 변수(4): _subtabTplCat, _subtabTplDomain, _subtabTplQuery, _subtabTplType
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: PERSONAL_TEMPLATES_REAL, ROUTINE_TEMPLATES_AI, ROUTINE_TEMPLATES_REAL, TEAM_TEMPLATES_AI, TEAM_TEMPLATES_REAL, renderTemplateEncyclopediaScreen
- 로드 중 문 8: window 노출 8
- window 노출(8줄): PERSONAL_TEMPLATES_REAL, ROUTINE_TEMPLATES_AI, ROUTINE_TEMPLATES_REAL, TEAM_TEMPLATES_AI, TEAM_TEMPLATES_REAL, _subtabTplDomain, _subtabTplType, renderTemplateEncyclopediaScreen
- 바깥 js 가 window 이름을 씀: js/tabs/goals/render.js, js/tabs/goals/template-encyclopedia.js
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-shipyard-modular.js, scripts/verify-integrity-gate.js, tests/routine-tab-scheduler.test.js (index.html 단독 읽기: tests/routine-tab-scheduler.test.js)

### G101 [#TASK-ES-172] [27] 목표 탭: 데일리 루틴 서브탭 & 편집/상세 모달

- 11928~12628줄(701줄) · 어려움(37)
- 함수(3): openAddRoutineModal, openRoutineDetailModal, renderRoutineGoalsScreen
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: SHIFT_WORK_PRESETS, awardXP, burstConfetti, closeModal, dateKey, escapeHtml, saveProfile, state, triggerHaptic
- 로드 중 문 1: IfStatement 1
- window 노출(2줄): openRoutineDetailModal, renderRoutineGoalsScreen
- 이벤트 처리기: addEventListener 0 · on<이벤트> 대입 25
- 부르는 묶음(들어옴): G100×2, G004×1
- 부르는 대상(나감): G018×7, G100×7, G142×6, G058×2
- 바깥 js 가 window 이름을 씀: js/tabs/goals/render.js, js/tabs/goals/sub-routine.js
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-all-clicks.js, scripts/verify-integrity-gate.js, tests/achievement-graph-multiset.test.js, tests/core-confirm-es376.test.js, tests/feed-post-category-diversity.test.js, tests/goals-only-view.test.js, tests/goals-schedule-sync.test.js 외 7 (index.html 단독 읽기: tests/goals-only-view.test.js, tests/goals-schedule-sync.test.js, tests/record-ledger-sync.test.js, tests/routine-detail-modal.test.js, tests/routine-tab-scheduler.test.js, tests/xp-server-ledger-es421.test.js)

### G128 피드 상호소통 댓글 & 리액션 헬퍼 (#TASK-ES-133 서버 DB 실시간 동기화)

- 19474~20108줄(635줄) · 어려움(37)
- 함수(2): feedPostHtml, renderCommFeed
- 다른 묶음 상태 — 대입: FEED_POSTS_CACHE · 변경: state · 읽기: FEED_POSTS_CACHE, SIM_PERSONAS, ensureFeedPostsLoaded, escapeHtml, filterFeedByCategory, getFeedComments, goalProgress, handleUserCommentSubmit, loadServerFeedComments, nowISO, openPhotoViewerModal, renderCommScreen 외 7
- 이벤트 처리기: addEventListener 18 · on<이벤트> 대입 3
- 부르는 묶음(들어옴): G109×2, G007×1, G147×1
- 부르는 대상(나감): G018×7, G087×4, G109×3, G133×2, G125×1, G126×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-shipyard-modular.js, scripts/verify-all-clicks.js, scripts/verify-integrity-gate.js, tests/core-confirm-es374.test.js, tests/core-confirm-es376.test.js, tests/core-toast-es361.test.js, tests/dm-push-auth-es397.test.js 외 7 (index.html 단독 읽기: tests/core-toast-es361.test.js, tests/goal-templates-data-split.test.js, tests/goals-schedule-sync.test.js)

### G090 외부 데이터 불러오기 (mock)

- 10076~10143줄(68줄) · 어려움(38)
- 함수(1): openHomeCustomizer
- 변수(4): btnCustomHome, btnShowGuide, topBtnCustomHome, topBtnGuide
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: EXTERNAL_DATA, closeModal, escapeHtml, renderRecordsScreen, saveProfile, state, track
- 로드 중 문 9: 호출 1 · var 초기값 실행 4 · IfStatement 4
- 이벤트 처리기: addEventListener 7 · on<이벤트> 대입 1
- 인라인 on*="…" 이 부르는 함수: openHomeCustomizer
- 부르는 대상(나감): G058×4, G018×3, G110×1
- 시험지 글자 의존: scripts/smoke-test.js, tests/remove-duplicate-home-layout-button.test.js, tests/theme-system-v4.test.js, tests/top-page-guide-reposition.test.js (index.html 단독 읽기: tests/remove-duplicate-home-layout-button.test.js, tests/theme-system-v4.test.js, tests/top-page-guide-reposition.test.js)

### G095 참고자료 (유튜브/영상, 이미지, 텍스트 메모, 웹링크)

- 10754~11314줄(561줄) · 어려움(41)
- 함수(8): applyGoalAgentOp, buildGoalFromAgentData, normalizeSequentialMilestoneDates, openAddAttachmentModal, openAttachmentViewer, renderAttachmentChipsHtml, renderInlineAttachmentChips, wireAttachmentChipClicks
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: closeModal, dateKey, escapeHtml, newId, nowISO, openCalendarDayEditHubModal, pad, renderCalendarScreen, sanitizeAttachments, saveProfile, state, trackGoalCreated 외 2
- 로드 중 문 1: IfStatement 1
- window 노출(4줄): openAddAttachmentModal, openAttachmentViewer, renderAttachmentChipsHtml, renderInlineAttachmentChips
- 이벤트 처리기: addEventListener 11 · on<이벤트> 대입 1
- 부르는 묶음(들어옴): G003×2, G004×2, G010×2
- 부르는 대상(나감): G018×13, G058×2, G063×1, G142×1
- 바깥 js 가 window 이름을 씀: js/calendar-attachment.js, js/tabs/calendar/day-detail.js, js/tabs/goals/goal-detail-events.js, js/tabs/goals/goal-detail.js
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-calendar-attachments.js, scripts/test-shipyard-modular.js, scripts/verify-all-clicks.js, scripts/verify-integrity-gate.js, tests/core-confirm-es374.test.js, tests/core-confirm-es376.test.js, tests/goals-schedule-sync.test.js 외 4 (index.html 단독 읽기: scripts/test-calendar-attachments.js, tests/goals-schedule-sync.test.js, tests/goals-smart-attachments.test.js, tests/google-session-guard.test.js)

### G024 [#TASK-ES-150] 아바타 레벨업 대형 팝업 & 성장 성향 키워드

- 3335~3356줄(22줄) · 어려움(41)
- 함수(0): 없음
- 변수(6): avLvModalElem, btnAvLvClose, btnAvLvConfirm, btnSaveGrowth, btnSaveLvImg, btnShareLv
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindAvatarGrowthPromptSave, bindAvatarLevelUpBackdrop, bindAvatarLevelUpSaveImage, bindAvatarLevelUpShare, closeAvatarLevelUpModal, openAvatarLevelUpModal
- 로드 중 문 14: window 노출 2 · var 초기값 실행 6 · IfStatement 2 · 호출 4
- window 노출(2줄): closeAvatarLevelUpModal, openAvatarLevelUpModal
- 이벤트 처리기: addEventListener 2 · on<이벤트> 대입 0
- 바깥 js 가 window 이름을 씀: js/tabs/settings/avatar-greeting.js, js/tabs/settings/avatar-levelup-modal.js
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js, tests/avatar-10slots-growth.test.js (index.html 단독 읽기: tests/avatar-10slots-growth.test.js)

### G109 RENDER: 팀 목표 (팀장·매니저만 추가/수정/삭제, 팀원은 보기만)

- 13062~13321줄(260줄) · 어려움(44)
- 함수(17): blockUser, canManageTeamGoals, ensureTeamCommentsLoaded, filterBlockedPosts, filterHidden, isUserBlocked, openBlockedUsersModal, reorderGoal, setupRealtimeChannelsOnce, setupTeamCommentsRealtime, setupUserSessionRealtime, shiftGoalOrder, sortGoalsByOrder, teamCommentItemHtml, teamComments, teamCommentsBlockHtml, unblockUser
- 변수(3): REALTIME_CHANNELS_SETUP, TEAM_COMMENTS_CACHE, USER_SESSION_CHANNEL
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: closeModal, escapeHtml, groupState, nowISO, renderGoalsScreen, saveProfile, sb, setupFeedPostsRealtime, state, triggerHaptic
- 이벤트 처리기: addEventListener 2 · on<이벤트> 대입 0
- 부르는 묶음(들어옴): G110×8, G076×3, G128×3, G004×2, G151×2, G001×1, G053×1
- 부르는 대상(나감): G018×4, G110×4, G044×2, G076×2, G128×2, G058×1, G087×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-shipyard-modular.js, scripts/verify-all-clicks.js, tests/account-switch-isolation.test.js, tests/core-confirm-es374.test.js, tests/core-confirm-es376.test.js, tests/direct-login-guard.test.js, tests/dm-push-auth-es397.test.js 외 7 (index.html 단독 읽기: tests/goals-schedule-sync.test.js, tests/team-fold-state-es409.test.js, tests/team-goal-guide-hint.test.js, tests/team-level-accordion-es406.test.js)
- smoke-test FN_NAMES: filterBlockedPosts, filterHidden, sortGoalsByOrder — 옮기려면 시험지 선행 PR 먼저

### G066 일정(캘린더) 탭

- 5933~6276줄(344줄) · 어려움(45)
- 함수(7): calCellHtml, calendarItemsByDate, isoDate, pushCalendarEvent, quickSyncToCalendar, toDateTimeLocalValue, toLocalInputValue
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: MOCK_GROUPS, ensureGcalOwner, escapeHtml, gcalEventsKey, getGoogleAccessToken, groupState, nextDayISO, openScheduleSetupModal, pad, renderCalendarScreen, saveProfile, state
- 부르는 묶음(들어옴): G068×4, G120×4, G003×3, G026×2, G122×2, G002×1, G004×1, G009×1, G069×1, G076×1
- 부르는 대상(나감): G018×11
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js, tests/achievement-graph-multiset.test.js, tests/avatar-10slots-growth.test.js, tests/feed-post-photo-upload.test.js, tests/gcal-login-reconnect-fix.test.js, tests/goals-schedule-sync.test.js, tests/hidden-entry-guard.test.js 외 6 (index.html 단독 읽기: tests/avatar-10slots-growth.test.js, tests/gcal-login-reconnect-fix.test.js, tests/goals-schedule-sync.test.js, tests/push-subscribe-auth-es400.test.js, tests/security-audit.test.js, tests/team-goal-guide-hint.test.js, tests/top-page-guide-reposition.test.js)

### G140 4대 연계 뷰 원자적 동시 전파 디스패처 (헌법 제1조 제4항 제5호 & 제15조 제6항 제3호)

- 20968~21012줄(45줄) · 어려움(45)
- 함수(1): dispatchFullViewPropagation
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: checkGuestBackupNudge, renderCalendarScreen, renderRecordsScreen, state
- 로드 중 문 1: IfStatement 1
- window 노출(1줄): dispatchFullViewPropagation
- 부르는 묶음(들어옴): G104×4, G070×2, G076×2, G087×2, G105×2, G121×2, G141×2, G010×1
- 부르는 대상(나감): G076×2
- 바깥 js 가 window 이름을 씀: js/core/confetti.js, js/core/event-bus.js, js/core/virtual-user-helpers.js, js/sanctuary-v3-engine.js, js/tabs/calendar/sub-day-detail.js, js/tabs/calendar/sub-month-view.js, js/tabs/calendar/sub-photo-diary.js, js/tabs/comm/sub-companions.js 외 16
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-shipyard-modular.js, scripts/verify-integrity-gate.js, tests/account-switch-isolation.test.js, tests/core-confirm-es376.test.js, tests/direct-login-guard.test.js, tests/new-module.test.js, tests/record-ledger-sync.test.js 외 2 (index.html 단독 읽기: tests/record-ledger-sync.test.js, tests/sync-server-records-render-home.test.js)

### G092 [#TASK-ES-146] 아워골 평가해주기 90% 팝업

- 10712~10742줄(31줄) · 어려움(46)
- 함수(0): 없음
- 변수(5): btnEvalBanner, btnEvalClose, btnSubmitEval, challengeBtn, modalEvalElem
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindAppEvalBackdrop, bindAppEvalSubmit, bindHomeAddGoal, closeAppEvaluationModal, openAppEvaluationModal, openMzShareCardModal, resetAppEvaluationForm, setTab
- 로드 중 문 15: window 노출 3 · var 초기값 실행 5 · IfStatement 3 · 호출 4
- window 노출(3줄): closeAppEvaluationModal, openAppEvaluationModal, resetAppEvaluationForm
- 이벤트 처리기: addEventListener 3 · on<이벤트> 대입 1
- 바깥 js 가 window 이름을 씀: js/components-home-actions.js, js/tabs/settings/app-evaluation.js
- 시험지 글자 의존: scripts/smoke-test.js, tests/app-evaluation-modal.test.js, tests/home-customizer-auto-sync.test.js (index.html 단독 읽기: tests/home-customizer-auto-sync.test.js)

### G106 [PHASE 6] #TASK-UIUX-PHASE6-COMM-SETTINGS FUNCTIONS

- 12960~13035줄(76줄) · 어려움(48)
- 함수(3): openInAppDmSheet, switchCommSubTab, triggerFloatingReaction
- 다른 묶음 상태 — 대입: state · 변경: state · 읽기: killDeviceSession, paintSecurityCard, refreshSecurityStatus, renderCommScreen, selectThemeSwatch, state, triggerHapticFeedback
- 로드 중 문 8: window 노출 8
- window 노출(9줄): _commReactionCounts, killDeviceSession, openInAppDmSheet, paintSecurityCard, refreshSecurityStatus, selectThemeSwatch, switchCommSubTab, triggerFloatingReaction
- 인라인 on*="…" 이 부르는 함수: openInAppDmSheet, switchCommSubTab, triggerFloatingReaction
- 부르는 대상(나감): G018×6
- 바깥 js 가 window 이름을 씀: js/tabs/settings/quick-actions.js, js/tabs/settings/sub-security.js
- 시험지 글자 의존: tests/account-switch-isolation.test.js, tests/dev-host-gate.test.js, tests/direct-login-guard.test.js, tests/google-session-guard.test.js (index.html 단독 읽기: tests/google-session-guard.test.js)

### G053 Enter app

- 4725~4855줄(131줄) · 어려움(49)
- 함수(1): enterApp
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: OfflineSyncManager, challengeTwoFactorModal, checkStreakFreeze, ensureFeedPostsLoaded, openAvatarGreetingPopup, renderFirstCheckinTutorialBanner, restoreGoogleToken, setTab, state, syncLockScreenLiveCard
- 로드 중 문 6: 호출 6
- 이벤트 처리기: addEventListener 5 · on<이벤트> 대입 0
- 부르는 묶음(들어옴): G145×2, G009×1, G014×1, G038×1, G047×1, G144×1
- 부르는 대상(나감): G063×6, G069×6, G044×5, G018×2, G122×2, G129×2, G060×1, G109×1, G137×1, G138×1 외 2
- 시험지 글자 의존: scripts/smoke-test.js, tests/achievement-stats-shell-button-removal.test.js, tests/comm-ai-identity-es348.test.js, tests/core-confirm-es374.test.js, tests/core-modal-es363.test.js, tests/core-toast-es361.test.js, tests/dev-host-gate.test.js, tests/direct-login-guard.test.js 외 10 (index.html 단독 읽기: tests/comm-ai-identity-es348.test.js, tests/core-modal-es363.test.js, tests/core-toast-es361.test.js, tests/google-session-guard.test.js, tests/theme-system-v4.test.js, tests/top-page-guide-reposition.test.js, tests/unique-display-name.test.js)

### G129 전역 공유 팀 로더 & 렌더링 (#TASK-ES-133)

- 20109~20700줄(592줄) · 어려움(52)
- 함수(5): collectiveGaugeHtml, loadSharedGroups, promptNewGroup, renderCommGroups, renderGroupDetail
- 변수(1): SHARED_GROUPS_LOADED
- 다른 묶음 상태 — 대입: 없음 · 변경: MOCK_GROUPS, state · 읽기: MOCK_GROUPS, TOPICS, XP_RULES, awardXP, burstConfetti, categoryPickerHtml, closeModal, copyGroupInviteLink, dDay, dateKey, escapeHtml, fmtDateLabel 외 15
- 로드 중 문 2: IfStatement 2
- window 노출(3줄): SHARED_GROUPS_LOADED, loadSharedGroups
- 이벤트 처리기: addEventListener 18 · on<이벤트> 대입 7
- 부르는 묶음(들어옴): G110×9, G053×2, G007×1
- 부르는 대상(나감): G018×9, G110×5, G069×2, G058×1, G063×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-all-clicks.js, scripts/verify-integrity-gate.js, tests/account-switch-isolation.test.js, tests/core-confirm-es376.test.js, tests/direct-login-guard.test.js, tests/dm-push-auth-es397.test.js, tests/goals-schedule-sync.test.js 외 6 (index.html 단독 읽기: tests/goals-schedule-sync.test.js, tests/record-ledger-sync.test.js, tests/team-goal-guide-hint.test.js, tests/xp-server-ledger-es421.test.js)

### G105 [PHASE 5] #TASK-UIUX-PHASE5-RECORDS-CALENDAR FUNCTIONS

- 12801~12959줄(159줄) · 어려움(55)
- 함수(4): exportRecordsCsv, handleQuickStopwatchSaveRecord, handleQuickStopwatchToggle, switchRecFusionMode
- 다른 묶음 상태 — 대입: state · 변경: state · 읽기: renderRecordsScreen, state, toggleRecordArchive, triggerHapticFeedback
- 로드 중 문 8: window 노출 8
- window 노출(14줄): _quickStopwatchElapsed, _quickStopwatchRunning, _quickStopwatchTimerId, exportRecordsCsv, handleQuickStopwatchSaveRecord, handleQuickStopwatchToggle, switchRecFusionMode, toggleRecordArchive
- 인라인 on*="…" 이 부르는 함수: exportRecordsCsv, handleQuickStopwatchSaveRecord, handleQuickStopwatchToggle, switchRecFusionMode
- 부르는 대상(나감): G018×18, G140×2
- 바깥 js 가 window 이름을 씀: js/tabs/records/archive-toggle.js
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-integrity-gate.js, tests/account-switch-isolation.test.js, tests/core-confirm-es376.test.js, tests/direct-login-guard.test.js, tests/goals-schedule-sync.test.js, tests/goals-smart-attachments.test.js, tests/record-ledger-sync.test.js 외 1 (index.html 단독 읽기: tests/goals-schedule-sync.test.js, tests/goals-smart-attachments.test.js, tests/record-ledger-sync.test.js, tests/xp-server-ledger-es421.test.js)

### G104 [UI/UX 틀 개편 Phase 4] 목표 탭 노션급 데이터 관리 & 인지순행 IA (#TASK-UIUX-PHASE4-GOALS)

- 12647~12800줄(154줄) · 어려움(67)
- 함수(7): closeGoalDetailDrawer, handleGoalFastAddSubmit, openGoalDetailDrawer, renderRoutineMatrixGrid, selectSmartTag, toggleMilestoneInDrawer, toggleRoutineStamp
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: adoptTemplateAsMyGoal, escapeHtml, renderGoalStatsChart, renderGoalsScreen, saveProfile, state, switchGoalStatPeriod, switchGoalsSubTab, triggerHapticFeedback
- 로드 중 문 13: window 노출 13
- window 노출(14줄): adoptTemplateAsMyGoal, closeGoalDetailDrawer, currentGoalStatPeriod, handleGoalFastAddSubmit, openGoalDetailDrawer, renderGoalStatsChart, renderRoutineMatrixGrid, selectSmartTag, selectedGoalSmartTag, switchGoalStatPeriod, switchGoalsSubTab, toggleMilestoneInDrawer, toggleRoutineStamp
- 인라인 on*="…" 이 부르는 함수: closeGoalDetailDrawer, handleGoalFastAddSubmit, openGoalDetailDrawer, selectSmartTag, toggleMilestoneInDrawer, toggleRoutineStamp
- 부르는 묶음(들어옴): G004×1
- 부르는 대상(나감): G018×6, G140×4
- 바깥 js 가 window 이름을 씀: js/sanctuary-goal-trail.js, js/sanctuary-v3-engine.js, js/tabs/goals/goals-ia-actions.js, js/tabs/goals/render.js
- 시험지 글자 의존: scripts/smoke-test.js, tests/team-goal-comment-fix.test.js

### G122 위클리 리캡 카드 (스포티파이 랩드 스타일, 공유 캔버스 인프라 재사용)

- 18325~18936줄(612줄) · 어려움(69)
- 함수(7): findBestMoment, fitBigFont, generateWeeklyRecapImage, openLegacyRecapCanvasModal, openRecordModal, openWeeklyRecapModal, weeklyRecapStats
- 변수(2): btnOpenTt, staticPulseBar
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: RECORD_THEMES, TOPICS, buildInviteLinkSuffix, closeModal, dateKey, drawShareWatermark, escapeHtml, fmtDuration, newId, nowISO, openCreateCustomTemplateModal, renderRecordsScreen 외 8
- 로드 중 문 10: 호출 6 · var 초기값 실행 2 · IfStatement 2
- 이벤트 처리기: addEventListener 11 · on<이벤트> 대입 9
- 인라인 on*="…" 이 부르는 함수: openWeeklyRecapModal
- 부르는 묶음(들어옴): G121×5, G115×4, G053×2, G153×2, G009×1, G011×1, G012×1, G120×1
- 부르는 대상(나감): G018×11, G120×10, G058×6, G069×4, G087×3, G066×2, G063×1, G086×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-all-clicks.js, tests/account-switch-isolation.test.js, tests/achievement-graph-multiset.test.js, tests/ai-conditional-call-optimization.test.js, tests/avatar-10slots-growth.test.js, tests/direct-login-guard.test.js, tests/dm-push-auth-es397.test.js 외 6 (index.html 단독 읽기: tests/avatar-10slots-growth.test.js, tests/goals-only-view.test.js, tests/goals-schedule-sync.test.js, tests/record-ledger-sync.test.js)
- smoke-test FN_NAMES: weeklyRecapStats — 옮기려면 시험지 선행 PR 먼저

### G120 템플릿 복제 보상형 광고(Rewarded Ad) 파이프라인 (TASK-ES-013)

- 16910~18288줄(1379줄) · 어려움(71)
- 함수(12): checkRecordDeepLink, computeAdCountdownProgress, executeDirectTemplateClone, getTemplateAdNoticeMessage, handleTemplateCloneWithAd, isTemplateRewardedAdEnabled, openProTemplateRecordModal, openTemplateMarketModal, openTemplateRecordDetailModal, playRewardedAdVideo, showWebRewardedAdModal, startTemplateAdCountdown
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: CURATED_MARKET_TEMPLATES, OURGOAL_CONFIG, XP_RULES, awardXP, burstConfetti, closeModal, escapeHtml, fmtTime, fmtYYMMDD, getAllProTemplates, getProTemplateByKey, isGoogleCalendarConnected 외 24
- 로드 중 문 2: IfStatement 1 · 호출 1
- window 노출(1줄): testTemplateAdFlow
- 이벤트 처리기: addEventListener 3 · on<이벤트> 대입 49
- 부르는 묶음(들어옴): G122×10, G002×2, G003×1, G152×1
- 부르는 대상(나감): G018×20, G119×6, G066×4, G117×4, G118×4, G058×3, G087×3, G023×1, G063×1, G086×1 외 2
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-shipyard-modular.js, scripts/verify-integrity-gate.js, tests/account-withdrawal-modal.test.js, tests/achievement-graph-multiset.test.js, tests/dm-push-auth-es397.test.js, tests/goal-template-legacy-cleanup.test.js, tests/goal-templates-data-split.test.js 외 6 (index.html 단독 읽기: tests/account-withdrawal-modal.test.js, tests/goal-templates-data-split.test.js, tests/record-ledger-sync.test.js)
- smoke-test FN_NAMES: computeAdCountdownProgress, getTemplateAdNoticeMessage, isTemplateRewardedAdEnabled — 옮기려면 시험지 선행 PR 먼저

### G125 캘린더 실시간 구독 URL 생성기 (WebCal Feed & #TASK-ES-252 HMAC 서명)

- 18971~19421줄(451줄) · 어려움(73)
- 함수(7): buildICS, buildMarkdownExport, buildWebCalUrl, exportAllCheckins, fetchSignedCalendarToken, openExportThemeModal, shareContent
- 변수(2): MOCK_GROUPS, _cachedSignedCalendarToken
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: CREATOR_TEMPLATES, RECORD_THEMES, TOPICS, closeModal, dateKey, daysFromNow, download, fmtTime, nowISO, state, triggerHaptic
- 로드 중 문 3: 호출 1 · window 노출 2
- window 노출(2줄): CREATOR_TEMPLATES, shareContent
- 이벤트 처리기: addEventListener 5 · on<이벤트> 대입 0
- 부르는 묶음(들어옴): G069×7, G001×1, G009×1, G120×1, G128×1
- 부르는 대상(나감): G018×10, G123×5, G015×1, G058×1
- 바깥 js 가 window 이름을 씀: js/tabs/comm/manito-real.js, js/tabs/comm/sample-data.js, js/tabs/comm/share-card.js, js/tabs/goals/template-encyclopedia.js, js/team-share.js, js/team-templates.js, js/viral-sharing.js
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-calendar-attachments.js, scripts/test-shipyard-modular.js, scripts/verify-all-clicks.js, scripts/verify-integrity-gate.js, tests/account-switch-isolation.test.js, tests/achievement-graph-multiset.test.js, tests/dev-host-gate.test.js 외 14 (index.html 단독 읽기: scripts/test-calendar-attachments.js, tests/goals-schedule-sync.test.js, tests/push-subscribe-auth-es400.test.js, tests/routine-tab-scheduler.test.js, tests/security-audit.test.js, tests/team-fold-state-es409.test.js, tests/team-level-accordion-es406.test.js, tests/team-level-management.test.js 외 1)
- smoke-test FN_NAMES: buildICS, buildMarkdownExport, buildWebCalUrl — 옮기려면 시험지 선행 PR 먼저

### G076 RENDER: HOME

- 7950~8165줄(216줄) · 어려움(74)
- 함수(1): renderHome
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: BADGES, badgeContext, burstConfetti, dDay, dateKey, escapeHtml, goalProgress, initFeedbackTierBar, initHomeCockpit, msCounts, openFocusAutoPilotModal, quickCreateStarterGoal 외 10
- 이벤트 처리기: addEventListener 8 · on<이벤트> 대입 2
- 부르는 묶음(들어옴): G068×8, G023×2, G063×2, G109×2, G140×2, G001×1, G035×1, G142×1
- 부르는 대상(나감): G069×4, G077×4, G109×3, G140×2, G018×1, G023×1, G066×1, G087×1, G098×1, G142×1
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-all-clicks.js, scripts/verify-integrity-gate.js, tests/achievement-collapse-toggle.test.js, tests/achievement-metric-multiselect.test.js, tests/achievement-stats-shell-button-removal.test.js, tests/app-evaluation-notice.test.js, tests/avatar-exp-celebration.test.js 외 43 (index.html 단독 읽기: tests/app-evaluation-notice.test.js, tests/avatar-welcome-modal.test.js, tests/calendar-photo-diary-dismiss-guide.test.js, tests/comm-feed-cleanup.test.js, tests/comm-post-feed-button-fix.test.js, tests/component-modularization.test.js, tests/dm-keyboard-autofocus-fix.test.js, tests/goals-only-view.test.js 외 6)

### G063 프로필

- 5312~5885줄(574줄) · 어려움(76)
- 함수(8): avatarHtml, openNotificationCenterModal, openProfileEditor, renderProfileCard, resizeImageToDataUrl, startScheduleReminderPoller, updateTopBar, updateTopNotifBadge
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: MOCK_GROUPS, TOPICS, closeModal, escapeHtml, fmtTime, levelProgress, openHallOfFame, regionPickerHtml, renderCommScreen, saveProfile, setTab, state 외 3
- 로드 중 문 5: IfStatement 5
- window 노출(6줄): _schedReminderPoller, openNotificationCenterModal, openProfileEditor, startScheduleReminderPoller, updateTopBar, updateTopNotifBadge
- 이벤트 처리기: addEventListener 13 · on<이벤트> 대입 9
- 인라인 on*="…" 이 부르는 함수: openNotificationCenterModal
- 부르는 묶음(들어옴): G053×6, G001×3, G023×2, G011×1, G095×1, G120×1, G122×1, G129×1, G142×1
- 부르는 대상(나감): G018×12, G058×4, G023×2, G076×2, G060×1, G069×1, G142×1
- 바깥 js 가 window 이름을 씀: js/avatar/xp.js, js/notify-engine.js, js/tabs/settings/sub-integrations.js, js/tabs/settings/tab-guide.js, js/team-dm-inbox.js
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-calendar-attachments.js, scripts/verify-all-clicks.js, scripts/verify-integrity-gate.js, tests/account-switch-isolation.test.js, tests/avatar-icon-enlarge-all.test.js, tests/core-toast-es361.test.js, tests/dm-push-auth-es397.test.js 외 12 (index.html 단독 읽기: scripts/test-calendar-attachments.js, tests/core-toast-es361.test.js, tests/enlarge-avatar-icons.test.js, tests/gcal-login-reconnect-fix.test.js, tests/goals-schedule-sync.test.js, tests/goals-smart-attachments.test.js, tests/google-session-guard.test.js, tests/push-subscribe-auth-es400.test.js 외 1)

### G091 [#TASK-ES-174] 목표 템플릿 백과사전 전체화면 팝업 및 상호작용

- 10144~10711줄(568줄) · 어려움(82)
- 함수(12): cheerRealUserTemplate, closeTemplateEncyclopediaModal, copyRealUserTemplate, getLikedTemplateMap, getUserSharedTemplates, openTemplateEncyclopediaModal, renderAiTemplatesList, renderRealUserTemplatesList, saveUserSharedTemplates, setLikedTemplateMap, shareMyActiveGoalAsTemplate, switchTemplateEncyclopediaTab
- 변수(8): REAL_USER_TEMPLATES, _tplActiveTab, _tplAiCurCat, btnCloseTplEncycl, btnHeaderTplEncycl, modalTplEncyclElem, tabBtnAi, tabBtnReal
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: escapeHtml, newId, nowISO, renderGoalsScreen, saveProfile, setTab, state, trackGoalCreated, uid
- 로드 중 문 20: window 노출 9 · var 초기값 실행 5 · IfStatement 5 · 호출 1
- window 노출(9줄): REAL_USER_TEMPLATES, cheerRealUserTemplate, closeGoalTemplateEncyclopediaModal, closeTemplateEncyclopediaModal, copyRealUserTemplate, copyUserGoalTemplate, openGoalTemplateEncyclopediaModal, openTemplateEncyclopediaModal, shareMyActiveGoalAsTemplate
- 이벤트 처리기: addEventListener 9 · on<이벤트> 대입 3
- 인라인 on*="…" 이 부르는 함수: closeTemplateEncyclopediaModal, openTemplateEncyclopediaModal
- 부르는 묶음(들어옴): G012×1, G013×1
- 부르는 대상(나감): G018×8, G126×2
- 바깥 js 가 window 이름을 씀: js/components-goal-actions.js, js/components.js, js/tabs/goals/team-goal-prompt.js, js/tabs/goals/template-quick-import.js
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-shipyard-modular.js, scripts/verify-all-clicks.js, scripts/verify-integrity-gate.js, tests/feed-post-category-diversity.test.js, tests/goal-template-legacy-cleanup.test.js, tests/goal-templates-data-split.test.js, tests/goal-templates-encyclopedia.test.js 외 6 (index.html 단독 읽기: tests/goal-templates-data-split.test.js, tests/goals-schedule-sync.test.js, tests/routine-tab-scheduler.test.js, tests/team-level-management.test.js)

### G023 XP/레벨 시스템

- 3229~3334줄(106줄) · 어려움(82)
- 함수(3): hasUserCustomizedAvatar, levelBadgeHtml, renderLevelBadge
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: MOCK_GROUPS, closeModal, dateKey, levelForXP, levelProgress, notifyXpGained, nowISO, saveProfile, state, triggerAvatarCelebrationPopup, xpForLevel
- 로드 중 문 6: window 노출 5 · IfStatement 1
- window 노출(6줄): levelForXP, levelProgress, notifyXpGained, renderLevelBadge, triggerAvatarCelebrationPopup, xpForLevel
- 이벤트 처리기: addEventListener 0 · on<이벤트> 대입 2
- 부르는 묶음(들어옴): G063×2, G004×1, G076×1, G077×1, G086×1, G120×1
- 부르는 대상(나감): G063×2, G076×2, G018×1, G058×1
- 바깥 js 가 window 이름을 씀: js/avatar/xp.js, js/core/badges.js, js/sanctuary-weekly-recap.js, js/tabs/goals/goal-detail-events.js, js/tabs/goals/result-input.js, js/tabs/goals/result-modal.js, js/tabs/home/sub-onescreen.js, js/tabs/home/sub-quest.js 외 6
- 시험지 글자 의존: scripts/smoke-test.js, tests/avatar-10slots-growth.test.js, tests/avatar-icon-enlarge-all.test.js, tests/avatar-personas-split.test.js, tests/enlarge-avatar-icons.test.js, tests/feed-post-photo-upload.test.js, tests/gcal-login-reconnect-fix.test.js, tests/goal-template-legacy-cleanup.test.js 외 7 (index.html 단독 읽기: tests/avatar-10slots-growth.test.js, tests/avatar-personas-split.test.js, tests/enlarge-avatar-icons.test.js, tests/gcal-login-reconnect-fix.test.js, tests/goals-schedule-sync.test.js, tests/hide-home-debug-cards.test.js, tests/home-customizer-auto-sync.test.js, tests/remove-duplicate-home-layout-button.test.js 외 3)

### G087 맞춤 피드백 봇 설정

- 8981~10065줄(1085줄) · 어려움(90)
- 함수(18): closeCheckinFeedbackSheet, closeFeedbackSetup, customFeedbackStatusSuffix, fbBotBubbleHtml, generateCustomFeedbackPrompt, getSavedFeedbackPresets, getUserAvatarHtml, instantShareCheckinToFeed, openFeedbackSetup, openFeedbackSetupGated, persistFeedbackPresets, refreshCustomFeedbackButtons, renderFeedbackSetup, renderFeedbackSlot, renderRecordFeedbackSlot, showCheckinFeedbackSheet, timeAgoStr, verdictClass
- 다른 묶음 상태 — 대입: FEED_POSTS_CACHE · 변경: FEED_POSTS_CACHE, state · 읽기: FEED_POSTS_CACHE, addSimulatedCheerAndReplyToPost, awardXP, burstConfetti, dateKey, escapeHtml, goalProgress, isModalDismissCooldown, levelProgress, newId, nowISO, openShareToFeedModal 외 12
- 로드 중 문 7: window 노출 3 · 호출 3 · IfStatement 1
- window 노출(5줄): closeCheckinFeedbackSheet, closeFeedbackSetup, instantShareCheckinToFeed, openFeedbackSetup, showCheckinFeedbackSheet
- 이벤트 처리기: addEventListener 36 · on<이벤트> 대입 2
- 인라인 on*="…" 이 부르는 함수: openFeedbackSetup
- 부르는 묶음(들어옴): G128×4, G120×3, G122×3, G002×2, G001×1, G009×1, G010×1, G011×1, G076×1, G109×1 외 2
- 부르는 대상(나감): G018×25, G140×2
- 바깥 js 가 window 이름을 씀: js/tabs/records/checkin-capture.js
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-shipyard-modular.js, scripts/verify-all-clicks.js, scripts/verify-integrity-gate.js, tests/avatar-icon-enlarge-all.test.js, tests/avatar-personas-split.test.js, tests/core-confirm-es374.test.js, tests/core-confirm-es376.test.js 외 12 (index.html 단독 읽기: tests/avatar-personas-split.test.js, tests/enlarge-avatar-icons.test.js, tests/goals-schedule-sync.test.js, tests/hide-home-debug-cards.test.js, tests/home-customizer-auto-sync.test.js, tests/push-subscribe-auth-es400.test.js, tests/security-audit.test.js, tests/team-goal-guide-hint.test.js)

### G110 개인 목표 200% 활용 가이드 & 템플릿 백과사전 (#TASK-ES-135)

- 13322~15277줄(1956줄) · 어려움(112)
- 함수(11): collapseAllTeamGoalAccordions, getGroupLevelGoals, getTeamGoalTemplatePreset, isMockGroup, openLevelGroupDetailModal, openTeamGoalEditModal, renderPersonalGoalsEmptyGuideHtml, renderTeamCreateHeroCardHtml, renderTeamGoalsEmptyGuideHtml, renderTeamGoalsScreen, wireTeamGoalsGuideEvents
- 다른 묶음 상태 — 대입: 없음 · 변경: TEAM_COMMENTS_CACHE, state · 읽기: MOCK_GROUPS, TEAM_COMMENTS_CACHE, burstConfetti, closeModal, dDay, daysFromNow, escapeHtml, groupState, newId, nowISO, openTeamInviteModal, openTeamLinkedPersonalGoalModal 외 10
- 로드 중 문 4: IfStatement 3 · window 노출 1
- window 노출(5줄): FEED_POSTS_CACHE, collapseAllTeamGoalAccordions, isMockGroup, renderTeamGoalsEmptyGuideHtml, renderTeamGoalsScreen
- 이벤트 처리기: addEventListener 64 · on<이벤트> 대입 6
- 부르는 묶음(들어옴): G129×5, G109×4, G151×3, G004×2, G111×2, G090×1
- 부르는 대상(나감): G018×19, G129×9, G058×8, G109×8
- 바깥 js 가 window 이름을 씀: js/components-team-actions.js, js/components.js, js/goal-edit-ux.js, js/tabs/comm/crew-pacing.js, js/tabs/comm/feed-comments.js, js/tabs/comm/feed-posts-sync.js, js/tabs/comm/goal-certificate-share.js, js/tabs/goals/focus-autopilot.js 외 11
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-shipyard-modular.js, scripts/verify-all-clicks.js, scripts/verify-integrity-gate.js, tests/account-switch-isolation.test.js, tests/achievement-graph-multiset.test.js, tests/avatar-personas-split.test.js, tests/core-confirm-es374.test.js 외 25 (index.html 단독 읽기: tests/avatar-personas-split.test.js, tests/goal-ai-advice-status.test.js, tests/goals-only-view.test.js, tests/goals-schedule-sync.test.js, tests/goals-smart-attachments.test.js, tests/google-session-guard.test.js, tests/hide-home-debug-cards.test.js, tests/record-ledger-sync.test.js 외 8)

### G069 [#TASK-ES-181 & #TASK-ES-182] 폰 잠금화면에서 바로 보기 통합 허브 모달

- 6783~7611줄(829줄) · 어려움(121)
- 함수(7): computeStreakDays, maybeApplyStreakFreeze, maybeGrantAvatarCraftBonus, maybeGrantStreakFreeze, openLockScreenHubModal, streakBadgeHtml, updateAppBadge
- 변수(1): STREAK_FREEZE_MAX
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: buildLockScreenCardPayload, calShift, closeLockScreenLiveCard, closeModal, dateKey, escapeHtml, generateLockScreenCalendarImage, generateLockScreenScheduleCardImage, openCalendarDayBgPickerModal, openCalendarDayEditHubModal, pad, renderCalendarScreen 외 8
- 로드 중 문 1: IfStatement 1
- window 노출(13줄): buildLockScreenCardPayload, calShift, calendarItemsByDate, closeLockScreenLiveCard, generateLockScreenCalendarImage, openCalendarDayBgPickerModal, openCalendarDayEditHubModal, openCalendarManualEditModal, openLockScreenHubModal, renderCalendarScreen, setRecordsSegment, syncLockScreenLiveCard, toggleScheduleDone
- 이벤트 처리기: addEventListener 0 · on<이벤트> 대입 14
- 부르는 묶음(들어옴): G053×6, G009×4, G070×4, G076×4, G122×4, G013×3, G129×2, G001×1, G003×1, G044×1 외 3
- 부르는 대상(나감): G018×18, G125×7, G058×2, G138×2, G066×1, G068×1
- 바깥 js 가 window 이름을 씀: js/avatar/feature-cards.js, js/calendar-attachment.js, js/components-auth-actions.js, js/components-avatar-actions.js, js/components-feed-actions.js, js/components-goal-actions.js, js/components-home-actions.js, js/components-record-actions.js 외 33
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-shipyard-modular.js, scripts/verify-all-clicks.js, scripts/verify-integrity-gate.js, tests/account-switch-isolation.test.js, tests/achievement-graph-multiset.test.js, tests/avatar-10slots-growth.test.js, tests/desktop-widget-suite.test.js 외 13 (index.html 단독 읽기: tests/avatar-10slots-growth.test.js, tests/goals-schedule-sync.test.js, tests/push-subscribe-auth-es400.test.js, tests/security-audit.test.js)
- smoke-test FN_NAMES: computeStreakDays, maybeApplyStreakFreeze, maybeGrantStreakFreeze, updateAppBadge — 옮기려면 시험지 선행 PR 먼저

### G058 Modal helper & Android Hardware Back Handler

- 5162~5228줄(67줄) · 어려움(160)
- 함수(1): openModal
- 변수(2): _modalDismissGraceUntil, _modalHistoryPushed
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: bindModalPopstateBack, closeModal, openBottomSheetAlert, openBottomSheetConfirm
- 로드 중 문 2: IfStatement 1 · 호출 1
- window 노출(5줄): _modalOpenAt, closeModal, openBottomSheetAlert, openBottomSheetConfirm, openModal
- 이벤트 처리기: addEventListener 0 · on<이벤트> 대입 2
- 부르는 묶음(들어옴): G110×8, G056×7, G122×6, G063×4, G090×4, G119×4, G120×3, G040×2, G069×2, G095×2 외 19
- 바깥 js 가 window 이름을 씀: js/auth-safety.js, js/avatar/dynamic-album.js, js/avatar/modal/bind-save.js, js/avatar/modal/index.js, js/components-home-actions.js, js/components.js, js/core/badges.js, js/core/confirm.js 외 104
- 시험지 글자 의존: scripts/smoke-test.js, tests/core-confirm-es374.test.js, tests/core-modal-es363.test.js, tests/dm-push-auth-es397.test.js, tests/google-session-guard.test.js (index.html 단독 읽기: tests/core-modal-es363.test.js, tests/google-session-guard.test.js)

### G097 목표 보관(기록으로 옮기기)

- 11339~11512줄(174줄) · 어려움(225)
- 함수(3): goalAchievement, renderArchivedGoals, restoreGoal
- 다른 묶음 상태 — 대입: 없음 · 변경: state · 읽기: dateKey, escapeHtml, resultPct, saveProfile, setTab, state, topicLabel
- 로드 중 문 2: window 노출 2
- window 노출(4줄): setArchivedPage, setArchivedPeriod, state
- 이벤트 처리기: addEventListener 1 · on<이벤트> 대입 0
- 인라인 on*="…" 이 부르는 함수: restoreGoal
- 부르는 묶음(들어옴): G002×1, G004×1, G151×1
- 부르는 대상(나감): G018×1, G142×1
- 바깥 js 가 window 이름을 씀: js/auth-safety.js, js/avatar/dynamic-album.js, js/avatar/feature-cards.js, js/avatar/modal/bind-craft.js, js/avatar/modal/bind-deck.js, js/avatar/modal/bind-save.js, js/avatar/modal/index.js, js/avatar/xp.js 외 188
- 시험지 글자 의존: scripts/smoke-test.js, scripts/verify-all-clicks.js, tests/goals-schedule-sync.test.js, tests/guest-null-client-es377.test.js, tests/hidden-entry-guard.test.js (index.html 단독 읽기: tests/goals-schedule-sync.test.js)
- smoke-test FN_NAMES: goalAchievement — 옮기려면 시험지 선행 PR 먼저

### G018 Confetti

- 3165~3187줄(23줄) · 어려움(233)
- 함수(1): toast
- 변수(1): toastTimer
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: showUndoPrivacyToast
- 로드 중 문 2: IfStatement 2
- window 노출(3줄): showToast, showUndoPrivacyToast, toast
- 이벤트 처리기: addEventListener 0 · on<이벤트> 대입 1
- 인라인 on*="…" 이 부르는 함수: toast
- 부르는 묶음(들어옴): G087×25, G120×20, G110×19, G069×18, G105×18, G119×14, G095×13, G063×12, G066×11, G122×11 외 41
- 바깥 js 가 window 이름을 씀: js/auth-safety.js, js/avatar/dynamic-album.js, js/avatar/feature-cards.js, js/avatar/modal/bind-craft.js, js/avatar/modal/bind-deck.js, js/avatar/modal/bind-persona.js, js/avatar/modal/bind-save.js, js/avatar/modal/index.js 외 161
- 시험지 글자 의존: scripts/smoke-test.js, tests/avatar-personas-split.test.js (index.html 단독 읽기: tests/avatar-personas-split.test.js)

### G026 뱃지 컬렉션 (명예의 전당)

- 3365~3676줄(312줄) · 어려움(261)
- 함수(6): defaultProfile, ensureUserRow, formatDisplayNameWithTag, loadProfile, resolveUniqueDisplayName, totalCompletedMilestones
- 변수(1): state
- 다른 묶음 상태 — 대입: 없음 · 변경: 없음 · 읽기: defaultSettings, escapeHtml, getAttribution, loadLocalSettings, nowISO, saveLocalSettings, sb, track
- 로드 중 문 4: window 노출 1 · IfStatement 3
- window 노출(4줄): defaultProfile, formatDisplayNameWithTag, resolveUniqueDisplayName, state
- 부르는 묶음(들어옴): G047×3, G009×2, G044×2, G145×2, G002×1, G034×1, G038×1
- 부르는 대상(나감): G066×2, G070×2, G015×1
- 바깥 js 가 window 이름을 씀: js/auth-safety.js, js/avatar/dynamic-album.js, js/avatar/feature-cards.js, js/avatar/modal/bind-craft.js, js/avatar/modal/bind-deck.js, js/avatar/modal/bind-save.js, js/avatar/modal/index.js, js/avatar/xp.js 외 188
- 시험지 글자 의존: scripts/smoke-test.js, scripts/test-shipyard-modular.js, scripts/verify-integrity-gate.js, tests/account-switch-isolation.test.js, tests/account-withdrawal-modal.test.js, tests/avatar-10slots-growth.test.js, tests/avatar-personas-split.test.js, tests/dev-host-gate.test.js 외 15 (index.html 단독 읽기: tests/account-withdrawal-modal.test.js, tests/avatar-10slots-growth.test.js, tests/avatar-personas-split.test.js, tests/gcal-login-reconnect-fix.test.js, tests/goal-templates-data-split.test.js, tests/push-subscribe-auth-es400.test.js, tests/record-ledger-sync.test.js, tests/routine-tab-scheduler.test.js 외 3)
- smoke-test FN_NAMES: totalCompletedMilestones — 옮기려면 시험지 선행 PR 먼저

## 6. 이음매·빈 구획

- G000 2331~2333(3줄) (IIFE 머리 — "use strict" 와 첫 구획 앞) — 빈 구획
- G001 2334~2412(79줄) [#TASK-ES-354 CORE-07] 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL.md) — 이음매(옮기지 않음) · 로드 중 문 1
- G002 2413~2454(42줄) [#TASK-ES-358] 기록 탭 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL.md) — 이음매(옮기지 않음) · 로드 중 문 1
- G003 2455~2483(29줄) [#TASK-ES-360] 일정 탭 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL.md, 기록 탭 #TASK-ES-358 과 같은 틀) — 이음매(옮기지 않음) · 로드 중 문 1
- G004 2484~2526(43줄) [#TASK-ES-370] 목표 탭 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL.md, 일정 탭 #TASK-ES-360 과 같은 틀) — 이음매(옮기지 않음) · 로드 중 문 1
- G006 2535~2550(16줄) [#TASK-ES-375] 목표 탭 모듈 이음매 2차 (docs/specs/MODULE-SPLIT-PROTOCOL.md, 1차 #TASK-ES-370 과 같은 틀 — 이음매(옮기지 않음) · 로드 중 문 1
- G007 2551~2572(22줄) [#TASK-ES-379] 소통 탭 모듈 이음매 1차 (docs/specs/MODULE-SPLIT-PROTOCOL.md, 목표 탭 #TASK-ES-370·#TAS — 이음매(옮기지 않음) · 로드 중 문 1
- G009 2606~2890(285줄) [#TASK-ES-423] 인라인 스크립트 세포화 1차 이음매 (docs/architecture/INLINE-SCRIPT-MAP.md 지도 · docs/specs — 이음매(옮기지 않음) · 로드 중 문 9
- G017 3157~3164(8줄) [#TASK-ES-264] 표준 시간대(한국 KST 00:00, 타 국가는 해당 국가 표준시 00:00) 기준 날짜 키 — 빈 구획 · 로드 중 문 1
- G020 3204~3207(4줄) 가상유저 개선 10대 핵심 헬퍼 함수 — 빈 구획 · 로드 중 문 1
- G021 3208~3220(13줄) [#TASK-ES-345 CAL-02] 구글 캘린더 토큰·일정 캐시 계정 격리 — 빈 구획 · 로드 중 문 1
- G027 3677~3680(4줄) [70] 다른 모든 기기 원격 로그아웃 전 로그인 기기 목록 확인 모달 — 빈 구획 · 로드 중 문 1
- G030 3710~3714(5줄) [80] 템플릿백과사전 1초 자동이식 선택 연동 및 로드맵-목표상태 동기화 — 빈 구획 · 로드 중 문 1
- G031 3715~3718(4줄) [82] 팀 목표 내 '팀 연계 개인목표' 생성 모달 — 빈 구획 · 로드 중 문 1
- G032 3719~3723(5줄) [83] 팀원 초대 시 '아워골 동반자 초대하기' 인앱 초대·참가 기능 — 빈 구획 · 로드 중 문 1
- G033 3724~3727(4줄) [88] 오늘의 3초 체크인 목표 버튼 선택 시 플레이스홀더(백그라운드 가이드) 예시 문구 렌더링 — 빈 구획 · 로드 중 문 1
- G034 3728~3738(11줄) [#TASK-UIUX-PHASE3-HOME-COCKPIT] 홈 1초 조망 ↔ 무저항 체크인 콕핏 8대 과업 — 빈 구획 · 로드 중 문 5
- G036 3852~3852(1줄) Landing — 빈 구획
- G039 3904~3912(9줄) [#TASK-ES-223] [생각 메모장 93번] 개발 디버그 버튼 프로덕션 완전 소거 및 로컬/디버그 격리 — 빈 구획 · 로드 중 문 2
- G041 4219~4223(5줄) [#TASK-ES-224] [생각 메모장 94번] 게스트(둘러보기) 3회 기록 시 안전 백업 넛지 및 카카오 무손실 계정 통합 — 빈 구획 · 로드 중 문 2
- G042 4224~4227(4줄) [#TASK-ES-224] [생각 메모장 94번] 카카오/소셜/일반 로그인 시 게스트 데이터 100% 무손실 비파괴 합집합(Union Merge) 이관 — 빈 구획 · 로드 중 문 1
- G052 4715~4724(10줄) 이용약관 / 개인정보처리방침 열람 리스너 — 빈 구획 · 로드 중 문 2
- G054 4856~4859(4줄) Onboarding (first-time, after signup) — 16종 동물 아바타 & 직관적 안착 융합 — 빈 구획 · 로드 중 문 1
- G055 4860~4869(10줄) 3단계: 첫 체크인 튜토리얼 가이드 및 축하 연출 — 빈 구획 · 로드 중 문 3
- G057 5154~5161(8줄) 조선소 블록 레지스트리 6대 메가블록 초기화 (헌법 제3조 제9항) — 빈 구획 · 로드 중 문 3
- G059 5229~5234(6줄) 이용약관 & 개인정보처리방침 모달 — 빈 구획 · 로드 중 문 1
- G064 5886~5886(1줄) 구글 캘린더 연동 — 빈 구획
- G067 6277~6286(10줄) [#TASK-ES-153 & #TASK-ES-155] 캘린더 일자별 배경 사진 지정 모달 — 빈 구획 · 로드 중 문 2
- G071 7868~7873(6줄) Adaptive UX Mode — 빈 구획 · 로드 중 문 1
- G072 7874~7880(7줄) Social Crew Pacing (#TASK-ES-228) — 빈 구획 · 로드 중 문 4
- G074 7904~7907(4줄) iOS 사파리 홈 화면 추가 안내 배너 & 실시간 알림 가이드 (#TASK-ES-234) — 빈 구획 · 로드 중 문 1
- G081 8570~8640(71줄) 음성 체크인 (Web Speech API) — 빈 구획 · 로드 중 문 1
- G088 10066~10069(4줄) 목표 & 기록 선택 피드 공유 모달 (전면 고도화) — 빈 구획 · 로드 중 문 1
- G089 10070~10075(6줄) [#TASK-ES-301] 피드 게시 모달 내 '미리보기' 토글 직통 헬퍼 — 빈 구획 · 로드 중 문 1
- G093 10743~10752(10줄) New goal modal — 빈 구획 · 로드 중 문 2
- G094 10753~10753(1줄) 참고자료 (유튜브/영상, 이미지, 텍스트 메모, 웹링크) — 빈 구획
- G099 11594~11605(12줄) 목표 탭 3계층 일정설정 / 디데이·기간 표시 및 캘린더 연동 (#TASK-ES-259, 메모장 03항, #TASK-ES-135) — 빈 구획 · 로드 중 문 1
- G107 13036~13058(23줄) [UI/UX 프레임워크 개편 Phase 7] 모바일 하드웨어 인터랙션 & 사용성 하드닝 — 빈 구획 · 로드 중 문 5
- G108 13059~13061(3줄) RENDER: GOALS — 빈 구획
- G111 15278~15369(92줄) [#TASK-ES-299] 팀 목표 댓글 작성 및 전송 직통 헬퍼 & 전역 이벤트 위임 (먹통 방어 100%) — 빈 구획 · 로드 중 문 3
- G114 15461~15462(2줄) 5대 테마 원형 라이프 밸런스 휠 (SVG Pie Chart) — 빈 구획
- G121 18289~18324(36줄) [#TASK-ES-358] 기록 탭 렌더 → js/tabs/records/period-ai-card.js · render.js 로 옮김 — 빈 구획 · 로드 중 문 2
- G124 18970~18970(1줄) RFC 5545 표준 iCalendar (.ics) 생성 순수 함수 (TASK-BG-11) — 빈 구획
- G134 20768~20777(10줄) [#TASK-ES-354 CORE-07·SET-07] 설정 탭 렌더 → js/tabs/settings/render.js · sub-*.js 로 옮김 — 이음매(옮기지 않음) · 로드 중 문 5
- G144 21065~21077(13줄) #TASK-AUTH-P0-SAFETY: 로그인/계정 보안 패키지 모듈 연결 — 빈 구획 · 로드 중 문 1
- G145 21078~21305(228줄) Boot — 빈 구획 · 로드 중 문 1
- G146 21306~21308(3줄) #TASK-ES-015 FIX: 공용 크레딧 모듈(js/credits.js)에 앱 sb 주입 — 빈 구획 · 로드 중 문 1
- G147 21309~21322(14줄) KF-7 #TASK-ES-014: 반응 4종 모듈(js/reactions.js)에 앱 핸들 연결 — 빈 구획 · 로드 중 문 1
- G148 21323~21327(5줄) KF-4 #TASK-ES-018: 카테고리별 도움이 된 글 슬롯 모듈(js/top-helpful.js) — 빈 구획 · 로드 중 문 1
- G149 21328~21336(9줄) KF-5 #TASK-ES-016: 도움돼요 이유 모듈(js/helpful-reason.js)에 앱 핸들 연결 — 빈 구획 · 로드 중 문 1
- G150 21337~21344(8줄) #TASK-ES-105: 팀 초대 및 소통/DM/동반자 모듈(js/team-invite-comm.js) 연결 — 빈 구획 · 로드 중 문 1
- G151 21345~21353(9줄) #TASK-ES-105: 팀 연계 개인목표 및 상호 체크 모듈(js/team-linked-goals.js) 연결 — 빈 구획 · 로드 중 문 2
- G152 21354~21358(5줄) KF-2 #TASK-ES-017: 템플릿 복제 크레딧 모듈(js/template-credit.js)에 앱 핸들 연결 — 빈 구획 · 로드 중 문 1
- G153 21359~21401(43줄) PWA: Service Worker 등록 및 자동 업데이트 감지 (#TASK-ES-118) — 빈 구획 · 로드 중 문 10
