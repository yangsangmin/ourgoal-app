/**
 * @role 아바타 페르소나 데이터 — ESTJ 20종 (id 201~220, group SJ)
 *
 * #TASK-ES-386: js/avatar-system.js 의 BODY_THEMES_320 에서 글자 그대로 옮긴 데이터만 있다(로직 없음).
 * js/avatar-system.js 가 intj→intp→…→esfp 순서로 이어 BODY_THEMES_320 을 만든다.
 * 생성기: docs/design/harness/module-split/gen-avatar-data.js — 동일성 시험: tests/ 폴더 avatar-personas-split 시험
 */
(function(root) {
  'use strict';

  var LIST = [
  {
    "id": 201,
    "mbti": "ESTJ",
    "group": "SJ",
    "cat": "조직/경영",
    "name": "불도저 총괄 본부장",
    "kw": "목표달성, 강력한추진, 현장지휘",
    "desc": "지체되는 프로젝트를 단칼에 정리하고 전 직원을 하나로 결집해 기한 내 완수하는 사령탑",
    "gear": "레이저 포인터",
    "icon": "📑",
    "color": "#374151",
    "subColor": "#F3F4F6"
  },
  {
    "id": 202,
    "mbti": "ESTJ",
    "group": "SJ",
    "cat": "프로세스/품질",
    "name": "식스시그마 블랙벨트",
    "kw": "공정최적화, 불량률0%, 표준운영절차",
    "desc": "모든 제조 및 업무 프로세스를 계량화하고 표준화하여 완벽한 생산 효율을 뽑아내는 전문가",
    "gear": "공정 플로우 차트",
    "icon": "📊",
    "color": "#374151",
    "subColor": "#F3F4F6"
  },
  {
    "id": 203,
    "mbti": "ESTJ",
    "group": "SJ",
    "cat": "군사/경찰",
    "name": "해병대 호랑이 교관",
    "kw": "기강확립, 오와열, 강철규율",
    "desc": "나태해진 정신상태를 단번에 뜯어고쳐 어떠한 난관도 돌파하는 최정예 전사로 키워내는 교관",
    "gear": "교관 호루라기",
    "icon": "🪖",
    "color": "#374151",
    "subColor": "#F3F4F6"
  },
  {
    "id": 204,
    "mbti": "ESTJ",
    "group": "SJ",
    "cat": "건설/시공",
    "name": "초고층 현장 감리소장",
    "kw": "안전모필착, 공기단축, 품질시공",
    "desc": "수천억 원대 랜드마크 공사 현장에서 안전 수칙을 칼같이 집행하며 무사고 완공을 이끄는 소장",
    "gear": "하얀색 안전모",
    "icon": "🏗️",
    "color": "#374151",
    "subColor": "#F3F4F6"
  },
  {
    "id": 205,
    "mbti": "ESTJ",
    "group": "SJ",
    "cat": "경영/전략",
    "name": "비용 절감 구조조정관",
    "kw": "낭비제거, 현금흐름개선, 생존전략",
    "desc": "방만한 회사의 숨은 누수를 철저히 찾아내어 적자 회사를 3개월 만에 흑자로 돌려세우는 자",
    "gear": "재무 감사 바인더",
    "icon": "📉",
    "color": "#374151",
    "subColor": "#F3F4F6"
  },
  {
    "id": 206,
    "mbti": "ESTJ",
    "group": "SJ",
    "cat": "스포츠/훈련",
    "name": "국가대표 태릉 선수촌 코치",
    "kw": "지옥훈련, 체력테스트, 금메달정조준",
    "desc": "새벽 산악 구보부터 웨이트까지 분초 단위로 몰아붙여 선수를 챔피언으로 빚어내는 지도자",
    "gear": "전자 스톱워치",
    "icon": "⏱️",
    "color": "#374151",
    "subColor": "#F3F4F6"
  },
  {
    "id": 207,
    "mbti": "ESTJ",
    "group": "SJ",
    "cat": "정부/감사",
    "name": "감사원 특감 감찰관",
    "kw": "비리척결, 법령위반적발, 추상같은원칙",
    "desc": "어떤 권력자의 압력에도 눈하나 깜짝 않고 공공기관의 비리를 파헤치는 서릿발 감사관",
    "gear": "감사 조사 서류철",
    "icon": "⚖️",
    "color": "#374151",
    "subColor": "#F3F4F6"
  },
  {
    "id": 208,
    "mbti": "ESTJ",
    "group": "SJ",
    "cat": "물류/공급망",
    "name": "글로벌 SCM 오퍼레이터",
    "kw": "적기공급, 병목해결, 리드타임단축",
    "desc": "전 세계 컨테이너 선박과 항공편을 24시간 추적하며 공급망 대란을 해결하는 통제관",
    "gear": "글로벌 물류 관제 콘솔",
    "icon": "🚢",
    "color": "#374151",
    "subColor": "#F3F4F6"
  },
  {
    "id": 209,
    "mbti": "ESTJ",
    "group": "SJ",
    "cat": "학교/훈육",
    "name": "명문고 학생주임 선생님",
    "kw": "두발복장검사, 지각생지도, 바른생활",
    "desc": "교문 앞을 든든하게 지키며 학생들에게 사회에 나가 필요한 기본 예절과 규율을 가르치는 스승",
    "gear": "출석부와 지휘봉",
    "icon": "👨‍🏫",
    "color": "#374151",
    "subColor": "#F3F4F6"
  },
  {
    "id": 210,
    "mbti": "ESTJ",
    "group": "SJ",
    "cat": "외식/프랜차이즈",
    "name": "외식 프랜차이즈 수퍼바이저",
    "kw": "매뉴얼준수, 위생점검, 맛의표준화",
    "desc": "전국 500개 매장의 찌개 맛과 조리 시간이 1초의 오차도 없이 동일하도록 점검하는 감독관",
    "gear": "온도계와 체크보드",
    "icon": "🍳",
    "color": "#374151",
    "subColor": "#F3F4F6"
  },
  {
    "id": 211,
    "mbti": "ESTJ",
    "group": "SJ",
    "cat": "의료/응급실",
    "name": "권역외상센터 컨트롤타워",
    "kw": "트리아지, 골든타임, 신속결정",
    "desc": "동시다발로 실려 오는 중증 외상 환자들의 우선순위를 순식간에 판단해 살려내는 응급 총괄",
    "gear": "무전기와 차트판",
    "icon": "🚑",
    "color": "#374151",
    "subColor": "#F3F4F6"
  },
  {
    "id": 212,
    "mbti": "ESTJ",
    "group": "SJ",
    "cat": "도시/치안",
    "name": "광역수사대 수사반장",
    "kw": "현장급습, 일망타진, 법집행",
    "desc": "수개월간의 잠복 끝에 조직범죄단을 단 한 놈도 놓치지 않고 검거하는 베테랑 형사 반장",
    "gear": "가죽 수갑과 권총집",
    "icon": "👮",
    "color": "#374151",
    "subColor": "#F3F4F6"
  },
  {
    "id": 213,
    "mbti": "ESTJ",
    "group": "SJ",
    "cat": "IT/인프라",
    "name": "데이터센터 인프라 총괄",
    "kw": "99.999%가용성, 정전방지, 무중단운영",
    "desc": "국가 기간망 데이터센터의 항온항습과 무정전 전원장치를 24시간 무결점으로 관리하는 자",
    "gear": "서버 랙 키마스터",
    "icon": "🖥️",
    "color": "#374151",
    "subColor": "#F3F4F6"
  },
  {
    "id": 214,
    "mbti": "ESTJ",
    "group": "SJ",
    "cat": "농업/대농",
    "name": "스마트 대농장 관리자",
    "kw": "트랙터선단, 파종일정엄수, 수확량극대화",
    "desc": "수십만 평의 농지를 드론과 대형 트랙터로 과학적으로 관리하여 최대 수확을 거두는 농업 CEO",
    "gear": "스마트 파밍 패드",
    "icon": "🚜",
    "color": "#374151",
    "subColor": "#F3F4F6"
  },
  {
    "id": 215,
    "mbti": "ESTJ",
    "group": "SJ",
    "cat": "행사/의전",
    "name": "국제 정상회의 의전실장",
    "kw": "초단위의전, 좌석배치, 결례방지",
    "desc": "세계 각국 정상들의 동선과 오찬 메뉴, 통역 배치를 1초의 결례도 없이 조율하는 의전 베테랑",
    "gear": "무전 인이어와 명찰",
    "icon": "🌐",
    "color": "#374151",
    "subColor": "#F3F4F6"
  },
  {
    "id": 216,
    "mbti": "ESTJ",
    "group": "SJ",
    "cat": "금융/리스크",
    "name": "은행 여신심사 부장",
    "kw": "상환능력평가, 담보검증, 부실방지",
    "desc": "감정에 휩쓸리지 않고 객관적 재무제표와 상환 능력만을 냉철하게 평가해 대출을 집행하는 자",
    "gear": "만년 승인 도장",
    "icon": "🏦",
    "color": "#374151",
    "subColor": "#F3F4F6"
  },
  {
    "id": 217,
    "mbti": "ESTJ",
    "group": "SJ",
    "cat": "호텔/총지배인",
    "name": "5성급 호텔 총지배인",
    "kw": "완벽한서비스, 객실청결도, 컴플레인해결",
    "desc": "로비 대리석 바닥의 광택부터 VIP 스위트룸의 침구 주름까지 직접 확인하는 완벽주의 지배인",
    "gear": "골든 라펠 핀",
    "icon": "🏨",
    "color": "#374151",
    "subColor": "#F3F4F6"
  },
  {
    "id": 218,
    "mbti": "ESTJ",
    "group": "SJ",
    "cat": "법률/판사",
    "name": "엄정한 법과 양심의 판사",
    "kw": "법과증거, 준엄한심판, 정의실현",
    "desc": "여론에 흔들리지 않고 오직 법률과 엄밀한 증거주의에 입각하여 판결을 내리는 법관",
    "gear": "참나무 법봉",
    "icon": "⚖️",
    "color": "#374151",
    "subColor": "#F3F4F6"
  },
  {
    "id": 219,
    "mbti": "ESTJ",
    "group": "SJ",
    "cat": "일상/루틴",
    "name": "분초 단위 타임테이블러",
    "kw": "구글캘린더블록, 지각절대불가, 실행",
    "desc": "하루 24시간을 15분 단위로 블록화해 단 1분도 허투루 쓰지 않고 완벽하게 살아내는 자",
    "gear": "타임블록 플래너",
    "icon": "📅",
    "color": "#374151",
    "subColor": "#F3F4F6"
  },
  {
    "id": 220,
    "mbti": "ESTJ",
    "group": "SJ",
    "cat": "목표/성과",
    "name": "절대 실행의 아이언맨",
    "kw": "결과증명, 핑계없음, 무조건달성",
    "desc": "\"안 된다\"는 말을 사전에서 지워버리고 주어진 자원으로 어떻게든 결과를 만들어내는 종결자",
    "gear": "강철의 지휘봉",
    "icon": "⚡",
    "color": "#374151",
    "subColor": "#F3F4F6"
  }
  ];

  if (typeof module === 'object' && module && module.exports) {
    module.exports = LIST;
  } else if (root) {
    (root.OurgoalAvatarPersonaParts = root.OurgoalAvatarPersonaParts || {}).estj = LIST;
  }
})(typeof self !== 'undefined' ? self : this);
