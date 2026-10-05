/**
 * OurGoal Record AI Feedback (기록 탭 — 체크인 AI 피드백 요청·프롬프트)
 *
 * #TASK-ES-436 (인라인 스크립트 세포화 P1): index.html 인라인 IIFE 에서 옮긴 묶음 —
 *   milestonesForAI(이전 전 15225~15233줄 · 구획 「AI feedback (best-effort; provider-aware; local fallback)」)
 *   getUpcomingSchedulesForAI · getRecentCheckinsForAI · getLastFeedbackAdvice · initFeedbackTierBar · buildFeedbackPrompt · parseFeedbackJSON · requestAIFeedback(이전 전 15243~15492줄 · 구획 「AI feedback (best-effort; provider-aware; local fallback)」)
 * requestAIFeedback = 체크인 기록에 대한 AI 피드백(공급자별 요청 → 실패 시 로컬 문구) · buildFeedbackPrompt 등 프롬프트 재료.
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

  function milestonesForAI(goal){
    if(!goal || !Array.isArray(goal.milestones)) return [];
    return goal.milestones.map(function(m){
      return {
        id: m.id, title: m.title, status: m.status, result: m.result || null,
        tasks: (m.tasks||[]).map(function(t){ return { id:t.id, title:t.title, done:!!t.done, result:t.result||null }; })
      };
    });
  }

  function getUpcomingSchedulesForAI(daysAhead){
    daysAhead = daysAhead || 30;
    var now = new Date();
    var todayKey = L.dateKey(L.nowISO());
    var limit = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    var limitKey = L.dateKey(limit.toISOString());
    var itemsByDate = L.calendarItemsByDate();
    var upcoming = [];

    Object.keys(itemsByDate).sort().forEach(function(dKey){
      if(dKey >= todayKey && dKey <= limitKey){
        var items = itemsByDate[dKey] || [];
        items.forEach(function(it){
          if(!it.done){
            var diffDays = Math.ceil((new Date(dKey).getTime() - new Date(todayKey).getTime()) / (24*60*60*1000));
            var ddayStr = diffDays === 0 ? 'D-Day' : ('D-' + diffDays);
            upcoming.push({
              date: dKey,
              dday: ddayStr,
              diffDays: diffDays,
              title: it.title,
              kind: it.kind,
              category: it.goalTitle || it.kind
            });
          }
        });
      }
    });
    return upcoming.slice(0, 15);
  }

  function getRecentCheckinsForAI(days){
    days = days || 3;
    if(!L.state.profile || !Array.isArray(L.state.profile.records)) return [];
    var recs = L.state.profile.records;
    var now = new Date();
    var cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    var cutoffKey = (typeof L.dateKey === 'function') ? L.dateKey(cutoff.toISOString()) : cutoff.toISOString().slice(0, 10);
    var list = [];
    for(var i = 0; i < recs.length; i++){
      var r = recs[i];
      if(!r) continue;
      var d = r.startAt ? ((typeof L.dateKey === 'function') ? L.dateKey(r.startAt) : r.startAt.slice(0, 10)) : (r.date || '');
      if(d && d >= cutoffKey){
        list.push({
          date: d,
          text: (r.text || r.title || '').slice(0, 150),
          theme: r.theme || 'daily'
        });
        if(list.length >= 8) break;
      }
    }
    if(list.length === 0 && recs.length > 0){
      return recs.slice(0, days).map(function(r){
        return {
          date: r.startAt ? ((typeof L.dateKey === 'function') ? L.dateKey(r.startAt) : r.startAt.slice(0, 10)) : (r.date || ''),
          text: (r.text || r.title || '').slice(0, 150),
          theme: r.theme || 'daily'
        };
      });
    }
    return list;
  }

  function getLastFeedbackAdvice(){
    if(L.state.lastCapture && L.state.lastCapture.feedback){
      var fb = L.state.lastCapture.feedback;
      var act = fb.next_action || fb.nextAction || (fb.suggestions && fb.suggestions[0] && fb.suggestions[0].reason) || '';
      if(act) return { actionSuggested: act, verdict: fb.verdict || '', createdAt: L.nowISO() };
    }
    if(L.state.profile && Array.isArray(L.state.profile.records)){
      for(var i = 0; i < L.state.profile.records.length; i++){
        var r = L.state.profile.records[i];
        if(r && r.feedback){
          var act2 = r.feedback.next_action || r.feedback.nextAction || (r.feedback.suggestions && r.feedback.suggestions[0] && r.feedback.suggestions[0].reason) || '';
          if(act2) return { actionSuggested: act2, verdict: r.feedback.verdict || '', createdAt: r.startAt || r.createdAt || L.nowISO() };
        }
      }
    }
    return null;
  }

  function initFeedbackTierBar(){
    var bar = document.getElementById('checkinFeedbackTierBar');
    if(!bar) return;

    var savedTier = null;
    try {
      savedTier = localStorage.getItem('ourgoal_ai_feedback_mode');
    } catch(e){}
    if(!savedTier && L.state.profile && L.state.profile.settings && L.state.profile.settings.aiFeedbackMode){
      savedTier = L.state.profile.settings.aiFeedbackMode;
    }
    L.state.aiFeedbackMode = savedTier || L.state.aiFeedbackMode || 'default';

    var btns = bar.querySelectorAll('.tier-btn');
    var descTitle = document.getElementById('aiModeDescTitle');
    var descBody = document.getElementById('aiModeDescBody');
    var modeTag = document.getElementById('activeAiModeTag');

    var modeInfo = {
      default: {
        title: '⚡ 기본 피드백 모드',
        tag: '기본 모드',
        body: '오늘 실천 팩트 + 최근 연계 + 내일 1가지 행동을 간결한 3문장으로 코칭합니다.'
      },
      medium: {
        title: '🔍 중간 피드백 모드 (궤적 분석)',
        tag: '중간 모드',
        body: '최근 3~5일간의 실천 궤적을 비교 분석하고, 루틴 마찰점을 찾아 극복 전략을 피드백합니다.'
      },
      macro: {
        title: '🎯 정밀 피드백 모드 (일정 추천)',
        tag: '정밀 모드',
        body: 'D-Day 목표 사각지대를 정밀 진단하고, 캘린더에 바로 등록할 수 있는 추천 일정을 제시합니다.'
      }
    };

    function updateTierUI(selectedTier){
      btns.forEach(function(b){
        var isMatch = b.dataset.fbtier === selectedTier;
        b.classList.toggle('active', isMatch);
        if(isMatch){
          b.style.background = 'var(--accent, #3182f6)';
          b.style.color = '#fff';
          b.style.fontWeight = '700';
          b.style.boxShadow = '0 2px 8px rgba(49,130,246,0.35)';
        } else {
          b.style.background = 'transparent';
          b.style.color = 'var(--ink-soft)';
          b.style.fontWeight = '600';
          b.style.boxShadow = 'none';
        }
      });
      var cur = modeInfo[selectedTier] || modeInfo.default;
      if(descTitle) descTitle.textContent = cur.title;
      if(descBody) descBody.textContent = cur.body;
      if(modeTag) modeTag.textContent = cur.tag;
    }
    updateTierUI(L.state.aiFeedbackMode);

    btns.forEach(function(b){
      b.onclick = function(e){
        e.preventDefault();
        var tier = b.dataset.fbtier || 'default';
        L.state.aiFeedbackMode = tier;
        try {
          localStorage.setItem('ourgoal_ai_feedback_mode', tier);
          if(L.state.profile && L.state.profile.settings){
            L.state.profile.settings.aiFeedbackMode = tier;
            if(typeof L.saveProfile === 'function') L.saveProfile();
          }
        } catch(err){}

        updateTierUI(tier);
        if(typeof L.triggerHaptic === 'function') L.triggerHaptic(15);
        if(tier === 'default'){
          L.toast('AI 기본 모드: 오늘 팩트 + 최근 연계 + 내일 1가지 행동 (3문장)');
        } else if(tier === 'medium'){
          L.toast('AI 중간 모드: 최근 3~5일 실천 궤적 + 루틴 마찰점 분석');
        } else if(tier === 'macro'){
          L.toast('AI 정밀 모드: D-Day 가상 레일 사각지대 진단 + 캘린더 일정 추천');
        }
      };
    });
  }

  function buildFeedbackPrompt(goal, text, theme, upcomingSchedules, mode, recentRecords){
    goal = goal || (L.state.profile.goals && L.state.profile.goals[0]) || { title: '나의 일상 성장', milestones: [] };
    if(!Array.isArray(goal.milestones)) goal.milestones = [];
    mode = mode || L.state.aiFeedbackMode || 'default';
    recentRecords = recentRecords || getRecentCheckinsForAI(3);
    var detectedTheme = theme || ((typeof L.classifyRecordTheme === 'function') ? L.classifyRecordTheme(text, goal ? goal.category : null).theme : 'daily');
    var themeLens = L.THEME_FEEDBACK_PROMPTS[detectedTheme] || L.THEME_FEEDBACK_PROMPTS.daily;
    var msJson = JSON.stringify(milestonesForAI(goal));
    var settings = L.state.profile.settings;
    var custom = (settings.customFeedbackActive && settings.customFeedbackPrompt) ? settings.customFeedbackPrompt : '';
    var personaBlock = custom ? ('[페르소나 지침]\r\n'+custom+'\r\n\r\n') : '';
    var roleLine = custom
      ? '당신은 위 페르소나 지침에 따라 행동하는 목표 달성 피드백 봇입니다.'
      : '당신은 목표 달성 코치입니다.';
    var thLabel = (typeof L.RECORD_THEMES !== 'undefined' && L.RECORD_THEMES[detectedTheme]) ? L.RECORD_THEMES[detectedTheme].label : detectedTheme;

    var recentBlock = '';
    if(Array.isArray(recentRecords) && recentRecords.length > 0){
      recentBlock = '\r\n\r\n[최근 3일 실천 기록 (연계 분석용)]\r\n' +
        recentRecords.map(function(r){ return '- (' + r.date + ') ' + r.text; }).join('\r\n') +
        '\r\n지침: 사용자의 최근 실천 흐름과 오늘 기록을 비교·연계하여 조언하세요.\r\n';
    }

    var modeInstruction = '';
    if(mode === 'default'){
      modeInstruction = '\r\n[모드: 기본 피드백] 오늘 기록 팩트 분석 + 어제/최근 연계 + 내일 1가지 행동 위주로 총 3문장 이내로 작성하세요.\r\n';
    } else if(mode === 'medium'){
      modeInstruction = '\r\n[모드: 중간 피드백] 최근 3~5일 실천 궤적과 루틴 마찰점을 분석하여 5~6문장으로 구체적인 피드백을 제공하세요.\r\n';
    } else if(mode === 'macro'){
      modeInstruction = '\r\n[모드: 정밀 피드백] D-Day 목표와 향후 30일 일정을 대조하여 사각지대를 진단하고 전략적 조언을 제공하세요.\r\n';
    }

    upcomingSchedules = upcomingSchedules || getUpcomingSchedulesForAI(30);
    var schedSection = '';
    if(Array.isArray(upcomingSchedules) && upcomingSchedules.length > 0){
      var schedListStr = upcomingSchedules.map(function(s){
        return '- [' + s.dday + ' / ' + s.date + '] ' + s.title + ' (관련: ' + (s.category||'일반') + ')';
      }).join('\r\n');
      schedSection = '\r\n\r\n[향후 30일간의 다가오는 일정 목록]\r\n' + schedListStr + '\r\n\r\n' +
        '[일정 연계 피드백 지침 - 필수 준수]\r\n' +
        '1. 사용자의 체크인/기록에 대한 피드백을 충실히 제공하면서, 위 [향후 30일간의 다가오는 일정 목록]을 확인하세요.\r\n' +
        '2. 만약 이번 기록과 맥락상 관련이 있거나(예: 목표 준비 과정, 대회/발표/시험 대비 등), 사용자가 놓치기 쉽고 미리 계획/준비해야 할 중요한 임박 일정(D-3~D-7 이내 등)이 있다면 comment 끝에 자연스럽게 1~2문장의 일정 리마인드 및 준비 조언을 함께 포함하세요.\r\n' +
        '3. ★ 절대 주의: 관련없는 피드백을 위한 피드백은 엄격히 금지합니다. 기록과 전혀 무관하고 급하지도 않은 일정을 억지로 끌어오거나 형식적인 참견을 하지 마세요. 연관된 일정이 없거나 특별히 챙길 것이 없을 때는 기록에 대한 본연의 코칭에만 집중하세요.';
    }

    return personaBlock + roleLine + ' [기록 테마 코칭 지침: ' + thLabel + ']\r\n' + themeLens + '\r\n\r\n' +
      recentBlock + modeInstruction + '\r\n\r\n' +
      '사용자의 목표 구조(마일스톤과 하위 할 일)와 방금 남긴 기록을 보고, ' +
      '그 기록이 목표 달성에 도움이 되는지 판단하고, 이 기록이 실제로 어떤 마일스톤이나 할 일의 진행 상태·결과를 바꿀 만한 확실한 근거가 되는지도 함께 판단하세요.\r\n\r\n' +
      '[기록 테마]\r\n' + thLabel + '\r\n\r\n' +
      '[사용자의 목표]\r\n최종 목표: ' + goal.title + '\r\n\r\n' +
      '[마일스톤/할 일 목록 - JSON, id는 그대로 참조용. result는 {target,result,unit,note} 형태의 결과 기록칸]\r\n' + msJson + '\r\n\r\n' +
      '[방금 남긴 기록]\r\n"' + text + '"' +
      schedSection + '\r\n\r\n' +
      '아래 JSON 형식으로만 답하세요. 다른 텍스트나 코드블록, 마크다운 없이 순수 JSON만 출력하세요.\r\n' +
      '근거가 확실하지 않으면 suggestions는 빈 배열로 두세요. 애매하면 절대 추측해서 제안하지 마세요.\r\n' +
      '특히 기록에 특정 마일스톤·할 일과 관련된 구체적인 계획·방법·루틴(예: "주 3회 루틴 만들기" 항목에 대해 언제·어떻게 운동할지)이 담겨 있다면, ' +
      'field를 "note"로 하고 value에 사용자가 말한 내용을 1~2문장으로 자연스럽게 정리해 그 항목의 결과 메모로 제안하세요(사용자의 표현을 존중하되 군더더기 없이 요약).\r\n' +
      '{"verdict":"도움됨 또는 애매함 또는 도움안됨 중 하나",' +
      '"comment":"1~2문장의 짧고 솔직한 피드백 (필요 시 자연스러운 다가오는 일정 리마인드 포함, 무관한 강제 피드백 금지)",' +
      '"suggestions":[{"type":"milestone 또는 task","id":"위 목록에 있는 id 값 그대로",' +
      '"field":"status 또는 done 또는 result 또는 note 중 하나",' +
      '"value":"status면 todo/doing/done 중 하나, done이면 true/false, result면 result.target이 이미 있는 항목에 한해 새 숫자값, note면 기록 내용을 정리한 1~2문장 요약",' +
      '"reason":"왜 이렇게 판단했는지 1문장"}]}';
  }
  function parseFeedbackJSON(raw){
    var clean = raw.replace(/```json|```/g,'').trim();
    var parsed = JSON.parse(clean);
    if(!parsed || !parsed.verdict) throw new Error('bad shape');
    if(!Array.isArray(parsed.suggestions)) parsed.suggestions = [];
    return parsed;
  }
  async function requestAIFeedback(goal, text, theme){
    if(!goal){
      goal = (L.state.profile.goals && L.state.profile.goals[0]) || { title: '나의 일상 성장', milestones: [] };
    }
    var provider = (L.state.profile.settings.aiProvider) || 'gemini';
    if(provider==='gemini' && L.state.profile.settings.geminiKey){
      var g = await K.requestGeminiFeedback(goal, text, theme);
      if(g) return g;
    }
    return K.requestServerAIFeedback(goal, text, theme);
  }

  K.milestonesForAI = milestonesForAI;
  K.getUpcomingSchedulesForAI = getUpcomingSchedulesForAI;
  K.getRecentCheckinsForAI = getRecentCheckinsForAI;
  K.getLastFeedbackAdvice = getLastFeedbackAdvice;
  K.initFeedbackTierBar = initFeedbackTierBar;
  K.buildFeedbackPrompt = buildFeedbackPrompt;
  K.parseFeedbackJSON = parseFeedbackJSON;
  K.requestAIFeedback = requestAIFeedback;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
