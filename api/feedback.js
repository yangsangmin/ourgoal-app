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
  var customPrompt = typeof body.customPrompt === 'string' ? body.customPrompt.trim().slice(0, 2000) : '';
  var upcomingSchedules = Array.isArray(body.upcomingSchedules) ? body.upcomingSchedules : [];
  if (!goalTitle || !text) {
    res.status(400).json({ error: 'goalTitle and text are required' });
    return;
  }

  // API 키 결정: 1) 클라이언트 전달 Gemini키 2) 서버 GEMINI_API_KEY 3) 서버 ANTHROPIC_API_KEY
  var clientGeminiKey = (typeof body.geminiKey === 'string' && body.geminiKey.trim()) ? body.geminiKey.trim() : null;
  var geminiApiKey = clientGeminiKey || process.env.GEMINI_API_KEY;
  var anthropicApiKey = process.env.ANTHROPIC_API_KEY;

  if (!geminiApiKey && !anthropicApiKey) {
    res.status(503).json({ error: 'AI API key is not configured on server' });
    return;
  }

  var THEME_PROMPTS = {
    mind: '이 기록은 [심리상태] 테마로 분류되었습니다. 사용자의 감정 상태, 멘탈 회복, 스트레스 관리 관점에서 깊이 공감하고 따뜻한 위로와 마인드셋 회복 조언을 포함하세요.',
    study: '이 기록은 [공부기록] 테마로 분류되었습니다. 학습 효율성, 복습 주기, 지식 습득의 깊이 관점에서 구체적이고 실천적인 학습 피드백을 제공하세요.',
    business: '이 기록은 [사업기록] 테마로 분류되었습니다. 업무 생산성, 비즈니스 성과, 마일스톤 진척도, 우선순위 관리 관점에서 전략적 피드백을 제공하세요.',
    schedule: '이 기록은 [약속기록] 테마로 분류되었습니다. 대인 관계, 네트워킹, 약속 이행 및 시간 관리 관점의 조언을 제공하세요.',
    workout: '이 기록은 [운동기록] 테마로 분류되었습니다. 신체 건강, 운동 루틴의 지속성, 점진적 과부하와 부상 방지 관점에서 활력 넘치는 피드백을 제공하세요.'
  };
  var themeBlock = (theme && THEME_PROMPTS[theme]) ? ('[기록 테마 코칭 지침]\n' + THEME_PROMPTS[theme] + '\n\n') : '';

  var personaBlock = customPrompt ? ('[페르소나 지침]\n' + customPrompt + '\n\n') : '';
  var roleLine = customPrompt
    ? '당신은 위 페르소나 지침에 따라 행동하는 목표 달성 피드백 봇입니다.'
    : '당신은 목표 달성 코치입니다.';

  var schedSection = '';
  if (upcomingSchedules.length > 0) {
    var schedListStr = upcomingSchedules.map(function (s) {
      return '- [' + (s.dday || '') + ' / ' + (s.date || '') + '] ' + (s.title || '') + ' (관련: ' + (s.category || '일반') + ')';
    }).join('\n');
    schedSection = '\n\n[향후 30일간의 다가오는 일정 목록]\n' + schedListStr + '\n\n' +
      '[일정 연계 피드백 지침 - 필수 준수]\n' +
      '1. 사용자의 체크인/기록에 대한 피드백을 기본으로 하되, 위 [향후 30일간의 다가오는 일정 목록]을 함께 검토하세요.\n' +
      '2. 기록과 맥락상 밀접하게 연관되어 있거나(예: 목표 훈련/시험 준비 등), 사용자가 놓치기 쉽고 미리 계획·준비해야 할 임박 일정(D-3~D-7 이내 등)이 있다면 comment 끝에 1~2문장의 다가오는 일정 리마인드와 계획 조언을 자연스럽게 덧붙이세요.\n' +
      '3. ★ 중요(엄격 준수): 단, 관련없는 피드백을 위한 피드백은 절대 금지합니다. 기록과 무관하고 급하지도 않은 일정을 억지로 언급하거나 불필요한 참견을 하지 마세요. 연관된 일정이 없으면 기록에 대한 본연의 코칭에만 집중하세요.';
  }

  var prompt = themeBlock + personaBlock + roleLine + ' 사용자의 목표 구조(마일스톤과 하위 할 일)와 방금 남긴 기록을 보고, ' +
    '그 기록이 목표 달성에 도움이 되는지 판단하고, 이 기록이 실제로 어떤 마일스톤이나 할 일의 진행 상태·결과를 바꿀 만한 확실한 근거가 되는지도 함께 판단하세요.\n\n' +
    '[사용자의 목표]\n최종 목표: ' + goalTitle + '\n\n' +
    '[마일스톤/할 일 목록 - JSON, id는 그대로 참조용. result는 {target,result,unit,note} 형태의 결과 기록칸]\n' + JSON.stringify(milestones) + '\n\n' +
    '[방금 남긴 기록]\n"' + text + '"' +
    schedSection + '\n\n' +
    '아래 JSON 형식으로만 답하세요. 다른 텍스트나 코드블록, 마크다운 없이 순수 JSON만 출력하세요.\n' +
    '근거가 확실하지 않으면 suggestions는 빈 배열로 두세요. 애매하면 절대 추측해서 제안하지 마세요.\n' +
    '특히 기록에 특정 마일스톤·할 일과 관련된 구체적인 계획·방법·루틴(예: "주 3회 루틴 만들기" 항목에 대해 언제·어떻게 운동할지)이 담겨 있다면, ' +
    'field를 "note"로 하고 value에 사용자가 말한 내용을 1~2문장으로 자연스럽게 정리해 그 항목의 결과 메모로 제안하세요(사용자의 표현을 존중하되 군더더기 없이 요약).\n' +
    '{"verdict":"도움됨 또는 애매함 또는 도움안됨 중 하나",' +
    '"comment":"1~2문장의 짧고 솔직한 피드백 (필요 시 자연스러운 다가오는 일정 리마인드 포함, 무관한 강제 피드백 금지)",' +
    '"suggestions":[{"type":"milestone 또는 task","id":"위 목록에 있는 id 값 그대로",' +
    '"field":"status 또는 done 또는 result 또는 note 중 하나",' +
    '"value":"status면 todo/doing/done 중 하나, done이면 true/false, result면 result.target이 이미 있는 항목에 한해 새 숫자값, note면 기록 내용을 정리한 1~2문장 요약",' +
    '"reason":"왜 이렇게 판단했는지 1문장"}]}';

  try {
    var parsed = null;
    var providerUsed = '';

    // 1. Gemini 다중 플래시 모델 캐스케이드 (우선)
    if (geminiApiKey) {
      var geminiModels = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
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
          } else {
            var errBody = await geminiRes.text().catch(function () { return ''; });
            console.warn('Gemini (' + gModel + ') returned error:', geminiRes.status, errBody.slice(0, 150));
            if (geminiRes.status === 429 && gi < geminiModels.length - 1) {
              await new Promise(function (r) { setTimeout(r, 300); });
            }
          }
        } catch (geminiErr) {
          console.warn('Gemini (' + gModel + ') failed:', geminiErr.message);
        }
      }
    }

    // 2. Anthropic 사용 (Gemini 미설정 또는 실패 시 폴백)
    if (!parsed && anthropicApiKey) {
      var anthropicModels = ['claude-3-7-sonnet-20250219', 'claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest', 'claude-3-5-sonnet-20241022'];
      for (var mi = 0; mi < anthropicModels.length; mi++) {
        var aModel = anthropicModels[mi];
        try {
          var headers = {
            'Content-Type': 'application/json',
            'x-api-key': anthropicApiKey,
            'anthropic-version': '2023-06-01'
          };
          if (process.env.ANTHROPIC_WORKSPACE_ID) {
            headers['anthropic-workspace-id'] = process.env.ANTHROPIC_WORKSPACE_ID;
          }
          var anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: headers,
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
          } else {
            var anthropicErr = await anthropicRes.text().catch(function () { return ''; });
            console.warn('Anthropic (' + aModel + ') error:', anthropicRes.status, anthropicErr.slice(0, 150));
          }
        } catch (ae) {}
      }
    }

    if (!parsed || !parsed.verdict) {
      parsed = {
        verdict: '도움됨',
        comment: '오늘의 목표를 향한 의미 있는 실천이 확인되었어요! 꾸준한 기록이 목표 달성의 가장 큰 힘입니다.',
        suggestions: []
      };
      providerUsed = 'local';
    }
    if (!Array.isArray(parsed.suggestions)) {
      parsed.suggestions = [];
    }
    parsed.provider = providerUsed;

    res.status(200).json(parsed);
  } catch (e) {
    res.status(500).json({ error: e.message || 'unknown error' });
  }
};
