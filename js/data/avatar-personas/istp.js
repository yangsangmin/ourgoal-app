/**
 * @role 아바타 페르소나 데이터 — ISTP 20종 (id 241~260, group SP)
 *
 * #TASK-ES-386: js/avatar-system.js 의 BODY_THEMES_320 에서 글자 그대로 옮긴 데이터만 있다(로직 없음).
 * js/avatar-system.js 가 intj→intp→…→esfp 순서로 이어 BODY_THEMES_320 을 만든다.
 * 생성기: docs/design/harness/module-split/gen-avatar-data.js — 동일성 시험: tests/ 폴더 avatar-personas-split 시험
 */
(function(root) {
  'use strict';

  var LIST = [
  {
    "id": 241,
    "mbti": "ISTP",
    "group": "SP",
    "cat": "메이커/엔지니어",
    "name": "가라지 커스텀 빌더",
    "kw": "분해조립, 밀링선반, 엔진튜닝",
    "desc": "차고에서 낡은 오토바이를 볼트 하나까지 분해해 완벽한 카페레이서로 재탄생시키는 기술자",
    "gear": "래칫 렌치와 오일 묻은 장갑",
    "icon": "🏍️",
    "color": "#475569",
    "subColor": "#F1F5F9"
  },
  {
    "id": 242,
    "mbti": "ISTP",
    "group": "SP",
    "cat": "목공/장인",
    "name": "원목 짜맞춤 목수",
    "kw": "못없는가구, 대패질, 결따라깎기",
    "desc": "쇠못 하나 쓰지 않고 암수 장부맞춤으로 100년을 버티는 원목 가구를 깎아내는 장인",
    "gear": "손대패와 끌 세트",
    "icon": "🪚",
    "color": "#475569",
    "subColor": "#F1F5F9"
  },
  {
    "id": 243,
    "mbti": "ISTP",
    "group": "SP",
    "cat": "아웃도어/서바이벌",
    "name": "부시크래프트 서바이벌러",
    "kw": "부싯돌점화, 나이프하나로생존, 야생쉘터",
    "desc": "나이프 한 자루만 들고 깊은 산속에 들어가 통나무 쉘터를 짓고 살아남는 야생의 달인",
    "gear": "탄소강 서바이벌 나이프",
    "icon": "🏕️",
    "color": "#475569",
    "subColor": "#F1F5F9"
  },
  {
    "id": 244,
    "mbti": "ISTP",
    "group": "SP",
    "cat": "스포츠/모빌리티",
    "name": "다운힐 MTB 라이더",
    "kw": "바위길돌파, 드리프트, 풀서스펜션",
    "desc": "깎아지른 절벽과 거친 산악 싱글길을 시속 60km로 질주하며 스릴을 즐기는 산악자전거인",
    "gear": "풀페이스 헬멧과 고글",
    "icon": "🚵",
    "color": "#475569",
    "subColor": "#F1F5F9"
  },
  {
    "id": 245,
    "mbti": "ISTP",
    "group": "SP",
    "cat": "정밀기술/수리",
    "name": "빈티지 기계식 시계 장인",
    "kw": "무브먼트오버홀, 루페, 핀셋작업",
    "desc": "머리카락보다 얇은 태엽과 톱니바퀴를 현미경으로 들여다보며 멈춘 시간을 되살리는 장인",
    "gear": "시계공 루페와 미세 핀셋",
    "icon": "⌚",
    "color": "#475569",
    "subColor": "#F1F5F9"
  },
  {
    "id": 246,
    "mbti": "ISTP",
    "group": "SP",
    "cat": "무기/격투",
    "name": "실전 주짓수 블랙벨트",
    "kw": "지렛대원리, 관절기, 탭받아내기",
    "desc": "힘보다 인체 관절의 지렛대 원리를 완벽히 활용해 거구의 상대도 제압하는 실전 격투가",
    "gear": "주짓수 도복과 띠",
    "icon": "🥋",
    "color": "#475569",
    "subColor": "#F1F5F9"
  },
  {
    "id": 247,
    "mbti": "ISTP",
    "group": "SP",
    "cat": "하드웨어/전자",
    "name": "전자 회로 리버스 엔지니어",
    "kw": "오실로스코프, 납땜, 칩셋해킹",
    "desc": "고장 난 기판의 회로 패턴을 추적해 단선된 부분을 점퍼선으로 이어 살려내는 전자 엔지니어",
    "gear": "디지털 오실로스코프",
    "icon": "📟",
    "color": "#475569",
    "subColor": "#F1F5F9"
  },
  {
    "id": 248,
    "mbti": "ISTP",
    "group": "SP",
    "cat": "드론/항공",
    "name": "FPV 드론 레이싱 파일럿",
    "kw": "고글비행, 곡예비행, 초당100km",
    "desc": "VR 고글을 쓰고 숲속 나무 사이를 아슬아슬하게 통과하는 시각적 쾌감의 레이서",
    "gear": "FPV 조종기와 고글",
    "icon": "🚁",
    "color": "#475569",
    "subColor": "#F1F5F9"
  },
  {
    "id": 249,
    "mbti": "ISTP",
    "group": "SP",
    "cat": "취미/사격",
    "name": "정밀 스나이퍼 슈터",
    "kw": "호흡정지, 탄도학, 원샷원킬",
    "desc": "바람의 속도와 기온, 탄도를 계산해 1000m 밖의 타깃을 정확히 명중시키는 저격수",
    "gear": "정밀 바이포드 스코프",
    "icon": "🎯",
    "color": "#475569",
    "subColor": "#F1F5F9"
  },
  {
    "id": 250,
    "mbti": "ISTP",
    "group": "SP",
    "cat": "자동차/레이싱",
    "name": "서킷 드리프트 마스터",
    "kw": "카운터스티어, 타이어스모크, 횡G체험",
    "desc": "아스팔트 위에서 차량의 한계 그립을 제어하며 연기를 뿜어내며 코너를 탈출하는 레이서",
    "gear": "스파르코 레이싱 슈트",
    "icon": "🏎️",
    "color": "#475569",
    "subColor": "#F1F5F9"
  },
  {
    "id": 251,
    "mbti": "ISTP",
    "group": "SP",
    "cat": "낚시/루어",
    "name": "배스 딥 루어 앵글러",
    "kw": "수중지형읽기, 웜낚시, 손맛",
    "desc": "어탐기로 호수 바닥의 돌무더기를 읽고 루어의 미세한 입질을 챔질로 연결하는 강태공",
    "gear": "베이트캐스팅 릴과 로드",
    "icon": "🎣",
    "color": "#475569",
    "subColor": "#F1F5F9"
  },
  {
    "id": 252,
    "mbti": "ISTP",
    "group": "SP",
    "cat": "금속/대장간",
    "name": "다마스커스 도검 대장장이",
    "kw": "수천번접쇠, 모루, 담금질",
    "desc": "뜨거운 화덕에서 강철을 두드려 물결무늬가 살아 숨 쉬는 단단한 칼을 빚어내는 대장장이",
    "gear": "단조 망치와 모루",
    "icon": "🔨",
    "color": "#475569",
    "subColor": "#F1F5F9"
  },
  {
    "id": 253,
    "mbti": "ISTP",
    "group": "SP",
    "cat": "가죽/공예",
    "name": "새들스티치 가죽 장인",
    "kw": "베지터블가죽, 에지베벨러, 엣지코트",
    "desc": "통가죽을 재단하고 두 바늘로 한 땀 한 땀 교차 스티치해 평생 쓰는 지갑을 만드는 메이커",
    "gear": "포니와 구두칼",
    "icon": "👛",
    "color": "#475569",
    "subColor": "#F1F5F9"
  },
  {
    "id": 254,
    "mbti": "ISTP",
    "group": "SP",
    "cat": "스포츠/등반",
    "name": "볼더링 루트 파인더",
    "kw": "홀드파악, 무게중심이동, 완등",
    "desc": "아무도 못 깬 고난도 볼더링 루트의 숨은 무브를 신체 역학적으로 찾아내 완등하는 클라이머",
    "gear": "초크백과 암벽화",
    "icon": "🧗",
    "color": "#475569",
    "subColor": "#F1F5F9"
  },
  {
    "id": 255,
    "mbti": "ISTP",
    "group": "SP",
    "cat": "모험/탐사",
    "name": "동굴 케이빙 탐험가",
    "kw": "종유석, 헤드램프, 지하수수영",
    "desc": "빛 한 점 들지 않는 미개척 석회암 동굴 속을 포복으로 기어들어가 지도를 그리는 탐험가",
    "gear": "방수 헤드랜턴",
    "icon": "🔦",
    "color": "#475569",
    "subColor": "#F1F5F9"
  },
  {
    "id": 256,
    "mbti": "ISTP",
    "group": "SP",
    "cat": "일상/장비",
    "name": "EDC(Everyday Carry) 매니아",
    "kw": "티타늄멀티툴, 택티컬펜, 장비정돈",
    "desc": "주머니 속에 비상시 필요한 모든 최고급 도구를 완벽한 세트로 휴대하는 실용주의자",
    "gear": "레더맨 티타늄 멀티툴",
    "icon": "🔪",
    "color": "#475569",
    "subColor": "#F1F5F9"
  },
  {
    "id": 257,
    "mbti": "ISTP",
    "group": "SP",
    "cat": "컴퓨터/오버클럭",
    "name": "액체질소 극냉 오버클러커",
    "kw": "CPU클럭경신, LN2냉각, 벤치마크",
    "desc": "메인보드에 영하 196도 액체질소를 부으며 세계 신기록 클럭을 뽑아내는 하드웨어 덕후",
    "gear": "액체질소 보온통과 팟",
    "icon": "❄️",
    "color": "#475569",
    "subColor": "#F1F5F9"
  },
  {
    "id": 258,
    "mbti": "ISTP",
    "group": "SP",
    "cat": "악기/셋업",
    "name": "일렉기타 리페어 테크니션",
    "kw": "트러스로드조절, 픽업와이어링, 줄높이",
    "desc": "기타의 넥 휨과 프렛 레벨링을 0.1mm 단위로 세팅해 연주자에게 최상의 연주감을 주는 조율사",
    "gear": "스트링 게이지와 인치 렌치",
    "icon": "🎸",
    "color": "#475569",
    "subColor": "#F1F5F9"
  },
  {
    "id": 259,
    "mbti": "ISTP",
    "group": "SP",
    "cat": "건설/중장비",
    "name": "포클레인 신의 손",
    "kw": "달걀집기, 정밀터파기, 레버조작",
    "desc": "수십 톤 굴착기 버킷으로 날계란을 깨뜨리지 않고 집어 올리는 신기에 가까운 조종사",
    "gear": "유압 조종 레버",
    "icon": "🚜",
    "color": "#475569",
    "subColor": "#F1F5F9"
  },
  {
    "id": 260,
    "mbti": "ISTP",
    "group": "SP",
    "cat": "목표/해결",
    "name": "현실 문제 해결사 픽서",
    "kw": "원인규명, 즉각수리, 군더더기없음",
    "desc": "말 대신 행동으로, 어떤 고장 난 현실의 문제도 자신의 손으로 고쳐내는 만능 해결사",
    "gear": "만능 툴킷 가방",
    "icon": "🧰",
    "color": "#475569",
    "subColor": "#F1F5F9"
  }
  ];

  if (typeof module === 'object' && module && module.exports) {
    module.exports = LIST;
  } else if (root) {
    (root.OurgoalAvatarPersonaParts = root.OurgoalAvatarPersonaParts || {}).istp = LIST;
  }
})(typeof self !== 'undefined' ? self : this);
