/**
 * OurGoal Record Theme Classifier (기록 — 테마 온톨로지·낱말·정규식·카테고리 기반 분류)
 *
 * 기록 테마 온톨로지 6종(RECORD_THEMES)과 키워드·정규식·카테고리 표를 소유하고 classifyRecordTheme의 분류 결과를 만든다.
 * 원래 인라인 변수와 앱 스코프 통로를 보존해 기록 카드·테마 선택·내보내기·프로필 읽기·피드백 코드가 같은 데이터와 함수를 읽는다. 미사용 빠른 체크인과 buildCheckinRecord는 원본에 남긴다.
 * #TASK-ES-569(기록 테마 분류와 공용 토스트 표시 책임 분열): index.html 인라인 IIFE 의 구간(이전 전 4372~4427 · 4428~4450 · 4451~4456 · 4457~4474 · 4475~4527줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalRecordsKit = global.OurgoalRecordsKit || {};

  /* ---- 이전 전 index.html 4372~4427줄(#TASK-ES-569 생성기 표지) ---- */
  var RECORD_THEMES = {
    mind: {
      key: 'mind',
      label: '심리상태',
      icon: '',
      color: '#8b5cf6',
      bgColor: 'rgba(139,92,246,0.12)',
      borderColor: 'rgba(139,92,246,0.35)',
      desc: '기분·감정·멘탈케어·휴식'
    },
    study: {
      key: 'study',
      label: '공부기록',
      icon: '',
      color: '#1D63D6',
      bgColor: 'rgba(59,130,246,0.12)',
      borderColor: 'rgba(59,130,246,0.35)',
      desc: '학습·시험·독서·강의·코딩'
    },
    business: {
      key: 'business',
      label: '사업기록',
      icon: '',
      color: '#0B7355',
      bgColor: 'rgba(16,185,129,0.12)',
      borderColor: 'rgba(16,185,129,0.35)',
      desc: '업무·매출·고객·기획·프로젝트'
    },
    schedule: {
      key: 'schedule',
      label: '약속기록',
      icon: '',
      color: '#9A4508',
      bgColor: 'rgba(245,158,11,0.12)',
      borderColor: 'rgba(245,158,11,0.35)',
      desc: '약속·모임·일정·회의·만남'
    },
    workout: {
      key: 'workout',
      label: '운동기록',
      icon: '',
      color: '#D92B41',
      bgColor: 'rgba(239,68,68,0.12)',
      borderColor: 'rgba(239,68,68,0.35)',
      desc: '헬스·러닝·필라테스·식단·루틴'
    },
    daily: {
      key: 'daily',
      label: '일상/기타',
      icon: '🌱',
      color: '#5F6B7A',
      bgColor: 'rgba(100,116,139,0.12)',
      borderColor: 'rgba(100,116,139,0.35)',
      desc: '기타 일상 및 생각'
    }
  };
  /* ---- 이전 전 index.html 4428~4450줄(#TASK-ES-569 생성기 표지) ---- */

  var THEME_KEYWORDS = {
    mind: [
      '심리','멘탈','기분','우울','불안','행복','감사','스트레스','힐링','휴식','지치','번아웃',
      '마음','위로','명상','산책','평온','다짐','자책','답답','눈물','홀가분','뿌듯','짜증'
    ],
    study: [
      '공부','독서','도서관','강의','수업','시험','인강','토익','과제','학습','자격증','영단어',
      '기출','복습','코딩','알고리즘','백준','스터디','논문','암기','단어장','필기','오답'
    ],
    business: [
      '사업','매출','고객','계약','미팅','기획','보고서','업무보고','업무','출근','퇴근','야근','프로젝트',
      '출시','런칭','개발','투자','마케팅','광고','외근','영업','바이어','회의','피칭','세일즈'
    ],
    schedule: [
      '약속','만남','친구','데이트','약속시간','모임','회식','식사','가족','방문','접견','동창',
      '카페에서','일정','참석','동호회','파티','생일','초대'
    ],
    workout: [
      '운동','헬스','러닝','달리기','웨이트','스쿼트','벤치','유산소','스트레칭','필라테스',
      '수영','자전거','식단','단백질','벌크업','감량','체중','인바디','근력','오운완','피티'
    ]
  };
  /* ---- 이전 전 index.html 4451~4456줄(#TASK-ES-569 생성기 표지) ---- */

  var THEME_REGEX_RULES = [
    { theme: 'study', re: /(?:^|\s)책(?:[을를이가은는과와에로도만]|\s|$)/i, label: '독서' },
    { theme: 'business', re: /(?:^|\s)보고(?:서|회|[를에]|\s*완료|\s*드림|\s*작성)/i, label: '보고' },
    { theme: 'schedule', re: /(?:^|\s)만나(?:서|기로|고|다|러)/i, label: '만남' }
  ];
  /* ---- 이전 전 index.html 4457~4474줄(#TASK-ES-569 생성기 표지) ---- */

  var CATEGORY_THEME_MAP = {
    'health': 'workout',
    'workout': 'workout',
    'fitness': 'workout',
    'study': 'study',
    'learning': 'study',
    'exam': 'study',
    'coding': 'study',
    'business': 'business',
    'career': 'business',
    'work': 'business',
    'money': 'business',
    'mind': 'mind',
    'habit': 'mind',
    'relationship': 'schedule',
    'schedule': 'schedule'
  };
  /* ---- 이전 전 index.html 4475~4527줄(#TASK-ES-569 생성기 표지) ---- */

  function classifyRecordTheme(text, category){
    var hay = (text || '').toLowerCase();
    var scores = { mind:0, study:0, business:0, schedule:0, workout:0, daily:0 };

    if(category){
      var majorCat = String(category).split('/')[0].toLowerCase();
      var mapped = CATEGORY_THEME_MAP[majorCat];
      if(mapped && scores[mapped] !== undefined){
        scores[mapped] += 1.5;
      }
    }

    var matchedWords = {};
    Object.keys(THEME_KEYWORDS).forEach(function(themeKey){
      matchedWords[themeKey] = [];
      THEME_KEYWORDS[themeKey].forEach(function(kw){
        if(hay.indexOf(kw) !== -1){
          scores[themeKey] += 1.0;
          matchedWords[themeKey].push(kw);
        }
      });
    });

    THEME_REGEX_RULES.forEach(function(rule){
      if(rule.re.test(hay)){
        scores[rule.theme] += 1.0;
        if(!matchedWords[rule.theme]) matchedWords[rule.theme] = [];
        matchedWords[rule.theme].push(rule.label);
      }
    });

    var bestTheme = 'daily';
    var maxScore = 0;
    ['mind','study','business','workout','schedule'].forEach(function(t){
      if(scores[t] > maxScore){
        maxScore = scores[t];
        bestTheme = t;
      }
    });

    var subTheme = (matchedWords[bestTheme] && matchedWords[bestTheme].length > 0)
      ? matchedWords[bestTheme].slice(0, 2).join('·')
      : (RECORD_THEMES[bestTheme] ? RECORD_THEMES[bestTheme].desc.split('·')[0] : '');

    var confidence = maxScore >= 2 ? 0.95 : (maxScore >= 1 ? 0.8 : 0.6);

    return {
      theme: bestTheme,
      subTheme: subTheme,
      confidence: confidence
    };
  }

  K.RECORD_THEMES = RECORD_THEMES;
  K.THEME_KEYWORDS = THEME_KEYWORDS;
  K.THEME_REGEX_RULES = THEME_REGEX_RULES;
  K.CATEGORY_THEME_MAP = CATEGORY_THEME_MAP;
  K.classifyRecordTheme = classifyRecordTheme;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
