/**
 * @role 아바타 페르소나 데이터 — ENFJ 20종 (id 121~140, group NF)
 *
 * #TASK-ES-386: js/avatar-system.js 의 BODY_THEMES_320 에서 글자 그대로 옮긴 데이터만 있다(로직 없음).
 * js/avatar-system.js 가 intj→intp→…→esfp 순서로 이어 BODY_THEMES_320 을 만든다.
 * 생성기: docs/design/harness/module-split/gen-avatar-data.js — 동일성 시험: tests/ 폴더 avatar-personas-split 시험
 */
(function(root) {
  'use strict';

  var LIST = [
  {
    "id": 121,
    "mbti": "ENFJ",
    "group": "NF",
    "cat": "코칭/동기부여",
    "name": "열정 라이프 코치",
    "kw": "잠재력폭발, 응원, 목표동반자",
    "desc": "당신의 가치를 누구보다 먼저 알아보고 결승선까지 함께 달려주는 최고의 페이스메이커",
    "gear": "골든 호루라기",
    "icon": "📣",
    "color": "#E11D48",
    "subColor": "#FFE4E6"
  },
  {
    "id": 122,
    "mbti": "ENFJ",
    "group": "NF",
    "cat": "리더십/커뮤니티",
    "name": "따뜻한 카리스마 리더",
    "kw": "원팀정신, 화합, 서번트리더십",
    "desc": "모든 팀원의 목소리에 귀 기울이며 하나 된 마음으로 기적을 만들어내는 서번트 리더",
    "gear": "캡틴 완장",
    "icon": "🤝",
    "color": "#E11D48",
    "subColor": "#FFE4E6"
  },
  {
    "id": 123,
    "mbti": "ENFJ",
    "group": "NF",
    "cat": "스피치/감동",
    "name": "세바시 감동 강연가",
    "kw": "마음울림, 기립박수, 선한영향력",
    "desc": "진심 어린 스토리텔링으로 수백 명의 관객을 웃기고 울리며 삶의 용기를 불어넣는 스피커",
    "gear": "무선 마이크",
    "icon": "🎙️",
    "color": "#E11D48",
    "subColor": "#FFE4E6"
  },
  {
    "id": 124,
    "mbti": "ENFJ",
    "group": "NF",
    "cat": "교육/스승",
    "name": "참된 스승 키팅 선생님",
    "kw": "죽은시인의사회, 캡틴오마이캡틴, 성장",
    "desc": "획일화된 주입식 교육을 깨고 아이들이 스스로 날개를 펼칠 수 있게 이끄는 참교육자",
    "gear": "책상 위의 분필",
    "icon": "👨‍🏫",
    "color": "#E11D48",
    "subColor": "#FFE4E6"
  },
  {
    "id": 125,
    "mbti": "ENFJ",
    "group": "NF",
    "cat": "자원봉사/나눔",
    "name": "글로벌 봉사단 총괄단장",
    "kw": "국경없는구호, 희망학교, 연대",
    "desc": "재난과 빈곤의 현장으로 달려가 무너진 마을에 학교를 짓고 희망을 씨 뿌리는 실천가",
    "gear": "유니세프 블루 조끼",
    "icon": "🌍",
    "color": "#E11D48",
    "subColor": "#FFE4E6"
  },
  {
    "id": 126,
    "mbti": "ENFJ",
    "group": "NF",
    "cat": "방송/진행",
    "name": "국민 토크쇼 MC",
    "kw": "배려심, 리액션의제왕, 편안한진행",
    "desc": "어떤 게스트가 와도 속마음을 편안하게 털어놓게 만드는 마법 같은 경청의 MC",
    "gear": "큐카드와 인이어",
    "icon": "📺",
    "color": "#E11D48",
    "subColor": "#FFE4E6"
  },
  {
    "id": 127,
    "mbti": "ENFJ",
    "group": "NF",
    "cat": "조직/문화",
    "name": "피플 앤 컬처 디렉터",
    "kw": "심리적안정감, 조직문화, 웰빙",
    "desc": "조직 구성원들이 출근길에 가슴 뛰고 행복할 수 있도록 문화를 설계하는 행복 전도사",
    "gear": "칭찬 릴레이 카드",
    "icon": "💌",
    "color": "#E11D48",
    "subColor": "#FFE4E6"
  },
  {
    "id": 128,
    "mbti": "ENFJ",
    "group": "NF",
    "cat": "청소년/멘토",
    "name": "위기 청소년 쉼터 소장",
    "kw": "무조건적수용, 든든한언덕, 자립",
    "desc": "방황하는 청소년들의 손을 놓지 않고 세상의 비바람을 막아주는 든든한 비빌 언덕",
    "gear": "따뜻한 코코아 포트",
    "icon": "☕",
    "color": "#E11D48",
    "subColor": "#FFE4E6"
  },
  {
    "id": 129,
    "mbti": "ENFJ",
    "group": "NF",
    "cat": "정치/사회",
    "name": "정의로운 시민운동가",
    "kw": "공공선, 제도개선, 촛불의힘",
    "desc": "더 공정하고 따뜻한 사회를 만들기 위해 시민들의 목소리를 모아 제도를 바꾸는 운동가",
    "gear": "확성기와 성명서",
    "icon": "📢",
    "color": "#E11D48",
    "subColor": "#FFE4E6"
  },
  {
    "id": 130,
    "mbti": "ENFJ",
    "group": "NF",
    "cat": "스포츠/감독",
    "name": "원팀 축구 국가대표 감독",
    "kw": "원팀, 빌드업, 선수단장악",
    "desc": "스타 선수들의 에고를 하나로 묶어 월드컵 4강 신화를 달성하는 명장",
    "gear": "작전 전술판",
    "icon": "⚽",
    "color": "#E11D48",
    "subColor": "#FFE4E6"
  },
  {
    "id": 131,
    "mbti": "ENFJ",
    "group": "NF",
    "cat": "예술/합창",
    "name": "기적의 오케스트라 지휘자",
    "kw": "화음, 엘시스테마, 음악의기적",
    "desc": "거리의 방황하던 아이들에게 악기를 쥐여주고 환상의 화음을 이끌어내는 마에스트로",
    "gear": "지휘봉",
    "icon": "🎼",
    "color": "#E11D48",
    "subColor": "#FFE4E6"
  },
  {
    "id": 132,
    "mbti": "ENFJ",
    "group": "NF",
    "cat": "비즈니스/ESG",
    "name": "소셜 벤처 임팩트 투자자",
    "kw": "착한기업, 소셜임팩트, 지속가능성",
    "desc": "돈을 넘어 사회적 난제를 해결하는 착한 스타트업을 발굴해 날개를 달아주는 후원자",
    "gear": "임팩트 리포트",
    "icon": "🌱",
    "color": "#E11D48",
    "subColor": "#FFE4E6"
  },
  {
    "id": 133,
    "mbti": "ENFJ",
    "group": "NF",
    "cat": "심리/관계",
    "name": "부부 관계 회복 중재자",
    "kw": "대화법, 비폭력대화, 관계치유",
    "desc": "말 한마디 섞지 않던 부부의 닫힌 대화의 문을 열고 눈물의 포옹을 이끌어내는 전문가",
    "gear": "경청 감정 카드",
    "icon": "❤️",
    "color": "#E11D48",
    "subColor": "#FFE4E6"
  },
  {
    "id": 134,
    "mbti": "ENFJ",
    "group": "NF",
    "cat": "지역사회/협동",
    "name": "마을공동체 이장님",
    "kw": "품앗이, 마을축제, 이웃사촌",
    "desc": "삭막한 아파트 단지를 정이 넘치는 따뜻한 사람 사는 마을로 바꾸는 마을 리더",
    "gear": "마을회관 마이크",
    "icon": "🏡",
    "color": "#E11D48",
    "subColor": "#FFE4E6"
  },
  {
    "id": 135,
    "mbti": "ENFJ",
    "group": "NF",
    "cat": "출판/기획",
    "name": "감동 에세이 편집장",
    "kw": "숨은명저발굴, 눈물샘, 베스트셀러",
    "desc": "이름 없는 평범한 이웃의 감동 실화를 보석 같은 책으로 엮어 전국을 울리는 기획자",
    "gear": "원고 교정 붉은 펜",
    "icon": "📚",
    "color": "#E11D48",
    "subColor": "#FFE4E6"
  },
  {
    "id": 136,
    "mbti": "ENFJ",
    "group": "NF",
    "cat": "동물/복지",
    "name": "유기견 입양 축제 기획자",
    "kw": "사지말고입양하세요, 평생가족, 축제",
    "desc": "상처 입은 유기동물들이 사랑 가득한 평생 가족을 만날 수 있도록 축제를 여는 천사",
    "gear": "입양 서약서",
    "icon": "🐶",
    "color": "#E11D48",
    "subColor": "#FFE4E6"
  },
  {
    "id": 137,
    "mbti": "ENFJ",
    "group": "NF",
    "cat": "환경/실천",
    "name": "제로웨이스트 살림 코디네이터",
    "kw": "용기내챌린지, 친환경실천, 선한영향력",
    "desc": "이웃들에게 쓰레기 없는 삶의 즐거움과 환경 사랑을 유쾌하게 전파하는 살림꾼",
    "gear": "유리 밀폐용기와 다회용기",
    "icon": "♻️",
    "color": "#E11D48",
    "subColor": "#FFE4E6"
  },
  {
    "id": 138,
    "mbti": "ENFJ",
    "group": "NF",
    "cat": "의료/간호",
    "name": "나이팅게일 수간호사",
    "kw": "헌신, 환자중심, 병동의빛",
    "desc": "밤낮없이 고통받는 환자들의 곁을 지키며 다정한 미소로 병동을 밝히는 백의의 천사",
    "gear": "간호 수첩과 펜라이트",
    "icon": "🩺",
    "color": "#E11D48",
    "subColor": "#FFE4E6"
  },
  {
    "id": 139,
    "mbti": "ENFJ",
    "group": "NF",
    "cat": "웰빙/요가",
    "name": "사랑과 자비 하타요가 마스터",
    "kw": "가슴열기, 아나하타차크라, 자비",
    "desc": "몸의 긴장뿐 아니라 닫혀있던 가슴을 활짝 열어 세상과 사랑을 나누게 돕는 요가 지도자",
    "gear": "만달라 요가 매트",
    "icon": "🧘‍♀️",
    "color": "#E11D48",
    "subColor": "#FFE4E6"
  },
  {
    "id": 140,
    "mbti": "ENFJ",
    "group": "NF",
    "cat": "목표/완성",
    "name": "빛나는 시너지의 완결자",
    "kw": "모두의승리, 동반성장, 축복",
    "desc": "나 혼자의 성공이 아닌, 우리 모두가 함께 성장하여 환호하는 순간을 완성하는 영웅",
    "gear": "승리의 월계관",
    "icon": "👑",
    "color": "#E11D48",
    "subColor": "#FFE4E6"
  }
  ];

  if (typeof module === 'object' && module && module.exports) {
    module.exports = LIST;
  } else if (root) {
    (root.OurgoalAvatarPersonaParts = root.OurgoalAvatarPersonaParts || {}).enfj = LIST;
  }
})(typeof self !== 'undefined' ? self : this);
