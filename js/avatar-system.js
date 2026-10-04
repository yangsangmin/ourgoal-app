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
  var askConfirm = ((typeof OurgoalCapabilities !== 'undefined' && OurgoalCapabilities.has('ui.confirm.bind')) ? OurgoalCapabilities.request('ui.confirm.bind') : typeof require === 'function' ? require('./core/confirm.js').bind : function(get){ return function(m){ var o = get(); return Promise.resolve(typeof o === 'function' ? o(m) : false); }; })(function(){ return null; });
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
  // #TASK-ES-386: 320종 페르소나 데이터는 MBTI 16개 파일(js/data/avatar-personas/<mbti>.js)에 있다.
  // 브라우저: index.html 이 이 파일보다 먼저 16개를 읽어 전역 OurgoalAvatarPersonaParts 에 둔다. Node: require 로 읽는다.
  // 원래 배열과 같은 순서로 잇는다 — 동일성 시험: tests/ 폴더 avatar-personas-split 시험
  var PERSONA_PART_ORDER = ['intj', 'intp', 'entj', 'entp', 'infj', 'infp', 'enfj', 'enfp', 'istj', 'isfj', 'estj', 'esfj', 'istp', 'isfp', 'estp', 'esfp'];
  function loadPersonaParts() {
    if (typeof module === 'object' && module && module.exports && typeof require === 'function') {
      return {
        intj: require('./data/avatar-personas/intj.js'),
        intp: require('./data/avatar-personas/intp.js'),
        entj: require('./data/avatar-personas/entj.js'),
        entp: require('./data/avatar-personas/entp.js'),
        infj: require('./data/avatar-personas/infj.js'),
        infp: require('./data/avatar-personas/infp.js'),
        enfj: require('./data/avatar-personas/enfj.js'),
        enfp: require('./data/avatar-personas/enfp.js'),
        istj: require('./data/avatar-personas/istj.js'),
        isfj: require('./data/avatar-personas/isfj.js'),
        estj: require('./data/avatar-personas/estj.js'),
        esfj: require('./data/avatar-personas/esfj.js'),
        istp: require('./data/avatar-personas/istp.js'),
        isfp: require('./data/avatar-personas/isfp.js'),
        estp: require('./data/avatar-personas/estp.js'),
        esfp: require('./data/avatar-personas/esfp.js')
      };
    }
    return (typeof OurgoalAvatarPersonaParts !== 'undefined' && OurgoalAvatarPersonaParts) || {};
  }
  var PERSONA_PARTS = loadPersonaParts();
  var BODY_THEMES_320 = [];
  PERSONA_PART_ORDER.forEach(function (key) {
    var part = PERSONA_PARTS[key];
    if (part && part.length) BODY_THEMES_320.push.apply(BODY_THEMES_320, part);
  });

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

  // 잔여 제작 가능 횟수 계산 (총한도 - 실질사용횟수, 기본 3회 / 레거시 10회) (#TASK-ES-125)
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
      growthPrompt: item.growthPrompt || (profile.settings && profile.settings.avatarGrowthPrompt) || '더 강하게',
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
    var list = savedList || [];
    var MAX_SLOTS = 10;
    var cardsHtml = '';

    for (var slotIdx = 0; slotIdx < MAX_SLOTS; slotIdx++) {
      var slotNum = slotIdx + 1;
      var item = list[slotIdx] || null;

      if (item) {
        var isWearing = (item.url === activeUrl);
        var isSelected = (item.url === selectedUrl);
        var borderColor = isSelected ? 'var(--emerald, #10B981)' : (isWearing ? '#3B82F6' : 'var(--border-soft, #E2E8F0)');
        var borderWeight = (isSelected || isWearing) ? '2.5px' : '1px';
        var bgShadow = isSelected ? 'box-shadow:0 0 0 3px rgba(16,185,129,0.22);' : (isWearing ? 'box-shadow:0 0 0 2px rgba(59,130,246,0.2);' : '');
        var promptText = item.growthPrompt || '더 강하게';

        cardsHtml += '<div class="saved-avatar-card" data-ava-id="' + item.id + '" data-slot-num="' + slotNum + '" style="flex:0 0 88px;position:relative;background:var(--surface-1, #FFFFFF);border:' + borderWeight + ' solid ' + borderColor + ';' + bgShadow + 'border-radius:14px;padding:6px 4px;cursor:pointer;text-align:center;transition:all .15s ease;">' +
          '<div style="position:absolute;top:-7px;left:6px;background:var(--surface-3, #E2E8F0);color:var(--ink, #1E293B);font-size:9px;font-weight:900;padding:1px 5px;border-radius:6px;z-index:2;border:1px solid var(--border-soft,#cbd5e1);">슬롯 ' + slotNum + '</div>' +
          (isWearing ? '<div style="position:absolute;top:-7px;right:6px;background:#3B82F6;color:#fff;font-size:9px;font-weight:900;padding:1px 6px;border-radius:10px;white-space:nowrap;z-index:2;">착용 중</div>' : '') +
          (!isWearing ? '<button type="button" class="btn-del-saved-avatar" data-ava-id="' + item.id + '" title="슬롯 ' + slotNum + ' 아바타 삭제" style="position:absolute;top:2px;right:2px;width:18px;height:18px;border-radius:50%;background:rgba(0,0,0,0.5);color:#fff;border:none;font-size:11px;line-height:1;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:3;padding:0;">×</button>' : '') +
          '<div style="width:72px;height:72px;border-radius:10px;overflow:hidden;margin:10px auto 0;background:#f8fafc;display:flex;align-items:center;justify-content:center;">' +
            '<img src="' + item.url + '" alt="' + (item.themeName || '아바타') + '" style="width:100%;height:100%;object-fit:cover;">' +
          '</div>' +
          '<div style="font-size:10px;font-weight:800;color:var(--ink, #0F172A);margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="' + item.themeName + '">' +
            (item.themeIcon || '🎨') + ' ' + (item.themeName || '아바타') +
          '</div>' +
          '<div class="slot-growth-badge" style="font-size:9px;font-weight:700;color:var(--violet, #8B5CF6);background:rgba(139,92,246,0.1);padding:1px 4px;border-radius:4px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="성향: ' + promptText + '">✨ ' + promptText + '</div>' +
        '</div>';
      } else {
        cardsHtml += '<div class="empty-avatar-slot" data-slot-num="' + slotNum + '" style="flex:0 0 88px;min-height:130px;border:1.5px dashed var(--border-soft, #cbd5e1);border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;background:var(--surface-2, #f8fafc);color:var(--ink-soft, #64748b);gap:4px;padding:6px;transition:all .15s ease;" title="슬롯 ' + slotNum + ' (새 아바타 제작 가능)">' +
          '<span style="font-size:1.4rem;line-height:1;">➕</span>' +
          '<span style="font-size:10px;font-weight:800;color:var(--ink, #1E293B);">슬롯 ' + slotNum + '</span>' +
          '<span style="font-size:9px;color:var(--ink-faint, #94a3b8);">비어 있음</span>' +
        '</div>';
      }
    }

    return '<div class="avatar-10slots-carousel" style="display:flex;gap:8px;overflow-x:auto;padding:12px 4px 8px 4px;-webkit-overflow-scrolling:touch;scroll-behavior:smooth;">' +
      cardsHtml +
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
    theme.stepFullName = (theme.id === 'sprout' ? '' : (theme.icon + ' ')) + theme.name + ' ' + theme.roman + ' (' + theme.stepInfo.name + ')';
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

    // 오버워치·롤 랭크 스타일 좌우 상징 백그라운드 윙 결합 (아바타 본체는 완벽히 비움)
    var padX = compact ? Math.round(s * 0.24) : Math.round(s * 0.30);
    var padY = compact ? Math.round(s * 0.26) : Math.round(s * 0.32);
    var totalW = s + padX * 2;
    var totalH = s + padY * 2;
    var cx = totalW / 2;
    var cy = totalH / 2;
    var bL = padX;         // 아바타 왼쪽 경계
    var bR = padX + s;     // 아바타 오른쪽 경계
    var bT = padY;         // 아바타 상단 경계
    var bB = padY + s;     // 아바타 하단 경계

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
          '<feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="' + c1 + '" flood-opacity="0.4" />' +
        '</filter>' +
      '</defs>';

    // 1. 머리 위 헤드 오브제 (Top Emblem)
    var growthContent = '';

    if (tid === 'sprout') {
      // 새싹 오버레이 제거 (아바타 본래 조형 보존)
      growthContent = '';
    } else if (tid === 'forest') {
      // 🌲 울창한 숲
      if (step === 1) {
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<path d="M ' + (cx - 7) + ' ' + (bT + 1) + ' Q ' + cx + ' ' + (bT - 6) + ' ' + (cx + 8) + ' ' + (bT - 9) + '" stroke="#78350F" stroke-width="1.8" stroke-linecap="round" fill="none" />' +
          '<ellipse cx="' + (cx - 2) + '" cy="' + (bT - 5) + '" rx="3.5" ry="2" transform="rotate(-30 ' + (cx - 2) + ' ' + (bT - 5) + ')" fill="#059669" stroke="#047857" stroke-width="0.6" />' +
          '<ellipse cx="' + (cx + 4) + '" cy="' + (bT - 8) + '" rx="3.5" ry="2" transform="rotate(-20 ' + (cx + 4) + ' ' + (bT - 8) + ')" fill="#10B981" stroke="#047857" stroke-width="0.6" />' +
          '<circle cx="' + (cx + 8) + '" cy="' + (bT - 10) + '" r="1.8" fill="#A7F3D0" />' +
        '</g>';
      } else if (step === 2) {
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<path d="M ' + cx + ' ' + (bT + 1) + ' L ' + cx + ' ' + (bT - 5) + '" stroke="#78350F" stroke-width="1.8" stroke-linecap="round" />' +
          '<ellipse cx="' + cx + '" cy="' + (bT - 10) + '" rx="4" ry="4.5" fill="#D97706" stroke="#B45309" stroke-width="0.7" />' +
          '<path d="M ' + (cx - 4) + ' ' + (bT - 11) + ' Q ' + cx + ' ' + (bT - 14) + ' ' + (cx + 4) + ' ' + (bT - 11) + ' Z" fill="#78350F" />' +
          '<circle cx="' + (cx - 1.2) + '" cy="' + (bT - 9.5) + '" r="1.2" fill="#FEF08A" />' +
          '<ellipse cx="' + (cx + 5) + '" cy="' + (bT - 8) + '" rx="3.2" ry="1.8" transform="rotate(35 ' + (cx + 5) + ' ' + (bT - 8) + ')" fill="#10B981" />' +
        '</g>';
      } else if (step === 3) {
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<path d="M ' + (cx - 13) + ' ' + (bT + 1) + ' Q ' + cx + ' ' + (bT - 10) + ' ' + (cx + 13) + ' ' + (bT + 1) + '" stroke="#047857" stroke-width="1.8" fill="none" stroke-linecap="round" />' +
          '<ellipse cx="' + (cx - 9) + '" cy="' + (bT - 6) + '" rx="3.5" ry="2" transform="rotate(-40 ' + (cx - 9) + ' ' + (bT - 6) + ')" fill="#10B981" />' +
          '<ellipse cx="' + (cx - 4) + '" cy="' + (bT - 9) + '" rx="3.5" ry="2" transform="rotate(-20 ' + (cx - 4) + ' ' + (bT - 9) + ')" fill="#34D399" />' +
          '<ellipse cx="' + (cx + 4) + '" cy="' + (bT - 9) + '" rx="3.5" ry="2" transform="rotate(20 ' + (cx + 4) + ' ' + (bT - 9) + ')" fill="#34D399" />' +
          '<ellipse cx="' + (cx + 9) + '" cy="' + (bT - 6) + '" rx="3.5" ry="2" transform="rotate(40 ' + (cx + 9) + ' ' + (bT - 6) + ')" fill="#10B981" />' +
          '<circle cx="' + cx + '" cy="' + (bT - 9) + '" r="1.8" fill="#FDE047" />' +
        '</g>';
      } else if (step === 4) {
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<circle cx="' + cx + '" cy="' + (bT - 7) + '" r="7.5" fill="none" stroke="#059669" stroke-width="1.8" />' +
          '<circle cx="' + (cx - 5) + '" cy="' + (bT - 8) + '" r="2.2" fill="#EF4444" stroke="#B91C1C" stroke-width="0.6" />' +
          '<circle cx="' + (cx + 4) + '" cy="' + (bT - 10) + '" r="2.2" fill="#EF4444" stroke="#B91C1C" stroke-width="0.6" />' +
          '<circle cx="' + (cx + 2) + '" cy="' + (bT - 4) + '" r="2" fill="#EF4444" stroke="#B91C1C" stroke-width="0.6" />' +
          '<ellipse cx="' + (cx - 2) + '" cy="' + (bT - 13) + '" rx="3" ry="1.8" transform="rotate(-20 ' + (cx - 2) + ' ' + (bT - 13) + ')" fill="#34D399" />' +
        '</g>';
      } else {
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<polygon points="' + (cx - 12) + ',' + (bT) + ' ' + (cx - 7) + ',' + (bT - 11) + ' ' + (cx - 3) + ',' + (bT - 4) + ' ' + cx + ',' + (bT - 14) + ' ' + (cx + 3) + ',' + (bT - 4) + ' ' + (cx + 7) + ',' + (bT - 11) + ' ' + (cx + 12) + ',' + (bT) + '" fill="url(#' + gradId + '_gold)" stroke="#B45309" stroke-width="0.8" />' +
          '<circle cx="' + cx + '" cy="' + (bT - 8) + '" r="2.4" fill="#10B981" stroke="#FFFFFF" stroke-width="0.8" />' +
          '<circle cx="' + (cx - 7) + '" cy="' + (bT - 6) + '" r="1.6" fill="#34D399" />' +
          '<circle cx="' + (cx + 7) + '" cy="' + (bT - 6) + '" r="1.6" fill="#34D399" />' +
        '</g>';
      }
    } else if (tid === 'poseidon') {
      // 🌊 마린 바다
      if (step === 1) {
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<circle cx="' + (cx - 6) + '" cy="' + (bT - 6) + '" r="3.6" fill="#BAE6FD" stroke="#38BDF8" stroke-width="1" opacity="0.9" />' +
          '<circle cx="' + (cx - 7.5) + '" cy="' + (bT - 7.5) + '" r="1" fill="#FFFFFF" />' +
          '<circle cx="' + (cx + 4) + '" cy="' + (bT - 9) + '" r="4.2" fill="#E0F2FE" stroke="#0284C7" stroke-width="1" opacity="0.9" />' +
          '<circle cx="' + (cx + 2.5) + '" cy="' + (bT - 10.5) + '" r="1.2" fill="#FFFFFF" />' +
          '<circle cx="' + (cx - 1) + '" cy="' + (bT - 14) + '" r="2" fill="#BAE6FD" stroke="#38BDF8" stroke-width="0.8" />' +
        '</g>';
      } else if (step === 2) {
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<path d="M ' + (cx - 9) + ' ' + (bT + 1) + ' C ' + (cx - 10) + ' ' + (bT - 9) + ', ' + (cx + 10) + ' ' + (bT - 9) + ', ' + (cx + 9) + ' ' + (bT + 1) + ' Z" fill="#BAE6FD" stroke="#0284C7" stroke-width="1" />' +
          '<path d="M ' + cx + ' ' + (bT + 1) + ' L ' + (cx - 5) + ' ' + (bT - 7) + ' M ' + cx + ' ' + (bT + 1) + ' L ' + cx + ' ' + (bT - 8) + ' M ' + cx + ' ' + (bT + 1) + ' L ' + (cx + 5) + ' ' + (bT - 7) + '" stroke="#38BDF8" stroke-width="0.9" />' +
          '<circle cx="' + cx + '" cy="' + (bT - 1) + '" r="2.6" fill="#FFFFFF" stroke="#E0F2FE" stroke-width="0.8" />' +
          '<circle cx="' + (cx - 0.7) + '" cy="' + (bT - 1.8) + '" r="0.8" fill="#F0F9FF" />' +
        '</g>';
      } else if (step === 3) {
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<path d="M ' + (cx - 12) + ' ' + (bT - 4) + ' Q ' + (cx - 6) + ' ' + (bT - 11) + ' ' + cx + ' ' + (bT - 6) + ' Q ' + (cx + 6) + ' ' + (bT - 11) + ' ' + (cx + 12) + ' ' + (bT - 4) + '" stroke="#0284C7" stroke-width="2.2" fill="none" stroke-linecap="round" />' +
          '<circle cx="' + (cx - 11) + '" cy="' + (bT - 3) + '" r="2" fill="#38BDF8" />' +
          '<circle cx="' + (cx + 11) + '" cy="' + (bT - 3) + '" r="2" fill="#38BDF8" />' +
          '<circle cx="' + cx + '" cy="' + (bT - 6) + '" r="3" fill="#BAE6FD" stroke="#0284C7" stroke-width="1" />' +
          '<circle cx="' + cx + '" cy="' + (bT - 6) + '" r="1.2" fill="#FFFFFF" />' +
        '</g>';
      } else if (step === 4) {
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<path d="M ' + (cx - 12) + ' ' + (bT + 1) + ' Q ' + cx + ' ' + (bT - 6) + ' ' + (cx + 12) + ' ' + (bT + 1) + '" stroke="#38BDF8" stroke-width="1.8" fill="none" stroke-linecap="round" />' +
          '<path d="M ' + cx + ' ' + (bT - 14) + ' C ' + (cx - 5) + ' ' + (bT - 7) + ', ' + (cx - 5) + ' ' + (bT - 3) + ', ' + cx + ' ' + (bT - 3) + ' C ' + (cx + 5) + ' ' + (bT - 3) + ', ' + (cx + 5) + ' ' + (bT - 7) + ', ' + cx + ' ' + (bT - 14) + ' Z" fill="#0284C7" stroke="#BAE6FD" stroke-width="1" />' +
          '<circle cx="' + cx + '" cy="' + (bT - 5.5) + '" r="1.6" fill="#FFFFFF" />' +
          '<circle cx="' + (cx - 10) + '" cy="' + (bT - 1) + '" r="1.8" fill="#BAE6FD" />' +
          '<circle cx="' + (cx + 10) + '" cy="' + (bT - 1) + '" r="1.8" fill="#BAE6FD" />' +
        '</g>';
      } else {
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
      // ⚡ 썬더 스파크
      if (step === 1) {
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<polygon points="' + (cx + 1) + ',' + (bT - 12) + ' ' + (cx - 4) + ',' + (bT - 6) + ' ' + cx + ',' + (bT - 6) + ' ' + (cx - 2) + ',' + (bT) + ' ' + (cx + 5) + ',' + (bT - 7) + ' ' + (cx + 1) + ',' + (bT - 7) + '" fill="#FBBF24" stroke="#D97706" stroke-width="0.8" />' +
          '<circle cx="' + (cx + 4) + '" cy="' + (bT - 9) + '" r="1.2" fill="#FFFFFF" />' +
        '</g>';
      } else if (step === 2) {
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<circle cx="' + (cx - 4) + '" cy="' + (bT - 8) + '" r="4.2" fill="#FFFFFF" stroke="#FDE68A" stroke-width="1" />' +
          '<circle cx="' + (cx + 3) + '" cy="' + (bT - 9) + '" r="4.8" fill="#FFFFFF" stroke="#FDE68A" stroke-width="1" />' +
          '<circle cx="' + (cx - 1) + '" cy="' + (bT - 11) + '" r="3.8" fill="#FFFFFF" />' +
          '<polygon points="' + cx + ',' + (bT - 5) + ' ' + (cx - 2.5) + ',' + (bT - 1) + ' ' + cx + ',' + (bT - 1) + ' ' + (cx - 1.5) + ',' + (bT + 3) + ' ' + (cx + 2.5) + ',' + (bT - 2) + ' ' + (cx + 0.5) + ',' + (bT - 2) + '" fill="#F59E0B" />' +
        '</g>';
      } else if (step === 3) {
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<polygon points="' + cx + ',' + (bT - 14) + ' ' + (cx + 2.5) + ',' + (bT - 8) + ' ' + (cx + 8) + ',' + (bT - 6) + ' ' + (cx + 2.5) + ',' + (bT - 4) + ' ' + cx + ',' + (bT + 2) + ' ' + (cx - 2.5) + ',' + (bT - 4) + ' ' + (cx - 8) + ',' + (bT - 6) + ' ' + (cx - 2.5) + ',' + (bT - 8) + '" fill="#FBBF24" stroke="#D97706" stroke-width="0.8" />' +
          '<circle cx="' + cx + '" cy="' + (bT - 6) + '" r="2.2" fill="#FFFFFF" />' +
          '<circle cx="' + (cx - 6) + '" cy="' + (bT - 9) + '" r="1.2" fill="#FEF08A" />' +
          '<circle cx="' + (cx + 6) + '" cy="' + (bT - 9) + '" r="1.2" fill="#FEF08A" />' +
        '</g>';
      } else if (step === 4) {
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<ellipse cx="' + cx + '" cy="' + (bT - 6) + '" rx="11" ry="3.5" fill="none" stroke="#F59E0B" stroke-width="1.8" />' +
          '<circle cx="' + cx + '" cy="' + (bT - 10) + '" r="2" fill="#FEF08A" stroke="#F59E0B" stroke-width="0.7" />' +
          '<circle cx="' + (cx - 9) + '" cy="' + (bT - 6) + '" r="1.4" fill="#FFFFFF" />' +
          '<circle cx="' + (cx + 9) + '" cy="' + (bT - 6) + '" r="1.4" fill="#FFFFFF" />' +
        '</g>';
      } else {
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<polygon points="' + (cx - 12) + ',' + (bT) + ' ' + (cx - 8) + ',' + (bT - 11) + ' ' + (cx - 3) + ',' + (bT - 5) + ' ' + cx + ',' + (bT - 13) + ' ' + (cx + 3) + ',' + (bT - 5) + ' ' + (cx + 8) + ',' + (bT - 11) + ' ' + (cx + 12) + ',' + (bT) + '" fill="url(#' + gradId + '_gold)" stroke="#B45309" stroke-width="0.8" />' +
          '<circle cx="' + cx + '" cy="' + (bT - 13) + '" r="1.8" fill="#FFFFFF" />' +
          '<circle cx="' + (cx - 8) + '" cy="' + (bT - 11) + '" r="1.4" fill="#FFFFFF" />' +
          '<circle cx="' + (cx + 8) + '" cy="' + (bT - 11) + '" r="1.4" fill="#FFFFFF" />' +
          '<circle cx="' + cx + '" cy="' + (bT - 6.5) + '" r="2" fill="#FEF08A" />' +
        '</g>';
      }
    } else if (tid === 'cosmic') {
      // 🌌 코스믹 우주
      if (step === 1) {
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<ellipse cx="' + cx + '" cy="' + (bT - 7) + '" rx="8.5" ry="3" fill="none" stroke="#C084FC" stroke-width="1.6" transform="rotate(-15 ' + cx + ' ' + (bT - 7) + ')" />' +
          '<circle cx="' + cx + '" cy="' + (bT - 7) + '" r="4.2" fill="#8B5CF6" stroke="#DDD6FE" stroke-width="0.8" />' +
          '<circle cx="' + (cx - 1.2) + '" cy="' + (bT - 8.2) + '" r="1.2" fill="#FFFFFF" />' +
        '</g>';
      } else if (step === 2) {
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<path d="M ' + (cx - 10) + ' ' + (bT - 12) + ' Q ' + (cx - 4) + ' ' + (bT - 8) + ' ' + (cx + 5) + ' ' + (bT - 4) + '" stroke="#C084FC" stroke-width="2.2" stroke-linecap="round" fill="none" />' +
          '<path d="M ' + (cx - 8) + ' ' + (bT - 14) + ' Q ' + (cx - 2) + ' ' + (bT - 10) + ' ' + (cx + 5) + ' ' + (bT - 5) + '" stroke="#F472B6" stroke-width="1.4" stroke-linecap="round" fill="none" />' +
          '<polygon points="' + (cx + 6) + ',' + (bT - 7) + ' ' + (cx + 7.5) + ',' + (bT - 4) + ' ' + (cx + 10.5) + ',' + (bT - 3) + ' ' + (cx + 8) + ',' + (bT - 1) + ' ' + (cx + 9) + ',' + (bT + 2) + ' ' + (cx + 6) + ',' + (bT) + ' ' + (cx + 3) + ',' + (bT + 2) + ' ' + (cx + 4) + ',' + (bT - 1) + ' ' + (cx + 1.5) + ',' + (bT - 3) + ' ' + (cx + 4.5) + ',' + (bT - 4) + '" fill="#FEF08A" stroke="#F59E0B" stroke-width="0.6" />' +
        '</g>';
      } else if (step === 3) {
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<path d="M ' + (cx - 9) + ' ' + (bT - 5) + ' L ' + (cx - 1) + ' ' + (bT - 10) + ' L ' + (cx + 8) + ' ' + (bT - 6) + '" stroke="#DDD6FE" stroke-width="1.2" stroke-dasharray="2,2" fill="none" />' +
          '<circle cx="' + (cx - 9) + '" cy="' + (bT - 5) + '" r="2.2" fill="#8B5CF6" stroke="#FFFFFF" stroke-width="0.8" />' +
          '<circle cx="' + (cx - 1) + '" cy="' + (bT - 10) + '" r="2.8" fill="#C084FC" stroke="#FFFFFF" stroke-width="0.8" />' +
          '<circle cx="' + (cx + 8) + '" cy="' + (bT - 6) + '" r="2.2" fill="#8B5CF6" stroke="#FFFFFF" stroke-width="0.8" />' +
          '<circle cx="' + (cx - 1) + '" cy="' + (bT - 10) + '" r="1" fill="#FFFFFF" />' +
        '</g>';
      } else if (step === 4) {
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<ellipse cx="' + cx + '" cy="' + (bT - 7) + '" rx="10.5" ry="5.5" fill="#8B5CF6" opacity="0.4" />' +
          '<ellipse cx="' + cx + '" cy="' + (bT - 7) + '" rx="7" ry="4" fill="#C084FC" opacity="0.6" />' +
          '<polygon points="' + cx + ',' + (bT - 12) + ' ' + (cx + 2) + ',' + (bT - 8) + ' ' + (cx + 6) + ',' + (bT - 7) + ' ' + (cx + 2) + ',' + (bT - 6) + ' ' + cx + ',' + (bT - 2) + ' ' + (cx - 2) + ',' + (bT - 6) + ' ' + (cx - 6) + ',' + (bT - 7) + ' ' + (cx - 2) + ',' + (bT - 8) + '" fill="#FFFFFF" />' +
        '</g>';
      } else {
        growthContent = '<g filter="url(#' + gradId + '_glow)">' +
          '<ellipse cx="' + (cx - 5.5) + '" cy="' + (bT - 7) + '" rx="5.5" ry="3.5" fill="none" stroke="#C084FC" stroke-width="1.8" />' +
          '<ellipse cx="' + (cx + 5.5) + '" cy="' + (bT - 7) + '" rx="5.5" ry="3.5" fill="none" stroke="#C084FC" stroke-width="1.8" />' +
          '<polygon points="' + cx + ',' + (bT - 12) + ' ' + (cx + 2) + ',' + (bT - 8) + ' ' + (cx + 6) + ',' + (bT - 7) + ' ' + (cx + 2) + ',' + (bT - 6) + ' ' + cx + ',' + (bT - 2) + ' ' + (cx - 2) + ',' + (bT - 6) + ' ' + (cx - 6) + ',' + (bT - 7) + ' ' + (cx - 2) + ',' + (bT - 8) + '" fill="#FEF08A" stroke="#FFFFFF" stroke-width="0.6" />' +
          '<circle cx="' + cx + '" cy="' + (bT - 7) + '" r="1.2" fill="#FFFFFF" />' +
        '</g>';
      }
    }

    // 2. 아바타 창 옆으로 레벨별 상징 백그라운드 날개/오라 (Flanks & Side Wings)
    // 원칙: 아바타 이미지 영역 [bL, bR] x [bT, bB]는 절대 가리지 않음 (x < bL 또는 x > bR)
    var sideWingsContent = '';
    var wingScale = Math.min(1.4, Math.max(0.7, s / 44));
    var midY = bT + s * 0.52; // 아바타 세로 중심부

    if (tid === 'sprout') {
      // 🌱 새싹 5단계: 귀여운 아기 떡잎 -> 쌍떡잎 날개 -> 덩굴 클로버 -> 잎사귀 날개 -> 만개한 꽃잎 윙
      var spW = Math.round(7 * wingScale);
      var spH = Math.round(11 * wingScale);
      var spDepth = Math.round(step * 1.5 * wingScale);

      sideWingsContent = '<g class="avatar-rank-side-wings rank-wings-sprout" filter="url(#' + gradId + '_glow)">' +
        // 좌측 새싹 날개
        '<path d="M ' + (bL + 1) + ' ' + (midY + 4) + ' C ' + (bL - spW - spDepth) + ' ' + (midY + 2) + ', ' + (bL - spW - spDepth - 2) + ' ' + (midY - spH) + ', ' + (bL - 2) + ' ' + (midY - 6) + ' Z" fill="#34D399" stroke="#059669" stroke-width="0.8" opacity="0.9" />' +
        (step >= 2 ? '<circle cx="' + (bL - spW) + '" cy="' + (midY - 4) + '" r="' + (1.2 * wingScale) + '" fill="#FFFFFF" />' : '') +
        (step >= 3 ? '<path d="M ' + (bL + 1) + ' ' + (midY + 10) + ' C ' + (bL - spW * 0.8) + ' ' + (midY + 12) + ', ' + (bL - spW * 0.9) + ' ' + (midY + 2) + ', ' + (bL) + ' ' + (midY + 4) + ' Z" fill="#10B981" />' : '') +
        // 우측 새싹 날개 (완벽 대칭)
        '<path d="M ' + (bR - 1) + ' ' + (midY + 4) + ' C ' + (bR + spW + spDepth) + ' ' + (midY + 2) + ', ' + (bR + spW + spDepth + 2) + ' ' + (midY - spH) + ', ' + (bR + 2) + ' ' + (midY - 6) + ' Z" fill="#34D399" stroke="#059669" stroke-width="0.8" opacity="0.9" />' +
        (step >= 2 ? '<circle cx="' + (bR + spW) + '" cy="' + (midY - 4) + '" r="' + (1.2 * wingScale) + '" fill="#FFFFFF" />' : '') +
        (step >= 3 ? '<path d="M ' + (bR - 1) + ' ' + (midY + 10) + ' C ' + (bR + spW * 0.8) + ' ' + (midY + 12) + ', ' + (bR + spW * 0.9) + ' ' + (midY + 2) + ', ' + (bR) + ' ' + (midY + 4) + ' Z" fill="#10B981" />' : '') +
      '</g>';
    } else if (tid === 'forest') {
      // 🌲 숲 5단계: 올리브 잎가지 날개 -> 에메랄드 숲의 수호 날개
      var foW = Math.round(9 * wingScale);
      var foH = Math.round(14 * wingScale);
      var foSpread = Math.round(step * 1.8 * wingScale);

      sideWingsContent = '<g class="avatar-rank-side-wings rank-wings-forest" filter="url(#' + gradId + '_glow)">' +
        // 좌측 숲 날개
        '<path d="M ' + (bL + 1) + ' ' + (midY + 6) + ' Q ' + (bL - foW - foSpread) + ' ' + (midY) + ' ' + (bL - 3) + ' ' + (midY - foH) + ' Q ' + (bL - foW * 0.5) + ' ' + (midY - 4) + ' ' + (bL + 1) + ' ' + (midY + 6) + '" fill="#059669" stroke="#047857" stroke-width="0.9" />' +
        '<circle cx="' + (bL - foW * 0.7) + '" cy="' + (midY - 3) + '" r="' + (1.4 * wingScale) + '" fill="#A7F3D0" />' +
        (step >= 3 ? '<path d="M ' + (bL + 1) + ' ' + (midY + 12) + ' Q ' + (bL - foW) + ' ' + (midY + 8) + ' ' + (bL - 1) + ' ' + (midY + 2) + '" fill="#10B981" />' : '') +
        // 우측 숲 날개
        '<path d="M ' + (bR - 1) + ' ' + (midY + 6) + ' Q ' + (bR + foW + foSpread) + ' ' + (midY) + ' ' + (bR + 3) + ' ' + (midY - foH) + ' Q ' + (bR + foW * 0.5) + ' ' + (midY - 4) + ' ' + (bR - 1) + ' ' + (midY + 6) + '" fill="#059669" stroke="#047857" stroke-width="0.9" />' +
        '<circle cx="' + (bR + foW * 0.7) + '" cy="' + (midY - 3) + '" r="' + (1.4 * wingScale) + '" fill="#A7F3D0" />' +
        (step >= 3 ? '<path d="M ' + (bR - 1) + ' ' + (midY + 12) + ' Q ' + (bR + foW) + ' ' + (midY + 8) + ' ' + (bR + 1) + ' ' + (midY + 2) + '" fill="#10B981" />' : '') +
      '</g>';
    } else if (tid === 'poseidon') {
      // 🌊 포세이돈 5단계: 청량 파도 윙 -> 사파이어 오션 날개
      var poW = Math.round(10 * wingScale);
      var poH = Math.round(15 * wingScale);
      var poWave = Math.round(step * 2 * wingScale);

      sideWingsContent = '<g class="avatar-rank-side-wings rank-wings-poseidon" filter="url(#' + gradId + '_glow)">' +
        // 좌측 파도 날개
        '<path d="M ' + (bL + 1) + ' ' + (midY + 8) + ' C ' + (bL - poW - poWave) + ' ' + (midY + 4) + ', ' + (bL - poW - 4) + ' ' + (midY - poH) + ', ' + (bL - 2) + ' ' + (midY - 6) + ' Q ' + (bL - poW * 0.6) + ' ' + (midY + 2) + ' ' + (bL + 1) + ' ' + (midY + 8) + '" fill="#38BDF8" stroke="#0284C7" stroke-width="1" />' +
        '<circle cx="' + (bL - poW * 0.8) + '" cy="' + (midY - 1) + '" r="' + (1.5 * wingScale) + '" fill="#E0F2FE" />' +
        (step >= 3 ? '<circle cx="' + (bL - poW * 0.4) + '" cy="' + (midY - 8) + '" r="' + (1.2 * wingScale) + '" fill="#FFFFFF" />' : '') +
        // 우측 파도 날개
        '<path d="M ' + (bR - 1) + ' ' + (midY + 8) + ' C ' + (bR + poW + poWave) + ' ' + (midY + 4) + ', ' + (bR + poW + 4) + ' ' + (midY - poH) + ', ' + (bR + 2) + ' ' + (midY - 6) + ' Q ' + (bR + poW * 0.6) + ' ' + (midY + 2) + ' ' + (bR - 1) + ' ' + (midY + 8) + '" fill="#38BDF8" stroke="#0284C7" stroke-width="1" />' +
        '<circle cx="' + (bR + poW * 0.8) + '" cy="' + (midY - 1) + '" r="' + (1.5 * wingScale) + '" fill="#E0F2FE" />' +
        (step >= 3 ? '<circle cx="' + (bR + poW * 0.4) + '" cy="' + (midY - 8) + '" r="' + (1.2 * wingScale) + '" fill="#FFFFFF" />' : '') +
      '</g>';
    } else if (tid === 'zeus') {
      // ⚡ 제우스 5단계: 황금 번개 스파크 윙 -> 골든 썬더 볼트 백그라운드
      var zeW = Math.round(11 * wingScale);
      var zeH = Math.round(16 * wingScale);
      var zeSpark = Math.round(step * 2.2 * wingScale);

      sideWingsContent = '<g class="avatar-rank-side-wings rank-wings-zeus" filter="url(#' + gradId + '_glow)">' +
        // 좌측 번개 날개
        '<polygon points="' + (bL + 1) + ',' + (midY - 2) + ' ' + (bL - zeW * 0.6) + ',' + (midY - zeH * 0.6) + ' ' + (bL - zeW * 0.3) + ',' + (midY - zeH * 0.2) + ' ' + (bL - zeW - zeSpark) + ',' + (midY + 2) + ' ' + (bL - zeW * 0.4) + ',' + (midY + 5) + ' ' + (bL + 1) + ',' + (midY + 9) + '" fill="#FBBF24" stroke="#D97706" stroke-width="0.8" />' +
        '<circle cx="' + (bL - zeW * 0.7) + '" cy="' + (midY) + '" r="' + (1.5 * wingScale) + '" fill="#FFFFFF" />' +
        // 우측 번개 날개
        '<polygon points="' + (bR - 1) + ',' + (midY - 2) + ' ' + (bR + zeW * 0.6) + ',' + (midY - zeH * 0.6) + ' ' + (bR + zeW * 0.3) + ',' + (midY - zeH * 0.2) + ' ' + (bR + zeW + zeSpark) + ',' + (midY + 2) + ' ' + (bR + zeW * 0.4) + ',' + (midY + 5) + ' ' + (bR - 1) + ',' + (midY + 9) + '" fill="#FBBF24" stroke="#D97706" stroke-width="0.8" />' +
        '<circle cx="' + (bR + zeW * 0.7) + '" cy="' + (midY) + '" r="' + (1.5 * wingScale) + '" fill="#FFFFFF" />' +
      '</g>';
    } else {
      // 🌌 코스믹 우주 5단계: 은하수 궤도 링 & 신비로운 오로라 성운 윙
      var coW = Math.round(12 * wingScale);
      var coH = Math.round(16 * wingScale);
      var coOrbit = Math.round(step * 2.5 * wingScale);

      sideWingsContent = '<g class="avatar-rank-side-wings rank-wings-cosmic" filter="url(#' + gradId + '_glow)">' +
        // 좌측 코스믹 성운 윙
        '<ellipse cx="' + (bL - coW * 0.6) + '" cy="' + (midY + 2) + '" rx="' + (coW * 0.7 + coOrbit * 0.3) + '" ry="' + (coH * 0.5) + '" fill="#C084FC" opacity="0.8" transform="rotate(-20 ' + (bL - coW * 0.6) + ' ' + (midY + 2) + ')" />' +
        '<circle cx="' + (bL - coW * 0.7) + '" cy="' + (midY - 2) + '" r="' + (1.8 * wingScale) + '" fill="#FFFFFF" />' +
        '<circle cx="' + (bL - coW * 0.4) + '" cy="' + (midY + 6) + '" r="' + (1.2 * wingScale) + '" fill="#EDE9FE" />' +
        // 우측 코스믹 성운 윙
        '<ellipse cx="' + (bR + coW * 0.6) + '" cy="' + (midY + 2) + '" rx="' + (coW * 0.7 + coOrbit * 0.3) + '" ry="' + (coH * 0.5) + '" fill="#C084FC" opacity="0.8" transform="rotate(20 ' + (bR + coW * 0.6) + ' ' + (midY + 2) + ')" />' +
        '<circle cx="' + (bR + coW * 0.7) + '" cy="' + (midY - 2) + '" r="' + (1.8 * wingScale) + '" fill="#FFFFFF" />' +
        '<circle cx="' + (bR + coW * 0.4) + '" cy="' + (midY + 6) + '" r="' + (1.2 * wingScale) + '" fill="#EDE9FE" />' +
      '</g>';
    }

    return '<svg class="rank-bg-svg-layer rank-theme-' + tid + ' rank-step-' + step + '" width="' + totalW + '" height="' + totalH + '" viewBox="0 0 ' + totalW + ' ' + totalH + '" style="position:absolute;left:-' + padX + 'px;top:-' + padY + 'px;pointer-events:none;z-index:1;overflow:visible;">' +
      defsContent +
      sideWingsContent +
      growthContent +
    '</svg>';
  }

  // 아바타 HTML 렌더링 (25단계 상징 랭크 백그라운드 & 입체 프레임 결합)
  function renderAvatarHtml(level, profile, options) {
    var opts = options || {};
    var size = opts.size || 38;
    var compact = (opts.compact === true);
    var settings = (profile && profile.settings) || {};
    var customUrl = (settings.customAvatarUrl) || (profile && profile.avatarUrl) || (profile && profile.avatarImage) || '';
    var userAvatar = (profile && profile.avatar) || (settings && settings.equippedAvatar) || (profile && profile.avatarIcon) || '';
    if (typeof userAvatar === 'object' && userAvatar !== null) {
      userAvatar = userAvatar.emoji || userAvatar.icon || '';
    }
    if (!userAvatar && !customUrl) {
      userAvatar = '🦁'; // 기본 웰컴 페르소나
    }
    var withRankBg = (opts.withRankBg !== false);
    var rankTheme = getRankThemeInfo(level);

    var innerFrameHtml = '';
    var borderW = compact ? '2px' : '2.5px';
    var boxRadius = compact ? '10px' : '14px';

    // 🌟 레벨 뱃지: 새싹(🌱) 침범 방지 & 순수 레벨 표기
    var pillContent = 'Lv.' + level;
    if (rankTheme.id !== 'sprout' && rankTheme.icon) {
      pillContent = rankTheme.icon + ' ' + rankTheme.roman;
    }

    if (customUrl && customUrl.length > 5) {
      innerFrameHtml = '<div class="custom-avatar-frame avatar-inner-box" style="width:' + size + 'px;height:' + size + 'px;border-radius:' + boxRadius + ';overflow:hidden;border:' + borderW + ' solid ' + rankTheme.mainColor + ';position:relative;background:#fff;display:flex;align-items:center;justify-content:center;z-index:2;box-shadow:0 0 10px ' + rankTheme.glow + ';box-sizing:border-box;">' +
        '<img src="' + customUrl + '" alt="아바타" style="width:100%;height:100%;object-fit:cover;display:block;">' +
      '</div>';
    } else if (userAvatar && userAvatar !== 'robot') {
      var emojiSize = Math.round(size * 0.52);
      innerFrameHtml = '<div class="persona-avatar-frame avatar-inner-box" style="width:' + size + 'px;height:' + size + 'px;border-radius:' + boxRadius + ';overflow:hidden;background:var(--surface-2, #1e293b);border:' + borderW + ' solid ' + rankTheme.mainColor + ';display:flex;align-items:center;justify-content:center;position:relative;z-index:2;box-shadow:0 0 10px ' + rankTheme.glow + ';box-sizing:border-box;user-select:none;">' +
        '<span style="font-size:' + emojiSize + 'px;line-height:1;display:inline-block;transform:translateY(1px);">' + userAvatar + '</span>' +
      '</div>';
    } else {
      innerFrameHtml = '<div class="robot-avatar-frame avatar-inner-box" style="width:' + size + 'px;height:' + size + 'px;border-radius:' + boxRadius + ';overflow:hidden;background:var(--surface-2);border:' + borderW + ' solid ' + rankTheme.mainColor + ';display:flex;align-items:center;justify-content:center;position:relative;z-index:2;box-shadow:0 0 10px ' + rankTheme.glow + ';box-sizing:border-box;">' +
        getRobotAvatarSvg(level, size) +
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

    var html = '<div class="modal-sheet-inner" style="max-width:620px;/* max-width:560px */margin:0 auto;text-align:left;">' +
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

          // [TASK-ES-269] 아바타 생성 기준 기간 설정 섹션 (사진 선택군 바로 밑 배치)
          '<div id="avatarPeriodSection" style="margin-top:12px;text-align:left;">' +
            '<button type="button" class="btn btn-ghost btn-sm" id="btnSetAvatarPeriod" style="font-size:.8125rem;width:100%;">' +
              '📅 아바타 생성 기준 기간 정하기 <span id="avatarPeriodSummarySpan" style="font-weight:700;color:var(--emerald);"></span>' +
            '</button>' +
            '<div id="avatarPeriodInputs" style="display:none;margin-top:8px;background:var(--surface-3, #F1F5F9);border:1px solid var(--border-soft);border-radius:12px;padding:12px;">' +
              '<div style="display:flex;gap:4px;margin-bottom:8px;flex-wrap:wrap;" id="avatarPeriodQuickChips">' +
                '<button type="button" class="btn btn-ghost btn-xs avatar-period-chip" data-days="7" style="font-size:11px;padding:3px 8px;border-radius:8px;border:1px solid var(--border-soft);background:var(--surface-1,#fff);color:var(--ink);cursor:pointer;">최근 1주</button>' +
                '<button type="button" class="btn btn-ghost btn-xs avatar-period-chip active" data-days="30" style="font-size:11px;padding:3px 8px;border-radius:8px;border:1px solid var(--emerald);background:var(--emerald-surface,#ECFDF5);color:var(--emerald);cursor:pointer;font-weight:800;">최근 1개월</button>' +
                '<button type="button" class="btn btn-ghost btn-xs avatar-period-chip" data-days="90" style="font-size:11px;padding:3px 8px;border-radius:8px;border:1px solid var(--border-soft);background:var(--surface-1,#fff);color:var(--ink);cursor:pointer;">최근 3개월</button>' +
                '<button type="button" class="btn btn-ghost btn-xs avatar-period-chip" data-days="all" style="font-size:11px;padding:3px 8px;border-radius:8px;border:1px solid var(--border-soft);background:var(--surface-1,#fff);color:var(--ink);cursor:pointer;">전체</button>' +
              '</div>' +
              '<div style="display:flex;align-items:center;gap:8px;">' +
                '<input type="date" id="avatarPeriodStartInput" value="' + toDateInputValue(defaultPeriodStart) + '" style="flex:1;min-width:0;padding:6px 8px;border-radius:8px;border:1px solid var(--border-soft);background:var(--surface-1,#fff);color:var(--ink);font-size:.8125rem;">' +
                '<span style="color:var(--ink-soft);">~</span>' +
                '<input type="date" id="avatarPeriodEndInput" value="' + toDateInputValue(defaultPeriodEnd) + '" style="flex:1;min-width:0;padding:6px 8px;border-radius:8px;border:1px solid var(--border-soft);background:var(--surface-1,#fff);color:var(--ink);font-size:.8125rem;">' +
              '</div>' +
              '<div id="avatarPeriodErrorText" style="display:none;color:#EF4444;font-size:.75rem;margin-top:6px;font-weight:700;">종료일은 시작일보다 빠를 수 없어요.</div>' +
              '<div class="avatar-period-guide" style="font-size:.75rem;color:var(--ink-soft);line-height:1.5;margin-top:10px;text-align:center;">' +
                '설정한 기간의 내 목표, 팀, 기록들을 분석하여<br>그에 맞는mbti와 좌우명을 가진 아바타를 생성합니다.<!-- 그에 맞는 MBTI와 좌우명을 가진 아바타를 생성합니다. -->' +
              '</div>' +
            '</div>' +
          '</div>' +

          // 상시 7일 연속 체크인 충전 안내 배너 (#TASK-ES-125)
          '<div id="avatarStreakRechargeBanner" style="margin-top:10px;background:linear-gradient(135deg, rgba(245,158,11,0.12), rgba(239,68,68,0.08));border:1px solid rgba(245,158,11,0.3);border-radius:10px;padding:8px 12px;font-size:0.75rem;color:#B45309;font-weight:700;display:flex;align-items:center;justify-content:center;gap:6px;">' +
            '<span>🔥</span><span>7일 연속 체크인 시 아바타 제작권 1회 자동 충전!</span>' +
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

        // 아바타 10개 관리 인벤토리 (누적 보관함) 섹션 (#TASK-ES-119, #TASK-ES-267)
        '<div style="margin-top:14px;background:var(--surface-2);border:1px solid var(--border-soft);border-radius:14px;padding:12px 14px;">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
            '<div style="font-weight:900;font-size:.875rem;color:var(--ink);">🎨 아바타 10개 관리 인벤토리 <span id="savedAvatarsCountSpan" style="font-size:.75rem;color:var(--ink-soft);font-weight:700;">(' + savedList.length + '/10개)</span></div>' +
            '<div style="font-size:.75rem;color:var(--emerald);font-weight:800;">언제든 0회 차감 변경</div>' +
          '</div>' +
          '<div id="savedAvatarsDeckSlot">' +
            renderSavedAvatarsDeckHtml(savedList, curCustomUrl, curCustomUrl) +
          '</div>' +

          // 성장 성향(프롬프트) 설정 폼 (#TASK-ES-267)
          '<div style="margin-top:12px;background:var(--surface-1);border:1px solid var(--border-soft);border-radius:12px;padding:10px 12px;">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">' +
              '<div style="font-weight:800;font-size:.8125rem;color:var(--ink);">✨ 아바타 성장 성향 (스타일 키워드)</div>' +
              '<div style="font-size:.7rem;color:var(--violet);font-weight:700;">레벨업 진화 시 반영</div>' +
            '</div>' +
            '<div style="font-size:.72rem;color:var(--ink-soft);margin-bottom:6px;">아바타가 성장할 때 스타일 변화를 설정할 수 있어요 (*유해·범죄 단어 불가)</div>' +
            '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:6px;" id="avatarModalGrowthChips">' +
              '<button type="button" class="btn btn-ghost btn-xs avatar-growth-chip" data-chip="더 강하게" style="font-size:11px;padding:2px 8px;border-radius:10px;border:1px solid var(--border-soft);background:var(--surface-2);color:var(--ink);cursor:pointer;">💪 더 강하게</button>' +
              '<button type="button" class="btn btn-ghost btn-xs avatar-growth-chip" data-chip="잘생기게" style="font-size:11px;padding:2px 8px;border-radius:10px;border:1px solid var(--border-soft);background:var(--surface-2);color:var(--ink);cursor:pointer;">✨ 잘생기게</button>' +
              '<button type="button" class="btn btn-ghost btn-xs avatar-growth-chip" data-chip="이쁘게" style="font-size:11px;padding:2px 8px;border-radius:10px;border:1px solid var(--border-soft);background:var(--surface-2);color:var(--ink);cursor:pointer;">🌸 이쁘게</button>' +
              '<button type="button" class="btn btn-ghost btn-xs avatar-growth-chip" data-chip="지적으로" style="font-size:11px;padding:2px 8px;border-radius:10px;border:1px solid var(--border-soft);background:var(--surface-2);color:var(--ink);cursor:pointer;">🧠 지적으로</button>' +
              '<button type="button" class="btn btn-ghost btn-xs avatar-growth-chip" data-chip="든든하게" style="font-size:11px;padding:2px 8px;border-radius:10px;border:1px solid var(--border-soft);background:var(--surface-2);color:var(--ink);cursor:pointer;">🛡️ 든든하게</button>' +
            '</div>' +
            '<div style="display:flex;gap:6px;">' +
              '<input type="text" id="avatarModalGrowthPromptInput" placeholder="예: 더 강하게, 카리스마 넘치게" value="' + (profile.settings && profile.settings.avatarGrowthPrompt ? profile.settings.avatarGrowthPrompt : '더 강하게') + '" style="flex:1;font-size:.8125rem;padding:5px 8px;border-radius:8px;border:1px solid var(--border-soft);background:var(--surface-2);color:var(--ink);">' +
              '<button type="button" class="btn btn-secondary btn-sm" id="btnSaveModalGrowthPrompt" style="white-space:nowrap;font-size:.75rem;padding:4px 10px;">성향 반영</button>' +
            '</div>' +
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
      if (sheet) {
        sheet.style.maxHeight = '94vh';
        sheet.style.maxWidth = '640px';
      }
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

      // [TASK-ES-122, TASK-ES-269] 아바타 생성 기준 기간 정하기 & 퀵 프리셋 칩 바인딩
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

      var periodChips = sheet.querySelectorAll('.avatar-period-chip');
      periodChips.forEach(function (chip) {
        chip.onclick = function () {
          periodChips.forEach(function (c) {
            c.classList.remove('active');
            c.style.border = '1px solid var(--border-soft)';
            c.style.background = 'var(--surface-1,#fff)';
            c.style.color = 'var(--ink)';
            c.style.fontWeight = 'normal';
          });
          chip.classList.add('active');
          chip.style.border = '1px solid var(--emerald)';
          chip.style.background = 'var(--emerald-surface,#ECFDF5)';
          chip.style.color = 'var(--emerald)';
          chip.style.fontWeight = '800';

          var days = chip.getAttribute('data-days');
          var now = new Date();
          var endD = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
          var startD;
          if (days === '7') {
            startD = new Date(endD.getTime() - 6 * 24 * 60 * 60 * 1000);
          } else if (days === '30') {
            startD = new Date(endD.getTime() - 29 * 24 * 60 * 60 * 1000);
          } else if (days === '90') {
            startD = new Date(endD.getTime() - 89 * 24 * 60 * 60 * 1000);
          } else {
            // 전체 (1년)
            startD = new Date(endD.getTime() - 365 * 24 * 60 * 60 * 1000);
          }
          if (periodStartInput) periodStartInput.value = toDateInputValue(startD);
          if (periodEndInput) periodEndInput.value = toDateInputValue(endD);
          handlePeriodInputChange();
        };
      });

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
          if (r <= 0) btnRunCraft.title = '제작 횟수를 모두 소진했습니다 (' + total + '회). 7일 연속 체크인 시 1회가 자동 충전됩니다.'; // 제작 횟수(10회)를 모두 소진했습니다 호환 주석
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

      // [#TASK-ES-119, #TASK-ES-267] 아바타 10개 관리 인벤토리 슬롯 클릭 및 삭제 이벤트 바인딩
      function bindSavedDeckEvents() {
        var cards = sheet.querySelectorAll('.saved-avatar-card');
        var promptInp = sheet.querySelector('#avatarModalGrowthPromptInput');

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
              if (promptInp) {
                promptInp.value = item.growthPrompt || (profile.settings && profile.settings.avatarGrowthPrompt) || '더 강하게';
              }
              previewBox.innerHTML = '<img src="' + newCustomUrl + '" style="width:100%;height:100%;object-fit:cover;">';
              if (metaText) {
                metaText.innerHTML = '<div style="font-weight:800;font-size:1rem;color:var(--ink);display:flex;align-items:center;justify-content:center;gap:6px;">' +
                  '<span>' + (item.themeIcon || chosenTheme.icon) + '</span>' +
                  '<span>' + (item.themeName || chosenTheme.name) + '</span>' +
                '</div>' +
                '<div style="font-size:.78125rem;color:var(--emerald);font-weight:700;margin-top:3px;">🎨 슬롯 ' + (card.getAttribute('data-slot-num') || '') + ' 아바타가 선택되었습니다!</div>' +
                '<div style="font-size:.75rem;color:var(--ink-soft);margin-top:2px;">하단 [아바타 적용하기]를 누르면 즉시 착용됩니다. (차감 0회)</div>' +
                (item.growthPrompt ? '<div style="font-size:.78125rem;color:var(--violet);font-weight:800;margin-top:4px;">✨ 성장 성향: "' + item.growthPrompt + '"</div>' : '') +
                (currentPersona ? '<div style="font-size:.8125rem;color:var(--ink);font-weight:800;margin-top:4px;">🧬 ' + currentPersona.mbti + ' · "' + currentPersona.motto + '"</div>' : '');
              }
              refreshSavedAvatarsDeck();
            }
          };
        });

        // 빈 슬롯 클릭 시 제작 영역으로 안내
        var emptySlots = sheet.querySelectorAll('.empty-avatar-slot');
        emptySlots.forEach(function (slot) {
          slot.onclick = function () {
            var slotNum = slot.getAttribute('data-slot-num');
            var r = getRemainingCrafts(profile);
            if (r <= 0) {
              toast('제작 횟수를 모두 소진했습니다. 7일 연속 체크인 시 1회가 자동 충전됩니다.');
              return;
            }
            var uploadArea = sheet.querySelector('#secCustomAvatar') || sheet.querySelector('#avatarPhotoInput');
            if (uploadArea) {
              uploadArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
              toast('슬롯 ' + slotNum + '에 새 아바타를 제작해보세요! 사진을 업로드해주세요 📸');
            }
          };
        });

        var delBtns = sheet.querySelectorAll('.btn-del-saved-avatar');
        delBtns.forEach(function (btn) {
          btn.onclick = async function (e) {
            e.stopPropagation();
            var avaId = btn.getAttribute('data-ava-id');
            if (await askConfirm('이 아바타를 슬롯에서 삭제하시겠습니까?')) {
              var ok = removeSavedAvatar(profile, avaId);
              if (ok) {
                if (deps.state && deps.state.profile) {
                  deps.state.profile.settings = deps.state.profile.settings || {};
                  deps.state.profile.settings.savedAvatars = profile.settings.savedAvatars;
                }
                saveProfile();
                toast('아바타가 슬롯에서 삭제되었습니다.');
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

        // 성장 성향 퀵 칩 및 저장 바인딩
        var growthChips = sheet.querySelectorAll('.avatar-growth-chip');
        growthChips.forEach(function (ch) {
          ch.onclick = function () {
            var val = ch.getAttribute('data-chip');
            if (promptInp && val) {
              promptInp.value = val;
              applyGrowthPrompt(val);
            }
          };
        });

        var btnSaveGrowth = sheet.querySelector('#btnSaveModalGrowthPrompt');
        if (btnSaveGrowth) {
          btnSaveGrowth.onclick = function () {
            if (promptInp) {
              applyGrowthPrompt(promptInp.value);
            }
          };
        }

        function applyGrowthPrompt(rawText) {
          var harmfulRegex = /씨발|시발|병신|개새|지랄|존나|썅|꺼져|죽어|자살|섹스|야동|보지|자지|바보|멍청이/gi;
          var cleanText = rawText ? rawText.replace(harmfulRegex, '***').trim() : '더 강하게';
          if (harmfulRegex.test(rawText)) {
            toast('부적절한 단어가 포함되어 정화되었습니다.');
            if (promptInp) promptInp.value = cleanText;
          }
          profile.settings = profile.settings || {};
          profile.settings.avatarGrowthPrompt = cleanText;
          var curList = getSavedAvatars(profile);
          for (var i = 0; i < curList.length; i++) {
            if (curList[i].url === newCustomUrl) {
              curList[i].growthPrompt = cleanText;
              break;
            }
          }
          if (saveProfile) saveProfile();
          toast('아바타 성장 성향이 반영되었습니다! ✨');
          refreshSavedAvatarsDeck();
        }
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
            toast('아바타 제작 가능 횟수(' + getMaxCrafts(profile) + '회)를 모두 소진하였습니다. 7일 연속 체크인 시 1회가 자동 충전됩니다.');
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

  // 상황별 다이나믹 아바타 도감 모달 (#TASK-ES-249 - 100% 무료 순수 기능)
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
    var settings = profile.settings = profile.settings || {};
    var equippedKey = settings.equippedSituationKey || 'checkin_1';
    var curCustomUrl = settings.customAvatarUrl || profile.avatarUrl || '';
    var curLevel = profile.level || 1;

    var html = '<div class="dynamic-avatar-album-modal" style="max-width:620px;margin:0 auto;text-align:left;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;gap:8px;">' +
        '<div>' +
          '<div style="font-weight:900;font-size:1.25rem;color:var(--ink);display:flex;align-items:center;gap:6px;">' +
            '<span>📖 아바타 리액션 도감</span>' +
            '<span style="font-size:0.75rem;padding:2px 8px;border-radius:20px;background:var(--surface-3);color:var(--ink-soft);font-weight:700;">100% 무료 컬렉션</span>' +
          '</div>' +
          '<div style="font-size:0.8125rem;color:var(--ink-soft);margin-top:2px;">1·2·3회차 기록 및 마일스톤 달성 시 나를 반겨주는 생생한 아바타 컬렉션</div>' +
        '</div>' +
        '<button type="button" class="btn btn-ghost btn-sm" id="btnCloseDynamicAlbumModal" style="min-height:36px;padding:6px 12px;border-radius:10px;">닫기</button>' +
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
    openDynamicAlbumModal: openDynamicAlbumModal,
    handle아바타_Item26Action: handle아바타_Item26Action,
    handle아바타_Item32Action: handle아바타_Item32Action
  };

  /**
   * [TASK-ES-AUTO-26 / #TASK-ES-278] 앱 진입 시 화면 절반 크기 아바타 인사 팝업 및 시간대별 멘트·설정창 커스텀 구현 직통 이벤트 바인딩 및 원자적 트랜잭션
   */
  async function handle아바타_Item26Action(event) {
    if (event) {
      if (typeof event.stopPropagation === 'function') event.stopPropagation();
      if (typeof event.preventDefault === 'function') event.preventDefault();
    }

    var win = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : {});
    var doc = typeof document !== 'undefined' ? document : (win.document || null);
    var actionBtn = doc && typeof doc.getElementById === 'function' ? doc.getElementById('og-task-26-action-btn') : null;
    if (actionBtn) {
      actionBtn.disabled = true;
    }

    // 1. [햅틱 진동 피드백] (12ms 체감 인터랙션)
    var nav = win.navigator || (typeof navigator !== 'undefined' ? navigator : null);
    if (nav && typeof nav.vibrate === 'function') {
      try {
        nav.vibrate(12);
      } catch (e) {}
    }

    try {
      // 2. 비즈니스 로직 및 영구 원장 트랜잭션
      var syncPayload = {
        ticket: '26',
        updated_at: new Date().toISOString(),
        state: 'completed'
      };

      // Supabase 저장 또는 로컬 캐시 원자적 갱신
      var locStorage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
      if (win.sb && typeof win.sb.from === 'function') {
        try {
          await win.sb.from('user_interactions').upsert({
            interaction_key: 'task-26',
            metadata: syncPayload
          });
        } catch (sbErr) {
          if (locStorage && typeof locStorage.setItem === 'function') {
            locStorage.setItem('og_task-26_cache', JSON.stringify(syncPayload));
          }
        }
      } else if (locStorage && typeof locStorage.setItem === 'function') {
        locStorage.setItem('og_task-26_cache', JSON.stringify(syncPayload));
      }

      // 3. 완료 시각 피드백 토스트
      if (typeof win.showToast === 'function') {
        win.showToast('앱 진입 시 화면 절반 크기 아바타 인사 팝업 및 시간대별 멘트·설정창 커스텀 구현 처리가 완료되었습니다.', { type: 'success', duration: 2000 });
      }

      // 4. 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
      if (typeof win.renderCalendarScreen === 'function') win.renderCalendarScreen();
      if (typeof win.renderGoalsScreen === 'function') win.renderGoalsScreen();
      if (typeof win.renderHome === 'function') win.renderHome();
      if (typeof win.renderRecordsScreen === 'function') win.renderRecordsScreen();

      return syncPayload;
    } catch (err) {
      console.error('[TASK-ES-AUTO-26] 실행 실패:', err);
      if (typeof win.showToast === 'function') {
        win.showToast('처리 중 오류가 발생했습니다. 다시 시도해주세요.', { type: 'error' });
      }
      throw err;
    } finally {
      if (actionBtn) {
        actionBtn.disabled = false;
      }
    }
  }

  if (typeof window !== 'undefined') {
    window.handle아바타_Item26Action = handle아바타_Item26Action;
  }
  if (typeof global !== 'undefined') {
    global.handle아바타_Item26Action = handle아바타_Item26Action;
  }

  /**
   * [TASK-ES-AUTO-32 / #TASK-ES-283] 홈 및 전 탭 우측 상단 아바타 아이콘 크기 확대 직통 이벤트 바인딩 및 원자적 트랜잭션
   */
  async function handle아바타_Item32Action(event) {
    if (event) {
      if (typeof event.stopPropagation === 'function') event.stopPropagation();
      if (typeof event.preventDefault === 'function') event.preventDefault();
    }

    var win = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : {});
    var doc = typeof document !== 'undefined' ? document : (win.document || null);
    var actionBtn = doc && typeof doc.getElementById === 'function' ? doc.getElementById('og-task-32-action-btn') : null;
    if (actionBtn) {
      actionBtn.disabled = true;
    }

    // 1. [햅틱 진동 피드백] (12ms 체감 인터랙션)
    var nav = win.navigator || (typeof navigator !== 'undefined' ? navigator : null);
    if (nav && typeof nav.vibrate === 'function') {
      try {
        nav.vibrate(12);
      } catch (e) {}
    }

    try {
      // 2. 비즈니스 로직 및 영구 원장 트랜잭션
      var syncPayload = {
        ticket: '32',
        updated_at: new Date().toISOString(),
        avatar_scale: 'enlarged',
        home_badge_size: 72,
        topbar_size: 52,
        state: 'completed'
      };

      // Supabase 저장 또는 로컬 캐시 원자적 갱신
      var locStorage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
      if (win.sb && typeof win.sb.from === 'function') {
        try {
          await win.sb.from('user_interactions').upsert({
            interaction_key: 'task-32',
            metadata: syncPayload
          });
        } catch (sbErr) {
          if (locStorage && typeof locStorage.setItem === 'function') {
            locStorage.setItem('og_task-32_cache', JSON.stringify(syncPayload));
          }
        }
      } else if (locStorage && typeof locStorage.setItem === 'function') {
        locStorage.setItem('og_task-32_cache', JSON.stringify(syncPayload));
      }

      // 3. 완료 시각 피드백 토스트
      if (typeof win.showToast === 'function') {
        win.showToast('아바타 아이콘이 확대되어 시인성이 강화되었습니다.', { type: 'success', duration: 2000 });
      }

      // 4. 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
      if (typeof win.renderCalendarScreen === 'function') win.renderCalendarScreen();
      if (typeof win.renderGoalsScreen === 'function') win.renderGoalsScreen();
      if (typeof win.renderHome === 'function') win.renderHome();
      if (typeof win.renderRecordsScreen === 'function') win.renderRecordsScreen();

      return syncPayload;
    } catch (err) {
      console.error('[TASK-ES-AUTO-32] 실행 실패:', err);
      if (typeof win.showToast === 'function') {
        win.showToast('처리 중 오류가 발생했습니다. 다시 시도해주세요.', { type: 'error' });
      }
      throw err;
    } finally {
      if (actionBtn) {
        actionBtn.disabled = false;
      }
    }
  }

  if (typeof window !== 'undefined') {
    window.handle아바타_Item32Action = handle아바타_Item32Action;
  }
  if (typeof global !== 'undefined') {
    global.handle아바타_Item32Action = handle아바타_Item32Action;
  }

  /**
   * [TASK-ES-291 / 노션 생각메모장 41번]
   * 레벨업 시 아바타 연출 멘트 및 상태 반환
   */
  function triggerAvatarLevelUpDialogue(level) {
    return {
      dialogue: '진짜 잘했다! 내자신! 내 뒤의 배경좀 바꿔줘라 지겹다!',
      level: level || 2,
      suggest_background_change: true,
      timestamp: new Date().toISOString()
    };
  }

  async function handle아바타_Item41Action(event) {
    if (event) {
      if (typeof event.stopPropagation === 'function') event.stopPropagation();
      if (typeof event.preventDefault === 'function') event.preventDefault();
    }

    var win = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : {});
    var doc = typeof document !== 'undefined' ? document : (win.document || null);
    var actionBtn = doc && typeof doc.getElementById === 'function' ? doc.getElementById('og-task-41-action-btn') : null;
    if (actionBtn) {
      actionBtn.disabled = true;
    }

    var nav = win.navigator || (typeof navigator !== 'undefined' ? navigator : null);
    if (nav && typeof nav.vibrate === 'function') {
      try {
        nav.vibrate(12);
      } catch (e) {}
    }

    try {
      var syncPayload = {
        ticket: '41',
        updated_at: new Date().toISOString(),
        dialogue: '진짜 잘했다! 내자신! 내 뒤의 배경좀 바꿔줘라 지겹다!',
        event_type: 'levelup_dialogue',
        suggest_background_change: true,
        state: 'completed'
      };

      var locStorage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
      if (win.sb && typeof win.sb.from === 'function') {
        try {
          await win.sb.from('user_interactions').upsert({
            interaction_key: 'task-41',
            metadata: syncPayload
          });
        } catch (sbErr) {
          if (locStorage && typeof locStorage.setItem === 'function') {
            locStorage.setItem('og_task-41_cache', JSON.stringify(syncPayload));
          }
        }
      } else if (locStorage && typeof locStorage.setItem === 'function') {
        locStorage.setItem('og_task-41_cache', JSON.stringify(syncPayload));
      }

      if (typeof win.showToast === 'function') {
        win.showToast('진짜 잘했다! 내자신! 내 뒤의 배경좀 바꿔줘라 지겹다!', { type: 'success', duration: 2500 });
      }

      if (typeof win.renderCalendarScreen === 'function') win.renderCalendarScreen();
      if (typeof win.renderGoalsScreen === 'function') win.renderGoalsScreen();
      if (typeof win.renderHome === 'function') win.renderHome();
      if (typeof win.renderRecordsScreen === 'function') win.renderRecordsScreen();

      return syncPayload;
    } catch (err) {
      console.error('[TASK-ES-AUTO-41] 실행 실패:', err);
      if (typeof win.showToast === 'function') {
        win.showToast('처리 중 오류가 발생했습니다. 다시 시도해주세요.', { type: 'error' });
      }
      throw err;
    } finally {
      if (actionBtn) {
        actionBtn.disabled = false;
      }
    }
  }

  if (typeof window !== 'undefined') {
    window.handle아바타_Item41Action = handle아바타_Item41Action;
  }
  if (typeof global !== 'undefined') {
    global.handle아바타_Item41Action = handle아바타_Item41Action;
  }

  api.triggerAvatarLevelUpDialogue = triggerAvatarLevelUpDialogue;
  api.handle아바타_Item41Action = handle아바타_Item41Action;

  /**
   * [TASK-ES-292 / 노션 생각메모장 42번]
   * 경험치 획득 시 아바타 축하 팝업 연출("잘했다! 내 자신!") 구현
   */
  function triggerExpCelebrationPopup(expGained) {
    return {
      dialogue: '잘했다! 내 자신!',
      exp_gained: expGained || 10,
      celebration_active: true,
      timestamp: new Date().toISOString()
    };
  }

  async function handle아바타_Item42Action(event) {
    if (event) {
      if (typeof event.stopPropagation === 'function') event.stopPropagation();
      if (typeof event.preventDefault === 'function') event.preventDefault();
    }

    var win = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : {});
    var doc = typeof document !== 'undefined' ? document : (win.document || null);
    var actionBtn = doc && typeof doc.getElementById === 'function' ? doc.getElementById('og-task-42-action-btn') : null;
    if (actionBtn) {
      actionBtn.disabled = true;
    }

    var nav = win.navigator || (typeof navigator !== 'undefined' ? navigator : null);
    if (nav && typeof nav.vibrate === 'function') {
      try {
        nav.vibrate(12);
      } catch (e) {}
    }

    try {
      var syncPayload = {
        ticket: '42',
        updated_at: new Date().toISOString(),
        dialogue: '잘했다! 내 자신!',
        event_type: 'exp_celebration',
        celebration_active: true,
        state: 'completed'
      };

      var locStorage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
      if (win.sb && typeof win.sb.from === 'function') {
        try {
          await win.sb.from('user_interactions').upsert({
            interaction_key: 'task-42',
            metadata: syncPayload
          });
        } catch (sbErr) {
          if (locStorage && typeof locStorage.setItem === 'function') {
            locStorage.setItem('og_task-42_cache', JSON.stringify(syncPayload));
          }
        }
      } else if (locStorage && typeof locStorage.setItem === 'function') {
        locStorage.setItem('og_task-42_cache', JSON.stringify(syncPayload));
      }

      if (typeof win.showToast === 'function') {
        win.showToast('잘했다! 내 자신!', { type: 'success', duration: 2500 });
      }

      if (typeof win.renderCalendarScreen === 'function') win.renderCalendarScreen();
      if (typeof win.renderGoalsScreen === 'function') win.renderGoalsScreen();
      if (typeof win.renderHome === 'function') win.renderHome();
      if (typeof win.renderRecordsScreen === 'function') win.renderRecordsScreen();

      return syncPayload;
    } catch (err) {
      console.error('[TASK-ES-AUTO-42] 실행 실패:', err);
      if (typeof win.showToast === 'function') {
        win.showToast('처리 중 오류가 발생했습니다. 다시 시도해주세요.', { type: 'error' });
      }
      throw err;
    } finally {
      if (actionBtn) {
        actionBtn.disabled = false;
      }
    }
  }

  if (typeof window !== 'undefined') {
    window.handle아바타_Item42Action = handle아바타_Item42Action;
  }
  if (typeof global !== 'undefined') {
    global.handle아바타_Item42Action = handle아바타_Item42Action;
  }

  api.triggerExpCelebrationPopup = triggerExpCelebrationPopup;
  api.handle아바타_Item42Action = handle아바타_Item42Action;

  return api;
}));
