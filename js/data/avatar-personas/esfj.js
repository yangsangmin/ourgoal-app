/**
 * @role 아바타 페르소나 데이터 — ESFJ 20종 (id 221~240, group SJ)
 *
 * #TASK-ES-386: js/avatar-system.js 의 BODY_THEMES_320 에서 글자 그대로 옮긴 데이터만 있다(로직 없음).
 * js/avatar-system.js 가 intj→intp→…→esfp 순서로 이어 BODY_THEMES_320 을 만든다.
 * 생성기: docs/design/harness/module-split/gen-avatar-data.js — 동일성 시험: tests/ 폴더 avatar-personas-split 시험
 */
(function(root) {
  'use strict';

  var LIST = [
  {
    "id": 221,
    "mbti": "ESFJ",
    "group": "SJ",
    "cat": "사교/모임",
    "name": "행복 소셜 파티 호스트",
    "kw": "환영인사, 소외자챙기기, 분위기메이커",
    "desc": "모임에 온 모든 사람이 소외되지 않고 즐겁게 웃고 갈 수 있도록 따뜻하게 챙기는 안주인",
    "gear": "웰컴 샴페인 트레이",
    "icon": "🥂",
    "color": "#DB2777",
    "subColor": "#FCE7F3"
  },
  {
    "id": 222,
    "mbti": "ESFJ",
    "group": "SJ",
    "cat": "웨딩/이벤트",
    "name": "기적의 웨딩 플래너",
    "kw": "인생단하루, 완벽한예식, 눈물의축복",
    "desc": "신랑 신부의 가장 빛나는 순간을 위해 드레스부터 부케, 하객 동선까지 세심히 조율하는 연출가",
    "gear": "웨딩 스케줄 바인더",
    "icon": "👰",
    "color": "#DB2777",
    "subColor": "#FCE7F3"
  },
  {
    "id": 223,
    "mbti": "ESFJ",
    "group": "SJ",
    "cat": "서비스/승무원",
    "name": "퍼스트클래스 사무장",
    "kw": "극진한환대, 탑승객케어, 미소",
    "desc": "14시간의 장거리 비행 동안 탑승객의 눈빛만 보고도 필요한 것을 챙겨주는 베테랑 승무원",
    "gear": "스카프와 기내 서비스 패드",
    "icon": "✈️",
    "color": "#DB2777",
    "subColor": "#FCE7F3"
  },
  {
    "id": 224,
    "mbti": "ESFJ",
    "group": "SJ",
    "cat": "외식/접객",
    "name": "동네 최고 맛집 안방마님",
    "kw": "얼굴기억, 듬뿍담은덤, 친근한인사",
    "desc": "손님 500명의 얼굴과 자주 먹는 반찬을 기억해 \"삼촌 또 왔네!\"라며 덤을 얹어주는 마님",
    "gear": "정감 넘치는 뚝배기",
    "icon": "🥘",
    "color": "#DB2777",
    "subColor": "#FCE7F3"
  },
  {
    "id": 225,
    "mbti": "ESFJ",
    "group": "SJ",
    "cat": "뷰티/헤어",
    "name": "마음까지 만지는 헤어 디자이너",
    "kw": "헤어변신, 고민상담, 단골보유1위",
    "desc": "머리를 자르는 동안 손님의 답답한 속마음을 다정하게 들어주며 힐링을 선물하는 미용사",
    "gear": "일제 전문가 가위",
    "icon": "✂️",
    "color": "#DB2777",
    "subColor": "#FCE7F3"
  },
  {
    "id": 226,
    "mbti": "ESFJ",
    "group": "SJ",
    "cat": "조직/HR",
    "name": "팀 화합 워크숍 마스터",
    "kw": "팀빌딩, 갈등봉합, 즐거운회식",
    "desc": "서먹서먹하던 부서 간의 벽을 허물고 팀원들이 서로 얼싸안고 웃게 만드는 사내 분위기 메이커",
    "gear": "팀빌딩 보드게임",
    "icon": "🎲",
    "color": "#DB2777",
    "subColor": "#FCE7F3"
  },
  {
    "id": 227,
    "mbti": "ESFJ",
    "group": "SJ",
    "cat": "학부모/네트워크",
    "name": "학부모회 열혈 총무",
    "kw": "급식모니터링, 알짜정보공유, 바자회",
    "desc": "학교 바자회를 성공적으로 이끌고 엄마들의 유익한 정보 교류 네트워크를 책임지는 총무",
    "gear": "바자회 장부와 계산기",
    "icon": "📋",
    "color": "#DB2777",
    "subColor": "#FCE7F3"
  },
  {
    "id": 228,
    "mbti": "ESFJ",
    "group": "SJ",
    "cat": "웰빙/베이킹",
    "name": "선물용 수제 쿠키 베이커",
    "kw": "정성포장, 이웃나눔, 달콤한선물",
    "desc": "주말마다 정성스레 쿠키를 구워 예쁜 리본으로 포장해 경비 아저씨와 이웃에 돌리는 천사",
    "gear": "선물용 쿠키 박스",
    "icon": "🍪",
    "color": "#DB2777",
    "subColor": "#FCE7F3"
  },
  {
    "id": 229,
    "mbti": "ESFJ",
    "group": "SJ",
    "cat": "부동산/중개",
    "name": "행복한 보금자리 공인중개사",
    "kw": "딱맞는집, 학군상담, 친절한안내",
    "desc": "단순히 집을 파는 게 아니라 신혼부부의 예산과 꿈에 딱 맞는 행복한 보금자리를 찾아주는 중개사",
    "gear": "매물 수첩과 열쇠고리",
    "icon": "🔑",
    "color": "#DB2777",
    "subColor": "#FCE7F3"
  },
  {
    "id": 230,
    "mbti": "ESFJ",
    "group": "SJ",
    "cat": "문화/합창",
    "name": "어머니 합창단 단장",
    "kw": "아름다운화음, 지역위문공연, 우정",
    "desc": "동네 어머님들을 모아 아름다운 합창단을 꾸리고 요양원 위문공연을 다니는 정 넘치는 단장",
    "gear": "합창단 악보철",
    "icon": "🎶",
    "color": "#DB2777",
    "subColor": "#FCE7F3"
  },
  {
    "id": 231,
    "mbti": "ESFJ",
    "group": "SJ",
    "cat": "여행/인솔",
    "name": "효도관광 베테랑 투어가이드",
    "kw": "어르신맞춤, 꿀잼입담, 편안한일정",
    "desc": "어르신들의 무릎 건강과 식성을 세심하게 배려하며 여행 내내 웃음을 선사하는 인기 가이드",
    "gear": "노란 인솔 깃발",
    "icon": "🚩",
    "color": "#DB2777",
    "subColor": "#FCE7F3"
  },
  {
    "id": 232,
    "mbti": "ESFJ",
    "group": "SJ",
    "cat": "의료/치과위생",
    "name": "무통 스케일링 치과위생사",
    "kw": "안아픈치료, 다정한설명, 치과공포극복",
    "desc": "치과가 무서워 벌벌 떠는 환자의 손을 꼭 잡아주고 안 아프게 스케일링해주는 위생사",
    "gear": "덴탈 미러와 프로브",
    "icon": "🦷",
    "color": "#DB2777",
    "subColor": "#FCE7F3"
  },
  {
    "id": 233,
    "mbti": "ESFJ",
    "group": "SJ",
    "cat": "일상/선물",
    "name": "손편지 답례품 큐레이터",
    "kw": "진심의글귀, 센스있는선물, 감동후기",
    "desc": "작은 경조사 하나에도 마음을 울리는 감사의 손편지와 감각적인 답례품을 준비하는 자",
    "gear": "캘리그라피 엽서",
    "icon": "💌",
    "color": "#DB2777",
    "subColor": "#FCE7F3"
  },
  {
    "id": 234,
    "mbti": "ESFJ",
    "group": "SJ",
    "cat": "지역/봉사",
    "name": "사랑의 김장 나눔 총괄",
    "kw": "1000포기김장, 양념버무리기, 이웃사랑",
    "desc": "매년 겨울 부녀회를 이끌고 배추 1,000포기를 절여 독거노인 가정에 김치를 배달하는 대장",
    "gear": "빨간 고무장갑과 앞치마",
    "icon": "🥬",
    "color": "#DB2777",
    "subColor": "#FCE7F3"
  },
  {
    "id": 235,
    "mbti": "ESFJ",
    "group": "SJ",
    "cat": "스포츠/에어로빅",
    "name": "신바람 에어로빅 강사",
    "kw": "신나는트로트, 스트레스타파, 활력충전",
    "desc": "신나는 트로트 리믹스에 맞춰 회원들의 군살과 일상의 시름을 한 방에 털어내는 활력소",
    "gear": "스팽글 댄스복",
    "icon": "💃",
    "color": "#DB2777",
    "subColor": "#FCE7F3"
  },
  {
    "id": 236,
    "mbti": "ESFJ",
    "group": "SJ",
    "cat": "호텔/컨시어지",
    "name": "골든키 컨시어지",
    "kw": "불가능한예약해결, 감동서비스, VIP케어",
    "desc": "예약이 꽉 찬 미슐랭 레스토랑 좌석을 구해 손님의 기념일을 완벽하게 구원해내는 해결사",
    "gear": "교차된 황금 열쇠 뱃지",
    "icon": "🗝️",
    "color": "#DB2777",
    "subColor": "#FCE7F3"
  },
  {
    "id": 237,
    "mbti": "ESFJ",
    "group": "SJ",
    "cat": "반려식물/분양",
    "name": "초록 화분 나눔 천사",
    "kw": "삽목번식, 예쁜화분선물, 식물초보가이드",
    "desc": "집에서 건강하게 키운 몬스테라를 꺾꽂이해 예쁜 토분에 심어 친구들에게 선물하는 나눔러",
    "gear": "미니 원예 가위",
    "icon": "🪴",
    "color": "#DB2777",
    "subColor": "#FCE7F3"
  },
  {
    "id": 238,
    "mbti": "ESFJ",
    "group": "SJ",
    "cat": "전례/축제",
    "name": "교회/성당 청년부 회장",
    "kw": "새신자환영, 성탄축제, 따스한공동체",
    "desc": "처음 찾아온 청년들을 따뜻하게 맞이하고 연말 성탄제를 축제의 장으로 만드는 리더",
    "gear": "청년부 주보와 기타",
    "icon": "⛪",
    "color": "#DB2777",
    "subColor": "#FCE7F3"
  },
  {
    "id": 239,
    "mbti": "ESFJ",
    "group": "SJ",
    "cat": "홈카페/초대",
    "name": "애프터눈 티 파티 안주인",
    "kw": "3단트레이, 스콘과홍차, 정겨운수다",
    "desc": "주말 오후 소중한 친구들을 초대해 갓 구운 스콘과 홍차를 대접하며 다정한 담소를 나누는 자",
    "gear": "영국식 본차이나 티팟",
    "icon": "🫖",
    "color": "#DB2777",
    "subColor": "#FCE7F3"
  },
  {
    "id": 240,
    "mbti": "ESFJ",
    "group": "SJ",
    "cat": "목표/화합",
    "name": "행복 네트워크의 꽃 하모니",
    "kw": "모두의행복, 따스한연결, 사랑의공동체",
    "desc": "사람과 사람 사이를 사랑과 신뢰의 끈으로 엮어 모두가 행복한 울타리를 완성하는 천사",
    "gear": "사랑의 황금 하트",
    "icon": "💖",
    "color": "#DB2777",
    "subColor": "#FCE7F3"
  }
  ];

  if (typeof module === 'object' && module && module.exports) {
    module.exports = LIST;
  } else if (root) {
    (root.OurgoalAvatarPersonaParts = root.OurgoalAvatarPersonaParts || {}).esfj = LIST;
  }
})(typeof self !== 'undefined' ? self : this);
