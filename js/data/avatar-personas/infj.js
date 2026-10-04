/**
 * @role 아바타 페르소나 데이터 — INFJ 20종 (id 81~100, group NF)
 *
 * #TASK-ES-386: js/avatar-system.js 의 BODY_THEMES_320 에서 글자 그대로 옮긴 데이터만 있다(로직 없음).
 * js/avatar-system.js 가 intj→intp→…→esfp 순서로 이어 BODY_THEMES_320 을 만든다.
 * 생성기: docs/design/harness/module-split/gen-avatar-data.js — 동일성 시험: tests/ 폴더 avatar-personas-split 시험
 */
(function(root) {
  'use strict';

  var LIST = [
  {
    "id": 81,
    "mbti": "INFJ",
    "group": "NF",
    "cat": "소명/비전",
    "name": "고요한 선지자",
    "kw": "내면통찰, 미래예지, 영적나침반",
    "desc": "시대의 소용돌이 속에서도 인간성의 깊은 가치를 발견하고 나아갈 길을 밝히는 등대",
    "gear": "청동 앤틱 램프",
    "icon": "🕯️",
    "color": "#0D9488",
    "subColor": "#CCFBF1"
  },
  {
    "id": 82,
    "mbti": "INFJ",
    "group": "NF",
    "cat": "문학/치유",
    "name": "영혼의 문장가",
    "kw": "심층위로, 은유, 문학적치유",
    "desc": "상처받은 영혼의 가장 깊은 곳을 어루만지는 시적 은유와 문장을 길어 올리는 작가",
    "gear": "만년필과 양장 노트",
    "icon": "✍️",
    "color": "#0D9488",
    "subColor": "#CCFBF1"
  },
  {
    "id": 83,
    "mbti": "INFJ",
    "group": "NF",
    "cat": "심리/상담",
    "name": "마음 분석 테라피스트",
    "kw": "원형심리학, 페르소나, 내면아이",
    "desc": "타인의 복잡한 심리 기저와 무의식의 상처를 따뜻하고 명철하게 보듬는 상담가",
    "gear": "모래시계 타이머",
    "icon": "🛋️",
    "color": "#0D9488",
    "subColor": "#CCFBF1"
  },
  {
    "id": 84,
    "mbti": "INFJ",
    "group": "NF",
    "cat": "환경/생태",
    "name": "가이아 생태 가디언",
    "kw": "지구생명, 공존, 침묵의봄",
    "desc": "말 못 하는 자연과 멸종위기 생물들의 권리를 지키기 위해 일생을 헌신하는 활동가",
    "gear": "유기농 코튼 에코백",
    "icon": "🌱",
    "color": "#0D9488",
    "subColor": "#CCFBF1"
  },
  {
    "id": 85,
    "mbti": "INFJ",
    "group": "NF",
    "cat": "예술/미학",
    "name": "신비주의 상징주의 화가",
    "kw": "타로, 꿈의풍경, 상징미학",
    "desc": "현실 너머의 보이지 않는 진실과 꿈의 심상을 캔버스에 신비롭게 담아내는 화가",
    "gear": "천연 안료 팔레트",
    "icon": "🎨",
    "color": "#0D9488",
    "subColor": "#CCFBF1"
  },
  {
    "id": 86,
    "mbti": "INFJ",
    "group": "NF",
    "cat": "사회/인권",
    "name": "약자의 변호사",
    "kw": "정의, 인권옹호, 공익소송",
    "desc": "돈과 권력에 굴하지 않고 사회적 소수자의 존엄성을 위해 끝까지 맞서 싸우는 법조인",
    "gear": "낡은 변호사 서류가방",
    "icon": "⚖️",
    "color": "#0D9488",
    "subColor": "#CCFBF1"
  },
  {
    "id": 87,
    "mbti": "INFJ",
    "group": "NF",
    "cat": "웰빙/명상",
    "name": "마음챙김 선(禪) 마스터",
    "kw": "호흡, 무념무상, 알아차림",
    "desc": "번잡한 번뇌를 내려놓고 오롯이 지금 이 순간의 존재 자체와 호흡하는 수행자",
    "gear": "티베탄 싱잉볼",
    "icon": "🧘",
    "color": "#0D9488",
    "subColor": "#CCFBF1"
  },
  {
    "id": 88,
    "mbti": "INFJ",
    "group": "NF",
    "cat": "지식/역사",
    "name": "역사 철학 사관",
    "kw": "역사의교훈, 문명의흥망, 인간본성",
    "desc": "과거 문명의 흥망성쇠 속에서 오늘날 인류가 되풀이하지 말아야 할 지혜를 찾는 사관",
    "gear": "고문서 돋보기",
    "icon": "📜",
    "color": "#0D9488",
    "subColor": "#CCFBF1"
  },
  {
    "id": 89,
    "mbti": "INFJ",
    "group": "NF",
    "cat": "커뮤니티/연대",
    "name": "비폭력 평화 중재자",
    "kw": "경청, 평화구축, 갈등해소",
    "desc": "뿌리 깊은 증오와 갈등으로 갈라진 집단 사이에 다리를 놓아 화해를 이끄는 중재자",
    "gear": "올리브 나뭇가지 배ッジ",
    "icon": "🕊️",
    "color": "#0D9488",
    "subColor": "#CCFBF1"
  },
  {
    "id": 90,
    "mbti": "INFJ",
    "group": "NF",
    "cat": "음악/위로",
    "name": "달빛 첼리스트",
    "kw": "단조의선율, 깊은울림, 정화",
    "desc": "어두운 밤을 홀로 지새우는 이들의 가슴을 깊고 묵직한 저음으로 안아주는 연주자",
    "gear": "마호가니 첼로",
    "icon": "🎻",
    "color": "#0D9488",
    "subColor": "#CCFBF1"
  },
  {
    "id": 91,
    "mbti": "INFJ",
    "group": "NF",
    "cat": "일상/차(茶)",
    "name": "다도(茶道) 힐러",
    "kw": "물소리, 찻잎의향, 침묵의미학",
    "desc": "차 한 잔을 정성껏 우리는 행위를 통해 흩어진 마음을 단정히 모으는 다도인",
    "gear": "백자 다기 세트",
    "icon": "🍵",
    "color": "#0D9488",
    "subColor": "#CCFBF1"
  },
  {
    "id": 92,
    "mbti": "INFJ",
    "group": "NF",
    "cat": "지식/도서",
    "name": "심야 비밀 서재 지기",
    "kw": "인생의책, 맞춤처방, 사색",
    "desc": "지친 손님에게 세상에 단 한 권뿐인 맞춤형 인생 책을 조용히 건네주는 사서",
    "gear": "원목 서재 사다리",
    "icon": "📖",
    "color": "#0D9488",
    "subColor": "#CCFBF1"
  },
  {
    "id": 93,
    "mbti": "INFJ",
    "group": "NF",
    "cat": "건축/공간",
    "name": "빛과 침묵의 건축가",
    "kw": "자연채광, 여백, 치유의공간",
    "desc": "들어서는 순간 모든 잡념이 사라지고 깊은 경건함이 깃드는 성소를 짓는 설계자",
    "gear": "건축 스케치북",
    "icon": "🏛️",
    "color": "#0D9488",
    "subColor": "#CCFBF1"
  },
  {
    "id": 94,
    "mbti": "INFJ",
    "group": "NF",
    "cat": "교육/멘토",
    "name": "잠재력 개안 멘토",
    "kw": "거인의발견, 내적동기, 헌신",
    "desc": "학생 스스로도 몰랐던 가슴속 거대한 불꽃을 발견하고 피워 올려주는 스승",
    "gear": "나무 만년필",
    "icon": "🌟",
    "color": "#0D9488",
    "subColor": "#CCFBF1"
  },
  {
    "id": 95,
    "mbti": "INFJ",
    "group": "NF",
    "cat": "여행/순례",
    "name": "산티아고 순례자",
    "kw": "카미노데산티아고, 고독한보행, 성찰",
    "desc": "수백 킬로미터의 길을 묵묵히 걸으며 삶의 군더더기를 털어내고 본질을 만나는 구도자",
    "gear": "조가비 장식 지팡이",
    "icon": "🥾",
    "color": "#0D9488",
    "subColor": "#CCFBF1"
  },
  {
    "id": 96,
    "mbti": "INFJ",
    "group": "NF",
    "cat": "미래/윤리",
    "name": "인류 미래 윤리학자",
    "kw": "AI윤리, 기술의인간화, 책임",
    "desc": "기술 발전의 속도에 휩쓸리지 않고 인간의 영혼과 존엄을 지킬 안전장치를 고뇌하는 학자",
    "gear": "철학 에세이집",
    "icon": "💡",
    "color": "#0D9488",
    "subColor": "#CCFBF1"
  },
  {
    "id": 97,
    "mbti": "INFJ",
    "group": "NF",
    "cat": "영화/영상",
    "name": "시적 다큐멘터리 감독",
    "kw": "인간극장, 깊은시선, 진실의기록",
    "desc": "화려한 수사 없이 평범한 이들의 삶 속에 깃든 위대한 숭고함을 영상화하는 연출가",
    "gear": "시네마 카메라",
    "icon": "🎥",
    "color": "#0D9488",
    "subColor": "#CCFBF1"
  },
  {
    "id": 98,
    "mbti": "INFJ",
    "group": "NF",
    "cat": "복지/돌봄",
    "name": "호스피스 동행자",
    "kw": "마지막여정, 존엄한배웅, 온기",
    "desc": "생의 마지막 순간에 이른 이들의 손을 꼭 잡고 두려움 없는 평온을 선물하는 천사",
    "gear": "따뜻한 담요",
    "icon": "🤍",
    "color": "#0D9488",
    "subColor": "#CCFBF1"
  },
  {
    "id": 99,
    "mbti": "INFJ",
    "group": "NF",
    "cat": "자연/천문",
    "name": "은하수 관측가",
    "kw": "코스모스, 경외감, 왜소함의위로",
    "desc": "아득한 별빛을 바라보며 우주 속 인간 존재의 덧없음에서 오히려 위안을 얻는 천문학자",
    "gear": "천체 굴절망원경",
    "icon": "🌌",
    "color": "#0D9488",
    "subColor": "#CCFBF1"
  },
  {
    "id": 100,
    "mbti": "INFJ",
    "group": "NF",
    "cat": "목표/완성",
    "name": "이상향의 건축가",
    "kw": "영구적가치, 유산, 세상을바꿈",
    "desc": "당대의 찬사에 연연하지 않고 다음 세대를 위해 더 나은 세상을 남기려는 위대한 영혼",
    "gear": "황금 나침반",
    "icon": "🧭",
    "color": "#0D9488",
    "subColor": "#CCFBF1"
  }
  ];

  if (typeof module === 'object' && module && module.exports) {
    module.exports = LIST;
  } else if (root) {
    (root.OurgoalAvatarPersonaParts = root.OurgoalAvatarPersonaParts || {}).infj = LIST;
  }
})(typeof self !== 'undefined' ? self : this);
