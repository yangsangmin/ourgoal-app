/**
 * @role 아바타 페르소나 데이터 — INFP 20종 (id 101~120, group NF)
 *
 * #TASK-ES-386: js/avatar-system.js 의 BODY_THEMES_320 에서 글자 그대로 옮긴 데이터만 있다(로직 없음).
 * js/avatar-system.js 가 intj→intp→…→esfp 순서로 이어 BODY_THEMES_320 을 만든다.
 * 생성기: docs/design/harness/module-split/gen-avatar-data.js — 동일성 시험: tests/ 폴더 avatar-personas-split 시험
 */
(function(root) {
  'use strict';

  var LIST = [
  {
    "id": 101,
    "mbti": "INFP",
    "group": "NF",
    "cat": "문학/동화",
    "name": "별빛 동화 작가",
    "kw": "순수성, 환상동화, 몽상",
    "desc": "어른들의 굳은 심장에 잃어버린 유년의 마법과 동심을 되살려주는 이야기꾼",
    "gear": "깃털 잉크펜",
    "icon": "✨",
    "color": "#7C3AED",
    "subColor": "#F3E8FF"
  },
  {
    "id": 102,
    "mbti": "INFP",
    "group": "NF",
    "cat": "음악/인디",
    "name": "새벽 인디 싱어송라이터",
    "kw": "통기타, 솔직한가사, 새벽감성",
    "desc": "방구석에서 나직이 부른 노랫말로 수많은 이들의 새벽 눈물을 닦아주는 뮤지션",
    "gear": "빈티지 어쿠스틱 기타",
    "icon": "🎸",
    "color": "#7C3AED",
    "subColor": "#F3E8FF"
  },
  {
    "id": 103,
    "mbti": "INFP",
    "group": "NF",
    "cat": "예술/일러스트",
    "name": "파스텔 수채화가",
    "kw": "물맛, 따스한색채, 위로일러스트",
    "desc": "물과 물감이 부드럽게 번져나가는 수채화로 세상의 차가움을 녹여내는 일러스트레이터",
    "gear": "다람쥐털 붓과 파레트",
    "icon": "🎨",
    "color": "#7C3AED",
    "subColor": "#F3E8FF"
  },
  {
    "id": 104,
    "mbti": "INFP",
    "group": "NF",
    "cat": "자연/동물",
    "name": "길고양이들의 친구",
    "kw": "길냥이급식, 캣맘, 따스한교감",
    "desc": "골목길 추위에 떠는 작은 생명들의 이름을 일일이 불러주며 온기를 나누는 수호천사",
    "gear": "츄르와 보온 파우치",
    "icon": "🐾",
    "color": "#7C3AED",
    "subColor": "#F3E8FF"
  },
  {
    "id": 105,
    "mbti": "INFP",
    "group": "NF",
    "cat": "문학/시",
    "name": "비 오는 날의 음유시인",
    "kw": "빗소리, 서정시, 감성노트",
    "desc": "창가에 떨어지는 빗방울 하나에도 우주의 슬픔과 아름다움을 발견해 시로 엮는 시인",
    "gear": "가죽 양장 시집",
    "icon": "🌧️",
    "color": "#7C3AED",
    "subColor": "#F3E8FF"
  },
  {
    "id": 106,
    "mbti": "INFP",
    "group": "NF",
    "cat": "취미/필름",
    "name": "아날로그 필름 감성러",
    "kw": "수동카메라, 필름그레인, 순간포착",
    "desc": "디지털의 즉각성 대신 필름 한 롤이 현상되는 기다림의 미학을 사랑하는 포토그래퍼",
    "gear": "빈티지 레인지파인더",
    "icon": "📷",
    "color": "#7C3AED",
    "subColor": "#F3E8FF"
  },
  {
    "id": 107,
    "mbti": "INFP",
    "group": "NF",
    "cat": "식물/자연",
    "name": "작은 숲 테라리움 장인",
    "kw": "이끼, 유리병속자연, 미니어처",
    "desc": "작은 유리병 속에 촉촉한 이끼와 돌을 배치해 자신만의 작은 오아시스를 가꾸는 메이커",
    "gear": "정밀 핀셋과 분무기",
    "icon": "🌿",
    "color": "#7C3AED",
    "subColor": "#F3E8FF"
  },
  {
    "id": 108,
    "mbti": "INFP",
    "group": "NF",
    "cat": "공예/뜨개질",
    "name": "몽실몽실 손뜨개 장인",
    "kw": "털실, 코바늘, 포근한목도리",
    "desc": "한 코 한 코 정성을 엮어 사랑하는 이에게 세상에서 제일 따뜻한 목도리를 선물하는 자",
    "gear": "나무 대바늘 세트",
    "icon": "🧶",
    "color": "#7C3AED",
    "subColor": "#F3E8FF"
  },
  {
    "id": 109,
    "mbti": "INFP",
    "group": "NF",
    "cat": "일상/일기",
    "name": "비밀 다이어리 꾸미기러",
    "kw": "다꾸, 마스킹테이프, 속마음기록",
    "desc": "하루 동안 느낀 미세한 감정의 파동들을 예쁜 스티커와 손글씨로 소중히 간직하는 자",
    "gear": "스티커 바인더와 떡메모지",
    "icon": "📔",
    "color": "#7C3AED",
    "subColor": "#F3E8FF"
  },
  {
    "id": 110,
    "mbti": "INFP",
    "group": "NF",
    "cat": "여행/캠핑",
    "name": "나홀로 숲속 솔로캠퍼",
    "kw": "불멍, 타프, 자연과의물아일체",
    "desc": "인적이 드문 깊은 숲속에서 타오르는 모닥불을 바라보며 영혼을 충전하는 낭만가",
    "gear": "티타늄 화롯대",
    "icon": "⛺",
    "color": "#7C3AED",
    "subColor": "#F3E8FF"
  },
  {
    "id": 111,
    "mbti": "INFP",
    "group": "NF",
    "cat": "서점/책",
    "name": "골목길 독립서점 주인장",
    "kw": "독립출판물, 취향의공간, 심야책방",
    "desc": "자신만의 취향이 담긴 보석 같은 책들을 큐레이션해 마음이 맞는 이들과 나누는 사서",
    "gear": "나무 책도장",
    "icon": "📚",
    "color": "#7C3AED",
    "subColor": "#F3E8FF"
  },
  {
    "id": 112,
    "mbti": "INFP",
    "group": "NF",
    "cat": "음악/LP",
    "name": "레트로 바이닐 수집가",
    "kw": "턴테이블, 잡음의따스함, 재즈LP",
    "desc": "턴테이블 바늘이 긁히는 타닥거리는 소리에서 아날로그적 노스탤지어를 만끽하는 감상가",
    "gear": "LP 클리닝 브러시",
    "icon": "🎵",
    "color": "#7C3AED",
    "subColor": "#F3E8FF"
  },
  {
    "id": 113,
    "mbti": "INFP",
    "group": "NF",
    "cat": "요리/베이킹",
    "name": "동화 속 구움과자 베이커",
    "kw": "마들렌, 바닐라빈, 오븐향기",
    "desc": "오븐에서 풍겨 나오는 달콤한 버터 향기로 이웃의 우울을 날려주는 따뜻한 파티시에",
    "gear": "조개모양 마들렌 틀",
    "icon": "🧁",
    "color": "#7C3AED",
    "subColor": "#F3E8FF"
  },
  {
    "id": 114,
    "mbti": "INFP",
    "group": "NF",
    "cat": "취미/향기",
    "name": "기억을 빚는 조향사",
    "kw": "비온뒤숲향, 향수, 추억소환",
    "desc": "어릴 적 맡았던 여름밤 공기, 낡은 도서관 냄새를 한 병의 향수로 재현해내는 예술가",
    "gear": "향료 드롭퍼와 시향지",
    "icon": "🧴",
    "color": "#7C3AED",
    "subColor": "#F3E8FF"
  },
  {
    "id": 115,
    "mbti": "INFP",
    "group": "NF",
    "cat": "게임/힐링",
    "name": "동물의 숲 섬 꾸미기 장인",
    "kw": "슬로우라이프, 힐링게임, 도트디자인",
    "desc": "경쟁 없는 가상 마을에서 꽃을 심고 강물을 트며 평화로운 유토피아를 가꾸는 게이머",
    "gear": "스위치 파스텔 에디션",
    "icon": "🎮",
    "color": "#7C3AED",
    "subColor": "#F3E8FF"
  },
  {
    "id": 116,
    "mbti": "INFP",
    "group": "NF",
    "cat": "예술/인형",
    "name": "추억 복원 인형 병원장",
    "kw": "애착인형수선, 솜채우기, 동심보호",
    "desc": "수십 년의 세월에 닳고 해진 누군가의 소중한 애착 인형을 새것처럼 살려내는 의사",
    "gear": "곡선 바늘과 솜봉",
    "icon": "🧸",
    "color": "#7C3AED",
    "subColor": "#F3E8FF"
  },
  {
    "id": 117,
    "mbti": "INFP",
    "group": "NF",
    "cat": "자연/하늘",
    "name": "노을 헌터",
    "kw": "매직아워, 분홍빛하늘, 넋놓기",
    "desc": "하루 중 하늘이 가장 화려하게 물드는 20분을 보기 위해 매일 노을 언덕에 오르는 낭만파",
    "gear": "노을 엽서 수첩",
    "icon": "🌇",
    "color": "#7C3AED",
    "subColor": "#F3E8FF"
  },
  {
    "id": 118,
    "mbti": "INFP",
    "group": "NF",
    "cat": "문학/편지",
    "name": "펜팔 손편지 러버",
    "kw": "실링왁스, 만년필필기, 우체통",
    "desc": "지구 반대편 친구에게 만년필로 정성을 꾹꾹 눌러 담고 실링 왁스로 봉인하는 로맨티시스트",
    "gear": "황동 실링 인장",
    "icon": "💌",
    "color": "#7C3AED",
    "subColor": "#F3E8FF"
  },
  {
    "id": 119,
    "mbti": "INFP",
    "group": "NF",
    "cat": "웰빙/힐링",
    "name": "빗소리 ASMR 크리에이터",
    "kw": "자연의소리, 불면증치유, 앰비언트",
    "desc": "숲속 시냇물 소리와 창가 빗소리를 고음질 마이크로 녹음해 불면증을 치유하는 녹음가",
    "gear": "바이노럴 마이크",
    "icon": "🎧",
    "color": "#7C3AED",
    "subColor": "#F3E8FF"
  },
  {
    "id": 120,
    "mbti": "INFP",
    "group": "NF",
    "cat": "목표/진정성",
    "name": "진실한 자아의 수호자",
    "kw": "자기다움, 가면벗기, 고유한빛",
    "desc": "세상이 요구하는 기준에 영혼을 팔지 않고, 가장 나다운 모습으로 피어나는 꽃",
    "gear": "진실의 거울",
    "icon": "🪞",
    "color": "#7C3AED",
    "subColor": "#F3E8FF"
  }
  ];

  if (typeof module === 'object' && module && module.exports) {
    module.exports = LIST;
  } else if (root) {
    (root.OurgoalAvatarPersonaParts = root.OurgoalAvatarPersonaParts || {}).infp = LIST;
  }
})(typeof self !== 'undefined' ? self : this);
