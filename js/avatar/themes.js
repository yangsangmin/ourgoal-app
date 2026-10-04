/**
 * OurGoal Avatar Cell: 77종 바디 테마 · 320종 도감 조회 · 도감 목록 화면 (#TASK-ES-389 · 아바타·EXP 쪼개기 PR-3)
 *
 * js/avatar-system.js(이전 전 3222줄)에서 이 책임 묶음의 선언을 동작 그대로 옮겼다(이전 전 줄: 27~119, 156~183, 716~730, 879~900).
 *   BODY_THEMES_77 · getAllThemes · getThemesByMbti · getThemesByGroup · searchThemes · getThemeById · renderPersona320ListHtml
 * 바꾼 것은 이름 참조뿐이다 — 다른 부품·avatar-system.js 의 이름은 AV.<이름>(BODY_THEMES_320). 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 바깥에서는 이전과 같이 window.OurgoalAvatar.<이름> 으로 부른다(avatar-system.js 가 같은 이름으로 가져와 api 에 담는다).
 * 브라우저: index.html 이 avatar-system.js 보다 먼저 읽어 OurgoalAvatarParts 에 담는다. Node: avatar-system.js 가 require 해서 부른다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory;
  } else {
    factory(root.OurgoalAvatarParts = root.OurgoalAvatarParts || {});
  }
}(typeof self !== 'undefined' ? self : this, function (AV) {
  'use strict';

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

  // MBTI 그룹 및 테마 조회 헬퍼
  function getAllThemes() {
    return AV.BODY_THEMES_320;
  }

  function getThemesByMbti(mbti) {
    if (!mbti) return AV.BODY_THEMES_320;
    var target = String(mbti).toUpperCase().trim();
    return AV.BODY_THEMES_320.filter(function (t) { return t.mbti === target; });
  }

  function getThemesByGroup(group) {
    if (!group) return AV.BODY_THEMES_320;
    var target = String(group).toUpperCase().trim();
    return AV.BODY_THEMES_320.filter(function (t) { return t.group === target; });
  }

  function searchThemes(query) {
    if (!query) return AV.BODY_THEMES_320;
    var q = String(query).toLowerCase().trim();
    return AV.BODY_THEMES_320.filter(function (t) {
      return (t.name && t.name.toLowerCase().indexOf(q) !== -1) ||
             (t.kw && t.kw.toLowerCase().indexOf(q) !== -1) ||
             (t.cat && t.cat.toLowerCase().indexOf(q) !== -1) ||
             (t.mbti && t.mbti.toLowerCase().indexOf(q) !== -1) ||
             (t.gear && t.gear.toLowerCase().indexOf(q) !== -1);
    });
  }

  // 테마 ID로 테마 객체 조회 (#TASK-ES-119)
  function getThemeById(themeId) {
    var idNum = Number(themeId) || 1;
    // 1. [TASK-ES-127] 320종 페르소나 데이터셋에서 우선 검색
    if (typeof AV.BODY_THEMES_320 !== 'undefined' && AV.BODY_THEMES_320.length) {
      for (var i = 0; i < AV.BODY_THEMES_320.length; i++) {
        if (AV.BODY_THEMES_320[i].id === idNum) return AV.BODY_THEMES_320[i];
      }
    }
    // 2. 레거시 77종 데이터셋에서 검색 (하위 호환성 100% 보장)
    for (var j = 0; j < BODY_THEMES_77.length; j++) {
      if (BODY_THEMES_77[j].id === idNum) return BODY_THEMES_77[j];
    }
    return (typeof AV.BODY_THEMES_320 !== 'undefined' && AV.BODY_THEMES_320[0]) || BODY_THEMES_77[0];
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

  AV.BODY_THEMES_77 = BODY_THEMES_77;
  AV.getAllThemes = getAllThemes;
  AV.getThemesByMbti = getThemesByMbti;
  AV.getThemesByGroup = getThemesByGroup;
  AV.searchThemes = searchThemes;
  AV.getThemeById = getThemeById;
  AV.renderPersona320ListHtml = renderPersona320ListHtml;
}));
