/**
 * @role 아바타 페르소나 데이터 — ISTJ 20종 (id 161~180, group SJ)
 *
 * #TASK-ES-386: js/avatar-system.js 의 BODY_THEMES_320 에서 글자 그대로 옮긴 데이터만 있다(로직 없음).
 * js/avatar-system.js 가 intj→intp→…→esfp 순서로 이어 BODY_THEMES_320 을 만든다.
 * 생성기: docs/design/harness/module-split/gen-avatar-data.js — 동일성 시험: tests/ 폴더 avatar-personas-split 시험
 */
(function(root) {
  'use strict';

  var LIST = [
  {
    "id": 161,
    "mbti": "ISTJ",
    "group": "SJ",
    "cat": "루틴/자기관리",
    "name": "철통 루틴의 수호자",
    "kw": "기상시간칼준수, 규칙, 흔들림제로",
    "desc": "365일 비가 오나 눈이 오나 새벽 5시에 정확히 일어나 하루를 시작하는 자기관리의 신",
    "gear": "정밀 전파시계",
    "icon": "⏰",
    "color": "#1E3A8A",
    "subColor": "#DBEAFE"
  },
  {
    "id": 162,
    "mbti": "ISTJ",
    "group": "SJ",
    "cat": "회계/재무",
    "name": "1원 단위 무결점 감사관",
    "kw": "대차대조표, 영수증검증, 오차0%",
    "desc": "수백억 원의 예산에서 단 1원의 오차도 용납하지 않고 완벽하게 맞춰내는 회계 장인",
    "gear": "무소음 기계식 계산기",
    "icon": "🧮",
    "color": "#1E3A8A",
    "subColor": "#DBEAFE"
  },
  {
    "id": 163,
    "mbti": "ISTJ",
    "group": "SJ",
    "cat": "기록/정리",
    "name": "인간 노션 데이터베이스",
    "kw": "폴더트리, 넘버링, 태그분류",
    "desc": "인생의 모든 자료와 계약서를 한 치의 흐트러짐 없이 3초 만에 검색해내는 분류의 달인",
    "gear": "라벨 프린터",
    "icon": "🗂️",
    "color": "#1E3A8A",
    "subColor": "#DBEAFE"
  },
  {
    "id": 164,
    "mbti": "ISTJ",
    "group": "SJ",
    "cat": "품질/안전",
    "name": "항공기 정밀 정비사",
    "kw": "체크리스트100%, 안전제일, 볼트조임",
    "desc": "비행기 볼트 하나, 전선 한 가닥의 결함도 매의 눈으로 찾아내 승객의 목숨을 지키는 자",
    "gear": "토크 렌치 세트",
    "icon": "🛠️",
    "color": "#1E3A8A",
    "subColor": "#DBEAFE"
  },
  {
    "id": 165,
    "mbti": "ISTJ",
    "group": "SJ",
    "cat": "학업/수험",
    "name": "불패의 10회독 고시생",
    "kw": "형광펜회독, 기본서단권화, 합격보증",
    "desc": "두꺼운 수험서를 10번 반복해 머릿속에 그대로 복사해 넣고 시험을 정복하는 수험의 신",
    "gear": "자 독서대와 귀마개",
    "icon": "📖",
    "color": "#1E3A8A",
    "subColor": "#DBEAFE"
  },
  {
    "id": 166,
    "mbti": "ISTJ",
    "group": "SJ",
    "cat": "일상/정돈",
    "name": "칼각 의류 정리 마스터",
    "kw": "군대식칼각, 색상별정렬, 의류관리기",
    "desc": "옷장의 모든 셔츠와 바지를 자로 잰 듯 똑같은 간격과 색상 그라데이션으로 정돈하는 자",
    "gear": "옷걸이 간격 게이지",
    "icon": "👔",
    "color": "#1E3A8A",
    "subColor": "#DBEAFE"
  },
  {
    "id": 167,
    "mbti": "ISTJ",
    "group": "SJ",
    "cat": "금융/저축",
    "name": "시드머니 철벽 저축왕",
    "kw": "가계부, 짠테크, 선저축후지출",
    "desc": "월급의 70%를 철저히 저축해 계획한 기간 내에 반드시 목표 시드머니를 모으는 저축가",
    "gear": "가계부 다이어리",
    "icon": "💰",
    "color": "#1E3A8A",
    "subColor": "#DBEAFE"
  },
  {
    "id": 168,
    "mbti": "ISTJ",
    "group": "SJ",
    "cat": "공공/행정",
    "name": "청렴 공직 행정관",
    "kw": "법과원칙, 공정무사, 투명행정",
    "desc": "어떤 청탁이나 외압에도 흔들리지 않고 공공의 법률과 절차를 엄정하게 집행하는 공직자",
    "gear": "공식 관인과 결재함",
    "icon": "🏛️",
    "color": "#1E3A8A",
    "subColor": "#DBEAFE"
  },
  {
    "id": 169,
    "mbti": "ISTJ",
    "group": "SJ",
    "cat": "스포츠/기초",
    "name": "정자세 파워리프터",
    "kw": "치팅금지, 가동범위풀, 완벽한폼",
    "desc": "무게 욕심을 버리고 교과서적인 완벽한 자세와 가동범위로만 증량하는 정석 쇠질러",
    "gear": "가죽 리프팅 벨트",
    "icon": "🏋️",
    "color": "#1E3A8A",
    "subColor": "#DBEAFE"
  },
  {
    "id": 170,
    "mbti": "ISTJ",
    "group": "SJ",
    "cat": "기술/코딩",
    "name": "테스트코드 100% QA 엔지니어",
    "kw": "커버리지100%, 엣지케이스, 린트준수",
    "desc": "모든 예외 케이스를 철저히 검증하는 테스트 코드를 작성해 버그 0%를 달성하는 개발자",
    "gear": "기계식 적축 키보드",
    "icon": "💻",
    "color": "#1E3A8A",
    "subColor": "#DBEAFE"
  },
  {
    "id": 171,
    "mbti": "ISTJ",
    "group": "SJ",
    "cat": "음식/식단",
    "name": "정량 칼로리 밀프랩 마스터",
    "kw": "저울계량, 영양성분표, 일주일도시락",
    "desc": "일주일 치 닭가슴살과 현미밥을 그램(g) 단위로 정확히 계량해 통에 담아두는 식단 관리자",
    "gear": "정밀 디지털 주방저울",
    "icon": "🍱",
    "color": "#1E3A8A",
    "subColor": "#DBEAFE"
  },
  {
    "id": 172,
    "mbti": "ISTJ",
    "group": "SJ",
    "cat": "생활/방재",
    "name": "재난대비 생존배낭 세팅러",
    "kw": "유통기한체크, 비상식량, EDC키트",
    "desc": "생존 배낭의 물품 리스트를 분기마다 검수하고 유통기한 지난 건전지를 칼같이 교체하는 자",
    "gear": "방수 멀티툴 파우치",
    "icon": "🎒",
    "color": "#1E3A8A",
    "subColor": "#DBEAFE"
  },
  {
    "id": 173,
    "mbti": "ISTJ",
    "group": "SJ",
    "cat": "역사/보존",
    "name": "국보급 문화재 복원사",
    "kw": "원형보존, 한지배접, 인내심",
    "desc": "수백 년 전 찢어진 고서화를 옛 방식 그대로 인내심을 갖고 한 올씩 복원해내는 장인",
    "gear": "대나무 핀셋과 풀붓",
    "icon": "📜",
    "color": "#1E3A8A",
    "subColor": "#DBEAFE"
  },
  {
    "id": 174,
    "mbti": "ISTJ",
    "group": "SJ",
    "cat": "물류/유통",
    "name": "오차 없는 물류 센터장",
    "kw": "재고관리, 바코드스캔, 정시출고",
    "desc": "수십만 개의 택배 상자가 오가는 거대 물류창고를 단 하나의 분실 없이 통제하는 관리자",
    "gear": "산업용 바코드 PDA",
    "icon": "📦",
    "color": "#1E3A8A",
    "subColor": "#DBEAFE"
  },
  {
    "id": 175,
    "mbti": "ISTJ",
    "group": "SJ",
    "cat": "스포츠/러닝",
    "name": "정속 페이스메이커 러너",
    "kw": "km당5분00초칼유지, 심박존, 완주",
    "desc": "1km 랩타임을 오차 1초도 없이 메트로놈처럼 일정하게 유지하며 결승선까지 달리는 주자",
    "gear": "GPS 가민 러닝워치",
    "icon": "🏃",
    "color": "#1E3A8A",
    "subColor": "#DBEAFE"
  },
  {
    "id": 176,
    "mbti": "ISTJ",
    "group": "SJ",
    "cat": "도서/기록",
    "name": "십진분류법 도서관장",
    "kw": "DDC분류, 청구기호, 정숙유지",
    "desc": "서가에 꽂힌 수만 권의 책이 번호 순서대로 1밀리미터도 틀림없이 정렬되어야 직성이 풀리는 자",
    "gear": "철제 북엔드",
    "icon": "📚",
    "color": "#1E3A8A",
    "subColor": "#DBEAFE"
  },
  {
    "id": 177,
    "mbti": "ISTJ",
    "group": "SJ",
    "cat": "생활/청소",
    "name": "먼지 한 톨 없는 하우스키퍼",
    "kw": "구역별걸레구분, 멸균소독, 광택",
    "desc": "창틀 틈새와 배수구 구석까지 칫솔로 닦아내어 모델하우스 수준의 청결을 유지하는 자",
    "gear": "스팀 살균 청소기",
    "icon": "🧹",
    "color": "#1E3A8A",
    "subColor": "#DBEAFE"
  },
  {
    "id": 178,
    "mbti": "ISTJ",
    "group": "SJ",
    "cat": "법률/공증",
    "name": "원칙주의 공증인",
    "kw": "인감증명, 신분확인, 사실공증",
    "desc": "본인 확인과 서류 검토 절차를 단 하나의 요령도 피우지 않고 철저하게 확인하는 공증인",
    "gear": "철인 공증 압인기",
    "icon": "⚖️",
    "color": "#1E3A8A",
    "subColor": "#DBEAFE"
  },
  {
    "id": 179,
    "mbti": "ISTJ",
    "group": "SJ",
    "cat": "건강/검진",
    "name": "정기 건강검진 모범생",
    "kw": "추적관찰, 수치기록, 예방의학",
    "desc": "매년 정해진 달에 국가 검진과 정밀 내시경을 빠짐없이 받고 건강 수치를 그래프화하는 자",
    "gear": "건강검진 결과 바인더",
    "icon": "🩺",
    "color": "#1E3A8A",
    "subColor": "#DBEAFE"
  },
  {
    "id": 180,
    "mbti": "ISTJ",
    "group": "SJ",
    "cat": "목표/신용",
    "name": "약속의 바위 솔리드",
    "kw": "신용1등급, 시간약속엄수, 유종의미",
    "desc": "한 번 뱉은 말과 맺은 약속은 목에 칼이 들어와도 끝까지 지켜내는 신뢰의 상징",
    "gear": "신뢰의 화강암 인장",
    "icon": "🏛️",
    "color": "#1E3A8A",
    "subColor": "#DBEAFE"
  }
  ];

  if (typeof module === 'object' && module && module.exports) {
    module.exports = LIST;
  } else if (root) {
    (root.OurgoalAvatarPersonaParts = root.OurgoalAvatarPersonaParts || {}).istj = LIST;
  }
})(typeof self !== 'undefined' ? self : this);
