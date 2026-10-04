/**
 * @role 아바타 페르소나 데이터 — ENTJ 20종 (id 41~60, group NT)
 *
 * #TASK-ES-386: js/avatar-system.js 의 BODY_THEMES_320 에서 글자 그대로 옮긴 데이터만 있다(로직 없음).
 * js/avatar-system.js 가 intj→intp→…→esfp 순서로 이어 BODY_THEMES_320 을 만든다.
 * 생성기: docs/design/harness/module-split/gen-avatar-data.js — 동일성 시험: tests/ 폴더 avatar-personas-split 시험
 */
(function(root) {
  'use strict';

  var LIST = [
  {
    "id": 41,
    "mbti": "ENTJ",
    "group": "NT",
    "cat": "비즈니스/리더십",
    "name": "스케일업 유니콘 CEO",
    "kw": "J커브, 시장지배, 결단력",
    "desc": "명확한 비전과 거침없는 추진력으로 시장을 독점하는 연쇄 창업가",
    "gear": "CEO 스마트워치",
    "icon": "💼",
    "color": "#1E293B",
    "subColor": "#F1F5F9"
  },
  {
    "id": 42,
    "mbti": "ENTJ",
    "group": "NT",
    "cat": "전략/조직",
    "name": "야전 사령관",
    "kw": "통솔, 자원동원, 기동전",
    "desc": "혼란스러운 전황 속에서도 냉철하게 부대를 재편하여 승리를 쟁취하는 지휘관",
    "gear": "지휘봉과 야전지도",
    "icon": "🎖️",
    "color": "#1E293B",
    "subColor": "#F1F5F9"
  },
  {
    "id": 43,
    "mbti": "ENTJ",
    "group": "NT",
    "cat": "투자/M&A",
    "name": "피투자 M&A 헌터",
    "kw": "실사, 기업가치, 밸류업",
    "desc": "잠재력 있는 기업을 인수해 10배의 가치로 리빌딩하는 노련한 사모펀드 매니저",
    "gear": "황금 서명 펜",
    "icon": "📈",
    "color": "#1E293B",
    "subColor": "#F1F5F9"
  },
  {
    "id": 44,
    "mbti": "ENTJ",
    "group": "NT",
    "cat": "생산성/목표",
    "name": "OKR 드라이버",
    "kw": "KPI타파, 정렬, 성과주의",
    "desc": "팀 전체의 역량을 가장 중요한 핵심 지표 하나에 일사불란하게 집중시키는 총괄",
    "gear": "전광판 대시보드",
    "icon": "🎯",
    "color": "#1E293B",
    "subColor": "#F1F5F9"
  },
  {
    "id": 45,
    "mbti": "ENTJ",
    "group": "NT",
    "cat": "스피치/영향력",
    "name": "키노트 스피커",
    "kw": "설득, 카리스마, 대중압도",
    "desc": "단 10분의 프레젠테이션으로 수천 명의 청중과 투자자를 매료시키는 웅변가",
    "gear": "무선 핀마이크",
    "icon": "🎙️",
    "color": "#1E293B",
    "subColor": "#F1F5F9"
  },
  {
    "id": 46,
    "mbti": "ENTJ",
    "group": "NT",
    "cat": "커리어/협상",
    "name": "헤비급 딜메이커",
    "kw": "윈윈, 레버리지, 담판",
    "desc": "불리한 조건에서도 카리스마와 전략적 레버리지로 최고의 딜을 성사시키는 협상가",
    "gear": "가죽 브리프케이스",
    "icon": "🤝",
    "color": "#1E293B",
    "subColor": "#F1F5F9"
  },
  {
    "id": 47,
    "mbti": "ENTJ",
    "group": "NT",
    "cat": "스포츠/피트니스",
    "name": "철인 트라이애슬론 챔프",
    "kw": "한계돌파, 강철체력, 규율",
    "desc": "수영, 사이클, 마라톤을 완주하며 자신의 육체와 정신을 완벽히 지배하는 철인",
    "gear": "카본 TT 바이크",
    "icon": "🚴",
    "color": "#1E293B",
    "subColor": "#F1F5F9"
  },
  {
    "id": 48,
    "mbti": "ENTJ",
    "group": "NT",
    "cat": "혁신/미래",
    "name": "우주 항공 테크 기업가",
    "kw": "화성탐사, 재사용로켓, 인류도약",
    "desc": "지구의 한계를 넘어 행성 간 문명을 구축하겠다는 비전을 실현하는 개척자",
    "gear": "로켓 발사 콘솔",
    "icon": "🚀",
    "color": "#1E293B",
    "subColor": "#F1F5F9"
  },
  {
    "id": 49,
    "mbti": "ENTJ",
    "group": "NT",
    "cat": "조직/개혁",
    "name": "턴어라운드 마스터",
    "kw": "체질개선, 비효율제거, 흑자전환",
    "desc": "도산 위기의 조직에 긴급 수술을 감행해 단기간에 흑자로 반등시키는 개혁가",
    "gear": "붉은 결재인",
    "icon": "📑",
    "color": "#1E293B",
    "subColor": "#F1F5F9"
  },
  {
    "id": 50,
    "mbti": "ENTJ",
    "group": "NT",
    "cat": "자기계발/습관",
    "name": "새벽 4시 에그제큐티브",
    "kw": "미라클모닝, 하루선점, 규율",
    "desc": "세상이 잠든 새벽 4시에 하루를 먼저 시작해 모든 핵심 결정을 끝마치는 리더",
    "gear": "새벽 다이어리",
    "icon": "🌅",
    "color": "#1E293B",
    "subColor": "#F1F5F9"
  },
  {
    "id": 51,
    "mbti": "ENTJ",
    "group": "NT",
    "cat": "글로벌/확장",
    "name": "글로벌 익스팬션 디렉터",
    "kw": "해외진출, 시장선점, 법인설립",
    "desc": "전 세계 주요 거점 도시마다 현지 지사를 깃발 꽂듯 확장하는 글로벌 총괄",
    "gear": "세계지도 데스크패드",
    "icon": "🌐",
    "color": "#1E293B",
    "subColor": "#F1F5F9"
  },
  {
    "id": 52,
    "mbti": "ENTJ",
    "group": "NT",
    "cat": "학업/자격",
    "name": "아이비리그 수석 졸업생",
    "kw": "수석합격, 올A+, 철저한준비",
    "desc": "최고의 지성들이 모인 곳에서 압도적인 실력과 규율로 정점에 선 엘리트",
    "gear": "수석 졸업 메달",
    "icon": "🎓",
    "color": "#1E293B",
    "subColor": "#F1F5F9"
  },
  {
    "id": 53,
    "mbti": "ENTJ",
    "group": "NT",
    "cat": "법률/정의",
    "name": "로펌 대표 변호사",
    "kw": "승소율, 전면전, 법리해석",
    "desc": "수천억 대의 기업 소송에서 치밀한 변론으로 승리를 이끌어내는 대표 파트너",
    "gear": "법전과 골든 가벨",
    "icon": "⚖️",
    "color": "#1E293B",
    "subColor": "#F1F5F9"
  },
  {
    "id": 54,
    "mbti": "ENTJ",
    "group": "NT",
    "cat": "문화/프로듀싱",
    "name": "글로벌 미디어 총괄 PD",
    "kw": "블록버스터, 흥행보증, 진두지휘",
    "desc": "수백억 제작비의 프로젝트를 한 치의 오차 없이 일정 내에 완벽 론칭하는 프로듀서",
    "gear": "디렉터 메가폰",
    "icon": "🎬",
    "color": "#1E293B",
    "subColor": "#F1F5F9"
  },
  {
    "id": 55,
    "mbti": "ENTJ",
    "group": "NT",
    "cat": "도시/개발",
    "name": "스마트 시티 플래너",
    "kw": "인프라구축, 미래도시, 친환경에너지",
    "desc": "수십만 명이 살아갈 미래형 자율주행 친환경 도시의 청사진을 지휘하는 총괄",
    "gear": "도시 조감도",
    "icon": "🏙️",
    "color": "#1E293B",
    "subColor": "#F1F5F9"
  },
  {
    "id": 56,
    "mbti": "ENTJ",
    "group": "NT",
    "cat": "스포츠/팀",
    "name": "프로구단 단장",
    "kw": "선수영입, 연봉협상, 우승트레블",
    "desc": "철저한 머니볼 데이터 분석과 통솔력으로 만년 꼴찌팀을 챔피언으로 만드는 단장",
    "gear": "선수단 엔트리 보드",
    "icon": "⚾",
    "color": "#1E293B",
    "subColor": "#F1F5F9"
  },
  {
    "id": 57,
    "mbti": "ENTJ",
    "group": "NT",
    "cat": "웰빙/멘탈",
    "name": "스토아 철학 실천가",
    "kw": "부동심, 통제영역, 역경극복",
    "desc": "어떤 외부 위기나 비난에도 흔들리지 않고 통제 가능한 것에만 전력하는 자",
    "gear": "마르쿠스 명상록",
    "icon": "🏛️",
    "color": "#1E293B",
    "subColor": "#F1F5F9"
  },
  {
    "id": 58,
    "mbti": "ENTJ",
    "group": "NT",
    "cat": "인맥/네트워크",
    "name": "마스터마인드 호스트",
    "kw": "탑티어모임, 시너지, 영향력",
    "desc": "각 분야 최고의 리더들을 한자리에 모아 막강한 협력 생태계를 구축하는 주최자",
    "gear": "라운드테이블 네임택",
    "icon": "🥂",
    "color": "#1E293B",
    "subColor": "#F1F5F9"
  },
  {
    "id": 59,
    "mbti": "ENTJ",
    "group": "NT",
    "cat": "지식/저술",
    "name": "경영 전략서 베스트셀러 저자",
    "kw": "경영원칙, 베스트셀러, 프레임워크",
    "desc": "현장에서 검증된 성공 방정식을 누구나 따를 수 있는 프레임워크로 집대성한 저자",
    "gear": "하드커버 저서",
    "icon": "📕",
    "color": "#1E293B",
    "subColor": "#F1F5F9"
  },
  {
    "id": 60,
    "mbti": "ENTJ",
    "group": "NT",
    "cat": "목표/승리",
    "name": "정복자 빅토리어스",
    "kw": "목표초과달성, 챔피언, 영광",
    "desc": "장애물을 디딤돌 삼아 더 높은 고지로 올라서서 승리의 깃발을 꽂는 절대 리더",
    "gear": "챔피언 깃발",
    "icon": "🚩",
    "color": "#1E293B",
    "subColor": "#F1F5F9"
  }
  ];

  if (typeof module === 'object' && module && module.exports) {
    module.exports = LIST;
  } else if (root) {
    (root.OurgoalAvatarPersonaParts = root.OurgoalAvatarPersonaParts || {}).entj = LIST;
  }
})(typeof self !== 'undefined' ? self : this);
