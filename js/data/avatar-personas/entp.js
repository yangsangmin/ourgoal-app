/**
 * @role 아바타 페르소나 데이터 — ENTP 20종 (id 61~80, group NT)
 *
 * #TASK-ES-386: js/avatar-system.js 의 BODY_THEMES_320 에서 글자 그대로 옮긴 데이터만 있다(로직 없음).
 * js/avatar-system.js 가 intj→intp→…→esfp 순서로 이어 BODY_THEMES_320 을 만든다.
 * 생성기: docs/design/harness/module-split/gen-avatar-data.js — 동일성 시험: tests/ 폴더 avatar-personas-split 시험
 */
(function(root) {
  'use strict';

  var LIST = [
  {
    "id": 61,
    "mbti": "ENTP",
    "group": "NT",
    "cat": "창의/혁신",
    "name": "패러다임 디스럽터",
    "kw": "판흔들기, 파괴적혁신, 역발상",
    "desc": "기존 업계의 낡은 상식을 비웃으며 완전히 새로운 규칙의 판을 짜는 혁신가",
    "gear": "아이디어 화이트보드",
    "icon": "⚡",
    "color": "#D97706",
    "subColor": "#FEF3C7"
  },
  {
    "id": 62,
    "mbti": "ENTP",
    "group": "NT",
    "cat": "스타트업/창업",
    "name": "연쇄 아이디어 피보터",
    "kw": "린스타트업, 빠른실패, MVP",
    "desc": "1주일에 하나씩 MVP를 론칭하며 시장의 반응을 끝없이 실험하는 해커",
    "gear": "MVP 프로토타입 폰",
    "icon": "🚀",
    "color": "#D97706",
    "subColor": "#FEF3C7"
  },
  {
    "id": 63,
    "mbti": "ENTP",
    "group": "NT",
    "cat": "토론/변론",
    "name": "데빌스 애드버킷",
    "kw": "반론제기, 허점찌르기, 지적스릴",
    "desc": "모두가 찬성할 때 일부러 반대 입장에 서서 숨겨진 맹점을 검증하는 토론가",
    "gear": "토론용 타이머",
    "icon": "⚖️",
    "color": "#D97706",
    "subColor": "#FEF3C7"
  },
  {
    "id": 64,
    "mbti": "ENTP",
    "group": "NT",
    "cat": "미디어/콘텐츠",
    "name": "바이럴 밈 마스터",
    "kw": "바이럴, 유머, 트렌드캐치",
    "desc": "인터넷 대중의 심리를 꿰뚫는 절묘한 풍자와 밈으로 1000만 뷰를 터뜨리는 크리에이터",
    "gear": "스마트폰 짐벌",
    "icon": "📱",
    "color": "#D97706",
    "subColor": "#FEF3C7"
  },
  {
    "id": 65,
    "mbti": "ENTP",
    "group": "NT",
    "cat": "기술/해킹",
    "name": "화이트햇 모의해커",
    "kw": "취약점공격, 보안우회, 창의적해킹",
    "desc": "개발자가 미처 생각지 못한 기상천외한 경로로 시스템의 허점을 뚫어내는 해커",
    "gear": "와이파이 파인애플",
    "icon": "💻",
    "color": "#D97706",
    "subColor": "#FEF3C7"
  },
  {
    "id": 66,
    "mbti": "ENTP",
    "group": "NT",
    "cat": "발명/메이커",
    "name": "엉뚱 기계 제작소장",
    "kw": "쓸모없는발명, 재미, 메카트로닉스",
    "desc": "오직 재미와 호기심을 위해 아무도 상상 못한 유쾌한 자동 기계를 만드는 발명가",
    "gear": "3D 프린팅 키트",
    "icon": "🤖",
    "color": "#D97706",
    "subColor": "#FEF3C7"
  },
  {
    "id": 67,
    "mbti": "ENTP",
    "group": "NT",
    "cat": "마케팅/기획",
    "name": "게릴라 마케터",
    "kw": "파격기획, 노이즈마케팅, 임팩트",
    "desc": "적은 예산으로도 도심 한복판에 전설적인 해프닝을 일으켜 브랜드를 각인시키는 기획자",
    "gear": "스텐실 스프레이",
    "icon": "🎨",
    "color": "#D97706",
    "subColor": "#FEF3C7"
  },
  {
    "id": 68,
    "mbti": "ENTP",
    "group": "NT",
    "cat": "지식/잡학",
    "name": "크로스오버 융합러",
    "kw": "통섭, 다른분야연결, 유레카",
    "desc": "양자역학에서 힌트를 얻어 마케팅 모델을 만드는 등 이종 분야를 융합하는 천재",
    "gear": "마인드맵 노트",
    "icon": "💡",
    "color": "#D97706",
    "subColor": "#FEF3C7"
  },
  {
    "id": 69,
    "mbti": "ENTP",
    "group": "NT",
    "cat": "게임/e스포츠",
    "name": "변칙 빌드 마술사",
    "kw": "뉴메타, 날빌, 심리전",
    "desc": "정석 메타를 박살 내고 아무도 예상 못한 괴상한 빌드로 상대를 멘붕시키는 게이머",
    "gear": "커스텀 게이밍 마우스",
    "icon": "🎮",
    "color": "#D97706",
    "subColor": "#FEF3C7"
  },
  {
    "id": 70,
    "mbti": "ENTP",
    "group": "NT",
    "cat": "비즈니스/영업",
    "name": "쇼호스트 피칭 달인",
    "kw": "말빨, 유혹, 즉흥프레젠테이션",
    "desc": "대본 없이도 재치 있는 입담과 능청스러움으로 청중의 지갑을 열게 만드는 스피커",
    "gear": "핀스트라이프 수트",
    "icon": "🎙️",
    "color": "#D97706",
    "subColor": "#FEF3C7"
  },
  {
    "id": 71,
    "mbti": "ENTP",
    "group": "NT",
    "cat": "금융/트레이딩",
    "name": "변동성 서퍼",
    "kw": "스캘핑, 위기베팅, 순발력",
    "desc": "시장이 요동칠 때 공포에 질리지 않고 급등락의 파도를 타며 수익을 내는 트레이더",
    "gear": "트리플 포터블 모니터",
    "icon": "📉",
    "color": "#D97706",
    "subColor": "#FEF3C7"
  },
  {
    "id": 72,
    "mbti": "ENTP",
    "group": "NT",
    "cat": "문화/축제",
    "name": "해커톤 사냥꾼",
    "kw": "무박2일, 레드불, 번뜩이는코딩",
    "desc": "주말 48시간 동안 에너지 드링크를 마시며 기상천외한 서비스를 만들어 우승하는 메이커",
    "gear": "해커톤 우승 후드티",
    "icon": "🏆",
    "color": "#D97706",
    "subColor": "#FEF3C7"
  },
  {
    "id": 73,
    "mbti": "ENTP",
    "group": "NT",
    "cat": "여행/모험",
    "name": "즉흥 무계획 트래블러",
    "kw": "동전던지기, 현지인합류, 뜻밖의행운",
    "desc": "비행기 표만 끊고 떠나 매 순간 직관과 우연에 맡기며 전설적인 모험담을 쓰는 방랑자",
    "gear": "낡은 패브릭 배낭",
    "icon": "🎒",
    "color": "#D97706",
    "subColor": "#FEF3C7"
  },
  {
    "id": 74,
    "mbti": "ENTP",
    "group": "NT",
    "cat": "예술/스탠드업",
    "name": "스탠드업 코미디언",
    "kw": "촌철살인, 풍자, 순발력",
    "desc": "금기와 터부를 유쾌하게 넘나들며 관객들의 뇌리에 지적 카타르시스를 선사하는 입담가",
    "gear": "스탠드 마이크",
    "icon": "🎤",
    "color": "#D97706",
    "subColor": "#FEF3C7"
  },
  {
    "id": 75,
    "mbti": "ENTP",
    "group": "NT",
    "cat": "과학/실험",
    "name": "스트리트 사이언티스트",
    "kw": "대형폭발실험, 멘토스콜라, 흥미유발",
    "desc": "교과서 밖으로 나와 거대한 콜라 분수를 쏘아 올리며 과학의 재미를 전파하는 괴짜",
    "gear": "보호 고글과 실험가운",
    "icon": "🧪",
    "color": "#D97706",
    "subColor": "#FEF3C7"
  },
  {
    "id": 76,
    "mbti": "ENTP",
    "group": "NT",
    "cat": "조직/컨설팅",
    "name": "레드팀 리더",
    "kw": "취약성진단, 맹점폭로, 모의적군",
    "desc": "경영진의 완벽해 보이는 계획에 침투해 잠재된 모든 실패 시나리오를 까발리는 조언자",
    "gear": "레드팀 뱃지",
    "icon": "🚩",
    "color": "#D97706",
    "subColor": "#FEF3C7"
  },
  {
    "id": 77,
    "mbti": "ENTP",
    "group": "NT",
    "cat": "일상/취미",
    "name": "보드게임 룰 메이커",
    "kw": "하우스룰, 밸런스패치, 꿀잼",
    "desc": "기존 보드게임 규칙이 지루하면 그 자리에서 즉석 하우스 룰을 만들어 재미를 배가시키는 자",
    "gear": "주사위 세트",
    "icon": "🎲",
    "color": "#D97706",
    "subColor": "#FEF3C7"
  },
  {
    "id": 78,
    "mbti": "ENTP",
    "group": "NT",
    "cat": "미래/블록체인",
    "name": "웹3 다오 아키텍트",
    "kw": "탈중앙화, 스마트컨트랙트, 토크노믹스",
    "desc": "중앙 권력 없이 코드로 돌아가는 자율조직의 룰을 실험하는 가상세계 탐험가",
    "gear": "콜드월렛 하드웨어",
    "icon": "⛓️",
    "color": "#D97706",
    "subColor": "#FEF3C7"
  },
  {
    "id": 79,
    "mbti": "ENTP",
    "group": "NT",
    "cat": "웰빙/멘탈",
    "name": "위기 유쾌 극복자",
    "kw": "긍정회로, 헛웃음, 반전모멘텀",
    "desc": "최악의 위기 앞에서도 \"오히려 좋아, 재미있어지겠는데?\"라며 웃어넘기는 강심장",
    "gear": "스마일 키링",
    "icon": "😄",
    "color": "#D97706",
    "subColor": "#FEF3C7"
  },
  {
    "id": 80,
    "mbti": "ENTP",
    "group": "NT",
    "cat": "목표/도전",
    "name": "언리미티드 게임체인저",
    "kw": "한계파괴, 불가능에도전, 신세계",
    "desc": "\"그건 원래 안 되는 거야\"라는 말을 가장 즐기며 불가능을 보란 듯이 뒤집는 승부사",
    "gear": "체인 브레이커",
    "icon": "💥",
    "color": "#D97706",
    "subColor": "#FEF3C7"
  }
  ];

  if (typeof module === 'object' && module && module.exports) {
    module.exports = LIST;
  } else if (root) {
    (root.OurgoalAvatarPersonaParts = root.OurgoalAvatarPersonaParts || {}).entp = LIST;
  }
})(typeof self !== 'undefined' ? self : this);
