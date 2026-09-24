// api/_lib/gemini-gateway.js
// #TASK-ES-251: 제미나이 API 엔터프라이즈 복원력 중앙 게이트웨이
// - Multi-Key 풀링 및 429 쿨다운 로테이터
// - 3-State Serverless Circuit Breaker (CLOSED / OPEN / HALF-OPEN)
// - Strict Timeout Controller (기본 4,000ms AbortSignal)
// - 공식 표준 모델 캐스케이드 (gemini-2.0-flash -> gemini-1.5-flash -> gemini-1.5-flash-8b)
// - SHA-256 인메모리 캐시 & In-Flight Deduplication
// - Self-Healing JSON Repair 파서
// - 100% 오프라인 온톨로지 폴백 엔진

var crypto = require('crypto');

// 1. 설정 및 상수
var OFFICIAL_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b'];
var DEFAULT_TIMEOUT_MS = 4000;
var KEY_COOLDOWN_MS = 60000; // 429 발생 시 60초간 해당 키 격리
var CIRCUIT_FAILURE_THRESHOLD = 3; // 연속 3회 실패 시 OPEN
var CIRCUIT_RESET_TIMEOUT_MS = 30000; // 30초 후 HALF-OPEN
var DEFAULT_CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12시간

// 2. 인메모리 글로벌 상태
var keyCooldownMap = new Map(); // key -> cooldownExpiresAt
var circuitState = {
  state: 'CLOSED', // 'CLOSED', 'OPEN', 'HALF-OPEN'
  consecutiveFailures: 0,
  lastFailureTime: 0
};
var responseCache = new Map(); // hashKey -> { data, expiresAt }
var inFlightPromises = new Map(); // hashKey -> Promise

// 3. 서킷 브레이커 관리
function getCircuitStatus() {
  var now = Date.now();
  if (circuitState.state === 'OPEN') {
    if (now - circuitState.lastFailureTime > CIRCUIT_RESET_TIMEOUT_MS) {
      circuitState.state = 'HALF-OPEN';
      return 'HALF-OPEN';
    }
    return 'OPEN';
  }
  return circuitState.state;
}

function recordCircuitSuccess() {
  circuitState.state = 'CLOSED';
  circuitState.consecutiveFailures = 0;
}

function recordCircuitFailure() {
  circuitState.consecutiveFailures++;
  circuitState.lastFailureTime = Date.now();
  if (circuitState.consecutiveFailures >= CIRCUIT_FAILURE_THRESHOLD) {
    circuitState.state = 'OPEN';
    console.warn('[Gemini Circuit Breaker] Threshold reached. State shifted to OPEN for ' + (CIRCUIT_RESET_TIMEOUT_MS / 1000) + 's.');
  }
}

// 4. API Key Pool & Roation
function getAvailableKeys() {
  var now = Date.now();
  var rawKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_FALLBACK,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4
  ].filter(function(k) { return typeof k === 'string' && k.trim().length > 10; });

  // 중복 키 제거
  var uniqueKeys = Array.from(new Set(rawKeys));
  
  return uniqueKeys.filter(function(k) {
    var cooldown = keyCooldownMap.get(k);
    if (!cooldown) return true;
    if (now > cooldown) {
      keyCooldownMap.delete(k);
      return true;
    }
    return false;
  });
}

function markKeyRateLimited(key) {
  if (!key) return;
  var expiresAt = Date.now() + KEY_COOLDOWN_MS;
  keyCooldownMap.set(key, expiresAt);
  console.warn('[Gemini Gateway] Key ' + key.slice(0, 6) + '... hit 429. Cooling down for 60s.');
}

// 5. Self-Healing JSON Parser (스택 기반 자동 복구)
function repairAndParseJson(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;

  var cleaned = rawText
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  // JSON 시작 부분 찾기
  var firstBrace = cleaned.indexOf('{');
  var firstBracket = cleaned.indexOf('[');
  var startIndex = -1;

  if (firstBrace !== -1 && firstBracket !== -1) {
    startIndex = Math.min(firstBrace, firstBracket);
  } else if (firstBrace !== -1) {
    startIndex = firstBrace;
  } else if (firstBracket !== -1) {
    startIndex = firstBracket;
  }

  if (startIndex === -1) return null;

  var target = cleaned.substring(startIndex).trim();

  // 1차 일반 파싱 시도
  try {
    return JSON.parse(target);
  } catch (e1) {}

  // 2차 자기치유: 스택 기반 괄호 및 따옴표 복구
  try {
    var stack = [];
    var inString = false;
    var escaped = false;

    for (var i = 0; i < target.length; i++) {
      var ch = target[i];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        continue;
      }
      if (!inString) {
        if (ch === '{') {
          stack.push('}');
        } else if (ch === '[') {
          stack.push(']');
        } else if (ch === '}' || ch === ']') {
          if (stack.length > 0 && stack[stack.length - 1] === ch) {
            stack.pop();
          }
        }
      }
    }

    var healed = target;
    if (inString) {
      healed += '"';
    }

    // trailing comma 제거
    healed = healed
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/,\s*$/g, '');

    // 남아있는 괄호를 안쪽부터 역순으로 닫기
    while (stack.length > 0) {
      healed += stack.pop();
    }

    // 최종 파싱 시도
    return JSON.parse(healed);
  } catch (e2) {
    return null;
  }
}

// 6. SHA-256 캐시 키 생성기
function makeCacheKey(task, prompt, isJson) {
  return crypto.createHash('sha256')
    .update((task || '') + '::' + (prompt || '') + '::' + (isJson ? '1' : '0'))
    .digest('hex');
}

// 7. 내장 100% 로컬 온톨로지 폴백 엔진
var LocalOntology = {
  getGoalTemplate: function(desc) {
    var d = (desc || '').toLowerCase();
    var major = 'mind';
    var minor = '습관형성';
    var title = (desc || '나의 새 목표').slice(0, 30);
    var milestones = [
      { title: '준비 및 실행 환경 구축', tasks: ['목표 시각화하기', '필요 도구 준비하기'] },
      { title: '매일 15분 꾸준한 실천', tasks: ['첫 주 3회 실천하기', '기록 남기기'] },
      { title: '습관 정착 및 성취 점검', tasks: ['한 달 성과 회고하기', '다음 단계 수립'] }
    ];

    if (/운동|헬스|러닝|달리기|체중|다이어트|수영|자전거|홈트/i.test(d)) {
      major = 'health';
      minor = '운동·건강';
      title = title || '규칙적인 운동 습관 완성';
      milestones = [
        { title: '기초 체력 측정 및 루틴 설정', tasks: ['가벼운 스트레칭 및 웜업', '주 3회 운동 시간 확정'] },
        { title: '목표 운동 점진적 증량', tasks: ['정해진 세트/거리 달성', '운동 일지 및 수분 섭취 기록'] },
        { title: '한 달 달성도 평가 및 루틴 유지', tasks: ['신체 변화 측정', '지속 가능한 루틴으로 고도화'] }
      ];
    } else if (/공부|시험|자격증|영어|토익|코딩|독서|책/i.test(d)) {
      major = 'study';
      minor = '학습·자격';
      title = title || '집중 학습 및 목표 달성';
      milestones = [
        { title: '학습 범위 분석 및 계획 수립', tasks: ['교재/강의 목차 확인', '일일 학습 분량 분배'] },
        { title: '매일 핵심 개념 학습 및 문제 풀이', tasks: ['핵심 요약 노트 작성', '오답 분석 및 복습'] },
        { title: '실전 모의고사 및 최종 마무리', tasks: ['실전 감각 익히기', '취약 영역 집중 보완'] }
      ];
    } else if (/돈|저축|재테크|주식|부업|커리어|이직|포폴/i.test(d)) {
      major = 'career';
      minor = '커리어·머니';
      title = title || '경제적 자유 및 커리어 성장';
      milestones = [
        { title: '현재 재정/경력 현황 점검', tasks: ['지출 내역/이력서 분석', '단기 달성 지표 설정'] },
        { title: '실질적인 실행 및 파이프라인 구축', tasks: ['고정비 절감 및 저축액 증액', '역량 강화 프로젝트 실행'] },
        { title: '성과 검토 및 피드백 반영', tasks: ['목표 저축액/포트폴리오 완성', '다음 분기 로드맵 수립'] }
      ];
    }

    return {
      title: title,
      topicMajor: major,
      topicMinor: minor,
      milestones: milestones,
      source: 'local-ontology'
    };
  },

  getMission: function(goalTitle) {
    var gt = (goalTitle || '').toLowerCase();
    if (/운동|헬스|달리기|체중/i.test(gt)) {
      return '가벼운 스트레칭 5분으로 몸 풀고 오늘의 활력 채우기';
    } else if (/공부|영어|코딩|독서/i.test(gt)) {
      return '핵심 1페이지 집중해서 읽고 기억에 남는 한 줄 기록하기';
    } else if (/돈|저축|지출/i.test(gt)) {
      return '오늘 발생한 지출 1건 점검하고 불필요한 소비 점검하기';
    }
    return '오늘의 가장 중요한 작은 실천 1개 즉시 완수하기';
  },

  getFeedback: function(doneText, feelingText, goalTitle) {
    var dt = doneText || '실천 완수';
    return {
      cheer: '오늘도 스스로와의 약속을 지켜내신 점이 정말 자랑스럽습니다! 작은 꾸준함이 모여 놀라운 변화를 만듭니다.',
      coach: '내일도 오늘처럼 무리하지 말고 딱 10분만 실천한다는 마음으로 편안하게 이어가보세요.',
      source: 'local-ontology'
    };
  },

  getNextAction: function(goalTitle) {
    return {
      action: '내일 실천할 첫 번째 작은 행동 미리 메모해두기',
      tip: '시작이 반입니다. 시작 단계를 가장 쉽게 만들어두세요.'
    };
  },

  getGoalStatus: function(progress) {
    var p = typeof progress === 'number' ? progress : 50;
    if (p >= 80) {
      return { status: 'excellent', message: '목표 달성이 눈앞에 있습니다! 마지막까지 집중력을 유지해보세요.' };
    } else if (p >= 40) {
      return { status: 'steady', message: '안정적인 궤도에 올랐습니다. 꾸준한 페이스를 이어가는 것이 핵심입니다.' };
    }
    return { status: 'starting', message: '시작이 절반입니다. 매일의 작은 첫걸음이 큰 성장의 밑거름이 됩니다.' };
  }
};

// 8. 메인 게이트웨이 실행 함수
async function callGeminiGateway(options) {
  var opts = options || {};
  var task = opts.task || 'default';
  var prompt = opts.prompt || '';
  var isJson = opts.isJson !== false;
  var temperature = typeof opts.temperature === 'number' ? opts.temperature : 0.2;
  var timeoutMs = opts.timeoutMs || DEFAULT_TIMEOUT_MS;
  var localFallback = typeof opts.localFallback === 'function' ? opts.localFallback : null;
  var cacheTtl = typeof opts.cacheTtlMs === 'number' ? opts.cacheTtlMs : DEFAULT_CACHE_TTL_MS;

  if (!prompt || typeof prompt !== 'string') {
    if (localFallback) return localFallback();
    return isJson ? {} : '';
  }

  // 1. 캐시 확인
  var cacheKey = makeCacheKey(task, prompt, isJson);
  if (cacheTtl > 0) {
    var cached = responseCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }
  }

  // 2. In-Flight 중복 요청 처리 (동일 프롬프트 동시 유입 시 하나만 실행)
  if (inFlightPromises.has(cacheKey)) {
    try {
      return await inFlightPromises.get(cacheKey);
    } catch (e) {
      // 인플라이트 에러 시 자체 폴백 진행
    }
  }

  var executionPromise = (async function() {
    // 3. 서킷 브레이커 상태 점검
    var circuitStatus = getCircuitStatus();
    if (circuitStatus === 'OPEN') {
      console.warn('[Gemini Gateway] Circuit is OPEN. Bypassing remote calls and using local fallback.');
      if (localFallback) return localFallback();
      return isJson ? LocalOntology.getGoalTemplate(prompt) : LocalOntology.getMission(prompt);
    }

    // 4. 활성 API 키 풀 확인
    var availableKeys = getAvailableKeys();
    if (availableKeys.length === 0) {
      console.warn('[Gemini Gateway] No active API keys available (all cooling down or missing).');
      if (localFallback) return localFallback();
      return isJson ? LocalOntology.getGoalTemplate(prompt) : LocalOntology.getMission(prompt);
    }

    // 5. 키 및 모델 캐스케이드 실행
    var lastError = null;

    for (var ki = 0; ki < availableKeys.length; ki++) {
      var currentKey = availableKeys[ki];

      for (var mi = 0; mi < OFFICIAL_MODELS.length; mi++) {
        var currentModel = OFFICIAL_MODELS[mi];
        var controller = new AbortController();
        var timerId = setTimeout(function() {
          controller.abort();
        }, timeoutMs);

        try {
          var url = 'https://generativelanguage.googleapis.com/v1beta/models/' +
            currentModel + ':generateContent?key=' + encodeURIComponent(currentKey);

          var bodyPayload = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: temperature
            }
          };

          if (isJson) {
            bodyPayload.generationConfig.responseMimeType = 'application/json';
          }

          var res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyPayload),
            signal: controller.signal
          });

          clearTimeout(timerId);

          if (res.status === 429) {
            markKeyRateLimited(currentKey);
            // 키가 429면 다음 모델이 아니라 다음 키로 바로 전환
            break;
          }

          if (res.ok) {
            var data = await res.json();
            var rawText = (data.candidates &&
              data.candidates[0] &&
              data.candidates[0].content &&
              data.candidates[0].content.parts &&
              data.candidates[0].content.parts[0] &&
              data.candidates[0].content.parts[0].text) || '';

            if (isJson) {
              var parsed = repairAndParseJson(rawText);
              if (parsed) {
                recordCircuitSuccess();
                if (cacheTtl > 0) {
                  responseCache.set(cacheKey, { data: parsed, expiresAt: Date.now() + cacheTtl });
                }
                return parsed;
              }
            } else if (rawText) {
              recordCircuitSuccess();
              var cleanStr = rawText.trim();
              if (cacheTtl > 0) {
                responseCache.set(cacheKey, { data: cleanStr, expiresAt: Date.now() + cacheTtl });
              }
              return cleanStr;
            }
          } else {
            console.warn('[Gemini Gateway] Model ' + currentModel + ' returned status: ' + res.status);
          }
        } catch (callErr) {
          clearTimeout(timerId);
          lastError = callErr;
          // 타임아웃 또는 네트워크 실패 시 다음 모델로 진행
        }
      }
    }

    // 모든 시도 실패 시 서킷 브레이커 실패 기록
    recordCircuitFailure();

    // 로컬 폴백 반환
    if (localFallback) {
      return localFallback();
    }
    return isJson ? LocalOntology.getGoalTemplate(prompt) : LocalOntology.getMission(prompt);
  })();

  inFlightPromises.set(cacheKey, executionPromise);

  try {
    var result = await executionPromise;
    return result;
  } finally {
    inFlightPromises.delete(cacheKey);
  }
}

function handler(req, res) {
  if (res && typeof res.status === 'function') {
    return res.status(200).json({ ok: true, service: 'gemini-gateway', status: 'healthy' });
  }
}

handler.callGeminiGateway = callGeminiGateway;
handler.repairAndParseJson = repairAndParseJson;
handler.LocalOntology = LocalOntology;
handler.getCircuitStatus = getCircuitStatus;
handler.recordCircuitSuccess = recordCircuitSuccess;
handler.recordCircuitFailure = recordCircuitFailure;
handler.markKeyRateLimited = markKeyRateLimited;
handler.OFFICIAL_MODELS = OFFICIAL_MODELS;
handler._resetStateForTests = function() {
  keyCooldownMap.clear();
  circuitState.state = 'CLOSED';
  circuitState.consecutiveFailures = 0;
  circuitState.lastFailureTime = 0;
  responseCache.clear();
  inFlightPromises.clear();
};

module.exports = handler;
