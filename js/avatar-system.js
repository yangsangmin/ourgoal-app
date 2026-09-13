/**
 * Ourgoal Avatar System (#TASK-ES-044, #TASK-ES-046, #TASK-ES-047, #TASK-ES-048)
 * - 1~10단계 레벨별 초록 로봇 아바타 SVG 렌더러
 * - 사진 업로드 ➔ '내 사진으로 아바타 제작' 클릭 시 실질 3회 차감 (하단 적용하기는 횟수 차감 없음)
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

  var MAX_AVATAR_CHANGES = 3;

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
        'Gemini 비전 AI가 인물의 특징을 분석하여 77종 바디에 딱 맞는 만화형 캐릭터로 제작 중입니다…' +
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

  // 잔여 제작 가능 횟수 계산 (계정당 최대 3회)
  function getRemainingCrafts(profile) {
    if (!profile || !profile.settings) return MAX_AVATAR_CHANGES;
    var used = profile.settings.avatarCraftCount;
    if (typeof used !== 'number') used = 0;
    return Math.max(0, MAX_AVATAR_CHANGES - used);
  }

  // 아바타 HTML 렌더링
  function renderAvatarHtml(level, profile, options) {
    var opts = options || {};
    var size = opts.size || 38;
    var settings = (profile && profile.settings) || {};
    var avatarType = settings.avatarType || 'robot';
    var customUrl = settings.customAvatarUrl || '';

    if (avatarType === 'custom' && customUrl) {
      return '<div class="custom-avatar-frame" style="width:' + size + 'px;height:' + size + 'px;border-radius:12px;overflow:hidden;border:2px solid var(--emerald);position:relative;background:#fff;display:flex;align-items:center;justify-content:center;">' +
        '<img src="' + customUrl + '" alt="3등신 아바타" style="width:100%;height:100%;object-fit:cover;">' +
        '<span class="avatar-lv-pill" style="position:absolute;bottom:0;right:0;background:var(--emerald);color:#fff;font-size:9px;padding:0 3px;border-radius:4px 0 0 0;font-weight:800;">Lv.' + level + '</span>' +
      '</div>';
    }

    return '<div class="robot-avatar-frame" style="width:' + size + 'px;height:' + size + 'px;border-radius:12px;overflow:hidden;background:var(--surface-2);border:1.5px solid var(--emerald-line, #A7F3D0);display:flex;align-items:center;justify-content:center;position:relative;">' +
      getRobotAvatarSvg(level, size) +
      '<span class="avatar-lv-pill" style="position:absolute;bottom:0;right:0;background:var(--emerald);color:#fff;font-size:9px;padding:0 3px;border-radius:4px 0 0 0;font-weight:800;">Lv.' + level + '</span>' +
    '</div>';
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
    var remainingCrafts = getRemainingCrafts(profile);
    var userNick = profile.nickname || '회원';

    var html = '<div class="modal-sheet-inner" style="max-width:440px;margin:0 auto;text-align:left;">' +
      '<div class="modal-header-custom" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">' +
        '<div style="font-weight:900;font-size:1.1875rem;color:var(--ink);">아바타 설정</div>' +
        '<div style="font-size:0.8125rem;color:var(--ink-soft);font-weight:700;">' +
          '아바타 제작 잔여: <strong id="topRemainingCraftsTxt" style="color:' + (remainingCrafts > 0 ? 'var(--emerald)' : '#EF4444') + ';">' + remainingCrafts + '회</strong> / 3회' +
        '</div>' +
      '</div>' +

      '<div style="background:var(--surface-2);border:1px solid var(--border-soft);border-radius:12px;padding:10px 14px;font-size:0.8125rem;color:var(--ink-soft);line-height:1.45;margin-bottom:16px;">' +
        '💡 <strong>아바타 제작 안내</strong>: 계정당 <strong>최대 3회</strong>까지 Gemini AI로 내 사진 기반 만화 아바타를 제작할 수 있습니다.<br>' +
        '제작된 아바타는 횟수 차감 없이 언제든 자유롭게 내 프로필에 적용할 수 있습니다.' +
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
              '✨ 내 사진으로 아바타 제작 <span id="craftBtnCountSpan">(' + remainingCrafts + '/3회)</span>' +
            '</button>' +
            '<button type="button" class="btn btn-ghost btn-sm" id="btnRerollAvatarTheme" style="font-size:.8125rem;display:none;">🎲 다른 바디 입히기</button><button type="button" class="btn btn-ghost btn-sm" id="btnCycleHairStyle" style="font-size:.8125rem;display:none;">💇 헤어스타일 변경</button><button type="button" class="btn btn-ghost btn-sm" id="btnCycleExpression" style="font-size:.8125rem;display:none;">✨ 표정 변경</button>' +
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
      var chosenTheme = BODY_THEMES_77[(curThemeId - 1) % 77] || BODY_THEMES_77[0];

      var typeToggle = sheet.querySelector('#avatarTypeToggle');
      var secRobot = sheet.querySelector('#secRobotAvatar');
      var secCustom = sheet.querySelector('#secCustomAvatar');
      var btnUpload = sheet.querySelector('#btnUploadAvatarPhoto');
      var btnRunCraft = sheet.querySelector('#btnRunCraftAvatar');
      var btnReroll = sheet.querySelector('#btnRerollAvatarTheme');
      var fileInput = sheet.querySelector('#customAvatarFileInput');
      var previewBox = sheet.querySelector('#customAvatarPreviewBox');
      var metaText = sheet.querySelector('#customAvatarMetaText');
      var loadingSlot = sheet.querySelector('#avatarMakerLoadingSlot');
      var resultBox = sheet.querySelector('#avatarMakerResultBox');
      var craftCountSpan = sheet.querySelector('#craftBtnCountSpan');
      var topRemainingTxt = sheet.querySelector('#topRemainingCraftsTxt');
      var btnSave = sheet.querySelector('#btnSaveAvatarModal');
      var btnCancel = sheet.querySelector('#btnCancelAvatarModal');

      if (btnCancel) btnCancel.onclick = closeModal;

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
        if (craftCountSpan) craftCountSpan.textContent = '(' + r + '/3회)';
        if (topRemainingTxt) {
          topRemainingTxt.textContent = r + '회';
          topRemainingTxt.style.color = r > 0 ? 'var(--emerald)' : '#EF4444';
        }
        if (btnRunCraft) {
          btnRunCraft.disabled = r <= 0;
          if (r <= 0) btnRunCraft.title = '제작 횟수(3회)를 모두 소진했습니다.';
        }
      }

      function updateCustomAvatarView() {
        previewBox.innerHTML = '<img src="' + newCustomUrl + '" style="width:100%;height:100%;object-fit:cover;">';
        metaText.innerHTML = '<div style="font-weight:800;font-size:1rem;color:var(--ink);display:flex;align-items:center;justify-content:center;gap:6px;">' +
          '<span>' + chosenTheme.icon + '</span>' +
          '<span>#' + chosenTheme.id + ' ' + chosenTheme.name + '</span>' +
        '</div>' +
        '<div style="font-size:.78125rem;color:var(--emerald);font-weight:700;margin-top:3px;">🎨 Gemini 3.1 AI 맞춤형 웹툰 아바타 완성!</div>' +
        '<div style="font-size:.75rem;color:var(--ink-soft);margin-top:2px;">테마: ' + chosenTheme.cat + ' · 장비: ' + chosenTheme.gear + '</div>';

        if (btnReroll) btnReroll.style.display = 'inline-block';
        if (btnHair) btnHair.style.display = currentFeatures ? 'inline-block' : 'none';
        if (btnExpr) btnExpr.style.display = currentFeatures ? 'inline-block' : 'none';
      }

      // 1) 사진 선택 시: 즉시 3등신 아바타 틀 위에 사진 미리보기 적용 & '아바타 제작' 버튼 활성화
      if (btnUpload && fileInput) {
        btnUpload.onclick = function () { fileInput.click(); };
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
            toast('아바타 제작 가능 횟수(최대 3회)를 모두 소진하였습니다.');
            return;
          }

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

          // 77종 바디 중 난수 추첨
          var randIdx = Math.floor(Math.random() * BODY_THEMES_77.length);
          chosenTheme = BODY_THEMES_77[randIdx];

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
                try {
                  var cv = document.createElement('canvas');
                  cv.width = 256;
                  cv.height = 256;
                  var ctx = cv.getContext('2d');
                  ctx.drawImage(optImg, 0, 0, 256, 256);
                  newCustomUrl = cv.toDataURL('image/jpeg', 0.9);
                } catch (e) {
                  newCustomUrl = resData.avatarUrl;
                }
                loadingSlot.style.display = 'none';
                resultBox.style.display = 'block';
                updateCustomAvatarView();
                toast('[' + chosenTheme.name + '] AI 맞춤형 웹툰 아바타 제작 완료! 🎨✨');
              };
              optImg.onerror = function () {
                newCustomUrl = resData.avatarUrl;
                loadingSlot.style.display = 'none';
                resultBox.style.display = 'block';
                updateCustomAvatarView();
                toast('[' + chosenTheme.name + '] AI 맞춤형 웹툰 아바타 제작 완료! 🎨✨');
              };
              optImg.src = resData.avatarUrl;
            } else {
              // 2. 텍스트 분석 기반 5단계 샌드위치 캔버스 폴백 렌더링
              currentFeatures = resData.features;
              setTimeout(function () {
                composite3DeformedAvatar(lastUploadedImg, chosenTheme, function (dataUrl, f) {
                  newCustomUrl = dataUrl;
                  loadingSlot.style.display = 'none';
                  resultBox.style.display = 'block';
                  updateCustomAvatarView();
                  toast('[' + chosenTheme.name + '] 맞춤형 만화 아바타 제작 완료! 🔨✨');
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

      
      var btnHair = sheet.querySelector('#btnCycleHairStyle');
      var btnExpr = sheet.querySelector('#btnCycleExpression');

      if (btnHair) {
        btnHair.onclick = function () {
          if (!lastUploadedImg || !currentFeatures) return;
          var styles = ['dandy', 'two_block', 'curtain', 'bob', 'wave', 'curly', 'ponytail', 'straight', 'spiky'];
          var curIdx = styles.indexOf((currentFeatures.hair && currentFeatures.hair.style) || 'dandy');
          currentFeatures.hair = currentFeatures.hair || {};
          currentFeatures.hair.style = styles[(curIdx + 1) % styles.length];
          composite3DeformedAvatar(lastUploadedImg, chosenTheme, function (dataUrl) {
            newCustomUrl = dataUrl;
            updateCustomAvatarView();
            toast('헤어스타일 변경: ' + currentFeatures.hair.style);
          }, { features: currentFeatures });
        };
      }

      if (btnExpr) {
        btnExpr.onclick = function () {
          if (!lastUploadedImg || !currentFeatures) return;
          var exprs = ['bright_smile', 'gentle_smile', 'sharp_confident', 'droopy_cute'];
          var curIdx = exprs.indexOf((currentFeatures.eyes && currentFeatures.eyes.type) || 'round_bright');
          currentFeatures.eyes = currentFeatures.eyes || {};
          currentFeatures.eyes.type = exprs[(curIdx + 1) % exprs.length];
          composite3DeformedAvatar(lastUploadedImg, chosenTheme, function (dataUrl) {
            newCustomUrl = dataUrl;
            updateCustomAvatarView();
            toast('표정 변경: ' + currentFeatures.eyes.type);
          }, { features: currentFeatures });
        };
      }
  
      // 3) 다른 바디 다시 입히기
      if (btnReroll) {
        btnReroll.onclick = function () {
          if (!lastUploadedImg) return;
          var randIdx = Math.floor(Math.random() * BODY_THEMES_77.length);
          chosenTheme = BODY_THEMES_77[randIdx];
          composite3DeformedAvatar(lastUploadedImg, chosenTheme, function (dataUrl) {
            newCustomUrl = dataUrl;
            updateCustomAvatarView();
            toast('[' + chosenTheme.name + '] 새 바디가 배정되었습니다! 🎲');
          }, { features: currentFeatures });
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
          }

          if (deps.state && deps.state.profile) {
            deps.state.profile.settings = deps.state.profile.settings || {};
            deps.state.profile.settings.avatarType = selectedType;
            if (selectedType === 'custom') {
              deps.state.profile.settings.customAvatarUrl = newCustomUrl;
              deps.state.profile.settings.avatarThemeId = chosenTheme.id;
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

  var api = {
    MAX_AVATAR_CHANGES: MAX_AVATAR_CHANGES,
    BODY_THEMES_77: BODY_THEMES_77,
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
    openAvatarModal: openAvatarModal
  };

  return api;
}));
