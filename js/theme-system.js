/* ============================================================
 * 아워골 — 계층형 테마 체계(대·중·소) & 즐겨찾기/커스텀 테마 시스템
 * #TASK-ES-028 · 본질 ① 체크인 루프
 * ============================================================ */
(function(window){
  'use strict';

  var THEME_ONTOLOGY = [
    {
      id: 'health',
      legacyKey: 'workout',
      label: '건강 & 운동',
      icon: '🏃',
      color: '#ef4444',
      bgColor: 'rgba(239, 68, 68, 0.12)',
      borderColor: 'rgba(239, 68, 68, 0.35)',
      subs: [
        {
          id: 'muscle',
          label: '근력/체형관리',
          items: [
            { id: 't_weight', label: '웨이트 트레이닝', icon: '🏋️', kws: ['웨이트', '헬스', '쇠질', '덤벨', '바벨', '벤치', '스쿼트', '데드'] },
            { id: 't_calisthenics', label: '맨몸운동/철봉', icon: '🤸', kws: ['맨몸운동', '철봉', '턱걸이', '풀업', '푸시업', '딥스'] },
            { id: 't_homet', label: '홈트레이닝', icon: '🏠', kws: ['홈트', '집에서운동', '매트운동'] },
            { id: 't_bodyprofile', label: '바디프로필/체지방감량', icon: '🔥', kws: ['바디프로필', '체지방', '다이어트', '감량', '인바디', '커팅'] },
            { id: 't_bulkup', label: '벌크업/근비대', icon: '💪', kws: ['벌크업', '근비대', '단백질', '증량'] }
          ]
        },
        {
          id: 'cardio',
          label: '유산소/러닝',
          items: [
            { id: 't_running', label: '조깅/러닝', icon: '🏃', kws: ['러닝', '조깅', '달리기', '오운완', '페이스', 'km', '인터벌'] },
            { id: 't_marathon', label: '마라톤 준비', icon: '🏅', kws: ['마라톤', '10k', '하프마라톤', '풀코스', 'LSD'] },
            { id: 't_cycling', label: '사이클/자전거', icon: '🚴', kws: ['자전거', '라이딩', '사이클', '스피닝'] },
            { id: 't_walking', label: '만보걷기/산책', icon: '👟', kws: ['산책', '만보', '걷기', '워킹'] },
            { id: 't_skipping', label: '줄넘기/계단오르기', icon: '🪜', kws: ['줄넘기', '계단오르기', '천국의계단'] }
          ]
        },
        {
          id: 'sports',
          label: '스포츠/구기/액티비티',
          items: [
            { id: 't_swimming', label: '수영', icon: '🏊', kws: ['수영', '자유형', '평영', '접영', '오수완'] },
            { id: 't_climbing', label: '클라이밍/볼더링', icon: '🧗', kws: ['클라이밍', '볼더링', '암장'] },
            { id: 't_tennis', label: '테니스/배드민턴', icon: '🎾', kws: ['테니스', '배드민턴', '라켓'] },
            { id: 't_football', label: '축구/풋살', icon: '⚽', kws: ['축구', '풋살', '매치'] },
            { id: 't_golf', label: '골프', icon: '⛳', kws: ['골프', '스크린', '라운딩', '필드'] },
            { id: 't_boxing', label: '복싱/격투기/주짓수', icon: '🥊', kws: ['복싱', '주짓수', '격투기', '킥복싱'] }
          ]
        },
        {
          id: 'flexibility',
          label: '유연성/체형교정',
          items: [
            { id: 't_yoga', label: '요가/명상스트레칭', icon: '🧘', kws: ['요가', '아사나', '수리야'] },
            { id: 't_pilates', label: '기구/매트 필라테스', icon: '🩰', kws: ['필라테스', '리포머', '바렐'] },
            { id: 't_posture', label: '자세교정/재활운동', icon: '🦴', kws: ['자세교정', '체형교정', '재활', '거북목', '골반교정', '폼롤러'] }
          ]
        },
        {
          id: 'diet',
          label: '식단/영양',
          items: [
            { id: 't_cleanfood', label: '클린식단/식단기록', icon: '🥗', kws: ['식단', '닭가슴살', '샐러드', '단백질', '칼로리', '식단기록', '저탄고지', '키토'] },
            { id: 't_fasting', label: '간헐적 단식/공복유지', icon: '⏱️', kws: ['간헐적단식', '공복', '16:8', '단식'] },
            { id: 't_water', label: '수분 2L 섭취', icon: '💧', kws: ['물마시기', '수분섭취', '2L', '텀블러'] }
          ]
        },
        {
          id: 'sleep_health',
          label: '신체건강/수면',
          items: [
            { id: 't_sleep', label: '7시간 숙면/취침루틴', icon: '😴', kws: ['숙면', '수면', '잠들기', '기상시간'] },
            { id: 't_nodrink', label: '금주/절주', icon: '🚫', kws: ['금주', '절주', '술자리패스'] },
            { id: 't_nosmoke', label: '금연 챌린지', icon: '🚭', kws: ['금연', '담배'] }
          ]
        }
      ]
    },
    {
      id: 'learning',
      legacyKey: 'study',
      label: '학습 & 역량성장',
      icon: '📚',
      color: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.12)',
      borderColor: 'rgba(59, 130, 246, 0.35)',
      subs: [
        {
          id: 'language',
          label: '어학/외국어',
          items: [
            { id: 't_eng_conv', label: '영어회화/스피킹', icon: '🗣️', kws: ['영어회화', '스피킹', '섀도잉', '전화영어', '링글', '말해보카'] },
            { id: 't_eng_test', label: '토익/오픽/토스', icon: '📝', kws: ['토익', '오픽', '토스', '토플', '모의고사'] },
            { id: 't_second_lang', label: '일본어/중국어/제2외국어', icon: '🌐', kws: ['일본어', '중국어', '한자', 'JLPT', 'HSK', '스페인어'] },
            { id: 't_voca', label: '단어 암기/단어장', icon: '📖', kws: ['영단어', '단어장', '보카', '암기'] }
          ]
        },
        {
          id: 'exam',
          label: '자격증/수험',
          items: [
            { id: 't_license', label: '국가자격증/기사시험', icon: '📜', kws: ['자격증', '기사', '정보처리기사', '한국사', '공인중개사'] },
            { id: 't_civil_exam', label: '공무원/임용/고시', icon: '🏛️', kws: ['공무원', '임용', '순경', '행시', '기출문제', '독서실'] },
            { id: 't_job_exam', label: '취업 인적성/NCS', icon: '🎯', kws: ['인적성', 'NCS', 'GSAT', '수리논리'] }
          ]
        },
        {
          id: 'programming',
          label: 'IT/프로그래밍',
          items: [
            { id: 't_coding_test', label: '코딩테스트/알고리즘', icon: '💻', kws: ['백준', '프로그래머스', '코테', '알고리즘', '리트코드'] },
            { id: 't_web_dev', label: '웹/프론트엔드/백엔드', icon: '🌐', kws: ['자바스크립트', '리액트', '노드', '파이썬', '스프링', '깃허브', '개발', '코딩'] },
            { id: 't_ai_data', label: 'AI/머신러닝/데이터분석', icon: '🤖', kws: ['인공지능', '머신러닝', '딥러닝', '데이터분석', 'SQL', '판다스'] }
          ]
        },
        {
          id: 'reading',
          label: '독서/인문학',
          items: [
            { id: 't_book_reading', label: '독서/책읽기', icon: '📖', kws: ['독서', '책읽기', '완독', '도서관', '밀리의서재', '서평'] },
            { id: 't_book_note', label: '독서노트/인사이트 기록', icon: '✍️', kws: ['독서노트', '필사', '밑줄', '인사이트'] }
          ]
        },
        {
          id: 'skills',
          label: '실무스킬',
          items: [
            { id: 't_excel', label: '엑셀/데이터정리', icon: '📊', kws: ['엑셀', '스프레드시트', '함수', '피벗'] },
            { id: 't_design', label: 'UI/UX/포토샵/피그마', icon: '🎨', kws: ['피그마', '포토샵', '일러스트', '디자인'] },
            { id: 't_video_edit', label: '영상편집/쇼츠제작', icon: '🎬', kws: ['영상편집', '프리미어', '캡컷', '쇼츠'] }
          ]
        }
      ]
    },
    {
      id: 'career',
      legacyKey: 'business',
      label: '업무 & 커리어',
      icon: '💼',
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.12)',
      borderColor: 'rgba(16, 185, 129, 0.35)',
      subs: [
        {
          id: 'job_perf',
          label: '본업/직무성과',
          items: [
            { id: 't_work_done', label: '주간 핵심업무 달성', icon: '✅', kws: ['업무완료', '퇴근', '출근', '칼퇴', '업무마감', '성과'] },
            { id: 't_report', label: '보고서/기획서 작성', icon: '📑', kws: ['보고서', '기획서', '제안서', '회의록', '결재'] },
            { id: 't_project', label: '프로젝트 마일스톤 완료', icon: '🚀', kws: ['프로젝트', '스프린트', '마일스톤', '런칭', '배포'] }
          ]
        },
        {
          id: 'job_search',
          label: '취업/이직',
          items: [
            { id: 't_resume', label: '이력서/포트폴리오', icon: '📄', kws: ['이력서', '포트폴리오', '경력기술서', '자기소개서', '서류지원'] },
            { id: 't_interview', label: '면접 준비/면접참석', icon: '👔', kws: ['면접', '화상면접', '인터뷰', '합격'] }
          ]
        },
        {
          id: 'business',
          label: '비즈니스/창업',
          items: [
            { id: 't_startup', label: '신규 서비스 기획/런칭', icon: '💡', kws: ['창업', '서비스런칭', '비즈니스모델', 'BM', '사업자'] },
            { id: 't_revenue', label: '매출 목표 달성/정산', icon: '📈', kws: ['매출', '정산', '결제액', '입금', '월매출'] },
            { id: 't_marketing', label: '고객 마케팅/영업', icon: '📢', kws: ['마케팅', '광고집행', '고객유치', '영업', '미팅'] }
          ]
        },
        {
          id: 'branding',
          label: '퍼스널브랜딩/네트워킹',
          items: [
            { id: 't_linkedin', label: '링크드인/아티클 작성', icon: '🌐', kws: ['링크드인', '아티클', '칼럼', '브런치글'] },
            { id: 't_networking', label: '세미나/커피챗/컨퍼런스', icon: '☕', kws: ['커피챗', '네트워킹', '세미나', '컨퍼런스', '모임참석'] }
          ]
        }
      ]
    },
    {
      id: 'finance',
      legacyKey: 'business',
      label: '재테크 & 자산',
      icon: '💰',
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.12)',
      borderColor: 'rgba(245, 158, 11, 0.35)',
      subs: [
        {
          id: 'saving',
          label: '지출통제/절약',
          items: [
            { id: 't_no_spend', label: '무지출 데이 달성', icon: '🛡️', kws: ['무지출', '무지출데이', '0원', '지출0원', '돈안쓰기'] },
            { id: 't_household_book', label: '가계부 기록/지출결산', icon: '📒', kws: ['가계부', '지출기록', '카드값', '예산관리'] },
            { id: 't_frugal', label: '식비절약/배달음식 끊기', icon: '🍱', kws: ['식비절약', '배달끊기', '냉장고파먹기', '도시락'] }
          ]
        },
        {
          id: 'investing',
          label: '투자 & 주식',
          items: [
            { id: 't_stock', label: '국내/미국주식 분석 및 매수', icon: '📈', kws: ['주식', '미국주식', 'ETF', '적립식매수', '배당주', '주식공부'] },
            { id: 't_economy_news', label: '경제뉴스 브리핑/시황정리', icon: '📰', kws: ['경제뉴스', '시황', '금리', '환율', '연준'] }
          ]
        },
        {
          id: 'real_estate',
          label: '부동산/내집마련',
          items: [
            { id: 't_imjang', label: '부동산 임장/청약공부', icon: '🏢', kws: ['임장', '청약', '아파트', '부동산', '매매', '전세'] }
          ]
        },
        {
          id: 'side_income',
          label: '부수입/파이프라인',
          items: [
            { id: 't_side_job', label: '애드센스/블로그수익/부업', icon: '💵', kws: ['부수입', '애드센스', '스마트스토어', '중고거래', '쿠팡파트너스'] }
          ]
        }
      ]
    },
    {
      id: 'mind',
      legacyKey: 'mind',
      label: '멘탈케어 & 회고',
      icon: '🧘',
      color: '#8b5cf6',
      bgColor: 'rgba(139, 92, 246, 0.12)',
      borderColor: 'rgba(139, 92, 246, 0.35)',
      subs: [
        {
          id: 'emotion',
          label: '감정일기/회고',
          items: [
            { id: 't_emotion_diary', label: '솔직한 감정일기', icon: '📝', kws: ['감정일기', '기분', '마음', '속마음', '우울', '불안', '행복', '홀가분'] },
            { id: 't_self_compassion', label: '자책 멈추기/자기 수용', icon: '🤍', kws: ['자책', '수용', '위로', '토닥토닥', '괜찮아'] }
          ]
        },
        {
          id: 'mindfulness',
          label: '명상/휴식',
          items: [
            { id: 't_meditation', label: '10분 호흡명상', icon: '🧘', kws: ['명상', '호흡', '바디스캔', '마인드풀니스'] },
            { id: 't_digital_detox', label: '디지털 디톡스/온전한 쉼', icon: '📵', kws: ['디지털디톡스', '스마트폰끄기', '멍때리기', '휴식'] },
            { id: 't_burnout', label: '번아웃 회복 루틴', icon: '🌱', kws: ['번아웃', '재충전', '쉼', '힐링'] }
          ]
        },
        {
          id: 'gratitude',
          label: '긍정확언/감사',
          items: [
            { id: 't_gratitude_diary', label: '감사일기 3줄', icon: '🙏', kws: ['감사일기', '감사한일', '감사'] },
            { id: 't_affirmation', label: '모닝 긍정확언/자기암시', icon: '✨', kws: ['긍정확언', '확언', '자기암시', '다짐'] },
            { id: 't_praise', label: '오늘 나 칭찬하기', icon: '👏', kws: ['칭찬하기', '뿌듯', '잘했어'] }
          ]
        }
      ]
    },
    {
      id: 'routine',
      legacyKey: 'daily',
      label: '일상 & 습관루틴',
      icon: '🌱',
      color: '#14b8a6',
      bgColor: 'rgba(20, 184, 166, 0.12)',
      borderColor: 'rgba(20, 184, 166, 0.35)',
      subs: [
        {
          id: 'morning_night',
          label: '모닝/나이트루틴',
          items: [
            { id: 't_miracle_morning', label: '미라클모닝 기상', icon: '🌅', kws: ['미라클모닝', '새벽기상', '일찍일어나기', '6시기상'] },
            { id: 't_early_sleep', label: '밤 11시 전 취침', icon: '🌙', kws: ['일찍자기', '11시취침', '취침루틴'] }
          ]
        },
        {
          id: 'organize',
          label: '생활환경/정리',
          items: [
            { id: 't_clean_room', label: '방 청소/환기/이불개기', icon: '🧹', kws: ['방청소', '환기', '이불정리', '분리수거', '빨래'] },
            { id: 't_minimalism', label: '미니멀리즘/버리기', icon: '📦', kws: ['미니멀리즘', '버리기', '정리정돈', '비우기'] }
          ]
        },
        {
          id: 'time_mgmt',
          label: '시간관리/생산성',
          items: [
            { id: 't_pomodoro', label: '뽀모도로 타이머 집중', icon: '⏱️', kws: ['뽀모도로', '타이머', '초집중'] },
            { id: 't_daily_plan', label: '하루 우선순위 TOP3 계획', icon: '📋', kws: ['하루계획', '할일목록', '투두리스트', '우선순위'] }
          ]
        }
      ]
    },
    {
      id: 'hobby',
      legacyKey: 'daily',
      label: '취미 & 문화창작',
      icon: '🎨',
      color: '#ec4899',
      bgColor: 'rgba(236, 72, 153, 0.12)',
      borderColor: 'rgba(236, 72, 153, 0.35)',
      subs: [
        {
          id: 'music_art',
          label: '음악 & 미술',
          items: [
            { id: 't_instrument', label: '악기연주/피아노/기타', icon: '🎸', kws: ['기타연습', '피아노', '악기', '보컬', '음악연습'] },
            { id: 't_drawing', label: '드로잉/일러스트/스케치', icon: '🎨', kws: ['그림그리기', '드로잉', '아이패드드로잉', '스케치', '수채화'] }
          ]
        },
        {
          id: 'creative_writing',
          label: '글쓰기 & 영상제작',
          items: [
            { id: 't_writing', label: '에세이/소설/블로그 창작', icon: '✍️', kws: ['글쓰기', '에세이', '소설', '창작', '블로그포스팅'] },
            { id: 't_youtube', label: '유튜브/영상 촬영', icon: '📹', kws: ['유튜브', '영상촬영', '촬영완료', '브이로그'] }
          ]
        },
        {
          id: 'outdoor_cooking',
          label: '아웃도어 & 요리',
          items: [
            { id: 't_hiking', label: '등산/트레킹/캠핑', icon: '⛺', kws: ['등산', '트레킹', '캠핑', '차박', '정상등반'] },
            { id: 't_cooking', label: '건강한 집밥요리/베이킹', icon: '🍳', kws: ['요리', '집밥', '홈베이킹', '도시락싸기', '드립커피'] }
          ]
        }
      ]
    },
    {
      id: 'social',
      legacyKey: 'schedule',
      label: '관계 & 가족',
      icon: '🤝',
      color: '#6366f1',
      bgColor: 'rgba(99, 102, 241, 0.12)',
      borderColor: 'rgba(99, 102, 241, 0.35)',
      subs: [
        {
          id: 'family',
          label: '가족/부모님/연인',
          items: [
            { id: 't_family_call', label: '부모님 안부전화/가족식사', icon: '📞', kws: ['부모님', '안부전화', '가족식사', '효도'] },
            { id: 't_dating', label: '데이트/기념일/대화시간', icon: '💑', kws: ['데이트', '기념일', '대화', '산책데이트'] }
          ]
        },
        {
          id: 'parenting_pet',
          label: '육아 & 반려동물',
          items: [
            { id: 't_parenting', label: '아이와 놀아주기/동화책 읽기', icon: '👶', kws: ['육아', '동화책', '놀아주기', '육아일기', '이유식'] },
            { id: 't_pet', label: '반려견 산책/돌봄', icon: '🐶', kws: ['강아지', '고양이', '반려견산책', '배변패드', '동물병원'] }
          ]
        },
        {
          id: 'friends_society',
          label: '친구/약속 & 봉사',
          items: [
            { id: 't_meeting', label: '지인 약속/동호회 모임', icon: '👥', kws: ['약속', '친구만남', '동창회', '모임', '회식', '식사약속'] },
            { id: 't_volunteer', label: '봉사활동/기부 실천', icon: '🎁', kws: ['봉사활동', '기부', '후원', '유기견봉사', '플로깅'] }
          ]
        }
      ]
    }
  ];

  var DEFAULT_FAVORITES = [
    { id: 'fav_def_1', themeId: 't_running', label: '러닝/조깅', icon: '🏃', majorId: 'health', subId: 'cardio', isCustom: false },
    { id: 'fav_def_2', themeId: 't_book_reading', label: '독서/책읽기', icon: '📖', majorId: 'learning', subId: 'reading', isCustom: false },
    { id: 'fav_def_3', themeId: 't_work_done', label: '업무 달성', icon: '💼', majorId: 'career', subId: 'job_perf', isCustom: false },
    { id: 'fav_def_4', themeId: 't_emotion_diary', label: '감정일기', icon: '🧘', majorId: 'mind', subId: 'emotion', isCustom: false },
    { id: 'fav_def_5', themeId: 't_no_spend', label: '무지출/절약', icon: '💰', majorId: 'finance', subId: 'saving', isCustom: false }
  ];

  var FLAT_THEME_MAP = {};
  THEME_ONTOLOGY.forEach(function(m){
    m.subs.forEach(function(s){
      s.items.forEach(function(it){
        FLAT_THEME_MAP[it.id] = {
          id: it.id,
          label: it.label,
          icon: it.icon,
          kws: it.kws || [],
          majorId: m.id,
          majorLabel: m.label,
          legacyKey: m.legacyKey,
          subId: s.id,
          subLabel: s.label,
          color: m.color,
          bgColor: m.bgColor,
          borderColor: m.borderColor
        };
      });
    });
  });

  function getThemeSettings(profile){
    if(!profile) return { favorites: DEFAULT_FAVORITES.slice(), customThemes: [] };
    if(!profile.themeSettings) profile.themeSettings = {};
    if(!Array.isArray(profile.themeSettings.favorites) || profile.themeSettings.favorites.length === 0){
      profile.themeSettings.favorites = DEFAULT_FAVORITES.slice();
    }
    if(!Array.isArray(profile.themeSettings.customThemes)){
      profile.themeSettings.customThemes = [];
    }
    return profile.themeSettings;
  }

  function searchThemes(query, customThemes){
    var q = (query || '').trim().toLowerCase();
    if(!q) return [];
    var results = [];

    if(Array.isArray(customThemes)){
      customThemes.forEach(function(ct){
        if(ct.label.toLowerCase().indexOf(q) !== -1){
          results.push({
            id: ct.id,
            label: ct.label,
            icon: ct.icon || '⭐',
            majorId: ct.majorId || 'routine',
            majorLabel: (THEME_ONTOLOGY.find(function(m){ return m.id === ct.majorId; }) || {}).label || '일상',
            subLabel: '나만의 테마',
            isCustom: true
          });
        }
      });
    }

    Object.keys(FLAT_THEME_MAP).forEach(function(tid){
      var t = FLAT_THEME_MAP[tid];
      var match = false;
      if(t.label.toLowerCase().indexOf(q) !== -1) match = true;
      if(!match && t.majorLabel.toLowerCase().indexOf(q) !== -1) match = true;
      if(!match && t.subLabel.toLowerCase().indexOf(q) !== -1) match = true;
      if(!match){
        for(var i = 0; i < t.kws.length; i++){
          if(t.kws[i].indexOf(q) !== -1){
            match = true;
            break;
          }
        }
      }
      if(match){
        results.push(t);
      }
    });

    return results.slice(0, 30);
  }

  function suggestTheme(text, customThemes){
    var hay = (text || '').trim().toLowerCase();
    if(hay.length < 2) return null;

    var best = null;
    var maxScore = 0;

    if(Array.isArray(customThemes)){
      for(var ci = 0; ci < customThemes.length; ci++){
        var ct = customThemes[ci];
        if(hay.indexOf(ct.label.toLowerCase()) !== -1){
          return {
            id: ct.id,
            label: ct.label,
            icon: ct.icon || '⭐',
            majorId: ct.majorId,
            majorLabel: '나만의 테마',
            subLabel: ct.label,
            isCustom: true,
            score: 10
          };
        }
      }
    }

    Object.keys(FLAT_THEME_MAP).forEach(function(tid){
      var t = FLAT_THEME_MAP[tid];
      var score = 0;
      if(hay.indexOf(t.label.toLowerCase()) !== -1) score += 3.0;
      for(var ki = 0; ki < t.kws.length; ki++){
        if(hay.indexOf(t.kws[ki]) !== -1){
          score += 1.5;
        }
      }
      if(score > maxScore){
        maxScore = score;
        best = t;
      }
    });

    if(best && maxScore >= 1.5){
      return {
        id: best.id,
        label: best.label,
        icon: best.icon,
        majorId: best.majorId,
        majorLabel: best.majorLabel,
        subLabel: best.subLabel,
        isCustom: false,
        score: maxScore
      };
    }
    return null;
  }

  function addCustomTheme(profile, label, icon, majorId){
    var ts = getThemeSettings(profile);
    var cleanLabel = (label || '').trim().slice(0, 15);
    if(!cleanLabel) return null;
    var customId = 'ct_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    var newTheme = {
      id: customId,
      label: cleanLabel,
      icon: icon || '⭐',
      majorId: majorId || 'routine',
      isCustom: true,
      createdAt: new Date().toISOString()
    };
    ts.customThemes.unshift(newTheme);
    return newTheme;
  }

  function toggleFavorite(profile, themeItem){
    var ts = getThemeSettings(profile);
    var existingIdx = ts.favorites.findIndex(function(f){ return f.themeId === themeItem.id || f.id === themeItem.id; });
    if(existingIdx !== -1){
      ts.favorites.splice(existingIdx, 1);
      return false;
    } else {
      ts.favorites.push({
        id: 'fav_' + Date.now(),
        themeId: themeItem.id,
        label: themeItem.label,
        icon: themeItem.icon || '⭐',
        majorId: themeItem.majorId,
        subId: themeItem.subId,
        isCustom: !!themeItem.isCustom
      });
      return true;
    }
  }

  function buildCheckinThemePayload(selectedTheme){
    if(!selectedTheme){
      return {
        theme: 'daily',
        subTheme: '일상기타',
        themeMetadata: { isUserSelected: false, isCustom: false }
      };
    }

    if(selectedTheme.isCustom){
      var majorObj = THEME_ONTOLOGY.find(function(m){ return m.id === selectedTheme.majorId; });
      return {
        theme: (majorObj && majorObj.legacyKey) || 'daily',
        subTheme: selectedTheme.label,
        themeMetadata: {
          isUserSelected: true,
          isCustom: true,
          customName: selectedTheme.label,
          majorId: selectedTheme.majorId,
          majorLabel: (majorObj && majorObj.label) || '일상',
          leafLabel: selectedTheme.label
        }
      };
    }

    var flat = FLAT_THEME_MAP[selectedTheme.themeId || selectedTheme.id];
    if(flat){
      return {
        theme: flat.legacyKey || 'daily',
        subTheme: flat.label,
        themeMetadata: {
          isUserSelected: true,
          isCustom: false,
          majorId: flat.majorId,
          majorLabel: flat.majorLabel,
          subId: flat.subId,
          subLabel: flat.subLabel,
          leafLabel: flat.label
        }
      };
    }

    return {
      theme: 'daily',
      subTheme: selectedTheme.label || '',
      themeMetadata: { isUserSelected: true, isCustom: false, leafLabel: selectedTheme.label || '' }
    };
  }

  // --- UI Controller Helper (index.html 간소화용) ---
  function initUI(opts){
    var getProfile = opts.getProfile;
    var saveProfile = opts.saveProfile;
    var toast = opts.toast || function(){};
    var esc = opts.esc || function(s){ return s; };
    var onSelect = opts.onSelect || function(){};
    var getSelectedTheme = opts.getSelectedTheme || function(){ return null; };

    var quickBarEl = document.getElementById('captureThemeQuickBar');
    var themeModal = document.getElementById('themeSelectorModal');
    var curCustomEmoji = '⭐';

    function renderQuickBar(){
      if(!quickBarEl) return;
      var prof = getProfile();
      var ts = getThemeSettings(prof);
      var sel = getSelectedTheme();
      var html = '<button type="button" class="theme-add-chip" id="btnOpenThemeModal" aria-label="테마 추가 및 탐색"><span>＋</span><span>테마</span></button>';
      ts.favorites.forEach(function(f){
        var isAct = sel && (sel.themeId === f.themeId || sel.id === f.id || sel.label === f.label);
        html += '<button type="button" class="theme-fav-chip ' + (isAct ? 'active' : '') + '" data-fav-id="' + f.id + '"><span>' + (f.icon || '⭐') + '</span><span>' + esc(f.label) + '</span></button>';
      });
      quickBarEl.innerHTML = html;

      var addBtn = document.getElementById('btnOpenThemeModal');
      if(addBtn) addBtn.onclick = openModal;

      quickBarEl.querySelectorAll('.theme-fav-chip').forEach(function(chip){
        chip.onclick = function(){
          var fid = chip.getAttribute('data-fav-id');
          var found = ts.favorites.find(function(item){ return item.id === fid; });
          if(found){
            var next = (sel && (sel.id === found.id || sel.themeId === found.themeId)) ? null : found;
            onSelect(next);
            renderQuickBar();
          }
        };
      });
    }

    function openModal(){
      if(!themeModal) return;
      themeModal.style.display = 'flex';
      renderTree();
    }
    function closeModal(){
      if(themeModal) themeModal.style.display = 'none';
    }

    var themeModalClose = document.getElementById('themeModalCloseBtn');
    if(themeModalClose) themeModalClose.onclick = closeModal;
    if(themeModal){
      themeModal.onclick = function(e){ if(e.target === themeModal) closeModal(); };
    }

    var tabCustom = document.getElementById('tabThemeCustom');
    var tabBrowse = document.getElementById('tabThemeBrowse');
    var panelCustom = document.getElementById('panelThemeCustom');
    var panelBrowse = document.getElementById('panelThemeBrowse');
    if(tabCustom && tabBrowse && panelCustom && panelBrowse){
      tabCustom.onclick = function(){
        tabCustom.classList.add('active'); tabBrowse.classList.remove('active');
        panelCustom.style.display = 'flex'; panelBrowse.style.display = 'none';
      };
      tabBrowse.onclick = function(){
        tabBrowse.classList.add('active'); tabCustom.classList.remove('active');
        panelBrowse.style.display = 'flex'; panelCustom.style.display = 'none';
        renderTree();
      };
    }

    var emojiPicker = document.getElementById('customThemeEmojiPicker');
    if(emojiPicker){
      var eBtns = emojiPicker.querySelectorAll('.theme-emoji-btn');
      eBtns.forEach(function(btn){
        btn.onclick = function(){
          eBtns.forEach(function(b){ b.classList.remove('active'); });
          btn.classList.add('active');
          curCustomEmoji = btn.getAttribute('data-emoji') || '⭐';
        };
      });
    }

    var btnCreateCustom = document.getElementById('btnCreateCustomTheme');
    if(btnCreateCustom){
      btnCreateCustom.onclick = async function(){
        var inp = document.getElementById('customThemeInput');
        var selMajor = document.getElementById('customThemeMajorSelect');
        var chkFav = document.getElementById('customThemeFavCheck');
        var label = inp ? inp.value.trim() : '';
        if(!label){ toast('테마 이름을 입력해주세요'); return; }
        var prof = getProfile();
        var newCustom = addCustomTheme(prof, label, curCustomEmoji, selMajor ? selMajor.value : 'routine');
        if(newCustom){
          if(chkFav && chkFav.checked) toggleFavorite(prof, newCustom);
          onSelect(newCustom);
          await saveProfile();
          renderQuickBar();
          closeModal();
          if(inp) inp.value = '';
          toast('나만의 테마 [' + label + '] 생성 및 적용 완료!');
        }
      };
    }

    function renderTree(){
      var container = document.getElementById('themeTreeContainer');
      if(!container) return;
      var prof = getProfile();
      var ts = getThemeSettings(prof);
      var html = '';
      THEME_ONTOLOGY.forEach(function(m){
        html += '<div class="theme-tree-major">';
        html += '<div class="theme-tree-head" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display===\'none\'?\'flex\':\'none\'">';
        html += '<span>' + m.icon + ' ' + esc(m.label) + '</span><span style="font-size:12px;color:var(--text-2);">펼치기 ▾</span></div>';
        html += '<div class="theme-tree-content" style="display:none;">';
        m.subs.forEach(function(s){
          html += '<div style="font-size:12px;font-weight:600;color:var(--text-2);margin-top:4px;">• ' + esc(s.label) + '</div><div class="theme-leaf-grid">';
          s.items.forEach(function(it){
            var isFav = ts.favorites.some(function(f){ return f.themeId === it.id; });
            html += '<div class="theme-leaf-chip" data-theme-id="' + it.id + '"><span class="theme-chip-pick">' + (it.icon || '') + ' ' + esc(it.label) + '</span><span class="theme-star-icon ' + (isFav ? 'starred' : '') + '" data-star-id="' + it.id + '">' + (isFav ? '★' : '☆') + '</span></div>';
          });
          html += '</div>';
        });
        html += '</div></div>';
      });
      container.innerHTML = html;

      container.querySelectorAll('.theme-chip-pick').forEach(function(el){
        el.onclick = function(e){
          e.stopPropagation();
          var flat = FLAT_THEME_MAP[el.closest('.theme-leaf-chip').getAttribute('data-theme-id')];
          if(flat){
            onSelect(flat);
            renderQuickBar();
            closeModal();
            toast('[' + flat.label + '] 테마 적용됨');
          }
        };
      });

      container.querySelectorAll('.theme-star-icon').forEach(function(el){
        el.onclick = async function(e){
          e.stopPropagation();
          var flat = FLAT_THEME_MAP[el.getAttribute('data-star-id')];
          if(flat){
            var added = toggleFavorite(getProfile(), flat);
            await saveProfile();
            renderQuickBar();
            renderTree();
            toast(added ? '즐겨찾기 추가됨' : '즐겨찾기 해제됨');
          }
        };
      });
    }

    var searchInp = document.getElementById('themeSearchInput');
    var searchRes = document.getElementById('themeSearchResults');
    if(searchInp && searchRes){
      searchInp.oninput = function(){
        var q = searchInp.value.trim();
        if(!q){ searchRes.style.display = 'none'; return; }
        var prof = getProfile();
        var customThemes = (prof && prof.themeSettings) ? prof.themeSettings.customThemes : [];
        var results = searchThemes(q, customThemes);
        if(results.length === 0){
          searchRes.innerHTML = '<div style="font-size:12px;color:var(--text-2);padding:8px 0;">검색 결과가 없습니다.</div>';
        } else {
          var rHtml = '';
          results.forEach(function(r){
            rHtml += '<div class="theme-leaf-chip theme-search-item" data-res-id="' + r.id + '"><span>' + (r.icon || '') + ' ' + esc(r.label) + ' <small style="color:var(--text-2);font-size:11px;">(' + esc(r.majorLabel) + ')</small></span></div>';
          });
          searchRes.innerHTML = rHtml;
          searchRes.querySelectorAll('.theme-search-item').forEach(function(item){
            item.onclick = function(){
              var found = results.find(function(x){ return x.id === item.getAttribute('data-res-id'); });
              if(found){
                onSelect(found);
                renderQuickBar();
                closeModal();
                toast('[' + found.label + '] 테마 적용됨');
              }
            };
          });
        }
        searchRes.style.display = 'flex';
      };
    }

    return {
      renderQuickBar: renderQuickBar,
      openModal: openModal,
      closeModal: closeModal
    };
  }

  window.OurgoalThemeSystem = {
    ONTOLOGY: THEME_ONTOLOGY,
    FLAT_MAP: FLAT_THEME_MAP,
    DEFAULT_FAVORITES: DEFAULT_FAVORITES,
    getThemeSettings: getThemeSettings,
    searchThemes: searchThemes,
    suggestTheme: suggestTheme,
    addCustomTheme: addCustomTheme,
    toggleFavorite: toggleFavorite,
    buildCheckinThemePayload: buildCheckinThemePayload,
    initUI: initUI
  };

})(typeof window !== 'undefined' ? window : this);
