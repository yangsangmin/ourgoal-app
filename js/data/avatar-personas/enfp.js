/**
 * @role 아바타 페르소나 데이터 — ENFP 20종 (id 141~160, group NF)
 *
 * #TASK-ES-386: js/avatar-system.js 의 BODY_THEMES_320 에서 글자 그대로 옮긴 데이터만 있다(로직 없음).
 * js/avatar-system.js 가 intj→intp→…→esfp 순서로 이어 BODY_THEMES_320 을 만든다.
 * 생성기: docs/design/harness/module-split/gen-avatar-data.js — 동일성 시험: tests/ 폴더 avatar-personas-split 시험
 */
(function(root) {
  'use strict';

  var LIST = [
  {
    "id": 141,
    "mbti": "ENFP",
    "group": "NF",
    "cat": "아이디어/영감",
    "name": "인간 스파크 발전기",
    "kw": "아이디어화수분, 도파민, 열정폭발",
    "desc": "머릿속에서 초당 100만 개의 기발한 아이디어가 번쩍이며 주변 사람을 감염시키는 자",
    "gear": "번개 모양 뱃지",
    "icon": "⚡",
    "color": "#EA580C",
    "subColor": "#FFEDD5"
  },
  {
    "id": 142,
    "mbti": "ENFP",
    "group": "NF",
    "cat": "축제/이벤트",
    "name": "페스티벌 총감독",
    "kw": "물총축제, DJ페스티벌, 도파민대폭발",
    "desc": "도심 전체를 거대한 놀이터로 바꾸고 수만 명을 열광의 도가니로 몰아넣는 기획자",
    "gear": "컬러풀 확성기",
    "icon": "🎉",
    "color": "#EA580C",
    "subColor": "#FFEDD5"
  },
  {
    "id": 143,
    "mbti": "ENFP",
    "group": "NF",
    "cat": "여행/세계",
    "name": "카우치서핑 지구별 방랑자",
    "kw": "현지인친구100명, 무한친화력, 에피소드",
    "desc": "세계 어디를 가도 10분 만에 현지인과 절친이 되어 파티를 벌이는 친화력 끝판왕",
    "gear": "국기 패치 배낭",
    "icon": "🌍",
    "color": "#EA580C",
    "subColor": "#FFEDD5"
  },
  {
    "id": 144,
    "mbti": "ENFP",
    "group": "NF",
    "cat": "크리에이터/유튜브",
    "name": "초긍정 일상 브이로거",
    "kw": "하이텐션, 찐행복, 긍정에너지",
    "desc": "보기만 해도 우울증이 싹 낫는 특유의 하이텐션과 유쾌한 에너지의 인기 유튜버",
    "gear": "삼각대 셀카봉",
    "icon": "📹",
    "color": "#EA580C",
    "subColor": "#FFEDD5"
  },
  {
    "id": 145,
    "mbti": "ENFP",
    "group": "NF",
    "cat": "패션/스타일",
    "name": "컬러풀 스트리트 패셔니스타",
    "kw": "과감한믹스매치, 형광컬러, 개성표출",
    "desc": "남들의 시선 따위 신경 쓰지 않고 무지개빛 개성 넘치는 스타일로 거리를 런웨이로 만드는 자",
    "gear": "비비드 선글라스",
    "icon": "🕶️",
    "color": "#EA580C",
    "subColor": "#FFEDD5"
  },
  {
    "id": 146,
    "mbti": "ENFP",
    "group": "NF",
    "cat": "음악/뮤지컬",
    "name": "무대 위의 앙팡테리블",
    "kw": "애드리브, 넘치는끼, 뮤지컬배우",
    "desc": "대본의 한계를 뚫고 나오는 폭발적인 끼와 즉흥 연기로 무대를 찢어놓는 뮤지컬 스타",
    "gear": "화려한 무대 의상",
    "icon": "🎭",
    "color": "#EA580C",
    "subColor": "#FFEDD5"
  },
  {
    "id": 147,
    "mbti": "ENFP",
    "group": "NF",
    "cat": "스타트업/초기",
    "name": "극초기 엔젤 피처",
    "kw": "꿈을파는사람, 반짝이는눈빛, 비전설파",
    "desc": "아직 아무것도 없는 백지 위에서도 세상을 바꿀 원대한 꿈을 팔아 투자를 유치하는 창업가",
    "gear": "반짝이 스니커즈",
    "icon": "🚀",
    "color": "#EA580C",
    "subColor": "#FFEDD5"
  },
  {
    "id": 148,
    "mbti": "ENFP",
    "group": "NF",
    "cat": "파티/모임",
    "name": "소셜 살롱 파티 호스트",
    "kw": "어색함제로, 아이스브레이킹, 인싸",
    "desc": "처음 만난 사람들도 5분 만에 배꼽 잡고 웃게 만드는 천재적인 파티 호스트",
    "gear": "보타이와 샴페인 잔",
    "icon": "🥂",
    "color": "#EA580C",
    "subColor": "#FFEDD5"
  },
  {
    "id": 149,
    "mbti": "ENFP",
    "group": "NF",
    "cat": "취미/수집",
    "name": "빈티지 레트로 토이 수집가",
    "kw": "키덜트, 앤틱소품, 알록달록",
    "desc": "방 안 가득 알록달록한 옛날 장난감과 피규어를 모아놓고 매일 행복해하는 키덜트",
    "gear": "레트로 게임보이",
    "icon": "👾",
    "color": "#EA580C",
    "subColor": "#FFEDD5"
  },
  {
    "id": 150,
    "mbti": "ENFP",
    "group": "NF",
    "cat": "예술/팝아트",
    "name": "네오 팝아티스트",
    "kw": "낙서화, 자유로운영혼, 캔버스폭격",
    "desc": "벽과 캔버스에 자유자재로 유쾌한 캐릭터를 낙서하듯 그려내는 제2의 바스키아",
    "gear": "아크릴 마커 세트",
    "icon": "🖍️",
    "color": "#EA580C",
    "subColor": "#FFEDD5"
  },
  {
    "id": 151,
    "mbti": "ENFP",
    "group": "NF",
    "cat": "여행/캠핑카",
    "name": "히피 감성 밴라이퍼",
    "kw": "자유, 차박, 파도소리기상",
    "desc": "낡은 승합차를 개조해 발길 닿는 바닷가마다 정차하고 석양을 바라보는 자유인",
    "gear": "드림캐처와 우쿨렐레",
    "icon": "🚐",
    "color": "#EA580C",
    "subColor": "#FFEDD5"
  },
  {
    "id": 152,
    "mbti": "ENFP",
    "group": "NF",
    "cat": "취미/베이킹",
    "name": "레인보우 컵케이크 디자이너",
    "kw": "무지개크림, 팝핑캔디, 파티케이크",
    "desc": "한 입 베어 물면 입안에서 팝핑캔디가 팡팡 터지는 환상의 디저트를 굽는 파티시에",
    "gear": "스프링클 쉐이커",
    "icon": "🧁",
    "color": "#EA580C",
    "subColor": "#FFEDD5"
  },
  {
    "id": 153,
    "mbti": "ENFP",
    "group": "NF",
    "cat": "동물/반려동물",
    "name": "골든리트리버 교감사",
    "kw": "댕댕이환장, 무한터치, 행복바이러스",
    "desc": "지나가는 모든 강아지와 눈을 맞추며 꼬리를 치게 만드는 천부적인 댕댕이 조련사",
    "gear": "테니스공 파우치",
    "icon": "🐕",
    "color": "#EA580C",
    "subColor": "#FFEDD5"
  },
  {
    "id": 154,
    "mbti": "ENFP",
    "group": "NF",
    "cat": "일상/다이어리",
    "name": "감정 롤러코스터 기록가",
    "kw": "인생드라마, 흑역사자폭, 유쾌한회고",
    "desc": "오르락내리락 롤러코스터 같은 하루를 드라마틱한 명작 만화로 그려내는 일기 작가",
    "gear": "형광펜 12색 세트",
    "icon": "🌈",
    "color": "#EA580C",
    "subColor": "#FFEDD5"
  },
  {
    "id": 155,
    "mbti": "ENFP",
    "group": "NF",
    "cat": "스포츠/레저",
    "name": "익스트림 트램펄린 마스터",
    "kw": "중력탈출, 공중제비, 점핑도파민",
    "desc": "하늘 높이 날아올라 공중제비를 돌며 온몸으로 중력을 거스르는 점핑 마니아",
    "gear": "미끄럼방지 점핑 삭스",
    "icon": "🤸",
    "color": "#EA580C",
    "subColor": "#FFEDD5"
  },
  {
    "id": 156,
    "mbti": "ENFP",
    "group": "NF",
    "cat": "문화/서브컬처",
    "name": "코스프레 페스티벌 챔피언",
    "kw": "완벽변신, 싱크로율100%, 축제주인공",
    "desc": "좋아하는 만화 캐릭터로 머리부터 발끝까지 완벽 변신해 코믹콘을 뒤흔드는 코스어",
    "gear": "판타지 대검 소품",
    "icon": "⚔️",
    "color": "#EA580C",
    "subColor": "#FFEDD5"
  },
  {
    "id": 157,
    "mbti": "ENFP",
    "group": "NF",
    "cat": "디자인/브랜딩",
    "name": "이모지 브랜딩 디렉터",
    "kw": "젊은감각, 톡톡튀는카피, 펀마케팅",
    "desc": "딱딱한 기업 이미지를 귀엽고 재치 있는 이모지와 밈으로 젊게 탈바꿈시키는 디자이너",
    "gear": "스티커 폭탄 맥북",
    "icon": "🎨",
    "color": "#EA580C",
    "subColor": "#FFEDD5"
  },
  {
    "id": 158,
    "mbti": "ENFP",
    "group": "NF",
    "cat": "음악/버스킹",
    "name": "신촌 거리의 버스커",
    "kw": "즉흥잼, 관객참여, 떼창유도",
    "desc": "거리 한복판에서 관객들의 박수 소리를 리듬 삼아 환상적인 즉흥 잼을 펼치는 뮤지션",
    "gear": "미니 앰프와 탬버린",
    "icon": "🪘",
    "color": "#EA580C",
    "subColor": "#FFEDD5"
  },
  {
    "id": 159,
    "mbti": "ENFP",
    "group": "NF",
    "cat": "웰빙/춤",
    "name": "라틴 줌바댄스 인스트럭터",
    "kw": "신나는비트, 칼로리폭파, 땀방울미소",
    "desc": "신나는 라틴 비트에 맞춰 온몸을 흔들며 수강생들의 모든 스트레스를 날려버리는 강사",
    "gear": "네온 댄스 헤어밴드",
    "icon": "💃",
    "color": "#EA580C",
    "subColor": "#FFEDD5"
  },
  {
    "id": 160,
    "mbti": "ENFP",
    "group": "NF",
    "cat": "목표/자유",
    "name": "영원한 피터팬 모험가",
    "kw": "자유로운영혼, 늙지않는마음, 모험",
    "desc": "나이라는 숫자에 갇히지 않고 평생 세상이라는 네버랜드를 탐험하는 영원한 소년소녀",
    "gear": "별모양 마법 요술봉",
    "icon": "🪄",
    "color": "#EA580C",
    "subColor": "#FFEDD5"
  }
  ];

  if (typeof module === 'object' && module && module.exports) {
    module.exports = LIST;
  } else if (root) {
    (root.OurgoalAvatarPersonaParts = root.OurgoalAvatarPersonaParts || {}).enfp = LIST;
  }
})(typeof self !== 'undefined' ? self : this);
