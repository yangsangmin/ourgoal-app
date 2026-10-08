# 부록 A. 저장소 실측 결과 (2026-10-08, 7개 영역)

> 출처: 이 세션의 워크플로 실측(서브에이전트 7명이 코드·문서를 읽고 file:line 근거로 기록). 수치는 각 항목의 source 명령으로 센 값이며, 못 센 것은 null.


## 성장 문서·로드맵·지시함

**요약**: 성장 문서는 두껍다(로드맵 229건, 성장 자료 70건, 초안·런북·템플릿 다수)지만 저장소 어디에도 가입자·설치·DAU·리텐션 실측치가 한 줄도 없다(모두 "null·측정 예정·0건"). D0~D122 로드맵은 상태 칸 자체가 없고 날짜상 오늘(2026-10-08)은 D29 "M1 확산기"이지만, 실물 근거로는 D0~2 "지인 배포" 단계의 P0 중 코드로 되는 것(PWA·설치 카드·PostHog·피드백 SLA·온보딩·계정삭제·assetlinks)만 됐고 사람이 해야 하는 유입 행위(지인 발송·오픈채팅·스레드·Play 계정·테스터)는 수행 기록이 0이다. 바이럴은 초대 링크·공유 카드·?ref 첫 유입 계측까지만 코드에 있고 리퍼럴 보상·대기열 /join·K-factor·앰배서더·CRM 저니는 로드맵 문장뿐이다. 콜드스타트는 BACKLOG가 "40인 가상 페르소나 블렌디드 피드 완료"라 적었지만 2026-10-01 상민님 결심(ES-332)으로 전면 삭제돼 지금은 빈 피드 문구와 AI 배지 동반자 최대 1명만 남았고 대체 시딩 계획은 문서에 없다. 지시함에는 열린 지시 0건, 성장 관련은 Google Play $25 결제 결심 대기 1건이 "시점 미정"으로 멈춰 있다.


**콜드스타트 판정**: 유저 0명·친구 0명인 신규 유저가 지금 받는 것은 '혼자 쓰는 앱'뿐이다. 온보딩 30초(수호동물→1호 목표→첫 체크인 축하)와 AI 피드백·스트릭·히트맵·리캡 카드는 실제로 돌아가므로 싱글플레이어 효용(R44 ①)은 있다. 그러나 소통 탭은 빈 피드("아직 공유된 실천이 없어요"), 마니또는 AI 배지가 붙은 동반자 1명(달성률·연속일수 null), 동류 러너 3인 매칭과 웰컴 응원 스탬프는 실유저 0명이면 렌더되지 않고, 가상 페르소나 40인은 상민님 결심으로 전면 삭제돼 대체 시딩이 없다. 즉 "앱에 진실된·유익한 데이터가 있어 경험할 수 있는가"에 대한 답은: 내 데이터는 진실되게 쌓이지만 남의 데이터(동료의 기록·응원·비교 가능한 통계)는 0이고, 이를 채울 운영 행위(지인 50명 발송·함께 목표 방 10개·앰배서더 응원 보장·운영자 큐레이션)는 전부 문서 단계라 투자자 지적("초기 유입도 못 잡고 바이럴 요소도 없다")은 이 영역의 실측과 일치한다.


**측정 수치**

- 로드맵 항목 수(작업/마일스톤/결심/루틴) = 75 / 11 / 4 / 139 = 229  ·  출처: grep '^### T[0-9]* \[작업|마일스톤|결심|루틴' docs/growth/ourgoal-daily-roadmap.md (헤더 :2 와 일치)
- 로드맵 [손 필요] 표기 건수 = 17  ·  출처: grep -c '\[손 필요' docs/growth/ourgoal-daily-roadmap.md
- 로드맵 기준 오늘의 날짜 위치 = 2026-10-08 = D29 · W05 (M1 확산기, D30 M1 결산 전날)  ·  출처: docs/growth/ourgoal-daily-roadmap.md:944
- 성장 자료 / 컨트롤타워 자료 건수 = 70 / 60  ·  출처: grep -c '^## R[0-9]' ourgoal-growth-knowledge-base.md, grep -c '^## N[0-9]' notion-control-tower-knowledge-base.md
- 가입자 수·설치 수·DAU·D1/D7/D30 리텐션(문서 기록) = null (저장소 전체 grep 0건)  ·  출처: grep -rn 'DAU|MAU|리텐션|가입자|설치 수' docs/growth BACKLOG.md docs/sprint docs/plans docs/reports reports → 벤치마크·계획 문장만, 실측값 없음
- 코드에 배선된 계측 이벤트 이름 수 / posthog.capture 직접 호출 = 18종 / 2곳 (track() 래퍼 경유)  ·  출처: grep -o "track(['\"][a-z_]+" index.html js; grep -c 'posthog.capture' index.html js; js/core/telemetry.js:78-81
- 로드맵 PostHog 10개 이벤트 중 현재 코드 존재 = 9/10 (cheer_received 0건)  ·  출처: grep -rn 'cheer_received' index.html js api → 0; 증거 jpg(docs/growth/evidence/posthog-events-10of10-2026-09-18.jpg)에는 정의 존재
- 서버 계측 허용 이벤트 = 6종  ·  출처: api/track.js:8-15 ALLOWED_EVENTS
- 푸시 알림을 켠 계정 수 = 0 (2026-09-11 기준)  ·  출처: docs/sprint/STATUS.md:40
- 고객 문의 원장 행 수 / 실제 신고 = 5행 / 0 (전부 시험 행, 2026-09-21)  ·  출처: docs/specs/REQ-T014-FEEDBACK-SLA.md:19
- 콘텐츠 작업 큐 적체 / 발행 완료 = 39행 / 0건 (2026-09-06~09-15 생성분)  ·  출처: docs/growth/T048-콘텐츠60편-8앵글-기획.md:16
- T048 대본 작성 편수 / 영상 렌더링 = 60 / 0  ·  출처: docs/growth/T048-콘텐츠60편-8앵글-기획.md:9-12
- Play 폐쇄 테스터 등록 / 목표 = 0 / 16 (개발자 계정 미등록)  ·  출처: reports/T006/claims.json C6·C7; docs/directives/ACTIVE.md:61
- 앱 내 가상 페르소나(SIM_PERSONAS) 수 = 0 (sim/personas.json 200건은 smoke-test 존재 검사만)  ·  출처: js/tabs/comm/sample-data.js:25-26; scripts/smoke-test.js:1677
- 수익화 계획서 지표 6개 현재 값 = 전부 null, 실데이터 0건  ·  출처: docs/growth/2026-09-12-helpful-reason-monetization-plan.md:117-122, :164
- active_real_users 표시값 = null (이전 하드코딩 25 제거)  ·  출처: js/components-team-actions.js:125, js/team-auto-actions.js:387 (#TASK-ES-348)
- 초대 템플릿 전송 체크리스트 완료 = 0/4  ·  출처: docs/growth/invite-templates.md:69-73
- 스프린트 PR 병합 / BACKLOG 도파민 항목 [x] = 7/7 (TASK-01~06 + 72H) / 12/12 ('PR로 제출' 표기)  ·  출처: docs/sprint/STATUS.md:17-23; BACKLOG.md:16-27
- 지시함 열린 지시 / 성장 관련 결심 대기 = 0 / 1 (Google Play $25, 시점 미정)  ·  출처: docs/directives/ACTIVE.md:53, :61
- 설치 안내 카드 파일 = 6 (iOS·Android × jpg/png/html)  ·  출처: ls docs/growth/cards/

**있는 것(배선 판정)**

- [doc_only] D0~D122 일자별 실행 로드맵(229건: 작업 75·마일스톤 11·결심 4·루틴 139) — docs/growth/ourgoal-daily-roadmap.md:1-4 (헤더), 단계 머리 :8 D0~2 지인배포 / :224 W1 데이터·피드백 / :424 M1 5천명 / :988 M2 3만명 / :1598 M3 매출 5천만 / :2141 M4 10만명·2억; 오늘 2026-10-08 = D29 :944 (파일에 진행 상태 칸이 없다(grep '상태:' 0건). 상태 정본은 노션 로드맵 DB로 저장소 밖. [손 필요] 17건(grep 실측).)
- [doc_only] 성장 자료 지식베이스 R01~R70 (첫 10/100/1000명·ASO·리퍼럴·리텐션 벤치마크) — docs/growth/ourgoal-growth-knowledge-base.md:3-5 (생성 2026-09-08, 70건, 목표 3일 지인배포→M1 5천→M2 3만→M3 5천만→M4 10만·2억), P0 목록 :32-62 (외부 자료 요약 + '아워골 적용점' 한 줄씩. 실행 기록 없음.)
- [doc_only] 노션 컨트롤타워 KB N01~N60 — docs/growth/notion-control-tower-knowledge-base.md:3-6 (운영 대시보드(노션) 설계 자료. 유입·유지 기능과 직접 관계 없음.)
- [full] T001 PWA 설치 지원(manifest·SW·아이콘) — BACKLOG.md:90 (2026-09-04 완료), dev_log.md:1108 (2026-09-09 T001 Lighthouse 점검 기록), RELEASE_72H_GUIDE.md:10-14 PWA 설치 안내 (Lighthouse 점수 숫자는 저장소에 없음(dev_log 해당 줄 인코딩 깨짐).)
- [full] T002 설치 안내 카드 2종(iOS·Android) — docs/growth/cards/install-ios.jpg·install-android.jpg·.png·.html 6파일 존재(ls 실측); invite-templates.md:15 첨부 지시 (카톡 테스트 전송 1회(완료 기준) 기록 없음.)
- [doc_only] T004 개인 초대 메시지 템플릿 3종(1:1 카톡) — docs/growth/invite-templates.md:13-65 (A 지인 20명·B 리더 10명·C 느슨한 지인 20명), 전송 체크리스트 :69-73 전부 미체크 (링크가 https://ourgoal.kr(:25,:41,:60)인데 실제 배포 주소는 ourgoal-app.vercel.app(RELEASE_72H_GUIDE.md:12, js/team-profile.js:148) — 코드에 ourgoal.kr 참조는 리캡 카드 문구 2곳뿐(js/sanctuary-weekly-recap.js:79,183). 도메인 불일치.)
- [full] T005 PostHog 설치·이벤트 10개·라이브 검증 — index.html:5-7 posthog.init(phc_…, us.i.posthog.com); js/core/telemetry.js:78-81 track()→posthog.capture; 코드 track 이벤트 이름 18종(grep 실측: signup_completed·goal_created·checkin_completed·cheer_sent·invite_sent·invite_opened·dm_sent·onboarding_step_viewed·app_installed_pwa·landing_view 등); 증거 docs/growth/evidence/posthog-events-10of10-2026-09-18.jpg(이벤트 정의 화면) (로드맵 10개 중 cheer_received 는 현재 코드 grep 0건(jpg 에는 존재). 대시보드(DAU/WAU·코호트 리텐션·TTV) URL·수치는 저장소에 없음.)
- [partial] T006 Play Console 계정·폐쇄 테스트 트랙 준비 — .well-known/assetlinks.json:1-13 (com.yangbis.ourgoal, 업로드 키 지문 1개); reports/T006/claims.json C6 '개발자 계정 등록 못함', C7 '트랙·AAB 업로드·테스터 16명 등록·옵트인 링크 확보 못함', C8 '스토어 등록정보 미입력'; docs/GOOGLE_PLAY_CLOSED_TEST_RUNBOOK.md:9-18 [손 필요] $25 결제·신분확인 (AAB 는 로컬에만(.gitignore 로 제외, 런북 :21-23). 테스터 0명.)
- [doc_only] Google Play 비공개 테스트 가이드·런북(20명 14일, 스토어 문안·정책 설문 답변표) — docs/google-play-closed-test-guide.md:5 (2026-09-11), docs/GOOGLE_PLAY_CLOSED_TEST_RUNBOOK.md:54-101 스토어 문안, :109-120 정책 답변표, :155-159 (20명 기준, 12명 완화 공지 미확인) (스토어 메타데이터 초안(T023)은 이 런북이 실물. 키워드 150→20(T022) 목록은 없음.)
- [doc_only] T007 오픈채팅 개설 / T008 스레드 첫 글 / T009·T012 지인 1·2차 발송 50명 / T013 Mom Test 통화 / T025 디스콰이엇 등록 / T047 SNS 3계정 — docs/growth/ourgoal-daily-roadmap.md:73-100, :126-143, :258-264, :494-500; dev_log.md·docs·reports 에 수행 기록 0건(grep 'PMF|오픈채팅|스레드 게시|디스콰이엇|T047' 실측), SNS 계정 URL 저장소 0건 (로드맵 D0~2 의 핵심 '유입 행위'가 전부 [손 필요]이며 실행 흔적이 없다.)
- [full] T010 온보딩 90초 → 30초 무마찰 온보딩(수호동물→닉네임·1호 목표→첫 체크인 축하) — docs/plans/PLAN-TASK-ES-142-30S-ONBOARDING.md:8 (상태 100% 완료·법정 청구 준비), :12-27 3단계 명세; index.html:71 '카카오 없이 닉네임으로 1초 만에 바로 시작' 링크 (로드맵 완료 기준(신규 계정 TTV 중앙값 3회 측정 ≤120초)의 측정값은 어디에도 없음.)
- [full] T014 피드백 SLA(치명 버그 24h)·인앱 1:1 문의 배선 — scripts/feedback-sla.js:4-15 (add·triage·resolve·replied·check, 노션 원장 POST/PATCH :177,:187); docs/growth/feedback-sla-runbook.md:29-33 심각도 기준; vercel.json:36-37 /api/inquiry→api/track; js/tabs/settings/support-modals.js:54 fetch('/api/inquiry'); docs/sql/2026-09-16-inquiries.sql (docs/specs/REQ-T014-FEEDBACK-SLA.md:19 실측 '원장 5행 전부 시험 행' — 실제 사용자 신고 0건.)
- [partial] T015 AI 고지 동의 모달·개인정보처리방침·지원 페이지 — docs/legal/privacy.md·terms.md 존재; AI 제공자 고지 동의 모달 코드 grep('ai consent|AI 고지') 0건; /support 페이지 없음(ourgoal.support@gmail.com 메일만, RELEASE_72H_GUIDE.md:43) (방침 문서만 있고 모달·FAQ 페이지는 없음.)
- [full] T019 계정 삭제(앱 내+백엔드 실제 삭제) — api/withdraw.js 존재; docs/sql/2026-10-04-account-purge-install.sql; docs/plans/PLAN-TASK-ES-351-ACCOUNT-PURGE.md; dev_log.md:5811 (PR #357 purge 설계)
- [full] T020 웹푸시 소프트 애스크 + Web Push 인프라(자체 VAPID, pg_cron 발송) — js/tabs/settings/sub-notify.js:155 openNotificationSoftAskModal; api/push-subscribe.js; api/push-dispatch.js:8 (매분 pg_cron 트리거); BACKLOG.md:111-113 (#TASK-ES-103 완료) (docs/sprint/STATUS.md:40 '설정에서 알림을 켠 계정이 0건'(2026-09-11) — 발송이 한 번도 트리거된 적 없음. 로드맵의 OneSignal 은 코드 참조 0건.)
- [partial] T024 인앱 만족도 2택·이탈 마이크로서베이(PostHog Surveys) — js/tabs/settings/app-evaluation.js:103 (앱 평가 → /api/inquiry 전송) 존재; PostHog Surveys 호출(getActiveMatchingSurveys 등) grep 0건 (체크인 3회 트리거·뒤로가기 2회 설문·피드백 DB 웹훅 없음.)
- [full] T029 스트릭 카운터·7일 뱃지·스트릭 프리즈 — BACKLOG.md:18,23 (히트맵·스트릭 프리즈 PR), js/tabs/records/checkin-helpers.js·weekly-recap.js (computeStreakDays), RELEASE_72H_GUIDE.md:34 (완료 기준 '지인 중 스트릭 3일+ 유저 수' 기록 없음.)
- [partial] T036 리퍼럴 v1(초대 링크 랜딩·양방향 보상·K 계산) — 초대 링크 생성 js/team-profile.js:148·js/team-companions.js:192 ('?ref='+닉네임); js/tabs/comm/peer-invite.js:45-53 invite_sent/invite_opened 이벤트; js/viral-sharing.js:276-289 ?invite=/?join_team= 수신→showPeerInviteLandingModal(:210); js/core/telemetry.js:19,45-52 ref 를 first-touch 로 localStorage 저장 (?ref 는 계측 저장만 하고 초대자 식별·보상·같은 방 자동 입장·K 대시보드 없음(grep 0). docs/sprint/STATUS.md:46 '/share/{userId}·?ref= 수신 처리는 범위 밖'.)
- [full] T050 뱃지·트로피·위클리 리캡 공유 카드 + 딥링크 워터마크(TASK-06) — BACKLOG.md:21,26,27 (명예의 전당·트로피·위클리 리캡 PR), docs/sprint/STATUS.md:22 (TASK-06 PR #43 병합), js/tabs/comm/share-card.js:58 buildInviteLinkSuffix(/share?type=goal&id=…), api/track.js:256-281 /share OG 랜딩(vercel.json:32-33) ('첫 공유 건수'(완료 기준) 기록 없음.)
- [doc_only] T052 초대 대기열 랜딩 /join(순번·보상 티어·공유율) — docs/growth/ourgoal-daily-roadmap.md:548-556; 저장소에 /join 파일·라우트 0건(grep·ls 실측)
- [partial] T045 CRM 캘린더(온보딩·스트릭·윈백 저니 3종, 빈도 상한) — docs/growth/ourgoal-daily-roadmap.md:470-478; 실물은 체크인 시각 리마인더(api/push-dispatch.js)와 맥락 다이내믹 문구(docs/sprint/TASK-05.md, STATUS.md:21)뿐, D1/D3/D7·윈백 시퀀스 코드 0건, OneSignal 0건
- [doc_only] T048 콘텐츠 60편 선제작 기획 + 작업지시서 Brief — docs/growth/T048-콘텐츠60편-8앵글-기획.md:9 (대본 60편 작성), :11-14 (영상·패널 평가·게시큐 미완), :16 (콘텐츠 작업 큐 39행·발행 0건, 발행 자동화 인프라 없음); T048-작업지시서-Brief-초안.md:18 (결과증명 수치 [측정 예정]) ('결과 증명' 캐러셀 10편(:69-80)은 전부 [측정 예정] — 보여줄 진짜 데이터가 없다는 뜻.)
- [doc_only] T079 앰배서더 응원 보장(신규 24h 내 응원 3개) / T039 앰배서더 위촉 / T088 K-factor 주간 리포트 — docs/growth/ourgoal-daily-roadmap.md:842-849, :404-410, :946-951 (코드·운영 기록 없음.)
- [doc_only] T028 리텐션 대시보드·CURR / T031 실험 DB(ICE) / T035·T038 PMF 설문·측정 / 마일스톤 T017(D2)·T057(D14)·T090(D30 결산) — docs/growth/ourgoal-daily-roadmap.md:289-296, :322-330, :362-369, :395-402, :176-184, :602-608, :968-974 (어느 마일스톤도 결과(설치·가입·D1·PMF %)가 기록된 곳이 없다.)
- [doc_only] 72H 베타 테스터 배포 안내 가이드 — docs/growth/RELEASE_72H_GUIDE.md:12 (PWA 링크), :17-20 (APK 직접 설치), docs/sprint/STATUS.md:23 (72H-RELEASE PR #102 병합) (배포용 안내문. 실제 배포 대상·결과 기록 없음.)
- [full] 스프린트 6태스크(소셜 로그인·페이월·음성 체크인·Realtime 피드·다이내믹 푸시·공유 카드) — docs/sprint/STATUS.md:7-8 (스프린트 완료), :17-22 (PR #38~#43 병합); TASK-01.md:7 기대효과 '가입 이탈 60% 방어', TASK-06.md:7 'CAC 0원 유기적 유입' (TASK-02 페이월은 2026-09-10 전면 무료화로 제거(STATUS.md:43). 기대효과 수치는 전부 가정값, 측정 없음.)
- [full] BACKLOG 도파민 강화 12항목(축하 애니·히트맵·XP/레벨·오늘의 미션·프리즈·응원 리액션·트로피·위클리 리캡) — BACKLOG.md:16-27 전부 [x] (2026-09-05 'PR로 제출') ('PR로 제출' 표기만 있고 병합 여부는 이 파일로 판정 불가.)
- [shell] 콜드스타트 — 40인 가상 페르소나 시뮬레이터·격리 DB·블렌디드 피드(TASK-OG-002) — BACKLOG.md:31-50 '2026-09-10 완료' 표기; 시뮬레이터 본체는 command-center(저장소 밖, dev_log.md:1140); sim/personas.json 200건은 scripts/smoke-test.js:1677 존재 검사만; 앱 코드 SIM_PERSONAS = [] (js/tabs/comm/sample-data.js:25-26, #TASK-ES-332 결심 490108 '즉시 전면 삭제'), docs/rules/TICKETS.md:426 (문서상 완료, 실물은 삭제됨. 지금 앱에 가상 유저 콘텐츠는 0건.)
- [shell] 콜드스타트 — Dynamic Blended Feed(실유저 ≤20명 시 AI 1개 보강) — js/tabs/comm/feed-list.js:106-121 (분기는 있으나 singleAiGuide 주입 배제 → realCombined 그대로; realCount===0 라벨 '아직 공유된 실천이 없어요' :122) (유저 0명이면 빈 피드.)
- [partial] 콜드스타트 — 마니또 AI 동반자 최대 1명(AI 배지, 수치 null) — js/tabs/comm/manito-real.js:99-137 (realCount<20 → is_ai 동반자 1명 클라이언트 생성, pct/streak null), :302 'AI' 배지; js/reactions.js:44,101 봇 글 반응 비활성 (로컬 생성·서버 저장 없음. 유일하게 남은 '빈 화면 방지' 장치.)
- [partial] 콜드스타트 — 가상 응원(virtualCheerEnabled) — js/tabs/settings/app-defaults.js:22 virtualCheerEnabled:false(기본 꺼짐), js/tabs/records/share-to-feed.js:19 addSimulatedCheerAndReplyToPost, js/tabs/settings/sub-integrations.js:102-106 토글 (기본값 OFF. 켜도 로컬 가짜 응원.)
- [full] 콜드스타트 — 첫 체크인 웰컴 응원 스탬프 실제 발송·동류 러너 3인 매칭(ES-352·ES-348) — docs/plans/PLAN-TASK-ES-352-WELCOME-STAMP-SEND.md:10,27; docs/plans/PLAN-TASK-ES-348-REAL-USER-AI-BADGE.md:27 ('#firstCheckinPeerRunners 0명이면 미렌더'); js/tabs/records/first-checkin-tutorial.js:71 (is_ai 제외 실유저만) (실유저가 0명이면 보낼 대상이 없어 렌더되지 않는다 — 설계상 정직하지만 콜드스타트에는 기여 0.)
- [doc_only] 콜드스타트 전략 문서(R44 Andrew Chen: 싱글플레이어·발행·원자 네트워크 2~5명·집단 포화·AI 응원 명시 시딩) — docs/growth/ourgoal-growth-knowledge-base.md:1487-1495; 로드맵 T003 방 10개·1차 집단 40% 침투 :32-40, T010 '가입 직후 익명 응원 1개 자동 노출(AI 표기)' :106 ('양비스가 익명 응원 시딩'은 코드·운영 기록 없음.)
- [full] 유입 채널 계측(utm_*·ref first-touch, landing_view, funnel_*) — js/core/telemetry.js:19 (keys utm_source·utm_medium·utm_campaign·ref), :45-52 (localStorage ourgoal_attrib 첫 유입 보존), :64-70 recordLanding; api/track.js:8-15 ALLOWED_EVENTS 6종(utm_landing·funnel_signup·funnel_goal_created·funnel_first_checkin 등), docs/sql/2026-09-06-events.sql (쌓인 값의 집계·채널별 가입 표(T053)는 없음.)
- [doc_only] 수익화 계획서(도움돼요 이유 DB, M1 5천명 전 수익화 없음) — docs/growth/2026-09-12-helpful-reason-monetization-plan.md:28 (초기 한 달 수익화 없음), :117-122 지표 6개 현재 값 전부 null, :164 '실데이터 0건' (유입·유지 자체에 관한 계획은 아님.)
- [doc_only] 지시함 ACTIVE.md — 성장 관련 지시 — docs/directives/ACTIVE.md:53 '(열린 지시 없음)', :61 결심 대기 'Google Play 개발자 계정 등록($25) — 시점 미정, 앱 준비가 끝난 뒤', 완료 지시 DIR-001·002·C1·C2(:68-87)는 전부 심사·PR 정리 지시 (유입·유지·바이럴에 관한 열린 지시 0건. 성장 실행을 명령한 지시가 없다.)
- [doc_only] T042·T044·T064·T066·T071 iOS(Capacitor·Apple Developer·TestFlight·심사) / T073·T086 스토어 출시 결심 / T092 Meta 광고(일 3만 원) — docs/growth/ourgoal-daily-roadmap.md:437-447, :461-469, :775-783, :924-931, :993-1001 (iOS 작업물·광고 집행 흔적 저장소 0건. 돈 결심 항목은 지시함 결심 대기에도 없음.)

**없는 것**

- 실측 유저 수치가 저장소 어디에도 없다 — 가입자·설치·DAU/WAU·D1/D7/D30 리텐션·TTV·PMF % 전부 null(로드맵 T017·T038·T090 결산 칸 공란, 수익화 계획서 :117-122 null, T048 결과증명 [측정 예정])
- 로드맵 D0~2 의 실제 유입 행위(지인 50명 1:1 발송 T009/T012, 오픈채팅 T007, 스레드 T008, Mom Test T013, 디스콰이엇 T025, SNS 3계정 T047)는 수행 기록 0 — 템플릿·카드만 있고 전송 체크리스트 0/4
- 스토어 미등록: Google Play 개발자 계정 결심 대기 '시점 미정'(ACTIVE.md:61), 테스터 0/16(reports/T006 C7), iOS(Capacitor·TestFlight) 미착수
- 바이럴 루프의 뒷단이 없다: ?ref 는 계측 저장만(telemetry.js:19) — 초대자 보상·피초대자 같은 방 자동 입장·초대 대기열 /join·K-factor 계산(T036·T052·T088) 코드 0건
- 콜드스타트 콘텐츠 시딩이 사실상 사라졌다: 40인 가상 페르소나 전면 삭제(ES-332) 뒤 대체 계획(운영자 큐레이션 글·AI 표기 응원 시딩·'함께 목표' 원자 네트워크 방 10개 실제 개설)이 문서에도 코드에도 없음 — 유저 0명이면 피드는 '아직 공유된 실천이 없어요'
- 콘텐츠 발행 인프라 없음: 대본 60편은 있으나 작업 큐 39행 발행 0건, 영상 0, 발행은 100% 사람 게이트(T048:16)
- 리텐션 운영 장치 미구현: D1/D3/D7 온보딩 저니·윈백 시퀀스·앰배서더 24h 응원 보장(T045·T079) 없음; 푸시 구독 계정 0건이라 리마인더가 한 번도 나간 적 없음(STATUS.md:40)
- PMF·고객 인터뷰 0건: Sean Ellis 설문(T035·T038)·Mom Test(T013) 결과 없음, 인앱 만족도 서베이(T024) 미구현
- 로드맵 진척 추적이 저장소에 없다(상태 칸 없음, 노션 의존) — 229건 중 무엇이 끝났는지 코드 근거로 세야 한다
- 지시함에 성장 실행 지시가 0건 — 성장 문서는 AI 자신의 서류(효력·근거 아님, ACTIVE.md:13)라 아무도 이행 의무가 없다
- 배포 주소 불일치: 초대 템플릿은 ourgoal.kr, 실제 앱·가이드·초대 링크 코드는 ourgoal-app.vercel.app
- AI 고지 동의 모달·/support FAQ 페이지(T015) 없음 — 스토어 심사 리스크로 로드맵이 적은 항목

## 공유·초대·바이럴 장치(코드)

**요약**: 공유 장치는 클라이언트 쪽(Web Share·클립보드 폴백·캔버스 PNG 카드·동적 OG 서버)에 두껍게 깔려 있어 navigator.share 호출부만 15곳(11개 파일)이다. 그러나 외부 유입의 핵심인 '함께 목표' 방 초대 링크는 buildPeerInviteUrl 의 type 파라미터 덮어쓰기(peer-invite-text.js:28)와 서버 handleShareOg 의 4종 한정 분기(api/track.js:233-254)가 맞물려 파라미터 0개인 루트 '/'로 떨어지는 것을 node 시뮬레이션으로 실측했고, 로그인 회원 경로(app-boot.js:92-94)에서는 딥링크 게이트웨이가 아예 호출되지 않는다. 비사용자가 링크를 열어 보는 것은 범용 og-image 한 장(1200x630)과 범용 랜딩(index.html:51-80), 또는 URL 글자로 조립한 모달 3종(피드·템플릿·완주)뿐이며 초대자의 실제 목표·기록·방 roster 를 DB 에서 읽어 보여주는 코드는 없다. 초대 보상·추천인 귀속·초대 코드 검증·K-factor 집계는 코드에 0건이고 성장 로드맵 문서(T036·T088)에만 있다. 추적은 UTM/ref 첫 유입과 peer_invite_* 이벤트가 Supabase events 에 익명 sid 로 적히는 수준이며 invite_signup·집계 쿼리·대시보드가 없어 바이럴 계수를 낼 수 없다.


**콜드스타트 판정**: 유저 0명·친구 0명 상태에서 이 영역이 신규 유저에게 실제로 주는 것은 '내가 만든 PNG 카드를 내 SNS 에 올리는 자기 전시 도구'(완주 인증서·위클리 리캡·플랫폼 카드·스트릭 카드는 캔버스로 실제 생성되고 Web Share 로 파일 전송된다)까지다. 그 카드나 링크를 받은 비사용자가 보는 것은 범용 og-image 한 장과 범용 랜딩(카카오 3초·닉네임 1초 버튼), 또는 URL 글자로 조립한 모달 3종뿐이며 초대자의 목표·기록·방 같은 실제 데이터는 어디서도 조회되지 않는다. 핵심 초대 루프인 '함께 목표' 방 링크는 서버 리다이렉트에서 파라미터가 통째로 떨어져 받는 사람에게 아무것도 띄우지 못하고(시뮬레이션 2/2), 기존 회원은 어떤 공유 링크를 열어도 딥링크 처리가 돌지 않는다. 보상·추천인 귀속·초대 코드 검증·K 집계가 없어 유입이 생겨도 ref 글자 하나로만 흔적이 남고, 유일한 서버 실수치인 템플릿 복제 수는 0이면 숨겨져 콜드스타트에서는 보이지 않는다. 결론: 현재 코드는 "내보내기 기능"이지 "진실된 데이터를 경험하게 해 유입·유지를 만드는 장치"가 아니며, 먼저 고칠 한 줄은 peer-invite-text.js:28 의 type 덮어쓰기와 api/track.js handleShareOg 의 type 범위(그리고 로그인 경로의 게이트웨이 호출)다.


**측정 수치**

- navigator.share 호출부 / 파일 수 = 15곳 / 11개 파일  ·  출처: grep -rn 'navigator\.share(' index.html js | wc -l
- 딥링크 게이트웨이가 읽는 쿼리 키 수 = 20개  ·  출처: js/viral-sharing.js:267-327 에서 searchParams.get 고유 키 집계
- 딥링크 게이트웨이 호출부 / 로그인 세션 경로 호출 = 2곳(app-boot.js:149, 244) / 0  ·  출처: grep checkAndHandlePeerInviteUrl() js/core
- 캔버스 이미지 생성 함수 수(공유용) = 5개(공유용 3: generateShareImage·generateGoalCertificateImage·generateWeeklyRecapImage, 잠금화면 2)  ·  출처: grep 'function generate*Image' js
- 공유 카드 치수 종류 = 5종(800x419, 720x720, 720x960, 720x1280, 720x720)  ·  출처: js/tabs/comm/share-card.js:30-35
- 클라이언트 track 이벤트 이름 / 서버 ALLOWED_EVENTS = 18개 / 6개  ·  출처: grep track\('…' js index.html 고유 집계 · api/track.js:8-15
- invite_sent 발신처 / invite_signup 발신처 = 1곳(peer-invite.js:51) / 0  ·  출처: grep track('invite_sent' · track('invite_signup'
- /share 서버 리다이렉트 시뮬레이션(생성된 함께 목표 초대 링크) = 새 팀(open)·예시 페어(pair) 2/2 → 'https://ourgoal-app.vercel.app/' 파라미터 0, og:title 범용; type=app&ref 도 '/' (ref 유실); goal/feed/template 3/3 정상 파라미터  ·  출처: scratchpad sim-share.js (api/track.js handler 를 @supabase 스텁으로 직접 호출)
- 클라이언트 게이트웨이 시뮬레이션(앱이 열린 뒤 무엇이 뜨나) = ?goal/?feed/?template 3/3 모달 표시 · 서버가 만든 type=group(무 id) 0 · 루트 '/' 0 · ?ref 0 · 직접 ?invite_group 1(방 이름 "")  ·  출처: scratchpad sim-deeplink.js (js/viral-sharing.js 를 node 에서 호출, openModal/showPeerInviteLandingModal 스텁)
- OG 이미지 실물 = icons/og-image.jpg 1200x630 JPEG 41,147B (1장)  ·  출처: file icons/og-image.jpg · ls -la icons
- 카카오 JS SDK 로드 태그 / Kakao.Share 참조 = 0 / 1(js/team-recruit.js:381, 죽은 분기)  ·  출처: grep Kakao.init|kakaocdn|Kakao.Share index.html js
- shareStreakKakao 정의 / 참조 = 0 / 1(js/sanctuary-weekly-recap.js:84)  ·  출처: grep -rn shareStreakKakao index.html js
- 예시 모임(isMock:true) 수 = 9개  ·  출처: sed -n 5875,6000p index.html | grep -c isMock:true
- 초대 수락 시 code 검증 횟수 = 0 (peer-invite.js 에 'code' 0회)  ·  출처: grep -c code js/tabs/comm/peer-invite.js
- events 테이블 집계 스크립트 수 = 0  ·  출처: grep -rln "from('events')" scripts docs/sql
- 초대 보상/추천인 코드 grep 건수 = 0 (reward/referral/invited_by/추천인/초대 보상)  ·  출처: grep -rn … index.html js api (exp_reward 1건은 아바타 XP, 무관)
- 공개 프로필 경로 grep 건수 = 0 (공개 프로필/public_profile/profile.html//u//?u=)  ·  출처: grep -rn … index.html js api
- manifest share_target / sw.js 공유 수신 = 0 / 0  ·  출처: grep share_target manifest.json · grep share sw.js
- 저장소 스모크 테스트(참고) = 437 통과 / 2 실패 — 실패 2건은 node_modules 0개 환경에서 @supabase/supabase-js 로드 실패(api/withdraw.js, test-account-purge), 공유 영역과 무관  ·  출처: node scripts/smoke-test.js (이 컨테이너)
- 템플릿 복제 서버 기록(recordCopy) 호출부 = 2곳(creator-templates-legacy.js:62, index.html:4663), 로그인 사용자만 집계  ·  출처: grep recordCopy · js/template-credit.js:66-68

**있는 것(배선 판정)**

- [full] 정적 OG 메타(og:title/description/image, twitter summary_large_image) — index.html:21-39 og:*·twitter:* 메타 — icons/og-image.jpg 실측 JPEG 1200x630, 41,147B(file 명령) (앱 루트(/)로 들어오는 모든 공유 링크는 이 한 장짜리 범용 이미지·문구만 미리보기로 보여준다. 공유별 이미지는 없다.)
- [partial] 동적 OG 서버 — /share → api/track.js handleShareOg(template·feed·group·goal 4종 제목/설명 생성 후 0초 meta refresh 로 앱 이동) — vercel.json:29-32 rewrite /share→/api/track · api/track.js:215-289 handleShareOg · api/track.js:1055-1061 GET 분기 (og:image 는 항상 /icons/og-image.jpg(클라이언트가 img 파라미터를 넘기는 곳 0, grep). type 이 4종 밖(app·open·pair·small)이면 제목이 범용이 되고 리다이렉트가 파라미터 없는 '/' 로 떨어진다(scratchpad sim-share.js 실측: type=app&ref → '/').)
- [partial] 통합 딥링크 게이트웨이 handleDeepLinkRouting(?type=&id=, invite_group/invite/join_team, feed/post, template/tpl, goal 등 쿼리 키 20개) — js/viral-sharing.js:267-327 · 호출부 js/core/app-boot.js:149(게스트 복구 경로)·244(랜딩 경로) 2곳 · 키 20개(sed+grep 집계) (로그인 세션 복원 경로(app-boot.js:92-94 restoreSessionAndEnter 뒤 return)는 호출하지 않아 기존 회원이 공유 링크를 열면 아무것도 뜨지 않는다. type=group 인데 id 가 없으면 invite_group 을 보지 않고 빠져나간다(viral-sharing.js:276, sim-deeplink.js 실측 'nothing').)
- [partial] 게스트 소프트 뷰어 3종(피드·템플릿·완주 인증서 모달 → localStorage 게스트 프로필 생성 → 앱 진입) — js/viral-sharing.js:84-147(피드)·152-214(템플릿)·219-262(완주) · 게스트 프로필 저장 131-132, 196-197, 245-246 (비사용자가 보는 내용은 URL 에 실린 author/title/desc 글자뿐이다. 랜딩 시점엔 FEED_POSTS_CACHE 가 비어 있고(js/tabs/comm/feed-posts-sync.js:22-23 은 enterApp 이후 로드) 공유된 글·목표를 DB 에서 조회하는 코드가 없다. 시뮬레이션: ?goal= ?feed= ?template= 3/3 모달 표시 확인.)
- [partial] '함께 목표' 방 초대 — 카카오 공유(shareGroupToKakao)·초대 링크 복사(copyGroupInviteLink)·방 개설 성공 창(openPeerInviteSuccessModal) — js/tabs/comm/peer-invite.js:60-90, 93-132 · 링크 생성 js/tabs/comm/peer-invite-text.js:28 buildPeerInviteUrl · 새 팀 roomType='open' js/tabs/comm/shared-groups.js:552 (실측 결함: buildPeerInviteUrl 이 params.set('type','group') 뒤에 params.set('type', group.roomType) 로 덮어써 생성 링크가 /share?type=open(또는 pair)&… 이 되고, 서버는 그 type 을 몰라 파라미터 0개인 '/' 로 리다이렉트한다(sim-share.js: 새 팀·예시 페어 2/2 → '/'). 받은 사람은 범용 랜딩만 본다. 공유 시트·토스트·클립보드 자체는 동작.)
- [partial] 초대 받은 화면 showPeerInviteLandingModal(방 정보·닉네임 입력·수락·카카오 3초 시작·둘러보기) — js/tabs/comm/peer-invite.js:210-272 (루트로 직접 ?invite_group= 이 오면 뜬다(sim-deeplink.js 확인). 방 정보는 L.MOCK_GROUPS(예시 9개+로컬 customGroups)에서만 찾고 서버 team_pings 를 조회하지 않아 남의 실제 방은 '함께 목표 소그룹 방' 기본 문구로 나온다.)
- [partial] 초대 수락 acceptPeerInvite(게스트 프로필 생성·방 참여·소통 탭 이동·컨페티·토스트) — js/tabs/comm/peer-invite.js:135-207 · 참여 상태 js/tabs/goals/team-state.js:19-25('팀 참여 상태 (localStorage 유지)') (참여·roster 는 수락자 기기의 MOCK_GROUPS·profile.settings.groupState 에만 적힌다(서버 insert 0). 초대한 사람 쪽 DB·화면에는 아무 기록도 가지 않는다. URL 의 초대 코드(code)는 수락 시 검사하지 않는다(peer-invite.js 에 'code' 0회).)
- [shell] 팀 목표 '팀원 초대하기' 모달의 '인앱 초대장 발송' 버튼 — js/tabs/goals/team-goal-modals.js:181-188 — 버튼 비활성화 + '성공적으로 전송했습니다' 토스트만 (네트워크·DB 호출 0. 동반자가 없으면 더미 3명을 보여준다(team-goal-modals.js:88-92).)
- [partial] 팀 목표 '팀 초대 링크 복사'(origin?invite_group=teamId) — js/tabs/goals/team-goal-modals.js:168-178 (/share 를 거치지 않아 OG 미리보기가 범용이다. 랜딩 모달은 뜨지만 팀 목표 id 는 MOCK_GROUPS 에 없어 이름·규칙이 기본 문구(sim: name="").)
- [shell] 팀 모집 '카카오톡 초대'(Kakao.Share.sendDefault 분기) — js/team-recruit.js:379-396 · 카카오 JS SDK 로드 태그 0개(index.html·js grep: Kakao.init/kakaocdn 0) (window.Kakao 가 영원히 없어 SDK 분기는 죽은 코드. 실제로는 클립보드 복사로 떨어진다.)
- [partial] 동반자 전용 초대 링크 복사(https://ourgoal-app.vercel.app?ref=닉네임, Web Share → 클립보드 → 폴백) — js/team-profile.js:141-199 copyCompanionInviteLink · js/team-companions.js:184-230 · 버튼 js/team-companion-search.js:95 (보내는 쪽은 완결. 받는 쪽에서 ref 를 읽는 코드는 계측(js/core/telemetry.js:21)뿐이라 동반자 자동 연결·초대자 표시가 없다(sim: '?ref=' → nothing). ref 가 고유 id 가 아니라 표시 이름이다.)
- [full] 범용 SNS 공유 엔진 shareContent(Web Share → 클립보드 → prompt, /share?type=&id= 링크 생성, 토스트·햅틱) — js/viral-sharing.js:23-64 · 호출부 js/tabs/comm/feed-list.js:544(피드)·js/team-templates.js:80-87(템플릿)·index.html:4816(마켓 템플릿) (클라이언트 완결. 바이럴 추적 이벤트(invite_sent 등)는 쏘지 않는다.)
- [partial] 피드 글 외부 공유(data-sharefeed → openFeedShareModal / shareContent type=feed) — js/tabs/comm/feed-list.js:533-546 · 서버 OG 제목 api/track.js:239-242 (OG 제목 '[아워골 피드] ○○님의 실천 기록'은 만들어지나 랜딩 모달은 URL 글자만 보여준다(DB 조회 0).)
- [partial] 템플릿 공유 → ?template= 딥링크 → 게스트 템플릿 뷰어 → cloneTemplate(내 목표로 복사) — js/team-templates.js:76-100 · js/viral-sharing.js:152-214 · js/creator-templates-legacy.js:44-66 cloneTemplate (목표는 로컬 프로필에 추가 후 saveProfile. 서버 복제 집계(record_template_copy rpc)는 로그인 사용자만(js/template-credit.js:66-68 '로그인 전 로컬 복제는 세지 않는다').)
- [full] 템플릿 복제 수 서버 집계·배지(record_template_copy / template_copy_counts rpc, 0이면 숨김) — js/template-credit.js:65-73 recordCopy · 76-85 counts · 92-113 fillCounts · 호출부 js/creator-templates-legacy.js:62, index.html:4663 (이 영역에서 유일하게 서버의 '진짜 숫자'를 보여주는 소셜 프루프. 유저 0명이면 전부 숨겨진다.)
- [full] 플랫폼 맞춤 공유 카드 캔버스 generateShareImage(카카오 800x419 · 인스타 720x720/720x960 · 틱톡 720x1280 · 쓰레드 720x720) — js/tabs/comm/share-card.js:23-35 치수 5종 · 98-202 generateShareImage · 41-56 워터마크 (이미지 아티팩트는 실제로 캔버스로 생성된다. 단 워터마크가 찍는 '/share/<userId>' 주소(share-card.js:51)는 라우트가 없다(vercel.json 은 /share 정확 일치만) — 카드마다 죽은 주소가 인쇄된다.)
- [full] 소통 탭 공유 하위 화면 3대 버튼(피드 게시·외부 공유·이미지 저장) — js/tabs/comm/goal-certificate-share.js:258-306 · js/team-share.js:21-60 postShareCardToFeed(feed_posts insert) · 62-110 shareCardExternal(PNG 파일 공유) · 112-121 saveCardImage (외부 공유 URL 은 origin '/' 하나(딥링크·추적 없음).)
- [full] 완주 인증서(PNG 생성 · Web Share files · 저장 · 링크 꼬리 /share?type=goal&id=&title=) — js/tabs/goals/goal-export.js:148-184 · 그림 js/tabs/comm/goal-certificate-share.js:20 · 꼬리 js/tabs/comm/share-card.js:58 (링크를 연 비사용자는 '○○ 100% 완주!' 모달(URL 제목 글자)만 본다(sim 확인). 서버 OG 제목·리다이렉트는 정상.)
- [full] 위클리 리캡 카드(옵션 6개 → PNG · 파일 공유 · 저장 · ?recap=weekly 딥링크) — js/tabs/records/weekly-recap.js:50 generateWeeklyRecapImage · 373-410 공유/저장 · js/core/registry-init.js:112-114 (공유 문구 꼬리가 /share?type=app&ref=<내 id> 인데 서버가 type=app 을 모르고 '/' 로 보내 ref 가 유실된다(sim-share.js 실측).)
- [shell] 성소(Sanctuary) 위클리 리캡 '💬 카카오톡 공유' 버튼 — js/sanctuary-weekly-recap.js:84 → OurgoalViralSharing.shareStreakKakao() 호출 · 정의 0개(js/viral-sharing.js:329-335 노출 5개에 없음, 전체 grep 참조 1·정의 0) (OurgoalViralSharing 객체는 있으므로 else 토스트도 안 뜨고 TypeError 로 끝나는 죽은 클릭.)
- [full] MZ 갓생 스토리 카드(스트릭 PNG 저장 · 파일 공유 · 텍스트 복사 · 링크 복사 ?ref=mz_share_) — js/tabs/goals/focus-autopilot.js:395-470 (클라이언트 완결. 링크는 루트+ref 라 계측 외 효과 없음.)
- [full] 레벨업 공유(문구 + 루트 URL) — js/tabs/settings/avatar-levelup-modal.js:117-130 (딥링크·추적 없음.)
- [full] 갓생 카드 동반자·팀 단체방에 보내기(team_pings insert) — js/tabs/comm/story-card-send.js:69, 130 (앱 내부 전파(기존 사용자끼리)이지 외부 유입 장치는 아니다.)
- [partial] 팀 개설 전역 공유(team_pings 'group_creation' JSON 스냅샷 insert · 최근 50건 로드) — js/tabs/comm/shared-groups.js:578-593 insert · 19-45 loadSharedGroups (개설 사실만 서버에 간다. 이후 참여자·roster·활동 변화는 서버에 쓰지 않아 초대 받은 사람의 참여가 다른 기기에 보이지 않는다.)
- [partial] 예시 모임 9개(isMock:true, '💡 이런 팀을 만들 수 있어요 (활용 예시)' 배지로 분리) — index.html:5875-5940 MOCK_GROUPS isMock 9개(grep -c) · js/tabs/comm/shared-groups.js:80-91 (콜드스타트용 샘플이며 배지로 구분된다. 초대 랜딩 모달의 방 조회도 이 배열만 본다.)
- [full] 유입 계측 — UTM/ref 첫 유입 보존(parseAttribution·getAttribution, localStorage ourgoal_attrib) · landing_view 하루 1회 · Supabase events insert · PostHog capture — js/core/telemetry.js:20-35, 45-56, 64-76, 78-88 · 호출 js/core/app-boot.js:243 · 테이블 docs/sql/2026-09-06-events.sql:4-10(anon insert RLS 17-21) · PostHog 키 index.html:6 · 시험 scripts/smoke-test.js:702-716, 902-918 (signup/signup_completed 에 유입 속성이 붙는다(js/core/profile-load.js:206-207, js/tabs/settings/device-session.js:129-130). 익명 sid 기준이고 posthog.identify 0회라 '누가 누구를 데려왔나'는 ref 글자(표시 이름)로만 남는다.)
- [partial] 초대 이벤트 계측 peer_invite_{share,copy_link,view,accept} + invite_sent / invite_opened — js/tabs/comm/peer-invite.js:42-57 · invite_sent 발신처 1곳(grep) ('함께 목표' 방 흐름에만 붙어 있고 동반자 ref 링크·카드 공유·템플릿 공유는 invite_sent 를 쏘지 않는다. invite_signup 이벤트·K 계산 쿼리·대시보드 스크립트는 저장소에 0개(scripts 내 from('events') 0건).)
- [partial] 서버 /api/track 이벤트 수신(ALLOWED_EVENTS 6종: notification_*, funnel_*, utm_landing) — api/track.js:8-15 · 1108-1128 insert · sw.js:72-75(notification_clicked 만 POST) (클라이언트는 utm_landing·funnel_* 을 서버로 보내지 않고(grep 0) anon 키로 events 에 직접 넣는다. 서버 경로는 푸시 클릭 집계용으로만 실사용.)
- [partial] 내 기록 해시 딥링크(#record=rec_xxx → 기록 상세 모달) — js/tabs/records/template-record-detail.js:146-161 (본인 state.profile.records 에서만 찾는 내부용 딥링크. 공유·유입 용도 아님.)
- [partial] 카카오톡 인앱 브라우저 감지·탈출 안내(카카오로 공유된 링크가 인앱에서 열릴 때) — js/tabs/settings/inapp-landing.js:79 UA 감지 · 30-31 주소 복사 · index.html:3663 호출 (감지·주소 복사 분기까지 코드로 확인. 실기기 동작은 측정불가.)
- [doc_only] 초대 보상·리퍼럴 v1(/i/<code> 랜딩, 가입 없이 응원 1회, 양방향 보상, 가입 시 같은 방 자동 입장, K 계산 대시보드) — docs/growth/ourgoal-daily-roadmap.md:371-379 T036 · 코드 grep reward/referral/invited_by/추천인/초대 보상 0건(js/components-home-actions.js:47 exp_reward 는 아바타 XP, 무관) (완료 기준 '초대 링크 동작, K 계산 대시보드' 둘 다 코드에 없다.)
- [doc_only] K-factor·사이클타임 주간 리포트 자동화(T088) 및 R22 바이럴 계수 가이드 적용점 — docs/growth/ourgoal-daily-roadmap.md:946-949 · docs/growth/ourgoal-growth-knowledge-base.md:773-798 (쿼리·스크립트 실물 0.)

**없는 것**

- 초대 보상·양방향 리워드 루프: 코드 0건, 로드맵 T036 문서에만 있음
- 고유 초대 코드/추천인 id 와 가입 시 귀속: invited_by 류 컬럼·invite_signup 이벤트 0, ?ref= 는 표시 이름이며 수신 측 소비 코드 0(계측 제외)
- 바이럴 계수(K) 집계: events 테이블을 읽는 집계 스크립트·대시보드 0(scripts 내 from('events') 0건), posthog.identify 0회 — 초대→가입 전환을 셀 수 없음
- '함께 목표' 방 초대 링크의 실제 랜딩: type 덮어쓰기(peer-invite-text.js:28) + 서버 4종 한정(api/track.js:233-254) 으로 파라미터 0개 '/' 에 떨어짐(시뮬레이션 2/2) — 핵심 초대 루프가 죽어 있음
- 로그인 회원이 공유 링크를 열 때의 딥링크 처리 0(app-boot.js 세션 복원 경로에서 handleDeepLinkRouting 미호출)
- 공유 링크 랜딩에서 실제 데이터 조회 0: 초대자의 목표·기록·방 roster 를 Supabase 에서 읽어 비사용자에게 보여주는 경로 없음(모달은 URL 글자만)
- 초대 수락의 서버 기록 0: 참여·roster 가 수락자 localStorage 에만 남아 초대자가 수락 사실을 볼 수 없음(peer-invite.js:135-207, team-state.js:19-25)
- 초대 코드(INV-xxxx) 검증 0: 생성·URL 탑재만 있고 수락 시 검사 안 함
- 공개 프로필/공개 목표 페이지 0(/u/, ?u=, profile.html grep 0)
- 공유별 og:image 0: 카드 PNG 를 OG 이미지로 올리는 업로드·URL 없음, 서버 img 파라미터를 넘기는 클라이언트 0 — 미리보기는 항상 범용 1장
- 카카오 JS SDK(Kakao.Share) 미탑재(로드 태그 0) — '카카오 공유' 버튼들은 OS 공유 시트/클립보드
- PWA manifest share_target · 서비스워커 공유 수신 0(manifest.json·sw.js grep 0)
- 죽은 클릭 2건: 성소 리캡 '카카오톡 공유'(shareStreakKakao 미정의), 팀원 '인앱 초대장 발송'(토스트만)
- 카드 워터마크 주소 /share/<userId> 라우트 0 — 모든 공유 카드에 404 주소가 인쇄됨

## E3 동류 소통(코드)

**요약**: 소통 탭은 6개 서브탭(피드·팀·동반자·DM·마니또·공유)이 실제 Supabase(feed_posts·team_pings·team_ping_replies·content_reactions·helpful_reasons·users.companions·user_blocks)와 배선돼 있고, 응원해요/도움돼요/조언해요·댓글·닉네임 검색 동반자·1:1 DM(Realtime+Web Push)·신고·차단은 끝까지 연결돼 있다. 그러나 '같은 목표를 가진 사람을 찾는' 매칭 질의는 어디에도 없다: 피드는 전역 최신 50건을 클라이언트 정규식으로 카테고리 분류하고, 동반자는 닉네임 부분일치(ilike) 검색뿐이며, 마니또는 풀의 앞 3명을 순서대로 자르고(카테고리 필터 0), '같은 테마 공개'는 라벨만 있고 서버 칸·필터가 없다. 가상 페르소나는 SIM_PERSONAS=[]로 비워졌지만 AI 사진인증 3건·마니또 AI 1명·팀 톡방 시드 대화 3건·예시 팀 11개·mock 크리에이터 템플릿 3건·프로필 모달 하드코딩 streak 7/Lv 2 등 가짜 데이터·허수가 남아 있다. 친구 0명·유저 0명 신규 가입자가 보는 것은 "아직 공유된 실천이 없어요"·"아직 등록된 동반자가 없어요"·"아직 개설된 실제 팀이 없어요"·"주고받은 1:1 대화 내역이 없습니다"뿐이고, 바이럴 고리(?ref= 초대 링크)는 생성만 되고 랜딩에서 읽히지 않는다.


**콜드스타트 판정**: 친구 0명·다른 유저 0명으로 가입한 사람이 소통 탭에서 실제로 받는 것은 '없음'의 문구 네 개다: 피드는 "같은 목표를 향해 가는 사람들 · 아직 공유된 실천이 없어요"(feed-list.js:118-120, 본인 공개 목표 카드만), 동반자는 "아직 등록된 동반자가 없어요"(team-companions.js:101), DM은 "주고받은 1:1 대화 내역이 없습니다"(team-dm-room.js:501), 팀은 "아직 개설된 실제 팀이 없어요" 아래 가짜 숫자가 박힌 예시 팀 11개가 기본 펼침으로 깔린다(shared-groups.js:82,120). 마니또를 시작하면 실유저 풀이 비어 AI 짝 1명(게스트는 3명)이 생성돼 응원을 '보내는' 경험은 되지만 답은 돌아오지 않고(manito-real.js:107,235), 레이더·홈 응원은 토스트만 띄운다. 즉 코드가 제공하는 유일한 '진실된 타인 데이터' 경로는 다른 실유저가 먼저 feed_posts에 글을 쓰고 그것을 전역 50건으로 받아보는 것뿐이며, 그 사람을 나와 같은 목표·테마로 골라 보여주는 질의·테이블·알림·초대 귀속은 존재하지 않는다 — 콜드스타트 상태에서 유입을 붙잡거나 재방문을 끌어낼 데이터 장치는 현재 0이다.


**측정 수치**

- MOCK_GROUPS(예시 팀) isMock:true 항목 수 = 11  ·  출처: awk 'NR>=5875 && NR<=6230' index.html | grep -c isMock:true
- SIM_PERSONAS 배열 길이(가상 페르소나) = 0  ·  출처: js/tabs/comm/sample-data.js:330
- AI_PHOTO_VERIFICATIONS 하드코딩 건수 = 3  ·  출처: js/tabs/comm/feed-list.js:165-209
- CREATOR_TEMPLATES(mock 크리에이터) 건수 / EXTERNAL_DATA(mock 외부기록) 건수 = 3 / 5  ·  출처: js/tabs/comm/sample-data.js:349-374, :340-346
- 팀 톡방 시드 가짜 메시지 수 = 3  ·  출처: js/team-chat.js:30-35
- AI 식별 잔재: AI_ID_PREFIXES / LOCAL_SAMPLE_USER_IDS / KNOWN_AI_BOT_NAMES = 8 / 6 / 10  ·  출처: js/team-invite-comm.js:269-271
- 피드 카테고리 칩 수 = 19  ·  출처: js/tabs/comm/feed-list.js:122-142
- Supabase 테이블 참조 횟수(js+index.html+api): team_pings / feed_posts / team_ping_replies / users / user_blocks / team_comments = 23 / 7 / 7 / 14 / 2 / 4  ·  출처: grep -o ".from('…')" 집계
- 클라이언트가 부르는 RPC 이름 수(고유) / docs/sql 에 정의된 함수 수(고유) = 14 / 24  ·  출처: grep rpc( 집계; grep 'create or replace function' docs/sql/*.sql
- count_same_theme_checkins_today 호출부(js·index.html·api) = 0  ·  출처: grep -rn count_same_theme (scripts/smoke-test.js:2437 SQL 문자열 검사만)
- ?ref= 초대 파라미터 처리 코드 = 0  ·  출처: grep get('ref') js/viral-sharing.js js/core/*.js index.html
- cheersReceived 갱신 코드(표시 제외) = 0  ·  출처: grep -rn cheersReceived js index.html | grep -v render.js
- E3 코드 줄 수: js/tabs/comm/*.js / js/team-*.js / 기타(reactions·helpful·top-helpful·peer-radar·notify·viral·moderation) = 4912 / 7420 / 1978  ·  출처: wc -l
- index.html 줄 수(인라인 덩어리) = 6272  ·  출처: wc -l index.html
- js 안 is_ai 참조 수 / index.html 안 = 39 / 0  ·  출처: grep -c is_ai
- E3 관련 docs/sql 파일 수(반응·이유·상단슬롯·team_pings·companions·검색·DM·신고·차단·테마수·hidden) = 21  ·  출처: ls docs/sql | grep -E … | wc -l
- E3 관련 시험 파일 수 / 전체 tests 파일 수 = 27 / 115  ·  출처: ls tests | grep -E 'comm|feed|dm-|manito|companion|reaction|team|…' | wc -l
- 세포 신고서(modules.json) comm/* 세포 수 / team-* 세포 수 / 전체 = 25 / 17 / 349  ·  출처: node 집계 docs/architecture/modules.json
- 운영 Supabase 실제 유저 수·feed_posts 행 수·team_pings 행 수 = null  ·  출처: 측정불가 — 읽기 전용 조사, 운영 DB 접근 안 함(참고: dm-rls-step1.sql:6 '2026-10-04 실측 anon 키로 team_pings 39행·team_ping_replies 56행')

**있는 것(배선 판정)**

- [partial] 소통 탭 뼈대: 6 서브탭(피드·팀·동반자·DM·마니또·공유) + 요약 카드(팀 n개·동반자 n명·응원 n개) — js/tabs/comm/render.js:150-196 서브탭 목록·분기; index.html:1243-1281 #screen-comm·#commHero*·#commBody; render.js:156-157 cheersReceived 표시 (cheersReceived 를 갱신하는 코드 0(grep) → '응원 n개' 는 항상 0개. 팀 수는 profile.groups, 동반자 수는 companions 길이)
- [full] 피드 목록 불러오기·실시간(feed_posts 전역 최신 50건 + INSERT/UPDATE Realtime) — js/tabs/comm/feed-posts-sync.js:219-224 select * order created_at limit 50; :232-243 channel feed_posts_channel; docs/sql/RUN-ME-2026-09-08.sql:42-62 feed_posts 테이블·RLS(select authenticated, insert/delete own) (테마·관심사·지역 필터 없이 전 유저 글 50건. 게스트(anon)는 RLS 로 0건)
- [full] (a) 신규 유저 피드 빈 상태 문구 — js/tabs/comm/feed-list.js:118-120 stageLabel '같은 목표를 향해 가는 사람들 · 아직 공유된 실천이 없어요'; :226 emptyState '표시할 소통 글이 없어요 / 해당 필터에 등록된 피드가 없습니다. 첫 실천을 공유해보세요!' (realCount==0 일 때 본인 공개 목표(me_ 항목, feed-list.js:62-68)만 카드로 보임. 다른 유저 글 0이면 그 외 내용 없음)
- [full] 반응 3종 버튼(응원해요·도움돼요·조언해요) 서버 저장·집계 — js/reactions.js:14-19 TYPES; :162-164 rpc count_content_reactions·my_content_reactions·list_content_advice; :229 react_content; :257 unreact_content; :348 moderate_advice; docs/sql/2026-09-12-content-reactions.sql:15-38 테이블·unique, :53-116 react_content(봇·sim_·자기글 차단), :172-183 집계 (서버 미적용 시 settings.feedReactionsV2 기기 폴백(reactions.js:57-63). 봇 글(is_ai·sim_)은 버튼 비활성(:92-101))
- [shell] 별로예요(poor) 반응 — js/reactions.js:95 buttonsHtml 이 TYPES 에서 'poor' 를 걸러 버튼을 그리지 않음; :269-294 이유 시트(openPoorSheet)·:375 처리기는 존재; data-rx="poor" 생성 코드 0(grep js·index.html) (SQL 에는 poor 반응·poor_reason_breakdown 까지 있으나 화면 진입점이 없다)
- [full] 도움돼요 이유(helpful_reasons) + 글쓴이 요약 + 크레딧 적립 — js/helpful-reason.js:82 rpc save_helpful_reason; :187 helpful_reason_summary; docs/sql/2026-09-12-helpful-reason.sql:149-162 테이블, :177-257 품질 게이트·award_credit (크레딧은 credit_settings.enabled=false 기본 → 이유만 저장되고 적립 0(helpful-reason.sql:122-123))
- [full] 카테고리별 '도움이 된 글' 상단 슬롯(top_helpful_posts) — js/top-helpful.js:56 rpc top_helpful_posts; js/tabs/comm/feed-list.js:150-153 arrange; docs/sql/2026-09-12-top-helpful.sql:347-383 최근 30일 도움돼요 상위 작성자 글 1개 ('전체' 카테고리에서는 슬롯 없음(SQL:334). 실데이터 없으면 0행이라 신규 상태에선 보이지 않음)
- [full] 피드 댓글(team_pings 재사용, group_id='feed') 등록·불러오기·삭제·Realtime — js/tabs/comm/feed-comments.js:28 select team_pings eq group_id feed; :133-151 insert; js/tabs/comm/feed-list.js:410-421 delete; js/tabs/comm/feed-posts-sync.js:245-264 INSERT 구독; docs/sql/2026-09-13-team-pings.sql:8-24 테이블 (RLS 가 select using(true)·insert with check(true)(team-pings.sql:53-62) → 운영에서 sender_id 위조 가능. 좁히는 2단계 정책은 '운영 미적용'(docs/sql/2026-10-04-dm-rls-step2.sql:2))
- [shell] sim_ 페르소나 글 전용 AI 댓글 시드 잔재 — js/tabs/comm/feed-comments.js:73-90 postId 가 sim_p01·p02·p03·p21 이면 박준서·김서연… is_ai 댓글 하드코딩 (SIM_PERSONAS 가 비어 sim_ 글이 안 만들어져 도달 불가하지만 코드는 남아 있음)
- [partial] 피드 카테고리 칩 19종 + 클라이언트 정규식 분류 — js/tabs/comm/feed-list.js:122-142 categories 19개; js/core/virtual-user-helpers.js:61-89 filterFeedByCategory 정규식 (서버 질의가 아니라 받아온 50건을 클라이언트에서 문구 정규식으로 거름. extra.category 가 있으면 우선)
- [shell] '같은 테마 공개'(visibility=theme) 노출 범위 — js/tabs/comm/feed-list.js:255 vis==='theme' 이면 🏷️ 아이콘만; js/core/confetti.js:52 토스트 '같은 테마 러너에게만 공유돼요'; docs/sql/RUN-ME-2026-09-08.sql:42-52 feed_posts 에 visibility 칸 없음; feed-posts-sync.js:222 전역 조회 (사용자에게 '같은 테마에게만' 이라고 말하지만 서버에 범위 칸·필터가 없어 전원에게 보임(본인 goals.visibility 는 본인 카드 표시용))
- [doc_only] 오늘 같은 테마로 기록한 실유저 수 RPC(count_same_theme_checkins_today) — docs/sql/2026-09-12-count-same-theme-checkins.sql:262-290 함수 정의; js·index.html·api 호출부 0(grep count_same_theme → scripts/smoke-test.js:2437 SQL 문자열 검사만) ('본질 ③ 동류 발견 배지' 의 데이터 원천으로 적혀 있으나 화면 코드 없음)
- [full] (c) 동반자 찾기 = 닉네임 부분일치 검색(/api/track search_users → RPC 폴백) — js/team-companion-search.js:137-141 fetch /api/track action search_users; :168 rpc search_users_by_nickname; api/track.js:293-327 users.or(display_name.ilike / username.ilike).limit(20); docs/sql/2026-09-16-search-users-rpc.sql:311-338 (질의 조건은 닉네임 ilike 뿐 — 목표·관심사·테마·지역 조건 0. users RLS 는 본인 행만(search-users-rpc.sql:300-308)이라 둘러보기 불가)
- [full] 동반자 추가(일방 추가, 상호 승인 없음)·영속화 — js/tabs/comm/feed-list.js:450-467 comps.unshift → saveProfile → persistCompanions; js/team-invite-comm.js:423-450 localStorage 백업 + /api/track sync_companions + users.companions update; docs/sql/2026-09-16-users-companions-column.sql:107; js/tabs/comm/dm-ledger.js:34-43 Bearer 토큰 ('동반자 신청' 문구(team-companions.js:89)지만 상대 승인 단계 없음. 팔로우 그래프 테이블 없음(본인 행 jsonb 스냅샷))
- [full] (a) 동반자 탭 빈 상태 문구 — js/team-companions.js:98-103 '아직 등록된 동반자가 없어요 / 위의 닉네임 검색을 통해 실제 사용자를 찾고 동반자를 맺어보세요!' (추천·탐색 없이 검색창만 제공)
- [shell] 동반자 초대 링크(?ref=닉네임) 복사 — js/team-companions.js:192 'https://ourgoal-app.vercel.app?ref=' + 닉네임; js/viral-sharing.js:267-300 handleDeepLinkRouting 은 type·id·invite_group·feed 만 읽음, ref 처리 0(grep) (복사·토스트는 되지만 받은 사람이 열어도 아무 일도 일어나지 않음(리퍼럴 귀속 0))
- [doc_only] 팔로우/팔로워 — js·docs/sql 에 follow 테이블·RPC 0(grep); js/core/profile-load.js:113·app-boot.js:133 visibility 'followers' 를 'team' 으로 이관; js/team-dm-room.js:238-245 '맞추가' 는 동반자 추가 (팔로우 개념은 코드에 없고 과거 값 이관 코드만 남음)
- [full] 1:1 DM 보내기·불러오기·수신함·Realtime·읽음·Web Push — js/tabs/comm/dm-ledger.js:66-76 team_ping_replies insert(없는 열 빼고 재시도); js/team-dm-room.js:112-116 load limit 50, :357-372 부모 team_pings dm_direct upsert, :396-407 /api/push-dispatch; js/team-dm-inbox.js:71-75 receiver_id 기준 수신함; docs/sql/2026-10-04-dm-read-columns.sql og_dm_mark; docs/sql/2026-09-05-push-subscriptions.sql:6-15 (RLS: team_ping_replies select 는 sender/receiver/auth.uid() null/receiver_id=''(team-pings.sql:65-72), insert check(true). 2단계 좁히기는 운영 미적용(dm-rls-step2.sql:2, README [손 필요]))
- [full] (a) DM 탭 빈 상태 문구 — js/team-dm-room.js:460 '아직 연결된 실제 팀 동료가 없습니다…'; :501 '주고받은 1:1 대화 내역이 없습니다. 팀원이나 동반자에게 첫 인사를 건네보세요!'; :225 '아직 주고받은 메시지가 없습니다'
- [full] 게스트 소프트 게이트(DM·동반자는 로그인 필요) — js/team-invite-comm.js:133-162 showGuestSoftAuthGate 모달
- [partial] 팀(그룹) 목록 = 예시 팀 11개(MOCK_GROUPS isMock) + 서버 공유 팀(team_pings shared_groups) — index.html:5875-6018 MOCK_GROUPS 11건 isMock:true; js/tabs/comm/shared-groups.js:29-34 select team_pings group_id shared_groups limit 50, :569-591 새 팀 insert; js/tabs/goals/team-level-goals.js:21-27 isMockGroup (팀 참여 상태는 profile.settings.groupState(js/tabs/goals/team-state.js:20-25)·화면 문구 '참여 기록은 이 기기에 저장돼요'(shared-groups.js:164). 서버에 팀 구성원 정보 없음(dm-rls-step2.sql:26))
- [full] (a) 팀 탭 빈 상태 + 예시 팀 아코디언 기본 열림 — js/tabs/comm/shared-groups.js:120-123 '아직 개설된 실제 팀이 없어요 / 상단의 [+ 새 팀 개설하기]…'; :82 mockSectionOpen !== false(기본 펼침); :89 배지 '💡 이런 팀을 만들 수 있어요 (활용 예시)' (신규 유저가 보는 '팀' 은 사실상 예시 11개(members·progress·verifications 허수 포함, index.html:5876-5905))
- [partial] 팀 톡방(team_pings target_type='team_chat') + 가짜 시드 대화 3건 — js/team-chat.js:115-121 서버 로드, :214-227 insert, :145-152 Realtime; :30-35 chatMessages 기본값 '민지 (러너)·준호 (개발)·소연 (디자인)' 하드코딩; :125 res.data.length 있을 때만 덮어씀 (서버 메시지 0건이면 가짜 대화 3건이 그대로 보인다(ES-332 잔재))
- [partial] 팀원 영입·초대(닉네임 검색 영입, 카카오/SMS/링크 초대, 초대 수락) — js/team-recruit.js:268 rpc search_users_by_nickname, :517 team_pings insert; js/tabs/comm/peer-invite.js:60-90 카카오 공유·링크 복사, :135-197 acceptPeerInvite → MOCK_GROUPS 로컬 추가 + groupState; :51-53 track invite_sent/opened (초대 수락이 서버 팀 구성원 행을 만들지 않고 기기 로컬 상태만 바꿈)
- [partial] (c) 마니또 매칭 로직 실제 질의 — js/tabs/comm/manito-real.js:39-42 team_pings eq group_id manito_pool neq 본인 limit 20; :108-111 REAL_MANITO_PARTNERS_CACHE.slice(0,3) 순서대로; :207-209 화면 문구 '내 관심 카테고리 기준으로 3명이 배정돼요'; :245-273 풀 등록 upsert(major·goalTitle·streak·pct·logs) (풀에 major(카테고리)를 저장하지만 짝 고를 때 카테고리 비교 0 — 문구와 코드 불일치. 유저 0명이면 짝 0)
- [partial] 마니또 AI 동반자 1명 콜드스타트 보충(실유저 <20) — js/tabs/comm/manito-real.js:105-107 maxAiCount = realCount>=20 ? 0 : 1; :113-141 'mn_'+major id, genAnonName, 시드 로그 문구 5종, is_ai:true; :235 게스트 '게스트 모드로 AI 마니또 3명이 배정됐어요' (가상 유저 배열은 아니지만 실행 중 생성되는 가짜 짝 1명(게스트 3명)이 남아 있음. pct·streak 는 null 처리(ES-348))
- [full] 마니또 응원 스탬프 발송·받은 응원함 — js/tabs/comm/manito-basics.js:69-87 team_pings insert group_id 'manito' receiver_id pid; js/tabs/comm/manito-real.js:76-87 inbox select receiver_id 본인; :196-199 가입 전에도 받은 응원 표시 (AI 짝(mn_)에게 보낸 스탬프는 서버 행만 쌓이고 받을 사람 없음)
- [partial] 러닝메이트 레이더(소통 상단) + 응원 버튼 — js/sanctuary-peer-radar.js:33-93 companions + 팀원 풀만 집계; :155-158 0명 '함께 달릴 동반자를 찾아보세요 🤝 + 동반자 찾기'; :166-171 cheerPost = 토스트 '(+2P)' 만, 서버 호출 0 ('응원 보냈습니다 (+2P)' 는 저장되지 않는 껍데기 피드백)
- [shell] 홈 동반자 페이스메이커 위젯·응원 보내기 — js/tabs/comm/crew-pacing.js:19-50 activeCount 0 → '오늘의 1호 완주자가 되어보세요!'; :242-248 nudgeCrewMates = 햅틱+컨페티+토스트만(서버 호출 0)
- [partial] 알림: 받은 응원 띠 + 전역 알림 엔진 + Web Push(DM) — js/tabs/comm/cheer-notify.js:26-50 피드 cheers_count 합·마니또 inbox 를 settings.social 과 비교; js/notify-engine.js:155-227 dispatchGlobalNotification·settings.unreadNotifications(최대 50), :260-270 SW showNotification; js/team-dm-room.js:396-407 push-dispatch; api/push-dispatch.js:59 push_dispatch_token (서버 알림 테이블 없음 — 앱에 들어와 계산할 때만 띠가 뜸. 푸시는 DM·체크인 시각만)
- [shell] 첫 체크인 가상 응원(first-cheer)·게시 후 가짜 봇 답글 — js/tabs/comm/first-cheer.js:81-93 SIM_PERSONAS[0] 없으면 return; js/tabs/records/share-to-feed.js:19-22 addSimulatedCheerAndReplyToPost → return (ES-332 로 무력화됐으나 호출부(checkin-feedback.js:429, share-to-feed.js:748)·함수는 남음)
- [partial] (b) 가상 페르소나 삭제 상태와 잔재 목록 — js/tabs/comm/sample-data.js:329-332 SIM_PERSONAS=[]·MOCK_PEOPLE 동일; js/tabs/comm/feed-list.js:111-116 피드 봇 주입 배제, 그러나 :165-209 AI_PHOTO_VERIFICATIONS 3건('민혁 (AI 가이드)' 등 unsplash 사진) + :213-219 사진인증 필터에서 virtualCheerEnabled&&realCount<=20 이면 1건 주입; js/tabs/settings/app-defaults.js:22 virtualCheerEnabled:false 기본; index.html:1699-1705 설정 토글 '20대 가상 유저 페르소나가 첫 체크인을 응원하고 피드에 함께 참여해요'; sample-data.js:327 AI_DISCLOSURE_NOTICE; :349-374 CREATOR_TEMPLATES mock 크리에이터 3건 users:1240/612/3180; :340-346 EXTERNAL_DATA 5건; js/team-invite-comm.js:269-271 AI_ID_PREFIXES 8·LOCAL_SAMPLE_USER_IDS 6·KNOWN_AI_BOT_NAMES 10 (기본값이 꺼져 있어 보통은 안 보이지만 토글을 켜면 AI 사진인증 1건이 피드에 들어감. mock 크리에이터 템플릿은 team-templates.js:25·template-encyclopedia.js:356 에서 실제 노출)
- [partial] 피드 프로필 모달 하드코딩 수치(streak 7·Lv 2) — js/tabs/comm/feed-list.js:443-444·468-469 userObj streak:7, level:2 고정; js/team-profile.js:49-50 'Lv.'+level·'🔥 n일 연속 실천' 표시; :64 'n일 연속 달성 중' (실유저 글의 작성자 프로필을 열면 측정값이 아닌 7일·Lv.2 가 보인다(가짜 수치). ES-348 '가짜 수치 정직화' 이후에도 잔존)
- [full] 신고·차단 — js/tabs/comm/feed-list.js:595-626 rpc report_content(폴백 로컬 카운트); js/tabs/comm/user-blocks.js:63 user_blocks insert, :81 delete, :23-39 filterHidden·filterBlockedPosts; docs/sql/2026-09-10-ugc-safety-reports.sql:2-14; docs/sql/2026-09-08-hidden-rls.sql:99-105
- [full] 피드 글 원탭 소셜(동반자 추가·DM·팀 영입·공유) — js/tabs/comm/feed-list.js:281-284 버튼; :450-516 핸들러(ensureDefaultCompanions·activeDmPeer·openScoutToTeamModal·openFeedShareModal) (유저 글이 0이면 버튼도 0)
- [full] 공유 탭 외부 SNS 카드 + 딥링크 게스트 뷰어(바이럴 고리) — js/tabs/comm/goal-certificate-share.js:143-151 카드 제작·이미지 저장, :255-270 navigator.share; js/viral-sharing.js:23-45 shareContent /share?type=…, :84-265 피드·템플릿·완주 게스트 뷰어, :267-300 딥링크 라우팅 (공유 링크는 열람용. 가입 귀속·초대 보상·추천인 기록 0)
- [partial] 템플릿 복제 크레딧(record_template_copy·template_copy_counts) — js/template-credit.js:68 rpc record_template_copy, :80 template_copy_counts; docs/sql/RUN-ME-2026-09-12-kf.sql:17-21 credit enabled=false 기본 (복제 수는 실데이터만 표시, 적립은 꺼짐)
- [partial] 테마·관심사·지역 기반 팀 필터('내 관심'·'근처') — js/tabs/comm/shared-groups.js:66-78 filter near/mine — profile.interests·region 과 g.topic·g.region 비교(클라이언트) (대상이 MOCK_GROUPS 배열(예시 11 + 서버 공유 팀)이라 신규 상태에선 예시 팀만 걸러짐. 사람 탐색에는 관심사 질의 없음)
- [doc_only] DM·댓글·마니또 표 RLS 강화(anon 차단 1단계·행 종류별 2단계) — docs/sql/2026-10-04-dm-rls-step1.sql:43-50; docs/sql/2026-10-04-dm-rls-step2.sql:1-2 '아직 운영 미적용'; docs/sql/2026-10-04-dm-rls-README.md:1-3 [손 필요]; dev_log.md:5895 ES-381 '운영 미적용' (PGlite 시험(52/52)만 있고 운영 적용 기록 없음 → 현재 운영 team_pings 는 select/insert using(true))
- [full] E3 시험·세포 신고서 범위 — tests/ 115개 중 comm|feed|dm|manito|companion|reaction|team 이름 27개(ls); docs/architecture/modules.json cells comm/* 25개·team-* 17개(node 집계) (대부분 부품·문자열 시험. 실계정 2개 시나리오(RA-COMM-03·04A·04B)는 dev_log.md:5875·5894 에 기록)

**없는 것**

- 비슷한 목표·테마·관심사로 사람을 찾는 서버 질의가 0 — 동반자는 닉네임 ilike 검색뿐(api/track.js:300-302), 마니또는 풀 앞 3명 slice(manito-real.js:109), 피드는 전역 50건(feed-posts-sync.js:222). '같은 목표' 매칭 테이블·RPC·인덱스 없음
- '같은 테마 공개' 범위가 서버에 없다(feed_posts 에 visibility 칸 없음, RUN-ME-2026-09-08.sql:42-52) — 사용자에게 '같은 테마 러너에게만 공유돼요'(confetti.js:52)라고 말하지만 전원에게 노출
- 유저 0명 신규 가입자가 피드·동반자·DM·팀에서 보는 것은 빈 상태 문구 4종 + 예시 팀 11개뿐 — 첫 세션에 '진실된 타인 데이터' 를 체험할 경로가 없다
- 팔로우/팔로워 그래프·상호 승인·추천 사용자 목록 없음(users RLS 본인 행만, search-users-rpc.sql:300-308 → 둘러보기 불가)
- 바이럴 귀속 고리 없음: ?ref= 초대 링크는 생성만(team-companions.js:192) 하고 랜딩에서 읽지 않음, 추천인·초대 보상·가입 귀속 테이블 0
- 오늘 같은 테마 실유저 수(count_same_theme_checkins_today)는 SQL 만 있고 화면 호출 0 — '동류 발견 배지' 미구현
- 가짜 데이터 잔재: AI 사진인증 3건(feed-list.js:165-209), 팀 톡방 시드 대화 3건(team-chat.js:30-35), 마니또 AI 짝 1명/게스트 3명(manito-real.js:107,235), mock 크리에이터 템플릿 3건(users 1240/612/3180 허수, sample-data.js:349-374), EXTERNAL_DATA 5건, 프로필 모달 streak 7·Lv 2 고정(feed-list.js:443-444)
- 별로예요 반응은 서버·시트까지 있으나 버튼이 렌더되지 않음(reactions.js:95) — 피드백 품질 신호 수집 경로 끊김
- 팀 구성원·참여 상태가 서버에 없다(profile.settings.groupState, team-state.js:20-25; '참여 기록은 이 기기에 저장돼요') — 팀 단위 동류 데이터가 기기 밖으로 못 나감
- 서버 알림 테이블 없음 — 받은 응원·댓글은 앱에 들어와 계산할 때만 띠(cheer-notify.js:26-38). 재방문 유도 푸시는 DM·체크인 시각뿐
- DM·댓글·마니또 표 RLS 가 select/insert using(true)(team-pings.sql:53-62) 상태로 운영 — 2단계 좁히기는 [손 필요] 미적용(dm-rls-step2.sql:2)
- 소통 요약 카드 '응원 n개' 가 항상 0(cheersReceived 갱신 코드 0), 레이더 응원(+2P)·홈 응원 보내기는 토스트만(sanctuary-peer-radar.js:166-171, crew-pacing.js:242-248)

## 콘텐츠·데이터 자산(유저 0명일 때 경험 가능한 것)

**요약**: 유저 0명 상태에서 신규 1명이 실제로 만질 수 있는 "진짜" 자산은 (가) 60종 전문가 목표 템플릿(4마일스톤×3할일=720 할일, 1초 이식→목표 생성까지 배선 완료), (나) Gemini 기반 AI 피드백·오늘의 미션·목표 템플릿 생성(서버 env 키가 있을 때만 진짜 AI, 없으면 사용자에게 알리지 않고 정형문구로 퇴화), (다) 320종 MBTI 텍스트 페르소나 도감(이미지 자산 0, 이모지+색상), (라) 통계 탭 9개 도메인 1년치 샘플(isSample 표기)뿐이다. "오늘의 질문" 질문 은행은 코드에 존재하지 않고(#todayMissionCard는 목표가 있어야만 AI 미션을 채우는 카드), 도움돼요 사유·상단 도움글·템플릿 복제 원장은 코드·SQL은 있으나 다른 유저가 있어야 값이 생기는 구조다. 반면 백과사전의 "실사용자 템플릿"(작성자·복제 142~412회·응원 54~91), 55개 예시 팀(참여 6명·달성률 65%), "실제 우수 사용사례" 6인은 전부 하드코딩된 가짜 수치라 투자자가 지적한 '진실된 데이터'와 정면으로 충돌한다. docs/knowledge 60선·15장 지식기반·NotebookLM 소스는 앱 어디에서도 연결되지 않아(참조 0) 사용자 노출 경로가 없고, AI 피드백 결과는 서버 checkins meta에 저장되지 않아 기기를 바꾸면 사라진다.


**콜드스타트 판정**: 유저 0명·친구 0명인 1일차 신규 유저가 '진실되고 유익하다'고 느낄 수 있는 실물은 60종 전문가 목표 템플릿(4단계×3할일, 전문가 KPI·기록열 포함, 1초 이식 배선 완료)과 — 운영 Gemini 키가 살아 있을 때에 한해 — 내 글을 읽고 답하는 AI 피드백·오늘의 미션·목표 템플릿 생성, 그리고 통계 탭에 넣어볼 수 있는 9도메인 1년치 샘플뿐이다. 그 밖에 화면을 채우는 것(실사용자 템플릿의 작성자·복제·응원 수, 55개 예시 팀의 참여 인원·달성률, '실제 우수 사용사례' 6인, Strava 샘플)은 전부 하드코딩된 허구라 투자자가 말한 '진실된 데이터'의 반대편에 있고, 도움돼요·상단 도움글·복제 원장처럼 진실하게 설계된 것들은 타인이 있어야만 값이 생겨 1일차에는 빈 화면이다. 질문 은행은 없고, 템플릿은 오늘 당장 할 일 단위가 없으며, AI 결과는 서버에 쌓이지 않고 기기 로컬에만 남으며, 60선 전문·15장 가이드 같은 지식 콘텐츠는 앱에서 링크조차 되지 않는다. 결론: 지금 비어 있는 것은 '매일 돌아올 이유가 되는 진짜 데이터'(고정 질문/회고 프롬프트, 일일 실천 단위 콘텐츠, 서버에 축적되는 내 기록·피드백, 가짜가 아닌 사회적 증거)이며, 템플릿·AI 인프라 자체는 이미 쓸 수 있는 상태다.


**측정 수치**

- 목표 템플릿 개수(카테고리별) = 60 (health 10·study 10·career 10·hobby 10·mind 10·relation 10)  ·  출처: node -e "const t=require('./js/goal-templates-data.js');console.log(t.list.length)" · tests/goal-templates-data-split.test.js → 9 passed
- 템플릿당 마일스톤·할일·기록열·기간 = ms 4/4/4(min/max/avg, 총 240) · tasks 12/12(총 720) · columns 7~9 · weeks 1~52 · desc '...' 잘림 60/60 · routines 필드 0  ·  출처: node -e 스크립트(js/goal-templates-data.js list 순회)
- 서버 전문가 매칭 규칙 수·일반어 프로브 = TEMPLATE_MAP 60 · MATCH_RULES 60 · 프로브 9건 중 null 8건('3대 운동'만 매칭)  ·  출처: node -e "require('./js/goal-templates-registry.js').findExpertTemplate(...)"
- '오늘의 질문' 질문 은행 항목 수 = 0 (질문 배열·파일 없음; #todayMissionCard는 AI 미션 카드)  ·  출처: grep -rn "질문" js/ · index.html:664-665 · js/tabs/home/today-mission.js
- 320종 아바타 데이터·이미지 자산 = 페르소나 320(16 파일×20) · 이미지 자산 0 · BODY_THEMES_77 = 77  ·  출처: node -e (js/data/avatar-personas 합계) · node tests/avatar-personas-split.test.js → 11 passed · find -iname '*.png|svg|webp|jpg' | grep -i avatar → scratch 2건만
- AI 피드백 폴백 카탈로그 문구 수 = 30 (study·workout·business·mind·daily × 6)  ·  출처: node -e (js/tabs/records/ai-feedback-catalog.js PREMIUM_FEEDBACK_CATALOG)
- 하드코딩 '실사용자' 콘텐츠 수 = PERSONAL_TEMPLATES_REAL 6 · REAL_USER_TEMPLATES 6(할일 72, likes 54~91) · ROUTINE_REAL 4 · TEAM_REAL 4 · ROUTINE_AI 6 · TEAM_AI 6 · CREATOR_TEMPLATES 3 · MOCK_GROUPS 55 · TAB_SHOWCASES 6  ·  출처: node -e (template-encyclopedia*.js 키트 로드) · index.html:5875 정규식 카운트 · js/tab-guides.js
- 통계 샘플 도메인 수 = 9 도메인(+52주 파워리프팅·1920년대 역도 2종)  ·  출처: grep -ho "domainKey === '...'" js/stats-samples.js js/stats-sample-*.js | sort -u
- 외부 연동 샘플 건수 / 실제 연동 수 = 5 / 0  ·  출처: js/tabs/comm/sample-data.js:35-41 · js/tabs/records/external-import.js:38
- 무인증 AI 엔드포인트 수 = 7 / 12 (feedback·goalagent·goalstatus·goaltemplate·nextaction·promptgen·todaymission auth 참조 0)  ·  출처: for f in api/*.js; grep -c 'authorization|authenticateCaller|getUser|Bearer'
- 클라이언트 Gemini 키가 게이트웨이 경유 엔드포인트에서 쓰이는 횟수 = 0 (6개 파일 모두 geminiApiKey 선언 1회뿐, gateway opts.apiKey 0건)  ·  출처: grep -c geminiApiKey api/{feedback,todaymission,goalstatus,nextaction,goalagent,goaltemplate}.js · grep opts.apiKey api/_lib/gemini-gateway.js
- 도움돼요 사유 태그·글자 제한 = 태그 5 · 최소 10자 · 최대 300자 · 테이블 helpful_reasons(user·target unique)  ·  출처: js/helpful-reason.js:18-26 · docs/sql/2026-09-12-helpful-reason.sql:38-52
- helpful_reasons·template_copies 운영 DB 적용 여부 = 측정불가 (reports/ 내 적용 기록 0건)  ·  출처: grep -rn helpful_reason reports/
- 지식 문서 분량과 앱 내 링크 수 = docs/knowledge 1파일 1982줄(ID 60/60 코드와 일치) · notebooklm_sources 5파일 3114줄 · plain_guide 1461줄 · 15_chapters 1507줄 · 앱 내 참조 0  ·  출처: wc -l · node -e(ID 교집합) · grep docs/knowledge|notebooklm|plain_guide|15_chapters index.html js/ vercel.json sw.js
- 피드 가상 댓글·가상 페르소나 = 가상 댓글 5건(대상 글 0건이라 미표시) · SIM_PERSONAS 0 · sim/personas.json 200(테스트 전용)  ·  출처: js/tabs/comm/feed-comments.js:73-93 · js/tabs/comm/sample-data.js:28-29 · node -e(sim/personas.json length)
- 운영 Gemini 키 존재 여부 = 측정불가 (저장소에는 env 이름만: GEMINI_API_KEY·_FALLBACK·_3·_4)  ·  출처: api/_lib/gemini-gateway.js:59-66
- index.html 크기 = 6272줄  ·  출처: wc -l index.html

**있는 것(배선 판정)**

- [full] 60종 전문가 목표 템플릿 데이터(6 카테고리×10) — js/goal-templates-data.js:19-43 조립자 · js/data/goal-templates/{health,study,career,hobby,mind,relation}.js(595~603줄) · 측정: node -e "console.log(require('./js/goal-templates-data.js').list.length)" → 60 (필드 id·tplId·category·categoryMinor·title·desc·weeks(1~52)·targetPersona·kpi·badge·expertPoint·columns(7~9)·ms. ms는 전 템플릿 4개, tasks 각 3개(총 240 마일스톤/720 할일). 루틴·일일 실천 필드는 없음(routines 키 0). desc는 60/60 모두 '...'로 잘린 요약문이고 전문은 expertPoint에만 있음. 예시1 tpl_hlt_01 '3대 운동 500kg 16주 주기화': 1RM 측정→5x5 전환→90%+ 피킹→테이퍼링, KPI '합산 1RM', 기록열 7개(중량·RPE·휴식 등). 예시2 tpl_hob_06 '미러리스 M모드+라이트룸': 노출3요소→빛/구도→RAW 보정→포토북 20선, 기록열 9개(조리개·셔터·ISO 등).)
- [full] 템플릿 백과사전 화면·모달(둘러보기→1초 이식→목표 생성) — js/tabs/goals/template-encyclopedia.js:353-389(60종 카드 렌더) · :591-606(data-subtpl-clone→L.cloneTemplate) · js/creator-templates-legacy.js:44-66(cloneTemplate: goal 객체 생성·saveProfile·toast·recordCopy) · 진입 버튼 js/tabs/goals/personal-goals-guide.js:63, js/tabs/goals/team-goal-prompt.js:28 (마크업+리스너+로직+토스트 4위1체. 저장은 js/core/home-cockpit.js:154-224 saveProfile → localStorage 백업 + Supabase goals upsert(로그인 시). 게스트는 upsert 실패를 try/catch로 삼키고 로컬만 남는다.)
- [partial] 서버 전문가 템플릿 매칭 레지스트리(정규식 60규칙) — js/goal-templates-registry.js:70-123 · js/data/expert-templates/*.js(각 476줄) · 사용처 api/goaltemplate.js:137-155(Gemini 실패 시 폴백) · 측정: findExpertTemplate 프로브 '3대 운동'→TPL-HLT-01, '다이어트'·'토익'·'독서'·'명상'·'러닝 10km'·'체지방'·'영어 회화'·'코딩'→null (규칙이 '셰이코·VDOT·CGM·NTRP' 같은 전문용어 위주라 일반인이 쓰는 보통명사는 거의 안 걸린다(프로브 9건 중 8건 null). 폴백 전용이라 Gemini가 살아 있으면 쓰이지 않는다.)
- [shell] '오늘의 질문' 질문 은행 — index.html:664-665(<!-- ① 오늘의 질문 --> 주석 아래 #todayMissionCard, 라벨은 '오늘의 카드') · js/customize.js:18 · 측정: grep -rn "질문" js/ → 질문 배열·파일 0건 (질문 은행이라는 실체가 없다. 카드는 js/tabs/home/today-mission.js:27-92가 목표별 AI '오늘의 미션'을 채우며 목표 0개면 빈 카드(:31 el.innerHTML=''). 문서(docs/specs/REQ-TASK-ES-211-HOME-TOSS-INNOVATION.md:17, docs/아워골_지식기반_압축본_15장.md:184)만 '오늘의 질문'이라 부른다.)
- [full] 오늘의 미션 AI 생성(/api/todaymission) — api/todaymission.js:22-32 프롬프트(15~40자 미션 1개) · :39-48 callGeminiGateway · :34-37 로컬 폴백 · 클라이언트 js/tabs/goals/ai-status.js:80-95 · 캐시 today-mission.js:33-38(settings.todayMissions, 날짜·해시 검증) (인증 없음(auth 참조 0). body.geminiKey를 읽지만(:19-20) 게이트웨이에 넘기지 않아 죽은 변수. 결과는 settings에만 저장되고 settings는 js/core/gcal-token.js saveLocalSettings → localStorage 전용.)
- [full] AI 피드백 서버 엔드포인트(/api/feedback) — api/feedback.js:34-161 프롬프트(테마 5종·3모드·상투어 금지·JSON 스키마) · :239-245 callGeminiGateway · :183-236 로컬 스마트 폴백 · :247 provider='gemini'|'local_smart' (인증 없음. 클라이언트 키(:31-32)는 선언만 되고 미사용. mode==='period_macro' 분기(:184-187, :251-254)는 require('../js/ai-feedback')를 부르는데 js/ai-feedback.js 파일이 저장소에 없다(ls → No such file) — 클라이언트는 그 mode를 보내지 않아(js/tabs/records/period-ai-card.js:166-175) 지금은 안 터지는 잠복 결함.)
- [full] Gemini 중앙 게이트웨이(키 풀·서킷브레이커·캐시·로컬 온톨로지) — api/_lib/gemini-gateway.js:14 OFFICIAL_MODELS['gemini-2.0-flash','gemini-1.5-flash','gemini-1.5-flash-8b'] · :59-66 키는 process.env.GEMINI_API_KEY(+_FALLBACK,_3,_4)만 · :318-323 키 0개면 localFallback · :181-272 LocalOntology(운동/공부/돈 3갈래 고정 문구) (키 값은 저장소에 없고 환경변수로만 들어간다(운영 Vercel env 설정 여부: 측정불가). 4초 타임아웃·3연속 실패 시 30초 OPEN·12시간 응답 캐시. 키가 없거나 막히면 사용자 화면에는 아무 표시 없이 정형문구가 'AI 피드백'으로 나간다(provider 필드만 다름). 클라이언트 전달 키를 받는 옵션 자체가 없다(opts.apiKey 0건).)
- [full] 클라이언트 AI 피드백 호출 경로(게스트 포함) — js/tabs/records/ai-feedback.js:270-279(provider gemini+개인키→브라우저 직접 호출, 아니면 /api/feedback) · js/tabs/records/ai-feedback-providers.js:21-68(서버)·:70-112(직접, x-goog-api-key) · js/tabs/records/checkin-capture.js:184-200(체크인 직후 requestAIFeedback, 실패 시 '실천 완료…' 고정문) · 설정 index.html:1772-1773('미입력 시 서버 공용 Gemini 3.1 자동 연결') (게스트도 로그인 검사 없이 체크인→AI 피드백을 받는다. 단 피드백 결과는 js/record-ledger.js:8 META_FIELDS(goalId·laps·durationMs…)에 feedback이 없어 서버 checkins에 저장되지 않고 로컬 profile.records에만 남는다.)
- [partial] 429 쿼터 폴백용 프리미엄 피드백 카탈로그 — js/tabs/records/ai-feedback-catalog.js(PREMIUM_FEEDBACK_CATALOG: study·workout·business·mind·daily 각 6 = 30문구) · index.html:4138-4140 window 노출 · 호출 ai-feedback-providers.js:64-66 GeminiQuotaDispatcher.getPremiumFeedback (AI 실패 시 테마별 고정 문구를 돌려준다. 사용자에게는 AI 피드백처럼 보인다.)
- [full] 새 목표 AI 템플릿 생성(/api/goaltemplate 분기 B) — js/tabs/goals/new-goal-modal.js:69-91(fetch /api/goaltemplate, 실패 시 localGoalTemplate) · api/goaltemplate.js:618-660 프롬프트(마일스톤 3~5·할일 2~4) · :426-446 콘텐츠 모더레이션 · :137-170 폴백(전문가 매칭→키워드 분류) (인증 없음. 게스트도 사용 가능. 키 없으면 60종 정규식 매칭 또는 LocalOntology 3갈래 고정 마일스톤으로 퇴화.)
- [full] 목표 편집 에이전트 채팅(/api/goalagent) — js/tabs/goals/ai-agent.js:40 · api/goalagent.js:916-957 프롬프트(ops diff 제안) · :958-985 게이트웨이+localGoalAgentFallback (인증 없음. 제안만 만들고 반영은 사용자 확인.)
- [partial] 맞춤 기록 양식·통계 메트릭 AI(/api/goaltemplate 분기 A, /api/vision-table) — api/goaltemplate.js:5-135 localCustomTemplateFallback(크로스핏·하이록스 등 열 정의) · :459-470 ai_stats_agent · :412 폴백에도 analysis '…AI가 분석하여…' 문구 · api/vision-table.js(auth 참조 1) (폴백 응답이 isOfflineFallback:true를 달고도 설명문은 AI가 분석한 것처럼 적혀 있다. 깊이 검증은 하지 않음.)
- [full] 320종 MBTI 페르소나 도감(텍스트 데이터) — js/data/avatar-personas/{16 mbti}.js(각 279줄·20종) · js/avatar-system.js:131 BODY_THEMES_320 조립 · 측정: 엔트리 합계 320, node tests/avatar-personas-split.test.js → 11 passed · 항목 구조 enfj.js id 121 {mbti,group,cat,name,kw,desc,gear,icon(이모지),color,subColor} · 도감 UI js/avatar/themes.js:161-179 renderPersona320ListHtml, js/avatar/modal/bind-persona.js:23-29 토글·검색·그룹탭 ('320종'의 실체는 이름·키워드·한 줄 설명·장비·이모지·색 2개인 텍스트 레코드다. 320개 이미지 자산은 0개(find *.png|svg|webp|jpg avatar/persona → scratch 스크린샷 2개뿐). 기본 표시는 js/avatar/render.js:557-591처럼 이모지 한 글자를 랭크 색 테두리 박스에 넣는 방식. 별도 BODY_THEMES_77(js/avatar/themes.js:20, 77개)도 공존.)
- [partial] AI 웹툰 아바타 생성(사진→Gemini 이미지 모델) — js/avatar/modal/bind-craft.js:162-225(/api/avatar-face 호출, resData.fallback이면 실패 처리 :177-180, avatarUrl 없고 features만 있으면 캔버스 합성 :213-220) · vercel.json rewrite /api/avatar-face→/api/promptgen · api/promptgen.js:95-130(모델 'gemini-3.1-flash-lite-image' 등 3종 순차) · 실패 시 {ok:true,fallback:true,features} 반환(:245-247) · 페르소나 MBTI는 js/avatar/craft-engine.js:430-440 /api/avatar-persona · 테마 확정 js/avatar/modal/bind-deck.js:214-219(MBTI 그룹 안에서 무작위) (운영 키가 없거나 이미지 모델이 거부하면 서버는 fallback:true를 보내고 클라이언트는 이를 실패로 보여 '제작 횟수 차감 안 됨' 안내를 띄운다. 즉 키 없는 배포에서 '320종 웹툰 아바타 완성'(bind-deck.js:60 문구)은 체험 불가.)
- [full] 도움돼요 사유(태그 5+한 줄) 저장·집계 — js/helpful-reason.js:18-24 DEFAULT_TAGS 5개·:25 최소 10자·:26 최대 300자 · :77-97 save→RPC save_helpful_reason, 스키마 없으면 localStorage settings.helpfulReasons(:57-62) · :165-193 글쓴이 요약 RPC helpful_reason_summary · 테이블 docs/sql/2026-09-12-helpful-reason.sql:38-52 public.helpful_reasons(RLS, user·target unique) · 호출 js/reactions.js(도움돼요 직후 openSheet) (다른 사람 글에 도움돼요를 누른 뒤에만 열리므로 유저 0명이면 발동 자체가 없다. 운영 DB에 SQL이 적용됐는지는 저장소 근거 없음(reports grep 0) → 측정불가; 미적용이면 조용히 기기 저장으로 폴백해 사용자는 차이를 모른다.)
- [full] 카테고리별 '도움이 된 글' 상단 슬롯 — js/top-helpful.js:17-20(30일 창·카테고리당 2개·RPC top_helpful_posts·결과 0이면 슬롯 없음) · docs/sql/2026-09-12-top-helpful.sql (실데이터만 쓰도록 설계돼 있어 유저 0명이면 아무것도 보이지 않는다(좋은 설계지만 콜드스타트 콘텐츠 0).)
- [full] 템플릿 복제 실원장(template_copies)과 복제 수 표시 — docs/sql/2026-09-12-template-copies.sql:19-27 테이블(복제자·템플릿 unique) · js/template-credit.js:1-15('서버 실데이터만 표시, 0이면 숨김') · 기록 호출 js/creator-templates-legacy.js:63 recordCopy('creator:'+id) (60종 카드의 data-tplcount 배지는 서버 값이 없으면 display:none(template-encyclopedia 계열 :303)이라 유저 0명이면 숫자 0개. 아래의 하드코딩 '복제 N회'와 한 화면에서 모순된다.)
- [partial] 백과사전 '개인목표 실사용자 템플릿'(하드코딩 6) — js/tabs/goals/template-encyclopedia.js:266-273 PERSONAL_TEMPLATES_REAL(author '러너상민'·'코딩마스터'…, copies 142·98·215·176·320·89, msCount만 있고 ms 없음) · 렌더 :398-411('작성자: … · 복제 N회') · 이식 :609-620 → js/tabs/goals/template-quick-import.js:19-36(밀스톤 없으면 '1단계: 준비 및 기초 습관 세팅' 등 빈 3단계 생성) (작성자·복제 수가 전부 허구이며 이식하면 할 일 0개짜리 일반 3단계만 생긴다. 헌법 anti_pattern '허상지표'에 해당.)
- [partial] 모달형 '실사용자 공유 템플릿'(하드코딩 6, 응원 수 포함) — js/tabs/goals/template-encyclopedia-modal.js:18-180 REAL_USER_TEMPLATES(author '자격증마스터', likes 54·68·82·49·73·91, ms 4개·할일 72개) · :408 likeCount=t.likes · :427-434('작성자 · 복제 N회 · ❤️ 응원 N') · :279 로컬 토글로 likes ±1 (내용(마일스톤·할일)은 60종과 같은 수준으로 구체적이지만 작성자·복제·응원은 고정값이고 응원 클릭은 기기 메모리에서만 증감한다.)
- [partial] 루틴 백과사전 AI 6선·'실사용자' 루틴 4선 — js/tabs/goals/template-encyclopedia.js:21-79 ROUTINE_TEMPLATES_AI(시간·요일·메모) · :80-122 ROUTINE_TEMPLATES_REAL('상민 대표의 04:45 기상 루틴' copies 412, '네카라쿠배' 295 …) · 이식 :622-640 → settings.routines (루틴은 settings에 저장되므로 localStorage 전용(js/core/gcal-token.js saveLocalSettings). '실사용자' 4건의 작성자·복제 수는 허구.)
- [partial] 팀 목표 템플릿 AI 6선·'실사용자' 팀 4선 — js/tabs/goals/template-encyclopedia.js:124-212 TEAM_TEMPLATES_AI · :213-264 TEAM_TEMPLATES_REAL('강남 아침 스터디' author '제이슨' copies 88, kpi '출석률 90%') (팀 개설 핸들러는 이번 조사에서 끝까지 따라가지 않음. 수치는 허구.)
- [partial] 예시 팀(MOCK_GROUPS) 55개 — index.html:5875 var MOCK_GROUPS=[…] isMock:true, members 6/10, progress 65, ownerName '상민' · 측정: 엔트리 55 · 표시 js/tabs/comm/shared-groups.js:71-100(배지 '💡 이런 팀을 만들 수 있어요 (활용 예시)', '이 템플릿으로 팀 개설'·'체험' 버튼) · js/tabs/goals/team-goals-screen.js:91-93 '[예시 팀]' 배지 · js/team-chat.js:20 풀로 사용 ('예시'라고 표기는 하지만 참여 인원·공동 달성률·D-day가 숫자로 보여 실제 활동처럼 읽힌다. 유저 0명 소통 탭의 거의 유일한 '내용'.)
- [partial] 통계 탭 1년치 샘플 데이터(9 도메인+특수 2) — js/stats-samples.js:17-160 generateDomainSample(weight·running·reading·sleep·study·finance·sales·big3·hyrox) · :167 52주 파워리프팅 · :243 1920년대 역도 · isSample:true(:161,:234,:296) · 진입 js/stats-dashboard.js:2 '빈 화면(샘플 바로 불러오기·가져오기)' · js/tabs/records/external-import.js:38 'CSV/줄글/1년치 추천샘플 대량 가져오기' (신규 유저가 통계 화면을 '채워진 상태'로 볼 수 있는 유일한 장치. 샘플 플래그가 붙고 기록으로 들어가며(로그인 시 meta.isSample로 서버 업로드), 수식으로 만든 가짜 추세(78.5→68.2kg 등)다.)
- [shell] 외부 연동 샘플(Strava·건강앱 5건) — js/tabs/comm/sample-data.js:35-41 EXTERNAL_DATA · js/tabs/records/external-import.js:21-70 모달('지금은 샘플 데이터예요 · 실제 연동은 각 서비스의 API 인증이 필요해요', 클릭 시 captureInput에 문장 삽입) (실제 OAuth·API 연동 0. 버튼은 동작하지만 가짜 문장을 입력창에 넣는 것이 전부.)
- [shell] 크리에이터 템플릿 mock 3종(구형 카드) — js/tabs/comm/sample-data.js:44-77 CREATOR_TEMPLATES('마인드코치 지윤 · 상담심리학 석사') · js/creator-templates-legacy.js:21 window.__FORCE_LEGACY_TEMPLATES_CARD 없으면 '' 반환(영구 제거 주석 #TASK-ES-315) (화면에 나오지 않는 죽은 데이터. cloneTemplate 폴백 검색에만 남아 있다.)
- [shell] 피드 AI 댓글 시딩(sim_p01~p21) — js/tabs/comm/feed-comments.js:73-93(가상 댓글 5건 is_ai:true, '박준서'·'김서연'…) · :96-99 실글 20개 초과 시에만 제거 · 측정: grep sim_p0 js/ index.html → feed-comments.js 외 0건, SIM_PERSONAS=[] (js/tabs/comm/sample-data.js:28-29) (대상 게시물 자체가 더는 없어 실제로는 안 보이는 죽은 코드. 유저 0명 피드는 js/tabs/comm/feed-list.js:120 '아직 공유된 실천이 없어요'·:226 빈 상태.)
- [full] 탭별 사용 가이드 6종과 '실제 우수 사용사례' 6인 — js/tab-guides.js:30-… TAB_SHOWCASES(민우 '98일 연속 스트릭·Lv.23', 서연 '진행률 82%' …) · :394 배지 '🌟 실제 우수 사용사례 (Best Practice)' · TAB_GUIDES 6탭×4섹션 (가이드 본문은 유용하지만 '실제'라고 표기된 6인은 창작 인물·창작 수치다.)
- [full] 홈 커닝페이퍼 칩·첫 체크인 온보딩 — js/core/home-cockpit.js:92-128(내 목표 기반 칩, 없으면 러닝·독서 2개 고정) · index.html:668-680 firstCheckinTutorialBanner(+10 EXP) · js/tabs/records/checkin-capture.js:141-151 첫 체크인 축하 모달 (유저 0명 1일차에 실제로 동작하는 손맛. 콘텐츠 양은 문장 2개 수준.)
- [partial] 게스트(둘러보기) 체크인·목표 저장 — js/account-isolation.js:17-19 isGuestId('guest'…) · js/core/home-cockpit.js:154-258 saveProfile(localStorage ourgoal_guest_profile·goals_backup·records_backup + Supabase upsert 시도, 실패는 :256 console.warn) · js/tabs/records/checkin-capture.js:153-156 3회 기록 시 백업 넛지 (게스트 데이터는 전부 기기 로컬. 헌법 GUARD_03(로컬 전용 금지) 관점의 예외 상태이며 기기·브라우저 바꾸면 소실.)
- [doc_only] docs/knowledge 60선 지식 문서 — docs/knowledge/아워골_프로필카테고리_인기목표템플릿_60선.md(1982줄, TPL ID 60개 = 코드 60개와 100% 일치) · .vercelignore '/docs/knowledge/' 제외 · grep docs/knowledge index.html js/ → 0 (내용은 코드 템플릿의 원문(전문가 포인트 전문)이지만 사용자에게 보여줄 경로가 없다. 앱의 desc는 이 전문을 '...'로 자른 것.)
- [doc_only] docs/notebooklm_sources 5종(헌법·명령 역사·마스터플랜·프롬프트 가이드) — docs/notebooklm_sources/*.md 833·228·450·69·1534줄 · .vercelignore에 notebooklm_sources 미기재(docs/ 하위를 개별 제외하는 방식) → 정적 파일로 배포되나 index.html/js 참조 0 (AI 에이전트 거버넌스 문서이지 사용자 콘텐츠가 아니다. URL을 알면 공개 접근 가능한 내부 문서(투자제안서 pptx/docx, 15장 가이드 HTML, OURGOAL_HANDOVER_MANUAL도 동일).)
- [doc_only] 사용자용 가이드 HTML·15장 지식기반·설치 카드 — docs/ourgoal_plain_guide.html(1461줄) · docs/ourgoal_15_chapters.html(1507줄) · docs/아워골_지식기반_압축본_15장.md(492줄) · docs/guide/cards/install_card_01~04.png(4장) · 앱 내 링크 grep → 0 (배포는 되지만 앱에서 연결되지 않아 신규 유저가 도달할 수 없다.)
- [doc_only] 가상 페르소나 200명(sim/personas.json) — sim/personas.json 378KB·배열 200 · 참조 scripts/smoke-test.js:1678만 · .vercelignore '/sim/' 제외 (앱 런타임과 무관한 시뮬레이션 자료.)
- [full] AI 엔드포인트 무인증 노출 — 측정: api/{feedback,goalagent,goalstatus,goaltemplate,nextaction,promptgen,todaymission}.js auth 참조 0건(12개 중 7개) · 인증 있는 것은 track·push-*·withdraw·vision-table (게스트 체험에는 유리하지만 운영 키 쿼터를 외부에서 소진시킬 수 있다(게이트웨이 12시간 캐시·키 풀이 완충).)

**없는 것**

- 질문 은행이 없다: '오늘의 질문'은 코드에 문자열로만 존재하고(#todayMissionCard), 목표가 없는 신규 유저는 빈 카드를 본다. 매일 돌아올 이유가 되는 고정 질문·회고 프롬프트 데이터가 0건.
- 템플릿이 '주차 마일스톤'까지만 있고 오늘 당장 할 10초 실천(일일 루틴·체크 항목)이 없다. 60종 전부 routines 필드 0, desc 60/60 '...' 잘림으로 카드에서 전문가 포인트 전문이 안 보인다.
- 서버 전문가 매칭 규칙이 전문용어 전용이라 '다이어트·토익·독서·명상' 같은 보통 입력은 매칭 0 → Gemini가 죽으면 3갈래 고정 마일스톤으로 떨어진다.
- '진실된 데이터'와 정면 충돌하는 허구 수치: 실사용자 템플릿 작성자·복제 142~412회·응원 54~91, 예시 팀 55개의 참여 인원·달성률, '실제 우수 사용사례' 6인. 같은 화면에서 서버 실복제 수는 0이라 숨겨진다(모순).
- AI 피드백·오늘의 미션·루틴·도움돼요 사유 로컬폴백이 모두 localStorage(settings)에만 남고 checkins meta에 feedback이 없어 기기 변경 시 소실 — '쌓이는 데이터' 경험이 서버에 축적되지 않는다.
- Gemini 키 유무를 사용자가 알 수 없다: 키가 없거나 429·타임아웃이면 provider만 바뀌고 화면은 정형문구를 AI 피드백으로 보여준다(진실성 문제). 운영 env에 키가 실제로 있는지 저장소로는 측정불가.
- 유저 생성 콘텐츠(UGC) 0: 도움돼요 사유·상단 도움글·템플릿 복제 원장·피드는 전부 타인 전제라 유저 0명이면 빈 화면. 앱 자체가 미리 넣어둔 '진짜 사람의 기록·후기·비교 벤치마크'가 없다.
- 지식 콘텐츠(60선 전문, 15장 가이드, 사용 가이드 HTML, 설치 카드)가 앱 어디에서도 링크되지 않아 1일차 유저가 도달할 수 없다(참조 0). 반대로 내부 문서(헌법·투자제안서·인수인계 매뉴얼)는 정적 배포돼 URL만 알면 열린다.
- 외부 데이터 연동(Strava·건강앱·수면)은 샘플 5건 삽입뿐, 실제 API 연동 0.
- api/feedback.js period_macro 경로가 존재하지 않는 js/ai-feedback.js를 require(:185,:252) — 호출되면 500. 지금은 클라이언트가 그 mode를 안 보내 잠복.
- AI 엔드포인트 7개가 무인증이라 바이럴로 트래픽이 늘면 키 쿼터 소진·비용 통제가 안 된다.
- 320종 아바타는 텍스트 레코드이고 이미지는 사용자 사진+Gemini 이미지 모델 생성에 의존 — 키 없으면 체험 불가, 도감만 남는다.

## 첫 실행·온보딩 경험

**요약**: 게스트는 랜딩에서 「로그인 없이 둘러보기」 1탭으로 홈에 들어가고, 입력칸 탭·저장 탭까지 총 3탭(로그인 0)으로 첫 체크인과 축하 모달에 도달한다(헤드리스 실측). 그러나 375×667 폰에서는 랜딩의 모든 CTA 가 폴드 아래(주 CTA top 662px)이고, 홈에는 목표 만들기 카드가 바텀시트 안으로 숨어 있어(나침반 행 top 698px) 목표 생성은 2탭 깊이다. 가입 경로는 카카오 하나뿐이며(구글·이메일 가입은 display:none), 「닉네임으로 1초 시작」 링크는 실제로는 로그인 화면으로 보내고, 설정의 게스트 가입 버튼은 정의 없는 함수를 불러 토스트만 띄운다. 게스트 데이터는 localStorage 전용이고 복귀 훅(알림·푸시·이메일)은 0개이며, 첫 체크인 축하 모달의 동류 러너·웰컴 응원은 실회원 피드가 있어야 채워져 콜드스타트에는 비어 있다. 게스트→회원 이관 코드는 완전 배선돼 있으나(소셜·이메일·직통 3경로) 실계정 없이는 측정하지 못했다.


**콜드스타트 판정**: 유저 0명·친구 0명 상태에서 신규 유저가 받는 것은 '내가 방금 적은 한 줄 + 축하 모달 + 빈 화면들'이다. 첫 가치 체감(aha)은 3번째 행동(둘러보기 → 입력 → 저장)에서 오는 첫 체크인 축하 모달뿐인데, 그 모달이 약속하는 동류 러너·웰컴 응원은 실회원 피드가 있어야 채워져 콜드스타트에는 "소통 탭에서 함께할 분 찾아보기"로 빈 피드에 보내고, 히트맵·6각 차트·AI 피드백은 3일 이상 쌓이거나 서버 AI 가 살아 있어야 의미가 생긴다. 이탈 지점은 순서대로 (1) 375×667 폰에서 CTA 가 전부 폴드 아래인 랜딩, (2) 진입 직후 2.5초 반말 인사 팝업, (3) 목표 만들기 카드가 바텀시트에 숨어 "첫 목표를 시작해볼까요?"만 보이는 홈, (4) 축하 모달 뒤의 빈 소통 탭, (5) 세션을 닫은 뒤 — 게스트에겐 알림·푸시·이메일 어떤 복귀 훅도 없고 데이터는 localStorage 에만 있다. 가입하려 해도 카카오 한 길뿐이며(구글·이메일 가입 숨김, 설정 가입 버튼은 죽음), '닉네임 1초 시작'은 로그인 화면으로 끝난다. 따라서 현재 코드 기준으로 투자자 지적(초기 유입 유지 불가·바이럴 요소 부재·체험할 진실된 데이터 없음)은 사실과 일치한다.


**측정 수치**

- 랜딩→첫 체크인 최소 탭 수(로그인 0) = 3탭(둘러보기 → 입력칸 → 저장)  ·  출처: scratchpad/firstrun-check.js 실측(firstrun-result.json steps 2-3), 코드 흐름 inapp-landing.js:163-176 → checkin-capture.js:37
- 랜딩→목표 생성→첫 체크인 탭 수 = 5탭(둘러보기 → 나침반 '오늘 목표' → 스타터 목표 → 입력칸 → 저장)  ·  출처: scratchpad/compass-check.js 실측 + sub-onescreen.js:52-62, home-render.js:98-111
- 375×667 랜딩 주 CTA 위치 = #btnLandingPreviewDirect top 662 / bottom 708 (뷰포트 667 밖), 문서 높이 941px  ·  출처: firstrun-result.json step1 landingBtns 실측
- 375×812 랜딩 CTA = 주 CTA·카카오 버튼 폴드 안, 닉네임 링크(top 839) 폴드 밖  ·  출처: compass-check.js landing812 실측
- 홈 체크인 입력칸·저장 버튼 위치(375×667, 게스트) = #captureInput top 330, #captureSave top 473 (폴드 안)  ·  출처: firstrun-result.json step2 실측
- 홈 나침반(목표 시트 진입) 행 위치 = top 698px (667 폰 폴드 밖, 812 폰 폴드 안)  ·  출처: compass-check.js androidHome.compassTop 실측
- iOS PWA 홈 배너 위치 = #iosPwaSlot top 673, 높이 310 (폴드 밖)  ·  출처: home-visible-check.js hidden[] 실측
- 첫 체크인 1회 뒤 XP 합계 = 50 (체크인 10 + 퀘스트 체크인 30 + '할일 1개 완료' 10) — 화면 표기는 +10  ·  출처: home-visible-check.js checkinWithGoal.xpLog 실측, quest-summary.js:19,96
- 가짜 페르소나 응원 토스트 = 0건(저장 뒤 6초 관측), SIM_PERSONAS 길이 0  ·  출처: firstrun-result.json step3b, js/tabs/comm/sample-data.js:25
- 새로고침 뒤 게스트 기록 유지 = records 1 유지, 랜딩 미표시  ·  출처: firstrun-result.json step5 실측
- 닉네임 1초 시작 링크 결과 = 로그인 화면 표시(authScreenVisible true) + 토스트 '먼저 로그인해 주세요', 앱 미진입  ·  출처: firstrun-result.json step6 실측
- 초기 로드 자원 = script 태그 346개, 로컬 JS 344파일 5,683,022바이트, index.html 462,299바이트(6,272줄·인라인 스크립트 4,003줄), ui.css 547,114바이트  ·  출처: grep/wc 및 firstrun-check.js servedBytes 실측
- 헤드리스 로컬 load 시간(디스크 서빙, 네트워크 제외) = 1,190ms  ·  출처: firstrun-check.js loadMs 실측(실회선 TTI 는 null)
- 콘솔 오류(게스트 첫 세션 전체) = 404 /api/todaymission·/api/goalstatus·/api/feedback 외 0건(서버리스 함수 미기동 환경)  ·  출처: home-visible-check.js errors 실측
- 각 탭 빈 상태 화면 버튼 수(게스트, 기록 1·목표 0) = 목표 11 · 달력 17 · 기록 32 · 소통 55 · 설정 54  ·  출처: firstrun-result.json step4 visibleButtons 실측
- 설정 탭 게스트 로그인/가입 버튼 = 첫 화면 0개, '계정 & 프로필' 펼친 뒤 1개(#btnChangePassModal, 처리기 openAuthModal 미정의)  ·  출처: compass-check.js settingsGuestCta/settingsAccountOpen 실측 + grep
- 퍼널 계측 이벤트 종류 = 18종(track 호출 grep), 게스트 진입 이벤트 0종  ·  출처: grep track(' js index.html; inapp-landing.js
- 운영 feed_posts 실제 글 수 / 실유저 수 = null(원격 미접속, 하네스는 목 3건)  ·  출처: 측정불가 — needs-live-server
- 가입·온보딩·이관 완주율·TTV = null(실계정·운영 지표 없음)  ·  출처: 측정불가 — needs-login / needs-two-accounts
- tab-check.js 실행 = 실패 — require('C:/dev/command-center/node_modules/puppeteer-core') Windows 경로 → 같은 방식(정적 서빙+Supabase 목+외부 차단)을 playwright 로 재현해 대체  ·  출처: docs/design/harness/tab-check.js:16, scratchpad/firstrun-check.js

**있는 것(배선 판정)**

- [full] 랜딩 화면(가치 제안 4줄 + CTA 묶음) — index.html:50-77 랜딩 마크업; 실측(playwright 375×667) 주 CTA #btnLandingPreviewDirect top 662/bottom 708 → 폴드 밖, 카카오 버튼 top 720, 닉네임 링크 top 839; 375×812 에서는 주 CTA·카카오만 폴드 안 (문서 높이 941px. 667 높이 폰에서는 스크롤 전엔 누를 수 있는 것이 0개)
- [partial] 「로그인 없이 둘러보기」 게스트 진입 — js/tabs/settings/inapp-landing.js:163-176 guest-… id 프로필 생성 → localStorage ourgoal_guest_profile → enterApp() → 토스트 '게스트 모드로 시작했어요'; 실측 1탭에 #screen-home 활성 (로컬 전용 프로필. 진입 이벤트 계측(track) 호출 0건(같은 파일 grep))
- [full] 앱 부팅 분기(세션 복원 → 게스트 사본 복원 → 프리뷰 시드 → 랜딩) — js/core/app-boot.js:20-245 (게스트 복원 100-162, 랜딩 242-244, recordLanding 243) (게스트 사본이 있으면 랜딩을 건너뛰고 바로 홈(실측 새로고침 뒤 records 1 유지))
- [full] ?preview 쿼리 시 가짜 목표 2·기록 8 자동 주입 — js/core/app-boot.js:166-239 isPreviewEnv = localhost|127.0.0.1|포트 8888|search 에 'preview' 포함 (운영 도메인에서도 ?preview=1 로 발동 → 가짜 데이터 게스트로 시작 가능(데이터 진실성 리스크))
- [full] 진입 시 아바타 인사 팝업(2.5초 자동 닫힘) — js/tabs/settings/avatar-greeting.js:20-100; app-enter.js:47-51 에서 150ms 뒤 호출; 실측 greetVisible true, 문구 '오늘은 뭘 할거냐? 내자신' (기본 문구가 반말. 세션당 1회)
- [full] 카카오 OAuth 로그인 버튼 — js/auth-social.js:320-324 landKakaoBtn/authKakaoBtn → startOAuthLogin('kakao') → Supabase OAuth (실계정 없어 측정불가(needs-login))
- [shell] 구글 로그인 버튼 — index.html:68 landGoogleBtn style=display:none aria-hidden, index.html:85 authGoogleBtn 동일; 처리기는 auth-social.js:327 에 있음 (사용자는 누를 수 없음)
- [shell] 이메일 회원가입 탭·폼 — index.html:94 data-authtab="signup" display:none, index.html:121 #signupForm display:none; 다른 진입 경로 grep 0건 (이메일로는 로그인만 가능, 신규 가입 불가 → 가입 경로는 카카오 단일)
- [partial] 「카카오 없이 닉네임으로 1초 만에 바로 시작」 링크 — inapp-landing.js:144-151 → session-entry.js:172-221 openLoginRescueModal → 83-106 loginWithDirectIdentifier → js/direct-login-guard.js:24-33 세션 uid 없으면 allow:false → 59-72 guideToFormalLogin; 실측: 닉네임 입력 후 로그인 화면 + 토스트 '먼저 로그인해 주세요' (문구와 실제 동작이 다름(1초 시작 불가). 모달 여는 순간 ourgoal_guest_profile 삭제(session-entry.js:175-177))
- [full] 홈 첫 화면(게스트·목표 0) 폴드 안 구성 — 실측 375×667: 상단 아바타(#homeHeroAvatar)·#homeAddGoal(top 60)·헤드라인 '가슴 뛰는 첫 번째 목표를 시작해볼까요?'(home-render.js:50)·체크인 콕핏 #captureInput top 330·#captureSave top 473 모두 폴드 안 (목표 목록·스타터 카드·오늘의 카드·스트릭은 #homeSheetPanelQuest 바텀시트로 이동(js/tabs/home/sub-onescreen.js:4-9, 44-52) → 홈에서 안 보임)
- [full] 홈 나침반 「오늘 목표」 바텀시트 — sub-onescreen.js:52-62 #homeCompassQuest; 실측 행 top 698px(375 폭) → 667 폰에선 폴드 밖, 812 폰에선 폴드 안; 탭하면 시트 열리고 3대 퀘스트·스타터 카드 노출 (목표 만들기 진입이 홈에서 2탭 깊이)
- [partial] 스타터 목표 1탭(4종 템플릿) — js/tabs/home/home-render.js:72-111 + js/tabs/goals/starter-goal.js:18; 실측 시트 안 '매일 3km 러닝' 1탭 → goals 1(마일스톤 3) + 토스트 '첫 갓생 목표가 시작되었어요' (saveProfile 로컬 백업은 되나 서버 upsert 는 게스트 id 로 시도(RLS 결과 측정불가))
- [partial] 목표 탭 빈 상태 + 템플릿 「+ 담기」 — js/tabs/goals/render.js:71-72('새로운 목표를 세우고 첫 발걸음을…'), 206-216; js/tabs/goals/personal-goals-guide.js:19-44 추천 3종; 실측 '+ 담기' 1탭 → goals 1(마일스톤 2) + 토스트 (로컬 저장. 빈 상태 문구·버튼 11개 실측)
- [partial] 「+ 새 목표 만들기」 모달(AI 템플릿 생성 / 직접 설정) — 실측 모달: 입력 #ngDescInput(500자) + 버튼 '직접 설정할게요·템플릿 만들기'; 생성은 /api/goaltemplate 서버리스(api/goaltemplate.js) (서버 함수·GEMINI_API_KEY 동작은 측정불가)
- [partial] 홈 1줄 체크인 저장(#captureSave) — 로그인 없이 가능 — js/tabs/records/checkin-capture.js:37-175; js/core/home-cockpit.js:154-258 saveProfile(users/goals/checkins upsert + ourgoal_*_backup_ 로컬); 실측 records 0→1, 랜딩→첫 체크인 탭 수 3(둘러보기·입력칸·저장) (게스트는 로컬만 확실. 버튼 문구 '+10 EXP' 이나 xp.total 은 50 이 됨)
- [partial] EXP 수치 표기 불일치 — 실측 xp.log ['10:체크인','30:데일리 퀘스트: 오늘 한 줄 체크인','10:데일리 퀘스트: 할일 1개 완료']; js/tabs/home/quest-summary.js:19 본문에 '완료' 글자가 있으면 할일 완료로 간주, :96 +10 지급 (화면은 +10 EXP, 실제 +50 EXP → 숫자 신뢰 저하)
- [full] 첫 체크인 축하 모달 — js/tabs/records/first-checkin-tutorial.js:150-265; 실측 '🌱 첫 체크인(E1) 완주 · 레벨 1 달성 … +10 EXP … 🤝 소통 탭에서 함께할 분 찾아보기' (동류 러너 카드는 feed_posts 실회원(53-87)에서만 뽑아 콜드스타트엔 0명; 웰컴 응원 전송은 로그인 필수(95-98))
- [shell] 가짜 페르소나 첫 응원 토스트 — js/tabs/comm/first-cheer.js:19-34 SIM_PERSONAS[0] 없으면 return; js/tabs/comm/sample-data.js:25 SIM_PERSONAS = []; 실측 저장 6초 창 토스트 0건 (가짜 응원은 차단된 상태(코드는 남아 있음))
- [partial] 첫 체크인 튜토리얼 배너(#firstCheckinTutorialBanner) — first-checkin-tutorial.js:19-50 firstCheckinPending 조건; 플래그는 js/tabs/settings/onboarding.js:212(신규 소셜 가입 온보딩)에서만 세팅; 실측 게스트 tutorialBannerVisible false (게스트·직통 입장은 볼 수 없음)
- [full] 신규 가입 2단계 온보딩(수호동물 16종 → 닉네임·프리셋 목표) — js/tabs/settings/onboarding.js:42-245 showObStep1/2·completeOnboarding; 호출 조건 js/tabs/settings/session-entry.js:61-65 (_isNewSignup && goals 0 && records 0) (카카오 신규 가입자만 경유. 측정불가(needs-login))
- [shell] 첫 로그인 활용 가이드 6쪽(maybeShowFirstLoginGuide) — js/tabs/settings/first-login-guide.js:19-26 정의; 자동 호출부 grep 0건; index.html:1844 #btnRestartGuide(설정 '앱 기본 가이드 다시보기')로만 열림 (REQ-TASK-ONBOARDING-30S 5.3 의 '탭별 10초 미니 튜토리얼 자동 연결'은 코드에 없음)
- [full] 「💡 이 페이지 활용법」 탭 가이드 허브 — index.html:140 #topHomeGuideBtn → js/tab-guides.js:439 showTabUsageGuide; 실측 모달 '🌟 실제 우수 사용사례 (Best Practice) 민우 Lv.23 코스믹 랭크 98일 연속 스트릭' (tab-guides.js:31-60 하드코딩 가공 인물을 '실제 우수 사용사례'(394행)로 표시 — 데이터 진실성 문제)
- [full] 게스트 → 회원 데이터 이관(migrateGuestDataToUser) — js/tabs/settings/guest-migration.js:18-230 (goals/records/settings/아바타/gcal 병합 → saveProfile + checkins upsert :196-211, 토스트 :226); 호출 session-entry.js:46-50(소셜)·146-151(직통), js/tabs/settings/account-actions.js:68-71(이메일 로그인) (실계정 2개 없어 측정불가(needs-login). 게스트 id 사본만 이관(account-isolation.js:44-45))
- [full] 게스트 3회 기록 뒤 카카오 백업 넛지 — js/tabs/settings/guest-backup-nudge.js:18-103 records>=3·세션 1회 → startOAuthLogin('kakao'); 호출 checkin-capture.js:155, view-dispatch.js:55 (게스트의 유일한 자동 가입 유도)
- [shell] 설정 탭 게스트 가입 버튼 「🔒 간편 회원가입 / 계정 연동」 — js/tabs/settings/sub-security.js:45-50 openAuthModal 호출 → 정의 grep 0건 → 토스트 '소셜 로그인으로 내 소중한 데이터를 안전하게 보관하세요'만; 실측 설정 첫 화면 로그인/가입 버튼 0개, '계정 & 프로필' 펼친 뒤 이 버튼 1개 (진입 토스트 '언제든 설정에서 가입할 수 있어요'(inapp-landing.js:173)와 어긋남)
- [partial] 게스트 데이터 영속성(새로고침 복원) — app-boot.js:100-162 ourgoal_guest_profile + readOwnCopy 백업 복원; 실측 reload 뒤 records 1·랜딩 미표시 (localStorage 전용. 서버 원장 없음(docs/sql/RUN-ME-2026-09-08.sql:22 users.id text 지만 RLS 는 측정불가) → 브라우저 데이터 삭제 시 소실)
- [partial] PWA 설치 유도 — manifest.json(standalone·shortcuts 3)·sw.js 등록 index.html:6193-6195; iOS 전용 홈 배너 js/tabs/settings/pwa-install.js:23-33(#iosPwaSlot 실측 top 673 폴드 밖); Android beforeinstallprompt 처리 grep 0건; 설정 탭 '설치 안내' 카드 index.html:1374-1380 (Android 에서 설치 프롬프트 없음, iOS 배너는 스크롤해야 보임)
- [full] 카카오톡 인앱 브라우저 탈출 배너 — js/tabs/settings/inapp-landing.js:77-141 (Android intent://, iOS Safari 안내), index.html:3663 호출
- [partial] 복귀(D1) 훅: 알림·푸시 — 기본 notify:false js/tabs/settings/app-defaults.js:21; 인앱 배너 20초 폴링 js/tabs/settings/notify-timer.js:20-38(앱 열려 있을 때만); 웹푸시 구독은 로그인 토큰 필수 js/tabs/settings/web-push.js:33; 알림 소프트애스크 호출은 설정에서만 sub-notify.js:155 (게스트의 재방문 트리거 0개. 로드맵 T020 '첫 체크인 직후 알림 제안'은 문서만)
- [partial] 소통 탭 콜드스타트 피드 — js/tabs/comm/feed-posts-sync.js:20-25 feed_posts 50건 읽기(게스트 가능, docs/sql/2026-09-08-hidden-rls.sql:101 select_visible); 실유저 0이면 '아직 공유된 실천이 없어요'(feed-list.js:120,226); AI 봇 주입 배제 feed-list.js:115; 사진인증 AI 1건은 virtualCheerEnabled(기본 false) 일 때만(:213-218) 실측 aiTags [] (운영 실제 글 수는 측정불가(null). 동반자/DM/영입은 게스트 게이트 모달 js/team-invite-comm.js:133-156)
- [partial] 기록 탭 빈 상태·AI 피드백 — 실측 1건에도 히트맵·'3일 뒤 완성될 6각 성장 차트'·위클리 리캡 렌더; AI 피드백 /api/feedback(api/feedback.js:3-27, GEMINI_API_KEY) 실패 시 카탈로그 폴백 + 토스트 'AI 응답량이 많아 고품질 추천 엔진으로 즉시 보답'(js/tabs/records/ai-feedback-catalog.js:118,149) + '⚡ 오프라인 상태 또는 아워골 서버 문제로 기본 안내'(checkin-feedback.js:33) (서버리스 AI 는 측정불가; 폴백 토스트 문구는 실패를 성공처럼 포장)
- [full] 달력 탭 빈 상태 — js/tabs/calendar/day-detail.js:61 '이 날은 예정된 일정이 없어요 + 이 날짜에 일정 추가'; 실측 버튼 17개·구글캘린더 연동 배지(calendar/render.js:92)
- [full] 설정 탭 게스트 표기 — js/tabs/settings/render.js:49-58 '👤 게스트 체험 모드 · 로컬 샌드박스 안전 보관'; 실측 동일
- [partial] 익명 퍼널 계측(PostHog + Supabase events) — index.html:4-13 posthog.init; js/core/telemetry.js:64-88 recordLanding/track → events insert(RLS anon insert docs/sql/2026-09-06-events.sql:18-21); 이벤트 이름 18종(landing_view·checkin·checkin_completed·goal_created·onboarding_step_viewed·onboarding_completed·signup·app_installed_pwa 등 grep) (게스트 진입·탭 전환·이탈 이벤트 없음 → 온보딩 이탈 지점 측정 불가)
- [partial] 딥링크 게이트웨이 + 게스트 뷰어(피드·템플릿·완주·초대) + OG 메타 — js/viral-sharing.js:267-327 handleDeepLinkRouting(?type=feed|template|goal|group), 랜딩에서도 호출 app-boot.js:244; 피드 뷰어는 FEED_POSTS_CACHE/URL 메타 의존(:84-98); OG 태그 index.html:17-33, icons/og-image.jpg 41KB 존재 (랜딩 시점엔 캐시가 비어 URL 파라미터 문구로만 보여 줌)
- [full] 초기 로드 무게 — index.html script src 346개(grep), 로컬 JS 344파일 5.68MB 서빙(실측), index.html 462KB·6272줄(인라인 스크립트 4003줄), ui.css 547KB; 헤드리스 디스크 서빙 load 1190ms (실 네트워크·모바일 회선 TTI 는 측정불가)
- [doc_only] 30초 온보딩 문서(REQ/PLAN) 대비 코드 — docs/specs/REQ-TASK-ONBOARDING-30S.md:103 '탭별 10초 미니 가이드 오버레이', docs/growth/ourgoal-daily-roadmap.md:102-110 T010(목표 유형 3택→첫 목표→AI 질문→가입 순서 재배열·TTV 3회 측정), :203-210 T020(첫 체크인 직후 알림 소프트애스크) (셋 다 코드·측정 기록 없음(grep·실측))

**없는 것**

- 가입 전 '진실된 데이터 체험' 경로: 운영 콜드스타트 게스트는 본인 입력 0건·실유저 0명 상태의 빈 히트맵·빈 피드만 본다. 타인·샘플 데이터로 가치를 미리 보여 주는 공식 경로가 없고, 샘플 주입은 localhost 프리뷰(또는 ?preview 편법)뿐이다(app-boot.js:166-239).
- 복귀(D1) 훅 0개: 게스트는 알림 기본 꺼짐(app-defaults.js:21), 푸시는 로그인 토큰 필수(web-push.js:33), 이메일·카톡 리마인더 없음. 첫 체크인 직후 알림 제안(로드맵 T020)은 문서만.
- 온보딩 안의 바이럴 고리 없음: 첫 체크인 축하 모달의 '웰컴 응원'은 로그인+실회원 피드가 있어야 활성(first-checkin-tutorial.js:95-98,153-157). 초대·공유 유도는 첫 세션 흐름에 없다.
- 이탈 지점 측정 불가: 게스트 진입·탭 전환·세션 이탈 이벤트가 없고(inapp-landing.js track 0건), 로드맵 T010 의 TTV 3회 측정 기록도 없다.
- 가입 경로 단일화·고장: 구글 버튼·이메일 가입 탭 display:none(index.html:68,94,121), 설정 게스트 가입 버튼은 정의 없는 openAuthModal(sub-security.js:47) → 카카오 외 가입 불가, 게스트가 설정에서 가입하려 해도 토스트만.
- 랜딩 CTA 가 375×667 폰 폴드 아래(주 CTA top 662px) — 첫 화면에서 누를 수 있는 버튼 0개.
- 문구와 동작 불일치: '닉네임으로 1초 만에 바로 시작' → 로그인 화면(direct-login-guard.js:24-33), '+10 EXP' → 실제 +50(quest-summary.js:19,96), AI 실패 토스트 'AI 응답량이 많아 고품질 추천 엔진으로 즉시 보답'(ai-feedback-catalog.js:118).
- 홈 첫 화면에 목표 만들기 카드 없음: 스타터 목표는 바텀시트(2탭·나침반 행 top 698px) 안에 숨어 있다(sub-onescreen.js:4-9).
- 가공 데이터를 '실제'로 표기: 탭 활용법 가이드의 하드코딩 인물(민우 Lv.23·98일 스트릭)을 '🌟 실제 우수 사용사례' 라벨로 노출(tab-guides.js:31-60,394).
- 첫 로그인 가이드·탭별 미니 튜토리얼 자동 노출 없음(first-login-guide.js:19-26 호출부 0건) — 문서(REQ-TASK-ONBOARDING-30S 5.3)에만 있다.
- 게스트 데이터 서버 원장 없음: localStorage 전용(헌법 GUARD_03 관점의 로컬 전용 루프). 브라우저 데이터 삭제·기기 변경 시 소실.

## 유지(리텐션) 장치

**요약**: 스트릭·프리즈·히트맵·주간 리캡·푸시(VAPID+구독 테이블+pg_cron 매분 발송)·리마인더 시간 설정·데일리 퀘스트·오늘의 미션은 코드에 실물로 존재하고 체크인 기록(checkins)은 Supabase에 저장된다. 그러나 스트릭 프리즈·출석·배지·루틴 완료·알림 설정·퀘스트 보상 같은 "유지 상태" 전부는 settings 객체로 localStorage(ourgoal_settings_<uid>)에만 저장되어 기기를 바꾸면 사라진다(home-cockpit.js:256, gcal-token.js:64, profile-load.js:209). 서버 푸시는 체크인 시각에 고정 문구 '지금 뭐 하고 있었어요?'만 보내며(push-dispatch.js:311) 설정 화면이 약속한 "저녁 8시까지 체크인 없으면 긴급 알림"(notify-soft-ask.js:40)·스트릭 경보·방해금지는 탭이 열려 있을 때만 도는 20초 타이머에만 있다. AI 슬럼프 세이프티 넷·복귀 유저 화면·루틴 체크→상위 목표 진행률 반영·회고 작성 흐름은 코드에 없고, 홈 히트맵 카드는 display:none !important와 조기 return으로 죽어 있다. 리텐션 자체를 잴 app_open/D1·D7 이벤트도 없다(PostHog 자동수집만 있음).


**콜드스타트 판정**: 유저 0명·친구 0명이어도 지금 코드가 혼자 쓰는 사람에게 주는 것은 분명히 있다: 1일차에는 스타터 목표 1터치, 첫 체크인 튜토리얼·축하·+10 EXP·confetti, 오늘의 미션 카드, 데일리 퀘스트 3종이 돌고(모두 다른 유저에 의존하지 않음), 2일차는 "오늘 한 줄이면 2일 연속"(streaks.js:191)·3일 배지·프리즈 지급과 설정한 시각의 고정 문구 푸시가 이유가 되며, 7일차는 7일 배지·프리즈·아바타 제작권·일요일 주간 리캡 푸시(눌러야 생성), 30일차는 30일 배지·18주 히트맵·월말 회고 푸시·기간 AI 분석이 이유가 된다. 그러나 그 이유를 떠받치는 상태(프리즈·출석·배지·루틴·퀘스트 보상)가 전부 localStorage라 폰을 바꾸거나 브라우저 데이터가 지워지면 "내가 쌓은 것"이 사라지고, 푸시는 내가 이미 기록했든 끊기기 직전이든 같은 문장만 보내며, 하루 이틀 빠졌을 때 받아주는 장치(슬럼프 세이프티 넷·복귀 화면)는 0줄이고, 루틴을 매일 체크해도 목표 숫자는 움직이지 않는다. 결론: 2·7·30일차에 "다시 열 이유"는 배지·푸시·리캡으로 코드가 주지만, "진실된 유익한 데이터를 경험한다"는 투자자 기준에서는 홈에 히트맵이 없고 회고를 남길 곳이 없으며 리텐션을 재는 이벤트도 없어, 혼자 쓰는 유저가 30일을 버티게 할 근거는 체크인 기록(Supabase) 하나뿐이다. 다른 유저 존재에 의존하는 장치는 동류 레이더·응원·팀 인증·DM 푸시(push-dispatch.js:136-189)·첫 체크인 환영 도장(first-checkin-tutorial.js)·MOCK_GROUPS 팀 알림 문구(notification-helper.js:85-88)이며, 이것들은 이번 영역의 핵심 유지 장치가 아니라 소통 탭 몫이다.


**측정 수치**

- index.html 전체 줄 수 = 6272  ·  출처: wc -l index.html
- index.html 인라인 스크립트 줄(미분화 덩어리) = 4003  ·  출처: node scripts/module-metrics.js --card (ratchet.inlineScriptLines) 및 awk 집계
- js/ 파일 수 = 350  ·  출처: find js -name '*.js' | wc -l
- index.html <script 태그 수 = 105  ·  출처: grep -c '<script' index.html
- 신고서 세포 수 / 측정 모듈 수 = 349 / 224 (평균 200줄)  ·  출처: docs/architecture/modules.json cells[] · module-metrics --card cells.moduleCount
- 실제로 그리는 작은 세포 = 7/22  ·  출처: module-metrics --card drawingSmallCells
- 같은 일을 하는 중복 세포 = 토스트 1·리캡 3·타이머 4  ·  출처: module-metrics --card duplicateCells
- 데이터 중복 저장 항목 = 16  ·  출처: module-metrics --card dataDuplicates
- 스트릭 배지 단계 = 3·7·30일(streak-badge) / 배지 마일스톤 3·7·14·30·60·100·365일(streaks.js)  ·  출처: js/core/streak-badge.js:18-25 · js/streaks.js:19
- 스트릭 프리즈 상한·지급 주기 = 최대 3개, 7일마다 1개  ·  출처: js/core/streak-badge.js:60-71
- 기록 탭 히트맵 범위 = 18주(126일)  ·  출처: js/tabs/records/record-heatmap-levels.js:19
- 기본 체크인 알림 시각 / notify 기본값 = ["10:00","15:00","21:00"] / false  ·  출처: js/tabs/settings/app-defaults.js:21
- 서버 푸시 발송 주기·허용 지연 = pg_cron 매분(* * * * *), 체크인 시각 후 4분까지  ·  출처: docs/sql/2026-09-08-push-cron.sql:46 · api/push-dispatch.js:8
- 앱 내 알림 타이머 주기 = 20초  ·  출처: js/tabs/settings/notify-timer.js:37
- 데일리 퀘스트 EXP = 30+10+50 = 90/일, 체크인 +10  ·  출처: js/tabs/home/quest-summary.js:76-78 · checkin-capture.js:169
- 클라이언트 계측 이벤트 이름 수 / app_open 계열 = 18종 / 0  ·  출처: grep -rhoE "track\('[a-z_]+'" js/ index.html | sort -u
- 서버 허용 이벤트 = 6종(notification_clicked·received, funnel_signup·goal_created·first_checkin, utm_landing)  ·  출처: api/track.js:8-15
- 시험 파일 수 / streak 언급 / computeStreakDays 단위시험 / 프리즈 단위시험 / 회고 푸시 갈래 시험 = 116 / 8 / 3 / 0 / 0  ·  출처: find tests · grep -rl 'streak'|'computeStreakDays'|'maybeApplyStreakFreeze'|'isMonthEnd' tests/
- push 관련 시험 파일 = 5  ·  출처: grep -rli 'push-dispatch|push-subscribe' tests/
- 복귀 유저·슬럼프 로직 코드 건수 = 0 / 0  ·  출처: grep -rn '오랜만|daysSince|lastSeen|comeback' · '슬럼프|slump|연속 누락|세이프티' index.html js/ api/
- type:'streak' 알림 발신자 = 0  ·  출처: grep -rn "type: *'streak'" index.html js/
- git 커밋 수(얕은 클론 기준, 전체 아님)·최종 커밋 = 197 · 2026-10-08 PR #869  ·  출처: git log --oneline | wc -l · git rev-parse --is-shallow-repository=true
- reports/ 작업 폴더 수 = 364  ·  출처: ls reports | wc -l
- 실제 사용자·구독·D1/D7 리텐션 수치 = null(측정불가 — 운영 DB 접근 없음, 코드에 app_open 이벤트 없음)  ·  출처: docs/sql/2026-10-05-push-subscriptions-owner-check.sql은 SELECT 템플릿만

**있는 것(배선 판정)**

- [partial] 스트릭(연속 기록 일수) 계산·홈 배지·PWA 앱 아이콘 숫자 — js/core/streak-badge.js:27-47 computeStreakDays(records+프리즈 날짜로 역산) · js/tabs/home/home-render.js:62-66 #streakBadge 렌더 · streak-badge.js:50-58 navigator.setAppBadge · index.html:808 <span id="streakBadge"> (기록(checkins)은 Supabase에서 로드되므로 스트릭 숫자는 기기 간 동일하지만, 프리즈 usedDates가 로컬이라 프리즈로 이어진 스트릭은 다른 기기에서 끊겨 보인다. 단위시험 3개(computeStreakDays).)
- [partial] 홈 '내 위치' 줄(이번 주 출석 점·N일 연속·다음 배지까지 M일·새 배지) — js/streaks.js:163-215 renderHome → #homePositionStrip(index.html:812) · streaks.js:48-57 markAttendance → settings.attendance · streaks.js:137-149 syncUnlocks → settings.badgeUnlocks (출석·배지 해금 기록은 settings(localStorage)에만 저장. 4위1체(마크업·로직·피드백)는 갖췄으나 원격 원장 없음.)
- [partial] 스트릭 프리즈(연속기록 보호권) 지급·자동 적용·홈 🧊 배지 — js/core/streak-badge.js:60-87 STREAK_FREEZE_MAX=3·maybeGrantStreakFreeze(7일마다 1개)·maybeApplyStreakFreeze(어제 누락 시 자동 소모) · js/core/app-enter.js:35 앱 진입 시 checkStreakFreeze · js/tabs/records/checkin-helpers.js:35-43 토스트 · home-render.js:67-69 #streakFreezeBadge (settings.streakFreeze는 localStorage 전용(gcal-token.js:64). 프리즈 단위시험 0개. support-modals.js:166 FAQ는 '상점에서 프리즈 사용'이라 적혀 있으나 상점 구매 코드 없음(문구 불일치).)
- [full] 기록 탭 18주 GitHub식 히트맵(칸 클릭→그날 기록 목록) — js/tabs/records/record-heatmap-report.js:19-160 renderRecordHeatmap · record-heatmap-levels.js:19 HEATMAP_WEEKS=18 · record-heatmap-report.js:152-160 cell.onclick→updateSelectedDateInfo · index.html:1192 #recordHeatmap (recViewStats 캐러셀 2번째 슬라이드) · js/tabs/records/render.js:162 호출 (데이터는 Supabase checkins(profile-load.js:111)에서 온 records. recViewStats는 기본 display:none(index.html:1154)이며 성소 탭 '📈 히트맵·통계' 단추(sanctuary-v3-engine.js:657-663 setRecordsSegment('stats'))로 열린다.)
- [full] 성소(기본 테마) 기록 탭 미니 히트맵 + 기간 필터(오늘/이번 주/최근 4주/올해/전체) — js/sanctuary-v3-engine.js:441-478 heatFilter별 칸 수·건수 · :505-509 5개 필터 단추 · :667-671 setHeatFilter 토스트 · :61-65 isFocusSanctuary 기본 테마 · app-defaults.js:26 theme:"focus-sanctuary" ('직접 설정'은 이 필터에 없고 기록 피드 칩(render.js:478)과 기간 AI 카드 날짜 입력에만 있다.)
- [shell] 홈 4주 히트맵 요약 카드 — js/tabs/records/heatmap-summary.js:20-24 card.style.display='none'; innerHTML=''; return; (이후 70줄 도달 불가) · index.html:680 <div id="homeGrassSummaryCard" style="display:none !important;"> · js/tabs/home/sub-heatmap.js:47 위임만 (헌법 GUARD_02가 금지한 display:none !important 은폐 + 조기 return. 홈에는 히트맵이 없다. checkin-capture.js:117 renderHomeGrassSummary 호출도 무의미.)
- [partial] 주간 리캡 모달(주간 실천 수·몰입 시간·스트릭·베스트 순간) + 공유 캔버스 — js/tabs/records/weekly-recap.js:21-37 weeklyRecapStats · :160-273 openWeeklyRecapModal(피드 이동·베스트 기록 열기·카드 공유 버튼 바인딩) · :275 openLegacyRecapCanvasModal · index.html:1045 #btnOpenWeeklyRecap · index.html:5859 #weeklyRecapBtn 리스너 · js/core/registry-init.js:111-116 ?recap=weekly 딥링크 (전부 로컬 state 계산(Supabase 호출 0). 자동 생성·저장 없음(버튼 눌러야 생성). module-metrics --card: '같은 일을 하는 중복 세포 리캡 3'(weekly-recap.js·sanctuary-weekly-recap.js·story-card).)
- [partial] 주간(일요일)/월간(말일) 회고 푸시 발송 갈래 — api/push-dispatch.js:222-290 isSunday/isMonthEnd → 체크인 시각 중 최후 시각(없으면 20:00) 발송, url '/#records' · docs/specs/REQ-TASK-ES-335-REVIEW-PUSH-DISPATCH.md:1-25 (sw.js:53 push 핸들러가 data:{url:'/'}로 고정해 payload의 url('/#records')을 버린다 → 회고 푸시를 눌러도 기록 탭이 아니라 홈이 열림. 회고 갈래 단위시험 0개.)
- [full] Web Push 인프라(sw.js push/notificationclick, VAPID 키 API, push_subscriptions 테이블, pg_cron 매분 발송) — sw.js:37-57 push → showNotification + /api/track notification_received · sw.js:59-90 notificationclick(action-checkin→/?action=checkin) · api/push-subscribe.js:88-97 VAPID 공개키 GET · :109-140 로그인 토큰 검증 후 upsert(checkin_times, timezone) · docs/sql/2026-09-05-push-subscriptions.sql:6-19 테이블+RLS · docs/sql/2026-09-08-push-cron.sql:44-58 cron.schedule('* * * * *') → net.http_post /api/push-dispatch · .github/workflows/push-dispatch.yml:3-8 수동 점검용만 · vercel.json(crons 없음) · package.json web-push ^3.6.7 (실제 도착은 법정 한계(needs-real-device). 발송 로그는 events 테이블 notification_sent(push-dispatch.js:317).)
- [partial] 체크인 시각 서버 푸시 본문 — api/push-dispatch.js:293-311 checkin_times 매칭 → 고정 문구 {title:'아워골', body:'지금 뭐 하고 있었어요?'} · :317 props.body_type:'fixed' (오늘 이미 체크인했는지·스트릭이 끊기려는지 서버가 보지 않는다(checkins 조회 없음). 맥락 문구(D-day·스트릭 경보)는 notification-helper.js:41-91에 있으나 탭 열린 상태 타이머(notify-timer.js:31)에서만 쓰인다.)
- [shell] 설정 화면 '스트릭을 안전하게 지켜드릴까요?' 소프트 애스크 문구 — js/tabs/settings/notify-soft-ask.js:38-41 '저녁 8시까지 체크인이 없을 때 긴급 알림으로 연속 불꽃이 꺼지지 않게' · api/push-dispatch.js:293-311에 '체크인 없을 때' 조건 없음 (약속한 조건부 긴급 알림이 서버에 없다. 앱 밖에서는 설정한 시각에 고정 문구만 온다.)
- [full] 리마인더(체크인) 시간 설정 UI(시간 입력 추가/삭제·추천 4회 프리셋)·알림 스위치 — js/tabs/settings/sub-notify.js:19-51 #checkinTimesRow(index.html:1509) change→saveProfile→syncPushSubscription · :149-170 #notifySwitch(index.html:1516) 소프트애스크→구독 · js/tabs/settings/web-push.js:29-56 checkinTimes·timezone 서버 전송 · app-defaults.js:21 기본 ["10:00","15:00","21:00"], notify:false (서버(push_subscriptions.checkin_times)에 반영되므로 full. 단 notify 기본값 false라 켜지 않으면 아무 알림도 없다.)
- [partial] 야간 방해금지(quiet hours) 설정 — js/tabs/settings/sub-notify.js:172-201 settings.quietHoursEnabled/Start/End 저장(로컬) · js/tabs/settings/notify-timer.js:25 isWithinDND(탭 열림 타이머만) · api/push-dispatch.js:213-218 row.quiet_hours_enabled 읽음 · docs/sql/2026-09-05-push-subscriptions.sql:6-15 quiet_hours 컬럼 없음 · web-push.js:48-53 전송 안 함 (서버 푸시는 방해금지를 모른다(컬럼·전송 모두 없음). 앱 안 타이머에서만 동작.)
- [full] 탭이 열려 있을 때의 앱 내 알림 타이머(20초 주기)·알림 띠('기록하기'→입력칸) — js/tabs/settings/notify-timer.js:20-38 setInterval 20000 → checkinTimes 일치 시 new Notification + showNotifyBanner · :40-50 #notifyBannerSlot(index.html:660) nbOpen→setTab('home')+captureInput.focus · app-enter.js:38 setupNotifyTimer (백엔드 불필요한 로컬 장치. 앱을 닫으면 동작 안 함.)
- [shell] '일일 스트릭 유지 리마인더' 유형별 알림 스위치 — js/tabs/settings/sub-notify.js:221 wireNotifSwitch('notifStreakSwitch','streakReminders') · js/notify-engine.js:164 type==='streak'면 차단 · 전체 grep: type:'streak' 발신자 0건 (스위치는 저장·읽기는 되나 그 유형을 보내는 코드가 없다(죽은 토글).)
- [partial] 전역 알림 엔진(앱 내 플로팅 배너·소리·진동·일정 사전 알림) — js/notify-engine.js:154-200 dispatchGlobalNotification(유형 필터·방해금지·프라이버시 마스킹) · :338-411 checkScheduleReminders(localStorage ourgoal_notified_scheds) · index.html:2252 로드 (앱이 열려 있을 때만. 서버 push와 연결 없음.)
- [doc_only] AI 슬럼프 세이프티 넷(연속 누락 시 제안) — grep '슬럼프|slump|연속 누락|세이프티|missedDays' index.html js/ api/ → 코드 0건(js/tabs/records/ai-feedback-catalog.js:58 '슬럼프 극복' 체크인 피드백 문구 1건·prompt-encyclopedia.js:164 템플릿 설명 1건뿐) · docs/growth/ourgoal-growth-knowledge-base.md:908 'D1·D3·D7 별도 마일스톤 메시지' 계획 (누락 일수를 세는 함수·제안 UI·서버 로직 모두 없음. 문서에도 '슬럼프 세이프티 넷'이라는 명시 기획은 없고 리텐션 벤치마크 정리만 있다.)
- [partial] 루틴 체크 → 상위 목표 진행률 연결 — js/tabs/goals/routine-screen.js:198,218 linkedGoalId를 배지로 표시만 · :292-325 [data-rtchk] 토글→completedDates(settings 로컬)→전수 완수 시 awardXP(10)+confetti+toast · js/tabs/goals/goal-math.js:20-24 goalProgress = 마일스톤 done/total (루틴·체크인 미반영) · docs/sql grep 'routines' 0건 (루틴 완료가 linkedGoal의 마일스톤·진행률을 바꾸지 않는다. 루틴 데이터는 Supabase 테이블 없음(로컬 전용).)
- [partial] 목표 진행률 바 애니메이션 — ui.css:10013-10017 .toss-focus-progress-fill transition: width 0.4s · js/tabs/home/home-render.js:158 innerHTML 문자열로 width 인라인 재생성 · ui.css:412 .daily-quest-fill transition .4s (CSS 전환은 있으나 홈 재렌더가 innerHTML 교체라 새 노드에 최종 width가 바로 박혀 전환이 실제로 재생되지 않는다. 초집중 체크인(focus-autopilot.js:129-147)은 마일스톤 done→renderHome으로 진행률 갱신+confetti는 됨.)
- [partial] 데일리 퀘스트 3종(체크인+30/할일+10/25분 집중+50 EXP) 바 — js/tabs/home/quest-summary.js:45-150 renderDailyQuestBar(오늘 records·milestones로 판정, questRewards 로컬 1일 1회 지급, 각 항목 클릭→입력칸/목표/타이머) · index.html:774 #dailyQuestBarWrap (판정 데이터는 Supabase 기록이지만 보상 지급 기록(settings.questRewards)은 로컬.)
- [full] EXP·레벨(서버 원장 user_ledger_docs) — docs/sql/2026-10-05-xp-ledger.sql:17-26 테이블·RLS · js/avatar/xp.js:254-269 select/insert/update(rev 낙관잠금) · :61-63 로그인 사용자만 서버, 게스트는 settings.xp · checkin-capture.js:101 awardXP(체크인) (유지 장치 중 유일하게 서버 원장화된 상태값. 게스트는 로컬.)
- [partial] 오늘의 미션 카드(목표별 AI 미션 1줄, 하루 캐시) — js/tabs/home/today-mission.js:27-92 renderTodayMissionCard → /api/todaymission(ai-status.js:80-95) 결과를 settings.todayMissions[date]에 캐시 · index.html:665 #todayMissionCard · api/todaymission.js:18-20 Gemini (날짜 캐시가 로컬 settings. 읽기 전용 카드(완료 체크 없음).)
- [full] 자정 날짜 변경 감지(visibility/focus/1분 폴링 → 미션·홈·기록·캘린더 재렌더) — js/core/date-rollover.js:19-51 checkAndHandleDateRollover·setupDateRolloverWatcher · index.html:2152 로드 (로컬 장치. 단위시험 1개(rollover).)
- [full] 기간별 기록 AI 피드백 카드(7/14/30일·이번 달·직접 날짜) — js/tabs/records/period-ai-card.js:17-118 initPeriodAiCard(프리셋·날짜 입력·요청) · :120-178 Gemini(클라 키) → /api/feedback(api/feedback.js:31-32 GEMINI_API_KEY) → 로컬 폴백 · index.html:1208 #periodAiCard, :1215-1218 프리셋 ('5단위 회고' 중 직접 설정에 해당. 결과는 저장되지 않음(화면 표시만).)
- [shell] 5단위 회고·AI 피드백 소블록(records/retrospect) — js/tabs/records/sub-retrospect.js:14 containerId 'recAiFeedbackSlot'(index.html에 id 없음) · :50-51 global.syncRealtimeAiFeedbackSlot 호출 → 전체 grep 정의 0건 · index.html:2176 로드 (존재하지 않는 함수에 위임해 항상 drew=false. 회고 '작성' 흐름(textarea·저장) 자체가 코드에 없다(index.html '회고' 입력 grep 0건).)
- [full] 기록 피드 기간 칩(전체/이번 주/이번 달/지난 달/최근 30일/직접 설정) — js/tabs/records/render.js:472-488 칩·커스텀 날짜 입력 · :556-559 click→state.recordsPeriodFilter (조회 필터일 뿐 회고 결과를 남기지 않는다.)
- [doc_only] 복귀 유저 대응(며칠 만에 돌아왔을 때 화면) — grep '오랜만|돌아오셨|daysSince|lastSeen|lastOpen|comeback|며칠 만에' index.html js/ api/ → 해당 로직 0건 · js/avatar/dynamic-album.js:25 '돌아왔구나!'는 당일 1회차 체크인 인사(checkin_1) · js/tabs/settings/avatar-greeting.js:43-55 시간대(주/야)별 인사만 · docs/growth/ourgoal-daily-roadmap.md:292 RURR/SURR 코호트 측정 계획 (마지막 접속일을 저장·비교하는 코드가 없어 복귀를 감지조차 못 한다.)
- [full] 첫 체크인 튜토리얼 배너·축하 모달·3회 기록 시 게스트 백업 넛지 — js/tabs/records/first-checkin-tutorial.js:20-45 #firstCheckinTutorialBanner(index.html:668) · checkin-capture.js:136-152 triggerFirstCheckinCelebrationModal · :154-157 checkGuestBackupNudge · js/tabs/settings/guest-backup-nudge.js:20-40 (1일차 장치. 로그인 유도는 되나 그 뒤 2일차 이유는 만들지 않는다.)
- [full] 체크인 직후 피드백 묶음(토스트·confetti·햅틱·+10 EXP·AI 판정 시트) — js/tabs/records/checkin-capture.js:101-175 awardXP→saveProfile→events emit→스트릭 배지 갱신→track('checkin', day_index)→토스트/confetti · js/tabs/records/checkin-feedback.js:20-50 renderFeedbackSlot (기록은 Supabase checkins upsert(home-cockpit.js:235-238).)
- [partial] 잠금화면 라이브 카드(스트릭·목표·일정 상시 알림) — js/tabs/calendar/lockscreen-live.js:177-245 enabled 기본 false → reg.showNotification(로컬) · app-enter.js:63 진입 시 sync · localStorage ourgoal_lockscreen_live_v1 (페이지가 띄우는 로컬 알림이라 앱이 떠 있을 때만 갱신. 서버 push 아님.)
- [shell] 바탕화면 위젯 페이지(widget.html) — widget.html:212 localStorage 'ourgoal_state_v1' 읽기 → js/ index.html에 그 키 쓰는 코드 0건 · :220-222 폴백 ourgoal_profile_backup_ → home-cockpit.js:241-249 그 키에는 goals·records 없음 (목표·기록이 비어 그려진다(데이터 배선 끊김).)
- [partial] 리텐션 계측(이벤트 테이블·PostHog) — docs/sql/2026-09-06-events.sql:4-21 events 테이블(anon insert) · js/core/telemetry.js:78-96 track→Supabase events + posthog.capture, dayIndexSinceSignup · 클라 track 이름 18종(checkin·goal_created·signup…), app_open/session_start 0건 · index.html:5-7 PostHog 로드 · api/track.js:8-15 서버 허용 이벤트 6종 (D1/D7/D30 자체를 셀 '앱 열림' 이벤트가 없다. PostHog 자동 pageview에 기대야 한다.)
- [partial] 7일 연속 체크인 시 아바타 제작권 보너스 — js/avatar/wallet.js:60-90 maybeGrantStreakBonus(settings.bonusCraftCredits, lastStreakAwarded) · streak-badge.js:89-100 토스트 (settings 로컬 저장.)
- [partial] 기록 피드 카드 캔버스·스토리 카드 공유(리캡 외 확산 장치) — js/tabs/records/weekly-recap.js:275 openLegacyRecapCanvasModal · js/sanctuary-v3-engine.js:424 #sRecStoryCardBtn→openMzShareCardModal (유지보다 확산 장치. 이번 조사 범위 밖이라 배선 깊이는 재지 않음.)

**없는 것**

- 유지 상태의 원격 원장: 스트릭 프리즈·출석·배지 해금·루틴 완료·퀘스트 보상·알림 설정이 전부 localStorage(ourgoal_settings_<uid>)에만 있어 기기 변경·캐시 삭제 시 소멸(home-cockpit.js:256 saveLocalSettings, profile-load.js:209). 헌법 GUARD_03(로컬 전용 금지) 위반 상태이며 XP만 예외.
- 서버 푸시의 맥락성: 오늘 체크인 여부·끊기려는 스트릭·D-day를 서버가 보지 않고 고정 문구 1종만 발송(push-dispatch.js:311). 설정 화면이 약속한 '8시까지 체크인 없으면 긴급 알림'(notify-soft-ask.js:40)은 미구현.
- 복귀 유저 감지·화면: 마지막 접속일 저장·비교 코드 0건. 3일·7일·30일 만에 돌아온 사람에게 '그동안 기록 요약·다시 시작' 화면이 없다.
- AI 슬럼프 세이프티 넷: 연속 누락 일수 계산·제안 UI·발송 로직 0건.
- 루틴 체크→상위 목표 진행률 전파: linkedGoalId는 배지 표시뿐, goalProgress는 마일스톤 done/total만(goal-math.js:20-24). 매일 하는 행동이 목표 숫자를 움직이지 않는다.
- 홈 화면 히트맵: homeGrassSummaryCard는 display:none !important + 조기 return(index.html:680, heatmap-summary.js:22-24)으로 죽음. 홈에서 과거 기록을 '보는' 장치가 없다.
- 회고 작성 흐름: 오늘/주/달/년 단위로 돌아보고 한 줄 남기는 입력·저장이 없다. 있는 것은 기간 필터와 AI 분석 카드(결과 미저장)뿐이며 retrospect 소블록은 존재하지 않는 함수에 위임(sub-retrospect.js:50).
- 주간 리캡 자동 생성·보관: 버튼을 눌러야 생성, 저장·히스토리 없음. 회고 푸시 클릭 시 sw.js:53이 url을 버려 홈으로만 열림.
- 서버 방해금지: push_subscriptions에 quiet_hours 컬럼·전송 코드 없음(SQL·web-push.js:48-53) → 새벽에도 설정 시각이면 발송.
- 죽은 토글: '일일 스트릭 유지 리마인더' 스위치(sub-notify.js:221)를 보내는 발신자 0건.
- 리텐션 측정 자체: app_open/D1/D7 이벤트 없음(telemetry.js track 이름 18종 중 0건). 투자자 질문(유입·유지)에 숫자로 답할 계측이 없다.
- 프리즈·회고 푸시 단위시험 0건(maybeApplyStreakFreeze 0, review 갈래 0).
- 위젯(widget.html)은 존재하지 않는 localStorage 키를 읽어 목표·기록이 빈 채로 그려짐.

## 계측·실제 트랙션

**요약**: 계측 배관은 실제로 깔려 있다: index.html 머리에 PostHog 스니펫(세션 리플레이 포함)이 들어 있고, js/core/telemetry.js 의 track() 이 PostHog capture 와 Supabase `events` 테이블(2026-09-06 운영 실행 확인)에 이중 기록하며, 클라이언트가 18종·24곳에서 가입·온보딩·목표·체크인·초대·응원 이벤트를 보내고 UTM/ref 첫 유입을 보존한다. 그러나 그 결과를 읽는 쪽은 아무것도 없다 — 관리자 대시보드·집계 스크립트·정기 내보내기가 코드에 0개이고, 저장소 어디에도(dev_log·docs/growth·audit·reports) 실제 유저 수·설치 수·활성 수가 한 줄도 적혀 있지 않다(유일한 실물 증거는 2026-09-18 PostHog 이벤트 정의 화면 캡처 1장, 수치 없음). 분석 데이터에 사용자 식별이 없어(posthog.identify 0회, events.sid 는 기기별 익명) 기기 단위 리텐션은 SQL/PostHog 로 가능하지만 사람 단위·기기 교차 리텐션은 불가능하고, 공유·초대 링크(/share)는 utm/ref 를 싣지 않아 바이럴 유입 경로별 전환을 잴 수 없다. Google Play 비공개 테스트는 개발자 계정 미등록·테스터 0명으로 시작조차 안 됐고(reports/T006/claims.json C6~C8), 서버의 funnel_*·utm_landing 허용 목록은 호출부가 0개인 죽은 코드다. 결론: 측정된 실유저 수치 없음.


**콜드스타트 판정**: 유저 0명·친구 0명인 신규 유저에게 이 영역이 주는 것은 없다. 계측은 전부 보이지 않는 배관(PostHog·events 테이블)이라 유저 화면에 '진실된 데이터'로 돌아오는 것이 하나도 없고(공개 통계·동료 수·코호트 표시 0), 운영자조차 숫자를 보려면 PostHog 를 손으로 열어야 하며 저장소에는 단 한 건의 실측 유저 수치도 없다. 공유·초대 링크는 유입 채널을 싣지 않고 카카오 공유는 복사 폴백뿐이라 바이럴 루프가 돌았는지조차 알 수 없으며, 스토어 채널(Google Play)은 시작 전이다. 요약하면 '잴 준비는 절반, 잰 것은 0, 보여주는 것은 0' — 투자자 지적(유입도 바이럴도 증거가 없다)은 현재 저장소 실물 기준으로 사실이다.


**측정 수치**

- 측정된 실제 유저 수·설치 수·활성 수 = null (저장소 어디에도 기록 없음; 라이브 조회 자격증명 없음)  ·  출처: grep dev_log.md(모지바케 복원 포함)·docs/growth·docs/audit·docs/audits·reports·docs/claims; env | grep SUPABASE|POSTHOG = 0
- 클라이언트가 보내는 고유 이벤트 이름 수 / 호출부 수 = 18종 / 24곳  ·  출처: grep -rhoE "track\('[a-z_]+'" index.html js | sort -u | wc -l ; 호출부 grep -c
- 서버 ALLOWED_EVENTS 수 / 그중 클라이언트 호출부가 있는 것 = 6 / 2 (notification_received·notification_clicked, sw.js:46,75) — funnel_*·utm_landing 4종은 호출부 0  ·  출처: api/track.js:8-15 · grep -rn 이벤트명 (docs/reports/tests 제외)
- 서버가 직접 events 에 넣는 이름 = 4 (notification_sent, review_notification_sent, companion_ledger, settings_ledger)  ·  출처: grep -rhoE "name: '[a-z_]+'" api/push-dispatch.js api/track.js | sort -u
- posthog.identify 호출 수 = 0  ·  출처: grep -rn posthog.identify index.html ui.js js
- events 테이블 운영 실행 일시 = 2026-09-06 21:10 (anon select 200 [] 확인 기록)  ·  출처: dev_log.md:707-711 (cp949→utf8 복원)
- PostHog 이벤트 정의 캡처의 이벤트 행 수 / 날짜 = 22행 / 2026-09-18 (수치·유저 수 없음)  ·  출처: docs/growth/evidence/posthog-events-10of10-2026-09-18.jpg 육안 계수; 참조 문서 0개
- Lighthouse PWA 점수 = 0.88 (2026-09-08T23:58:22Z, ourgoal-app.vercel.app)  ·  출처: docs/pwa/lighthouse-pwa-2026-09-09.report.json categories.pwa.score
- 운영 서버 응답(index.html / assetlinks) = index.html 200 (1,815,369B) / assetlinks 404 — 2026-09-20T22:53Z 시점  ·  출처: docs/audits/2026-09-21-ES-199/evidence/prod-check.out.json
- Google Play 테스터 등록 수 / 개발자 계정 = 0명 / 미등록  ·  출처: reports/T006/claims.json C6·C7; docs/directives/ACTIVE.md:61
- PR #356(Play 준비)·#351(피드백 SLA) 상태 = 둘 다 state=closed, merged_at=null (파일은 이후 main 에 존재)  ·  출처: gh api repos/yangsangmin/ourgoal-app/pulls/356, /351
- 성장 로드맵 항목 수 / 실측 결과가 적힌 항목 = 229건 / 0건  ·  출처: docs/growth/ourgoal-daily-roadmap.md:3; grep '결과:|실측|측정값' 0
- dev_log 의 PostHog 언급 수 / 유저 수 기록 = 0 / 0 (개별 실유저 사례 2건: dev_log.md:3492, :3560)  ·  출처: python 복원 grep (posthog|가입자|실유저|유저 수|MAU|DAU|WAU)
- Kakao SDK 로드·init 수 = 0 (공유 버튼은 클립보드 폴백)  ·  출처: grep Kakao.init|kakao sdk index.html js; js/team-recruit.js:379-392
- privacy.md 의 PostHog 고지 = 0건 (Supabase·Vercel 만 기재)  ·  출처: docs/legal/privacy.md:43-47 grep
- git 이력 깊이 = 197 커밋(2026-10-06 이후 shallow) — 9월 계측 작업의 커밋 일자는 복원 불가, dev_log 일자 사용  ·  출처: git log --oneline | wc -l; git log --date=short | tail -1

**있는 것(배선 판정)**

- [full] PostHog 스니펫(제품 분석 SaaS) 설치 — index.html:5-11 — posthog.init('phc_A2AD…', api_host us.i.posthog.com, person_profiles 'identified_only', session_recording 입력 마스킹) (posthog.identify 호출은 저장소 전체에 0개 → 모든 이벤트가 기기 익명 distinct_id 로만 쌓인다. 로컬/법정 실행에서는 CORS 로 차단됨(reports/TASK-ES-446/dom-compare-inline-p2-1.json:444))
- [full] track() 이중 기록(PostHog capture + Supabase events insert) — js/core/telemetry.js:78-88 — posthog.capture 뒤 L.sb.from('events').insert({sid,name,props}) fire-and-forget (실패는 조용히 무시. 게스트도 anon 키로 insert 가능(RLS insert-only))
- [full] UTM/ref 첫 유입(first-touch) 보존 — js/core/telemetry.js:20-35 parseAttribution(utm_source/medium/campaign/ref 만, 80자) · :45-56 getAttribution → localStorage ourgoal_attrib 첫 유입만 저장 (가입 이벤트에 병합됨(js/core/profile-load.js:206-207, js/tabs/settings/device-session.js:129-130). 단 /share 링크·초대 링크에는 utm/ref 가 없어 공유 유입은 '채널 없음'으로 잡힌다)
- [partial] landing_view(하루 1회/기기) 계측 — js/core/telemetry.js:64-76 recordLanding · 호출 js/core/app-boot.js:243(부트 6단계 '기본 랜딩 화면') (로그인/게스트 복원 분기는 그 전에 return 하므로(app-boot.js:228-236) 재방문 로그인 유저는 landing_view 가 안 찍힘. 방문 집계는 PostHog 자동 Pageview 에 의존)
- [full] 클라이언트 퍼널·행동 이벤트 18종 — grep 실측: signup/signup_completed(profile-load.js:206-207, device-session.js:129-130) · onboarding_step_viewed/completed(js/tabs/settings/onboarding.js:49,129,242) · goal_created(telemetry.js:100, 호출 5곳) · checkin/checkin_completed(quick-checkin.js:109-110, checkin-capture.js:133-134) · cheer_sent(feed-comments.js:174) · dm_sent(manito-real.js:470) · invite_sent/opened(peer-invite.js:51-53) · content_reported · layout_* · app_installed_pwa(index.html:6233) (모든 이벤트에 day_index(가입 후 경과일, telemetry.js:90-96) 속성이 붙는다)
- [full] Supabase `events` 테이블(익명 sid·name·props·created_at) — docs/sql/2026-09-06-events.sql:4-21 — 테이블·인덱스 2개·RLS(anon/authenticated insert-only, select 불가) · 운영 실행 기록 dev_log.md:707-711(2026-09-06 21:10 'events 테이블 존재(anon select 200 [])') (조회·집계는 service_role 로만 가능하나 그 조회 코드가 저장소에 없다. 같은 테이블을 companion_ledger·settings_ledger 데이터 원장으로도 쓴다(api/track.js:147,163,361,384) → 분석 쿼리 시 섞임)
- [shell] 서버 계측 엔드포인트 /api/track 의 이벤트 허용 목록 6종 — api/track.js:8-15 ALLOWED_EVENTS(notification_clicked, notification_received, funnel_signup, funnel_goal_created, funnel_first_checkin, utm_landing) · insert api/track.js:1121 (funnel_signup·funnel_goal_created·funnel_first_checkin·utm_landing 을 보내는 코드가 저장소 전체에 0개(테스트 scripts/smoke-test.js:2307-2310 는 문자열 존재만 검사). 실제 호출은 sw.js 의 notification_* 2종뿐)
- [full] 푸시 알림 발송/도착/클릭 계측(CTR 재료) — api/push-dispatch.js:317 notification_sent insert · sw.js:43-46 notification_received · sw.js:72-75 notification_clicked → /api/track (CTR 계산은 docs/sql/2026-09-06-events.sql:26-27 의 주석 SQL 예시뿐, 실행 스크립트 없음)
- [doc_only] 관리자/지표 대시보드 — 코드에 admin·대시보드 조회 경로 0개(api/, js/core, index.html grep) · docs/sql/2026-09-06-events.sql:23-27 주석 예시 쿼리 · docs/growth/ourgoal-daily-roadmap.md:59 'Product Health 대시보드', :289-297 T028 리텐션 대시보드 (로드맵 T005 완료 기준 '대시보드 URL' 은 저장소 어디에도 기록되지 않음)
- [partial] PostHog 라이브 수신 증거 캡처 — docs/growth/evidence/posthog-events-10of10-2026-09-18.jpg — Event definitions 화면, 22행(Autocapture·Pageview·checkin·signup 등), 'last seen' 상대 시각만 (이벤트 '수'나 유저 수는 캡처에 없음. 이 파일을 참조하는 문서 0개(grep). dev_log 에 PostHog 언급 0건(모지바케 복원 후 재검색))
- [full] 운영 배포 주소 https://ourgoal-app.vercel.app — index.html:26 og:url · capacitor.config.json server.url · docs/audits/2026-09-21-ES-199/evidence/prod-check.out.json(2026-09-20T22:53Z index.html 200, 1,815,369B) (Vercel Analytics/Speed Insights 미설치(grep 0). vercel.json:28-30 '/share'→api/track 재작성)
- [full] PWA 설치 가능성(Lighthouse) — docs/pwa/lighthouse-pwa-2026-09-09.report.json — categories.pwa.score 0.88, fetchTime 2026-09-08T23:58:22Z, finalUrl ourgoal-app.vercel.app (설치 이벤트 app_installed_pwa 는 index.html:6233 에서 계측)
- [partial] Google Play 비공개 테스트 준비(TWA/AAB·assetlinks) — .well-known/assetlinks.json(업로드 키 지문 1개, 패키지 com.yangbis.ourgoal) · capacitor.config.json · android/app · .github/workflows/build-apk.yml · reports/T006/claims.json C5 '09-17 AAB 실폰 설치 실행' (Play 앱 서명 키 지문은 미추가(런북 3-A 단계 미수행). 2026-09-20 운영 assetlinks 404(prod-check.out.json), PR #356 은 병합 없이 closed(gh api), 파일은 이후 main 에 존재)
- [doc_only] Google Play 비공개 테스트 실제 진행 상태 — reports/T006/claims.json C6 '개발자 계정 등록 못 함' · C7 'Play Console 앱 생성·트랙·AAB 업로드·테스터 16명·옵트인 링크 확보 못 함' · C8 '스토어 등록정보 미입력' · docs/directives/ACTIVE.md:61 '시점 미정 — 앱 준비가 끝난 뒤' (런북 docs/GOOGLE_PLAY_CLOSED_TEST_RUNBOOK.md(최종 2026-09-17)·가이드(2026-09-11)는 절차서일 뿐 진행 기록 없음. 테스터 0명)
- [partial] 공유 OG 랜딩 /share (템플릿·피드·모임·목표 완주) — api/track.js:218-262 handleShareOg — OG 메타 생성 후 /?template= /?feed= /?invite_group= /?goal= 로 보냄 (share 조회 이벤트 insert 없음(api/track.js:195-262 내 events 0), 목적지 URL 에 utm/ref 없음 → 바이럴 유입이 유입 채널로 잡히지 않음)
- [partial] 초대 링크 계측(invite_sent/invite_opened) — js/tabs/comm/peer-invite.js:45-55 trackPeerInvite · :64 share 클릭 시 invite_sent · :211 showPeerInviteLandingModal 진입 시 invite_opened · URL 생성 js/tabs/comm/peer-invite-text.js:28 (invite_sent 는 '공유 버튼 클릭'이지 실제 전달이 아님. 착지 모달은 L.MOCK_GROUPS 를 찾음(peer-invite.js:211). peer_invite_* props 에 user_id 를 넣음(peer-invite.js:46) — events.sql:6 'user_id 저장 안 함' 원칙과 충돌)
- [shell] 카카오톡 공유 버튼 — js/team-recruit.js:379-392 — window.Kakao.isInitialized() 일 때만 Kakao.Share.sendDefault, 아니면 클립보드 복사 폴백 · index.html/js 에 Kakao SDK 스크립트·Kakao.init 0개(grep) (실제로는 항상 '초대 메시지가 복사되었어요' 폴백만 동작)
- [partial] N일차 리텐션 재료(day_index·sid·created_at) — js/core/telemetry.js:90-96 dayIndexSinceSignup(profile.createdAt 기준) · events 테이블 sid/created_at 인덱스(docs/sql/2026-09-06-events.sql:12-13) (기기(sid) 단위 D1/D7 는 SQL 또는 PostHog 리텐션 인사이트로 계산 가능하나 계산 코드·뷰·스크립트 0개. 사용자 식별이 없어 기기 교차·재설치 후 리텐션은 불가. 로드맵 T028(docs/growth/ourgoal-daily-roadmap.md:289-297)은 문서만)
- [full] 계측 단위 테스트 — scripts/smoke-test.js:702-716 parseAttribution 3건 · :754-781 getSid/getAttribution 불변식 · :899 recordLanding 게이트 순서(BACKLOG.md:79 AUD-8, PR #85 2026-09-08) (PostHog 수신·events insert 자체는 테스트되지 않음(로컬에서 CORS/404))
- [full] 1:1 문의·버그 제보 접수 및 SLA 도구 — api/track.js:1082-1086 handleInquiry(/api/inquiry → inquiries 테이블 insert api/track.js:488 + 노션 원장) · scripts/feedback-sla.js:1-30(add/triage/resolve/check, NOTION_TOKEN) (접수 건수는 저장소에 기록 없음(노션 DB 3dd598db-…에만). PR #351 은 병합 없이 closed, 스크립트는 main 에 존재)
- [partial] 실제 유저 존재의 정성 증거 — dev_log.md:3490-3493(2026-09-16 '실제 유저 카카오톡 채팅방 URL 유입 시 로그인 무한 튕김' 제보) · dev_log.md:3558-3560(2026-09-16 '실제 유저(김도아) 아이폰 화면' 결함) (수치가 아니라 개별 사례 2건. 유저 수로 환산 불가)
- [doc_only] 성장 로드맵·지표 정의 문서 — docs/growth/ourgoal-daily-roadmap.md:3 '총 229건' · :52-61 T005(PostHog 10개 이벤트·대시보드) · :395-403 T038 'W1 지표: 설치·가입·활성화율·D1·D7·TTV·옵트인율' · docs/growth/ourgoal-growth-knowledge-base.md:3 '1개월 5천명 → 2개월 3만명' 목표 (229건 중 결과 수치가 적힌 항목 0건(grep '결과:|실측|측정값' 0건). 콘텐츠 60편(T048)·초대 템플릿 3종(T004)도 문서)
- [partial] 개인정보처리방침의 분석 도구 고지 — docs/legal/privacy.md:43-47 제3자 제공·위탁에 Supabase·Vercel 만 기재, PostHog 언급 0건(grep) (PostHog 세션 리플레이(입력 마스킹)까지 돌고 있어 고지 공백. 투자자 실사 시 지적 가능)
- [doc_only] 오류 추적·가동 모니터링 — Sentry·오류 추적 SDK grep 0(템플릿 데이터 js/data/goal-templates/study.js:178 문구만) · PostHog Error tracking 메뉴는 캡처에 보이나 코드 설정 없음 (실유저 장애를 자동으로 알 길이 없음(1:1 문의 의존))

**없는 것**

- 측정된 실유저 수치 없음 — 저장소 전체(dev_log.md 6,049줄 모지바케 복원 검색 포함, docs/growth·audit·audits·reports·claims)에 유저 수·설치 수·활성 수(DAU/WAU/MAU)·가입자 수가 단 한 건도 없다. 이 환경에는 SUPABASE/POSTHOG 자격증명도 없어 라이브 조회로 보충하지 못했다(env grep 0)
- 지표를 읽는 코드 0개: 관리자 대시보드·집계 스크립트·정기 내보내기(.github/workflows 5개 중 events/posthog 0)·노션 지표 DB 적재 모두 없음. events 테이블은 service_role 로만 읽히는데 그 읽기 코드가 없다
- 사용자 식별 부재: posthog.identify 0회, events.sid 는 기기 익명 → 사람 단위 리텐션·기기 교차·재설치·앱(TWA)↔웹 연결 불가. 가입 전후의 같은 사람을 잇지 못한다
- 유입 경로별 전환을 지금 코드로 '부분만' 잴 수 있다: utm_*·ref 가 붙은 링크 → landing_view(sid) → signup(sid, utm 병합) 까지는 SQL 로 가능. 그러나 /share·초대 링크는 utm/ref 를 싣지 않고 share 조회 이벤트도 없어, 바이럴(공유·초대) 채널은 '채널 없음'으로 섞이고 K-factor 를 계산할 수 없다
- N일차 리텐션: 재료(sid·created_at·day_index)는 있으나 계산하는 SQL 뷰·스크립트·PostHog 코호트 설정 기록이 0. 기기 단위 D1/D7 는 지금 당장 SQL 로 뽑을 수 있지만 아무도 뽑은 기록이 없다. 로그인 재방문은 landing_view 를 안 찍어 '복귀' 신호가 PostHog Pageview 에만 있다
- 서버 퍼널 이벤트(funnel_signup·funnel_goal_created·funnel_first_checkin·utm_landing) 허용 목록은 호출부 0개의 죽은 코드 — 서버 측 퍼널은 존재하지 않는다
- Google Play 비공개 테스트 미착수: 개발자 계정 미등록(돈·신분확인 결심 대기, ACTIVE.md:61), Play Console 앱·트랙·AAB 업로드·테스터 0명·옵트인 링크 없음(reports/T006 C6~C8). 설치 수를 잴 스토어 채널 자체가 없다
- 카카오톡 공유는 SDK 미초기화로 항상 클립보드 복사 폴백 — '확실해 보이는 바이럴 요소'를 코드가 뒷받침하지 못하고, 공유 성공 여부도 계측되지 않는다
- PostHog 10/10 수신 캡처(2026-09-18)는 어떤 문서·보고·claims 에도 연결되지 않았고 대시보드 URL 도 기록되지 않아 T005 완료 기준(스크린샷+대시보드 URL) 중 절반만 존재한다
- 개인정보처리방침에 PostHog(세션 리플레이 포함) 미고지, peer_invite_* 이벤트에 user_id 혼입(events.sql:6 원칙 위반) — 실사 리스크
- 오류 추적(Sentry 등)·가동 감시 없음 — 실유저 장애를 1:1 문의로만 안다
- roadmap 229건의 지표 목표(지인 D1 60%·D7 35%, PMF 40%)는 전부 문서이며 실측 결과 행이 0건


# 부록 B. 세 전략과 반박에서 살아남은 것 / 치명 반박


## 데이터·콘텐츠 우선 (콜드스타트를 진짜 사람의 목표 여정과 검증된 구조로 채운다)

논지: 투자자 지적은 실측과 정확히 일치한다: 지금 앱에서 진실된 것은 '내가 방금 적은 한 줄'뿐이고 남의 데이터는 0이며, 화면을 채우는 '실사용자 템플릿 복제 142~412회·응원 54~91·예시 팀 55개의 참여 인원과 달성률 65%·실제 우수 사용사례 6인'은 전부 하드코딩된 허구라 진실성 기준에서는 0이 아니라 마이너스다. 그래서 유저를 모으기 전에 회사가 먼저 데이터 공급자가 된다 — 대표 본인과 파운딩 코호트 30명의 실제 30일 기록, 60종 템플릿마다 실제 완주자·합격자 1명 이상의 검증된 여정(실제 마일스톤 달성 주차·주간 루틴·실패 지점·걸린 기간·KPI 시작→끝)을 출처와 검증 등급을 붙여 싣고, 허구 수치는 전부 걷어낸다. 이 데이터는 그 자체로 검색 유입 자산(목표별 '실제로 해 본 사람들의 데이터' 페이지)이자 바이럴 아티팩트(내 완주 여정이 다음 사람의 템플릿이 되는 루프)이며, 유지는 '내 기록이 서버에 쌓여 남에게 유익해진다'는 사실 하나로 만든다.


### 렌즈: 냉정한 투자자 — 소비자 앱 다수 투자 경험, 저장소 실측 JSON과 직접 grep 결과만을 근거로 반박
살아남은 주장:
- 허구 수치(실사용자 템플릿 작성자·복제·응원, 예시 팀 참여 인원·달성률, '실제 우수 사용사례' 6인, 프로필 모달 streak 7/Lv.2, 팀 톡방 시드 3건)를 전부 걷어내고 '0이면 숨김'으로 간다 — 비용 0, 진실성의 전제로 옳다(결심 ③만 필요).
- 계측 선행(app_open·가입 시 posthog.identify·D1/D7 집계 뷰·죽은 funnel_* 정리)을 1주차에 두는 순서 — 이것 없이는 90일 뒤에도 '잰 것 0'이라는 진단이 정확하다.
- 실측으로 확인된 초대 루프 결함 3건(peer-invite-text.js:28 type 덮어쓰기, api/track.js handleShareOg 4종 한정, 로그인 세션 경로에서 handleDeepLinkRouting 미호출)과 카드 워터마크의 죽은 /share/<userId> 주소를 고치는 것 — 구체적이고 하루 이틀짜리다.
- 60종 템플릿의 '1초 이식'이 지금 앱에서 유일하게 존재하고 작동하는 '유익한 데이터' 자산이라는 판단 — 쐐기를 여기에 둔 것은 맞다(단, 대상 템플릿이 보통 사람용이어야 한다).
- AI 결과에 provider(gemini/local_smart)를 표시하고 정형문구를 AI 로 포장하지 않는 것, 피드백을 checkins meta 에 저장하는 것 — 진실성·영속성 모두 옳다.
- K<1 을 숨기지 않고 '단독 성장 엔진이 아니다'라고 적은 것, 모든 목표치를 '가설'로 표기한 것 — 정직하다(다만 그 정직함이 D45 300·D120 5,000 숫자까지 지우지는 못했다).
- 검색량이 큰 보통명사 목표를 우선한다는 방향 — 맞다. 단 그 목표들에 맞는 템플릿이 현재 60종에 없으므로 '템플릿 신설'이 먼저다.
- Pre-PMF 단계에서 유료 광고를 배제한 것 — 맞다. 지금 광고를 돌리면 2일차에 사라지는 유저를 돈 주고 산다.
- 게스트 기록을 기기 밖(서버)에 남겨야 한다는 문제 인식 — 맞다(방법은 서명된 게스트 토큰이어야 한다).
치명 반박:
- first_90_days: 13주 안에 계측·허구 제거·코호트 30명 운영·인터뷰 20명(1시간+증빙)·앰배서더 24h 당번표·질문 은행 90개·goal_journeys 테이블·공개 페이지·routines 60종·같은 템플릿 질의·집계 뷰·복귀 화면·리캡 자동화·푸시 맥락화·딥링크 3건 수정·검색 페이지 60개·여정 발행 기능·첫 실측 보고서를 1인이 다 한다 — 이 전략은 병목(사람 손)을 없애지 않고 사람 손을 더 늘린다. 저장소가 보여주는 1인 실행 속도는 '코드로 되는 것만 된다'이다: 로드맵 D0~2의 [손 필요] 항목은 29일(오늘 D29) 동안 수행 기록 0, 초대 발송 체크리스트 0/4, 콘텐츠 큐 39행 발행 0, 돈 결심 1건은 9월부터 '시점 미정'. 그런데 새 계획의 핵심(코호트 관리·인터뷰·당번·질문 은행)은 전부 그 [손 필요] 유형이다. 게다가 [신규]·[보강] 약 20건은 헌법상 각각 REQ 8원칙·claims.json·법정 판정·세포지도 갱신을 거치는 PR이라 코딩 시간조차 13주에 안 들어간다. weaknesses_admitted 가 스스로 '보장이 없다'고 적었으면 그건 계획이 아니라 소망이다.
- retention 2일차: 코호트 당번의 24h 실제 응원 + 서버 알림 + '2일 연속' 스트릭 + 맥락화된 푸시가 2일차 복귀 이유가 된다 — 전략이 설계한 주 유입 경로는 '여정 페이지 → 게스트 템플릿 이식(가입 불필요) → 첫 체크인'인데, 2일차 장치 3개가 전부 게스트에게는 닿지 않는다. (1) 푸시: web-push.js:33 은 로그인 토큰 없으면 구독 요청 자체를 안 하고, push_subscriptions.user_id 는 uuid NOT NULL FK → 게스트 구독은 스키마상 불가능. notify 기본값 false, 소프트애스크는 설정 탭에서만. (2) 당번 응원: feed_posts insert 는 authenticated 만이라 게스트는 첫 글을 못 쓰고, 당번이 응원할 대상 글이 없다. (3) 스트릭·배지·프리즈는 localStorage. 즉 가장 많은 사람이 들어올 문으로 들어온 사람에게 2일차 복귀 신호는 0개다. 사람이 2일차에 안 돌아오는 진짜 이유(습관 전, 리마인더 없음, 약속 없음)를 유일하게 확장 가능하게 다루는 장치(푸시)를 자기 퍼널이 못 쓴다.
- viral_loop 측정식 K = P20% × S60% × V15 × C8% × R7 40% ≈ 0.058, 그리고 acquisition 1단계 '코호트 30 → D45 가입 300명' — 각 항이 낙관이고, 그 낙관을 그대로 써도 1단계 산수가 안 맞는다. 전략 자신의 가정(코호트 1인 공유 3회, V=15, C=8%)으로 계산하면 30×3×15×0.08 = 108 명의 '게스트 이식'이고, 인터뷰이 20명이 같은 비율로 공유해도 +72 → 180 게스트. 가입은 게스트의 일부(카카오 로그인)인데 그 전환율은 측정값 0이고 전략의 R7 40% 논리로도 100% 일 수 없다. 100% 로 놓고 지인 50명을 다 더해도 ≈250 < 300. 항별로는: P 20% 는 '전체 가입자의 1/5 이 30일 완주+로그인+공개 동의'인데 앱에는 D30 측정값 자체가 없다; S 60% 는 자기 30일 기록을 SNS 에 올리는 비율인데 저장소에 '첫 공유 건수' 기록 0; V 15 는 1:1 카톡(1 조회)이 아니라 팔로워 있는 공개 계정을 전제한다 — 코호트는 지인이지 인플루언서가 아니다. 현실적 K 는 0.01 미만이며 '느린 루프'가 아니라 루프가 없는 것이고, D45→D120 (300→5,000, 16배)은 K<0.1 과 '색인 3~6개월 지연'을 동시에 인정한 뒤에도 그대로 남아 있다.
- thesis: '유저보다 검증된 진짜 여정이 먼저 온다' — 사람들이 남의 완주 여정을 보고 그 구조를 이식하려 할 것이다 — 이 각도 전체가 검증 안 된 가정 위에 13주짜리 개발·운영을 쌓는다. 저장소에 Mom Test 0건, PMF 설문 0건, 사용자 인터뷰 0건인데 W1 은 '계측'과 '허구 제거'(엔지니어링)이고, '여정 페이지를 20명에게 보여주고 반응을 재는' 가장 싼 검증은 어디에도 없다. weaknesses_admitted[4] 가 '검증되지 않았다'고 자백한 명제를 W2 에 테이블부터 만든다. 가설이 틀리면 goal_journeys·공개 페이지·routines·인터뷰 20명이 전부 매몰비용이다.
투자자가 던질 질문: 대표의 지인·코호트·인터뷰이를 전부 빼고, 당신이 모르는 사람 가운데 이 앱을 7일째에 다시 연 사람이 지금 몇 명이고, 그 숫자를 어느 쿼리가 세고 있습니까 — 0명이라면 그 첫 한 명을 언제까지, 무엇으로 증명하겠습니까?

### 렌즈: 실행 현실(현재 코드 상태) — 저장소 실측 JSON + /home/user/ourgoal-app 읽기 전용 재확인(feed_posts RLS·checkins 레코드 필드·goals upsert 컬럼·MOCK_GROUPS 수·credit_settings 주석·robots/sitemap·git 병합 수)
살아남은 주장:
- 허구 수치를 먼저 걷어낸다는 전제 — 실사용자 템플릿 6+6·루틴 4·팀 4·우수사례 6·예시 팀 11 의 작성자/복제/응원/달성률이 하드코딩이고, 같은 화면에서 서버 실복제 수는 0이라 숨겨지는 모순은 코드로 확인된다(template-encyclopedia.js:266-273, template-credit.js:1-15).
- 대표 본인과 로그인한 코호트가 feed_posts 에 쓰면 '로그인 회원'의 피드는 실제로 채워진다 — 전역 최신 50건·Realtime 배선은 full 이고, 반응 3종·댓글·helpful_reasons(target_type 에 goal_template 허용 확인: helpful-reason.sql:40)·template_copies·top_helpful 은 실데이터만 표시하도록 설계돼 코호트 데이터가 들어오는 순간 진짜가 된다.
- W1 계측 선행(app_open·posthog.identify·기기 기준 D1/D7 뷰·funnel_* 정리)은 가장 싸고 정확한 항목이다 — 재료(sid·created_at·day_index)는 이미 있고 읽는 코드만 없다.
- 서버 전문가 매칭이 '다이어트·토익·독서·명상·러닝·체지방·영어회화·코딩' 8/9 를 null 로 돌려보내는 영역을 인터뷰 우선순위로 삼은 판단은 실측과 일치한다.
- 60종 템플릿(4마일스톤×3할일)·1초 이식·Gemini 게이트웨이·푸시 인프라(VAPID·pg_cron)·위클리 리캡·완주 인증서 캔버스가 '있음'이라는 전제는 맞다 — 새로 지을 것은 '진짜 데이터가 흐르는 길'이지 엔진이 아니다.
- '같은 테마' 수준의 동류 집계는 지금 스키마로 가능하다(checkins.theme 컬럼, count_same_theme_checkins_today 가 anon 에도 grant) — 전략을 '같은 템플릿'에서 '같은 테마'로 한 단계 내리면 1일차 동류 카드가 비지 않는다.
- K<1 솔직 인정, 모든 목표치의 가설 표기, '허구를 걷어내면 2주간 더 빈 화면'을 감수한다는 서술은 GUARD_05 정신에 맞다.
- 코드 생산성은 병목이 아니라는 전략의 암묵 전제는 맞다 — 사흘 병합 82건(실측). 병목은 전적으로 사람 손이다.
치명 반박:
- D.4·1단계: '로그인 없이 둘러보기' 게스트가 축하 모달 동류 러너·피드 상단에서 코호트 실유저 카드를 보고, 여정 페이지에서 '이 구조 그대로 시작' 1탭(가입 불필요) → 첫 체크인으로 '남의 진짜 기록'을 1일차에 경험한다 — feed_posts 의 select 정책이 auth.role()='authenticated' 이다. 게스트는 anon 키라 코호트 30명이 900건을 써도 0행을 받고, 화면은 지금처럼 '아직 공유된 실천이 없어요'다. 전략의 1일차는 로그인한 사람에게만 성립하는데, 가입 경로는 카카오 단일(구글·이메일 가입 display:none), 설정의 게스트 가입 버튼은 미정의 함수(openAuthModal) 호출, '닉네임 1초 시작'은 로그인 화면으로 끝난다. RLS 를 anon select 로 열면 공개 동의 없는 전 회원 글이 비회원·검색엔진에 노출돼 승인선 ②에 걸린다. 90일 계획 어디에도 게스트 읽기 경로 설계나 가입 경로 수리가 없다.
- 바이럴 루프의 행동(마일스톤 달성·30일 완주)을 'checkins meta.goalId 로 서버가 판정, 손으로 선언하지 않음'; 템플릿별 7일 생존율·평균 완주 주차 집계 뷰·'같은 템플릿' 서버 질의·K 식의 C·R7 — 데이터 체인이 두 곳에서 끊겨 있다. (1) 홈 한 줄 체크인(checkin-capture.js)과 quick-checkin 레코드에는 category·theme·visibility 만 있고 goalId 가 없다 — goalId 를 쓰는 곳은 초집중 체크인(focus-autopilot.js:119) 하나뿐이라 '체크인→목표' 연결이 대부분 비어 있다. (2) goals upsert 컬럼은 id·user_id·title·category·due_date·visibility·topic·archived_at 으로 template_id 가 없고 cloneTemplate 도 tplId 를 저장하지 않는다 — '목표→템플릿' 연결이 없다. (3) 마일스톤 done 은 사용자가 체크박스로 손으로 선언하는 값(goalProgress = ms done/total)이라 '서버 판정'이 아니다. 따라서 같은 템플릿 질의·템플릿별 생존율·실제 달성 주차·K 의 C/R7 는 지금 스키마로 잴 수 없고, 90일 계획에 goals.template_id 추가·체크인 goalId 부착 항목이 없다.
- 운영 노동은 인정하되 '가장 적은 손으로 가장 진실한 데이터'를 고른 전략이다 — 코호트 30명 운영·인터뷰 20명·증빙 확인·24h 당번표·질문 90개·콘텐츠 8편·지인 50명 1:1 발송을 대표 1인이 13주 안에 수행 — 실측 이력이 반대를 말한다. 로드맵 [손 필요] 17건 수행 기록 0, D29 현재 지인 발송 체크리스트 0/4, 콘텐츠 큐 39행 발행 0, Play 테스터 0/16, Mom Test·PMF 0건. 반면 코드는 2026-10-06~08 사흘에 병합 82건(git log --merges)으로 에이전트 처리량이 입증돼 있다. 즉 병목은 개발이 아니라 상민님 손인데, 이 전략은 그 병목 위에 손 작업을 10배 얹는다(코호트 30명 일일 관리 30일 + 인터뷰 20건×증빙 + 당번표 운영 + 질문 90 + 콘텐츠 8편). 손 작업이 0이어도 도는 경로가 계획에 없고, 코호트 참여 60%·완주 50% 가설은 발송 0건 상태라 근거가 0이다. 코호트 운영이 끝나는 D44 이후(2단계 300→5000) 24h 응원 당번은 무인이 된다.
투자자가 던질 질문: 지난 29일 동안 로드맵의 [손 필요] 17건 중 0건이 수행됐고 지인 발송 체크리스트가 0/4 인데, 이 전략은 그 손 작업을 10배로 늘립니다 — 14일 뒤(D14)에 '카카오 로그인까지 마친 코호트 확정 명단'을 파일로 보여줄 수 있습니까? 보여주지 못하면 사람 손 없이도 D90 에 '측정된 실유저 수치 0'이 '1'이 되는 경로가 이 계획 안에 단 하나라도 있습니까?

## 코호트·관계 우선 (같은 목표를 가진 소수 실제 집단을 시즌 단위로 묶는다)

논지: 아워골의 '진실된 데이터'는 전 세계 익명 피드가 아니라, 같은 시험·같은 대회·같은 마감을 공유하는 소수 실제 집단이 서로에게 책임지며 남기는 매일의 기록이며, 그 기록은 이미 Supabase checkins 원장에 쌓이고 있다(있음). 그래서 유저를 한 명씩 모으지 않고 리더(스터디장·크루장·원장·동아리장) 한 명이 자기 집단 30명을 8주 시즌 방으로 데려오게 해, 첫 유저가 들어오는 순간부터 '아직 공유된 실천이 없어요'가 아니라 '우리 방 오늘 기록 N/M'이라는 실측 숫자와 사람이 보낸 응원 1개를 보게 만든다. 리텐션은 배지가 아니라 약속(리더에게·방 동료에게·마감에게)에서 오고, 유입은 방의 주간 결산 카드가 리더의 단톡·오픈채팅으로 나가 다음 시즌 참여자와 다음 리더를 데려오는 단 하나의 루프로 만든다.


### 렌즈: 냉정한 투자자 — 소비자 앱 여러 번 투자해 본 회의론자. 기준은 "가설이 아니라 측정값", "코드가 아니라 사람 행위의 실적", "조작 불가능한 숫자".
살아남은 주장:
- 허수·AI 짝·시드 대화·'실제 우수 사용사례' 라벨·프로필 고정값을 전부 걷어내고 빈 칸은 실측 0 으로 보여준다는 원칙 — '진실의 반대는 비어 있음이 아니라 꾸며 넣음'은 투자자 기준과 일치하고, grep 건수 → 0 으로 법정이 잴 수 있다.
- 초대 루프 사망 수리(peer-invite-text.js:28 type 덮어쓰기, api/track.js handleShareOg 4종 한정, app-boot.js 세션 복원 경로 게이트웨이 미호출) — 어떤 성장 전략을 택하든 선행 수리이며, 시뮬레이션 2/2 → ?invite_group= 으로 완료 기준이 명확하다.
- 개인 1명씩이 아니라 '원자 네트워크'(같은 마감을 가진 소수 집단)로 콜드스타트를 깨는 방향 자체 — 빈 피드에 개인을 받는 것보다 낫다는 논리는 R44 와 실측(빈 상태 문구 4종)이 뒷받침한다. 단, 리더가 오픈채팅+시트를 버릴 이유(자동 출석판)가 먼저 있어야 성립한다.
- 팀 roster·시즌 필드(endDate null·weeklyTarget 999999)·방 집계를 서버로 옮기는 것 — 로컬 전용 상태는 헌법 GUARD_03 위반이고, 두 기기에서 같은 roster 라는 완료 기준은 측정 가능하다.
- posthog.identify·app_open·invite_join·utm/ref 탑재 전까지 '현재값 전부 null' 이며 어떤 목표치도 가설이라는 자인 — 정직하고, 투자자에게 보여줄 숫자는 W3 계측 뒤에만 나온다는 순서도 맞다.
- 스토어 등록·SNS 개방을 시즌 결산이 생긴 뒤(2단계)로 미루는 순서 — 빈 피드로 스토어 유입을 받아 리뷰를 망치지 않는다는 판단은 옳다.
- 파운더가 첫 리더로 자기 집단에서 결함을 먼저 겪는다는 설계 — 옳다. 다만 바로 그 사람 행위가 30일간 0 이었다는 것이 이 전략의 유일하고 가장 큰 리스크다.
치명 반박:
- 핵심 가설 '리더 1명 = 30명', 파운더 시즌 '발송 50 → 랜딩 35 → 입장 30 → 첫 체크인 20' — 이 전략의 분자·분모가 전부 '사람이 보낸다'에 걸려 있는데, 그 사람 행위의 실적은 측정상 0 이다. 지인 1:1 발송(T009/T012)은 코드도 돈도 필요 없는 일인데 로드맵 D0 부터 오늘 D29 까지 수행 기록 0, 전송 체크리스트 0/4, 템플릿 링크는 존재하지 않는 도메인(ourgoal.kr). 같은 기간 코드는 197 커밋(얕은 클론 전부가 9/24 이후 = 14일 ≥14커밋/일)이 쌓였다. 즉 병목은 코드가 아니라 사람 행위라는 것이 이미 30일치로 입증됐고, 전략은 그 병목을 '리더 10명 설득'으로 10배 키운다. 전환율 70%·86%·67% 는 지인 기준 숫자를 남의 집단에 그대로 적용한 것이다.
- first_90_days 15항목 — W1~W8 안에 서버 roster·보드 RPC·리더 도구 v0·결산 카드·계측·서버 원장화·시즌 종료 설계·RLS 2단계를 만들면서 동시에 파운더가 시즌 1 리더(24h 응원·매일 미기록자 DM·일요일 결산)를 수동 수행하고 W5~8 에 리더 40명 접촉 — 솔로 1인이 (a) 공정 11개(신규 7·보강 4)를 법정 심사·래칫·돌려보냄 3회 규칙 아래 병합하고 (b) 30명 방을 56일 동안 매일 손으로 운영하고 (c) 40명에게 1:1 영업하는 것을 8주에 넣었다. (b)만 해도 하루 최소 30분×56일이고, 리더 운영 도구가 W3~4 전까지 없으니 노션·카톡 수동이다. 실측상 이 사람은 사람 행위 쪽에서 30일간 0 을 냈고, 콘텐츠 큐 39행도 발행 0 이다. '선행 PR 4~5개'라는 자기 추정도 공정 수(11)와 index.html 4,003줄 인라인·래칫 제약을 빼고 센 것이다.
투자자가 던질 질문: 코드 한 줄, 돈 한 푼 필요 없던 '지인 50명 1:1 발송'을 로드맵 D0 부터 29일 동안 0명에게 보낸 사람이, 앞으로 90일 안에 남의 집단을 가진 리더 10명을 설득해 300명을 데려온다는 것을 무엇으로 믿어야 하나 — 지금 이 자리에서 이름을 댈 수 있는 리더가 몇 명이고, 그중 몇 명이 자기 오픈채팅과 구글시트를 버리고 이걸 쓰겠다고 말했나?

### 렌즈: 실행 현실(현재 코드 상태) — 저장소를 읽기 전용으로 직접 대조한 실행 책임자 시각
살아남은 주장:
- '진실된 데이터는 checkins 원장에 이미 쌓인다' — Supabase checkins upsert·18주 히트맵·스트릭 계산은 실물이고 다른 유저에 의존하지 않는다(home-cockpit.js:235-238, record-heatmap-report.js).
- '개인 유입은 빈 피드를 만나 죽고 집단 유입은 첫날부터 자기 데이터로 찬다' — 피드·동반자·DM·팀 빈 상태 문구 4종이 실측이며, 리더 단위 유입이 콜드스타트를 우회한다는 논리는 코드와 맞는다.
- 진실성 청소 목록(AI 마니또 짝·게스트 AI 3명·시드 대화 3건·AI 사진인증 3건·하드코딩 copies/likes·'실제 우수 사용사례'·프로필 streak 7/Lv 2·'같은 테마 러너에게만' 문구)은 전부 실측과 일치하고, 화면에서 사라지는 것을 승인선 ③으로 올린 점도 맞다.
- 60종 전문가 템플릿(4단계×3할일, KPI·기록열)과 1초 이식 배선, 랜딩→첫 체크인 3탭(로그인 0)은 실측 그대로다.
- Web Push 인프라(VAPID·push_subscriptions·pg_cron 매분)·1:1 DM Realtime·완주 인증서 캔버스·주간 리캡 캔버스는 코드에 실존한다 — 문제는 수신자·트리거·연결이지 인프라가 아니다.
- 현재값을 전부 null 로 적고 목표치를 '가설'로 표기한 점, 광고 0·SNS 0·스토어 2단계 이후 결심이라는 순서는 실행 현실과 맞다.
- 카카오톡 인앱 브라우저 로그인 무한 튕김은 2026-09-16 ES-116 에서 탈출 배너·복구 모달로 보강돼 있어, 카카오 단톡 유입 경로 자체는 막혀 있지 않다(dev_log.md:3490-3500).
- Google Play $25·리더 비금전 보상·제휴 서면·AI 마니또 제거를 결심 항목으로 분리한 것은 승인선 분류가 맞다.
치명 반박:
- 1일차 흐름 ③ '카카오 1탭 가입(있음) → 시즌 템플릿 자동 이식 → 첫 체크인 → 방 보드 N+1' 과 W1 '초대 루프 소생' 완료 기준 — 초대 랜딩 모달에서 카카오 로그인을 누르는 순간 방 정보가 사라진다. OAuth redirectTo 가 window.location.origin 이라 ?invite_group=·code·utm 쿼리가 통째로 떨어지고, 보류 초대를 localStorage 에 저장했다가 로그인 뒤 복원하는 코드가 0건이다. 게다가 W1 항목 'app-boot.js 로그인 세션 복원 경로에서도 handleDeepLinkRouting 호출'은 전제가 틀렸다 — restoreSessionAndEnter 가 이미 session-entry.js:66 에서 checkAndHandlePeerInviteUrl 을 부른다. 구멍은 호출 유무가 아니라 로그인 뒤 URL 이 비어 있다는 것이고, 90일 계획 어디에도 '초대 맥락 보존' 항목이 없다. 즉 카카오 가입자는 방에 못 들어간다.
- 초대 수락(acceptPeerInvite '있음') 뒤 게스트가 3회 기록 → 카카오 백업 넛지로 회원 전환되면 방 소속이 이어진다는 전제(1단계 퍼널 '입장 30명 → 첫 체크인 20명') — 현재 수락은 guest 프로필 + settings.groupState(기기 로컬) + 메모리 MOCK_GROUPS.unshift 뿐인데, guest→회원 이관(guest-migration.js)은 settings 중 구글캘린더·아바타 키만 옮기고 groupState 는 옮기지 않는다 → 카카오 전환 즉시 방 소속이 사라진다. 또 카카오 인앱 브라우저에서 세션이 4초 안에 안 오면 뜨는 복구 모달(openLoginRescueModal)이 ourgoal_guest_profile 을 지운다. W1~2 team_members 를 만들어도 guest_xxx id 로 insert 된 roster 행을 카카오 uid 로 재연결하는 설계가 계획에 없다.
투자자가 던질 질문: 지금 이 자리에서 실계정 두 개로, 초대 링크를 열어 카카오 로그인을 마친 사람이 같은 방 roster 에 서버 행으로 남고 방 보드 숫자가 N+1 로 바뀌는 것을 보여줄 수 있습니까 — 안 된다면 그게 되는 날짜와, 그날까지 그 PR 들을 승인·병합하고 동시에 30명에게 매일 응원을 보낼 사람이 대표 한 명 말고 누구입니까?

## 제품 주도 바이럴 루프 (제품 사용 자체가 바깥에 보이는 아티팩트를 만든다)

논지: 투자자 지적은 저장소 실측과 일치한다 — 지금 앱은 내 기록을 PNG 로 내보내는 '자기 전시 도구'까지만 있고, 링크를 받은 비사용자는 범용 og-image 1장과 URL 글자로 조립한 모달만 보며, 핵심 초대 링크는 서버 리다이렉트에서 파라미터가 통째로 떨어져(시뮬레이션 2/2 → '/') 아무것도 띄우지 못한다. 유저 0명에서 '진실된 데이터'는 가짜 유저로 채우는 것이 아니라 (가) 대표와 초기 운영진이 실명 실계정으로 매일 체크인하는 공개 목표의 실기록, (나) 이미 완성돼 있는 60종 전문가 템플릿의 구조(마일스톤 240·할일 720·KPI·기록열 7~9), (다) 가입자 본인의 기록·AI 피드백·회고가 서버에 쌓이는 것, 이 셋뿐이며 화면의 허수(복제 142~412회·응원 54~91·'실제 우수 사용사례' 6인·예시 팀 55개의 참여 인원)는 걷어내야 투자자 기준을 통과한다. 그래서 루프는 하나다: 체크인 → 실데이터로 자동 갱신되는 공개 목표 페이지(/g/{goalId}, 페이지별 OG 이미지) → 카톡·스레드 공유 → 비사용자가 로그인 없이 그 사람의 진짜 진척을 보고 '이 구조 가져오기' 1탭 → 게스트 목표 생성·첫 체크인 → 초대자에게 귀속돼 '나를 초대한 진짜 사람의 응원 1개'를 받고 다시 체크인하며, K = 공유 유저당 공유 수 × 열람률 × 열람→첫 체크인 전환율로 재되 지금은 세 값 모두 null 이다.


### 렌즈: 냉정한 투자자 — 소비자 앱 여러 번 투자해 본 회의론자. "실측에 없는 숫자는 없는 것"으로 본다.
살아남은 주장:
- 현재 상태 진단은 실측과 일치한다 — 초대 링크 2/2 '/' 유실, 범용 OG 1장, 로그인 경로 딥링크 미호출, 귀속·K 집계 0. 선행 수리 4건(peer-invite-text.js:28 · api/track.js handleShareOg · app-boot.js 로그인 경로 · 도메인 통일)은 싸고 옳다.
- '가상 유저로 채우지 않는다, 서버 실값만 표시하고 0이면 숨긴다'(template-credit.js 원칙)를 전 화면에 적용해 허수 82항목을 0으로 만드는 방향 — 투자자 기준을 통과하는 유일한 데이터 윤리다.
- 유저 0명일 때 전역 피드를 채우지 않고 소통 탭을 '내 사람들(동반자·초대자·원작자)'로 좁히며 전역 피드는 실글 20건 이상에서 켠다는 콜드스타트 처리.
- 유지 상태 6종(프리즈·출석·배지·퀘스트 보상·루틴·알림 설정) 서버 원장화 0/6 → 6/6, 서버 푸시 맥락화(오늘 체크인 없을 때만·quiet_hours·sw.js url 보존), 홈 히트맵 복구 — 바이럴과 무관하게 리텐션을 실제로 떠받치는 수리다.
- 측정값(K·D1·D7)이 나오기 전에는 외부 확산 채널을 열지 않는다는 순서 원칙 — 다만 K 정의를 고친 뒤에만 유효하다.
- 60종 전문가 템플릿(마일스톤 240·할일 720·KPI·기록열 7~9)과 cloneTemplate 1초 이식 배선은 실존 자산이다. 차별점으로 팔 것은 '남의 기록'이 아니라 이것이다.
- 초대 보상을 돈이 아닌 것(아바타 제작권·응원 도안)으로 한정한 판단과, 리텐션을 사람 단위(identify)로 잇기 전에 처리방침부터 고치겠다는 순서.
치명 반박:
- 측정식 K = i × v × c, 목표 D30 K ≥ 0.3 · D90 K ≥ 0.5 — 전략이 스스로 적은 목표값을 그대로 곱하면 K = 0.20 × 2.0 × 0.15 = 0.06 이다. 0.3 이 나오는 것은 v × c(=0.30)뿐인데, 그것은 괄호 안 정의('공유 유저 1명당')이고 i 를 곱한 K 는 활성 유저 1명당 값이다. 두 정의를 섞어 놓아 D60 게이트는 (가) i×v×c 로 재면 영원히 못 넘고 (나) v×c 로 재면 바이럴 계수가 아닌 값으로 '통과'한다. 어느 쪽이든 K < 1 이므로 자가 확산은 없고, 30명 시드로 닿는 상한은 30/(1−0.3) ≈ 43명이지 300명이 아니다. 300명·1,500명은 결국 손으로 데려와야 하는데(각각 약 210명·1,050명) 그 손 발송이 29일간 0건이다.
- 데이터 엔진 ① '대표(상민)와 초기 운영진 2~5명'이 90일 매일 체크인·초대 30명·24h 응원 100% 를 운영 규칙으로 수행한다 — '운영진'은 저장소 어디에도 없다(docs/growth 전체·지시함 grep 0건). 실체는 솔로 파운더 1인이고, 그 1인의 사람 행위(지인 1:1 발송·오픈채팅·스레드·Mom Test)는 로드맵 [손 필요] 17건 중 29일간 수행 기록 0건이다. 반면 코드는 2026-10-06 하루 140커밋, 10-07 47커밋이 들어갔다 — 병목은 코드가 아니라 사람의 손이다. 그런데 이 전략은 바로 그 손에 '매일 체크인 90일 + 24h 응원 100% + 1:1 카톡 50명 + 60종 템플릿 일일 실천 손편집 + 결심 7건'을 더 얹는다. 지금까지 단 한 번도 돌지 않은 장치를 엔진으로 삼은 것이다.
- 측정식은 신규 서버 이벤트 3종(share_created·share_view·invite_signup)으로 K 를 '산출'한다 — 조작·오염 경로가 세 겹이다. (1) events 테이블 RLS 는 anon/authenticated 삽입 with check(true) — 공개 anon 키로 브라우저 콘솔에서 share_created 를 몇 천 건이든 넣을 수 있고 서버 ALLOWED_EVENTS 는 호출부 0개인 죽은 코드다. (2) share_view 를 '/g 서버 렌더 시 sid 기록'으로 세면 카톡·스레드의 링크 미리보기 크롤러가 공유 URL 마다 최소 1회 때린다 → v ≥ 1 이 자동으로 채워지고 목표 v=2.0 의 절반은 봇이다. (3) c 의 분자 '첫 체크인 with attrib.ref' 는 게스트 sid 기준이라 한 사람이 시크릿 창을 열 때마다 '신규'가 된다(posthog.identify 0회, user 단위 중복 제거 없음). 대표 혼자 테스트만 해도 D30 K ≥ 0.3 은 찍힌다. 보조 지표 '운영진 실기록 행 수'는 측정 대상이 스스로 쓰는 값이고, 수식의 is_ai 컬럼은 SQL 어디에도 없다.
투자자가 던질 질문: "지난 29일 동안 대표 본인이 직접 링크를 보낸 사람이 몇 명이고, 그중 이틀째 돌아온 사람이 몇 명입니까 — 둘 다 0이라면, 코드가 아니라 사람이 안 움직인 건데 이 90일 계획에서는 사람이 움직이게 만드는 무엇이 달라집니까?"

### 렌즈: 실행 현실(현재 코드 상태) — 저장소 실측 JSON 과 /home/user/ourgoal-app 읽기 전용 확인에 비춘 반박
살아남은 주장:
- 초대 루프 수리 4건은 실재하고 작다 — peer-invite-text.js:28 의 params.set('type', group.roomType) 덮어쓰기와 api/track.js GET→handleShareOg 4종 한정 분기를 코드에서 그대로 확인했다. 이 수리는 1인·수일 규모이며 시뮬레이션(2/2 '/' 유실 → 2/2 보존)으로 증명 가능하다
- '가짜 유저 0명, 서버 실값만 표시·0이면 숨김' 원칙 — template-credit.js 가 이미 지키는 규칙을 전 화면으로 넓히는 방향은 옳고, 허수 제거를 승인선 ③ [결심 필요] 로 표시한 것도 맞다
- 60종 전문가 템플릿(wired full, 240 마일스톤·720 할일, cloneTemplate 배선)이 유저 0명일 때 유일하게 '진짜이면서 유익한' 자산이라는 진단
- 현재값을 전부 null 로 적고 i·v·c·K 를 가설로 둔 정직성 — 투자자 질문에 '숫자가 없다'를 숫자로 인정한 점
- 유지 상태(프리즈·출석·배지·퀘스트 보상)를 XP 가 쓰는 user_ledger_docs 로 옮기는 원장화, AI 피드백·회고를 checkins.meta 에 넣는 보강 — 테이블과 META_FIELDS 가 실재해 '보강'이 맞다
- 홈 히트맵 카드 복구(index.html:680 display:none !important + heatmap-summary.js 조기 return 제거)와 sw.js payload url 보존 — GUARD_02 위반 제거이자 소규모 수리
- 공개 페이지 기본 비공개 opt-in, Play $25 는 K 확인 뒤, identify 는 결심 뒤 — 돈·개인정보 승인선을 일정 안에 명시한 점
- 소통 탭 첫 화면을 '내 사람들'로 좁히고 전역 피드는 실글 20건 이상에서 켜는 설계 — feed-list.js realCount 분기가 실재해 재사용 가능
치명 반박:
- 진실된 데이터 엔진 ① — '대표와 초기 운영진 2~5명이 실명 실계정으로 매일 체크인'이 유일한 시딩이며 운영진이 초대한 첫 30명을 운영진이 24h 안에 100% 응원한다 — 엔진의 연료가 '존재하지 않는 사람'이다. 저장소 어디에도 운영진이라는 사람·계정·역할이 없고, 로드맵 D0~D29 동안 사람이 해야 하는 유입 행위(지인 발송·오픈채팅·스레드·Mom Test)는 수행 기록이 0건이다. 즉 지난 29일에 1인 대표가 코드 밖의 운영 행위를 한 번도 하지 못했는데, 다음 90일에는 17건 신규·보강 개발 + 매일 2목표 체크인 + 30명 24h 응원 + 50명 1:1 발송 + 템플릿 60종 일일 실천 손편집을 같은 1인이 한다는 전제다. 공수 추정치는 한 줄도 없다(GUARD_05: 근거 없는 예상은 '추정'으로 표기해야 하는데 표기 자체가 없다). 전략 스스로도 '대표가 체크인을 멈추면 엔진이 멈춘다'고 인정했다 — 그 대표가 이미 29일간 멈춰 있었다.
- 1일차 복귀 이유 — '나를 초대한 진짜 사람의 응원 1개가 받은 응원함에 와 있다'(초대자 push → 웰컴 응원 스탬프 → 게스트 받은 응원함) — 사슬의 세 고리가 각각 끊겨 있다. (가) 초대자 push: push_subscriptions.user_id 는 users FK uuid·로그인 토큰 필수이고 현재 구독 계정 0 → 초대자(운영진 포함)가 먼저 알림을 켜야만 도착하는데 그 운영 규칙이 없다. (나) 게스트가 응원함을 읽는 것은 team_pings select 정책이 using(true)(anon 전체 공개 — PR #357 이 기록한 보안 결함) 인 덕분이다. 전략이 '있음'이라 표시한 welcome_cheer 수신은 이 구멍이 열려 있어야 돈다. 1단계 RLS(dm-rls-step1.sql, [손 필요] 미적용)를 적용하는 순간 README 가 명시하듯 '게스트는 이 표를 더는 못 읽는다' → 루프 사망. 즉 보안을 고치면 루프가 죽고, 루프를 살리면 DM 본문 공개 읽기를 방치해야 한다. (다) 게스트 receiver_id 는 'guest-…' 로컬 id 라 기기·캐시가 바뀌면 응원함 자체가 사라진다.
- 90일 계획 D0~D7 — 초대 루프 수리 4건 + 공개 목표 페이지(서버 렌더 HTML·OG 메타·페이지별 OG 이미지 PNG) + D0~D10 '이 구조 가져오기' 1탭 — 페이지별 OG PNG 는 '신규' 중에서도 가장 무거운 신규인데 7일 칸에 수리 4건과 함께 들어 있다. package.json 의존성은 @supabase/supabase-js·web-push 둘뿐이고 satori/@vercel/og/canvas/resvg 0, 저장소에 한글 폰트 파일(ttf/otf/woff2) 0 → Vercel 서버리스에서 한글 PNG 를 굽는 렌더러 선택·폰트 번들·크기 제한 검증이 전부 처음부터다. 게다가 전략이 확장하겠다는 api/track.js 는 이미 1,129줄(800줄 상한 초과)이라 세포 규칙상 새 세포로 떼어 내야 하고, vercel.json rewrites 추가는 금고 밖이지만 법정 심사 대상이다. 1인이 7일 안에 이 다섯 가지를 끝낸다는 근거가 없다(추정 표기도 없음).
투자자가 던질 질문: "운영진 2~5명은 누구이고 지금 이름과 실계정이 있습니까? 없다면 — 지난 29일(로드맵 D0~D29) 동안 대표 혼자 코드 밖의 유입 행위를 한 건도 하지 못했는데, 다음 90일에 코드 17건과 매일 체크인·30명 24시간 응원·50명 발송을 혼자 다 하겠다는 계획은 무엇이 달라져서 가능해집니까?"


# 부록 C. 완결성 비평

설득하지 못한다. 1절·5절·7절은 실측과 잘 맞고 'K는 null, 지인 빼고 7일째 돌아온 사람도 null, 세는 쿼리도 없다'고 인정한 정직함은 평가할 만하다. 그러나 투자자가 물은 세 가지 중 '초기 유입'은 대표 지인 50명 한 채널에, '바이럴'은 공유 순간과 동기가 정의되지 않은 루프 한 개에, '진실된 데이터의 경험'은 대표 1인의 페이지와 테마 카운트 하나에 걸려 있고, 그 사이를 잇는 핵심 사슬(가져오기→카카오 가입→이식)은 OAuth 리다이렉트와 온보딩 가로채기 때문에 지금 코드로는 끊겨 있는데 계획이 그것을 모른다. 숫자도 흔들린다: 이미 있는 goalId 를 없다고 썼고, 82건 병합·K≈0.5 암묵 전제·'초대코드 없는 가입=지인 제외'·3일 프리즈 문구·돈 0 인 제작권 보상처럼 실측이나 코드와 어긋나는 대목이 열 곳 가까이 된다. 90일 분량은 에이전트 코드 생산량으로는 가능해 보이지만 결심 6건·지시함 병합·W1 수작업이 선행이라 '하루 20분'은 지켜지지 않고, 2단계 roster·AI 엔드포인트 통합처럼 일정에 없는 큰 작업이 조건부로 숨어 있다. 결론 한 줄: 솔직한 현황 진단 뒤에 붙은 계획이 실측을 끝까지 읽지 않은 채 짜였고, 유입·바이럴·데이터 세 질문 모두에 '대표 한 사람'이라는 단일 실패점만 답으로 내놓았다 — 투자하려면 0단계 20명 결과와 끊긴 가입 사슬의 수리 증명(법정 판정)부터 보고 다시 논의해야 한다.

되물을 질문:
- 지인 50명에서 지인 아닌 50명이 나오려면 K가 0.5는 돼야 하는데, 공유 비율·열람→가입 전환이 전부 null 이고 앱 안에 공유를 시키는 순간도 없다. 그 50명은 어디서 오는 겁니까? 0단계 '가져오기 의향 30%'는 i 도 c 도 아니지 않습니까?
- 카카오 가입 뒤에 템플릿과 초대코드가 살아남는 코드가 지금 한 줄도 없고(redirectTo=origin, 온보딩 가로채기), 공개 페이지·귀속·D1/D7 뷰를 W2~3 두 주에 혼자 짓고 같은 주에 발송을 시작한다는 건데 — 하루 20분을 어떻게 지킵니까? W1 만 계산해도 하루 한 시간입니다.
- D1~D45 동안 앱 안의 '남의 데이터'는 대표 한 사람의 기록뿐이고, 푸시 켠 계정은 0, 응원 스탬프는 알림이 안 갑니다. 그 기간에 7일째 다시 여는 사람 15명이 나온다는 근거가 뭡니까? 대표가 하루라도 빠지면 공개 페이지의 연속 기록이 깨지는데 그때는요?