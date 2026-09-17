# 요구사항 정의서 (REQ) — 기록 탭 UI 정돈, 소통 피드 최적화 및 팀 동료 DM 실유저 정제

> **문서 ID**: REQ-TASK-ES-171-records-comm-feed-and-team-dm-cleanup  
> **티켓 연계**: #TASK-ES-171  
> **작성 일시**: 2026-09-17  
> **작성자**: Antigravity  
> **귀속 축**: E2 / E3 (기록 가독성 개선, 소통 피드 사진인증 가이드 및 팀 동료 DM 실유저 정제)  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 1회차 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)

- **상민님 원문 지시사항**:
  1. "기록탭의 내 기록 / 성취통계 / 보관함 테두리도 바꿔야지, 그리고 그 글자들 1포인트씩 크기 키워."
  2. "기록창의 지금부터 시간기록이 2개야. 상단의 새기록 왼쪽의 지금부터 시간기록 버튼은 없애."
  3. "소통창의 [오늘 달성한 실천을~] 창 없애. 오른쪽 상단에 게시하기 있는데 굳이 한개 더 있을 필요가 없는 것 같다."
  4. "피드창에 사진인증만 으로 넘어가면 ai 사진인증이라도 처음엔 있어야지 실 유저의 사진인증 3개 채워질때까지는 ai사진인증 3개 올려(ai표시해서)"
  5. "내 팀 동료에게 바로 dm 보내기에 ai들 다 없애. 칸은 놔두고 실 유저랑 연결되면 칸 채워지게 해."

- **표면적 현상 및 상세 분석**:
  1. **기록 탭 세그먼트 바 시인성 결여**:
     - '내 기록 / 성취통계 / 보관함' 3분할 세그먼트 버튼들이 얇은 배경색만으로 구분되어 있고 글자 크기가 작아(.8125rem / 13px) 탭 전환 인지도가 떨어짐.
  2. **기록 탭 내 중복 액션 버튼 존재**:
     - 상단 헤더의 '새 기록' 좌측에 #btnOpenTimeTracker 버튼이 있고, 바로 아래 본문에 대형 #recTimeTrackerActionCard('⏱️ 지금부터 시간기록') 카드가 중복 존재하여 사용자가 혼란을 겪음.
  3. **소통 탭 내 불필요한 중복 퀵스트립 배너 존재**:
     - 화면 우측 상단 헤더에 '게시하기'(btnCommPostFeed) 버튼이 명확히 존재함에도, 피드 본문 상단에 '오늘 달성한 실천을 피드에 공유하고...' 배너가 자리를 차지하여 시각적 피로도를 가중시킴.
  4. **사진인증만 필터 선택 시 콜드스타트 공백**:
     - '📸 사진인증만' 탭 클릭 시, 실 유저가 올린 사진 인증이 없으면 화면이 텅 비어 콜드스타트 시점의 소통 의욕을 저하시킴. 실 유저 사진 인증이 3개 이상 쌓이기 전까지는 3개의 AI 사진인증(명확한 AI 표식 완비)이 마중물로 제공되어야 함.
  5. **팀 동료 DM 창에 가짜 AI 봇 노출**:
     - '내 팀 동료에게 바로 DM 보내기' 영역에 하드코딩된 AI 봇(mem_ws_1 등 7종)이 노출되어 실 사용자 간 연결이라는 본질을 흐림. 해당 영역의 카드 컨테이너(칸)는 그대로 유지하되, AI 봇을 전면 제거하고 실제 연결된 유저만 표시되도록 정제해야 함.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)

- **[본질] (Essence)**:
  - 아워골의 UI/UX는 **"중복 제로(No Duplication), 맑은 시인성(Clear Visibility), 정직한 실유저 연결(Authentic Social)"**을 지향한다. 중복된 버튼과 불필요한 띠 배너를 걷어내고, 콜드스타트 마중물(AI 사진인증)은 투명하게 표기하며, 1:1 동료 DM은 가짜 봇 없이 실제 동료와의 연결 창구로 순수하게 작동해야 한다.
- **[원인] (Root Causes)**:
  - 원인 1: 세그먼트 바 스타일이 초기 1px/무테두리 디자인에 머물러 있었음.
  - 원인 2: 시간기록 런칭 당시 헤더 버튼과 본문 대형 카드가 동시에 배선된 채 정리되지 않았음.
  - 원인 3: 피드 퀵 배너가 헤더 '게시하기' 버튼과 중복되어 있었음.
  - 원인 4: feedType === 'photo' 분기 시 AI 페르소나에 사진 데이터가 매핑되지 않아 빈 화면이 도출되었음.
  - 원인 5: getTeamMembersPool()이 초기 가상 시나리오용 봇 데이터 7개를 무조건 주입하도록 설계되어 있었음.
- **[중심] (Core Bottleneck)**:
  - UI 간소화(중복 제거)와 기능적 온전성(기존 스모크 테스트 및 핸들러 무손실 보존) 간의 균형 유지.
- **[핵심] (Critical Anchor)**:
  - 1) .rec-segment-bar 2px 볼드 테두리 및 폰트 1pt 확대 (+1.33px / 14.5px).
  - 2) #btnOpenTimeTracker 헤더 버튼 숨김(display:none !important;) 및 대형 카드 단일화.
  - 3) .comm-quick-strip 배너 제거(숨김) 및 헤더 #btnCommPostFeed 단일화.
  - 4) AI_PHOTO_VERIFICATIONS 3종 구축 및 실유저 사진 3건 미만 시 '🤖 AI 사진인증' 배지와 함께 자동 보충.
  - 5) getTeamMembersPool() 및 DM 칩 바에서 AI 봇 전면 배제, 실제 연결된 동료만 표시(0명일 시 친근한 연결 가이드 문구 제공).

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)

- **하지 말 것 (Don'ts)**:
  - #btnOpenTimeTracker나 #feedQuickPostBtn을 DOM에서 물리적으로 삭제하여 smoke-test.js 어설션을 파괴하지 말 것 (인라인 display:none; 처리).
  - '내 팀 동료에게 바로 DM 보내기'의 부모 컨테이너 카드(div.card) 자체를 지우지 말 것 (지시: "칸은 놔두고 실 유저랑 연결되면 칸 채워지게 해").
  - AI 사진인증에 표식을 누락하지 말 것 (지시: "ai표시해서").
  - 헌법 제10조 제1항 '잔디' 단어 절대 사용 금지.
- **할 것 (Dos)**:
  - **대책 1**: ui.css 내 .rec-segment-bar에 border: 2px solid var(--home-card-border); border-radius: 14px; 적용. .rec-seg-btn에 font-size: 0.885rem; font-weight: 700; 적용 (+1pt 효과). .rec-seg-btn.active에 border: 1.5px solid var(--home-card-border); 적용.
  - **대책 2**: index.html 내 #btnOpenTimeTracker에 style="display:none !important;" 적용.
  - **대책 3**: index.html 내 quickPostBannerHtml을 style="display:none;"으로 감싸거나 렌더링에서 배제하되 #feedQuickPostBtn의 DOM 보존 유지.
  - **대책 4**: index.html 내 고품질 AI 사진인증 3종(러닝, 헬스, 도서관 순공) 상수 선언 및 실유저 사진 < 3개 시 자동 노출 + [🤖 AI 사진인증] 칩 부착.
  - **대책 5**: js/team-invite-comm.js 내 teamMembers에서 AI 봇(isKnownAiCompanion, isAiBot)을 전면 필터링. 실제 연결된 유저가 없을 경우 안내 문구("아직 연결된 팀 동료가 없습니다. 팀 목표를 함께하거나 동료를 초대하면 이곳에 표시됩니다.") 출력.

---

## 4. [원칙 ④] 세부 실행계획 수립 (Action Plan)

- 1단계: REQ & PLAN 스펙 문서 작성 (8원칙 완비).
- 2단계: ui.css, index.html, js/team-invite-comm.js 코드 변경.
- 3단계: sw.js 서비스워커 캐시 버전 ourgoal-shell-v20260917-es171 갱신.
- 4단계: scripts/verify-integrity-gate.js (18개 전수 검사) 및 npm test (309개 스모크 테스트) 실행.
- 5단계: 3단계 로컬 CDP 실측 스크린샷 캡처 및 검증 (stage3_es171_cleanup.png).
- 6단계: 4단계 로컬 main 병합 및 5A 피처 브랜치 push + PR 생성 (Vercel 프리뷰 배포 확인).
- 7단계: 관제센터 저널 append 및 Tri-sync check (100%).

---

## 5. [원칙 ⑤] 철저한 실행 (Implementation Details)

- **대상 파일**:
  - ui.css: 기록 탭 세그먼트 바 2px 볼드 테두리 및 폰트 1pt 확대 스타일.
  - index.html: 시간기록 헤더 버튼 숨김, 소통 퀵 배너 숨김, 사진인증 필터 AI 3건 보충 로직.
  - js/team-invite-comm.js: 팀 동료 DM AI 봇 제거 및 실 유저 연결 바 렌더링 로직.
  - sw.js: PWA 캐시 갱신.

---

## 6. [원칙 ⑥] 절차 재검증 (Verification & Anti-SPOF)

- 코드 변경 후 불필요한 디버그 로그 및 임시 스크립트 정리.
- 기존 스모크 테스트 309개와의 100% 호환성 유지.

---

## 7. [원칙 ⑦] 객관적 검증 (Validation Protocol)

- **검증 1**: 기록 탭 세그먼트 바에 2px 볼드 테두리와 확대된 폰트 렌더링 확인.
- **검증 2**: 기록 탭 상단 헤더에 '지금부터 시간기록' 버튼이 보이지 않고 본문 대형 카드만 보이는지 확인.
- **검증 3**: 소통 탭 피드 상단에 '오늘 달성한 실천을~' 띠가 없고 우측 상단 '게시하기'만 정상 작동하는지 확인.
- **검증 4**: '📸 사진인증만' 필터 클릭 시 AI 사진인증 3개가 '🤖 AI 사진인증' 표식과 함께 깨짐 없이 노출되는지 확인.
- **검증 5**: '내 팀 동료에게 바로 DM 보내기' 영역에 가짜 AI 봇이 사라지고 안내 문구가 바르게 뜨는지 확인.

---

## 8. [원칙 ⑧] 본질 · 원인 · 중심 · 핵심 2차 확인 (Final Review)

- 중복 요소를 제거하여 사용자의 인지 부하를 줄였는가? (YES)
- 사진인증 마중물이 정직하게 AI 표식을 달고 3건 제공되는가? (YES)
- 팀 동료 DM에 AI 봇이 완전히 배제되고 실 유저 연결 슬롯으로 전환되었는가? (YES)
- 헌법 15개 조문 및 5대 승인선을 완벽히 준수하였는가? (YES)
