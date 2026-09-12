/* ============================================================
 * 아워골 — AI 피드백 고도화 및 30일 거시 일정 연계 시스템
 * #TASK-ES-042 · 본질 ① 체크인 루프 & 본질 ④ AI 지능화
 *
 * 1. 체크인 입력단 3초 마이크로 칩 ('이번기록의 체감', 컨디션, 소요시간)
 * 2. 3단 피드백 선택 모드 (기본 [기본값] / 중간 / 장기간 고려)
 * 3. 상태 기억 체인 (Memory Chain) 및 7일 롤링 TTL 휘발 정책
 * 4. 가상 D-Day 레일 엔진 (4단계 페이즈 & 30일 사각지대 진단)
 * 5. 원클릭 캘린더 등록 인터랙티브 카드
 * 6. 상투어 금지 가드레일 (네거티브 프롬프팅)
 * ============================================================ */
(function(root){
  'use strict';

  var MICRO_CHIPS = {
    condition: [
      { id: 'good',   label: '좋음' },
      { id: 'normal', label: '보통' },
      { id: 'tired',  label: '지침' }
    ],
    duration: [
      { id: 'short',  label: '15분 이하' },
      { id: 'medium', label: '30분' },
      { id: 'long',   label: '1시간 이상' }
    ],
    sessionFeel: [
      { id: 'proud',  label: '뿌듯함' },
      { id: 'barely', label: '간신히 버팀' },
      { id: 'regret', label: '아쉬움' }
    ]
  };

  var FEEDBACK_MODES = {
    default: { id: 'default', label: '기본 피드백', isDefault: true,  desc: '3문장 핵심 액션 코칭' },
    medium:  { id: 'medium',  label: '중간 피드백', isDefault: false, desc: '주간 루틴 및 페이스 분석' },
    macro:   { id: 'macro',   label: '장기간 고려', isDefault: false, desc: '30일 거시 진단 & 일정 제안' }
  };

  var NEGATIVE_PATTERNS = [
    /도움\s*됨/gi,
    /도움이\s*되었기를\s*바랍니다/gi,
    /오늘의\s*목표를\s*향한\s*의미\s*있는\s*실천이/gi,
    /참\s*잘하셨습니다/gi,
    /수고\s*많으셨습니다/gi,
    /앞으로도\s*꾸준히\s*하시면/gi
  ];

  var TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7일 (8일차부터 휘발)

  // ---------- 1. 가상 D-Day 레일 엔진 ----------
  function computeVirtualRail(goal, targetDateStr, nowInput){
    var now = nowInput ? new Date(nowInput) : new Date();
    var targetDate = targetDateStr ? new Date(targetDateStr) : null;
    if(!targetDate && goal && goal.dueDate){
      targetDate = new Date(goal.dueDate);
    }
    if(!targetDate || isNaN(targetDate.getTime())){
      // D-Day가 없는 경우 30일 가상 타임라인 기본값
      targetDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    var createdAt = (goal && goal.createdAt) ? new Date(goal.createdAt) : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    var totalSpanDays = Math.max(1, Math.round((targetDate.getTime() - createdAt.getTime()) / (24 * 60 * 60 * 1000)));
    var elapsedDays = Math.max(0, Math.round((now.getTime() - createdAt.getTime()) / (24 * 60 * 60 * 1000)));
    var remainingDays = Math.max(0, Math.round((targetDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
    var progressRatio = totalSpanDays > 0 ? Math.min(1, Math.max(0, elapsedDays / totalSpanDays)) : 0;

    var phases = [
      { phase: 1, name: '기반 다지기', startRatio: 0.0, endRatio: 0.30, hint: '개념 이해 및 기본 루틴 셋업' },
      { phase: 2, name: '핵심 빌드업', startRatio: 0.30, endRatio: 0.60, hint: '본격 실천 및 진도 가속' },
      { phase: 3, name: '실전 검증',   startRatio: 0.60, endRatio: 0.85, hint: '모의 테스트 및 중간 점검' },
      { phase: 4, name: '파이널 마감', startRatio: 0.85, endRatio: 1.00, hint: '최종 마무리 및 오답 정리' }
    ];

    var currentPhase = phases[0];
    for(var i = 0; i < phases.length; i++){
      if(progressRatio >= phases[i].startRatio && progressRatio <= phases[i].endRatio){
        currentPhase = phases[i];
        break;
      }
    }

    // 사각지대 탐지: 목표에 등록된 마일스톤 중 현재/차기 페이즈 관련 항목 검사
    var msList = (goal && Array.isArray(goal.milestones)) ? goal.milestones : [];
    var hasVerification = msList.some(function(m){
      var t = (m.title || '').toLowerCase();
      return t.indexOf('모의') !== -1 || t.indexOf('검증') !== -1 || t.indexOf('테스트') !== -1 || t.indexOf('피칭') !== -1 || t.indexOf('실전') !== -1;
    });

    var gapWarning = null;
    var suggestedCalendarItem = null;

    if(remainingDays <= 30 && !hasVerification){
      var testDate = new Date(now.getTime() + Math.min(remainingDays - 3, 14) * 24 * 60 * 60 * 1000);
      if(testDate < now) testDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
      var testDateKey = testDate.toISOString().slice(0, 10);
      gapWarning = 'D-' + remainingDays + ' 시점이나 실전 검증(모의고사/테스트) 일정이 비어 있어 후반부 병목 위험이 있습니다.';
      suggestedCalendarItem = {
        title: (goal ? goal.title : '목표') + ' 실전 중간 점검 및 테스트',
        date: testDateKey,
        time: '14:00',
        durationMinutes: 60,
        note: 'AI 추천: 가상 D-Day 레일 기반 실전 검증 세션'
      };
    }

    return {
      phases: phases,
      currentPhase: currentPhase,
      totalSpanDays: totalSpanDays,
      elapsedDays: elapsedDays,
      remainingDays: remainingDays,
      progressRatio: progressRatio,
      gapWarning: gapWarning,
      suggestedCalendarItem: suggestedCalendarItem
    };
  }

  // ---------- 2. 상태 기억 체인 (Memory Chain - 7일 롤링 TTL) ----------
  var MemoryChain = {
    cleanExpiredAdvice: function(history, nowInput){
      var now = nowInput ? new Date(nowInput).getTime() : Date.now();
      if(!Array.isArray(history)) return [];
      return history.filter(function(item){
        if(!item || !item.createdAt) return false;
        var itemTime = new Date(item.createdAt).getTime();
        return (now - itemTime) <= TTL_MS;
      });
    },

    saveAdvice: function(storage, item, nowInput){
      if(!storage) return null;
      var now = nowInput ? new Date(nowInput) : new Date();
      storage.adviceHistory = MemoryChain.cleanExpiredAdvice(storage.adviceHistory, now);
      var record = {
        id: 'adv_' + Math.random().toString(36).slice(2, 9),
        goalId: item.goalId || null,
        goalTitle: item.goalTitle || '',
        actionSuggested: item.actionSuggested || '',
        verdict: item.verdict || '실행 권고',
        mode: item.mode || 'default',
        createdAt: now.toISOString()
      };
      storage.adviceHistory.push(record);
      return record;
    },

    getLastAdvice: function(storage, goalId, nowInput){
      if(!storage || !Array.isArray(storage.adviceHistory)) return null;
      var valid = MemoryChain.cleanExpiredAdvice(storage.adviceHistory, nowInput);
      storage.adviceHistory = valid;
      for(var i = valid.length - 1; i >= 0; i--){
        if(!goalId || valid[i].goalId === goalId){
          return valid[i];
        }
      }
      return null;
    }
  };

  // ---------- 3. 상투어 정제 및 가드레일 ----------
  function filterNegativeWords(text){
    if(typeof text !== 'string') return '';
    var cleaned = text;
    NEGATIVE_PATTERNS.forEach(function(pattern){
      cleaned = cleaned.replace(pattern, '');
    });
    // 빈자리 자연스럽게 다듬기
    cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();
    return cleaned;
  }

  // ---------- 4. 향상된 로컬 피드백 생성기 (Offline / Fallback) ----------
  function generateEnhancedLocalFeedback(params){
    var goal = params.goal || { title: '나의 일상 성장', milestones: [] };
    var text = (params.text || '').trim();
    var microChips = params.microChips || {};
    var mode = params.mode || 'default';
    var lastAdvice = params.lastAdvice || null;
    var rail = computeVirtualRail(goal, goal.dueDate);

    var conditionLabel = microChips.condition ? (microChips.condition === 'tired' ? '지친 상태' : (microChips.condition === 'good' ? '좋은 컨디션' : '평상시 컨디션')) : null;
    var sessionFeelLabel = microChips.sessionFeel ? (microChips.sessionFeel === 'proud' ? '뿌듯함' : (microChips.sessionFeel === 'barely' ? '간신히 버팀' : '아쉬움')) : null;
    var durationLabel = microChips.duration ? (microChips.duration === 'short' ? '15분 이하' : (microChips.duration === 'long' ? '1시간 이상' : '30분')) : null;

    var factInsight = '';
    var continuity = '';
    var nextAction = '';
    var verdict = '실행 권고';

    // 초단문 방어
    if(text.length < 15){
      if(sessionFeelLabel === '간신히 버팀' || conditionLabel === '지친 상태'){
        factInsight = conditionLabel + '임에도 포기하지 않고 체크인하여 연속성을 지켜낸 점이 오늘 가장 돋보입니다.';
        verdict = '스트릭 방어';
      } else {
        factInsight = '"' + text + '" 실천으로 오늘의 흐름을 끊지 않고 이어가셨습니다.';
        verdict = '페이스 유지';
      }
      nextAction = '내일은 5분만 일찍 시작하여 1가지 세부 항목에 집중해 보세요.';
    } else {
      factInsight = '오늘 기록에서 구체적인 실행 내용(' + text.slice(0, 30) + '…)과 투입 노력이 명확히 확인됩니다.';
      nextAction = '내일은 오늘 완성한 부분의 결과나 오답을 15분간 재검토하여 머리에 안착시키세요.';
      verdict = '핵심 발견';
    }

    if(lastAdvice && lastAdvice.actionSuggested){
      continuity = '어제 제안드린 [' + lastAdvice.actionSuggested + ']의 흐름을 염두에 두고 실행을 이어가고 계십니다.';
    }

    var comment = factInsight + (continuity ? ' ' + continuity : '') + ' ' + nextAction;
    var calendarAction = null;
    var macroGap = null;

    if(mode === 'medium'){
      comment += ' 최근 주간 리듬을 볼 때, 요일별 피로도를 감안한 회복 세션 안배가 도움이 됩니다.';
    } else if(mode === 'macro'){
      if(rail.gapWarning){
        macroGap = rail.gapWarning;
        comment += ' [30일 로드맵 점검] ' + rail.gapWarning;
      }
      if(rail.suggestedCalendarItem){
        calendarAction = {
          hasSuggestion: true,
          suggestedDate: rail.suggestedCalendarItem.date,
          suggestedTime: rail.suggestedCalendarItem.time || '14:00',
          title: rail.suggestedCalendarItem.title,
          durationMinutes: rail.suggestedCalendarItem.durationMinutes || 60,
          note: rail.suggestedCalendarItem.note || ''
        };
      }
    }

    return {
      verdict: verdict,
      comment: filterNegativeWords(comment),
      factInsight: factInsight,
      continuity: continuity || null,
      nextAction: nextAction,
      mode: mode,
      macroGapWarning: macroGap,
      calendarAction: calendarAction,
      source: 'local_enhanced',
      suggestions: []
    };
  }

  // ---------- 5. HTML 렌더링 헬퍼 ----------
  function renderMicroChipsHtml(selectedChips){
    selectedChips = selectedChips || {};
    var html = '<div class="ai-micro-chip-panel" style="margin:8px 0 12px;padding:10px 12px;background:var(--surface-2, #f7f9fa);border-radius:10px;border:1px solid var(--rule, #e5e8eb);">';
    html += '<div style="font-size:0.75rem;font-weight:700;color:var(--faint, #6b7280);margin-bottom:6px;display:flex;align-items:center;justify-content:space-between;">' +
      '<span>3초 퀵 태그 (선택)</span><span style="font-size:0.6875rem;font-weight:normal;">AI 맞춤 분석에 반영돼요</span></div>';

    // 1행: 컨디션
    html += '<div class="ai-chip-group" style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">' +
      '<span style="font-size:0.6875rem;color:var(--faint, #888);min-width:44px;">컨디션</span><div style="display:flex;gap:4px;flex-wrap:wrap;">';
    MICRO_CHIPS.condition.forEach(function(c){
      var active = selectedChips.condition === c.id;
      html += '<button type="button" class="ai-tag-chip' + (active ? ' active' : '') + '" data-chip-cat="condition" data-chip-id="' + c.id + '" ' +
        'style="border:1px solid ' + (active ? 'var(--primary, #0ea5e9)' : 'var(--rule, #ddd)') + ';background:' + (active ? 'var(--primary-bg, #e0f2fe)' : 'var(--surface, #fff)') + ';' +
        'color:' + (active ? 'var(--primary, #0284c7)' : 'var(--ink, #333)') + ';font-size:0.6875rem;font-weight:' + (active ? '700' : '500') + ';padding:2px 8px;border-radius:14px;cursor:pointer;">' +
        c.label + '</button>';
    });
    html += '</div></div>';

    // 2행: 소요시간
    html += '<div class="ai-chip-group" style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">' +
      '<span style="font-size:0.6875rem;color:var(--faint, #888);min-width:44px;">소요시간</span><div style="display:flex;gap:4px;flex-wrap:wrap;">';
    MICRO_CHIPS.duration.forEach(function(c){
      var active = selectedChips.duration === c.id;
      html += '<button type="button" class="ai-tag-chip' + (active ? ' active' : '') + '" data-chip-cat="duration" data-chip-id="' + c.id + '" ' +
        'style="border:1px solid ' + (active ? 'var(--primary, #0ea5e9)' : 'var(--rule, #ddd)') + ';background:' + (active ? 'var(--primary-bg, #e0f2fe)' : 'var(--surface, #fff)') + ';' +
        'color:' + (active ? 'var(--primary, #0284c7)' : 'var(--ink, #333)') + ';font-size:0.6875rem;font-weight:' + (active ? '700' : '500') + ';padding:2px 8px;border-radius:14px;cursor:pointer;">' +
        c.label + '</button>';
    });
    html += '</div></div>';

    // 3행: 이번기록의 체감
    html += '<div class="ai-chip-group" style="display:flex;align-items:center;gap:6px;">' +
      '<span style="font-size:0.6875rem;color:var(--faint, #888);min-width:44px;">이번 체감</span><div style="display:flex;gap:4px;flex-wrap:wrap;">';
    MICRO_CHIPS.sessionFeel.forEach(function(c){
      var active = selectedChips.sessionFeel === c.id;
      html += '<button type="button" class="ai-tag-chip' + (active ? ' active' : '') + '" data-chip-cat="sessionFeel" data-chip-id="' + c.id + '" ' +
        'style="border:1px solid ' + (active ? 'var(--primary, #0ea5e9)' : 'var(--rule, #ddd)') + ';background:' + (active ? 'var(--primary-bg, #e0f2fe)' : 'var(--surface, #fff)') + ';' +
        'color:' + (active ? 'var(--primary, #0284c7)' : 'var(--ink, #333)') + ';font-size:0.6875rem;font-weight:' + (active ? '700' : '500') + ';padding:2px 8px;border-radius:14px;cursor:pointer;">' +
        c.label + '</button>';
    });
    html += '</div></div>';

    html += '</div>';
    return html;
  }

  function renderModeSelectorHtml(currentMode){
    currentMode = currentMode || 'default';
    var html = '<div class="ai-mode-selector-wrap" style="margin:8px 0 10px;">' +
      '<div style="font-size:0.6875rem;color:var(--faint, #888);margin-bottom:4px;font-weight:600;">피드백 강도 선택</div>' +
      '<div class="ai-mode-btn-row" style="display:flex;gap:6px;width:100%;">';

    ['default', 'medium', 'macro'].forEach(function(mKey){
      var m = FEEDBACK_MODES[mKey];
      var active = currentMode === mKey;
      html += '<button type="button" class="btn btn-sm ai-mode-btn' + (active ? ' active' : '') + '" data-fb-mode="' + mKey + '" ' +
        'style="flex:1;font-size:0.75rem;padding:6px 4px;text-align:center;border-radius:8px;' +
        'border:1px solid ' + (active ? 'var(--primary, #0ea5e9)' : 'var(--rule, #ddd)') + ';' +
        'background:' + (active ? 'var(--primary, #0ea5e9)' : 'var(--surface, #fff)') + ';' +
        'color:' + (active ? '#fff' : 'var(--ink, #333)') + ';font-weight:' + (active ? '700' : '500') + ';cursor:pointer;">' +
        m.label + (m.isDefault ? ' [기본]' : '') +
        '</button>';
    });

    html += '</div></div>';
    return html;
  }

  function renderEnhancedCardContent(fb){
    if(!fb) return '';
    var verdict = fb.verdict || '실행 권고';
    var comment = filterNegativeWords(fb.comment || '');
    var factInsight = fb.factInsight ? filterNegativeWords(fb.factInsight) : '';
    var continuity = fb.continuity ? filterNegativeWords(fb.continuity) : '';
    var nextAction = fb.nextAction ? filterNegativeWords(fb.nextAction) : '';
    var macroGap = fb.macroGapWarning ? filterNegativeWords(fb.macroGapWarning) : '';
    var cal = fb.calendarAction || null;

    var html = '';
    html += '<div class="fb-verdict-badge" style="display:inline-block;padding:2px 8px;border-radius:12px;font-size:0.75rem;font-weight:700;margin-bottom:6px;background:var(--primary-bg, #e0f2fe);color:var(--primary, #0284c7);">' +
      verdict + '</div>';

    if(factInsight){
      html += '<div class="fb-fact-insight" style="font-size:0.875rem;line-height:1.6;color:var(--ink, #1f2937);margin-bottom:6px;">' +
        '<b>💡 팩트 분석:</b> ' + factInsight + '</div>';
    }

    if(continuity){
      html += '<div class="fb-continuity" style="font-size:0.8125rem;line-height:1.5;color:var(--faint, #4b5563);margin-bottom:6px;padding:4px 8px;background:rgba(0,0,0,0.03);border-radius:6px;">' +
        '<b>🔗 어제 조언 연계:</b> ' + continuity + '</div>';
    }

    if(nextAction){
      html += '<div class="fb-next-action" style="font-size:0.875rem;line-height:1.6;color:var(--primary, #0284c7);font-weight:600;margin-bottom:8px;">' +
        '<b>🎯 내일 바로 할 일:</b> ' + nextAction + '</div>';
    } else if(comment && !factInsight){
      html += '<div class="fb-row" style="font-size:0.875rem;line-height:1.6;margin-bottom:8px;">' + comment + '</div>';
    }

    if(macroGap){
      html += '<div class="fb-macro-gap" style="font-size:0.8125rem;line-height:1.5;color:#b45309;background:#fffbeb;border:1px solid #fef3c7;padding:6px 10px;border-radius:8px;margin-bottom:8px;">' +
        '⚠️ <b>30일 일정 사각지대:</b> ' + macroGap + '</div>';
    }

    if(cal && cal.hasSuggestion && cal.suggestedDate){
      html += '<div class="fb-calendar-card" style="margin-top:8px;padding:10px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;">' +
        '<div style="font-size:0.75rem;font-weight:700;color:#15803d;margin-bottom:4px;">🗓️ AI 추천 선제 일정</div>' +
        '<div style="font-size:0.875rem;font-weight:700;color:#166534;">' + (cal.title || '새 일정') + '</div>' +
        '<div style="font-size:0.75rem;color:#15803d;margin:2px 0 8px;">' + cal.suggestedDate + ' ' + (cal.suggestedTime || '14:00') + ' (' + (cal.durationMinutes || 60) + '분)</div>' +
        '<button type="button" class="btn btn-sm btn-primary btn-add-sched-ai" ' +
          'data-sched-title="' + (cal.title || '') + '" ' +
          'data-sched-date="' + cal.suggestedDate + '" ' +
          'data-sched-time="' + (cal.suggestedTime || '14:00') + '" ' +
          'style="width:100%;font-size:0.8125rem;padding:6px;background:#16a34a;border:none;color:#fff;border-radius:6px;cursor:pointer;font-weight:700;">' +
          '내 캘린더에 바로 추가' +
        '</button>' +
      '</div>';
    }

    return html;
  }

  // 모듈 퍼블릭 노출
  var OurgoalAIFeedback = {
    MICRO_CHIPS: MICRO_CHIPS,
    FEEDBACK_MODES: FEEDBACK_MODES,
    NEGATIVE_PATTERNS: NEGATIVE_PATTERNS,
    TTL_MS: TTL_MS,
    computeVirtualRail: computeVirtualRail,
    MemoryChain: MemoryChain,
    filterNegativeWords: filterNegativeWords,
    generateEnhancedLocalFeedback: generateEnhancedLocalFeedback,
    renderMicroChipsHtml: renderMicroChipsHtml,
    renderModeSelectorHtml: renderModeSelectorHtml,
    renderEnhancedCardContent: renderEnhancedCardContent
  };

  if(typeof module !== 'undefined' && module.exports){
    module.exports = OurgoalAIFeedback;
  }
  if(typeof window !== 'undefined'){
    window.OurgoalAIFeedback = OurgoalAIFeedback;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);