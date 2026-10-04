/**
 * @role 아바타 페르소나 데이터 — INTP 20종 (id 21~40, group NT)
 *
 * #TASK-ES-386: js/avatar-system.js 의 BODY_THEMES_320 에서 글자 그대로 옮긴 데이터만 있다(로직 없음).
 * js/avatar-system.js 가 intj→intp→…→esfp 순서로 이어 BODY_THEMES_320 을 만든다.
 * 생성기: docs/design/harness/module-split/gen-avatar-data.js — 동일성 시험: tests/ 폴더 avatar-personas-split 시험
 */
(function(root) {
  'use strict';

  var LIST = [
  {
    "id": 21,
    "mbti": "INTP",
    "group": "NT",
    "cat": "지식/연구",
    "name": "이론 물리학자",
    "kw": "양자역학, 사고실험, 가설",
    "desc": "칠판 가득 수식을 채우며 우주의 숨겨진 대통합 법칙을 사유하는 연구자",
    "gear": "분필 묻은 백묵",
    "icon": "⚛️",
    "color": "#4338CA",
    "subColor": "#EEF2FF"
  },
  {
    "id": 22,
    "mbti": "INTP",
    "group": "NT",
    "cat": "기술/코딩",
    "name": "커널 해커",
    "kw": "어셈블리어, 저수준, 리버스엔지니어링",
    "desc": "운영체제의 가장 깊은 심연까지 파고들어 기계와 소통하는 순수 개발자",
    "gear": "흑백 터미널",
    "icon": "💻",
    "color": "#4338CA",
    "subColor": "#EEF2FF"
  },
  {
    "id": 23,
    "mbti": "INTP",
    "group": "NT",
    "cat": "지식/철학",
    "name": "인식론 철학자",
    "kw": "정의, 논증, 오류식별",
    "desc": "우리가 안다고 착각하는 상식의 맹점을 날카로운 질문으로 해체하는 사색가",
    "gear": "가죽 표지 철학서",
    "icon": "📖",
    "color": "#4338CA",
    "subColor": "#EEF2FF"
  },
  {
    "id": 24,
    "mbti": "INTP",
    "group": "NT",
    "cat": "창의/발명",
    "name": "괴짜 발명가",
    "kw": "프로토타입, 엉뚱함, 기계장치",
    "desc": "아무도 생각하지 못한 기발한 메커니즘을 작업실에서 뚝딱 만들어내는 메이커",
    "gear": "땜납 인두기",
    "icon": "🔧",
    "color": "#4338CA",
    "subColor": "#EEF2FF"
  },
  {
    "id": 25,
    "mbti": "INTP",
    "group": "NT",
    "cat": "게임/논리",
    "name": "퍼즐 솔버",
    "kw": "루빅스큐브, 암호, 패턴",
    "desc": "복잡하게 뒤엉킨 퍼즐의 알고리즘을 발견하고 순식간에 풀어내는 해결사",
    "gear": "12각 큐브",
    "icon": "🧩",
    "color": "#4338CA",
    "subColor": "#EEF2FF"
  },
  {
    "id": 26,
    "mbti": "INTP",
    "group": "NT",
    "cat": "지식/빅데이터",
    "name": "데이터 마이닝 탐정",
    "kw": "이상치탐색, 상관관계, 통계",
    "desc": "수백만 줄의 쓰레기 데이터 속에서 숨겨진 단 하나의 진실을 캐내는 분석가",
    "gear": "데이터 시각화 차트",
    "icon": "📈",
    "color": "#4338CA",
    "subColor": "#EEF2FF"
  },
  {
    "id": 27,
    "mbti": "INTP",
    "group": "NT",
    "cat": "일상/호기심",
    "name": "위키피디아 래빗홀러",
    "kw": "끝없는링크, 하이퍼텍스트, 잡학",
    "desc": "사소한 궁금증 하나로 밤새 지식의 토끼굴을 파고드는 지적 유희자",
    "gear": "밤샘용 머그컵",
    "icon": "☕",
    "color": "#4338CA",
    "subColor": "#EEF2FF"
  },
  {
    "id": 28,
    "mbti": "INTP",
    "group": "NT",
    "cat": "음악/소리",
    "name": "모듈러 신스 디자이너",
    "kw": "주파수, 파형합성, 음향",
    "desc": "전기 신호와 패치 케이블을 연결해 세상에 없던 새로운 음색을 창조하는 장인",
    "gear": "패치 코드와 모듈",
    "icon": "🎛️",
    "color": "#4338CA",
    "subColor": "#EEF2FF"
  },
  {
    "id": 29,
    "mbti": "INTP",
    "group": "NT",
    "cat": "미래/AI",
    "name": "뉴럴넷 아키텍트",
    "kw": "어텐션메커니즘, 가중치, 손실함수",
    "desc": "인간의 뇌신경망을 모방한 인공신경망의 수학적 아키텍처를 연구하는 과학자",
    "gear": "GPU 클러스터 콘솔",
    "icon": "🔬",
    "color": "#4338CA",
    "subColor": "#EEF2FF"
  },
  {
    "id": 30,
    "mbti": "INTP",
    "group": "NT",
    "cat": "학업/수학",
    "name": "순수 수학자",
    "kw": "증명, 위상수학, 아름다움",
    "desc": "실용성을 떠나 오직 수학적 구조의 우아함과 절대적 참만을 추구하는 학자",
    "gear": "무제 증명 노트",
    "icon": "📐",
    "color": "#4338CA",
    "subColor": "#EEF2FF"
  },
  {
    "id": 31,
    "mbti": "INTP",
    "group": "NT",
    "cat": "취미/수집",
    "name": "키보드 매니아",
    "kw": "윤활, 커스텀하우징, 타건음",
    "desc": "스위치 압력과 보강판 재질의 미세한 차이를 음미하는 키보드 덕후",
    "gear": "스위치 풀러와 윤활유",
    "icon": "⌨️",
    "color": "#4338CA",
    "subColor": "#EEF2FF"
  },
  {
    "id": 32,
    "mbti": "INTP",
    "group": "NT",
    "cat": "여행/사색",
    "name": "심야 서점 방랑자",
    "kw": "새벽서점, 절판본, 고요",
    "desc": "모두가 잠든 밤, 고서점 구석에서 먼지 쌓인 옛 책의 보물을 찾는 사색가",
    "gear": "빈티지 북마크",
    "icon": "📚",
    "color": "#4338CA",
    "subColor": "#EEF2FF"
  },
  {
    "id": 33,
    "mbti": "INTP",
    "group": "NT",
    "cat": "지식/인류학",
    "name": "언어학 기호학자",
    "kw": "음운론, 어원학, 기호체계",
    "desc": "문자와 단어가 진화해온 수천 년의 궤적을 추적하는 언어의 고고학자",
    "gear": "고대 문자 사전",
    "icon": "📜",
    "color": "#4338CA",
    "subColor": "#EEF2FF"
  },
  {
    "id": 34,
    "mbti": "INTP",
    "group": "NT",
    "cat": "웰빙/수면",
    "name": "자각몽 탐험가",
    "kw": "루시드드림, 수면주기, 무의식",
    "desc": "꿈속에서도 의식을 깨워 무의식이 만든 세계를 자유롭게 관찰하는 탐험가",
    "gear": "수면 저널 노트",
    "icon": "🌙",
    "color": "#4338CA",
    "subColor": "#EEF2FF"
  },
  {
    "id": 35,
    "mbti": "INTP",
    "group": "NT",
    "cat": "전략/체계",
    "name": "체스 오프닝 분석가",
    "kw": "시실리안디펜스, 변칙수, 통계",
    "desc": "수만 건의 대국 기보를 바탕으로 첫 15수의 완벽한 논리를 정리하는 분석가",
    "gear": "원목 체스 시계",
    "icon": "⏱️",
    "color": "#4338CA",
    "subColor": "#EEF2FF"
  },
  {
    "id": 36,
    "mbti": "INTP",
    "group": "NT",
    "cat": "예술/미학",
    "name": "제너레이티브 아티스트",
    "kw": "망델브로, 수식시각화, 알고리즘",
    "desc": "복잡한 수학 방정식을 코드로 렌더링해 경이로운 시각 예술을 빚는 아티스트",
    "gear": "셰이더 렌더러",
    "icon": "🌀",
    "color": "#4338CA",
    "subColor": "#EEF2FF"
  },
  {
    "id": 37,
    "mbti": "INTP",
    "group": "NT",
    "cat": "일상/효율",
    "name": "일상 루프 자동화러",
    "kw": "배치스크립트, 단축키, 크론탭",
    "desc": "인생의 모든 반복 작업을 파이썬 스크립트 한 줄로 자동화해버리는 귀차니스트",
    "gear": "매크로 패드",
    "icon": "⚙️",
    "color": "#4338CA",
    "subColor": "#EEF2FF"
  },
  {
    "id": 38,
    "mbti": "INTP",
    "group": "NT",
    "cat": "과학/생물",
    "name": "합성생물학 탐구자",
    "kw": "유전자회로, 바이오브릭, DNA",
    "desc": "생명체의 DNA 코드를 프로그래밍 가능한 소프트웨어처럼 바라보는 연구원",
    "gear": "마이크로 피펫",
    "icon": "🧬",
    "color": "#4338CA",
    "subColor": "#EEF2FF"
  },
  {
    "id": 39,
    "mbti": "INTP",
    "group": "NT",
    "cat": "비즈니스/해결",
    "name": "루트 커즈 디버거",
    "kw": "근본원인, 5-Why, 디버깅",
    "desc": "모두가 표면 증상에 우왕좌왕할 때 시스템의 숨은 버그를 정확히 짚어내는 해결사",
    "gear": "로직 아날라이저",
    "icon": "🔍",
    "color": "#4338CA",
    "subColor": "#EEF2FF"
  },
  {
    "id": 40,
    "mbti": "INTP",
    "group": "NT",
    "cat": "목표/달성",
    "name": "지적 자유의 개척자",
    "kw": "자율성, 깨달음, 몰입",
    "desc": "세속적 형식에 얽매이지 않고 진정한 지적 깨달음을 얻었을 때 환호하는 탐구자",
    "gear": "자유의 깃펜",
    "icon": "🪶",
    "color": "#4338CA",
    "subColor": "#EEF2FF"
  }
  ];

  if (typeof module === 'object' && module && module.exports) {
    module.exports = LIST;
  } else if (root) {
    (root.OurgoalAvatarPersonaParts = root.OurgoalAvatarPersonaParts || {}).intp = LIST;
  }
})(typeof self !== 'undefined' ? self : this);
