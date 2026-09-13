/**
 * js/avatar-system.js — 아워골 3등신 캐릭터 아바타 & 77종 바디 풀 & 나무망치 제작 엔진
 * (#TASK-ES-044, #TASK-ES-046)
 *
 * 기능:
 * 1. 1~10단계 성장형 초록 로봇 기본 아바타 (SVG 동적 생성)
 * 2. 77종 3등신(SD) 캐릭터 바디 풀 (스포츠, 커리어, 학업, 아티스트, 히어로, 탐험, 일상)
 * 3. 난수(Random 1~77) 추첨 및 사용자 얼굴 사진 3등신 일체형 캔버스 합성 엔진
 * 4. 아워골 기본 아바타의 '나무망치 뚝딱뚝딱 제작' 애니메이션 연출 & 닉네임 맞춤 문구
 * 5. 계정당 최대 3회 변경 제한 및 잔여 횟수 관리
 * 6. 로그인/접속 시 '돌아왔구나! 오늘은 어땠어?' 체크인 맞이 인사말 말풍선
 */
(function (global) {
  'use strict';

  var MAX_AVATAR_CHANGES = 3;

  // ================= 77종 3등신 캐릭터 바디 풀 =================
  var BODY_THEMES_77 = [
    // 1~11: 스포츠 & 갓생러
    { id: 1, name: '스피드 러너', cat: '스포츠', color: '#EF4444', subColor: '#FEE2E2', icon: '🏃', gear: '러닝웨어' },
    { id: 2, name: '파워 헬스트레이너', cat: '스포츠', color: '#F97316', subColor: '#FFEDD5', icon: '💪', gear: '머슬탑' },
    { id: 3, name: '마인드 요가마스터', cat: '스포츠', color: '#10B981', subColor: '#D1FAE5', icon: '🧘', gear: '애슬레저' },
    { id: 4, name: '풀코스 마라토너', cat: '스포츠', color: '#3B82F6', subColor: '#DBEAFE', icon: '🏅', gear: '메달&번호표' },
    { id: 5, name: '자유형 수영선수', cat: '스포츠', color: '#06B6D4', subColor: '#CFFAFE', icon: '🏊', gear: '스위밍수트' },
    { id: 6, name: '로드 사이클리스트', cat: '스포츠', color: '#8B5CF6', subColor: '#EDE9FE', icon: '🚴', gear: '라이딩져지' },
    { id: 7, name: '백두대간 등산가', cat: '스포츠', color: '#059669', subColor: '#A7F3D0', icon: '⛰️', gear: '트레킹룩' },
    { id: 8, name: '불꽃 복서', cat: '스포츠', color: '#DC2626', subColor: '#FCA5A5', icon: '🥊', gear: '복싱가운' },
    { id: 9, name: '스매싱 배드민턴', cat: '스포츠', color: '#14B8A6', subColor: '#CCFBF1', icon: '🏸', gear: '스포츠져지' },
    { id: 10, name: '코트의 테니스스타', cat: '스포츠', color: '#84CC16', subColor: '#ECFCCB', icon: '🎾', gear: '피케셔츠' },
    { id: 11, name: '덩크슛 농구선수', cat: '스포츠', color: '#EA580C', subColor: '#FFEDD5', icon: '🏀', gear: '바스켓볼져지' },

    // 12~22: 비즈니스 & 프로페셔널
    { id: 12, name: '스마트 CEO', cat: '비즈니스', color: '#1E293B', subColor: '#F1F5F9', icon: '👔', gear: '포멀수트' },
    { id: 13, name: '풀스택 개발자', cat: '비즈니스', color: '#334155', subColor: '#E2E8F0', icon: '💻', gear: '개발자후디' },
    { id: 14, name: 'AI 데이터사이언티스트', cat: '비즈니스', color: '#4F46E5', subColor: '#EEF2FF', icon: '🤖', gear: '랩코트' },
    { id: 15, name: '프로덕트 디자이너', cat: '비즈니스', color: '#EC4899', subColor: '#FCE7F3', icon: '🎨', gear: '아티스트베스트' },
    { id: 16, name: '그로스 마케터', cat: '비즈니스', color: '#F59E0B', subColor: '#FEF3C7', icon: '📈', gear: '스마트캐주얼' },
    { id: 17, name: '월스트리트 금융맨', cat: '비즈니스', color: '#0F172A', subColor: '#E2E8F0', icon: '💰', gear: '네이비수트' },
    { id: 18, name: '유니콘 창업가', cat: '비즈니스', color: '#2563EB', subColor: '#DBEAFE', icon: '🚀', gear: '피치블레이저' },
    { id: 19, name: '정의의 변호사', cat: '비즈니스', color: '#374151', subColor: '#F3F4F6', icon: '⚖️', gear: '법복정장' },
    { id: 20, name: '골든아워 의사', cat: '비즈니스', color: '#0EA5E9', subColor: '#E0F2FE', icon: '🩺', gear: '의사가운' },
    { id: 21, name: '모던 건축가', cat: '비즈니스', color: '#52525B', subColor: '#F4F4F5', icon: '📐', gear: '터틀넥&도면함' },
    { id: 22, name: '전략 컨설턴트', cat: '비즈니스', color: '#475569', subColor: '#F1F5F9', icon: '📊', gear: '비즈니스재킷' },

    // 23~33: 학업 & 탐구자
    { id: 23, name: '만점 수험생', cat: '학업', color: '#2563EB', subColor: '#DBEAFE', icon: '✍️', gear: '스쿨룩' },
    { id: 24, name: '완독 독서가', cat: '학업', color: '#78350F', subColor: '#FEF3C7', icon: '📖', gear: '트위드가디건' },
    { id: 25, name: '지혜의 철학자', cat: '학업', color: '#6D28D9', subColor: '#EDE9FE', icon: '🏛️', gear: '학자토가' },
    { id: 26, name: '노벨 물리학자', cat: '학업', color: '#0284C7', subColor: '#E0F2FE', icon: '🔬', gear: '화이트가운' },
    { id: 27, name: '별자리 천문학자', cat: '학업', color: '#1E1B4B', subColor: '#E0E7FF', icon: '🔭', gear: '별빛망토' },
    { id: 28, name: '어학 마스터', cat: '학업', color: '#0D9488', subColor: '#CCFBF1', icon: '🌐', gear: '프레피룩' },
    { id: 29, name: '역사 사학자', cat: '학업', color: '#854D0E', subColor: '#FEF9C3', icon: '📜', gear: '앤틱재킷' },
    { id: 30, name: '알고리즘 챔피언', cat: '학업', color: '#0369A1', subColor: '#E0F2FE', icon: '⚡', gear: '코딩져지' },
    { id: 31, name: '비밀의 도서관 사서', cat: '학업', color: '#57534E', subColor: '#F5F5F4', icon: '📚', gear: '클래식에이프런' },
    { id: 32, name: '대학원 연구원', cat: '학업', color: '#475569', subColor: '#F8FAFC', icon: '📑', gear: '연구실가운' },
    { id: 33, name: '체스 그랜드마스터', cat: '학업', color: '#18181B', subColor: '#FAFAFA', icon: '♟️', gear: '체스수트' },

    // 34~44: 아티스트 & 크리에이터
    { id: 34, name: '열정의 화가', cat: '예술', color: '#D97706', subColor: '#FEF3C7', icon: '🎨', gear: '물감앞치마' },
    { id: 35, name: '어쿠스틱 기타리스트', cat: '예술', color: '#B45309', subColor: '#FEF3C7', icon: '🎸', gear: '보헤미안룩' },
    { id: 36, name: '골드버튼 유튜버', cat: '예술', color: '#DC2626', subColor: '#FEE2E2', icon: '🎥', gear: '스트리머후드' },
    { id: 37, name: '베스트셀러 소설가', cat: '예술', color: '#4B5563', subColor: '#F3F4F6', icon: '🖋️', gear: '벨벳재킷' },
    { id: 38, name: '감성 사진작가', cat: '예술', color: '#374151', subColor: '#E5E7EB', icon: '📷', gear: '출사조끼' },
    { id: 39, name: '미슐랭 스타셰프', cat: '예술', color: '#E11D48', subColor: '#FFE4E6', icon: '🍳', gear: '조리복&토크' },
    { id: 40, name: '스페셜티 바리스타', cat: '예술', color: '#78350F', subColor: '#FEF3C7', icon: '☕', gear: '가죽에이프런' },
    { id: 41, name: '달빛 도예가', cat: '예술', color: '#9A3412', subColor: '#FFEDD5', icon: '🏺', gear: '도예작업복' },
    { id: 42, name: '플로리스트', cat: '예술', color: '#059669', subColor: '#D1FAE5', icon: '💐', gear: '가든에이프런' },
    { id: 43, name: '비트메이커 DJ', cat: '예술', color: '#7C3AED', subColor: '#EDE9FE', icon: '🎧', gear: '네온스트릿' },
    { id: 44, name: '콘티 애니메이터', cat: '예술', color: '#EA580C', subColor: '#FFEDD5', icon: '✏️', gear: '캐주얼후디' },

    // 45~55: 판타지 & 히어로
    { id: 45, name: '초록 수호기사', cat: '판타지', color: '#10B981', subColor: '#D1FAE5', icon: '🛡️', gear: '에메랄드갑주' },
    { id: 46, name: '번개 히어로', cat: '판타지', color: '#EAB308', subColor: '#FEF9C3', icon: '⚡', gear: '라이트닝슈트' },
    { id: 47, name: '불꽃 대마법사', cat: '판타지', color: '#EF4444', subColor: '#FEE2E2', icon: '🔥', gear: '파이어로브' },
    { id: 48, name: '바람의 궁수', cat: '판타지', color: '#14B8A6', subColor: '#CCFBF1', icon: '🏹', gear: '윈드케이프' },
    { id: 49, name: '황금 성기사', cat: '판타지', color: '#CA8A04', subColor: '#FEF08A', icon: '⚔️', gear: '골든아머' },
    { id: 50, name: '그림자 닌자', cat: '판타지', color: '#18181B', subColor: '#3F3F46', icon: '🥷', gear: '시노비의복' },
    { id: 51, name: '드래곤 나이트', cat: '판타지', color: '#B91C1C', subColor: '#FECACA', icon: '🐉', gear: '드래곤스케일' },
    { id: 52, name: '시공간 여행자', cat: '판타지', color: '#6366F1', subColor: '#EEF2FF', icon: '⌛', gear: '크로노코트' },
    { id: 53, name: '사이버 펑크전사', cat: '판타지', color: '#06B6D4', subColor: '#CFFAFE', icon: '🦾', gear: '사이버수트' },
    { id: 54, name: '숲의 드루이드', cat: '판타지', color: '#15803D', subColor: '#DCFCE7', icon: '🌿', gear: '자연의망토' },
    { id: 55, name: '불사조 영웅', cat: '판타지', color: '#F43F5E', subColor: '#FFE4E6', icon: '🦅', gear: '피닉스윙' },

    // 56~66: 모험 & 탐험가
    { id: 56, name: '아폴로 우주비행사', cat: '모험', color: '#0284C7', subColor: '#E0F2FE', icon: '🚀', gear: '우주복' },
    { id: 57, name: '심해 탐사잠수부', cat: '모험', color: '#0E7490', subColor: '#CFFAFE', icon: '🤿', gear: '다이빙슈트' },
    { id: 58, name: '정글 사파리탐험가', cat: '모험', color: '#A16207', subColor: '#FEF08A', icon: '🧭', gear: '카키사파리' },
    { id: 59, name: '남극 극지방대원', cat: '모험', color: '#0369A1', subColor: '#E0F2FE', icon: '❄️', gear: '헤비파카' },
    { id: 60, name: '인디아나 고고학자', cat: '모험', color: '#92400E', subColor: '#FEF3C7', icon: '🏺', gear: '페도라&재킷' },
    { id: 61, name: '스카이 파일럿', cat: '모험', color: '#1E3A8A', subColor: '#DBEAFE', icon: '✈️', gear: '항공점퍼' },
    { id: 62, name: '대양의 선장', cat: '모험', color: '#1E293B', subColor: '#F1F5F9', icon: '⚓', gear: '마린코트' },
    { id: 63, name: '울트라 백패커', cat: '모험', color: '#4D7C0F', subColor: '#ECFCCB', icon: '🎒', gear: '캠핑기어룩' },
    { id: 64, name: '다카르 사막레이서', cat: '모험', color: '#C2410C', subColor: '#FFEDD5', icon: '🏎️', gear: '랠리슈트' },
    { id: 65, name: '신비의 동굴탐험가', cat: '모험', color: '#4B5563', subColor: '#F3F4F6', icon: '🔦', gear: '헤드랜턴조끼' },
    { id: 66, name: '열기구 비행가', cat: '모험', color: '#D97706', subColor: '#FEF3C7', icon: '🎈', gear: '빈티지고글룩' },

    // 67~77: 일상 & 힐링 갓생
    { id: 67, name: '포근한 파자마러', cat: '일상', color: '#8B5CF6', subColor: '#F3E8FF', icon: '🌙', gear: '체크파자마' },
    { id: 68, name: '스트릿 후드티러', cat: '일상', color: '#3F3F46', subColor: '#F4F4F5', icon: '🛹', gear: '오버핏후디' },
    { id: 69, name: '달콤 홈베이커', cat: '일상', color: '#D97706', subColor: '#FEF3C7', icon: '🥐', gear: '체크앞치마' },
    { id: 70, name: '댕댕이 산책러', cat: '일상', color: '#059669', subColor: '#D1FAE5', icon: '🐕', gear: '이지워크웨어' },
    { id: 71, name: '고양이 집사', cat: '일상', color: '#DB2777', subColor: '#FCE7F3', icon: '🐈', gear: '룸웨어' },
    { id: 72, name: '피크닉 매니아', cat: '일상', color: '#65A30D', subColor: '#ECFCCB', icon: '🧺', gear: '린넨셔츠' },
    { id: 73, name: '정리의 미니멀리스트', cat: '일상', color: '#64748B', subColor: '#F8FAFC', icon: '🪴', gear: '화이트셔츠' },
    { id: 74, name: '미라클 모닝러', cat: '일상', color: '#EAB308', subColor: '#FEF9C3', icon: '☀️', gear: '조깅스웨트' },
    { id: 75, name: '새벽 감성몰입러', cat: '일상', color: '#312E81', subColor: '#EEF2FF', icon: '🕯️', gear: '도톰가디건' },
    { id: 76, name: '힐링 티소믈리에', cat: '일상', color: '#047857', subColor: '#D1FAE5', icon: '🍵', gear: '전통오리엔탈룩' },
    { id: 77, name: '아워골 마스터 갓생러', cat: '일상', color: '#10B981', subColor: '#D1FAE5', icon: '👑', gear: '아워골수호망토' }
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
        '77가지 3등신 바디 중 행운의 바디를 추첨하는 중...' +
      '</div>' +
      '<div class="mini-bar" style="width:170px;margin:12px auto 0;height:7px;border-radius:4px;overflow:hidden;background:var(--surface-3);">' +
        '<span id="avatarGenProgress" style="display:block;height:100%;background:var(--emerald);width:15%;transition:width 0.25s ease;"></span>' +
      '</div>' +
    '</div>';
  }

  // ================= 3등신 합성 캔버스 엔진 (얼굴 + 77종 바디) =================
  function composite3DeformedAvatar(userImg, theme, callback) {
    var size = 160;
    var cvs = document.createElement('canvas');
    cvs.width = size;
    cvs.height = size;
    var ctx = cvs.getContext('2d');

    // 1. 둥근 배경 (테마별 부드러운 파스텔 톤)
    ctx.fillStyle = theme.subColor || '#F1F5F9';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    ctx.fill();

    // 테두리 링
    ctx.strokeStyle = theme.color || '#10B981';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 2. 3등신 하체 (앙증맞은 짧은 다리 2개)
    ctx.fillStyle = '#334155';
    // 왼다리
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(58, 126, 18, 22, 6) : ctx.rect(58, 126, 18, 22);
    ctx.fill();
    // 오른다리
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

    // 3. 3등신 몸통 (테마 고유 의상 컬러)
    ctx.fillStyle = theme.color || '#10B981';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(50, 88, 60, 42, 12) : ctx.rect(50, 88, 60, 42);
    ctx.fill();

    // 3등신 앙증맞은 양팔
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(34, 92, 18, 30, 8) : ctx.rect(34, 92, 18, 30);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(108, 92, 18, 30, 8) : ctx.rect(108, 92, 18, 30);
    ctx.fill();

    // 귀여운 손 (동글)
    ctx.fillStyle = '#FDE68A';
    ctx.beginPath();
    ctx.arc(43, 124, 8, 0, Math.PI * 2);
    ctx.arc(117, 124, 8, 0, Math.PI * 2);
    ctx.fill();

    // 가슴 테마 아이콘 / 장식 뱃지
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(theme.icon || '⭐', 80, 114);

    // 넥 칼라(셔츠/옷깃 라인)
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(68, 88);
    ctx.lineTo(80, 100);
    ctx.lineTo(92, 88);
    ctx.closePath();
    ctx.fill();

    // 4. 3등신 대두(Head) — 사용자 얼굴 합성
    // 3등신 비율: 머리가 지름 78px로 몸통보다 큼
    var headCenterX = 80;
    var headCenterY = 52;
    var headRadius = 38;

    ctx.save();
    ctx.beginPath();
    ctx.arc(headCenterX, headCenterY, headRadius, 0, Math.PI * 2);
    ctx.clip();

    // 얼굴 배경 채우기
    ctx.fillStyle = '#FEF3C7';
    ctx.fill();

    // 사용자 사진 얼굴 영역 크롭 & 렌더링
    var minDim = Math.min(userImg.width, userImg.height);
    // 상반신/얼굴은 대체로 사진 상단 30~80%에 위치
    var srcX = (userImg.width - minDim) / 2;
    var srcY = Math.max(0, (userImg.height - minDim) * 0.25);
    ctx.drawImage(
      userImg,
      srcX, srcY, minDim, minDim,
      headCenterX - headRadius, headCenterY - headRadius, headRadius * 2, headRadius * 2
    );
    ctx.restore();

    // 큰 머리 외곽선 링 (깔끔한 캐릭터 마감)
    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(headCenterX, headCenterY, headRadius, 0, Math.PI * 2);
    ctx.stroke();

    // 테마명 미니 뱃지 (좌측 상단)
    ctx.fillStyle = theme.color || '#10B981';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(8, 8, 48, 16, 8) : ctx.rect(8, 8, 48, 16);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('#' + theme.id + ' ' + theme.cat, 32, 19);

    var finalUrl = cvs.toDataURL('image/png');
    if (callback) callback(finalUrl);
    return finalUrl;
  }

  // 잔여 변경 횟수 계산 (계정당 3회)
  function getRemainingChanges(profile) {
    if (!profile || !profile.settings) return MAX_AVATAR_CHANGES;
    var used = profile.settings.avatarChangeCount;
    if (typeof used !== 'number') used = 0;
    return Math.max(0, MAX_AVATAR_CHANGES - used);
  }

  // 아바타 HTML 렌더링 (레벨창 및 프로필용)
  function renderAvatarHtml(level, profile, options) {
    var opts = options || {};
    var size = opts.size || 38;
    var settings = (profile && profile.settings) || {};
    var avatarType = settings.avatarType || 'robot'; // 'robot' | 'custom'
    var customUrl = settings.customAvatarUrl || '';

    var content = '';
    if (avatarType === 'custom' && customUrl) {
      content = '<div class="custom-avatar-frame" style="width:' + size + 'px;height:' + size + 'px;border-radius:12px;overflow:hidden;border:2px solid var(--emerald);position:relative;background:#fff;display:flex;align-items:center;justify-content:center;">' +
        '<img src="' + customUrl + '" alt="3등신 아바타" style="width:100%;height:100%;object-fit:cover;">' +
        '<span class="avatar-lv-pill" style="position:absolute;bottom:0;right:0;background:var(--emerald);color:#fff;font-size:9px;padding:0 3px;border-radius:4px 0 0 0;font-weight:800;">Lv.' + level + '</span>' +
      '</div>';
    } else {
      content = '<div class="robot-avatar-frame" style="width:' + size + 'px;height:' + size + 'px;border-radius:12px;overflow:hidden;background:var(--surface-2);border:1.5px solid var(--emerald-line, #A7F3D0);display:flex;align-items:center;justify-content:center;position:relative;">' +
        getRobotAvatarSvg(level, size - 4) +
      '</div>';
    }

    return '<div class="avatar-interactive-wrap" style="position:relative;display:inline-flex;align-items:center;">' +
      content +
      (opts.showGreeting ? renderGreetingBubbleHtml() : '') +
    '</div>';
  }

  // 로그인/접속 시 체크인 맞이 인사말 말풍선 HTML
  function renderGreetingBubbleHtml() {
    return '<div class="avatar-greeting-bubble" style="position:absolute;left:calc(100% + 10px);top:-6px;white-space:nowrap;background:var(--card, #fff);border:1.5px solid var(--emerald, #10B981);border-radius:10px;padding:4px 9px;box-shadow:0 3px 8px rgba(0,0,0,0.08);z-index:20;font-size:0.75rem;font-weight:700;color:var(--ink);display:flex;align-items:center;gap:4px;animation:bubbleFloat 2s ease-in-out infinite alternate;">' +
      '<span>돌아왔구나! 오늘은 어땠어?</span>' +
      '<div style="position:absolute;left:-6px;top:10px;width:0;height:0;border-top:5px solid transparent;border-bottom:5px solid transparent;border-right:6px solid var(--emerald, #10B981);"></div>' +
    '</div>';
  }

  // ================= 아바타 모달 오픈 =================
  function openAvatarModal(deps) {
    var state = deps.state;
    var saveProfile = deps.saveProfile;
    var toast = deps.toast;
    var openModal = deps.openModal;
    var closeModal = deps.closeModal;
    var onAvatarChanged = deps.onAvatarChanged || function () {};

    var profile = state.profile;
    var settings = profile.settings || {};
    var currentLevel = deps.currentLevel || 1;
    var remaining = getRemainingChanges(profile);
    var curType = settings.avatarType || 'robot';
    var curCustomUrl = settings.customAvatarUrl || '';
    var curThemeId = settings.avatarThemeId || 1;
    var userNick = (profile && profile.name) || '아워골러';

    var html = '<div class="avatar-modal-content" style="max-height:80vh;overflow-y:auto;padding-right:2px;">' +
      '<h3 style="margin:0 0 4px;font-size:1.125rem;">내 아바타 설정 및 진화</h3>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;background:var(--surface-2);border-radius:10px;padding:8px 12px;margin-bottom:12px;border:1px solid var(--rule);">' +
        '<span style="font-size:.8125rem;font-weight:700;color:var(--ink);">계정당 변경 잔여 횟수</span>' +
        '<span class="badge" style="font-size:.8125rem;font-weight:800;background:' + (remaining > 0 ? 'var(--emerald)' : 'var(--rule)') + ';color:#fff;padding:2px 8px;border-radius:6px;">' + remaining + ' / ' + MAX_AVATAR_CHANGES + '회</span>' +
      '</div>' +
      '<p style="font-size:.78125rem;color:var(--ink-faint);margin:0 0 14px;line-height:1.45;">' +
        '⚠️ 내 아바타 변경은 <b>계정당 최대 3회</b>로 제한됩니다. 77종의 3등신 바디 중 하나가 랜덤 추첨됩니다.' +
      '</p>' +

      // 탭: [1. 아워골 초록 로봇] [2. 나만의 3등신 아바타 (77종)]
      '<div class="format-toggle" id="avatarTypeToggle" style="margin-bottom:14px;">' +
        '<div class="format-opt' + (curType === 'robot' ? ' active' : '') + '" data-avatartype="robot">아워골 로봇 (기본)</div>' +
        '<div class="format-opt' + (curType === 'custom' ? ' active' : '') + '" data-avatartype="custom">나만의 3등신 아바타</div>' +
      '</div>' +

      // 로봇 섹션
      '<div id="secRobotAvatar" style="display:' + (curType === 'robot' ? 'block' : 'none') + ';margin-bottom:14px;">' +
        '<div style="text-align:center;padding:16px;background:var(--card2);border-radius:12px;border:1px solid var(--rule);margin-bottom:10px;">' +
          '<div style="display:inline-block;padding:8px;background:var(--surface-2);border-radius:16px;border:2px solid var(--emerald);">' +
            getRobotAvatarSvg(currentLevel, 64) +
          '</div>' +
          '<div style="margin-top:8px;font-weight:800;font-size:.9375rem;color:var(--ink);">Lv.' + currentLevel + ' 아워골 수호 로봇</div>' +
          '<div style="font-size:.75rem;color:var(--ink-soft);margin-top:2px;">레벨업할 때마다 장비와 외형이 10단계까지 듬직하게 진화해요!</div>' +
        '</div>' +
      '</div>' +

      // 커스텀 3등신 아바타 섹션
      '<div id="secCustomAvatar" style="display:' + (curType === 'custom' ? 'block' : 'none') + ';margin-bottom:14px;">' +
        // 제작 로딩 슬롯 (나무망치 애니메이션)
        '<div id="avatarMakerLoadingSlot" style="display:none;background:var(--card2);border-radius:14px;border:1.5px solid var(--emerald);margin-bottom:12px;"></div>' +

        // 완성 프리뷰 박스
        '<div id="avatarMakerResultBox" style="text-align:center;padding:16px;background:var(--card2);border-radius:12px;border:1px solid var(--rule);margin-bottom:10px;">' +
          '<div id="customAvatarPreviewBox" style="width:96px;height:96px;border-radius:18px;overflow:hidden;border:2.5px solid var(--emerald);background:#fff;margin:0 auto;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(16,185,129,0.15);">' +
            (curCustomUrl ? '<img src="' + curCustomUrl + '" style="width:100%;height:100%;object-fit:cover;">' : '<span style="font-size:2.4rem;">👤</span>') +
          '</div>' +
          '<div id="customAvatarMetaText" style="margin-top:10px;">' +
            '<div style="font-weight:800;font-size:.9375rem;color:var(--ink);">본인 사진 기반 3등신 아바타</div>' +
            '<div style="font-size:.75rem;color:var(--ink-soft);margin-top:2px;">사진을 업로드하면 77가지 3등신 바디 중 하나가 랜덤 배정됩니다.</div>' +
          '</div>' +
          '<div style="margin-top:12px;display:flex;justify-content:center;gap:8px;flex-wrap:wrap;">' +
            '<input type="file" id="customAvatarFileInput" accept="image/*" style="display:none;">' +
            '<button type="button" class="btn btn-ghost btn-sm" id="btnUploadAvatarPhoto" style="font-size:.8125rem;">📷 사진 업로드 & 3등신 제작</button>' +
            '<button type="button" class="btn btn-ghost btn-sm" id="btnRerollAvatarTheme" style="font-size:.8125rem;display:none;">🎲 바디 다시 뽑기</button>' +
          '</div>' +
        '</div>' +
      '</div>' +

      // 액션 버튼
      '<div class="modal-actions" style="display:flex;gap:8px;margin-top:14px;">' +
        '<button type="button" class="btn btn-ghost btn-sm" id="btnCancelAvatarModal" style="flex:1;">취소</button>' +
        '<button type="button" class="btn btn-primary btn-sm" id="btnSaveAvatarModal" style="flex:2;" ' + (remaining <= 0 ? 'disabled' : '') + '>' +
          (remaining > 0 ? '아바타 적용하기 (' + remaining + '회 남음)' : '변경 횟수 소진 (3/3)') +
        '</button>' +
      '</div>' +
    '</div>';

    openModal(html, function (sheet) {
      var selectedType = curType;
      var newCustomUrl = curCustomUrl;
      var lastLoadedImg = null;
      var chosenTheme = BODY_THEMES_77[(curThemeId - 1) % 77] || BODY_THEMES_77[0];

      var typeToggle = sheet.querySelector('#avatarTypeToggle');
      var secRobot = sheet.querySelector('#secRobotAvatar');
      var secCustom = sheet.querySelector('#secCustomAvatar');
      var btnUpload = sheet.querySelector('#btnUploadAvatarPhoto');
      var btnReroll = sheet.querySelector('#btnRerollAvatarTheme');
      var fileInput = sheet.querySelector('#customAvatarFileInput');
      var previewBox = sheet.querySelector('#customAvatarPreviewBox');
      var metaText = sheet.querySelector('#customAvatarMetaText');
      var loadingSlot = sheet.querySelector('#avatarMakerLoadingSlot');
      var resultBox = sheet.querySelector('#avatarMakerResultBox');
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

      // 나무망치 제작 연출 및 77종 난수 추첨 합성
      function runAvatarCrafting(img) {
        lastLoadedImg = img;
        resultBox.style.display = 'none';
        loadingSlot.style.display = 'block';
        loadingSlot.innerHTML = getWoodHammerMakerAnimationHtml(userNick);

        var pBar = loadingSlot.querySelector('#avatarGenProgress');
        var pct = 15;
        var pTimer = setInterval(function () {
          pct += 25;
          if (pBar) pBar.style.width = Math.min(100, pct) + '%';
        }, 350);

        setTimeout(function () {
          clearInterval(pTimer);
          // 1~77 난수 추첨
          var randIdx = Math.floor(Math.random() * BODY_THEMES_77.length);
          chosenTheme = BODY_THEMES_77[randIdx];

          // 3등신 캔버스 합성 실행
          composite3DeformedAvatar(img, chosenTheme, function (dataUrl) {
            newCustomUrl = dataUrl;
            loadingSlot.style.display = 'none';
            resultBox.style.display = 'block';
            previewBox.innerHTML = '<img src="' + newCustomUrl + '" style="width:100%;height:100%;object-fit:cover;">';
            metaText.innerHTML = '<div style="font-weight:800;font-size:1rem;color:var(--ink);display:flex;align-items:center;justify-content:center;gap:6px;">' +
              '<span>' + chosenTheme.icon + '</span>' +
              '<span>#' + chosenTheme.id + ' ' + chosenTheme.name + '</span>' +
            '</div>' +
            '<div style="font-size:.78125rem;color:var(--emerald);font-weight:700;margin-top:3px;">✨ 77종 바디 중 행운의 바디 배정 완료!</div>' +
            '<div style="font-size:.75rem;color:var(--ink-soft);margin-top:2px;">테마: ' + chosenTheme.cat + ' · 장비: ' + chosenTheme.gear + '</div>';

            if (btnReroll) btnReroll.style.display = 'inline-block';
            toast('[' + chosenTheme.name + '] 3등신 아바타 제작 완료! 🔨✨');
          });
        }, 1800);
      }

      // 사진 업로드 핸들러
      if (btnUpload && fileInput) {
        btnUpload.onclick = function () { fileInput.click(); };
        fileInput.onchange = function (e) {
          var file = e.target.files && e.target.files[0];
          if (!file) return;
          var reader = new FileReader();
          reader.onload = function (ev) {
            var img = new Image();
            img.onload = function () {
              runAvatarCrafting(img);
            };
            img.src = ev.target.result;
          };
          reader.readAsDataURL(file);
        };
      }

      // 바디 다시 뽑기 (Reroll)
      if (btnReroll) {
        btnReroll.onclick = function () {
          if (!lastLoadedImg) {
            toast('먼저 사진을 업로드해주세요.');
            return;
          }
          runAvatarCrafting(lastLoadedImg);
        };
      }

      // 저장 버튼
      if (btnSave) {
        btnSave.onclick = function () {
          if (remaining <= 0) {
            toast('아바타 변경 횟수(최대 3회)를 모두 소진하였습니다.');
            return;
          }
          if (selectedType === 'custom' && !newCustomUrl) {
            toast('먼저 본인 사진을 업로드하여 3등신 아바타를 생성해주세요.');
            return;
          }

          var prevType = settings.avatarType || 'robot';
          var prevUrl = settings.customAvatarUrl || '';
          var isActuallyChanged = (selectedType !== prevType) || (selectedType === 'custom' && newCustomUrl !== prevUrl);

          if (!settings.avatarChangeCount) settings.avatarChangeCount = 0;
          if (isActuallyChanged) {
            settings.avatarChangeCount++;
          }
          settings.avatarType = selectedType;
          if (selectedType === 'custom') {
            settings.customAvatarUrl = newCustomUrl;
            settings.avatarThemeId = chosenTheme.id;
          }

          saveProfile().then(function () {
            toast('3등신 캐릭터 아바타가 성공적으로 적용되었습니다! 🤖✨');
            closeModal();
            onAvatarChanged();
          });
        };
      }
    });
  }

  // 모듈 노출
  var api = {
    MAX_AVATAR_CHANGES: MAX_AVATAR_CHANGES,
    BODY_THEMES_77: BODY_THEMES_77,
    getRobotAvatarSvg: getRobotAvatarSvg,
    getWoodHammerMakerAnimationHtml: getWoodHammerMakerAnimationHtml,
    composite3DeformedAvatar: composite3DeformedAvatar,
    getRemainingChanges: getRemainingChanges,
    renderAvatarHtml: renderAvatarHtml,
    renderGreetingBubbleHtml: renderGreetingBubbleHtml,
    openAvatarModal: openAvatarModal
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  global.OurgoalAvatar = api;
})(typeof window !== 'undefined' ? window : global);
