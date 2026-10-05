/**
 * OurGoal Template Encyclopedia (목표 탭 — 템플릿 백과사전 3대 분류·AI/실사용자 템플릿 화면)
 *
 * 목표 탭 「템플릿」 하위 탭 화면(renderTemplateEncyclopediaScreen)과 루틴·팀·개인 템플릿 상수(ROUTINE_TEMPLATES_AI·ROUTINE_TEMPLATES_REAL·TEAM_TEMPLATES_AI·TEAM_TEMPLATES_REAL·PERSONAL_TEMPLATES_REAL).
 * 분류·종류·검색 상태 변수(_subtabTplDomain·_subtabTplType·_subtabTplCat·_subtabTplQuery)는 index.html 에 그대로 있고 L getter·setter 로 읽고 쓴다. window 노출 줄도 원래 자리에 그대로 있다.
 * #TASK-ES-481(인라인 어려움 묶음 시범): index.html 인라인 IIFE 의 구간(이전 전 14384~14441 · 14442~14485 · 14486~14572 · 14573~14624 · 14625~14634 · 14635~15113줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalGoalsKit = global.OurgoalGoalsKit || {};

  /* ---- 이전 전 index.html 14384~14441줄(#TASK-ES-481 생성기 표지) ---- */

  // 루틴 AI 추천 템플릿 6선
  var ROUTINE_TEMPLATES_AI = [
    {
      id: 'rt_tpl_morning_miracle',
      title: '🌅 미라클 모닝 3종 세트 (기상 후 미온수·스트레칭·확언)',
      time: '06:30',
      days: [1,2,3,4,5,6,7],
      desc: '하루의 시작을 맑은 정신으로 깨우는 대표 미라클 모닝 루틴',
      memo: '기상 직후 미온수 500ml 섭취 및 가벼운 10분 스트레칭',
      badge: '대표 모닝'
    },
    {
      id: 'rt_tpl_pomodoro_core',
      title: '💻 뽀모도로 50/10 코어 딥워크 실천',
      time: '10:00',
      days: [1,2,3,4,5],
      desc: '스마트폰 방해금지 켜고 오늘 가장 중요한 1순위 핵심 과업 1시간 몰입',
      memo: '알림 차단, 50분 집중 후 10분 휴식 2세트 반복',
      badge: '업무 몰입'
    },
    {
      id: 'rt_tpl_lunch_walk',
      title: '🥗 활력 점심 산책 20분 & 비타민 챙기기',
      time: '12:30',
      days: [1,2,3,4,5],
      desc: '점심 식사 후 가벼운 햇볕 쬐기와 소화 산책으로 오후 식곤증 예방',
      memo: '식후 15~20분 산책 및 충분한 수분 섭취',
      badge: '건강 활력'
    },
    {
      id: 'rt_tpl_zone2_running',
      title: '🏃 퇴근 후 존2 조깅 30분 또는 홈트',
      time: '19:30',
      days: [2,4,6],
      desc: '숨이 차지만 대화 가능한 심박수로 심폐지구력과 체력을 길러주는 유산소',
      memo: '주 3회 규칙적인 달리기 또는 인터벌 트레이닝',
      badge: '체력 증진'
    },
    {
      id: 'rt_tpl_evening_reading',
      title: '📖 잠들기 전 20분 독서 & 디지털 디톡스',
      time: '22:30',
      days: [1,2,3,4,5,6,7],
      desc: '취침 30분 전 스마트폰을 멀리하고 책을 읽으며 뇌에 휴식을 선물하는 시간',
      memo: '침대 머리맡에서 종이책 또는 e북 20분 읽기',
      badge: '마음 쉼'
    },
    {
      id: 'rt_tpl_night_retrospect',
      title: '🌙 나이트 감사 회고 & 내일 우선순위 3가지',
      time: '23:00',
      days: [1,2,3,4,5,6,7],
      desc: '오늘 하루 감사한 일 3가지와 내일 가장 먼저 끝낼 핵심 목표 3가지 기록',
      memo: '아워골 회고 노트에 오늘 체크인과 내일 할 일 적기',
      badge: '하루 마감'
    }
  ];
  /* ---- 이전 전 index.html 14442~14485줄(#TASK-ES-481 생성기 표지) ---- */

  // 루틴 실사용자 검증 템플릿 4선
  var ROUTINE_TEMPLATES_REAL = [
    {
      id: 'rt_real_sangmin_445',
      title: '🔥 상민 대표의 04:45 기상 & 전략 구상 루틴',
      author: '상민',
      copies: 412,
      time: '04:45',
      days: [1,2,3,4,5,6,7],
      desc: '방해 없는 고요한 새벽 시간에 제품 로드맵과 당일 핵심 의사결정을 설계하는 루틴',
      memo: '미온수 한 잔 후 1시간 동안 당일 주요 지휘 방향 정리'
    },
    {
      id: 'rt_real_iron_lunch',
      title: '💪 헬린이 탈출 점심 헬스 40분 쇠질 루틴',
      author: '쇠질남',
      copies: 184,
      time: '12:10',
      days: [1,3,5],
      desc: '점심시간을 쪼개어 주 3회 3분할 웨이트를 꾸준히 수행하는 실천 루틴',
      memo: '스트레칭 5분 + 본세트 30분 + 단백질 셰이크'
    },
    {
      id: 'rt_real_leetcode_daily',
      title: '☕ 개발자 출근 전 1일 1 LeetCode 루틴',
      author: '네카라쿠배',
      copies: 295,
      time: '08:30',
      days: [1,2,3,4,5],
      desc: '출근 전 커피 한 잔과 함께 코딩 테스트 문제 1개 풀이로 감 유지하기',
      memo: 'Medium 난이도 30분 타임어택 풀이 및 풀이 복기'
    },
    {
      id: 'rt_real_mindful_sleep',
      title: '🌿 마음 챙김 밤 10분 바디스캔 명상',
      author: '마인드풀',
      copies: 153,
      time: '23:15',
      days: [1,2,3,4,5,6,7],
      desc: '하루 동안 쌓인 긴장과 스트레스를 전신 이완 호흡으로 비워내는 숙면 루틴',
      memo: '호흡에 집중하며 발끝부터 정수리까지 이완하기'
    }
  ];
  /* ---- 이전 전 index.html 14486~14572줄(#TASK-ES-481 생성기 표지) ---- */
  // 팀 목표 AI 추천 템플릿 6선
  var TEAM_TEMPLATES_AI = [
    {
      id: 'team_tpl_algo_100',
      title: '🏆 100일 알고리즘 & 코딩 테스트 1일 1커밋 팀 챌린지',
      category: 'IT·개발 스터디',
      badge: '스터디 추천',
      desc: '매일 알고리즘 문제 풀이 및 깃허브 커밋을 인증하며 코딩 테스트를 통과하는 크루',
      kpi: '100일 완주 및 주 5회 이상 인증',
      milestones: [
        { title: '1단계: 기본 자료구조 (스택·큐·해시) 30제 정복', tasks: ['스택/큐 필수 15제 풀이', '해시맵 & 셋 응용 15제 풀이', '주간 상호 코드 리뷰'] },
        { title: '2단계: 탐색 및 정렬 (DFS/BFS·이분탐색) 30제', tasks: ['DFS/BFS 그래프 탐색 마스터', '이분탐색 & 그리디 문제 풀이', '중간 모의 코딩 테스트'] },
        { title: '3단계: 동적 계획법(DP) 및 고급 알고리즘', tasks: ['DP 핵심 점화식 유형 정리', '최단 경로(다익스트라) 정복', '실전 기출 타임어택'] },
        { title: '4단계: 기업별 실전 기출 모의고사 완주', tasks: ['카카오/라인 기출 5세트 풀이', '최종 합격 후기 공유회'] }
      ]
    },
    {
      id: 'team_tpl_marathon_crew',
      title: '🏃 가을 마라톤 10km & 하프 동반 완주 크루',
      category: '운동·러닝 크루',
      badge: '크루 추천',
      desc: '주 2회 개인 러닝 거리 인증과 월 1회 오프라인 주말 정기 러닝으로 함께 완주하는 크루',
      kpi: '전원 10km 완주 메달 획득',
      milestones: [
        { title: '1단계: 기초 러닝 자세 & 3km 논스톱 달리기', tasks: ['주 2회 3km 페이스 유지 러닝', '러닝 후 스트레칭 & 케이던스 측정', '러닝화 피팅 점검'] },
        { title: '2단계: 거리 늘리기 (5km 30분 이내 안정화)', tasks: ['주 2회 5km 지속주 훈련', '주말 인터벌 러닝 1회', '체중 및 심박수 기록 공유'] },
        { title: '3단계: 빌드업 8km 훈련 & 에너지 젤 테스트', tasks: ['장거리 8km 빌드업 훈련', '파워젤 및 수분 보충 리허설', '대회 코스 분석'] },
        { title: '4단계: 대회 당일 페이스메이커 동반 완주', tasks: ['대회 전일 카보로딩 & 컨디셔닝', '10km 공식 완주 및 기념촬영'] }
      ]
    },
    {
      id: 'team_tpl_toeic_8w',
      title: '📚 토익 900+ 스파르타: 매일 기출 1세트 & 단어 인증',
      category: '어학·자격증',
      badge: '단기 속성',
      desc: '매일 영단어 100개 시험과 파트 5/7 오답 노트를 공유하며 8주 안에 900점을 돌파하는 팀',
      kpi: '정기 토익 시험 900점 이상 달성',
      milestones: [
        { title: '1단계: 노랭이 보카 1회독 & 파트 5 문법 총정리', tasks: ['매일 단어 100개 인증', '파트 5 빈출 300제 풀이', 'LC 쉐도잉 30분'] },
        { title: '2단계: LC 파트 2/3/4 패러프레이징 집중 훈련', tasks: ['호주/영국 발음 집중 청취', '파트 3/4 스키밍 훈련', '주간 실전 모의고사 1회'] },
        { title: '3단계: RC 파트 7 트리플 패시지 시간 단축', tasks: ['트리플 지문 단축 독해 비법 적용', '매일 오답노트 작성 및 피드백'] },
        { title: '4단계: 실전 1000제 5회분 풀이 & 실전 응시', tasks: ['200문항 2시간 마킹 리허설', '정기 토익 응시 및 점수 공유'] }
      ]
    },
    {
      id: 'team_tpl_no_spend_30',
      title: '💸 팀 짠테크: 30일 무지출 & 냉장고 파먹기 챌린지',
      category: '재테크·소비',
      badge: '재테크 인기',
      desc: '배달 음식 줄이고 주 2회 무지출 데이를 인증하며 생활비를 절반으로 줄이는 실천 모임',
      kpi: '한 달 생활비 40만원 절약',
      milestones: [
        { title: '1단계: 고정 지출 점검 & 불필요 구독 해지', tasks: ['안 쓰는 OTT/구독 서비스 해지', '일주일 예산 봉투 정하기', '매일 가계부 지출 영수증 인증'] },
        { title: '2단계: 냉장고 파먹기 & 집밥 도시락 챌린지', tasks: ['냉동실 식재료 식단표 작성', '점심 도시락 주 3회 싸기', '외식/배달 유혹 참기 팁 공유'] },
        { title: '3단계: 주 2회 무지출 데이 달성', tasks: ['화/목 지출 0원 인증', '중고 물품 당근마켓 3건 판매'] },
        { title: '4단계: 30일 결산 및 아낀 돈 예적금 이체', tasks: ['절약 금액 최종 결산', '모은 돈 고금리 적금 통장 넣기'] }
      ]
    },
    {
      id: 'team_tpl_body_profile',
      title: '💪 바디프로필 90일 동반 완주 & 식단 서바이벌',
      category: '운동·피트니스',
      badge: '하드코어',
      desc: '엄격한 클린 식단 인증과 주 5회 웨이트 트레이닝으로 90일 후 멋진 인생 사진을 남기는 팀',
      kpi: '체지방률 남성 9% / 여성 16% 달성',
      milestones: [
        { title: '1단계: 기초 체력 구축 & 탄단지 매크로 세팅', tasks: ['체성분 인바디 측정 및 목표 설정', '매 끼니 탄단지 식단 사진 인증', '웨이트 기초 5대 운동 숙지'] },
        { title: '2단계: 본격 린매스업 및 점진적 과부하', tasks: ['주 5회 부위별 분할 루틴', '공복 유산소 40분 주 3회', '치팅데이 주 1회 엄수'] },
        { title: '3단계: 체지방 컷팅 & 스튜디오 예약', tasks: ['탄수화물 사이클링 돌입', '스튜디오/의상 컨셉 확정', '태닝 및 포징 연습'] },
        { title: '4단계: 마지막 수분 조절 & 촬영 완주', tasks: ['단수/염분 조절 가이드 실천', '바디프로필 촬영 및 치맥 파티'] }
      ]
    },
    {
      id: 'team_tpl_side_project_mvp',
      title: '🚀 사이드 프로젝트 4주 만에 MVP 런칭하기',
      category: '기획·개발 크루',
      badge: '사이드 프로젝트',
      desc: '기획자, 디자이너, 개발자가 모여 한 달 안에 실제 사용자가 쓰는 웹/앱 서비스를 런칭하는 팀',
      kpi: '실제 유저 100명 유입 및 배포',
      milestones: [
        { title: '1주차: 핵심 가치 정의 및 와이어프레임 확정', tasks: ['1줄 문제 정의 및 솔루션 확정', '피그마 주요 화면 3개 설계', '기술 스택 선정 및 레포 초기화'] },
        { title: '2주차: 코어 기능 프로토타입 구현', tasks: ['데이터 모델 및 핵심 API 개발', '메인 화면 인터랙션 구현', '1차 내부 시연'] },
        { title: '3주차: 베타 테스트 및 버그 픽스', tasks: ['지인 10명 클로즈드 베타 피드백', '크리티컬 버그 전수 수정', '반응형 UI 최적화'] },
        { title: '4주차: 도메인 연결 및 커뮤니티 런칭', tasks: ['Vercel/커스텀 도메인 배포', '디스콰이엇/긱뉴스 런칭 글 게시', '초기 가입자 50명 달성'] }
      ]
    }
  ];
  /* ---- 이전 전 index.html 14573~14624줄(#TASK-ES-481 생성기 표지) ---- */

  // 팀 목표 실사용자 공유 템플릿 4선
  var TEAM_TEMPLATES_REAL = [
    {
      id: 'team_real_gangnam_mogakko',
      title: '🔥 강남 아침 스터디: 주 3회 모각코 크루',
      author: '제이슨',
      copies: 88,
      category: '개발/스터디',
      desc: '평일 오전 7시 30분 강남 카페에서 만나 각자 과업을 2시간 몰입하고 출근하는 모임',
      kpi: '출석률 90% 이상 유지',
      milestones: [
        { title: '주 3회 강남 모각코 오프라인 참석', tasks: ['월/수/금 오전 7:30 집결', '당일 몰입 과업 슬랙 공유'] }
      ]
    },
    {
      id: 'team_real_morning_hangang',
      title: '🏃‍♂️ 새벽 러닝 크루: 한강 5km 달리기',
      author: '달리는호랑이',
      copies: 134,
      category: '운동/러닝',
      desc: '매주 화/목 아침 6시 반포 한강공원에서 모여 기분 좋게 5km 러닝 후 하루 시작',
      kpi: '완주율 94% 달성',
      milestones: [
        { title: '화/목 한강 5km 정기 러닝', tasks: ['화/목 06:00 한강공원 집결', '러닝 앱 나이키런 기록 공유'] }
      ]
    },
    {
      id: 'team_real_stock_reading',
      title: '📈 주식 & 재테크 독서 스터디 3기',
      author: '버핏주니어',
      copies: 71,
      category: '재테크/독서',
      desc: '투자 고전 책을 2주에 1권씩 읽고 챕터별 핵심 인사이트와 매매 원칙을 토론하는 스터디',
      kpi: '8권 완독 및 독후감 제출',
      milestones: [
        { title: '격주 투자 도서 완독 및 발제', tasks: ['지정 도서 완독', 'A4 1장 요약문 제출'] }
      ]
    },
    {
      id: 'team_real_daily_drawing',
      title: '🎨 매일 1드로잉 인스타 툰 30일 챌린지',
      author: '픽셀아트',
      copies: 65,
      category: '예술/창작',
      desc: '하루 4컷 만화 또는 일러스트를 그려 SNS에 업로드하고 상호 응원 댓글 달아주는 크루',
      kpi: '30일 1일 1그림 완주',
      milestones: [
        { title: '매일 인스타 툰 업로드 & 인증', tasks: ['1일 1컷 이상 드로잉', '단톡방 링크 공유'] }
      ]
    }
  ];
  /* ---- 이전 전 index.html 14625~14634줄(#TASK-ES-481 생성기 표지) ---- */

  // 개인 목표 실사용자 공유 템플릿 6선
  var PERSONAL_TEMPLATES_REAL = [
    { id: 'ru_marathon_full', title: '🏃 100일 하프마라톤 완주 템플릿', author: '러너상민', copies: 142, category: '운동/러닝', desc: '초보자도 부상 없이 21km 완주할 수 있는 주차별 마일스톤 가이드', msCount: 4 },
    { id: 'ru_coding_boot', title: '💻 60일 알고리즘 & 토이프로젝트 정복', author: '코딩마스터', copies: 98, category: '개발/커리어', desc: '자료구조부터 실전 웹서비스 배포까지 완성하는 개발자 목표 템플릿', msCount: 5 },
    { id: 'ru_miracle_morning', title: '🌅 미라클 모닝 30일 루틴 챌린지', author: '아침형인간', copies: 215, category: '생활/루틴', desc: '오전 6시 기상, 명상 10분, 독서 20분으로 하루를 2배 길게 쓰는 템플릿', msCount: 3 },
    { id: 'ru_money_saving', title: '💰 6개월 1,000만원 모으기 가계부 팩', author: '절약왕', copies: 176, category: '재테크', desc: '불필요한 지출 통제 및 선저축 습관을 기르는 실천형 재테크 로드맵', msCount: 4 },
    { id: 'ru_toeic_900', title: '📘 토익 900점 8주 완성 단기 속성', author: '점수폭격기', copies: 320, category: '어학/학습', desc: '기출 어휘 1000제와 파트 5·7 시간단축 스킬 중심의 고득점 팩', msCount: 4 },
    { id: 'ru_mindful_detox', title: '🧘 마음 챙김 명상 & 디지털 디톡스', author: '힐링닥터', copies: 89, category: '마음/습관', desc: '스크린 타임 하루 2시간 이내로 줄이고 멘탈을 회복하는 4주 코스', msCount: 3 }
  ];
  /* ---- 이전 전 index.html 14635~15113줄(#TASK-ES-481 생성기 표지) ---- */
  function renderTemplateEncyclopediaScreen(){
    var tev = document.getElementById('templateEncyclopediaView');
    if(!tev) return;

    var catTabs = [
      { id: 'all', label: '전체' },
      { id: 'health', label: '💪 운동·건강' },
      { id: 'study', label: '📚 학습·자격' },
      { id: 'career', label: '💼 커리어·머니' },
      { id: 'hobby', label: '🎨 취미·창작' },
      { id: 'mind', label: '🧘 마음·습관' },
      { id: 'relation', label: '🏘️ 관계·생활' }
    ];

    var domainBadgeText = L._subtabTplDomain === 'personal' ? '개인 목표 카탈로그' :
                         L._subtabTplDomain === 'routine' ? '루틴 카탈로그' : '팀 목표 카탈로그';

    var headerHtml =
      '<div class="screen-head" style="margin-bottom:12px;">' +
        '<div class="screen-head-l">' +
          '<h2 class="s-title" style="margin:0;">📖 템플릿 백과사전</h2>' +
          '<span class="privacy-badge" style="background:var(--brand-soft);color:var(--brand-strong);border:1px solid var(--brand);margin-left:8px;">' + domainBadgeText + '</span>' +
        '</div>' +
      '</div>' +
      // 1단: 3대 도메인(개인/루틴/팀) 선택 세그먼트 (최소 44px 터치 타겟 엄수)
      '<div style="background:var(--card);border:1px solid var(--rule);border-radius:14px;padding:10px 12px;margin-bottom:12px;">' +
        '<div style="font-size:.75rem;font-weight:700;color:var(--ink-soft);margin-bottom:6px;">백과사전 도메인 분류 선택</div>' +
        '<div style="display:flex;gap:6px;overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:2px;">' +
          '<button type="button" class="btn btn-sm ' + (L._subtabTplDomain === 'personal' ? 'btn-primary' : 'btn-ghost') + '" id="encyclDomainPersonal" style="flex:1;min-height:44px;border-radius:10px;font-size:.84rem;font-weight:700;white-space:nowrap;padding:8px 12px;' + (L._subtabTplDomain !== 'personal' ? 'border:1px solid var(--rule);' : '') + '">' +
            '🎯 개인목표 백과사전' +
          '</button>' +
          '<button type="button" class="btn btn-sm ' + (L._subtabTplDomain === 'routine' ? 'btn-primary' : 'btn-ghost') + '" id="encyclDomainRoutine" style="flex:1;min-height:44px;border-radius:10px;font-size:.84rem;font-weight:700;white-space:nowrap;padding:8px 12px;' + (L._subtabTplDomain !== 'routine' ? 'border:1px solid var(--rule);' : '') + '">' +
            '⏰ 루틴 백과사전' +
          '</button>' +
          '<button type="button" class="btn btn-sm ' + (L._subtabTplDomain === 'team' ? 'btn-primary' : 'btn-ghost') + '" id="encyclDomainTeam" style="flex:1;min-height:44px;border-radius:10px;font-size:.84rem;font-weight:700;white-space:nowrap;padding:8px 12px;' + (L._subtabTplDomain !== 'team' ? 'border:1px solid var(--rule);' : '') + '">' +
            '👥 팀 목표 백과사전' +
          '</button>' +
        '</div>' +
      '</div>' +
      // 2단: 2대 출처(AI 추천 / 실사용자) 전환 및 검색창
      '<div style="background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:12px 14px;margin-bottom:14px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px;">' +
          '<div style="display:flex;gap:6px;flex:1;">' +
            '<button type="button" class="btn btn-sm ' + (L._subtabTplType === 'ai' ? 'btn-primary' : 'btn-ghost') + '" id="subtabTplBtnAi" style="flex:1;min-height:40px;border-radius:20px;font-size:.8125rem;font-weight:700;' + (L._subtabTplType !== 'ai' ? 'border:1px solid var(--rule);' : '') + '">' +
              '🤖 AI 추천 템플릿' +
            '</button>' +
            '<button type="button" class="btn btn-sm ' + (L._subtabTplType === 'real' ? 'btn-primary' : 'btn-ghost') + '" id="subtabTplBtnReal" style="flex:1;min-height:40px;border-radius:20px;font-size:.8125rem;font-weight:700;' + (L._subtabTplType !== 'real' ? 'border:1px solid var(--rule);' : '') + '">' +
              '👥 실사용자 템플릿' +
            '</button>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
          '<input type="text" id="subtabTplSearchInp" value="' + L.escapeHtml(L._subtabTplQuery) + '" placeholder="' + (L._subtabTplDomain==='personal'?'개인 목표 키워드 검색 (예: 마라톤, 토익, 기상...)':L._subtabTplDomain==='routine'?'루틴 키워드 검색 (예: 미라클모닝, 뽀모도로...)':'팀 챌린지 키워드 검색 (예: 알고리즘, 러닝크루...)') + '" style="flex:1;min-height:40px;padding:8px 12px;border:1px solid var(--rule);border-radius:10px;background:var(--bg);color:var(--ink);font-size:.8125rem;">' +
          (L._subtabTplQuery ? '<button type="button" id="subtabTplSearchClear" class="btn btn-ghost btn-xs" style="padding:6px 10px;font-size:.75rem;">초기화</button>' : '') +
        '</div>' +
      '</div>';

    var chipsHtml = '';
    // 개인목표 AI일 경우 테마 카테고리 칩 제공
    if(L._subtabTplDomain === 'personal' && L._subtabTplType === 'ai'){
      chipsHtml = '<div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:10px;margin-bottom:12px;-webkit-overflow-scrolling:touch;">' +
        catTabs.map(function(c){
          var on = (c.id === L._subtabTplCat);
          return '<button type="button" class="btn btn-xs ' + (on ? 'btn-primary' : 'btn-ghost') + '" data-subtcat="' + c.id + '" style="font-size:.78125rem;white-space:nowrap;padding:6px 12px;min-height:34px;border-radius:16px;' + (on ? 'font-weight:700;' : 'border:1px solid var(--rule);') + '">' +
            c.label +
          '</button>';
        }).join('') +
      '</div>';
    }

    var listHtml = '';
    var q = (L._subtabTplQuery || '').toLowerCase();
    /* =========================================================================
     * 도메인 1: 🎯 개인목표 백과사전
     * ========================================================================= */
    if(L._subtabTplDomain === 'personal'){
      if(L._subtabTplType === 'ai'){
        var allTpls = [];
        if(window.OURGOAL_60_TEMPLATES && typeof window.OURGOAL_60_TEMPLATES.getByCategory === 'function'){
          allTpls = window.OURGOAL_60_TEMPLATES.getByCategory(L._subtabTplCat);
        } else {
          allTpls = window.CREATOR_TEMPLATES || [];
        }
        if(q){
          allTpls = allTpls.filter(function(t){
            return (t.title && t.title.toLowerCase().indexOf(q) !== -1) ||
                   (t.desc && t.desc.toLowerCase().indexOf(q) !== -1) ||
                   (t.category && t.category.toLowerCase().indexOf(q) !== -1);
          });
        }
        if(allTpls.length === 0){
          listHtml = '<div class="empty-state" style="padding:40px 20px;text-align:center;color:var(--ink-soft);"><p>검색 결과와 일치하는 개인목표 템플릿이 없습니다.</p></div>';
        } else {
          listHtml = '<div style="display:flex;flex-direction:column;gap:12px;">' +
            allTpls.map(function(t){
              var totalTasks = (t.ms || []).reduce(function(a, m){ return a + (m.tasks || []).length; }, 0);
              var badgeText = t.badge || (t.categoryMinor ? t.categoryMinor : '추천');
              return '<div class="card" style="padding:14px;background:var(--surface);border:1px solid var(--rule);border-radius:14px;">' +
                '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
                  '<div style="display:flex;align-items:center;gap:6px;">' +
                    '<span style="background:var(--brand);color:#fff;font-size:.6875rem;padding:2px 7px;border-radius:6px;font-weight:700;">' + L.escapeHtml(badgeText) + '</span>' +
                    '<b style="font-size:.9375rem;color:var(--ink);">' + L.escapeHtml(t.title) + '</b>' +
                  '</div>' +
                  '<span class="faint" style="font-size:.75rem;white-space:nowrap;flex-shrink:0;margin-left:8px;">' + (t.weeks || 12) + '주 과정</span>' +
                '</div>' +
                '<div style="font-size:.8125rem;color:var(--ink-soft);margin-bottom:8px;line-height:1.45;">' + L.escapeHtml(t.desc || '') + '</div>' +
                '<div class="faint" style="font-size:.75rem;margin-bottom:10px;background:var(--card2);padding:6px 10px;border-radius:8px;">' +
                  '🚩 4단계 마일스톤 ' + (t.ms || []).length + '개 · 세부할일 ' + totalTasks + '개' + (t.kpi ? ' · 🎯 ' + L.escapeHtml(t.kpi) : '') +
                '</div>' +
                '<div style="display:flex;gap:8px;">' +
                  '<button type="button" class="btn btn-ghost btn-sm" data-subtpl-prev="' + t.id + '" style="flex:1;min-height:40px;font-size:.8125rem;padding:7px 0;border:1px solid var(--rule);border-radius:8px;">👀 상세 미리보기</button>' +
                  '<button type="button" class="btn btn-primary btn-sm btn-transplant" data-subtpl-clone="' + t.id + '" style="flex:1.6;min-height:40px;font-size:.8125rem;font-weight:700;padding:7px 0;border-radius:8px;">⚡ 개인 목표에 바로 담기 (1초 이식)</button>' +
                '</div>' +
              '</div>';
            }).join('') +
          '</div>';
        }
      } else {
        // 개인목표 실사용자 템플릿
        var realPersonal = PERSONAL_TEMPLATES_REAL;
        if(q){
          realPersonal = realPersonal.filter(function(t){
            return t.title.toLowerCase().indexOf(q) !== -1 || t.desc.toLowerCase().indexOf(q) !== -1;
          });
        }
        listHtml = '<div style="display:flex;flex-direction:column;gap:12px;">' +
          realPersonal.map(function(t){
            return '<div class="card" style="padding:14px;background:var(--surface);border:1px solid var(--rule);border-radius:14px;">' +
              '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
                '<b style="font-size:.9375rem;color:var(--ink);">' + L.escapeHtml(t.title) + '</b>' +
                '<span class="tag on" style="font-size:.6875rem;padding:2px 7px;background:var(--brand);color:#fff;border-radius:4px;">' + L.escapeHtml(t.category) + '</span>' +
              '</div>' +
              '<div style="font-size:.8125rem;color:var(--ink-soft);margin-bottom:8px;line-height:1.45;">' + L.escapeHtml(t.desc) + '</div>' +
              '<div style="display:flex;align-items:center;justify-content:space-between;border-top:1px dashed var(--rule);padding-top:10px;font-size:.78125rem;color:var(--ink-soft);">' +
                '<span>작성자: <b>' + L.escapeHtml(t.author) + '</b> · 복제 <b>' + t.copies + '회</b></span>' +
                '<button type="button" class="btn btn-primary btn-sm btn-transplant" data-subtpl-real="' + t.id + '" data-tpltit="' + L.escapeHtml(t.title) + '" data-tplcat="' + L.escapeHtml(t.category) + '" style="font-size:.8125rem;font-weight:700;padding:6px 14px;min-height:36px;border-radius:8px;">⚡ 개인 목표에 바로 담기</button>' +
              '</div>' +
            '</div>';
          }).join('') +
        '</div>';
      }
    }

    /* =========================================================================
     * 도메인 2: ⏰ 루틴 백과사전
     * ========================================================================= */
    else if(L._subtabTplDomain === 'routine'){
      var dayMap = { 1:'월', 2:'화', 3:'수', 4:'목', 5:'금', 6:'토', 7:'일' };
      if(L._subtabTplType === 'ai'){
        var rTpls = ROUTINE_TEMPLATES_AI;
        if(q){
          rTpls = rTpls.filter(function(r){
            return r.title.toLowerCase().indexOf(q) !== -1 || r.desc.toLowerCase().indexOf(q) !== -1;
          });
        }
        listHtml = '<div style="display:flex;flex-direction:column;gap:12px;">' +
          rTpls.map(function(r){
            var dayStr = (r.days.length === 7) ? '매일' : (r.days.length === 5 && r.days[4] === 5) ? '평일 매일' : r.days.map(function(d){ return dayMap[d]; }).join(',');
            return '<div class="card" style="padding:14px;background:var(--surface);border:1px solid var(--rule);border-radius:14px;">' +
              '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
                '<div style="display:flex;align-items:center;gap:6px;">' +
                  '<span style="background:var(--brand);color:#fff;font-size:.6875rem;padding:2px 7px;border-radius:6px;font-weight:700;">' + L.escapeHtml(r.badge) + '</span>' +
                  '<b style="font-size:.9375rem;color:var(--ink);">' + L.escapeHtml(r.title) + '</b>' +
                '</div>' +
                '<span style="font-size:.8125rem;font-weight:700;color:var(--brand);background:var(--card2);padding:2px 8px;border-radius:6px;">⏰ ' + r.time + '</span>' +
              '</div>' +
              '<div style="font-size:.8125rem;color:var(--ink-soft);margin-bottom:8px;line-height:1.45;">' + L.escapeHtml(r.desc) + '</div>' +
              '<div class="faint" style="font-size:.75rem;margin-bottom:10px;background:var(--card2);padding:6px 10px;border-radius:8px;">' +
                '📅 반복: <b>' + dayStr + '</b> · 🔔 알림 켜짐 · 💡 메모: ' + L.escapeHtml(r.memo) +
              '</div>' +
              '<div style="display:flex;gap:8px;">' +
                '<button type="button" class="btn btn-primary btn-sm btn-transplant" data-subtpl-routine="' + r.id + '" style="flex:1;min-height:40px;font-size:.8125rem;font-weight:700;padding:7px 0;border-radius:8px;">⚡ 내 루틴에 바로 담기 (1초 이식)</button>' +
              '</div>' +
            '</div>';
          }).join('') +
        '</div>';
      } else {
        // 루틴 실사용자 템플릿
        var realRoutines = ROUTINE_TEMPLATES_REAL;
        if(q){
          realRoutines = realRoutines.filter(function(r){
            return r.title.toLowerCase().indexOf(q) !== -1 || r.desc.toLowerCase().indexOf(q) !== -1;
          });
        }
        listHtml = '<div style="display:flex;flex-direction:column;gap:12px;">' +
          realRoutines.map(function(r){
            var dayStr = (r.days.length === 7) ? '매일' : (r.days.length === 5 && r.days[4] === 5) ? '평일 매일' : r.days.map(function(d){ return dayMap[d]; }).join(',');
            return '<div class="card" style="padding:14px;background:var(--surface);border:1px solid var(--rule);border-radius:14px;">' +
              '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
                '<b style="font-size:.9375rem;color:var(--ink);">' + L.escapeHtml(r.title) + '</b>' +
                '<span style="font-size:.8125rem;font-weight:700;color:var(--brand);background:var(--card2);padding:2px 8px;border-radius:6px;">⏰ ' + r.time + '</span>' +
              '</div>' +
              '<div style="font-size:.8125rem;color:var(--ink-soft);margin-bottom:8px;line-height:1.45;">' + L.escapeHtml(r.desc) + '</div>' +
              '<div style="display:flex;align-items:center;justify-content:space-between;border-top:1px dashed var(--rule);padding-top:10px;font-size:.78125rem;color:var(--ink-soft);">' +
                '<span>작성자: <b>' + L.escapeHtml(r.author) + '</b> · 복제 <b>' + r.copies + '회</b> (' + dayStr + ')</span>' +
                '<button type="button" class="btn btn-primary btn-sm btn-transplant" data-subtpl-routine-real="' + r.id + '" style="font-size:.8125rem;font-weight:700;padding:6px 14px;min-height:36px;border-radius:8px;">⚡ 내 루틴에 바로 담기</button>' +
              '</div>' +
            '</div>';
          }).join('') +
        '</div>';
      }
    }

    /* =========================================================================
     * 도메인 3: 👥 팀 목표 백과사전
     * ========================================================================= */
    else if(L._subtabTplDomain === 'team'){
      if(L._subtabTplType === 'ai'){
        var tTpls = TEAM_TEMPLATES_AI;
        if(q){
          tTpls = tTpls.filter(function(t){
            return t.title.toLowerCase().indexOf(q) !== -1 || t.desc.toLowerCase().indexOf(q) !== -1 || (t.category && t.category.toLowerCase().indexOf(q) !== -1);
          });
        }
        listHtml = '<div style="display:flex;flex-direction:column;gap:12px;">' +
          tTpls.map(function(t){
            var msCount = (t.milestones || []).length;
            var taskCount = (t.milestones || []).reduce(function(a, m){ return a + (m.tasks || []).length; }, 0);
            return '<div class="card" style="padding:14px;background:var(--surface);border:1px solid var(--rule);border-radius:14px;">' +
              '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
                '<div style="display:flex;align-items:center;gap:6px;">' +
                  '<span style="background:var(--brand);color:#fff;font-size:.6875rem;padding:2px 7px;border-radius:6px;font-weight:700;">' + L.escapeHtml(t.badge) + '</span>' +
                  '<b style="font-size:.9375rem;color:var(--ink);">' + L.escapeHtml(t.title) + '</b>' +
                '</div>' +
                '<span class="tag on" style="font-size:.6875rem;padding:2px 7px;background:var(--card2);color:var(--ink);border:1px solid var(--rule);border-radius:4px;">' + L.escapeHtml(t.category) + '</span>' +
              '</div>' +
              '<div style="font-size:.8125rem;color:var(--ink-soft);margin-bottom:8px;line-height:1.45;">' + L.escapeHtml(t.desc) + '</div>' +
              '<div class="faint" style="font-size:.75rem;margin-bottom:10px;background:var(--card2);padding:6px 10px;border-radius:8px;">' +
                '👥 팀 마일스톤 ' + msCount + '단계 · 세부 액션 ' + taskCount + '개' + (t.kpi ? ' · 🎯 ' + L.escapeHtml(t.kpi) : '') +
              '</div>' +
              '<div style="display:flex;gap:8px;">' +
                '<button type="button" class="btn btn-primary btn-sm btn-transplant" data-subtpl-team="' + t.id + '" style="flex:1;min-height:40px;font-size:.8125rem;font-weight:700;padding:7px 0;border-radius:8px;">⚡ 팀 목표에 바로 담기 (1초 이식)</button>' +
              '</div>' +
            '</div>';
          }).join('') +
        '</div>';
      } else {
        // 팀 목표 실사용자 템플릿
        var realTeams = TEAM_TEMPLATES_REAL;
        if(q){
          realTeams = realTeams.filter(function(t){
            return t.title.toLowerCase().indexOf(q) !== -1 || t.desc.toLowerCase().indexOf(q) !== -1;
          });
        }
        listHtml = '<div style="display:flex;flex-direction:column;gap:12px;">' +
          realTeams.map(function(t){
            return '<div class="card" style="padding:14px;background:var(--surface);border:1px solid var(--rule);border-radius:14px;">' +
              '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
                '<b style="font-size:.9375rem;color:var(--ink);">' + L.escapeHtml(t.title) + '</b>' +
                '<span class="tag on" style="font-size:.6875rem;padding:2px 7px;background:var(--brand);color:#fff;border-radius:4px;">' + L.escapeHtml(t.category) + '</span>' +
              '</div>' +
              '<div style="font-size:.8125rem;color:var(--ink-soft);margin-bottom:8px;line-height:1.45;">' + L.escapeHtml(t.desc) + '</div>' +
              '<div style="display:flex;align-items:center;justify-content:space-between;border-top:1px dashed var(--rule);padding-top:10px;font-size:.78125rem;color:var(--ink-soft);">' +
                '<span>크루장: <b>' + L.escapeHtml(t.author) + '</b> · 복제 <b>' + t.copies + '회</b> · ' + L.escapeHtml(t.kpi) + '</span>' +
                '<button type="button" class="btn btn-primary btn-sm btn-transplant" data-subtpl-team-real="' + t.id + '" style="font-size:.8125rem;font-weight:700;padding:6px 14px;min-height:36px;border-radius:8px;">⚡ 팀 목표에 바로 담기</button>' +
              '</div>' +
            '</div>';
          }).join('') +
        '</div>';
      }
    }

    tev.innerHTML = headerHtml + chipsHtml + listHtml;
    // 1단: 3대 도메인 탭 이벤트 배선
    var btnDomPersonal = tev.querySelector('#encyclDomainPersonal');
    var btnDomRoutine = tev.querySelector('#encyclDomainRoutine');
    var btnDomTeam = tev.querySelector('#encyclDomainTeam');
    if(btnDomPersonal) btnDomPersonal.onclick = function(){ L._subtabTplDomain = 'personal'; renderTemplateEncyclopediaScreen(); };
    if(btnDomRoutine) btnDomRoutine.onclick = function(){ L._subtabTplDomain = 'routine'; renderTemplateEncyclopediaScreen(); };
    if(btnDomTeam) btnDomTeam.onclick = function(){ L._subtabTplDomain = 'team'; renderTemplateEncyclopediaScreen(); };

    // 2단: 2대 출처 탭 이벤트 배선
    var btnAi = tev.querySelector('#subtabTplBtnAi');
    var btnReal = tev.querySelector('#subtabTplBtnReal');
    if(btnAi) btnAi.onclick = function(){ L._subtabTplType = 'ai'; renderTemplateEncyclopediaScreen(); };
    if(btnReal) btnReal.onclick = function(){ L._subtabTplType = 'real'; renderTemplateEncyclopediaScreen(); };

    // 검색창 및 초기화
    var searchInp = tev.querySelector('#subtabTplSearchInp');
    if(searchInp){
      searchInp.oninput = function(){
        L._subtabTplQuery = searchInp.value.trim();
        renderTemplateEncyclopediaScreen();
      };
    }
    var searchClear = tev.querySelector('#subtabTplSearchClear');
    if(searchClear){
      searchClear.onclick = function(){
        L._subtabTplQuery = '';
        renderTemplateEncyclopediaScreen();
      };
    }

    // 개인목표 카테고리 칩 필터
    tev.querySelectorAll('[data-subtcat]').forEach(function(b){
      b.onclick = function(){
        L._subtabTplCat = b.dataset.subtcat;
        renderTemplateEncyclopediaScreen();
      };
    });

    // 상세 미리보기 모달
    tev.querySelectorAll('[data-subtpl-prev]').forEach(function(b){
      b.onclick = function(){
        if(window.OurgoalTeamInviteComm && window.OurgoalTeamInviteComm.openTemplatePreviewModal){
          window.OurgoalTeamInviteComm.openTemplatePreviewModal(b.dataset.subtplPrev);
        } else {
          L.toast('템플릿 상세 미리보기를 엽니다.');
        }
      };
    });

    /* =========================================================================
     * 도메인별 1초 이식(Transplant) 핸들러 배선
     * ========================================================================= */
    // 1. 개인 목표 이식 (AI)
    tev.querySelectorAll('[data-subtpl-clone]').forEach(function(b){
      b.onclick = async function(){
        var tId = b.dataset.subtplClone;
        b.disabled = true;
        b.textContent = '⏳ 이식 중...';
        if(typeof L.cloneTemplate === 'function'){
          await L.cloneTemplate(tId);
        }
        L.state.goalsSubTab = 'personal';
        if(typeof L.saveProfile === 'function') await L.saveProfile();
        if(typeof L.triggerHaptic === 'function') L.triggerHaptic(30);
        L.toast('🎯 개인 목표에 1초 이식 완료!');
        L.renderGoalsScreen();
        if(typeof L.renderAll === 'function') L.renderAll();
      };
    });

    // 2. 개인 목표 이식 (실사용자)
    tev.querySelectorAll('[data-subtpl-real]').forEach(function(b){
      b.onclick = async function(){
        b.disabled = true;
        b.textContent = '⏳ 이식 중...';
        if(typeof L.importTemplateInstantly === 'function'){
          await L.importTemplateInstantly(b.dataset.subtplReal, b.dataset.tpltit, b.dataset.tplcat);
        }
        L.state.goalsSubTab = 'personal';
        if(typeof L.saveProfile === 'function') await L.saveProfile();
        if(typeof L.triggerHaptic === 'function') L.triggerHaptic(30);
        L.toast('🎯 개인 목표에 1초 이식 완료!');
        L.renderGoalsScreen();
        if(typeof L.renderAll === 'function') L.renderAll();
      };
    });

    // 3. 루틴 이식 (AI)
    tev.querySelectorAll('[data-subtpl-routine]').forEach(function(b){
      b.onclick = async function(){
        var rId = b.dataset.subtplRoutine;
        var rTpl = ROUTINE_TEMPLATES_AI.find(function(x){ return x.id === rId; });
        if(!rTpl) return;
        b.disabled = true;
        b.textContent = '⏳ 이식 중...';
        
        if(!L.state.profile.settings) L.state.profile.settings = {};
        if(!Array.isArray(L.state.profile.settings.routines)) L.state.profile.settings.routines = [];
        
        var newRoutine = {
          id: (typeof L.uid === 'function' ? L.uid('rt') : ('rt_' + Date.now())),
          title: rTpl.title,
          time: rTpl.time,
          days: rTpl.days ? [].concat(rTpl.days) : [1,2,3,4,5,6,7],
          notify: true,
          memo: rTpl.memo || '',
          completedDates: []
        };
        L.state.profile.settings.routines.unshift(newRoutine);
        
        L.state.goalsSubTab = 'routine';
        if(typeof L.saveProfile === 'function') await L.saveProfile();
        if(typeof L.triggerHaptic === 'function') L.triggerHaptic(30);
        L.toast('⏰ 나의 루틴에 1초 이식 완료!');
        L.renderGoalsScreen();
        if(typeof L.renderAll === 'function') L.renderAll();
      };
    });

    // 4. 루틴 이식 (실사용자)
    tev.querySelectorAll('[data-subtpl-routine-real]').forEach(function(b){
      b.onclick = async function(){
        var rId = b.dataset.subtplRoutineReal;
        var rTpl = ROUTINE_TEMPLATES_REAL.find(function(x){ return x.id === rId; });
        if(!rTpl) return;
        b.disabled = true;
        b.textContent = '⏳ 이식 중...';

        if(!L.state.profile.settings) L.state.profile.settings = {};
        if(!Array.isArray(L.state.profile.settings.routines)) L.state.profile.settings.routines = [];

        var newRoutine = {
          id: (typeof L.uid === 'function' ? L.uid('rt') : ('rt_' + Date.now())),
          title: rTpl.title,
          time: rTpl.time,
          days: rTpl.days ? [].concat(rTpl.days) : [1,2,3,4,5,6,7],
          notify: true,
          memo: rTpl.memo || '',
          completedDates: []
        };
        L.state.profile.settings.routines.unshift(newRoutine);

        L.state.goalsSubTab = 'routine';
        if(typeof L.saveProfile === 'function') await L.saveProfile();
        if(typeof L.triggerHaptic === 'function') L.triggerHaptic(30);
        L.toast('⏰ 나의 루틴에 1초 이식 완료!');
        L.renderGoalsScreen();
        if(typeof L.renderAll === 'function') L.renderAll();
      };
    });

    // 5. 팀 목표 이식 (AI & 실사용자)
    var transplantTeamTpl = async function(tTpl, btnEl){
      btnEl.disabled = true;
      btnEl.textContent = '⏳ 이식 중...';

      var targetGroup = (typeof L.MOCK_GROUPS !== 'undefined') ? L.MOCK_GROUPS.find(function(g){ return L.groupState(g.id).joined; }) : null;
      if(!targetGroup && typeof L.MOCK_GROUPS !== 'undefined' && L.MOCK_GROUPS.length > 0){
        targetGroup = L.MOCK_GROUPS[0];
        L.groupState(targetGroup.id).joined = true;
      }

      var msData = (tTpl.milestones || []).map(function(m, idx){
        return {
          id: (typeof L.uid === 'function' ? L.uid('tgm') : ('tgm_' + Date.now() + '_' + idx)),
          title: m.title || ('마일스톤 ' + (idx + 1)),
          status: 'todo',
          priority: 'med',
          tasks: (m.tasks || []).map(function(tk, tIdx){
            return {
              id: (typeof L.uid === 'function' ? L.uid('tgt') : ('tgt_' + Date.now() + '_' + tIdx)),
              title: (typeof tk === 'string' ? tk : tk.title),
              done: false
            };
          })
        };
      });

      var newTeamGoal = {
        id: (typeof L.uid === 'function' ? L.uid('tg') : ('tg_' + Date.now())),
        title: tTpl.title,
        dueDate: new Date(Date.now() + 60*86400000).toISOString().slice(0, 10),
        category: tTpl.category || '팀 챌린지',
        milestones: msData
      };

      if(targetGroup){
        if(!targetGroup.teamGoals) targetGroup.teamGoals = [];
        targetGroup.teamGoals.unshift(newTeamGoal);
        L.state.teamGoalFilterGid = targetGroup.id;
      }

      L.state.goalsSubTab = 'team';
      if(typeof L.saveProfile === 'function') await L.saveProfile();
      if(typeof L.triggerHaptic === 'function') L.triggerHaptic(30);
      L.toast('👥 팀 목표에 1초 이식 완료!');
      L.renderGoalsScreen();
      if(typeof L.renderAll === 'function') L.renderAll();
    };

    tev.querySelectorAll('[data-subtpl-team]').forEach(function(b){
      b.onclick = async function(){
        var tId = b.dataset.subtplTeam;
        var tTpl = TEAM_TEMPLATES_AI.find(function(x){ return x.id === tId; });
        if(tTpl) await transplantTeamTpl(tTpl, b);
      };
    });

    tev.querySelectorAll('[data-subtpl-team-real]').forEach(function(b){
      b.onclick = async function(){
        var tId = b.dataset.subtplTeamReal;
        var tTpl = TEAM_TEMPLATES_REAL.find(function(x){ return x.id === tId; });
        if(tTpl) await transplantTeamTpl(tTpl, b);
      };
    });
  }

  K.ROUTINE_TEMPLATES_AI = ROUTINE_TEMPLATES_AI;
  K.ROUTINE_TEMPLATES_REAL = ROUTINE_TEMPLATES_REAL;
  K.TEAM_TEMPLATES_AI = TEAM_TEMPLATES_AI;
  K.TEAM_TEMPLATES_REAL = TEAM_TEMPLATES_REAL;
  K.PERSONAL_TEMPLATES_REAL = PERSONAL_TEMPLATES_REAL;
  K.renderTemplateEncyclopediaScreen = renderTemplateEncyclopediaScreen;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
