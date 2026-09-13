/**
 * Ourgoal Avatar System (#TASK-ES-044, #TASK-ES-046, #TASK-ES-047)
 * - 1~10단계 레벨별 초록 로봇 아바타 SVG 렌더러
 * - 계정당 최대 3회 아바타 변경 제한 시스템
 * - 사진 기반 퍼스널 컬러(피부톤·헤어색) 분석 및 77종 바디 일체형 만화형(카툰) 페이스 캔버스 엔진
 * - 목선-옷깃 무봉제(Seamless) 결합으로 붙인 티 0% 만화 일러스트 일체화
 * - 초록 로봇 나무망치 아바타 제작 애니메이션 연출 (getWoodHammerMakerAnimationHtml)
 * - 77종 3등신 캐릭터 바디 풀 & 난수 추첨 & 헤어/표정 커스터마이징 미세조정
 * - 체크인 맞이 인사말 연동
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

  // ================= 8종 만화형 헤어스타일 & 4종 표정 정의 =================
  var CARTOON_HAIRSTYLES = ['dandy', 'short', 'bob', 'wave', 'ponytail', 'parted', 'curly', 'straight'];
  var CARTOON_EXPRESSIONS = ['smile', 'wink', 'confident', 'gentle'];

  // ================= 사진 기반 퍼스널 컬러 및 특징 분석 =================
  function extractPersonalFeatures(img) {
    var defaultFeatures = {
      skinColor: '#FFDFBF',
      blushColor: 'rgba(251, 113, 133, 0.45)',
      hairColor: '#1E293B',
      hairStyle: 'dandy',
      expression: 'smile'
    };

    if (!img || typeof document === 'undefined') return defaultFeatures;

    try {
      var cvs = document.createElement('canvas');
      var s = 64;
      cvs.width = s;
      cvs.height = s;
      var ctx = cvs.getContext('2d');
      ctx.drawImage(img, 0, 0, s, s);

      // 1. 얼굴 중심부 픽셀 샘플링 (스킨톤)
      var faceData = ctx.getImageData(24, 24, 16, 16).data;
      var r = 0, g = 0, b = 0, cnt = 0;
      for (var i = 0; i < faceData.length; i += 4) {
        r += faceData[i];
        g += faceData[i + 1];
        b += faceData[i + 2];
        cnt++;
      }
      r = Math.round(r / cnt);
      g = Math.round(g / cnt);
      b = Math.round(b / cnt);

      // 카툰 팔레트 스킨톤 매칭
      var skinColor = '#FFDFBF'; // 맑은 웜베이지
      var brightness = (r * 299 + g * 587 + b * 114) / 1000;
      if (brightness > 205) {
        skinColor = '#FFF1E6'; // 뽀샤시 쿨베이지
      } else if (brightness > 175) {
        skinColor = '#FFDFBF'; // 맑은 웜베이지
      } else if (brightness > 145) {
        skinColor = '#FAD2B0'; // 내추럴 피치베이지
      } else if (brightness > 115) {
        skinColor = '#E8B68E'; // 건강한 탠
      } else {
        skinColor = '#C68B59'; // 차분한 브론즈
      }

      // 2. 상단부 픽셀 샘플링 (헤어 컬러)
      var hairData = ctx.getImageData(16, 6, 32, 12).data;
      var hr = 0, hg = 0, hb = 0, hcnt = 0;
      for (var j = 0; j < hairData.length; j += 4) {
        hr += hairData[j];
        hg += hairData[j + 1];
        hb += hairData[j + 2];
        hcnt++;
      }
      hr = Math.round(hr / hcnt);
      hg = Math.round(hg / hcnt);
      hb = Math.round(hb / hcnt);

      var hairColor = '#1E293B'; // 기본 딥 블랙
      var hBrightness = (hr * 299 + hg * 587 + hb * 114) / 1000;
      if (hBrightness > 165) {
        hairColor = '#D97706'; // 골드 브라운
      } else if (hBrightness > 120) {
        hairColor = '#78350F'; // 체스넛 브라운
      } else if (hBrightness > 70) {
        hairColor = '#451A03'; // 다크 모카
      } else {
        hairColor = '#0F172A'; // 딥 블랙
      }

      return {
        skinColor: skinColor,
        blushColor: 'rgba(251, 113, 133, 0.45)',
        hairColor: hairColor,
        hairStyle: 'dandy',
        expression: 'smile'
      };
    } catch (e) {
      return defaultFeatures;
    }
  }

  // ================= 77종 바디 일체형 무봉제(Seamless) 만화형 얼굴 렌더러 =================
  function drawCartoonHead(ctx, cx, cy, r, features, theme) {
    var skin = (features && features.skinColor) || '#FFDFBF';
    var hair = (features && features.hairColor) || '#1E293B';
    var style = (features && features.hairStyle) || 'dandy';
    var expr = (features && features.expression) || 'smile';
    var strokeColor = '#1E293B';

    ctx.save();

    // 0. 목선 (Neck) — 얼굴과 몸통을 무봉제로 연결하는 든든한 다리
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.rect(cx - 8, cy + r - 8, 16, 18);
    ctx.fill();
    // 목 그림자
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.beginPath();
    ctx.arc(cx, cy + r - 3, 11, 0, Math.PI);
    ctx.fill();

    // 뒷머리 (롱헤어, 단발, 포니테일의 경우 머리 뒤에 먼저 깔아줌)
    ctx.fillStyle = hair;
    if (style === 'bob' || style === 'straight') {
      ctx.beginPath();
      ctx.arc(cx, cy + 4, r + 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (style === 'ponytail') {
      ctx.beginPath();
      ctx.arc(cx + r + 2, cy - 6, 12, 0, Math.PI * 2);
      ctx.fill();
      // 머리끈
      ctx.fillStyle = theme.color || '#10B981';
      ctx.beginPath();
      ctx.arc(cx + r - 2, cy - 2, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = hair;
    } else if (style === 'wave' || style === 'curly') {
      ctx.beginPath();
      ctx.arc(cx, cy + 6, r + 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // 1. 양쪽 귀
    ctx.fillStyle = skin;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    // 왼귀
    ctx.beginPath();
    ctx.arc(cx - r + 3, cy + 4, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // 오른귀
    ctx.beginPath();
    ctx.arc(cx + r - 3, cy + 4, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 귀 안쪽 라인
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.beginPath();
    ctx.arc(cx - r + 3, cy + 4, 3.5, 0, Math.PI * 2);
    ctx.arc(cx + r - 3, cy + 4, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // 2. 만화형 둥근 얼굴 윤곽
    ctx.fillStyle = skin;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 3. 발그레한 만화 볼터치 (Blush)
    ctx.fillStyle = (features && features.blushColor) || 'rgba(251, 113, 133, 0.45)';
    ctx.beginPath();
    ctx.ellipse(cx - 18, cy + 13, 6.5, 4, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 18, cy + 13, 6.5, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4. 만화형 눈썹
    ctx.strokeStyle = hair;
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    if (expr === 'confident') {
      ctx.beginPath();
      ctx.moveTo(cx - 24, cy - 4);
      ctx.lineTo(cx - 12, cy - 8);
      ctx.moveTo(cx + 24, cy - 4);
      ctx.lineTo(cx + 12, cy - 8);
      ctx.stroke();
    } else {
      // 다정한 아치형 눈썹
      ctx.beginPath();
      ctx.arc(cx - 18, cy - 3, 7, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + 18, cy - 3, 7, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    }

    // 5. 만화형 생기있는 눈 (Eyes)
    ctx.fillStyle = strokeColor;
    if (expr === 'wink') {
      // 왼쪽 눈: 초롱초롱 눈
      ctx.beginPath();
      ctx.arc(cx - 16, cy + 4, 5, 0, Math.PI * 2);
      ctx.fill();
      // 하이라이트
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(cx - 17.5, cy + 2.5, 1.8, 0, Math.PI * 2);
      ctx.arc(cx - 14.5, cy + 5.5, 1, 0, Math.PI * 2);
      ctx.fill();

      // 오른쪽 눈: 깜찍한 윙크 라인
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx + 11, cy + 4);
      ctx.quadraticCurveTo(cx + 16, cy + 8, cx + 21, cy + 4);
      ctx.stroke();
    } else if (expr === 'gentle') {
      // 반달 눈웃음
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx - 16, cy + 6, 6, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + 16, cy + 6, 6, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    } else {
      // 정석적인 반짝이는 카툰 눈망울 (smile / confident)
      ctx.beginPath();
      ctx.arc(cx - 16, cy + 4, 5.2, 0, Math.PI * 2);
      ctx.arc(cx + 16, cy + 4, 5.2, 0, Math.PI * 2);
      ctx.fill();

      // 반짝이는 별빛 하이라이트 2개씩
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      // 왼눈 하이라이트
      ctx.arc(cx - 17.5, cy + 2.5, 1.9, 0, Math.PI * 2);
      ctx.arc(cx - 14.2, cy + 5.8, 1, 0, Math.PI * 2);
      // 오른눈 하이라이트
      ctx.arc(cx + 14.5, cy + 2.5, 1.9, 0, Math.PI * 2);
      ctx.arc(cx + 17.8, cy + 5.8, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    // 6. 앙증맞은 코
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.beginPath();
    ctx.arc(cx, cy + 9, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // 7. 생기 넘치는 만화 미소 입 (Mouth)
    ctx.fillStyle = '#F43F5E';
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy + 16, 5, 0.1, Math.PI - 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // 입 안쪽 혀 포인트
    ctx.fillStyle = '#FDA4AF';
    ctx.beginPath();
    ctx.arc(cx, cy + 18, 3, Math.PI, Math.PI * 2);
    ctx.fill();

    // 8. 만화형 헤어스타일 (앞머리 및 윗머리 라인)
    ctx.fillStyle = hair;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.2;
    ctx.beginPath();

    if (style === 'short') {
      // 스포티 숏컷
      ctx.arc(cx, cy - 4, r + 2, Math.PI * 0.85, Math.PI * 2.15);
      ctx.lineTo(cx + r, cy - 4);
      ctx.lineTo(cx + 14, cy - 6);
      ctx.lineTo(cx + 2, cy - 4);
      ctx.lineTo(cx - 12, cy - 6);
      ctx.lineTo(cx - r, cy - 4);
    } else if (style === 'parted') {
      // 가르마 스타일
      ctx.arc(cx, cy - 3, r + 2, Math.PI * 0.85, Math.PI * 2.15);
      ctx.lineTo(cx + r, cy - 2);
      ctx.quadraticCurveTo(cx + 10, cy - 12, cx + 4, cy - 2);
      ctx.quadraticCurveTo(cx - 12, cy - 8, cx - r, cy - 2);
    } else if (style === 'bob') {
      // 귀여운 단발 앞머리
      ctx.arc(cx, cy - 3, r + 3, Math.PI * 0.85, Math.PI * 2.15);
      ctx.lineTo(cx + r + 2, cy + 10);
      ctx.quadraticCurveTo(cx + 16, cy + 2, cx, cy - 2);
      ctx.quadraticCurveTo(cx - 16, cy + 2, cx - r - 2, cy + 10);
    } else if (style === 'curly' || style === 'wave') {
      // 뽀글 웨이브
      ctx.arc(cx, cy - 3, r + 4, Math.PI * 0.8, Math.PI * 2.2);
      ctx.lineTo(cx + r + 1, cy + 6);
      ctx.quadraticCurveTo(cx + 14, cy, cx, cy - 3);
      ctx.quadraticCurveTo(cx - 14, cy, cx - r - 1, cy + 6);
    } else {
      // 기본 dandy 컷 (깔끔하고 댄디한 소프트 앞머리)
      ctx.arc(cx, cy - 3, r + 2, Math.PI * 0.85, Math.PI * 2.15);
      ctx.lineTo(cx + r, cy + 2);
      ctx.quadraticCurveTo(cx + 18, cy - 4, cx + 6, cy - 2);
      ctx.quadraticCurveTo(cx - 6, cy - 6, cx - 18, cy - 3);
      ctx.lineTo(cx - r, cy + 2);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 헤어 엔젤링 하이라이트 (만화 특유의 머릿결 윤기)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy - 5, r - 8, Math.PI * 1.25, Math.PI * 1.75);
    ctx.stroke();

    ctx.restore();
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
        '사진의 톤을 분석해 77가지 바디에 어울리는 만화형 캐릭터로 합성 중입니다…' +
      '</div>' +
      '<div style="width:160px;height:6px;background:var(--surface-3);border-radius:3px;margin:14px auto 0;overflow:hidden;">' +
        '<div id="avatarGenProgress" style="width:20%;height:100%;background:var(--emerald);transition:width 0.3s ease;"></div>' +
      '</div>' +
    '</div>';
  }

  // ================= 3등신 만화형 일체화 캔버스 엔진 (얼굴 + 77종 바디) =================
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

    // 1. 사용자 사진으로부터 피부톤 & 헤어톤 추출 (또는 옵션 재사용)
    var features = opts.features || extractPersonalFeatures(userImg);
    if (opts.hairStyle) features.hairStyle = opts.hairStyle;
    if (opts.expression) features.expression = opts.expression;

    // 2. 둥근 배경 (테마별 파스텔 톤)
    ctx.fillStyle = theme.subColor || '#F1F5F9';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    ctx.fill();

    // 테두리 링
    ctx.strokeStyle = theme.color || '#10B981';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 3. 3등신 하체 (짧고 귀여운 다리)
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

    // 4. 3등신 몸통 (테마 고유 의상 컬러)
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

    // 손 (동글 동글 손끝)
    ctx.fillStyle = features.skinColor || '#FFDFBF';
    ctx.beginPath();
    ctx.arc(43, 124, 7.5, 0, Math.PI * 2);
    ctx.arc(117, 124, 7.5, 0, Math.PI * 2);
    ctx.fill();

    // 가슴 테마 아이콘 / 장식 뱃지
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(theme.icon || '⭐', 80, 114);

    // 5. 3등신 만화형 얼굴 렌더링 (붙인 티 0% 무봉제 결합)
    // 3등신 비율: 머리 중심 x:80, y:50, 반지름: 36
    drawCartoonHead(ctx, 80, 50, 36, features, theme);

    // 6. 넥 칼라(셔츠/옷깃 라인) — 턱 바로 밑을 자연스럽게 감싸 무봉제(Seamless) 완성
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(68, 86);
    ctx.lineTo(80, 98);
    ctx.lineTo(92, 86);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1.5;
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
    if (callback) callback(finalUrl, features);
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
        getRobotAvatarSvg(level, size) +
        '<span class="avatar-lv-pill" style="position:absolute;bottom:0;right:0;background:var(--emerald);color:#fff;font-size:9px;padding:0 3px;border-radius:4px 0 0 0;font-weight:800;">Lv.' + level + '</span>' +
      '</div>';
    }

    return content;
  }

  // 체크인 시 아바타 인사말 말풍선 HTML
  function renderGreetingBubbleHtml(profile, message) {
    var msg = message || '돌아왔구나! 오늘은 어땠어? 🤖✨';
    return '<div class="avatar-greeting-wrap" style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">' +
      '<div class="avatar-speech-bubble" style="position:relative;background:var(--surface-2);border:1px solid var(--emerald-line, #A7F3D0);border-radius:14px;padding:8px 14px;font-size:0.875rem;font-weight:700;color:var(--ink);box-shadow:0 2px 8px rgba(16,185,129,0.08);">' +
        msg +
        '<div style="position:absolute;left:-6px;top:50%;transform:translateY(-50%);width:0;height:0;border-top:6px solid transparent;border-bottom:6px solid transparent;border-right:6px solid var(--surface-2);">' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  // 아바타 변경 모달 열기
  function openAvatarModal(deps) {
    var profile = deps.profile || {};
    var saveProfile = deps.saveProfile;
    var toast = deps.toast || function (m) { console.log(m); };
    var openModal = deps.openModal;
    var closeModal = deps.closeModal;
    var onAvatarChanged = deps.onAvatarChanged || function () {};

    var settings = profile.settings || {};
    var curType = settings.avatarType || 'robot';
    var curCustomUrl = settings.customAvatarUrl || '';
    var curLevel = profile.level || 1;
    var curThemeId = settings.avatarThemeId || 1;
    var remaining = getRemainingChanges(profile);
    var userNick = profile.nickname || '회원';

    var html = '<div class="modal-sheet-inner" style="max-width:440px;margin:0 auto;text-align:left;">' +
      '<div class="modal-header-custom" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">' +
        '<div style="font-weight:900;font-size:1.1875rem;color:var(--ink);">아바타 설정</div>' +
        '<div style="font-size:0.8125rem;color:var(--ink-soft);font-weight:700;">' +
          '잔여 변경: <strong style="color:' + (remaining > 0 ? 'var(--emerald)' : '#EF4444') + ';">' + remaining + '회</strong> / 3회' +
        '</div>' +
      '</div>' +

      '<div style="background:var(--surface-2);border:1px solid var(--border-soft);border-radius:12px;padding:10px 14px;font-size:0.8125rem;color:var(--ink-soft);line-height:1.45;margin-bottom:16px;">' +
        '💡 <strong>아바타 변경 규칙</strong>: 계정당 <strong>최대 3회</strong>까지 변경할 수 있습니다.<br>' +
        '레벨에 따라 성장하는 <strong>초록 로봇</strong>과 사진 기반의 <strong>만화형 3등신 캐릭터</strong> 중 선택할 수 있습니다.' +
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
        // 제작 로딩 슬롯 (나무망치 연출용)
        '<div id="avatarMakerLoadingSlot" style="display:none;background:var(--surface-2);border:1px solid var(--border-soft);border-radius:14px;"></div>' +

        // 결과 및 등록 박스
        '<div id="avatarMakerResultBox" style="background:var(--surface-2);border:1px solid var(--border-soft);border-radius:14px;padding:18px 14px;text-align:center;">' +
          '<div id="customAvatarPreviewBox" style="width:110px;height:110px;border-radius:20px;overflow:hidden;border:2.5px solid var(--emerald);background:#fff;margin:0 auto;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(16,185,129,0.18);">' +
            (curCustomUrl ? '<img src="' + curCustomUrl + '" style="width:100%;height:100%;object-fit:cover;">' : '<span style="font-size:2.8rem;">👤</span>') +
          '</div>' +
          '<div id="customAvatarMetaText" style="margin-top:10px;">' +
            '<div style="font-weight:800;font-size:.9375rem;color:var(--ink);">사진 기반 만화형 3등신 아바타</div>' +
            '<div style="font-size:.75rem;color:var(--ink-soft);margin-top:2px;">사진을 업로드하면 피부·헤어톤을 반영한 만화형 캐릭터로 바디와 일체화됩니다.</div>' +
          '</div>' +
          '<div style="margin-top:12px;display:flex;justify-content:center;gap:6px;flex-wrap:wrap;">' +
            '<input type="file" id="customAvatarFileInput" accept="image/*" style="display:none;">' +
            '<button type="button" class="btn btn-ghost btn-sm" id="btnUploadAvatarPhoto" style="font-size:.8125rem;">📷 사진 업로드 & 캐릭터 제작</button>' +
            '<button type="button" class="btn btn-ghost btn-sm" id="btnRerollAvatarTheme" style="font-size:.8125rem;display:none;">🎲 바디 다시 뽑기</button>' +
            '<button type="button" class="btn btn-ghost btn-sm" id="btnCycleHairStyle" style="font-size:.8125rem;display:none;">💇 헤어스타일 변경</button>' +
            '<button type="button" class="btn btn-ghost btn-sm" id="btnCycleExpression" style="font-size:.8125rem;display:none;">✨ 표정 변경</button>' +
          '</div>' +
        '</div>' +
      '</div>' +

      // 하단 액션 버튼
      '<div style="display:flex;gap:10px;margin-top:20px;">' +
        '<button type="button" class="btn btn-ghost" id="btnCancelAvatarModal" style="flex:1;">닫기</button>' +
        '<button type="button" class="btn btn-primary" id="btnSaveAvatarModal" style="flex:2;" ' + (remaining <= 0 ? 'disabled' : '') + '>' +
          (remaining > 0 ? '아바타 적용하기 (' + remaining + '회 남음)' : '변경 횟수 소진 (3/3)') +
        '</button>' +
      '</div>' +
    '</div>';

    openModal(html, function (sheet) {
      var selectedType = curType;
      var newCustomUrl = curCustomUrl;
      var lastLoadedImg = null;
      var currentFeatures = null;
      var chosenTheme = BODY_THEMES_77[(curThemeId - 1) % 77] || BODY_THEMES_77[0];

      var typeToggle = sheet.querySelector('#avatarTypeToggle');
      var secRobot = sheet.querySelector('#secRobotAvatar');
      var secCustom = sheet.querySelector('#secCustomAvatar');
      var btnUpload = sheet.querySelector('#btnUploadAvatarPhoto');
      var btnReroll = sheet.querySelector('#btnRerollAvatarTheme');
      var btnHair = sheet.querySelector('#btnCycleHairStyle');
      var btnExpr = sheet.querySelector('#btnCycleExpression');
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

      // 화면 업데이트 함수
      function updateCustomAvatarView() {
        previewBox.innerHTML = '<img src="' + newCustomUrl + '" style="width:100%;height:100%;object-fit:cover;">';
        metaText.innerHTML = '<div style="font-weight:800;font-size:1rem;color:var(--ink);display:flex;align-items:center;justify-content:center;gap:6px;">' +
          '<span>' + chosenTheme.icon + '</span>' +
          '<span>#' + chosenTheme.id + ' ' + chosenTheme.name + '</span>' +
        '</div>' +
        '<div style="font-size:.78125rem;color:var(--emerald);font-weight:700;margin-top:3px;">🎨 만화형 3등신 일체형 아바타 완성!</div>' +
        '<div style="font-size:.75rem;color:var(--ink-soft);margin-top:2px;">테마: ' + chosenTheme.cat + ' · 장비: ' + chosenTheme.gear + ' · 스타일: ' + (currentFeatures ? currentFeatures.hairStyle : 'dandy') + '</div>';

        if (btnReroll) btnReroll.style.display = 'inline-block';
        if (btnHair) btnHair.style.display = 'inline-block';
        if (btnExpr) btnExpr.style.display = 'inline-block';
      }

      // 나무망치 제작 연출 및 77종 난수 추첨 만화형 합성
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

          // 3등신 만화형 캔버스 합성 실행
          composite3DeformedAvatar(img, chosenTheme, function (dataUrl, features) {
            newCustomUrl = dataUrl;
            currentFeatures = features;
            loadingSlot.style.display = 'none';
            resultBox.style.display = 'block';
            updateCustomAvatarView();
            toast('[' + chosenTheme.name + '] 만화형 3등신 아바타 제작 완료! 🔨✨');
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

      // 헤어스타일 순환 변경
      if (btnHair) {
        btnHair.onclick = function () {
          if (!lastLoadedImg || !currentFeatures) return;
          var curIdx = CARTOON_HAIRSTYLES.indexOf(currentFeatures.hairStyle || 'dandy');
          var nextStyle = CARTOON_HAIRSTYLES[(curIdx + 1) % CARTOON_HAIRSTYLES.length];
          currentFeatures.hairStyle = nextStyle;

          composite3DeformedAvatar(lastLoadedImg, chosenTheme, function (dataUrl) {
            newCustomUrl = dataUrl;
            updateCustomAvatarView();
            toast('헤어스타일 변경: ' + nextStyle);
          }, { features: currentFeatures });
        };
      }

      // 표정 순환 변경
      if (btnExpr) {
        btnExpr.onclick = function () {
          if (!lastLoadedImg || !currentFeatures) return;
          var curIdx = CARTOON_EXPRESSIONS.indexOf(currentFeatures.expression || 'smile');
          var nextExpr = CARTOON_EXPRESSIONS[(curIdx + 1) % CARTOON_EXPRESSIONS.length];
          currentFeatures.expression = nextExpr;

          composite3DeformedAvatar(lastLoadedImg, chosenTheme, function (dataUrl) {
            newCustomUrl = dataUrl;
            updateCustomAvatarView();
            toast('표정 변경: ' + nextExpr);
          }, { features: currentFeatures });
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
            toast('만화형 3등신 아바타가 성공적으로 적용되었습니다! 🤖✨');
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
    CARTOON_HAIRSTYLES: CARTOON_HAIRSTYLES,
    CARTOON_EXPRESSIONS: CARTOON_EXPRESSIONS,
    getRobotAvatarSvg: getRobotAvatarSvg,
    getWoodHammerMakerAnimationHtml: getWoodHammerMakerAnimationHtml,
    extractPersonalFeatures: extractPersonalFeatures,
    drawCartoonHead: drawCartoonHead,
    composite3DeformedAvatar: composite3DeformedAvatar,
    getRemainingChanges: getRemainingChanges,
    renderAvatarHtml: renderAvatarHtml,
    renderGreetingBubbleHtml: renderGreetingBubbleHtml,
    openAvatarModal: openAvatarModal
  };

  return api;
}));
