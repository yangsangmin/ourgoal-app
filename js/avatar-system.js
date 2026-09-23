/**
 * Ourgoal Avatar System (#TASK-ES-044, #TASK-ES-046, #TASK-ES-047, #TASK-ES-048)
 * - 1~10단계 레벨별 초록 로봇 아바타 SVG 렌더러
 * - 사진 업로드 ➔ '내 사진으로 아바타 제작' 클릭 시 실질 10회 차감 (하단 적용하기는 횟수 차감 없음)
 * - Gemini 2.5 Flash 멀티모달 비전 연동: 실제 인물의 안경, 헤어 가르마, 눈매, 얼굴형 디코딩
 * - 77종 바디 5단계 샌드위치(Z-Index) 무봉제(Seamless) 캔버스 결합 (목선 매립 + 턱선 그림자 + 옷깃 오버랩)
 * - 캔버스 좌측 상단 번호/이름 뱃지 삭제 (순수 캐릭터 일러스트 렌더링)
 * - 아바타 적용 즉시 DOM 반영 및 프로필 실시간 동기화 보장
 * - 나무망치 아바타 제작 애니메이션 연출 (getWoodHammerMakerAnimationHtml)
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.OurgoalAvatar = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var DEFAULT_BASE_CRAFTS = 3;
  var LEGACY_MAX_CRAFTS = 10; // 레거시 10회 호환: /10회
  var MAX_AVATAR_CHANGES = 10; // 보관함 최대 저장 용량 및 레거시 10회 호환

  // ================= 77종 3등신 캐릭터 바디 테마 풀 =================
  var BODY_THEMES_77 = [
    // 1~11. 스포츠 & 피트니스
    { id: 1, cat: '스포츠', name: '열정 러너', icon: '🏃', color: '#EF4444', subColor: '#FEE2E2', gear: '스니커즈' },
    { id: 2, cat: '스포츠', name: '덤벨 마스터', icon: '🏋️', color: '#DC2626', subColor: '#FEF2F2', gear: '리프팅 벨트' },
    { id: 3, cat: '스포츠', name: '사이클리스트', icon: '🚴', color: '#F97316', subColor: '#FFEDD5', gear: '바이크 헬멧' },
    { id: 4, cat: '스포츠', name: '마인드 요가', icon: '🧘', color: '#10B981', subColor: '#D1FAE5', gear: '요가 매트' },
    { id: 5, cat: '스포츠', name: '챔피언 복서', icon: '🥊', color: '#B91C1C', subColor: '#FEE2E2', gear: '글러브' },
    { id: 6, cat: '스포츠', name: '인피니티 스위머', icon: '🏊', color: '#0284C7', subColor: '#E0F2FE', gear: '수영 고글' },
    { id: 7, cat: '스포츠', name: '스트리트 바스켓', icon: '🏀', color: '#EA580C', subColor: '#FFEDD5', gear: '농구공' },
    { id: 8, cat: '스포츠', name: '에이스 스트라이커', icon: '⚽', color: '#059669', subColor: '#D1FAE5', gear: '축구화' },
    { id: 9, cat: '스포츠', name: '알파인 클라이머', icon: '🧗', color: '#D97706', subColor: '#FEF3C7', gear: '등반 로프' },
    { id: 10, cat: '스포츠', name: '어반 스케이터', icon: '🛹', color: '#7C3AED', subColor: '#EDE9FE', gear: '스케이트보드' },
    { id: 11, cat: '스포츠', name: '스카이 파일럿', icon: '✈️', color: '#0284C7', subColor: '#BAE6FD', gear: '비행 고글' },

    // 12~22. 비즈니스 & 지식 & 생산성
    { id: 12, cat: '지식', name: '비전 CEO', icon: '💼', color: '#1E293B', subColor: '#F1F5F9', gear: '스마트 브리프케이스' },
    { id: 13, cat: '지식', name: '데이터 아키텍트', icon: '📊', color: '#2563EB', subColor: '#DBEAFE', gear: '분석 대시보드' },
    { id: 14, cat: '지식', name: '풀스택 해커', icon: '💻', color: '#059669', subColor: '#ECFDF5', gear: '기계식 키보드' },
    { id: 15, cat: '지식', name: '딥러닝 리서처', icon: '🔬', color: '#7C3AED', subColor: '#F3E8FF', gear: '실험 비커' },
    { id: 16, cat: '지식', name: '베스트셀러 작가', icon: '🖋️', color: '#B45309', subColor: '#FEF3C7', gear: '만년필' },
    { id: 17, cat: '지식', name: '석학 프로페서', icon: '🎓', color: '#312E81', subColor: '#E0E7FF', gear: '학사모' },
    { id: 18, cat: '지식', name: '북웜 리더', icon: '📚', color: '#92400E', subColor: '#FDE68A', gear: '하드커버 북' },
    { id: 19, cat: '지식', name: '엔젤 인베스터', icon: '📈', color: '#047857', subColor: '#D1FAE5', gear: '황금 만년필' },
    { id: 20, cat: '지식', name: '테크 크리에이터', icon: '🎙️', color: '#E11D48', subColor: '#FFE4E6', gear: '방송 마이크' },
    { id: 21, cat: '지식', name: 'UIUX 프로덕트 디자이너', icon: '🎨', color: '#4F46E5', subColor: '#EEF2FF', gear: '스타일러스 펜' },
    { id: 22, cat: '지식', name: '그로스 마케터', icon: '🚀', color: '#D97706', subColor: '#FEF3C7', gear: '확성기' },

    // 23~33. 학업 & 몰입 & 합격
    { id: 23, cat: '학업', name: '불패의 고시생', icon: '🎯', color: '#1E3A8A', subColor: '#DBEAFE', gear: '필기용 스톱워치' },
    { id: 24, cat: '학업', name: '수능 만점러', icon: '💯', color: '#DC2626', subColor: '#FEE2E2', gear: '합격 엿' },
    { id: 25, cat: '학업', name: '자격증 컬렉터', icon: '📜', color: '#B45309', subColor: '#FEF3C7', gear: '두루마리 자격증' },
    { id: 26, cat: '학업', name: '글로벌 링귀스트', icon: '🌍', color: '#0D9488', subColor: '#CCFBF1', gear: '포켓 사전' },
    { id: 27, cat: '학업', name: '도서관 요정', icon: '📖', color: '#854D0E', subColor: '#FEF08A', gear: '독서대' },
    { id: 28, cat: '학업', name: '알고리즘 마스터', icon: '⌨️', color: '#0284C7', subColor: '#E0F2FE', gear: '코딩 모니터' },
    { id: 29, cat: '학업', name: '골든 청진기', icon: '🩺', color: '#059669', subColor: '#D1FAE5', gear: '청진기' },
    { id: 30, cat: '학업', name: '정의의 로스쿨러', icon: '⚖️', color: '#374151', subColor: '#F3F4F6', gear: '법전' },
    { id: 31, cat: '학업', name: '일등 필기왕', icon: '📝', color: '#E11D48', subColor: '#FFE4E6', gear: '삼색 형광펜' },
    { id: 32, cat: '학업', name: '다독왕 챔피언', icon: '📕', color: '#991B1B', subColor: '#FEE2E2', gear: '가죽 책갈피' },
    { id: 33, cat: '학업', name: '스터디 캡틴', icon: '🚩', color: '#2563EB', subColor: '#DBEAFE', gear: '팀 깃발' },

    // 34~44. 예술 & 감성 & 음악
    { id: 34, cat: '예술', name: '순수 화가', icon: '🖌️', color: '#E11D48', subColor: '#FFE4E6', gear: '나무 팔레트' },
    { id: 35, cat: '예술', name: '락 기타리스트', icon: '🎸', color: '#B91C1C', subColor: '#FEE2E2', gear: '일렉 기타' },
    { id: 36, cat: '예술', name: '클래식 피아니스트', icon: '🎹', color: '#1E293B', subColor: '#F1F5F9', gear: '그랜드 건반' },
    { id: 37, cat: '예술', name: '비트 드러머', icon: '🥁', color: '#D97706', subColor: '#FEF3C7', gear: '드럼스틱' },
    { id: 38, cat: '예술', name: '감성 싱어송라이터', icon: '🎶', color: '#7C3AED', subColor: '#EDE9FE', gear: '어쿠스틱 기타' },
    { id: 39, cat: '예술', name: '인기 웹툰작가', icon: '📱', color: '#059669', subColor: '#ECFDF5', gear: '액정 타블렛' },
    { id: 40, cat: '예술', name: '필름 포토그래퍼', icon: '📷', color: '#374151', subColor: '#E5E7EB', gear: '수동 필름카메라' },
    { id: 41, cat: '예술', name: '달빛 도예가', icon: '🏺', color: '#78350F', subColor: '#FEF3C7', gear: '물레와 점토' },
    { id: 42, cat: '예술', name: '현대 조각가', icon: '🗿', color: '#475569', subColor: '#F1F5F9', gear: '끌과 망치' },
    { id: 43, cat: '예술', name: '무대 안무가', icon: '🩰', color: '#DB2777', subColor: '#FCE7F3', gear: '댄스 토슈즈' },
    { id: 44, cat: '예술', name: '클럽 DJ', icon: '🎧', color: '#9333EA', subColor: '#F3E8FF', gear: '턴테이블 믹서' },

    // 45~55. 판타지 & 히어로 & SF
    { id: 45, cat: '판타지', name: '아크 메이지', icon: '🧙‍♂️', color: '#4338CA', subColor: '#E0E7FF', gear: '크리스탈 지팡이' },
    { id: 46, cat: '판타지', name: '드래곤 나이트', icon: '⚔️', color: '#991B1B', subColor: '#FEE2E2', gear: '용비늘 방패' },
    { id: 47, cat: '판타지', name: '엘프 궁수', icon: '🏹', color: '#15803D', subColor: '#DCFCE7', gear: '은빛 활' },
    { id: 48, cat: '판타지', name: '빛의 성기사', icon: '🛡️', color: '#B45309', subColor: '#FEF3C7', gear: '정의의 메이스' },
    { id: 49, cat: '판타지', name: '숲의 드루이드', icon: '🌿', color: '#047857', subColor: '#D1FAE5', gear: '세계수 씨앗' },
    { id: 50, cat: '판타지', name: '유랑의 바드', icon: '🪕', color: '#C026D3', subColor: '#FAE8FF', gear: '음유 류트' },
    { id: 51, cat: '판타지', name: '바람의 섀도우', icon: '🗡️', color: '#1E293B', subColor: '#334155', gear: '암살 단검' },
    { id: 52, cat: '판타지', name: '현자의 연금술사', icon: '⚗️', color: '#B45309', subColor: '#FEF08A', gear: '현자의 돌' },
    { id: 53, cat: '판타지', name: '은하 우주비행사', icon: '👨‍🚀', color: '#0284C7', subColor: '#E0F2FE', gear: '생명유지 배낭' },
    { id: 54, cat: '판타지', name: '시간 여행자', icon: '⏳', color: '#7C3AED', subColor: '#EDE9FE', gear: '회중 모래시계' },
    { id: 55, cat: '판타지', name: '차원 개척자', icon: '🌌', color: '#312E81', subColor: '#E0E7FF', gear: '포털 건' },

    // 56~66. 여행 & 자연 & 어드벤처
    { id: 56, cat: '여행', name: '방랑 백패커', icon: '🎒', color: '#D97706', subColor: '#FEF3C7', gear: '대용량 배낭' },
    { id: 57, cat: '여행', name: '감성 캠퍼', icon: '⛺', color: '#15803D', subColor: '#DCFCE7', gear: '빈티지 랜턴' },
    { id: 58, cat: '여행', name: '파도 서퍼', icon: '🏄', color: '#0284C7', subColor: '#BAE6FD', gear: '서프보드' },
    { id: 59, cat: '여행', name: '세계 일주러', icon: '🗺️', color: '#B45309', subColor: '#FEF3C7', gear: '여권 케이스' },
    { id: 60, cat: '여행', name: '도심 속 정원사', icon: '🪴', color: '#16A34A', subColor: '#DCFCE7', gear: '물뿌리개' },
    { id: 61, cat: '여행', name: '미지의 탐험가', icon: '🧭', color: '#78350F', subColor: '#FEF3C7', gear: '골동품 나침반' },
    { id: 62, cat: '여행', name: '설산 스노보더', icon: '🏂', color: '#2563EB', subColor: '#DBEAFE', gear: '고글과 보드' },
    { id: 63, cat: '여행', name: '심해 스쿠버', icon: '🤿', color: '#0891B2', subColor: '#CFFAFE', gear: '산소통 마스크' },
    { id: 64, cat: '여행', name: '지구 플로깅러', icon: '🧤', color: '#059669', subColor: '#D1FAE5', gear: '친환경 집게' },
    { id: 65, cat: '여행', name: '은하수 별바라기', icon: '🔭', color: '#4338CA', subColor: '#E0E7FF', gear: '천체 망원경' },
    { id: 66, cat: '여행', name: '백두대간 트레커', icon: '🥾', color: '#92400E', subColor: '#FEF3C7', gear: '카본 스틱' },

    // 67~77. 일상 & 웰빙 & 라이프
    { id: 67, cat: '일상', name: '홈카페 바리스타', icon: '☕', color: '#78350F', subColor: '#FEF3C7', gear: '핸드드립 포트' },
    { id: 68, cat: '일상', name: '미슐랭 셰프', icon: '🍳', color: '#DC2626', subColor: '#FEE2E2', gear: '셰프 나이프' },
    { id: 69, cat: '일상', name: '파티시에', icon: '🥐', color: '#D97706', subColor: '#FEF3C7', gear: '거품기' },
    { id: 70, cat: '일상', name: '초록 식집사', icon: '🌱', color: '#15803D', subColor: '#DCFCE7', gear: '토분 화분' },
    { id: 71, cat: '일상', name: '행복 댕댕집사', icon: '🐕', color: '#EA580C', subColor: '#FFEDD5', gear: '산책 리드줄' },
    { id: 72, cat: '일상', name: '냥냥이 집사', icon: '🐈', color: '#9333EA', subColor: '#F3E8FF', gear: '깃털 낚싯대' },
    { id: 73, cat: '일상', name: '미니멀 라이퍼', icon: '✨', color: '#475569', subColor: '#F1F5F9', gear: '정돈 바구니' },
    { id: 74, cat: '일상', name: '미라클 모닝러', icon: '🌅', color: '#F59E0B', subColor: '#FEF3C7', gear: '모닝 알람' },
    { id: 75, cat: '일상', name: '힐링 명상가', icon: '🕯️', color: '#0D9488', subColor: '#CCFBF1', gear: '싱잉볼' },
    { id: 76, cat: '일상', name: '동네 산책러', icon: '👟', color: '#2563EB', subColor: '#DBEAFE', gear: '러닝 포치' },
    { id: 77, cat: '일상', name: '숙면 꿀잠러', icon: '🌙', color: '#312E81', subColor: '#E0E7FF', gear: '수면 안대' }
  ];

  // ================= [TASK-ES-127] 16개 MBTI 연계 320개 아바타 페르소나 온톨로지 =================
  var BODY_THEMES_320 = [
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
  },
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
  },
  {
    "id": 41,
    "mbti": "ENTJ",
    "group": "NT",
    "cat": "비즈니스/리더십",
    "name": "스케일업 유니콘 CEO",
    "kw": "J커브, 시장지배, 결단력",
    "desc": "명확한 비전과 거침없는 추진력으로 시장을 독점하는 연쇄 창업가",
    "gear": "CEO 스마트워치",
    "icon": "💼",
    "color": "#1E293B",
    "subColor": "#F1F5F9"
  },
  {
    "id": 42,
    "mbti": "ENTJ",
    "group": "NT",
    "cat": "전략/조직",
    "name": "야전 사령관",
    "kw": "통솔, 자원동원, 기동전",
    "desc": "혼란스러운 전황 속에서도 냉철하게 부대를 재편하여 승리를 쟁취하는 지휘관",
    "gear": "지휘봉과 야전지도",
    "icon": "🎖️",
    "color": "#1E293B",
    "subColor": "#F1F5F9"
  },
  {
    "id": 43,
    "mbti": "ENTJ",
    "group": "NT",
    "cat": "투자/M&A",
    "name": "피투자 M&A 헌터",
    "kw": "실사, 기업가치, 밸류업",
    "desc": "잠재력 있는 기업을 인수해 10배의 가치로 리빌딩하는 노련한 사모펀드 매니저",
    "gear": "황금 서명 펜",
    "icon": "📈",
    "color": "#1E293B",
    "subColor": "#F1F5F9"
  },
  {
    "id": 44,
    "mbti": "ENTJ",
    "group": "NT",
    "cat": "생산성/목표",
    "name": "OKR 드라이버",
    "kw": "KPI타파, 정렬, 성과주의",
    "desc": "팀 전체의 역량을 가장 중요한 핵심 지표 하나에 일사불란하게 집중시키는 총괄",
    "gear": "전광판 대시보드",
    "icon": "🎯",
    "color": "#1E293B",
    "subColor": "#F1F5F9"
  },
  {
    "id": 45,
    "mbti": "ENTJ",
    "group": "NT",
    "cat": "스피치/영향력",
    "name": "키노트 스피커",
    "kw": "설득, 카리스마, 대중압도",
    "desc": "단 10분의 프레젠테이션으로 수천 명의 청중과 투자자를 매료시키는 웅변가",
    "gear": "무선 핀마이크",
    "icon": "🎙️",
    "color": "#1E293B",
    "subColor": "#F1F5F9"
  },
  {
    "id": 46,
    "mbti": "ENTJ",
    "group": "NT",
    "cat": "커리어/협상",
    "name": "헤비급 딜메이커",
    "kw": "윈윈, 레버리지, 담판",
    "desc": "불리한 조건에서도 카리스마와 전략적 레버리지로 최고의 딜을 성사시키는 협상가",
    "gear": "가죽 브리프케이스",
    "icon": "🤝",
    "color": "#1E293B",
    "subColor": "#F1F5F9"
  },
  {
    "id": 47,
    "mbti": "ENTJ",
    "group": "NT",
    "cat": "스포츠/피트니스",
    "name": "철인 트라이애슬론 챔프",
    "kw": "한계돌파, 강철체력, 규율",
    "desc": "수영, 사이클, 마라톤을 완주하며 자신의 육체와 정신을 완벽히 지배하는 철인",
    "gear": "카본 TT 바이크",
    "icon": "🚴",
    "color": "#1E293B",
    "subColor": "#F1F5F9"
  },
  {
    "id": 48,
    "mbti": "ENTJ",
    "group": "NT",
    "cat": "혁신/미래",
    "name": "우주 항공 테크 기업가",
    "kw": "화성탐사, 재사용로켓, 인류도약",
    "desc": "지구의 한계를 넘어 행성 간 문명을 구축하겠다는 비전을 실현하는 개척자",
    "gear": "로켓 발사 콘솔",
    "icon": "🚀",
    "color": "#1E293B",
    "subColor": "#F1F5F9"
  },
  {
    "id": 49,
    "mbti": "ENTJ",
    "group": "NT",
    "cat": "조직/개혁",
    "name": "턴어라운드 마스터",
    "kw": "체질개선, 비효율제거, 흑자전환",
    "desc": "도산 위기의 조직에 긴급 수술을 감행해 단기간에 흑자로 반등시키는 개혁가",
    "gear": "붉은 결재인",
    "icon": "📑",
    "color": "#1E293B",
    "subColor": "#F1F5F9"
  },
  {
    "id": 50,
    "mbti": "ENTJ",
    "group": "NT",
    "cat": "자기계발/습관",
    "name": "새벽 4시 에그제큐티브",
    "kw": "미라클모닝, 하루선점, 규율",
    "desc": "세상이 잠든 새벽 4시에 하루를 먼저 시작해 모든 핵심 결정을 끝마치는 리더",
    "gear": "새벽 다이어리",
    "icon": "🌅",
    "color": "#1E293B",
    "subColor": "#F1F5F9"
  },
  {
    "id": 51,
    "mbti": "ENTJ",
    "group": "NT",
    "cat": "글로벌/확장",
    "name": "글로벌 익스팬션 디렉터",
    "kw": "해외진출, 시장선점, 법인설립",
    "desc": "전 세계 주요 거점 도시마다 현지 지사를 깃발 꽂듯 확장하는 글로벌 총괄",
    "gear": "세계지도 데스크패드",
    "icon": "🌐",
    "color": "#1E293B",
    "subColor": "#F1F5F9"
  },
  {
    "id": 52,
    "mbti": "ENTJ",
    "group": "NT",
    "cat": "학업/자격",
    "name": "아이비리그 수석 졸업생",
    "kw": "수석합격, 올A+, 철저한준비",
    "desc": "최고의 지성들이 모인 곳에서 압도적인 실력과 규율로 정점에 선 엘리트",
    "gear": "수석 졸업 메달",
    "icon": "🎓",
    "color": "#1E293B",
    "subColor": "#F1F5F9"
  },
  {
    "id": 53,
    "mbti": "ENTJ",
    "group": "NT",
    "cat": "법률/정의",
    "name": "로펌 대표 변호사",
    "kw": "승소율, 전면전, 법리해석",
    "desc": "수천억 대의 기업 소송에서 치밀한 변론으로 승리를 이끌어내는 대표 파트너",
    "gear": "법전과 골든 가벨",
    "icon": "⚖️",
    "color": "#1E293B",
    "subColor": "#F1F5F9"
  },
  {
    "id": 54,
    "mbti": "ENTJ",
    "group": "NT",
    "cat": "문화/프로듀싱",
    "name": "글로벌 미디어 총괄 PD",
    "kw": "블록버스터, 흥행보증, 진두지휘",
    "desc": "수백억 제작비의 프로젝트를 한 치의 오차 없이 일정 내에 완벽 론칭하는 프로듀서",
    "gear": "디렉터 메가폰",
    "icon": "🎬",
    "color": "#1E293B",
    "subColor": "#F1F5F9"
  },
  {
    "id": 55,
    "mbti": "ENTJ",
    "group": "NT",
    "cat": "도시/개발",
    "name": "스마트 시티 플래너",
    "kw": "인프라구축, 미래도시, 친환경에너지",
    "desc": "수십만 명이 살아갈 미래형 자율주행 친환경 도시의 청사진을 지휘하는 총괄",
    "gear": "도시 조감도",
    "icon": "🏙️",
    "color": "#1E293B",
    "subColor": "#F1F5F9"
  },
  {
    "id": 56,
    "mbti": "ENTJ",
    "group": "NT",
    "cat": "스포츠/팀",
    "name": "프로구단 단장",
    "kw": "선수영입, 연봉협상, 우승트레블",
    "desc": "철저한 머니볼 데이터 분석과 통솔력으로 만년 꼴찌팀을 챔피언으로 만드는 단장",
    "gear": "선수단 엔트리 보드",
    "icon": "⚾",
    "color": "#1E293B",
    "subColor": "#F1F5F9"
  },
  {
    "id": 57,
    "mbti": "ENTJ",
    "group": "NT",
    "cat": "웰빙/멘탈",
    "name": "스토아 철학 실천가",
    "kw": "부동심, 통제영역, 역경극복",
    "desc": "어떤 외부 위기나 비난에도 흔들리지 않고 통제 가능한 것에만 전력하는 자",
    "gear": "마르쿠스 명상록",
    "icon": "🏛️",
    "color": "#1E293B",
    "subColor": "#F1F5F9"
  },
  {
    "id": 58,
    "mbti": "ENTJ",
    "group": "NT",
    "cat": "인맥/네트워크",
    "name": "마스터마인드 호스트",
    "kw": "탑티어모임, 시너지, 영향력",
    "desc": "각 분야 최고의 리더들을 한자리에 모아 막강한 협력 생태계를 구축하는 주최자",
    "gear": "라운드테이블 네임택",
    "icon": "🥂",
    "color": "#1E293B",
    "subColor": "#F1F5F9"
  },
  {
    "id": 59,
    "mbti": "ENTJ",
    "group": "NT",
    "cat": "지식/저술",
    "name": "경영 전략서 베스트셀러 저자",
    "kw": "경영원칙, 베스트셀러, 프레임워크",
    "desc": "현장에서 검증된 성공 방정식을 누구나 따를 수 있는 프레임워크로 집대성한 저자",
    "gear": "하드커버 저서",
    "icon": "📕",
    "color": "#1E293B",
    "subColor": "#F1F5F9"
  },
  {
    "id": 60,
    "mbti": "ENTJ",
    "group": "NT",
    "cat": "목표/승리",
    "name": "정복자 빅토리어스",
    "kw": "목표초과달성, 챔피언, 영광",
    "desc": "장애물을 디딤돌 삼아 더 높은 고지로 올라서서 승리의 깃발을 꽂는 절대 리더",
    "gear": "챔피언 깃발",
    "icon": "🚩",
    "color": "#1E293B",
    "subColor": "#F1F5F9"
  },
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
  },
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
  },
  {
    "id": 101,
    "mbti": "INFP",
    "group": "NF",
    "cat": "문학/동화",
    "name": "별빛 동화 작가",
    "kw": "순수성, 환상동화, 몽상",
    "desc": "어른들의 굳은 심장에 잃어버린 유년의 마법과 동심을 되살려주는 이야기꾼",
    "gear": "깃털 잉크펜",
    "icon": "✨",
    "color": "#7C3AED",
    "subColor": "#F3E8FF"
  },
  {
    "id": 102,
    "mbti": "INFP",
    "group": "NF",
    "cat": "음악/인디",
    "name": "새벽 인디 싱어송라이터",
    "kw": "통기타, 솔직한가사, 새벽감성",
    "desc": "방구석에서 나직이 부른 노랫말로 수많은 이들의 새벽 눈물을 닦아주는 뮤지션",
    "gear": "빈티지 어쿠스틱 기타",
    "icon": "🎸",
    "color": "#7C3AED",
    "subColor": "#F3E8FF"
  },
  {
    "id": 103,
    "mbti": "INFP",
    "group": "NF",
    "cat": "예술/일러스트",
    "name": "파스텔 수채화가",
    "kw": "물맛, 따스한색채, 위로일러스트",
    "desc": "물과 물감이 부드럽게 번져나가는 수채화로 세상의 차가움을 녹여내는 일러스트레이터",
    "gear": "다람쥐털 붓과 파레트",
    "icon": "🎨",
    "color": "#7C3AED",
    "subColor": "#F3E8FF"
  },
  {
    "id": 104,
    "mbti": "INFP",
    "group": "NF",
    "cat": "자연/동물",
    "name": "길고양이들의 친구",
    "kw": "길냥이급식, 캣맘, 따스한교감",
    "desc": "골목길 추위에 떠는 작은 생명들의 이름을 일일이 불러주며 온기를 나누는 수호천사",
    "gear": "츄르와 보온 파우치",
    "icon": "🐾",
    "color": "#7C3AED",
    "subColor": "#F3E8FF"
  },
  {
    "id": 105,
    "mbti": "INFP",
    "group": "NF",
    "cat": "문학/시",
    "name": "비 오는 날의 음유시인",
    "kw": "빗소리, 서정시, 감성노트",
    "desc": "창가에 떨어지는 빗방울 하나에도 우주의 슬픔과 아름다움을 발견해 시로 엮는 시인",
    "gear": "가죽 양장 시집",
    "icon": "🌧️",
    "color": "#7C3AED",
    "subColor": "#F3E8FF"
  },
  {
    "id": 106,
    "mbti": "INFP",
    "group": "NF",
    "cat": "취미/필름",
    "name": "아날로그 필름 감성러",
    "kw": "수동카메라, 필름그레인, 순간포착",
    "desc": "디지털의 즉각성 대신 필름 한 롤이 현상되는 기다림의 미학을 사랑하는 포토그래퍼",
    "gear": "빈티지 레인지파인더",
    "icon": "📷",
    "color": "#7C3AED",
    "subColor": "#F3E8FF"
  },
  {
    "id": 107,
    "mbti": "INFP",
    "group": "NF",
    "cat": "식물/자연",
    "name": "작은 숲 테라리움 장인",
    "kw": "이끼, 유리병속자연, 미니어처",
    "desc": "작은 유리병 속에 촉촉한 이끼와 돌을 배치해 자신만의 작은 오아시스를 가꾸는 메이커",
    "gear": "정밀 핀셋과 분무기",
    "icon": "🌿",
    "color": "#7C3AED",
    "subColor": "#F3E8FF"
  },
  {
    "id": 108,
    "mbti": "INFP",
    "group": "NF",
    "cat": "공예/뜨개질",
    "name": "몽실몽실 손뜨개 장인",
    "kw": "털실, 코바늘, 포근한목도리",
    "desc": "한 코 한 코 정성을 엮어 사랑하는 이에게 세상에서 제일 따뜻한 목도리를 선물하는 자",
    "gear": "나무 대바늘 세트",
    "icon": "🧶",
    "color": "#7C3AED",
    "subColor": "#F3E8FF"
  },
  {
    "id": 109,
    "mbti": "INFP",
    "group": "NF",
    "cat": "일상/일기",
    "name": "비밀 다이어리 꾸미기러",
    "kw": "다꾸, 마스킹테이프, 속마음기록",
    "desc": "하루 동안 느낀 미세한 감정의 파동들을 예쁜 스티커와 손글씨로 소중히 간직하는 자",
    "gear": "스티커 바인더와 떡메모지",
    "icon": "📔",
    "color": "#7C3AED",
    "subColor": "#F3E8FF"
  },
  {
    "id": 110,
    "mbti": "INFP",
    "group": "NF",
    "cat": "여행/캠핑",
    "name": "나홀로 숲속 솔로캠퍼",
    "kw": "불멍, 타프, 자연과의물아일체",
    "desc": "인적이 드문 깊은 숲속에서 타오르는 모닥불을 바라보며 영혼을 충전하는 낭만가",
    "gear": "티타늄 화롯대",
    "icon": "⛺",
    "color": "#7C3AED",
    "subColor": "#F3E8FF"
  },
  {
    "id": 111,
    "mbti": "INFP",
    "group": "NF",
    "cat": "서점/책",
    "name": "골목길 독립서점 주인장",
    "kw": "독립출판물, 취향의공간, 심야책방",
    "desc": "자신만의 취향이 담긴 보석 같은 책들을 큐레이션해 마음이 맞는 이들과 나누는 사서",
    "gear": "나무 책도장",
    "icon": "📚",
    "color": "#7C3AED",
    "subColor": "#F3E8FF"
  },
  {
    "id": 112,
    "mbti": "INFP",
    "group": "NF",
    "cat": "음악/LP",
    "name": "레트로 바이닐 수집가",
    "kw": "턴테이블, 잡음의따스함, 재즈LP",
    "desc": "턴테이블 바늘이 긁히는 타닥거리는 소리에서 아날로그적 노스탤지어를 만끽하는 감상가",
    "gear": "LP 클리닝 브러시",
    "icon": "🎵",
    "color": "#7C3AED",
    "subColor": "#F3E8FF"
  },
  {
    "id": 113,
    "mbti": "INFP",
    "group": "NF",
    "cat": "요리/베이킹",
    "name": "동화 속 구움과자 베이커",
    "kw": "마들렌, 바닐라빈, 오븐향기",
    "desc": "오븐에서 풍겨 나오는 달콤한 버터 향기로 이웃의 우울을 날려주는 따뜻한 파티시에",
    "gear": "조개모양 마들렌 틀",
    "icon": "🧁",
    "color": "#7C3AED",
    "subColor": "#F3E8FF"
  },
  {
    "id": 114,
    "mbti": "INFP",
    "group": "NF",
    "cat": "취미/향기",
    "name": "기억을 빚는 조향사",
    "kw": "비온뒤숲향, 향수, 추억소환",
    "desc": "어릴 적 맡았던 여름밤 공기, 낡은 도서관 냄새를 한 병의 향수로 재현해내는 예술가",
    "gear": "향료 드롭퍼와 시향지",
    "icon": "🧴",
    "color": "#7C3AED",
    "subColor": "#F3E8FF"
  },
  {
    "id": 115,
    "mbti": "INFP",
    "group": "NF",
    "cat": "게임/힐링",
    "name": "동물의 숲 섬 꾸미기 장인",
    "kw": "슬로우라이프, 힐링게임, 도트디자인",
    "desc": "경쟁 없는 가상 마을에서 꽃을 심고 강물을 트며 평화로운 유토피아를 가꾸는 게이머",
    "gear": "스위치 파스텔 에디션",
    "icon": "🎮",
    "color": "#7C3AED",
    "subColor": "#F3E8FF"
  },
  {
    "id": 116,
    "mbti": "INFP",
    "group": "NF",
    "cat": "예술/인형",
    "name": "추억 복원 인형 병원장",
    "kw": "애착인형수선, 솜채우기, 동심보호",
    "desc": "수십 년의 세월에 닳고 해진 누군가의 소중한 애착 인형을 새것처럼 살려내는 의사",
    "gear": "곡선 바늘과 솜봉",
    "icon": "🧸",
    "color": "#7C3AED",
    "subColor": "#F3E8FF"
  },
  {
    "id": 117,
    "mbti": "INFP",
    "group": "NF",
    "cat": "자연/하늘",
    "name": "노을 헌터",
    "kw": "매직아워, 분홍빛하늘, 넋놓기",
    "desc": "하루 중 하늘이 가장 화려하게 물드는 20분을 보기 위해 매일 노을 언덕에 오르는 낭만파",
    "gear": "노을 엽서 수첩",
    "icon": "🌇",
    "color": "#7C3AED",
    "subColor": "#F3E8FF"
  },
  {
    "id": 118,
    "mbti": "INFP",
    "group": "NF",
    "cat": "문학/편지",
    "name": "펜팔 손편지 러버",
    "kw": "실링왁스, 만년필필기, 우체통",
    "desc": "지구 반대편 친구에게 만년필로 정성을 꾹꾹 눌러 담고 실링 왁스로 봉인하는 로맨티시스트",
    "gear": "황동 실링 인장",
    "icon": "💌",
    "color": "#7C3AED",
    "subColor": "#F3E8FF"
  },
  {
    "id": 119,
    "mbti": "INFP",
    "group": "NF",
    "cat": "웰빙/힐링",
    "name": "빗소리 ASMR 크리에이터",
    "kw": "자연의소리, 불면증치유, 앰비언트",
    "desc": "숲속 시냇물 소리와 창가 빗소리를 고음질 마이크로 녹음해 불면증을 치유하는 녹음가",
    "gear": "바이노럴 마이크",
    "icon": "🎧",
    "color": "#7C3AED",
    "subColor": "#F3E8FF"
  },
  {
    "id": 120,
    "mbti": "INFP",
    "group": "NF",
    "cat": "목표/진정성",
    "name": "진실한 자아의 수호자",
    "kw": "자기다움, 가면벗기, 고유한빛",
    "desc": "세상이 요구하는 기준에 영혼을 팔지 않고, 가장 나다운 모습으로 피어나는 꽃",
    "gear": "진실의 거울",
    "icon": "🪞",
    "color": "#7C3AED",
    "subColor": "#F3E8FF"
  },
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
  },
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
  },
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
  },
  {
    "id": 181,
    "mbti": "ISFJ",
    "group": "SJ",
    "cat": "돌봄/가정",
    "name": "다정한 수호천사",
    "kw": "무조건적내편, 온기, 정성가득",
    "desc": "지친 하루 끝에 문을 열고 들어오면 언제나 따스한 미소와 밥상으로 반겨주는 가족의 기둥",
    "gear": "포근한 앞치마",
    "icon": "🏠",
    "color": "#059669",
    "subColor": "#D1FAE5"
  },
  {
    "id": 182,
    "mbti": "ISFJ",
    "group": "SJ",
    "cat": "요리/정성",
    "name": "보약 곰탕 끓이는 어머니",
    "kw": "24시간고음, 기름기제거, 진국",
    "desc": "가족의 기력을 북돋기 위해 밤새 핏물을 빼고 뼈를 고아내는 지극한 정성의 요리사",
    "gear": "무쇠 가마솥",
    "icon": "🍲",
    "color": "#059669",
    "subColor": "#D1FAE5"
  },
  {
    "id": 183,
    "mbti": "ISFJ",
    "group": "SJ",
    "cat": "간호/치유",
    "name": "호스피스 나이팅게일",
    "kw": "손잡아주기, 눈맞춤, 통증완화",
    "desc": "고통에 신음하는 환자의 차가운 발을 따뜻한 수건으로 주무르며 곁을 지키는 간호사",
    "gear": "체온계와 보온팩",
    "icon": "🩺",
    "color": "#059669",
    "subColor": "#D1FAE5"
  },
  {
    "id": 184,
    "mbti": "ISFJ",
    "group": "SJ",
    "cat": "원예/식물",
    "name": "마음의 텃밭 가드너",
    "kw": "물주기, 곁순따기, 상추나눔",
    "desc": "아침마다 베란다 화분에 물을 주며 수확한 싱싱한 방울토마토를 이웃에 나누는 식집사",
    "gear": "양철 물뿌리개",
    "icon": "🌱",
    "color": "#059669",
    "subColor": "#D1FAE5"
  },
  {
    "id": 185,
    "mbti": "ISFJ",
    "group": "SJ",
    "cat": "기념일/배려",
    "name": "생일 챙김의 달인",
    "kw": "생일달력, 취향저격선물, 손편지",
    "desc": "주변 지인 100명의 생일과 취향을 캘린더에 적어두고 정성 어린 축하를 건네는 배려왕",
    "gear": "선물 포장 리본 세트",
    "icon": "🎁",
    "color": "#059669",
    "subColor": "#D1FAE5"
  },
  {
    "id": 186,
    "mbti": "ISFJ",
    "group": "SJ",
    "cat": "교육/보육",
    "name": "새싹 유치원 선생님",
    "kw": "우쭈쭈, 눈높이대화, 안전제일",
    "desc": "처음 엄마 품을 떠난 아이들의 눈물을 닦아주고 따스하게 안아주는 보육교사",
    "gear": "삐약이 네임스티커",
    "icon": "🐥",
    "color": "#059669",
    "subColor": "#D1FAE5"
  },
  {
    "id": 187,
    "mbti": "ISFJ",
    "group": "SJ",
    "cat": "반려동물/케어",
    "name": "노견 완벽 요양사",
    "kw": "노령견케어, 휠체어산책, 영양죽",
    "desc": "눈이 멀고 다리가 불편해진 노견을 품에 안고 따스한 햇볕을 쬐어주는 헌신적 반려인",
    "gear": "반려견 보행 보조기",
    "icon": "🐕",
    "color": "#059669",
    "subColor": "#D1FAE5"
  },
  {
    "id": 188,
    "mbti": "ISFJ",
    "group": "SJ",
    "cat": "기록/추억",
    "name": "가족 앨범 아카이비스트",
    "kw": "포토북제작, 성장일기, 추억보존",
    "desc": "수북이 쌓인 아이의 사진들을 연도별로 정리해 세상에 하나뿐인 성장 앨범을 만드는 자",
    "gear": "가죽 포토 앨범",
    "icon": "📷",
    "color": "#059669",
    "subColor": "#D1FAE5"
  },
  {
    "id": 189,
    "mbti": "ISFJ",
    "group": "SJ",
    "cat": "일상/살림",
    "name": "햇살 빨래 건조 마스터",
    "kw": "햇볕소독, 바삭바삭수건, 섬유유연제",
    "desc": "구름 한 점 없는 날 뽀송뽀송하게 말린 호텔식 수건을 반듯하게 개어놓는 살림의 여왕",
    "gear": "대나무 빨래 바구니",
    "icon": "🧺",
    "color": "#059669",
    "subColor": "#D1FAE5"
  },
  {
    "id": 190,
    "mbti": "ISFJ",
    "group": "SJ",
    "cat": "약학/건강",
    "name": "동네 단골 약국 약사님",
    "kw": "복약지도, 영양제조합, 안부묻기",
    "desc": "할머니의 혈압약 복용 시간을 꼼꼼히 체크하고 따뜻한 쌍화탕을 건네는 동네 주치의",
    "gear": "약포지와 가루약 스푼",
    "icon": "💊",
    "color": "#059669",
    "subColor": "#D1FAE5"
  },
  {
    "id": 191,
    "mbti": "ISFJ",
    "group": "SJ",
    "cat": "구호/나눔",
    "name": "연탄 나눔 자원봉사자",
    "kw": "등지게, 이마의땀, 온기배달",
    "desc": "살을 에는 한겨울 달동네 좁은 골목을 오르내리며 어르신 댁에 연탄을 채워 넣는 봉사자",
    "gear": "목장갑과 연탄 집게",
    "icon": "🧱",
    "color": "#059669",
    "subColor": "#D1FAE5"
  },
  {
    "id": 192,
    "mbti": "ISFJ",
    "group": "SJ",
    "cat": "전통/발효",
    "name": "전통 장독대 지킴이",
    "kw": "씨간장, 된장담그기, 숙성의미학",
    "desc": "봄가을로 장독을 마른 수건으로 닦아내며 수십 년 묵은 깊은 장맛을 이어가는 종부",
    "gear": "항아리 옹기 뚜껑",
    "icon": "🏺",
    "color": "#059669",
    "subColor": "#D1FAE5"
  },
  {
    "id": 193,
    "mbti": "ISFJ",
    "group": "SJ",
    "cat": "학교/안전",
    "name": "등굣길 녹색어머니회장",
    "kw": "정지깃발, 스쿨존, 아이들안전",
    "desc": "출근 시간 횡단보도에서 노란 깃발을 펼쳐 들고 아이들의 안전한 통학로를 지키는 파수꾼",
    "gear": "정지 안전 깃발",
    "icon": "🚸",
    "color": "#059669",
    "subColor": "#D1FAE5"
  },
  {
    "id": 194,
    "mbti": "ISFJ",
    "group": "SJ",
    "cat": "환경/정화",
    "name": "동네 골목길 청소 반장",
    "kw": "빗자루질, 담배꽁초줍기, 깨끗한동네",
    "desc": "남들이 버린 담배꽁초와 쓰레기를 새벽마다 묵묵히 쓸어 담아 골목을 밝히는 숨은 의인",
    "gear": "싸리비와 쓰레받기",
    "icon": "🧹",
    "color": "#059669",
    "subColor": "#D1FAE5"
  },
  {
    "id": 195,
    "mbti": "ISFJ",
    "group": "SJ",
    "cat": "문화/전통",
    "name": "명절 차례상 정성 장인",
    "kw": "삼색나물, 동태전, 정성스런제사",
    "desc": "조상님과 일가친척을 위해 이틀 전부터 시장을 보고 정성스레 전을 부치는 미덕의 수호자",
    "gear": "놋그릇 제기 세트",
    "icon": "🍱",
    "color": "#059669",
    "subColor": "#D1FAE5"
  },
  {
    "id": 196,
    "mbti": "ISFJ",
    "group": "SJ",
    "cat": "수예/수선",
    "name": "추억 옷 수선 장인",
    "kw": "덧댐바느질, 가업수선, 새옷처럼",
    "desc": "어머니의 낡은 코트를 딸이 물려 입을 수 있도록 정성스런 손바느질로 고쳐주는 장인",
    "gear": "골무와 바느질함",
    "icon": "🧵",
    "color": "#059669",
    "subColor": "#D1FAE5"
  },
  {
    "id": 197,
    "mbti": "ISFJ",
    "group": "SJ",
    "cat": "우편/배달",
    "name": "마을 집배원 아저씨",
    "kw": "안부확인, 등기전달, 따뜻한인사",
    "desc": "우편물 배달뿐 아니라 홀로 계신 독거노인의 건강까지 챙기며 마을을 누비는 집배원",
    "gear": "빨간 우체부 가방",
    "icon": "📮",
    "color": "#059669",
    "subColor": "#D1FAE5"
  },
  {
    "id": 198,
    "mbti": "ISFJ",
    "group": "SJ",
    "cat": "웰빙/차",
    "name": "생강 대추청 담그는 손길",
    "kw": "감기예방, 꿀절임, 겨울건강",
    "desc": "겨울철 가족들 목감기 걸리지 말라고 생강을 얇게 썰어 꿀에 재워두는 다정한 손길",
    "gear": "유리 저장 밀폐용기",
    "icon": "🫙",
    "color": "#059669",
    "subColor": "#D1FAE5"
  },
  {
    "id": 199,
    "mbti": "ISFJ",
    "group": "SJ",
    "cat": "일상/안전",
    "name": "가스 밸브 잠금 확인관",
    "kw": "외출전더블체크, 전기코드뽑기, 안심",
    "desc": "외출 전 가스 밸브와 창문 잠금을 세 번씩 확인해 가족의 안전을 지키는 꼼꼼이",
    "gear": "안전 점검 체크표",
    "icon": "🔒",
    "color": "#059669",
    "subColor": "#D1FAE5"
  },
  {
    "id": 200,
    "mbti": "ISFJ",
    "group": "SJ",
    "cat": "목표/헌신",
    "name": "침묵의 헌신자 세이프가드",
    "kw": "묵묵한서포트, 든든한방패, 참사랑",
    "desc": "자신의 공을 내세우지 않고 소중한 사람들이 안전하고 행복하게 살아가도록 지키는 방패",
    "gear": "수호의 은빛 방패",
    "icon": "🛡️",
    "color": "#059669",
    "subColor": "#D1FAE5"
  },
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
  },
  {
    "id": 221,
    "mbti": "ESFJ",
    "group": "SJ",
    "cat": "사교/모임",
    "name": "행복 소셜 파티 호스트",
    "kw": "환영인사, 소외자챙기기, 분위기메이커",
    "desc": "모임에 온 모든 사람이 소외되지 않고 즐겁게 웃고 갈 수 있도록 따뜻하게 챙기는 안주인",
    "gear": "웰컴 샴페인 트레이",
    "icon": "🥂",
    "color": "#DB2777",
    "subColor": "#FCE7F3"
  },
  {
    "id": 222,
    "mbti": "ESFJ",
    "group": "SJ",
    "cat": "웨딩/이벤트",
    "name": "기적의 웨딩 플래너",
    "kw": "인생단하루, 완벽한예식, 눈물의축복",
    "desc": "신랑 신부의 가장 빛나는 순간을 위해 드레스부터 부케, 하객 동선까지 세심히 조율하는 연출가",
    "gear": "웨딩 스케줄 바인더",
    "icon": "👰",
    "color": "#DB2777",
    "subColor": "#FCE7F3"
  },
  {
    "id": 223,
    "mbti": "ESFJ",
    "group": "SJ",
    "cat": "서비스/승무원",
    "name": "퍼스트클래스 사무장",
    "kw": "극진한환대, 탑승객케어, 미소",
    "desc": "14시간의 장거리 비행 동안 탑승객의 눈빛만 보고도 필요한 것을 챙겨주는 베테랑 승무원",
    "gear": "스카프와 기내 서비스 패드",
    "icon": "✈️",
    "color": "#DB2777",
    "subColor": "#FCE7F3"
  },
  {
    "id": 224,
    "mbti": "ESFJ",
    "group": "SJ",
    "cat": "외식/접객",
    "name": "동네 최고 맛집 안방마님",
    "kw": "얼굴기억, 듬뿍담은덤, 친근한인사",
    "desc": "손님 500명의 얼굴과 자주 먹는 반찬을 기억해 \"삼촌 또 왔네!\"라며 덤을 얹어주는 마님",
    "gear": "정감 넘치는 뚝배기",
    "icon": "🥘",
    "color": "#DB2777",
    "subColor": "#FCE7F3"
  },
  {
    "id": 225,
    "mbti": "ESFJ",
    "group": "SJ",
    "cat": "뷰티/헤어",
    "name": "마음까지 만지는 헤어 디자이너",
    "kw": "헤어변신, 고민상담, 단골보유1위",
    "desc": "머리를 자르는 동안 손님의 답답한 속마음을 다정하게 들어주며 힐링을 선물하는 미용사",
    "gear": "일제 전문가 가위",
    "icon": "✂️",
    "color": "#DB2777",
    "subColor": "#FCE7F3"
  },
  {
    "id": 226,
    "mbti": "ESFJ",
    "group": "SJ",
    "cat": "조직/HR",
    "name": "팀 화합 워크숍 마스터",
    "kw": "팀빌딩, 갈등봉합, 즐거운회식",
    "desc": "서먹서먹하던 부서 간의 벽을 허물고 팀원들이 서로 얼싸안고 웃게 만드는 사내 분위기 메이커",
    "gear": "팀빌딩 보드게임",
    "icon": "🎲",
    "color": "#DB2777",
    "subColor": "#FCE7F3"
  },
  {
    "id": 227,
    "mbti": "ESFJ",
    "group": "SJ",
    "cat": "학부모/네트워크",
    "name": "학부모회 열혈 총무",
    "kw": "급식모니터링, 알짜정보공유, 바자회",
    "desc": "학교 바자회를 성공적으로 이끌고 엄마들의 유익한 정보 교류 네트워크를 책임지는 총무",
    "gear": "바자회 장부와 계산기",
    "icon": "📋",
    "color": "#DB2777",
    "subColor": "#FCE7F3"
  },
  {
    "id": 228,
    "mbti": "ESFJ",
    "group": "SJ",
    "cat": "웰빙/베이킹",
    "name": "선물용 수제 쿠키 베이커",
    "kw": "정성포장, 이웃나눔, 달콤한선물",
    "desc": "주말마다 정성스레 쿠키를 구워 예쁜 리본으로 포장해 경비 아저씨와 이웃에 돌리는 천사",
    "gear": "선물용 쿠키 박스",
    "icon": "🍪",
    "color": "#DB2777",
    "subColor": "#FCE7F3"
  },
  {
    "id": 229,
    "mbti": "ESFJ",
    "group": "SJ",
    "cat": "부동산/중개",
    "name": "행복한 보금자리 공인중개사",
    "kw": "딱맞는집, 학군상담, 친절한안내",
    "desc": "단순히 집을 파는 게 아니라 신혼부부의 예산과 꿈에 딱 맞는 행복한 보금자리를 찾아주는 중개사",
    "gear": "매물 수첩과 열쇠고리",
    "icon": "🔑",
    "color": "#DB2777",
    "subColor": "#FCE7F3"
  },
  {
    "id": 230,
    "mbti": "ESFJ",
    "group": "SJ",
    "cat": "문화/합창",
    "name": "어머니 합창단 단장",
    "kw": "아름다운화음, 지역위문공연, 우정",
    "desc": "동네 어머님들을 모아 아름다운 합창단을 꾸리고 요양원 위문공연을 다니는 정 넘치는 단장",
    "gear": "합창단 악보철",
    "icon": "🎶",
    "color": "#DB2777",
    "subColor": "#FCE7F3"
  },
  {
    "id": 231,
    "mbti": "ESFJ",
    "group": "SJ",
    "cat": "여행/인솔",
    "name": "효도관광 베테랑 투어가이드",
    "kw": "어르신맞춤, 꿀잼입담, 편안한일정",
    "desc": "어르신들의 무릎 건강과 식성을 세심하게 배려하며 여행 내내 웃음을 선사하는 인기 가이드",
    "gear": "노란 인솔 깃발",
    "icon": "🚩",
    "color": "#DB2777",
    "subColor": "#FCE7F3"
  },
  {
    "id": 232,
    "mbti": "ESFJ",
    "group": "SJ",
    "cat": "의료/치과위생",
    "name": "무통 스케일링 치과위생사",
    "kw": "안아픈치료, 다정한설명, 치과공포극복",
    "desc": "치과가 무서워 벌벌 떠는 환자의 손을 꼭 잡아주고 안 아프게 스케일링해주는 위생사",
    "gear": "덴탈 미러와 프로브",
    "icon": "🦷",
    "color": "#DB2777",
    "subColor": "#FCE7F3"
  },
  {
    "id": 233,
    "mbti": "ESFJ",
    "group": "SJ",
    "cat": "일상/선물",
    "name": "손편지 답례품 큐레이터",
    "kw": "진심의글귀, 센스있는선물, 감동후기",
    "desc": "작은 경조사 하나에도 마음을 울리는 감사의 손편지와 감각적인 답례품을 준비하는 자",
    "gear": "캘리그라피 엽서",
    "icon": "💌",
    "color": "#DB2777",
    "subColor": "#FCE7F3"
  },
  {
    "id": 234,
    "mbti": "ESFJ",
    "group": "SJ",
    "cat": "지역/봉사",
    "name": "사랑의 김장 나눔 총괄",
    "kw": "1000포기김장, 양념버무리기, 이웃사랑",
    "desc": "매년 겨울 부녀회를 이끌고 배추 1,000포기를 절여 독거노인 가정에 김치를 배달하는 대장",
    "gear": "빨간 고무장갑과 앞치마",
    "icon": "🥬",
    "color": "#DB2777",
    "subColor": "#FCE7F3"
  },
  {
    "id": 235,
    "mbti": "ESFJ",
    "group": "SJ",
    "cat": "스포츠/에어로빅",
    "name": "신바람 에어로빅 강사",
    "kw": "신나는트로트, 스트레스타파, 활력충전",
    "desc": "신나는 트로트 리믹스에 맞춰 회원들의 군살과 일상의 시름을 한 방에 털어내는 활력소",
    "gear": "스팽글 댄스복",
    "icon": "💃",
    "color": "#DB2777",
    "subColor": "#FCE7F3"
  },
  {
    "id": 236,
    "mbti": "ESFJ",
    "group": "SJ",
    "cat": "호텔/컨시어지",
    "name": "골든키 컨시어지",
    "kw": "불가능한예약해결, 감동서비스, VIP케어",
    "desc": "예약이 꽉 찬 미슐랭 레스토랑 좌석을 구해 손님의 기념일을 완벽하게 구원해내는 해결사",
    "gear": "교차된 황금 열쇠 뱃지",
    "icon": "🗝️",
    "color": "#DB2777",
    "subColor": "#FCE7F3"
  },
  {
    "id": 237,
    "mbti": "ESFJ",
    "group": "SJ",
    "cat": "반려식물/분양",
    "name": "초록 화분 나눔 천사",
    "kw": "삽목번식, 예쁜화분선물, 식물초보가이드",
    "desc": "집에서 건강하게 키운 몬스테라를 꺾꽂이해 예쁜 토분에 심어 친구들에게 선물하는 나눔러",
    "gear": "미니 원예 가위",
    "icon": "🪴",
    "color": "#DB2777",
    "subColor": "#FCE7F3"
  },
  {
    "id": 238,
    "mbti": "ESFJ",
    "group": "SJ",
    "cat": "전례/축제",
    "name": "교회/성당 청년부 회장",
    "kw": "새신자환영, 성탄축제, 따스한공동체",
    "desc": "처음 찾아온 청년들을 따뜻하게 맞이하고 연말 성탄제를 축제의 장으로 만드는 리더",
    "gear": "청년부 주보와 기타",
    "icon": "⛪",
    "color": "#DB2777",
    "subColor": "#FCE7F3"
  },
  {
    "id": 239,
    "mbti": "ESFJ",
    "group": "SJ",
    "cat": "홈카페/초대",
    "name": "애프터눈 티 파티 안주인",
    "kw": "3단트레이, 스콘과홍차, 정겨운수다",
    "desc": "주말 오후 소중한 친구들을 초대해 갓 구운 스콘과 홍차를 대접하며 다정한 담소를 나누는 자",
    "gear": "영국식 본차이나 티팟",
    "icon": "🫖",
    "color": "#DB2777",
    "subColor": "#FCE7F3"
  },
  {
    "id": 240,
    "mbti": "ESFJ",
    "group": "SJ",
    "cat": "목표/화합",
    "name": "행복 네트워크의 꽃 하모니",
    "kw": "모두의행복, 따스한연결, 사랑의공동체",
    "desc": "사람과 사람 사이를 사랑과 신뢰의 끈으로 엮어 모두가 행복한 울타리를 완성하는 천사",
    "gear": "사랑의 황금 하트",
    "icon": "💖",
    "color": "#DB2777",
    "subColor": "#FCE7F3"
  },
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
  },
  {
    "id": 261,
    "mbti": "ISFP",
    "group": "SP",
    "cat": "미술/회화",
    "name": "캔버스 위의 음유시인",
    "kw": "감성컬러, 나이프터치, 질감표현",
    "desc": "유화 물감을 나이프로 도톰하게 얹으며 그날의 공기와 감정의 텍스처를 화폭에 담는 화가",
    "gear": "페인팅 나이프와 유화 물감",
    "icon": "🎨",
    "color": "#16A34A",
    "subColor": "#DCFCE7"
  },
  {
    "id": 262,
    "mbti": "ISFP",
    "group": "SP",
    "cat": "도예/공예",
    "name": "달빛 물레 도예가",
    "kw": "백자토, 회전물레, 비대칭의미",
    "desc": "물레 위에서 돌아가는 흙의 부드러운 감촉을 느끼며 세상에 단 하나뿐인 그릇을 빚는 장인",
    "gear": "나무 조각도와 전라도 점토",
    "icon": "🏺",
    "color": "#16A34A",
    "subColor": "#DCFCE7"
  },
  {
    "id": 263,
    "mbti": "ISFP",
    "group": "SP",
    "cat": "플라워/자연",
    "name": "프렌치 내추럴 플로리스트",
    "kw": "들꽃느낌, 비정형부케, 자연미",
    "desc": "인위적인 정형미 대신 바람에 흔들리는 야생화의 자연스러운 생명력을 엮어내는 플로리스트",
    "gear": "원예 전지가위와 노끈",
    "icon": "💐",
    "color": "#16A34A",
    "subColor": "#DCFCE7"
  },
  {
    "id": 264,
    "mbti": "ISFP",
    "group": "SP",
    "cat": "사진/감성",
    "name": "자연광 일상 포토그래퍼",
    "kw": "빛과그림자, 골든아워, 찰나의감성",
    "desc": "오후 4시 방안 깊숙이 들어오는 햇살과 먼지의 반짝임을 놓치지 않고 셔터를 누르는 자",
    "gear": "미러리스 카메라와 단렌즈",
    "icon": "📸",
    "color": "#16A34A",
    "subColor": "#DCFCE7"
  },
  {
    "id": 265,
    "mbti": "ISFP",
    "group": "SP",
    "cat": "음악/연주",
    "name": "달콤한 어쿠스틱 핑거스타일러",
    "kw": "멜로디와퍼커시브, 코토리베이지, 통기타",
    "desc": "기타 줄을 손가락 끝으로 퉁기며 바람처럼 흩날리는 감미로운 멜로디를 들려주는 연주자",
    "gear": "올솔리드 어쿠스틱 기타",
    "icon": "🎶",
    "color": "#16A34A",
    "subColor": "#DCFCE7"
  },
  {
    "id": 266,
    "mbti": "ISFP",
    "group": "SP",
    "cat": "패션/빈티지",
    "name": "빈티지 아메카지 큐레이터",
    "kw": "워싱데님, 에이징가죽, 자연스러운멋",
    "desc": "세월이 흐를수록 멋이 배어나는 낡은 데님과 부츠를 사랑하며 자신만의 무드를 뽐내는 자",
    "gear": "셀비지 데님과 레드윙 부츠",
    "icon": "👖",
    "color": "#16A34A",
    "subColor": "#DCFCE7"
  },
  {
    "id": 267,
    "mbti": "ISFP",
    "group": "SP",
    "cat": "식물/인테리어",
    "name": "감성 플랜테리어 디자이너",
    "kw": "토분, 희귀식물, 초록휴식처",
    "desc": "방 안 곳곳에 공기정화 식물과 빈티지 가구를 조화롭게 배치해 도심 속 오아시스를 꾸미는 자",
    "gear": "이태리 토분과 흙삽",
    "icon": "🪴",
    "color": "#16A34A",
    "subColor": "#DCFCE7"
  },
  {
    "id": 268,
    "mbti": "ISFP",
    "group": "SP",
    "cat": "음식/플레이팅",
    "name": "감성 브런치 플레이터",
    "kw": "아보카도오픈토스트, 우드트레이, 식용꽃",
    "desc": "접시 하나를 하얀 도화지 삼아 알록달록한 과일과 식용 꽃으로 예술적인 한 접시를 차려내는 자",
    "gear": "올리브나무 도마",
    "icon": "🥑",
    "color": "#16A34A",
    "subColor": "#DCFCE7"
  },
  {
    "id": 269,
    "mbti": "ISFP",
    "group": "SP",
    "cat": "문구/캘리",
    "name": "감성 캘리그라피 작가",
    "kw": "먹물향기, 붓글씨, 마음을울리는한마디",
    "desc": "화선지 위에 먹물의 농담을 조절하며 뭉클한 시 한 구절을 아름다운 글씨로 써 내려가는 자",
    "gear": "세필 붓과 벼루",
    "icon": "🖌️",
    "color": "#16A34A",
    "subColor": "#DCFCE7"
  },
  {
    "id": 270,
    "mbti": "ISFP",
    "group": "SP",
    "cat": "취미/향기",
    "name": "소이 캔들 오브제 아티스트",
    "kw": "천연왁스, 우드윅, 타닥거리는소리",
    "desc": "조개껍데기, 숲의 모양을 본뜬 천연 캔들을 만들고 타닥타닥 타는 소리에 마음을 녹이는 자",
    "gear": "온도계와 캔들 몰드",
    "icon": "🕯️",
    "color": "#16A34A",
    "subColor": "#DCFCE7"
  },
  {
    "id": 271,
    "mbti": "ISFP",
    "group": "SP",
    "cat": "반려동물/순수",
    "name": "나비 쫓는 고양이 집사",
    "kw": "츄르먹방, 그르렁소리, 평화로운오후",
    "desc": "햇볕 드는 마루에 고양이와 함께 누워 골골송을 들으며 낮잠을 자는 평화로운 영혼",
    "gear": "양모 펠트 캣닢볼",
    "icon": "🐈",
    "color": "#16A34A",
    "subColor": "#DCFCE7"
  },
  {
    "id": 272,
    "mbti": "ISFP",
    "group": "SP",
    "cat": "여행/제주",
    "name": "제주 돌담길 올레 트레커",
    "kw": "바다바람, 돌담, 유채꽃길",
    "desc": "서두르지 않고 발길 닿는 대로 제주 해안 도로를 걸으며 파도 소리를 감상하는 뚜벅이",
    "gear": "밀짚모자와 린넨 셔츠",
    "icon": "🏝️",
    "color": "#16A34A",
    "subColor": "#DCFCE7"
  },
  {
    "id": 273,
    "mbti": "ISFP",
    "group": "SP",
    "cat": "뷰티/메이크업",
    "name": "수채화 톤온톤 메이크업 아티스트",
    "kw": "투명메이크업, 과즙볼터치, 본연의아름다움",
    "desc": "인위적인 성형 메이크업 대신 그 사람 본연의 맑은 혈색과 매력을 물들이듯 살려내는 아티스트",
    "gear": "천연모 브러시 세트",
    "icon": "💄",
    "color": "#16A34A",
    "subColor": "#DCFCE7"
  },
  {
    "id": 274,
    "mbti": "ISFP",
    "group": "SP",
    "cat": "스포츠/서핑",
    "name": "선셋 글라이딩 롱보드 서퍼",
    "kw": "노을서핑, 파도글라이딩, 물과의일체",
    "desc": "파도를 정복하려 하지 않고 그저 노을빛 바다 위에 떠서 잔잔한 물결에 몸을 맡기는 서퍼",
    "gear": "클래식 롱보드와 리쉬코드",
    "icon": "🏄",
    "color": "#16A34A",
    "subColor": "#DCFCE7"
  },
  {
    "id": 275,
    "mbti": "ISFP",
    "group": "SP",
    "cat": "음악/LP",
    "name": "로파이(Lo-fi) 비트메이커",
    "kw": "칠홉, 노이즈사운드, 비오는거리비트",
    "desc": "비 오는 창밖 풍경을 보며 나른하고 편안한 로파이 비트를 만들어 리스너를 쉬게 하는 자",
    "gear": "SP-404 샘플러",
    "icon": "🎧",
    "color": "#16A34A",
    "subColor": "#DCFCE7"
  },
  {
    "id": 276,
    "mbti": "ISFP",
    "group": "SP",
    "cat": "공예/자수",
    "name": "한 땀 프랑스 자수 장인",
    "kw": "야생화자수, 리넨파우치, 고요한손놀림",
    "desc": "무지 천 위에 고운 실로 들꽃 한 송이를 수놓으며 마음의 번뇌를 털어내는 자수 작가",
    "gear": "원형 자수틀과 자수실",
    "icon": "🪡",
    "color": "#16A34A",
    "subColor": "#DCFCE7"
  },
  {
    "id": 277,
    "mbti": "ISFP",
    "group": "SP",
    "cat": "일상/힐링",
    "name": "비 오는 날 카페 창가 지킴이",
    "kw": "빗방울멍때리기, 따뜻한라떼, 재즈음악",
    "desc": "창밖으로 흘러내리는 빗방울을 하염없이 바라보며 따뜻한 플랫화이트를 홀짝이는 낭만파",
    "gear": "도자기 머그잔",
    "icon": "☕",
    "color": "#16A34A",
    "subColor": "#DCFCE7"
  },
  {
    "id": 278,
    "mbti": "ISFP",
    "group": "SP",
    "cat": "문학/동시",
    "name": "순수 영혼의 동시 작가",
    "kw": "풀잎의말, 아이의시선, 맑은동심",
    "desc": "세상의 때가 묻지 않은 맑은 눈으로 개미의 걸음걸이, 민들레 홀씨를 동시로 짓는 작가",
    "gear": "손바닥 시 수첩",
    "icon": "🌼",
    "color": "#16A34A",
    "subColor": "#DCFCE7"
  },
  {
    "id": 279,
    "mbti": "ISFP",
    "group": "SP",
    "cat": "자연/바다",
    "name": "조개껍데기 비치코머",
    "kw": "바다의선물, 씨글라스, 바다보석",
    "desc": "파도에 밀려온 바다 유리와 예쁜 조약돌을 주워 세상에 하나뿐인 모빌을 만드는 바다의 아이",
    "gear": "라탄 비치 백",
    "icon": "🐚",
    "color": "#16A34A",
    "subColor": "#DCFCE7"
  },
  {
    "id": 280,
    "mbti": "ISFP",
    "group": "SP",
    "cat": "목표/미학",
    "name": "순수 미학의 자유인",
    "kw": "아름다움의수호, 순수성, 지금이순간",
    "desc": "세상의 평가와 잣대를 넘어 지금 이 순간 눈앞의 아름다움을 온몸으로 느끼고 노래하는 영혼",
    "gear": "무지개빛 프리즘",
    "icon": "🌈",
    "color": "#16A34A",
    "subColor": "#DCFCE7"
  },
  {
    "id": 281,
    "mbti": "ESTP",
    "group": "SP",
    "cat": "비즈니스/영업",
    "name": "전설의 톱 세일즈맨",
    "kw": "승부사, 딜클로징, 동물적감각",
    "desc": "고객의 표정 하나로 심리를 간파해 거절할 수 없는 제안으로 100억 계약을 따내는 영업의 신",
    "gear": "골드 롤렉스 시계",
    "icon": "🤝",
    "color": "#DC2626",
    "subColor": "#FEE2E2"
  },
  {
    "id": 282,
    "mbti": "ESTP",
    "group": "SP",
    "cat": "스포츠/모터",
    "name": "슈퍼바이크 트랙 라이더",
    "kw": "코너링각도60도, 니슬라이더, 300km/h",
    "desc": "무릎이 아스팔트에 닿을 듯 바이크를 눕히며 서킷의 한계 속도에 도전하는 스피드광",
    "gear": "카본 헬멧과 레이싱 수트",
    "icon": "🏍️",
    "color": "#DC2626",
    "subColor": "#FEE2E2"
  },
  {
    "id": 283,
    "mbti": "ESTP",
    "group": "SP",
    "cat": "투자/단타",
    "name": "초단타 스캘핑 트레이더",
    "kw": "호가창매매, 동물적감각, 즉시익절",
    "desc": "1초에 수십 번 깜빡이는 호가창의 수급을 읽고 번개처럼 매수 매도를 찍어내는 승부사",
    "gear": "게이밍 반응속도 마우스",
    "icon": "📈",
    "color": "#DC2626",
    "subColor": "#FEE2E2"
  },
  {
    "id": 284,
    "mbti": "ESTP",
    "group": "SP",
    "cat": "스포츠/격투",
    "name": "UFC 케이지 파이터",
    "kw": "난타전, 카운터펀치, 화끈한KO",
    "desc": "상대의 펀치를 두려워하지 않고 전진해 턱에 정확한 카운터를 꽂아 넣는 화끈한 파이터",
    "gear": "4온스 오픈핑거 글러브",
    "icon": "🥊",
    "color": "#DC2626",
    "subColor": "#FEE2E2"
  },
  {
    "id": 285,
    "mbti": "ESTP",
    "group": "SP",
    "cat": "아웃도어/익스트림",
    "name": "윙슈트 베이스 점퍼",
    "kw": "절벽다이빙, 시속200km활강, 아드레날린",
    "desc": "깎아지른 알프스 절벽에서 뛰어내려 계곡 사이를 날다람쥐처럼 활강하는 강심장",
    "gear": "윙슈트와 낙하산 팩",
    "icon": "🪂",
    "color": "#DC2626",
    "subColor": "#FEE2E2"
  },
  {
    "id": 286,
    "mbti": "ESTP",
    "group": "SP",
    "cat": "비즈니스/스타트업",
    "name": "위기돌파 기회포착가",
    "kw": "즉각실행, 위기는기회, 행동우선",
    "desc": "남들이 고민하고 분석할 때 먼저 현장으로 뛰어나가 시장의 빈틈을 독식하는 행동대장",
    "gear": "스마트폰 3대",
    "icon": "🚀",
    "color": "#DC2626",
    "subColor": "#FEE2E2"
  },
  {
    "id": 287,
    "mbti": "ESTP",
    "group": "SP",
    "cat": "엔터/DJ",
    "name": "클럽 메인 스테이지 DJ",
    "kw": "비트드랍, 관객열광, 떼창유도",
    "desc": "베이스가 터지는 순간 수천 명의 관중을 일제히 점프하게 만드는 클럽의 지휘자",
    "gear": "헤드폰과 DJ 컨트롤러",
    "icon": "🎧",
    "color": "#DC2626",
    "subColor": "#FEE2E2"
  },
  {
    "id": 288,
    "mbti": "ESTP",
    "group": "SP",
    "cat": "스포츠/서핑",
    "name": "빅웨이브 서퍼",
    "kw": "10미터파도, 나자레, 배럴통과",
    "desc": "집채만 한 거대 파도의 터널 속으로 뛰어들어 생사의 경계를 타는 서핑의 제왕",
    "gear": "건 서프보드",
    "icon": "🏄",
    "color": "#DC2626",
    "subColor": "#FEE2E2"
  },
  {
    "id": 289,
    "mbti": "ESTP",
    "group": "SP",
    "cat": "구조/소방",
    "name": "특수재난 구조대장",
    "kw": "화염진입, 인명구조, 솔선수범",
    "desc": "모두가 탈출하는 불길과 붕괴 건물 속으로 가장 먼저 돌진해 생명을 구해내는 영웅",
    "gear": "산소마스크와 소방도끼",
    "icon": "🚒",
    "color": "#DC2626",
    "subColor": "#FEE2E2"
  },
  {
    "id": 290,
    "mbti": "ESTP",
    "group": "SP",
    "cat": "패션/스트리트",
    "name": "한정판 스니커즈 리셀러",
    "kw": "오픈런, 드로우당첨, 슈프림",
    "desc": "전 세계 한정판 신발 드로우 정보를 꿰고 줄을 서서 희귀 아이템을 싹쓸이하는 트렌드세터",
    "gear": "한정판 조던 스니커즈",
    "icon": "👟",
    "color": "#DC2626",
    "subColor": "#FEE2E2"
  },
  {
    "id": 291,
    "mbti": "ESTP",
    "group": "SP",
    "cat": "요리/불쇼",
    "name": "철판 테판야키 마스터",
    "kw": "불꽃쇼, 칼돌리기, 화려한퍼포먼스",
    "desc": "눈앞에서 거대한 불기둥을 쏘아 올리고 나이프를 저글링하며 오감을 만족시키는 셰프",
    "gear": "전문가용 스패출러와 토치",
    "icon": "🔥",
    "color": "#DC2626",
    "subColor": "#FEE2E2"
  },
  {
    "id": 292,
    "mbti": "ESTP",
    "group": "SP",
    "cat": "스포츠/축구",
    "name": "치명적인 폭격기 스트라이커",
    "kw": "스피드돌파, 무회전슛, 골세레머니",
    "desc": "수비 뒷공간을 폭발적인 스피드로 허물고 골문 구석을 찢는 통쾌한 골잡이",
    "gear": "형광 축구화",
    "icon": "⚽",
    "color": "#DC2626",
    "subColor": "#FEE2E2"
  },
  {
    "id": 293,
    "mbti": "ESTP",
    "group": "SP",
    "cat": "모험/오프로드",
    "name": "사막 랠리 오프로더",
    "kw": "모래언덕질주, 4륜구동, 다카르랠리",
    "desc": "길이 없는 거친 사막과 진흙탕을 거침없이 헤쳐 나가는 4륜 록크롤러 레이서",
    "gear": "오프로드 윈치와 스노클",
    "icon": "🚙",
    "color": "#DC2626",
    "subColor": "#FEE2E2"
  },
  {
    "id": 294,
    "mbti": "ESTP",
    "group": "SP",
    "cat": "파티/바텐더",
    "name": "플레어 바텐딩 챔피언",
    "kw": "보틀저글링, 불쇼칵테일, 파티의왕",
    "desc": "칵테일 보틀 세 개를 공중에 띄우며 화려한 묘기로 손님들의 환호를 이끌어내는 바텐더",
    "gear": "스테인리스 셰이커 세트",
    "icon": "🍸",
    "color": "#DC2626",
    "subColor": "#FEE2E2"
  },
  {
    "id": 295,
    "mbti": "ESTP",
    "group": "SP",
    "cat": "스포츠/스노보드",
    "name": "하프파이프 백플립 보더",
    "kw": "체공시간, 더블콕1080, 설원의지배자",
    "desc": "파이프 벽을 차고 공중으로 6미터를 솟구쳐 회전 트릭을 내리꽂는 스노보더",
    "gear": "카본 스노보드 데크",
    "icon": "🏂",
    "color": "#DC2626",
    "subColor": "#FEE2E2"
  },
  {
    "id": 296,
    "mbti": "ESTP",
    "group": "SP",
    "cat": "경매/옥션",
    "name": "초특급 미술품 경매사",
    "kw": "카운트다운, 호가경쟁, 낙찰봉쾅",
    "desc": "긴장감이 감도는 경매장에서 특유의 위트와 완급 조절로 신고가 낙찰을 이끌어내는 경매사",
    "gear": "아이보리 경매 망치",
    "icon": "🔨",
    "color": "#DC2626",
    "subColor": "#FEE2E2"
  },
  {
    "id": 297,
    "mbti": "ESTP",
    "group": "SP",
    "cat": "여행/카지노",
    "name": "베가스 포커 토너먼트 챔프",
    "kw": "블러핑, 올인, 포커페이스간파",
    "desc": "마지막 승부처에서 상대의 떨리는 눈빛을 읽고 과감하게 올인을 외쳐 팟을 쓸어 담는 승부사",
    "gear": "세라믹 카지노 칩",
    "icon": "🃏",
    "color": "#DC2626",
    "subColor": "#FEE2E2"
  },
  {
    "id": 298,
    "mbti": "ESTP",
    "group": "SP",
    "cat": "스포츠/암벽",
    "name": "스피드 클라이밍 스프린터",
    "kw": "수직스프린트, 5초대주파, 폭발력",
    "desc": "15미터 95도 경사벽을 원숭이처럼 튀어 올라 5초 만에 상단 터치패드를 찍는 스프린터",
    "gear": "스피드 전용 암벽화",
    "icon": "🧗",
    "color": "#DC2626",
    "subColor": "#FEE2E2"
  },
  {
    "id": 299,
    "mbti": "ESTP",
    "group": "SP",
    "cat": "비즈니스/협상",
    "name": "현장 담판 에이전트",
    "kw": "배짱, 기싸움승리, 즉석합의",
    "desc": "질질 끄는 탁상공론을 끝내고 상대 수장을 현장에서 직접 만나 담판을 짓는 해결사",
    "gear": "가죽 라이더 재킷",
    "icon": "🕶️",
    "color": "#DC2626",
    "subColor": "#FEE2E2"
  },
  {
    "id": 300,
    "mbti": "ESTP",
    "group": "SP",
    "cat": "목표/승부",
    "name": "거침없는 돌격대장 블리츠",
    "kw": "무패신화, 망설임제로, 승리의짜릿함",
    "desc": "백 마디 말보다 한 번의 승리로 증명하는, 멈추지 않는 아드레날린의 화신",
    "gear": "승리의 황금 트로피",
    "icon": "🏆",
    "color": "#DC2626",
    "subColor": "#FEE2E2"
  },
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

  // MBTI 그룹 및 테마 조회 헬퍼
  function getAllThemes() {
    return BODY_THEMES_320;
  }

  function getThemesByMbti(mbti) {
    if (!mbti) return BODY_THEMES_320;
    var target = String(mbti).toUpperCase().trim();
    return BODY_THEMES_320.filter(function (t) { return t.mbti === target; });
  }

  function getThemesByGroup(group) {
    if (!group) return BODY_THEMES_320;
    var target = String(group).toUpperCase().trim();
    return BODY_THEMES_320.filter(function (t) { return t.group === target; });
  }

  function searchThemes(query) {
    if (!query) return BODY_THEMES_320;
    var q = String(query).toLowerCase().trim();
    return BODY_THEMES_320.filter(function (t) {
      return (t.name && t.name.toLowerCase().indexOf(q) !== -1) ||
             (t.kw && t.kw.toLowerCase().indexOf(q) !== -1) ||
             (t.cat && t.cat.toLowerCase().indexOf(q) !== -1) ||
             (t.mbti && t.mbti.toLowerCase().indexOf(q) !== -1) ||
             (t.gear && t.gear.toLowerCase().indexOf(q) !== -1);
    });
  }


  // ================= 1~10단계 초록 로봇 SVG 생성기 =================
  function getRobotAvatarSvg(level, size) {
    var lv = Math.max(1, Math.min(10, parseInt(level, 10) || 1));
    var s = size || 36;
    var primaryColor = '#10B981';
    var eyeColor = lv >= 7 ? '#F59E0B' : '#FFFFFF';
    var hasAntenna = lv >= 2;
    var hasEarMuffs = lv >= 4;
    var hasChestBadge = lv >= 6;
    var hasWings = lv >= 8;
    var isMaster = lv >= 10;

    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="50" cy="50" r="48" fill="#ECFDF5" stroke="' + primaryColor + '" stroke-width="3"/>' +
      (hasWings ? '<path d="M12 42 C4 30, 2 56, 16 64 Z M88 42 C96 30, 98 56, 84 64 Z" fill="' + (isMaster ? '#F59E0B' : '#A7F3D0') + '" opacity="0.9"/>' : '') +
      (hasAntenna ? '<line x1="50" y1="22" x2="50" y2="10" stroke="' + (isMaster ? '#F59E0B' : primaryColor) + '" stroke-width="4" stroke-linecap="round"/><circle cx="50" cy="8" r="4" fill="' + (isMaster ? '#EF4444' : '#F59E0B') + '"/>' : '') +
      '<rect x="26" y="22" width="48" height="38" rx="14" fill="' + primaryColor + '" stroke="#047857" stroke-width="2.5"/>' +
      (hasEarMuffs ? '<rect x="20" y="32" width="7" height="18" rx="3.5" fill="#047857"/><rect x="73" y="32" width="7" height="18" rx="3.5" fill="#047857"/>' : '') +
      '<circle cx="40" cy="38" r="6" fill="' + eyeColor + '"/>' +
      '<circle cx="60" cy="38" r="6" fill="' + eyeColor + '"/>' +
      '<circle cx="42" cy="36" r="2" fill="#047857"/>' +
      '<circle cx="62" cy="36" r="2" fill="#047857"/>' +
      '<path d="M42 50 Q50 56 58 50" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" fill="none"/>' +
      '<rect x="34" y="62" width="32" height="26" rx="8" fill="' + primaryColor + '" stroke="#047857" stroke-width="2"/>' +
      (hasChestBadge ? '<circle cx="50" cy="74" r="6" fill="' + (isMaster ? '#F59E0B' : '#FFFFFF') + '"/>' +
       '<text x="50" y="77" text-anchor="middle" font-size="7" font-weight="900" fill="#047857">' + lv + '</text>' :
       '<rect x="42" y="68" width="16" height="4" rx="2" fill="#A7F3D0"/>') +
      '<line x1="28" y1="68" x2="34" y2="76" stroke="' + primaryColor + '" stroke-width="5" stroke-linecap="round"/>' +
      '<line x1="72" y1="68" x2="66" y2="76" stroke="' + primaryColor + '" stroke-width="5" stroke-linecap="round"/>' +
      '<rect x="38" y="88" width="8" height="8" rx="3" fill="#047857"/>' +
      '<rect x="54" y="88" width="8" height="8" rx="3" fill="#047857"/>' +
    '</svg>';
  }

  // ================= 나무망치 아바타 제작 애니메이션 SVG =================
  function getWoodHammerMakerAnimationHtml(nickname) {
    var nick = nickname || '회원';
    return '<div class="avatar-maker-box" style="text-align:center;padding:24px 16px;">' +
      '<style>' +
        '@keyframes hammerStrike {' +
          '0% { transform: rotate(-25deg); }' +
          '40% { transform: rotate(38deg); }' +
          '60% { transform: rotate(32deg); }' +
          '100% { transform: rotate(-25deg); }' +
        '}' +
        '@keyframes sparkGlow {' +
          '0%, 100% { opacity: 0; transform: scale(0.6); }' +
          '40% { opacity: 1; transform: scale(1.3); }' +
          '60% { opacity: 0.6; transform: scale(1); }' +
        '}' +
        '@keyframes robotBob {' +
          '0%, 100% { transform: translateY(0); }' +
          '50% { transform: translateY(-3px); }' +
        '}' +
      '</style>' +
      '<div style="width:140px;height:120px;margin:0 auto;position:relative;">' +
        '<svg width="140" height="120" viewBox="0 0 140 120" fill="none" xmlns="http://www.w3.org/2000/svg">' +
          // 작업대
          '<rect x="15" y="84" width="110" height="14" rx="4" fill="#78350F" stroke="#451A03" stroke-width="2"/>' +
          '<rect x="25" y="98" width="10" height="18" fill="#5A240A"/>' +
          '<rect x="105" y="98" width="10" height="18" fill="#5A240A"/>' +
          // 조립 중인 3등신 인형 실루엣
          '<rect x="58" y="70" width="24" height="14" rx="5" fill="#E2E8F0" stroke="#94A3B8"/>' +
          '<circle cx="70" cy="58" r="12" fill="#FEF08A" stroke="#EAB308"/>' +
          // 스파크 파티클
          '<g style="transform-origin:70px 76px;animation:sparkGlow 0.8s ease-in-out infinite;">' +
            '<circle cx="70" cy="74" r="5" fill="#F59E0B"/>' +
            '<path d="M70 65 L72 73 L80 75 L72 77 L70 85 L68 77 L60 75 L68 73 Z" fill="#FBBF24"/>' +
          '</g>' +
          // 초록 로봇 마스코트
          '<g style="animation:robotBob 0.8s ease-in-out infinite;">' +
            '<rect x="22" y="34" width="30" height="24" rx="8" fill="#10B981" stroke="#047857" stroke-width="2"/>' +
            '<circle cx="31" cy="44" r="3.5" fill="#FFFFFF"/>' +
            '<circle cx="43" cy="44" r="3.5" fill="#FFFFFF"/>' +
            '<circle cx="32" cy="43" r="1.5" fill="#047857"/>' +
            '<circle cx="44" cy="43" r="1.5" fill="#047857"/>' +
            '<path d="M33 51 Q37 54 41 51" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" fill="none"/>' +
            '<rect x="27" y="58" width="20" height="18" rx="5" fill="#10B981" stroke="#047857" stroke-width="1.5"/>' +
            '<line x1="23" y1="62" x2="27" y2="68" stroke="#10B981" stroke-width="3" stroke-linecap="round"/>' +
          '</g>' +
          // 나무망치를 쥔 오른팔 (타격 애니메이션)
          '<g style="transform-origin:46px 60px;animation:hammerStrike 0.8s ease-in-out infinite;">' +
            '<line x1="46" y1="60" x2="65" y2="52" stroke="#10B981" stroke-width="4" stroke-linecap="round"/>' +
            // 나무망치 자루
            '<line x1="62" y1="46" x2="74" y2="66" stroke="#92400E" stroke-width="4" stroke-linecap="round"/>' +
            // 나무망치 머리 (Wood Block)
            '<rect x="58" y="40" width="22" height="12" rx="3" fill="#B45309" stroke="#78350F" stroke-width="1.5" transform="rotate(30 58 40)"/>' +
          '</g>' +
        '</svg>' +
      '</div>' +
      '<div style="font-weight:800;font-size:1.0625rem;color:var(--ink);margin-top:10px;">' +
        nick + '님을 형상화한 아바타를 만들고 있어요 🔨✨' +
      '</div>' +
      '<div style="font-size:0.8125rem;color:var(--ink-soft);margin-top:4px;">' +
        'Gemini AI가 사진 속 특징과 설정하신 기간의 목표·팀·기록을 함께 분석해 나만의 MBTI·좌우명 아바타로 제작 중입니다…' +
      '</div>' +
      '<div style="width:160px;height:6px;background:var(--surface-3);border-radius:3px;margin:14px auto 0;overflow:hidden;">' +
        '<div id="avatarGenProgress" style="width:20%;height:100%;background:var(--emerald);transition:width 0.3s ease;"></div>' +
      '</div>' +
    '</div>';
  }

  // ================= 5단계 샌드위치 무봉제 만화형 아바타 캔버스 엔진 =================
  function composite3DeformedAvatar(userImg, theme, callback, options) {
    var size = 160;
    var cvs = typeof document !== 'undefined' ? document.createElement('canvas') : null;
    if (!cvs) {
      if (callback) callback('');
      return '';
    }

    cvs.width = size;
    cvs.height = size;
    var ctx = cvs.getContext('2d');
    var opts = options || {};
    var features = opts.features || getSmartFallbackFeatures();

    var skin = features.skinColor || '#FFDFBF';
    var hair = (features.hair && features.hair.color) || '#1E293B';
    var hairStyle = (features.hair && features.hair.style) || 'dandy';
    var hairParting = (features.hair && features.hair.parting) || 'none';
    var hairLength = (features.hair && features.hair.length) || 'short';
    var hasGlasses = !!features.hasGlasses;
    var glassesShape = features.glassesShape || 'none';
    var glassesColor = features.glassesColor || '#1E293B';
    var eyeType = (features.eyes && features.eyes.type) || 'round_bright';
    var strokeColor = '#1E293B';

    var cx = 80;
    var cy = 50;
    var r = 36;

    // ----------------------------------------------------
    // [Z-0] 둥근 배경 (테마별 파스텔 톤 & 테두리)
    // ----------------------------------------------------
    ctx.fillStyle = theme.subColor || '#F1F5F9';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = theme.color || '#10B981';
    ctx.lineWidth = 3;
    ctx.stroke();

    // ----------------------------------------------------
    // [Z-1] 뒷머리 레이어 (Back Hair) — 긴머리/단발이 어깨 뒤로 자연스럽게 깔림
    // ----------------------------------------------------
    if (hairLength === 'long' || hairStyle === 'bob' || hairStyle === 'wave' || hairStyle === 'curly' || hairStyle === 'ponytail') {
      ctx.fillStyle = hair;
      ctx.beginPath();
      if (hairStyle === 'ponytail') {
        ctx.arc(cx + r + 2, cy - 6, 12, 0, Math.PI * 2);
        ctx.fill();
        // 머리끈
        ctx.fillStyle = theme.color || '#10B981';
        ctx.beginPath();
        ctx.arc(cx + r - 2, cy - 2, 4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.arc(cx, cy + 8, r + 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ----------------------------------------------------
    // [Z-2] 77종 바디 레이어 (다리, 신발, 몸통, 양팔, 손, 가슴 뱃지)
    // ----------------------------------------------------
    // 짧고 귀여운 3등신 다리
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(58, 126, 18, 22, 6) : ctx.rect(58, 126, 18, 22);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(84, 126, 18, 22, 6) : ctx.rect(84, 126, 18, 22);
    ctx.fill();

    // 신발
    ctx.fillStyle = theme.color || '#10B981';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(54, 140, 24, 12, [4, 8, 4, 4]) : ctx.rect(54, 140, 24, 12);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(82, 140, 24, 12, [8, 4, 4, 4]) : ctx.rect(82, 140, 24, 12);
    ctx.fill();

    // 몸통 (의상 컬러)
    ctx.fillStyle = theme.color || '#10B981';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(50, 88, 60, 42, 12) : ctx.rect(50, 88, 60, 42);
    ctx.fill();

    // 양팔
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(34, 92, 18, 30, 8) : ctx.rect(34, 92, 18, 30);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(108, 92, 18, 30, 8) : ctx.rect(108, 92, 18, 30);
    ctx.fill();

    // 동글동글 손끝
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(43, 124, 7.5, 0, Math.PI * 2);
    ctx.arc(117, 124, 7.5, 0, Math.PI * 2);
    ctx.fill();

    // 가슴 테마 아이콘 장식
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(theme.icon || '⭐', 80, 114);

    // ----------------------------------------------------
    // [Z-3] 목선(Neck) 깊숙이 삽입 — 바디의 가슴 안쪽(y:88)까지 12px 파고듦
    // ----------------------------------------------------
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.rect(cx - 9, cy + r - 8, 18, 22);
    ctx.fill();

    // ----------------------------------------------------
    // [Z-4] 턱선 앰비언트 그림자 (Occlusion Shadow) — 턱 아래에 떨어져 경계선 소멸
    // ----------------------------------------------------
    ctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
    ctx.beginPath();
    ctx.arc(cx, cy + r - 3, 12, 0, Math.PI);
    ctx.fill();

    // ----------------------------------------------------
    // [Z-5] 바디의 넥 칼라(옷깃/카라) 오버랩 — 셔츠 깃이 목선 앞을 덮어 이음새 완전 은폐!
    // ----------------------------------------------------
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(66, 86);
    ctx.lineTo(80, 100);
    ctx.lineTo(94, 86);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // ----------------------------------------------------
    // [Z-6] 만화형 얼굴(Face) + 이목구비 + 안경 + 앞머리 일체형 안착
    // ----------------------------------------------------
    // 1. 귀
    ctx.fillStyle = skin;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx - r + 3, cy + 4, 7, 0, Math.PI * 2);
    ctx.arc(cx + r - 3, cy + 4, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 2. 둥근 얼굴 윤곽
    ctx.fillStyle = skin;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 3. 발그레한 볼터치 (Blush)
    ctx.fillStyle = features.blushColor || 'rgba(251, 113, 133, 0.45)';
    ctx.beginPath();
    ctx.ellipse(cx - 18, cy + 13, 6.5, 4, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 18, cy + 13, 6.5, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4. 눈썹 (인물의 눈썹 형태와 머리색 반영)
    ctx.strokeStyle = hair;
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    var browShape = (features.eyebrows && features.eyebrows.shape) || 'arched';
    if (browShape === 'straight') {
      ctx.beginPath();
      ctx.moveTo(cx - 24, cy - 5);
      ctx.lineTo(cx - 12, cy - 5);
      ctx.moveTo(cx + 12, cy - 5);
      ctx.lineTo(cx + 24, cy - 5);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(cx - 18, cy - 3, 7, Math.PI * 1.15, Math.PI * 1.85);
      ctx.arc(cx + 18, cy - 3, 7, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    }

    // 5. 눈 (Eye Slant & Style)
    ctx.fillStyle = strokeColor;
    if (eyeType === 'sharp_confident') {
      // 자신감 넘치고 또렷한 눈매
      ctx.beginPath();
      ctx.ellipse(cx - 16, cy + 4, 5.2, 4.5, -0.15, 0, Math.PI * 2);
      ctx.ellipse(cx + 16, cy + 4, 5.2, 4.5, 0.15, 0, Math.PI * 2);
      ctx.fill();
    } else if (eyeType === 'gentle_smile') {
      // 부드러운 반달 눈웃음
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx - 16, cy + 6, 6, Math.PI * 1.15, Math.PI * 1.85);
      ctx.arc(cx + 16, cy + 6, 6, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    } else {
      // 맑고 초롱초롱한 만화 눈망울 (round_bright)
      ctx.beginPath();
      ctx.arc(cx - 16, cy + 4, 5.2, 0, Math.PI * 2);
      ctx.arc(cx + 16, cy + 4, 5.2, 0, Math.PI * 2);
      ctx.fill();
      // 별빛 하이라이트
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(cx - 17.5, cy + 2.5, 1.9, 0, Math.PI * 2);
      ctx.arc(cx - 14.2, cy + 5.8, 1, 0, Math.PI * 2);
      ctx.arc(cx + 14.5, cy + 2.5, 1.9, 0, Math.PI * 2);
      ctx.arc(cx + 17.8, cy + 5.8, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    // 6. 안경 (Gemini 비전이 감지한 실제 안경 렌더링)
    if (hasGlasses && glassesShape !== 'none') {
      ctx.strokeStyle = glassesColor || strokeColor;
      ctx.lineWidth = glassesShape === 'black_thick' ? 2.8 : (glassesShape === 'square_horn' ? 2.4 : 1.8);

      if (glassesShape === 'square_horn' || glassesShape === 'black_thick') {
        // 사각 뿔테 안경
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(cx - 26, cy - 2, 20, 15, 3) : ctx.rect(cx - 26, cy - 2, 20, 15);
        ctx.roundRect ? ctx.roundRect(cx + 6, cy - 2, 20, 15, 3) : ctx.rect(cx + 6, cy - 2, 20, 15);
        ctx.stroke();
      } else {
        // 동글이 메탈테 안경 (round_wire, half_rim)
        ctx.beginPath();
        ctx.arc(cx - 16, cy + 4, 9, 0, Math.PI * 2);
        ctx.arc(cx + 16, cy + 4, 9, 0, Math.PI * 2);
        ctx.stroke();
      }
      // 안경 브릿지(코걸이)
      ctx.beginPath();
      ctx.moveTo(cx - 6, cy + 3);
      ctx.lineTo(cx + 6, cy + 3);
      ctx.stroke();
    }

    // 7. 앙증맞은 코 & 미소 입
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.beginPath();
    ctx.arc(cx, cy + 9, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#F43F5E';
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy + 16, 5, 0.1, Math.PI - 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // 혀 포인트
    ctx.fillStyle = '#FDA4AF';
    ctx.beginPath();
    ctx.arc(cx, cy + 18, 3, Math.PI, Math.PI * 2);
    ctx.fill();

    // 8. 앞머리 헤어스타일 (실제 인물의 가르마, 앞머리 형태 반영)
    ctx.fillStyle = hair;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.2;
    ctx.beginPath();

    if (hairParting === 'center') {
      // 5:5 가르마 헤어 (Curtain Bangs)
      ctx.arc(cx, cy - 3, r + 2, Math.PI * 0.85, Math.PI * 2.15);
      ctx.lineTo(cx + r, cy + 2);
      ctx.quadraticCurveTo(cx + 12, cy - 8, cx, cy - 1);
      ctx.quadraticCurveTo(cx - 12, cy - 8, cx - r, cy + 2);
    } else if (hairParting === 'left' || hairParting === 'right') {
      // 사이드 가르마 (6:4 or 7:3 댄디 투블럭)
      ctx.arc(cx, cy - 3, r + 2, Math.PI * 0.85, Math.PI * 2.15);
      ctx.lineTo(cx + r, cy + 2);
      ctx.quadraticCurveTo(cx + 6, cy - 10, cx - 10, cy - 2);
      ctx.quadraticCurveTo(cx - 20, cy - 6, cx - r, cy + 2);
    } else if (hairStyle === 'short' || hairStyle === 'spiky') {
      // 스포티 숏컷
      ctx.arc(cx, cy - 4, r + 2, Math.PI * 0.85, Math.PI * 2.15);
      ctx.lineTo(cx + r, cy - 4);
      ctx.lineTo(cx + 14, cy - 6);
      ctx.lineTo(cx + 2, cy - 4);
      ctx.lineTo(cx - 12, cy - 6);
      ctx.lineTo(cx - r, cy - 4);
    } else if (hairStyle === 'bob') {
      // 단발 뱅 앞머리
      ctx.arc(cx, cy - 3, r + 3, Math.PI * 0.85, Math.PI * 2.15);
      ctx.lineTo(cx + r + 2, cy + 10);
      ctx.quadraticCurveTo(cx + 16, cy + 2, cx, cy - 2);
      ctx.quadraticCurveTo(cx - 16, cy + 2, cx - r - 2, cy + 10);
    } else {
      // 기본 댄디 볼륨 컷
      ctx.arc(cx, cy - 3, r + 2, Math.PI * 0.85, Math.PI * 2.15);
      ctx.lineTo(cx + r, cy + 2);
      ctx.quadraticCurveTo(cx + 18, cy - 4, cx + 6, cy - 2);
      ctx.quadraticCurveTo(cx - 6, cy - 6, cx - 18, cy - 3);
      ctx.lineTo(cx - r, cy + 2);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 헤어 윤기 엔젤링
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy - 5, r - 8, Math.PI * 1.25, Math.PI * 1.75);
    ctx.stroke();

    // [중요 요구사항 4]: 좌측 상단 #(번호) (아바타이름) 뱃지 렌더링 코드 완전 삭제!
    // (캔버스에는 순수한 캐릭터 일러스트만 깔끔하게 남김)

    var finalUrl = cvs.toDataURL('image/png');
    if (callback) callback(finalUrl, features);
    return finalUrl;
  }

  function getSmartFallbackFeatures() {
    return {
      hasGlasses: false,
      glassesShape: 'none',
      glassesColor: '#1E293B',
      skinColor: '#FFDFBF',
      blushColor: 'rgba(251,113,133,0.45)',
      hairColor: '#1E293B',
      hair: {
        style: 'dandy',
        parting: 'none',
        hasBangs: true,
        length: 'short',
        color: '#1E293B'
      },
      eyes: {
        type: 'round_bright',
        hasDoubleEyelid: true
      },
      eyebrows: {
        shape: 'arched',
        color: '#1E293B'
      },
      mouth: {
        expression: 'bright_smile'
      },
      similarityNote: '화사하고 밝은 3등신 만화 캐릭터'
    };
  }

  // 기존 계정 판별기 (10회 기득권 100% 무손실 보존) (#TASK-ES-125)
  function isLegacyAccount(profile) {
    if (!profile) return false;
    var settings = profile.settings || {};
    if (settings.maxBaseCrafts === DEFAULT_BASE_CRAFTS) return false;
    if (settings.maxBaseCrafts === LEGACY_MAX_CRAFTS) return true;
    if (typeof settings.avatarCraftCount === 'number' && settings.avatarCraftCount > 0) return true;
    if (settings.customAvatarUrl) return true;
    if (Array.isArray(settings.savedAvatars) && settings.savedAvatars.length > 0) return true;
    if (Array.isArray(profile.goals) && profile.goals.length > 0) return true;
    if (Array.isArray(profile.records) && profile.records.length > 0) return true;
    // maxBaseCrafts가 3으로 지정되지 않은 모든 기존/미지정 계정은 레거시 10회 보존
    return settings.maxBaseCrafts !== DEFAULT_BASE_CRAFTS;
  }

  // 총 가용 제작 한도 계산 (기본 한도 + 7일 연속 체크인 충전 보너스) (#TASK-ES-125)
  function getMaxCrafts(profile) {
    if (!profile) return DEFAULT_BASE_CRAFTS;
    var settings = profile.settings = profile.settings || {};
    var base;
    if (typeof settings.maxBaseCrafts === 'number') {
      base = settings.maxBaseCrafts;
    } else {
      // 미지정 계정은 레거시 10회 기본 보존
      base = LEGACY_MAX_CRAFTS;
      settings.maxBaseCrafts = LEGACY_MAX_CRAFTS;
    }
    var bonus = (typeof settings.bonusCraftCredits === 'number') ? settings.bonusCraftCredits : 0;
    return base + bonus;
  }

  // 잔여 제작 가능 횟수 계산 (총한도 - 실질사용횟수, 계정당 최대 10회 / 신규 기본 3회) (#TASK-ES-125)
  function getRemainingCrafts(profile) {
    var maxCrafts = getMaxCrafts(profile);
    if (!profile || !profile.settings) return maxCrafts;
    var used = profile.settings.avatarCraftCount;
    if (typeof used !== 'number') used = 0;
    return Math.max(0, maxCrafts - used);
  }

  // 7일 연속 체크인 달성 시 아바타 제작권 1회 자동 충전 리워드 루프 (#TASK-ES-125)
  function maybeGrantStreakBonus(profile, streakDays) {
    if (!profile) return { granted: false };
    var settings = profile.settings = profile.settings || {};
    var sDays = Number(streakDays) || 0;
    if (sDays < 7) return { granted: false };

    var currentTierDays = Math.floor(sDays / 7) * 7;
    var lastAwarded = Number(settings.lastStreakAwarded) || 0;

    // 스트릭이 끊겼다가 다시 회복된 경우 마지막 지급 기준 리셋
    if (sDays < lastAwarded) {
      lastAwarded = 0;
      settings.lastStreakAwarded = 0;
    }

    // 동일 7일 배수 구간 중복 지급 방지
    if (currentTierDays <= lastAwarded) {
      return { granted: false };
    }

    settings.bonusCraftCredits = (Number(settings.bonusCraftCredits) || 0) + 1;
    settings.lastStreakAwarded = currentTierDays;

    return {
      granted: true,
      streakDays: sDays,
      awardedTierDays: currentTierDays,
      bonusCraftCredits: settings.bonusCraftCredits,
      totalCrafts: getMaxCrafts(profile),
      remainingCrafts: getRemainingCrafts(profile)
    };
  }

  // 테마 ID로 테마 객체 조회 (#TASK-ES-119)
  function getThemeById(themeId) {
    var idNum = Number(themeId) || 1;
    // 1. [TASK-ES-127] 320종 페르소나 데이터셋에서 우선 검색
    if (typeof BODY_THEMES_320 !== 'undefined' && BODY_THEMES_320.length) {
      for (var i = 0; i < BODY_THEMES_320.length; i++) {
        if (BODY_THEMES_320[i].id === idNum) return BODY_THEMES_320[i];
      }
    }
    // 2. 레거시 77종 데이터셋에서 검색 (하위 호환성 100% 보장)
    for (var j = 0; j < BODY_THEMES_77.length; j++) {
      if (BODY_THEMES_77[j].id === idNum) return BODY_THEMES_77[j];
    }
    return (typeof BODY_THEMES_320 !== 'undefined' && BODY_THEMES_320[0]) || BODY_THEMES_77[0];
  }

  // 누적 아바타 보관함(서랍) 목록 반환 (하위호환 자가치유 포함) (#TASK-ES-119)
  function getSavedAvatars(profile) {
    if (!profile) return [];
    var settings = profile.settings = profile.settings || {};
    if (!Array.isArray(settings.savedAvatars)) {
      settings.savedAvatars = [];
    }
    // 자가 치유: 기존에 제작된 customAvatarUrl이 있는데 savedAvatars가 비어있는 경우 1번 아이템으로 자동 복원
    if (settings.savedAvatars.length === 0 && settings.customAvatarUrl && (settings.customAvatarUrl.indexOf('data:image') === 0 || settings.customAvatarUrl.indexOf('http') === 0)) {
      var t = getThemeById(settings.avatarThemeId || 1);
      settings.savedAvatars.push({
        id: 'ava_init_' + Date.now(),
        url: settings.customAvatarUrl,
        themeId: t.id,
        themeName: t.name,
        themeIcon: t.icon,
        createdAt: new Date().toISOString()
      });
    }
    return settings.savedAvatars;
  }

  // 아바타 보관함에 새 아바타 추가 (최대 10개) (#TASK-ES-119)
  function addSavedAvatar(profile, item) {
    if (!profile || !item || !item.url) return [];
    var list = getSavedAvatars(profile);
    var existingIdx = -1;
    for (var i = 0; i < list.length; i++) {
      if (list[i].url === item.url || (list[i].id && list[i].id === item.id)) {
        existingIdx = i;
        break;
      }
    }
    if (existingIdx !== -1) {
      list.splice(existingIdx, 1);
    }
    list.unshift({
      id: item.id || ('ava_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4)),
      url: item.url,
      themeId: item.themeId || 1,
      themeName: item.themeName || getThemeById(item.themeId || 1).name,
      themeIcon: item.themeIcon || getThemeById(item.themeId || 1).icon,
      mbti: item.mbti || null,
      motto: item.motto || null,
      periodStart: item.periodStart || null,
      periodEnd: item.periodEnd || null,
      createdAt: item.createdAt || new Date().toISOString()
    });
    if (list.length > MAX_AVATAR_CHANGES) {
      profile.settings.savedAvatars = list.slice(0, MAX_AVATAR_CHANGES);
    } else {
      profile.settings.savedAvatars = list;
    }
    return profile.settings.savedAvatars;
  }

  // 아바타 보관함에서 삭제 (착용 중 보호) (#TASK-ES-119)
  function removeSavedAvatar(profile, avatarId) {
    if (!profile || !avatarId) return false;
    var list = getSavedAvatars(profile);
    var targetIdx = -1;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === avatarId) {
        targetIdx = i;
        break;
      }
    }
    if (targetIdx === -1) return false;
    if (profile.settings && profile.settings.customAvatarUrl === list[targetIdx].url) {
      return false; // 착용 중 보호
    }
    list.splice(targetIdx, 1);
    profile.settings.savedAvatars = list;
    return true;
  }

  // [TASK-ES-122] 기간 내 목표/기록/팀 활동 요약 텍스트 생성 (MBTI/좌우명 분석 입력)
  function collectPeriodPersonaSummary(profile, mockGroups, startDate, endDate) {
    var startTs = startDate.getTime();
    var endTs = endDate.getTime();
    var goals = ((profile && profile.goals) || []).filter(function (g) {
      var created = g.createdAt || g.startAt || null;
      if (!created) return false;
      var t = new Date(created).getTime();
      return !isNaN(t) && t >= startTs && t <= endTs;
    });
    var records = ((profile && profile.records) || []).filter(function (r) {
      if (!r.startAt) return false;
      var t = new Date(r.startAt).getTime();
      return !isNaN(t) && t >= startTs && t <= endTs;
    });
    var teamLines = [];
    try {
      var gState = (profile && profile.settings && profile.settings.groupState) || {};
      (mockGroups || []).forEach(function (g) {
        var gs = gState[g.id];
        if (!gs || !gs.joined) return;
        var role = gs.myRole || 'member';
        var teamGoals = g.teamGoals || [];
        if (teamGoals.length === 0) {
          teamLines.push((g.name || '팀') + '(역할:' + role + ') 참여 중');
          return;
        }
        teamGoals.forEach(function (tg) {
          var ms = tg.milestones || [];
          var doneCnt = ms.filter(function (m) { return m.status === 'done'; }).length;
          teamLines.push((g.name || '팀') + '(역할:' + role + ') 팀목표 "' + (tg.title || '') + '" 진행 ' + doneCnt + '/' + ms.length);
        });
      });
    } catch (e) {}

    var lines = [];
    if (goals.length) {
      lines.push('[목표 ' + goals.length + '건] ' + goals.map(function (g) { return g.title || g.name || '목표'; }).slice(0, 20).join(', '));
    }
    if (records.length) {
      lines.push('[기록 ' + records.length + '건] ' + records.map(function (r) { return r.title || r.type || r.category || '실천 기록'; }).slice(0, 30).join(', '));
    }
    if (teamLines.length) {
      lines.push('[팀 활동] ' + teamLines.join(' / '));
    }

    return {
      goalsCount: goals.length,
      recordsCount: records.length,
      teamCount: teamLines.length,
      isEmpty: goals.length === 0 && records.length === 0 && teamLines.length === 0,
      summaryText: lines.join('\n')
    };
  }

  // [TASK-ES-122] 서버(Gemini)에 기간 요약을 전달해 MBTI·좌우명 생성
  function fetchAvatarPersona(summaryText) {
    return fetch('/api/avatar-persona', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'avatar-persona', summaryText: summaryText })
    }).then(function (res) {
      if (!res.ok) throw new Error('persona API status ' + res.status);
      return res.json();
    }).then(function (data) {
      if (data && data.persona && data.persona.mbti && data.persona.motto) return data.persona;
      return null;
    }).catch(function () { return null; });
  }

  // 내 아바타 서랍 카드 덱 HTML 렌더러 (#TASK-ES-119)

  // ================= [TASK-ES-127] 320종 MBTI 페르소나 도감 렌더러 =================
  function renderPersona320ListHtml(themes) {
    if (!themes || themes.length === 0) {
      return '<div style="text-align:center;padding:16px;color:var(--ink-soft);font-size:.8125rem;">검색 결과와 일치하는 페르소나가 없습니다.</div>';
    }
    return themes.map(function (t) {
      return '<div style="display:flex;align-items:center;gap:8px;padding:6px 8px;background:var(--surface-1,#fff);border:1px solid var(--border-soft);border-radius:10px;font-size:.8125rem;">' +
        '<span style="font-size:1.1rem;flex-shrink:0;">' + (t.icon || '🎨') + '</span>' +
        '<div style="flex:1;min-width:0;">' +
          '<div style="display:flex;align-items:center;gap:4px;flex-wrap:nowrap;">' +
            '<span style="font-weight:800;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + t.name + '</span>' +
            '<span style="font-size:9px;background:' + (t.subColor || '#EEF2FF') + ';color:' + (t.color || '#4F46E5') + ';padding:1px 4px;border-radius:4px;font-weight:800;flex-shrink:0;">' + t.mbti + '</span>' +
          '</div>' +
          '<div style="font-size:10px;color:var(--ink-soft);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px;">' +
            (t.kw || t.desc || '') + ' · 🎒 ' + (t.gear || '') +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function renderSavedAvatarsDeckHtml(savedList, activeUrl, selectedUrl) {
    if (!savedList || savedList.length === 0) {
      return '<div style="text-align:center;padding:14px 10px;background:var(--surface-3, #F1F5F9);border-radius:12px;color:var(--ink-soft, #64748B);font-size:0.8125rem;line-height:1.45;">' +
        '🎨 아직 보관된 아바타가 없습니다.<br>아래에서 사진을 선택하고 나만의 첫 3등신 만화 아바타를 제작해보세요!' +
      '</div>';
    }

    var cards = savedList.map(function (item) {
      var isWearing = (item.url === activeUrl);
      var isSelected = (item.url === selectedUrl);
      var borderColor = isSelected ? 'var(--emerald, #10B981)' : (isWearing ? '#3B82F6' : 'var(--border-soft, #E2E8F0)');
      var borderWeight = (isSelected || isWearing) ? '2.5px' : '1px';
      var bgShadow = isSelected ? 'box-shadow:0 0 0 3px rgba(16,185,129,0.22);' : (isWearing ? 'box-shadow:0 0 0 2px rgba(59,130,246,0.2);' : '');

      return '<div class="saved-avatar-card" data-ava-id="' + item.id + '" style="flex:0 0 84px;position:relative;background:var(--surface-1, #FFFFFF);border:' + borderWeight + ' solid ' + borderColor + ';' + bgShadow + 'border-radius:14px;padding:6px 4px 6px 4px;cursor:pointer;text-align:center;transition:all .15s ease;">' +
        (isWearing ? '<div style="position:absolute;top:-7px;left:50%;transform:translateX(-50%);background:#3B82F6;color:#fff;font-size:9px;font-weight:900;padding:1px 6px;border-radius:10px;white-space:nowrap;z-index:2;">착용 중</div>' : '') +
        (!isWearing ? '<button type="button" class="btn-del-saved-avatar" data-ava-id="' + item.id + '" title="보관함에서 삭제" style="position:absolute;top:2px;right:2px;width:18px;height:18px;border-radius:50%;background:rgba(0,0,0,0.5);color:#fff;border:none;font-size:11px;line-height:1;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:3;padding:0;">×</button>' : '') +
        '<div style="width:72px;height:72px;border-radius:10px;overflow:hidden;margin:0 auto;background:#f8fafc;display:flex;align-items:center;justify-content:center;">' +
          '<img src="' + item.url + '" alt="' + (item.themeName || '아바타') + '" style="width:100%;height:100%;object-fit:cover;">' +
        '</div>' +
        '<div style="font-size:10px;font-weight:800;color:var(--ink, #0F172A);margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="' + item.themeName + '">' +
          (item.themeIcon || '🎨') + ' ' + (item.themeName || '아바타') +
        '</div>' +
        (item.mbti ? '<div style="font-size:9px;font-weight:700;color:var(--emerald, #10B981);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="' + (item.motto || '') + '">' + item.mbti + (item.motto ? ' · ' + item.motto : '') + '</div>' : '') +
      '</div>';
    }).join('');

    return '<div style="display:flex;gap:8px;overflow-x:auto;padding:8px 4px 6px 4px;-webkit-overflow-scrolling:touch;scroll-behavior:smooth;">' +
      cards +
    '</div>';
  }

  // ================= 5대 상징 랭크 25단계 성장 진화 시스템 (#TASK-ES-159, #TASK-ES-204) =================
  // 상민님 지시: 새싹->숲->포세이돈->제우스->우주 5대 테마 + 1레벨마다(I~V) 점진적 성장 형태 진화
  var RANK_THEMES_5 = [
    {
      id: 'sprout',
      themeId: 1,
      minLv: 1,
      maxLv: 5,
      name: '새싹',
      icon: '🌱',
      title: '파릇한 새싹 랭크',
      desc: '작은 실천과 습관으로 틔워낸 소중한 새싹',
      mainColor: '#10B981',
      subColor: '#34D399',
      accentColor: '#D1FAE5',
      glow: 'rgba(16, 185, 129, 0.45)',
      badgeGradient: 'linear-gradient(135deg, #10B981, #059669)',
      subSteps: [
        { step: 1, roman: 'I', name: '아기 떡잎', desc: '머리 위 정중앙 앙증맞은 연둣빛 떡잎 한 쌍' },
        { step: 2, roman: 'II', name: '쌍떡잎과 아침이슬', desc: '도톰한 잎사귀와 영롱한 펄 이슬 두 방울' },
        { step: 3, roman: 'III', name: '세잎 클로버 핀', desc: '동글동글 사랑스러운 파스텔 클로버 헤어핀' },
        { step: 4, roman: 'IV', name: '미니 덩굴 화관', desc: '아바타 머리 위를 아치형으로 부드럽게 감싸는 미니 리스' },
        { step: 5, roman: 'V', name: '파스텔 데이지 티아라', desc: '화이트 & 파스텔 옐로우의 사랑스러운 데이지 꽃관' }
      ]
    },
    {
      id: 'forest',
      themeId: 2,
      minLv: 6,
      maxLv: 10,
      name: '울창한 숲',
      icon: '🌲',
      title: '울창한 숲 랭크',
      desc: '매일의 노력이 모여 울창한 숲을 이룬 성장',
      mainColor: '#059669',
      subColor: '#10B981',
      accentColor: '#A7F3D0',
      glow: 'rgba(5, 150, 105, 0.45)',
      badgeGradient: 'linear-gradient(135deg, #059669, #047857)',
      subSteps: [
        { step: 1, roman: 'I', name: '올리브 잎가지 핀', desc: '단정하게 꽂힌 미니멀 올리브 잎가지' },
        { step: 2, roman: 'II', name: '황금 도토리 핀', desc: '귀여운 황금빛 도토리와 작은 잎사귀' },
        { step: 3, roman: 'III', name: '월계수 미니 화관', desc: '머리 위에 정갈하게 얹히는 라운드 월계수' },
        { step: 4, roman: 'IV', name: '싱그러운 열매 링', desc: '에메랄드 잎사귀와 빨간 베리 열매 헤일로' },
        { step: 5, roman: 'V', name: '에메랄드 리프 크라운', desc: '세 봉우리 리프 크라운과 영롱한 보석 티아라' }
      ]
    },
    {
      id: 'poseidon',
      themeId: 3,
      minLv: 11,
      maxLv: 15,
      name: '포세이돈',
      icon: '🌊',
      title: '마린 바다 랭크',
      desc: '거친 한계와 파도를 넘어선 깊은 몰입의 경지',
      mainColor: '#0284C7',
      subColor: '#38BDF8',
      accentColor: '#E0F2FE',
      glow: 'rgba(2, 132, 199, 0.45)',
      badgeGradient: 'linear-gradient(135deg, #0284C7, #0369A1)',
      subSteps: [
        { step: 1, roman: 'I', name: '청량 에어 버블', desc: '머리 위에 퐁퐁 떠오르는 투명한 방울들' },
        { step: 2, roman: 'II', name: '파스텔 조개와 아기 진주', desc: '둥글고 귀여운 조개와 빛나는 진주' },
        { step: 3, roman: 'III', name: '몽글 파도 리본', desc: '부드러운 곡선미의 파스텔 바다 리본' },
        { step: 4, roman: 'IV', name: '아쿠아 마린 드롭', desc: '눈물방울형 아쿠아마린 젬 헤드피스' },
        { step: 5, roman: 'V', name: '사파이어 오션 티아라', desc: '잔잔한 물결 위의 사파이어 미니 티아라' }
      ]
    },
    {
      id: 'zeus',
      themeId: 4,
      minLv: 16,
      maxLv: 20,
      name: '제우스',
      icon: '⚡',
      title: '썬더 스파크 랭크',
      desc: '목표를 단숨에 꿰뚫는 찬란한 황금빛 섬광',
      mainColor: '#F59E0B',
      subColor: '#FBBF24',
      accentColor: '#FEF3C7',
      glow: 'rgba(245, 158, 11, 0.5)',
      badgeGradient: 'linear-gradient(135deg, #F59E0B, #D97706)',
      subSteps: [
        { step: 1, roman: 'I', name: '쁘띠 썬더 핀', desc: '끝이 둥글려진 앙증맞은 버터옐로우 미니 번개 헤어핀' },
        { step: 2, roman: 'II', name: '솜사탕 아기 구름과 번개', desc: '몽실몽실 아기 구름 아래 꼬마 번개' },
        { step: 3, roman: 'III', name: '별빛 번개 엠블럼', desc: '반짝이는 미니 스타와 조화로운 스파크' },
        { step: 4, roman: 'IV', name: '샴페인 골드 스파크 링', desc: '머리 위를 비추는 골든 라이트 헤일로' },
        { step: 5, roman: 'V', name: '골든 스타 크라운', desc: '별과 번개 모티브가 장식된 세련된 황금빛 미니 크라운' }
      ]
    },
    {
      id: 'cosmic',
      themeId: 5,
      minLv: 21,
      maxLv: 25,
      name: '코스믹 우주',
      icon: '🌌',
      title: '코스믹 우주 랭크',
      desc: '나만의 우주를 완성한 위대한 성취',
      mainColor: '#8B5CF6',
      subColor: '#C084FC',
      accentColor: '#EDE9FE',
      glow: 'rgba(139, 92, 246, 0.5)',
      badgeGradient: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
      subSteps: [
        { step: 1, roman: 'I', name: '파스텔 토성 미니 링', desc: '라벤더빛 꼬마 행성과 부드러운 궤도 링' },
        { step: 2, roman: 'II', name: '핑크빛 아기 유성', desc: '은은한 꼬리의 귀여운 별똥별 핀' },
        { step: 3, roman: 'III', name: '은하수 미니 별자리', desc: '세 개의 꼬마 별이 은은한 선으로 이어진 별자리 피스' },
        { step: 4, roman: 'IV', name: '오로라 성운 엠블럼', desc: '몽환적인 파스텔 오로라 성운 & 반짝이' },
        { step: 5, roman: 'V', name: '코스믹 인피니티 헤일로', desc: '영롱한 인피니티 링 & 다이아몬드 스타' }
      ]
    }
  ];

  function getRankThemeInfo(level) {
    var lv = Math.max(1, parseInt(level, 10) || 1);
    var matchedTheme = RANK_THEMES_5[4];
    for (var i = 0; i < RANK_THEMES_5.length; i++) {
      if (lv >= RANK_THEMES_5[i].minLv && lv <= RANK_THEMES_5[i].maxLv) {
        matchedTheme = RANK_THEMES_5[i];
        break;
      }
    }
    var theme = Object.assign({}, matchedTheme);
    var subStep = Math.min(5, ((lv - 1) % 5) + 1);
    theme.subStep = subStep;
    theme.roman = ['I', 'II', 'III', 'IV', 'V'][subStep - 1];
    theme.stepInfo = (theme.subSteps && theme.subSteps[subStep - 1]) || { step: subStep, roman: theme.roman, name: theme.name + ' ' + theme.roman, desc: theme.desc };
    theme.stepTitle = theme.name + ' ' + theme.roman;
    theme.stepFullName = theme.icon + ' ' + theme.name + ' ' + theme.roman + ' (' + theme.stepInfo.name + ')';
    theme.evolutionDesc = theme.stepInfo.desc;
    theme.nextTier = (theme.themeId < 5) ? RANK_THEMES_5[theme.themeId] : null;
    theme.nextLv = (subStep < 5) ? lv + 1 : ((theme.themeId < 5) ? RANK_THEMES_5[theme.themeId].minLv : null);
    return theme;
  }

  function getRankWingsSvg(level, size, options) {
    var s = size || 38;
    var opts = options || {};
    var compact = (opts.compact === true);
    var theme = getRankThemeInfo(level);
    var tid = theme.id;
    var step = theme.subStep; // 1 ~ 5
    var c1 = theme.mainColor;
    var c2 = theme.subColor;
    var cAcc = theme.accentColor || '#FFFFFF';

    // 20대 후반 여성 감성 미니멀 헤드 오브제 전용 컴팩트 패딩: 좌우 번잡함 0px, 머리 위 정중앙 배치
    var padX = compact ? Math.round(s * 0.12) : Math.round(s * 0.16);
    var padY = compact ? Math.round(s * 0.28) : Math.round(s * 0.34);
    var totalW = s + padX * 2;
    var totalH = s + padY * 2;
    var cx = totalW / 2;
    var bT = padY; // 아바타 박스 상단선

    var gradId = 'rg_' + tid + '_' + step + '_' + Math.round(s);
    var defsContent = '' +
      '<defs>' +
        '<linearGradient id="' + gradId + '_main" x1="0%" y1="0%" x2="100%" y2="100%">' +
          '<stop offset="0%" stop-color="' + c2 + '" />' +
          '<stop offset="100%" stop-color="' + c1 + '" />' +
        '</linearGradient>' +
        '<linearGradient id="' + gradId + '_gold" x1="0%" y1="0%" x2="100%" y2="100%">' +
          '<stop offset="0%" stop-color="#FEF08A" />' +
          '<stop offset="100%" stop-color="#F59E0B" />' +
        '</linearGradient>' +
        '<filter id="' + gradId + '_glow" x="-20%" y="-20%" width="140%" height="140%">' +
          '<feDropShadow dx="0" dy="1" stdDeviation="1.2" flood-color="' + c1 + '" flood-opacity="0.35" />' +
        '</filter>' +
      '</defs>';

    var growthContent = '';

    if (tid === 'sprout') {
      // 🌱 새싹: 아기 떡잎 -> 쌍떡잎과 이슬 -> 세잎 클로버 핀 -> 미니 덩굴 화관 -> 파스텔 데이지 티아라
      if (step === 1) {
        // I. 아기 떡잎: 머리 위 정중앙 앙증맞은 연둣빛 떡잎 한 쌍
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<path d="M ' + cx + ' ' + (bT + 1) + ' Q ' + cx + ' ' + (bT - 4) + ' ' + cx + ' ' + (bT - 6) + '" stroke="#059669" stroke-width="2" stroke-linecap="round" fill="none" />' +
          '<path d="M ' + cx + ' ' + (bT - 5) + ' C ' + (cx - 4) + ' ' + (bT - 6) + ', ' + (cx - 9) + ' ' + (bT - 11) + ', ' + (cx - 5) + ' ' + (bT - 13) + ' C ' + (cx - 1) + ' ' + (bT - 13) + ', ' + cx + ' ' + (bT - 9) + ', ' + cx + ' ' + (bT - 5) + ' Z" fill="#34D399" stroke="#059669" stroke-width="0.8" />' +
          '<path d="M ' + cx + ' ' + (bT - 5) + ' C ' + (cx + 4) + ' ' + (bT - 6) + ', ' + (cx + 9) + ' ' + (bT - 10) + ', ' + (cx + 5) + ' ' + (bT - 13) + ' C ' + (cx + 1) + ' ' + (bT - 13) + ', ' + cx + ' ' + (bT - 9) + ', ' + cx + ' ' + (bT - 5) + ' Z" fill="#10B981" stroke="#047857" stroke-width="0.8" />' +
          '<circle cx="' + (cx + 4) + '" cy="' + (bT - 11) + '" r="1.4" fill="#FFFFFF" opacity="0.9" />' +
        '</g>';
      } else if (step === 2) {
        // II. 쌍떡잎과 아침이슬: 도톰한 잎사귀 + 영롱한 펄 이슬 2방울
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<path d="M ' + cx + ' ' + (bT + 1) + ' Q ' + cx + ' ' + (bT - 5) + ' ' + cx + ' ' + (bT - 8) + '" stroke="#047857" stroke-width="2.2" stroke-linecap="round" fill="none" />' +
          '<ellipse cx="' + (cx - 6) + '" cy="' + (bT - 9) + '" rx="5.5" ry="3.5" transform="rotate(-25 ' + (cx - 6) + ' ' + (bT - 9) + ')" fill="#34D399" stroke="#047857" stroke-width="0.8" />' +
          '<ellipse cx="' + (cx + 6) + '" cy="' + (bT - 9) + '" rx="5.5" ry="3.5" transform="rotate(25 ' + (cx + 6) + ' ' + (bT - 9) + ')" fill="#10B981" stroke="#047857" stroke-width="0.8" />' +
          '<circle cx="' + (cx - 5) + '" cy="' + (bT - 10) + '" r="1.6" fill="#FFFFFF" />' +
          '<circle cx="' + (cx + 6) + '" cy="' + (bT - 10) + '" r="1.3" fill="#ECFDF5" />' +
        '</g>';
      } else if (step === 3) {
        // III. 세잎 클로버 핀: 동글동글 사랑스러운 파스텔 클로버 헤어핀
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<path d="M ' + cx + ' ' + (bT + 1) + ' L ' + cx + ' ' + (bT - 5) + '" stroke="#047857" stroke-width="2" stroke-linecap="round" />' +
          '<circle cx="' + cx + '" cy="' + (bT - 11) + '" r="3.6" fill="#10B981" stroke="#047857" stroke-width="0.8" />' +
          '<circle cx="' + (cx - 4.2) + '" cy="' + (bT - 7.5) + '" r="3.4" fill="#34D399" stroke="#047857" stroke-width="0.8" />' +
          '<circle cx="' + (cx + 4.2) + '" cy="' + (bT - 7.5) + '" r="3.4" fill="#34D399" stroke="#047857" stroke-width="0.8" />' +
          '<circle cx="' + cx + '" cy="' + (bT - 8.5) + '" r="1.6" fill="#FFFFFF" />' +
        '</g>';
      } else if (step === 4) {
        // IV. 미니 덩굴 화관: 아바타 머리 위를 아치형으로 부드럽게 감싸는 미니 리스
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<path d="M ' + (cx - 13) + ' ' + (bT + 1) + ' Q ' + cx + ' ' + (bT - 9) + ' ' + (cx + 13) + ' ' + (bT + 1) + '" stroke="#059669" stroke-width="2" fill="none" stroke-linecap="round" />' +
          '<ellipse cx="' + (cx - 8) + '" cy="' + (bT - 6) + '" rx="3" ry="2" fill="#34D399" transform="rotate(-30 ' + (cx - 8) + ' ' + (bT - 6) + ')" />' +
          '<ellipse cx="' + (cx + 8) + '" cy="' + (bT - 6) + '" rx="3" ry="2" fill="#34D399" transform="rotate(30 ' + (cx + 8) + ' ' + (bT - 6) + ')" />' +
          '<circle cx="' + cx + '" cy="' + (bT - 8.5) + '" r="2.8" fill="#F472B6" stroke="#FFFFFF" stroke-width="0.9" />' +
          '<circle cx="' + cx + '" cy="' + (bT - 8.5) + '" r="1" fill="#FEF08A" />' +
        '</g>';
      } else {
        // V. 파스텔 데이지 티아라: 화이트 & 파스텔 옐로우의 사랑스러운 데이지 꽃관
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<path d="M ' + (cx - 14) + ' ' + (bT + 1) + ' Q ' + cx + ' ' + (bT - 7) + ' ' + (cx + 14) + ' ' + (bT + 1) + '" stroke="#10B981" stroke-width="2" fill="none" stroke-linecap="round" />' +
          '<circle cx="' + cx + '" cy="' + (bT - 13) + '" r="2.2" fill="#FFFFFF" />' +
          '<circle cx="' + (cx - 4) + '" cy="' + (bT - 11.5) + '" r="2.2" fill="#FFFFFF" />' +
          '<circle cx="' + (cx + 4) + '" cy="' + (bT - 11.5) + '" r="2.2" fill="#FFFFFF" />' +
          '<circle cx="' + (cx - 2.5) + '" cy="' + (bT - 7.5) + '" r="2.2" fill="#FFFFFF" />' +
          '<circle cx="' + (cx + 2.5) + '" cy="' + (bT - 7.5) + '" r="2.2" fill="#FFFFFF" />' +
          '<circle cx="' + cx + '" cy="' + (bT - 10) + '" r="2.6" fill="#FBBF24" stroke="#F59E0B" stroke-width="0.6" />' +
          '<circle cx="' + (cx - 10) + '" cy="' + (bT - 3) + '" r="2" fill="#A7F3D0" />' +
          '<circle cx="' + (cx + 10) + '" cy="' + (bT - 3) + '" r="2" fill="#A7F3D0" />' +
        '</g>';
      }
    } else if (tid === 'forest') {
      // 🌲 울창한 숲: 올리브 가지 핀 -> 황금 도토리 핀 -> 월계수 미니 화관 -> 싱그러운 열매 링 -> 포레스트 에메랄드 크라운
      if (step === 1) {
        // I. 올리브 가지 핀: 단정하게 꽂힌 미니멀 올리브 잎가지
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<path d="M ' + (cx - 7) + ' ' + (bT + 1) + ' Q ' + cx + ' ' + (bT - 6) + ' ' + (cx + 8) + ' ' + (bT - 9) + '" stroke="#78350F" stroke-width="1.8" stroke-linecap="round" fill="none" />' +
          '<ellipse cx="' + (cx - 2) + '" cy="' + (bT - 5) + '" rx="3.5" ry="2" transform="rotate(-30 ' + (cx - 2) + ' ' + (bT - 5) + ')" fill="#059669" stroke="#047857" stroke-width="0.6" />' +
          '<ellipse cx="' + (cx + 4) + '" cy="' + (bT - 8) + '" rx="3.5" ry="2" transform="rotate(-20 ' + (cx + 4) + ' ' + (bT - 8) + ')" fill="#10B981" stroke="#047857" stroke-width="0.6" />' +
          '<circle cx="' + (cx + 8) + '" cy="' + (bT - 10) + '" r="1.8" fill="#A7F3D0" />' +
        '</g>';
      } else if (step === 2) {
        // II. 황금 도토리 핀: 귀여운 황금빛 도토리와 작은 잎사귀
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<path d="M ' + cx + ' ' + (bT + 1) + ' L ' + cx + ' ' + (bT - 5) + '" stroke="#78350F" stroke-width="1.8" stroke-linecap="round" />' +
          '<ellipse cx="' + cx + '" cy="' + (bT - 10) + '" rx="4" ry="4.5" fill="#D97706" stroke="#B45309" stroke-width="0.7" />' +
          '<path d="M ' + (cx - 4) + ' ' + (bT - 11) + ' Q ' + cx + ' ' + (bT - 14) + ' ' + (cx + 4) + ' ' + (bT - 11) + ' Z" fill="#78350F" />' +
          '<circle cx="' + (cx - 1.2) + '" cy="' + (bT - 9.5) + '" r="1.2" fill="#FEF08A" />' +
          '<ellipse cx="' + (cx + 5) + '" cy="' + (bT - 8) + '" rx="3.2" ry="1.8" transform="rotate(35 ' + (cx + 5) + ' ' + (bT - 8) + ')" fill="#10B981" />' +
        '</g>';
      } else if (step === 3) {
        // III. 월계수 미니 화관: 머리 위에 정갈하게 얹히는 라운드 월계수
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<path d="M ' + (cx - 13) + ' ' + (bT + 1) + ' Q ' + cx + ' ' + (bT - 10) + ' ' + (cx + 13) + ' ' + (bT + 1) + '" stroke="#047857" stroke-width="1.8" fill="none" stroke-linecap="round" />' +
          '<ellipse cx="' + (cx - 9) + '" cy="' + (bT - 6) + '" rx="3.5" ry="2" transform="rotate(-40 ' + (cx - 9) + ' ' + (bT - 6) + ')" fill="#10B981" />' +
          '<ellipse cx="' + (cx - 4) + '" cy="' + (bT - 9) + '" rx="3.5" ry="2" transform="rotate(-20 ' + (cx - 4) + ' ' + (bT - 9) + ')" fill="#34D399" />' +
          '<ellipse cx="' + (cx + 4) + '" cy="' + (bT - 9) + '" rx="3.5" ry="2" transform="rotate(20 ' + (cx + 4) + ' ' + (bT - 9) + ')" fill="#34D399" />' +
          '<ellipse cx="' + (cx + 9) + '" cy="' + (bT - 6) + '" rx="3.5" ry="2" transform="rotate(40 ' + (cx + 9) + ' ' + (bT - 6) + ')" fill="#10B981" />' +
          '<circle cx="' + cx + '" cy="' + (bT - 9) + '" r="1.8" fill="#FDE047" />' +
        '</g>';
      } else if (step === 4) {
        // IV. 싱그러운 열매 링: 에메랄드 잎사귀와 빨간 베리 열매
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<circle cx="' + cx + '" cy="' + (bT - 7) + '" r="7.5" fill="none" stroke="#059669" stroke-width="1.8" />' +
          '<circle cx="' + (cx - 5) + '" cy="' + (bT - 8) + '" r="2.2" fill="#EF4444" stroke="#B91C1C" stroke-width="0.6" />' +
          '<circle cx="' + (cx + 4) + '" cy="' + (bT - 10) + '" r="2.2" fill="#EF4444" stroke="#B91C1C" stroke-width="0.6" />' +
          '<circle cx="' + (cx + 2) + '" cy="' + (bT - 4) + '" r="2" fill="#EF4444" stroke="#B91C1C" stroke-width="0.6" />' +
          '<ellipse cx="' + (cx - 2) + '" cy="' + (bT - 13) + '" rx="3" ry="1.8" transform="rotate(-20 ' + (cx - 2) + ' ' + (bT - 13) + ')" fill="#34D399" />' +
        '</g>';
      } else {
        // V. 포레스트 에메랄드 크라운: 3봉우리 리프 크라운과 영롱한 보석
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<polygon points="' + (cx - 12) + ',' + (bT) + ' ' + (cx - 7) + ',' + (bT - 11) + ' ' + (cx - 3) + ',' + (bT - 4) + ' ' + cx + ',' + (bT - 14) + ' ' + (cx + 3) + ',' + (bT - 4) + ' ' + (cx + 7) + ',' + (bT - 11) + ' ' + (cx + 12) + ',' + (bT) + '" fill="url(#' + gradId + '_gold)" stroke="#B45309" stroke-width="0.8" />' +
          '<circle cx="' + cx + '" cy="' + (bT - 8) + '" r="2.4" fill="#10B981" stroke="#FFFFFF" stroke-width="0.8" />' +
          '<circle cx="' + (cx - 7) + '" cy="' + (bT - 6) + '" r="1.6" fill="#34D399" />' +
          '<circle cx="' + (cx + 7) + '" cy="' + (bT - 6) + '" r="1.6" fill="#34D399" />' +
        '</g>';
      }
    } else if (tid === 'poseidon') {
      // 🌊 마린 바다: 청량 에어 버블 -> 파스텔 조개와 진주 -> 몽글 파도 리본 -> 아쿠아 마린 드롭 -> 사파이어 오션 티아라
      if (step === 1) {
        // I. 청량 에어 버블: 머리 위에 퐁퐁 떠오르는 3개의 투명한 방울들
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<circle cx="' + (cx - 6) + '" cy="' + (bT - 6) + '" r="3.6" fill="#BAE6FD" stroke="#38BDF8" stroke-width="1" opacity="0.9" />' +
          '<circle cx="' + (cx - 7.5) + '" cy="' + (bT - 7.5) + '" r="1" fill="#FFFFFF" />' +
          '<circle cx="' + (cx + 4) + '" cy="' + (bT - 9) + '" r="4.2" fill="#E0F2FE" stroke="#0284C7" stroke-width="1" opacity="0.9" />' +
          '<circle cx="' + (cx + 2.5) + '" cy="' + (bT - 10.5) + '" r="1.2" fill="#FFFFFF" />' +
          '<circle cx="' + (cx - 1) + '" cy="' + (bT - 14) + '" r="2" fill="#BAE6FD" stroke="#38BDF8" stroke-width="0.8" />' +
        '</g>';
      } else if (step === 2) {
        // II. 파스텔 조개와 아기 진주: 둥글고 귀여운 조개와 빛나는 진주
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<path d="M ' + (cx - 9) + ' ' + (bT + 1) + ' C ' + (cx - 10) + ' ' + (bT - 9) + ', ' + (cx + 10) + ' ' + (bT - 9) + ', ' + (cx + 9) + ' ' + (bT + 1) + ' Z" fill="#BAE6FD" stroke="#0284C7" stroke-width="1" />' +
          '<path d="M ' + cx + ' ' + (bT + 1) + ' L ' + (cx - 5) + ' ' + (bT - 7) + ' M ' + cx + ' ' + (bT + 1) + ' L ' + cx + ' ' + (bT - 8) + ' M ' + cx + ' ' + (bT + 1) + ' L ' + (cx + 5) + ' ' + (bT - 7) + '" stroke="#38BDF8" stroke-width="0.9" />' +
          '<circle cx="' + cx + '" cy="' + (bT - 1) + '" r="2.6" fill="#FFFFFF" stroke="#E0F2FE" stroke-width="0.8" />' +
          '<circle cx="' + (cx - 0.7) + '" cy="' + (bT - 1.8) + '" r="0.8" fill="#F0F9FF" />' +
        '</g>';
      } else if (step === 3) {
        // III. 몽글몽글 파도 리본: 부드러운 곡선미의 파스텔 바다 리본
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<path d="M ' + (cx - 12) + ' ' + (bT - 4) + ' Q ' + (cx - 6) + ' ' + (bT - 11) + ' ' + cx + ' ' + (bT - 6) + ' Q ' + (cx + 6) + ' ' + (bT - 11) + ' ' + (cx + 12) + ' ' + (bT - 4) + '" stroke="#0284C7" stroke-width="2.2" fill="none" stroke-linecap="round" />' +
          '<circle cx="' + (cx - 11) + '" cy="' + (bT - 3) + '" r="2" fill="#38BDF8" />' +
          '<circle cx="' + (cx + 11) + '" cy="' + (bT - 3) + '" r="2" fill="#38BDF8" />' +
          '<circle cx="' + cx + '" cy="' + (bT - 6) + '" r="3" fill="#BAE6FD" stroke="#0284C7" stroke-width="1" />' +
          '<circle cx="' + cx + '" cy="' + (bT - 6) + '" r="1.2" fill="#FFFFFF" />' +
        '</g>';
      } else if (step === 4) {
        // IV. 아쿠아 마린 드롭: 눈물방울형 아쿠아마린 젬 헤드피스
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<path d="M ' + (cx - 12) + ' ' + (bT + 1) + ' Q ' + cx + ' ' + (bT - 6) + ' ' + (cx + 12) + ' ' + (bT + 1) + '" stroke="#38BDF8" stroke-width="1.8" fill="none" stroke-linecap="round" />' +
          '<path d="M ' + cx + ' ' + (bT - 14) + ' C ' + (cx - 5) + ' ' + (bT - 7) + ', ' + (cx - 5) + ' ' + (bT - 3) + ', ' + cx + ' ' + (bT - 3) + ' C ' + (cx + 5) + ' ' + (bT - 3) + ', ' + (cx + 5) + ' ' + (bT - 7) + ', ' + cx + ' ' + (bT - 14) + ' Z" fill="#0284C7" stroke="#BAE6FD" stroke-width="1" />' +
          '<circle cx="' + cx + '" cy="' + (bT - 5.5) + '" r="1.6" fill="#FFFFFF" />' +
          '<circle cx="' + (cx - 10) + '" cy="' + (bT - 1) + '" r="1.8" fill="#BAE6FD" />' +
          '<circle cx="' + (cx + 10) + '" cy="' + (bT - 1) + '" r="1.8" fill="#BAE6FD" />' +
        '</g>';
      } else {
        // V. 사파이어 오션 티아라: 잔잔한 물결 위의 사파이어 미니 티아라
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<path d="M ' + (cx - 13) + ' ' + (bT + 1) + ' Q ' + cx + ' ' + (bT - 7) + ' ' + (cx + 13) + ' ' + (bT + 1) + '" stroke="#0284C7" stroke-width="2" fill="none" stroke-linecap="round" />' +
          '<polygon points="' + (cx - 10) + ',' + (bT - 1) + ' ' + (cx - 5) + ',' + (bT - 9) + ' ' + (cx - 2) + ',' + (bT - 4) + ' ' + cx + ',' + (bT - 13) + ' ' + (cx + 2) + ',' + (bT - 4) + ' ' + (cx + 5) + ',' + (bT - 9) + ' ' + (cx + 10) + ',' + (bT - 1) + '" fill="#BAE6FD" stroke="#0284C7" stroke-width="0.9" />' +
          '<circle cx="' + cx + '" cy="' + (bT - 7.5) + '" r="2.5" fill="#0284C7" stroke="#FFFFFF" stroke-width="0.8" />' +
          '<circle cx="' + cx + '" cy="' + (bT - 7.5) + '" r="1" fill="#FFFFFF" />' +
          '<circle cx="' + (cx - 5) + '" cy="' + (bT - 5.5) + '" r="1.5" fill="#38BDF8" />' +
          '<circle cx="' + (cx + 5) + '" cy="' + (bT - 5.5) + '" r="1.5" fill="#38BDF8" />' +
        '</g>';
      }
    } else if (tid === 'zeus') {
      // ⚡ 썬더 스파크: 쁘띠 썬더 핀 -> 솜사탕 아기 구름과 번개 -> 별빛 번개 엠블럼 -> 샴페인 골드 스파크 링 -> 골든 스타 크라운
      if (step === 1) {
        // I. 쁘띠 썬더 핀: 끝이 둥글려진 앙증맞은 버터옐로우 미니 번개 헤어핀
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<polygon points="' + (cx + 1) + ',' + (bT - 12) + ' ' + (cx - 4) + ',' + (bT - 6) + ' ' + cx + ',' + (bT - 6) + ' ' + (cx - 2) + ',' + (bT) + ' ' + (cx + 5) + ',' + (bT - 7) + ' ' + (cx + 1) + ',' + (bT - 7) + '" fill="#FBBF24" stroke="#D97706" stroke-width="0.8" />' +
          '<circle cx="' + (cx + 4) + '" cy="' + (bT - 9) + '" r="1.2" fill="#FFFFFF" />' +
        '</g>';
      } else if (step === 2) {
        // II. 솜사탕 아기 구름과 번개: 몽실몽실 아기 구름 아래 꼬마 번개
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<circle cx="' + (cx - 4) + '" cy="' + (bT - 8) + '" r="4.2" fill="#FFFFFF" stroke="#FDE68A" stroke-width="1" />' +
          '<circle cx="' + (cx + 3) + '" cy="' + (bT - 9) + '" r="4.8" fill="#FFFFFF" stroke="#FDE68A" stroke-width="1" />' +
          '<circle cx="' + (cx - 1) + '" cy="' + (bT - 11) + '" r="3.8" fill="#FFFFFF" />' +
          '<polygon points="' + cx + ',' + (bT - 5) + ' ' + (cx - 2.5) + ',' + (bT - 1) + ' ' + cx + ',' + (bT - 1) + ' ' + (cx - 1.5) + ',' + (bT + 3) + ' ' + (cx + 2.5) + ',' + (bT - 2) + ' ' + (cx + 0.5) + ',' + (bT - 2) + '" fill="#F59E0B" />' +
        '</g>';
      } else if (step === 3) {
        // III. 별빛 번개 엠블럼: 반짝이는 미니 스타와 조화로운 스파크
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<polygon points="' + cx + ',' + (bT - 14) + ' ' + (cx + 2.5) + ',' + (bT - 8) + ' ' + (cx + 8) + ',' + (bT - 6) + ' ' + (cx + 2.5) + ',' + (bT - 4) + ' ' + cx + ',' + (bT + 2) + ' ' + (cx - 2.5) + ',' + (bT - 4) + ' ' + (cx - 8) + ',' + (bT - 6) + ' ' + (cx - 2.5) + ',' + (bT - 8) + '" fill="#FBBF24" stroke="#D97706" stroke-width="0.8" />' +
          '<circle cx="' + cx + '" cy="' + (bT - 6) + '" r="2.2" fill="#FFFFFF" />' +
          '<circle cx="' + (cx - 6) + '" cy="' + (bT - 9) + '" r="1.2" fill="#FEF08A" />' +
          '<circle cx="' + (cx + 6) + '" cy="' + (bT - 9) + '" r="1.2" fill="#FEF08A" />' +
        '</g>';
      } else if (step === 4) {
        // IV. 샴페인 골드 스파크 링: 머리 위를 비추는 골든 라이트 헤일로
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<ellipse cx="' + cx + '" cy="' + (bT - 6) + '" rx="11" ry="3.5" fill="none" stroke="#F59E0B" stroke-width="1.8" />' +
          '<circle cx="' + cx + '" cy="' + (bT - 10) + '" r="2" fill="#FEF08A" stroke="#F59E0B" stroke-width="0.7" />' +
          '<circle cx="' + (cx - 9) + '" cy="' + (bT - 6) + '" r="1.4" fill="#FFFFFF" />' +
          '<circle cx="' + (cx + 9) + '" cy="' + (bT - 6) + '" r="1.4" fill="#FFFFFF" />' +
        '</g>';
      } else {
        // V. 골든 스타 크라운: 별과 번개 모티브가 장식된 세련된 황금빛 미니 크라운
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<polygon points="' + (cx - 12) + ',' + (bT) + ' ' + (cx - 8) + ',' + (bT - 11) + ' ' + (cx - 3) + ',' + (bT - 5) + ' ' + cx + ',' + (bT - 13) + ' ' + (cx + 3) + ',' + (bT - 5) + ' ' + (cx + 8) + ',' + (bT - 11) + ' ' + (cx + 12) + ',' + (bT) + '" fill="url(#' + gradId + '_gold)" stroke="#B45309" stroke-width="0.8" />' +
          '<circle cx="' + cx + '" cy="' + (bT - 13) + '" r="1.8" fill="#FFFFFF" />' +
          '<circle cx="' + (cx - 8) + '" cy="' + (bT - 11) + '" r="1.4" fill="#FFFFFF" />' +
          '<circle cx="' + (cx + 8) + '" cy="' + (bT - 11) + '" r="1.4" fill="#FFFFFF" />' +
          '<circle cx="' + cx + '" cy="' + (bT - 6.5) + '" r="2" fill="#FEF08A" />' +
        '</g>';
      }
    } else if (tid === 'cosmic') {
      // 🌌 코스믹 우주: 토성 미니 링 -> 핑크 아기 유성 -> 은하수 미니 별자리 -> 오로라 성운 엠블럼 -> 코스믹 인피니티 헤일로
      if (step === 1) {
        // I. 파스텔 토성 미니 링: 라벤더빛 꼬마 행성과 부드러운 궤도 링
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<ellipse cx="' + cx + '" cy="' + (bT - 7) + '" rx="8.5" ry="3" fill="none" stroke="#C084FC" stroke-width="1.6" transform="rotate(-15 ' + cx + ' ' + (bT - 7) + ')" />' +
          '<circle cx="' + cx + '" cy="' + (bT - 7) + '" r="4.2" fill="#8B5CF6" stroke="#DDD6FE" stroke-width="0.8" />' +
          '<circle cx="' + (cx - 1.2) + '" cy="' + (bT - 8.2) + '" r="1.2" fill="#FFFFFF" />' +
        '</g>';
      } else if (step === 2) {
        // II. 핑크빛 아기 유성: 은은한 꼬리의 귀여운 별똥별 핀
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<path d="M ' + (cx - 10) + ' ' + (bT - 12) + ' Q ' + (cx - 4) + ' ' + (bT - 8) + ' ' + (cx + 5) + ' ' + (bT - 4) + '" stroke="#C084FC" stroke-width="2.2" stroke-linecap="round" fill="none" />' +
          '<path d="M ' + (cx - 8) + ' ' + (bT - 14) + ' Q ' + (cx - 2) + ' ' + (bT - 10) + ' ' + (cx + 5) + ' ' + (bT - 5) + '" stroke="#F472B6" stroke-width="1.4" stroke-linecap="round" fill="none" />' +
          '<polygon points="' + (cx + 6) + ',' + (bT - 7) + ' ' + (cx + 7.5) + ',' + (bT - 4) + ' ' + (cx + 10.5) + ',' + (bT - 3) + ' ' + (cx + 8) + ',' + (bT - 1) + ' ' + (cx + 9) + ',' + (bT + 2) + ' ' + (cx + 6) + ',' + (bT) + ' ' + (cx + 3) + ',' + (bT + 2) + ' ' + (cx + 4) + ',' + (bT - 1) + ' ' + (cx + 1.5) + ',' + (bT - 3) + ' ' + (cx + 4.5) + ',' + (bT - 4) + '" fill="#FEF08A" stroke="#F59E0B" stroke-width="0.6" />' +
        '</g>';
      } else if (step === 3) {
        // III. 은하수 미니 별자리: 3개의 꼬마 별이 은은한 선으로 이어진 별자리 피스
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<path d="M ' + (cx - 9) + ' ' + (bT - 5) + ' L ' + (cx - 1) + ' ' + (bT - 10) + ' L ' + (cx + 8) + ' ' + (bT - 6) + '" stroke="#DDD6FE" stroke-width="1.2" stroke-dasharray="2,2" fill="none" />' +
          '<circle cx="' + (cx - 9) + '" cy="' + (bT - 5) + '" r="2.2" fill="#8B5CF6" stroke="#FFFFFF" stroke-width="0.8" />' +
          '<circle cx="' + (cx - 1) + '" cy="' + (bT - 10) + '" r="2.8" fill="#C084FC" stroke="#FFFFFF" stroke-width="0.8" />' +
          '<circle cx="' + (cx + 8) + '" cy="' + (bT - 6) + '" r="2.2" fill="#8B5CF6" stroke="#FFFFFF" stroke-width="0.8" />' +
          '<circle cx="' + (cx - 1) + '" cy="' + (bT - 10) + '" r="1" fill="#FFFFFF" />' +
        '</g>';
      } else if (step === 4) {
        // IV. 오로라 성운 엠블럼: 몽환적인 파스텔 오로라 성운 & 반짝이
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<ellipse cx="' + cx + '" cy="' + (bT - 7) + '" rx="10.5" ry="5.5" fill="#8B5CF6" opacity="0.4" />' +
          '<ellipse cx="' + cx + '" cy="' + (bT - 7) + '" rx="7" ry="4" fill="#C084FC" opacity="0.6" />' +
          '<polygon points="' + cx + ',' + (bT - 12) + ' ' + (cx + 2) + ',' + (bT - 8) + ' ' + (cx + 6) + ',' + (bT - 7) + ' ' + (cx + 2) + ',' + (bT - 6) + ' ' + cx + ',' + (bT - 2) + ' ' + (cx - 2) + ',' + (bT - 6) + ' ' + (cx - 6) + ',' + (bT - 7) + ' ' + (cx - 2) + ',' + (bT - 8) + '" fill="#FFFFFF" />' +
        '</g>';
      } else {
        // V. 코스믹 인피니티 헤일로: 영롱한 인피니티 링 & 다이아몬드 스타
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<ellipse cx="' + (cx - 5.5) + '" cy="' + (bT - 7) + '" rx="5.5" ry="3.5" fill="none" stroke="#C084FC" stroke-width="1.8" />' +
          '<ellipse cx="' + (cx + 5.5) + '" cy="' + (bT - 7) + '" rx="5.5" ry="3.5" fill="none" stroke="#C084FC" stroke-width="1.8" />' +
          '<polygon points="' + cx + ',' + (bT - 12) + ' ' + (cx + 2) + ',' + (bT - 8) + ' ' + (cx + 6) + ',' + (bT - 7) + ' ' + (cx + 2) + ',' + (bT - 6) + ' ' + cx + ',' + (bT - 2) + ' ' + (cx - 2) + ',' + (bT - 6) + ' ' + (cx - 6) + ',' + (bT - 7) + ' ' + (cx - 2) + ',' + (bT - 8) + '" fill="#FEF08A" stroke="#FFFFFF" stroke-width="0.6" />' +
          '<circle cx="' + cx + '" cy="' + (bT - 7) + '" r="1.2" fill="#FFFFFF" />' +
        '</g>';
      }
    }

    return '<svg class="rank-bg-svg-layer rank-theme-' + tid + ' rank-step-' + step + '" width="' + totalW + '" height="' + totalH + '" viewBox="0 0 ' + totalW + ' ' + totalH + '" style="position:absolute;left:-' + padX + 'px;top:-' + padY + 'px;pointer-events:none;z-index:1;overflow:visible;">' +
      defsContent +
      growthContent +
    '</svg>';
  }

  // 아바타 HTML 렌더링 (25단계 상징 랭크 백그라운드 & 입체 프레임 결합)
  function renderAvatarHtml(level, profile, options) {
    var opts = options || {};
    var size = opts.size || 38;
    var compact = (opts.compact === true);
    var settings = (profile && profile.settings) || {};
    var avatarType = settings.avatarType || 'robot';
    var customUrl = (settings.customAvatarUrl) || (profile && profile.avatarUrl) || '';
    var withRankBg = (opts.withRankBg !== false);
    var rankTheme = getRankThemeInfo(level);

    var innerFrameHtml = '';
    var borderW = compact ? '2px' : '2.5px';
    var boxRadius = compact ? '10px' : '14px';

    if (avatarType === 'custom' && customUrl && customUrl.length > 5) {
      innerFrameHtml = '<div class="custom-avatar-frame avatar-inner-box" style="width:' + size + 'px;height:' + size + 'px;border-radius:' + boxRadius + ';overflow:hidden;border:' + borderW + ' solid ' + rankTheme.mainColor + ';position:relative;background:#fff;display:flex;align-items:center;justify-content:center;z-index:2;box-shadow:0 0 10px ' + rankTheme.glow + ';box-sizing:border-box;">' +
        '<img src="' + customUrl + '" alt="아바타" style="width:100%;height:100%;object-fit:cover;display:block;">' +
        '<span class="avatar-lv-pill" style="position:absolute;bottom:0;right:0;background:' + rankTheme.badgeGradient + ';color:#fff;font-size:' + (compact ? '8px' : '9.5px') + ';padding:0 ' + (compact ? '3px' : '5px') + ';border-radius:4px 0 0 0;font-weight:800;letter-spacing:-0.2px;line-height:1.2;box-shadow:0 -1px 3px rgba(0,0,0,0.3);">' + rankTheme.icon + ' ' + rankTheme.roman + '</span>' +
      '</div>';
    } else {
      innerFrameHtml = '<div class="robot-avatar-frame avatar-inner-box" style="width:' + size + 'px;height:' + size + 'px;border-radius:' + boxRadius + ';overflow:hidden;background:var(--surface-2);border:' + borderW + ' solid ' + rankTheme.mainColor + ';display:flex;align-items:center;justify-content:center;position:relative;z-index:2;box-shadow:0 0 10px ' + rankTheme.glow + ';box-sizing:border-box;">' +
        getRobotAvatarSvg(level, size) +
        '<span class="avatar-lv-pill" style="position:absolute;bottom:0;right:0;background:' + rankTheme.badgeGradient + ';color:#fff;font-size:' + (compact ? '8px' : '9.5px') + ';padding:0 ' + (compact ? '3px' : '5px') + ';border-radius:4px 0 0 0;font-weight:800;letter-spacing:-0.2px;line-height:1.2;box-shadow:0 -1px 3px rgba(0,0,0,0.3);">' + rankTheme.icon + ' ' + rankTheme.roman + '</span>' +
      '</div>';
    }

    if (!withRankBg) {
      return innerFrameHtml;
    }

    var wingsSvg = getRankWingsSvg(level, size, opts);
    return '<div class="avatar-rank-aura-wrap rank-theme-' + rankTheme.id + ' rank-step-' + rankTheme.subStep + '" title="' + rankTheme.stepFullName + ' — ' + rankTheme.evolutionDesc + '" style="position:relative;display:inline-flex;align-items:center;justify-content:center;overflow:visible;">' +
      wingsSvg +
      innerFrameHtml +
    '</div>';
  }

  // 초상권 및 사진 사용 준수 안내 모달 (#TASK-ES-249)
  function showAvatarLegalNotice(onAgree) {
    if (typeof document === 'undefined') return;
    var overlay = document.createElement('div');
    overlay.id = 'modalAvatarLegalNotice';
    overlay.className = 'modal-backdrop active';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;';
    overlay.innerHTML = 
      '<div style="background:var(--card,#fff);border-radius:16px;max-width:400px;width:100%;padding:20px;text-align:left;box-shadow:0 8px 30px rgba(0,0,0,0.2);">' +
        '<div style="font-weight:900;font-size:1.0625rem;color:var(--ink);margin-bottom:8px;display:flex;align-items:center;gap:6px;">' +
          '<span>⚖️ 초상권 및 사진 사용 준수 안내</span>' +
        '</div>' +
        '<div style="font-size:0.8125rem;color:var(--ink-soft);line-height:1.5;margin-bottom:16px;">' +
          '아워골 아바타 제작을 위해 업로드하는 사진은 본인의 사진이거나 정당한 사용 권한을 보유한 사진이어야 합니다.<br><br>' +
          '타인의 초상권, 저작권, 인격권을 침해하는 이미지는 사전 예고 없이 삭제 조치될 수 있습니다. (Notice & Takedown 준수)' +
        '</div>' +
        '<div style="display:flex;gap:8px;justify-content:flex-end;">' +
          '<button type="button" class="btn btn-ghost btn-sm" id="btnLegalNoticeCancel" style="min-height:36px;border-radius:8px;">취소</button>' +
          '<button type="button" class="btn btn-primary btn-sm" id="btnLegalNoticeAgree" style="min-height:36px;border-radius:8px;">동의하고 사진 선택</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    var cleanup = function () {
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    };
    var cancelBtn = overlay.querySelector('#btnLegalNoticeCancel');
    if (cancelBtn) cancelBtn.onclick = cleanup;
    var agreeBtn = overlay.querySelector('#btnLegalNoticeAgree');
    if (agreeBtn) {
      agreeBtn.onclick = function () {
        cleanup();
        if (onAgree) onAgree();
      };
    }
  }

  // 아바타 모달 열기
  function openAvatarModal(deps) {
    var profile = deps.profile || (deps.state && deps.state.profile) || {};
    var saveProfile = deps.saveProfile;
    var toast = deps.toast || function (m) { console.log(m); };
    var openModal = deps.openModal;
    var closeModal = deps.closeModal;
    var onAvatarChanged = deps.onAvatarChanged || function () {};

    var settings = profile.settings = profile.settings || {};
    var curType = settings.avatarType || 'robot';
    var curCustomUrl = settings.customAvatarUrl || '';
    var curLevel = deps.currentLevel || profile.level || 1;
    var curThemeId = settings.avatarThemeId || 1;
    var maxCrafts = getMaxCrafts(profile);
    var remainingCrafts = getRemainingCrafts(profile);
    var userNick = profile.nickname || '회원';
    var savedList = getSavedAvatars(profile);

    var todayForPeriod = new Date();
    var defaultPeriodEnd = todayForPeriod;
    var defaultPeriodStart = new Date(todayForPeriod.getTime() - 29 * 24 * 60 * 60 * 1000);
    var toDateInputValue = function (d) {
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    };

    var html = '<div class="modal-sheet-inner" style="max-width:560px;margin:0 auto;text-align:left;">' +
      '<div class="modal-header-custom" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">' +
        '<div style="font-weight:900;font-size:1.1875rem;color:var(--ink);">아바타 설정</div>' +
        '<div style="font-size:0.8125rem;color:var(--ink-soft);font-weight:700;">' +
          '아바타 제작 잔여: <strong id="topRemainingCraftsTxt" style="color:' + (remainingCrafts > 0 ? 'var(--emerald)' : '#EF4444') + ';">' + remainingCrafts + '회</strong> / <span id="topMaxCraftsSpan">' + maxCrafts + '회</span>' +
        '</div>' +
      '</div>' +

      '<div style="background:var(--surface-2);border:1px solid var(--border-soft);border-radius:12px;padding:10px 14px;font-size:0.8125rem;color:var(--ink-soft);line-height:1.45;margin-bottom:16px;">' +
        '💡 <strong>아바타 제작 안내</strong>: 신규 가입 시 <strong>기본 3회</strong>(기존 계정 최대 10회)가 제공되며, <strong>7일 연속 체크인</strong>할 때마다 제작권 1회가 자동 보너스로 충전됩니다.<br>' +
        '제작된 아바타는 <strong>내 아바타 서랍</strong>에 영구 보관되며 횟수 차감 없이 언제든 자유롭게 변경·착용할 수 있습니다.' +
      '</div>' +

      // 5대 상징 랭크 백그라운드 안내 카드 (#TASK-ES-159)
      '<div id="avatarRankThemeCard" class="avatar-rank-summary-card" style="background:linear-gradient(135deg, ' + getRankThemeInfo(curLevel).mainColor + '18, ' + getRankThemeInfo(curLevel).subColor + '10);border:1px solid ' + getRankThemeInfo(curLevel).mainColor + '40;border-radius:14px;padding:12px 14px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;gap:12px;">' +
        '<div style="display:flex;align-items:center;gap:10px;">' +
          '<div style="width:40px;height:40px;border-radius:10px;background:var(--card, #fff);border:1.5px solid ' + getRankThemeInfo(curLevel).mainColor + ';display:flex;align-items:center;justify-content:center;font-size:1.4rem;box-shadow:0 0 8px ' + getRankThemeInfo(curLevel).glow + ';">' +
            getRankThemeInfo(curLevel).icon +
          '</div>' +
          '<div>' +
            '<div style="font-weight:800;font-size:0.9375rem;color:var(--ink);display:flex;align-items:center;gap:6px;">' +
              getRankThemeInfo(curLevel).title +
              '<span style="background:' + getRankThemeInfo(curLevel).badgeGradient + ';color:#fff;font-size:0.75rem;padding:1px 6px;border-radius:6px;font-weight:800;">Lv.' + curLevel + '</span>' +
            '</div>' +
            '<div style="font-size:0.78125rem;color:var(--ink-soft);margin-top:2px;">' + getRankThemeInfo(curLevel).desc + '</div>' +
          '</div>' +
        '</div>' +
        '<div style="text-align:right;flex-shrink:0;">' +
          (getRankThemeInfo(curLevel).nextTier ?
            '<div style="font-size:0.72rem;color:var(--ink-soft);">다음 진화</div><div style="font-size:0.8125rem;font-weight:700;color:' + getRankThemeInfo(curLevel).nextTier.mainColor + ';">' + getRankThemeInfo(curLevel).nextTier.icon + ' ' + getRankThemeInfo(curLevel).nextTier.name + ' (Lv.' + getRankThemeInfo(curLevel).nextLv + ')</div>' :
            '<div style="font-size:0.75rem;font-weight:800;color:var(--violet);">🌌 우주 마스터 달성</div>'
          ) +
        '</div>' +
      '</div>' +

      // 탭 토글
      '<div class="format-toggle" id="avatarTypeToggle" style="margin-bottom:18px;display:flex;background:var(--surface-3);border-radius:10px;padding:3px;">' +
        '<div class="format-opt ' + (curType === 'robot' ? 'active' : '') + '" data-avatartype="robot" style="flex:1;text-align:center;padding:8px;border-radius:8px;font-weight:800;font-size:.875rem;cursor:pointer;">🤖 초록 로봇 (성장형)</div>' +
        '<div class="format-opt ' + (curType === 'custom' ? 'active' : '') + '" data-avatartype="custom" style="flex:1;text-align:center;padding:8px;border-radius:8px;font-weight:800;font-size:.875rem;cursor:pointer;">🎨 만화형 3등신 아바타</div>' +
      '</div>' +

      // 로봇 아바타 선택 섹션
      '<div id="secRobotAvatar" style="display:' + (curType === 'robot' ? 'block' : 'none') + ';">' +
        '<div style="background:var(--surface-2);border:1px solid var(--border-soft);border-radius:14px;padding:16px;text-align:center;">' +
          '<div style="width:72px;height:72px;margin:0 auto;display:flex;align-items:center;justify-content:center;">' +
            getRobotAvatarSvg(curLevel, 68) +
          '</div>' +
          '<div style="margin-top:10px;font-weight:800;font-size:1rem;color:var(--ink);">현재 성장 단계: Lv.' + curLevel + '</div>' +
          '<div style="font-size:.78125rem;color:var(--ink-soft);margin-top:4px;">기록과 실천이 쌓일수록 안테나, 귀마개, 가슴 엠블럼, 날개가 진화합니다.</div>' +
        '</div>' +
      '</div>' +

      // 만화형 3등신 아바타 섹션
      '<div id="secCustomAvatar" style="display:' + (curType === 'custom' ? 'block' : 'none') + ';">' +
        // 제작 로딩 슬롯
        '<div id="avatarMakerLoadingSlot" style="display:none;background:var(--surface-2);border:1px solid var(--border-soft);border-radius:14px;"></div>' +

        // 결과 및 등록 박스
        '<div id="avatarMakerResultBox" style="background:var(--surface-2);border:1px solid var(--border-soft);border-radius:14px;padding:18px 14px;text-align:center;">' +
          '<div id="customAvatarPreviewBox" style="width:110px;height:110px;border-radius:20px;overflow:hidden;border:2.5px solid var(--emerald);background:#fff;margin:0 auto;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(16,185,129,0.18);">' +
            (curCustomUrl ? '<img src="' + curCustomUrl + '" style="width:100%;height:100%;object-fit:cover;">' : '<span style="font-size:2.8rem;">👤</span>') +
          '</div>' +
          '<div id="customAvatarMetaText" style="margin-top:10px;">' +
            '<div style="font-weight:800;font-size:.9375rem;color:var(--ink);">내 사진 기반 만화형 3등신 아바타</div>' +
            '<div style="font-size:.75rem;color:var(--ink-soft);margin-top:2px;">사진을 업로드한 후 [내 사진으로 아바타 제작]을 누르면 Gemini 비전 AI가 맞춤형 아바타를 제작합니다.</div>' +
          '</div>' +
          '<div style="margin-top:14px;display:flex;justify-content:center;gap:6px;flex-wrap:wrap;">' +
            '<input type="file" id="customAvatarFileInput" accept="image/*" style="display:none;">' +
            '<button type="button" class="btn btn-ghost btn-sm" id="btnUploadAvatarPhoto" style="font-size:.8125rem;">📷 사진 선택하기</button>' +
            '<button type="button" class="btn btn-primary btn-sm" id="btnRunCraftAvatar" style="font-size:.8125rem;display:none;">' +
              '✨ 내 사진으로 아바타 제작 <span id="craftBtnCountSpan">(' + remainingCrafts + '/' + maxCrafts + '회)</span>' +
            '</button>' +
          '</div>' +

          // 상시 7일 연속 체크인 충전 안내 배너 (#TASK-ES-125)
          '<div id="avatarStreakRechargeBanner" style="margin-top:10px;background:linear-gradient(135deg, rgba(245,158,11,0.12), rgba(239,68,68,0.08));border:1px solid rgba(245,158,11,0.3);border-radius:10px;padding:8px 12px;font-size:0.75rem;color:#B45309;font-weight:700;display:flex;align-items:center;justify-content:center;gap:6px;">' +
            '<span>🔥</span><span>7일 연속 체크인 시 아바타 제작권 1회 자동 충전!</span>' +
          '</div>' +

          // [TASK-ES-122] 아바타 생성 기준 기간 설정 섹션
          '<div id="avatarPeriodSection" style="margin-top:12px;text-align:left;">' +
            '<button type="button" class="btn btn-ghost btn-sm" id="btnSetAvatarPeriod" style="font-size:.8125rem;width:100%;">' +
              '📅 아바타 생성 기준 기간 정하기 <span id="avatarPeriodSummarySpan" style="font-weight:700;color:var(--emerald);"></span>' +
            '</button>' +
            '<div id="avatarPeriodInputs" style="display:none;margin-top:8px;background:var(--surface-3, #F1F5F9);border:1px solid var(--border-soft);border-radius:12px;padding:12px;">' +
              '<div style="display:flex;align-items:center;gap:8px;">' +
                '<input type="date" id="avatarPeriodStartInput" value="' + toDateInputValue(defaultPeriodStart) + '" style="flex:1;min-width:0;padding:6px 8px;border-radius:8px;border:1px solid var(--border-soft);background:var(--surface-1,#fff);color:var(--ink);">' +
                '<span style="color:var(--ink-soft);">~</span>' +
                '<input type="date" id="avatarPeriodEndInput" value="' + toDateInputValue(defaultPeriodEnd) + '" style="flex:1;min-width:0;padding:6px 8px;border-radius:8px;border:1px solid var(--border-soft);background:var(--surface-1,#fff);color:var(--ink);">' +
              '</div>' +
              '<div id="avatarPeriodErrorText" style="display:none;color:#EF4444;font-size:.75rem;margin-top:6px;font-weight:700;">종료일은 시작일보다 빠를 수 없어요.</div>' +
              '<div style="font-size:.75rem;color:var(--ink-soft);line-height:1.5;margin-top:10px;">설정한 기간의 내 목표, 팀, 기록들을 분석하여<br>그에 맞는 MBTI와 좌우명을 가진 아바타를 생성합니다.</div>' +
            '</div>' +
          '</div>' +
        '</div>' +


        // [TASK-ES-127] 320종 MBTI 페르소나 도감 아코디언
        '<div style="margin-top:12px;background:var(--surface-2);border:1px solid var(--border-soft);border-radius:14px;padding:10px 12px;">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;" id="btnToggle320PersonaCatalog">' +
            '<div style="font-weight:900;font-size:.875rem;color:var(--ink);display:flex;align-items:center;gap:6px;">' +
              '<span>🧬 320종 MBTI 페르소나 도감</span>' +
              '<span style="font-size:.71875rem;background:var(--emerald-surface,#ECFDF5);color:var(--emerald);padding:2px 6px;border-radius:10px;font-weight:800;">16유형 × 20종</span>' +
            '</div>' +
            '<div id="toggle320Arrow" style="font-size:.75rem;color:var(--ink-soft);">펼치기 ▼</div>' +
          '</div>' +
          '<div id="persona320CatalogSlot" style="display:none;margin-top:10px;border-top:1px dashed var(--border-soft);padding-top:10px;">' +
            '<input type="text" id="inputSearchPersona320" placeholder="테마명, MBTI, 키워드 검색 (예: INTJ, 체스, 러너)..." style="width:100%;box-sizing:border-box;padding:6px 10px;border-radius:8px;border:1px solid var(--border-soft);font-size:.8125rem;background:var(--surface-1,#fff);color:var(--ink);margin-bottom:8px;">' +
            '<div id="persona320GroupTabs" style="display:flex;gap:4px;overflow-x:auto;padding-bottom:6px;-webkit-overflow-scrolling:touch;margin-bottom:8px;">' +
              '<button type="button" class="btn-group-tab active" data-group="ALL" style="flex-shrink:0;padding:4px 8px;border-radius:6px;font-size:11px;font-weight:800;border:1px solid var(--border-soft);background:var(--emerald);color:#fff;cursor:pointer;">전체 (320)</button>' +
              '<button type="button" class="btn-group-tab" data-group="NT" style="flex-shrink:0;padding:4px 8px;border-radius:6px;font-size:11px;font-weight:800;border:1px solid var(--border-soft);background:var(--surface-1,#fff);color:var(--ink-soft);cursor:pointer;">분석형 NT (80)</button>' +
              '<button type="button" class="btn-group-tab" data-group="NF" style="flex-shrink:0;padding:4px 8px;border-radius:6px;font-size:11px;font-weight:800;border:1px solid var(--border-soft);background:var(--surface-1,#fff);color:var(--ink-soft);cursor:pointer;">외교형 NF (80)</button>' +
              '<button type="button" class="btn-group-tab" data-group="SJ" style="flex-shrink:0;padding:4px 8px;border-radius:6px;font-size:11px;font-weight:800;border:1px solid var(--border-soft);background:var(--surface-1,#fff);color:var(--ink-soft);cursor:pointer;">관리자형 SJ (80)</button>' +
              '<button type="button" class="btn-group-tab" data-group="SP" style="flex-shrink:0;padding:4px 8px;border-radius:6px;font-size:11px;font-weight:800;border:1px solid var(--border-soft);background:var(--surface-1,#fff);color:var(--ink-soft);cursor:pointer;">탐험가형 SP (80)</button>' +
            '</div>' +
            '<div id="persona320ItemsContainer" style="max-height:220px;overflow-y:auto;display:grid;grid-template-columns:repeat(auto-fill, minmax(140px, 1fr));gap:6px;-webkit-overflow-scrolling:touch;padding-right:2px;">' +
            '</div>' +
          '</div>' +
        '</div>' +

        // 내 아바타 서랍 (누적 보관함) 섹션 (#TASK-ES-119)
        '<div style="margin-top:14px;background:var(--surface-2);border:1px solid var(--border-soft);border-radius:14px;padding:12px 14px;">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
            '<div style="font-weight:900;font-size:.875rem;color:var(--ink);">🎨 내 아바타 서랍 <span id="savedAvatarsCountSpan" style="font-size:.75rem;color:var(--ink-soft);font-weight:700;">(' + savedList.length + '/10개)</span></div>' +
            '<div style="font-size:.75rem;color:var(--emerald);font-weight:800;">언제든 0회 차감 변경</div>' +
          '</div>' +
          '<div id="savedAvatarsDeckSlot">' +
            renderSavedAvatarsDeckHtml(savedList, curCustomUrl, curCustomUrl) +
          '</div>' +
        '</div>' +
      '</div>' +

      // 하단 액션 버튼 (아바타 적용하기는 차감 없이 언제든 저장 가능)
      '<div style="display:flex;gap:10px;margin-top:20px;">' +
        '<button type="button" class="btn btn-ghost" id="btnCancelAvatarModal" style="flex:1;">닫기</button>' +
        '<button type="button" class="btn btn-primary" id="btnSaveAvatarModal" style="flex:2;">아바타 적용하기</button>' +
      '</div>' +
    '</div>';

    openModal(html, function (sheet) {
      var selectedType = curType;
      var newCustomUrl = curCustomUrl;
      var lastUploadedImg = null;
      var lastUploadedDataUrl = '';
      var currentFeatures = null;
      var chosenTheme = getThemeById(curThemeId);
      var periodStart = defaultPeriodStart;
      var periodEnd = defaultPeriodEnd;
      var currentPersona = null;
      (function preloadCurrentPersona() {
        for (var pi = 0; pi < savedList.length; pi++) {
          if (savedList[pi].url === curCustomUrl && savedList[pi].mbti) {
            currentPersona = { mbti: savedList[pi].mbti, motto: savedList[pi].motto };
            break;
          }
        }
      })();

      var typeToggle = sheet.querySelector('#avatarTypeToggle');
      var secRobot = sheet.querySelector('#secRobotAvatar');
      var secCustom = sheet.querySelector('#secCustomAvatar');
      var btnUpload = sheet.querySelector('#btnUploadAvatarPhoto');
      var btnRunCraft = sheet.querySelector('#btnRunCraftAvatar');
      var fileInput = sheet.querySelector('#customAvatarFileInput');
      var previewBox = sheet.querySelector('#customAvatarPreviewBox');
      var metaText = sheet.querySelector('#customAvatarMetaText');
      var loadingSlot = sheet.querySelector('#avatarMakerLoadingSlot');
      var resultBox = sheet.querySelector('#avatarMakerResultBox');
      var craftCountSpan = sheet.querySelector('#craftBtnCountSpan');
      var topRemainingTxt = sheet.querySelector('#topRemainingCraftsTxt');
      var btnSave = sheet.querySelector('#btnSaveAvatarModal');
      var btnCancel = sheet.querySelector('#btnCancelAvatarModal');
      var btnSetPeriod = sheet.querySelector('#btnSetAvatarPeriod');
      var periodInputsBox = sheet.querySelector('#avatarPeriodInputs');
      var periodStartInput = sheet.querySelector('#avatarPeriodStartInput');
      var periodEndInput = sheet.querySelector('#avatarPeriodEndInput');
      var periodErrorText = sheet.querySelector('#avatarPeriodErrorText');
      var periodSummarySpan = sheet.querySelector('#avatarPeriodSummarySpan');

      if (btnCancel) btnCancel.onclick = closeModal;

      // [TASK-ES-122] 아바타 생성 기준 기간 정하기
      function updatePeriodSummaryLabel() {
        if (!periodSummarySpan) return;
        periodSummarySpan.textContent = '· ' + toDateInputValue(periodStart).slice(5) + ' ~ ' + toDateInputValue(periodEnd).slice(5);
      }
      updatePeriodSummaryLabel();

      if (btnSetPeriod && periodInputsBox) {
        btnSetPeriod.onclick = function () {
          periodInputsBox.style.display = (periodInputsBox.style.display === 'none' || !periodInputsBox.style.display) ? 'block' : 'none';
        };
      }

      function handlePeriodInputChange() {
        if (!periodStartInput || !periodEndInput) return;
        var s = new Date(periodStartInput.value + 'T00:00:00');
        var e = new Date(periodEndInput.value + 'T23:59:59');
        if (isNaN(s.getTime()) || isNaN(e.getTime()) || e.getTime() < s.getTime()) {
          if (periodErrorText) periodErrorText.style.display = 'block';
          return;
        }
        if (periodErrorText) periodErrorText.style.display = 'none';
        periodStart = s;
        periodEnd = e;
        updatePeriodSummaryLabel();
      }
      if (periodStartInput) periodStartInput.onchange = handlePeriodInputChange;
      if (periodEndInput) periodEndInput.onchange = handlePeriodInputChange;

      // 탭 토글
      if (typeToggle) {
        typeToggle.querySelectorAll('.format-opt').forEach(function (opt) {
          opt.onclick = function () {
            typeToggle.querySelectorAll('.format-opt').forEach(function (o) { o.classList.remove('active'); });
            opt.classList.add('active');
            selectedType = opt.getAttribute('data-avatartype');
            secRobot.style.display = selectedType === 'robot' ? 'block' : 'none';
            secCustom.style.display = selectedType === 'custom' ? 'block' : 'none';
          };
        });
      }

      function updateRemainingUI() {
        var r = getRemainingCrafts(profile);
        var total = getMaxCrafts(profile);
        if (craftCountSpan) craftCountSpan.textContent = '(' + r + '/' + total + '회)';
        if (topRemainingTxt) {
          topRemainingTxt.textContent = r + '회';
          topRemainingTxt.style.color = r > 0 ? 'var(--emerald)' : '#EF4444';
        }
        var topMaxSpan = sheet.querySelector('#topMaxCraftsSpan');
        if (topMaxSpan) topMaxSpan.textContent = total + '회';
        if (btnRunCraft) {
          btnRunCraft.disabled = r <= 0;
          if (r <= 0) btnRunCraft.title = '제작 횟수(10회)를 모두 소진했습니다 (' + total + '회). 7일 연속 체크인 시 1회가 자동 충전됩니다.'; // /10회 호환
        }
      }

      function updateCustomAvatarView() {
        previewBox.innerHTML = '<img src="' + newCustomUrl + '" style="width:100%;height:100%;object-fit:cover;">';
        var themeMbtiBadge = chosenTheme.mbti ? ('<span style="font-size:10px;background:' + (chosenTheme.subColor || '#EEF2FF') + ';color:' + (chosenTheme.color || '#4F46E5') + ';padding:2px 6px;border-radius:6px;font-weight:800;border:1px solid ' + (chosenTheme.color || '#4F46E5') + '40;">' + chosenTheme.mbti + '</span>') : '';
        metaText.innerHTML = '<div style="font-weight:800;font-size:1rem;color:var(--ink);display:flex;align-items:center;justify-content:center;gap:6px;">' +
          themeMbtiBadge +
          '<span>' + chosenTheme.icon + '</span>' +
          '<span>' + chosenTheme.name + '</span>' +
        '</div>' +
        '<div style="font-size:.78125rem;color:var(--emerald);font-weight:700;margin-top:3px;">🎨 320종 MBTI 맞춤형 웹툰 아바타 완성!</div>' +
        '<div style="font-size:.75rem;color:var(--ink-soft);margin-top:2px;">' + chosenTheme.cat + (chosenTheme.kw ? (' (' + chosenTheme.kw + ')') : '') + ' · 장비: ' + chosenTheme.gear + '</div>' +
        (currentPersona ? '<div style="font-size:.8125rem;color:var(--ink);font-weight:800;margin-top:6px;">🧬 ' + currentPersona.mbti + ' · "' + currentPersona.motto + '"</div>' : '');
      }

      // [#TASK-ES-119] 내 아바타 서랍 UI 새로고침
      function refreshSavedAvatarsDeck() {
        var list = getSavedAvatars(profile);
        var deckSlot = sheet.querySelector('#savedAvatarsDeckSlot');
        var countSpan = sheet.querySelector('#savedAvatarsCountSpan');
        if (deckSlot) {
          deckSlot.innerHTML = renderSavedAvatarsDeckHtml(list, profile.settings.customAvatarUrl || '', newCustomUrl);
          bindSavedDeckEvents();
        }
        if (countSpan) {
          countSpan.textContent = '(' + list.length + '/10개)';
        }
      }

      // [#TASK-ES-119] 내 아바타 서랍 카드 클릭 및 삭제 이벤트 바인딩
      function bindSavedDeckEvents() {
        var cards = sheet.querySelectorAll('.saved-avatar-card');
        cards.forEach(function (card) {
          card.onclick = function (e) {
            if (e.target.closest('.btn-del-saved-avatar')) return;
            var avaId = card.getAttribute('data-ava-id');
            var list = getSavedAvatars(profile);
            var item = null;
            for (var i = 0; i < list.length; i++) {
              if (list[i].id === avaId) { item = list[i]; break; }
            }
            if (item) {
              newCustomUrl = item.url;
              chosenTheme = getThemeById(item.themeId);
              currentPersona = item.mbti ? { mbti: item.mbti, motto: item.motto } : null;
              previewBox.innerHTML = '<img src="' + newCustomUrl + '" style="width:100%;height:100%;object-fit:cover;">';
              if (metaText) {
                metaText.innerHTML = '<div style="font-weight:800;font-size:1rem;color:var(--ink);display:flex;align-items:center;justify-content:center;gap:6px;">' +
                  '<span>' + (item.themeIcon || chosenTheme.icon) + '</span>' +
                  '<span>' + (item.themeName || chosenTheme.name) + '</span>' +
                '</div>' +
                '<div style="font-size:.78125rem;color:var(--emerald);font-weight:700;margin-top:3px;">🎨 서랍에서 아바타가 선택되었습니다!</div>' +
                '<div style="font-size:.75rem;color:var(--ink-soft);margin-top:2px;">하단 [아바타 적용하기]를 누르면 즉시 착용됩니다. (차감 0회)</div>' +
                (currentPersona ? '<div style="font-size:.8125rem;color:var(--ink);font-weight:800;margin-top:6px;">🧬 ' + currentPersona.mbti + ' · "' + currentPersona.motto + '"</div>' : '');
              }
              refreshSavedAvatarsDeck();
            }
          };
        });

        var delBtns = sheet.querySelectorAll('.btn-del-saved-avatar');
        delBtns.forEach(function (btn) {
          btn.onclick = function (e) {
            e.stopPropagation();
            var avaId = btn.getAttribute('data-ava-id');
            if (confirm('이 아바타를 서랍에서 삭제하시겠습니까?')) {
              var ok = removeSavedAvatar(profile, avaId);
              if (ok) {
                if (deps.state && deps.state.profile) {
                  deps.state.profile.settings = deps.state.profile.settings || {};
                  deps.state.profile.settings.savedAvatars = profile.settings.savedAvatars;
                }
                saveProfile();
                toast('아바타가 서랍에서 삭제되었습니다.');
                var list = getSavedAvatars(profile);
                var isCurrentUrlAlive = list.some(function (a) { return a.url === newCustomUrl; });
                if (!isCurrentUrlAlive) {
                  newCustomUrl = profile.settings.customAvatarUrl || (list[0] ? list[0].url : '');
                  if (newCustomUrl) {
                    previewBox.innerHTML = '<img src="' + newCustomUrl + '" style="width:100%;height:100%;object-fit:cover;">';
                  } else {
                    previewBox.innerHTML = '<span style="font-size:2.8rem;">👤</span>';
                  }
                }
                refreshSavedAvatarsDeck();
              } else {
                toast('현재 착용 중인 아바타는 삭제할 수 없습니다.');
              }
            }
          };
        });
      }

      // [#TASK-ES-119] 신규 아바타 제작 완료 시 자동 보관함 인입 & UI 갱신 공통 함수
      // [TASK-ES-122] persona({mbti, motto})가 있으면 함께 저장·표시
      function onAvatarCraftCompleted(dataUrl, persona) {
        newCustomUrl = dataUrl;
        currentPersona = persona || null;
        // [TASK-ES-127] 도출된 MBTI에 맞춰 320종 페르소나 온톨로지에서 맞춤형 테마 확정
        if (currentPersona && currentPersona.mbti) {
          var mbtiThemes = getThemesByMbti(currentPersona.mbti);
          if (mbtiThemes && mbtiThemes.length > 0) {
            chosenTheme = mbtiThemes[Math.floor(Math.random() * mbtiThemes.length)];
          }
        }
        loadingSlot.style.display = 'none';
        resultBox.style.display = 'block';
        updateCustomAvatarView();

        addSavedAvatar(profile, {
          id: 'ava_' + Date.now(),
          url: newCustomUrl,
          themeId: chosenTheme.id,
          themeName: chosenTheme.name,
          themeIcon: chosenTheme.icon,
          mbti: currentPersona ? currentPersona.mbti : null,
          motto: currentPersona ? currentPersona.motto : null,
          periodStart: toDateInputValue(periodStart),
          periodEnd: toDateInputValue(periodEnd),
          createdAt: new Date().toISOString()
        });
        if (deps.state && deps.state.profile) {
          deps.state.profile.settings = deps.state.profile.settings || {};
          deps.state.profile.settings.savedAvatars = profile.settings.savedAvatars;
        }
        saveProfile();
        refreshSavedAvatarsDeck();
      }

      // 초기 서랍 이벤트 바인딩
      bindSavedDeckEvents();

      // 1) 사진 선택 시: 즉시 3등신 아바타 틀 위에 사진 미리보기 적용 & '아바타 제작' 버튼 활성화
      if (btnUpload && fileInput) {
        btnUpload.onclick = function () {
          if (!profile.settings.hasAgreedAvatarLegalNotice) {
            showAvatarLegalNotice(function () {
              profile.settings.hasAgreedAvatarLegalNotice = true;
              if (saveProfile) saveProfile();
              fileInput.click();
            });
          } else {
            fileInput.click();
          }
        };
        fileInput.onchange = function (e) {
          var file = e.target.files && e.target.files[0];
          if (!file) return;
          var reader = new FileReader();
          reader.onload = function (ev) {
            lastUploadedDataUrl = ev.target.result;
            var img = new Image();
            img.onload = function () {
              lastUploadedImg = img;
              // 모바일/PC 고해상도 사진을 최대 512x512 캔버스로 리사이징 및 JPEG(0.85) 정규화
              // Vercel 4.5MB 페이로드 초과 방지 및 구글 Gemini 비전 전송 신뢰도 확보
              try {
                var normCv = document.createElement('canvas');
                var maxDim = 512;
                var w = img.naturalWidth || img.width || maxDim;
                var h = img.naturalHeight || img.height || maxDim;
                if (w > h) {
                  if (w > maxDim) { h = Math.round((h * maxDim) / w); w = maxDim; }
                } else {
                  if (h > maxDim) { w = Math.round((w * maxDim) / h); h = maxDim; }
                }
                normCv.width = w;
                normCv.height = h;
                var nctx = normCv.getContext('2d');
                nctx.drawImage(img, 0, 0, w, h);
                lastUploadedDataUrl = normCv.toDataURL('image/jpeg', 0.85);
              } catch (cvErr) {}

              currentFeatures = extractPersonalFeatures(lastUploadedImg);
              // 사진 미리보기 반영
              previewBox.innerHTML = '<img src="' + lastUploadedDataUrl + '" style="width:100%;height:100%;object-fit:cover;">';
              metaText.innerHTML = '<div style="font-weight:800;font-size:.9375rem;color:var(--ink);">사진이 업로드되었습니다!</div>' +
                '<div style="font-size:.75rem;color:var(--ink-soft);margin-top:2px;">아래 [내 사진으로 아바타 제작] 버튼을 누르면 AI가 캐릭터를 생성합니다.</div>';
              if (btnRunCraft) {
                btnRunCraft.style.display = 'inline-block';
                updateRemainingUI();
              }
              toast('사진이 등록되었습니다. [아바타 제작]을 눌러주세요!');
            };
            img.src = lastUploadedDataUrl;
          };
          reader.readAsDataURL(file);
        };
      }

      // 2) '내 사진으로 아바타 제작' 버튼 클릭 시: 실질 3회 차감 & Gemini API 호출 & 무봉제 합성
      if (btnRunCraft) {
        btnRunCraft.onclick = function () {
          if (!lastUploadedImg || !lastUploadedDataUrl) {
            toast('먼저 사진을 선택해주세요.');
            return;
          }
          var r = getRemainingCrafts(profile);
          if (r <= 0) {
            toast('아바타 제작 가능 횟수(최대 10회 / ' + getMaxCrafts(profile) + '회)를 모두 소진하였습니다. 7일 연속 체크인 시 1회가 자동 충전됩니다.');
            return;
          }

          // [TASK-ES-122] 설정 기간 내 분석할 활동(목표/기록/팀)이 전혀 없으면 제작 진행 안 함(횟수 차감 없음)
          var periodSummary = collectPeriodPersonaSummary(profile, deps.mockGroups, periodStart, periodEnd);
          if (periodSummary.isEmpty) {
            toast('설정하신 기간에 분석할 목표·팀·기록이 없어요. 기간을 다시 선택하거나 넓혀보세요.');
            return;
          }
          var personaPromise = fetchAvatarPersona(periodSummary.summaryText);

          // 횟수 실질 1회 차감!
          settings.avatarCraftCount = (settings.avatarCraftCount || 0) + 1;
          if (deps.state && deps.state.profile && deps.state.profile.settings) {
            deps.state.profile.settings.avatarCraftCount = settings.avatarCraftCount;
          }
          updateRemainingUI();

          // 나무망치 애니메이션 가동
          resultBox.style.display = 'none';
          loadingSlot.style.display = 'block';
          loadingSlot.innerHTML = getWoodHammerMakerAnimationHtml(userNick);

          var pBar = loadingSlot.querySelector('#avatarGenProgress');
          var pct = 15;
          var pTimer = setInterval(function () {
            pct += 15;
            if (pBar) pBar.style.width = Math.min(95, pct) + '%';
          }, 300);

          // [TASK-ES-046 레거시 호환 및 TASK-ES-127 320종 온톨로지 추첨]
          var randIdx = Math.floor(Math.random() * BODY_THEMES_77.length);
          var themePool = BODY_THEMES_320 && BODY_THEMES_320.length ? BODY_THEMES_320 : BODY_THEMES_77;
          randIdx = Math.floor(Math.random() * themePool.length);
          chosenTheme = themePool[randIdx];

          // Gemini API 호출
          // Gemini 3.1 Flash-Lite 비전 호출 + 사진 픽셀 기반 동적 자가 분석 이중 방어
          function handleApiFailure(errMsg) {
            clearInterval(pTimer);
            // 1. 차감되었던 횟수 복원 (사용자 기회 보존)
            settings.avatarCraftCount = Math.max(0, (settings.avatarCraftCount || 1) - 1);
            if (deps.state && deps.state.profile && deps.state.profile.settings) {
              deps.state.profile.settings.avatarCraftCount = settings.avatarCraftCount;
            }
            updateRemainingUI();

            // 2. 로딩 닫고 원래 상태 복원
            loadingSlot.style.display = 'none';
            resultBox.style.display = 'block';

            // 3. 상민님 지시 정확한 안내 문구 표시
            var noticeMsg = '죄송합니다. 현재 아워골 서버문제로 아바타 생성이 지원되지 못하고 있습니다.';
            toast(noticeMsg);
            if (metaText) {
              metaText.innerHTML = '<div style="color:var(--danger,#EF4444);font-weight:700;font-size:.875rem;margin-top:4px;">' +
                noticeMsg + '</div><div style="font-size:.75rem;color:var(--ink-soft);margin-top:2px;">(제작 횟수는 차감되지 않았습니다. 잠시 후 다시 시도해주세요.)</div>';
            }
          }

          // Gemini 3.1 Flash-Lite Image 멀티모달 생성 호출 (사용자 사진 + 테마 정보 전달)
          fetch('/api/avatar-face', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: lastUploadedDataUrl,
              theme: chosenTheme
            })
          })
          .then(function (res) {
            if (!res.ok) {
              throw new Error('API response status: ' + res.status);
            }
            return res.json();
          })
          .then(function (resData) {
            // API가 실패하거나 이미지 및 features가 모두 없으면 서버 문제 안내 멘트 노출 및 횟수 롤백
            if (!resData || !resData.ok || resData.fallback || (!resData.avatarUrl && !resData.features)) {
              handleApiFailure('AI generation failed or fell back');
              return;
            }

            clearInterval(pTimer);
            if (pBar) pBar.style.width = '100%';

            if (resData.avatarUrl) {
              // 1. Gemini 3.1 Flash-Lite Image AI가 직접 생성한 고품질 웹툰 아바타 이미지 반영
              var optImg = new Image();
              optImg.onload = function () {
                var finalUrl = resData.avatarUrl;
                try {
                  var cv = document.createElement('canvas');
                  cv.width = 256;
                  cv.height = 256;
                  var ctx = cv.getContext('2d');
                  ctx.drawImage(optImg, 0, 0, 256, 256);
                  finalUrl = cv.toDataURL('image/jpeg', 0.85);
                } catch (e) {}
                personaPromise.then(function (persona) {
                  onAvatarCraftCompleted(finalUrl, persona);
                  toast('[' + chosenTheme.name + '] AI 맞춤형 웹툰 아바타 제작 완료! 🎨✨');
                });
              };
              optImg.onerror = function () {
                personaPromise.then(function (persona) {
                  onAvatarCraftCompleted(resData.avatarUrl, persona);
                  toast('[' + chosenTheme.name + '] AI 맞춤형 웹툰 아바타 제작 완료! 🎨✨');
                });
              };
              optImg.src = resData.avatarUrl;
            } else {
              // 2. 텍스트 분석 기반 5단계 샌드위치 캔버스 폴백 렌더링
              currentFeatures = resData.features;
              setTimeout(function () {
                composite3DeformedAvatar(lastUploadedImg, chosenTheme, function (dataUrl, f) {
                  personaPromise.then(function (persona) {
                    onAvatarCraftCompleted(dataUrl, persona);
                    toast('[' + chosenTheme.name + '] 맞춤형 만화 아바타 제작 완료! 🔨✨');
                  });
                }, { features: currentFeatures });
              }, 400);
            }
          })
          .catch(function (err) {
            console.warn('Avatar API error:', err);
            handleApiFailure(err.message || 'Network error');
          });
        };
      }

      // [TASK-ES-053] 헤어스타일/표정/다른바디 변경 버튼 및 핸들러 상민님 지시로 완전 삭제

      // [TASK-ES-127] 320종 MBTI 페르소나 도감 토글, 검색 및 탭 필터링 배선
      var btnToggle320 = sheet.querySelector('#btnToggle320PersonaCatalog');
      var catalogSlot = sheet.querySelector('#persona320CatalogSlot');
      var toggle320Arrow = sheet.querySelector('#toggle320Arrow');
      var inputSearch320 = sheet.querySelector('#inputSearchPersona320');
      var groupTabs320 = sheet.querySelectorAll('.btn-group-tab');
      var catalogItemsContainer = sheet.querySelector('#persona320ItemsContainer');
      var curGroup320 = 'ALL';

      function renderPersona320Cards() {
        if (!catalogItemsContainer) return;
        var q = inputSearch320 ? inputSearch320.value.trim().toLowerCase() : '';
        var themes = (curGroup320 === 'ALL') ? getAllThemes() : getThemesByGroup(curGroup320);
        if (q) {
          themes = themes.filter(function (t) {
            return (t.name && t.name.toLowerCase().indexOf(q) !== -1) ||
                   (t.mbti && t.mbti.toLowerCase().indexOf(q) !== -1) ||
                   (t.kw && t.kw.toLowerCase().indexOf(q) !== -1) ||
                   (t.cat && t.cat.toLowerCase().indexOf(q) !== -1) ||
                   (t.desc && t.desc.toLowerCase().indexOf(q) !== -1);
          });
        }
        catalogItemsContainer.innerHTML = themes.slice(0, 80).map(function (t) {
          var isCur = chosenTheme && chosenTheme.id === t.id;
          return '<div class="persona-theme-card" data-tid="' + t.id + '" style="cursor:pointer;padding:8px 10px;border-radius:10px;border:1.5px solid ' + (isCur ? 'var(--brand,#059669)' : 'var(--border-soft,#E5E7EB)') + ';background:' + (isCur ? 'var(--emerald-surface,#ECFDF5)' : 'var(--surface-1,#fff)') + ';display:flex;flex-direction:column;gap:3px;transition:all 0.15s ease;">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;">' +
              '<span style="font-size:1.15rem;">' + t.icon + '</span>' +
              '<span style="font-size:10px;font-weight:800;color:' + (t.color || 'var(--emerald)') + ';background:' + (t.subColor || '#EEF2FF') + ';padding:1px 5px;border-radius:4px;">' + t.mbti + '</span>' +
            '</div>' +
            '<div style="font-size:11px;font-weight:800;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + t.name + '</div>' +
            '<div style="font-size:9.5px;color:var(--ink-soft);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + t.cat + ' · ' + t.gear + '</div>' +
          '</div>';
        }).join('');

        catalogItemsContainer.querySelectorAll('.persona-theme-card').forEach(function (card) {
          card.onclick = function () {
            var tid = parseInt(card.getAttribute('data-tid'), 10);
            var selected = getThemeById(tid);
            if (selected) {
              chosenTheme = selected;
              currentPersona = { mbti: selected.mbti, motto: selected.desc || selected.name };
              updateCustomAvatarView();
              renderPersona320Cards();
              toast('[' + selected.mbti + ' ' + selected.name + '] 테마가 선택되었습니다! 🧬');
            }
          };
        });
      }

      if (btnToggle320 && catalogSlot) {
        btnToggle320.onclick = function () {
          var isHidden = catalogSlot.style.display === 'none' || !catalogSlot.style.display;
          catalogSlot.style.display = isHidden ? 'block' : 'none';
          if (toggle320Arrow) {
            toggle320Arrow.textContent = isHidden ? '접기 ▲' : '펼치기 ▼';
          }
          if (isHidden && (!catalogItemsContainer.children || catalogItemsContainer.children.length === 0)) {
            renderPersona320Cards();
          }
        };
      }

      if (groupTabs320 && groupTabs320.length > 0) {
        groupTabs320.forEach(function (tab) {
          tab.onclick = function () {
            groupTabs320.forEach(function (t) {
              t.classList.remove('active');
              t.style.background = 'var(--surface-1,#fff)';
              t.style.color = 'var(--ink-soft)';
            });
            tab.classList.add('active');
            tab.style.background = 'var(--emerald)';
            tab.style.color = '#fff';
            curGroup320 = tab.getAttribute('data-group') || 'ALL';
            renderPersona320Cards();
          };
        });
      }

      if (inputSearch320) {
        inputSearch320.oninput = function () {
          renderPersona320Cards();
        };
      }

      // 4) 최종 '아바타 적용하기' 버튼 — 횟수 차감 없이 언제든 저장 & DOM 즉시 반영
      if (btnSave) {
        btnSave.onclick = function () {
          if (selectedType === 'custom' && !newCustomUrl) {
            toast('먼저 사진으로 3등신 아바타를 제작해주세요.');
            return;
          }

          settings.avatarType = selectedType;
          if (selectedType === 'custom') {
            settings.customAvatarUrl = newCustomUrl;
            settings.avatarThemeId = chosenTheme.id;
            profile.avatarUrl = newCustomUrl;
            addSavedAvatar(profile, {
              id: 'ava_' + Date.now(),
              url: newCustomUrl,
              themeId: chosenTheme.id,
              themeName: chosenTheme.name,
              themeIcon: chosenTheme.icon,
              mbti: currentPersona ? currentPersona.mbti : null,
              motto: currentPersona ? currentPersona.motto : null,
              periodStart: toDateInputValue(periodStart),
              periodEnd: toDateInputValue(periodEnd),
              createdAt: new Date().toISOString()
            });
          }

          if (deps.state && deps.state.profile) {
            deps.state.profile.settings = deps.state.profile.settings || {};
            deps.state.profile.settings.avatarType = selectedType;
            deps.state.profile.settings.avatarChangedOnce = true;
            if (selectedType === 'custom') {
              deps.state.profile.settings.customAvatarUrl = newCustomUrl;
              deps.state.profile.settings.avatarThemeId = chosenTheme.id;
              deps.state.profile.avatarUrl = newCustomUrl;
              deps.state.profile.settings.savedAvatars = profile.settings.savedAvatars;
            }
          }

          saveProfile().then(function () {
            toast('아바타가 성공적으로 적용되었습니다! 🤖✨');
            closeModal();
            if (onAvatarChanged) onAvatarChanged();

            // DOM 즉각 강제 갱신 (1번 문제 100% 영구 해결)
            try {
              var levelBadgeRow = document.getElementById('levelBadgeRow');
              if (levelBadgeRow) {
                var avatarBox = levelBadgeRow.querySelector('.custom-avatar-frame, .robot-avatar-frame, .avatar-placeholder');
                if (avatarBox && avatarBox.parentNode) {
                  var newAvatarMarkup = renderAvatarHtml(curLevel, profile, { size: 36 });
                  var tempDiv = document.createElement('div');
                  tempDiv.innerHTML = newAvatarMarkup;
                  if (tempDiv.firstElementChild) {
                    avatarBox.parentNode.replaceChild(tempDiv.firstElementChild, avatarBox);
                  }
                }
              }
            } catch (domErr) {
              console.warn('DOM instant update error:', domErr);
            }
          });
        };
      }
    });
  }


  // [TASK-ES-047 호환] 사진 기반 퍼스널 컬러 및 특징 추출
  function extractPersonalFeatures(img) {
    var defaultFeatures = getSmartFallbackFeatures();
    if (!img || typeof document === 'undefined') return defaultFeatures;

    try {
      var scanCvs = document.createElement('canvas');
      var scanW = 64;
      var scanH = 64;
      scanCvs.width = scanW;
      scanH = scanH;
      var scanCtx = scanCvs.getContext('2d');
      if (!scanCtx) return defaultFeatures;

      scanCtx.drawImage(img, 0, 0, scanW, scanH);
      var imgData = scanCtx.getImageData(0, 0, scanW, scanH).data;

      // 1. 얼굴 중심부 픽셀 샘플링 (피부톤 감지: x:22~42, y:24~44)
      var skinR = 0, skinG = 0, skinB = 0, skinCount = 0;
      for (var y = 24; y < 44; y++) {
        for (var x = 22; x < 42; x++) {
          var idx = (y * scanW + x) * 4;
          var r = imgData[idx];
          var g = imgData[idx + 1];
          var b = imgData[idx + 2];
          // 사람 피부 대략 필터링 (R > B, R > 70)
          if (r > 70 && r >= b) {
            skinR += r;
            skinG += g;
            skinB += b;
            skinCount++;
          }
        }
      }

      var chosenSkin = '#FFDFBF';
      var blushTone = 'rgba(251,113,133,0.45)';
      if (skinCount > 0) {
        var avgR = Math.round(skinR / skinCount);
        var avgG = Math.round(skinG / skinCount);
        var avgB = Math.round(skinB / skinCount);
        var brightness = (avgR * 299 + avgG * 587 + avgB * 114) / 1000;

        if (brightness > 210) {
          chosenSkin = '#FFF0E5'; // 뽀샤시 쿨베이지
          blushTone = 'rgba(253,164,175,0.45)';
        } else if (brightness > 185) {
          chosenSkin = '#FFE3D1'; // 맑은 웜베이지
          blushTone = 'rgba(251,113,133,0.45)';
        } else if (brightness > 155) {
          chosenSkin = '#FAD2B0'; // 내추럴 피치
          blushTone = 'rgba(244,114,182,0.45)';
        } else if (brightness > 125) {
          chosenSkin = '#E8B68E'; // 건강한 탠
          blushTone = 'rgba(236,72,153,0.35)';
        } else {
          chosenSkin = '#D2966E'; // 차분한 브론즈
          blushTone = 'rgba(225,29,72,0.35)';
        }
      }

      // 2. 머리 상단부 픽셀 샘플링 (헤어 컬러 감지: x:18~46, y:6~18)
      var hairR = 0, hairG = 0, hairB = 0, hairCount = 0;
      for (var hy = 6; hy < 18; hy++) {
        for (var hx = 18; hx < 46; hx++) {
          var hidx = (hy * scanW + hx) * 4;
          var hr = imgData[hidx];
          var hg = imgData[hidx + 1];
          var hb = imgData[hidx + 2];
          hairR += hr;
          hairG += hg;
          hairB += hb;
          hairCount++;
        }
      }

      var chosenHair = '#1E293B';
      var hairStyle = 'dandy';
      var hairParting = 'none';
      var hairLength = 'short';

      if (hairCount > 0) {
        var hAvgR = Math.round(hairR / hairCount);
        var hAvgG = Math.round(hairG / hairCount);
        var hAvgB = Math.round(hairB / hairCount);
        var hBrightness = (hAvgR * 299 + hAvgG * 587 + hAvgB * 114) / 1000;

        if (hBrightness < 50) {
          chosenHair = '#0F172A'; // 딥 제트블랙
        } else if (hAvgR > hAvgB + 25 && hAvgR > hAvgG) {
          chosenHair = '#78350F'; // 체스넛 브라운
        } else if (hBrightness > 110) {
          chosenHair = '#92400E'; // 골드/라이트 브라운
        } else if (hBrightness > 75) {
          chosenHair = '#451A03'; // 다크 모카
        } else {
          chosenHair = '#1E293B'; // 내추럴 흑갈색
        }
      }

      // 3. 측면 헤어 기장 감지 (어깨선/귀 옆 y:32~48 영역)
      var sideHairCount = 0;
      for (var sy = 32; sy < 48; sy++) {
        for (var sx = 6; sx < 16; sx++) {
          var sidx = (sy * scanW + sx) * 4;
          var sBri = (imgData[sidx] * 299 + imgData[sidx + 1] * 587 + imgData[sidx + 2] * 114) / 1000;
          if (sBri < 80) sideHairCount++;
        }
        for (var sx2 = 48; sx2 < 58; sx2++) {
          var sidx2 = (sy * scanW + sx2) * 4;
          var sBri2 = (imgData[sidx2] * 299 + imgData[sidx2 + 1] * 587 + imgData[sidx2 + 2] * 114) / 1000;
          if (sBri2 < 80) sideHairCount++;
        }
      }

      if (sideHairCount > 60) {
        hairLength = 'long';
        hairStyle = 'wave';
      } else if (sideHairCount > 30) {
        hairLength = 'medium';
        hairStyle = 'bob';
      } else {
        hairLength = 'short';
        // 가르마/투블럭 다양성
        var hairSeed = (skinR + hairR) % 4;
        if (hairSeed === 0) { hairStyle = 'two_block'; hairParting = 'left'; }
        else if (hairSeed === 1) { hairStyle = 'curtain'; hairParting = 'center'; }
        else if (hairSeed === 2) { hairStyle = 'spiky'; hairParting = 'none'; }
        else { hairStyle = 'dandy'; hairParting = 'none'; }
      }

      // 4. 안경 감지 (미간 및 눈 주위 명암 대비)
      var eyeBri1 = 0, eyeBri2 = 0;
      for (var ex = 18; ex < 28; ex++) {
        var eidx = (30 * scanW + ex) * 4;
        eyeBri1 += (imgData[eidx] * 299 + imgData[eidx + 1] * 587 + imgData[eidx + 2] * 114) / 1000;
      }
      var hasGlasses = (eyeBri1 / 10) < 65;

      return {
        hasGlasses: hasGlasses,
        glassesShape: hasGlasses ? 'round_wire' : 'none',
        glassesColor: '#1E293B',
        skinColor: chosenSkin,
        blushColor: blushTone,
        hair: {
          style: hairStyle,
          parting: hairParting,
          hasBangs: true,
          length: hairLength,
          color: chosenHair
        },
        eyes: {
          type: (skinR % 3 === 0) ? 'gentle_smile' : ((skinR % 3 === 1) ? 'sharp_confident' : 'round_bright'),
          hasDoubleEyelid: true
        },
        eyebrows: {
          shape: 'arched',
          color: chosenHair
        },
        mouth: {
          expression: 'bright_smile'
        },
        similarityNote: '사진의 실제 톤을 정밀 반영한 맞춤형 만화 캐릭터'
      };
    } catch (e) {
      console.warn('extractPersonalFeatures error:', e);
      return defaultFeatures;
    }
  }

  // [TASK-ES-047 호환] 3등신 만화형 헤드 렌더러
  function drawCartoonHead(ctx, cx, cy, r, features, theme) {
    // composite3DeformedAvatar 샌드위치 렌더러와 통합
    return true;
  }

  // ================= 상황별 다이나믹 아바타 리액션 프리셋 (#TASK-ES-249) =================
  var DYNAMIC_SITUATIONS = {
    checkin_1: {
      id: 'checkin_1',
      title: '일상 맞이',
      icon: '🌅',
      greeting: '돌아왔구나! 오늘은 어떤 하루야?',
      badge: '1회차',
      themeColor: '#10B981',
      subColor: '#ECFDF5',
      prop: 'heart',
      desc: '당일 첫 체크인 완료 시 반갑게 맞이하는 활기찬 아바타'
    },
    checkin_2: {
      id: 'checkin_2',
      title: '오후 몰입',
      icon: '☕',
      greeting: '열심히 달리는 중! 커피 한 잔의 여유 ☕',
      badge: '2회차',
      themeColor: '#F59E0B',
      subColor: '#FFFBEB',
      prop: 'coffee',
      desc: '당일 2회차 체크인 시 지친 일상에 힘을 주는 커피 타임 아바타'
    },
    checkin_3: {
      id: 'checkin_3',
      title: '야간 안식',
      icon: '🌙',
      greeting: '오늘 하루도 정말 고생 많았어! 🌙',
      badge: '3회차',
      themeColor: '#6366F1',
      subColor: '#EEF2FF',
      prop: 'moon_star',
      desc: '당일 3회차 이상 체크인 시 포근한 밤과 휴식을 축복하는 아바타'
    },
    todo_done: {
      id: 'todo_done',
      title: '할일 완료',
      icon: '💪',
      greeting: '해냈다! 하나씩 클리어하는 맛! 💪',
      badge: '실천왕',
      themeColor: '#EC4899',
      subColor: '#FDF2F8',
      prop: 'dumbbell',
      desc: '세부할일을 하나씩 달성할 때마다 환호하고 힘을 불어넣는 아바타'
    },
    milestone_break: {
      id: 'milestone_break',
      title: '마일스톤 돌파',
      icon: '🏆',
      greeting: '대박! 마일스톤 정복을 축하해! 🏆',
      badge: '달성',
      themeColor: '#8B5CF6',
      subColor: '#F5F3FF',
      prop: 'trophy',
      desc: '마일스톤 및 주요 목표를 완수했을 때 트로피를 치켜드는 황금 아바타'
    }
  };

  // 상황별 시각 소품 및 말풍선이 결합된 다이나믹 아바타 SVG 생성 (#TASK-ES-249)
  function getDynamicAvatarSvg(situationKey, baseAvatar, options) {
    var opts = options || {};
    var s = opts.size || 80;
    var sit = DYNAMIC_SITUATIONS[situationKey] || DYNAMIC_SITUATIONS.checkin_1;
    var avatarSource = '';
    var isRobot = true;
    var robotLevel = 1;

    if (typeof baseAvatar === 'string' && (baseAvatar.indexOf('data:image') === 0 || baseAvatar.indexOf('http') === 0)) {
      avatarSource = baseAvatar;
      isRobot = false;
    } else if (typeof baseAvatar === 'number') {
      robotLevel = baseAvatar;
    } else if (baseAvatar && typeof baseAvatar === 'object') {
      var st = baseAvatar.settings || {};
      if (st.avatarType === 'custom' && st.customAvatarUrl) {
        avatarSource = st.customAvatarUrl;
        isRobot = false;
      } else if (baseAvatar.avatarUrl) {
        avatarSource = baseAvatar.avatarUrl;
        isRobot = false;
      }
      robotLevel = baseAvatar.level || 1;
    }

    var uid = 'dyn_' + sit.id + '_' + Math.floor(Math.random() * 10000);

    // 상황별 시각 소품 (Props) & 장식 SVG
    var propSvg = '';
    if (sit.id === 'checkin_1') {
      // 일상 맞이: 햇살 오라 + 환영 하트
      propSvg = 
        '<g class="dyn-prop-checkin1">' +
          '<circle cx="82" cy="18" r="8" fill="#F59E0B" opacity="0.3" />' +
          '<circle cx="82" cy="18" r="5" fill="#FBBF24" />' +
          '<path d="M82 9 L82 6 M82 27 L82 30 M73 18 L70 18 M91 18 L94 18" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" />' +
          '<path d="M22 20 C22 16, 17 14, 15 17 C13 14, 8 16, 8 20 C8 25, 15 30, 15 30 C15 30, 22 25, 22 20 Z" fill="#EF4444" />' +
        '</g>';
    } else if (sit.id === 'checkin_2') {
      // 오후 몰입: 김이 모락모락 피어나는 따뜻한 커피 머그잔
      propSvg = 
        '<g class="dyn-prop-checkin2">' +
          '<rect x="68" y="58" width="18" height="15" rx="3.5" fill="#B45309" stroke="#78350F" stroke-width="1.5" />' +
          '<path d="M86 61 C91 61, 91 68, 86 68" stroke="#78350F" stroke-width="2" fill="none" />' +
          '<path d="M73 54 Q75 50 73 47" stroke="#F59E0B" stroke-width="1.5" stroke-linecap="round" fill="none" />' +
          '<path d="M79 54 Q81 50 79 47" stroke="#F59E0B" stroke-width="1.5" stroke-linecap="round" fill="none" />' +
          '<circle cx="16" cy="22" r="3" fill="#F59E0B" opacity="0.8" />' +
        '</g>';
    } else if (sit.id === 'checkin_3') {
      // 야간 안식: 금빛 초승달 + 반짝이는 별무리
      propSvg = 
        '<g class="dyn-prop-checkin3">' +
          '<path d="M78 12 A12 12 0 1 0 88 28 A10 10 0 0 1 78 12 Z" fill="#FBBF24" />' +
          '<polygon points="20,18 21.5,22 25.5,22 22.5,24.5 23.5,28.5 20,26 16.5,28.5 17.5,24.5 14.5,22 18.5,22" fill="#A5B4FC" />' +
          '<circle cx="28" cy="30" r="1.5" fill="#E0E7FF" />' +
          '<circle cx="70" cy="42" r="2" fill="#FDE047" />' +
        '</g>';
    } else if (sit.id === 'todo_done') {
      // 할일 완료: 승리의 덤벨 & 체크 배지
      propSvg = 
        '<g class="dyn-prop-tododone">' +
          '<circle cx="18" cy="22" r="9" fill="#10B981" />' +
          '<path d="M14 22 L17 25 L22 19" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />' +
          '<rect x="66" y="65" width="20" height="4" rx="2" fill="#64748B" />' +
          '<rect x="64" y="61" width="5" height="12" rx="2" fill="#EC4899" />' +
          '<rect x="83" y="61" width="5" height="12" rx="2" fill="#EC4899" />' +
        '</g>';
    } else if (sit.id === 'milestone_break') {
      // 마일스톤 돌파: 빛나는 황금 트로피 & 승리의 별
      propSvg = 
        '<g class="dyn-prop-milestone">' +
          '<path d="M68 58 L86 58 L83 69 Q77 74 77 77 L74 77 M75 77 L79 77 M72 79 L82 79" stroke="#B45309" stroke-width="2" fill="#F59E0B" />' +
          '<path d="M68 60 C63 60, 63 67, 68 67 M86 60 C91 60, 91 67, 86 67" stroke="#B45309" stroke-width="1.5" fill="none" />' +
          '<polygon points="77,61 78.5,65 82.5,65 79.5,67.5 80.5,71.5 77,69 73.5,71.5 74.5,67.5 71.5,65 75.5,65" fill="#FEF08A" />' +
          '<polygon points="18,14 19.5,18 23.5,18 20.5,20.5 21.5,24.5 18,22 14.5,24.5 15.5,20.5 12.5,18 16.5,18" fill="#F59E0B" />' +
        '</g>';
    }

    var avatarCore = '';
    if (!isRobot && avatarSource) {
      avatarCore = 
        '<defs>' +
          '<clipPath id="' + uid + '_clip">' +
            '<circle cx="50" cy="48" r="30" />' +
          '</clipPath>' +
        '</defs>' +
        '<circle cx="50" cy="48" r="31" fill="#FFFFFF" stroke="' + sit.themeColor + '" stroke-width="2" />' +
        '<image href="' + avatarSource + '" x="20" y="18" width="60" height="60" preserveAspectRatio="xMidYMid slice" clip-path="url(#' + uid + '_clip)" />';
    } else {
      var robSvg = getRobotAvatarSvg(robotLevel, 60);
      avatarCore = 
        '<circle cx="50" cy="48" r="30" fill="#ECFDF5" stroke="' + sit.themeColor + '" stroke-width="2" />' +
        '<g transform="translate(20, 18) scale(0.6)">' +
          robSvg +
        '</g>';
    }

    return '<svg class="dynamic-avatar-svg situation-' + sit.id + '" width="' + s + '" height="' + s + '" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + sit.title + ' 아바타">' +
      '<circle cx="50" cy="50" r="46" fill="' + sit.subColor + '" stroke="' + sit.themeColor + '" stroke-width="2.5" />' +
      avatarCore +
      propSvg +
      '<rect x="18" y="78" width="64" height="15" rx="7.5" fill="' + sit.themeColor + '" />' +
      '<text x="50" y="89" text-anchor="middle" font-size="8" font-weight="900" fill="#FFFFFF" letter-spacing="-0.2px">' + sit.badge + ' · ' + sit.title + '</text>' +
    '</svg>';
  }

  // 다이나믹 아바타 리액션 도감 데이터 조회 (#TASK-ES-249)
  function getDynamicAlbum(profile) {
    var p = profile || {};
    var s = p.settings = p.settings || {};
    var album = s.dynamicAlbum;
    if (!Array.isArray(album) || album.length === 0) {
      album = Object.keys(DYNAMIC_SITUATIONS).map(function (key) {
        var sit = DYNAMIC_SITUATIONS[key];
        return {
          situationKey: key,
          title: sit.title,
          icon: sit.icon,
          greeting: sit.greeting,
          badge: sit.badge,
          themeColor: sit.themeColor,
          unlocked: true,
          isEquipped: key === (s.equippedSituationKey || 'checkin_1'),
          customAvatarUrl: s.customAvatarUrl || '',
          updatedAt: new Date().toISOString()
        };
      });
      s.dynamicAlbum = album;
    }
    return album;
  }

  // 다이나믹 아바타 리액션 도감 데이터 영속화 (#TASK-ES-249)
  function saveDynamicAlbum(profile, album) {
    if (!profile) return;
    profile.settings = profile.settings || {};
    profile.settings.dynamicAlbum = album;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('ourgoal_dynamic_album', JSON.stringify(album));
      }
    } catch (e) {}
  }

  // VIP 멤버십 패스 및 잔여 생성권 정보 조회 (#TASK-ES-249)
  function getVipPassInfo(profile) {
    var p = profile || {};
    var s = p.settings = p.settings || {};
    var claimed = !!s.dynamicVipPassClaimed;
    var crafts = (typeof s.remainingDynamicCrafts === 'number') ? s.remainingDynamicCrafts : 2;
    return {
      isVip: !!p.isVip || !!s.isVip,
      vipTier: s.vipTier || 'Gold VIP',
      freePassesClaimed: claimed,
      remainingDynamicCrafts: crafts,
      totalCreated: s.totalDynamicCreated || 0
    };
  }

  // 무료 VIP 체험권(+2회 추가 생성권) 수령 (#TASK-ES-249)
  function claimFreeVipPass(profile) {
    if (!profile) return null;
    var s = profile.settings = profile.settings || {};
    s.dynamicVipPassClaimed = true;
    s.remainingDynamicCrafts = (typeof s.remainingDynamicCrafts === 'number' ? s.remainingDynamicCrafts : 0) + 2;
    return getVipPassInfo(profile);
  }

  // 상황별 다이나믹 아바타 도감 모달 (#TASK-ES-249)
  function openDynamicAlbumModal(deps) {
    var d = deps || {};
    var profile = d.profile || (d.state && d.state.profile) || {};
    var saveProfile = d.saveProfile || function () {};
    var toast = d.toast || function (m) { console.log(m); };
    var openModal = d.openModal || (typeof window !== 'undefined' && window.openModal);
    var closeModal = d.closeModal || (typeof window !== 'undefined' && window.closeModal);
    var renderHome = d.renderHome;
    var renderSettingsScreen = d.renderSettingsScreen;

    var album = getDynamicAlbum(profile);
    var vipInfo = getVipPassInfo(profile);
    var settings = profile.settings = profile.settings || {};
    var equippedKey = settings.equippedSituationKey || 'checkin_1';
    var curCustomUrl = settings.customAvatarUrl || profile.avatarUrl || '';
    var curLevel = profile.level || 1;

    var html = '<div class="dynamic-avatar-album-modal" style="max-width:620px;margin:0 auto;text-align:left;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;gap:8px;">' +
        '<div>' +
          '<div style="font-weight:900;font-size:1.25rem;color:var(--ink);display:flex;align-items:center;gap:6px;">' +
            '<span>📖 아바타 리액션 도감</span>' +
            '<span class="dynamic-vip-pill" style="font-size:0.75rem;padding:2px 8px;border-radius:20px;background:linear-gradient(135deg,#F59E0B,#D97706);color:#fff;font-weight:800;">👑 VIP 멤버십</span>' +
          '</div>' +
          '<div style="font-size:0.8125rem;color:var(--ink-soft);margin-top:2px;">1·2·3회차 기록 및 마일스톤 달성 시 나를 반겨주는 생생한 아바타 컬렉션</div>' +
        '</div>' +
        '<button type="button" class="btn btn-ghost btn-sm" id="btnCloseDynamicAlbumModal" style="min-height:36px;padding:6px 12px;border-radius:10px;">닫기</button>' +
      '</div>' +

      '<div class="dynamic-vip-banner" style="background:linear-gradient(135deg, rgba(245,158,11,0.12), rgba(99,102,241,0.08));border:1.5px solid rgba(245,158,11,0.35);border-radius:14px;padding:12px 16px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">' +
        '<div style="min-width:180px;">' +
          '<div style="font-weight:800;font-size:0.9375rem;color:var(--ink);display:flex;align-items:center;gap:6px;">' +
            '<span>✨ ' + vipInfo.vipTier + ' 패스 혜택</span>' +
            '<span id="dynamicPassCountBadge" style="font-size:0.75rem;background:var(--emerald);color:#fff;padding:1px 6px;border-radius:6px;font-weight:700;">잔여 ' + vipInfo.remainingDynamicCrafts + '회</span>' +
          '</div>' +
          '<div style="font-size:0.78125rem;color:var(--ink-soft);margin-top:3px;">모든 상황별 리액션 무제한 장착 & 프리미엄 테마 우선 개방</div>' +
        '</div>' +
        '<button type="button" class="btn btn-sm" id="btnClaimFreeVipPass" style="min-height:36px;padding:7px 14px;font-size:0.8125rem;font-weight:800;border-radius:10px;background:' + (vipInfo.freePassesClaimed ? 'var(--surface-3)' : 'linear-gradient(135deg,#F59E0B,#EF4444)') + ';color:' + (vipInfo.freePassesClaimed ? 'var(--ink-soft)' : '#fff') + ';border:none;flex-shrink:0;">' +
          (vipInfo.freePassesClaimed ? '✓ VIP 패스 활성화됨' : '🎁 무료 VIP 체험권 받기 (+2회)') +
        '</button>' +
      '</div>' +

      '<div class="dynamic-avatar-grid" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(250px, 1fr));gap:12px;max-height:420px;overflow-y:auto;padding-right:4px;-webkit-overflow-scrolling:touch;">';

    var keys = Object.keys(DYNAMIC_SITUATIONS);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      var sit = DYNAMIC_SITUATIONS[k];
      var isEq = (k === equippedKey);
      var svgPreview = getDynamicAvatarSvg(k, curCustomUrl || curLevel, { size: 74 });

      html += '<div class="dynamic-avatar-card ' + (isEq ? 'equipped' : '') + '" style="background:var(--card, #fff);border:' + (isEq ? '2px solid ' + sit.themeColor : '1px solid var(--border-soft)') + ';border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:10px;box-shadow:' + (isEq ? '0 0 12px ' + sit.themeColor + '30' : '0 2px 6px rgba(0,0,0,0.04)') + ';transition:all 0.2s ease;">' +
        '<div style="display:flex;align-items:center;gap:12px;">' +
          '<div style="flex-shrink:0;">' + svgPreview + '</div>' +
          '<div style="min-width:0;flex:1;">' +
            '<div style="display:flex;align-items:center;gap:6px;">' +
              '<span style="font-weight:900;font-size:0.9375rem;color:var(--ink);">' + sit.title + '</span>' +
              '<span style="font-size:0.6875rem;padding:1px 6px;border-radius:6px;background:' + sit.subColor + ';color:' + sit.themeColor + ';font-weight:800;border:1px solid ' + sit.themeColor + '40;">' + sit.badge + '</span>' +
            '</div>' +
            '<div style="font-size:0.75rem;color:var(--ink-soft);margin-top:4px;line-height:1.35;">' + sit.desc + '</div>' +
          '</div>' +
        '</div>' +

        '<div style="background:var(--surface-2);border-radius:10px;padding:8px 10px;font-size:0.8125rem;color:var(--ink);display:flex;align-items:center;gap:6px;border-left:3px solid ' + sit.themeColor + ';">' +
          '<span style="font-size:1.1rem;line-height:1;">💬</span>' +
          '<span style="font-style:italic;font-weight:600;">"' + sit.greeting + '"</span>' +
        '</div>' +

        '<div style="margin-top:auto;display:flex;justify-content:flex-end;">' +
          (isEq ?
            '<button type="button" class="btn btn-sm btn-equip-dynamic-avatar btn-equipped" data-situation="' + k + '" style="min-height:34px;padding:5px 12px;font-size:0.75rem;font-weight:800;border-radius:8px;background:' + sit.themeColor + ';color:#fff;border:none;cursor:default;" disabled>✓ 현재 대표 반응</button>' :
            '<button type="button" class="btn btn-ghost btn-sm btn-equip-dynamic-avatar" data-situation="' + k + '" style="min-height:34px;padding:5px 12px;font-size:0.75rem;font-weight:700;border-radius:8px;border-color:var(--border-soft);color:var(--ink);">대표 반응으로 착용</button>'
          ) +
        '</div>' +
      '</div>';
    }

    html += '</div></div>';

    if (!openModal) {
      console.warn('openModal not found for openDynamicAlbumModal');
      return;
    }

    openModal(html, function (sheet) {
      var btnClose = sheet.querySelector('#btnCloseDynamicAlbumModal');
      if (btnClose && closeModal) {
        btnClose.onclick = function () {
          if (typeof triggerHapticFeedback === 'function') triggerHapticFeedback(12);
          closeModal();
        };
      }

      var btnVip = sheet.querySelector('#btnClaimFreeVipPass');
      if (btnVip) {
        btnVip.onclick = function () {
          if (typeof triggerHapticFeedback === 'function') triggerHapticFeedback(12);
          var updated = claimFreeVipPass(profile);
          if (saveProfile) saveProfile();
          toast('🎉 무료 VIP 체험 패스가 지급되었습니다! (추가 생성권 +2회)');
          btnVip.textContent = '✓ VIP 패스 활성화됨';
          btnVip.style.background = 'var(--surface-3)';
          btnVip.style.color = 'var(--ink-soft)';
          var badge = sheet.querySelector('#dynamicPassCountBadge');
          if (badge && updated) {
            badge.textContent = '잔여 ' + updated.remainingDynamicCrafts + '회';
          }
        };
      }

      sheet.addEventListener('click', function (e) {
        var targetBtn = e.target.closest('.btn-equip-dynamic-avatar');
        if (!targetBtn || targetBtn.disabled) return;
        var sitKey = targetBtn.getAttribute('data-situation');
        if (!sitKey || !DYNAMIC_SITUATIONS[sitKey]) return;

        if (typeof triggerHapticFeedback === 'function') triggerHapticFeedback(12);
        settings.equippedSituationKey = sitKey;
        if (saveProfile) saveProfile();
        toast('✨ ' + DYNAMIC_SITUATIONS[sitKey].title + ' 아바타가 기본 반응으로 활성화되었습니다!');

        if (renderHome) renderHome();
        if (renderSettingsScreen) renderSettingsScreen();

        if (closeModal) closeModal();
      });
    });
  }

  var api = {
    DEFAULT_BASE_CRAFTS: DEFAULT_BASE_CRAFTS,
    LEGACY_MAX_CRAFTS: LEGACY_MAX_CRAFTS,
    MAX_AVATAR_CHANGES: MAX_AVATAR_CHANGES,
    isLegacyAccount: isLegacyAccount,
    getMaxCrafts: getMaxCrafts,
    maybeGrantStreakBonus: maybeGrantStreakBonus,
    BODY_THEMES_77: BODY_THEMES_77,
    BODY_THEMES_320: typeof BODY_THEMES_320 !== 'undefined' ? BODY_THEMES_320 : [],
    getAllThemes: getAllThemes,
    getTheme: getThemeById,
    getThemeById: getThemeById,
    getThemesByMbti: getThemesByMbti,
    getThemesByGroup: getThemesByGroup,
    searchThemes: searchThemes,
    getRobotAvatarSvg: getRobotAvatarSvg,
    getWoodHammerMakerAnimationHtml: getWoodHammerMakerAnimationHtml,
    getSmartFallbackFeatures: getSmartFallbackFeatures,
    extractPersonalFeatures: extractPersonalFeatures,
    drawCartoonHead: drawCartoonHead,
    CARTOON_HAIRSTYLES: ["dandy","two_block","bob","wave","curly","ponytail","straight","spiky"],
    CARTOON_EXPRESSIONS: ["bright_smile","gentle_smile","sharp_confident","droopy_cute"],
    composite3DeformedAvatar: composite3DeformedAvatar,
    getRemainingCrafts: getRemainingCrafts,
    renderAvatarHtml: renderAvatarHtml,
    openAvatarModal: openAvatarModal,
    getSavedAvatars: getSavedAvatars,
    addSavedAvatar: addSavedAvatar,
    removeSavedAvatar: removeSavedAvatar,
    RANK_THEMES_5: RANK_THEMES_5,
    getRankThemeInfo: getRankThemeInfo,
    getRankWingsSvg: getRankWingsSvg,
    DYNAMIC_SITUATIONS: DYNAMIC_SITUATIONS,
    getDynamicAvatarSvg: getDynamicAvatarSvg,
    getDynamicAlbum: getDynamicAlbum,
    saveDynamicAlbum: saveDynamicAlbum,
    getVipPassInfo: getVipPassInfo,
    claimFreeVipPass: claimFreeVipPass,
    openDynamicAlbumModal: openDynamicAlbumModal
  };

  return api;
}));
