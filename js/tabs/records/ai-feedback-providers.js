/**
 * OurGoal Record AI Feedback Providers (기록 탭 — Gemini·서버 AI 피드백 요청과 로컬 대체 문구)
 *
 * #TASK-ES-436 (인라인 스크립트 세포화 P1): index.html 인라인 IIFE 에서 옮긴 묶음 —
 *   requestServerAIFeedback(이전 전 15632~15679줄 · 구획 「[#TASK-ES-225] [생각 메모장 95번] Gemini API 분당 쿼터(Rate Limit 429)」)
 *   requestGeminiFeedback(이전 전 15682~15724줄 · 구획 「[#TASK-ES-225] [생각 메모장 95번] Gemini API 분당 쿼터(Rate Limit 429)」)
 *   localFeedback(이전 전 15726~15814줄 · 구획 「[#TASK-ES-225] [생각 메모장 95번] Gemini API 분당 쿼터(Rate Limit 429)」)
 * GeminiQuotaDispatcher·PREMIUM_FEEDBACK_CATALOG 등 최상위 변수와 window 노출 문은 index.html 에 남았다.
 * 묶음의 함수 선언을 글자 그대로 옮겼다(묶음 전체가 함수뿐이면 구획 주석까지 통째로). 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>,
 * 같은 키트의 다른 세포 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓). 로드 중 바로 도는 문·최상위 변수는 index.html 원래 자리에 남았다.
 * index.html 은 IIFE 머리에서 이 키트의 함수 중 인라인에서 부르는 것을 같은 이름으로 가져와 부른다 — 부르는 쪽은 그대로다.
 * 지도: docs/architecture/INLINE-SCRIPT-MAP.md(scripts/inline-script-map.js). 선례: #TASK-ES-423. 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·toast·openModal …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 같은 탭 파일끼리 서로 부르는 함수 묶음(이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalRecordsKit = global.OurgoalRecordsKit || {};

  async function requestServerAIFeedback(goal, text, theme){
    return L.GeminiQuotaDispatcher.execute(
      async function(){
        goal = goal || (L.state.profile.goals && L.state.profile.goals[0]) || { title: '나의 일상 성장', milestones: [] };
        if(!Array.isArray(goal.milestones)) goal.milestones = [];
        var settings = L.state.profile.settings;
        var custom = (settings.customFeedbackActive && settings.customFeedbackPrompt) ? settings.customFeedbackPrompt : '';
        var upcomingSchedules = K.getUpcomingSchedulesForAI(30);
        var recentRecords = K.getRecentCheckinsForAI(3);
        var lastAdvice = K.getLastFeedbackAdvice();
        var mode = L.state.aiFeedbackMode || 'default';
        var controller = new AbortController();
        var timer = setTimeout(function(){ controller.abort(); }, 12000);
        try{
          var res = await fetch('/api/feedback', {
            method:'POST', headers:{'Content-Type':'application/json'}, signal: controller.signal,
            body: JSON.stringify({
              goalTitle: goal.title,
              milestones: K.milestonesForAI(goal),
              text: text,
              customPrompt: custom,
              theme: theme,
              geminiKey: settings.geminiKey || '',
              upcomingSchedules: upcomingSchedules,
              mode: mode,
              recentRecords: recentRecords,
              lastAdvice: lastAdvice
            })
          });
          clearTimeout(timer);
          if(!res.ok) throw new Error('server bad status ' + res.status);
          var parsed = await res.json();
          if(!parsed || !parsed.verdict) throw new Error('bad shape');
          if(!Array.isArray(parsed.suggestions)) parsed.suggestions = [];
          parsed.source = (parsed.provider === 'local_smart' || parsed.provider === 'server_period_smart') ? 'local_enhanced' : 'gemini';
          parsed.persona = !!custom;
          parsed.feedbackMode = mode;
          return parsed;
        } catch(e){
          clearTimeout(timer);
          throw e;
        }
      },
      function(){
        return L.GeminiQuotaDispatcher.getPremiumFeedback(goal, text, theme, L.state.aiFeedbackMode);
      }
    );
  }

  async function requestGeminiFeedback(goal, text, theme){
    return L.GeminiQuotaDispatcher.execute(
      async function(){
        var geminiPersona = !!(L.state.profile.settings.customFeedbackActive && L.state.profile.settings.customFeedbackPrompt);
        var mode = L.state.aiFeedbackMode || 'default';
        var recentRecords = K.getRecentCheckinsForAI(3);
        var upcomingSchedules = K.getUpcomingSchedulesForAI(30);
        var prompt = K.buildFeedbackPrompt(goal, text, theme, upcomingSchedules, mode, recentRecords);
        var model = L.state.profile.settings.geminiModel || 'gemini-3.1-flash-lite';
        var controller = new AbortController();
        var timer = setTimeout(function(){ controller.abort(); }, 12000);
        try{
          var res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model)+':generateContent', {
            method:'POST',
            headers:{ 'Content-Type':'application/json', 'x-goog-api-key': L.state.profile.settings.geminiKey },
            signal: controller.signal,
            body: JSON.stringify({ contents:[{ parts:[{ text: prompt }] }] })
          });
          clearTimeout(timer);
          if(!res.ok){
            var errBody = await res.text().catch(function(){ return ''; });
            throw new Error('gemini bad status '+res.status+' '+errBody.slice(0,200));
          }
          var data = await res.json();
          var raw = ((data.candidates||[])[0]||{}).content && data.candidates[0].content.parts
            ? data.candidates[0].content.parts.map(function(p){ return p.text||''; }).join('\r\n')
            : '';
          if(!raw) throw new Error('empty gemini response');
          var parsed = K.parseFeedbackJSON(raw);
          parsed.source = 'gemini';
          parsed.persona = geminiPersona;
          parsed.feedbackMode = mode;
          return parsed;
        } catch(e){
          clearTimeout(timer);
          throw e;
        }
      },
      function(){
        return L.GeminiQuotaDispatcher.getPremiumFeedback(goal, text, theme, L.state.aiFeedbackMode);
      }
    );
  }

  function localFeedback(goal, text, theme, upcomingSchedules){
    goal = goal || (L.state.profile.goals && L.state.profile.goals[0]) || { title: '나의 일상 성장', milestones: [] };
    if(!Array.isArray(goal.milestones)) goal.milestones = [];
    var hay = text.toLowerCase();
    var detectedTheme = theme || ((typeof L.classifyRecordTheme === 'function') ? L.classifyRecordTheme(text, goal ? goal.category : null).theme : 'daily');
    var goalWords = Array.from(new Set((goal.title+' '+(goal.milestones||[]).map(function(m){return m.title;}).join(' ')).toLowerCase().split(/[^a-z0-9가-힣]+/i).filter(function(w){ return w.length>1; })));
    var hit = goalWords.some(function(w){ return w && hay.indexOf(w)!==-1; });
    var hasDoneKeyword = L.DONE_KEYWORDS.some(function(k){ return hay.indexOf(k.toLowerCase())!==-1; });
    var suggestions = [];
    (goal.milestones||[]).forEach(function(m){
      var titleWords = m.title.toLowerCase().split(/[^a-z0-9가-힣]+/i).filter(function(w){ return w.length>1; });
      var titleHit = titleWords.some(function(w){ return w && hay.indexOf(w)!==-1; });
      if(!titleHit) return;
      if(hasDoneKeyword && m.status!=='done'){
        suggestions.push({ type:'milestone', id:m.id, field:'status', value:'done', reason:'기록에 "'+m.title+'"와(과) 완료를 암시하는 표현이 함께 있어요' });
      } else if(m.status==='todo'){
        suggestions.push({ type:'milestone', id:m.id, field:'status', value:'doing', reason:'기록에 "'+m.title+'" 관련 내용이 있어요' });
      }
    });

    var mode = (L.state && L.state.aiFeedbackMode) || 'default';
    var recentRecs = K.getRecentCheckinsForAI(3);
    var comment = '';
    // 기본(default), 중간(medium), 정밀(macro) 3대 맞춤 모드 분기
    if(mode === 'macro'){
      comment = '[정밀 진단] ' + (goal ? '"' + goal.title + '"의 D-Day 달성 궤적을 심층 분석했습니다. ' : '현재 목표의 D-Day 달성 궤적을 심층 분석했습니다. ') +
        '실행 밀도는 안정권이나 후반부 마일스톤 병목 위험을 사전에 방지할 필요가 있습니다. ' +
        '추천드린 중간 점검 일정을 캘린더에 연동하여 사각지대 없는 실행 레일을 유지하세요.';
    } else if(mode === 'medium'){
      var trendWord = (recentRecs.length >= 2) ? '최근 실천 리듬이 안정적으로 누적되고 있습니다. ' : '실천 루틴을 정착시키는 중요한 분기점입니다. ';
      comment = '[페이스 조율] ' + trendWord + (hit ? '"' + goal.title + '" 실행의 마찰을 줄이고 호흡을 조절하기에 최적의 타이밍입니다. ' : '무리한 확장보다는 집중도와 피로도의 균형을 맞추어 루틴의 지속 가능성을 높여보세요. ') +
        '현재 강도를 1주일간 유지하며 일상 속 정착을 권장합니다.';
    } else {
      var hitSentence = hit ? ('"' + goal.title + '"를 향한 소중한 실천을 충실히 완수하셨습니다.') : '오늘 계획된 실천을 훌륭히 수행하셨습니다.';
      var trajSentence = (recentRecs.length > 0) ? ('최근 ' + recentRecs.length + '일간 이어진 꾸준함이 확실한 성장의 모멘텀이 되고 있어요. ') : '오늘의 첫 실천이 내일의 큰 성장을 만드는 소중한 씨앗입니다. ';
      var nextSentence = '내일도 같은 시간대에 가벼운 1회 실천으로 이 좋은 리듬을 계속 이어가 보세요!';
      comment = hitSentence + trajSentence + nextSentence;
    }

    // 향후 30일 일정 연계 피드백 (단, 관련없는 피드백을 위한 피드백은 절대 금지)
    upcomingSchedules = upcomingSchedules || K.getUpcomingSchedulesForAI(30);
    if(Array.isArray(upcomingSchedules) && upcomingSchedules.length > 0){
      var relevantSched = upcomingSchedules.find(function(s){
        var sTitle = (s.title || '').toLowerCase();
        // 1) 이번 기록 텍스트에 해당 일정의 핵심 키워드가 직접적으로 들어간 경우
        var words = sTitle.split(/[^a-z0-9가-힣]+/i).filter(function(w){ return w.length >= 2; });
        var textMatch = words.some(function(w){ return hay.indexOf(w) !== -1; });
        // 2) 또는 3일 이내 임박한 일정(D-Day ~ D-3)이며 사용자의 현재 목표/기록 테마와 밀접한 경우
        var isUrgent = s.diffDays !== undefined && s.diffDays >= 0 && s.diffDays <= 3;
        var categoryMatch = s.category && goal.title && (goal.title.indexOf(s.category) !== -1 || s.category.indexOf(goal.title) !== -1);
        return textMatch || (isUrgent && (categoryMatch || hit));
      });
      if(relevantSched){
        comment += ' 💡 (다가오는 일정 알림: ' + relevantSched.dday + ' "' + relevantSched.title + '" 일정도 잊지 말고 미리 챙겨보세요!)';
      }
    }

    var verdict = '핵심 발견';
    if(mode === 'macro') verdict = '정밀 진단';
    else if(mode === 'medium') verdict = '페이스 조율';
    else if(hit || hasDoneKeyword) verdict = '실천 완주';

    var calAction = null;
    if(mode === 'macro'){
      calAction = {
        has_suggestion: true,
        suggested_date: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
        suggested_time: '14:00',
        title: (goal ? goal.title.slice(0, 15) : '목표') + ' 정밀 점검 및 중간 회고',
        duration_minutes: 60,
        note: 'D-Day 가상 레일 점검을 위한 캘린더 추천 일정'
      };
    }

    // 모드 및 상태 무결성 보존 객체 반환
    return {
      verdict: verdict,
      comment: comment,
      next_action: nextSentence,
      nextAction: nextSentence,
      fact_insight: hitSentence,
      factInsight: hitSentence,
      source: 'local',
      theme: detectedTheme,
      suggestions: suggestions,
      feedbackMode: mode,
      calendarAction: calAction
    };
  }

  K.requestServerAIFeedback = requestServerAIFeedback;
  K.requestGeminiFeedback = requestGeminiFeedback;
  K.localFeedback = localFeedback;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
