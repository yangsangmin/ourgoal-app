/**
 * Ourgoal Content Moderation & Anti-Abuse Defense Engine (#TASK-ES-058)
 * - 문제해결 8원칙 기반 오남용/우회/탈옥 방어 고도화
 * 
 * [4계층 다중 방어 아키텍처 (Multi-Layer Defense)]:
 * 1계층: 숨김 유니코드(Zero-width chars, Soft hyphen 등) 살균
 * 2계층: 원문(Raw Text) 3대 금칙어(범죄, 음란, 자해) 정밀 정규식 검사
 * 3계층: 특수기호 난독화(필.로.폰, 사_설_토_토) 압축 정규화 스트림 검사
 * 4계층: 영문 마약/사기/해킹 및 은어 거래 결합(아이스 팝니다, 떨 좌표) 정밀 탐지
 * 
 * [상민님 확정 멘트 규격]:
 * - 메시지: '아워골 내부 차단 키워드가 식별되어 생성이 거부되었습니다'
 * - 지원안내: "정상적인 의도의 목표/템플릿이나 시스템 오인 차단인 경우, 아워골 앱 내 [설정] 탭의 '1:1 문의 및 오류 제보를 사용하세요'."
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

  // ================= 1. 한글 3대 핵심 금칙어 패턴 (CRIME, OBSCENE, SELF_HARM) =================
  var CRIME_PATTERNS = [
    // 마약류
    { tag: '마약류', regex: /(?:필로폰|메스암페타민|대마초|대마액상|엑스터시|코카인|헤로인|케타민|LSD|환각물질|프로포폴\s*불법|졸피뎀\s*(?:불법|대리|판매|구매)|펜타닐|야바)/i },
    // 사기 / 피싱 / 금융범죄
    { tag: '사기/피싱', regex: /(?:보이스\s*피싱|스미싱|몸캠\s*피싱|대포\s*통장|대포\s*폰|카드깡|전세\s*사기|폰지\s*사기|작업\s*대출|통장\s*매매)/i },
    // 불법도박 / 사행성
    { tag: '불법도박', regex: /(?:불법\s*도박|사설\s*토토|토토\s*사이트|사설\s*사다리|사설\s*카지노|불법\s*홀덤|바카라\s*사이트|먹튀\s*사이트)/i },
    // 강력범죄 / 폭력 / 청부
    { tag: '강력범죄', regex: /(?:청부\s*살인|살인\s*청부|살인\s*교사|살해\s*방법|보복\s*살인|보복\s*폭행|장기\s*매매|인신\s*매매|폭탄\s*테러|사제\s*폭탄|총기\s*밀수)/i },
    // 사이버범죄 / 악성 해킹
    { tag: '사이버범죄', regex: /(?:악성코드\s*유포|랜섬웨어\s*제작|디도스\s*공격|DDOS\s*공격|해킹\s*툴\s*배포|계정\s*탈취|비밀번호\s*크래킹)/i }
  ];

  var OBSCENE_PATTERNS = [
    { tag: '성착취/성범죄', regex: /(?:성매매|조건\s*만남|원조\s*교제|불법\s*촬영|몰카\s*(?:촬영|공유|판매)|리벤지\s*포르노|성폭행|강간|아동\s*청소년\s*성착취|딥페이크\s*음란|성착취물|n번방)/i },
    { tag: '음란물', regex: /(?:음란물|야동\s*(?:사이트|유포|다운)|야설\s*연재|포르노\s*(?:사이트|제작)|성인용\s*음란)/i }
  ];

  var SELF_HARM_PATTERNS = [
    { tag: '극단선택/자해', regex: /(?:자살\s*(?:방법|동반|사이트|모의)|동반\s*자살|자해\s*(?:방법|인증|도구)|극단적\s*선택\s*방법)/i }
  ];

  // ================= 2. 영문 키워드 패턴 (단어 경계 \b 필수 적용으로 method 등 오탐 방지) =================
  var ENGLISH_PATTERNS = [
    { tag: '영문마약류', regex: /\b(?:meth|methamphetamine|philopon|fentanyl|cocaine|heroin|cannabis|marijuana|mdma|ecstasy|ketamine)\b/i },
    { tag: '영문사이버범죄', regex: /\b(?:ransomware|ddos\s*attack|voice\s*phishing|credential\s*stuffing)\b/i },
    { tag: '영문성범죄', regex: /\b(?:deepfake\s*porn|revenge\s*porn|child\s*pornography|child\s*sexual)\b/i },
    { tag: '영문불법도박', regex: /\b(?:illegal\s*gambling|toto\s*site|private\s*toto)\b/i }
  ];

  // ================= 3. 은어 + 거래 맥락 복합 패턴 (일상어 오탐 방지: 아메리카노 등 보호) =================
  // 은어 단독은 일상어(얼음 아이스, 나무 작대기 등)일 수 있으므로, 거래·유통 단어와 결합 시에만 차단
  var SLANG_TRADE_PATTERN = /(?:아이스|작대기|케이|떨|캔디)\s*(?:팝니다|삽니다|판매|구매|직거래|드랍|텔레|좌표|구입|샘플)/i;

  // ================= 4. 난독화 기호 정규화 헬퍼 =================
  // 글자 사이에 삽입되는 점, 밑줄, 하이픈, 공백, 물결, 특수기호 제거
  function stripNoise(str) {
    if (!str) return '';
    // 1) Zero-width 유니코드 및 숨김 문자 살균
    var sanitized = str.replace(/[\u200B-\u200D\uFEFF\u00AD\u2060]/g, '');
    // 2) 한글/영문 1글자 단위 사이에 끼어든 특수기호([._\-\s~*^!?/\\|,]+) 압축
    // 예: '필.로.폰' -> '필로폰', '사-설-토-토' -> '사설토토', '보!이!스!피!싱' -> '보이스피싱'
    var compressed = sanitized.replace(/([가-힣a-zA-Z0-9])[._\-\s~*^!?/\\|,]+(?=[가-힣a-zA-Z0-9])/g, '$1');
    return { sanitized: sanitized, compressed: compressed };
  }

  /**
   * 모더레이션 검사 함수 (다계층 방어)
   * @param {string} text - 검사 대상 텍스트
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

    // 1계층: 숨김 유니코드 및 특수기호 정규화 스트림 생성
    var noiseResult = stripNoise(clean);
    var sanitized = noiseResult.sanitized;
    var compressed = noiseResult.compressed;

    // 검사 대상 스트림 풀 (원문, 살균문, 기호압축문)
    var streams = [clean, sanitized, compressed];

    // 2계층: 한글 3대 핵심 금칙어 (원문 및 정규화 스트림 전수 대조)
    for (var sIdx = 0; sIdx < streams.length; sIdx++) {
      var target = streams[sIdx];
      if (!target) continue;

      // CRIME
      for (var ci = 0; ci < CRIME_PATTERNS.length; ci++) {
        var cp = CRIME_PATTERNS[ci];
        var cMatch = target.match(cp.regex);
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

      // OBSCENE
      for (var oi = 0; oi < OBSCENE_PATTERNS.length; oi++) {
        var op = OBSCENE_PATTERNS[oi];
        var oMatch = target.match(op.regex);
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

      // SELF_HARM
      for (var si = 0; si < SELF_HARM_PATTERNS.length; si++) {
        var sp = SELF_HARM_PATTERNS[si];
        var sMatch = target.match(sp.regex);
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
    }

    // 3계층: 영문 핵심 범죄/마약/사기 키워드 검사
    for (var ei = 0; ei < ENGLISH_PATTERNS.length; ei++) {
      var ep = ENGLISH_PATTERNS[ei];
      var eMatch = sanitized.match(ep.regex);
      if (eMatch) {
        return {
          flagged: true,
          keyword: eMatch[0],
          category: 'crime',
          tag: ep.tag,
          message: REJECT_MESSAGE,
          detail: REJECT_DETAIL,
          support: REJECT_SUPPORT
        };
      }
    }

    // 4계층: 은어 + 거래 맥락 복합 검사 (아이스 팝니다, 작대기 텔레 등)
    var slangMatch = sanitized.match(SLANG_TRADE_PATTERN) || compressed.match(SLANG_TRADE_PATTERN);
    if (slangMatch) {
      return {
        flagged: true,
        keyword: slangMatch[0],
        category: 'crime',
        tag: '마약은어거래',
        message: REJECT_MESSAGE,
        detail: REJECT_DETAIL,
        support: REJECT_SUPPORT
      };
    }

    return {
      flagged: false,
      keyword: null,
      category: null
    };
  }

  return {
    check: check,
    stripNoise: stripNoise,
    REJECT_MESSAGE: REJECT_MESSAGE,
    REJECT_DETAIL: REJECT_DETAIL,
    REJECT_SUPPORT: REJECT_SUPPORT
  };
}));