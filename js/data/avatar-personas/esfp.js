/**
 * @role 아바타 페르소나 데이터 — ESFP 20종 (id 301~320, group SP)
 *
 * #TASK-ES-386: js/avatar-system.js 의 BODY_THEMES_320 에서 글자 그대로 옮긴 데이터만 있다(로직 없음).
 * js/avatar-system.js 가 intj→intp→…→esfp 순서로 이어 BODY_THEMES_320 을 만든다.
 * 생성기: docs/design/harness/module-split/gen-avatar-data.js — 동일성 시험: tests/ 폴더 avatar-personas-split 시험
 */
(function(root) {
  'use strict';

  var LIST = [
  {
    "id": 301,
    "mbti": "ESFP",
    "group": "SP",
    "cat": "무대/아이돌",
    "name": "엔딩 요정 케이팝 스타",
    "kw": "칼군무, 눈맞춤, 센터포지션",
    "desc": "음악방송 무대 엔딩에서 카메라를 향해 숨을 헐떡이며 윙크 한 번으로 팬덤을 초토화하는 아이돌",
    "gear": "인이어 모니터와 큐빅 마이크",
    "icon": "🎤",
    "color": "#F59E0B",
    "subColor": "#FEF3C7"
  },
  {
    "id": 302,
    "mbti": "ESFP",
    "group": "SP",
    "cat": "댄스/안무",
    "name": "스트리트 댄스 배틀 퀸",
    "kw": "락킹, 왁킹, 무대장악력",
    "desc": "비트가 나오는 순간 몸이 먼저 반응해 화려한 왁킹과 그루브로 무대를 찢어놓는 댄서",
    "gear": "스냅백과 와이드 팬츠",
    "icon": "💃",
    "color": "#F59E0B",
    "subColor": "#FEF3C7"
  },
  {
    "id": 303,
    "mbti": "ESFP",
    "group": "SP",
    "cat": "방송/예능",
    "name": "예능 치트키 방송인",
    "kw": "몸개그, 오디오채우기, 시청률보증",
    "desc": "어떤 토크쇼에 나가도 빵빵 터지는 리액션과 유쾌한 입담으로 분량을 싹쓸이하는 방송인",
    "gear": "예능 큐카드",
    "icon": "📺",
    "color": "#F59E0B",
    "subColor": "#FEF3C7"
  },
  {
    "id": 304,
    "mbti": "ESFP",
    "group": "SP",
    "cat": "뷰티/크리에이터",
    "name": "글램 뷰티 인플루언서",
    "kw": "글리터메이크업, 릴스떡상, 트렌드세터",
    "desc": "반짝이는 글리터와 화려한 룩으로 100만 팔로워에게 매일 새로운 아름다움을 전파하는 뷰티 스타",
    "gear": "LED 링라이트",
    "icon": "💄",
    "color": "#F59E0B",
    "subColor": "#FEF3C7"
  },
  {
    "id": 305,
    "mbti": "ESFP",
    "group": "SP",
    "cat": "패션/런웨이",
    "name": "파리 패션위크 톱모델",
    "kw": "당당한워킹, 카메라세례, 카리스마",
    "desc": "스포트라이트를 한 몸에 받으며 런웨이를 당당하게 활보해 전 세계 디자이너의 뮤즈가 된 모델",
    "gear": "하이패션 선글라스",
    "icon": "👠",
    "color": "#F59E0B",
    "subColor": "#FEF3C7"
  },
  {
    "id": 306,
    "mbti": "ESFP",
    "group": "SP",
    "cat": "파티/호스트",
    "name": "샴페인 풀파티 호스트",
    "kw": "샴페인샤워, 카바나, 끝없는음악",
    "desc": "야외 수영장을 거대한 축제의 장으로 만들고 해가 뜰 때까지 파티를 이끄는 에너자이저",
    "gear": "골드 샴페인 건",
    "icon": "🍾",
    "color": "#F59E0B",
    "subColor": "#FEF3C7"
  },
  {
    "id": 307,
    "mbti": "ESFP",
    "group": "SP",
    "cat": "음악/뮤지컬",
    "name": "뮤지컬 디바 쇼걸",
    "kw": "하이노트, 화려한의상, 기립박수",
    "desc": "객석 맨 뒷자리까지 쩌렁쩌렁 울리는 폭풍 가창력으로 커튼콜 기립박수를 이끌어내는 디바",
    "gear": "깃털 보아와 스팽글 드레스",
    "icon": "🎭",
    "color": "#F59E0B",
    "subColor": "#FEF3C7"
  },
  {
    "id": 308,
    "mbti": "ESFP",
    "group": "SP",
    "cat": "스포츠/치어리딩",
    "name": "프로야구 응원단장",
    "kw": "승리의함성, 단체응원가, 에너지충전",
    "desc": "9회 말 2아웃 만루 상황에서도 팬들의 함성을 하나로 모아 역전 홈런을 부르는 치어리더",
    "gear": "응원 수술과 확성기",
    "icon": "📣",
    "color": "#F59E0B",
    "subColor": "#FEF3C7"
  },
  {
    "id": 309,
    "mbti": "ESFP",
    "group": "SP",
    "cat": "라이브커머스",
    "name": "10분 완판 쇼호스트",
    "kw": "매진임박, 텐션폭발, 구매버튼연타",
    "desc": "\"고객님 지금 안 사시면 후회해요!\"라며 특유의 찰진 멘트로 준비 수량을 10분 만에 털어버리는 쇼퍼",
    "gear": "스마트폰 태블릿 삼각대",
    "icon": "🛍️",
    "color": "#F59E0B",
    "subColor": "#FEF3C7"
  },
  {
    "id": 310,
    "mbti": "ESFP",
    "group": "SP",
    "cat": "테마파크/퍼레이드",
    "name": "놀이공원 퍼레이드 프린세스",
    "kw": "손흔들기, 동화속공주, 아이들의꿈",
    "desc": "퍼레이드 카 위에서 화려한 드레스를 입고 아이들에게 잊지 못할 마법 같은 하루를 선물하는 연기자",
    "gear": "반짝이는 티아라 왕관",
    "icon": "👑",
    "color": "#F59E0B",
    "subColor": "#FEF3C7"
  },
  {
    "id": 311,
    "mbti": "ESFP",
    "group": "SP",
    "cat": "요리/파티",
    "name": "핑거푸드 케이터링 파티시에",
    "kw": "인스타감성카나페, 파티비주얼, 달콤함",
    "desc": "파티 테이블을 화려하고 아기자기한 핑거푸드로 수놓아 모든 하객이 사진부터 찍게 만드는 요리사",
    "gear": "대리석 핑거푸드 트레이",
    "icon": "🧁",
    "color": "#F59E0B",
    "subColor": "#FEF3C7"
  },
  {
    "id": 312,
    "mbti": "ESFP",
    "group": "SP",
    "cat": "여행/페스티벌",
    "name": "이비자 썸머 페스티벌러",
    "kw": "낮수영밤파티, 폼파티, 젊음의열기",
    "desc": "스페인 이비자 섬에서 전 세계 청춘들과 함께 온몸에 거품을 맞으며 춤추는 자유로운 청춘",
    "gear": "네온 비치웨어",
    "icon": "🏝️",
    "color": "#F59E0B",
    "subColor": "#FEF3C7"
  },
  {
    "id": 313,
    "mbti": "ESFP",
    "group": "SP",
    "cat": "피트니스/스피닝",
    "name": "클럽 스피닝 마스터 강사",
    "kw": "사이키조명, 페달링, 칼로리소태",
    "desc": "어두운 룸에 화려한 사이키 조명을 켜고 신나는 음악에 맞춰 회원들을 한계까지 달리게 하는 강사",
    "gear": "스피닝 클릿 슈즈",
    "icon": "🚴‍♀️",
    "color": "#F59E0B",
    "subColor": "#FEF3C7"
  },
  {
    "id": 314,
    "mbti": "ESFP",
    "group": "SP",
    "cat": "반려동물/스타",
    "name": "인스타 댕댕이 패션 인플루언서",
    "kw": "강아지옷피팅, 케이프, 멍스타그램",
    "desc": "자신의 반려견에게 매일 예쁜 옷을 입혀 화보를 찍고 수십만 랜선 집사들을 심쿵하게 만드는 자",
    "gear": "강아지 선글라스와 가방",
    "icon": "🐶",
    "color": "#F59E0B",
    "subColor": "#FEF3C7"
  },
  {
    "id": 315,
    "mbti": "ESFP",
    "group": "SP",
    "cat": "일상/사진",
    "name": "인생네컷 포즈 장인",
    "kw": "소품활용100%, 엽기귀염, 네컷사진",
    "desc": "인형 모자와 선글라스를 기가 막히게 조합해 네 컷 프레임 속에 환상의 추억을 남기는 인싸",
    "gear": "동물 머리띠 컬렉션",
    "icon": "📸",
    "color": "#F59E0B",
    "subColor": "#FEF3C7"
  },
  {
    "id": 316,
    "mbti": "ESFP",
    "group": "SP",
    "cat": "예술/서커스",
    "name": "에어리얼 실크 공중곡예사",
    "kw": "공중회전, 유연성, 우아한낙하",
    "desc": "천장에 매달린 붉은 실크를 타고 공중에서 나비처럼 회전하며 관객의 탄성을 자아내는 아티스트",
    "gear": "붉은 에어리얼 실크",
    "icon": "🎪",
    "color": "#F59E0B",
    "subColor": "#FEF3C7"
  },
  {
    "id": 317,
    "mbti": "ESFP",
    "group": "SP",
    "cat": "노래/가라오케",
    "name": "노래방 탬버린의 신",
    "kw": "탬버린돌리기, 분위기하드캐리, 목청폭발",
    "desc": "모임 2차 노래방에서 탬버린을 현란하게 흔들며 모두를 스테이지로 뛰쳐나오게 만드는 흥 부자",
    "gear": "LED 반짝이 탬버린",
    "icon": "🪇",
    "color": "#F59E0B",
    "subColor": "#FEF3C7"
  },
  {
    "id": 318,
    "mbti": "ESFP",
    "group": "SP",
    "cat": "네일/아트",
    "name": "스톤 풀파츠 네일 아티스트",
    "kw": "스와로브스키, 블링블링, 손끝예술",
    "desc": "열 손가락 가득 눈부신 스톤과 보석을 얹어 고객의 손끝에 최고의 화려함을 선물하는 아티스트",
    "gear": "정밀 네일 핀셋과 UV 램프",
    "icon": "💅",
    "color": "#F59E0B",
    "subColor": "#FEF3C7"
  },
  {
    "id": 319,
    "mbti": "ESFP",
    "group": "SP",
    "cat": "취미/롤러스케이트",
    "name": "레트로 롤러장 댄싱 킹",
    "kw": "뒤로타기, 롤러댄스, 미러볼",
    "desc": "화려한 미러볼 아래에서 롤러스케이트를 뒤로 타며 문워크를 구사하는 복고풍의 황제",
    "gear": "네온 4륜 롤러스케이트",
    "icon": "🛼",
    "color": "#F59E0B",
    "subColor": "#FEF3C7"
  },
  {
    "id": 320,
    "mbti": "ESFP",
    "group": "SP",
    "cat": "목표/환호",
    "name": "영원한 스포트라이트 스타",
    "kw": "무대의주인공, 사랑받는존재, 환희",
    "desc": "세상이라는 무대 한가운데 서서 모든 이들의 환호와 사랑을 받으며 가장 눈부시게 빛나는 별",
    "gear": "스포트라이트 골든 스타",
    "icon": "🌟",
    "color": "#F59E0B",
    "subColor": "#FEF3C7"
  }
  ];

  if (typeof module === 'object' && module && module.exports) {
    module.exports = LIST;
  } else if (root) {
    (root.OurgoalAvatarPersonaParts = root.OurgoalAvatarPersonaParts || {}).esfp = LIST;
  }
})(typeof self !== 'undefined' ? self : this);
