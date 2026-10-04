/**
 * @role 아바타 페르소나 데이터 — INTJ 20종 (id 1~20, group NT)
 *
 * #TASK-ES-386: js/avatar-system.js 의 BODY_THEMES_320 에서 글자 그대로 옮긴 데이터만 있다(로직 없음).
 * js/avatar-system.js 가 intj→intp→…→esfp 순서로 이어 BODY_THEMES_320 을 만든다.
 * 생성기: docs/design/harness/module-split/gen-avatar-data.js — 동일성 시험: tests/ 폴더 avatar-personas-split 시험
 */
(function(root) {
  'use strict';

  var LIST = [
  {
    "id": 1,
    "mbti": "INTJ",
    "group": "NT",
    "cat": "전략/체계",
    "name": "그랜드 마스터",
    "kw": "수읽기, 체스, 통찰",
    "desc": "10수 앞을 내다보고 흔들림 없이 국면을 장악하는 절대 전략가",
    "gear": "흑요석 체스말",
    "icon": "♟️",
    "color": "#312E81",
    "subColor": "#E0E7FF"
  },
  {
    "id": 2,
    "mbti": "INTJ",
    "group": "NT",
    "cat": "지식/시스템",
    "name": "시스템 아키텍트",
    "kw": "구조화, 최적화, 설계",
    "desc": "복잡한 비즈니스 문제를 견고한 단일 시스템으로 재설계하는 설계자",
    "gear": "블루프린트 태블릿",
    "icon": "📐",
    "color": "#312E81",
    "subColor": "#E0E7FF"
  },
  {
    "id": 3,
    "mbti": "INTJ",
    "group": "NT",
    "cat": "비즈니스/투자",
    "name": "알고리즘 퀀트",
    "kw": "수치화, 백테스팅, 무감정",
    "desc": "직관을 배제하고 수학적 확률과 데이터로 시장을 공략하는 금융 공학자",
    "gear": "듀얼 포터블 모니터",
    "icon": "📊",
    "color": "#312E81",
    "subColor": "#E0E7FF"
  },
  {
    "id": 4,
    "mbti": "INTJ",
    "group": "NT",
    "cat": "생산성/자기관리",
    "name": "미니멀 옵티마이저",
    "kw": "단순화, 비움, 효율극대화",
    "desc": "모든 군더더기를 제거하고 핵심 본질 하나에만 100% 집중하는 몰입가",
    "gear": "무소음 만년필",
    "icon": "🖋️",
    "color": "#312E81",
    "subColor": "#E0E7FF"
  },
  {
    "id": 5,
    "mbti": "INTJ",
    "group": "NT",
    "cat": "지식/학문",
    "name": "딥 씽커",
    "kw": "본질탐구, 사유, 메타인지",
    "desc": "현상의 표면을 꿰뚫고 근원적 질문에 끝까지 매달리는 지적 탐구자",
    "gear": "가죽 사유노트",
    "icon": "🧠",
    "color": "#312E81",
    "subColor": "#E0E7FF"
  },
  {
    "id": 6,
    "mbti": "INTJ",
    "group": "NT",
    "cat": "미래/기술",
    "name": "사이버 보안 수호자",
    "kw": "제로트러스트, 방어, 암호학",
    "desc": "빈틈없는 논리로 보이지 않는 위협을 사전에 봉쇄하는 보안 전문가",
    "gear": "하드웨어 보안키",
    "icon": "🛡️",
    "color": "#312E81",
    "subColor": "#E0E7FF"
  },
  {
    "id": 7,
    "mbti": "INTJ",
    "group": "NT",
    "cat": "전략/커리어",
    "name": "비전 로드매퍼",
    "kw": "10년계획, 마일스톤, 집행",
    "desc": "원대한 장기 목표를 하루 단위의 정밀한 액션플랜으로 분해하는 기획자",
    "gear": "아크릴 로드맵 보드",
    "icon": "🗺️",
    "color": "#312E81",
    "subColor": "#E0E7FF"
  },
  {
    "id": 8,
    "mbti": "INTJ",
    "group": "NT",
    "cat": "지식/도서",
    "name": "지식 아카이비스트",
    "kw": "세컨드브레인, 분류, 정본화",
    "desc": "방대한 정보에서 정제된 지혜만을 골라 완벽한 서재를 구축하는 학자",
    "gear": "디지털 인덱서",
    "icon": "📚",
    "color": "#312E81",
    "subColor": "#E0E7FF"
  },
  {
    "id": 9,
    "mbti": "INTJ",
    "group": "NT",
    "cat": "커리어/비즈니스",
    "name": "스텔스 파운더",
    "kw": "비밀병기, 고독한창업, 실행",
    "desc": "조용히 물밑에서 완벽한 프로덕트를 준비해 세상을 놀라게 하는 창업가",
    "gear": "블랙 맥북",
    "icon": "💻",
    "color": "#312E81",
    "subColor": "#E0E7FF"
  },
  {
    "id": 10,
    "mbti": "INTJ",
    "group": "NT",
    "cat": "웰빙/루틴",
    "name": "바이오해커",
    "kw": "수면측정, 최적루틴, 인체공학",
    "desc": "신체 데이터와 영양 바이오마커를 분석해 최상의 뇌 효율을 유지하는 자",
    "gear": "스마트 링",
    "icon": "💍",
    "color": "#312E81",
    "subColor": "#E0E7FF"
  },
  {
    "id": 11,
    "mbti": "INTJ",
    "group": "NT",
    "cat": "스포츠/멘탈",
    "name": "정밀 양궁 마스터",
    "kw": "정조준, 심박제어, 불변심",
    "desc": "바람과 호흡을 완벽히 통제하여 10점 과녁의 정중앙만을 꿰뚫는 궁사",
    "gear": "카본 컴파운드 보우",
    "icon": "🏹",
    "color": "#312E81",
    "subColor": "#E0E7FF"
  },
  {
    "id": 12,
    "mbti": "INTJ",
    "group": "NT",
    "cat": "미래/우주",
    "name": "오비탈 궤도 설계자",
    "kw": "우주항법, 중력계산, 개척",
    "desc": "행성 간 궤도를 오차 없이 시뮬레이션하는 우주 공학자",
    "gear": "천체 항법의",
    "icon": "🪐",
    "color": "#312E81",
    "subColor": "#E0E7FF"
  },
  {
    "id": 13,
    "mbti": "INTJ",
    "group": "NT",
    "cat": "지식/법률",
    "name": "무결점 컴플라이언서",
    "kw": "리스크차단, 원칙, 계약",
    "desc": "계약서 한 줄의 자구까지 검토해 미래의 분쟁 가능성을 원천 차단하는 자",
    "gear": "황금 만년필",
    "icon": "⚖️",
    "color": "#312E81",
    "subColor": "#E0E7FF"
  },
  {
    "id": 14,
    "mbti": "INTJ",
    "group": "NT",
    "cat": "예술/설계",
    "name": "모더니즘 건축가",
    "kw": "기능주의, 콘크리트, 조형",
    "desc": "장식을 배제하고 구조와 선의 기능성만으로 완벽한 공간을 짓는 예술가",
    "gear": "삼각 축척자",
    "icon": "🏛️",
    "color": "#312E81",
    "subColor": "#E0E7FF"
  },
  {
    "id": 15,
    "mbti": "INTJ",
    "group": "NT",
    "cat": "비즈니스/조직",
    "name": "섀도우 오거나이저",
    "kw": "막후조율, 자원배분, 효율",
    "desc": "전면에 서지 않고 무대 뒤에서 전체 조직의 자원 배분을 지휘하는 참모",
    "gear": "체스판 레이아웃",
    "icon": "♟️",
    "color": "#312E81",
    "subColor": "#E0E7FF"
  },
  {
    "id": 16,
    "mbti": "INTJ",
    "group": "NT",
    "cat": "학습/언어",
    "name": "암호학 해독관",
    "kw": "패턴인식, 암호체계, 복호화",
    "desc": "어지러운 암호문 속에서 숨겨진 규칙을 찾아내 의미를 밝히는 해독자",
    "gear": "에니그마 모듈",
    "icon": "🗝️",
    "color": "#312E81",
    "subColor": "#E0E7FF"
  },
  {
    "id": 17,
    "mbti": "INTJ",
    "group": "NT",
    "cat": "웰빙/마인드",
    "name": "침묵의 고독자",
    "kw": "디지털디톡스, 내면정렬, 충전",
    "desc": "외부 소음을 완전히 차단하고 오롯이 내면의 나침반을 재정렬하는 명상가",
    "gear": "노이즈캔슬링 헤드셋",
    "icon": "🎧",
    "color": "#312E81",
    "subColor": "#E0E7FF"
  },
  {
    "id": 18,
    "mbti": "INTJ",
    "group": "NT",
    "cat": "전략/게임",
    "name": "RTS 전술가",
    "kw": "자원최적화, 빌드오더, 카운터",
    "desc": "1초 단위의 빌드오더와 상성 계산으로 상대를 압도하는 프로 게이머",
    "gear": "기계식 게이밍 키보드",
    "icon": "🎮",
    "color": "#312E81",
    "subColor": "#E0E7FF"
  },
  {
    "id": 19,
    "mbti": "INTJ",
    "group": "NT",
    "cat": "미래/기술",
    "name": "AGI 거버넌스 연구원",
    "kw": "AI정렬, 안전성, 윤리체계",
    "desc": "초지능의 폭주를 막고 인류의 미래를 지킬 수학적 안전망을 짜는 이론가",
    "gear": "홀로그램 데이터큐브",
    "icon": "🔮",
    "color": "#312E81",
    "subColor": "#E0E7FF"
  },
  {
    "id": 20,
    "mbti": "INTJ",
    "group": "NT",
    "cat": "목표/성공",
    "name": "궁극의 마일스톤 러너",
    "kw": "목표달성, 타협없음, 결과",
    "desc": "어떤 변명도 없이 스스로 정한 목표치를 100% 도달해내는 집념의 승부사",
    "gear": "골든 트로피 배ッジ",
    "icon": "🏆",
    "color": "#312E81",
    "subColor": "#E0E7FF"
  }
  ];

  if (typeof module === 'object' && module && module.exports) {
    module.exports = LIST;
  } else if (root) {
    (root.OurgoalAvatarPersonaParts = root.OurgoalAvatarPersonaParts || {}).intj = LIST;
  }
})(typeof self !== 'undefined' ? self : this);
