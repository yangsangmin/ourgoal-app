# index.html 인라인 잔여 3단계 설계 (#TASK-ES-513)

- 근거: 헌법 v2026.10.06-SNOWBALL(CELL_SPLIT · CELL_SPLIT_PROOF 5항 — 로그인 뒤 화면은 실계정 하네스 `docs/design/harness/real-account-check.js`, 테스트 계정 `OG_TEST_ALLOW`), 작업참고 `C:/dev/agent-knowledge/WORK-REFERENCE.md` **기준 PR #800**, 앞 단계 설계 `docs/architecture/INLINE-HARD-SPLIT-DESIGN.md`, 분열 빌더 서류 `docs/specs/REQ-TASK-ES-436 ~ 497`(「원래 자리에 남긴 것」 표).
- 이 문서가 정하는 것: ① 남은 인라인 묶음을 「무엇이 막는가」로 나눈 표(도구 산출) ② 게스트로 못 재는 묶음 (가)를 실계정으로 재는 표준 절차와, 그 증거가 법정에서 어떻게 받아들여지는지 ③ (나) smoke FN_NAMES 묶음별 판정 ④ (다) CELL_SPLIT 5 때문에 못 옮기는 것과 감싸기로 되는 것 ⑤ 병렬 구역과 PR 수(추정) ⑥ 시범 PR 결과.
- 이 문서의 수치는 모두 스크립트 산출이다. 출처 index.html 은 origin/main `1ce6c144`(#800 병합) 판이다. **이 판에서만 맞는 수치라 주장(claims)에는 쓰지 않는다**(L002).

## 0. 작업 유형 분류 (SNOWBALL)

| 부분 | 판정 | 근거 |
|---|---|---|
| 잔여 집계·구역·PR 수 | (가) 표준 | INLINE-HARD-SPLIT-DESIGN 1·6·7절과 같은 도구(`inline-script-map`·`inline-hard-types`·`inline-hard-test-probe`)를 잔여 전체로 넓혀 돌렸다 |
| (나)·(다) 판정 | (가) 표준 | 생성기 정지 조건(`gen-inline-hard.js` 41~48·122·128줄)과 smoke 합본 읽기(`scripts/smoke-test.js` 245~247줄)를 읽어 판정 |
| (가) 실계정 비교 표준 절차·시범 | (다) **탐색 · 새 유형** — 「게스트로 닿지 않는 경로가 든 인라인 묶음 옮기기」 | 작업참고에 이 유형의 방식이 없다(L006 은 `needs-login` 사유만, L029 는 실계정 하네스로 서버 저장 확인만). 빌린 유형: L016(표준 이음매) · L006(법정 도구 한계 사유) · #TASK-ES-379·#TASK-ES-402 의 실계정 읽기 비교. 안 맞는 점: 앞선 실계정 하네스는 묶음마다 새로 썼고, 로그인 직후 앱이 스스로 하는 쓰기(체크인·사용자 행 올리기)를 막지 않았다 — 이번에 설정 파일형 도구와 쓰기 차단을 더했다(3-2) |

이탈(나)은 없다. 이 PR 의 시범은 표준 절차(INLINE-HARD-SPLIT-DESIGN 4-1)를 그대로 따르고 실계정 비교를 **더한** 것이며 검증을 줄인 곳이 없다.

## 1. 잔여 실측

`node scripts/module-metrics.js`(origin/main `1ce6c144`): 인라인 스크립트 줄 **11,794** · index.html 함수 선언 **205** · window 직접 대입 277(래칫 값). 지도 `node scripts/inline-script-map.js --write`(커밋하지 않음): 묶음 151 · 옮길 대상 91 · IIFE 11,772줄 · 함수 161.

## 2. 잔여 묶음 유형별 집계 (도구)

도구: `docs/design/harness/module-split/inline-stage3-classes.js` — 지도 + index.html 재파싱(최상위 this/arguments·문 종류) + 시험지 선행 실측(`scripts/inline-hard-test-probe.js` 를 「어려움」만이 아니라 잔여 91묶음 전부로 넓혀 git archive 사본에서 돌린 결과 `reports/TASK-ES-513/stage3-test-probe.json` — 시험지 42개, 기준 사본 실패 16개는 git 이력이 없는 사본 탓으로 비교에서 빠짐). 사람 판단 칸(게스트로 닿는가·돈·CSS 숨김)은 도구 안 `RULES` 에 근거와 함께 제목으로 적었다. 한 묶음은 우선순위가 가장 앞선 칸 하나로 센다(이음매 > 라 > 마 > 가 > 나 > 다 > 표준).

<!-- stage3-classes:begin -->
> 아래 표는 `NODE_PATH=<node_modules> node docs/design/harness/module-split/inline-stage3-classes.js --probe <실측> --md <이 문서>` 가 쓴다(손으로 고치지 않는다). 출처 index.html sha256 앞 12자 `e0f1bb1dee78`. 이 판에서만 맞는 수치다 — 주장(claims)에 쓰지 않는다(L002).

잔여 묶음 **91개 · 10693줄 · 함수 161개**(지도의 빈 구획·이음매 표지 밖 전부).

| 칸 | 뜻 | 묶음 | 줄 | 함수 | 시험지 선행 필요(실측) |
|---|---|--:|--:|--:|--:|
| S | 이음매 머리(옮길 코드 없음 — 앞선 PR 의 가져오기 줄) | 8 | 680 | 0 | 1 |
| 라 | (라) 돈 승인선 — 손대지 않는다(L033) | 4 | 1448 | 15 | 0 |
| 마 | (마) CSS 숨김에 갇힌 기능 — 별도 결심 진행 중(제외) | 4 | 987 | 26 | 0 |
| 가 | (가) 게스트 화면으로 닿지 않는 경로가 있다 | 20 | 2575 | 59 | 7 |
| 나 | (나) 시험지가 인라인에서 함수를 잘라 실행(smoke FN_NAMES·구간 절단) | 14 | 2142 | 36 | 0 |
| 다 | (다) 생성기가 멈추는 모양(최상위 this/arguments·한 줄 두 문·공용 타이머) | 5 | 367 | 7 | 1 |
| T | 표준 이음매로 바로(게스트 시나리오로 잰다) | 36 | 2494 | 18 | 2 |

최상위 문(함수·변수 선언 밖) 전체: 감쌀 수 있는 4줄 이상 문 61 · 3줄 이하 문(원래 자리) 63 · window 노출 문(원래 자리) 75 · 감싸면 지역 변수가 되는 var 문 1. 최상위 this/arguments 함수 2개(openModal·saveGoogleToken).

#### (라) 돈 승인선 — 손대지 않는다(L033)

| 묶음 제목 | 줄 | 함수 | 막는 것(근거) | 시험지 선행 |
|---|--:|--:|---|---|
| 구독 상태 (전체 기능 100% 완전 무료 제공) | 8 | 1 | subscriptionState(돈 낱말) — #764 P0 가 건너뜀 | 없음 |
| 아워골 앱 환경설정 및 보상형 광고 파이프라인 (TASK-ES-013) | 30 | 0 | 광고(승인선 ①) — #774 H3 가 건너뜀 | 없음 |
| 안내 모달 (전체 기능 100% 완전 무료 제공) | 31 | 2 | openPaywallModal(paywall) — 돈 낱말(L033) | 없음 |
| 템플릿 복제 보상형 광고(Rewarded Ad) 파이프라인 (TASK-ES-013) | 1379 | 12 | 광고(승인선 ①) — #774 H3 가 건너뜀 | 없음 |

#### (마) CSS 숨김에 갇힌 기능 — 별도 결심 진행 중(제외)

| 묶음 제목 | 줄 | 함수 | 막는 것(근거) | 시험지 선행 |
|---|--:|--:|---|---|
| XP/레벨 시스템 | 106 | 3 | renderLevelBadge — #levelBadgeRow 가 네 테마·홈 원스크린에서 숨김(#483) | 없음 |
| [UI/UX 틀 개편 Phase 4] 목표 탭 노션급 데이터 관리 & 인지순행 IA (#TASK-UI | 154 | 7 | 빠른 추가 입력칸·스마트 태그·루틴 매트릭스 보이는 요소 0, 상세 서랍 진입로 0(#481) | 없음 |
| [PHASE 5] #TASK-UIUX-PHASE5-RECORDS-CALENDAR FUNCTIONS | 159 | 4 | #quickStopwatchBar·#recCalFuseSwitcher ui.css 숨김(#481) | 없음 |
| [#TASK-ES-174] 목표 템플릿 백과사전 전체화면 팝업 및 상호작용 | 568 | 12 | 진입 단추가 숨은 부모 안 — (가)와 겹침(#476·#483) | 없음 |

#### (가) 게스트 화면으로 닿지 않는 경로가 있다

| 묶음 제목 | 줄 | 함수 | 막는 것(근거) | 시험지 선행 |
|---|--:|--:|---|---|
| 소통 피드 (Supabase feed_posts, 실시간 동기화) | 6 | 0 | 상태 선언만(함수 0) — 옮길 함수 없음 | 없음 |
| 전역 공유 팀 로더 & 렌더링 (#TASK-ES-133) | 7 | 0 | 상태 선언만(함수 0) | 없음 |
| 마니또 실 유저 익명 응원 연동 (#TASK-ES-133, #TASK-ES-145) | 8 | 0 | 상태 선언만(함수 0) | 없음 |
| P0: 새 비밀번호 입력 모달 (비밀번호 복구 링크 수신 시) | 9 | 1 | 복구 메일 링크로만 열림(PASSWORD_RECOVERY) | 없음 |
| 통합 딥링크 게이트웨이 & 게스트 소프트 뷰어 3종 (js/viral-sharing.js 위임) | 10 | 1 | 주소 쿼리로만 도는 경로 — 법정 goto 는 /index.html 만 | 없음 |
| DM & 동반자 소통 시스템 (TASK-ES-105) | 25 | 1 | openUserProfileModal 은 예비 경로 — 로그인해도 OurgoalTeamInviteComm 쪽이 불림 | 없음 |
| Notifications (best-effort, tab must be open) | 31 | 2 | 알림 시계(오래 기다림) | 없음 |
| [#TASK-ES-264] 자정(00:00 KST / 현지 표준시) 날짜 변경 감지 및 자동 동기화  | 35 | 2 | 날짜가 바뀌어야 도는 경로(오래 기다림) | 없음 |
| 2계정 상호작용 테스트 (테스터 B 직통 입장: #TASK-ES-169) | 38 | 1 | 로컬 개발 주소에서만 도는 테스터 B 입장(enterAsTesterB) | 없음 |
| Supabase | 39 | 1 | 로그인 — getSupabaseAuthToken | 없음 |
| Web Push (앱이 꺼져 있어도 오는 알림) | 54 | 3 | 푸시 구독 — push-notification · 시험지 선행 1 | push-subscribe-auth-es400.test.js |
| P0: 회원 탈퇴 30일 유예(소프트 삭제) 복구 체크 | 100 | 0 | 로그인 — 소프트 삭제 복구 확인 | 없음 |
| 서버 관리자 API를 통한 기록 및 프로필 복구 (#TASK-ES-036) | 113 | 1 | 로그인 — syncServerRecords(관리자 복구) | record-ledger-sync.test.js, sync-server-records-render-home.test.js |
| 디바이스 세션 & 원격 로그아웃 유틸 (Req 1) | 114 | 5 | 로그인 — setDeviceLoginTime(실계정 실측: 테스트 계정 2회·게스트 0회) · 이 PR 시범 | 없음 |
| [#TASK-ES-172] [27] 목표 탭: 데일리 루틴 서브탭 & 편집/상세 모달 | 170 | 1 | 게스트 시드 루틴 0개(#493) — 게스트가 루틴을 만들어 닿는지 먼저 실측 · 시험지 선행 1 | routine-detail-modal.test.js |
| 회원 탈퇴 전용 안내 모달 및 법적책임·데이터분실 사전 안내 (#TASK-ES-158) | 177 | 4 | 로그인 · 탈퇴 실행은 되돌릴 수 없음(④) — 열기·닫기만 잴 수 있다 · 시험지 선행 1 | account-withdrawal-modal.test.js |
| RENDER: 팀 목표 (팀장·매니저만 추가/수정/삭제, 팀원은 보기만) | 260 | 17 | 팀·실시간·차단 사용자 · FN_NAMES filterHidden·sortGoalsByOrder·filterBlockedPosts | 없음 |
| 소셜 로그인 (카카오 / 실제 구글 OAuth 연동) | 306 | 7 | 외부 OAuth(카카오·구글) — 법정은 외부 통신 차단 | google-session-guard.test.js |
| 뱃지 컬렉션 (명예의 전당) | 312 | 6 | 로그인 — loadProfile·ensureUserRow(실계정 실측: 테스트 계정 2회·게스트 0회) · FN_NAMES totalCompletedMilestones · 시험지 선행 2 | record-ledger-sync.test.js, unique-display-name.test.js |
| 개인 목표 200% 활용 가이드 & 템플릿 백과사전 (#TASK-ES-135) | 761 | 6 | 팀(getGroupLevelGoals·openLevelGroupDetailModal·openTeamGoalEditModal — 테스트 계정 A 도 팀 0) · isMockGroup 은 게스트 소통 「팀」에서 22회(실측) · 시험지 구간 절단 3 | team-fold-state-es409.test.js, team-goal-guide-hint.test.js, team-level-accordion-es406.test.js |

#### (나) 시험지가 인라인에서 함수를 잘라 실행(smoke FN_NAMES·구간 절단)

| 묶음 제목 | 줄 | 함수 | 막는 것(근거) | 시험지 선행 |
|---|--:|--:|---|---|
| 방해금지 시간대(DND, 조용한 시간) 판별 순수 함수 (TASK-BG-7) | 21 | 1 | FN_NAMES isWithinDND — 합본 읽기(#751·#465)로 풀림, 세포를 js/tabs/** 또는 js/core/* 에 | 없음 |
| ⏱️ 인앱 인터벌 타이머 & 스톱워치 위젯 (In-Table Stopwatch) | 22 | 1 | FN_NAMES formatStopwatchTime — 합본 읽기(#751·#465)로 풀림, 세포를 js/tabs/** 또는 js/core/* 에 | 없음 |
| [PEER INVITE] '함께 목표' 방 초대 루프 (웹 무설치 즉시 수락) | 24 | 3 | FN_NAMES buildPeerInviteUrl·calculateRemainingSeats·formatPeerInviteMessage — 합본 읽기(#751·#465)로 풀림, 세포를 js/tabs/** 또는 js/core/* 에 | 없음 |
| 기록 히트맵 (GitHub 히트맵 스타일) | 29 | 2 | FN_NAMES filterRecordsByQuery·heatmapLevel — 합본 읽기(#751·#465)로 풀림, 세포를 js/tabs/** 또는 js/core/* 에 | 없음 |
| 테마별 기록 DB 다운로드 & 외부 AI 분석 프롬프트 번들 (TASK-OG-001) | 33 | 2 | FN_NAMES buildCSV·getAIAnalysisPrompt — 합본 읽기(#751·#465)로 풀림, 세포를 js/tabs/** 또는 js/core/* 에 | 없음 |
| 목표 일정 리스케일링 | 36 | 1 | FN_NAMES rescaleGoal — 합본 읽기(#751·#465)로 풀림, 세포를 js/tabs/** 또는 js/core/* 에 | 없음 |
| 맥락 기반 다이내믹 알림 문구 생성 | 52 | 1 | FN_NAMES generateDynamicNotification — 합본 읽기(#751·#465)로 풀림, 세포를 js/tabs/** 또는 js/core/* 에 | 없음 |
| TASK-ES-307: 측정지표 다중 선택 및 동시 렌더링 엔진 | 62 | 1 | 시험지가 함수 시작부터 원래 자리 노출 줄까지 잘라 실행 — 합본으로도 안 풀림(#467) | 없음 |
| 📈 표 기록 기반 일자별 자동 성장 추이 차트 (Visual Trend Chart) | 111 | 1 | FN_NAMES computeTrendChartData — 합본 읽기(#751·#465)로 풀림, 세포를 js/tabs/** 또는 js/core/* 에 | 없음 |
| 목표 보관(기록으로 옮기기) | 174 | 3 | FN_NAMES goalAchievement — 합본 읽기(#751·#465)로 풀림, 세포를 js/tabs/** 또는 js/core/* 에 | 없음 |
| 전문 템플릿 실시간 자동 집계 엔진 (혁신 1) | 174 | 1 | FN_NAMES computeTableAnalytics — 합본 읽기(#751·#465)로 풀림, 세포를 js/tabs/** 또는 js/core/* 에 | 없음 |
| 5대 테마 온톨로지 & 경량 AI 분류기 (TASK-OG-001) | 256 | 3 | FN_NAMES buildCheckinRecord — 합본 읽기(#751·#465)로 풀림, 세포를 js/tabs/** 또는 js/core/* 에 | 없음 |
| 최초 로그인 활용가이드 — 4대 탭 무블러(Zero Blur) 투명 라이브 프리뷰 융합 | 284 | 5 | FN_NAMES getPrivacyLabel — 합본 읽기(#751·#465)로 풀림, 세포를 js/tabs/** 또는 js/core/* 에 | 없음 |
| CSV / 엑셀 양방향 연동 & 스마트워치 매핑 & 목표 3각 추적 | 864 | 11 | FN_NAMES parseCsvText·parseVoiceToTableRow — 합본 읽기(#751·#465)로 풀림, 세포를 js/tabs/** 또는 js/core/* 에 | 없음 |

#### (다) 생성기가 멈추는 모양(최상위 this/arguments·한 줄 두 문·공용 타이머)

| 묶음 제목 | 줄 | 함수 | 막는 것(근거) | 시험지 선행 |
|---|--:|--:|---|---|
| Confetti | 23 | 1 | toast — 타이머 공유 공용 부품(#482) | 없음 |
| 크리에이터 템플릿 (#TASK-ES-315, 64: 구형 창 영구 제거 및 무해화) | 49 | 2 | cloneTemplate 가 노출과 같은 줄(#448) | 없음 |
| [#TASK-ES-153] 전역 7일 유예 통합 휴지통 (Recycle Bin) 시스템 | 51 | 2 | saveGoogleToken 최상위 arguments(K) · FN_NAMES calendarAvailable · 시험지 선행 1 | gcal-login-reconnect-fix.test.js |
| Modal helper & Android Hardware Back Handler | 67 | 1 | openModal 최상위 arguments(K) · 공용 부품(#471) | 없음 |
| 캘린더 실시간 구독 URL 생성기 (WebCal Feed & #TASK-ES-252 HMAC 서명) | 177 | 1 | shareContent 가 노출과 같은 줄(#448) | 없음 |

#### 표준 이음매로 바로(게스트 시나리오로 잰다)

| 묶음 제목 | 줄 | 함수 | 막는 것(근거) | 시험지 선행 |
|---|--:|--:|---|---|
| RENDER: TEMPLATE ENCYCLOPEDIA SUBTAB (#TASK-ES-187) | 3 | 0 | 게스트 화면으로 닿는다고 본다(빌더가 시나리오로 먼저 실측) | 없음 |
| 세션 복구 및 안전 앱 진입 유틸 | 4 | 0 | 게스트 화면으로 닿는다고 본다(빌더가 시나리오로 먼저 실측) | 없음 |
| [78 / 89] 데이터분석 프롬프트 백과사전 (실사용 유저 등록·피드 게시 및 도움돼요 상호작용) | 7 | 0 | 게스트 화면으로 닿는다고 본다(빌더가 시나리오로 먼저 실측) | 없음 |
| #TASK-ES-165: 앱 진입 아바타 인사 팝업 (화면 절반 크기 & 시간대별 멘트) | 8 | 0 | 게스트 화면으로 닿는다고 본다(빌더가 시나리오로 먼저 실측) | 없음 |
| 앱 활용 가이드 다시보기 | 8 | 0 | 게스트 화면으로 닿는다고 본다(빌더가 시나리오로 먼저 실측) | 없음 |
| 1순위 대표 목표 AI 초집중 모드 (Focus Auto-Pilot) | 9 | 0 | 게스트 화면으로 닿는다고 본다(빌더가 시나리오로 먼저 실측) | 없음 |
| 체크인 입력 글자수 힌트 (#TASK-ES-367: 열 수 없던 활동 테마 선택 창·배지 제거, 승인 | 9 | 0 | 게스트 화면으로 닿는다고 본다(빌더가 시나리오로 먼저 실측) | 없음 |
| P0: 비밀번호 찾기 (이메일 재설정 링크 발송) | 10 | 1 | 게스트 화면으로 닿는다고 본다(빌더가 시나리오로 먼저 실측) | 없음 |
| 결과 기록 (체크박스 대신 수치 입력) | 10 | 0 | 게스트 화면으로 닿는다고 본다(빌더가 시나리오로 먼저 실측) | 없음 |
| 외부 데이터 불러오기 (mock) | 10 | 0 | 게스트 화면으로 닿는다고 본다(빌더가 시나리오로 먼저 실측) | 없음 |
| [#TASK-ES-160, #TASK-ES-166, #TASK-ES-180] 각 탭 200% 활용법  | 11 | 0 | 게스트 화면으로 닿는다고 본다(빌더가 시나리오로 먼저 실측) | 없음 |
| 원터치 퀵 루틴 칩 | 11 | 0 | 게스트 화면으로 닿는다고 본다(빌더가 시나리오로 먼저 실측) | 없음 |
| [#TASK-ES-222] [생각 메모장 92번] 카카오톡 인앱 브라우저 감지 및 Android Ch | 13 | 0 | 게스트 화면으로 닿는다고 본다(빌더가 시나리오로 먼저 실측) | 없음 |
| AI feedback (best-effort; provider-aware; local fallback | 13 | 0 | 게스트 화면으로 닿는다고 본다(빌더가 시나리오로 먼저 실측) | 없음 |
| 위클리 리캡 카드 (스포티파이 랩드 스타일, 공유 캔버스 인프라 재사용) | 13 | 0 | 게스트 화면으로 닿는다고 본다(빌더가 시나리오로 먼저 실측) | 없음 |
| Render all | 13 | 1 | 게스트 화면으로 닿는다고 본다(빌더가 시나리오로 먼저 실측) | 없음 |
| [#TASK-ES-189] 템플릿 백과사전 3대 분류(개인·루틴·팀) 및 AI/실유저 2원화 이식 시 | 15 | 0 | 게스트 화면으로 닿는다고 본다(빌더가 시나리오로 먼저 실측) | 없음 |
| 8대 화면 스타일 (테마) 정의 | 16 | 0 | 게스트 화면으로 닿는다고 본다(빌더가 시나리오로 먼저 실측) | theme-system-v4.test.js |
| 1:1 고객 문의 / 버그 제보 (#TASK-ES-178) | 20 | 0 | 게스트 화면으로 닿는다고 본다(빌더가 시나리오로 먼저 실측) | 없음 |
| [#TASK-ES-150] 아바타 레벨업 대형 팝업 & 성장 성향 키워드 | 22 | 0 | 게스트 화면으로 닿는다고 본다(빌더가 시나리오로 먼저 실측) | 없음 |
| [71] 앱 잠금 PIN (이 기기) — 설정·해제·앱 진입 확인 | 22 | 0 | 게스트 화면으로 닿는다고 본다(빌더가 시나리오로 먼저 실측) | 없음 |
| UX Telemetry (Hesitation & Rage Tap) | 23 | 0 | 게스트 화면으로 닿는다고 본다(빌더가 시나리오로 먼저 실측) | 없음 |
| 목표 AI 생성 전체 템플릿 양식 및 세부 항목 미리보기 (Req 5) | 24 | 0 | 게스트 화면으로 닿는다고 본다(빌더가 시나리오로 먼저 실측) | 없음 |
| [#TASK-ES-146] 아워골 평가해주기 90% 팝업 | 31 | 0 | 게스트 화면으로 닿는다고 본다(빌더가 시나리오로 먼저 실측) | 없음 |
| Goal category templates | 38 | 0 | 게스트 화면으로 닿는다고 본다(빌더가 시나리오로 먼저 실측) | 없음 |
| 사진 인증 & 뷰어 모달 (가상유저 요청 P1) | 38 | 0 | 게스트 화면으로 닿는다고 본다(빌더가 시나리오로 먼저 실측) | 없음 |
| 신규 유저 10초 활성화: 갓생 스타터 목표 템플릿 | 42 | 0 | 게스트 화면으로 닿는다고 본다(빌더가 시나리오로 먼저 실측) | 없음 |
| [#TASK-ES-264] 오늘의 미션 및 AI 피드백 조건부 호출 최적화 | 81 | 2 | 게스트 화면으로 닿는다고 본다(빌더가 시나리오로 먼저 실측) | today-mission-card-guide.test.js |
| Enter app | 131 | 1 | 게스트 화면으로 닿는다고 본다(빌더가 시나리오로 먼저 실측) | 없음 |
| 11인 외부 UI/UX 감시 및 개선팀 핵심 기능 구현 | 146 | 3 | 게스트 화면으로 닿는다고 본다(빌더가 시나리오로 먼저 실측) | 없음 |
| [#TASK-ES-225] [생각 메모장 95번] Gemini API 분당 쿼터(Rate Limit  | 146 | 0 | 게스트 화면으로 닿는다고 본다(빌더가 시나리오로 먼저 실측) | 없음 |
| RENDER: HOME | 216 | 1 | 게스트 화면으로 닿는다고 본다(빌더가 시나리오로 먼저 실측) | 없음 |
| 🎙️ 마이크 권한 거부 상태 자가 진단 및 1초 권한 허용 모달 (#TASK-ES-227) | 237 | 1 | 게스트 화면으로 닿는다고 본다(빌더가 시나리오로 먼저 실측) | 없음 |
| [#TASK-ES-233] 3일 실천 완성 나의 6각 성장 차트 미리보기 SVG 렌더러 | 276 | 4 | 게스트 화면으로 닿는다고 본다(빌더가 시나리오로 먼저 실측) | 없음 |
| [#TASK-ES-220] [생각 메모장 91번] 교대근무자 가변형 루틴 프리셋 & 자동 스케줄러 | 322 | 3 | 게스트 화면으로 닿는다고 본다(빌더가 시나리오로 먼저 실측) | 없음 |
| 캘린더 수동 일정 편집 모달 (Req 2 & #TASK-ES-253) | 496 | 1 | 게스트 화면으로 닿는다고 본다(빌더가 시나리오로 먼저 실측) | 없음 |

<!-- stage3-classes:end -->

읽는 법:
- **(가)의 「게스트로 닿지 않는다」는 묶음 안의 일부 경로 얘기다.** 실측해 보면 같은 묶음 안에서도 게스트로 닿는 함수가 많다(3-1 실측: 「개인 목표 200% 활용 가이드」의 `isMockGroup` 은 게스트 소통 「팀」 하위 탭에서 22회 불림, 「디바이스 세션」의 `performLogout` 은 게스트 설정 「로그아웃」 단추로 불림). 그래서 (가) 묶음도 옮기는 PR 의 주장은 **게스트로 닿는 몫은 게스트 시나리오(법정이 직접 잼)**, 로그인 뒤에만 도는 몫만 실계정 비교 + `needs-login` 으로 낸다(L006).
- 표준 칸(T)의 큰 묶음 다수는 함수가 0~1개다(상태·상수 선언). 상태 선언은 원래 자리에 남으므로(INLINE-HARD-SPLIT-DESIGN 2-1) 옮겨도 줄이 거의 줄지 않는다 — 순수 상수만 2-4 로 줄인다.
- 이음매 머리(S)는 옮길 코드가 아니라 앞선 PR 의 가져오기 줄이다. 남은 묶음을 옮길수록 가져오기 줄이 **늘어난다**(이 PR 시범: 가져오기 5줄 + 통로 표지 2줄). 인라인을 0 으로 만드는 마지막 단계는 IIFE 머리 자체를 기관 세포로 바꾸는 별도 설계가 필요하다(이 문서 범위 밖).

## 3. (가) 게스트로 못 재는 묶음 — 실계정 표준 절차

### 3-1. 먼저: 정말 게스트로 못 닿는가(실측, L006)

`node docs/design/harness/module-split/real-account-split-check.js <앱 사본> <단계.json> <이름> <out.json> --guest --count 함수,함수`
- `--count` 는 **사본의 index.html 에만** 함수 본문 맨 앞에 호출 수 세기 한 문장을 넣고(저장소 파일 0 변경) 단계마다 누적 호출 수를 남긴다. 같은 단계를 `--guest` 와 테스트 계정으로 한 번씩 돌려 「게스트 0회 · 계정 1회 이상」인 함수만 (가)로 본다.
- 실측(기준 사본, 홈·목표 6하위 탭·소통 팀/동반자/DM·기록·설정, `reports/TASK-ES-513/real-account-reach-*.json` 과 작업 기록):
  - 게스트 0 · 테스트 계정 A 1회 이상: `setDeviceLoginTime`(2) · `loadProfile`(2) · `ensureUserRow`(2).
  - 게스트도 닿음: `isMockGroup`(22) · `getDeviceId` · `checkRemoteSessionRevoked` · `getDeviceLoginTime` · `performLogout`(설정 「로그아웃」) · `defaultProfile`.
  - 둘 다 0: `getGroupLevelGoals`·`openLevelGroupDetailModal`·`openTeamGoalEditModal`(테스트 계정 A 도 팀 0개) · `openRoutineDetailModal`(루틴 0개) · `openUserProfileModal`(예비 경로) · `enterAsTesterB`(로컬 개발 주소 전용) · `collapseAllTeamGoalAccordions` · `renderPersonalGoalsEmptyGuideHtml`.
  - → 팀·루틴 경로는 **계정만으로는 안 닿는다.** 테스트 계정에 고정 테스트 팀·루틴이 있어야 한다(3-3).

### 3-2. 기준·작업 읽기 전용 비교

도구: `docs/design/harness/module-split/real-account-split-check.js`(이 PR) — #TASK-ES-402 `real-account-team-3.js`·#TASK-ES-432 `real-account-inline-split-2.js` 의 틀을 묶음마다 새로 쓰지 않도록 단계(누를 곳·읽을 곳·셀 것)를 설정 JSON 으로 뺐다. 비교는 기존 `real-account-compare-inline-split-2.js`(단계별 존재·보임·글자 해시·길이·속성 해시·덧붙인 값·window 종류·기록 수 전후·pageerror).

1. 기준 사본: `git archive origin/main | tar -x -C <사본>` (node_modules 는 연결).
2. 단계 설정 JSON: 옮긴 함수가 실제로 불리는 화면만 고른다(3-1 의 `--count` 로 확인). 되돌릴 수 없는 단추(탈퇴·전체 초기화·전송)는 넣지 않는다.
3. 실행 순서: 기준1 → 작업 → 기준2 (같은 계정, 매번 새 임시 브라우저 프로필). 기준1 대 기준2 차이 = 본질 변동(시각·난수) → 걸러낸 뒤 기준 대 작업 차이 0 을 본다(L026).
4. 환경: 로컬 127.0.0.2 정적 서버(앱 사본) + `/api/track` 만 운영 전달(그 밖 `/api` 503). **Supabase `rest/v1`·`storage/v1` 의 GET 밖 요청은 보내지 않고 끊는다** — 로그인 직후 앱이 스스로 하는 사용자 행 올리기·체크인 올리기·rpc 가 실측에서 나왔다(`writesBlocked`: `POST /rest/v1/users` 4 · `POST /rest/v1/checkins` 4 · rpc 3). 앞선 하네스들은 이것을 막지 않았다(읽기 전용이라 적었지만 앱의 자동 동기화 쓰기는 나갔을 수 있다). 기준·작업이 같은 조건이라 비교는 공정하다.
5. 비밀값: 환경 변수(`OG_APP_URL`·`OG_TEST_A_EMAIL`·`OG_TEST_A_PASSWORD`)는 Windows 사용자 변수에서 **그 자식 프로세스에만** 넣는다(PowerShell `Set-Item env:`). 주소에 `ogtest` 가 있거나 `OG_TEST_ALLOW` 에 정확히 같은 주소일 때만 접속한다. 화면 글자는 해시·길이만 남긴다.

### 3-3. 팀·실시간

- **팀**: 테스트 계정 A·B 모두 지금 팀 0개(실측). 팀 화면 경로(수준별 조·팀 목표 편집·팀원 점검)를 재려면 **고정 테스트 팀**이 필요하다. 제안: `real-account-check.js` 의 runTag 정리 규칙을 따르되 지우지 않는 고정 행 하나(테스트 계정 A 가 팀장, B 가 팀원, 이름에 `ogtest` 표식)를 한 번 만든다. 운영 DB 에 테스트 행을 남기는 일이지만 되돌릴 수 있고(표식으로 지움) 개인정보가 없다 → 승인선 밖, 다만 운영 쓰기라 오케스트레이터가 한 번 확인하고 만든다.
- **실시간**: 읽기 전용으로는 잴 수 없다(사건이 있어야 수신한다). `real-account-check.js` 의 A·B 두 브라우저 방식(runTag 표식 행 쓰기 → B 화면 도달 → 자기 행만 지움)을 쓴다. 이 경우 3-2 의 쓰기 차단을 끄고 runTag 정리 로그(`cleanup.leftover` 0)를 증거에 같이 남긴다.
- **차단 사용자·보관 목표**: 보관 목표는 게스트가 목표를 만들어 보관하는 조작으로 닿는지 먼저 게스트 시나리오로 실측한다(L006). 차단 사용자는 A 가 B 를 차단 → 확인 → 해제(되돌릴 수 있음, runTag 정리)로 잰다.

### 3-4. 법정은 실계정 증거를 어떻게 받는가 (court/README.md 4·5절, court/claims.js 읽음)

- 법정이 직접 재는 주장은 `behavior`(시나리오를 기준·작업 커밋에서 다시 돌림) · `static`(글자·JSON 값 — 최대 「글자만 봄」)뿐이다. 법정은 외부 통신을 막고(`court/config.json` `allowHosts: []`), 시나리오의 사전 상태 주입(`seedLocalStorage`·`spawnPeer.fixture`)은 금고 `court/fixtures/` 의 이름만 쓸 수 있다(지금 `guest-fresh` 하나). 그래서 **로그인 뒤 화면을 법정이 다시 돌리는 길은 지금 없다.**
- 「작업과 함께 새로 만든 검증 스크립트의 출력은 증거로 받지 않는다」(README 5절). 실계정 하네스 결과 파일을 `static` `jsonPath` 로 걸면 법정은 「그 파일에 그 값이 적혀 있다」까지만 본다(#696 선례: 「코드만 확인」).
- 그래서 실계정 측정은 **주장 둘로** 낸다: ① `static` jsonPath — 결과 파일의 `base1VsAfter.differing = 0`·`base1VsBase2.differing = 0`·도달 실측 값 ② `unverified` + `reason: tool-cannot-measure` + `cannotBecause: needs-login` + `how`(재현 명령) + `note`(작업자 실측 요약). ②는 판정서 둘째 줄에 「법정 도구 한계로 못 잰 것(로그인 뒤 화면)」으로 따로 적히고 병합 기준(MERGE_GATE 1)에 들어간다. ①은 로그인 뒤 경로의 지시 항목을 「글자만 확인」 이상으로 올리지 못한다.
- 주장 문장에 「다른 기기」·「실시간 … 동기화」·「타인」 같은 낱말이 들어가면 필요 수준이 「진짜 계정끼리(L4)」로 오른다(`court/grade-floors.json` `keywordFloors`). 낮추려고 낱말을 빼는 것은 금지(README 3절)지만, 로그인 뒤 경로를 설명하면서 사실과 다른 낱말을 넣지도 않는다.
- **실측(이 PR 1차 심사, 커밋 71a0e79 · 판정번호 364B4268 · 실행 37339709468)**: 로그인 뒤 경로 지시 항목(R3)에 `unverified needs-login` 주장(C2)과 실계정 결과 파일 `static` 주장 4개(C3~C6, 분야 ui-behavior)를 함께 걸었더니, 법정은 C2 를 「확인 못 함 — 법정 도구 한계(needs-login)」로, C3~C6 을 「글자만 확인(필요 수준 PC 화면 미달)」로 찍고, **지시 항목 R3 전체를 「코드만 확인(화면에서는 안 봄) · 필요한 확인: PC 화면에서 눌러 봄」** 으로 둘째 줄 부족 목록에 올렸다. 도구 한계 1건은 따로 「법정 도구 한계로 못 잰 것 1건(로그인 뒤 화면 1)」로 적혔다. 실계정 결과 파일은 지시 항목을 올리지 못하고, 오히려 그 항목의 부족 사유를 「도구 한계」가 아니라 「코드만 확인」으로 바꿔 보이게 했다(#696 과 같은 모양).
- **그래서 표준 배치(2차 실측 대상)**: 로그인 뒤 경로의 동작 지시 항목에는 `unverified needs-login` 주장 **하나만** 건다(부족 사유 = 도구 한계 — MERGE_GATE 1). 실계정 결과 파일은 별도 기록 항목(「측정 기록을 저장소에 남긴다」, 분야 config — 문장도 「…로 기록되어 있다」)으로 분리한다. 이 PR 2차 커밋이 그 배치다(R3 = C2 만, R6 = C3~C6). 2차 판정은 PR #802 의 법정 댓글.
- 측정 기록 항목이 「글자만 확인으로 충분」으로 찍히는 것은 그 파일에 그 값이 적혀 있다는 뜻일 뿐, 로그인 뒤 화면이 같다는 법정 확인이 아니다 — 보고에서 둘을 섞지 않는다.

### 3-5. 구조적 해법(결심 대기 칸과 연결)

지시함 「결심 대기」에 이미 「법정 보강 2건(로그인 뒤 화면 시험 상태, 법정 서버 https)」이 금고 변경으로 올라 있다. 이 시범의 측정으로 고를 수 있는 길은 둘이다(둘 다 금고 변경 — 상민님 「금고 변경 승인」):
- (A) 법정이 GitHub 비밀값의 테스트 계정으로 `real-account-split-check.js` 같은 비교를 **스스로** 돌린다(법정 작업에서 Supabase·운영 `/api/track` 만 허용 호스트로). 장점: 작업자가 낸 파일이 아니라 법정 측정이라 「진짜 계정」 수준을 법정이 인정할 수 있다. 단점: 법정이 외부 통신을 하게 된다(지금 설계의 전제를 바꿈), 운영 데이터 의존.
- (B) 금고 fixture 로 「로그인한 것처럼 보이는 로컬 상태」를 주입. 장점: 외부 통신 0. 단점: 가짜 세션이라 제13조(Mock 금지)와 부딪히고, 서버를 부르는 경로는 여전히 못 잰다 — 권하지 않는다.
- 권장: (A). 그 전까지는 3-4 의 두 주장 형식이 표준이다.

## 4. (나) smoke FN_NAMES — 시험지 합본(#751·#753 방식)으로 풀리는가

판정 근거: `scripts/smoke-test.js` 245~247줄 — `fnSource = mainScript + (xp.js) + require('../tests/helpers/inline-bundle').withInlineCells('')` 로 FN_NAMES 함수를 인라인 뒤 세포 합본(js/tabs/** 의 OurgoalAppScope 세포 + js/core 의 생성기 표지 파일, `L.` 만 뗌)에서도 찾는다. 생성기는 `smokeUsesBundle && (js/tabs/** 또는 js/core/*.js)` 이면 FN_NAMES 함수를 옮긴다(`gen-inline-hard.js` 44~48·122줄). 따라서:

| 묶음 | FN_NAMES | 판정 |
|---|---|---|
| 목표 일정 리스케일링 · 기록 히트맵 · 전문 템플릿 실시간 자동 집계 엔진 · 표 기록 기반 성장 추이 차트 · 인앱 인터벌 타이머 & 스톱워치 위젯 · 테마별 기록 DB 다운로드 · [PEER INVITE] '함께 목표' · 방해금지 시간대(DND) · 맥락 기반 다이내믹 알림 문구 · 목표 보관(기록으로 옮기기) · 5대 테마 온톨로지 · 최초 로그인 활용가이드 | 2절 (나) 표 | **이미 풀림** — 세포를 js/tabs/** 에 두면 선행 PR 없이 옮긴다. 조건: 옮긴 함수 글자에 `K.` 가 생기지 않아야 한다(smoke 합본은 `L.` 만 뗀다 — 생성기는 `L.` 만 붙이므로 지켜진다) |
| CSV / 엑셀 양방향 연동(864줄) | parseCsvText·parseVoiceToTableRow | 풀림 + 800줄 초과(G) — take.names 로 책임 단위 두 세포 |
| TASK-ES-307: 측정지표 다중 선택 | (FN 아님) `tests/achievement-graph-multiset.test.js` 가 함수 시작부터 **원래 자리 노출 줄까지** 잘라 실행 | **합본으로 안 풀림**(#467). 시험지 선행 PR 로 「함수는 합본에서, 노출 줄은 index.html 에서」 따로 잘라 이어 붙이게 읽는 방법만 바꾼다(단언·기대값 0 변경). 같은 모양: 「개인 목표 200% 활용 가이드」 `collapseAllTeamGoalAccordions`(`team-fold-state-es409`·`team-level-accordion-es406`) |
| RENDER: 팀 목표 · 뱃지 컬렉션 | filterHidden·sortGoalsByOrder·filterBlockedPosts · totalCompletedMilestones | FN 은 풀림. 막는 것은 (가)(3절) |
| 전역 7일 유예 통합 휴지통 | calendarAvailable | FN 은 풀림. 같은 묶음 `saveGoogleToken` 은 (다) |
| 구독 상태 · 템플릿 복제 보상형 광고 | subscriptionState · 광고 3개 | (라) 돈 — 손대지 않는다 |

## 5. (다) CELL_SPLIT 5 때문에 못 옮기는 것 vs 감싸기로 되는 것

- **못 옮김(원본에 둔다)**: 최상위 this/arguments 함수 2개 — `openModal`(「Modal helper」), `saveGoogleToken`(「휴지통」 묶음). 감싸면 지역 변수가 되는 `var` 를 담은 최상위 문 1개(앞선 이음매 머리 안 — 원래 옮길 대상 아님). 공용 타이머를 나누는 `toast`(「Confetti」 — #482 판단 유지).
- **한 줄에 노출이 붙은 함수**(`shareContent`·`cloneTemplate`, #448): 생성기가 「옮기는 문이 앞 문과 한 줄을 나누면」 멈춘다(`sharesPrevLine`). 노출 줄을 원래 자리에 두는 표준(2-2)을 쓰려면 그 한 줄이 둘로 나뉘어야 하는데 그것은 글자 변경이라 CELL_SPLIT 1 위반 — **옮기지 않는다**(줄을 나누는 정리는 별도 고치기 티켓 뒤).
- **감싸기(B2·B3 이음매)로 되는 것**: 4줄 이상 최상위 문 전부 — 2절 표 머리의 「감쌀 수 있는 문」 수. 이벤트 등록·초기 실행 문은 본문을 세포 `bindXxx()` 로, 원래 자리에 부르는 한 줄(2-3). 이 PR 시범의 `bindSignupSubmit` 이 그 예다.
- **원래 자리에 남는 것(줄이 줄지 않음)**: 3줄 이하 문 · window 노출 문 · 상태 변수 선언(재대입·실행되는 초기값) — 2절 표 머리 수.

## 6. 병렬 구역 제안과 PR 수 (추정)

구역은 **묶음 제목** 기준이며 겹침 0 이다(한 묶음은 한 구역). (라)·(마)는 넣지 않는다. 다른 빌더 배정이 남은 묶음(「RENDER: HOME」·「11인 외부 UI/UX」·「5대 테마 온톨로지」·「Enter app」·「Render all」·「서버 관리자 API 복구」)은 착수 전 배정 기록을 확인하고, 비어 있으면 아래 구역에 붙인다(L037).

| 구역 | 묶음(제목) | 선행 | PR 수(추정) |
|---|---|---|--:|
| Z1 로그인·계정 | 디바이스 세션(이 PR 시범) · 회원 탈퇴 30일 유예 · 회원 탈퇴 전용 안내 모달 · 서버 관리자 API 복구 · Supabase · 뱃지 컬렉션 · 소셜 로그인 · 새 비밀번호 입력 모달 · 2계정 상호작용 테스트 | 시험지 선행 1(account-withdrawal-modal · record-ledger-sync · sync-server-records-render-home · unique-display-name · google-session-guard) | 1 + 3 = 4 |
| Z2 팀·소통 | RENDER: 팀 목표 · 개인 목표 200% 활용 가이드 · DM & 동반자 소통 시스템 · 소통 피드 · 전역 공유 팀 로더 · 마니또 실 유저 · 캘린더 실시간 구독 URL | 시험지 선행 1(구간 절단 3개) · 고정 테스트 팀 1회(3-3) | 1 + 2 = 3 |
| Z3 알림·시간·주소 | Notifications · Web Push · 자정 날짜 변경 · 통합 딥링크 게이트웨이 | 시험지 선행 1(push-subscribe-auth-es400) | 1 + 1 = 2 |
| Z4 FN_NAMES·시험지 | 4절 「이미 풀림」 묶음 + CSV/엑셀 · TASK-ES-307 측정지표 · 휴지통(calendarAvailable 몫) | 시험지 선행 1(측정지표 구간 절단) | 1 + 4 = 5 |
| Z5 표준 앞쪽 | 2절 표준(T) 표에서 index.html 줄 순서 앞 절반 | 시험지 선행 1(theme-system-v4 · today-mission-card-guide — 걸린 묶음만) | 1 + 3 = 4 |
| Z6 표준 뒤쪽 | 2절 표준(T) 표의 나머지 | — | 3 |
| 기관(한 빌더) | Modal helper(openModal 남김) · Confetti(toast 남김) · 데일리 루틴 서브탭(게스트 루틴 생성 실측 뒤) | — | 2 |

- 추정 근거: INLINE-HARD-SPLIT-DESIGN 7절과 같은 가정(표준 이음매 PR 하나 = 3~5묶음, 시험지 선행은 구역마다 1) + 실측 차이 두 가지: (가) 구역은 묶음마다 실계정 비교 한 벌이 붙어 PR 당 2~3묶음으로 잡았다, 표준(T) 큰 묶음 다수는 함수 0~1개라 PR 당 묶음 수를 늘렸다. 생성 지도 일괄 갱신 PR(L009)은 병합 3~5건마다 1 → 약 6.
- 합계(추정): 23 + 생성 지도 6 ≈ **29 PR**. 측정 아님 — 착수 뒤 구역별 실제 PR 수로 고친다.

## 7. 시범 PR (이 PR)

<!-- stage3-pilot:begin -->
- 묶음: 「디바이스 세션 & 원격 로그아웃 유틸 (Req 1)」 → `js/tabs/settings/device-session.js`(설정 `docs/design/harness/module-split/inline-stage3-pilot.json`, 자리 H1, take.all + wrap `bindSignupSubmit`). 생성기: 옮김 5 · 감쌈 1 · index.html 99줄 감소(작업자 측정, 주장 아님).
- 고른 이유: 3-1 실측에서 게스트 0·계정 1회 이상인 함수(`setDeviceLoginTime`·`loadProfile`·`ensureUserRow`)가 든 묶음 중 가장 작다(114줄). 「뱃지 컬렉션」(312줄)은 시험지 선행 2가 먼저다.
- 증거 배치: 게스트 로그아웃 시나리오(behavior, 법정이 직접 잼) · 로그인 뒤 몫 `unverified needs-login`(재현 명령 + 작업자 실측 note) · 실계정 비교·도달 실측 결과 파일 `static` jsonPath(1차: 같은 지시 항목, 2차: 별도 기록 항목 — 3-4) · verify·단독 로드·신고서 `static`.
- 작업자 측정(판정 아님): verify ok · 단독 로드 회귀 0 · tests 종료 코드 기준=작업 · npm test 종료 0 · 게스트 6단계 비교 차이 0 · 테스트 계정 6단계 기준1/작업/기준2 차이 0(43값) · 게스트 시나리오 기준·작업 통과.
- 판정: PR #802 의 법정 댓글(`node court/chat.js 802`). 판정 글자는 이 문서에 옮기지 않는다(효력은 GitHub `court` 검사에만 있다).
<!-- stage3-pilot:end -->

## 8. 막힌 점·다음

- 법정에는 로그인 뒤 화면을 다시 돌리는 길이 없다(3-4). 실계정 측정은 「글자만 확인 + 법정 도구 한계」로만 실린다. 구조적 해결은 결심 대기의 「법정 보강」(3-5 권장 A).
- 테스트 계정 A·B 모두 팀·루틴 0 — Z2 는 고정 테스트 팀이 먼저다(3-3).
- 앞선 실계정 하네스는 앱의 자동 동기화 쓰기를 막지 않았다 — 새 도구는 막는다(3-2 의 4).
