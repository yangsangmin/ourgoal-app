module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  var body = req.body || {};
  var goalTitle = body.goalTitle;
  var milestones = Array.isArray(body.milestones) ? body.milestones : [];
  var text = body.text;
  var theme = body.theme;
  var themeHierarchy = body.themeHierarchy || null;
  var customPrompt = typeof body.customPrompt === 'string' ? body.customPrompt.trim().slice(0, 2000) : '';
  var upcomingSchedules = Array.isArray(body.upcomingSchedules) ? body.upcomingSchedules : [];

  // 신규 고도화 파라미터 (TASK-ES-042)
  var mode = body.mode || 'default'; // 'default' | 'medium' | 'macro'
  var microChips = body.microChips || {}; // { condition, duration, sessionFeel }
  var lastAdvice = body.lastAdvice || null; // { actionSuggested, verdict, createdAt }
  var virtualRail = body.virtualRail || null; // { currentPhase, remainingDays, gapWarning, suggestedCalendarItem }

  if (!goalTitle || !text) {
    res.status(400).json({ error: 'goalTitle and text are required' });
    return;
  }

  // API 키 결정: 1) 클라이언트 전달 Gemini키 2) 서버 GEMINI_API_KEY 3) 서버 ANTHROPIC_API_KEY
  var clientGeminiKey = (typeof body.geminiKey === 'string' && body.geminiKey.trim()) ? body.geminiKey.trim() : null;
  var geminiApiKey = clientGeminiKey || process.env.GEMINI_API_KEY;
  var anthropicApiKey = process.env.ANTHROPIC_API_KEY;

  var THEME_PROMPTS = {
    mind: '이 기록은 [심리상태] 테마입니다. 마인드셋 회복과 스트레스 완화 관점에서 실행 가능한 심리 루틴을 조언하세요.',
    study: '이 기록은 [공부기록] 테마입니다. 학습 효율성, 개념 체화, 복습 타이밍 관점에서 구체적인 액션을 제시하세요.',
    business: '이 기록은 [사업기록] 테마입니다. 업무 생산성, 비즈니스 성과, 마일스톤 진척도 관점에서 전략적 피드백을 제공하세요.',
    schedule: '이 기록은 [약속기록] 테마입니다. 대인 관계, 네트워킹, 시간 관리 관점의 실질적 조언을 제공하세요.',
    workout: '이 기록은 [운동기록] 테마입니다. 신체 컨디션, 부상 방지, 점진적 과부하 관점에서 지속 가능한 피드백을 제공하세요.'
  };

  var dynamicThemeLine = '';
  if (themeHierarchy && typeof themeHierarchy === 'object') {
    var dMajor = themeHierarchy.majorLabel || themeHierarchy.major || '';
    var dSub = themeHierarchy.subLabel || themeHierarchy.sub || '';
    var dLeaf = themeHierarchy.leafLabel || themeHierarchy.customName || '';
    if (dLeaf || dMajor) {
      dynamicThemeLine = '사용자가 선택한 세부 활동 테마는 [' + (dMajor ? dMajor + ' > ' : '') + (dSub ? dSub + ' > ' : '') + dLeaf + '] 입니다. 이 영역의 전문 코칭 지침을 적용하세요.';
    }
  }

  var themeBlock = dynamicThemeLine
    ? ('[기록 테마 코칭 지침]\n' + dynamicThemeLine + '\n\n')
    : ((theme && THEME_PROMPTS[theme]) ? ('[기록 테마 코칭 지침]\n' + THEME_PROMPTS[theme] + '\n\n') : '');

  var personaBlock = customPrompt ? ('[페르소나 지침]\n' + customPrompt + '\n\n') : '';
  var roleLine = customPrompt
    ? '당신은 위 페르소나 지침에 따라 행동하는 목표 달성 페이스메이커입니다.'
    : '당신은 데이터와 팩트에 기반해 솔직하고 실질적인 피드백을 주는 전문 목표 페이스메이커입니다.';

  // 마이크로 칩 컨텍스트
  var microChipBlock = '';
  var cMap = { good: '좋음', normal: '보통', tired: '지침' };
  var dMap = { short: '15분 이하', medium: '30분', long: '1시간 이상' };
  var sMap = { proud: '뿌듯함', barely: '간신히 버팀', regret: '아쉬움' };
  var chipParts = [];
  if (microChips.condition && cMap[microChips.condition]) chipParts.push('컨디션: ' + cMap[microChips.condition]);
  if (microChips.duration && dMap[microChips.duration]) chipParts.push('소요시간: ' + dMap[microChips.duration]);
  if (microChips.sessionFeel && sMap[microChips.sessionFeel]) chipParts.push('이번기록의 체감: ' + sMap[microChips.sessionFeel]);
  if (chipParts.length > 0) {
    microChipBlock = '[사용자가 선택한 3초 퀵 태그]\n' + chipParts.join(' | ') + '\n\n';
  }

  // 상태 기억 체인 컨텍스트
  var memoryBlock = '';
  if (lastAdvice && lastAdvice.actionSuggested) {
    memoryBlock = '[어제 AI가 제안했던 액션]\n"' + lastAdvice.actionSuggested + '"\n' +
      '지침: 사용자가 오늘 기록에서 이를 의식했거나 반영했는지 대조하고, 미반영 시에도 비난 없이 자연스럽게 다음 스텝으로 연결하세요.\n\n';
  }

  // 거시 일정 & 가상 D-Day 레일 컨텍스트
  var macroBlock = '';
  if (mode === 'macro' || (virtualRail && virtualRail.remainingDays !== undefined)) {
    var vPhase = (virtualRail && virtualRail.currentPhase && virtualRail.currentPhase.name) ? virtualRail.currentPhase.name : '진행중';
    var vRem = (virtualRail && virtualRail.remainingDays !== undefined) ? virtualRail.remainingDays : 30;
    var vGap = (virtualRail && virtualRail.gapWarning) ? virtualRail.gapWarning : '특별한 누락 없음';
    macroBlock = '[가상 D-Day 레일 및 거시 상태]\n' +
      '- 현재 페이즈: ' + vPhase + ' (D-' + vRem + ')\n' +
      '- 감지된 사각지대/병목: ' + vGap + '\n';

    if (upcomingSchedules.length > 0) {
      var schedListStr = upcomingSchedules.map(function (s) {
        return '- [' + (s.dday || '') + ' / ' + (s.date || '') + '] ' + (s.title || '') + ' (' + (s.category || '일반') + ')';
      }).join('\n');
      macroBlock += '- 향후 30일 주요 일정:\n' + schedListStr + '\n';
    }
    macroBlock += '★ 중요(엄격 준수): 단, 관련없는 피드백을 위한 피드백은 절대 금지합니다. 기록과 무관하고 급하지도 않은 일정을 억지로 언급하거나 불필요한 참견을 하지 마세요.\n' +
      '지침: 30일 목표 관점에서 사용자가 놓치고 있는 선행 일정이나 대비 사항을 정밀 진단하고, 필요 시 calendar_action에 추천 일정을 구체적으로 작성하세요.\n\n';
  }

  // 모드별 지침
  var modeInstruction = '';
  if (mode === 'default') {
    modeInstruction = '[모드: 기본 피드백]\n' +
      '팩트 분석(1문장) + 어제 연계(1문장, 있을시) + 내일 당장 실행할 딱 1가지 행동(1문장)으로 총 3문장 이내로 극도로 명료하게 작성하세요.';
  } else if (mode === 'medium') {
    modeInstruction = '[모드: 중간 피드백]\n' +
      '최근 페이스 추이와 주간 루틴 마찰점 분석을 포함하여 5~6문장으로 구체적인 보완 가이드를 제공하세요.';
  } else {
    modeInstruction = '[모드: 장기간 고려 피드백]\n' +
      'D-Day 목표 가상 레일과 향후 30일 일정을 대조하여 사각지대를 짚고, calendar_action 추천 일정을 포함한 심층 전략 리포트를 제공하세요.';
  }

  var negativeRules =
    '[절대 금지 규칙 - 위반 시 무효 처리]\n' +
    '1. "도움됨", "도움이 되었기를 바랍니다", "상투적 칭찬" 단어 사용 절대 금지.\n' +
    '2. "오늘의 목표를 향한 의미 있는 실천이었습니다" 등 영혼 없는 템플릿 문구 절대 금지.\n' +
    '3. "참 잘하셨습니다", "수고 많으셨습니다", "꾸준히 하시면" 등 의례적인 치어리딩 문구 금지.\n' +
    '4. 반드시 유저의 실제 기록 텍스트와 퀵 태그에 담긴 사실(Fact)을 구체적으로 인용하여 코칭할 것.';

  var prompt = themeBlock + personaBlock + roleLine + '\n\n' +
    negativeRules + '\n\n' +
    microChipBlock + memoryBlock + macroBlock + modeInstruction + '\n\n' +
    '[사용자의 목표]\n최종 목표: ' + goalTitle + '\n\n' +
    '[마일스톤/할 일 목록 - JSON]\n' + JSON.stringify(milestones) + '\n\n' +
    '[방금 남긴 기록]\n"' + text + '"\n\n' +
    '아래 순수 JSON 규격으로만 응답하세요. 다른 텍스트나 코드블록 없이 순수 JSON만 출력하세요.\n' +
    '{\n' +
    '  "verdict": "핵심 발견 | 실행 권고 | 페이스 유지 | 스트릭 방어 | 루틴 보완 중 상황에 맞는 하나 (도움됨 절대 금지)",\n' +
    '  "fact_insight": "이번 기록에서 포착한 구체적 팩트 분석 1문장",\n' +
    '  "continuity": "어제 조언에 대한 반영 확인 및 연결 1문장 (해당 없으면 null)",\n' +
    '  "next_action": "내일 당장 실행할 구체적 행동 1문장",\n' +
    '  "macro_gap": "장기 모드 전용: 30일 목표 대비 누락/사각지대 경고 (기본/중간 모드는 null)",\n' +
    '  "calendar_action": {\n' +
    '    "has_suggestion": true 또는 false,\n' +
    '    "suggested_date": "YYYY-MM-DD",\n' +
    '    "suggested_time": "14:00",\n' +
    '    "title": "일정 제목",\n' +
    '    "duration_minutes": 60,\n' +
    '    "note": "추천 사유"\n' +
    '  },\n' +
    '  "comment": "위 내용들을 자연스럽게 엮은 명쾌한 피드백 본문 (상투어 배제)",\n' +
    '  "suggestions": []\n' +
    '}';

  function cleanNegativePatterns(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/도움\s*됨/gi, '실행 권고')
      .replace(/도움이\s*되었기를\s*바랍니다/gi, '')
      .replace(/오늘의\s*목표를\s*향한\s*의미\s*있는\s*실천이[^\.]*\.?/gi, '')
      .replace(/참\s*잘하셨습니다/gi, '')
      .replace(/수고\s*많으셨습니다/gi, '')
      .replace(/앞으로도\s*꾸준히\s*하시면[^\.]*\.?/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  try {
    var parsed = null;
    var providerUsed = '';

    if (geminiApiKey) {
      var geminiModels = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-flash-latest'];
      for (var gi = 0; gi < geminiModels.length; gi++) {
        var gModel = geminiModels[gi];
        try {
          var geminiRes = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + gModel + ':generateContent?key=' + encodeURIComponent(geminiApiKey), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.2,
                responseMimeType: 'application/json'
              }
            })
          });

          if (geminiRes.ok) {
            var geminiData = await geminiRes.json();
            var rawText = ((geminiData.candidates || [])[0] || {}).content && geminiData.candidates[0].content.parts
              ? geminiData.candidates[0].content.parts.map(function (p) { return p.text || ''; }).join('\n')
              : '';
            if (rawText) {
              var cleanText = rawText.replace(/```json|```/g, '').trim();
              parsed = JSON.parse(cleanText);
              providerUsed = 'gemini';
              break;
            }
          }
        } catch (geminiErr) {
          console.warn('Gemini (' + gModel + ') failed:', geminiErr.message);
        }
      }
    }

    if (!parsed && anthropicApiKey) {
      var anthropicModels = ['claude-3-7-sonnet-20250219', 'claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest'];
      for (var mi = 0; mi < anthropicModels.length; mi++) {
        var aModel = anthropicModels[mi];
        try {
          var anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': anthropicApiKey,
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model: aModel,
              max_tokens: 800,
              messages: [{ role: 'user', content: prompt }]
            })
          });

          if (anthropicRes.ok) {
            var anthropicData = await anthropicRes.json();
            var rawAnthropic = (anthropicData.content || []).map(function (b) { return b.type === 'text' ? b.text : ''; }).join('\n');
            var cleanAnthropic = rawAnthropic.replace(/```json|```/g, '').trim();
            parsed = JSON.parse(cleanAnthropic);
            providerUsed = 'claude';
            break;
          }
        } catch (ae) {}
      }
    }

    // 서버 폴백: AI 미설정 또는 실패 시에도 스마트한 팩트 기반 피드백 생성
    if (!parsed || !parsed.verdict) {
      var isTired = microChips.condition === 'tired' || microChips.sessionFeel === 'barely';
      var fallbackVerdict = isTired ? '스트릭 방어' : (text.length < 20 ? '페이스 유지' : '핵심 발견');
      var fallbackFact = text.length < 20
        ? '"' + text + '" 실천으로 오늘의 흐름을 놓치지 않고 완주하셨습니다.'
        : '오늘 기록된 구체적인 실행 내용(' + text.slice(0, 35) + '…)과 집중도가 돋보입니다.';
      var fallbackAction = '내일은 오늘 진행한 항목의 핵심 요약이나 오답 1가지를 먼저 짚고 넘어가세요.';

      var fallbackComment = fallbackFact + ' ' + fallbackAction;
      if (lastAdvice && lastAdvice.actionSuggested) {
        fallbackComment = '어제 제안드린 [' + lastAdvice.actionSuggested + ']에 이어 ' + fallbackComment;
      }

      parsed = {
        verdict: fallbackVerdict,
        fact_insight: fallbackFact,
        continuity: lastAdvice ? ('어제 제안: ' + lastAdvice.actionSuggested) : null,
        next_action: fallbackAction,
        macro_gap: (virtualRail && virtualRail.gapWarning) ? virtualRail.gapWarning : null,
        calendar_action: (virtualRail && virtualRail.suggestedCalendarItem) ? {
          has_suggestion: true,
          suggested_date: virtualRail.suggestedCalendarItem.date,
          suggested_time: virtualRail.suggestedCalendarItem.time || '14:00',
          title: virtualRail.suggestedCalendarItem.title,
          duration_minutes: virtualRail.suggestedCalendarItem.durationMinutes || 60,
          note: virtualRail.suggestedCalendarItem.note || ''
        } : null,
        comment: fallbackComment,
        suggestions: []
      };
      providerUsed = 'local_smart';
    }

    // 상투어 정제 가드레일 적용
    parsed.verdict = cleanNegativePatterns(parsed.verdict) || '실행 권고';
    if (parsed.verdict === '도움됨') parsed.verdict = '핵심 발견';
    parsed.comment = cleanNegativePatterns(parsed.comment || '');
    if (parsed.fact_insight) parsed.fact_insight = cleanNegativePatterns(parsed.fact_insight);
    if (parsed.next_action) parsed.next_action = cleanNegativePatterns(parsed.next_action);

    // 하위 호환 필드 매핑
    parsed.factInsight = parsed.fact_insight || parsed.factInsight || null;
    parsed.nextAction = parsed.next_action || parsed.nextAction || null;
    parsed.macroGapWarning = parsed.macro_gap || parsed.macroGapWarning || null;
    parsed.calendarAction = parsed.calendar_action || parsed.calendarAction || null;

    if (!Array.isArray(parsed.suggestions)) {
      parsed.suggestions = [];
    }
    parsed.provider = providerUsed;

    res.status(200).json(parsed);
  } catch (e) {
    res.status(500).json({ error: e.message || 'unknown error' });
  }
};