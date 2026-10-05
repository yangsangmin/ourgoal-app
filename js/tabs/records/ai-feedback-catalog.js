/**
 * OurGoal AI Feedback Catalog (기록 — 테마별 피드백 지시문·로컬 피드백 문구·Gemini 쿼터 큐·완료 낱말)
 *
 * 「AI feedback (best-effort; provider-aware; local fallback)」 묶음의 THEME_FEEDBACK_PROMPTS, 「[#TASK-ES-225] Gemini API 분당 쿼터 방어」 묶음의 PREMIUM_FEEDBACK_CATALOG·GeminiQuotaDispatcher·DONE_KEYWORDS. window 노출 문과 상태 변수 requestClaudeFeedback 은 원래 자리.
 * #TASK-ES-556(인라인 3단계 구역 Z6 표준 3): index.html 인라인 IIFE 의 구간(이전 전 5890~5899 · 5904~5945 · 5946~6037 · 6043~6045줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 5890~5899줄(#TASK-ES-556 생성기 표지) ---- */
  /* ============ AI feedback (best-effort; provider-aware; local fallback) ============ */
  /* [#TASK-ES-436] milestonesForAI → js/tabs/records/ai-feedback.js 로 옮김(인라인 스크립트 세포화 P1) */
  var THEME_FEEDBACK_PROMPTS = {
    mind: '이 기록은 [심리상태] 테마로 분류되었습니다. 사용자의 감정 상태, 멘탈 회복, 스트레스 관리 관점에서 깊이 공감하고 따뜻한 위로와 마인드셋 회복 조언을 포함하세요.',
    study: '이 기록은 [공부기록] 테마로 분류되었습니다. 학습 효율성, 복습 주기, 지식 습득의 깊이 관점에서 구체적이고 실천적인 학습 피드백을 제공하세요.',
    business: '이 기록은 [사업기록] 테마로 분류되었습니다. 업무 생산성, 비즈니스 성과, 마일스톤 진척도, 우선순위 관리 관점에서 전략적 피드백을 제공하세요.',
    schedule: '이 기록은 [약속기록] 테마로 분류되었습니다. 대인 관계, 네트워킹 가치, 약속 이행 및 시간 관리 관점의 조언을 제공하세요.',
    workout: '이 기록은 [운동기록] 테마로 분류되었습니다. 신체 건강, 운동 루틴의 지속성, 점진적 과부하와 부상 방지 관점에서 활력 넘치는 피드백을 제공하세요.',
    daily: '이 기록은 [일상/기타] 테마입니다. 작은 일상의 실천이 주는 의미와 가치를 격려하세요.'
  };

  /* ---- 이전 전 index.html 5904~5945줄(#TASK-ES-556 생성기 표지) ---- */
  var PREMIUM_FEEDBACK_CATALOG = {
    study: [
      { verdict: '학습 몰입', headline: '개념 이해와 체화가 확실히 이루어졌습니다 📚', fact_insight: '오늘 기록된 학습 내용에서 깊은 집중과 이해도가 돋보입니다.', continuity: '매일의 학습 누적이 강력한 시험/과제 합격의 밑거름이 됩니다.', next_action: '취침 전 오늘 공부한 핵심 키워드 3가지만 머릿속으로 떠올려보세요.' },
      { verdict: '핵심 돌파', headline: '어려운 범위를 피하지 않고 정면으로 돌파했어요 ✍️', fact_insight: '쉽지 않은 학습 분량을 꾸준한 인내로 끝까지 마쳤습니다.', continuity: '이해되지 않던 부분도 반복 인출을 거치면 완전히 내 것이 됩니다.', next_action: '내일 첫 세션에는 오늘 헷갈렸던 문제 1개부터 먼저 확인하세요.' },
      { verdict: '지속성 입증', headline: '작은 분량이라도 매일 하는 것이 최상의 전략입니다 🎯', fact_insight: '바쁜 일정 속에서도 학습의 끈을 놓지 않고 훌륭히 체크인했습니다.', continuity: '스트릭이 이어지는 동안 학습 뇌신경 회로가 계속 강화됩니다.', next_action: '내일도 오늘과 같은 시간에 책상에 앉아 10분만 먼저 집중해보세요.' },
      { verdict: '오답 분석', headline: '틀린 문제를 마주하는 순간 진짜 실력이 늘어납니다 🔍', fact_insight: '약점을 솔직하게 짚어내고 기록으로 남긴 분석력이 뛰어납니다.', continuity: '오답 정리는 실전 시험에서 가장 확실한 점수 상승 포인트입니다.', next_action: '주말에 오답노트만 가볍게 훑는 15분 리마인드 타임을 가져보세요.' },
      { verdict: '기출 정복', headline: '출제 경향에 맞춘 실전 감각이 한층 날카로워졌어요 📝', fact_insight: '이론에 머물지 않고 실전 기출과 문제를 통해 응용력을 길렀습니다.', continuity: '시험장에서의 시간 배분과 문제 풀이 자신감이 올라가고 있습니다.', next_action: '다음 실전 풀이 때는 문제당 제한 시간을 1분씩 단축해보세요.' },
      { verdict: '완주 페이스', headline: '목표 시험을 향한 레이더 궤적이 완벽히 유지되고 있어요 🚀', fact_insight: '계획된 진도율에 맞추어 흔들림 없이 착실하게 전진했습니다.', continuity: '꾸준함이 쌓여 남들이 넘볼 수 없는 강력한 합격 경쟁력이 됩니다.', next_action: '오늘의 성취를 칭찬하고 편안한 수면으로 뇌에 장기기억을 저장하세요.' }
    ],
    workout: [
      { verdict: '근력 성장', headline: '신체 한계를 넘어서는 훌륭한 자극을 이끌어냈습니다 💪', fact_insight: '정확한 자세와 타깃 부위 자극에 집중하여 밀도 높은 세션을 완성했습니다.', continuity: '근육과 신경계가 오늘 실천을 바탕으로 더욱 단단하게 적응합니다.', next_action: '운동 직후 충분한 수분 섭취와 양질의 단백질 식사를 챙겨주세요.' },
      { verdict: '심폐 강화', headline: '호흡을 조절하며 목표 페이스를 굳건히 유지했습니다 🏃', fact_insight: '유산소 세션 동안 지속적인 심박수 유지와 안정된 주법이 돋보였습니다.', continuity: '지구력과 기초 체력이 계단식으로 향상되는 최적의 리듬입니다.', next_action: '폼롤러로 종아리와 햄스트링을 가볍게 5분간 풀어주세요.' },
      { verdict: '루틴 방어', headline: '피곤한 몸을 이끌고 시작 버튼을 누른 용기가 승리했습니다 🌿', fact_insight: '운동하기 싫은 마음을 극복하고 가볍게라도 움직임을 만들어냈습니다.', continuity: '완벽한 1회보다 멈추지 않는 10회의 가벼운 루틴이 평생 건강을 만듭니다.', next_action: '따뜻한 물로 샤워하고 내일 컨디션을 위해 30분 일찍 누워보세요.' },
      { verdict: '스트레칭', headline: '굳어있던 관절과 가동 범위를 부드럽게 깨웠습니다 🧘', fact_insight: '무리한 부하 대신 몸의 균형과 유연성을 챙기는 현명한 세션이었습니다.', continuity: '부상 없는 롱런이야말로 장기적인 운동 목표의 1순위 조건입니다.', next_action: '기상 직후 기지개를 켜며 가벼운 목·어깨 스트레칭을 이어가세요.' },
      { verdict: '기록 경신', headline: '과거의 나를 뛰어넘는 새로운 퍼포먼스를 달성했습니다 🏆', fact_insight: '무게나 횟수, 시간 면에서 눈에 띄는 성장을 직접 증명했습니다.', continuity: '점진적 과부하의 원리가 기록장 위에서 정직하게 결실을 맺고 있습니다.', next_action: '오늘 달성한 수치를 다음 주 운동 일지의 기준 벤치마크로 삼으세요.' },
      { verdict: '회복 조율', headline: '휴식도 훈련의 일부임을 인지한 스마트한 컨디셔닝입니다 🌙', fact_insight: '오버트레이닝을 방지하고 에너지를 비축하는 현명한 선택을 했습니다.', continuity: '충분히 회복된 몸은 다음 고강도 세션에서 폭발적인 힘을 발휘합니다.', next_action: '내일 진행할 메인 운동 2종목을 미리 머릿속으로 시각화해보세요.' }
    ],
    business: [
      { verdict: '생산성 돌파', headline: '가장 중요한 핵심 과제(Top-1)에 깊게 몰입했습니다 💼', fact_insight: '자잘한 일에 분산되지 않고 프로젝트의 핵심을 밀고 나갔습니다.', continuity: '중요한 일 하나를 끝내는 것이 백 가지 잡무보다 훨씬 큰 가치를 만듭니다.', next_action: '내일 오전에 가장 먼저 처리할 단 하나의 과제를 메모장에 적어두세요.' },
      { verdict: '실행력 가속', headline: '머릿속 기획을 실제 눈에 보이는 결과물로 전환했습니다 💻', fact_insight: '완벽주의에 빠지지 않고 빠른 실행과 피드백 루프를 가동했습니다.', continuity: '비즈니스는 생각의 깊이가 아닌 검증의 속도에서 차이가 발생합니다.', next_action: '오늘 구현한 결과물을 동료나 잠재 고객에게 가볍게 보여주세요.' },
      { verdict: '지표 추적', headline: '데이터와 팩트에 기반한 날카로운 시각을 견지했습니다 📊', fact_insight: '추측이 아닌 실제 수치와 사용자 반응을 꼼꼼하게 측정하고 정리했습니다.', continuity: '측정할 수 있는 것은 반드시 개선할 수 있다는 원칙이 입증되고 있습니다.', next_action: '지표의 변동 원인 중 가장 유의미한 가설 1가지를 정리해보세요.' },
      { verdict: '고객 중심', headline: '사용자의 진짜 문제와 결핍에 귀를 기울였습니다 🤝', fact_insight: '서비스 공급자의 관점을 내려놓고 고객의 실제 목소리에 집중했습니다.', continuity: '고객의 불편을 해결하는 것이 장기적인 서비스 성장의 유일한 해답입니다.', next_action: '고객이 언급한 단어와 표현을 마케팅/기획 문구에 그대로 반영해보세요.' },
      { verdict: '리스크 방어', headline: '잠재적 병목과 오류 가능성을 사전에 차단했습니다 🛡️', fact_insight: '문제가 터지기 전에 꼼꼼하게 예외 케이스를 점검하고 대비책을 세웠습니다.', continuity: '안정적인 인프라와 프로세스가 받쳐줄 때 비즈니스는 비로소 확장됩니다.', next_action: '체크리스트에 누락된 절차가 없는지 5분간만 다시 훑어보세요.' },
      { verdict: '전략적 회고', headline: '하루의 성과와 배운 점을 차분히 정리해 자산화했습니다 📑', fact_insight: '단순히 일하고 끝나는 것이 아니라, 프로세스 개선점으로 승화시켰습니다.', continuity: '오늘의 회고가 내일의 불필요한 시행착오를 수십 시간 절약해줍니다.', next_action: '오늘 가장 시간 낭비가 컸던 업무 1가지를 내일은 위임하거나 자동화하세요.' }
    ],
    mind: [
      { verdict: '마음 챙김', headline: '복잡한 감정을 있는 그대로 바라보고 인정했습니다 🧘', fact_insight: '스스로를 다그치지 않고 차분히 내면의 신호에 귀를 기울였습니다.', continuity: '감정을 억누르지 않고 수용할 때 비로소 진정한 회복 탄력성이 생깁니다.', next_action: '따뜻한 차 한 잔을 마시며 3분간 깊은 복식호흡을 해보세요.' },
      { verdict: '작은 승리', headline: '사소해 보이는 행동 하나가 하루 전체의 기분을 바꿉니다 ✨', fact_insight: '거창한 목표 대신 지금 당장 할 수 있는 작은 실천을 해냈습니다.', continuity: '작은 성취의 기쁨이 도파민을 분비시켜 내일의 활력을 만들어냅니다.', next_action: '오늘 나 자신에게 고마웠던 순간 1가지를 소리 내어 말해보세요.' },
      { verdict: '슬럼프 극복', headline: '가장 어두운 터널도 결국 한 걸음씩 걸으면 끝이 납니다 🌅', fact_insight: '무기력과 불안 속에서도 체크인을 남긴 것 자체가 대단한 승리입니다.', continuity: '바닥을 찍고 올라오는 회복의 힘은 이미 당신 안에 존재합니다.', next_action: '오늘은 더 이상 자책하지 말고 나를 위해 푹 쉬는 밤을 선물하세요.' },
      { verdict: '감사 발견', headline: '일상의 사소한 행복과 감사함을 포착해냈습니다 💛', fact_insight: '당연하게 지나칠 수 있는 순간에서 긍정의 에너지를 발견했습니다.', continuity: '감사하는 마음은 스트레스 호르몬을 낮추고 멘탈을 단단하게 지켜줍니다.', next_action: '오늘 감사했던 사람에게 따뜻한 안부 톡을 하나 보내보세요.' },
      { verdict: '자존감 충전', headline: '남과의 비교를 멈추고 오직 어제의 나와 마주했습니다 🌱', fact_insight: '타인의 속도에 흔들리지 않고 나만의 보폭으로 걸어가고 있습니다.', continuity: '인생은 단거리 전력질주가 아니라 나만의 완주 마라톤입니다.', next_action: '거울을 보며 "오늘도 수고 많았어"라고 따뜻하게 미소 지어주세요.' },
      { verdict: '평온한 쉼', headline: '치열했던 하루의 스위치를 끄고 온전한 평온에 닿았습니다 🌙', fact_insight: '생각의 소음을 멈추고 몸과 마음에 진정한 휴식을 허락했습니다.', continuity: '충분한 쉼이야말로 지속 가능한 성장을 위한 가장 중요한 투자입니다.', next_action: '스마트폰을 손에서 내려놓고 편안한 음악과 함께 눈을 감아보세요.' }
    ],
    daily: [
      { verdict: '루틴 완주', headline: '매일 반복되는 일상을 특별한 성장으로 가꾸었습니다 🌟', fact_insight: '약속된 시간에 루틴을 묵묵히 실천한 성실함이 돋보입니다.', continuity: '습관은 우리가 매일 반복하는 행동들의 거울입니다.', next_action: '내일도 같은 시간 알람에 맞추어 루틴을 기분 좋게 시작해보세요.' },
      { verdict: '스트릭 방어', headline: '소중한 연속 기록의 촛불이 오늘도 꺼지지 않았습니다 🔥', fact_insight: '어떤 변수 속에서도 오늘의 체크인을 사수해냈습니다.', continuity: '연속 기록의 숫자는 단순한 데이터가 아니라 당신의 끈기 그 자체입니다.', next_action: '스트릭 캘린더의 초록색 뱃지를 보며 뿌듯함을 만끽하세요.' },
      { verdict: '시간 관리', headline: '주어진 하루를 통제하며 주도적인 삶을 살아냈습니다 ⏰', fact_insight: '시간에 끌려다니지 않고 우선순위에 따라 현명하게 사용했습니다.', continuity: '하루를 지배하는 사람이 결국 자신의 인생 전체를 지배하게 됩니다.', next_action: '내일 오전 2시간을 방해받지 않는 골든 타임으로 지정해보세요.' },
      { verdict: '약속 이행', headline: '스스로에게 건넨 약속을 정직하게 지켜냈습니다 🤝', fact_insight: '남이 보지 않아도 나만의 기준을 지켜낸 자존감이 빛납니다.', continuity: '자신과의 약속을 지킬 때 세상 그 어떤 것보다 단단한 자신감이 쌓입니다.', next_action: '내일 나 자신과 맺을 단 하나의 약속을 떠올려보세요.' },
      { verdict: '데일리 클리어', headline: '오늘 해야 할 일들을 말끔하게 매듭지었습니다 🎯', fact_insight: '미루지 않고 끝맺음을 지어 산뜻한 성취감을 확보했습니다.', continuity: '미완성된 일의 잔상 없이 홀가분하게 하루를 마감할 수 있습니다.', next_action: '정리된 책상을 둘러보며 가벼운 마음으로 하루를 닫으세요.' },
      { verdict: '지속 가능한 삶', headline: '무리하지 않고 내일도 달릴 수 있는 균형을 찾았습니다 🌿', fact_insight: '과열되지도 지치지도 않는 황금률의 페이스를 유지했습니다.', continuity: '오래 달리는 사람이 결국 가장 멀리 도달하는 법입니다.', next_action: '내일의 나를 믿고 오늘 하루의 마침표를 기분 좋게 찍으세요.' }
    ]
  };
  /* ---- 이전 전 index.html 5946~6037줄(#TASK-ES-556 생성기 표지) ---- */

  var GeminiQuotaDispatcher = {
    backoffDelays: [1000, 2000, 4000],
    isThrottled: false,
    last429At: 0,
    throttleDurationMs: 60000,

    getPremiumFeedback: function(goal, text, theme, mode){
      goal = goal || (L.state.profile && L.state.profile.goals && L.state.profile.goals[0]) || { title: '일상 성장', milestones: [] };
      var cat = (theme || (goal && goal.category) || 'daily').toLowerCase();
      var pool = PREMIUM_FEEDBACK_CATALOG[cat] || PREMIUM_FEEDBACK_CATALOG.daily;
      if(!pool || pool.length === 0) pool = PREMIUM_FEEDBACK_CATALOG.daily;
      var seed = (text ? text.length : 0) + (goal && goal.title ? goal.title.length : 0) + new Date().getDate();
      var item = pool[seed % pool.length];

      var suggestions = [];
      if(goal && Array.isArray(goal.milestones)){
        var hay = (text || '').toLowerCase();
        goal.milestones.forEach(function(m){
          if(m && m.title && hay.indexOf(m.title.toLowerCase()) !== -1){
            suggestions.push({ type: 'milestone', id: m.id, field: 'status', value: 'done', reason: '실천 내용에 "' + m.title + '"가 언급되었어요' });
          }
        });
      }

      return {
        verdict: item.verdict,
        headline: item.headline,
        fact_insight: item.fact_insight,
        continuity: item.continuity,
        next_action: item.next_action,
        comment: item.fact_insight + ' ' + item.next_action,
        suggestions: suggestions,
        source: 'local_enhanced',
        provider: 'local_smart',
        isQuotaFallback: true,
        feedbackMode: mode || 'default'
      };
    },

    execute: async function(requestFn, fallbackFn){
      var self = this;
      var now = Date.now();
      if(self.isThrottled && (now - self.last429At < self.throttleDurationMs)){
        if(typeof L.toast === 'function'){
          L.toast('AI 응답량이 많아 고품질 추천 엔진으로 즉시 보답해 드렸습니다 ✨');
        }
        return fallbackFn ? fallbackFn() : null;
      }

      var maxRetries = 1;
      for(var attempt = 0; attempt <= maxRetries; attempt++){
        try {
          var res = await requestFn();
          if(res) {
            self.isThrottled = false;
            return res;
          }
        } catch(err){
          var errMsg = err && err.message ? String(err.message) : '';
          var is429 = errMsg.indexOf('429') !== -1 || errMsg.indexOf('quota') !== -1 || errMsg.indexOf('RESOURCE_EXHAUSTED') !== -1 || errMsg.indexOf('rate') !== -1;
          if(is429){
            self.isThrottled = true;
            self.last429At = Date.now();
            if(attempt < maxRetries){
              var delay = self.backoffDelays[attempt] || 1000;
              await new Promise(function(r){ setTimeout(r, delay); });
              continue;
            }
          }
          console.warn('[GeminiQuotaDispatcher] fallback triggered:', errMsg);
          break;
        }
      }

      if(typeof L.toast === 'function'){
        L.toast('AI 응답량이 많아 고품질 추천 엔진으로 즉시 보답해 드렸습니다 ✨');
      }
      return fallbackFn ? fallbackFn() : null;
    },

    simulate429: function(){
      this.isThrottled = true;
      this.last429At = Date.now();
      return true;
    },

    reset: function(){
      this.isThrottled = false;
      this.last429At = 0;
    }
  };

  /* ---- 이전 전 index.html 6043~6045줄(#TASK-ES-556 생성기 표지) ---- */

  /* [#TASK-ES-436] requestGeminiFeedback → js/tabs/records/ai-feedback-providers.js 로 옮김(인라인 스크립트 세포화 P1) */
  var DONE_KEYWORDS = ['완료','다 했','다했','끝냈','끝났','달성','마쳤','마무리','성공','clear','done'];

  K.THEME_FEEDBACK_PROMPTS = THEME_FEEDBACK_PROMPTS;
  K.PREMIUM_FEEDBACK_CATALOG = PREMIUM_FEEDBACK_CATALOG;
  K.GeminiQuotaDispatcher = GeminiQuotaDispatcher;
  K.DONE_KEYWORDS = DONE_KEYWORDS;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
