/**
 * Ourgoal Content Moderation & False-Positive Prevention Engine (#TASK-ES-058)
 * - 범죄, 음란, 자해 등 사회적 규범에 반하는 키워드 감지 및 생성 차단
 * - 오탐(False Positive: 치료/극복/예방/학습/비유적 표현) 스마트 보호
 * - 상민님 지시 규격:
 *   메시지: '아워골 내부 차단 키워드가 식별되어 생성이 거부되었습니다'
 *   안내: '설정탭의 1:1 문의 및 오류 제보를 사용하세요'
 * - UMD 모듈: 브라우저(window.OurgoalModeration) 및 Node.js 서버리스 API 공용
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.OurgoalModeration = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var REJECT_MESSAGE = '아워골 내부 차단 키워드가 식별되어 생성이 거부되었습니다';
  var REJECT_DETAIL = '사회적 규범(범죄, 음란 등)에 부합하지 않는 키워드가 감지되었습니다.';
  var REJECT_SUPPORT = "정상적인 의도의 목표/템플릿이나 시스템 오인 차단인 경우, 아워골 앱 내 [설정] 탭의 '1:1 문의 및 오류 제보를 사용하세요'.";

  // 1. 오탐(False Positive) 방지용 건전/치료/극복/예방 허용 패턴
  var ALLOWED_RECOVERY_REGEX = /(?:도박|마약|담배|흡연|알코올|알콜|술|약물|스마트폰|게임|유튜브|숏폼|웹툰|폭식|야식|탄산|단것)\s*(?:끊기|끊는|탈출|치료|극복|완치|재활|상담|예방|퇴치|근절|벗어나기|중단|줄이기|금지|회복|단념)/i;
  var ALLOWED_METAPHOR_REGEX = /살인적인\s*(?:스케줄|일정|더위|추위|업무|운동|루틴|훈련|페이스|강도|노력|성장)/i;
  var ALLOWED_SECURITY_STUDY_REGEX = /(?:화이트\s*해커|정보보안|모의해킹\s*대회|해킹\s*(?:대회|방어|대비|스터디|자격증|공부|학습|보안|연구|강의|책|윤리)|CTF)/i;
  var ALLOWED_FOOD_METAPHOR_REGEX = /마약\s*(?:옥수수|김밥|토스트|베이글|떡볶이|치킨|쿠키|소스|빵)/i;

  // 2. 범죄 / 불법 키워드 (CRIME)
  var CRIME_PATTERNS = [
    // 마약류 (치료/극복 문맥 제외)
    { tag: '마약류', regex: /(?:필로폰|메스암페타민|대마초|대마액상|엑스터시|코카인|헤로인|케타민|LSD|환각물질|프로포폴\s*불법|졸피뎀\s*(?:불법|대리|판매|구매))/i },
    // 사기 / 피싱 / 금융범죄
    { tag: '사기/피싱', regex: /(?:보이스\s*피싱|스미싱|몸캠\s*피싱|대포\s*통장|대포\s*폰|카드깡|전세\s*사기|폰지\s*사기|작업\s*대출|통장\s*매매)/i },
    // 불법도박 / 사행성
    { tag: '불법도박', regex: /(?:불법\s*도박|사설\s*토토|토토\s*사이트|사설\s*사다리|사설\s*카지노|불법\s*홀덤|바카라\s*사이트|먹튀\s*사이트)/i },
    // 강력범죄 / 폭력 / 청부
    { tag: '강력범죄', regex: /(?:청부\s*살인|살인\s*청부|살인\s*교사|살해\s*방법|보복\s*살인|보복\s*폭행|장기\s*매매|인신\s*매매|폭탄\s*테러|사제\s*폭탄|총기\s*밀수)/i },
    // 사이버범죄 / 악성 해킹
    { tag: '사이버범죄', regex: /(?:악성코드\s*유포|랜섬웨어\s*제작|디도스\s*공격|DDOS\s*공격|해킹\s*툴\s*배포|계정\s*탈취|비밀번호\s*크래킹)/i }
  ];

  // 3. 음란 / 성범죄 키워드 (OBSCENE)
  var OBSCENE_PATTERNS = [
    { tag: '성착취/성범죄', regex: /(?:성매매|조건\s*만남|원조\s*교제|불법\s*촬영|몰카\s*(?:촬영|공유|판매)|리벤지\s*포르노|성폭행|강간|아동\s*청소년\s*성착취|딥페이크\s*음란|성착취물|n번방)/i },
    { tag: '음란물', regex: /(?:음란물|야동\s*(?:사이트|유포|다운)|야설\s*연재|포르노\s*(?:사이트|제작)|성인용\s*음란)/i }
  ];

  // 4. 극단선택 / 자해 키워드 (SELF_HARM)
  var SELF_HARM_PATTERNS = [
    { tag: '극단선택/자해', regex: /(?:자살\s*(?:방법|동반|사이트|모의)|동반\s*자살|자해\s*(?:방법|인증|도구)|극단적\s*선택\s*방법)/i }
  ];

  /**
   * 입력 텍스트 모더레이션 검사
   * @param {string} text - 사용자 입력 텍스트
   * @returns {object} { flagged: boolean, keyword: string|null, category: string|null, message: string, detail: string, support: string }
   */
  function check(text) {
    if (!text || typeof text !== 'string') {
      return { flagged: false, keyword: null, category: null };
    }

    var clean = text.trim();
    if (!clean) {
      return { flagged: false, keyword: null, category: null };
    }

    // 1단계: 선한 의도/치료/극복/공부/비유적 표현 (오탐 방지 화이트리스트) 선제 판정
    if (ALLOWED_RECOVERY_REGEX.test(clean) ||
        ALLOWED_METAPHOR_REGEX.test(clean) ||
        ALLOWED_SECURITY_STUDY_REGEX.test(clean) ||
        ALLOWED_FOOD_METAPHOR_REGEX.test(clean)) {
      return {
        flagged: false,
        keyword: null,
        category: null,
        isWhitelisted: true
      };
    }

    // 2단계: 범죄(CRIME) 검사
    for (var ci = 0; ci < CRIME_PATTERNS.length; ci++) {
      var cp = CRIME_PATTERNS[ci];
      var cMatch = clean.match(cp.regex);
      if (cMatch) {
        return {
          flagged: true,
          keyword: cMatch[0],
          category: 'crime',
          tag: cp.tag,
          message: REJECT_MESSAGE,
          detail: REJECT_DETAIL,
          support: REJECT_SUPPORT
        };
      }
    }

    // 3단계: 음란/성범죄(OBSCENE) 검사
    for (var oi = 0; oi < OBSCENE_PATTERNS.length; oi++) {
      var op = OBSCENE_PATTERNS[oi];
      var oMatch = clean.match(op.regex);
      if (oMatch) {
        return {
          flagged: true,
          keyword: oMatch[0],
          category: 'obscene',
          tag: op.tag,
          message: REJECT_MESSAGE,
          detail: REJECT_DETAIL,
          support: REJECT_SUPPORT
        };
      }
    }

    // 4단계: 극단선택/자해(SELF_HARM) 검사
    for (var si = 0; si < SELF_HARM_PATTERNS.length; si++) {
      var sp = SELF_HARM_PATTERNS[si];
      var sMatch = clean.match(sp.regex);
      if (sMatch) {
        return {
          flagged: true,
          keyword: sMatch[0],
          category: 'self_harm',
          tag: sp.tag,
          message: REJECT_MESSAGE,
          detail: REJECT_DETAIL,
          support: REJECT_SUPPORT
        };
      }
    }

    return {
      flagged: false,
      keyword: null,
      category: null
    };
  }

  return {
    check: check,
    REJECT_MESSAGE: REJECT_MESSAGE,
    REJECT_DETAIL: REJECT_DETAIL,
    REJECT_SUPPORT: REJECT_SUPPORT
  };
}));