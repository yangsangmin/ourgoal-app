/**
 * Curated Market Templates Data
 *
 * 맞춤 템플릿 커뮤니티 마켓플레이스 큐레이션 데이터
 * #TASK-ES-591(인라인 어려움 묶음 시범): index.html 인라인 IIFE 의 구간(이전 전 5185~5315줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalCuratedMarketDataKit = global.OurgoalCuratedMarketDataKit || {};

  /* ---- 이전 전 index.html 5185~5315줄(#TASK-ES-591 생성기 표지) ---- */
  /* [#TASK-ES-526] parseVoiceToTableRow · openVoiceTableModal → js/tabs/records/voice-table-input.js 로 옮김(인라인 3단계 Z4 이동 3차(표 CSV·웨어러블·목표 연동 · 음성 표 입력 · 테마별 기록 CSV · 함께 목표 초대 글자) — 앞 주석 포함) */

  /* 🏪 맞춤 템플릿 커뮤니티 마켓플레이스 큐레이션 데이터 */
  var CURATED_MARKET_TEMPLATES = [
    {
      key: 'mkt_crossfit_fran',
      title: '크로스핏 Fran WOD & 역도',
      icon: '🔥',
      category: 'workout',
      author: '아워골 크로스핏터 연합',
      downloads: '2,480',
      description: '쓰러스터와 풀업 21-15-9 및 세트별 무게(lb), 타임캡, Rx 여부를 체계적으로 기록하는 대표 WOD 템플릿.',
      columns: ['구간', '운동종목', '무게(lb)', '목표횟수', '수행시간', 'Rx여부'],
      defaultRows: [
        ['1R', 'Thruster (쓰러스터)', '95lb', '21', '02:30', 'Rx'],
        ['1R', 'Pull-up (풀업)', '체중', '21', '01:45', 'Rx'],
        ['2R', 'Thruster (쓰러스터)', '95lb', '15', '02:00', 'Rx'],
        ['2R', 'Pull-up (풀업)', '체중', '15', '01:20', 'Rx'],
        ['3R', 'Thruster (쓰러스터)', '95lb', '9', '01:10', 'Rx'],
        ['3R', 'Pull-up (풀업)', '체중', '9', '00:55', 'Rx']
      ]
    },
    {
      key: 'mkt_hyrox_8stations',
      title: '하이록스 8대 공식 스테이션 풀세트',
      icon: '🏃',
      category: 'workout',
      author: 'HYROX 마스터 코치',
      downloads: '3,890',
      description: '1km 러닝부터 8대 기능성 스테이션(스키에르그, 슬레드, 버피, 로잉, 파머스, 런지, 월볼) 전 종목 완주 기록 템플릿.',
      columns: ['순서', '종목명', '거리/무게', '소요시간', '평균심박(bpm)', '페이스'],
      defaultRows: [
        ['1', '1km 러닝 1', '1km', '04:25', '162', '04:25/km'],
        ['2', '1000m 스키에르그', '1000m', '04:05', '168', '02:02/500m'],
        ['3', '50m 슬레드 푸시', '152kg', '02:30', '174', '02:30'],
        ['4', '50m 슬레드 풀', '103kg', '03:40', '178', '03:40'],
        ['5', '80m 버피 브로드점프', '80m', '03:55', '182', '03:55'],
        ['6', '1000m 로잉', '1000m', '03:58', '170', '01:59/500m'],
        ['7', '200m 파머스 캐리', '2x24kg', '02:10', '165', '02:10'],
        ['8', '100m 샌드백 런지', '20kg', '04:15', '176', '04:15'],
        ['9', '100 월볼', '6kg', '04:40', '180', '100회 완료']
      ]
    },
    {
      key: 'mkt_health_ppl',
      title: '헬스 PPL 3분할 & 3대 운동 루틴',
      icon: '🏋️',
      category: 'workout',
      author: 'NSCA 공인 트레이너',
      downloads: '5,120',
      description: '가슴/등/하체 3대 운동 점진적 과부하 추적 및 세트수, 총 볼륨(kg)을 자동 계산하는 정통 웨이트 템플릿.',
      columns: ['번호', '부위', '운동종목', '세트', '무게(kg)', '횟수', 'RPE강도'],
      defaultRows: [
        ['1', '가슴', '바벨 벤치프레스', '4', '85', '8', '8.5'],
        ['2', '어깨', '오버헤드 프레스', '3', '50', '10', '8.0'],
        ['3', '삼두', '케이블 트라이셉스 익스텐션', '3', '35', '12', '7.5']
      ]
    },
    {
      key: 'mkt_certified_broker',
      title: '공인중개사 1차 3회독 오답노트',
      icon: '📚',
      category: 'study',
      author: '34회 공인중개사 동차합격자',
      downloads: '1,950',
      description: '부동산학개론 및 민법 핵심 문항별 회독 차수, 핵심 판례 키워드, 오답 원인을 명쾌히 정리하는 수험 템플릿.',
      columns: ['문항번호', '과목명', '회독차수', '핵심키워드/판례', '정답여부', '오답원인'],
      defaultRows: [
        ['1', '민법 및 민사특별법', '1회독', '착오로 인한 의사표시 취소', 'X', '중대한 과실 입증책임 혼동'],
        ['2', '부동산학개론', '2회독', '수요와 공급의 탄력성 계산', 'O', '공식 숙지 완료'],
        ['3', '민법 및 민사특별법', '1회독', '명의신탁 효력과 3자 보호', 'X', '부동산실명법 예외 특례 미숙지']
      ]
    },
    {
      key: 'mkt_stock_trading',
      title: '주식 단타 & 스윙 원칙 매매일지',
      icon: '📈',
      category: 'business',
      author: '전업 트레이더 멘토',
      downloads: '2,110',
      description: '매수가, 손절가, 목표가, 비중, 진입 근거 및 뇌동매매 방지 원칙 준수 여부를 철저히 기록하는 일지.',
      columns: ['매매일자', '종목명', '매수가', '목표가', '손절가', '수익률(%)', '매매원칙준수'],
      defaultRows: [
        ['26.09.10', '삼성전자', '74,500', '78,000', '73,000', '+3.8%', '준수 (분할매수)'],
        ['26.09.10', 'SK하이닉스', '178,000', '190,000', '173,000', '+5.2%', '준수 (눌림목 돌파)']
      ]
    },
    {
      key: 'mkt_algo_codetest',
      title: '개발자 코딩테스트 & 알고리즘 오답노트',
      icon: '💻',
      category: 'study',
      author: '백준 플래티넘 개발자',
      downloads: '1,670',
      description: '백준/프로그래머스 문제 유형, 시간복잡도, 놓친 엣지 케이스, 재풀이 주기를 관리하는 개발자 필수 템플릿.',
      columns: ['플랫폼/번호', '알고리즘유형', '시간복잡도', '소요시간', '틀린원인', '재풀이필요'],
      defaultRows: [
        ['백준 12865', 'DP 배낭문제(Knapsack)', 'O(NW)', '40분', '2차원 배열 공간복잡도 초과', '필수 (3일후)'],
        ['프로그래머스 42842', '완전탐색 카펫', 'O(sqrt(N))', '18분', '가로/세로 길이 조건 분기', '완료']
      ]
    },
    {
      key: 'mkt_bodyprofile_diet',
      title: '바디프로필 식단 & 매크로 계산표',
      icon: '🥗',
      category: 'life',
      author: '피트니스 모델 챔피언',
      downloads: '3,240',
      description: '아침/점심/저녁/간식 탄단지(g), 총 칼로리(kcal), 공복 몸무게를 일자별로 추적하는 다이어트 템플릿.',
      columns: ['끼니구분', '메뉴구성', '탄수화물(g)', '단백질(g)', '지방(g)', '총칼로리(kcal)'],
      defaultRows: [
        ['아침', '오트밀 50g + 닭가슴살 100g', '35g', '28g', '4g', '320kcal'],
        ['점심', '현미밥 150g + 소고기 우둔살 150g', '50g', '36g', '6g', '450kcal'],
        ['운동후', '프로틴 쉐이크 1스쿱 + 바나나 1개', '27g', '24g', '1g', '220kcal']
      ]
    },
    {
      key: 'mkt_b2b_sales',
      title: 'B2B 엔터프라이즈 세일즈 파이프라인',
      icon: '💼',
      category: 'business',
      author: 'SaaS 세일즈 디렉터',
      downloads: '1,430',
      description: '고객사, 딜 규모, 파이프라인 단계, 클로징 성사율(%), 다음 미팅 액션을 한눈에 관리하는 B2B 영업 템플릿.',
      columns: ['고객사', '딜규모(만원)', '파이프라인단계', '성사확률(%)', '의사결정권자', '다음조치'],
      defaultRows: [
        ['(주)에이아이랩', '4,500', '제안서 검토', '65%', 'CTO 미팅 완료', 'POC 결과 보고서 송부'],
        ['(주)글로벌네트', '8,200', '최종 계약 조율', '90%', '대표이사 구두합의', '계약서 날인 진행']
      ]
    }
  ];

  K.CURATED_MARKET_TEMPLATES = CURATED_MARKET_TEMPLATES;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
